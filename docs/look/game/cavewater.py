"""The cave lake's gate (M631): the lens dives to the water when the man is within 3 m of its shore.

    python docs/look/game/cavewater.py [port=10300] [pfx=cwat] [shoot=0] [scene=terran:1:1,...]

Each scene is type:n:side — the cave of that world, the man put on the dry shore 1.5 m from the
water's edge (side -1 left of the lake, 1 right of it, facing it), the dive as the play settles it.
Shot twice: as it is and with PLN.noMirror (the mirror pass left empty). The page itself lists
where the water lies in the frame: the lake surface sampled every 25 cm, projected through the
lens, kept where the field says water and the HUD does not cover it. Then the gates:

  dive     the lens dived: CAVE3.dv = 1 and the lake under the man was found (lakeM)
  mirror   the share of the water samples where the frame differs from the empty-mirror frame
           by more than 6/255 in a channel (>= .50: crystals, the lamp cone, the threads)
  spread   p90 - p10 of HSV value over the water samples: no flat sheet (>= .08)
  rings    live drip rings in the frame: cells of 2.5 m whose hash lights a drop (the shader's own
           hash), whose drop falls on water and has visible water within a metre of it (3..5)

Prints one line per gate and ALL GREEN or FAILED N. Frames are 1920 x 1080.
"""
import json
import os
import re
import subprocess
import sys

from PIL import Image

import where

HERE = os.path.dirname(os.path.abspath(__file__))
SCENES = ["terran:1:1", "terran:1:-1", "terran:2:-1", "terran:2:1"]

CAM = r"""(function(){
  var C=G.cave,P=CAVE_PPM,Fd=cave3Field(C),s="no shore",D=1.5,side0=%(side)d,done=false;
  caveZones(C).forEach(function(z){
    if(done||!(z.Z&&z.Z.water))return;
    var k=cave3LakeGeo(C,Fd,z);
    if(!k||k.g0==null)return;
    for(var i=0;i<40;i++){
      var X=side0<0?k.g0-D-i*.25:k.g1+D+i*.25,f=caveScanDown(C,X*P,-(k.y+4)*P);
      if(f==null)continue;
      var fm=-f/P;
      if(fm>=k.y-.1&&fm<=k.y+3){
        C.x=X*P;C.y=f;C.cy=f;C.face=-side0;CAVE3.cx=X;CAVE3.c=C;done=true;
        CAVE3.lakeM={d:Math.hypot(D+i*.25,Math.max(0,fm-k.y)),x:clamp(X,k.g0+.5,k.g1-.5),y:k.y,g0:k.g0,g1:k.g1};
        s="lake "+k.g0.toFixed(1)+"-"+k.g1.toFixed(1)+"@"+k.y.toFixed(2)+" man "+X.toFixed(1)+"@"+fm.toFixed(2);break;
      }
    }
  });
  window.__EXTRA=window.__EXTRA||{};window.__EXTRA.gaps=s;
  /* где вода в кадре: гладь через 25 см, через объектив; кольца — хэшем шейдера (wHash) */
  function h(x,y,q){var v=(Math.imul(x,374761393)+Math.imul(y,668265263)+Math.imul(q,1274126177))>>>0;
    v^=v>>>16;v=Math.imul(v,0x7feb352d)>>>0;v^=v>>>15;v=Math.imul(v,0x846ca68b)>>>0;v^=v>>>16;return (v>>>8)/16777216;}
  function scr(L,x,y,z){var m=L.vp,cx=m[0]*x+m[4]*y+m[8]*z+m[12],cy=m[1]*x+m[5]*y+m[9]*z+m[13],w=m[3]*x+m[7]*y+m[11]*z+m[15];
    return [(cx/w*.5+.5)*innerWidth,(.5-cy/w*.5)*innerHeight];}
  /* закрыта ли точка камнем: луч от объектива через поле, от разреза (z = 0) до неё */
  function hid(L,x,y,z){var e=L.eye,n=Math.ceil(z/.2);
    for(var s=0;s<n;s++){var zz=s*.2,t=(zz-e[2])/(z-e[2]);if(cave3Den(Fd,e[0]+(x-e[0])*t,e[1]+(y-e[1])*t+.05,zz)>0)return true;}
    return false;}
  function hud(p){return p[0]<0||p[0]>=innerWidth||p[1]<190||p[1]>950||p[0]>1730;}
  setInterval(function(){
    var M=CAVE3,L=M.lens,m=M.lakeM;
    if(!L||!m)return;
    var pts=[],wp=[],cells={},live=0,y=m.y;
    for(var x=Math.max(L.l-2,m.g0);x<=Math.min(L.r+2,m.g1);x+=.25)for(var z=.04;z<CAVE3_CH.zcap;z+=.25){
      if(cave3Den(Fd,x,y,z)>-.03)continue;
      var p=scr(L,x,y,z);
      if(hud(p)||hid(L,x,y,z))continue;
      pts.push(Math.round(p[0]),Math.round(p[1]));wp.push([x,z]);
      cells[Math.floor(x/2.5)+","+Math.floor(z/2.5)]=1;
    }
    /* кольцо живое в кадре, если капля падает на воду и в метре от неё гладь видна */
    for(var k in cells){
      var a=k.split(","),i=+a[0],j=+a[1];
      if(h(i,j,97)<.45)continue;
      var cx=(i+h(i,j,91))*2.5,cz=(j+h(i,j,93))*2.5;
      if(cx<m.g0||cx>m.g1||cave3Den(Fd,cx,y,cz)>-.03)continue;
      if(wp.some(function(q){return Math.hypot(q[0]-cx,q[1]-cz)<1;}))live++;
    }
    window.__EXTRA.dive={dv:+(M.dv||0).toFixed(2),d:+m.d.toFixed(2),rings:live,pts:pts};
  },40);
})();
"""

