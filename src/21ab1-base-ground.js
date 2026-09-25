/* ══════════════ база: небо, гора и порода (выделено из 21ac, M413) ══════════════
   Половина `drawBase` рисовала не базу, а МЕСТО, в котором она стоит: небо
   планеты, два плана дальнего рельефа, гору с плато и уступом, почвенный
   профиль, зерно породы, валуны, отвал и ворота в склоне. Это самостоятельный
   слой — он не знает ни про отсеки, ни про курсор, ни про приборную доску, —
   и держать его в одном файле с ними мешало обоим: файл перевалил за 70 КБ и
   перестал читаться целиком.

   Порядок склейки: `21ab1-` ложится между `21ab-base-interiors` и
   `21ac-base-draw` (байтовый порядок: '-' < '1' < 'a'). Своих `const` на
   верхнем уровне здесь нет, так что место в склейке ни на что не влияет,
   кроме читаемости.

   ── видеокарта (G11) ──
   Слой рисовался заново каждый кадр: четыре тысячи чёрточек зерна, пласты,
   профиль, валуны — всё ради картинки, которая от кадра к кадру не меняется.
   Теперь это ВЫПЕЧКИ в мировых координатах (21ad): гора, порода и наземное
   пекутся один раз, небо и две гряды — своими полосами с параллаксом. Кисти
   ниже рисуют в мире, а не на экране: X и Y — тождество, ширина — прямоугольник
   выпечки, а не W. Попутно зерно и валуны привязаны к породе: раньше они
   стояли на экране, и камень под ними ехал вместе с камерой. Мигающие огни
   мачты и площадки — живые фигуры (`baseGroundLive`), свет ворот — в поле
   света (21ad). Материал планеты кладёт поле света: у 2D он был узором с
   overlay, у видеокарты — фактура, которую свет умножает. */
/* гора: горб над базой, склон к равнине, плато вправо. Высота — до верха
   кадра при самой высокой камере (раньше считалась от камеры, и форма горы
   менялась, когда камера ехала вниз) */
function baseHump(wx){
  const bMidX=BASE_OX+BASE_COLS*BCELL_W*.5, bHalf=BCELL_W*BASE_COLS*.62;
  const mtnX0=BASE_GATE_X-95, mtnTop=Math.max(40,BASE_GY+120-22);
  const u=clamp((wx-mtnX0)/(bHalf*.95),0,1), s=u*u*(3-2*u);
  const plateau=clamp((wx-bMidX)/(bHalf*2.2),0,1)*14;
  return s*mtnTop-plateau;
}
/* кромка грунта в мировой точке: мелкий рельеф из того же шума, что и планета.
   Её же читают дым плавильни и огни наземного — все садятся на одну кромку */
function baseSurfY(B,wx){
  const hump=baseHump(wx);
  const wob=(fbm2(wx*.008,3.3,B.idx*77+13,3)-.5)*16;
  const fine=(fbm2(wx*.032,7.1,B.idx*77+31,3)-.5)*9*(hump>4?1:.4);
  return BASE_GY+wob+fine-hump;
}
/* путь породы (бывший Path2D GP): видеохолст берёт только текущий путь,
   поэтому он строится заново на каждую заливку и клип */
function baseGroundPath(B,R){
  ctx.beginPath();ctx.moveTo(R.x0-2,R.y1+2);ctx.lineTo(R.x0-2,baseSurfY(B,R.x0-2));
  for(let x=R.x0-2;x<=R.x1+8;x+=6)ctx.lineTo(x,baseSurfY(B,x));
  ctx.lineTo(R.x1+8,R.y1+2);ctx.closePath();
}
function baseSkyOf(pl){return pl?pl.T.sky:[[20,24,34],[8,10,16]];}
/* небо и дальняя гряда — одна полоса: градиент вертикальный, и сдвиг по x ему
   безразличен. u — координата гряды (экран + камера × параллакс) */
