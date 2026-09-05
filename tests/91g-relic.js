/* ══════════════ автотесты: лаборатория и артефакты: слот, эффекты, дерево перков без пустот ══════════════ */
TEST_SUITES.push(()=>suite("лаборатория: домен исследователя, а не воздух",()=>{
  resetWorld();
  G.credits=300000;
  hireMgr(genMgr(31,["sci"]));
  const sci=mgrOf("sci");
  ok(!!TECH.lab,"наука «Лаборатория» есть в дереве");
  ok(!!BUILD.lab,"постройка есть в списке");
  eq(BUILD.lab.needTech,"lab","и заперта наукой");
  ok(!labWorking(),"без базы работать негде");
  /* закладываем базу и ставим лабораторию с жилым отсеком рядом */
  const p=G.sys.planets.find(x=>x.type!=="gas");
  G.cargo.alloy=60;
  ok(foundBase(p),"база заложена");
  const B=baseAt(G.sx,G.sy,p.idx);
  B.cells[2]={k:"lab",hp:1};
  eq(labCount(),1,"лаборатория стоит");
  ok(!labWorking(),"но без жилого отсека рядом она мертва");
  B.cells[1]={k:"habitat",hp:1};
  ok(labWorking(),"с жилым отсеком по соседству — работает");
  /* без лаборатории он не бездельничает, но идёт втрое медленнее */
  sci.prog=0;G.data=0;
  mgrWorkSci(sci,100);
  const withLab=G.data;
  B.cells[2]=null;
  sci.prog=0;G.data=0;
  mgrWorkSci(sci,100);
  ok(G.data<withLab,"в кают-компании выхлоп меньше, чем в лаборатории");
  ok(G.data>0,"но совсем без дела он не сидит");
}));

TEST_SUITES.push(()=>suite("артефакты: слот один, эффект глобальный",()=>{
  resetWorld();
  G.credits=300000;
  hireMgr(genMgr(31,["sci"]));
  hireMgr(genMgr(77,["cmd"]));
  const sci=mgrOf("sci"),cmd=mgrOf("cmd");
  eq(RELIC_KEYS.length,7,"артефактов семь, как в замысле");
  ok(!relicSlotOpen(),"без «Ксеноархива» носить их негде");
  relicFind("blank","тест");
  ok(relicHave("blank"),"находка записана");
  ok(!relicEquip(sci,"blank"),"и надеть её пока нельзя");
  ok(!relicOn("blank"),"эффекта тоже нет");
  G.tech.add("relic");
  ok(relicSlotOpen(),"с наукой слот открылся");
  ok(relicEquip(sci,"blank"),"артефакт надет");
  /* эффект глобальный: доля падает у всех, а не у носителя */
  const withIt=mgrCut(cmd);
  relicUnequip(sci);
  const without=mgrCut(cmd);
  near(without-withIt,.03,.001,"«Пустой контракт» сбивает долю всем на три пункта");
  relicEquip(sci,"blank");
  /* вторая строка — только при исследователе, умеющем читать */
  ok(!relicDeep("blank"),"вторая строка заперта");
  sci.perks.push("relic");
  ok(relicDeep("blank"),"с «чтением» она открывается");
  /* артефакт один: надеть его двоим нельзя */
  relicEquip(cmd,"blank");
  eq(sci.relic,null,"прежний владелец его отдал");
  eq(cmd.relic,"blank","и он ровно у одного");
}));

TEST_SUITES.push(()=>suite("артефакты: первые строки работают там, где обещано",()=>{
  resetWorld();
  G.credits=300000;G.tech.add("relic");
  hireMgr(genMgr(77,["cmd"]));
  const cmd=mgrOf("cmd");
  /* «Счётная кость»: удача нового наёмника не ниже средней */
  const mk=()=>{const c=genMerc(4242,null);c._luck=null;return crewLuck(c);};
  const plain=mk();
  relicFind("dice","т");relicEquip(cmd,"dice");
  ok(mk()>=1,"со «Счётной костью» удача не бывает ниже 1.0");
  ok(typeof plain==="number"&&plain===plain,"без неё бывает любой (эталон "+plain.toFixed(2)+")");
  /* «Тихий маяк»: ядро дрейфует вдвое медленнее */
  relicUnequip(cmd);
  const ai={seed:7,role:"keep",ai:1,drift:0,perks:[],traits:[],loy:100,xp:0,log:[]};
  aiDrift(ai,10,0);const fast=ai.drift;
  relicFind("quiet","т");relicEquip(cmd,"quiet");
  ai.drift=0;aiDrift(ai,10,0);
  near(ai.drift,fast/2,.01,"с «Тихим маяком» дрейф вдвое медленнее");
}));

