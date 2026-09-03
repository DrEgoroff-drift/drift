/* ══════════════ ГЛАВТРАССА: флот, который нельзя купить (M310, DESIGN-holding §18) ══════════════ */
/* Баржа торгует. Флот возит и служит. Тринадцать классов с реальных
   доноров (§18.3), окраска одна на всех (§18.5): серо-белый корпус, красная
   полоса во всю длину, чёрный номер в треть высоты, жжёная медь у сопел, имя
   крупно по борту, под ним мелко — ведомство, номер, трасса. Износ
   обязателен и лежит ПОД бликами (§1 свода).

   Имена — свои, не МКС (развилка 4 критики, решена автором 03.09.2026):
   корабли зовутся вещными словами в ряду Тук/Барма; модули узловой станции —
   Короб, Кубрик, Воротник, Тамбур, Погреб; узловая по позывному «УЗ-1»;
   дерелик без имени — чёрный корпус и есть его голос.

   Движение — как у барж (§18.9): положение = f(линия, семя, Date.now()),
   хранятся только последствия (G.fleetLog: когда в этой системе заправили
   по норме). Кого встречаешь — по лестнице (§18.8): с Буя (5) проходит
   почтовик, со Стыковочного узла (16) — танкер, с Причальной фермы (19) —
   буксир. Остальные классы в таблице с голосами, но без рисунка: их не
   спавним, пока они не нарисованы — силуэт без обвода хуже отсутствия. */

const FLEET_CLASSES={
  post:  {ru:"почтовик",     donor:"Союз",     mark:"рожок", rung:5,  art:1,
          say:["…борт, слышу. Почта на «Узел» идёт, ваш сектор в пути. Конец связи.",
               "…почтовик. Карточек не жду — вы не станция. Держитесь трассы, борт."]},
  tanker:{ru:"танкер",       donor:"Протон",   mark:"капля", rung:16, art:1,
          say:["…танкер ГЛАВТРАССЫ. Норму даём раз в смену, без расписок. Подходите к горловинам.",
               "…танкер. Баки полны? Тогда счастливо. Пустой — подходите."]},
  tug:   {ru:"буксир",       donor:"ядерный буксир", mark:"якорь", rung:19, art:1,
          say:["…буксир. Реактор в носу, к нам ближе ста метров не ходят. Тянем на верфь — если тянуть есть что.",
               "…буксир слышит. Корпус ваш цел, значит, не по нашей части. Конец."]},
  fridge:{ru:"рефрижератор", donor:"Прогресс", mark:"кольцо", rung:27, art:1, say:["…рефрижератор. Груз холодный, разговор короткий."]},
  ore:   {ru:"рудовоз",      donor:"Энергия",  mark:"кайло",  rung:27, art:1, say:["…рудовоз. Четыре пакета на борту, идём тяжело."]},
  lighter:{ru:"лихтеровоз",  donor:"семёрка",  mark:"кольцо", rung:27, art:1, say:["…лихтеровоз. Чужие баржи на крестовине, своей нет."]},
  ferry: {ru:"паром",        donor:"Буран",    mark:"ладонь", rung:21, art:1, say:["…паром. Людей вниз, людей вверх. Груз не берём."]},
  patrol:{ru:"сторожевик",   donor:"Спираль",  mark:"щит",    rung:21, art:1, say:["…сторожевик. Ваш борт в списках чист. Пока."]},
  rescue:{ru:"спасатель",    donor:"Луна-9",   mark:"ладонь", rung:21, art:1, say:["…спасатель. Лепестки закрыты, идём на чужой сигнал."]},
  hosp:  {ru:"госпитальное", donor:"ТКС",      mark:"крест",  rung:21, art:1, say:["…госпитальное. Раненых нет? Тогда не отвлекайте."]},
  school:{ru:"учебное",      donor:"Восток",   mark:"книга",  rung:21, art:1, say:["…учебное. Шесть капсул, шесть голосов, все ваши вопросы уже задавали."]},
  exped: {ru:"экспедиционное",donor:"Салют",   mark:"циркуль",rung:25, art:1, say:["…экспедиционное. Тарелки на вас не смотрим, не тот сектор."]},
  base:  {ru:"плавбаза",     donor:"Мир",      mark:"кольцо", rung:19, art:1, say:["…плавбаза. Пока стоим здесь — мы вам станция."]}
};
const FLEET_NAMES=["ЗАРНИЦА","ОКОЁМ","СТРЕМЯ","ЛАДЬЯ","КРЕМЕНЬ","ПОЛЫНЬ","ЗАСТАВА","КОСОГОР",
  "ТИХОХОД","СЕВЕРЯНКА","ПРОСВЕТ","ОПОКА","ОТМЕЛЬ","ПОДКОВА","ВЕРСТА","ЛУЧИНА"];
