/* ══════════════ эпизоды и записная книжка (M374, §6.2–6.3) ══════════════
   Репутации нет — есть дела и люди. Здесь мерится ровно то, чем эта система
   отличается от полоски отношения: без свидетеля дела не было; дело едет и до
   дальнего сектора доходит не сразу; на месте берётся самый тяжёлый доехавший
   эпизод, а не сумма; «не простил» не перекрывается ничем. */
function nbWorld(){
  resetWorld();
  G.episodes=[];G.notebook=[];G.gifts={};
  G.sx=0;G.sy=0;G.pirates=[];G.npcWrecks=[];G.tow=null;
  /* борт ставим в ноль явно: `resetWorld` оставляет его там, где положено миру,
     и в Хроме это не начало координат — набор ловил это разницей ярусов */
  G.ship.x=0;G.ship.y=0;G.ship.vx=0;G.ship.vy=0;
  return G;
}
function nbFoe(by,d){
  const p={x:d===undefined?200:d,y:0,vx:0,vy:0,a:0,hull:100,hullMax:100,
    name:"борт-"+by,rank:1,seed:7,shipId:"nb"+by,cool:0,aware:false,thrust:false,
    pw:by,owner:by,iff:1};
  G.pirates.push(p);return p;
}

TEST_SUITES.push(()=>suite("эпизоды M374: без свидетеля ничего не было",()=>{
  nbWorld();
  eq(epiAdd("tow","or"),null,"никого рядом — эпизод не пишется");
  eq(epiAll().length,0,"и в списке пусто");
  nbFoe("or",300);
  const e=epiAdd("tow","or");
  ok(!!e,"их борт рядом — дело записано");
  eq(e.by,"or","с той державой, чей борт видел");
  ok(!!e.who&&e.who.length>1,"и оно привязано к человеку: "+e.who);
  eq(noteAll().length,1,"человек попал в книжку");
  /* тот же человек второй раз книжку не растит */
  epiAdd("fuel","or",{who:e.who});
  eq(noteAll().length,1,"второй эпизод того же человека места не занимает");
  /* книжка не растёт бесконечно: двенадцать мест */
  for(let i=0;i<20;i++)epiAdd("fuel","or",{who:"чел-"+i});
  ok(noteAll().length<=NOTE_MAX,"в книжке не больше двенадцати: "+noteAll().length);
}));

TEST_SUITES.push(()=>suite("эпизоды M374: дело едет и доезжает не сразу",()=>{
  nbWorld();
  nbFoe("km",300);
  const e=epiAdd("distress","km");
  ok(!!e,"дело записано");
  /* здесь и сейчас — знают */
  ok(epiReached(e,G.sx,G.sy),"на месте знают сразу");
  /* далеко — ещё нет */
  ok(!epiReached(e,G.sx+30,G.sy),"за тридцать секторов ещё не знают");
  /* пройдёт время — узнают: подделываем возраст эпизода */
  e.N-=20;
  ok(epiReached(e,G.sx+30,G.sy),"через двадцать сводок доехало");
  /* самый тяжёлый, а не сумма */
  nbWorld();
  nbFoe("ra",300);
  epiAdd("fuel","ra");epiAdd("mail","ra");
  const heavy=epiAdd("tow","ra");
  const here=epiHere("ra");
  eq(here.k,"tow","берётся самый тяжёлый, а не последний и не сумма");
  /* хорошее и дурное не гасят друг друга */
  epiAdd("shot","ra",{force:1});
  const both=epiBoth("ra");
  ok(both.good&&both.bad,"доехали оба — оклик скажет оба");
  ok(epiHailLine("ra").indexOf("но и")>0,"и в строке оклика они оба: "+epiHailLine("ra"));
}));

