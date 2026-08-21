/* ══════════════ пересказ: мир двигался, пока вас не было ══════════════
   Не симуляция. Симуляция галактики стоила бы дороже всей игры и не была бы
   видна: игрок всё равно видит только исход. Поэтому здесь честная подделка —
   прошедшее время прокручивается СЛУХАМИ, и у каждого слуха обязана стоять
   настоящая перемена в состоянии мира. Слух без перемены — та же «подпись без
   кода», за которую ловили перки: игрок вправе прилететь и проверить.

   Правило, которое легко сломать: соперник-коллекционер НЕ закрывает редкость
   навсегда. Иначе сотня из ста становится недостижимой, а вместе с ней зависает
   планета (12n). Унесённая редкость МЕНЯЕТ АДРЕС: теперь она у него, и адресом
   становится он сам. Соперник — это перевозка, а не потеря. */

const NEWS_EVERY=6*60000;                // как часто мир поворачивается: раз в шесть минут
const NEWS_MAX_ROLL=3;                   // за один заход не больше трёх перемен
const NEWS_KEEP=24;                      // сколько слухов помнит кантина
const NEWS_RIVALS=["Пекарь","Совеня","Тихий Ефим","Мадам Крапива","Долгий Ким","Штоф"];

function newsAll(){return (G.news||(G.news=[]));}
function newsMarks(){return (G.newsMarks||(G.newsMarks={}));}
/* метка знания на карте: закрывает хвост M92 — знание должно быть слоем карты,
   а не строчкой, которую негде посмотреть */
function newsMark(key,what,col){
  if(!key)return;
  newsMarks()[key]={what,col:col||"#f2b25c",t:Date.now()};
}
function newsMarkAt(sx,sy){const m=G.newsMarks;return m?m[sx+","+sy]||null:null;}
/* случайный сектор со станцией неподалёку: у слуха должен быть адрес */
function newsSomewhere(r){
  for(let i=0;i<24;i++){
    const sx=G.sx+Math.floor((r()-.5)*14),sy=G.sy+Math.floor((r()-.5)*14);
    if(!starAt(sx,sy))continue;
    const s=getSystem(sx,sy);
    if(s&&s.station)return s;
  }
  return null;
}
/* ── соперник ──
   Редкость уходит к нему вместе с адресом: он и есть новое место. Взять её
   можно там, где он ходит, — так же, как всё остальное в этой игре. */
function newsRivals(){return (G.rivals||(G.rivals={}));}
function rivalOf(id){const R=G.rivals;return R?R[id]||null:null;}
function rivalHolds(id){return !!rivalOf(id);}
/* отдать редкость игроку: соперник разбит либо иначе расстался с ней */
function rivalYield(id){
  const V=rivalOf(id);if(!V)return null;
  const R=RARE_BY_ID[id];if(!R)return null;
  delete G.rivals[id];
  if(!rareHas(id)){
    rareList().push(id);
    const c=rareCount();
    logAdd("tech","Редкость «"+R.ru+"» отобрана у "+V.who+" · "+c+"/100");
    say("«"+R.ru+"»\nотобрана у "+V.who+"\nсобрано "+c+" из 100");
    if(c>=100&&typeof planetGrant==="function")planetGrant();
  }
  if(typeof saveGame==="function")saveGame(true);
  return R;
}
/* ── соперник как место ──
   Адрес должен быть достижим, иначе «перевозка» — это всё та же потеря. Он
   выходит в свой сектор такой же записью, как охотник (12o): весь бой уже
   написан, добавлять к нему нечего. Он не пират и не мстит — он просто не
   отдаёт добром.  */
