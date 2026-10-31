/* ══════════════ посадочный корабль ══════════════
   Отрезано от 19-mode-landing на распиле 0.108.x: посадка, грунт и небо остались
   там; силуэт, шасси и пыль посадки — здесь. */
/* ── посадочный корабль ──
   Полётный вид — сверху, посадочный — сбоку; поворотом одного в другой не
   переводится в принципе, поэтому у посадки свой силуэт, а не сжатый и
   повёрнутый корпус из 03-ships. Мерило прежнее — человек: астронавт 24 px,
   корабль 3.5–5 его ростов. Ливрея, цвет и приметы класса берутся у того же
   корпуса, на котором летаешь, — узнаётся именно ваш корабль. */
const LAND_GY=11;                       // точка касания в местных координатах
function landerLen(id){return clamp(hullOf(id).len*2.2,90,130);}
/* радиус зоны «у корабля»: считаем от корпуса, а не числом 48 — иначе
   подсказки срабатывают из-под днища */
function shipZoneR(id){return landerLen(id||G.shipId)*.75;}
function landerGearTick(L,dt){
  const alt=groundAt(L.tr,L.x)-L.y-LAND_GY;
  const want=(L.over>0||alt<210)?1:0;
  L.gear=clamp((L.gear||0)+(want?.028:-.02)*dt,0,1);
  /* амортизатор — пружина с затуханием: проседает от удара и отдаёт */
  L.sqv=(L.sqv||0)+(-(L.sq||0)*.06-(L.sqv||0)*.12)*dt;
  L.sq=clamp((L.sq||0)+L.sqv*dt,-.25,1);
  if(L.hot)L.hot=Math.max(0,L.hot-.0016*dt);
}
/* профиль стойки: бедро → шток → пята, каждая садится на грунт СВОЕЙ
   координаты (та же ошибка и то же лекарство, что у друз в M79) */
function drawLandGear(h,len,hipY,lx,dgy,gear,sq){
  const foot=LAND_GY+dgy-sq*3.4;
  const knee=[lerp(lx*.55,lx*.92,gear),lerp(hipY+len*.05,(hipY+foot)*.5,gear)];
  const fx=lerp(lx*.42,lx,gear), fy=lerp(hipY+len*.08,foot,gear);
  ctx.lineCap="round";
  ctx.strokeStyle=rgba(h.dark,1);ctx.lineWidth=5.4;
  ctx.beginPath();ctx.moveTo(lx*.62,hipY);ctx.lineTo(knee[0],knee[1]);ctx.stroke();
  /* цилиндр толще штока, шток светлее: видно, что он в него уходит */
  ctx.strokeStyle=rgba(h.body,1);ctx.lineWidth=6.4;
  ctx.beginPath();ctx.moveTo(knee[0],knee[1]);
  ctx.lineTo(lerp(knee[0],fx,.45),lerp(knee[1],fy-3,.45));ctx.stroke();
  ctx.strokeStyle=rgba(h.lite,.95);ctx.lineWidth=3.2;
  ctx.beginPath();ctx.moveTo(lerp(knee[0],fx,.35),lerp(knee[1],fy-3,.35));
  ctx.lineTo(fx,fy-3);ctx.stroke();
  /* подкос от корпуса к колену — без него стойка читается проволокой */
  ctx.strokeStyle=rgba(h.dark,.95);ctx.lineWidth=2.6;
  ctx.beginPath();ctx.moveTo(lx*.18,hipY-1);ctx.lineTo(knee[0],knee[1]);ctx.stroke();
  ctx.lineCap="butt";
  if(gear<.5)return;
  /* пята с блином, вдавленным в грунт, и пыльный ободок вокруг */
  ctx.fillStyle=rgba(h.dark,1);
  ctx.beginPath();ctx.ellipse(fx,fy-1.5,6.5,2.6,0,0,TAU);ctx.fill();
  ctx.fillStyle=rgba(h.body,1);ctx.fillRect(fx-2,fy-5,4,3.4);
  /* тень пяты — поле под кораблём (19g); 2D-пятно под живым кадром снято (G15) */
}
/* тело посадочного корабля — только выпечка для видеокарты (19g): без маяка,
   дыма и света на грунте; живое и свет кладёт поле, факелы — тоже. Живой дым
   побитого — фигурами в кадре посадки (19). Live-2D ветки сняты (G15). */
