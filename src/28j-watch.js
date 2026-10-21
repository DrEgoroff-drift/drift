/* ══════════════ участок, норма, сдача смены (M905 · DESIGN-game §3.2, §3.4, §10.2, §10.3, §10.5) ══════════════
   Наверху игры не было ничего, что говорило бы «что дальше»: у того, у кого всё есть, нет и дела.
   Теперь у игрока есть УЧАСТОК — квадрат 5×5 систем вокруг места, где его приняли на трассу, — и
   раз в сводку (шесть часов, 12am) план пишет его НОРМУ: какую долю нужд на станциях участка
   закрыли вовремя — баржи, артели, вы. Норма — бумага, а не полоса: строка на доске и в трудовой
   книжке, раз в сводку, голосом диспетчера участка.

   ПРАВИЛА ФАЙЛА:
   1. Судится только сыгранное: нужды считаются по окнам (12aa, четверть часа игры), прожитым в эту
      сводку за игрой; меньше двух окон — сводка не судится. Офлайн норму не портит.
   2. Нужда закрыта, если её закрыли вы (продажа, 12aa needClose) или чужие: доля чужих — от
      опасности системы, под блокадой (13b) — ноль. Наряд, сданный на станцию участка, — плюс.
   3. Порогов два, последствий — по одному (§10.2): ≥ 90 % три сводки подряд — разнарядка (станция
      назад, иначе корпус ступенью выше — не дороже «Обода», иначе ступень модуля; кредитов —
      никогда); < 60 % — строка срыва; три срыва подряд — станция уходит соседу, и люди этой
      станции больше вас не называют (дверь 11ah — тихо и навсегда).
   4. Диспетчер — один человек на участок (генератор людей, L3): встречает на первой стыковке,
      читает норму, держит смену, пока вас нет.
   5. Сдать смену — одно нажатие в меню (§10.5: уходя надолго) или на доске станции участка; пока
      сдана — не идёт ничего: ни бумага, ни оклады, ни руки, ни управляющие, ни дроны, ни норма;
      страхует только «Стриж». Метки времени тянутся за часами, и, приняв смену, вы не получаете
      долг за время отсутствия. Принять — у стойки любой станции. Смену держит сменщик — он и
      скажет, что застал.
   6. Участок живёт в G.uch, а не в G.watch: G.watch — камера, что следит за наёмником (27b),
      и она стирает всё, что не похоже на номер наёмника. */
const WATCH_R=2,WATCH_MIN_W=2,WATCH_HI=90,WATCH_LO=60,WATCH_RUN=3,WATCH_ALLOT_MAX=15000;
const WATCH_LET="АБВГДЕЖИКЛМНПРСТ";
/* имена делятся на два списка: у лица нет пола, но бывает борода (cpGene, 27f3) — бородатому
   женское имя не дают; гладкому — любое из восьми */