function rivalHere(){
  const R=G.rivals;if(!R)return null;
  for(const id in R){
    const V=R[id];
    if(V&&V.sx===G.sx&&V.sy===G.sy)return Object.assign({id},V);
  }
  return null;
}
function rivalSpawn(){
  const V=rivalHere();if(!V)return;
  const r=rng(hashi(V.sx*131+V.sy,0x217A,5));
  const a=r()*TAU,rad=1900+r()*900;
  const hp=70+sysDanger(G.sx,G.sy)*60;
  G.pirates.push({x:Math.cos(a)*rad,y:Math.sin(a)*rad,vx:0,vy:0,a:a+Math.PI,
    hull:hp,hullMax:hp,name:V.who,seed:hashi(V.sx,V.sy,0x21),
    shipId:pirateShipId(hashi(V.sx,V.sy,0x21)),
    dmg:5,cool:0,aware:false,thrust:false,rival:V.id});
}
function rivalDefeated(p){
  sfx("boom",{v:.8});
  rivalYield(p.rival);
  if(typeof nodeDrop==="function")nodeDrop("с соперника",1,hashi(p.seed,0x21A,3));
}
/* ── перемены ──
   У каждой — своя настоящая правка состояния и своя строчка. Порядок правки и
   строчки един: сперва мир, потом слова о нём. */
const NEWS_KINDS=[
  {id:"squeeze",apply(r){
    const s=newsSomewhere(r);if(!s)return null;
    /* настоящая перемена: давление на рынке — те же цены, что увидит игрок */
    const k=pick(TRADE_KEYS,r);
    const m=G.market[s.key]||(G.market[s.key]={pressure:{},t:G.t});
    m.pressure[k]=clamp((m.pressure[k]||0)+.35+r()*.3,-.6,.8);
    newsMark(s.sx+","+s.sy,"цены сдвинулись","#f2b25c");
    return {ru:"«"+s.station.name+"» скупает "+RES[k].ru.toLowerCase()+
      ": кто-то опустошил склады",sx:s.sx,sy:s.sy};
  }},
  {id:"owner",apply(r){
    const s=newsSomewhere(r);if(!s)return null;
    const m=G.market[s.key]||(G.market[s.key]={pressure:{},t:G.t});
    for(const k of TRADE_KEYS)m.pressure[k]=clamp((m.pressure[k]||0)+(r()-.5)*.5,-.6,.8);
    newsMark(s.sx+","+s.sy,"сменился хозяин","#7fe6d8");
    return {ru:"«"+s.station.name+"» перешла другим людям: и цены, и порядки там теперь чужие",
      sx:s.sx,sy:s.sy};
  }},
  {id:"barge",apply(r){
    const s=newsSomewhere(r);if(!s)return null;
    /* настоящая перемена: в системе появился остов, который можно осмотреть */
    const key=s.sx+","+s.sy;
    if(!G.wrecks[key])G.wrecks[key]=[];
    if(G.wrecks[key].length>=12)return null;
    const a=r()*TAU,rad=1800+r()*1400;
    const good=pick(TRADE_KEYS,r),nm=pick(BARGE_CAPNAMES,r);
    G.wrecks[key].push({seed:hashi(s.seed,0x3E7,3),x:Math.cos(a)*rad,y:Math.sin(a)*rad,
      tier:clamp(1+Math.floor(sysDanger(s.sx,s.sy)*2),0,3),seen:0,good,name:nm});
    newsMark(key,"остов баржи","#ff9d7a");
    return {ru:"Баржа «"+nm+"» не дошла до «"+s.station.name+"»: остов лежит там же",
      sx:s.sx,sy:s.sy};
  }},
  {id:"captain",apply(r){
    /* кого-то сбили без вас: если ваш охотник ещё жив — не его; чужого капитана
       мир убирает сам, и это видно по спокойствию сектора */
    const s=newsSomewhere(r);if(!s)return null;
    /* правим состояние тихо, без «tell»: это чужое дело, а не ваш поступок */
    if(!G.occCalm)G.occCalm={};
    G.occCalm[occKey(s.sx,s.sy)]=Date.now();
    const had=typeof occLvl==="function"?occLvl(s.sx,s.sy):0;
    if(had&&typeof occSet==="function")occSet(s.sx,s.sy,had-1);
    newsMark(s.sx+","+s.sy,"стало тише","#8fd08a");
    return {ru:"В секторе "+s.sx+","+s.sy+" кто-то другой снял пиратского капитана — там тише",
      sx:s.sx,sy:s.sy};
  }},
  {id:"rival",apply(r){
    /* соперник уносит ЕЩЁ НЕ НАЙДЕННУЮ редкость — и становится её адресом */
    const free=RARE.filter(R=>!rareHas(R.id)&&!rivalHolds(R.id));
    if(free.length<=1)return null;        /* последнюю не трогаем никогда */
    const R=free[Math.floor(r()*free.length)];
    const s=newsSomewhere(r);if(!s)return null;
    newsRivals()[R.id]={who:pick(NEWS_RIVALS,r),sx:s.sx,sy:s.sy,t:Date.now()};
    newsMark(s.sx+","+s.sy,"он держит редкость","#c58ae0");
    return {ru:"«"+R.ru+"» унесли раньше вас: теперь она у "+G.rivals[R.id].who+
      " — искать не там, а у него",sx:s.sx,sy:s.sy};
  }}
];
/* ── поворот мира ──
   Считается лениво по прошедшему времени, как склад узла: ни таймера, ни тика
   в кадре. Слышно это в кантине — там, где и так узнают новости. */
