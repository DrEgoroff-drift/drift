/* ══════════════ автотесты: каркас ══════════════ */
/* Эти файлы не попадают в drift.html. build.ps1 склеивает игру + tests/*.js в
   отдельный tests.html: код проверяется ровно тот, что играется, а игра остаётся
   чистой. Открыть tests.html в браузере — отчёт выводится на страницу, в консоль
   и в window.TEST (для чтения из инструментов).

   Тесты работают с настоящим G: каждый набор начинается с resetWorld(), которая
   возвращает состояние к стартовому. Ничего не мокаем — иначе проверялись бы
   моки, а не игра. */
const TEST={pass:0,fail:0,lines:[],failed:[]};
let _suite="";
/* ?only=текст — гонять только наборы, в имени которых есть текст (быстрая итерация;
   test.ps1 -Only делает то же самое) */
const TEST_ONLY=(()=>{try{return new URLSearchParams(location.search).get("only")||"";}catch(e){return "";}})();
function suite(name,fn){
  if(TEST_ONLY&&!name.includes(TEST_ONLY))return;
  _suite=name;
  TEST.lines.push("── "+name);
  const p0=TEST.pass,f0=TEST.fail;
  try{fn();}
  catch(e){TEST.fail++;TEST.failed.push(name+" · ИСКЛЮЧЕНИЕ: "+(e&&e.message||e));
    TEST.lines.push("  ✗ ИСКЛЮЧЕНИЕ: "+(e&&e.stack||e));}
  /* учёт по группам (M326): четыре сотни наборов одним столбом никто не
     читает, отчёт сверху говорит, ГДЕ провалы. Группа — по имени набора:
     сквозные (прогоны, фуззер, телефон, look) → картинка (что рисуется и как) →
     интерфейс (экраны, кнопки, вкладки) → остальное — формулы и данные */
  const g=/^(сквозной|фуззер|прогон|телефон|look\(\))/i.test(name)?"1 сквозные":
          /рисует|рисуют|силуэт|кадр|корпус|палитр|свет|дым|знак|тон|форм|цвет|тень|масштаб|сцен|факел|стан[цк]/i.test(name)?"2 картинка":
          /экран|кнопк|вкладк|стол|панел|подсказ|надпис|бланк|карточ|меню|пэд/i.test(name)?"3 интерфейс":"4 формулы и данные";
  const G0=(TEST.groups||(TEST.groups={}))[g]||(TEST.groups[g]={suites:0,pass:0,fail:0});
  G0.suites++;G0.pass+=TEST.pass-p0;G0.fail+=TEST.fail-f0;
}
function ok(cond,msg){
  if(cond){TEST.pass++;TEST.lines.push("  ✓ "+msg);}
  else{TEST.fail++;TEST.failed.push(_suite+" · "+msg);TEST.lines.push("  ✗ "+msg);}
}
/* «получено/ждали» — только на провале: зелёные строки никто не читает, а страница от них втрое толще */
function eq(a,b,msg){const h=a===b;ok(h,h?msg:msg+" (получено "+JSON.stringify(a)+", ждали "+JSON.stringify(b)+")");}
function near(a,b,tol,msg){const h=Math.abs(a-b)<=tol;ok(h,h?msg:msg+" (получено "+a+", ждали ≈"+b+"±"+tol+")");}

/* ── что завелось лениво, тому в новом мире не место (M329) ──
   Половина состояния игры заводится по случаю: поля нет вовсе, пока игрок не
   дошёл до него — ни Веги, ни ленты самописца, ни писем с острова. Список
   полей в resetWorld писан руками и отставал от игры на три десятка имён:
   забытое поле не роняет ничего сразу, оно переезжает из набора в набор, и
   набор, зелёный в одиночку, краснеет в общем прогоне (или наоборот — что
   хуже). Так половинчатая Вега из набора про теплицу доехала до позднего
   мира, стала там NaN, а через круг сейва — null, и экран БАЗЫ умер на
   `toFixed`. Список заменён на факт: имена, которые были у G при заводке
   страницы. Всё, что появилось после, — чужое. Сторож — последний набор
   в `91zzzzz-e2e-life`: он сверяет мир после resetWorld со снимком, снятым
   до первого набора. */
