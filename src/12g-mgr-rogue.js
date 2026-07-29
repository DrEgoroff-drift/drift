/* ══════════════ ушедший управляющий: ренегат ══════════════ */
/* Управляющий не ломается по корпусу — он уходит. И уходит не в пустоту:
   забирает флагман, забирает тех наёмников, кого считает своими, и садится
   в соседнем секторе как собственная маленькая фракция.

   Смысл в том, что это единственный по-настоящему сильный противник поздней
   игры, которого игрок вырастил сам: он летит на вашем корпусе, дерётся с
   вашими перками и знает то, чему вы его научили. Разбить его можно — корпус
   вернётся, а сам он останется в мире и однажды снова пойдёт наниматься,
   дёшево и ненавидя вас ровно столько, сколько помнит. */
const ROGUE_CAP=3;                       // больше трёх — уже не сюжет, а список

/* Куда он ушёл: близко, чтобы можно было долететь, но не в текущий сектор —
   иначе он свалился бы на голову в ту же секунду. */
function rogueSector(m){
  const r=rng(hashi(m.seed,0x60E,5));
  for(let i=0;i<40;i++){
    const sx=G.sx+Math.round((r()*2-1)*4), sy=G.sy+Math.round((r()*2-1)*4);
    if((sx!==G.sx||sy!==G.sy)&&starAt(sx,sy))return {sx,sy};
  }
  return {sx:G.sx+3,sy:G.sy+2};
}
/* Он уводит своих: наёмников, которые сейчас в рейсе под его началом.
   Командир уводит звено, остальные — никого: чужих людей не забирают. */
function rogueTakesCrew(m){
  if(m.role!=="cmd"||!G.crew.length)return [];
  const mine=G.crew.filter(c=>c.shipId&&c.order&&c.order.kind!=="home");
  const took=mine.slice(0,Math.max(1,Math.floor(mine.length*.6)));
  for(const c of took){
    const i=G.crew.indexOf(c);
    if(i>=0)G.crew.splice(i,1);
    if(c.shipId&&c.shipId!==G.shipId)delete G.owned[c.shipId];
  }
  return took.map(c=>c.name);
}
/* Запись ренегата — не ссылка на управляющего, а слепок: он больше не в G.mgrs,
   и всё, что о нём нужно знать бою и карте, лежит здесь. */
function rogueFrom(m,why){
  const lv=mgrLevel(m);
  const S=m.shipId?shipData(m.shipId):null;
  const crew=rogueTakesCrew(m);
  const place=rogueSector(m);
  /* перки — не украшение: за каждый он бьёт чуть больнее и держит чуть дольше */
  const grit=1+m.perks.length*.12+(lv-1)*.15;
  const R={sx:place.sx,sy:place.sy,name:m.name,role:m.role,seed:m.seed,
    lv,perks:m.perks.slice(),traits:m.traits.slice(),
    shipId:m.shipId||null,crew,fee:m.fee,why:why||"loy",
    hullMax:Math.round((S?S.hull:100)*grit+60*lv),
    dmg:+(5+lv*1.6+m.perks.length*.5).toFixed(2),
    t:Date.now()};
  R.hull=R.hullMax;
  if(!G.rogues)G.rogues=[];
  G.rogues.push(R);
  while(G.rogues.length>ROGUE_CAP)G.rogues.shift();
  /* корпус уходит вместе с ним: он теперь на нём летает, а не стоит в ангаре */
  if(m.shipId&&m.shipId!==G.shipId)delete G.owned[m.shipId];
  logAdd("warn",m.name+" ушёл"+(S?" на «"+S.ru+"»":"")+
    (crew.length?" и увёл "+crew.length+" чел.":"")+
    " · видели в секторе "+R.sx+":"+R.sy);
  tell("warn",m.name+" ушёл",
    m.name+" ушёл\n"+(S?"забрал «"+S.ru+"»\n":"")+
    (crew.length?"увёл: "+crew.join(", ")+"\n":"")+
    "сектор "+R.sx+":"+R.sy);
  return R;
}
function rogueHere(){
  if(!G.rogues)return null;
  return G.rogues.find(R=>R.sx===G.sx&&R.sy===G.sy)||null;
}
/* Спавн в бой: он — обычная запись в G.pirates, поэтому всё уже написанное
   (наведение, выстрелы, попадания, отрисовка корпуса) работает без правок. */
