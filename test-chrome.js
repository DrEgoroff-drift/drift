/* ══════════════ прогон в Хроме через протокол отладки (27.09.2026) ══════════════
   Раньше test.ps1 звал Chrome с --dump-dom --virtual-time-budget и ждал, пока тот
   выйдет сам. На новом компе обычный Chrome после отчёта висел ещё 70–120 с: на
   выходе он ждёт службу обновлений Google. Отчёт был готов на 10–20-й секунде, а
   ярус -Browser шёл 146 с. Chrome for Testing (сборка без обновлялки, версия
   закреплена) --dump-dom не выполняет вовсе. Поэтому страницу ведём сами, как
   Puppeteer: тот же headless, то же виртуальное время (Emulation.setVirtualTimePolicy,
   на нём же стоит и сам --virtual-time-budget). DOM забираем в тот миг, когда бюджет
   вышел, и закрываем браузер командой Browser.close.

   Запуск (из test.ps1, по одному на часть):
     node test-chrome.js --chrome=exe --url=адрес --dom=файл --err=файл --profile=папка --win=W,H [--budget=мс]
   Без --budget часы настоящие (-Times): DOM забирается, когда отчёт дописан.
   В --err идут строки консоли страницы («→ имя» перед каждым набором — по ним
   test.ps1 называет зависшую часть) и собственный лог Хрома.
   Код выхода: 0 — DOM записан; 2 — браузер не встал, страница упала или сокет закрылся. */
"use strict";
const fs = require("fs"), { spawn, execFileSync } = require("child_process");

const opt = (n) => { const a = process.argv.find(x => x.startsWith("--" + n + "=")); return a ? a.slice(n.length + 3) : ""; };
const EXE = opt("chrome"), PAGE_URL = opt("url"), DOM = opt("dom"), ERR = opt("err"), PROFILE = opt("profile");
const WIN = opt("win") || "1280,800", BUDGET = +opt("budget") || 0;
if (!EXE || !PAGE_URL || !DOM || !ERR || !PROFILE) { console.error("usage: node test-chrome.js --chrome= --url= --dom= --err= --profile= [--win=W,H] [--budget=ms]"); process.exit(2); }

const t0 = Date.now();
// дописываем и закрываем файл на каждой строке: test.ps1 читает его, пока часть ещё идёт
const log = (s) => { try { fs.appendFileSync(ERR, "[+" + ((Date.now() - t0) / 1000).toFixed(3) + "s] " + s + "\n"); } catch (e) {} };

/* ── браузер ──
   --disable-field-trial-config: сборка без марки Google (Chrome for Testing) сама
   включает экспериментальные функции из тестового набора Chromium, и 27.09 с ними
   открытка переставала повторяться попиксельно (6 провалов «кадр повторяется в
   точности»). С флагом функции те же, что у обычного Chrome; ему самому флаг ничего не меняет. */
const chrome = spawn(EXE, ["--headless=new", "--no-sandbox", "--window-size=" + WIN, "--user-data-dir=" + PROFILE,
  "--no-first-run", "--no-default-browser-check", "--disable-field-trial-config", "--remote-debugging-port=0", "--enable-logging=stderr", "about:blank"],
  { stdio: ["ignore", "ignore", "pipe"] });
let done = false, ws = null, seen = "";
chrome.on("error", (e) => finish(2, "chrome did not start: " + e.message));
chrome.on("exit", (c) => { if (!done) finish(2, "chrome exited on its own (code " + c + ") before the page was read"); });
chrome.stderr.on("data", (d) => {
  const s = d.toString();
  try { fs.appendFileSync(ERR, s); } catch (e) {}
  if (ws) return;
  seen += s;
  const m = seen.match(/DevTools listening on (ws:\/\/\S+)/);
  if (m) connect(m[1]).catch((e) => finish(2, "DevTools: " + e.message));
});
setTimeout(() => { if (!ws) finish(2, "chrome gave no DevTools endpoint in 30 s"); }, 30000);

