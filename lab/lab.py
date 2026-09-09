#!/usr/bin/env python3
"""Drift lab — server-side helpers (docs/LAB.md).

  lab.py plan <ver> <session>            → unit lines "kind<TAB>arg" in run order
  lab.py heavy                           → the SLOW_SUITES names read from build/tests.html
  lab.py skip <ver>                      → suites that hung in a shard this version, "a|b|c" (for ?skip=)
  lab.py report <kind> <arg> <file> <secs> <mem_mb> <rc> <ver> <session> [errfile] [oom_delta]
                                         → parses a report (Chrome DOM or node stdout),
                                           appends runs.jsonl, dedups errors, prints a verdict line
  lab.py fuzz-next <ver>                 → next fuzz seed, or "stop" when the hunt is exhausted
  lab.py session <start|end> <session> <ver> <budget_min>
  lab.py publish                         → data.json + index.html + errors.txt into the web dir

Всё на стандартной библиотеке: на хосте Python 3.6 без pip.
"""
import sys, os, json, re, time, hashlib, html

HOME  = os.path.expanduser("~")
DATA  = os.path.join(HOME, "drift-data", "lab")
WEB   = os.path.join(HOME, "drift-game.ru", "docs", "lab")
BUILD = os.path.join(HOME, "drift-lab", "build")

def now(): return time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime())
def jload(p, d):
    try:
        with open(p, encoding="utf-8") as f: return json.load(f)
    except Exception: return d
def jsave(p, v):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    tmp = p + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f: json.dump(v, f, ensure_ascii=False, separators=(",", ":"))
    os.replace(tmp, p)
def append(p, row):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "a", encoding="utf-8") as f: f.write(json.dumps(row, ensure_ascii=False) + "\n")
def lines(p):
    try:
        with open(p, encoding="utf-8") as f: return [json.loads(l) for l in f if l.strip()]
    except Exception: return []

RUNS, ERRS, STATE, SESS = (os.path.join(DATA, n) for n in ("runs.jsonl", "errors.json", "state.json", "sessions.jsonl"))
LIGHT_N = 6

# ── план сессии ──
def heavy_names():
    p = os.path.join(BUILD, "tests.html")
    try: src = open(p, encoding="utf-8").read()
    except Exception: return []
    m = re.search(r"const SLOW_SUITES=new Set\(\[(.*?)\]\);", src, re.S)
    if not m: return []
    return re.findall(r'"((?:[^"\\]|\\.)*)"', m.group(1))

def unit_id(kind, arg): return kind + (":" + arg if arg else "")

def solo_names(st, ver): return list(st.get("solo", {}).get(ver, {}).keys())

def plan(ver, session):
    st = jload(STATE, {})
    skip = st.get("skip", {}).get(ver, {})
    out = [("node", ""), *[("light", "%d/%d" % (i, LIGHT_N)) for i in range(LIGHT_N)], ("mobile", ""), ("tall", "")]
    out += [("heavy", n) for n in heavy_names()]
    out += [("solo", n) for n in solo_names(st, ver)]
    for k, a in out:
        if unit_id(k, a) in skip: continue
        print(k + "\t" + a)

def skip_list(ver):
    print("|".join(solo_names(jload(STATE, {}), ver)))

# ── разбор отчёта ──
def parse(kind, text):
    """→ (head, failures[(suite,msg,detail)], passed, suites) ; head None = no report"""
    if kind == "node":
        body = text
    else:
        m = re.search(r'<pre id="testout"[^>]*>([\s\S]*?)</pre>', text)
        if not m: return None, [], 0, 0
        body = html.unescape(m.group(1))
    ls = body.split("\n")
    head = ""
    for l in ls:
        if "пройдено" in l or "ЗЕЛЁН" in l or "ПРОВАЛ" in l: head = l.strip(); break
    if not head: return None, [], 0, 0
    passed = int((re.search(r"пройдено (\d+)", head) or [0, 0])[1] or 0)
    suites = int((re.search(r"наборов (\d+)", head) or [0, 0])[1] or 0)
    fails = []
    cur = ""
    for i, l in enumerate(ls):
        s = l.strip()
        if s.startswith("ПО ГРУППАМ") or s.startswith("САМЫЕ ДОЛГИЕ"): break   # сводки, не провалы
        if s.startswith("── "): cur = s[3:].strip(); continue
        if not s.startswith("✗"): continue
        msg = s[1:].strip()
        if cur and msg.startswith(cur + " · "): msg = msg[len(cur) + 3:]
        suite = cur
        if not suite and " · " in msg: suite, msg = msg.split(" · ", 1)
        det = []
        for j in range(i + 1, min(i + 14, len(ls))):
            t = ls[j].rstrip()
            if not t.strip() or t.strip().startswith(("✓", "✗", "──")) or "ПО ГРУППАМ" in t: break
            det.append(t.strip())
        fails.append((suite, msg[:400], "\n".join(det)[:1500]))
    # блок провалов внизу дублирует строки из наборов — оставляем по одному на (suite,msg)
    seen, uniq = set(), []
    for f in fails:
        k = (f[0], f[1][:120])
        if k in seen: continue
        seen.add(k); uniq.append(f)
    return head, uniq, passed, suites

