/* ══════════════ ворота «0 вызовов 2D» у перенесённых печей (GPU-3, DESIGN-gpu §G) ══════════════
   Печь, переехавшая на GPU-холст (08ca), не зовёт CanvasRenderingContext2D ни в кадре,
   ни в выпечке. Запись стоит на прототипе 2D (методы и сеттеры), вызов относится к художнику
   по стеку. Дыры API, которые ждут v2, названы поимённо (DYRY) — чужая печь внутри нашей
   (облик флота печёт fleetArtOf с именем борта текстом) не прячет наши вызовы: считается
   всё, в чьём стеке есть художник сцены и нет дыры. Новый перенос — новая сцена в GATE2D. */
/* облик флота (12ai1) — 2D-холст с именем борта (fillText), ждёт текст v2: fleetArtOf печёт,
   fleetShipAt грузит его мипы 2D-спуском (gpuMipTex). Уйдёт с переносом облика флота */
/* текст v2 (08cb): маску строки растрит одна 2D-канва на всю игру (GC_GLYPHS.raster/.measure),
   раз на строку — так устроен текст GPU-холста, это его источник глифов, а не 2D печи */
const GATE2D_DYRY=["fleetArtOf","fleetShipAt","raster","measure","_c","_set"];
const GATE2D=[
  {name:"полоса у дока (17g): бакены, ореолы, очередь",
   painters:["drawSysLane","drawSysLaneShips","laneShip","laneBuoySprite","laneBuoyPaint","laneGlowSprite","drawRushTraffic"],
   place(){
     for(let r=0;r<=14;r++)for(let x=-r;x<=r;x++)for(let y=-r;y<=r;y++){
       if(Math.max(Math.abs(x),Math.abs(y))!==r)continue;
       const s=getSystem(x,y);if(!s.station)continue;
       G.sx=x;G.sy=y;G.sys=s;G.ap=null;G.orbit=null;const P=sysLane(s);
       if(!P||!P.buoys.length||!P.queue.length)continue;
       G.ship.x=P.st.x+P.ux*300-P.uy*120*P.side;G.ship.y=P.st.y+P.uy*300+P.ux*120*P.side;
       G.ship.vx=G.ship.vy=0;G.zoom=1.7;G.zoomT=null;return {P,fr:{drawSysLane:0,laneShip:0}};}
     return null;},
   probe:["drawSysLane","laneShip"]},
  /* развёртка — шейдер (17gb), суша городов — по формуле (gplLandAt). Постройки на первом
     твёрдом теле дают огни, огням нужна суша; развёртку выбрасываем, чтобы выпечка шла под записью */
  {name:"планета (07/17ga/17gb): развёртка, суша, города",
   painters:["gpuPlanet","gplBody","gplCities","gplLandMask","gplLandAt","planetStrip","gpsBake","planetStripPx","gpuMoon"],
   place(first){
     for(let r=0;r<=14;r++)for(let x=-r;x<=r;x++)for(let y=-r;y<=r;y++){
       if(Math.max(Math.abs(x),Math.abs(y))!==r||!starAt(x,y))continue;
       const s=getSystem(x,y),p=(s.planets||[]).find(q=>q.type!=="gas");
       if(!p||!planetHasLife(p))continue;
       G.sx=x;G.sy=y;G.sys=s;G.ap=null;G.orbit=null;
       G.hold=G.hold||{};G.hold[s.key]={bld:{a:1,b:1,c:1,d:1}};
       if(first&&p.strip)planetStripDrop(p);
       const Z=230/p.radius,l=Math.hypot(p.x,p.y)||1;
       G.ship.x=p.x-p.y/l*126/Z;G.ship.y=p.y+p.x/l*126/Z;G.ship.vx=G.ship.vy=0;
       G.zoom=Z;G.zoomT=null;return {p};}
     return null;},
   probe:["gpuPlanet","gplCities"]},
  /* гостиница «Космос»: пять выпечек GPU-холста (дом, горящие окна, их свет, отсвет вывески) —
     шаги планировщика 17a0; дом сбрасываем, чтобы выпечка шла под записью (на экране — целиком
     в кадре); вечер — окна горят */
  {name:"гостиница «Космос» (17l, 17l1): дом, окна, отсвет, труба с челноком",
   painters:["drawHotel","hotelGet","hotelJob","prebake","hkPaint","hotelWindows","hotelDock","hotelNeon"],
   place(first){
     for(let r=0;r<=14;r++)for(let x=-r;x<=r;x++)for(let y=-r;y<=r;y++){
       if(Math.max(Math.abs(x),Math.abs(y))!==r)continue;const s=getSystem(x,y);if(!s.station)continue;
       G.sx=x;G.sy=y;G.sys=s;G.ap=null;G.orbit=null;const Ht=hotelHere();if(!Ht||Ht.by!=="gt")continue;
       if(first){hotelDrop(HOTEL_BAKE);HOTEL_BAKE=null;for(const k of [...PB.keys()])prebakeDrop(k);
         G.t=Math.floor(G.t/CEL_DAY)*CEL_DAY+CEL_DAY*21/24;}
       G.ship.x=Ht.x;G.ship.y=Ht.y+150/2.2;G.ship.vx=G.ship.vy=0;G.zoom=2.2;G.zoomT=null;return {Ht};}
     return null;},
   probe:["drawHotel"]},
  /* станция (17c3): мастер тела двумя слоями (торговая: под кольцом и над ним) и вращающееся
     кольцо — выпечки GPU-холста; мастера и кольца сбрасываем, чтобы выпечка шла под записью */
  {name:"станция (17c3): мастер слоями, кольцо, огни",
   painters:["drawStation","stationMaster","stMasterJob","prebake","drawStationBody","stSpinCv","gpuStationDraw","stEmFlush","gpuLitSprite"],
   place(first){
     for(let r=0;r<=14;r++)for(let x=-r;x<=r;x++)for(let y=-r;y<=r;y++){
       if(Math.max(Math.abs(x),Math.abs(y))!==r)continue;const s=getSystem(x,y);
       if(!s.station||(s.station.stype||"trade")!=="trade")continue;
       G.sx=x;G.sy=y;G.sys=s;G.ap=null;G.orbit=null;const S=s.station;
       if(S.orbit!=null){S.x=Math.cos(S.ang)*S.orbit;S.y=Math.sin(S.ang)*S.orbit;}
       if(first){for(const k of [...PB.keys()])prebakeDrop(k);for(const M of ST_MASTER.values())stMasterDrop(M);ST_MASTER.clear();for(const q of ST_SPIN.values())gpuBakeDrop(q);ST_SPIN.clear();}
       G.ship.x=S.x;G.ship.y=S.y+80;G.ship.vx=G.ship.vy=0;G.zoom=1.5;G.zoomT=null;return {S};}
     return null;},
   probe:["drawStation","stationMaster"]},
  /* жест хозяина и пост у входа (17h): держава меняется каждые 15 кадров, возраст — внутри
     её жеста (прожектор «gt», линия «or»); доску поста сбрасываем, чтобы выпечка шла под записью */
  {name:"жест и пост (17h): корабли флота, дрон, прожектор, линия досмотра, доска",
   painters:["drawGesture","drawGestureTop","drawGestPost","gestPostSprite","gestShip","gestRect","gestAt"],
   place(first){
     const BY=[["gt",5],["co",3],["or",2.3],["ra",4],["hf",1.5],["km",1]];
     if(first){this.i=0;for(const B of GEST_POST_CV.values())gpuBakeDrop(B);GEST_POST_CV.clear();}
     for(let r=0;r<=30;r++)for(let x=-r;x<=r;x++)for(let y=-r;y<=r;y++){
       if(Math.max(Math.abs(x),Math.abs(y))!==r)continue;const s=getSystem(x,y);if(!s.station)continue;
       G.sx=x;G.sy=y;G.sys=s;G.ap=null;G.orbit=null;if(!gestOwner(x,y))continue;
       const E=sysEntry(x,y),px=E.x-Math.sin(E.a)*140,py=E.y+Math.cos(E.a)*140;
       G.ship.x=px+60;G.ship.y=py+110;G.ship.vx=G.ship.vy=0;G.ship.a=-.6;G.zoom=1.3;G.zoomT=null;
       const [by,age]=BY[Math.floor(this.i++/15)%BY.length];
       GEST={sx:x,sy:y,by,t0:G.t-age*60,said:true,fired:{say:1},seed:hashi(x,y,0x6E57)>>>0};
       return {by};}
     return null;},
   probe:["drawGesture","drawGestureTop","drawGestPost"]},
  /* «Чебуречная» (17j): лодка и её свет, доска — выпечки GPU-холста; сбрасываем, чтобы выпечка шла под записью */
  {name:"«Чебуречная» (17j): лодка, свет окна, доска",
   painters:["drawCheburek","chebBake","chebPaint","chebPaintEm","chebSignBake","chebSignMake"],
   place(first){
     if(first){for(const B of CHEB_ART.values())gpuBakeDrop(B);CHEB_ART.clear();for(const v of CHEB_SIGN.values())v.drop();CHEB_SIGN.clear();}
     for(let r=0;r<=30;r++)for(let x=-r;x<=r;x++)for(let y=-r;y<=r;y++){
       if(Math.max(Math.abs(x),Math.abs(y))!==r)continue;const s=getSystem(x,y);if(!s.station)continue;
       G.sx=x;G.sy=y;G.sys=s;G.ap=null;G.orbit=null;const C=chebHere();if(!C)continue;
       G.ship.x=C.x-30;G.ship.y=C.y+40;G.ship.vx=G.ship.vy=0;G.zoom=1.5;G.zoomT=null;return {C};}
     return null;},
   probe:["drawCheburek"]},
];
TEST_SUITES.push(()=>suite("ворота «0 вызовов 2D»: перенесённые печи не зовут 2D ни в кадре, ни в выпечке",{tier:"browser"},()=>{
  if(!ok(GPU.ok,"видеокарта есть — без неё ворота не меряются"))return;
  const PR=[window.CanvasRenderingContext2D&&CanvasRenderingContext2D.prototype,
            window.OffscreenCanvasRenderingContext2D&&OffscreenCanvasRenderingContext2D.prototype].filter(Boolean);
  for(const S of GATE2D){
    resetWorld();G.mode="system";
    const st=S.place(true);
    if(!ok(!!st,S.name+": сцена нашлась"))continue;
    const own=new Set(S.painters),K={on:false,n:0,by:{}},saved=[],hit={};
    const who=()=>{const L=(new Error().stack||"").split("\n");let p=null;
      for(let i=2;i<L.length;i++){const m=/at (?:new )?(?:[\w$]+\.)?([\w$]+) /.exec(L[i]);if(!m)continue;
        if(GATE2D_DYRY.includes(m[1]))return null;if(!p&&own.has(m[1]))p=m[1];}
      return p;};
    const note=k=>{if(!K.on)return;const p=who();if(p){K.n++;const w=p+"."+k;K.by[w]=(K.by[w]||0)+1;}};
    const run0=G.running,loop0=LOOP_OFF,wrap={},lim0=Error.stackTraceLimit;
    Error.stackTraceLimit=40;   /* художник бывает глубже десяти кадров стека — иначе вызов потерян молча */
    for(const f of S.probe){const o=window[f];wrap[f]=o;hit[f]=0;
      window[f]=function(){hit[f]++;return o.apply(this,arguments);};}
    try{
      for(const P of PR)for(const k of Object.getOwnPropertyNames(P)){
        if(k==="constructor")continue;const d=Object.getOwnPropertyDescriptor(P,k);
        if(d.value instanceof Function){const o=d.value;saved.push([P,k,d]);
          P[k]=function(){note(k);return o.apply(this,arguments);};}
        else if(d.set){const s=d.set;saved.push([P,k,d]);
          Object.defineProperty(P,k,{configurable:true,enumerable:d.enumerable,get:d.get,set:function(v){note(k);return s.call(this,v);}});}}
      /* с первого кадра: выпечка — тоже часть ворот */
      K.on=true;G.running=true;LOOP_OFF=false;let t=wallMs();
      for(let i=0;i<90;i++){S.place();frameBody(t+=16.7);}
    }catch(e){ok(false,S.name+": кадр упал: "+e.message);}
    finally{
      K.on=false;Error.stackTraceLimit=lim0;
      for(const [P,k,d] of saved)Object.defineProperty(P,k,d);
      for(const f in wrap)window[f]=wrap[f];
      G.running=run0;LOOP_OFF=loop0;
    }
    for(const f of S.probe)ok(hit[f]>=30,S.name+": "+f+" рисовал ("+hit[f]+" из 90 кадров)");
    const top=Object.entries(K.by).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>v+"× "+k).join("; ");
    eq(K.n,0,S.name+": вызовов 2D"+(K.n?" — "+top:""));
  }
  resetWorld();
}));
