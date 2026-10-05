/* Зрение (tests/90b2-geom.js) по матрице окон — водитель.
   Одна Chrome for Testing, на каждое окно своя вкладка в своём контексте (сейвы не делятся),
   все разом. Окно — это ширина × высота × DPR × палец. Шрифт — множитель a: ширина знака
   моноширинного шрифта в долях кегля. У игроков a от 0.550 (Consolas, Windows) до 0.602
   (Menlo, DejaVu; SF Mono и Droid Sans Mono — 0.600). Вылет по ширине растёт с a монотонно,
   поэтому хватает худшего края: моноширинный шрифт страницы подменяется на Courier New
   (a = 0.600, есть на любой Windows) через Page.setFontFamilies — вёрстку считает сам браузер.
   Родной шрифт гоняется на трёх окнах: две точки дают прямую и порог a*, с которого надпись
   ломается. DPR: одно окно дважды, при 1 и 3, — CSS-геометрия от DPR зависеть не должна.
     node test-geom.js --chrome=exe --page=tests.html [--json=файл] [--only=подстрока окна]
   Выход 1 — брак или слепое зрение (тест теста не нашёл заложенную поломку). */
const fs = require("fs"), path = require("path"), { spawn, execFileSync } = require("child_process");
const opt = (n, d) => { const a = process.argv.find(x => x.startsWith("--" + n + "=")); return a ? a.slice(n.length + 3) : d; };
const EXE = opt("chrome", "C:\\Claude\\tools\\chrome-for-testing\\153.0.8010.52\\chrome-win64\\chrome.exe");
const PAGE = path.resolve(opt("page", "tests.html")), JSON_OUT = opt("json", ""), ONLY = opt("only", ""), EVAL0 = opt("eval", "");
const EVAL = EVAL0.startsWith("@") ? fs.readFileSync(EVAL0.slice(1), "utf8") : EVAL0;   /* --eval=@файл — выражение из файла */
const FLAGS = opt("flags", "").split(",").filter(Boolean).map(f => "--" + f.replace(/^-+/, ""));
const PROFILE = path.join(require("os").tmpdir(), "drift-geom-" + process.pid);
const A_NATIVE = 0.5498, A_WORST = 0.6001, A_MAX = 0.6021, REAL_GPU = process.argv.includes("--real-gpu");
const t0 = Date.now(), sec = () => ((Date.now() - t0) / 1000).toFixed(1) + " s";

/* Счётная видеокарта. Зрению нужны числа до растра: где надпись, где плашка, где кнопка. Игра
   считает свой кадр как обычно — вёрстку, подписи #ovl, квады, конвейеры, — а видеокарта всё
   принимает и ничего не рисует и не компилирует. Настоящая WebGPU в семнадцати вкладках
   упиралась в один общий процесс видеокарты: вкладка, одна идущая 2.6 с, шла 30. Ставится
   раньше первой строки игры (Page.addScriptToEvaluateOnNewDocument); --real-gpu — без неё */
