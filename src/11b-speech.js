/* ══════════════ речь: очередь реплик и вещь на столе ══════════════
   M128. Разговоров в игре нет и не будет: диалог требует ветвления, ветвление
   требует письма на сто часов, а на выходе получается меню. Здесь другое.

   ОЧЕРЕДЬ, А НЕ БЕСЕДА. У каждого места есть короткая очередь реплик, и за одну
   посадку тратится ОДНА. Вернулся — услышал следующую. Двадцать часов знакомства
   ценой строковой таблицы.

   ИГРОК НЕ ВЫБИРАЕТ СЛОВА. Он кладёт вещь: ленту самописца, груз, слух, имя.
   Человек отвечает на предмет. Это вся поверхность ввода — и она же
   характеристика: что ты положил, то ты и сказал.

   ТРИ РЕГИСТРА. Служебный — эфир: сухо, по позывному. Бытовой — вживую: коротко,
   ворчливо, нужда упоминается вскользь и никогда не оформляется как заказ.
   Редкий — одна длинная реплика на всю историю; здесь её нет, она принадлежит
   хранителю (M139) и возвращенцу (M147).

   МОЛЧАНИЕ — ТОЖЕ РЕПЛИКА. Пауза после твоей ленты, человек посмотрел и ничего
   не сказал: полноправная строка таблицы, а не отсутствие строки. */

/* ── эфир: половина всей речи в игре ──
   Безликие голоса, чужой трафик, ругань диспетчера, прогноз. Самая дешёвая
   жизнь в игре: ни моделей, ни анимации, ни сцен. */
