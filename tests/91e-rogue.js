/* ══════════════ автотесты: ушедший управляющий: ультиматум, ренегат, изгнанник ══════════════ */
TEST_SUITES.push(()=>suite("ультиматум: условие, а не жалоба",()=>{
  resetWorld();
  G.credits=300000;
  hireMgr(genMgr(77,["cmd"]));
  const m=mgrOf("cmd");
  /* ниже пятидесяти он начинает «терять» проценты домена в свою пользу —
     любой, не только «свои интересы», и наружу это выведено только сверкой */
  m.loy=60;eq(mgrLeak(m),0,"выше пятидесяти утечки нет");
  m.loy=20;ok(mgrLeak(m)>0,"ниже пятидесяти домен начинает подтекать");
  m.stole=0;mgrTake(m,10000);
  ok(m.stole>0,"утечка попадает в строку «потерялось», а не растворяется");
  /* ниже двадцати пяти он приходит с условием */
  m.loy=10;mgrUltimatum(m);
  ok(m.job&&m.job.id==="ultimatum","пришёл с ультиматумом");
  ok(m.job.choice,"это сцена с выбором, а не «взяться/отказать»");
  const cut0=mgrCut(m);
  ok(jobPick(m,0),"согласились поднять долю");
  near(mgrCut(m)-cut0,.03,.001,"доля выросла ровно на три пункта");
  ok(m.loy>50,"и он успокоился");
  ok(!m.job,"разговор закрыт");
  /* второй ультиматум и отказ: он уходит немедленно */
  m.loy=8;mgrUltimatum(m);
  ok(jobPick(m,2),"отказали");
  eq(G.mgrs.length,0,"место домена освободилось сразу, а не через тик");
  eq(G.rogues.length,1,"и он не исчез, а стал ренегатом");
}));

TEST_SUITES.push(()=>suite("ренегат: уходит с флагманом и людьми, встречается в бою",()=>{
  resetWorld();
  G.credits=300000;G.owned.vyuk=true;
  hireMgr(genMgr(91,["cmd"]));
  const m=mgrOf("cmd");
  m.shipId="vyuk";m.xp=MGR_XP[3];m.perks=["drill1","rota"];
  for(let i=0;i<3;i++){
    const c=genMerc(hashi(i,5,7),null);
    G.crew.push(Object.assign({},c,{shipId:"igla",cargo:{},
      order:{kind:"hunt",sx:G.sx,sy:G.sy},tMs:Date.now(),paidMs:Date.now(),fee:0}));
  }
  m.loy=0;mgrDefect(m);
  eq(G.rogues.length,1,"ренегат записан");
  const R=G.rogues[0];
  eq(R.shipId,"vyuk","флагман ушёл вместе с ним");
  ok(!G.owned.vyuk,"и из ангара пропал");
  ok(R.crew.length>0,"командир увёл своих");
  ok(G.crew.length<3,"их действительно нет в экипаже");
  ok(R.hullMax>shipData("vyuk").hull,"перки и уровень сделали его крепче обычного корпуса");
  ok((R.sx!==G.sx||R.sy!==G.sy),"сел не там, где вы стоите");
  ok(!!starAt(R.sx,R.sy),"и в секторе, куда можно прилететь");
  /* в его секторе он — обычная запись в G.pirates: весь бой уже написан */
  G.sx=R.sx;G.sy=R.sy;G.sys=getSystem(R.sx,R.sy);
  spawnPirates();
  const p=G.pirates.find(x=>x.rogue);
  ok(!!p,"в его секторе он выходит навстречу");
  eq(p.shipId,"vyuk","на вашем же корпусе");
  ok(p.dmg>3.5,"и бьёт больнее рядового пирата");
  ok(G.pirates.some(x=>x.rogueEsc),"уведённые летят с ним");
  /* разбит: корпус возвращается, сам он остаётся в мире */
  const cr0=G.credits;
  p.hull=-1;killPirate(p);
  eq(G.rogues.length,0,"ренегата больше нет");
  ok(G.owned.vyuk,"корпус отбит");
  ok(G.credits>cr0,"и трюм его тоже");
  eq(G.exiles.length,1,"он выжил и стал изгнанником");
}));

TEST_SUITES.push(()=>suite("изгнанник: возвращается дешевле и со своими перками",()=>{
  resetWorld();
  G.exiles=[{name:"Ковач",role:"cmd",seed:12345,lv:4,perks:["drill1","rota"],
    traits:[MGR_TRAITS[0].id],fee:900,t:Date.now()}];
  let st=null;
  for(let sx=-4;sx<=4&&!st;sx++)for(let sy=-4;sy<=4&&!st;sy++){
    if(!starAt(sx,sy))continue;
    const s=getSystem(sx,sy);
    if(s.station)st=s;
  }
  ok(!!st,"нашлась станция с кантиной");
  G.sys=st;G.sx=st.sx;G.sy=st.sy;
  const list=stationMgrs(st);
  const ex=list.find(c=>c.exile);
  ok(!!ex,"изгнанник стоит в кантине первым");
  ok(list.filter(c=>!c.exile).every(c=>c.fee>ex.fee),"и стоит дешевле всех прочих");
  ok(ex.loy<40,"приходит с низкой лояльностью — он помнит, чем кончилось");
  G.credits=300000;
  ok(hireMgr(ex),"взят обратно");
  const back=mgrOf("cmd");
  eq(back.perks.length,2,"перки при нём — за них вы уже платили");
  eq(G.exiles.length,0,"из списка изгнанников он ушёл");
  /* обычный кандидат по-прежнему приходит чистым листом */
  resetWorld();
  G.credits=300000;
  hireMgr(genMgr(55,["fact"]));
  eq(mgrOf("fact").perks.length,0,"нанятый в кантине начинает без перков");
}));

TEST_SUITES.push(()=>suite("ушедшие переживают сохранение",()=>{
  resetWorld();
  G.credits=300000;G.owned.klinok=true;
  hireMgr(genMgr(313,["keep"]));
  const m=mgrOf("keep");m.shipId="klinok";
  mgrDefect(m);
  G.exiles=[{name:"Тест",role:"sci",seed:9,lv:2,perks:[],traits:[],fee:500,t:1}];
  const json=JSON.stringify(snapshot());
  resetWorld();
  eq(G.rogues.length,0,"сброс мира их убирает");
  applySave(JSON.parse(json));
  eq(G.rogues.length,1,"ренегат вернулся из записи");
  eq(G.rogues[0].shipId,"klinok","вместе с корпусом, который увёл");
  eq(G.exiles.length,1,"и изгнанник тоже");
  /* битую запись игра не тащит в бой */
  applySave(JSON.parse(json.replace(/"role":"keep"/,'"role":"нетакой"')));
  ok(G.rogues.every(R=>MGR_ROLES[R.role]),"роль без таблицы отброшена");
}));
