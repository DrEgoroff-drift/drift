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
if(!TEST_TIMES&&!(typeof globalThis.TEST_NODE!=="undefined"&&globalThis.TEST_NODE))TEST_SUITES.unshift(() => suite("игра запустилась сама: живой кадр без сбоя", () => {
  const alive=document.documentElement.getAttribute("data-alive")||"";
  eq(alive,VER,"на корне data-alive с версией сборки (кадров прошло "+frameN+")");
  ok(frameN>=1,"цикл кадров шёл сам, по rAF: "+frameN);
  eq(crashN,0,"сторож кадра ни разу не сработал до тестов");
  ok(typeof CRASH_SHIP==="object"&&CRASH_SHIP.n===0,"на сервер с этой страницы ничего не ушло (стенд молчит)");
}));
(function boot(t0){
  /* под Node кадров нет: цикл выключается сразу, набор про запуск — дело Хрома */
  if(typeof TEST_NODE!=="undefined"&&TEST_NODE&&frameN<1){LOOP_OFF=true;runTests();return;}
  if(TEST_TIMES){LOOP_OFF=true;G.running=false;
    const i0=document.getElementById("intro");if(i0)i0.style.display="none";   /* заставка снимается и здесь: без этого набор про чистый кадр честно краснеет */
    runTests();return;}
  const ready=frameN>=1||crashN>0;
  if(!ready&&performance.now()-t0<3000){setTimeout(()=>boot(t0),50);return;}
  G.running=false;
  const intro=document.getElementById("intro");
  if(intro)intro.style.display="none";
  runTests();
})(performance.now());