const G_BOOT_KEYS=new Set(Object.keys(G));
/* полный сброс мира: то же, что «начать заново», но без перезагрузки страницы */
function resetWorld(){
  for(const k of Object.keys(G))if(!G_BOOT_KEYS.has(k))delete G[k];
  G.mode="system";G.sx=0;G.sy=0;G.sys=getSystem(0,0);G.zoom=1;
  G.shipId="strizh";G.owned={strizh:true};
  G.ship={x:0,y:-760,vx:0,vy:0,a:0,av:0,bank:0};
  G.fuel=100;G.hull=100;G.credits=600;G.data=0;
  for(const k of RES_KEYS)G.cargo[k]=0;
  G.mods={engine:0,tank:0,hold:0,armor:0,drill:0,hyper:0,weapon:0};
  G.modsOwned={engine:0,tank:0,hold:0,armor:0,drill:0,hyper:0,weapon:0};
  G.inv=[];G.fit={};G.loot=[];G.partsBought={};invalidateParts();
  G.tech=new Set();G.techLvl={};G.barter=new Set();
  G.found=new Set();G.species=new Set();
  G.ap=null;G.orbit=null;G.watch=null;
  G.land=null;G.surf=null;G.st=null;G.belt=null;G.dig=null;G.cave=null;G.base=null;
  G.crew=[];G.allies=[];G.bases={};G.drones=[];G.droneInventory=0;G.droneSold={};G.smena=[];
  G.rogues=[];G.exiles=[];G.aiRift=null;
  G.relics={};G.relicHint=null;G.bio=0;G.home=null;G.course=null;
  G.hold={};G.seenPrices={};   /* ленивые карты слоя холдинга и стола цен (M291) */
  /* мир заново — значит и шахты нетронуты, и фронт пиратов пуст */
  G.mines={};G.occ={};G.occCalm={};G.occT=0;G.freed=0;G.quests=[];
  G.nodes={};G.crowns={};G.rareFound=[];G.dealsDone={};G.dealsWait=[];G.rep={};G.poiSeen={};
  G.loreFound=[];G.loreMarks=[];G.settle={};G.tin={};
  /* боны (12u): курс — состояние мира, и новый мир начинает с общего основания */
  G.scrip={};G.scripRate={};G.scripLog=[];if(typeof scripVisitReset==="function")scripVisitReset();
  /* срок (12v): новый мир — никакого назначенного часа и никаких пустых систем */
  G.doom=null;G.doomDead={};
  /* трепло (12x): новая игра — ни птицы, ни услышанного */
  G.seen={};G.storyPin={};G.storyFlags={};G.place={};G.odo={lands:0,jumps:0};G.post={stage:0,opened:0,done:0};G.mirror={bearing:0};G.mirrorEcho=null;G.lights={t0:-1,seen:0};G.hours={man:0};G.grove={turn:0,shot:0,cut:0};G.keepers={gone:0,signed:0,fed:0,given:0};G.county={called:0,at:0,answered:0,saw:0};G.charts={have:0,lost:-1};G.quiet={stay:0};G.quietGone=0;G.slow={fig:null,at:-1,round:0};G.pass={lit:0,told:0};G.grown={recip:0};G.plan={took:0,hauled:0};G.ret={seen:0};G.names={};G.namesTold={};
  /* имена, которые у G были с самого начала, сносом выше не чистятся —
     их возвращают руками, как и всё остальное в этом списке */
  G.uniqueShips={};G.wishDevice=0;G.seat=null;
  /* эти имена у G были с самого начала, поэтому снос выше их не трогает, а
     руками их не возвращал никто — четырнадцать полей ездили из набора в
     набор: пойманные капитаны, отметки новостей, обломки, тетрадь блошиного
     рынка, счёт добрых дел, сказанное людьми (M329, сторож в 91zzzzz) */
  G.nodeShow=null;G.pnode=null;G.hunted={};G.grok=null;G.flea={got:[]};G.droneIds=[];G.lastDig=null;
  G.news=[];G.newsMarks={};G.newsT=0;G.wrecks={};G.tableSeen=0;G.rivals={};
  G.offers=[];G.folk={};G.folkSay={};G.ledger={n:0,w:0};G.told=[];
  G.relay={};   /* приёмники (M218): новый мир — ничего не поймано */
  G.late=null;  /* поздний час (M225): в новой игре ещё не сидели */
  G.toldOff=0;  /* тот один (M230): в новой игре ещё молчит */
  G.parrot=null;G.heard=[];G.trade=routeInit();G.market={};G.wear={};G.findsSeen={};
  G.mgrs=[];G.blueprints={};G.cantina=null;G.aiRift=null;
  G.orderStamp=0;G.kills=0;G.soldTotal=0;
  G.pirates=[];G.shots=[];G.log=[];G.prompt="";G.msg="";
  G.t=0;G.running=true;
  for(const k in keys)keys[k]=false;
  actEdge=false;prevAct=false;
}
/* сажаем игрока на первую твёрдую планету стартовой системы — общая заготовка */
function landOnTestPlanet(){
  const p=G.sys.planets.find(x=>x.type!=="gas")||G.sys.planets[0];
  const tr=genTerrain(p);
  G.land={p,tr,x:tr.padX,y:groundAt(tr,tr.padX)};
  enterSurface();
  return G.surf.p;
}
/* прогон N кадров выбранного апдейта: время в игре идёт шагами по 1 */
function steps(n,fn){for(let i=0;i<n;i++){actEdge=false;fn(1);G.t+=1;}}

