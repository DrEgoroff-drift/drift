/* ══════════════ пробник G11: ?g11 ══════════════
   Честный fps по режимам — только в ВИДИМОЙ вкладке (фоновая стопит rAF,
   и цифры оттуда ложь; растр ≠ JS, см. G0 в PLAN.md). Открыть
   play.html?g11 — после загрузки прогонит режимы, выведет цифры поверх
   экрана и, если слушает стенд (docs/stand.ps1), отправит POST /shot?n=g11.
   Без параметра не делает ничего и в кадре не стоит. */
function g11Fps(sec){
  return new Promise(res=>{
    let n=0,t0=0;
    const tick=t=>{if(!t0)t0=t;else n++;
      t-t0<sec*1000?requestAnimationFrame(tick):res(Math.round(n/((t-t0)/1000)));};
    requestAnimationFrame(tick);
  });
}
async function g11Run(){
  const out={},err=[],sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const find=pred=>{
    for(let r0=0;r0<16;r0++)for(let x=-r0;x<=r0;x++)for(let y=-r0;y<=r0;y++){
      if(Math.max(Math.abs(x),Math.abs(y))!==r0)continue;
      const s=getSystem(x,y);if(pred(s))return s;
    }
    return null;
  };
  const jump=s=>{G.sx=s.sx;G.sy=s.sy;G.sys=s;G.ap=null;G.orbit=null;};
  const box=document.createElement("div");
  box.style.cssText="position:fixed;left:8px;top:8px;z-index:99;color:#7fe6d8;"+
    "font:12px ui-monospace,monospace;background:rgba(0,0,0,.65);padding:8px;"+
    "white-space:pre;pointer-events:none";
  document.body.appendChild(box);
  const lines=["G11 · dpr "+devicePixelRatio+" · канва "+cvs.width+"×"+cvs.height];
  const put=t=>{lines.push(t);box.textContent=lines.join("\n");};
  put("едем, ~30 секунд…");
  const el=document.getElementById("startEasy");if(el)el.click();
  await sleep(1800);
  const steps=[
    ["system",()=>{G.mode="system";G.ap=null;}],
    ["belt",()=>{jump(find(s=>s.belt));enterBelt();}],
    ["landing",()=>{const s=find(s=>s.planets.some(p=>p.type!=="gas"));jump(s);
      startLanding(s.planets.find(p=>p.type!=="gas"));}],
    ["surface",()=>{
      const s=find(s=>s.planets.some(p=>p.type==="jungle"))||find(s=>s.planets.some(p=>p.type!=="gas"));
      jump(s);
      const p=s.planets.find(p=>p.type==="jungle")||s.planets.find(p=>p.type!=="gas");
      const tr=genTerrain(p);
      G.land={p,tr,x:tr.padX,y:groundAt(tr,tr.padX)};
      enterSurface();}],
    ["dig",()=>{enterDig();}],
    ["cave",()=>{G.mode="surface";enterCave();}],
    ["scoop",()=>{const s=find(s=>s.planets.some(p=>p.type==="gas"));jump(s);
      startScoop(s.planets.find(p=>p.type==="gas"));}],
    /* абордаж (0.161.0): единственный режим с настоящей проекцией — десятки
       четырёхугольников с сортировкой по глубине на каждый кадр. В туре его не
       было, поэтому цену переделки камеры и потолочных балок нечем было
       измерить, кроме глаз. Ставим ходока в отсек, где есть на что смотреть, —
       мерить пустой ангар смысла нет. */
    ["raid",()=>{
      const s=find(s=>pirateBaseOf(s));
      if(!s)return;
      jump(s);enterRaid(pirateBaseOf(s));
      const S=G.raid,R=S.R;let best=null;
      (R.rooms||[]).forEach(rm=>{
        const cx=(rm.c0+rm.c1+1)/2*RCELL,cz=(rm.r0+rm.r1+1)/2*RCELL;
        if(raidSolidAt(R,cx,cz))return;
        const n=S.foes.filter(q=>q.hp>0&&raidLineOfSight(R,cx,cz,q.x,q.z)).length;
        if(!best||n>best.n)best={n,x:cx,z:cz};
      });
      if(best&&best.n>0){S.x=best.x;S.z=best.z;
        const v=S.foes.filter(q=>q.hp>0&&raidLineOfSight(R,S.x,S.z,q.x,q.z));
        if(v.length)S.a=Math.atan2(v[0].x-S.x,v[0].z-S.z);}
    }],
    /* дом изнутри (M319): растр кадра там был 27 мс в панели; печка стен и
       обстановки в ломти проверяется только живым rAF, поэтому дом в туре */
    ["homein",()=>{G.mode="system";G.home=G.home||homeInit();G.home.tier=HOME_TIERS.length;enterHomeIn();}],
    /* дорога (M168k): у неё свой rAF и самый дорогой кадр в игре — поле света
       и длинный шлейф. Мерить её глазами по стенду нельзя, а на телефоне она и
       живёт, поэтому она в пробнике наравне с остальными. Ход и музыку задаём
       руками: на столе нет ни GPS, ни микрофона */
    ["road",()=>{
      roadOpen();
      roadAudio=function(){if(!RD)return;RD.kmh=60;RD.energy=.7;RD.bright=.5;
        for(let k=0;k<28;k++)RD.wave[k]=.25+.2*Math.sin(k);};
    }]];
  for(const st of steps){
    try{
      st[1]();
      await sleep(4000);                 /* кэши пекутся — меряем крейсер, не старт */
      out[st[0]]=await g11Fps(2.5);
      put(st[0]+" "+out[st[0]]);
    }catch(e){err.push(st[0]+": "+(e&&e.message||e));put(st[0]+" СБОЙ");}
  }
  put("ГОТОВО "+JSON.stringify(out));
  /* стенд слушает только на localhost; на проде этот POST тихо умрёт — и пусть */
  try{await fetch("/shot?n=g11",{method:"POST",
    body:btoa(unescape(encodeURIComponent(JSON.stringify({dpr:devicePixelRatio,fps:out,err,ua:navigator.userAgent.slice(0,80)}))))});}catch(e){}
}
/* ── глубокий разбор: ?g11=deep ──
   Меряет базу, затем глушит рисующие проходы ПО ОДНОМУ (function-объявления —
   свойства window, их можно подменять) и меряет дельту: чей noop поднимает
   fps — тот и ест кадр. Растровая цена так видна честно, в отличие от prof(). */
