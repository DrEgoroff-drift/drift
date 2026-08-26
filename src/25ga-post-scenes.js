/* ══════════════ открытка: пять других мест ══════════════
   M208. Первый проход почты (M188) умел два места из восьми — грунт и заход.
   В пяти остальных кнопка ФОТО не появлялась вовсе, и это значило: в пещере,
   в шахте, в поясе, на орбите и в воздухе газового гиганта игрок находится, а
   камера — нет. Половина времени игры не имела снимка.

   ОДИН НАБОР НА ВСЕХ. Каждый художник получает доводом `K` — звезду, счёт
   ночи, палитру грунта, зерно места. Своего света он не заводит. Это не
   экономия, а условие альбома: восемь кадров, снятых при восьми разных
   солнцах, читаются как восемь разных игр, а не как одна поездка.

   ЧЕЛОВЕК — МЕРИЛО, И ПОД ЗЕМЛЁЙ ТОЖЕ. В каждом кадре есть предмет
   известного размера: фигура в скафандре, крепь, кабина. Без него галерея
   может быть и норой, и вокзалом, а камень в поясе — и щебнем, и горой.

   ДВА КАДРА ЗДЕСЬ ОСВЕЩЕНЫ ИЗНУТРИ. Пещера и шахта — единственные места
   игры, куда звезда не достаёт, и врать про закат там нельзя. Свет идёт от
   фонаря: маленький круг тёплого, всё остальное падает в породу. Это и
   делает эти две карточки узнаваемыми с расстояния вытянутой руки.

   ПРАВИЛА ФАЙЛА — те же, что у 25g:
   1. Ни `G`, ни `ctx`, ни `W`/`H`. Всё приходит доводами.
   2. Ни одного собственного случайного числа: только семена мира.
   3. Печать (`pcPrint`) не зовётся отсюда — её ставит `drawPostcard`. */

/* ── фигура в скафандре ──
   Одна на все места: снимок из пещеры и снимок с гребня должны показывать
   ОДНОГО человека, иначе альбом рассыпается. Рост `hh` в пикселях кадра. */
function pcMan(c,x,y,hh,col,lamp){
  const b=hh*.42;                      /* низ корпуса */
  c.save();c.translate(x,y);
  c.fillStyle=col;
  /* ноги врозь — стоящий человек, а не столбик */
  c.beginPath();
  c.moveTo(-hh*.13,0);c.lineTo(-hh*.05,-b*.9);c.lineTo(hh*.05,-b*.9);c.lineTo(hh*.13,0);
  c.lineTo(hh*.06,0);c.lineTo(0,-b*.55);c.lineTo(-hh*.06,0);
  c.closePath();c.fill();
  /* корпус с ранцем: горб за спиной — примета скафандра «Дрейфа» */
  c.beginPath();
  c.moveTo(-hh*.14,-b*.85);c.lineTo(-hh*.17,-hh*.72);c.lineTo(-hh*.06,-hh*.80);
  c.lineTo(hh*.10,-hh*.78);c.lineTo(hh*.16,-hh*.66);c.lineTo(hh*.15,-b*.85);
  c.closePath();c.fill();
  /* шлем */
  c.beginPath();c.arc(0,-hh*.86,hh*.145,0,TAU);c.fill();
  c.restore();
  /* фонарь на шлеме. Ставится ПОСЛЕ фигуры и аддитивно — иначе он вырезает
     в ней дыру, а не освещает вокруг неё */
  if(lamp){
    c.save();c.globalCompositeOperation="lighter";
    const g=c.createRadialGradient(x,y-hh*.86,0,x,y-hh*.86,hh*2.6);
    g.addColorStop(0,"rgba(255,238,196,.50)");
    g.addColorStop(.45,"rgba(255,224,160,.16)");
    g.addColorStop(1,"rgba(255,220,150,0)");
    c.fillStyle=g;c.beginPath();c.arc(x,y-hh*.86,hh*2.6,0,TAU);c.fill();
    c.restore();
  }
}

/* ── порода в разрезе ──
   Слои под наклоном, каждый своей светлоты. Тот же приём, что у грунта в 25g
   и у шахты в игре: разрез земли — половина кадра, и это он делает мир
   осязаемым. Пласт НЕ горизонтален: горизонтальная полоса читается фоном,
   наклонная — породой. */
function pcStrata(c,x0,y0,x1,y1,base,r,n){
  const N=n||9, hgt=y1-y0;
  for(let i=0;i<N;i++){
    const t=i/N, k=.55+t*.55+(r()-.5)*.14;
    c.fillStyle=pcC(base,k);
    const yy=y0+hgt*t, hh=hgt/N*1.25;
    const tilt=(r()-.5)*hgt*.10;
    c.beginPath();
    c.moveTo(x0,yy+tilt);c.lineTo(x1,yy-tilt);
    c.lineTo(x1,yy-tilt+hh);c.lineTo(x0,yy+tilt+hh);
    c.closePath();c.fill();
  }
}
/* зёрна руды: не «блёстки», а вкрапления гнёздами — ровный дождь точек
   читается шумом, а гнездо читается рудой */
function pcOre(c,x0,y0,x1,y1,col,r,nests){
  for(let i=0;i<(nests||5);i++){
    const cx=x0+r()*(x1-x0), cy=y0+r()*(y1-y0), rad=(x1-x0)*(.03+r()*.05);
    for(let j=0;j<8+Math.floor(r()*10);j++){
      const a=r()*TAU, d=r()*rad;
      c.fillStyle=pcA(col,.35+r()*.5);
      const q=1+r()*1.8;
      c.fillRect(cx+Math.cos(a)*d,cy+Math.sin(a)*d*.6,q,q);
    }
  }
}

/* ══════════════ пещера ══════════════
   Что делает кадр пещерой, а не тёмным прямоугольником: СВОД, КОТОРЫЙ ДАВИТ.
   Галерея читается, когда породы над головой БОЛЬШЕ, чем воздуха: тогда у
   пустоты появляется вес, а у кадра — низ и верх.

   ПЕРВЫЙ ПРОХОД БЫЛ ПЕЙЗАЖЕМ. Свод стоял у самой кромки кадра, и то, что
   задумывалось потолком, читалось дальней грядой на фоне неба. Хуже того,
   порода взялась из `T.pal[0]` — у землеподобного мира это ОКЕАН, и пещера
   вышла синей: ночной ландшафт с холмом, а не подземелье. Камень под землёй
   не бывает цветным: фонарь даёт тёплый свет, всё остальное уходит в серое.

   Глубина тут ПЕРЕВЁРНУТАЯ. На поверхности каждый следующий план темнее и
   резче; под землёй свет приходит спереди, от фонаря, и дальний конец
   галереи светлее ближней породы. Ровно это отличает подземный кадр от
   наземного с первого взгляда. */
