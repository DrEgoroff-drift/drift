import json, sys, collections, bisect
d = json.load(open(sys.argv[1], encoding="utf-8"))
ev = d["traceEvents"] if isinstance(d, dict) else d
names = {(e["pid"], e["tid"]): e["args"]["name"] for e in ev if e.get("ph") == "M" and e.get("name") == "thread_name"}
faf = collections.Counter((e["pid"], e["tid"]) for e in ev if e.get("name") == "FireAnimationFrame")
main = faf.most_common(1)[0][0]; rpid = main[0]
gpu = [k for k, v in names.items() if v == "CrGpuMain"][0]
# profile samples -> (t, stack top names)
nodes = {}; parent = {}; chunks = []
for e in ev:
    if e.get("name") == "ProfileChunk" and e["pid"] == rpid:
        c = e["args"]["data"].get("cpuProfile", {})
        for n in c.get("nodes", []):
            cf = n.get("callFrame", {}); nodes[n["id"]] = (cf.get("functionName") or "(anon)") + ":" + str(cf.get("lineNumber", ""))
            if "parent" in n: parent[n["id"]] = n["parent"]
        chunks.append((c.get("samples", []), e["args"]["data"].get("timeDeltas", [])))
t = [e for e in ev if e.get("name") == "Profile" and e["pid"] == rpid][0]["args"]["data"]["startTime"]
seq = []
for ids, dts in chunks:
    for i, nid in enumerate(ids): t += dts[i]; seq.append((t, nid))
ts_only = [s[0] for s in seq]
def stack(nid, k=6):
    out = []
    while nid in nodes and len(out) < k:
        out.append(nodes[nid].split(":")[0]); nid = parent.get(nid)
    return "<".join(out)
def js_in(a, b, k=5):
    i, j = bisect.bisect_left(ts_only, a), bisect.bisect_right(ts_only, b)
    c = collections.Counter(stack(seq[x][1]) for x in range(i, j))
    return c.most_common(k), j - i
# the long pointermove
pm = [e for e in ev if e.get("name") == "EventDispatch" and (e["pid"], e["tid"]) == main and e.get("args", {}).get("data", {}).get("type") == "pointermove" and "dur" in e]
big = sorted(pm, key=lambda e: -e["dur"])[:3]
for e in big:
    print("pointermove %.1f ms" % (e["dur"] / 1000))
    top, n = js_in(e["ts"], e["ts"] + e["dur"])
    for s, c in top: print("   %4d  %s" % (c, s))
    inner = [(x["name"], round(x["dur"] / 1000, 1)) for x in ev if (x["pid"], x["tid"]) == main and x.get("ph") == "X" and "dur" in x and e["ts"] <= x["ts"] <= e["ts"] + e["dur"] and x["dur"] > 3000]
    print("   inner:", inner[:10])
# long frames
fa = sorted([e for e in ev if e.get("name") == "FireAnimationFrame" and (e["pid"], e["tid"]) == main and "dur" in e], key=lambda e: e["ts"])
fr = []
for e in fa:
    if fr and e["ts"] - fr[-1]["ts"] < 4000: fr[-1]["dur"] += e["dur"]
    else: fr.append({"ts": e["ts"], "dur": e["dur"]})
iv = sorted(((fr[i]["ts"] - fr[i-1]["ts"]) / 1000, i) for i in range(1, len(fr)))
hist = collections.Counter(int(x // 4.17) for x, _ in iv)
print("\nframe interval histogram (bins of 4.17 ms = half a 120 Hz vsync):", sorted(hist.items())[:14])
gpuev = sorted([e for e in ev if (e["pid"], e["tid"]) == gpu and e["name"] == "RasterDecoderImpl::DoEndRasterCHROMIUM" and "dur" in e], key=lambda e: e["ts"])
print("DoEndRaster per frame: n=%d med %.1f ms p90 %.1f max %.1f" % (len(gpuev), sorted(e["dur"] for e in gpuev)[len(gpuev)//2] / 1000, sorted(e["dur"] for e in gpuev)[int(len(gpuev)*.9)] / 1000, max(e["dur"] for e in gpuev) / 1000))
print("\nlongest 6 frame gaps:")
for x, i in iv[-6:]:
    a, b = fr[i-1]["ts"], fr[i]["ts"]
    rafms = fr[i-1]["dur"] / 1000
    g = sum(min(b, e["ts"] + e["dur"]) - max(a, e["ts"]) for e in gpuev if e["ts"] < b and e["ts"] + e["dur"] > a) / 1000
    mm = [(x2["name"], round(x2["dur"] / 1000, 1)) for x2 in ev if (x2["pid"], x2["tid"]) == main and x2.get("ph") == "X" and "dur" in x2 and a <= x2["ts"] <= b and x2["dur"] > 4000 and x2["name"] not in ("RunTask", "ThreadControllerImpl::RunTask")][:5]
    print("  gap %.1f ms: rAF JS %.1f ms, GPU raster %.1f ms, main: %s" % (x, rafms, g, mm))
