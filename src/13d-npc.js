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
  if(!p||!p.pw||G.tow)return;
  if(!G.npcWrecks)G.npcWrecks=[];
  if(G.npcWrecks.length>=3)return;
  G.npcWrecks.push({x:p.x,y:p.y,seed:p.seed>>>0,by:p.pw});
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
