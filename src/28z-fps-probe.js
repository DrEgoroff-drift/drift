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
      startScoop(s.planets.find(p=>p.type==="gas"));}]];
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
    out.system=await g11Deep(["drawSysNebula","drawStars","drawSpaceDust","drawStarBody",
      "drawBeltRing","planetDraw","drawRing","drawTrail","drawBarges","drawFinds"]);
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
if(location.search.indexOf("g11=deep")>=0)addEventListener("load",()=>setTimeout(g11RunDeep,1200));
else if(location.search.indexOf("g11")>=0)addEventListener("load",()=>setTimeout(g11Run,1200));
