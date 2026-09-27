#!/usr/bin/env python3
"""Writes a scene snippet for the test planet: the man at world x, his facing, the hour.

    python docs/look/game/at.py <x> [face] [phase] [swim]
      x      the game's units along the walk line (13.1 to a metre)
      face   1 or -1
      phase  hour of the day, 0..1; -1 keeps the hour of the scene
      swim   1 = the ring inflated
Prints the file's name in the folder of frames: g_at_<x>[_<phase>].js
"""
import os
import sys

from where import shots

T = """G.surf.p.wx={kind:null};
(function(){
  var S=G.surf,p=S.p,ph=%(ph)s;
  S.x=%(x)s;S.y=groundAt(S.tr,S.x)-10;S.on=true;S.cam=null;S.camLook=0;S.face=%(face)s;
  if(%(swim)d)S.swim=1;
  if(ph>=0){var period=CEL_DAY*(6+((p.seed>>>7)&3));G.t=period*((ph-(p.seed%%100)/100+1)%%1);}
  window.__EXTRA={ph:+celSun(p).ph.toFixed(3),dark:+celDark().toFixed(2)};
})();
PLN.on=true;PLN.rush=true;
"""


def main():
    a = sys.argv[1:]
    x = a[0]
    face = a[1] if len(a) > 1 else "1"
    ph = a[2] if len(a) > 2 else "-1"
    swim = int(a[3]) if len(a) > 3 else 0
    name = "g_at_%s%s.js" % (x, "" if ph == "-1" else "_" + ph.replace(".", ""))
    with open(os.path.join(shots(), name), "w", encoding="utf-8", newline="\n") as f:
        f.write(T % {"x": x, "face": face, "ph": ph, "swim": swim})
    print(name)


main()
