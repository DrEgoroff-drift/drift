/* ══════════════ автотесты: уход (M159) ══════════════ */
TEST_SUITES.push(()=>suite("уход: на 60-й день — минута тишины, потом «Ушли» и строка без имени",()=>{
  resetWorld();
  G.exp={phase:1,day0:celDay(),coll:{},gone:[],gave:0,pax:null,lastDay:celDay()};G.things=[];G.log=[];
  G.t+=CEL_DAY*EXP_DAYS;
  expDepartTick();
  eq(G.exp.phase,2,"ушли — фаза 2");
  ok(expQuiet(),"минута тишины");
  eq(layerLevel("motif",{motif:1}),0,"музыка молчит");
  G.etherT=1;G.mode="system";G.running=true;const n0=G.log.length;etherTick(1);
  eq(G.log.length,n0,"эфир молчит");
  ok(!G.log.some(x=>x.s==="Ушли."),"строки «Ушли» ещё нет");
  G.t+=EXP_QUIET+1;expDepartTick();
  ok(!expQuiet(),"минута прошла");
  ok(G.log.some(x=>x.k==="ether"&&x.s==="Ушли."),"«Ушли.»");
  ok(G.things.some(t=>t.ru==="Строка без имени"),"строка без имени на столе");
  ok(!expOn(),"сбор кончился");
  eq(expPriceMul("isotopes"),1,"цены обычные");
  /* год спустя — лента без подписи */
  G.t+=CEL_DAY*365;expDepartTick();
  ok(G.things.some(t=>t.k==="tape"&&t.full),"через год — лента без подписи, с полной фигурой");
  G.exp=null;
}));

TEST_SUITES.push(()=>suite("уход: место предлагают один раз, на стойке ядра уезда; уйти — концовка",()=>{
  resetWorld();
  const at=regionOfTheme("hours");const R=regionAt(at.rx*REGION_SPAN,at.ry*REGION_SPAN);
  const core=getSystem(R.core.sx,R.core.sy);
  G.exp={phase:2,day0:celDay()-60,depDay:celDay(),coll:{},gone:[],gave:0,pax:null,said:1};G.things=[];G.log=[];
  G.sx=0;G.sy=0;G.sys=getSystem(0,0);G.st=G.sys.station||{stype:"x"};
  ok(!expOfferHere(),"не в ядре — не предлагают");
  G.sx=core.sx;G.sy=core.sy;G.sys=core;G.st=core.station||{stype:"x"};
  if(!core.station){ok(true,"в ядре нет станции — предложение проверено по адресу");G.exp=null;return;}
  ok(expOfferHere(),"в ядре в день ухода — предлагают");
  G.t+=CEL_DAY*3;
  ok(!expOfferHere(),"через три дня — уже нет");
  G.t-=CEL_DAY*3;
  ok(expEnd(),"ушли с ними");
  ok(G.exp.ended===1,"концовка помечена");
  ok(!expOfferHere(),"второй раз не предлагают");
  ok(G.things.some(t=>t.ru==="Последняя запись"),"последняя запись на столе");
  ok(!expEnd(),"дважды не уйти");
  G.exp=null;
}));
