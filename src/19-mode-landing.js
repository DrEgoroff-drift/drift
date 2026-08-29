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
    /* час суток входит в ключ (M232): свет в ломте дневной или ночной, и
       ломоть, испечённый утром, не должен пережить полдень. Квантование в
       шесть ступеней держит перепечку редкой */
    /* в ключ ломтя входит и СТОРОНА солнца (M242): свет теперь идёт оттуда,
       где диск, а ломоть печётся один раз — без азимута в ключе земля весь
       день держала бы утреннюю подсветку склонов */
    tr.chunks=chunkStore(tr.chunks,(tr.p?tr.p.seed:0)+"|"+fill+"|"+line+"|"+H+"|"+DPR+
      "|d"+(tr.p?dayKq(tr.p):0)+"|a"+(tr.p?sunAzQ(tr.p):0),top,ch);
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
    /* прямой свет по дневному ключу: полдень ~.96, заря ~.45 — в полдень
       склоны к солнцу горят, а тени остаются цветными от неба */
    const df=tr.p?(.40+.58*dayKq(tr.p)):.78;
    for(let i=i0;i<i1;i++){
      const x0=i*tr.step-camx,x1=(i+1)*tr.step-camx;
      if(x1<-4||x0>W+4)continue;
      const y0=tr.h[i]-camy,y1=tr.h[i+1]-camy;
      const slope=clamp((tr.h[i+1]-tr.h[i])/tr.step,-2.5,2.5);
      const c=litRGB(P0,slope,null,sun,amb,k,df);
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
  /* три формы куста, а не одна былинка (M232): одиночная травинка, пучок
     веером и низкий кустик дугой. Форма — от места, качаются все в один
     ветер, но пучок сильнее одиночки */
  ctx.strokeStyle="rgba(255,255,255,.14)";ctx.lineWidth=1;
  ctx.beginPath();
  for(let i=i0;i<i1;i+=dstep){
    const wx=i*tr.step,x=wx-camx;if(x<-6||x>W+6)continue;
    const hh=hashi(Math.floor(wx/14),tr.sseed,0x6E55);
    if((hh&7)===0||(hh&3)===0)continue;
    const y=tr.h[i]-camy,th=2+((hh>>>4)&3);
    const sw=WIND*(1.6+th*.5)*(.7+.3*Math.sin(G.t*.045+wx*.07));
    const form=(hh>>>8)&3;
    if(form===1){                              // пучок веером
      for(let b=-1;b<=1;b++){
        ctx.moveTo(x+b*.8,y);
        ctx.lineTo(x+b*2.2+sw*1.2,y-th+Math.abs(b));
      }
    }else if(form===2){                        // низкий кустик дугой
      ctx.moveTo(x-2.2,y);
      ctx.quadraticCurveTo(x-1.2+sw*.4,y-th*.9,x+sw*.6,y-th*.7);
      ctx.moveTo(x+2.2,y);
      ctx.quadraticCurveTo(x+1.2+sw*.4,y-th*.9,x+sw*.6,y-th*.7);
    }else{                                     // одиночная былинка
      ctx.moveTo(x,y);ctx.lineTo(x+((hh>>>2)&1?1.4:-1.4)+sw,y-th);
    }
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
  /* небо знает час (M232): в полдень зенит — светлый насыщенный цвет
     собственной палитры мира, горизонт — светлый воздух; к ночи градиент
     сходится к прежнему. Полдень перестаёт читаться пасмурным прямо здесь. */
  const D=skyDay(p),g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,"rgb("+D.top.join(",")+")");
  g.addColorStop(.62,"rgb("+D.top.map((v,i)=>Math.round(lerp(v,D.bot[i],.55))).join(",")+")");
  g.addColorStop(1,"rgb("+D.bot.join(",")+")");
  return g;
}
/* тень-контакт: приплюснутый мягкий эллипс под ногами/стволом — единственное,
   что реально "приклеивает" объект к рельефу, а не даёт ему висеть на глаз */
/* ── тень ложится ОТ света, а не строго под предметом (M243) ──
   Пятно под ногами одинаково в полдень и на закате — это не тень, а подставка.
   Направление берётся у того же SUN_DIR, которым освещаются склоны, длина —
   у высоты светила: чем ниже солнце, тем длиннее и слабее тень. Функция одна
   на всю игру, поэтому чинит разом ходока, корабль, валуны, растения и копёр. */
