#!/usr/bin/env python3
"""Shoot the scenes of any old stand script through docs/shot.py — the album sheets (G13).

    python docs/shotstand.py docs/mkshots.ps1 system map belt            # docs/shots/<scene>.png, 1280x720
    python docs/shotstand.py docs/mkshots.ps1 docs/mksiteshots.ps1 surface --grab "siteShot()" --ext webp
    python docs/shotstand.py docs/mkshots.ps1 cave --out /tmp/c.png --w 760 --h 475

The stand scripts (mkshots.ps1 and friends) keep their scene tables in a `$add = @' … '@`
here-string that is appended to drift.html. They used to be opened by their own Chrome with
--disable-gpu, from the stand server on :8777 — since the renderer is WebGPU (23.09) that shot
the «нет WebGPU» notice. Here the page is built by shot.py's page_for() with the stand's tail
instead of mkview's, so the Chrome, the GPU flags (SWIFTSHADER when DRIFT_GPU=swiftshader),
the stepped clock, the device wait and the blocked URLs are shot.py's own: one place (PLAN G13).

The scene reaches the tail as ?s=<scene>&scene=<scene> (mkview reads s=, mkshots reads scene=).
--grab JS: instead of a page screenshot, evaluate JS that returns a data: URL and save its bytes
(mksiteshots: the world alone, cropped to 1600x900, as webp).
"""
import argparse, base64, importlib.util, json, os, re, shutil, subprocess, sys, tempfile, time, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("shot", os.path.join(HERE, "shot.py"))
shot = importlib.util.module_from_spec(spec); spec.loader.exec_module(shot)


