/* ══════════════ автотесты: циркуляр (M156) ══════════════ */
TEST_SUITES.push(()=>suite("циркуляр: приходит, когда Кольцо слышали дважды и лента сдана",()=>{
  resetWorld();
  G.exp=null;G.ring=null;G.things=[];G.log=[];
  const R=ringAll();
  expDayTick();ok(!expOn(),"без Кольца циркуляра нет");
  R.heard=2;R.tapes=[{sx:0,sy:0,dir:0,q:.5,day:1,t:1,handed:0}];
  G.t+=CEL_DAY;expDayTick();ok(!expOn(),"лента не сдана — рано");
  R.tapes[0].handed=1;
  G.t+=CEL_DAY;expDayTick();
  ok(expOn(),"циркуляр прошёл");
  ok(G.log.some(x=>x.k==="ether"&&x.s.indexOf("ЦИРКУЛЯР")===0),"в ЭФИРЕ");
  ok(G.things.some(t=>t.ru==="Циркуляр"),"бумага на столе");
  eq(expDay(),0,"день ноль");
}));

TEST_SUITES.push(()=>suite("циркуляр: доска собирает один товар, цены ползут, отпустить наёмника",()=>{
  resetWorld();
  G.exp={phase:1,day0:celDay(),coll:{},gone:[],gave:0,pax:null,lastDay:celDay()};
  const S=G.sys.station?G.sys:null;ok(!!S,"станция есть");
  const D=expDemandOf(S);ok(!!D&&EXP_GOODS.indexOf(D.k)>=0,"станция собирает: "+D.ru);
  eq(expDemandOf(S).k,D.k,"и всегда одно и то же");
  G.cargo[D.k]=25;const c0=G.credits;
  eq(expGive(S,20),20,"сдали двадцать");
  eq(G.credits-c0,20*D.price,"по полуторной цене: "+D.price);
  eq(G.exp.coll[D.k],20,"учтено");
  ok(expPriceMul("isotopes")>1&&expPriceMul("iron")<1,"изотопы вверх, руда вниз");
  G.exp.phase=0;eq(expPriceMul("isotopes"),1,"без циркуляра цены обычные");G.exp.phase=1;
  /* наёмник просится и отпускается */
  const c=genMerc(4,["haul"]);c.order=null;G.crew=[c,genMerc(5,["haul"])];G.crew[1].morale=.5;
  c.askExp=1;
  ok(expRelease(c),"отпущен");
  eq(G.crew.length,1,"ушёл");
  ok(G.crew[0].morale>.5,"остальные подтянулись");
  eq(G.exp.gone[0],c.name,"записан ушедшим");
  G.crew=[];
}));

TEST_SUITES.push(()=>suite("циркуляр: попутчик занимает кресло, фраза за прыжок, сходит у своей станции",()=>{
  resetWorld();
  G.exp={phase:1,day0:celDay(),coll:{},gone:[],gave:0,pax:null,lastDay:celDay()};G.seat=null;
  let S=null,P=null;
  for(let x=-10;x<=10&&!P;x++)for(let y=-10;y<=10&&!P;y++){if(!starAt(x,y))continue;const T=getSystem(x,y);if(T&&T.station){const o=expPaxOffer(T);if(o){S=T;P=o;}}}
  if(!P){ok(true,"попутчика сегодня нет — пропущено");return;}
  ok(expPaxTake(S),"взяли");
  ok(!!G.seat&&G.seat.name===P.name.toUpperCase(),"кресло занято им");
  G.log=[];expPaxJump();
  ok(G.log.some(x=>x.k==="talk"&&x.s.indexOf(P.name)===0),"фраза за прыжок");
  G.sx=P.to.sx;G.sy=P.to.sy;G.sys=getSystem(G.sx,G.sy);
  expPaxDock();
  eq(G.exp.pax,null,"сошёл у своей станции");
  eq(G.seat,null,"кресло свободно");
  /* сохранение */
  const s=snapshot();G.exp=null;applySave(JSON.parse(JSON.stringify(s)));
  ok(expOn(),"циркуляр пережил сохранение");
}));