function pcCave(c,s,w,h,K){
  const p=K.p, T=K.T;
  const r=rng(hashi(p.seed,s.cx|0,0xCA5E));
  /* КАМЕНЬ СЕРЫЙ. Оттенок мира оставлен ровно настолько, чтобы пещера на
     ледяном отличалась от пещеры на вулканическом, — и ни каплей больше */
  const rock=pcMix(pcMix(K.GC.deep,[38,35,33],.72),[46,42,38],.30);
  const warm=[255,222,164];
  /* свод низко, пол высоко: воздуха — треть кадра, породы — две трети */
  const pinch=(t)=>Math.pow(Math.abs(t-.60)/.60,1.5);
  const ceilY=(t)=>h*(.30+.16*pinch(t))+Math.sin(t*9+s.cx*.01)*h*.020;
  const flrY =(t)=>h*(.76-.11*pinch(t))-Math.sin(t*7.5+s.cx*.013)*h*.016;

  /* 1. дальний конец галереи: свет фонаря, ушедший вперёд и не вернувшийся */
  {
    const g=c.createRadialGradient(w*.60,h*.55,0,w*.60,h*.55,w*.30);
    g.addColorStop(0,pcC(pcMix(rock,warm,.30),1.15));
    g.addColorStop(.40,pcC(pcMix(rock,warm,.13),.85));
    g.addColorStop(1,pcC(rock,.30));
    c.fillStyle=g;c.fillRect(0,0,w,h);
  }
  /* 2. тело породы над сводом и под полом. Его много, и это весь смысл */
  const ceil=[],flr=[];
  for(let i=0;i<=48;i++){
    const t=i/48, x=t*w;
    ceil.push([x,ceilY(t)+r()*h*.014]);
    flr .push([x,flrY(t)-r()*h*.012]);
  }
  const band=(pts,top)=>{
    c.beginPath();
    c.moveTo(0,top?-h*.1:h*1.1);
    for(const q of pts)c.lineTo(q[0],q[1]);
    c.lineTo(w,top?-h*.1:h*1.1);c.closePath();
  };
  c.save();band(ceil,true);c.clip();
  pcStrata(c,-w*.05,-h*.10,w*1.05,h*.50,rock,r,9);
  c.restore();
  c.save();band(flr,false);c.clip();
  pcStrata(c,-w*.05,h*.62,w*1.05,h*1.10,rock,r,8);
  pcOre(c,0,h*.78,w,h,pcMix(T.pal[Math.min(4,T.pal.length-1)],warm,.4),r,4);
  c.restore();
  /* 3. кромка, подсвеченная фонарём: край породы — то, чем она читается
     камнем, а не заливкой. Только на своде: пол игрок и так видит вблизи */
  const edge=(pts)=>{
    c.beginPath();c.moveTo(pts[0][0],pts[0][1]);
    for(const q of pts)c.lineTo(q[0],q[1]);
    c.stroke();
  };
  c.lineWidth=Math.max(1,h*.004);
  /* кромка свода приглушена: первый проход делал её самой светлой линией
     кадра, и глаз уходил вверх, к «горизонту», вместо того чтобы идти вглубь */
  c.strokeStyle=pcA(pcMix(rock,warm,.45),.38);
  edge(ceil);
  c.strokeStyle=pcA(pcMix(rock,warm,.40),.34);
  edge(flr);

  /* 4. сталактиты и глыбы: «много кусков — одно тело». Каждый кончается там,
     где кончается, а не по одной высоте */
  for(let i=0;i<11;i++){
    const t=.04+r()*.92, x=t*w, y0=ceilY(t)+h*.010;
    const L=h*(.03+r()*.10), wd=h*(.010+r()*.016);
    c.fillStyle=pcC(rock,.70+r()*.30);
    c.beginPath();c.moveTo(x-wd,y0);c.lineTo(x+wd,y0);c.lineTo(x+wd*.15,y0+L);c.closePath();c.fill();
  }
  for(let i=0;i<8;i++){
    const t=.03+r()*.92, x=t*w, y0=flrY(t)-h*.006;
    const R=h*(.016+r()*.040);
    c.fillStyle=pcC(rock,.85+r()*.35);
    c.beginPath();c.moveTo(x-R,y0);
    for(let a=0;a<=6;a++)c.lineTo(x-R+R*2*(a/6),y0-R*(.5+r()*.9)*Math.sin(Math.PI*a/6));
    c.closePath();c.fill();
  }
  /* 5. флора на полу: силуэты, как на кромке грунта в 25g */
  c.lineWidth=Math.max(1,h*.003);
  for(let i=0;i<12;i++){
    const t=.03+r()*.94, x=t*w, y0=flrY(t), L=h*(.015+r()*.035);
    c.strokeStyle=pcA(pcMix(rock,T.pal[Math.min(3,T.pal.length-1)],.55),.65);
    c.beginPath();c.moveTo(x,y0);
    c.quadraticCurveTo(x+(r()-.5)*L,y0-L*.6,x+(r()-.5)*L*1.4,y0-L);
    c.stroke();
  }
  /* 6. пол в дальней половине ловит свет. Без этого низ кадра оставался
     ровно тёмным, и вся картинка читалась НОЧНЫМ ГОРИЗОНТОМ с козырьком:
     светлая полоса шла по кромке свода, а под ней была чернота, то есть
     ровно то, как выглядит ночная гряда на фоне неба. Свет на полу — то,
     что делает пещеру пещерой, а не силуэтом холма */
  {
    c.save();band(flr,false);c.clip();
    c.globalCompositeOperation="lighter";
    const g=c.createRadialGradient(w*.58,flrY(.58)+h*.02,0,w*.58,flrY(.58)+h*.02,w*.42);
    g.addColorStop(0,pcA(warm,.20));
    g.addColorStop(.5,pcA(warm,.07));
    g.addColorStop(1,pcA(warm,0));
    c.fillStyle=g;c.fillRect(0,0,w,h);
    c.restore();
  }
  /* 7. человек с фонарём — СИЛУЭТОМ НА СВЕТЛОМ. Первый проход ставил его в
     тёмный ближний угол, где он в собственном свете и пропал: тёмная фигура
     на тёмном фоне не читается ничем. Он стоит перед освещённым концом
     галереи, и его видно по дыре, которую он в этом свете делает. Рост взят
     от ВЫСОТЫ ГАЛЕРЕИ, а не от кадра — тогда свод и правда над головой */
  const mt=.40, gap=flrY(mt)-ceilY(mt);
  pcMan(c,w*mt,flrY(mt),gap*.66,"rgba(10,9,10,.94)",true);
  return true;
}
/* ══════════════ шахта ══════════════
   Шахта — не пещера потемнее. Пещеру нашли, шахту ВЫРЫЛИ, и кадр держится на
   прямых углах против кривой породы: клетки, крепь, лестница, рельс. Прямая
   линия под землёй — самая сильная примета человека.

   ПЕРВЫЙ ПРОХОД БЫЛ ПЛОСКИМ, и вот чем именно. Порода была залита слоями по
   всему кадру одной светлоты — вышло бежевое поле, в котором нечего смотреть.
   Выработка была чёрными прямоугольниками — дыры в плакате, а не вынутый
   грунт. Крепь стояла одна, огромная и самая светлая в кадре: посреди поля
   висела виселица. Свет при этом лежал ровно везде.

   ВТОРОЙ ПРОХОД: СВЕТ ПАДАЕТ. Фонарь у забоя, и всё дальше двух шагов от него
   уходит в почти чёрное. Это разом даёт кадру и центр, и глубину, и правду:
   под землёй именно так и есть. Порода тёмная, и видно её только там, где на
   неё легло. Крепь — не одна, а ряд, и она мелкая: размер ей задаёт человек,
   а не наоборот. */
