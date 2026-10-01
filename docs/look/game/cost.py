"""The cost of the planet's frame by size (M614):

    python docs/look/game/cost.py [type] [sizes] [q=JS] [wait=5] [sec=3]

Lands the test terrain as <type> (the snippet world.py wrote, g_w_<type>_1_lake.js), lets the
land and the flora build for `wait` seconds, then runs the probe's g11GpuMs(sec) inside the page
and asks eval-cost.js. Prints one row per size: GPU ms per frame of every pass of the planet
(the marks of 21pe), the engine's own passes, the sum, the CPU side of the planet's frame, the
triangles, the calls and the records; then what was built and how long it took.

The shooter steps the page's clock by hand (docs/shot.py), so the game's own wallMs() stands
still inside a frame and PLN.stat.cpu, land.ms, flora.ms read 0 there. The snippet therefore
wraps plnSurface, plnLandStep and plnPlantStep with the real clock (__STEP.real): `cpu` is the
CPU side of a planet frame after the build, `first` the first planet frame (under PLN.rush it
builds and plants everything visible at once — the debt M614 spreads), `land`/`flora` the
wall time of the builders over the run.

sizes: a comma list of pc (1600×900), 2k (2560×1440), 4k (3840×2160), s23 (390×844 at 1.5 —
the cap the game puts on a phone, PHONE_DPR), phone (390×844 at 2.625, the S23's own pixels;
both emulate its pixels on this GPU, not its chip), tab (1024×1366 at 2). q= is JavaScript run
before the landing, to try a cut: q="PLN_GPU.shn=2048" or q="plnQualSet('low')"; tag= names the
frames and the snippet of the try.
"""
import json
import os
import subprocess
import sys

from where import HERE, find, shots

SIZES = {"pc": (1600, 900, 1), "2k": (2560, 1440, 1), "4k": (3840, 2160, 1), "s23": (390, 844, 1.5), "phone": (390, 844, 2.625),
         "tab": (1024, 1366, 2)}
# the real clock around the planet's CPU work: the frame, the land builder, the planter
HOOK = ("(function(){var rp=window.__STEP?__STEP.real:performance.now.bind(performance),C=window.__CPU={first:0,frame:{ms:0,n:0},"
        "land:{ms:0,n:0},flora:{ms:0,n:0}};function wrap(name,key){var f=window[name];if(typeof f!=='function')return;"
        "window[name]=function(){var t=rp();try{return f.apply(this,arguments);}finally{var d=rp()-t;var s=C[key];s.ms+=d;s.n++;"
        "if(key==='frame'&&s.n===1)C.first=d;}};}wrap('plnSurface','frame');wrap('plnLandStep','land');wrap('plnPlantStep','flora');})();")
PASSES = ["pln.shadow", "pln.mirror", "pln.scene", "pln.wing", "pln.air", "pln.bloom"]


def parse(txt):
    """the first JSON object printed by the shooter"""
    dec = json.JSONDecoder()
    for i, ch in enumerate(txt):
        if ch != "{":
            continue
        try:
            o, _ = dec.raw_decode(txt[i:])
            if isinstance(o, dict) and ("shot" in o or "eval" in o):
                return o
        except ValueError:
            pass
    return None


