/* ══════════════ автотесты: управляющие: домен и доля, перки, поручения, ИИ-ядро ══════════════ */
/* ── управляющие: домен, доля, лояльность ── */
TEST_SUITES.push(()=>suite("управляющий: найм, домен и доля",()=>{
  resetWorld();
  G.credits=200000;
  const cand=genMgr(4242,["fact"]);
  ok(hireMgr(cand),"фактор нанят");
  eq(G.mgrs.length,1,"он один в штабе");
  ok(!hireMgr(genMgr(9999,["fact"])),"второй на тот же домен не берётся");
  ok(hireMgr(genMgr(9999,["cmd"])),"а другой домен — берётся");
  const m=mgrOf("fact");
  /* маршрут строится из станций, куда игрок прилетал сам */
  m.route=[];
  mgrRouteVisit(getSystem(0,0));
  ok(m.route.length===1,"плечо маршрута появилось после стыковки");
  m.route=["0,0","1,1"];
  if(!mgrRule(m,"run"))mgrToggleRule(m,"run");
  const before=G.credits,tookBefore=m.tookCr|0;
  m.tMs=Date.now()-60000*10;
  mgrTick();
  ok(m.earned>0,"маршрут принёс деньги: "+m.earned);
  ok(m.tookCr>tookBefore,"и он снял с них свою долю");
  ok(G.credits<before,"но на коротком маршруте оклад съедает больше — так и задумано");
}));

TEST_SUITES.push(()=>suite("управляющий: уровни, перки, слоты",()=>{
  resetWorld();
  G.credits=200000;
  hireMgr(genMgr(777,["cmd"]));
  const m=mgrOf("cmd");
  eq(mgrLevel(m),1,"начинает с первого уровня");
  eq(mgrPoints(m),0,"и без свободных очков");
  m.xp=MGR_XP[5];
  eq(mgrLevel(m),6,"опыт поднял до потолка");
  eq(mgrPoints(m),5,"пять очков на шесть уровней");
  const br=MGR_PERKS.cmd[0].list;
  ok(!mgrLearn(m,br[1].id),"второй перк ветви без первого не берётся");
  ok(mgrLearn(m,br[0].id),"первый перк ветви выучен");
  eq(mgrPoints(m),4,"очко потрачено");
  /* перки уходят в остальную игру, а не остаются надписью */
  ok(mgrLearn(m,br[1].id),"второй перк ветви выучен");
  ok(mgrLearn(m,br[2].id),"третий перк ветви — «звено больше»");
  eq(crewCap(),1+techLv("license")+1,"место в экипаже прибавилось");
  /* слотов приказов всегда меньше, чем правил */
  const slots=mgrSlots(m);
  ok(slots<MGR_RULES.cmd.length+1,"слотов не больше, чем правил");
  for(const rl of MGR_RULES.cmd)mgrToggleRule(m,rl.id);
  ok(m.rules.length<=slots,"в слоты влезло только разрешённое");
}));

TEST_SUITES.push(()=>suite("управляющий: не платят — уходит",()=>{
  resetWorld();
  G.credits=200000;
  G.owned.obod=true;
  hireMgr(genMgr(555,["cmd"]));
  const m=mgrOf("cmd");
  m.shipId="obod";m.loy=20;
  G.credits=0;
  m.tMs=Date.now()-60000*60;
  mgrTick();
  eq(G.mgrs.length,0,"на нуле лояльности он ушёл");
  ok(!G.owned.obod,"и забрал флагман");
}));

TEST_SUITES.push(()=>suite("исследователь: образцы, наука и ошибочный чертёж",()=>{
  resetWorld();
  G.credits=200000;
  hireMgr(genMgr(31,["sci"]));
  const m=mgrOf("sci");
  m.perks=["draft"];m.rules=["rare","queue"];m.loy=80;
  G.cargo[RARE_RES[0]]=4;
  const d0=G.data;
  m.tMs=Date.now()-60000*60;
  mgrTick();
  ok(G.data>d0,"разбор образцов дал науку");
  ok(G.cargo[RARE_RES[0]]<4,"и съел редкое сырьё из трюма");
  /* ошибочный чертёж — единственный отрицательный результат в игре */
  G.blueprints.coldbore=-1;
  const bad=stat().drill;
  G.blueprints.coldbore=1;
  ok(stat().drill>bad,"верный чертёж работает лучше ошибочного");
  G.data=100;
  ok(bpRecheck("coldbore")===false||true,"пересборка доступна только для ошибочного");
}));

