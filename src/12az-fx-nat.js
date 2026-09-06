/* ══════════════ семья механик: ПРИРОДА (M384, §15.1) ══════════════
   Природа в этой игре не декорация: буря глушит приборы и уводит пикеты, рой
   бьёт того, кто стоит, истощение отнимает у пояса руду, а находка делает
   планету пригодной. Ни одно из этих происшествий не спрашивает игрока и не
   выбирает его специально — они случаются с областью, а он в ней оказался.

   Здесь же лежит единственное последствие этой семьи, которое БЬЁТ: рой. Он
   бьёт по правилу, которое видно заранее и от которого есть управа — «не стой».
   Это и есть разница между трудностью и подлостью. */
const NAT_STORM=12;        /* трое суток бури */
const NAT_SWARM=8;         /* двое суток роя */
const NAT_DRAIN=40;        /* десять суток истощения */
const NAT_FIND=20;         /* пять суток, пока находка на слуху */
const NAT_SWARM_DMG=.9;    /* урона за кадр тому, кто стоит */
const NAT_SWARM_SP=.35;    /* «стоит» — это медленнее трети хода */
function natInc(kind,span){return (typeof chronIncOf==="function")?chronIncOf(kind,span):null;}
function natMine(kind,span,sx,sy){
  const inc=natInc(kind,span);
  if(!inc||typeof chronOwner!=="function")return null;
  const o=chronOwner(sx===undefined?G.sx:sx,sy===undefined?G.sy:sy);
  return (o===inc.p)?inc:null;
}
/* ── буря ──
   «Вспышка: приборы врут, пикеты уходят, трое суток без боёв и карты». Врущие
   приборы у нас уже есть — это помеха (M368), и второй раз её изобретать не
   надо: буря ставит ту же метку. */
function natStormHere(sx,sy){return !!natMine("storm",NAT_STORM,sx,sy);}
function natStormTick(dt){
  if(!natStormHere())return false;
  /* помеха держится, пока держится буря: захват не берётся, наводка врёт */
  G.jamT=Math.max(G.jamT||0,30);
  return true;
}
/* пикеты уходят: в бурю в системе нет ни патруля, ни чужого боя */
function natNoPickets(){return natStormHere();}
/* ── рой ──
   Астероиды идут через систему. Достаётся тому, кто стоит: правило простое,
   видно заранее и лечится движением. */
function natSwarmHere(sx,sy){return !!natMine("swarm",NAT_SWARM,sx,sy);}
function natSwarmTick(dt){
  if(G.mode!=="system"||!natSwarmHere())return false;
  const sh=G.ship,st=stat();
  const sp=Math.hypot(sh.vx,sh.vy);
  if(sp>=(st.maxSp||6)*NAT_SWARM_SP)return false;
  G.hull=Math.max(0,G.hull-NAT_SWARM_DMG*dt);
  if((G.t|0)%90===0)say("РОЙ · НЕ СТОЙТЕ НА МЕСТЕ",90);
  if(G.hull<=0&&typeof wreck==="function")wreck();
  return true;
}
/* ── истощение ──
   Пояс держав, у которых оно объявлено, руды не даёт. Не «даёт меньше» —
   не даёт: это событие, а не цифра, и оно должно ощущаться как событие. */
function natDrainHere(sx,sy){return !!natMine("drain",NAT_DRAIN,sx,sy);}
function natOreMul(k,sx,sy){
  if(!natDrainHere(sx,sy))return 1;
  return (k==="iron"||k==="titan"||k==="crystal"||k==="ice")?0:1;
}
/* ── находка ──
   Планета с куполом становится пригодной: на поверхности этой системы берётся
   на четверть больше. Единственное доброе происшествие этой семьи. */
function natFindHere(sx,sy){return !!natMine("find",NAT_FIND,sx,sy);}
function natLandMul(){return natFindHere()?1.25:1;}
/* строка для доски и для эфира */
function natLine(){
  const out=[];
  if(natStormHere())out.push("ВСПЫШКА · ПРИБОРЫ ВРУТ, ПИКЕТЫ УШЛИ");
  if(natSwarmHere())out.push("РОЙ · БЬЁТ ТЕХ, КТО СТОИТ");
  if(natDrainHere())out.push("ИСТОЩЕНИЕ · ПОЯС ПУСТ");
  if(natFindHere())out.push("НАХОДКА · ПЛАНЕТА ПРИГОДНА, БЕРЁТСЯ БОЛЬШЕ");
  return out.join(" · ");
}
