/* ══════════════ пираты ══════════════ */
/* эфемерны: набираются заново при каждом входе в систему, как орбиты и пояс */
const PIRATE_NAMES=["Шакал","Гриф","Клык","Ржавый","Стервятник","Сиплый","Крюк","Оса"];
const PIRATE_COLS=["#ff6b57","#d95a3c","#c4694f","#e08a5a","#b85a6a","#cf7a45"];
/* ── ранги ──
   Ранг — не «плюс к числам», а то, кого вы встретили: залётный шакал, ветеран
   на сколоченном корпусе, капитан патруля и барон, который держит систему.
   Награда и живучесть растут вместе с рангом, поэтому занятая система — это
   и риск, и заработок. */
/* shield — доля корпуса, которую ранг несёт полем (M362, §4). У шакала его
   нет вовсе: он и так живёт одну стычку. Повадка поля берётся из seed
   пирата, как у части в трюме, — и по ней читается, откуда его бить. */
const PIRATE_RANKS=[
  {ru:"",         pre:"",        hull:1,   bounty:1,   col:null,    shield:0},
  {ru:"ветеран",  pre:"Старый",  hull:1.6, bounty:1.7, col:"#e0885a",shield:.35},
  {ru:"капитан",  pre:"Капитан", hull:2.4, bounty:2.8, col:"#f2b25c",shield:.5},
  {ru:"барон",    pre:"Барон",   hull:4.2, bounty:6,   col:"#ff9d7a",shield:.7}
];
/* у каждого пирата свой генерируемый корпус — через NPC_SHIPS, мимо персистентных G.uniqueShips */
function pirateShipId(seed){
  const id="p"+seed;
  if(!NPC_SHIPS[id]){
    const r=rng(seed);
    NPC_SHIPS[id]={seed:hashi(seed,7717,31),col:pick(PIRATE_COLS,r)};
  }
  return id;
}
function spawnPirates(){
  G.pirates=[];G.shots=[];G.loot=[];
  G.shield=stat().shieldMax;G.energy=stat().energyMax;G.shieldHit=0;
  const danger=sysDanger(G.sx,G.sy);
  const r=rng(hashi(G.sx,G.sy,Math.floor(Date.now()/900000)));
  /* под пиратами система держит патруль сверх обычного случайного налёта */
  let n=(r()<danger*.85?1+Math.floor(r()*(1+danger*2)):0)+occExtraPirates(G.sx,G.sy);
  if(typeof quietNoPirates==="function"&&quietNoPirates())n=0;   /* тихий уезд (11n): никто не грабит */
  /* «Ялта» (M369, D12): туда не приходят ни пираты, ни фронт — это её первое
     и главное свойство, и оно работает раньше всего остального */
  if(typeof yaltaIs==="function"&&yaltaIs(G.sx,G.sy))n=0;
  if(typeof holdAmbushMul==="function")n=Math.floor(n*holdAmbushMul());   /* Заграждение (H4) */
  n=Math.min(n,ARMED_CAP);   /* потолок вооружённых (§5, M361) */
  for(let i=0;i<n;i++){
    const a=r()*TAU,rad=2200+r()*1600;
    const seed=hashi(G.sx,G.sy,i*977);
    /* ── ранг ──
       Один и тот же «пират» на всю галактику делал бой одинаковым от начала
       до конца. Ранг растёт от опасности сектора и от того, насколько плотно
       система занята: в занятой системе стоит патруль, а не залётный шакал.
       Барон появляется только под полной оккупацией — он и есть тот, ради кого
       туда летят. */
    const occ=occLvl(G.sx,G.sy);
    let rank=0;
    if(r()<danger*.5+occ*.16)rank=1;
    if(occ>=2&&r()<.4+danger*.3)rank=2;
    if(occ>=OCC_MAX&&i===0)rank=3;
    const R=PIRATE_RANKS[rank];
    const hp=(26+danger*70)*R.hull;
    G.pirates.push({x:Math.cos(a)*rad,y:Math.sin(a)*rad,vx:0,vy:0,a:a+Math.PI,
      hull:hp,hullMax:hp,name:(R.pre?R.pre+" ":"")+pick(PIRATE_NAMES,r),
      rank,seed,shipId:pirateShipId(seed),
      cool:0,aware:false,thrust:false,
      shield:hp*R.shield,shieldMax:hp*R.shield,shieldHit:0,
      /* поле — от ранга, по таблице §5: у шакала его нет вовсе, у ветерана
         сплошное, у капитана лобовое, у барона импульсное (M368) */
      shieldType:(PIRATE_LOADOUT[rank].shield||"solid"),
      /* дезертир (§7): пират на корпусе державы с закрашенным номером. Флаг
         ставится уже сейчас, читать его будет M369a — там же и корпус */
      deserter:(occ>=2&&((seed>>>11)&3)===0)?1:0});
  }
  /* ушедший управляющий сидит в своём секторе и ждёт: он такая же запись в
     G.pirates, поэтому весь бой уже написан — добавлять к нему нечего */
  rogueSpawn();
  /* охотник за вами (12o): приходит только за долгом и только около своего
     сектора — тем же входом, что все, кто появляется в системе */
  if(typeof huntSpawn==="function")huntSpawn();
  /* соперник-коллекционер (12p): он держит редкость, и он же её адрес */
  if(typeof rivalSpawn==="function")rivalSpawn();
  /* баржи набираются тем же входом, что и пираты: одна точка на все режимы,
     откуда входят в систему (12l-barge) */
  if(typeof spawnBarges==="function")spawnBarges();
  /* пикет державы или чужой бой на фронте (M372): летопись говорит, чья это
     система, вход в систему это показывает */
  G.npcWrecks=null;
  if(typeof npcSpawn==="function")npcSpawn();
  if(typeof warPull==="function")warPull();      /* ведомости — на каждом прыжке (M376) */
}
/* fireShot — в 13-combat (M361): у выстрела есть хозяин */
let fireCool=0;
function updateCombat(dt){
  const sh=G.ship,st=stat();
  const seeRange=st.see;
  /* ── энергия и щит (M362, §4) ──
     Одна шкала кормит выстрелы, регенерацию поля и маневровые. Пустая —
     не смерть: огонь вполовину, поле стоит, маневровые вялые; полная —
     за пару секунд молчания. Ни сброса, ни перегрева.
     Щит растёт не «когда никто не целится», а через паузу после
     ПОПАДАНИЯ: прежнее правило means один заметивший вас шакал на другом
     конце системы держал поле выключенным весь бой. */
  if(G.energy===undefined)G.energy=st.energyMax;
  /* жар и на вашем корпусе тоже: матрица одна на всех (M364) */
  if(typeof heatTick==="function")heatTick(G,dt,d0=>{G.hull=Math.max(0,G.hull-d0);});
  if(typeof beamsTick==="function")beamsTick(dt);
  /* мины миномёта живут своей минутой и рвутся сами (M365) */
  if(typeof minesTick==="function")minesTick(dt);
  /* трос тянет, таран считает столкновения, зенитка снимает то, что летит (M366) */
  if(typeof tetherTick==="function")tetherTick(dt);
  if(typeof ramTick==="function")ramTick(dt);
  if(typeof flakCatch==="function")flakCatch(dt);
  G.ramOn=!!(st.guns&&st.guns.some(a=>a.g&&a.g.fx==="ram"));
  G.energy=Math.min(st.energyMax,G.energy+st.energyRegen*dt);
  const lowE=G.energy<EN_SHOT;
  G.shieldHit=Math.max(0,(G.shieldHit||0)-dt);
  /* чужой импульсник гасит ваше поле на две секунды, чужая помеховая сбивает
     захват (M368): обе метки живут здесь, где живёт и сам щит */
  G.jamT=Math.max(0,(G.jamT||0)-dt);
  G.shieldOff=Math.max(0,(G.shieldOff||0)-dt);
  if(typeof foeTetherTick==="function")foeTetherTick(dt);
  if(G.shieldOff>0)G.shield=0;
  if(st.shieldMax>0&&G.shieldOff<=0){
    if(G.shield>st.shieldMax)G.shield=st.shieldMax;
    if(st.shieldType==="pulse"){
      /* импульсный не растёт вовсе — он возвращается целиком раз в двадцать секунд */
      G.shieldPulse=(G.shieldPulse||0)+dt;
      if(G.shieldPulse>=SHIELD_PULSE){G.shieldPulse=0;
        if(G.shield<st.shieldMax){G.shield=st.shieldMax;sfx("ui",{f:420,to:1200,d:.22,v:.3});}}
    }else if(G.shieldHit<=0&&!lowE&&G.shield<st.shieldMax){
      const grow=Math.min(st.shieldMax-G.shield,st.shieldRegen*dt*.06);
      const paid=Math.min(grow,G.energy/EN_SHIELD);
      G.shield+=paid;G.energy=Math.max(0,G.energy-paid*EN_SHIELD);
    }
  }else G.shield=0;
  /* контейнеры с трофеями: подбираются пролётом сквозь */
  for(let i=G.loot.length-1;i>=0;i--){
    const L=G.loot[i];
    L.x+=L.vx*dt;L.y+=L.vy*dt;L.vx*=.996;L.vy*=.996;L.spin+=.02*dt;L.life-=dt;
    if(Math.hypot(L.x-sh.x,L.y-sh.y)<40){
      addPart(L.part);
      sfx("ui",{f:520,to:1040,d:.16,v:.34});
      tell("kill","Подобрана часть: "+L.part.name+" ("+TIER_RU[L.part.tier]+")",
           "Контейнер вскрыт\n"+L.part.name+"\n"+L.part.aff.map(affLabel).join("\n"));
      G.loot.splice(i,1);
    }else if(L.life<=0)G.loot.splice(i,1);
  }
  if(fireCool>0)fireCool-=dt;
  /* ── огонь (M360, стволы по подвесам — M363) ──
     Стреляет КАЖДЫЙ ствол активной группы, у каждого свой откат, свой угол и
     свой конус от подвеса. Автоогонь идёт, пока первая метка достаётся этим
     стволом; зажатый ОГОНЬ/F/ЛКМ — принудительно, по носу. Место помнит бой
     один раз за стычку, а не каждый выстрел (D16). */
  const ctl=G.ctl||{};
  /* в «Ялте» оружие опечатано (M369): отказ с причиной, а не молчащая кнопка */
  const sealed=(typeof yaltaHere==="function")&&yaltaHere();
  if(sealed&&(ctl.fire||keys.fire)&&typeof yaltaSealed==="function")yaltaSealed();
  const mk=(G.marks&&G.marks[0])||null;
  const live=(mk&&mk.hull>0&&!mk.iff)?mk:null;
  const all=(st.guns&&st.guns.length)?st.guns:[{slot:0,g:st.gun,m:null}];
  const grp=(typeof gunGroupPick==="function")?gunGroupPick(all,sh,live):0;
  const act=(typeof gunsInGroup==="function")?gunsInGroup(all,grp):all;
  if(!G.gunCool)G.gunCool={};
  for(let gi=0;gi<act.length&&!sealed;gi++){
    const A=act[gi],g=A.g,first=gi===0;
    let cd=first?fireCool:((G.gunCool[A.slot]||0)-dt);
    let auto=false;
    if(live){
      const d=Math.hypot(live.x-sh.x,live.y-sh.y);
      auto=d<g.range&&Math.abs(angDiff(Math.atan2(live.y-sh.y,live.x-sh.x),sh.a))<g.cone;
    }
    /* ствол ведёт метку внутри своего конуса со своей скоростью наводки
       (M362): носом её больше не «донаводишь» мгновенно. Промах — это угол,
       добавленный к выстрелу, а не скрытый бросок. */
    const ang=gunAimTick(g,sh,live,dt,A.slot);
    if((auto||ctl.fire)&&st.armed&&cd<=0){
      /* чем именно стреляет этот ствол, решает его семейство (13a-guns):
         снаряд, дробь, мгновенный луч или доворачивающая пуля */
      gunFireOnce(g,sh,live,ang);
      if(!G.engaged&&typeof placeNote==="function")placeNote("hurt",1);   // место помнит выстрел (11d)
      G.engaged=true;
      /* пустая шкала — не «нельзя стрелять», а вдвое реже (§4) */
      G.energy=Math.max(0,G.energy-EN_SHOT*(g.en||1));
      cd=g.cool*(lowE?2:1);
    }
    if(first)fireCool=Math.max(0,cd);else G.gunCool[A.slot]=Math.max(0,cd);
  }
  if(G.engaged&&!G.pirates.some(p=>p.aware))G.engaged=false;
  for(let i=G.pirates.length-1;i>=0;i--){
    const p=G.pirates[i];
    const dx=sh.x-p.x,dy=sh.y-p.y,d=Math.hypot(dx,dy)||1;
    /* мишень стрельбища (24d) ничего о вас не знает и не стреляет */
    if(p.dummy){p.aware=false;p.vx=0;p.vy=0;continue;}
    /* под помехой (M365) вас не видят: пока счётчик горит, чужой не наводится
       и половину времени бьёт в пустоту */
    if(p.jamT>0){p.aware=false;}
    else if(d<seeRange)p.aware=true;
    else if(d>seeRange*2.4)p.aware=false;
    if(typeof fleetEscortActive==="function"&&fleetEscortActive())p.aware=false;   /* конвой ГЛАВТРАССЫ (M311) */
    p.thrust=false;
    /* жар, горение и молчание перегретого (M364, 13a-guns) */
    if(typeof heatTick==="function")heatTick(p,dt,d0=>{p.hull-=d0;});
    if(p.hull<=0&&!p.dummy){killPirate(p);continue;}
    /* поле пирата живёт по тем же трём повадкам, что и ваше (M362) */
    /* импульсник гасит поле на две секунды: пока горит этот счётчик, поле
       не растёт вовсе, чем бы оно ни было (M365) */
    if(p.shieldOff>0){p.shieldOff=Math.max(0,p.shieldOff-dt);p.shield=0;}
    if(p.jamT>0){p.jamT=Math.max(0,p.jamT-dt);}
    if(p.leadBreak>0)p.leadBreak=Math.max(0,p.leadBreak-dt);
    /* снаряжение ранга: зенитка, лучи, помеха, трос, мины (M368, §5) */
    if(typeof pirateArmTick==="function")pirateArmTick(p,dt);
    /* привязанный тросом теряет половину хода: гарпун держит, а не убивает */
    if(p.tether){p.vx*=Math.pow(.985,dt);p.vy*=Math.pow(.985,dt);p.tether=0;}
    if(p.shieldMax>0&&!(p.shieldOff>0)){
      p.shieldHit=Math.max(0,(p.shieldHit||0)-dt);
      if(p.shieldType==="pulse"){
        p.shieldPulse=(p.shieldPulse||0)+dt;
        if(p.shieldPulse>=SHIELD_PULSE){p.shieldPulse=0;p.shield=p.shieldMax;}
      }else if(p.shieldHit<=0&&p.shield<p.shieldMax)
        p.shield=Math.min(p.shieldMax,p.shield+p.shieldMax*.0016*dt);
    }
    const pa0=p.a;
    if(p.aware){
      const want=Math.atan2(dy,dx);
      /* поведение — по рангу (13c-roles): бросок, борт, дистанция, очереди; бегство */
      if(pirateRoleTick(p,dt,d,want))continue;
    }
    const sp=Math.hypot(p.vx,p.vy),lim=ROLE_LIM[p.rank|0]||4.4;
    if(sp>lim){p.vx*=lim/sp;p.vy*=lim/sp;}
    if(sp>.08){   // тот же довод вектора к носу, что и у игрока
      const cur=Math.atan2(p.vy,p.vx);
      const na=cur+clamp(angDiff(p.a,cur),-.05,.05)*.05*dt;
      p.vx=Math.cos(na)*sp;p.vy=Math.sin(na)*sp;
    }
    p.x+=p.vx*dt;p.y+=p.vy*dt;
    p.bank=(p.bank||0)+(clamp(angDiff(p.a,pa0)/Math.max(dt,.0001)*17,-.95,.95)-(p.bank||0))*Math.min(1,.11*dt);
  }
  /* все выстрелы — одной петлёй, чей бы ни был выстрел (13-combat, M361) */
  if(combatShots(dt))return;
  fleetFire(dt);
  G.pirates=G.pirates.filter(p=>p.hull>0);
  /* батарея с грунта (21d): своя система, только мелочь — она сама решает,
     стрелять ли, и делает это в общем цикле боя, а не своим таймером */
  if(typeof battTick==="function")battTick(dt);
  /* ракеты (16b): свой пуск, своя перезарядка и свой расход из трюма — но живут
     они в том же цикле боя, а не отдельным таймером */
  if(typeof mslTick==="function")mslTick(dt);
  if(typeof hailRunCheck==="function")hailRunCheck(sh);   /* четвёртое правило (M373) */
  if((keys.msl||(G.ctl&&G.ctl.msl))&&typeof mslFire==="function"&&(G.mslCool||0)<=0){
    if(sealed){if(typeof yaltaSealed==="function")yaltaSealed();}
    else mslFire();
  }
}
/* трепло (12x, M116) слышит бой: имя сбитого — это то, что потом прозвучит
   на чужой станции, и уже не как ваша заслуга */
