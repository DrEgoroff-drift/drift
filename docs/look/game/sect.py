"""Writes a snippet that builds a test base on the test planet and enters its section (M632a).

    python docs/look/game/sect.py <name> [key=value ...]
      far=0|1     holds the far (1) or the near (0) lens; omitted — the lens runs by itself
      cur= row=   where the man stands (cur -1 is the lift); he is put there settled
      sit=0|1     holds the sitting pose (in a room with a seat)
      night=1     the hour up top is night (the sky and the day light go dark)
      power=0     no reactor: the base has no power, rooms are lit by nothing but the man's lamp
      menu=1      the build menu is open
      deep=1      the fifth row is open
      room=<kind> that kind of room at column 1, row 1 (the contact sheet of sectsheet.py stands the man there)
Lands next to the shots as g_sect_<name>.js; shoot it with gshot.py js=g_sect_<name>.js eval=eval-sect.js
"""
import json
import os
import sys

from where import shots

T = """(function(){
  var o=%(o)s,p=(G.surf&&G.surf.p)||G.sys.planets.find(function(x){return x.type!=="gas";});
  var R=o.deep?BASE_ROWS_DEEP:BASE_ROWS,cells=[];for(var i=0;i<BASE_COLS*R;i++)cells.push(null);
  function put(c,r,k,hp){if(r<R)cells[r*BASE_COLS+c]={k:k,hp:hp==null?1:hp};}
  put(0,0,"solar");put(1,0,"habitat");put(2,0,o.power===0?"storage":"reactor");put(3,0,"storage");put(4,0,"solar");
  put(0,1,"lab");put(1,1,"drill");put(2,1,"refinery");put(4,1,"med");
  put(1,2,"battery");put(2,2,"garden",0);put(3,2,"cryo");
  put(2,3,"shop");put(3,3,"habitat");
  if(o.deep)put(1,4,"vat");
  if(o.room)put(1,1,o.room);
  G.bases[baseKey(G.sx,G.sy,p.idx)]={sx:G.sx,sy:G.sy,idx:p.idx,name:"Проба",type:p.type,res:p.res.slice(0,3),cells:cells,pool:{},tMs:now(),built:now(),rows:R};
  if(o.night&&PLN.sun)PLN.sun=Object.assign({},PLN.sun,{night:1,look:Object.assign({},PLN.sun.look||{},{skyHor:[.012,.018,.03],skyZen:[.003,.005,.012]})});
  enterBase(p);
  var S=G.base;
  if(o.cur!=null){S.cur=o.cur;S.x=cellX(o.cur);}
  if(o.row!=null){S.row=o.row;S.y=cellY(o.row);}
  if(o.menu)S.menu=true;
  if(o.far!=null)SECT.farPin=o.far;
  if(o.sit!=null)SECT.sitPin=o.sit;
  window.__EXTRA={o:o};
})();
"""


def main():
    a = sys.argv[1:]
    name = a[0]
    o = {}
    for kv in a[1:]:
        k, v = kv.split("=", 1)
        o[k] = json.loads(v)
    fn = "g_sect_%s.js" % name
    with open(os.path.join(shots(), fn), "w", encoding="utf-8", newline="\n") as f:
        f.write(T % {"o": json.dumps(o)})
    print(fn)


main()
