/* ══════════════ кооператив: покупать для себя, и люди, которые делают это с вами (M351) ══════════════
   Лестница автора (2026-09-04): на дядю → лицензия-кооператив → своё
   (docs/DESIGN-coop.md). Ступень первая остаётся как есть: наряд дома и плечо
   «ПО МАРШРУТУ» на счёт дома, прилавок закрыт. «Закон о кооперации Главтрассы»:
   экипаж покупает и продаёт для себя только как кооператив, записанный под одним
   из четырёх домов — тот становится патроном. Экзамен — оборот: G.soldTotal ≥ 12 000
   (тот же счётчик, что выдаёт «Вьюк» на 3 000). Взнос 1 500. Имя вписывает игрок,
   игра его не предлагает (как у имён систем, 11u); штамп — в КНИЖКУ.

   После штампа: прилавок открыт на любой товар, цена ломтями (аудит A2: за
   каждые десять единиц просимая растёт на три процента, продажная так же падает),
   потолок за заход по разряду (I 60 / II 150 / III без); найм открывается —
   crewCap читает разряд (1/3/5) плюс лицензия плюс управляющий; страница в ДЕЛАХ:
   кто на жалованье, что заработали за смену, что стоили, чего просят. Просьбы —
   существующие постройки семьи G на станции холдинга (12ac) и две не-постройки
   (выходной в праздник, табличка на борту — косметика «Сороки» M344). Дух 0…5
   словами, ±1 % на выработку дронов и валовый наёмников за пункт.

   Разряды: I Кооператив (экзамен) · II Артель (100 000 оборота с записи и две
   просьбы) · III Товарищество (500 000 и четыре; BUY_SPREAD 1.06 → 1.03).

   ПРАВИЛА ФАЙЛА:
   1. Хранится G.coop={name,house,since,sold0,spirit,wants,done,ledger,shift,visit}.
      Члены — то, что уже есть на жалованье: G.drones, G.crew, G.mgrs. Ничего нового.
   2. Гроссбух — те же деньги, что двигает earn(): по «why» за текущую и прошлую смену.
   3. Просьбы порождаются составом, не броском; исполненная — в done, спасибо в ЛЮДИ. */
