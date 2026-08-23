/* ══════════════ тихий уезд: никто не грабит, журнал молчит, лента ровная, суток прошло больше ══════════════ */
TEST_SUITES.push(()=>suite("тихий уезд: без пиратов и износа, журнал и лента молчат в ядре, на отлёте счёт суток, дверь открыта",()=>{
  resetWorld();
  const at=regionOfTheme("quiet");ok(!!at,"область расставлена");
  const R=regionAt(at.rx*REGION_SPAN,at.ry*REGION_SPAN);
  eq(R.needle,"radio","прибор — приёмник");
  /* окраина: пиратов нет, износа нет */
  let edge=null;
  for(let x=at.rx*REGION_SPAN;x<(at.rx+1)*REGION_SPAN&&!edge;x++)for(let y=at.ry*REGION_SPAN;y<(at.ry+1)*REGION_SPAN&&!edge;y++)
    if(starAt(x,y)&&!(x===R.core.sx&&y===R.core.sy))edge={x,y};
  if(edge){
    G.sx=edge.x;G.sy=edge.y;G.sys=getSystem(G.sx,G.sy);G.mode="system";G.running=true;
    eq(quietDepthHere(),1,"окраина");
    spawnPirates();eq(G.pirates.length,0,"никто не грабит");
    G.wear={};wearTick(100);eq(wearOf(),0,"машины не ломаются");
    ok(!quietMute(),"на окраине журнал пишет");
  }
  /* ядро: журнал молчит, лента ровная */
  G.sx=R.core.sx;G.sy=R.core.sy;G.sys=getSystem(G.sx,G.sy);G.mode="system";G.running=true;
  eq(quietDepthHere(),2,"ядро");ok(quietMute(),"журнал молчит");
  G.log=[];logAdd("dim","проверка");eq(G.log.length,0,"строка не записалась");
  const T=tapeInit();T.zero=null;tapeSample();tapeSample();
  let flat=true;for(let i=0;i<TAPE_PENS;i++){const o=((T.head-1+TAPE_N)%TAPE_N)*TAPE_PENS;if(T.col[o+i]!==128)flat=false;}
  ok(flat,"самописец чертит ровную линию");
  G.st=G.sys.station;const d=quietDock();ok(d&&/не помнит/.test(d.line),"колония ничего не скрывает");
  ok(quietStay(),"остались");ok(!quietStay(),"второй раз не нужно");
  ok(/Дверь открыта/.test(quietDock().line),"дверь открыта");
  /* отлёт: прошло больше суток, чем прожито, топливо ушло */
  const t0=G.t,f0=G.fuel=80;const days=quietLeave();
  ok(days>=3&&days<8,"прошло "+days+" суток");ok(G.t-t0>=CEL_DAY*3,"время ушло вперёд");ok(G.fuel<f0,"топлива меньше");
  G.sx=0;G.sy=0;G.sys=getSystem(0,0);G.log=[];quietAfterLeave();
  ok(G.log.length===1&&/суток/.test(G.log[0].s),"снаружи журнал это записал");
  eq(quietLeave(),0,"дома отлёт обычный");
  const s=snapshot();applySave(s);eq(G.quiet.stay,1,"«да» помнится");
}));
