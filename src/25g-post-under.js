/* ══════════════ открытка: два места под землёй ══════════════
   M208. Пустотные места (пояс, орбита, атмосфера) живут в 25g-post-void:
   файл разошёлся надвое на 0.194.0, когда общий перевалил за сорок килобайт.
   Шов там же, где он был в замысле, — см. заголовок соседа.

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
  const N=n||9, hgt=y1-y0, bands=[];
  for(let i=0;i<N;i++){
    const t=i/N, k=.55+t*.55+(r()-.5)*.14;
    c.fillStyle=pcC(base,k);
    const yy=y0+hgt*t, hh=hgt/N*1.25;
    const tilt=(r()-.5)*hgt*.10;
    c.beginPath();
    c.moveTo(x0,yy+tilt);c.lineTo(x1,yy-tilt);
    c.lineTo(x1,yy-tilt+hh);c.lineTo(x0,yy+tilt+hh);
    c.closePath();c.fill();
    bands.push({yy,hh,tilt});
  }
  /* сухая кисть по пласту (M252, DESIGN-craft §5): короткий штрих ВДОЛЬ
     наклона своего пласта — направление зерна и говорит «порода», а не
     «полосатая заливка». Два тона, как на грунте (M250): тёмный — трещина,
     светлый — блик залегания; полутон тонул в самих пластах. */
  const L=x1-x0;
  for(let j=0;j<N*4;j++){
    const b=bands[Math.floor(r()*N)];
    const u=r(), x=x0+u*L;
    const y=b.yy+b.tilt*(1-2*u)+r()*b.hh;
    const slope=-2*b.tilt/L;
    const len=L*(.025+r()*.045), dx=len/Math.sqrt(1+slope*slope);
    const tone=r();
    c.strokeStyle=tone<.5
      ?pcA(pcMix(base,[0,0,0],.55),.16+tone*.12)
      :pcA(pcMix(base,[255,255,255],.28),.09+(tone-.5)*.12);
    c.lineWidth=1.2;
    c.beginPath();c.moveTo(x-dx,y-dx*slope);c.lineTo(x+dx,y+dx*slope);c.stroke();
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
