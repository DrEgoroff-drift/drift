#!/usr/bin/env python3
"""Writes a scene snippet that lands on a world holding a landmark of a kind and stands the man at it.

    python docs/look/game/mark.py <kind> [type] [phase] [off] [near]
      kind   wreck temple elevator crystals ring anomaly monolith factory portal observ obelisk battery
      type   world type (default: the first the kind is allowed on, POI_KINDS.on)
      phase  hour of the day, 0..1 (default .30)
      off    the man's offset from the landmark, metres along the walk line (default 0)
      near   1 = the near lens is preset (default), 0 = the far lens of the move
    key=value options after them (M627b, the landmark's state machine of 21pif):
      st=<n> way=<id> n=<json>   the memo written before the acts (state, branch, counters)
      act=<id>[,<id>...]         spots acted on after the landing through plnActDo, in order
      t=<sec>                    the body is caught t seconds after the last act (PLN_ACT.pinAge)
      at=<id>                    the man stands at that spot, `off` m aside from it
Terrains are tried (seed + n*7919) until one holds the kind; the first found is taken.
Prints the file's name in the folder of frames: g_mark_<kind>_<type>[_<phase>][_<acts>].js
"""
import json
import os
import sys

from where import shots

T = """(function(){
  var kind="%(kind)s",want="%(type)s",ph=%(ph)s,off=%(off)s,near=%(near)d;
  var K=POI_KINDS.find(function(k){return k.k===kind;});
  var t=want||K.on[0];
  var p=G.sys.planets.find(function(x){return x.type!=="gas";})||G.sys.planets[0];
  var seed0=p.seed,tr=null,q=null,n=0;
  for(n=0;n<40&&!q;n++){
    p.seed=(seed0+n*7919)>>>0;
    p.type=t;p.T=TYPES[t]||p.T;p.mix=null;p.mw=null;
    p.rough=Math.min(1.2,p.T.rough);p.res=worldRes(t,null,null);
    delete p.tex;delete p.mat;delete p.strata;delete p.geo;delete p.bio;
    delete p.biome;delete p.flora;delete p.fauna2;delete p.fauna3;delete p.caveFlora;
    tr=genTerrain(p);genPOI(tr,p);
    q=(tr.poi||[]).find(function(x){return x.k===kind;})||null;
  }
  G.land={p:p,tr:tr,x:tr.padX,y:groundAt(tr,tr.padX)};
  enterSurface();
  G.mode="surface";
  var S=G.surf;
  S.p.wx={kind:null};
  var x=q?q.x+off*PLN_M:tr.padX+120;
  S.x=x;S.y=groundAt(S.tr,S.x)-10;S.on=true;S.cam=null;S.camLook=0;S.face=1;
  var period=CEL_DAY*(6+((p.seed>>>7)&3));G.t=period*((ph-(p.seed%%100)/100+1)%%1);
  PLN.glide=near;
  if(q&&typeof plnActMemo==="function"){
    var ST=%(st)s,WAY=%(way)s,N=%(n)s,ACTS=%(acts)s,TT=%(t)s,AT=%(at)s;
    if(ST!=null||WAY!=null||N){var m=plnActMemo(q,true);
      if(ST!=null)m.st=ST;if(WAY!=null)m.way=WAY;if(N)for(var k in N)m.n[k]=N[k];
      if(PLN_ACT.kinds[q.k])m.got=PLN_ACT.kinds[q.k].got(m);}
    for(var i=0;i<ACTS.length;i++){var R=plnActDo(q,ACTS[i],{});(window.__ACTS=window.__ACTS||[]).push(ACTS[i]+":"+(R?(R.msg||"ok"):"нет"));}
    PLN_ACT.pinAge=TT;
    if(AT){S.x=q.x+(plnActSpotDx(q.k,AT,plnMarkH(q))+off)*PLN_M;S.y=groundAt(S.tr,S.x)-10;}
  }
  window.__EXTRA={type:t,tries:n,poi:q?{k:q.k,x:Math.round(q.x),h:Math.round(q.h),sc:+(q.sc||1).toFixed(2)}:null,
    all:(tr.poi||[]).map(function(z){return z.k+"@"+Math.round(z.x);})};
})();
PLN.on=true;PLN.rush=true;
"""


def main():
    kv = dict(x.split("=", 1) for x in sys.argv[1:] if "=" in x)
    a = [x for x in sys.argv[1:] if "=" not in x]
    kind = a[0]
    typ = a[1] if len(a) > 1 and a[1] != "-" else ""
    ph = a[2] if len(a) > 2 else ".30"
    off = a[3] if len(a) > 3 else "0"
    near = int(a[4]) if len(a) > 4 else 1
    acts = [x for x in kv.get("act", "").split(",") if x]
    tag = "".join("_" + x for x in acts) + ("_st" + kv["st"] if "st" in kv else "") + \
        ("_" + kv["way"] if "way" in kv else "") + ("_t" + kv["t"].replace(".", "") if "t" in kv else "") + ("_at" + kv["at"] if "at" in kv else "")
    name = "g_mark_%s_%s%s%s.js" % (kind, typ or "any", "" if ph == ".30" else "_" + ph.replace(".", ""), tag)
    q = lambda v: json.dumps(v, ensure_ascii=False)
    with open(os.path.join(shots(), name), "w", encoding="utf-8", newline="\n") as f:
        f.write(T % {"kind": kind, "type": typ, "ph": ph, "off": off, "near": near,
                     "st": kv.get("st", "null"), "way": q(kv["way"]) if "way" in kv else "null",
                     "n": kv.get("n", "null"), "acts": q(acts), "t": kv.get("t", "null"),
                     "at": q(kv["at"]) if "at" in kv else "null"})
    print(name)


main()
