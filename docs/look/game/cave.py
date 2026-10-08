#!/usr/bin/env python3
"""Writes a scene snippet that lands on a world, goes down into its cave and stands the man in it (M630a).

    python docs/look/game/cave.py <type> <n> [x] [phase] [face]
      type   terran | volcanic | rocky | desert | ice | ...  (the rock of the cave follows it, 22da)
      n      0 = the planet's own seed, 1.. = other caves
      x      metres from the mouth along the upper gallery (default 9: just past the mouth),
             or zone:<kind>[:<frac>] — the first hall of that kind (gallery dripstone crystal water vein),
             at frac of its length (default .5); arch — beside the far lane's arch (22de);
             amber — beside the first amber the game laid; gap[:i] — 3.5 m before the i-th light event in a gap
      phase  hour of the day up top, 0..1 (default .30)
      face   1 / -1 (default 1)
      near=0|1  holds the lens: 0 the broad (the gate), 1 the near lens of a thing (default: as the play asks)
      far=0|1   holds the far lens (100 m, the map key); default: as the play asks
Prints the file's name in the folder of frames: g_cave_<type>_<n>_<x>.js
The entry zoom and the follow are eased; the stand draws two frames after a snippet, so the
snippet sets them settled and CAVE3.rush builds every chunk in sight on every frame.
"""
import os
import sys

from where import shots

T = """(function(){
  var t="%(type)s",n=%(n)d,xs="%(xs)s",xm=%(x)s,zk=%(zk)s,zf=%(zf)s,ph=%(ph)s,face=%(face)d;
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
  var Zs=caveZones(C),Zk=zk?Zs.find(function(z){return z.kind===zk;}):null;
  if(Zk)x=Zk.x0+(Zk.x1-Zk.x0)*zf;
  var yy=null;
  if(xs==="arch"&&F.far)x=(F.far.ax-3.5*F.far.s)*CAVE_PPM;
  cave3Events(C,F);
  if(xs.indexOf("gap")===0&&C.ev3.gaps.length){var gi=Math.min(+(xs.split(":")[1]||0),C.ev3.gaps.length-1);x=(C.ev3.gaps[gi]-3.5)*CAVE_PPM;}
  /* в этой системе залежи янтаря может не быть: стенд кладёт одну каплю туда, куда её кладёт игра — в конец ответвления */
  if(xs==="amber"&&!caveProps(C).some(function(q){return q.k==="amber";})){var be=C.branchEnds[0];caveProps(C).push({k:"amber",x:be.x,y:caveScanDown(C,be.x,be.y-30),u:6,res:"amber",seed:4242});}
  if(xs==="amber"){var am=caveProps(C).filter(function(q){return q.k==="amber";})[0];if(am){x=am.x-4.2*CAVE_PPM*face;yy=caveScanDown(C,x,am.y-30);}}
  C.x=x;C.y=yy==null?caveFloor(C,x):yy;C.cy=C.y;C.on=true;C.vy=0;C.face=face;C.walkTarget=null;
  /* поверхность сверху — её час: один кадр поверхности в часах дня (PLN.sun) */
  var c=celSun(p);PLN.sun={night:clamp(-Math.sin(c.ph*TAU)*3,0,1),dir:[-Math.cos(c.ph*TAU),Math.sin(c.ph*TAU),0],look:null};
  CAVE3.c=C;CAVE3.cx=x/CAVE_PPM;CAVE3.zoom=0;CAVE3.t=wallMs();CAVE3.wt=null;CAVE3.rush=true;CAVE3.nearPin=%(near)s;CAVE3.farPin=%(far)s;
  window.__EXTRA={type:p.type,kind:cave3StyKind(p.type),mouthX:+F.mouthX.toFixed(2),x:Math.round(x),zone:caveZoneAt(C,x).kind,zones:Zs.map(function(z){return z.kind+":"+z.x0+"-"+z.x1;}).join(" "),gaps:C.ev3.gaps.map(function(g){return Math.round(g);}).join(" ")};
})();
PLN.on=true;
"""


def main():
    kv = dict(x.split("=", 1) for x in sys.argv[1:] if "=" in x)
    a = [x for x in sys.argv[1:] if "=" not in x]
    near = kv.get("near", "null")
    far = kv.get("far", "null")
    typ, n = a[0], int(a[1])
    x = a[2] if len(a) > 2 else "9"
    xs = x
    if x in ("arch", "amber") or x.startswith("gap"):
        x = "9"
    zk, zf = "null", ".5"
    if x.startswith("zone:"):
        q = x.split(":")
        zk = '"%s"' % q[1]
        zf = q[2] if len(q) > 2 else ".5"
        x = "9"
    ph = a[3] if len(a) > 3 else ".30"
    face = int(a[4]) if len(a) > 4 else 1
    tag = a[2] if len(a) > 2 else x
    name = "g_cave_%s_%d_%s%s.js" % (typ, n, tag.replace(".", "").replace("-", "m").replace(":", "_"), ("" if near == "null" else "_n" + near) + ("" if far == "null" else "_f" + far))
    with open(os.path.join(shots(), name), "w", encoding="utf-8") as f:
        f.write(T % {"type": typ, "n": n, "x": x, "zk": zk, "zf": zf, "ph": ph, "face": face, "near": near, "far": far, "xs": xs})
    print(name)


if __name__ == "__main__":
    main()
