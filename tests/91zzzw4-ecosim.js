/* ══════════════ проба · экономика (M903) ══════════════
   Экономика измеряется, а не обсуждается. Стенд гоняет настоящий круг игрока
   под Node — планета → посадка → бурение до полного трюма → взлёт → станция →
   стыковка → продажа → заправка → ремонт → отстыковка — столько кругов,
   сколько влезает в заданные часы игры, на четырёх ярусах владения из
   DESIGN-game §4.1 (T0 «Стриж», T1 «Вьюк» + рука + дрон, T2 «Обод» + три руки +
   два дрона + два управляющих, T3 «Мамонт» + пять рук + четыре дрона + четыре
   управляющих; цеха и база ярусов T2–T3 здесь не строятся — это сказано в
   строке таблицы). Печатает по ярусу: кругов, минут на круг, валовый доход,
   расход, чистый за час игры, давление U/G, и те же числа против оракула §4.1
   с отклонением в процентах.

   Каждое движение кредитов ловится на самом G.credits (аксессор на время
   набора): кто бы ни платил и ни получал — продажа, дроны, жалованье, заправка,
   ремонт — попадает в книжку под именем текущей фазы. Так не нужно знать все
   сорок мест earn() и все вычеты.

   Запуск: node test-node.js --only="проба · экономика"
     ECO_HOURS=3  часов игры на ярус (по умолчанию 1)
     ECO_TIERS=T0|T2  какие ярусы (регулярное выражение по имени) */
