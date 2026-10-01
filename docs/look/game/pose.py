# -*- coding: utf-8 -*-
# Shoots the man in a given pose on the test planet and crops him out (M620).
#   python docs/look/game/pose.py <name>:k=v;k=v ...
# keys: ph (walk phase, rad), amp (0..1 — the stride), air (1: in the air), jet (1: thrust
# on), vy (game units a frame, + is down), raise (m above the ground when in the air), swim (1),
# hour (the phase of celSun; the snippet's own if empty), near (0 the game's lens, 1 twice as
# close; default 1), face (1/-1), dpr (default 2), w h, base (the scene snippet; default
# g_w_terran_1_pad.js, written by world.py), where (pad/lake/mid/right/x — the snippet's
# place), crop (x0,y0,x1,y1 in fractions; default .44,.50,.56,.72 — the man at the near
# lens), scale (of the crop). The state of the game is frozen through getters, so the
# frames of the stand and the engine's own tick cannot move the man.
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from where import shots  # noqa: E402

ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
LOOK = shots()
ENV = dict(os.environ, PLN_SHOTS=LOOK, PYTHONIOENCODING="utf-8")

OVR = u"""(function(){var S=G.surf;
  var fz=function(k,v){Object.defineProperty(S,k,{get:function(){return v;},set:function(){},configurable:true});};
  fz("walkPhase",{PH});fz("walkAmp",{AMP});S.face={FACE};
  if({AIR}){var y0=S.y-{RAISE}*PLN_M;fz("y",y0);fz("on",false);fz("vy",{VY});fz("jetOn",{JET});}
  if({SWIM}){fz("swim",1);}
})();
PLN.near={NEAR};
"""


def job(spec):
    name, _, rest = spec.partition(":")
    o = {"ph": "0", "amp": "0", "air": "0", "jet": "0", "vy": "0", "raise": "1.2", "swim": "0", "hour": "",
         "near": "1", "face": "1", "dpr": "2", "w": "1600", "h": "900", "crop": ".44,.50,.56,.72", "scale": "2",
         "base": "g_w_terran_1_pad.js", "where": ""}
    for kv in filter(None, rest.split(";")):
        k, _, v = kv.partition("=")
        o[k] = v
    base = open(os.path.join(LOOK, o["base"]), encoding="utf-8").read()
    if o["hour"]:
        base = re.sub(r"ph=\.\d+", "ph=" + o["hour"], base, count=1)
    if o["where"]:
        base = re.sub(r'where="[a-z]+"', 'where="' + o["where"] + '"', base, count=1)
    ovr = OVR
    for k, v in (("PH", o["ph"]), ("AMP", o["amp"]), ("FACE", o["face"]), ("AIR", o["air"]), ("RAISE", o["raise"]),
                 ("VY", o["vy"]), ("JET", o["jet"]), ("SWIM", o["swim"]), ("NEAR", o["near"])):
        ovr = ovr.replace("{" + k + "}", v)
    mark = "PLN.on=true;PLN.rush=true;"
    assert mark in base, "the snippet must end with " + mark
    js = base.replace(mark, ovr + mark)
    snip = "g_pose_" + name + ".js"
    with open(os.path.join(LOOK, snip), "w", encoding="utf-8", newline="\n") as f:
        f.write(js)
    out = "pose_" + name + ".png"
    r = subprocess.run([sys.executable, os.path.join(HERE, "gshot.py"), "js=" + snip, "out=" + out, "dpr=" + o["dpr"],
                        "w=" + o["w"], "h=" + o["h"], "tail=400"], cwd=ROOT, env=ENV, capture_output=True,
                       text=True, encoding="utf-8", errors="replace")
    txt = r.stdout
    m = re.search(r'"errors": \[[^\]]*\]', txt)
    e = re.search(r'"err": "([^"]*)"', txt)
    took = re.search(r", ([0-9.]+) s\]", txt)
    print(name, "errors", m.group(0) if m else "?", "err", e.group(1) if e else "?",
          took.group(1) + " s" if took else "", r.stderr.strip()[-200:])
    c = o["crop"].split(",")
    subprocess.run([sys.executable, os.path.join(HERE, "pic.py"), "crop", out, "pose_" + name + "_crop.png"] + c
                   + [o["scale"]], cwd=ROOT, env=ENV)


if __name__ == "__main__":
    for s in sys.argv[1:]:
        job(s)