function drawLander(broken,opt){
  opt=opt||{};
  const h=hullOf(G.shipId), len=landerLen(G.shipId), M=h.mark||{};
  const gear=opt.gear==null?1:opt.gear, sq=opt.sq||0;
  const bodyH=len*.30, half=len*.5;
  /* брюхо держится на высоте пояса астронавта: с просветом в 10 px корабль
     ложился на грунт и читался автобусом, а стойки исчезали вовсе */
  const bY=LAND_GY-19+sq*4, tY=bY-bodyH;
  const gy=x=>opt.tr?clamp(groundAt(opt.tr,(opt.gx||0)+x)-groundAt(opt.tr,opt.gx||0),-9,9):0;
  ctx.save();
  /* нос чуть задран, а на касании опускается вместе с просадкой стоек: без
     этого посадка оставалась подменой картинки, как и было обещано в M81 */
  ctx.rotate(-.05+sq*.12);
  /* тело — выпечка под свет мира (19g); живой дым побитого — в кадре посадки */
  /* ── стойки: три точки, разнос 0.84 длины; средняя — дальнего борта ── */
  const legs=[[-half*.42,1],[-half*.10,.62],[half*.42,1]];
  for(const lg of legs){
    ctx.globalAlpha=lg[1];
    drawLandGear(h,len,bY-bodyH*.12,lg[0],gy(lg[0]),gear,sq);
  }
  ctx.globalAlpha=1;
  /* ── корпус по схеме планера ──
     Силуэт был один на всех: лежачее веретено с кабиной, менялись только
     ливрея и длина. В полёте же корабль — дельта, крест, катамаран, плита,
     диск, трезубец (03a), и на площадке садится именно он. Схема берётся у
     того же корпуса (`h.form`), общее остаётся общим: стойки, трап, сопла. */
  const box=!!M.cont;                   // рудовоз и здесь ящик, курьер — конус
  const form=h.form||"swept";
  const flat=form==="slab"||form==="boxed", disc=form==="disc", twin=form==="twin";
  const cY=(tY+bY)*.5;
  /* полигон тела: веретено, плита или диск; катамаран — два веретена */
  const hullPath=(dx,dy,k)=>{
    const hf=half*k, bh=bodyH*k, b=bY+dy, t=b-bh;
    ctx.beginPath();
    if(disc){ctx.ellipse(dx,cY+dy,hf*1.04,bh*.52,0,0,TAU);ctx.closePath();return;}
    let P;
    if(flat)P=[[hf+dx,t+bh*.18],[hf+dx,b-bh*.12],[hf*.94+dx,b],[-hf*.96+dx,b],
      [-hf+dx,b-bh*.14],[-hf+dx,t+bh*.08],[-hf*.9+dx,t],[hf*.84+dx,t]];
    else P=[[hf+dx,b-bh*.62],[hf+dx,b-bh*.30],[hf*.80+dx,b],[-hf*.74+dx,b],
      [-hf*.94+dx,b-bh*.22],[-hf*.94+dx,t+bh*(box?.06:.30)],
      [-hf*.30+dx,t],[hf*.30+dx,t],[hf*.86+dx,t+bh*.28]];
    ctx.moveTo(P[0][0],P[0][1]);
    for(let i=1;i<P.length;i++)ctx.lineTo(P[i][0],P[i][1]);
    ctx.closePath();
  };
  const bodyFill=(t,b,a)=>{
    const g=ctx.createLinearGradient(0,t,0,b);
    g.addColorStop(0,rgba(h.lite,.95*a));g.addColorStop(.45,rgba(h.col,a));
    g.addColorStop(1,rgba(h.dark,a));
    return g;
  };
  /* дальний корпус катамарана: выше, чуть назад и темнее — он за ближним */
  if(twin){
    hullPath(-len*.05,-bodyH*.62,.9);
    ctx.fillStyle=bodyFill(tY-bodyH*.62,bY-bodyH*.62,1);ctx.fill();
    ctx.fillStyle="rgba(0,0,0,.34)";ctx.fill();
    ctx.strokeStyle=rgba(h.edge,.9);ctx.lineWidth=1.2;ctx.stroke();
    /* мостик между корпусами */
    ctx.fillStyle=rgba(h.body,1);ctx.strokeStyle=rgba(h.edge,1);ctx.lineWidth=1;
    ctx.beginPath();ctx.rect(-half*.45,tY-bodyH*.5,half*.7,bodyH*.5);ctx.fill();ctx.stroke();
  }
  /* крыло дельты: видно снизу, как тёмный клин от миделя к корме — от
     взгляда сбоку крыло толщиной в линию, и схема терялась */
  if(form==="delta"){
    ctx.fillStyle=rgba(h.dark,1);ctx.strokeStyle=rgba(h.edge,1);ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(half*.3,bY-bodyH*.3);ctx.lineTo(-half*.95,bY-bodyH*.3);
    ctx.lineTo(-half*1.12,bY+bodyH*.28);ctx.lineTo(-half*.2,bY+bodyH*.12);ctx.closePath();
    ctx.fill();ctx.stroke();
    ctx.fillStyle="rgba(255,120,90,.9)";
    ctx.beginPath();ctx.arc(-half*1.08,bY+bodyH*.24,1.6,0,TAU);ctx.fill();
  }
  /* нижняя гондола креста — под брюхом, до корпуса */
  if(form==="xwing"){
    ctx.fillStyle=rgba(h.body,1);ctx.strokeStyle=rgba(h.edge,1);ctx.lineWidth=1;
    ctx.beginPath();ctx.ellipse(-half*.12,bY+bodyH*.1,half*.36,bodyH*.2,0,0,TAU);ctx.fill();ctx.stroke();
  }
  hullPath(0,0,1);
  ctx.fillStyle=bodyFill(tY,bY,1);ctx.fill();
  ctx.strokeStyle=rgba(h.edge,1);ctx.lineWidth=1.4;ctx.stroke();
  ctx.save();ctx.clip();
  /* линий панелей немного и они слабые: частая гребёнка делала из корпуса
     гофрированную трубу, то есть дирижабль */
  ctx.strokeStyle="rgba(0,0,0,.14)";ctx.lineWidth=1;
  for(let x=-half*.6;x<half*.7;x+=len*.22){
    ctx.beginPath();ctx.moveTo(x,tY);ctx.lineTo(x+len*(flat?0:.03),bY);ctx.stroke();
  }
  ctx.fillStyle=rgba(h.lite,.30);
  ctx.fillRect(-half,tY+bodyH*h.stripe.a,len,bodyH*.13);
  /* нижняя палуба отдельной плитой со швом и заклёпками: без неё ровный
     градиент по всей высоте читается надувной трубой, а не машиной */
  ctx.fillStyle="rgba(0,0,0,.30)";
  ctx.fillRect(-half,bY-bodyH*.30,len,bodyH*.30);
  ctx.strokeStyle=rgba(h.lite,.35);ctx.lineWidth=1.2;
  ctx.beginPath();ctx.moveTo(-half,bY-bodyH*.30);ctx.lineTo(half,bY-bodyH*.30);ctx.stroke();
  ctx.fillStyle="rgba(255,255,255,.14)";
  for(let x=-half*.8;x<half*.8;x+=len*.055){
    ctx.beginPath();ctx.arc(x,bY-bodyH*.36,.9,0,TAU);ctx.fill();
  }
  /* плита: рёбра шпангоутов поперёк — иначе прямоугольник читается вагоном */
  if(flat){
    ctx.strokeStyle="rgba(0,0,0,.22)";ctx.lineWidth=1.6;
    for(let x=-half*.85;x<half*.8;x+=len*.11){ctx.beginPath();ctx.moveTo(x,tY);ctx.lineTo(x,bY);ctx.stroke();}
  }
  /* диск: кольцевые швы, светлый верх и тёмный низ тарелки */
  if(disc){
    ctx.strokeStyle="rgba(0,0,0,.18)";ctx.lineWidth=1;
    for(let k=.82;k>.3;k-=.26){ctx.beginPath();ctx.ellipse(0,cY,half*1.04*k,bodyH*.52*k,0,0,TAU);ctx.stroke();}
    ctx.fillStyle="rgba(0,0,0,.22)";ctx.fillRect(-half*1.1,cY+bodyH*.08,len*1.2,bodyH);
  }
  ctx.restore();
  /* боковая гондола креста — поверх корпуса, на своём свету */
  if(form==="xwing"){
    for(const [px,py,k] of [[-half*.12,tY-bodyH*.18,1],[-half*.12,cY,.9]]){
      ctx.fillStyle=bodyFill(py-bodyH*.22,py+bodyH*.22,1);ctx.strokeStyle=rgba(h.edge,1);ctx.lineWidth=1;
      ctx.beginPath();ctx.ellipse(px,py,half*.38*k,bodyH*.22*k,0,0,TAU);ctx.fill();ctx.stroke();
      ctx.fillStyle=rgba(h.dark,.9);
      ctx.beginPath();ctx.ellipse(px-half*.3*k,py,bodyH*.1,bodyH*.16*k,0,0,TAU);ctx.fill();
    }
  }
  /* трезубец: нос расходится на три зуба, сбоку видны верхний и нижний */
  if(form==="trident"){
    ctx.fillStyle=rgba(h.body,1);ctx.strokeStyle=rgba(h.edge,1);ctx.lineWidth=1;
    for(const dy of [-bodyH*.46,bodyH*.04]){
      ctx.beginPath();ctx.moveTo(half*.5,cY+dy-bodyH*.14);ctx.lineTo(half*1.16,cY+dy-bodyH*.06);
      ctx.lineTo(half*1.16,cY+dy+bodyH*.06);ctx.lineTo(half*.5,cY+dy+bodyH*.16);ctx.closePath();
      ctx.fill();ctx.stroke();
    }
  }
  /* ящики: у контейнеровоза — стопка вдоль хребта, у плиты — два ряда */
  if(box||form==="boxed"||form==="slab"){
    const rows=form==="boxed"?2:1;
    for(let rw=0;rw<rows;rw++)for(let i=0;i<3;i++){
      ctx.fillStyle=rgba(h.dark,.9);ctx.strokeStyle=rgba(h.col,.6);ctx.lineWidth=.9;
      ctx.beginPath();ctx.rect(-half*.6+i*len*.2,tY-bodyH*.16-rw*bodyH*.22,len*.16,bodyH*.2);
      ctx.fill();ctx.stroke();
    }
  }
  /* кабина: у диска — купол сверху, у плиты — рубка-ящик на носу, у
     остальных — остекление впереди; изнутри свет */
  ctx.fillStyle="rgba(150,225,255,.55)";
  ctx.beginPath();
  if(disc){ctx.ellipse(half*.08,cY-bodyH*.46,half*.3,bodyH*.34,0,Math.PI,TAU);ctx.closePath();}
  else if(flat){ctx.rect(half*.46,tY-bodyH*.28,half*.38,bodyH*.4);}
  else{
    ctx.moveTo(half*.72,tY+bodyH*.16);ctx.lineTo(half*.34,tY+bodyH*.08);
    ctx.lineTo(half*.34,tY+bodyH*.36);ctx.lineTo(half*.68,tY+bodyH*.40);
    ctx.closePath();
  }
  ctx.fill();
  ctx.strokeStyle=rgba(h.dark,1);ctx.lineWidth=1.1;ctx.stroke();
  if(M.drill){                          // бур в носу — как в полёте
    ctx.fillStyle=rgba(h.lite,.85);
    ctx.beginPath();ctx.moveTo(half+len*.06,bY-bodyH*.34);
    ctx.lineTo(half,bY-bodyH*.48);ctx.lineTo(half,bY-bodyH*.20);ctx.closePath();ctx.fill();
  }
  /* киль на корме: без него силуэт с круглым хвостом читается дирижаблем.
     У диска киля нет, у плиты — короткий, у дельты — высокий */
  if(!disc){
    const fk=form==="delta"?1.5:(flat?.55:1);
    ctx.fillStyle=rgba(h.body,1);
    ctx.beginPath();
    ctx.moveTo(-half*.62,tY+bodyH*.1);ctx.lineTo(-half*.86,tY-bodyH*.55*fk);
    ctx.lineTo(-half*.98,tY-bodyH*.5*fk);ctx.lineTo(-half*.9,tY+bodyH*.12);
    ctx.closePath();ctx.fill();
    ctx.strokeStyle=rgba(h.edge,1);ctx.lineWidth=1;ctx.stroke();
  }
  /* антенна и радиатор — развёрнуты и стоят на корпусе, а не висят рядом */
  ctx.strokeStyle=rgba(h.lite,.8);ctx.lineWidth=1.4;
  const aX=disc?-half*.4:-half*.1, aY=disc?cY-bodyH*.4:tY;
  ctx.beginPath();ctx.moveTo(aX,aY);ctx.lineTo(aX,aY-len*.10);ctx.stroke();
  ctx.beginPath();ctx.arc(aX,aY-len*.10,2.8,Math.PI*1.15,TAU*.99);ctx.stroke();
  if(!disc){
    ctx.fillStyle=rgba(h.dark,.9);ctx.strokeStyle=rgba(h.lite,.5);ctx.lineWidth=.8;
    ctx.beginPath();ctx.rect(half*.02,tY-len*.035,len*.22,len*.032);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(half*.10,tY-len*.003);ctx.lineTo(half*.10,tY);
    ctx.moveTo(half*.20,tY-len*.003);ctx.lineTo(half*.20,tY);ctx.stroke();
  }
  /* ── трап: по нему и читается масштаб быстрее всего ── */
  if(gear>.9&&opt.landed){
    const hx=-half*.06, hw=len*.17, hb=bY-bodyH*.30, ht=tY+bodyH*.18;
    /* проём непрозрачный: сквозь полупрозрачный светились стойки, и люк
       читался наклейкой, а не дырой в борту */
    ctx.fillStyle="#1a1712";
    ctx.fillRect(hx-hw*.5,ht,hw,hb-ht);
    const lg=ctx.createLinearGradient(0,ht,0,hb);
    lg.addColorStop(0,"rgba(255,214,150,.85)");lg.addColorStop(1,"rgba(255,170,90,.25)");
    ctx.fillStyle=lg;ctx.fillRect(hx-hw*.5+1.5,ht+1.5,hw-3,hb-ht-3);
    ctx.strokeStyle=rgba(h.lite,.95);ctx.lineWidth=1.4;
    ctx.strokeRect(hx-hw*.5,ht,hw,hb-ht);
    /* трап: по шагу его ступеней масштаб читается быстрее всего. Сходит
       вперёд-вправо — туда, где игрок и оказывается после посадки, и там его
       не перекрывает средняя стойка */
    const rx=hx+len*.46, ry=LAND_GY+gy(rx);
    ctx.strokeStyle=rgba(h.dark,1);ctx.lineWidth=4.4;
    ctx.beginPath();ctx.moveTo(hx+hw*.5,hb);ctx.lineTo(rx,ry);ctx.stroke();
    ctx.strokeStyle=rgba(h.lite,.85);ctx.lineWidth=1.4;
    const stepN=Math.max(2,Math.round(Math.hypot(rx-hx-hw*.5,ry-hb)/10));
    for(let i=1;i<stepN;i++){
      const t=i/stepN, sx=lerp(hx+hw*.5,rx,t), sy=lerp(hb,ry,t);
      ctx.beginPath();ctx.moveTo(sx-2.5,sy-2.5);ctx.lineTo(sx+2.5,sy+1);ctx.stroke();
    }
    /* свет из люка на грунт — поле под кораблём (19g), не 2D (G15) */
  }
  /* ── сопла снизу-сзади: железо блока; тление — поле (19g) ── */
  const ex=-half*.80, ey=bY+bodyH*.02, er=bodyH*.24;
  /* блок двигателей выступает из кормы: иначе колокола выглядят наклейкой */
  ctx.fillStyle=rgba(h.body,1);ctx.strokeStyle=rgba(h.edge,1);ctx.lineWidth=1.1;
  ctx.beginPath();ctx.rect(ex-er*.9,bY-bodyH*.34,er*3.4,bodyH*.36);
  ctx.fill();ctx.stroke();
  for(const d of [0,er*1.7]){
    ctx.fillStyle=rgba(h.dark,1);
    ctx.beginPath();
    ctx.moveTo(ex+d,ey-er);ctx.lineTo(ex+d-er*.7,ey+er*.8);
    ctx.lineTo(ex+d+er*.9,ey+er*.8);ctx.closePath();ctx.fill();
  }
  /* тормозные сопла в брюхе — железо, а не огонь: факел бьёт поле (19g) */
  for(const bx of [-half*.5,-half*.05,half*.42]){
    const by=bY-bodyH*.02, br=bodyH*.13;
    ctx.fillStyle=rgba(h.dark,1);ctx.fillRect(bx-br*.9,by-br*.6,br*1.8,br*1.2);
  }
  ctx.restore();
  if(broken){
    /* побитый корпус: трещины в выпечке; дым — фигурами в кадре посадки (19) */
    ctx.strokeStyle="rgba(255,90,60,.9)";ctx.lineWidth=1.6;
    const r=rng(0x9911);
    for(let i=0;i<5;i++){
      const a=r()*TAU, d=6+r()*12;
      ctx.beginPath();ctx.moveTo(Math.cos(a)*d*.3,Math.sin(a)*d*.3);
      ctx.lineTo(Math.cos(a)*d,Math.sin(a)*d-4);ctx.stroke();
    }
  }
}
