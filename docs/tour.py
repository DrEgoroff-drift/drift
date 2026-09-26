"""tour.py — the Stage 1 flight gate on the tour (docs/DESIGN-gpu.md §L.S).

    python docs/tour.py [--n 1200] [--w 760 --h 760]

Runs docs/tour.js through docs/shot.py: ten flight items (NEYEL, Коммуна, wrecks, rescue, drones,
«Сорока», belt, hotel, planet, dock), N frames each, and prints one row per item, phase and mode.
Red (exit 1) on a run-phase flight frame (system mode, after the 120 entry frames) with:
a canvas upload (#c or any other), a frame crash, own submits != 1, more than one gpuBake submit,
or gpuBake frames over 1 % of all run flight frames of the tour (the per-item share is printed). Entry frames and
other modes are shown, not judged. --only <item> runs one item (the tour's clock differs, so a bake may move).
"""
import argparse, json, os, subprocess, sys

D = os.path.dirname(os.path.abspath(__file__))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=1200)
    ap.add_argument("--w", type=int, default=760)
    ap.add_argument("--h", type=int, default=760)
    ap.add_argument("--only", default="")
    ap.add_argument("--port", type=int, default=9478)
    ap.add_argument("--out", default=os.path.join(os.environ.get("TEMP", "."), "tour.png"))
    a = ap.parse_args()
    js = "window.__TN=%d;window.__TONLY=%s;" % (a.n, json.dumps(a.only)) + open(os.path.join(D, "tour.js"), encoding="utf-8").read()
    ev = "JSON.stringify({err:__TOUR.err,info:__TOUR.info,gerr:(GPU.errs||0),D:__TG})"
    cmd = [sys.executable, os.path.join(D, "shot.py"), "system", "--w", str(a.w), "--h", str(a.h), "--dpr", "1",
           "--clock", "step", "--budget", "900000", "--js", js, "--until", "window.__TOUR&&__TOUR.done",
           "--eval", ev, "--out", a.out, "--port", str(a.port)]
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", cwd=os.path.dirname(D))
    line = [l for l in r.stdout.splitlines() if l.strip()][-1] if r.stdout.strip() else ""
    if "{" not in line:
        print("tour: no result\n", r.stdout[-2000:], r.stderr[-2000:]); return 2
    d = json.loads(json.loads(line[line.index("{"):])["shot"]["eval"])
    print("errors", d["err"], "gpu errs", d["gerr"])
    T = d["D"]; red = []; nF = bF = 0
    print("%-24s %6s %6s %6s %6s %6s %6s %6s %6s %6s" % ("item|phase|mode", "frames", "front", "up", "wt", "sub!=1", "bakeF", "bakeMx", "crash", "sync"))
    for k in sorted(T["it"]):
        e = T["it"][k]
        print("%-24s %6d %6d %6d %6d %6d %6d %6d %6d %6d" % (k, e["n"], e["front"], e["up"], e["wt"], e["subBad"], e["bakeF"], e["bakeMax"], e["crash"], e.get("sync", 0)))
        it, ph, mode = k.split("|")
        if ph != "run" or mode != "system":
            continue
        if e["front"] or e["up"]: red.append(k + ": canvas uploads %d" % (e["front"] + e["up"]))
        if e["crash"]: red.append(k + ": frame crashes %d" % e["crash"])
        if e["subBad"]: red.append(k + ": own submits != 1 on %d frames" % e["subBad"])
        if e["bakeMax"] > 1: red.append(k + ": %d bakes in one frame" % e["bakeMax"])
        nF += e["n"]; bF += e["bakeF"]
    if d["err"] or d["gerr"]: red.append("tour errors")
    print("bake frames on the run: %d of %d = %.2f %%" % (bF, nF, 100 * bF / max(1, nF)))
    if bF > .01 * nF: red.append("bake frames %.2f %% > 1 %%" % (100 * bF / nF))
    who = sorted(T["who"].items(), key=lambda kv: -kv[1])
    who = [w for w in who if "|×" in w[0]] + [w for w in who if "|×" not in w[0]][:20]
    if who:
        print("who (uploads, bakes):")
        for k, n in who: print("%5d  %s" % (n, k[:180]))
    print("RED: " + "; ".join(red) if red else "GREEN: uploads 0, 1 submit a frame, bakes <= 1 a frame and <= 1 % of frames")
    return 1 if red else 0


if __name__ == "__main__":
    sys.exit(main())
