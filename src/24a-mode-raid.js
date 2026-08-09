/* ══════════════ рейд на пиратскую базу: полигональный интерьер ══════════════ */
/* Карта — обычная 2D-сетка: генерация, коллизии, ИИ и пути на ней тривиальны и
   детерминированы. Рисуется она полигонами, проекцией и painter'ом из пояса
   астероидов (24-mode-belt) — это переиспользование, а не второй движок.
   Z-буфера нет, поэтому порядок жёсткий: пол → стены → объекты → эффекты. */
const RAID_N=26, RCELL=90, RAID_H=110;
const RAID_ROOMS={
  hangar: {ru:"ангар",       col:[46,58,74]},
  living: {ru:"жилой отсек", col:[58,50,44]},
  reactor:{ru:"реакторный",  col:[36,62,66]},
  store:  {ru:"склад",       col:[52,46,60]},
  bridge: {ru:"мостик",      col:[66,44,44]}
};
function raidIdx(c,r){return r*RAID_N+c;}
/* Типы врагов — те же поля, разные числа: этого хватает, чтобы бой читался
   по-разному, и не заводит второй ИИ. */
const FOE_KINDS={
  grunt:{ru:"пират",   hp:26,dmg:5, speed:1.5,range:700,cool:46,col:"#c4694f",r:9},
  rusher:{ru:"налётчик",hp:20,dmg:8, speed:3.1,range:150,cool:30,col:"#e08a5a",r:8},
  heavy:{ru:"тяжёлый", hp:60,dmg:9, speed:.9, range:620,cool:64,col:"#b85a6a",r:12},
  boss: {ru:"главарь", hp:120,dmg:12,speed:1.7,range:760,cool:24,col:"#ff6b57",r:14}
};
/* Пикапы — весь «расходный» слой сцены: лечение, броня, патроны. */
const PICKUPS={
  medkit:{ru:"аптечка",   col:"#7fe6d8"},
  armor: {ru:"пластина",  col:"#9fd8ff"},
  ammo:  {ru:"боезапас",  col:"#f2b25c"}
};
/* ══════════════ генерация: комнаты и коридоры со связностью ══════════════ */
function genRaid(seed,level){
  const r=rng(seed);
  const cells=new Uint8Array(RAID_N*RAID_N);      // 0 — порода, 1 — пол
  const kind=new Array(RAID_N*RAID_N).fill(null);
  const rooms=[];
  const want=5+Math.floor(r()*3)+Math.min(2,level);
  const KINDS=["hangar","living","reactor","store","bridge"];
  for(let i=0;i<want*6&&rooms.length<want;i++){
    const w=4+Math.floor(r()*4),h=4+Math.floor(r()*4);
    const c0=2+Math.floor(r()*(RAID_N-w-4)),r0=2+Math.floor(r()*(RAID_N-h-4));
    if(rooms.some(o=>c0<o.c1+2&&c0+w>o.c0-2&&r0<o.r1+2&&r0+h>o.r0-2))continue;
    const k=rooms.length===0?"hangar":KINDS[1+Math.floor(r()*3)];
    rooms.push({c0,r0,c1:c0+w,r1:r0+h,k,cx:c0+(w>>1),cy:r0+(h>>1)});
  }
  /* мостик — всегда последняя фактически размещённая комната: часть попыток
     отбрасывается наложением, и назначать роль заранее было бы неверно */
  if(rooms.length>1)rooms[rooms.length-1].k="bridge";
  for(const rm of rooms)
    for(let c=rm.c0;c<rm.c1;c++)for(let rr=rm.r0;rr<rm.r1;rr++){
      cells[raidIdx(c,rr)]=1;kind[raidIdx(c,rr)]=rm.k;
    }
  /* коридоры: соединяем каждую комнату со следующей — связность гарантирована
     построением, никаких проверок обходом графа не нужно */
  for(let i=1;i<rooms.length;i++){
    const a=rooms[i-1],b=rooms[i];
    let c=a.cx,rr=a.cy;
    while(c!==b.cx){c+=c<b.cx?1:-1;cells[raidIdx(c,rr)]=1;if(!kind[raidIdx(c,rr)])kind[raidIdx(c,rr)]="corr";}
    while(rr!==b.cy){rr+=rr<b.cy?1:-1;cells[raidIdx(c,rr)]=1;if(!kind[raidIdx(c,rr)])kind[raidIdx(c,rr)]="corr";}
  }
  /* антресоли и пандусы — то, ради чего вообще выбран полигональный рендер:
     часть комнат получает второй ярус, к нему ведёт наклонный въезд */
  const hi=new Float32Array(RAID_N*RAID_N);
  for(const rm of rooms){
    if(rm.k==="hangar"||rm.c1-rm.c0<5||rm.r1-rm.r0<5||r()<.45)continue;
    const w=2+Math.floor(r()*2);
    for(let c=rm.c0;c<rm.c0+w;c++)for(let rr=rm.r0;rr<rm.r1;rr++)hi[raidIdx(c,rr)]=52;
    /* пандус: одна колонка со ступенчатым подъёмом, чтобы наверх можно было выйти */
    const rampR=rm.r0+Math.floor((rm.r1-rm.r0)/2);
    hi[raidIdx(rm.c0+w,rampR)]=26;
    rm.loft=true;
  }
  return {seed,level,cells,kind,rooms,hi};
}
function raidFloorH(R,c,rr){
  if(c<0||rr<0||c>=RAID_N||rr>=RAID_N)return 0;
  return R.hi?R.hi[raidIdx(c,rr)]:0;
}
function raidFloorAt(R,x,z){return raidFloorH(R,Math.floor(x/RCELL),Math.floor(z/RCELL));}
function raidSolid(R,c,rr){
  if(c<0||rr<0||c>=RAID_N||rr>=RAID_N)return true;
  return R.cells[raidIdx(c,rr)]===0;
}
function raidSolidAt(R,x,z){return raidSolid(R,Math.floor(x/RCELL),Math.floor(z/RCELL));}
function cellCenter(c,rr){return [c*RCELL+RCELL/2,rr*RCELL+RCELL/2];}
/* ══════════════ вход, выход, наполнение ══════════════ */
/* Пиратская база есть только там, где сектор действительно опасен —
   она и объясняет, откуда берутся техкомпоненты (M39). */
