"""jank.py — long frames on a real video card, scene by scene (the lab's «frames» unit).

    python lab/jank.py [--scenes surface,cave,...] [--w 1280 --h 800] [--secs 8] [--port 9692]

The author, 15.10: «длинные кадры». The test page has no clock (virtual time fast-forwards timers), so
this runs the built drift.html in our own headless Chrome on the real GPU, on the real clock. Each scene
is a stand scene (docs/mkview.ps1, ?s=…). A recorder on rAF writes, per frame: the interval, the game's
own JS time (FRAME_JS) and how long the GPU took to finish that frame's work (onSubmittedWorkDone).
While it records, the player walks right and back (real key events), so streaming content is paid too.

Judged: «вход» — the first 2 s after the scene is up (shader compiles, bakes); «ход» — the rest.
A frame in «ход» over 100 ms, or more than 2 % of «ход» frames over 33 ms, is red; a frame in «вход»
over 250 ms is red. Each red line names who ate the frame: JS (FRAME_JS), GPU, or neither (GC,
compositor, an await). Output is the lab's text format: a head line, then «  ✗ suite · msg» lines.
Only our own Chrome profile is ever started or killed (--user-data-dir), never the user's browser.
"""
import argparse, json, os, re, subprocess, sys, tempfile, time, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "docs"))
import shot  # WS, ev, CHROMES, BLOCK, CATCH, stand_tail

SCENES = ["surface", "landing", "things", "night", "cave", "dig", "shaft", "map", "system", "dock", "hq", "raid"]
ENTRY_MS, RUN_MAX, LONG, LONG_SHARE, ENTRY_MAX = 2000, 100, 33.4, .02, 250

REC = """<script>
window.__J={on:false,t0:0,f:[]};
(function(){var lt=0;function tick(t){requestAnimationFrame(tick);
  if(lt&&__J.on){var js=-1;try{js=FRAME_JS;}catch(e){}
    var r={t:t-__J.t0,d:t-lt,js:js,m:(typeof G!=="undefined"&&G.mode)||"?",g:-1};__J.f.push(r);
    /* живой кадр: камера, зум, герой, светило, ошибки видеокарты, память — для законов плавности */
    try{r.gt=G.t;r.vx=G.viewX;r.vy=G.viewY;r.k=G.viewK;var H=G.mode==="surface"?G.surf:G.mode==="cave"?G.cave:G.mode==="dig"?G.dig:null;
      if(H){r.hx=H.x;r.hy=H.y;}
      if(G.mode==="surface"&&typeof PLN!=="undefined"&&PLN.sun&&PLN.sun.dir)r.sun=[PLN.sun.dir[0],PLN.sun.dir[1],PLN.sun.dir[2]];
      r.ge=GPU.errs||0;if(performance.memory)r.mem=performance.memory.usedJSHeapSize;}catch(e){}
    try{if(typeof GPU!=="undefined"&&GPU.dev){var s=performance.now();GPU.dev.queue.onSubmittedWorkDone().then(function(){r.g=performance.now()-s;});}}catch(e){}}
  lt=t;}
requestAnimationFrame(tick);})();
</script>"""


def page(tail, root):
    html = open(os.path.join(root, "drift.html"), encoding="utf-8").read()
    s = html.find("<script")
    html = html[:s] + "<script>var DRIFT_SEED=7;</script>" + html[s:]
    cut = html.rfind("</body>")
    return html[:cut] + tail + "\n" + REC + "</body></html>"


def key(ws, k, down):
    code = {"ArrowRight": 39, "ArrowLeft": 37}[k]
    ws.call("Input.dispatchKeyEvent", type="rawKeyDown" if down else "keyUp", key=k, code=k,
            windowsVirtualKeyCode=code, nativeVirtualKeyCode=code)


