/* ══════════════ M474: Орднунг — два нажатия на кассе ══════════════
   Если сердце метро станет землёй Орднунга, одно нажатие только декларирует.
   railBuyBoard всегда доводит до ожидания поезда. */
TEST_SUITES.push(()=>suite("железная: Орднунг — декларация и посадка",()=>{
  resetWorld();
  if(typeof railEnsure==="function")railEnsure(G.sx|0,G.sy|0);
  /* любая станция метро в круге */
  let here=null;
  for(let r=0;r<=RAIL_METRO_R&&!here;r++)for(let x=-r;x<=r&&!here;x++)for(let y=-r;y<=r;y++){
    if(Math.abs(x)!==r&&Math.abs(y)!==r)continue;
    if(!starAt(x,y))continue;
    const s=getSystem(x,y);if(!s||!s.station)continue;
    G.sx=x;G.sy=y;G.sys=s;
    if(railStation(x,y))here=s;
  }
  ok(!!here,"есть станция метро");
  if(!here)return;
  const D=railDestinations();
  ok(D.length>0,"касса продаёт хоть куда-то");
  if(!D.length)return;
  const t=D[0],own0=stampOwnerAt,cred0=G.credits;
  G.credits=Math.max(G.credits,500);
  RAIL_DECL="";RAIL_WAIT=null;
  try{
    stampOwnerAt=()=>"or";
    /* одно нажатие — только декларация */
    railBuy(t,false,false);
    ok(!RAIL_WAIT&&RAIL_DECL===t.l.id+":"+t.i1,"Орднунг: первое нажатие — декларация, без поезда");
    ok(/ДЕКЛАРИРУЮ/.test(G.msg||""),"голос: «ДЕКЛАРИРУЮ…»");
    /* второе — билет */
    railBuy(t,false,false);
    ok(!!RAIL_WAIT,"Орднунг: второе нажатие — ожидание поезда");
    /* railBuyBoard с чистого листа — сразу до посадки */
    RAIL_DECL="";RAIL_WAIT=null;G.credits=Math.max(G.credits,500);
    railBuyBoard(t,false,false);
    ok(!!RAIL_WAIT,"railBuyBoard: два нажатия внутри, поезд ждёт");
  }finally{
    stampOwnerAt=own0;G.credits=cred0;RAIL_DECL="";RAIL_WAIT=null;
  }
}));