def norm(msg):
    m = re.sub(r"0x[0-9a-fA-F]+", "#", msg)
    m = re.sub(r"\d+(?:[.,]\d+)?", "#", m)
    m = re.sub(r"\s+", " ", m).strip()
    return m[:200]

def last_suite(errfile):
    """имя набора, шедшего в момент смерти прогона — из трассы «→ имя» в stderr Chrome"""
    try: t = open(errfile, encoding="utf-8", errors="replace").read()
    except Exception: return ""
    m = re.findall(r'"→ ([^"]*)"', t)
    return m[-1] if m else ""

def report(kind, arg, path, secs, mem, rc, ver, session, errfile="", oom=0):
    try: text = open(path, encoding="utf-8", errors="replace").read()
    except Exception: text = ""
    head, fails, passed, suites = parse(kind, text)
    if oom > 0 and head is None: verdict = "oom"
    elif rc == 124: verdict = "timeout"
    elif head is None: verdict = "noreport"
    elif fails or re.match(r"^\S+ \d+ ", head or ""): verdict = "red"
    else: verdict = "green"
    uid = unit_id(kind, arg)
    st = jload(STATE, {})
    errs = jload(ERRS, {})
    new, known = [], []
    t = now()
    rows = list(fails)
    hung = ""
    if verdict in ("noreport", "timeout", "oom"):
        hung = last_suite(errfile) if errfile else ""
        why = {"timeout": "повис", "noreport": "не дал отчёта", "oom": "убит по памяти"}[verdict]
        if hung:
            rows.append((hung, "%s в прогоне %s за %d с (%d МБ)" % (why, uid, secs, mem), "последний набор по трассе; дальше идёт отдельно (solo)"))
        else:
            rows.append((uid, "%s за %d с (%d МБ), трассы нет" % (why, secs, mem), (text[-600:] if kind == "node" else "")))
    for suite, msg, det in rows:
        key = hashlib.sha1((suite + "|" + norm(msg)).encode("utf-8")).hexdigest()[:12]
        e = errs.get(key)
        if not e:
            e = errs[key] = {"suite": suite, "msg": msg, "detail": det, "unit": uid, "first": t, "last": t,
                             "count": 0, "versions": {}, "seeds": [], "status": "open"}
            new.append(key)
        else:
            known.append(key)
            if e.get("status") == "fixed" and ver not in e["versions"]:
                e["status"] = "open"; e["reopened"] = t   # вернулась в новой версии
        e["count"] += 1; e["last"] = t
        e["versions"][ver] = e["versions"].get(ver, 0) + 1
        if kind == "fuzz" and len(e["seeds"]) < 8 and arg not in e["seeds"]: e["seeds"].append(arg)
    # не долбиться: тяжёлый или соло-набор, упавший или не давший отчёта, в этой версии больше не гоняется
    if kind in ("heavy", "solo", "mobile", "tall") and verdict != "green":
        st.setdefault("skip", {}).setdefault(ver, {})[uid] = verdict
    # повисший в шарде набор уходит в «соло»: шарды идут без него, он — один и с большим запасом
    if hung and kind in ("light", "mobile", "tall"):
        st.setdefault("solo", {}).setdefault(ver, {})[hung] = uid
    if kind == "fuzz":
        f = st.setdefault("fuzz", {}).setdefault(ver, {"seeds": 0, "streak": 0, "exhausted": False, "new": 0, "red": 0})
        f["seeds"] += 1
        if verdict != "green": f["red"] += 1
        if new: f["streak"] = 0; f["new"] += len(new)
        elif known: f["streak"] += 1
        if f["streak"] >= 5: f["exhausted"] = True
    jsave(STATE, st); jsave(ERRS, errs)
    append(RUNS, {"t": t, "s": session, "ver": ver, "kind": kind, "arg": arg, "unit": uid, "v": verdict,
                  "secs": secs, "rss": mem, "pass": passed, "suites": suites, "fails": len(fails),
                  "new": new, "known": known, "head": (head or "")[:160], "hung": hung})
    print("%s · %s · %d с · %d МБ · провалов %d · новых %d · известных %d%s" % (uid, verdict, secs, mem, len(fails), len(new), len(known), (" · повис: " + hung) if hung else ""))

