/* Счёт за смену (M904a, 0.494.0): деньги не берутся из воздуха и не теряются. Первый час — без
   бумаги; оклад управляющего идёт в счёт игрока, а не из его доли (F2); оплата одним касанием;
   неоплаченное переходит с процентом, и пока висит — верность тает; офлайн не больше часа; запись. */
TEST_SUITES.push(()=>suite("счёт за смену: оклад игрока, оплата, перенос, запись",()=>{
  resetWorld();
  const m={name:"Проба",role:"keep",traits:[],perks:[],rules:[],loy:60,xp:0,tMs:0,seed:7,pool:500,spent:0};
  G.mgrs.push(m);
  /* первый час: бумаги нет, оклад по-старому — из доли */
  G.flownMs=10*60000;G.bill=null;
  mgrPayroll(m,10);
  ok(!G.bill||!G.bill.due||!G.bill.due.mgr,"в первый час счёт не копится");
  ok(m.pool<500,"в первый час оклад — из доли, как прежде: доля "+Math.round(m.pool));
  /* после часа: оклад — в счёт, доля нетронута */
  G.flownMs=FIRST_HOUR_MS+60000;G.bill=null;m.pool=500;
  const per=mgrPay(m);
  mgrPayroll(m,10);
  ok(Math.abs(billSt().due.mgr-per*10)<1e-6,"оклад за 10 мин в счёте: "+Math.round(billSt().due.mgr)+" при "+per+" кр/мин");
  ok(m.pool===500,"доля управляющего — его деньги, оклад из неё не берётся");
  ok(billSt().from===now(),"смена считается по часам игры с первой строки");
  /* закрытие смены */
  clockAdvance(BILL_SHIFT_MS+1);
  const P=billClose();
  ok(!!P&&P.total===Math.round(per*10),"бумага: к оплате "+(P&&P.total)+" = оклад");
  ok(P.first,"первая бумага новичка несёт строку стажёра");
  /* оплата: денег нет — ничего не списано; есть — списано ровно к оплате */
  G.credits=0;
  ok(billPay()===0&&billLeft()===P.total,"без денег ничего не списано");
  G.credits=100000;
  const paid=billPay();
  ok(paid===P.total&&G.credits===100000-P.total&&billLeft()===0,"оплачено одним касанием: −"+paid);
  /* перенос: вторая бумага не оплачена — уходит в кассу взаимопомощи с процентом (M904b) */
  mgrPayroll(m,10);clockAdvance(BILL_SHIFT_MS);const P2=billClose();
  mgrPayroll(m,10);clockAdvance(BILL_SHIFT_MS);billClose();
  ok(billDebt()===Math.ceil(P2.total*(1+BILL_RATE)),"неоплаченное ушло в кассу с процентом: "+billDebt()+" из "+P2.total);
  ok(billLate(),"прошлая смена в кассе");
  const loy0=m.loy;mgrPayroll(m,10);
  ok(m.loy<loy0,"пока висит прошлая смена — верность тает: "+loy0.toFixed(1)+" → "+m.loy.toFixed(1));
  /* офлайн: догон за 240 минут пишет в счёт не больше часа */
  G.bill.due={};mgrPayroll(m,240);
  ok(Math.abs(G.bill.due.mgr-per*BILL_OFF_MIN)<1e-6,"офлайн в счёте — час: "+Math.round(G.bill.due.mgr));
  /* запись: бумага переживает снимок */
  const s=JSON.parse(JSON.stringify(snapshot()));
  const n0=G.bill.paper.n,left0=billLeft();
  G.bill=null;applySave(s);
  ok(G.bill&&G.bill.paper&&G.bill.paper.n===n0&&billLeft()===left0,"бумага пережила запись: № "+(G.bill&&G.bill.paper&&G.bill.paper.n)+", к оплате "+billLeft());
  resetWorld();
}));
/* Касса взаимопомощи (M904b, F1, §5.2): долг — отдельное число, кредиты не уходят ниже нуля.
   Касса даёт на ремонт до предела и забирает назад недотраченное; у предела садится взыскатель,
   ждёт смену и берёт по одному: дроны, потом корпус; выплата до нуля его отпускает. */
