/* ══════════════ прилёт заранее (24.10, телефон) ══════════════
   Прыжок мгновенный: первый кадр новой системы пёк всё, что у входа уже на глазах, — пост хозяина, корабль
   его жеста (пикет, буксир), свечение полосы, корпус на стапеле верфи — и стоял 16–32 мс на S23 (тестер,
   перепись прилёта, раунд 10; на ПК 7–29 мс, жест печётся синхронно). Всё это — функция системы, а не
   времени: пока на карте выбрана цель, до которой хватает прыжка (или поезд стоит у станции), её вещи пекутся
   по одной выпечке за кадр, и прилёт находит их в кэше. Картинка та же: те же кисти, те же ключи кэшей.
   Корпуса классов у полосы (очередь, садящийся, уходящий — тела 17c2e) — выпечка и сетка с оснасткой: сетка на
   телефоне — десятки мс (тестер, раунд 11: 66 из 109 мс в кадрах 2–3 прилёта). Сетка в шаге — тоже тяжёлая работа
   кадра (H3D.mk), как выпечка. Корабль жеста рисуется тем же телом — и его сетка тоже (раунд 13: 17–27 мс в кадре 1).
   Камни пояса (17gc) — по камню за кадр. Сетка корпуса — шагами в ARRW_MS (h3dMeshPump): целиком она переносила
   рывок в кадры карты, 20–34 мс подряд на S23 (тестер, раунд 15) */
const ARRW={k:"",q:[],i:0},ARRW_MS=3;
function arrWarmAt(){
  if(G.mode==="map"&&G.sel&&!G.mapPeek)return mapJump().bad?null:[G.sel.x,G.sel.y];
  if(G.mode==="rail"&&RAIL_RIDE){const R=RAIL_RIDE,s=R.l.stops[R.seq[R.seg]];return s?[s.sx,s.sy]:null;}
  return null;
}
/* корпус класса телом (17c2e bodyFleet → hullGpuDraw): выпечка и сетка со своей оснасткой, по шагу на каждую */
function arrWarmHull(Q,id){const h=hullOf(id);
  Q.push(()=>{hullGpuBake(h,id,hullGpuSb(h,GPU.bw/W));return true;});
  Q.push(()=>!!h3dMeshPump(h,h3dStockGear(id),ARRW_MS));}
/* шаги — те же вызовы, что сделает кадр системы у входа; шаг вернул false — ещё печётся (мастер флота шагами),
   2 — сделал тяжёлое без выпечки и сетки (камень пояса): на этот кадр хватит */
function arrWarmSteps(sx,sy){
  const sys=getSystem(sx,sy),S=sys.station,by=gestOwner(sx,sy),Q=[];
  if(sys.belt)for(let k=0;k<SBELT_ROCKS;k++)Q.push(()=>{const B=sys.belt;if(!B.rm)B.rm=[];
    if(B.rm.length>k)return true;B.rm.push(sbeltRock(B,B.rm.length));return 2;});
  if(by){
    const g={seed:hashi(sx,sy,0x6E57)>>>0},k=by==="gt"?"patrol":by==="ra"?"tug":null;
    Q.push(()=>{gestPostSprite(by,by==="gt"?GEST_POST.gt+gestPostNo(g):GEST_POST[by]);return true;});
    if(k){const f={k,seed:g.seed,by},id=bodyFleetHull(f);Q.push(()=>!!fleetArtOf(f,true));if(id)arrWarmHull(Q,id);}
  }
  if(S){
    const P=sysLane(sys),ty=S.stype||"trade",sb=S.by||"gt",seed=hashi(sys.seed|0,0x57B0,ty.length);
    if(P){Q.push(()=>{laneBuoySprite();return true;});Q.push(()=>{laneGlowSprite(laneLampCol(P.by));return true;});}
    /* сетка станции (её строит первый кадр) и корпус на стапеле, выпечка и сетка — как bodyStation (17c2g) */
    Q.push(()=>{h3dStationMesh(S,ty,sb,seed);return true;});
    Q.push(()=>{const m=h3dStationMesh(S,ty,sb,seed);
      if(m&&m.slip){const id="f"+(seed%92),h=hullOf(id);hullGpuBake(h,id,hullGpuSb(h,GPU.bw/W));}return true;});
    Q.push(()=>{const m=h3dStationMesh(S,ty,sb,seed);
      if(!(m&&m.slip))return true;const id="f"+(seed%92);return !!h3dMeshPump(hullOf(id),h3dStockGear(id),ARRW_MS);});
    /* корпуса классов полосы — как bodyFleet → hullGpuDraw: выпечка тела и сетка со своей оснасткой (h3dStockGear) */
    if(P){const ids=new Set();for(const f of [...P.queue,P.dock,P.out]){const id=f&&bodyFleetHull(f);if(id)ids.add(id);}
      for(const id of ids)arrWarmHull(Q,id);}
  }
  return Q;
}
/* шаг кадра: готовое в кэше проходит подряд, новая выпечка или сетка — одна за кадр */
function arrWarmStep(sx,sy){
  if(!GPU.ok||!GPU.dev||GPU.lost)return;   /* кадр ещё не начат (GPU.on — внутри кадра): выпечке нужна только карта */
  const k=sx+","+sy;
  if(ARRW.k!==k){ARRW.k=k;ARRW.q=arrWarmSteps(sx,sy);ARRW.i=0;}
  const w0=(GPU.bakeN|0)+H3D.mk;
  while(ARRW.i<ARRW.q.length){
    let r;try{r=ARRW.q[ARRW.i]();}catch(e){ARRW.i=ARRW.q.length;throw e;}   /* сломанный шаг — один раз в «СБОЙ», не каждый кадр */
    if(!r)return;
    ARRW.i++;
    if(r===2||(GPU.bakeN|0)+H3D.mk!==w0)return;
  }
}
function arrWarm(){const t=arrWarmAt();if(t)arrWarmStep(t[0],t[1]);}
