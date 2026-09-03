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
  fridge:{ru:"рефрижератор", donor:"Прогресс", mark:"кольцо", rung:27, art:0, say:["…рефрижератор. Груз холодный, разговор короткий."]},
  ore:   {ru:"рудовоз",      donor:"Энергия",  mark:"кайло",  rung:27, art:0, say:["…рудовоз. Четыре пакета на борту, идём тяжело."]},
  lighter:{ru:"лихтеровоз",  donor:"семёрка",  mark:"кольцо", rung:27, art:0, say:["…лихтеровоз. Чужие баржи на крестовине, своей нет."]},
  ferry: {ru:"паром",        donor:"Буран",    mark:"ладонь", rung:21, art:0, say:["…паром. Людей вниз, людей вверх. Груз не берём."]},
  patrol:{ru:"сторожевик",   donor:"Спираль",  mark:"щит",    rung:21, art:0, say:["…сторожевик. Ваш борт в списках чист. Пока."]},
  rescue:{ru:"спасатель",    donor:"Луна-9",   mark:"ладонь", rung:21, art:0, say:["…спасатель. Лепестки закрыты, идём на чужой сигнал."]},
  hosp:  {ru:"госпитальное", donor:"ТКС",      mark:"крест",  rung:21, art:0, say:["…госпитальное. Раненых нет? Тогда не отвлекайте."]},
  school:{ru:"учебное",      donor:"Восток",   mark:"книга",  rung:21, art:0, say:["…учебное. Шесть капсул, шесть голосов, все ваши вопросы уже задавали."]},
  exped: {ru:"экспедиционное",donor:"Салют",   mark:"циркуль",rung:25, art:0, say:["…экспедиционное. Тарелки на вас не смотрим, не тот сектор."]},
  base:  {ru:"плавбаза",     donor:"Мир",      mark:"кольцо", rung:19, art:0, say:["…плавбаза. Пока стоим здесь — мы вам станция."]}
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
  sys=sys||G.sys;if(!sys||!sys.station)return [];
  const bucket=Math.floor(Date.now()/FLEET_PERIOD);
  if(sys.fleetCache&&sys.fleetCache.b===bucket)return sys.fleetCache.list;
  const rung=fleetRung(sys), out=[];
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
  const C=[[196,198,202],[150,154,160],[92,96,104],[168,52,44],[128,84,56],[40,44,52]];
  let L,hw,nose,tail,band=[];
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
    }
    rect(tail*.82,-hw*.42,tail*.62,hw*.42,2,1);     /* кольцо горловин */
    for(let i=0;i<5;i++){const y=-hw*.36+i*hw*.18;rect(tail*.9,y-1,tail*.82,y+1,4);}
    for(let i=1;i<6;i++){const x=tail*.85+(nose*.7-tail*.85)*i/6;lines.push([x,-hw,x,hw,.45]);}
    for(let i=0;i<2;i++){const y=(i-.5)*hw*.9;ell(tail*.95,y,L*.04,hw*.32,5,1,12);lights.push({x:tail*.98,y,c:"eng",r:hw*.3});}
    band=[[tail*.85,-hw*.55],[nose*.65,-hw*.55],[nose*.65,-hw*.25],[tail*.85,-hw*.25]];
  }else{
    /* ядерный буксир: хребет, реактор на штанге впереди, два плоских радиатора-крыла, колокол сзади */
    L=136;hw=7;nose=L*.5;tail=-L*.5;
    rect(-L*.3,-hw*.35,nose*.55,hw*.35,2,1);          /* штанга */
    rect(nose*.55,-hw*.9,nose*.92,hw*.9,5,1);          /* реактор */
    rect(nose*.92,-hw*.5,nose,hw*.5,4);
    rect(-L*.36,-hw*1.1,-L*.05,hw*1.1,1,1);            /* обитаемый блок */
    for(const s of [-1,1]){
      add([[-L*.28,s*hw*1.1],[nose*.45,s*hw*1.1],[nose*.3,s*hw*4.2],[-L*.15,s*hw*4.2]],5,1);
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
  for(const q of polys){poly(q);const c=C[q.c];ctx.fillStyle="rgb("+c.join(",")+")";ctx.fill();
    ctx.strokeStyle="rgba(0,0,0,"+(q.e?.5:.25)+")";ctx.lineWidth=q.e?.6:.35;ctx.stroke();}
  for(const l of lines){ctx.strokeStyle="rgba(0,0,0,"+(l[4]*.7).toFixed(2)+")";ctx.lineWidth=l[4];ctx.beginPath();ctx.moveTo(l[0],l[1]);ctx.lineTo(l[2],l[3]);ctx.stroke();}
  /* лессировка: красная полоса во всю длину, номер, имя, знак класса */
  if(band.length){ctx.fillStyle="rgb("+C[3].join(",")+")";ctx.beginPath();ctx.moveTo(band[0][0],band[0][1]);for(let i=1;i<4;i++)ctx.lineTo(band[i][0],band[i][1]);ctx.closePath();ctx.fill();}
  ctx.fillStyle="rgba(30,30,34,.9)";ctx.font="bold "+(hw*.9).toFixed(1)+"px ui-monospace,monospace";ctx.textAlign="center";ctx.textBaseline="middle";
  ctx.fillText(f.num.slice(2),(band[0][0]+band[1][0])/2,(band[1][1]+band[2][1])/2+hw*.62);
  ctx.font=(hw*.5).toFixed(1)+"px ui-monospace,monospace";ctx.fillStyle="rgba(30,30,34,.75)";
  ctx.fillText(f.name,(band[0][0]+band[1][0])/2,band[0][1]-hw*.28);
  /* знак класса: круг, одна залитая фигура (§18.2) */
  {const mx=(band[0][0]+band[1][0])/2+L*.18,my=0;
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
  ctx.fillStyle="rgba(255,190,170,.28)";ctx.beginPath();ctx.moveTo(band[0][0],band[0][1]);ctx.lineTo(band[1][0],band[1][1]);ctx.lineTo(band[1][0],band[1][1]+hw*.1);ctx.lineTo(band[0][0],band[0][1]+hw*.1);ctx.fill();
  /* один свет на всю сборку последним слоем; кромка ловит свет */
  ctx.globalCompositeOperation="source-atop";
  const lg=ctx.createLinearGradient(0,-hw*3,0,hw*2);
  lg.addColorStop(0,"rgba(255,240,216,.30)");lg.addColorStop(.45,"rgba(255,224,196,0)");lg.addColorStop(1,"rgba(0,0,0,.5)");
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
    ctx.fillStyle="rgba(226,214,200,.8)";ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
    ctx.fillText("«"+f.name+"» · ГЛАВТРАССА · "+f.num+" · ТРАССА "+f.line,x,y+30);
    ctx.fillStyle="rgba(226,214,200,.5)";ctx.fillText(C.ru.toUpperCase(),x,y+40);
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
  const C=FLEET_CLASSES[near.k];
  const st=stat(), low=G.fuel<st.fuelMax*.6;
  const shift=Math.floor(Date.now()/((typeof HOLD_SHIFT==="number")?HOLD_SHIFT:1800000));
  G.fleetLog=G.fleetLog||{};
  const gave=(G.fleetLog[fleetLogKey()]||0)>=shift-(FLEET_NORM_SHIFTS-1);
  const canFuel=near.k==="tanker"&&low&&!gave;
  G.prompt=C.ru.toUpperCase()+" ГЛАВТРАССЫ «"+near.name+"»"+
    "\nДЕЙСТВИЕ — "+(canFuel?"ЗАПРАВКА ПО НОРМЕ":"ПОЗЫВНОЙ");
  if(actEdge){
    if(canFuel){
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
