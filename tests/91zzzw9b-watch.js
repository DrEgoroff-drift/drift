/* Участок и норма (M905, §3.2/§10.2): норма считается по нуждам станций участка в сыгранных окнах;
   закрытая продажей нужда поднимает норму; три срыва — станция уходит соседу и её люди замолкают;
   три сводки ≥ 90 % — станция назад, потом корпус по разнарядке; всё переживает запись. */
TEST_SUITES.push(()=>suite("участок: норма от закрытых нужд, срыв, разнарядка, запись",()=>{
  resetWorld();
  G.sx=0;G.sy=0;G.sys=getSystem(0,0);
  const W=watchSt();W.c={sx:0,sy:0};
  const L=watchStations();
  ok(L.length>=2,"на участке "+watchName()+" станций: "+L.length);
  let same=0;for(const S of L){const N=needOf(S);if((N?N.k:null)===watchNeedAt(S,needWin()))same++;}
  ok(same===L.length,"нужда участка считается как на доске (needOf): "+same+" из "+L.length);
  /* сводка без игрока: только чужие баржи */
  const w0=needWin();
  W.n=chronNow();W.w0=w0;W.w1=w0+7;W.fill={};W.ord=0;
  const r0=watchJudge(W);
  ok(!!r0&&r0.mine===0&&r0.tot>0&&r0.norm<100,"восемь окон без игрока: норма "+(r0&&r0.norm)+" % из "+(r0&&r0.tot)+" нужд");
  /* та же сводка, бот продаёт нужное в каждом окне — норма растёт до полной */
  W.fill={};W.hist=[];W.run={hi:0,lo:0};
  let closed=0;
  for(let w=w0;w<=w0+7;w++){
    G.t=w*NEED_WIN*CEL_DAY+5;
    for(const S of L){
      const N=needOf(S);if(!N)continue;
      G.sys=S;G.sx=S.sx;G.sy=S.sy;G.cargo[N.k]=(G.cargo[N.k]|0)+1;
      sellCargo(S,N.k,1);closed++;
    }
  }
  const r1=watchJudge(W);
  ok(r1.mine===closed&&r1.norm===100&&r1.norm>r0.norm,"бот закрыл "+closed+" нужд продажей — норма "+r0.norm+" → "+r1.norm+" %");
  /* три срыва: блокада по всему участку — баржи не ходят, игрок не возит */
  for(const S of L)occSet(S.sx,S.sy,2);
  W.run={hi:0,lo:0};W.off={};
  const far=L.slice().sort((a,b)=>Math.max(Math.abs(b.sx),Math.abs(b.sy))-Math.max(Math.abs(a.sx),Math.abs(a.sy)))[0];
  let rec=null;
  for(let i=0;i<3;i++){W.fill={};W.ord=0;W.w0=w0;W.w1=w0+7;W.n=i;rec=watchJudge(W);}
  ok(rec.norm<WATCH_LO&&!!rec.lost&&watchStations().length===L.length-1,"три срыва подряд: «"+rec.lost+"» передана соседу, станций "+watchStations().length);
  ok(folkOf("st:"+Object.keys(W.off)[0]).shut===1,"люди переданной станции больше не называют");
  ok(recordAll().e.some(x=>/не тянет/.test(x.s)),"срыв записан в трудовую книжку");
  /* три сводки ≥ 90 %: станция назад; ещё три — корпус ступенью выше, б/у */
  G.occ={};
  const fillAll=()=>{W.fill={};for(const S of watchStations())for(let w=W.w0;w<=W.w1;w++)if(watchNeedAt(S,w))(W.fill[S.key]=W.fill[S.key]||[]).push(w);};
  for(let i=0;i<3;i++){W.w0=w0;W.w1=w0+7;W.ord=0;fillAll();rec=watchJudge(W);}
  ok(!!rec.allot&&!Object.keys(W.off).length&&watchStations().length===L.length,"три сводки ≥ 90 %: "+rec.allot+" — снова ваша");
  for(let i=0;i<3;i++){W.w0=w0;W.w1=w0+7;W.ord=0;fillAll();rec=watchJudge(W);}
  ok(G.owned.igla&&Math.abs(wearOf("igla")-.55)<.01,"ещё три: разнарядка "+rec.allot+", износ "+wearOf("igla").toFixed(2));
  /* меньше двух окон — сводка не судится */
  W.w0=w0;W.w1=w0;const h0=W.hist.length;
  ok(watchJudge(W)===null&&W.hist.length===h0,"четверть часа игры — сводка не судится");
  /* запись */
  W.off={"9,9":4};
  const s=JSON.parse(JSON.stringify(snapshot()));G.uch=null;applySave(s);
  ok(watchSt().c.sx===0&&watchSt().off["9,9"]===4&&watchSt().hist.length===h0&&watchSt().last.norm===rec.norm,"участок, передачи и сводки пережили запись");
  resetWorld();
}));
/* Сдача смены (M905, §3.4/§10.5): пока смена сдана, не идёт ничего — ни оклад, ни бумага, ни норма,
   и страхует только «Стриж»; приняв смену, игрок не получает счёт за время отсутствия. */
