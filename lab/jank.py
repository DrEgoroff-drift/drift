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
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import noise  # сторож шума: чужие хромы и процессор

WALK = {"dig": ("ArrowDown", "ArrowLeft")}
SCENES = ["surface", "landing", "things", "night", "cave", "dig", "shaft", "map", "system", "dock", "hq", "raid"]
ENTRY_MS, RUN_MAX, LONG, LONG_SHARE, ENTRY_MAX = 2000, 100, 33.4, .02, 250

REC = """<script>
window.__J={on:false,t0:0,f:[],lt:[],pp:[],la:[]};
/* конвейер или шейдер, собранный на ходу, — рывок при первой встрече (shader stutter): считаем каждую сборку */
try{["createRenderPipeline","createComputePipeline","createShaderModule","createRenderPipelineAsync","createComputePipelineAsync"].forEach(function(n){
  var o=GPUDevice.prototype[n];if(!o)return;GPUDevice.prototype[n]=function(){var s=performance.now(),r=o.apply(this,arguments);
    if(__J.on)__J.pp.push([s-__J.t0,n,performance.now()-s]);return r;};});}catch(e){}
/* очередь видеокарты: отправки и загрузки (байты) — кадр, что ждёт процесс видеокарты без JS, ждёт вот это */
__J.q=[];
try{[["submit",function(a){return (a[0]||[]).length;}],["writeBuffer",function(a){var d=a[2];return d&&(a[4]!=null?a[4]*(d.BYTES_PER_ELEMENT||1):d.byteLength)||0;}],
  ["writeTexture",function(a){var s=a[3]||{};return (s.width||s[0]||0)*(s.height||s[1]||1)*4;}],["copyExternalImageToTexture",function(a){var s=a[2]||{};return (s.width||s[0]||0)*(s.height||s[1]||1)*4;}]].forEach(function(p){
  var o=GPUQueue.prototype[p[0]];if(!o)return;GPUQueue.prototype[p[0]]=function(){if(__J.on){var s=performance.now(),r=o.apply(this,arguments);var e=[s-__J.t0,p[0],p[1](arguments),performance.now()-s];
    /* копия 2D-холста в текстуру: кто копирует (три верхние функции стека) и размер источника */
    if(p[0]==="copyExternalImageToTexture"){var sr=(arguments[0]||{}).source||{};e.push((new Error().stack||"").split(String.fromCharCode(10)).slice(4,9).map(function(l){l=l.trim().replace("at ","");var u=l.lastIndexOf("/"),c=l.lastIndexOf(":");var f=l.split(" (")[0];return f+(u>=0&&c>u?" "+l.slice(u+1,c):"");}).join(" < ")+" ["+(sr.width|0)+"x"+(sr.height|0)+"]");}
    __J.q.push(e);return r;}return o.apply(this,arguments);};});}catch(e){}
try{["beginRenderPass","beginComputePass"].forEach(function(n){var o=GPUCommandEncoder.prototype[n];if(!o)return;
  GPUCommandEncoder.prototype[n]=function(){if(__J.on)__J.q.push([performance.now()-__J.t0,n,0,0]);return o.apply(this,arguments);};});}catch(e){}
/* долгий кадр с виновником (Long Animation Frames): какая функция из какого файла съела кадр */
try{new PerformanceObserver(function(l){if(__J.on)l.getEntries().forEach(function(e){
  __J.la.push([e.startTime-__J.t0,e.duration,e.blockingDuration||0,(e.scripts||[]).slice().sort(function(a,b){return b.duration-a.duration;}).slice(0,3).map(function(s){
    return [(s.sourceFunctionName||s.invoker||"?").slice(0,60),Math.round(s.duration),(s.sourceURL||"").split("/").pop().slice(0,40)+":"+(s.sourceCharPosition|0)];})]);});}).observe({type:"long-animation-frame",buffered:false});}catch(e){}
/* долгие задачи между кадрами — подгрузка, компиляция, мусор: rAF их не видит, если они легли между кадрами */
try{new PerformanceObserver(function(l){if(__J.on)l.getEntries().forEach(function(e){__J.lt.push([e.startTime-__J.t0,e.duration]);});}).observe({type:"longtask",buffered:false});}catch(e){}
(function(){var lt=0;function tick(t){requestAnimationFrame(tick);
  if(lt&&__J.on){var js=-1;try{js=FRAME_JS;}catch(e){}
    var r={t:t-__J.t0,d:t-lt,js:js,m:(typeof G!=="undefined"&&G.mode)||"?",g:-1};__J.f.push(r);
    /* живой кадр: камера, зум, герой, светило, ошибки видеокарты, память — для законов плавности */
    try{r.gt=G.t;r.vx=G.viewX;r.vy=G.viewY;r.k=G.viewK;var H=G.mode==="surface"?G.surf:G.mode==="cave"?G.cave:G.mode==="dig"?G.dig:null;
      if(H){r.hx=H.x;r.hy=H.y;}
      if(G.mode==="surface"&&typeof PLN!=="undefined"&&PLN.sun&&PLN.sun.dir)r.sun=[PLN.sun.dir[0],PLN.sun.dir[1],PLN.sun.dir[2]];
      r.ge=GPU.errs||0;try{r.cap=frameCapNow();}catch(e){}if(performance.memory)r.mem=performance.memory.usedJSHeapSize;}catch(e){}
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
    code = {"ArrowRight": 39, "ArrowLeft": 37, "ArrowDown": 40, "ArrowUp": 38}[k]
    ws.call("Input.dispatchKeyEvent", type="rawKeyDown" if down else "keyUp", key=k, code=k,
            windowsVirtualKeyCode=code, nativeVirtualKeyCode=code)


def who(fr):
    js, g = fr.get("js", -1), fr.get("g", -1)
    if js >= .5 * fr["d"]: return "JS %d мс" % js
    if g >= .5 * fr["d"]: return "видеокарта %d мс" % g
    return "ни JS (%d), ни видеокарта (%d) — сборка мусора или ожидание" % (max(js, 0), max(g, 0))


def judge(sc, F, out, pz=None):
    entry = [f for f in F if f["t"] < ENTRY_MS]
    run = [f for f in F if f["t"] >= ENTRY_MS]
    segs = None
    if pz is not None:
        # кадр, что проспал заморозку, — не кадр игры: из законов времени кадра он выходит, а сам судится
        # законом паузы — сколько мира он догнал разом и куда за это время уехали герой и камера
        i = next((i for i, f in enumerate(run) if f["t"] > pz and f["d"] > 1000), None)
        if i is None:
            aft = [f for f in run if f["t"] > pz]
            out.append(("кадры · " + sc, "пауза: разрыва после заморозки не видно — кадров после %d, худший %.0f мс, G.t прошло %s" % (
                len(aft), max([f["d"] for f in aft] or [0]), (aft[-1].get("gt") - aft[0].get("gt")) if len(aft) > 1 and aft[0].get("gt") is not None else "?")))
        else:
            a, b = run[i - 1], run[i]
            dg = (b.get("gt") or 0) - (a.get("gt") or 0)
            if dg > 30:
                out.append(("кадры · " + sc, "пауза: мир догнал %.0f тактов (%.1f с) одним кадром — телепорт после возврата во вкладку" % (dg, dg / 60)))
            for k, nm in (("hx", "герой"), ("vx", "камера")):
                if a.get(k) is not None and b.get(k) is not None and abs(b[k] - a[k]) > 60:
                    out.append(("кадры · " + sc, "пауза: %s прыгнул на %.0f за кадр возврата" % (nm, abs(b[k] - a[k]))))
            # плавность судят по обе стороны разрыва; полсекунды догонки (камера доплывает за героем) — эхо паузы
            segs = [run[:i], [f for f in run[i + 1:] if f["t"] > b["t"] + 500]]
            run = run[:i] + run[i + 1:]
    if len(run) < 30:
        out.append(("кадры · " + sc, "кадров почти нет: %d за ход — сцена не крутится" % len(run))); return
    ds = sorted(f["d"] for f in run)
    p50, p95, mx = ds[len(ds) // 2], ds[int(len(ds) * .95)], ds[-1]
    longs = [f for f in run if f["d"] > LONG]
    worst = max(run, key=lambda f: f["d"])
    ew = max(entry, key=lambda f: f["d"]) if entry else None
    ENTRY_SEEN[sc] = ew["d"] if ew else None   # худший кадр входа — в историю frames.jsonl (regress)
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
    for s in segs or [run]:
        got = []; smooth(sc, s, got)
        for x in got:
            if x not in out: out.append(x)


def smooth(sc, run, out):
    """законы живого кадра — по кадрам, где мир сдвинулся (G.t вырос): rAF бывает чаще такта игры"""
    import math
    W = [f for i, f in enumerate(run) if i and f.get("gt") is not None and f["gt"] != run[i - 1].get("gt")]
    if len(W) < 100: return   # на коротком отрезке один кадр — уже процент
    med = lambda A: sorted(A)[len(A) // 2] if A else 0
    def jumps(key, lim_abs):
        # скорость на тик мира, а не сдвиг за кадр: на 240 Гц кадр несёт то .5, то 1.5 тика (квант 28-loop),
        # и сдвиг за кадр «прыгает» без всякого рывка на экране мира
        P = [(b, (b[key] - a[key]) / (b["gt"] - a["gt"])) for a, b in zip(W, W[1:])
             if a.get(key) is not None and b.get(key) is not None and b["gt"] > a["gt"]]
        if len(P) < 10: return 0, 0, 0, ""
        dd = [(f, abs(v2 - v1)) for (_, v1), (f, v2) in zip(P, P[1:])]
        m = med([abs(v) for _, v in P])
        bad = [(f, x) for f, x in dd if x > max(lim_abs, 3 * m)]
        f, mx = max(dd, key=lambda z: z[1])
        # где: секунда записи и место героя — чтобы рывок искали у вещи, а не по всему ходу
        at = " — на %.1f с, x героя %s" % (f["t"] / 1000, "%.0f" % f["hx"] if f.get("hx") is not None else "?")
        return len(bad), mx, m, at
    n, mx, m, at = jumps("vx", 2.0)
    if n >= 2 and n > .01 * len(W): out.append(("кадры · " + sc, "камера рывком: %d из %d кадров (скачок %.1f при обычном шаге %.2f)%s" % (n, len(W), mx, m, at)))
    n, mx, m, at = jumps("hx", 2.0)
    if n >= 2 and n > .01 * len(W): out.append(("кадры · " + sc, "герой рывком: %d из %d кадров (скачок %.1f при шаге %.2f)%s" % (n, len(W), mx, m, at)))
    # зум — по скачку его СКОРОСТИ за такт (log k): плавный быстрый наезд не рывок, рывок — когда скорость
    # ломается (стоял — и за кадр сорвался); и потолок: больше 5 % за такт — щелчок, как ни крути
    for f in W: f["lk"] = math.log(f["k"]) if f.get("k") else None
    n, mx, m, at = jumps("lk", .004)
    if (n >= 2 and n > .01 * len(W)) or mx > .05: out.append(("кадры · " + sc, "зум рывком: %d из %d кадров (скачок %.1f %%/такт при обычном %.2f %%)%s" % (n, len(W), 100 * mx, 100 * m, at)))
    S = [f["sun"] for f in W if f.get("sun")]
    if len(S) > 20:
        ang = [math.degrees(math.acos(max(-1, min(1, sum(x * y for x, y in zip(a, b)))))) for a, b in zip(S, S[1:])]
        m = med([x for x in ang if x > 0]) or 0
        bad = [x for x in ang if x > .05 and x > 5 * m]
        if bad: out.append(("кадры · " + sc, "свет рывком на живом кадре: %d скачков до %.2f° (обычный шаг %.4f°)" % (len(bad), max(bad), m)))
    ge = [f.get("ge", 0) for f in run]
    if ge and ge[-1] > ge[0]: out.append(("кадры · " + sc, "ошибки видеокарты на ходу: +%d" % (ge[-1] - ge[0])))
    M = [(f["t"], f["mem"]) for f in run if f.get("mem")]
    if len(M) > 60 and M[-1][0] - M[0][0] >= 12000:   # память судит долгий ход: на коротком отрезке пила мусора не успевает сойти
        q = len(M) // 4
        lo = [min(v for _, v in M[i * q:(i + 1) * q]) for i in range(4)]   # нижняя кромка по четвертям: пила мусора её не двигает
        a, b = lo[1], lo[3]                       # первая четверть — прогрев: кеши сцены набираются, пока её открывают
        if b - a > 6e6 and lo[1] < lo[2] < lo[3]: out.append(("кадры · " + sc, "память растёт: +%.1f МБ за %.0f с хода (по нижней кромке)" % ((b - a) / 1e6, (M[-1][0] - M[0][0]) / 1000)))


# ── тяжесть: бюджеты на этой машине (RTX, 1280×800). Шире живого вдвое — ловят регресс, а не шум ──
FPS_MIN, LOW1_MS, DROP_SHARE, LONGTASK_MS, MAIN_BUSY, GPU_PROC, GPU_FRAME_MS = 55, 25, .01, 50, .45, .6, 6


def metrics(ws):
    try: return {m["name"]: m["value"] for m in ws.call("Performance.getMetrics")["metrics"]}
    except Exception: return {}


def procs(a):
    """процессорное время процессов браузера, с: тип → сумма (gpu — процесс видеокарты)"""
    try:
        if not getattr(a, "bws", None):
            v = json.load(urllib.request.urlopen("http://127.0.0.1:%d/json/version" % a.port, timeout=5))
            a.bws = shot.WS(v["webSocketDebuggerUrl"], 30)
        out = {}
        for p in a.bws.call("SystemInfo.getProcessInfo")["processInfo"]:
            out[p["type"]] = out.get(p["type"], 0) + p["cpuTime"]
        return out
    except Exception:
        return {}


def heavy(sc, d, r0, r1, p0, p1, wall, gms, out):
    """тяжесть кадра и хода: пропуск кадров, просадка FPS, долгие задачи, поток, процессор видеокарты, мс видеокарты"""
    pz = d.get("pz") or 1e12
    F = [f for f in d["f"] if ENTRY_MS <= f["t"] < pz]
    W = [f for i, f in enumerate(F) if i and f.get("gt") is not None and f["gt"] != F[i - 1].get("gt")]
    tag = "кадры · " + sc
    row = {}
    if len(W) > 60:
        iv = [b["t"] - a["t"] for a, b in zip(W, W[1:])]
        # потолок сцены (станция — 30 по замыслу): пороги от него, а не от шестидесяти
        caps = [f.get("cap") or 60 for f in W]
        cap = min(60, max(set(caps), key=caps.count))
        k = 60 / cap
        drop_ms, fps_min, low1_ms = 25 * k, FPS_MIN / k, LOW1_MS * k
        row["cap"] = cap
        drop = [x for x in iv if x > drop_ms]
        low1 = sorted(iv)[int(len(iv) * .99)]
        # FPS по секундам: сколько кадров мира в каждом окне в 1 с
        t0, t1 = W[0]["t"], W[-1]["t"]
        fps = [sum(1 for f in W if s <= f["t"] < s + 1000) for s in range(int(t0), int(t1) - 999, 500)]
        row.update(fps=min(fps) if fps else 0, low1=low1, drop=len(drop))
        if len(drop) > DROP_SHARE * len(iv):
            out.append((tag, "пропуск кадров: %d из %d кадров мира позже %.0f мс (худший %.0f мс)" % (len(drop), len(iv), drop_ms, max(drop))))
        if fps and min(fps) < fps_min:
            out.append((tag, "просадка FPS: худшая секунда %d кадров (порог %d при потолке %d)" % (min(fps), fps_min, cap)))
        if low1 > low1_ms:
            out.append((tag, "1%% low: %.1f мс на кадр (порог %.0f) — подтормаживает" % (low1, low1_ms)))
        # заминка против соседей (FCAT/PCPer): кадр вдвое дольше медианы двадцати прошлых — глаз видит рывок,
        # даже когда до 33 мс он не дотянул; лёгкая и тяжёлая сцены сравниваются каждая сама с собой
        hz = [(W[i + 1]["t"], x) for i, x in enumerate(iv) if i >= 20 and x > 20 and x > 2 * sorted(iv[i - 20:i])[10]]
        row["hitch"] = len(hz)
        if len(hz) > 3:
            out.append((tag, "заминки: %d кадров вдвое дольше соседей (худший %.0f мс на %.1f с)" % (len(hz), max(x for _, x in hz), hz[0][0] / 1000)))
    lt = [x for x in d.get("lt") or [] if ENTRY_MS <= x[0] < pz - 50]
    if lt: row["long"] = max(x[1] for x in lt)
    big = [x for x in lt if x[1] > LONGTASK_MS]
    la = [x for x in d.get("la") or [] if ENTRY_MS <= x[0] < pz - 50]
    row["loaf"] = round(sum(x[2] for x in la))
    def blame(t, dur):
        # виновник из Long Animation Frames, перекрывающего задачу
        hit = [x for x in la if x[0] <= t + dur and t <= x[0] + x[1] and x[3]]
        if not hit: return ""
        s = max(hit, key=lambda x: x[2])[3][0]
        return " · виновник %s (%d мс, %s)" % (s[0], s[1], s[2])
    if big:
        w = max(big, key=lambda x: x[1])
        out.append((tag, "долгие задачи на ходу: %d, худшая %.0f мс на %.1f с — подгрузка или компиляция в потоке%s" % (len(big), w[1], big[0][0] / 1000, blame(*w))))
    # сборка конвейера или шейдера после входа — рывок при первой встрече; всё должно собраться прогревом
    # судится только синхронная сборка конвейера — она держит кадр; Async-сборки и модули — фоновый
    # прогрев (поздний прогрев qa 824f6ccd: по 0 мс на кадре), они идут строкой в вывод, не находкой
    pp_all = [x for x in d.get("pp") or [] if ENTRY_MS <= x[0] < pz - 50]
    pp = [x for x in pp_all if x[1] in ("createRenderPipeline", "createComputePipeline")]
    row["pipes"] = len(pp); row["pipes_bg"] = len(pp_all) - len(pp)
    if len(pp_all) > len(pp): print("  %s: фоновых сборок после входа %d (Async и модули) — не держат кадр" % (tag, len(pp_all) - len(pp)))
    if pp:
        kinds = {}
        for x in pp: kinds[x[1]] = kinds.get(x[1], 0) + 1
        out.append((tag, "шейдер собирается на ходу: %d (%s), первая на %.1f с, дольше всех %.0f мс%s" % (
            len(pp), ", ".join("%s %d" % kv for kv in sorted(kinds.items())), pp[0][0] / 1000, max(x[2] for x in pp), blame(pp[0][0], 1))))
    if r0 and r1 and wall > 1:
        busy = (r1.get("TaskDuration", 0) - r0.get("TaskDuration", 0)) / wall
        row["main"] = busy
        if busy > MAIN_BUSY: out.append((tag, "главный поток занят %.0f %% хода (порог %.0f %%)" % (100 * busy, 100 * MAIN_BUSY)))
    if p0 and p1 and wall > 1:
        g = (p1.get("gpu", 0) - p0.get("gpu", 0)) / wall
        row["gpuproc"] = g
        if g > GPU_PROC: out.append((tag, "процесс видеокарты ест %.0f %% ядра (порог %.0f %%)" % (100 * g, 100 * GPU_PROC)))
    try: G = json.loads(gms) if isinstance(gms, str) else None
    except Exception: G = None
    if G and G.get("frame"):
        row["gpums"] = G["frame"]["ms"]
        if G["frame"]["ms"] > GPU_FRAME_MS:
            top = sorted(((k, v["pf"]) for k, v in G.items() if k not in ("frame", "sum")), key=lambda z: -z[1])[:3]
            out.append((tag, "видеокарта %.1f мс на кадр (порог %d): %s" % (G["frame"]["ms"], GPU_FRAME_MS, ", ".join("%s %.1f" % z for z in top))))
    print("         тяжесть  FPS мин %s  1%% low %s мс  пропусков %s  долгая задача %s мс  поток %s  проц. видеокарты %s  видеокарта %s мс/кадр" % (
        row.get("fps", "?"), "%.1f" % row["low1"] if "low1" in row else "?", row.get("drop", "?"), "%.0f" % row["long"] if "long" in row else "-",
        "%.0f%%" % (100 * row["main"]) if "main" in row else "?", "%.0f%%" % (100 * row["gpuproc"]) if "gpuproc" in row else "?",
        "%.2f" % row["gpums"] if "gpums" in row else "?"))
    return row


# ── регресс против прошлых прогонов на этой машине (BugNet/PerfGuard: p99 хуже базы на 10 % — красное).
# Запас шире — 25 % и абсолютный порог: headless шумит; база — медиана пяти прошлых записей сцены ──
FRAMES_LOG = os.path.join(os.environ.get("LAB_DATA") or os.path.join(os.path.expanduser("~"), "drift-data", "lab"), "frames.jsonl")
ENTRY_SEEN = {}
WIN = {"k": ""}   # окно замера: база регресса — только прогоны того же окна (ПК 1600×900 и телефон 390 — разные пиксели)
NOISE = {"on": False}   # соседи грузят машину: замер не пишется в базу регресса и не красит прогон
REGRESS = {"entry": (1.5, 100, "вход в сцену, мс"), "low1": (1.25, 3, "1% low, мс"), "gpums": (1.25, .5, "видеокарта, мс/кадр"), "main": (1.25, .05, "поток, доля"),
           "hitch": (2.0, 4, "заминки")}


def regress(sc, row, out, ver):
    row.setdefault("entry", ENTRY_SEEN.get(sc))
    if NOISE["on"]: return
    hist = []
    try:
        for ln in open(FRAMES_LOG, encoding="utf-8"):
            try: r = json.loads(ln)
            except ValueError: continue
            if r.get("scene") == sc and r.get("win") == WIN["k"]: hist.append(r)
    except OSError: pass
    base = hist[-5:]
    if len(base) >= 3:
        for k, (mul, add, nm) in REGRESS.items():
            vals = sorted(r[k] for r in base if r.get(k) is not None)
            if len(vals) < 3 or row.get(k) is None: continue
            b = vals[len(vals) // 2]
            if row[k] > b * mul and row[k] - b > add:
                out.append(("кадры · " + sc, "регресс: %s %.2f против базы %.2f (медиана %d прошлых прогонов)" % (nm, row[k], b, len(vals))))
    try:
        os.makedirs(os.path.dirname(FRAMES_LOG), exist_ok=True)
        with open(FRAMES_LOG, "a", encoding="utf-8") as f:
            f.write(json.dumps(dict(row, scene=sc, ver=ver, win=WIN["k"], ts=int(time.time())), ensure_ascii=False) + "\n")
    except OSError: pass


def heap_gc(ws):
    try: ws.call("HeapProfiler.collectGarbage"); return ws.call("Runtime.getHeapUsage")["usedSize"]
    except Exception: return None


def mem_law(sc, d, out):
    """закон «память растёт» — по куче после сборки: нижняя кромка performance.memory только подозревает"""
    h0, h1 = d.get("hu") or (None, None)
    if h0 is None or h1 is None: return
    sus = [x for x in out if x[0] == "кадры · " + sc and x[1].startswith("память растёт")]
    for x in sus: out.remove(x)
    if h1 - h0 > 6e6: out.append(("кадры · " + sc, "память растёт: +%.1f МБ живого после сборки (%.1f → %.1f)" % ((h1 - h0) / 1e6, h0 / 1e6, h1 / 1e6)))
    elif sus: print("%-8s память: пила мусора без роста — живого %+.1f МБ после сборки (%.1f → %.1f)" % (sc, (h1 - h0) / 1e6, h0 / 1e6, h1 / 1e6))


def run_scene(a, pg, sc, bad, plant=None, cpu=1):
    """одна сцена в своей вкладке: поднять, дождаться ровного режима, записать вход и ход, рассудить"""
    req = urllib.request.Request("http://127.0.0.1:%d/json/new?about:blank" % a.port, method="PUT")
    t = json.load(urllib.request.urlopen(req, timeout=10))
    ws = shot.WS(t["webSocketDebuggerUrl"], 120)
    try:
        ws.call("Emulation.setDeviceMetricsOverride", width=a.w, height=a.h, deviceScaleFactor=a.dpr, mobile=a.mobile)
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
        tag = sc
        if cpu > 1:
            # слабый процессор (CDP: каждая задача потока в cpu раз дольше) — телефон послабее S23
            ws.call("Emulation.setCPUThrottlingRate", rate=cpu); tag = "%s×cpu%d" % (sc, cpu)
        if plant: shot.ev(ws, plant)
        # куча после сборки — до записи и после: performance.memory считает и мусор, что сборщик ещё не
        # убрал (система на .12: 63 → 147 МБ по нижней кромке, а живого +2 МБ — заготовка зала сорит)
        hu0 = heap_gc(ws)
        shot.ev(ws, "__J.t0=performance.now();__J.on=true;")
        time.sleep(ENTRY_MS / 1000)
        half = a.secs / 2
        # ресурсы хода: главный поток (CDP), процессы браузера (процесс видеокарты), мс видеокарты на кадр
        ws.call("Performance.enable")
        res0, p0, w0 = metrics(ws), procs(a), time.time()
        shot.ev(ws, "__J.gpu=null;if(typeof g11GpuMs==='function')g11GpuMs(%.1f).then(function(o){__J.gpu=o;});" % max(2, half - 1))
        # в копе шаг вбок с верхней клетки выводит из устья на грунт — там идём вниз, потом вбок по глубине
        k1, k2 = WALK.get(sc, ("ArrowRight", "ArrowLeft"))
        key(ws, k1, True); time.sleep(half); key(ws, k1, False)
        key(ws, k2, True); time.sleep(half)
        res1, p1, w1 = metrics(ws), procs(a), time.time()
        gms = shot.ev(ws, "JSON.stringify(__J.gpu)")
        # скачок времени посреди хода: главный поток встал на три секунды (ноутбук уснул, ОС подвисла,
        # долгий мусор) — мир не должен догонять их одним кадром (телепорт), падать или терять героя.
        # Заморозка вкладки через CDP в headless не возвращает видимость — поэтому стоим в самом потоке
        if a.pause:
            shot.ev(ws, "__J.pz=performance.now()-__J.t0;var __e=performance.now()+%d;while(performance.now()<__e){}" % int(a.pause * 1000))
            time.sleep(3)   # после разрыва — ещё ход: хвосту нужна длина, чтобы законы плавности судили его
        key(ws, k2, False)
        time.sleep(2)   # остановка — тоже кадр игры: герой встал, камера тормозит, зум доезжает (рывок 15.10 жил тут)
        st = shot.ev(ws, "__J.on=false;JSON.stringify({f:__J.f,lt:__J.lt,pp:__J.pp,la:__J.la,pz:__J.pz,q:__J.q,crash:document.body.innerText.indexOf('СБОЙ')>=0,"
                         "errs:(window.__errs||[]).filter(function(e){return e[0]!=='W'}).slice(0,4)})")
        if not isinstance(st, str):
            bad.append(("кадры · " + sc, "запись не прочиталась: %s" % st)); return
        d = json.loads(st)
        shot.ev(ws, "__J.f=[];__J.q=[];__J.lt=[];__J.pp=[];__J.la=[];0")   # запись прочитана — своя память не в счёт
        d["hu"] = (hu0, heap_gc(ws))
        if not gpu: bad.append(("кадры · " + sc, "видеокарты нет — замер на 2D не годится"))
        if d["crash"]: bad.append(("кадры · " + sc, "СБОЙ на экране"))
        for e in d["errs"]: bad.append(("кадры · " + sc, "ошибка страницы: " + re.sub(r"\s+", " ", e)[:160]))
        if cpu > 1:
            # на слабом процессоре кадров меньше — это честно; нечестно, когда мир отстаёт от часов
            W = [f for f in d["f"] if ENTRY_MS <= f["t"] and f.get("gt") is not None]
            if len(W) > 20:
                pace = (W[-1]["gt"] - W[0]["gt"]) / 60 / ((W[-1]["t"] - W[0]["t"]) / 1000)
                iv = sorted(y["t"] - x["t"] for x, y in zip(W, W[1:]))
                print("%-8s процессор ×%d: темп мира %.0f %% часов, кадр p50 %.1f p95 %.1f мс" % (sc, cpu, 100 * pace, iv[len(iv) // 2], iv[int(len(iv) * .95)]))
                if pace < .95: bad.append(("кадры · " + tag, "мир отстаёт от часов на слабом процессоре: %.0f %% темпа" % (100 * pace)))
            # длинный кадр меряется тем же законом, но порог — в cpu раз шире: судим остановки, а не медленность
            global RUN_MAX, LONG, ENTRY_MAX
            keep = RUN_MAX, LONG, ENTRY_MAX
            RUN_MAX, LONG, ENTRY_MAX = RUN_MAX * cpu, LONG * cpu, ENTRY_MAX * cpu
            try: judge(tag, d["f"], bad, d.get("pz"))
            finally: RUN_MAX, LONG, ENTRY_MAX = keep
            mem_law(tag, d, bad)
            return
        judge(sc, d["f"], bad, d.get("pz")); mem_law(sc, d, bad)
        # очередь видеокарты на кадр хода (после входа): отправки, загрузки буферов и текстур
        R = [f for f in d["f"] if f["t"] >= ENTRY_MS]
        if R and d.get("q"):
            nf = len(R); qa = {}
            for q in d["q"]:
                if q[0] >= ENTRY_MS:
                    e = qa.setdefault(q[1], [0, 0]); e[0] += 1; e[1] += q[2]
            js = sorted(max(f["js"], 0) for f in R); gg = sorted(f["g"] for f in R if f.get("g", -1) >= 0)
            print("%-8s на кадр: %s · JS p50 %.1f p99 %.1f · ГП-ожидание p50 %s p99 %s" % (sc, " · ".join(
                "%s %.1f (%.0f КБ)" % (k, v[0] / nf, v[1] / nf / 1e3) for k, v in sorted(qa.items())),
                js[len(js) // 2], js[int(len(js) * .99)], "%.1f" % gg[len(gg) // 2] if gg else "?", "%.1f" % gg[int(len(gg) * .99)] if gg else "?"))
            # кто копирует 2D в текстуру: место, копий за ход, КБ на копию
            cw = {}
            for q in d["q"]:
                if q[0] >= ENTRY_MS and len(q) > 4:
                    e = cw.setdefault(q[4], [0, 0]); e[0] += 1; e[1] += q[2]
            for k, v in sorted(cw.items(), key=lambda z: -z[1][1])[:4]:
                print("%-8s   копия 2D: %d раз, %.0f КБ/копия ← %s" % (sc, v[0], v[1] / v[0] / 1e3, k))
        row = heavy(sc, d, res0, res1, p0, p1, w1 - w0, gms, bad)
        if not plant: regress(sc, row, bad, shot.ev(ws, "typeof VER!=='undefined'?VER:'?'"))
    finally:
        try: urllib.request.urlopen("http://127.0.0.1:%d/json/close/%s" % (a.port, t["id"]), timeout=5)
        except Exception: pass


TRANS_MAX = 250   # худший кадр перехода, мс: дольше — игрок видит, что игра встала
# обход переходов настоящими воротами игры — тем же путём, каким ходит игрок (действие → ворота режима);
# перед каждым шагом 1,5 с простоя, чтобы заготовки наперёд (зал, пещера, флора) успели то, что успели бы у игрока
TRWALK = r"""window.__TR={done:false,rows:[],err:null};
(async function(){
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const find=pred=>{for(let r0=0;r0<16;r0++)for(let x=-r0;x<=r0;x++)for(let y=-r0;y<=r0;y++){
   if(Math.max(Math.abs(x),Math.abs(y))!==r0)continue;const s=getSystem(x,y);if(pred(s))return s;}return null;};
 const go=(s,x,y)=>{G.sx=s.sx;G.sy=s.sy;G.sys=s;G.ap=null;G.mode="system";G.ship.x=x;G.ship.y=y;G.ship.vx=0;G.ship.vy=0;};
 const until=async(pred,ms)=>{const e=performance.now()+ms;while(performance.now()<e){try{if(pred())return true;}catch(e){}await sleep(40);}return false;};
 const step=async(n,act,pred,settle)=>{await sleep(1500);const t0=performance.now()-__J.t0;let err=null;
   const pre=!!(G.surf&&G.surf.cavePre&&G.surf.cavePre.C),hp=(typeof HALL_PRE!=="undefined")?!!(HALL_PRE.done&&HALL_PRE.cdone):null;
   try{act();}catch(e){err=String(e&&e.message||e);}
   const ta=performance.now()-__J.t0-t0;
   const ok=!err&&await until(pred,15000);const t1=performance.now()-__J.t0;await sleep(settle||2000);
   __TR.rows.push({n,t0,t1,ta,pre,hp,t2:performance.now()-__J.t0,ok,err,m:G.mode});return ok;};
 try{
  const day=p=>p.type!=="gas"&&p.T&&p.T.atm!=="отсутствует";
  const sl=find(q=>(q.planets||[]).some(day)),p=sl.planets.find(day);
  G.fuel=Math.max(G.fuel,60);go(sl,p.x+400,p.y+200);await sleep(2500);
  await step("система → заход",()=>{startLanding(p);G.land.y=groundAt(G.land.tr,G.land.x)-560;},()=>G.mode==="landing");
  await step("заход → грунт",()=>{G.land.ok=true;G.land.over=.01;},()=>G.mode==="surface",3000);
  await step("грунт → пещера",()=>enterCave(),()=>G.mode==="cave");
  await step("пещера → грунт",()=>exitCave(),()=>G.mode==="surface");
  await step("грунт → взлёт",()=>{G.fuel=Math.max(G.fuel,60);launch();},()=>G.mode==="system");
  const ss=find(q=>q.station&&(stTypeOf(q.station.stype).tabs||[]).indexOf("cantina")>=0)||find(q=>!!q.station);
  go(ss,ss.station.x+40,ss.station.y);await sleep(3000);
  await step("система → док",()=>openStation(),()=>G.mode==="dock");
  if(stTabsHere().indexOf("cantina")>=0)await step("док → Кантина",()=>{tab="cantina";syncTabs();renderTab();},()=>tab==="cantina",3000);
  await step("док → система",()=>closeStation(),()=>G.mode==="system");
  const sg=find(q=>(q.planets||[]).some(p=>p.type==="gas")),gp=sg.planets.find(p=>p.type==="gas");
  go(sg,gp.x+gp.radius+200,gp.y);await sleep(2000);
  await step("система → черпак",()=>startScoop(gp),()=>G.mode==="scoop");
  await step("черпак → система",()=>exitScoop(),()=>G.mode==="system");
 }catch(e){__TR.err=String(e&&e.stack||e).slice(0,300);}
 __TR.done=true;})();"""


def run_trans(a, pg, bad):
    """переходы между режимами на живой видеокарте: худший кадр от действия до ровного режима + 2 с.
    Ровный ход меряет run_scene; рывок перехода (стройка пещеры, лепка грунта, зал станции) живёт между
    ними — 15.10 он был 1072 мс у пещеры и 479 у захода, и ни один прибор этого не видел"""
    req = urllib.request.Request("http://127.0.0.1:%d/json/new?about:blank" % a.port, method="PUT")
    t = json.load(urllib.request.urlopen(req, timeout=10))
    ws = shot.WS(t["webSocketDebuggerUrl"], 200)
    ok = 0
    try:
        ws.call("Emulation.setDeviceMetricsOverride", width=a.w, height=a.h, deviceScaleFactor=a.dpr, mobile=a.mobile)
        ws.call("Network.enable"); ws.call("Network.setBlockedURLs", urls=shot.BLOCK)
        ws.call("Page.enable"); ws.call("Page.addScriptToEvaluateOnNewDocument", source=shot.CATCH)
        ws.call("Page.navigate", url="file:///" + pg.replace("\\", "/") + "?s=system")
        t0 = time.time()
        while time.time() - t0 < 30:
            if shot.ev(ws, "typeof G!=='undefined'&&G.running&&typeof GPU!=='undefined'&&(GPU.ok||GPU.none)&&"
                           "document.documentElement.hasAttribute('data-alive')") is True: break
            time.sleep(.2)
        else:
            bad.append(("переходы", "страница не поднялась за 30 с")); return 0
        time.sleep(2)
        if not shot.ev(ws, "!!GPU.ok"): bad.append(("переходы", "видеокарты нет — замер на 2D не годится"))
        # JS-профайлер на весь обход: выборки раз в 250 мкс раскладываются по окнам переходов — LoAF в
        # file:// часто не называет скриптов, а профайлер называет функцию и строку (и мусор: «(garbage collector)»)
        ws.call("Profiler.enable"); ws.call("Profiler.setSamplingInterval", interval=250)
        shot.ev(ws, "__J.t0=performance.now();")
        ws.call("Profiler.start"); off = shot.ev(ws, "performance.now()-__J.t0") or 0
        shot.ev(ws, "__J.on=true;" + TRWALK)
        t0 = time.time()
        while time.time() - t0 < 160 and shot.ev(ws, "__TR.done") is not True: time.sleep(.5)
        try: prof = ws.call("Profiler.stop").get("profile")
        except Exception: prof = None
        samp = []   # [(t мс по часам __J, имя функции)]
        if prof:
            nodes = {n["id"]: n["callFrame"] for n in prof["nodes"]}
            par = {c: n["id"] for n in prof["nodes"] for c in n.get("children", [])}
            nm = lambda cf: (cf.get("functionName") or "(анон)") + (" :%d" % (cf.get("lineNumber", 0) + 1) if cf.get("url") else "")
            ts = prof["startTime"]
            for nid, dt in zip(prof["samples"], prof["timeDeltas"]):
                ts += dt
                chain, x = [], nid
                while x is not None and len(chain) < 40: chain.append(nm(nodes.get(x, {}))); x = par.get(x)
                samp.append((off + (ts - prof["startTime"]) / 1000.0, chain[0], chain))
        st = shot.ev(ws, "__J.on=false;JSON.stringify({tr:__TR,f:__J.f,lt:__J.lt,pp:__J.pp,la:__J.la,q:__J.q,crash:document.body.innerText.indexOf('СБОЙ')>=0,"
                         "errs:(window.__errs||[]).filter(function(e){return e[0]!=='W'}).slice(0,4),ver:typeof VER!=='undefined'?VER:'?'})")
        if not isinstance(st, str): bad.append(("переходы", "запись не прочиталась: %s" % st)); return 0
        d = json.loads(st)
        tr = d["tr"]
        if not tr.get("done"): bad.append(("переходы", "обход не дошёл до конца за 160 с"))
        if tr.get("err"): bad.append(("переходы", "обход упал: " + re.sub(r"\s+", " ", tr["err"])[:200]))
        if d["crash"]: bad.append(("переходы", "СБОЙ на экране"))
        for e in d["errs"]: bad.append(("переходы", "ошибка страницы: " + re.sub(r"\s+", " ", e)[:160]))
        for r in tr["rows"]:
            nm = "переход " + r["n"]
            if not r["ok"]:
                bad.append((nm, "ворота не открылись за 15 с (режим %s)%s" % (r["m"], ": " + r["err"] if r["err"] else ""))); continue
            F = [f for f in d["f"] if r["t0"] <= f["t"] <= r["t2"]]
            if not F: bad.append((nm, "ни одного кадра за переход")); continue
            w = max(F, key=lambda f: f["d"])
            lt = max([x[1] for x in d["lt"] if r["t0"] - 50 <= x[0] <= r["t2"]] or [0])
            sync = [p for p in d["pp"] if r["t0"] <= p[0] <= r["t2"] and p[1] in ("createRenderPipeline", "createComputePipeline")]
            # виновник: самые дорогие скрипты долгих кадров (LoAF) за переход, сложенные по функции
            cul = {}
            for x in d.get("la", []):
                if r["t0"] - 50 <= x[0] <= r["t2"]:
                    for fn, ms, src in x[3]: cul[fn + " " + src] = cul.get(fn + " " + src, 0) + ms
            top = sorted(cul.items(), key=lambda kv: -kv[1])[:3]
            print("%-22s худший кадр %6.1f мс (%s) · действие %5.0f мс · ворота %5.0f · долгая задача %5.0f · конвейеров %d%s%s" % (
                r["n"], w["d"], w["m"], r.get("ta", 0), r["t1"] - r["t0"], lt, len(sync),
                " · пещера готова" if r.get("pre") else "", " · зал готов" if r.get("hp") else ""))
            for k, v in top: print("%24s%5d мс  %s" % ("", v, k))
            # сборки на видеокарте за переход (и асинхронные): главный поток стоит без JS, а кадр ждёт процесс видеокарты
            allp = {}
            for p in d["pp"]:
                if r["t0"] <= p[0] <= r["t2"]: allp[p[1]] = allp.get(p[1], 0) + 1
            if allp: print("%24sсборки: %s" % ("", " · ".join("%s %d" % kv for kv in sorted(allp.items()))))
            # очередь: в окне худшего кадра и в среднем ровном кадре до перехода (база)
            def qsum(x0, x1):
                o = {}
                for q in d.get("q", []):
                    if x0 <= q[0] <= x1:
                        e = o.setdefault(q[1], [0, 0, 0.0]); e[0] += 1; e[1] += q[2]; e[2] += q[3]
                return o
            if w["d"] > 50:
                qw = qsum(w["t"] - w["d"] - 20, w["t"] + 5)
                print("%24sсъел: %s · очередь в рывке: %s" % ("", who(w), " · ".join("%s %d шт %.1f МБ %.0f мс" % (k, v[0], v[1] / 1e6, v[2]) for k, v in sorted(qw.items())) or "пусто"))
            # профайлер: свои мс функций в окне худшего кадра (±1 кадр) — кто именно съел рывок
            if samp and w["d"] > 50:
                a0, a1 = w["t"] - w["d"] - 20, w["t"] + 5
                cnt, inc = {}, {}
                ROOTS = {"(root)", "(program)", "frame", "frameBody", "tick", "(анон)"}
                for st_, fn, chain in samp:
                    if a0 <= st_ <= a1 and fn != "(idle)":
                        cnt[fn] = cnt.get(fn, 0) + .25
                        for c in set(chain):
                            if c.split(" ")[0] not in ROOTS: inc[c] = inc.get(c, 0) + .25
                print("%24sсвоё: %s" % ("", " · ".join("%s %.0f" % kv for kv in sorted(cnt.items(), key=lambda kv: -kv[1])[:6] if kv[1] >= 2)))
                print("%24sс детьми: %s" % ("", " · ".join("%s %.0f" % kv for kv in sorted(inc.items(), key=lambda kv: -kv[1])[:8] if kv[1] >= 3)))
            n0 = len(bad)
            if w["d"] > TRANS_MAX:
                bad.append((nm, "кадр %d мс в режиме %s — съел: %s%s" % (w["d"], w["m"], who(w),
                            " · конвейеров собрано сразу %d (%.0f мс)" % (len(sync), sum(p[2] for p in sync)) if sync else "")))
            regress(nm, {"entry": round(w["d"], 1), "gate": round(r["t1"] - r["t0"])}, bad, d.get("ver", "?"))
            if len(bad) == n0: ok += 1
    finally:
        try: urllib.request.urlopen("http://127.0.0.1:%d/json/close/%s" % (a.port, t["id"]), timeout=5)
        except Exception: pass
    return ok


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-plant", action="store_true", help="skip the planted-defect run that proves the live-frame laws see")
    ap.add_argument("--dpr", type=float, default=1, help="device pixel ratio of the emulated window (phone: 1.5)")
    ap.add_argument("--mobile", action="store_true", help="emulate a touch phone (with --w 390 --h 844 --dpr 1.5)")
    ap.add_argument("--no-trans", action="store_true", help="skip the walk through mode transitions (worst frame per transition)")
    ap.add_argument("--pause", type=float, default=3, help="seconds the tab is frozen mid-walk (0 = no pause)")
    ap.add_argument("--scenes", default=",".join(SCENES))
    ap.add_argument("--w", type=int, default=1280)
    ap.add_argument("--h", type=int, default=800)
    ap.add_argument("--secs", type=float, default=16)
    ap.add_argument("--port", type=int, default=0, help="0 = a free port (sessions share this script)")
    ap.add_argument("--cpu", default="surface,cave", help="scenes walked again with the CPU throttled ×4 (empty = none)")
    ap.add_argument("--root", default=ROOT, help="the checkout whose drift.html and stand scenes are measured")
    ap.add_argument("--quiet-wait", type=float, default=0, help="seconds to wait before each scene for neighbours' Chromes to go and the CPU to fall under 40 %%")
    a = ap.parse_args()
    WIN["k"] = "%dx%d@%g%s" % (a.w, a.h, a.dpr, "m" if a.mobile else "")
    if not a.port: a.port = noise.free_port()
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
    bad, ok, hushed = [], 0, []
    try:
        for _ in range(60):
            try: urllib.request.urlopen("http://127.0.0.1:%d/json/version" % a.port, timeout=2); break
            except Exception: time.sleep(.25)
        def guarded(name, fn):
            # сторож шума (lab/noise.py): чужие хромы или процессор > 40 % до или после — провалы уходят в заметки
            s0 = noise.wait_quiet(prof, a.quiet_wait); NOISE["on"] = noise.noisy(s0)
            n0 = len(bad); r = fn()
            s1 = noise.sample(prof)
            if noise.noisy(s0) or noise.noisy(s1):
                print("  " + name + " · " + noise.tag(s0 if noise.noisy(s0) else s1))
                hushed.extend(bad[n0:]); del bad[n0:]
            NOISE["on"] = False
            return r
        for sc in [s for s in a.scenes.split(",") if s]:
            n0 = len(bad); guarded(sc, lambda: run_scene(a, pg, sc, bad))
            if len(bad) == n0: ok += 1
        if not a.no_trans: ok += guarded("переходы", lambda: run_trans(a, pg, bad))
        for sc in [s for s in a.cpu.split(",") if s]:
            n0 = len(bad); guarded(sc + " ×4", lambda: run_scene(a, pg, sc, bad, cpu=4))
            if len(bad) == n0: ok += 1
        # подсадка: поверхность, где герой раз в полсекунды прыгает на 40, видеокарта «ошибается» и куча течёт по 8 МБ/с — все три закона
        # обязаны это увидеть, иначе законы живого кадра слепы (как подсадки зрения)
        if not a.no_plant:
            pb = []
            run_scene(a, pg, "surface", pb, plant="setInterval(function(){try{G.surf.x+=40;GPU.errs=(GPU.errs||0)+1;}catch(e){}},500);window.__leak=[];setInterval(function(){__leak.push(new Float64Array(1e5))},100);setTimeout(function(){try{GPU.dev.createComputePipeline({layout:\"auto\",compute:{module:GPU.dev.createShaderModule({code:\"@compute @workgroup_size(1) fn main(){}\"}),entryPoint:\"main\"}});}catch(e){}},4000);")
            got = " ".join(m for _, m in pb)
            print("подсадка: " + ("; ".join(m[:60] for _, m in pb) or "ничего не поймано"))
            for law in ("герой рывком", "ошибки видеокарты", "память растёт", "шейдер собирается на ходу"):
                if law not in got: bad.append(("кадры · подсадка", "СЛЕПО: закон «%s» не поймал подсаженный брак" % law))
    finally:
        noise.kill_tree(proc)
        import shutil; shutil.rmtree(tmp, ignore_errors=True)
    n = len(a.scenes.split(","))
    print()
    print(("FAILED %d · passed %d · suites %d of %d" % (len(bad), ok, n, n)) if bad else ("ALL GREEN · passed %d · suites %d of %d" % (ok, n, n)))
    for s, m in bad: print("  ✗ %s · %s" % (s, m))
    if hushed: print("\n  в шуме (не считаются, перемерить в тишине):")
    for s, m in hushed: print("  ~ %s · %s" % (s, m))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