function countingGpu() {
  const G = window, noop = () => {}, P = v => Promise.resolve(v), has = Object.prototype.hasOwnProperty;
  for (const k of ["GPUAdapter", "GPUDevice", "GPUQueue", "GPUBuffer", "GPUTexture", "GPUTextureView", "GPURenderPipeline", "GPUComputePipeline", "GPUCanvasContext"])
    if (!G[k]) G[k] = function () {};
  const flags = { GPUBufferUsage: { MAP_READ: 1, MAP_WRITE: 2, COPY_SRC: 4, COPY_DST: 8, INDEX: 16, VERTEX: 32, UNIFORM: 64, STORAGE: 128, INDIRECT: 256, QUERY_RESOLVE: 512 },
    GPUTextureUsage: { COPY_SRC: 1, COPY_DST: 2, TEXTURE_BINDING: 4, STORAGE_BINDING: 8, RENDER_ATTACHMENT: 16 },
    GPUShaderStage: { VERTEX: 1, FRAGMENT: 2, COMPUTE: 4 }, GPUMapMode: { READ: 1, WRITE: 2 }, GPUColorWrite: { RED: 1, GREEN: 2, BLUE: 4, ALPHA: 8, ALL: 15 } };
  for (const k in flags) if (!G[k]) G[k] = flags[k];
  /* объект нужного класса (instanceof GPUBuffer в 08c) со своими полями; чего не назвали — метод,
     возвращающий такую же заглушку. then не отдаём: заглушку не должны принять за обещание */
  const sink = (C, o) => { const x = Object.create(C ? C.prototype : Object.prototype);
    for (const k in o) Object.defineProperty(x, k, { value: o[k], writable: true, configurable: true, enumerable: true });
    return new Proxy(x, { get: (t, k) => has.call(t, k) ? t[k] : (typeof k !== "string" || k === "then") ? undefined : (k in t && typeof t[k] !== "function") ? undefined : () => sink(null, {}) }); };
  const tex = (d, cv) => { const s = d.size || {}, w = Array.isArray(s) ? s[0] : s.width, h = Array.isArray(s) ? (s[1] || 1) : (s.height || 1);
    return sink(G.GPUTexture, { width: w | 0, height: h | 0, depthOrArrayLayers: 1, format: d.format, usage: d.usage | 0, mipLevelCount: d.mipLevelCount || 1,
      sampleCount: d.sampleCount || 1, dimension: d.dimension || "2d", label: d.label || "", createView: () => sink(G.GPUTextureView, cv ? { __cv: cv } : {}), destroy: noop }); };
  const buf = d => sink(G.GPUBuffer, { size: d.size, usage: d.usage, label: d.label || "", mapState: d.mappedAtCreation ? "mapped" : "unmapped",
    mapAsync: () => P(), getMappedRange: (o, n) => new ArrayBuffer(n != null ? n : d.size - (o || 0)), unmap: noop, destroy: noop });
  const pass = () => sink(null, { end: noop });
  const enc = () => sink(null, { beginRenderPass: pass, beginComputePass: pass, finish: () => sink(null, {}) });
  const pipe = () => sink(G.GPURenderPipeline, { getBindGroupLayout: () => sink(null, {}) });
  const limits = { maxTextureDimension1D: 8192, maxTextureDimension2D: 8192, maxTextureDimension3D: 2048, maxTextureArrayLayers: 256, maxBindGroups: 4,
    maxBindingsPerBindGroup: 1000, maxUniformBufferBindingSize: 65536, maxStorageBufferBindingSize: 134217728, minUniformBufferOffsetAlignment: 256,
    minStorageBufferOffsetAlignment: 256, maxVertexBuffers: 8, maxBufferSize: 268435456, maxVertexAttributes: 16, maxColorAttachments: 8,
    maxComputeWorkgroupSizeX: 256, maxComputeWorkgroupSizeY: 256, maxComputeWorkgroupSizeZ: 64, maxComputeInvocationsPerWorkgroup: 256, maxComputeWorkgroupsPerDimension: 65535 };
  const feats = new Set(), info = { vendor: "счёт", architecture: "", device: "", description: "счётная видеокарта" };
  const queue = sink(G.GPUQueue, { submit: noop, writeBuffer: noop, writeTexture: noop, copyExternalImageToTexture: noop, onSubmittedWorkDone: () => P() });
  const dev = sink(G.GPUDevice, { features: feats, limits, queue, lost: new Promise(noop), label: "", onuncapturederror: null,
    createBuffer: buf, createTexture: tex, createCommandEncoder: enc, createRenderPipeline: pipe, createComputePipeline: pipe,
    createRenderPipelineAsync: () => P(pipe()), createComputePipelineAsync: () => P(pipe()),
    createShaderModule: () => sink(null, { getCompilationInfo: () => P({ messages: [] }) }),
    pushErrorScope: noop, popErrorScope: () => P(null), addEventListener: noop, removeEventListener: noop, destroy: noop });
  const adapter = sink(G.GPUAdapter, { features: feats, limits, info, isFallbackAdapter: false, requestDevice: () => P(dev), requestAdapterInfo: () => P(info) });
  const gpu = { requestAdapter: () => P(adapter), getPreferredCanvasFormat: () => "bgra8unorm", wgslLanguageFeatures: new Set() };
  Object.defineProperty(Navigator.prototype, "gpu", { get: () => gpu, configurable: true });
  const ctxs = new WeakMap();
  for (const C of [G.HTMLCanvasElement, G.OffscreenCanvas]) if (C) {
    const o = C.prototype.getContext;
    C.prototype.getContext = function (type) {
      if (type !== "webgpu") return o.apply(this, arguments);
      let c = ctxs.get(this);
      if (!c) { const cv = this; let cfg = null;
        c = sink(G.GPUCanvasContext, { canvas: cv, configure: x => { cfg = x; }, unconfigure: () => { cfg = null; }, getConfiguration: () => cfg,
          getCurrentTexture: () => tex({ size: [cv.width, cv.height], format: cfg ? cfg.format : "bgra8unorm", usage: 16 }, cv) });
        ctxs.set(this, c); }
      return c;
    };
  }
}

