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
/* ── M365 ── */
const MINE_LIFE=3600;      /* минута жизни мины */
const MINE_R=95;           /* радиус, в котором она срабатывает */
const SHIELD_OFF=120;      /* две секунды без поля от импульсника */
const JAM_R=600;           /* радиус помехи */
const JAM_TIME=90;         /* сколько держится ослепление после последнего такта */
const SHOVE_V=1.9;         /* толчок волны */
const DRILL_EAT=.06;       /* железа за выстрел бурового луча */

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
  if(fx==="needles")return needleShot(g,sh,tgt,ang,R);
  if(fx==="mortar")return mineLay(g,sh);
  if(fx==="jam")return jamPulse(g,sh);
  if(fx==="shove"){
    /* волна без урона: расталкивает всё в конусе — корабли и чужие снаряды */
    const cx=Math.cos(ang),cy=Math.sin(ang);
    const inCone=(dx,dy)=>{
      const d=Math.hypot(dx,dy);
      return d<g.range&&d>1&&(dx*cx+dy*cy)/d>Math.cos(Math.min(Math.PI,g.cone));
    };
    for(const p of (G.pirates||[])){
      if(p.hull<=0||p.dummy)continue;
      const dx=p.x-sh.x,dy=p.y-sh.y;
      if(!inCone(dx,dy))continue;
      const d=Math.hypot(dx,dy)||1;
      const k=clamp(1-d/g.range,.2,1);
      p.vx+=dx/d*SHOVE_V*k;p.vy+=dy/d*SHOVE_V*k;
    }
    for(const s2 of (G.shots||[])){
      if(s2.owner==="player")continue;
      const dx=s2.x-sh.x,dy=s2.y-sh.y;
      if(!inCone(dx,dy))continue;
      const d=Math.hypot(dx,dy)||1;
      s2.vx+=dx/d*SHOVE_V*2;s2.vy+=dy/d*SHOVE_V*2;
    }
    beamAdd(sh.x+cx*40,sh.y+cy*40,sh.x+cx*g.range,sh.y+cy*g.range,"rgba(150,200,230,.55)",5);
    sfx("ui",{f:90,to:260,d:.18,v:.3});
    return true;
  }
  if(fx==="siphon"||fx==="pulse"||fx==="drillbeam"){
    const hits=rayHits(sh.x,sh.y,ang,g.range,true);
    const h=hits[0];
    const far=h?h.t:g.range;
    const col=fx==="siphon"?"rgba(159,216,255,.85)":(fx==="pulse"?"rgba(210,190,255,.9)":"rgba(255,220,140,.9)");
    if(fx==="drillbeam"){
      /* буровой ест руду, а не энергию: без руды он просто не включается */
      const have=(G.cargo&&G.cargo.iron)||0;
      if(have<DRILL_EAT){say("БУРОВОМУ НУЖНА ПОРОДА В ТРЮМЕ",50);return false;}
      G.cargo.iron=Math.max(0,have-DRILL_EAT);
    }
    if(h){
      const p=h.p;
      if(fx==="siphon"){
        /* поле перетекает: сколько сняли — столько и прибавилось, не выше своего потолка */
        const st=stat();
        const take=Math.min(p.shield||0,2.2);
        p.shield=Math.max(0,(p.shield||0)-take);
        p.shieldHit=SHIELD_DELAY;
        G.shield=Math.min(st.shieldMax,G.shield+take);
      }else if(fx==="pulse"){
        /* поле гаснет на две секунды и может выбить узел: обратная сторона instrKnock */
        p.shieldOff=SHIELD_OFF;p.shield=0;p.shieldHit=SHIELD_DELAY;
        if(Math.random()<.35)p.stunT=Math.max(p.stunT||0,STUN_TIME*.6);
        if(g.dmg>0)rayDamage(p,ang,g,g.dmg);
      }else{
        /* буровому поле безразлично: он режет корпус напрямую */
        p.hull-=g.dmg;
        if(p.dummy&&typeof rangeHit==="function")rangeHit(g.dmg);
        if(p.hull<=0)killPirate(p);
      }
    }
    beamAdd(sh.x,sh.y,sh.x+Math.cos(ang)*far,sh.y+Math.sin(ang)*far,col,fx==="drillbeam"?2.2:1.4);
    sfx("shot",{f:fx==="pulse"?520:1050,to:fx==="pulse"?180:900,d:.1,v:.16});
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
/* ── иглы (M365) ──
   Часть игл проходит поле насквозь и садится прямо в корпус, часть вязнет
   в нём. По голому корпусу игольник почти бесполезен — и это его цена. */
function needleShot(g,sh,tgt,ang,R){
  const n=g.needles||5;
  for(let i=0;i<n;i++){
    const err=gunMiss(g,tgt?Math.hypot(tgt.x-sh.x,tgt.y-sh.y):0,tgt?(tgt.av||0):0,R());
    fireShot(sh.x,sh.y,ang+err,g.speed,g.dmg,true,g.type,g.range);
    const s=G.shots[G.shots.length-1];
    if(s){s.pass=(R()<(g.pass||.45))?1:0;s.needle=1;}
  }
  sfx("shot",{f:1500,to:1700,d:.05,v:.12});
  return true;
}
/* ── мина (M365) ──
   Единственный ствол, которому не нужна метка: кладёт заряд за кормой, и тот
   ждёт минуту. Своих не трогает — подрываться на своей же мине было бы
   шуткой, а не механикой. */
function mineLay(g,sh){
  if(!G.gmines)G.gmines=[];
  if(G.gmines.length>=8)G.gmines.shift();
  const a=sh.a+Math.PI;
  G.gmines.push({x:sh.x+Math.cos(a)*26,y:sh.y+Math.sin(a)*26,
    vx:sh.vx*.3,vy:sh.vy*.3,dmg:g.dmg,type:g.type,life:MINE_LIFE,arm:60});
  sfx("shot",{f:190,to:110,d:.2,v:.35});
  return true;
}
function minesTick(dt){
  const L=G.gmines;
  if(!L||!L.length)return;
  for(let i=L.length-1;i>=0;i--){
    const m=L[i];
    m.x+=m.vx*dt;m.y+=m.vy*dt;m.vx*=.985;m.vy*=.985;
    m.life-=dt;if(m.arm>0)m.arm-=dt;
    if(m.life<=0){L.splice(i,1);continue;}
    if(m.arm>0)continue;
    let near=false;
    for(const p of (G.pirates||[])){
      if(p.hull<=0||p.iff||p.dummy)continue;
      if(Math.hypot(p.x-m.x,p.y-m.y)<MINE_R){near=true;break;}
    }
    if(!near)continue;
    /* фугас: достаётся всем в радиусе, а не одному */
    for(const p of (G.pirates||[])){
      if(p.hull<=0||p.iff||p.dummy)continue;
      const d=Math.hypot(p.x-m.x,p.y-m.y);
      if(d>MINE_R*1.6)continue;
      const k=clamp(1-d/(MINE_R*1.6),.25,1);
      const ang=Math.atan2(p.y-m.y,p.x-m.x);
      hitShip(p,{vx:Math.cos(ang),vy:Math.sin(ang),type:m.type,owner:"player",mine:true},m.dmg*k);
    }
    beamAdd(m.x-MINE_R*.6,m.y,m.x+MINE_R*.6,m.y,"rgba(255,190,110,.9)",4);
    beamAdd(m.x,m.y-MINE_R*.6,m.x,m.y+MINE_R*.6,"rgba(255,190,110,.9)",4);
    sfx("boom",{v:.5});
    L.splice(i,1);
  }
}
function minesDraw(zx,zy,Z){
  const L=G.gmines;
  if(!L||!L.length)return;
  ctx.save();
  for(const m of L){
    const x=zx(m.x),y=zy(m.y);
    if(x<-40||x>W+40||y<-40||y>H+40)continue;
    const on=m.arm<=0;
    ctx.globalAlpha=on?(.55+.35*Math.abs(Math.sin(G.t*.16))):.3;
    ctx.fillStyle=on?"#ffb25c":"#8fa0b0";
    ctx.beginPath();ctx.arc(x,y,3.2*clamp(Z,.5,1.8),0,TAU);ctx.fill();
    ctx.globalAlpha=.16;ctx.strokeStyle="#ffb25c";ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(x,y,MINE_R*Z,0,TAU);ctx.stroke();
  }
  ctx.restore();
}
/* ── помеха (M365) ──
   Не стреляет: держит вокруг вас круг, в котором чужие теряют вас из виду и
   половину времени бьют мимо. Ствол для того, кто не хочет драться. */
function jamPulse(g,sh){
  let n=0;
  for(const p of (G.pirates||[])){
    if(p.hull<=0||p.iff||p.dummy)continue;
    if(Math.hypot(p.x-sh.x,p.y-sh.y)>JAM_R)continue;
    p.jamT=JAM_TIME;p.aware=false;n++;
  }
  if(n)sfx("ui",{f:220,to:180,d:.12,v:.1});
  return true;
}
function homingStep(s,dt){
  if(!s.hom||!s.tgt||s.tgt.hull<=0)return;
  const sp=Math.hypot(s.vx,s.vy)||1;
  const want=Math.atan2(s.tgt.y-s.y,s.tgt.x-s.x);
  const cur=Math.atan2(s.vy,s.vx);
  const a=angWrap(cur+clamp(angDiff(want,cur),-s.hom*dt,s.hom*dt));
  s.vx=Math.cos(a)*sp;s.vy=Math.sin(a)*sp;
}
