/* ══════════════ проба · дуэль (M901) ══════════════
   Бой измеряется, а не обсуждается. Стенд гоняет настоящий штурвал, стволы,
   роли пиратов и петлю выстрелов под Node: игрок по сценарию (стоит / только
   целится / пятится / заходит в корму / ходит по кругу) против одного-двух
   шакалов, ветерана, капитана — на трёх опасностях, на трёх сборках.
   Печатает таблицу: время до первого и последнего убийства, попадания из
   выстрелов, корпус и щит игрока, сколько прилетело, бегства, средняя
   дистанция, доля кадров с пустой шкалой. Это измеритель (DESIGN-game §8):
   цели M902 читаются из этой таблицы.

   Запуск: node test-node.js --only="проба · дуэль"   (FIGHT_QUICK=1 — один сценарий)
   Штурвал подменяется на время набора: сценарий пишет G.ctl сам, как писал бы
   стик (assist = «лети туда») или клавиши; нос с меткой идёт за меткой (D07). */
suite("проба · дуэль",{tier:"probe"},()=>{
  const QUICK=(globalThis.process&&globalThis.process.env&&globalThis.process.env.FIGHT_QUICK)?1:0;
  const TRACE=(globalThis.process&&globalThis.process.env&&globalThis.process.env.FIGHT_TRACE)?1:0;
  const PICK=(globalThis.process&&globalThis.process.env&&globalThis.process.env.FIGHT_PICK)?new RegExp(process.env.FIGHT_PICK):null;
  const FR=60,MAXF=120*FR;
  const helm0=helmTick,fire0=fireShot,hit0=hitShip,phit0=playerHit,wreck0=wreck,kill0=killPirate;
  let M=null,SCRIPT=null;
  /* сценарий пишет штурвал сам */
  helmTick=function(dt){
    const c=G.ctl||ctlReset(),sh=G.ship;
    c.head=null;c.headK=1;c.turn=0;c.tx=0;c.ty=0;c.brake=false;c.thrOnly=false;c.fire=false;c.msl=false;
    c.assist=false;c.ax=0;c.ay=0;c.slow=false;c.edge=false;c.headIdle=true;
    helmMarksClean();
    if(SCRIPT)SCRIPT(c,sh);
    if(G.marks.length){const p=G.marks[0];c.head=Math.atan2(p.y-sh.y,p.x-sh.x);c.headK=1;}
    c.src="keys";return c;
  };
  fireShot=function(x,y,ang,speed,dmg,mine,type,range){
    const o=ownerOf(mine);if(M)M[o==="player"?"shots":"foeShots"]++;
    return fire0(x,y,ang,speed,dmg,mine,type,range);
  };
  hitShip=function(p,s,raw){if(M&&s&&s.owner==="player")M.hits++;return hit0(p,s,raw);};
  playerHit=function(s){if(M)M.taken++;return phit0(s);};
  wreck=function(why){if(M)M.lost=1;G.hull=1;return false;};
  killPirate=function(p){if(M)M.kills++;return kill0(p);};
  const role0=pirateRoleTick;pirateRoleTick=function(p,dt,d,w){const r=role0(p,dt,d,w);if(TRACE&&r)console.log("  роль→true t"+G.t+" hull"+p.hull);if(TRACE&&G.t%60===30)console.log("  после роли vp"+Math.hypot(p.vx,p.vy).toFixed(1)+" r="+r);return r;};
  const nearest=()=>{let b=null,bd=1e9;for(const p of G.pirates){if(p.hull<=0)continue;const d=Math.hypot(p.x-G.ship.x,p.y-G.ship.y);if(d<bd){bd=d;b=p;}}return b;};
  const lock=()=>{const p=nearest();if(p&&G.marks[0]!==p)helmLock(p);return p;};
  const SCRIPTS={
    dummy:()=>{},
    turret:()=>{lock();},
    kiter:(c,sh)=>{const p=lock();if(!p)return;const dx=p.x-sh.x,dy=p.y-sh.y,d=Math.hypot(dx,dy)||1;c.assist=true;c.ax=-dx/d;c.ay=-dy/d;},
    flanker:(c,sh)=>{const p=lock();if(!p)return;const gx=p.x-Math.cos(p.a)*320,gy=p.y-Math.sin(p.a)*320;
      const dx=gx-sh.x,dy=gy-sh.y,d=Math.hypot(dx,dy)||1,k=Math.min(1,d/260);c.assist=true;c.ax=dx/d*k;c.ay=dy/d*k;},
    leaver:(c,sh)=>{const p=nearest();if(!p)return;const dx=p.x-sh.x,dy=p.y-sh.y,d=Math.hypot(dx,dy)||1;c.assist=true;c.ax=-dx/d;c.ay=-dy/d;},
    orbiter:(c,sh)=>{const p=lock();if(!p)return;const dx=p.x-sh.x,dy=p.y-sh.y,d=Math.hypot(dx,dy)||1;
      const ux=dx/d,uy=dy/d,rad=clamp((d-300)/200,-1,1);let ax=-uy*.8+ux*rad,ay=ux*.8+uy*rad;const m=Math.hypot(ax,ay)||1;
      c.assist=true;c.ax=ax/m;c.ay=ay/m;}
  };
  function spawnFoe(rank,danger,i,dist){
    const R=PIRATE_RANKS[rank],sh=G.ship,ang=-Math.PI/2+(i?(i&1?.5:-.5):0);
    const hp=(26+danger*70)*R.hull,seed=hashi(7,rank,i*977+1);
    G.pirates.push({x:sh.x+Math.cos(ang)*dist,y:sh.y+Math.sin(ang)*dist,vx:0,vy:0,a:ang+Math.PI,
      hull:hp,hullMax:hp,name:(R.pre?R.pre+" ":"")+"Проба-"+i,rank,seed,shipId:pirateShipId(seed),
      cool:0,aware:true,thrust:false,shield:hp*R.shield,shieldMax:hp*R.shield,shieldHit:0,
      shieldType:(PIRATE_LOADOUT[rank].shield||"solid"),deserter:0});
  }
  function run(hull,weapon,set,danger,script){
    resetWorld();
    G.sx=Math.round(danger*40);G.sy=0;G.sys=getSystem(G.sx,G.sy);
    G.shipId=hull;G.owned[hull]=true;G.mods.weapon=weapon;G.modsOwned.weapon=weapon;
    invalidateParts();
    const st=stat();G.hull=st.hullMax;G.shield=st.shieldMax;G.energy=st.energyMax;G.fuel=st.fuelMax||100;
    G.ship={x:0,y:-2600,vx:0,vy:0,a:-Math.PI/2,av:0,bank:0};
    G.pirates=[];G.shots=[];G.loot=[];G.marks=[];G.aim={};G.ap=null;G.orbit=null;
    if(!isFinite(G.t))G.t=0;
    for(let i=0;i<set.n;i++)spawnFoe(set.rank,danger,i,900);
    M={shots:0,foeShots:0,hits:0,taken:0,lost:0,first:-1,all:-1,fled:0,kills:0,dsum:0,dn:0,lowE:0,gone:0};
    SCRIPT=SCRIPTS[script];
    const n0=G.pirates.length;let f=0;
    for(;f<MAXF;f++){
      stepWorld(1);G.t+=1;
      const p=nearest();
      if(TRACE&&p&&f%60===0){const sh=G.ship;console.log("  t"+(f/60)+" d"+Math.round(Math.hypot(p.x-sh.x,p.y-sh.y))+" нос→цель "+(angDiff(Math.atan2(p.y-sh.y,p.x-sh.x),sh.a)*57.3).toFixed(0)+"° метки "+G.marks.length+" откат "+fireCool.toFixed(0)+" э"+Math.round(G.energy)+" hp"+Math.round(p.hull)+"/"+Math.round(p.hullMax)+" щ"+Math.round(p.shield||0)+" борт"+(angDiff(Math.atan2(sh.y-p.y,sh.x-p.x),p.a)*57.3).toFixed(0)+"° "+(p.rs?p.rs.st:"-")+" vp"+Math.hypot(p.vx,p.vy).toFixed(1)+" lim"+ROLE_LIM[p.rank|0]+" t"+G.t+" j"+(p.jumpT|0)+" aw"+(p.aware?1:0)+" выстр "+M.shots+" поп "+M.hits+" взято "+M.taken+" корп "+Math.round(G.hull));}
      if(p){M.dsum+=Math.hypot(p.x-G.ship.x,p.y-G.ship.y);M.dn++;}
      if(G.energy<EN_SHOT)M.lowE++;
      const alive=G.pirates.filter(q=>q.hull>0).length;
      if(M.first<0&&alive<n0)M.first=f;
      if(!alive){M.all=f;break;}
      if(M.lost)break;
      if(script==="leaver"&&p&&Math.hypot(p.x-G.ship.x,p.y-G.ship.y)>stat().see*2.4+200){M.gone=1;break;}
    }
    M.fled=n0-G.pirates.filter(q=>q.hull>0).length-M.kills;
    const st2=stat();
    return {hull,weapon,set:set.name,danger,script,
      first:M.first<0?"—":(M.first/FR).toFixed(1),all:M.all<0?"—":(M.all/FR).toFixed(1),
      hullPct:Math.round(100*G.hull/st2.hullMax),shield:Math.round(G.shield),
      shots:M.shots,hits:M.hits,hitPct:M.shots?Math.round(100*M.hits/M.shots):0,taken:M.taken,
      lost:M.lost,fled:M.fled,gone:M.gone|0,dist:M.dn?Math.round(M.dsum/M.dn):0,lowE:Math.round(100*M.lowE/Math.max(1,f)),frames:f};
  }
  const SETS=[{name:"1 шакал",rank:0,n:1},{name:"2 шакала",rank:0,n:2},{name:"ветеран",rank:1,n:1},{name:"капитан",rank:2,n:1}];
  const BUILDS=QUICK?[["strizh",1],["topor",3]]:[["strizh",1],["strizh",2],["vyuk",2],["topor",3]];
  const DANG=QUICK?[.5]:[.2,.5,.8];
  const SCR=QUICK?["turret","flanker","leaver"]:["dummy","turret","kiter","flanker","orbiter","leaver"];
  const rows=[];
  const st0=(()=>{resetWorld();G.mods.weapon=1;invalidateParts();return stat();})();
  console.log("дуэль: стоковый ствол w1 — урон "+st0.gun.dmg+" откат "+st0.gun.cool+" дальность "+st0.gun.range+
    " скорость "+st0.gun.speed+" конус "+st0.gun.cone+" наводка "+st0.gun.lead+" разброс "+st0.gun.spread+
    " · энергия "+st0.energyMax+"/"+st0.energyRegen+" · щит "+st0.shieldMax+" · видит "+st0.see);
  /* чем вооружён чужой: те же числа, что увидит игрок в бою */
  for(let rk=0;rk<4;rk++){resetWorld();G.sx=20;G.sy=0;const q={seed:7,rank:rk,hull:1,hullMax:1};
    console.log("  ранг "+rk+": "+PIRATE_LOADOUT[rk].guns.map(f=>{const g=foeGun(q,f);return f+" урон "+(+g.dmg).toFixed(1)+" дальн "+g.range+" откат "+(FOE_ARM_COOL[f]||60);}).join(" · ")+" · щит "+PIRATE_LOADOUT[rk].shield);}
  for(const [h,w] of BUILDS)for(const S of SETS)for(const d of DANG)for(const s of SCR){
    if(s==="dummy"&&d!==.5)continue;
    if(PICK&&!PICK.test(h+" w"+w+" "+S.name+" "+d+" "+s))continue;
    rows.push(run(h,w,S,d,s));
  }
  console.log("| сборка | против | опасн | сценарий | 1-й | все | корпус % | щит | выстр/попад (%) | прилетело | сбит | дист | пустая % |");
  console.log("|---|---|---|---|---|---|---|---|---|---|---|---|---|");
  for(const r of rows)console.log("| "+r.hull+" w"+r.weapon+" | "+r.set+" | "+r.danger+" | "+r.script+" | "+r.first+" | "+r.all+" | "+r.hullPct+" | "+r.shield+" | "+r.shots+"/"+r.hits+" ("+r.hitPct+") | "+r.taken+" | "+(r.lost?"ДА":(r.fled?"ушёл":(r.gone?"оторвался "+r.frames/FR+"с":"")))+" | "+r.dist+" | "+r.lowE+" |");
  helmTick=helm0;fireShot=fire0;hitShip=hit0;playerHit=phit0;wreck=wreck0;killPirate=kill0;pirateRoleTick=role0;SCRIPT=null;M=null;
  ok(rows.length>=1&&rows.every(r=>r.frames>0),"дуэль прогнана: "+rows.length+" сценариев");
});
