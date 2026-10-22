/* Диспетчер (M907, DESIGN-game §4.3): на каждой стыковке полоса К ВАМ держит два адресных (привоз и дело
   без груза), одно «сейчас или никогда» короче десяти минут и длинный наряд на три станции; у каждого —
   лицо и часы; оценка минут больше часа; глагол не повторяется в окне пяти выдач; веса — по шкалам. */
function dispTestStations(){
  const out=[];
  for(let x=-4;x<=4;x++)for(let y=-4;y<=4;y++){if(!starAt(x,y))continue;const S=getSystem(x,y);if(S&&S.station&&S.station.prices)out.push(S);}
  return out;
}
function dispTestDock(S){
  arriveSystem(S.sx,S.sy);
  G.st=G.sys.station;G.mode="dock";openStation();
}
TEST_SUITES.push(()=>suite("диспетчер: на каждой стыковке два адресных, срочное и наряд; глаголы не повторяются",()=>{
  resetWorld();G.flownMs=2*FIRST_HOUR_MS;   /* первая вахта (28o) держит срочное и наряд — здесь игрок налётан */
  const L=dispTestStations();
  ok(L.length>=6,"станций вокруг начала: "+L.length);
  const issued=[],O=dispIssue;
  dispIssue=function(){const it=O.apply(this,arguments);if(it)issued.push(it.v);return it;};
  let docks=0,bad=[],estMin=1e9,urgMax=0,faces=0,seen=0,given=0;
  try{
    for(let i=0;i<60;i++){
      /* бот играет: через раз — к срочному (прыжок сам закрывает капсулу и «пирата у дверей»), груз — в трюме */
      const U=i%2?dispUrg():null,uk=U&&dispLeg(U)&&dispSysOf(dispLeg(U).key);
      const S=uk&&uk.station?uk:L[(i*7)%L.length];
      dispTestDock(S);docks++;
      for(const it of dispSt().it.slice()){const g=dispLeg(it);if(g&&g.do==="cargo"&&g.key===S.key){G.cargo[g.k]=(G.cargo[g.k]|0)+g.qty;if(dispGive(it.id))given++;}}
      const A=dispLane();
      const addr=A.filter(x=>x.addr),haul=A.filter(x=>x.haul),urg=A.filter(x=>x.urg),lng=A.filter(x=>x.long);
      if(addr.length<2||!haul.length||addr.length-haul.length<1||urg.length<1||lng.length<1)bad.push(i+":"+A.map(x=>x.v).join(","));
      for(const x of A)if(x.face&&x.who&&x.mins>0)faces++;seen+=A.length;
      for(const it of dispSt().it)if(it.kind==="urg")urgMax=Math.max(urgMax,it.due-it.t0);
      estMin=Math.min(estMin,A.reduce((s,x)=>s+x.est,0));
      if(G.mode==="dock")closeStation();G.mode="system";
      clockAdvance((2+(i*5)%8)*60000);
    }
  }finally{dispIssue=O;}
  ok(!bad.length,"на "+docks+" стыковках К ВАМ полна (сбои: "+bad.slice(0,3).join(" | ")+")");
  ok(urgMax>0&&urgMax<600000,"срочное — меньше десяти минут: самое долгое "+(urgMax/60000).toFixed(1)+" мин");
  ok(estMin>=60,"вместимость больше часа: меньшая сумма оценок "+estMin+" мин");
  ok(seen>=docks*4&&faces===seen,"у каждого пункта лицо и часы: "+faces+" из "+seen);
  let rep=0;
  for(let i=0;i<issued.length;i++)for(let j=i+1;j<Math.min(issued.length,i+DISP_WIN);j++)if(issued[i]===issued[j])rep++;
  ok(issued.length>=60&&rep===0,"выдач "+issued.length+" (бот сдал "+given+" привозов, закрыл всего "+dispSt().done+"), глаголов "+new Set(issued).size+", повторов в окне пяти: "+rep+(rep?" · "+issued.join(" "):""));
  resetWorld();
}));
TEST_SUITES.push(()=>suite("диспетчер: веса по шкалам станции",()=>{
  resetWorld();G.flownMs=2*FIRST_HOUR_MS;   /* первая вахта (28o) держит срочное и наряд — здесь игрок налётан */
  const S=dispTestStations()[0],D=dispSt();
  const share=(kind,v,set)=>{
    gaugeSet(S,set);let n=0,hit=0;
    for(let i=0;i<120;i++){D.it=[];D.vb=[];const it=dispIssue(kind,S,{});if(!it)continue;n++;if(v.indexOf(it.v)>=0)hit++;}
    return n?hit/n:0;
  };
  const oLo=share("task",["konvoy","otbit"],{s:.6,m:.6,o:.1}),oHi=share("task",["konvoy","otbit"],{s:.6,m:.6,o:.95});
  ok(oLo>oHi*1.6,"низкий порядок пишет «Отбить» и проводку: "+Math.round(oLo*100)+" % против "+Math.round(oHi*100)+" %");
  const mLo=share("task",["chel","vrach","razgovor"],{s:.6,m:.1,o:.6}),mHi=share("task",["chel","vrach","razgovor"],{s:.6,m:.95,o:.6});
  ok(mLo>mHi*1.4,"хмурые люди пишут людей: "+Math.round(mLo*100)+" % против "+Math.round(mHi*100)+" %");
  const sLo=share("haul",["privezti","zapas"],{s:.1,m:.6,o:.6}),sHi=share("haul",["privezti","zapas"],{s:.95,m:.6,o:.6});
  ok(sLo>sHi*1.6,"пустой склад пишет привозы сюда: "+Math.round(sLo*100)+" % против "+Math.round(sHi*100)+" %");
  resetWorld();
}));
TEST_SUITES.push(()=>suite("диспетчер: шаги исполняются, деньги через earn, срок, сданная смена, запись",()=>{
  resetWorld();G.flownMs=2*FIRST_HOUR_MS;   /* первая вахта (28o) держит срочное и наряд — здесь игрок налётан */
  const L=dispTestStations(),S=L[0],D=dispSt();
  dispTestDock(S);
  ok(D.it.length===4,"первая стыковка: пунктов "+D.it.length);
  /* привоз: груз в трюм — кнопка сдаёт, деньги — ровно цена пункта */
  const H=D.it.find(x=>x.kind==="haul"),hl=H.legs[0];
  const T=dispSysOf(hl.key);
  if(G.mode==="dock")closeStation();
  dispTestDock(T);
  G.cargo[hl.k]=(G.cargo[hl.k]|0)+hl.qty;
  const c0=G.credits,pay=H.pay,done0=D.done;
  ok(dispGive(H.id)&&D.done===done0+1,"привоз сдан кнопкой");
  ok(G.credits-c0>=pay*.9&&G.credits-c0<=pay,"заплачено "+(G.credits-c0)+" из "+pay+" кр (взносы обществ — из суммы)");
  ok(!dispGive(H.id),"второй раз не сдаётся");
  /* прибытие: пункт с шагом arrive закрывается самим прыжком */
  D.it=[];
  const A=dispIssue("urg",S,{});
  const ak=A.legs[0];
  if(A.legs.length===1&&ak.do==="arrive"){const n=D.done;if(G.mode==="dock")closeStation();arriveSystem(+ak.key.split(",")[0],+ak.key.split(",")[1]);ok(D.done===n+1,"«"+A.v+"»: прыжок в систему закрыл пункт");}
  else{const n=D.done;if(G.mode==="dock")closeStation();const X=dispSysOf(ak.key);dispTestDock(X);
    if(ak.do==="cargo"){G.cargo[ak.k]=(G.cargo[ak.k]|0)+ak.qty;dispGive(A.id);}
    ok(D.done===n+1,"«"+A.v+"»: исполнен на "+X.name);}
  /* посадка и пират и кантина: обёртки ловят шаг */
  D.it=[];
  const P=dispIssue("task",S,{});
  P.legs=[{key:G.sys.key,do:"land"},{key:G.sys.key,do:"kill"},{key:G.sys.key,do:"cant"},{key:S.key,do:"dock"}];P.leg=0;
  const n1=D.done;
  dispOn("land",G.sys.key);ok(P.leg===1,"посадка в системе — шаг пройден");
  dispOn("kill",G.sys.key);ok(P.leg===2,"сбитый пират в системе — шаг пройден");
  dispOn("cant",G.sys.key);ok(P.leg===3,"кантина станции — шаг пройден");
  if(G.mode==="dock")closeStation();
  dispTestDock(S);ok(D.done===n1+1,"доложили на выдавшей станции — пункт закрыт");
  /* срок вышел: бумага уходит, станция помнит */
  if(G.mode==="dock")closeStation();G.mode="system";
  D.it=[];gaugeSet(S,{s:.6,m:.6,o:.6});
  const Hh=dispIssue("haul",S,{});Hh.v="privezti";
  const lost0=D.lost,g0=gaugeOf(S).s;
  clockAdvance(Hh.due-now()+1000);dispTick();
  ok(D.lost===lost0+1&&!D.it.length&&gaugeOf(S).s<g0-.05,"просроченный привоз ушёл, склад станции "+g0.toFixed(2)+" → "+gaugeOf(S).s.toFixed(2));
  /* сданная смена: часы пунктов стоят */
  D.it=[];const Q=dispIssue("long",S,{}),left=Q.due-now();
  dispTick();watchHand();clockAdvance(2*3600000);dispTick();watchBack();dispTick();
  ok(D.it.indexOf(Q)>=0&&Math.abs((Q.due-now())-left)<120000,"смена сдана два часа — наряд жив, осталось "+Math.round((Q.due-now())/60000)+" мин из "+Math.round(left/60000));
  /* сданная смена переживает запись: простой до и после загрузки часов пункта не ест (Контроль 22.10) */
  {
    const left2=Q.due-now();
    dispTick();watchHand();dispTick();
    const sv=JSON.parse(JSON.stringify(snapshot()));
    clockAdvance(3600000);G.disp=null;applySave(sv);
    ok(watchHanded(),"смена сдана и после загрузки");
    dispTick();clockAdvance(1800000);dispTick();watchBack();dispTick();
    const q=dispSt().it.find(x=>x.id===Q.id);
    ok(q&&Math.abs((q.due-now())-left2)<120000,"сдана → запись → полтора часа → загрузка: осталось "+(q?Math.round((q.due-now())/60000):"—")+" мин из "+Math.round(left2/60000));
    const sv2=JSON.parse(JSON.stringify(snapshot()));delete sv2.disp.lt;G.disp=null;applySave(sv2);
    ok(isFinite(dispSt().lt),"запись без отметки такта — часы с загрузки, не NaN");
    G.disp=Object.assign(D,dispSt());   /* D — снова живой объект для проверок ниже */
  }
  /* табличка срочного гаснет, когда срочного больше нет */
  {
    const keep=D.it.slice();D.it=[];
    const Uu=dispIssue("urg",S,{});
    HANG.t.push({id:"disp.urg",lines:["x"],kind:"ship",n:420,n0:420,mode:"system",o:{urg:true,disp:Uu.id}});
    dispDone(Uu);
    ok(!HANG.t.some(x=>x.id==="disp.urg"),"срочное закрыто — табличка снята");
    const Uv=dispIssue("urg",S,{});
    HANG.t.push({id:"disp.urg",lines:["x"],kind:"ship",n:420,n0:420,mode:"system",o:{urg:true,disp:Uv.id}});
    clockAdvance(Uv.due-now()+1000);dispTick();
    ok(!HANG.t.some(x=>x.id==="disp.urg"),"срочное просрочено — табличка снята");
    D.it=keep;
  }
  /* запись */
  const s=JSON.parse(JSON.stringify(snapshot()));G.disp=null;applySave(s);
  ok(dispSt().it.length===1&&dispSt().it[0].legs.length===3&&dispSt().done===D.done&&dispSt().vb.length>0,"пункты, счёт и окно глаголов пережили запись");
  const s2=JSON.parse(JSON.stringify(s));s2.disp={it:[{v:"нет",legs:[]},{v:"tri",legs:[{key:"0,0",do:"взорвать"}],f:{}}],vb:["x"]};
  G.disp=null;applySave(s2);
  ok(dispSt().it.length===0&&dispSt().vb.length===0,"битая запись диспетчера отброшена, мир цел");
  resetWorld();
}));
TEST_SUITES.push(()=>suite("диспетчер: СРОЧНО в системе не жмёт таблички черпака, захода и грунта",()=>{
  resetWorld();G.flownMs=2*FIRST_HOUR_MS;
  const S=dispTestStations()[0];dispTestDock(S);
  dispSt().it=[];const U=dispIssue("urg",S,{});
  ok(U&&dispUrg()===U,"срочное есть");
  for(const m of ["scoop","landing","surface"]){G.mode=m;eq(dispAlarm(true),false,m+": табличку диспетчера не вешают");}
  G.mode="system";HANG.alarmF=OVL.fno;HANG.alarmM="system";
  ok(hangAlarmOn(),"в системе тревога держит спокойные у края");
  for(const m of ["scoop","landing","surface"]){G.mode=m;eq(hangAlarmOn(),false,m+": выдержка тревоги из системы не действует (360: «Заход в атмосферу» ехал на «НАГРЕВ КОРПУСА»)");}
  G.mode="scoop";HANG.alarmM="scoop";
  ok(hangAlarmOn(),"тревога самого черпака — держит");
  HANG.alarmF=-1e9;HANG.alarmM=null;
  resetWorld();
}));
