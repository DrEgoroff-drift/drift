# -*- coding: utf-8 -*-
# Writes a snippet that lines up the game's plant forms along the walk line of the test planet,
# one species per form, so the twelve bodies of 21pia can be looked at side by side (M622).
#   python docs/look/game/herb.py "<name>:k=v;k=v" ...
# keys: forms (a-b or a,b,c; default 0-11), ages (digits of 0 young, 1 adult, 2 old; default 1 —
# every form in every listed age, side by side), gap (metres between plants, default 5.5),
# x (the game's units along the line where the row is centred; default the man's place),
# near (0…1 the near lens, default 0), hour (.NN, default .125; -1 keeps the scene's),
# seed (the species' dice, default 0), wet (0…1 the species' taste for water, default .5),
# walk (metres the man walks along the line first, default 0: 25 puts the row on the open pad lane).
# The game's own plants are replaced for the frame; the species are the test planet's by its
# genome (speciesPlant), so colours are the world's. Shoot with gshot.py js=g_herb_<name>.js.
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from where import shots  # noqa: E402

TPL = u"""(function(){
  var S=G.surf,p=S.p,ph=%(hour)s,forms=%(forms)s,ages=%(ages)s,gap=%(gap)s*PLN_M;
  S.x+=%(walk)s*PLN_M;
  var x0=%(x)s,bi=planetBiome(p),r=rng((p.seed^0x5EED1)+%(seed)s*7919),list=[],specs=[],n=forms.length*ages.length,i=0;
  if(x0==null)x0=S.x;
  x0-=(n-1)*gap/2;
  for(var f=0;f<forms.length;f++){
    var sp=speciesPlant(r,p,bi,forms[f]);
    sp.wet=%(wet)s;specs.push(sp);
    for(var a=0;a<ages.length;a++){
      var x=x0+(i++)*gap,gy=groundAt(S.tr,x),q=null;
      for(var t=0;t<80;t++){
        q=specimenPlant(r,sp,p,x,gy,{wet:sp.wet,hollow:.5});
        var b=q.age<.3?0:(q.age>.82?2:1);
        if(b===ages[a])break;
      }
      q.z=.5;
      list.push(q);
    }
  }
  /* the row's species become the planet's: 21pia keys its bodies by floraOf(p) */
  p.flora=specs;S.plants=list;S.on=true;S.cam=null;S.camLook=0;S.face=1;
  PLN.near=%(near)s;
  if(ph>=0){var period=CEL_DAY*(6+((p.seed>>>7)&3));G.t=period*((ph-(p.seed%%100)/100+1)%%1);}
  window.__EXTRA={n:list.length,names:list.map(function(q){return q.name+" "+Math.round(q.h/PLN_M*10)/10+"m";})};
})();
PLN.on=true;PLN.rush=true;
"""


def span(s):
    out = []
    for part in s.split(","):
        part = part.strip()
        if "-" in part:
            a, b = part.split("-")
            out.extend(range(int(a), int(b) + 1))
        elif part:
            out.append(int(part))
    return out


def main():
    for spec in sys.argv[1:]:
        name, _, rest = spec.partition(":")
        o = {"forms": "0-11", "ages": "1", "gap": "5.5", "x": "null", "near": "0", "hour": ".125", "seed": "0", "wet": ".5", "walk": "0"}
        for kv in filter(None, rest.split(";")):
            k, _, v = kv.partition("=")
            o[k.strip()] = v.strip()
        o["forms"] = "[" + ",".join(str(k) for k in span(o["forms"])) + "]"
        o["ages"] = "[" + ",".join(c for c in o["ages"] if c in "012") + "]"
        out = os.path.join(shots(), "g_herb_" + name + ".js")
        with open(out, "w", encoding="utf-8", newline="\n") as f:
            f.write(TPL % o)
        print(os.path.basename(out))


if __name__ == "__main__":
    main()
