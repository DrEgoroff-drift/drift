/* ══════════════ Блошинец: станция, где всё чьё-то ══════════════
   Седьмой тип станции и единственный, где товар — БЫВШИЙ В УПОТРЕБЛЕНИИ. Ряды
   под навесом, чужие детали с чужих бортов, живое из вещей покойника и сведения,
   разложенные на прилавке рядом с гайками.

   ЧЕМ ЭТО НЕ ЯВЛЯЕТСЯ. Не рулетка и не второй рынок: тут не «выпадает» ничего.
   У каждого лота есть ПРОВЕНАНС — откуда вещь взялась, — и провенанс называет
   место, до которого можно долететь. Это и есть механика: блошинец не продаёт
   предметы, он продаёт адреса, а предмет прилагается.

   ПРАВИЛА ФАЙЛА:
   1. Лота без провенанса не бывает. Провенанс — это `who` и живой сектор
      (`starAt`), а не строчка настроения.
   2. Ряды детерминированы: seed станции плюс медленные часы. Ничего из этого
      не персистится, кроме списка КУПЛЕННОГО, — купленный лот не возвращается.
   3. Родная валюта прилавка — боны дома (12u-scrip). Кредиты берут, но с
      наценкой: здесь чужие деньги, а не чужой дом.
   4. Сведения продают и о ВАС. Лот про ваш маршрут лежит на виду; уйдёте, не
      забрав, — его купит кто-то другой, и охотник (12o) получит адрес. Это не
      наказание за бедность, а цена того, что вы тут были.
   5. Живое — один раз за прохождение и только из чужих вещей: птица уходит
      через `parrotFind`, у которого свой замок. */

const FLEA_MARKUP=1.28;            // во что обходятся кредиты вместо бон
const FLEA_ROWS=5;                 // сколько лотов лежит на прилавке разом
const FLEA_EPOCH=2*3600*1000;      // ряды переставляют раз в два часа
const FLEA_GOT=90;                 // столько купленных лотов помним
const FLEA_WHO=["покойного капитана","списанного борта","разорившейся артели",
  "конторы, закрывшейся в прошлом сезоне","команды, не вернувшейся с рейса",
  "старьёвщика с окраины"];
const FLEA_WHY=["распродажа наследства","залог, за которым не пришли",
  "остатки после описи","сдали за долги","выкуплено у мусорщиков"];

function fleaRec(){
  if(!G.flea||typeof G.flea!=="object")G.flea={got:[]};
  if(!Array.isArray(G.flea.got))G.flea.got=[];
  return G.flea;
}
function fleaHere(sys){
  const S=(sys||G.sys)&&(sys||G.sys).station;
  return !!S&&S.stype==="bazaar";
}
function fleaEpoch(){return Math.floor(Date.now()/FLEA_EPOCH);}
/* ── провенанс ──
   Место, а не настроение: идём спиралью от станции, пока не встретим звезду.
   Правило 1 держится здесь, и суите проверять именно это. */
function fleaPlace(r,sx,sy){
  for(let ring=1;ring<=6;ring++){
    for(let t=0;t<10;t++){
      const dx=Math.round((r()*2-1)*ring),dy=Math.round((r()*2-1)*ring);
      if(!dx&&!dy)continue;
      const x=sx+dx,y=sy+dy;
      if(starAt(x,y))return {sx:x,sy:y};
    }
  }
  return {sx:0,sy:0};                                   // родная система есть всегда
}
/* ── ряды ──
   Детерминированы от станции и медленных часов; вычисляются, не хранятся. */
