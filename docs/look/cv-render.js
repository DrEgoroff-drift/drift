"use strict";
/* Cave look-dev stand — the renderer. Passes: the shadow of the lamp (a perspective map), the shadow of the
   day (an upright map over the shafts), the mirror for the lake, the frame, the dark wing with its blur, the
   light in the air, bloom, the final grade.
   ?still=1 draws a fixed moment and sets the title to LOOK_DONE; ?t= the moment; ?ss= supersampling;
   ?off=wing,water,air,bloom,cut,ink,cast,man takes parts out; ?exp= ?amb= ?fogc= ?fog= ?day= ?lamp= ?air= ?airl=
   ?aird= ?airg= turn the knobs. */
(async function () {
  const errs = window.__errs = window.__errs || [];
  const Q = new URLSearchParams(location.search);
  const STILL = Q.get("still") === "1", T0 = parseFloat(Q.get("t") || "3.7"), SS = clamp(parseFloat(Q.get("ss") || "1"), .5, 3);
  const OFF = (Q.get("off") || "").split(",");
  const K = (name, def) => Q.has(name) ? parseFloat(Q.get(name)) : def;
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
  const mScene = await shader(CV_WGSL_SCENE, "scene"), mPost = await shader(CV_WGSL_POST, "post");

  /* ── the scene ── */
  const tb = performance.now();
  const SC = cvScene(aspect);
  const mesh = (d) => {
    const vb = dev.createBuffer({ size: Math.max(52, d.v.byteLength), usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
    const ib = dev.createBuffer({ size: Math.max(12, d.i.byteLength), usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST });
    dev.queue.writeBuffer(vb, 0, d.v); dev.queue.writeBuffer(ib, 0, d.i);
    return { vb, ib, n: d.ni };
  };
  const gRock = mesh(SC.rock), gCut = mesh(SC.cut), gCast = mesh(SC.cast), gMan = mesh(SC.man), gWater = mesh(SC.water), gWing = mesh(SC.wing), gInk = mesh(SC.ink);

  /* ── targets ── */
  const HDR = "rgba16float", DEP = "depth32float", SHN = 4096;
  const RT = GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING;
  const tex = (w, h, format) => dev.createTexture({ size: [Math.max(1, w | 0), Math.max(1, h | 0), 1], format, usage: RT });
  const tHdr = tex(W, H, HDR), tDepth = tex(W, H, DEP), tRefl = tex(W / 2, H / 2, HDR), tReflD = tex(W / 2, H / 2, DEP);
  const tWing = tex(W, H, HDR), tWingD = tex(W, H, DEP), tWa = tex(W / 2, H / 2, HDR), tWb = tex(W / 2, H / 2, HDR);
  const tAir = tex(W / 2, H / 2, HDR), tAirB = tex(W / 2, H / 2, HDR);
  const tLamp = tex(SHN, SHN, DEP), tSun = tex(SHN, SHN, DEP), tDummy = tex(1, 1, HDR);
  const NB = 5, tDown = [], tUp = [];
  for (let k = 0; k < NB; k++) { tDown.push(tex(W >> (k + 1), H >> (k + 1), HDR)); tUp.push(tex(W >> (k + 1), H >> (k + 1), HDR)); }
  const vLamp = tLamp.createView(), vSun = tSun.createView();
  const sLin = dev.createSampler({ magFilter: "linear", minFilter: "linear", addressModeU: "clamp-to-edge", addressModeV: "clamp-to-edge" });
  const sCmp = dev.createSampler({ compare: "less", magFilter: "linear", minFilter: "linear" });

  /* ── matrices ── */
  const tf = (m, p) => [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];
  /* depth 0 at the near plane, 1 at the far one */
  function persp(fovy, asp, n, f) {
    const s = 1 / Math.tan(fovy / 2), o = new Float32Array(16);
    o[0] = s / asp; o[5] = s; o[10] = f / (f - n); o[11] = 1; o[14] = -n * f / (f - n);
    return o;
  }
  /* the day is almost upright: its map looks down, the top of the map is the depth of the cave */
  function dayOf(b) {
    const c = [(b[0] + b[1]) / 2, (b[2] + b[3]) / 2, (b[4] + b[5]) / 2], view = m4look(v3.add(c, v3.mul(SC.sun, 200)), c, [0, 0, 1]);
    const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
    for (let k = 0; k < 8; k++) {
      const p = tf(view, [b[k & 1], b[2 + (k >> 1 & 1)], b[4 + (k >> 2 & 1)]]);
      for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], p[a]); mx[a] = Math.max(mx[a], p[a]); }
    }
    const n = mn[2] - 10, f = mx[2] + 5;
    return { m: m4mul(m4ortho(mn[0], mx[0], mn[1], mx[1], n, f), view), range: f - n };
  }
  const DAY = dayOf([-25, 4, -4, 27, -3.5, 35]);
  const LAMP = m4mul(persp(CV_LAMP.fov, 1, .12, 140), m4look(SC.lamp.p, v3.add(SC.lamp.p, SC.lamp.d), [0, 1, 0]));
  const proj = m4perspRev(CAM.fov, aspect, CAM.near, CAM.far), view = m4look(CAM.eye, CAM.tgt, [0, 1, 0]);
  const VP = m4mul(proj, view), VPr = m4mul(VP, m4mirrorY(CVP.water));

  /* ── uniforms ── */
  const kAmb = K("amb", 1), kFog = K("fogc", 1), kDay = K("day", 1), kLamp = K("lamp", 1);
  /* the air far behind the cut is lighter than the unlit stone near it: what is far is pale */
  const FOGC = [.045 * kFog, .08 * kFog, .12 * kFog];
  function globals(o) {
    const a = new Float32Array(248);
    a.set(o.vp, 0); a.set(m4inv(o.vp), 16); a.set(o.lamp || LAMP, 32); a.set(DAY.m, 48);
    a.set([o.eye[0], o.eye[1], o.eye[2], o.t], 64);
    a.set([SC.lamp.p[0], SC.lamp.p[1], SC.lamp.p[2], CV_LAMP.fall], 68);
    a.set([SC.lamp.d[0], SC.lamp.d[1], SC.lamp.d[2], Math.cos(CV_LAMP.outer)], 72);
    a.set([CV_LAMP.col[0] * kLamp, CV_LAMP.col[1] * kLamp, CV_LAMP.col[2] * kLamp, Math.cos(CV_LAMP.inner)], 76);
    a.set([SC.sun[0], SC.sun[1], SC.sun[2], CVP.water], 80);
    a.set([CV_DAY[0] * kDay, CV_DAY[1] * kDay, CV_DAY[2] * kDay, K("exp", 1)], 84);
    a.set([o.w, o.h, 1 / o.w, 1 / o.h], 88);
    /* misc.y: 1 cuts what lies under the water (the mirror), −1 marks the wing, which takes no lamp and no day */
    a.set([o.clip ? CVP.water + .02 : 0, o.clip ? 1 : (o.wing ? -1 : 0), CVP.cut, K("fog", .022)], 92);
    a.set([.036 * kAmb, .054 * kAmb, .083 * kAmb, CVP.bed], 96);
    a.set([FOGC[0], FOGC[1], FOGC[2], .08 / DAY.range], 100);
    SC.lights.slice(0, 12).forEach((l, k) => { a.set([l.p[0], l.p[1], l.p[2], l.r], 104 + k * 4); a.set([l.c[0], l.c[1], l.c[2], 0], 152 + k * 4); });
    SC.glows.slice(0, 6).forEach((l, k) => { a.set([l.p[0], l.p[1], l.p[2], l.k], 200 + k * 4); a.set([l.c[0], l.c[1], l.c[2], l.s || 1.4], 224 + k * 4); });
    return a;
  }
  const ubuf = () => dev.createBuffer({ size: 992, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  const uMain = ubuf(), uRefl = ubuf(), uShL = ubuf(), uShD = ubuf(), uWing = ubuf();
  function setGlobals(t) {
    dev.queue.writeBuffer(uMain, 0, globals({ vp: VP, eye: CAM.eye, t, w: W, h: H }));
    dev.queue.writeBuffer(uRefl, 0, globals({ vp: VPr, eye: [CAM.eye[0], 2 * CVP.water - CAM.eye[1], CAM.eye[2]], t, w: W / 2, h: H / 2, clip: true }));
    dev.queue.writeBuffer(uShL, 0, globals({ vp: VP, eye: CAM.eye, t, w: SHN, h: SHN }));
    dev.queue.writeBuffer(uShD, 0, globals({ vp: VP, lamp: DAY.m, eye: CAM.eye, t, w: SHN, h: SHN }));
    dev.queue.writeBuffer(uWing, 0, globals({ vp: VP, eye: CAM.eye, t, w: W, h: H, wing: true }));
  }

  /* ── layouts and pipelines ── */
  const VF = GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, FR = GPUShaderStage.FRAGMENT;
  const blScene = dev.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: VF, buffer: { type: "uniform" } },
      { binding: 1, visibility: FR, texture: { sampleType: "depth" } },
      { binding: 2, visibility: FR, texture: { sampleType: "depth" } },
      { binding: 3, visibility: FR, sampler: { type: "comparison" } },
      { binding: 4, visibility: FR, texture: { sampleType: "float" } },
      { binding: 5, visibility: FR, sampler: { type: "filtering" } }]
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
      { binding: 8, visibility: FR, texture: { sampleType: "depth" } },
      { binding: 9, visibility: FR, texture: { sampleType: "depth" } },
      { binding: 10, visibility: FR, sampler: { type: "comparison" } }]
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
  const pBlur = post("fs_blur", HDR), pDown = post("fs_down", HDR), pUp = post("fs_up", HDR), pAir = post("fs_air", HDR), pComp = post("fs_comp", FMT);

  const bgScene = (u, refl, lamp, sun) => dev.createBindGroup({
    layout: blScene, entries: [{ binding: 0, resource: { buffer: u } }, { binding: 1, resource: lamp }, { binding: 2, resource: sun }, { binding: 3, resource: sCmp },
    { binding: 4, resource: refl.createView() }, { binding: 5, resource: sLin }]
  });
  const bMain = bgScene(uMain, tRefl, vLamp, vSun), bRefl = bgScene(uRefl, tDummy, vLamp, vSun), bWingScene = bgScene(uWing, tDummy, vLamp, vSun);
  const bSh = [uShL, uShD].map(u => dev.createBindGroup({ layout: blShadow, entries: [{ binding: 0, resource: { buffer: u } }] }));
  /* a post pass: its own parameters and up to four textures */
  function postPass(a, texs, b) {
    const u = dev.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    b = b || [];
    dev.queue.writeBuffer(u, 0, new Float32Array([a[0], a[1], a[2] || 0, a[3] || 0, b[0] || 0, b[1] || 0, b[2] || 0, b[3] || 0]));
    const t = k => (texs[k] || tDummy).createView();
    return dev.createBindGroup({
      layout: blPost, entries: [{ binding: 0, resource: { buffer: uMain } }, { binding: 1, resource: { buffer: u } },
      { binding: 2, resource: t(0) }, { binding: 3, resource: t(1) }, { binding: 4, resource: t(2) }, { binding: 5, resource: t(3) },
      { binding: 6, resource: sLin }, { binding: 7, resource: tDepth.createView() }, { binding: 8, resource: vLamp }, { binding: 9, resource: vSun }, { binding: 10, resource: sCmp }]
    });
  }
  const hw = Math.max(1, W >> 1), hh = Math.max(1, H >> 1);
  const WING_BLUR = .30 * H / 900;
  const bWing = [
    postPass([WING_BLUR / hw, 0], [tWing]), postPass([0, WING_BLUR / hh], [tWa]),
    postPass([WING_BLUR * 2 / hw, 0], [tWb]), postPass([0, WING_BLUR * 2 / hh], [tWa])];
  const kAir = OFF.includes("air") ? 0 : K("air", 1);
  const bAir = postPass([.036 * kAir * K("airl", 1), .028 * kAir * K("aird", 1), .09 * kAir * K("airg", 1), 0], [], [140, 0, 0, 0]);
  const bAirBlur = [postPass([1.2 / hw, 0], [tAir]), postPass([0, 1.2 / hh], [tAirB])];
  const bDown = [], bUp = [];
  for (let k = 0; k < NB; k++) {
    const src = k ? tDown[k - 1] : tHdr;
    bDown.push(postPass([1 / src.width, 1 / src.height], [src]));
  }
  for (let k = NB - 2; k >= 0; k--) {
    const lo = k === NB - 2 ? tDown[NB - 1] : tUp[k + 1];
    bUp[k] = postPass([1 / lo.width, 1 / lo.height, .62], [lo, tDown[k]]);
  }
  const bComp = postPass([OFF.includes("bloom") ? 0 : .10, .36, 1, .012], [tHdr, tUp[0], tAir, tWb]);

  /* ── the frame ── */
  function draw(t) {
    setGlobals(t);
    const e = dev.createCommandEncoder();
    const geo = (p, g) => { if (!g.n) return; p.setVertexBuffer(0, g.vb); p.setIndexBuffer(g.ib, "uint32"); p.drawIndexed(g.n); };
    const cast = !OFF.includes("cast"), cutOn = !OFF.includes("cut"), manOn = !OFF.includes("man");
    /* the man is not in the map of his own lamp: it sits on his helmet */
    [[vLamp, 0, [gRock, cast && gCast]], [vSun, 1, [gRock, gCut, cast && gCast, manOn && gMan]]].forEach(([v, l, list]) => {
      const p = e.beginRenderPass({ colorAttachments: [], depthStencilAttachment: { view: v, depthClearValue: 1, depthLoadOp: "clear", depthStoreOp: "store" } });
      p.setPipeline(pShadow); p.setBindGroup(0, bSh[l]);
      for (const g of list) if (g) geo(p, g);
      p.end();
    });
    const scenePass = (color, depth, bg, whole) => {
      const p = e.beginRenderPass({
        colorAttachments: [{ view: color.createView(), clearValue: { r: FOGC[0], g: FOGC[1], b: FOGC[2], a: 1 }, loadOp: "clear", storeOp: "store" }],
        depthStencilAttachment: { view: depth.createView(), depthClearValue: 0, depthLoadOp: "clear", depthStoreOp: "store" }
      });
      p.setBindGroup(0, bg);
      p.setPipeline(pScene); geo(p, gRock);
      if (whole && cutOn) { geo(p, gCut); if (!OFF.includes("ink")) geo(p, gInk); }
      if (cast) geo(p, gCast);
      if (manOn) geo(p, gMan);
      if (whole && !OFF.includes("water")) { p.setPipeline(pWater); geo(p, gWater); }
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
    full(tAir.createView(), pAir, bAir);
    full(tAirB.createView(), pBlur, bAirBlur[0]); full(tAir.createView(), pBlur, bAirBlur[1]);
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
