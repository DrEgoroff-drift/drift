/* ══════════════ туманность на ходу — без ступеней (26.09, PLAN §1) ══════════════
   Автор: «кажется как будто тормозит, когда туманность начинает появляться рядом с кораблём».
   Кадры были чистые, дёргался газ: с порогом .5 объём пересчитывался раз в 2–6 кадров и прыгал
   на ~.55 px (80 CSS px/с — на целый пиксель раз в 5 кадров). Ворота: камера движется — пересчёт
   каждый кадр; камера стоит — перетекание раз в GNB_AGE; тронулись посреди перетекания — оно
   доводится, а не обрывается прямой записью */
function nebMoveFrames(n,dx,Z,f){
  for(let i=0;i<n;i++){G.ship.x+=dx;G.ship.vx=0;G.ship.vy=0;G.zoom=Z;G.zoomT=null;G.ap=null;
    const g0=GNB.nGen|0;frameBody(wallMs());if(f)f(i,(GNB.nGen|0)-g0);}
}
TEST_SUITES.push(()=>suite("туманность на ходу: пересчёт каждый кадр при 40–400 px/с, стоя — перетекание, стык без обрыва",{tier:"browser"},()=>{
  if(!ok(GPU.ok,"видеокарта есть — без неё туманность не меряется"))return;
  resetWorld();
  G.mode="system";G.orbit=null;
  const run0=G.running,loop0=LOOP_OFF;
  try{
    G.running=true;LOOP_OFF=false;
    G.ship.x=330;G.ship.y=60;G.ship.a=-.5;
    nebMoveFrames(40,0,1);
    if(!ok((GNB.nGen|0)>0&&GNB.sys===G.sys,"туманность считается в системе"))return;
    for(const Z of [1,.3])for(const sp of [40,80,150,250,400]){
      let fr=0,gen=0,pat="";
      nebMoveFrames(20,sp/60/Z,Z,(i,d)=>{if(i>=8){fr++;if(d>0)gen++;pat+=d+":"+(GNB.cx|0)+" ";}});
      eq(gen,fr,"зум "+Z+", "+sp+" CSS px/с: пересчёт в каждом кадре ("+gen+" из "+fr+") "+pat);
    }
    /* стоя: перетекание раз в GNB_AGE — не каждый кадр */
    nebMoveFrames(30,0,1);
    let gs=0;nebMoveFrames(4*GNB_AGE,0,1,(i,d)=>{gs+=d;});
    ok(gs>=3&&gs<=5,"стоя: пересчётов за "+4*GNB_AGE+" кадров "+gs+" — раз в "+GNB_AGE+", с перетеканием");
    /* стык: встали посреди перетекания — первый кадр хода не пишет прямо в видимую */
    let k=0;while(k++<2*GNB_AGE&&!(GNB.fi>=1&&GNB.fi<=GNB_AGE-3))nebMoveFrames(1,0,1);
    if(ok(GNB.fi>=1&&GNB.fi<=GNB_AGE-3,"нашёлся кадр посреди перетекания (fi "+GNB.fi+")")){
      const seen=[];nebMoveFrames(4,150/60,1,()=>seen.push(GNB.fi));
      ok(seen[0]<GNB_AGE&&seen[1]<GNB_AGE&&seen[2]===GNB_AGE,"тронулись: перетекание доведено за три кадра ("+seen.join(",")+"), не оборвано");
    }
  }catch(e){ok(false,"кадр упал: "+e.message);}
  finally{G.running=run0;LOOP_OFF=loop0;}
  resetWorld();
}));