const WATCH_DISP_F=["Нина Аркадьевна","Валентина Сергеевна","Зоя Павловна","Тамара Ильинична","Клавдия Петровна"];
const WATCH_DISP_M=["Аркадий Львович","Семён Борисович","Илья Ефимович"];
const WATCH_DISP=WATCH_DISP_F.concat(WATCH_DISP_M);
const WATCH_RELIEF=["Пётр Кузьмич","Глеб Ильич","Остап Назарович","Фрол Демидович","Влас Никитич","Гордей Саввич"];
function watchSt(){
  if(!G.uch||typeof G.uch!=="object")G.uch={};
  const W=G.uch;
  if(!W.c||typeof W.c!=="object"){
    const H=G.home&&G.home.tier?G.home:null;   /* старое сохранение: участок — там, где дом */
    W.c={sx:H?H.sx|0:G.sx|0,sy:H?H.sy|0:G.sy|0};
  }
  if(!W.off||typeof W.off!=="object")W.off={};
  if(!W.fill||typeof W.fill!=="object")W.fill={};
  if(!Array.isArray(W.hist))W.hist=[];
  if(!W.run||typeof W.run!=="object")W.run={hi:0,lo:0};
  W.ord=W.ord|0;
  return W;
}
function watchSeed(){const W=watchSt();return hashi(W.c.sx,W.c.sy,0x57A7)>>>0;}
function watchName(){const s=watchSeed();return (10+s%90)+"-"+WATCH_LET[(s>>>8)%WATCH_LET.length];}
/* диспетчер участка: лицо и имя — от зерна участка, один человек на всё (§10.3) */
function watchDisp(){
  const s=watchSeed();
  const D={seed:hashi(s,0xD15,1)>>>0,role:"fact",acc:[78,112,150],age:38+s%22,loy:70,xp:0,traits:[]};
  const L=cpGene(D).beard?WATCH_DISP_M:WATCH_DISP;
  D.name=L[(s>>>4)%L.length];
  return D;
}
function watchIn(sx,sy){const W=watchSt();return Math.max(Math.abs(sx-W.c.sx),Math.abs(sy-W.c.sy))<=WATCH_R;}
function watchStations(){
  const W=watchSt(),out=[];
  for(let x=W.c.sx-WATCH_R;x<=W.c.sx+WATCH_R;x++)for(let y=W.c.sy-WATCH_R;y<=W.c.sy+WATCH_R;y++){
    if(!starAt(x,y))continue;
    const S=getSystem(x,y);
    if(S&&S.station&&S.station.prices&&!(S.key in W.off))out.push(S);
  }
  return out;
}
function watchHas(S){return !!(S&&S.station&&watchIn(S.sx,S.sy)&&!(S.key in watchSt().off));}
/* нужда станции в окне w — тот же расчёт, что needOf (12aa), без отметки «закрыта»: тест сверяет */
function watchNeedAt(S,w){
  const r=rng(hashi(S.sx,S.sy,0x4EED+w));
  if(r()>=NEED_P)return null;
  const keys=TRADE_KEYS.filter(k=>S.station.prices[k]);
  if(!keys.length)return null;
  return keys[Math.floor(r()*keys.length)];
}
function watchNpcRate(S){
  if(typeof occLvl==="function"&&occLvl(S.sx,S.sy)>=2)return 0;   /* блокада: баржи не ходят */
  return clamp(.66-.3*sysDanger(S.sx,S.sy),.3,.66);
}
function watchNpc(S,w){return rng(hashi(S.sx,S.sy,0x4F11+w))()<watchNpcRate(S);}
function watchHanded(){const W=G.uch;return !!(W&&W.hand);}
/* такт: окна этой сводки; новая сводка — суд над прошлой */
function watchTick(){
  const W=watchSt();
  if(W.hand)return null;
  const n=chronNow(),w=needWin();
  if(W.n==null||W.w0==null){W.n=n;W.w0=w;W.w1=w;return null;}
  if(n!==W.n){
    const rec=watchJudge(W);
    W.n=n;W.w0=w;W.w1=w;W.fill={};W.ord=0;
    return rec;
  }
  if(w<W.w0)W.w0=w;
  if(w>W.w1)W.w1=w;
  return null;
}
function watchJudge(W){
  W=W||watchSt();
  const nW=(W.w1|0)-(W.w0|0)+1;
  if(W.w0==null||nW<WATCH_MIN_W)return null;
  let tot=0,got=0,mine=0;
  for(const S of watchStations()){
    const F=W.fill[S.key]||[];
    for(let w=W.w0;w<=W.w1;w++){
      if(!watchNeedAt(S,w))continue;
      tot++;
      const my=F.indexOf(w)>=0;if(my)mine++;
      if(my||watchNpc(S,w))got++;
    }
  }
  tot+=W.ord;got+=W.ord;
  const norm=tot?Math.round(100*got/tot):100;
  const rec={n:W.n,norm,tot,mine,ord:W.ord};
  W.hist.push(rec);if(W.hist.length>8)W.hist.shift();
  W.last=rec;W.seen=0;
  const D=watchDisp(),nm=watchName();
  recordAdd(D.name,"Участок "+nm+". Норма "+norm+" %.");
  logAdd(norm<WATCH_LO?"warn":"dim","Сводка по участку "+nm+": норма "+norm+" %");
  if(norm>=WATCH_HI){W.run.hi++;W.run.lo=0;}
  else if(norm<WATCH_LO){W.run.lo++;W.run.hi=0;recordAdd("ГЛАВТРАССА","Участок "+nm+" не тянет. Отмечено.");}
  else{W.run.hi=0;W.run.lo=0;}
  if(W.run.lo>=WATCH_RUN){W.run.lo=0;rec.lost=watchReassign(W);}
  if(W.run.hi>=WATCH_RUN){W.run.hi=0;rec.allot=watchAllot(W);}
  return rec;
}
/* три срыва: дальняя от центра станция уходит соседу; последняя не уходит никогда */
function watchReassign(W){
  const L=watchStations();if(L.length<=1)return null;
  L.sort((a,b)=>(Math.max(Math.abs(b.sx-W.c.sx),Math.abs(b.sy-W.c.sy))-Math.max(Math.abs(a.sx-W.c.sx),Math.abs(a.sy-W.c.sy)))||(a.key<b.key?-1:1));
  const S=L[0];
  W.off[S.key]=W.n|0;
  if(typeof folkShut==="function")folkShut("st:"+S.key);
  recordAdd("ГЛАВТРАССА","Станция «"+S.station.name+"» передана участку соседа.");
  logAdd("bad","Три срыва подряд · станция «"+S.station.name+"» передана участку соседа");
  return S.station.name;
}
/* разнарядка за три сводки ≥ 90 %: станция назад, иначе корпус ступенью выше, иначе ступень модуля */
function watchAllot(W){
  const back=Object.keys(W.off).sort((a,b)=>(W.off[b]|0)-(W.off[a]|0))[0];
  if(back){
    delete W.off[back];
    const [sx,sy]=back.split(",").map(Number),S=getSystem(sx,sy),nm=S&&S.station?S.station.name:back;
    recordAdd("ГЛАВТРАССА","Станция «"+nm+"» возвращена участку.");
    logAdd("good","Норма три сводки подряд · станция «"+nm+"» снова ваша");
    return "станция «"+nm+"»";
  }
  let top=0;for(const id in G.owned)if(G.owned[id]&&SHIPS[id])top=Math.max(top,SHIPS[id].price|0);
  const next=Object.keys(SHIPS).filter(id=>!G.owned[id]&&(SHIPS[id].price|0)>top&&(SHIPS[id].price|0)<=WATCH_ALLOT_MAX)
    .sort((a,b)=>SHIPS[a].price-SHIPS[b].price)[0];
  if(next){
    G.owned[next]=true;
    if(typeof wearAll==="function")wearAll()[next]=Math.round(WEAR_FULL*.55);
    const ru="«"+SHIPS[next].ru+"»";
    recordAdd("ГЛАВТРАССА","Разнарядка: "+ru+" — за норму по участку.");
    logAdd("good","Разнарядка за норму: "+ru+" · б/у, с чужим износом · пересесть можно на верфи");
    if(typeof thingAdd==="function")thingAdd("paper","Разнарядка на "+ru,"за норму по участку "+watchName()+" · б/у, с чужим износом");
    return ru;
  }
  const k=Object.keys(MODS).filter(k=>MODS[k].base&&(G.modsOwned[k]|0)<4)
    .sort((a,b)=>modCost(a,G.modsOwned[a]|0)-modCost(b,G.modsOwned[b]|0))[0];
  if(k){
    G.modsOwned[k]=(G.modsOwned[k]|0)+1;
    recordAdd("ГЛАВТРАССА","Разнарядка: «"+MODS[k].ru+"», ступень "+G.modsOwned[k]+" — за норму по участку.");
    logAdd("good","Разнарядка за норму: «"+MODS[k].ru+"», ступень "+G.modsOwned[k]+" · ставится на ОСНАСТКЕ");
    return "«"+MODS[k].ru+"»";
  }
  return null;
}
/* ── сдать и принять смену ── */
function watchHand(){
  const W=watchSt();if(W.hand)return false;
  watchTick();   /* окна до сдачи — в сводку */
  const s=watchSeed();
  W.hand={at:now(),who:WATCH_RELIEF[(s>>>12)%WATCH_RELIEF.length],seen:now()};
  watchFreeze();
  recordAdd(watchDisp().name,"Смену по участку "+watchName()+" принял "+W.hand.who+".");
  logAdd("dim","Смена сдана · участок держит "+W.hand.who+" · счёт, люди, дроны и норма стоят");
  return true;
}
function watchBack(){
  const W=watchSt();if(!W.hand)return null;
  watchFreeze();
  const h=(now()-W.hand.at)/3600000,who=W.hand.who;
  const line=h<1?"Ничего не случилось. Даже чаю не успел."
    :h<24?"Принимайте. Станции на месте, люди на месте."
    :h<24*7?"Долго вас не было. Участок держал как мог."
    :"Думал, вы уже не вернётесь. Принимайте, пока не передумали.";
  W.hand=null;
  const B=billSt();if(B.from!=null)B.from=now();
  W.n=chronNow();W.w0=needWin();W.w1=W.w0;W.fill={};W.ord=0;   /* сводка возврата судится с этой минуты */
  recordAdd(who,line);
  logAdd("dim","Смена принята · "+who+": «"+line+"»");
  return line;
}
/* пока смена сдана, часы стоят: метки тянутся за временем, долга за отсутствие нет */
function watchFreeze(){
  const W=G.uch;if(!W||!W.hand)return;
  const t=clockNow(),dt=Math.max(0,t-(W.hand.seen||t));
  W.hand.seen=t;
  for(const c of G.crew||[]){if(c.tMs)c.tMs=t;if(c.ransomAt)c.ransomAt+=dt;}
  for(const m of G.mgrs||[])if(m.tMs)m.tMs=t;
  for(const d of G.drones||[]){d.lastMs=t;d.t0=(d.t0||t)+dt;}
  const B=G.bill;if(B&&B.from!=null)B.from=now();
}
const WATCH_OLD_DRONES=tickDrones;
tickDrones=function(){if(watchHanded()){watchFreeze();return;}return WATCH_OLD_DRONES.apply(this,arguments);};
const WATCH_OLD_CREW=crewTick;
crewTick=function(){if(watchHanded()){watchFreeze();return;}return WATCH_OLD_CREW.apply(this,arguments);};
const WATCH_OLD_MGR=mgrTick;
mgrTick=function(){
  if(watchHanded()){watchFreeze();return;}
  try{watchTick();}catch(e){logAdd("warn","СБОЙ · участок: "+(e&&e.message));}
  return WATCH_OLD_MGR.apply(this,arguments);
};
const WATCH_OLD_INSON=insOn;
insOn=function(id){return watchHanded()?id==="strizh":WATCH_OLD_INSON.apply(this,arguments);};
/* бумага: пока смена сдана, смена счёта не закрывается (окно стоит на «сейчас») */
const WATCH_OLD_OPEN=openStation;
openStation=function(){watchFreeze();return WATCH_OLD_OPEN.apply(this,arguments);};
/* закрытая вами нужда и сданный наряд — в норму участка */
const WATCH_OLD_NEED=needClose;
needClose=function(sys,k){
  const r=WATCH_OLD_NEED.apply(this,arguments);
  if(r&&!watchHanded()&&watchHas(sys)){
    const W=watchSt();watchTick();
    const N=needAll()[sys.key],w=N?N.win:needWin();
    (W.fill[sys.key]=W.fill[sys.key]||[]).push(w);
  }
  return r;
};
const WATCH_OLD_ORDER=orderDeliver;
orderDeliver=function(){
  const sys=G.sys,r=WATCH_OLD_ORDER.apply(this,arguments);
  if(r&&!watchHanded()&&watchHas(sys)){watchTick();watchSt().ord++;}
  return r;
};
/* ── плашка на доске: участок, диспетчер, норма, смена ── */
function watchSection(){
  if(!G.sys||!G.sys.station)return;
  const W=watchSt(),here=watchHas(G.sys);
  if(!here&&!W.hand&&!(W.last&&!W.seen))return;
  const D=watchDisp(),nm=watchName(),L=W.last;
  secHead("УЧАСТОК "+nm,{count:L?"норма "+L.norm+" %":"станций "+watchStations().length});
  const line=W.hand?"Смену держит "+W.hand.who+". Вернётесь — примете."
    :!W.met?"Участок "+nm+" ваш: "+watchStations().length+" станций вокруг "+((starAt(W.c.sx,W.c.sy)&&getSystem(W.c.sx,W.c.sy).name)||"места приёма")+". Норму пишем раз в сводку — по всем, кто возит."
    :L?"Участок "+nm+". Норма "+L.norm+" %."+(L.norm<WATCH_LO?" Не тянем.":L.norm>=WATCH_HI?" Так держать.":"")
    :"Сводки по участку ещё не было. Нужды на станциях — ваши.";
  W.met=1;W.seen=1;
  const r=el("div","row");
  r.appendChild(faceEl(D,56));
  const past=W.hist.slice(-5).map(x=>x.norm+" %").join(" · ");
  r.appendChild(el("div","nm","<b>"+D.name+" · диспетчер участка</b><s>«"+line+"»"+
    (past&&W.hist.length>1?"<br>прошлые сводки: "+past:"")+
    (!here?"<br>эта станция — не ваш участок":"")+"</s>"));
  $body.appendChild(r);
  if(L&&(L.lost||L.allot))$body.appendChild(el("div","row","<div class='nm'><b>"+(L.lost?"станция «"+L.lost+"» передана соседу":"разнарядка: "+L.allot)+
    "</b><s>"+(L.lost?"три срыва подряд — участок меньше":"три сводки подряд не ниже 90 %")+"</s></div>"));
  if(here||W.hand){
    const s=el("div","row");
    s.appendChild(el("div","nm",W.hand
      ?"<b>смена сдана · "+Math.max(1,Math.round((now()-W.hand.at)/60000))+" мин</b><s>счёт, оклады, руки, дроны и норма стоят; страхует только «Стриж»</s>"
      :"<b>уезжаете надолго?</b><s>сданная смена: ни бумаги, ни окладов, ни нормы; люди и дроны стоят; страхует только «Стриж»</s>"));
    const b=el("button","act"+(W.hand?" gold":""),W.hand?"ПРИНЯТЬ СМЕНУ":"СДАТЬ СМЕНУ");
    b.onclick=()=>{sfx("ui");if(watchHanded())watchBack();else watchHand();renderTab();};
    s.appendChild(b);$body.appendChild(s);
  }
}
LANE_RX.unshift([/^УЧАСТОК/i,"you"]);
const WATCH_OLD_BOARD=stTabBoard;
stTabBoard=function(){watchSection();return WATCH_OLD_BOARD.apply(this,arguments);};
/* запись: G.uch — в снимок и обратно (белый список 14-save не трогаем — обёртка) */
const WATCH_OLD_SNAP=snapshot;
snapshot=function(){const s=WATCH_OLD_SNAP.apply(this,arguments);s.uch=G.uch||null;return s;};
const WATCH_OLD_APPLY=applySave;
applySave=function(s){
  const r=WATCH_OLD_APPLY.apply(this,arguments);
  if(!r)return r;   /* отказ: мир не тронут (91qo) */
  const b=s&&s.uch;G.uch=null;
  if(b&&typeof b==="object"){
    const W=watchSt();
    if(b.c&&isFinite(b.c.sx)&&isFinite(b.c.sy))W.c={sx:b.c.sx|0,sy:b.c.sy|0};
    if(b.off&&typeof b.off==="object")for(const k in b.off)W.off[k]=b.off[k]|0;
    if(b.fill&&typeof b.fill==="object")for(const k in b.fill)if(Array.isArray(b.fill[k]))W.fill[k]=b.fill[k].map(x=>x|0);
    if(Array.isArray(b.hist))W.hist=b.hist.filter(x=>x&&isFinite(x.norm)).slice(-8);
    if(b.run)W.run={hi:b.run.hi|0,lo:b.run.lo|0};
    W.ord=b.ord|0;W.met=b.met?1:0;W.seen=b.seen?1:0;
    if(b.n!=null)W.n=b.n|0;
    if(b.w0!=null){W.w0=b.w0|0;W.w1=(b.w1!=null?b.w1:b.w0)|0;}
    if(b.last&&isFinite(b.last.norm))W.last=b.last;
    if(b.hand&&typeof b.hand==="object")W.hand={at:+b.hand.at||now(),who:String(b.hand.who||WATCH_RELIEF[0]),seen:+b.hand.seen||+b.hand.at||now()};
  }
  return r;
};
/* ── меню: СДАТЬ СМЕНУ (§10.5) ──
   Выхода из браузерной игры нет — есть закрытая вкладка. Поэтому сдача — пункт меню рядом с
   НАСТРОЙКАМИ, с бумажного часа (раньше нечему набегать). Пока смена сдана, пункт говорит, кто
   держит, и у стойки принимает её обратно. */
