# -*- coding: utf-8 -*-
# Writes a snippet that holds the landing mode still at a given height, so the descent frame of
# the planet (21pza) can be looked at (M621).
#   python docs/look/game/descent.py "<name>:k=v;k=v" ...
# keys: alt (metres above the touch point, default 40), dx (metres from the pad, default -12),
# a (the lander's tilt, radians, default 0), gear (0…1, default 0), thr (0/1, default 1),
# touched (0/1: squatted on its gear, over>0), flow (frames: after that many frames the snippet
# calls enterSurface() itself, as the game does at the end of the touchdown count; window.__FLOW
# turns "ok" fn surface frames later (default 6) — shoot with until=window.__FLOW and the frame is the
# surface's, with the land moved and the band replanted), hour (.NN, default .30),
# t (world type, default terran), n (world number, default 1).
# The landing update is stubbed: nothing moves between the snippet and the frame, only the readout (21pza)
# is written. Shoot the result
# with gshot.py js=g_desc_<name>.js.
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from where import shots  # noqa: E402

TPL = u"""(function(){
  var t="%(t)s",n=%(n)s,ph=%(hour)s,fl=%(flow)s;
  var p=G.sys.planets.find(function(x){return x.type!=="gas";})||G.sys.planets[0];
  if(n)p.seed=(p.seed+n*7919)>>>0;
  p.type=t;p.T=TYPES[t]||p.T;p.mix=null;p.mw=null;
  p.rough=Math.min(1.2,p.T.rough);p.res=worldRes(t,null,null);
  delete p.tex;delete p.mat;delete p.strata;delete p.geo;delete p.bio;
  delete p.biome;delete p.flora;delete p.fauna2;delete p.fauna3;delete p.caveFlora;
  startLanding(p);
  var L=G.land,tr=L.tr;
  L.x=tr.padX+%(dx)s*PLN_M;L.y=groundAt(tr,L.x)-11-%(alt)s*PLN_M;
  L.a=%(a)s;L.gear=%(gear)s;L.sq=0;L.vx=0;L.vy=0;L.auto=false;L.thrOn=%(thr)s;
  if(%(touched)s){L.y=groundAt(tr,L.x)-11;L.over=70;L.ok=true;L.gear=1;L.sq=.4;L.hot=1;L.thrOn=false;}
  updateLanding=function(){if(PLN.on&&typeof plnLandRead==="function"&&!(L.over>0))G.prompt=plnLandRead(L);};
  G.mode="landing";G.prompt=(PLN.on&&typeof plnLandRead==="function")?plnLandRead(L):"";
  window.__FLOW="";window.__FLOWN=0;
  if(fl){
    var nL=0,uS=updateSurface;
    updateLanding=function(){
      if(++nL!==fl)return;
      window.__L0=PLN_LAND.cur;
      try{enterSurface();G.mode="surface";window.__FLOW="switched";}
      catch(e){window.__FLOW="ERR "+String((e&&e.stack)||e).slice(0,300);}
    };
    updateSurface=function(dt){uS(dt);if(window.__FLOW==="switched"&&++window.__FLOWN>=%(fn)s)window.__FLOW="ok";};
  }
  window.__EXTRA={type:p.type,name:p.name,alt:%(alt)s,x:Math.round(L.x)};
  var period=CEL_DAY*(6+((p.seed>>>7)&3));G.t=period*((ph-(p.seed%%100)/100+1)%%1);
})();
PLN.on=true;PLN.rush=true;
"""


def main():
    for spec in sys.argv[1:]:
        name, _, rest = spec.partition(":")
        o = {"alt": "40", "dx": "-12", "a": "0", "gear": "0", "thr": "true", "touched": "0", "flow": "0",
             "hour": ".30", "t": "terran", "n": "1", "fn": "6"}
        for kv in filter(None, rest.split(";")):
            k, _, v = kv.partition("=")
            o[k.strip()] = v.strip()
        o["thr"] = "true" if o["thr"] in ("1", "true") else "false"
        out = os.path.join(shots(), "g_desc_" + name + ".js")
        with open(out, "w", encoding="utf-8", newline="\n") as f:
            f.write(TPL % o)
        print(os.path.basename(out))


if __name__ == "__main__":
    main()