function fleaLots(sys){
  sys=sys||G.sys;
  if(!fleaHere(sys))return [];
  const R=fleaRec(),ep=fleaEpoch(),out=[];
  const danger=typeof sysDanger==="function"?sysDanger(sys.sx,sys.sy):.4;
  for(let i=0;i<FLEA_ROWS;i++){
    const seed=hashi(hashi(sys.sx,sys.sy,0xF1EA),ep*31+i*7717,0xF1EB);
    const r=rng(seed);
    const id=sys.sx+":"+sys.sy+":"+ep+":"+i;
    if(R.got.indexOf(id)>=0)continue;
    const who=pick(FLEA_WHO,r),why=pick(FLEA_WHY,r);
    const at=fleaPlace(r,sys.sx,sys.sy);
    let kind="part";
    const u=r();
    if(i===0&&(G.sx!==0||G.sy!==0))kind="you";           // сведения о вас лежат первыми
    else if(u<.20&&typeof parrotHas==="function"&&!parrotHas())kind="bird";
    else if(u<.55)kind="word";
    const tier=clamp(1+Math.floor(r()*(1+danger*3.4)),1,5);
    const lot={id,kind,seed,who,why,at,tier};
    if(kind==="part"){
      lot.part=genPart(hashi(seed,3,0x9A7),tier);
      lot.ru="«"+lot.part.name+"»";
      lot.note="с борта, брошенного в секторе "+at.sx+":"+at.sy;
      lot.price=Math.round((28+tier*34)*(.8+r()*.5));
    }else if(kind==="bird"){
      lot.ru="живое: трепло в клетке";
      lot.note="из вещей "+who+", борт стоял в секторе "+at.sx+":"+at.sy;
      lot.price=Math.round(120+r()*60);
    }else if(kind==="word"){
      lot.ru="адрес, записанный от руки";
      lot.note="куда ходил тот борт: сектор "+at.sx+":"+at.sy;
      lot.price=Math.round(46+tier*18);
    }else{
      lot.at={sx:G.sx|0,sy:G.sy|0};
      /* у этого лота своё прошлое: он не из наследства, его записали здесь и
         вчера — иначе строка читается как «наследство покойного капитана о вас» */
      lot.who="человека, который слушал у стойки";
      lot.why="принесли на прошлой неделе";
      lot.ru="сведения о вас";
      lot.note="ваш сектор "+lot.at.sx+":"+lot.at.sy+", записан чужой рукой";
      lot.price=Math.round(70+tier*26);
    }
    out.push(lot);
  }
  return out;
}
function fleaLot(id,sys){return fleaLots(sys).find(l=>l.id===id)||null;}
function fleaCredits(lot){return Math.max(1,Math.round(lot.price*FLEA_MARKUP));}
function fleaScrip(lot){return Math.max(1,lot.price);}
/* ── купить ──
   `pay` — "scrip" или "cr". Возвращает лот либо null: не хватило, лот уже ушёл
   или дома у станции нет (бонами тогда не платят). */
function fleaBuy(id,pay,sys){
  sys=sys||G.sys;
  const lot=fleaLot(id,sys);if(!lot)return null;
  const R=fleaRec();
  const H=typeof houseOf==="function"?houseOf(sys):null;
  if(pay==="scrip"){
    if(!H)return null;
    const n=fleaScrip(lot);
    if(scripHeld(H.id)<n)return null;
    G.scrip[H.id]=scripHeld(H.id)-n;
    logAdd("money","Блошинец: "+lot.ru+" за боны ×"+n);
  }else{
    const n=fleaCredits(lot);
    if(G.credits<n)return null;
    G.credits-=n;
    logAdd("money","Блошинец: "+lot.ru+" за "+n+" кр (чужие деньги дороже)");
  }
  R.got.push(lot.id);
  while(R.got.length>FLEA_GOT)R.got.shift();
  /* что именно куплено — по виду лота. Вещь всегда идёт вместе с адресом:
     в этом и смысл ряда. */
  if(lot.kind==="part"&&typeof addPart==="function"){
    addPart(lot.part);
    tell("tech","С блошинца: "+lot.ru+" ("+lot.who+")",
      lot.ru.toUpperCase()+"\n"+lot.why+"\n"+lot.note+
      "\n\nу вещи есть прошлое, и оно записано");
  }else if(lot.kind==="bird"&&typeof parrotFind==="function"){
    parrotFind(lot.seed,lot.who);
  }else if(lot.kind==="you"){
    tell("good","Сведения о вас сняты с прилавка",
      "СВЕДЕНИЯ О ВАС\n"+lot.note+"\n\nбольше их тут никто не купит");
  }else{
    tell("tech","С блошинца: адрес "+lot.at.sx+":"+lot.at.sy,
      "АДРЕС\n"+lot.why+"\n"+lot.note+"\n\nон лёг на карту");
  }
  /* адрес на карту кладут все лоты, кроме сведений о вас: у тех адрес — ваш */
  if(lot.kind!=="you"&&typeof loreMarks==="function")
    loreMarks().push({sx:lot.at.sx,sy:lot.at.sy,id:"flea:"+lot.id});
  if(typeof saveGame==="function")saveGame(true);
  return lot;
}
/* ── правило 4 ──
   Уходя, вы оставляете на прилавке то, что про вас записано. Его покупают. */
