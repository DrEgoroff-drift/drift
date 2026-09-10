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
/* «a|b» — любой из нескольких кусков имени (M445: зоопарк мутантов зовёт своих убийц одним прогоном) */
const TEST_ONLY_ANY=TEST_ONLY?TEST_ONLY.split("|").filter(Boolean):[];
/* ?files=91a-flight|91c-mgr — только наборы этих файлов (M444, test.ps1 -Changed):
   сборка ставит перед каждым файлом `var TEST_FILE="имя.js"`, а push в
   TEST_SUITES запоминает его за набором (ниже) */
const TEST_FILES=(()=>{try{const s=new URLSearchParams(location.search).get("files")||"";
  return s?s.split("|").filter(Boolean).map(x=>x.replace(/\.js$/,"")):null;}catch(e){return null;}})();
let _file="";
/* ── прогон по частям (?shard=i/N) ──
   Наборы независимы по замыслу: каждый начинается с resetWorld(), и порядок
   им не указ. Значит их можно раздать НЕСКОЛЬКИМ Хромам сразу — машина
   шестнадцатиядерная, а прогон всю жизнь шёл в одну страницу. Тяжёлые и
   лёгкие раздаются по кругу ОТДЕЛЬНО: тяжёлых сорок пять, и в списке они
   лежат кучно — раздача одним счётчиком отдала бы половину времени одной
   части. `test.ps1 -Jobs N` пускает N таких частей разом и складывает отчёты. */
const TEST_SHARD=(()=>{try{const m=/^(\d+)\/(\d+)$/.exec(new URLSearchParams(location.search).get("shard")||"");
  return (m&&+m[2]>1&&+m[1]<+m[2])?{i:+m[1],n:+m[2]}:null;}catch(e){return null;}})();
let SHARD_H=0,SHARD_L=0,SKIPPED_SHARD=0,SHARD_FREE=false;   /* SHARD_FREE: набор мимо раздачи — он нужен в каждой части одинаково */
/* ── ярус — слово самого набора, а не строка в чужом списке (M442) ──
   Было три списка: SLOW_SUITES (тяжёлые, имена строкой), NODE_BROWSER (имена
   строкой) и NODE_SKIP (регулярка по словам в имени) — плюс правило «проба · »
   по имени. Переименовал набор — ярус молча поехал; добавил в имя слово «тон» —
   набор ушёл из Node, и никто этого не решал. Теперь ярус объявляет сам набор,
   третьим аргументом рядом с именем:

     suite("имя",{tier:"browser"},()=>{…})        // или suite("имя",()=>{…},{…})

   tier  — где набор ходит:
           "node"    (по умолчанию) формулы и данные: Node, -Browser, -Full;
           "browser" пиксели, вёрстка, звук, живой кадр: только Хром;
           "heavy"   тяжёлые сети: только -Full (и лаборатория по одному);
           "probe"   стенд, печатает числа экономики: только -Probe.
   win   — в каком окне набор вообще имеет смысл: "phone" (innerWidth ≤ 760,
           test.ps1 -Mobile), "wide" (не телефон), "ref" (окно эталона кадра,
           1280×800 → полотно ~1248×641). В чужом окне набор не идёт вовсе и
           считается в заголовке — раньше он «пропускал себя» изнутри, через
           ok(true), то есть зеленел, ничего не проверив.
   stage — карантин (Riot, «staging»): набор ходит и печатается, но его провалы
           не решают вердикт; test.ps1 выводит их отдельной строкой. Строка с
           причиной и сроком: stage:"новый детектор, до 2026-09-17".
   Опции пишутся ЛИТЕРАЛОМ сразу за именем: лаборатория (lab/lab.py) читает
   тяжёлые наборы регуляркой из tests.html. Опечатку в опциях ловит набор
   «ярусы: …» в конце прогона. */
const TEST_PROBE=(()=>{try{return new URLSearchParams(location.search).get("probe")==="1";}catch(e){return false;}})();
let SKIPPED_PROBE=0;
const TEST_FULL=(()=>{try{return new URLSearchParams(location.search).get("full")==="1";}catch(e){return false;}})();
let SKIPPED_SLOW=0;
/* ?skip=имя|имя — обойти наборы по имени (лаборатория, docs/LAB.md): набор, повисший
   в шарде на сервере, следующий раз идёт отдельно, а шард — без него */
