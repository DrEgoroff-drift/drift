/* ══════════════ бой: выстрелы с владельцем (M361) ══════════════
   У выстрела есть хозяин: player | pirate | fleet | power:k (позже). Одна петля
   разрешает каждую пару «выстрел — корпус», чей бы он ни был: пираты попадают
   друг в друга, если у них разные хозяева (дезертиры, ренегат), флот бьёт
   пиратов, батарея с грунта живёт своим лучом (21d). `s.mine` остаётся как
   краткое «это выстрел игрока» — для рисования и баржи (12l).

   Место попадания (§4): в корму — ×1.6, в лоб — ×.7, по углу между ходом
   выстрела и носом цели. Так корма стоит того, чтобы за неё заходить, — и это
   же правило бьёт и по игроку. */
const HIT_REAR=1.6,HIT_FRONT=.7;
const ARMED_CAP=8;   /* вооружённых кораблей в системе, кроме своих (§5) */
function ownerOf(mine){return mine===true?"player":(mine===false||mine==null?"pirate":mine);}
function fireShot(x,y,ang,speed,dmg,mine,type,range){
  const owner=ownerOf(mine);
  /* тип урона и дальность — часть выстрела (M362): снаряд умирает за
     дальностью своего ствола, а не по общему сроку в 150 кадров */
  const life=range?Math.max(12,Math.round(range/Math.max(.5,speed))):150;
  G.shots.push({x,y,vx:Math.cos(ang)*speed,vy:Math.sin(ang)*speed,dmg,owner,
    type:type||"kin",mine:owner==="player",life});
  if(owner==="player"&&typeof rangeShot==="function")rangeShot();
  /* тембр своего выстрела берём из установленной пушки: у каждой части свой seed,
     значит разные орудия звучат по-разному сами собой, без отдельного контента */
  if(owner==="player"){
    const g=fittedParts().filter(p=>p.kind==="gun")[0];
    const f=g?420+(g.seed%9)*90:620;
    sfx("shot",{f,v:.5});
  }else if(owner==="fleet")sfx("shot",{f:520,v:.22});
  else sfx("shot",{f:300,v:.3});
}
/* множитель по месту: откуда прилетело относительно носа цели */
function hitLocMul(s,tgt){
  const d=Math.abs(angDiff(Math.atan2(s.vy,s.vx),tgt.a));
  return d<Math.PI/3?HIT_REAR:(d>Math.PI*2/3?HIT_FRONT:1);
}
/* попадание по игроку: щит первым, затем корпус; звук говорит, что пробили */
function playerHit(s){
  let d=s.dmg*hitLocMul(s,G.ship);
  const st=stat();
  G.shieldHit=SHIELD_DELAY;      /* поле растёт через паузу после попадания (M362) */
  /* игла, прошедшая поле (M365/M368), садится в корпус и у вас: правило одно
     на обе стороны, иначе игольник шакала — не игольник */
  if(G.shield>0&&!s.pass){
    /* по щиту урон идёт СВОИМ типом, и лобовое поле держит лоб вдвое,
       а корму не держит вовсе (§4). Что щит не удержал — уходит в корпус
       уже по корпусному множителю того же типа. */
    const face=shieldFace(st.shieldType,angDiff(Math.atan2(s.vy,s.vx),G.ship.a));
    if(face>0){
      const want=d*dmgMul(s.type,true)/face;
      const a=Math.min(G.shield,want);
      G.shield-=a;
      d=Math.max(0,d-a*face/Math.max(1e-6,dmgMul(s.type,true)));
      sfx("ui",{f:1250,to:700,d:.12,v:.28});
    }
  }
  d*=dmgMul(s.type,false);
  if(d>0){
    sfx("hit",{v:.55});
    G.hull=Math.max(0,G.hull-d);
    if(typeof hitFx==="function")hitFx(Math.min(1,.5+d/40));   /* объектив разъезжается (M325) */
    if(G.hull<=0){wreck();return true;}
    if(typeof instrKnock==="function")instrKnock();   // попадание может выбить гнездо прибора (хвост M127)
  }
  return false;
}
/* пират разбит не игроком: награды нет, только строка; особые (ренегат, охотник,
   соперник) уходят своими выходами, как и от вашего выстрела */
function pirateFellTo(p,owner){
  if(p.rogue||p.hunter||p.rival){killPirate(p);return;}
  parrotHeardKill(p);
  sfx("boom",{v:.6});
  const who=owner==="fleet"?"огнём ГЛАВТРАССЫ":"чужим огнём";
  logAdd("kill","«"+p.name+"» разбит "+who+" · награды нет");
}
/* ── одно попадание по чужому кораблю (M364) ──
   Раньше этот расчёт жил внутри петли выстрелов; лучевым стволам он нужен без
   всякого полёта, поэтому вынесен отдельно. Возвращает true, если корпус
   развалился — рельсе это нужно, чтобы решить, пробивать ли дальше. */