function fleaLeave(sys){
  sys=sys||G.sys;
  if(!fleaHere(sys))return false;
  const left=fleaLots(sys).find(l=>l.kind==="you");
  if(!left)return false;
  if(typeof huntMark==="function")huntMark({sx:left.at.sx,sy:left.at.sy},"лот с блошинца");
  logAdd("warn","Сведения о вас остались на прилавке блошинца — их купили");
  return true;
}
/* ── вкладка ──
   Живёт здесь, рядом со своей механикой: 26-ui-station и так просится на распил. */
function fleaRender(){
  const sys=G.sys,H=typeof houseOf==="function"?houseOf(sys):null;
  $body.appendChild(el("div","sec","РЯДЫ · ВСЁ ЗДЕСЬ ЧЬЁ-ТО · "+
    (H?("СЧЁТ В БОНАХ "+H.ru.toUpperCase()+" · КРЕДИТЫ ДОРОЖЕ НА "+
        Math.round((FLEA_MARKUP-1)*100)+"%"):"ХОЗЯИНА НЕТ · ТОЛЬКО КРЕДИТЫ")));
  const lots=fleaLots(sys);
  if(!lots.length){
    $body.appendChild(el("div","row","<div class='nm'><b>Ряды разобраны</b>"+
      "<s>всё, что тут лежало, уже у вас · новый привоз через час-другой</s></div>"));
    return;
  }
  for(const lot of lots){
    const cr=fleaCredits(lot),bn=fleaScrip(lot);
    const r=el("div","row");
    r.appendChild(el("div","nm","<b>"+lot.ru+"</b><s>"+lot.why+" · из вещей "+lot.who+
      "<br>провенанс: "+lot.note+"<br>"+bn+" бон · или "+cr+" кр</s>"));
    if(H){
      const b=el("button","act","ЗА БОНЫ "+bn);
      b.disabled=scripHeld(H.id)<bn;
      b.onclick=()=>{fleaBuy(lot.id,"scrip",sys);renderTab();};
      r.appendChild(b);
    }
    const b2=el("button","act gold","ЗА "+cr+" КР");
    b2.disabled=G.credits<cr;
    b2.onclick=()=>{fleaBuy(lot.id,"cr",sys);renderTab();};
    r.appendChild(b2);
    $body.appendChild(r);
  }
  $body.appendChild(el("div","sec","ПОЧЕМУ ЗДЕСЬ ДЁШЕВО"));
  $body.appendChild(el("div","row","<div class='nm'><b>Потому что это уже было чьё-то</b>"+
    "<s>прилавок торгует не вещами, а адресами: у каждой вещи записано, откуда она,<br>"+
    "и это место есть на карте · сведения о вас лежат тут же и уйдут без вас</s></div>"));
}
