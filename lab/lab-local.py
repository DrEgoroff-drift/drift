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
       "heavy": 600, "solo": 900, "tour": 900, "frames": 900, "hunt": 300}

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

HUNT_LOG = os.path.join(os.environ.get("LAB_DATA") or os.path.join(os.path.expanduser("~"), "drift-data", "lab"), "hunt-notes.jsonl")

def hunt_post(u, rc):
    """заметки охоты «кошелёк:» и «покрытие:» — по строке на зерно в hunt-notes.jsonl; пульт
    складывает их по зёрнам: какие краны денег живут и куда тропа не дошла ни разу"""
    import html as H
    try: t = H.unescape(open(u["out"], encoding="utf-8", errors="replace").read())
    except Exception: return
    row = {"t": time.strftime("%Y-%m-%d %H:%M:%S"), "seed": u["arg"], "rc": rc}
    for k, key in (("кошелёк", "wallet"), ("покрытие", "cover"), ("отказы", "why")):
        m = re.search(r"· %s: ([^<\n]*)" % k, t)
        if m: row[key] = m.group(1).strip()
    m = re.search(r"· корпус: (\{[^\n<]*\})", t)
    if m and u.get("ver"):
        try:
            json.loads(m.group(1))
            os.makedirs(CORPUS, exist_ok=True)
            open(os.path.join(CORPUS, "%s-%s.json" % (u["ver"], u["arg"])), "w", encoding="utf-8").write(m.group(1))
        except Exception: pass
    if len(row) < 4: return
    try:
        with open(HUNT_LOG, "a", encoding="utf-8") as f: f.write(json.dumps(row, ensure_ascii=False) + "\n")
    except Exception: pass

LEAK_SUITE = "91zzzzzzzzd-leak.js"

def leak_suite(src):
    """переменные верхнего уровня src/ (let/var и изменяемые объекты-константы) → набор «состояние вне мира»:
    сцена начисто и та же сцена после двух чужих обязаны дать один мир; разошлись — названы переменные,
    которые пережили resetWorld (так 15.10 нашлись GAUGE_W, HALL_PRE и открытый зал)"""
    names = []
    rx = re.compile(r"^(?:let|var)\s+([A-Za-z_$][\w$]*)|^const\s+([A-Z][A-Z0-9_]*)\s*=\s*(?:\{|\[|new (?:Map|Set)\b)")
    for f in sorted(os.listdir(os.path.join(src, "src")), key=lambda s: s.encode()):
        if not f.endswith(".js"): continue
        for ln in open(os.path.join(src, "src", f), encoding="utf-8", errors="replace"):
            m = rx.match(ln)
            if m: names.append(m.group(1) or m.group(2))
    names = sorted(set(names) - {"G"})
    if not names: return 0
    js = r'''/* состояние вне мира (лаборатория 15.10, генерирует lab-local.py — в гит не идёт). Мир живёт в G; всё,
   что лежит в переменных модулей и переживает resetWorld, может менять мир по тому, что было ДО (окно шкал
   GAUGE_W, заготовка зала HALL_PRE, открытый зал HALL.open). Закон: сцена начисто и та же сцена после двух
   чужих — один хэш мира. Разошлись — набор называет переменные, сдвинувшиеся после сброса. */
const LAB_MODVARS=[%s];
function labVarH(f){
  let s;try{s=JSON.stringify(f(),(k,v)=>typeof v==="function"?undefined:(v&&ArrayBuffer.isView(v))?"ta"+v.length:(typeof Node!=="undefined"&&v instanceof Node)?"node":v);}catch(e){return "?";}
  if(s===undefined)return "u";if(s.length>300000)s=s.slice(0,300000);
  let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(36)+":"+s.length;
}
function labVars(){const o={};for(const [n,f] of LAB_MODVARS){try{o[n]=labVarH(f);}catch(e){o[n]="!";}}return o;}
TEST_SUITES.push(()=>suite("состояние вне мира: сцена после чужих сцен — тот же мир",{tier:"browser"},()=>{
  const S=lookScenes(),N=100,bad=[],moves={};
  const run=sc=>{resetWorld();let ok0=true;try{ok0=sc.set()!==false;}catch(e){return null;}if(!ok0)return null;
    const loop0=LOOP_OFF,dw=drawWorld,hu=hud;LOOP_OFF=false;drawWorld=function(){};hud=function(){};
    try{for(let i=0;i<N;i++)frameBody(wallMs());}catch(e){return null;}finally{LOOP_OFF=loop0;drawWorld=dw;hud=hu;}
    return stateHash();};
  let ran=0;
  for(let i=0;i<S.length;i++){
    const sc=S[i],X1=S[(i+1)%%S.length],X2=S[(i+2)%%S.length];
    const ref=run(sc);if(ref==null)continue;
    resetWorld();const v0=labVars();
    run(X1);run(X2);
    resetWorld();const v1=labVars();
    const moved=Object.keys(v0).filter(k=>v0[k]!==v1[k]);for(const k of moved)moves[k]=(moves[k]|0)+1;
    const h=run(sc);ran++;
    if(h!==ref)bad.push(sc.id+" после «"+X1.id+"», «"+X2.id+"»: другой мир; пережили сброс "+(moved.slice(0,10).join(", ")||"— (не переменные модулей)"));
  }
  note("переменных модулей "+LAB_MODVARS.length+"; переживают сброс (кэши — норма, мир они менять не вправе): "+Object.keys(moves).sort((a,b)=>moves[b]-moves[a]).slice(0,30).join(", "));
  ok(ran>=3,"сцен прогнано "+ran+" из "+S.length);
  ok(!bad.length,"мир зависит от прошлых сцен: "+bad.length+(bad.length?" — "+bad.slice(0,4).join("; "):""));
  resetWorld();
}));
''' % ",".join('["%s",()=>%s]' % (n, n) for n in names)
    open(os.path.join(src, "tests", LEAK_SUITE), "w", encoding="utf-8", newline="\n").write(js)
    return len(names)

