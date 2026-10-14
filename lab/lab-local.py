#!/usr/bin/env python3
"""Drift lab at home — the server lab (lab.sh) on this Windows machine (docs/LAB.md «Local lab»).

  python lab/lab-local.py [--budget MIN] [--jobs N] [--quick] [--ref planet-main] [--src DIR]
                          [--steps 60] [--no-build] [--serve PORT]

A session: check the ref out into its own detached worktree (--src, default C:\\Claude\\drift-labrun),
build it, then run the round in parallel — Node tier, the vision, light shards (1280x800),
phone (390x844), tall (1440x1440) and the author's window (2000x1000) in parts, every heavy suite
alone, the flight tour — and then the hunt (91zzzzzzzzb-hunt, a seeded bot walk) seed after seed
until the budget ends. Every Chrome has its own profile under %TEMP%\\drift-lab and the real GPU;
on a timeout only processes whose command line holds that profile are killed. Everything runs at
below-normal priority. Reports go through lab.py: keys, dedup, quiet/gone, the page.

Data: %USERPROFILE%\\drift-data\\lab (LAB_DATA); the page: %USERPROFILE%\\drift-data\\site\\lab —
served by --serve PORT at http://127.0.0.1:PORT/lab/ (the page fetches /lab/data.json).
"""
import argparse, json, os, re, shutil, subprocess, sys, time, threading, urllib.parse
from concurrent.futures import ThreadPoolExecutor, wait, FIRST_COMPLETED

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
HOMED = os.path.expanduser("~")
os.environ.setdefault("LAB_DATA", os.path.join(HOMED, "drift-data", "lab"))
os.environ.setdefault("LAB_WEB", os.path.join(HOMED, "drift-data", "site", "lab"))
BELOW = 0x00004000          # BELOW_NORMAL_PRIORITY_CLASS: Chrome и node наследуют его
NOWIN = 0x08000000          # CREATE_NO_WINDOW
TMP = os.path.join(os.environ.get("TEMP", HOMED), "drift-lab")
LIGHT_N, WIN_N = 6, 4
TMO = {"node": 300, "vision": 300, "light": 300, "mobile": 420, "tall": 420, "wide": 420,
       "heavy": 600, "solo": 900, "tour": 900, "hunt": 300}

def sh(cmd, cwd=None, timeout=None):
    return subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, encoding="utf-8", errors="replace",
                          timeout=timeout, creationflags=BELOW | NOWIN)

def node_exe():
    n = shutil.which("node")
    if n: return n
    p = r"C:\Claude\tools\node\node.exe"
    return p if os.path.exists(p) else None

def chrome_exe(src):
    t = open(os.path.join(src, "test.ps1"), encoding="utf-8-sig").read()
    m = re.search(r'\$CFT = "([^"]+)"', t)
    cands = [r"C:\Claude\tools\chrome-for-testing\%s\chrome-win64\chrome.exe" % m.group(1)] if m else []
    cands += [r"C:\Program Files\Google\Chrome\Application\chrome.exe"]
    for c in cands:
        if os.path.exists(c): return c
    sys.exit("lab: no Chrome found (" + ", ".join(cands) + ")")

def kill_profile(prof):
    """гасим только свои Chrome — по папке профиля в командной строке; чужой Chrome живёт"""
    ps = ("Get-CimInstance Win32_Process -Filter \"Name='chrome.exe'\" | Where-Object { $_.CommandLine -like '*%s*' } | "
          "ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }") % prof.replace("'", "''")
    try: sh(["powershell", "-NoProfile", "-Command", ps], timeout=60)
    except Exception: pass

def kill_tree(pid):
    """зависший прогон: гасим его и всех потомков по PID — только своё дерево, без taskkill"""
    ps = ("function K($i){ Get-CimInstance Win32_Process -Filter \"ParentProcessId=$i\" | ForEach-Object { K $_.ProcessId }; "
          "Stop-Process -Id $i -Force -ErrorAction SilentlyContinue }; K %d") % pid
    try: sh(["powershell", "-NoProfile", "-Command", ps], timeout=60)
    except Exception: pass

def peak_mem(pid, stop, box):
    try: import psutil
    except Exception: return
    while not stop.is_set():
        try:
            p = psutil.Process(pid); m = p.memory_info().rss
            for c in p.children(recursive=True):
                try: m += c.memory_info().rss
                except Exception: pass
            box[0] = max(box[0], m)
        except Exception: return
        stop.wait(1)

