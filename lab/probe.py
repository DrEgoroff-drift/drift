"""зонд цены: стенд сцены на живой видеокарте (headless, свой профиль), сниппет — и его JSON в консоль.
Для охоты за тормозами: «сколько стоит вот эта функция вот в этой сцене» реальными часами.

  python lab/probe.py surface "(()=>{...;return {ms:...}})()" [--w 1600 --h 900 --dpr 1 --mobile] [--wait 3]

Сниппет может вернуть Promise (ждём). Страница — drift.html корня (--root) с хвостом стенда docs/mkview.ps1."""
import argparse, json, os, subprocess, sys, tempfile, time, urllib.request
sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import jank   # page(), shot (CDP)
import noise  # kill_tree: свой хром со всеми детьми
shot = jank.shot


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("scene")
    ap.add_argument("js")
    ap.add_argument("--root", default=jank.ROOT)
    ap.add_argument("--w", type=int, default=1600)
    ap.add_argument("--h", type=int, default=900)
    ap.add_argument("--dpr", type=float, default=1)
    ap.add_argument("--mobile", action="store_true")
    ap.add_argument("--wait", type=float, default=3, help="seconds of steady mode before the snippet")
    ap.add_argument("--port", type=int, default=0, help="0 = a free port (sessions share this script)")
    ap.add_argument("--profile", type=float, default=0, help="seconds of JS profile after the snippet: who eats frames over 33 ms")
    ap.add_argument("--all", action="store_true", help="--profile counts every sample, not only frames over 33 ms")
    ap.add_argument("--ws", type=float, default=300, help="CDP socket timeout, seconds: a long snippet needs more")
    a = ap.parse_args()
    if not a.port: a.port = noise.free_port()
    if a.js.startswith("@"): a.js = open(a.js[1:], encoding="utf-8").read()   # сниппет файлом: кавычки консоли его не портят
    shot.HERE = os.path.join(a.root, "docs")
    chrome = next((c for c in shot.CHROMES if os.path.exists(c)), None)
    tmp = tempfile.mkdtemp(prefix="drift-probe-")
    pg = os.path.join(tmp, "probe.html")
    open(pg, "w", encoding="utf-8").write(jank.page(shot.stand_tail(), a.root))
    prof = os.path.join(tempfile.gettempdir(), "drift-probe-%d" % a.port)
    proc = subprocess.Popen([chrome, "--headless=new", "--remote-debugging-port=%d" % a.port, "--user-data-dir=" + prof,
                             "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--mute-audio",
                             "--enable-unsafe-webgpu", "--enable-precise-memory-info", "--window-size=%d,%d" % (a.w, a.h), "about:blank"],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(160):
            try: urllib.request.urlopen("http://127.0.0.1:%d/json/version" % a.port, timeout=2); break
            except Exception: time.sleep(.25)
        req = urllib.request.Request("http://127.0.0.1:%d/json/new?about:blank" % a.port, method="PUT")
        t = json.load(urllib.request.urlopen(req, timeout=10))
        ws = shot.WS(t["webSocketDebuggerUrl"], a.ws)
        ws.call("Emulation.setDeviceMetricsOverride", width=a.w, height=a.h, deviceScaleFactor=a.dpr, mobile=a.mobile)
        ws.call("Network.enable"); ws.call("Network.setBlockedURLs", urls=shot.BLOCK)
        ws.call("Page.enable"); ws.call("Page.addScriptToEvaluateOnNewDocument", source=shot.CATCH)
        ws.call("Page.navigate", url="file:///" + pg.replace("\\", "/") + "?s=" + a.scene)
        t0 = time.time()
        while time.time() - t0 < 40:
            if shot.ev(ws, "typeof G!=='undefined'&&G.running&&typeof GPU!=='undefined'&&(GPU.ok||GPU.none)&&"
                           "document.documentElement.hasAttribute('data-alive')") is True: break
            time.sleep(.2)
        m0, ts = None, time.time()
        while time.time() - t0 < 50:
            m = shot.ev(ws, "G.mode")
            if m != m0: m0, ts = m, time.time()
            elif time.time() - ts >= 1: break
            time.sleep(.1)
        if a.profile:
            # профайлер с первой секунды после «режим держится»: кто ест кадры дольше 33 мс
            ws.call("Profiler.enable"); ws.call("Profiler.setSamplingInterval", interval=250)
            shot.ev(ws, "window.__PF=[];window.__PT0=performance.now();(function f(t){if(window.__PL)__PF.push([__PL-__PT0,t-__PL,(typeof FRAME_JS!=='undefined'?FRAME_JS:-1)]);window.__PL=t;requestAnimationFrame(f);})()")
            ws.call("Profiler.start"); off = shot.ev(ws, "performance.now()-__PT0") or 0
        time.sleep(a.wait)
        r = shot.ev(ws, a.js)
        if a.profile:
            time.sleep(a.profile)
            P = ws.call("Profiler.stop")["profile"]
            fr = shot.ev(ws, "JSON.stringify(__PF)")
            fr = json.loads(fr) if isinstance(fr, str) else []
            nodes = {n["id"]: n["callFrame"] for n in P["nodes"]}
            par = {c: n["id"] for n in P["nodes"] for c in n.get("children", [])}
            nm = lambda cf: (cf.get("functionName") or "(анон)") + (" :%d" % (cf.get("lineNumber", 0) + 1) if cf.get("url") else "")
            longs = [(f[0], f[0] + f[1]) for f in fr if f[1] > 33]
            ts, own, inc = P["startTime"], {}, {}
            ROOTS = {"(root)", "(program)", "(анон)", "frame", "frameBody"}
            for nid, dt in zip(P["samples"], P["timeDeltas"]):
                ts += dt; t = off + (ts - P["startTime"]) / 1000.0
                if not a.all and not any(a0 - 2 <= t <= a1 for a0, a1 in longs): continue
                n0 = nm(nodes.get(nid, {}))
                if n0 == "(idle)": continue
                own[n0] = own.get(n0, 0) + .25
                x, seen = nid, set()
                while x is not None:
                    c = nm(nodes.get(x, {}))
                    if c not in seen and c.split(" ")[0] not in ROOTS: inc[c] = inc.get(c, 0) + .25; seen.add(c)
                    x = par.get(x)
            ds = sorted(f[1] for f in fr)
            print("кадров %d · p50 %.1f p99 %.1f макс %.0f · дольше 33 мс: %d (сумма %.0f мс), JS в них: %s" % (
                len(fr), ds[len(ds) // 2] if ds else 0, ds[int(len(ds) * .99)] if ds else 0, ds[-1] if ds else 0, len(longs),
                sum(b - a0 for a0, b in longs), ",".join("%d" % f[2] for f in fr if f[1] > 33)[:200]))
            print("своё в долгих: " + " · ".join("%s %.0f" % kv for kv in sorted(own.items(), key=lambda kv: -kv[1])[:10]))
            print("с детьми в долгих: " + " · ".join("%s %.0f" % kv for kv in sorted(inc.items(), key=lambda kv: -kv[1])[:14]))
        print(json.dumps({"mode": shot.ev(ws, "G.mode"), "gpu": shot.ev(ws, "!!GPU.ok"), "out": r}, ensure_ascii=False))
    finally:
        noise.kill_tree(proc)
        import shutil; shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    main()
