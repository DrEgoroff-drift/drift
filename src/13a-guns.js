/* ══════════════ повадки семейств (M364, §2.1) ══════════════
   Числа делают ствол сильнее или слабее; повадка делает его ДРУГИМ. Здесь
   живёт то, чем именно стреляет каждое семейство, и то, что после выстрела
   остаётся на цели: жар, горение, толчок.

   Пять повадок этого прохода:
     bullet — снаряд, как было всегда (автопушка, тяжёлое, тепловик);
     rail   — мгновенный луч на всю дальность, пробивает насквозь, если первый
              корпус развалился от этого же выстрела;
     pellets— семь снарядов одним нажатием, разброс семейства;
     beam   — мгновенный луч по ПЕРВОМУ на пути, урон каждый выстрел, греет;
     homing — снаряд, который доворачивает к метке в полёте.

   Жар и горение — одна шкала на цель. Кинетика тепловика греет прямо; лазер
   греет лучом. За порогом цель загорается и горит сама, а перегретый пират
   перестаёт стрелять: это те самые «секунды без вас», ради которых §2.1 и
   заводит добивающую роль.

   Луч рисуется отдельным коротким следом (`G.beams`), а не выстрелом: у него
   нет полёта, и в общую петлю попаданий ему не надо. */
const HEAT_MAX=140;        /* выше не растёт */
const HEAT_STUN=95;        /* перегрев: цель перестаёт стрелять */
const HEAT_BURN=70;        /* порог, за которым цель загорается */
const HEAT_COOL=.16;       /* остывание за кадр */
const BURN_TIME=150;       /* сколько горит */
const BURN_DPS=.42;        /* урон горения за кадр */
const STUN_TIME=170;       /* сколько молчит перегретый */
const BEAM_LIFE=4;         /* кадров живёт след луча */
const RAY_R=19;            /* насколько близко к лучу надо быть, чтобы получить */

/* ── жар и то, что из него следует ── */
function heatAdd(o,n){
  if(!o||!n)return;
  o.heat=Math.min(HEAT_MAX,(o.heat||0)+n);
  if(o.heat>=HEAT_BURN&&!(o.burnT>0))o.burnT=BURN_TIME;
  if(o.heat>=HEAT_STUN){o.stunT=STUN_TIME;o.heat=HEAT_BURN;}
}
/* один такт жара для любого корабля: остывание, горение, молчание */
function heatTick(o,dt,dmgTo){
  if(!o)return;
  if(o.heat)o.heat=Math.max(0,o.heat-HEAT_COOL*dt);
  if(o.stunT>0)o.stunT=Math.max(0,o.stunT-dt);
  if(o.burnT>0){
    o.burnT=Math.max(0,o.burnT-dt);
    if(dmgTo)dmgTo(BURN_DPS*dt);
  }
}
/* ── кто на луче ──
   Возвращает цели в порядке удаления вдоль луча. Игрок сюда не попадает:
   лучевые стволы этого прохода есть только у него (пиратские сборки — M368). */
function rayHits(x,y,ang,range,skipIff){
  const cx=Math.cos(ang),cy=Math.sin(ang),out=[];
  for(const p of (G.pirates||[])){
    if(p.hull<=0||(skipIff&&p.iff))continue;
    const dx=p.x-x,dy=p.y-y;
    const t=dx*cx+dy*cy;
    if(t<0||t>range)continue;
    if(Math.abs(dx*cy-dy*cx)>RAY_R)continue;
    out.push({p,t});
  }
  out.sort((a,b)=>a.t-b.t);
  return out;
}
function beamAdd(x1,y1,x2,y2,col,w){
  if(!G.beams)G.beams=[];
  if(G.beams.length>24)G.beams.shift();
  G.beams.push({x1,y1,x2,y2,col,w:w||1.6,life:BEAM_LIFE});
}
function beamsTick(dt){
  if(!G.beams||!G.beams.length)return;
  for(let i=G.beams.length-1;i>=0;i--){
    G.beams[i].life-=dt;
    if(G.beams[i].life<=0)G.beams.splice(i,1);
  }
}
function beamsDraw(zx,zy,Z){
  if(!G.beams||!G.beams.length)return;
  ctx.save();ctx.lineCap="round";
  for(const b of G.beams){
    const a=clamp(b.life/BEAM_LIFE,0,1);
    ctx.globalAlpha=.85*a;ctx.strokeStyle=b.col;ctx.lineWidth=b.w*clamp(Z,.5,2);
    ctx.beginPath();ctx.moveTo(zx(b.x1),zy(b.y1));ctx.lineTo(zx(b.x2),zy(b.y2));ctx.stroke();
    ctx.globalAlpha=.26*a;ctx.lineWidth=b.w*2.6*clamp(Z,.5,2);
    ctx.stroke();
  }
  ctx.restore();
}
/* урон по цели от луча: тот же расчёт, что у попадания снаряда (13-combat),
   но без полёта — поэтому «выстрел» собирается на месте и сразу применяется */
