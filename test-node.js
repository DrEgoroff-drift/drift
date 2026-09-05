/* ══════════════ прогон без браузера (0.359.3) ══════════════
   Автор, 06.09.2026: «в разработке никто хром не запускает». Этот файл — тот же
   tests.html, но под Node: скрипты страницы читаются из tests.html и выполняются
   в этом же процессе поверх заглушек. Заглушки — не эмуляция браузера, а глухая
   стена: любой элемент существует, любая канва рисует в никуда, любой замер
   даёт ноль. Значит, здесь ходят наборы про ЛОГИКУ — формулы, сейв, генераторы,
   экономика, сюжет, — а всё, что меряет пиксели и вёрстку, обязано жить в
   ярусе Хрома (test.ps1 -Browser). Кто ошибётся ярусом — краснеет, а не молчит:
   заглушка возвращает ноль, а не «похоже на правду».

   Запуск:  tools\node\node tests\node-run.js [--full] [--only=текст] [--verbose]
   Отчёт:   строка-заголовок, провалы, по группам. Код выхода 1 при провале. */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");

const args = process.argv.slice(2);
const flag = (n) => args.includes("--" + n);
const opt = (n) => { const a = args.find(x => x.startsWith("--" + n + "=")); return a ? a.slice(n.length + 3) : ""; };

/* ── элемент: всё есть, ничего не меряется ── */
const NOOP = () => {};
/* один буфер на все getImageData: печь грунта просит мегабайты на кадр, и честная
   аллокация делала прогон часовым; запись мимо длины типизированный массив молча глотает */
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
  /* только то, что игра реально спрашивает: #id, .class, tag, и их запятые */
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

/* ── документ ── */
const byId = new Map();
const document = new El("#document");
document.nodeType = 9; document.body = new El("body"); document.head = new El("head"); document.documentElement = new El("html");
document.documentElement.appendChild(document.head); document.documentElement.appendChild(document.body);
/* разметка страницы — из самой tests.html, простым разбором тегов: id, классы,
   data-*, вложенность настоящие; текст и стили не нужны. Чего в разметке нет,
   getElementById заводит на месте (иначе половина модулей падает на null) */
function parseBody(src) {
  const m = src.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  parseInto(document.body, m ? m[1] : "");
}
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
  /* чего нет в разметке — заводим: модули при загрузке хватают .pads, .rail и
     прочее без проверки; пустой элемент лучше, чем null и мёртвый модуль */
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
const search = (flag("full") ? "full=1&" : "") + (opt("only") ? "only=" + encodeURIComponent(opt("only")) + "&" : "") + (flag("verbose") ? "verbose=1" : "");
const G0 = globalThis;
G0.TEST_NODE = true; if (flag("trace")) G0.TEST_TRACE = true;
const SHIM = {
  window: G0, self: G0, document, HTMLElement: El, HTMLCanvasElement: El, HTMLInputElement: El, HTMLButtonElement: El, Element: El, Node: El, Image: El, OffscreenCanvas: El, Audio: El,
  localStorage: new Storage(), sessionStorage: new Storage(),
  location: { protocol: "file:", search: search ? "?" + search : "", hash: "", href: "file:///tests.html", hostname: "", host: "", pathname: "/tests.html", origin: "null", reload: NOOP, replace: NOOP, assign: NOOP },
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
  Notification: undefined, speechSynthesis: undefined, SpeechSynthesisUtterance: undefined, AudioContext: undefined, webkitAudioContext: undefined, caches: undefined, indexedDB: undefined,
  KeyboardEvent: class { constructor(t, o) { Object.assign(this, { type: t }, o || {}); } preventDefault() {} stopPropagation() {} },
  MouseEvent: class { constructor(t, o) { Object.assign(this, { type: t }, o || {}); } preventDefault() {} stopPropagation() {} },
  PointerEvent: class { constructor(t, o) { Object.assign(this, { type: t }, o || {}); } preventDefault() {} stopPropagation() {} },
  TouchEvent: class { constructor(t, o) { Object.assign(this, { type: t }, o || {}); } preventDefault() {} stopPropagation() {} },
  CustomEvent: class { constructor(t, o) { Object.assign(this, { type: t }, o || {}); } preventDefault() {} stopPropagation() {} },
  Event: class { constructor(t, o) { Object.assign(this, { type: t }, o || {}); } preventDefault() {} stopPropagation() {} },
};
for (const k of Object.keys(SHIM)) Object.defineProperty(G0, k, { value: SHIM[k], writable: true, configurable: true, enumerable: true });
/* окно-ссылки: window.innerWidth === innerWidth, потому что window === globalThis */

/* ── скрипты страницы: ровно то, что тесты в Хроме, и в том же порядке ── */
const html = fs.readFileSync(path.join(__dirname, "tests.html"), "utf8");
if (!html.includes("TEST_SUITES")) { console.error("tests.html без тестов — сначала build.ps1"); process.exit(2); }
parseBody(html); if (flag("trace")) console.error("[node-run] разметка: элементов " + byId.size);
const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
process.on("uncaughtException", (e) => { /* как window.onerror: сторож кадра считает, а прогон идёт */ if (typeof crashSay === "function") { try { crashSay(e, "вне кадра"); return; } catch (_) {} } console.error("UNCAUGHT", e && e.stack || e); });
process.on("unhandledRejection", (e) => { if (typeof crashSay === "function") { try { crashSay(e, "обещание"); } catch (_) {} } });
document.scripts = scripts.map(t => ({ textContent: t, src: "" }));
const t0 = Date.now();
try {
  for (let i = 0; i < scripts.length; i++) { if (flag("trace")) console.error("[node-run] скрипт " + (i + 1) + "/" + scripts.length); vm.runInThisContext(scripts[i], { filename: "tests.html#" + (i + 1) }); }

} catch (e) { console.error("сборка не загрузилась под Node: " + (e && e.stack || e)); process.exit(2); }

/* ── ждём отчёт ── */
const tick = setInterval(() => {
  if (typeof TEST === "undefined" || !TEST.summary) { if (Date.now() - t0 > 240000) { console.error("отчёта нет за четыре минуты"); process.exit(2); } return; }
  clearInterval(tick);
  const sec = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(TEST.summary + " · node · " + sec + " с");
  if (TEST.failed.length) { console.log("ПРОВАЛЫ:"); for (const f of TEST.failed) console.log("  ✗ " + f); }
  for (const l of TEST.lines) if (l.startsWith("ПО ГРУППАМ")) console.log(l);
  if (flag("verbose")) console.log(TEST.lines.join("\n"));
  process.exit(TEST.fail ? 1 : 0);
}, 20);
