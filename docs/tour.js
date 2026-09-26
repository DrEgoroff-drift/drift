/* тур ворот ступени 1 (docs/tour.py): десять пунктов полёта по __TN шагов; на каждом шаге (кадре) —
   выгрузки холстов (copyExternalImageToTexture: в слой #c и прочие), writeTexture, отправки в очередь
   (свои кадра и запеканий gpuBake отдельно), сбои кадра. Первые 120 шагов пункта — «warm» (вход),
   считаются отдельно. Итог — window.__TG */
(function(){
  const N=window.__TN||1200,T=window.__TOUR={i:-1,f:0,done:false,err:[],info:{}};
  const sh=()=>G.ship;
  const goSys=(x,y)=>{G.sx=x;G.sy=y;G.sys=getSystem(x,y);G.ap=null;G.orbit=null;};
  const stop=(x,y)=>{const s=sh();s.x=x;s.y=y;s.vx=0;s.vy=0;};
  const clean=()=>{keys.thrust=false;G.haul=null;G.npcWrecks=null;G.pirates=[];G.shots=[];G.msl=[];G.loot=[];
    if(G.drones)G.drones=G.drones.filter(d=>!d.__tour);try{clockSet(null);}catch(e){}
    if(G.mode!=="system"){try{if(G.mode==="dock")closeStation();}catch(e){}G.mode="system";}G.zoomT=null;};
  const findSys=pred=>{for(let r=0;r<=14;r++)for(let x=-r;x<=r;x++)for(let y=-r;y<=r;y++){
    if(Math.max(Math.abs(x),Math.abs(y))!==r)continue;const s=getSystem(x,y);if(pred(s,x,y))return [x,y];}return null;};
  const items0=[
    {n:"neyel",set(){goSys(0,0);stop(0,-760);sh().a=Math.PI/2;G.zoom=1.4;},each(f){keys.thrust=true;}},
    {n:"kommuna",set(){const kx=1,ky=0,st=chronState();
      st.systems[kx+","+ky]={owner:MAKER_KEYS.indexOf("km"),since:st.N,front:0};goSys(kx,ky);stop(0,-600);G.zoom=1.4;},
      each(f){keys.thrust=f%240<120;}},
    {n:"wrecks",set(){goSys(0,0);stop(300,-500);G.zoom=1.8;
      G.npcWrecks=[{x:240,y:-450,seed:77,by:"gt",crew:1},{x:360,y:-430,seed:78,by:"gt",crew:0},{x:300,y:-580,seed:79,by:"km",crew:1}];},
      each(f){keys.thrust=f%300<60;}},
    {n:"rescue",set(){goSys(0,0);stop(0,-700);G.zoom=1.6;haulStart();const h=G.haul;h.ph="haul";h.t=0;h.x0=sh().x;h.y0=sh().y;},each(f){}},
    /* ресурс дрона — настоящий ключ RES: с чужим кадр падал, и перепись дронов не видела */
    {n:"drones",set(){goSys(0,0);stop(0,-700);G.zoom=1.6;G.drones=G.drones||[];
      for(let i=0;i<4;i++)G.drones.push({sx:G.sx,sy:G.sy,res:"iron",pi:-1,__tour:1});},each(f){}},
    {n:"soroka",set(){clockSet(WANDER_T0);const w=wanderAt();goSys(w.sx,w.sy);const p=wanderWorldPos(G.sys,w.planetIx);
      stop(p.x+p.L*.6,p.y);G.zoom=1.6;T.info.soroka=!!wanderHere(G.sys);},each(f){}},
    {n:"belt",set(){const c=findSys(s=>!!s.belt);if(!c){T.err.push("no belt");return;}goSys(c[0],c[1]);
      stop(G.sys.belt.orbit+40,0);G.zoom=1.4;},each(f){if(f===N-400&&G.mode==="system"&&G.sys.belt){try{enterBelt();}catch(e){T.err.push("belt:"+e);}}}},
    {n:"hotel",set(){const c=findSys((s,x,y)=>{if(!s.station)return false;goSys(x,y);return !!(hotelHere()&&chebHere());});
      if(!c){T.err.push("no hotel");return;}const H=hotelHere(),C=chebHere();
      stop(C.x+(H.x-C.x)*.35,C.y+(H.y-C.y)*.35);sh().a=-2.2;G.zoom=2.2;},each(f){}},
    {n:"planet",set(){goSys(0,0);G.zoom=ZOOM_MAX;},each(f){const p=G.sys.planets[0];if(p)stop(p.x+(p.radius||20)+60,p.y);G.zoom=ZOOM_MAX;}},
    {n:"dock",set(){goSys(0,0);const S=G.sys.station;if(!S){T.err.push("no station");return;}stop(S.x+150,S.y);G.zoom=1.8;},
      each(f){if(f===300){try{openStation();}catch(e){T.err.push("open:"+e);}}
        if(f===700){try{closeStation();}catch(e){T.err.push("close:"+e);}}
        if(f>700)keys.thrust=f%200<50;}},
  ];
  /* __TONLY — один пункт (tour.py --only) */
  const items=window.__TONLY?items0.filter(i=>i.n===window.__TONLY):items0;
  __STEP.each(()=>{if(T.done)return;
    if(T.i<0||T.f>=N){T.i++;T.f=0;clean();if(T.i>=items.length){T.done=true;window.__TI="end";return;}
      const it=items[T.i];window.__TI=it.n;try{it.set();}catch(e){T.err.push(it.n+" set:"+e);}}
    const it=items[T.i];try{it.each(T.f);}catch(e){T.err.push(it.n+" each:"+e);}T.f++;});
  /* счётчик: запекание узнаём по стеку (gpuBakeRedo0 отправляет свой кодировщик) */
  const D=window.__TG={it:{},who:{}};let armed=0,cur=null,stk=[],c0=0,y0=0;
  const Q=GPUQueue.prototype,oc=Q.copyExternalImageToTexture,ow=Q.writeTexture,os=Q.submit;
  const who=()=>new Error().stack.split(String.fromCharCode(10)).slice(3,7).map(l=>{const m=/at (?:new )?([\w$.]+) \(/.exec(l);if(m)return m[1];
    const q=/:(\d+):\d+\)?$/.exec(l);return q?"@"+q[1]:"?";}).join("<");   /* безымянная — строкой drift.html */
  const fresh=()=>({f:0,o:0,w:0,s:0,b:0});cur=fresh();
  Q.copyExternalImageToTexture=function(src,dst){if(armed){if(GPU.T&&dst.texture===GPU.T.front)cur.f++;else{cur.o++;stk.push("up:"+who());}}return oc.apply(this,arguments);};
  Q.writeTexture=function(){if(armed)cur.w++;return ow.apply(this,arguments);};
  Q.submit=function(){if(armed){if(/gpuBakeRedo0/.test(new Error().stack)){cur.b++;stk.push("bake:"+who()+"\t f"+GPU.frameNo+" n"+PB_N+" b"+PB_B0+"/"+(GPU.bakeN|0));}else cur.s++;}return os.apply(this,arguments);};
  __STEP.each(()=>{const it=window.__TI||"?";
    if(armed){const k=it+"|"+(T.f<=120?"warm":"run")+"|"+G.mode;
      const e=D.it[k]||(D.it[k]={n:0,front:0,up:0,wt:0,subBad:0,bakeF:0,bakeMax:0,crash:0,sync:0});
      e.n++;e.front+=cur.f;e.up+=cur.o;e.wt+=cur.w;if(cur.s!==1)e.subBad++;if(cur.b)e.bakeF++;e.bakeMax=Math.max(e.bakeMax,cur.b);
      e.crash+=crashN-c0;
      /* sync — вещь вышла на экран неиспечённой и допекалась целиком в кадре (PB_SYNC, 17a0) */
      const ys=PB_SYNC-y0;if(ys){e.sync+=ys;const q=k+"|sync";D.who[q]=(D.who[q]||0)+ys;}
      for(const s of stk){const q=k+"|"+s.split("\t")[0];D.who[q]=(D.who[q]||0)+1;}   /* после \t — кадр и счётчики печи, для строки × */
      if(cur.b>1){const q=k+"|×"+cur.b+" "+stk.filter(s=>s.startsWith("bake:")).map(s=>s.split("<").pop().replace("\t","")).join("+");D.who[q]=(D.who[q]||0)+1;}}
    armed=1;cur=fresh();stk=[];c0=crashN;y0=PB_SYNC;
  });
})();