def fuzz_next(ver):
    st = jload(STATE, {})
    f = st.get("fuzz", {}).get(ver, {})
    if f.get("exhausted"): print("stop"); return
    base = int(time.strftime("%j")) * 100  # день года: разные ночи начинают с разных зёрен
    print(str(base + f.get("seeds", 0) + 1))

def session(op, sid, ver, budget):
    append(SESS, {"op": op, "s": sid, "t": now(), "ver": ver, "budget": int(budget)})

# ── публикация ──
def publish():
    runs = lines(RUNS)
    if len(runs) > 4000:
        runs = runs[-4000:]
        with open(RUNS, "w", encoding="utf-8") as f:
            for r in runs: f.write(json.dumps(r, ensure_ascii=False) + "\n")
    errs = jload(ERRS, {})
    st = jload(STATE, {})
    sess = {}
    for s in lines(SESS):
        d = sess.setdefault(s["s"], {"id": s["s"], "ver": s["ver"], "budget": s["budget"]})
        d["t0" if s["op"] == "start" else "t1"] = s["t"]
    for r in runs:
        d = sess.get(r["s"])
        if not d: continue
        d["units"] = d.get("units", 0) + 1
        d[r["v"]] = d.get(r["v"], 0) + 1
        d["new"] = d.get("new", 0) + len(r.get("new", []))
        d["secs"] = d.get("secs", 0) + r["secs"]
        d["rss"] = max(d.get("rss", 0), r.get("rss", 0))
    order = sorted(sess.values(), key=lambda d: d.get("t0", ""))[-60:]
    ids = [d["id"] for d in order]
    hist = {}
    for r in runs:
        if r["s"] not in ids: continue
        hist.setdefault(r["unit"], []).append([ids.index(r["s"]), r["secs"], r.get("rss", 0), r["v"]])
    open_errs = [dict(e, key=k) for k, e in errs.items() if e.get("status") != "fixed"]
    open_errs.sort(key=lambda e: e["last"], reverse=True)
    data = {"generated": now(), "sessions": order, "runs": runs[-400:], "errors": open_errs[:300],
            "hist": hist, "fuzz": st.get("fuzz", {}), "skip": st.get("skip", {}), "solo": st.get("solo", {}),
            "totals": {"runs": len(runs), "errors_open": len(open_errs), "errors_all": len(errs)}}
    os.makedirs(WEB, exist_ok=True)
    jsave(os.path.join(WEB, "data.json"), data)
    page = os.path.join(BUILD, "lab.html")
    if os.path.exists(page):
        with open(page, "rb") as f: b = f.read()
        with open(os.path.join(WEB, "index.html"), "wb") as f: f.write(b)
    with open(os.path.join(WEB, "errors.txt"), "w", encoding="utf-8") as f:
        f.write("# Drift lab — open errors, newest last seen first · %s\n\n" % now())
        for e in open_errs:
            f.write("[%s] ×%d · %s … %s · %s · %s\n  %s · %s\n" % (e["key"], e["count"], e["first"], e["last"],
                    ",".join(sorted(e["versions"])), e["unit"], e["suite"], e["msg"]))
            if e.get("seeds"): f.write("  seeds: %s\n" % " ".join(e["seeds"]))
            if e.get("detail"): f.write("  " + e["detail"].replace("\n", "\n  ") + "\n")
            f.write("\n")
    print("published: sessions %d · runs %d · open errors %d" % (len(order), len(runs), len(open_errs)))

if __name__ == "__main__":
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    cmd = a[0]
    if cmd == "plan": plan(a[1], a[2])
    elif cmd == "heavy": print("\n".join(heavy_names()))
    elif cmd == "skip": skip_list(a[1])
    elif cmd == "report": report(a[1], a[2], a[3], int(float(a[4])), int(float(a[5])), int(a[6]), a[7], a[8],
                                 a[9] if len(a) > 9 else "", int(a[10]) if len(a) > 10 else 0)
    elif cmd == "fuzz-next": fuzz_next(a[1])
    elif cmd == "session": session(a[1], a[2], a[3], a[4])
    elif cmd == "publish": publish()
    else: sys.exit("unknown command " + cmd)
