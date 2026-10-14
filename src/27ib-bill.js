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
   3. Неоплаченное переходит в следующую бумагу с процентом за смену. Пока висит прошлая
      бумага, управляющие без оклада — верность тает (как прежний «голый процент»).
   4. Офлайн (догон mgrTick до 240 мин) пишет в счёт не больше часа — §10.5.
   Долг ниже нуля (F1), Страхкасса и потеря корпуса (F3) — следующие шаги M904. */
const BILL_SHIFT_MS=10*60000,BILL_RATE=.01,BILL_OFF_MIN=60;
const BILL_LINES={
  fuel:{ru:"топливо",voice:"Норма расхода. Перерасход — ваш."},
  yard:{ru:"обслуживание корпуса",voice:"Прошли бы ТО вовремя — было бы дешевле."},
  crew:{ru:"наёмные руки",voice:"За работу, не за простой."},
  mgr:{ru:"управляющие",voice:"Оклад — ваш. Доля — наша."},
  late:{ru:"с прошлой смены",voice:"Один процент за смену. Не задерживайте."}
};
function billSt(){
  if(!G.bill||typeof G.bill!=="object")G.bill={};
  const B=G.bill;
  if(!B.cur||typeof B.cur!=="object")B.cur={};
  if(!B.due||typeof B.due!=="object")B.due={};
  /* смена — по часам игры (now): налёт G.flownMs идёт только в полёте, а смена — и на грунте */
  if(!(B.from>=0))B.from=now();
  B.n=B.n|0;
  return B;
}
function billOn(){return !firstHour();}
function billPaid(k,sum){if(sum>0&&billOn()){const B=billSt();B.cur[k]=(B.cur[k]||0)+sum;}}
function billDue(k,sum){if(sum>0&&billOn()){const B=billSt();B.due[k]=(B.due[k]||0)+sum;}}
/* сколько осталось по последней бумаге */
function billLeft(){const P=billSt().paper;return P?Math.max(0,Math.round(P.total-P.paid)):0;}
/* прошлая смена не оплачена — бумагу закрыли поверх неоплаченной */
function billLate(){return !!billSt().late&&billLeft()>0;}
/* закрыть смену: строки из накопленного, долг прошлой — отдельной строкой с процентом */
function billClose(){
  const B=billSt(),L=[];
  for(const k of ["fuel","yard","crew"]){const v=Math.round(B.cur[k]||0);if(v>0)L.push({k,sum:v,paid:true});}
  for(const k of ["mgr"]){const v=Math.round(B.due[k]||0);if(v>0)L.push({k,sum:v,paid:false});}
  const prev=billLeft();
  if(prev>0)L.push({k:"late",sum:Math.ceil(prev*(1+BILL_RATE)),paid:false});
  const first=!B.n&&(G.flownMs||0)<2*FIRST_HOUR_MS;   /* стажёр — только у новичка, не у старой записи */
  B.cur={};B.due={};B.from=now();
  if(!L.length&&!first){B.paper=null;B.late=false;return null;}
  B.n++;
  const total=L.filter(x=>!x.paid).reduce((a,x)=>a+x.sum,0);
  B.late=prev>0;
  B.paper={n:B.n,lines:L,total,paid:0,first,at:G.flownMs||0,st:G.sys?G.sys.key:""};
  if(total>0)logAdd("warn","Счёт за смену № "+B.n+" · к оплате "+total.toLocaleString("ru")+" кр"+(B.late?" · прошлая не оплачена":""));
  return B.paper;
}
/* одно касание: платится сколько есть, остаток остаётся на бумаге */
function billPay(){
  const B=billSt(),P=B.paper;if(!P)return 0;
  const x=Math.min(billLeft(),Math.max(0,Math.floor(G.credits)));
  if(x<=0){if(billLeft()>0)say("Не хватает кредитов");return 0;}
  G.credits-=x;P.paid+=x;
  if(billLeft()<=0){B.late=false;say("Счёт за смену оплачен\n−"+x.toLocaleString("ru")+" кр");}
  else say("Оплачено на что хватило\n−"+x.toLocaleString("ru")+" кр · осталось "+billLeft().toLocaleString("ru"));
  return x;
}
/* ── где счёт берёт строки ── */
const BILL_OLD_OPEN=openStation;
openStation=function(){
  const r=BILL_OLD_OPEN.apply(this,arguments);
  if(billOn()&&(now()-billSt().from>=BILL_SHIFT_MS||now()<billSt().from))billClose();
  return r;
};
const BILL_OLD_REPAIR=repairDo;
repairDo=function(){const c0=G.credits,r=BILL_OLD_REPAIR.apply(this,arguments);billPaid("yard",c0-G.credits);return r;};
const BILL_OLD_CREW=crewPayroll;
crewPayroll=function(){const c0=G.credits,r=BILL_OLD_CREW.apply(this,arguments);billPaid("crew",c0-G.credits);return r;};
/* бак: обработчик кнопки безымянный — до него касса запоминается на погружении, после — на всплытии */
{
  const b=document.getElementById("bRefuel");let c0=null;
  if(b){
    b.addEventListener("click",()=>{c0=G.credits;},true);
    b.addEventListener("click",()=>{if(c0!=null)billPaid("fuel",c0-G.credits);c0=null;});
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
  const B=billSt(),P=B.paper;if(!P)return;
  const left=billLeft();
  if(!left&&P.st!==(G.sys&&G.sys.key))return;   /* оплаченная бумага видна только там, где её дали */
  secHead("СЧЁТ ЗА СМЕНУ № "+P.n,{count:left?left.toLocaleString("ru")+" кр":"оплачено"});
  if(P.first)$body.appendChild(el("div","row","<div class='nm'><b>стажёр</b><s>«Первая смена за счёт управления. Дальше — сами.»</s></div>"));
  for(const x of P.lines){
    const D=BILL_LINES[x.k]||{ru:x.k,voice:""};
    $body.appendChild(el("div","row","<div class='nm'><b>"+D.ru+" · "+x.sum.toLocaleString("ru")+" кр</b><s>"+
      (x.paid?"оплачено на месте · ":"")+"«"+D.voice+"»</s></div>"));
  }
  if(left>0){
    const r=el("div","row");
    r.appendChild(el("div","nm","<b>к оплате "+left.toLocaleString("ru")+" кр</b><s>"+
      (B.late?"прошлая смена не оплачена — управляющие без оклада":"не оплатите — перейдёт в следующую смену с процентом")+"</s></div>"));
    const b=el("button","act gold","ОПЛАТИТЬ");
    b.onclick=()=>{sfx("ui");billPay();renderTab();};
    r.appendChild(b);$body.appendChild(r);
  }
}
const BILL_OLD_BOARD=stTabBoard;
stTabBoard=function(){billSection();return BILL_OLD_BOARD.apply(this,arguments);};
/* запись: поле G.bill — в снимок и обратно (белый список 14-save не трогаем — обёртка) */
const BILL_OLD_SNAP=snapshot;
snapshot=function(){const s=BILL_OLD_SNAP.apply(this,arguments);s.bill=G.bill||null;return s;};
const BILL_OLD_APPLY=applySave;
applySave=function(s){
  const r=BILL_OLD_APPLY.apply(this,arguments);
  const b=s&&s.bill;
  G.bill=(b&&typeof b==="object")?{cur:(b.cur&&typeof b.cur==="object")?b.cur:{},due:(b.due&&typeof b.due==="object")?b.due:{},
    from:+b.from||0,n:b.n|0,late:!!b.late,paper:(b.paper&&Array.isArray(b.paper.lines))?b.paper:null}:null;
  return r;
};