CORPUS = os.path.join(os.path.dirname(HUNT_LOG), "corpus")
CORPUS_SUITE = "91zzzzzzzzc-corpus.js"

def corpus_suite(src):
    """сейвы прошлых охот → набор в копии: каждая версия грузит миры всех прежних. По три последних
    сейва на версию, не больше сорока; пустой корпус — набора нет (ok без проверки — пустышка)"""
    try: files = [f for f in os.listdir(CORPUS) if f.endswith(".json")]
    except Exception: return 0
    by = {}
    for f in sorted(files, key=lambda f: os.path.getmtime(os.path.join(CORPUS, f)), reverse=True):
        v = f.rsplit("-", 1)[0]
        if len(by.setdefault(v, [])) < 3: by[v].append(f)
    pick = [f for v in sorted(by) for f in by[v]][-40:]
    if not pick: return 0
    rows = ",\n".join("  [%s,%s]" % (json.dumps(f[:-5]), json.dumps(open(os.path.join(CORPUS, f), encoding="utf-8").read(), ensure_ascii=False)) for f in pick)
    js = r'''/* корпус сейвов (лаборатория 15.10, генерирует lab-local.py из LAB_DATA/corpus — в гит не идёт).
   Миры, которые охота прошлых версий оставила по зерну: эта сборка обязана их грузить (жёсткое правило
   CLAUDE.md — старые сейвы живут), не терять деньги, а пересохранённый мир читать тем же миром. */
const LAB_CORPUS=[
%s
];
TEST_SUITES.push(()=>suite("корпус сейвов: мир каждой прошлой версии грузится этой",{tier:"node"},()=>{
  const bad=[];
  for(const [id,raw] of LAB_CORPUS){
    resetWorld();
    let s=null;try{s=JSON.parse(raw);}catch(e){bad.push(id+": не JSON");continue;}
    stSet(SAVE_KEY,raw);
    let r;try{r=loadGame();}catch(e){bad.push(id+": loadGame бросил "+e.message);continue;}
    if(!r){bad.push(id+": отказ");continue;}
    if(isFinite(s.credits)&&Math.abs(G.credits-s.credits)>.5)bad.push(id+": деньги "+s.credits+"→"+G.credits);
    let t;try{t=saveText();}catch(e){bad.push(id+": пересохранение бросило "+e.message);continue;}
    const h1=stateHash();resetWorld();stSet(SAVE_KEY,t);
    try{loadGame();}catch(e){bad.push(id+": пересохранённый бросил "+e.message);continue;}
    if(stateHash()!==h1)bad.push(id+": пересохранённый мир читается другим");
  }
  note("сейвов в корпусе "+LAB_CORPUS.length+": "+LAB_CORPUS.map(x=>x[0]).join(", "));
  ok(!bad.length,"корпус: "+bad.length+(bad.length?" — "+bad.slice(0,6).join("; "):""));
  try{stDel(SAVE_KEY);}catch(e){}
  resetWorld();
}));
''' % rows
    open(os.path.join(src, "tests", CORPUS_SUITE), "w", encoding="utf-8", newline="\n").write(js)
    return len(pick)

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

