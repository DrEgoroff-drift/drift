/* ══════════════ роща: пояс, который отвечает на тягу ══════════════
   M138-grove. Горняцкий край поясов (06c, `grove`, игла масс-детектора). На
   окраине — одиночные наросты на камнях, которые все принимают за минерал и
   режут на продажу; ближе — заросли, от которых портится управление и которых
   ругают в эфире. В ядре — роща, которая ОТВЕЧАЕТ на корабль.

   ЯЗЫК — ТЯГА И СВЕТ. На маршевом она не обращает внимания; заглушил двигатель
   — медленно сходится. Никакого урона: самое большее, уходить становится
   неловко, а тяга заставляет её отпрянуть.

   ОНА ПОМНИТ КОРПУС. В следующий раз поворачивается раньше. Выстрелил один
   раз — расступается и больше никогда не подходит. Срезал одну на груз —
   смыкается навсегда; и груз должен быть по-настоящему стоящим, иначе выбора
   не было (ксенобиом, самое дорогое сырьё).

   ПРАВИЛА ФАЙЛА:
   1. Рост — тот же камень пояса с меткой `grove`: свой мир не заводим, роща
      рисуется тем же растром и тем же светом, только зелёным и с ореолом.
   2. Урона от рощи нет никогда: её камни не бьют корпус и держатся на
      дистанции — это правило, а не случайность.
   3. Хранится только память о корпусе: G.grove={turn,shot,cut}. */

const GROVE_ETHER=[
  "…опять зелень на камнях, резак вязнет. Кто брал этот сектор — не берите.",
  "…нарост срезал, в трюм — как минерал. Скупщик берёт, не спрашивает.",
  "…в заросли не лезьте, там руль тупой. Обходите по верху.",
  "…да минерал это, минерал. Светится — и что. Режь."
];
function groveAll(){return (G.grove||(G.grove={turn:0,shot:0,cut:0}));}
function groveDepthAt(sx,sy){
  if(typeof regionAt!=="function")return 0;
  const R=regionAt(sx,sy);
  if(R.theme!=="grove")return 0;
  const c=groveSys(R);
  return (c&&c.sx===sx&&c.sy===sy)?2:1;
}
function groveDepthHere(){return groveDepthAt(G.sx,G.sy);}
/* система рощи: ядро, если у него есть пояс, иначе первая система области с поясом */
function groveSys(R){
  if(R.groveSys!==undefined)return R.groveSys;
  let out=null;
  const S=getSystem(R.core.sx,R.core.sy);
  if(S&&S.belt)out={sx:S.sx,sy:S.sy};
  else{
    const bx=R.rx*REGION_SPAN,by=R.ry*REGION_SPAN;
    for(let x=bx;x<bx+REGION_SPAN&&!out;x++)for(let y=by;y<by+REGION_SPAN&&!out;y++){
      if(!starAt(x,y))continue;const T=getSystem(x,y);if(T&&T.belt)out={sx:x,sy:y};
    }
  }
  return R.groveSys=out;
}
function groveEtherLine(r){
  if(groveDepthHere()!==1||r()>.3)return null;
  return pick(GROVE_ETHER,r);
}
/* ── наросты ──
   Зовётся из enterBelt. Окраина: три одиночных камня с наростом. Ядро: роща —
   два десятка камней кучно, в стороне от старта. Нарост режется как руда и
   даёт ксенобиом. */
