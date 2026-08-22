/* ══════════════ облик системы ══════════════ */
/* Все системы выглядели одинаково: одна туманность на всю игру и один и тот же
   жёлтый шар в середине. Класс звезды при этом в данных был — он просто нигде
   не читался глазом.

   Теперь у системы есть облик, детерминированный от её seed: тип светила,
   цвет туманности, плотность пыли. Экзотика (двойная, красный гигант, белый
   карлик, нейтронная, чёрная дыра) выпадает редко — на то она и экзотика;
   в остальных системах работает обычный класс из STAR_CLASS.

   Важно: экзотика меняет только отрисовку и вторичный цвет. Освещение,
   опасность и вся арифметика по-прежнему идут от sys.cls, поэтому баланс
   не двигается. */
const SYS_EXOTIC=[
  {k:"binary", ru:"двойная",         w:10},
  {k:"giant",  ru:"красный гигант",  w:7},
  {k:"dwarf",  ru:"белый карлик",    w:6},
  {k:"neutron",ru:"нейтронная",      w:4},
  {k:"hole",   ru:"чёрная дыра",     w:1.4}
];
function sysStyle(sys){
  if(sys.style)return sys.style;
  const r=rng((sys.seed^0x51A7)>>>0);
  let kind="normal",ru=sys.cls.ru;
  /* три системы из десяти — с особым светилом. Чаще — и особое перестаёт
     читаться как особое, реже — игрок никогда его не встретит */
  if(r()<.30){
    let tot=0;for(const e of SYS_EXOTIC)tot+=e.w;
    let pick=r()*tot;
    for(const e of SYS_EXOTIC){pick-=e.w;if(pick<=0){kind=e.k;ru=e.ru;break;}}
  }
  /* цвет туманности: от цвета звезды, но сдвинут — совпадающий цвет сливается
     со свечением светила и туманности как будто нет */
  const c=hex2rgb(sys.cls.col);
  const hueShift=r()<.5?-1:1;
  const n1=[clamp(c[0]*.5+hueShift*38,10,255),clamp(c[1]*.42+40,10,255),clamp(c[2]*.72+hueShift*-24+70,10,255)];
  const n2=[clamp(c[0]*.72+30,10,255),clamp(c[1]*.3+18,10,255),clamp(c[2]*.5+90,10,255)];
  sys.style={kind,ru,neb:[n1.map(Math.round),n2.map(Math.round)],
    dust:.5+r()*1.2, nseed:(r()*1e9)|0, sep:.9+r()*.7, phase:r()*TAU};
  return sys.style;
}
/* ── туманность системы ──
   Тайл считается один раз на систему и живёт на её объекте: систем в кэше
   немного, а перерисовывать шум каждый кадр canvas 2D не может.

   Считается он ПО КАДРАМ. Разом это семьдесят миллисекунд — ровно тот рывок,
   которым встречала каждая новая система: три слоя шума на двадцать пять тысяч
   точек. Пока тайл не готов, туманности просто нет; она проступает через
   полсекунды, и заметить это трудно — она и так подмешивается вполсилы поверх
   звёзд, а вот замерший на кадр корабль замечают всегда. */
