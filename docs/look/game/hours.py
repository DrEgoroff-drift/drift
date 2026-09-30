#!/usr/bin/env python3
"""hours.py <tag> <x> [phases...] - shoots the test planet at x through the hours, one shot after another,
and joins the frames into a sheet <tag>_sheet.png. Extra key=value go to gshot (w=, h=, dpr=)."""
import os
import subprocess
import sys

G = os.path.dirname(os.path.abspath(__file__))


def run(*a):
    r = subprocess.run([sys.executable] + list(a), capture_output=True, text=True, encoding="utf-8", errors="replace")
    return (r.stdout or "") + (r.stderr or "")


def main():
    tag, x = sys.argv[1], sys.argv[2]
    rest = sys.argv[3:]
    extra = [a for a in rest if "=" in a]
    phases = [a for a in rest if "=" not in a] or ["0", ".04", ".125", ".25", ".42", ".5", ".54", ".75"]
    outs = []
    for ph in phases:
        name = run(os.path.join(G, "at.py"), x, "1", ph).strip().splitlines()[-1]
        out = "%s_%s.png" % (tag, ph.replace(".", ""))
        o = run(os.path.join(G, "gshot.py"), "js=" + name, "out=" + out, "tail=700", *extra)
        bad = [k for k in ('"errs": 0', '"crash": false', '"errors": []') if k not in o]
        i = o.find('"sun"')
        print(ph, out, "BAD " + str(bad) if bad else "ok", o[i:i + 260].replace("\n", " "))
        outs.append(out)
    print(run(os.path.join(G, "pic.py"), "strip", tag + "_sheet.png", *outs, "--w", "800", "--cols", "2", "--t", ",".join(phases)))


main()
