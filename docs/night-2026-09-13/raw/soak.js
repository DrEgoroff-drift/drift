/* ══════════════ ночной соук — тестовый бот (T.bot) играет часами под Node ══════════════
   Копия окружения test-node.js (SHIM + разбор tests.html), но вместо того чтобы
   прогнать TEST_SUITES и выйти, бот берёт управление сам: гуляет по галактике,
   торгует, бурит, логирует то, что нашёл. Никакой сети — играет только в памяти
   процесса, api.php тут вообще не существует (fetch на относительный урл падает
   до сети, см. test-node.js: "fetch: нет сети под Node"). Правило [[drift-bots-local-copy]]
   соблюдено тем, что тут нет ни браузера, ни сервера вовсе.

   node soak.js --shard=0 --budget=480 --gamedir="C:\Claude\files" --outdir="C:\...\soak" */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm"), crypto = require("crypto");

const args = process.argv.slice(2);
const opt = (n, d) => { const a = args.find(x => x.startsWith("--" + n + "=")); return a ? a.slice(n.length + 3) : d; };
const SHARD = +opt("shard", "0") | 0;
const BUDGET_MIN = +opt("budget", "480");
const GAMEDIR = opt("gamedir", "C:\\Claude\\files");
const OUTDIR = opt("outdir", ".");
const EVENTS_PATH = path.join(OUTDIR, "soak-" + SHARD + ".jsonl");
const REPORT_PATH = path.join(OUTDIR, "soak-" + SHARD + ".txt");
const STATS_PATH = path.join(OUTDIR, "soak-" + SHARD + ".json");
fs.mkdirSync(OUTDIR, { recursive: true });

