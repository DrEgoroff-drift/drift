"""Minimal CDP client (stdlib only) for a headless Chrome on $CDP_PORT (default 9333).
usage:
  cdp.py setup URL            phone metrics 390x844 dpr2 + android UA + touch, then navigate
  cdp.py size W H             change the emulated viewport
  cdp.py eval JS              Runtime.evaluate, prints JSON value
  cdp.py evalfile FILE        same, JS from a file
  cdp.py shot OUT.png [X Y W H SCALE]   screenshot of the viewport (or a scaled clip)
  cdp.py tap X Y              touch tap at CSS px
  cdp.py hold X Y [SECS]      press and hold (pads need >= 0.15 s)
  cdp.py drag X Y X2 Y2 [SECS] [OUT.png]  thumb drag; optional screenshot while holding
"""
import base64, json, os, socket, struct, sys, time, urllib.request

PORT = int(os.environ.get("CDP_PORT", "9333"))


def target_ws():
    tabs = json.load(urllib.request.urlopen("http://127.0.0.1:%d/json" % PORT, timeout=5))
    pages = [t for t in tabs if t.get("type") == "page" and any(k in t.get("url", "") for k in ("127.0.0.1:8812", "drift-game.ru"))]
    return pages[0]["webSocketDebuggerUrl"]


class WS:
    def __init__(self, url):
        rest = url.split("://", 1)[1]
        hostport, path = rest.split("/", 1)
        host, port = hostport.split(":")
        self.s = socket.create_connection((host, int(port)), timeout=60)
        key = base64.b64encode(os.urandom(16)).decode()
        req = ("GET /%s HTTP/1.1\r\nHost: %s\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n"
               "Sec-WebSocket-Key: %s\r\nSec-WebSocket-Version: 13\r\n\r\n") % (path, hostport, key)
        self.s.sendall(req.encode())
        buf = b""
        while b"\r\n\r\n" not in buf:
            buf += self.s.recv(4096)
        self.pending = buf.split(b"\r\n\r\n", 1)[1]
        self.id = 0

    def _read(self, n):
        while len(self.pending) < n:
            chunk = self.s.recv(1 << 20)
            if not chunk:
                raise EOFError
            self.pending += chunk
        out, self.pending = self.pending[:n], self.pending[n:]
        return out

    def send(self, text):
        data = text.encode()
        hdr = bytearray([0x81])
        n = len(data)
        if n < 126:
            hdr.append(0x80 | n)
        elif n < 65536:
            hdr.append(0x80 | 126); hdr += struct.pack(">H", n)
        else:
            hdr.append(0x80 | 127); hdr += struct.pack(">Q", n)
        mask = os.urandom(4)
        hdr += mask
        self.s.sendall(bytes(hdr) + bytes(b ^ mask[i % 4] for i, b in enumerate(data)))

    def recv(self):
        msg = b""
        while True:
            b1, b2 = self._read(2)
            op, n = b1 & 0x0F, b2 & 0x7F
            if n == 126:
                n = struct.unpack(">H", self._read(2))[0]
            elif n == 127:
                n = struct.unpack(">Q", self._read(8))[0]
            if b2 & 0x80:
                m = self._read(4); p = self._read(n)
                p = bytes(c ^ m[i % 4] for i, c in enumerate(p))
            else:
                p = self._read(n)
            if op == 8:
                raise EOFError
            if op in (9, 10):
                continue
            msg += p
            if b1 & 0x80:
                return msg.decode("utf-8", "replace")

    def call(self, method, **params):
        self.id += 1
        me = self.id
        self.send(json.dumps({"id": me, "method": method, "params": params}))
        while True:
            m = json.loads(self.recv())
            if m.get("id") == me:
                if "error" in m:
                    raise RuntimeError(m["error"])
                return m.get("result", {})


