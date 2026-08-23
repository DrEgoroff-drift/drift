/* ══════════════ приёмник: диапазоны на одном месте, между ними шум, на краю слова выпадают ══════════════ */
TEST_SUITES.push(()=>suite("приёмник: слухи, цены, погода и эфир находятся ручкой",()=>{
  resetWorld();G.st=G.sys.station;
  eq(radioTune(0).k,"noise","на нуле шум");
  eq(radioTune(.21).k,"rumour","слухи на своём месте");
  const P=radioTune(.49);eq(P.k,"price","цены на своём");ok(/берут по \d+/.test(P.text),"цена — число: "+P.text);
  const Wt=radioTune(.73);eq(Wt.k,"weather","погода на своём");ok(Wt.text.length>5,"строка погоды");
  eq(radioTune(.94).k,"ether","эфир на своём");
  eq(radioTune(.35).k,"noise","между диапазонами шум");
  ok(radioTune(.49).q>.8,"в середине чисто");ok(radioTune(.41).q<.3,"на краю грязно");
  eq(G.radioF,.41,"ручка помнит положение");
  ok(RADIO_BANDS.every((B,i)=>!i||B.lo>RADIO_BANDS[i-1].hi),"диапазоны не перекрываются");
}));