function rogueSpawn(){
  const R=rogueHere();if(!R)return;
  const r=rng(hashi(R.seed,0x51A,9));
  const a=r()*TAU,rad=1500+r()*900;
  G.pirates.push({x:Math.cos(a)*rad,y:Math.sin(a)*rad,vx:0,vy:0,a:a+Math.PI,
    hull:R.hull,hullMax:R.hullMax,name:R.name,seed:R.seed,
    shipId:R.shipId||pirateShipId(R.seed),
    dmg:R.dmg,cool:0,aware:false,thrust:false,rogue:1});
  /* уведённые люди летят с ним — их видно поимённо, и это неприятно намеренно */
  for(let i=0;i<Math.min(R.crew.length,3);i++){
    const ea=r()*TAU,er=rad*(.85+r()*.3);
    G.pirates.push({x:Math.cos(ea)*er,y:Math.sin(ea)*er,vx:0,vy:0,a:ea+Math.PI,
      hull:40+R.lv*18,hullMax:40+R.lv*18,name:R.crew[i],seed:hashi(R.seed,i,0x2C),
      shipId:pirateShipId(hashi(R.seed,i,0x2C)),
      dmg:3.5+R.lv*.7,cool:0,aware:false,thrust:false,rogueEsc:1});
  }
}
/* Разбит: корпус возвращается в ангар, а сам он остаётся в мире —
   изгнанником, которого однажды можно взять обратно (и дёшево). */
function rogueDefeated(p){
  const R=(G.rogues||[]).find(x=>x.seed===p.seed);
  sfx("boom",{v:1});
  if(R){
    const i=G.rogues.indexOf(R);G.rogues.splice(i,1);
    if(R.shipId&&!G.owned[R.shipId]){
      G.owned[R.shipId]=true;
      const S=shipData(R.shipId);
      logAdd("kill","«"+(S?S.ru:R.shipId)+"» отбит у "+R.name);
    }
    /* всё, что он утащил долей, лежало у него в трюме */
    const back=Math.round(2200+R.lv*900);
    G.credits+=back;
    /* §12: трофей с ушедшего управляющего — один из источников артефактов.
       Он унёс с собой не только корпус. */
    const relic=relicRoll(hashi(R.seed,R.lv,0x3B7),.45);
    if(relic)relicFind(relic,"трофей с "+R.name);
    if(!G.exiles)G.exiles=[];
    G.exiles.push({name:R.name,role:R.role,seed:R.seed,lv:R.lv,perks:R.perks.slice(),
      traits:R.traits.slice(),fee:Math.round(R.fee*.35),t:Date.now()});
    while(G.exiles.length>ROGUE_CAP)G.exiles.shift();
    tell("kill",R.name+" разбит · +"+back.toLocaleString("ru")+" кр",
      R.name+" разбит\n"+(R.shipId?"корпус отбит\n":"")+
      "+"+back.toLocaleString("ru")+" кр\nон выжил — и однажды придёт в кантину");
    logAdd("kill",R.name+" разбит · +"+back.toLocaleString("ru")+" кр · он выжил");
  }
  const j=G.pirates.indexOf(p);if(j>=0)G.pirates.splice(j,1);
}
/* Изгнанник в кантине: дешевле всех, начинает с низкой лояльностью и с уже
   выученными перками — вы за них однажды заплатили. */
function exileCandidates(){
  if(!G.exiles||!G.exiles.length)return [];
  return G.exiles.map(e=>({
    name:e.name,role:e.role,seed:e.seed,traits:e.traits.slice(),perks:e.perks.slice(),
    xp:MGR_XP[clamp(e.lv-1,0,MGR_XP.length-1)],loy:28,rules:[],lv0:e.lv,
    tMs:0,earned:0,spent:0,tookCr:0,stole:0,shipId:null,route:[],log:[],
    fee:e.fee,exile:1}));
}