def tail_of(path):
    src = open(path, encoding="utf-8-sig").read()
    m = re.search(r"\$add\s*=\s*@'\r?\n(.*?)\r?\n'@", src, re.S)
    if not m: sys.exit("%s: no $add = @'...'@ here-string" % path)
    return m.group(1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("items", nargs="+", help="stand .ps1 files (their tails, in order), then scene names")
    ap.add_argument("--js", default="", help="runs once the GPU is up and the scene is set (shot.py --js)")
    ap.add_argument("--grab", default="", help="JS returning a data: URL to save instead of a screenshot")
    ap.add_argument("--ext", default="png", help="file extension of the output")
    ap.add_argument("--outdir", default=os.path.join(ROOT, "docs", "shots"))
    ap.add_argument("--out", default="", help="output path (one scene only)")
    ap.add_argument("--w", type=int, default=1280)
    ap.add_argument("--h", type=int, default=720)
    ap.add_argument("--dpr", type=float, default=1)
    ap.add_argument("--delay", type=int, default=-1, help="stepped ms before --js; default 2600, 600 on SwiftShader")
    ap.add_argument("--budget", type=int, default=0, help="ms per scene; default 60000, 900000 on SwiftShader")
    ap.add_argument("--port", type=int, default=9480)
    ap.add_argument("--seed", type=int, default=1)
    ap.add_argument("--clock", choices=["step", "wall"], default="step")
    ap.add_argument("--gpu", choices=["auto", "real", "swiftshader"], default="auto")
    a = ap.parse_args()
    stands = [s for s in a.items if s.endswith(".ps1")]
    scenes = [s for s in a.items if not s.endswith(".ps1")]
    if not stands or not scenes: sys.exit("usage: shotstand.py STAND.ps1 [STAND2.ps1] SCENE [SCENE...]")
    soft = a.soft = a.gpu == "swiftshader" or (a.gpu == "auto" and os.environ.get("DRIFT_GPU") == "swiftshader")
    if a.delay < 0: a.delay = 600 if soft else 2600
    if not a.budget: a.budget = 900000 if soft else 60000
    a.look = False; a.eval = ""; a.until = ""
    tail = "\n".join(tail_of(s) for s in stands)
    chrome = next((c for c in shot.CHROMES if os.path.exists(c)), None)
    if not chrome: sys.exit("no Chrome")
    os.makedirs(a.outdir, exist_ok=True)
    tmp = tempfile.mkdtemp(prefix="drift-stand-")
    prof = os.path.join(tempfile.gettempdir(), "drift-stand-%d" % a.port)
    proc = subprocess.Popen([chrome, "--headless=new", "--remote-debugging-port=%d" % a.port, "--user-data-dir=" + prof,
                             "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--mute-audio",
                             "--enable-unsafe-webgpu", "--window-size=%d,%d" % (max(a.w, 500), max(a.h, 400))]
                            + (shot.SWIFTSHADER if soft else []) + ["about:blank"],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    bad = 0
    try:
        for _ in range(60):
            try: urllib.request.urlopen("http://127.0.0.1:%d/json/version" % a.port, timeout=2); break
            except Exception: time.sleep(.25)
        for sc in scenes:
            t00 = time.time()
            page = os.path.join(tmp, "s_%s.html" % sc)
            open(page, "w", encoding="utf-8").write(shot.page_for(sc, tail, a))
            out = os.path.abspath(a.out) if (a.out and len(scenes) == 1) else os.path.join(a.outdir, "%s.%s" % (sc, a.ext))
            req = urllib.request.Request("http://127.0.0.1:%d/json/new?about:blank" % a.port, method="PUT")
            t = json.load(urllib.request.urlopen(req, timeout=10))
            ws = shot.WS(t["webSocketDebuggerUrl"], 900 if soft else 120)
            ws.call("Emulation.setDeviceMetricsOverride", width=a.w, height=a.h, deviceScaleFactor=a.dpr, mobile=a.w <= 760)
            ws.call("Network.enable"); ws.call("Network.setBlockedURLs", urls=shot.BLOCK)
            ws.call("Page.enable"); ws.call("Page.addScriptToEvaluateOnNewDocument", source=shot.CATCH)
            ws.call("Page.navigate", url="file:///" + page.replace("\\", "/").lstrip("/") + "?s=%s&scene=%s" % (sc, sc))
            t0 = time.time(); done = False
            while time.time() - t0 < a.budget / 1000:
                if shot.ev(ws, "document.title") == "SHOT_DONE": done = True; break
                time.sleep(.3)
            st = shot.ev(ws, "({gpu:{ok:GPU.ok,none:GPU.none,errs:GPU.errs},title:document.title,"
                             "crash:document.body.innerText.indexOf('СБОЙ')>=0,errors:(window.__errs||[]).slice(0,6)})")
            if a.grab:
                url = shot.ev(ws, a.grab)
                if isinstance(url, str) and url.startswith("data:"):
                    open(out, "wb").write(base64.b64decode(url.split(",", 1)[1]))
                else:
                    st["grab"] = url; out = "(not written)"
            else:
                png = ws.call("Page.captureScreenshot", format="png")
                open(out, "wb").write(base64.b64decode(png["data"]))
            # a scene is good when the stand finished, the GPU is up with no validation errors, there is no «СБОЙ»,
            # and nothing uncaught (E/R) or reported by the stand's own scene code (C сцена… / C заглавная…)
            errs = [e for e in (st.get("errors") or []) if e[:2] in ("E ", "R ") or re.match(r"C (сцена|заглавная|shot js|step)", e)]
            g = st.get("gpu") or {}
            ok = done and g.get("ok") and not g.get("errs") and not st.get("crash") and not errs and out != "(not written)"
            bad += 0 if ok else 1
            print("%s -> %s  %.0f s  %s%s" % (sc, out, time.time() - t00, "" if ok else "FAILED ", json.dumps(st, ensure_ascii=False)), flush=True)
            try: urllib.request.urlopen("http://127.0.0.1:%d/json/close/%s" % (a.port, t["id"]), timeout=5)
            except Exception: pass
    finally:
        proc.kill()
        shutil.rmtree(tmp, ignore_errors=True)
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
