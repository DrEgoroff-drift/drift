/* ══════════════ M474: Орднунг — два нажатия на кассе ══════════════
   Хозяин земли станции — Орднунг: одно нажатие только декларирует трюм.
   railBuyBoard всегда доводит до ожидания поезда (наборы и боты берут его). */
TEST_SUITES.push(()=>suite("железная: Орднунг — декларация и посадка",()=>{
  ok(typeof railEnsure==="function","railEnsure на месте");
  ok(typeof railBuy==="function","railBuy на месте");
  ok(typeof railBuyBoard==="function","railBuyBoard на месте");
  ok(typeof railDeclare==="function","railDeclare на месте");
  resetWorld();
  railEnsure(G.sx|0,G.sy|0);
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
  const t=D[0],own0=stampOwnerAt,cred0=G.credits,key=t.l.id+":"+t.i1;
  G.credits=Math.max(G.credits,500);
  RAIL_DECL="";RAIL_WAIT=null;
  try{
    /* не Орднунг: одно нажатие сажает */
    stampOwnerAt=()=>"gt";
    RAIL_DECL="";RAIL_WAIT=null;
    const cGt=G.credits;
    railBuy(t,false,false);
    ok(!!RAIL_WAIT,"не Орднунг: одно нажатие — ожидание поезда");
    ok(G.credits<cGt,"не Орднунг: билет списал кредиты");
    ok(RAIL_WAIT.to&&RAIL_WAIT.t>0,"ожидание: есть назначение и таймер");

    /* Орднунг: первое — декларация, второе — посадка */
    stampOwnerAt=()=>"or";
    RAIL_DECL="";RAIL_WAIT=null;G.credits=Math.max(G.credits,500);
    const cOr=G.credits;
    railBuy(t,false,false);
    ok(!RAIL_WAIT,"Орднунг: первое нажатие — без поезда");
    eq(RAIL_DECL,key,"Орднунг: декларация записана по ключу рейса");
    ok(G.credits===cOr,"Орднунг: декларация кредиты не берёт");
    ok(/ДЕКЛАРИРУЮ/.test(G.msg||""),"голос: «ДЕКЛАРИРУЮ…»");
    railBuy(t,false,false);
    ok(!!RAIL_WAIT,"Орднунг: второе нажатие — ожидание поезда");
    ok(G.credits<cOr,"Орднунг: второе нажатие списывает билет");

    /* railBuyBoard с чистого листа — оба нажатия внутри */
    RAIL_DECL="";RAIL_WAIT=null;G.credits=Math.max(G.credits,500);
    const cBo=G.credits;
    railBuyBoard(t,false,false);
    ok(!!RAIL_WAIT,"railBuyBoard: доводит до ожидания поезда");
    ok(G.credits<cBo,"railBuyBoard: билет списан");
    ok(RAIL_WAIT.l&&RAIL_WAIT.l.id===t.l.id,"railBuyBoard: тот же рейс");
  }finally{
    stampOwnerAt=own0;G.credits=cred0;RAIL_DECL="";RAIL_WAIT=null;
  }
}));
