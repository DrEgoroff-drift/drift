/* ══════════════ автотесты: домино (M166) ══════════════ */
TEST_SUITES.push(()=>suite("домино: три хода, подходящая кость, исходы и ставка",()=>{
  resetWorld();
  G.log=[];G.inv=[];
  const D=dominoStart("Штоф");
  eq(D.hand.length,3,"рука из трёх костей");
  eq(dominoStart("Штоф").chain.join(","),D.chain.join(","),"пересдача в тот же день — та же рука");
  let guard=0;
  while(!DOM_GAME.over&&guard++<10){
    const i=DOM_GAME.hand.findIndex(t=>dominoFits(t,dominoEnd()));
    dominoMove(i>=0?i:-1);
  }
  ok(DOM_GAME.over===1,"партия кончилась за три хода");
  ok(DOM_GAME.line.length>0,"соперник сказал итог");
  ok(G.log.some(x=>x.k==="talk"&&x.s.indexOf("Штоф")===0),"итог — в ЛЮДИ");
  /* выигрыш платит слухом или частью, проигрыш — ничем */
  if(DOM_GAME.me>DOM_GAME.him)ok(G.inv.length>0||G.log.some(x=>/слух/.test(x.s)),"ставка получена");
  else eq(G.inv.length,0,"проигрыш ничего не стоит");
  DOM_GAME=null;
}));

TEST_SUITES.push(()=>suite("домино: с Вегой любой исход — ссора; шахматы стоят после шестой",()=>{
  resetWorld();
  G.home=homeInit();G.home.tier=7;G.home.sx=G.sx;G.home.sy=G.sy;G.wishDevice=1;vegaWish("love");
  G.log=[];
  dominoStart("Вега");
  let guard=0;
  while(!DOM_GAME.over&&guard++<10){const i=DOM_GAME.hand.findIndex(t=>dominoFits(t,dominoEnd()));dominoMove(i>=0?i:-1);}
  ok(/ссор/i.test(DOM_GAME.line),"итог с Вегой — ссора: "+DOM_GAME.line);
  storySeen()["sixth_report.t4"]=1;
  ok(sixthGone(),"шестая улетела — доска стоит (проверяется блоком)");
  delete storySeen()["sixth_report.t4"];
  DOM_GAME=null;G.vega=null;
}));