/* места (развилка 4): модули узловой станции — свои слова */
const FLEET_PLACES={node:"УЗ-1",mods:["Короб","Кубрик","Воротник","Тамбур","Погреб"]};
const FLEET_PERIOD=600000;               /* один проход через систему — десять минут */
const FLEET_NORM_SHIFTS=1;               /* норма топлива: раз в смену на систему */

function fleetRung(sys){return (typeof rungOf==="function")?rungOf(sys.sx,sys.sy):0;}
/* кто идёт через систему в этом окне: чисто от семени и часов, ничего не хранится */
function fleetHere(sys){
  sys=sys||G.sys;if(!sys)return [];
  const bucket=Math.floor(Date.now()/FLEET_PERIOD);
  if(sys.fleetCache&&sys.fleetCache.b===bucket)return sys.fleetCache.list;
  const rung=fleetRung(sys), out=[];
  /* ── чёрный дерелик (§18.4, M313): в дальних секторах без станции ──
     Без имени, без огней, без ответа. Один на четыре опасные системы, стоит
     где встал; его голос — чёрный корпус. */
  if(!sys.station){
    const dz=(typeof sysDanger==="function")?sysDanger(sys.sx,sys.sy):0;
    const hd=hashi(sys.sx|0,sys.sy|0,0xDE4E);
    if(dz>=.6&&(hd&3)===0){
      const rr=rng(hd);const a=rr()*TAU,rad=1400+rr()*1400;
      out.push({k:"derelict",seed:hd,name:"",num:"",line:0,x0:Math.cos(a)*rad,y0:Math.sin(a)*rad,x1:Math.cos(a)*rad,y1:Math.sin(a)*rad,bow:0,ph:0,still:1});
    }
    sys.fleetCache={b:bucket,list:out};return out;
  }
  /* ── узловая станция трасс «УЗ-1» (§18.4, M313): с рунга 25, напротив станции ── */
  if(rung>=25){
    const st=sys.station,nx=-(st.x||0)*.85,ny=-(st.y||0)*.85;
    out.push({k:"node",seed:hashi(sys.seed,25,0x0E1),name:FLEET_PLACES.node,num:"",line:0,x0:nx,y0:ny,x1:nx,y1:ny,bow:0,ph:0,still:1});
  }
  const r=rng(hashi(sys.sx*31+sys.sy*17,bucket*613+0xF1E7,0x7A55));
  for(const k in FLEET_CLASSES){
    const C=FLEET_CLASSES[k];
    if(!C.art||rung<C.rung)continue;
    if(r()>.55)continue;                 /* не в каждом окне: линия — расписание, не конвейер */
    const seed=hashi(sys.seed,bucket*97+out.length,0xF1E7);
    const rr=rng(seed);
    const a=rr()*TAU, rad=3300;
    out.push({k,seed,name:FLEET_NAMES[Math.floor(rr()*FLEET_NAMES.length)],
      num:"Л-"+(1000+Math.floor(rr()*9000)),line:1+Math.floor(rr()*9),
      x0:Math.cos(a)*rad,y0:Math.sin(a)*rad,x1:-Math.cos(a)*rad*(.9+rr()*.2),y1:-Math.sin(a)*rad*(.9+rr()*.2),
      bow:(rr()-.5)*900,ph:rr()});
  }
  sys.fleetCache={b:bucket,list:out};
  return out;
}
/* положение на линии сейчас: доля окна, дуга с прогибом */
function fleetPos(f){
  if(f.still)return {x:f.x0,y:f.y0,a:0,u:0};
  const u=((Date.now()/FLEET_PERIOD)+f.ph)%1;
  const dx=f.x1-f.x0,dy=f.y1-f.y0,L=Math.hypot(dx,dy)||1;
  const nx=-dy/L,ny=dx/L,bw=Math.sin(u*Math.PI)*f.bow;
  const x=f.x0+dx*u+nx*bw,y=f.y0+dy*u+ny*bw;
  const u2=Math.min(1,u+.003),bw2=Math.sin(u2*Math.PI)*f.bow;
  const a=Math.atan2(dy*.003+ny*(bw2-bw),dx*.003+nx*(bw2-bw));
  return {x,y,a,u};
}