const COOP_FEE=1500, COOP_EXAM=12000;
const COOP_RANKS=[
  {n:1,ru:"Кооператив",   cap:60,  crew:1, need:0,      asks:0, spread:1.06},
  {n:2,ru:"Артель",       cap:150, crew:3, need:100000, asks:2, spread:1.06},
  {n:3,ru:"Товарищество", cap:0,   crew:5, need:500000, asks:4, spread:1.03}
];
const COOP_SLICE=10, COOP_STEP=.03, COOP_ASK_MAX=3;
const COOP_WHY={trade:"торговля",drone:"дроны",crew:"наёмники",share:"пай",free:"призовые",route:"маршрут",deal:"сделки",other:"прочее"};
function coopHas(){return !!(G.coop&&G.coop.name);}
function coopRec(){return coopHas()?G.coop:null;}
function coopRank(){
  const C=coopRec();if(!C)return null;
  const turn=Math.max(0,(G.soldTotal|0)-(C.sold0|0)),granted=(C.done||[]).length;
  let R=COOP_RANKS[0];
  for(const r of COOP_RANKS)if(turn>=r.need&&granted>=r.asks)R=r;
  return R;
}
function coopCanRegister(){return (G.soldTotal|0)>=COOP_EXAM;}
function coopHouseHere(){return (G.sys&&G.sys.station&&typeof houseOf==="function")?houseOf(G.sys):null;}
/* штамп: имя от игрока, взнос, оборот; патрон — дом этой станции */
function coopRegister(name){
  if(coopHas())return false;
  const H=coopHouseHere();if(!H){say("Записывают только на станции дома");return false;}
  name=String(name||"").trim().slice(0,24);
  if(name.length<2){say("Кооперативу нужно имя");return false;}
  if(!coopCanRegister()){say("Оборот "+(G.soldTotal|0).toLocaleString("ru")+" из "+COOP_EXAM.toLocaleString("ru")+" — рано");return false;}
  if(G.credits<COOP_FEE){say("Взнос "+COOP_FEE+" кр — не хватает");return false;}
  G.credits-=COOP_FEE;
  G.coop={name,house:H.id,since:celDay(),sold0:G.soldTotal|0,spirit:2,wants:[],done:[],ledger:{},shift:holdShift(),visit:{key:"",bought:{}}};
  if(typeof recordAdd==="function")recordAdd("кооператив","штамп дома "+H.ru+" · «"+name+"» · взнос "+COOP_FEE+" кр · оборот "+(G.soldTotal|0).toLocaleString("ru"));
  tell("good","Кооператив «"+name+"» записан под домом "+H.ru,"КООПЕРАТИВ «"+name.toUpperCase()+"»\nпатрон — дом "+H.ru+"\nприлавок открыт · найм открыт\nстраница — ДЕЛА на столе");
  if(typeof peopleLine==="function")peopleLine("Штамп поставлен. Не спрашиваю, чем торговать будете, — спрашивал бы, если бы оборота не было.","клерк дома "+H.ru,true);
  return true;
}
/* ── прилавок: ломти и потолок за заход ── */
function coopVisitReset(){const C=coopRec();if(C){C.visit={key:G.sys?G.sys.key:"",bought:{}};}}
function coopCapLeft(k){
  const C=coopRec(),R=coopRank();if(!C||!R)return 0;
  if(!R.cap)return 1e9;
  const V=C.visit&&C.visit.key===(G.sys?G.sys.key:"")?C.visit:(C.visit={key:G.sys?G.sys.key:"",bought:{}});
  return Math.max(0,R.cap-(V.bought[k]|0));
}
function coopBought(k,n){const C=coopRec();if(!C)return;const V=C.visit||(C.visit={key:G.sys?G.sys.key:"",bought:{}});V.bought[k]=(V.bought[k]|0)+(n|0);}
function coopSpread(){const R=coopRank();return R?R.spread:BUY_SPREAD;}
/* сколько стоит взять qty: ломтями по десять, каждый следующий на три процента дороже */
function coopBuyQuote(sys,k,qty){
  qty=Math.max(0,qty|0);
  const ask0=buyPriceFor(sys,k);let total=0;
  for(let i=0;i<qty;i++)total+=ask0*(1+COOP_STEP*Math.floor(i/COOP_SLICE));
  return {total:Math.round(total),ask0,askLast:Math.round(ask0*(1+COOP_STEP*Math.floor(Math.max(0,qty-1)/COOP_SLICE)))};
}
/* продажа ломтями: доля без надбавки дешевеет на три процента за каждые десять, не ниже .7 */
function coopSellSlice(base,qty){
  let total=0;for(let i=0;i<qty;i++)total+=base*Math.max(.7,1-COOP_STEP*Math.floor(i/COOP_SLICE));
  return total;
}
/* взять с прилавка: только кооперативу, в потолок, ломтями */
function coopBuy(sys,k,qty){
  const C=coopRec();if(!C){say("Взять товар могут только кооперативы");return 0;}
  if(!RES[k]||TRADE_KEYS.indexOf(k)<0)return 0;
  const free=Math.max(0,stat().cargoMax-held());
  qty=Math.max(0,Math.min(qty|0,free,coopCapLeft(k)));
  if(qty<=0)return 0;
  let Q=coopBuyQuote(sys,k,qty);
  while(qty>0&&Q.total>G.credits){qty--;Q=coopBuyQuote(sys,k,qty);}
  if(qty<=0)return 0;
  G.credits-=Q.total;G.cargo[k]=(G.cargo[k]||0)+qty;
  const m=G.market[sys.key];if(m){m.ask=m.ask||{};m.ask[k]=Math.min(.35,(m.ask[k]||0)+qty*.005);}
  if(typeof appetiteBought==="function")appetiteBought(sys,k,qty);
  coopBought(k,qty);
  coopCost(Q.total,"trade");
  return qty;
}
/* ── гроссбух: те же деньги, что двигает earn() ── */
function coopLedger(){
  const C=coopRec();if(!C)return null;
  const s=holdShift();
  if(!C.ledger||C.shift!==s||!C.ledger.in){C.prev=(C.ledger&&C.ledger.in&&C.shift===s-1)?C.ledger:null;C.ledger={in:{},out:{}};C.shift=s;}
  return C.ledger;
}
function coopEarn(sum,why){
  const L=coopLedger();if(!L)return;
  const w=COOP_WHY[why]?why:"other";
  L.in[w]=(L.in[w]|0)+Math.round(sum);
}
function coopCost(sum,why){
  const L=coopLedger();if(!L)return;
  L.out[why||"other"]=(L.out[why||"other"]|0)+Math.round(sum);
}
/* ── дух: 0…5, словами ── */
function coopSpirit(){const C=coopRec();return C?clamp(C.spirit|0,0,5):0;}
function coopSpiritRu(){const s=coopSpirit();return s>=4?"бодрое":(s>=2?"ровное":"кислое");}
function coopMul(){return coopHas()?1+coopSpirit()*.01:1;}
function coopSpiritAdd(d,why){
  const C=coopRec();if(!C)return;
  const was=coopSpirit();C.spirit=clamp(was+d,0,5);
  if(C.spirit!==was&&why)logAdd(d>0?"good":"warn","Кооператив «"+C.name+"»: настроение "+coopSpiritRu()+" — "+why);
}
/* ── просьбы: из состава, не броском ── */
const COOP_ASKS=[
  {id:"canteen", bld:"canteen",  ru:"столовая",        say:"люди едят всухомятку",                    when:()=>(G.crew||[]).length>=3, up:1},
  {id:"hangar",  bld:"hangar",   ru:"ангар",           say:"десять машин, а чинят под открытым небом", when:()=>(G.drones||[]).length>=5, up:2},
  {id:"redcorner",bld:"redcorner",ru:"красный уголок", say:"управляющему негде собрать людей",         when:()=>(G.mgrs||[]).length>=1, up:1},
  {id:"medpoint",bld:"medpoint", ru:"медпункт",        say:"из плена возвращаются без зубов",          when:()=>(G.crew||[]).some(c=>(c.captured|0)>=2)||(G.coop&&(G.coop.captured|0)>=2), up:1},
  {id:"school",  bld:"school",   ru:"учебный пункт",   say:"машин десять, а учить некому",             when:()=>(G.drones||[]).length>=10, up:1},
  {id:"dayoff",  bld:null,       ru:"выходной в праздник",say:"один день в году",                      when:()=>(G.crew||[]).length>=1, up:1},
  {id:"plate",   bld:null,       ru:"табличка на борту",say:"чтобы знали, чей борт",                   when:()=>(G.crew||[]).length+(G.mgrs||[]).length>=2, up:1}
];
const COOP_ASK_BY={};COOP_ASKS.forEach(a=>COOP_ASK_BY[a.id]=a);
function coopAskGranted(a){
  if(a.bld){
    if(typeof bldHas!=="function")return false;
    for(const key in (G.hold||{})){const [sx,sy]=key.split(",").map(Number);if(bldHas(sx,sy,a.bld))return true;}
    return false;
  }
  if(a.id==="dayoff")return !!(G.coop&&G.coop.dayoff);
  if(a.id==="plate")return typeof cosmOn==="function"&&cosmOn("mark")==="mk_plate";
  return false;
}
/* открытые просьбы — до трёх; исполненные уезжают в done, спасибо в ЛЮДИ */
function coopAsks(){
  const C=coopRec();if(!C)return [];
  C.wants=C.wants||[];C.done=C.done||[];
  for(const a of COOP_ASKS){
    if(C.done.indexOf(a.id)>=0)continue;
    const open=C.wants.indexOf(a.id)>=0;
    if(!open&&C.wants.length<COOP_ASK_MAX&&a.when())C.wants.push(a.id);
  }
  for(const id of C.wants.slice()){
    const a=COOP_ASK_BY[id];
    if(a&&coopAskGranted(a)){
      C.wants.splice(C.wants.indexOf(id),1);C.done.push(id);
      coopSpiritAdd(a.up,"просьба исполнена — "+a.ru);
      if(typeof peopleLine==="function")peopleLine("Спасибо за "+a.ru+". Люди заметили.","кооператив «"+C.name+"»",true);
    }
  }
  return C.wants.map(id=>COOP_ASK_BY[id]).filter(Boolean);
}
/* выходной в праздник: одна кнопка, рейсы в этот день не шлём (12a читает coopDayOff) */
function coopGiveDayOff(){
  const C=coopRec();if(!C)return false;
  const hol=(typeof holNow==="function")?holNow():null;
  if(!hol){say("Выходной дают в праздник — по календарю");return false;}
  C.dayoff=hol.id+":"+new Date().getFullYear();
  return true;
}
function coopDayOff(){const C=coopRec();const hol=(typeof holNow==="function")?holNow():null;return !!(C&&hol&&C.dayoff===hol.id+":"+new Date().getFullYear());}
/* ── страница в ДЕЛАХ ── */
function coopBlock(box){
  const C=coopRec();
  const row=(cls,em,html)=>{const r=document.createElement("div");r.className="li "+(cls||"");const e=document.createElement("em");e.textContent=em||"";
    const s=document.createElement("span");s.innerHTML=html;r.appendChild(e);r.appendChild(s);box.appendChild(r);return r;};
  if(!C){
    row("dim","","<b>КООПЕРАТИВА НЕТ</b> · взять товар и нанимать могут только кооперативы · оборот "+(G.soldTotal|0).toLocaleString("ru")+" из "+COOP_EXAM.toLocaleString("ru")+" · записывают на станции любого дома, взнос "+COOP_FEE+" кр");
    return;
  }
  const R=coopRank(),H=HOUSE_BY_ID[C.house];
  row("head","","КООПЕРАТИВ «"+C.name.toUpperCase()+"» · "+R.ru.toUpperCase()+" ("+["I","II","III"][R.n-1]+") · под домом "+(H?H.ru:"")+" · с "+C.since+"-го дня");
  row("","","машин "+(G.drones||[]).length+" · людей "+(G.crew||[]).length+" · управляющих "+(G.mgrs||[]).length+" · настроение "+coopSpiritRu()+" (+"+coopSpirit()+" %)"+
    " · оборот с записи "+Math.max(0,(G.soldTotal|0)-(C.sold0|0)).toLocaleString("ru")+(R.n<3?" · до следующего разряда "+Math.max(0,COOP_RANKS[R.n].need-Math.max(0,(G.soldTotal|0)-(C.sold0|0))).toLocaleString("ru")+" и просьб "+Math.max(0,COOP_RANKS[R.n].asks-(C.done||[]).length):""));
  const L=coopLedger();
  const sumIn=Object.values(L.in).reduce((a,b)=>a+b,0),sumOut=Object.values(L.out).reduce((a,b)=>a+b,0);
  const ins=Object.keys(L.in).map(w=>COOP_WHY[w]+" "+L.in[w].toLocaleString("ru")).join(" · ")||"пока ничего";
  const outs=Object.keys(L.out).map(w=>({wages:"оклады",repair:"ремонт",trade:"закупка",other:"прочее"}[w]||w)+" "+L.out[w].toLocaleString("ru")).join(" · ")||"—";
  row("","","ЗА СМЕНУ · "+ins+" · = "+sumIn.toLocaleString("ru")+"<br>"+outs+" · чистыми "+(sumIn-sumOut).toLocaleString("ru"));
  const asks=coopAsks();
  if(asks.length){
    row("head","","ПРОСЬБЫ · "+asks.length);
    for(const a of asks){
      const r=row("","·",a.ru+" — «"+a.say+"» → "+(a.bld?"постройка «"+BLD[a.bld].ru+"» на станции холдинга":(a.id==="dayoff"?"выходной в праздник, без стройки":"табличка с «Сороки» на борту"))+" · дух +"+a.up);
      if(a.id==="dayoff"&&typeof holNow==="function"&&holNow()){
        const b=document.createElement("button");b.className="act sm gold";b.textContent="ДАТЬ ВЫХОДНОЙ";
        b.onclick=()=>{coopGiveDayOff();coopAsks();if(typeof tableRender==="function")tableRender();};
        r.appendChild(b);
      }
    }
  }else row("dim","","просьб нет: люди довольны или их ещё мало");
  if((C.done||[]).length)row("dim","","исполнено: "+C.done.map(id=>COOP_ASK_BY[id]?COOP_ASK_BY[id].ru:id).join(", "));
}
/* ── станция: прилавок ВЗЯТЬ и запись ── */
function coopCounterBlock(){
  if(!G.sys||!G.sys.station||!G.sys.station.prices)return;
  const C=coopRec(),prices=marketFor(G.sys);
  if(!C){
    $body.appendChild(el("div","sec","ВЗЯТЬ ТОВАР МОГУТ ТОЛЬКО КООПЕРАТИВЫ · ОБОРОТ "+(G.soldTotal|0).toLocaleString("ru")+" ИЗ "+COOP_EXAM.toLocaleString("ru")));
    return;
  }
  const R=coopRank();
  $body.appendChild(el("div","sec","ПРИЛАВОК · КООПЕРАТИВ «"+C.name.toUpperCase()+"» · "+R.ru.toUpperCase()+(R.cap?" · ДО "+R.cap+" ЕДИНИЦ ТОВАРА ЗА ЗАХОД":" · БЕЗ ПОТОЛКА")+" · ЦЕНА ЛОМТЯМИ ПО ДЕСЯТЬ"));
  for(const k of TRADE_KEYS){
    if(!prices[k])continue;
    const left=coopCapLeft(k),free=Math.max(0,stat().cargoMax-held());
    const maxN=Math.min(left,free);
    const q0=coopBuyQuote(G.sys,k,10);
    const r=el("div","row");
    r.appendChild(el("div","nm","<b style='color:"+RES[k].col+"'>"+RES[k].ru+"</b><s>"+q0.ask0+" кр за первый десяток, дальше дороже"+(left<1e8?" · за заход ещё "+left:"")+(free?"":" · трюм полон")+"</s>"));
    const box=el("div","modbtns");
    for(const n of [10,50]){
      const nn=Math.min(n,maxN);
      const b=el("button","act sm"+(nn>0?"":""),"ВЗЯТЬ ×"+n);b.disabled=nn<=0;
      b.onclick=()=>{const got=coopBuy(G.sys,k,n);if(got)tell("money","Взято на «"+G.st.name+"»: "+RES[k].ru.toLowerCase()+" ×"+got,"Взято: "+RES[k].ru+" ×"+got);else say("Не взять: потолок, трюм или деньги");renderTab();};
      box.appendChild(b);
    }
    const bm=el("button","act sm gold","ВЗЯТЬ ВСЁ");bm.disabled=maxN<=0;
    bm.onclick=()=>{const got=coopBuy(G.sys,k,maxN);if(got)tell("money","Взято на «"+G.st.name+"»: "+RES[k].ru.toLowerCase()+" ×"+got,"Взято: "+RES[k].ru+" ×"+got);renderTab();};
    box.appendChild(bm);
    r.appendChild(box);$body.appendChild(r);
  }
}
function coopRegBlock(){
  if(coopHas())return;
  const H=coopHouseHere();if(!H)return;
  $body.appendChild(el("div","sec","ЗАПИСЬ КООПЕРАТИВА · ДОМ "+H.ru.toUpperCase()+" · ВЗНОС "+COOP_FEE+" КР · ОБОРОТ "+(G.soldTotal|0).toLocaleString("ru")+" ИЗ "+COOP_EXAM.toLocaleString("ru")));
  const r=el("div","row");
  const nm=el("div","nm","<b>Имя кооператива</b><s>вписывает капитан; клерк смотрит книжку и ставит штамп, если оборот есть</s>");
  const inp=document.createElement("input");inp.type="text";inp.maxLength=24;inp.placeholder="«Тихий ход»";inp.className="coopname";
  inp.addEventListener("keydown",ev=>ev.stopPropagation());inp.addEventListener("keyup",ev=>ev.stopPropagation());
  nm.appendChild(inp);r.appendChild(nm);
  const b=el("button","act"+(coopCanRegister()&&G.credits>=COOP_FEE?" gold":""),"ЗАПИСАТЬ");
  b.disabled=!coopCanRegister()||G.credits<COOP_FEE;
  b.onclick=()=>{if(coopRegister(inp.value))renderTab();};
  r.appendChild(b);$body.appendChild(r);
}
