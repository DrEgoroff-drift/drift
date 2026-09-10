/* ══════════════ автотесты: инструменты (M442) ══════════════
   docs/DESIGN-tests.md §3.1. Проверка — это договор «сделай вот это, и мир
   должен ответить вот так». До M442 руки и глаза каждый набор писал себе сам:
   `hands` (91zzzzzzz) снимал подпись кадра, `promise` (91zzzzzi) считал голос
   игры и собирал кнопки, фуззер (91zzzz) ставил сцены и прожитый мир, `keys`
   (91zzzzze) держал клавишу, e2e (91zzzzz) жал всё подряд. Здесь они собраны
   в одно место и зовутся одинаково — детекторам (M443) и сценариям (M444)
   нечего писать заново. Старые имена (`fuzzRich`, `prSpoke`, `e2eHands` …)
   остались тонкими обёртками в своих файлах: наборы, которые их зовут, не
   менялись.

   Руки — меняют мир:
     T.go(сцена, зерно)      свежий мир (resetWorld) и сцена из lookScenes() —
                             по-русски («шахта») или латиницей ("dig"); зерно — рукам
     T.press(клавиша, кадров, {edge, draw})   держать клавишу (или массив) N кадров
     T.hands(кадров, each, зерно)             случайные руки, сеяные (e2eHands)
     T.tap(надпись|id)  или  T.tap(x, y)      кнопка на экране / тычок в канву
     T.drag(dx, dy, {x, y})                   протяжка пальцем по канве
     T.wheel(n)                               колесо над канвой: n>0 — крупнее
     T.wait(кадров)                           мир живёт без рук, последний кадр рисуется
     T.advance(суток)                         часы вперёд, ленивые такты догоняют
     T.window(w, h)  /  T.window()            подменить кадр (W, H, мерка UIK) / вернуть
     T.give("credits"|"cargo"|"module"|"rich"|"late", …)
     T.board(станция|"near")  /  T.leave()    причалить и открыть станцию / отчалить
     T.bot(цель, арг)         бот с целью (M444): star · station · planet · dock ·
                             undock · sell · land · mine · ship · launch · dig ·
                             up · jump {sx,sy} · save — теми же клавишами и
                             кнопками, что игрок; ответ {ok, frames, why}
   Глаза — читают мир:
     T.frame() / T.diff(a,b)  подпись кадра (каждая восьмая проба яркости) и доля сдвига
     T.state()                {hash, snap, purse}: stateHash() мира (08a), снимок сейва, кошелёк
     T.look()                 числа кадра прибора (lookFrame, 28y-look)
     T.ledger(fn)             что кадр сделал с канвой: вызовы по именам, тексты с кеглем
     T.text()                 {dom, canvas}: видимый текст вёрстки и то, что кадр написал
     T.controls(где, {…})     видимые нажимаемые узлы с именем (надпись, aria-label, id)
     T.clock()                {now, shiftMs, days, t, pinned} — игровые часы (M441)
   Прочее: T.dom() ответ вёрстки строкой · T.calm() закрыть открытое · T.spoke(fn)
   сказала ли игра что-то · T.said() счётчик голоса · T.find(pred) ближняя
   система · T.landWhere(pred) полоса по условию · T.scenes() · T.ticks()
   ленивые такты · T.urlSeed() зерно из ?fseed.

   Всё, что инструмент меняет вне G (подмена кадра, сдвиг часов), он
   возвращает сам: `suite()` зовёт T._undo() после каждого набора.

   Каркас вправе проверять окружение; наборы — нет (сеть в 90-harness). */

/* ленивые такты: всё, что считается по часам, а не по кадрам (M354). Список
   переехал из 91zzzzzb-clock: им пользуются и часы, и T.advance */
const CLK_TICKS=["tickDrones","crewTick","mgrTick","newsTick","offerTick","qslTick","skyTick",
  "mayakTick","orderTick","instTick","zooTick","traineeTick","recordTick","chartsTick","ringTick",
  "expDayTick","expDepartTick","vegaDayTick","vegaAmbientTick","lastRunTick","planetTick",
  "mirrorEchoTick","firstTick","lockerTick"];

