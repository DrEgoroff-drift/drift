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
  /* перенос: вторая бумага не оплачена, третья несёт её с процентом */
  mgrPayroll(m,10);clockAdvance(BILL_SHIFT_MS);const P2=billClose();
  mgrPayroll(m,10);clockAdvance(BILL_SHIFT_MS);const P3=billClose();
  const late=P3.lines.find(x=>x.k==="late");
  ok(!!late&&late.sum===Math.ceil(P2.total*(1+BILL_RATE)),"неоплаченное перешло с процентом: "+(late&&late.sum)+" из "+P2.total);
  ok(billLate(),"прошлая смена висит");
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
