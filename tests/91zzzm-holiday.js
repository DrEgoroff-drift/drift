/* ══════════════ автотесты: праздники по календарю (M201) ══════════════ */
const HOL_D=(m,d)=>new Date(2026,m-1,d,12,0,0);
TEST_SUITES.push(()=>suite("праздник: дата настоящая, и через новый год он не рвётся",()=>{
  resetWorld();
  eq(holNow(HOL_D(3,15)),null,"в середине марта праздника нет");
  eq(holNow(HOL_D(7,1)),null,"и в июле нет");
  const ny1=holNow(HOL_D(12,31)),ny2=holNow(HOL_D(1,1)),ny3=holNow(HOL_D(1,2));
  ok(ny1&&ny1.id==="ny","тридцать первого — Новый год");
  ok(ny2&&ny2.id==="ny","и первого тоже");
  ok(ny3&&ny3.id==="ny","и второго");
  eq(holNow(HOL_D(1,3)),null,"третьего уже нет");
  eq(holNow(HOL_D(12,30)),null,"тридцатого ещё нет");
  const c=holNow(HOL_D(4,12));
  ok(c&&c.id==="cos","двенадцатого апреля — День космонавтики");
  eq(holNow(HOL_D(4,13)),null,"тринадцатого — нет");
  /* у Нового года есть ёлка, у Дня космонавтики нет */
  ok(HOL_BY.ny.tree,"на Новый год ставят ёлку");
  ok(!HOL_BY.cos.tree,"в апреле — не ставят");
}));
TEST_SUITES.push(()=>suite("праздник: поздравляют те, кто есть в трудовой книжке",()=>{
  resetWorld();
  G.hol={};G.things=[];G.record=null;G.log=[];
  /* пустая книжка — поздравить некому, и игра честно это говорит */
  const H=HOLIDAYS[0];
  const stub=holNow;
  ok(typeof holDock==="function","радиограммы есть");
  /* подменяем дату: тест не может ждать декабря */
  const realNow=Date.now;
  const fake=HOL_D(12,31).getTime();
  Date.now=()=>fake;
  const RealDate=Date;
  /* holNow берёт new Date() — подменяем и его */
  window.Date=function(x){return x===undefined?new RealDate(fake):new RealDate(x);};
  window.Date.now=()=>fake;
  window.Date.prototype=RealDate.prototype;
  try{
    ok(holDock(),"праздник отмечен");
    ok((G.log||[]).some(x=>/поздравить вас пока некому/i.test(x.text||x.s||"")),
       "с пустой книжкой поздравить некому");
    ok(!holDock(),"второй раз в тот же год — нет");
    /* теперь книжка не пуста */
    G.hol={};G.things=[];
    recordAdd("Варламова З.","рекомендация: считает");
    recordAdd("Вега","характеристика: дома не бывает");
    recordAdd("медкомиссия","допущен");
    ok(holDock(),"новый год — новые радиограммы");
    const L=thingsAll().filter(t=>t.hol==="ny"&&/Радиограмма/.test(t.ru));
    eq(L.length,2,"поздравили двое: те, кто в книжке");
    ok(L.some(t=>/Варламова/.test(t.ru)),"и это они по имени");
    ok(!L.some(t=>/медкомиссия/i.test(t.ru)),"а комиссия не поздравляет");
    ok(recordAll().e.some(x=>x.a==="Новый год"),"строка в книжке о празднике");
  }finally{
    window.Date=RealDate;Date.now=realNow;
  }
}));
TEST_SUITES.push(()=>suite("праздник: ничего не даёт, кроме ёлки и голосов",()=>{
  resetWorld();
  G.hol={};G.things=[];G.record=null;
  const cr=G.credits,dt=G.data;
  const RealDate=Date;const fake=HOL_D(12,31).getTime();
  window.Date=function(x){return x===undefined?new RealDate(fake):new RealDate(x);};
  window.Date.now=()=>fake;window.Date.prototype=RealDate.prototype;
  try{
    recordAdd("Вега","характеристика");
    holDock();
    eq(G.credits,cr,"денег не прибавилось");
    eq(G.data,dt,"данных тоже");
    ok(holTreeUp(),"а ёлка стоит");
    const line=holEtherLine();
    ok(line&&line.length>10,"и в эфире поздравляют: "+line);
    ok(HOL_ETHER.ny.indexOf(line)>=0,"строка из таблицы праздника");
  }finally{window.Date=RealDate;}
  ok(!holTreeUp(),"а в обычный день ёлки нет");
  eq(holEtherLine(),"","и в эфире ничего праздничного");
}));
