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
  ...GATE2D.map(S=>({name:S.name,place:S.place.bind(S),done:S.done&&S.done.bind(S)})),   /* и уборка: стол и КБ не остаются открытыми соседям */
  {name:"щит у полосы (17k)",place(){
    for(let r=0;r<=30;r++)for(let x=-r;x<=r;x++)for(let y=-r;y<=r;y++){
      if(Math.max(Math.abs(x),Math.abs(y))!==r)continue;const s=getSystem(x,y);if(!s.station)continue;
      G.sx=x;G.sy=y;G.sys=s;G.ap=null;G.orbit=null;const B=bbHere();if(!B)continue;
      /* ×1.5: кегль вывески от 15 точек — неон печёт бледное ядро (destination-out), S23 ловил его ленивым 26.09 */
      G.ship.x=B.x;G.ship.y=B.y+60;G.ship.vx=G.ship.vy=0;G.zoom=1.5;G.zoomT=null;return {B};}
    return null;}},
  {name:"прожектор разведчика (16c, поле клина)",place(){
    G.sx=0;G.sy=0;G.sys=getSystem(0,0);G.ap=null;G.orbit=null;G.ship.x=0;G.ship.y=-700;G.ship.vx=G.ship.vy=0;
    G.zoom=1;G.zoomT=null;ABIL_ST.k="survey";ABIL_ST.on=G.t+600;return true;}},
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
  /* трепло (12y1): окно и иконка жёрдочки — свои канвы; окно закрывается на последнем кадре, чтобы не утечь в чужие наборы */
  {name:"трепло в полёте: окно и жёрдочка",place(first,i){
    if(first){G.sx=0;G.sy=0;G.sys=getSystem(0,0);G.ap=null;G.orbit=null;G.ship.x=0;G.ship.y=-700;G.ship.vx=G.ship.vy=0;
      parrotFind(7,"пробы");toggleParrotWin(true);return parWin;}
    if(i===59)toggleParrotWin(false);return true;}},
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
      finally{keys.thrust=keys.left=false;if(S.done)S.done();}
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
/* ══════════════ прыжок между системами: группа привязок — своего конвейера (M800) ══════════════
   gpuBind кэшировал группу по имени и ресурсам: у шара ключ "p"+idx, конвейер — по семье мира (GOR_FAM).
   Прыжок, где планета 0 сменила семью, отдавал группу прежнего конвейера: 12 ошибок проверки
   («pipeline created with a default layout is not compatible with the BindGroup»), чёрный кадр до
   перезагрузки. Ошибки устройства приходят позже кадра, поэтому сторож здесь — то же правило в момент
   записи: группа, собранная по раскладке конвейера "auto", ставится только при этом конвейере. */
TEST_SUITES.push(()=>suite("видеокарта: после прыжка группы привязок — своего конвейера",{tier:"browser"},()=>{
  resetWorld();
  if(!ok(GPU.ok&&!!GPU.dev&&GPU_PIPES.done,"видеокарта поднялась, прогрев кончился"))return;
  const famOf=(sx,sy)=>{const p=getSystem(sx,sy).planets[0];return p&&GOR.K[p.type]!==undefined?GOR_FAM[GOR.K[p.type]]:-1;};
  const fa=famOf(0,0);let to=null;
  for(let r=1;r<=12&&!to;r++)for(let x=-r;x<=r&&!to;x++)for(let y=-r;y<=r&&!to;y++){
    if(Math.max(Math.abs(x),Math.abs(y))!==r)continue;const f=famOf(x,y);
    if(f>=0&&f!==fa&&gorPipe(f))to=[x,y,f];}
  if(!ok(fa>=0&&!!gorPipe(fa)&&!!to,"нашлись две системы с планетой 0 разных семей ("+fa+" → "+(to&&to[2])+"), конвейеры прогреты"))return;
  const PP=GPURenderPipeline.prototype,DP=GPUDevice.prototype,EP=GPURenderPassEncoder.prototype;
  const dL=Object.getOwnPropertyDescriptor(PP,"getBindGroupLayout"),dB=Object.getOwnPropertyDescriptor(DP,"createBindGroup"),
    dS=Object.getOwnPropertyDescriptor(EP,"setPipeline"),dG=Object.getOwnPropertyDescriptor(EP,"setBindGroup");
  const layOf=new WeakMap(),bgOf=new WeakMap(),cur=new WeakMap(),used=new Set(),bad=[];
  PP.getBindGroupLayout=function(i){const L=dL.value.call(this,i);layOf.set(L,this);return L;};
  DP.createBindGroup=function(d){const g=dB.value.call(this,d);if(d&&d.layout)bgOf.set(g,d.layout);return g;};
  EP.setPipeline=function(p){cur.set(this,p);used.add(p);return dS.value.call(this,p);};
  EP.setBindGroup=function(i,g){
    const L=g&&bgOf.get(g),P=L&&layOf.get(L),c=cur.get(this);
    if(P&&c&&P!==c&&bad.length<6)bad.push((G.sx+","+G.sy)+" · "+(P.label||"конвейер")+" ≠ "+(c.label||"текущий"));
    return dG.value.apply(this,arguments);};
  for(const k in GPU.bgs)if(/^gor/.test(k))delete GPU.bgs[k];   /* кэш с прошлых наборов — собрать заново под сторожем */
  const run0=G.running,loop0=LOOP_OFF,e0=GPU.errs;
  try{
    G.running=true;LOOP_OFF=false;let t=wallMs();
    const fly=(n)=>{for(let i=0;i<n;i++){const p=G.sys.planets[0];G.ship.x=p.x-150;G.ship.y=p.y+60;G.ship.vx=G.ship.vy=0;
      G.zoom=.5;G.zoomT=null;frameBody(t+=16.7);}};
    G.sx=0;G.sy=0;G.sys=getSystem(0,0);G.ap=null;G.orbit=null;G.mode="system";fly(60);
    ok(used.has(gorPipe(fa)),"до прыжка планета 0 нарисована шаром своей семьи ("+fa+")");
    arriveSystem(to[0],to[1],{cost:0});fly(60);
    ok(used.has(gorPipe(to[2])),"после прыжка в "+to[0]+","+to[1]+" планета 0 нарисована шаром семьи "+to[2]);
  }finally{
    Object.defineProperty(PP,"getBindGroupLayout",dL);Object.defineProperty(DP,"createBindGroup",dB);
    Object.defineProperty(EP,"setPipeline",dS);Object.defineProperty(EP,"setBindGroup",dG);
    G.running=run0;LOOP_OFF=loop0;
  }
  eq(bad.join("; "),"","группа привязок чужого конвейера в проходе (ошибка проверки на устройстве)");
  eq(GPU.errs-e0,0,"ошибок устройства за набор не прибавилось (те, что успели прийти)");
  resetWorld();
}));