const NEB_MS=2;              // миллисекунд кадра на фоновую выпечку
let NEB_JOB=null;
function sysNebulaTex(sys){
  if(sys.nebTex)return sys.nebTex;
  if(!NEB_JOB||NEB_JOB.sys!==sys){
    const st=sysStyle(sys),S=160;
    const cn=document.createElement("canvas");cn.width=cn.height=S;
    const c=cn.getContext("2d");
    NEB_JOB={sys,S,cn,c,img:c.createImageData(S,S),y:0,
      sd:st.nseed>>>0,c1:st.neb[0],c2:st.neb[1]};
  }
  const J=NEB_JOB,S=J.S,d=J.img.data,sd=J.sd,c1=J.c1,c2=J.c2;
  const t0=performance.now();
  while(J.y<S){
    const y=J.y++;
    for(let x=0;x<S;x++){
      const o=(y*S+x)*4,u=x/S,v=y/S;
      const a=clamp((tfbm(u,v,3,sd,5)-.45)*2.7,0,1);
      const b=clamp((tfbm(u,v,6,sd+91,4)-.48)*2.5,0,1);
      /* волокна: третий слой с высокой частотой и узкой маской — без них
         туманность выглядит размытым пятном, а не облаком газа */
      const f=ridged(tfbm(u,v,9,sd+53,3),9);
      d[o]  =clamp(c1[0]*a+c2[0]*b*.8+f*90,0,255);
      d[o+1]=clamp(c1[1]*a+c2[1]*b*.8+f*70,0,255);
      d[o+2]=clamp(c1[2]*a+c2[2]*b*.9+f*120,0,255);
      d[o+3]=clamp((Math.pow(a,1.8)*.5+Math.pow(b,2.1)*.34+f*.16)*255,0,255);
    }
    if(performance.now()-t0>NEB_MS)return null;
  }
  J.c.putImageData(J.img,0,0);
  sys.nebTex=J.cn;NEB_JOB=null;
  return sys.nebTex;
}
function drawSysNebula(sys,cx,cy){
  const N=sysNebulaTex(sys);
  if(!N)return;               // ещё печётся — этот кадр обойдётся без неё
  const ex=W*.24,ey=H*.24;
  const ox=-ex/2+clamp(-cx*.012,-ex/2,ex/2);
  const oy=-ey/2+clamp(-cy*.012,-ey/2,ey/2);
  ctx.save();
  ctx.globalCompositeOperation="lighter";
  ctx.globalAlpha=.5;
  ctx.drawImage(N,ox,oy,W+ex,H+ey);
  /* второй проход крупнее и смещённый — граница тайла перестаёт читаться */
  ctx.globalAlpha=.22;
  ctx.drawImage(N,ox-W*.3,oy-H*.2,(W+ex)*1.9,(H+ey)*1.9);
  ctx.restore();
}
/* ── пыль между планетами ──
   ближний слой, идущий быстрее звёзд: именно он даёт ощущение скорости, потому
   что звёзды слишком далеко, чтобы двигаться */
function drawSpaceDust(cx,cy,Z,dens){
  const n=Math.round(70*dens*G.opts.gfx.particles);
  const span=900;
  ctx.save();
  for(let i=0;i<n;i++){
    const r=rng(hashi(i,7,0xD057));
    const px=((r()*span-cx*.55)%span+span)%span/span*(W+40)-20;
    const py=((r()*span-cy*.55)%span+span)%span/span*(H+40)-20;
    const s=.6+r()*1.6;
    ctx.fillStyle="rgba(198,214,236,"+(.05+r()*.16).toFixed(3)+")";
    ctx.fillRect(px,py,s,s);
  }
  ctx.restore();
}
/* ── ощущение полёта ──
   Корабль двигался как курсор: камера приклеена, тяга ничем не отмечена, кроме
   мелких частиц шлейфа. Скорость чувствуется по трём вещам — камера отстаёт,
   сопло светит, воздух за соплом дрожит. Все три ничего не стоят.

   Камера живёт в G.fcam, смещение — в G.fshake; ввод пересчитывает тычок через
   те же значения (17-mode-system кладёт их в G.viewX/G.viewY). */
