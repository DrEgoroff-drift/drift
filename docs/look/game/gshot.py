#!/usr/bin/env python3
"""Shoots the game's frame in the new look: runs docs/shot.py with --js / --eval / --until taken
from files, so that no quoting is lost in the shell.

    python docs/look/game/gshot.py [key=value ...]

    js=     a scene snippet (a file of at.py or world.py, or any .js); run before the frame
    eval=   what to ask the page after the frame (default eval-frame.js)
    until=  an expression to wait for
    out=    the picture, in the folder of frames (default g.png)
    w= h= dpr=      the frame (default 1600 900 1)
    delay= budget= timeout= port= clock= seed= look=   passed to shot.py as they are
    tail=   how much of shot.py's output to print (default 1500)

A name is looked for in the folder of frames (where.py), then beside this file; a value that
is not a file is taken as the text itself. What shot.py printed is saved beside the picture.
"""
import json
import os
import subprocess
import sys
import time

from where import ROOT, find, shots

JOB = {"scene": "surface", "eval": "eval-frame.js", "out": "g.png", "w": 1600, "h": 900, "dpr": 1,
       "port": 9461, "delay": 2600, "budget": 90000, "timeout": 240, "tail": 1500}


def main():
    job = dict(JOB)
    for k, v in (a.split("=", 1) for a in sys.argv[1:]):
        try:
            job[k] = json.loads(v)
        except ValueError:
            job[k] = v

    def text(name):
        v = job.get(name)
        if not v:
            return ""
        p = find(str(v))
        return open(p, encoding="utf-8").read().strip() if p else str(v)

    out = os.path.join(shots(), job["out"])
    cmd = [sys.executable, os.path.join(ROOT, "docs", "shot.py"), job["scene"],
           "--out", out, "--w", str(job["w"]), "--h", str(job["h"]), "--dpr", str(job["dpr"]),
           "--port", str(job["port"]), "--delay", str(job["delay"]), "--budget", str(job["budget"])]
    for key in ("js", "eval", "until"):
        t = text(key)
        if t:
            cmd += ["--" + key, t]
    if job.get("look"):
        cmd += ["--look"]
    if job.get("clock"):
        cmd += ["--clock", str(job["clock"])]
    if "seed" in job:
        cmd += ["--seed", str(job["seed"])]
    env = dict(os.environ, PYTHONIOENCODING="utf-8")
    t0 = time.time()
    r = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace",
                       timeout=job["timeout"], env=env)
    took = time.time() - t0
    with open(os.path.splitext(out)[0] + ".txt", "w", encoding="utf-8") as f:
        f.write(r.stdout + "\n" + r.stderr)
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stdout.write(r.stdout[-int(job["tail"]):])
    sys.stdout.write("\n[%s, %.1f s]\n" % (out, took))
    if r.stderr.strip():
        sys.stdout.write("\nSTDERR: " + r.stderr[-3000:])


if __name__ == "__main__":
    main()
