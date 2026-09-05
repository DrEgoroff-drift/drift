/* запуск: после того как игра САМА прожила хотя бы кадр (data-alive на
   корне, 28-loop), а не через 60 мс. Первый набор — про этот запуск: сборка,
   которая падает на загрузке или у которой мёртв цикл, краснеет здесь, а не
   «страница упала до runTests» без отчёта. Ждём до трёх секунд: под --virtual-time-budget rAF идёт по капле (четыре кадра за восемь виртуальных секунд), поэтому один кадр, а не тридцать. */
if(!(typeof globalThis.TEST_NODE!=="undefined"&&globalThis.TEST_NODE))TEST_SUITES.unshift(() => suite("игра запустилась сама: живой кадр без сбоя", () => {
  const alive=document.documentElement.getAttribute("data-alive")||"";
  eq(alive,VER,"на корне data-alive с версией сборки (кадров прошло "+frameN+")");
  ok(frameN>=1,"цикл кадров шёл сам, по rAF: "+frameN);
  eq(crashN,0,"сторож кадра ни разу не сработал до тестов");
  ok(typeof CRASH_SHIP==="object"&&CRASH_SHIP.n===0,"на сервер с этой страницы ничего не ушло (стенд молчит)");
}));
(function boot(t0){
  /* под Node кадров нет: цикл выключается сразу, набор про запуск — дело Хрома */
  if(typeof TEST_NODE!=="undefined"&&TEST_NODE&&frameN<1){LOOP_OFF=true;runTests();return;}
  const ready=frameN>=1||crashN>0;
  if(!ready&&performance.now()-t0<3000){setTimeout(()=>boot(t0),50);return;}
  G.running=false;
  const intro=document.getElementById("intro");
  if(intro)intro.style.display="none";
  runTests();
})(performance.now());
