/* ══════════════ посадка ══════════════ */
function startLanding(p){
  const tr=genTerrain(p),r=rng(p.seed^0x77);
  /* достопримечательности вписываются в рельеф до того, как по нему расставят
     залежи и флору: они выравнивают под собой грунт (20a-poi) */
  genPOI(tr,p);
  G.ap=null;
  G.land={p,tr,x:tr.padX+(r()-.5)*(G.opts.easyLand?900:640),y:110,
    vx:(r()-.5)*1.3,vy:.35,a:0,
    g:.019+p.T.grav*.016+p.radius*.00022,over:0,ok:false,auto:G.opts.easyLand};
  G.mode="landing";
  say((G.opts.easyLand?"Автоматический заход":"Заход")+" на "+p.name+
    "\nтяготение "+p.T.grav.toFixed(2)+"g");
}
function autoLandInputs(L,st){
  /* примитивный, но надёжный автопилот посадки */
  const dx=L.tr.padX-L.x;
  const wantVx=clamp(dx*.012,-1.6,1.6);
  const ex=wantVx-L.vx;
  const wantA=clamp(ex*1.5,-.5,.5);
  L.a+=clamp(wantA-L.a,-.045,.045);
  const alt=groundAt(L.tr,L.x)-L.y-11;
  const wantVy=clamp(alt*.02,.25,2.6)*(Math.abs(dx)>140?.35:1);
  const thrust=(L.vy>wantVy)||(alt<40&&L.vy>.7);
  return {thrust,brake:Math.abs(dx)<50&&alt<120&&Math.abs(L.vx)>.25};
}
function updateLanding(dt){
  const L=G.land,tr=L.tr,st=stat();
  document.getElementById("dronebtn").style.display="none";
  if(L.over>0){
    L.over-=dt;
    if(L.over<=0){
      if(L.ok)enterSurface();
      else{
        G.mode="system";
        G.ship.x=L.p.x+Math.cos(L.p.ang)*(L.p.radius+140);
        G.ship.y=L.p.y+Math.sin(L.p.ang)*(L.p.radius+140);
        G.ship.vx=0;G.ship.vy=0;
        if(G.hull<=0)wreck();
      }
    }
    return;
  }
  let inThr=keys.thrust,inBrk=keys.brake,inL=keys.left,inR=keys.right;
  if(L.auto){
    const ai=autoLandInputs(L,st);
    inThr=ai.thrust;inBrk=ai.brake;inL=inR=false;
    G.prompt="АВТОМАТИЧЕСКАЯ ПОСАДКА · "+Math.max(0,Math.round(groundAt(tr,L.x)-L.y-11))+" м";
  }
  if(inL)L.a-=.05*st.turn*dt;
  if(inR)L.a+=.05*st.turn*dt;
  L.a=clamp(L.a,-1.5,1.5);
  if(inThr&&G.fuel>0){
    L.vx+=Math.sin(L.a)*.06*st.thr*dt;
    L.vy-=Math.cos(L.a)*.06*st.thr*dt;
    G.fuel=Math.max(0,G.fuel-.048*dt);
  }
  if(inBrk&&G.fuel>0){
    L.vx*=Math.pow(.90,dt);L.a*=Math.pow(.93,dt);
    if(L.vy>.4)L.vy-=.014*dt;
    G.fuel=Math.max(0,G.fuel-.03*dt);
  }
  L.thrOn=inThr&&G.fuel>0;
  L.vy+=L.g*dt;L.vx*=.999;
  L.x+=L.vx*dt;L.y+=L.vy*dt;
  L.x=clamp(L.x,40,tr.W-40);
  const gy=groundAt(tr,L.x),sp=Math.hypot(L.vx,L.vy);
  if(!L.auto)
    G.prompt="ВЫСОТА "+Math.max(0,Math.round(gy-L.y-11))+"  ВЕРТ "+L.vy.toFixed(2)+
      "  ГОР "+Math.abs(L.vx).toFixed(2);
  if(L.y+11>=gy){
    L.y=gy-11;
    const slope=Math.abs(groundAt(tr,L.x+18)-groundAt(tr,L.x-18));
    const tol=(G.tech.has("cera")?1.4:1)*(L.auto?3:1);
    const ok=L.vy<2.15*tol&&Math.abs(L.vx)<1.05*tol&&Math.abs(L.a)<.26*tol&&slope<9*tol;
    L.ok=ok;L.over=70;L.vx=0;L.vy=0;
    if(ok)say("Посадка выполнена");
    else{
      const dmg=(18+Math.min(42,sp*11))/tol;
      G.hull=Math.max(0,G.hull-dmg);
      say("Крушение\nкорпус −"+Math.round(dmg));
    }
  }
}
function drawGround(tr,camx,camy,fill,line,pal){
  /* силуэт строится в Path2D и живёт до конца функции. Раньше он лежал в
     текущем пути контекста, и первый же beginPath в цикле склонов его затирал:
     дальше clip для пластов и обводка кромки применялись к последней
     шестипиксельной полоске, то есть пласты породы не рисовались вовсе. */
  const i0=clamp(Math.floor((camx-40)/tr.step),0,tr.N-1);
  const i1=clamp(Math.ceil((camx+W+40)/tr.step),0,tr.N-1);
  const P=new Path2D();
  P.moveTo(i0*tr.step-camx,tr.h[i0]-camy);
  for(let i=i0;i<=i1;i++)P.lineTo(i*tr.step-camx,tr.h[i]-camy);
  P.lineTo(i1*tr.step-camx,H+10);P.lineTo(i0*tr.step-camx,H+10);P.closePath();
  ctx.fillStyle=fill;ctx.fill(P);
  /* порода: бесшовный тайл-материал вместо плоской заливки (18a-material).
     Заливка под ним остаётся — она держит силуэт, если материала ещё нет. */
  if(tr.mat)fillMaterial(tr.mat,camx,camy,.92,.26,P);
  /* склон, обращённый к солнцу (вправо-вверх), светлее; в тень — темнее.
     Простое псевдо-освещение по наклону вместо одной плоской заливки.
     Полосы полупрозрачные: непрозрачные закрашивали материал обратно в фигуру. */
  if(pal&&i1>i0){
    const lit=pal[Math.min(pal.length-1,4)], shade=pal[Math.min(pal.length-1,1)];
    const stripD=48;
    for(let i=i0;i<i1;i++){
      const x0=i*tr.step-camx,x1=(i+1)*tr.step-camx;
      if(x1<-4||x0>W+4)continue;
      const y0=tr.h[i]-camy,y1=tr.h[i+1]-camy;
      const slope=clamp((tr.h[i+1]-tr.h[i])/tr.step,-2.5,2.5);
      const t=clamp(.52-slope*.22,.08,.92);
      const r=Math.round(lerp(shade[0],lit[0],t)*.62),
            g=Math.round(lerp(shade[1],lit[1],t)*.62),
            b=Math.round(lerp(shade[2],lit[2],t)*.62);
      ctx.fillStyle="rgba("+r+","+g+","+b+","+(tr.mat?.55:1)+")";
      ctx.beginPath();
      ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.lineTo(x1,y1+stripD);ctx.lineTo(x0,y0+stripD);
      ctx.closePath();ctx.fill();
    }
    /* мелкая крошка/пучки на самой кромке — деш;во и оживляет силуэт вблизи */
    const dstep=Math.max(1,Math.round(14/tr.step));
    for(let i=i0;i<i1;i+=dstep){
      const wx=i*tr.step,x=wx-camx;if(x<-6||x>W+6)continue;
      const y=tr.h[i]-camy;
      const hh=hashi(Math.floor(wx/14),tr.sseed,0x6E55);
      if((hh&7)===0)continue;
      const grass=(hh&3)!==0;
      ctx.strokeStyle=grass?"rgba(255,255,255,.14)":"rgba(0,0,0,.22)";
      ctx.lineWidth=1;
      if(grass){
        const th=2+((hh>>>4)&3);
        ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+((hh>>>2)&1?1.4:-1.4),y-th);ctx.stroke();
      }else{
        ctx.fillStyle=ctx.strokeStyle;
        ctx.beginPath();ctx.arc(x,y-1,1+((hh>>>6)&1),0,TAU);ctx.fill();
      }
    }
  }
  /* слои породы — горизонтальные пласты, обрезанные силуэтом рельефа */
  if(pal&&tr.strata){
    ctx.save();ctx.clip(P);
    const band=30;
    const y0=Math.floor((camy-band*2)/band)*band;
    for(let k=0;k<Math.ceil(H/band)+4;k++){
      const wy=y0+k*band;
      const n=((wy/band)|0)+((tr.sseed>>>3)&15);
      const idx=Math.abs(n)%pal.length;
      const c=pal[idx];
      const th=band*(.3+((Math.abs(n*7)%5)/5)*.4);
      ctx.fillStyle="rgba("+Math.round(c[0]*.5)+","+Math.round(c[1]*.5)+","+
        Math.round(c[2]*.5)+","+(tr.mat?.15:.30)+")";
      ctx.fillRect(0,wy-camy,W,th);
      ctx.fillStyle="rgba(0,0,0,.10)";
      ctx.fillRect(0,wy-camy+th,W,1.4);
    }
    ctx.restore();
  }
  /* глубина: тело породы гаснет вниз. Без этого низ экрана — ровное пятно
     той же светлоты, что и освещённая поверхность, и грунт читается плоским. */
  if(tr.mat){
    ctx.save();ctx.clip(P);
    const dg=ctx.createLinearGradient(0,Math.max(0,tr.h[i0]-camy-40),0,H);
    dg.addColorStop(0,"rgba(0,0,0,0)");
    dg.addColorStop(1,"rgba(0,0,0,.72)");
    ctx.fillStyle=dg;ctx.fillRect(0,0,W,H);
    ctx.restore();
  }
  if(line){
    /* корка: светлая кромка поверх тёмного тела породы */
    ctx.strokeStyle=line;ctx.lineWidth=1.4;ctx.stroke(P);
    ctx.save();ctx.clip(P);
    ctx.strokeStyle="rgba(255,255,255,.09)";ctx.lineWidth=7;
    ctx.beginPath();
    ctx.moveTo(i0*tr.step-camx,tr.h[i0]-camy+4);
    for(let i=i0;i<=i1;i++)ctx.lineTo(i*tr.step-camx,tr.h[i]-camy+4);
    ctx.stroke();
    ctx.restore();
  }
}
/* валуны и осыпь на профиле */
function drawRocks(tr,camx,camy,pal){
  if(!tr.rocks)return;
  for(const k of tr.rocks){
    const x=k.x-camx;
    if(x<-k.rad-20||x>W+k.rad+20)continue;
    const y=groundAt(tr,k.x)-camy;
    ctx.save();ctx.translate(x,y-k.rad*.42);
    if(k.flip)ctx.scale(-1,1);
    const c0=pal[2],c1=pal[4];
    const t=k.tint;
    const P=k.poly;
    /* грани валуна дробим на подотрезки со смещением: ровный многоугольник
       читается как фигура, скол и выкрошенная кромка — как камень */
    const RP=new Path2D();
    RP.moveTo(P[0][0],P[0][1]);
    for(let i=1;i<=P.length;i++){
      const a=P[i-1],b=P[i%P.length];
      for(let s=1;s<=3;s++){
        const u=s/3;
        const hj=hashi(Math.floor(k.x)+i*13,s,0x0BEE)/4294967296-.5;
        const nx=-(b[1]-a[1]),ny=(b[0]-a[0]);
        const nl=Math.hypot(nx,ny)||1,d=hj*Math.min(3.5,k.rad*.22);
        RP.lineTo(lerp(a[0],b[0],u)+nx/nl*d,lerp(a[1],b[1],u)+ny/nl*d);
      }
    }
    RP.closePath();
    const g=ctx.createLinearGradient(0,-k.rad,0,k.rad);
    g.addColorStop(0,"rgb("+Math.round(lerp(c0[0],c1[0],t)*.9)+","+
      Math.round(lerp(c0[1],c1[1],t)*.9)+","+Math.round(lerp(c0[2],c1[2],t)*.9)+")");
    g.addColorStop(1,"rgb("+Math.round(c0[0]*.32)+","+Math.round(c0[1]*.32)+","+
      Math.round(c0[2]*.32)+")");
    ctx.fillStyle=g;ctx.fill(RP);
    /* та же порода, что под ногами: валун из другого материала выглядит
       принесённым из другой игры */
    if(tr.mat)fillMaterial(tr.mat,camx-x,camy-y+k.rad*.42,.5,.35,RP);
    ctx.strokeStyle="rgba(0,0,0,.35)";ctx.lineWidth=1;ctx.stroke(RP);
    if(k.rad>7){   // скол на крупных валунах
      ctx.strokeStyle="rgba(255,255,255,.10)";
      ctx.beginPath();ctx.moveTo(P[1][0],P[1][1]);ctx.lineTo(P[3][0]*.3,P[3][1]*.3);ctx.stroke();
    }
    ctx.restore();
  }
}
function skyGrad(p){
  const s=p.T.sky,g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,"rgb("+s[1].join(",")+")");
  g.addColorStop(.62,"rgb("+s[0].map((v,i)=>Math.round(lerp(v,s[1][i],.25))).join(",")+")");
  g.addColorStop(1,"rgb("+s[0].join(",")+")");
  return g;
}
/* тень-контакт: приплюснутый мягкий эллипс под ногами/стволом — единственное,
   что реально "приклеивает" объект к рельефу, а не даёт ему висеть на глаз */
