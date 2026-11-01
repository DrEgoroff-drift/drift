# kit_sheet.py — один лист со всеми телами: по строке на объект, с подписью и счётом.
#
#   python tools/kit_sheet.py <kit.json> <out.png> [cell-w] [cell-h]
#
# Читает то же, что tools/kit_render.py (выгрузка из tools/kit_dump_suite.js), но кладёт
# все объекты в одну картинку: сравнивать силуэты по отдельным файлам неудобно и нечестно —
# у каждого свой масштаб кадра.
import json, math, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

src = sys.argv[1] if len(sys.argv) > 1 else "_scratch/ship_dump.json"
out = sys.argv[2] if len(sys.argv) > 2 else "_scratch/kit_sheet.png"
CW = int(sys.argv[3]) if len(sys.argv) > 3 else 520
CH = int(sys.argv[4]) if len(sys.argv) > 4 else 120

d = json.load(open(src, encoding="utf-8"))
items = [(k, v) for k, v in d.items() if isinstance(v, dict) and "v" in v and not k.startswith("__")]
print("items:", len(items))
if not items:
    raise SystemExit("nothing to draw")

L1 = np.array([-0.55, 0.55, -0.63]); L1 /= np.linalg.norm(L1)
L2 = np.array([0.62, -0.15, -0.77]); L2 /= np.linalg.norm(L2)
ANG = 30.0

sheet = Image.new("RGB", (CW, CH * len(items)), (13, 17, 23))
sheet_draw = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype("consola.ttf", 13)
except Exception:
    font = ImageFont.load_default()

for row, (name, item) in enumerate(items):
    vs = int(item.get("vs", 12))
    V = np.array(item["v"], dtype=np.float64).reshape(-1, vs)
    P = V[:, 0:3]
    N = V[:, 3:6]
    C = np.clip(V[:, 6:9], 0, 1)
    a = math.radians(ANG)
    ca, sa = math.cos(a), math.sin(a)
    x = P[:, 0] * ca - P[:, 2] * sa
    z = P[:, 0] * sa + P[:, 2] * ca
    x0, x1 = np.percentile(x, [1, 99])
    y0, y1 = np.percentile(P[:, 1], [1, 99])
    bw, bh = max(x1 - x0, 1e-6), max(y1 - y0, 1e-6)
    scale = min((CW - 120) * 0.92 / bw, (CH - 24) * 0.92 / bh)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    sx = ((x - cx) * scale + (CW + 90) / 2).astype(int)
    sy = ((cy - P[:, 1]) * scale + CH * 0.5 + row * CH).astype(int)
    nx = N[:, 0] * ca - N[:, 2] * sa
    nz = N[:, 0] * sa + N[:, 2] * ca
    lam = np.clip(0.22 + 0.60 * np.abs(nx * L1[0] + N[:, 1] * L1[1] + nz * L1[2]) +
                  0.24 * np.abs(nx * L2[0] + N[:, 1] * L2[1] + nz * L2[2]), 0, 1)
    n = len(P) // 3
    tri = np.arange(n * 3).reshape(n, 3)
    # плоскость покраски из h3dPack в игре режется альфой; здесь она дала бы чёрные плиты
    lum = C[tri].mean(axis=(1, 2))
    tri = tri[lum > 0.03]
    zc = z[tri].mean(1)
    for t in np.argsort(zc):
        a0, b0, c0 = tri[t]
        col = (C[a0] + C[b0] + C[c0]) / 3.0
        k = (lam[a0] + lam[b0] + lam[c0]) / 3.0
        rgb = np.clip((col * k) ** (1 / 1.55) * 255, 0, 255).astype(int)
        sheet_draw.polygon([(sx[a0], sy[a0]), (sx[b0], sy[b0]), (sx[c0], sy[c0])],
                           fill=(int(rgb[0]), int(rgb[1]), int(rgb[2])))
    sheet_draw.text((10, row * CH + CH // 2 - 8), "%s  %dt" % (name, n), fill=(190, 210, 230), font=font)
    sheet_draw.line([(0, row * CH), (CW, row * CH)], fill=(40, 52, 64))

sheet.save(out)
print("wrote", out)
