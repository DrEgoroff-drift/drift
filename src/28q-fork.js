/* ══════════════ развилки: дело — сам или рукой; засечки; Клинок (M911, DESIGN-game §7.2, §7.4) ══════════════
   1. У КАЖДОГО ДЕЛА ДВЕ СТОРОНЫ. Взять самому — шаг, часы, лицо (28m как было). Или отправить
      руку: свободный наёмник (без приказа, с кораблём) идёт сам — 85 % денег, минус груз по
      справочной цене и его оклад за дорогу, 3 % катастрофы (заложник: выкуп — дверь части III),
      а тот, кто выдал бумагу, записывает в книжку, что вы не пришли сами. Ни упрёка, ни штрафа:
      книга так устроена — люди помнят, вселенная прощает. Рука не бывает в прибыли: это ставка
      (правило CLAUDE.md про наёмников).
   2. ЗАСЕЧКА — ОДНА СТРОКА ДОСТУПА. Найденная (прочитанная) засечка «Долгого Хода» — дверь главы
      (28p, notch) и всегда строка доступа: кусок отчёта уже даёт адрес, слово или цену (12q);
      знакомая засечка, которой нечего дать, теперь даёт наводку на цены соседней станции или
      координату. Своя засечка под чужими — +настроение ближайшей станции (посёлок помнит).
   3. КЛИНОК — один раз за игру, в части VI (с главы 46). Гуся сел на мир за вашим баком: туда
      хватит, обратно — нет. Ни бумаги, ни таблички — одна строка Рыбы в приёмнике. Дошли — Клинок
      взят (дверь части VII). Кончилось топливо в пути или там — Рыба берёт на трос: единственный
      раз, когда игра сама протягивает руку, и «Стриж» по разнарядке в этот раз не предлагают.
   G.fork = {sent:[{it,seed,who,t0,back}], cold:{лицо:n}, lt}; G.blade = {st:1 позвала · 2 дошли ·
   3 на тросе Рыбы, sx, sy, nm, at}. */
