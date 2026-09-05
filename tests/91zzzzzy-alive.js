/* ══════════════ живые сущности за вечер (M359) ══════════════
   Растр за вечер померен с двух сторон (M358 и «дорога»), списки состояния —
   тоже. Осталась третья ось, которой не касался никто: ЖИВЫЕ СУЩНОСТИ. Пираты,
   выстрелы, ракеты, дроны, слухи, новости, следы историй — всё это заводится
   миром само, живёт своей жизнью и должно само же убираться. Сущность, которая
   заводится и не убирается, ведёт себя как утечка растра: игра не падает, но
   каждый кадр обходится дороже, и к вечеру это заметно.

   Здесь два опыта, оба длинные и оба с настоящим боем:
   1. пять тысяч кадров в опасной системе с пальбой — сколько живых сущностей
      игра держит разом и убирает ли она их;
   2. уход из системы — то, что принадлежало ей, обязано уйти вместе с ней. */

/* перепись живого: не карты состояния, а то, что двигается в кадре */
function alCount(){
  return {pirates:(G.pirates||[]).length,shots:(G.shots||[]).length,
    drones:(G.drones||[]).length,news:(G.news||[]).length,
    rumours:(G.rumours||[]).length,quests:(G.quests||[]).length,
    offers:(G.offers||[]).length,log:(G.log||[]).length,
    told:(G.told||[]).length,heard:(G.heard||[]).length,
    wrecks:Object.keys(G.wrecks||{}).length};
}

TEST_SUITES.push(() => suite("живые: пять тысяч кадров боя не оставляют хвостов", () => {
  resetWorld();
  /* уходим туда, где опасно: пираты заводятся от sysDanger */
  let far=null;
  for(let r=8;r<26&&!far;r++)for(let x=-r;x<=r&&!far;x++)for(let y=-r;y<=r&&!far;y++){
    if(Math.max(Math.abs(x),Math.abs(y))!==r)continue;
    if(!starAt(x,y))continue;
    if(sysDanger(x,y)>.35)far=[x,y];
  }
  ok(!!far,"опасная система найдена: "+(far?far.join(","):"нет"));
  if(!far)return;
  G.sx=far[0];G.sy=far[1];G.sys=getSystem(far[0],far[1]);G.mode="system";
  G.fuel=100;G.hull=Math.max(G.hull,100);
  G.mods.weapon=2;G.modsOwned.weapon=2;
  /* Пираты рождаются на ВХОДЕ в систему (`spawnPirates` зовут прыжок, новая
     игра и выход с базы), а не кадром, и рождаются не всегда: их число —
     бросок от опасности. Поэтому входим в опасные системы, пока кто-нибудь не
     появится, — иначе «бой» окажется пустым небом, а набор зелёным и слепым
     (сам этим сегодня и попался: peak pirates 0). */
  if(typeof spawnPirates==="function")spawnPirates();
  for(let dx=-5;dx<=5&&!(G.pirates||[]).length;dx++)for(let dy=-5;dy<=5&&!(G.pirates||[]).length;dy++){
    const nx=far[0]+dx,ny=far[1]+dy;
    if(!starAt(nx,ny)||sysDanger(nx,ny)<.35)continue;
    G.sx=nx;G.sy=ny;G.sys=getSystem(nx,ny);
    spawnPirates();
  }
  ok((G.pirates||[]).length>0,"бой есть кому вести: пиратов "+(G.pirates||[]).length+
     " в секторе "+G.sx+","+G.sy+" (опасность "+sysDanger(G.sx,G.sy).toFixed(2)+")");
  const r=rng(hashi(0xA11E,3,7));
  const peak={},bad=[];
  let frames=0;
  for(let i=0;i<5000;i++){
    /* руки: стреляем и маневрируем, как в настоящем бою */
    if(i%5===0){ keys.fire=r()<.6; keys.thrust=r()<.5; keys.left=r()<.3; keys.right=r()<.3; }
    actEdge=false;
    try{ stepWorld(1); }catch(e){ bad.push("кадр "+i+": "+e.message); break; }
    G.t++;frames++;
    if(i%50===0){
      const c=alCount();
      for(const k in c)peak[k]=Math.max(peak[k]|0,c[k]);
      if(!Number.isFinite(G.ship.x)||!Number.isFinite(G.hull)){bad.push("числа уплыли на кадре "+i);break;}
    }
    /* корпус может кончиться — это законный исход боя, продолжаем в новой шкуре */
    if(G.mode!=="system"&&G.mode!=="dock"){ G.mode="system"; }
  }
  for(const k in keys)keys[k]=false;
  ok(frames>=4000,"кадров боя прожито: "+frames);
  ok((peak.pirates|0)>0&&(peak.shots|0)>0,"бой был настоящим: пиратов разом до "+(peak.pirates|0)+
     ", выстрелов в кадре до "+(peak.shots|0));
  eq(bad.slice(0,3).join(" ;; "),"","бой прошёл без падений и без NaN");
  /* потолки: всё это живёт в кадре, и ничего из этого не может расти без предела */
  const lim={pirates:14,shots:400,drones:40,news:80,rumours:60,quests:40,offers:40,log:400,told:200,heard:200,wrecks:60};
  const over=[];
  for(const k in lim)if((peak[k]|0)>lim[k])over.push(k+": "+peak[k]+" при потолке "+lim[k]);
  eq(over.slice(0,4).join(" ;; "),"","ни одна живая сущность не выросла сверх потолка ("+
    Object.keys(peak).map(k=>k+" "+peak[k]).join(", ")+")");
  resetWorld();
}));

