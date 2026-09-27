/* ══════════════ планета: поверх кадра — подписи, луч, следы и то, что ещё не перерисовано (M611) ══════════════
   Кадр нового вида — тела в объёме. Поверх него, тем же 2D, что рисует
   приборы, ложится то, что телом не бывает: подписи вещей, полоса добычи, луч
   бура, следы и пыль из-под ног, спасательный круг, ближняя погода.

   И то, что ещё НЕ перерисовано: находки, свои постройки, дом, посёлок,
   «Жестянка», чужой знак, подглядка, места уездов. Их кладут старые рисовалки,
   как клали, — наклейкой на линию ходьбы. Рамка кадра на этой линии у нового
   объектива та же, что у 2D-игры, поэтому стоят они на своих местах; человек
   проходит за ними, а не перед ними. Каждая уходит отсюда, когда получает тело
   (M626–M629). Упала старая рисовалка — снимается весь их список, кадр живёт.

   Точка мира попадает на канву через объектив: луч из глаза до плоскости
   линии ходьбы. */
const PLN_OVER={old:true,err:""};

/* точка мира (м) → точка канвы в единицах игры, от угла кадра */
function plnOverAt(C,p){
  const k=C.D/(C.D+p[2]);
  return [(C.ex+(p[0]-C.ex)*k)*PLN_M-C.vx,PLN.y0-(C.ey+(p[1]-C.ey)*k)*PLN_M-C.vy];
}
function plnOverPlate(txt,x,y,plate,ink){
  const tw=ctx.measureText(txt).width;
  ctx.fillStyle=plate;ctx.fillRect(x-tw/2-5,y-10,tw+10,14);
  ctx.fillStyle=ink;ctx.fillText(txt,x,y);
}
/* то, что ещё не перерисовано: старые рисовалки в том же порядке, что клал старый кадр */
function plnOverOld(tr,camx,camy,p){
  if(!tr.mat)tr.mat=planetMat(p);
  drawPOI(tr,camx,camy,p);
  drawBuilt(tr,camx,camy,p);
  if(typeof drawHomeOut==="function"&&typeof homeHereP==="function"&&homeHereP(p))drawHomeOut(tr,camx,camy,p);
  if(settleCanLive(p))settleDraw(settleAt(G.sx,G.sy),tr,camx,camy,p);
  if(tinCanLive(p))tinDraw(tinAt(G.sx,G.sy),tr,camx,camy,p);
  if(typeof traceDraw==="function")traceDraw(tr,camx,camy,p);
  peepDrawMat(camx,camy);
  if(typeof glowDrawPatches==="function"){glowDrawPatches(tr,camx,camy,p);glowDrawPad(G.surf,camx,camy);}
  if(typeof slowDraw==="function")slowDraw(tr,camx,camy,p);
  if(typeof passDraw==="function")passDraw(tr,camx,camy,p);
  if(typeof placeDraw==="function")placeDraw(tr,camx,camy,p);
  if(typeof lightsDrawReveal==="function")lightsDrawReveal(tr,camx,camy,p);
  peepGhosts(camx,camy);
}
function plnOver(){
  const S=G.surf,tr=S.tr,p=S.p,C=PLN.cam,L=PLN_LAND.cur,M=PLN_M,O=PLN_OVER;
  if(!C||!L)return;
  const camx=C.vx,camy=C.vy,at=q=>plnOverAt(C,q),gy=(x,z)=>plnLandRibAt(L,x,z);
  if(O.old){
    ctx.save();
    try{plnOverOld(tr,camx,camy,p);}
    catch(e){O.old=false;O.err=String((e&&e.stack)||e).slice(0,400);plnLog("старые рисовалки: "+O.err);}
    ctx.restore();
  }
  /* следы и пыль из-под ног: на самой линии ходьбы */
  if(S.tracks)for(const tk of S.tracks){
    const age=G.t-tk.t;
    if(age>TRACK_LIFE)continue;
    const tx=tk.x-camx;
    if(tx<-10||tx>W+10)continue;
    const a=clamp(1-(age-TRACK_LIFE*.5)/(TRACK_LIFE*.5),0,1),ty=groundAt(tr,tk.x)-camy;
    ctx.fillStyle="rgba(0,0,0,"+(.30*a).toFixed(3)+")";
    ctx.fillRect(tx-2.4,ty+.3,4.8,1.5);
  }
  if(S.dust)for(const dp of S.dust){
    const age=(G.t-dp.t)/46;
    if(age>=1)continue;
    const dx=dp.x-camx;
    if(dx<-20||dx>W+20)continue;
    const dy=groundAt(tr,dp.x)-camy;
    ctx.fillStyle="rgba(214,198,172,"+((1-age)*.22).toFixed(3)+")";
    ctx.beginPath();ctx.ellipse(dx-dp.f*age*5,dy-1-age*4,1.5+age*4.5,1+age*2.6,0,0,TAU);ctx.fill();
  }
  ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
  const PLATE="rgba(5,7,12,.72)",INK="rgba(176,196,208,.95)";
  if(S.cave&&isFinite(S.cave.x)){
    const x=S.cave.x/M,q=at([x,gy(x,PLN_THINGS.caveZ)+2.1*PLN_THINGS.caveQ+1.5,PLN_THINGS.caveZ]);
    if(q[0]>-60&&q[0]<W+60)plnOverPlate("ПЕЩЕРА",q[0],q[1],PLATE,INK);
  }
  {
    const mu=mineSpotX(p);
    if(mu!=null&&isFinite(mu)){
      const x=mu/M,q=at([x,gy(x,PLN_THINGS.mineZ)+2.15*PLN_THINGS.mineQ+1.3,PLN_THINGS.mineZ]);
      if(q[0]>-60&&q[0]<W+60)plnOverPlate("ШАХТА",q[0],q[1],PLATE,INK);
    }
  }
  for(const b of S.fauna||[]){
    if(!b.scanned||b.caught)continue;
    const x=b.x/M,z=plnBeastZ(b),q=at([x,gy(x,z)+plnBeastR(b)*2.6+(b.alien&&b.hover?b.hover:0)/M,z]);
    if(q[0]<-50||q[0]>W+50)continue;
    ctx.fillStyle="rgba(127,230,216,.85)";ctx.fillText("ИЗУЧЕН",q[0],q[1]);
  }
  /* подписи залежей рядом с человеком: ближняя стоит на своём месте, соседняя, если легла на неё, поднимается */
  const tags=[];
  for(const d of S.deposits||[]){
    if(!(d.left>0)||!(Math.abs(d.x-S.x)<70))continue;
    const x=d.x/M,z=plnThingDepZ(d),q=at([x,gy(x,z)+1.75,z]),txt=RES[d.res].ru.toUpperCase()+" "+d.left;
    tags.push({txt,x:q[0],y:q[1]-(Math.round(d.x/60)%2)*11,w:ctx.measureText(txt).width+10,col:RES[d.res].col,far:Math.abs(d.x-S.x)});
  }
  tags.sort((a,b)=>a.far-b.far);
  for(let k=0;k<tags.length;k++){
    const t=tags[k];
    for(let n=0;n<6;n++){
      let hit=false;
      for(let j=0;j<k;j++){
        const o=tags[j];
        if(Math.abs(o.x-t.x)<(o.w+t.w)/2+3&&Math.abs(o.y-t.y)<16){t.y=o.y-16;hit=true;}
      }
      if(!hit)break;
    }
    plnOverPlate(t.txt,t.x,t.y,"rgba(5,7,12,.62)",t.col);
  }
  for(const d of S.deposits||[]){
    if(!(d.left>0))continue;
    const x=d.x/M,z=plnThingDepZ(d),g=gy(x,z),col=RES[d.res].col;
    if(S.mining===d){
      const q=at([x,g+1.35,z]);
      ctx.fillStyle="rgba(0,0,0,.5)";ctx.fillRect(q[0]-18,q[1],36,4);
      ctx.fillStyle=col;ctx.fillRect(q[0]-18,q[1],36*clamp(d.prog,0,1),4);
    }
  }
  const x=S.x-camx,y=S.y-camy;
  /* спасательный круг: рыжий тор по урезу, блик сверху, кольца волны от него */
  if(S.swim>0){
    const k=S.swim,Wt=typeof waterOf==="function"?waterOf(tr,p):null,wy=Wt?Wt.y-camy:y-1;
    ctx.save();ctx.globalAlpha=k;
    ctx.strokeStyle="rgba(0,0,0,.35)";ctx.lineWidth=4.6;
    ctx.beginPath();ctx.ellipse(x,wy-1.5,8.5*k+1,3.4,0,0,TAU);ctx.stroke();
    ctx.strokeStyle="rgb(226,116,58)";ctx.lineWidth=3.4;
    ctx.beginPath();ctx.ellipse(x,wy-1.5,8.5*k+1,3.4,0,0,TAU);ctx.stroke();
    ctx.strokeStyle="rgba(255,226,190,.55)";ctx.lineWidth=1;
    ctx.beginPath();ctx.ellipse(x,wy-2.6,8.5*k+1,3.2,0,Math.PI*1.12,Math.PI*1.88);ctx.stroke();
    ctx.restore();
  }
  if(S.mining){
    const d=S.mining,dx=d.x/M,dz=plnThingDepZ(d),q=at([dx,gy(dx,dz)+.45,dz]);
    ctx.strokeStyle="rgba(242,178,92,.7)";ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(x+S.face*6,y+2);ctx.lineTo(q[0],q[1]);ctx.stroke();
  }
  drawWeather(p,camx,camy,"near");
}
