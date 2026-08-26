/* ══════════════ база: рисование разреза ══════════════ */
/* Отпилено от 21a-mode-base по шву «рисование разреза» (2026-08-23): там —
   сетка, энергия, ленивое время, налёты и буря; здесь — только кадр. */
/* ── база в разрезе ──
   Прежняя версия рисовала таблицу: коричневый прямоугольник, полосатые ряды,
   и на каждой ячейке — рамка, включая пустые. Ровно та же ошибка, что была в
   шахте до M60: на экране читалась сетка, а не порода.

   Лечится тем же приёмом. Порода — материал планеты (`planetMat`) поверх пластов,
   темнеющих с глубиной. Помещения не обводятся по клеткам: все построенные
   отсеки собираются в ОДИН путь, он вырезается тьмой, и только по его кромке
   идёт грань со светом сверху и тенью снизу. Пустая клетка не рисуется вовсе —
   там просто порода, в которой ещё не прорубились. */
function baseRoomPath(B,X,Y,pad){
  const P=new Path2D();
  /* соседние отсеки — одна выработка, а не ряд коробок: идущие подряд ячейки
     собираются в один прямоугольник, иначе между ними остаётся полоска породы
     и разрез снова читается таблицей */
  for(let r=0;r<baseRows(B);r++){
    let run=-1;
    for(let c=0;c<=BASE_COLS;c++){
      const has=c<BASE_COLS&&!!baseCell(B,c,r);
      if(has&&run<0)run=c;
      if(!has&&run>=0){
        P.rect(X(BASE_OX+run*BCELL_W)+pad,Y(BASE_OY+r*BCELL_H)+pad,
               (c-run)*BCELL_W-pad*2,BCELL_H-pad*2);
        run=-1;
      }
    }
  }
  /* ствол лифта — тоже пустота, и он связывает уровни в одно сооружение.
     Копаем его лишь до самого нижнего построенного яруса: пустая шахта
     в нетронутой породе выглядит как забытая линия */
  let deep=1;
  for(let r=0;r<baseRows(B);r++)for(let c=0;c<BASE_COLS;c++)if(baseCell(B,c,r))deep=Math.max(deep,r+1);
  const lx=X(cellX(Math.floor(BASE_COLS/2)));
  P.rect(lx-13,Y(BASE_OY),26,deep*BCELL_H);
  /* тоннель от ворот на равнине к верхнему ярусу: ворота — на уровне земли,
     пол верхнего яруса — тоже, между ними прорублен ход */
  P.rect(X(BASE_GATE_X),Y(BASE_GY-40),BASE_OX-BASE_GATE_X,40);
  return P;
}
function drawBase(){
  const S=G.base,B=S.B,P=basePower(B);
  const camx=clamp(S.x-W/2,-40,BASE_OX+BASE_COLS*BCELL_W+90-W);
  const camy=clamp(S.y-H/2,-120,baseRows(B)*BCELL_H+260-H);
  const X=x=>x-camx, Y=y=>y-camy;
  const pl=G.sys.planets[B.idx];
  const sky=pl?pl.T.sky:[[20,24,34],[8,10,16]];
  const pal=pl?pl.T.pal:[[70,58,46],[52,42,34],[38,30,24],[26,20,16],[18,14,11]];
  const gy=Y(150);                                   // уровень грунта
  /* ── небо и поверхность ── */
  const g=ctx.createLinearGradient(0,Y(-140),0,gy);
  g.addColorStop(0,"rgb("+sky[1].join(",")+")");
  g.addColorStop(1,"rgb("+sky[0].join(",")+")");
  ctx.fillStyle=g;ctx.fillRect(0,0,W,Math.max(0,gy));
  /* Четверть кадра занимала ровная заливка — небо было пустым полем краски.
     Ставим два плана дальнего рельефа (дальний светлее и выше по горизонту),
     пыль у самой земли и то, что база построила на поверхности. */
  if(gy>0){
    for(let pl2=0;pl2<2;pl2++){
      const far=pl2===0;
      /* дальняя гряда выше и бледнее (её съедает воздух), ближняя ниже и темнее.
         Частота у обеих заметная: на низкой шум давал почти прямую линию, и
         «рельеф» читался просто второй полосой краски */
      const amp=far?24:30, base0=gy-(far?34:6), par=far?.3:.6;
      ctx.fillStyle=rgba(mixc(sky[0],[12,14,20],far?.45:.78),far?.75:.95);
      ctx.beginPath();ctx.moveTo(0,gy+2);
      for(let sx2=0;sx2<=W;sx2+=6){
        const wx=(sx2+camx*par)*.005;
        ctx.lineTo(sx2,base0-fbm2(wx,pl2*4.7+B.idx,B.idx*53+9,4)*amp
                        -Math.sin(wx*3.1+pl2)*amp*.25);
      }
      ctx.lineTo(W,gy+2);ctx.closePath();ctx.fill();
    }
    /* пыль у горизонта: воздух между базой и грядой */
    const dg=ctx.createLinearGradient(0,gy-54,0,gy);
    dg.addColorStop(0,"rgba("+sky[0].join(",")+",0)");
    dg.addColorStop(1,"rgba("+sky[0].join(",")+",.35)");
    ctx.fillStyle=dg;ctx.fillRect(0,Math.max(0,gy-54),W,Math.min(54,gy));
  }
  /* кромка грунта не линейка: мелкий рельеф из того же шума, что и планета.
     Путь держим объектом: fillMaterial клипует по ПЕРЕДАННОМУ пути, а не по
     текущему — иначе материал ляжет в последний нарисованный пласт (так и было) */
  /* ── база сидит в ГОРЕ, а не под степью ──
     Кромка была почти прямой линией с мелкой рябью: база лежала под ровным
     полем, и верхний ряд отсеков упирался в небо. На образце, по которому это
     переделывается, убежище врезано в толщу холма — над верхним ярусом висит
     масса породы, и именно она объясняет, почему вход один, а всё остальное
     внизу. Гора строится тем же шумом, но с большой амплитудой и горбом ровно
     над базой: середина сооружения — вершина, к краям склон уходит вниз.
     Мелкая рябь остаётся сверху: гора не должна быть гладким куполом. */
  /* ── не холм, а ГОРА (M137) ──
     Два горба высотой в полтора отсека давали курган: база читалась вкопанной
     под степь, а верхний ряд упирался в небо. В образце гора занимает кадр до
     верха, равнина остаётся слева, и в гору ЗАХОДЯТ сбоку — ворота врезаны в
     её подошву. Профиль: с равнины склон поднимается к вершине над серединой
     базы и дальше вправо держится плато. Высота — до самого верха кадра. */
  const bMidX=X(BASE_OX+BASE_COLS*BCELL_W*.5);          // середина базы на экране
  const bHalf=BCELL_W*BASE_COLS*.62;
  const bLeft=X(cellX(0))-BCELL_W*.55;
  const mtnX0=X(BASE_GATE_X)-95, mtnTop=Math.max(40,gy-22);
  const humpAt=x=>{
    const u=clamp((x-mtnX0)/(bHalf*.95),0,1), s=u*u*(3-2*u);
    const plateau=clamp((x-bMidX)/(bHalf*2.2),0,1)*14;
    return s*mtnTop-plateau;
  };
  const GP=new Path2D();
  GP.moveTo(0,H);GP.lineTo(0,gy);
  for(let x=0;x<=W;x+=6){
    const hump=humpAt(x);
    const wob=(fbm2((x+camx)*.008,3.3,B.idx*77+13,3)-.5)*16;
    const fine=(fbm2((x+camx)*.032,7.1,B.idx*77+31,3)-.5)*9*(hump>4?1:.4);
    GP.lineTo(x,gy+wob+fine-hump);
  }
  GP.lineTo(W,H);GP.closePath();
  /* Порода — это НЕ палитра поверхности: пески и зелень с картинки планеты под
     землёй читаются как трава и небо (так и вышло с первого раза). Берём тот же
     цвет, но уведённый в тёмное и обесцвеченный — узнаваемо и при этом подземно */
  const rc=i=>mixc(pal[Math.min(i,pal.length-1)],[26,19,14],.66);
  const rock=ctx.createLinearGradient(0,gy-BCELL_H*2.1,0,Y(BASE_OY+baseRows(B)*BCELL_H+120));
  /* холм начинается выше грунта и освещён небом: одной тёмной заливкой он
     читался дырой в небе, а не горой (G9) */
  rock.addColorStop(0,rgba(mixc(rc(0),sky[0],.35),1));
  rock.addColorStop(.3,rgba(rc(1),1));
  rock.addColorStop(.55,rgba(rc(3),1));
  rock.addColorStop(1,rgba(rc(4),1));
  ctx.fillStyle=rock;ctx.fill(GP);
  /* пласты: границы гуляют, поэтому это порода, а не полосатый матрас */
  ctx.save();ctx.clip(GP);
  for(let r=0;r<baseRows(B)+2;r++){
    const y0=150+r*BCELL_H*1.15;
    ctx.beginPath();ctx.moveTo(0,Y(y0));
    for(let x=0;x<=W;x+=10)ctx.lineTo(x,Y(y0)+(fbm2((x+camx)*.004,r*2.7,B.idx*31+5,3)-.5)*26);
    ctx.lineTo(W,Y(y0)+BCELL_H*1.15);ctx.lineTo(0,Y(y0)+BCELL_H*1.15);ctx.closePath();
    ctx.fillStyle=r%2?"rgba(0,0,0,.30)":"rgba(255,255,255,.055)";ctx.fill();
  }
  const mat=pl?planetMat(pl):null;
  if(mat)fillMaterial(mat,camx,camy,.34,.26,GP,{x:0,y:0,w:W,h:H});   // и холму тоже — раньше материал шёл только от грунта вниз (G9)
  /* Материал планеты — это её ПОВЕРХНОСТЬ: во всю силу под землёй он читается
     мхом и травой. Умножением уводим всё в бурое: фактура остаётся, зелень
     уходит, и разрез начинает выглядеть разрезом */
  ctx.globalCompositeOperation="multiply";
  ctx.fillStyle="rgb(126,94,64)";ctx.fill(GP);
  ctx.globalCompositeOperation="source-over";
  /* верхний слой почвы: без него кромка грунта — просто линия среза */
  ctx.save();ctx.clip(GP);
  ctx.fillStyle="rgba(20,14,9,.45)";ctx.fillRect(0,Math.max(0,gy),W,16);
  ctx.restore();
  /* кромка холма ловит небо: полоса света внутрь от силуэта и волосок по краю */
  ctx.save();ctx.clip(GP);
  ctx.strokeStyle=rgba(sky[0],.16);ctx.lineWidth=14;ctx.stroke(GP);
  ctx.strokeStyle=rgba(mixc(sky[0],[255,255,255],.3),.30);ctx.lineWidth=2.4;ctx.stroke(GP);
  ctx.restore();
  /* ── уступ плато (хвост M137) ──
     Справа от вершины гора была одной плоской стеной породы. Уступ: верхняя
     грань плато отодвинута вглубь и ловит небо, под ней тень ступени, ниже —
     та же стена. Два плана в одном склоне без второго силуэта. */
  ctx.save();ctx.clip(GP);
  {
    const tx0=bMidX+40;
    const TP=new Path2D();
    TP.moveTo(tx0,gy-humpAt(tx0));
    for(let x=tx0;x<=W;x+=6){
      const u=clamp((x-tx0)/160,0,1);
      TP.lineTo(x,gy-humpAt(x)+u*(44+fbm2((x+camx)*.007,5.5,B.idx*77+61,3)*38));
    }
    TP.lineTo(W,-10);TP.lineTo(tx0,-10);TP.closePath();
    ctx.fillStyle=rgba(mixc(rc(0),sky[0],.30),.6);ctx.fill(TP);
    ctx.strokeStyle="rgba(0,0,0,.45)";ctx.lineWidth=6;ctx.stroke(TP);
    ctx.strokeStyle=rgba(mixc(sky[0],[255,255,255],.2),.22);ctx.lineWidth=1.6;ctx.stroke(TP);
  }
  ctx.restore();
  /* ── зерно породы ──
     Пласты у базы были, а зерна не было, и разрез читался полосатым матрасом:
     шахта (`23-mode-dig`) прошла ровно через эту ошибку и лечится тем же —
     камень узнают не по слоям, а по СОРУ в них. Мелкие чёрточки вдоль пласта
     (порода слоиста, и зерно ложится по слою, а не как попало), редкие светлые
     крупинки и совсем редкие тёмные конкреции. Всё держится на seed базы,
     поэтому картинка у каждой базы своя и не дрожит между кадрами. */
  ctx.save();ctx.clip(GP);
  /* зерно идёт и по ГОРЕ, а не только ниже прежней линии земли: склон был
     единственным местом кадра без фактуры и читался чёрной вырезкой из
     бумаги. Клип по GP всё равно не пустит его в небо */
  const gy0=Math.max(0,gy-BCELL_H*1.9), gh=H-gy0;
  if(gh>0){
    const GR=rng(hashi(B.idx||1,0xB0CE,7));
    /* число зёрен считается от ПЛОЩАДИ, а не берётся числом: с фиксированной
       полутысячей на широком экране порода снова становилась гладкой */
    const gn=Math.min(4200,Math.round(W*gh/380));
    for(let i=0;i<gn;i++){
      const px=GR()*W, py=gy0+GR()*gh;
      const t=GR();
      if(t<.72){                                  // сор вдоль слоя
        ctx.fillStyle="rgba(0,0,0,"+(.22+GR()*.22).toFixed(3)+")";
        ctx.fillRect(px,py,1+GR()*2.4,.8);
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
       Порода вокруг убежища оставалась ровным полем зерна: масштаба в ней не
       было, и склон читался фоном, а не камнем, в котором прорубились. На
       образце в толще лежат крупные глыбы и жилы — по ним и понятно, сколько
       тут метров. Глыба — тёмное тело со светлой верхней гранью (свет один и
       тот же на весь кадр, сверху), жила — тонкая наклонная нить. */
    const BR=rng(hashi(B.idx||1,0x9B0D,3));
    for(let i=0;i<26;i++){
      const px=BR()*W, py=gy0+BR()*gh;
      const rr=4+BR()*BR()*22;
      ctx.fillStyle="rgba(0,0,0,.30)";
      ctx.beginPath();ctx.ellipse(px,py,rr,rr*.72,BR()*.6-.3,0,TAU);ctx.fill();
      ctx.fillStyle="rgba(228,212,186,.055)";
      ctx.beginPath();ctx.ellipse(px-rr*.16,py-rr*.26,rr*.72,rr*.30,BR()*.5-.25,0,TAU);ctx.fill();
    }
    ctx.lineWidth=.8;
    for(let i=0;i<14;i++){
      const px=BR()*W, py=gy0+BR()*gh, ln=16+BR()*46, an=BR()*.8-.4;
      ctx.strokeStyle=(i&3)?"rgba(214,196,164,.07)":"rgba(196,146,88,.10)";
      ctx.beginPath();ctx.moveTo(px,py);
      ctx.lineTo(px+Math.cos(an)*ln,py+Math.sin(an)*ln);ctx.stroke();
    }
  }
  ctx.restore();
  /* ── наземное ставится ПОСЛЕ породы ──
     Гора рисуется поверх всего, что стояло на поверхности, и мачта с
     воротами уходили под склон: их не было видно вовсе. Наземное теперь
     идёт после грунта и садится на ВЫСОТУ СКЛОНА в своей точке, а не на
     старую плоскую линию земли. */
  {
    /* мачта связи — на вершине горы, а не на равнине: оттуда её и видно */
    {
      const mx2=bMidX+18, my2=Y(150)-humpAt(bMidX+18)+4;
      ctx.strokeStyle="rgba(30,36,44,.9)";ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(mx2,my2);ctx.lineTo(mx2,my2-48);ctx.stroke();
      ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(mx2-7,my2-6);ctx.lineTo(mx2,my2-20);ctx.lineTo(mx2+7,my2-6);ctx.stroke();
      const bl=Math.sin(G.t*.06)>0;
      ctx.fillStyle=bl?"rgba(255,110,90,.9)":"rgba(255,110,90,.25)";
      ctx.beginPath();ctx.arc(mx2,my2-50,2.2,0,TAU);ctx.fill();
    }
    /* ── площадка на плато (хвост M137) ──
       Огни площадки рисовались до горы, на старой линии земли, и склон их
       хоронил. Площадке место на плато справа от вершины: полка, врезанная
       в склон, бетонный борт и строка огней по краю. */
    {
      let hasPad=false;
      for(let c2=0;c2<BASE_COLS;c2++){const cc=baseCell(B,c2,0);if(cc&&cc.k==="pad"&&cc.hp>0)hasPad=true;}
      if(hasPad){
        const pxs=X(BASE_OX+BASE_COLS*BCELL_W-60), py=Y(150)-humpAt(pxs)+2;
        ctx.fillStyle="rgba(16,18,22,.95)";
        ctx.fillRect(pxs-58,py-4,116,14);                 // полка, врезанная в склон
        ctx.fillStyle="rgba(44,50,60,.98)";
        ctx.beginPath();ctx.moveTo(pxs-52,py-4);ctx.lineTo(pxs-44,py-12);
        ctx.lineTo(pxs+44,py-12);ctx.lineTo(pxs+52,py-4);ctx.closePath();ctx.fill();
        ctx.fillStyle="rgba(150,164,180,.35)";ctx.fillRect(pxs-44,py-12,88,1.4);
        for(let i=0;i<7;i++){
          const on=((G.t*.08|0)%7)===i;
          ctx.fillStyle=on?"rgba(127,230,216,.95)":"rgba(127,230,216,.25)";
          ctx.beginPath();ctx.arc(pxs-36+i*12,py-14,2,0,TAU);ctx.fill();
        }
      }
    }
    /* ── отвал у ворот (G9) ──
       Из горы вырубили пять ярусов, а породы снаружи не было ни горсти. Отвал
       лежит на равнине слева от ворот: тело в цвет породы, светлая кромка
       сверху, сор по склону. */
    {
      const hx=X(BASE_GATE_X)-74, hy=Y(150)+4, hw=62, hh=24;
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
    /* вход у ПОДОШВЫ склона, а не на вершине: ворота — это врез в гору на
       уровне земли, к ним подъезжают, а не забираются */
    const gy=Y(150)+6;
    /* ── ворота в склоне ──
       Убежище было врезано в гору, но входа в него снаружи не существовало:
       на поверхности стояла одна мачта, и как люди попадают внутрь, кадр не
       объяснял. Ворота ставятся над стволом лифта, у подошвы горы: бетонный
       портал, откатная плита с рёбрами и тёплая щель по краю — свет изнутри.
       Это же и оправдывает колонну: лифт начинается ровно за ними. */
    {
      /* ворота — в ПОДОШВЕ горы слева, там, где в неё заходят с равнины;
         от них коридор верхнего яруса ведёт к стволу лифта */
      const gx=X(BASE_GATE_X)+34, gwd=68, ghh=40;
      const gyy=gy-2;
      ctx.fillStyle="rgba(24,27,33,.98)";
      ctx.beginPath();
      ctx.moveTo(gx-gwd/2-7,gyy);ctx.lineTo(gx-gwd/2-3,gyy-ghh-8);
      ctx.lineTo(gx+gwd/2+3,gyy-ghh-8);ctx.lineTo(gx+gwd/2+7,gyy);
      ctx.closePath();ctx.fill();                       // портал
      ctx.fillStyle="rgba(46,52,62,.98)";
      ctx.fillRect(gx-gwd/2,gyy-ghh,gwd,ghh);           // плита
      ctx.fillStyle="rgba(18,21,26,.9)";
      for(let i=0;i<4;i++)ctx.fillRect(gx-gwd/2+4+i*(gwd-8)/4,gyy-ghh+3,3,ghh-6);
      /* свет считается от энергобаланса напрямую: `lit` объявляется ниже по
         функции, и обращение к нему отсюда роняло весь кадр */
      ctx.fillStyle="rgba(255,206,140,"+(.30+basePower(B).eff*.4).toFixed(2)+")";
      ctx.fillRect(gx-gwd/2,gyy-2.4,gwd,2.4);           // свет из-под плиты
      ctx.fillStyle="rgba(150,164,180,.35)";
      ctx.fillRect(gx-gwd/2-3,gyy-ghh-8,gwd+6,2);       // притолока
      /* ── ворота как ДВЕРЬ, а не торец тоннеля (хвост M138) ──
         Плита с рёбрами читалась продолжением хода. Дверь узнают по косякам,
         выступающим из стены, порогу под ногами и створу посередине: плита
         раздвижная, из двух половин, между ними тёмная щель. Над притолокой
         фонарь с конусом на порог — вход виден с равнины. */
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
      {
        const lamp=.35+basePower(B).eff*.5;
        ctx.fillStyle="rgba(30,34,40,.98)";ctx.fillRect(gx-5,gyy-ghh-17,10,6);   // фонарь
        ctx.fillStyle="rgba(255,214,150,"+lamp.toFixed(2)+")";ctx.fillRect(gx-3,gyy-ghh-12,6,2);
        const lg=ctx.createLinearGradient(0,gyy-ghh-10,0,gyy+4);
        lg.addColorStop(0,"rgba(255,214,150,"+(lamp*.28).toFixed(3)+")");
        lg.addColorStop(1,"rgba(255,214,150,0)");
        ctx.fillStyle=lg;
        ctx.beginPath();ctx.moveTo(gx-4,gyy-ghh-10);ctx.lineTo(gx+4,gyy-ghh-10);
        ctx.lineTo(gx+gwd*.7,gyy+4);ctx.lineTo(gx-gwd*.7,gyy+4);ctx.closePath();ctx.fill();
      }
    }
  }
  /* свет с глубиной сходит на нет */
  const dk=clamp((camy+H*.5)/2000,0,.42);
  /* порода уводится в почти чёрное: на светлые отсеки она обязана работать
     фоном, а не спорить с ними за внимание. Раньше грунт был светлее
     помещений, и база выглядела дырками в земле */
  ctx.fillStyle="rgba(2,4,9,"+(.34+dk).toFixed(3)+")";ctx.fillRect(0,Math.max(0,gy),W,H);
  ctx.restore();
  /* ── помещения: один путь на всё сооружение ── */
  /* нижний порог света поднят: даже на голодном пайке в отсеке горит лампа,
     иначе половина базы читается нежилой. Разница между сытой и голодной
     базой остаётся, но теперь это «ярко или тускло», а не «видно или нет» */
  const lit=.55+P.eff*.45;
  const RP=baseRoomPath(B,X,Y,6);
  ctx.save();
  /* ── порода примыкает ──
     Отсеки лежали на грунте наклейкой: у выработки была своя рамка, но не было
     СЛЕДА в породе вокруг. Настоящая выработка портит камень: у стенки он темнее
     (свет туда не доходит и порода в трещинах от проходки), и чем дальше, тем
     слабее. Широкая мягкая тень наружу от контура и есть весь приём — она же
     сажает сооружение в грунт, отчего ряды перестают висеть в пустоте. */
  for(const [lw,al] of [[26,.30],[16,.26],[9,.30]]){
    ctx.strokeStyle="rgba(0,0,0,"+al+")";ctx.lineWidth=lw;ctx.stroke(RP);
  }
  /* грань выработки: свет сверху, тень снизу — та же фаска, что у проёма кабины */
  ctx.strokeStyle="rgba(0,0,0,.55)";ctx.lineWidth=9;ctx.stroke(RP);
  /* ── свет внутри, темнота снаружи ──
     Отсеки были темнее породы, и база читалась дырками в земле. У образца,
     на который равняемся, ровно наоборот: жилые коробки СВЕТЯТСЯ на фоне
     почти чёрного грунта, и весь экран держится на этом контрасте — глаз
     сразу видит, где живут, а где просто камень. Заливка выработки теперь не
     чернее ночи, а тёплый полумрак, поверх которого лягут лампы отсеков;
     сама порода вокруг притемнена отдельно. */
  const bgi=ctx.createLinearGradient(0,Y(BASE_OY-10),0,Y(BASE_OY+baseRows(B)*BCELL_H));
  bgi.addColorStop(0,"rgb("+[26,30,38].join(",")+")");
  bgi.addColorStop(1,"rgb("+[14,17,23].join(",")+")");
  ctx.fillStyle=bgi;ctx.fill(RP);
  ctx.strokeStyle="rgba(210,226,240,"+(.10+lit*.10).toFixed(2)+")";ctx.lineWidth=1.4;ctx.stroke(RP);
  ctx.restore();
  /* свет изнутри ложится на породу вокруг отсеков */
  ctx.save();ctx.globalCompositeOperation="lighter";
  for(let r=0;r<baseRows(B);r++)for(let c=0;c<BASE_COLS;c++){
    const cell=baseCell(B,c,r);if(!cell||cell.hp<=0)continue;
    const cx=X(cellX(c)),cy=Y(cellY(r));
    if(cx<-260||cx>W+260)continue;
    const gg=ctx.createRadialGradient(cx,cy,4,cx,cy,BCELL_W*.95);
    const warm=cell.k==="reactor"?[140,240,255]:[242,178,92];
    gg.addColorStop(0,"rgba("+warm.join(",")+","+(.20*lit).toFixed(3)+")");
    gg.addColorStop(1,"rgba("+warm.join(",")+",0)");
    ctx.fillStyle=gg;ctx.beginPath();ctx.arc(cx,cy,BCELL_W*.95,0,TAU);ctx.fill();
  }
  ctx.restore();
  /* ── свет в тоннеле (хвост M138) ──
     Ход от ворот был самой тёмной полостью кадра: прорубленный, но не
     обжитый. Три лампы под сводом, у каждой своё пятно на полу. */
  {
    const ty=Y(BASE_GY-33), step=(BASE_OX-BASE_GATE_X-130)/2;
    ctx.save();ctx.globalCompositeOperation="lighter";
    for(let i=0;i<3;i++){
      const tx=X(BASE_GATE_X+95+i*step);
      if(tx<-80||tx>W+80)continue;
      const gg=ctx.createRadialGradient(tx,ty+8,2,tx,ty+8,54);
      gg.addColorStop(0,"rgba(242,178,92,"+(.22*lit).toFixed(3)+")");
      gg.addColorStop(1,"rgba(242,178,92,0)");
      ctx.fillStyle=gg;ctx.beginPath();ctx.arc(tx,ty+8,54,0,TAU);ctx.fill();
    }
    ctx.restore();
    for(let i=0;i<3;i++){
      const tx=X(BASE_GATE_X+95+i*step);
      ctx.fillStyle="rgba(20,18,14,.95)";ctx.fillRect(tx-4,ty-2,8,3);
      ctx.fillStyle="rgba(255,206,140,"+(.4+lit*.5).toFixed(2)+")";ctx.fillRect(tx-3,ty+1,6,1.6);
    }
  }
  /* ── ствол лифта ──
     Ярусы связывала пара бледных ниток в .3 — сооружение рассыпалось на
     отдельные полки. На образце шахта это ОСВЕЩЁННАЯ КОЛОННА во всю высоту:
     она и держит композицию, и сразу говорит, что уровни — одно здание.
     Внутри тёплый свет и площадка на каждом ярусе, снаружи — тёмные щёки
     обделки, чтобы колонна не сливалась с отсеками. */
  /* глубина считается здесь же: ствол рисуется раньше стяжки, а глубину знали
     только там — при переносе колонна осталась бы без длины */
  let deepest=0;
  for(let rr=0;rr<baseRows(B);rr++)for(let cc=0;cc<BASE_COLS;cc++)
    if(baseCell(B,cc,rr))deepest=Math.max(deepest,rr+1);
  const lx=X(cellX(Math.floor(BASE_COLS/2)));
  const shaftB=Y(BASE_OY+Math.max(1,deepest)*BCELL_H), shaftT=Y(BASE_OY);
  const LW=13;
  const sg=ctx.createLinearGradient(lx-LW,0,lx+LW,0);
  sg.addColorStop(0,"rgba(30,26,20,.95)");
  sg.addColorStop(.5,"rgba(168,116,52,"+(.42+lit*.42).toFixed(2)+")");
  sg.addColorStop(1,"rgba(30,26,20,.95)");
  ctx.fillStyle=sg;ctx.fillRect(lx-LW,shaftT,LW*2,shaftB-shaftT);
  ctx.fillStyle="rgba(255,196,110,"+(.10+lit*.16).toFixed(2)+")";
  ctx.fillRect(lx-LW*.45,shaftT,LW*.9,shaftB-shaftT);      // светлая сердцевина
  ctx.strokeStyle="rgba(8,10,14,.95)";ctx.lineWidth=2.4;
  ctx.beginPath();ctx.moveTo(lx-LW,shaftT);ctx.lineTo(lx-LW,shaftB);
  ctx.moveTo(lx+LW,shaftT);ctx.lineTo(lx+LW,shaftB);ctx.stroke();
  /* площадка на каждом ярусе: по ним видно, что колонна — не труба */
  for(let r=0;r<=Math.max(1,deepest);r++){
    const y=Y(BASE_OY+r*BCELL_H);
    ctx.fillStyle="rgba(20,18,14,.9)";ctx.fillRect(lx-LW,y-3,LW*2,4);
    ctx.fillStyle="rgba(255,206,140,"+(.16+lit*.24).toFixed(2)+")";
    ctx.fillRect(lx-LW,y-3,LW*2,1.2);
  }

  /* ── плита перекрытия ──
     Ряды разной длины читались набором полок, потому что между ними была
     только порода: у образца этажи держит толстая плита, и даже короткий ряд
     на ней выглядит этажом, а не отдельной коробкой. Плита идёт по всей
     ширине ЗАСТРОЙКИ (от левого занятого столбца до правого во всём
     сооружении), а не по каждому ряду: перекрытие — вещь общая, его льют
     сразу на всё здание. Тёмное тело, светлая верхняя грань, тень снизу. */
  {
    let gc0=BASE_COLS,gc1=-1;
    for(let r=0;r<baseRows(B);r++)for(let c=0;c<BASE_COLS;c++)
      if(baseCell(B,c,r)){gc0=Math.min(gc0,c);gc1=Math.max(gc1,c);}
    if(gc1>=0){
      const x0=X(BASE_OX+gc0*BCELL_W)-6, x1=X(BASE_OX+(gc1+1)*BCELL_W)+6;
      for(let r=1;r<=Math.max(1,deepest);r++){
        const y=Y(BASE_OY+r*BCELL_H);
        ctx.fillStyle="rgba(10,12,16,.92)";ctx.fillRect(x0,y-7,x1-x0,9);
        ctx.fillStyle="rgba(150,164,180,"+(.10+lit*.14).toFixed(2)+")";
        ctx.fillRect(x0,y-7,x1-x0,1.4);
        ctx.fillStyle="rgba(0,0,0,.5)";ctx.fillRect(x0,y+1.4,x1-x0,2);
      }
    }
  }
  /* ── модули ── */
  for(let r=0;r<baseRows(B);r++)for(let c=0;c<BASE_COLS;c++){
    const x=X(BASE_OX+c*BCELL_W),y=Y(BASE_OY+r*BCELL_H);
    if(x>W+40||x+BCELL_W<-40)continue;
    const cell=baseCell(B,c,r);
    if(!cell)continue;                       // пустая клетка — просто порода
    drawModule(cell.k,x,y,cell.hp>0?lit:.12,c,r,B);
    if(cell.hp<=0){
      /* разбитый отсек: перечёркнут и тёмен — видно, что налёт был не бесплатным */
      ctx.strokeStyle="rgba(255,80,60,.7)";ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(x+14,y+14);ctx.lineTo(x+BCELL_W-14,y+BCELL_H-14);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x+BCELL_W-14,y+14);ctx.lineTo(x+14,y+BCELL_H-14);ctx.stroke();
    }
  }
  /* ── переборки ──
     Отсеки одного яруса стояли встык и сливались в ленту: где кончается склад
     и начинается жильё, было видно только по мебели. На образце каждая
     комната отбита толстой стеной, и ряд читается ЧЕРЕДОЙ ПОМЕЩЕНИЙ, а не
     одним длинным залом. Стена ставится на границе двух занятых клеток и по
     краям застройки — там, где помещение упирается в породу. */
  for(let r=0;r<baseRows(B);r++)for(let c=0;c<=BASE_COLS;c++){
    const a=c>0?baseCell(B,c-1,r):null, b=c<BASE_COLS?baseCell(B,c,r):null;
    if(!a&&!b)continue;
    const x=X(BASE_OX+c*BCELL_W), y0=Y(BASE_OY+r*BCELL_H), y1=Y(BASE_OY+(r+1)*BCELL_H);
    if(x<-20||x>W+20)continue;
    const wdt=(a&&b)?5:7;                       // внешняя стена толще внутренней
    ctx.fillStyle="rgba(9,11,15,.95)";
    ctx.fillRect(x-wdt/2,y0,wdt,y1-y0);
    ctx.fillStyle="rgba(150,164,180,"+(.08+lit*.12).toFixed(2)+")";
    ctx.fillRect(x-wdt/2,y0,1,y1-y0);           // блик по кромке, обращённой к свету
    /* ── дверь ──
     Проём был жёлтой полоской в толще стены и читался подсветкой, а не
     дверью. Дверь узнают по трём вещам: тёмный зев, светлый косяк вокруг
     него и порог понизу. Ставится от пола вверх на рост человека — по ней
     же становится видно, какого размера отсек. */
    if(a&&b){
      const dh=BCELL_H*.34, dy=y1-BCELL_H*.12-dh;
      ctx.fillStyle="rgba(6,8,12,.98)";
      ctx.fillRect(x-wdt/2-1,dy,wdt+2,dh);
      ctx.fillStyle="rgba(170,186,204,"+(.12+lit*.18).toFixed(2)+")";
      ctx.fillRect(x-wdt/2-1.6,dy-1.4,wdt+3.2,1.4);      // косяк сверху
      ctx.fillRect(x-wdt/2-1.6,dy,1.2,dh);
      ctx.fillRect(x+wdt/2+.4,dy,1.2,dh);
      ctx.fillStyle="rgba(255,206,140,"+(.20+lit*.26).toFixed(2)+")";
      ctx.fillRect(x-wdt/2-1,dy+dh-1.6,wdt+2,1.6);       // свет из-под двери
    }
  }
  /* коридор-стяжка вдоль пола и ствол лифта */
  /* Стяжка идёт по полу только там, где есть отсеки: раньше она чертилась во всю
     ширину базы на каждом ярусе, включая нетронутые, и оранжевые линии висели
     прямо в породе */
  ctx.strokeStyle="rgba(242,178,92,"+(.16+lit*.26).toFixed(2)+")";ctx.lineWidth=2;
  /* deepest уже посчитан выше, у ствола */
  for(let r=0;r<baseRows(B);r++){
    let c0=-1,c1=-1;
    for(let c=0;c<BASE_COLS;c++)if(baseCell(B,c,r)){if(c0<0)c0=c;c1=c;}
    if(c0<0)continue;
    deepest=r+1;
    const y=Y(BASE_OY+r*BCELL_H+BCELL_H*.78);
    ctx.beginPath();
    ctx.moveTo(X(BASE_OX+6+c0*BCELL_W),y);ctx.lineTo(X(BASE_OX+(c1+1)*BCELL_W-6),y);ctx.stroke();
    /* и по полу тоннеля — от ворот до верхнего яруса */
    if(r===0){ctx.beginPath();ctx.moveTo(X(BASE_GATE_X+70),Y(BASE_GY-6));ctx.lineTo(X(BASE_OX),Y(BASE_GY-6));ctx.stroke();}
  }
  /* астронавт — тот же силуэт, что на поверхности и в шахте */
  ctx.save();ctx.translate(X(S.x),Y(S.y)+26);ctx.scale(.9,.9);
  drawAstronaut({phase:S.walkPhase,amp:Math.abs(cellX(S.cur)-S.x)>2?1:0,walk:false,air:false});
  ctx.restore();
  /* место под застройку: не рамка на каждой клетке, а метка только на выбранной */
  const sx=X(BASE_OX+S.cur*BCELL_W),sy=Y(BASE_OY+S.row*BCELL_H);
  const on=Math.sin(G.t*.12)>0;
  ctx.strokeStyle=on?"rgba(127,230,216,.95)":"rgba(127,230,216,.4)";
  ctx.lineWidth=2;
  const selCell=baseCell(B,S.cur,S.row);
  if(selCell){
    /* у построенного отсека — не рамка во всю клетку, а уголки и подпись:
       имена всех отсеков разом снова превращали разрез в таблицу */
    const x1=sx+6,y1=sy+6,x2=sx+BCELL_W-6,y2=sy+BCELL_H-6,L=12;
    ctx.beginPath();
    ctx.moveTo(x1,y1+L);ctx.lineTo(x1,y1);ctx.lineTo(x1+L,y1);
    ctx.moveTo(x2-L,y1);ctx.lineTo(x2,y1);ctx.lineTo(x2,y1+L);
    ctx.moveTo(x2,y2-L);ctx.lineTo(x2,y2);ctx.lineTo(x2-L,y2);
    ctx.moveTo(x1+L,y2);ctx.lineTo(x1,y2);ctx.lineTo(x1,y2-L);
    ctx.stroke();
    ctx.fillStyle="rgba(180,240,232,.9)";
    ctx.font="9px ui-monospace,monospace";ctx.textAlign="center";
    const nm=BUILD[selCell.k].ru.toUpperCase()+(selCell.hp<=0?" · РАЗБИТ":"");
    ctx.fillText(nm,sx+BCELL_W/2,y1-5);
  }
  else{
    ctx.setLineDash([7,7]);
    ctx.strokeRect(sx+10,sy+10,BCELL_W-20,BCELL_H-20);
    ctx.setLineDash([]);
    ctx.fillStyle="rgba(127,230,216,.5)";ctx.font="9px ui-monospace,monospace";ctx.textAlign="center";
    ctx.fillText("МЕСТО ПОД ЗАСТРОЙКУ",sx+BCELL_W/2,sy+BCELL_H/2+3);
  }
  /* переходящий вымпел (M206): знамя на стене у входа, если оно в этом
     квартале досталось этой базе. Ничего не даёт, только висит */
  if(typeof pennHere==="function"&&pennHere()&&typeof pennDraw==="function")
    pennDraw(X(BASE_OX+18),Y(58),BCELL_W*0.52,BCELL_H*0.42);
  if(S.menu)drawBuildMenu(S);
}