/* окна: края кусков @media (420/720/760/900) с обеих сторон и ходовые размеры */
const VP = [
  ["phone 320", 320, 568, 2, 1], ["phone 360", 360, 780, 3, 1], ["phone 390", 390, 844, 3, 1], ["phone 421", 421, 900, 2.625, 1],
  ["land 568", 568, 320, 2, 1], ["land 780", 780, 360, 3, 1], ["tab 721", 721, 1024, 2, 1], ["tab 761", 761, 1024, 2, 1],
  ["pc 900", 900, 600, 1, 0], ["pc 1024", 1024, 768, 1, 0], ["pc 1280", 1280, 800, 1, 0], ["pc 1920", 1920, 1080, 1, 0], ["pc 2560", 2560, 1440, 1, 0],
].map(([name, w, h, dpr, touch]) => ({ name, w, h, dpr, touch: !!touch }));
const RUNS = [];
for (const v of VP) RUNS.push({ ...v, font: "W" });
for (const n of ["phone 360", "pc 1280", "land 780"]) RUNS.push({ ...VP.find(v => v.name === n), font: "N" });
RUNS.push({ ...VP.find(v => v.name === "phone 390"), dpr: 1, font: "W", name: "phone 390", dprTwin: true });
const runs = RUNS.filter(r => !ONLY || r.name.includes(ONLY));

/* ── Chrome и протокол ── */
const chrome = spawn(EXE, ["--headless=new", "--no-sandbox", "--user-data-dir=" + PROFILE, "--no-first-run", "--no-default-browser-check",
  "--disable-field-trial-config", "--remote-debugging-port=0", "--enable-logging=stderr", "--renderer-process-limit=32", ...FLAGS, "about:blank"],
  { stdio: ["ignore", "ignore", "pipe"] });
