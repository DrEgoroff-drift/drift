/* ══════════════ ящик: камера хранения транспортной конторы домов (M345) ══════════════
   Пятая зона ОПИСИ, которая выдвигается только у станции ступени шесть и выше
   (docs/DESIGN-wanderer.md §12): двадцать четыре места, куда кладут части, кучи
   и инструменты «Сороки». Один ящик на игрока, где бы он ни стоял: контора одна,
   станции — её окна. Мгновенно, без баржи.

   ЦЕНА — плата за хранение, один процент от стоимости содержимого в сутки,
   снимается лениво при каждом подходе (модель tickDrones): сколько суток прошло,
   столько и списано; денег не хватило — списали, сколько было, и на этом всё:
   книги долга нет (решение CRITIQUE-holding, «без расписки»). Тридцать суток без
   визита — контора сдаёт содержимое на блошинец, и оно всплывает там лотами
   «залог, за которым не пришли» (12ua), уже чужим.

   Одна мягкая развилка на игрока — «что взять в этот рейс»: инструменты «Сороки»
   работают только с полки кабины (12v-wander-shop), и ящик — место для остальных.
   Ускоритель «Второй ящик» удваивает места.

   ПРАВИЛА ФАЙЛА:
   1. Хранится G.locker={items:[…],res:{k:n},t}; части упакованы packPart, инструменты
      — id. Ничего сеяного.
   2. Плата считается от реальных часов, один раз на визит, без таймера.
   3. Ящик не торгует: положить, забрать, заплатить. */
const LOCKER_SLOTS=24, LOCKER_FEE=.01, LOCKER_DAY=86400e3, LOCKER_LAPSE=30;
function lockerRec(){
  let L=G.locker;
  if(!L||typeof L!=="object"||!Array.isArray(L.items)){L=G.locker={items:[],res:{},t:Date.now()};}
  if(!L.res||typeof L.res!=="object")L.res={};
  if(typeof L.t!=="number")L.t=Date.now();
  return L;
}
function lockerSlots(){return LOCKER_SLOTS*((typeof wanderHas==="function"&&wanderHas("box2"))?2:1);}
/* окно конторы открыто: стыковка у станции шестой ступени и выше */
function lockerHere(){
  if(G.mode!=="dock"||!G.sys||!G.sys.station)return false;
  return (typeof rungOf==="function")&&rungOf(G.sys.sx,G.sys.sy)>=6;
}
/* занято мест: часть — место, инструмент — место, каждая куча — место */
function lockerUsed(L){L=L||lockerRec();return L.items.length+Object.keys(L.res).filter(k=>(L.res[k]|0)>0).length;}
function lockerFree(){return Math.max(0,lockerSlots()-lockerUsed());}
/* стоимость содержимого: части — по тиру, сырьё — по рынку */
function lockerValue(L){
  L=L||lockerRec();let v=0;
  for(const it of L.items){
    if(it.p)v+=(60+((it.p.t|0)*140));
    else if(it.tool&&typeof WANDER_BY_ID!=="undefined"&&WANDER_BY_ID[it.tool])v+=(WANDER_BY_ID[it.tool].pay.m|0)*25;
  }
  for(const k in L.res)if(RES[k])v+=(L.res[k]|0)*(RES[k].price||0);
  return Math.round(v);
}
/* плата за прошедшие сутки: списываем лениво; тридцать суток без визита — сдача на блошинец */
function lockerTick(now){
  now=now===undefined?Date.now():now;
  const L=lockerRec();
  if(!lockerUsed(L)){L.t=now;return {fee:0,days:0};}
  const days=Math.floor((now-L.t)/LOCKER_DAY);
  if(days<=0)return {fee:0,days:0};
  if(days>=LOCKER_LAPSE){lockerHandOver();L.t=now;return {fee:0,days,gone:true};}
  const fee=Math.min(G.credits,Math.round(lockerValue(L)*LOCKER_FEE*days));
  if(fee>0){G.credits-=fee;logAdd("money","Контора: хранение "+days+" "+pl3(days,"сутки","суток","суток")+" · −"+fee.toLocaleString("ru")+" кр");}
  L.t+=days*LOCKER_DAY;
  return {fee,days};
}
/* контора сдала всё на блошинец: части и инструменты — лотами, кучи уходят вовсе */
function lockerHandOver(){
  const L=lockerRec();
  if(typeof fleaRec==="function"){
    const F=fleaRec();if(!Array.isArray(F.pawn))F.pawn=[];
    for(const it of L.items){
      if(it.p)F.pawn.push({k:hashi(it.p.s|0,it.p.t|0,0x9A4E),p:it.p});
      /* инструменты «Сороки» блошинец не понимает — они пропадают вместе с кучами */
    }
    while(F.pawn.length>12)F.pawn.shift();
  }
  const n=L.items.length+Object.keys(L.res).length;
  L.items=[];L.res={};
  if(n)tell("warn","Контора сдала ваш ящик на блошинец: месяц никто не приходил",
    "ЯЩИК СДАН\nтридцать суток без визита\nчасти всплывут на блошинце лотами\nсырьё ушло на склад конторы");
}
/* ── положить и забрать ── */
function lockerPutPart(id){
  const L=lockerRec();if(lockerFree()<=0){say("В ящике нет места");return false;}
  const p=partById(id);if(!p||isFitted(id))return false;
  G.inv.splice(G.inv.indexOf(p),1);
  L.items.push({p:packPart(p)});
  return true;
}
function lockerPutTool(id){
  const L=lockerRec();if(lockerFree()<=0){say("В ящике нет места");return false;}
  const W=(typeof wanderStore==="function")?wanderStore():null;if(!W)return false;
  let i=W.hold.indexOf(id);
  if(i>=0)W.hold.splice(i,1);else{i=W.shelf.indexOf(id);if(i<0)return false;W.shelf.splice(i,1);}
  L.items.push({tool:id});
  return true;
}
function lockerPutRes(k,n){
  const L=lockerRec();n=Math.max(0,Math.min(G.cargo[k]|0,n|0));
  if(!n||!RES[k]||RES[k].pax)return false;
  if(!(L.res[k]|0)&&lockerFree()<=0){say("В ящике нет места");return false;}
  G.cargo[k]-=n;L.res[k]=(L.res[k]|0)+n;
  return true;
}
function lockerTake(i){
  const L=lockerRec();const it=L.items[i];if(!it)return false;
  if(it.p){
    if(G.inv.length>=PART_MAX){say("В инвентаре нет места");return false;}
    const p=unpackPart(it.p);if(!p)return false;
    G.inv.push(p);
  }else if(it.tool){
    const W=wanderStore();
    if(W.shelf.length<WANDER_SHELF)W.shelf.push(it.tool);else W.hold.push(it.tool);
  }
  L.items.splice(i,1);
  return true;
}
function lockerTakeRes(k){
  const L=lockerRec();const n=L.res[k]|0;if(!n)return false;
  const room=Math.max(0,stat().cargoMax-held());
  const take=Math.min(n,room);
  if(!take){say("Трюм полон");return false;}
  G.cargo[k]=(G.cargo[k]|0)+take;L.res[k]-=take;
  if(!L.res[k])delete L.res[k];
  return true;
}
/* строка для шапки зоны */
function lockerLine(){
  const L=lockerRec(),v=lockerValue(L);
  return lockerUsed(L)+" / "+lockerSlots()+" · хранение "+Math.round(v*LOCKER_FEE)+" кр в сутки";
}
