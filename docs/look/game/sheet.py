# -*- coding: utf-8 -*-
# A contact sheet of the eleven worlds shot with one prefix:  sheet.py <prefix> [cols] [tile width]
# Takes <prefix>_<type>.png for every type that exists (terran, ocean, desert, rocky, ice, volcanic,
# toxic, crystal, jungle, metal, ruin) from PLN_SHOTS (or ./look) and writes <prefix>_sheet.png
# with the type written over every tile. Missing frames are skipped.
import os
import sys

from PIL import Image, ImageDraw, ImageFont

L = os.environ.get("PLN_SHOTS") or os.path.join(os.path.dirname(os.path.abspath(__file__)), "look")
pre = sys.argv[1] if len(sys.argv) > 1 else "w"
cols = int(sys.argv[2]) if len(sys.argv) > 2 else 3
tw = int(sys.argv[3]) if len(sys.argv) > 3 else 640
TYPES = ["terran", "ocean", "desert", "rocky", "ice", "volcanic", "toxic", "crystal", "jungle", "metal", "ruin"]
try:
    font = ImageFont.truetype("segoeui.ttf", 22)
except Exception:
    font = ImageFont.load_default()

tiles = []
for t in TYPES:
    f = os.path.join(L, "%s_%s.png" % (pre, t))
    if not os.path.exists(f):
        continue
    im = Image.open(f).convert("RGB")
    th = int(im.size[1] * tw / im.size[0])
    tiles.append((t, im.resize((tw, th), Image.LANCZOS)))
if not tiles:
    raise SystemExit("no frames for " + pre)
th = tiles[0][1].size[1]
rows = (len(tiles) + cols - 1) // cols
lab = 28
sheet = Image.new("RGB", (cols * tw + (cols + 1) * 4, rows * (th + lab) + (rows + 1) * 4), (24, 26, 30))
d = ImageDraw.Draw(sheet)
for i, (t, im) in enumerate(tiles):
    x = 4 + (i % cols) * (tw + 4)
    y = 4 + (i // cols) * (th + lab + 4)
    d.text((x + 6, y + 2), t, fill=(230, 230, 230), font=font)
    sheet.paste(im, (x, y + lab))
out = os.path.join(L, "%s_sheet.png" % pre)
sheet.save(out)
print(out, sheet.size)
