#!/usr/bin/env python3
"""One Chrome for every window and every scene (M442, docs/DESIGN-tests.md §3.1).

    python docs/stand.py --scene шахта --size 1280,800 --out C:/tmp/dig.png
    python docs/stand.py --scenes system,dig,map --sizes 1280x800,1920x1080
    python docs/stand.py --scenes all --sizes 390x844 --look      # + lookFrame() numbers
    python docs/stand.py --scene cave --js "G.cave.x=900" --frames 40
    python docs/stand.py --list                                   # scene names

How: Chrome starts ONCE, headless, with --remote-debugging-port and its own
--user-data-dir in TEMP; the script speaks the DevTools protocol over a
websocket (a small stdlib client below - nothing to pip-install). The page is
drift.html from the repo root, loaded once. A window size is a device-metrics
override (Emulation.setDeviceMetricsOverride), so it is honest below 500 px,
where `--window-size` is clamped (docs/shot.py). A scene is one of lookScenes()
(28y-look) - the same table the frame meter, the fuzzer and the tests use -
set on a fresh copy of the boot world (snapshot/applySave, as lookAll does),
left to live on its own real clock until the bake queue is idle, then
Page.captureScreenshot takes the whole page: canvas AND the DOM instruments.

Pictures go to a temp dir (printed); a path inside the repository is refused -
pictures do not go into git (CLAUDE.md, «the default answer for a new picture
is no»). Only Chromes this script started are ever closed.
"""
import argparse, base64, json, os, socket, struct, subprocess, sys, tempfile, time, shutil
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CHROMES = [r"C:\Program Files\Google\Chrome\Application\chrome.exe",
           r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
           "/usr/bin/google-chrome", "/usr/bin/chromium"]
# Latin names for the lookScenes() ids (tests/90a-tools.js knows the same table)
ALIAS = {"system": "система", "map": "карта", "landing": "заход", "surface": "грунт день",
         "day": "грунт день", "night": "грунт ночь", "dig": "шахта", "cave": "пещера",
         "belt": "пояс", "wanderer": "сорока", "raid": "рейд", "winter": "зимовка",
         "spa": "санаторий", "scoop": "черпак", "base": "база", "home": "дом"}


# ── a minimal websocket client (RFC 6455, client side, text frames) ──
class WS:
    def __init__(self, url, timeout=60):
        assert url.startswith("ws://"), url
        hostport, path = url[5:].split("/", 1)
        host, port = hostport.split(":")
        self.s = socket.create_connection((host, int(port)), timeout=timeout)
        key = base64.b64encode(os.urandom(16)).decode()
        req = ("GET /%s HTTP/1.1\r\nHost: %s\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n"
               "Sec-WebSocket-Key: %s\r\nSec-WebSocket-Version: 13\r\n\r\n") % (path, hostport, key)
        self.s.sendall(req.encode())
        head = b""
        while b"\r\n\r\n" not in head:
            chunk = self.s.recv(4096)
            if not chunk:
                raise IOError("websocket: handshake closed")
            head += chunk
        head, self.buf = head.split(b"\r\n\r\n", 1)
        if b" 101 " not in head.split(b"\r\n", 1)[0]:
            raise IOError("websocket: no upgrade: " + head.split(b"\r\n", 1)[0].decode("latin1"))

    def _read(self, n):
        while len(self.buf) < n:
            chunk = self.s.recv(max(65536, n - len(self.buf)))
            if not chunk:
                raise IOError("websocket: closed")
            self.buf += chunk
        out, self.buf = self.buf[:n], self.buf[n:]
        return out

    def _frame(self, op, data):
        n = len(data)
        head = bytes([0x80 | op])
        if n < 126:
            head += bytes([0x80 | n])
        elif n < 65536:
            head += bytes([0x80 | 126]) + struct.pack(">H", n)
        else:
            head += bytes([0x80 | 127]) + struct.pack(">Q", n)
        mask = os.urandom(4)
        body = bytes(b ^ mask[i & 3] for i, b in enumerate(data))
        self.s.sendall(head + mask + body)

    def send(self, text):
        self._frame(0x1, text.encode("utf-8"))

    def recv(self):
        parts = []
        while True:
            b0, b1 = self._read(2)
            op, n = b0 & 0x0F, b1 & 0x7F
            if n == 126:
                n = struct.unpack(">H", self._read(2))[0]
            elif n == 127:
                n = struct.unpack(">Q", self._read(8))[0]
            mask = self._read(4) if b1 & 0x80 else None
            data = self._read(n)
            if mask:
                data = bytes(b ^ mask[i & 3] for i, b in enumerate(data))
            if op == 0x9:                       # ping → pong
                self._frame(0xA, data); continue
            if op == 0x8:
                raise IOError("websocket: closed by peer")
            if op in (0x0, 0x1, 0x2):
                parts.append(data)
                if b0 & 0x80:
                    return b"".join(parts).decode("utf-8", "replace")

    def close(self):
        try:
            self._frame(0x8, b"")
            self.s.close()
        except Exception:
            pass


