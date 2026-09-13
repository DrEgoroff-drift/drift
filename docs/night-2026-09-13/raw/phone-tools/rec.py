import json, math, sys
sys.path.insert(0, r"C:\Users\user\AppData\Local\Temp\claude\C--Claude\b7d06a14-2cd9-49cd-bf67-437bbfa2a811\scratchpad")
import cdp
ws = cdp.WS(cdp.target_ws())
R = json.loads(cdp.evaluate(ws, "JSON.stringify(window.__rec||[])"))
json.dump(R, open(sys.argv[1], "w"))
print("frames", len(R), "span ms", R[-1][0] - R[0][0] if R else 0)
# fields: t,x,y,vx,vy,a,zoom,sdx,sdy,brake,slow,vcx,vcy,mode
dts = [R[i][0] - R[i-1][0] for i in range(1, len(R))]
print("frame dt ms: median", sorted(dts)[len(dts)//2], "max", max(dts), ">50ms:", sum(d > 50 for d in dts))
# touch segments
segs = []; cur = None
for r in R:
    on = r[7] is not None
    if on and cur is None: cur = [r[0], r[0]]
    if on: cur[1] = r[0]
    if not on and cur: segs.append(cur); cur = None
if cur: segs.append(cur)
print("stick touches:", len(segs), [(round(a/1000,1), round((b-a)/1000,1)) for a, b in segs][:30])
# stick vector jitter while touching: frame-to-frame change of stick offset
jit = []
for i in range(1, len(R)):
    a, b = R[i-1], R[i]
    if a[7] is not None and b[7] is not None:
        jit.append(math.hypot(b[7]-a[7], b[8]-a[8]))
if jit:
    js = sorted(jit)
    print("stick delta px/frame: median", js[len(js)//2], "p90", js[int(len(js)*.9)], "max", js[-1])
# heading jitter: angular velocity sign flips
def wrap(d): return (d + math.pi) % (2*math.pi) - math.pi
av = [wrap(R[i][5]-R[i-1][5]) for i in range(1, len(R))]
flips = sum(1 for i in range(1, len(av)) if abs(av[i]) > .004 and abs(av[i-1]) > .004 and (av[i] > 0) != (av[i-1] > 0))
print("heading: max |dA|/frame", round(max(abs(x) for x in av), 3), "sign flips (|dA|>.004):", flips)
# speed profile & stopping
sp = [math.hypot(r[3], r[4]) for r in R]
print("speed: max", round(max(sp), 2), "end", round(sp[-1], 2))
# after each touch release, how long until speed < 0.3 and how far drifted
for a, b in segs:
    i = next(k for k, r in enumerate(R) if r[0] >= b)
    v0 = sp[i]; x0, y0 = R[i][1], R[i][2]
    j = next((k for k in range(i, len(R)) if sp[k] < .3), None)
    if v0 > .5:
        print(f"  release @{b/1000:.1f}s v={v0:.2f} -> stop {'never' if j is None else f'{(R[j][0]-b)/1000:.1f}s, drift {math.hypot(R[j][1]-x0, R[j][2]-y0):.0f}'}")
# brake frames while touching (dead zone = stop)
print("brake frames", sum(r[9] for r in R), "slow(retro) frames", sum(r[10] for r in R))
# zoom changes
zs = [r[6] for r in R]
zch = sum(1 for i in range(1, len(zs)) if abs(zs[i]-zs[i-1]) > 1e-3)
print("zoom min/max", min(zs), max(zs), "frames changing", zch)
# camera jumps: view centre vs ship offset change per frame
cj = []
for i in range(1, len(R)):
    a, b = R[i-1], R[i]
    if a[11] is None or b[11] is None: continue
    oa = (a[11]-a[1], a[12]-a[2]); ob = (b[11]-b[1], b[12]-b[2])
    cj.append(math.hypot(ob[0]-oa[0], ob[1]-oa[1]) * b[6])  # in screen px
if cj:
    c = sorted(cj); print("camera-vs-ship offset change, screen px/frame: median", round(c[len(c)//2], 2), "p95", round(c[int(len(c)*.95)], 2), "max", round(c[-1], 1))
print("modes", sorted(set(r[13] for r in R)))
