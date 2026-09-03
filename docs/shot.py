#!/usr/bin/env python3
"""Headless frame shots without a stand server or the browser pane.

    python docs/shot.py cave                    # docs/shots/x_cave.png (1280x800)
    python docs/shot.py cave system --look      # + lookFrame() numbers per scene
    python docs/shot.py cave --js "G.cave.x=900;G.cave.cy=null" --out C:/tmp/c.png
    python docs/shot.py cave --w 390 --h 844    # phone — NOT honest below 500 px: headless Chrome clamps the window (canvas reads W=500); use test.ps1 -Mobile for phone layout

How: drift.html is cut before </body>, the scene script of docs/mkview.ps1 is
appended (same scenes: ?s=cave|system|night|homeout|hold|...), then an extra
script runs the --js snippet, waits a few frames, optionally measures the canvas
with lookFrame() into <pre id=out>, and Chrome's own --screenshot writes the PNG.
Loaded over file://, so no port, no leftover server, no cached stand. Virtual
time makes the whole thing take a few seconds per scene.
"""
import argparse, os, re, subprocess, sys, tempfile, json, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CHROMES = [r"C:\Program Files\Google\Chrome\Application\chrome.exe",
           r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"]

def stand_tail():
    src = open(os.path.join(HERE, "mkview.ps1"), encoding="utf-8-sig").read()
    m = re.search(r"\$add = @'\r?\n(.*?)\r?\n'@", src, re.S)
    if not m: sys.exit("mkview.ps1: no here-string")
    return m.group(1)

def page_for(scene, tail, a):
    html = open(os.path.join(ROOT, "drift.html"), encoding="utf-8").read()
    cut = html.rfind("</body>")
    extra = """
<script>
setTimeout(function(){
  try{ %s }catch(e){ console.error("shot js: "+e); }
  for(var n=0;n<6;n++){ try{ frame(performance.now()+n*16); }catch(e){} }
  var pre=document.createElement("pre"); pre.id="out"; pre.style.display="none";
  try{ var o={scene:%s, ver:VER}; if(%s)Object.assign(o,lookFrame()); if(%s)o.eval=(function(){return eval(%s);})(); pre.textContent=JSON.stringify(o); }
  catch(e){ pre.textContent = JSON.stringify({error:String(e)}); }
  document.body.appendChild(pre); document.title="SHOT_DONE";
}, %d);
</script>
""" % (a.js or "", json.dumps(scene), "true" if a.look else "false", "true" if a.eval else "false", json.dumps(a.eval or ""), a.delay)
    return html[:cut] + tail + "\n" + extra + "</body></html>"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("scenes", nargs="+")
    ap.add_argument("--js", default="")
    ap.add_argument("--look", action="store_true")
    ap.add_argument("--eval", default="", help="JS expression; its JSON goes into the output line")
    ap.add_argument("--out", default="")
    ap.add_argument("--w", type=int, default=1280)
    ap.add_argument("--h", type=int, default=800)
    ap.add_argument("--dpr", type=float, default=1)
    ap.add_argument("--delay", type=int, default=2600, help="ms after load before --js runs")
    ap.add_argument("--budget", type=int, default=9000, help="virtual time budget, ms")
    a = ap.parse_args()
    chrome = next((c for c in CHROMES if os.path.exists(c)), None)
    if not chrome: sys.exit("no headless browser")
    tail = stand_tail()
    outdir = os.path.join(ROOT, "docs", "shots")
    tmp = tempfile.mkdtemp(prefix="drift-shot-")
    try:
        for sc in a.scenes:
            page = os.path.join(tmp, "v_%s.html" % sc)
            open(page, "w", encoding="utf-8").write(page_for(sc, tail, a))
            out = os.path.abspath(a.out) if (a.out and len(a.scenes) == 1) else os.path.join(outdir, "x_%s.png" % sc)
            url = "file:///" + page.replace("\\", "/") + "?s=" + sc
            base = [chrome, "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
                    "--window-size=%d,%d" % (a.w, a.h), "--force-device-scale-factor=%g" % a.dpr,
                    "--user-data-dir=" + os.path.join(tmp, "prof"), "--no-first-run",
                    "--no-default-browser-check", "--virtual-time-budget=%d" % a.budget]
            subprocess.run(base + ["--screenshot=" + out, url], capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=120)
            line = "%s -> %s" % (sc, out)
            if a.look or a.eval:
                r2 = subprocess.run(base + ["--dump-dom", url], capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=120)
                m = re.search(r'<pre id="out"[^>]*>(.*?)</pre>', r2.stdout or "", re.S)
                line += "  " + (m.group(1) if m else "(no <pre id=out>)")
            print(line)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

if __name__ == "__main__":
    main()
