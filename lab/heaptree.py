"""a sampling heap profile (probe --heap --alloc --heapdump) taken apart under one function: everything allocated
inside the subtrees of ROOT (by function name), booked to the function that allocated it, with its src/ file. With
probe --jsflags=--no-turbo-inlining an inlined callee books its own allocations instead of its caller's.
  python lab/heaptree.py heap.json --under K.surfG [--root C:/Claude/drift-lab-b] [--top 25]"""
import argparse, json, os, re
from collections import defaultdict

ap = argparse.ArgumentParser()
ap.add_argument("heap")
ap.add_argument("--under", default="K.surfG")
ap.add_argument("--root", default=os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ap.add_argument("--top", type=int, default=25)
a = ap.parse_args()

html = open(os.path.join(a.root, "drift.html"), encoding="utf-8").read().split("\n")
byline = {}
for f in sorted(os.listdir(os.path.join(a.root, "src"))):
    if f.endswith(".js"):
        for l in open(os.path.join(a.root, "src", f), encoding="utf-8"):
            k = l.strip()
            if len(k) > 12 and k not in byline: byline[k] = "src/" + f


def src_of(cf):
    n = cf.get("lineNumber", -1)
    if not cf.get("url") or n < 0: return ""
    return byline.get(html[n].strip(), "?") if n < len(html) else "?"


H = json.load(open(a.heap, encoding="utf-8"))
total = [0]
own = defaultdict(int)       # function → bytes allocated by it under ROOT
roots = [0]


def key(cf): return "%s @%d %s" % (cf.get("functionName") or "(анон)", cf.get("lineNumber", 0) + 1, src_of(cf))


def walk(n, inside):
    total[0] += n["selfSize"]
    me = (n["callFrame"].get("functionName") or "") == a.under
    if me and not inside: roots[0] += 1
    ins = inside or me
    if ins: own[key(n["callFrame"])] += n["selfSize"]
    for c in n.get("children", []): walk(c, ins)


walk(H, False)
sub = sum(own.values())
print("всего за сниппет %.1f МБ · под %s %.1f МБ (%d корней)" % (total[0] / 1e6, a.under, sub / 1e6, roots[0]))
for k, v in sorted(own.items(), key=lambda kv: -kv[1])[:a.top]:
    print("%7.1f МБ %5.1f %%  %s" % (v / 1e6, 100 * v / max(1, sub), k))