function pcMine(c,s,w,h,K){
  const p=K.p, T=K.T;
  const col=s.cx|0, row=Math.max(0,s.cy|0);
  const r=rng(hashi(p.seed,col*131+row,0xD16));
  /* порода почти чёрная: всё, что в этом кадре видно, видно фонарём */
  const rock=pcMix(K.GC.deep,[16,13,12],.55);
  const warm=[255,222,164];
  const ore=pcMix(T.pal[Math.min(4,T.pal.length-1)],[255,214,150],.35);
  /* забой внизу справа, лестница сверху слева: спустились и пошли вниз за
     жилой. Ход выработки — ступенями, и он же ведёт глаз по кадру */
  const CW=w*.155, CH=h*.20;
  const cells=[];
  {let cx=w*.10, cy=h*.06;
   for(let i=0;i<8;i++){
     cells.push([cx,cy]);
     if(i%2)cx+=CW*.92; else cy+=CH*.78;
     if(cx>w-CW*1.1)cx=w-CW*1.1;
     if(cy>h-CH*1.15)cy=h-CH*1.15;
   }}
  const face=cells[cells.length-1];
  const lx=face[0]+CW*.42, ly=face[1]+CH*.92;      /* фонарь у забоя */

  /* 1. массив. Слои наклонные и ТЁМНЫЕ; светлота приходит не отсюда */
  pcStrata(c,-w*.05,-h*.05,w*1.05,h*1.05,rock,r,12);
  /* 2. свет фонаря по всему кадру: он и есть модель освещения этой карточки.
     Аддитивно и один раз — два источника под землёй читаются аварией */
  {
    c.save();c.globalCompositeOperation="lighter";
    const g=c.createRadialGradient(lx,ly,0,lx,ly,Math.max(w,h)*.62);
    /* мягче, чем в первом проходе: там фонарь заливал породу до ровного
       бежевого, и пласты, ради которых порода вообще рисуется, пропадали.
       Свет обязан ПОКАЗЫВАТЬ породу, а не смывать её */
    g.addColorStop(0,pcA(warm,.24));
    g.addColorStop(.24,pcA(warm,.10));
    g.addColorStop(.62,pcA(pcMix(warm,[120,120,160],.5),.03));
    g.addColorStop(1,pcA(warm,0));
    c.fillStyle=g;c.fillRect(0,0,w,h);
    c.restore();
  }
  /* трещины в массиве: длинные ломаные, идущие вдоль пластов. Ровная заливка
     со слоями всё ещё читается фоном; трещина читается камнем */
  {
    c.lineWidth=Math.max(1,h*.003);
    for(let i=0;i<7;i++){
      const y0=h*r(), x0=w*r()*.4;
      c.strokeStyle=pcA([0,0,0],.16+r()*.18);
      c.beginPath();c.moveTo(x0,y0);
      let xx=x0,yy=y0;
      for(let k=0;k<5;k++){xx+=w*(.06+r()*.12);yy+=h*(r()-.45)*.10;c.lineTo(xx,yy);}
      c.stroke();
    }
  }
  /* 3. руда в породе — гнёздами и только там, куда достаёт фонарь: жила,
     которую видно, и есть причина, по которой копают именно тут */
  pcOre(c,lx-w*.34,ly-h*.42,lx+w*.30,ly+h*.10,ore,r,5);

  /* 4. выработка: вынутый грунт. Не чёрный прямоугольник, а ПУСТОТА с
     освещённым верхним краем и тенью, уходящей внутрь — тогда клетка
     читается объёмом, а не дырой */
  for(const q of cells){
    const [qx,qy]=q;
    const d=Math.hypot(qx+CW*.5-lx,qy+CH*.5-ly)/Math.max(w,h);
    const k=clamp(1-d*1.9,0,1);
    const g=c.createLinearGradient(qx,qy,qx,qy+CH);
    g.addColorStop(0,pcA(pcMix(rock,warm,.30*k),.85));
    g.addColorStop(.22,pcA(pcMix(rock,[0,0,0],.55),.92));
    g.addColorStop(1,pcA(pcMix(rock,[0,0,0],.72),.92));
    c.fillStyle=g;
    c.fillRect(qx,qy,CW,CH);
    /* след кайла на дне клетки: неровность, которой у прямоугольника нет */
    c.fillStyle=pcA(pcMix(rock,[0,0,0],.5),.5);
    c.beginPath();c.moveTo(qx,qy+CH);
    for(let i=0;i<=5;i++)c.lineTo(qx+CW*i/5,qy+CH-CH*(.02+r()*.07));
    c.lineTo(qx+CW,qy+CH);c.closePath();c.fill();
    /* освещённая кромка: по ней и видно, что клетки — ступени */
    c.strokeStyle=pcA(warm,.10+.42*k);
    c.lineWidth=Math.max(1,h*.005);
    c.beginPath();c.moveTo(qx,qy);c.lineTo(qx+CW,qy);c.stroke();
  }
  /* 5. крепь: РЯД мелких стоек вдоль выработки, а не одна большая. Дерево —
     самое тёплое, что есть под землёй, но оно не должно быть ярче фонаря */
  {
    /* КРЕПЬ СТАВЯТ НЕ ВЕЗДЕ. Второй проход обвёл каждую вторую клетку полной
       рамой, и вышел ряд одинаковых картинных рам — сетка окон, а не
       выработка. Крепят там, где кровля слаба: три места, и у каждого свои
       стойки, своя высота и свой наклон. Одинаковость — вот что выдаёт
       рисованное, а не размер и не цвет */
    const wood=pcMix([116,82,50],warm,.12);
    for(let i=1;i<cells.length;i+=3){
      const q=cells[i], tw=Math.max(2,w*.008), TH=CH*(.80+r()*.18);
      const d=Math.hypot(q[0]-lx,q[1]-ly)/Math.max(w,h);
      const k=clamp(1-d*1.7,.10,.9);
      const lean=CW*(r()-.5)*.10;
      c.fillStyle=pcC(wood,.30+k*.55);
      c.save();c.translate(q[0],q[1]+CH);
      c.beginPath();
      c.moveTo(tw,0);c.lineTo(tw+lean,-TH);c.lineTo(tw*2+lean,-TH);c.lineTo(tw*2,0);
      c.closePath();c.fill();
      c.beginPath();
      c.moveTo(CW-tw*2,0);c.lineTo(CW-tw*2-lean,-TH);c.lineTo(CW-tw-lean,-TH);c.lineTo(CW-tw,0);
      c.closePath();c.fill();
      /* перекладина — только у первой: остальные стоят без неё, и это видно */
      if(i===1)c.fillRect(0,-TH-tw*1.5,CW,tw*1.5);
      c.restore();
    }
  }
  /* отвал под клетками: вынутая порода не исчезает. Без него клетки висели
     в массиве, как чёрные наклейки, — вырубка без единого следа работы */
  for(const q of cells){
    const d=Math.hypot(q[0]-lx,q[1]-ly)/Math.max(w,h);
    const k=clamp(1-d*1.8,.05,1);
    c.fillStyle=pcA(pcMix(rock,warm,.20*k),.75);
    c.beginPath();c.moveTo(q[0],q[1]+CH);
    for(let i=0;i<=6;i++)c.lineTo(q[0]+CW*i/6,q[1]+CH-CH*(.03+r()*.10));
    c.lineTo(q[0]+CW,q[1]+CH);c.closePath();c.fill();
  }
  /* 6. лестница в первой клетке: спуск, которым сюда пришли, и единственная
     вертикаль кадра */
  {
    const q=cells[0];
    const x0=q[0]+CW*.60, y0=q[1]-h*.04, lw=CW*.22, lh=CH*1.5, st=Math.max(1,h*.004);
    c.strokeStyle=pcA(pcMix([116,82,50],warm,.2),.42);
    c.lineWidth=st*1.6;
    c.beginPath();c.moveTo(x0,y0);c.lineTo(x0,y0+lh);c.moveTo(x0+lw,y0);c.lineTo(x0+lw,y0+lh);c.stroke();
    c.lineWidth=st;
    for(let i=1;i<8;i++){const y=y0+lh*i/8;c.beginPath();c.moveTo(x0,y);c.lineTo(x0+lw,y);c.stroke();}
  }
  /* 7. вагонетка на рельсе у забоя — предмет известного размера, и он же
     говорит, что отсюда что-то вывозят */
  {
    const bw=w*.115, bh=h*.062, bx=Math.max(w*.03,lx-w*.40), by=ly+h*.02;
    c.strokeStyle=pcA(pcMix([150,148,152],warm,.4),.30);c.lineWidth=Math.max(1,h*.004);
    c.beginPath();c.moveTo(bx-w*.06,by+bh*.2);c.lineTo(bx+bw*1.8,by+bh*.2);c.stroke();
    c.fillStyle=pcA(pcMix([54,50,52],warm,.10),.95);
    c.fillRect(bx,by-bh,bw,bh);
    c.fillStyle=pcA(ore,.42);
    c.beginPath();c.moveTo(bx+bw*.1,by-bh);
    for(let i=0;i<=6;i++)c.lineTo(bx+bw*(.1+.8*i/6),by-bh-bh*(.16+r()*.22));
    c.lineTo(bx+bw*.9,by-bh);c.closePath();c.fill();
    c.strokeStyle=pcA(warm,.28);c.lineWidth=Math.max(1,h*.004);
    c.beginPath();c.moveTo(bx,by-bh);c.lineTo(bx+bw,by-bh);c.stroke();
    c.fillStyle=pcA([32,30,34],.95);
    c.beginPath();c.arc(bx+bw*.24,by,bh*.22,0,TAU);c.fill();
    c.beginPath();c.arc(bx+bw*.76,by,bh*.22,0,TAU);c.fill();
  }
  /* 8. человек у забоя. Он крупнее, чем кажется правильным на бумаге: это
     единственная фигура в кадре, и по ней меряется вся выработка */
  pcMan(c,lx,ly,CH*1.15,pcC(rock,.22),true);
  return true;
}
/* ── корабль силуэтом ──
   Свой, а не `drawHull`: тот пишет в единственный `ctx` и читает `G`, и звать
   его отсюда значило бы вернуть открытке зависимость от живого мира — то,
   ради чего у неё вообще отдельный художник. Здесь нужен не корабль игрока со
   всеми модулями, а ПРЕДМЕТ ИЗВЕСТНОГО РАЗМЕРА: клин с крыльями и огоньком.
   Один и тот же в поясе, на орбите и в атмосфере — три кадра про одну
   поездку. */