function hitShip(p,s,rawDmg){
  let d=(rawDmg!==undefined?rawDmg:s.dmg)*hitLocMul(s,p);
  /* у пирата от ранга бывает своё поле, и его повадка та же (M362):
     лобового бьют в корму, импульсного — быстрее, чем он собирается */
  p.shieldHit=SHIELD_DELAY;
  /* игла, прошедшая поле (M365), садится прямо в корпус: поле её не видит */
  if(p.shield>0&&!s.pass){
    const face=shieldFace(p.shieldType,angDiff(Math.atan2(s.vy,s.vx),p.a));
    if(face>0){
      const want=d*dmgMul(s.type,true)/face;
      const a=Math.min(p.shield,want);
      p.shield-=a;
      d=Math.max(0,d-a*face/Math.max(1e-6,dmgMul(s.type,true)));
    }
  }
  const done=d*dmgMul(s.type,false);
  p.hull-=done;
  /* жар и толчок — то, что остаётся на цели после выстрела (13a-guns) */
  if(s.heat&&typeof heatAdd==="function")heatAdd(p,s.heat*done*.5);
  if(s.knock){
    const sp=Math.hypot(s.vx,s.vy)||1;
    p.vx+=s.vx/sp*s.knock*.5;p.vy+=s.vy/sp*s.knock*.5;
  }
  if(p.dummy&&s.owner==="player"&&typeof rangeHit==="function")rangeHit(done);
  sfx("hit",{v:.3});
  if(p.hull<=0){
    if(s.owner==="player")killPirate(p);else pirateFellTo(p,s.owner);
    return true;
  }
  return false;
}
/* одна петля на все выстрелы; возвращает true, если игрок погиб */
function combatShots(dt){
  const sh=G.ship;
  for(let i=G.shots.length-1;i>=0;i--){
    const s=G.shots[i];
    if(s.hom&&typeof homingStep==="function")homingStep(s,dt);   /* наводящаяся пуля (M364) */
    s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;
    /* кассета раскрывается на полпути (M366): один снаряд становится пятью,
       и в точку он уже не попадёт, а в свору попадёт всегда */
    if(s.split>0){
      s.split-=Math.hypot(s.vx,s.vy)*dt;
      if(s.split<=0){
        const sp=Math.hypot(s.vx,s.vy)||1,a0=Math.atan2(s.vy,s.vx);
        const n=s.parts||5,wide=(s.gspread||.06)*6;
        for(let k=0;k<n;k++){
          const a=a0+(k/(n-1)-.5)*wide;
          G.shots.push({x:s.x,y:s.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,
            dmg:s.dmg,owner:s.owner,type:s.type,mine:s.mine,life:Math.max(12,s.life)});
        }
        G.shots.splice(i,1);
        continue;
      }
    }    let gone=s.life<=0;
    if(!gone&&s.owner!=="player"&&s.owner!=="fleet"&&Math.hypot(s.x-sh.x,s.y-sh.y)<18){
      gone=true;
      if(playerHit(s))return true;
    }
    if(!gone){
      for(const p of G.pirates){
        if((p.owner||"pirate")===s.owner||p.hull<=0)continue;
        if(Math.hypot(s.x-p.x,s.y-p.y)<20){
          gone=true;
          hitShip(p,s);
          /* плазма бьёт по площади и сбивает наводку тому, кто рядом (M366) */
          if(s.splash>0){
            for(const q of G.pirates){
              if(q===p||q.hull<=0||q.iff||q.dummy)continue;
              const d=Math.hypot(q.x-s.x,q.y-s.y);
              if(d>s.splash)continue;
              const k=clamp(1-d/s.splash,.2,1);
              const a=Math.atan2(q.y-s.y,q.x-s.x);
              hitShip(q,{vx:Math.cos(a),vy:Math.sin(a),type:s.type,owner:s.owner,mine:s.mine},s.dmg*k*.6);
            }
            p.leadBreak=LEADBREAK;
          }
          break;
        }
      }
    }
    /* ваш выстрел мог прийтись и по барже — так её добивают самому (12l) */
    if(!gone&&s.mine&&typeof bargeMineHit==="function"&&bargeMineHit(s))gone=true;
    if(gone)G.shots.splice(i,1);
  }
  return false;
}
/* ── флот в конвое стреляет (M361) ──
   Конвой ГЛАВТРАССЫ (M311) делал пиратов слепыми к вам; теперь корабли линии
   ещё и отвечают тем, кто подошёл к каравану на девятьсот. Их выстрелы — свои,
   награды за сбитых ими нет. Откат — по индексу корабля в списке системы. */
const FLEET_COOL={};
function fleetFire(dt){
  if(typeof fleetHere!=="function"||typeof fleetEscortActive!=="function"||!fleetEscortActive())return;
  const list=fleetHere(G.sys);
  for(let i=0;i<list.length;i++){
    const f=list[i];if(f.still)continue;
    const pos=fleetPos(f);
    const key=G.sx+","+G.sy+":"+i;
    if((FLEET_COOL[key]||0)>G.t)continue;
    let best=null,bd=900;
    for(const p of G.pirates){if(p.hull<=0)continue;const d=Math.hypot(p.x-pos.x,p.y-pos.y);if(d<bd){bd=d;best=p;}}
    if(!best)continue;
    const ang=Math.atan2(best.y-pos.y,best.x-pos.x);
    fireShot(pos.x,pos.y,ang,8,6,"fleet");
    FLEET_COOL[key]=G.t+55;
  }
}
/* сколько вооружённых чужих в системе — потолок §5 */
function armedCount(){return G.pirates.filter(p=>p.hull>0).length;}
