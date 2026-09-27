#!/usr/bin/env python3
"""Measure a frame of the stand against the style sheet (docs/DESIGN-planet-style.md).

    python docs/look/measure.py lanes docs/look/lanes.json --dir C:/tmp/frames [key ...] [--boxes]
    python docs/look/measure.py hues C:/tmp/frames/m600-broad.png [more.png ...]
    python docs/look/measure.py family C:/tmp/frames/m600-broad.png x0 y0 x1 y1 h0 h1 [cmin]
    python docs/look/measure.py rows C:/tmp/frames/m600-broad.png x0 x1 y0 y1 [step]
    python docs/look/measure.py lightest C:/tmp/frames/m600-broad.png [more.png ...]
    python docs/look/measure.py motion C:/tmp/frames/a.png C:/tmp/frames/b.png

Value is the display luma: Rec.709 weights on the sRGB values of the picture, 0..1. Colour is OKLCH: lightness,
chroma, hue in degrees. Boxes are fractions of the frame, y from the top.

lanes   for every lane of a frame (the union of its boxes in lanes.json): luma at the 10th, 50th and 90th
        percentile, the mean colour and its OKLCH; for the whole frame: percentiles, the lightest of it and the
        share of pixels in four value bands; then the families of the frame, as `family` prints them.
        --boxes writes <key>-boxes.png beside the frame, to see where the boxes lie.
hues    how much of the frame each family of hue takes, how much of that is strong (chroma over 0.10), and how
        much of the frame is grey (chroma under 0.035).
family  the pixels of one family of hue inside a box: h0..h1 degrees (h0 > h1 wraps through 0), cmin the least
        chroma counted (0.08). For the orange of people, the mauve of the world and the like.
rows    the luma of a strip row by row (every step-th row): where a band of light or of shade lies.
lightest  where the lightest thousandth of the frame lies, by cells of a tenth of the frame, and its colour.
motion  two moments of one frame (shot with --t): how much the picture changed and how much of it moved.

Frames are pictures: they live outside the repository.
"""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw

BANDS = [0, .12, .30, .60, 1.0001]
GREY, STRONG = .035, .10
FAMILIES = [("red-orange", 20, 75), ("yellow", 75, 110), ("green", 110, 165), ("teal", 165, 215),
            ("blue", 215, 275), ("violet", 275, 300), ("mauve", 300, 360), ("pink-red", 0, 20)]


def load(path):
    return np.asarray(Image.open(path).convert("RGB"), dtype=np.float64)


def luma(px):
    return (px[..., 0] * .2126 + px[..., 1] * .7152 + px[..., 2] * .0722) / 255.0


def oklch(a):
    c = a / 255.0
    c = np.where(c <= .04045, c / 12.92, ((c + .055) / 1.055) ** 2.4)
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    l = np.cbrt(.4122214708 * r + .5363325363 * g + .0514459929 * b)
    m = np.cbrt(.2119034982 * r + .6806995451 * g + .1073969566 * b)
    s = np.cbrt(.0883024619 * r + .2817188376 * g + .6299787005 * b)
    L = .2104542553 * l + .7936177850 * m - .0040720468 * s
    A = 1.9779984951 * l - 2.4285922050 * m + .4505937099 * s
    B = .0259040371 * l + .7827717662 * m - .8086757660 * s
    return L, np.hypot(A, B), np.degrees(np.arctan2(B, A)) % 360


def hexof(rgb):
    return "#%02x%02x%02x" % tuple(int(round(v)) for v in rgb)


def cut(a, box):
    h, w = a.shape[:2]
    x0, y0 = int(box[0] * w), int(box[1] * h)
    return x0, y0, max(x0 + 1, int(box[2] * w)), max(y0 + 1, int(box[3] * h))


