/* ══════════════ обломок после боя как корпус (G4c) ══════════════
   Был плоский тёмный диск с подписью «КОРПУС». Теперь это корпус того самого борта
   (побитая выпечка 12i по его sid), медленно кувыркается, кромки пробоин тлеют;
   подпись ушла в фишку у кромки — по тычку автопилот идёт к обломку. */
TEST_SUITES.push(()=>suite("обломок G4c: тот же корпус, медленное вращение",{tier:"node"},()=>{
  resetWorld();
  G.mode="system";G.pirates=[];G.npcWrecks=[];
  const p=npcShip(MAKER_KEYS[1],4,2,300,200,0);p.a=1.3;
  npcWreck(p);
  const w=G.npcWrecks[0];
  ok(!!w,"обломок лёг");
  eq(w.sid,p.shipId,"корпус тот же, что летал (sid)");
  eq(w.rank,2,"и ранг его — ключ выпечки");
  eq(w.a,1.3,"лежит, как погиб");
  const t0=G.t,P0=npcWreckPose(w);G.t=t0+60;const P1=npcWreckPose(w);G.t=t0;
  const sp=Math.abs(P1.a-P0.a);
  ok(sp>=.07&&sp<=.15,"оборот медленный: "+sp.toFixed(3)+" рад/с (оборот за 45–90 с)");
  eq(npcWreckPose(w).a,P0.a,"поза — от часов, а не от случая");
  eq(P0.shipId,p.shipId,"поза несёт корпус борта");
  ok(P0.hull/P0.hullMax<.5,"побитая выпечка (hp<.5)");
  eq(npcWreckPose({x:0,y:0,seed:77,by:"gt"}).shipId,"npgt77","без sid — адрес по seed и державе");
  resetWorld();
}));
TEST_SUITES.push(()=>suite("обломок G4c: подпись — фишка у кромки, тычок ведёт к нему",{tier:"browser"},()=>{
  if(!ok(GPU.ok,"видеокарта есть — без неё корпус не рисуется"))return;
  resetWorld();
  G.mode="system";G.ap=null;G.orbit=null;G.pirates=[];G.shots=[];G.msl=[];G.loot=[];
  const sh=G.ship;sh.x=9000;sh.y=-7000;sh.vx=0;sh.vy=0;G.zoom=2;G.zoomT=null;
  G.npcWrecks=[];
  const mk=(i,dx,dy)=>{const p=npcShip(MAKER_KEYS[i],i,1,sh.x+dx,sh.y+dy,0);npcWreck(p);return G.npcWrecks[G.npcWrecks.length-1];};
  const near=mk(0,40,30),far=mk(2,2600,900);mk(3,-4000,-3000);
  const body0=gpuPirateBody;let bodies=0;
  gpuPirateBody=function(){bodies++;return body0.apply(this,arguments);};
  const run0=G.running,loop0=LOOP_OFF;G.running=true;LOOP_OFF=false;
  try{frameBody(wallMs());}finally{gpuPirateBody=body0;G.running=run0;LOOP_OFF=loop0;}
  eq(bodies,1,"в кадре один обломок — один корпус светом звезды");
  const art=pirateArtOf(npcWreckPose(near).shipId,false,2,1,0);
  eq((art.holes||[]).length,2,"у выпечки обломка две крупные пробоины — по ним тлеет кромка");
  const lab=[...OVL.lab.keys()].filter(k=>String(k).startsWith("wk"));
  eq(lab.length,0,"подписи «КОРПУС» над обломком больше нет");
  const wc=SYS_CHIPS.filter(c=>c.t&&c.t.kind==="wreck");
  eq(wc.length,1,"одна фишка обломка — ближнего из тех, что за кадром");
  if(!wc.length){resetWorld();return;}
  eq(wc[0].t.ax,far.x,"фишка ведёт к ближнему за кадром, а не к видимому и не к дальнему");
  ok(/^Корпус · /.test(wc[0].l),"на фишке имя и расстояние: «"+wc[0].l+"»");
  ok(wc[0].h>=44,"фишка дотягивает до 44 px под палец");
  tap(wc[0].x+wc[0].w/2,wc[0].y+wc[0].h/2);
  ok(G.ap&&G.ap.kind==="wreck","тычок в фишку ставит автопилот к обломку");
  const T=targetPos();
  ok(T&&T.x===far.x&&T.y===far.y,"цель автопилота — точка обломка");
  resetWorld();
}));