TEST_SUITES.push(() => suite("живые: что принадлежало системе, уходит вместе с ней", () => {
  /* Пираты и выстрелы — это ЭТА система. Прыжок обязан их забыть: иначе через
     десять прыжков в кадре толпа из чужих систем, и каждая считается. */
  resetWorld();
  let far=null;
  for(let r=8;r<26&&!far;r++)for(let x=-r;x<=r&&!far;x++)for(let y=-r;y<=r&&!far;y++){
    if(Math.max(Math.abs(x),Math.abs(y))!==r)continue;
    if(starAt(x,y)&&sysDanger(x,y)>.35)far=[x,y];
  }
  if(!far){ok(true,"опасной системы рядом нет — пропуск");return;}
  G.sx=far[0];G.sy=far[1];G.sys=getSystem(far[0],far[1]);G.mode="system";G.fuel=100;
  /* заводим бой честным входом в систему; если в этой не родились — пробуем
     соседние опасные, а не выдумываем пиратов руками */
  let tries=0;
  if(typeof spawnPirates==="function")spawnPirates();
  while(!(G.pirates||[]).length&&tries<12){
    tries++;
    for(let dx=-4;dx<=4;dx++)for(let dy=-4;dy<=4;dy++){
      if((G.pirates||[]).length)break;
      const nx=far[0]+dx,ny=far[1]+dy;
      if(!starAt(nx,ny)||sysDanger(nx,ny)<.35)continue;
      G.sx=nx;G.sy=ny;G.sys=getSystem(nx,ny);
      spawnPirates();
    }
  }
  const r=rng(hashi(0xB0E,9,4));
  for(let i=0;i<600;i++){
    if(i%5===0){ keys.fire=r()<.7; keys.thrust=r()<.4; }
    actEdge=false;
    try{ stepWorld(1); }catch(e){ break; }
    G.t++;
  }
  for(const k in keys)keys[k]=false;
  const had=alCount();
  ok(had.pirates>0,"в опасной системе есть пираты: "+had.pirates+" (выстрелов "+had.shots+")");
  if(!had.pirates){resetWorld();return;}
  /* метим личности: после прыжка в кадре не должно остаться НИ ОДНОГО из этих */
  const mine=new Set();
  for(const p of G.pirates){p.__mark=1;mine.add(p);}
  /* прыгаем в соседнюю живую систему */
  let to=null;
  for(let dx=-3;dx<=3&&!to;dx++)for(let dy=-3;dy<=3&&!to;dy++){
    if(!dx&&!dy)continue;
    if(starAt(G.sx+dx,G.sy+dy))to=[G.sx+dx,G.sy+dy];
  }
  if(!to){ok(true,"лететь некуда — пропуск");resetWorld();return;}
  G.sel={x:to[0],y:to[1]};G.fuel=60;
  try{ jump(2); }catch(e){ ok(false,"прыжок бросил: "+e.message); resetWorld(); return; }
  const left=(G.pirates||[]).filter(p=>mine.has(p)||p.__mark);
  eq(left.length,0,"ни один пират из прошлой системы не перелетел с нами");
  eq((G.shots||[]).length,0,"и выстрелы прошлого боя не летят следом");
  /* в новой системе могут быть СВОИ — это не хвост, а её собственная жизнь */
  ok((G.pirates||[]).length<=14,"в новой системе своих пиратов не толпа: "+(G.pirates||[]).length);
  resetWorld();
}));
