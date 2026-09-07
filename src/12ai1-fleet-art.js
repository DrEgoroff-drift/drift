/* ══════════════ ГЛАВТРАССА: как флот выглядит (выделено из 12ai, M415) ══════════════
   Треть модуля флота была не флотом, а ЕГО ОКРАСКОЙ: конвейер спрайта на все
   тринадцать классов, дом-мейкер поверх класса (§19.4), глифы промысла и
   отрисовка готового борта с огнями. Это самостоятельный слой — он ничего не
   знает ни про проход через систему, ни про норму топлива, ни про позывной, —
   и держать его в одном файле с ними мешало обоим: 58 КБ не читаются целиком.

   Порядок склейки: `12ai1-` ложится сразу за `12ai-fleet` (байтовый порядок:
   '-' < '1' < 'a'). Здесь объявлен `FLEET_ART` — кэш спрайтов; его читает
   только `fleetArtOf`, то есть во время кадра, а не на верхнем уровне. */
/* ── окраска: один конвейер на все классы (§18.5, §1) ── */
const FLEET_ART={},FLEET_SS=3;
function fleetArtOf(f){
  /* ── флот тоже чей-то (M369a, §19.4) ──
     Тринадцать классов остаются классами: они про РАБОТУ — почтовик, танкер,
     буксир. Завод берёт у них измерения 5–7: грунт, огни и подпись тяги, — и
     собственная грамматика стыков этого флота становится строкой ГЛАВТРАССЫ.
     Пока весь флот её и есть; чужие крылья прилетят с M371, и генератор их
     уже ждёт: достаточно положить `by` в запись. */
  const fby=f.by||"gt";
  const key="fl"+f.k+f.seed+"!"+fby;
  if(FLEET_ART[key])return FLEET_ART[key];
  const r=rng(hashi(f.seed,0xF1A7,5));
  const polys=[],lines=[],lights=[];
  const add=(pts,c,e)=>polys.push({p:pts,c,e:e||0});
  const rect=(x0,y0,x1,y1,c,e)=>add([[x0,y0],[x1,y0],[x1,y1],[x0,y1]],c,e);
  const ell=(cx,cy,rx,ry,c,e,n)=>{const p=[];n=n||18;for(let i=0;i<n;i++){const t=i/n*TAU;p.push([cx+Math.cos(t)*rx,cy+Math.sin(t)*ry]);}add(p,c,e);};
  /* палитра: санкирь (тёмная подложка) → серо-белый корпус → красная полоса → медь.
     §11/§16 (альманах III, 0.313.0): на белом листе корпуса в VII были правы, в
     кадре с туманностью зон I–III читались фарфором на саже (p95 .84–.90 при
     p95 кадра .21). Тона опущены на ступень ВНУТРИ серых — освещённый борт
     остаётся в VII, медиана тела ниже, теневая сторона уходит в III–IV; класс
     никогда не отличается подкраской (автор, 03.09: светло-серые с красным). */
  const C0=[[204,206,211],[162,166,173],[96,100,108],[168,52,44],[128,84,56],[40,44,52]];
  /* грунт завода подмешивается в три корпусных тона; полоса, медь и тень
     остаются общими — иначе флот перестанет читаться флотом */
  const C=(fby==="gt"||typeof makerGround!=="function")?C0:
    [mixc(C0[0],makerGround(fby),.5),mixc(C0[1],makerGround(fby),.42),
     mixc(C0[2],makerGround(fby),.3),C0[3],C0[4],C0[5]];
  let L,hw,nose,tail,band=[];
  /* стыки (§8, альманах III): всё навесное встречает корпус нарисованным
     узлом — тёмный хомут и светлая пластина, одна грамматика от панели до
     радиатора. joints: [x, y, длина вдоль корпуса, поперёк] */
  const joints=[];
  const joint=(x,y,l,t)=>joints.push([x,y,l,t]);
  /* тень навесного (§4, §5 — альманах III, 0.314.0): бак, контейнер, чужая
     баржа лежат НА теле и на дистанции встречи сливались с ним в одну трубу,
     потому что шов был линией в полпикселя. Свет сверху (−y): под каждой
     навесной вещью с её нижней кромки на тело ложится тёмная полоса в hw*.14 —
     объём читается тенью, а не контуром. Кладётся после тела и до вещи. */
  const shade=(x0,x1,y,t)=>{polys.push({p:[[x0,y],[x1,y],[x1,y+t],[x0,y+t]],c:5,e:0,col:[52,54,60]});};
  if(f.k==="post"){
    /* «Союз»: шар, колокол, цилиндр, два крыла панелей, стыковочный штырь */
    L=76;hw=9;nose=L*.5;tail=-L*.5;
    rect(-L*.05,-hw*.75,L*.22,hw*.75,1);            /* колокол (спускаемый) — усечён */
    add([[-L*.05,-hw*.8],[L*.2,-hw*.55],[L*.2,hw*.55],[-L*.05,hw*.8]],1,1);
    ell(L*.31,0,L*.13,hw*1.05,0,1,20);              /* шар орбитального */
    rect(L*.42,-1.2,nose,1.2,2);                    /* штырь */
    rect(tail*.92,-hw*.62,-L*.05,hw*.62,0,1);       /* приборно-агрегатный */
    for(let i=1;i<5;i++){const x=tail*.92+(L*.42)*i/5;lines.push([x,-hw*.6,x,hw*.6,.4]);}
    /* крылья панелей */
    for(const s of [-1,1]){
      rect(-L*.36,s*hw*.7,-L*.12,s*hw*2.9,5,1);
      for(let i=1;i<4;i++){const y=s*(hw*.7+(hw*2.2)*i/4);lines.push([-L*.36,y,-L*.12,y,.5]);}
      lines.push([-L*.24,s*hw*.7,-L*.24,s*hw*2.9,.5]);
      joint(-L*.24,s*hw*.66,L*.08,hw*.22);
    }
    ell(tail*.95,0,L*.05,hw*.45,5,1,12);            /* сопло */
    lights.push({x:tail*.98,y:0,c:"eng",r:hw*.4});
    band=[[tail*.9,-hw*.62],[-L*.06,-hw*.62],[-L*.06,-hw*.38],[tail*.9,-hw*.38]];
  }else if(f.k==="tanker"){
    /* «Протон»: толстое тело, шесть навесных баков вокруг, кольцо горловин */
    L=118;hw=13;nose=L*.5;tail=-L*.5;
    rect(tail*.85,-hw,nose*.7,hw,1,1);
    add([[nose*.7,-hw],[nose*.95,-hw*.45],[nose*.95,hw*.45],[nose*.7,hw]],0,1);
    for(const s of [-1,1])for(let j=0;j<2;j++){
      const y=s*(hw*(.55+j*.5)),x0=tail*.8,x1=nose*.55-j*L*.06;
      if(y+hw*.28<hw)shade(x0,x1,y+hw*.28,hw*.14);
      rect(x0,y-hw*.28,x1,y+hw*.28,j?2:0,1);
      ell(x1,y,L*.03,hw*.28,2,1,10);
      joint(x0+L*.12,y-s*hw*.28,L*.05,hw*.16);joint(x1-L*.12,y-s*hw*.28,L*.05,hw*.16);
    }
    rect(tail*.82,-hw*.42,tail*.62,hw*.42,2,1);     /* кольцо горловин */
    for(let i=0;i<5;i++){const y=-hw*.36+i*hw*.18;rect(tail*.9,y-1,tail*.82,y+1,4);}
    for(let i=1;i<6;i++){const x=tail*.85+(nose*.7-tail*.85)*i/6;lines.push([x,-hw,x,hw,.45]);}
    for(let i=0;i<2;i++){const y=(i-.5)*hw*.9;ell(tail*.95,y,L*.04,hw*.32,5,1,12);lights.push({x:tail*.98,y,c:"eng",r:hw*.3});}
    band=[[tail*.85,-hw*.55],[nose*.65,-hw*.55],[nose*.65,-hw*.25],[tail*.85,-hw*.25]];
  }else if(f.k==="node"){
    /* «УЗ-1»: ферма трасс — длинная решётка, на ней Короб, Кубрик, Воротник, Тамбур, Погреб */
    L=220;hw=10;nose=L*.5;tail=-L*.5;
    rect(tail*.95,-hw*.25,nose*.95,hw*.25,2,1);
    for(let x=tail*.9;x<nose*.9;x+=L*.05){lines.push([x,-hw*.25,x+L*.05,hw*.25,.5]);lines.push([x,hw*.25,x+L*.05,-hw*.25,.5]);}
    rect(-L*.06,-hw*1.4,L*.06,hw*1.4,0,1);                                   /* Воротник: узел, четыре порта */
    for(const s of [-1,1]){rect(-L*.03,s*hw*1.4,L*.03,s*hw*1.9,2);joint(0,s*hw*1.38,L*.06,hw*.2);}
    rect(tail*.7,-hw*1.1,-L*.12,hw*1.1,1,1);                                 /* Кубрик: жильё, окна */
    for(let i=0;i<5;i++)lights.push({x:tail*.7+L*.08+i*L*.1,y:-hw*.5,c:"win"});
    joint(-L*.09,0,L*.04,hw*1.2);
    rect(L*.12,-hw*1.3,nose*.75,hw*1.3,5,1);                                 /* Короб: груз, тёмный ящик */
    for(let i=1;i<4;i++){const x=L*.12+(nose*.63)*i/4;lines.push([x,-hw*1.3,x,hw*1.3,.5]);}
    joint(L*.09,0,L*.04,hw*1.2);
    rect(-L*.12,-hw*.6,-L*.06,hw*.6,1,1);                                    /* Тамбур: шлюз между */
    ell(tail*.85,0,L*.06,hw*1.25,1,1,18);joint(tail*.75,0,L*.03,hw*.8);       /* Погреб: шар-хранилище */
    for(const s of [-1,1]){add([[nose*.82,s*hw*.25],[nose*.98,s*hw*.25],[nose*.98,s*hw*3.4],[nose*.82,s*hw*3.4]],5,1);joint(nose*.9,s*hw*.24,L*.05,hw*.2);}
    lights.push({x:tail*.95,y:-hw*.3,c:"nav",g:0});lights.push({x:nose*.95,y:hw*.3,c:"nav",g:1});
    band=[[tail*.68,-hw*1.05],[-L*.14,-hw*1.05],[-L*.14,-hw*.7],[tail*.68,-hw*.7]];
  }else if(f.k==="derelict"){
    /* дерелик: чёрный корпус, ни огней, ни полосы, ни имени */
    L=120;hw=11;nose=L*.5;tail=-L*.5;
    add([[tail*.9,-hw*.6],[nose*.6,-hw*.8],[nose*.95,-hw*.2],[nose*.95,hw*.3],[nose*.5,hw*.9],[tail*.85,hw*.7]],5,1);
    rect(-L*.1,-hw*1.6,L*.15,-hw*.6,5,1);rect(-L*.3,hw*.7,-L*.05,hw*1.5,5,1);
    for(let i=1;i<6;i++){const x=tail*.85+(L*.7)*i/6;lines.push([x,-hw*.6,x,hw*.7,.6]);}
    /* пробоина: тёмное пятно ещё чернее */
    ell(L*.1,hw*.1,L*.06,hw*.4,5,1,10);polys[polys.length-1].col=[8,9,12];
    band=[];
  }else if(f.k==="rescue"){
    /* «Луна-9»: шар, раскрытый на четыре лепестка — шлюз-цветок */
    L=70;hw=10;nose=L*.5;tail=-L*.5;
    rect(tail*.9,-hw*.5,-L*.05,hw*.5,1,1);
    for(let i=1;i<4;i++){const x=tail*.9+(L*.4)*i/4;lines.push([x,-hw*.5,x,hw*.5,.4]);}
    ell(L*.2,0,L*.16,hw*1.15,0,1,20);
    for(const [a,c] of [[-2.2,5],[-.9,1],[.9,1],[2.2,5]]){const cx=L*.2+Math.cos(a)*L*.14,cy=Math.sin(a)*hw*1.05;
      add([[cx,cy],[cx+Math.cos(a-.5)*L*.18,cy+Math.sin(a-.5)*hw*1.4],[cx+Math.cos(a)*L*.24,cy+Math.sin(a)*hw*1.8],[cx+Math.cos(a+.5)*L*.18,cy+Math.sin(a+.5)*hw*1.4]],c,1);
      joint(cx,cy,L*.05,hw*.18);}
    ell(tail*.94,0,L*.045,hw*.42,5,1,12);lights.push({x:tail*.97,y:0,c:"eng",r:hw*.36});
    lights.push({x:L*.11,y:-hw*.45,c:"win"});
    band=[[tail*.88,-hw*.48],[-L*.06,-hw*.48],[-L*.06,-hw*.24],[tail*.88,-hw*.24]];
  }else if(f.k==="ore"){
    /* «Энергия»: бочка и четыре контейнера по бокам — пакет, гружёный */
    L=124;hw=12;nose=L*.5;tail=-L*.5;
    rect(tail*.9,-hw*.7,nose*.75,hw*.7,1,1);add([[nose*.75,-hw*.7],[nose*.95,-hw*.25],[nose*.95,hw*.25],[nose*.75,hw*.7]],0,1);
    for(const s of [-1,1])for(let j=0;j<2;j++){const x0=tail*.7+j*L*.36,x1=x0+L*.3,y=s*hw*1.05;
      if(s<0)shade(x0,x1,y+hw*.35,hw*.14);
      rect(x0,y-hw*.35,x1,y+hw*.35,j?0:2,1);lines.push([x0+L*.1,y-hw*.35,x0+L*.1,y+hw*.35,.4]);lines.push([x0+L*.2,y-hw*.35,x0+L*.2,y+hw*.35,.4]);
      joint(x0+L*.06,y-s*hw*.35,L*.05,hw*.16);joint(x1-L*.06,y-s*hw*.35,L*.05,hw*.16);}
    for(let i=1;i<6;i++){const x=tail*.9+(L*.65)*i/6;lines.push([x,-hw*.7,x,hw*.7,.4]);}
    for(let i=0;i<4;i++){const y=(i-1.5)*hw*.36;ell(tail*.96,y,L*.03,hw*.17,5,1,10);lights.push({x:tail*.99,y,c:"eng",r:hw*.16});}
    band=[[tail*.88,-hw*.45],[nose*.7,-hw*.45],[nose*.7,-hw*.2],[tail*.88,-hw*.2]];
  }else if(f.k==="hosp"){
    /* ТКС: большой корпус и возвращаемая капсула на носу */
    L=110;hw=11;nose=L*.5;tail=-L*.5;
    rect(tail*.9,-hw*.85,nose*.3,hw*.85,1,1);
    add([[nose*.3,-hw*.55],[nose*.6,-hw*.75],[nose*.95,-hw*.2],[nose*.95,hw*.2],[nose*.6,hw*.75],[nose*.3,hw*.55]],0,1);   /* капсула */
    joint(nose*.3,-hw*.7,L*.03,hw*1.4);
    for(let i=1;i<5;i++){const x=tail*.9+(L*.6)*i/5;lines.push([x,-hw*.85,x,hw*.85,.45]);}
    for(const s of [-1,1]){rect(-L*.2,s*hw*.85,L*.05,s*hw*2.4,5,1);joint(-L*.07,s*hw*.82,L*.1,hw*.2);}
    ell(tail*.94,0,L*.045,hw*.5,5,1,12);lights.push({x:tail*.97,y:0,c:"eng",r:hw*.4});
    lights.push({x:-L*.3,y:-hw*.3,c:"win"});lights.push({x:-L*.3,y:hw*.3,c:"win"});
    band=[[tail*.88,-hw*.62],[-L*.16,-hw*.62],[-L*.16,-hw*.35],[tail*.88,-hw*.35]];
  }else if(f.k==="school"){
    /* «Восток»×6: гроздь сферических капсул на общей ферме, у каждой свой люк.
       Хребет (§13, альманах III): тонкая тёмная рейка терялась на расстоянии
       встречи, и шесть шаров читались шестью предметами. Ферма толще и светлее,
       по каждому борту поручень, связывающий свои три капсулы, под всем рядом
       одна общая тень; шесть капсул умещаются в спрайт (две висели за носом). */
    L=112;hw=8;nose=L*.5;tail=-L*.5;
    rect(tail*.9,-hw*.45,nose*.9,hw*.45,1,1);
    lines.push([tail*.9,-hw*.45,nose*.9,-hw*.45,.6]);lines.push([tail*.9,hw*.45,nose*.9,hw*.45,.6]);
    for(let x=tail*.85;x<nose*.85;x+=L*.08)lines.push([x,-hw*.45,x+L*.08,hw*.45,.35]);
    for(const s of [-1,1])rect(tail*.75,s*hw*2.05,nose*.85,s*hw*2.25,2,1);          /* поручни */
    rect(tail*.85,hw*.45,nose*.85,hw*.75,5);                                          /* общая тень */
    for(let i=0;i<6;i++){const x=tail*.8+i*L*.16,s=(i%2?1:-1),cy=s*hw*1.3;
      rect(x-L*.015,0,x+L*.015,cy,2,1);ell(x,cy,L*.075,hw*1.05,0,1,16);
      add([[x+L*.04,cy-hw*.3],[x+L*.075,cy-hw*.25],[x+L*.075,cy+hw*.25],[x+L*.04,cy+hw*.3]],5);joint(x,s*hw*.45,L*.04,hw*.18);}
    ell(tail*.94,0,L*.04,hw*.5,5,1,12);lights.push({x:tail*.97,y:0,c:"eng",r:hw*.4});
    band=[[tail*.88,-hw*.28],[nose*.6,-hw*.28],[nose*.6,-hw*.05],[tail*.88,-hw*.05]];
  }else if(f.k==="exped"){
    /* «Салют»: цилиндр, ферма тарелок, зонды на выносах */
    L=126;hw=10;nose=L*.5;tail=-L*.5;
    rect(tail*.9,-hw*.75,-L*.05,hw*.75,1,1);rect(-L*.05,-hw*.5,nose*.6,hw*.5,0,1);rect(nose*.6,-hw*.3,nose*.9,hw*.3,2,1);
    for(let i=1;i<5;i++){const x=tail*.9+(L*.4)*i/5;lines.push([x,-hw*.75,x,hw*.75,.45]);}
    for(const s of [-1,1]){rect(-L*.3,s*hw*.75,-L*.2,s*hw*2.6,5,1);joint(-L*.25,s*hw*.72,L*.08,hw*.2);
      rect(L*.15,s*hw*.5,L*.17,s*hw*2.2,2);ell(L*.16,s*hw*2.3,L*.06,hw*.55,0,1,12);joint(L*.16,s*hw*.48,L*.05,hw*.18);   /* тарелки */
      rect(nose*.7,s*hw*.3,nose*.72,s*hw*1.6,2);ell(nose*.71,s*hw*1.7,L*.02,hw*.25,5,1,8);}                                /* зонды */
    ell(tail*.94,0,L*.04,hw*.45,5,1,12);lights.push({x:tail*.97,y:0,c:"eng",r:hw*.36});lights.push({x:-L*.5,y:0,c:"win"});
    band=[[tail*.88,-hw*.55],[-L*.08,-hw*.55],[-L*.08,-hw*.28],[tail*.88,-hw*.28]];
  }else if(f.k==="fridge"){
    /* «Прогресс»: тот же нос, что у почтовика, и длинный ребристый рефрижераторный отсек */
    L=108;hw=9;nose=L*.5;tail=-L*.5;
    rect(tail*.92,-hw*.62,L*.12,hw*.62,0,1);
    /* рёбра (§5): не волосяные линии, а гофр в два тона — гребень светлый,
       впадина на ступень темнее; на 8 px это ещё читается ребристой трубой */
    for(let i=0;i<10;i++){const x0=tail*.9+(L*.56)*i/10,x1=tail*.9+(L*.56)*(i+1)/10;
      if(i%2){rect(x0,-hw*.62,x1,hw*.62,1,0);polys[polys.length-1].col=[178,182,189];}
      lines.push([x0,-hw*.62,x0,hw*.62,.5]);}
    add([[L*.12,-hw*.8],[L*.34,-hw*.55],[L*.34,hw*.55],[L*.12,hw*.8]],1,1);ell(L*.42,0,L*.1,hw*.95,0,1,18);rect(L*.5,-1,nose,1,2);
    for(const s of [-1,1]){rect(-L*.2,s*hw*.7,L*.02,s*hw*2.7,5,1);joint(-L*.09,s*hw*.66,L*.08,hw*.22);}
    ell(tail*.96,0,L*.04,hw*.42,5,1,12);lights.push({x:tail*.98,y:0,c:"eng",r:hw*.36});
    band=[[tail*.9,-hw*.6],[L*.1,-hw*.6],[L*.1,-hw*.34],[tail*.9,-hw*.34]];
  }else if(f.k==="lighter"){
    /* «семёрка»: королёвский крест — четыре чужие баржи на общей связке */
    L=130;hw=9;nose=L*.5;tail=-L*.5;
    rect(tail*.9,-hw*.6,nose*.8,hw*.6,1,1);add([[nose*.8,-hw*.6],[nose,-hw*.2],[nose,hw*.2],[nose*.8,hw*.6]],0,1);
    const bc=[[92,84,70],[70,86,96],[96,72,66],[74,92,74]];
    for(let i=0;i<4;i++){const s=i<2?-1:1,x0=tail*.85+(i%2)*L*.42,x1=x0+L*.38,y=s*hw*1.45;
      if(s<0)shade(x0,x1,y+hw*.5,hw*.14);
      add([[x0,y-hw*.5],[x1,y-hw*.5],[x1,y+hw*.5],[x0,y+hw*.5]],5,1);
      polys[polys.length-1].col=bc[i];
      lines.push([x0+L*.12,y-hw*.5,x0+L*.12,y+hw*.5,.4]);lines.push([x0+L*.26,y-hw*.5,x0+L*.26,y+hw*.5,.4]);
      joint(x0+L*.08,y-s*hw*.5,L*.05,hw*.2);joint(x1-L*.08,y-s*hw*.5,L*.05,hw*.2);}
    for(let i=1;i<7;i++){const x=tail*.9+(L*.7)*i/7;lines.push([x,-hw*.6,x,hw*.6,.4]);}
    for(let i=0;i<2;i++){const y=(i-.5)*hw*.6;ell(tail*.96,y,L*.035,hw*.25,5,1,10);lights.push({x:tail*.99,y,c:"eng",r:hw*.22});}
    band=[[tail*.88,-hw*.4],[nose*.75,-hw*.4],[nose*.75,-hw*.16],[tail*.88,-hw*.16]];
  }else if(f.k==="patrol"){
    /* «Спираль»+«Алмаз»: несущий корпус с задранным носом, короткие крылья, пушка под скулой */
    L=88;hw=8;nose=L*.5;tail=-L*.5;
    add([[tail*.9,-hw*.9],[nose*.5,-hw*.95],[nose*.92,-hw*.3],[nose,hw*.1],[nose*.8,hw*.7],[tail*.9,hw*.9]],0,1);
    add([[nose*.5,-hw*.95],[nose*.92,-hw*.3],[nose*.7,-hw*1.15],[nose*.3,-hw*1.2]],1,1);     /* задранный нос */
    for(const s of [-1,1]){add([[-L*.2,s*hw*.9],[L*.12,s*hw*.9],[L*.02,s*hw*2.1],[-L*.16,s*hw*2.1]],1,1);joint(-L*.06,s*hw*.86,L*.14,hw*.22);}
    rect(nose*.2,hw*.5,nose*.7,hw*.95,5,1);           /* пушка под скулой */
    rect(nose*.7,hw*.62,nose*.98,hw*.82,5);
    rect(-L*.1,-hw*.55,L*.2,-hw*.1,2,1);              /* фонарь кабины */
    for(let i=1;i<4;i++){const x=tail*.8+(L*.5)*i/4;lines.push([x,-hw*.85,x,hw*.85,.4]);}
    ell(tail*.94,0,L*.04,hw*.5,5,1,12);
    lights.push({x:tail*.97,y:0,c:"eng",r:hw*.45});
    band=[[tail*.85,-hw*.6],[nose*.4,-hw*.6],[nose*.4,-hw*.3],[tail*.85,-hw*.3]];
  }else if(f.k==="ferry"){
    /* «Буран»: дельта-крыло, чёрное брюхо, белая спина */
    L=104;hw=9;nose=L*.5;tail=-L*.5;
    add([[tail*.95,-hw*.55],[nose*.92,-hw*.2],[nose,hw*.15],[nose*.92,hw*.5],[tail*.95,hw*.6]],0,1);   /* фюзеляж */
    add([[tail*.95,hw*.15],[nose*.9,hw*.42],[nose,hw*.15],[nose*.92,hw*.5],[tail*.95,hw*.6]],5,1);      /* чёрное брюхо: зона II–III */
    /* крыло верхнее (§2, альманах III): не одна белая плоскость — три полосы
       по размаху с падением тона от корня к концу, ряды плитки поперёк и
       хордовые линии, сходящиеся к концу; направление кладки и есть светотень */
    {const wr=[[-L*.12,-hw*.5],[nose*.55,-hw*.25]],wt=[[tail*.85,-hw*3.2],[-L*.05,-hw*3.2]];
     const lp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
     const cols=[null,[190,193,199],[174,178,185]];
     for(let i=0;i<3;i++){const t0=i/3,t1=(i+1)/3;
       add([lp(wr[0],wt[0],t0),lp(wr[1],wt[1],t0),lp(wr[1],wt[1],t1),lp(wr[0],wt[0],t1)],0,1);
       if(cols[i])polys[polys.length-1].col=cols[i];}
     for(let i=1;i<7;i++){const a=lp(wr[0],wt[0],i/7),b=lp(wr[1],wt[1],i/7);lines.push([a[0],a[1],b[0],b[1],.35]);}   /* плитка: ряды поперёк */
     for(const u of [.3,.55,.8]){const a=lp(wr[0],wr[1],u),b=lp(wt[0],wt[1],u);lines.push([a[0],a[1],b[0],b[1],.45]);}} /* хорды: к концу крыла */
    add([[-L*.12,hw*.55],[nose*.55,hw*.4],[-L*.05,hw*3.2],[tail*.85,hw*3.2]],5,1);                     /* крыло нижнее, чёрное */
    joint(-L*.02,-hw*.5,L*.2,hw*.2);joint(-L*.02,hw*.5,L*.2,hw*.2);
    add([[tail*.98,-hw*.55],[tail*.75,-hw*.55],[tail*.7,-hw*1.9],[tail*.92,-hw*1.9]],1,1);            /* киль */
    rect(nose*.55,-hw*.35,nose*.85,-hw*.05,2,1);      /* остекление */
    for(let i=0;i<3;i++){const y=(i-1)*hw*.34;ell(tail*.98,y,L*.035,hw*.17,4,1,10);lights.push({x:tail,y,c:"eng",r:hw*.16});}
    band=[[tail*.9,-hw*.5],[nose*.5,-hw*.32],[nose*.5,-hw*.12],[tail*.9,-hw*.22]];
  }else if(f.k==="base"){
    /* «Мир»: цилиндры разного диаметра, узловой модуль, панели под разными углами */
    L=150;hw=11;nose=L*.5;tail=-L*.5;
    rect(tail*.9,-hw*.7,-L*.2,hw*.7,1,1);            /* базовый блок */
    rect(-L*.2,-hw,L*.06,hw,0,1);                     /* узловой — Воротник */
    rect(L*.06,-hw*.55,nose*.8,hw*.55,1,1);           /* рабочий отсек */
    rect(nose*.8,-hw*.35,nose,hw*.35,2,1);
    for(let i=1;i<5;i++){const x=tail*.9+(L*.7)*i/5;lines.push([x,-hw*.68,x,hw*.68,.45]);}
    const pan=[[-L*.07,-1,.55],[-L*.07,1,-.35],[L*.3,-1,.15],[L*.3,1,-.2],[tail*.6,-1,-.25]];
    for(const q of pan){const [x,s,ang]=q;const l=hw*2.6,w=L*.06;const c=Math.cos(ang),sn=Math.sin(ang);
      const p0=[x,s*hw*.7];const dirx=-sn*s,diry=c*s;
      add([[p0[0]-w*c,p0[1]-w*sn],[p0[0]+w*c,p0[1]+w*sn],[p0[0]+w*c+dirx*l,p0[1]+w*sn+diry*l],[p0[0]-w*c+dirx*l,p0[1]-w*sn+diry*l]],5,1);
      joint(x,s*hw*.66,w*1.6,hw*.2);}
    rect(-L*.17,-hw*1.5,-L*.03,-hw,2,1);joint(-L*.1,-hw*.98,L*.1,hw*.2);   /* стыковочный узел вверх */
    ell(tail*.95,0,L*.03,hw*.4,5,1,12);lights.push({x:tail*.98,y:0,c:"eng",r:hw*.3});
    lights.push({x:-L*.07,y:0,c:"win"});lights.push({x:L*.34,y:-hw*.2,c:"win"});
    band=[[tail*.88,-hw*.55],[-L*.2,-hw*.55],[-L*.2,-hw*.28],[tail*.88,-hw*.28]];
  }else{
    /* ядерный буксир: хребет, реактор на штанге впереди, два плоских радиатора-крыла, колокол сзади */
    L=136;hw=7;nose=L*.5;tail=-L*.5;
    rect(-L*.3,-hw*.35,nose*.55,hw*.35,2,1);          /* штанга */
    rect(nose*.55,-hw*.9,nose*.92,hw*.9,5,1);          /* реактор */
    rect(nose*.92,-hw*.5,nose,hw*.5,4);
    rect(-L*.36,-hw*1.1,-L*.05,hw*1.1,1,1);            /* обитаемый блок */
    for(const s of [-1,1]){
      add([[-L*.28,s*hw*1.1],[nose*.45,s*hw*1.1],[nose*.3,s*hw*4.2],[-L*.15,s*hw*4.2]],5,1);
      joint(L*.05,s*hw*1.06,L*.22,hw*.3);
      for(let i=1;i<6;i++){const x=-L*.26+(nose*.68)*i/6;lines.push([x,s*hw*1.1,x-L*.02,s*hw*4.1,.35]);}
    }
    add([[tail*.72,-hw*.8],[tail*.92,-hw*1.6],[tail*.92,hw*1.6],[tail*.72,hw*.8]],5,1);
    rect(tail*.75,-hw*.7,-L*.36,hw*.7,0,1);
    lights.push({x:tail*.94,y:0,c:"eng",r:hw*.9});
    band=[[tail*.75,-hw*.7],[-L*.36,-hw*.7],[-L*.36,-hw*.3],[tail*.75,-hw*.3]];
  }
  lights.push({x:nose*.3,y:-hw,c:"nav",g:0});lights.push({x:nose*.3,y:hw,c:"nav",g:1});
  /* знак класса (§9, §18.2): где на корпусе стоит диск в рост тела — по классу,
     чтобы не лечь на номер, навесной бак или люк. [x, y, радиус] */
  const EMB={post:[L*.31,0,hw*.85],tanker:[nose*.8,0,hw*.6],tug:[-L*.2,0,hw*.9],fridge:[0,0,hw*.58],
    ore:[L*.135,0,hw*.65],lighter:[L*.15,0,hw*.55],ferry:[-L*.06,-hw*1.6,hw*.75],patrol:[L*.28,-hw*.15,hw*.6],
    rescue:[L*.2,0,hw*.55],hosp:[0,0,hw*.85],school:[L*.22,-hw*1.3,hw*.8],exped:[-L*.12,0,hw*.7],base:[L*.18,0,hw*.55]};
  const emb=EMB[f.k]||null;
  /* габарит тела в своих осях — подпись под кораблём считается от него (§3) */
  let bx=0,by=0;for(const q of polys)for(const pt of q.p){bx=Math.max(bx,Math.abs(pt[0]));by=Math.max(by,Math.abs(pt[1]));}
  const rad=L*.75;
  const cn=document.createElement("canvas");
  cn.width=cn.height=Math.ceil(rad*2*FLEET_SS);
  const g=cn.getContext("2d");const prev=ctx;ctx=g;
  g.setTransform(FLEET_SS,0,0,FLEET_SS,rad*FLEET_SS,rad*FLEET_SS);
  const poly=q=>{ctx.beginPath();ctx.moveTo(q.p[0][0],q.p[0][1]);for(let i=1;i<q.p.length;i++)ctx.lineTo(q.p[i][0],q.p[i][1]);ctx.closePath();};
  /* санкирь: тёмная подложка под всем — обвод первым (§13) */
  for(const q of polys){poly(q);ctx.fillStyle="rgb(40,44,52)";ctx.lineWidth=1.6;ctx.strokeStyle="rgb(40,44,52)";ctx.stroke();}
  /* серые: тело */
  for(const q of polys){poly(q);const c=q.col||C[q.c];ctx.fillStyle="rgb("+c.join(",")+")";ctx.fill();
    ctx.strokeStyle="rgba(0,0,0,"+(q.e?.5:.25)+")";ctx.lineWidth=q.e?.6:.35;ctx.stroke();}
  for(const l of lines){ctx.strokeStyle="rgba(0,0,0,"+(l[4]*.7).toFixed(2)+")";ctx.lineWidth=l[4];ctx.beginPath();ctx.moveTo(l[0],l[1]);ctx.lineTo(l[2],l[3]);ctx.stroke();}
  for(const j of joints){ctx.fillStyle="rgb(40,44,52)";ctx.fillRect(j[0]-j[2]/2,j[1]-j[3]/2,j[2],j[3]);
    ctx.fillStyle="rgba(236,236,240,.8)";ctx.fillRect(j[0]-j[2]/2+.6,j[1]-j[3]/2+.5,j[2]-1.2,Math.max(.6,j[3]*.28));
    ctx.fillStyle="rgba(0,0,0,.5)";ctx.fillRect(j[0]-j[2]*.35,j[1]-j[3]/2,.7,j[3]);ctx.fillRect(j[0]+j[2]*.35,j[1]-j[3]/2,.7,j[3]);}
  /* лессировка: красная полоса во всю длину, номер, имя, знак класса */
  if(band.length){ctx.fillStyle="rgb("+C[3].join(",")+")";ctx.beginPath();ctx.moveTo(band[0][0],band[0][1]);for(let i=1;i<4;i++)ctx.lineTo(band[i][0],band[i][1]);ctx.closePath();ctx.fill();}
  if(band.length){
  ctx.fillStyle="rgba(30,30,34,.9)";ctx.font="bold "+(hw*.9).toFixed(1)+"px ui-monospace,monospace";ctx.textAlign="center";ctx.textBaseline="middle";
  ctx.fillText(f.num?f.num.slice(2):f.name,(band[0][0]+band[1][0])/2,(band[1][1]+band[2][1])/2+hw*.62);
  ctx.font="bold "+(hw*.62).toFixed(1)+"px ui-monospace,monospace";ctx.fillStyle="rgba(30,30,34,.85)";
  ctx.fillText(f.name,(band[0][0]+band[1][0])/2,band[0][1]-hw*.34);
  }
  /* знак класса (§9, §18.2; альманах III, 0.313.0): одна конструкция на все
     тринадцать — светлый диск в рост тела, красный обод одной толщины, внутри
     одна залитая фигура закрытого алфавита на .62 диска; операции — поворот и
     отражение, больше ничего. Знак, а не силуэт, несёт класс сквозь 8 px;
     раньше тринадцать разных рисунков в hw*.42 доживали до встречи одним крестом. */
  if(emb){const [mx,my,R]=emb;
    ctx.save();ctx.translate(mx,my);
    ctx.fillStyle="rgb(226,228,232)";ctx.beginPath();ctx.arc(0,0,R,0,TAU);ctx.fill();
    ctx.strokeStyle="rgb("+C[3].join(",")+")";ctx.lineWidth=Math.max(.8,R*.16);ctx.beginPath();ctx.arc(0,0,R-ctx.lineWidth/2,0,TAU);ctx.stroke();
    ctx.fillStyle="rgb("+C[3].join(",")+")";fleetGlyph(f.k,R*.62);
    ctx.restore();}
  /* износ — ПОД бликами: заплаты не в тон, копоть от движков веером, полоса выгорела */
  for(let i=0;i<3+Math.floor(r()*4);i++){
    const q=polys[Math.floor(r()*polys.length)];if(!q||q.c>2)continue;
    const p=q.p[Math.floor(r()*q.p.length)];
    ctx.fillStyle="rgba("+(C[q.c][0]-14)+","+(C[q.c][1]-10)+","+(C[q.c][2]-4)+",.9)";
    ctx.fillRect(p[0]+(r()-.5)*L*.06,p[1]+(r()-.5)*hw*.6,L*.03+r()*L*.03,hw*.25+r()*hw*.3);
  }
  for(const li of lights){if(li.c!=="eng")continue;
    const sg=ctx.createLinearGradient(li.x,0,li.x+L*.22,0);sg.addColorStop(0,"rgba(20,16,12,.55)");sg.addColorStop(1,"rgba(20,16,12,0)");
    ctx.fillStyle=sg;ctx.fillRect(li.x,li.y-li.r*1.6,L*.22,li.r*3.2);
    ctx.fillStyle="rgba(128,84,56,.7)";ctx.fillRect(li.x-L*.02,li.y-li.r*1.05,L*.03,li.r*2.1);}
  if(band.length){ctx.fillStyle="rgba(255,190,170,.28)";ctx.beginPath();ctx.moveTo(band[0][0],band[0][1]);ctx.lineTo(band[1][0],band[1][1]);ctx.lineTo(band[1][0],band[1][1]+hw*.1);ctx.lineTo(band[0][0],band[0][1]+hw*.1);ctx.fill();}
  /* один свет на всю сборку последним слоем; кромка ловит свет. Растяжка
     шла от −3hw до 2hw с нулём на −hw — до самого тела свет не доходил, его
     получали одни панели, а борт оставался плоским тоном (§16, 0.313.0).
     Теперь ноль на −.2hw: верхняя кромка тела в VII, нижняя в III–IV. */
  ctx.globalCompositeOperation="source-atop";
  const lg=ctx.createLinearGradient(0,-hw*1.8,0,hw*1.6);
  lg.addColorStop(0,f.k==="derelict"?"rgba(120,130,150,.18)":"rgba(255,240,216,.28)");lg.addColorStop(.5,"rgba(255,224,196,0)");lg.addColorStop(1,"rgba(0,0,0,.62)");
  ctx.fillStyle=lg;ctx.fillRect(-rad,-rad,rad*2,rad*2);
  ctx.globalCompositeOperation="source-over";
  ctx=prev;
  const art={cn,rad,L,hw,lights,bx,by,emb};
  FLEET_ART[key]=art;return art;
}
/* ── алфавит знаков (§18.2): десять фигур, у каждой одна заливка; повороты
   0/45/90 и отражение — единственные операции; h — полуразмер фигуры ── */