# ── the DevTools protocol on top of it ──
class CDP:
    def __init__(self, ws):
        self.ws, self.n = ws, 0

    def call(self, method, **params):
        self.n += 1
        my = self.n
        self.ws.send(json.dumps({"id": my, "method": method, "params": params}))
        while True:
            msg = json.loads(self.ws.recv())
            if msg.get("id") == my:
                if "error" in msg:
                    raise RuntimeError(method + ": " + json.dumps(msg["error"], ensure_ascii=False))
                return msg.get("result", {})
            # events are not needed: readiness is polled, not awaited

    def js(self, expr, wait=True):
        r = self.call("Runtime.evaluate", expression=expr, awaitPromise=wait, returnByValue=True)
        if "exceptionDetails" in r:
            d = r["exceptionDetails"]
            raise RuntimeError("page: " + (d.get("exception", {}).get("description") or d.get("text", "?")))
        return r.get("result", {}).get("value")


def free_port():
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    p = s.getsockname()[1]
    s.close()
    return p


class Stand:
    """One headless Chrome, one page, many windows and scenes."""

    def __init__(self, page, verbose=False):
        chrome = next((c for c in CHROMES if os.path.exists(c)), None)
        if not chrome:
            sys.exit("stand: no Chrome/Edge found")
        self.prof = tempfile.mkdtemp(prefix="drift-stand-profile-")
        self.port = free_port()
        self.proc = subprocess.Popen([chrome, "--headless=new", "--no-sandbox", "--no-first-run",
                                      "--no-default-browser-check", "--hide-scrollbars", "--mute-audio",
                                      "--remote-debugging-port=%d" % self.port,
                                      "--user-data-dir=" + self.prof, "--window-size=1280,800", "about:blank"],
                                     stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        t0 = time.time()
        pages = None
        while time.time() - t0 < 30:
            try:
                with urllib.request.urlopen("http://127.0.0.1:%d/json/list" % self.port, timeout=2) as r:
                    pages = [t for t in json.load(r) if t.get("type") == "page"]
                if pages:
                    break
            except Exception:
                time.sleep(.2)
        if not pages:
            self.close()
            sys.exit("stand: Chrome did not open its debugging port")
        self.ws = WS(pages[0]["webSocketDebuggerUrl"])
        self.cdp = CDP(self.ws)
        self.cdp.call("Page.enable")
        self.cdp.call("Runtime.enable")
        url = "file:///" + os.path.abspath(page).replace("\\", "/")
        self.cdp.call("Page.navigate", url=url)
        # the page is alive when the game has lived one frame by itself (data-alive, 28-loop)
        t0 = time.time()
        while time.time() - t0 < 60:
            try:
                if self.cdp.js('document.readyState==="complete"&&!!document.documentElement.getAttribute("data-alive")', False):
                    break
            except RuntimeError:
                pass
            time.sleep(.2)
        else:
            self.close()
            sys.exit("stand: the page did not come alive in 60 s")
        # the title screen goes away, the loop keeps running (CLAUDE.md: G.running=false paints the title
        # starfield over the world, LOOP_OFF freezes a half-baked frame); the boot world is remembered
        self.cdp.js("""(()=>{const i=document.getElementById("intro");if(i)i.style.display="none";
          G.running=true;window.__STAND0=JSON.parse(JSON.stringify(snapshot()));return 1;})()""", False)

    def scenes(self):
        return self.cdp.js("lookScenes().map(s=>s.id)", False)

    def window(self, w, h):
        self.cdp.call("Emulation.setDeviceMetricsOverride", width=w, height=h, deviceScaleFactor=1,
                      mobile=w <= 760, screenWidth=w, screenHeight=h)
        self.cdp.js("(()=>{resize();return 1;})()", False)

    def scene(self, sid, js="", frames=24, cap=60):
        expr = """(async()=>{
          const id=%s;
          try{applySave(JSON.parse(JSON.stringify(window.__STAND0)));}catch(e){}
          G.mode="system";G.land=null;G.surf=null;G.dig=null;G.cave=null;G.base=null;G.hin=null;G.st=null;
          document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
          document.body.classList.remove("screen","table","road");
          const sc=lookScenes().find(s=>s.id===id);
          if(!sc)return {err:"нет сцены «"+id+"» (есть: "+lookScenes().map(s=>s.id).join(", ")+")"};
          let up=false;try{up=sc.set()!==false;}catch(e){return {err:"постановка: "+e.message};}
          if(!up)return {err:"сцена не ставится в этом мире"};
          try{ %s }catch(e){return {err:"--js: "+e.message};}
          G.running=true;
          const idle=()=>!(typeof STRIP_JOB!=="undefined"&&STRIP_JOB)&&!(typeof STRIP_PEND!=="undefined"&&STRIP_PEND&&STRIP_PEND.length)&&!(typeof MAT_JOB!=="undefined"&&MAT_JOB);
          let n=0;
          await new Promise(r=>{const f=()=>{n++;if((n>=%d&&idle())||n>=%d)r();else requestAnimationFrame(f);};requestAnimationFrame(f);});
          return {mode:G.mode,frames:n,W,H,ui:UIK};
        })()""" % (json.dumps(sid, ensure_ascii=False), js, frames, cap)
        return self.cdp.js(expr, True)

    def look(self):
        return self.cdp.js("(()=>{const m=lookFrame();return {pair:m.pair,mass:m.mass,edge:m.edge,contrast:m.contrast,tones:m.tones,empty:m.empty};})()", False)

    def shot(self, path):
        r = self.cdp.call("Page.captureScreenshot", format="png")
        with open(path, "wb") as f:
            f.write(base64.b64decode(r["data"]))

    def close(self):
        try:
            if getattr(self, "port", None):
                with urllib.request.urlopen("http://127.0.0.1:%d/json/version" % self.port, timeout=2) as r:
                    bws = json.load(r)["webSocketDebuggerUrl"]
                b = WS(bws, timeout=5)
                CDP(b).ws.send(json.dumps({"id": 1, "method": "Browser.close"}))
                b.close()
        except Exception:
            pass
        try:
            if getattr(self, "ws", None):
                self.ws.close()
        except Exception:
            pass
        try:
            self.proc.wait(timeout=10)
        except Exception:
            self.proc.kill()            # our own process only - never a Chrome we did not start
        for _ in range(20):
            shutil.rmtree(self.prof, ignore_errors=True)
            if not os.path.exists(self.prof):
                break
            time.sleep(.25)


def sizes_of(s):
    """'1280,800' or '1280x800,1920x1080' or '390x844 1440x1440' -> [(w,h), ...]"""
    import re
    out = [(int(w), int(h)) for w, h in re.findall(r"(\d+)\s*[x,×]\s*(\d+)", s.lower())]
    if not out:
        sys.exit("stand: no W,H in %r" % s)
    return out


def safe_name(s):
    return "".join(c if c.isalnum() else "_" for c in s)


def main():
    ap = argparse.ArgumentParser(description="One Chrome over CDP: scenes x windows -> PNGs in a temp dir")
    ap.add_argument("--scene", help="one scene (lookScenes id or Latin alias)")
    ap.add_argument("--scenes", help="comma list, or 'all'")
    ap.add_argument("--size", default="", help="W,H for --scene (default 1280,800)")
    ap.add_argument("--sizes", default="", help="list: 1280x800,1920x1080 (default 1280x800)")
    ap.add_argument("--out", help="PNG path for a single --scene/--size (outside the repository)")
    ap.add_argument("--outdir", help="directory for many shots (default: TEMP/drift-stand/<time>)")
    ap.add_argument("--js", default="", help="JS run after the scene is set, before the frames")
    ap.add_argument("--frames", type=int, default=24, help="frames the scene lives before the shot (min)")
    ap.add_argument("--look", action="store_true", help="print lookFrame() numbers per shot")
    ap.add_argument("--page", default=os.path.join(ROOT, "drift.html"))
    ap.add_argument("--list", action="store_true", help="print scene ids and exit")
    a = ap.parse_args()

    names = []
    if a.scene:
        names = [a.scene]
    elif a.scenes and a.scenes != "all":
        names = [x.strip() for x in a.scenes.split(",") if x.strip()]
    sizes = sizes_of(a.size or a.sizes or "1280,800")
    if a.out and (len(names) != 1 or len(sizes) != 1):
        sys.exit("stand: --out is for one scene in one window; use --outdir for many")
    outdir = a.outdir or os.path.join(tempfile.gettempdir(), "drift-stand", time.strftime("%Y%m%d-%H%M%S"))
    for p in ([a.out] if a.out else []) + [outdir]:
        rp = os.path.realpath(os.path.abspath(p))
        if os.path.commonpath([rp, os.path.realpath(ROOT)]) == os.path.realpath(ROOT):
            sys.exit("stand: %s is inside the repository - pictures do not go into git (CLAUDE.md)" % p)
    if not a.out:
        os.makedirs(outdir, exist_ok=True)

    t0 = time.time()
    st = Stand(a.page)
    try:
        if a.list:
            print("\n".join(st.scenes()))
            return
        if not names or a.scenes == "all":
            names = st.scenes()
        ids = [ALIAS.get(n, n) for n in names]
        shots = 0
        for (w, h) in sizes:
            st.window(w, h)
            for n, sid in zip(names, ids):
                t1 = time.time()
                r = st.scene(sid, a.js, a.frames)
                if not r or r.get("err"):
                    print(json.dumps({"scene": sid, "size": "%dx%d" % (w, h), "err": (r or {}).get("err", "?")}, ensure_ascii=False))
                    continue
                path = a.out or os.path.join(outdir, "%s-%dx%d.png" % (safe_name(n), w, h))
                st.shot(path)
                shots += 1
                row = {"scene": sid, "size": "%dx%d" % (w, h), "mode": r["mode"], "frames": r["frames"],
                       "ui": round(r["ui"], 2), "ms": int((time.time() - t1) * 1000), "file": path}
                if a.look:
                    row["look"] = st.look()
                print(json.dumps(row, ensure_ascii=False))
                sys.stdout.flush()
        print("stand: %d shots in %.1f s, one Chrome · %s" % (shots, time.time() - t0, a.out or outdir))
    finally:
        st.close()


if __name__ == "__main__":
    main()
