/* ══════════════ поверхность: подсказка, HUD и кадр ══════════════
   Отрезано от 21-mode-surface на распиле 0.108.x: вход и ход остались там,
   подсказка, навигационные метки и отрисовка кадра — здесь. */
function surfaceHint(){
  const S=G.surf;if(!S)return null;
  const dShip=Math.abs(S.x-S.shipX);
  if(S.suit<35)return "СКАФАНДР НА ИСХОДЕ · К КОРАБЛЮ ИЛИ КНОПКА → КОРАБЛЬ";
  if(dShip<shipZoneR()){
    if(baseAt(G.sx,G.sy,S.p.idx))return "ЗДЕСЬ ВАША БАЗА · ДЕЙСТВИЕ — СПУСТИТЬСЯ ВНИЗ";
    if(S.p.type!=="gas")return "У КОРАБЛЯ МОЖНО ЗАЛОЖИТЬ БАЗУ · ДЕЙСТВИЕ · 2500 КР + 10 СПЛАВОВ";
  }
  if(S.cave&&Math.abs(S.cave.x-S.x)<34)return "ВХОД В ПЕЩЕРУ · ДЕЙСТВИЕ — ВНУТРЬ";
  if(!G.surfTipShown||G.t-G.surfTipShown<900){
    if(!G.surfTipShown)G.surfTipShown=G.t;
    return "ЦВЕТНЫЕ КРИСТАЛЛЫ — ЗАЛЕЖИ · СТРЕЛКИ СВЕРХУ ВЕДУТ К ПЕЩЕРЕ И КОРАБЛЮ";
  }
  return null;
}
function drawSurfaceHud(camx,camy){
  const S=G.surf;
  ctx.textAlign="center";
  /* строка-подсказка сверху */
  /* полоса идёт ниже приборов: сверху слева датчики, справа сводка системы,
     справа же колонка кнопок — туда текст залезать не должен */
  const TOP=58, RIGHT_PAD=118;
  const hint=surfaceHint();
  if(hint){
    ctx.font="10px ui-monospace,monospace";
    /* длинная подсказка не вылезает за плашку — ужимается с многоточием (M167) */
    let ht=hint;
    const maxW=W-RIGHT_PAD-34;
    while(ht.length>4&&ctx.measureText(ht).width>maxW)ht=ht.slice(0,-4)+"…";
    const w=Math.min(W-RIGHT_PAD-20,ctx.measureText(ht).width+22);
    const cx=(W-RIGHT_PAD)/2;
    ctx.fillStyle="rgba(5,7,12,.72)";ctx.fillRect(cx-w/2,TOP,w,20);
    ctx.strokeStyle="rgba(127,230,216,.28)";ctx.lineWidth=1;
    ctx.strokeRect(cx-w/2+.5,TOP+.5,w-1,19);
    ctx.fillStyle="rgba(190,235,240,.92)";ctx.fillText(ht,cx,TOP+14);
  }
  /* навигатор: маркеры цели у верхней кромки — корабль и пещера */
  const marks=[];
  marks.push({x:S.shipX,ru:"КОРАБЛЬ",col:"rgba(242,178,92,.9)"});
  if(S.cave)marks.push({x:S.cave.x,ru:"ПЕЩЕРА",col:"rgba(150,225,255,.9)"});
  if(typeof lightsOpen==="function"&&lightsOpen(S.p))marks.push({x:lightsEntryX(S.tr,S.p),ru:"ВХОД",col:"rgba(255,236,190,.9)"});
  /* дом (M170): до него надо дойти, значит его надо и найти — свой маркер,
     тёплого цвета, чтобы не путать с кораблём */
  if(typeof homeHereP==="function"&&homeHereP(S.p)){
    const hx=homeSpotX(S.p,S.tr);
    if(hx!=null)marks.push({x:hx,ru:"ДОМ",col:"rgba(255,206,138,.95)"});
  }
  /* достопримечательность ведут отдельно от пещеры: до неё далеко, и без
     маркера игрок пройдёт мимо ровно того, ради чего стоило садиться */
  const poi=nearestPOI(S.tr,S.x);
  if(poi)marks.push({x:poi.x,ru:poi.ru,col:"rgba(212,180,255,.9)"});
  /* фишки у кромки (M167): далёкая цель — плашка у левого или правого края,
     по стороне, где она; фишки одной стороны стоят столбиком и не наезжают
     ни друг на друга, ни на солнце в небе. Ближняя цель — засечка на месте. */
  ctx.font="9px ui-monospace,monospace";
  let leftY=(hint?TOP+34:TOP+6),rightY=leftY,rowY=leftY;
  for(let mi=0;mi<marks.length;mi++){
    const m=marks[mi];
    const d=m.x-S.x, ad=Math.abs(d);
    ctx.fillStyle=m.col;
    if(ad>W*.45){                       // цель за краем — фишка у своей кромки
      const dir=Math.sign(d);
      const label=m.ru+" "+Math.round(ad)+" м";
      const tw=ctx.measureText(label).width,cw=tw+24,ch=15;
      const rx=dir>0?W-RIGHT_PAD-8-cw:8;
      const ry=dir>0?(rightY+=0,rightY):(leftY+=0,leftY);
      if(dir>0)rightY+=ch+4;else leftY+=ch+4;
      ctx.fillStyle="rgba(5,7,12,.72)";ctx.fillRect(rx,ry,cw,ch);
      ctx.strokeStyle=m.col;ctx.globalAlpha=.5;ctx.lineWidth=1;ctx.strokeRect(rx+.5,ry+.5,cw-1,ch-1);ctx.globalAlpha=1;
      ctx.fillStyle=m.col;
      const ax=dir>0?rx+cw-7:rx+7;
      ctx.beginPath();
      ctx.moveTo(ax+dir*4,ry+ch/2);ctx.lineTo(ax-dir*3,ry+ch/2-4);ctx.lineTo(ax-dir*3,ry+ch/2+4);
      ctx.closePath();ctx.fill();
      const old=ctx.textAlign;ctx.textAlign=dir>0?"right":"left";
      ctx.fillText(label,dir>0?rx+cw-14:rx+14,ry+11);
      ctx.textAlign=old;
    }else{
      const sx=clamp(m.x-camx,64,W-RIGHT_PAD-14);
      rowY+=13;
      ctx.fillRect(sx-1,rowY-5,2,10);
      ctx.fillText(m.ru,sx,rowY+16);
    }
  }
  drawJetBar(12,H-16);
}
function drawSurface(){
  const S=G.surf,tr=S.tr,p=S.p;
  tr.mat=planetMat(p);tr.p=p;
  drawSkyBase(p);
  /* звёзды — до небесных тел: нарисованные после, они просвечивают сквозь
     диск гиганта и убивают его объём */
  if(p.T.atm==="отсутствует"||p.type==="ice")drawStars(S.x*.1,0,1);
  drawSkyLayer(p,S.x,S.y);
  WIND=windOf(p);
  /* камера идёт рядом, а не приклеена: инерция, взгляд вперёд, дыхание,
     тряска от удара (19c-light). Если камеры ещё нет — первый кадр берём по
     персонажу, чтобы не было рывка от нуля. */
  if(!S.cam)S.cam={x:S.x,y:S.y};
  const co=camOffset(S);
  const camx=S.cam.x-W/2+co.x, camy=clamp(S.cam.y-H*.58,-300,1e5)+co.y;
  /* единственный источник правды о камере на кадр: по нему же ввод пересчитывает
     тычок в мировую координату (15-input) */
  G.viewX=camx;G.viewY=camy;
  /* дальний хребет не гасится прозрачностью, а выцветает в цвет неба: именно
     этим глаз мерит расстояние (19c-light). Двух слоёв достаточно, третий уже
     не читается, а стоит столько же. */
  /* дальние гряды — кэшем по тайлам (хвост G2, правило G11): силуэт в цвет
     воздуха печётся раз на 512×512 в координатах своего параллакса, кадр
     кладёт картинки. drawGround рисует через W/H, которые withCtx подменяет */
  S.farA=tileStore(S.farA,"farA|"+p.seed+"|"+DPR);
  drawTiles(S.farA,camx*.22,camy*.42+130,(g,wx0,wy0)=>drawGround({h:tr.h,N:tr.N,step:tr.step*3.6},wx0,wy0,hazeFar(p,.58),null));
  S.farB=tileStore(S.farB,"farB|"+p.seed+"|"+DPR);
  drawTiles(S.farB,camx*.35,camy*.5+80,(g,wx0,wy0)=>drawGround({h:tr.h,N:tr.N,step:tr.step*2.4},wx0,wy0,hazeFar(p,.32),null));
  hazeBand(p,H*.52,H*.22);
  drawGround(tr,camx,camy,"rgb("+p.T.pal[3].map(v=>Math.round(v*.5)).join(",")+")",
    "rgba(200,240,246,.4)",p.T.pal);
  /* нижняя треть уходит в тень неба: ближний грунт темнее дальнего, и по
     этому глаз мерит глубину (хвост G2) */
  {
    const sh=p.T.sky[1];
    const dg=ctx.createLinearGradient(0,H*.62,0,H);
    dg.addColorStop(0,"rgba("+sh.join(",")+",0)");dg.addColorStop(1,"rgba("+sh.join(",")+",.30)");
    ctx.fillStyle=dg;ctx.fillRect(0,H*.62,W,H*.38);
  }
  drawPOI(tr,camx,camy,p);
  /* средний масштаб между валуном и постройкой — тем же светом и той же
     породой, что грунт под ним (21b-surface-deco) */
  drawDeco(tr,camx,camy,p);
  /* ваши постройки — тем же слоем, что и POI: их видно с земли, заходить
     в меню, чтобы узнать об их существовании, больше не нужно */
  drawBuilt(tr,camx,camy,p);
  /* дом стоит на своей планете (21f, M170) — до него доходят ногами */
  if(typeof drawHomeOut==="function"&&typeof homeHereP==="function"&&homeHereP(p))
    drawHomeOut(tr,camx,camy,p);
  /* посёлок (12t) — тем же слоем, что и постройки: место, к которому игрок идёт
     ногами, обязано быть видно с горизонта, иначе идти не за чем */
  if(settleCanLive(p))settleDraw(settleAt(G.sx,G.sy),tr,camx,camy,p);
  /* Жестянка (12z) — тем же слоем и по тому же правилу: то, к чему игрок идёт
     ногами, видно с горизонта. Там, где стоит она, посёлка не бывает */
  if(tinCanLive(p))tinDraw(tinAt(G.sx,G.sy),tr,camx,camy,p);
  /* чужой знак (11ag) — до валунов переднего плана: он лежит на земле, и камень
     перед ним обязан его закрывать, иначе прорез читается как наклейка */
  if(typeof traceDraw==="function")traceDraw(tr,camx,camy,p);
  drawRocks(tr,camx,camy,p.T.pal);
  /* подглядка стелется по грунту, поэтому ложится до кустов и до валунов
     переднего плана — она часть земли, а не то, что на ней стоит (20c) */
  peepDrawMat(camx,camy);
  /* уезд света (11i): пятна по формам и освещённая площадка — тем же слоем, что мат */
  if(typeof glowDrawPatches==="function"){glowDrawPatches(tr,camx,camy,p);glowDrawPad(S,camx,camy);}
  if(typeof slowDraw==="function")slowDraw(tr,camx,camy,p);   /* выкладка долины (11o) */
  if(typeof passDraw==="function")passDraw(tr,camx,camy,p);   /* корабль перевала (11p) */
  if(typeof placeDraw==="function")placeDraw(tr,camx,camy,p); /* единичные места (11v) */
  /* тень по длине корпуса, а не по прежним 34 px: у нового посадочного силуэта
     она иначе выдаёт игрушку на палочках */
  groundShadow(S.shipX-camx,S.shipY-camy+12,landerLen(G.shipId)*.46,8);
  ctx.save();ctx.translate(S.shipX-camx,S.shipY-camy);
  /* стоим: шасси выпущено, трап спущен, сопла ещё остывают после посадки */
  drawLander(false,false,{gear:1,sq:0,landed:true,tr:S.tr,gx:S.shipX,
    hot:Math.max(0,1-(G.t-(S.t0||0))/700)});
  ctx.restore();
  drawDustMotes(camx,camy,p);
  /* три света (11g): дороги, фундаменты и вход — видны только в соединение */
  if(typeof lightsDrawReveal==="function")lightsDrawReveal(tr,camx,camy,p);
  if(S.cave){
    const cx=S.cave.x-camx;
    if(cx>-60&&cx<W+60){
      const cy=groundAt(tr,S.cave.x)-camy;
      ctx.fillStyle="#050708";
      ctx.beginPath();ctx.ellipse(cx,cy-2,20,14,0,0,Math.PI,true);ctx.fill();
      ctx.fillStyle="rgba(93,115,130,.85)";ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
      ctx.fillText("ПЕЩЕРА",cx,cy-22);
    }
  }
  for(const pl of S.plants){
    const x=pl.x-camx;if(x<-70||x>W+70)continue;
    groundShadow(x,pl.y-camy+1,Math.min(22,pl.h*.32),3.2);
    /* растение кланяется от основания: высокое сильнее низкого, у каждого своя
       фаза от координаты — иначе куртина качается одним куском */
    const sw=WIND*.055*(.6+pl.h/90)*(.75+.25*Math.sin(G.t*.028+pl.x*.05));
    ctx.save();ctx.translate(x,pl.y-camy);ctx.rotate(sw);
    drawPlant(pl,0,0);
    ctx.restore();
  }
  for(const b of S.fauna||[]){
    const x=b.x-camx;if(x<-50||x>W+50)continue;
    groundShadow(x,b.y-camy+1,b.r*.9,2.6);
    drawBeast(b,x,b.y-camy,false,0);
    if(b.scanned){
      ctx.fillStyle="rgba(127,230,216,.75)";ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
      ctx.fillText("ИЗУЧЕН",x,b.y-camy-b.r*2.6);
    }
  }
  /* идущие — позади астронавта и поверх кустов: они на лугу, а не за ним (20c) */
  peepGhosts(camx,camy);
  for(const d of S.deposits){
    if(d.left<=0)continue;
    const x=d.x-camx;if(x<-50||x>W+50)continue;
    const y=d.y-camy,col=RES[d.res].col;
    /* тело залежи — выход породы по виду сырья (21b, M169): три треугольника
       и пульсирующий круг были значком интерфейса, приклеенным к миру */
    const near=clamp(1-Math.abs(d.x-S.x)/120,0,1);
    drawDeposit(x,y,d.res,d.left,near,d.x,p.T.pal[3]);
    if(Math.abs(d.x-S.x)<70){
      ctx.fillStyle=col;ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
      /* соседние залежи разводим по высоте: рядом стоящие подписи наезжали друг
         на друга и читались как каша из двух названий */
      ctx.fillText(RES[d.res].ru.toUpperCase()+" "+d.left,x,y-24-(Math.round(d.x/60)%2)*11);
    }
    if(S.mining===d){
      ctx.fillStyle="rgba(0,0,0,.5)";ctx.fillRect(x-18,y-20,36,4);
      ctx.fillStyle=col;ctx.fillRect(x-18,y-20,36*clamp(d.prog,0,1),4);
    }
  }
  /* астронавт рисуется по своей координате, а не в центре экрана: с инерцией
     и взглядом вперёд центр экрана — уже не он */
  const x=S.x-camx,y=S.y-camy;
  /* следы гаснут за минуту: пыль оседает, и тропа остаётся только там, где
     ходили только что — так видно, откуда пришёл */
  if(S.tracks&&S.tracks.length){
    for(const tk of S.tracks){
      const age=G.t-tk.t;if(age>2400)continue;
      const tx=tk.x-camx;if(tx<-10||tx>W+10)continue;
      const ty=groundAt(tr,tk.x)-camy;
      ctx.fillStyle="rgba(0,0,0,"+(.45*(1-age/2400)).toFixed(3)+")";
      ctx.fillRect(tx-2.6,ty-1.2,5.2,1.6);
      ctx.fillStyle="rgba(255,255,255,"+(.08*(1-age/2400)).toFixed(3)+")";
      ctx.fillRect(tx-2.6,ty+.4,5.2,.8);
    }
  }
  if(S.on)groundShadow(x,y+1,7,2);
  ctx.save();ctx.translate(x,y-1);
  drawAstronaut({face:S.face,amp:S.walkAmp,phase:S.walkPhase,
    air:!S.on,jet:!!S.jetOn,mining:!!S.mining,suitLow:S.suit<25});
  ctx.restore();
  if(S.mining){
    ctx.strokeStyle="rgba(242,178,92,.7)";ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(x+S.face*6,y+2);
    ctx.lineTo(S.mining.x-camx,S.mining.y-camy-4);ctx.stroke();
  }
  /* лучи и свёртка — последними, поверх всего мира и до приборов: приборы
     должны остаться читаемыми, их виньетка касаться не должна */
  /* погода поверх мира, но под лучами и свёрткой: осадки идут перед игроком,
     а свет и цветокоррекция ложатся уже на всё вместе */
  drawForeground(tr,camx,camy,p);
  drawWeather(p,camx,camy);
  /* ── ночь (хвост G12) ──
     Кадр уходит в тень неба, и единственный свет — фонарь скафандра: спрайт
     один на игру, кладётся одним drawImage, чуть впереди по взгляду */
  {
    const nite=surfNight(p);
    if(nite>.02){
      ctx.fillStyle="rgba(4,6,14,"+(nite*.72).toFixed(3)+")";ctx.fillRect(0,0,W,H);
      const LS=glowSprite("suitlamp",()=>{
        const g=ctx.createRadialGradient(0,0,0,0,0,1);
        g.addColorStop(0,"rgba(255,236,200,.55)");g.addColorStop(.35,"rgba(255,236,200,.22)");
        g.addColorStop(1,"rgba(255,236,200,0)");
        ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);
      });
      ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=nite*1.3;
      glowBlit(LS,x+S.face*36,y-6,150);
      ctx.restore();
    }
  }
  lightShafts(p);
  gradePass(p);
  drawSurfaceHud(camx,camy);
}
