/* ══════════════ база: восемь отсеков изнутри ══════════════ */
/* Отделено от 21aa по шву: там кисти (`bBox`/`bWall`/`bWorker`), отделка
   (`ROOM_FIN`) и общий `drawModule`, здесь — только сами восемь помещений.
   Вместе выходило 60 КБ, и правка одной комнаты стоила чтения всего файла.

   Мерило, язык и порядок слоёв — те же, что в 21aa: читать шапку там.
   Каждый отсек — своя функция: так их видно списком и можно править по
   одному, не разбирая общий `if/else if` на восемь ветвей. */
const BASE_ROOM={
/* ── РЕАКТОР: гермозона во всю высоту, ядро, теплоноситель, пульт ── */
reactor(x0,y0,w,h,cx,fy,lit,seed,B,P){
  const vw=46,vh=66,vx=x0+18,vy=fy-vh;              // сосуд от пола почти до потолка
  /* ядро светит по отдаче, но не гаснет совсем: тёмный сосуд читается баком,
     а не реактором, — нижний порог оставляет столб света видимым всегда */
  const heat=.35+P.eff*.65;
  const pulse=.55+Math.sin(G.t*.05)*.10+Math.sin(G.t*.11)*.05;
  bHazard(vx-8,fy-4,vw+16,4,.8);
  /* теплоноситель уходит в потолок и вбок к соседям — база связана трубами */
  bPipe([[vx+10,vy+8],[vx+10,y0+10],[x0+w-6,y0+10]],5,"120,140,158",lit);
  bPipe([[vx+vw-10,vy+10],[vx+vw-10,y0+22],[x0+w-6,y0+22]],4,"120,140,158",lit);
  /* корпус: бочка с фаской, рёбра жёсткости, смотровые люки */
  bBox(vx,vy,vw,vh,"rgba(28,36,46,.96)",lit,"rgba(150,170,190,.35)");
  ctx.fillStyle="rgba(16,22,30,.9)";ctx.fillRect(vx+5,vy+6,vw-10,vh-14);
  /* ядро: столб света внутри, ярче внизу, с дрожью */
  const cg=ctx.createLinearGradient(0,vy+8,0,fy-8);
  cg.addColorStop(0,"rgba("+BM_CORE+","+(.18+heat*.45*pulse).toFixed(3)+")");
  cg.addColorStop(.6,"rgba("+BM_CORE+","+(.45+heat*.75*pulse).toFixed(3)+")");
  cg.addColorStop(1,"rgba(215,252,255,"+(.30+heat*.60*pulse).toFixed(3)+")");
  ctx.fillStyle=cg;ctx.fillRect(vx+9,vy+10,vw-18,vh-20);
  /* Активная зона — яркая полоса в середине столба: пять тёмных стержней во всю
     высоту превращали сосуд в решётку радиатора. Оставляем три, и только там,
     где холоднее, а в середине — свет. */
  ctx.fillStyle="rgba(10,16,22,"+(.40+lit*.2).toFixed(2)+")";
  for(let i=0;i<3;i++)ctx.fillRect(vx+13+i*((vw-26)/2.4),vy+12,2.4,vh-24);
  const zg=ctx.createLinearGradient(0,vy+vh*.42,0,vy+vh*.72);
  zg.addColorStop(0,"rgba(220,252,255,0)");
  zg.addColorStop(.5,"rgba(235,254,255,"+(.85*heat*pulse).toFixed(3)+")");
  zg.addColorStop(1,"rgba(220,252,255,0)");
  ctx.fillStyle=zg;ctx.fillRect(vx+9,vy+vh*.42,vw-18,vh*.3);
  /* обручи корпуса */
  for(let i=0;i<3;i++){
    const by=vy+10+i*(vh-20)/2.6;
    bBox(vx-3,by,vw+6,6,"rgba(38,48,60,.95)",lit,"rgba(0,0,0,.5)");
    ctx.fillStyle="rgba(190,205,220,"+(.10+lit*.12).toFixed(2)+")";
    for(let j=0;j<4;j++)ctx.fillRect(vx+j*(vw/4)+5,by+2,2,2);
  }
  bGlow(cx-30,fy-vh*.5,58,BM_CORE,(.10+heat*.22)*pulse);
  /* Пульт: тумба по пояс, наклонная приборная доска, два экрана и клавиатура.
     Оператор стоит ПЕРЕД доской, а не за глухим коробом — иначе от человека
     торчит одна голова, и стол читается пустым ящиком. */
  const dx=x0+w-50,dy=fy-16;
  bBox(dx,dy,44,16,"rgba(30,38,48,.96)",lit,"rgba(140,160,180,.28)");
  ctx.fillStyle="rgba(22,28,36,.97)";                        // наклонная доска
  ctx.beginPath();ctx.moveTo(dx,dy);ctx.lineTo(dx+44,dy);ctx.lineTo(dx+44,dy-13);ctx.lineTo(dx+8,dy-8);
  ctx.closePath();ctx.fill();
  ctx.strokeStyle="rgba(150,170,190,.28)";ctx.lineWidth=1;ctx.stroke();
  ctx.fillStyle="rgba("+BM_COOL+","+(.25+lit*.35).toFixed(2)+")";  // клавиши на доске
  for(let i=0;i<5;i++)ctx.fillRect(dx+12+i*6,dy-6,4,2);
  bScreen(dx+4,dy-32,22,16,BM_CORE,lit,seed);
  bScreen(dx+30,dy-30,14,14,P.eff>.6?BM_COOL:"255,150,90",lit,seed+3);
  bWorker(dx-9,fy,lit,false,G.t*.05+seed,1);
  /* аварийная лампа в корпусе с козырьком: мигает при нехватке мощности */
  if(P.eff<.6){
    const bl=Math.sin(G.t*.22)>0?1:.15,ax=x0+w-16,ay=y0+30;
    ctx.fillStyle="rgba(40,46,56,"+(.7+lit*.2).toFixed(2)+")";
    ctx.fillRect(ax-6,ay-7,12,3);ctx.fillRect(ax-1.5,ay-11,3,4);
    ctx.fillStyle="rgba(255,90,70,"+(.9*bl).toFixed(2)+")";
    ctx.beginPath();ctx.arc(ax,ay,3.4,0,TAU);ctx.fill();
    bGlow(ax,ay,22,"255,90,70",.26*bl);
  }
  bLamp(cx+34,y0+4,26,fy,BM_CORE,.35+lit*.4);
},
/* ── СОЛНЕЧНАЯ ПАНЕЛЬ: массив над грунтом, под ним — щитовая ── */
solar(x0,y0,w,h,cx,fy,lit,seed,B,P){
  const R=rng(seed);
  /* Панель стоит НА поверхности, а помещение под ней — щитовая. Поэтому наверху
     узкая полоса светового люка и мачта, а не парящий по всему отсеку массив:
     в разрезе панель во всю комнату читалась как забытая доска. */
  /* наклон маленький, мачта ниже: при большом угле край массива уходил
     за потолок отсека и обрезался — панель читалась сломанной доской */
  const tilt=Math.sin(G.t*.005+seed)*.13-.07;
  const mx=x0+40,my=y0+19;
  /* световой люк: сквозь него в щитовую падает дневной свет */
  ctx.fillStyle="rgba(150,190,225,"+(.14+lit*.10).toFixed(3)+")";
  ctx.fillRect(mx-16,y0,32,3);
  /* луч дневного света тёплый и слабый: холодная серая клякса читалась пятном
     грязи на стене, а не солнцем из люка */
  const sg=ctx.createLinearGradient(mx,y0,mx+26,fy);
  sg.addColorStop(0,"rgba(255,238,205,"+(.13+lit*.07).toFixed(3)+")");
  sg.addColorStop(1,"rgba(255,238,205,0)");
  ctx.fillStyle=sg;ctx.beginPath();
  ctx.moveTo(mx-16,y0+2);ctx.lineTo(mx+16,y0+2);ctx.lineTo(mx+44,fy);ctx.lineTo(mx-2,fy);
  ctx.closePath();ctx.fill();
  /* мачта с приводом и сам массив: небольшой, зато с фермой снизу */
  ctx.fillStyle="rgba(60,72,86,"+(.6+lit*.3).toFixed(2)+")";ctx.fillRect(mx-2.5,y0+3,5,18);
  ctx.save();ctx.translate(mx,my);ctx.rotate(tilt);
  const pw=56,ph=8;
  ctx.strokeStyle="rgba(110,128,146,"+(.35+lit*.3).toFixed(2)+")";ctx.lineWidth=1.2;
  for(let i=-1;i<=1;i+=2){ctx.beginPath();ctx.moveTo(0,ph/2);ctx.lineTo(i*pw*.45,ph/2+4);ctx.stroke();}
  bBox(-pw/2,-ph/2,pw,ph,"rgba(24,42,66,.98)",lit,"rgba(130,190,230,.55)");
  for(let i=1;i<6;i++){ctx.fillStyle="rgba(120,170,210,.28)";ctx.fillRect(-pw/2+i*pw/6,-ph/2+1,1,ph-2);}
  const gx=-pw/2+((G.t*.6+seed*11)%(pw+24))-12;
  const gg=ctx.createLinearGradient(gx-10,0,gx+10,0);
  gg.addColorStop(0,"rgba(200,230,255,0)");
  gg.addColorStop(.5,"rgba(200,230,255,"+(.12+lit*.35).toFixed(2)+")");
  gg.addColorStop(1,"rgba(200,230,255,0)");
  ctx.fillStyle=gg;ctx.fillRect(-pw/2,-ph/2,pw,ph);
  ctx.restore();
  /* кабельный лоток по стене — то, чем массив соединён со щитом */
  bPipe([[mx,y0+16],[mx,y0+30],[x0+22,y0+34],[x0+22,fy-46]],3,"90,104,120",lit);
  /* щит: рама с автоматами, каждый переключается сам, и прибор с настоящей стрелкой */
  const px=x0+10,py=fy-46,pw2=44;
  bBox(px,py,pw2,46,"rgba(28,36,46,.97)",lit,"rgba(150,170,190,.32)");
  ctx.fillStyle="rgba(16,22,30,.9)";ctx.fillRect(px+3,py+16,pw2-6,26);
  for(let i=0;i<6;i++){
    const bx=px+6+(i%3)*12,by=py+20+((i/3)|0)*11,up=((seed>>i)&1)?P.eff>.4:true;
    ctx.fillStyle="rgba(60,70,84,"+(.7+lit*.2).toFixed(2)+")";ctx.fillRect(bx,by,8,9);
    ctx.fillStyle=up?"rgba("+BM_COOL+",.75)":"rgba(255,120,90,.75)";
    ctx.fillRect(bx+2,up?by+1:by+5,4,3);
  }
  const need=Math.max(.05,P.prod),gauge=clamp(P.prod?(P.prod-P.cons)/need*.5+.5:.5,0,1);
  ctx.fillStyle="rgba(12,16,22,.95)";ctx.beginPath();ctx.arc(px+pw2/2,py+12,9,Math.PI,TAU);ctx.fill();
  ctx.strokeStyle="rgba("+BM_COOL+","+(.30+lit*.45).toFixed(2)+")";ctx.lineWidth=1.2;
  ctx.beginPath();ctx.arc(px+pw2/2,py+12,9,Math.PI,TAU);ctx.stroke();
  for(let i=0;i<=4;i++){                                   // деления шкалы
    const a=Math.PI+i*Math.PI/4;
    ctx.beginPath();ctx.moveTo(px+pw2/2+Math.cos(a)*9,py+12+Math.sin(a)*9);
    ctx.lineTo(px+pw2/2+Math.cos(a)*6.5,py+12+Math.sin(a)*6.5);ctx.stroke();
  }
  const na=Math.PI+(gauge*.9+.05+Math.sin(G.t*.07)*.02)*Math.PI;
  ctx.strokeStyle="rgba(255,190,120,"+(.55+lit*.4).toFixed(2)+")";ctx.lineWidth=1.6;
  ctx.beginPath();ctx.moveTo(px+pw2/2,py+12);
  ctx.lineTo(px+pw2/2+Math.cos(na)*8,py+12+Math.sin(na)*8);ctx.stroke();
  /* батарейная стойка: рама, банки, уровень заряда и клеммы */
  const sx2=x0+62,sw2=w-72;
  bBox(sx2-3,fy-40,sw2+6,3,"rgba(44,54,66,.98)",lit,"rgba(0,0,0,.4)");
  for(let i=0;i<4;i++){
    const bx=sx2+i*(sw2/4);
    bBox(bx,fy-36,sw2/4-5,36,"rgba(24,32,42,.96)",lit,"rgba(120,140,160,.3)");
    const ch=clamp(P.eff*1.3-i*.15,0,1);
    ctx.fillStyle="rgba("+BM_COOL+","+(.22+lit*.5).toFixed(2)+")";
    ctx.fillRect(bx+3,fy-4-ch*28,sw2/4-11,ch*28);
    ctx.fillStyle="rgba(160,178,196,"+(.2+lit*.2).toFixed(2)+")";  // клеммы
    ctx.fillRect(bx+3,fy-39,3,3);ctx.fillRect(bx+sw2/4-11,fy-39,3,3);
    if(ch>.05&&R()<.9)bGlow(bx+sw2/8-2,fy-8,14,BM_COOL,.05+ch*.05);
  }
  bGlow(mx+10,fy-6,40,"200,225,255",.05+lit*.05);
},
/* ── БУРОВАЯ: портал, привод, шнек уходит сквозь пол, отвал на транспортёре ── */
drill(x0,y0,w,h,cx,fy,lit,seed,B,P){
  const on=P.eff>.05,spin=on?G.t*.20*P.eff:0;
  bHazard(cx-34,fy-4,68,4,.85);
  /* Портал держит всю установку, поэтому он тяжёлый: широкие стойки на башмаках,
     балка с косынками и решётка раскосов между ярусами. Тонкие палки читались
     чертежом, а не машиной. */
  for(let i=0;i<2;i++){
    const px=i?cx+31:cx-40;
    bBox(px,y0+8,9,fy-y0-8,"rgba(32,40,50,.97)",lit,"rgba(0,0,0,.45)");
    ctx.fillStyle="rgba(58,70,84,"+(.5+lit*.3).toFixed(2)+")";     // башмак
    ctx.fillRect(px-3,fy-5,15,5);
    ctx.fillStyle="rgba(190,205,220,"+(.07+lit*.09).toFixed(3)+")"; // болты
    for(let j=0;j<5;j++)ctx.fillRect(px+3,y0+16+j*14,3,3);
  }
  bBox(cx-40,y0+8,80,10,"rgba(42,52,64,.97)",lit,"rgba(150,170,190,.28)");
  ctx.fillStyle="rgba(42,52,64,.97)";                               // косынки под балкой
  ctx.beginPath();ctx.moveTo(cx-31,y0+18);ctx.lineTo(cx-31,y0+28);ctx.lineTo(cx-19,y0+18);ctx.closePath();
  ctx.moveTo(cx+31,y0+18);ctx.lineTo(cx+31,y0+28);ctx.lineTo(cx+19,y0+18);ctx.closePath();ctx.fill();
  /* решётка раскосов — по ней и видно, что это ферма */
  ctx.strokeStyle="rgba(110,128,146,"+(.22+lit*.22).toFixed(2)+")";ctx.lineWidth=2.4;
  for(let i=0;i<3;i++){
    const ya=y0+18+i*16,yb=ya+16;
    ctx.beginPath();ctx.moveTo(cx-31,ya);ctx.lineTo(cx+31,yb);
    ctx.moveTo(cx+31,ya);ctx.lineTo(cx-31,yb);ctx.stroke();
  }
  /* привод: короб с двумя шкивами и ремнём, шкивы крутятся вместе с буром */
  bBox(cx-24,y0+26,48,20,"rgba(36,45,56,.98)",lit,"rgba(150,170,190,.30)");
  ctx.fillStyle="rgba(24,31,40,.95)";ctx.fillRect(cx-20,y0+30,40,12);
  /* мотор с рёбрами охлаждения слева и шкив с ремнём справа: два одинаковых
     круга посреди короба читались парой глаз, а не приводом */
  bBox(cx-19,y0+31,18,10,"rgba(50,60,74,.98)",lit,"rgba(0,0,0,.4)");
  ctx.fillStyle="rgba(150,168,186,"+(.12+lit*.14).toFixed(2)+")";
  for(let i=0;i<5;i++)ctx.fillRect(cx-17+i*3.4,y0+32,1.4,8);
  ctx.strokeStyle="rgba(190,205,220,"+(.25+lit*.3).toFixed(2)+")";ctx.lineWidth=1.4;
  ctx.beginPath();ctx.arc(cx+10,y0+36,6,0,TAU);ctx.stroke();
  ctx.beginPath();ctx.moveTo(cx+10,y0+36);
  ctx.lineTo(cx+10+Math.cos(spin)*6,y0+36+Math.sin(spin)*6);ctx.stroke();
  ctx.lineWidth=1.6;ctx.strokeStyle="rgba(30,36,44,"+(.6+lit*.2).toFixed(2)+")";
  ctx.beginPath();ctx.moveTo(cx-1,y0+30.5);ctx.lineTo(cx+10,y0+30);
  ctx.moveTo(cx-1,y0+41.5);ctx.lineTo(cx+10,y0+42);ctx.stroke();
  /* штанга и шнек: винт рисуется синусом по фазе — вращение видно, а не подразумевается */
  const dy0=y0+46,dy1=fy+10;
  /* обсадная колонна: без неё винт висел оранжевой загогулиной посреди комнаты.
     Труба тёмная, шнек виден внутри неё, сверху и снизу — фланцы */
  bBox(cx-12,dy0,24,dy1-dy0,"rgba(20,26,34,.9)",lit,"rgba(140,158,176,.5)");
  ctx.fillStyle="rgba(0,0,0,.35)";ctx.fillRect(cx-10,dy0,5,dy1-dy0);   // тень внутри трубы
  ctx.strokeStyle="rgba(150,168,186,"+(.28+lit*.28).toFixed(2)+")";ctx.lineWidth=4;
  ctx.beginPath();ctx.moveTo(cx,dy0);ctx.lineTo(cx,dy1);ctx.stroke();  // вал
  /* Виток шнека — половинка эллипса на каждый шаг спирали: ближняя половина
     светлая, дальняя тёмная. Синусоида в одну линию давала «бантики», по ним
     вращение не читалось вовсе. */
  ctx.save();ctx.beginPath();ctx.rect(cx-11,dy0+1,22,dy1-dy0-2);ctx.clip();
  const pitch=7, ph=(spin*1.6)%pitch;
  for(let yy=dy0-pitch;yy<dy1+pitch;yy+=pitch){
    const y2=yy+ph;
    ctx.strokeStyle="rgba(112,86,60,"+(.45+lit*.3).toFixed(2)+")";ctx.lineWidth=2.2;
    ctx.beginPath();ctx.ellipse(cx,y2,8,pitch*.5,0,Math.PI,TAU);ctx.stroke();   // дальняя половина витка
    ctx.strokeStyle="rgba(226,166,100,"+(.55+lit*.4).toFixed(2)+")";ctx.lineWidth=2.6;
    ctx.beginPath();ctx.ellipse(cx,y2+pitch*.5,8,pitch*.5,0,0,Math.PI);ctx.stroke(); // ближняя
  }
  ctx.strokeStyle="rgba(150,168,186,"+(.30+lit*.28).toFixed(2)+")";ctx.lineWidth=4;
  ctx.beginPath();ctx.moveTo(cx,dy0);ctx.lineTo(cx,dy1);ctx.stroke();  // вал поверх дальних витков
  ctx.restore();
  ctx.fillStyle="rgba(52,62,76,"+(.7+lit*.2).toFixed(2)+")";  // фланцы колонны
  ctx.fillRect(cx-15,dy0,30,5);ctx.fillRect(cx-15,fy-22,30,5);
  ctx.fillStyle="rgba(190,205,220,"+(.10+lit*.12).toFixed(2)+")";
  for(let i=0;i<4;i++){ctx.fillRect(cx-12+i*8,dy0+1,3,3);ctx.fillRect(cx-12+i*8,fy-21,3,3);}
  /* устье скважины: воротник, пыль и подсветка снизу */
  bBox(cx-16,fy-8,32,8,"rgba(24,30,38,.98)",lit,"rgba(0,0,0,.5)");
  if(on){
    const R=rng(seed);
    for(let i=0;i<10;i++){
      const ph=(G.t*.03+R()*6)%1;
      ctx.fillStyle="rgba(200,168,130,"+((1-ph)*.30*P.eff).toFixed(3)+")";
      ctx.beginPath();ctx.arc(cx+(R()-.5)*38*ph*2,fy-6-ph*22,1.6+ph*2.4,0,TAU);ctx.fill();
    }
    bGlow(cx,fy-4,26,"255,180,110",.10*P.eff);
  }
  /* транспортёр отвала: лента с роликами, куски руды едут к стене */
  /* Лента — плотный короб с бортами и роликами ВНУТРИ: тонкая полоска с
     кружками под ней читалась палкой на шариках, а куски руды висели в воздухе */
  const bx=cx+18,bw2=x0+w-6-bx,by=fy-18;
  ctx.strokeStyle="rgba(90,104,120,"+(.35+lit*.2).toFixed(2)+")";ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(bx+5,fy);ctx.lineTo(bx+5,by+8);
  ctx.moveTo(x0+w-14,fy);ctx.lineTo(x0+w-14,by+8);ctx.stroke();      // опоры
  bBox(bx,by,bw2,9,"rgba(28,35,45,.98)",lit,"rgba(120,138,156,.35)");
  ctx.fillStyle="rgba(14,19,26,.9)";ctx.fillRect(bx+2,by+3,bw2-4,5); // полотно
  ctx.strokeStyle="rgba(120,138,156,"+(.18+lit*.18).toFixed(2)+")";ctx.lineWidth=1;
  for(let i=0;i<5;i++){const rx=bx+7+i*((bw2-14)/4);ctx.beginPath();ctx.arc(rx,by+6,2.4,0,TAU);ctx.stroke();}
  ctx.fillStyle="rgba(150,168,186,"+(.12+lit*.14).toFixed(2)+")";ctx.fillRect(bx,by,bw2,1.4);
  if(on)for(let i=0;i<5;i++){
    const t=((G.t*.012*P.eff)+i*.2)%1,ox=bx+4+t*(x0+w-10-bx);
    ctx.fillStyle="rgba(0,0,0,.4)";                        // тень куска на полотне
    ctx.beginPath();ctx.ellipse(ox,by+2.6,3.2,1,0,0,TAU);ctx.fill();
    ctx.fillStyle="rgba(146,116,84,"+(.55+lit*.3).toFixed(2)+")";
    ctx.beginPath();ctx.ellipse(ox,by+.6,2.8,2.2,i,0,TAU);ctx.fill();
    ctx.fillStyle="rgba(206,178,140,"+(.18+lit*.2).toFixed(2)+")";  // блик на куске
    ctx.beginPath();ctx.ellipse(ox-.8,by-.3,1.2,.8,i,0,TAU);ctx.fill();
  }
  /* пост управления: рычаг ходит, когда бур работает */
  const px=x0+14;
  bBox(px,fy-24,20,24,"rgba(30,38,48,.96)",lit,"rgba(140,160,180,.3)");
  bScreen(px+3,fy-21,14,10,on?BM_COOL:"255,150,90",lit,seed+5);
  ctx.strokeStyle="rgba("+BM_WARM+","+(.4+lit*.4).toFixed(2)+")";ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(px+10,fy-24);
  ctx.lineTo(px+10+Math.sin(G.t*.04)*4*(on?1:0),fy-34);ctx.stroke();
},
/* ── СКЛАД: стеллажи в три яруса, тележка, разметка ── */
storage(x0,y0,w,h,cx,fy,lit,seed,B,P){
  const R=rng(seed);
  /* заполненность настоящая: пустой склад стоит пустым, полный забит доверху */
  const fill=clamp(P.store?basePoolHeld(B)/P.store:0,0,1);
  ctx.fillStyle="rgba("+BM_WARM+",.10)";ctx.fillRect(x0+6,fy-3,w-12,2);  // разметка прохода
  for(let s=0;s<2;s++){
    const rx=x0+8+s*(w*.52),rw=w*.42,tiers=3;
    /* стойки и полки */
    for(let t=0;t<tiers;t++){
      const ty=fy-6-t*24;
      bBox(rx,ty-3,rw,3,"rgba(44,54,66,.98)",lit,"rgba(0,0,0,.4)");
      /* груз на полке: коробки, бочки и мешки — вперемешку, по хешу ячейки */
      let px=rx+3;
      while(px<rx+rw-8){
        const kind=R(),bw=8+R()*12,bh=12+R()*6;
        if((t+s)/ (tiers+1) > fill+.15){px+=bw+3;continue;}   // выше уровня запаса полки пустые
        if(kind<.5)bCrate(px,ty-3-bh,bw,bh,"58,52,44",lit,R()<.4);
        else if(kind<.8){                                     // бочка
          bBox(px,ty-3-bh,bw*.8,bh,"rgba(46,58,52,.95)",lit,"rgba(0,0,0,.45)");
          ctx.strokeStyle="rgba(160,180,196,"+(.12+lit*.14).toFixed(2)+")";ctx.lineWidth=1;
          ctx.beginPath();ctx.moveTo(px,ty-3-bh*.7);ctx.lineTo(px+bw*.8,ty-3-bh*.7);
          ctx.moveTo(px,ty-3-bh*.3);ctx.lineTo(px+bw*.8,ty-3-bh*.3);ctx.stroke();
        }else{                                                // мешок
          ctx.fillStyle="rgba(66,60,50,.95)";
          ctx.beginPath();ctx.ellipse(px+bw*.4,ty-3-bh*.45,bw*.45,bh*.5,0,0,TAU);ctx.fill();
        }
        px+=bw+3;
      }
    }
    bBox(rx-3,fy-78,4,78,"rgba(40,50,62,.98)",lit,"rgba(0,0,0,.4)");
    bBox(rx+rw-1,fy-78,4,78,"rgba(40,50,62,.98)",lit,"rgba(0,0,0,.4)");
  }
  /* табличка яруса — склад без маркировки не склад */
  ctx.fillStyle="rgba("+BM_WARM+","+(.25+lit*.35).toFixed(2)+")";
  ctx.fillRect(x0+10,y0+6,16,7);
  ctx.fillStyle="rgba(10,14,20,.8)";ctx.fillRect(x0+12,y0+8,12,3);
  /* тележка у прохода */
  const tx=cx-6+Math.sin(G.t*.008+seed)*10;
  bBox(tx,fy-13,22,9,"rgba(52,44,36,.95)",lit,"rgba(0,0,0,.45)");
  ctx.strokeStyle="rgba(150,168,186,"+(.25+lit*.2).toFixed(2)+")";ctx.lineWidth=1.4;
  ctx.beginPath();ctx.moveTo(tx+21,fy-13);ctx.lineTo(tx+25,fy-22);ctx.stroke();
  ctx.fillStyle="rgba(30,36,44,.95)";
  ctx.beginPath();ctx.arc(tx+4,fy-2,3,0,TAU);ctx.arc(tx+17,fy-2,3,0,TAU);ctx.fill();
  bLamp(cx,y0+4,30,fy,"255,232,196",.25+lit*.35);
},
/* ── ЖИЛОЙ ОТСЕК: койки, стол, шкафчики, зелень, иллюминатор ── */
habitat(x0,y0,w,h,cx,fy,lit,seed,B,P){
  const warm=(.35+lit*.5);
  /* двухъярусные койки слева: рама, матрас, одеяло, спящий */
  const bx=x0+8,bw=52;
  for(let t=0;t<2;t++){
    const by=fy-14-t*32;
    bBox(bx,by,bw,5,"rgba(46,56,68,.98)",lit,"rgba(0,0,0,.4)");        // основание
    bBox(bx+2,by-8,bw-4,8,"rgba(78,74,70,.95)",lit,null);              // матрас
    ctx.fillStyle="rgba(96,74,60,"+(.65+lit*.2).toFixed(2)+")";        // одеяло
    ctx.beginPath();ctx.moveTo(bx+2,by-6);ctx.lineTo(bx+bw*.62,by-8-(t?1:2));
    ctx.lineTo(bx+bw*.62,by);ctx.lineTo(bx+2,by);ctx.closePath();ctx.fill();
    ctx.fillStyle="rgba(150,158,168,"+(.30+lit*.22).toFixed(2)+")";    // подушка
    ctx.beginPath();ctx.ellipse(bx+bw-10,by-6,7,3.4,0,0,TAU);ctx.fill();
    if(t===0){                                                          // на нижней спят
      const br=Math.sin(G.t*.03)*.6;
      ctx.fillStyle="rgba(158,168,180,"+(.32+lit*.28).toFixed(2)+")";  // затылок спящего
      ctx.beginPath();ctx.arc(bx+bw-13,by-9,3.2,0,TAU);ctx.fill();
      ctx.fillStyle="rgba(96,74,60,"+(.7+lit*.2).toFixed(2)+")";
      ctx.beginPath();ctx.ellipse(bx+bw*.4,by-8+br,bw*.32,3.4,0,0,TAU);ctx.fill();
    }
    /* лампочка для чтения у изголовья */
    const on=Math.sin(G.t*.02+t*2.1)>-.5;
    ctx.fillStyle="rgba(255,214,150,"+((on?.8:.15)*warm).toFixed(2)+")";
    ctx.beginPath();ctx.arc(bx+bw-3,by-14,2,0,TAU);ctx.fill();
    if(on)bGlow(bx+bw-3,by-14,18,"255,200,140",.10*warm);
  }
  ctx.strokeStyle="rgba(120,138,156,"+(.2+lit*.2).toFixed(2)+")";ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(bx+bw-2,fy);ctx.lineTo(bx+bw-2,fy-46);ctx.stroke();  // стойка коек
  /* стол с лампой, кружкой и планшетом; за ним сидит человек */
  const tx=cx+16;
  bBox(tx,fy-16,44,4,"rgba(60,50,42,.98)",lit,"rgba(0,0,0,.4)");
  ctx.fillStyle="rgba(40,48,58,.9)";ctx.fillRect(tx+4,fy-12,3,12);ctx.fillRect(tx+37,fy-12,3,12);
  ctx.fillStyle="rgba(210,225,238,"+warm.toFixed(2)+")";ctx.fillRect(tx+30,fy-21,6,5);  // кружка
  ctx.fillRect(tx+35,fy-20,2,2);
  bScreen(tx+8,fy-26,14,10,BM_COOL,lit,seed+2);
  /* настольная лампа даёт тёплое пятно — главный источник уюта в кадре */
  ctx.strokeStyle="rgba(160,176,192,"+(.3+lit*.2).toFixed(2)+")";ctx.lineWidth=1.6;
  ctx.beginPath();ctx.moveTo(tx+42,fy-16);ctx.lineTo(tx+42,fy-30);ctx.lineTo(tx+36,fy-33);ctx.stroke();
  ctx.fillStyle="rgba(255,220,160,"+(.7*warm+.2).toFixed(2)+")";
  ctx.beginPath();ctx.arc(tx+35,fy-32,2.6,0,TAU);ctx.fill();
  bGlow(tx+35,fy-30,34,"255,206,150",.10+lit*.10);
  bWorker(tx+2,fy,lit,true,G.t*.03+seed);
  /* шкафчики и зелень: жильё узнаётся по мелочам, а не по койкам */
  const lx=x0+w-26;
  for(let i=0;i<3;i++)bBox(lx,y0+16+i*18,22,16,"rgba(34,42,52,.96)",lit,"rgba(130,150,170,.25)");
  ctx.fillStyle="rgba(150,170,190,"+(.2+lit*.2).toFixed(2)+")";
  for(let i=0;i<3;i++)ctx.fillRect(lx+16,y0+22+i*18,4,2);
  const gx=cx+4;
  bBox(gx-5,fy-10,10,10,"rgba(70,54,44,.95)",lit,"rgba(0,0,0,.4)");
  /* листья разной длины и приглушённого цвета: ровный ярко-зелёный веер
     смотрелся салатом из семи одинаковых перьев */
  for(let i=0;i<6;i++){
    const a=-Math.PI/2+(i-2.5)*.36+Math.sin(G.t*.01+i)*.05;
    const len=8+((i*37)%5)*1.6;
    ctx.strokeStyle="rgba("+(i%2?"78,132,80":"96,152,92")+","+(.45+lit*.3).toFixed(2)+")";
    ctx.lineWidth=i%2?1.4:2;
    ctx.beginPath();ctx.moveTo(gx,fy-10);
    ctx.quadraticCurveTo(gx+Math.cos(a)*5,fy-14-len*.4,gx+Math.cos(a)*(len*.9),fy-12-len);ctx.stroke();
  }
  /* иллюминатор-экран: в разрезе окна быть не может, поэтому это вид с камеры */
  const px=x0+w-52,py=y0+14;
  ctx.fillStyle="rgba(8,12,20,.95)";ctx.beginPath();ctx.arc(px,py,11,0,TAU);ctx.fill();
  ctx.fillStyle="rgba(60,110,150,"+(.18+lit*.22).toFixed(2)+")";
  ctx.beginPath();ctx.arc(px,py,10,0,TAU);ctx.fill();
  ctx.fillStyle="rgba(220,235,250,"+(.4+lit*.3).toFixed(2)+")";
  for(let i=0;i<4;i++){const a=seed+i*2.1;
    ctx.fillRect(px+Math.cos(a)*7,py+Math.sin(a)*6,1.4,1.4);}
  ctx.strokeStyle="rgba(150,170,190,"+(.25+lit*.25).toFixed(2)+")";ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(px,py,11,0,TAU);ctx.stroke();
  /* потолочный свет тёплый: жилой отсек — единственное место на базе, где не
     должно быть сине-стального цеха, и одной настольной лампы на это не хватает */
  bLamp(cx-6,y0+4,34,fy,"255,222,178",.30+lit*.40);
},
};
/* плавильня, площадка, лаборатория и батарея — вторая половина таблицы,
   Object.assign в 21ab-base-interiors2 (распил 0.209.1). Таблица не разрезана:
   она собирается из двух половин в одну, и читатели видят её целой. */
