/* ══════════════ автотесты: невязка (M155) ══════════════ */
function misTestRegion(){
  const at=regionOfTheme("hours");if(!at)return null;
  const R=regionAt(at.rx*REGION_SPAN,at.ry*REGION_SPAN);
  const list=[];
  for(let x=at.rx*REGION_SPAN;x<(at.rx+1)*REGION_SPAN;x++)for(let y=at.ry*REGION_SPAN;y<(at.ry+1)*REGION_SPAN;y++){
    if(!starAt(x,y)||!misInRegion(x,y))continue;
    const S=getSystem(x,y);if(S&&S.station)list.push(S);
  }
  return {R,list};
}
TEST_SUITES.push(()=>suite("невязка: в уезде часы станций не сходятся, вне уезда — сходятся",()=>{
  resetWorld();
  const M=misTestRegion();ok(!!M&&M.list.length>=2,"в уезде «Расхождение времён» есть станции: "+(M?M.list.length:0));
  const offs=M.list.map(misStationOffset);
  ok(offs.every(o=>o!==0&&Math.abs(o)>=3&&Math.abs(o)<=9),"смещения ±3…9 мин: "+offs.join(", "));
  ok(new Set(offs).size>1,"и они разные");
  /* вне уезда — ноль */
  let out=null;
  for(let x=-12;x<=12&&!out;x++)for(let y=-12;y<=12&&!out;y++){if(starAt(x,y)&&!misInRegion(x,y)){const S=getSystem(x,y);if(S&&S.station)out=S;}}
  ok(!!out&&misStationOffset(out)===0,"вне уезда смещения нет");
  const C=misClockLine(M.list[0]);
  ok(C&&C.st!==C.sky,"строка доски: станция "+C.st+", по небу "+C.sky);
}));

TEST_SUITES.push(()=>suite("невязка: лента из уезда несёт метку, три ленты — фигура, ось по Кольцу",()=>{
  resetWorld();
  const M=misTestRegion();ok(!!M,"уезд есть");
  G.strips=[];
  const S=M.list[0];G.sx=S.sx;G.sy=S.sy;G.sys=S;
  const T=tapeInit();T.n=40;
  for(let i=0;i<3;i++){T.n=40;const s=tapeTear();ok(!!s&&s.fig===1,"лента "+(i+1)+" из уезда помечена");}
  eq(misFigureStrips().length,3,"три ленты уезда на руках");
  const ang=misFigureStrips()[0].ang;
  ok(Math.abs(ang-ringDir(S.sx,S.sy))<1e-3,"угол ленты — направление Кольца отсюда");
  /* вне уезда — без метки */
  G.sx=0;G.sy=0;G.sys=getSystem(0,0);T.n=40;
  const s0=tapeTear();ok(!!s0&&!s0.fig,"лента не из уезда — без метки");
  /* стол рисует фигуру */
  tableToggle(true,"strips");
  ok(!!document.querySelector("#loglist .thing canvas[width='520']"),"на столе фигура из трёх лент");
  ok(![...document.querySelectorAll("#loglist .thing .nm")].some(e=>/кольц|сигнал|объясн/i.test(e.textContent)),"и ни слова о том, что она значит");
  tableToggle(false);
  G.strips=[];
}));

TEST_SUITES.push(()=>suite("невязка: стойка в уезде отвечает отказом института на ленту",()=>{
  resetWorld();
  const M=misTestRegion();const S=M.list[0];
  G.sx=S.sx;G.sy=S.sy;G.sys=S;G.st=S.station;
  const r=putOnTable("strip",0);
  ok(r&&/неисправен/.test(r.line),"«прибор неисправен, замените ленту»");
  G.sx=0;G.sy=0;G.sys=getSystem(0,0);G.st=G.sys.station||null;
  const r2=misTableReply();
  eq(r2,null,"вне уезда отказа нет");
}));