const T=(()=>{
  /* латинские имена сцен — для скриптов снаружи (docs/stand.py знает те же) */
  const SCENE_ALIAS={system:"система",map:"карта",landing:"заход",surface:"грунт день",day:"грунт день",
    night:"грунт ночь",dig:"шахта",cave:"пещера",belt:"пояс",wanderer:"сорока",raid:"рейд",
    winter:"зимовка",spa:"санаторий",scoop:"черпак",base:"база",home:"дом"};
  let seed=0,said=0,clockMs=0,clockT0=null,winSaved=null;

  /* ── голос игры (из 91zzzzzi-promise, M355) ──
     «Игра что-то сказала» считается по вызовам say/tell/logAdd, а не по
     тексту: одинаковый отказ подряд оставляет строку прежней. */
  for(const nm of ["say","tell","logAdd"]){
    const f=window[nm];
    window[nm]=function(){said++;return f.apply(this,arguments);};
  }
  function spoke(fn){const n=said;fn();return said>n;}

  /* ── зерно (из 91zzzz-fuzz, M339) ── ?fseed=N даёт другую тропу целиком */
  function urlSeed(){const m=/[?&]fseed=(\d+)/.exec(location.search);return m?(+m[1]>>>0):0;}
  function scenes(){return lookScenes().map(x=>x.id);}
  /* зерно сеет и руки, и игровой rnd() (M441): resetWorld ставит общее
     TEST_SEED, а названное зерно — поверх, до постановки сцены */
  function go(scene,s){
    seed=(s==null)?urlSeed():(s>>>0);
    resetWorld();
    if(seed)rndSeed(seed);
    if(scene==null||scene==="старт"||scene==="start")return true;
    const id=SCENE_ALIAS[scene]||scene;
    const sc=lookScenes().find(x=>x.id===id);
    if(!sc)throw new Error("T.go: сцены «"+scene+"» нет (есть: "+scenes().join(", ")+")");
    return sc.set()!==false;
  }

  /* ── клавиши (из 91zzzzze-keys) ── шаг кадра тот же, что у фуззера */
  function step(){stepWorld(1);G.t+=1;}
  function press(k,n,o){
    n=(n==null)?1:n;o=o||{};
    const ks=(k==null)?[]:[].concat(k);
    for(const q of ks)if(!(q in keys))throw new Error("T.press: клавиши «"+q+"» нет (есть: "+Object.keys(keys).join(",")+")");
    for(const q in keys)keys[q]=false;
    for(const q of ks)keys[q]=true;
    const act=ks.indexOf("act")>=0,every=o.edge|0;
    try{
      for(let i=0;i<n;i++){
        actEdge=act&&(i===0||(every>0&&i%every===0));
        step();
        if(o.draw&&i%o.draw===0)drawWorld();
      }
    }finally{for(const q in keys)keys[q]=false;actEdge=false;}
    return n;
  }
  /* случайные руки: те же клавиши, что у фуззера, короткими сеансами (e2eHands) */
  function hands(n,each,s){
    const r=rng(hashi(0xE2E,(s==null)?seed:s,17));
    const KS=["left","right","thrust","brake","act","fire"];
    try{
      for(let i=0;i<n;i++){
        if(i%4===0){for(const k of KS)keys[k]=r()<.3;actEdge=keys.act&&r()<.5;}
        else actEdge=false;
        if(each)each(i);else stepWorld(1);
        G.t+=1;
      }
    }finally{for(const k in keys)keys[k]=false;actEdge=false;}
  }
  function wait(n,o){
    n=(n==null)?1:n;
    for(let i=0;i<n;i++)step();
    if(!o||o.draw!==false)drawWorld();
    return n;
  }

  /* ── указатель по канве: координаты кадра (W×H), а не страницы ── */
  function ptr(type,x,y){
    const rc=cvs.getBoundingClientRect(),kx=(rc.width||W)/W,ky=(rc.height||H)/H;
    const E=window.PointerEvent||window.MouseEvent;
    cvs.dispatchEvent(new E(type,{pointerId:7,isPrimary:true,button:0,bubbles:true,cancelable:true,
      clientX:(rc.left||0)+x*kx,clientY:(rc.top||0)+y*ky}));
  }
  function tap(a,b){
    if(typeof a==="number"){ptr("pointerdown",a,b);ptr("pointerup",a,b);return true;}
    const all=controls();
    const c=all.find(c=>c.id===a)||all.find(c=>c.lbl===a)||all.find(c=>c.lbl.indexOf(a)===0);
    if(!c)return null;
    const n=said;c.el.click();
    return {el:c.el,id:c.id,lbl:c.lbl,spoke:said>n};
  }
  function drag(dx,dy,o){
    o=o||{};const x0=(o.x==null)?W/2:o.x,y0=(o.y==null)?H/2:o.y,N=o.steps||6;
    ptr("pointerdown",x0,y0);
    for(let i=1;i<=N;i++)ptr("pointermove",x0+dx*i/N,y0+dy*i/N);
    ptr("pointerup",x0+dx,y0+dy);
  }
  function wheel(n){
    n=(n==null)?1:n;const E=window.WheelEvent||window.MouseEvent,k=n<0?1:-1;
    for(let i=0;i<Math.abs(n);i++)cvs.dispatchEvent(new E("wheel",{deltaY:120*k,bubbles:true,cancelable:true}));
  }

  /* ── часы (из 91zzzzzb-clock, M354) ──
     Игровые часы M441: сдвиг — clockSet от now(), откат — clockSet обратно.
     Date.now игра больше не читает (закон в build.ps1), подменять его незачем. */
  function clockShift(ms){
    const t0=now();clockSet(t0+ms);
    return ()=>{clockSet(t0);};
  }
  function ticks(n){
    const bad={};
    for(let i=0;i<(n||1);i++)for(const name of CLK_TICKS){
      try{window[name]();}catch(e){bad[name]=(e&&e.message)||String(e);}
    }
    return bad;
  }
  function advance(days){
    if(clockT0===null)clockT0=now();
    clockMs+=days*864e5;
    clockSet(clockT0+clockMs);
    return ticks(1);
  }
  function clock(){return {now:now(),shiftMs:clockMs,days:clockMs/864e5,t:G.t,pinned:clockPinned()};}

  /* ── окно: подменяется КАДР целиком (из 91zzzzzzz-hands, «мерка») ──
     Мерка интерфейса выводится из размеров кадра, «×1.75 в окне 800» — кадр,
     которого в жизни нет. Холст и вёрстка остаются от настоящего окна: здесь
     судят то, что канва раскладывает по своей раме. Настоящее окно — docs/stand.py. */
  function win(w,h){
    if(w==null){if(winSaved){W=winSaved.W;H=winSaved.H;UIK=winSaved.U;winSaved=null;}return {W,H,UIK};}
    if(!winSaved)winSaved={W,H,U:UIK};
    W=w;H=h;UIK=uiScale(W,H);
    return {W,H,UIK};
  }

  /* ── подарки ── */
  function rich(){   /* прожитый мир (из 91zzzz-fuzz, fuzzRich) */
    G.credits=500000;G.data=4000;
    G.mods={engine:3,tank:3,hold:3,armor:2,drill:3,hyper:2,weapon:2};
    G.modsOwned={engine:3,tank:3,hold:3,armor:2,drill:3,hyper:2,weapon:2};
    G.tech=new Set(["synth","beacon","radar"]);
    G.home=homeInit();G.home.tier=6;G.home.sx=G.sx;G.home.sy=G.sy;
    /* собранное: редкости, куски отчёта, узлы — каждое со своим экраном */
    for(let i=0;i<40;i++)rareTake("poi",(i*7919)>>>0);
    for(let i=0;i<30;i++)loreTake((i*104729)>>>0);
    for(let i=0;i<12;i++)nodeDrop("в аномалии",1,(i*31+7)>>>0);
    /* осмотренные памятники: та самая ветка, на которой автор поймал зависание */
    for(const k of Object.keys(POI_FIND))poiInspect({k,seed:(k.length*2654435761)>>>0,ru:POI_FIND[k].ru});
    const m=genMgr(12345,["fact"]);if(m)try{hireMgr(m);}catch(e){}
    /* дроны в рейсе — и в этой системе, и в соседней */
    const now=clockNow();
    G.droneInventory=2;
    G.drones=[0,1,2].map(i=>({id:i+1,sx:G.sx,sy:G.sy,pi:i%2,res:["iron","titan","crystal"][i],
      rate:.6,pool:150,soldAtMs:now,t0:now-9000*i,lastMs:now-9000*i,bornMs:now-3600000,
      trips:3+i,down:i===2?now+300000:0,sold:20,earned:900,carry:.4}));
    tickDrones();
  }
  function late(){   /* поздний мир (из 91zzzzz-e2e-life, e2eLate) */
    rich();
    const key=G.sx+","+G.sy,now=clockNow();
    G.place[key+"/0"]={f:1,l:2,n:3,take:1,hurt:0,care:2};
    G.occCalm[key]=1;G.names[key]="Отрадное";G.rep[key]=3;
    const Hd=G.hold[key]=G.hold[key]||{};
    Hd.deeds={drone:6,drill:4,cargo:900};
    Hd.bld={};
    let n=0;
    for(const id in BLD){Hd.bld[id]={lvl:3,t0:now-2e6,ready:now-1e6,my:{},got:{}};if(++n>=6)break;}
    coopStamp("Сквозной");   /* найм — кооперативу (M351) */
    for(const c of stationMercs(G.sys).slice(0,3)){try{hireMerc(c);}catch(e){}}
    try{bldTick();}catch(e){}
  }
  function give(what,a,b){
    if(what==="credits"){G.credits=(+G.credits||0)+(+a||0);return G.credits;}
    if(what==="cargo"){
      if(RES_KEYS.indexOf(a)<0)throw new Error("T.give: груза «"+a+"» нет (есть: "+RES_KEYS.join(",")+")");
      G.cargo[a]=(G.cargo[a]|0)+((b==null)?1:b);return G.cargo[a];
    }
    if(what==="module"){
      if(!(a in G.mods))throw new Error("T.give: модуля «"+a+"» нет (есть: "+Object.keys(G.mods).join(",")+")");
      const lv=(b==null)?1:b;G.mods[a]=lv;G.modsOwned[a]=Math.max(G.modsOwned[a]|0,lv);return lv;
    }
    if(what==="rich"){rich();return true;}
    if(what==="late"){late();return true;}
    throw new Error("T.give: не знаю «"+what+"» (credits|cargo|module|rich|late)");
  }

  /* ── станция ── */
  function find(pred){   /* ближняя система по кольцам (из e2eFind) */
    for(let r=0;r<12;r++)for(let x=-r;x<=r;x++)for(let y=-r;y<=r;y++){
      if(Math.max(Math.abs(x),Math.abs(y))!==r)continue;
      if(!starAt(x,y))continue;
      const s=getSystem(x,y);if(pred(s))return s;
    }
    return null;
  }
  /* полоса по условию: первая твёрдая планета по кольцам, где pred(G.surf) —
     правда (свежий мир на каждой). Для наборов, которым тестовой планеты мало:
     памятника или стаи на ней может не быть вовсе */
  function landWhere(pred,rings){
    for(let r=0;r<(rings||5);r++)for(let x=-r;x<=r;x++)for(let y=-r;y<=r;y++){
      if(Math.max(Math.abs(x),Math.abs(y))!==r||!starAt(x,y))continue;
      const n=(getSystem(x,y).planets||[]).length;
      for(let i=0;i<n;i++){
        resetWorld();G.sx=x;G.sy=y;G.sys=getSystem(x,y);
        const p=G.sys.planets[i];if(p.type==="gas")continue;
        /* садимся той же дверью, что игрок: памятники вписывает startLanding
           (genPOI), и полоса без захода их не знает вовсе */
        startLanding(p);enterSurface();
        if(pred(G.surf))return G.surf;
      }
    }
    resetWorld();return null;
  }
  function board(s){
    if(s==="near"||s==="ближняя"){s=find(q=>!!q.station);if(!s)return false;}
    if(s&&s.sx!=null){SYS_CACHE.delete(s.key);const q=getSystem(s.sx,s.sy);
      G.sx=q.sx;G.sy=q.sy;G.sys=q;G.ap=null;G.orbit=null;}
    if(!G.sys.station)return false;
    G.st=G.sys.station;G.mode="dock";openStation();
    return true;
  }
  function leave(){try{closeStation();}catch(e){}G.mode="system";G.st=null;}
  /* ── бот с целью (M444, DESIGN-tests §3.3) ──
     Идёт теми же путями, что игрок: автопилот — тот же G.ap, что ставит тычок по
     планете или кнопка «К ЗВЕЗДЕ» (15-input); стыковка, посадка, спуск в шахту —
     ДЕЙСТВИЕ по фронту, как у штурвала; ходьба и бурение — клавиши; взлёт —
     удержание кнопки ВЗЛЁТ; продажа — кнопка ПРОДАТЬ ВСЁ на прилавке. Мир
     шагает без картинки (stepWorld), потолок кадров у каждой цели свой.
     Ответ всегда {ok, frames, why}: провал цели — не исключение, а слово,
     чтобы сценарий сказал, ГДЕ застрял. Цели:
       star · station · planet [p] · dock · undock · sell · land · mine ·
       ship · launch · dig [rows] · jump {sx,sy} · save */
  function until(pred,max){for(let i=0;i<max;i++){if(pred())return i;step();}return pred()?max:-1;}
  function hold(ks,pred,max){
    for(const q of ks)keys[q]=true;
    try{return until(pred,max);}finally{for(const q of ks)keys[q]=false;}
  }
  function bot(goal,arg){
    const t0=G.t,R=(ok,why)=>({ok:!!ok,frames:G.t-t0,why:ok?"":(why||"")});
    const fly=(ap,max)=>{G.ap=Object.assign({phase:"fly"},ap);G.orbit=null;const n=until(()=>!G.ap||!!G.orbit,max||4000);return n>=0;};
    switch(goal){
      case "star":{
        if(G.mode!=="system")return R(false,"не в полёте: "+G.mode);
        return R(fly({kind:"star"}),"до звезды не долетел за "+(G.t-t0)+" кадров, топливо "+G.fuel.toFixed(0));}
      case "station":{
        if(G.mode!=="system")return R(false,"не в полёте: "+G.mode);
        if(!G.sys.station)return R(false,"в системе нет станции");
        return R(fly({kind:"station"}),"до станции не долетел, топливо "+G.fuel.toFixed(0));}
      case "planet":{
        if(G.mode!=="system")return R(false,"не в полёте: "+G.mode);
        const p=arg||(G.sys.planets||[]).find(q=>q.type!=="gas");
        if(!p)return R(false,"твёрдой планеты нет");
        return R(fly({kind:"planet",p}),"до планеты не долетел, топливо "+G.fuel.toFixed(0));}
      case "dock":{
        if(G.mode==="dock")return R(true);   /* автостыковка (G.opts.autoDock): автопилот уже открыл станцию */
        if(G.mode!=="system")return R(false,"не в полёте: "+G.mode);
        const S=G.sys.station;if(!S)return R(false,"в системе нет станции");
        const sh=G.ship,ds=()=>Math.hypot(sh.x-S.x,sh.y-S.y),sp=()=>Math.hypot(sh.vx-S.vx,sh.vy-S.vy);
        if(ds()>=95)return R(false,"до станции "+Math.round(ds())+" ед. — сперва bot(«station»)");
        if(hold(["brake"],()=>sp()<2.4,120)<0)return R(false,"скорость не гасится: "+sp().toFixed(1));
        press("act",1);
        return R(G.mode==="dock","ДЕЙСТВИЕ у причала не открыло станцию: "+G.mode+" · "+G.prompt.split("\n")[0]);}
      case "undock":{
        if(G.mode!=="dock")return R(false,"не на станции: "+G.mode);
        const c=tap("ОТСТЫКОВ")||tap("undock");
        if(!c)leave();
        return R(G.mode==="system","после отстыковки режим "+G.mode);}
      case "sell":{
        if(G.mode!=="dock")return R(false,"не на станции: "+G.mode);
        if(!TRADE_KEYS.some(k=>G.cargo[k]>0))return R(false,"трюм пуст — продавать нечего");
        const cr=G.credits;
        tab="market";syncTabs();renderTab();
        const c=tap("ПРОДАТЬ ВСЁ");
        if(!c)return R(false,"кнопки ПРОДАТЬ ВСЁ нет на прилавке");
        return R(G.credits>cr,"кнопка нажата, а кредиты те же: "+cr);}
      case "land":{
        if(G.mode!=="system")return R(false,"не в полёте: "+G.mode);
        const easy=G.opts.easyLand;G.opts.easyLand=true;   /* бот садится автоматом — это настройка игрока */
        try{
          step();   /* подсказка «ДЕЙСТВИЕ — ПОСАДКА» ставится кадром у планеты */
          if(!/ПОСАДКА/.test(G.prompt))return R(false,"у планеты нет подсказки посадки: «"+G.prompt.split("\n")[0]+"»");
          press("act",1);
          if(G.mode!=="landing")return R(false,"ДЕЙСТВИЕ не начало заход: "+G.mode);
          const n=until(()=>G.mode!=="landing",6000);
          return R(G.mode==="surface","заход кончился режимом "+G.mode+(n<0?" (не сел за 6000 кадров)":""));
        }finally{G.opts.easyLand=easy;}}
      case "mine":{
        if(G.mode!=="surface")return R(false,"не на грунте: "+G.mode);
        const S=G.surf,st=stat();
        const dep=(S.deposits||[]).filter(d=>d.left>0).sort((a,b)=>Math.abs(a.x-S.x)-Math.abs(b.x-S.x))[0];
        if(!dep)return R(false,"залежей на полосе нет");
        if(held()>=st.cargoMax)return R(false,"трюм полон до начала");
        const dir=dep.x>S.x?"right":"left";
        if(hold([dir],()=>Math.abs(dep.x-S.x)<16,4000)<0)return R(false,"до залежи не дошёл: "+Math.round(Math.abs(dep.x-S.x))+" м");
        const h0=held();
        hold(["act"],()=>held()>=st.cargoMax||dep.left<=0,3000);
        return R(held()>h0,"бурение не дало ни единицы: "+RES[dep.res].ru+" · "+G.prompt.split("\n")[0]);}
      case "ship":{
        if(G.mode!=="surface")return R(false,"не на грунте: "+G.mode);
        const S=G.surf;const dir=S.shipX>S.x?"right":"left";
        if(Math.abs(S.x-S.shipX)<shipZoneR())return R(true);
        return R(hold([dir],()=>Math.abs(S.x-S.shipX)<shipZoneR()*.8,4000)>=0,"до корабля не дошёл: "+Math.round(Math.abs(S.x-S.shipX))+" м");}
      case "launch":{
        if(G.mode!=="surface")return R(false,"не на грунте: "+G.mode);
        if(!("launch" in keys))return R(false,"клавиши launch нет");
        const S=G.surf;if(Math.abs(S.x-S.shipX)>=shipZoneR())return R(false,"не у корабля — сперва bot(«ship»)");
        hold(["launch"],()=>G.mode!=="surface",120);
        return R(G.mode==="system","удержание ВЗЛЁТ не подняло корабль: "+G.mode+" · "+G.prompt.split("\n")[0]);}
      case "dig":{
        if(G.mode!=="surface")return R(false,"не на грунте: "+G.mode);
        const S=G.surf,mx=mineSpotX(S.p);
        if(mx!=null){   /* устье есть — к нему и вниз */
          const dir=mx>S.x?"right":"left";
          if(hold([dir],()=>Math.abs(mx-S.x)<MINE_MOUTH_R*.7,4000)<0)return R(false,"до устья не дошёл");
          step();press("act",1);
        }else{          /* устья нет — заложить: ДЕЙСТВИЕ на грунте вдали от корабля и залежей */
          const dir=S.x<S.shipX?"left":"right";let tries=0;
          while(G.mode==="surface"&&tries++<5){
            const x0=S.x;
            if(hold([dir],()=>Math.abs(S.x-x0)>=90||S.x<=32||S.x>=S.tr.W-32,600)<0)break;
            step();if(/ЗАЛОЖИТЬ ШАХТУ|СПУСТИТЬСЯ/.test(G.prompt))press("act",1);
          }
        }
        if(G.mode!=="dig")return R(false,"ДЕЙСТВИЕ не спустило в шахту: "+G.mode+" · "+G.prompt.split("\n")[0]);
        const rows=(arg==null)?3:arg|0,D=G.dig;
        hold(["brake"],()=>D.row>=rows||G.mode!=="dig",3000);
        return R(G.mode==="dig"&&D.row>=rows,"копал вниз, а ярус "+D.row+" из "+rows+" · "+G.prompt.split("\n")[0]);}
      case "up":{
        if(G.mode!=="dig")return R(false,"не в шахте: "+G.mode);
        hold(["thrust"],()=>G.mode!=="dig",4000);
        return R(G.mode==="surface","подъём кончился режимом "+G.mode);}
      case "jump":{
        if(G.mode!=="system")return R(false,"не в полёте: "+G.mode);
        if(!arg||arg.sx==null)return R(false,"куда прыгать — {sx,sy}");
        const from=G.sx+","+G.sy;
        /* карту ведёт её же кадр (drawMap), а не stepWorld: прыжок — ДЕЙСТВИЕ по
           фронту внутри кадра карты, как у игрока с выбранным сектором */
        G.mode="map";G.sel={x:arg.sx,y:arg.sy};
        try{actEdge=true;drawMap();}finally{actEdge=false;}
        if(G.mode==="map")return R(false,"прыжок не состоялся: "+G.prompt.split("\n")[0]+" · топливо "+G.fuel.toFixed(0));
        return R(G.mode==="system"&&G.sx+","+G.sy!==from,"после прыжка "+G.mode+" в "+G.sx+","+G.sy);}
      case "save":{
        saveGame(true);
        return R(!!snapshot(),"записи нет");}
      default:return R(false,"цели «"+goal+"» у бота нет");
    }
  }

  /* ── повтор записи (15c-rec, M444) ──
     replay(rec, {seed, hour, each}): для каждого отрезка — снимок его головы,
     случай и часы как были, потом те же клавиши тем же шагом. Возмущение:
     seed — другое семя мира, hour — другой час суток (часы сдвигаются на
     целые сутки+часы, календарь тот же). each(i) зовётся раз в кадр после
     шага — сюда встают детекторы. Ответ {frames, hash, mode} */
  function replay(rec,o){
    o=o||{};let n=0;
    for(const sg of rec.segs){
      const h=sg.head;
      resetWorld();
      applySave(JSON.parse(JSON.stringify(h.snap)));
      rndRestore(h.rnd);if(o.seed!=null)rndSeed(o.seed);
      let t0=h.now;
      if(o.hour!=null){const d=new Date(t0);d.setHours(o.hour,0,0,0);t0=d.getTime();}
      clockSet(t0);G.t=h.t;G.mode=h.mode;
      const KS=h.keys;prevAct=false;
      const ev=(sg.ev||[]).slice();
      for(let i=0;i<sg.f.length;i+=2){
        const m=sg.f[i],dt=(sg.f[i+1]||64)/64,fi=i/2;
        /* события кадра: цель автопилота, поставленная тычком */
        while(ev.length&&ev[0][0]<=fi){
          const e=ev.shift();
          if(e[1]==="planet"){const p=(G.sys.planets||[])[e[2]];if(p){G.ap={kind:"planet",p,phase:"fly"};G.orbit=null;}}
          else if(e[1]==="belt")G.ap={kind:"belt",ax:e[3],ay:e[4],phase:"fly"};
          else G.ap={kind:e[1],phase:"fly"};
        }
        for(let k=0;k<KS.length;k++)keys[KS[k]]=!!(m&(1<<k));
        actEdge=keys.act&&!prevAct;prevAct=keys.act;
        clockAdvance(dt*16.667);
        stepWorld(dt);G.t+=dt;n++;
        if(o.each)o.each(n);
      }
    }
    for(const k in keys)keys[k]=false;actEdge=false;prevAct=false;
    return {frames:n,hash:stateHash(),mode:G.mode};
  }

  /* ── глаза ── */
  /* подпись кадра: каждая восьмая проба яркости с настоящего холста (hFrame) */
  function frame(){
    const cx=cvs.getContext("2d"),w=cvs.width,h=cvs.height;
    const d=cx.getImageData(0,0,w,h).data,out=[];
    for(let y=0;y<h;y+=8)for(let x=0;x<w;x+=8){const i=(y*w+x)*4;out.push((d[i]+d[i+1]+d[i+2])/3);}
    return out;
  }
  /* доля проб, которые сдвинулись заметно для глаза (hDiff) */
  function diff(a,b){
    if(!a||!b||a.length!==b.length)return 1;
    let n=0;for(let i=0;i<a.length;i++)if(Math.abs(a[i]-b[i])>6)n++;
    return n/(a.length||1);
  }
  /* кошелёк мира: всё, чем кнопка может расплатиться или наградить (prState) */
  function purse(){
    let cargo=0;for(const k of RES_KEYS)cargo+=G.cargo[k]|0;
    /* полка «Сороки» читается как лежит: wanderStore() завёл бы запись лениво,
       и сам замер менял бы мир (и хэш T.state) */
    const Ws=G.wander||{};
    return {cr:G.credits|0,matches:G.matches|0,fuel:+G.fuel,hull:+G.hull,data:G.data|0,
      crew:(G.crew||[]).length,inv:(G.inv||[]).length,cargo,
      mods:Object.values(G.mods).reduce((a,b)=>a+b,0),
      tech:G.tech?G.tech.size:0,drones:(G.drones||[]).length,
      tools:(Ws.shelf||[]).length+(Ws.hold||[]).length,
      log:(G.log||[]).length,mode:G.mode,t:G.t};
  }
  function fnv(s){let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193);}return (h>>>0).toString(16).padStart(8,"0");}
  /* хэш — игровой stateHash() (08a, M441): один на игру и на тесты, с
     положением rnd() и часами. Снимок — сейв, для чтения глазами */
  function state(){
    return {hash:stateHash(),snap:snapshot(),purse:purse()};
  }
  function look(){return lookFrame();}
  /* ── бухгалтерия кадра ──
     Сколько вызовов канвы сделал кадр и каким кеглем он пишет. Кегль берётся
     из ctx.font и умножается на масштаб текущей матрицы, делённый на DPR, —
     то есть это пиксели экрана, которые видит игрок (закон M221: подпись,
     нарисованная мимо withScale(UIK), остаётся мелкой на большом окне). В Хроме
     перехватывается прототип (видны и запечённые слои, `main:false`), под
     Node — главный ctx игры. */
  const LEDGER_OPS=["fillRect","strokeRect","clearRect","fillText","strokeText","drawImage","fill","stroke","putImageData"];
  function ledger(fn){
    const L={calls:0,by:{},texts:[]};
    const wrap=(P,keep,ops)=>{
      for(const op of (ops||LEDGER_OPS)){
        const f=P[op];if(keep)keep[op]=f;
        P[op]=function(){
          L.calls++;L.by[op]=(L.by[op]|0)+1;
          if(op==="fillText"||op==="strokeText"){
            const m=/(\d+(?:\.\d+)?)px/.exec(this.font||"")||[0,0];
            const t=this.getTransform?this.getTransform():null;
            const k=t?Math.sqrt(Math.abs(t.a*t.d-t.b*t.c)):1;
            L.texts.push({s:String(arguments[0]),px:+m[1],css:+m[1]*k/(DPR||1),main:this.canvas===cvs});
          }
          return f.apply(this,arguments);
        };
      }
    };
    if(window.CanvasRenderingContext2D){   /* Хром: один прототип на все канвы */
      const P=CanvasRenderingContext2D.prototype,orig={};
      wrap(P,orig);
      /* …но свойство на самом ctx заслоняет прототип: набор, который подменял
         `ctx.fill` и «вернул» его присваиванием, оставил на ctx СОБСТВЕННОЕ
         свойство, и счёт главной канвы молча уходил в ноль (нашла перемешка,
         M442). Такие свойства оборачиваются отдельно и возвращаются как были */
      const own={};
      for(const op of LEDGER_OPS)if(Object.prototype.hasOwnProperty.call(ctx,op))own[op]=ctx[op];
      wrap(ctx,null,Object.keys(own));
      try{(fn||drawWorld)();}
      finally{
        for(const op of LEDGER_OPS)P[op]=orig[op];
        for(const op of LEDGER_OPS){if(op in own)ctx[op]=own[op];else if(Object.prototype.hasOwnProperty.call(ctx,op))delete ctx[op];}
      }
      return L;
    }
    /* Node: у заглушки канвы прототипа нет — оборачиваем главный ctx и каждый
       контекст, который кадр возьмёт через getContext (запечённые слои) */
    const seen=new Set(),EP=HTMLCanvasElement.prototype,gc=EP.getContext;
    const own=c=>{if(c&&!seen.has(c)){seen.add(c);wrap(c,null);}return c;};
    own(ctx);
    EP.getContext=function(){return own(gc.apply(this,arguments));};
    try{(fn||drawWorld)();}
    finally{EP.getContext=gc;for(const c of seen)for(const op of LEDGER_OPS)delete c[op];}
    return L;
  }
  function text(){
    const dom=String(document.body.innerText||"").split("\n").map(s=>s.trim()).filter(Boolean);
    const canvas=ledger().texts.filter(t=>t.main).map(t=>t.s);
    return {dom,canvas};
  }
  /* видимые нажимаемые узлы (из hRail, prButtons, e2eClickables): кнопка —
     не отключённая, прочее — с обработчиком. {all:true} — без проверки на
     видимость (жать и в закрытых экранах), {text:true} — только с надписью,
     {btn:true} — только кнопки */
  function controls(where,o){
    o=o||{};
    const box=(where==null)?document.body:((typeof where==="string")?document.querySelector(where):where);
    if(!box)return [];
    const out=[];
    for(const el of box.querySelectorAll("*")){
      if(el.tagName==="BUTTON"?el.disabled:(o.btn||!el.onclick))continue;
      if(!o.all){
        const cs=getComputedStyle(el);
        if(cs.display==="none"||cs.visibility==="hidden"||cs.pointerEvents==="none"||(cs.opacity!==""&&+cs.opacity<.2))continue;
        const r=el.getBoundingClientRect();if(r.width<8||r.height<8)continue;
      }
      const txt=String(el.textContent||"").replace(/\s+/g," ").trim();
      if(o.text&&!txt)continue;
      out.push({el,id:el.id||"",lbl:txt||el.getAttribute("aria-label")||el.title||el.id||""});
      if(out.length>=(o.cap||400))break;
    }
    return out;
  }
  /* ответ вёрстки: окно, меню, строка события — всё, что игрок тоже видит (hDom) */
  function dom(){
    const m=document.getElementById("msg"),p=document.getElementById("prompt"),mn=document.getElementById("menu");
    return [document.body.className,
            document.querySelectorAll(".scr.open").length,
            document.querySelectorAll(".askbox").length,
            mn?getComputedStyle(mn).display:"",
            m?m.textContent:"",p?p.textContent:""].join("|");
  }
  /* закрыть всё, что тычок мог открыть — ЕЁ ЖЕ дверью (hCalm). Окно ввода
     (#askwin) — такой же `.scr`: закрывается снятием «open». hCalm его
     ВЫРЕЗАЛ (`.askbox` → remove), а игра заводит окно один раз и потом
     ищет в нём строку: после руки́ каждый следующий askText падал на null.
     В обычном порядке руки шли последними и этого не было видно — нашла
     перемешка (?shuffle=7, M442) */
  function calm(){
    toggleMenu(false);
    for(const e of document.querySelectorAll(".scr.open"))e.classList.remove("open");
    document.body.classList.remove("screen","table");
  }
  function _undo(){
    if(winSaved)win();
    if(clockT0!==null){clockSet(clockT0);clockT0=null;clockMs=0;}
  }
  return {go,press,hands,tap,drag,wheel,wait,advance,window:win,give,board,leave,bot,replay,
    frame,diff,state,purse,look,ledger,text,controls,clock,
    dom,calm,spoke,said:()=>said,find,landWhere,scenes,ticks,clockShift,urlSeed,
    get seed(){return seed;},_undo};
})();
/* ── самопроверка рук и глаз; конец инструментов — после детекторов (90c) ── */

