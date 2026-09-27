"use strict";
/* Planet look-dev stand — the renderer of the far lens. It is the day's renderer (pl-render.js) line for
   line, but for two things the day fixed for its own lens and the far lens cannot keep: the boxes of the
   two shadow maps and the reach of the hero's pool of light come with the scene (fr-scene.js).
   The passes and the keys of the query (?still, ?t, ?ss, ?off) are the day's. */
(async function () {
  const errs = window.__errs = window.__errs || [];
  const Q = new URLSearchParams(location.search);
  const STILL = Q.get("still") === "1", T0 = parseFloat(Q.get("t") || "3.7"), SS = clamp(parseFloat(Q.get("ss") || "1"), .5, 3);
  const OFF = (Q.get("off") || "").split(",");
  const note = document.getElementById("note"), cv = document.getElementById("cv");
  const fail = (m) => { errs.push(String(m)); note.textContent = String(m); note.style.display = "block"; document.title = "LOOK_FAIL"; };
  if (!navigator.gpu) return fail("WebGPU is not available");
  const adapter = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" });
  if (!adapter) return fail("no GPU adapter");
  const dev = await adapter.requestDevice();
  dev.addEventListener("uncapturederror", e => { if (errs.length < 40) errs.push("GPU " + String(e.error.message).slice(0, 500)); });
  const ctx = cv.getContext("webgpu"), FMT = navigator.gpu.getPreferredCanvasFormat();
  const W = Math.max(16, Math.round(innerWidth * devicePixelRatio * SS)), H = Math.max(16, Math.round(innerHeight * devicePixelRatio * SS));
  cv.width = W; cv.height = H;
  ctx.configure({ device: dev, format: FMT, alphaMode: "opaque" });
  const aspect = W / H;

  async function shader(code, name) {
    const mod = dev.createShaderModule({ code, label: name });
    const info = await mod.getCompilationInfo(), lines = code.split("\n");
    for (const m of info.messages) if (m.type !== "info" && errs.length < 40)
      errs.push(`${name} ${m.type} ${m.lineNum}:${m.linePos} ${m.message} | ${(lines[m.lineNum - 1] || "").trim().slice(0, 140)}`);
    return mod;
  }
  const mScene = await shader(WGSL_SCENE, "scene"), mPost = await shader(WGSL_POST, "post");

  /* ── the scene ── */
  const tb = performance.now();
  const SC = buildScene(aspect);
  const mesh = (d) => {
    const vb = dev.createBuffer({ size: Math.max(52, d.v.byteLength), usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
    const ib = dev.createBuffer({ size: Math.max(12, d.i.byteLength), usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST });
    dev.queue.writeBuffer(vb, 0, d.v); dev.queue.writeBuffer(ib, 0, d.i);
    return { vb, ib, n: d.ni };
  };
  const gScene = mesh(SC.scene), gWater = mesh(SC.water), gWing = mesh(SC.fg);

  /* ── targets ── */
  const HDR = "rgba16float", DEP = "depth32float", SHN = 4096;
  const RT = GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING;
  const tex = (w, h, format, layers) => dev.createTexture({ size: [Math.max(1, w | 0), Math.max(1, h | 0), layers || 1], format, usage: RT });
  const tHdr = tex(W, H, HDR), tDepth = tex(W, H, DEP), tRefl = tex(W / 2, H / 2, HDR), tReflD = tex(W / 2, H / 2, DEP);
  const tWing = tex(W, H, HDR), tWingD = tex(W, H, DEP), tWa = tex(W / 2, H / 2, HDR), tWb = tex(W / 2, H / 2, HDR);
  const tSha = tex(W / 2, H / 2, HDR), tShb = tex(W / 2, H / 2, HDR);
  const tShadow = tex(SHN, SHN, DEP, 2), tDummy = tex(1, 1, HDR);
  const NB = 5, tDown = [], tUp = [];
  for (let k = 0; k < NB; k++) { tDown.push(tex(W >> (k + 1), H >> (k + 1), HDR)); tUp.push(tex(W >> (k + 1), H >> (k + 1), HDR)); }
  const vShadowArr = tShadow.createView({ dimension: "2d-array" });
  const vShadow = [0, 1].map(l => tShadow.createView({ dimension: "2d", baseArrayLayer: l, arrayLayerCount: 1 }));
  const sLin = dev.createSampler({ magFilter: "linear", minFilter: "linear", addressModeU: "clamp-to-edge", addressModeV: "clamp-to-edge" });
  const sCmp = dev.createSampler({ compare: "less", magFilter: "linear", minFilter: "linear" });

  /* ── matrices ── */
  const tf = (m, p) => [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];
  function lightOf(b) {
    const c = [(b[0] + b[1]) / 2, (b[2] + b[3]) / 2, (b[4] + b[5]) / 2], view = m4look(v3.add(c, v3.mul(SUN, 600)), c, [0, 1, 0]);
    const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
    for (let k = 0; k < 8; k++) {
      const p = tf(view, [b[k & 1], b[2 + (k >> 1 & 1)], b[4 + (k >> 2 & 1)]]);
      for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], p[a]); mx[a] = Math.max(mx[a], p[a]); }
    }
    const n = mn[2] - 80, f = mx[2] + 5;
    return { m: m4mul(m4ortho(mn[0], mx[0], mn[1], mx[1], n, f), view), range: f - n };
  }
  /* the second map reaches the hills, so that their woods lay shadows down the slope */
  const L0 = lightOf(SC.box0), L1 = lightOf(SC.box1);
  const proj = m4perspRev(CAM.fov, aspect, CAM.near, CAM.far), view = m4look(CAM.eye, CAM.tgt, [0, 1, 0]);
  const VP = m4mul(proj, view), VPr = m4mul(VP, m4mirrorY(WATER_Y));
  const manY = groundH(MAN_X, 0), hq = [SC.hero[0] - SUN[0] * (manY / SUN[1]), SC.hero[1] - SUN[2] * (manY / SUN[1])];

  /* ── uniforms ── */
  function globals(o) {
    const a = new Float32Array(120);
    a.set(o.vp, 0); a.set(m4inv(o.vp), 16); a.set(o.l0, 32); a.set(L1.m, 48);
    a.set([o.eye[0], o.eye[1], o.eye[2], o.t], 64);
    a.set([SUN[0], SUN[1], SUN[2], WATER_Y], 68);
    a.set([1.55, 1.42, 1.18, 1.0], 72);
    a.set([o.w, o.h, 1 / o.w, 1 / o.h], 76);
    a.set([hq[0], hq[1], SC.pool[0], SC.pool[1]], 80);
    /* misc.y: 1 cuts what lies under the water (the mirror), −1 marks the wing, which takes no shadow map */
    a.set([o.clip ? WATER_Y + .02 : 0, o.clip ? 1 : (o.wing ? -1 : 0), .05 / L0.range, .16 / L1.range], 84);
    SC.lamps.slice(0, 4).forEach((l, k) => { a.set([l.p[0], l.p[1], l.p[2], l.r], 88 + k * 4); a.set([l.c[0], l.c[1], l.c[2], l.k], 104 + k * 4); });
    return a;
  }
  const ubuf = () => dev.createBuffer({ size: 480, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  const uMain = ubuf(), uRefl = ubuf(), uSh0 = ubuf(), uSh1 = ubuf(), uWing = ubuf();
  const uBlobs = dev.createBuffer({ size: 1040, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  dev.queue.writeBuffer(uBlobs, 0, SC.blobs);
  function setGlobals(t) {
    dev.queue.writeBuffer(uMain, 0, globals({ vp: VP, l0: L0.m, eye: CAM.eye, t, w: W, h: H }));
    dev.queue.writeBuffer(uRefl, 0, globals({ vp: VPr, l0: L0.m, eye: [CAM.eye[0], 2 * WATER_Y - CAM.eye[1], CAM.eye[2]], t, w: W / 2, h: H / 2, clip: true }));
    dev.queue.writeBuffer(uSh0, 0, globals({ vp: VP, l0: L0.m, eye: CAM.eye, t, w: SHN, h: SHN }));
    dev.queue.writeBuffer(uSh1, 0, globals({ vp: VP, l0: L1.m, eye: CAM.eye, t, w: SHN, h: SHN }));
    dev.queue.writeBuffer(uWing, 0, globals({ vp: VP, l0: L0.m, eye: CAM.eye, t, w: W, h: H, wing: true }));
  }

  /* ── layouts and pipelines ── */
  const VF = GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, FR = GPUShaderStage.FRAGMENT;
  const blScene = dev.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: VF, buffer: { type: "uniform" } },
      { binding: 1, visibility: FR, texture: { sampleType: "depth", viewDimension: "2d-array" } },
      { binding: 2, visibility: FR, sampler: { type: "comparison" } },
      { binding: 3, visibility: FR, texture: { sampleType: "float" } },
      { binding: 4, visibility: FR, sampler: { type: "filtering" } },
      { binding: 5, visibility: FR, buffer: { type: "uniform" } }]
  });
  const blShadow = dev.createBindGroupLayout({ entries: [{ binding: 0, visibility: VF, buffer: { type: "uniform" } }] });
  const blPost = dev.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: VF, buffer: { type: "uniform" } },
      { binding: 1, visibility: FR, buffer: { type: "uniform" } },
      { binding: 2, visibility: FR, texture: { sampleType: "float" } }, { binding: 3, visibility: FR, texture: { sampleType: "float" } },
      { binding: 4, visibility: FR, texture: { sampleType: "float" } }, { binding: 5, visibility: FR, texture: { sampleType: "float" } },
      { binding: 6, visibility: FR, sampler: { type: "filtering" } },
      { binding: 7, visibility: FR, texture: { sampleType: "depth" } },
      { binding: 8, visibility: FR, texture: { sampleType: "depth", viewDimension: "2d-array" } },
      { binding: 9, visibility: FR, sampler: { type: "comparison" } }]
  });
  const plScene = dev.createPipelineLayout({ bindGroupLayouts: [blScene] }), plShadow = dev.createPipelineLayout({ bindGroupLayouts: [blShadow] });
  const plPost = dev.createPipelineLayout({ bindGroupLayouts: [blPost] });
  const VB = [{
    arrayStride: 52, attributes: [
      { shaderLocation: 0, offset: 0, format: "float32x3" }, { shaderLocation: 1, offset: 12, format: "float32x3" },
      { shaderLocation: 2, offset: 24, format: "float32x3" }, { shaderLocation: 3, offset: 36, format: "float32x4" }]
  }];
  const prim = { topology: "triangle-list", cullMode: "none" };
  const pShadow = dev.createRenderPipeline({
    layout: plShadow, vertex: { module: mScene, entryPoint: "vs_shadow", buffers: VB }, primitive: prim,
    depthStencil: { format: DEP, depthWriteEnabled: true, depthCompare: "less", depthBias: 2, depthBiasSlopeScale: 2.2 }
  });
  const pSky = dev.createRenderPipeline({
    layout: plScene, vertex: { module: mScene, entryPoint: "vs_full" }, fragment: { module: mScene, entryPoint: "fs_sky", targets: [{ format: HDR }] },
    primitive: prim, depthStencil: { format: DEP, depthWriteEnabled: false, depthCompare: "always" }
  });
  const pScene = dev.createRenderPipeline({
    layout: plScene, vertex: { module: mScene, entryPoint: "vs_main", buffers: VB }, fragment: { module: mScene, entryPoint: "fs_main", targets: [{ format: HDR }] },
    primitive: prim, depthStencil: { format: DEP, depthWriteEnabled: true, depthCompare: "greater" }
  });
  const pWater = dev.createRenderPipeline({
    layout: plScene, vertex: { module: mScene, entryPoint: "vs_main", buffers: VB },
    fragment: {
      module: mScene, entryPoint: "fs_water", targets: [{
        format: HDR, blend: { color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha" }, alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha" } }
      }]
    },
    primitive: prim, depthStencil: { format: DEP, depthWriteEnabled: false, depthCompare: "greater" }
  });
  const post = (fs, format) => dev.createRenderPipeline({
    layout: plPost, vertex: { module: mPost, entryPoint: "vs_full" }, fragment: { module: mPost, entryPoint: fs, targets: [{ format }] }, primitive: prim
  });
  const pBlur = post("fs_blur", HDR), pDown = post("fs_down", HDR), pUp = post("fs_up", HDR), pShafts = post("fs_shafts", HDR), pComp = post("fs_comp", FMT);

  const bgScene = (u, refl) => dev.createBindGroup({
    layout: blScene, entries: [{ binding: 0, resource: { buffer: u } }, { binding: 1, resource: vShadowArr }, { binding: 2, resource: sCmp },
    { binding: 3, resource: refl.createView() }, { binding: 4, resource: sLin }, { binding: 5, resource: { buffer: uBlobs } }]
  });
  const bMain = bgScene(uMain, tRefl), bRefl = bgScene(uRefl, tDummy), bWingScene = bgScene(uWing, tDummy);
  const bSh = [uSh0, uSh1].map(u => dev.createBindGroup({ layout: blShadow, entries: [{ binding: 0, resource: { buffer: u } }] }));
  /* a post pass: its own parameters and up to four textures */
  function postPass(a, texs) {
    const u = dev.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    dev.queue.writeBuffer(u, 0, new Float32Array([a[0], a[1], a[2] || 0, a[3] || 0, 0, 0, 0, 0]));
    const t = k => (texs[k] || tDummy).createView();
    return dev.createBindGroup({
      layout: blPost, entries: [{ binding: 0, resource: { buffer: uMain } }, { binding: 1, resource: { buffer: u } },
      { binding: 2, resource: t(0) }, { binding: 3, resource: t(1) }, { binding: 4, resource: t(2) }, { binding: 5, resource: t(3) },
      { binding: 6, resource: sLin }, { binding: 7, resource: tDepth.createView() }, { binding: 8, resource: vShadowArr }, { binding: 9, resource: sCmp }]
    });
  }
  const hw = Math.max(1, W >> 1), hh = Math.max(1, H >> 1);
  const WING_BLUR = .30 * H / 900;
  const bWing = [
    postPass([WING_BLUR / hw, 0], [tWing]), postPass([0, WING_BLUR / hh], [tWa]),
    postPass([WING_BLUR * 2 / hw, 0], [tWb]), postPass([0, WING_BLUR * 2 / hh], [tWa])];
  const bShafts = postPass([OFF.includes("shafts") ? 0 : .0024, 1600, .62, -.06], []);
  const bShBlur = [postPass([1.2 / hw, 0], [tSha]), postPass([0, 1.2 / hh], [tShb])];
  const bDown = [], bUp = [];
  for (let k = 0; k < NB; k++) {
    const src = k ? tDown[k - 1] : tHdr;
    bDown.push(postPass([1 / src.width, 1 / src.height], [src]));
  }
  for (let k = NB - 2; k >= 0; k--) {
    const lo = k === NB - 2 ? tDown[NB - 1] : tUp[k + 1];
    bUp[k] = postPass([1 / lo.width, 1 / lo.height, .62], [lo, tDown[k]]);
  }
  const bComp = postPass([OFF.includes("bloom") ? 0 : .085, .42, 1, .012], [tHdr, tUp[0], tSha, tWb]);

  /* ── the frame ── */
  function draw(t) {
    setGlobals(t);
    const e = dev.createCommandEncoder();
    const geo = (p, g) => { p.setVertexBuffer(0, g.vb); p.setIndexBuffer(g.ib, "uint32"); p.drawIndexed(g.n); };
    for (let l = 0; l < 2; l++) {
      const p = e.beginRenderPass({ colorAttachments: [], depthStencilAttachment: { view: vShadow[l], depthClearValue: 1, depthLoadOp: "clear", depthStoreOp: "store" } });
      p.setPipeline(pShadow); p.setBindGroup(0, bSh[l]); geo(p, gScene); p.end();
    }
    /* off=scene leaves a grey card in place of the world: the wing is judged alone against it */
    const bare = OFF.includes("scene");
    const scenePass = (color, depth, bg, water) => {
      const p = e.beginRenderPass({
        colorAttachments: [{ view: color.createView(), clearValue: { r: .42, g: .5, b: .55, a: 1 }, loadOp: "clear", storeOp: "store" }],
        depthStencilAttachment: { view: depth.createView(), depthClearValue: 0, depthLoadOp: "clear", depthStoreOp: "store" }
      });
      p.setBindGroup(0, bg);
      if (!bare) {
        p.setPipeline(pSky); p.draw(3);
        p.setPipeline(pScene); geo(p, gScene);
        if (water && !OFF.includes("water")) { p.setPipeline(pWater); geo(p, gWater); }
      }
      p.end();
    };
    scenePass(tRefl, tReflD, bRefl, false);
    scenePass(tHdr, tDepth, bMain, true);
    {
      const p = e.beginRenderPass({
        colorAttachments: [{ view: tWing.createView(), clearValue: { r: 0, g: 0, b: 0, a: 0 }, loadOp: "clear", storeOp: "store" }],
        depthStencilAttachment: { view: tWingD.createView(), depthClearValue: 0, depthLoadOp: "clear", depthStoreOp: "store" }
      });
      if (!OFF.includes("wing")) { p.setBindGroup(0, bWingScene); p.setPipeline(pScene); geo(p, gWing); }
      p.end();
    }
    const full = (target, pipe, bg, clear) => {
      const p = e.beginRenderPass({ colorAttachments: [{ view: target, clearValue: clear || { r: 0, g: 0, b: 0, a: 0 }, loadOp: "clear", storeOp: "store" }] });
      p.setPipeline(pipe); p.setBindGroup(0, bg); p.draw(3); p.end();
    };
    full(tWa.createView(), pBlur, bWing[0]); full(tWb.createView(), pBlur, bWing[1]);
    full(tWa.createView(), pBlur, bWing[2]); full(tWb.createView(), pBlur, bWing[3]);
    full(tSha.createView(), pShafts, bShafts);
    full(tShb.createView(), pBlur, bShBlur[0]); full(tSha.createView(), pBlur, bShBlur[1]);
    for (let k = 0; k < NB; k++) full(tDown[k].createView(), pDown, bDown[k]);
    for (let k = NB - 2; k >= 0; k--) full(tUp[k].createView(), pUp, bUp[k]);
    full(ctx.getCurrentTexture().createView(), pComp, bComp);
    dev.queue.submit([e.finish()]);
  }

  window.__look = { w: W, h: H, fmt: FMT, ss: SS, stats: SC.stats, buildMs: Math.round(performance.now() - tb), frames: 0 };
  let n = 0, t0 = performance.now();
  function tick() {
    draw(STILL ? T0 : T0 + (performance.now() - t0) / 1000);
    window.__look.frames = ++n;
    if (STILL && n === 4) {
      dev.queue.onSubmittedWorkDone().then(() => requestAnimationFrame(() => { document.title = errs.length ? "LOOK_DONE_ERR" : "LOOK_DONE"; }));
    }
    if (!STILL || n < 5) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})().catch(e => { (window.__errs = window.__errs || []).push("X " + (e && e.stack || e)); document.title = "LOOK_FAIL"; });
