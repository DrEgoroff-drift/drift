/* ══════════════ Страхкасса и потеря корпуса (M904c · DESIGN-game §5.1, развилка F3) ══════════════
   Авария (wreck, 28-loop) стоила только груза: корпус собирали наспех и летели дальше, и у боя
   не было ставки. Теперь корпус, разбитый после первого часа, уходит — с модулями на нём и с
   трюмом; игрок пересаживается на «Стриж» по разнарядке. Остаётся всё, что не на корабле:
   кредиты, гараж, хозяйство, управляющие, дроны, знакомые.

   ПРАВИЛА ФАЙЛА:
   1. Первый час корпус не отнимает (§5.1: защита новичка стоит). «Стриж» застрахован всегда, даром.
   2. Страхкасса — по желанию, на любой верфи (плашка на ДОСКЕ): взнос 1 % цены корпуса за смену
      счёта — десять минут (в модели §3.1 это 2 % за двадцатиминутную смену), строкой «Страхкасса»
      в бумаге. Между бумагами — по прожитым сменам, но не больше шести: час, как офлайн (§10.5).
   3. Застрахованный корпус возвращается через смену: износ 55 %, модули и части целы, трюм пуст.
      Незастрахованный уходит насовсем, со ступенями модулей и частями (hullTake, 27ib).
   4. У каждой потери — строка в трудовой книжке: это событие жизни, а не строка журнала. */
const INS_RATE=.01,INS_WEAR=.55,INS_MAX_SH=6;
function insAll(){
  if(!G.ins||typeof G.ins!=="object")G.ins={};
  const I=G.ins;
  if(!I.on||typeof I.on!=="object")I.on={};
  if(!Array.isArray(I.back))I.back=[];
  return I;
}
function insOn(id){return id==="strizh"||!!insAll().on[id];}
function insFee(id){const S=shipData(id);return (id==="strizh"||!S)?0:Math.round((S.price|0)*INS_RATE);}
function insSet(id,on){
  if(id==="strizh"||!G.owned[id])return false;
  const I=insAll();if(on)I.on[id]=1;else delete I.on[id];
  return true;
}
/* взнос за прожитые смены — в счёт; корпус в Страхкассе (не во владении) взноса не платит */
function insAccrue(B){
  const I=insAll();let fee=0;
  for(const id in I.on)if(G.owned[id])fee+=insFee(id);
  if(fee<=0)return 0;
  const sh=clamp((now()-B.from)/BILL_SHIFT_MS,1,INS_MAX_SH);
  const v=Math.round(fee*sh);
  B.due.ins=(B.due.ins||0)+v;
  return v;
}
/* «Стриж» по разнарядке: новый, с полным баком */
function insStrizh(){
  G.shipId="strizh";G.owned.strizh=true;invalidateParts();
  const ns=stat();G.fuel=ns.fuelMax;G.hull=ns.hullMax;
  const HH=hullHeld();HH.v=G.hull;HH.last=G.hull;HH.at=now();
}
function hullLost(id,why){
  const S=shipData(id)||{ru:"корабль"},ru="«"+S.ru+"»",w=why?" ("+why+")":"";
  if(insOn(id)){
    delete G.owned[id];
    insAll().back.push({id,at:now()+BILL_SHIFT_MS});
    insStrizh();
    logAdd("warn",ru+" разбит"+w+" · Страхкасса вернёт его через смену · пока — «Стриж» по разнарядке");
    say(ru+" разбит\nСтрахкасса вернёт через смену\nпока — «Стриж» по разнарядке",220);
    recordAdd("Страхкасса",ru+" разбит"+w+". Застрахован: вернётся через смену.");
  }else{
    hullTake(id);insStrizh();
    logAdd("bad",ru+" потерян"+w+" · не застрахован · выдан «Стриж» по разнарядке");
    say(ru+" потерян\nне застрахован · вы на «Стриже»",220);
    recordAdd("ГЛАВТРАССА",ru+" потерян"+w+". Выдан «Стриж» по разнарядке.");
  }
  saveGame(true);
}
const INS_OLD_WRECK=wreck;
wreck=function(why){
  const id=G.shipId;
  const r=INS_OLD_WRECK.apply(this,arguments);
  if(id&&id!=="strizh"&&G.owned[id]&&!firstHour())hullLost(id,why);
  return r;
};
/* застрахованный корпус вернулся: во владение, с износом; пересесть — на верфи */
function insReturnTick(){
  const I=insAll(),t=now();let n=0;
  I.back=I.back.filter(x=>{
    if(t<x.at)return true;
    const S=shipData(x.id);
    if(S){G.owned[x.id]=true;wearAll()[x.id]=INS_WEAR*WEAR_FULL;n++;
      logAdd("good","Страхкасса вернула «"+S.ru+"» · износ 55 % · пересесть можно на верфи");}
    return false;
  });
  return n;
}
const INS_OLD_OPEN=openStation;
openStation=function(){
  const r=INS_OLD_OPEN.apply(this,arguments);
  if(insReturnTick()&&G.mode==="dock"&&typeof renderTab==="function")renderTab();
  return r;
};
/* плашка на ДОСКЕ верфи: каждый свой корпус — застрахован или нет, взнос и кнопка */
function insSection(){
  if(!G.st||G.st.stype!=="yard")return;
  const I=insAll(),ids=Object.keys(G.owned).filter(id=>G.owned[id]&&id!=="strizh"&&shipData(id));
  if(!ids.length&&!I.back.length)return;
  secHead("СТРАХКАССА ГЛАВТРАССЫ",{count:ids.filter(insOn).length+" из "+(ids.length+I.back.length)});
  for(const id of ids){
    const S=shipData(id),on=insOn(id),r=el("div","row");
    r.appendChild(el("div","nm","<b>«"+S.ru+"» · "+(on?"застрахован":"не застрахован")+"</b><s>взнос "+
      insFee(id).toLocaleString("ru")+" кр за смену · разбит — "+(on?"вернётся через смену, износ 55 %":"уйдёт насовсем, с модулями")+"</s>"));
    const b=el("button","act"+(on?"":" gold"),on?"СНЯТЬ":"ЗАСТРАХОВАТЬ");
    b.onclick=()=>{sfx("ui");insSet(id,!on);renderTab();};
    r.appendChild(b);$body.appendChild(r);
  }
  for(const x of I.back){
    const S=shipData(x.id);if(!S)continue;
    $body.appendChild(el("div","row","<div class='nm'><b>«"+S.ru+"» · в Страхкассе</b><s>вернут через "+
      Math.max(1,Math.ceil((x.at-now())/60000))+" мин · «Взнос за смену. Не задерживайте.»</s></div>"));
  }
}
/* запись: G.ins — в снимок и обратно (белый список 14-save не трогаем — обёртка) */
const INS_OLD_SNAP=snapshot;
snapshot=function(){const s=INS_OLD_SNAP.apply(this,arguments);s.ins=G.ins||null;return s;};
const INS_OLD_APPLY=applySave;
applySave=function(s){
  const r=INS_OLD_APPLY.apply(this,arguments);
  const b=s&&s.ins;G.ins=null;
  if(b&&typeof b==="object"){
    const I=insAll();
    if(b.on&&typeof b.on==="object")for(const id in b.on)if(b.on[id])I.on[id]=1;
    if(Array.isArray(b.back))for(const x of b.back)if(x&&typeof x.id==="string"&&shipData(x.id))I.back.push({id:x.id,at:+x.at||0});
  }
  return r;
};
