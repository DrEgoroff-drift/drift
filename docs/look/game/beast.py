#!/usr/bin/env python3
"""Writes a scene snippet with the catalogue of one beast archetype on the test planet: a species
of that archetype is grown from the planet's own generator, and eleven slots stand in a row at the
walk line — the six frames of the walk, the stand, the graze, the hostile pose, the stunned one —
the man in the middle slot. The lens is the near one unless the beast is big.

    python docs/look/game/beast.py <archetype> [phase] [young]
      archetype  capsule long stout upright segmented  jelly strider crystal manta shell
                 (an earthly one may take a suffix: capsule.hop, capsule.2 — hopping, two legs)
      phase      hour of the day, 0..1 (.3 day, .85 night); -1 keeps the hour of the scene
      young      1 = the young of the species (no tail, no crest, a big head)
Prints the file's name in the folder of frames: g_beast_<archetype>[_<phase>].js
The question for the page that fits it: eval-beasts.js
"""
import os
import sys

from where import shots

EARTH = ["capsule", "long", "stout", "upright", "segmented"]
ALIEN = ["jelly", "strider", "crystal", "manta", "shell"]

T = """G.surf.p.wx={kind:null};
(function(){
  var S=G.surf,p=S.p,ph=%(ph)s,want=%(want)s,bi=planetBiome(p),fb=beastBias(p),sp=null;
  for(var g=0;g<400&&!sp;g++){
    var r=rng((p.seed^0x8FA17)+g*7919),q=speciesBeast(r,p,bi,fb);
    if(want.alien?q.alien===want.alien:(!q.alien&&q.shape===want.shape&&(want.hop==null||!!q.hop===want.hop)&&(want.legs==null||q.legs===want.legs)))sp=q;
  }
  if(!sp){window.__EXTRA={fail:"no species of "+JSON.stringify(want)};return;}
  S.x=3300;S.y=groundAt(S.tr,S.x)-10;S.on=true;S.cam=null;S.camLook=0;S.face=1;
  if(ph>=0){var period=CEL_DAY*(6+((p.seed>>>7)&3));G.t=period*((ph-(p.seed%%100)/100+1)%%1);}
  var Rm=sp.r0/PLN_M,gap=Math.max(1.9,3.4*Rm)*PLN_M,list=[];
  for(var i=0;i<11;i++){
    if(i===5)continue;
    var pose=i<5?i:i-1,b=specimenBeast(rng(777+i),sp,S.x+(i-5)*gap,0);
    b.age=%(young)s?.1:.5;b.r=sp.r0*(%(young)s?.6:1);b.tail=sp.tail&&!%(young)s;b.crest=sp.crest&&!%(young)s;
    b.headSize=sp.headSize*(%(young)s?1.28:1);b.hover=sp.hover?sp.hover*(%(young)s?.8:1):0;
    b.y=groundAt(S.tr,b.x);b.vx=pose<6?.1:0;b.face=1;b.phase=0;b.shy=0;b.pose=pose;b.scanned=false;
    list.push(b);
  }
  S.fauna=list;
  window.__EXTRA={sp:sp.name,alien:sp.alien,shape:sp.shape,legs:sp.legs,hop:sp.hop,r0:+sp.r0.toFixed(1),gapM:+(gap/PLN_M).toFixed(2)};
  PLN.glide=(11*gap/PLN_M<36)?1:0;
})();
PLN.on=true;PLN.rush=true;
"""


def main():
    a = sys.argv[1:]
    arch = a[0]
    ph = a[1] if len(a) > 1 else "-1"
    young = int(a[2]) if len(a) > 2 else 0
    base, _, suf = arch.partition(".")
    if base in ALIEN:
        want = '{alien:"%s"}' % base
    elif base in EARTH:
        want = "{shape:%d" % EARTH.index(base)
        if suf == "hop":
            want += ",hop:true"
        elif suf.isdigit():
            want += ",legs:%s" % suf
        want += "}"
    else:
        raise SystemExit("unknown archetype " + arch)
    name = "g_beast_%s%s%s.js" % (arch.replace(".", "_"), "" if ph == "-1" else "_" + ph.replace(".", ""), "_young" if young else "")
    with open(os.path.join(shots(), name), "w", encoding="utf-8", newline="\n") as f:
        f.write(T % {"ph": ph, "want": want, "young": young})
    print(name)


main()