suite("проба · экономика",{tier:"probe"},()=>{
  const ENV=(globalThis.process&&globalThis.process.env)||{};
  const HOURS=Math.max(.1,+ENV.ECO_HOURS||1);
  const PICK=ENV.ECO_TIERS?new RegExp(ENV.ECO_TIERS):null;
  const FR=60,HOUR=3600*FR;
  /* оракул §4.1: валовый, расход, чистый — кредитов в час игры */
  const ORACLE={T0:{gross:7200,upkeep:2800,net:4400},T1:{gross:21300,upkeep:7400,net:13900},
                T2:{gross:37200,upkeep:23000,net:14200},T3:{gross:54300,upkeep:41600,net:12700}};
  const TIERS=[
    {name:"T0",hull:"strizh",mods:{},hands:0,drones:0,mgrs:0},
    {name:"T1",hull:"vyuk",mods:{hold:1,drill:1},hands:1,drones:1,mgrs:0},
    {name:"T2",hull:"obod",mods:{hold:2,drill:2,engine:1},hands:3,drones:2,mgrs:2},
    {name:"T3",hull:"mamont",mods:{hold:3,drill:3,engine:2,tank:1},hands:5,drones:4,mgrs:4}
  ];
  let PHASE="tick",BOOK=null;
  /* часы идут с кадром: под стендом они прибиты, и дроны, руки и жалованье
     (всё на now()) за час игры не делали ни рейса */
  const sw0=stepWorld;
  let TICKN=0,TICKS=0;
  stepWorld=function(n){
    clockAdvance((n||1)*1000/60);
    const r=sw0(n);
    /* дроны, руки, управляющие и сделки в игре идут по таймеру кадра (28-loop),
       под стендом — раз в десять секунд игры отсюда; все они ленивые по времени */
    if(++TICKN%600===0){TICKS++;tickDrones();crewTick();mgrTick();occTick();}
    return r;
  };
  /* книжка: аксессор на кредитах — каждая копейка под именем фазы */
  function meter(key,book){
    let v=+G[key]||0;
    Object.defineProperty(G,key,{configurable:true,enumerable:true,
      get(){return v;},
      set(n){n=+n||0;const d=n-v;v=n;if(d<0)book[PHASE]=(book[PHASE]||0)-d;}});
  }
  function bookOn(){
    let v=+G.credits||0;BOOK={gross:{},spend:{},v0:v,fuel:{},hull:{}};
    meter("fuel",BOOK.fuel);meter("hull",BOOK.hull);
    Object.defineProperty(G,"credits",{configurable:true,enumerable:true,
      get(){return v;},
      set(n){n=+n||0;const d=n-v;v=n;
        if(d>0)BOOK.gross[PHASE]=(BOOK.gross[PHASE]||0)+d;
        else if(d<0)BOOK.spend[PHASE]=(BOOK.spend[PHASE]||0)-d;}});
  }
  function bookOff(){for(const k of ["credits","fuel","hull"]){const v=G[k];delete G[k];G[k]=v;}}
  const sum=o=>Object.values(o).reduce((a,b)=>a+b,0);
  const held=()=>TRADE_KEYS.concat(FAR_KEYS).reduce((a,k)=>a+(G.cargo[k]|0),0);
  const fail={};
  const note=(k)=>{fail[k]=(fail[k]||0)+1;};
  /* ходьба с бюджетом по расстоянию: T.bot даёт 4000 кадров (2.5 км), а полоса
     9 км — и после ближних залежей бот сдавался. Застрял на месте — скажем, где */
  function walkTo(x,within){
    const S=G.surf;const max=Math.abs(x-S.x)/.5+600;let last=S.x,still=0;
    try{
      for(let i=0;i<max;i++){
        if(Math.abs(x-S.x)<within)return true;
        keys.left=x<S.x;keys.right=x>S.x;
        stepWorld(1);G.t+=1;
        if(G.mode!=="surface")return false;
        if(Math.abs(S.x-last)<.01){if(++still>60){note("стоит на месте у "+Math.round(S.x)+": "+G.prompt.split("\n")[0]);return false;}}else still=0;
        last=S.x;
      }
      return Math.abs(x-S.x)<within;
    }finally{keys.left=false;keys.right=false;}
  }
  /* выработанные планеты помним по ключу; все выработаны — прыжок к соседу со станцией */
  const DONE=new Set();let JUMPS=0;
  function nextSys(){
    for(let r=1;r<=3;r++)for(let dx=-r;dx<=r;dx++)for(let dy=-r;dy<=r;dy++){
      if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
      const sx=G.sx+dx,sy=G.sy+dy;if(!starAt(sx,sy))continue;
      const s=getSystem(sx,sy);if(!s.station)continue;
      if(!(s.planets||[]).some(q=>q.parentIdx==null&&q.type!=="gas"&&!DONE.has(q.key)))continue;
      return {sx,sy};
    }
    return null;
  }
  /* залежь под стеной посёлка или у его места в игре не бурится: цепочка подсказок
     берёт ветку стены/посёлка и молчит (21-mode-surface 495/511, стена без подписи
     и без рук — подсказка вовсе не ставится, на экране висит старая). Проба такие
     залежи обходит; починка — у тестировщика (стена не на залежи) */
  const depBlocked=d=>{const S=G.surf;
    if(S._wallX!=null&&Math.abs(d.x-S._wallX)<30+26)return true;
    if(settleCanLive(S.p)){const sx=settleSpotX(S.p,S.tr);if(sx!=null&&Math.abs(d.x-sx)<44+26)return true;}
    /* точка осмотра (poiNear) стоит в цепочке раньше залежи — с неё тоже не бурят */
    if(poiNear(Object.assign({},S,{x:d.x}),S.tr))return true;
    return false;};
  const nearestDep=()=>{const S=G.surf;return (S.deposits||[]).filter(d=>d.left>0&&!depBlocked(d)).sort((a,b)=>Math.abs(a.x-S.x)-Math.abs(b.x-S.x))[0];};
  /* ── один круг ── */
  function lap(tier){
    const t0=G.t;
    if(G.mode==="dock"){PHASE="tick";closeStation();}
    if(G.mode!=="system"){note("не в полёте: "+G.mode);G.mode="system";}
    /* планета: сесть и бурить, пока трюм не полон или залежи не кончились */
    /* планета с залежами и не луна у гиганта: у луны подсказку перебивает сам
       гигант («ЮПИТЕР» вместо ПОСАДКИ), и круг срывался */
    let P=(G.sys.planets||[]).find(q=>q.parentIdx==null&&q.type!=="gas"&&!DONE.has(q.key)&&((q.res&&q.res.length)||(PROFILE[q.type]||[]).length));
    if(!P){
      const to=nextSys();if(!to){note("соседей со станцией и залежами нет");return false;}
      const j=T.bot("jump",to);if(!j.ok){note("jump: "+j.why);return false;}
      JUMPS++;
      P=(G.sys.planets||[]).find(q=>q.parentIdx==null&&q.type!=="gas"&&!DONE.has(q.key));
      if(!P){note("после прыжка планеты нет");return false;}
    }
    PHASE="к планете";
    let r=T.bot("planet",P);if(!r.ok){note("planet: "+r.why);return false;}
    PHASE="посадка";
    r=T.bot("land");
    /* орбита автопилота бывает дальше порога подсказки: подойти на тормозе и ещё раз */
    for(let k=0;k<3&&!r.ok&&G.mode==="system";k++){
      const sh=G.ship;G.ap=null;G.orbit=null;
      for(let i=0;i<240;i++){
        const dx=P.x-sh.x,dy=P.y-sh.y,d=Math.hypot(dx,dy)-(P.radius||0);
        if(d<60)break;
        sh.vx=(P.vx||0)+dx/Math.hypot(dx,dy)*Math.min(2.5,d/30);sh.vy=(P.vy||0)+dy/Math.hypot(dx,dy)*Math.min(2.5,d/30);
        stepWorld(1);G.t+=1;
      }
      sh.vx=P.vx||0;sh.vy=P.vy||0;
      r=T.bot("land");
    }
    if(!r.ok){note("land: "+r.why);
      if(ENV.ECO_TRACE){const sh=G.ship;const nr=(G.sys.planets||[]).map(q=>({n:q.name,ty:q.type,d:Math.round(Math.hypot(q.x-sh.x,q.y-sh.y))})).sort((a,b)=>a.d-b.d).slice(0,3);
        console.log("  след land: цель "+P.name+"/"+P.type+" d="+Math.round(Math.hypot(P.x-sh.x,P.y-sh.y))+" · ближние "+nr.map(q=>q.n+"/"+q.ty+" "+q.d).join(", ")+" · орбита "+(G.orbit?(G.orbit.p?G.orbit.p.name:G.orbit.kind||"?"):"нет")+" · топливо "+G.fuel.toFixed(0)+" · v "+Math.hypot(sh.vx,sh.vy).toFixed(1)+" · подсказка «"+G.prompt.replace(/\n/g," | ")+"» · находки "+((G.finds||[]).length)+" · relay "+(G.relay?1:0));}
      return false;}
    PHASE="грунт";
    const st=stat();let mined=0;
    for(let i=0;i<12&&held()<st.cargoMax;i++){
      const S0=G.surf,x0=S0.x,t1=G.t;
      const dep=nearestDep();if(!dep){DONE.add(G.surf.p.key);break;}
      if(!walkTo(dep.x,14)){note("walk: до залежи не дошёл");break;}
      r=T.bot("mine");if(!r.ok){if(!/трюм полон|залежей/.test(r.why)){note("mine: "+r.why);
        if(ENV.ECO_TRACE)console.log("  след mine: x "+Math.round(x0)+"→"+Math.round(S0.x)+" за "+(G.t-t1)+" кадров · корабль "+Math.round(S0.shipX)+" · W "+(S0.tr&&S0.tr.W)+" · залежи "+(S0.deposits||[]).map(d=>Math.round(d.x)+":"+d.res+":"+d.left).join(" ")+" · режим "+G.mode+" · "+G.prompt.split("\n")[0]+" · ближняя "+JSON.stringify(nearestDep())+" · S.x "+S0.x.toFixed(2)+" on "+S0.on+" swim "+S0.swim+" walkTarget "+S0.walkTarget+" · стена "+S0._wallX+" · место "+settleSpotX(S0.p,S0.tr)+" · глушители "+JSON.stringify(depRoomBlockers(S0).map(b=>[Math.round(b.x),Math.round(b.r)])));if(ENV.ECO_DBG){const pr=G.prompt;G.prompt="";PLN_OWN_OLD_UPD(1);console.log("    голый updateSurface: «"+String(G.prompt).split("\n")[0]+"» · cave "+JSON.stringify(S0.cave)+" · dShip "+Math.abs(S0.x-S0.shipX).toFixed(0)+" · zone "+shipZoneR()+" · jet "+S0.jetOn+" · held "+held()+"/"+stat().cargoMax+" · own "+OWN.on+" · plants "+(S0.plants||[]).filter(p=>Math.abs(p.x-S0.x)<40).length+" · fauna "+(S0.fauna||[]).filter(b=>Math.abs(b.x-S0.x)<40).length+" · poi "+JSON.stringify(poiNear(S0,S0.tr)));G.prompt=pr;}}
        break;}
      mined++;
    }
    /* дроны ставятся у первой залежи ярусом выше T0: инвентарь выдан заранее */
    if(tier.drones>0&&G.droneInventory>0){
      const S=G.surf,dep=(S.deposits||[]).find(d=>d.left>0);
      if(dep&&droneMayMine(dep.res)){
        PHASE="drone";droneTarget=dep.res;
        try{deployDrone();}catch(e){note("drone: "+(e&&e.message));}
        PHASE="tick";
      }
    }
    if(G.mode==="surface")walkTo(G.surf.shipX,shipZoneR()*.7);
    r=T.bot("ship");if(!r.ok){note("ship: "+r.why);return false;}
    PHASE="взлёт";
    r=T.bot("launch");if(!r.ok){note("launch: "+r.why);return false;}
    PHASE="к станции";
    /* станция: продать, заправить, починить */
    r=T.bot("station");if(!r.ok){note("station: "+r.why);return false;}
    PHASE="стыковка";
    r=T.bot("dock");
    if(!r.ok&&/до станции/.test(r.why)){   /* автопилот встаёт на 96, бот хочет < 95 */
      const S=G.sys.station,sh=G.ship,dx=S.x-sh.x,dy=S.y-sh.y,d=Math.hypot(dx,dy)||1;
      sh.x=S.x-dx/d*80;sh.y=S.y-dy/d*80;sh.vx=S.vx||0;sh.vy=S.vy||0;G.ap=null;G.orbit=null;
      r=T.bot("dock");
    }
    if(!r.ok){note("dock: "+r.why);return false;}
    PHASE="sell";
    for(const k of TRADE_KEYS.concat(FAR_KEYS)){const q=G.cargo[k];if(q>0)sellCargo(G.sys,k,q);}
    PHASE="refuel";
    {const need=Math.ceil(stat().fuelMax-G.fuel);const per=fuelPriceHere();
     const can=Math.min(need,Math.floor(G.credits/per));if(can>0){G.credits-=can*per;G.fuel+=can;}}
    PHASE="repair";
    {const q=repairQuote(1);let units=q.units,cost=q.cost;
     if(G.credits<cost){units=Math.min(units,Math.floor(G.credits/q.per));cost=units*q.per;}
     if(units>0){G.credits-=cost;G.hull+=units;}}
    PHASE="tick";
    return {frames:G.t-t0,mined};
  }
  /* ── ярус: корпус, модули, руки, дроны, управляющие ── */
  function setup(tier){
    resetWorld();
    G.opts.autoDock=false;
    G.shipId=tier.hull;G.owned[tier.hull]=true;G.owned.strizh=true;
    for(const k in tier.mods){G.mods[k]=tier.mods[k];G.modsOwned[k]=tier.mods[k];}
    invalidateParts();
    const st=stat();G.hull=st.hullMax;G.fuel=st.fuelMax;
    G.droneInventory=tier.drones;
    /* старт по оракулу: касса яруса — два часа чистого, чтобы было чем платить */
    G.credits=600+Math.round((ORACLE[tier.name].net||0)*2);
    if(tier.mgrs>0)for(let i=0;i<tier.mgrs;i++){
      const dom=MGR_ROLE_KEYS[i%MGR_ROLE_KEYS.length];
      const m=genMgr(1000+i*17,[dom]);if(m)try{hireMgr(m);}catch(e){note("mgr: "+(e&&e.message));}
    }
    if(tier.hands>0){
      try{coopStamp("Сквозной");}catch(e){}
      let n=0;
      for(const c of stationMercs(G.sys)){
        if(n>=tier.hands)break;
        try{
          if(!hireMerc(c))break;
          const m=G.crew[G.crew.length-1];
          const id=["strizh","klinok","vyuk"].find(h=>{G.owned[h]=true;return crewAssignShip(m,h)&&true;});
          let sent=false;
          for(const kind of ["mine","trade","haul","scout"])if(crewOrder(m,kind,G.sx,G.sy)){sent=true;break;}
          if(!id||!sent)note("hand: корабль "+(id||"—")+", приказ "+(sent?"принят":"нет"));
          n++;
        }catch(e){note("hire: "+(e&&e.message));break;}
      }
      if(n<tier.hands)note("hands: нанято "+n+" из "+tier.hands);
    }
    if(ENV.ECO_TRACE)console.log("  "+tier.name+": касса "+G.credits+" · руки "+G.crew.map(c=>c.spec+"/"+(c.shipId||"—")+"/"+(c.order&&c.order.kind)).join(" ")+
      " · управляющие "+G.mgrs.map(m=>m.role).join(" ")+" · дронов в трюме "+G.droneInventory);
  }
  const rows=[];
  for(const tier of TIERS){
    if(PICK&&!PICK.test(tier.name))continue;
    setup(tier);
    for(const k in fail)delete fail[k];
    bookOn();
    const t0=G.t,hull0=G.hull;let laps=0,lapF=0,mined=0,bad=0;
    try{
      while(G.t-t0<HOURS*HOUR&&bad<6){
        const L=lap(tier);
        if(!L){bad++;if(G.mode!=="system"){try{if(G.mode==="dock")closeStation();}catch(e){}G.mode="system";}continue;}
        laps++;lapF+=L.frames;mined+=L.mined;
      }
    }catch(e){note("стенд: "+(e&&e.message));}
    const hrs=(G.t-t0)/HOUR,gross=sum(BOOK.gross),spend=sum(BOOK.spend);
    if(ENV.ECO_TRACE)console.log("  "+tier.name+": прыжков "+JUMPS+" · выработано планет "+DONE.size);
    DONE.clear();JUMPS=0;
    if(ENV.ECO_TRACE)console.log("  "+tier.name+" итог: часов "+hrs.toFixed(2)+" · дроны "+G.drones.map(d=>d.res+" рейсов "+d.trips+" продано "+d.sold+" заработал "+d.earned+" [t0−now "+((clockNow()-d.t0)/1000).toFixed(0)+" с · круг "+(droneTripMs(d)/1000).toFixed(0)+" с · down "+(d.down|0)+" · stuck "+(d.stuck|0)+" · pool "+d.pool+" · occ "+occLvl(d.sx,d.sy)+" · тиков "+TICKS+"]").join("; ")+
      " · руки "+G.crew.map(c=>c.spec+" рейсов "+(c.trips|0)+" потрачено "+Math.round(c.spent||0)+" долг "+Math.round(c.debt||0)+" мораль "+(c.morale==null?"—":c.morale.toFixed(2))).join("; "));
    bookOff();
    const O=ORACLE[tier.name];
    const pct=(a,b)=>b?Math.round((a/b-1)*100):0;
    rows.push({tier:tier.name,hull:tier.hull,laps,minLap:laps?(lapF/laps/FR/60):0,mined,hrs,
      gross:gross/hrs,spend:spend/hrs,net:(gross-spend)/hrs,press:gross?spend/gross:0,
      gsrc:Object.entries(BOOK.gross).map(([k,v])=>k+" "+Math.round(v/hrs)).join(", "),
      ssrc:Object.entries(BOOK.spend).map(([k,v])=>k+" "+Math.round(v/hrs)).join(", "),
      dG:pct(gross/hrs,O.gross),dU:pct(spend/hrs,O.upkeep),dN:pct((gross-spend)/hrs,O.net),
      fails:Object.entries(fail).map(([k,v])=>k+(v>1?" ×"+v:"")).join("; "),
      fuel:Object.entries(BOOK.fuel).map(([k,v])=>k+" "+(v/hrs).toFixed(0)).join(", "),
      hullLoss:Object.entries(BOOK.hull).map(([k,v])=>k+" "+(v/hrs).toFixed(0)).join(", "),
      hull:tier.hull,credits:G.credits});
  }
  stepWorld=sw0;
  console.log("экономика: "+HOURS+" ч игры на ярус · цеха и база T2–T3 не строятся · оракул DESIGN-game §4.1");
  console.log("| ярус | корпус | кругов | мин/круг | добыто | валовый/ч | расход/ч | чистый/ч | U/G | против §4.1 (в/р/ч) | откуда | куда |");
  console.log("|---|---|---|---|---|---|---|---|---|---|---|---|");
  for(const r of rows)console.log("| "+r.tier+" | "+r.hull+" | "+r.laps+" | "+r.minLap.toFixed(1)+" | "+r.mined+" | "+Math.round(r.gross)+" | "+Math.round(r.spend)+" | "+Math.round(r.net)+" | "+r.press.toFixed(2)+" | "+r.dG+"% / "+r.dU+"% / "+r.dN+"% | "+r.gsrc+" | "+r.ssrc+" |");
  for(const r of rows)console.log("  "+r.tier+" топливо/ч: "+r.fuel+" · корпус/ч: "+r.hullLoss);
  for(const r of rows)if(r.fails)console.log("  "+r.tier+" сбои: "+r.fails);
  ok(rows.length>=1&&rows.every(r=>r.hrs>0),"экономика прогнана: "+rows.length+" ярусов");
});
