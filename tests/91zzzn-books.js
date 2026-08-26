/* ══════════════ автотесты: книжная полка (M202) ══════════════ */
TEST_SUITES.push(()=>suite("книги: сорок написанных кусков, и ни одного сгенерированного",()=>{
  resetWorld();
  ok(BOOKS.length>=40,"книг не меньше сорока ("+BOOKS.length+")");
  const ids={},titles={};
  let shortest=1e9;
  for(const b of BOOKS){
    ok(!ids[b.id],"номер не повторяется: "+b.id);ids[b.id]=1;
    ok(!titles[b.ru],"заголовок не повторяется: "+b.ru);titles[b.ru]=1;
    ok(b.by&&b.by.length>3,"у книги есть выходные данные: "+b.ru);
    shortest=Math.min(shortest,b.t.length);
    /* отрывок — абзац, а не строка подписи */
    ok(b.t.length>=90,"отрывок длиной в абзац ("+b.t.length+"): "+b.ru);
    ok(!/undefined|null|\{|\}/.test(b.t),"в тексте нет следов подстановки: "+b.ru);
  }
  ok(shortest>=90,"самый короткий отрывок всё равно абзац ("+shortest+")");
  /* голоса разные: заголовки не должны быть одной формы */
  const kinds=BOOKS.filter(b=>/устав|инструкц|наставлен|уложен|протокол|отчёт|справочник|каталог|учебник|пособие|правила/i.test(b.ru)).length;
  ok(kinds>=6&&kinds<=BOOKS.length-10,"среди книг и казённые, и не казённые ("+kinds+" из "+BOOKS.length+")");
}));
TEST_SUITES.push(()=>suite("книги: находятся в обломках, одно место — одна книга",()=>{
  resetWorld();
  G.books=[];G.things=[];G.log=[];
  eq(bookCount(),0,"полка пуста");
  const b1=bookFind(12345,"из остова");
  ok(!!b1,"книга нашлась: "+b1.ru);
  eq(bookCount(),1,"и легла на полку");
  ok(G.things.some(t=>t.book===b1.id),"и в вещи");
  /* то же место — та же книга, если её ещё нет */
  G.books=[];G.things=[];
  const b2=bookFind(12345,"из остова");
  eq(b2.id,b1.id,"одно и то же место отдаёт одну и ту же книгу");
  /* дважды одну и ту же не выдают */
  const b3=bookFind(12345,"из остова");
  ok(b3&&b3.id!==b1.id,"второй раз — уже другая: "+b3.ru);
  eq(bookCount(),2,"на полке две");
  /* собираем всё: список кончается, а не зацикливается */
  for(let i=0;i<BOOKS.length+10;i++)bookFind(i*7919+3,"из обломков");
  eq(bookCount(),BOOKS.length,"полка собирается целиком и не переполняется");
  eq(bookFind(1,"из обломков"),null,"когда всё собрано — больше ничего не находится");
  ok(recordAll().e.some(x=>/все сорок/.test(x.s)),"и в книжке об этом одна строка");
}));
TEST_SUITES.push(()=>suite("книги: бросок редкий, и полка переживает сохранение",()=>{
  resetWorld();
  G.books=[];G.things=[];
  /* бросок: из сотни обломков книга падает не в каждом */
  let hits=0;
  for(let i=0;i<100;i++){G.books=[];hits+=bookRoll(i*104729+11,"из остова",0.34)?1:0;}
  ok(hits>15&&hits<60,"книга попадается примерно в трети обломков ("+hits+" из 100)");
  /* сохранение */
  G.books=[3,7,19];
  const snap=snapshot();G.books=null;applySave(JSON.parse(JSON.stringify(snap)));
  eq(bookAll().join(","),"3,7,19","полка пережила сохранение");
  /* мусор в сейве не проходит */
  const bad=snapshot();bad.books=[3,999,"привет",7];
  applySave(JSON.parse(JSON.stringify(bad)));
  eq(bookAll().join(","),"3,7","чужие номера отброшены");
  const old=snapshot();delete old.books;
  applySave(JSON.parse(JSON.stringify(old)));
  eq(bookCount(),0,"сохранение без полки — пустая полка, а не падение");
}));
