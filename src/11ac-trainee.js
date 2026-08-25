/* ══════════════ стажёр: заяц в трюме ══════════════
   M163. Противоположность Веге: мальчишка, найденный в трюме после блошинца,
   хочет в космонавты. Та же инфраструктура (правое кресло, строка на пульте,
   ЛЮДИ) — вдвоём с Вегой на борту не бывает: она остаётся дома и говорит об
   этом. Учится по ступеням: трогает приборы (строка на панели), читает карты
   (как Вега — ближайшая нужда раз в день), просится в рейс, получает диплом
   института и уходит на своём борту. Через год его голос в эфире — с вашим
   позывным.

   ПРАВИЛА ФАЙЛА:
   1. Хранится G.trainee: {st, name, day, jumps, gone}. Тексты — здесь.
   2. Не наёмник и не пассажир: не стоит денег, не возит груз, не воюет. */
const TRAINEE_NAMES=["Алёшка","Петька","Сашка","Юрка","Гришка"];
const TRAINEE_LINES={
  1:["А это что? А это? Не трогаю, не трогаю.","Я тихо сидел. Три дня. Сухари были.","Вы меня не высадите? Я полезный. Буду."],
  2:["Я карту прочитал. Сам. Там нужда рядом — я видел.","Стрелка дёргается, когда вы так поворачиваете. Я записал.","Можно я за ручку? Я знаю, где эфир."],
  3:["Отправьте меня в рейс. Я готов. Честно.","Командир звена сказал — молод. А вы что скажете?","Я всё выучил. Диплом дадут — уйду. Не обижайтесь."]
};
function traineeAboard(){const T=G.trainee;return !!(T&&T.st>=1&&T.st<=3&&!T.gone);}
/* найден в трюме после блошинца: раз за прохождение */
function traineeFind(){
  if(G.trainee||!G.sys||!G.st||G.st.stype!=="bazaar")return false;
  const r=rng(hashi(G.sys.sx,G.sys.sy,0x7A1E));
  if(r()>.35)return false;
  const name=pick(TRAINEE_NAMES,r);
  G.trainee={st:1,name,day:celDay(),jumps:0,gone:0,said:0};
  if(typeof vegaAboard==="function"&&vegaAboard()){vegaBoard(false);peopleLine("Заяц? В трюме? Ладно. Я дома посижу. Пока он тут.","Вега",true);}
  traineeSeat();
  peopleLine("я в трюме сидел. Три дня. Я в космонавты хочу. Не высаживайте.",name,true);
  logAdd("good","В трюме нашёлся заяц: "+name+". Хочет в космонавты.");
  recordAdd(name,"взят стажёром · сам залез");
  return true;
}
function traineeSeat(){
  const T=G.trainee;if(!T||!traineeAboard())return;
  G.seat={name:"СТАЖЁР "+T.name.toUpperCase(),line:["","трогает приборы","читает карты","просится в рейс"][T.st],draw:traineeDraw,act:traineeAct};
}
function traineeAct(){
  const T=G.trainee;if(!T||!traineeAboard())return;
  peopleLine(TRAINEE_LINES[T.st][T.said++%3],T.name,true);
}
function traineeDraw(c,W,H){
  c.save();c.translate(W/2,H);const s=Math.min(W,H)/56;c.scale(s,s);
  c.fillStyle="#5a6e8a";c.beginPath();c.roundRect(-9,-26,18,24,5);c.fill();
  c.fillStyle="#e6c9a8";c.beginPath();c.arc(0,-33,7,0,7);c.fill();
  c.fillStyle="#8a6a3a";c.fillRect(-7,-41,14,4);
  c.fillStyle="#b8323a";c.fillRect(-3,-28,6,3);   /* галстук */
  c.restore();
}
/* прыжок: первая ступень трогает приборы, дальше — растёт */
function traineeJump(){
  const T=G.trainee;if(!T||!traineeAboard())return;
  T.jumps++;
  if(T.st===1&&T.jumps%3===0){logAdd("warn",T.name+" тронул прибор: стрелка дёрнулась. «Я не хотел».");}
  if(T.st===1&&T.jumps>=5){T.st=2;peopleLine("я карты выучил. Все листы. Можно я буду говорить, где что?",T.name,true);traineeSeat();}
  if(T.st===2&&T.jumps>=15){T.st=3;peopleLine("отправьте меня в рейс. Я готов. Или диплом — и я сам.",T.name,true);traineeSeat();}
}
/* день: на второй ступени читает карты */
function traineeTick(){
  const T=G.trainee;if(!T)return;
  const d=celDay();if(T.lastDay===d)return;T.lastDay=d;
  if(traineeAboard()&&!G.seat)traineeSeat();
  if(T.st===2&&typeof needsNear==="function"){const L=needsNear(6);if(L.length)peopleLine("на "+L[0].sys.station.name+" нет "+L[0].need.ru+". Я по карте.",T.name);}
  if(T.gone&&!T.voice&&d-(T.goneDay|0)>=365){
    T.voice=1;
    const hull=(G.shipId&&shipData(G.shipId))?"«"+shipData(G.shipId).ru+"»":"борт";
    etherLine("…борт «Стриж-бис», позывной как у "+hull+". Это я, "+T.name+". Слышите? Я дошёл.");
    recordAdd(T.name,"вышел в эфир через год · своим бортом · вашим позывным");
  }
}
/* диплом: на стойке научной станции, с третьей ступени */
function traineeDiplomaHere(){const T=G.trainee;return !!(T&&T.st===3&&!T.gone&&G.st&&G.st.stype==="sci");}
function traineeDiploma(){
  const T=G.trainee;if(!traineeDiplomaHere())return false;
  T.st=4;T.gone=1;T.goneDay=celDay();
  if(G.seat&&G.seat.name.indexOf("СТАЖЁР")===0)G.seat=null;
  peopleLine("диплом. Настоящий. Я пошёл. У меня свой борт — маленький, но свой. Спасибо, что не высадили.",T.name,true);
  thingAdd("paper","Диплом · "+T.name,"выдан институтом · «пилот 3-го класса» · он ушёл своим бортом");
  recordAdd("институт","стажёр "+T.name+" выпущен · рекомендация пилота учтена");
  logAdd("good",T.name+" получил диплом и ушёл на своём борту.");
  return true;
}
function traineeBlock(){
  if(traineeDiplomaHere()){
    $body.appendChild(el("div","sec","ИНСТИТУТ · ДИПЛОМ СТАЖЁРУ"));
    const r=el("div","row","<div class='nm'><b>"+G.trainee.name+" сдал</b><s>диплом «пилот 3-го класса» · он уйдёт на своём борту</s></div>");
    const b=el("button","act sm gold","ВЫДАТЬ ДИПЛОМ");b.onclick=()=>{traineeDiploma();renderTab();};
    r.appendChild(b);$body.appendChild(r);
  }
}