function groundShadow(x,y,rx,ry){
  ctx.save();
  const g=ctx.createRadialGradient(x,y,0,x,y,rx);
  g.addColorStop(0,"rgba(0,0,0,.32)");g.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=g;
  ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fill();
  ctx.restore();
}
/* небо: солнечное марево + процедурные облака для миров с атмосферой —
   вызывается один раз в кадр поверх заливки skyGrad, перед рельефом */
function drawSkyLayer(p,camx,camy){
  const hasAtm=p.T.atm!=="отсутствует";
  const sunX=W*.78,sunY=H*.16;
  const sc=(G.sys&&G.sys.cls&&G.sys.cls.col)||"#ffe08a";
  const g=ctx.createRadialGradient(sunX,sunY,0,sunX,sunY,W*.5);
  g.addColorStop(0,rgba(hex2rgb(sc),.55));
  g.addColorStop(.12,rgba(hex2rgb(sc),.16));
  g.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  /* небесные тела идут между заревом звезды и облаками: за облаками, но
     перед общим градиентом — так они и оказываются «в небе», а не поверх него */
  drawSkyBodies(p,camx,camy);
  ctx.fillStyle="rgb("+p.T.sky[1].join(",")+")";
  ctx.beginPath();ctx.arc(sunX,sunY,H*.045,0,TAU);ctx.globalAlpha=.85;ctx.fill();ctx.globalAlpha=1;
  if(!hasAtm)return;
  /* облака: несколько плоских кластеров эллипсов, детерминированных от seed,
     медленно плывущих и заворачивающих по ширине мира */
  const seed=p.seed^0x510D;
  const n=5+Math.floor((hashi(seed,1,1)*7)%4);
  for(let i=0;i<n;i++){
    const r=rng(hashi(seed,i,0xC10D));
    const laneY=H*(.08+r()*.3), speed=.006+r()*.01, span=1400+r()*1200;
    const wx=(r()*4000+G.t*speed*100)%span - span*.5;
    const sx=(wx - camx*.12)%(span)+ (camx*.12<0?span:0);
    const x=((sx%W)+W*3)%(W+400)-200;
    const y=laneY-camy*.05;
    const alpha=.16+r()*.14;
    ctx.fillStyle="rgba(255,255,255,"+alpha.toFixed(2)+")";
    const blobs=3+Math.floor(r()*3),baseR=26+r()*30;
    for(let k=0;k<blobs;k++){
      const ox=(k-(blobs-1)/2)*baseR*.85,oy=Math.sin(k*1.7)*baseR*.18;
      ctx.beginPath();ctx.ellipse(x+ox,y+oy,baseR*(.6+r()*.5),baseR*.42,0,0,TAU);ctx.fill();
    }
  }
}
/* пыль/пыльца в воздухе — только там, где есть атмосфера, для ощущения глубины */
function drawDustMotes(camx,camy,p){
  if(p.T.atm==="отсутствует")return;
  const n=26;
  for(let i=0;i<n;i++){
    const r=rng(hashi(Math.floor(p.seed),i,0xD05));
    const wx=(r()*3000+G.t*(6+r()*10))%3000;
    const x=((wx-camx*.6)%(W+60)+W+60)%(W+60)-30;
    const y=(r()*H*.8+Math.sin(G.t*.03+i)*14);
    ctx.fillStyle="rgba(255,255,255,"+(.05+r()*.12).toFixed(2)+")";
    ctx.beginPath();ctx.arc(x,y,.8+r()*1.2,0,TAU);ctx.fill();
  }
}
function drawLanding(){
  const L=G.land,tr=L.tr,p=L.p;
  tr.mat=planetMat(p);
  ctx.fillStyle=skyGrad(p);ctx.fillRect(0,0,W,H);
  if(p.T.atm==="отсутствует")drawStars(L.x*.1,0,1);
  drawSkyLayer(p,L.x,L.y);
  const camx=L.x-W/2,camy=clamp(L.y-H*.42,-400,1e5);
  ctx.save();ctx.globalAlpha=.45;
  drawGround({h:tr.h,N:tr.N,step:tr.step*2.4},camx*.4,camy*.55+60,"rgb("+p.T.pal[1].join(",")+")",null);
  ctx.restore();
  drawGround(tr,camx,camy,"rgb("+p.T.pal[2].map(v=>Math.round(v*.6)).join(",")+")",
    "rgba(180,230,240,.35)",p.T.pal);
  drawPOI(tr,camx,camy,p);
  drawRocks(tr,camx,camy,p.T.pal);
  drawDustMotes(camx,camy,p);
  const px=tr.padX-camx,py=tr.padY-camy;
  ctx.strokeStyle="rgba(242,178,92,.85)";ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(px-46,py);ctx.lineTo(px+46,py);ctx.stroke();
  ctx.setLineDash([3,5]);ctx.globalAlpha=.5;
  ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px,py-3000);ctx.stroke();
  ctx.setLineDash([]);ctx.globalAlpha=1;
  ctx.save();ctx.translate(L.x-camx,L.y-camy);ctx.rotate(L.a);
  drawLander(L.over>0&&!L.ok,L.thrOn&&L.over<=0);
  ctx.restore();
}
/* садится тот самый корабль, на котором летаешь: тот же корпус, только
   развёрнутый носом вверх и с выпущенными опорами */