let ws = null, seen = "", nextId = 1, done = false;
const pending = new Map(), on = new Map();
chrome.on("error", e => finish(2, "chrome did not start: " + e.message));
chrome.stderr.on("data", d => { if (ws) return; seen += d.toString(); const m = seen.match(/DevTools listening on (ws:\/\/\S+)/); if (m) main(m[1]).catch(e => finish(2, "geom: " + (e.stack || e))); });
setTimeout(() => finish(2, "timeout 120 s"), 120000).unref();
function send(method, params, sessionId) {
  const id = nextId++;
  ws.send(JSON.stringify(sessionId ? { id, method, params: params || {}, sessionId } : { id, method, params: params || {} }));
  return new Promise((ok, bad) => pending.set(id, { ok, bad, method }));
}
function onMessage(ev) {
  const m = JSON.parse(typeof ev.data === "string" ? ev.data : Buffer.from(ev.data).toString());
  if (m.id) { const p = pending.get(m.id); if (!p) return; pending.delete(m.id); if (m.error) p.bad(new Error(p.method + ": " + m.error.message)); else p.ok(m.result); return; }
  const f = on.get(m.method + "|" + (m.sessionId || "")); if (f) f(m.params || {});
}
function finish(code, why) {
  if (done) return; done = true;
  if (why) console.error(why);
  const out = () => { try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch (e) {} process.exit(code); };
  try { if (ws && ws.readyState === 1) ws.send(JSON.stringify({ id: 1e9, method: "Browser.close" })); } catch (e) {}
  if (chrome.exitCode !== null) return out();
  chrome.once("exit", out);
  setTimeout(() => { try { execFileSync("taskkill", ["/PID", String(chrome.pid), "/T", "/F"], { stdio: "ignore" }); } catch (e) {} out(); }, 4000);
}
const evalIn = async (S, expr, ms) => {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, timeout: ms || 60000 }, S);
  if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text);
  return r.result.value;
};
const until = async (S, expr, ms) => { const end = Date.now() + ms; while (Date.now() < end) { if (await evalIn(S, expr).catch(() => false)) return true; await new Promise(r => setTimeout(r, 100)); } return false; };

/* ── одно окно ── */
async function one(r) {
  const st = [], mark = k => st.push(k + " " + sec());
  mark("start");
  const { browserContextId } = await send("Target.createBrowserContext", { disposeOnDetach: true });
  const { targetId } = await send("Target.createTarget", { url: "about:blank", browserContextId });
  const { sessionId: S } = await send("Target.attachToTarget", { targetId, flatten: true });
  const errs = [];
  on.set("Runtime.exceptionThrown|" + S, p => errs.push((p.exceptionDetails.exception && p.exceptionDetails.exception.description || p.exceptionDetails.text || "").split("\n")[0]));
  await Promise.all([send("Runtime.enable", {}, S), send("Page.enable", {}, S)]);
  await send("Emulation.setDeviceMetricsOverride", { width: r.w, height: r.h, deviceScaleFactor: r.dpr, mobile: r.touch }, S);
  await send("Emulation.setTouchEmulationEnabled", { enabled: r.touch, maxTouchPoints: r.touch ? 5 : 1 }, S);
  /* страница на русском (lang=ru): Chrome берёт моноширинный шрифт по письму — для кириллицы он свой
     (на Windows это Courier New в DOM при Consolas на холсте). Ставим оба */
  const fx = { fixed: r.font === "W" ? "Courier New" : "Consolas" };
  await send("Page.setFontFamilies", { fontFamilies: fx, forScripts: [{ script: "Cyrl", fontFamilies: fx }] }, S);
  if (!REAL_GPU) await send("Page.addScriptToEvaluateOnNewDocument", { source: "(" + countingGpu + ")()" }, S);
  const loaded = new Promise(ok => on.set("Page.loadEventFired|" + S, ok));
  await send("Page.navigate", { url: "file:///" + PAGE.replace(/\\/g, "/") + "?only=__geom_none__" }, S);
  await loaded;
  mark("load");
  await until(S, "(()=>{const e=document.getElementById('testout');return !!e&&/^(ВСЁ ЗЕЛЁНОЕ|ПРОВАЛЕНО \\d+|ALL GREEN|FAILED \\d+) · /.test(e.textContent)})()", 20000);
  mark("verdict");
  const gpu = await until(S, "typeof GPU!=='undefined'&&!!GPU.ok", 4000);
  mark("gpu");
  const t = Date.now();
  if (EVAL) { const v = await evalIn(S, EVAL, 90000); mark("done"); console.log(tag(r) + ": " + st.join(" · ") + " " + JSON.stringify(v)); send("Target.closeTarget", { targetId }).catch(() => {}); return { skip: true }; }
  const res = await evalIn(S, "geoRun({touch:" + r.touch + ",geo:" + (r.name === "phone 390" && r.font === "W") + "})", 90000);
  res.wall = Date.now() - t; res.gpu = gpu; res.pageErrs = errs.slice(0, 5);
  send("Target.closeTarget", { targetId }).catch(() => {});
  return res;
}