function pcShip(c,x,y,L,ang,col,lit){
  c.save();c.translate(x,y);c.rotate(ang||0);
  c.fillStyle=col;
  /* корпус: клин носом вперёд */
  c.beginPath();
  c.moveTo(L*.52,0);c.lineTo(L*.06,-L*.13);c.lineTo(-L*.42,-L*.10);
  c.lineTo(-L*.48,0);c.lineTo(-L*.42,L*.10);c.lineTo(L*.06,L*.13);
  c.closePath();c.fill();
  /* крылья: то, что даёт силуэту размах, а размах — размер */
  c.beginPath();
  c.moveTo(-L*.02,-L*.06);c.lineTo(-L*.30,-L*.34);c.lineTo(-L*.40,-L*.30);c.lineTo(-L*.16,-L*.04);
  c.closePath();c.fill();
  c.beginPath();
  c.moveTo(-L*.02,L*.06);c.lineTo(-L*.30,L*.34);c.lineTo(-L*.40,L*.30);c.lineTo(-L*.16,L*.04);
  c.closePath();c.fill();
  /* освещённая кромка сверху: без неё силуэт остаётся наклейкой */
  if(lit){
    c.strokeStyle=lit;c.lineWidth=Math.max(1,L*.022);
    c.beginPath();c.moveTo(L*.52,0);c.lineTo(L*.06,-L*.13);c.lineTo(-L*.42,-L*.10);c.stroke();
  }
  /* бортовой огонь: единственная тёплая точка в вакууме, и глаз идёт к ней */
  c.fillStyle="rgba(255,120,96,.9)";
  c.beginPath();c.arc(-L*.30,-L*.31,Math.max(1,L*.030),0,TAU);c.fill();
  c.restore();
}

/* ══════════════ пояс ══════════════
   Вакуум — самый трудный кадр: в нём нет ни горизонта, ни воздуха, то есть
   нет ни одного из двух приёмов, на которых держатся все остальные. Глубина
   тут строится ТОЛЬКО размером и резкостью: три плана камней, и дальний не
   бледнее ближнего (бледнеть нечему), а МЕЛЬЧЕ и ровнее.

   Свет один и жёсткий, тени черны. Освещённая сторона камня — узкий серп со
   стороны звезды; всё остальное падает в чёрное. Именно жёсткость и делает
   вакуум вакуумом: мягкая тень означала бы воздух. */