async function g11Deep(list){
  /* пара «база — глушение» вокруг КАЖДОЙ функции: fps дрейфует вверх, пока
     пекутся кэши, и одна общая база в начале красила поздние замеры в героев */
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const res={};
  for(const nm of list){
    const fn=window[nm];
    if(typeof fn!=="function")continue;
    const b=await g11Fps(1.2);
    window[nm]=()=>{};
    await sleep(150);
    const v=await g11Fps(1.2);
    window[nm]=fn;
    res[nm]=(v-b);                       /* +N — проход ест N кадров */
  }
  return res;
}
/* промежутки кадров за sec: к/с, медиана и p90 (мс), доля кадров не длиннее такта 60 Гц
   (≤18.5 мс) и число кадров от 45 мс — ворота телефона меряются этим, не средним */
/* ЦП отдельно от видеокарты (P1 8/n): js — FRAME_JS (весь frameBody), мир — время stepWorld
   за вызов и кванты корабля за кадр (WORLD_SUB): при кадре 45 мс это 5–6 квантов, и если мир
   дорог — спираль. Обёртка ставится на время замера (g11CpuHook) и снимается после */
/* ── метки времени видеокарты (P1 9/n): сколько мс идёт сам проход, а не кадр ──
   Пока GPU.tsOn, проход с именем (пересчёт туманности, её сведение, первый проход сцены,
   склейка 2D, первая ступень свечения, финал) пишет метки начала и конца; в конце кадра
   они уходят в буфер и читаются в GPU.tsAcc — сумма мс и число по имени, «frame» — от
   первой метки до последней. Без пробы gpuTs ничего не создаёт. Телефонный Chrome
   округляет метки до 0.1 мс — для проходов в миллисекунды хватает */