function rayDamage(p,ang,g,dmg){
  const s={vx:Math.cos(ang),vy:Math.sin(ang),dmg,type:g.type,owner:"player",mine:true};
  return hitShip(p,s,dmg);
}
/* ── выстрел по повадке ──
   Возвращает true, если ствол действительно выстрелил (значит, пора считать
   откат и списывать энергию). `rnd` — источник случайности, чтобы набор мог
   подставить свой и получить повторимый прогон. */
function gunFireOnce(g,sh,tgt,ang,rnd){
  const R=rnd||Math.random;
  const fx=g.fx||"bullet";
  if(fx==="rail"){
    const hits=rayHits(sh.x,sh.y,ang,g.range,true);
    let left=1;                       /* один пробой: следующий корпус только если первый развалился */
    let far=g.range;
    for(const h of hits){
      const dead=rayDamage(h.p,ang,g,g.dmg);
      far=h.t;
      if(!dead||left--<=0)break;
    }
    beamAdd(sh.x,sh.y,sh.x+Math.cos(ang)*far,sh.y+Math.sin(ang)*far,"rgba(180,220,255,.95)",2);
    sfx("shot",{f:150,to:900,d:.22,v:.55});
    return true;
  }
  if(fx==="beam"){
    const hits=rayHits(sh.x,sh.y,ang,g.range,true);
    const h=hits[0];
    const far=h?h.t:g.range;
    if(h){
      rayDamage(h.p,ang,g,g.dmg);
      if(g.burn)heatAdd(h.p,g.burn*2.2);
    }
    beamAdd(sh.x,sh.y,sh.x+Math.cos(ang)*far,sh.y+Math.sin(ang)*far,"rgba(255,150,110,.9)",1.2);
    sfx("shot",{f:1300,to:1150,d:.06,v:.14});
    return true;
  }
  if(fx==="pellets"){
    const n=g.pellets||7;
    for(let i=0;i<n;i++){
      const err=gunMiss(g,tgt?Math.hypot(tgt.x-sh.x,tgt.y-sh.y):0,tgt?(tgt.av||0):0,R());
      fireShot(sh.x,sh.y,ang+err,g.speed,g.dmg,true,g.type,g.range);
    }
    sfx("shot",{f:230,to:120,d:.14,v:.5});
    return true;
  }
  const err=gunMiss(g,tgt?Math.hypot(tgt.x-sh.x,tgt.y-sh.y):0,tgt?(tgt.av||0):0,R());
  fireShot(sh.x,sh.y,ang+err,g.speed,g.dmg,true,g.type,g.range);
  const s=G.shots[G.shots.length-1];
  if(s){
    if(g.heat)s.heat=g.heat;
    if(g.knock)s.knock=g.knock;
    if(fx==="homing"&&tgt){s.hom=.17;s.tgt=tgt;}
  }
  return true;
}
/* доворот наводящейся пули: зовётся из петли выстрелов каждый кадр */
function homingStep(s,dt){
  if(!s.hom||!s.tgt||s.tgt.hull<=0)return;
  const sp=Math.hypot(s.vx,s.vy)||1;
  const want=Math.atan2(s.tgt.y-s.y,s.tgt.x-s.x);
  const cur=Math.atan2(s.vy,s.vx);
  const a=angWrap(cur+clamp(angDiff(want,cur),-s.hom*dt,s.hom*dt));
  s.vx=Math.cos(a)*sp;s.vy=Math.sin(a)*sp;
}