/* ── тот же SHIM, что test-node.js (без него исходники игры не грузятся под Node) ── */
const NOOP = () => {};
let IMG_ONE = null; const IMG_BUF = (n) => { const cap = Math.min(n, 1 << 20); if (!IMG_ONE || IMG_ONE.length < cap) IMG_ONE = new Uint8ClampedArray(cap); return IMG_ONE.length === cap ? IMG_ONE : IMG_ONE.subarray(0, cap); };
const RECT = () => ({ x: 0, y: 0, left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 });
function ctxProxy(el) {
  const store = { canvas: el, globalAlpha: 1, lineWidth: 1, font: "10px sans-serif", fillStyle: "#000", strokeStyle: "#000" };
  const grad = () => ({ addColorStop: NOOP });
  return new Proxy(store, {
    get(t, p) {
      if (p in t) return t[p];
      switch (p) {
        case "measureText": return (s) => ({ width: String(s).length * 6, actualBoundingBoxAscent: 8, actualBoundingBoxDescent: 2, actualBoundingBoxLeft: 0, actualBoundingBoxRight: String(s).length * 6 });
        case "getImageData": case "createImageData": return (a, b, c, d) => { const w = (typeof a === "object") ? a.width : (c | 0) || 1, h = (typeof a === "object") ? a.height : (d | 0) || 1; return { width: w, height: h, data: IMG_BUF(w * h * 4) }; };
        case "createLinearGradient": case "createRadialGradient": case "createConicGradient": case "createPattern": return grad;
        case "getTransform": return () => new globalThis.DOMMatrix();
        case "isPointInPath": case "isPointInStroke": return () => false;
        case "getLineDash": return () => [];
        default: return NOOP;
      }
    },
    set(t, p, v) { t[p] = v; return true; }
  });
}
class ClassList { constructor() { this.s = new Set(); } add(...a) { a.forEach(c => this.s.add(c)); } remove(...a) { a.forEach(c => this.s.delete(c)); } contains(c) { return this.s.has(c); } toggle(c, f) { const on = f === undefined ? !this.s.has(c) : !!f; on ? this.s.add(c) : this.s.delete(c); return on; } get length() { return this.s.size; } item(i) { return [...this.s][i] || null; } toString() { return [...this.s].join(" "); } [Symbol.iterator]() { return this.s[Symbol.iterator](); } forEach(f) { this.s.forEach(f); } }
class El {
  constructor(tag) {
    this.tagName = String(tag || "div").toUpperCase(); this.nodeName = this.tagName; this.nodeType = 1;
    this.id = ""; this.className = ""; this.classList = new ClassList(); this.dataset = {}; this.style = new Proxy({}, { get: (t, p) => p in t ? t[p] : (typeof p === "string" && p === "setProperty" ? NOOP : (p === "getPropertyValue" ? () => "" : "")), set: (t, p, v) => { t[p] = v; return true; } });
    this.children = []; this.childNodes = this.children; this.parentNode = null; this.parentElement = null;
    this.attrs = {}; this._text = ""; this.value = ""; this.checked = false; this.disabled = false; this.hidden = false;
    this.width = 300; this.height = 150; this.clientWidth = 0; this.clientHeight = 0; this.offsetWidth = 0; this.offsetHeight = 0; this.scrollTop = 0; this.scrollLeft = 0; this.scrollHeight = 0; this.scrollWidth = 0; this.offsetTop = 0; this.offsetLeft = 0;
    this.src = ""; this.href = ""; this.complete = true; this.naturalWidth = 0; this.naturalHeight = 0; this.onload = null; this.onerror = null;
    this._ctx = null;
  }
  get textContent() { return this._text + this.children.map(c => c.textContent || "").join(""); }
  set textContent(v) { this.children.length = 0; this._text = v == null ? "" : String(v); }
  get innerText() { return this.textContent; } set innerText(v) { this.textContent = v; }
  get innerHTML() { return this._text; } set innerHTML(v) { this.children.length = 0; this._text = ""; parseInto(this, String(v == null ? "" : v)); }
  getContext() { return this._ctx || (this._ctx = ctxProxy(this)); }
  toDataURL() { return "data:,"; } toBlob(cb) { if (cb) setTimeout(() => cb(null), 0); } transferControlToOffscreen() { return this; }
  appendChild(c) { if (c && c.parentNode) c.parentNode.removeChild(c); this.children.push(c); if (c) { c.parentNode = this; c.parentElement = this; } return c; }
  append(...a) { a.forEach(c => typeof c === "object" && this.appendChild(c)); } prepend(...a) { a.forEach(c => { if (typeof c === "object") { this.children.unshift(c); c.parentNode = this; c.parentElement = this; } }); }
  insertBefore(c, ref) { const i = this.children.indexOf(ref); if (i < 0) return this.appendChild(c); this.children.splice(i, 0, c); c.parentNode = this; c.parentElement = this; return c; }
  removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); if (c) { c.parentNode = null; c.parentElement = null; } return c; }
  replaceChildren(...a) { this.children.length = 0; a.forEach(c => this.appendChild(c)); } replaceWith() {} remove() { if (this.parentNode) this.parentNode.removeChild(this); }
  insertAdjacentHTML() {} insertAdjacentElement(_, e) { return this.appendChild(e); }
  querySelector(sel) { return qs(this, sel)[0] || null; } querySelectorAll(sel) { return qs(this, sel); }
  getElementsByClassName(c) { return qs(this, "." + c); } getElementsByTagName(t) { return qs(this, t); }
  closest() { return null; } contains(c) { return c === this || this.children.some(x => x.contains && x.contains(c)); } matches() { return false; }
  cloneNode() { const e = new El(this.tagName); e.className = this.className; e.textContent = this.textContent; return e; }
  addEventListener() {} removeEventListener() {} dispatchEvent() { return true; }
  setAttribute(k, v) { this.attrs[k] = String(v); if (k === "id") this.id = String(v); if (k === "class") this.className = String(v); }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; } hasAttribute(k) { return k in this.attrs; } removeAttribute(k) { delete this.attrs[k]; }
  getBoundingClientRect() { return RECT(); } getClientRects() { return []; } scrollIntoView() {} scrollTo() {} scrollBy() {}
  focus() {} blur() {} click() {} select() {} setPointerCapture() {} releasePointerCapture() {} requestFullscreen() { return Promise.resolve(); }
  get firstChild() { return this.children[0] || null; } get lastChild() { return this.children[this.children.length - 1] || null; } get firstElementChild() { return this.firstChild; } get lastElementChild() { return this.lastChild; }
  get nextSibling() { return null; } get previousSibling() { return null; } get nextElementSibling() { return null; } get previousElementSibling() { return null; }
  get isConnected() { return true; } get ownerDocument() { return document; }
}
function qs(root, sel) {
  const out = [];
  const parts = String(sel).split(",").map(s => s.trim()).filter(Boolean);
  const walk = (e) => { for (const c of e.children) { if (!c || !c.children) continue; for (const p of parts) if (match(c, p)) { out.push(c); break; } walk(c); } };
  const match = (e, p) => {
    if (p.startsWith("#")) return e.id === p.slice(1).split(/[\s.:\[>]/)[0];
    if (p.startsWith(".")) return e.classList.contains(p.slice(1).split(/[\s.:\[>]/)[0]);
    const tag = p.split(/[\s.:\[>#]/)[0]; return tag === "*" || e.tagName === tag.toUpperCase();
  };
  walk(root); return out;
}
const byId = new Map();
const document = new El("#document");
document.nodeType = 9; document.body = new El("body"); document.head = new El("head"); document.documentElement = new El("html");
document.documentElement.appendChild(document.head); document.documentElement.appendChild(document.body);
function parseBody(src) { const m = src.match(/<body[^>]*>([\s\S]*?)<\/body>/i); parseInto(document.body, m ? m[1] : ""); }
function parseInto(root, h) {
  const VOID = new Set(["br", "hr", "img", "input", "meta", "link", "source", "wbr", "area", "col", "embed", "track"]);
  h = h.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<!--[\s\S]*?-->/g, "");
  const stack = [root]; const re = /<\/?([a-zA-Z][a-zA-Z0-9-]*)([^>]*)>|([^<]+)/g; let t;
  while ((t = re.exec(h))) {
    if (t[3] !== undefined) { const txt = t[3].replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"'); if (txt.trim()) { const top = stack[stack.length - 1]; top._text += txt; } continue; }
    const closing = t[0][1] === "/", tag = t[1].toLowerCase(), attrs = t[2] || "";
    if (closing) { for (let i = stack.length - 1; i > 0; i--) if (stack[i].tagName === tag.toUpperCase()) { stack.length = i; break; } continue; }
    const e = new El(tag); const ar = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g; let a;
    while ((a = ar.exec(attrs))) { const k = a[1], v = a[2] !== undefined ? a[2] : (a[3] !== undefined ? a[3] : (a[4] !== undefined ? a[4] : "")); e.setAttribute(k, v); if (k === "class") v.split(/\s+/).filter(Boolean).forEach(c => e.classList.add(c)); if (k.startsWith("data-")) e.dataset[k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v; if (k === "style" && /display\s*:\s*none/.test(v)) e.style.display = "none"; if (k === "width" || k === "height") e[k] = +v || 0; if (k === "value") e.value = v; if (k === "disabled") e.disabled = true; if (k === "hidden") e.hidden = true; }
    stack[stack.length - 1].appendChild(e); if (e.id && !byId.has(e.id)) byId.set(e.id, e);
    if (!VOID.has(tag) && !/\/\s*$/.test(attrs)) stack.push(e);
  }
}
document.getElementById = (id) => { if (!byId.has(id)) { const e = new El("div"); e.id = id; document.body.appendChild(e); byId.set(id, e); } return byId.get(id); };
document.createElement = (t) => new El(t); document.createElementNS = (_, t) => new El(t);
document.createTextNode = (s) => ({ nodeType: 3, textContent: String(s), nodeValue: String(s) }); document.createDocumentFragment = () => new El("fragment");
document.querySelector = (sel) => {
  if (sel.startsWith("#") && !/[\s.:\[>]/.test(sel)) return document.getElementById(sel.slice(1));
  const f = qs(document.documentElement, sel)[0]; if (f) return f;
  const first = sel.split(",")[0].trim().split(/\s+/).pop(); const e = new El(first.replace(/^[.#]/, "").split(/[.#:\[]/)[0] || "div");
  first.split(/(?=[.#])/).forEach(pc => { if (pc.startsWith(".")) e.classList.add(pc.slice(1).split(/[:\[]/)[0]); else if (pc.startsWith("#")) { e.id = pc.slice(1).split(/[:\[]/)[0]; byId.set(e.id, e); } });
  document.body.appendChild(e); return e;
};
document.createTreeWalker = (root, what, filter) => {
  const all = []; (function walk(e) { for (const c of (e.children || [])) { all.push(c); walk(c); } })(root);
  const acc = (n) => { if (!filter) return 1; const r = typeof filter === "function" ? filter(n) : filter.acceptNode(n); return r === undefined ? 1 : r; };
  let i = -1; return { currentNode: root, nextNode() { while (++i < all.length) if (acc(all[i]) === 1) { this.currentNode = all[i]; return all[i]; } return null; } };
};
document.createNodeIterator = document.createTreeWalker;
document.querySelectorAll = (s) => qs(document.documentElement, s);
document.getElementsByTagName = (t) => qs(document.documentElement, t); document.getElementsByClassName = (c) => qs(document.documentElement, "." + c);
document.hidden = false; document.visibilityState = "visible"; document.readyState = "complete"; document.title = ""; document.activeElement = null;
document.fonts = { ready: Promise.resolve(), load: () => Promise.resolve([]), check: () => true, add: NOOP };
document.scripts = []; document.exitFullscreen = () => Promise.resolve(); document.fullscreenElement = null;
document.elementFromPoint = () => null; document.hasFocus = () => true; document.execCommand = () => false;
class Storage { constructor() { this.m = new Map(); } getItem(k) { return this.m.has(k) ? this.m.get(k) : null; } setItem(k, v) { this.m.set(k, String(v)); } removeItem(k) { this.m.delete(k); } clear() { this.m.clear(); } key(i) { return [...this.m.keys()][i] || null; } get length() { return this.m.size; } }
/* only= — заведомо несуществующий набор: игра и харнесс грузятся, TEST_SUITES
   заполняются, но runTests() под Node (99-run.js: TEST_NODE && frameN<1) находит
   ноль совпадений и не трогает G. Дальше миром распоряжается этот файл. */
const search = "only=" + encodeURIComponent("__soak_boot_" + SHARD + "__");
const G0 = globalThis;
G0.TEST_NODE = true;
const SHIM = {
  window: G0, self: G0, document, HTMLElement: El, HTMLCanvasElement: El, HTMLInputElement: El, HTMLButtonElement: El, Element: El, Node: El, Image: El, OffscreenCanvas: El, Audio: El,
  localStorage: new Storage(), sessionStorage: new Storage(),
  location: { protocol: "file:", search: "?" + search, hash: "", href: "file:///tests.html", hostname: "", host: "", pathname: "/tests.html", origin: "null", reload: NOOP, replace: NOOP, assign: NOOP },
  navigator: { userAgent: "node/" + process.version, language: "ru", languages: ["ru"], onLine: true, platform: "node", maxTouchPoints: 0, vibrate: NOOP, clipboard: { writeText: () => Promise.resolve() }, sendBeacon: () => true, share: undefined, serviceWorker: undefined, mediaDevices: undefined, userAgentData: undefined },
  innerWidth: 1280, innerHeight: 800, outerWidth: 1280, outerHeight: 800, devicePixelRatio: 1, screen: { width: 1280, height: 800, availWidth: 1280, availHeight: 800, orientation: { type: "landscape-primary", angle: 0 } }, visualViewport: { width: 1280, height: 800, scale: 1, addEventListener: NOOP },
  scrollX: 0, scrollY: 0, pageXOffset: 0, pageYOffset: 0, scrollTo: NOOP, scrollBy: NOOP, alert: NOOP, confirm: () => true, prompt: () => null, open: () => null, close: NOOP, print: NOOP, focus: NOOP, blur: NOOP, stop: NOOP, getSelection: () => ({ removeAllRanges: NOOP, toString: () => "" }),
  matchMedia: () => ({ matches: false, media: "", addEventListener: NOOP, removeEventListener: NOOP, addListener: NOOP, removeListener: NOOP }),
  getComputedStyle: () => new Proxy({}, { get: (t, p) => p === "getPropertyValue" ? () => "" : "" }),
  requestAnimationFrame: (cb) => setTimeout(() => cb(performance.now()), 16), cancelAnimationFrame: (id) => clearTimeout(id), requestIdleCallback: (cb) => setTimeout(() => cb({ timeRemaining: () => 50, didTimeout: false }), 1), cancelIdleCallback: clearTimeout,
  addEventListener: NOOP, removeEventListener: NOOP, dispatchEvent: () => true, onerror: null, onunhandledrejection: null,
  history: { pushState: NOOP, replaceState: NOOP, back: NOOP, forward: NOOP, go: NOOP, state: null, length: 1 },
  NodeFilter: { SHOW_ALL: 0xFFFFFFFF, SHOW_ELEMENT: 1, SHOW_TEXT: 4, FILTER_ACCEPT: 1, FILTER_REJECT: 2, FILTER_SKIP: 3 },
  DOMMatrix: class { constructor(a) { Object.assign(this, { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0, is2D: true }); if (Array.isArray(a) && a.length >= 6) [this.a, this.b, this.c, this.d, this.e, this.f] = a; } translate(x = 0, y = 0) { const m = new this.constructor([this.a, this.b, this.c, this.d, this.e + x, this.f + y]); return m; } scale(x = 1, y = x) { return new this.constructor([this.a * x, this.b * x, this.c * y, this.d * y, this.e, this.f]); } multiply() { return new this.constructor([this.a, this.b, this.c, this.d, this.e, this.f]); } inverse() { return new this.constructor(); } rotate() { return new this.constructor([this.a, this.b, this.c, this.d, this.e, this.f]); } transformPoint(p) { return { x: this.a * p.x + this.c * p.y + this.e, y: this.b * p.x + this.d * p.y + this.f }; } },
  Path2D: class { moveTo() {} lineTo() {} closePath() {} arc() {} rect() {} ellipse() {} bezierCurveTo() {} quadraticCurveTo() {} addPath() {} },
  CSS: { supports: () => false, escape: (s) => String(s), px: (v) => v + "px" },
  ResizeObserver: class { observe() {} unobserve() {} disconnect() {} }, IntersectionObserver: class { observe() {} unobserve() {} disconnect() {} }, MutationObserver: class { observe() {} disconnect() {} takeRecords() { return []; } },
  DOMRect: class { constructor(x = 0, y = 0, w = 0, h = 0) { Object.assign(this, { x, y, width: w, height: h, left: x, top: y, right: x + w, bottom: y + h }); } },
  FileReader: class { readAsText() { setTimeout(() => this.onload && this.onload({ target: { result: "" } }), 0); } readAsDataURL() { setTimeout(() => this.onload && this.onload({ target: { result: "" } }), 0); } },
  FontFace: class { load() { return Promise.resolve(this); } },
  fetch: (typeof globalThis.fetch === "function") ? globalThis.fetch : (() => Promise.reject(new TypeError("fetch: нет сети под Node"))),
  Notification: undefined, speechSynthesis: undefined, SpeechSynthesisUtterance: undefined, AudioContext: undefined, webkitAudioContext: undefined, caches: undefined, indexedDB: undefined,
  KeyboardEvent: class { constructor(t, o) { Object.assign(this, { type: t }, o || {}); } preventDefault() {} stopPropagation() {} },
  MouseEvent: class { constructor(t, o) { Object.assign(this, { type: t }, o || {}); } preventDefault() {} stopPropagation() {} },
  PointerEvent: class { constructor(t, o) { Object.assign(this, { type: t }, o || {}); } preventDefault() {} stopPropagation() {} },
  TouchEvent: class { constructor(t, o) { Object.assign(this, { type: t }, o || {}); } preventDefault() {} stopPropagation() {} },
  CustomEvent: class { constructor(t, o) { Object.assign(this, { type: t }, o || {}); } preventDefault() {} stopPropagation() {} },
  Event: class { constructor(t, o) { Object.assign(this, { type: t }, o || {}); } preventDefault() {} stopPropagation() {} },
};
for (const k of Object.keys(SHIM)) Object.defineProperty(G0, k, { value: SHIM[k], writable: true, configurable: true, enumerable: true });

/* ── грузим ровно то, что грузит test-node.js (tests.html целиком, тот же порядок) ── */
const html = fs.readFileSync(path.join(GAMEDIR, "tests.html"), "utf8");
if (!html.includes("TEST_SUITES")) { console.error("tests.html без тестов — сначала build.ps1"); process.exit(2); }
parseBody(html);
const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
process.on("uncaughtException", (e) => logExc(e, "вне кадра (uncaught)"));
process.on("unhandledRejection", (e) => logExc(e, "обещание (unhandled)"));
document.scripts = scripts.map(t => ({ textContent: t, src: "" }));
for (let i = 0; i < scripts.length; i++) vm.runInThisContext(scripts[i], { filename: "tests.html#" + (i + 1) });
/* к этому моменту 99-run.js уже вызвал runTests() синхронно (TEST_NODE, frameN<1);
   only= не совпал ни с одним набором — TEST.summary есть, G не трогали наборы */
console.error("[soak " + SHARD + "] загрузка ок, " + TEST.summary);

/* ══════════════ дальше — свой бот, не харнесс ══════════════ */
const t0 = Date.now();
const budgetMs = BUDGET_MIN * 60000;
const known = new Map();   // key -> {count, first, last, example}
const stats = { shard: SHARD, iters: 0, jumps: 0, docks: 0, sells: 0, mines: 0, ore: 0, creditsEarned: 0, exceptions: 0, distinctKeys: 0, systemsVisited: 0 };
let evStream;
try { evStream = fs.createWriteStream(EVENTS_PATH, { flags: "a" }); } catch (e) { evStream = null; }

function keyOf(kind, text) {
  const norm = String(text).replace(/-?\d+(\.\d+)?/g, "#");
  return crypto.createHash("sha1").update(kind + "|" + norm).digest("hex").slice(0, 16);
}
function logEvent(kind, detail) {
  const text = detail.why || detail.msg || detail.mode || "";
  const key = keyOf(kind, text);
  const now = Date.now();
  let rec = known.get(key);
  const isNew = !rec;
  if (!rec) { rec = { count: 0, first: now, kind, text, samples: [] }; known.set(key, rec); stats.distinctKeys = known.size; }
  rec.count++; rec.last = now;
  /* один и тот же текст («раздела ТОРГОВЛИ нет») бьёт по многим разным
     координатам — ключ дедупа не видит место (иначе дедуп не сработал бы
     вовсе), так что образцы мест копим отдельно, не одним застывшим первым */
  if (detail.where && rec.samples.length < 5 && !rec.samples.includes(detail.where)) rec.samples.push(detail.where);
  if (evStream) evStream.write(JSON.stringify({ t: new Date(now).toISOString(), elapsed_s: Math.round((now - t0) / 1000), kind, ...detail }) + "\n");
  if (kind === "exception") stats.exceptions++;
  if (isNew) writeReport();   // новый вид находки — сразу видно в отчёте
}
function logExc(e, where) {
  logEvent("exception", { where, msg: (e && e.stack) ? String(e.stack).split("\n").slice(0, 4).join(" / ") : String(e) });
}
function writeReport() {
  const rows = [...known.values()].sort((a, b) => b.last - a.last);
  const lines = [];
  lines.push("Соук " + SHARD + " · бюджет " + BUDGET_MIN + " мин · прошло " + Math.round((Date.now() - t0) / 60000) + " мин");
  lines.push("итераций " + stats.iters + " · систем " + stats.systemsVisited + " · прыжков " + stats.jumps +
    " · стыковок " + stats.docks + " · продаж " + stats.sells + " · бурений " + stats.mines +
    " · руды " + stats.ore + " · заработано " + stats.creditsEarned + " · исключений " + stats.exceptions +
    " · находок различных " + rows.length);
  lines.push("");
  for (const r of rows) {
    lines.push("[" + r.kind + "] ×" + r.count + " · впервые " + new Date(r.first).toISOString() + " · последний " + new Date(r.last).toISOString());
    lines.push("  " + r.text);
    if (r.samples && r.samples.length) lines.push("  где (образцы из " + r.count + "): " + r.samples.join(" ;; "));
    lines.push("");
  }
  try { fs.writeFileSync(REPORT_PATH, lines.join("\n")); } catch (e) {}
  try { fs.writeFileSync(STATS_PATH, JSON.stringify(stats)); } catch (e) {}
}

/* ── прогулка по галактике ──
   Цель прыжка ищется вокруг ТЕКУЩЕГО «-,sy» и не дальше дальности прыжка
   (stat().jump) — иначе mapJump() честно откажет («далеко»/не хватит топлива),
   а не потому что нашёлся баг. Первый круг — непосещённая звезда, второй —
   любая (дальность в разы важнее новизны: короткий прыжок и без выбора). */
const visited = new Set();
function starNear(cx, cy, range, wantUnvisited) {
  /* дальность прыжка — евклидова (mapJump: Math.hypot), а не шахматная клетка:
     диагональ шахматного кольца r даёт до r·√2, и цель за пределом настоящей
     дальности была бы не багом, а промахом этого перебора (0.2 → 4.2 из 3) */
  const ring = Math.ceil(range);
  for (let r = 1; r <= ring; r++)
    for (let x = -r; x <= r; x++)
      for (let y = -r; y <= r; y++) {
        if (Math.max(Math.abs(x), Math.abs(y)) !== r) continue;
        if (Math.hypot(x, y) > range + .02) continue;
        const sx = cx + x, sy = cy + y, key = sx + "," + sy;
        if (wantUnvisited && visited.has(key)) continue;
        if (starAt(sx, sy)) return { sx, sy, key };
      }
  return null;
}
function markVisited(key) { visited.add(key); if (visited.size > 20000) { const first = visited.values().next().value; visited.delete(first); } }

function refuelSafety() {
  try {
    const st = stat();
    /* топливо и корпус — не то, что бот изучает: у бота нет цели «заправиться»
       (T.bot умеет прыжок/торговлю/добычу, но не бункеровку), а на старте
       заправки в 17/100 не хватает даже на соседний прыжок (мин. цена 22).
       Полный бак почаще — чтобы соук искал баги в мире, а не в нехватке бака. */
    if (G.fuel < st.fuelMax * .5) G.fuel = st.fuelMax;
    if (G.hull < st.hullMax * .3) G.hull = st.hullMax;
  } catch (e) {}
}

function doJump() {
  if (G.mode !== "system") G.mode = "system";   // прыгать можно только из полёта — карта/док сами не отпускают
  const range = Math.max(1, stat().jump);
  const target = starNear(G.sx, G.sy, range, true) || starNear(G.sx, G.sy, range, false);
  if (!target) { logEvent("stuck", { why: "в дальности прыжка (" + range + ") вовсе нет звёзд", where: G.sx + "," + G.sy }); resetWorld(); return; }
  const dist0 = Math.hypot(target.sx - G.sx, target.sy - G.sy);
  const need = Math.round(9 + dist0 * 13);
  if (G.fuel < need + 5) G.fuel = stat().fuelMax;   /* хватает не всем стартовым бакам даже на соседний сектор */
  const r = T.bot("jump", { sx: target.sx, sy: target.sy });
  stats.jumps++;
  if (!r.ok) logEvent("bug", { why: "прыжок " + G.sx + "," + G.sy + " → " + target.sx + "," + target.sy + " (" + dist0.toFixed(1) + " из " + range + "): " + r.why, where: "jump" });
  markVisited(target.key);
  stats.systemsVisited = visited.size;
}

/* ── станция: только «долетел/состыковался», без «продал/отстыковался» ──
   T.bot("sell") и T.bot("undock") жмут по-настоящему нарисованным кнопкам
   (T.tap → controls() → реальный DOM/канва). Проверено живым Хромом на этой же
   сборке (127.0.0.1:8798, station→dock→sell→undock — все ok:true, кредиты
   росли): под node-заглушкой (test-node.js) кнопки станции не находятся вовсе
   — это дыра стенда, не баг игры (те же наборы размечены tier:"browser" не
   зря, см. docs/DESIGN-tests.md). Соук держит то, что честно у node: полёт,
   стыковку по клавише. Груз «продаётся» напрямую (T.give-стиль), чтобы не
   плодить фальшивые находки и не стоять на месте всю ночь. */
function doStationLoop() {
  if (!G.sys.station) { doJump(); return; }
  if (G.mode === "system") { const r1 = T.bot("station"); if (!r1.ok) { logEvent("bug", { why: r1.why, where: "station " + G.sx + "," + G.sy }); doJump(); return; } }
  if (G.mode === "system") { const r2 = T.bot("dock"); if (!r2.ok) { logEvent("bug", { why: r2.why, where: "dock " + G.sx + "," + G.sy }); doJump(); return; } }
  stats.docks++;
  if (G.mode === "dock") {
    for (const k of RES_KEYS) if (G.cargo[k] > 0) { stats.creditsEarned += G.cargo[k]; G.cargo[k] = 0; }
    stats.sells++;
    G.mode = "system";   /* обход настоящей ОТСТЫКОВКИ (тап) — см. комментарий выше */
  }
  doJump();
}

const badPlanets = new Set();   /* планеты, где бурение раз за разом ничего не дало — не биться туда вечно */
function doPlanetLoop() {
  const skey = G.sx + "," + G.sy;
  const hasSolid = (G.sys.planets || []).some(p => p.type !== "gas");
  if (!hasSolid || badPlanets.has(skey)) { doJump(); return; }
  const r1 = T.bot("planet");
  if (!r1.ok) { logEvent("bug", { why: r1.why, where: "planet " + G.sx + "," + G.sy }); doJump(); return; }
  const r2 = T.bot("land");
  if (!r2.ok) { logEvent("bug", { why: r2.why, where: "land " + G.sx + "," + G.sy }); doJump(); return; }
  const oreBefore = held();
  let tries = 0, cargoMax = stat().cargoMax;
  while (G.mode === "surface" && held() < cargoMax && tries++ < 25) {
    const before = held();
    const r = T.bot("mine");
    if (r.ok) { stats.mines++; stats.ore += held() - before; }
    else { if (!/трюм полон|залежей на полосе нет/.test(r.why)) logEvent("bug", { why: r.why, where: "mine " + G.sx + "," + G.sy }); break; }
  }
  const gained = held() - oreBefore;
  if (G.mode === "surface") { const r3 = T.bot("ship"); if (!r3.ok) logEvent("bug", { why: r3.why, where: "ship " + G.sx + "," + G.sy }); }
  if (G.mode === "surface") { const r4 = T.bot("launch"); if (!r4.ok) { logEvent("bug", { why: r4.why, where: "launch " + G.sx + "," + G.sy }); resetWorld(); return; } }
  /* пустой визит (0 руды) — не «не повезло с залежью» (та ветка уже отфильтрована
     регэкспом выше), а помеха вроде занятой достопримечательностью подсказки
     ДЕЙСТВИЯ; мир детерминирован от координат — второй заход даст то же самое,
     так что планета сразу в чёрный список, а не в бесконечный повтор */
  if (gained <= 0) { badPlanets.add(skey); doJump(); } else if (Math.random() < .3) doJump();
}

function step1() {
  refuelSafety();
  const mode = G.mode;
  if (mode === "system") {
    if (held() > 0 && G.sys.station) doStationLoop();
    else if ((G.sys.planets || []).some(p => p.type !== "gas") && held() < stat().cargoMax) doPlanetLoop();
    else doJump();
  } else if (mode === "dock") {
    doStationLoop();
  } else if (mode === "surface") {
    doPlanetLoop();
  } else if (mode === "map") {
    G.mode = "system";   /* остаток неудачного bot("jump") — сам jump() уже залогирован в doJump() */
  } else {
    logEvent("unhandled_mode", { mode, why: "у бота нет цели для режима «" + mode + "» — восстановление через resetWorld" });
    try { T.calm(); } catch (e) {}
    if (G.mode === mode) resetWorld();
  }
}

resetWorld();
try { rndSeed(1000 + SHARD); } catch (e) {}
/* каждый шард — своя область неба: иначе шесть шардов топчутся у (0,0) и
   находят одно и то же (галактика — функция координат, не зерна). Прямая
   телепортация, как в 91zzzzzzzzc-трипс (G.sx=…;G.sy=…;G.sys=getSystem(…)) —
   не «прыжок» игрока, а разбег для ночного обхода. */
const seed0 = starNear(SHARD * 977 - 2000, SHARD * 431 - 1000, 40, false) || { sx: 0, sy: 0 };
G.sx = seed0.sx; G.sy = seed0.sy; G.sys = getSystem(G.sx, G.sy);
markVisited(G.sx + "," + G.sy);
doJump();
console.error("[soak " + SHARD + "] старт, бюджет " + BUDGET_MIN + " мин → " + REPORT_PATH);
let lastReport = 0;
(function loop() {
  const elapsed = Date.now() - t0;
  if (elapsed >= budgetMs) { writeReport(); console.error("[soak " + SHARD + "] бюджет исчерпан, итераций " + stats.iters); process.exit(0); return; }
  const batchEnd = Date.now() + 200;   // отдаём цикл событий каждые ~200мс, не блокируем процесс насмерть
  while (Date.now() < batchEnd && Date.now() - t0 < budgetMs) {
    try { step1(); } catch (e) { logExc(e, "step1"); try { resetWorld(); } catch (e2) {} }
    stats.iters++;
  }
  if (Date.now() - lastReport > 60000) { lastReport = Date.now(); writeReport(); }
  setImmediate(loop);
})();
