"""The water's gate (M634): one water module on every planet scene, measured in the frame.

    python docs/look/game/water.py [port=10300] [pfx=wat] [only=lake_day,...] [shoot=0]

Shoots the terran lake and the ocean shore by day and by night through world.py + gshot.py,
each twice: as it is and with PLN.noMirror (the mirror pass left empty), plus the ocean at noon
with the sun aimed into the frame (PLN.sunAim — under the sun's law the light always stands
behind the scene and to one side, so its path never enters the lens by itself). Then it asks
the frames in numbers:

  spread   p90 - p10 of HSV value across the water band: no flat sheet (>= .08; the sea by
           day >= .10)
  mirror   the share of the band where the frame differs from the empty-mirror frame by more
           than 6/255 in a channel (>= .20)
  path     the sun's path: the share of the sea band's rows whose brightest pixel stands .15
           above the row's median in luma and within 40 px of one column (>= .35: the band's
           upper rows are the horizon's haze, where the path fades as it should) — value alone
           saturates on a bright sea, the path is white on blue
  nopath   the same measure on the key frame without the aim stays low (< .15): the gate
           sees the path, not any bright row
  stairs   horizontal stair edges in the mirror (M631 tail): runs longer than 4 frame px
           (12 at x3) where value jumps .08 or more between rows, per 10 000 px (< 20). The
           ripple used to cut the reflection into slices where its cells shrank under two
           pixels in depth (42 on the lake); the real horizontal edges that remain — the
           bottoms of crowns, the far shore — read about 12

shoot=0 measures frames already shot with the prefix. Prints one line per gate and
ALL GREEN or FAILED N. Frames are 1600 x 900; the boxes are where the water stands on
«Нейэль I» seed 1.
"""
import os
import re
import subprocess
import sys

from PIL import Image, ImageChops

import where

HERE = os.path.dirname(os.path.abspath(__file__))
AIM = "PLN.sunAim=[-0.02,0.06,1];\n"
NM = "PLN.noMirror=true;\n"
LAKE = (900, 555, 1440, 665)
SEA = (600, 375, 1100, 450)
RIPPLE = (1000, 560, 1400, 660)
GLINT = (620, 375, 960, 560)
JOBS = [
    ("lake_day", ["terran", "1", "lake", ".125"], ""),
    ("lake_night", ["terran", "1", "lake", ".75"], ""),
    ("ocean_day", ["ocean", "1", "pad", ".125"], ""),
    ("ocean_night", ["ocean", "1", "pad", ".75"], ""),
    ("ocean_glint", ["ocean", "1", "pad", ".25"], AIM),
    ("lake_day_nm", ["terran", "1", "lake", ".125"], NM),
    ("lake_night_nm", ["terran", "1", "lake", ".75"], NM),
    ("ocean_day_nm", ["ocean", "1", "pad", ".125"], NM),
    ("ocean_night_nm", ["ocean", "1", "pad", ".75"], NM),
]
GATES = [
    ("spread", "lake_day", LAKE, .08), ("spread", "lake_night", LAKE, .08),
    ("spread", "ocean_day", SEA, .10), ("spread", "ocean_night", SEA, .08),
    ("mirror", "lake_day", LAKE, .20), ("mirror", "lake_night", LAKE, .20),
    ("mirror", "ocean_day", SEA, .20), ("mirror", "ocean_night", SEA, .20),
    ("path", "ocean_glint", SEA, .35), ("nopath", "ocean_day", SEA, .15),
    ("stairs", "lake_day", RIPPLE, 20), ("stairs", "ocean_glint", GLINT, 20),
]

opt = dict(a.split("=", 1) for a in sys.argv[1:] if "=" in a)
port = int(opt.get("port", "10300"))
pfx = opt.get("pfx", "wat")
only = set(opt["only"].split(",")) if opt.get("only") else None
SH = where.shots()
env = dict(os.environ, PYTHONIOENCODING="utf-8")


