# man_render.py — render the in-game man outside the browser.
#
#   python tools/man_render.py <dump.txt> <out-prefix> [width]
#
# <dump.txt> is stdout of `node test-node.js --only=dump-man` with the template suite from
# tools/man_dump_suite.js; the line starting with MANDUMP carries the JSON.
#
# The engine keeps each part in ITS OWN BONE SPACE (see plnManBones) and places it per frame
# with thirteen 64-byte records. So a dump of raw vertices is a pile at the origin: the pose has
# to be applied here, which is what this script does.
import json, math, sys
import numpy as np
from PIL import Image, ImageDraw

src = sys.argv[1] if len(sys.argv) > 1 else "_scratch/man_dump.txt"
out = sys.argv[2] if len(sys.argv) > 2 else "_scratch/man_pose"
S = int(sys.argv[3]) if len(sys.argv) > 3 else 760

raw = None
for line in open(src, encoding="utf-8", errors="replace"):
    if line.startswith("MANDUMP"):
        raw = line[7:]
        break
if raw is None:
    raise SystemExit("no MANDUMP line in " + src)

d = json.loads(raw)
VS = d["vs"]
V = np.array(d["v"], dtype=np.float64).reshape(-1, VS)
I = np.array(d["i"], dtype=np.int64).reshape(-1, 3)
POSE = np.array(d["pose"], dtype=np.float64)

bone_of = np.zeros(len(V), dtype=np.int64)
for q in d["parts"]:
    bone_of[q["off"]:q["off"] + q["nv"]] = q["bone"]

P = V[:, 0:3].copy()
N = V[:, 3:6].copy()
C = np.clip(V[:, 6:9], 0, 1)

# world = bone place + R(a) * local; the rig turns in the XY plane
for k in range(len(POSE)):
    m = bone_of == k
    if not m.any():
        continue
    c, s, bx, by, bz, _a = POSE[k]
    lx, ly, lz = P[m, 0], P[m, 1], P[m, 2]
    P[m, 0] = bx + c * lx - s * ly
    P[m, 1] = by + s * lx + c * ly
    P[m, 2] = bz + lz
    nx, ny, nz = N[m, 0], N[m, 1], N[m, 2]
    N[m, 0] = c * nx - s * ny
    N[m, 1] = s * nx + c * ny
    N[m, 2] = nz

lo, hi = P.min(0), P.max(0)
span = float(max((hi - lo).max(), 1e-6))
ctr = (lo + hi) * 0.5
print("verts %d tris %d parts %d bones %d" % (len(P), len(I), len(d["parts"]), len(POSE)))
print("bbox %s .. %s  span %.3f" % (np.round(lo, 3), np.round(hi, 3), span))

L = np.array([-0.45, 0.5, -0.74]); L /= np.linalg.norm(L)


def render(ang_deg, path):
    a = math.radians(ang_deg)
    ca, sa = math.cos(a), math.sin(a)
    x = P[:, 0] * ca - P[:, 2] * sa
    z = P[:, 0] * sa + P[:, 2] * ca
    sx = ((x - ctr[0]) / span * S + S / 2).astype(int)
    sy = ((ctr[1] - P[:, 1]) / span * S + S / 2).astype(int)
    nx = N[:, 0] * ca - N[:, 2] * sa
    nz = N[:, 0] * sa + N[:, 2] * ca
    lam = np.clip(np.abs(nx * L[0] + N[:, 1] * L[1] + nz * L[2]), 0, 1) * 0.82 + 0.18
    img = Image.new("RGB", (S, S), (12, 16, 22))
    dr = ImageDraw.Draw(img)
    depth = z[I].mean(1)
    for t in np.argsort(depth):
        a0, b0, c0 = I[t]
        col = (C[a0] + C[b0] + C[c0]) / 3.0
        k = (lam[a0] + lam[b0] + lam[c0]) / 3.0
        rgb = np.clip((col * k) ** (1 / 1.55) * 255, 0, 255).astype(int)
        dr.polygon([(sx[a0], sy[a0]), (sx[b0], sy[b0]), (sx[c0], sy[c0])],
                   fill=(int(rgb[0]), int(rgb[1]), int(rgb[2])))
    img.save(path)
    print("wrote " + path)


for ang in (0, 38, 90, 145):
    render(ang, out + "_a%d.png" % ang)

# Крупный план кистей: кости 10 и 12 — предплечья, на них висят перчатки.
# Общий план этого не показывает: кисть занимает десяток пикселей.
hand = np.isin(bone_of, [12]) & (P[:, 1] < 0.70)
if hand.any():
    hlo, hhi = P[hand].min(0), P[hand].max(0)
    hspan = float(max((hhi - hlo).max(), 1e-6))
    ctr_save, span_save = ctr.copy(), span
    ctr = (hlo + hhi) * 0.5
    span = hspan * 1.7
    print("hand bbox %s .. %s (span %.3f)" % (np.round(hlo, 3), np.round(hhi, 3), hspan))
    render(0, out + "_hand_front.png")
    render(55, out + "_hand_q.png")
    ctr, span = ctr_save, span_save


# Профиль силуэта: ширина по X на каждой десятой высоты. Это и есть то, что игрок
# видит на дистанции, — по нему и судим о пропорциях, а не по крупному плану.
def profile():
    y0, y1 = P[:, 1].min(), P[:, 1].max()
    h = y1 - y0
    print("silhouette profile (height fraction -> width, m):")
    for k in range(10):
        a = y0 + h * k / 10.0
        b = y0 + h * (k + 1) / 10.0
        m = (P[:, 1] >= a) & (P[:, 1] < b)
        if not m.any():
            continue
        # перцентили, а не крайние значения: одна антенна или бур задавала всю ширину
        lo2, hi2 = np.percentile(P[m, 0], [2, 98])
        print("  %.1f-%.1f  width %.3f  (of height %.3f)" % (k / 10.0, (k + 1) / 10.0, hi2 - lo2, (hi2 - lo2) / h))


profile()