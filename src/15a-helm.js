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
const HELM_CONE=.35;         /* ±20° — временный конус автоогня (M362 заменит) */
const HELM_RANGE=760;
const HELM={src:"arrows",   /* кто вёл последним: mouse | arrows | stick */
  mouse:{x:0,y:0,t:-1e9,on:false,down:false,moved:0,rmb:false},
  L:null,R:null,             /* живые стики: {id,x0,y0,x,y} */
  fadeL:null,fadeR:null,     /* след отпущенного стика: {x0,y0,a} */
  key:{},lockEdge:false,lockWas:false};
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
    if(s&&s.id===e.pointerId){HELM["fade"+side]={x0:s.x0,y0:s.y0,a:1};HELM[side]=null;}
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
  const alive=new Set(G.pirates||[]);
  for(let i=G.marks.length-1;i>=0;i--)if(!alive.has(G.marks[i])||G.marks[i].hull<=0||G.marks[i].iff)G.marks.splice(i,1);
  if(G.marks.length>HELM_MARKS)G.marks.length=HELM_MARKS;
}
function helmLock(p){
  helmMarksClean();
  const i=G.marks.indexOf(p);
  if(i>=0)G.marks.splice(i,1);
  G.marks.unshift(p);
  if(G.marks.length>HELM_MARKS)G.marks.length=HELM_MARKS;
  sfx("ui",{f:880,to:1180,d:.08,v:.22});
}
/* Tab / ЦЕЛЬ: ближайший знающий о вас враг; повтор — следующий по кругу */
function helmLockNext(){
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
  if(mag>0&&G.fuel>0){
    let fwd=0,tx=0,ty=0;
    if(c.thrOnly||along<0){tx=c.tx*HELM_THR;ty=c.ty*HELM_THR;o.thr=true;}
    else{
      fwd=along;o.main=fwd>.05;
      tx=-sa*side*HELM_THR;ty=ca*side*HELM_THR;
      if(Math.abs(side)>.05)o.thr=true;
    }
    sh.vx+=(ca*fwd+tx)*.082*st.thr*dt;
    sh.vy+=(sa*fwd+ty)*.082*st.thr*dt;
    G.fuel=Math.max(0,G.fuel-(.021*fwd+.017*Math.hypot(tx,ty)/HELM_THR)*dt);
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
function helmDrawSticks(){
  const one=(s,f,col)=>{
    const x0=s.x0,y0=s.y0,a=f?s.a:1;
    ctx.globalAlpha=.55*a;ctx.strokeStyle=col;ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(x0,y0,HELM_REACH+HELM_DEAD,0,TAU);ctx.stroke();
    ctx.globalAlpha=.25*a;ctx.beginPath();ctx.arc(x0,y0,HELM_DEAD,0,TAU);ctx.stroke();
    if(!f){
      const dx=s.x-x0,dy=s.y-y0,m=Math.hypot(dx,dy),k=m>HELM_REACH+HELM_DEAD?(HELM_REACH+HELM_DEAD)/m:1;
      ctx.globalAlpha=.85;ctx.fillStyle=col;ctx.beginPath();ctx.arc(x0+dx*k,y0+dy*k,11,0,TAU);ctx.fill();
    }
    ctx.globalAlpha=1;
  };
  if(HELM.L)one(HELM.L,false,"#7fe6d8");else if(HELM.fadeL){one(HELM.fadeL,true,"#7fe6d8");HELM.fadeL.a-=.06;if(HELM.fadeL.a<=0)HELM.fadeL=null;}
  if(HELM.R)one(HELM.R,false,"#f2b25c");else if(HELM.fadeR){one(HELM.fadeR,true,"#f2b25c");HELM.fadeR.a-=.06;if(HELM.fadeR.a<=0)HELM.fadeR=null;}
}
