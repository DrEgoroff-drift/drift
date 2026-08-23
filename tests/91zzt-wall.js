/* ══════════════ автотесты: стенгазета и концерт (M165) ══════════════ */
TEST_SUITES.push(()=>suite("стенгазета: лист рисуется из фактов, карикатура при худой репутации — на вас",()=>{
  resetWorld();
  const S=G.sys.station?G.sys:null;ok(!!S,"станция есть");
  G.sx=S.sx;G.sy=S.sy;G.st=S.station;
  G.rep={};
  ok(!wallHero().you,"с обычной репутацией карикатура не на вас");
  if(typeof repAdd==="function"){repAdd(-5,S);ok(wallHero().you===1,"с худой — на вас");G.rep={};}
  const cv=document.createElement("canvas");cv.width=460;cv.height=150;
  drawWallPaper(cv.getContext("2d"),460,150);
  const px=cv.getContext("2d").getImageData(230,15,1,1).data;
  ok(px[0]>200,"лист нарисован (бумага светлая)");
  ok(WALL_POEMS.length>=4,"стихи смотрителя есть");
}));

TEST_SUITES.push(()=>suite("концерт: привет раз в день, три ноты позывного, строка в ЭФИР, Вега слышит",()=>{
  resetWorld();
  G.concert=null;G.log=[];G.credits=100;
  G.home=homeInit();G.home.tier=7;G.home.sx=G.sx;G.home.sy=G.sy;
  G.wishDevice=1;vegaWish("love");
  let to=null;
  for(let x=-8;x<=8&&!to;x++)for(let y=-8;y<=8&&!to;y++){if((x|0)===G.sx&&(y|0)===G.sy)continue;if(starAt(x,y)){const S=getSystem(x,y);if(S&&S.station)to=S;}}
  ok(!!to,"есть кому передать");
  const notes=concertNotes(to);
  eq(notes.length,3,"три ноты");
  eq(concertNotes(to).join(","),notes.join(","),"позывной станции не меняется");
  ok(concertSend(to),"привет передан");
  eq(G.credits,90,"минус десять");
  ok(G.log.some(x=>x.k==="ether"&&x.s.indexOf(to.station.name)>=0),"строка в ЭФИРЕ");
  ok(G.log.some(x=>x.k==="talk"&&x.s.indexOf("Вега")===0),"Вега услышала");
  ok(!concertSend(to),"второй раз в день — нет");
  const s=snapshot();G.concert=null;applySave(JSON.parse(JSON.stringify(s)));
  ok(!concertSend(to),"и после сохранения помнит, что сегодня было");
  G.vega=null;G.concert=null;
}));