# группы прогонов, из которых пульт собирает сессию; вид прогона → группа
GROUPS = ["core", "vision", "light", "windows", "heavy", "tour", "frames", "hunt"]
KIND_GROUP = {"node": "core", "vision": "vision", "light": "light", "mobile": "windows", "tall": "windows", "wide": "windows",
              "heavy": "heavy", "solo": "heavy", "tour": "tour", "frames": "frames", "hunt": "hunt"}


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
    ap.add_argument("--groups", default="", help="comma list of " + ",".join(GROUPS) + "; overrides --quick/--hunt-only")
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
    grp = set(g for g in a.groups.split(",") if g in GROUPS) if a.groups else \
        ({"hunt"} if a.hunt_only else {"core", "vision", "light"} if a.quick else set(GROUPS))
    mode = ",".join(g for g in GROUPS if g in grp)
    live_write(pid=os.getpid(), phase="build", ref=a.ref, jobs=a.jobs, budget=a.budget, mode=mode, steps=a.steps,
               log=os.path.abspath(a.log) if a.log else "", t0=T0, deadline=deadline, done=0, ahead=0, green=0, red=0,
               fresh=[], sid="", ver="", total=0)
    # ── своя копия: отсоединённая голова нужного ref, сборка в ней (артефакты сборки — её дело) ──
    if not a.no_build:
        if not os.path.exists(os.path.join(src, ".git")):
            r = sh(["git", "-C", REPO, "worktree", "add", "--detach", src, a.ref])
            if r.returncode: sys.exit("lab: worktree add failed: " + r.stderr.strip())
        else:
            sh(["git", "-C", src, "clean", "-fq", "--", "tests"])   # подложенные прошлым прогоном законы — прочь до смены головы
            r = sh(["git", "-C", src, "checkout", "-f", "--detach", a.ref])
            if r.returncode: sys.exit("lab: checkout failed: " + r.stderr.strip())
        head = sh(["git", "-C", src, "log", "-1", "--format=%h %s"]).stdout.strip()
        print("lab: %s at %s" % (a.ref, head))
        # законы лаборатории живут в lab-local раньше, чем их вольют в игру: новый файл набора, которого в ветке
        # нет, подкладываем в её копию (только новые — свои наборы ветки не трогаем никогда)
        mine = os.path.join(os.path.dirname(HERE), "tests")
        # охота — инструмент самой лаборатории, а не закон игры: её копия в ветке (пришла слиянием lab-local)
        # отстаёт, поэтому кладётся всегда свежая
        LAB_OWNED = {"91zzzzzzzzb-hunt.js", "91zzzzzzzze-idle.js"}
        add = [f for f in sorted(os.listdir(mine)) if f.endswith(".js") and (f in LAB_OWNED or not os.path.exists(os.path.join(src, "tests", f)))]
        for f in add: shutil.copyfile(os.path.join(mine, f), os.path.join(src, "tests", f))
        if add: print("lab: законы лаборатории подложены в копию: " + ", ".join(add))
        nc = corpus_suite(src)
        if nc: print("lab: корпус сейвов — %d миров прошлых охот в %s" % (nc, CORPUS_SUITE))
        nl = leak_suite(src)
        if nl: print("lab: состояние вне мира — %d переменных модулей под надзором (%s)" % (nl, LEAK_SUITE))
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
    for kind, win in (("mobile", "390,844"), ("tall", "1440,1440"), ("wide", "2000,1000")):
        units += [page_unit(ctx, kind, "%d/%d" % (i, WIN_N), "shard=%d/%d&shuffle=%s%s" % (i, WIN_N, shuf, skq), win) for i in range(WIN_N)]
    units += [page_unit(ctx, "heavy", n, "full=1&only=" + urllib.parse.quote(n), "1280,800") for n in lab.heavy_names()]
    units += [page_unit(ctx, "solo", n, "full=1&only=" + urllib.parse.quote(n), "1280,800") for n in solo]
    units.append(text_unit(ctx, "tour", "", [sys.executable, os.path.join(src, "docs", "tour.py"), "--n", "600",
                                              "--port", "9690", "--out", os.path.join(tmp, "tour.png")], tour_post))
    units.append(text_unit(ctx, "frames", "", [sys.executable, os.path.join(HERE, "jank.py"), "--port", "9692", "--root", src]))   # длинные кадры на настоящей видеокарте
    units = [u for u in units if lab.unit_id(u["kind"], u["arg"]) not in skip and KIND_GROUP[u["kind"]] in grp]

    seeds = [0]
    def next_hunt():
        stf = lab.jload(lab.STATE, {}).get("fuzz", {}).get(ver, {})
        seed = int(time.strftime("%j")) * 1000 + stf.get("seeds", 0) + seeds[0] + 1
        seeds[0] += 1
        u = page_unit(ctx, "hunt", str(seed), "only=%s&fseed=%d&hsteps=%d" % (urllib.parse.quote("охота"), seed, a.steps), "1280,800")
        u["post"] = hunt_post; u["ver"] = ver
        return u

    counts = {}; fresh = []
    print("lab: прогонов в круге %d, потом охота до конца бюджета · Ctrl+C — остановить" % len(units))
    ex = ThreadPoolExecutor(max_workers=a.jobs)
    live = {ex.submit(run_unit, u, ctx) for u in units}
    live_write(phase="run", sid=sid, ver=ver, total=len(units), ahead=len(live))
    def fill():
        # охота добирает свободные места, пока бюджет позволяет зерно целиком
        while not STOP.is_set() and "hunt" in grp and deadline - time.time() > TMO["hunt"] and len(live) < a.jobs:
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