TEST_SUITES.push(()=>suite("эпизоды M374: чем они открывают двери",()=>{
  nbWorld();
  /* покупка чужого корпуса: без эпизода нельзя, с эпизодом можно (§19.3) */
  eq(episodeWith("or"),false,"эпизодов нет — и корпус не продадут");
  eq(hasEpisode("or"),false,"тот же ответ у самой верфи");
  nbFoe("or",300);
  epiAdd("tow","or");
  eq(episodeWith("or"),true,"дело есть");
  eq(hasEpisode("or"),true,"и верфь это видит");
  /* четвёртый допуск — за дело с ГЛАВТРАССОЙ, а не за часы */
  nbWorld();
  /* третий допуск заработан по-старому: экзамен, десять сбитых, сто часов */
  G.coop={name:"«Тихий ход»",sold0:0,done:[]};
  G.clearance=3;G.kills=99;G.flownMs=400*3600000;
  nbFoe("gt",300);
  eq(clearanceEarned(),3,"без дела с ГЛАВТРАССОЙ выше третьего не поднимаются");
  epiAdd("tow","gt");
  eq(clearanceEarned(),4,"а с тяжёлым делом открывается четвёртый");
  /* подарок: раз на державу */
  nbWorld();
  nbFoe("km",300);
  epiAdd("tow","km");
  ok(epiGiftDue("km"),"за тяжёлое дело обещан корпус со списания");
  const uid=epiGiftTake("km");
  ok(!!uid&&!!G.uniqueShips[uid],"корпус отдан");
  eq(shipData(uid).by,"km","и он их работы");
  eq(epiGiftDue("km"),false,"второй раз не отдадут");
  eq(epiGiftTake("km"),null,"и взять нечего");
}));

TEST_SUITES.push(()=>suite("эпизоды M374: «не простил» не перекрывается ничем",()=>{
  nbWorld();
  const p=nbFoe("hf",300);
  epiAdd("tow","hf",{who:p.name});
  eq(noteAll().length,1,"человек в книжке");
  epiNeverForgave(p);
  eq(noteAll().length,0,"и ушёл из неё навсегда");
  const e=epiHere("hf");
  eq(e.k,"never","на месте помнят именно это");
  ok(e.w<=-1000,"и вес у этого свой: "+e.w);
  /* даже новое доброе дело не перебивает */
  epiAdd("tow","hf",{force:1});
  eq(epiHere("hf").k,"never","доброе дело этого не перекрывает");
  /* просьба — одна на сводку */
  nbWorld();
  nbFoe("gt",300);
  epiAdd("fuel","gt");
  const x=noteAll()[0];
  ok(noteAskable(x),"попросить можно");
  G.fuel=10;
  const ans=noteAsk(x,"fuel");
  ok(G.fuel>10,"залили сверх нормы: "+ans);
  ok(!noteAskable(x),"а второй раз в ту же сводку — нет");
  ok(noteAsk(x,"fuel").indexOf("уже")>=0,"и он это говорит");
}));

/* ══════════════ спасатель (M375, §6.4) ══════════════
   Тот, кто тащит и снимает людей, нейтрален обеим сторонам по определению —
   и это единственный способ заработать эпизоды сразу у двоих. */
TEST_SUITES.push(()=>suite("спасатель M375: два корпуса после боя — два эпизода",()=>{
  nbWorld();
  G.mode="system";
  /* после боя остались обломки обеих сторон */
  G.npcWrecks=[{x:60,y:0,seed:11,by:"or",crew:1},{x:-60,y:0,seed:12,by:"km",crew:1}];
  G.tow=null;
  /* с первого снимаем экипаж — эпизод с той стороной */
  G.ship.x=60;G.ship.y=0;
  ok(npcCrewOff(G.ship),"экипаж снят");
  ok(epiAll().some(e=>e.by==="or"&&e.k==="distress"),"эпизод с первой стороной");
  /* второй берём на трос — эпизод со второй */
  G.ship.x=-60;
  ok(npcRescue(G.ship,true),"обломок под рукой");
  ok(!!G.tow&&G.tow.by==="km","корпус на тросе");
  ok(epiAll().some(e=>e.by==="km"&&e.k==="tow"),"и эпизод со второй стороной");
  const powers={};for(const e of epiAll())powers[e.by]=1;
  eq(Object.keys(powers).length,2,"один бой — два эпизода у двух держав");
  /* подбитому живому борту отдают топливо, и это тоже дело */
  nbWorld();
  G.mode="system";G.npcWrecks=[];
  const p=nbFoe("ra",100);
  p.hull=p.hullMax*.2;
  G.fuel=stat().fuelMax;
  const f0=G.fuel;
  ok(npcRescue(G.ship,true),"подбитый рядом");
  ok(G.fuel<f0,"топливо отдано");
  ok(p.hull>p.hullMax*.2,"ему полегчало");
  ok(epiAll().some(e=>e.by==="ra"&&e.k==="fuel"),"и это записано делом");
}));
