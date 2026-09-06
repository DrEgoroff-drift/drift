/* ══════════════ война, которую видно (M372, §7.4) ══════════════
   Летопись знает, чья это система и идёт ли по ней фронт. Здесь это становится
   тем, что игрок ВИДИТ, прыгнув сюда: в тылу стоит пикет хозяина, а на фронте
   уже идёт бой — чужой бой, в котором игрока никто не ждал.

   Правило кадра: бой спавнится НА ВХОДЕ и не возобновляется (D01) — иначе
   спрятанная вкладка или переведённые часы дают скачок войны прямо в кадре.
   Потолок восьми вооружённых на систему тот же, что у пиратов (§5).

   Стороны стреляют друг в друга общей петлёй боя (M361): у выстрела есть
   хозяин, и петля разрешает каждую пару. Игрок в этой паре не участвует —
   пока он не выстрелит сам, но это уже четыре правила (M373). */
const NPC_PICKET=2;                 /* сколько стоит в тылу */
const NPC_BATTLE=8;                 /* потолок вооружённых в системе */
function npcPowerHere(){
  if(typeof chronOwnerKey!=="function")return null;
  return chronOwnerKey(G.sx,G.sy);
}
/* ── один корабль державы ──
   Корпус берётся тем же генератором, что у всех: запись в `NPC_SHIPS` с `by`
   державы, значит порода читается силуэтом (M369). Роль и ранг — пиратские:
   поведение уже написано, и переписывать его ради флага незачем. */
function npcShip(by,i,rank,x,y,friend){
  const seed=hashi(G.sx*73+G.sy,i*911+7,0x0DEF);
  const id="np"+by+seed;
  if(!NPC_SHIPS[id])NPC_SHIPS[id]={name:id,seed,hcls:(rank>=2?"warship":"courier"),
    col:(typeof powerOf==="function")?powerOf(by).col:"#c9c9d4",
    hull:120,cargo:40,fuel:120,thr:1,cls:"патруль",by};
  const danger=sysDanger(G.sx,G.sy);
  const hp=(30+danger*70)*(1+rank*.6);
  return {x,y,vx:0,vy:0,a:Math.atan2(-y,-x),
    hull:hp,hullMax:hp,name:(typeof powerOf==="function"?powerOf(by).ru:by)+" "+(100+(seed%900)),
    rank,seed,shipId:id,cool:0,aware:true,thrust:false,
    owner:by,pw:by,iff:friend?1:0,
    shield:hp*.4,shieldMax:hp*.4,shieldHit:0,
    shieldType:(typeof PIRATE_LOADOUT!=="undefined"&&PIRATE_LOADOUT[rank])
      ?(PIRATE_LOADOUT[rank].shield||"solid"):"solid"};
}
/* ── что стоит в системе ──
   Тыл: пикет хозяина у точки прыжка, мирный. Фронт: два крыла, и они дерутся
   между собой. Игрока не трогает ни то, ни другое: он гражданский борт под
   своим флагом, пока не сделает того, о чём говорят четыре правила. */
