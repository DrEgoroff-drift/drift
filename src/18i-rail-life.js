/* ══════════════ жизнь на железной дороге (M499–M502, M508; PLAN «new mechanics») ══════════════
   Вестибюль и вагон, в которых есть люди:
   M499 ПОПУТНАЯ ПОСЫЛКА — Космопочта просит довезти посылку до остановки на
        вашей линии; доставлено ВЫХОДОМ там — пара кредитов и слух (G.railParcel);
   M500 ПРОЕЗДНОЙ — ГЛАВТРАССЫ, единственная честная подписка в игре:
        окупается за 12 поездок, так и написано; каждая поездка — отметка
        в КНИЖКЕ (G.railPass = {until, rides});
   M501 ПОПУТЧИК — пассажир просит взять с собой: платит свой билет,
        говорит в дороге, на выходе оставляет слух;
   M502 ПРОВОДНИК — на электричке в 3+ остановки единственный человек дороги
        приносит чай в подстаканнике: слух и тепло;
   M508 ПЛОМБА — у Орднунга задекларированный трюм пломбируют при посадке:
        до выхода из него ничего не продать (G.railSeal). */
const RAIL_PASS_RIDES=12,RAIL_PASS_LIFE=10;   /* поездок до окупаемости; смен действует */
let RAIL_LIFE={pax:null,tea:false,teaDone:false};
function railBucket(){return Math.floor(now()/HOLD_SHIFT);}
/* ── проездной ── */
function railPassOn(){return !!(G.railPass&&now()<G.railPass.until);}
function railPassPrice(){
  const D=railDestinations();if(!D.length)return 0;
  let s=0;for(const t of D)s+=railFare(t).fare;
  return Math.round(s/D.length*RAIL_PASS_RIDES);
}
function railPassBuy(){
  const p=railPassPrice();if(!p||railPassOn())return false;
  if(G.credits<p){say("Не хватает на проездной\nнужно "+p+" кр",90);return false;}
  G.credits-=p;G.railPass={until:now()+RAIL_PASS_LIFE*HOLD_SHIFT,rides:0,price:p};
  logAdd("money","Проездной ГЛАВТРАССЫ · −"+p+" кр · на "+RAIL_PASS_LIFE+" смен · окупается за "+RAIL_PASS_RIDES+" поездок");
  return true;
}
/* ── посылка ── */
function railParcelOffer(){
  if(G.railParcel)return null;
  const D=railDestinations();if(!D.length)return null;
  const h=hashi(G.sx,G.sy,railBucket()^0x9A7C);
  if(h%3)return null;                                   /* не на каждой станции и не всякую смену */
  const t=D[h%D.length];
  return {sx:t.to.sx,sy:t.to.sy,to:railStopName(t.to),pay:6+t.k*3,from:railStopName({sx:G.sx,sy:G.sy}),b:railBucket()};
}
function railParcelTake(){
  const o=railParcelOffer();if(!o)return false;
  G.railParcel=o;
  logAdd("dim","Космопочта: «Раз уж вы едете — посылочка до «"+o.to+"». Не кантовать.» · в трюме");
  return true;
}
/* ── попутчик ── */
const RAIL_PAX=["бабушка с рассадой","студент с тубусом","монтёр в каске","проводник на смене — едет домой","девушка с виолончелью","дед с ведром"];
const RAIL_PAX_TALK=["«А я в ваши годы на своём летал. Потом цены поднялись.»","«Вы не знаете, до конечной далеко? Я всегда проезжаю.»",
  "«Там, куда еду, говорят, опять перекрыли. Или открыли. Кто их поймёт.»","«Вы только не говорите никому, что я без билета. Шучу. С билетом.»"];