function flightCam(dt,tx,ty,thrusting,speed){
  if(!G.fcam)G.fcam={x:tx,y:ty};
  /* корабль умеет исчезать и появляться в другом месте: гиперпрыжок, взлёт,
     эвакуация, авария. Плавно доезжать туда полсекунды нельзя — игрок увидит
     пустоту вместо корабля, поэтому на большом разрыве камера прыгает разом. */
  if(Math.hypot(tx-G.fcam.x,ty-G.fcam.y)>320){G.fcam.x=tx;G.fcam.y=ty;G.fshake=0;}
  /* отставание тем больше, чем быстрее летим: на месте камера стоит точно,
     на разгоне тянется следом — это и читается как масса */
  const k=Math.min(1,(.16-clamp(speed*.012,0,.10))*dt);
  G.fcam.x+=(tx-G.fcam.x)*k;
  G.fcam.y+=(ty-G.fcam.y)*k;
  /* тряска на разгоне: слабая, иначе через минуту полёта укачивает */
  const want=thrusting?clamp(.5+speed*.06,0,1.7):0;
  G.fshake=(G.fshake||0)+(want-(G.fshake||0))*Math.min(1,.08*dt);
  /* Тряска должна быть колебанием, а не шумом. Раньше смещение бралось как хеш
     от (G.t*4|0): G.t растёт примерно на шесть за кадр, аргумент хеша менялся
     каждый кадр, и камера прыгала в новую случайную точку шестьдесят раз в
     секунду. При тяге — то есть почти всегда в манёвре — картинка мелко
     дёргалась, и это читается как подлагивание, а не как работа двигателя.
     Теперь это пара синусоид с несоизмеримыми частотами: ход непрерывный,
     рисунок не повторяется на глаз, между кадрами нет разрывов. */
  const t=G.t;
  const ox=Math.sin(t*.31)*.62+Math.sin(t*.73+1.7)*.38;
  const oy=Math.sin(t*.27+2.4)*.62+Math.sin(t*.61+.5)*.38;
  return {x:G.fcam.x+ox*G.fshake*1.6,
          y:G.fcam.y+oy*G.fshake*1.6};
}
/* сопло: ядро, факел и раскалённый воздух за ним. Дрожание воздуха подделано
   парой полупрозрачных дуг переменного радиуса — настоящего искажения в
   canvas 2D нет, а глаз читает именно колебание кромки */
function drawExhaust(zx,zy,Z,thr){
  if(thr<=0)return;
  const sh=G.ship,h=hullOf(G.shipId);
  const ca=Math.cos(sh.a),sa=Math.sin(sh.a);
  ctx.save();
  ctx.globalCompositeOperation="lighter";
  /* сопла ставим от центра корпуса в его же масштабе, а не через мировые
     координаты: корпус при отдалении рисуется крупнее мира, и факел, считанный
     по настоящему Z, отрывался от него и уползал внутрь силуэта */
  const SZ=shipZ(Z),cx0=zx(sh.x),cy0=zy(sh.y);
  for(const e of h.eng){
    const px=cx0+(e.x*ca-e.y*sa)*SZ, py=cy0+(e.x*sa+e.y*ca)*SZ;
    const R=Math.max(2.5,e.r*SZ*2.2);
    const puls=.82+.18*Math.sin(G.t*.55+e.x);
    /* факел вытянут против носа и живёт своей длиной на каждом кадре */
    const L=R*(3.4+2.6*puls)*thr;
    const fx=px-ca*L, fy=py-sa*L;
    const g=ctx.createLinearGradient(px,py,fx,fy);
    g.addColorStop(0,"rgba(255,246,222,"+(.55*thr).toFixed(3)+")");
    g.addColorStop(.35,"rgba(255,178,96,"+(.32*thr).toFixed(3)+")");
    g.addColorStop(1,"rgba(255,96,48,0)");
    ctx.fillStyle=g;
    ctx.beginPath();
    ctx.moveTo(px-sa*R*.7,py+ca*R*.7);
    ctx.lineTo(fx,fy);
    ctx.lineTo(px+sa*R*.7,py-ca*R*.7);
    ctx.closePath();ctx.fill();
    /* ядро сопла */
    const cg=ctx.createRadialGradient(px,py,0,px,py,R*1.7);
    cg.addColorStop(0,"rgba(255,255,250,"+(.8*thr).toFixed(3)+")");
    cg.addColorStop(.4,"rgba(255,206,150,"+(.4*thr).toFixed(3)+")");
    cg.addColorStop(1,"rgba(255,140,80,0)");
    ctx.fillStyle=cg;ctx.beginPath();ctx.arc(px,py,R*1.7,0,TAU);ctx.fill();
    /* дрожь воздуха */
    /* дуги дрожи держим почти на пороге видимости: заметные читаются как
       нарисованные рёбра, а не как раскалённый воздух */
    ctx.strokeStyle="rgba(255,220,190,"+(.045*thr).toFixed(3)+")";
    for(let i=0;i<3;i++){
      const t=(G.t*.06+i*.33)%1;
      const rr=R*(1.2+t*3.4);
      ctx.lineWidth=1+(1-t)*1.6;
      ctx.beginPath();
      ctx.arc(px-ca*L*t*.6,py-sa*L*t*.6,rr,sh.a+2.1,sh.a+4.2);
      ctx.stroke();
    }
  }
  ctx.restore();
}
/* ── светило ──
   один и тот же шар для карлика и для гиганта — потеря почти бесплатного
   разнообразия: класс звезды уже лежит в данных, его надо только показать */
