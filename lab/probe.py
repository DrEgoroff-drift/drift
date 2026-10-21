"""зонд цены: стенд сцены на живой видеокарте (headless, свой профиль), сниппет — и его JSON в консоль.
Для охоты за тормозами: «сколько стоит вот эта функция вот в этой сцене» реальными часами.

  python lab/probe.py surface "(()=>{...;return {ms:...}})()" [--w 1600 --h 900 --dpr 1 --mobile] [--wait 3]

Сниппет может вернуть Promise (ждём). Страница — drift.html корня (--root) с хвостом стенда docs/mkview.ps1."""
import argparse, json, os, subprocess, sys, tempfile, time, urllib.request
sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import jank   # page(), shot (CDP)
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
    ap.add_argument("--port", type=int, default=9702)
    a = ap.parse_args()
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
        for _ in range(60):
            try: urllib.request.urlopen("http://127.0.0.1:%d/json/version" % a.port, timeout=2); break
            except Exception: time.sleep(.25)
        req = urllib.request.Request("http://127.0.0.1:%d/json/new?about:blank" % a.port, method="PUT")
        t = json.load(urllib.request.urlopen(req, timeout=10))
        ws = shot.WS(t["webSocketDebuggerUrl"], 300)
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
        time.sleep(a.wait)
        r = shot.ev(ws, a.js)
        print(json.dumps({"mode": shot.ev(ws, "G.mode"), "gpu": shot.ev(ws, "!!GPU.ok"), "out": r}, ensure_ascii=False))
    finally:
        proc.kill()
        import shutil; shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    main()
