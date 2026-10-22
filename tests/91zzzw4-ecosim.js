/* ══════════════ проба · экономика (M903, M912) ══════════════
   Экономика измеряется, а не обсуждается: настоящий круг игрока под Node (планета → посадка →
   бурение до полного трюма → взлёт → стыковка → продажа, заправка, ремонт), а между кругами —
   дела диспетчера настоящими шагами (прыжок, стыковка, посадка, кантина, груз; бой — нет,
   это 91zzzw-fightsim). Ярусы владения DESIGN-game §4.1, против оракула в процентах; T2–T3 —
   с цехами и базой (91zzzw4-ecosim-est), «T0 свежий» — свежая запись с покупками и хронологией
   первого часа. Кредиты ловятся на самом G.credits (аксессор на время набора) и пишутся в
   книжку под именем текущей фазы. Печать и суд нормы — 91zzzw4-ecosim-rep.

   node test-node.js --only="проба · экономика", окружение:
     ECO_HOURS часов на ярус (1) · ECO_TIERS регулярка имён · ECO_DISP=0 без дел ·
     ECO_HUMAN=1 темп человека · ECO_EST=0 без хозяйства · ECO_DRONE=dear дрон на дорогой руде ·
     ECO_LOGIST=1 логист на базе · ECO_SHOPS=N цехов (0 — база без них) · ECO_EATER=1 едок промтовара ·
     ECO_LEVER=abc рычаги цехов, ECO_LEVER_MUL цена × (-est) · ECO_SAVE=1 лестница после сейва ·
     ECO_BUY=0 свежий без покупок · ECO_FRESH_H часы свежего · ECO_T1=1|2 путь T0→T1 · ECO_SEED=N сид · ECO_PAD=dock пауза у причала · ECO_LAPLOG=1 строка на круг · ECO_TRACE подробности */