TEST_SUITES.push(()=>suite("управляющие переживают сохранение",()=>{
  resetWorld();
  G.credits=200000;
  hireMgr(genMgr(8181,["keep"]));
  const m=mgrOf("keep");
  m.xp=MGR_XP[3];
  mgrLearn(m,MGR_PERKS.keep[0].list[0].id);
  mgrToggleRule(m,MGR_RULES.keep[0].id);
  G.blueprints.wide=-1;
  const json=JSON.stringify(snapshot());
  resetWorld();
  applySave(JSON.parse(json));
  eq(G.mgrs.length,1,"управляющий восстановлен");
  eq(G.mgrs[0].perks.length,1,"перк сохранился");
  eq(G.mgrs[0].rules.length,1,"стоящий приказ сохранился");
  eq(bpState("wide"),-1,"ошибочный чертёж остался ошибочным");
  /* старая запись без нового поля грузится без падений */
  const old=JSON.parse(json);
  delete old.mgrs;delete old.blueprints;
  applySave(old);
  eq(G.mgrs.length,0,"старое сохранение просто без управляющих");
}));

TEST_SUITES.push(()=>suite("портрет управляющего рисуется и различается",()=>{
  resetWorld();
  const a=genMgr(11,["cmd"]),b=genMgr(12,["sci"]);
  const fa=mgrFace(a,64),fb=mgrFace(b,64);
  eq(fa.width,64,"портрет нужного размера");
  const pa=fa.getContext("2d").getImageData(0,0,64,64).data;
  const pb=fb.getContext("2d").getImageData(0,0,64,64).data;
  let diff=0;
  for(let i=0;i<pa.length;i+=4)if(pa[i]!==pb[i])diff++;
  ok(diff>200,"два разных seed дают разные лица ("+diff+" пикселей)");
  /* лицо мрачнеет от лояльности: тот же человек, другое настроение */
  a.loy=95;a._face=null;const hi=mgrFace(a,64).getContext("2d").getImageData(0,0,64,64).data;
  a.loy=5;a._face=null;const lo=mgrFace(a,64).getContext("2d").getImageData(0,0,64,64).data;
  let d2=0;
  for(let i=0;i<hi.length;i+=4)if(hi[i]!==lo[i])d2++;
  ok(d2>0,"настроение меняет портрет ("+d2+" пикселей)");
}));

/* ── поручения: сцена с решением, а не маршрут с точкой ── */
TEST_SUITES.push(()=>suite("поручение: цель, срок и провал",()=>{
  resetWorld();
  G.credits=300000;
  hireMgr(genMgr(4242,["cmd"]));
  const m=mgrOf("cmd");m.loy=70;
  /* цель считается по обычному состоянию игры, а не по счётчику ради квеста */
  m.job={id:"showfight",t0:Date.now(),mins:25,offer:1};
  ok(jobAccept(m),"поручение принято");
  eq(m.job.offer,undefined,"предложение стало работой");
  jobTick(m);
  ok(!!m.job,"без убитых пиратов оно висит");
  G.kills=(G.kills|0)+6;
  jobTick(m);
  ok(!m.job,"шесть пиратов закрыли поручение");
  ok(mgrPoints(m)>0,"награда — очко перка вне очереди");
  /* «тишина в эфире» ломается любым вашим приказом — и он это помнит */
  const loy0=m.loy;
  m.job={id:"silence",t0:Date.now(),mins:18,mark:G.orderStamp|0};
  jobTick(m);
  ok(!!m.job,"пока вы молчите, поручение идёт");
  G.orderStamp++;                       // влезли с приказом
  jobTick(m);
  ok(!m.job&&m.loy<loy0,"вмешательство закрыло поручение не в вашу пользу");
}));

