# kit_render.py — render h3dKit meshes outside the browser.
#
#   python tools/kit_render.py <kit.json> <out-prefix> [size]
#
# <kit.json> comes from the template suite; the KITDUMP line carries it. Vertex layout is the
# engine's own (h3dKit, 17c2a-hull3d.js:33): x, y, z, nx, ny, nz, r, g, b, w, sp, em.
import json, math, sys
import numpy as np
from PIL import Image, ImageDraw

src = sys.argv[1] if len(sys.argv) > 1 else "_scratch/kit_dump.json"
out = sys.argv[2] if len(sys.argv) > 2 else "_scratch/kit"
S = int(sys.argv[3]) if len(sys.argv) > 3 else 700

d = json.load(open(src, encoding="utf-8"))
L = np.array([-0.5, 0.55, -0.67]); L /= np.linalg.norm(L)


def render(name, item, ang_deg=32, size=S):
    V = np.array(item["v"], dtype=np.float64).reshape(-1, 12)
    P = V[:, 0:3]
    N = V[:, 3:6]
    C = np.clip(V[:, 6:9], 0, 1)
    a = math.radians(ang_deg)
    ca, sa = math.cos(a), math.sin(a)
    x = P[:, 0] * ca - P[:, 2] * sa
    z = P[:, 0] * sa + P[:, 2] * ca
    lo, hi = P.min(0), P.max(0)
    span = float(max((hi[0] - lo[0]), (hi[1] - lo[1]), (hi[2] - lo[2]), 1e-6))
    cx, cy = (lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2
    sx = ((x - cx) / span * size + size / 2).astype(int)
    sy = ((cy - P[:, 1]) / span * size + size / 2).astype(int)
    nx = N[:, 0] * ca - N[:, 2] * sa
    nz = N[:, 0] * sa + N[:, 2] * ca
    lam = np.clip(np.abs(nx * L[0] + N[:, 1] * L[1] + nz * L[2]), 0, 1) * 0.85 + 0.15
    img = Image.new("RGB", (size, size), (10, 13, 18))
    dr = ImageDraw.Draw(img)
    depth = z.mean()
    # треугольники идут подряд по три вершины
    n = len(P) // 3
    tri = np.arange(n * 3).reshape(n, 3)
    zc = z[tri].mean(1)
    for t in np.argsort(zc):
        a0, b0, c0 = tri[t]
        col = (C[a0] + C[b0] + C[c0]) / 3.0
        k = (lam[a0] + lam[b0] + lam[c0]) / 3.0
        rgb = np.clip(col * 255 * k, 0, 255).astype(int)
        dr.polygon([(sx[a0], sy[a0]), (sx[b0], sy[b0]), (sx[c0], sy[c0])],
                   fill=(int(rgb[0]), int(rgb[1]), int(rgb[2])))
    path = "%s_%s.png" % (out, name)
    img.save(path)
    print("wrote %s  (%d verts, %d tris, span %.2f)" % (path, len(P), n, span))


for name, item in d.items():
    if "err" in item:
        print("%s: skipped (%s)" % (name, item["err"]))
        continue
    render(name, item)
