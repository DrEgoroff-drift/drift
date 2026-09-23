#!/usr/bin/env python3
"""Frame shots on the real GPU — the one way to take a frame (the renderer is WebGPU since 23.09).

    python docs/shot.py cave                     # docs/shots/x_cave.png, 1280x800 at DPR 2
    python docs/shot.py cave system --look       # + lookFrame() numbers of the composed frame
    python docs/shot.py cave --js "G.cave.x=900" --out C:/tmp/c.png
    python docs/shot.py surface --w 390 --h 844 --dpr 2.625      # the S23, honestly (emulation)
    python docs/shot.py title                    # the title screen (drift.html as is)
    python docs/shot.py system --tag before --port 9471          # parallel runs: different ports

How: drift.html is cut before </body>, the scene script of docs/mkview.ps1 is appended (the
same scenes: ?s=cave|system|night|homeout|hold|...), then an extra script waits for the WebGPU
device, runs --js, draws a few frames, optionally measures the composed frame with lookFrame()
and evaluates --eval. The page is loaded over file:// into this tool's own headless Chrome on
the real GPU (its own port and profile — no server, parallel-safe), driven over CDP; writes to
the live site are blocked. Per scene it prints one line: the PNG path and a JSON with the GPU
state (ok, errs — validation errors seen by the core), page errors, the «СБОЙ» banner, and the
--look/--eval results. Only this tool's own Chrome is killed at the end.
"""
import argparse, base64, json, os, re, socket, struct, subprocess, sys, tempfile, time, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CHROMES = [r"C:\Program Files\Google\Chrome\Application\chrome.exe",
           r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
           r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
           "/usr/bin/google-chrome", "/usr/bin/chromium"]
