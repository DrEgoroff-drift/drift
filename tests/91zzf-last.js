/* ══════════════ возвращение, слухи, имена, единичные места ══════════════ */
TEST_SUITES.push(()=>suite("возвращение: хронометр обманывает ровно один раз, табло никто не чистит",()=>{
  resetWorld();
  const at=regionOfTheme("tin");ok(!!at,"область расставлена");
  const R=regionAt(at.rx*REGION_SPAN,at.ry*REGION_SPAN);
  eq(R.needle,"chrono","прибор — хронометр");eq(R.name,"Возвращение","имя области");
  G.sx=R.core.sx;G.sy=R.core.sy;G.sys=getSystem(G.sx,G.sy);G.mode="system";G.running=true;G.st=G.sys.station;
  ok(retDrift()>0,"до первой стыковки хронометр уходит");
  const d=retDock();ok(d&&d.first&&/Домино/.test(d.line),"домино, снабжение");
  eq(retDrift(),0,"после — стоит, и больше никогда");
  ok(!retDock().first,"второй раз — партия как раз");
  /* Половина — это отношение, а не число: строк стало восемь, когда среди них
     появилась шлюпка «Долгого Хода» (11s, 12q). Сторожим отношение. */
  eq(RET_BOARD.filter(b=>b[1]>0).length*2,RET_BOARD.length,"половина строк табло просрочена");
  ok(RET_BOARD.some(b=>b[0].indexOf(LORE_SHUTTLE)>=0&&b[1]>0),
     "и среди просроченных стоит шлюпка, названная в отчёте");
  const s=snapshot();applySave(s);eq(G.ret.seen,1,"помнится");
  G.sx=0;G.sy=0;G.sys=getSystem(0,0);eq(retDrift(),0,"дома ничего");
}));
TEST_SUITES.push(()=>suite("слухи: область, не точка; образ, деталь, источник; пятнадцать процентов врут",()=>{
  resetWorld();G.st=G.sys.station;
  const L=rumoursHere();eq(L.length,2,"два слуха на станции");
  for(const q of L){
    ok(q.rad>=3&&q.rad<=5,"область в "+q.rad+" систем");
    /* порядок фразы: КТО — ПРО ЧТО — ГДЕ — ПОЧЕМУ верить */
    eq(q.text.indexOf(capRu(q.src)),0,"слух начинается с того, кто его рассказал");
    ok(q.text.indexOf(q.img)>0,"в слухе есть образ места");
    ok(/сектора -?\d+:-?\d+/.test(q.text),"адрес со словом «сектор»: без него «-9:18» читается временем");
    ok(q.text.indexOf("в "+q.rad+" секторах вокруг")>0,"разброс словами, а не знаком");
    ok(!/±/.test(q.text),"знака ± в слухе нет — он нигде больше в игре не встречается");
    eq(q.lines.length,3,"на экран — три строки: что, где, с чьих слов");
    ok(q.short.indexOf("сектора")>0,"короткая форма для приёмника знает место");
  }
  /* пол рассказчика и пол в детали — один: раньше буфетчица «клялся кружкой» */
  let bad=0,seen=0;
  const sys0=G.sys;
  for(let i=0;i<80;i++){
    G.sys={sx:i*7,sy:i,key:i*7+","+i};
    for(const q of rumoursHere()){
      const f=RUMOUR_SRC.some(S=>S.ru===q.src&&S.f);seen++;
      /* граница слова в JS знает только латиницу — разбираем на слова сами */
      const w=q.det.toLowerCase().split(/[^а-яё]+/);
      if(f&&["он","его","ему"].some(x=>w.indexOf(x)>=0))bad++;
      if(!f&&["она","её","ей"].some(x=>w.indexOf(x)>=0))bad++;
    }
  }
  ok(seen>50&&bad===0,"деталь не спорит с полом рассказчика ("+bad+" из "+seen+")");
  G.sys=sys0;
  const L2=rumoursHere();eq(L2[0].text,L[0].text,"те же три дня — те же слухи");
  G.t+=CEL_DAY*3;ok(rumoursHere()[0].text!==L[0].text||rumoursHere()[1].text!==L[1].text,"через три дня — другие");
  /* доля неверных — около пятнадцати процентов по многим станциям */
  let wrong=0,tot=0;
  for(let i=0;i<60;i++){G.sys={sx:i*3,sy:-i,key:i*3+","+(-i)};for(const q of rumoursHere()){tot++;if(q.wrong)wrong++;}}
  ok(wrong>tot*.05&&wrong<tot*.3,"врут примерно пятнадцать процентов ("+wrong+"/"+tot+")");
  G.sys=getSystem(0,0);
  let hit=0;for(let i=0;i<60;i++){const r=rng(hashi(i,9,9));if(rumourEtherLine(r))hit++;}
  ok(hit>0&&hit<30,"на приёмнике слух изредка ("+hit+"/60)");
}));
TEST_SUITES.push(()=>suite("имена: своё имя на карте, рассказанное — у диспетчера искажённым",()=>{
  resetWorld();
  eq(nameOf(G.sys),G.sys.name,"без имени — код карты");
  ok(nameSet(G.sys,"Тихая Заводь"),"назвали");eq(nameOf(G.sys),"Тихая Заводь","на карте — ваше");
  ok(!nameSet(G.sys,"  <>  "),"пустое после чистки — снято");eq(nameOf(G.sys),G.sys.name,"код вернулся");
  nameSet(G.sys,"Очень длинное имя системы которое не влезет");ok(nameOf(G.sys).length<=NAME_MAX,"длина зажата");
  nameSet(G.sys,"Заводь");
  G.odo.jumps=10;ok(nameTell(G.sys),"рассказали");ok(!nameTell(G.sys),"дважды не надо");
  eq(namesEtherLine(),null,"рано");
  G.odo.jumps=26;const l=namesEtherLine();ok(l&&/«Завдь»|«Заодь»|«Завоь»|«Зводь»/.test(l),"диспетчер сказал ваше слово, искажённым: "+l);
  eq(namesEtherLine(),null,"и только раз");
  const s=snapshot();applySave(s);eq(nameOf(G.sys),"Заводь","имя переживает сейв");
  /* слух подхватывает имя ядра */
  const at=regionOfTheme("mirror"),R=regionAt(at.rx*REGION_SPAN,at.ry*REGION_SPAN);
  G.names[R.core.sx+","+R.core.sy]="Зеркальце";
  let seen=false;for(let i=0;i<80&&!seen;i++){G.sys={sx:i,sy:i*2,key:i+","+i*2};for(const q of rumoursHere())if(q.id==="mirror"&&/называют/.test(q.text))seen=true;}
  ok(seen,"слух о зеркале зовёт его вашим словом");
  G.sys=getSystem(0,0);
}));
TEST_SUITES.push(()=>suite("единичные места: три, с адресами, без строки в журнале",()=>{
  resetWorld();
  const P=placesAll();eq(P.length,3,"три места нашли звезду");
  const ks=new Set(P.map(q=>q.k));eq(ks.size,3,"и все разные");
  for(const q of P)ok(starAt(q.sx,q.sy),q.k+" стоит у звезды "+q.sx+":"+q.sy);
  eq(placeAt(0,0),null,"дома места нет");
  const q=P[0];G.sx=q.sx;G.sy=q.sy;G.sys=getSystem(G.sx,G.sy);G.mode="system";G.running=true;
  const pc=G.sys.planets.find(p=>p.type!=="gas");
  if(pc){
    ok(!!placeHere(pc),"на первой твёрдой планете оно есть");
    const tr=genTerrain(pc);G.land={p:pc,tr,x:tr.padX,y:groundAt(tr,tr.padX)};
    G.log=[];enterSurface();
    ok(!G.log.some(e=>/башн|чаш|лестниц/i.test(e.s)),"журнал о нём молчит");
    G.surf.x=placeX(tr,pc);G.surf.cam=null;let okDraw=true;try{drawSurface();}catch(e){okDraw=false;}ok(okDraw,"рисуется");
  }
}));
