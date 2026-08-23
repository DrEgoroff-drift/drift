/* ══════════════ расхождение времён: уезд, где часам не верят ══════════════
   M136. Старый горняцкий уезд (06c, `hours`, игла `chrono`), живущий сменами
   и гудками — потому расползающееся расписание видно именно здесь. На окраине
   диспетчер извиняется за часы, смена выходит на десять минут раньше, деревня
   живёт по гудку. В ядре — работающий посёлок, в котором никого нет: автоматика
   кормит склад, в столовой горячее, автомат даёт верную сдачу.

   СМЕЩЕНИЕ РАСТЁТ К ЦЕНТРУ: минуты на окраине, часы у реактора. Хронометр
   корабля уходит по мере того, как идёшь вглубь — прибор и есть улика, лента
   хранит горб.

   ЛЮДИ ЗДЕСЬ, КАЖДЫЙ В СВОЁМ СЛОЕ. Днём — никого. Ночью — свет в окнах и
   тени за ними. В затмение один раз проходит человек, останавливается, видит
   вас секунду и идёт дальше. Больше это не повторяется.

   ПРАВИЛА ФАЙЛА:
   1. Не хоррор: ни скримера, ни записки, ни тела. Только быт, который идёт
      без людей, и стрелка, которая уходит.
   2. Смещение — функция одного расстояния (как невязка в 06b): глубина области,
      а на планете ядра ещё и расстояние до посёлка. Ничего не хранится.
   3. Хранится только факт, что человек уже прошёл (G.hours.man). */

const HOURS_ETHER=[
  "…диспетчер. За часы извините. По гудку работаем, по гудку.",
  "…вторая смена, вы рано. Рано, говорю. У вас десять минут лишних.",
  "…сверка времени: не проводится. Повторяю: не проводится. Слушайте гудок.",
  "…столовая, обед по гудку, не по часам. Кто по часам пришёл — ждите.",
  "…реактор, доложите смену. Реактор? …по гудку доложите.",
  "…часы на площадке снять, они людей путают. Снять, я сказал."
];
function hoursAll(){return (G.hours||(G.hours={man:0}));}
/* 0 вне области, 1 окраина, 2 ядро */
function hoursDepthAt(sx,sy){
  if(typeof regionAt!=="function")return 0;
  const R=regionAt(sx,sy);
  if(R.theme!=="hours")return 0;
  /* окраина — вся область, не только склон: ядро может сесть у края, и тогда
     склон шириной в клетку, а уезд без гудков и диспетчера — не уезд */
  return (R.core.sx===sx&&R.core.sy===sy)?2:1;
}
function hoursDepthHere(){return hoursDepthAt(G.sx,G.sy);}
/* планета ядра: первая, где может жить посёлок (12t) */
function hoursCorePlanet(sys){
  if(!sys||hoursDepthAt(sys.sx,sys.sy)!==2)return null;
  for(const p of sys.planets||[])if(typeof settleCanLive==="function"&&settleCanLive(p))return p;
  return null;
}
function hoursIsCore(p){const c=hoursCorePlanet(G.sys);return !!(c&&p&&c.idx===p.idx);}
/* ── смещение ──
   В минутах. Окраина: до десяти по глубине склона. Ядро: час на орбите, и по
   мере ходьбы к посёлку — до четырёх часов у самого реактора. */
function hoursOffset(){
  const d=hoursDepthHere();
  if(!d)return 0;
  if(d===1)return 10*Math.max(.3,regionDepth(G.sx,G.sy));
  let m=60;
  const S=G.surf;
  if(S&&hoursIsCore(S.p)&&typeof settleSpotX==="function"){
    const cx=settleSpotX(S.p,S.tr);
    if(cx!=null){const k=clamp(1-Math.abs(S.x-cx)/2600,0,1);m+=180*k;}
  }
  return m;
}
/* добавка к отклонению хронометра (25a-instr): ход в секундах на сутки
   от смещения — стрелка уходит, лента хранит горб */
