/* ══════════════ снаряжение пирата по рангу (M368, §5) ══════════════
   До этого прохода ранг был повадкой и числом: шакал бросался, барон стоял,
   у каждого свой урон и свой откат. Чем он вооружён — не спрашивалось, и в
   бою все четверо стреляли одинаковыми оранжевыми точками.

   Здесь у ранга появляется СНАРЯЖЕНИЕ, и берётся оно из той же таблицы, что
   ваше: `GUN_FAMILY` (05b-guns), числа через `gunSpecMake` (05c-arms). Не
   «пиратская версия автопушки», а та же автопушка — иначе таблица врёт.

     шакал   2× автопушка, игольник        поля нет
     ветеран тяжёлое, автопушка, гарпун    сплошное
     капитан лазер, сифон, импульсник,     лобовое
             помеховая, ракеты
     барон   рельса, кассетник, зенитка,   импульсное
             мины за корму

   Повадки живут здесь, а не в `13a-guns`: там они написаны от ВАШЕГО лица —
   лучи ищут пиратов, мины не трогают своих. Чужая сторона тех же повадок
   короче: цель одна, и она всегда вы.

   Ракеты (M367) и зенитка теперь тоже идут от снаряжения, а не от ранга:
   по таблице пусковая у капитана, зенитка у барона. */
const PIRATE_LOADOUT=[
  {guns:["auto","auto","needle"],           shield:null,    tier:1},
  {guns:["heavy","auto","harpoon"],          shield:"solid", tier:2},
  {guns:["laser","siphon","pulse","jam"],   shield:"front", tier:3,msl:1},
  {guns:["rail","cluster","flak","mortar"], shield:"pulse", tier:4}
];
/* откаты чужих повадок: у вашего ствола откат считается от числа орудия, у
   чужого он ещё и мерило того, как часто игроку прилетает неприятность */
const FOE_ARM_COOL={needle:40,harpoon:170,laser:10,siphon:16,pulse:280,jam:20,
  rail:220,cluster:130,mortar:200};
function pirateLoadout(p){return PIRATE_LOADOUT[clamp((p&&p.rank)|0,0,PIRATE_LOADOUT.length-1)];}
function pirateHas(p,fam){
  const L=pirateLoadout(p);
  return fam==="msl"?!!L.msl:L.guns.indexOf(fam)>=0;
}
/* ствол пирата считается ровно тем же кодом, что ваш: семейство из таблицы,
   тир от ранга, seed от самого пирата — значит два ветерана не близнецы */
function foeGun(p,fam){
  if(!p.arm)p.arm={};
  if(p.arm[fam])return p.arm[fam];
  const L=pirateLoadout(p);
  const part={seed:hashi(p.seed||1,fam.charCodeAt(0)*977,0x6A),tier:L.tier,
    fam,fact:0,ser:1900,bonus:{}};
  const dmg=p.dmg||3.5+sysDanger(G.sx,G.sy)*5;
  return p.arm[fam]=gunSpecMake(dmg,20,part,L.tier);
}
/* ── одна повадка, один раз ──
   Возвращает true, если сработала: откат ставит вызывающий. */
