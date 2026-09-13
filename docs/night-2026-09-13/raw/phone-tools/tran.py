import json, sys, collections
p = sys.argv[1]
d = json.load(open(p, encoding="utf-8"))
ev = d["traceEvents"] if isinstance(d, dict) else d
names = {}
for e in ev:
    if e.get("ph") == "M" and e.get("name") == "thread_name":
        names[(e["pid"], e["tid"])] = e["args"]["name"]
    if e.get("ph") == "M" and e.get("name") == "process_name":
        names[(e["pid"], None)] = e["args"]["name"]
# game renderer main = thread with most FireAnimationFrame
faf = collections.Counter((e["pid"], e["tid"]) for e in ev if e.get("name") == "FireAnimationFrame")
main = faf.most_common(1)[0][0]
rpid = main[0]
print("renderer main", main, names.get(main), "rAF count", faf[main])
# finger periods from input events on main thread
touch = []
for e in ev:
    if e.get("name") == "EventDispatch" and (e["pid"], e["tid"]) == main:
        t = e.get("args", {}).get("data", {}).get("type")
        if t in ("pointerdown", "pointerup", "pointercancel", "touchstart", "touchend", "touchcancel"):
            touch.append((e["ts"], t))
touch.sort()
downs = []; cur = None
for ts, t in touch:
    if t in ("pointerdown", "touchstart") and cur is None: cur = ts
    if t in ("pointerup", "pointercancel", "touchend", "touchcancel") and cur is not None: downs.append((cur, ts)); cur = None
if cur is not None: downs.append((cur, 1e18))
def fingered(ts): return any(a <= ts <= b for a, b in downs)
print("finger-down periods", len(downs), "total s", round(sum(min(b, ev[-1]["ts"]) - a for a, b in downs if b < 1e17) / 1e6, 1))
# frames = FireAnimationFrame start times on main
fa = sorted([e for e in ev if e.get("name") == "FireAnimationFrame" and (e["pid"], e["tid"]) == main and "dur" in e], key=lambda e: e["ts"])
fr = []
for e in fa:
    if fr and e["ts"] - fr[-1]["ts"] < 4000: fr[-1] = {"ts": fr[-1]["ts"], "dur": fr[-1]["dur"] + e["dur"]}
    else: fr.append({"ts": e["ts"], "dur": e["dur"]})
