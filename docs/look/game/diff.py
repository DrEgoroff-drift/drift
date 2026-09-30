# -*- coding: utf-8 -*-
# What changed between two frames:  diff.py a.png b.png [mask.png]
# Prints the share of pixels that moved (more than 6/255 in any channel), the box around them and
# an 8 × 4 grid of shares per cell, so a pass that was meant to touch only the far world or only
# the rocks can be checked by numbers. With a third name it writes a mask: the change in red over
# the two frames dimmed. Frames are read from PLN_SHOTS (or ./look).
import os
import sys

from PIL import Image, ImageChops

D = os.environ.get("PLN_SHOTS") or os.path.join(os.path.dirname(os.path.abspath(__file__)), "look")
a = Image.open(os.path.join(D, sys.argv[1])).convert("RGB")
b = Image.open(os.path.join(D, sys.argv[2])).convert("RGB")
d = ImageChops.difference(a, b)
m = d.convert("L").point(lambda v: 255 if v > 6 else 0)
bbox = m.getbbox()
n = m.histogram()[255]
print("changed %.2f%%  bbox %s" % (100.0 * n / (a.width * a.height), bbox))
gx, gy = 8, 4
cw, ch = a.width // gx, a.height // gy
rows = []
for j in range(gy):
    row = []
    for i in range(gx):
        c = m.crop((i * cw, j * ch, (i + 1) * cw, (j + 1) * ch)).histogram()[255]
        row.append("%3d" % (100.0 * c / (cw * ch)))
    rows.append(" ".join(row))
print("\n".join(rows))
if len(sys.argv) > 3:
    out = Image.merge("RGB", (m, b.convert("L").point(lambda v: v // 2), a.convert("L").point(lambda v: v // 2)))
    out.save(os.path.join(D, sys.argv[3]))
    print("mask", sys.argv[3])