function gpuTs(name){
  if(!GPU.tsOn||!GPU.tsOk)return undefined;
  const T=GPU.tsQ||(GPU.tsQ={qs:GPU.dev.createQuerySet({type:"timestamp",count:32}),
    res:GPU.dev.createBuffer({size:256,usage:GPUBufferUsage.QUERY_RESOLVE|GPUBufferUsage.COPY_SRC}),rb:[],names:[],n:0});
  if(T.n+2>32)return undefined;
  const i=T.n;T.n+=2;T.names.push([name,i]);
  return {querySet:T.qs,beginningOfPassWriteIndex:i,endOfPassWriteIndex:i+1};
}
/* имя следующего куска прохода сцены: под метками кусок закрывает проход, и следующий
   gpuScene() откроет новый со своей меткой (на плиточной видеокарте это лишняя выгрузка
   цели — цена разметки, её несут только кадры пробы) */
function gpuSeg(name){
  GPU.seg=name;
  if(GPU.tsOn&&GPU.tsOk&&GPU.scenePass&&!GPU.scene3D){GPU.scenePass.end();GPU.scenePass=null;}
}
/* окно вокруг операции очереди (копия #c): пустой вычислительный проход с меткой до и после,
   каждый своей отправкой. Начало второго минус конец первого — копия и растр 2D за ней */