function drawStarBody(ox,oy,R,sys){
  const st=sysStyle(sys);
  const col=sys.cls.col;
  if(st.kind==="hole"){drawStarHole(ox,oy,R,st);return;}
  if(st.kind==="binary"){
    /* две звезды на общей орбите: вторая холоднее и меньше — так пара
       читается парой, а не двоением */
    const a=G.t*.0022+st.phase, d=R*st.sep*1.6;
    drawStarSingle(ox+Math.cos(a)*d,oy+Math.sin(a)*d*.42,R*.72,col,1);
    drawStarSingle(ox-Math.cos(a)*d*.8,oy-Math.sin(a)*d*.34,R*.5,"#ffb060",.8);
    return;
  }
  if(st.kind==="giant"){drawStarSingle(ox,oy,R*1.85,"#ff7448",.72);return;}
  if(st.kind==="dwarf"){drawStarSingle(ox,oy,R*.34,"#e8f4ff",1.5);return;}
  if(st.kind==="neutron"){drawStarNeutron(ox,oy,R,st);return;}
  drawStarSingle(ox,oy,R,col,1);
}
function drawStarSingle(ox,oy,R,col,heat){
  const c=hex2rgb(col);
  /* протуберанцы: медленно вращаются и дышат */
  ctx.save();ctx.translate(ox,oy);ctx.rotate(G.t*.0014);
  ctx.fillStyle="rgba("+c.join(",")+",.055)";
  for(let i=0;i<14;i++){
    const a=i/14*TAU, len=R*(1.15+.5*Math.abs(Math.sin(G.t*.009+i*1.7)));
    ctx.beginPath();
    ctx.moveTo(Math.cos(a-.09)*R*.94,Math.sin(a-.09)*R*.94);
    ctx.lineTo(Math.cos(a)*len,Math.sin(a)*len);
    ctx.lineTo(Math.cos(a+.09)*R*.94,Math.sin(a+.09)*R*.94);
    ctx.closePath();ctx.fill();
  }
  ctx.restore();
  const g=ctx.createRadialGradient(ox,oy,0,ox,oy,R*7);
  g.addColorStop(0,col);g.addColorStop(.09,col);
  g.addColorStop(.3,"rgba("+c.join(",")+","+(.16*heat).toFixed(3)+")");
  g.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(ox,oy,R*7,0,TAU);ctx.fill();
  const core=ctx.createRadialGradient(ox,oy,0,ox,oy,R*.85);
  core.addColorStop(0,"rgba(255,253,247,"+(.82+.07*Math.sin(G.t*.04)).toFixed(2)+")");
  core.addColorStop(.5,"rgba("+[0,1,2].map(i=>Math.round(lerp(c[i],255,.6))).join(",")+",.42)");
  core.addColorStop(1,"rgba("+c.join(",")+",0)");
  ctx.fillStyle=core;ctx.beginPath();ctx.arc(ox,oy,R*.85,0,TAU);ctx.fill();
  /* блик-звезда: четыре луча и слабое кольцо. Настоящего bloom в canvas 2D нет,
     но глаз читает как «очень ярко» именно эти два признака */
  ctx.save();
  ctx.globalCompositeOperation="lighter";
  ctx.translate(ox,oy);
  for(let i=0;i<4;i++){
    const a=i*Math.PI/2+.2, len=R*(4.2+1.2*Math.sin(G.t*.02+i))*heat;
    const gg=ctx.createLinearGradient(0,0,Math.cos(a)*len,Math.sin(a)*len);
    gg.addColorStop(0,"rgba("+c.join(",")+",.22)");
    gg.addColorStop(1,"rgba("+c.join(",")+",0)");
    ctx.fillStyle=gg;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a+.045)*R*.4,Math.sin(a+.045)*R*.4);
    ctx.lineTo(Math.cos(a)*len,Math.sin(a)*len);
    ctx.lineTo(Math.cos(a-.045)*R*.4,Math.sin(a-.045)*R*.4);
    ctx.closePath();ctx.fill();
  }
  /* ореол вокруг ядра: тонкое кольцо читалось резкой окружностью, поэтому оно
     широкое и почти прозрачное — так это гало, а не обруч */
  ctx.strokeStyle="rgba("+c.join(",")+",.028)";ctx.lineWidth=R*.85;
  ctx.beginPath();ctx.arc(0,0,R*2.3,0,TAU);ctx.stroke();
  ctx.restore();
}
/* нейтронная: крошечная, зато с двумя лучами и кольцом сброшенного вещества */
function drawStarNeutron(ox,oy,R,st){
  const per=110;
  const f=Math.pow(Math.max(0,Math.sin((G.t%per)/per*Math.PI)),8);
  ctx.save();
  ctx.globalCompositeOperation="lighter";
  ctx.translate(ox,oy);ctx.rotate(st.phase+G.t*.006);
  const L=R*(6+8*f);
  const g=ctx.createLinearGradient(0,-L,0,L);
  g.addColorStop(0,"rgba(150,200,255,0)");
  g.addColorStop(.5,"rgba(225,240,255,"+(.30+.4*f).toFixed(3)+")");
  g.addColorStop(1,"rgba(150,200,255,0)");
  ctx.fillStyle=g;ctx.fillRect(-R*.22,-L,R*.44,L*2);
  ctx.restore();
  const cg=ctx.createRadialGradient(ox,oy,0,ox,oy,R*2.6);
  cg.addColorStop(0,"rgba(255,255,255,.95)");
  cg.addColorStop(.18,"rgba(190,225,255,.5)");
  cg.addColorStop(1,"rgba(120,180,255,0)");
  ctx.fillStyle=cg;ctx.beginPath();ctx.arc(ox,oy,R*2.6,0,TAU);ctx.fill();
  ctx.strokeStyle="rgba(170,210,255,.16)";ctx.lineWidth=R*.18;
  ctx.beginPath();ctx.ellipse(ox,oy,R*3.4,R*1.1,.4,0,TAU);ctx.stroke();
}
/* чёрная дыра в середине системы: тот же приём, что в небе планет, но крупнее
   и с втягивающимся газом */