function groveDress(b){
  const d=groveDepthHere();if(!d)return;
  const r=rng(hashi(b.B.seed,0x6E0,d));
  b.grove=[];
  if(d===1){
    for(let i=0;i<3&&i<b.ast.length;i++){const a=b.ast[Math.floor(r()*b.ast.length)];if(!a.grove)groveMark(a,b);}
    return;
  }
  const a0=r()*TAU,cx=Math.cos(a0)*1100,cz=Math.sin(a0)*1100;
  let n=0;
  for(const a of b.ast){
    if(n>=22)break;
    a.x=cx+(r()-.5)*520;a.y=(r()-.5)*260;a.z=cz+(r()-.5)*520;
    groveMark(a,b);n++;
  }
  b.groveC={x:cx,y:0,z:cz};
}
function groveMark(a,b){
  a.grove=1;a.res="xeno";a.oreCol=hexRGB(RES.xeno.col);a.left=6;a.gl=0;
  b.grove.push(a);
}
/* ── ход ──
   Ядро. Тяга выключена — роща сходится (скорость растёт с числом визитов);
   тяга — отпрядывает. Ближе 150 не подходит: неловко, но не больно (правило 2).
   После выстрела — только уходит. После среза — сходится всегда, до 90. */
function groveTick(b,dt){
  if(!b.grove||!b.grove.length||groveDepthHere()!==2)return;
  const M=groveAll();
  const thr=!!(keys.thrust&&G.fuel>0);
  const sp=(.22+.08*Math.min(M.turn,5))*dt;
  for(const a of b.grove){
    const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,d=Math.hypot(dx,dy,dz)||1;
    let v=0,min=150;
    if(M.shot){v=d<900?-sp*1.6:0;}                  /* расступается */
    else if(M.cut){v=sp*1.3;min=90;}               /* смыкается навсегда */
    else if(thr){v=-sp*2.2;}                         /* отпрядывает */
    else if(d<1600){v=sp;}                           /* сходится */
    if(v>0&&d-a.r<min)v=0;
    a.x+=dx/d*v;a.y+=dy/d*v;a.z+=dz/d*v;
    a.gl=clamp(a.gl+(v>0?.02:-.01)*dt,0,1);         /* светится, когда идёт к тебе */
  }
}
/* роща не бьёт корпус: столкновение с её камнем — мягкий отвод, без урона */
function groveSoft(a){return !!a.grove;}
/* ── память ──
   killRock зовёт это первым. Оружие (power≥3) — выстрел: роща расступается
   навсегда. Резак (power<3) — срез: ксенобиом в трюм и роща смыкается. */
function groveOnKill(a,power){
  if(!a.grove)return;
  const M=groveAll();
  if(groveDepthHere()!==2)return;                    /* окраинный нарост — просто минерал */
  if(power>=3){if(!M.shot){M.shot=1;logAdd("dim","Роща расступилась. Больше не подойдёт.");}}
  else{
    G.cargo.xeno=(G.cargo.xeno||0)+6;
    if(!M.cut){M.cut=1;logAdd("dim","Срезал. Роща сомкнулась — теперь навсегда.");}
  }
}
/* визит: роща помнит корпус — в следующий раз поворачивается раньше */
function groveVisit(){
  if(groveDepthHere()===2)groveAll().turn=(groveAll().turn|0)+1;
}
/* ── вид ──
   После камней: зелёный ореол на каждом наросте, ярче, когда идёт к тебе.
   Своего языка нет — тот же свет памяти, что у луга (PEEP_LIT). */
function groveDraw(b,proj){
  if(!b.grove||!b.grove.length)return;
  ctx.save();ctx.globalCompositeOperation="lighter";
  for(const a of b.grove){
    const p=proj(a.x,a.y,a.z);if(!p)continue;
    /* proj отдаёт {x,y,z}: масштаб — фокус на глубину, как у камней */
    const sc=Math.min(W,H)*.95/p.z;
    const rr=Math.max(3,a.r*sc*1.35),al=(.22+.4*(a.gl||0))*clamp(1-p.z/2600,.1,1);
    const g=ctx.createRadialGradient(p.x,p.y,rr*.3,p.x,p.y,rr);
    g.addColorStop(0,"rgba(150,235,180,"+al.toFixed(3)+")");g.addColorStop(1,"rgba(150,235,180,0)");
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,rr,0,TAU);ctx.fill();
  }
  ctx.restore();
}