function pcBelt(c,s,w,h,K){
  const p=K.p;
  const r=rng(hashi((p&&p.seed)||1,s.cx|0,0xBE17));
  const yaw=((s.cx|0)%360)*Math.PI/180;
  const star=K.star;
  /* звезда стоит там, куда смотрит курс: снимок в поясе делают, повернувшись
     к свету, иначе на нём нечего смотреть */
  const sx=w*(.5+Math.cos(yaw)*.34), sy=h*(.26+Math.sin(yaw)*.12);

  /* 1. пустота. Не чёрная: у пояса за спиной галактика, и совсем чёрный кадр
     читается дырой в открытке, а не космосом */
  {
    const g=c.createLinearGradient(0,0,w*.3,h);
    g.addColorStop(0,"rgb(9,10,18)");
    g.addColorStop(1,"rgb(4,4,9)");
    c.fillStyle=g;c.fillRect(0,0,w,h);
  }
  /* 2. звёзды: в вакууме они всегда, и они точки без ореола */
  c.fillStyle="#e8f0ff";
  for(let i=0;i<190;i++){
    const x=r()*w,y=r()*h,q=r();
    c.globalAlpha=.18+q*q*.8;
    c.fillRect(x,y,q>.95?1.8:1,q>.95?1.8:1);
  }
  c.globalAlpha=1;
  /* 3. звезда: маленький жёсткий диск с крестом бликов — в вакууме она не
     размазана воздухом, и это единственное, что её выдаёт */
  {
    const R=Math.min(w,h)*.020;
    const g=c.createRadialGradient(sx,sy,0,sx,sy,R*7);
    g.addColorStop(0,pcA(star,1));
    g.addColorStop(.14,pcA(star,.5));
    g.addColorStop(1,pcA(star,0));
    c.fillStyle=g;c.beginPath();c.arc(sx,sy,R*7,0,TAU);c.fill();
    c.fillStyle=pcA([255,255,255],.95);
    c.beginPath();c.arc(sx,sy,R,0,TAU);c.fill();
    /* блик — не перекрестье. Ровные линии одинаковой толщины от края до края
       читаются прицелом интерфейса, а не бликом в объективе. Настоящий блик
       ярче у центра и сходит на нет к концам, поэтому он рисуется полосой с
       градиентом, а не штрихом */
    c.save();c.globalCompositeOperation="lighter";
    const fl=(lw,lh)=>{
      const g2=c.createLinearGradient(sx-lw,sy,sx+lw,sy);
      g2.addColorStop(0,pcA(star,0));
      g2.addColorStop(.5,pcA(star,.55));
      g2.addColorStop(1,pcA(star,0));
      c.fillStyle=g2;c.fillRect(sx-lw,sy-lh*.5,lw*2,lh);
    };
    fl(R*10,Math.max(1,R*.16));
    c.save();c.translate(sx,sy);c.rotate(Math.PI/2);c.translate(-sx,-sy);
    fl(R*5,Math.max(1,R*.14));
    c.restore();
    c.restore();
  }
  /* 4. дальний обод пояса: полоса мелких камней поперёк кадра. Она и говорит,
     что это ПОЯС, а не просто три булыжника в пустоте */
  {
    const by=h*(.46+Math.sin(yaw)*.06), tilt=Math.cos(yaw)*h*.10;
    c.save();
    c.beginPath();c.moveTo(0,by+tilt-h*.05);c.lineTo(w,by-tilt-h*.05);
    c.lineTo(w,by-tilt+h*.05);c.lineTo(0,by+tilt+h*.05);c.closePath();c.clip();
    for(let i=0;i<420;i++){
      const x=r()*w, y=by+(r()-.5)*h*.09+(x/w-.5)*-tilt*2;
      c.globalAlpha=.12+r()*.5;
      c.fillStyle="#8a8f9c";
      c.fillRect(x,y,1,1);
    }
    c.globalAlpha=1;c.restore();
  }
  /* 5. камни трёх планов. Каждый — «много кусков, одно тело»: угловатый
     контур, один свет со стороны звезды, чёрная тень, кратеры только на
     освещённой стороне — в тени их всё равно не видно, и рисовать их значило
     бы врать про мягкий свет */
  const rock=(cx,cy,R,k)=>{
    const n=8+Math.floor(r()*5), pts=[];
    for(let i=0;i<n;i++){
      const a=i/n*TAU, rr=R*(.66+r()*.5);
      pts.push([cx+Math.cos(a)*rr,cy+Math.sin(a)*rr*.92]);
    }
    c.beginPath();c.moveTo(pts[0][0],pts[0][1]);
    for(const q of pts)c.lineTo(q[0],q[1]);
    c.closePath();
    /* тело камня — не чёрное. Третий проход опустил его до .30 от и без того
       тёмного, и большой камень вышел ВЫРЕЗКОЙ ИЗ БУМАГИ: плоское чёрное
       пятно с блестящей каймой. В вакууме теневая сторона тоже что-то
       ловит — рассеянное от соседей и от пояса; ноль отражения бывает
       только на рисунке */
    c.fillStyle=pcC(pcMix([56,54,58],star,.10),k*.62);c.fill();
    /* Свет в вакууме РЕЖЕТ. Первый проход растягивал серп на полтора радиуса
       и получал мягкую картофелину: мягкая тень означает воздух, а воздуха
       здесь нет. Терминатор камня — короткий переход, а за ним сразу чёрное */
    const ax=Math.atan2(sy-cy,sx-cx);
    c.save();c.clip();
    const lg=c.createLinearGradient(cx+Math.cos(ax)*R,cy+Math.sin(ax)*R,
                                    cx+Math.cos(ax)*R*.10,cy+Math.sin(ax)*R*.10);
    lg.addColorStop(0,pcC(pcMix([190,186,178],star,.20),k*1.15));
    lg.addColorStop(.55,pcC(pcMix([120,116,112],star,.18),k*.70));
    lg.addColorStop(1,"rgba(0,0,0,0)");
    c.fillStyle=lg;c.fillRect(cx-R*1.4,cy-R*1.4,R*2.8,R*2.8);
    /* и крап по поверхности: без него большой камень остаётся гладкой
       заливкой, а гладких камней не бывает. Крап идёт по всему телу, не
       только по свету: в тени он еле виден, и это правильно */
    for(let i=0;i<22;i++){
      const a=r()*TAU, d=Math.pow(r(),.6)*R;
      const px=cx+Math.cos(a)*d, py=cy+Math.sin(a)*d*.92;
      const lit2=clamp(((px-cx)*Math.cos(ax)+(py-cy)*Math.sin(ax))/R*.5+.5,0,1);
      c.fillStyle=pcA(r()<.5?[0,0,0]:pcMix([210,204,196],star,.2),(.05+r()*.12)*lit2);
      c.beginPath();c.ellipse(px,py,R*(.05+r()*.16),R*(.03+r()*.09),a,0,TAU);c.fill();
    }
    /* кратеры — только на освещённой стороне: в тени их всё равно не видно, и
       рисовать их значило бы врать про мягкий свет */
    for(let i=0;i<5;i++){
      const a=ax+(r()-.5)*1.5, d=r()*R*.8;
      const kx=cx+Math.cos(a)*d, ky=cy+Math.sin(a)*d, kr=R*(.07+r()*.14);
      c.fillStyle="rgba(0,0,0,.30)";
      c.beginPath();c.arc(kx,ky,kr,0,TAU);c.fill();
      c.fillStyle=pcA(pcMix([210,206,198],star,.2),.20);
      c.beginPath();c.arc(kx+Math.cos(ax)*kr*.35,ky+Math.sin(ax)*kr*.35,kr*.8,0,TAU);c.fill();
    }
    c.restore();
    /* и узкая раскалённая кромка по самому краю СО СТОРОНЫ ЗВЕЗДЫ: она и
       делает камень камнем, а не пятном — глаз читает форму по блику. Обвод
       обрезан кругом, сдвинутым к свету: с теневой стороны кромки нет,
       иначе камень получит контур и станет наклейкой */
    c.save();
    c.beginPath();c.arc(cx+Math.cos(ax)*R*.75,cy+Math.sin(ax)*R*.75,R*1.05,0,TAU);
    c.clip();
    c.strokeStyle=pcA(pcMix([236,230,220],star,.30),.60*k);
    c.lineWidth=Math.max(1,R*.06);
    c.beginPath();c.moveTo(pts[0][0],pts[0][1]);
    for(const q of pts)c.lineTo(q[0],q[1]);
    c.closePath();c.stroke();
    c.restore();
  };
  /* РАЗМЕРЫ РАЗВЕДЕНЫ. Первый проход раскидал камни трёх близких калибров по
     всему кадру ровным слоем, и вышло конфетти: глазу не за что зацепиться,
     и никакого «большого» в кадре нет. Глубина в вакууме держится ТОЛЬКО на
     разнице размеров, значит разница должна быть кратной, а не на четверть.
     Один камень — главный, три средних, россыпь мелочи. */
  for(let i=0;i<9;i++)rock(r()*w,r()*h,Math.min(w,h)*(.008+r()*.014),.50);   /* мелочь */
  for(let i=0;i<3;i++)rock(w*(.10+r()*.62),h*(.14+r()*.52),Math.min(w,h)*(.035+r()*.030),.85);
  rock(w*.30,h*.72,Math.min(w,h)*(.26+r()*.07),1.05);                        /* главный */
  /* 6. пыль у стекла: мелкие блики не в фокусе. Единственное «не резкое» в
     кадре, и потому вся резкость остального читается сразу */
  for(let i=0;i<26;i++){
    const x=r()*w,y=r()*h,R=Math.min(w,h)*(.004+r()*.010);
    c.fillStyle=pcA([210,214,224],.05+r()*.10);
    c.beginPath();c.arc(x,y,R,0,TAU);c.fill();
  }
  /* 7. крыло собственного корабля в нижнем углу — мерило в вакууме, где
     мерить больше нечем, и заодно причина, по которой снимок вообще есть:
     кто-то сидел в кабине и нажал.

     Первый проход красил его в «rgb(30,32,38)» на почти чёрном фоне: тёмное
     на тёмном не читается ничем, и в углу выходила невнятная щепка. Корпус
     в вакууме ловит звезду — он светлее пустоты, а не темнее */
  pcShip(c,w*.90,h*.92,Math.min(w,h)*.52,-2.45,
         pcC(pcMix([92,94,104],star,.16),.9),
         pcA(pcMix([236,236,244],star,.25),.95));
  return true;
}