const ETHER=[
  "…борт четыре-двенадцать, повторите высоту. Четыре-двенадцать?",
  "…и он мне говорит: топливо по норме. По какой норме, у него бак сухой…",
  "…всем в секторе: пылевой фронт с ночной стороны, садиться не советую.",
  "…шестой, шестой, я стойка. Ты вообще куда ушёл?",
  "…передайте на верхний ярус, что смена не придёт. Никакая.",
  "…частота занята. Частота занята. Частота зан…",
  "…груз принят, борт свободен. Хорошей дороги, кто там у вас.",
  "…не лезь в тот коридор, там баржи ходят без огней.",
  "…прогноз: без изменений. Как вчера. Как всегда.",
  "…кто-то щёлкает в эфире. Слушайте: вот, опять. Нет? Ну ладно.",
  "…рейс снят. Причина не указана. Да там всегда не указана.",
  "…если слышите — у нас лампа на площадке горит. Одна. Идите на неё."
];
const ETHER_EVERY=5400;                  // кадров между голосами: примерно полторы минуты
function etherTick(dt){
  if(!G.running||G.mode!=="system")return;
  if(typeof expQuiet==="function"&&expQuiet())return;   /* минута тишины (M159) */
  const rate=(typeof hullRole==="function")?hullRole().ether:1;
  G.etherT=(G.etherT==null?ETHER_EVERY:G.etherT)-dt*rate;
  if(typeof mirrorEchoTick==="function")mirrorEchoTick();
  if(typeof lightsArrive==="function")lightsArrive();   /* три света (11g): первый приход в ядро */
  if(typeof chartsTick==="function")chartsTick();       /* карта возвращается (11m) */
  if(typeof quietAfterLeave==="function")quietAfterLeave();   /* счёт суток после тихого уезда (11n) */
  if(G.etherT>0)return;
  G.etherT=ETHER_EVERY*(.7+Math.random()*.8);
  const r=rng(hashi(G.sx,G.sy,(Date.now()/60000)|0));
  /* строка истории (11c) — не чаще раза из трёх, остальное остаётся безликим шумом */
  const sl=(typeof storyEtherLine==="function")?storyEtherLine(r):null;
  const line=sl!=null?sl:pick(ETHER,r);
  /* окраина почтового круга (хвост M133): связь скверная — строка рвётся,
     слова выпадают. Это и есть цвет области, кроме молчащих приборов */
  let out=line;
  /* расхождение времён (11h): на окраине уезда диспетчер извиняется за часы */
  if(typeof hoursEtherLine==="function"){const h=hoursEtherLine(r);if(h)out=h;}
  if(typeof groveEtherLine==="function"){const h=groveEtherLine(r);if(h)out=h;}   /* роща (11j) */
  if(typeof keepersEtherLine==="function"){const h=keepersEtherLine(r);if(h)out=h;}   /* погасший рукав (11k) */
  if(typeof countyAnswerLine==="function"){const h=countyAnswerLine();if(h)out=h;}    /* город ответил (11l) */
  if(typeof slowEtherLine==="function"){const h=slowEtherLine(r);if(h)out=h;}        /* биостанции (11o) */
  if(typeof planEtherLine==="function"){const h=planEtherLine(r);if(h)out=h;}        /* накладные (11r) */
  if(typeof retEtherLine==="function"){const h=retEtherLine(r);if(h)out=h;}          /* кого ждут (11s) */
  if(typeof rumourEtherLine==="function"){const h=rumourEtherLine(r);if(h)out=h;}    /* слух на приёмнике (11t) */
  if(typeof needEtherLine==="function"){const h=needEtherLine(r);if(h)out=h;}        /* нужда поблизости (M152e) */
  if(typeof appetiteEtherLine==="function"){const h=appetiteEtherLine(r);if(h)out=h;} /* кто берёт с надбавкой (M290) */
  if(typeof ringEtherLine==="function"){const h=ringEtherLine(r);if(h)out=h;}        /* о том, что ловили (M154) */
  if(typeof misEtherLine==="function"){const h=misEtherLine(r);if(h)out=h;}          /* стойки спорят о времени (M155) */
  if(typeof expEtherLine==="function"){const h=expEtherLine(r);if(h)out=h;}          /* циркуляр: половина эфира (M156) */
  if(typeof namesEtherLine==="function"){const h=namesEtherLine();if(h)out=h;}       /* ваше слово у диспетчера (11u) */
  if(out&&typeof regionAt==="function"){
    const R=regionAt(G.sx,G.sy);
    if(R&&R.theme==="post"&&regionDepth(G.sx,G.sy)<.5&&Math.random()<.6)
      out=out.replace(/[а-яёa-z]{3,}/gi,w=>Math.random()<.22?"…":w);
  }
  etherLine(out);   /* на пульт и в ЭФИР (M151a) */
  if(typeof mirrorEchoArm==="function")mirrorEchoArm(out);    /* зеркало (11f): эхо повторяет то, что было слышно, а не исходник */
}
/* ── как к вам обращаются ──
   «пилот» → позывной → имя. Больше ничего не нужно, чтобы игрок почувствовал
   себя местным: счётчик посадок на эту станцию и есть вся механика. */
function visitsAll(){return (G.visits||(G.visits={}));}
function visitHere(){
  if(!G.st)return 0;
  return visitsAll()[G.sys.key]|0;
}
function visitMark(){
  if(!G.st)return;
  const V=visitsAll();
  V[G.sys.key]=(V[G.sys.key]|0)+1;
}
function addrForm(){
  const v=visitHere();
  return v<2?"пилот":v<6?("борт «"+(typeof stat==="function"?stat().S.ru:"—")+"»"):G.name||"капитан";
}
/* ── бытовой регистр: очередь на место ──
   Реплики привязаны к станции, а не к человеку: людей в кантине тасует сам мир,
   а место остаётся. Нужда упоминается вскользь — это не заказ и не задание. */
