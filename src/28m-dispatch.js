/* ══════════════ диспетчер: дело есть всегда (M907 · DESIGN-game §4.3) ══════════════
   Доска говорила «что здесь есть», а не «что вам делать». Теперь на каждой стыковке полоса К ВАМ
   держит четыре бумаги, адресованные вам по имени: один привоз, одно дело без груза, одно «сейчас
   или никогда» (меньше десяти минут настоящих) и один длинный наряд на три станции. Это генератор,
   а не расписание: он не придумывает мир, он читает станции вокруг и пишет, чего им не хватает.

   ПРАВИЛА ФАЙЛА:
   1. Четыре места (haul / task / urg / long). На стыковке пустое место заполняется; взятое
      не нужно — всё, что на полосе, уже ваше. Не сделали к сроку — бумага уходит, а станция
      помнит (шкала §4.2: склад, люди или порядок — по роду дела). Деньги — только earn().
   2. Глагол не повторяется в окне из пяти выдач подряд (G.disp.vb) и не дублирует живой пункт.
   3. Веса — по трём шкалам станции, что выдаёт (28l): пустой склад пишет привозы, хмурые люди —
      людей (довезти, доктор, поговорить), низкий порядок — «Отбить» и проводку баржи.
   4. У каждого пункта лицо (генератор людей, L3) и часы (now(), реальные минуты). Длинный наряд
      пишет диспетчер участка (28j) — её лицо.
   5. Вместимость больше часа: оценка минут четырёх пунктов (DISP_MIN + DISP_JUMP_MIN на прыжок)
      — не меньше шестидесяти; выбираете вы, брошенное уходит в каскад.
   6. Детерминизм: случай — rng(hashi(станция, номер выдачи)), время — now(). Пока смена сдана
      (28j), часы пунктов стоят: срок сдвигается на время отсутствия.
   7. Шаги пункта (legs) — исполнимые вещи, а не подписи: cargo (сдать груз кнопкой), dock
      (пристыковаться), arrive (оказаться в системе), land (сесть на планету), kill (сбить пирата
      в системе), cant (зайти в кантину станции). Каждый шаг ловится обёрткой настоящей функции. */
const DISP_WIN=5,DISP_MIN={haul:12,task:14,urg:6,long:24},DISP_JUMP_MIN=3;
const DISP_LIFE={haul:[35,50],task:[25,40],urg:[6,9.5],long:[60,75]};   /* минуты настоящие */
const DISP_KINDS=["urg","haul","task","long"];
const DISP_NAMES=["Фёдор Лукич","Анна Тихоновна","Мирон Саввич","Лидия Карповна","Ефим Гаврилович","Раиса Петровна",
  "Тарас Ильич","Ольга Демьяновна","Никита Фомич","Вера Остаповна","Кирилл Агеевич","Марфа Игнатьевна",
  "Степан Родионович","Галина Яковлевна","Прохор Данилович","Евдокия Марковна","Захар Нилович","Ирина Фадеевна"];