function npcSpawn(){
  if(typeof chronOwner!=="function")return;
  /* «Ревизия» (M380): если она в этой области, она здесь и она главная */
  if(typeof bossHere==="function"&&bossHere()&&typeof bossShip==="function"){
    const B=bossShip();
    if(B){
      const hp=Math.max(1,B.A.hull);
      G.pirates.push({x:1800,y:0,vx:0,vy:0,a:Math.PI,
        hull:hp,hullMax:BOSS_HULL,name:"«Ревизия»",rank:3,seed:0x0E7151,
        shipId:B.id,cool:0,aware:true,thrust:false,boss:1,
        shield:BOSS_SHIELD,shieldMax:BOSS_SHIELD,shieldHit:0,shieldType:"pulse"});
      say(bossLine(),200);
      if(typeof etherLine==="function")
        etherLine("…внимание всем бортам. В районе работает «Ревизия». Восстановление плана.","эфир");
    }
  }
  if(typeof yaltaHere==="function"&&yaltaHere()){npcYalta();return;}
  const own=chronOwner(G.sx,G.sy);
  if(own<0)return;
  const by=MAKER_KEYS[own];
  const front=chronFront(G.sx,G.sy);
  const armed=()=>(G.pirates||[]).filter(p=>p.hull>0).length;
  const r=rng(hashi(G.sx,G.sy,0x0B47));
  if(!front){
    /* тыл: два-три корабля у точки прыжка, стоят и смотрят */
    const n=Math.min(NPC_PICKET+((r()<.4)?1:0),Math.max(0,NPC_BATTLE-armed()));
    for(let i=0;i<n;i++){
      const a=r()*TAU,rad=1500+r()*900;
      const p=npcShip(by,i,1,Math.cos(a)*rad,Math.sin(a)*rad,1);
      p.aware=false;
      G.pirates.push(p);
    }
    return;
  }
  /* фронт: хозяин против того, с кем он воюет. Обе стороны уже здесь, и бой
     идёт сам — игрок в него входит зрителем */
  let foe=-1;
  for(const w of chronWars()){
    if(w.a===own){foe=w.b;break;}
    if(w.b===own){foe=w.a;break;}
  }
  if(foe<0)return;
  const fby=MAKER_KEYS[foe];
  const room=Math.max(0,NPC_BATTLE-armed());
  const nA=Math.min(3+((r()<.5)?1:0),room);
  const nB=Math.min(3+((r()<.5)?1:0),Math.max(0,room-nA));
  for(let i=0;i<nA;i++){
    const a=r()*TAU,rad=700+r()*700;
    G.pirates.push(npcShip(by,i,i?1:2,Math.cos(a)*rad,Math.sin(a)*rad,1));
  }
  for(let i=0;i<nB;i++){
    const a=r()*TAU,rad=700+r()*700;
    G.pirates.push(npcShip(fby,10+i,i?1:2,Math.cos(a)*rad+400,Math.sin(a)*rad+400,1));
  }
  if(nA&&nB){
    say("ЗДЕСЬ БОЙ · ВЫ НЕ ЗВАНЫ",120);
    if(typeof etherLine==="function"&&typeof powerOf==="function")
      etherLine("…"+powerOf(by).ru+" и "+powerOf(fby).ru+" в этом секторе. Гражданским уйти с линии.","эфир");
  }
}
/* ── «Ялта» (M372, §16.6) ──
   Шесть посольств на рейде, шесть волн разом, ярмарка. Никто не стреляет:
   оружие опечатано ещё в M369, здесь только те, кто стоит на якоре. */
function npcYalta(){
  const r=rng(hashi(G.sx,G.sy,0x1A17));
  for(let i=0;i<6;i++){
    const by=MAKER_KEYS[i];
    const a=(i/6)*TAU+r()*.2,rad=1200+r()*500;
    const p=npcShip(by,20+i,0,Math.cos(a)*rad,Math.sin(a)*rad,1);
    p.aware=false;p.envoy=1;p.name="посольство "+((typeof powerOf==="function")?powerOf(by).ru:by);
    p.vx=0;p.vy=0;
    G.pirates.push(p);
  }
}
/* ── обломок после боя (M372 → §19.3) ──
   Кто-то из них погибнет и без вас. Корпус остаётся висеть, и его можно взять
   на трос — тот же путь, что у чёрного дерелика (M369b). */
function npcWreck(p){
  if(!p||!p.pw)return;
  if(!G.npcWrecks)G.npcWrecks=[];
  if(G.npcWrecks.length>=4)return;
  /* обломок остаётся, даже если у вас уже есть буксир: экипаж с него можно
     снять и без троса (M375) */
  G.npcWrecks.push({x:p.x,y:p.y,seed:p.seed>>>0,by:p.pw,crew:1});
  if(typeof etherLine==="function")
    etherLine("…сигнал с обломка. Автомат, голоса нет.","сигнал");
}
/* ── спасатель (M375, §6.4) ──
   После чужого боя остаются корпуса и подбитые. Тот, кто тащит, заправляет и
   снимает людей, НЕЙТРАЛЕН обеим сторонам по определению — и это единственный
   способ заработать эпизоды сразу у двоих. Здесь же и вся выгода: не награда,
   а два человека, которые вас теперь знают.

   Свидетель тут особый: обломок ничего не расскажет, зато расскажет снятый
   экипаж и док, куда пришёл корпус. Поэтому эпизод пишется принудительно —
   это не дыра в правиле, а его вторая половина. */