async function main(url) {
  ws = new WebSocket(url);
  await new Promise((ok, bad) => { ws.onopen = ok; ws.onerror = () => bad(new Error("websocket")); });
  ws.onmessage = onMessage;
  if (!fs.existsSync(PAGE)) return finish(2, "no page " + PAGE + " — build first");
  const all = await Promise.all(runs.map(r => one(r).then(res => ({ r, res }), e => ({ r, err: String(e.message || e) }))));
  if (EVAL) return finish(0);
  report(all);
}

/* ── свод: брак по элементу через все окна; пороги по шрифту и ширине ── */
function tag(r) { return r.name + (r.font === "N" ? " ·родной" : "") + (r.dprTwin ? " ·dpr1" : ""); }
function report(all) {
  let blind = 0, red = 0;
  const lines = [], perRun = [], dark = new Map();
  /* слепота: тест теста не прошёл, экран закрыт целиком или окно игры ни разу не открылось */
  const darken = (k, r) => { let d = dark.get(k); if (!d) dark.set(k, d = new Set()); d.add(r.w); };
  for (const { r, res, err } of all) {
    if (err) { blind++; perRun.push("  " + tag(r).padEnd(22) + " СБОЙ " + err.slice(0, 160)); continue; }
    const s = res.self, f = res.font, u = res.sum;
    if (!s || !s.ok || (res.blind || []).length || (res.unseen || []).length) blind++;
    for (const b of res.blind || []) darken("экран " + b, r);
    for (const id of res.unseen || []) darken("окно " + id + " не открылось", r);
    perRun.push("  " + tag(r).padEnd(22) + " " + String(res.screens).padStart(3) + " экр " + String(res.clicks).padStart(3) + " тыч " +
      String(res.findings.length).padStart(4) + " брак  a=" + (f ? f.canvas + "/" + f.dom : "?") + (res.vp && res.vp.touch !== r.touch ? "  ПАЛЕЦ НЕ ТОТ" : "") +
      (u ? "  видно кнопок " + u.on + "/" + u.ctl + ", надписей " + u.vis + "/" + u.txt : "") +
      (res.gpu ? "" : "  без GPU") + "  " + (res.wall / 1000).toFixed(1) + " с" +
      (s && !s.ok ? "  СЛЕПО: " + s.miss.concat(s.dirty).join("; ") : "") + (res.errs.length ? "  ошибки обхода " + res.errs.length : ""));
  }
  /* группы: закон × кто × с кем. Один брак, увиденный с разных путей (карта из сцены, из станции,
     после тычка), — одна строка; место — самый короткий путь, остальные счётом */
  const G = new Map();
  for (const { r, res } of all) if (res) for (const f of res.findings) {
    const k = f.law + "\u0001" + f.who + "\u0001" + (f.with || "");
    let g = G.get(k); if (!g) G.set(k, g = { f, hits: [], wh: new Set() });
    g.hits.push({ r, m: f.m, side: f.side }); g.wh.add(f.where);
  }
  const native = new Set(all.filter(x => x.r.font === "N").map(x => x.r.name));
  const place = g => { const w = [...g.wh].sort((a, b) => a.length - b.length || a.localeCompare(b)); return w[0] + (w.length > 1 ? " (+" + (w.length - 1) + " пут.)" : ""); };
  const wins = hs => { const W = hs.filter(h => h.r.font === "W" && !h.r.dprTwin), ws = [...new Set(W.map(h => h.r.w))].sort((a, b) => a - b);
    if (!ws.length) { const N = [...new Set(hs.filter(h => h.r.font === "N").map(h => h.r.w))].sort((a, b) => a - b); if (N.length) return "окна " + N.join(",") + " — только родным шрифтом"; }
    const miss = VP.filter(v => !W.some(h => h.r.name === v.name)).map(v => v.w);
    return "окна " + (ws.length ? ws.join(",") : "—") + (miss.length && ws.length ? "  (цело: " + miss.join(",") + ")" : ""); };
  /* кегль: мелкие надписи одного места — одной строкой со счётом и примерами */
  const small = new Map();
  for (const g of G.values()) if (g.f.law === "кегль") { const k = place(g); let s = small.get(k); if (!s) small.set(k, s = []); s.push(g); }
  for (const [where, gs] of small) {
    const ms = gs.flatMap(g => g.hits.map(h => h.m)), hs = gs.flatMap(g => g.hits);
    lines.push({ n: hs.length, s: "  кегль   " + where + " › " + gs.length + " надп. мельче 8 px (" + Math.min(...ms) + "–" + Math.max(...ms) + "): " +
      gs.slice(0, 5).map(g => g.f.who.replace(/^холст /, "")).join(", ") + (gs.length > 5 ? " …" : "") + "\n           " + wins(hs) });
  }
  /* наезд-узел: одна надпись в одном месте наезжает на три и больше — одной строкой (подпись рукава
     поперёк карты, меловая приписка поперёк таблицы) */
  const hubN = new Map(), hk = (g, l) => place(g) + "\u0001" + l;
  for (const g of G.values()) if (g.f.law === "наезд") for (const l of [g.f.who, g.f.with]) hubN.set(hk(g, l), (hubN.get(hk(g, l)) || 0) + 1);
  const hubs = new Map();
  for (const g of G.values()) if (g.f.law === "наезд") {
    const a = hubN.get(hk(g, g.f.who)), b = hubN.get(hk(g, g.f.with));
    if (Math.max(a, b) < 3) continue;
    const l = a >= b ? g.f.who : g.f.with, al = g.f.al ? g.f.al[l === g.f.who ? 0 : 1] : null;
    let h = hubs.get(hk(g, l)); if (!h) hubs.set(hk(g, l), h = { where: place(g), l, al, gs: [] });
    h.gs.push({ g, other: l === g.f.who ? g.f.with : g.f.who }); g.hub = true;
  }
  for (const h of hubs.values()) {
    const hs = h.gs.flatMap(x => x.g.hits), m = Math.max(...hs.map(x => x.m));
    lines.push({ n: hs.length, s: "  наезд   " + h.where + " › " + h.l + (h.al != null && h.al < .5 ? " (бледная " + h.al + ")" : "") + "  ⟷ " + h.gs.length + " надп. до " + m + " px: " +
      h.gs.slice(0, 4).map(x => x.other).join(", ") + (h.gs.length > 4 ? " …" : "") + "\n           " + wins(hs) });
  }
  /* накрыта одним и тем же: виджет лёг на несколько надписей и кнопок — одной строкой */
  const cvk = f => f.by.replace(/\s*«[^»]*»?/g, "").replace(/ › svg$/, ""), caps = new Map();
  for (const g of G.values()) if (g.f.law === "накрыта" && g.f.by) { const k = cvk(g.f); let c = caps.get(k); if (!c) caps.set(k, c = []); c.push(g); }
  for (const [k, gs] of caps) {
    if (gs.length < 2) continue;
    const hs = gs.flatMap(g => g.hits), wh = new Set(gs.flatMap(g => [...g.wh])), one = new Map();
    for (const g of gs) { const w = g.f.who.replace(/^.* › /, ""), id = w.replace(/\s*«[^»]*»?/g, ""); if (!one.has(id) || !/^#/.test(id)) one.set(/^#/.test(id) ? id : w, w); }
    const who = [...one.values()];
    const lab = [...new Set(gs.map(g => (/«[^»]*»?/.exec(g.f.by) || [""])[0]))].filter(Boolean).join(" ");
    lines.push({ n: hs.length, s: "  накрыта под " + k + (lab ? " " + lab : "") + " › " + who.length + " шт. на " + wh.size + " экр.: " + who.slice(0, 5).join(", ") + (who.length > 5 ? " …" : "") +
      "\n           " + wins(hs) });
    for (const g of gs) g.hub = true;
  }
  for (const g of G.values()) {
    const f = g.f; if (f.law === "кегль" || g.hub) continue;
    const W = g.hits.filter(h => h.r.font === "W" && !h.r.dprTwin), N = g.hits.filter(h => h.r.font === "N");
    let fontNote = "";
    /* порог по шрифту: окно гонялось родным шрифтом, брак есть только у худшего — a* между ними */
    const both = W.filter(h => native.has(h.r.name));
    if (both.length && !N.length && /вылет|срез|край|наезд/.test(f.law)) {
      const n = (f.s || f.who.replace(/^.*«|»$/g, "")).length || 1, px = f.px || 12;
      const ast = A_WORST - (both[0].m - 1) / (n * px);
      fontNote = "  · шрифт: родной 0.550 цел, ломается с a≈" + Math.max(A_NATIVE, Math.min(A_WORST, ast)).toFixed(3);
    } else if (N.length && W.length) fontNote = "  · ломается и родным шрифтом";
    const m = Math.max(...g.hits.map(h => h.m));
    lines.push({ n: g.hits.length, s: "  " + f.law.padEnd(7) + " " + place(g) + " › " + f.who + (f.with ? "  ⟷ " + f.with : "") + (f.by ? "  под " + f.by : "") +
      (f.side ? "  " + f.side : "") + (m ? " до " + m + (f.law === "цель" ? " px" : f.law === "невидим" ? ":1" : f.law === "сжатие" ? " %" : " px") : "") +
      (f.k ? "  контраст сквозь " + f.k + ":1" : "") + (f.al && Math.min(...f.al) < .5 ? "  непрозрачность " + f.al.join("/") : "") +
      (f.s ? "  «" + f.s + "»" : "") + "\n           " + wins(g.hits) + fontNote });
  }
  lines.sort((a, b) => b.n - a.n);
  for (let i = 0; i < lines.length; i++) lines[i] = lines[i].s;
  red = lines.length;
  /* DPR: одно окно при 3 и при 1 — брак должен совпасть */
  const d3 = all.find(x => x.r.name === "phone 390" && !x.r.dprTwin && x.r.font === "W"), d1 = all.find(x => x.r.dprTwin);
  let dprNote = "";
  if (d3 && d1 && d3.res && d1.res) {
    const key = f => f.where + "|" + f.law + "|" + f.who;
    const a = new Set(d3.res.findings.map(key)), b = new Set(d1.res.findings.map(key));
    const only3 = [...a].filter(k => !b.has(k)), only1 = [...b].filter(k => !a.has(k));
    dprNote = only3.length || only1.length ? "  DPR: брак зависит от плотности экрана — только при 3: " + only3.length + ", только при 1: " + only1.length +
      [...only3.slice(0, 3).map(k => "\n    dpr3 " + k), ...only1.slice(0, 3).map(k => "\n    dpr1 " + k)].join("") : "  DPR: при 1 и 3 брак одинаков";
    /* и каждая надпись — там же и тем же кеглем: CSS-геометрия от плотности не зависит. Пара — по слою
       и тексту в порядке появления; допуск — полтора пикселя или 3 % размера, кегль — 0.6 px или 5 %.
       Виновник обычно холст, где масштаб считают в пикселях устройства, а потолок ставят в CSS */
    if (d3.res.geo && d1.res.geo) {
      const G1 = new Map(d1.res.geo), by = new Map();
      for (const [w, A3] of d3.res.geo) {
        const A1 = G1.get(w); if (!A1) continue;
        const q = new Map(), sc = new Map();
        for (const t of A1) { const k = t[0] + "|" + t[1]; if (!q.has(k)) q.set(k, []); q.get(k).push(t); }
        for (const t of A3) {
          const L = q.get(t[0] + "|" + t[1]); if (!L || !L.length) continue;
          const u = L.shift(); if (t[7] || u[7]) continue;
          const sz = Math.max(t[4] - t[2], t[5] - t[3], u[4] - u[2], u[5] - u[3], 1);
          const d = Math.max(...[2, 3, 4, 5].map(i => Math.abs(t[i] - u[i]))), dp = Math.abs(t[6] - u[6]);
          if (d <= Math.max(1.5, .03 * sz) && dp <= Math.max(.6, .05 * Math.max(t[6], u[6]))) continue;
          if (!sc.has(t[0])) sc.set(t[0], []); sc.get(t[0]).push([t, u, d]);
        }
        /* вёрстка от DPR не зависит по построению: одна сдвинутая строка DOM — чужое время (кнопка
           сменила состояние между прогонами), а не плотность. В счёт — от трёх строк на экране */
        for (const [L, D] of sc) {
          if (L === "dom" && D.length < 3) continue;
          let g = by.get(L); if (!g) by.set(L, g = { n: 0, wh: new Set(), ex: [], d: 0 });
          for (const [t, u, d] of D) { g.n++; g.wh.add(w); g.d = Math.max(g.d, d);
            if (g.ex.length < 3 && !g.ex.some(e => e[0] === t[1])) g.ex.push([t[1], u[6], t[6], d]); }
        }
      }
      for (const [L, g] of by) {
        const wh = [...g.wh].sort((a, b) => a.length - b.length);
        lines.push("  DPR     " + wh[0] + (wh.length > 1 ? " (+" + (wh.length - 1) + " экр.)" : "") + " › " + L + " › " + g.n + " надп. не на месте при DPR 3, сдвиг до " +
          g.d.toFixed(1) + " px: " + g.ex.map(([s, p1, p3, d]) => "«" + s.slice(0, 24) + "» " + p1 + "→" + p3 + " px").join(", ") +
          "\n           окно 390 (DPR 1 → 3)");
      }
      red = lines.length;
    }
  }
  console.log("ЗРЕНИЕ · " + runs.length + " окон · " + sec());
  console.log(perRun.join("\n"));
  if (dprNote) console.log(dprNote);
  if (dark.size) console.log("СЛЕПО (" + dark.size + "):\n" + [...dark].map(([k, w]) => "  " + k + "\n           окна " + [...w].sort((a, b) => a - b).join(",")).join("\n"));
  if (lines.length) console.log("БРАК (" + lines.length + "):\n" + lines.join("\n"));
  /* композиция — заметки, вердикт не меняют: почти ровно, неровный шаг, окно не на месте по φ */
  const NG = new Map();
  for (const { r, res } of all) if (res) for (const f of res.notes || []) {
    const k = f.law + "\u0001" + f.who + "\u0001" + (f.with || "") + "\u0001" + (f.side || "");
    let g = NG.get(k); if (!g) NG.set(k, g = { f, hits: [], wh: new Set() });
    g.hits.push({ r, m: f.m }); g.wh.add(f.where);
  }
  if (NG.size) {
    const ns = [...NG.values()].sort((a, b) => b.hits.length - a.hits.length);
    console.log("КОМПОЗИЦИЯ (" + ns.length + ", заметки):\n" + ns.slice(0, 30).map(g => {
      const f = g.f, m = Math.max(...g.hits.map(h => h.m));
      return "  " + f.law.padEnd(7) + " " + place(g) + " › " + f.who + (f.with ? "  ⟷ " + f.with : "") + "  " + (f.side || "") +
        (f.law === "φ" ? " " + m : " до " + m + " px") + (f.g ? "  зазоры " + f.g.join("/") : "") + "\n           " + wins(g.hits);
    }).join("\n") + (ns.length > 30 ? "\n  … ещё " + (ns.length - 30) : ""));
  } else console.log("КОМПОЗИЦИЯ: заметок нет (ровно, шаг, φ)");
  if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify(all.map(x => ({ run: tag(x.r), err: x.err, ...(x.res || {}) })), null, 1));
  const verdict = blind ? "BLIND " + blind + " · " : "";
  console.log((blind || red ? "FAILED · " + verdict + "defects " + red : "ALL GREEN · vision clean") + " · " + sec());
  finish(blind || red ? 1 : 0);
}