const TEST_SKIP=(()=>{try{const s=new URLSearchParams(location.search).get("skip")||"";return s?s.split("|").filter(Boolean):[];}catch(e){return [];}})();
let SKIPPED_SKIP=0;
/* ?shuffle=зерно — наборы в перемешанном порядке, одинаковом при одном зерне
   (M442). Наборы независимы по замыслу; перемешка — проверка этого замысла:
   набор, зелёный только после соседа, краснеет, и зерно повторяет провал.
   Все части прогона (?shard) мешают одним зерном, поэтому раздача сходится. */
const TEST_SHUFFLE=(()=>{try{const s=new URLSearchParams(location.search).get("shuffle");return (s!=null&&/^\d+$/.test(s))?(+s>>>0):null;}catch(e){return null;}})();
/* ?pick=3,17,250 — только наборы с этими номерами в порядке прогона (с тем же
   ?shuffle); номер печатается в отчёте рядом с именем «[#17]». Нужен, чтобы
   найти, КТО пачкает мир для провалившегося соседа: прогон «все до него + он»
   делится пополам, пока не останется виновник (docs/VERIFY.md). Ярусы и
   карантин ему не указ — как и ?only */
const TEST_PICK=(()=>{try{const s=new URLSearchParams(location.search).get("pick")||"";return s?new Set(s.split(",").filter(x=>/^\d+$/.test(x)).map(Number)):null;}catch(e){return null;}})();
let SUITE_SEQ=0;
/* группа — только для отчёта «по группам»: ярус от неё больше не зависит */
function suiteGroup(name){
  return /^(сквозной|фуззер|прогон|телефон|look\(\))/i.test(name)?"1 сквозные":
         /рисует|рисуют|силуэт|кадр|корпус|палитр|свет|дым|знак|тон|форм|цвет|тень|масштаб|сцен|факел|стан[цк]/i.test(name)?"2 картинка":
         /экран|кнопк|вкладк|стол|панел|подсказ|надпис|бланк|карточ|меню|пэд/i.test(name)?"3 интерфейс":"4 формулы и данные";
}
/* под Node (test-node.js) канва и вёрстка — заглушки: сюда идут наборы яруса
   "node"; картинка, интерфейс и сквозные объявляют себя "browser" */
const TEST_NODE=typeof globalThis.TEST_NODE!=="undefined"&&!!globalThis.TEST_NODE;
let SKIPPED_NODE=0,SKIPPED_WIN=0;
const SUITE_TIERS={node:1,browser:1,heavy:1,probe:1};
const SUITE_WINS={phone:1,wide:1,ref:1};
const SUITE_KEYS={tier:1,win:1,stage:1};
/* имя → опции, видно ДО всех отсевов: по нему сверяются опции и считается раздача */
const SUITE_OPTS=new Map();
const ALL_NAMES=new Set();
function suiteWin(w){
  if(w==="phone")return innerWidth<=760;
  if(w==="wide")return innerWidth>760;
  if(w==="ref")return W>=1200&&W<=1320&&H>=600&&H<=720;
  return true;
}
/* строка в отчёт, которая НЕ проверка: стенды печатают ей свои числа. Раньше
   это делал ok(true,…) — зелёная галочка, которая не могла покраснеть */
