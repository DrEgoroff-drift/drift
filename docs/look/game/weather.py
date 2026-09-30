#!/usr/bin/env python3
"""weather.py <x> <phase> <kind> <power> - the test planet at x and the hour under a fixed weather:
kind = rain | snow | acid | fog | dust | ash | spore, power 0..1. Writes g_wx_<kind>_<power>_<phase>.js."""
import os
import sys

from where import shots

L = shots()
T = """G.surf.p.wx={kind:null};
(function(){
  var S=G.surf,p=S.p,ph=%(ph)s;
  S.x=%(x)s;S.y=groundAt(S.tr,S.x)-10;S.on=true;S.cam=null;S.camLook=0;S.face=1;
  if(ph>=0){var period=CEL_DAY*(6+((p.seed>>>7)&3));G.t=period*((ph-(p.seed%%100)/100+1)%%1);}
  p.wx={kind:"%(kind)s",per:1e9,ph:Math.PI/2,lo:%(pw)s,hi:%(pw)s,cap:1};
  window.__EXTRA={ph:+celSun(p).ph.toFixed(3),wx:p.wx.kind,wp:+weatherPower(p).toFixed(2)};
})();
PLN.on=true;PLN.rush=true;
"""


def main():
    a = sys.argv[1:]
    x, ph, kind, pw = a[0], a[1], a[2], a[3]
    name = "g_wx_%s_%s_%s.js" % (kind, pw.replace(".", ""), ph.replace(".", ""))
    with open(os.path.join(L, name), "w", encoding="utf-8", newline="\n") as f:
        f.write(T % {"x": x, "ph": ph, "kind": kind, "pw": pw})
    print(name)


main()
