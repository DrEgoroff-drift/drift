/* ══════════════ штурвал (M360) ══════════════
   Четыре канала вместо двух: курс, вектор тяги, захват, огонь. Их пишут три
   ввода — два плавающих стика на телефоне, мышь и стрелки на клавиатуре — и
   читает один системный режим (D08). Ниже слоя ввода никто не знает, чем
   именно вели корабль. Старые `keys.*` (пэды, пояс, посадка, тесты) здесь же
   переводятся в те же каналы: пояс, посадка, черпак и поверхность не тронуты.

   Угловой инерции нет: нос идёт к заданному курсу со скоростью `st.turn`,
   без разгона и без выбега; крен — только рисунок от фактической скорости
   поворота. Тяга — вектор в осях экрана: вдоль носа полная (маршевый), вбок и
   назад — .4 через маневровые. Отпустил всё ниже .55 крейсерской — тормоз, как
   ТОРМОЗ; выше — накат (развилка §10, по умолчанию .55). */
const HELM_RELEASE=.55;      /* доля maxSp, ниже которой отпущенная тяга тормозит */
const HELM_THR=.4;           /* маневровые против маршевого */
const HELM_DEAD=12;          /* мёртвая зона стика, px */
const HELM_REACH=70;         /* px хода стика до полной тяги */
const HELM_PICK=40;          /* px до корпуса, чтобы взять его в захват */
const HELM_MARKS=3;
/* след стика (M360a): дуга под пальцем вместо кольца в 82 px. Радиус дуги —
   это сила тяги, её угол — направление; весь рисунок умещается в HELM_FOOT от
   точки касания, и это число читают и вёрстка, и тесты. */
const HELM_ARC0=20;          /* радиус дуги в мёртвой зоне, px */
const HELM_ARC1=46;          /* радиус дуги на полном ходе */
const HELM_ARCW=.5;          /* полураствор дуги, рад */
const HELM_FOOT=HELM_ARC1+5; /* весь след стика от точки касания, px */
const HELM_CONE=.35;         /* ±20° — временный конус автоогня (M362 заменит) */
const HELM_RANGE=760;
const HELM={src:"arrows",   /* кто вёл последним: mouse | arrows | stick */
  mouse:{x:0,y:0,t:-1e9,on:false,down:false,moved:0,rmb:false},
  L:null,R:null,             /* живые стики: {id,x0,y0,x,y} */
  fadeL:null,fadeR:null,     /* след отпущенного стика: {x0,y0,a} */
  key:{},lockEdge:false,lockWas:false,lift:-1};
function ctlReset(){
  G.ctl={head:null,headK:1,turn:0,tx:0,ty:0,brake:false,fire:false,msl:false,
    headIdle:true,thrOnly:false,src:HELM.src,out:{main:false,thr:false,rate:0}};
  return G.ctl;
}
/* ── сырые клавиши штурвала ──
   `keys` через KMAP кладёт и A, и ← в одно `left`; штурвалу важно различать:
   под мышью WASD — оси экрана, под стрелками ← → — руль. Поэтому свой слой. */
const HELM_KEYS=new Set(["KeyW","KeyA","KeyS","KeyD","KeyQ","KeyE","ShiftLeft","ShiftRight",
  "ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Tab","Escape","KeyF","KeyG"]);
