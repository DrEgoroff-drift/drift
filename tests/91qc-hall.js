/* ══════════════ зал за экранами (M810) ══════════════ */
/* Каждый тип станции (и блошинец) имеет зал и убранство; у каждого раздела есть место камеры;
   сцена любого типа укладывается в пределы движка (экземпляры, части, лампы, тени) и держит
   ключ над хозяином первым; наезд камеры приходит к цели; ?hall=0 не трогает DOM.
   Настоящий G, настоящая раскладка и сетка зала — видеокарта не нужна. */
TEST_SUITES.push(()=>suite("зал станции",()=>{
  resetWorld();
  const types=ST_TYPES.map(t=>t.id).concat(["bazaar"]);
  for(const id of types){
    ok(!!HALL_TYPES[id],"у типа «"+id+"» есть зал");
    ok(!!HALL_DRESS[id],"у типа «"+id+"» есть убранство");
  }
  for(const g of ST_GROUPS.map(x=>x.id).concat(["site"]))ok(!!HALL_CAMS[g],"у раздела «"+g+"» есть место камеры");
  /* стройка — своё место у окна (участок), остальные вкладки — к месту своего раздела */
  for(const g of ST_GROUPS)for(const t of g.tabs)eq(hallPlaceOf(t),t==="site"?"site":g.id,"вкладка «"+t+"» ведёт камеру к своему месту");

  const cam=hallCam(HALL_CAMS.trade,1280,720,true);
  for(const id of types){
    const L=hallLayout(id);L.room=hallRoomMesh(L);
    ok(L.room&&L.room.v&&L.room.v.length>0,"«"+id+"»: сетка зала собрана");
    const S=hallScene(L,cam,1.5),lim=hallLimits(S);
    ok(lim.inst<=R3_MAXI,"«"+id+"»: экземпляров "+lim.inst+" ≤ "+R3_MAXI);
    ok(lim.parts<=R3_PART,"«"+id+"»: частей "+lim.parts+" ≤ "+R3_PART);
    ok(lim.lamps<=R3_MAXL,"«"+id+"»: ламп "+lim.lamps+" ≤ "+R3_MAXL);
    ok(lim.shadow<=R3_SH,"«"+id+"»: теней "+lim.shadow+" ≤ "+R3_SH);
    const k=S.lights[0];
    ok(k&&k.shadow&&Math.abs(k.p[0]-HALL_KEYX)<1e-6,"«"+id+"»: первый свет — ключ над хозяином, с тенью");
    eq(L.people[0].kind,"keep","«"+id+"»: хозяин стоит за стойкой");
    ok(S.lights.every(l=>l.c.every(Number.isFinite)&&l.p.every(Number.isFinite)),"«"+id+"»: свет без NaN");
  }

  /* мерило «Сцены»: человек на месте раздела — .18–.23 высоты кадра ПК; поле одно на любой ширине */
  for(const p of Object.keys(HALL_CAMS)){
    const c=HALL_CAMS[p],pa=HALL_PILOT_AT[p];
    ok(c.fy>.8&&c.fy<=1.35,"место «"+p+"»: поле "+c.fy+" рад");
    if(!pa)continue;
    const k=hallManK(hallCam(c,1920,1080,true),pa[0],pa[1],1080),k2=hallManK(hallCam(c,2560,1080,true),pa[0],pa[1],1080);
    ok(k>=.18&&k<=.23,"место «"+p+"»: пилот "+k.toFixed(3)+" высоты кадра");
    ok(Math.abs(k-k2)<.005,"место «"+p+"»: доля человека не зависит от ширины окна");
  }
  {const L=hallLayout("trade"),k0=L.people[0],k=hallManK(hallCam(HALL_CAMS.trade,1920,1080,true),k0.x,k0.z,1080);
    ok(k>=.18&&k<=.23,"хозяин стойки — "+k.toFixed(3)+" высоты кадра");}
  /* пилот занимает место в пределах движка; ночь слушается стенда */
  {const was=HALL.place;HALL.place="trade";
    for(const id of types){const L=hallLayout(id);L.room=hallRoomMesh(L);
      const lim=hallLimits(hallScene(L,hallCam(HALL_CAMS.trade,1920,1080,true),1.5));
      ok(lim.inst<=R3_MAXI,"«"+id+"» с пилотом: экземпляров "+lim.inst+" ≤ "+R3_MAXI);}
    HALL.place=was;}
  {const was=HALL.night;HALL.night=1;eq(hallNight(),1,"?hallnight=1 — ночь");HALL.night=0;eq(hallNight(),0,"?hallnight=0 — день");HALL.night=was;}

  /* наезд: от двери к месту, к концу — ровно цель */
  hallGo("board",true);
  const end=hallGlideAt(HALL.g0+HALL.gd+50),c=HALL_CAMS.board;
  eq(end.k,1,"наезд доходит до конца");
  ok(end.eye.every((v,i)=>Math.abs(v-c.eye[i])<1e-9)&&end.tgt.every((v,i)=>Math.abs(v-c.tgt[i])<1e-9),"и стоит ровно на месте доски");
  const mid=hallGlideAt(HALL.g0+HALL.gd/2);
  ok(mid.k>0&&mid.k<1,"в середине наезда камера в пути (k="+mid.k.toFixed(2)+")");
  HALL.from=HALL.to=null;

  /* ?hall=0: прежний стол — ни класса, ни холста */
  const was=HALL.on;HALL.on=false;HALL.cn=null;
  hallOpen();
  ok(!HALL.open&&!HALL.cn,"с выключенным залом hallOpen ничего не открывает");
  HALL.on=was;
}));