/* ══════════════ орбита ══════════════
   Тело в кадре целиком, с терминатором — граница света и тени и есть главная
   линия этого снимка. Планета не круг с текстурой: у неё детали только на
   свету, в тени нет ничего, а между ними узкая полоса, где видно всё сразу.
   Так планета выглядит с корабля и так её снимают.

   Корабль маленький и на фоне диска. Он тут вместо человека: диск без него —
   картинка из атласа, а с ним — место, где кто-то был. */
function pcSystem(c,s,w,h,K){
  const p=K.p, T=K.T;
  const r=rng(hashi(p.seed,s.cx|0,0x0121));
  const ang=((s.cx|0)%360)*Math.PI/180;
  const far=Math.max(12,Math.min(999,s.cy|0))/10;   /* в радиусах планеты */
  const star=K.star;
  /* 1. пустота и звёзды */
  c.fillStyle="rgb(5,6,12)";c.fillRect(0,0,w,h);
  c.fillStyle="#e8f0ff";
  for(let i=0;i<170;i++){
    const x=r()*w,y=r()*h,q=r();
    c.globalAlpha=.16+q*q*.8;
    c.fillRect(x,y,q>.95?1.8:1,q>.95?1.8:1);
  }
  c.globalAlpha=1;
  /* 2. диск. Радиус — от того, насколько близко подошли: у самой планеты она
     выходит за кадр, издали висит шариком. Это единственное число снимка,
     которое игрок ощущает телом, и врать им нельзя */
  const R=Math.min(w,h)*clamp(.62/Math.max(.9,far-.2),.10,.72);
  const cx=w*(.42+Math.cos(ang)*.16), cy=h*(.52+Math.sin(ang)*.13);
  const lit=[Math.cos(ang+Math.PI),Math.sin(ang+Math.PI)];   /* свет с той стороны, откуда пришли */
  c.save();
  c.beginPath();c.arc(cx,cy,R,0,TAU);c.clip();
  /* тело диска. ПОЛОСЫ — ТОЛЬКО У ГАЗОВОГО ГИГАНТА. Первый проход красил
     полосами всё подряд, и землеподобный мир выходил Юпитером: ровная
     радуга поперёк шара. Планета с твёрдой корой пятниста, а не полосата —
     материки, моря и облака над ними ложатся кляксами. */
  const N=T.pal.length;
  const gasy=(p.type==="gas");
  if(gasy){
    for(let i=0;i<26;i++){
      const t=i/25, yy=cy-R+2*R*t;
      const step=T.pal[Math.min(N-1,Math.floor(Math.pow(Math.abs(t-.5)*2,.8)*(N-1)+r()*.6))];
      c.fillStyle=pcC(step,.85+r()*.25);
      c.fillRect(cx-R,yy,R*2,2*R/25+1);
    }
  }else{
    /* дно: самая тёмная ступень — море или базальт */
    c.fillStyle=pcC(T.pal[0],.95);c.fillRect(cx-R,cy-R,R*2,R*2);
    /* материки: крупные рваные пятна из середины рампы. Рваные, потому что
       ровный овал читается кляксой краски, а не сушей */
    /* КОНТУР ГЛАДКИЙ, А ЦВЕТ — ИЗ СЕРЕДИНЫ РАМПЫ. Второй проход брал восемь
       точек и соединял их отрезками: выходили угловатые многоугольники,
       низкополигональные бумажные вырезки. И он позволял взять верхнюю
       ступень рампы, то есть лёд, — по всему шару разлетались белые пятна,
       которые читались не сушей и не облаком, а браком. Материк берётся из
       середины (там суша), а обводится кривой: у берега прямых нет. */
    for(let i=0;i<11;i++){
      const a=r()*TAU, d=Math.pow(r(),.6)*R*.86;
      const bx=cx+Math.cos(a)*d, by=cy+Math.sin(a)*d;
      const br=R*(.14+r()*.26);
      const step=T.pal[Math.min(N-2,1+Math.floor(r()*Math.max(1,N-2)))];
      c.fillStyle=pcC(step,.80+r()*.35);
      const n=11+Math.floor(r()*6), pts=[];
      for(let k=0;k<n;k++){
        const aa=k/n*TAU, rr=br*(.55+r()*.70);
        pts.push([bx+Math.cos(aa)*rr,by+Math.sin(aa)*rr*.78]);
      }
      c.beginPath();
      c.moveTo((pts[0][0]+pts[n-1][0])/2,(pts[0][1]+pts[n-1][1])/2);
      for(let k=0;k<n;k++){
        const q=pts[k], nx=pts[(k+1)%n];
        c.quadraticCurveTo(q[0],q[1],(q[0]+nx[0])/2,(q[1]+nx[1])/2);
      }
      c.closePath();c.fill();
    }
    /* полярные шапки: у мира со льдом они и есть то, по чему шар читается
       шаром, а не кругом */
    if(T.pal.length>3){
      const cap=T.pal[N-1];
      for(const sgn of [-1,1]){
        const g=c.createRadialGradient(cx,cy+sgn*R*1.05,0,cx,cy+sgn*R*1.05,R*.62);
        g.addColorStop(0,pcA(cap,.85));
        g.addColorStop(1,pcA(cap,0));
        c.fillStyle=g;c.fillRect(cx-R,cy-R,R*2,R*2);
      }
    }
    /* облака: белёсые полосы поверх всего, всегда светлее суши */
    if(T.atm!=="отсутствует"&&T.atm!=="нет поверхности"){
      for(let i=0;i<9;i++){
        const a=r()*TAU, d=r()*R*.9;
        const bx=cx+Math.cos(a)*d, by=cy+Math.sin(a)*d;
        c.fillStyle=pcA(pcMix(T.sky[0],[255,255,255],.72),.10+r()*.20);
        c.beginPath();c.ellipse(bx,by,R*(.10+r()*.30),R*(.03+r()*.07),r()*.9-.45,0,TAU);c.fill();
      }
    }
  }
  /* терминатор: ночь, наползающая с одной стороны, и ГЛАВНАЯ ЛИНИЯ кадра.
     Первый проход растягивал её на два с лишним радиуса, и на диск попадал
     только хвост — шар выходил освещённым целиком, то есть плоским. Ось
     теперь ровно поперёк диска, и по ней ночь успевает наступить.
     Не «умножить на ноль», а сдвиг в холод — как ночь на грунте в 25g */
  {
    const g=c.createLinearGradient(cx+lit[0]*R*.55,cy+lit[1]*R*.55,
                                   cx-lit[0]*R*1.02,cy-lit[1]*R*1.02);
    g.addColorStop(0,"rgba(0,0,0,0)");
    g.addColorStop(.34,"rgba(8,12,30,.28)");
    g.addColorStop(.60,"rgba(5,8,22,.80)");
    g.addColorStop(.80,"rgba(3,4,14,.95)");
    g.addColorStop(1,"rgba(2,3,10,.98)");
    c.fillStyle=g;c.fillRect(cx-R,cy-R,R*2,R*2);
  }
  /* огни на ночной стороне, если тут кто-то живёт: одна из самых сильных
     примет обитаемости, и она стоит ровно четырёх строк */
  if((p.pop|0)>0||p.station){
    for(let i=0;i<14;i++){
      const a=r()*TAU, d=r()*R*.9;
      const gx=cx+Math.cos(a)*d, gy=cy+Math.sin(a)*d;
      if((gx-cx)*lit[0]+(gy-cy)*lit[1]>-R*.15)continue;
      c.fillStyle="rgba(255,206,140,"+(.25+r()*.5).toFixed(2)+")";
      c.fillRect(gx,gy,1.4,1.4);
    }
  }
  c.restore();
  /* 3. воздух по кромке: у планеты с атмосферой — тонкий светящийся ободок с
     дневной стороны. У безвоздушной его нет, и это ЕДИНСТВЕННОЕ, чем два
     диска отличаются на снимке издали */
  if(T.atm!=="отсутствует"&&T.atm!=="нет поверхности"){
    c.save();c.globalCompositeOperation="lighter";
    const g=c.createRadialGradient(cx,cy,R*.96,cx,cy,R*1.10);
    g.addColorStop(0,pcA(pcMix(T.sky[0],[255,255,255],.25),0));
    g.addColorStop(.35,pcA(pcMix(T.sky[0],[255,255,255],.25),.34));
    g.addColorStop(1,pcA(T.sky[0],0));
    c.fillStyle=g;c.beginPath();c.arc(cx,cy,R*1.11,0,TAU);c.fill();
    c.restore();
  }
  /* 4. спутник: маленький, в тени с той же стороны — один свет на весь кадр */
  if(p.moons&&p.moons.length){
    const m=p.moons[0], mt=m.T||TYPES[m.type]||TYPES.rocky;
    const ma=ang+1.9, md=R*(1.6+r()*.9), mr=R*(.10+r()*.08);
    const mx=cx+Math.cos(ma)*md, my=cy+Math.sin(ma)*md*.7;
    c.fillStyle=pcC(mt.pal[Math.min(2,mt.pal.length-1)],.8);
    c.beginPath();c.arc(mx,my,mr,0,TAU);c.fill();
    c.save();c.beginPath();c.arc(mx,my,mr,0,TAU);c.clip();
    const g=c.createLinearGradient(mx+lit[0]*mr,my+lit[1]*mr,mx-lit[0]*mr,my-lit[1]*mr);
    g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,"rgba(2,3,10,.93)");
    c.fillStyle=g;c.fillRect(mx-mr,my-mr,mr*2,mr*2);c.restore();
  }
  /* 5. звезда у края кадра: её блик объясняет, ОТКУДА этот свет. Без неё
     терминатор — просто тёмная половина. Диск маленький и жёсткий: первый
     проход растекался облаком на треть кадра, и вместо звезды выходило
     красное пятно не в фокусе. В вакууме свет не растекается */
  {
    const px=cx+lit[0]*(R+Math.min(w,h)*.30), py=cy+lit[1]*(R+Math.min(w,h)*.30);
    const RR=Math.min(w,h)*.016;
    const g=c.createRadialGradient(px,py,0,px,py,RR*8);
    g.addColorStop(0,pcA(star,1));
    g.addColorStop(.16,pcA(star,.45));
    g.addColorStop(.45,pcA(star,.10));
    g.addColorStop(1,pcA(star,0));
    c.save();c.globalCompositeOperation="lighter";
    c.fillStyle=g;c.fillRect(0,0,w,h);c.restore();
  }
  /* 6. корабль на фоне диска — мерило и повод */
  pcShip(c,cx+R*.55,cy-R*.42,Math.min(w,h)*.11,ang+.5,"rgb(24,26,32)",
         pcA(pcMix([220,220,230],star,.3),.75));
  return true;
}