function gpuTsAround(name,fn){
  const a=gpuTs(name+"<");if(!a){fn();return;}
  const q=GPU.dev.queue,sub=ts=>{const e=GPU.dev.createCommandEncoder();e.beginComputePass({timestampWrites:ts}).end();q.submit([e.finish()]);};
  sub(a);fn();const b=gpuTs(name+">");if(b)sub(b);
}
/* до отправки кадра: метки — в буфер чтения; возвращает, что сделать после отправки */
function gpuTsResolve(){
  const T=GPU.tsQ;if(!T||!T.n)return null;
  const names=T.names,n=T.n;T.n=0;T.names=[];
  let rb=T.rb.find(b=>b.mapState==="unmapped");
  if(!rb){if(T.rb.length>=4)return null;
    rb=GPU.dev.createBuffer({size:256,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST});T.rb.push(rb);}
  GPU.enc.resolveQuerySet(T.qs,0,n,T.res,0);GPU.enc.copyBufferToBuffer(T.res,0,rb,0,n*8);
  return ()=>rb.mapAsync(GPUMapMode.READ).then(()=>{
    const a=new BigInt64Array(rb.getMappedRange(0,n*8)),acc=GPU.tsAcc||(GPU.tsAcc={});let lo=null,hi=null;
    const open={};
    for(const [nm,i] of names){const b=a[i],e=a[i+1];if(!b||!e||e<b)continue;
      const k=nm.slice(-1),base=nm.slice(0,-1);
      if(k==="<")open[base]=e;
      else if(k===">"&&open[base]){const r=acc[base]||(acc[base]={ms:0,n:0});r.ms+=Number(b-open[base])/1e6;r.n++;open[base]=0;}
      else{const r=acc[nm]||(acc[nm]={ms:0,n:0});r.ms+=Number(e-b)/1e6;r.n++;}
      if(lo===null||b<lo)lo=b;if(hi===null||e>hi)hi=e;}
    if(lo!==null){const r=acc.frame||(acc.frame={ms:0,n:0});r.ms+=Number(hi-lo)/1e6;r.n++;}
    rb.unmap();}).catch(()=>{});
}
/* мс видеокарты за sec: по имени — среднее на проход и доля кадров, где он был */
async function g11GpuMs(sec){
  if(!GPU.tsOk)return null;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  GPU.tsAcc={};const f0=GPU.frameNo;GPU.tsOn=true;
  try{await sleep(sec*1000);}finally{GPU.tsOn=false;}
  const fr=Math.max(1,GPU.frameNo-f0);await sleep(300);
  /* ms — на один проход, pf — сумма за кадр (проход может идти дважды или не каждый кадр);
     sum — всё размеченное за кадр, кроме самого кадра: frame минус sum — простой видеокарты */
  const o={};let sum=0;
  for(const k in GPU.tsAcc){const r=GPU.tsAcc[k];o[k]={ms:+(r.ms/r.n).toFixed(2),pf:+(r.ms/fr).toFixed(2),share:Math.round(100*r.n/fr)};
    if(k!=="frame")sum+=r.ms/fr;}
  o.sum={pf:+sum.toFixed(2)};
  return o;
}
const G11_CPU={w:0,wn:0,q:0,qmax:0};
function g11CpuHook(on){
  if(on&&!window.__g11sw){const sw=window.stepWorld;window.__g11sw=sw;
    window.stepWorld=function(dt){const t=wallMs(),q=WORLD_SUB;try{return sw(dt);}
      finally{G11_CPU.w+=wallMs()-t;G11_CPU.wn++;G11_CPU.q+=q;if(q>G11_CPU.qmax)G11_CPU.qmax=q;}};}
  if(!on&&window.__g11sw){window.stepWorld=window.__g11sw;window.__g11sw=null;}
}
function g11Iv(sec){
  return new Promise(res=>{
    const d=[],js=[];let t0=0,tp=0;const c0=Object.assign({},G11_CPU);G11_CPU.qmax=0;
    const tick=t=>{if(!t0)t0=tp=t;else{d.push(t-tp);tp=t;js.push(FRAME_JS);}
      if(t-t0<sec*1000){requestAnimationFrame(tick);return;}
      const qs=a=>{const s=a.slice().sort((x,y)=>x-y);return k=>+(s[Math.min(s.length-1,Math.floor(s.length*k))]||0).toFixed(1);};
      const q=qs(d),qj=qs(js),wn=Math.max(1,G11_CPU.wn-c0.wn);
      res({fps:Math.round(d.length/((t-t0)/1000)),p50:q(.5),p90:q(.9),ok:Math.round(100*d.filter(x=>x<=18.5).length/Math.max(1,d.length)),n45:d.filter(x=>x>=45).length,
        js50:qj(.5),js90:qj(.9),world:+((G11_CPU.w-c0.w)/wn).toFixed(1),quanta:+((G11_CPU.q-c0.q)/wn).toFixed(1),qmax:G11_CPU.qmax});};
    requestAnimationFrame(tick);
  });
}
/* ── ?g11=deep: разбор кадра видеокарты НА МЕСТЕ (телефон, 25.09) ──
   Ничего не нажимает и никуда не переносит: сохранение автора не трогается. Ждёт, пока
   игрок в полёте (system), и через 4 с глушит по одному проходы видеокарты — пары
   «база — глушение» по 1.5 с, дельта к/с. Потом ступени чёткости ×2/1.5/1.25/1 (по 2.5 с).
   Всё это время держать ход (автопилот или тягу): стоящая камера не пересчитывает
   туманность. Ответ — табличкой поверх, в console.log и в window.G11_DEEP */
const G11_GPU_KILL=[
  /* nebGen — только пересчёт (сведение старой текстуры остаётся); neb — пересчёт и сведение;
     space — всё это и звёзды: ключи вложены, их выигрыши не складываются */
  ["nebGen","ngen"],["neb",["gpuNebulaGen"]],["space",["gpuSpaceSys"]],["under",["gpuSysUnder"]],
  ["planets",["gpuPlanet","gpuMoon"]],["cities",["planetLightsOn"]],
  ["trails",["gpuWake","gpuTrail","gpuDrones"]],["combat",["gpuCombatEnergy"]],
  ["hullLight",["gpuHullLight"]],["points",["gpuLight"]],["refract",["gpuHaze","gpuShock"]],
  /* frontPx — копии #c размером 1×1: растр 2D остаётся, байтов нет; front2D — ни растра, ни копий */
  ["bloom","bloom"],["frontPx","fpx"],["front2D","front"],["final","fin"]];
/* пара — «база, глушение, база» (P1 8/n): одна база перед глушением путала с выигрышем
   дрейф полёта (район, прогрев). Дельта — от средней двух баз; на пару пишется канва и
   место корабля до и после — видно, мерилась ли пара в одном разрешении и в одном месте */