function baseSkyPaint(B,pl,R){
  const sky=baseSkyOf(pl),gy=BASE_GY;
  const g=ctx.createLinearGradient(0,-140,0,gy);
  g.addColorStop(0,"rgb("+sky[1].join(",")+")");
  g.addColorStop(1,"rgb("+sky[0].join(",")+")");
  ctx.fillStyle=g;ctx.fillRect(R.x0,R.y0,R.x1-R.x0,R.y1-R.y0);
  baseRidgePaint(B,pl,R,0);
}
/* дальняя гряда выше и бледнее (её съедает воздух), ближняя ниже и темнее.
   Частота у обеих заметная: на низкой шум давал почти прямую линию, и
   «рельеф» читался просто второй полосой краски */
function baseRidgePaint(B,pl,R,pl2){
  const sky=baseSkyOf(pl),gy=BASE_GY,far=pl2===0;
  const amp=far?24:30, base0=gy-(far?34:6);
  ctx.fillStyle=rgba(mixc(sky[0],[12,14,20],far?.45:.78),far?.75:.95);
  ctx.beginPath();ctx.moveTo(R.x0,R.y1);
  for(let u=R.x0;u<=R.x1+6;u+=6){
    const wx=u*.005;
    ctx.lineTo(u,base0-fbm2(wx,pl2*4.7+B.idx,B.idx*53+9,4)*amp-Math.sin(wx*3.1+pl2)*amp*.25);
  }
  ctx.lineTo(R.x1+6,R.y1);ctx.closePath();ctx.fill();
}
/* маска для поля света (21ad): красный — порода, зелёный — сооружение.
   Выработка берётся шире на четыре пикселя (переборки по краям застройки
   стоят в её кромке), и к ней — ствол M396 и плиты перекрытий: бетон
   не зернится и не стынет, как камень */
