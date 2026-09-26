/* ══════════════ обжитой дом ══════════════ */
/* Дом перестаёт быть картинкой с кнопками сбоку: по вещам можно ткнуть, в
   жилой части сидят люди, домочадец говорит ровно раз на ступень. */
TEST_SUITES.push(()=>suite("дом: по вещам можно ткнуть",()=>{
  resetWorld();
  G.home=homeInit();G.home.tier=8;G.home.sx=G.sx;G.home.sy=G.sy;
  /* сцена рисуется в отдельную канву — как в экране станции */
  const cn=document.createElement("canvas");
  cn.width=Math.round(homeRoomW()*1.5);cn.height=Math.round(HOME_ROOM_H*1.5);
  drawHomeRoom(cn);
  ok(HOME_HIT.length>=4,"у обжитого дома есть зоны нажатия: "+HOME_HIT.length);
  for(const z of HOME_HIT){
    ok(z.w>=40,"зона «"+z.id+"» крупная, в неё попадают пальцем: "+z.w);
    ok(!!z.ru,"у зоны «"+z.id+"» есть человеческое имя");
  }
  /* зоны не наезжают друг на друга: ступени стоят слева направо */
  const srt=HOME_HIT.slice().sort((a,b)=>a.x-b.x);
  for(let i=1;i<srt.length;i++)
    ok(srt[i].x>=srt[i-1].x+srt[i-1].w-5,"зоны «"+srt[i-1].id+"» и «"+srt[i].id+
       "» не наложены друг на друга");
  /* попадание считается тем же переводом, что рисунок */
  const z0=HOME_HIT[0];
  const hit=homeHitAt((z0.x+z0.w*.5)*HOME_VIEW.k+HOME_VIEW.pad,(z0.y+z0.h*.5)*HOME_VIEW.k);
  ok(!!hit,"середина зоны попадает в неё же");
  ok(!homeHitAt(-50,-50),"мимо комнаты не попадает никуда");

  /* ── дом ниже ступени не выдаёт зон, которых в нём нет ── */
  G.home.tier=2;
  drawHomeRoom(cn);
  ok(!HOME_HIT.some(z=>z.id==="garage"),"без гаража нет и зоны гаража");

  /* ── домочадец: ровно раз на ступень ── */
  G.home.tier=5;G.home.mateTier=0;
  ok(!!homeMateKind(),"на новой ступени домочадцу есть что сказать");
  ok(!!homeMateName(),"и у него есть имя");
  const kind=homeMateTake();
  ok(!!kind,"он отдал своё");
  eq(homeMateKind(),null,"и на этой ступени больше не заговорит");
  eq(homeMateTake(),null,"повторно взять нельзя");
  G.home.tier=6;
  ok(!!homeMateKind(),"на следующей ступени — снова один раз");
  /* перезагрузка не превращает его в кран */
  G.home.mateTier=6;
  applySave(snapshot());
  eq(G.home.mateTier,6,"после сохранения он помнит, что уже говорил");
  eq(homeMateKind(),null,"и молчит");

  /* ── люди дома видны ── */
  resetWorld();
  G.home=homeInit();G.home.tier=7;
  const c2=document.createElement("canvas");
  c2.width=Math.round(homeRoomW()*1.5);c2.height=Math.round(HOME_ROOM_H*1.5);
  drawHomeRoom(c2);                       // пустая жилая часть рисуется без ошибок
  ok(HOME_HIT.some(z=>z.id==="living"),"жилая часть — зона");
  G.crew.push(Object.assign(genMerc(hashi(1,2,3)),{order:null,morale:.2,
    tMs:now(),paidMs:now()}));
  const cr=G.crew[0];
  ok(!!cr,"наёмник дома есть");
  /* комната печётся кистями на GPU-холсте (27e), 2D-вызовов нет: считаются мазки самого холста */
  const brush=f=>{let n=0;const P=GcCtx.prototype,o={};
    for(const k of ["fill","stroke","fillRect","strokeRect","drawImage"]){o[k]=P[k];P[k]=function(){n++;return o[k].apply(this,arguments);};}
    try{f();}finally{Object.assign(P,o);}return n;};
  G.crew.length=0;const n0=brush(()=>drawHomeRoom(c2));
  G.crew.push(cr);const n1=brush(()=>drawHomeRoom(c2));   // поникший рисуется своей позой
  ok(n1-n0>10,"поникший наёмник рисуется: мазков кистей "+(n1-n0));
}));
/* комната дома на движке (26.09): выпечка теми же кистями на холсте webgpu, 2D-корпуса в гараже нет;
   зоны нажатия — те же, что даёт запись без видеокарты */
TEST_SUITES.push(()=>suite("дом: комната печётся на движке, 2D-корпуса нет",{tier:"browser"},()=>{
  resetWorld();
  G.home=homeInit();G.home.tier=8;G.home.sx=G.sx;G.home.sy=G.sy;
  const cn=document.createElement("canvas");
  cn.width=Math.round(homeRoomW()*1.5);cn.height=Math.round(HOME_ROOM_H*1.5);
  if(!GPU.ok||!GPU.dev){drawHomeRoom(cn);ok(HOME_HIT.length>=4,"без видеокарты зоны есть: "+HOME_HIT.length);return;}
  const miss=GC_MISS.length,dh=drawHull;let nh=0;
  window.drawHull=function(){nh++;return dh.apply(this,arguments);};
  let hit;
  try{drawHomeRoom(cn);hit=JSON.stringify(HOME_HIT);}finally{window.drawHull=dh;}
  eq(nh,0,"корабль в гараже — кисти тела в выпечке, drawHull не зовётся");
  eq(GC_MISS.length,miss,"в кистях комнаты нет того, чего холст движка не умеет");
  ok(!!HOME_BK,"выпечка комнаты есть");
  eq(cn.getContext("2d"),null,"у холста комнаты нет 2D-контекста");
  /* та же комната без видеокарты — запись GcCtx: зоны до числа те же */
  const W2=homeRoomW(),k=Math.min(cn.width/W2,2.2),pad=Math.max(0,(cn.width-W2*k)/2);
  HOME_HIT=[];const g=new GcCtx(cn.width,cn.height,1),prev=ctx;ctx=g;
  try{g.translate(pad,0);g.scale(k,k);homeRoomBody(g,W2,cn.height/k);}finally{ctx=prev;}
  eq(JSON.stringify(HOME_HIT),hit,"зоны нажатия — те же, что у записи без видеокарты");
}));