async function g11GpuDeep(put){
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const res={},at=()=>[Math.round(G.ship.x),Math.round(G.ship.y)];
  for(const [key,what] of G11_GPU_KILL){
    const at0=at(),cv0=cvs.width+"×"+cvs.height;
    const b1=await g11Iv(1.5);
    const saved={};
    if(typeof what==="string")GPU.kill[what]=true;
    else for(const nm of what){if(typeof window[nm]==="function"){saved[nm]=window[nm];window[nm]=()=>{};}}
    await sleep(150);
    let v;try{v=await g11Iv(1.5);}
    finally{if(typeof what==="string")GPU.kill[what]=false;else for(const nm in saved)window[nm]=saved[nm];}
    await sleep(150);
    const b2=await g11Iv(1.5);
    const d=Math.round(v.fps-(b1.fps+b2.fps)/2),cv1=cvs.width+"×"+cvs.height;
    res[key]={d,b1,kill:v,b2,cvs:cv0===cv1?cv0:cv0+"→"+cv1,at:[at0,at()]};
    put(key+" "+(d>=0?"+":"")+d+" · p50 "+b1.p50+"/"+b2.p50+"→"+v.p50+" · js "+v.js50+" · "+res[key].cvs);
  }
  return res;
}
async function g11DprSweep(put){
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const res={},RA=RES_AUTO,PD=PHONE_DPR;
  try{
    for(const k of [2,1.5,1.25,1]){
      RES_AUTO=k;PHONE_DPR=k;resFresh=1e9;resize();
      await sleep(600);
      const v=await g11Iv(2.5);
      res["x"+k]=v;put("×"+k+" "+cvs.width+"×"+cvs.height+" "+JSON.stringify(v));
    }
  }finally{RES_AUTO=RA;PHONE_DPR=PD;resFresh=0;resize();}
  return res;
}
async function g11RunDeepHere(){
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const box=document.createElement("div");
  box.style.cssText="position:fixed;left:8px;top:8px;z-index:99;color:#7fe6d8;font:11px ui-monospace,monospace;background:rgba(0,0,0,.7);padding:8px;white-space:pre;pointer-events:none";
  document.body.appendChild(box);
  const lines=[];const put=t=>{lines.push(t);box.textContent=lines.join("\n");};
  put("G11 deep · ждёт полёта (system)…");
  while(!(G.running&&G.mode==="system"&&GPU.ok))await sleep(500);
  await sleep(4000);
  /* разрешение на время пар стоит (P1 8/n): resAuto на S23 сбросил 1.5→1 на 8-й секунде, и
     база ползла 66→17 мс — пары после сброса мерились в другом кадре. Какое выбрала игра к
     этой минуте, то и держим; ?g11=deep&dpr=1.5 ставит своё */
  const RA=RES_AUTO,PD=PHONE_DPR,fx=+(new URLSearchParams(location.search).get("dpr"))||0;
  if(fx){RES_AUTO=fx;PHONE_DPR=fx;}
  resFresh=1e9;resize();g11CpuHook(true);
  const out={dpr:devicePixelRatio,DPR,canvas:cvs.width+"×"+cvs.height,res:G.opts.gfx.res,RES_AUTO,resEma:+resEma.toFixed(1),
    ua:navigator.userAgent.slice(0,80)};
  put("DPR "+DPR+" · "+out.canvas+" · gfx.res "+out.res+" · RES_AUTO "+RES_AUTO+" (стоит)");
  const err=[];
  try{
    const g0=GNB.nGen|0,f0=GPU.frameNo;
    out.base=await g11Iv(3);put("база "+JSON.stringify(out.base));
    out.nebRegen=Math.round(100*((GNB.nGen|0)-g0)/Math.max(1,GPU.frameNo-f0))+"%";
    put("туманность пересчитана в "+out.nebRegen+" кадров");
    /* сведение туманности под меткой идёт своим проходом — на телефоне это лишняя загрузка
       и выгрузка сцены, поэтому мс — отдельным отрезком, не внутри пар */
    try{out.gpuMs=await g11GpuMs(2);put("мс видеокарты "+JSON.stringify(out.gpuMs));}catch(e){err.push("ts: "+(e&&e.message||e));}
    try{out.gpu=await g11GpuDeep(put);}catch(e){err.push("gpu: "+(e&&e.message||e));}
    try{out.dpr2=await g11DprSweep(put);}catch(e){err.push("dpr: "+(e&&e.message||e));}
  }finally{g11CpuHook(false);RES_AUTO=RA;PHONE_DPR=PD;resFresh=0;resize();}
  out.err=err;
  window.G11_DEEP=out;console.log("G11_DEEP "+JSON.stringify(out));
  put("ГОТОВО · window.G11_DEEP");
}
/* старый разбор 2D-проходов с переносом по режимам (стенд, не телефон автора: жмёт
   «новая игра» и перебрасывает корабль) — ?g11=deeptour */