print("rAF callbacks", len(fa), "-> frames", len(fr))
fa = fr
ints = [(fa[i]["ts"] - fa[i-1]["ts"]) / 1000 for i in range(1, len(fa))]
long_on = [x for i, x in enumerate(ints) if fingered(fa[i+1]["ts"])]
long_off = [x for i, x in enumerate(ints) if not fingered(fa[i+1]["ts"])]
def st(a):
    if not a: return "n=0"
    s = sorted(a); return "n=%d med %.1f p90 %.1f >24ms %d%%" % (len(s), s[len(s)//2], s[int(len(s)*.9)], 100*sum(x > 24 for x in s)//len(s))
print("rAF interval ms  finger:", st(long_on), "| no finger:", st(long_off))
rafdur_on = [e["dur"]/1000 for e in fa if fingered(e["ts"])]
rafdur_off = [e["dur"]/1000 for e in fa if not fingered(e["ts"])]
print("rAF callback (JS frame) ms  finger:", st(rafdur_on), "| no finger:", st(rafdur_off))
# per-thread busy time split by name, finger vs not, normalised per second
T0, T1 = fa[0]["ts"], fa[-1]["ts"]
fin_us = sum(max(0, min(b, T1) - max(a, T0)) for a, b in downs)
nof_us = (T1 - T0) - fin_us
busy = collections.defaultdict(lambda: [0, 0])
top = {"RunTask", "ThreadControllerImpl::RunTask", "ThreadPool_RunTask"}
for e in ev:
    if e.get("ph") != "X" or "dur" not in e or not (T0 <= e["ts"] <= T1): continue
    k = (e["pid"], e["tid"])
    nm = names.get(k, str(k))
    if e["name"] in top:
        busy[nm][0 if fingered(e["ts"]) else 1] += e["dur"]
print("\nthread busy (ms per second of wall)   finger | no finger")
for nm, (a, b) in sorted(busy.items(), key=lambda x: -(x[1][0] + x[1][1]))[:10]:
    print("  %-28s %6.0f | %6.0f" % (nm[:28], a / max(1, fin_us) * 1000, b / max(1, nof_us) * 1000))
# main-thread breakdown by event name (children of RunTask), finger vs not
inner = collections.defaultdict(lambda: [0, 0])
for e in ev:
    if e.get("ph") != "X" or "dur" not in e or (e["pid"], e["tid"]) != main or not (T0 <= e["ts"] <= T1): continue
    if e["name"] in ("FireAnimationFrame", "EventDispatch", "Paint", "PrePaint", "Layout", "UpdateLayoutTree", "Layerize", "Commit", "RecalculateStyles", "HitTest", "TimerFire", "FunctionCall", "GCEvent", "MinorGC", "MajorGC", "V8.GC_SCAVENGER", "BlinkGC.AtomicPhase", "ParseHTML", "UpdateLayerTree", "CompositeLayers", "decode", "ImageDecodeTask"):
        inner[e["name"]][0 if fingered(e["ts"]) else 1] += e["dur"]
print("\nmain thread by kind (ms per second)   finger | no finger")
for nm, (a, b) in sorted(inner.items(), key=lambda x: -(x[1][0] + x[1][1]))[:12]:
    print("  %-22s %6.1f | %6.1f" % (nm, a / max(1, fin_us) * 1000, b / max(1, nof_us) * 1000))
# EventDispatch by type
ed = collections.defaultdict(lambda: [0, 0])
for e in ev:
    if e.get("name") == "EventDispatch" and (e["pid"], e["tid"]) == main and "dur" in e:
        t = e.get("args", {}).get("data", {}).get("type")
        ed[t][0] += 1; ed[t][1] += e["dur"]
print("\nevents:", {k: "%d×, %.1f ms" % (n, us / 1000) for k, (n, us) in sorted(ed.items(), key=lambda x: -x[1][1])[:8]})
# JS self time by function from cpu profile chunks (renderer pid)
nodes = {}; samples = []
for e in ev:
    if e.get("name") == "ProfileChunk" and e["pid"] == rpid:
        c = e["args"]["data"].get("cpuProfile", {})
        for n in c.get("nodes", []):
            cf = n.get("callFrame", {})
            nodes[n["id"]] = (cf.get("functionName") or "(anon)") + ":" + str(cf.get("lineNumber", ""))
        ts_list = e["args"]["data"].get("timeDeltas", [])
        ids = c.get("samples", [])
        samples.append((e["ts"], ids, ts_list))
# reconstruct sample timestamps
prof_start = [e for e in ev if e.get("name") == "Profile" and e["pid"] == rpid]
t = prof_start[0]["args"]["data"]["startTime"] if prof_start else 0
selfc = collections.defaultdict(lambda: [0, 0])
for _, ids, dts in samples:
    for i, nid in enumerate(ids):
        t += dts[i] if i < len(dts) else 0
        nm = nodes.get(nid, "?")
        selfc[nm][0 if fingered(t) else 1] += 1
tot = [sum(v[0] for v in selfc.values()), sum(v[1] for v in selfc.values())]
print("\nJS samples finger/no-finger:", tot, "(sample ~0.1-1 ms)")
for nm, (a, b) in sorted(selfc.items(), key=lambda x: -(x[1][0] / max(1, fin_us) + x[1][1] / max(1, nof_us)))[:22]:
    print("  %-40s %5.1f | %5.1f  per s" % (nm[:40], a / max(1, fin_us) * 1e6, b / max(1, nof_us) * 1e6))
