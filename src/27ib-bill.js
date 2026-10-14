/* ══════════════ счёт за смену (M904a · DESIGN-game §3.1, §10.1) ══════════════
   На стыковке, раньше доски, — одна бумага: что смена стоила. Замер экономики (M903, §4.1a)
   показал, что содержание не давит вовсе (U/G .06–.24 против полосы .40–.70): топливо и ТО
   игрок платит у колонки и не видит суммой, а управляющие брали оклад из собственной доли.

   ПРАВИЛА ФАЙЛА:
   1. Счёт ничего не сочиняет. Уже уплаченное (бак, ТО, руки) — строки «оплачено», чтобы смена
      читалась целиком; к оплате — только новое: оклад управляющих (развилка F2: оклад платит
      игрок, доля остаётся его деньгами и его верностью).
   2. Смена закрывается на стыковке, не раньше BILL_SHIFT_MS по часам игры от прошлой бумаги.
      Первый час — без бумаги: стажёр за счёт ГЛАВТРАССЫ; первая бумага несёт эту строку.
   3. Неоплаченное уходит в Кассу взаимопомощи (M904b, развилка F1, §5.2) и растёт на процент за
      смену. Пока там лежит неоплаченная бумага, управляющие без оклада — верность тает.
   4. Офлайн (догон mgrTick до 240 мин) пишет в счёт не больше часа — §10.5.
   5. Долг — отдельное число, а не кредиты ниже нуля: два десятка мест в коде берут
      min(G.credits, сумма), и на минусе они печатали бы деньги. Для игрока это одно и то же:
      касса даёт на бак и ремонт, когда своих не хватает, до пола — двух часов чистого своего
      яруса. У пола садится взыскатель и со следующей смены берёт: дроны, потом корпус.
   Страхкасса и потеря корпуса (F3) — в 28i-insure. */
const BILL_SHIFT_MS=10*60000,BILL_RATE=.01,BILL_OFF_MIN=60;
/* пол долга по ярусу (§5.2: два часа чистого яруса — правило в отношении, числа модели) */
const BILL_FLOOR_T=[9000,28000,28000,25000];
const BILL_COLL_NAMES=["Захар Ильич","Герман Осипович","Савва Петрович","Лука Матвеевич","Тимофей Карпович","Аристарх Фомич"];
const BILL_LINES={
  fuel:{ru:"топливо",voice:"Норма расхода. Перерасход — ваш."},
  yard:{ru:"обслуживание корпуса",voice:"Прошли бы ТО вовремя — было бы дешевле."},
  crew:{ru:"наёмные руки",voice:"За работу, не за простой."},
  mgr:{ru:"управляющие",voice:"Оклад — ваш. Доля — наша."},
  late:{ru:"с прошлой смены",voice:"Один процент за смену. Не задерживайте."},
  debt:{ru:"касса взаимопомощи",voice:"Один процент за смену. Касса не торопит — пока."},
  ins:{ru:"Страхкасса",voice:"Взнос за смену. Не задерживайте."}
};
function billSt(){
  if(!G.bill||typeof G.bill!=="object")G.bill={};
  const B=G.bill;
  if(!B.cur||typeof B.cur!=="object")B.cur={};
  if(!B.due||typeof B.due!=="object")B.due={};
  /* смена — по часам игры (now): налёт G.flownMs идёт только в полёте, а смена — и на грунте */
  if(!(B.from>=0))B.from=now();
  B.n=B.n|0;
  B.debt=Math.max(0,+B.debt||0);
  return B;
}
/* ── касса взаимопомощи (M904b) ── */
/* ярус — по самому дорогому корпусу во владении: долг меряется тем, что игрок держит */
function billTier(){
  let p=0;for(const id in G.owned)if(G.owned[id]){const S=shipData(id);if(S&&S.price>p)p=S.price;}
  return p<5000?0:p<12000?1:p<20000?2:3;
}
function billFloor(){return BILL_FLOOR_T[billTier()];}
function billDebt(){return Math.round(billSt().debt);}
function billRoom(){return Math.max(0,billFloor()-billDebt());}
/* касса даёт недостающее на нужное (бак, ремонт): кредиты растут ровно на долг */
function billLend(want){
  if(!billOn())return 0;
  const x=Math.max(0,Math.min(Math.ceil(want),billRoom()));
  if(x>0){billSt().debt+=x;G.credits+=x;}
  return x;
}
/* недотраченное из займа — обратно в кассу, долг не висит за то, что не купили */
function billUnlend(lent,c0){
  const back=Math.max(0,Math.min(lent,G.credits-c0));
  if(back>0){billSt().debt-=back;G.credits-=back;}
  return lent-back;
}
function billOn(){return !firstHour();}
function billPaid(k,sum){if(sum>0&&billOn()){const B=billSt();B.cur[k]=(B.cur[k]||0)+sum;}}
function billDue(k,sum){if(sum>0&&billOn()){const B=billSt();B.due[k]=(B.due[k]||0)+sum;}}
/* сколько осталось по последней бумаге */
function billLeft(){const P=billSt().paper;return P?Math.max(0,Math.round(P.total-P.paid)):0;}
/* неоплаченная бумага ушла в кассу и ещё там — управляющие без оклада */
function billLate(){return !!billSt().late&&billDebt()>0;}
/* всё, что игрок должен: остаток бумаги и касса */
function billOwed(){return billLeft()+billDebt();}
/* корпус уходит со всем, что на нём (как «Сброс» в 16c-rescue): поставленные ступени модулей,
   части из описи; если на нём летали — пересадка на «Стриж», лишний груз за борт (людей — нет) */
