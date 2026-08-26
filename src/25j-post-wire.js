/* ══════════════ почта: провод ══════════════
   M190. Карточка (25g, 25h, 25i) уходит в общую кучу и ловится оттуда чужой
   рукой. Учётной записи не нужно: наружу идёт та же метка пилота, что у следа
   (11ag) — случайная строка в localStorage, ни на что не годная, кроме счёта
   «сколько сегодня».

   ЧТО ФИЗИЧЕСКИ ПРОХОДИТ ЧЕРЕЗ ГРАНИЦУ. Номера: бланк, вычеркнутые варианты,
   глифы приписки и числа снимка сцены. Ни одного напечатанного человеком
   знака, ни одного имени, ни одного адреса. Поэтому у почты нет и не может
   быть модерации — разбирать нечего.

   ИМЁН НЕТ И У СЕРВЕРА ДЛЯ ИГРОКА. Он знает, чья карточка лежит в куче, но
   наружу этого не отдаёт никогда: поймавший видит карточку и номер цепочки,
   ответ раскладывает сам сервер. Ни одна сторона не может найти другую,
   позвать её или узнать, что это тот же человек. Замолчал — и тебя нет.

   ОДИН ЗАПРОС НА СТЫКОВКУ (правило M171). Игра не опрашивает сервер по
   таймеру и не держит соединение: раз пристыковались — один поход за тем, что
   адресовано вам. Чужие карточки из общей кучи ловятся не здесь, а в ночном
   эфире (25l, M191): их дослушивают вечером, а не получают к заправке.

   ОФЛАЙН ЭТОЙ ЗАТЕИ НЕТ ВОВСЕ, и интерфейс о ней не заикается: открытый с
   рабочего стола файл — это игра без почты, а не игра со сломанной почтой.

   ПРАВИЛА ФАЙЛА:
   1. Ошибки сети — молча. Кадр не ждёт ответа никогда.
   2. В сохранении лежит только то, что уже пришло: стопки и номера цепочек.
      Куча живёт на сервере и в сейв не попадает. */
const MAIL_STACK_MAX=8;     /* стопок на столе */
const MAIL_CARDS_MAX=12;    /* карточек в одной стопке */
function mailAll(){
  if(!G.mail||typeof G.mail!=="object")G.mail={st:[],day:"",sent:0};
  if(!Array.isArray(G.mail.st))G.mail.st=[];
  return G.mail;
}
function mailOn(){
  return typeof location!=="undefined"&&location.protocol.indexOf("http")===0&&
         typeof traceId==="function"&&!!traceId();
}
function mailToday(){const d=new Date();return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();}
function mailLeft(){
  const M=mailAll(),t=mailToday();
  if(M.day!==t){M.day=t;M.sent=0;}
  return Math.max(0,3-(M.sent|0));
}
let mailBusy=0;
function mailCall(op,body){
  if(!mailOn())return Promise.resolve(null);
  const b=Object.assign({op:op,id:traceId()},body||{});
  return fetch(CLOUD.api+"?a=post",{method:"POST",body:JSON.stringify(b)})
    .then(r=>r.json()).catch(()=>null);
}
/* карточка на провод: только те поля, которые сервер и так проверит. Лишнее
   не отсекается «на всякий случай» — его тут просто неоткуда взять */
function mailWire(s){
  /* `v` едет вместе со всем: без него художник открытки отказывается рисовать
     первой же строкой (`!s.v` — «снимок не читается»), и своя отправленная
     карточка ложилась в стопку чёрным прямоугольником. Сервер эту единицу
     всё равно ставит сам, но карточка живёт и до сервера, и после него */
  return {v:POST_V,m:s.m,sx:s.sx|0,sy:s.sy|0,pi:s.pi|0,mi:s.mi==null?-1:s.mi|0,
    lon:(s.lon==null?null:+s.lon),cx:s.cx|0,t:s.t|0,ver:String(s.ver||VER),
    f:String(s.f||""),c:(s.c||[]).map(x=>x|0),g:(s.g||[]).map(x=>x|0)};
}
/* ── стопки ──
   Цепочка — это стопка карточек, скреплённая на столе. Своя карточка и чужая
   лежат в ней вперемешку, по времени, и корреспондента узнают не по имени
   (его нет), а по тому, КАК ОН ВЫЧЁРКИВАЕТ. */
