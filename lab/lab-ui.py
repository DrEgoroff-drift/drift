#!/usr/bin/env python3
"""Пульт лаборатории «Дрейфа» — окно с настройками, кнопками и живым логом (docs/LAB.md «Local lab»).

  pythonw lab/lab-ui.py          # ярлык «Drift Lab» на рабочем столе (lab/lab-shortcut.ps1)

Поднимает сервер на 127.0.0.1:8791 и открывает окно-приложение Edge. Сам ничего не тестирует:
запускает lab-local.py отдельным процессом (он переживает закрытие окна), читает его run.json
(что идёт, сколько готово, новые ошибки) и лог; «Стоп» кладёт stop.flag — лаборатория гасит свои
прогоны и закрывает сессию; «Убить» — дерево процесса и свои Chrome по папке профилей. Тот же
run.json пишет и консольный запуск (lab-start.ps1), поэтому пульт видит и его. Когда прогона нет
и окно закрыто дольше 10 минут, сервер выходит сам.
"""
import ctypes, glob, importlib.util, json, os, subprocess, sys, threading, time, webbrowser
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("lablocal", os.path.join(HERE, "lab-local.py"))
LL = importlib.util.module_from_spec(spec); spec.loader.exec_module(LL)   # пути, kill_tree, pid_alive