function hullTake(id){
  if(!id||id==="strizh"||!G.owned[id])return false;
  delete G.owned[id];
  const lostFit=G.fit[id]||{};
  for(const k in lostFit){const p=partById(lostFit[k]);const i=p?G.inv.indexOf(p):-1;if(i>=0)G.inv.splice(i,1);}
  delete G.fit[id];
  if(G.shipId===id){
    for(const k in G.mods){G.modsOwned[k]=Math.max(0,(G.modsOwned[k]|0)-(G.mods[k]|0));G.mods[k]=0;}
    G.shipId="strizh";G.owned.strizh=true;invalidateParts();
    const ns=stat();G.fuel=Math.min(G.fuel,ns.fuelMax);G.hull=Math.min(G.hull,ns.hullMax);
    let over=held()-ns.cargoMax;
    for(const k of RES_KEYS){if(over<=0)break;if(PAX_KEYS.indexOf(k)>=0)continue;
      const t=Math.min(over,G.cargo[k]);G.cargo[k]-=t;over-=t;}
  }
  return true;
}
/* что взыскатель возьмёт первым (§5.2: дроны, потом корпус) и во что он это ставит — в полцены */
function billNext(){
  if((G.droneInventory|0)>0)return {k:"inv",ru:"дрон из запаса",v:Math.round(DRONES.miner.price*.5)};
  if(G.drones&&G.drones.length){const d=G.drones[G.drones.length-1];
    return {k:"drone",d,ru:"дрон «"+droneName(d)+"»",v:Math.round(DRONES.miner.price*.5)};}
  let id=null,p=0;
  for(const k in G.owned)if(G.owned[k]&&k!=="strizh"){const S=shipData(k);if(S&&S.price>p){p=S.price;id=k;}}
  if(id)return {k:"hull",id,ru:"корпус «"+shipData(id).ru+"»",v:Math.round(p*.5)};
  return null;
}
function billSeize(B){
  const X=billNext();if(!X)return null;
  if(X.k==="inv")G.droneInventory--;
  else if(X.k==="drone"){const i=G.drones.indexOf(X.d);if(i>=0)G.drones.splice(i,1);}
  else hullTake(X.id);
  B.debt=Math.max(0,B.debt-X.v);B.coll.took=(B.coll.took|0)+1;
  logAdd("bad","Взыскатель "+B.coll.nm+" забрал "+X.ru+" · в счёт долга −"+X.v.toLocaleString("ru")+" кр");
  say("Взыскатель забрал "+X.ru+"\nв счёт долга −"+X.v.toLocaleString("ru")+" кр",220);
  return X;
}
/* у пола: первая смена — садится и ждёт, каждая следующая у пола — берёт одно */
function billCollector(B){
  if(B.debt<billFloor())return null;
  if(!B.coll){
    const r=rng(hashi(B.n|0,B.debt|0,0xC011));
    B.coll={nm:pick(BILL_COLL_NAMES,r),at:now(),took:0,seed:Math.floor(r()*1e9)};
    const X=billNext();
    logAdd("bad","Касса взаимопомощи на пределе · в кантине сел взыскатель "+B.coll.nm);
    say("Взыскатель "+B.coll.nm+":\nЯ подожду смену."+(X?"\nПотом — "+X.ru+".":""),220);
    return null;
  }
  return billSeize(B);
}
function billCollLeave(B){
  if(!B.coll)return;
  logAdd("good","Взыскатель "+B.coll.nm+" встал из-за стола: «Касса вами довольна. Пока.»");
  B.coll=null;
}
/* закрыть смену: строки из накопленного; неоплаченное прошлой — в кассу, касса — с процентом */
function billClose(){
  const B=billSt(),L=[];
  insAccrue(B);   /* Страхкасса (28i): взнос за прожитые смены */
  for(const k of ["fuel","yard","crew"]){const v=Math.round(B.cur[k]||0);if(v>0)L.push({k,sum:v,paid:true});}
  for(const k of ["mgr","ins"]){const v=Math.round(B.due[k]||0);if(v>0)L.push({k,sum:v,paid:false});}
  const prev=billLeft();
  if(prev>0){B.debt+=prev;B.late=true;if(B.paper)B.paper.paid=B.paper.total;}
  if(B.debt>0)B.debt=Math.ceil(B.debt*(1+BILL_RATE));else B.late=false;
  const first=!B.n&&(G.flownMs||0)<2*FIRST_HOUR_MS;   /* стажёр — только у новичка, не у старой записи */
  B.cur={};B.due={};B.from=now();
  billCollector(B);
  if(!L.length&&!first){B.paper=null;return null;}
  B.n++;
  const total=L.filter(x=>!x.paid).reduce((a,x)=>a+x.sum,0);
  B.paper={n:B.n,lines:L,total,paid:0,first,at:G.flownMs||0,st:G.sys?G.sys.key:""};
  if(total>0||B.debt>0)logAdd("warn","Счёт за смену № "+B.n+" · к оплате "+total.toLocaleString("ru")+" кр"+
    (B.debt>0?" · в кассе взаимопомощи "+billDebt().toLocaleString("ru"):""));
  return B.paper;
}
/* одно касание: сперва бумага, потом касса; платится сколько есть */
function billPay(){
  const B=billSt(),P=B.paper,owe=billOwed();if(owe<=0)return 0;
  const x=Math.min(owe,Math.max(0,Math.floor(G.credits)));
  if(x<=0){say("Не хватает кредитов");return 0;}
  G.credits-=x;
  const a=P?Math.min(x,billLeft()):0;if(P)P.paid+=a;
  B.debt=Math.max(0,B.debt-(x-a));
  if(B.debt<=0){B.late=false;billCollLeave(B);}
  if(billOwed()<=0)say("Счёт за смену оплачен\n−"+x.toLocaleString("ru")+" кр");
  else say("Оплачено на что хватило\n−"+x.toLocaleString("ru")+" кр · осталось "+billOwed().toLocaleString("ru"));
  return x;
}
/* ── где счёт берёт строки ── */
const BILL_OLD_OPEN=openStation;
openStation=function(){
  const r=BILL_OLD_OPEN.apply(this,arguments);
  if(billOn()&&(now()-billSt().from>=BILL_SHIFT_MS||now()<billSt().from)){
    billClose();
    if(G.mode==="dock"&&typeof renderTab==="function")renderTab();   /* бумага и взыскатель — на этой же доске */
  }
  return r;
};
/* ремонт: своих не хватает — касса даёт недостающее до пола; недотраченное возвращается */
const BILL_OLD_REPAIR=repairDo;
repairDo=function(frac){
  const q=repairQuote(frac),c0=G.credits;
  const lent=(q.units&&G.credits<q.cost)?billLend(q.cost-G.credits):0;
  const c1=G.credits,r=BILL_OLD_REPAIR.apply(this,arguments);
  billPaid("yard",c1-G.credits);
  const kept=lent?billUnlend(lent,c0):0;
  if(kept>0)say("Касса взаимопомощи\nна ремонт в долг "+kept.toLocaleString("ru")+" кр",160);
  return r;
};
const BILL_OLD_CREW=crewPayroll;
crewPayroll=function(){const c0=G.credits,r=BILL_OLD_CREW.apply(this,arguments);billPaid("crew",c0-G.credits);return r;};
/* бак: обработчик кнопки безымянный — до него касса запоминается (и даёт в долг недостающее)
   на погружении, после — на всплытии */
{
  const b=document.getElementById("bRefuel");let c0=null,c1=null,lent=0;
  if(b){
    b.addEventListener("click",()=>{
      c0=G.credits;lent=0;
      const need=Math.ceil(stat().fuelMax-G.fuel),cost=need>0?need*fuelPriceHere():0;
      if(cost>G.credits)lent=billLend(cost-G.credits);
      c1=G.credits;
    },true);
    b.addEventListener("click",()=>{
      if(c1!=null)billPaid("fuel",c1-G.credits);
      const kept=lent?billUnlend(lent,c0):0;
      if(kept>0){say("Касса взаимопомощи\nна бак в долг "+kept.toLocaleString("ru")+" кр",160);renderTab();}
      c0=c1=null;lent=0;
    });
  }
}
/* F2: оклад управляющего — из кассы игрока через счёт, а не из его доли. Машина (ai) и аренда
   — по-старому: у них обслуживание и тариф, не оклад */