TEST_SUITES.push(()=>suite("сдача смены: все часы стоят, возврат без долга за отсутствие",()=>{
  resetWorld();
  G.flownMs=FIRST_HOUR_MS+60000;G.bill=null;
  const m={name:"Проба",role:"keep",traits:[],perks:[],rules:[],loy:60,xp:0,tMs:0,seed:7,pool:0,spent:0};
  G.mgrs.push(m);mgrTick();clockAdvance(60000);mgrTick();
  const per=mgrPay(m),due0=billSt().due.mgr||0;
  ok(Math.abs(due0-per)<1e-6&&billSt().from!=null,"до сдачи: оклад за минуту в счёте ("+Math.round(due0)+" кр)");
  G.owned.obod=true;insSet("obod",true);
  /* дрон и наёмная рука в работе — их часы тоже должны встать */
  G.drones.push({sx:G.sx,sy:G.sy,res:"iron"});tickDrones();clockAdvance(5*60000);tickDrones();
  const dr=G.drones[0];let trips0=dr.trips|0;
  ok(trips0>0,"дрон до сдачи ходит: рейсов "+trips0);
  coopStamp("Сквозной");const mc=stationMercs(G.sys)[0];hireMerc(mc);
  const hand=G.crew[G.crew.length-1];G.owned.vyuk=true;crewAssignShip(hand,"vyuk");crewOrder(hand,"mine",G.sx,G.sy);
  G.credits=1e6;crewTick();clockAdvance(30*60000);crewTick();
  const sp0=hand.spent||0,tm0=hand.tripMin||0;
  ok(sp0>0,"рука до сдачи на жалованье: "+Math.round(sp0)+" кр");
  tickDrones();trips0=dr.trips|0;
  const W=watchSt();W.c={sx:G.sx,sy:G.sy};
  ok(watchHand()&&watchHanded(),"смена сдана, держит "+W.hand.who);
  ok(!insOn("obod")&&insOn("strizh"),"пока сдана — страхует только «Стриж»");
  const cr0=G.credits,n0=W.n,loy0=m.loy;
  clockAdvance(5*3600000);G.t+=5*60*3600;
  tickDrones();crewTick();mgrTick();
  const B=billSt();
  ok(Math.abs((B.due.mgr||0)-due0)<1e-6&&G.credits===cr0&&m.loy===loy0,"пять часов сданной смены: оклад не копится, списаний нет, верность та же");
  ok(watchTick()===null&&W.n===n0,"норма не пишется");
  ok((dr.trips|0)===trips0&&(hand.spent||0)===sp0&&(hand.tripMin||0)===tm0,"дрон стоит ("+(dr.trips|0)+" рейсов), рука без жалованья ("+Math.round(hand.spent||0)+" кр)");
  ok(now()-billSt().from<BILL_SHIFT_MS,"смена счёта стоит на «сейчас» — бумага не закроется");
  const line=watchBack();
  ok(!!line&&!watchHanded()&&insOn("obod"),"смена принята: «"+line+"», страховка снова в силе");
  clockAdvance(60000);mgrTick();
  const due=billSt().due.mgr||0;
  ok(Math.abs(due-due0-per)<1e-6,"после возврата — плюс оклад за минуту ("+Math.round(due-due0)+" кр), не за пять часов");
  tickDrones();
  ok((dr.trips|0)-trips0<=2,"дрон после возврата не догоняет пять часов: +"+((dr.trips|0)-trips0)+" рейсов");
  ok(recordAll().e.length>=2,"сдача и приём — строками в трудовой книжке");
  /* пункт меню (§10.5): сдать — откуда угодно, принять — только у стойки */
  G.mode="system";watchMenuTap();
  ok(watchHanded(),"меню: смена сдана из полёта");
  watchMenuTap();
  ok(watchHanded(),"меню: из полёта не принять — только у стойки");
  const s=JSON.parse(JSON.stringify(snapshot()));G.uch=null;applySave(s);
  ok(watchHanded()&&watchSt().hand.who===G.uch.hand.who,"сданная смена пережила запись");
  G.mode="dock";watchMenuTap();
  ok(!watchHanded(),"меню у стойки: смена принята");
  resetWorld();
}));
