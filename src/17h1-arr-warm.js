/* ══════════════ прилёт заранее (24.10, телефон) ══════════════
   Прыжок мгновенный: первый кадр новой системы пёк всё, что у входа уже на глазах, — пост хозяина, корабль
   его жеста (пикет, буксир), свечение полосы, корпус на стапеле верфи — и стоял 16–32 мс на S23 (тестер,
   перепись прилёта, раунд 10; на ПК 7–29 мс, жест печётся синхронно). Всё это — функция системы, а не
   времени: пока на карте выбрана цель, до которой хватает прыжка (или поезд стоит у станции), её вещи пекутся
   по одной выпечке за кадр, и прилёт находит их в кэше. Картинка та же: те же кисти, те же ключи кэшей */
const ARRW={k:"",q:[],i:0};
function arrWarmAt(){
  if(G.mode==="map"&&G.sel&&!G.mapPeek)return mapJump().bad?null:[G.sel.x,G.sel.y];
  if(G.mode==="rail"&&RAIL_RIDE){const R=RAIL_RIDE,s=R.l.stops[R.seq[R.seg]];return s?[s.sx,s.sy]:null;}
  return null;
}
/* шаги — те же вызовы, что сделает кадр системы у входа; шаг вернул false — ещё печётся (мастер флота шагами) */
function arrWarmSteps(sx,sy){
  const sys=getSystem(sx,sy),S=sys.station,by=gestOwner(sx,sy),Q=[];
  if(by){
    const g={seed:hashi(sx,sy,0x6E57)>>>0},k=by==="gt"?"patrol":by==="ra"?"tug":null;
    Q.push(()=>{gestPostSprite(by,by==="gt"?GEST_POST.gt+gestPostNo(g):GEST_POST[by]);return true;});
    if(k){const f={k,seed:g.seed,by};Q.push(()=>!!fleetArtOf(f,true));}
  }
  if(S){
    const P=sysLane(sys),ty=S.stype||"trade",sb=S.by||"gt",seed=hashi(sys.seed|0,0x57B0,ty.length);
    if(P){Q.push(()=>{laneBuoySprite();return true;});Q.push(()=>{laneGlowSprite(laneLampCol(P.by));return true;});}
    /* сетка станции (её строит первый кадр) и корпус на стапеле — как bodyStation (17c2g) */
    Q.push(()=>{const m=h3dStationMesh(S,ty,sb,seed);
      if(m&&m.slip){const id="f"+(seed%92),h=hullOf(id);hullGpuBake(h,id,hullGpuSb(h,GPU.bw/W));}return true;});
  }
  return Q;
}
/* шаг кадра: готовое в кэше проходит подряд, новая выпечка — одна за кадр */
function arrWarmStep(sx,sy){
  if(!GPU.ok||!GPU.dev||GPU.lost)return;   /* кадр ещё не начат (GPU.on — внутри кадра): выпечке нужна только карта */
  const k=sx+","+sy;
  if(ARRW.k!==k){ARRW.k=k;ARRW.q=arrWarmSteps(sx,sy);ARRW.i=0;}
  const b0=GPU.bakeN|0;
  while(ARRW.i<ARRW.q.length){
    let r;try{r=ARRW.q[ARRW.i]();}catch(e){ARRW.i=ARRW.q.length;throw e;}   /* сломанный шаг — один раз в «СБОЙ», не каждый кадр */
    if(!r)return;
    ARRW.i++;
    if((GPU.bakeN|0)!==b0)return;
  }
}
function arrWarm(){const t=arrWarmAt();if(t)arrWarmStep(t[0],t[1]);}