function parrotHeardKill(p){
  if(typeof parrotHas==="function"&&parrotHas()&&p&&p.name)
    heardYours("«"+p.name+"» больше не выйдет на связь",G.sx,G.sy);
}
function killPirate(p){
  parrotHeardKill(p);
  /* ренегат — не пират: за него не дают награды, за него возвращают корпус */
  if(p.rogue){rogueDefeated(p);return;}
  /* охотник — тоже не рядовой пират: его награда разовая и записана навсегда */
  if(p.hunter){huntDefeated(p);return;}
  /* соперник отдаёт то, что унёс, — награды за него нет, есть предмет */
  if(p.rival){rivalDefeated(p);return;}
  const r=rng(p.seed);
  sfx("boom",{v:.8});
  const RK=PIRATE_RANKS[p.rank|0]||PIRATE_RANKS[0];
  const bounty=Math.round((90+sysDanger(G.sx,G.sy)*420)*(.7+r()*.7)*stat().bountyMul*RK.bounty);
  earn(bounty,"bounty");G.kills=(G.kills|0)+1;
  /* сбитый в занятой системе идёт в счёт её освобождения */
  occKill(G.sx,G.sy);
  /* узел с обломков: редкая находка, а не вторая валюта (05a-nodes) */
  nodeDrop("с пиратов",sysDanger(G.sx,G.sy),hashi(p.seed,0x40DE,Date.now()&0xffff));
  const loot=pick(TRADE_KEYS,r),   /* редкое с обломков не падает: у него свои способы добычи */got=addRes(loot,2+Math.floor(r()*7));
  const d=sysDanger(G.sx,G.sy);
  /* обломок с частью — не в трюм сразу, а контейнером: у боя своя петля «убил → собрал» */
  let dropped=null;
  /* именной падает только с барона и только иногда (M366, §2.2): оружие,
     оставленное кем-то, — цель для новичка, а не короткая дорога */
  if((p.rank|0)>=3&&r()<.5&&typeof gunNamedRoll==="function"){
    const N=gunNamedRoll(hashi(p.seed,0x4E41,7));
    dropped=genPart(hashi(p.seed,0x4E41,Math.floor(Date.now()/1000)),5,"gun",2,N.id);
    const a=r()*TAU,sp=.35+r()*.5;
    G.loot.push({x:p.x,y:p.y,vx:p.vx*.4+Math.cos(a)*sp,vy:p.vy*.4+Math.sin(a)*sp,
      spin:r()*TAU,life:5400,part:dropped});
  }else if(r()<.3+d*.45){
    dropped=genPart(hashi(p.seed,3131,Math.floor(Date.now()/1000)),tierFromDanger(d,r));
    const a=r()*TAU,sp=.35+r()*.5;
    G.loot.push({x:p.x,y:p.y,vx:p.vx*.4+Math.cos(a)*sp,vy:p.vy*.4+Math.sin(a)*sp,
      spin:r()*TAU,life:5400,part:dropped});
  }
  say("«"+p.name+"» разбит\n+"+bounty+" кр"+(got?"\nтрофей: "+RES[loot].ru+" ×"+got:"")+
    (dropped?"\nотделился контейнер":""));
  logAdd("kill","Пират «"+p.name+"» уничтожен · +"+bounty+" кр"+
    (got?" · трофей "+RES[loot].ru.toLowerCase()+" ×"+got:"")+
    (dropped?" · контейнер с частью":""));
}
function drawCombat(zx,zy,Z){
  /* лучи (M364): у них нет полёта, поэтому и в петле выстрелов их нет —
     свой короткий след, гаснущий за четыре кадра */
  if(typeof beamsDraw==="function")beamsDraw(zx,zy,Z);
  if(typeof minesDraw==="function")minesDraw(zx,zy,Z);
  /* линия батареи с грунта (21d) — рисуется до всего остального, чтобы луч
     уходил под корабли, а не поверх них */
  if(typeof battDraw==="function")battDraw(zx,zy,Z);
  if(typeof mslDraw==="function")mslDraw(zx,zy,Z);
  if(typeof npcWreckDraw==="function")npcWreckDraw(zx,zy,Z);
  /* контейнеры: гранёная коробка в цвет категории части, мигает маячком */
  for(const L of G.loot){
    const x=zx(L.x),y=zy(L.y);
    if(x<-40||x>W+40||y<-40||y>H+40){
      const ang=Math.atan2(L.y-G.ship.y,L.x-G.ship.x);
      const mx=W/2+Math.cos(ang)*(Math.min(W,H)/2-40),my=H/2+Math.sin(ang)*(Math.min(W,H)/2-40);
      ctx.fillStyle=PART_KINDS[L.part.kind].col;ctx.globalAlpha=.7;
      ctx.beginPath();ctx.arc(mx,my,2.6,0,TAU);ctx.fill();ctx.globalAlpha=1;
      continue;
    }
    const col=PART_KINDS[L.part.kind].col,s=clamp(Z,.6,1.6)*7;
    ctx.save();ctx.translate(x,y);ctx.rotate(L.spin);
    ctx.fillStyle="rgba(20,24,30,.9)";ctx.strokeStyle=col;ctx.lineWidth=1.4;
    ctx.beginPath();
    for(let i=0;i<6;i++){const a=i/6*TAU;const rr=s*(i%2?.72:1);
      i?ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):ctx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}
    ctx.closePath();ctx.fill();ctx.stroke();
    ctx.restore();
    const pulse=.45+.55*Math.abs(Math.sin(G.t*.05+L.spin));
    ctx.fillStyle=col;ctx.globalAlpha=pulse;
    ctx.beginPath();ctx.arc(x,y,2.2,0,TAU);ctx.fill();ctx.globalAlpha=1;
    if(L.life<900){   // перед исчезновением предупреждаем
      ctx.fillStyle="rgba(255,157,122,.8)";ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
      ctx.fillText(Math.ceil(L.life/60)+"с",x,y-s-5);
    }
  }
  for(const p of G.pirates){
    const x=zx(p.x),y=zy(p.y);
    if(x>-60&&x<W+60&&y>-60&&y<H+60){
      ctx.save();ctx.translate(x,y);ctx.rotate(p.a);
      const s=clamp(Z,.55,1.6)*.82;
      ctx.scale(s,s);
      /* пират рисуется своим сварным корпусом (12i), а не вашим кораблём в
         чужой раскраске: у него шесть-восемь десятков полигонов, выпеченных
         один раз по seed, и живой слой повреждений поверх */
      drawPirate(p);
      ctx.restore();
      /* ренегата видно сразу: полоса шире, имя ярче и подпись, кто это такой —
         игрок должен узнать своего человека раньше, чем получит от него */
      /* полоса и имя — над тем, кто знает о вас или взят в захват (M361):
         мирно висящий вдали пират подписи не носит */
      const marked=G.marks&&G.marks.includes(p);
      if(!(p.aware||marked||p.rogue))continue;
      const w=p.rogue?54:(marked&&G.marks[0]===p?42:34),hp=clamp(p.hull/p.hullMax,0,1);
      /* полоска встаёт ВЫШЕ скобки захвата (M360a): на 26 px верхняя грань
         скобки ложилась ровно на неё, и корпус цели было не видно */
      const by=y-Math.max(26,(typeof helmMarkTop==="function"?helmMarkTop(p,Z):0)+18);
      ctx.fillStyle="rgba(255,255,255,.14)";ctx.fillRect(x-w/2,by,w,p.rogue?4:3);
      ctx.fillStyle=p.rogue?"#c58ae0":"#ff6b57";ctx.fillRect(x-w/2,by,w*hp,p.rogue?4:3);
      /* поле — своей ниткой над полосой корпуса: видно, что бить пока
         бесполезно, и видно, как оно садится (M362) */
      if(p.shieldMax>0&&p.shield>0){
        ctx.fillStyle="rgba(159,216,255,.85)";
        ctx.fillRect(x-w/2,by-3,w*clamp(p.shield/p.shieldMax,0,1),2);
      }
      /* горит и молчит — это надо ВИДЕТЬ, иначе добивающая роль работает
         втёмную (M364): горящий корпус подписан огнём поверх полосы,
         перегретый вместо имени носит «ПЕРЕГРЕВ» на те секунды, пока молчит */
      if(p.burnT>0){
        ctx.fillStyle="rgba(255,150,70,"+(.5+.35*Math.abs(Math.sin(G.t*.35+p.seed))).toFixed(2)+")";
        ctx.fillRect(x-w/2,by+(p.rogue?4:3),w*clamp(p.burnT/BURN_TIME,0,1),1.6);
      }
      const hot=p.stunT>0;
      ctx.fillStyle=hot?"rgba(255,178,92,.95)":(p.rogue?"rgba(197,138,224,.95)":"rgba(255,107,87,.75)");
      ctx.font=(p.rogue?"9px":"8px")+" ui-monospace,monospace";ctx.textAlign="center";
      ctx.fillText(hot?"ПЕРЕГРЕВ":p.name.toUpperCase(),x,y+26);
      if(p.rogue){
        ctx.fillStyle="rgba(197,138,224,.6)";ctx.font="8px ui-monospace,monospace";
        ctx.fillText("БЫВШИЙ УПРАВЛЯЮЩИЙ",x,y+37);
      }
    }else if(G.tech.has("radar")){
      const ang=Math.atan2(p.y-G.ship.y,p.x-G.ship.x);
      const mx=W/2+Math.cos(ang)*(Math.min(W,H)/2-26),my=H/2+Math.sin(ang)*(Math.min(W,H)/2-26);
      ctx.fillStyle="rgba(255,107,87,.8)";
      ctx.beginPath();ctx.arc(mx,my,3.4,0,TAU);ctx.fill();
    }
  }
  for(const s of G.shots){
    const x=zx(s.x),y=zy(s.y);
    ctx.strokeStyle=s.mine?"rgba(127,230,216,.95)":"rgba(255,107,87,.95)";ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-s.vx*1.6*Z,y-s.vy*1.6*Z);ctx.stroke();
  }
}