function groundShadow(x,y,rx,ry){
  const sx=(typeof SUN_DIR==="object")?SUN_DIR.x:0;
  const sy=(typeof SUN_DIR==="object")?SUN_DIR.y:-1;
  const low=clamp(1-Math.abs(sy),0,1);          /* 0 в зените, 1 у горизонта */
  const off=-sx*rx*(.35+low*1.6);
  const kx=1+low*1.2;
  const a=.32*(1-low*.40);
  ctx.save();
  const g=ctx.createRadialGradient(x+off,y,0,x+off,y,rx*kx);
  g.addColorStop(0,"rgba(0,0,0,"+a.toFixed(3)+")");g.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=g;
  ctx.beginPath();ctx.ellipse(x+off,y,rx*kx,ry,0,0,TAU);ctx.fill();
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
  /* звезда ходит по небу (M172, sunSpot в 19c): зарево, диск, календарь и
     облака берут одну точку, поэтому полдень, закат и ночь — разные кадры,
     а не одна картинка разной яркости */
  const SS=sunSpot(p);
  const sunX=SS.x,sunY=SS.y;
  const sc=(G.sys&&G.sys.cls&&G.sys.cls.col)||"#ffe08a";
  /* ── звезда как тело, а не круг из ящика canvas (П1 марафона) ──
     Прежний вид — идеальный круг с обрывом альфы на кромке плюс радиальный
     градиент поверх готового неба: ровно тот «naked radial gradient», который
     DESIGN-craft §1 называет грехом. Три поимённо:
     1. плато на стопе .12 у зарева рисовало концентрическое КОЛЬЦО — автор
        ткнул в него пальцем («кругов дохуя», 29.08.2026);
     2. кромка диска обрывалась на альфе .55 — круг-наклейка;
     3. зарево светилось и в вакууме, где рассеивать нечего (закону «в вакууме
        лучей не бывает» шафты уже подчинялись, а зарево — нет).
     Зарево печётся спрайтом в единичных координатах и кладётся одним
     drawImage; падение — гладкая степенная кривая без плато. Под горизонтом
     остаётся зарево заката. */
  {
    const under=clamp((SS.alt+.42)/.5,0,1);        /* 0 — глубокая ночь */
    const a=SS.up?1:under*.7;
    if(a>.02){
      const GS=glowSprite("sunglow2|"+sc+"|"+hasAtm,()=>{
        const g=ctx.createRadialGradient(0,0,0,0,0,1);
        /* восемь стопов по степенной кривой: воздух рассеивает широко и мягко,
           вакуум — только тесная корона у самого тела */
        const a0=hasAtm?.50:.38, pw=hasAtm?2.6:5.5;
        for(let i=0;i<=8;i++){const t=i/8;
          g.addColorStop(t,rgba(hex2rgb(sc),a0*Math.pow(1-t,pw)));}
        ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);
      });
      ctx.save();ctx.globalAlpha=a;
      glowBlit(GS,sunX,sunY,hasAtm?W*.5:W*.16);
      ctx.restore();
    }
  }
  /* небесные тела идут между заревом звезды и облаками: за облаками, но
     перед общим градиентом — так они и оказываются «в небе», а не поверх него */
  drawSkyBodies(p,camx,camy);
  /* ── диск: потемнение к лимбу, у горизонта — экстинкция ──
     Цветом звезды, к центру белее (раньше он брался тоном неба и любая звезда
     читалась затмением). Тело печётся спрайтом от высоты (12 делений): в
     зените кромка мягкая и к краю темнее (лимб), у горизонта диск сплюснут,
     покраснел и снизу съеден дымкой — атмосферная экстинкция. В вакууме
     кромка резкая: смягчать её нечему. */
  if(SS.up){
    const sr=H*.045;
    const low=hasAtm?clamp(1-SS.alt*2.2,0,1):0;    /* 1 — у самого горизонта */
    const altQ=Math.round(low*12);
    const sp=glowSprite("sundisc|"+sc+"|"+hasAtm+"|"+altQ,()=>{
      const c=hex2rgb(sc), lo=altQ/12;
      /* к горизонту тон уходит в красную медь: воздух крадёт синее первым */
      const cr=[lerp(c[0],205,lo*.45),lerp(c[1],84,lo*.45),lerp(c[2],40,lo*.55)].map(Math.round);
      const g=ctx.createRadialGradient(0,0,0,0,0,1);
      g.addColorStop(0,"rgba(255,252,240,"+(.95-lo*.25).toFixed(2)+")");
      g.addColorStop(.55,rgba(cr,.92));
      if(hasAtm){
        g.addColorStop(.84,rgba(cr.map(v=>Math.round(v*.82)),.88));  /* лимб темнее кромки */
        g.addColorStop(1,rgba(cr,0));                                /* кромку доедает воздух */
      }else{
        g.addColorStop(.90,rgba(cr.map(v=>Math.round(v*.86)),.94));
        g.addColorStop(.985,rgba(cr,.92));
        g.addColorStop(1,rgba(cr,0));                                /* полпикселя сглаживания */
      }
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,1,0,TAU);ctx.fill();
      /* экстинкция: дымка съедает нижний край тем сильнее, чем звезда ниже */
      if(lo>.05){
        const e=ctx.createLinearGradient(0,-1,0,1);
        e.addColorStop(0,"rgba(0,0,0,0)");
        e.addColorStop(.55,"rgba(0,0,0,0)");
        e.addColorStop(1,"rgba(0,0,0,"+(.62*lo).toFixed(2)+")");
        ctx.globalCompositeOperation="destination-out";
        ctx.fillStyle=e;ctx.fillRect(-1,-1,2,2);
      }
    });
    const ry=sr*(1-.20*low);                       /* у горизонта диск сплюснут */
    ctx.drawImage(sp,sunX-sr,sunY-ry,sr*2,ry*2);
  }
  /* календарь неба поверх звезды: диск спутника наезжает на неё, комета и парад
     идут своим чередом (06a-celest). Ниже облаков — они всё равно главнее */
  if(typeof drawCelest==="function")drawCelest(p,sunX,sunY,H*.045);
  /* три света (11g): спутники главной звезды, сходящиеся к соединению */
  if(typeof lightsSuns==="function")lightsSuns(p,sunX,sunY,H*.045);
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
  sunDirSet(p);            /* свет идёт оттуда, где нарисован диск (M242) */
  WIND=windOf(p);
  drawSkyBase(p);
  if(p.T.atm==="отсутствует")drawStars(L.x*.1,0,1);
  drawSkyLayer(p,L.x,L.y);
  const camx=L.x-W/2;
  /* ── садиться нужно НА ЧТО-ТО (M233) ──
     Камера держала корабль на 42% высоты кадра и больше ни на что не смотрела:
     на высоте в полкилометра земля уходила ниже нижней кромки, и весь экран
     занимала ровная заливка неба с парой облаков. Спуск — это когда видно,
     куда садишься. Камера теперь съезжает вниз ровно настолько, чтобы кромка
     грунта оставалась в кадре, и не дальше того, чтобы корабль не ушёл под
     верхнюю кромку: на высоте он вверху, земля внизу, между ними воздух. */
  const gyw=groundAt(tr,L.x);
  /* верхняя граница — не кромка кадра, а нижний край приборной колодки: она
     висит сверху по центру, и корабль, поднятый выше, уезжал ПОД неё */
  const camy=clamp(clamp(gyw-H*.93,L.y-H*.42,L.y-H*.24),-400,1e5);
  /* ── дальние гряды держатся горизонта, а не улетают в небо (M233) ──
     Их сдвиг считался долей от camy (`camy*.46+110`) — формула, верная только
     у самой земли. На подходе с полукилометра camy втрое больше, гряды
     уезжали НАД кромкой грунта, и их плоская заливка закрывала пол-неба
     ровной горизонтальной чертой. Подъём над ближней землёй ограничен:
     дальнее стоит у горизонта, как ему и положено. */
  const fA=Math.min(camy*.46+110,camy+H*.20), fB=Math.min(camy*.55+60,camy+H*.11);
  drawGround({h:tr.h,N:tr.N,step:tr.step*3.6},camx*.26,fA,hazeFar(p,.58),null);
  drawGround({h:tr.h,N:tr.N,step:tr.step*2.4},camx*.4,fB,hazeFar(p,.32),null);
  /* ── дымка ложится на ГОРИЗОНТ, а не на 46% кадра (M233) ──
     Полоса стояла на постоянной высоте экрана и на подходе с высоты висела
     ровной горизонтальной чертой посреди пустого неба — та самая линейка, от
     которой шахту лечили в M219. Дымка живёт там, где земля встречается с
     воздухом: у кромки грунта, а если та ушла ниже кадра — у нижней кромки. */
  hazeBand(p,clamp(groundAt(tr,L.x)-camy,H*.30,H*1.02),H*.20);
  /* дальние капли — за грядой и за кораблём, ближние поверх (M242) */
  drawWeather(p,camx,camy,"far");
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
  drawWeather(p,camx,camy,"near");
  lightShafts(p);
  gradePass(p);
}
