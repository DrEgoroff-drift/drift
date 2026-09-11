#!/usr/bin/env python3
"""Headless shots of the game on a REAL save (a veteran's world), phone-sized by default.
    python docs/vetshot.py OUT.png "<js>" "<eval>" [--save PATH] [--w 500 --h 1080]
    js / eval may be "@file.js" (read from the file). The save is injected as window.__S and
    applied before js runs. Default save: C:\\Claude\\drift-private\\author-save.json — OUTSIDE git:
    it is the author's cloud save, taken with his permission (11.09.2026) for the phone playtest.
    Never copy a save into the repo. Below 500 px headless Chrome clamps the window (see shot.py).
Built on docs/shot.py (same page, same scene tail); OUT is written where you say, never into docs/."""
import importlib.util, sys, os, argparse
HERE = os.path.dirname(os.path.abspath(__file__))
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("shot", os.path.join(HERE, "shot.py"))
shot = importlib.util.module_from_spec(spec); spec.loader.exec_module(shot)
ap = argparse.ArgumentParser()
ap.add_argument("out"); ap.add_argument("js"); ap.add_argument("eval")
ap.add_argument("--save", default=r"C:\Claude\drift-private\author-save.json")
ap.add_argument("--w", default="500"); ap.add_argument("--h", default="1080")
a = ap.parse_args()
rd = lambda s: open(s[1:], encoding="utf8").read() if s.startswith("@") else s
save = open(a.save, encoding="utf8").read().replace("</", "<\\/")
orig = shot.page_for
def page_for(scene, tail, args):
    html = orig(scene, tail, args)
    cut = html.find("<script>\nsetTimeout(function(){")
    inj = "<script>window.__S=" + save + ";</script>\n"
    return html[:cut] + inj + html[cut:] if cut > 0 else html
shot.page_for = page_for
pre = "try{applySave(JSON.parse(JSON.stringify(window.__S)));G.running=true;}catch(e){console.error(e)};"
sys.argv = ["shot.py", "system", "--w", a.w, "--h", a.h, "--delay", "2600", "--budget", "9000",
            "--js", pre + rd(a.js), "--eval", rd(a.eval), "--out", os.path.abspath(a.out)]
shot.main()