function watchMenuSync(){
  const b=document.getElementById("watchbtn");if(!b)return;
  const W=G.uch,h=!!(W&&W.hand);
  const on=h||(G.flownMs||0)>=FIRST_HOUR_MS;
  b.style.display=on?"":"none";
  if(!on)return;
  const dock=G.mode==="dock";
  b.querySelector("em").textContent=h?(dock?"ПРИНЯТЬ СМЕНУ":"СМЕНА СДАНА"):"СДАТЬ СМЕНУ";
  b.querySelector("s").textContent=h?("держит "+W.hand.who+(dock?"":" · принять — у стойки")):
    "надолго? ничего не пойдёт и не набежит";
}
function watchMenuTap(){
  toggleMenu(false);
  if(!watchHanded()){
    if(!watchHand())return;
    say("Смену принял "+G.uch.hand.who+"\nничего не идёт, ничего не набегает",200);
  }else if(G.mode==="dock"){
    const who=G.uch.hand.who,line=watchBack();
    if(line)say(who+":\n«"+line+"»",240);
    if(typeof renderTab==="function")renderTab();
  }else{say("Принять смену — у стойки\nлюбой станции",160);return;}
  if(typeof saveGame==="function")saveGame(true);
}
{
  const M=document.getElementById("menu"),opt=document.getElementById("optbtn");
  if(M&&opt&&typeof M.insertBefore==="function"&&!document.getElementById("watchbtn")){
    const b=document.createElement("button");b.id="watchbtn";b.style.display="none";
    b.innerHTML="<svg viewBox='0 0 16 16'><path d='M6 2.5h4v3.2l2.2 2.1V10H3.8V7.8L6 5.7z'/><path d='M3 13h10'/></svg>"+
      "<span class='tx'><em>СДАТЬ СМЕНУ</em><s></s></span>";
    M.insertBefore(b,opt);
    b.addEventListener("click",watchMenuTap);
  }
}
const WATCH_OLD_MENU=toggleMenu;
toggleMenu=function(on){
  const r=WATCH_OLD_MENU.apply(this,arguments);
  if($menu.classList.contains("open"))watchMenuSync();
  return r;
};
