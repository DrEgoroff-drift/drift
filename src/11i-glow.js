/* ══════════════ свет, который помнит: уезд вокруг Подглядки ══════════════
   M137-glow. M117 построил луг — мат, который держит упавший свет и отдаёт его
   в затмение. Здесь строится уезд вокруг (06c, `glow`, игла `actino`), чтобы
   луг находили по склону, а не по случайности.

   ОКРАИНА. Светящаяся флора — товар: из неё делают лампы, ею освещают площадки.
   Миры окраины ночью светятся ровно, и никто не думает об этом ничего.
   БЛИЖЕ. На планете ядра свет лежит пятнами, и пятна повторяют формы: колея,
   контур машины, прямоугольник фундамента. Фермеры знают и пожимают плечами:
   «после техники всегда так светится».
   ЯДРО — долина M117 с одним добавлением, которое ничего не стоит и удваивает
   её: СЦЕНЫ ИДУТ В ПОРЯДКЕ ГРОМКОСТИ, А НЕ ВРЕМЕНИ. Сначала самое яркое —
   пуск, прожектор; тихие видны только вплотную и в темноте. Игрок узнаёт
   конец первым и идёт вниз по громкости к началу. Последняя, самая тихая:
   человек бежит к обрыву и исчезает — смысл «паника», сведение «там вход».
   Устье пещеры на планете ядра стоит ровно там, куда он бежит.

   ПРАВИЛА ФАЙЛА:
   1. Ни одной подписи к показанному (правило луга). Подписей к пятнам нет тоже.
   2. Ничего не хранится: окраина и ядро — функция координат; мат и сцены —
      от зерна планеты; ярус показа — от номера прохода в этом затмении.
   3. Своего языка не заводим: те же фигуры `peepFigure`, тот же свет PEEP_LIT. */

function glowDepthAt(sx,sy){
  if(typeof regionAt!=="function")return 0;
  const R=regionAt(sx,sy);
  if(R.theme!=="glow")return 0;
  return (R.core.sx===sx&&R.core.sy===sy)?2:1;
}
function glowDepthHere(){return glowDepthAt(G.sx,G.sy);}
/* планета ядра: твёрдая и со спутником — без спутника не темнеет, и луг
   нечем оплатить (правило 2 луга) */
function glowCorePlanet(sys){
  if(!sys||glowDepthAt(sys.sx,sys.sy)!==2)return null;
  const ps=sys.planets||[];
  return ps.find(p=>p.type!=="gas"&&p.moons&&p.moons.length)||ps.find(p=>p.type!=="gas")||null;
}
function glowIsCore(p){const c=glowCorePlanet(G.sys);return !!(c&&p&&c.idx===p.idx);}
/* ── окраина: флора светится, площадка освещена ──
   Зовётся из enterSurface: все растения мира получают glow. Это не редкость,
   а быт — поэтому всем, а не каждому третьему. */
function glowDressFlora(plants){
  if(!glowDepthHere())return;
  for(const pl of plants)pl.glow=true;
}
/* площадка освещена той же флорой: кольцо банок со мхом на колышках вокруг плиты — тела движка (21piic).
   Днём мох в банке тусклый, зелёный — лампа видна как вещь; ночью светит холодным светом мха */
const GLOW_LAMP=[150/255,235/255,225/255];   /* PEEP_LIT (20c) — объявлен ниже по сборке */
/* светящийся мох — товар: скан растения в уезде кладёт в трюм ксенобиом */
function glowScan(pl){
  if(!glowDepthHere()||!pl||!pl.glow)return;
  G.cargo.xeno=(G.cargo.xeno||0)+1;
  logAdd("dim","Светящийся мох: в лампы идёт. +1 ксенобиом.");
}
/* ── планета ядра: пятна по формам ──
   Три пятна на мир, от зерна: колея (две пунктирные нитки), контур машины,
   прямоугольник фундамента. Видны только ночью, лежат на грунте тем же светом,
   что мат, — тела движка (21piic). Фермерская строка — в ground line. */
function glowPatches(tr,p){
  if(tr.glowP)return tr.glowP;
  const r=rng(hashi(p.seed|0,0x61,0x0D));
  const out=[],kinds=["rut","machine","found"];
  for(let i=0;i<3;i++){
    const x=clamp(tr.W*((i+.5)/3+(r()-.5)*.2),300,tr.W-300);
    out.push({k:kinds[i],x,w:90+r()*120,s:r()});
  }
  return tr.glowP=out;
}
function glowGroundLine(){
  const d=glowDepthHere();
  if(!d)return null;
  if(d===1)return "Ночью здесь светится всё. Лампы на площадке — из того же мха.";
  return "Светится пятнами. Фермер бы сказал: после техники всегда так.";
}
/* ── ядро: сцены по громкости ──
   Луг на планете ядра есть всегда (peepHere). За одно затмение проходы идут
   ярусами: 0 — громкий (с прожектором в начале, свет ×1.4), 1 — обычный,
   2 — тихий: один бегущий, в треть света, виден только вплотную, бежит к
   устью пещеры и пропадает. Ярус — от номера прохода (P.pass). */
const GLOW_TIERS=[{k:1.4,flash:1},{k:.9,flash:0},{k:.34,flash:0,run:1}];
function glowTier(P,p){
  if(!glowIsCore(p))return null;
  const t=GLOW_TIERS[(P.pass|0)%3];
  if(!t.run)return {k:t.k,flash:t.flash,scene:P.scene,near:0};
  /* бегущий: один, без ноши, в ту сторону, где устье; вдвое быстрее */
  return {k:t.k,flash:0,near:150,scene:{n:1,load:"",dir:P.scene.dir,beat:0,lag:0,fast:2}};
}
/* прожектор: столб света на старте громкого прохода */
function glowFlash(P,camx,camy,u){
  if(u>.18)return;
  const a=clamp((.18-u)/.18,0,1)*(P.dk||0)*.7;
  const x=P.x-camx,y=groundAt(G.surf.tr,P.x)-camy;
  const g=ctx.createLinearGradient(x,y,x,y-H*.9);
  g.addColorStop(0,rgba([255,244,214],a));g.addColorStop(1,rgba([255,244,214],0));
  ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x-6,y);ctx.lineTo(x+6,y);ctx.lineTo(x+40,y-H*.9);ctx.lineTo(x-40,y-H*.9);ctx.closePath();ctx.fill();
}
/* устье пещеры на планете ядра — там, куда бежит тихий: край мата по ходу */
function glowCaveX(peep,p){
  if(!peep||!glowIsCore(p))return null;
  return peep.x+peep.scene.dir*(peep.r+60);
}