def evaluate(ws, js):
    r = ws.call("Runtime.evaluate", expression=js, returnByValue=True, awaitPromise=True)
    if "exceptionDetails" in r:
        return {"EXC": r["exceptionDetails"].get("exception", {}).get("description") or r["exceptionDetails"].get("text")}
    return r.get("result", {}).get("value")


def main():
    cmd = sys.argv[1]
    ws = WS(target_ws())
    if cmd in ("setup", "size"):
        w, h = (390, 844) if cmd == "setup" else (int(sys.argv[2]), int(sys.argv[3]))
        ws.call("Emulation.setDeviceMetricsOverride", width=w, height=h, deviceScaleFactor=2, mobile=True)
        ws.call("Emulation.setTouchEmulationEnabled", enabled=True, maxTouchPoints=5)
        ws.call("Emulation.setUserAgentOverride", userAgent="Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0 Mobile Safari/537.36")
        if cmd == "setup":
            ws.call("Page.enable")
            ws.call("Page.navigate", url=sys.argv[2])
        print("ok")
    elif cmd == "eval":
        print(json.dumps(evaluate(ws, sys.argv[2]), ensure_ascii=False))
    elif cmd == "evalfile":
        print(json.dumps(evaluate(ws, open(sys.argv[2], encoding="utf-8").read()), ensure_ascii=False))
    elif cmd == "shot":
        kw = {"format": "png"}
        if len(sys.argv) > 3:
            x, y, w, h, sc = map(float, sys.argv[3:8])
            kw["clip"] = {"x": x, "y": y, "width": w, "height": h, "scale": sc}
        r = ws.call("Page.captureScreenshot", **kw)
        open(sys.argv[2], "wb").write(base64.b64decode(r["data"]))
        print("saved", sys.argv[2])
    elif cmd == "tapjs":
        # JS returns [x,y] (CSS px) or a string explaining why not; tap there at once
        xy = evaluate(ws, sys.argv[2])
        if not isinstance(xy, list):
            print("no tap:", xy); return
        secs = float(sys.argv[3]) if len(sys.argv) > 3 else 0.05
        ws.call("Input.dispatchTouchEvent", type="touchStart", touchPoints=[{"x": xy[0], "y": xy[1]}])
        time.sleep(secs)
        ws.call("Input.dispatchTouchEvent", type="touchEnd", touchPoints=[])
        print("tapped", xy)
    elif cmd == "tap":
        x, y = float(sys.argv[2]), float(sys.argv[3])
        ws.call("Input.dispatchTouchEvent", type="touchStart", touchPoints=[{"x": x, "y": y}])
        ws.call("Input.dispatchTouchEvent", type="touchEnd", touchPoints=[])
        print("tapped", x, y)
    elif cmd == "hold":
        x, y = float(sys.argv[2]), float(sys.argv[3])
        secs = float(sys.argv[4]) if len(sys.argv) > 4 else 0.2
        ws.call("Input.dispatchTouchEvent", type="touchStart", touchPoints=[{"x": x, "y": y}])
        time.sleep(secs)
        ws.call("Input.dispatchTouchEvent", type="touchEnd", touchPoints=[])
        print("held", x, y, secs)
    elif cmd == "drag":
        x, y, x2, y2 = map(float, sys.argv[2:6])
        hold = float(sys.argv[6]) if len(sys.argv) > 6 else 0.5
        ws.call("Input.dispatchTouchEvent", type="touchStart", touchPoints=[{"x": x, "y": y}])
        for i in range(1, 9):
            k = i / 8
            ws.call("Input.dispatchTouchEvent", type="touchMove", touchPoints=[{"x": x + (x2 - x) * k, "y": y + (y2 - y) * k}])
            time.sleep(0.03)
        time.sleep(hold)
        if len(sys.argv) > 7:
            r = ws.call("Page.captureScreenshot", format="png")
            open(sys.argv[7], "wb").write(base64.b64decode(r["data"]))
        ws.call("Input.dispatchTouchEvent", type="touchEnd", touchPoints=[])
        print("dragged")


if __name__ == "__main__":
    main()