const BILL_OLD_PAYROLL=mgrPayroll;
mgrPayroll=function(m,min){
  if(m.ai||m.rent||!billOn())return BILL_OLD_PAYROLL(m,min);
  const due=mgrPay(m)*Math.min(min,BILL_OFF_MIN);
  billDue("mgr",due);m.spent=(m.spent||0)+Math.round(due);
  const late=billLate();
  if(late&&relicDeep("blank")){m.warnPay=0;return;}
  const drop=mgrTraitMul(m,"loyDrop");
  if(late){
    m.loy=Math.max(0,m.loy-min*.5*drop*((typeof holdLoyaltyHold==="function"&&holdLoyaltyHold())?0:1));
    if(!m.warnPay&&m.loy<45){
      m.warnPay=1;mgrSay(m,"Счёт за смену не оплачен — сижу без оклада. Я это помню.","warn");
      logAdd("warn",m.name+" без оклада: счёт за смену не оплачен — верность подтаивает");
    }
  }else{m.warnPay=0;m.loy=Math.min(100,m.loy+min*.35/drop);}
};
/* ── бумага на доске: первой, раньше новостей ── */
function billSection(){
  const B=billSt(),P=B.paper,left=billLeft(),debt=billDebt(),owe=left+debt;
  const showP=!!P&&(left>0||P.st===(G.sys&&G.sys.key));   /* оплаченная бумага видна только там, где её дали */
  if(!showP&&!debt)return;
  secHead(showP?"СЧЁТ ЗА СМЕНУ № "+P.n:"КАССА ВЗАИМОПОМОЩИ",{count:owe?owe.toLocaleString("ru")+" кр":"оплачено"});
  if(showP){
    if(P.first)$body.appendChild(el("div","row","<div class='nm'><b>стажёр</b><s>«Первая смена за счёт управления. Дальше — сами.»</s></div>"));
    for(const x of P.lines){
      const D=BILL_LINES[x.k]||{ru:x.k,voice:""};
      $body.appendChild(el("div","row","<div class='nm'><b>"+D.ru+" · "+x.sum.toLocaleString("ru")+" кр</b><s>"+
        (x.paid?"оплачено на месте · ":"")+"«"+D.voice+"»</s></div>"));
    }
  }
  if(debt>0){
    const D=BILL_LINES.debt;
    $body.appendChild(el("div","row","<div class='nm'><b>"+D.ru+" · долг "+debt.toLocaleString("ru")+" кр</b><s>«"+D.voice+
      "» · предел "+billFloor().toLocaleString("ru")+" кр</s></div>"));
  }
  if(B.coll){
    const X=billNext();
    $body.appendChild(el("div","row","<div class='nm'><b>взыскатель "+B.coll.nm+" · в кантине</b><s>"+
      (X?"у предела следующей сменой возьмёт: "+X.ru:"брать больше нечего — ждёт денег")+"</s></div>"));
  }
  if(owe>0){
    const r=el("div","row");
    r.appendChild(el("div","nm","<b>к оплате "+owe.toLocaleString("ru")+" кр</b><s>"+
      (B.late?"прошлая смена в кассе — управляющие без оклада":"не оплатите — уйдёт в кассу взаимопомощи с процентом")+"</s></div>"));
    const b=el("button","act gold","ОПЛАТИТЬ");
    b.onclick=()=>{sfx("ui");billPay();renderTab();};
    r.appendChild(b);$body.appendChild(r);
  }
}
/* бумага и касса — в полосе «К ВАМ» (доска раскладывает секции по заголовку): это обращено к вам */
LANE_RX.unshift([/^(СЧЁТ ЗА СМЕНУ|КАССА ВЗАИМОПОМОЩИ)/i,"you"]);
const BILL_OLD_BOARD=stTabBoard;
stTabBoard=function(){billSection();insSection();return BILL_OLD_BOARD.apply(this,arguments);};
/* взыскатель сидит в кантине (§5.2): карточка в зале — кто он, сколько, что возьмёт следующим */
const BILL_OLD_HALL=cantHall;
cantHall=function(){
  const r=BILL_OLD_HALL.apply(this,arguments),B=billSt();
  if(!B.coll)return r;
  const gs=$body.querySelectorAll(".ch-grid"),grid=gs[gs.length-1];if(!grid)return r;
  const e=grid.querySelector(".ch-empty");if(e)e.remove();
  const X=billNext(),c=el("div","ch-card hire");
  c.style.setProperty("--k","#c8644f");
  const f=el("div","ch-face","<i class='ch-role'>ВЗЫСКАТЕЛЬ</i>");
  /* лицо — из того же генератора людей (L3): седой, в тёмном, с красной нитью */
  f.appendChild(cantFace({seed:B.coll.seed>>>0,acc:[168,72,58],age:58,name:B.coll.nm},124));
  c.appendChild(f);
  c.appendChild(el("div","ch-id","<b>"+B.coll.nm+"</b><s>за вашим столом · долг "+billDebt().toLocaleString("ru")+" кр"+
    (X?" · следующим возьмёт "+X.ru:"")+"</s>"));
  const go=el("div","ch-go"),b=el("button","act gold","ОПЛАТИТЬ");
  b.onclick=()=>{sfx("ui");billPay();renderTab();};
  go.appendChild(b);c.appendChild(go);grid.insertBefore(c,grid.firstChild);   /* первым: он здесь из-за вас */
  return r;
};
/* касса в шапке станции: долг рядом с кредитами, а не только на доске */
const BILL_OLD_TABBODY=renderTabBody;
renderTabBody=function(){
  const r=BILL_OLD_TABBODY.apply(this,arguments);
  const d=billDebt(),c=document.getElementById("wCr");
  if(d>0&&c)c.textContent=G.credits.toLocaleString("ru")+" кр · долг "+d.toLocaleString("ru");
  return r;
};
/* запись: поле G.bill — в снимок и обратно (белый список 14-save не трогаем — обёртка) */
const BILL_OLD_SNAP=snapshot;
snapshot=function(){const s=BILL_OLD_SNAP.apply(this,arguments);s.bill=G.bill||null;return s;};
const BILL_OLD_APPLY=applySave;
applySave=function(s){
  const r=BILL_OLD_APPLY.apply(this,arguments);
  const b=s&&s.bill;
  G.bill=(b&&typeof b==="object")?{cur:(b.cur&&typeof b.cur==="object")?b.cur:{},due:(b.due&&typeof b.due==="object")?b.due:{},
    from:+b.from||0,n:b.n|0,late:!!b.late,paper:(b.paper&&Array.isArray(b.paper.lines))?b.paper:null,
    debt:Math.max(0,+b.debt||0),
    coll:(b.coll&&typeof b.coll.nm==="string")?{nm:b.coll.nm,at:+b.coll.at||0,took:b.coll.took|0,seed:(b.coll.seed>>>0)||b.coll.nm.length*7919}:null}:null;
  return r;
};