PORT = 8791
DATA = os.environ["LAB_DATA"]; WEB = os.environ["LAB_WEB"]
LOGS = os.path.join(DATA, "logs"); CFG = os.path.join(DATA, "launcher.json")
os.makedirs(LOGS, exist_ok=True)
CORES = os.cpu_count() or 4
DEF = {"jobs": max(2, CORES // 4), "minutes": 60, "mode": "full", "ref": "lab-local", "steps": 60}
LAST = [time.time()]
PROC = [None]

def py_exe():
    p = sys.executable
    if p.lower().endswith("pythonw.exe"): p = p[:-11] + "python.exe"
    return p

def cfg_load():
    c = dict(DEF)
    try: c.update(json.load(open(CFG, encoding="utf-8-sig")))
    except Exception: pass
    return c

def cfg_save(c):
    with open(CFG, "w", encoding="utf-8") as f: json.dump(c, f, ensure_ascii=False, indent=1)

def run_state():
    try: r = json.load(open(LL.RUNF, encoding="utf-8"))
    except Exception: return {"phase": "idle"}
    live = r.get("pid") and LL.pid_alive(r["pid"])
    if r.get("phase") in ("build", "run", "stopping") and not live:
        r["phase"] = "lost"      # процесс умер, не дописав итог
    r["alive"] = bool(live)
    return r

# ── нагрузка машины: ЦП по GetSystemTimes, память по GlobalMemoryStatusEx ──
class FT(ctypes.Structure): _fields_ = [("lo", ctypes.c_uint32), ("hi", ctypes.c_uint32)]
class MS(ctypes.Structure):
    _fields_ = [("len", ctypes.c_uint32), ("load", ctypes.c_uint32), ("tot", ctypes.c_uint64), ("avail", ctypes.c_uint64),
                ("pt", ctypes.c_uint64), ("pa", ctypes.c_uint64), ("vt", ctypes.c_uint64), ("va", ctypes.c_uint64), ("ve", ctypes.c_uint64)]
_prev = [None]
def machine():
    i, k, u = FT(), FT(), FT()
    ctypes.windll.kernel32.GetSystemTimes(ctypes.byref(i), ctypes.byref(k), ctypes.byref(u))
    v = lambda f: (f.hi << 32) | f.lo
    cur = (v(i), v(k), v(u)); cpu = 0
    if _prev[0]:
        di, dk, du = (cur[n] - _prev[0][n] for n in range(3))
        cpu = round(100 * (dk + du - di) / max(1, dk + du))
    _prev[0] = cur
    m = MS(); m.len = ctypes.sizeof(MS); ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(m))
    return {"cpu": cpu, "ram": m.load, "ramGb": round(m.tot / 2**30), "cores": CORES}

def branches():
    r = LL.sh(["git", "-C", LL.REPO, "for-each-ref", "--sort=-committerdate", "--format=%(refname:short)", "refs/heads"])
    return [b for b in r.stdout.split() if b][:20]

def log_path(r):
    if r.get("log") and os.path.exists(r["log"]): return r["log"]
    fs = sorted(glob.glob(os.path.join(LOGS, "*.log")), key=os.path.getmtime)
    return fs[-1] if fs else ""

def start(c):
    r = run_state()
    if r.get("alive") and r.get("phase") in ("build", "run", "stopping"): return {"ok": False, "why": "уже идёт"}
    c2 = cfg_load(); c2.update({k: c[k] for k in DEF if k in c}); cfg_save(c2)
    log = os.path.join(LOGS, "lab-" + time.strftime("%Y-%m-%d_%H-%M-%S") + ".log")
    cmd = [py_exe(), "-u", os.path.join(HERE, "lab-local.py"), "--jobs", str(int(c2["jobs"])), "--budget", str(int(c2["minutes"])),
           "--ref", str(c2["ref"]), "--steps", str(int(c2["steps"])), "--log", log]
    if c2["mode"] == "quick": cmd.append("--quick")
    if c2["mode"] == "hunt": cmd.append("--hunt-only")
    with open(log, "a", encoding="utf-8") as f: f.write(time.strftime("%H:%M:%S ") + "пульт: запуск · " + " ".join(cmd[2:]) + "\n")
    err = open(log, "a", encoding="utf-8")   # то, что пишется до лога (сборка упала, аргументы), — туда же
    env = dict(os.environ, PYTHONIOENCODING="utf-8")
    PROC[0] = subprocess.Popen(cmd, cwd=LL.REPO, stdout=subprocess.DEVNULL, stderr=err, env=env,
                               creationflags=LL.NOWIN | 0x00000008 | 0x00000200)   # DETACHED, NEW_PROCESS_GROUP: живёт без окна
    return {"ok": True, "log": log}

def stop(hard=False):
    r = run_state()
    if not hard:
        open(LL.STOPF, "w").close()
        return {"ok": True}
    if r.get("pid"): LL.kill_tree(r["pid"])
    LL.kill_profile(LL.TMP)          # все свои Chrome: профили лежат в %TEMP%\drift-lab
    try:
        r["phase"] = "stopped"; r["t1"] = time.time()
        json.dump(r, open(LL.RUNF, "w", encoding="utf-8"), ensure_ascii=False)
    except Exception: pass
    return {"ok": True}

class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def send(self, code, body, ctype="application/json; charset=utf-8"):
        b = body if isinstance(body, bytes) else json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(code); self.send_header("Content-Type", ctype); self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        LAST[0] = time.time()
        u = urlparse(self.path); q = parse_qs(u.query)
        if u.path in ("/", "/index.html"):
            return self.send(200, open(os.path.join(HERE, "lab-ui.html"), "rb").read(), "text/html; charset=utf-8")
        if u.path == "/api/state":
            r = run_state()
            return self.send(200, {"run": r, "cfg": cfg_load(), "sys": machine(), "now": time.time()})
        if u.path == "/api/branches":
            return self.send(200, {"branches": branches()})
        if u.path == "/api/log":
            p = log_path(run_state()); pos = int(q.get("from", ["0"])[0]); name = os.path.basename(p)
            if not p: return self.send(200, {"text": "", "next": 0, "name": ""})
            if q.get("name", [""])[0] != name: pos = 0
            size = os.path.getsize(p)
            if pos > size: pos = 0
            if pos == 0 and size > 400000: pos = size - 400000     # длинный лог — хвост
            with open(p, "rb") as f: f.seek(pos); data = f.read(400000)
            return self.send(200, {"text": data.decode("utf-8", "replace"), "next": pos + len(data), "name": name})
        if u.path.startswith("/site/"):
            fp = os.path.normpath(os.path.join(os.path.dirname(WEB), u.path[6:].replace("/", os.sep)))
            if os.path.isdir(fp): fp = os.path.join(fp, "index.html")
            if not fp.startswith(os.path.dirname(WEB)) or not os.path.exists(fp): return self.send(404, {"error": "нет"})
            ct = {".html": "text/html; charset=utf-8", ".json": "application/json", ".txt": "text/plain; charset=utf-8",
                  ".png": "image/png", ".js": "text/javascript"}.get(os.path.splitext(fp)[1], "application/octet-stream")
            return self.send(200, open(fp, "rb").read(), ct)
        self.send(404, {"error": "нет"})
    def do_POST(self):
        LAST[0] = time.time()
        n = int(self.headers.get("Content-Length") or 0)
        try: body = json.loads(self.rfile.read(n) or b"{}")
        except Exception: body = {}
        p = urlparse(self.path).path
        if p == "/api/start": return self.send(200, start(body))
        if p == "/api/stop": return self.send(200, stop(False))
        if p == "/api/kill": return self.send(200, stop(True))
        if p == "/api/cfg":
            c = cfg_load(); c.update({k: body[k] for k in DEF if k in body}); cfg_save(c); return self.send(200, {"ok": True})
        if p == "/api/open":
            w = body.get("what")
            if w == "logs": os.startfile(LOGS)
            elif w == "errors": os.startfile(os.path.join(WEB, "errors.txt")) if os.path.exists(os.path.join(WEB, "errors.txt")) else None
            elif w == "page": webbrowser.open("http://127.0.0.1:%d/site/lab/" % PORT)
            return self.send(200, {"ok": True})
        self.send(404, {"error": "нет"})

def window():
    url = "http://127.0.0.1:%d/" % PORT
    edge = [os.path.expandvars(r"%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"),
            os.path.expandvars(r"%ProgramFiles%\Microsoft\Edge\Application\msedge.exe")]
    for e in edge:
        if os.path.exists(e):
            prof = os.path.join(os.environ.get("LOCALAPPDATA", DATA), "drift-lab-ui")
            subprocess.Popen([e, "--app=" + url, "--user-data-dir=" + prof, "--window-size=1360,900", "--no-first-run"])
            return
    webbrowser.open(url)

def reaper(srv):
    while True:
        time.sleep(30)
        r = run_state()
        if time.time() - LAST[0] > 600 and r.get("phase") not in ("build", "run", "stopping"):
            srv.shutdown(); return

def main():
    try: srv = ThreadingHTTPServer(("127.0.0.1", PORT), H)
    except OSError:
        window(); return            # пульт уже поднят — только окно
    threading.Thread(target=reaper, args=(srv,), daemon=True).start()
    if "--no-window" not in sys.argv: window()
    srv.serve_forever()

if __name__ == "__main__":
    main()
