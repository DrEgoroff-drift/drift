#!/usr/bin/env python3
"""Writes a scene snippet at the deposit nearest to x on the test planet: the man 18 units short
of it, facing it, a trail of 39 footprints behind him.

    python docs/look/game/dep.py <x> [phase] [act] [left] [glide]
      x      the game's units along the walk line (13.1 to a metre)
      phase  hour of the day, 0..1 (.3 day, .85 night); -1 keeps the hour of the scene
      act    1 = the action is held, the drill runs
      left   what is left in the deposit (a worked one: 3); 0 keeps the game's number
      glide  1 = the near lens pre-set (the headless stand draws two frames after a snippet,
             so an eased value never settles on its own); default 1
Prints the file's name in the folder of frames: g_dep_<x>[_<phase>][_act][_l<left>].js
The question for the page that fits it: eval-things.js (the deposits near the man, mining,
tracks, the lens).
"""
import os
import sys

from where import shots

T = """G.surf.p.wx={kind:null};
(function(){
  var S=G.surf,p=S.p,ph=%(ph)s,X=%(x)s,d=null,dd=1e9;
  for(var i=0;i<S.deposits.length;i++){var q=S.deposits[i];if(q.left>0&&Math.abs(q.x-X)<dd){dd=Math.abs(q.x-X);d=q;}}
  if(d&&%(left)d>0){d.left=%(left)d;d.prog=.6;}
  S.x=d?d.x-18:X;S.y=groundAt(S.tr,S.x)-10;S.on=true;S.cam=null;S.camLook=0;S.face=1;
  if(ph>=0){var period=CEL_DAY*(6+((p.seed>>>7)&3));G.t=period*((ph-(p.seed%%100)/100+1)%%1);}
  S.tracks=[];for(var k=1;k<40;k++)S.tracks.push({x:S.x-k*13,t:G.t-k*30,f:1});S.lastTrackX=S.x;
  if(%(act)d)keys.act=true;
  window.__EXTRA={ph:+celSun(p).ph.toFixed(3),dep:d&&{res:d.res,x:Math.round(d.x),left:d.left}};
})();
PLN.on=true;PLN.rush=true;%(glide)s
"""


def main():
    a = sys.argv[1:]
    x = a[0]
    ph = a[1] if len(a) > 1 else "-1"
    act = int(a[2]) if len(a) > 2 else 0
    left = int(a[3]) if len(a) > 3 else 0
    glide = int(a[4]) if len(a) > 4 else 1
    name = "g_dep_%s%s%s%s.js" % (x, "" if ph == "-1" else "_" + ph.replace(".", ""),
                                  "_act" if act else "", "_l%d" % left if left else "")
    with open(os.path.join(shots(), name), "w", encoding="utf-8", newline="\n") as f:
        f.write(T % {"x": x, "ph": ph, "act": act, "left": left, "glide": "PLN.glide=1;" if glide else ""})
    print(name)


main()