function drawLander(broken,fire){
  const h=hullOf(G.shipId), s=38/h.len;
  ctx.save();
  ctx.rotate(-Math.PI/2);
  ctx.scale(s,s);
  /* опоры: от кормовых бортов вниз-наружу, с пятами */
  const legY=h.tail*.55, spread=h.halfW*.85+10, drop=h.len*.42;
  ctx.strokeStyle=rgba(h.col,.9);ctx.lineWidth=2.4/s>3?3/s:2.4;
  ctx.lineCap="round";
  for(const sg of [-1,1])for(let i=0;i<2;i++){
    const bx=legY+i*h.len*.13, by=(h.bw*.75+i*2)*sg;
    const fx=legY-drop, fy=spread*sg;
    ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(fx,fy);ctx.stroke();
    ctx.beginPath();ctx.moveTo(fx,fy);ctx.lineTo(fx+6,fy*.82);ctx.stroke();   // подкос
    ctx.beginPath();
    ctx.moveTo(fx-1,fy-4.5);ctx.lineTo(fx-1,fy+4.5);ctx.stroke();             // пята
  }
  ctx.lineCap="butt";
  drawHull(G.shipId,fire,false,G.mods.engine);
  ctx.restore();
  if(broken){
    /* побитый корпус: трещины и дым, а не другая форма */
    ctx.strokeStyle="rgba(255,90,60,.9)";ctx.lineWidth=1.6;
    const r=rng(0x9911);
    for(let i=0;i<5;i++){
      const a=r()*TAU, d=6+r()*12;
      ctx.beginPath();ctx.moveTo(Math.cos(a)*d*.3,Math.sin(a)*d*.3);
      ctx.lineTo(Math.cos(a)*d,Math.sin(a)*d-4);ctx.stroke();
    }
    for(let i=0;i<4;i++){
      const t=(G.t*.05+i*.9)%6;
      ctx.fillStyle="rgba(90,80,78,"+(.3-t*.05).toFixed(2)+")";
      ctx.beginPath();ctx.arc((i-1.5)*5,-12-t*7,3+t*2.2,0,TAU);ctx.fill();
    }
  }
}