TEST_SUITES.push(()=>suite("оживлённые перки исследователя",()=>{
  resetWorld();
  G.credits=300000;
  hireMgr(genMgr(31,["sci"]));
  const sci=mgrOf("sci");
  /* «допуск»: усиливается прибавка, а не множитель целиком */
  const k=BP_KEYS[0];
  G.blueprints={};G.blueprints[k]=1;
  near(bpMul(k,1.2,.9),1.2,.001,"без перка чертёж даёт своё");
  sci.perks.push("better");
  near(bpMul(k,1.2,.9),1.23,.001,"с «допуском» прибавка на 15% больше");
  /* «пересборка»: перепроверка вдвое дешевле */
  G.data=1000;G.blueprints[k]=-1;
  bpRecheck(k);
  eq(1000-G.data,60,"без перка пересборка стоит 60 данных");
  sci.perks.push("redo");
  G.data=1000;G.blueprints[k]=-1;
  bpRecheck(k);
  eq(1000-G.data,30,"с «пересборкой» — половину");
  /* «биология»: отсканированная жизнь становится образцом */
  sci.perks.push("bio");
  G.bio=4;G.data=0;sci.prog=0;
  mgrWorkSci(sci,300);
  ok(G.bio<4,"живые образцы уходят в разбор");
  ok(G.data>0,"и дают науку");
}));

TEST_SUITES.push(()=>suite("артефакты переживают сохранение",()=>{
  resetWorld();
  G.credits=300000;G.tech.add("relic");
  hireMgr(genMgr(31,["sci"]));
  const sci=mgrOf("sci");
  relicFind("blank","т");relicEquip(sci,"blank");
  /* заодно стережём поля, которые терялись молча: список полей в applySave
     белый, и новое поле надо вносить в него руками */
  sci.cutBonus=.02;sci.ultCount=1;
  G.relicHint={sx:3,sy:-1};G.bio=6;
  const json=JSON.stringify(snapshot());
  resetWorld();
  eq(relicOwned().length,0,"сброс мира их убирает");
  applySave(JSON.parse(json));
  const back=mgrOf("sci");
  eq(relicOwned().length,1,"находка вернулась");
  eq(back.relic,"blank","и осталась надетой");
  ok(relicOn("blank"),"эффект после загрузки работает");
  near(back.cutBonus,.02,.001,"поднятая ультиматумом доля не потерялась");
  eq(back.ultCount,1,"и счётчик ультиматумов тоже");
  eq(G.bio,6,"живые образцы сохранились");
  ok(!!G.relicHint,"след артефакта на карте остался");
  /* битую запись в слот не пускаем */
  const bad=JSON.parse(json);
  bad.relics={"нетакой":1,blank:1};
  applySave(bad);
  ok(relicOwned().every(k=>!!ARTIFACTS[k]),"артефакта не из таблицы в игре нет");
}));

TEST_SUITES.push(()=>suite("дерево перков: подписей без кода не осталось",()=>{
  /* Главная проверка этой вехи, и она должна пережить нас. Перк виден игроку
     целиком, и очко уровня тратится всерьёз: перк, который никто не читает, —
     обман. На ревизии таких нашлось 24 из 48.
     Считаем «подключённым» перк, который читают через mgrPerk/mgrPerkOf или
     который открывает стоящий приказ (поле need в MGR_RULES). */
  /* только код игры: тесты живут в том же файле, и их строки не в счёт */
  const src=document.scripts[0].textContent.split("TEST_SUITES")[0];
  const needed={};
  for(const role in MGR_RULES)for(const r of MGR_RULES[role])if(r.need)needed[r.need]=1;
  const dead=[];
  for(const role in MGR_PERKS)for(const br of MGR_PERKS[role])for(const p of br.list){
    if(needed[p.id])continue;
    if(new RegExp("mgrPerk(Of)?\\([^)]*\""+p.id+"\"").test(src))continue;
    dead.push(role+"/"+p.id+" «"+p.ru+"»");
  }
  eq(dead.join(", "),"","каждый перк дерева кто-то читает");
}));