def family_of(a, spec):
    """spec: x0 y0 x1 y1 h0 h1 [cmin]; the line of numbers, or None when no pixel is of the family"""
    h0, h1 = float(spec[4]), float(spec[5])
    cmin = float(spec[6]) if len(spec) > 6 else .08
    x0, y0, x1, y1 = cut(a, [float(v) for v in spec[:4]])
    part = a[y0:y1, x0:x1]
    L, C, H = oklch(part)
    m = (C >= cmin) & (((H >= h0) & (H < h1)) if h0 <= h1 else ((H >= h0) | (H < h1)))
    if not m.any():
        return None
    px = part[m]
    y = np.percentile(luma(px), [10, 50, 90])
    c = np.percentile(C[m], [10, 50, 90])
    return ("pixels %d  share of the frame %.5f   luma %.3f %.3f %.3f   chroma %.3f %.3f %.3f   mean %s  hue %.0f"
            % (int(m.sum()), m.sum() / (a.shape[0] * a.shape[1]), y[0], y[1], y[2], c[0], c[1], c[2],
               hexof(px.mean(axis=0)), float(np.median(H[m]))))


def lanes(args):
    boxes = "--boxes" in args
    args = [v for v in args if v != "--boxes"]
    folder = "."
    if "--dir" in args:
        k = args.index("--dir")
        folder = args[k + 1]
        del args[k:k + 2]
    spec = json.load(open(args[0], encoding="utf-8"))
    for key in args[1:] or list(spec.keys()):
        fr = spec[key]
        path = os.path.join(folder, fr["img"])
        a = load(path)
        y = luma(a)
        q = np.percentile(y, [5, 50, 95, 99, 99.9, .1, 1])
        share = [float(((y >= BANDS[k]) & (y < BANDS[k + 1])).mean()) for k in range(4)]
        print("== %s  %s  %dx%d" % (key, fr["img"], a.shape[1], a.shape[0]))
        print("   frame          luma %.3f %.3f %.3f (p5 p50 p95)   under .12: %.2f   .12-.30: %.2f   .30-.60: %.2f   over .60: %.2f"
              % (q[0], q[1], q[2], share[0], share[1], share[2], share[3]))
        print("   the ends       luma %.3f %.3f %.3f (min p0.1 p1)   %.3f %.3f %.3f (p99 p99.9 max)"
              % (y.min(), q[5], q[6], q[3], q[4], y.max()))
        over = Image.open(path).convert("RGB") if boxes else None
        pen = ImageDraw.Draw(over) if boxes else None
        for lane, list_ in fr["lanes"].items():
            parts = []
            for box in list_:
                x0, y0, x1, y1 = cut(a, box)
                parts.append(a[y0:y1, x0:x1].reshape(-1, 3))
                if boxes:
                    pen.rectangle((x0, y0, x1, y1), outline=(255, 255, 0))
                    pen.text((x0 + 2, y0 + 1), lane, fill=(255, 255, 0))
            px = np.concatenate(parts)
            p = np.percentile(luma(px), [10, 50, 90])
            mean = px.mean(axis=0)
            L, C, H = oklch(mean)
            print("   %-14s luma %.3f %.3f %.3f   mean %s  L %.2f  C %.3f  h %3.0f"
                  % (lane, p[0], p[1], p[2], hexof(mean), L, C, H))
        for fam, one in fr.get("families", {}).items():
            print("   %-14s %s" % (fam, family_of(a, one) or "nothing found"))
            if boxes:
                x0, y0, x1, y1 = cut(a, one[:4])
                pen.rectangle((x0, y0, x1, y1), outline=(0, 255, 255))
                pen.text((x0 + 2, y1 - 11), fam, fill=(0, 255, 255))
        if boxes:
            out = os.path.join(folder, key + "-boxes.png")
            over.save(out)
            print("   boxes:", out)


