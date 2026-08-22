/* ══════════════ посадка ══════════════ */
function startLanding(p){
  /* ── с какой стороны зашёл, туда и сядешь ──
     Раньше место посадки не зависело ни от чего: рельеф считался по одному
     seed, и подойти к планете с другой стороны значило увидеть ровно ту же
     местность. Теперь долгота берётся из геометрии подхода — угол от центра
     планеты на корабль, — а из неё вычитается текущий поворот планеты: за
     сутки под кораблём проезжает вся поверхность, и один и тот же мир на
     разных заходах встречает разным местом. */
  let lon=null;
  if(G.ship&&typeof p.x==="number"){
    const app=Math.atan2(G.ship.y-p.y,G.ship.x-p.x);
    const spin=(typeof planetSpinFrame==="function")
      ? planetSpinFrame(p)/PLANET_SPIN*TAU : 0;
    lon=app-spin;
  }
  const tr=genTerrain(p,lon),r=rng(p.seed^0x77);
  tr.lon=lon;
  /* достопримечательности вписываются в рельеф до того, как по нему расставят
     залежи и флору: они выравнивают под собой грунт (20a-poi) */
  genPOI(tr,p);
  /* средний масштаб раскладывается после построек: он обходит их стороной,
     а рельеф под ними к этому моменту уже выровнен (21b-surface-deco) */
  genDeco(tr,p);
  G.ap=null;
  G.land={p,tr,x:tr.padX+(r()-.5)*(G.opts.easyLand?900:640),y:110,
    vx:(r()-.5)*1.3,vy:.35,a:0,gear:0,sq:0,sqv:0,hot:0,
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
  /* шасси и амортизаторы живут своей жизнью и в момент касания тоже: пока идёт
     `over`, физика уже стоит, а стойки ещё проседают и отдают — из этого и
     складывается посадка как движение, а не как подмена картинки */
  landerGearTick(L,dt);
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
    /* удар: стойки проседают тем глубже, чем жёстче пришли, и отдают пружиной */
    L.gear=1;L.sq=Math.min(1,.3+sp*.3);L.sqv=0;L.hot=1;
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
  /* ── ближний слой идёт через кэш ломтей (18c) ──
     Разрез с пластами, материалом и глубиной — самое дорогое в кадре и при
     этом неизменное: камера его только двигает. Ломоть красится этой же
     функцией (GROUND_BAKING), а в кадре остаётся drawImage да трава —
     она одна здесь живая, потому что кланяется ветру. */
  if(pal&&tr.mat&&!GROUND_BAKING){
    if(tr.hMin==null){let a=1e9,b=-1e9;for(let i=0;i<tr.N;i++){if(tr.h[i]<a)a=tr.h[i];if(tr.h[i]>b)b=tr.h[i];}tr.hMin=a;tr.hMax=b;}
    const top=Math.floor(tr.hMin-90),ch=Math.ceil(tr.hMax-tr.hMin+H+120);
    tr.chunks=chunkStore(tr.chunks,(tr.p?tr.p.seed:0)+"|"+fill+"|"+line+"|"+H+"|"+DPR,top,ch);
    drawChunks(tr.chunks,camx,camy,(g,wx0,wy0)=>{
      GROUND_BAKING=true;
      /* валуны неподвижны и сложены из той же породы (два прохода материала
         на каждый) — им место в ломте, а не в кадре: 6–9 мс на ×2 (G0) */
      try{drawGround(tr,wx0,wy0,fill,line,pal);drawRocks(tr,wx0,wy0,pal);}finally{GROUND_BAKING=false;}
    });
    drawGroundGrass(tr,camx,camy);
    return;
  }
  const i0=clamp(Math.floor((camx-40)/tr.step),0,tr.N-1);
  const i1=clamp(Math.ceil((camx+W+40)/tr.step),0,tr.N-1);
  const P=new Path2D();
  P.moveTo(i0*tr.step-camx,tr.h[i0]-camy);
  for(let i=i0;i<=i1;i++)P.lineTo(i*tr.step-camx,tr.h[i]-camy);
  P.lineTo(i1*tr.step-camx,H+10);P.lineTo(i0*tr.step-camx,H+10);P.closePath();
  ctx.fillStyle=fill;ctx.fill(P);
  /* сначала строение (какие слои и где), потом материал (из чего они сложены):
     обратный порядок закрашивал разрез ровным зерном и снова давал «фигуру» */
  if(pal&&tr.p)drawStrata(tr,camx,camy,tr.p,P);
  /* порода: бесшовный тайл-материал вместо плоской заливки (18a-material).
     Заливка под ним остаётся — она держит силуэт, если материала ещё нет. */
  if(tr.mat)fillMaterial(tr.mat,camx,camy,tr.p?.5:.92,.22,P);
  /* склон, обращённый к солнцу (вправо-вверх), светлее; в тень — темнее.
     Простое псевдо-освещение по наклону вместо одной плоской заливки.
     Полосы полупрозрачные: непрозрачные закрашивали материал обратно в фигуру. */
  if(pal&&i1>i0){
    const stripD=66;
    /* свет считается от звезды и от неба (19c-light), а не по константе
       «вправо-вверх светлее»: у токсичного мира тени зелёные, у ледяного
       синие, и планета опознаётся по освещению раньше, чем по форме */
    const P0=pal[Math.min(pal.length-1,3)];
    const sun=starRGB(), amb=tr.p?ambRGB(tr.p):pal[1], k=tr.p?ambK(tr.p):.3;
    for(let i=i0;i<i1;i++){
      const x0=i*tr.step-camx,x1=(i+1)*tr.step-camx;
      if(x1<-4||x0>W+4)continue;
      const y0=tr.h[i]-camy,y1=tr.h[i+1]-camy;
      const slope=clamp((tr.h[i+1]-tr.h[i])/tr.step,-2.5,2.5);
      const c=litRGB(P0,slope,null,sun,amb,k);
      ctx.fillStyle="rgba("+c[0]+","+c[1]+","+c[2]+","+(tr.mat?.42:1)+")";
      ctx.beginPath();
      ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.lineTo(x1,y1+stripD);ctx.lineTo(x0,y0+stripD);
      ctx.closePath();ctx.fill();
    }
    /* крошка на кромке — неподвижна, ложится в ломоть; трава живая и идёт
       отдельно (drawGroundGrass), в кадре поверх ломтей */
    drawGroundCrumbs(tr,camx,camy,i0,i1);
    if(!tr.mat)drawGroundGrass(tr,camx,camy);
  }
  /* глубина: тело породы гаснет вниз. Без этого низ экрана — ровное пятно
     той же светлоты, что и освещённая поверхность, и грунт читается плоским. */
  if(tr.mat){
    ctx.save();ctx.clip(P);
    const dg=ctx.createLinearGradient(0,Math.max(0,(GROUND_BAKING?tr.hMin:tr.h[i0])-camy-40),0,H);
    dg.addColorStop(0,"rgba(0,0,0,0)");
    dg.addColorStop(.45,"rgba(0,0,0,.42)");
    dg.addColorStop(1,"rgba(0,0,0,.88)");
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
let GROUND_BAKING=false;
/* мелкая крошка на самой кромке — дёшево и оживляет силуэт вблизи */
function drawGroundCrumbs(tr,camx,camy,i0,i1){
  const dstep=Math.max(1,Math.round(14/tr.step));
  ctx.lineWidth=1;
  for(let i=i0;i<i1;i+=dstep){
    const wx=i*tr.step,x=wx-camx;if(x<-6||x>W+6)continue;
    const hh=hashi(Math.floor(wx/14),tr.sseed,0x6E55);
    if((hh&7)===0||(hh&3)!==0)continue;
    ctx.fillStyle="rgba(0,0,0,.22)";
    ctx.beginPath();ctx.arc(x,tr.h[i]-camy-1,1+((hh>>>6)&1),0,TAU);ctx.fill();
  }
}
/* трава кланяется ветру: каждая пучка со своей фазой от координаты,
   иначе весь склон качается одним куском. Единственное живое на кромке */
function drawGroundGrass(tr,camx,camy){
  const i0=clamp(Math.floor((camx-40)/tr.step),0,tr.N-1);
  const i1=clamp(Math.ceil((camx+W+40)/tr.step),0,tr.N-1);
  const dstep=Math.max(1,Math.round(14/tr.step));
  ctx.strokeStyle="rgba(255,255,255,.14)";ctx.lineWidth=1;
  ctx.beginPath();
  for(let i=i0;i<i1;i+=dstep){
    const wx=i*tr.step,x=wx-camx;if(x<-6||x>W+6)continue;
    const hh=hashi(Math.floor(wx/14),tr.sseed,0x6E55);
    if((hh&7)===0||(hh&3)===0)continue;
    const y=tr.h[i]-camy,th=2+((hh>>>4)&3);
    const sw=WIND*(1.6+th*.5)*(.7+.3*Math.sin(G.t*.045+wx*.07));
    ctx.moveTo(x,y);ctx.lineTo(x+((hh>>>2)&1?1.4:-1.4)+sw,y-th);
  }
  ctx.stroke();
}
/* валуны и осыпь на профиле */
function drawRocks(tr,camx,camy,pal){
  if(!tr.rocks)return;
  /* с материалом валуны уже лежат в ломтях грунта — в кадре их не повторяем */
  if(tr.chunks&&!GROUND_BAKING)return;
  for(const k of tr.rocks){
    const x=k.x-camx;
    if(x<-k.rad-20||x>W+k.rad+20)continue;
    const y=groundAt(tr,k.x)-camy;
    /* контактная тень: без неё валун лежит поверх грунта, а не на нём.
       Смещена в сторону от солнца (оно справа сверху) и вытянута по земле. */
    ctx.save();ctx.globalAlpha=.7;
    groundShadow(x-k.rad*.35,y+1.5,k.rad*1.5,Math.max(2.2,k.rad*.3));
    ctx.restore();
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
    if(tr.mat)fillMaterial(tr.mat,camx-x,camy-y+k.rad*.42,.5,.35,RP,
      {x:-k.rad*1.4,y:-k.rad*1.4,w:k.rad*2.8,h:k.rad*2.8});
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
  /* небо садится вместе со светом: без этого затмение выглядело так, будто
     грунт погас, а день на месте (06a-celest) */
  const DK=typeof celDark==="function"?celDark():0;
  if(DK>.02){
    /* небу достаётся половина: остальное сводит gradePass на весь кадр, иначе
       затмение получается «тёмное небо над дневной планетой» */
    ctx.fillStyle="rgba(8,12,26,"+(.34*DK).toFixed(3)+")";
    ctx.fillRect(0,0,W,H);
  }
  const sunX=W*.78,sunY=H*.16;
  const sc=(G.sys&&G.sys.cls&&G.sys.cls.col)||"#ffe08a";
  /* зарево — полноэкранный радиальный градиент, 5 мс растра на кадр при
     неизменной картинке; живёт слоем (18c) и кладётся одним drawImage */
  ctx.drawImage(screenLayer("glow|"+sc,()=>{
    const g=ctx.createRadialGradient(sunX,sunY,0,sunX,sunY,W*.5);
    g.addColorStop(0,rgba(hex2rgb(sc),.55));
    g.addColorStop(.12,rgba(hex2rgb(sc),.16));
    g.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  }),0,0,W,H);
  /* небесные тела идут между заревом звезды и облаками: за облаками, но
     перед общим градиентом — так они и оказываются «в небе», а не поверх него */
  drawSkyBodies(p,camx,camy);
  ctx.fillStyle="rgb("+p.T.sky[1].join(",")+")";
  ctx.beginPath();ctx.arc(sunX,sunY,H*.045,0,TAU);ctx.globalAlpha=.85;ctx.fill();ctx.globalAlpha=1;
  /* календарь неба поверх звезды: диск спутника наезжает на неё, комета и парад
     идут своим чередом (06a-celest). Ниже облаков — они всё равно главнее */
  if(typeof drawCelest==="function")drawCelest(p,sunX,sunY,H*.045);
  if(!hasAtm)return;
  /* облака живут в 19e: поле плотности в перспективе, а не гроздь эллипсов */
  drawClouds(p,camx,camy);
}
/* пыль/пыльца в воздухе — только там, где есть атмосфера, для ощущения глубины */
function drawDustMotes(camx,camy,p){
  if(p.T.atm==="отсутствует")return;
  const n=26;
  for(let i=0;i<n;i++){
    const r=rng(hashi(Math.floor(p.seed),i,0xD05));
    /* пыль несёт тем же ветром, что и траву, и по той же оси: разнонаправленное
       движение мелочи сразу выдаёт, что это отдельные генераторы */
    const wx=(r()*3000+G.t*(6+r()*10)*(1+WIND*1.6))%3000;
    const x=((wx-camx*.6)%(W+60)+W+60)%(W+60)-30;
    const y=(r()*H*.8+Math.sin(G.t*.03+i)*14+WIND*Math.sin(G.t*.02+i*2)*8);
    ctx.fillStyle="rgba(255,255,255,"+(.05+r()*.12).toFixed(2)+")";
    ctx.beginPath();ctx.arc(x,y,.8+r()*1.2,0,TAU);ctx.fill();
  }
}
function drawLanding(){
  const L=G.land,tr=L.tr,p=L.p;
  tr.mat=planetMat(p);tr.p=p;
  WIND=windOf(p);
  drawSkyBase(p);
  if(p.T.atm==="отсутствует")drawStars(L.x*.1,0,1);
  drawSkyLayer(p,L.x,L.y);
  const camx=L.x-W/2,camy=clamp(L.y-H*.42,-400,1e5);
  drawGround({h:tr.h,N:tr.N,step:tr.step*3.6},camx*.26,camy*.46+110,hazeFar(p,.58),null);
  drawGround({h:tr.h,N:tr.N,step:tr.step*2.4},camx*.4,camy*.55+60,hazeFar(p,.32),null);
  hazeBand(p,H*.46,H*.20);
  drawGround(tr,camx,camy,"rgb("+p.T.pal[2].map(v=>Math.round(v*.6)).join(",")+")",
    "rgba(180,230,240,.35)",p.T.pal);
  drawPOI(tr,camx,camy,p);
  drawDeco(tr,camx,camy,p);
  drawRocks(tr,camx,camy,p.T.pal);
  drawDustMotes(camx,camy,p);
  const px=tr.padX-camx,py=tr.padY-camy;
  ctx.strokeStyle="rgba(242,178,92,.85)";ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(px-46,py);ctx.lineTo(px+46,py);ctx.stroke();
  ctx.setLineDash([3,5]);ctx.globalAlpha=.5;
  ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px,py-3000);ctx.stroke();
  ctx.setLineDash([]);ctx.globalAlpha=1;
  ctx.save();ctx.translate(L.x-camx,L.y-camy);ctx.rotate(L.a);
  drawLander(L.over>0&&!L.ok,L.thrOn&&L.over<=0,
    {gear:L.gear,sq:L.sq,hot:L.hot,landed:L.over>0&&L.ok,tr:tr,gx:L.x});
  ctx.restore();
  /* пыль из-под струи на подходе: чем ниже, тем гуще. Без неё грунт до самого
     касания оставался нетронутым, и посадка не чувствовалась тяжёлой */
  landingDust(L,tr,camx,camy);
  drawWeather(p,camx,camy);
  lightShafts(p);
  gradePass(p);
}
/* ── посадочный корабль ──
   Полётный вид — сверху, посадочный — сбоку; поворотом одного в другой не
   переводится в принципе, поэтому у посадки свой силуэт, а не сжатый и
   повёрнутый корпус из 03-ships. Мерило прежнее — человек: астронавт 24 px,
   корабль 3.5–5 его ростов. Ливрея, цвет и приметы класса берутся у того же
   корпуса, на котором летаешь, — узнаётся именно ваш корабль. */
const LAND_GY=11;                       // точка касания в местных координатах
function landerLen(id){return clamp(hullOf(id).len*2.2,90,130);}
/* радиус зоны «у корабля»: считаем от корпуса, а не числом 48 — иначе
   подсказки срабатывают из-под днища */
function shipZoneR(id){return landerLen(id||G.shipId)*.75;}
function landerGearTick(L,dt){
  const alt=groundAt(L.tr,L.x)-L.y-LAND_GY;
  const want=(L.over>0||alt<210)?1:0;
  L.gear=clamp((L.gear||0)+(want?.028:-.02)*dt,0,1);
  /* амортизатор — пружина с затуханием: проседает от удара и отдаёт */
  L.sqv=(L.sqv||0)+(-(L.sq||0)*.06-(L.sqv||0)*.12)*dt;
  L.sq=clamp((L.sq||0)+L.sqv*dt,-.25,1);
  if(L.hot)L.hot=Math.max(0,L.hot-.0016*dt);
}
/* профиль стойки: бедро → шток → пята, каждая садится на грунт СВОЕЙ
   координаты (та же ошибка и то же лекарство, что у друз в M79) */
function drawLandGear(h,len,hipY,lx,dgy,gear,sq){
  const foot=LAND_GY+dgy-sq*3.4;
  const knee=[lerp(lx*.55,lx*.92,gear),lerp(hipY+len*.05,(hipY+foot)*.5,gear)];
  const fx=lerp(lx*.42,lx,gear), fy=lerp(hipY+len*.08,foot,gear);
  ctx.lineCap="round";
  ctx.strokeStyle=rgba(h.dark,1);ctx.lineWidth=5.4;
  ctx.beginPath();ctx.moveTo(lx*.62,hipY);ctx.lineTo(knee[0],knee[1]);ctx.stroke();
  /* цилиндр толще штока, шток светлее: видно, что он в него уходит */
  ctx.strokeStyle=rgba(h.body,1);ctx.lineWidth=6.4;
  ctx.beginPath();ctx.moveTo(knee[0],knee[1]);
  ctx.lineTo(lerp(knee[0],fx,.45),lerp(knee[1],fy-3,.45));ctx.stroke();
  ctx.strokeStyle=rgba(h.lite,.95);ctx.lineWidth=3.2;
  ctx.beginPath();ctx.moveTo(lerp(knee[0],fx,.35),lerp(knee[1],fy-3,.35));
  ctx.lineTo(fx,fy-3);ctx.stroke();
  /* подкос от корпуса к колену — без него стойка читается проволокой */
  ctx.strokeStyle=rgba(h.dark,.95);ctx.lineWidth=2.6;
  ctx.beginPath();ctx.moveTo(lx*.18,hipY-1);ctx.lineTo(knee[0],knee[1]);ctx.stroke();
  ctx.lineCap="butt";
  if(gear<.5)return;
  /* пята с блином, вдавленным в грунт, и пыльный ободок вокруг */
  ctx.fillStyle=rgba(h.dark,1);
  ctx.beginPath();ctx.ellipse(fx,fy-1.5,6.5,2.6,0,0,TAU);ctx.fill();
  ctx.fillStyle=rgba(h.body,1);ctx.fillRect(fx-2,fy-5,4,3.4);
  ctx.fillStyle="rgba(0,0,0,.28)";
  ctx.beginPath();ctx.ellipse(fx,fy+1,10,2.6,0,0,TAU);ctx.fill();
}
function drawLander(broken,fire,opt){
  opt=opt||{};
  const h=hullOf(G.shipId), len=landerLen(G.shipId), M=h.mark||{};
  const gear=opt.gear==null?1:opt.gear, sq=opt.sq||0;
  const bodyH=len*.30, half=len*.5;
  /* брюхо держится на высоте пояса астронавта: с просветом в 10 px корабль
     ложился на грунт и читался автобусом, а стойки исчезали вовсе */
  const bY=LAND_GY-19+sq*4, tY=bY-bodyH;
  const gy=x=>opt.tr?clamp(groundAt(opt.tr,(opt.gx||0)+x)-groundAt(opt.tr,opt.gx||0),-9,9):0;
  ctx.save();
  /* нос чуть задран, а на касании опускается вместе с просадкой стоек: без
     этого посадка оставалась подменой картинки, как и было обещано в M81 */
  ctx.rotate(-.05+sq*.12);
  /* ── стойки: три точки, разнос 0.84 длины; средняя — дальнего борта ── */
  const legs=[[-half*.42,1],[-half*.10,.62],[half*.42,1]];
  /* контактная тень: без неё корабль на земле — марка, приклеенная к грунту,
     а не масса, которая на нём стоит (G8). Растёт с выпуском стоек. */
  if(gear>.5&&opt.tr){
    ctx.save();ctx.globalAlpha=(gear-.5)*2*.85;
    groundShadow(half*.05,LAND_GY+gy(half*.05)+2,half*1.05,Math.max(3.5,len*.055));
    ctx.restore();
  }
  for(const lg of legs){
    ctx.globalAlpha=lg[1];
    drawLandGear(h,len,bY-bodyH*.12,lg[0],gy(lg[0]),gear,sq);
  }
  ctx.globalAlpha=1;
  /* ── корпус по схеме планера ──
     Силуэт был один на всех: лежачее веретено с кабиной, менялись только
     ливрея и длина. В полёте же корабль — дельта, крест, катамаран, плита,
     диск, трезубец (03a), и на площадке садится именно он. Схема берётся у
     того же корпуса (`h.form`), общее остаётся общим: стойки, трап, сопла. */
  const box=!!M.cont;                   // рудовоз и здесь ящик, курьер — конус
  const form=h.form||"swept";
  const flat=form==="slab"||form==="boxed", disc=form==="disc", twin=form==="twin";
  const cY=(tY+bY)*.5;
  /* полигон тела: веретено, плита или диск; катамаран — два веретена */
  const hullPath=(dx,dy,k)=>{
    const hf=half*k, bh=bodyH*k, b=bY+dy, t=b-bh;
    ctx.beginPath();
    if(disc){ctx.ellipse(dx,cY+dy,hf*1.04,bh*.52,0,0,TAU);ctx.closePath();return;}
    let P;
    if(flat)P=[[hf+dx,t+bh*.18],[hf+dx,b-bh*.12],[hf*.94+dx,b],[-hf*.96+dx,b],
      [-hf+dx,b-bh*.14],[-hf+dx,t+bh*.08],[-hf*.9+dx,t],[hf*.84+dx,t]];
    else P=[[hf+dx,b-bh*.62],[hf+dx,b-bh*.30],[hf*.80+dx,b],[-hf*.74+dx,b],
      [-hf*.94+dx,b-bh*.22],[-hf*.94+dx,t+bh*(box?.06:.30)],
      [-hf*.30+dx,t],[hf*.30+dx,t],[hf*.86+dx,t+bh*.28]];
    ctx.moveTo(P[0][0],P[0][1]);
    for(let i=1;i<P.length;i++)ctx.lineTo(P[i][0],P[i][1]);
    ctx.closePath();
  };
  const bodyFill=(t,b,a)=>{
    const g=ctx.createLinearGradient(0,t,0,b);
    g.addColorStop(0,rgba(h.lite,.95*a));g.addColorStop(.45,rgba(h.col,a));
    g.addColorStop(1,rgba(h.dark,a));
    return g;
  };
  /* дальний корпус катамарана: выше, чуть назад и темнее — он за ближним */
  if(twin){
    hullPath(-len*.05,-bodyH*.62,.9);
    ctx.fillStyle=bodyFill(tY-bodyH*.62,bY-bodyH*.62,1);ctx.fill();
    ctx.fillStyle="rgba(0,0,0,.34)";ctx.fill();
    ctx.strokeStyle=rgba(h.edge,.9);ctx.lineWidth=1.2;ctx.stroke();
    /* мостик между корпусами */
    ctx.fillStyle=rgba(h.body,1);ctx.strokeStyle=rgba(h.edge,1);ctx.lineWidth=1;
    ctx.beginPath();ctx.rect(-half*.45,tY-bodyH*.5,half*.7,bodyH*.5);ctx.fill();ctx.stroke();
  }
  /* крыло дельты: видно снизу, как тёмный клин от миделя к корме — от
     взгляда сбоку крыло толщиной в линию, и схема терялась */
  if(form==="delta"){
    ctx.fillStyle=rgba(h.dark,1);ctx.strokeStyle=rgba(h.edge,1);ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(half*.3,bY-bodyH*.3);ctx.lineTo(-half*.95,bY-bodyH*.3);
    ctx.lineTo(-half*1.12,bY+bodyH*.28);ctx.lineTo(-half*.2,bY+bodyH*.12);ctx.closePath();
    ctx.fill();ctx.stroke();
    ctx.fillStyle="rgba(255,120,90,.9)";
    ctx.beginPath();ctx.arc(-half*1.08,bY+bodyH*.24,1.6,0,TAU);ctx.fill();
  }
  /* нижняя гондола креста — под брюхом, до корпуса */
  if(form==="xwing"){
    ctx.fillStyle=rgba(h.body,1);ctx.strokeStyle=rgba(h.edge,1);ctx.lineWidth=1;
    ctx.beginPath();ctx.ellipse(-half*.12,bY+bodyH*.1,half*.36,bodyH*.2,0,0,TAU);ctx.fill();ctx.stroke();
  }
  hullPath(0,0,1);
  ctx.fillStyle=bodyFill(tY,bY,1);ctx.fill();
  ctx.strokeStyle=rgba(h.edge,1);ctx.lineWidth=1.4;ctx.stroke();
  ctx.save();ctx.clip();
  /* линий панелей немного и они слабые: частая гребёнка делала из корпуса
     гофрированную трубу, то есть дирижабль */
  ctx.strokeStyle="rgba(0,0,0,.14)";ctx.lineWidth=1;
  for(let x=-half*.6;x<half*.7;x+=len*.22){
    ctx.beginPath();ctx.moveTo(x,tY);ctx.lineTo(x+len*(flat?0:.03),bY);ctx.stroke();
  }
  ctx.fillStyle=rgba(h.lite,.30);
  ctx.fillRect(-half,tY+bodyH*h.stripe.a,len,bodyH*.13);
  /* нижняя палуба отдельной плитой со швом и заклёпками: без неё ровный
     градиент по всей высоте читается надувной трубой, а не машиной */
  ctx.fillStyle="rgba(0,0,0,.30)";
  ctx.fillRect(-half,bY-bodyH*.30,len,bodyH*.30);
  ctx.strokeStyle=rgba(h.lite,.35);ctx.lineWidth=1.2;
  ctx.beginPath();ctx.moveTo(-half,bY-bodyH*.30);ctx.lineTo(half,bY-bodyH*.30);ctx.stroke();
  ctx.fillStyle="rgba(255,255,255,.14)";
  for(let x=-half*.8;x<half*.8;x+=len*.055){
    ctx.beginPath();ctx.arc(x,bY-bodyH*.36,.9,0,TAU);ctx.fill();
  }
  /* плита: рёбра шпангоутов поперёк — иначе прямоугольник читается вагоном */
  if(flat){
    ctx.strokeStyle="rgba(0,0,0,.22)";ctx.lineWidth=1.6;
    for(let x=-half*.85;x<half*.8;x+=len*.11){ctx.beginPath();ctx.moveTo(x,tY);ctx.lineTo(x,bY);ctx.stroke();}
  }
  /* диск: кольцевые швы, светлый верх и тёмный низ тарелки */
  if(disc){
    ctx.strokeStyle="rgba(0,0,0,.18)";ctx.lineWidth=1;
    for(let k=.82;k>.3;k-=.26){ctx.beginPath();ctx.ellipse(0,cY,half*1.04*k,bodyH*.52*k,0,0,TAU);ctx.stroke();}
    ctx.fillStyle="rgba(0,0,0,.22)";ctx.fillRect(-half*1.1,cY+bodyH*.08,len*1.2,bodyH);
  }
  ctx.restore();
  /* боковая гондола креста — поверх корпуса, на своём свету */
  if(form==="xwing"){
    for(const [px,py,k] of [[-half*.12,tY-bodyH*.18,1],[-half*.12,cY,.9]]){
      ctx.fillStyle=bodyFill(py-bodyH*.22,py+bodyH*.22,1);ctx.strokeStyle=rgba(h.edge,1);ctx.lineWidth=1;
      ctx.beginPath();ctx.ellipse(px,py,half*.38*k,bodyH*.22*k,0,0,TAU);ctx.fill();ctx.stroke();
      ctx.fillStyle=rgba(h.dark,.9);
      ctx.beginPath();ctx.ellipse(px-half*.3*k,py,bodyH*.1,bodyH*.16*k,0,0,TAU);ctx.fill();
    }
  }
  /* трезубец: нос расходится на три зуба, сбоку видны верхний и нижний */
  if(form==="trident"){
    ctx.fillStyle=rgba(h.body,1);ctx.strokeStyle=rgba(h.edge,1);ctx.lineWidth=1;
    for(const dy of [-bodyH*.46,bodyH*.04]){
      ctx.beginPath();ctx.moveTo(half*.5,cY+dy-bodyH*.14);ctx.lineTo(half*1.16,cY+dy-bodyH*.06);
      ctx.lineTo(half*1.16,cY+dy+bodyH*.06);ctx.lineTo(half*.5,cY+dy+bodyH*.16);ctx.closePath();
      ctx.fill();ctx.stroke();
    }
  }
  /* ящики: у контейнеровоза — стопка вдоль хребта, у плиты — два ряда */
  if(box||form==="boxed"||form==="slab"){
    const rows=form==="boxed"?2:1;
    for(let rw=0;rw<rows;rw++)for(let i=0;i<3;i++){
      ctx.fillStyle=rgba(h.dark,.9);ctx.strokeStyle=rgba(h.col,.6);ctx.lineWidth=.9;
      ctx.beginPath();ctx.rect(-half*.6+i*len*.2,tY-bodyH*.16-rw*bodyH*.22,len*.16,bodyH*.2);
      ctx.fill();ctx.stroke();
    }
  }
  /* кабина: у диска — купол сверху, у плиты — рубка-ящик на носу, у
     остальных — остекление впереди; изнутри свет */
  ctx.fillStyle="rgba(150,225,255,.55)";
  ctx.beginPath();
  if(disc){ctx.ellipse(half*.08,cY-bodyH*.46,half*.3,bodyH*.34,0,Math.PI,TAU);ctx.closePath();}
  else if(flat){ctx.rect(half*.46,tY-bodyH*.28,half*.38,bodyH*.4);}
  else{
    ctx.moveTo(half*.72,tY+bodyH*.16);ctx.lineTo(half*.34,tY+bodyH*.08);
    ctx.lineTo(half*.34,tY+bodyH*.36);ctx.lineTo(half*.68,tY+bodyH*.40);
    ctx.closePath();
  }
  ctx.fill();
  ctx.strokeStyle=rgba(h.dark,1);ctx.lineWidth=1.1;ctx.stroke();
  if(M.drill){                          // бур в носу — как в полёте
    ctx.fillStyle=rgba(h.lite,.85);
    ctx.beginPath();ctx.moveTo(half+len*.06,bY-bodyH*.34);
    ctx.lineTo(half,bY-bodyH*.48);ctx.lineTo(half,bY-bodyH*.20);ctx.closePath();ctx.fill();
  }
  /* киль на корме: без него силуэт с круглым хвостом читается дирижаблем.
     У диска киля нет, у плиты — короткий, у дельты — высокий */
  if(!disc){
    const fk=form==="delta"?1.5:(flat?.55:1);
    ctx.fillStyle=rgba(h.body,1);
    ctx.beginPath();
    ctx.moveTo(-half*.62,tY+bodyH*.1);ctx.lineTo(-half*.86,tY-bodyH*.55*fk);
    ctx.lineTo(-half*.98,tY-bodyH*.5*fk);ctx.lineTo(-half*.9,tY+bodyH*.12);
    ctx.closePath();ctx.fill();
    ctx.strokeStyle=rgba(h.edge,1);ctx.lineWidth=1;ctx.stroke();
  }
  /* антенна и радиатор — развёрнуты и стоят на корпусе, а не висят рядом */
  ctx.strokeStyle=rgba(h.lite,.8);ctx.lineWidth=1.4;
  const aX=disc?-half*.4:-half*.1, aY=disc?cY-bodyH*.4:tY;
  ctx.beginPath();ctx.moveTo(aX,aY);ctx.lineTo(aX,aY-len*.10);ctx.stroke();
  ctx.beginPath();ctx.arc(aX,aY-len*.10,2.8,Math.PI*1.15,TAU*.99);ctx.stroke();
  if(!disc){
    ctx.fillStyle=rgba(h.dark,.9);ctx.strokeStyle=rgba(h.lite,.5);ctx.lineWidth=.8;
    ctx.beginPath();ctx.rect(half*.02,tY-len*.035,len*.22,len*.032);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(half*.10,tY-len*.003);ctx.lineTo(half*.10,tY);
    ctx.moveTo(half*.20,tY-len*.003);ctx.lineTo(half*.20,tY);ctx.stroke();
  }
  /* ── трап: по нему и читается масштаб быстрее всего ── */
  if(gear>.9&&opt.landed){
    const hx=-half*.06, hw=len*.17, hb=bY-bodyH*.30, ht=tY+bodyH*.18;
    /* проём непрозрачный: сквозь полупрозрачный светились стойки, и люк
       читался наклейкой, а не дырой в борту */
    ctx.fillStyle="#1a1712";
    ctx.fillRect(hx-hw*.5,ht,hw,hb-ht);
    const lg=ctx.createLinearGradient(0,ht,0,hb);
    lg.addColorStop(0,"rgba(255,214,150,.85)");lg.addColorStop(1,"rgba(255,170,90,.25)");
    ctx.fillStyle=lg;ctx.fillRect(hx-hw*.5+1.5,ht+1.5,hw-3,hb-ht-3);
    ctx.strokeStyle=rgba(h.lite,.95);ctx.lineWidth=1.4;
    ctx.strokeRect(hx-hw*.5,ht,hw,hb-ht);
    /* трап: по шагу его ступеней масштаб читается быстрее всего. Сходит
       вперёд-вправо — туда, где игрок и оказывается после посадки, и там его
       не перекрывает средняя стойка */
    const rx=hx+len*.46, ry=LAND_GY+gy(rx);
    ctx.strokeStyle=rgba(h.dark,1);ctx.lineWidth=4.4;
    ctx.beginPath();ctx.moveTo(hx+hw*.5,hb);ctx.lineTo(rx,ry);ctx.stroke();
    ctx.strokeStyle=rgba(h.lite,.85);ctx.lineWidth=1.4;
    const stepN=Math.max(2,Math.round(Math.hypot(rx-hx-hw*.5,ry-hb)/10));
    for(let i=1;i<stepN;i++){
      const t=i/stepN, sx=lerp(hx+hw*.5,rx,t), sy=lerp(hb,ry,t);
      ctx.beginPath();ctx.moveTo(sx-2.5,sy-2.5);ctx.lineTo(sx+2.5,sy+1);ctx.stroke();
    }
    /* свет из люка ложится на грунт у трапа — тёплое пятно, по которому
       корабль виден ночью раньше корпуса (G8) */
    ctx.save();ctx.globalCompositeOperation="lighter";
    const pg=ctx.createRadialGradient(rx-6,ry+1,2,rx-6,ry+1,len*.28);
    pg.addColorStop(0,"rgba(255,200,130,.28)");pg.addColorStop(1,"rgba(255,170,90,0)");
    ctx.fillStyle=pg;ctx.beginPath();ctx.ellipse(rx-6,ry+1,len*.28,len*.07,0,0,TAU);ctx.fill();
    ctx.restore();
  }
  /* ── сопла снизу-сзади: после посадки ещё горячие ── */
  const ex=-half*.80, ey=bY+bodyH*.02, er=bodyH*.24;
  /* блок двигателей выступает из кормы: иначе колокола выглядят наклейкой */
  ctx.fillStyle=rgba(h.body,1);ctx.strokeStyle=rgba(h.edge,1);ctx.lineWidth=1.1;
  ctx.beginPath();ctx.rect(ex-er*.9,bY-bodyH*.34,er*3.4,bodyH*.36);
  ctx.fill();ctx.stroke();
  for(const d of [0,er*1.7]){
    ctx.fillStyle=rgba(h.dark,1);
    ctx.beginPath();
    ctx.moveTo(ex+d,ey-er);ctx.lineTo(ex+d-er*.7,ey+er*.8);
    ctx.lineTo(ex+d+er*.9,ey+er*.8);ctx.closePath();ctx.fill();
    const hot=opt.hot||0;
    if(hot>.02){
      const hg=ctx.createRadialGradient(ex+d,ey+er*.6,0,ex+d,ey+er*.6,er*2.2);
      hg.addColorStop(0,"rgba(255,150,80,"+(hot*.5).toFixed(2)+")");
      hg.addColorStop(1,"rgba(255,90,40,0)");
      ctx.fillStyle=hg;ctx.beginPath();ctx.arc(ex+d,ey+er*.6,er*2.2,0,TAU);ctx.fill();
    }
    /* маршевые сопла на посадке только тлеют: тягу вниз дают не они */
  }
  /* ── тормозные сопла в брюхе ──
     Тяга на посадке направлена ВВЕРХ (`L.vy-=cos(a)…`), а маршевые движки
     смотрят назад: пока факел бил из кормы, корабль на подходе выглядел так,
     будто разгоняется вбок, а не висит. Жмёт тягу — из брюха бьют вниз три
     коротких факела, и они же поднимают пыль. */
  if(fire){
    const lvl=1+(G.mods.engine||0)*.22;
    for(const bx of [-half*.5,-half*.05,half*.42]){
      const by=bY-bodyH*.02, br=bodyH*.13;
      ctx.fillStyle=rgba(h.dark,1);
      ctx.fillRect(bx-br*.9,by-br*.6,br*1.8,br*1.2);
      ctx.save();ctx.translate(bx,by);ctx.rotate(Math.PI/2);
      drawFlame(0,0,br*.8,lvl*(.8+Math.random()*.25));
      ctx.restore();
    }
  }
  /* проблесковый маяк */
  if(Math.sin(G.t*.07)>.2){
    ctx.fillStyle="rgba(255,120,90,.9)";
    ctx.beginPath();ctx.arc(half*.1,tY-1.5,2.2,0,TAU);ctx.fill();
  }
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
}/* ── пыль от струи ──
   Работает и на подходе (пока жмёшь тягу), и в первые мгновения после касания:
   осевшее облако не исчезает мгновенно. На мире без атмосферы пыль ниже и
   резче — ей нечем виться. */
function landingDust(L,tr,camx,camy){
  const alt=groundAt(tr,L.x)-L.y-LAND_GY;
  const push=(L.thrOn?1:0)+(L.over>0&&L.ok?Math.max(0,1-(70-L.over)/40):0);
  if(push<=0||alt>150)return;
  const p=L.p, thin=p.T.atm==="отсутствует";
  const k=push*clamp(1-alt/150,0,1);
  const n=Math.round(10+k*16);
  for(let i=0;i<n;i++){
    const r=rng(hashi(i,Math.floor(G.t*.5)+i,0xD05));
    const side=r()<.5?-1:1;
    const t=r();
    /* пыль расходится от точки под кораблём вдоль СВОЕГО грунта, а не по
       прямой: на склоне ровное облако сразу выдаёт наклейку */
    const dx=side*(10+t*90*k);
    const gx=L.x+dx, gy=groundAt(tr,gx);
    const rise=(thin?6:16)*k*(1-t)*(.5+r()*.7);
    const x=gx-camx, y=gy-camy-rise;
    const a=(thin?.3:.45)*k*(1-t)*(.6+r()*.7);
    const rad=(3+t*13)*(thin?.8:1.25)*(.6+k);
    /* пыль того же цвета, что грунт под ней, и ЛЕЖИТ по земле сплюснутым
       облаком: круглые светлые шары читались мыльными пузырями */
    const base=p.T.pal?p.T.pal[3]||p.T.pal[2]:[150,140,130];
    const col=mixc(base,[40,34,30],.35);
    ctx.fillStyle="rgba("+col.map(v=>Math.round(v)).join(",")+","+a.toFixed(2)+")";
    ctx.beginPath();ctx.ellipse(x,y,rad*1.7,rad*.55,0,0,TAU);ctx.fill();
  }
}