def run(ty, size, q, wait, sec, tag):
    w, h, dpr = SIZES[size]
    land = find("g_w_%s_1_lake.js" % ty)
    if not land:
        raise SystemExit("no landing snippet for %s: run world.py %s 1 lake .125 first" % (ty, ty))
    src = open(land, encoding="utf-8").read().strip()
    js = ("%s\n%s\n%s\nwindow.__COST=null;setTimeout(function(){g11GpuMs(%d).then(function(r){window.__COST=r||{none:true};});},%d);"
          % (q + ";" if q else "", HOOK, src, sec, int(wait * 1000)))
    name = "g_cost_%s_%s%s.js" % (ty, size, tag)
    with open(os.path.join(shots(), name), "w", encoding="utf-8") as f:
        f.write(js)
    out = "cost_%s_%s%s.png" % (ty, size, tag)
    cmd = [sys.executable, os.path.join(HERE, "gshot.py"), "js=" + name, "eval=eval-cost.js", "until=window.__COST",
           "out=" + out, "w=%d" % w, "h=%d" % h, "dpr=%s" % dpr, "tail=10", "budget=%d" % int((wait + sec) * 1000 + 30000)]
    subprocess.run(cmd, cwd=HERE, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=240)
    txt = open(os.path.join(shots(), os.path.splitext(out)[0] + ".txt"), encoding="utf-8", errors="replace").read()
    o = parse(txt)
    sh = (o or {}).get("shot") or o or {}
    return sh.get("eval") or {}


def main():
    args = [a for a in sys.argv[1:] if "=" not in a]
    kv = dict(a.split("=", 1) for a in sys.argv[1:] if "=" in a)
    ty = args[0] if args else "terran"
    sizes = (args[1] if len(args) > 1 else "pc,4k,phone").split(",")
    q, wait, sec = kv.get("q", ""), float(kv.get("wait", 5)), int(kv.get("sec", 3))
    tag = ("_" + kv["tag"]) if kv.get("tag") else ""
    print("%-6s %6s %6s | %7s %7s %7s %6s %6s %7s %7s | %5s %6s %6s %5s %6s" %
          ("size", "frame", "sum", "shadow", "mirror", "scene", "wing", "air", "bloom", "engine", "cpu", "first", "Mtris", "calls", "recs"))
    built = None
    cpu = None
    for s in sizes:
        e = run(ty, s, q, wait, sec, tag)
        g = e.get("gpu") or {}
        if not g or g.get("none"):
            print("%-6s  no GPU marks (tsOk=%s, err=%s)" % (s, e.get("tsOk"), e.get("err")))
            continue
        pf = lambda k: (g.get(k) or {}).get("pf", 0)
        eng = sum(v.get("pf", 0) for k, v in g.items() if isinstance(v, dict) and not k.startswith("pln.") and k not in ("frame", "sum"))
        st = e.get("stat") or {}
        c = e.get("cpu") or {}
        fr = c.get("frame") or {}
        # the frame's mean without the first one, which builds the world
        cpu_ms = (fr.get("ms", 0) - c.get("first", 0)) / max(1, fr.get("n", 1) - 1) if fr else (st.get("cpu") or 0)
        print("%-6s %6.2f %6.2f | %7.2f %7.2f %7.2f %6.2f %6.2f %7.2f %7.2f | %5.2f %6.0f %6.2f %5d %6d" %
              (s, pf("frame"), pf("sum"), pf("pln.shadow"), pf("pln.mirror"), pf("pln.scene"), pf("pln.wing"), pf("pln.air"), pf("pln.bloom"),
               eng, cpu_ms, c.get("first", 0), (st.get("tris") or 0) / 1e6, st.get("calls") or 0, st.get("recs") or 0))
        built = st
        cpu = c
        others = {k: v.get("pf") for k, v in g.items() if isinstance(v, dict) and not k.startswith("pln.") and k not in ("frame", "sum")}
        if others:
            print("       engine: " + ", ".join("%s %.2f" % kvp for kvp in sorted(others.items(), key=lambda x: -x[1])))
    if built:
        print("built: land %s  kit %s  flora %s  things %s  herbs %s  beasts %s" %
              tuple(json.dumps(built.get(k)) for k in ("land", "kit", "flora", "things", "herbs", "beasts")))
    if cpu:
        ld, fl = cpu.get("land") or {}, cpu.get("flora") or {}
        print("wall ms: first frame %.0f, land builder %.0f in %d calls, planter %.0f in %d calls" %
              (cpu.get("first", 0), ld.get("ms", 0), ld.get("n", 0), fl.get("ms", 0), fl.get("n", 0)))


if __name__ == "__main__":
    main()