function note(msg){TEST.lines.push("  · "+msg);}
function suite(name,a,b){
  const fn=(typeof a==="function")?a:b;
  const o=((typeof a==="function")?b:a)||{};
  const tier=o.tier||"node";
  ALL_NAMES.add(name);SUITE_OPTS.set(name,o);
  const seq=SUITE_SEQ++,sel=TEST_ONLY||TEST_PICK;
  if(TEST_PICK&&!TEST_PICK.has(seq))return;
  if(TEST_FILES&&_file&&!TEST_FILES.includes(_file.replace(/\.js$/,"")))return;
  if(TEST_NODE&&!sel&&tier!=="node"){SKIPPED_NODE++;return;}
  if(TEST_SKIP.length&&TEST_SKIP.some(x=>name===x)){SKIPPED_SKIP++;return;}
  if(TEST_ONLY&&!TEST_ONLY_ANY.some(s=>name.includes(s)))return;
  if(!TEST_FULL&&!sel&&tier==="heavy"){SKIPPED_SLOW++;return;}
  if(tier==="probe"&&!TEST_PROBE&&!sel){SKIPPED_PROBE++;return;}
  if(TEST_SHARD&&!SHARD_FREE){const idx=tier==="heavy"?SHARD_H++:SHARD_L++;
    if(idx%TEST_SHARD.n!==TEST_SHARD.i){SKIPPED_SHARD++;return;}}
  if(o.win&&!suiteWin(o.win)){SKIPPED_WIN++;return;}
  TEST.ran=(TEST.ran|0)+1;
  _suite=name;
  if(TEST_NODE&&globalThis.TEST_TRACE)console.error("→ "+name);   /* test-node.js --trace: где завис */
  TEST.lines.push("── "+name+(o.stage?"  [карантин: "+o.stage+"]":"")+((TEST_SHUFFLE!==null||TEST_PICK)?"  [#"+seq+"]":""));
  const p0=TEST.pass,f0=TEST.fail,n0=TEST.failed.length;
  const ts=performance.now();
  try{fn();}
  catch(e){TEST.fail++;TEST.failed.push(name+" · ИСКЛЮЧЕНИЕ: "+(e&&e.message||e));
    TEST.lines.push("  ✗ ИСКЛЮЧЕНИЕ: "+(e&&e.stack||e));}
  /* инструменты (90a) прибирают за собой: окно, сдвиг часов, клавиши */
  try{T._undo();}catch(e){}
  uiSelRestore();
  /* ── набор без единой проверки — красный (M442) ──
     Такой набор не может покраснеть ни при какой поломке: он «проходит»
     всегда, и отчёт считает его зелёным наравне с настоящими. Если набору в
     этом окне или в этом мире проверять нечего — это решает его win/tier или
     сама постановка мира, а не молчаливый return. */
  if(TEST.pass===p0&&TEST.fail===f0){TEST.fail++;
    TEST.failed.push(name+" · ни одной проверки: набор не может покраснеть, значит ничего не проверяет");
    TEST.lines.push("  ✗ ни одной проверки");}
  /* карантин: провалы уходят в отдельный список, вердикт их не видит */
  if(o.stage){
    TEST.stageRan=(TEST.stageRan|0)+1;
    const moved=TEST.failed.splice(n0);
    TEST.stageFail=(TEST.stageFail|0)+(TEST.fail-f0);TEST.fail=f0;
    for(const m of moved)(TEST.staged||(TEST.staged=[])).push(m);
  }
  /* учёт по группам (M326): четыре сотни наборов одним столбом никто не
     читает, отчёт сверху говорит, ГДЕ провалы. Группа — по имени набора:
     сквозные (прогоны, фуззер, телефон, look) → картинка (что рисуется и как) →
     интерфейс (экраны, кнопки, вкладки) → остальное — формулы и данные */
  const g=suiteGroup(name);
  const G0=(TEST.groups||(TEST.groups={}))[g]||(TEST.groups[g]={suites:0,pass:0,fail:0});
  G0.suites++;G0.pass+=TEST.pass-p0;G0.fail+=TEST.fail-f0;
  (TEST.times||(TEST.times=[])).push([name,Math.round(performance.now()-ts)]);
}
function ok(cond,msg){
  if(cond){TEST.pass++;TEST.lines.push("  ✓ "+msg);}
  else{TEST.fail++;TEST.failed.push(_suite+" · "+msg);TEST.lines.push("  ✗ "+msg);}
  return !!cond;   /* чтобы `if(!ok(x,"нашлось"))return;` — отказ виден, а не молчит */
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
/* ── и то же про вид страницы (0.426.0) ──
   Половина интерфейса помнит себя ВНЕ `G`: выбранная вкладка станции (`tab`),
   её раздел (`stGroup`), закладка стола (`tableTab`). Эти три переменные не
   принадлежат миру и потому не сбрасывались — а набор, ушедший со станции на
   вкладке «ЭКИПАЖ», оставлял следующему раздел «ЛЮДИ», в котором кнопки ДОСКА
   просто нет на экране. Набор про ДОСКУ краснел через сорок наборов после
   виновника и только при определённом порядке (нашлось прогоном по частям).
   Значения берём не из головы, а те, что были при заводке страницы. */
const UI_BOOT={};
if(typeof tab!=="undefined")UI_BOOT.tab=tab;
if(typeof stGroup!=="undefined")UI_BOOT.stGroup=stGroup;
if(typeof tableTab!=="undefined")UI_BOOT.tableTab=tableTab;
/* настройки игрока — тоже с заводки (0.438.0): G.opts — имя с заводки, снос полей
   мира его не трогает, и набор про порченый сейв оставлял следующим «текст» в
   графике и строку в размере пэдов. Драйверы детекторов и прогулок держали свой
   обход (DET_OPTS_BOOT); теперь это часть сброса мира, как UI_BOOT. */
const OPTS_BOOT=(()=>{try{return JSON.stringify(G.opts);}catch(e){return null;}})();

/* ── мир начинается с одного семени и в одну минуту (M441) ──
   Семя и часы — не подмена в тестах, а те же rndSeed/clockSet, которыми игра
   живёт сама (01-core): каждый набор стартует в 12:00 10.09.2026 по местному
   времени и на одном семени, и исход больше не зависит от того, в котором часу
   его гоняют. Набору, которому нужен другой час или сутки вперёд, — clockSet
   прямо в нём. `?hour=3` двигает стартовый час всему прогону: так проверяется,
   что зелёное не держится на полудне (test-node.js --hour=3). */
const TEST_SEED=0x0D441;
const TEST_HOUR=(()=>{const m=/[?&]hour=(\d{1,2})/.exec(location.search||"");return m?Math.min(23,+m[1]):12;})();
const TEST_T0=new Date(2026,8,10,TEST_HOUR,0,0,0).getTime();

/* ── и выборы на экранах, тоже вне G (M442) ──
   Два корпуса под сплав (`fuseSel`), выбранный человек, стол в штабе и в
   кантине, вкладка настроек, взведённый сброс — всё это переменные страницы.
   Набор «нищий» (91zzzzzc) жмёт ВЗЯТЬ в лаборатории, и в перемешке
   (?shuffle=7) следующий за ним «обещание: у отказа есть голос» находил
   корпус уже выбранным: тычок в «ВЫБРАН» снимал выбор и не оставлял следа.
   И отметка «призрачного клика» (`actPressT`, 15-input): пэд ДЕЙСТВИЕ
   ставит её на performance.now(), и полсекунды клики по экранам глотаются.
   Под --virtual-time-budget часы внутри прогона стоят, полсекунда не
   кончается НИКОГДА: «руки: палец, ушедший с пэда» жал ДЕЙСТВИЕ, и до конца
   страницы ни одна кнопка на столе и станции не отвечала — в перемешке
   краснели четыре набора про кнопки (?shuffle=7, часть 2/2).
   Возвращаются после КАЖДОГО набора (suite(), не resetWorld — тот меняет
   M441), значениями с заводки страницы. */
const UI_SEL_BOOT={};
for(const k of ["fuseSel","crewSel","hqSel","cantSel","optTab","resetArm","actPressT"]){try{UI_SEL_BOOT[k]=JSON.stringify(eval(k));}catch(e){}}
function uiSelRestore(){for(const k in UI_SEL_BOOT){try{eval(k+"=JSON.parse(UI_SEL_BOOT[k])");}catch(e){}}}
/* полный сброс мира: то же, что «начать заново», но без перезагрузки страницы */
let TEST_CHRON=null;
function resetWorld(){
  rndSeed(TEST_SEED);clockSet(TEST_T0);
  for(const k of Object.keys(G))if(!G_BOOT_KEYS.has(k))delete G[k];
  /* летопись в наборах — тихая и одна на весь прогон (M412): семьи механик
     читают её происшествия, и живая история в любой день подкладывала
     истощение или утечку под набор про добычу — набор краснел от календаря.
     Один повтор на прогон, происшествия сняты, состояние заморожено:
     chronState() отдаёт его как есть, ведомости его не сбрасывают. Наборы
     самой летописи (91zzzw-chron*) снимают заморозку сами */
  if(typeof chronState==="function"&&typeof CHRON_FREEZE!=="undefined"){
    if(!TEST_CHRON){CHRON_FREEZE=false;const s=chronState();s.lines=s.lines.filter(L=>L.kind!=="inc");TEST_CHRON=s;}
    CHRON=chronClone(TEST_CHRON);CHRON._keys=chronKeys();CHRON_FREEZE=true;
  }
  /* кэш систем — тоже мир: набор про озеро ставил планете type="terran" и
     уходил, а набор про семя через сорок наборов читал из кэша чужую планету.
     Красным это стало только когда быстрый ярус выкинул тяжёлый набор между
     ними, который чистил кэш по своим делам (0.359.3). Чистим всегда. */
  if(typeof SYS_CACHE!=="undefined")SYS_CACHE.clear();
  G.mode="system";G.sx=0;G.sy=0;G.sys=getSystem(0,0);G.zoom=1;
  G.shipId="strizh";G.owned={strizh:true};
  G.ship={x:0,y:-760,vx:0,vy:0,a:0,av:0,bank:0};
  G.fuel=100;G.hull=100;G.credits=600;G.data=0;G.matches=0;G.coop=null;
  for(const k of RES_KEYS)G.cargo[k]=0;
  G.mods={engine:0,tank:0,hold:0,armor:0,drill:0,hyper:0,weapon:0};
  G.modsOwned={engine:0,tank:0,hold:0,armor:0,drill:0,hyper:0,weapon:0};
  G.inv=[];G.fit={};G.loot=[];G.partsBought={};invalidateParts();
  /* допуск, налёт, группа орудий и жар (M362–M364): новый мир начинает
     с первого допуска и с нулевого налёта, иначе набор, поднявший себе
     допуск, оставляет его следующим — а это ровно тот случай, который
     сеть изоляции и ловит */
  G.clearance=1;G.flownMs=0;G.gunGroup=0;G.gunPin=false;G.gunCool={};G.aim={};
  /* шкала энергии — полная, как при начале игры (spawnPirates делает то же):
     нулевая означала бы, что свежий мир стартует обесточенным, и половина
     маневровых в наборах про штурвал мерилась бы не тем */
  /* считаем ёмкость напрямую, а не через stat(): stat() по дороге ЛЕНИВО
     заводит комплект скафандра и зверинец, и свежий мир переставал быть
     свежим — сеть изоляции поймала это в ту же минуту */
  G.energy=energyCap(G.mods.weapon,0);G.shieldHit=0;G.shieldPulse=0;
  G.heat=0;G.burnT=0;G.stunT=0;G.beams=[];
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
  G.news=[];G.newsMarks={};G.newsT=0;G.wrecks={};G.tableSeen=0;G.rivals={};G.bargePax=[];   /* пассажиры барж (12l): поле с заводки, снос его не трогает — нашлось, когда тесты стали ждать живых кадров (0.359.3) */
  G.offers=[];G.folk={};G.folkSay={};G.ledger={n:0,w:0};G.told=[];
  G.relay={};   /* приёмники (M218): новый мир — ничего не поймано */
  G.late=null;  /* поздний час (M225): в новой игре ещё не сидели */
  G.toldOff=0;  /* тот один (M230): в новой игре ещё молчит */
  G.parrot=null;G.heard=[];G.trade=routeInit();G.market={};G.wear={};G.findsSeen={};
  G.mgrs=[];G.blueprints={};G.cantina=null;G.aiRift=null;
  G.orderStamp=0;G.kills=0;G.soldTotal=0;
  G.pirates=[];G.shots=[];G.log=[];G.logNew=0;G.prompt="";G.msg="";G.msgT=0;   /* logNew и msgT ехали из набора в набор (нашёл тест хэша, M441) */
  G.t=0;G.running=true;
  for(const k in keys)keys[k]=false;
  actEdge=false;prevAct=false;
  /* ── и выйти из дорожного спутника (M354) ──
     «В ДОРОГУ» — обычная кнопка на экранах, и всякий набор, который жмёт всё
     подряд, рано или поздно по ней попадает. Дорога же не экран, а РЕЖИМ:
     `body.road` прячет всю страницу (`body.road > *:not(#roadwin)`), и снятие
     класса «open» с панелей его не убирает. После такого тычка каждый
     следующий набор мерил страницу, на которой ничего не видно, — и мерки
     молча возвращали ноль вместо провала. Выход из режима — часть сброса
     мира, как и клавиши. */
  if(typeof RD!=="undefined"&&RD&&typeof roadClose==="function"){try{roadClose();}catch(e){}}
  document.body.classList.remove("road");
  /* и то же про ящик дверей и стол: их открывает обычная кнопка, значит любой
     набор с тычками может их открыть, а закрывает их только своя функция —
     снятие класса «open» с `.scr` меню не касается вовсе. Открытое меню
     оставляло на экране подпись «СТОЛ · тетрадь, ленты, письма, вещи» — и
     набор про невидимую тетрадь (91zzzf) краснел от ЧУЖОГО меню. */
  if(typeof toggleMenu==="function"){try{toggleMenu(false);}catch(e){}}
  if(typeof tableToggle==="function"&&typeof tableOpenNow!=="undefined"&&tableOpenNow){try{tableToggle(false);}catch(e){}}
  /* ── страница — тоже мир (0.426.0) ──
     Всё, что выше, закрывает ИМЕНОВАННЫЕ окна — дорогу, меню, стол. Любой
     другой экран оставался висеть: класс «open» снимает только своя функция
     выхода, и набор, ушедший со станции через тычок, отдавал экран
     следующему. Тот мерил вёрстку поверх чужого окна и МОЛЧА получал не свои
     числа. Ловилось это случайно и не на виновнике: «утечки: страница не
     остаётся в чужом режиме» краснела на соседе и только при определённом
     порядке (нашлось прогоном по частям — тот же прогон, другой порядок, три
     красных из ниоткуда). Сеть изоляции обязана чистить и страницу, иначе она
     не сеть. Заодно возвращаем вид станции и стола: `tab`, `stGroup` и
     `tableTab` живут вне `G`, и снос полей мира их не касается. */
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  document.body.classList.remove("screen","table");
  try{ if("tab" in UI_BOOT)tab=UI_BOOT.tab; if("stGroup" in UI_BOOT)stGroup=UI_BOOT.stGroup;
       if("tableTab" in UI_BOOT)tableTab=UI_BOOT.tableTab; }catch(e){}
  if(OPTS_BOOT){G.opts=JSON.parse(OPTS_BOOT);invalidateKeyMap();}
}
/* сажаем игрока на первую твёрдую планету стартовой системы — общая заготовка */
function landOnTestPlanet(){
  const p=G.sys.planets.find(x=>x.type!=="gas")||G.sys.planets[0];
  const tr=genTerrain(p);
  G.land={p,tr,x:tr.padX,y:groundAt(tr,tr.padX)};
  enterSurface();
  return G.surf.p;
}
/* ── кадры до тех пор, пока сцена не ОСЕЛА ──
   Развёртка планеты (`planetStripTick`) и материал грунта (`matTick`) пекутся
   ПО КАДРАМ с бюджетом на кадр: первый кадр новой сцены — плоский диск, а не
   то, что видит игрок. Наборы обходили это на глаз — «сорок кадров и хватит», —
   и платили сорок полных отрисовок там, где печь заканчивала на третьей. Хуже
   того, число на глаз врёт в обе стороны: подорожает печь — сорока не хватит,
   и набор начнёт мерить недопечённое.
   Спрашиваем саму печь: пока в очереди что-то есть — крутим, но не дольше
   потолка. Возвращает, сколько кадров прошло, — чтобы набор мог это сказать. */
function bakeIdle(){
  if(typeof STRIP_JOB!=="undefined"&&STRIP_JOB)return false;
  if(typeof STRIP_PEND!=="undefined"&&STRIP_PEND&&STRIP_PEND.length)return false;
  if(typeof MAT_JOB!=="undefined"&&MAT_JOB)return false;
  return true;
}
function settle(max,each,floor){
  max=max||40;floor=(floor==null)?6:floor;let i=0;
  for(;i<max;i++){
    G.t++;stepWorld(1);
    if(each)each(i);else drawWorld();
    /* пол в шесть кадров — не суеверие: очередь знает про развёртку планеты и
       материал грунта, но не про растр, который печёт себе сама сцена (доска
       карты, борт «Сороки»). Шесть кадров дешевле сорока и покрывают их. */
    if(i>=floor&&bakeIdle())break;
  }
  return Math.min(i+1,max);
}
/* прогон N кадров выбранного апдейта: время в игре идёт шагами по 1 */
function steps(n,fn){for(let i=0;i<n;i++){actEdge=false;fn(1);G.t+=1;}}

/* ── перемешка (?shuffle=зерно) ──
   Свой маленький генератор, а не игровой rng: порядок наборов не должен
   зависеть от того, что игра делает со своими зёрнами. Закреплённые наборы
   (`f.pin="first"`, 99-run: «игра запустилась сама» обязан идти до всех)
   стоят на месте. */
function suiteOrder(list){
  if(TEST_SHUFFLE===null)return list.slice();
  let s=(TEST_SHUFFLE^0x9E3779B9)>>>0;
  const r=()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
  const first=list.filter(f=>f.pin==="first"),mid=list.filter(f=>!f.pin);
  for(let i=mid.length-1;i>0;i--){const j=Math.floor(r()*(i+1));const x=mid[i];mid[i]=mid[j];mid[j]=x;}
  return first.concat(mid);
}
/* ── сеть над исходниками наборов (M442) ──
   `ok(true,…)` не может покраснеть; `typeof f==="function"` вокруг вызова,
   который обязан существовать, превращает переименование в тихую зелень
   (GOTCHAS). В наборах их было 126 и 190 — ноль с M442, и сеть держит ноль.
   Область — от конца инструментов (90a) до запуска (99-run): каркас и
   инструменты вправе проверять окружение, наборы — нет. Разрешена одна форма
   typeof про функцию: сама проверка, `ok(typeof f==="function",…)`. */
const NET_FROM="══ конец инструментов"+" ══",NET_TO="/* запуск: после того как игра "+"САМА";
function testSource(){
  const all=[...document.scripts].map(s=>s.textContent||"").join("\n");
  const a=all.lastIndexOf(NET_FROM),b=a<0?-1:all.indexOf(NET_TO,a);
  return (a<0||b<0)?"":all.slice(a,b);
}
function testNetHits(src){
  const hits=[],lines=src.split("\n");
  const TY=/typeof\s+[\w$.]+(?:\[[^\]]*\])*\s*[!=]==?\s*["'](?:function|undefined)["']/g;
  for(let i=0;i<lines.length;i++){
    const L=lines[i];
    if(/\bok\(\s*true\b/.test(L))hits.push("ok(true: "+L.trim().slice(0,80));
    for(const m of L.matchAll(TY))
      if(!/\bok\(\s*!?\s*$/.test(L.slice(0,m.index)))hits.push("typeof: "+L.trim().slice(0,80));
  }
  return hits;
}
function runTests(){
  /* игровой цикл на время прогона выключен: тесты сами двигают мир, а фоновые
     кадры двигали бы G у них под руками — и в headless не давали странице
     дойти до отчёта (M170) */
  LOOP_OFF=true;
  const t0=performance.now();
  for(const fn of suiteOrder(TEST_SUITES)){
    _file=fn.file||"";
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
  /* ── правила каркаса сверяются в конце прогона (0.426.0, M442) ──
     Пока ярусы жили в списках имён, здесь сверялось, что в списках нет
     мёртвых имён. Списков больше нет; опечатка теперь может жить в самих
     опциях — `{teir:"heavy"}` молча сделал бы тяжёлый набор лёгким. И тут же
     сеть над исходниками: ok(true и typeof-сторожи. Полный прогон видит все
     имена — он и сверяет; в частях — только первая. */
  if(!TEST_ONLY&&!TEST_PICK&&(!TEST_SHARD||TEST_SHARD.i===0)){
    SHARD_FREE=true;
    suite("ярусы: у каждого набора опции из словаря, и лаборатория видит тяжёлые",()=>{
      const bad=[],heavy=new Set();
      for(const [n,o] of SUITE_OPTS){
        for(const k in o)if(!SUITE_KEYS[k])bad.push(n+": неизвестная опция «"+k+"»");
        if(o.tier!=null&&!SUITE_TIERS[o.tier])bad.push(n+": ярус «"+o.tier+"»");
        if(o.win!=null&&!SUITE_WINS[o.win])bad.push(n+": окно «"+o.win+"»");
        if(o.stage!=null&&!(String(o.stage).length>=4))bad.push(n+": карантин без причины");
        if((o.tier==="probe")!==/^проба · /.test(n))bad.push(n+": «проба · » в имени и ярус probe ходят вместе");
        if(o.tier==="heavy")heavy.add(n);
      }
      eq(bad.slice(0,5).join(" ;; "),"","опции наборов из словаря ("+SUITE_OPTS.size+" наборов)"+(bad.length?" (всего "+bad.length+")":""));
      /* lab/lab.py берёт тяжёлые той же регуляркой из tests.html: опции,
         записанные НЕ литералом за именем, лаборатория не увидит */
      const src=testSource(),seen=new Set();
      for(const m of src.matchAll(/suite\(\s*"((?:[^"\\]|\\.)*)"\s*,\s*\{[^{}]*?\btier\s*:\s*"heavy"/g))seen.add(JSON.parse('"'+m[1]+'"'));
      eq([...heavy].filter(n=>!seen.has(n)).join(" ;; "),"","каждый тяжёлый набор читается регуляркой лаборатории ("+seen.size+" из "+heavy.size+")");
    });
    suite("сеть: в наборах нет ok(true и typeof-сторожей",()=>{
      const src=testSource();
      ok(src.split("\n").length>5000,"область наборов найдена по меткам: "+src.split("\n").length+" строк");
      const hits=testNetHits(src);
      eq(hits.slice(0,6).join(" ;; "),"","ни одной проверки, которая не может покраснеть"+(hits.length?" (всего "+hits.length+")":""));
    });
    SHARD_FREE=false;
  }
  const ms=Math.round(performance.now()-t0);
  const head=(TEST.fail?"ПРОВАЛЕНО "+TEST.fail:"ВСЁ ЗЕЛЁНОЕ")+
    " · пройдено "+TEST.pass+" · наборов "+(TEST.ran|0)+" из "+TEST_SUITES.length+
    (TEST_SHARD?" · часть "+(TEST_SHARD.i+1)+"/"+TEST_SHARD.n:"")+
    (SKIPPED_SLOW?" · без тяжёлых "+SKIPPED_SLOW+" (полный: test.ps1 -Full)":(SKIPPED_NODE?"":" · полный"))+
    (SKIPPED_PROBE?" · без проб "+SKIPPED_PROBE+" (стенд: test.ps1 -Probe)":"")+
    (SKIPPED_SKIP?" · мимо "+SKIPPED_SKIP+" (skip=)":"")+
    (SKIPPED_NODE?" · без картинки и интерфейса "+SKIPPED_NODE+" (они в test.ps1 -Browser)":"")+
    (SKIPPED_WIN?" · не в своём окне "+SKIPPED_WIN+" (win)":"")+
    (TEST_SHUFFLE!==null?" · перемешано "+TEST_SHUFFLE:"")+
    (TEST.stageRan?" · карантин "+TEST.stageRan+(TEST.stageFail?" (провалов "+TEST.stageFail+")":""):"")+
    (ms>0?" · "+ms+" мс":"");
  TEST.summary=head;
  const groups=Object.keys(TEST.groups||{}).sort((a,b)=>TEST.groups[b].fail-TEST.groups[a].fail||a.localeCompare(b))
    .map(g=>{const r=TEST.groups[g];return "  "+(r.fail?"✗":"·")+" "+g+": наборов "+r.suites+", пройдено "+r.pass+(r.fail?", ПРОВАЛОВ "+r.fail:"");});
  TEST.lines.unshift("ПО ГРУППАМ:\n"+groups.join("\n")+"\n");
  /* самые долгие наборы — только там, где часы идут (test.ps1 -Times гоняет без
     --virtual-time-budget); под виртуальным временем всё по нулям и блок не печатается */
  const slow=(TEST.times||[]).filter(t=>t[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,45);
  if(slow.length)TEST.lines.unshift("САМЫЕ ДОЛГИЕ (мс):\n"+slow.map(t=>"  "+t[1]+"  "+t[0]).join("\n")+"\n");
  const box=document.createElement("pre");
  box.id="testout";
  box.style.cssText="position:fixed;inset:0;z-index:9999;overflow:auto;margin:0;padding:14px;"+
    "background:#05070c;color:#bfe8f0;font:11px/1.5 ui-monospace,monospace;white-space:pre-wrap";
  /* карантин — своим блоком после провалов: test.ps1 печатает его отдельной
     строкой и в код выхода не складывает */
  const staged=(TEST.staged||[]).length?"КАРАНТИН (в вердикт не идёт):\n"+TEST.staged.map(s=>"  ✗ "+s).join("\n")+"\n\n":"";
  box.textContent=head+"\n\n"+(TEST.failed.length?"ПРОВАЛЫ:\n"+TEST.failed.map(s=>"  ✗ "+s).join("\n")+"\n\n":"")+staged+
    TEST.lines.join("\n");
  document.body.appendChild(box);
  console.log(head);
  if(TEST.failed.length)console.log("ПРОВАЛЫ:\n"+TEST.failed.join("\n"));
  return head;
}
const TEST_SUITES=[];
/* набор помнит свой файл: push идёт при загрузке файла, когда TEST_FILE — его имя */
TEST_SUITES.push=function(fn){fn.file=(typeof TEST_FILE==="string")?TEST_FILE:"";return Array.prototype.push.call(this,fn);};
/* кооператив по штампу (M351): наём и прилавок закрыты законом, пока его нет —
   наборы, которым нужен экипаж, ставят штамп сами */
function coopStamp(name,house){
  G.coop={name:name||"Тест",house:house||"kova",since:0,sold0:G.soldTotal|0,spirit:2,wants:[],done:[],ledger:{},shift:0,visit:{key:"",bought:{}}};
  return G.coop;
}