const LOCAL=[
  "— Опять вы. Ну хоть кто-то возвращается.",
  "— Клапан бы. Да где его тут возьмёшь.",
  "— Сидите, сидите. Всё равно очередь до утра.",
  null,                                   // молчание: посмотрел и ничего не сказал
  "— Тут раньше два дока было. Теперь полтора.",
  "— Вы с верхнего яруса? Нет? И правильно.",
  "— У нас вода по расписанию. Расписание не соблюдается.",
  "— Скажете там своим: пусть не летят зимой. Хотя какая тут зима.",
  null,
  "— Слышал, у вас приборы новые. Покажете как-нибудь.",
  "— Мне бы такую работу, чтобы никуда не садиться.",
  "— Здесь всё нормально. Просто скучно, а так нормально."
];
function speechAll(){return (G.speech||(G.speech={}));}
/* одна реплика за посадку: пока не улетишь и не вернёшься, очередь не двигается */
function speechHere(){
  if(!G.st)return null;
  const S=speechAll(), key=G.sys.key;
  const st=S[key]||(S[key]={i:0,v:-1});
  const v=visitHere();
  if(st.v!==v){st.v=v;st.i=(st.i+1)%LOCAL.length;st.sq=undefined;st.shutSq=undefined;st.qd=undefined;}
  /* доброе слово после закрывшейся именной двери (11ah, M226): раньше реплик
     истории — оно случается один раз на дверь, и человек важнее сюжета.
     Решение раз на посадку, строка стоит всю посадку; f.said ставит сам */
  if(st.shutSq===undefined)st.shutSq=(typeof offerShutLine==="function")?offerShutLine():null;
  if(st.shutSq)return {line:st.shutSq,silent:false,addr:addrForm()};
  /* реплика истории (11c) вклинивается перед общей; решение держится всю посадку */
  if(st.sq===undefined)st.sq=(typeof storyQueueLine==="function")?storyQueueLine():null;
  if(st.sq)return {line:st.sq.line,silent:st.sq.silent,addr:addrForm()};
  /* тишина (11ar, M230): когда мир затих, у стойки изредка называют — не тебя */
  if(st.qd===undefined)st.qd=(typeof quietDoorLine==="function")?quietDoorLine():null;
  if(st.qd)return {line:st.qd,silent:false,addr:addrForm()};
  let line=LOCAL[st.i];
  /* дом и характер места (хвосты M113, M128): каждая четвёртая реплика — про
     дом, которому принадлежит станция, и его боны; каждая вторая из
     оставшихся — в тоне места: глухой аванпост и людный узел говорят по-разному */
  const Hh=(typeof houseOf==="function")?houseOf(G.sys):null;
  if(Hh&&st.i%4===3&&line!==null){
    const rt=(typeof scripRate==="function")?scripRate(Hh.id):100;
    line="— Тут всё "+Hh.ru+": "+Hh.note+". Боны их нынче по "+rt+(rt>115?". Дорого, да.":rt<85?". Дешевеют.":".");
  }else if(st.i%4===1&&line!==null){
    const back=(typeof cantStyle==="function")?(cantStyle().back||""):"";
    const PL={outpost:["— Тихо у нас. Вот и хорошо.","— Рейс раз в неделю, если повезёт."],
      trade:["— Не стойте в проходе, тут ходят.","— Сегодня четыре борта, завтра восемь."],
      indust:["— Смена кончилась, а гул нет.","— Руду вчера не вывезли. И позавчера."],
      yard:["— Стапель занят до среды. Какой сегодня?","— Сварщика нет. Сварщик есть, трезвого нет."],
      sci:["— Не трогайте приборы. Вообще ничего не трогайте.","— У нас тут тихий час. Круглые сутки."]}[back];
    if(PL)line=PL[st.i%PL.length];
  }
  return {line,silent:line===null,addr:addrForm()};
}
/* ── стол ──
   Единственная поверхность ввода: игрок кладёт вещь, человек отвечает на вещь.
   Ответ зависит от предмета и от того, сколько раз вы сюда садились. */