addEventListener("keydown",e=>{
  if(!HELM_KEYS.has(e.code))return;
  HELM.key[e.code]=true;
  if(e.code.startsWith("Arrow")||e.code==="KeyQ"||e.code==="KeyE")HELM.src="arrows";
  if(G.mode==="system"&&!helmScreenOpen()){
    if(e.code==="Tab"){e.preventDefault();HELM.lockEdge=true;}
    if(e.code==="Escape"&&G.marks&&G.marks.length){G.marks.length=0;e.preventDefault();}
  }
});
addEventListener("keyup",e=>{if(HELM_KEYS.has(e.code))HELM.key[e.code]=false;});
addEventListener("blur",()=>{HELM.key={};HELM.L=HELM.R=null;HELM.mouse.down=false;HELM.mouse.rmb=false;});
/* ── мышь над холстом ── */
function helmCanvasXY(e){const rc=cvs.getBoundingClientRect();return [(e.clientX-rc.left)*W/rc.width,(e.clientY-rc.top)*H/rc.height];}
cvs.addEventListener("pointermove",e=>{
  if(e.pointerType==="mouse"){
    const [x,y]=helmCanvasXY(e);
    if(G.mode==="system"){HELM.mouse.moved+=Math.hypot(x-HELM.mouse.x,y-HELM.mouse.y);HELM.src="mouse";}
    HELM.mouse.x=x;HELM.mouse.y=y;HELM.mouse.t=performance.now();HELM.mouse.on=true;
    return;
  }
  const s=HELM.L&&HELM.L.id===e.pointerId?HELM.L:(HELM.R&&HELM.R.id===e.pointerId?HELM.R:null);
  if(s){const xy=helmCanvasXY(e);s.x=xy[0];s.y=xy[1];}
});
cvs.addEventListener("pointerleave",e=>{if(e.pointerType==="mouse"){HELM.mouse.on=false;HELM.mouse.down=false;HELM.mouse.rmb=false;}});
cvs.addEventListener("pointerdown",e=>{
  if(G.mode!=="system")return;
  if(e.pointerType==="mouse"){
    if(e.button===0)HELM.mouse.down=performance.now();
    if(e.button===2)HELM.mouse.rmb=true;
    HELM.src="mouse";return;
  }
  /* палец: левая половина — курс, правая — тяга; стик рождается под пальцем */
  const xy=helmCanvasXY(e);
  const side=xy[0]<W/2?"L":"R";
  if(HELM[side])return;               /* второй палец на той же половине — просто тап */
  HELM[side]={id:e.pointerId,x0:xy[0],y0:xy[1],x:xy[0],y:xy[1]};
  HELM.src="stick";
});
function helmPtrEnd(e){
  if(e.pointerType==="mouse"){if(e.button===0)HELM.mouse.down=false;if(e.button===2)HELM.mouse.rmb=false;return;}
  for(const side of ["L","R"]){
    const s=HELM[side];
    if(s&&s.id===e.pointerId){HELM["fade"+side]={x0:s.x0,y0:s.y0,x:s.x,y:s.y,f:1};HELM[side]=null;}
  }
}
cvs.addEventListener("pointerup",helmPtrEnd);
cvs.addEventListener("pointercancel",helmPtrEnd);
cvs.addEventListener("contextmenu",e=>{if(G.mode==="system")e.preventDefault();});
/* щипок в системе отдан стикам: два пальца — это два стика, а не зум (зум — кнопками борта) */
/* открытый экран над холстом: в Node любой селектор «находит» заглушку, поэтому спрашиваем класс */
function helmScreenOpen(){const el=document.querySelector(".scr.open");return !!(el&&el.classList&&el.classList.contains&&el.classList.contains("open"));}
function helmPinchBlocked(){return G.mode==="system"&&(!!HELM.L||!!HELM.R);}

