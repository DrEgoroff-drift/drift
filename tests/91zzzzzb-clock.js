/* ══════════════ часы поехали (M354) ══════════════
   Половина мира считается лениво по `Date.now()`: дроны, руки, ящик конторы,
   стройка, смена станции, письма. Игра при этом стоит на трёх допущениях, ни
   одно из которых на настоящем устройстве не выполняется:
   часы идут вперёд, идут равномерно, и между сеансами проходит немного.

   Что бывает на самом деле: ноутбук проснулся через полгода; на телефоне
   поправили часовой пояс и время УШЛО НАЗАД; сейв приехал из облака с
   отметкой из будущего (у того устройства часы спешат). Набор про чужие часы
   (91zzzzy-time) двигает отметки В САМОМ СЕЙВЕ на трое суток. Здесь двигают
   САМИ ЧАСЫ, и на годы.

   Договор простой и проверяемый:
   1. назад — ничего не платится и не начисляется, и ни один такт не бросает;
   2. вперёд на годы — потолки офлайна держат, денег не приходит бесконечность;
   3. ни в первом, ни во втором случае в состоянии не заводится NaN.

   Проверка разностная: список тактов, которые роняют мир ДО сдвига, снимается
   заранее — краснеет только то, что сломалось ИМЕННО от часов. */

const CLK_TICKS=["tickDrones","crewTick","mgrTick","newsTick","offerTick","qslTick","skyTick",
  "mayakTick","orderTick","instTick","zooTick","traineeTick","recordTick","chartsTick","ringTick",
  "expDayTick","expDepartTick","vegaDayTick","vegaAmbientTick","lastRunTick","planetTick",
  "mirrorEchoTick","firstTick","lockerTick"];
/* сколько имён из списка вправду существует. Без этой проверки набор был бы
   тем самым «typeof-сторожем»: опечатка в имени — и он молча гоняет пустоту
   и зеленеет (CLAUDE.md, урок про mkview). */
function clkMissing(){
  return CLK_TICKS.filter(n=>typeof ((typeof window!=="undefined")?window[n]:null)!=="function");
}
/* прогон всех тактов: возвращает карту «имя → сообщение об исключении» */
function clkRun(n){
  const bad={};
  for(let i=0;i<(n||1);i++)for(const name of CLK_TICKS){
    const f=(typeof window!=="undefined")?window[name]:null;
    if(typeof f!=="function")continue;
    try{ f(); }catch(e){ bad[name]=(e&&e.message)||String(e); }
  }
  return bad;
}
/* мир, в котором есть чему тикать: руки, дроны, ящик, стройка, кооператив */
function clkWorld(){
  resetWorld();
  if(typeof e2eLate==="function")e2eLate();else fuzzRich();
  if(typeof lockerRec==="function"){
    const L=lockerRec();
    L.res=L.res||{};L.res[RES_KEYS[0]]=40;
    L.t=Date.now()-3*24*3600*1000;   /* трое суток хранения уже набежало */
  }
  if(typeof droneNextId==="function"&&G.drones.length<2){
    const now=Date.now();
    G.drones.push({id:droneNextId(),sx:G.sx,sy:G.sy,pi:-1,res:RES_KEYS[0],rate:2,pool:-1,
      soldAtMs:now,t0:now,lastMs:now,bornMs:now,trips:0,down:0,sold:0,earned:0});
  }
  clkRun(1);   /* один раз по-честному, чтобы отметки встали на «сейчас» */
}
/* подмена часов на время опыта; возвращает функцию «вернуть как было» */
function clkShift(ms){
  const real=Date.now;
  Date.now=function(){ return real.call(Date)+ms; };
  return ()=>{ Date.now=real; };
}
function clkNaN(){ return (typeof e2eScan==="function")?e2eScan(G,v=>!Number.isFinite(v),20000):[]; }