const TABLE_REPLY={
  strip:[
    "— Это что, лента? Дайте гляну… Ага. Ну, бывает такое.",
    "— Ровная. Скучная у вас дорога, и слава богу.",
    "— Вот здесь она пляшет. Вы там были? И как оно?",
    null,
    "— Такие ленты у нас берут. Не спрашивайте кто."
  ],
  cargo:[
    "— Кладите, кладите. Только я не покупаю, я смотрю.",
    "— Оно у нас своё есть. Было.",
    null,
    "— Знакомая маркировка. Не спрашивайте откуда."
  ],
  rumour:[
    "— Слышал. И не такое слышал.",
    "— Кто вам это сказал? Ладно, не говорите.",
    null,
    "— Вот с этого места подробнее. Хотя нет, не надо."
  ]
  ,
  /* имя (хвост M128): стол принимает и его — ответ на человека, не на вещь */
  name:[
    "— Слышал. Нет, не слышал. Но теперь буду.",
    "— Ну и что. Тут у каждого имя.",
    null,
    "— А. Так это вы. Мне говорили, вы выше.",
    "— Запомню. Я не запомню, но скажу, что запомню."
  ]
};
/* ЛЕНТА КАК ВЕЩЬ (долг M123). Оторванная полоса — это предмет: её кладут на
   стол, отдают, продают. Хорошая лента продаётся хорошо, и «хорошая» здесь
   значит одно: на ней видно, что мир под кораблём уходил. */
const STRIPS_MAX=6;
function stripsAll(){return (G.strips||(G.strips=[]));}
function stripValue(s){
  return Math.round((40+(s.mis||0)*820+(s.span||0)*3)/10)*10;
}
function tapeTear(){
  const T=(typeof tapeInit==="function")?tapeInit():null;
  if(!T||T.n<24)return null;
  const s={sx:G.sx,sy:G.sy,
           mis:+((typeof instrMisclose==="function")?instrMisclose():0).toFixed(3),
           span:T.n,t:Date.now()};
  if(typeof misMarkStrip==="function")misMarkStrip(s);   /* лента из уезда несёт метку (M155) */
  const L=stripsAll();
  L.unshift(s);
  while(L.length>STRIPS_MAX)L.pop();
  /* лента отрывается — значит, кольцо начинается заново: то, что унесли,
     на бумаге больше не пишется */
  T.n=0;T.head=0;T.back=0;T.zero=null;
  tell("tech","Лента оторвана · сектор "+s.sx+":"+s.sy+" · невязка "+s.mis.toFixed(3),
       "Лента оторвана\nсектор "+s.sx+":"+s.sy);
  return s;
}
addEventListener("keydown",e=>{
  if(e.code==="KeyT"&&G.running&&!document.querySelector(".scr.open")){
    tapeTear();e.preventDefault();
  }
});
/* Положить вещь на стол. Возвращает ответ — строку или молчание. Продажа
   отдельным движением: сначала показывают, потом торгуются. */
function putOnTable(kind,idx){
  if(kind==="strip"&&typeof misTableReply==="function"){const m=misTableReply();if(m)return m;}   /* уезд невязки (M155) */
  const sr=(typeof storyTableLine==="function")?storyTableLine(kind):null;
  if(sr)return sr;                       // история отвечает на вещь раньше общей таблицы (11c)
  const pool=TABLE_REPLY[kind];
  if(!pool)return null;
  const r=rng(hashi((G.sys?G.sys.key.length:1)+visitHere(),idx|0,kind.length));
  const line=pick(pool,r);
  return {line,silent:line===null};
}
function stripSell(k){
  const L=stripsAll(), s=L[k];
  if(!s)return 0;
  const price=stripValue(s);
  L.splice(k,1);
  /* доход идёт одной воронкой (12j-home): продажа ленты — такая же выручка,
     как любая другая, и дом должен её видеть */
  earn(price,"лента");
  tell("money","Лента продана · +"+price.toLocaleString("ru")+" кр",
       "Лента продана\n+"+price.toLocaleString("ru")+" кр");
  return price;
}
