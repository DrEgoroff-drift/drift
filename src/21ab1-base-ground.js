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
   кроме читаемости. */
function baseDrawGround(B,S,X,Y,camx,camy,gy,sky,pal,pl){
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
  /* профиль поверхности запоминается по ходу построения: почвенный профиль,
     труба плавильни и грибок должны сидеть на ТОЙ ЖЕ кромке, что и силуэт */
  const surfYs=[];
  GP.moveTo(0,H);GP.lineTo(0,gy);
  for(let x=0;x<=W;x+=6){
    const hump=humpAt(x);
    const wob=(fbm2((x+camx)*.008,3.3,B.idx*77+13,3)-.5)*16;
    const fine=(fbm2((x+camx)*.032,7.1,B.idx*77+31,3)-.5)*9*(hump>4?1:.4);
    const yv=gy+wob+fine-hump;
    surfYs.push(yv);
    GP.lineTo(x,yv);
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
  /* ── порода у выработки сжата (§16) ──
     Вокруг отсеков стоял один тон: камень у кромки и камень в двадцати метрах
     от неё — одна краска, ступень значения в кадре ровно одна. Первый заход
     клал прямоугольную рамку из четырёх градиентов, и она читалась именно
     рамкой: углы прямые, порода тут ни при чём. Ореол идёт ОТ ЯЧЕЕК: у каждой
     краевой ячейки своё круглое затухание, круги наслаиваются и дают мягкий
     обвод по форме выработки. Заливок не больше дюжины — краевые прореживаются. */
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
      ctx.save();ctx.clip(GP);
      for(let i2=0;i2<edge.length;i2+=step){
        const cx=X(BASE_OX+edge[i2][0]*BCELL_W+BCELL_W*.5);
        const cy=Y(BASE_OY+edge[i2][1]*BCELL_H+BCELL_H*.5);
        if(cx+r1<0||cx-r1>W||cy+r1<0||cy-r1>H)continue;
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
  ctx.save();ctx.clip(GP);
  {
    const hasTurf=pl?pl.T.atm.indexOf("пригодна")>=0:false;
    const turfC=pl?mixc(pl.T.pal[Math.min(3,pl.T.pal.length-1)],[16,12,8],.5):[40,32,22];
    const subC=pl?mixc(pl.T.pal[Math.min(2,pl.T.pal.length-1)],[30,22,15],.55):[52,42,30];
    const band=(o1,o2,fill)=>{
      ctx.beginPath();
      for(let i=0;i<surfYs.length;i++){const x=i*6;i?ctx.lineTo(x,surfYs[i]+o1):ctx.moveTo(x,surfYs[i]+o1);}
      for(let i=surfYs.length-1;i>=0;i--)ctx.lineTo(i*6,surfYs[i]+o2);
      ctx.closePath();ctx.fillStyle=fill;ctx.fill();
    };
    band(0,hasTurf?4.5:3,"rgba("+turfC.join(",")+","+(hasTurf?".8":".6")+")");
    band(hasTurf?4.5:3,15,"rgba("+subC.join(",")+",.4)");
    /* камни в подпочве, корни в дёрне, обломки коры — привязаны к миру,
       а не к экрану: иначе профиль плывёт вместе с камерой */
    for(let i=0;i<surfYs.length;i++){
      const wq=Math.floor((i*6+camx)/9), hs=hashi(wq,B.idx*13+3,0x50F1);
      const x=wq*9-camx, sy0=surfYs[Math.max(0,Math.min(surfYs.length-1,Math.round(x/6)))];
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
      if(t<.72){                                  // сор — теперь МАНЕРОЙ породы (皴)
        /* матрица «закон × поверхность» (аудит 30.08): пещера, шахта и обрыв
           получили кисть CUN, а порода базы сорила плоскими чёрточками без
           направления и без типа мира. Тот же штрих: угол из поля, манера из
           таблицы — база стоит в ТОЙ ЖЕ породе, что шахта рядом. */
        const M=(typeof CUN!=="undefined"&&pl)?(CUN[pl.type]||CUN.rocky):null;
        if(M&&!M.dot){
          const ang=dirAt(px+camx,py+camy,(pl.seed|0)^0xBA5E,1/300)+(GR()-.5)*M.jig;
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
}