BLOCK = ["*api.php*", "*log.php*", "*drift-sw.js*", "*war.php*"]
CATCH = ("window.__errs=[];addEventListener('error',e=>__errs.push('E '+e.message));"
         "addEventListener('unhandledrejection',e=>__errs.push('R '+(e.reason&&e.reason.message||e.reason)));"
         "(function(){const ce=console.error,cw=console.warn;"
         "console.error=function(){__errs.push('C '+[...arguments].join(' ').slice(0,240));return ce.apply(console,arguments)};"
         "console.warn=function(){__errs.push('W '+[...arguments].join(' ').slice(0,240));return cw.apply(console,arguments)}})();")


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
(function wait(t0){
  /* кадр рисует только видеокарта: ждём устройство (или честный отказ) */
  if(typeof GPU!=="undefined"&&!GPU.ok&&!GPU.none&&performance.now()-t0<8000){setTimeout(function(){wait(t0)},40);return;}
  setTimeout(function(){
    try{ %s }catch(e){ console.error("shot js: "+e); }
    for(var n=0;n<6;n++){ try{ frame(performance.now()+n*16); }catch(e){} }
    /* материал грунта печётся по кадрам (M418): шести кадров ему мало — стенд платит разом */
    try{ if(typeof MAT_JOB!=="undefined" && MAT_JOB && typeof planetMatNow==="function"){
           planetMatNow(MAT_JOB.p);
           for(var m=0;m<4;m++) frame(performance.now()+(7+m)*16); } }catch(e){}
    var o={scene:%s, ver:VER};
    try{ if(%s)Object.assign(o,lookFrame()); if(%s)o.eval=(function(){return eval(%s);})(); }
    catch(e){ o.error=String(e); }
    window.__shot=o; document.title="SHOT_DONE";
  }, %d);
})(performance.now());
</script>
""" % (a.js or "", json.dumps(scene), "true" if a.look else "false", "true" if a.eval else "false", json.dumps(a.eval or ""), a.delay)
    return html[:cut] + ("" if scene == "title" else tail) + "\n" + extra + "</body></html>"


class WS:
    """a minimal CDP websocket client (stdlib only)"""
    def __init__(self, url):
        hostport, path = url.split("://", 1)[1].split("/", 1)
        host, port = hostport.split(":")
        self.s = socket.create_connection((host, int(port)), timeout=120)
        key = base64.b64encode(os.urandom(16)).decode()
        self.s.sendall(("GET /%s HTTP/1.1\r\nHost: %s\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n"
                        "Sec-WebSocket-Key: %s\r\nSec-WebSocket-Version: 13\r\n\r\n" % (path, hostport, key)).encode())
        buf = b""
        while b"\r\n\r\n" not in buf: buf += self.s.recv(4096)
        self.pending = buf.split(b"\r\n\r\n", 1)[1]; self.id = 0

    def _read(self, n):
        while len(self.pending) < n:
            chunk = self.s.recv(1 << 20)
            if not chunk: raise EOFError
            self.pending += chunk
        out, self.pending = self.pending[:n], self.pending[n:]
        return out

    def send(self, text):
        data = text.encode(); hdr = bytearray([0x81]); n = len(data)
        if n < 126: hdr.append(0x80 | n)
        elif n < 65536: hdr.append(0x80 | 126); hdr += struct.pack(">H", n)
        else: hdr.append(0x80 | 127); hdr += struct.pack(">Q", n)
        mask = os.urandom(4); hdr += mask
        self.s.sendall(bytes(hdr) + bytes(b ^ mask[i % 4] for i, b in enumerate(data)))

    def recv(self):
        msg = b""
        while True:
            b1, b2 = self._read(2); op, n = b1 & 0x0F, b2 & 0x7F
            if n == 126: n = struct.unpack(">H", self._read(2))[0]
            elif n == 127: n = struct.unpack(">Q", self._read(8))[0]
            p = self._read(n)
            if op == 8: raise EOFError
            if op in (9, 10): continue
            msg += p
            if b1 & 0x80: return msg.decode("utf-8", "replace")

    def call(self, method, **params):
        self.id += 1; me = self.id
        self.send(json.dumps({"id": me, "method": method, "params": params}))
        while True:
            m = json.loads(self.recv())
            if m.get("id") == me:
                if "error" in m: raise RuntimeError(m["error"])
                return m.get("result", {})


def ev(ws, js):
    r = ws.call("Runtime.evaluate", expression=js, returnByValue=True, awaitPromise=True)
    if "exceptionDetails" in r:
        return {"EXC": (r["exceptionDetails"].get("exception") or {}).get("description") or r["exceptionDetails"].get("text")}
    return r.get("result", {}).get("value")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("scenes", nargs="+")
    ap.add_argument("--js", default="", help="scene setup snippet, runs once the GPU is up")
    ap.add_argument("--look", action="store_true", help="lookFrame() of the composed frame")
    ap.add_argument("--eval", default="", help="JS expression; its JSON goes into the output line")
    ap.add_argument("--out", default="", help="PNG path (one scene only)")
    ap.add_argument("--tag", default="x", help="file prefix: docs/shots/<tag>_<scene>.png")
    ap.add_argument("--w", type=int, default=1280)
    ap.add_argument("--h", type=int, default=800)
    ap.add_argument("--dpr", type=float, default=2)
    ap.add_argument("--delay", type=int, default=2600, help="ms after the GPU is up before --js runs")
    ap.add_argument("--port", type=int, default=9460)
    ap.add_argument("--budget", type=int, default=40000, help="ms a scene may take before it is shot as is (vetshot passes it)")
    a = ap.parse_args()
    chrome = next((c for c in CHROMES if os.path.exists(c)), None)
    if not chrome: sys.exit("no Chrome")
    tail = stand_tail()
    outdir = os.path.join(ROOT, "docs", "shots"); os.makedirs(outdir, exist_ok=True)
    tmp = tempfile.mkdtemp(prefix="drift-shot-")
    prof = os.path.join(tempfile.gettempdir(), "drift-shot-%d" % a.port)
    proc = subprocess.Popen([chrome, "--headless=new", "--remote-debugging-port=%d" % a.port, "--user-data-dir=" + prof,
                             "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--mute-audio",
                             "--enable-unsafe-webgpu", "--window-size=%d,%d" % (max(a.w, 500), max(a.h, 400)), "about:blank"],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(60):
            try: urllib.request.urlopen("http://127.0.0.1:%d/json/version" % a.port, timeout=2); break
            except Exception: time.sleep(.25)
        for sc in a.scenes:
            page = os.path.join(tmp, "v_%s.html" % sc)
            open(page, "w", encoding="utf-8").write(page_for(sc, tail, a))
            out = os.path.abspath(a.out) if (a.out and len(a.scenes) == 1) else os.path.join(outdir, "%s_%s.png" % (a.tag, sc))
            req = urllib.request.Request("http://127.0.0.1:%d/json/new?about:blank" % a.port, method="PUT")
            t = json.load(urllib.request.urlopen(req, timeout=10))
            ws = WS(t["webSocketDebuggerUrl"])
            ws.call("Emulation.setDeviceMetricsOverride", width=a.w, height=a.h, deviceScaleFactor=a.dpr, mobile=a.w <= 760)
            if a.w <= 760: ws.call("Emulation.setTouchEmulationEnabled", enabled=True, maxTouchPoints=5)
            ws.call("Network.enable"); ws.call("Network.setBlockedURLs", urls=BLOCK)
            ws.call("Page.enable"); ws.call("Page.addScriptToEvaluateOnNewDocument", source=CATCH)
            ws.call("Page.navigate", url="file:///" + page.replace("\\", "/") + ("" if sc == "title" else "?s=" + sc))
            t0 = time.time()
            while time.time() - t0 < max(a.budget, a.delay + 10000) / 1000 and ev(ws, "document.title") != "SHOT_DONE": time.sleep(.3)
            time.sleep(.5)
            st = ev(ws, "({shot:window.__shot||null,gpu:{ok:GPU.ok,none:GPU.none,errs:GPU.errs},"
                        "crash:document.body.innerText.indexOf('СБОЙ')>=0,errors:(window.__errs||[]).slice(0,6)})")
            png = ws.call("Page.captureScreenshot", format="png")
            open(out, "wb").write(base64.b64decode(png["data"]))
            print("%s -> %s  %s" % (sc, out, json.dumps(st, ensure_ascii=False)))
            try: urllib.request.urlopen("http://127.0.0.1:%d/json/close/%s" % (a.port, t["id"]), timeout=5)
            except Exception: pass
    finally:
        proc.kill()
        import shutil; shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    main()