function pirateBaseOf(sys){
  const d=sysDanger(sys.sx,sys.sy);
  if(d<.35)return null;
  const r=rng(hashi(sys.seed,0xBA5E,3));
  if(r()>.25+d*.6)return null;
  const orbit=(sys.belt?sys.belt.orbit:2000)*(.7+r()*.5);
  const ang=r()*TAU;
  return {orbit,ang,x:Math.cos(ang)*orbit,y:Math.sin(ang)*orbit,
    seed:hashi(sys.seed,0x21D,7),level:Math.round(d*3),name:"база "+genName(r)};
}
/* база кэшируется в самой системе: она эфемерна, как орбиты и пояс */
function sysPirateBase(){
  const sys=G.sys;
  if(sys.pbase===undefined)sys.pbase=pirateBaseOf(sys);
  return sys.pbase;
}
function drawPirateBase(zx,zy,Z){
  const PB=sysPirateBase();if(!PB)return;
  const x=zx(PB.x),y=zy(PB.y),s=clamp(Z,.3,1.4);
  if(x<-60||x>W+60||y<-60||y>H+60)return;
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  /* угловатая, тёмная, с красными огнями — читается как чужая с первого взгляда */
  /* у базы с хозяином (12o) свой обвод и своё имя: логово наконец отличается
     снаружи, а не только изнутри */
  const HL=typeof huntLairAt==="function"?huntLairAt(G.sx,G.sy):null;
  ctx.fillStyle=HL?"#1b0f16":"#171013";
  ctx.strokeStyle=HL?"rgba(197,138,224,.9)":"rgba(220,90,70,.85)";ctx.lineWidth=2;
  ctx.beginPath();
  for(let i=0;i<5;i++){
    const a=i*TAU/5+G.t*.002;
    const px=Math.cos(a)*22,py=Math.sin(a)*16;
    i?ctx.lineTo(px,py):ctx.moveTo(px,py);
  }
  ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle="rgba(220,90,70,.5)";ctx.lineWidth=1.4;
  for(let i=0;i<4;i++){
    const a=i*TAU/4-G.t*.004;
    ctx.beginPath();ctx.moveTo(Math.cos(a)*20,Math.sin(a)*14);
    ctx.lineTo(Math.cos(a)*33,Math.sin(a)*24);ctx.stroke();
  }
  ctx.fillStyle=(Math.sin(G.t*.18)>0)?"rgba(255,60,50,.95)":"rgba(255,60,50,.15)";
  ctx.beginPath();ctx.arc(0,0,4,0,TAU);ctx.fill();
  ctx.restore();
  ctx.fillStyle=HL?"rgba(197,138,224,.8)":"rgba(220,90,70,.65)";
  ctx.font="9px ui-monospace,monospace";ctx.textAlign="center";
  ctx.fillText(((HL?huntLairName(G.sx,G.sy):PB.name)||PB.name).toUpperCase(),x,y+34);
}
function enterRaid(PB){
  /* В занятой системе база — логово: уровень выше на занятость, поэтому и
     отсеки крупнее, и охраны больше. Отдельный режим под «данж» не нужен —
     абордаж уже умеет всё, чего это требует. */
  const lair=occLairLevel(G.sx,G.sy);
  if(lair){PB=Object.assign({},PB,{level:PB.level+lair,
    name:(occLairName(G.sx,G.sy)||PB.name)});}
  /* у логова появился хозяин (12o): в секторе вашего охотника база носит его
     имя и держит охрану на ступень выше — сюда летят за ним, а не за «ещё
     одной базой» */
  const HL=typeof huntLairAt==="function"?huntLairAt(G.sx,G.sy):null;
  if(HL)PB=Object.assign({},PB,{level:PB.level+1,name:huntLairName(G.sx,G.sy)});
  const R=genRaid(PB.seed,PB.level);
  const st=stat();
  const start=R.rooms[0];
  const [sx0,sz0]=cellCenter(start.cx,start.cy);
  const foes=[],loot=[],picks=[];
  const r=rng(hashi(PB.seed,77,0x0E));
  for(const rm of R.rooms){
    if(rm.k==="hangar")continue;
    const n=(rm.k==="bridge"?2:1)+Math.floor(r()*(1+PB.level));
    for(let i=0;i<n;i++){
      const c=rm.c0+Math.floor(r()*(rm.c1-rm.c0)),rr=rm.r0+Math.floor(r()*(rm.r1-rm.r0));
      const [x,z]=cellCenter(c,rr);
      /* мини-босс сторожит мостик; в остальном тип берётся от отсека —
         в жилом чаще налётчики, в реакторном тяжёлые */
      const kind=(rm.k==="bridge"&&i===0)?"boss":
        (rm.k==="living"?(r()<.6?"rusher":"grunt"):
         rm.k==="reactor"?(r()<.5?"heavy":"grunt"):
         (r()<.25?"heavy":(r()<.5?"rusher":"grunt")));
      const K=FOE_KINDS[kind],hp=K.hp+PB.level*12;
      /* барон сидит на мостике логова: он не «ещё один босс», а тот, ради кого
         сюда и летят, — втрое живучее обычного мини-босса */
      const baron=lair>=OCC_MAX&&rm.k==="bridge"&&i===0;
      foes.push({x,z,a:r()*TAU,kind,hp:baron?hp*3:hp,hpMax:baron?hp*3:hp,
        boss:kind==="boss",baron,
        cool:0,aware:false,seed:hashi(PB.seed,foes.length*131,9),bob:r()*TAU});
    }
    const [lx,lz]=cellCenter(rm.cx,rm.cy);
    loot.push({x:lx,z:lz,kind:rm.k==="bridge"?"part":(rm.k==="store"?"tech":"data"),taken:false,
      seed:hashi(PB.seed,loot.length*613,4)});
    /* расходники лежат по отсекам: жилой лечит, склад даёт патроны, прочее — броню */
    const pk=rm.k==="living"?"medkit":(rm.k==="store"?"ammo":(r()<.5?"armor":"medkit"));
    const pc=rm.c0+Math.floor(r()*(rm.c1-rm.c0)),pr=rm.r0+Math.floor(r()*(rm.r1-rm.r0));
    const [px,pz]=cellCenter(pc,pr);
    picks.push({x:px,z:pz,kind:pk,taken:false});
  }
  G.raid={PB,R,foes,loot,picks,x:sx0,z:sz0,y:0,a:0,vx:0,vz:0,suit:100,cool:0,
    ammo:60,armor:0,bag:{parts:[],tech:0,data:0},
    walkPhase:0,hurt:0,flash:0,shots:[],exit:[sx0,sz0],level:PB.level};
  G.mode="raid";G.ap=null;
  for(const k in keys)keys[k]=false;
  say("Абордаж · "+PB.name+"\n◀ ▶ — поворот · ▲ ▼ — ход\nОГОНЬ — стрельба · вернитесь в ангар и ДЕЙСТВИЕ — уход");
}
function raidLeave(msg,lostShare){
  const S=G.raid;if(!S)return;
  const bag=S.bag;
  /* смерть отнимает часть добытого, а не прогресс: лут — единственная ставка */
  if(lostShare>0){
    bag.tech=Math.floor(bag.tech*(1-lostShare));
    bag.data=Math.floor(bag.data*(1-lostShare));
    bag.parts=bag.parts.slice(0,Math.max(0,Math.floor(bag.parts.length*(1-lostShare))));
  }
  if(bag.tech>0)addRes("techcomp",bag.tech);
  if(bag.data>0)G.data+=bag.data;
  for(const p of bag.parts)addPart(p);
  G.raid=null;G.mode="system";
  G.hull=Math.max(1,G.hull);
  /* если в этом секторе пираты держат ваших людей — штурм освобождает их даром.
     Выкуп остаётся вариантом для тех, кому лень лететь; это и есть выбор */
  if(lostShare<=0)crewFreeHostagesAt(G.sx,G.sy);
  /* разбитая база гасит очаг: наступление вокруг замирает на сутки */
  if(lostShare<=0)occSuppress(G.sx,G.sy);
  saveGame(true);
  tell(lostShare>0?"warn":"kill",msg+" · техкомпонентов "+bag.tech+", данных "+bag.data+
    (bag.parts.length?", частей "+bag.parts.length:""),
    msg+"\nтехкомпоненты "+bag.tech+"\nданные "+bag.data);
}
/* ══════════════ обновление ══════════════ */
function updateRaid(dt){
  const S=G.raid,R=S.R,st=stat();
  /* поворот и ход по сетке: коллизия — проверка клетки, ничего сложнее не нужно */
  if(keys.left)S.a-=.045*dt;
  if(keys.right)S.a+=.045*dt;
  const spd=(keys.thrust?1:0)-(keys.brake?.6:0);
  const nx=S.x+Math.sin(S.a)*spd*3.1*dt, nz=S.z+Math.cos(S.a)*spd*3.1*dt;
  if(!raidSolidAt(R,nx,S.z))S.x=nx;
  if(!raidSolidAt(R,S.x,nz))S.z=nz;
  /* высота пола: пандус поднимает плавно, поэтому переход на антресоль виден */
  const wantY=raidFloorAt(R,S.x,S.z);
  S.y+=clamp(wantY-S.y,-4*dt,4*dt);
  S.walkPhase+=Math.abs(spd)*.2*dt;
  if(S.cool>0)S.cool-=dt;
  if(S.hurt>0)S.hurt-=dt;
  if(S.flash>0)S.flash-=dt;
  /* оружие берётся из установленной части: собранный корабль решает, чем воюешь */
  if(keys.fire&&S.cool<=0&&st.armed&&S.ammo>0){
    S.cool=Math.max(7,st.cool*.5);S.flash=6;S.ammo--;
    S.shots.push({x:S.x,z:S.z,vx:Math.sin(S.a)*9,vz:Math.cos(S.a)*9,life:60,dmg:st.dmg,mine:true});
    sfx("shot",{f:520,v:.4});
  }
  for(let i=S.shots.length-1;i>=0;i--){
    const sh=S.shots[i];
    sh.x+=sh.vx*dt;sh.z+=sh.vz*dt;sh.life-=dt;
    if(sh.life<=0||raidSolidAt(R,sh.x,sh.z))S.shots.splice(i,1);
  }
  /* враги: идут на шум, стреляют с дистанции, за стеной не видят */
  for(const f of S.foes){
    if(f.hp<=0)continue;
    const K=FOE_KINDS[f.kind]||FOE_KINDS.grunt;
    const dx=S.x-f.x,dz=S.z-f.z,d=Math.hypot(dx,dz)||1;
    const see=d<760&&raidLineOfSight(R,f.x,f.z,S.x,S.z);
    if(see)f.aware=true;
    if(f.aware){
      f.a=Math.atan2(dx,dz);
      /* налётчик прёт вплотную, тяжёлый держит дистанцию — разница видна в бою */
      const keep=f.kind==="rusher"?40:190;
      if(d>keep&&see){
        const nfx=f.x+dx/d*K.speed*dt, nfz=f.z+dz/d*K.speed*dt;
        if(!raidSolidAt(R,nfx,f.z))f.x=nfx;
        if(!raidSolidAt(R,f.x,nfz))f.z=nfz;
      }
      if(f.cool>0)f.cool-=dt;
      if(see&&d<K.range&&f.cool<=0){
        f.cool=K.cool;
        S.shots.push({x:f.x,z:f.z,vx:dx/d*7,vz:dz/d*7,life:70,dmg:K.dmg+S.level*2,mine:false});
        sfx("shot",{f:f.kind==="heavy"?200:280,v:.28});
      }
    }
    f.bob+=.05*dt;
  }
  /* расходники подбираются проходом насквозь — останавливаться незачем */
  for(const P of S.picks){
    if(P.taken||Math.hypot(P.x-S.x,P.z-S.z)>52)continue;
    P.taken=true;sfx("ui",{f:640,to:960,d:.14,v:.3});
    if(P.kind==="medkit"){S.suit=Math.min(100,S.suit+34);say("Аптечка\nскафандр "+Math.round(S.suit)+"%");}
    else if(P.kind==="armor"){S.armor=Math.min(.5,S.armor+.18);say("Бронепластина\nурон −"+Math.round(S.armor*100)+"%");}
    else{S.ammo+=30;say("Боезапас +30\nвсего "+S.ammo);}
  }
  /* попадания: пуля против круга — этого достаточно на таких скоростях */
  for(let i=S.shots.length-1;i>=0;i--){
    const sh=S.shots[i];
    if(sh.mine){
      for(const f of S.foes){
        if(f.hp<=0)continue;
        if(Math.hypot(f.x-sh.x,f.z-sh.z)<34){
          f.hp-=sh.dmg;S.shots.splice(i,1);
          if(f.hp<=0){
            logAdd("kill","На абордаже: "+(FOE_KINDS[f.kind]||FOE_KINDS.grunt).ru+" уничтожен");
            S.bag.data+=f.boss?12:3;
            nodeDrop("в рейде на базу",sysDanger(G.sx,G.sy)+(f.baron?.5:0),
              hashi(f.seed,0x9D,Date.now()&0xffff),f.baron?1:0);
            /* редкость логова (12m-rare): только на бароне, ключ — сама система,
               так что у логова каждого сектора своя, стабильная */
            if(f.baron&&typeof rareTake==="function")rareTake("lair",hashi(G.sx,G.sy,0x1A18));
            sfx("boom",{v:.4});
          }else sfx("hit",{v:.3});
          break;
        }
      }
    }else if(Math.hypot(S.x-sh.x,S.z-sh.z)<30){
      S.shots.splice(i,1);
      /* здоровье — скафандр, ровно как в шахте */
      S.suit-=sh.dmg*st.suitWear*(1-S.armor);S.hurt=10;sfx("hit",{v:.45});
      if(S.suit<=0){raidLeave("Скафандр пробит · аварийная эвакуация",.5);return;}
    }
  }
  /* лут и выход */
  let near=null;
  for(const L of S.loot){
    if(L.taken)continue;
    if(Math.hypot(L.x-S.x,L.z-S.z)<60){near=L;break;}
  }
  const atExit=Math.hypot(S.exit[0]-S.x,S.exit[1]-S.z)<70;
  const alive=S.foes.filter(f=>f.hp>0).length;
  if(near){
    G.prompt="СКАФАНДР "+Math.round(S.suit)+"% · ДЕЙСТВИЕ — ВСКРЫТЬ КОНТЕЙНЕР";
    if(actEdge){
      near.taken=true;
      if(near.kind==="part"){
        const p=genPart(near.seed,1+Math.min(2,S.level));
        S.bag.parts.push(p);
        tell("","Найдена часть: "+p.name,"Найдено\n"+p.name);
      }else if(near.kind==="tech"){
        const n=2+Math.floor(rng(near.seed)()*4)+S.level;
        S.bag.tech+=n;
        tell("","Найдены техкомпоненты ×"+n,"Техкомпоненты ×"+n);
      }else{
        const n=8+Math.floor(rng(near.seed)()*14);
        S.bag.data+=n;
        tell("","Данные с терминала +"+n,"Данные +"+n);
      }
    }
  }else if(atExit){
    G.prompt="СКАФАНДР "+Math.round(S.suit)+"% · АНГАР · ДЕЙСТВИЕ — УХОД С ДОБЫЧЕЙ"+
      "\nв сумке: техкомпонентов "+S.bag.tech+", данных "+S.bag.data+
      (S.bag.parts.length?", частей "+S.bag.parts.length:"")+
      (alive?"\nна базе ещё "+alive+" стволов":"\nбаза зачищена");
    if(actEdge){raidLeave(alive?"Уход с базы":"База зачищена",0);return;}
  }else{
    G.prompt="СКАФАНДР "+Math.round(S.suit)+"% · ЗАРЯДОВ "+S.ammo+
      (S.armor>0?" · БРОНЯ −"+Math.round(S.armor*100)+"%":"")+" · ЖИВЫХ "+alive+
      "\nтехкомпонентов "+S.bag.tech+" · данных "+S.bag.data+
      (!st.armed?"\nОРУЖИЯ НЕТ — ПОСТАВЬТЕ ПУШКУ НА КОРАБЛЬ":
        (S.ammo<=0?"\nЗАРЯДЫ КОНЧИЛИСЬ — ИЩИТЕ БОЕЗАПАС НА СКЛАДЕ":""));
  }
}
/* видимость по сетке: шаг вдоль луча, дёшево и предсказуемо */
function raidLineOfSight(R,x0,z0,x1,z1){
  const d=Math.hypot(x1-x0,z1-z0)||1,n=Math.ceil(d/40);
  for(let i=1;i<n;i++){
    const t=i/n;
    if(raidSolidAt(R,x0+(x1-x0)*t,z0+(z1-z0)*t))return false;
  }
  return true;
}
/* ══════════════ рисование: пол → стены → объекты → эффекты ══════════════ */
function drawRaid(){
  const S=G.raid,R=S.R;
  ctx.fillStyle="#04060a";ctx.fillRect(0,0,W,H);
  /* камера от третьего лица: позади и выше, коллидится со стеной и подтягивается */
  let back=150;
  for(let t=back;t>30;t-=15){
    const cx=S.x-Math.sin(S.a)*t, cz=S.z-Math.cos(S.a)*t;
    if(!raidSolidAt(R,cx,cz)){back=t;break;}
  }
  const cam=[S.x-Math.sin(S.a)*back, 78+S.y, S.z-Math.cos(S.a)*back];
  const fwd=[Math.sin(S.a),-.16,Math.cos(S.a)];
  const fl=Math.hypot(fwd[0],fwd[1],fwd[2]);fwd[0]/=fl;fwd[1]/=fl;fwd[2]/=fl;
  const right=[Math.cos(S.a),0,-Math.sin(S.a)];
  const up=[right[1]*fwd[2]-right[2]*fwd[1],right[2]*fwd[0]-right[0]*fwd[2],right[0]*fwd[1]-right[1]*fwd[0]];
  const F=Math.min(W,H)*.95;
  function proj(px,py,pz){
    const vx=px-cam[0],vy=py-cam[1],vz=pz-cam[2];
    const zc=vx*fwd[0]+vy*fwd[1]+vz*fwd[2];
    if(zc<8)return null;
    return {x:W/2+(vx*right[0]+vy*right[1]+vz*right[2])*F/zc,
            y:H/2-(vx*up[0]+vy*up[1]+vz*up[2])*F/zc, z:zc};
  }
  const polys=[];
  /* Стена одним прямоугольником одного тона — плоская наклейка. Делим её по
     высоте надвое: низ светлее, верх уходит в темноту под потолком. Это
     дешёвая подделка вместо освещения, но именно она даёт отсеку объём. */
  function wall(a,b,c,d,col,li){
    const m0=[a[0],(a[1]+b[1])/2,a[2]], m1=[d[0],(c[1]+d[1])/2,d[2]];
    quad(a,m0,m1,d,col,li*1.08,true);
    quad(m0,b,c,m1,col,li*.72,true);
  }
  function quad(a,b,c,d,col,li,edge,emis){
    const A=proj(a[0],a[1],a[2]),B=proj(b[0],b[1],b[2]),
          C=proj(c[0],c[1],c[2]),D=proj(d[0],d[1],d[2]);
    if(!A||!B||!C||!D)return;
    polys.push({p:[A,B,C,D],d:(A.z+B.z+C.z+D.z)/4,col,li,edge,emis});
  }
  /* Коробка из пяти граней (низ не виден): всё крупное железо в ангаре собрано
     из них — контейнеры, опоры, катер. Ярче светится верх, бока темнее, и
     этого хватает, чтобы предмет стоял в пространстве, а не лежал наклейкой. */
  function box(bx,by,bz,bw,bh,bd,col,li){
    const x0=bx-bw/2,x1=bx+bw/2,z0=bz-bd/2,z1=bz+bd/2,y1=by+bh;
    quad([x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1],col,li*1.15,true);   // верх
    quad([x0,by,z0],[x0,y1,z0],[x1,y1,z0],[x1,by,z0],col,li*.95,true);
    quad([x1,by,z1],[x1,y1,z1],[x0,y1,z1],[x0,by,z1],col,li*.72,true);
    quad([x0,by,z1],[x0,y1,z1],[x0,y1,z0],[x0,by,z0],col,li*.82,true);
    quad([x1,by,z0],[x1,y1,z0],[x1,y1,z1],[x1,by,z1],col,li*.82,true);
  }
  const c0=Math.floor(S.x/RCELL),r0=Math.floor(S.z/RCELL);
  const rad=Math.round(9*G.opts.gfx.draw);
  for(let rr=r0-rad;rr<=r0+rad;rr++)for(let c=c0-rad;c<=c0+rad;c++){
    if(c<0||rr<0||c>=RAID_N||rr>=RAID_N)continue;
    if(raidSolid(R,c,rr))continue;
    const x0=c*RCELL,z0=rr*RCELL,x1=x0+RCELL,z1=z0+RCELL;
    const K=R.kind[raidIdx(c,rr)];
    const base=RAID_ROOMS[K]?RAID_ROOMS[K].col:[40,44,52];
    const h=raidFloorH(R,c,rr);
    /* затухание с расстоянием заменяет освещение; фонарь на шлеме добавляет
       света прямо по курсу, а аварийные лампы дышат по всему отсеку */
    const cxw=x0+RCELL/2,czw=z0+RCELL/2;
    const dd=Math.hypot(cxw-S.x,czw-S.z);
    const ang=Math.abs(angDiff(Math.atan2(cxw-S.x,czw-S.z),S.a));
    const lamp=K==="reactor"?.16*Math.sin(G.t*.09+c):(K==="corr"?.1*Math.sin(G.t*.05+rr):0);
    const torch=clamp((1-ang/1.1),0,1)*clamp(1-dd/620,0,1)*.5;
    const li=clamp(.95-dd/(RCELL*9)+torch+lamp,.1,1.15);
    quad([x0,h,z0],[x1,h,z0],[x1,h,z1],[x0,h,z1],base,li*.9,false);
    quad([x0,RAID_H,z1],[x1,RAID_H,z1],[x1,RAID_H,z0],[x0,RAID_H,z0],base,li*.28,false);   // потолок темнее пола: свет идёт сверху вниз
    /* стены рисуем только там, где соседняя клетка — порода */
    if(raidSolid(R,c,rr-1))wall([x0,h,z0],[x0,RAID_H,z0],[x1,RAID_H,z0],[x1,h,z0],base,li);
    if(raidSolid(R,c,rr+1))wall([x1,h,z1],[x1,RAID_H,z1],[x0,RAID_H,z1],[x0,h,z1],base,li);
    if(raidSolid(R,c-1,rr))wall([x0,h,z1],[x0,RAID_H,z1],[x0,RAID_H,z0],[x0,h,z0],base,li*.92);
    if(raidSolid(R,c+1,rr))wall([x1,h,z0],[x1,RAID_H,z0],[x1,RAID_H,z1],[x1,h,z1],base,li*.92);
    /* потолочная лампа: единственный видимый источник света в отсеке. Раньше
       свет был только числом в li — на экране светильников не было вовсе */
    if(K==="corr"||K==="reactor"||K==="hangar"){
      const em=K==="reactor"?[120,220,230]:[255,232,196];
      const f=K==="reactor"?(.5+Math.sin(G.t*.09+c)*.22):(K==="corr"?.62:.42);
      /* полоса узкая и короткая: во всю клетку она под острым углом заливала
         светом полкадра и потолок читался ярче пола */
      quad([x0+RCELL*.45,RAID_H-3,z0+RCELL*.3],[x0+RCELL*.55,RAID_H-3,z0+RCELL*.3],
           [x0+RCELL*.55,RAID_H-3,z1-RCELL*.3],[x0+RCELL*.45,RAID_H-3,z1-RCELL*.3],em,f,false,1);
    }
    /* ── ангар: крупные предметы ──
       Большое помещение без обстановки — серый зал: пол, потолок и дальняя
       стена сходятся в один тон, зацепиться не за что. Ставим то, что стоит
       в настоящем ангаре, по устойчивому расчёту от координат клетки: контейнеры
       у стен, фермы и кран-балка под потолком, разбитый катер, бочки. */
    if(K==="hangar"){
      const HR=rng(hashi(c,rr,1301)),pick=HR();
      const px=x0+RCELL/2,pz=z0+RCELL/2;
      /* Всё крупное ставим ТОЛЬКО в клетках у стены. Во-первых, в проходе оно
         оказывалось фантомом: столкновений у обстановки нет, и игрок шёл сквозь
         ферму. Во-вторых, лес колонн посреди пролёта закрывал сам зал —
         предметы должны обрамлять пространство, а не заполнять его. */
      const near=raidSolid(R,c-1,rr)||raidSolid(R,c+1,rr)||raidSolid(R,c,rr-1)||raidSolid(R,c,rr+1);
      if(!near){
        if((c*5+rr*3)%7===0)box(px,RAID_H-12,pz,RCELL,5,8,[52,58,68],li*.85);  // кран-балка пролёта
      }else if(pick<.55){
        /* штабель контейнеров у стены: второй ярус со сдвигом, иначе выходит куб */
        const n=1+((HR()*2.4)|0);
        for(let i=0;i<n;i++){
          const bw=44,bd=30;
          box(px+(HR()-.5)*12,h+i*22,pz+(HR()-.5)*12,bw,21,bd,
              [56+i*6,62+i*4,72],li*(1-i*.04));
        }
      }else if(pick<.68){
        /* ферма от пола до потолка с раскосами: вертикаль, по которой глаз
           меряет высоту зала */
        box(px,h,pz,10,RAID_H-h,10,[64,70,80],li*.9);
        for(let i=0;i<3;i++)box(px,h+12+i*28,pz,26,4,4,[70,76,86],li*.8);
      }else if(pick<.80){
        /* разбитый катер: корпус под наклоном, крыло, обломок сопла */
        box(px,h+2,pz,70,16,26,[62,58,58],li*.95);
        box(px-10,h+18,pz,34,10,20,[70,66,66],li);
        box(px+30,h+4,pz+14,20,4,26,[54,52,54],li*.8);
        box(px-40,h,pz-10,14,8,14,[46,44,46],li*.7);
      }else if(pick<.9){
        /* бочки и мелочь: пол не должен быть стерильным */
        for(let i=0;i<4;i++)
          box(px+(HR()-.5)*54,h,pz+(HR()-.5)*54,13,17,13,[58,54,46],li*.9);
      }
      /* тельфер на балке — единственное, что висит над проходом */
      if(near&&(c+rr)%5===0)box(px+((c*37)%40)-20,RAID_H-26,pz,14,13,14,[68,74,84],li*.9);
    }
    /* перепад высоты к соседу — вертикальный борт антресоли или пандуса */
    const sideCol=[base[0]+14,base[1]+12,base[2]+10];
    const hn=raidFloorH(R,c,rr-1),hs=raidFloorH(R,c,rr+1),
          hw=raidFloorH(R,c-1,rr),he=raidFloorH(R,c+1,rr);
    if(!raidSolid(R,c,rr-1)&&hn<h)quad([x0,hn,z0],[x0,h,z0],[x1,h,z0],[x1,hn,z0],sideCol,li,true);
    if(!raidSolid(R,c,rr+1)&&hs<h)quad([x1,hs,z1],[x1,h,z1],[x0,h,z1],[x0,hs,z1],sideCol,li,true);
    if(!raidSolid(R,c-1,rr)&&hw<h)quad([x0,hw,z1],[x0,h,z1],[x0,h,z0],[x0,hw,z0],sideCol,li,true);
    if(!raidSolid(R,c+1,rr)&&he<h)quad([x1,he,z0],[x1,h,z0],[x1,h,z1],[x1,he,z1],sideCol,li,true);
    /* дверной проём: клетка коридора у самой комнаты получает косяк */
    if(K==="corr"){
      for(const [dc,dr] of [[0,-1],[0,1],[-1,0],[1,0]]){
        const nk=(!raidSolid(R,c+dc,rr+dr))?R.kind[raidIdx(c+dc,rr+dr)]:null;
        if(!nk||nk==="corr")continue;
        const jamb=[90,70,60];
        if(dr){
          const zz=dr<0?z0:z1;
          quad([x0,h,zz],[x0,h+14,zz],[x1,h+14,zz],[x1,h,zz],jamb,li*.8,true);
        }else{
          const xx=dc<0?x0:x1;
          quad([xx,h,z0],[xx,h+14,z0],[xx,h+14,z1],[xx,h,z1],jamb,li*.8,true);
        }
      }
    }
  }
  polys.sort((a,b)=>b.d-a.d);
  /* Дымка расстояния: без неё дальняя геометрия просто темнеет, и глубина
     не читается. Смешиваем цвет грани с цветом взвешенной пыли тем сильнее,
     чем дальше грань. Светильники дымкой не гасим — они и должны пробиваться */
  const FOG=[9,11,17], FAR=RCELL*10;
  for(const P of polys){
    const [r8,g8,b8]=P.col;
    const k=P.emis?0:clamp((P.d-RCELL*1.5)/FAR,0,.85);
    const mix=(v,f)=>Math.round(v*P.li*(1-k)+f*k);
    ctx.fillStyle="rgb("+mix(r8,FOG[0])+","+mix(g8,FOG[1])+","+mix(b8,FOG[2])+")";
    ctx.beginPath();ctx.moveTo(P.p[0].x,P.p[0].y);
    for(let i=1;i<P.p.length;i++)ctx.lineTo(P.p[i].x,P.p[i].y);
    ctx.closePath();ctx.fill();
    if(P.edge&&P.li>.3){
      ctx.strokeStyle="rgba(0,0,0,.35)";ctx.lineWidth=1;ctx.stroke();
    }
  }
  /* объекты: контейнеры, враги, астронавт — плоскими значками по проекции */
  const marks=[];
  for(const L of S.loot){
    if(L.taken)continue;
    const p=proj(L.x,22,L.z);if(!p)continue;
    marks.push({p,kind:"loot",o:L});
  }
  for(const P of S.picks){
    if(P.taken)continue;
    const p=proj(P.x,raidFloorAt(R,P.x,P.z)+16,P.z);if(!p)continue;
    marks.push({p,kind:"pick",o:P});
  }
  for(const f of S.foes){
    if(f.hp<=0)continue;
    const p=proj(f.x,raidFloorAt(R,f.x,f.z)+40+Math.sin(f.bob)*3,f.z);if(!p)continue;
    marks.push({p,kind:"foe",o:f});
  }
  const me=proj(S.x,S.y+42,S.z);
  if(me)marks.push({p:me,kind:"me",o:S});
  marks.sort((a,b)=>b.p.z-a.p.z);
  for(const m of marks){
    const s=clamp(2200/m.p.z,.25,3);
    if(m.kind==="loot"){
      ctx.fillStyle="rgba(242,178,92,.9)";ctx.strokeStyle="rgba(255,230,170,.9)";ctx.lineWidth=1.5;
      ctx.beginPath();ctx.rect(m.p.x-11*s,m.p.y-9*s,22*s,18*s);ctx.fill();ctx.stroke();
      ctx.fillStyle=(Math.sin(G.t*.14)>0)?"#7fe6d8":"rgba(127,230,216,.3)";
      ctx.beginPath();ctx.arc(m.p.x,m.p.y-13*s,2.4*s,0,TAU);ctx.fill();
    }else if(m.kind==="pick"){
      const P=m.o,C=PICKUPS[P.kind];
      ctx.save();ctx.translate(m.p.x,m.p.y+Math.sin(G.t*.06)*2*s);ctx.scale(s,s);
      ctx.fillStyle=C.col;ctx.globalAlpha=.85;
      ctx.beginPath();ctx.rect(-7,-7,14,14);ctx.fill();
      ctx.globalAlpha=1;ctx.strokeStyle="rgba(255,255,255,.8)";ctx.lineWidth=1.4;
      if(P.kind==="medkit"){ctx.beginPath();ctx.moveTo(-4,0);ctx.lineTo(4,0);
        ctx.moveTo(0,-4);ctx.lineTo(0,4);ctx.stroke();}
      else if(P.kind==="armor"){ctx.beginPath();ctx.moveTo(0,-5);ctx.lineTo(5,-1);
        ctx.lineTo(0,5);ctx.lineTo(-5,-1);ctx.closePath();ctx.stroke();}
      else{ctx.beginPath();ctx.rect(-3,-4,6,8);ctx.stroke();}
      ctx.restore();
    }else if(m.kind==="foe"){
      const f=m.o,K=FOE_KINDS[f.kind]||FOE_KINDS.grunt;
      ctx.save();ctx.translate(m.p.x,m.p.y);ctx.scale(s*.9,s*.9);
      drawFoeBody(f,K);
      ctx.restore();
      const w=(f.baron?52:34)*s,hp=clamp(f.hp/f.hpMax,0,1);
      ctx.fillStyle="rgba(0,0,0,.6)";ctx.fillRect(m.p.x-w/2,m.p.y-26*s,w,f.baron?6:4);
      ctx.fillStyle=f.baron?"rgba(255,140,90,.98)":
                   (f.boss?"rgba(255,90,70,.95)":"rgba(242,178,92,.9)");
      ctx.fillRect(m.p.x-w/2,m.p.y-26*s,w*hp,f.baron?6:4);
      if(f.baron){
        ctx.fillStyle="rgba(255,180,120,.95)";ctx.font="9px ui-monospace,monospace";
        ctx.textAlign="center";
        ctx.fillText("БАРОН",m.p.x,m.p.y-31*s);
      }
    }else{
      ctx.save();ctx.translate(m.p.x,m.p.y+10*s);ctx.scale(s*.8,s*.8);
      drawAstronaut({phase:S.walkPhase,amp:keys.thrust||keys.brake?1:0,walk:false,air:false});
      ctx.restore();
    }
  }
  /* ── воздух отсека ──
     Пыль в луче нашлемного фонаря: три десятка частиц, привязанных к сетке
     вокруг игрока, чтобы они не «ехали» вместе с камерой. Без взвеси объём
     пустого коридора ничем не выдаёт себя. */
  {
    const gx0=Math.round(S.x/RCELL),gz0=Math.round(S.z/RCELL);
    ctx.fillStyle="rgba(210,225,240,.5)";
    for(let i=0;i<34;i++){
      const hh=hashi(gx0*31+i,gz0*17+i*7,0xD05);
      const px=(gx0-1.5)*RCELL+((hh>>>3)&255)/255*RCELL*3;
      const pz=(gz0-1.5)*RCELL+((hh>>>11)&255)/255*RCELL*3;
      const py=14+((hh>>>19)&127)/127*(RAID_H-24)+Math.sin(G.t*.03+i)*4;
      const p=proj(px,py,pz);if(!p)continue;
      const dd=Math.hypot(px-S.x,pz-S.z);
      ctx.globalAlpha=clamp(.28-dd/1400,0,.28);
      const s2=clamp(1600/p.z,.4,2.4);
      ctx.fillRect(p.x,p.y,s2,s2);
    }
    ctx.globalAlpha=1;
  }
  /* выстрелы и вспышки — последними, поверх всего */
  for(const sh of S.shots){
    const sy2=raidFloorAt(R,sh.x,sh.z)+40;
    const p=proj(sh.x,sy2,sh.z),q=proj(sh.x-sh.vx*2,sy2,sh.z-sh.vz*2);
    if(!p||!q)continue;
    ctx.strokeStyle=sh.mine?"rgba(127,230,216,.95)":"rgba(255,120,90,.95)";
    ctx.lineWidth=Math.max(1,2200/p.z*.06);
    ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(p.x,p.y);ctx.stroke();
  }
  /* ── свет шлема и тьма по краям ──
     Фонарь до сих пор жил только числом в li: сцена была равномерно освещена
     ниоткуда. Тёплое пятно по курсу и глубокая виньетка по краям делают
     из этого чужую базу, в которую влезли с фонарём. */
  {
    const tg=ctx.createRadialGradient(W/2,H*.52,0,W/2,H*.52,Math.min(W,H)*.5);
    tg.addColorStop(0,"rgba(255,238,205,.10)");
    tg.addColorStop(1,"rgba(255,238,205,0)");
    ctx.save();ctx.globalCompositeOperation="lighter";
    ctx.fillStyle=tg;ctx.fillRect(0,0,W,H);ctx.restore();
    const vg=ctx.createRadialGradient(W/2,H*.5,Math.min(W,H)*.28,W/2,H*.5,Math.max(W,H)*.72);
    vg.addColorStop(0,"rgba(0,0,0,0)");vg.addColorStop(1,"rgba(0,0,0,.62)");
    ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
  }
  if(S.hurt>0){
    ctx.fillStyle="rgba(255,50,40,"+(S.hurt/10*.28).toFixed(2)+")";ctx.fillRect(0,0,W,H);
  }
  /* приборы: скафандр — он же здоровье */
  const bw=Math.min(W-40,260),bx=20,by=H-40;
  ctx.fillStyle="rgba(6,10,16,.72)";ctx.fillRect(bx-6,by-6,bw+12,18);
  ctx.fillStyle=S.suit>40?"rgba(127,230,216,.85)":"rgba(255,90,70,.9)";
  ctx.fillRect(bx,by,bw*clamp(S.suit/100,0,1),8);
  ctx.fillStyle="rgba(242,178,92,.8)";ctx.font="9px ui-monospace,monospace";ctx.textAlign="left";
  ctx.fillText("СКАФАНДР "+Math.round(S.suit)+"% · ЗАРЯДОВ "+S.ammo+
    (S.armor>0?" · БРОНЯ "+Math.round(S.armor*100)+"%":""),bx,by+18);
}
/* ── тело противника ──
   Абордаж — единственное место игры, где враг стоит на ногах в полный рост,
   а рисовался овалом с кружком-головой: на фоне отсеков с их сваркой и
   решётками это читалось фишкой из настолки. Здесь тело по тем же правилам,
   что фигуры в кантине и рубке: плечи шире таза, ноги врозь с разным тоном,
   оружие в руках, шлем с забралом. Барон отличается не размером, а силуэтом —
   плащ, гребень на шлеме и тяжёлый ствол на сошке. */
