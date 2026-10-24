/* ══════════════ прилёт заранее (24.10, телефон) ══════════════ */
/* 17h1: пока на карте выбрана цель прыжка, пост хозяина, корабль его жеста, свечение полосы и корпус на стапеле
   пекутся по одной выпечке за кадр, и кадр прилёта находит их в кэше. Прежде первый кадр системы допекал их на
   глазах: жест — синхронно, 16–32 мс на S23 (тестер, раунд 10). Сетки корпусов классов полосы — так же, по одной
   (раунд 11: 66 из 109 мс кадров 2–3 прилёта) */
TEST_SUITES.push(()=>suite("прилёт заранее: вещи у входа испечены до прыжка",{tier:"browser"},()=>{
  if(!ok(GPU.ok&&!!GPU.dev,"видеокарта поднялась"))return;
  resetWorld();G.mode="system";ARRW.k="";   /* очередь прогрева — заново: прежняя сьюта могла греть ту же цель */
  let t=null;
  for(let r=1;r<=24&&!t;r++)for(let x=-r;x<=r&&!t;x++)for(let y=-r;y<=r;y++){
    if(Math.max(Math.abs(x),Math.abs(y))!==r||x===G.sx&&y===G.sy)continue;
    const q=getSystem(x,y),by=q.station?gestOwner(x,y):null,P=by&&sysLane(q);
    if((by==="gt"||by==="ra")&&P&&P.queue.length){t={x,y,by};break;}}
  if(!ok(!!t,"станция с пикетом или буксиром и очередью у дока нашлась"))return;
  /* прогрев идёт кадрами здешней системы: мастер флота печётся шагами, по выпечке в кадр */
  let n=0,mx=0,sum=0;
  for(;n<200;n++){const b0=(GPU.bakeN|0)+H3D.mk;arrWarmStep(t.x,t.y);const d=(GPU.bakeN|0)+H3D.mk-b0;mx=Math.max(mx,d);sum+=d;
    if(ARRW.k===t.x+","+t.y&&ARRW.i>=ARRW.q.length)break;drawWorld();}
  ok(ARRW.i>=ARRW.q.length&&ARRW.q.length>=6,"прогрев дошёл до конца ("+ARRW.i+" шагов из "+ARRW.q.length+" за "+n+" кадров)");
  ok(sum>0&&mx<=2,"прогрев печёт по одной вещи за кадр (выпечек и сеток "+sum+", в кадре до "+mx+")");
  const g={seed:hashi(t.x,t.y,0x6E57)>>>0},post=t.by==="gt"?GEST_POST.gt+gestPostNo(g):GEST_POST[t.by];
  const P0=GEST_POST_CV.get(t.by+"|"+post);
  ok(!!P0,"пост хозяина испечён до прыжка");
  ok(!!artGet(FLEET_ART,"fl"+(t.by==="gt"?"patrol":"tug")+g.seed+"!"+t.by),"корабль жеста испечён до прыжка");
  const L=sysLane(getSystem(t.x,t.y)),gid=bodyFleetHull({k:t.by==="gt"?"patrol":"tug",seed:g.seed,by:t.by});
  const ids=[...new Set(L.queue.map(bodyFleetHull).concat(gid))];
  ok(ids.every(id=>{const C4=H3D.MG.get(hullOf(id));return !!(C4&&C4.has(h3dStockGear(id).sig));}),
    "сетки корпусов очереди и корабля жеста собраны до прыжка ("+ids.join(" ")+")");
  /* прилёт: первые кадры не допекают ничего синхронно и не строят сеток, пост — тот же */
  const s0=PB_SYNC,m0=H3D.mk;
  arriveSystem(t.x,t.y,{cost:0});
  for(let i=0;i<3;i++)drawWorld();
  eq(PB_SYNC-s0,0,"кадры прилёта ничего не допекают на глазах");
  eq(H3D.mk-m0,0,"кадры прилёта не строят сеток корпусов");
  ok(GEST_POST_CV.get(t.by+"|"+post)===P0,"пост прилёта — испечённый заранее");
}));
/* 12ai1: борт полосы рисуется телом (или огоньком), мастер картинки ему не нужен — печётся шагом, на случай, когда
   борт гаснет у дока. Прежде мастер пекли до тела, и кадр прилёта к людной станции допекал на глазах мастера всей
   очереди: 14–18 выпечек (ПК, 24.10) */
