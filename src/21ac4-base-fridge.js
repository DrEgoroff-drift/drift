/* ══════════════ холодильник по подписке (M487, DESIGN-birchpunk §4.2) ══════════════
   Отсек базы, который фирма (Компания, Хай-Фронт) продаёт двумя способами:
   купить — полная цена сразу, и он кормит всегда; подписать — десятая часть
   сразу и 4 % за каждую смену. Подписной кормит, пока взнос проходит. Не прошёл —
   дверь заперта: харча в эту смену нет, но и уже выданное он не забирает —
   «перестаёт давать, а не отнимает». Извещение — сменой раньше: после взноса
   на счету меньше следующего — строка в журнале базы.

   Состояния в записи нет и не нужно: каждую смену взнос либо проходит, либо нет,
   по деньгам на счету; заперт он или открыт — видно из того же счёта. Клетка
   хранится как {k,hp}, и подписка — это её вид (fridgesub), а не поле.
   Каждая 25-я смена — «тариф обновлён»: цена та же, одна мелочь стала дополнением. */
const FRIDGE_PRICE=3400,FRIDGE_FOOD=4,FRIDGE_TARIFF=25;
const FRIDGE_FEATS=["подсветка полок","лёд в морозилке","звонок открытой двери","полка для яиц","тихий режим компрессора"];
function fridgeFirmAt(B){
  const by=(B&&typeof stampOwnerAt==="function")?stampOwnerAt(B.sx,B.sy):null;
  return (by&&typeof SUB_POWERS!=="undefined"&&SUB_POWERS[by])?by:null;
}
function fridgeFee(){return Math.round(FRIDGE_PRICE*SUB_RATE);}
BUILD.fridge={ru:"Холодильник «Иней»",cost:{credits:FRIDGE_PRICE,alloy:4},power:-3,
  note:"+"+FRIDGE_FOOD+" харча за смену, вкусного · куплен насовсем — кормит всегда"};
BUILD.fridgesub={ru:"«Иней» по подписке",cost:{credits:Math.round(FRIDGE_PRICE*SUB_UP),alloy:4},power:-3,
  firm:fridgeFirmAt,
  note:"то же, но "+Math.round(SUB_UP*100)+" % сразу и "+fridgeFee()+" кр за смену · без взноса дверь заперта · к "+
    Math.ceil((1-SUB_UP)/SUB_RATE)+"-й смене вы заплатите полную цену"};
JOB_ROLE.fridge=JOB_ROLE.fridgesub="gardener";
/* журнал — только о переменах: взнос каждую смену строкой не пишется, как и зарплата */
Object.assign(BLOG,{
  fridgewarn:(B,a)=>"ПОЧТА · «Иней»: на счету меньше следующего взноса ("+a.cr+" кр). Через смену дверь будет заперта",
  fridgeoff:(B,a)=>"«Иней» заперт: подписка не оплачена · харч внутри есть, дверь не открывается",
  fridgetariff:(B,a)=>"ПОЧТА · «Иней»: тариф обновлён! Цена прежняя. «"+a.what+"» теперь — дополнение"
});
/* заперт ли подписной сейчас — по счёту, как и решит ближайшая смена */
function fridgeLocked(){return G.credits<fridgeFee();}
function fridgeStep(B,n){
  let own=0,sub=0;
  for(const cell of B.cells||[]){
    if(!cell||cell.hp<=0)continue;
    if(cell.k==="fridge")own++;else if(cell.k==="fridgesub")sub++;
  }
  if(!own&&!sub)return 0;
  const L=baseLife(B);
  let q=own*FRIDGE_FOOD,said=0;
  if(sub){
    const fee=fridgeFee()*sub;
    if(G.credits>=fee){
      G.credits-=fee;q+=sub*FRIDGE_FOOD;
      if(n%FRIDGE_TARIFF===0){baseLog(B,"fridgetariff",n,{what:FRIDGE_FEATS[Math.floor(n/FRIDGE_TARIFF)%FRIDGE_FEATS.length]});said=1;}
      if(G.credits<fee){baseLog(B,"fridgewarn",n,{cr:fee});said=1;}
    }else{baseLog(B,"fridgeoff",n,{});said=1;}
  }
  if(q>0){L.food=Math.min(LIFE_CAP,(L.food|0)+q);L.q="good";}
  return said;
}
BUILD_KEYS.push("fridge","fridgesub");   /* список меню собран в 21a раньше этого файла */
/* ── ЭКСТРЕННОЕ ПРОДЛЕНИЕ · ×3 в бою (M487) ──
   Прибор по подписке заблокирован, а вокруг бой: подсказка предлагает продлить
   сейчас, втридорога, одним нажатием ДЕЙСТВИЯ. Не в бою — это делает станция */
function subFightOffer(actEdge){
  if(!G.engaged||typeof instrKit!=="function")return false;
  const K=instrKit();let id=null;
  for(const k in K)if(subOff(K[k])){id=k;break;}
  if(!id)return false;
  const fee=subFee(K[id])*3,nm=INSTR_BY_ID[id]?INSTR_BY_ID[id].ru:id;
  if(G.credits<fee){cue("«"+nm+"» ЗАБЛОКИРОВАН · ЭКСТРЕННОЕ ПРОДЛЕНИЕ · ×3 · "+fee+" КР — НЕ ХВАТАЕТ",CUE_INFO);return false;}
  if(cue("ЭКСТРЕННОЕ ПРОДЛЕНИЕ · ×3\n«"+nm+"» заблокирован · "+fee+" кр\nДЕЙСТВИЕ — ПРОДЛИТЬ СЕЙЧАС",CUE_ACT)&&actEdge){
    if(subRush(id))say("«"+nm+"» РАЗБЛОКИРОВАН · СПАСИБО, ЧТО ВЫ С НАМИ",90);
  }
  return true;
}
