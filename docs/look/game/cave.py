#!/usr/bin/env python3
"""Writes a scene snippet that lands on a world, goes down into its cave and stands the man in it (M630a).

    python docs/look/game/cave.py <type> <n> [x] [phase] [face]
      type   terran | volcanic | rocky | desert | ice | ...  (the rock of the cave follows it, 22da)
      n      0 = the planet's own seed, 1.. = other caves
      x      metres from the mouth along the upper gallery (default 9: just past the mouth)
      phase  hour of the day up top, 0..1 (default .30)
      face   1 / -1 (default 1)
Prints the file's name in the folder of frames: g_cave_<type>_<n>_<x>.js
The entry zoom and the follow are eased; the stand draws two frames after a snippet, so the
snippet sets them settled and CAVE3.rush builds every chunk in sight on every frame.
"""
import os
import sys

from where import shots

T = """(function(){
  var t="%(type)s",n=%(n)d,xm=%(x)s,ph=%(ph)s,face=%(face)d;
  var p=G.sys.planets.find(function(x){return x.type!=="gas";})||G.sys.planets[0];
  if(n)p.seed=(p.seed+n*7919)>>>0;
  p.type=t;p.T=TYPES[t]||p.T;p.mix=null;p.mw=null;
  p.rough=Math.min(1.2,p.T.rough);p.res=worldRes(t,null,null);
  delete p.tex;delete p.mat;delete p.strata;delete p.geo;delete p.bio;
  delete p.biome;delete p.flora;delete p.fauna2;delete p.fauna3;delete p.caveFlora;
  var tr=genTerrain(p);
  G.land={p:p,tr:tr,x:tr.padX,y:groundAt(tr,tr.padX)};
  enterSurface();
  var S=G.surf;S.p.wx={kind:null};
  var period=CEL_DAY*(6+((p.seed>>>7)&3));G.t=period*((ph-(p.seed%%100)/100+1)%%1);
  enterCave();
  var C=G.cave,F=cave3Field(C),x=(F.mouthX+xm)*CAVE_PPM;
  C.x=x;C.y=caveFloor(C,x);C.cy=C.y;C.on=true;C.vy=0;C.face=face;C.walkTarget=null;
  /* поверхность сверху — её час: один кадр поверхности в часах дня (PLN.sun) */
  var c=celSun(p);PLN.sun={night:clamp(-Math.sin(c.ph*TAU)*3,0,1),dir:[-Math.cos(c.ph*TAU),Math.sin(c.ph*TAU),0],look:null};
  CAVE3.c=C;CAVE3.cx=x/CAVE_PPM;CAVE3.zoom=0;CAVE3.t=wallMs();CAVE3.wt=null;CAVE3.rush=true;
  window.__EXTRA={type:p.type,kind:cave3StyKind(p.type),mouthX:+F.mouthX.toFixed(2),x:Math.round(x)};
})();
PLN.on=true;
"""


def main():
    a = sys.argv[1:]
    typ, n = a[0], int(a[1])
    x = a[2] if len(a) > 2 else "9"
    ph = a[3] if len(a) > 3 else ".30"
    face = int(a[4]) if len(a) > 4 else 1
    name = "g_cave_%s_%d_%s.js" % (typ, n, x.replace(".", "").replace("-", "m"))
    with open(os.path.join(shots(), name), "w", encoding="utf-8") as f:
        f.write(T % {"type": typ, "n": n, "x": x, "ph": ph, "face": face})
    print(name)


if __name__ == "__main__":
    main()