/* ── захват ── */
function helmTargets(){return (G.pirates||[]).filter(p=>p.hull>0&&!p.iff);}
function helmMarksClean(){
  if(!G.marks)G.marks=[];
  /* помеховая капитана (M368, §5): рядом с ним захват не держится вовсе —
     ни ваш палец, ни автозахват стрелявшего его не вернут, пока не отойти */
  if(G.jamT>0){G.marks.length=0;return;}
  const alive=new Set(G.pirates||[]);
  for(let i=G.marks.length-1;i>=0;i--)if(!alive.has(G.marks[i])||G.marks[i].hull<=0||G.marks[i].iff)G.marks.splice(i,1);
  if(G.marks.length>HELM_MARKS)G.marks.length=HELM_MARKS;
}
function helmLock(p){
  if(G.jamT>0){say("ПОМЕХА · ЗАХВАТА НЕТ",70);return;}
  helmMarksClean();
  const i=G.marks.indexOf(p);
  if(i>=0)G.marks.splice(i,1);
  G.marks.unshift(p);
  if(G.marks.length>HELM_MARKS)G.marks.length=HELM_MARKS;
  sfx("ui",{f:880,to:1180,d:.08,v:.22});
}
/* Tab / ЦЕЛЬ: ближайший знающий о вас враг; повтор — следующий по кругу */
function helmLockNext(){
  /* пока висит оклик, ЦЕЛЬ — это второй ответ, а не захват (M373): брать
     пикет в прицел в этот момент означало бы совсем другой разговор */
  if(G.hail&&typeof hailAnswer==="function"){hailAnswer("busy");return false;}
  /* у обломка ЦЕЛЬ снимает экипаж (M375): целиться там не в кого */
  if(typeof npcCrewOff==="function"&&G.mode==="system"&&npcCrewOff(G.ship))return false;
  /* у чужой вещи ЦЕЛЬ объявляет благодарность (M377) — единственный обратный
     канал во всей игре, и он число */
  if(typeof leftThankNear==="function"&&G.mode==="system"&&leftThankNear())return false;
  if(G.jamT>0){say("ПОМЕХА · ЗАХВАТА НЕТ",70);return false;}
  helmMarksClean();
  const sh=G.ship;
  const list=helmTargets().filter(p=>p.aware).sort((a,b)=>Math.hypot(a.x-sh.x,a.y-sh.y)-Math.hypot(b.x-sh.x,b.y-sh.y));
  if(!list.length){say("ЦЕЛЕЙ НЕТ",60);return false;}
  const cur=G.marks[0],i=list.indexOf(cur);
  helmLock(list[(i+1)%list.length]);
  return true;
}
/* тап/клик по корпусу в 40 px экрана — захват. Возвращает true, если попал */
function helmTap(sxp,syp){
  if(G.mode!=="system")return false;
  const Z=G.zoom,sh=G.ship;
  const cx0=(G.viewCX!==undefined?G.viewCX:sh.x),cy0=(G.viewCY!==undefined?G.viewCY:sh.y);
  let best=null,bd=HELM_PICK;
  for(const p of helmTargets()){
    const x=W/2+(p.x-cx0)*Z,y=H/2+(p.y-cy0)*Z;
    const d=Math.hypot(sxp-x,syp-y);
    if(d<bd){bd=d;best=p;}
  }
  if(!best)return false;
  helmLock(best);return true;
}
/* стрелявший берётся в захват сам, если захвата нет: третьего пальца на телефоне не бывает */
function helmShotAt(p){
  helmMarksClean();
  if(!G.marks.length&&p&&p.hull>0&&!p.iff)G.marks.push(p);
}

