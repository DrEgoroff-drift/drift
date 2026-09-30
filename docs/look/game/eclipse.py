#!/usr/bin/env python3
"""eclipse.py <x> <phase> <eph> [which] - the test planet at x and the hour, with a moon borrowed from
the gas giant (which = 0..2, default 2 = the rocky one) set so that the eclipse runs at eph (-1 start,
0 middle, 1 end; 3 = no eclipse, a thin crescent). Writes g_ec_<x>_<phase>_<eph>.js."""
import os
import sys

from where import shots

L = shots()
T = """G.surf.p.wx={kind:null};
(function(){
  var S=G.surf,p=S.p,ph=%(ph)s;
  S.x=%(x)s;S.y=groundAt(S.tr,S.x)-10;S.on=true;S.cam=null;S.camLook=0;S.face=1;
  if(ph>=0){var period=CEL_DAY*(6+((p.seed>>>7)&3));G.t=period*((ph-(p.seed%%100)/100+1)%%1);}
  var g=G.sys.planets.find(function(x){return x.type==="gas"&&x.moons.length;});
  var m=g.moons[%(which)d];p.moons=[m];
  var P=celMoonPeriod(m),mp=(%(eph)s)*.16/P;m.ang=(((mp-celDayF(G.t)/P)%%1)+1)%%1*TAU;
  var e=celEclipse(p,G.t);
  window.__EXTRA={ph:+celSun(p).ph.toFixed(3),dark:+celDark().toFixed(2),eph:e?+e.ph.toFixed(2):null,full:e?e.full:null,moonph:+celMoonPhase(m,G.t).toFixed(3)};
})();
PLN.on=true;PLN.rush=true;
"""


def main():
    a = sys.argv[1:]
    x, ph, eph = a[0], a[1], a[2]
    which = int(a[3]) if len(a) > 3 else 2
    name = "g_ec_%s_%s_%s.js" % (x, ph.replace(".", ""), eph.replace(".", "").replace("-", "m"))
    with open(os.path.join(L, name), "w", encoding="utf-8", newline="\n") as f:
        f.write(T % {"x": x, "ph": ph, "eph": eph, "which": which})
    print(name)


main()
