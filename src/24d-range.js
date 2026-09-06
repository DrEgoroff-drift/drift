/* ══════════════ стрельбище (M363, §3.2) ══════════════
   У всякого причала есть списанная баржа-мишень. «Проверить» — это минута
   наружу и обратно: сборку не сравнивают в уме, её пробуют. Числа на карточке
   честны и без стрельбища, но ощущение — попадаю я или мажу, успевает ли
   турель за целью, хватает ли энергии на очередь — живёт только здесь.

   Мишень — обычная запись в `G.pirates` с признаком `dummy`: она не знает о
   вас, не стреляет, не разбирается на трофеи и не считается сбитой. Так весь
   бой уже написан, а стрельбище не заводит второго боевого цикла.

   Ничего не персистится: минута кончилась — корабль у причала, отчёт в журнале. */
const RANGE_SEC=60;
const RANGE_DIST=520;
function rangeOn(){return !!G.range;}
function rangeCanHere(){return !!(G.sys&&G.sys.station);}
function rangeTarget(){
  const S=G.sys.station,hp=1e7;
  const a=Math.atan2(G.ship.y-S.y,G.ship.x-S.x);
  return {x:S.x+Math.cos(a)*RANGE_DIST*1.7,y:S.y+Math.sin(a)*RANGE_DIST*1.7,
    vx:0,vy:0,a:a+Math.PI,hull:hp,hullMax:hp,name:"Мишень",rank:0,seed:4242,
    shipId:pirateShipId(4242),cool:1e9,aware:false,thrust:false,dummy:true,
    shield:0,shieldMax:0,shieldType:"solid",shieldHit:0};
}
function rangeStart(){
  if(!rangeCanHere()){say("Стрельбище есть только у причала");return false;}
  if(rangeOn())return false;
  const S=G.sys.station;
  if(typeof closeStation==="function"&&G.mode==="dock")closeStation();
  G.mode="system";G.ap=null;G.orbit=null;
  G.ship.x=S.x+RANGE_DIST*.4;G.ship.y=S.y+RANGE_DIST*.4;
  G.ship.vx=0;G.ship.vy=0;
  G.pirates=[];G.shots=[];G.marks=[];
  const t=rangeTarget();
  G.pirates.push(t);
  helmLock(t);
  G.hull=stat().hullMax;G.energy=stat().energyMax;
  G.range={left:RANGE_SEC*60,shots:0,hits:0,dmg:0,x:S.x,y:S.y};
  say("СТРЕЛЬБИЩЕ · МИНУТА\nмишень взята в захват\nчисла честные, ощущение — ваше",180);
  return true;
}
/* попадание в мишень считается здесь, чтобы петля боя ничего о стрельбище не знала */
function rangeHit(d){
  if(!G.range)return;
  G.range.hits++;G.range.dmg+=d;
}
function rangeShot(){if(G.range)G.range.shots++;}
function rangeTick(dt){
  const R=G.range;
  if(!R)return;
  R.left-=dt;
  const sec=Math.max(0,R.left/60);
  const hitPc=R.shots?Math.round(R.hits/R.shots*100):0;
  G.prompt="СТРЕЛЬБИЩЕ · "+sec.toFixed(0)+" с\nПОПАДАНИЙ "+R.hits+" ИЗ "+R.shots+
    " ("+hitPc+"%) · УРОН/С "+(R.dmg/Math.max(1,(RANGE_SEC*60-R.left)/60)).toFixed(1);
  if(R.left<=0)rangeEnd();
}
function rangeEnd(){
  const R=G.range;
  if(!R)return;
  const secs=Math.max(1,(RANGE_SEC*60-Math.max(0,R.left))/60);
  const hitPc=R.shots?Math.round(R.hits/R.shots*100):0;
  G.range=null;
  G.pirates=G.pirates.filter(p=>!p.dummy);
  G.shots=[];G.marks=[];
  logAdd("kill","Стрельбище: попаданий "+R.hits+" из "+R.shots+" ("+hitPc+"%) · урон/с "+
    (R.dmg/secs).toFixed(1));
  G.hull=stat().hullMax;
  if(typeof openStation==="function"&&G.sys&&G.sys.station){
    const S=G.sys.station;
    G.ship.x=S.x;G.ship.y=S.y;G.ship.vx=S.vx||0;G.ship.vy=S.vy||0;
    openStation();
  }
  say("СТРЕЛЬБИЩЕ ЗАКРЫТО\nпопаданий "+hitPc+"%\nурон/с "+(R.dmg/secs).toFixed(1),180);
}