# ── живой лог: время в начале строки, копия в файл (--log) ──
class Tee:
    def __init__(self, out, path):
        self.out, self.f, self.bol = out, (open(path, "a", encoding="utf-8") if path else None), True
        self.lock = threading.Lock()
    def write(self, s):
        # print пишет текст и «\n» двумя вызовами: строка копится у своего потока и уходит целиком,
        # иначе два потока склеивали «→ light 4/6 → light 0/6» в одну строку
        tl = self.__dict__.setdefault("tl", threading.local())
        buf = getattr(tl, "buf", "") + s
        *whole, tl.buf = buf.split("\n")
        if not whole: return
        with self.lock:
            for line in whole:
                part = time.strftime("%H:%M:%S ") + line + "\n"
                self.out.write(part)
                if self.f: self.f.write(part)
            self.out.flush()
            if self.f: self.f.flush()
    def flush(self):
        self.out.flush()
        if self.f: self.f.flush()

RUNNING = {}    # pid → профиль: по Ctrl+C гасим всё своё, чужой Chrome не трогаем
STOP = threading.Event()
NOW = {}        # pid → {kind, arg, t0}: что идёт сейчас — для пульта (lab-ui.py)
# пульт и консоль видят одно: run.json — что идёт и сколько готово, stop.flag — просьба остановиться
RUNF = os.path.join(os.environ["LAB_DATA"], "run.json")
STOPF = os.path.join(os.environ["LAB_DATA"], "stop.flag")
LIVE = {}

def pid_alive(pid):
    import ctypes
    k = ctypes.windll.kernel32
    h = k.OpenProcess(0x1000, False, int(pid))   # PROCESS_QUERY_LIMITED_INFORMATION
    if not h: return False
    code = ctypes.c_ulong(); k.GetExitCodeProcess(h, ctypes.byref(code)); k.CloseHandle(h)
    return code.value == 259                        # STILL_ACTIVE

def live_write(**kw):
    LIVE.update(kw)
    LIVE["now"] = [dict(v) for v in list(NOW.values())]
    LIVE["beat"] = time.time()
    try:
        tmp = RUNF + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f: json.dump(LIVE, f, ensure_ascii=False)
        os.replace(tmp, RUNF)
    except Exception: pass

def run_unit(u, ctx):
    """→ (unit, out_path, secs, mem_mb, rc, err_path); out is the report file lab.py reads"""
    kind, arg, cmd, prof, text = u["kind"], u["arg"], u["cmd"], u.get("prof"), u.get("text")
    out, err = u["out"], u["err"]
    for f in (out, err):
        try: os.remove(f)
        except Exception: pass
    t0 = time.time(); rc = 0; box = [0]; stop = threading.Event()
    if STOP.is_set(): return u, out, 0, 0, 130, err
    print("  → %s %s" % (kind, arg))
    with open(err if text else os.devnull, "w", encoding="utf-8") as ef, open(out if text else os.devnull, "w", encoding="utf-8") as of:
        p = subprocess.Popen(cmd, cwd=ctx["src"], stdout=of, stderr=ef, creationflags=BELOW | NOWIN)
        RUNNING[p.pid] = prof
        NOW[p.pid] = {"kind": kind, "arg": arg, "t0": t0}; live_write()
        th = threading.Thread(target=peak_mem, args=(p.pid, stop, box), daemon=True); th.start()
        try: rc = p.wait(timeout=TMO[kind])
        except subprocess.TimeoutExpired:
            rc = 124
            kill_tree(p.pid)
        stop.set()
        RUNNING.pop(p.pid, None); NOW.pop(p.pid, None)
    if prof:
        kill_profile(prof)
        shutil.rmtree(prof, ignore_errors=True)
    if u.get("post"): u["post"](u, rc)
    return u, out, int(time.time() - t0), box[0] // 1048576, rc, err

