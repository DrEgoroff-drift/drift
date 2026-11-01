# kit_render.py — render h3dKit meshes outside the browser.
#
#   python tools/kit_render.py <kit.json> <out-prefix> [size]
#
# <kit.json> comes from tools/kit_dump_suite.js; the KITDUMP line carries it.\n# h3dPack has NO index buffer: the vertices are triangle soup, three per face, so a dump is drawn\n# as consecutive triples. Vertex layout is
# the engine's own (h3dKit, 17c2a-hull3d.js:33): x, y, z, nx, ny, nz, r, g, b, w, sp, em.
#
# Two things matter for a picture that can be judged:
#   * framing — props are built around their own origin, so the bbox centre is used, not (0,0,0);
#   * light — most props are deliberately dark (they are read from a distance), so a single
#     lambert crushes them into black. Key + fill from opposite sides and a gamma lift keep the
#     form readable without inventing colour.
import json, math, sys
import numpy as np
from PIL import Image, ImageDraw

src = sys.argv[1] if len(sys.argv) > 1 else "_scratch/kit_dump.json"
out = sys.argv[2] if len(sys.argv) > 2 else "_scratch/kit"
S = int(sys.argv[3]) if len(sys.argv) > 3 else 760
UP = sys.argv[4] if len(sys.argv) > 4 else "y"

d = json.load(open(src, encoding="utf-8"))
KEY = np.array([-0.55, 0.62, -0.56]); KEY /= np.linalg.norm(KEY)
FILL = np.array([0.62, -0.18, -0.76]); FILL /= np.linalg.norm(FILL)


def render(name, item, ang_deg, size=S):
    vs = int(item.get("vs", 12))
    V = np.array(item["v"], dtype=np.float64).reshape(-1, vs)
    P, N = V[:, 0:3], V[:, 3:6]
    if UP == "z":  # сетка движка в Z, у рендерера верх — Y
        P = P[:, [0, 2, 1]]; N = N[:, [0, 2, 1]]
    C = np.clip(V[:, 6:9], 0, 1)
    a = math.radians(ang_deg)
    ca, sa = math.cos(a), math.sin(a)
    x = P[:, 0] * ca - P[:, 2] * sa
    z = P[:, 0] * sa + P[:, 2] * ca
    # кадрирование по габаритам ПРОЕКЦИИ, а не по сырому центру
    x0, x1 = x.min(), x.max()
    y0, y1 = P[:, 1].min(), P[:, 1].max()
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    span = max(x1 - x0, y1 - y0, 1e-6) * 1.12
    sx = ((x - cx) / span * size + size / 2).astype(int)
    sy = ((cy - P[:, 1]) / span * size + size / 2).astype(int)
    nx = N[:, 0] * ca - N[:, 2] * sa
    nz = N[:, 0] * sa + N[:, 2] * ca
    ny = N[:, 1]
    kk = np.abs(nx * KEY[0] + ny * KEY[1] + nz * KEY[2])
    kf = np.abs(nx * FILL[0] + ny * FILL[1] + nz * FILL[2])
    lam = np.clip(0.20 + 0.62 * kk + 0.26 * kf, 0, 1)
    img = Image.new("RGB", (size, size), (14, 18, 24))
    dr = ImageDraw.Draw(img)
    # индексный буфер, если он есть; иначе вершины идут тройками
    if item.get("i"):
        tri = np.array(item["i"], dtype=np.int64).reshape(-1, 3)
    else:
        n = len(P) // 3
        tri = np.arange(n * 3).reshape(n, 3)
    zc = z[tri].mean(1)
    for t in np.argsort(zc):
        a0, b0, c0 = tri[t]
        col = (C[a0] + C[b0] + C[c0]) / 3.0
        k = (lam[a0] + lam[b0] + lam[c0]) / 3.0
        # гамма поднимает тёмные материалы, не выкручивая светлые
        rgb = np.clip((col * k) ** (1 / 1.55) * 255, 0, 255).astype(int)
        dr.polygon([(sx[a0], sy[a0]), (sx[b0], sy[b0]), (sx[c0], sy[c0])],
                   fill=(int(rgb[0]), int(rgb[1]), int(rgb[2])))
    path = "%s_%s.png" % (out, name)
    img.save(path)
    print("wrote %s  (%d verts, %d tris, span %.1f)" % (path, len(P), n, span))


for name, item in d.items():
    if "err" in item:
        print("%s: skipped (%s)" % (name, item["err"]))
        continue
    # три ракурса: у пропсов разная ось, и один вид не доказывает форму
    for ang in (0, 34, 62, 180):
        render("%s_%d" % (name, ang), item, ang)
