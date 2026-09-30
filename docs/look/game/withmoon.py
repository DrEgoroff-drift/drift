#!/usr/bin/env python3
"""withmoon.py <x> <phase> [moonphase] [which] - the test planet at x and the hour, with a moon borrowed
from the gas giant (which = 0..2, default 2 = the rocky one); moonphase sets the moon's phase (0 new,
.5 full) or -1 to keep it. Writes g_wm_<x>_<phase>[_<moonphase>].js."""
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
  var mp=%(mp)s;if(mp>=0){var P=celMoonPeriod(m);m.ang=(((mp-celDayF(G.t)/P)%%1)+1)%%1*TAU;}
  window.__EXTRA={ph:+celSun(p).ph.toFixed(3),dark:+celDark().toFixed(2),moon:m.type,moonph:+celMoonPhase(m,G.t).toFixed(2)};
})();
PLN.on=true;PLN.rush=true;
"""


def main():
    a = sys.argv[1:]
    x, ph = a[0], a[1]
    mp = a[2] if len(a) > 2 else "-1"
    which = int(a[3]) if len(a) > 3 else 2
    name = "g_wm_%s_%s%s.js" % (x, ph.replace(".", ""), "" if mp == "-1" else "_" + mp.replace(".", ""))
    with open(os.path.join(L, name), "w", encoding="utf-8", newline="\n") as f:
        f.write(T % {"x": x, "ph": ph, "mp": mp, "which": which})
    print(name)


main()