function drawFoeBody(f,K){
  const col=hex2rgb(K.col),r=K.r;
  const body=rgba(col,.95),dark=rgba(mixc(col,[8,12,18],.6),.96);
  const sc=f.baron?1.35:1;
  ctx.scale(sc,sc);
  const bob=Math.sin((f.bob||0)+G.t*.05)*.8;
  ctx.fillStyle="rgba(0,0,0,.45)";                 // тень под ногами
  ctx.beginPath();ctx.ellipse(0,r*1.5,r*1.1,r*.3,0,0,TAU);ctx.fill();
  if(f.baron){
    /* Плащ — трапеция с изломом по низу, а не эллипс: округлый «мешок» съедал
       силуэт и делал барона снеговиком. Рисуется ДО ног, поэтому ноги видны. */
    ctx.fillStyle=rgba(mixc(col,[18,10,14],.55),.92);
    ctx.beginPath();
    // плащ узкий и с вырезом: широкий закрывал ноги, и барон читался конусом
    ctx.moveTo(-r*.62,-r*.85);ctx.lineTo(-r*1.05,r*1.2);ctx.lineTo(-r*.62,r*1.05);
    ctx.lineTo(-r*.5,r*.2);ctx.lineTo(r*.5,r*.2);ctx.lineTo(r*.62,r*1.05);
    ctx.lineTo(r*1.05,r*1.2);ctx.lineTo(r*.62,-r*.85);ctx.closePath();ctx.fill();
    ctx.strokeStyle=rgba(mixc(col,[255,220,190],.4),.35);ctx.lineWidth=r*.07;
    ctx.stroke();
  }
  ctx.fillStyle=dark;                              // ноги длиннее: тело было пеньком
  ctx.fillRect(r*.14,r*.45,r*.4,r*1.35);
  ctx.fillStyle=rgba(mixc(col,[8,12,18],.3),.96);
  ctx.fillRect(-r*.54,r*.45,r*.4,r*1.35);
  ctx.fillStyle="rgba(0,0,0,.35)";                 // подошвы
  ctx.fillRect(r*.1,r*1.68,r*.48,r*.16);ctx.fillRect(-r*.58,r*1.68,r*.48,r*.16);
  ctx.fillStyle=body;                              // торс трапецией
  ctx.beginPath();
  ctx.moveTo(-r*.62,-r*.75+bob);ctx.lineTo(r*.62,-r*.75+bob);
  ctx.lineTo(r*.82,-r*.15+bob);ctx.lineTo(r*.56,r*.55);ctx.lineTo(-r*.56,r*.55);
  ctx.lineTo(-r*.82,-r*.15+bob);ctx.closePath();ctx.fill();
  const sg=ctx.createLinearGradient(-r,0,r,0);     // объём
  sg.addColorStop(0,"rgba(255,255,255,.12)");sg.addColorStop(1,"rgba(0,0,0,.3)");
  ctx.fillStyle=sg;ctx.fill();
  ctx.fillStyle="rgba(0,0,0,.3)";                  // ремень
  ctx.fillRect(-r*.6,r*.12,r*1.2,r*.16);
  /* оружие: у тяжёлого и барона — ствол на сошке, у прочих короткий автомат */
  ctx.strokeStyle=dark;ctx.lineWidth=r*.28;ctx.lineCap="round";
  // обе руки: одна на рукояти, вторая на цевье — раньше ствол торчал из плеча
  ctx.beginPath();ctx.moveTo(r*.6,-r*.5+bob);ctx.lineTo(r*.85,r*.05);ctx.stroke();
  ctx.beginPath();ctx.moveTo(-r*.55,-r*.45+bob);ctx.lineTo(r*.1,r*.1);
  ctx.lineTo(r*1.15,-r*.02);ctx.stroke();
  ctx.lineCap="butt";
  ctx.fillStyle="rgba(40,46,56,.98)";
  const gl=f.baron||f.kind==="heavy"?r*1.5:r*.95;
  ctx.fillRect(r*.75,-r*.1,gl,r*.22);
  if(f.baron||f.kind==="heavy"){                   // сошка под стволом
    ctx.strokeStyle="rgba(40,46,56,.9)";ctx.lineWidth=r*.1;
    ctx.beginPath();ctx.moveTo(r*1.6,r*.1);ctx.lineTo(r*1.4,r*.6);
    ctx.moveTo(r*1.6,r*.1);ctx.lineTo(r*1.9,r*.6);ctx.stroke();
  }
  ctx.fillStyle=dark;                              // шея
  ctx.fillRect(-r*.16,-r*.95+bob,r*.32,r*.22);
  ctx.fillStyle="#1b2229";                         // шлем: голова была втрое велика
  ctx.beginPath();ctx.arc(0,-r*1.18+bob,r*.5,0,TAU);ctx.fill();
  if(f.baron){                                     // гребень: узкий и с завалом назад
    ctx.fillStyle=rgba(mixc(col,[255,220,180],.55),.95);
    ctx.beginPath();
    ctx.moveTo(r*.05,-r*1.72+bob);ctx.lineTo(r*.14,-r*1.62+bob);
    ctx.lineTo(r*.12,-r*1.35+bob);ctx.lineTo(-r*.26,-r*1.45+bob);ctx.closePath();ctx.fill();
    // наплечники: ранг виден плечами, а не размером
    ctx.fillStyle=rgba(mixc(col,[255,225,190],.35),.95);
    ctx.beginPath();ctx.ellipse(-r*.7,-r*.6+bob,r*.26,r*.16,-.4,0,TAU);ctx.fill();
    ctx.beginPath();ctx.ellipse(r*.7,-r*.6+bob,r*.26,r*.16,.4,0,TAU);ctx.fill();
  }
  ctx.fillStyle=f.aware?"rgba(255,90,70,.95)":"rgba(255,200,120,.7)";
  ctx.fillRect(-r*.34,-r*1.28+bob,r*.68,r*.18);    // забрало-полоса, а не глаз-точка
}