TEST_SUITES.push(()=>suite("инструменты: руки и глаза отвечают тем, что обещают",{tier:"browser"},()=>{
  /* сцена ставится, и мир свежий */
  G.credits=12345;
  ok(T.go("шахта",3)===true&&G.mode==="dig","T.go ставит сцену по-русски: "+G.mode);
  eq(G.credits,600,"и из свежего мира (resetWorld)");
  eq(T.seed,3,"зерно запомнено");
  ok(T.go("system")===true&&G.mode==="system","и латиницей");
  let threw="";try{T.go("нет такой");}catch(e){threw=e.message;}
  ok(/сцены/.test(threw),"незнакомая сцена — исключение, а не тишина");
  /* клавиша двигает корабль, и её отпускают */
  T.go("старт");G.mode="system";G.fuel=100;
  const v0=Math.hypot(G.ship.vx,G.ship.vy),t0=G.t;
  eq(T.press("thrust",30),30,"T.press отработал тридцать кадров");
  ok(Math.hypot(G.ship.vx,G.ship.vy)>v0+.01,"тяга разогнала корабль");
  eq(G.t,t0+30,"время шло по кадру");
  ok(Object.keys(keys).every(k=>!keys[k]),"после T.press ни одна клавиша не зажата");
  threw="";try{T.press("нетклавиши",1);}catch(e){threw=e.message;}
  ok(/клавиши/.test(threw),"незнакомая клавиша — исключение");
  /* хэш состояния: тот же мир — тот же хэш, другой — другой */
  const a=T.state(),b=T.state();
  const moved=Object.keys(b.snap).filter(k=>k!=="ts"&&JSON.stringify(a.snap[k])!==JSON.stringify(b.snap[k]));
  eq(a.hash,b.hash,"один мир — один хэш"+(moved.length?" (сдвинулось: "+moved.join(", ")+")":""));
  T.give("credits",500);
  ok(T.state().hash!==a.hash,"деньги поменяли хэш");
  eq(T.state().purse.cr,a.purse.cr+500,"и кошелёк видит подарок");
  eq(T.give("cargo","iron",4),4,"груз кладётся");
  threw="";try{T.give("cargo","пыль",1);}catch(e){threw=e.message;}
  ok(/груза/.test(threw),"незнакомый груз — исключение");
  /* часы: сутки вперёд и назад в конце набора */
  const c0=T.clock().now;
  T.advance(1);
  near(T.clock().now-c0,864e5,2000,"T.advance(1) двинул часы на сутки");
  eq(T.clock().days,1,"и помнит сдвиг");
  T._undo();
  ok(Math.abs(T.clock().now-c0)<2000,"_undo вернул часы");
  /* кадр подменяется и возвращается */
  const W0=W,U0=UIK;
  const f=T.window(2560,1440);
  ok(f.UIK>U0&&W===2560,"T.window подменил кадр и мерку: ×"+f.UIK.toFixed(2));
  T.window();
  eq(W,W0,"T.window() вернул кадр");
  /* кадр, бухгалтерия и прибор */
  T.go("система");
  T.wait(2);
  const s1=T.frame();
  ok(s1.length>1000&&s1.some(v=>v>10),"подпись кадра снята и не чёрная: "+s1.length+" проб");
  eq(T.diff(s1,s1),0,"кадр с самим собой не расходится");
  const L=T.ledger();
  ok(L.calls>50&&L.by.fillText>0,"кадр системы: вызовов канвы "+L.calls+", текстов "+(L.by.fillText|0));
  ok(L.texts.some(t=>t.main&&t.css>=6),"кегль текста на главной канве читается: до "+Math.max(...L.texts.map(t=>t.css)).toFixed(1)+" px");
  ok(T.look().tones>=0,"прибор кадра меряет");
  const X=T.text();
  ok(X.dom.length>0&&X.canvas.length>0,"видимый текст: вёрстка "+X.dom.length+" строк, канва "+X.canvas.length);
  /* кнопки: плюс на борту приближает камеру, колесо — тоже */
  hud();
  /* на телефоне борт короче (КАРТА, МЕНЮ) и коробки «+ −» нет вовсе:
     самопроверка спрашивает то, что в этом окне есть, а не ждёт широкого */
  const rail=T.controls(".rail",{btn:true});
  ok(rail.length>=2&&rail.every(c=>c.lbl),"на борту видны кнопки, и у каждой есть имя: "+rail.map(c=>c.lbl).slice(0,6).join(", "));
  const z0=G.zoom;
  if(T.controls(".zoom",{btn:true}).some(c=>c.id==="zin"))
    ok(!!T.tap("zin")&&G.zoom>z0,"T.tap(«zin») приблизил камеру: "+z0.toFixed(2)+" → "+G.zoom.toFixed(2));
  else eq(T.tap("zin"),null,"коробки «+ −» в этом окне нет, и T.tap(«zin») честно отвечает null");
  const z1=G.zoom;T.wheel(1);
  ok(G.zoom>z1,"T.wheel(1) — крупнее и без коробки");
  /* протяжка по карте двигает лист */
  G.mode="map";drawMap();
  const V0=JSON.stringify(mapViewC());
  T.drag(-120,0);
  ok(JSON.stringify(mapViewC())!==V0,"T.drag сдвинул лист карты");
  G.mode="system";
  /* станция открывается и закрывается своими дверями */
  ok(T.board("near")===true&&G.mode==="dock","T.board причалил к ближней станции");
  ok(document.getElementById("station").classList.contains("open"),"и экран станции открыт");
  T.leave();
  ok(!document.getElementById("station").classList.contains("open")&&G.mode==="system","T.leave отчалил");
  /* бот отвечает словом, а не исключением: не на станции — так и говорит */
  const bt=T.bot("sell");
  ok(bt&&bt.ok===false&&/не на станции/.test(bt.why),"T.bot(«sell») в полёте: «"+(bt&&bt.why)+"»");
  const b2=T.bot("нет такой цели");
  ok(b2&&!b2.ok&&/нет/.test(b2.why),"незнакомая цель — тоже словом");
  resetWorld();
}));