# ── отчёты не со страницы: зрение и тур печатают текст, lab.py ждёт заголовок и «✗» ──
def vision_post(u, rc):
    try: t = open(u["out"], encoding="utf-8", errors="replace").read()
    except Exception: t = ""
    if rc == 124: return
    bad = []
    for blk in ("СЛЕПО", "БРАК"):
        m = re.search(r"^%s \(\d+\):\n((?:[ \t].*\n?)*)" % blk, t, re.M)
        if not m: continue
        for l in m.group(1).split("\n"):
            if re.match(r"^  \S", l): bad.append("  ✗ зрение · %s%s" % ("СЛЕПО " if blk == "СЛЕПО" else "", l.strip()))
            elif l.strip() and bad: bad.append("      " + l.strip())
    head = ("FAILED %d · passed 0 · suites 1 of 1" % sum(1 for b in bad if "✗" in b)) if (rc or bad) else "ALL GREEN · passed 1 · suites 1 of 1"
    if rc and not bad: bad = ["  ✗ зрение · выход %d без строки брака" % rc] + ["      " + l for l in t.strip().split("\n")[-12:]]
    open(u["out"], "w", encoding="utf-8").write(head + "\n\n" + "\n".join(bad) + "\n\n" + t)

def tour_post(u, rc):
    try: t = open(u["out"], encoding="utf-8", errors="replace").read()
    except Exception: t = ""
    if rc == 124: return
    red = [l for l in t.split("\n") if l.startswith("RED: ")]
    if rc == 0: body = "ALL GREEN · passed 1 · suites 1 of 1\n\n"
    else:
        msg = red[0][5:] if red else "выход %d" % rc
        body = "FAILED 1 · passed 0 · suites 1 of 1\n\n  ✗ тур полёта · %s\n%s\n\n" % (msg, "\n".join("      " + l for l in t.strip().split("\n")[-14:]))
    open(u["out"], "w", encoding="utf-8").write(body + t)

def page_unit(ctx, kind, arg, query, win):
    n = ctx["n"] = ctx["n"] + 1
    base = os.path.join(ctx["tmp"], "%s-%d" % (kind, n))
    url = ctx["page"] + "?" + query + ("&" if query else "") + "win=" + win
    return {"kind": kind, "arg": arg, "out": base + ".html", "err": base + ".err", "prof": base + "-prof",
            "cmd": [ctx["node"], os.path.join(ctx["src"], "test-chrome.js"), "--chrome=" + ctx["chrome"], "--url=" + url,
                    "--dom=" + base + ".html", "--err=" + base + ".err", "--profile=" + base + "-prof",
                    "--win=" + win, "--budget=20000"]}