/* ── чтение трёх вводов в G.ctl: раз в кадр, до физики ── */
function helmTick(dt){
  const c=G.ctl||ctlReset(),sh=G.ship,K=HELM.key,now=performance.now();
  c.head=null;c.headK=1;c.turn=0;c.tx=0;c.ty=0;c.brake=false;c.thrOnly=false;c.fire=false;c.msl=false;
  let headBusy=false,input=false;
  helmMarksClean();
  /* ЦЕЛЬ на пэде и Tab — по фронту нажатия */
  const lockPad=!!keys.lock;
  if((lockPad&&!HELM.lockWas)||HELM.lockEdge)helmLockNext();
  HELM.lockWas=lockPad;HELM.lockEdge=false;
  /* 1. стики */
  if(HELM.L){
    const dx=HELM.L.x-HELM.L.x0,dy=HELM.L.y-HELM.L.y0;
    if(Math.hypot(dx,dy)>HELM_DEAD){c.head=Math.atan2(dy,dx);headBusy=true;input=true;}
  }
  if(HELM.R){
    const dx=HELM.R.x-HELM.R.x0,dy=HELM.R.y-HELM.R.y0,m=Math.hypot(dx,dy);
    if(m>HELM_DEAD){const k=Math.min(1,(m-HELM_DEAD)/HELM_REACH)/m;c.tx=dx*k;c.ty=dy*k;input=true;}
  }
  /* 2. клавиатура */
  const mouseScheme=HELM.src==="mouse";
  if(mouseScheme){
    const tx=(K.KeyD?1:0)-(K.KeyA?1:0),ty=(K.KeyS?1:0)-(K.KeyW?1:0);
    if(tx||ty){const m=Math.hypot(tx,ty);c.tx=tx/m;c.ty=ty/m;input=true;}
    c.thrOnly=!!(K.ShiftLeft||K.ShiftRight);
    if(HELM.mouse.on&&!helmScreenOpen()){
      const cx0=(G.viewCX!==undefined?G.viewCX:sh.x),cy0=(G.viewCY!==undefined?G.viewCY:sh.y);
      const sx=W/2+(sh.x-cx0)*G.zoom,sy=H/2+(sh.y-cy0)*G.zoom;
      const dx=HELM.mouse.x-sx,dy=HELM.mouse.y-sy,d=Math.hypot(dx,dy);
      if(d>10){c.head=Math.atan2(dy,dx);c.headK=clamp(d/140,.25,1);}
      if(now-HELM.mouse.t<500)headBusy=true;
    }
    if(HELM.mouse.down&&now-HELM.mouse.down>180)c.fire=true;
    if(HELM.mouse.rmb)c.msl=true;
  }else{
    const turn=((K.ArrowRight||keys.right)?1:0)-((K.ArrowLeft||keys.left)?1:0);
    if(turn){c.turn=turn;headBusy=true;input=true;}
    const along=((K.ArrowUp||keys.thrust)?1:0)-(K.ArrowDown?1:0),side=(K.KeyE?1:0)-(K.KeyQ?1:0);
    if(along||side){
      const ca=Math.cos(sh.a),sa=Math.sin(sh.a);
      c.tx+=ca*along-sa*side;c.ty+=sa*along+ca*side;input=true;
    }
    if(keys.brake){c.brake=true;input=true;}
  }
  if(K.KeyF||keys.fire)c.fire=true;
  if(K.KeyG||keys.msl)c.msl=true;
  const m=Math.hypot(c.tx,c.ty);if(m>1){c.tx/=m;c.ty/=m;}
  /* автопилот и орбита сходят с любого руления; мышь — только с заметного хода (40 px) */
  if(input||(mouseScheme&&HELM.mouse.moved>40)){G.ap=null;G.orbit=null;}
  HELM.mouse.moved=0;
  /* D07: нос идёт за меткой, только когда рука с курса снята */
  c.headIdle=!headBusy;
  if(c.headIdle&&G.marks.length){
    const p=G.marks[0];c.head=Math.atan2(p.y-sh.y,p.x-sh.x);c.headK=1;
  }
  c.src=HELM.src;
  helmLift();          /* подсказка над пальцем (M360a) */
  return c;
}
/* ── физика штурвала: курс, тяга, правило отпускания. Вызывается системным
   режимом вместо старого блока рулей; пишет sh.a/vx/vy, топливо и c.out ── */
