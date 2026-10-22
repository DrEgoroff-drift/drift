/* ══════════════ бой: второй глагол и дуэль (M902c, DESIGN-game §8, §10.6) ══════════════
   ОТПУСТИТЬ — второй глагол боя. Клавиша X, на телефоне — ЦЕЛЬ, удержанная полсекунды:
   одно место трюма уходит капсулой, взятый в захват пират берёт её и прыгает, одна строка
   в КНИЖКЕ его голосом. Шакал берёт любое — отдаём самое дешёвое; ветеран хочет самое
   дорогое; капитан берёт два самых дорогих (рук на борту в игре нет — люди летают на своих
   корпусах, §10.9); барон, ренегат, охотник и соперник не торгуются.

   ДУЭЛЬ — стрельбище, которое можно купить: минута против настоящего пирата ранга за 50 кр,
   строки пробы (§8) — отметка. Пират настоящий, бой настоящий; награды за него нет, корпус
   вернут, сбить вас он не может — «сбит» только кончает дуэль. Лучшее время по рангу — в записи. */
const LETGO_HOLD=600;
const LETGO_SAY=["Взял, что дали. Лети.","Самое дорогое — это по-нашему. Свидимся.",
  "Два места — по-честному. Трасса теперь платная, передай своим."];
const DUEL_FEE=50,DUEL_DANGER=.5;
/* отметка — верхняя граница строки «сбоку / кругами» пробы при .5 на стоковом «Стриже» */
const DUEL_RANKS=[{rk:0,ru:"ШАКАЛ",of:"с шакалом",mark:17},{rk:1,ru:"ВЕТЕРАН",of:"с ветераном",mark:18},
  {rk:2,ru:"КАПИТАН",of:"с капитаном",mark:38}];
/* ── ОТПУСТИТЬ ── */
function letGoSlots(){
  return RES_KEYS.filter(k=>(G.cargo[k]|0)>0)
    .map(k=>({k,n:G.cargo[k]|0,v:(G.cargo[k]|0)*((RES[k]&&RES[k].price)||0)}))
    .sort((a,b)=>a.v-b.v||(a.k<b.k?-1:1));
}
function letGoWho(p){
  p=p||(G.marks&&G.marks[0]);
  if(!p||!G.pirates||G.pirates.indexOf(p)<0||!(p.hull>0)||p.dummy||p.fled||p.paid)return null;
  return p;
}
function letGoTerms(p){
  if(p.spar)return {no:"на стрельбище не торгуются"};
  if(p.rogue||p.hunter||p.rival||(p.rank|0)>=3)return {no:"«"+p.name+"» не торгуется"};
  if(p.iff)return {no:"«"+p.name+"» воюет не с вами"};
  const S=letGoSlots();
  if(!S.length)return {no:"отдать нечего — трюм пуст"};
  const r=p.rank|0;
  return {take:r===0?[S[0]]:r===1?[S[S.length-1]]:S.slice(-2).reverse()};
}
function letGo(p){
  p=letGoWho(p);
  if(!p){say("ОТПУСТИТЬ — сперва возьмите пирата в захват",90);return false;}
  const T=letGoTerms(p);
  if(T.no){say(T.no,90);return false;}
  for(const s of T.take)G.cargo[s.k]=0;
  p.paid=1;p.jumpT=G.t+60;p.aware=true;
  const what=T.take.map(s=>((RES[s.k]&&RES[s.k].ru)||s.k)+" ×"+s.n).join(", ");
  const rest=G.pirates.some(q=>q!==p&&q.hull>0&&q.aware&&!q.iff&&!q.dummy&&!q.paid);
  logAdd("kill","Отпустили «"+p.name+"»: капсула — "+what+(rest?"":" · бой окончен"));
  if(typeof recordAdd==="function")recordAdd(p.name,LETGO_SAY[Math.min(2,p.rank|0)]);
  say("ОТПУСТИЛИ · "+what+"\n«"+p.name+"» взял капсулу и уходит",150);
  if(typeof sfx==="function")sfx("ui",{f:300,to:160,d:.25,v:.3});
  G.marks=G.marks.filter(m=>m!==p);
  return true;
}
/* взявший капсулу: прочь от вас, не стреляет, прыжок через секунду */
function letGoGone(p){
  if(G.t<p.jumpT)return false;
  p.hull=0;p.fled=1;
  if(typeof sfx==="function")sfx("ui",{f:180,to:90,d:.3,v:.3});
  return true;
}
const LG={t:0,pre:null,pad:0,hint:0};
function letGoKey(e){
  if(!e||e.code!=="KeyX"||e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;
  const t=e.target;if(t&&/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName||""))return;
  if(G.mode!=="system"||!letGoWho())return;
  letGo();
}
/* ЦЕЛЬ удержана: нажатие уже сменило захват (15a — по фронту), поэтому отпускаем того,
   кто был в захвате ДО нажатия */
