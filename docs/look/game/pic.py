#!/usr/bin/env python3
"""Small work on frames. Names are taken in the folder of frames (where.py) unless they are paths.

    python docs/look/game/pic.py crop <in> <out> x0 y0 x1 y1 [scale]    the box is in FRACTIONS of the frame
    python docs/look/game/pic.py pair <old> <new> <out> [--w 760] [--a text] [--b text] [--v]
    python docs/look/game/pic.py pix  <in> x,y [x,y ...]                 mean colour of a 9x9 patch, pixels
    python docs/look/game/pic.py strip <out> <in> <in> ... [--w 400] [--cols 4] [--t text,text,...]
"""
import argparse
import os
import sys

from PIL import Image, ImageDraw, ImageFont

from where import shots

BG, INK = (14, 18, 24), (230, 230, 230)


def at(name):
    return name if os.path.isabs(name) or os.path.dirname(name) else os.path.join(shots(), name)


def font(size=18):
    try:
        return ImageFont.truetype(r"C:\Windows\Fonts\segoeui.ttf", size)
    except OSError:
        return ImageFont.load_default()


def crop(a):
    x0, y0, x1, y1 = (float(v) for v in a[2:6])
    k = float(a[6]) if len(a) > 6 else 1
    im = Image.open(at(a[0])).convert("RGB")
    w, h = im.size
    c = im.crop((round(x0 * w), round(y0 * h), round(x1 * w), round(y1 * h)))
    if k != 1:
        c = c.resize((max(1, round(c.width * k)), max(1, round(c.height * k))), Image.LANCZOS)
    c.save(at(a[1]))
    print(at(a[1]), c.size)


def pair(a):
    ap = argparse.ArgumentParser()
    ap.add_argument("old")
    ap.add_argument("new")
    ap.add_argument("out")
    ap.add_argument("--w", type=int, default=760)
    ap.add_argument("--a", default="было")
    ap.add_argument("--b", default="стало")
    ap.add_argument("--v", action="store_true")
    o = ap.parse_args(a)
    ims = []
    for p in (o.old, o.new):
        im = Image.open(at(p)).convert("RGB")
        ims.append(im.resize((o.w, round(im.height * o.w / im.width)), Image.LANCZOS))
    gap, top = 8, 30
    if o.v:
        size = (o.w, top * 2 + ims[0].height + ims[1].height + gap)
        spots = [(0, 0), (0, top + ims[0].height + gap)]
    else:
        size = (o.w * 2 + gap, top + max(i.height for i in ims))
        spots = [(0, 0), (o.w + gap, 0)]
    sheet = Image.new("RGB", size, BG)
    d = ImageDraw.Draw(sheet)
    for im, (x, y), t in zip(ims, spots, (o.a, o.b)):
        d.text((x + 8, y + 4), t, fill=INK, font=font())
        sheet.paste(im, (x, y + top))
    sheet.save(at(o.out))
    print(at(o.out), sheet.size)


def pix(a):
    im = Image.open(at(a[0])).convert("RGB")
    for s in a[1:]:
        x, y = (int(v) for v in s.split(","))
        px = list(im.crop((x - 4, y - 4, x + 5, y + 5)).getdata())
        n = len(px)
        r, g, b = (sum(p[k] for p in px) / n for k in range(3))
        print("%d,%d  rgb %3d %3d %3d  value %.2f" % (x, y, r, g, b, (.2126 * r + .7152 * g + .0722 * b) / 255))


def strip(a):
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("ins", nargs="+")
    ap.add_argument("--w", type=int, default=400)
    ap.add_argument("--cols", type=int, default=4)
    ap.add_argument("--t", default="")
    o = ap.parse_args(a)
    names = o.t.split(",") if o.t else [os.path.splitext(os.path.basename(p))[0] for p in o.ins]
    ims = []
    for p in o.ins:
        im = Image.open(at(p)).convert("RGB")
        ims.append(im.resize((o.w, round(im.height * o.w / im.width)), Image.LANCZOS))
    gap, top = 6, 26
    cols = min(o.cols, len(ims))
    rows = (len(ims) + cols - 1) // cols
    hh = max(i.height for i in ims)
    sheet = Image.new("RGB", (cols * o.w + (cols - 1) * gap, rows * (hh + top) + (rows - 1) * gap), BG)
    d = ImageDraw.Draw(sheet)
    for k, im in enumerate(ims):
        x, y = (k % cols) * (o.w + gap), (k // cols) * (hh + top + gap)
        d.text((x + 6, y + 3), names[k] if k < len(names) else "", fill=INK, font=font(16))
        sheet.paste(im, (x, y + top))
    sheet.save(at(o.out))
    print(at(o.out), sheet.size)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    {"crop": crop, "pair": pair, "pix": pix, "strip": strip}[sys.argv[1]](sys.argv[2:])