suite("проба · экономика",{tier:"probe"},()=>{
  const ENV=(globalThis.process&&globalThis.process.env)||{};
  const HOURS=Math.max(.1,+ENV.ECO_HOURS||1);
  const PICK=ENV.ECO_TIERS?new RegExp(ENV.ECO_TIERS):null;
  const DISP_ON=ENV.ECO_DISP!=="0";
  const FR=60,HOUR=3600*FR;
  /* оракул §4.1: валовый, расход, чистый — кредитов в час игры */
  const ORACLE={T0:{gross:7200,upkeep:2800,net:4400},T1:{gross:21300,upkeep:7400,net:13900},
                T2:{gross:37200,upkeep:23000,net:14200},T3:{gross:54300,upkeep:41600,net:12700}};
  const TIERS=[
    /* свежая запись (M909/M912): касса 600, налёт с нуля, первая вахта — как у нового игрока */
    {name:"T0 свежий",o:"T0",hull:"strizh",mods:{},hands:0,drones:0,mgrs:0,fresh:true},
    {name:"T0",hull:"strizh",mods:{},hands:0,drones:0,mgrs:0},
    {name:"T1",hull:"vyuk",mods:{hold:1,drill:1},hands:1,drones:1,mgrs:0},
    {name:"T2",hull:"obod",mods:{hold:2,drill:2,engine:1},hands:3,drones:2,mgrs:2,ins:true,est:{shops:2,base:8,crew:2}},
    {name:"T3",hull:"mamont",mods:{hold:3,drill:3,engine:2,tank:1},hands:5,drones:4,mgrs:4,ins:true,est:{shops:5,base:20,crew:4}},
    /* плохой час (M904d, §4.1): авария на середине часа — без страховки корпус уходит с модулями,
       со страховкой возвращается через смену; потеря корпуса и модулей — строкой расхода по цене */
    {name:"T2 авария",o:"T2",hull:"obod",mods:{hold:2,drill:2,engine:1},hands:3,drones:2,mgrs:2,crash:.5},
    {name:"T2 авария, страховка",o:"T2",hull:"obod",mods:{hold:2,drill:2,engine:1},hands:3,drones:2,mgrs:2,crash:.5,ins:true}
  ];
  let CRASH_AT=null;
  let PHASE="tick",BOOK=null;
  /* часы идут с кадром: под стендом они прибиты, и дроны, руки и жалованье
     (всё на now()) за час игры не делали ни рейса */
  const sw0=stepWorld;
  let TICKN=0,TICKS=0;
  let TL=null;   /* хронология свежей записи: минута игры каждой вехи первого часа */
  stepWorld=function(n){
    clockAdvance((n||1)*1000/60);
    /* налёт — настоящим clrTick (28-loop зовёт его из кадра, стенд кадра не рисует) */
    {const r0=G.running;G.running=true;try{clrTick((n||1)*1000/60);}finally{G.running=r0;}}
    if(BOOK)BOOK.time[PHASE]=(BOOK.time[PHASE]||0)+(n||1);   /* кадры по фазам: куда уходит круг */
    const r=sw0(n);
    /* дроны, руки, управляющие и сделки в игре идут по таймеру кадра (28-loop),
       под стендом — раз в десять секунд игры отсюда; все они ленивые по времени */
    /* фон — своей строкой «tick», в какой бы фазе круга он ни капнул: жалованье на грунте — не грунт */
    if(++TICKN%600===0){const PH=PHASE;PHASE="tick";try{TICKS++;tickDrones();crewTick();mgrTick();occTick();}finally{PHASE=PH;}if(TL)tlSample();}
    return r;
  };
  /* книжка: аксессор на кредитах — каждая копейка под именем фазы */
  function meter(key,book){
    let v=+G[key]||0;
    Object.defineProperty(G,key,{configurable:true,enumerable:true,
      get(){return v;},
      set(n){n=+n||0;const d=n-v;v=n;if(d<0)book[PHASE]=(book[PHASE]||0)-d;else if(d>0&&key==="fuel")BOOK.fin[PHASE]=(BOOK.fin[PHASE]||0)+d;}});
  }
  function bookOn(){
    let v=+G.credits||0;BOOK={gross:{},spend:{},v0:v,fuel:{},fin:{},hull:{},time:{},sold:{}};
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
        stepWorld(1);G.t+=1;if(TL&&PHASE==="грунт")TL.walk=(TL.walk|0)+1;
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
    /* и Жестянка (12ta, 21-mode-surface 477): у неё «НАРЯД НЕ ЗАКРЫТ» вместо бура (M912 — находка) */
    if(tinCanLive(S.p)){const tx=tinSpotX(S.p,S.tr);if(tx!=null&&Math.abs(d.x-tx)<56+14)return true;}
    return false;};
  const nearestDep=()=>{const S=G.surf;return (S.deposits||[]).filter(d=>d.left>0&&!depBlocked(d)).sort((a,b)=>Math.abs(a.x-S.x)-Math.abs(b.x-S.x))[0];};
  /* оклик патруля (ОКЛИК · ДЕЙСТВИЕ — ПРОХОДОМ) забирает ДЕЙСТВИЕ у причала и у планеты:
     игрок отвечает «проходом» и жмёт ещё раз — так же и бот */
  function botH(goal,arg){
    let r=T.bot(goal,arg);
    for(let k=0;k<3&&!r.ok&&/ОКЛИК/.test(r.why||"")&&G.mode==="system";k++){
      T.press("act",1);for(let i=0;i<30;i++){stepWorld(1);G.t+=1;}
      r=T.bot(goal,arg);
    }
    return r;
  }
  /* норма участка (M905): суд этой сводки на копии участка — как есть и без вас (ни нужд, ни нарядов) */
  const normNow=ecoNormNow,normFold=ecoNormFold,normSum=ecoNormSum;   /* в 91zzzw4-ecosim-rep.js */
  /* главный приказ каждого домена — тот, без которого он не работает (12c MGR_RULES) */
  const MGR_MAIN={cmd:["repair"],keep:["sell","build"],fact:["run"],sci:[]};
  const MGR_ORDER=["fact","cmd","keep","sci"];
  /* ── дела диспетчера (M912): ходить по шагам бумаги теми же целями бота ── */
  const DSTAT={done:0,pay:0,frames:0,skip:{},took:{},poor:new Set()},NET=new Map();
  const FUEL_KEEP=30,JUMP_F=8*60;
  /* счётчики первого часа: круги и добыча — из цикла яруса, станции и системы — из сэмплера */
  const CNT={laps:0,mined:0,docks:new Set(),sys:new Set()};
  let HIRE_FEE=1e9;
  /* хронология первого часа и путь T0→T1 (M919) — в 91zzzw4-ecosim-t1.js */
  const FRESH=ecoFresh({note,dockAt,DSTAT,CNT,FR,get order(){return BUY_ORDER;},get tl(){return TL;},get book(){return BOOK;},
    get hire(){return HIRE_FEE;},get jumps(){return JUMPS;},get ph(){return PHASE;},set ph(v){PHASE=v;}}),tlSample=FRESH.tlSample;
  /* по карману ли бумага: прыжки туда-обратно по цене бака и груз по цене стойки; запас — на бак */
  function dispAfford(it){
    let hops=0,goods=0,lands=0,opp=0,a=G.sys.key;
    for(const L of it.legs.slice(it.leg)){hops+=dispHop(a,L.key);a=L.key;if(L.do==="land")lands++;
      /* своя руда в трюме — не даром: её можно сдать здесь же; отданная по бумаге — упущенная продажа */
      if(L.do==="cargo"){const own=Math.min(G.cargo[L.k]|0,L.qty);if(own>0)opp+=own*((G.sys&&G.sys.station&&marketFor(G.sys)[L.k])||0);}
      if(L.do==="cargo"&&(G.cargo[L.k]|0)<L.qty){const S=shopFor(L.k,L.key);if(!S)return false;
        hops+=2*dispHop(G.sys.key,S.key);goods+=(L.qty-(G.cargo[L.k]|0))*buyPriceFor(S,L.k);
        if(L.qty-(G.cargo[L.k]|0)>stat().cargoMax-held())return false;}}
    hops+=dispHop(a,G.sys.key);
    /* бак: каждый прыжок до 1.5 сектора и посадка-взлёт; заправка — только на стыковках */
    if(hops*mapJumpCost(1.5)+lands*FUEL_KEEP+10>stat().fuelMax)return false;
    const fuel=(hops*mapJumpCost(1.2)+lands*12)*fuelPriceHere();
    if(G.credits<goods+fuel+150)return false;
    /* живой игрок не берёт бумагу себе в убыток: плата должна окупить груз и бак */
    NET.set(it.id,it.pay-goods-fuel-opp);
    return NET.get(it.id)>=60;
  }
  function sysOf(key){const p=String(key).split(",");return getSystem(p[0]|0,p[1]|0);}
  /* путь прыжками: звёзды в радиусе бака, обход в ширину по сетке вокруг */
  function goTo(key,keep){
    if(keep==null)keep=FUEL_KEEP;
    const p=String(key).split(","),tx=p[0]|0,ty=p[1]|0;
    if(G.sx===tx&&G.sy===ty)return true;
    if(G.mode==="dock")closeStation();
    if(G.mode!=="system")return false;
    const R=stat().jump,seen={},q=[[G.sx,G.sy]],prev={};seen[G.sx+","+G.sy]=1;
    while(q.length){const [x,y]=q.shift();if(x===tx&&y===ty)break;
      for(let dx=-3;dx<=3;dx++)for(let dy=-3;dy<=3;dy++){const nx=x+dx,ny=y+dy,k=nx+","+ny;
        if(seen[k]||Math.hypot(dx,dy)>R+.02||Math.abs(nx-tx)>6+Math.abs(G.sx-tx)||Math.abs(ny-ty)>6+Math.abs(G.sy-ty))continue;
        if(!starAt(nx,ny)&&!(nx===tx&&ny===ty))continue;
        seen[k]=1;prev[k]=x+","+y;q.push([nx,ny]);}}
    const path=[];for(let k=tx+","+ty;k&&k!==G.sx+","+G.sy;k=prev[k])path.unshift(k);
    if(!path.length||!prev[tx+","+ty]){note("дела: пути до "+key+" нет");return false;}
    for(const k of path){const s=k.split(","),sx=s[0]|0,sy=s[1]|0;
      /* бак: прыжок и запас на посадку-взлёт; не хватает — заправиться здесь, если есть где */
      const cost=mapJumpCost(Math.hypot(sx-G.sx,sy-G.sy));
      if(G.fuel<cost+keep&&G.sys.station&&!dockAt(G.sys.key))return false;
      if(G.mode==="dock")closeStation();
      if(G.fuel<cost+keep){note("дела: бак "+Math.round(G.fuel)+" на прыжок "+cost);return false;}
      const j=T.bot("jump",{sx,sy});
      if(!j.ok){if(G.mode==="map")G.mode="system";note("дела: прыжок — "+j.why);return false;}
      JUMPS++;
      /* бот прыгает за кадр, игрок — картой: открыть, найти сектор, нажать; восемь секунд на прыжок */
      for(let i=0;i<JUMP_F;i++){stepWorld(1);G.t+=1;}
      if(HUMAN)idle(HUM.jump);}
    return G.sx===tx&&G.sy===ty;
  }
  function refuelHere(){const need=Math.ceil(stat().fuelMax-G.fuel),per=fuelPriceHere();
    const can=Math.min(need,Math.floor(G.credits/per));if(can>0){G.credits-=can*per;G.fuel+=can;}}
  function dockAt(key,keep){
    if(G.mode==="dock"&&G.sys.key===key)return true;
    if(!goTo(key,keep))return false;
    if(!G.sys.station){note("дела: в "+key+" нет станции");return false;}
    let r=T.bot("station");if(!r.ok){note("дела: station — "+r.why);return false;}
    r=botH("dock");
    if(!r.ok&&/до станции/.test(r.why)){const S=G.sys.station,sh=G.ship,dx=S.x-sh.x,dy=S.y-sh.y,d=Math.hypot(dx,dy)||1;
      sh.x=S.x-dx/d*80;sh.y=S.y-dy/d*80;sh.vx=S.vx||0;sh.vy=S.vy||0;G.ap=null;G.orbit=null;r=botH("dock");}
    if(!r.ok){note("дела: dock — "+r.why);return false;}
    refuelHere();CNT.docks.add(G.sys.key);
    if(EST.on)estDock();
    if(HUMAN)idle(HUM.leg);
    return true;
  }
  /* сесть на планету системы и подняться: шаг «land» ловит enterSurface */
  function landAt(P){
    let r=T.bot("planet",P);if(!r.ok){note("planet: "+r.why);return false;}
    r=botH("land");
    for(let k=0;k<3&&!r.ok&&G.mode==="system";k++){
      const sh=G.ship;G.ap=null;G.orbit=null;
      for(let i=0;i<240;i++){
        const dx=P.x-sh.x,dy=P.y-sh.y,d=Math.hypot(dx,dy)-(P.radius||0);
        if(d<60)break;
        sh.vx=(P.vx||0)+dx/Math.hypot(dx,dy)*Math.min(2.5,d/30);sh.vy=(P.vy||0)+dy/Math.hypot(dx,dy)*Math.min(2.5,d/30);
        stepWorld(1);G.t+=1;
      }
      sh.vx=P.vx||0;sh.vy=P.vy||0;
      r=botH("land");
    }
    if(!r.ok)note("land: "+r.why);
    return r.ok;
  }
  /* где купить груз шага: у стойки, где он есть, кроме самой стойки сдачи; ближайшая */
  function shopFor(k,not){
    let best=null,bd=1e9;
    for(let x=G.sx-2;x<=G.sx+2;x++)for(let y=G.sy-2;y<=G.sy+2;y++){
      if(!starAt(x,y))continue;const S=getSystem(x,y);
      if(!S.station||!S.station.prices||!S.station.prices[k]||S.key===not)continue;
      const d=Math.max(Math.abs(x-G.sx),Math.abs(y-G.sy))*10+buyPriceFor(S,k)/100;if(d<bd){bd=d;best=S;}
    }
    return best;
  }
  function dispDoable(x){
    const it=dispSt().it.find(y=>y.id===x.id);if(!it)return false;
    if(!it.legs.slice(it.leg).every(L=>L.do!=="kill"))return false;
    if(!dispAfford(it)){DSTAT.poor.add(it.id);return false;}
    return true;
  }
  function dispLeg1(it){
    const L=dispLeg(it);if(!L)return true;
    if(L.do==="arrive")return goTo(L.key);
    if(L.do==="dock")return dockAt(L.key);
    if(L.do==="land"){
      if(!goTo(L.key))return false;
      const P=(G.sys.planets||[]).find(q=>q.type!=="gas");if(!P){note("дела: твёрдой планеты нет");return false;}
      if(!landAt(P))return false;
      walkTo(G.surf.shipX,shipZoneR()*.7);
      let r=T.bot("ship");if(!r.ok){note("дела: ship — "+r.why);return false;}
      r=T.bot("launch");if(!r.ok){note("дела: launch — "+r.why);return false;}
      return true;
    }
    if(L.do==="cant"){
      if(!dockAt(L.key))return false;
      try{tab="cantina";renderTab();}catch(e){note("дела: кантина — "+(e&&e.message));}
      return true;
    }
    if(L.do==="cargo"){
      if((G.cargo[L.k]|0)<L.qty){
        const S=shopFor(L.k,L.key);if(!S){note("дела: купить "+L.k+" негде");return false;}
        if(!dockAt(S.key))return false;
        /* закупка под бумагу — себестоимость привоза, а не содержание: своей строкой, валовый — за её вычетом */
        const PH=PHASE;PHASE="закупка";
        const got=buyCargo(G.sys,L.k,L.qty-(G.cargo[L.k]|0));
        PHASE=PH;
        if((G.cargo[L.k]|0)<L.qty){note("дела: куплено "+got+" "+L.k+" из "+L.qty);return false;}
      }
      if(!dockAt(L.key))return false;
      if(!dispGive(it.id)){note("дела: СДАТЬ не принял "+L.k);return false;}
      return true;
    }
    note("дела: шаг "+L.do);return false;
  }
  /* одна бумага целиком: шаги по порядку, пока бумага на полосе */
  function dispRun(id){
    const t0=G.t,c0=DSTAT.done;
    for(let n=0;n<8;n++){
      const it=dispSt().it.find(x=>x.id===id);if(!it)break;
      const leg=it.leg;
      if(!dispLeg1(it))return false;
      const again=dispSt().it.find(x=>x.id===id);
      if(again&&again.leg===leg){note("дела: шаг «"+(dispLeg(again)||{}).do+"» сделан, а бумага стоит");return false;}
    }
    DSTAT.frames+=G.t-t0;
    return true;
  }
  /* после продажи: всё исполнимое с полосы, срочное первым; потом — к станции, где копать и продавать */
  function dispPlay(){
    if(!DISP_ON)return;
    const PH=PHASE,home=G.sys.key;PHASE="дела";
    const tried=new Set();
    try{
      for(let n=0;n<6;n++){
        const L=dispLane().filter(x=>!tried.has(x.id)&&dispDoable(x))
          .sort((a,b)=>
            (b.urg-a.urg)||((NET.get(b.id)||0)/b.est-(NET.get(a.id)||0)/a.est));
        if(!L.length)break;
        const x=L[0];tried.add(x.id);
        const d0=dispSt().done;
        if(!dispRun(x.id)){DSTAT.skip[x.v]=(DSTAT.skip[x.v]|0)+1;}
        if(dispSt().done>d0){DSTAT.done++;DSTAT.pay+=x.pay;DSTAT.took[x.v]=(DSTAT.took[x.v]|0)+1;}
      }
      for(const k of TRADE_KEYS)if(G.cargo[k]>0&&G.mode==="dock"&&G.sys.station.prices[k])sellCargo(G.sys,k,G.cargo[k]);
      /* домой — хоть на последних каплях: на станции заправят */
      if(G.mode!=="dock"||!G.sys.station)dockAt(home,0);
    }finally{PHASE=PH;}
  }
  /* ── один круг ── */
  /* темп человека (M912, ECO_HUMAN=1): бот делает круг за 4 мин, человек так не летает. Паузы —
     заход на посадку 20–30 с, выбор залежи, сводка и доска на стыковке, карта перед прыжком;
     круг не короче 6 мин (остаток добирается в полёте к станции). Мир в паузах живёт: жалованье,
     дроны, сроки бумаги */
  const HUMAN=ENV.ECO_HUMAN==="1",HUM={land:13,dep:4,dock:20,jump:7,leg:10,lap:6*60};
  function idle(sec,ph){const PH=PHASE;if(ph)PHASE=ph;const n=Math.round(sec*FR);
    try{for(let i=0;i<n;i++){stepWorld(1);G.t+=1;}}finally{PHASE=PH;}}
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
    /* орбита автопилота бывает дальше порога подсказки: подойти на тормозе и ещё раз (landAt) */
    r={ok:landAt(P)};
    if(r.ok&&HUMAN)idle(HUM.land,"паузы");
    if(!r.ok){
      if(ENV.ECO_TRACE){const sh=G.ship;const nr=(G.sys.planets||[]).map(q=>({n:q.name,ty:q.type,d:Math.round(Math.hypot(q.x-sh.x,q.y-sh.y))})).sort((a,b)=>a.d-b.d).slice(0,3);
        console.log("  след land: цель "+P.name+"/"+P.type+" d="+Math.round(Math.hypot(P.x-sh.x,P.y-sh.y))+" · ближние "+nr.map(q=>q.n+"/"+q.ty+" "+q.d).join(", ")+" · орбита "+(G.orbit?(G.orbit.p?G.orbit.p.name:G.orbit.kind||"?"):"нет")+" · топливо "+G.fuel.toFixed(0)+" · v "+Math.hypot(sh.vx,sh.vy).toFixed(1)+" · подсказка «"+G.prompt.replace(/\n/g," | ")+"» · находки "+((G.finds||[]).length)+" · relay "+(G.relay?1:0));}
      return false;}
    PHASE="грунт";
    const st=stat(),land0=FRESH.land();let mined=0;
    for(let i=0;i<12&&held()<st.cargoMax;i++){
      const S0=G.surf,x0=S0.x,t1=G.t;
      const dep=nearestDep();if(!dep){DONE.add(G.surf.p.key);break;}
      if(HUMAN)idle(HUM.dep,"паузы");
      if(!walkTo(dep.x,14)){note("walk: до залежи не дошёл");break;}
      r=T.bot("mine");if(!r.ok){if(!/трюм полон|залежей/.test(r.why)){note("mine: "+r.why);
        if(ENV.ECO_TRACE)console.log("  след mine: x "+Math.round(x0)+"→"+Math.round(S0.x)+" за "+(G.t-t1)+" кадров · корабль "+Math.round(S0.shipX)+" · W "+(S0.tr&&S0.tr.W)+" · залежи "+(S0.deposits||[]).map(d=>Math.round(d.x)+":"+d.res+":"+d.left).join(" ")+" · режим "+G.mode+" · "+G.prompt.split("\n")[0]+" · ближняя "+JSON.stringify(nearestDep())+" · S.x "+S0.x.toFixed(2)+" on "+S0.on+" swim "+S0.swim+" walkTarget "+S0.walkTarget+" · стена "+S0._wallX+" · место "+settleSpotX(S0.p,S0.tr)+" · глушители "+JSON.stringify(depRoomBlockers(S0).map(b=>[Math.round(b.x),Math.round(b.r)])));if(ENV.ECO_DBG){const pr=G.prompt;G.prompt="";PLN_OWN_OLD_UPD(1);console.log("    голый updateSurface: «"+String(G.prompt).split("\n")[0]+"» · cave "+JSON.stringify(S0.cave)+" · dShip "+Math.abs(S0.x-S0.shipX).toFixed(0)+" · zone "+shipZoneR()+" · jet "+S0.jetOn+" · held "+held()+"/"+stat().cargoMax+" · own "+OWN.on+" · plants "+(S0.plants||[]).filter(p=>Math.abs(p.x-S0.x)<40).length+" · fauna "+(S0.fauna||[]).filter(b=>Math.abs(b.x-S0.x)<40).length+" · poi "+JSON.stringify(poiNear(S0,S0.tr)));G.prompt=pr;}}
        break;}
      mined++;
    }
    if(TL&&held()>=st.cargoMax)TL.full=(TL.full|0)+1;
    /* дроны ставятся у первой залежи ярусом выше T0: инвентарь выдан заранее */
    if((tier.drones>0||tier.fresh)&&G.droneInventory>0){
      /* ECO_DRONE=dear: игрок, который знает цену, ставит машину на самую дорогую руду, что она берёт */
      const S=G.surf,ok=(S.deposits||[]).filter(d=>d.left>0&&(ENV.ECO_DRONE!=="dear"||droneMayMine(d.res)));
      const dep=ENV.ECO_DRONE==="dear"?ok.sort((a,b)=>((RES[b.res]||{}).price|0)-((RES[a.res]||{}).price|0))[0]:ok[0];
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
    if(CRASH_AT!=null&&G.t>=CRASH_AT){
      CRASH_AT=null;PHASE="авария";
      const id=G.shipId;let v=0;
      if(!insOn(id)){v+=(shipData(id).price|0);for(const k in G.mods)for(let l=0;l<(G.mods[k]|0);l++)v+=modCost(k,l);}
      if(v)BOOK.spend["потеря корпуса"]=(BOOK.spend["потеря корпуса"]||0)+v;
      G.hull=0;wreck("проба: авария");
      return {frames:G.t-t0,mined};
    }
    /* человек: круг не короче шести минут, с учётом сводки на стыковке */
    /* ECO_PAD=dock (M920): тот же остаток — у причала, а не в открытом космосе */
    let padL=0;if(HUMAN){const pad=HUM.lap-HUM.dock-(G.t-t0)/FR;if(pad>0){if(ENV.ECO_PAD==="dock")padL=pad;else idle(pad,"паузы");}}
    PHASE="к станции";
    /* станция: продать, заправить, починить */
    r=T.bot("station");if(!r.ok){note("station: "+r.why);return false;}
    PHASE="стыковка";
    r=botH("dock");
    if(!r.ok&&/до станции/.test(r.why)){   /* автопилот встаёт на 96, бот хочет < 95 */
      const S=G.sys.station,sh=G.ship,dx=S.x-sh.x,dy=S.y-sh.y,d=Math.hypot(dx,dy)||1;
      sh.x=S.x-dx/d*80;sh.y=S.y-dy/d*80;sh.vx=S.vx||0;sh.vy=S.vy||0;G.ap=null;G.orbit=null;
      r=botH("dock");
    }
    if(!r.ok){note("dock: "+r.why);return false;}
    if(HUMAN)idle(HUM.dock+padL,"паузы");
    if(EST.on)estHaul();
    PHASE="sell";
    for(const k of TRADE_KEYS.concat(FAR_KEYS)){const q=G.cargo[k];if(q>0){const v=sellCargo(G.sys,k,q);
      const b=BOOK.sold[k]||(BOOK.sold[k]=[0,0,{},0]);b[0]+=q;b[1]+=v||0;b[2][G.sys.key]=1;b[3]+=q*(G.sys.station.prices[k]||0);}}
    if(EST.on)estDock();
    /* корпус яруса — после аварии; свежий игрок летает на том, что ему выделили (freshShop) */
    const HL=tier.fresh&&FRESH_BUY&&G.owned.vyuk?"vyuk":tier.hull;
    if(G.shipId!==HL&&G.owned[HL]){G.shipId=HL;invalidateParts();}
    PHASE="refuel";
    {const need=Math.ceil(stat().fuelMax-G.fuel);const per=fuelPriceHere();
     const can=Math.min(need,Math.floor(G.credits/per));if(can>0){G.credits-=can*per;G.fuel+=can;}}
    PHASE="repair";
    {const q=repairQuote(1);let units=q.units,cost=q.cost;
     if(G.credits<cost){units=Math.min(units,Math.floor(G.credits/q.per));cost=units*q.per;}
     if(units>0){G.credits-=cost;G.hull+=units;}}
    /* счёт за смену (M904a): бумага закрывается на стыковке — бот платит её сразу */
    PHASE="счёт";
    billPay();
    PHASE="tick";
    if(tier.fresh&&FRESH_BUY){freshShop();FRESH.shop();}
    const tD=G.t;dispPlay();
    FRESH.lapLog(P,mined,land0,(tD-t0)/FR/60,padL/60,(G.t-tD)/FR/60);
    return {frames:G.t-t0,mined};
  }
  /* свежий игрок покупает как человек (M912): пересаживается на выделенный «Вьюк», потом по очереди
     трюм и бур, держа запас на бак и ремонт. Вложение — своей строкой: не расход и не валовый */
  const FRESH_BUY=ENV.ECO_BUY!=="0",BUY_ORDER=["hold","drill","hold","drill","engine","hold","drill"],BUY_KEEP=900;
  function freshShop(){
    if(G.mode!=="dock"||FRESH.holdMods())return;
    const PH=PHASE;PHASE="вложение";
    try{
      if(G.owned.vyuk&&G.shipId!=="vyuk"){
        G.shipId="vyuk";afterFitChange();
        refuelHere();
      }
      const lv={};
      for(const k of BUY_ORDER){lv[k]=(lv[k]|0)+1;
        if((G.modsOwned[k]|0)>=lv[k])continue;
        const cost=modCost(k,G.modsOwned[k]|0);
        if(G.credits<cost+BUY_KEEP)break;          /* по очереди: следующую не покупают в обход */
        G.credits-=cost;G.modsOwned[k]=(G.modsOwned[k]|0)+1;
        if(capUsed()+1<=capOf(G.shipId))G.mods[k]=(G.mods[k]|0)+1;
        afterFitChange();
        if(TL)TL.bought=(TL.bought?TL.bought+", ":"")+k+(G.modsOwned[k])+" "+fwMin().toFixed(1)+"′";
        break;                                      /* одна покупка за стыковку */
      }
    }finally{PHASE=PH;}
  }
  /* хозяйство T2–T3 — в 91zzzw4-ecosim-est.js */
  const {EST,estSetup,estDock,estHaul,estReport}=ecoEstate({note,idle,dockAt,sysOf,
    get ph(){return PHASE;},set ph(v){PHASE=v;},get book(){return BOOK;},get human(){return HUMAN;},
    logist:ENV.ECO_LOGIST==="1",lever:ENV.ECO_LEVER||"",mul:+ENV.ECO_LEVER_MUL||1,shops:ENV.ECO_SHOPS,eater:ENV.ECO_EATER==="1"});
  /* ── ярус: корпус, модули, руки, дроны, управляющие ── */
  function setup(tier){
    resetWorld();
    /* M920: сид — поток случайностей и час входа в игру (сид × 26.3 ч): события мира в T0 идут
       от хэшей места и часов, один поток их не двигает (10 сидов без сдвига — один и тот же прогон) */
    if(ENV.ECO_SEED){rndSeed(+ENV.ECO_SEED);clockSet(clockNow()+(+ENV.ECO_SEED)*94620000);}
    G.opts.autoDock=false;
    G.shipId=tier.hull;G.owned[tier.hull]=true;G.owned.strizh=true;
    for(const k in tier.mods){G.mods[k]=tier.mods[k];G.modsOwned[k]=tier.mods[k];}
    invalidateParts();
    const st=stat();G.hull=st.hullMax;G.fuel=st.fuelMax;
    G.droneInventory=tier.drones;
    for(const k in DSTAT.skip)delete DSTAT.skip[k];for(const k in DSTAT.took)delete DSTAT.took[k];
    DSTAT.done=0;DSTAT.pay=0;DSTAT.frames=0;DSTAT.poor=new Set();
    TL=null;
    if(tier.fresh){
      /* свежая запись: касса и налёт как у нового игрока; первая стойка — до первого круга (§10.7) */
      fwSt();TL={debt:0};CNT.laps=CNT.mined=0;CNT.docks.clear();CNT.sys.clear();
      try{const c=genMerc(4242);HIRE_FEE=c?mercFee(c):1e9;}catch(e){}
      if(T.bot("station").ok)T.bot("dock");
      if(G.mode==="dock"){refuelHere();dispPlay();}
      return;
    }
    /* налёт с двух часов: ярус — уже не первый час, счёт за смену работает */
    G.flownMs=2*FIRST_HOUR_MS;G.playMs=G.flownMs;G.bill=null;
    /* старт по оракулу: касса яруса — два часа чистого, чтобы было чем платить */
    G.credits=600+Math.round((ORACLE[tier.o||tier.name].net||0)*2);
    if(tier.ins)insSet(tier.hull,true);
    if(tier.mgrs>0)for(let i=0;i<tier.mgrs;i++){
      /* по-хозяйски: первым — фактор, единственный домен с живыми кредитами; потом командир звена (M912) */
      const dom=MGR_ORDER[i%MGR_ORDER.length];
      const m=genMgr(1000+i*17,[dom]);if(m)try{hireMgr(m);}catch(e){note("mgr: "+(e&&e.message));}
      /* нанятый без приказов домен стоит: фактор без «водить» не возит ни кредита (12c mgrWorkFact).
         Игрок, который платит оклад, отдаёт главный приказ домена — проба тоже (M912) */
      const h=G.mgrs.find(x=>x.role===dom);
      if(h)for(const id of MGR_MAIN[dom]||[])if(!mgrRule(h,id))mgrToggleRule(h,id);
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
    EST.on=false;if(tier.est&&ENV.ECO_EST!=="0")estSetup(tier.est);
    if(ENV.ECO_TRACE)console.log("  "+tier.name+": касса "+G.credits+" · руки "+G.crew.map(c=>c.spec+"/"+(c.shipId||"—")+"/"+(c.order&&c.order.kind)).join(" ")+
      " · управляющие "+G.mgrs.map(m=>m.role).join(" ")+" · дронов в трюме "+G.droneInventory);
  }
  const rows=[];
  for(const tier of TIERS){
    if(PICK&&!PICK.test(tier.name))continue;
    setup(tier);const LAD0=ecoLadder(G.sys);
    for(const k in fail)delete fail[k];
    bookOn();
    const t0=G.t,hull0=G.hull;let laps=0,lapF=0,mined=0,bad=0;
    /* свежая запись — три часа: бумага стажёра ждёт часа налёта, а налёт на грунте не идёт */
    const HRS=tier.fresh?Math.max(HOURS,+ENV.ECO_FRESH_H||3):HOURS;
    CRASH_AT=tier.crash?t0+tier.crash*HRS*HOUR:null;
    const NACC={done:[],cur:null};
    try{
      while(G.t-t0<HRS*HOUR&&bad<6){
        const L=lap(tier);
        if(!L){bad++;if(G.mode!=="system"){try{if(G.mode==="dock")closeStation();}catch(e){}G.mode="system";}continue;}
        laps++;lapF+=L.frames;mined+=L.mined;CNT.laps=laps;CNT.mined=mined;
        try{normFold(NACC,normNow());}catch(e){note("норма: "+(e&&e.message));}
      }
    }catch(e){note("стенд: "+(e&&e.message));}
    /* закупка под привоз уходит из расхода в вычет из валового: U/G — давление содержания, а не оборот товара */
    const buy=BOOK.spend["закупка"]||0;delete BOOK.spend["закупка"];
    const inv=Math.round(BOOK.spend["вложение"]||0);delete BOOK.spend["вложение"];
    const hrs=(G.t-t0)/HOUR,gross=sum(BOOK.gross)-buy,spend=sum(BOOK.spend);
    try{normFold(NACC,normNow());}catch(e){note("норма: "+(e&&e.message));}
    const NORM=normSum(NACC);
    if(ENV.ECO_TRACE)console.log("  "+tier.name+": прыжков "+JUMPS+" · выработано планет "+DONE.size);
    DONE.clear();JUMPS=0;
    if(ENV.ECO_TRACE)console.log("  "+tier.name+" итог: часов "+hrs.toFixed(2)+" · дроны "+G.drones.map(d=>d.res+" рейсов "+d.trips+" продано "+d.sold+" заработал "+d.earned+" [t0−now "+((clockNow()-d.t0)/1000).toFixed(0)+" с · круг "+(droneTripMs(d)/1000).toFixed(0)+" с · down "+(d.down|0)+" · stuck "+(d.stuck|0)+" · pool "+d.pool+" · occ "+occLvl(d.sx,d.sy)+" · тиков "+TICKS+"]").join("; ")+
      " · руки "+G.crew.map(c=>c.spec+" рейсов "+(c.trips|0)+" потрачено "+Math.round(c.spent||0)+" долг "+Math.round(c.debt||0)+" мораль "+(c.morale==null?"—":c.morale.toFixed(2))).join("; "));
    bookOff();
    const O=ORACLE[tier.o||tier.name];
    const pct=(a,b)=>b?Math.round((a/b-1)*100):0;
    rows.push({tier:tier.name,hull:tier.hull,laps,minLap:laps?(lapF/laps/FR/60):0,mined,hrs,
      gross:gross/hrs,spend:spend/hrs,net:(gross-spend)/hrs,press:gross?spend/gross:0,
      gsrc:Object.entries(BOOK.gross).map(([k,v])=>k+" "+Math.round(v/hrs)).join(", ")+(buy?" − закупка "+Math.round(buy/hrs):""),
      ssrc:Object.entries(BOOK.spend).map(([k,v])=>k+" "+Math.round(v/hrs)).join(", "),
      dG:pct(gross/hrs,O.gross),dU:pct(spend/hrs,O.upkeep),dN:pct((gross-spend)/hrs,O.net),
      fails:Object.entries(fail).map(([k,v])=>k+(v>1?" ×"+v:"")).join("; "),
      fuel:Object.entries(BOOK.fuel).map(([k,v])=>k+" "+(v/hrs).toFixed(0)).join(", ")+
        " · пришло "+Object.entries(BOOK.fin).map(([k,v])=>k+" "+(v/hrs).toFixed(0)).join(", "),
      hullLoss:Object.entries(BOOK.hull).map(([k,v])=>k+" "+(v/hrs).toFixed(0)).join(", "),
      sold:Object.entries(BOOK.sold).sort((a,b)=>b[1][1]-a[1][1]).map(([k,v])=>k+" "+v[0]+"×"+(v[0]?Math.round(v[1]/v[0]):0)+" ("+Object.keys(v[2]).length+" ст., прейскурант "+(v[0]?Math.round(v[3]/v[0]):0)+")").join(", "),
      time:Object.entries(BOOK.time).sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+" "+(laps?v/laps/FR/60:0).toFixed(2)).join(", "),
      hull:tier.fresh?G.shipId:tier.hull,credits:G.credits,
      disp:DSTAT.done+" дел · "+Math.round(DSTAT.pay/hrs)+" кр/ч · "+(DSTAT.frames/FR/60/hrs).toFixed(1)+" мин/ч · взято "+JSON.stringify(DSTAT.took)+(Object.keys(DSTAT.skip).length?" · сорвано "+JSON.stringify(DSTAT.skip):"")+" · ушло по сроку "+dispSt().lost+" · не взято (убыток, бак, касса) "+DSTAT.poor.size,
      tl:TL?Object.assign({},TL):null,norm:NORM,inv,est:estReport(),lad:[LAD0,ecoLadder(LAD0.sys,ENV.ECO_SAVE==="1")],
      /* дроны (§3.1 строка запчастей — 6 кр/мин на машину): что каждая приносит в час */
      drn:G.drones.map(d=>({res:d.res,h:Math.max(1e-9,(clockNow()-(d.bornMs||d.t0||clockNow()))/3600000),
        earned:d.earned|0,trips:d.trips|0,down:d.down|0}))});
  }
  stepWorld=sw0;FRESH.off();
  ecoPrint(rows,{hours:HOURS,human:HUMAN,env:ENV,hireFee:HIRE_FEE});
  ok(rows.length>=1&&rows.every(r=>r.hrs>0),"экономика прогнана: "+rows.length+" ярусов");
});
