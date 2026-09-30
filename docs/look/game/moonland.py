#!/usr/bin/env python3
"""moonland.py [phase] [which] - writes g_moon_<phase>.js: lands on a moon of the first gas giant
that has one (which = index of the giant's moon, default 0) and stands the man right of the pad."""
import os
import sys

from where import shots

L = shots()
T = """(function(){
  var ph=%(ph)s,which=%(which)d;
  var par=G.sys.planets.find(function(x){return x.type==="gas"&&x.moons.length>which;});
  if(!par){window.__EXTRA={err:"no gas giant with a moon"};return;}
  var p=par.moons[which];
  var tr=genTerrain(p);
  G.land={p:p,tr:tr,x:tr.padX,y:groundAt(tr,tr.padX)};
  enterSurface();
  G.mode="surface";
  var S=G.surf;S.p.wx={kind:null};
  S.x=tr.padX+120;S.y=groundAt(S.tr,S.x)-10;S.on=true;S.cam=null;S.camLook=0;S.face=1;
  var period=CEL_DAY*(6+((p.seed>>>7)&3));G.t=period*((ph-(p.seed%%100)/100+1)%%1);
  window.__EXTRA={type:p.type,name:p.name,parent:par.type,parentIdx:p.parentIdx,ph:ph};
})();
PLN.on=true;PLN.rush=true;
"""


def main():
    ph = sys.argv[1] if len(sys.argv) > 1 else ".75"
    which = int(sys.argv[2]) if len(sys.argv) > 2 else 0
    name = "g_moon_%s.js" % ph.replace(".", "")
    with open(os.path.join(L, name), "w", encoding="utf-8", newline="\n") as f:
        f.write(T % {"ph": ph, "which": which})
    print(name)


main()
