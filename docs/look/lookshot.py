#!/usr/bin/env python3
"""Shoot a key frame of the planet look-dev stand on the real GPU.

    python docs/look/lookshot.py --out C:/tmp/m600.png
    python docs/look/lookshot.py --out C:/tmp/m600.png --w 1600 --h 900 --ss 2 --q "off=wing"

Opens docs/look/planet.html over file:// in this tool's own headless Chrome (its own port and
profile), waits for the title LOOK_DONE, prints one JSON line (frame size, scene numbers, page and
GPU errors) and writes the PNG. Pictures never go into git: point --out outside the repository.
"""
import argparse, base64, json, os, subprocess, sys, tempfile, time, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from shot import WS, ev, CHROMES, CATCH  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--page", default="planet.html")
    ap.add_argument("--w", type=int, default=1600)
    ap.add_argument("--h", type=int, default=900)
    ap.add_argument("--dpr", type=float, default=1)
    ap.add_argument("--ss", type=float, default=2, help="supersampling of the frame")
    ap.add_argument("--t", type=float, default=3.7, help="the moment, seconds")
    ap.add_argument("--q", default="", help="extra query, e.g. off=wing,bloom")
    ap.add_argument("--port", type=int, default=9527)
    ap.add_argument("--budget", type=int, default=90, help="seconds to wait for the frame")
    a = ap.parse_args()
    chrome = next((c for c in CHROMES if os.path.exists(c)), None)
    if not chrome: sys.exit("no Chrome")
    prof = os.path.join(tempfile.gettempdir(), "drift-look-%d" % a.port)
    proc = subprocess.Popen([chrome, "--headless=new", "--remote-debugging-port=%d" % a.port, "--user-data-dir=" + prof,
                             "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--mute-audio",
                             "--enable-unsafe-webgpu", "--allow-file-access-from-files",
                             "--window-size=%d,%d" % (max(a.w, 500), max(a.h, 400)), "about:blank"],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(60):
            try: urllib.request.urlopen("http://127.0.0.1:%d/json/version" % a.port, timeout=2); break
            except Exception: time.sleep(.25)
        req = urllib.request.Request("http://127.0.0.1:%d/json/new?about:blank" % a.port, method="PUT")
        t = json.load(urllib.request.urlopen(req, timeout=10))
        ws = WS(t["webSocketDebuggerUrl"])
        ws.call("Emulation.setDeviceMetricsOverride", width=a.w, height=a.h, deviceScaleFactor=a.dpr, mobile=False)
        ws.call("Page.enable"); ws.call("Page.addScriptToEvaluateOnNewDocument", source=CATCH)
        url = "file:///" + os.path.join(HERE, a.page).replace("\\", "/") + "?still=1&t=%g&ss=%g" % (a.t, a.ss) + ("&" + a.q if a.q else "")
        ws.call("Page.navigate", url=url)
        t0 = time.time(); title = ""
        while time.time() - t0 < a.budget:
            title = ev(ws, "document.title")
            if isinstance(title, str) and title.startswith("LOOK_"): break
            time.sleep(.3)
        time.sleep(.4)
        st = ev(ws, "({title:document.title,look:window.__look||null,errors:(window.__errs||[]).slice(0,12)})")
        png = ws.call("Page.captureScreenshot", format="png")
        out = os.path.abspath(a.out); os.makedirs(os.path.dirname(out), exist_ok=True)
        open(out, "wb").write(base64.b64decode(png["data"]))
        print("%s  %s" % (out, json.dumps(st, ensure_ascii=False)))
        try: urllib.request.urlopen("http://127.0.0.1:%d/json/close/%s" % (a.port, t["id"]), timeout=5)
        except Exception: pass
    finally:
        proc.kill()


if __name__ == "__main__":
    main()