def shoot(name, args, pre):
    r = subprocess.run([sys.executable, os.path.join(HERE, "world.py")] + args, capture_output=True, text=True,
                       encoding="utf-8", errors="replace", env=env)
    m = re.search(r"g_w_\S+\.js", r.stdout + r.stderr)
    if not m:
        return "no snippet: " + (r.stdout + r.stderr)[-200:]
    js = m.group(0)
    if pre:
        src = where.find(js)
        js = "%s_%s.js" % (pfx, name)
        with open(os.path.join(SH, js), "w", encoding="utf-8") as f:
            f.write(pre + open(src, encoding="utf-8").read())
    r = subprocess.run([sys.executable, os.path.join(HERE, "gshot.py"), "js=" + js, "out=%s_%s.png" % (pfx, name),
                        "port=%d" % port, "tail=1500"], capture_output=True, text=True, encoding="utf-8",
                       errors="replace", env=env, timeout=300)
    t = r.stdout + r.stderr
    bad = re.search(r"\"errs\": [1-9]|\"crash\": true", t)
    return "error in the frame" if bad else ""


def frame(name, box):
    return Image.open(os.path.join(SH, "%s_%s.png" % (pfx, name))).convert("RGB").crop(box)


def spread(name, box):
    b = frame(name, box).tobytes()
    v = sorted(max(b[i:i + 3]) / 255 for i in range(0, len(b), 3))
    return v[int(len(v) * .9)] - v[int(len(v) * .1)]


def mirror(name, box):
    d = ImageChops.difference(frame(name, box), frame(name + "_nm", box)).tobytes()
    n = len(d) // 3
    return sum(1 for i in range(0, len(d), 3) if max(d[i:i + 3]) > 6) / n


def stairs(name, box):
    """Horizontal stair edges in the mirror: runs of more than 4 frame px (12 at x3) where the value
    jumps by .08 or more from one row to the next; returns the count per 10 000 px."""
    im = frame(name, box).convert("RGB")
    w, h = im.size
    b = im.tobytes()
    v = [[max(b[3 * (y * w + x):3 * (y * w + x) + 3]) / 255 for x in range(w)] for y in range(h)]
    n = 0
    for y in range(h - 1):
        run = 0
        for x in range(w):
            if abs(v[y + 1][x] - v[y][x]) >= .08:
                run += 1
            else:
                n += run > 4
                run = 0
        n += run > 4
    return n * 1e4 / (w * h)


def path(name, box):
    im = frame(name, box).convert("L")
    w, h = im.size
    px = im.load()
    rows = []
    for y in range(h):
        row = [px[x, y] / 255 for x in range(w)]
        top = max(range(w), key=row.__getitem__)
        rows.append((row[top] - sorted(row)[w // 2], top))
    xs = sorted(x for _, x in rows)
    mid = xs[len(xs) // 2]
    return sum(1 for d, x in rows if d >= .15 and abs(x - mid) <= 40) / h


if opt.get("shoot", "1") != "0":
    for name, args, pre in JOBS:
        if only and name.replace("_nm", "") not in only:
            continue
        e = shoot(name, args, pre)
        port += 1
        if e:
            print("%s_%s: %s" % (pfx, name, e))
fail = 0
for kind, name, box, lim in GATES:
    if only and name not in only:
        continue
    try:
        v = {"spread": spread, "mirror": mirror, "path": path, "nopath": path, "stairs": stairs}[kind](name, box)
    except OSError as e:
        print("FAIL %-6s %-12s no frame (%s)" % (kind, name, e))
        fail += 1
        continue
    low = kind in ("nopath", "stairs")
    ok = v < lim if low else v >= lim
    fail += not ok
    print("%s %-6s %-12s %.3f %s %.2f" % ("ok  " if ok else "FAIL", kind, name, v, "<" if low else ">=", lim))
print("next port", port)
print("ALL GREEN" if not fail else "FAILED %d" % fail)