TEST_SUITES.push(()=>suite("касса взаимопомощи: заём, предел, взыскатель, запись",()=>{
  resetWorld();
  G.flownMs=FIRST_HOUR_MS+60000;G.bill=null;
  /* ремонт в долг: денег ноль — касса дала ровно цену, кредиты остались нулём */
  G.credits=0;const hm=stat().hullMax,h0=Math.round(hm*.3);G.hull=h0;
  const q=repairQuote(1);repairDo(1);
  ok(q.cost>0&&G.credits===0&&billDebt()===q.cost&&G.hull>h0,"ремонт в долг: долг "+billDebt()+" = цене "+q.cost+", кредиты "+G.credits);
  /* свои есть — касса не нужна */
  G.bill=null;G.credits=1e6;G.hull=h0;repairDo(1);
  ok(billDebt()===0,"при своих деньгах касса молчит");
  /* предел: больше предела касса не даёт, недотраченное вернулось */
  G.bill=null;billSt().debt=billFloor()-10;G.credits=0;G.hull=h0;repairDo(1);
  ok(billDebt()<=billFloor()&&G.credits===0,"у предела касса даёт только до предела: "+billDebt()+" из "+billFloor());
  /* взыскатель: первая смена у предела — садится и ждёт */
  G.bill=null;G.drones=[];G.droneInventory=2;billSt().debt=billFloor();
  clockAdvance(BILL_SHIFT_MS);billClose();
  ok(!!G.bill.coll&&G.droneInventory===2,"у предела сел взыскатель и ждёт смену: "+(G.bill.coll&&G.bill.coll.nm));
  /* следующая смена у предела — забрал дрон из запаса в полцены */
  const d0=billDebt();clockAdvance(BILL_SHIFT_MS);billClose();
  ok(G.droneInventory===1&&billDebt()===Math.ceil(d0*(1+BILL_RATE))-Math.round(DRONES.miner.price*.5),
    "забрал дрон из запаса: долг "+d0+" → "+billDebt());
  /* дронов нет — корпус, с пересадкой на «Стриж» */
  G.droneInventory=0;G.owned.obod=true;G.shipId="obod";invalidateParts();
  billSt().debt=billFloor();clockAdvance(BILL_SHIFT_MS);billClose();
  ok(!G.owned.obod&&G.shipId==="strizh"&&G.owned.strizh,"дронов нет — забрал корпус, вы на «Стриже»");
  /* выплата до нуля: сперва касса пустеет, взыскатель встаёт */
  G.credits=1e6;const owe=billOwed();billPay();
  ok(billDebt()===0&&!G.bill.coll&&G.credits===1e6-owe,"выплатили "+owe+" — взыскатель ушёл");
  /* запись: долг и взыскатель переживают снимок */
  billSt().debt=1234;G.bill.coll={nm:"Проба",at:0,took:1};
  const s=JSON.parse(JSON.stringify(snapshot()));G.bill=null;applySave(s);
  ok(billDebt()===1234&&G.bill.coll&&G.bill.coll.nm==="Проба","долг и взыскатель пережили запись");
  resetWorld();
}));
/* Страхкасса и потеря корпуса (M904c, F3, §5.1): первый час корпус не отнимает; без страховки
   корпус уходит насовсем, а кредиты целы; взнос — строкой в бумаге; застрахованный возвращается
   через смену с износом 55 %; «Стриж» застрахован всегда и даром; всё переживает запись. */
TEST_SUITES.push(()=>suite("страхкасса и потеря корпуса: первый час, без страховки, взнос, возврат",()=>{
  resetWorld();
  G.flownMs=10*60000;G.owned.obod=true;G.shipId="obod";invalidateParts();G.hull=0;
  wreck("проба");
  ok(G.shipId==="obod"&&G.owned.obod,"в первый час авария корпус не отнимает");
  G.flownMs=FIRST_HOUR_MS+60000;G.credits=5000;G.hull=0;
  const rec0=recordAll().e.length;
  wreck("проба");
  ok(!G.owned.obod&&G.shipId==="strizh"&&G.credits===5000,"без страховки «Обод» ушёл, вы на «Стриже», кредиты целы");
  ok(recordAll().e.length>rec0,"потеря записана в трудовую книжку");
  ok(G.hull===stat().hullMax,"«Стриж» по разнарядке — целый: "+G.hull);
  G.owned.obod=true;G.shipId="obod";invalidateParts();G.bill=null;
  ok(insSet("obod",true)&&insOn("obod"),"застраховали «Обод»");
  billSt();clockAdvance(BILL_SHIFT_MS);const P=billClose();
  const ln=P&&P.lines.find(x=>x.k==="ins");
  ok(!!ln&&ln.sum===insFee("obod"),"взнос за смену в бумаге: "+(ln&&ln.sum)+" = "+insFee("obod"));
  G.hull=0;wreck("проба");
  ok(!G.owned.obod&&G.shipId==="strizh"&&insAll().back.length===1,"застрахованный ушёл в Страхкассу");
  ok(insReturnTick()===0&&!G.owned.obod,"до конца смены не вернули");
  clockAdvance(BILL_SHIFT_MS);
  ok(insReturnTick()===1&&G.owned.obod&&Math.abs(wearOf("obod")-INS_WEAR)<1e-6,"через смену вернули, износ "+wearOf("obod"));
  ok(insOn("strizh")&&insFee("strizh")===0,"«Стриж» — всегда и даром");
  insAll().back.push({id:"obod",at:now()+5});
  const s=JSON.parse(JSON.stringify(snapshot()));G.ins=null;applySave(s);
  ok(insOn("obod")&&insAll().back.length===1,"страховка и корпус в пути пережили запись");
  resetWorld();
}));
