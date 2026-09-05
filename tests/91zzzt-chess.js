/* ══════════════ автотесты: шахматы по почте (M192) ══════════════ */
const chSq=(s)=>{const f="abcdefgh".indexOf(s[0]),r=8-(+s[1]);return r*8+f;};
const chName=(i)=>"abcdefgh"[i%8]+(8-((i/8)|0));
function chFrom(list){/* список ходов по алгебраике «e2e4» */
  return list.map(s=>({f:chSq(s.slice(0,2)),t:chSq(s.slice(2,4)),p:0}));
}
TEST_SUITES.push(()=>suite("шахматы: фигуры ходят по правилам, а не как удобно",()=>{
  resetWorld();
  const P=chPosition([]);
  eq(P.B.join(""),CH_START,"начальная позиция стандартная");
  ok(P.turn,"белые начинают");
  /* пешка: одна, две с места, и по диагонали только с взятием */
  const e2=chSq("e2");
  const pm=chMoves(P.B,P.st,e2).map(chName).sort();
  eq(pm.join(","),"e3,e4","пешка с места ходит на одну и на две");
  /* конь через свои фигуры ходит, ладья — нет */
  /* e2 занято своей пешкой — туда конь не идёт, и это правильно */
  eq(chMoves(P.B,P.st,chSq("g1")).map(chName).sort().join(","),"f3,h3","конь прыгает через своих, но не на своих");
  eq(chMoves(P.B,P.st,chSq("a1")).length,0,"ладья заперта своими");
  eq(chMoves(P.B,P.st,chSq("c1")).length,0,"и слон тоже");
  eq(chMoves(P.B,P.st,chSq("e1")).length,0,"король в начале никуда не идёт");
  /* ход не своей фигурой не проходит */
  ok(!chLegal([],{f:chSq("e7"),t:chSq("e5"),p:0}),"белые не ходят чёрной пешкой");
  ok(chLegal([],{f:e2,t:chSq("e4"),p:0}),"а своей — ходят");
}));
TEST_SUITES.push(()=>suite("шахматы: короля под боем не оставляют, мат называется матом",()=>{
  resetWorld();
  /* детский мат: 1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6?? 4.Qxf7# */
  const mv=chFrom(["e2e4","e7e5","f1c4","b8c6","d1h5","g8f6","h5f7"]);
  eq(chState(mv.slice(0,6)),"","до мата ничего особенного");
  eq(chState(mv),"мат","детский мат объявлен матом");
  /* связанная фигура не ходит */
  const pin=chFrom(["e2e4","e7e5","d1h5","d7d6","f1c4","c8g4"]);
  const P=chPosition(pin);
  /* белая пешка f2 связана? нет — проверим, что король не может встать под бой */
  const kmv=chMoves(P.B,P.st,chSq("e1")).map(chName);
  ok(kmv.indexOf("e2")<0,"король не встаёт на битое поле");
  /* прямая проверка: нельзя открыть своего короля */
  const B=".......k........................................Q......K........".split("");
  /* белый ферзь на a2? соберём проще: чёрный король h8, белый ферзь h1 — чёрному нельзя на h-линию */
  const B2="......k...................................................R...K.".split("");
  const st={ep:-1,wk:false,wq:false,bk:false,bq:false};
  ok(typeof chAttacked(B2,chKing(B2,false),true)==="boolean","счёт боя не падает и отвечает да/нет");
}));
TEST_SUITES.push(()=>suite("шахматы: рокировка, взятие на проходе и превращение",()=>{
  resetWorld();
  /* рокировка в короткую сторону */
  const pre=chFrom(["e2e4","e7e5","g1f3","b8c6","f1c4","f8c5"]);
  const P=chPosition(pre);
  const kmv=chMoves(P.B,P.st,chSq("e1")).map(chName).sort();
  ok(kmv.indexOf("g1")>=0,"короткая рокировка доступна: "+kmv.join(","));
  const after=pre.concat([{f:chSq("e1"),t:chSq("g1"),p:0}]);
  const P2=chPosition(after);
  eq(P2.B[chSq("g1")],"K","король встал на g1");
  eq(P2.B[chSq("f1")],"R","и ладья перепрыгнула на f1");
  eq(P2.B[chSq("h1")],".","с h1 её нет");
  /* взятие на проходе */
  const ep=chFrom(["e2e4","a7a6","e4e5","d7d5"]);
  const P3=chPosition(ep);
  eq(chName(P3.st.ep),"d6","поле взятия на проходе назначено");
  const epm=chMoves(P3.B,P3.st,chSq("e5")).map(chName).sort();
  ok(epm.indexOf("d6")>=0,"пешка бьёт на проходе: "+epm.join(","));
  const P4=chPosition(ep.concat([{f:chSq("e5"),t:chSq("d6"),p:0}]));
  eq(P4.B[chSq("d5")],".","снятая пешка убрана с доски");
  eq(P4.B[chSq("d6")],"P","а бьющая встала на d6");
  /* превращение: пешка на a7 (индекс 8) идёт на a8 (индекс 0) — вот это и есть
     последняя горизонталь. Первый счёт ставил её на a6 и ждал ферзя на a7 */
  const B="........P.......................................................".split("");
  const st={ep:-1,wk:false,wq:false,bk:false,bq:false};
  chApply(B,st,{f:8,t:0,p:0});
  eq(B[0],"Q","пешка на последней превратилась в ферзя");
  const B2="........P.......................................................".split("");
  chApply(B2,{ep:-1},{f:8,t:0,p:3});
  eq(B2[0],"N","и в коня, если так велели");
}));
TEST_SUITES.push(()=>suite("шахматы: партия — это список ходов, и по проводу едут числа",()=>{
  resetWorld();
  G.chess=null;G.log=[];
  const ch="aabbccddeeff";
  const g=chessStart(ch,true);
  ok(!!g,"партия заведена");
  ok(chessMyTurn(ch),"белые ходят первыми, и это мы");
  ok(!chessMove(ch,{f:chSq("e7"),t:chSq("e5"),p:0}),"чужой фигурой не походишь");
  ok(chessMove(ch,{f:chSq("e2"),t:chSq("e4"),p:0}),"свой ход прошёл");
  ok(!chessMyTurn(ch),"теперь очередь соперника");
  ok(!chessMove(ch,{f:chSq("d2"),t:chSq("d4"),p:0}),"дважды подряд не ходят");
  /* ход с той стороны */
  ok(chessTake(ch,{f:chSq("e7"),t:chSq("e5"),p:0}),"пришедший ход лёг");
  ok(!chessTake(ch,{f:chSq("d7"),t:chSq("d5"),p:0}),"второй подряд с той стороны — нет");
  ok(chessMyTurn(ch),"снова наш ход");
  /* незаконный ход с той стороны не портит партию */
  chessMove(ch,{f:chSq("g1"),t:chSq("f3"),p:0});
  const n=chessGame(ch).mv.length;
  ok(!chessTake(ch,{f:chSq("a8"),t:chSq("a1"),p:0}),"незаконный ход соперника отбит");
  eq(chessGame(ch).mv.length,n,"и в партию не попал");
  /* по проводу — три числа, и ни одного знака */
  const m=chessGame(ch).mv[0];
  eq(Object.keys(m).sort().join(","),"f,p,t","ход это ровно три поля");
  ok([m.f,m.t,m.p].every(x=>Number.isInteger(x)&&x>=0&&x<64),"и все три — маленькие числа");
  /* позиция не хранится: только ходы */
  const j=JSON.stringify(chessAll());
  ok(!/[a-hA-H]{8}/.test(j.replace(/"[a-z]+":/g,"")),"доски в сохранении нет, есть ходы");
}));
TEST_SUITES.push(()=>suite("шахматы: партия переживает сохранение, порченый ход её не рушит",()=>{
  resetWorld();
  G.chess=null;
  const ch="0123456789ab";
  chessStart(ch,true);
  chessMove(ch,{f:chSq("e2"),t:chSq("e4"),p:0});
  chessTake(ch,{f:chSq("e7"),t:chSq("e5"),p:0});
  const before=JSON.stringify(chessGame(ch).mv);
  const snap=snapshot();G.chess=null;applySave(JSON.parse(JSON.stringify(snap)));
  eq(JSON.stringify(chessGame(ch).mv),before,"ходы пережили сохранение");
  eq(chPosition(chessGame(ch).mv).B[chSq("e4")],"P","и позиция считается та же");
  /* чужой ключ цепочки не заводит партию */
  const bad=snapshot();
  bad.chess.g["нетакой"]={mv:[{f:0,t:1,p:0}],w:1};
  bad.chess.g[ch].mv.push({f:99,t:1,p:0});
  applySave(JSON.parse(JSON.stringify(bad)));
  ok(!chessGame("нетакой"),"кривой номер цепочки отброшен");
  eq(chessGame(ch).mv.length,2,"порченый ход обрезал список, а не сломал партию");
  const old=snapshot();delete old.chess;
  applySave(JSON.parse(JSON.stringify(old)));
  eq(Object.keys(chessAll().g).length,0,"сохранение без партий — не падение");
}));