function baseMaskPaint(B,R){
  ctx.fillStyle="#f00";baseGroundPath(B,R);ctx.fill();
  ctx.globalCompositeOperation="lighter";ctx.fillStyle="#0f0";
  baseRoomTrace(B,2);
  const sh=baseShaftBox(B);ctx.rect(sh.sx0,sh.y0,sh.sw,sh.y1-sh.y0);
  let gc0=BASE_COLS,gc1=-1;
  for(let r=0;r<baseRows(B);r++)for(let c=0;c<BASE_COLS;c++)if(baseCell(B,c,r)){gc0=Math.min(gc0,c);gc1=Math.max(gc1,c);}
  if(gc1>=0)for(let r=1;r<=baseDeep(B);r++){
    const y=BASE_OY+r*BCELL_H;ctx.rect(BASE_OX+gc0*BCELL_W-6,y-7,(gc1-gc0+1)*BCELL_W+12,11);
  }
  ctx.fill();
  ctx.globalCompositeOperation="source-over";
}
function baseGroundPaint(B,pl,R){
  const sky=baseSkyOf(pl);
  const pal=pl?pl.T.pal:[[70,58,46],[52,42,34],[38,30,24],[26,20,16],[18,14,11]];
  const gy=BASE_GY, RW=R.x1-R.x0;
  /* пыль у горизонта: воздух между базой и грядой */
  const dg=ctx.createLinearGradient(0,gy-54,0,gy);
  dg.addColorStop(0,"rgba("+sky[0].join(",")+",0)");
  dg.addColorStop(1,"rgba("+sky[0].join(",")+",.35)");
  ctx.fillStyle=dg;ctx.fillRect(R.x0,gy-54,RW,54);
  /* ── база сидит в ГОРЕ, а не под степью ──
     Кромка была почти прямой линией с мелкой рябью: база лежала под ровным
     полем, и верхний ряд отсеков упирался в небо. На образце, по которому это
     переделывается, убежище врезано в толщу холма — над верхним ярусом висит
     масса породы, и именно она объясняет, почему вход один, а всё остальное
     внизу. Гора строится тем же шумом, но с большой амплитудой и горбом ровно
     над базой: середина сооружения — вершина, к краям склон уходит вниз.
     Мелкая рябь остаётся сверху: гора не должна быть гладким куполом.
     ── не холм, а ГОРА (M137) ── в образце гора занимает кадр до верха, равнина
     остаётся слева, и в гору ЗАХОДЯТ сбоку — ворота врезаны в её подошву. */
  const bMidX=BASE_OX+BASE_COLS*BCELL_W*.5;
  const GP=()=>baseGroundPath(B,R);
  /* Порода — это НЕ палитра поверхности: пески и зелень с картинки планеты под
     землёй читаются как трава и небо (так и вышло с первого раза). Берём тот же
     цвет, но уведённый в тёмное и обесцвеченный — узнаваемо и при этом подземно */
  const rc=i=>mixc(pal[Math.min(i,pal.length-1)],[26,19,14],.66);
  const rock=ctx.createLinearGradient(0,gy-BCELL_H*2.1,0,BASE_OY+baseRows(B)*BCELL_H+120);
  /* холм начинается выше грунта и освещён небом: одной тёмной заливкой он
     читался дырой в небе, а не горой (G9) */
  rock.addColorStop(0,rgba(mixc(rc(0),sky[0],.35),1));
  rock.addColorStop(.3,rgba(rc(1),1));
  rock.addColorStop(.55,rgba(rc(3),1));
  rock.addColorStop(1,rgba(rc(4),1));
  ctx.fillStyle=rock;GP();ctx.fill();
  /* пласты: границы гуляют, поэтому это порода, а не полосатый матрас */
  ctx.save();GP();ctx.clip();
  for(let r=0;r<baseRows(B)+2;r++){
    const y0=150+r*BCELL_H*1.15;
    ctx.beginPath();ctx.moveTo(R.x0,y0);
    for(let x=R.x0;x<=R.x1+10;x+=10)ctx.lineTo(x,y0+(fbm2(x*.004,r*2.7,B.idx*31+5,3)-.5)*26);
    ctx.lineTo(R.x1+10,y0+BCELL_H*1.15);ctx.lineTo(R.x0,y0+BCELL_H*1.15);ctx.closePath();
    ctx.fillStyle=r%2?"rgba(0,0,0,.30)":"rgba(255,255,255,.055)";ctx.fill();
  }
  /* Материал планеты — это её ПОВЕРХНОСТЬ: во всю силу под землёй он читается
     мхом и травой. Умножением уводим всё в бурое: фактура остаётся, зелень
     уходит, и разрез начинает выглядеть разрезом. Саму фактуру кладёт поле
     света (21ad) — умножением, а не overlay: камень темнеет в порах, а не
     покрывается плёнкой */
  ctx.globalCompositeOperation="multiply";
  ctx.fillStyle="rgb(126,94,64)";ctx.fillRect(R.x0,R.y0,RW,R.y1-R.y0);
  ctx.globalCompositeOperation="source-over";
  ctx.restore();
  /* ── порода у выработки сжата (§16) ──
     Вокруг отсеков стоял один тон: камень у кромки и камень в двадцати метрах
     от неё — одна краска, ступень значения в кадре ровно одна. Ореол идёт ОТ
     ЯЧЕЕК: у каждой краевой ячейки своё круглое затухание, круги наслаиваются
     и дают мягкий обвод по форме выработки. Заливок не больше дюжины. */
  {
    const edge=[];
    for(let r=0;r<baseRows(B);r++)for(let c=0;c<BASE_COLS;c++){
      if(!baseCell(B,c,r))continue;
      /* внутренние ячейки ореола не дают: их всё равно перекроют соседи */
      const nb=(c2,r2)=>c2>=0&&c2<BASE_COLS&&r2>=0&&r2<baseRows(B)&&!!baseCell(B,c2,r2);
      if(nb(c-1,r)&&nb(c+1,r)&&nb(c,r-1)&&nb(c,r+1))continue;
      edge.push([c,r]);
    }
    if(edge.length){
      const step=Math.max(1,Math.ceil(edge.length/12));
      const r0=Math.hypot(BCELL_W,BCELL_H)*.5, r1=r0+BCELL_H*1.2;
      ctx.save();GP();ctx.clip();
      for(let i2=0;i2<edge.length;i2+=step){
        const cx=BASE_OX+edge[i2][0]*BCELL_W+BCELL_W*.5;
        const cy=BASE_OY+edge[i2][1]*BCELL_H+BCELL_H*.5;
        const g2=ctx.createRadialGradient(cx,cy,r0,cx,cy,r1);
        g2.addColorStop(0,"rgba(0,0,0,.30)");g2.addColorStop(1,"rgba(0,0,0,0)");
        ctx.fillStyle=g2;ctx.fillRect(cx-r1,cy-r1,r1*2,r1*2);
      }
      ctx.restore();
    }
  }
  /* ── почвенный профиль (M232) ──
     Верхний слой был одной тёмной полосой — линией среза, а не землёй. Язык
     взят у шахты (M219): дёрн → подпочва с камнями → кора выветривания,
     ломаная, а не тонированная. На безвоздушном мире дёрна нет — реголит и
     щебень, ни одного корня. Всё по кромке силуэта, а не по прямой. */
  ctx.save();GP();ctx.clip();
  {
    const hasTurf=pl?pl.T.atm.indexOf("пригодна")>=0:false;
    const turfC=pl?mixc(pl.T.pal[Math.min(3,pl.T.pal.length-1)],[16,12,8],.5):[40,32,22];
    const subC=pl?mixc(pl.T.pal[Math.min(2,pl.T.pal.length-1)],[30,22,15],.55):[52,42,30];
    const band=(o1,o2,fill)=>{
      ctx.beginPath();ctx.moveTo(R.x0,baseSurfY(B,R.x0)+o1);
      for(let x=R.x0;x<=R.x1+6;x+=6)ctx.lineTo(x,baseSurfY(B,x)+o1);
      for(let x=R.x1+6;x>=R.x0;x-=6)ctx.lineTo(x,baseSurfY(B,x)+o2);
      ctx.closePath();ctx.fillStyle=fill;ctx.fill();
    };
    band(0,hasTurf?4.5:3,"rgba("+turfC.join(",")+","+(hasTurf?".8":".6")+")");
    band(hasTurf?4.5:3,15,"rgba("+subC.join(",")+",.4)");
    /* камни в подпочве, корни в дёрне, обломки коры — привязаны к миру */
    for(let wq=Math.floor(R.x0/9);wq*9<=R.x1;wq++){
      const hs=hashi(wq,B.idx*13+3,0x50F1), x=wq*9, sy0=baseSurfY(B,x);
      if((hs&7)<3){                                  // камень
        const ry2=sy0+5+((hs>>>4)%9);
        ctx.fillStyle="rgba(0,0,0,.5)";
        ctx.beginPath();ctx.ellipse(x,ry2,1+((hs>>>7)&1)*1.6,.9+((hs>>>8)&1)*.9,0,0,TAU);ctx.fill();
        ctx.fillStyle="rgba(226,206,176,.2)";ctx.fillRect(x-.9,ry2-1.5,1.6,.8);
      }
      if(((hs>>>3)&7)<3){                            // обломок коры выветривания
        ctx.fillStyle="rgba(0,0,0,.20)";
        ctx.fillRect(x,sy0+15+((hs>>>9)%12),3+((hs>>>6)&3),.9);
      }
      if(hasTurf&&(hs%23)===0){                      // редкий корень
        ctx.strokeStyle="rgba("+turfC.join(",")+",.7)";ctx.lineWidth=.9;
        ctx.beginPath();ctx.moveTo(x,sy0+3);
        ctx.quadraticCurveTo(x+((hs>>>5)&3)-1.5,sy0+6.5,x+((hs>>>7)&7)-3.5,sy0+9+((hs>>>10)&3));
        ctx.stroke();
      }
    }
  }
  ctx.restore();
  /* кромка холма ловит небо: полоса света внутрь от силуэта и волосок по краю */
  ctx.save();GP();ctx.clip();
  ctx.strokeStyle=rgba(sky[0],.16);ctx.lineWidth=14;GP();ctx.stroke();
  ctx.strokeStyle=rgba(mixc(sky[0],[255,255,255],.3),.30);ctx.lineWidth=2.4;ctx.stroke();
  ctx.restore();
  /* ── уступ плато (хвост M137) ──
     Справа от вершины гора была одной плоской стеной породы. Уступ: верхняя
     грань плато отодвинута вглубь и ловит небо, под ней тень ступени, ниже —
     та же стена. Два плана в одном склоне без второго силуэта. */
  ctx.save();GP();ctx.clip();
  {
    const tx0=bMidX+40;
    const TP=()=>{ctx.beginPath();ctx.moveTo(tx0,BASE_GY-baseHump(tx0));
      for(let x=tx0;x<=R.x1+6;x+=6){
        const u=clamp((x-tx0)/160,0,1);
        ctx.lineTo(x,BASE_GY-baseHump(x)+u*(44+fbm2(x*.007,5.5,B.idx*77+61,3)*38));
      }
      ctx.lineTo(R.x1+6,R.y0-10);ctx.lineTo(tx0,R.y0-10);ctx.closePath();};
    ctx.fillStyle=rgba(mixc(rc(0),sky[0],.30),.6);TP();ctx.fill();
    ctx.strokeStyle="rgba(0,0,0,.45)";ctx.lineWidth=6;ctx.stroke();
    ctx.strokeStyle=rgba(mixc(sky[0],[255,255,255],.2),.22);ctx.lineWidth=1.6;ctx.stroke();
  }
  ctx.restore();
  /* ── зерно породы ──
     Пласты у базы были, а зерна не было, и разрез читался полосатым матрасом:
     шахта (`23-mode-dig`) прошла ровно через эту ошибку и лечится тем же —
     камень узнают не по слоям, а по СОРУ в них. Мелкие чёрточки вдоль пласта,
     редкие светлые крупинки и совсем редкие тёмные конкреции. Всё держится на
     seed базы и лежит в породе: картинка у каждой базы своя и не едет. */
  ctx.save();GP();ctx.clip();
  const gy0=gy-BCELL_H*1.9, gh=R.y1-gy0;
  if(gh>0){
    const GR=rng(hashi(B.idx||1,0xB0CE,7));
    /* число зёрен считается от ПЛОЩАДИ, а не берётся числом */
    const gn=Math.min(9000,Math.round(RW*gh/380));
    /* матрица «закон × поверхность» (аудит 30.08): порода базы — та же кисть
       CUN, что у шахты рядом: угол из поля, манера из таблицы */
    const M=(typeof CUN!=="undefined"&&pl)?(CUN[pl.type]||CUN.rocky):null;
    for(let i=0;i<gn;i++){
      const px=R.x0+GR()*RW, py=gy0+GR()*gh;
      const t=GR();
      if(t<.72){                                  // сор — МАНЕРОЙ породы (皴)
        if(M&&!M.dot){
          const ang=dirAt(px,py,(pl.seed|0)^0xBA5E,1/300)+(GR()-.5)*M.jig;
          const ln=(2.2+GR()*3.4)*M.ln;
          ctx.strokeStyle="rgba(0,0,0,"+(.20+GR()*.20).toFixed(3)+")";
          ctx.lineWidth=Math.min(1.2,M.w);
          ctx.beginPath();
          ctx.moveTo(px-Math.cos(ang)*ln,py-Math.sin(ang)*ln);
          ctx.lineTo(px+Math.cos(ang)*ln,py+Math.sin(ang)*ln);
          ctx.stroke();
        }else{
          ctx.fillStyle="rgba(0,0,0,"+(.22+GR()*.22).toFixed(3)+")";
          ctx.fillRect(px,py,1+GR()*1.6,.9);
        }
      }else if(t<.94){                            // крупинка, поймавшая свет
        ctx.fillStyle="rgba(226,206,176,"+(.12+GR()*.13).toFixed(3)+")";
        ctx.fillRect(px,py,.9,.9);
      }else{                                      // конкреция покрупнее
        ctx.fillStyle="rgba(0,0,0,.18)";
        ctx.beginPath();ctx.ellipse(px,py,1.6+GR()*2.2,1+GR()*1.2,GR(),0,TAU);ctx.fill();
        ctx.fillStyle="rgba(226,206,176,.06)";
        ctx.fillRect(px-1,py-1.2,1.6,.7);
      }
    }
    /* ── валуны и прожилки ──
       В толще лежат крупные глыбы и жилы — по ним и понятно, сколько тут
       метров. Глыба — тёмное тело со светлой верхней гранью (свет один и тот
       же на весь кадр, сверху), жила — тонкая наклонная нить. */
    const BR=rng(hashi(B.idx||1,0x9B0D,3)), nb=Math.round(RW/760*26), nv=Math.round(RW/760*14);
    for(let i=0;i<nb;i++){
      const px=R.x0+BR()*RW, py=gy0+BR()*gh;
      const rr=4+BR()*BR()*22;
      ctx.fillStyle="rgba(0,0,0,.30)";
      ctx.beginPath();ctx.ellipse(px,py,rr,rr*.72,BR()*.6-.3,0,TAU);ctx.fill();
      ctx.fillStyle="rgba(228,212,186,.055)";
      ctx.beginPath();ctx.ellipse(px-rr*.16,py-rr*.26,rr*.72,rr*.30,BR()*.5-.25,0,TAU);ctx.fill();
    }
    ctx.lineWidth=.8;
    for(let i=0;i<nv;i++){
      const px=R.x0+BR()*RW, py=gy0+BR()*gh, ln=16+BR()*46, an=BR()*.8-.4;
      ctx.strokeStyle=(i&3)?"rgba(214,196,164,.07)":"rgba(196,146,88,.10)";
      ctx.beginPath();ctx.moveTo(px,py);
      ctx.lineTo(px+Math.cos(an)*ln,py+Math.sin(an)*ln);ctx.stroke();
    }
  }
  ctx.restore();
  /* ── наземное ставится ПОСЛЕ породы ──
     Гора рисуется поверх всего, что стояло на поверхности, и мачта с воротами
     уходили под склон. Наземное идёт после грунта и садится на ВЫСОТУ СКЛОНА
     в своей точке. Мигалки — живые фигуры (`baseGroundLive`) */
  {
    /* мачта связи — на вершине горы, а не на равнине: оттуда её и видно */
    const mx2=bMidX+18, my2=BASE_GY-baseHump(bMidX+18)+4;
    ctx.strokeStyle="rgba(30,36,44,.9)";ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(mx2,my2);ctx.lineTo(mx2,my2-48);ctx.stroke();
    ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(mx2-7,my2-6);ctx.lineTo(mx2,my2-20);ctx.lineTo(mx2+7,my2-6);ctx.stroke();
    /* ── площадка на плато (хвост M137) ── полка, врезанная в склон, бетонный
       борт и строка огней по краю (огни — живые) */
    if(basePadUp(B)){
      const pxs=BASE_OX+BASE_COLS*BCELL_W-60, py=BASE_GY-baseHump(pxs)+2;
      ctx.fillStyle="rgba(16,18,22,.95)";
      ctx.fillRect(pxs-58,py-4,116,14);                 // полка, врезанная в склон
      ctx.fillStyle="rgba(44,50,60,.98)";
      ctx.beginPath();ctx.moveTo(pxs-52,py-4);ctx.lineTo(pxs-44,py-12);
      ctx.lineTo(pxs+44,py-12);ctx.lineTo(pxs+52,py-4);ctx.closePath();ctx.fill();
      ctx.fillStyle="rgba(150,164,180,.35)";ctx.fillRect(pxs-44,py-12,88,1.4);
      for(let i=0;i<7;i++){                             // гнёзда огней: погашенный огонь
        ctx.fillStyle="rgba(127,230,216,.25)";
        ctx.beginPath();ctx.arc(pxs-36+i*12,py-14,2,0,TAU);ctx.fill();
      }
      if(typeof drawVanSmall==="function")drawVanSmall(pxs-4,py-12,B);   /* машина базы на плато (M498) */
    }
    /* ── отвал у ворот (G9) ── из горы вырубили пять ярусов, а породы снаружи
       не было ни горсти. Тело в цвет породы, светлая кромка, сор по склону */
    {
      const hx=BASE_GATE_X-74, hy=BASE_GY+4, hw=62, hh=24;
      ctx.fillStyle=rgba(rc(1),1);
      ctx.beginPath();ctx.moveTo(hx-hw,hy);
      ctx.quadraticCurveTo(hx-hw*.45,hy-hh*1.1,hx+6,hy-hh);
      ctx.quadraticCurveTo(hx+hw*.6,hy-hh*.7,hx+hw,hy);ctx.closePath();ctx.fill();
      ctx.fillStyle=rgba(mixc(rc(0),sky[0],.4),.55);
      ctx.beginPath();ctx.moveTo(hx-hw*.7,hy-hh*.45);
      ctx.quadraticCurveTo(hx-hw*.3,hy-hh*1.02,hx+6,hy-hh);
      ctx.quadraticCurveTo(hx+hw*.3,hy-hh*.9,hx+hw*.5,hy-hh*.5);
      ctx.lineTo(hx+6,hy-hh*.72);ctx.closePath();ctx.fill();
      const HR=rng(hashi(B.idx||1,0x5E4F,2));
      for(let i=0;i<26;i++){
        const u=HR()*2-1, px=hx+u*hw*.85, py=hy-(1-Math.abs(u))*hh*HR()*.9;
        ctx.fillStyle=HR()<.7?"rgba(0,0,0,.35)":"rgba(226,206,176,.18)";
        ctx.fillRect(px,py,1.2+HR()*2,1);
      }
    }
    /* ── ворота в склоне ── бетонный портал, откатная плита из двух половин,
       косяки, порог и тёплая щель — свет изнутри. Вход у ПОДОШВЫ склона: к нему
       подъезжают, а не забираются; от него коридор ведёт к стволу лифта */
    {
      const gx=BASE_GATE_X+34, gwd=68, ghh=40, gyy=BASE_GY+4;
      const eff=basePower(B).eff;
      ctx.fillStyle="rgba(24,27,33,.98)";
      ctx.beginPath();
      ctx.moveTo(gx-gwd/2-7,gyy);ctx.lineTo(gx-gwd/2-3,gyy-ghh-8);
      ctx.lineTo(gx+gwd/2+3,gyy-ghh-8);ctx.lineTo(gx+gwd/2+7,gyy);
      ctx.closePath();ctx.fill();                       // портал
      ctx.fillStyle="rgba(46,52,62,.98)";
      ctx.fillRect(gx-gwd/2,gyy-ghh,gwd,ghh);           // плита
      ctx.fillStyle="rgba(18,21,26,.9)";
      for(let i=0;i<4;i++)ctx.fillRect(gx-gwd/2+4+i*(gwd-8)/4,gyy-ghh+3,3,ghh-6);
      ctx.fillStyle="rgba(255,206,140,"+(.30+eff*.4).toFixed(2)+")";
      ctx.fillRect(gx-gwd/2,gyy-2.4,gwd,2.4);           // свет из-под плиты
      ctx.fillStyle="rgba(150,164,180,.35)";
      ctx.fillRect(gx-gwd/2-3,gyy-ghh-8,gwd+6,2);       // притолока
      ctx.fillStyle="rgba(78,86,98,.98)";
      ctx.fillRect(gx-gwd/2-9,gyy-ghh-10,7,ghh+10);     // косяки наружу
      ctx.fillRect(gx+gwd/2+2,gyy-ghh-10,7,ghh+10);
      ctx.fillStyle="rgba(150,164,180,.30)";
      ctx.fillRect(gx-gwd/2-9,gyy-ghh-10,1.4,ghh+10);
      ctx.fillRect(gx+gwd/2+2,gyy-ghh-10,1.4,ghh+10);
      ctx.fillStyle="rgba(58,64,74,.98)";
      ctx.fillRect(gx-gwd/2-16,gyy-1,gwd+32,5);         // порог
      ctx.fillStyle="rgba(150,164,180,.28)";ctx.fillRect(gx-gwd/2-16,gyy-1,gwd+32,1.2);
      ctx.fillStyle="rgba(6,8,12,.95)";
      ctx.fillRect(gx-1.5,gyy-ghh+2,3,ghh-3);           // створ между половинами
      ctx.fillStyle="rgba(150,164,180,.18)";
      ctx.fillRect(gx-4,gyy-ghh+2,1,ghh-3);ctx.fillRect(gx+3,gyy-ghh+2,1,ghh-3);
      /* фонарь над притолокой; его конус на порог кладёт поле света */
      ctx.fillStyle="rgba(30,34,40,.98)";ctx.fillRect(gx-5,gyy-ghh-17,10,6);
      ctx.fillStyle="rgba(255,214,150,"+(.35+eff*.5).toFixed(2)+")";ctx.fillRect(gx-3,gyy-ghh-12,6,2);
    }
  }
  /* порода уводится в почти чёрное: на светлые отсеки она обязана работать
     фоном, а не спорить с ними за внимание. Глубинная доля (от камеры) — в поле */
  ctx.fillStyle="rgba(2,4,9,.34)";ctx.fillRect(R.x0,gy,RW,R.y1-gy);
}
/* площадка на плато стоит, если верхний ярус держит целую площадку */
function basePadUp(B){
  for(let c=0;c<BASE_COLS;c++){const cc=baseCell(B,c,0);if(cc&&cc.k==="pad"&&cc.hp>0)return true;}
  return false;
}
/* живое на поверхности: огонь мачты и бегущая строка площадки — фигуры видеокарты */
function baseGroundLive(SH,B,camx,camy){
  const mx=BASE_OX+BASE_COLS*BCELL_W*.5+18, my=BASE_GY-baseHump(mx)+4-50;
  /* мигалка не мигает, а дышит: полсекунды нарастания вместо ступеньки */
  const bl=.25+.65*clamp(.5+Math.sin(G.t*.06)*2,0,1);
  SH.push([1,mx-camx,my-camy,2.2,0,0,0,255,110,90,bl]);
  if(basePadUp(B)){
    const pxs=BASE_OX+BASE_COLS*BCELL_W-60, py=BASE_GY-baseHump(pxs)+2-14, run=(G.t*.08)%7;
    for(let i=0;i<7;i++){
      /* бегущий огонь с хвостом: соседний ещё не погас */
      const d=(run-i+7)%7, on=d<1?1:Math.max(0,2-d)*.45;
      if(on>.02)SH.push([1,pxs-36+i*12-camx,py-camy,2,0,0,0,127,230,216,Math.min(.7,on*.7)]);
    }
  }
}
