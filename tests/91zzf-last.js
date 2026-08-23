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
  ok(RET_BOARD.filter(b=>b[1]>0).length===3,"половина строк табло просрочена");
  const s=snapshot();applySave(s);eq(G.ret.seen,1,"помнится");
  G.sx=0;G.sy=0;G.sys=getSystem(0,0);eq(retDrift(),0,"дома ничего");
}));
TEST_SUITES.push(()=>suite("слухи: область, не точка; образ, деталь, источник; пятнадцать процентов врут",()=>{
  resetWorld();G.st=G.sys.station;
  const L=rumoursHere();eq(L.length,2,"два слуха на станции");
  for(const q of L){ok(q.rad>=3&&q.rad<=5,"область в "+q.rad+" систем");ok(/—/.test(q.text)&&/±/.test(q.text),"образ, источник, разброс");}
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
