/* ══════════════ приборы — это товар ══════════════
   M127. До сих пор пять приборов области были свойством корабля: они просто
   есть, одинаковые у всех, и отличаются только профессией корпуса (03f). Здесь
   каждый прибор становится ВЕЩЬЮ: у него есть завод, возраст и характер, его
   покупают, переставляют, чинят и теряют.

   ПОЧЕМУ НЕ «−5%». Плохой хронометр не отнимает процент у абстрактной
   «эффективности»: он хуже РАЗЛИЧАЕТ отклонение, поэтому область, которая
   врёт временем, читается на нём позже и труднее. Прогресс без уровней —
   игрок собирает панель под то, что ему интересно искать, а не «улучшает
   характеристику».

   ЧТО ХРАНИТСЯ. Установленный набор и полка снятого — это решения игрока,
   поэтому они в сохранении (`14-save`, безопасные умолчания). Сами числа
   прибора выводятся из завода и seed, как части (`05-parts`): в записи лежат
   только `{w,s,wear}`. */

const INSTR_WORKS={
  kazenny:{ru:"Казённый",   note:"с верфи, как есть: середина во всём",
           res:1,    jit:1,   pen:1,   drift:1,   age:1,   price:1},
  gorn:   {ru:"«Горн»",     note:"грубая шкала, но переживёт что угодно",
           res:.78,  jit:.7,  pen:1.35,drift:.8,  age:.55,  price:.8},
  sirin:  {ru:"«Сирин»",    note:"тонкая шкала, нервная стрелка",
           res:1.45, jit:2.2, pen:.75, drift:1.35,age:1.3,  price:2.1},
  vekha:  {ru:"«Веха»",     note:"обсерваторская работа: держит нуль",
           res:1.25, jit:.55, pen:.9,  drift:.45, age:1.15, price:2.6},
  artel:  {ru:"Артельный",  note:"собран на коленке, зато даром",
           res:.7,   jit:1.8, pen:1.2, drift:1.6, age:1.5,  price:.35},
  trofey: {ru:"Трофейный",  note:"чужая работа, подписи стёрты",
           res:1.15, jit:1.3, pen:.85, drift:1.1, age:1.25, price:1.4}
};
const INSTR_WORK_KEYS=Object.keys(INSTR_WORKS);
const INSTR_SHELF_MAX=4;
/* стартовый набор: казённые приборы, поставленные на верфи вместе с корпусом */
function instrKitInit(){
  const K={};
  for(const id of INSTR_KEYS)K[id]={w:"kazenny",s:hashi(0x1EC,id.length,7),wear:0};
  return K;
}
function instrKit(){
  if(!G.instrKit||typeof G.instrKit!=="object")G.instrKit=instrKitInit();
  return G.instrKit;
}
function instrShelf(){
  if(!Array.isArray(G.instrShelf))G.instrShelf=[];
  return G.instrShelf;
}
function instrUnit(id){
  const K=instrKit();
  if(!K[id])K[id]={w:"kazenny",s:hashi(0x1EC,id.length,7),wear:0};
  return K[id];
}
function instrWorks(u){return INSTR_WORKS[u&&u.w]||INSTR_WORKS.kazenny;}
/* ── характер конкретного экземпляра ──
   Завод задаёт склонность, seed — разброс внутри неё: два «Сирина» не
   одинаковы, как не одинаковы две части из одного генератора. */
function instrTraits(u){
  const W=instrWorks(u), r=rng((u&&u.s)>>>0||1);
  const k=.85+r()*.3;
  return {res:W.res*k, jit:W.jit*(.8+r()*.5), pen:W.pen*(.9+r()*.25),
          drift:W.drift*(.85+r()*.35), age:W.age, ru:W.ru, note:W.note};
}
/* Разрешение прибора: завод × износ × профессия корпуса. Изношенный прибор
   врёт не «на процент», а становится тупее — отклонение приходится ловить
   ближе к ядру. */
function instrQuality(id){
  const u=instrUnit(id), T=instrTraits(u);
  const wear=clamp(u.wear||0,0,1);
  const role=(typeof hullRole==="function")?hullRole().instr:1;
  return T.res*(1-wear*.45)*role;
}
/* дрожь стрелки: у нервной «Сирины» она видна всегда, у «Горна» почти нет.
   Это оформление показания, а не показание: на само число не влияет */
function instrJitter(id){
  const u=instrUnit(id), T=instrTraits(u);
  return T.jit*(1+clamp(u.wear||0,0,1)*1.6);
}
function instrPenWidth(id){
  return instrTraits(instrUnit(id)).pen;
}
/* ── возраст ──
   Приборы стареют от работы, а не от календаря: тикают там же, где идёт износ
   корпуса (12s-wear), и тем же порядком величин. Изношенный прибор чинят на
   верфи; полностью «умереть» он не может — он просто врёт всё грубее. */