function npcRescue(sh,actEdge,cel){
  /* подбитый живой борт: ему нужно топливо, и это самое дешёвое доброе дело */
  let hurt=null,hd=320;
  for(const p of (G.pirates||[])){
    if(p.hull<=0||!p.pw||p.envoy)continue;
    if(p.hull>p.hullMax*.35)continue;
    const d=Math.hypot(sh.x-p.x,sh.y-p.y);
    if(d<hd){hd=d;hurt=p;}
  }
  if(hurt){
    const P=(typeof powerOf==="function")?powerOf(hurt.pw):null;
    G.prompt="ПОДБИТЫЙ БОРТ · "+(P?P.ru.toUpperCase():"")+"\n"+
      "ДЕЙСТВИЕ — ПОДЕЛИТЬСЯ ТОПЛИВОМ";
    if(actEdge){
      const st=stat();
      const give=Math.min(G.fuel,st.fuelMax*.15);
      if(give<=1){say("НЕЧЕМ ДЕЛИТЬСЯ",90);return true;}
      G.fuel-=give;
      hurt.hull=Math.min(hurt.hullMax,hurt.hull+hurt.hullMax*.15);
      say("ОТДАНО ТОПЛИВО · "+Math.round(give),120);
      if(typeof epiAdd==="function")epiAdd("fuel",hurt.pw,{force:1});
      if(typeof warPut==="function")warPut("fuel",1);
    }
    return true;
  }
  const wk=npcWreckNear(sh);
  if(!wk)return false;
  const P=(typeof powerOf==="function")?powerOf(wk.by):null;
  G.prompt="КОРПУС ПОСЛЕ БОЯ · "+(P?P.ru.toUpperCase():"")+"\n"+
    (G.tow?"У ВАС УЖЕ ЕСТЬ БУКСИР · ":"ДЕЙСТВИЕ — ВЗЯТЬ НА БУКСИР · ")+
    (wk.crew?"ЦЕЛЬ — СНЯТЬ ЭКИПАЖ":"ЭКИПАЖ СНЯТ");
  if(actEdge&&!G.tow){
    G.tow={seed:wk.seed,by:wk.by,sx:G.sx,sy:G.sy};
    G.npcWrecks=G.npcWrecks.filter(w=>w!==wk);
    say("КОРПУС НА ТРОСЕ · В ДОК",120);
    logAdd("tech","Корпус после боя взят на буксир · сектор "+G.sx+":"+G.sy);
    if(typeof epiAdd==="function")epiAdd("tow",wk.by,{force:1});
    if(typeof warPut==="function")warPut("tow",1);
  }
  return true;
}
/* снять экипаж — второй ответ, на той же кнопке, что «по делу» в окликах */
function npcCrewOff(sh){
  const wk=npcWreckNear(sh||G.ship);
  if(!wk||!wk.crew)return false;
  wk.crew=0;
  const P=(typeof powerOf==="function")?powerOf(wk.by):null;
  say("ЭКИПАЖ СНЯТ · "+(P?P.ru.toUpperCase():""),140);
  logAdd("kill","Снят экипаж с обломка "+(P?P.ru:"")+" · сектор "+G.sx+":"+G.sy);
  if(typeof epiAdd==="function")epiAdd("distress",wk.by,{force:1});
  if(typeof warPut==="function")warPut("crew",1);
  return true;
}
function npcWreckNear(sh){
  if(!G.npcWrecks||!G.npcWrecks.length)return null;
  let best=null,bd=260;
  for(const w of G.npcWrecks){
    const d=Math.hypot(sh.x-w.x,sh.y-w.y);
    if(d<bd){bd=d;best=w;}
  }
  return best;
}
function npcWreckDraw(zx,zy,Z){
  if(!G.npcWrecks)return;
  for(const w of G.npcWrecks){
    const x=zx(w.x),y=zy(w.y);
    if(x<-40||x>W+40||y<-40||y>H+40)continue;
    ctx.strokeStyle="rgba(150,160,175,.75)";ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(x,y,7*clamp(Z,.5,2),0,TAU);ctx.stroke();
    ctx.fillStyle="rgba(40,46,54,.9)";ctx.fill();
    ctx.fillStyle="rgba(200,210,220,.5)";
    ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
    ctx.fillText("КОРПУС",x,y-11*clamp(Z,.5,2));
  }
}