opt = dict(a.split("=", 1) for a in sys.argv[1:] if "=" in a)
port = int(opt.get("port", "10300"))
pfx = opt.get("pfx", "cwat")
scenes = opt["scene"].split(",") if opt.get("scene") else SCENES
SH = where.shots()
env = dict(os.environ, PYTHONIOENCODING="utf-8")


def run(args):
    r = subprocess.run([sys.executable] + args, capture_output=True, text=True, encoding="utf-8", errors="replace",
                       env=env, timeout=300)
    return r.stdout + r.stderr


def shoot(scene, nm):
    """Shoots one frame; returns the page's dive record (or a string: what went wrong)."""
    global port
    typ, n, side = scene.split(":")
    t = run([os.path.join(HERE, "cave.py"), typ, n, "zone:water", "near=0"])
    m = re.search(r"g_cave_\S+\.js", t)
    if not m:
        return "no snippet: " + t[-200:]
    tag = "%s_%s_%s%s" % (typ, n, side.replace("-", "m"), "_nm" if nm else "")
    js = "%s_%s.js" % (pfx, tag)
    with open(os.path.join(SH, js), "w", encoding="utf-8") as f:
        f.write(open(where.find(m.group(0)), encoding="utf-8").read() + "\n" + CAM % {"side": int(side)}
                + ("PLN.noMirror=true;\n" if nm else ""))
    t = run([os.path.join(HERE, "gshot.py"), "js=" + js, "eval=eval-cave.js", "out=%s_%s.png" % (pfx, tag), "w=1920",
             "h=1080", "port=%d" % port, "tail=100000"])
    port += 1
    if re.search(r"\"errs\": [1-9]|\"crash\": true", t):
        return "error in the frame"
    m = re.search(r"\"dive\": (\{[^{}]*\})", t)
    return json.loads(m.group(1)) if m else "no dive record (the lake under the man was not found)"


def frame(scene, nm):
    typ, n, side = scene.split(":")
    tag = "%s_%s_%s%s" % (typ, n, side.replace("-", "m"), "_nm" if nm else "")
    return Image.open(os.path.join(SH, "%s_%s.png" % (pfx, tag))).convert("RGB")


fail = 0


def gate(ok, kind, scene, v, rule):
    global fail
    fail += not ok
    print("%s %-6s %-14s %s %s" % ("ok  " if ok else "FAIL", kind, scene, v, rule))


for sc in scenes:
    rec = None
    if opt.get("shoot", "1") != "0":
        rec = shoot(sc, False)
        e = shoot(sc, True)
        if isinstance(e, str):
            print("%s nm: %s" % (sc, e))
    else:
        rec = json.load(open(os.path.join(SH, "%s_%s.json" % (pfx, sc.replace(":", "_").replace("-", "m")))))
    if isinstance(rec, str):
        gate(False, "dive", sc, rec, "")
        continue
    json.dump(rec, open(os.path.join(SH, "%s_%s.json" % (pfx, sc.replace(":", "_").replace("-", "m"))), "w"))
    gate(rec["dv"] >= .99, "dive", sc, "%.2f (shore %.2f m)" % (rec["dv"], rec["d"]), ">= .99")
    a, b = frame(sc, False), frame(sc, True)
    pa, pb = a.load(), b.load()
    pts = rec["pts"]
    xy = [(pts[i], pts[i + 1]) for i in range(0, len(pts), 2)]
    if len(xy) < 50:
        gate(False, "water", sc, "%d samples" % len(xy), ">= 50")
        continue
    diff = sum(1 for p in xy if max(abs(u - v) for u, v in zip(pa[p], pb[p])) > 6) / len(xy)
    val = sorted(max(pa[p]) / 255 for p in xy)
    spread = val[int(len(val) * .9)] - val[int(len(val) * .1)]
    gate(diff >= .5, "mirror", sc, "%.3f" % diff, ">= .50")
    gate(spread >= .08, "spread", sc, "%.3f" % spread, ">= .08")
    gate(3 <= rec["rings"] <= 5, "rings", sc, rec["rings"], "3..5")
print("next port", port)
print("ALL GREEN" if not fail else "FAILED %d" % fail)