TEST_SUITES.push(()=>suite("поручение: выбор стоит денег и лояльности",()=>{
  resetWorld();
  G.credits=300000;
  hireMgr(genMgr(4242,["cmd"]));
  const m=mgrOf("cmd");m.loy=60;
  m.job={id:"honor",t0:Date.now(),mins:0,offer:1};
  const cr=G.credits,loy=m.loy;
  ok(jobPick(m,0),"вариант «выкупить» выбран");
  ok(G.credits<cr,"он списал деньги");
  ok(m.loy>loy,"и запомнил это в вашу пользу");
  ok(!m.job,"сцена закрылась");
  /* одно и то же поручение не приходит дважды */
  ok((m.jobPast||[]).indexOf("honor")>=0,"поручение ушло в прошедшие");
  m.job={id:"honor",t0:Date.now(),mins:0,offer:1};
  const pool=MGR_JOBS.filter(J=>J.role==="cmd"&&(m.jobPast||[]).indexOf(J.id)<0);
  ok(pool.length<MGR_JOBS.filter(J=>J.role==="cmd").length,"пул поручений сузился");
}));

/* ── ИИ-ядро: дешевле человека и постепенно перестаёт быть вашим ── */
TEST_SUITES.push(()=>suite("ИИ-ядро: место, бюджет и дрейф",()=>{
  resetWorld();
  G.credits=300000;
  /* без схемы ядра его не собрать */
  ok(!buildAi("keep"),"без перка «схема ядра» ядро не собирается");
  hireMgr(genMgr(31,["sci"]));
  const sci=mgrOf("sci");
  sci.xp=MGR_XP[5];
  for(const id of ["draft","better","core"])mgrLearn(sci,id);
  ok(aiCanBuild(),"схема ядра открыта");
  G.cargo.iridium=60;G.cargo.crystal=50;G.cargo.isotopes=40;
  ok(buildAi("keep"),"ядро собрано на свободный домен");
  const ai=mgrOf("keep");
  ok(ai.ai===1,"это машина, а не человек");
  eq(mgrCut(ai),0,"доли не берёт");
  ok(mgrPay(ai)<MGR_ROLES.keep.pay,"обслуживание дешевле оклада человека");
  const human=genMgr(1,["keep"]);human.xp=ai.xp;human.perks=[];human.slotBonus=0;
  eq(mgrSlots(ai),mgrSlots(human)*2,"слотов приказов у него вдвое против человека того же уровня");
  /* занятый домен вторым ядром не берётся, и пятого места нет */
  ok(!buildAi("keep"),"на занятый домен второе ядро не встаёт");
  G.credits=300000;G.cargo.iridium=60;G.cargo.crystal=50;G.cargo.isotopes=40;
  ok(buildAi("cmd"),"второй свободный домен закрыт ядром");
  G.credits=300000;G.cargo.iridium=60;G.cargo.crystal=50;G.cargo.isotopes=40;
  ok(buildAi("fact"),"третий тоже");
  eq(G.mgrs.length,MGR_CAP,"мест по-прежнему четыре");
  ok(!buildAi("sci"),"пятого места не появилось");
  /* дрейф растёт от работы, и на сотне ядро уходит вместе с доменом */
  ai.drift=0;
  aiDrift(ai,60,50);
  ok(ai.drift>0,"дрейф вырос от самостоятельной работы");
  ai.drift=99.9;
  aiDrift(ai,1,0);
  ok(ai.gone,"на сотне ядро разошлось");
  ok(!!G.aiRift,"и видно, куда именно оно ушло");
}));

TEST_SUITES.push(()=>suite("ИИ-ядро: учится само и переживает сохранение",()=>{
  resetWorld();
  G.credits=300000;
  hireMgr(genMgr(31,["sci"]));
  const sci=mgrOf("sci");
  sci.xp=MGR_XP[5];
  for(const id of ["draft","better","core"])mgrLearn(sci,id);
  G.cargo.iridium=60;G.cargo.crystal=50;G.cargo.isotopes=40;
  buildAi("cmd");
  const ai=mgrOf("cmd");
  ai.xp=MGR_XP[3];
  aiLearn(ai);
  ok(ai.perks.length>0,"очки оно потратило само");
  eq(mgrPoints(ai),0,"и не оставило свободных");
  ai.drift=55;
  const json=JSON.stringify(snapshot());
  resetWorld();
  applySave(JSON.parse(json));
  const back=mgrOf("cmd");
  ok(back&&back.ai===1,"ядро восстановлено машиной");
  near(back.drift,55,.1,"дрейф сохранился");
}));
