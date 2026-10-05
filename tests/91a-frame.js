/* ══════════════ M234: сбой кадра не убивает игру ══════════════
   Одно исключение внутри кадра рвало цепочку rAF навсегда: мир вставал, кнопки
   жили, и ни строки о причине. Кадр обязан пережить чужую ошибку. */
TEST_SUITES.push(()=>suite("кадр переживает исключение",{tier:"browser"},()=>{
  resetWorld();
  /* стенд не знает, видима ли страница (в headless — нет), поэтому ломаем
     сам кадр: проверяется договор обёртки, а не путь внутри него */
  const wasOff=LOOP_OFF, wasBody=frameBody;
  LOOP_OFF=false;
  frameBody=function(){throw new Error("проверка");};
  let threw=false;
  try{frame(performance.now());}catch(e){threw=true;}
  frameBody=wasBody;LOOP_OFF=wasOff;
  ok(!threw,"исключение не вышло наружу — цепочка кадров цела");
  ok(crashN>0,"сбой посчитан");
  ok(/проверка/.test(crashLast),"и назван: "+crashLast);
}));