def who(fr):
    js, g = fr.get("js", -1), fr.get("g", -1)
    if js >= .5 * fr["d"]: return "JS %d мс" % js
    if g >= .5 * fr["d"]: return "видеокарта %d мс" % g
    return "ни JS (%d), ни видеокарта (%d) — сборка мусора или ожидание" % (max(js, 0), max(g, 0))


def judge(sc, F, out):
    entry = [f for f in F if f["t"] < ENTRY_MS]
    run = [f for f in F if f["t"] >= ENTRY_MS]
    if len(run) < 30:
        out.append(("кадры · " + sc, "кадров почти нет: %d за ход — сцена не крутится" % len(run))); return
    ds = sorted(f["d"] for f in run)
    p50, p95, mx = ds[len(ds) // 2], ds[int(len(ds) * .95)], ds[-1]
    longs = [f for f in run if f["d"] > LONG]
    worst = max(run, key=lambda f: f["d"])
    ew = max(entry, key=lambda f: f["d"]) if entry else None
    print("%-8s %-8s кадров %4d  p50 %5.1f  p95 %5.1f  макс %6.1f  >33 мс %3d  вход макс %6.1f  JS p50 %4.1f" % (
        sc, worst["m"], len(run), p50, p95, mx, len(longs), ew["d"] if ew else 0,
        sorted(max(f["js"], 0) for f in run)[len(run) // 2]))
    if mx > RUN_MAX:
        out.append(("кадры · " + sc, "на ходу кадр %d мс в режиме %s — съел: %s" % (mx, worst["m"], who(worst))))
    if len(longs) > LONG_SHARE * len(run):
        out.append(("кадры · " + sc, "на ходу %d из %d кадров дольше 33 мс (%s)" % (len(longs), len(run),
                    ", ".join(sorted({who(f).split(" ")[0] for f in longs})))))
    if ew and ew["d"] > ENTRY_MAX:
        out.append(("кадры · " + sc, "вход: кадр %d мс в режиме %s — съел: %s" % (ew["d"], ew["m"], who(ew))))
    smooth(sc, run, out)


def smooth(sc, run, out):
    """законы живого кадра — по кадрам, где мир сдвинулся (G.t вырос): rAF бывает чаще такта игры"""
    import math
    W = [f for i, f in enumerate(run) if i and f.get("gt") is not None and f["gt"] != run[i - 1].get("gt")]
    if len(W) < 30: return
    med = lambda A: sorted(A)[len(A) // 2] if A else 0
    def jumps(key, lim_abs):
        # скорость на тик мира, а не сдвиг за кадр: на 240 Гц кадр несёт то .5, то 1.5 тика (квант 28-loop),
        # и сдвиг за кадр «прыгает» без всякого рывка на экране мира
        d = [(b[key] - a[key]) / (b["gt"] - a["gt"]) for a, b in zip(W, W[1:])
             if a.get(key) is not None and b.get(key) is not None and b["gt"] > a["gt"]]
        if len(d) < 10: return 0, 0, 0
        dd = [abs(b - a) for a, b in zip(d, d[1:])]
        m = med([abs(x) for x in d])
        bad = [x for x in dd if x > max(lim_abs, 3 * m)]
        return len(bad), max(dd), m
    n, mx, m = jumps("vx", 2.0)
    if n > .01 * len(W): out.append(("кадры · " + sc, "камера рывком: %d из %d кадров (скачок %.1f при обычном шаге %.2f)" % (n, len(W), mx, m)))
    n, mx, m = jumps("hx", 2.0)
    if n > .01 * len(W): out.append(("кадры · " + sc, "герой рывком: %d из %d кадров (скачок %.1f при шаге %.2f)" % (n, len(W), mx, m)))
    ks = [f.get("k") for f in W if f.get("k")]
    kj = [abs(b / a - 1) for a, b in zip(ks, ks[1:]) if a]
    if kj and max(kj) > .02: out.append(("кадры · " + sc, "зум рывком: за кадр %.1f %%" % (100 * max(kj))))
    S = [f["sun"] for f in W if f.get("sun")]
    if len(S) > 20:
        ang = [math.degrees(math.acos(max(-1, min(1, sum(x * y for x, y in zip(a, b)))))) for a, b in zip(S, S[1:])]
        m = med([x for x in ang if x > 0]) or 0
        bad = [x for x in ang if x > .05 and x > 5 * m]
        if bad: out.append(("кадры · " + sc, "свет рывком на живом кадре: %d скачков до %.2f° (обычный шаг %.4f°)" % (len(bad), max(bad), m)))
    ge = [f.get("ge", 0) for f in run]
    if ge and ge[-1] > ge[0]: out.append(("кадры · " + sc, "ошибки видеокарты на ходу: +%d" % (ge[-1] - ge[0])))
    M = [(f["t"], f["mem"]) for f in run if f.get("mem")]
    if len(M) > 60:
        q = len(M) // 4
        lo = [min(v for _, v in M[i * q:(i + 1) * q]) for i in range(4)]   # нижняя кромка по четвертям: пила мусора её не двигает
        a, b = lo[0], lo[3]
        if b - a > 8e6 and lo[0] < lo[1] < lo[2] < lo[3]: out.append(("кадры · " + sc, "память растёт: +%.1f МБ за %.0f с хода (по нижней кромке)" % ((b - a) / 1e6, (M[-1][0] - M[0][0]) / 1000)))


def run_scene(a, pg, sc, bad, plant=None):
    """одна сцена в своей вкладке: поднять, дождаться ровного режима, записать вход и ход, рассудить"""
    req = urllib.request.Request("http://127.0.0.1:%d/json/new?about:blank" % a.port, method="PUT")
    t = json.load(urllib.request.urlopen(req, timeout=10))
    ws = shot.WS(t["webSocketDebuggerUrl"], 120)
    try:
        ws.call("Emulation.setDeviceMetricsOverride", width=a.w, height=a.h, deviceScaleFactor=1, mobile=False)
        ws.call("Network.enable"); ws.call("Network.setBlockedURLs", urls=shot.BLOCK)
        ws.call("Page.enable"); ws.call("Page.addScriptToEvaluateOnNewDocument", source=shot.CATCH)
        ws.call("Page.navigate", url="file:///" + pg.replace("\\", "/") + "?s=" + sc)
        t0, up = time.time(), False
        while time.time() - t0 < 30:
            up = shot.ev(ws, "typeof G!=='undefined'&&G.running&&typeof GPU!=='undefined'&&(GPU.ok||GPU.none)&&"
                             "document.documentElement.hasAttribute('data-alive')")
            if up is True: break
            time.sleep(.2)
        if up is not True:
            bad.append(("кадры · " + sc, "сцена не поднялась за 30 с")); return
        # стенд ставит сцену своим таймером (land(): ландшафт, вход в режим) — это секунда стенда, а не
        # игры; пишем с той поры, как режим держится 1 с
        m0, ts = None, time.time()
        while time.time() - t0 < 45:
            m = shot.ev(ws, "G.mode")
            if m != m0: m0, ts = m, time.time()
            elif time.time() - ts >= 1: break
            time.sleep(.1)
        gpu = shot.ev(ws, "!!GPU.ok")
        if plant: shot.ev(ws, plant)
        shot.ev(ws, "__J.t0=performance.now();__J.on=true;")
        time.sleep(ENTRY_MS / 1000)
        half = a.secs / 2
        key(ws, "ArrowRight", True); time.sleep(half); key(ws, "ArrowRight", False)
        key(ws, "ArrowLeft", True); time.sleep(half); key(ws, "ArrowLeft", False)
        time.sleep(.3)
        st = shot.ev(ws, "__J.on=false;JSON.stringify({f:__J.f,crash:document.body.innerText.indexOf('СБОЙ')>=0,"
                         "errs:(window.__errs||[]).filter(function(e){return e[0]!=='W'}).slice(0,4)})")
        if not isinstance(st, str):
            bad.append(("кадры · " + sc, "запись не прочиталась: %s" % st)); return
        d = json.loads(st)
        if not gpu: bad.append(("кадры · " + sc, "видеокарты нет — замер на 2D не годится"))
        if d["crash"]: bad.append(("кадры · " + sc, "СБОЙ на экране"))
        for e in d["errs"]: bad.append(("кадры · " + sc, "ошибка страницы: " + re.sub(r"\s+", " ", e)[:160]))
        judge(sc, d["f"], bad)
    finally:
        try: urllib.request.urlopen("http://127.0.0.1:%d/json/close/%s" % (a.port, t["id"]), timeout=5)
        except Exception: pass


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-plant", action="store_true", help="skip the planted-defect run that proves the live-frame laws see")
    ap.add_argument("--scenes", default=",".join(SCENES))
    ap.add_argument("--w", type=int, default=1280)
    ap.add_argument("--h", type=int, default=800)
    ap.add_argument("--secs", type=float, default=8)
    ap.add_argument("--port", type=int, default=9692)
    ap.add_argument("--root", default=ROOT, help="the checkout whose drift.html and stand scenes are measured")
    a = ap.parse_args()
    shot.HERE = os.path.join(a.root, "docs")   # stand_tail() reads docs/mkview.ps1 of that checkout
    chrome = next((c for c in shot.CHROMES if os.path.exists(c)), None)
    if not chrome: print("FAILED 1 · passed 0 · suites 1 of 1\n\n  ✗ кадры · нет Chrome"); return 1
    tmp = tempfile.mkdtemp(prefix="drift-jank-")
    pg = os.path.join(tmp, "jank.html")
    open(pg, "w", encoding="utf-8").write(page(shot.stand_tail(), a.root))
    prof = os.path.join(tempfile.gettempdir(), "drift-jank-%d" % a.port)
    proc = subprocess.Popen([chrome, "--headless=new", "--remote-debugging-port=%d" % a.port, "--user-data-dir=" + prof,
                             "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--mute-audio",
                             "--enable-unsafe-webgpu", "--enable-precise-memory-info", "--window-size=%d,%d" % (a.w, a.h), "about:blank"],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    bad, ok = [], 0
    try:
        for _ in range(60):
            try: urllib.request.urlopen("http://127.0.0.1:%d/json/version" % a.port, timeout=2); break
            except Exception: time.sleep(.25)
        for sc in [s for s in a.scenes.split(",") if s]:
            n0 = len(bad); run_scene(a, pg, sc, bad)
            if len(bad) == n0: ok += 1
        # подсадка: поверхность, где герой раз в полсекунды прыгает на 40 и видеокарта «ошибается» — оба закона
        # обязаны это увидеть, иначе законы живого кадра слепы (как подсадки зрения)
        if not a.no_plant:
            pb = []
            run_scene(a, pg, "surface", pb, plant="setInterval(function(){try{G.surf.x+=40;GPU.errs=(GPU.errs||0)+1;}catch(e){}},500);")
            got = " ".join(m for _, m in pb)
            print("подсадка: " + ("; ".join(m[:60] for _, m in pb) or "ничего не поймано"))
            for law in ("герой рывком", "ошибки видеокарты"):
                if law not in got: bad.append(("кадры · подсадка", "СЛЕПО: закон «%s» не поймал подсаженный брак" % law))
    finally:
        proc.kill()
        import shutil; shutil.rmtree(tmp, ignore_errors=True)
    n = len(a.scenes.split(","))
    print()
    print(("FAILED %d · passed %d · suites %d of %d" % (len(bad), ok, n, n)) if bad else ("ALL GREEN · passed %d · suites %d of %d" % (ok, n, n)))
    for s, m in bad: print("  ✗ %s · %s" % (s, m))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