function finish(code, why) {
  if (done) return;
  done = true;
  if (why) { log(why); if (code) console.error("test-chrome: " + why); }
  const out = () => process.exit(code);
  if (chrome.exitCode !== null || chrome.signalCode !== null) return out();
  chrome.once("exit", out);
  try { if (ws && ws.readyState === 1) ws.send(JSON.stringify({ id: 1e9, method: "Browser.close" })); } catch (e) {}
  // сборка без обновлялки закрывается за долю секунды; не закрылась за 5 с — гасим своё дерево процессов
  setTimeout(() => { try { execFileSync("taskkill", ["/PID", String(chrome.pid), "/T", "/F"], { stdio: "ignore" }); } catch (e) {} out(); }, 5000);
}

/* ── протокол: запрос по номеру, события по имени ── */
let nextId = 1;
const pending = new Map(), on = {};
function send(method, params, sessionId) {
  const id = nextId++;
  ws.send(JSON.stringify(sessionId ? { id, method, params: params || {}, sessionId } : { id, method, params: params || {} }));
  return new Promise((ok, bad) => pending.set(id, { ok, bad, method }));
}
function onMessage(ev) {
  const m = JSON.parse(typeof ev.data === "string" ? ev.data : Buffer.from(ev.data).toString());
  if (m.id) {
    const p = pending.get(m.id);
    if (!p) return;
    pending.delete(m.id);
    if (m.error) p.bad(new Error(p.method + ": " + m.error.message)); else p.ok(m.result);
    return;
  }
  if (on[m.method]) on[m.method](m.params || {});
}

const DUMP = "(document.doctype ? new XMLSerializer().serializeToString(document.doctype) + '\\n' : '') + document.documentElement.outerHTML";
async function readDom(S) {
  if (done) return;
  try {
    const r = await send("Runtime.evaluate", { expression: DUMP, returnByValue: true }, S);
    if (typeof r.result.value !== "string") throw new Error((r.exceptionDetails && r.exceptionDetails.text) || "no DOM string");
    fs.writeFileSync(DOM, r.result.value, "utf8");
    finish(0);
  } catch (e) { finish(2, "could not read the DOM: " + e.message); }
}
// настоящие часы (-Times): бюджета нет, конец — дописанный заголовок отчёта
const REPORT_DONE = "(() => { const e = document.getElementById('testout'); return !!e && /^(ALL GREEN|FAILED \\d+) · /.test(e.textContent); })()";
async function waitReport(S) {
  while (!done) {
    const r = await send("Runtime.evaluate", { expression: REPORT_DONE, returnByValue: true }, S).catch(() => null);
    if (r && r.result.value) return readDom(S);
    await new Promise((ok) => setTimeout(ok, 250));
  }
}

async function connect(url) {
  ws = new WebSocket(url);
  ws.onmessage = onMessage;
  ws.onclose = () => { if (!done) finish(2, "DevTools socket closed before the page was read"); };
  await new Promise((ok, bad) => { ws.onopen = ok; ws.onerror = () => bad(new Error("socket error")); });
  const { targetInfos } = await send("Target.getTargets");
  const tab = targetInfos.find((t) => t.type === "page") || await send("Target.createTarget", { url: "about:blank" });
  const { sessionId: S } = await send("Target.attachToTarget", { targetId: tab.targetId, flatten: true });
  const text = (a) => (a.value !== undefined ? String(a.value) : a.description || a.type);
  on["Runtime.consoleAPICalled"] = (p) => log("CONSOLE " + JSON.stringify(p.args.map(text).join(" ")));
  on["Runtime.exceptionThrown"] = (p) => log("EXCEPTION " + ((p.exceptionDetails.exception && p.exceptionDetails.exception.description) || p.exceptionDetails.text));
  on["Inspector.targetCrashed"] = () => finish(2, "the page crashed (renderer gone)");
  await Promise.all([send("Runtime.enable", {}, S), send("Page.enable", {}, S), send("Inspector.enable", {}, S)]);
  if (BUDGET) {
    on["Emulation.virtualTimeBudgetExpired"] = () => readDom(S);
    // часы стоят, пока страница не поехала: пустая вкладка иначе сжигает весь бюджет вхолостую
    await send("Emulation.setVirtualTimePolicy", { policy: "pause" }, S);
    await send("Page.navigate", { url: PAGE_URL }, S);
    await send("Emulation.setVirtualTimePolicy", { policy: "pauseIfNetworkFetchesPending", budget: BUDGET }, S);
  } else {
    on["Page.loadEventFired"] = () => waitReport(S);
    await send("Page.navigate", { url: PAGE_URL }, S);
  }
}