function foeArmFire(p,fam,d){
  const g=foeGun(p,fam),sh=G.ship;
  const ang=Math.atan2(sh.y-p.y,sh.x-p.x);
  const facing=Math.abs(angDiff(ang,p.a))<.6;
  const own=p.owner||"pirate";
  const shot=s2=>{if(s2)return s2;return null;};
  if(fam==="needle"){
    if(d>g.range||!facing)return false;
    /* игла тонкая и частая; часть игл проходит поле насквозь — та же доля,
       что у вашего игольника */
    for(let i=0;i<3;i++){
      const a=ang+(Math.random()-.5)*g.spread*8;
      fireShot(p.x,p.y,a,g.speed,g.dmg,own,g.type,g.range);
      const s2=shot(G.shots[G.shots.length-1]);
      if(s2){s2.needle=1;s2.pass=Math.random()<(GUN_FAMILY.needle.pass||.45)?1:0;}
    }
    return true;
  }
  if(fam==="harpoon"){
    if(d>g.range||G.foeTether)return false;
    G.foeTether={p,life:TETHER_LIFE};
    say("«"+p.name+"» бросил трос",70);
    sfx("shot",{f:260,to:150,d:.18,v:.4});
    return true;
  }
  if(fam==="laser"){
    if(d>g.range||!facing)return false;
    beamAdd(p.x,p.y,sh.x,sh.y,"rgba(255,150,110,.9)",1.2);
    playerHit({vx:Math.cos(ang),vy:Math.sin(ang),dmg:g.dmg,type:g.type,owner:own,mine:false});
    return true;
  }
  if(fam==="siphon"){
    /* сифон не бьёт: он переливает ваше поле в своё, и оставляет вас голым */
    if(d>g.range||!facing)return false;
    const a=Math.min(G.shield||0,1.4+g.dmg);
    if(a<=0)return false;
    G.shield-=a;G.shieldHit=SHIELD_DELAY;
    if(p.shieldMax>0)p.shield=Math.min(p.shieldMax,(p.shield||0)+a);
    beamAdd(p.x,p.y,sh.x,sh.y,"rgba(140,230,255,.75)",1.4);
    return true;
  }
  if(fam==="pulse"){
    if(d>g.range)return false;
    if((G.shield||0)<=0&&(G.shieldOff||0)>0)return false;   /* нечего гасить */
    G.shield=0;G.shieldOff=SHIELD_OFF;G.shieldHit=SHIELD_DELAY;
    beamAdd(p.x,p.y,sh.x,sh.y,"rgba(190,200,255,.8)",2);
    say("ИМПУЛЬС · ПОЛЕ СБИТО",90);
    sfx("ui",{f:520,to:120,d:.3,v:.4});
    return true;
  }
  if(fam==="jam"){
    /* помеховая не стреляет вовсе: рядом с капитаном захват не держится */
    if(d>JAM_R)return false;
    G.jamT=JAM_TIME;
    return true;
  }
  if(fam==="rail"){
    if(d>g.range||!facing)return false;
    beamAdd(p.x,p.y,p.x+Math.cos(ang)*g.range,p.y+Math.sin(ang)*g.range,
      "rgba(180,220,255,.95)",2);
    playerHit({vx:Math.cos(ang),vy:Math.sin(ang),dmg:g.dmg,type:g.type,owner:own,mine:false});
    sfx("shot",{f:150,to:900,d:.22,v:.5});
    return true;
  }
  if(fam==="cluster"){
    if(d>g.range)return false;
    fireShot(p.x,p.y,ang,g.speed,g.dmg,own,g.type,g.range);
    const s2=shot(G.shots[G.shots.length-1]);
    if(s2){s2.split=Math.max(20,d*.5);s2.parts=(GUN_FAMILY.cluster&&GUN_FAMILY.cluster.parts)||5;
      s2.gspread=g.spread;}
    return true;
  }
  if(fam==="mortar"){
    /* мина за корму: барон не гонится за вами, он делает место, где вам плохо */
    if(d>1000)return false;
    foeMineLay(p,g);
    return true;
  }
  return false;
}
/* мина барона: та же запись, что ваша (13a-guns), только сторона другая */
function foeMineLay(p,g){
  if(!G.gmines)G.gmines=[];
  if(G.gmines.filter(m=>m.foe).length>=5)return false;
  const a=p.a+Math.PI;
  G.gmines.push({x:p.x+Math.cos(a)*26,y:p.y+Math.sin(a)*26,
    vx:(p.vx||0)*.3,vy:(p.vy||0)*.3,dmg:g.dmg,type:g.type,
    life:MINE_LIFE,arm:60,foe:1,owner:p.owner||"pirate"});
  sfx("shot",{f:190,to:110,d:.2,v:.3});
  return true;
}
/* ── трос с той стороны ──
   Ваш гарпун тянет вас к тяжёлому и отнимает половину хода; чужой делает то же
   с вами. Рвётся сам по времени или когда трос не выдерживает расстояния. */
function foeTetherTick(dt){
  const T=G.foeTether;
  if(!T)return;
  const p=T.p,sh=G.ship;
  T.life-=dt;
  const d=p?Math.hypot(p.x-sh.x,p.y-sh.y):1e9;
  if(!p||p.hull<=0||T.life<=0||d>1400){G.foeTether=null;return;}
  const dx=p.x-sh.x,dy=p.y-sh.y;
  const mine=stat().hullMax,his=p.hullMax||60;
  const k=TETHER_PULL*dt;
  sh.vx+=dx/d*k*(his/(mine+his));sh.vy+=dy/d*k*(his/(mine+his));
  p.vx-=dx/d*k*(mine/(mine+his));p.vy-=dy/d*k*(mine/(mine+his));
  const q=Math.pow(.985,dt);sh.vx*=q;sh.vy*=q;   /* привязанный теряет половину хода */
  beamAdd(sh.x,sh.y,p.x,p.y,"rgba(230,220,180,.55)",1);
}
/* ── такт снаряжения: один пират, все его повадки ──
   Роль (13c-roles) по-прежнему решает, КАК он ходит и когда даёт основной
   залп; здесь работает всё остальное, что у него на борту. */
function pirateArmTick(p,dt){
  if(!p||p.hull<=0||p.dummy||p.iff||!p.aware)return;
  if(p.stunT>0)return;                       /* перегретый молчит целиком */
  const L=pirateLoadout(p);
  /* зенитка идёт своей петлёй: ей нужна цель в воздухе, а не откат */
  if(L.guns.indexOf("flak")>=0&&typeof foeFlak==="function")foeFlak(p,dt);
  if(p.jamT>0&&Math.random()<.5)return;      /* сам под помехой: половина мимо */
  const d=Math.hypot(G.ship.x-p.x,G.ship.y-p.y);
  if(!p.armCool)p.armCool={};
  const C=p.armCool;
  for(const fam of L.guns){
    if(fam==="flak")continue;
    C[fam]=(C[fam]||0)-dt;
    if(C[fam]>0)continue;
    if(foeArmFire(p,fam,d))C[fam]=FOE_ARM_COOL[fam]||60;
    else C[fam]=12;                          /* не вышло — пробуем скоро снова */
  }
}
