"""сводка обхода lab/snippets/ctxlive.js по сценам: функция (или строка страницы для безымянной) → файл src/,
и по файлу — краска на #c за кадр (живой 2D), мерки, состояние, запечки. Вход — jsonl {"scene":…,"r":probe-вывод}.
  python lab/ctxsum.py ctx.jsonl [--md out.md]"""
import argparse, json, os, re, sys
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser()
ap.add_argument("jsonl")
ap.add_argument("--md")
a = ap.parse_args()

idx = {}
for l in open(os.path.join(ROOT, "docs", "INDEX.md"), encoding="utf-8"):
    m = re.match(r"^(\S+)\s+(src/[^:\s]+):\d+", l)
    if m and m.group(1) not in idx: idx[m.group(1)] = m.group(2)
html = open(os.path.join(ROOT, "drift.html"), encoding="utf-8").read().split("\n")
byline = {}
for f in sorted(os.listdir(os.path.join(ROOT, "src"))):
    if not f.endswith(".js"): continue
    for l in open(os.path.join(ROOT, "src", f), encoding="utf-8"):
        k = l.strip()
        if len(k) > 12 and k not in byline: byline[k] = "src/" + f


def where(fn):
    if fn.startswith("@"):
        n = fn[1:]
        if n.isdigit() and int(n) - 1 < len(html):
            return byline.get(html[int(n) - 1].strip(), "? строка %s" % n)
        return "?"
    base = fn.split(".")[-1] if fn not in idx else fn
    return idx.get(fn) or idx.get(base) or ("? " + fn)


live = defaultdict(lambda: {"paint": 0.0, "meas": 0.0, "state": 0.0, "scenes": set(), "fns": set()})
bake = defaultdict(lambda: {"calls": 0, "scenes": set(), "fns": set()})
dirty = []
for line in open(a.jsonl, encoding="utf-8"):
    try: d = json.loads(line)
    except Exception: continue
    o = (d.get("r") or {}).get("out") or {}
    if not o.get("frames"): continue
    sc, fr = d["scene"], o["frames"]
    if o.get("cState"): dirty.append(sc)
    for fn, c in o.get("live") or []:
        w = live[where(fn)]
        w["paint"] += c["краска"] / fr; w["meas"] += c["мерка"] / fr; w["state"] += c["состояние"] / fr
        if c["краска"]: w["scenes"].add(sc)
        w["fns"].add(fn)
    for fn, c in o.get("bake") or []:
        w = bake[where(fn)]
        w["calls"] += sum(c.values()); w["scenes"].add(sc); w["fns"].add(fn)

out = ["## Живой 2D на #c (краска за кадр, сумма по сценам)", "",
       "| файл | краска/кадр | мерка/кадр | состояние/кадр | сцены с краской | функции |", "|---|---|---|---|---|---|"]
for f, w in sorted(live.items(), key=lambda kv: -kv[1]["paint"]):
    out.append("| %s | %.1f | %.1f | %.1f | %s | %s |" % (f, w["paint"], w["meas"], w["state"], ", ".join(sorted(w["scenes"])) or "—",
                                                       ", ".join(sorted(w["fns"]))[:120]))
out += ["", "Сцены, где #c к концу записи грязный (cState 1): " + (", ".join(dirty) or "нет"), "",
        "## Запечка (чужие холсты, вызовов за 4 с)", "", "| файл | вызовов | сцены | функции |", "|---|---|---|---|"]
for f, w in sorted(bake.items(), key=lambda kv: -kv[1]["calls"]):
    out.append("| %s | %d | %s | %s |" % (f, w["calls"], ", ".join(sorted(w["scenes"])), ", ".join(sorted(w["fns"]))[:120]))
txt = "\n".join(out)
if a.md: open(a.md, "w", encoding="utf-8").write(txt + "\n")
print(txt)
