"use strict";
/* Planet look-dev stand, key frame M602 — the renderer of the night page. The order of the day's renderer is
   kept: shadows, the mirror, the frame, the wing, bloom, the last pass. What the night adds: a depth map of
   its own for the lantern, a block of the night's numbers that is refilled on every frame, and the air of the
   yard in the place of the sun's shafts.
   ?still=1&t=3.7&ss=2      a still frame for a shot
   ?off=wing,water,air,…    parts switched off: scene wing water bloom air haze smoke halos stars lamp windows points mist
   every number of the night has a knob: ?key=.14&lamp=.37&win=.5&pts=.6&halo=.6&exp=1 … */
(async function () {
  const errs = window.__errs = window.__errs || [];
  const Q = NT_Q, K = ntK;
  const STILL = Q.get("still") === "1", T0 = parseFloat(Q.get("t") || "3.7"), SS = clamp(parseFloat(Q.get("ss") || "1"), .5, 3);
  const OFF = (Q.get("off") || "").split(","), on = (name) => !OFF.includes(name);
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
  const mScene = await shader(NT_WGSL_SCENE, "scene"), mPost = await shader(NT_WGSL_POST, "post");

  const tb = performance.now();
  const SC = ntScene(aspect), LT = SC.L;
  const mesh = (d) => {
    const vb = dev.createBuffer({ size: Math.max(52, d.v.byteLength), usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
    const ib = dev.createBuffer({ size: Math.max(12, d.i.byteLength), usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST });
    dev.queue.writeBuffer(vb, 0, d.v); dev.queue.writeBuffer(ib, 0, d.i);
    return { vb, ib, n: d.ni };
  };
  const gScene = mesh(SC.scene), gWater = mesh(SC.water), gWing = mesh(SC.fg);

  const HDR = "rgba16float", DEP = "depth32float", SHN = 4096;
  const RT = GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING;
  const tex = (w, h, format, layers) => dev.createTexture({ size: [Math.max(1, w | 0), Math.max(1, h | 0), layers || 1], format, usage: RT });
  const tHdr = tex(W, H, HDR), tDepth = tex(W, H, DEP), tRefl = tex(W / 2, H / 2, HDR), tReflD = tex(W / 2, H / 2, DEP);
  const tWing = tex(W, H, HDR), tWingD = tex(W, H, DEP), tWa = tex(W / 2, H / 2, HDR), tWb = tex(W / 2, H / 2, HDR);
  const tAirA = tex(W / 2, H / 2, HDR), tAirB = tex(W / 2, H / 2, HDR);
  const tShadow = tex(SHN, SHN, DEP, 2), tLamp = tex(SHN, SHN, DEP), tDummy = tex(1, 1, HDR);
  const NB = 5, tDown = [], tUp = [];
  for (let k = 0; k < NB; k++) { tDown.push(tex(W >> (k + 1), H >> (k + 1), HDR)); tUp.push(tex(W >> (k + 1), H >> (k + 1), HDR)); }
  const vShadowArr = tShadow.createView({ dimension: "2d-array" });
  const vShadow = [0, 1].map(l => tShadow.createView({ dimension: "2d", baseArrayLayer: l, arrayLayerCount: 1 }));
  const vLamp = tLamp.createView();
  const sLin = dev.createSampler({ magFilter: "linear", minFilter: "linear", addressModeU: "clamp-to-edge", addressModeV: "clamp-to-edge" });
  const sCmp = dev.createSampler({ compare: "less", magFilter: "linear", minFilter: "linear" });

  /* the light of the giant: two maps laid along its way, as the day lays them along the sun */
  const KEY = NT_SKY.key, keyK = K("key", .14), KEYC = [.35 * keyK, .6 * keyK, keyK];
  const tf = (m, p) => [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];
  function lightOf(b) {
    const c = [(b[0] + b[1]) / 2, (b[2] + b[3]) / 2, (b[4] + b[5]) / 2], view = m4look(v3.add(c, v3.mul(KEY, 600)), c, [0, 1, 0]);
    const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
    for (let k = 0; k < 8; k++) {
      const p = tf(view, [b[k & 1], b[2 + (k >> 1 & 1)], b[4 + (k >> 2 & 1)]]);
      for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], p[a]); mx[a] = Math.max(mx[a], p[a]); }
    }
    const n = mn[2] - 80, f = mx[2] + 5;
    return { m: m4mul(m4ortho(mn[0], mx[0], mn[1], mx[1], n, f), view), range: f - n };
  }
  const L0 = lightOf([-30, 30, -7, 15, -24, 22]), L1 = lightOf([-250, 250, -12, 60, -50, 460]);
  /* the lantern sees the yard through a wide lens of its own */
  function persp(fovy, asp, n, f) {
    const s = 1 / Math.tan(fovy / 2), o = new Float32Array(16);
    o[0] = s / asp; o[5] = s; o[10] = f / (f - n); o[11] = 1; o[14] = -n * f / (f - n);
    return o;
  }
  const lampVP = m4mul(persp(LT.lamp.fov, 1, .15, LT.lamp.reach + 1), m4look(LT.lamp.p, v3.add(LT.lamp.p, LT.lamp.dir), [0, 0, 1]));

  const proj = m4perspRev(CAM.fov, aspect, CAM.near, CAM.far), view = m4look(CAM.eye, CAM.tgt, [0, 1, 0]);
  const VP = m4mul(proj, view), VPr = m4mul(VP, m4mirrorY(WATER_Y));

  function globals(o) {
    const a = new Float32Array(120);
    a.set(o.vp, 0); a.set(m4inv(o.vp), 16); a.set(o.l0, 32); a.set(L1.m, 48);
    a.set([o.eye[0], o.eye[1], o.eye[2], o.t], 64);
    a.set([KEY[0], KEY[1], KEY[2], WATER_Y], 68);
    a.set([KEYC[0], KEYC[1], KEYC[2], K("exp", 1)], 72);
    a.set([o.w, o.h, 1 / o.w, 1 / o.h], 76);
    a.set([SC.man[0], SC.man[2], 12, 26], 80);
    /* misc.y: 1 cuts what lies under the water (the mirror), −1 marks the wing, which takes no shadow map */
    a.set([o.clip ? WATER_Y + .02 : 0, o.clip ? 1 : (o.wing ? -1 : 0), .05 / L0.range, .16 / L1.range], 84);
    return a;
  }
  /* the numbers of the night; the beacon breathes, so they are written anew for every frame */
  function night(t) {
    const a = new Float32Array(404), lamp = LT.lamp;
    const breath = (d) => 1 - (d || 0) * (.5 - .5 * Math.sin(t * NT_BREATH.rate + NT_BREATH.phase));
    const put = (at, v, w) => { a[at] = v[0]; a[at + 1] = v[1]; a[at + 2] = v[2]; a[at + 3] = w || 0; };
    a.set(lampVP, 0);
    put(16, lamp.p, lamp.reach);
    put(20, lamp.dir, Math.cos(lamp.outer));
    put(24, v3.mul(lamp.col, on("lamp") ? lamp.power * K("lamp", .37) : 0), Math.cos(lamp.inner));
    put(28, v3.mul([.010, .017, .032], K("amb", 1)), on("mist") ? K("mist", .016) : 0);
    put(32, [.045, .078, .110], 1.8);
    put(36, NT_SKY.giant, NT_SKY.giantR);
    put(40, NT_SKY.pole, K("rlight", .42));
    put(44, NT_SKY.gsun, K("glight", .5));
    put(48, NT_SKY.sunk, K("after", 1));
    put(52, NT_SKY.bandPole, K("band", .05));
    put(56, [on("stars") ? K("stars", 1) : 0, K("grow", .15), on("haze") ? K("haze", .014) : 0], on("smoke") ? K("smoke", .7) : 0);
    put(60, LT.flue, K("drift", 1));
    put(64, [-12, 4, 34], K("lbias", .0045));
    put(68, [-24, 0, -6], K("ncol", .45));
    put(72, [0, 9, 9], K("wingk", .15));
    const ck = on("windows") ? LT.cookies.slice(0, 6) : [], wk = K("win", .5);
    ck.forEach((c, k) => { put(76 + k * 4, c.p, c.power * wk); put(100 + k * 4, c.c, c.hw); put(124 + k * 4, c.R, c.hh); put(148 + k * 4, c.col, c.nx); });
    const pt = on("points") ? LT.points.slice(0, 12) : [], pk = K("pts", .6);
    pt.forEach((p, k) => { put(172 + k * 4, p.p, p.r); put(220 + k * 4, v3.mul(p.c, p.k * pk * breath(p.breathe)), p.even); });
    const hl = on("halos") ? LT.halos.slice(0, 16) : [], hk = K("halo", .6);
    hl.forEach((h, k) => { put(268 + k * 4, h.p, h.k * hk * breath(h.breathe)); put(332 + k * 4, h.c, h.s); });
    a[396] = ck.length; a[397] = pt.length; a[398] = hl.length; a[399] = K("gair", .28);
    put(400, [K("hcl", 0), K("mauve", 1), K("teal", 1)], 0);
    return a;
  }
  const ubuf = (size) => dev.createBuffer({ size: size || 480, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  const uMain = ubuf(), uRefl = ubuf(), uSh0 = ubuf(), uSh1 = ubuf(), uShL = ubuf(), uWing = ubuf(), uNight = ubuf(1616);
  const uBlobs = ubuf(1040);
  dev.queue.writeBuffer(uBlobs, 0, SC.blobs);
  function setGlobals(t) {
    dev.queue.writeBuffer(uMain, 0, globals({ vp: VP, l0: L0.m, eye: CAM.eye, t, w: W, h: H }));
    dev.queue.writeBuffer(uRefl, 0, globals({ vp: VPr, l0: L0.m, eye: [CAM.eye[0], 2 * WATER_Y - CAM.eye[1], CAM.eye[2]], t, w: W / 2, h: H / 2, clip: true }));
    dev.queue.writeBuffer(uSh0, 0, globals({ vp: VP, l0: L0.m, eye: CAM.eye, t, w: SHN, h: SHN }));
    dev.queue.writeBuffer(uSh1, 0, globals({ vp: VP, l0: L1.m, eye: CAM.eye, t, w: SHN, h: SHN }));
    dev.queue.writeBuffer(uShL, 0, globals({ vp: VP, l0: lampVP, eye: CAM.eye, t, w: SHN, h: SHN }));
    dev.queue.writeBuffer(uWing, 0, globals({ vp: VP, l0: L0.m, eye: CAM.eye, t, w: W, h: H, wing: true }));
    dev.queue.writeBuffer(uNight, 0, night(t));
  }

  const VF = GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, FR = GPUShaderStage.FRAGMENT;
  const blScene = dev.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: VF, buffer: { type: "uniform" } },
      { binding: 1, visibility: FR, texture: { sampleType: "depth", viewDimension: "2d-array" } },
      { binding: 2, visibility: FR, sampler: { type: "comparison" } },
      { binding: 3, visibility: FR, texture: { sampleType: "float" } },
      { binding: 4, visibility: FR, sampler: { type: "filtering" } },
      { binding: 5, visibility: FR, buffer: { type: "uniform" } },
      { binding: 6, visibility: FR, buffer: { type: "uniform" } },
      { binding: 7, visibility: FR, texture: { sampleType: "depth" } }]
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
      { binding: 9, visibility: FR, sampler: { type: "comparison" } },
      { binding: 10, visibility: FR, buffer: { type: "uniform" } },
      { binding: 11, visibility: FR, texture: { sampleType: "depth" } }]
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
    layout: plScene, vertex: { module: mScene, entryPoint: "vs_full" }, fragment: { module: mScene, entryPoint: "fs_nsky", targets: [{ format: HDR }] },
    primitive: prim, depthStencil: { format: DEP, depthWriteEnabled: false, depthCompare: "always" }
  });
  const pScene = dev.createRenderPipeline({
    layout: plScene, vertex: { module: mScene, entryPoint: "vs_main", buffers: VB }, fragment: { module: mScene, entryPoint: "fs_nmain", targets: [{ format: HDR }] },
    primitive: prim, depthStencil: { format: DEP, depthWriteEnabled: true, depthCompare: "greater" }
  });
  const pWater = dev.createRenderPipeline({
    layout: plScene, vertex: { module: mScene, entryPoint: "vs_main", buffers: VB },
    fragment: { module: mScene, entryPoint: "fs_nwater", targets: [{ format: HDR, blend: { color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha" }, alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha" } } }] },
    primitive: prim, depthStencil: { format: DEP, depthWriteEnabled: false, depthCompare: "greater" }
  });
  const post = (fs, format) => dev.createRenderPipeline({ layout: plPost, vertex: { module: mPost, entryPoint: "vs_full" }, fragment: { module: mPost, entryPoint: fs, targets: [{ format }] }, primitive: prim });
  const pBlur = post("fs_blur", HDR), pDown = post("fs_down", HDR), pUp = post("fs_up", HDR), pAir = post("fs_air", HDR), pComp = post("fs_ncomp", FMT);

  const bgScene = (u, refl) => dev.createBindGroup({
    layout: blScene, entries: [{ binding: 0, resource: { buffer: u } }, { binding: 1, resource: vShadowArr }, { binding: 2, resource: sCmp },
    { binding: 3, resource: refl.createView() }, { binding: 4, resource: sLin }, { binding: 5, resource: { buffer: uBlobs } },
    { binding: 6, resource: { buffer: uNight } }, { binding: 7, resource: vLamp }]
  });
  const bMain = bgScene(uMain, tRefl), bRefl = bgScene(uRefl, tDummy), bWingScene = bgScene(uWing, tDummy);
  const bSh = [uSh0, uSh1, uShL].map(u => dev.createBindGroup({ layout: blShadow, entries: [{ binding: 0, resource: { buffer: u } }] }));
  function postPass(a, texs) {
    const u = dev.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    dev.queue.writeBuffer(u, 0, new Float32Array([a[0], a[1], a[2] || 0, a[3] || 0, 0, 0, 0, 0]));
    const t = k => (texs[k] || tDummy).createView();
    return dev.createBindGroup({
      layout: blPost, entries: [{ binding: 0, resource: { buffer: uMain } }, { binding: 1, resource: { buffer: u } },
      { binding: 2, resource: t(0) }, { binding: 3, resource: t(1) }, { binding: 4, resource: t(2) }, { binding: 5, resource: t(3) },
      { binding: 6, resource: sLin }, { binding: 7, resource: tDepth.createView() }, { binding: 8, resource: vShadowArr }, { binding: 9, resource: sCmp },
      { binding: 10, resource: { buffer: uNight } }, { binding: 11, resource: vLamp }]
    });
  }
  const hw = Math.max(1, W >> 1), hh = Math.max(1, H >> 1);
  const WING_BLUR = .30 * H / 900;
  const bWing = [postPass([WING_BLUR / hw, 0], [tWing]), postPass([0, WING_BLUR / hh], [tWa]), postPass([WING_BLUR * 2 / hw, 0], [tWb]), postPass([0, WING_BLUR * 2 / hh], [tWa])];
  const bAir = postPass([0, 0], []);
  const bAirBlur = [postPass([1.2 / hw, 0], [tAirA]), postPass([0, 1.2 / hh], [tAirB])];
  const bDown = [], bUp = [];
  for (let k = 0; k < NB; k++) { const src = k ? tDown[k - 1] : tHdr; bDown.push(postPass([1 / src.width, 1 / src.height], [src])); }
  for (let k = NB - 2; k >= 0; k--) { const lo = k === NB - 2 ? tDown[NB - 1] : tUp[k + 1]; bUp[k] = postPass([1 / lo.width, 1 / lo.height, .62], [lo, tDown[k]]); }
  const bComp = postPass([on("bloom") ? K("bloom", .14) : 0, K("vig", .42), K("grade", 1), .012], [tHdr, tUp[0], tAirA, tWb]);

  function draw(t) {
    setGlobals(t);
    const e = dev.createCommandEncoder();
    const geo = (p, g) => { p.setVertexBuffer(0, g.vb); p.setIndexBuffer(g.ib, "uint32"); p.drawIndexed(g.n); };
    [vShadow[0], vShadow[1], vLamp].forEach((target, l) => {
      const p = e.beginRenderPass({ colorAttachments: [], depthStencilAttachment: { view: target, depthClearValue: 1, depthLoadOp: "clear", depthStoreOp: "store" } });
      p.setPipeline(pShadow); p.setBindGroup(0, bSh[l]); geo(p, gScene); p.end();
    });
    const bare = !on("scene");
    const scenePass = (color, depth, bg, water) => {
      const p = e.beginRenderPass({
        colorAttachments: [{ view: color.createView(), clearValue: { r: .03, g: .05, b: .08, a: 1 }, loadOp: "clear", storeOp: "store" }],
        depthStencilAttachment: { view: depth.createView(), depthClearValue: 0, depthLoadOp: "clear", depthStoreOp: "store" }
      });
      p.setBindGroup(0, bg);
      if (!bare) { p.setPipeline(pSky); p.draw(3); p.setPipeline(pScene); geo(p, gScene); if (water && on("water")) { p.setPipeline(pWater); geo(p, gWater); } }
      p.end();
    };
    scenePass(tRefl, tReflD, bRefl, false);
    scenePass(tHdr, tDepth, bMain, true);
    {
      const p = e.beginRenderPass({
        colorAttachments: [{ view: tWing.createView(), clearValue: { r: 0, g: 0, b: 0, a: 0 }, loadOp: "clear", storeOp: "store" }],
        depthStencilAttachment: { view: tWingD.createView(), depthClearValue: 0, depthLoadOp: "clear", depthStoreOp: "store" }
      });
      if (on("wing")) { p.setBindGroup(0, bWingScene); p.setPipeline(pScene); geo(p, gWing); }
      p.end();
    }
    const full = (target, pipe, bg, skip) => {
      const p = e.beginRenderPass({ colorAttachments: [{ view: target, clearValue: { r: 0, g: 0, b: 0, a: 0 }, loadOp: "clear", storeOp: "store" }] });
      if (!skip) { p.setPipeline(pipe); p.setBindGroup(0, bg); p.draw(3); }
      p.end();
    };
    full(tWa.createView(), pBlur, bWing[0]); full(tWb.createView(), pBlur, bWing[1]);
    full(tWa.createView(), pBlur, bWing[2]); full(tWb.createView(), pBlur, bWing[3]);
    const noAir = !on("air");
    full(tAirA.createView(), pAir, bAir, noAir);
    full(tAirB.createView(), pBlur, bAirBlur[0], noAir); full(tAirA.createView(), pBlur, bAirBlur[1], noAir);
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
    if (STILL && n === 4) { dev.queue.onSubmittedWorkDone().then(() => requestAnimationFrame(() => { document.title = errs.length ? "LOOK_DONE_ERR" : "LOOK_DONE"; })); }
    if (!STILL || n < 5) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})().catch(e => { (window.__errs = window.__errs || []).push("X " + (e && e.stack || e)); document.title = "LOOK_FAIL"; });
