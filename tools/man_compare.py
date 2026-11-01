# Два человека в одном кадре: игровой plnMan и конвертированный механик.
# Один свет, одна камера, один масштаб — только так сравнение честное.
import json, math, sys
import numpy as np
from PIL import Image, ImageDraw

MAN = r"C:\Claude\drift-merge\_scratch\man_geo2.json"
MECH = r"C:\Claude\drift-merge\_scratch\mech_kit.json"
OUT = r"C:\Claude\drift-merge\_scratch\kimi3d\pose\compare.png"
S = int(sys.argv[1]) if len(sys.argv) > 1 else 900

# ── игровой человек: кости + поза ──
d = json.load(open(MAN, encoding="utf-8"))
V = np.array(d["v"], dtype=np.float64).reshape(-1, d["vs"])
POSE = np.array(d["pose"], dtype=np.float64)
bone_of = np.zeros(len(V), dtype=np.int64)
for q in d["parts"]:
    bone_of[q["off"]:q["off"] + q["nv"]] = q["bone"]
pM = V[:, 0:3].copy(); nM = V[:, 3:6].copy(); cM = np.clip(V[:, 6:9], 0, 1)
for k in range(len(POSE)):
    m = bone_of == k
    if not m.any():
        continue
    c, s, bx, by, bz, _a = POSE[k]
    lx, ly, lz = pM[m, 0], pM[m, 1], pM[m, 2]
    pM[m, 0] = bx + c * lx - s * ly; pM[m, 1] = by + s * lx + c * ly; pM[m, 2] = bz + lz
    nx, ny, nz = nM[m, 0], nM[m, 1], nM[m, 2]
    nM[m, 0] = c * nx - s * ny; nM[m, 1] = s * nx + c * ny

# ── механик: сетка в Z, уводим в Y ──
e = json.load(open(MECH, encoding="utf-8"))
mk = list(e.values())[0]
W = np.array(mk["v"], dtype=np.float64).reshape(-1, int(mk.get("vs", 9)))
pK = W[:, [0, 2, 1]].copy(); nK = W[:, [0, 2, 1] + np.array([3, 4, 5]).tolist()][:, 0:3].copy() if False else W[:, 3:6][:, [0, 2, 1]].copy()
cK = np.clip(W[:, 6:9], 0, 1)

# высота фигур и общий масштаб
hM = pM[:, 1].max() - pM[:, 1].min()
hK = pK[:, 1].max() - pK[:, 1].min()
print("man height %.2f, mechanic height %.2f" % (hM, hK))

# ставим по обе стороны от нуля, ноги на одном уровне
pM[:, 0] += -0.62; pM[:, 1] -= pM[:, 1].min()
pK[:, 0] += 0.62;  pK[:, 1] -= pK[:, 1].min()

P = np.vstack([pM, pK]); N = np.vstack([nM, nK]); C = np.vstack([cM, cK])
off = len(pM)
triM = np.array(d["i"], dtype=np.int64).reshape(-1, 3)
triK = np.arange(len(pK) // 3 * 3).reshape(-1, 3) + off
TRI = np.vstack([triM, triK])

lo, hi = P.min(0), P.max(0)
span = float(max(hi[0] - lo[0], hi[1] - lo[1])) * 1.06
cx, cy = (lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2
sx = ((P[:, 0] - cx) / span * S + S / 2).astype(int)
sy = ((cy - P[:, 1]) / span * S + S / 2).astype(int)

L1 = np.array([-0.5, 0.6, -0.62]); L1 /= np.linalg.norm(L1)
L2 = np.array([0.6, -0.2, -0.75]); L2 /= np.linalg.norm(L2)
k1 = np.abs(N @ L1); k2 = np.abs(N @ L2)
lam = np.clip(0.22 + 0.60 * k1 + 0.24 * k2, 0, 1)

img = Image.new("RGB", (S, S), (14, 18, 24))
dr = ImageDraw.Draw(img)
zc = P[TRI][:, :, 2].mean(1)
for t in np.argsort(zc):
    a0, b0, c0 = TRI[t]
    col = (C[a0] + C[b0] + C[c0]) / 3.0
    k = (lam[a0] + lam[b0] + lam[c0]) / 3.0
    rgb = np.clip((col * k) ** (1 / 1.55) * 255, 0, 255).astype(int)
    dr.polygon([(sx[a0], sy[a0]), (sx[b0], sy[b0]), (sx[c0], sy[c0])],
               fill=(int(rgb[0]), int(rgb[1]), int(rgb[2])))
img.save(OUT)
print("wrote", OUT)