TEST_SUITES.push(() => suite("часы: время ушло назад — никто не платит и никто не богатеет", () => {
  clkWorld();
  eq(clkMissing().join(","),"","все такты из списка существуют ("+CLK_TICKS.length+")");
  const was=clkRun(1);   /* кто роняет сам по себе, до всякого сдвига */
  const c0=G.credits, m0=G.matches|0;
  const back=clkShift(-3*24*3600*1000);
  let bad={};
  try{ bad=clkRun(2); }finally{ back(); }
  const news=Object.keys(bad).filter(k=>!was[k]).map(k=>k+": "+bad[k]);
  eq(news.slice(0,4).join(" ;; "),"","ни один такт не падает от часов, ушедших назад");
  ok(G.credits<=c0,"деньги не растут от перевода часов назад: "+c0+" → "+G.credits);
  ok((G.matches|0)<=m0,"спички не растут от перевода часов назад");
  eq(clkNaN().slice(0,3).join(","),"","назад по часам не заводит NaN");
  resetWorld();
}));

TEST_SUITES.push(() => suite("часы: прыжок на пять лет вперёд — потолки офлайна держат", () => {
  clkWorld();
  const was=clkRun(1);
  const c0=G.credits;
  const fwd=clkShift(5*365*24*3600*1000);
  let bad={};
  try{ bad=clkRun(2); }finally{ fwd(); }
  const news=Object.keys(bad).filter(k=>!was[k]).map(k=>k+": "+bad[k]);
  eq(news.slice(0,4).join(" ;; "),"","ни один такт не падает от прыжка на пять лет");
  ok(Number.isFinite(G.credits),"деньги остались числом: "+G.credits);
  ok(G.credits>=0,"деньги не ушли в минус за пять лет: "+G.credits);
  /* потолок офлайна: дрон догоняет сутки, а не пятилетку. Даже с дюжиной
     машин и рук это не может быть миллиардом. */
  ok(G.credits-c0<5e7,"за пять лет офлайна не начислено небывалого: +"+(G.credits-c0));
  eq(clkNaN().slice(0,3).join(","),"","пять лет вперёд не заводят NaN");
  /* и мир после этого ещё рисуется */
  let drew=true;
  try{ tableTab="ether"; tableRender(); }catch(e){ drew=false; ok(false,"стол после пяти лет: "+e.message); }
  if(drew)ok(true,"стол после пяти лет рисуется");
  resetWorld();
}));

TEST_SUITES.push(() => suite("часы: сейв из будущего — отметки впереди наших часов не ломают мир", () => {
  clkWorld();
  const s=JSON.parse(JSON.stringify(snapshot()));
  /* у того устройства часы спешат на год: двигаем КАЖДУЮ отметку времени в сейве */
  const YEAR=365*24*3600*1000, NOW=Date.now();
  const bump=(v,d)=>{
    if(d>7)return v;
    if(typeof v==="number")return (v>1.4e12&&v<4e12)?v+YEAR:v;
    if(Array.isArray(v))return v.map(x=>bump(x,d+1));
    if(v&&typeof v==="object"){const o={};for(const k in v)o[k]=bump(v[k],d+1);return o;}
    return v;
  };
  const fut=bump(s,0);fut.v=5;
  resetWorld();
  let threw="";
  try{ ok(applySave(fut)!==false,"сейв из будущего принят"); }catch(e){ threw=e.message; ok(false,"сейв из будущего: "+threw); }
  if(threw){resetWorld();return;}
  const c0=G.credits;
  const bad=clkRun(2);
  eq(Object.keys(bad).slice(0,4).map(k=>k+": "+bad[k]).join(" ;; "),"","такты на сейве из будущего не падают");
  ok(G.credits<=c0+1e6,"сейв из будущего не печатает денег: "+c0+" → "+G.credits);
  ok(G.credits>=0,"и не уводит в минус: "+G.credits);
  eq(clkNaN().slice(0,3).join(","),"","сейв из будущего не заводит NaN");
  /* и наши собственные отметки не остались в будущем навсегда: круг сейва пишется */
  ok(JSON.stringify(snapshot()).length>500,"снимок после сейва из будущего пишется");
  resetWorld();
}));