function drawStarHole(ox,oy,R,st){
  const lg=ctx.createRadialGradient(ox,oy,R*.8,ox,oy,R*6);
  lg.addColorStop(0,"rgba(0,0,0,.96)");
  lg.addColorStop(.22,"rgba(6,4,12,.6)");
  lg.addColorStop(.55,"rgba(160,150,255,.06)");
  lg.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=lg;ctx.beginPath();ctx.arc(ox,oy,R*6,0,TAU);ctx.fill();
  ctx.fillStyle="#000";ctx.beginPath();ctx.arc(ox,oy,R*.8,0,TAU);ctx.fill();
  ctx.save();ctx.translate(ox,oy);ctx.rotate(-.25);
  ctx.globalCompositeOperation="lighter";
  ctx.strokeStyle="rgba(255,206,140,.7)";ctx.lineWidth=R*.16;
  ctx.beginPath();ctx.ellipse(0,0,R*2.1,R*.5,0,0,Math.PI);ctx.stroke();
  ctx.strokeStyle="rgba(255,170,100,.3)";ctx.lineWidth=R*.1;
  ctx.beginPath();ctx.ellipse(0,0,R*2.1,R*.5,0,Math.PI,TAU);ctx.stroke();
  ctx.strokeStyle="rgba(255,236,200,.45)";ctx.lineWidth=R*.08;
  ctx.beginPath();ctx.arc(0,0,R*1.05,Math.PI*1.02,Math.PI*1.98);ctx.stroke();
  /* втягиваемые струи: несколько дуг, бегущих по спирали внутрь */
  for(let i=0;i<5;i++){
    const t=((G.t*.004+i*.2)%1);
    const rr=R*(4.4-t*3.2);
    ctx.strokeStyle="rgba(255,190,130,"+(.20*(1-t)).toFixed(3)+")";
    ctx.lineWidth=1.6;
    ctx.beginPath();ctx.ellipse(0,0,rr,rr*.32,t*2.4+i,0,1.5);ctx.stroke();
  }
  ctx.restore();
}