function runTests(){
  /* игровой цикл на время прогона выключен: тесты сами двигают мир, а фоновые
     кадры двигали бы G у них под руками — и в headless не давали странице
     дойти до отчёта (M170) */
  LOOP_OFF=true;
  const t0=performance.now();
  for(const fn of TEST_SUITES){
    try{fn();}catch(e){TEST.fail++;TEST.failed.push("набор упал: "+(e&&e.message||e));
      TEST.lines.push("✗✗ НАБОР УПАЛ: "+(e&&e.stack||e));}
  }
  /* ── время прогона тут не измеряется, и это не лень ──
     `test.ps1` запускает страницу с `--virtual-time-budget`: внутри
     виртуального времени `performance.now()` между синхронными вызовами не
     движется, и отчёт честно печатал «0 мс» на семи тысячах проверок с самого
     появления этой строки. Цифра, которая всегда ноль, — не измерение, а
     украшение. Реальные секунды показывает `test.ps1` снаружи, а здесь стоит
     то, что действительно считается: сколько наборов отработало. */
  const ms=Math.round(performance.now()-t0);
  const head=(TEST.fail?"ПРОВАЛЕНО "+TEST.fail:"ВСЁ ЗЕЛЁНОЕ")+
    " · пройдено "+TEST.pass+" · наборов "+TEST_SUITES.length+
    (ms>0?" · "+ms+" мс":"");
  TEST.summary=head;
  const groups=Object.keys(TEST.groups||{}).sort((a,b)=>TEST.groups[b].fail-TEST.groups[a].fail||a.localeCompare(b))
    .map(g=>{const r=TEST.groups[g];return "  "+(r.fail?"✗":"·")+" "+g+": наборов "+r.suites+", пройдено "+r.pass+(r.fail?", ПРОВАЛОВ "+r.fail:"");});
  TEST.lines.unshift("ПО ГРУППАМ:\n"+groups.join("\n")+"\n");
  const box=document.createElement("pre");
  box.id="testout";
  box.style.cssText="position:fixed;inset:0;z-index:9999;overflow:auto;margin:0;padding:14px;"+
    "background:#05070c;color:#bfe8f0;font:11px/1.5 ui-monospace,monospace;white-space:pre-wrap";
  box.textContent=head+"\n\n"+(TEST.failed.length?"ПРОВАЛЫ:\n"+TEST.failed.map(s=>"  ✗ "+s).join("\n")+"\n\n":"")+
    TEST.lines.join("\n");
  document.body.appendChild(box);
  console.log(head);
  if(TEST.failed.length)console.log("ПРОВАЛЫ:\n"+TEST.failed.join("\n"));
  return head;
}
const TEST_SUITES=[];
