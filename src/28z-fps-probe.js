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
function g11Iv(sec){
  return new Promise(res=>{
    const d=[];let t0=0,tp=0;
    const tick=t=>{if(!t0)t0=tp=t;else{d.push(t-tp);tp=t;}
      if(t-t0<sec*1000){requestAnimationFrame(tick);return;}
      const s=d.slice().sort((a,b)=>a-b),q=k=>+(s[Math.min(s.length-1,Math.floor(s.length*k))]||0).toFixed(1);
      res({fps:Math.round(d.length/((t-t0)/1000)),p50:q(.5),p90:q(.9),ok:Math.round(100*d.filter(x=>x<=18.5).length/Math.max(1,d.length)),n45:d.filter(x=>x>=45).length});};
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
  ["neb",["gpuNebulaGen"]],["space",["gpuSpaceSys"]],["under",["gpuSysUnder"]],
  ["planets",["gpuPlanet","gpuMoon"]],["cities",["planetLightsOn"]],
  ["trails",["gpuWake","gpuTrail","gpuDrones"]],["combat",["gpuCombatEnergy"]],
  ["hullLight",["gpuHullLight"]],["points",["gpuLight"]],["refract",["gpuHaze","gpuShock"]],
  ["bloom","bloom"],["front2D","front"],["final","fin"]];
async function g11GpuDeep(put){
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const res={};
  for(const [key,what] of G11_GPU_KILL){
    const b=await g11Iv(1.5);
    const saved={};
    if(typeof what==="string")GPU.kill[what]=true;
    else for(const nm of what){if(typeof window[nm]==="function"){saved[nm]=window[nm];window[nm]=()=>{};}}
    await sleep(150);
    let v;try{v=await g11Iv(1.5);}
    finally{if(typeof what==="string")GPU.kill[what]=false;else for(const nm in saved)window[nm]=saved[nm];}
    res[key]=(v.fps-b.fps)+" ("+b.p50+"→"+v.p50+" мс)";
    put(key+" +"+res[key]);
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
  const out={dpr:devicePixelRatio,DPR,canvas:cvs.width+"×"+cvs.height,res:G.opts.gfx.res,RES_AUTO,resEma:+resEma.toFixed(1),
    ua:navigator.userAgent.slice(0,80)};
  put("DPR "+DPR+" · "+out.canvas+" · gfx.res "+out.res+" · RES_AUTO "+RES_AUTO);
  const g0=GNB.nGen|0,f0=GPU.frameNo;
  out.base=await g11Iv(3);put("база "+JSON.stringify(out.base));
  out.nebRegen=Math.round(100*((GNB.nGen|0)-g0)/Math.max(1,GPU.frameNo-f0))+"%";
  put("туманность пересчитана в "+out.nebRegen+" кадров");
  const err=[];
  try{out.gpu=await g11GpuDeep(put);}catch(e){err.push("gpu: "+(e&&e.message||e));}
  try{out.dpr2=await g11DprSweep(put);}catch(e){err.push("dpr: "+(e&&e.message||e));}
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