const FORK_SHARE=.85,FORK_CAT=.03,FORK_TIME=.8,FORK_MIN=4;
function forkSt(){
  if(!G.fork||typeof G.fork!=="object"||!Array.isArray(G.fork.sent)||!G.fork.cold)G.fork={sent:[],cold:{},lt:null};
  return G.fork;
}
function forkBusy(c){return forkSt().sent.some(x=>x.seed===c.seed);}
function forkHands(){return (G.crew||[]).filter(c=>c&&!c.gone&&c.state!=="hostage"&&c.shipId&&(!c.order||c.order.kind==="home")&&!forkBusy(c));}
function forkMins(it){return Math.max(FORK_MIN,Math.round((it.est||10)*FORK_TIME));}
/* груз, который руке придётся купить: по справочной цене */
function forkGoods(it){let s=0;for(const L of it.legs)if(L.do==="cargo")s+=(L.qty|0)*((RES[L.k]&&RES[L.k].price)||0);return s;}
/* обе стороны пункта: сами — всегда; рукой — кто пойдёт, или почему некому */
function forkSides(it){
  const H=forkHands(),mins=forkMins(it);
  let hand=null,why="";
  if(!H.length)why="свободных рук нет";
  else if(now()+mins*60000>it.due)why="рука не успеет";
  else hand=H[0];
  return {self:true,hand,why,mins,pay:Math.max(0,Math.round(it.pay*FORK_SHARE-forkGoods(it)))};
}
function forkSend(id){
  const D=dispSt(),it=D.it.find(x=>x.id===id);if(!it)return false;
  const F=forkSides(it);if(!F.hand)return false;
  D.it.splice(D.it.indexOf(it),1);
  if(it.kind==="urg")dispAlarmOff();
  const t=now();
  forkSt().sent.push({it,seed:F.hand.seed,who:F.hand.name,t0:t,back:t+F.mins*60000});
  logAdd("dim",it.f.name+": «"+it.txt+"» — пошёл "+F.hand.name+" · вернётся через "+F.mins+" мин");
  return true;
}
/* оклад за дорогу: простой не оплачивается (12a), а дело — работа */
function forkWage(c,min){
  const due=Math.round(((typeof crewPay==="function")?crewPay(c):0)*min);
  const pay=Math.max(0,Math.min(G.credits,due));
  if(pay<=0)return 0;
  G.credits-=pay;c.spent=(c.spent||0)+pay;
  if(typeof coopCost==="function")coopCost(pay,"wages");
  return pay;
}
function forkTick(){
  const F=forkSt(),t=now();
  if(F.lt!=null&&typeof watchHanded==="function"&&watchHanded()){const dt=Math.max(0,t-F.lt);for(const s of F.sent){s.back+=dt;s.t0+=dt;}}
  F.lt=t;
  for(let i=F.sent.length-1;i>=0;i--){
    const s=F.sent[i];if(s.back>t)continue;
    F.sent.splice(i,1);
    const it=s.it,c=(G.crew||[]).find(x=>x.seed===s.seed),Fr=dispSysOf(it.from);
    if(!c||c.gone){logAdd("dim",it.f.name+": «Не дождались. Отдали другим.»");continue;}
    forkWage(c,(s.back-s.t0)/60000);
    const r=rng(hashi(it.id|0,s.seed>>>0,0x5E4D));
    if(r()<FORK_CAT&&c.shipId){
      const L=it.legs[it.legs.length-1],p=String(L.key).split(","),S=shipData(c.shipId);
      c.state="hostage";c.ransomBase=Math.round(600+it.pay*3+(S?S.cargo:40)*22);c.ransom=c.ransomBase;c.ransomAt=now();
      c.ransomSx=p[0]|0;c.ransomSy=p[1]|0;c.cargo={};
      if(!c.order)c.order={kind:"home",sx:c.ransomSx,sy:c.ransomSy};   /* выкуп (12b) читает приказ: свободная рука его не имела */
      if(Fr&&Fr.station&&typeof gaugeAdd==="function")gaugeAdd(Fr,0,-.03,0);
      logAdd("warn",c.name+" не вернулся с дела · взят в заложники · выкуп "+c.ransom.toLocaleString("ru")+" кр");
      continue;
    }
    it.pay=Math.max(0,Math.round(it.pay*FORK_SHARE-forkGoods(it)));
    dispDone(it);
    F.cold[it.f.name]=(F.cold[it.f.name]|0)+1;
    recordAdd(it.f.name,"дело сделал "+c.name+" · сами не пришли");
  }
}
/* строка пункта: вторая кнопка — РУКОЙ, когда есть кому; нет — сторона названа словами */
function forkRow(it,r){
  const F=forkSides(it),s=r&&r.querySelector?r.querySelector(".nm s"):null;
  if(s)s.insertAdjacentHTML("beforeend","<br>"+(F.hand?"или рукой: "+F.hand.name+" · "+F.mins+" мин · "+F.pay.toLocaleString("ru")+" кр":"или рукой — "+F.why));
  if(!F.hand||!r||!r.appendChild)return r;
  const b=el("button","act","РУКОЙ");
  b.onclick=()=>{sfx("ui");forkSend(it.id);renderTab();};
  /* две стороны — столбиком справа: на телефоне вторая кнопка не падает под лицо */
  const last=r.lastChild,box=el("div","fork");
  if(last&&last.tagName==="BUTTON"&&typeof r.removeChild==="function"){r.removeChild(last);box.appendChild(last);}
  box.appendChild(b);r.appendChild(box);
  return r;
}
/* ── засечка: строка доступа всегда ── */
function forkAccess(seed){
  const r=rng(hashi(seed>>>0,0xACC5,7));
  for(let i=0;i<40;i++){
    const sx=G.sx+Math.round((r()*2-1)*4),sy=G.sy+Math.round((r()*2-1)*4);
    if(!starAt(sx,sy))continue;const s=getSystem(sx,sy);
    if(!s||!s.station)continue;
    if(!G.market)G.market={};
    if(!G.market[s.key]){G.market[s.key]={pressure:{},t:now()};return "цены станции «"+s.station.name+"» ("+sx+":"+sy+")";}
  }
  for(let i=0;i<40;i++){
    const sx=G.sx+Math.round((r()*2-1)*8),sy=G.sy+Math.round((r()*2-1)*8);
    if(!starAt(sx,sy)||(sx===G.sx&&sy===G.sy))continue;
    if(typeof loreMarks==="function")loreMarks().push({sx,sy,id:"notch:"+(seed>>>0)});
    return "адрес: сектор "+sx+":"+sy;
  }
  return null;
}
/* сколько доступа у игрока: адреса на карте, цены станций, слова — до и после чтения */
function forkHave(){
  return [(typeof loreMarks==="function")?loreMarks().length:0,Object.keys(G.market||{}).length,(typeof loreVocab==="function")?loreVocab().length:0];
}
function forkNotch(q,id,res,pre){
  if(!res||!q||q.k!=="obelisk")return res;
  if(id==="read"&&pre){
    const now1=forkHave(),grew=now1.some((x,i)=>x>pre[i]);
    if(grew)res.access=res.msg;
    else{   /* кусок отчёта без адреса, цены и слова — или засечка знакомая: строку даёт сама засечка */
      const a=forkAccess(q.seed);
      if(a){res.msg+=" · "+a;res.access=a;logAdd("tech","Засечка: "+a);}
    }
  }
  if(id==="carve"&&res.way==="carve"&&typeof nearestStation==="function"&&typeof gaugeAdd==="function"){
    const S=nearestStation(G.sx,G.sy);if(S&&S.station)gaugeAdd(S,0,.05,0);
  }
  return res;
}
/* ── Клинок ── */
function bladeSt(){return G.blade&&typeof G.blade==="object"?G.blade:null;}
/* топливо пути: прыжками не длиннее радиуса, каждый — по цене карты (18-mode-map) */
function bladeHop(d){return (typeof mapJumpCost==="function")?mapJumpCost(d):Math.round(9+d*13);}
function bladeCost(d){const R=Math.max(1,stat().jump||3),k=Math.max(1,Math.ceil(d/(R+.02)));return k*bladeHop(d/k);}
/* мир за баком: без станции, с твёрдой землёй, туда хватает полного бака, обратно — нет */
function bladeTarget(){
  const st=stat(),fm=st.fuelMax,M=Math.ceil(fm/13);
  let best=null,bd=-1;
  for(let dx=-M;dx<=M;dx++)for(let dy=-M;dy<=M;dy++){
    const d=Math.hypot(dx,dy);if(d<1)continue;
    const sx=G.sx+dx,sy=G.sy+dy;if(!starAt(sx,sy))continue;
    const S=getSystem(sx,sy);if(!S||S.station||!dispLandable(S))continue;
    const c=bladeCost(d);if(c>fm)continue;
    const score=(c*2>fm?1000:0)-Math.abs(c-fm*.7);   /* ближе к «туда — две трети бака» */
    if(score>bd){bd=score;best=S;}
  }
  return best;
}
function bladeOn(){return typeof smenaIsOpen==="function"&&smenaIsOpen(46);}
function bladeTick(){
  if(bladeSt()||!bladeOn()||G.mode!=="system"||(typeof firstHour==="function"&&firstHour()))return null;
  const S=bladeTarget();if(!S)return null;
  G.blade={st:1,sx:S.sx,sy:S.sy,nm:S.name,at:now(),tow:0,got:0};
  const t="…Гуся сел на "+S.name+" ("+S.sx+":"+S.sy+"). Сам. Топлива у него нет. Я туда не долечу.";
  if(typeof consoleHeard==="function")consoleHeard(t,"Рыба");
  logAdd("ether","Рыба: "+t);
  return G.blade;
}
function bladeArrive(sx,sy){
  const B=bladeSt();if(!B||B.st!==1||sx!==B.sx||sy!==B.sy)return;
  B.st=2;B.got=now();
  if(typeof doorDeed==="function")doorDeed("blade");
  if(typeof deedAdd==="function")deedAdd("rescue",Math.max(1,Math.round(G.fuel)));
  const t="…ты зачем прилетел? Я же не просил. Ну. Раз прилетел — садись, подвинусь.";
  if(typeof consoleHeard==="function")consoleHeard(t,"Гуся");
  logAdd("ether","Гуся: "+t);
}
/* трос Рыбы: только пока Клинок взят или в пути, и только раз */
function bladeTowOk(){const B=bladeSt();return !!(B&&(B.st===1||B.st===2)&&!B.tow);}
function bladeTow(){
  const B=bladeSt();if(!bladeTowOk())return false;
  if(G.mode==="surface"&&G.surf){
    const p=G.surf.p;
    G.ship.x=p.x+Math.cos(p.ang)*(p.radius+150);G.ship.y=p.y+Math.sin(p.ang)*(p.radius+150);
    G.ship.vx=0;G.ship.vy=0;G.mode="system";G.surf=null;G.land=null;
  }
  if(B.st===1){B.st=2;B.got=now();if(typeof doorDeed==="function")doorDeed("blade");}
  B.tow=1;B.st=3;
  haulStart();
  if(typeof etherLine==="function")etherLine("…я рядом. Не спала, поэтому и рядом. Бросай трос.","Рыба");
  logAdd("ether","Рыба: «Бросай трос.»");
  return true;
}
/* ── запись ── */
function forkRestore(s){
  const f=s&&s.fork,b=s&&s.blade;G.fork=null;G.blade=null;
  const F=forkSt();
  if(f&&typeof f==="object"){
    if(Array.isArray(f.sent))for(const x of f.sent)if(x&&x.it&&Array.isArray(x.it.legs)&&x.it.legs.length&&x.it.f&&isFinite(x.back)&&x.back!==null&&isFinite(x.t0)&&x.t0!==null)
      F.sent.push({it:x.it,seed:x.seed>>>0,who:String(x.who||""),t0:+x.t0,back:+x.back});
    if(f.cold&&typeof f.cold==="object")for(const k in f.cold)F.cold[k]=f.cold[k]|0;
    F.lt=isFinite(f.lt)&&f.lt!==null?+f.lt:null;
  }
  if(b&&typeof b==="object"&&[1,2,3].indexOf(b.st)>=0&&isFinite(b.sx)&&isFinite(b.sy))
    G.blade={st:b.st,sx:b.sx|0,sy:b.sy|0,nm:String(b.nm||""),at:+b.at||now(),tow:b.tow?1:0,got:+b.got||0};
}
/* ── крючки — одной таблицей (как 28m–28p) ── */
const FORK_HOOKS=[
  ["dispRow",     O=>function(it){return forkRow(it,O.apply(this,arguments));}],
  ["mgrTick",     O=>function(){dispSafe(forkTick);dispSafe(bladeTick);return O.apply(this,arguments);}],
  ["plnActDo",    O=>function(q,id){const pre=q&&q.k==="obelisk"&&id==="read"?forkHave():null;return forkNotch(q,id,O.apply(this,arguments),pre);}],
  ["arriveSystem",O=>function(sx,sy){const r=O.apply(this,arguments);dispSafe(()=>bladeArrive(sx,sy));return r;}],
  ["rescueOffers",O=>function(){
    const out=O.apply(this,arguments);
    if(!bladeTowOk()||!rescueEmpty())return out;
    /* Рыба вместо буксира, метро и сброса: «Стриж» по разнарядке в этот раз не дают */
    return out.filter(x=>x.id==="home").concat([{id:"ryba",ru:"РЫБА",cost:0,sub:"Рыба рядом · берёт на трос до станции"}]);}],
  ["rescueTake",  O=>function(id){if(id==="ryba"){if(G.haul)return false;const ok=bladeTow();if(ok&&typeof saveGame==="function")saveGame(true);return ok;}return O.apply(this,arguments);}],
  ["snapshot",    O=>function(){const s=O.apply(this,arguments);s.fork=G.fork||null;s.blade=G.blade||null;return s;}],
  ["applySave",   O=>function(s){const r=O.apply(this,arguments);if(r)forkRestore(s);return r;}]
];
for(const [n,mk] of FORK_HOOKS){const O=window[n];if(typeof O!=="function")throw new Error("развилки: нет крючка "+n);window[n]=mk(O);}