function railPaxOffer(){
  const h=hashi(G.sx,G.sy,railBucket()^0x7A55);
  if(h%2||RAIL_LIFE.pax)return null;
  return {who:RAIL_PAX[h%RAIL_PAX.length],talk:RAIL_PAX_TALK[(h>>3)%RAIL_PAX_TALK.length]};
}
/* ── вестибюль: строки и кнопки поверх кассы ── */
function railLifeHtml(){
  let h="";
  const by=(typeof railOwner==="function")?railOwner():null;
  if(by==="gt"||!by){
    h+="<div class='rw-sec'>ПРОЕЗДНОЙ ГЛАВТРАССЫ</div>";
    if(railPassOn())h+="<div class='rw-row'><span>проездной действует · поездок "+(G.railPass.rides|0)+"</span><em>ещё "+Math.ceil((G.railPass.until-now())/HOLD_SHIFT)+" смен</em></div>";
    else{const p=railPassPrice();if(p)h+="<button class='act rw-pass'>ПРОЕЗДНОЙ · "+p+" КР · "+RAIL_PASS_LIFE+" СМЕН<s>окупается за "+RAIL_PASS_RIDES+" поездок — честно</s></button>";}
  }
  const o=railParcelOffer();
  if(G.railParcel)h+="<div class='rw-sec'>ПОСЫЛКА</div><div class='rw-row'><span>везёте посылку до «"+G.railParcel.to+"»</span><em>выйти там — сдать</em></div>";
  else if(o)h+="<div class='rw-sec'>КОСМОПОЧТА ПРОСИТ</div><button class='act rw-parcel'>ПОСЫЛКА ДО «"+o.to.toUpperCase()+"» · +"+o.pay+" КР<s>не кантовать</s></button>";
  const px=railPaxOffer();
  if(px&&!RAIL_LIFE.pax)h+="<div class='rw-sec'>ПОПУТЧИК</div><button class='act rw-pax'>ВЗЯТЬ С СОБОЙ: "+px.who.toUpperCase()+"<s>заплатит за свой билет</s></button>";
  else if(RAIL_LIFE.pax)h+="<div class='rw-row'><span>с вами едет: "+RAIL_LIFE.pax.who+"</span><em>платит за себя</em></div>";
  if(G.railSeal)h+="<div class='rw-row'><span>трюм опломбирован · Орднунг</span><em>до выхода не продать</em></div>";
  return h;
}
function railLifeBind(w){
  const q=s=>w.querySelector(s);
  if(q(".rw-pass"))q(".rw-pass").onclick=()=>{railPassBuy();railWinRender();};
  if(q(".rw-parcel"))q(".rw-parcel").onclick=()=>{railParcelTake();railWinRender();};
  if(q(".rw-pax"))q(".rw-pax").onclick=()=>{RAIL_LIFE.pax=railPaxOffer();logAdd("dim","Попутчик: "+RAIL_LIFE.pax.who+" — «спасибо, я тихо»");railWinRender();};
}
/* ── касса: проездной обнуляет билет (багаж платится) ── */
function railPassFare(F){if(railPassOn()&&!F.metro){F.fare=0;F.sum=F.bag;F.pass=1;}return F;}
/* ── посадка: отметка проездного, билет попутчика, пломба Орднунга ── */
function railLifeBoard(t,F){
  if(F&&F.pass){G.railPass.rides=(G.railPass.rides|0)+1;
    logAdd("dim","КНИЖКА: отметка о поездке по проездному · № "+G.railPass.rides+(G.railPass.rides===RAIL_PASS_RIDES?" · окупился":""));}
  if(RAIL_LIFE.pax){const f=Math.max(4,Math.round(2*t.dist));earn(f,"rail");logAdd("money",RAIL_LIFE.pax.who+" платит за свой билет · +"+f+" кр");}
  if(typeof railOwner==="function"&&railOwner()==="or"&&held()>0){G.railSeal=1;logAdd("dim","Орднунг: трюм опломбирован до места назначения · пломба № "+(1000+hashi(G.sx,G.sy,railBucket())%9000));}
  RAIL_LIFE.tea=!!(t.k>=3&&!(typeof railFare==="function"&&railFare(t).metro));RAIL_LIFE.teaDone=false;
}
/* ── остановка в пути: чай, разговор ── */
function railLifeStop(R){
  if(RAIL_LIFE.tea&&!RAIL_LIFE.teaDone&&R.seg===1){
    RAIL_LIFE.teaDone=true;
    const L=(typeof rumoursHere==="function")?rumoursHere():[];
    peopleLine("Чай, пожалуйста. Подстаканник вернёте. "+(L.length?"А говорят, есть "+L[hashi(R.seq[0],R.seg,0x7EA)%L.length].short:"Ничего не говорят, пейте горячим."),"проводница",true);
  }
  if(RAIL_LIFE.pax&&R.seg===1&&!RAIL_LIFE.pax.said){RAIL_LIFE.pax.said=1;peopleLine(RAIL_LIFE.pax.talk,RAIL_LIFE.pax.who,false);}
}
/* ── выход: посылка сдана, попутчик сошёл, пломба снята ── */
function railLifeExit(s){
  if(G.railParcel&&G.railParcel.sx===s.sx&&G.railParcel.sy===s.sy){
    const P=G.railParcel;G.railParcel=null;earn(P.pay,"post");
    const L=(typeof rumoursHere==="function")?rumoursHere():[];
    logAdd("money","Посылка сдана в «"+P.to+"» · +"+P.pay+" кр"+(L.length?" · на почте говорят: "+L[0].short:""));
  }
  if(RAIL_LIFE.pax){logAdd("dim",RAIL_LIFE.pax.who+" сходит: «Спасибо. Если что — я тут рядом.»");RAIL_LIFE.pax=null;}
  if(G.railSeal){G.railSeal=0;logAdd("dim","Пломба снята по прибытии · Орднунг");}
}
