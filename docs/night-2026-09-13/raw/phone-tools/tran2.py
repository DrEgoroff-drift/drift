import json, sys, collections
d = json.load(open(sys.argv[1], encoding="utf-8"))
ev = d["traceEvents"] if isinstance(d, dict) else d
names = {(e["pid"], e["tid"]): e["args"]["name"] for e in ev if e.get("ph") == "M" and e.get("name") == "thread_name"}
faf = collections.Counter((e["pid"], e["tid"]) for e in ev if e.get("name") == "FireAnimationFrame")
main = faf.most_common(1)[0][0]; rpid = main[0]
touch = sorted((e["ts"], e["args"]["data"]["type"]) for e in ev if e.get("name") == "EventDispatch" and (e["pid"], e["tid"]) == main
               and e.get("args", {}).get("data", {}).get("type") in ("pointerdown", "pointerup", "pointercancel"))
downs = []; cur = None
for ts, t in touch:
    if t == "pointerdown" and cur is None: cur = ts
    elif t != "pointerdown" and cur is not None: downs.append((cur, ts)); cur = None
def fingered(ts): return any(a <= ts <= b for a, b in downs)
# 1. vsync / presentation
pr = [e for e in ev if e.get("name") == "PipelineReporter" and e.get("ph") in ("b", "X")]
states = collections.Counter()
for e in pr:
    a = e.get("args", {}).get("chrome_frame_reporter", {})
    if a: states[(a.get("state"), a.get("reason", ""))] += 1
print("PipelineReporter states:", states.most_common(6))
bf = sorted(e["ts"] for e in ev if e.get("name") in ("Scheduler::BeginFrame", "BeginFrame", "DisplayScheduler::BeginFrame") )
if len(bf) > 10:
    iv = sorted((bf[i] - bf[i-1]) / 1000 for i in range(1, len(bf)))
    print("BeginFrame count", len(bf), "interval median %.2f ms" % iv[len(iv)//2])
# 2. JS self time by function using timeDeltas (accurate ms)
nodes = {}; chunks = []
for e in ev:
    if e.get("name") == "ProfileChunk" and e["pid"] == rpid:
        c = e["args"]["data"].get("cpuProfile", {})
        for n in c.get("nodes", []):
            cf = n.get("callFrame", {})
            nodes[n["id"]] = (cf.get("functionName") or "(anon)") + ":" + str(cf.get("lineNumber", ""))
        chunks.append((c.get("samples", []), e["args"]["data"].get("timeDeltas", [])))
ps = [e for e in ev if e.get("name") == "Profile" and e["pid"] == rpid]
t = ps[0]["args"]["data"]["startTime"]
seq = []
for ids, dts in chunks:
    for i, nid in enumerate(ids):
        t += dts[i]; seq.append((t, nid))
selfms = collections.defaultdict(lambda: [0.0, 0.0])
for i in range(len(seq) - 1):
    t0, nid = seq[i]; dt = seq[i+1][0] - t0
    if dt > 5000: continue
    selfms[nodes.get(nid, "?")][0 if fingered(t0) else 1] += dt
span = seq[-1][0] - seq[0][0]
fin = sum(b - a for a, b in downs); nof = span - fin
print("\nJS self time, ms per second of wall        finger | no finger   (finger %.1fs of %.1fs)" % (fin/1e6, span/1e6))
for nm, (a, b) in sorted(selfms.items(), key=lambda x: -(x[1][0]/fin + x[1][1]/nof))[:26]:
    print("  %-34s %6.1f | %6.1f" % (nm[:34], a / fin * 1000, b / nof * 1000))
# 3. pointermove handler cost
pm = [e["dur"] / 1000 for e in ev if e.get("name") == "EventDispatch" and (e["pid"], e["tid"]) == main and e.get("args", {}).get("data", {}).get("type") == "pointermove" and "dur" in e]
pm.sort(); print("\npointermove: n=%d med %.2f ms p90 %.2f max %.1f" % (len(pm), pm[len(pm)//2], pm[int(len(pm)*.9)], pm[-1]))
# 4. forced layouts: UpdateLayoutTree/Layout inside FunctionCall with stack? count per frame
lay = [e for e in ev if e.get("name") in ("Layout", "UpdateLayoutTree") and (e["pid"], e["tid"]) == main and "dur" in e]
print("Layout+UpdateLayoutTree events", len(lay), "total ms %.0f" % (sum(e["dur"] for e in lay) / 1000))
# 5. GPU main thread top task names
gpu = [k for k, v in names.items() if v == "CrGpuMain"]
if gpu:
    g = collections.Counter()
    for e in ev:
        if (e["pid"], e["tid"]) == gpu[0] and e.get("ph") == "X" and "dur" in e and e["name"] not in ("RunTask", "ThreadControllerImpl::RunTask"):
            g[e["name"]] += e["dur"]
    print("\nCrGpuMain top (ms total over trace):", [(k, round(v/1000)) for k, v in g.most_common(8)])