function hoursDrift(){
  const m=hoursOffset();
  return m?m*.012:0;
}
/* окраина: строка эфира — изредка вместо обычной (11b) */
function hoursEtherLine(r){
  if(hoursDepthHere()!==1||r()>.35)return null;
  return pick(HOURS_ETHER,r);
}
/* в ядре людей не видно днём: дозорные не стоят, дым идёт */
function hoursNobody(p){return hoursIsCore(p);}
/* строка к посадке */
function hoursGroundLine(){
  const d=hoursDepthHere();
  if(!d)return null;
  if(d===1)return "Гудок. Часов на площадке нет — сняли.";
  return "Посёлок работает. Людей нет. Из столовой идёт пар.";
}
/* ── автомат ──
   Одно действие у посёлка ядра: монета — паёк — верная сдача. Ничего
   большего он не умеет, и это самое странное, что здесь есть. */
const HOURS_COIN=7;
function hoursMachineHere(S){
  return !!(S&&hoursIsCore(S.p)&&typeof settleSpotX==="function"&&Math.abs(S.x-(settleSpotX(S.p,S.tr)+70))<30);
}
function hoursMachine(){
  if(G.credits<HOURS_COIN){say("Автомат\nмонеты нет");return false;}
  G.credits-=HOURS_COIN;
  const k="organics";                                   // паёк: то же, чем кормят посёлок (12t)
  G.cargo[k]=(G.cargo[k]||0)+1;
  tell("good","Автомат: паёк ×1 · сдача верная","Автомат\nпаёк ×1\nсдача: до монеты");
  if(typeof heardAdd==="function")heardAdd("ground",{sx:G.sx,sy:G.sy,note:"автомат дал сдачу"},null);
  return true;
}
/* ── люди в слоях ──
   Зовётся из settleDraw после дворов. Ночью — окна и тени за ними. В затмение
   — один раз человек: идёт мимо, у игрока останавливается на секунду, смотрит
   и уходит. hoursAll().man=1 — и больше никогда. */
function hoursDrawPeople(S,tr,camx,camy,p,sx,n,r){
  if(!hoursIsCore(p))return;
  const nite=(typeof surfNight==="function")?surfNight(p):0;
  const dark=(typeof celDark==="function")?celDark():0;
  /* ночь: окна горят, за ними тени — посёлок ночной смены */
  if(nite>.15){
    for(let i=0;i<n;i++){
      const ox=sx+(i-(n-1)/2)*26, oy=groundAt(tr,ox+camx)-camy;
      const a=clamp((nite-.15)*2.5,0,1)*.8;
      ctx.fillStyle="rgba(255,214,150,"+a.toFixed(2)+")";ctx.fillRect(ox+3,oy-12,5,4.5);
      if(Math.sin(G.t*.01+i*2.1)>.3){ctx.fillStyle="rgba(30,24,18,"+(a*.9).toFixed(2)+")";ctx.fillRect(ox+4.5,oy-12,2,4.5);}
    }
  }
  /* затмение: человек, один раз */
  const H0=hoursAll();
  if(dark>.3&&!H0.man&&G.surf){
    const px=G.surf.x;
    if(H0.walk==null){H0.walk=px-260;H0.stop=0;}
    const wx=H0.walk, d=Math.abs(wx-px);
    if(d<26&&H0.stop<60){H0.stop++;}
    else H0.walk+=.9;
    const ox=wx-camx, oy=groundAt(tr,wx)-camy;
    ctx.fillStyle="rgba(20,24,30,.92)";
    ctx.fillRect(ox-1.8,oy-14,3.6,14);
    ctx.beginPath();ctx.arc(ox,oy-16.5,2.8,0,TAU);ctx.fill();
    if(d<26&&H0.stop>0&&H0.stop<60){ctx.fillStyle="rgba(226,236,240,.8)";ctx.fillRect(ox+(wx<px?1:-2),oy-17,1.2,1.2);}   /* смотрит */
    if(wx>px+320){H0.man=1;delete H0.walk;delete H0.stop;logAdd("dim","Прошёл мимо. Посмотрел. Больше никого.");}
  }else if(dark<=.3&&H0.walk!=null){delete H0.walk;delete H0.stop;}   /* затмение кончилось раньше — не судьба */
}
