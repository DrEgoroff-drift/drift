"""waits up to --secs (default 600) for quiet — no foreign headless Chromes, CPU under 40 % — and prints how long it
waited and what the noise was. Put it before a probe that measures on the wall clock (lab/noise.py)."""
import argparse, os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import noise

ap = argparse.ArgumentParser()
ap.add_argument("--secs", type=float, default=600)
a = ap.parse_args()
t = time.time()
s = noise.wait_quiet(secs=a.secs)
print("тишина: ждали %d с · %s%s" % (time.time() - t, noise.tag(s), " · НЕ ДОЖДАЛИСЬ" if noise.noisy(s) else ""))