function fleetGlyph(k,h){
  const P=()=>ctx.beginPath();
  const horn=()=>{P();ctx.moveTo(-h,h*.5);ctx.lineTo(h,-h*.95);ctx.lineTo(h,h*.95);ctx.closePath();ctx.fill();};
  const drop=()=>{P();ctx.moveTo(0,-h);ctx.bezierCurveTo(h*.95,h*.1,h*.75,h,0,h);ctx.bezierCurveTo(-h*.75,h,-h*.95,h*.1,0,-h);ctx.fill();};
  const anchor=()=>{ctx.fillRect(-h*.15,-h,h*.3,h*1.8);ctx.fillRect(-h*.7,-h*.55,h*1.4,h*.28);
    P();ctx.arc(0,h*.1,h,Math.PI*.12,Math.PI*.88);ctx.arc(0,h*.1,h*.62,Math.PI*.88,Math.PI*.12,true);ctx.closePath();ctx.fill();};
  const pick=()=>{ctx.fillRect(-h*.15,-h*.45,h*.3,h*1.45);P();ctx.moveTo(-h,-h*.25);ctx.quadraticCurveTo(0,-h*1.15,h,-h*.25);ctx.quadraticCurveTo(0,-h*.55,-h,-h*.25);ctx.closePath();ctx.fill();};
  const ring=()=>{P();ctx.arc(0,0,h,0,TAU);ctx.arc(0,0,h*.58,0,TAU,true);ctx.fill();
    for(let i=0;i<4;i++){ctx.save();ctx.rotate(i*Math.PI/2);ctx.fillRect(-h*.14,-h*.62,h*.28,h*.62);ctx.restore();}};
  const palm=()=>{P();ctx.arc(0,h*.15,h,Math.PI,0);ctx.lineTo(h,h);ctx.lineTo(-h,h);ctx.closePath();
    ctx.rect(-h*.55,-h*.6,h*.14,h*.85);ctx.rect(-h*.07,-h*.78,h*.14,h*1.03);ctx.rect(h*.41,-h*.6,h*.14,h*.85);ctx.fill("evenodd");};
  const shield=()=>{P();ctx.moveTo(-h,-h);ctx.lineTo(h,-h);ctx.lineTo(h,h*.1);ctx.quadraticCurveTo(h,h*.8,0,h);ctx.quadraticCurveTo(-h,h*.8,-h,h*.1);ctx.closePath();ctx.fill();};
  const cross=()=>{ctx.fillRect(-h*.3,-h,h*.6,h*2);ctx.fillRect(-h,-h*.3,h*2,h*.6);};
  const book=()=>{P();ctx.moveTo(-h,-h*.6);ctx.lineTo(0,-h*.25);ctx.lineTo(h,-h*.6);ctx.lineTo(h,h*.55);ctx.lineTo(0,h*.9);ctx.lineTo(-h,h*.55);ctx.closePath();ctx.fill();};
  const compass=()=>{P();ctx.moveTo(0,-h);ctx.lineTo(h*.85,h);ctx.lineTo(h*.45,h);ctx.lineTo(0,-h*.15);ctx.lineTo(-h*.45,h);ctx.lineTo(-h*.85,h);ctx.closePath();ctx.fill();
    P();ctx.arc(0,-h*.7,h*.3,0,TAU);ctx.fill();};
  const op=(rot,fy,fn)=>{ctx.save();ctx.rotate(rot);ctx.scale(1,fy);fn();ctx.restore();};
  switch(k){
    case "post":horn();break;
    case "tanker":drop();break;
    case "fridge":op(0,-1,drop);break;            /* капля отражена: холод */
    case "tug":anchor();break;
    case "ore":pick();break;
    case "base":ring();break;
    case "lighter":op(Math.PI/4,1,ring);break;    /* кольцо на 45°: крестовина */
    case "rescue":palm();break;
    case "ferry":op(0,-1,palm);break;             /* ладонь вниз: людей вниз */
    case "patrol":shield();break;
    case "hosp":cross();break;
    case "school":book();break;
    case "exped":compass();break;
  }
}
function drawFleetShip(f){
  const art=fleetArtOf(f);
  ctx.drawImage(art.cn,-art.rad,-art.rad,art.rad*2,art.rad*2);
  for(const li of art.lights){
    if(li.c==="nav"){
      const on=Math.sin(G.t*.05+(li.g?1.6:0))>.6?.95:.2;
      ctx.fillStyle=(li.g?"rgba(120,240,150,":"rgba(255,90,80,")+on+")";
      ctx.beginPath();ctx.arc(li.x,li.y,1.4,0,TAU);ctx.fill();
    }else if(li.c==="win"){
      ctx.fillStyle=(Math.sin(G.t*.03+li.x)>-.4)?"rgba(255,228,170,.9)":"rgba(255,228,170,.4)";
      ctx.beginPath();ctx.arc(li.x,li.y,1.3,0,TAU);ctx.fill();
    }else if(li.c==="eng"){
      /* зев сопла — подпись тяги завода (M369a, измерение 7): у ГЛАВТРАССЫ
         оранжевый, у Коммуны фиалковый, у Хай-Фронта бирюзовый */
      const MF=(typeof makerFlame==="function")?makerFlame(f.by||"gt"):null;
      const fg=ctx.createRadialGradient(li.x,li.y,0,li.x,li.y,li.r*1.3);
      if(MF&&(f.by||"gt")!=="gt"){
        fg.addColorStop(0,rgba(mixc(MF.col,[255,255,255],.35),.85));
        fg.addColorStop(.5,rgba(MF.col,.35));
        fg.addColorStop(1,rgba(MF.col,0));
      }else{
      fg.addColorStop(0,"rgba(255,214,158,.85)");fg.addColorStop(.5,"rgba(255,150,80,.35)");fg.addColorStop(1,"rgba(255,120,60,0)");}
      ctx.fillStyle=fg;ctx.beginPath();ctx.arc(li.x,li.y,li.r*1.3,0,TAU);ctx.fill();
    }
  }
}