function mailStack(ch){
  const M=mailAll();
  let st=M.st.find(x=>x.ch===ch);
  if(!st){
    st={ch:ch,c:[],t:Date.now(),mute:0};
    M.st.unshift(st);
    while(M.st.length>MAIL_STACK_MAX)M.st.pop();
  }
  return st;
}
function mailPush(ch,card,mine){
  const st=mailStack(ch);
  card.mine=mine?1:0;card.at=Date.now();
  st.c.push(card);
  while(st.c.length>MAIL_CARDS_MAX)st.c.shift();
  st.t=Date.now();
  if(!mine)st.fresh=1;
  return st;
}
/* ── отправить ──
   Своя карточка либо заводит новую цепочку (легла в кучу), либо отвечает в
   уже заведённую. Разница для игрока одна: у ответа есть кому дойти. */
function mailSend(s,ch,mv){
  if(!mailOn()||!postSigned(s))return Promise.resolve(false);
  if(mailLeft()<=0){tell("dim","Три карточки в сутки — и хватит","ТРИ КАРТОЧКИ В СУТКИ");return Promise.resolve(false);}
  const M=mailAll();
  /* ход в партии (M192) едет ТОЙ ЖЕ посылкой, что и карточка: партия — это
     та же переписка, и заводить ей второй провод незачем */
  return mailCall(ch?"reply":"put",
    {card:mailWire(s),ch:ch||undefined,mv:mv||undefined}).then(j=>{
    if(!j||!j.ok){
      if(j&&j.reason)logAdd("dim","Почта: "+j.reason);
      return false;
    }
    M.sent=(M.sent|0)+1;
    const id=ch||String(j.ch||"");
    if(id)mailPush(id,Object.assign({},mailWire(s)),true);
    sfx("ui",{f:900,to:1500,d:.07,v:.18});
    logAdd("good","Карточка ушла"+(ch?" в ответ":" в общую почту")+" · "+postCaption(s));
    tell("good","Карточка ушла"+(ch?" в ответ":""),"ОТПРАВЛЕНО\n"+postCaption(s).toUpperCase());
    if(tableOpenNow)tableRender();
    return true;
  });
}
/* ── стыковка: один поход ──
   Забирает ОТВЕТЫ — то, что адресовано вам. Ловля чужих карточек с M191 живёт
   в ночном эфире (25l) и стыковки не касается: карточку из общей кучи не
   выдают в нагрузку к заправке, её дослушивают вечером. */
function mailDock(){
  if(!mailOn())return;
  const now=Date.now();
  if(now-mailBusy<45000)return;
  mailBusy=now;
  mailCall("in").then(j=>{
    if(j&&j.ok&&j.in&&j.in.length){
      for(const r of j.in)if(r&&r.card&&r.ch){
        mailPush(String(r.ch),r.card,false);
        /* пришёл ход — кладём его в партию этой же цепочки (M192) */
        if(r.mv&&typeof chessTake==="function")chessTake(String(r.ch),r.mv);
      }
      logAdd("good","Ответ на карточку"+(j.in.length>1?" ×"+j.in.length:""));
      tell("good","Пришёл ответ на карточку","ПРИШЁЛ ОТВЕТ\nстопка на столе");
      if(tableOpenNow)tableRender();
    }
  });
}
/* «не принимать»: единственная кнопка про человека. Цепочка умирает, тому
   концу не сообщается ничего — его карточки просто перестают доходить */
function mailMute(st){
  if(!st)return;
  st.mute=1;
  mailCall("mute",{ch:st.ch});
  logAdd("dim","Стопка закрыта: больше с этого конца ничего не придёт");
  if(tableOpenNow)tableRender();
}
function mailDrop(st){
  const M=mailAll(),i=M.st.indexOf(st);
  if(i>=0)M.st.splice(i,1);
  if(tableOpenNow)tableRender();
}
function mailFresh(){return mailAll().st.filter(s=>s.fresh).length;}
