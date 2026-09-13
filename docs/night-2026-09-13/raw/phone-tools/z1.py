import json, sys, math, collections
sys.path.insert(0, r"C:\Users\user\AppData\Local\Temp\claude\C--Claude\b7d06a14-2cd9-49cd-bf67-437bbfa2a811\scratchpad")
import cdp
ws = cdp.WS(cdp.target_ws())
R = json.loads(cdp.evaluate(ws, "JSON.stringify(window.__z||[])"))
json.dump(R, open(r"C:\Users\user\AppData\Local\Temp\claude\C--Claude\b7d06a14-2cd9-49cd-bf67-437bbfa2a811\scratchpad\z1.json", "w"))
print("frames", len(R), "span", R[-1][0] / 1000)
# t,zoom,ptrs,stick,v,a,offx,offy,mode,shipScale,stickvec
z = [r[1] for r in R]; print("zoom min %.2f max %.2f" % (min(z), max(z)))
b = collections.OrderedDict()
for r in R: b.setdefault(r[0] // 1000, []).append(r)
for k, rs in b.items():
    zz = [r[1] for r in rs]; p2 = sum(r[2] >= 2 for r in rs); st = sum(r[3] for r in rs); v = max(r[4] for r in rs)
    off = max(math.hypot(r[6] or 0, r[7] or 0) for r in rs)
    iv = [rs[i][0] - rs[i-1][0] for i in range(1, len(rs))]
    print(f"{k:2d}s z {min(zz):.2f}-{max(zz):.2f} pinch{p2:3d} stick{st:3d} vmax {v:5.2f} shipOff {off:4.0f}px frames {len(rs)} longest {max(iv) if iv else 0}ms {rs[-1][8]}")
nz = 0; big = []
for i in range(1, len(R)):
    dz = R[i][1] - R[i-1][1]
    if abs(dz) > 1e-4 and R[i][2] < 2:
        nz += 1
        if abs(dz) / R[i-1][1] > .01: big.append((R[i][0] / 1000, round(R[i-1][1], 3), round(R[i][1], 3), R[i][2], R[i][8]))
print("zoom changed w/o pinch in", nz, "frames; >1%/frame:", big[:12])
pj = [(R[i][0] / 1000, round(R[i-1][1], 3), round(R[i][1], 3)) for i in range(1, len(R)) if R[i][2] >= 2 and abs(R[i][1] - R[i-1][1]) / R[i-1][1] > .06]
print("pinch jumps >6%/frame:", len(pj), pj[:10])
print("ship scale values:", sorted(set(r[9] for r in R))[:6])