function helmApply(dt,st,sh,maxSp){
  const c=G.ctl||ctlReset(),o=c.out;
  const RATE=.038*st.turn;
  const a0=sh.a;
  /* курс сворачиваем всегда: за долгий полёт он копится оборотами */
  sh.a=angWrap(sh.a);
  if(c.turn)sh.a=angWrap(sh.a+c.turn*RATE*dt);
  else if(c.head!=null){
    const k=c.headK||1;
    sh.a=angWrap(sh.a+clamp(angDiff(c.head,sh.a),-RATE*k*dt,RATE*k*dt));
  }
  sh.av=angDiff(sh.a,a0)/Math.max(dt,1e-4);
  o.rate=sh.av;
  /* тяга: вдоль носа — маршевый, остальное — маневровые */
  const ca=Math.cos(sh.a),sa=Math.sin(sh.a);
  const along=c.tx*ca+c.ty*sa,side=-c.tx*sa+c.ty*ca;
  o.main=false;o.thr=false;
  const mag=Math.hypot(c.tx,c.ty);
  /* маневровые пьют из той же шкалы, что выстрел и щит (M362, §4).
     Пустая — не «нельзя», а вполовину: корабль остаётся управляемым. */
  const eLow=(typeof EN_SHOT==="number")&&(G.energy||0)<EN_SHOT;
  const eK=eLow?.5:1;
  if(mag>0&&G.fuel>0){
    let fwd=0,tx=0,ty=0;
    if(c.thrOnly||along<0){tx=c.tx*HELM_THR;ty=c.ty*HELM_THR;o.thr=true;}
    else{
      fwd=along;o.main=fwd>.05;
      tx=-sa*side*HELM_THR;ty=ca*side*HELM_THR;
      if(Math.abs(side)>.05)o.thr=true;
    }
    const side2=Math.hypot(tx,ty)/HELM_THR;
    sh.vx+=(ca*fwd+tx*eK)*.082*st.thr*dt;
    sh.vy+=(sa*fwd+ty*eK)*.082*st.thr*dt;
    G.fuel=Math.max(0,G.fuel-(.021*fwd+.017*side2)*dt);
    if(typeof EN_THR==="number"&&side2>0)
      G.energy=Math.max(0,(G.energy||0)-EN_THR*side2*dt);
  }
  /* отпустил ниже крейсерской — маневровые гасят ход, как ТОРМОЗ; выше — накат */
  const sp0=Math.hypot(sh.vx,sh.vy);
  const wantBrake=c.brake||(mag===0&&sp0<maxSp*HELM_RELEASE&&sp0>0&&!c.thrOnly);
  if(wantBrake&&G.fuel>0){
    if(sp0>.03){
      const dec=Math.min(sp0,.058*st.thr*dt);
      sh.vx-=sh.vx/sp0*dec;sh.vy-=sh.vy/sp0*dec;
      G.fuel=Math.max(0,G.fuel-.017*dt);o.thr=true;
    }else{sh.vx=0;sh.vy=0;}
  }
  return o;
}
/* ── рисунок: скобки захвата в мире, стики в пикселях экрана ── */
function helmDrawMarks(zx,zy,Z){
  if(!G.marks||!G.marks.length)return;
  G.marks.forEach((p,i)=>{
    const x=zx(p.x),y=zy(p.y);
    if(x<-40||x>W+40||y<-40||y>H+40)return;
    const r=clamp(Z,.55,1.6)*(i?16:20),g=r*.45;
    ctx.strokeStyle=i?"rgba(255,157,122,.5)":"rgba(255,107,87,.92)";ctx.lineWidth=i?1:1.4;
    ctx.beginPath();
    for(const c of [[-1,-1],[1,-1],[1,1],[-1,1]]){
      ctx.moveTo(x+c[0]*r,y+c[1]*(r-g));ctx.lineTo(x+c[0]*r,y+c[1]*r);ctx.lineTo(x+c[0]*(r-g),y+c[1]*r);
    }
    ctx.stroke();
  });
}
/* ── след стика (M360a) ──
   M360 рисовал два кольца в 82 px с шапкой в 11: на телефоне левое ложилось на
   фишки компаса, МАСШТАБ и приёмник, правое — на подсказку, и кадр читался как
   два прибора поверх мира. Стик не прибор. Он говорит одно — куда и насколько
   я тяну, — и говорит это дугой под большим пальцем: угол дуги это направление,
   её радиус это сила, точка это сам палец. Всё бледное (.2….3): рука и так
   знает, где она, глаз в это место не зовут. */
