/* ══════════════ открытка: три места в пустоте ══════════════
   M208, отрезано от 25g-post-under на разборе 0.194.0: два подземных места
   и три пустотных разошлись по файлам, когда общий перевалил за сорок
   килобайт. Шов проходит там же, где он проходил в замысле: под землёй кадр
   освещён ИЗНУТРИ, фонарём, и глубина в нём перевёрнута; в пустоте свет один
   и жёсткий, а глубины нет вовсе — её приходится строить размером.

   ИМЯ ФАЙЛА НЕ СЛУЧАЙНО. `Sort-Object Name` в сборке не видит дефиса, поэтому
   `25ga-…` встал бы ПЕРЕД `25g-postcard` (сравниваются «25gapostscenes» и
   «25gpostcard», и «a» меньше «p»). Продолжаем основу, а не букву: под этой
   меркой выходит card → under → void, то есть ровно тот порядок, в котором
   их и надо читать. Наступали на это в M209, записано в CLAUDE.md.

   Набор `K` и правила те же, что у 25g-post-under: ни `G`, ни `ctx`, ни
   `W`/`H`; ни одного своего случайного числа; печать ставит `drawPostcard`. */
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
  /* 1а. галактика за спиной (M252): та, из-за которой пустота не чёрная, —
     видна как акварельные сгущения ПОД звёздами */
  pcNebula(c,(p&&p.seed)||1,w,h);
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
  /* 1. пустота и звёзды; галактика (M252) — под ними, как в поясе */
  c.fillStyle="rgb(5,6,12)";c.fillRect(0,0,w,h);
  pcNebula(c,p.seed,w,h);
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
  /* 2а. облачные валы (M252): акварельные сгущения между полосами. Правило
     полос живо — у воздуха резких краёв не бывает: слой в 4–5% плотности
     края не имеет, вал — сгущение, а не предмет. Свой генератор: полосы и
     перья существующих карточек не должны сдвинуться. */
  {
    const rw=rng(hashi(p.seed,s.cy|0,0x6A6));
    for(let i=0;i<3;i++){
      const cy2=h*(.22+rw()*.62), cx2=w*rw();
      const rx=w*(.18+rw()*.16);
      const col=pcMix(P[Math.min(P.length-1,1+Math.floor(rw()*3))],deep,.35);
      c.save();c.translate(cx2,cy2);c.scale(1,.30);c.translate(-cx2,-cy2);
      pcWash(c,rw,cx2,cy2,rx,rx*.8,pcA(col,.040),8);
      c.restore();
    }
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
