/* запуск: после того как игра САМА прожила хотя бы кадр (data-alive на
   корне, 28-loop), а не через 60 мс. Первый набор — про этот запуск: сборка,
   которая падает на загрузке или у которой мёртв цикл, краснеет здесь, а не
   «страница упала до runTests» без отчёта. Ждём до трёх секунд: под --virtual-time-budget rAF идёт по капле (четыре кадра за восемь виртуальных секунд), поэтому один кадр, а не тридцать. */
/* ── замер (?times=1) идёт БЕЗ ожидания кадра, и это не лень ──
   `test.ps1 -Times` снимает настоящие часы, а значит пускает Chrome без
   `--virtual-time-budget`. Без бюджета `--dump-dom` снимает разметку по
   событию load — и если прогон к этому времени ещё не начался, Chrome честно
   отдаёт страницу БЕЗ отчёта («страница упала до runTests»), хотя ничего не
   падало. Виновата пауза: этот файл ждёт живого кадра до трёх секунд, и
   свободный поток в это время — то самое окно, в которое влезает снимок.
   Под виртуальными часами окна нет: снимок делается по исчерпании бюджета,
   то есть заведомо после прогона.
   Поэтому в замере тесты идут СИНХРОННО, прямо на разборе страницы: поток
   занят с первой миллисекунды, и load приходит уже с готовым отчётом. Ценой
   одного набора — того самого, который спрашивает, шёл ли цикл кадров: в
   замере кадров нет вовсе. Замер меряет, судит обычный прогон. */
const TEST_TIMES=(()=>{try{return /[?&]times=1/.test(location.search);}catch(e){return false;}})();
/* перемешка (?shuffle) его не трогает (pin): он спрашивает про запуск страницы,
   а не про прогон, и после чужих наборов его вопрос теряет смысл */
const BOOT_SUITE=() => suite("игра запустилась сама: живой кадр без сбоя",{tier:"browser"}, () => {
  const alive=document.documentElement.getAttribute("data-alive")||"";
  eq(alive,VER,"на корне data-alive с версией сборки (кадров прошло "+frameN+")");
  ok(frameN>=1,"цикл кадров шёл сам, по rAF: "+frameN);
  eq(crashN,0,"сторож кадра ни разу не сработал до тестов");
  /* браузер без WebGPU (дым CI идёт с --disable-gpu) — законный запуск: мира
     нет, но игра жива и прямо говорит, какой браузер нужен (08b gpuNone).
     Требование «глазам нужна видеокарта» — в наборе EYES_SUITE ниже */
  if(GPU.none){
    const ng=document.getElementById("nogpu");
    ok(!!ng&&ng.getClientRects().length>0&&getComputedStyle(ng).display!=="none","без WebGPU на экране надпись, а не пустота");
    ok(!!ng&&/WebGPU/.test(ng.textContent||""),"надпись называет, чего не хватает: «"+(ng?(ng.textContent||"").slice(0,40):"")+"»");
  }else ok(GPU.ok,"видеокарта поднялась до тестов (или честно сказала, что её нет)");
  ok(typeof CRASH_SHIP==="object"&&CRASH_SHIP.n===0,"на сервер с этой страницы ничего не ушло (стенд молчит)");
});
/* глаза тестов: наборы картинки читают кадр видеокарты (gpuSnapshot). Без неё
   они смотрят в пустоту — один громкий провал здесь, а не сотня странных ниже.
   Дым CI (only=«игра запустилась») его не зовёт: там видеокарты нет по договору */
const EYES_SUITE=() => suite("глаза тестов: видеокарта есть",{tier:"browser"}, () => {
  ok(GPU.ok,"глаза тестов слепы: видеокарты нет"+(GPU.none?" (браузер без WebGPU)":" (не поднялась за 14 с)"));
});
BOOT_SUITE.pin="first";
let BOOT_SINK=0;
if(!TEST_TIMES&&!(typeof globalThis.TEST_NODE!=="undefined"&&globalThis.TEST_NODE)){TEST_SUITES.unshift(EYES_SUITE);TEST_SUITES.unshift(BOOT_SUITE);}
(function boot(t0){
  /* под Node кадров нет: цикл выключается сразу, набор про запуск — дело Хрома */
  if(typeof TEST_NODE!=="undefined"&&TEST_NODE&&frameN<1){LOOP_OFF=true;runTests();return;}
  if(TEST_TIMES){LOOP_OFF=true;G.running=false;
    const i0=document.getElementById("intro");if(i0)i0.style.display="none";   /* заставка снимается и здесь: без этого набор про чистый кадр честно краснеет */
    runTests();return;}
  /* видеокарта: мир рисует только она (08b). Под --virtual-time-budget часы
     виртуальные, а ответ адаптера приходит по настоящим — пустой опрос
     проматывает бюджет за миллисекунды, и прогон шёл без мира вовсе (0.456:
     «пусто 99%», выхлоп молчит, растр 0). Каждый опрос отдаёт ~10 мс
     настоящего времени счётом, между опросами промис адаптера успевает */
  /* и прогрева конвейеров (08b0): наборы видят кадры без компиляции, детектор — честные промахи */
  if((!GPU.ok||!GPU_PIPES.done)&&!GPU.none&&performance.now()-t0<14000){let s=0;for(let k=0;k<2e6;k++)s+=k&1;BOOT_SINK=s;setTimeout(()=>boot(t0),50);return;}
  const ready=frameN>=1||crashN>0;
  if(!ready&&performance.now()-t0<17000){setTimeout(()=>boot(t0),50);return;}
  G.running=false;
  const intro=document.getElementById("intro");
  if(intro)intro.style.display="none";
  runTests();
})(performance.now());