function helmStickShape(s){
  const dx=s.x-s.x0,dy=s.y-s.y0,m=Math.hypot(dx,dy);
  const k=clamp((m-HELM_DEAD)/HELM_REACH,0,1);
  const r=HELM_ARC0+(HELM_ARC1-HELM_ARC0)*k,c=m>1e-3?Math.min(m,r)/m:0;
  return {x0:s.x0,y0:s.y0,live:m>HELM_DEAD,ang:Math.atan2(dy,dx),r,k,dx:dx*c,dy:dy*c};
}
/* след живых стиков в пикселях экрана: его читают приборная мелочь на канве
   (drawSysHud), подсказка в DOM (helmLift) и набор 91zzx-mobile */
function helmStickFoot(){
  const out=[];
  for(const side of ["L","R"]){const s=HELM[side];if(s)out.push({side,x:s.x0,y:s.y0,r:HELM_FOOT});}
  return out;
}
/* подсказка уходит выше пальца, а не гаснет под ним: пока стик накрывает её
   строку, #prompt поднимается ровно на высоту следа. Меряем DOM, а не считаем
   CSS (правило 27z); пишем в стиль только на изменение. */
function helmLift(){
  const el=(typeof document!=="undefined")&&document.getElementById&&document.getElementById("prompt");
  let lift=0;
  const foot=helmStickFoot();
  if(el&&el.getBoundingClientRect&&foot.length){
    const r=el.getBoundingClientRect();
    /* мерим ОТ НЕПОДНЯТОГО места: подсказка уже поднята на прошлый lift, и
       без этой поправки следующий кадр увидел бы её чистой и уронил обратно —
       строка бы дрожала под пальцем */
    const base=Math.max(0,HELM.lift),top=r.top+base,bot=r.bottom+base;
    if(r.height>0)for(const f of foot)
      if(f.x+f.r>r.left&&f.x-f.r<r.right&&f.y-f.r<bot&&f.y+f.r>top)
        lift=Math.max(lift,bot-(f.y-f.r)+8);
    /* потолок: подсказка поднимается ровно настолько, чтобы разойтись с
       пальцем, и никогда не уезжает на середину экрана */
    lift=Math.min(lift,Math.round(innerHeight*.22));
  }
  if(lift!==HELM.lift){
    HELM.lift=lift;
    if(document.body&&document.body.style&&document.body.style.setProperty){
      document.body.style.setProperty("--helmlift",lift+"px");
      document.body.classList.toggle("helmstick",foot.length>0);
    }
  }else if(document.body&&document.body.classList&&
           document.body.classList.contains("helmstick")!==(foot.length>0)){
    document.body.classList.toggle("helmstick",foot.length>0);
  }
}
/* сколько места занимает скобка захвата над корпусом: полоску корпуса ставят
   ВЫШЕ неё, иначе верхняя грань скобки ложится ровно на полоску (M360a) */
function helmMarkTop(p,Z){
  if(!G.marks)return 0;
  const i=G.marks.indexOf(p);
  if(i<0)return 0;
  return clamp(Z,.55,1.6)*(i?16:20)+8;
}
function helmDrawSticks(){
  const one=(s,fade)=>{
    const q=helmStickShape(s),a=fade?s.f:1;
    ctx.save();ctx.lineCap="round";
    ctx.strokeStyle="#cfe6ea";ctx.fillStyle="#cfe6ea";ctx.lineWidth=1.5;
    if(q.live){
      ctx.globalAlpha=(.16+.14*q.k)*a;
      ctx.beginPath();ctx.arc(q.x0,q.y0,q.r,q.ang-HELM_ARCW,q.ang+HELM_ARCW);ctx.stroke();
    }
    ctx.globalAlpha=.13*a;
    ctx.beginPath();ctx.arc(q.x0,q.y0,1.8,0,TAU);ctx.fill();
    ctx.globalAlpha=.28*a;
    ctx.beginPath();ctx.arc(q.x0+q.dx,q.y0+q.dy,3.2,0,TAU);ctx.fill();
    ctx.restore();
  };
  for(const side of ["L","R"]){
    const live=HELM[side],fade=HELM["fade"+side];
    if(live)one(live,false);
    else if(fade){one(fade,true);fade.f-=.08;if(fade.f<=0)HELM["fade"+side]=null;}
  }
}
