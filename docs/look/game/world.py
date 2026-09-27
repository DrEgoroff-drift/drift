#!/usr/bin/env python3
"""Writes a scene snippet that lands on another world and stands the man at its lake or at a place.

    python docs/look/game/world.py <type> <n> [where] [phase] [swim]
      type   terran | jungle | ocean | toxic | ruin | rocky | desert | ice | ...
      n      0 = the planet's own seed, 1.. = other terrains
      where  lake (default: 40 units left of the lake), mid (the lake's middle), right, pad,
             or a number (world x, the game's units)
      phase  hour of the day, 0..1 (default .30)
      swim   1 = the ring inflated
Prints the file's name in the folder of frames: g_w_<type>_<n>_<where>.js
"""
import os
import sys

from where import shots

T = """(function(){
  var t="%(type)s",n=%(n)d,where="%(where)s",ph=%(ph)s,swim=%(swim)d;
  var p=G.sys.planets.find(function(x){return x.type!=="gas";})||G.sys.planets[0];
  if(n)p.seed=(p.seed+n*7919)>>>0;
  p.type=t;p.T=TYPES[t]||p.T;p.mix=null;p.mw=null;
  p.rough=Math.min(1.2,p.T.rough);p.res=worldRes(t,null,null);
  delete p.tex;delete p.mat;delete p.strata;delete p.geo;delete p.bio;
  delete p.biome;delete p.flora;delete p.fauna2;delete p.fauna3;delete p.caveFlora;
  var tr=genTerrain(p);
  G.land={p:p,tr:tr,x:tr.padX,y:groundAt(tr,tr.padX)};
  enterSurface();
  G.mode="surface";
  var S=G.surf,Wt=waterOf(S.tr,S.p);
  S.p.wx={kind:null};
  window.__EXTRA={type:S.p.type,name:S.p.name,wet:+(tr.wet||0).toFixed(2),lake:Wt?{x0:Math.round(Wt.x0),x1:Math.round(Wt.x1),acid:!!Wt.acid}:null};
  var x=tr.padX+120;
  if(where==="lake"&&Wt)x=Wt.x0-40;
  else if(where==="mid"&&Wt)x=(Wt.x0+Wt.x1)/2;
  else if(where==="right"&&Wt)x=Wt.x1+40;
  else if(!isNaN(+where))x=+where;
  S.x=x;S.y=groundAt(S.tr,S.x)-10;S.on=true;S.cam=null;S.camLook=0;S.face=1;
  if(swim)S.swim=1;
  var period=CEL_DAY*(6+((p.seed>>>7)&3));G.t=period*((ph-(p.seed%%100)/100+1)%%1);
})();
PLN.on=true;PLN.rush=true;
"""


def main():
    a = sys.argv[1:]
    typ, n = a[0], int(a[1])
    where = a[2] if len(a) > 2 else "lake"
    ph = a[3] if len(a) > 3 else ".30"
    swim = int(a[4]) if len(a) > 4 else 0
    name = "g_w_%s_%d_%s.js" % (typ, n, where)
    with open(os.path.join(shots(), name), "w", encoding="utf-8", newline="\n") as f:
        f.write(T % {"type": typ, "n": n, "where": where, "ph": ph, "swim": swim})
    print(name)


main()