const DISP_ACC=[[196,150,92],[120,168,140],[150,120,190],[200,110,90],[110,150,200],[180,170,110]];
/* глаголы: род места, класс шкалы (s склад, m люди, o порядок, "" — ничей), кто просит, кнопка, сборка */
const DISP_V={
  privezti:{kind:"haul",cls:"s",at:1,who:"смотритель",mk:dispMkBring,btn:"СДАТЬ"},
  zapas:   {kind:"haul",cls:"s",at:1,who:"кладовщица",mk:dispMkBring,btn:"СДАТЬ"},
  otvezti: {kind:"haul",cls:"",at:1, who:"смотритель",mk:dispMkTake,btn:"СДАТЬ"},
  kaskad:  {kind:"haul",cls:"", who:"мастер цеха",mk:dispMkCasc,btn:"СДАТЬ"},
  remont:  {kind:"haul",cls:"o",who:"мастер верфи",mk:dispMkYard,btn:"СДАТЬ"},
  proba:   {kind:"task",cls:"",at:1, who:"лаборант института",mk:dispMkLand,btn:"СДАТЬ"},
  znak:    {kind:"task",cls:"",at:1, who:"наблюдатель обсерватории",mk:dispMkLand,btn:"СДАТЬ"},
  chel:    {kind:"task",cls:"m",at:1,who:"смотритель",mk:dispMkCarry,btn:"СДАТЬ"},
  vrach:   {kind:"task",cls:"m",at:1,who:"фельдшер",mk:dispMkDoc,btn:"СДАТЬ"},
  razgovor:{kind:"task",cls:"m",at:1,who:"смотритель",mk:dispMkTalk,btn:"СДАТЬ"},
  konvoy:  {kind:"task",cls:"o",who:"шкипер баржи",mk:dispMkEscort,btn:"СДАТЬ"},
  otbit:   {kind:"task",cls:"o",who:"старший охраны",mk:dispMkRepel,btn:"СДАТЬ"},
  kapsula: {kind:"urg", cls:"", who:"шкипер баржи",mk:dispMkPod,btn:"СДАТЬ"},
  sosed:   {kind:"urg", cls:"o",who:"смотритель соседей",mk:dispMkDoor,btn:"СДАТЬ"},
  dvoynaya:{kind:"urg", cls:"s",who:"кладовщица",mk:dispMkDouble,btn:"СДАТЬ"},
  uhodit:  {kind:"urg", cls:"m",who:"попутчик",mk:dispMkLeave,btn:"СДАТЬ"},
  sos:     {kind:"urg", cls:"", who:"вахтенный эфира",mk:dispMkSos,btn:"СДАТЬ"},
  tri:     {kind:"long",cls:"", who:"диспетчер участка",mk:dispMkTri,btn:"СДАТЬ"},
  obhod:   {kind:"long",cls:"", who:"диспетчер участка",mk:dispMkRound,btn:"СДАТЬ"},
  sbor:    {kind:"long",cls:"", who:"диспетчер участка",mk:dispMkPost,btn:"СДАТЬ"}
};
function dispSt(){
  if(!G.disp||typeof G.disp!=="object")G.disp={};
  const D=G.disp;
  if(!Array.isArray(D.it))D.it=[];
  if(!Array.isArray(D.vb))D.vb=[];
  D.seq=D.seq|0;D.done=D.done|0;D.lost=D.lost|0;
  return D;
}
function dispSysOf(key){const p=String(key).split(",");const x=p[0]|0,y=p[1]|0;return starAt(x,y)?getSystem(x,y):null;}
function dispHop(a,b){const A=String(a).split(","),B=String(b).split(",");return Math.max(Math.abs((A[0]|0)-(B[0]|0)),Math.abs((A[1]|0)-(B[1]|0)));}
function dispR10(x){return Math.max(10,Math.round(x/10)*10);}
function dispRu(k){return RES[k].ru.toLowerCase();}
function dispQ(k,q){return dispRu(k)+", "+q+" "+pl3(q,"единица","единицы","единиц");}
function dispSn(key){const S=dispSysOf(key);return S&&S.station?"«"+S.station.name+"»":S?S.name:key;}
/* станции вокруг: d от rmin до rmax, в порядке ключа — случай выбирает, порядок не плавает */
function dispNear(S,rmin,rmax,memo){
  const id=S.key+"/"+rmin+"/"+rmax;
  if(memo&&memo[id])return memo[id];
  const out=[];
  for(let x=S.sx-rmax;x<=S.sx+rmax;x++)for(let y=S.sy-rmax;y<=S.sy+rmax;y++){
    const d=Math.max(Math.abs(x-S.sx),Math.abs(y-S.sy));
    if(d<rmin||!starAt(x,y))continue;
    const N=getSystem(x,y);
    if(N&&N.station&&N.station.prices)out.push(N);
  }
  if(memo)memo[id]=out;
  return out;
}
function dispLandable(S){return !!(S&&S.planets&&S.planets.some(p=>p.type!=="gas"));}
function dispPick(r,L){return L.length?L[Math.floor(r()*L.length)]:null;}
function dispGood(r,S,also){
  const keys=TRADE_KEYS.filter(k=>S.station.prices[k]&&(!also||also.station.prices[k]));
  return dispPick(r,keys);
}
function dispPath(from,legs){let p=0,a=from;for(const L of legs){p+=dispHop(a,L.key);a=L.key;}return p;}
/* ── сборка пунктов: (r, C) → {legs, txt, pay} или null; C = {S, g, memo} ── */
function dispMkBring(r,C,v){
  const S=C.S,k=dispGood(r,S);if(!k)return null;
  const qty=6+Math.floor(r()*9);
  const txt=v==="zapas"?"Склад пустой: "+dispQ(k,qty)+" сюда, на "+dispSn(S.key)+", — где найдёте подешевле."
    :"Привезите "+dispQ(k,qty)+" к нам, на "+dispSn(S.key)+". Своё кончилось.";
  return {legs:[{key:S.key,do:"cargo",k,qty}],txt,pay:dispR10(qty*RES[k].price*1.4+260)};
}
function dispMkTake(r,C){
  const T=dispPick(r,dispNear(C.S,1,3,C.memo));if(!T)return null;
  const k=dispGood(r,C.S,T);if(!k)return null;
  const qty=8+Math.floor(r()*8),d=dispHop(C.S.key,T.key);
  return {legs:[{key:T.key,do:"cargo",k,qty}],txt:"Отвезите "+dispQ(k,qty)+" на "+dispSn(T.key)+": там ждут, а у нас некому.",
    pay:dispR10(qty*RES[k].price*1.4+d*110)};
}
function dispMkCasc(r,C){
  const L=dispNear(C.S,0,3,C.memo).filter(N=>typeof gaugeCascAt==="function"&&gaugeCascAt(N));
  const T=dispPick(r,L);if(!T)return null;
  const k=gaugeCascAt(T).k,qty=6+Math.floor(r()*6),d=dispHop(C.S.key,T.key);
  return {legs:[{key:T.key,do:"cargo",k,qty}],txt:"У соседей встал цех — на "+dispSn(T.key)+": "+dispQ(k,qty)+". Выручите.",
    pay:dispR10(qty*RES[k].price*1.6+d*120)};
}
function dispMkYard(r,C){
  const T=dispPick(r,dispNear(C.S,1,3,C.memo));if(!T)return null;
  const M=["iron","titan","carbon","silicon"].filter(k=>RES[k]&&T.station.prices[k]);
  const k=dispPick(r,M.length?M:TRADE_KEYS.filter(k=>T.station.prices[k]));if(!k)return null;
  const qty=6+Math.floor(r()*7),d=dispHop(C.S.key,T.key);
  return {legs:[{key:T.key,do:"cargo",k,qty}],txt:"Верфи на "+dispSn(T.key)+" на ремонт: "+dispQ(k,qty)+". Корпуса стоят.",
    pay:dispR10(qty*RES[k].price*1.45+d*110)};
}
function dispMkLand(r,C,v){
  const L=[C.S].concat(dispNear(C.S,1,3,C.memo)).filter(dispLandable);
  /* система без станции тоже годится: планеты есть везде, где есть звезда */
  for(let x=C.S.sx-2;x<=C.S.sx+2&&L.length<4;x++)for(let y=C.S.sy-2;y<=C.S.sy+2;y++){
    if(!starAt(x,y))continue;const N=getSystem(x,y);if(N&&!N.station&&dispLandable(N))L.push(N);
  }
  const T=dispPick(r,L);if(!T)return null;
  const P=T.planets.filter(p=>p.type!=="gas")[0],d=dispHop(C.S.key,T.key);
  const txt=v==="znak"?"Обсерватории нужна запись с места: сядьте на "+P.name+", пройдите к ориентиру, запись — сюда."
    :"Институт ждёт пробу грунта с "+P.name+". Сесть, взять, привезти к нам.";
  return {legs:[{key:T.key,do:"land"},{key:C.S.key,do:"dock"}],txt,pay:dispR10(300+d*2*140)};
}
function dispMkCarry(r,C){
  const T=dispPick(r,dispNear(C.S,1,3,C.memo));if(!T)return null;
  return {legs:[{key:T.key,do:"dock"}],txt:"Довезите нашего человека до "+dispSn(T.key)+". Билета нет, а надо.",
    pay:dispR10(240+dispHop(C.S.key,T.key)*150)};
}
function dispMkDoc(r,C){
  const T=dispPick(r,dispNear(C.S,1,3,C.memo));if(!T)return null;
  return {legs:[{key:T.key,do:"dock"},{key:C.S.key,do:"dock"}],txt:"Привезите доктора с "+dispSn(T.key)+". У нас люди сдают.",
    pay:dispR10(300+dispHop(C.S.key,T.key)*2*140)};
}
function dispMkTalk(r,C){
  const T=dispPick(r,dispNear(C.S,0,2,C.memo));if(!T)return null;
  const legs=T.key===C.S.key?[{key:T.key,do:"cant"}]:[{key:T.key,do:"cant"},{key:C.S.key,do:"dock"}];
  return {legs,txt:"В кантине "+dispSn(T.key)+" сидит наш человек. Поговорите — что скажет, передайте нам.",
    pay:dispR10(200+dispHop(C.S.key,T.key)*2*120)};
}
function dispMkEscort(r,C){
  const T=dispPick(r,dispNear(C.S,1,2,C.memo));if(!T)return null;
  return {legs:[{key:T.key,do:"arrive"}],txt:"Баржа идёт на "+dispSn(T.key)+" — пройдите прыжком рядом. Одной страшно.",
    pay:dispR10(320+dispHop(C.S.key,T.key)*150)};
}
function dispMkRepel(r,C){
  const T=dispPick(r,[C.S].concat(dispNear(C.S,1,1,C.memo)));if(!T)return null;
  return {legs:[{key:T.key,do:"kill"},{key:T.key,do:"dock"}],txt:"У "+dispSn(T.key)+" крутится пират. Отбейте — и доложите на станции.",
    pay:dispR10(650+dispHop(C.S.key,T.key)*150)};
}
function dispMkPod(r,C){
  const T=dispPick(r,dispNear(C.S,1,2,C.memo));if(!T)return null;
  return {legs:[{key:T.key,do:"arrive"}],txt:"Капсула с баржи дрейфует у "+dispSn(T.key)+". Воздуха на восемь минут — подберите.",
    pay:dispR10(450+dispHop(C.S.key,T.key)*150)};
}
function dispMkDoor(r,C){
  const T=dispPick(r,dispNear(C.S,1,2,C.memo));if(!T)return null;
  return {legs:[{key:T.key,do:"arrive"}],txt:"Пират у дверей "+dispSn(T.key)+". Покажитесь там — уйдёт.",
    pay:dispR10(500+dispHop(C.S.key,T.key)*150)};
}
function dispMkDouble(r,C){
  const T=dispPick(r,dispNear(C.S,0,2,C.memo));if(!T)return null;
  const k=dispGood(r,T);if(!k)return null;
  const qty=4+Math.floor(r()*5);
  return {legs:[{key:T.key,do:"cargo",k,qty}],txt:"На "+dispSn(T.key)+" нужда вдвое: "+dispQ(k,qty)+" — только эту смену.",
    pay:dispR10(qty*RES[k].price*2+dispHop(C.S.key,T.key)*150+200)};
}
function dispMkLeave(r,C){
  const T=dispPick(r,dispNear(C.S,1,2,C.memo));if(!T)return null;
  return {legs:[{key:T.key,do:"dock"}],txt:"С "+dispSn(T.key)+" уходит человек, который знает дорогу. Успеете до отлёта — расскажет.",
    pay:dispR10(300+dispHop(C.S.key,T.key)*100)};
}
function dispMkSos(r,C){
  const T=dispPick(r,dispNear(C.S,1,2,C.memo));if(!T)return null;
  return {legs:[{key:T.key,do:"arrive"}],txt:"SOS у "+dispSn(T.key)+": корпус без хода. Подойдите — дотащат вместе.",
    pay:dispR10(480+dispHop(C.S.key,T.key)*150)};
}
/* длинный наряд: три станции, лучше — участка */
function dispThree(r,C){
  let L=typeof watchStations==="function"?watchStations().filter(N=>N.key!==C.S.key):[];
  if(L.length<3)L=dispNear(C.S,1,4,C.memo);
  L=L.slice();const out=[];
  while(out.length<3&&L.length){const i=Math.floor(r()*L.length);out.push(L.splice(i,1)[0]);}
  return out.length===3?out:null;
}
function dispMkTri(r,C){
  const T=dispThree(r,C);if(!T)return null;
  const legs=[],bits=[];let goods=0;
  for(const N of T){const k=dispGood(r,N);if(!k)return null;const qty=5+Math.floor(r()*6);
    legs.push({key:N.key,do:"cargo",k,qty});bits.push(dispSn(N.key)+" — "+dispQ(k,qty));goods+=qty*RES[k].price;}
  return {legs,txt:"Наряд на час: "+bits.join("; ")+". По порядку.",pay:dispR10(goods*1.3+dispPath(C.S.key,legs)*110+300)};
}
function dispMkRound(r,C){
  const T=dispThree(r,C);if(!T)return null;
  const legs=T.map(N=>({key:N.key,do:"dock"}));
  return {legs,txt:"Обход участка: отметьтесь на "+T.map(N=>dispSn(N.key)).join(", ")+" — по порядку.",pay:dispR10(840+dispPath(C.S.key,legs)*110)};
}
function dispMkPost(r,C){
  const T=dispThree(r,C);if(!T)return null;
  const legs=T.map(N=>({key:N.key,do:"dock"}));
  return {legs,txt:"Почта по участку: забрать на "+dispSn(T[0].key)+" и "+dispSn(T[1].key)+", сдать на "+dispSn(T[2].key)+".",
    pay:dispR10(940+dispPath(C.S.key,legs)*110)};
}
/* ── лицо: генератор людей; длинный наряд — диспетчер участка ── */
function dispFace(v,S,seed){
  if(DISP_V[v].kind==="long"&&typeof watchDisp==="function"){const W=watchDisp();return {seed:W.seed,name:W.name,who:"диспетчер участка",acc:W.acc,age:W.age};}
  const h=hashi(seed,0xFACE,7)>>>0;
  return {seed:h,name:DISP_NAMES[h%DISP_NAMES.length],who:DISP_V[v].who+(DISP_V[v].at&&S&&S.station?" · "+S.station.name:""),
    acc:DISP_ACC[(h>>>5)%DISP_ACC.length],age:26+(h>>>9)%40};
}
function dispPerson(f){return {seed:f.seed>>>0,role:"fact",acc:f.acc||[150,150,150],age:f.age||40,loy:70,xp:0,traits:[],name:f.name};}
/* ── выбор глагола: окно пяти, вес по шкалам ── */
function dispW(cls,g){return cls==="s"?.5+3*(1-g.s):cls==="m"?.5+3*(1-g.m):cls==="o"?.5+3*(1-g.o):1.7;}
function dispIssue(kind,S,memo){
  const D=dispSt(),seq=++D.seq;
  const r=rng(hashi(S.sx*977+S.sy,seq,0xD157));
  const g=typeof gaugeOf==="function"?gaugeOf(S):{s:.6,m:.6,o:.6};
  const live=new Set(D.it.map(x=>x.v)),recent=D.vb.slice(-(DISP_WIN-1));
  const all=Object.keys(DISP_V).filter(v=>DISP_V[v].kind===kind&&!live.has(v));
  let pool=all.filter(v=>recent.indexOf(v)<0);
  /* окно не пускает — давно не звучавший (меньший индекс в истории) */
  if(!pool.length)pool=all.slice().sort((a,b)=>D.vb.lastIndexOf(a)-D.vb.lastIndexOf(b)).slice(0,1);
  const C={S,g,memo};
  while(pool.length){
    let tot=0;const W=pool.map(v=>{const w=(v==="kaskad"?2.5:dispW(DISP_V[v].cls,g))*(v==="zapas"&&g.s>.45?.25:1);tot+=w;return w;});
    let x=r()*tot,i=0;while(i<W.length-1&&(x-=W[i])>0)i++;
    const v=pool[i],B=DISP_V[v].mk(r,C,v);
    if(!B){pool.splice(i,1);continue;}
    const life=DISP_LIFE[kind],ms=(life[0]+r()*(life[1]-life[0]))*60000,t=now();
    const it={id:seq,v,kind,from:S.key,legs:B.legs,leg:0,txt:B.txt,pay:B.pay,t0:t,due:Math.round(t+ms),
      est:DISP_MIN[kind]+DISP_JUMP_MIN*dispPath(S.key,B.legs),f:dispFace(v,S,hashi(S.sx,S.sy,seq))};
    D.it.push(it);D.vb.push(v);while(D.vb.length>12)D.vb.shift();
    return it;
  }
  return null;
}
/* на стыковке: пустые места — заполнить */
function dispFill(S){
  if(!S||!S.station||!S.station.prices)return [];
  if(typeof watchHanded==="function"&&watchHanded())return [];
  const D=dispSt(),memo={},out=[];
  for(const kind of DISP_KINDS){
    if(D.it.some(x=>x.kind===kind))continue;
    if(kind==="urg"&&!dispUrgOk())continue;
    const it=dispIssue(kind,S,memo);if(it)out.push(it);
  }
  return out;
}
/* первая вахта решает, когда срочному можно (M909 переопределяет) */
function dispUrgOk(){return true;}
function dispLeg(it){return it.legs[it.leg]||null;}
function dispMins(it){return Math.max(0,Math.ceil((it.due-now())/60000));}
/* ── ход дела ── */
function dispAdvance(it,why){
  it.leg++;
  if(it.leg>=it.legs.length){dispDone(it);return true;}
  const L=dispLeg(it);
  if(why)tell("tech",it.f.name+": «"+why+"»",null);
  /* следующий шаг уже исполнен там, где вы стоите (поговорили и сразу назад) — не ждать */
  dispCheck(it);
  return false;
}
function dispCheck(it){
  const L=dispLeg(it);if(!L||!G.sys)return;
  if(L.key!==G.sys.key)return;
  if(L.do==="dock"&&(G.mode==="dock"||DISP_DOCKING))dispAdvance(it,"Отметили.");
  else if(L.do==="arrive")dispAdvance(it,"Вижу вас.");
}
function dispDone(it){
  const D=dispSt(),i=D.it.indexOf(it);if(i>=0)D.it.splice(i,1);
  D.done++;
  const got=earn(it.pay,"disp");
  const S=dispSysOf(it.legs[it.legs.length-1].key),F=dispSysOf(it.from),cls=DISP_V[it.v].cls;
  if(S&&S.station&&typeof gaugeAdd==="function"){
    if(it.kind==="haul"||it.v==="dvoynaya"||it.v==="tri")gaugeAdd(S,.3,.05,0);
    else if(cls==="m")gaugeAdd(F&&F.station?F:S,0,.05,0);
    else if(cls==="o")gaugeAdd(S,0,0,.1);
  }
  /* привоз на станцию участка — в норму, как сданный наряд (28j) */
  if(S&&S.station&&(it.kind==="haul"||it.v==="tri")&&typeof watchHas==="function"&&watchHas(S)&&!watchHanded()){watchTick();watchSt().ord++;}
  tell("money",it.f.name+": «Спасибо. Записано на вас.» +"+got+" кр","ДЕЛО ЗАКРЫТО\n+"+got+" кр");
  if(it.kind==="urg"||it.kind==="long")recordAdd(it.f.name,it.kind==="urg"?"успели, когда было нужно":"наряд на три станции закрыт");
  return got;
}
/* сдать груз кнопкой: купленное у этой же стойки — по цене приёмки (как наряд, 12aa) */
function dispGive(id){
  const it=dispSt().it.find(x=>x.id===id);if(!it)return false;
  const L=dispLeg(it);
  if(!L||L.do!=="cargo"||!G.sys||G.sys.key!==L.key||G.mode!=="dock")return false;
  if((G.cargo[L.k]||0)<L.qty)return false;
  const nC=it.legs.filter(x=>x.do==="cargo").length,share=it.pay/nC;
  const B=boughtHereSplit(G.sys,L.k,L.qty);
  if(B.m)it.pay=Math.max(0,Math.round(it.pay-share*B.m/L.qty+B.m*B.bid));
  G.cargo[L.k]-=L.qty;appetiteHereUse(G.sys,L.k,L.qty);
  dispAdvance(it,"Приняли: "+dispQ(L.k,L.qty)+".");
  dispFill(G.sys);   /* место освободилось у стойки — диспетчер кладёт следующую бумагу сразу */
  return true;
}
/* срок вышел: бумага уходит, станция помнит; пока смена сдана — часы стоят */
function dispTick(){
  const D=dispSt(),t=now();
  if(D.lt!=null&&typeof watchHanded==="function"&&watchHanded()){const dt=Math.max(0,t-D.lt);for(const it of D.it)it.due+=dt;}
  D.lt=t;
  for(let i=D.it.length-1;i>=0;i--){
    const it=D.it[i];if(it.due>t)continue;
    D.it.splice(i,1);D.lost++;
    const F=dispSysOf(it.from),cls=DISP_V[it.v]?DISP_V[it.v].cls:"";
    if(F&&F.station&&typeof gaugeAdd==="function")gaugeAdd(F,cls==="s"?-.1:0,cls==="m"?-.06:cls===""?-.03:0,cls==="o"?-.06:0);
    logAdd("dim",it.f.name+": «"+(it.kind==="urg"?"Не успели. Ладно.":"Не дождались. Отдали другим.")+"»");
  }
}
/* ── обёртки: каждый шаг ловится настоящей функцией ── */
function dispOn(doo,key){
  for(const it of dispSt().it.slice()){const L=dispLeg(it);if(L&&L.do===doo&&L.key===key)dispAdvance(it,doo==="land"?"Взяли. Теперь к нам.":doo==="kill"?"Ушёл. Доложите.":doo==="cant"?"Поговорили — передайте.":"Вижу вас.");}
}
let DISP_DOCKING=false;   /* обёртка стыковки зовётся до G.mode="dock" — отметка «пристыковался» верит ей */
function dispDock(sys){
  if(!sys||!sys.station)return;
  DISP_DOCKING=true;
  try{
    dispTick();
    for(const it of dispSt().it.slice())dispCheck(it);
    dispFill(sys);
  }catch(e){logAdd("warn","СБОЙ · диспетчер: "+(e&&e.message));}
  finally{DISP_DOCKING=false;}
}
const DISP_OLD_OPEN=openStation;
openStation=function(){if(G.sys)dispDock(G.sys);return DISP_OLD_OPEN.apply(this,arguments);};
const DISP_OLD_ARRIVE=arriveSystem;
arriveSystem=function(){
  const r=DISP_OLD_ARRIVE.apply(this,arguments);
  try{if(G.sys){dispTick();dispOn("arrive",G.sys.key);dispAlarm();}}catch(e){logAdd("warn","СБОЙ · диспетчер: "+(e&&e.message));}
  return r;
};
const DISP_OLD_SURF=enterSurface;
enterSurface=function(){const r=DISP_OLD_SURF.apply(this,arguments);try{if(G.sys)dispOn("land",G.sys.key);}catch(e){}return r;};
const DISP_OLD_KILL=killPirate;
killPirate=function(p){const k=G.sys&&G.sys.key;const r=DISP_OLD_KILL.apply(this,arguments);try{if(k&&!(p&&p.dummy))dispOn("kill",k);}catch(e){}return r;};
const DISP_OLD_CANT=cantHall;
cantHall=function(){const r=DISP_OLD_CANT.apply(this,arguments);try{if(G.sys&&G.mode==="dock")dispOn("cant",G.sys.key);}catch(e){}return r;};
const DISP_OLD_CLOSE=closeStation;
closeStation=function(){const r=DISP_OLD_CLOSE.apply(this,arguments);try{if(G.mode!=="dock")dispAlarm(true);}catch(e){}return r;};
const DISP_OLD_MGR=mgrTick;
mgrTick=function(){try{dispTick();}catch(e){logAdd("warn","СБОЙ · диспетчер: "+(e&&e.message));}return DISP_OLD_MGR.apply(this,arguments);};
/* табличка тревоги (M803/M826b): срочное в полёте — у корабля, середина её по праву */
function dispUrg(){return dispSt().it.find(x=>x.kind==="urg")||null;}
function dispAlarm(force){
  const U=dispUrg();if(!U||G.mode!=="system")return false;
  const D=dispSt();
  if(!force&&D.al===U.id)return false;
  D.al=U.id;
  const L=dispLeg(U);
  return hangSay("disp.urg",["СРОЧНО · "+dispMins(U)+" мин",U.txt.split(". ")[0]+(L?" · "+dispSn(L.key):"")],"ship",420,{urg:true});
}
/* ── полоса К ВАМ: что на ней сейчас (для доски, бота и ворот) ── */
function dispLane(){
  const D=dispSt();
  return D.it.slice().sort((a,b)=>DISP_KINDS.indexOf(a.kind)-DISP_KINDS.indexOf(b.kind)).map(it=>{
    const L=dispLeg(it);
    return {id:it.id,v:it.v,kind:it.kind,addr:it.kind==="haul"||it.kind==="task",haul:it.kind==="haul",urg:it.kind==="urg",
      long:it.kind==="long",face:it.f.name,who:it.f.who,mins:dispMins(it),est:it.est,pay:it.pay,leg:L,txt:it.txt};
  });
}
function dispLegWord(L,here){
  if(!L)return "";
  const at=dispSn(L.key);
  return L.do==="cargo"?(here?"сдать здесь: ":"сдать на "+at+": ")+dispRu(L.k)+" ×"+L.qty
    :L.do==="dock"?(here?"отметиться здесь":"пристыковаться на "+at)
    :L.do==="arrive"?"быть в системе "+at
    :L.do==="land"?"сесть на планету у "+at
    :L.do==="kill"?"сбить пирата у "+at
    :L.do==="cant"?(here?"зайти в кантину здесь":"кантина на "+at):"";
}
function dispRow(it){
  const L=dispLeg(it),here=!!(L&&G.sys&&L.key===G.sys.key);
  const r=el("div","row");
  try{r.appendChild(faceEl(dispPerson(it.f),44));}catch(e){}
  const steps=it.legs.length>1?" · шаг "+(it.leg+1)+" из "+it.legs.length:"";
  r.appendChild(el("div","nm","<b>"+it.f.name+" · "+it.f.who+"</b><s>«"+it.txt+"»<br>"+dispLegWord(L,here)+steps+
    " · ещё "+dispMins(it)+" мин · "+it.pay.toLocaleString("ru")+" кр</s>"));
  let b=null;
  if(L&&L.do==="cargo"&&here&&(G.cargo[L.k]||0)>=L.qty){
    b=el("button","act gold",DISP_V[it.v].btn);
    b.onclick=()=>{sfx("ui");dispGive(it.id);renderTab();};
  }else if(L&&!here){
    const S=dispSysOf(L.key);
    if(S){b=el("button","act","КУРС");b.onclick=()=>{sfx("ui");gotoSector(S.sx,S.sy,S.station?S.station.name:S.name);renderTab();};}
  }
  if(b)r.appendChild(b);
  return r;
}
function dispSection(){
  if(!G.sys||!G.sys.station||G.mode!=="dock")return;
  const D=dispSt();if(!D.it.length)return;
  const U=D.it.filter(x=>x.kind==="urg"),A=D.it.filter(x=>x.kind!=="urg").sort((a,b)=>DISP_KINDS.indexOf(a.kind)-DISP_KINDS.indexOf(b.kind));
  if(U.length){secHead("СРОЧНО",{count:dispMins(U[0])+" мин"});for(const it of U)$body.appendChild(dispRow(it));}
  if(A.length){secHead("ДИСПЕТЧЕР",{count:A.length});for(const it of A)$body.appendChild(dispRow(it));}
}
LANE_RX.unshift([/^(СРОЧНО|ДИСПЕТЧЕР)/i,"you"]);
const DISP_OLD_BOARD=stTabBoard;
stTabBoard=function(){try{dispSection();}catch(e){logAdd("warn","СБОЙ · диспетчер: "+(e&&e.message));}return DISP_OLD_BOARD.apply(this,arguments);};
/* ── запись ── */
const DISP_OLD_SNAP=snapshot;
snapshot=function(){const s=DISP_OLD_SNAP.apply(this,arguments);s.disp=G.disp||null;return s;};
const DISP_OLD_APPLY=applySave;
applySave=function(s){
  const r=DISP_OLD_APPLY.apply(this,arguments);
  if(!r)return r;
  const b=s&&s.disp;G.disp=null;
  if(b&&typeof b==="object"){
    const D=dispSt();
    D.seq=b.seq|0;D.done=b.done|0;D.lost=b.lost|0;
    if(isFinite(b.lt))D.lt=+b.lt;
    if(Array.isArray(b.vb))D.vb=b.vb.filter(v=>DISP_V[v]).slice(-12);
    if(Array.isArray(b.it))for(const x of b.it){
      if(!x||!DISP_V[x.v]||!Array.isArray(x.legs)||!x.legs.length||!x.f)continue;
      const legs=x.legs.filter(L=>L&&typeof L.key==="string"&&/^(cargo|dock|arrive|land|kill|cant)$/.test(L.do)&&(L.do!=="cargo"||(RES[L.k]&&L.qty>0)))
        .map(L=>L.do==="cargo"?{key:L.key,do:L.do,k:L.k,qty:L.qty|0}:{key:L.key,do:L.do});
      if(legs.length!==x.legs.length)continue;
      D.it.push({id:x.id|0,v:x.v,kind:DISP_V[x.v].kind,from:String(x.from||legs[0].key),legs,leg:Math.min(legs.length-1,Math.max(0,x.leg|0)),
        txt:String(x.txt||""),pay:Math.max(0,+x.pay||0),t0:+x.t0||now(),due:+x.due||now(),est:+x.est||0,
        f:{seed:x.f.seed>>>0,name:String(x.f.name||DISP_NAMES[0]),who:String(x.f.who||""),acc:Array.isArray(x.f.acc)?x.f.acc.slice(0,3):null,age:x.f.age|0}});
    }
  }
  return r;
};