function newsTick(){
  const now=Date.now();
  if(!G.newsT){G.newsT=now;return 0;}
  let turns=Math.floor((now-G.newsT)/NEWS_EVERY);
  if(turns<=0)return 0;
  G.newsT=now;
  turns=Math.min(turns,NEWS_MAX_ROLL);
  const r=rng(hashi(Math.floor(now/NEWS_EVERY),G.sx*131+G.sy,0x9E5));
  let made=0;
  for(let i=0;i<turns;i++){
    const K=NEWS_KINDS[Math.floor(r()*NEWS_KINDS.length)];
    const out=K.apply(r);
    if(!out)continue;
    /* курс бон (12u) двигают только настоящие происшествия — вот они, ровно те,
       что мир уже разыграл. Своего розыгрыша у бон нет и быть не должно. */
    if(typeof scripOnNews==="function")scripOnNews(K.id,getSystem(out.sx,out.sy));
    newsAll().push({id:K.id,ru:out.ru,sx:out.sx,sy:out.sy,t:now});
    made++;
  }
  /* глубина памяти эфира зависит от приёмника, то есть от корпуса (03f) */
  const keep=(typeof newsKeepLimit==="function")?newsKeepLimit():NEWS_KEEP;
  while(newsAll().length>keep)G.news.shift();
  if(made&&typeof saveGame==="function")saveGame(true);
  return made;
}
/* ── что рассказывают ──
   В кантине, там же, где по репутации сидят люди. Слух — это адрес: у каждой
   строчки есть сектор, куда можно долететь и проверить. */
function newsRender(){
  newsTick();
  const list=newsAll();
  if(!list.length)return;
  $body.appendChild(el("div","sec","ЧТО РАССКАЗЫВАЮТ · МИР ДВИГАЛСЯ БЕЗ ВАС"));
  for(const n of list.slice(-6).reverse()){
    const mins=Math.max(1,Math.round((Date.now()-n.t)/60000));
    $body.appendChild(el("div","row","<div class='nm'><b>"+n.ru+"</b><s>сектор "+
      n.sx+", "+n.sy+" · слышно "+mins+" мин назад · на карте появилась метка</s></div>"));
  }
  /* соперники: у каждого унесённого предмета есть человек и место */
  const rv=Object.keys(G.rivals||{});
  if(rv.length){
    $body.appendChild(el("div","sec","У КОГО ТЕПЕРЬ ЛЕЖИТ · СОПЕРНИК НЕ ПОТЕРЯ, А ПЕРЕВОЗКА"));
    for(const id of rv.slice(0,6)){
      const R=RARE_BY_ID[id],V=G.rivals[id];
      if(!R||!V)continue;
      $body.appendChild(el("div","row","<div class='nm'><b>«"+R.ru+"» · "+V.who+
        "</b><s>сектор "+V.sx+", "+V.sy+" · её всё ещё можно забрать: адрес сменился, "+
        "а не пропал</s></div>"));
    }
  }
}