def hues(args):
    for path in args:
        a = load(path)
        L, C, H = oklch(a)
        n = C.size
        grey = C < GREY
        print("== %s  %dx%d   grey %.3f   strong %.4f   chroma: mean %.3f  p95 %.3f  max %.3f"
              % (os.path.basename(path), a.shape[1], a.shape[0], grey.mean(), (C > STRONG).mean(), C.mean(),
                 np.percentile(C, 95), C.max()))
        for fam, h0, h1 in FAMILIES:
            m = (~grey) & (H >= h0) & (H < h1)
            if not m.any():
                continue
            print("   %-11s share %.4f   strong %.4f   chroma: mean %.3f  p95 %.3f  p99.9 %.3f  max %.3f   L %.2f"
                  % (fam, m.sum() / n, (m & (C > STRONG)).sum() / n, C[m].mean(), np.percentile(C[m], 95),
                     np.percentile(C[m], 99.9), C[m].max(), L[m].mean()))


def family(args):
    print(os.path.basename(args[0]), "", family_of(load(args[0]), args[1:]) or "nothing found")


def rows(args):
    a = load(args[0])
    x0, x1, y0, y1 = [float(v) for v in args[1:5]]
    step = int(args[5]) if len(args) > 5 else 1
    y = luma(a)
    h, w = y.shape
    for r in range(int(y0 * h), int(y1 * h), step):
        p = np.percentile(y[r, int(x0 * w):max(int(x0 * w) + 1, int(x1 * w))], [10, 50, 90])
        mean = a[r, int(x0 * w):max(int(x0 * w) + 1, int(x1 * w))].mean(axis=0)
        print("y %.4f   luma %.3f %.3f %.3f   mean %s  %s" % (r / h, p[0], p[1], p[2], hexof(mean), "#" * int(p[1] * 60)))


def lightest(args):
    for path in args:
        a = load(path)
        y = luma(a)
        h, w = y.shape
        q = np.percentile(y, [99, 99.9])
        print("== %s  luma %.3f %.3f %.3f (p99 p99.9 max)" % (os.path.basename(path), q[0], q[1], y.max()))
        m = y >= q[1]
        cells = []
        for j in range(10):
            for i in range(10):
                box = (slice(j * h // 10, (j + 1) * h // 10), slice(i * w // 10, (i + 1) * w // 10))
                n = int(m[box].sum())
                if n:
                    cells.append((n, i, j, a[box][m[box]].mean(axis=0)))
        for n, i, j, mean in sorted(cells, key=lambda c: -c[0])[:6]:
            print("   x %.1f-%.1f  y %.1f-%.1f   share of the lightest %.2f   mean %s"
                  % (i / 10, (i + 1) / 10, j / 10, (j + 1) / 10, n / m.sum(), hexof(mean)))


def squint(path, wide=96):
    im = Image.open(path).convert("RGB")
    return np.asarray(im.resize((wide, max(1, round(wide * im.size[1] / im.size[0]))), Image.BOX), dtype=np.float64)


def motion(args):
    a, b = load(args[0]), load(args[1])
    d = np.abs(a - b).max(axis=2)
    print("%s | %s" % (os.path.basename(args[0]), os.path.basename(args[1])))
    print("   pixel by pixel    mean change %.2f of 255   moved by more than 24: %.4f of the frame   the greatest %.0f"
          % (d.mean(), (d > 24).mean(), d.max()))
    s = np.abs(squint(args[0]) - squint(args[1])).max(axis=2)
    j, i = np.unravel_index(int(s.argmax()), s.shape)
    print("   at 96 px wide     mean change %.2f of 255   moved by more than 8: %.4f   the greatest %.1f at x %.2f y %.2f"
          % (s.mean(), (s > 8).mean(), s.max(), (i + .5) / s.shape[1], (j + .5) / s.shape[0]))


def main():
    todo = {"lanes": lanes, "hues": hues, "family": family, "rows": rows, "lightest": lightest, "motion": motion}
    if len(sys.argv) < 3 or sys.argv[1] not in todo:
        sys.exit(__doc__)
    todo[sys.argv[1]](sys.argv[2:])


main()
