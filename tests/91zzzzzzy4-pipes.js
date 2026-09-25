/* ══════════════ детектор конвейеров: после прогрева полёт не компилирует (DESIGN-gpu §G) ══════════════
   S23 с холодного сайта рвал кадр на 50–67 мс там, где полёт впервые создавал конвейер
   (гостиница, щит, флот). Прогрев (08b0) строит таблицу ключей 08b1 за заставкой; этот набор
   проходит полёт — орбиты, док, планету, гостиницу, фишки, станцию, флот, щит, пиратов —
   и требует ноль созданий после прогрева: ни ленивого ключа воронки, ни сырого
   createRenderPipeline/createComputePipeline/createShaderModule мимо неё. Красный называет ключи.
   Таблицу пишет он же: каждый ключ, спрошенный у воронки с загрузки, уходит в <pre id="pipekeys">,
   и `test.ps1 -Accept -Only конвейеры` кладёт его в src/08b1-gpu-pipe-keys.js.
   Идёт третьим и закреплён (99-run): до него чужие наборы не создают конвейеры за него. */
const PIPE_SCENES=[
  {name:"орбиты системы издали",place(){
    G.sx=0;G.sy=0;G.sys=getSystem(0,0);G.ap=null;G.orbit=null;
    G.ship.x=0;G.ship.y=-900;G.ship.vx=G.ship.vy=0;G.zoom=.25;G.zoomT=null;return true;}},
  ...GATE2D.map(S=>({name:S.name,place:S.place.bind(S)})),
  {name:"щит у полосы (17k)",place(){
    for(let r=0;r<=30;r++)for(let x=-r;x<=r;x++)for(let y=-r;y<=r;y++){
      if(Math.max(Math.abs(x),Math.abs(y))!==r)continue;const s=getSystem(x,y);if(!s.station)continue;
      G.sx=x;G.sy=y;G.sys=s;G.ap=null;G.orbit=null;const B=bbHere();if(!B)continue;
      /* ×1.5: кегль вывески от 15 точек — неон печёт бледное ядро (destination-out), S23 ловил его ленивым 26.09 */
      G.ship.x=B.x;G.ship.y=B.y+60;G.ship.vx=G.ship.vy=0;G.zoom=1.5;G.zoomT=null;return {B};}
    return null;}},
  {name:"стена у края системы (gew)",place(){
    G.sx=0;G.sy=0;G.sys=getSystem(0,0);G.ap=null;G.orbit=null;
    G.ship.x=0;G.ship.y=-(sysEdge(G.sys)-300);G.ship.vx=G.ship.vy=0;G.zoom=1;G.zoomT=null;return true;}},
  /* как gate.py Контроля на холодном S23: «Начать» и 30 с — тяга 1 с через 1 с, влево 0.5 с из каждых 4.
     Там первым ленивым вышло поле стены (gew) на 8-й секунде */
  {name:"настоящий первый полёт: старт и 30 с маршрута",frames:1800,place(first,i){
    if(first){spawnPirates();spawnAllies();return G.mode==="system";}
    const n=(i/15)|0;keys.thrust=G.mode==="system"&&n%8<4;keys.left=G.mode==="system"&&n%16<2;return true;}},
  {name:"пираты у корабля: корпуса, выхлоп, ракеты",place(first){
    const sh=G.ship;
    if(first){
      G.sx=0;G.sy=0;G.sys=getSystem(0,0);G.ap=null;G.orbit=null;sh.x=0;sh.y=-700;
      G.pirates=[];G.msl=[];
      for(const [dx,dy,rank,seed] of [[90,-40,3,11],[60,70,1,18],[-70,60,0,25]]){
        const p={x:sh.x+dx,y:sh.y+dy,vx:0,vy:0,a:Math.atan2(-dy,-dx),hull:300,hullMax:400,
          name:"Ц"+(G.pirates.length+1),rank,seed,cool:0,aware:true,thrust:true};
        p.shipId=pirateShipId(seed);G.pirates.push(p);}
      for(const t of G.pirates){const a=Math.atan2(t.y-sh.y,t.x-sh.x);
        G.msl.push({x:sh.x+Math.cos(a)*14,y:sh.y+Math.sin(a)*14,vx:Math.cos(a)*MSL_SPEED,vy:Math.sin(a)*MSL_SPEED,
          a,tgt:t,dmg:MSL_DMG,turn:MSL_TURN,life:MSL_LIFE,age:0,puff:0,kind:"plain"});}
    }
    sh.x=0;sh.y=-700;sh.vx=sh.vy=0;G.hull=stat().hullMax;G.zoom=1.6;G.zoomT=null;
    return G.pirates.length>0;}},
];
/* кто создал: первое имя в стеке мимо самой воронки и обёртки набора */
function pipeWho(){
  const L=(new Error().stack||"").split("\n"),skip=/^(pipeWho|gpuPipeline|gpuShader|gpuPipeDesc|gpuFieldLayout)$/;
  for(let i=2;i<L.length;i++){const m=/at (?:new )?(?:[\w$]+\.)?([\w$]+) /.exec(L[i]);
    if(m&&!skip.test(m[1])&&!/^(?:[dD]\.)?create/.test(m[1]))return m[1];}
  return "?";
}
const PIPE_SUITE=()=>suite("конвейеры: после прогрева полёт не компилирует",{tier:"browser"},()=>{
  if(!ok(GPU.ok&&GPU_PIPES.done,"видеокарта поднялась и прогрев кончился ("+GPU_PIPES.n+" из "+GPU_PIPE_KEYS.length+" за "+GPU_PIPES.ms+" мс)"))return;
  eq((GPU_PIPES.bad||[]).join(", "),"","ключи таблицы собираются по рецепту");
  const d=GPU.dev,raw={},lazy0=GPU_PIPES.lazy.length,kinds=["createRenderPipeline","createComputePipeline","createShaderModule"];
  const run0=G.running,loop0=LOOP_OFF,lim0=Error.stackTraceLimit;
  Error.stackTraceLimit=40;
  for(const k of kinds){const o=d[k];d[k]=function(){const q=k+" ← "+pipeWho();raw[q]=(raw[q]||0)+1;return o.apply(this,arguments);};}
  try{
    G.running=true;LOOP_OFF=false;let t=wallMs();
    for(const S of PIPE_SCENES){
      resetWorld();G.mode="system";
      if(!ok(!!S.place(true),S.name+": сцена нашлась"))continue;
      try{for(let i=0;i<(S.frames||60);i++){S.place(false,i);frameBody(t+=16.7);}}
      catch(e){ok(false,S.name+": кадр упал: "+e.message);}
      finally{keys.thrust=keys.left=false;}
    }
  }finally{
    for(const k of kinds)delete d[k];
    Error.stackTraceLimit=lim0;G.running=run0;LOOP_OFF=loop0;
  }
  const lazy=[...new Set(GPU_PIPES.lazy.slice(lazy0))];
  eq(lazy.join(", "),"","ленивых конвейеров в полёте после прогрева (нет в таблице 08b1 — test.ps1 -Accept -Only конвейеры)");
  const top=Object.entries(raw).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k,v])=>v+"× "+k).join("; ");
  eq(top,"","сырых созданий на устройстве в полёте");
  /* таблица без мёртвых ключей: каждый лишний — компиляция за заставкой впустую */
  const dead=GPU_PIPE_KEYS.filter(k=>!GPU_PIPES.used.has(k));
  eq(dead.join(", "),"","в таблице нет ключей, которых полёт не спросил");
  const pre=document.createElement("pre");pre.id="pipekeys";pre.hidden=true;pre.setAttribute("data-pipe","1");
  pre.textContent=JSON.stringify([...GPU_PIPES.used].sort());document.body.appendChild(pre);
  resetWorld();
});
PIPE_SUITE.pin="first";