async function g11RunDeep(){
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const el=document.getElementById("startEasy");if(el)el.click();
  await sleep(1800);
  const find=pred=>{
    for(let r0=0;r0<16;r0++)for(let x=-r0;x<=r0;x++)for(let y=-r0;y<=r0;y++){
      if(Math.max(Math.abs(x),Math.abs(y))!==r0)continue;
      const s=getSystem(x,y);if(pred(s))return s;
    }
    return null;
  };
  const out={},err=[];
  try{
    G.mode="system";G.ap=null;
    await sleep(5000);                   /* прогрев: меряем крейсер, не пекарню */
    out.system=await g11Deep(["drawSysNebula","drawStars","drawSpaceDust","gpuSysUnder",
      "gpuPlanet","drawTrail","drawBarges","drawFinds"]);
    {
      const s0=find(x=>x.planets.some(q=>q.type!=="gas"));
      G.sx=s0.sx;G.sy=s0.sy;G.sys=s0;G.ap=null;
      startLanding(s0.planets.find(q=>q.type!=="gas"));
      await sleep(4000);
      out.landing=await g11Deep(["drawSkyBase","drawSkyLayer","drawGround","drawStrata",
        "drawRocks","drawClouds","drawWeather","drawLander","drawStars","geoFaultAt"]);
    }
    const s=find(s=>s.planets.some(p=>p.type==="jungle"))||find(s=>s.planets.some(p=>p.type!=="gas"));
    G.sx=s.sx;G.sy=s.sy;G.sys=s;G.ap=null;
    const p=s.planets.find(p=>p.type==="jungle")||s.planets.find(p=>p.type!=="gas");
    const tr=genTerrain(p);
    G.land={p,tr,x:tr.padX,y:groundAt(tr,tr.padX)};
    enterSurface();
    await sleep(5000);
    out.surface=await g11Deep(["drawSkyBase","drawSkyLayer","drawStars","drawTiles","drawGround",
      "drawPOI","drawDeco","drawBuilt","drawRocks","glowDrawPatches","drawDustMotes",
      "drawPlant","drawBeast","drawLander","drawForeground","drawWeather"]);
  }catch(e){err.push(""+(e&&e.message||e));}
  const box=document.createElement("div");
  box.style.cssText="position:fixed;left:8px;top:8px;z-index:99;color:#7fe6d8;font:11px ui-monospace,monospace;background:rgba(0,0,0,.7);padding:8px;white-space:pre";
  box.textContent=JSON.stringify(out,null,1);
  document.body.appendChild(box);
  try{await fetch("/shot?n=g11deep",{method:"POST",
    body:btoa(unescape(encodeURIComponent(JSON.stringify({dpr:devicePixelRatio,out,err}))))});}catch(e){}
}
if(location.search.indexOf("g11=deeptour")>=0)addEventListener("load",()=>setTimeout(g11RunDeep,1200));
else if(location.search.indexOf("g11=deep")>=0)addEventListener("load",()=>setTimeout(g11RunDeepHere,1200));
else if(location.search.indexOf("g11")>=0)addEventListener("load",()=>setTimeout(g11Run,1200));