/* ── окраска: один конвейер на все классы (§18.5, §1) ── */
const FLEET_ART={},FLEET_SS=3;
function fleetArtOf(f){
  const key="fl"+f.k+f.seed;
  if(FLEET_ART[key])return FLEET_ART[key];
  const r=rng(hashi(f.seed,0xF1A7,5));
  const polys=[],lines=[],lights=[];
  const add=(pts,c,e)=>polys.push({p:pts,c,e:e||0});
  const rect=(x0,y0,x1,y1,c,e)=>add([[x0,y0],[x1,y0],[x1,y1],[x0,y1]],c,e);
  const ell=(cx,cy,rx,ry,c,e,n)=>{const p=[];n=n||18;for(let i=0;i<n;i++){const t=i/n*TAU;p.push([cx+Math.cos(t)*rx,cy+Math.sin(t)*ry]);}add(p,c,e);};
  /* палитра: санкирь (тёмная подложка) → серо-белый корпус → красная полоса → медь */
  const C=[[222,224,228],[176,180,186],[104,108,116],[168,52,44],[128,84,56],[40,44,52]];
  let L,hw,nose,tail,band=[];
  /* стыки (§8, альманах III): всё навесное встречает корпус нарисованным
     узлом — тёмный хомут и светлая пластина, одна грамматика от панели до
     радиатора. joints: [x, y, длина вдоль корпуса, поперёк] */
  const joints=[];
  const joint=(x,y,l,t)=>joints.push([x,y,l,t]);
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
    lights.push({x:L*.2,y:0,c:"win"});
    band=[[tail*.88,-hw*.48],[-L*.06,-hw*.48],[-L*.06,-hw*.24],[tail*.88,-hw*.24]];
  }else if(f.k==="ore"){
    /* «Энергия»: бочка и четыре контейнера по бокам — пакет, гружёный */
    L=124;hw=12;nose=L*.5;tail=-L*.5;
    rect(tail*.9,-hw*.7,nose*.75,hw*.7,1,1);add([[nose*.75,-hw*.7],[nose*.95,-hw*.25],[nose*.95,hw*.25],[nose*.75,hw*.7]],0,1);
    for(const s of [-1,1])for(let j=0;j<2;j++){const x0=tail*.7+j*L*.36,x1=x0+L*.3,y=s*hw*1.05;
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
    /* красный крест на белом — знак госпиталя во всю высоту */
    rect(-L*.02,-hw*.5,L*.06,hw*.5,3);rect(-L*.1,-hw*.15,L*.14,hw*.15,3);
    ell(tail*.94,0,L*.045,hw*.5,5,1,12);lights.push({x:tail*.97,y:0,c:"eng",r:hw*.4});
    lights.push({x:-L*.3,y:-hw*.3,c:"win"});lights.push({x:-L*.3,y:hw*.3,c:"win"});
    band=[[tail*.88,-hw*.62],[-L*.16,-hw*.62],[-L*.16,-hw*.35],[tail*.88,-hw*.35]];
  }else if(f.k==="school"){
    /* «Восток»×6: гроздь сферических капсул на общей ферме, у каждой свой люк */
    L=112;hw=8;nose=L*.5;tail=-L*.5;
    rect(tail*.9,-hw*.3,nose*.7,hw*.3,2,1);
    for(let i=0;i<6;i++){const x=tail*.7+i*L*.26,s=(i%2?1:-1),cy=s*hw*1.3;
      rect(x-L*.015,0,x+L*.015,cy,5,1);ell(x,cy,L*.075,hw*1.05,0,1,16);
      add([[x+L*.04,cy-hw*.3],[x+L*.075,cy-hw*.25],[x+L*.075,cy+hw*.25],[x+L*.04,cy+hw*.3]],5);joint(x,s*hw*.3,L*.04,hw*.18);}
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
    for(let i=1;i<10;i++){const x=tail*.9+(L*.56)*i/10;lines.push([x,-hw*.62,x,hw*.62,.7]);}
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
    add([[-L*.12,-hw*.5],[nose*.55,-hw*.25],[-L*.05,-hw*3.2],[tail*.85,-hw*3.2]],0,1);                 /* крыло верхнее */
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
    lights.push({x:-L*.07,y:0,c:"win"});lights.push({x:L*.2,y:-hw*.2,c:"win"});
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
  ctx.font=(hw*.5).toFixed(1)+"px ui-monospace,monospace";ctx.fillStyle="rgba(30,30,34,.75)";
  ctx.fillText(f.name,(band[0][0]+band[1][0])/2,band[0][1]-hw*.28);
  }
  /* знак класса: круг, одна залитая фигура (§18.2) */
  if(band.length){const mx=(band[0][0]+band[1][0])/2+L*.18,my=0;
    ctx.strokeStyle="rgba(30,30,34,.85)";ctx.lineWidth=.7;ctx.beginPath();ctx.arc(mx,my,hw*.42,0,TAU);ctx.stroke();
    ctx.fillStyle="rgba(168,52,44,.95)";
    if(f.k==="post"){ctx.beginPath();ctx.moveTo(mx-hw*.22,my+hw*.12);ctx.lineTo(mx+hw*.22,my-hw*.16);ctx.lineTo(mx+hw*.22,my+hw*.16);ctx.closePath();ctx.fill();}
    else if(f.k==="tanker"){ctx.beginPath();ctx.moveTo(mx,my-hw*.26);ctx.quadraticCurveTo(mx+hw*.3,my+hw*.18,mx,my+hw*.24);ctx.quadraticCurveTo(mx-hw*.3,my+hw*.18,mx,my-hw*.26);ctx.fill();}
    else{ctx.fillRect(mx-hw*.05,my-hw*.26,hw*.1,hw*.4);ctx.beginPath();ctx.arc(mx,my+hw*.1,hw*.2,0,Math.PI);ctx.fill();}}
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
  /* один свет на всю сборку последним слоем; кромка ловит свет */
  ctx.globalCompositeOperation="source-atop";
  const lg=ctx.createLinearGradient(0,-hw*3,0,hw*2);
  lg.addColorStop(0,f.k==="derelict"?"rgba(120,130,150,.18)":"rgba(255,240,216,.30)");lg.addColorStop(.45,"rgba(255,224,196,0)");lg.addColorStop(1,"rgba(0,0,0,.5)");
  ctx.fillStyle=lg;ctx.fillRect(-rad,-rad,rad*2,rad*2);
  ctx.globalCompositeOperation="source-over";
  ctx=prev;
  const art={cn,rad,L,hw,lights};
  FLEET_ART[key]=art;return art;
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
      const fg=ctx.createRadialGradient(li.x,li.y,0,li.x,li.y,li.r*1.3);
      fg.addColorStop(0,"rgba(255,214,158,.85)");fg.addColorStop(.5,"rgba(255,150,80,.35)");fg.addColorStop(1,"rgba(255,120,60,0)");
      ctx.fillStyle=fg;ctx.beginPath();ctx.arc(li.x,li.y,li.r*1.3,0,TAU);ctx.fill();
    }
  }
}
function drawFleet(zx,zy,Z){
  const F=fleetHere(G.sys);if(!F.length)return;
  for(const f of F){
    const p=fleetPos(f),x=zx(p.x),y=zy(p.y);
    if(x<-120||x>W+120||y<-120||y>H+120)continue;
    ctx.save();ctx.translate(x,y);ctx.rotate(p.a);
    const s=clamp(Z,.5,1.5)*.85;ctx.scale(s,s);
    drawFleetShip(f);
    ctx.restore();
    const C=FLEET_CLASSES[f.k];
    ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
    if(f.k==="node"){ctx.fillStyle="rgba(226,214,200,.8)";ctx.fillText("«"+f.name+"» · УЗЕЛ ТРАСС · ГЛАВТРАССА",x,y+46);}
    else if(f.k!=="derelict"){
      ctx.fillStyle="rgba(226,214,200,.8)";ctx.fillText("«"+f.name+"» · ГЛАВТРАССА · "+f.num+" · ТРАССА "+f.line,x,y+30);
      ctx.fillStyle="rgba(226,214,200,.5)";ctx.fillText(C.ru.toUpperCase(),x,y+40);
    }
    ctx.textAlign="left";
  }
}
/* ── позывной и заправка по норме (§18.7 п.1, п.3) ── */
function fleetLogKey(){return G.sx+","+G.sy;}
function fleetInteract(sh){
  const F=fleetHere(G.sys);if(!F.length)return false;
  let near=null,nd=1e9,np=null;
  for(const f of F){const p=fleetPos(f),d=Math.hypot(sh.x-p.x,sh.y-p.y);if(d<nd){nd=d;near=f;np=p;}}
  if(!near||nd>260)return false;
  if(near.k==="derelict"){
    G.prompt="ЧЁРНЫЙ КОРПУС · БЕЗ ИМЕНИ\nДЕЙСТВИЕ — ПОЗЫВНОЙ";
    if(actEdge){
      etherLine("…тишина. Ни позывного, ни огня. Только корпус, и он чёрный.","эфир");
      G.fleetLog=G.fleetLog||{};
      if(!G.fleetLog["derelict|"+fleetLogKey()]){G.fleetLog["derelict|"+fleetLogKey()]=1;
        if(typeof recordAdd==="function")recordAdd("эфир","чёрный корпус в секторе "+G.sx+":"+G.sy+" · не ответил");}
    }
    return true;
  }
  if(near.k==="node"){
    G.prompt="УЗЛОВАЯ «"+near.name+"» · УЗЕЛ ТРАСС\nДЕЙСТВИЕ — ПОЗЫВНОЙ";
    if(actEdge)etherLine("«"+near.name+"»: …узел трасс. Стоянка есть, торга нет: Короб полон, Кубрик спит, Воротник открыт. Держитесь линии.","узловая");
    return true;
  }
  const C=FLEET_CLASSES[near.k];
  /* караван (§18.7 п.6): идти рядом — пираты не подходят, ход медленнее */
  const canCaravan=!(G.caravan&&G.caravan.until>G.t);
  const st=stat(), low=G.fuel<st.fuelMax*.6;
  const shift=Math.floor(Date.now()/((typeof HOLD_SHIFT==="number")?HOLD_SHIFT:1800000));
  G.fleetLog=G.fleetLog||{};
  const gave=(G.fleetLog[fleetLogKey()]||0)>=shift-(FLEET_NORM_SHIFTS-1);
  const canFuel=near.k==="tanker"&&low&&!gave;
  /* буксир: корпус, который не дотянет, тянут на верфь — подлатан до 40 %, чтобы дошёл (§18.7 п.4) */
  const hurt=G.hull<st.hullMax*.3;
  const tugKey=fleetLogKey()+"|tug", baseKey=fleetLogKey()+"|base";
  const canTow=near.k==="tug"&&hurt&&(G.fleetLog[tugKey]||0)<shift;
  /* плавбаза: пока стоит здесь — она вам станция: ремонт по норме раз в смену (п.7) */
  const canFix=near.k==="base"&&G.hull<st.hullMax*.9&&(G.fleetLog[baseKey]||0)<shift;
  /* сторожевик: с доброй репутацией проводит, с худой досматривает (п.10) */
  const rep=(typeof repAt==="function")?repAt():0;
  const canEscort=near.k==="patrol"&&rep>=2&&!(G.fleetEscort>G.t);
  /* почтовик: карточки в руки — он привозит ваши (п.5); только в сети */
  const canMail=near.k==="post"&&typeof mailOn==="function"&&mailOn()&&typeof mailDock==="function";
  /* госпитальное: выкуп заложника вдвое дешевле (п.8) */
  const hostage=(G.crew||[]).find(c=>c.state==="hostage"&&c.ransom>0);
  const canRansom=near.k==="hosp"&&!!hostage;
  /* учебное: берёт свободного наёмника на рейс и возвращает грамотнее (п.9), раз в смену */
  const pupil=(G.crew||[]).find(c=>!c.state&&(!c.order||c.order.kind==="home"));
  const schoolKey=fleetLogKey()+"|school";
  const canSchool=near.k==="school"&&!!pupil&&(G.fleetLog[schoolKey]||0)<shift;
  const verb=canFuel?"ЗАПРАВКА ПО НОРМЕ":canTow?"БУКСИР НА ВЕРФЬ":canFix?"РЕМОНТ ПО НОРМЕ":canEscort?"ПРОСИТЬ КОНВОЙ":
    canMail?"СДАТЬ ПОЧТУ":canRansom?"ВЫКУП ЧЕРЕЗ ГОСПИТАЛЬ · "+Math.round(hostage.ransom*.5).toLocaleString("ru")+" КР":canSchool?"ОТДАТЬ В УЧЁБУ · "+pupil.name.toUpperCase():canCaravan?"ИДТИ КАРАВАНОМ":"ПОЗЫВНОЙ";
  G.prompt=C.ru.toUpperCase()+" ГЛАВТРАССЫ «"+near.name+"»"+
    "\nДЕЙСТВИЕ — "+verb;
  if(actEdge){
    if(!canFuel&&!canTow&&!canFix&&!canEscort&&!canMail&&!canRansom&&!canSchool&&canCaravan){
      G.caravan={until:G.t+1200,name:near.name};
      etherLine("«"+near.name+"»: …идите рядом, борт. Ход наш, пираты к каравану не суются. Отстанете — сами по себе.",C.ru);
    }else if(canMail){
      mailDock();
      etherLine("«"+near.name+"»: …почтовик. Стопку приняли, ваши — на борту, смотрите стол.","почтовик");
    }else if(canRansom){
      hostage.ransom=Math.round(hostage.ransom*.5);
      if(typeof ransomPay==="function"&&ransomPay(hostage))
        etherLine("«"+near.name+"»: …госпитальное. Человека забрали с той стороны, по нашей таксе. Живой.","госпитальное");
      else hostage.ransom*=2;
    }else if(canSchool){
      pupil.xp=(pupil.xp||0)+35;G.fleetLog[schoolKey]=shift;
      if(typeof crewHistory==="function")crewHistory(pupil,{cat:"good",id:"school"},"учился на «"+near.name+"»");
      etherLine("«"+near.name+"»: …учебное. "+pupil.name+" на борту, рейс — и вернём грамотнее.","учебное");
      if(typeof recordAdd==="function")recordAdd("ГЛАВТРАССА","учёба · "+pupil.name+" · «"+near.name+"»");
    }else if(canTow){
      G.hull=Math.max(G.hull,Math.round(st.hullMax*.4));G.fleetLog[tugKey]=shift;
      etherLine("«"+near.name+"»: …взяли на буксир. До верфи дотянете сами, дальше — их работа.","буксир");
      if(typeof recordAdd==="function")recordAdd("ГЛАВТРАССА","буксир «"+near.name+"» · "+near.num);
    }else if(canFix){
      G.hull=st.hullMax;G.fleetLog[baseKey]=shift;
      etherLine("«"+near.name+"»: …плавбаза. Пока стоим здесь — мы вам станция. Корпус закрыли.","плавбаза");
      if(typeof recordAdd==="function")recordAdd("ГЛАВТРАССА","ремонт на плавбазе «"+near.name+"»");
    }else if(canEscort){
      G.fleetEscort=G.t+900;
      etherLine("«"+near.name+"»: …сторожевик. Ваш борт в списках чист — идём рядом. Пятнадцать минут по трассе.","сторожевик");
    }else if(near.k==="patrol"&&rep<=-2){
      etherLine("«"+near.name+"»: …сторожевик. Ваш борт в списках. Досмотр: трюм открыть. Чисто. На этот раз.","сторожевик");
    }else if(canFuel){
      G.fuel=st.fuelMax;G.fleetLog[fleetLogKey()]=shift;
      etherLine("«"+near.name+"»: …по норме, до полного. Расписок не пишем — трасса помнит сама.","танкер");
      if(typeof recordAdd==="function")recordAdd("ГЛАВТРАССА","заправка по норме · «"+near.name+"» · "+near.num);
      if(typeof sfx==="function")sfx("ui",{f:520,to:880,d:.3,v:.12});
    }else{
      const r=rng(hashi(near.seed,G.t|0,0xCA11));
      let line=C.say[Math.floor(r()*C.say.length)];
      if(near.k==="tanker"&&!low)line=C.say[1];
      if(near.k==="tanker"&&low&&gave)line="…танкер. Норму в этом секторе вы уже брали. Следующая — со сменой.";
      etherLine("«"+near.name+"»: "+line,C.ru);
    }
  }
  return true;
}

/* конвой сторожевика: пока действует, пираты вас не видят (§18.7 п.6/п.10) */
function fleetEscortActive(){return G.mode==="system"&&((G.fleetEscort||0)>G.t||fleetCaravanActive());}
/* караван действует, пока срок не вышел и рядом (до 520) идёт корабль флота */
function fleetCaravanActive(){
  if(G.mode!=="system"||!G.caravan||G.caravan.until<=G.t)return false;
  const sh=G.ship;let ok=false;
  for(const f of fleetHere(G.sys)){if(f.still)continue;const p=fleetPos(f);if(Math.hypot(sh.x-p.x,sh.y-p.y)<520){ok=true;break;}}
  if(!ok)G.caravan=null;
  return ok;
}
