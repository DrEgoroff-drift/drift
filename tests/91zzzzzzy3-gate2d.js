/* ══════════════ ворота «0 вызовов 2D» у перенесённых печей (GPU-3, DESIGN-gpu §G) ══════════════
   Печь, переехавшая на GPU-холст (08ca), не зовёт CanvasRenderingContext2D ни в кадре,
   ни в выпечке. Запись стоит на прототипе 2D (методы и сеттеры), вызов относится к художнику
   по стеку. Дыры API, которые ждут v2, названы поимённо (DYRY) — чужая печь внутри нашей
   (облик флота печёт fleetArtOf с именем борта текстом) не прячет наши вызовы: считается
   всё, в чьём стеке есть художник сцены и нет дыры. Новый перенос — новая сцена в GATE2D. */
/* облик флота (12ai1) — 2D-холст с именем борта (fillText), ждёт текст v2: fleetArtOf печёт,
   fleetShipAt грузит его мипы 2D-спуском (gpuMipTex). Уйдёт с переносом облика флота */
const GATE2D_DYRY=["fleetArtOf","fleetShipAt"];
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
];
TEST_SUITES.push(()=>suite("ворота «0 вызовов 2D»: перенесённые печи не зовут 2D ни в кадре, ни в выпечке",{tier:"browser"},()=>{
  if(!ok(GPU.ok,"видеокарта есть — без неё ворота не меряются"))return;
  const PR=[window.CanvasRenderingContext2D&&CanvasRenderingContext2D.prototype,
            window.OffscreenCanvasRenderingContext2D&&OffscreenCanvasRenderingContext2D.prototype].filter(Boolean);
  for(const S of GATE2D){
    resetWorld();G.mode="system";
    const st=S.place();
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
        if(typeof d.value==="function"){const o=d.value;saved.push([P,k,d]);
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
