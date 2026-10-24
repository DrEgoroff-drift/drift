/* ══════════════ прилёт заранее (24.10, телефон) ══════════════ */
/* 17h1: пока на карте выбрана цель прыжка, пост хозяина, корабль его жеста, свечение полосы и корпус на стапеле
   пекутся по одной выпечке за кадр, и кадр прилёта находит их в кэше. Прежде первый кадр системы допекал их на
   глазах: жест — синхронно, 16–32 мс на S23 (тестер, раунд 10) */
TEST_SUITES.push(()=>suite("прилёт заранее: вещи у входа испечены до прыжка",{tier:"browser"},()=>{
  if(!ok(GPU.ok&&!!GPU.dev,"видеокарта поднялась"))return;
  resetWorld();G.mode="system";
  let t=null;
  for(let r=1;r<=24&&!t;r++)for(let x=-r;x<=r&&!t;x++)for(let y=-r;y<=r;y++){
    if(Math.max(Math.abs(x),Math.abs(y))!==r||x===G.sx&&y===G.sy)continue;
    const q=getSystem(x,y),by=q.station?gestOwner(x,y):null;
    if(by==="gt"||by==="ra"){t={x,y,by};break;}}
  if(!ok(!!t,"станция с пикетом или буксиром нашлась"))return;
  /* прогрев идёт кадрами здешней системы: мастер флота печётся шагами, по выпечке в кадр */
  let n=0,mx=0,sum=0;
  for(;n<160;n++){const b0=GPU.bakeN|0;arrWarmStep(t.x,t.y);const d=(GPU.bakeN|0)-b0;mx=Math.max(mx,d);sum+=d;
    if(ARRW.k===t.x+","+t.y&&ARRW.i>=ARRW.q.length)break;drawWorld();}
  ok(ARRW.i>=ARRW.q.length&&ARRW.q.length>=4,"прогрев дошёл до конца ("+ARRW.i+" шагов из "+ARRW.q.length+" за "+n+" кадров)");
  ok(sum>0&&mx<=2,"прогрев печёт по одной вещи за кадр (выпечек "+sum+", в кадре до "+mx+")");
  const g={seed:hashi(t.x,t.y,0x6E57)>>>0},post=t.by==="gt"?GEST_POST.gt+gestPostNo(g):GEST_POST[t.by];
  const P0=GEST_POST_CV.get(t.by+"|"+post);
  ok(!!P0,"пост хозяина испечён до прыжка");
  ok(!!artGet(FLEET_ART,"fl"+(t.by==="gt"?"patrol":"tug")+g.seed+"!"+t.by),"корабль жеста испечён до прыжка");
  /* прилёт: первые кадры не допекают ничего синхронно, пост — тот же */
  const s0=PB_SYNC;
  arriveSystem(t.x,t.y,{cost:0});
  for(let i=0;i<3;i++)drawWorld();
  eq(PB_SYNC-s0,0,"кадры прилёта ничего не допекают на глазах");
  ok(GEST_POST_CV.get(t.by+"|"+post)===P0,"пост прилёта — испечённый заранее");
}));