/* ══════════════ атмосфера газового гиганта ══════════════
   Единственное место игры, где нет ни земли, ни вакуума — только воздух и его
   слои. Кадр держится на ПОЛОСАХ: они сходятся к горизонту, которого нет, и
   от этого у бездны появляется дно, хотя дна там не бывает.

   Свет диффузный: он приходит сверху и рассеивается, тени мягкие. Это
   противоположность поясу, и два кадра рядом в альбоме объясняют друг друга
   лучше, чем любая подпись. */
function pcScoop(c,s,w,h,K){
  const p=K.p, T=K.T;
  const r=rng(hashi(p.seed,s.cy|0,0x6A5));
  const alt=clamp((s.cy|0)/1000,0,1);      /* 0 — у верхней кромки, 1 — в глубине */
  const bank=(s.cx|0)/100;
  const P=(T.pal&&T.pal.length)?T.pal:TYPES.gas.pal;
  const top=P[Math.min(P.length-1,4)], mid=P[Math.min(P.length-1,2)], deep=P[0];
  /* 1. воздух: сверху свет, вниз — в глубину. Чем ниже забрались, тем меньше
     света осталось наверху, и это единственное, что говорит о высоте */
  {
    const g=c.createLinearGradient(0,0,0,h);
    g.addColorStop(0,pcC(pcMix(top,[255,244,224],.20),1-alt*.45));
    g.addColorStop(.42,pcC(mid,1-alt*.35));
    g.addColorStop(1,pcC(deep,.72-alt*.25));
    c.fillStyle=g;c.fillRect(0,0,w,h);
  }
  /* 2. полосы.
     ПЕРВЫЙ ПРОХОД ВЫШЕЛ ХОЛМАМИ. Кромка ходила синусом с большой амплитудой
     на десяти точках, край получался угловатым и резким — и глаз читал
     сушу: пологие холмы в лиловом закате. У воздуха резких краёв не бывает
     ВООБЩЕ: полоса газа размыта сверху и снизу, а её длинная волна много
     длиннее кадра. Отсюда две правки: каждая полоса — вертикальный градиент
     с прозрачными концами, а волна одна на всю ширину и мелкая.
     Чем ниже, тем полосы шире и чаще — так у бездны появляется дно. */
  for(let i=0;i<13;i++){
    const t=i/12;
    const y=h*(.02+.94*Math.pow(t,1.30));
    const th=h*(.030+.075*t);
    const col=pcMix(P[Math.min(P.length-1,Math.floor(r()*P.length))],
                    (i%2)?top:deep,.30);
    /* контраст поднят: второй проход давал .16….42, и весь кадр смывался в
       ровный лиловый — полос было не разобрать, а с ними уходила и глубина */
    const a=.26+r()*.36;
    const g=c.createLinearGradient(0,y-th*.5,0,y+th*1.5);
    g.addColorStop(0,pcA(col,0));
    g.addColorStop(.5,pcA(col,a));
    g.addColorStop(1,pcA(col,0));
    c.fillStyle=g;
    /* волна одна и длинная: полосу ведёт вбок, но не гнёт её в холм */
    const amp=th*.22, ph=i*1.7+bank;
    c.beginPath();
    c.moveTo(-w*.05,y-th*.5);
    for(let k=0;k<=24;k++){
      const x=-w*.05+w*1.1*k/24;
      c.lineTo(x,y-th*.5+Math.sin(x/w*2.1+ph)*amp);
    }
    for(let k=24;k>=0;k--){
      const x=-w*.05+w*1.1*k/24;
      c.lineTo(x,y+th*1.5+Math.sin(x/w*1.7+ph*.8)*amp);
    }
    c.closePath();c.fill();
  }
  /* и перья: тонкие вытянутые клочья поперёк полос. Они и говорят, что это
     движущийся газ, а не крашеные слои */
  for(let i=0;i<16;i++){
    const y=h*(.10+r()*.86), L=w*(.10+r()*.34), th=h*(.004+r()*.012);
    c.fillStyle=pcA(pcMix(top,[255,255,255],.35),.05+r()*.10);
    c.beginPath();c.ellipse(w*r(),y,L,th,(r()-.5)*.10,0,TAU);c.fill();
  }
  /* 3. глаз бури: у гиганта он один и он огромный. Даёт кадру и центр, и
     масштаб — рядом с ним корабль становится точкой, и это правда */
  {
    /* ВИХРЬ, А НЕ МИШЕНЬ. Первый проход рисовал вложенные эллипсы вокруг
       общего центра — вышел значок, концентрические кольца с точкой. У бури
       кольца СМЕЩЕНЫ друг относительно друга и повёрнуты, и рисуются они не
       заливкой, а обводом переменной толщины: тогда глаз читает вращение. */
    const ex=w*(.70+(r()-.5)*.16), ey=h*(.30+(r()-.5)*.10), ER=Math.min(w,h)*(.22+r()*.10);
    c.save();
    for(let i=9;i>=0;i--){
      const q=(i+1)/10, rr=ER*q;
      const off=ER*(1-q)*.30, ang0=-.5+(1-q)*1.3;
      c.strokeStyle=pcA(pcMix(i%2?top:deep,mid,.40),.10+q*.22);
      c.lineWidth=Math.max(1,ER*(.05+(1-q)*.10));
      c.beginPath();
      c.ellipse(ex+Math.cos(ang0)*off,ey+Math.sin(ang0)*off*.6,rr,rr*.60,ang0,0,TAU);
      c.stroke();
    }
    /* глаз: тёмный, маленький и НЕ в геометрическом центре колец */
    const eg=c.createRadialGradient(ex+ER*.06,ey-ER*.03,0,ex+ER*.06,ey-ER*.03,ER*.24);
    eg.addColorStop(0,pcA(pcMix(deep,[0,0,0],.55),.72));
    eg.addColorStop(1,pcA(deep,0));
    c.fillStyle=eg;
    c.beginPath();c.ellipse(ex+ER*.06,ey-ER*.03,ER*.24,ER*.15,-.5,0,TAU);c.fill();
    c.restore();
  }
  /* 4. дымка между планами: воздух и есть глубина, и здесь его больше, чем
     где бы то ни было в игре */
  {
    const g=c.createLinearGradient(0,h*.30,0,h);
    g.addColorStop(0,pcA(pcMix(mid,[255,255,255],.35),0));
    g.addColorStop(1,pcA(pcMix(deep,[120,110,150],.35),.55));
    c.fillStyle=g;c.fillRect(0,h*.30,w,h*.70);
  }
  /* 5. корабль в крене, со шлейфом зачерпнутого газа — то, зачем сюда вообще
     спускаются */
  {
    const sxp=w*.34, syp=h*.66, L=Math.min(w,h)*.20;
    c.save();c.globalCompositeOperation="lighter";
    /* ШЛЕЙФ ИДЁТ ЗА КОРАБЛЁМ. Второй проход рисовал его ВПЕРЁД от носа —
       выходил не след, а луч прожектора, и вся сцена читалась наоборот.
       Нос смотрит вправо, значит взбаламученный газ остаётся слева */
    const g=c.createLinearGradient(sxp,syp,sxp-L*2.6,syp+L*.35);
    g.addColorStop(0,pcA(pcMix(top,[255,255,255],.5),.30));
    g.addColorStop(1,pcA(top,0));
    c.fillStyle=g;
    c.beginPath();c.moveTo(sxp,syp-L*.10);c.lineTo(sxp-L*2.8,syp+L*.18);
    c.lineTo(sxp-L*2.8,syp+L*.52);c.lineTo(sxp,syp+L*.14);c.closePath();c.fill();
    c.restore();
    pcShip(c,sxp,syp,L,-.32+clamp(bank,-.7,.7),"rgb(26,24,34)",
           pcA(pcMix([236,230,224],top,.35),.85));
  }
  return true;
}