const INSTR_WEAR_RATE=1/(60*60*90);      // около полутора часов полёта на процент
function instrAgeTick(dt){
  if(!G.running)return;
  const K=instrKit();
  for(const id in K){
    const T=instrTraits(K[id]);
    /* часы одни (хвост M127): на изношенном корпусе приборы стареют быстрее —
       вибрация и люфт крепления, wearMul из 12s даёт ту же шкалу */
    const hk=(typeof wearMul==="function")?1+(1-clamp(wearMul(),0,1))*2.5:1;
    K[id].wear=clamp((K[id].wear||0)+dt*INSTR_WEAR_RATE*T.age*hk,0,1);
  }
}
function instrWearRu(w){
/* прибор можно потерять (хвост M127): попадание по корпусу изредка выбивает
   гнездо — экземпляр разбит до мёртвой шкалы, и панель это покажет сама */
function instrKnock(){
  if(!G.running||Math.random()>.06)return null;
  const K=instrKit(),ids=Object.keys(K).filter(id=>(K[id].wear||0)<.85);
  if(!ids.length)return null;
  const id=ids[Math.floor(Math.random()*ids.length)];
  K[id].wear=1;
  const I=(typeof INSTR_BY_ID!=="undefined"&&INSTR_BY_ID[id])?INSTR_BY_ID[id].ru:id;
  tell("warn","Попадание: выбито гнездо — "+I,"Прибор разбит\n"+I+"\nпанель слепа по этому каналу");
  return id;
}
  return w<.12?"новый":w<.35?"обношенный":w<.6?"с люфтом":w<.85?"разбитый":"мёртвая шкала";
}
/* ── цена ──
   Считается от завода и износа, чтобы «починить» всегда было заметно дешевле,
   чем «купить», а трофейный хлам стоил как хлам. */
function instrPrice(u){
  const W=instrWorks(u);
  return Math.round(900*W.price*(1-clamp(u.wear||0,0,1)*.6)/50)*50;
}
function instrFixCost(id){
  const u=instrUnit(id);
  return Math.round(instrPrice({w:u.w,s:u.s,wear:0})*clamp(u.wear||0,0,1)*.45/10)*10;
}
/* ── прилавок ──
   Что лежит на станции, определяется самой станцией и медленными часами рынка:
   один и тот же прилавок при повторном заходе тот же, но раз в несколько часов
   товар меняется. Ничего не персистится — предложение выводится. */
function instrOffers(){
  if(!G.st)return [];
  const slot=Math.floor(Date.now()/(1000*60*45));
  const r=rng(hashi(hashi(G.sx,G.sy,0x1A7),slot,(G.st.name||"").length));
  const n=2+Math.floor(r()*2);
  const out=[];
  for(let i=0;i<n;i++){
    const id=INSTR_KEYS[Math.floor(r()*INSTR_KEYS.length)];
    /* на богатой станции чаще попадается серьёзная работа, на аванпосте — артель */
    const rich=(typeof sysDanger==="function")?1-sysDanger(G.sx,G.sy):.5;
    const pool=r()<rich?["vekha","sirin","trofey","kazenny"]:["artel","gorn","kazenny","trofey"];
    const w=pool[Math.floor(r()*pool.length)];
    const wear=+(r()*r()*.55).toFixed(2);
    out.push({id,u:{w,s:(hashi(slot,i,0x5E)>>>0),wear}});
  }
  return out;
}
/* ── постановка, снятие, покупка, починка ──
   Снятый прибор не исчезает: он ложится на полку, и панель без прибора не
   остаётся — гнездо занимает то, что было куплено. Полка короткая, потому что
   склад приборов превратил бы вещь в инвентарь. */
function instrInstall(id,u){
  const K=instrKit(), old=K[id];
  K[id]={w:u.w,s:u.s,wear:u.wear||0};
  if(old){
    const sh=instrShelf();
    sh.unshift({id,u:old});
    while(sh.length>INSTR_SHELF_MAX)sh.pop();
  }
  return old;
}
function instrBuy(off){
  const price=instrPrice(off.u);
  if(G.credits<price)return false;
  G.credits-=price;
  instrInstall(off.id,off.u);
  const T=instrTraits(off.u);
  tell("money",INSTR_BY_ID[off.id].ru+" · "+T.ru+" · −"+price.toLocaleString("ru")+" кр",
       INSTR_BY_ID[off.id].ru+"\n"+T.ru);
  return true;
}
function instrFix(id){
  const cost=instrFixCost(id);
  if(!cost||G.credits<cost)return false;
  G.credits-=cost;
  instrUnit(id).wear=0;
  tell("tech",INSTR_BY_ID[id].ru+" выверен · −"+cost.toLocaleString("ru")+" кр",
       INSTR_BY_ID[id].ru+"\nвыверен");
  return true;
}
function instrFromShelf(k){
  const sh=instrShelf(), it=sh[k];
  if(!it)return false;
  sh.splice(k,1);
  instrInstall(it.id,it.u);
  return true;
}