def text_unit(ctx, kind, arg, cmd, post=None):
    n = ctx["n"] = ctx["n"] + 1
    base = os.path.join(ctx["tmp"], "%s-%d" % (kind, n))
    return {"kind": kind, "arg": arg, "out": base + ".txt", "err": base + ".err", "cmd": cmd, "text": True, "post": post}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--budget", type=int, default=60, help="minutes")
    ap.add_argument("--jobs", type=int, default=6)
    ap.add_argument("--quick", action="store_true", help="node, vision, light shards; no windows, heavy, tour, hunt")
    ap.add_argument("--ref", default="planet-main")
    ap.add_argument("--src", default=r"C:\Claude\drift-labrun")
    ap.add_argument("--steps", type=int, default=60, help="hunt steps per seed")
    ap.add_argument("--no-build", action="store_true")
    ap.add_argument("--hunt-only", action="store_true", help="only the hunt, seed after seed")
    ap.add_argument("--serve", type=int, default=0, help="only serve the page on 127.0.0.1:PORT")
    ap.add_argument("--log", default="", help="also append the log to this file")
    a = ap.parse_args()
    try: sys.stdout.reconfigure(encoding="utf-8")   # консоль cp437/cp1252: русские строки lab.py
    except Exception: pass
    if a.log:
        os.makedirs(os.path.dirname(os.path.abspath(a.log)), exist_ok=True)
    sys.stdout = Tee(sys.stdout, a.log or None)
    web = os.environ["LAB_WEB"]
    if a.serve:
        site = os.path.dirname(web)
        print("lab page: http://127.0.0.1:%d/lab/  (Ctrl+C stops)" % a.serve)
        return subprocess.call([sys.executable, "-m", "http.server", str(a.serve), "--bind", "127.0.0.1", "-d", site])

    T0 = time.time(); deadline = T0 + a.budget * 60
    src = os.path.abspath(a.src)
    os.makedirs(os.environ["LAB_DATA"], exist_ok=True)
    try:
        old = json.load(open(RUNF, encoding="utf-8"))
        if old.get("phase") not in ("done", "stopped", "failed") and old.get("pid") and old["pid"] != os.getpid() and pid_alive(old["pid"]):
            sys.exit("lab: уже идёт другая сессия (pid %s) — остановите её сначала" % old["pid"])
    except (OSError, ValueError): pass
    try: os.remove(STOPF)
    except OSError: pass
    mode = "hunt" if a.hunt_only else ("quick" if a.quick else "full")
    live_write(pid=os.getpid(), phase="build", ref=a.ref, jobs=a.jobs, budget=a.budget, mode=mode, steps=a.steps,
               log=os.path.abspath(a.log) if a.log else "", t0=T0, deadline=deadline, done=0, ahead=0, green=0, red=0,
               fresh=[], sid="", ver="", total=0)
    # ── своя копия: отсоединённая голова нужного ref, сборка в ней (артефакты сборки — её дело) ──
    if not a.no_build:
        if not os.path.exists(os.path.join(src, ".git")):
            r = sh(["git", "-C", REPO, "worktree", "add", "--detach", src, a.ref])
            if r.returncode: sys.exit("lab: worktree add failed: " + r.stderr.strip())
        else:
            r = sh(["git", "-C", src, "checkout", "-f", "--detach", a.ref])
            if r.returncode: sys.exit("lab: checkout failed: " + r.stderr.strip())
        head = sh(["git", "-C", src, "log", "-1", "--format=%h %s"]).stdout.strip()
        print("lab: %s at %s" % (a.ref, head))
        r = sh(["powershell", "-ExecutionPolicy", "Bypass", "-File", os.path.join(src, "build.ps1")], cwd=src, timeout=600)
        if r.returncode:
            live_write(phase="failed", why="сборка упала")
            sys.exit("lab: build failed\n" + (r.stdout + r.stderr)[-2000:])
    os.environ["LAB_BUILD"] = src
    sys.path.insert(0, HERE)
    import lab   # пути берёт из окружения выше
    shutil.copyfile(os.path.join(src, "site", "lab.html"), os.path.join(src, "lab.html"))
    tests = os.path.join(src, "tests.html")
    m = re.search(r'VER="([0-9.]+)"', open(tests, encoding="utf-8").read(400000))
    ver = m.group(1) if m else "?"
    sid = time.strftime("%Y%m%d-%H%M%S") + "-home"
    tmp = os.path.join(TMP, sid); os.makedirs(tmp, exist_ok=True)
    ctx = {"src": src, "node": node_exe(), "chrome": chrome_exe(src), "tmp": tmp, "n": 0,
           "page": "file:///" + tests.replace("\\", "/")}
    if not ctx["node"]: sys.exit("lab: no node (C:\\Claude\\tools\\node or PATH)")
    print("lab: session %s · version %s · budget %d min · jobs %d" % (sid, ver, a.budget, a.jobs))
    lab.session("start", sid, ver, a.budget)

    st = lab.jload(lab.STATE, {})
    skip = st.get("skip", {}).get(ver, {})
    solo = lab.solo_names(st, ver)
    shuf = str(int(time.time()) % 100000)   # одно зерно перемешки на сессию: все части мешают одинаково
    skq = ("&skip=" + urllib.parse.quote("|".join(solo))) if solo else ""
    units = [text_unit(ctx, "node", "", [ctx["node"], os.path.join(src, "test-node.js"), "--full", "--shuffle=" + shuf]),
             text_unit(ctx, "vision", "", [ctx["node"], os.path.join(src, "test-geom.js"), "--page=" + tests], vision_post)]
    units += [page_unit(ctx, "light", "%d/%d" % (i, LIGHT_N), "shard=%d/%d&shuffle=%s%s" % (i, LIGHT_N, shuf, skq), "1280,800") for i in range(LIGHT_N)]
    if not a.quick:
        for kind, win in (("mobile", "390,844"), ("tall", "1440,1440"), ("wide", "2000,1000")):
            units += [page_unit(ctx, kind, "%d/%d" % (i, WIN_N), "shard=%d/%d&shuffle=%s%s" % (i, WIN_N, shuf, skq), win) for i in range(WIN_N)]
        units += [page_unit(ctx, "heavy", n, "full=1&only=" + urllib.parse.quote(n), "1280,800") for n in lab.heavy_names()]
        units += [page_unit(ctx, "solo", n, "full=1&only=" + urllib.parse.quote(n), "1280,800") for n in solo]
        units.append(text_unit(ctx, "tour", "", [sys.executable, os.path.join(src, "docs", "tour.py"), "--n", "600",
                                                  "--port", "9690", "--out", os.path.join(tmp, "tour.png")], tour_post))
    units = [u for u in units if lab.unit_id(u["kind"], u["arg"]) not in skip]
    if a.hunt_only: units = []

    seeds = [0]
    def next_hunt():
        stf = lab.jload(lab.STATE, {}).get("fuzz", {}).get(ver, {})
        seed = int(time.strftime("%j")) * 1000 + stf.get("seeds", 0) + seeds[0] + 1
        seeds[0] += 1
        return page_unit(ctx, "hunt", str(seed), "only=%s&fseed=%d&hsteps=%d" % (urllib.parse.quote("охота"), seed, a.steps), "1280,800")

    counts = {}; fresh = []
    print("lab: прогонов в круге %d, потом охота до конца бюджета · Ctrl+C — остановить" % len(units))
    ex = ThreadPoolExecutor(max_workers=a.jobs)
    live = {ex.submit(run_unit, u, ctx) for u in units}
    live_write(phase="run", sid=sid, ver=ver, total=len(units), ahead=len(live))
    def fill():
        # охота добирает свободные места, пока бюджет позволяет зерно целиком
        while not STOP.is_set() and (not a.quick or a.hunt_only) and deadline - time.time() > TMO["hunt"] and len(live) < a.jobs:
            live.add(ex.submit(run_unit, next_hunt(), ctx))
    try:
        fill()
        while live:
            # ждём с секундным шагом: бесконечное ожидание на Windows глухо к Ctrl+C
            ready, _ = wait(live, timeout=1, return_when=FIRST_COMPLETED)
            if os.path.exists(STOPF):               # пульт попросил остановиться
                try: os.remove(STOPF)
                except OSError: pass
                raise KeyboardInterrupt
            if not ready: continue
            done = ready.pop(); live.discard(done)
            u, out, secs, mem, rc, err = done.result()
            if u["kind"] == "hunt": seeds[0] -= 1   # зерно учтено в state — счётчик в полёте убывает
            if rc == 130: continue                  # не начат: остановка
            new = lab.report(u["kind"], u["arg"], out, secs, mem, rc, ver, sid, err, 0) or []
            for e in new:
                fresh.append(e)
                print("  !! НОВАЯ ОШИБКА · %s · %s" % (e.get("suite", "")[:60], e.get("msg", "")[:160]))
            counts[u["kind"]] = counts.get(u["kind"], 0) + 1
            vk = "green" if getattr(lab, "LAST_VERDICT", "") == "green" else "red"
            live_write(done=sum(counts.values()), **{vk: LIVE.get(vk, 0) + 1},
                       fresh=[{"suite": e.get("suite", ""), "msg": e.get("msg", "")} for e in fresh][-50:])
            lab.publish()
            fill()
            left = max(0, int((deadline - time.time()) // 60))
            print("  · готово %d · впереди %d · осталось %d мин · новых ошибок за сессию %d" % (sum(counts.values()), len(live), left, len(fresh)))
            live_write(ahead=len(live))
    except KeyboardInterrupt:
        STOP.set()
        live_write(phase="stopping")
        print("lab: остановка — гашу свои прогоны (%d)" % len(RUNNING))
        for pid, prof in list(RUNNING.items()):
            kill_tree(pid)
            if prof: kill_profile(prof)
        for f in live: f.cancel()
    ex.shutdown(wait=True)

    lab.session("end", sid, ver, a.budget)
    lab.publish()
    shutil.rmtree(tmp, ignore_errors=True)
    live_write(phase="stopped" if STOP.is_set() else "done", t1=time.time(), ahead=0)
    print("lab: session %s done in %d min · units %s" % (sid, (time.time() - T0) // 60, " ".join("%s %d" % kv for kv in sorted(counts.items()))))
    print("lab: open errors — %s ; page — python lab/lab-local.py --serve 8790" % os.path.join(web, "errors.txt"))

if __name__ == "__main__":
    sys.exit(main())
