/* ══════════════ подписка — лучший товар фирмы (M487, DESIGN-birchpunk) ══════════════
   Фирменный прибор («Сирин», «Веха») у Компании и Хай-Фронта можно не купить,
   а подписать: 10 % сразу и 4 % за каждую смену. Карточка честно пишет, что
   владеть выгоднее уже после ~23 смен. Не хватило на взнос — сперва
   извещение в ПОЧТУ, отключают только на следующей границе смены; отключённый
   прибор «заблокирован» и различает вдвое хуже, пока не погасите долг. Каждый
   пятый взнос — «тариф обновлён»: цена та же, одной функции меньше, её
   продают дополнением. Взнос берут и с полки: подписка на вещь, а не на гнездо.
   На приборе: u.sub = {p: цена прибора, by, next, paid, warn, off, feat}. */
const SUB_UP=.10,SUB_RATE=.04,SUB_POWERS={co:1,hf:1};
const SUB_FEATS=["ночная подсветка шкалы","звук стрелки","вторая риска","автонуль","кожаный чехол"];
function subHereBy(){
  const by=(typeof stampOwnerAt==="function")?stampOwnerAt(G.sx,G.sy):null;
  return SUB_POWERS[by]?by:null;
}
function subAllowed(off){
  return !!(off&&off.u&&typeof WARRANTY_WORKS!=="undefined"&&WARRANTY_WORKS[off.u.w]&&subHereBy());
}
function subFee(u){return Math.max(1,Math.round(u.sub.p*SUB_RATE));}
function subBreakEven(){return Math.ceil((1-SUB_UP)/SUB_RATE);}
function subBuy(off){
  if(!subAllowed(off))return false;
  const price=instrPrice(off.u),up=Math.round(price*SUB_UP);
  if(G.credits<up)return false;
  G.credits-=up;
  instrInstall(off.id,off.u);
  const u=instrKit()[off.id];
  u.sub={p:price,by:subHereBy(),next:now()+HOLD_SHIFT,paid:0,warn:0,off:0,feat:0};
  tell("money",INSTR_BY_ID[off.id].ru+" по подписке · −"+up.toLocaleString("ru")+" кр · дальше "+subFee(u)+" кр/смену",
       INSTR_BY_ID[off.id].ru+"\nпо подписке");
  return true;
}
function subOff(u){return !!(u&&u.sub&&u.sub.off);}
/* граница смены: взнос, извещение, отключение */
function subCharge(u,nm){
  const S=u.sub,fee=subFee(u);
  if(G.credits>=fee){
    G.credits-=fee;S.paid++;S.warn=0;
    if(S.off){S.off=0;logAdd("tech","«"+nm+"» разблокирован · подписка продлена");}
    if(S.paid%5===0){S.feat++;
      logAdd("dim","ПОЧТА · «"+nm+"»: тариф обновлён! Цена прежняя. «"+SUB_FEATS[(S.feat-1)%SUB_FEATS.length]+"» теперь — дополнение.");}
    return;
  }
  if(!S.warn){S.warn=1;
    logAdd("bad","ПОЧТА · «"+nm+"»: взнос "+fee+" кр не прошёл. Через смену прибор будет заблокирован.");return;}
  if(!S.off){S.off=1;logAdd("bad","«"+nm+"» заблокирован · подписка не оплачена · различает вдвое хуже");}
}
function subTick(){
  const all=[];
  const K=instrKit();for(const id in K)all.push([K[id],id]);
  for(const it of instrShelf())all.push([it.u,it.id]);
  for(const [u,id] of all){
    if(!u||!u.sub)continue;
    let guard=0;
    while(now()>=u.sub.next&&guard++<48){
      subCharge(u,INSTR_BY_ID[id]?INSTR_BY_ID[id].ru:id);
      u.sub.next+=HOLD_SHIFT;
    }
  }
}
/* ЭКСТРЕННОЕ ПРОДЛЕНИЕ · ×3 — разблокировать сейчас, не дожидаясь смены */
function subRush(id){
  const u=instrUnit(id);if(!subOff(u))return false;
  const fee=subFee(u)*3;if(G.credits<fee)return false;
  G.credits-=fee;u.sub.off=0;u.sub.warn=0;
  logAdd("money","ЭКСТРЕННОЕ ПРОДЛЕНИЕ · «"+INSTR_BY_ID[id].ru+"» · −"+fee+" кр · спасибо, что вы с нами");
  return true;
}