TEST_SUITES.push(()=>suite("борт телом: мастер картинки не печётся на глазах",{tier:"browser"},()=>{
  if(!ok(GPU.ok&&!!GPU.dev,"видеокарта поднялась"))return;
  resetWorld();G.mode="system";
  let t=null;
  for(let r=1;r<=24&&!t;r++)for(let x=-r;x<=r&&!t;x++)for(let y=-r;y<=r;y++){
    if(Math.max(Math.abs(x),Math.abs(y))!==r)continue;
    const q=getSystem(x,y),P=q.station&&sysLane(q);
    if(P&&P.queue.length>=3){t={x,y};break;}}
  if(!ok(!!t,"людная станция с очередью у дока нашлась"))return;
  arriveSystem(t.x,t.y,{cost:0});
  const P=sysLane(G.sys),Q=P.queue,key=f=>"fl"+f.k+f.seed+"!"+(f.by||"gt");
  for(const f of Q)f.seed=(f.seed^0x5EED1)>>>0;   /* свежие мастера: прежние сьюты могли испечь эти */
  const had=()=>Q.filter(f=>artGet(FLEET_ART,key(f))).length;
  const sh=G.ship;sh.x=P.hx;sh.y=P.hy;sh.vx=sh.vy=0;G.ap=null;G.orbit=null;G.zoom=1;G.zoomT=null;
  eq(had(),0,"мастеров очереди в кэше нет");
  drawWorld();
  ok(had()<=1,"кадр с очередью на экране не допекает мастера всех бортов ("+had()+" из "+Q.length+")");
  let n=0;for(;n<400&&had()<Q.length;n++)drawWorld();
  eq(had(),Q.length,"мастера бортов допеклись шагом за "+n+" кадров");
}));
/* 17gc: двенадцать камней пояса строятся на карте по одному, и кадр прилёта берёт готовые */
TEST_SUITES.push(()=>suite("прилёт заранее: камни пояса",{tier:"browser"},()=>{
  if(!ok(GPU.ok&&!!GPU.dev,"видеокарта поднялась"))return;
  resetWorld();G.mode="system";ARRW.k="";   /* очередь прогрева — заново: прежняя сьюта могла греть ту же цель */
  let t=null;
  for(let r=1;r<=24&&!t;r++)for(let x=-r;x<=r&&!t;x++)for(let y=-r;y<=r;y++){
    if(Math.max(Math.abs(x),Math.abs(y))!==r||x===G.sx&&y===G.sy)continue;
    const q=getSystem(x,y);if(q.belt){t={x,y,q};break;}}
  if(!ok(!!t,"система с поясом нашлась"))return;
  const B=t.q.belt;B.rm=null;
  let n=0,mx=0;
  for(;n<200;n++){const k0=B.rm?B.rm.length:0;arrWarmStep(t.x,t.y);mx=Math.max(mx,(B.rm?B.rm.length:0)-k0);
    if(ARRW.k===t.x+","+t.y&&ARRW.i>=ARRW.q.length)break;drawWorld();}
  eq(B.rm&&B.rm.length,SBELT_ROCKS,"камни пояса построены до прыжка за "+n+" кадров");
  eq(mx,1,"по камню за кадр");
  const R0=B.rm.slice();
  arriveSystem(t.x,t.y,{cost:0});
  G.ship.x=Math.cos(.7)*B.orbit;G.ship.y=Math.sin(.7)*B.orbit;G.zoom=1;G.zoomT=null;
  for(let i=0;i<3;i++)drawWorld();
  ok(G.sys.belt===B&&B.rm.length===SBELT_ROCKS&&B.rm.every((m,i)=>m===R0[i]),"кадры прилёта берут камни, построенные на карте");
}));