function letGoPad(){
  if(LG.pad||typeof document==="undefined"||!document.getElementById)return;
  const b=document.getElementById("lockbtn");if(!b||!b.addEventListener)return;
  LG.pad=1;
  b.addEventListener("pointerdown",()=>{
    LG.pre=(G.marks&&G.marks[0])||null;clearTimeout(LG.t);
    LG.t=setTimeout(()=>{LG.t=0;const p=letGoWho(LG.pre);if(p&&G.mode==="system")letGo(p);},LETGO_HOLD);
  },true);
  const up=()=>{if(LG.t){clearTimeout(LG.t);LG.t=0;}};
  for(const ev of ["pointerup","pointercancel","pointerleave"])b.addEventListener(ev,up,true);
}
if(typeof addEventListener==="function")addEventListener("keydown",letGoKey);
/* ── ДУЭЛЬ ── */
function duelSt(){if(!G.duel||typeof G.duel!=="object")G.duel={best:{}};return G.duel;}
function duelNext(){const B=duelSt().best;for(const D of DUEL_RANKS)if(!(B[D.rk]>0))return D;return DUEL_RANKS[DUEL_RANKS.length-1];}
function duelOn(){return !!(G.range&&G.range.duel);}
function duelFoe(){return (G.pirates||[]).find(p=>p.spar)||null;}
function duelStart(rk){
  const D=DUEL_RANKS.find(x=>x.rk===rk)||duelNext();
  if(!rangeCanHere()){say("Дуэль — только у причала",90);return false;}
  if((G.credits|0)<DUEL_FEE){say("Дуэль стоит "+DUEL_FEE+" кр",90);return false;}
  if(!rangeStart())return false;
  G.credits-=DUEL_FEE;
  G.pirates=G.pirates.filter(p=>!p.dummy);G.marks=[];
  const R=PIRATE_RANKS[D.rk],S=G.sys.station,hp=(26+DUEL_DANGER*70)*R.hull;
  /* над кораблём: по линии от станции он вставал за угол экрана, под кнопку ЦЕЛЬ */
  const seed=hashi(0xD0E1,D.rk,(G.t|0)&0xffff)>>>0,a=-Math.PI/2;
  const p={x:G.ship.x+Math.cos(a)*300,y:G.ship.y+Math.sin(a)*300,vx:0,vy:0,a:a+Math.PI,
    hull:hp,hullMax:hp,name:(R.pre?R.pre+" ":"")+pick(PIRATE_NAMES,rng(seed)),rank:D.rk,seed,shipId:pirateShipId(seed),
    cool:60,aware:true,thrust:false,shield:hp*R.shield,shieldMax:hp*R.shield,shieldHit:0,
    shieldType:(PIRATE_LOADOUT[D.rk].shield||"solid"),deserter:0,spar:1};
  G.pirates.push(p);helmLock(p);
  G.range.duel={rk:D.rk};
  say("ДУЭЛЬ · "+D.ru+" · МИНУТА\nсбить под четверть — и он сдаётся\nотметка — "+D.mark+" с",180);
  return true;
}
function duelEnd(won,why){
  const R=G.range;if(!R||!R.duel)return null;
  const D=DUEL_RANKS.find(x=>x.rk===R.duel.rk)||DUEL_RANKS[0];
  const secs=Math.max(1,Math.round((RANGE_SEC*60-Math.max(0,R.left))/60));
  const lost=Math.max(0,Math.round((1-G.hull/Math.max(1,stat().hullMax))*100));
  G.pirates=G.pirates.filter(p=>!p.spar);
  const B=duelSt().best;
  if(won&&(!(B[D.rk]>0)||secs<B[D.rk]))B[D.rk]=secs;
  const line=won?"Дуэль "+D.of+": сдался на "+secs+" с, корпус −"+lost+" %"+(secs<=D.mark?" · на отметке":" · отметка "+D.mark+" с")
    :"Дуэль "+D.of+": "+why+" · отметка — "+D.mark+" с";
  rangeEnd();
  logAdd("kill",line);
  say((won?"ДУЭЛЬ ВЗЯТА":"ДУЭЛЬ НЕ ВЗЯТА")+"\n"+line.replace(/^Дуэль [^:]+: /,"")+"\nкорпус вернули",200);
  return {won,secs,lost};
}
function duelRestore(s){
  const d=s&&s.duel;G.duel=null;
  if(!d||typeof d!=="object"||!d.best||typeof d.best!=="object")return;
  const B={};for(const D of DUEL_RANKS){const v=+d.best[D.rk];if(isFinite(v)&&v>0)B[D.rk]=Math.round(v);}
  G.duel={best:B};
}
const FIGHT_HOOKS=[
  ["pirateRoleTick",O=>function(p,dt,d,want){
    if(p&&p.paid){roleSteer(p,want+Math.PI,dt,.05);roleThrust(p,dt,.07);return letGoGone(p);}
    letGoPad();
    if(!LG.hint&&p&&p.aware&&!p.iff&&!p.spar&&G.marks&&G.marks[0]===p&&letGoSlots().length){
      LG.hint=1;say("ЦЕЛЬ, удержанная (X), — ОТПУСТИТЬ:\nкапсула с грузом, и он уходит",150);
    }
    return O.apply(this,arguments);}],
  ["roleJumpDue",O=>function(p){if(p&&p.paid)return letGoGone(p);return O.apply(this,arguments);}],
  ["rangeTick",O=>function(dt){
    const R=G.range;
    if(R&&R.duel){
      const p=duelFoe();
      if(!p||p.hull<=0||p.hull/p.hullMax<.25){duelEnd(true);return;}
      if(R.left-dt<=0){duelEnd(false,"минута вышла");return;}
    }
    const r=O.apply(this,arguments);
    if(G.range&&G.range.duel){
      const p=duelFoe(),D=DUEL_RANKS.find(x=>x.rk===G.range.duel.rk);
      G.prompt="ДУЭЛЬ · "+(D?D.ru:"")+" · "+Math.max(0,G.range.left/60).toFixed(0)+" с\nОН "+
        (p?Math.round(p.hull/p.hullMax*100):0)+"% · ВЫ "+Math.round(G.hull/Math.max(1,stat().hullMax)*100)+"% · ОТМЕТКА "+(D?D.mark:0)+" с";
    }
    return r;}],
  ["killPirate",O=>function(p){if(p&&p.spar){duelEnd(true);return;}return O.apply(this,arguments);}],
  ["wreck",O=>function(){if(duelOn()){duelEnd(false,"сбит");return;}return O.apply(this,arguments);}],
  ["snapshot",O=>function(){const s=O.apply(this,arguments);if(s)s.duel=G.duel&&G.duel.best?{best:Object.assign({},G.duel.best)}:null;return s;}],
  /* отказ загрузки мира не трогает: времена читаются только из принятой записи */
  ["applySave",O=>function(s){const r=O.apply(this,arguments);if(r){try{duelRestore(s);}catch(e){G.duel=null;}}return r;}]
];
for(const [n,mk] of FIGHT_HOOKS){const O=window[n];if(typeof O!=="function")throw new Error("28r-fight: нет крючка "+n);window[n]=mk(O);}
