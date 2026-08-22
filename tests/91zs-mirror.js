/* ══════════════ зеркало: эхо на окраине, наслоение в ядре, пеленг в никуда ══════════════ */
TEST_SUITES.push(()=>suite("зеркало: фраза не выдумывается, эхо через 37 секунд, пеленг один и недостижим",()=>{
  resetWorld();
  const at=regionOfTheme("mirror");ok(!!at,"область зеркала расставлена");
  const R=regionAt(at.rx*REGION_SPAN,at.ry*REGION_SPAN);
  eq(R.needle,"radio","прибор зеркала — приёмник");
  /* окраина: сектор в области с глубиной >0, но не ядро */
  let edge=null;
  for(let x=at.rx*REGION_SPAN;x<(at.rx+1)*REGION_SPAN&&!edge;x++)for(let y=at.ry*REGION_SPAN;y<(at.ry+1)*REGION_SPAN&&!edge;y++)
    if(starAt(x,y)&&regionDepth(x,y)>0&&!(x===R.core.sx&&y===R.core.sy))edge={x,y};
  ok(!!edge,"на окраине есть система внутри склона");
  G.sx=edge.x;G.sy=edge.y;G.sys=getSystem(G.sx,G.sy);G.mode="system";G.running=true;
  eq(mirrorDepthHere(),1,"мы на окраине зеркала");
  G.log=[];G.etherT=1;etherTick(1);
  eq(G.log.length,1,"эфир сказал строку");
  const line=G.log[0].s;
  ok(!!G.mirrorEcho&&G.mirrorEcho.line===line,"эхо заряжено той же строкой");
  G.t+=MIRROR_DELAY-1;mirrorEchoTick();eq(G.log.length,1,"до срока тишина");
  G.t+=1;mirrorEchoTick();ok(G.log.length>=2&&G.log[1].s===line,"через 37 секунд — слово в слово");
  ok(!G.mirrorEcho,"эхо отзвучало");
  /* вне области эха нет */
  G.sx=0;G.sy=0;G.sys=getSystem(0,0);G.log=[];G.etherT=1;etherTick(1);
  ok(!G.mirrorEcho,"в начале координат эха нет");
  /* улетели — эхо пропало */
  G.sx=edge.x;G.sy=edge.y;G.sys=getSystem(G.sx,G.sy);G.etherT=1;etherTick(1);ok(!!G.mirrorEcho,"снова заряжено");
  G.sx=0;G.sy=0;G.sys=getSystem(0,0);G.t+=MIRROR_DELAY;mirrorEchoTick();ok(!G.mirrorEcho,"сменили систему — эхо не догоняет");
  /* ядро: находка есть всегда и не берётся */
  G.sx=R.core.sx;G.sy=R.core.sy;G.sys=getSystem(G.sx,G.sy);
  eq(mirrorDepthHere(),2,"мы в ядре");
  const f=findsHere().find(x=>x.k==="echo");ok(!!f,"в ядре лежит зеркало");
  ok(!!FIND_KINDS.echo,"вид находки описан");
  G.log=[];const n0=loreMarks().length;
  const t1=findTake(f);
  ok(!findSeen(f),"зеркало не помечается взятым");
  const pool=MIRROR_CORE.concat(ETHER);
  const said=G.log.map(e=>e.s).filter(s=>s[0]==="…");ok(said.length>=2,"наслоение: не меньше двух строк");
  ok(said.every(s=>pool.indexOf(s)>=0),"ни одна фраза не выдумана");
  ok(t1.indexOf("тридцать семь")>=0,"всегда тридцать семь секунд");
  eq(loreMarks().length,n0+1,"пеленг дан — метка на карте");
  const m=loreMarks()[loreMarks().length-1];ok(Math.hypot(m.sx,m.sy)>100,"и до него не долететь ("+Math.hypot(m.sx,m.sy).toFixed(0)+" сект.)");
  findTake(f);eq(loreMarks().length,n0+1,"пеленг только один");
  eq(G.mirror.bearing,1,"факт пеленга хранится");
  const s=snapshot();applySave(s);eq(G.mirror.bearing,1,"и переживает сейв");
  /* и ни одна из обычных систем не получает зеркала */
  ok(!findsIn(getSystem(0,0)).some(x=>x.k==="echo"),"в начале координат зеркала нет");
}));
