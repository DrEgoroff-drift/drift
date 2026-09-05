/* ══════════════ автотесты: владения на карте (M348) ══════════════
   Пятно дома — станция и соседи в один прыжок; под трассой пираты не держатся;
   бирка перемены появляется только на настоящей перемене и гаснет за трое суток;
   слои ходят по кругу; карта со всем этим рисуется. */
TEST_SUITES.push(()=>suite("владения: пятно дома = станция и соседи в прыжок; слои по кругу; кадр рисуется",()=>{
  resetWorld();
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  G.mode="map";G.sel={x:G.sx,y:G.sy};G.mapView=null;G.mapZoom=1;G.mapLayer=null;
  const st=stat(),cell=mapCell(),V=mapViewC(),R=mapRange();
  const vis=[];
  for(let gy=-R;gy<=R;gy++)for(let gx=-R;gx<=R;gx++){if(!starAt(gx,gy))continue;
    vis.push({gx,gy,s:getSystem(gx,gy),x:W/2+gx*cell,y:H/2+gy*cell,d:Math.hypot(gx,gy),near:Math.hypot(gx,gy)<=st.jump+.02});}
  const P=mapHousePatch(vis,st);
  const keys=Object.keys(P);
  ok(keys.length>0,"пятна домов есть ("+keys.length+" клеток)");
  let bad=0;
  for(const k of keys){
    const [gx,gy]=k.split(",").map(Number);
    const near=vis.some(v=>v.s.station&&houseOf(v.s)&&Math.abs(v.gx-gx)<=1&&Math.abs(v.gy-gy)<=1&&P[k].indexOf(houseOf(v.s).id)>=0);
    if(!near)bad++;
  }
  eq(bad,0,"каждая клетка пятна — станция дома или её сосед в один прыжок");
  ok(keys.every(k=>P[k].length<=HOUSES.length&&new Set(P[k]).size===P[k].length),"дом в клетке не повторяется");
  /* слои */
  eq(mapLayer(),"all","по умолчанию — все слои");
  ok(mapLayerOn("own")&&mapLayerOn("prices")&&mapLayerOn("rumours"),"и все включены");
  mapLayerNext();eq(mapLayer(),"own","один шаг — владения");
  ok(mapLayerOn("own")&&!mapLayerOn("prices"),"цены выключены");
  mapLayerNext();mapLayerNext();mapLayerNext();eq(mapLayer(),"all","круг замкнулся");
  ok(/СЛОИ/.test(mapLayerRu()),"кнопка называет слой");
  /* кадр со всем: своё, пираты, дом */
  G.occ={};occSet(G.sx+2,G.sy,2);
  G.bases[G.sx+","+G.sy+"|0"]={sx:G.sx,sy:G.sy,idx:0,name:"т",type:"terran"};
  ok(mapOwnHere(G.sx,G.sy),"своя база — своё");
  let err="";try{for(let i=0;i<3;i++)drawMap();}catch(e){err=e.message+" "+String(e.stack||"").split("\\n")[1];}
  eq(err,"","карта с владениями рисуется");
  G.occ={};G.bases={};G.mode="system";G.mapLayer=null;
}));

TEST_SUITES.push(()=>suite("владения: под трассой пираты не держатся; бирка перемены — только на перемене",()=>{
  resetWorld();
  /* станция с флотом: рунг ≥ 5 — подменяем ступень, как делает стенд */
  const r0=rungOf;
  const now0=Date.now;
  try{
    let T=Date.now();Date.now=()=>T;
    rungOf=()=>6;
    const S=nearestStation(0,0);
    ok(mapUnderTrassa(S.sx,S.sy),"станция шестой ступени — под трассой");
    G.occ={};occSet(S.sx,S.sy,3);
    G.occT=T;
    /* каждый такт занятости берёт случайную занятую систему — она одна */
    for(let i=0;i<8&&occLvl(S.sx,S.sy);i++){T+=OCC_PERIOD+1;occTick();}
    eq(occLvl(S.sx,S.sy),0,"за несколько тактов занятость под трассой сошла на нуль");
    /* и не занимают: соседний очаг не ползёт на трассу */
    rungOf=r0;
    G.occ={};
    let nb=null;for(let dx=-1;dx<=1&&!nb;dx++)for(let dy=-1;dy<=1&&!nb;dy++){if(!dx&&!dy)continue;if(starAt(S.sx+dx,S.sy+dy))nb=[S.sx+dx,S.sy+dy];}
    if(nb){
      rungOf=(sx,sy)=>(sx===S.sx&&sy===S.sy)?6:0;
      occSet(nb[0],nb[1],OCC_MAX);G.occT=T;
      for(let i=0;i<30;i++){T+=OCC_PERIOD+1;occTick();}
      eq(occLvl(S.sx,S.sy),0,"тридцать тактов — трасса не занята");
    }else ok(true,"у станции нет соседей — расползание не меряем");
    rungOf=r0;
    /* бирка: только где записана перемена, гаснет за трое суток */
    G.newsMarks={};
    eq(mapTagAt(3,3,T),null,"без записи бирки нет");
    newsMark("3,3","цены сдвинулись","#f2b25c");
    eq(mapTagAt(3,3,T),null,"цены — не перемена хозяина");
    newsMark("3,3","сменился хозяин","#7fe6d8");
    const tg=mapTagAt(3,3,T);
    ok(!!tg&&/сменился хозяин/.test(tg.ru)&&/сегодня/.test(tg.ru),"бирка «сменился хозяин · сегодня»");
    const t2=mapTagAt(3,3,T+2*86400e3);
    ok(!!t2&&/2 дня/.test(t2.ru)&&t2.a<tg.a,"через двое суток — «2 дня назад», бледнее");
    eq(mapTagAt(3,3,T+3*86400e3+1),null,"через трое суток бирки нет");
  }finally{rungOf=r0;Date.now=now0;}
  G.occ={};G.newsMarks={};
}));
