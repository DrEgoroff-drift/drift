/* ══════════════ лавка «Сороки»: три прилавка и полка инструментов (M343) ══════════════
   Что продаёт борт, где платят спичками (docs/DESIGN-wanderer.md §6, §11–§13):
   А — бумаги за кредиты (корабль продаёт адреса, металл прилагается);
   Б — спички: инструменты с малыми эффектами, и сам борт ПОКУПАЕТ за спички
       редкое сырьё, которое больше никто не берёт (40 единиц → 1, техкомпоненты
       20 → 1, не больше 200 единиц за стоянку), и платит четыре за показанную
       редкость — один раз за каждую, редкость остаётся у вас;
   В — обмен: один дикий лот на стоянку с простой просьбой словами, не рецептом.

   Полка на стоянку — восемь мест, товар сеян от эпохи (12v): у всех, кто пришёл
   на эту стоянку, одна и та же полка; купленное уходит из этого сейва навсегда,
   а пустая витрина остаётся с меловой биркой — дыра и есть память.

   ИНСТРУМЕНТЫ РАБОТАЮТ ТОЛЬКО С ПОЛКИ КАБИНЫ — шести мест на ОПИСИ (27j-ui-opis);
   остальное лежит в трюме и ждёт своей очереди. Каждый эффект мал, ни один не в
   кредитах, и у каждого есть кто-то, кто его читает (`wanderHas(id)` в модуле из
   `hook`): вещь без кода — ложь, и набор сторожит это по тексту исходников.

   ПРАВИЛА ФАЙЛА:
   1. Каталог — плоская таблица с ru/note/pay/fam/hook; цены в §11 указательные.
   2. Хранится в G.wander: got (купленные id), gave (показанные редкости), shelf и
      hold (id инструментов), soldE/soldN (сырьё за стоянку), chit. Ничего сеяного.
   3. Спички не уходят в минус (12uc); кредиты — как везде. */
const WANDER_SHELF=6;                     /* мест на полке кабины */
const WANDER_RAW_CAP=200;                 /* единиц сырья за стоянку */
const WANDER_RAW={volatiles:40,icecrys:40,alloy:40,techcomp:20};
const WANDER_CAT=[
  /* — инструменты (спички): работают с полки, читаются через wanderHas(id) — */
  {id:"sextant", fam:"tool",ru:"Секстант Долгого Хода",   note:"с борта, который дошёл; второго такого не было",
   fx:"прыжок +1 пк в опасных системах", pay:{m:30}, hook:"08-state"},
  {id:"pencil",  fam:"tool",ru:"Штурманский карандаш",    note:"стёрт до половины; хозяйка мерила им слухи",
   fx:"разброс слухов на сектор уже", pay:{m:14}, hook:"11t-rumours"},
  {id:"gyro",    fam:"tool",ru:"Гирокомпас без номера",   note:"снят с гондолы при ремонте; номер стёрли мы",
   fx:"поворот +5 %", pay:{m:16}, hook:"08-state"},
  {id:"blanket", fam:"tool",ru:"Термоодеяло разведчика",  note:"ткань наших парусов, лоскут",
   fx:"орудие остывает на 6 % быстрее", pay:{m:12}, hook:"08-state"},
  {id:"valve",   fam:"tool",ru:"Клапан старой заправки",  note:"с последней станции, где ещё лили топливо",
   fx:"бак +7", pay:{m:18}, hook:"08-state"},
  {id:"needle",  fam:"tool",ru:"Парусная игла",           note:"ей шили гроты; шьёт и корпус",
   fx:"корпус срастается в полёте, 1 в минуту, не в бою", pay:{m:24}, hook:"12v-wander-shop"},
  {id:"bell",    fam:"tool",ru:"Колокол вахты",           note:"звонил при каждой новой точке в каталоге",
   fx:"небесная вахта видит на сектор дальше", pay:{m:20}, hook:"11ak-skywatch"},
  {id:"notebook",fam:"tool",ru:"Тетрадь ветра",           note:"здесь записано, когда мы уходим",
   fx:"в строке места — когда «Сорока» уйдёт", pay:{m:10}, hook:"27z-telemetry"},
  {id:"sign",    fam:"tool",ru:"Табличка «НЕ КУПЛЕНО»",   note:"вешали на трюм, чтоб не спрашивали",
   fx:"сведения о вас с блошинца никому не продают", pay:{m:28}, hook:"12ua-flea"},
  {id:"hand",    fam:"tool",ru:"Мастерская рука",         note:"перчатка механика, который всё делал сам",
   fx:"налёт на корпус ложится на треть медленнее", pay:{m:22}, hook:"12s-wear"},
  {id:"trumpet", fam:"tool",ru:"Слуховая трубка",         note:"через неё слушали стойку, не подходя",
   fx:"приёмник в полёте чаще ловит слухи", pay:{m:18}, hook:"11t-rumours"},
  {id:"key",     fam:"tool",ru:"Ключ причала",            note:"диспетчер отдал, когда закрывали причал",
   fx:"стыковка с любой точки системы", pay:{m:34}, hook:"17-mode-system"},
  {id:"pricelist",fam:"tool",ru:"Список цен",             note:"переписан с трёх бирж за одну ночь",
   fx:"на карте — цены станций в трёх прыжках, даже не виденных", pay:{m:26}, hook:"12aa-need"},
  {id:"shelfwide",fam:"tool",ru:"Полка шире",             note:"снята с нашей же стенки; нам она узка не была",
   fx:"полка комплекта держит 18 вещей вместо 12", pay:{m:15}, hook:"12x-suit"},
  /* — бумаги (кредиты): адрес и вещь при нём — */
  {id:"area",    fam:"paper",ru:"Карта области",          note:"снята с чужой руки; названия наши",
   fx:"засечки на девять секторов вокруг далёкой станции", pay:{cr:900}, hook:"12v-wander-shop"},
  {id:"book",    fam:"paper",ru:"Книга, которой у вас нет",note:"из ящика, где книги лежат корешками внутрь",
   fx:"на полку дома ложится том, которого там не было", pay:{cr:700}, hook:"12v-wander-shop"},
  /* — обмен (один на стоянку): просьба словами — */
  {id:"wild",    fam:"wild",ru:"Свёрток под сукном",      note:"«мы были там, где вы не были»",
   fx:"артефакт, которого у вас нет, а если их уже три — редкость из сотни", pay:{ask:"любая часть не ниже отменной"}, hook:"12v-wander-shop"}
];
const WANDER_BY_ID={};WANDER_CAT.forEach(c=>WANDER_BY_ID[c.id]=c);
function wanderStore(){
  const w=wanderRec();
  if(!Array.isArray(w.shelf))w.shelf=[];
  if(!Array.isArray(w.hold))w.hold=[];
  w.soldE=w.soldE|0;w.soldN=w.soldN|0;
  return w;
}
/* инструмент работает, только если лежит на полке кабины */
function wanderHas(id){const w=G.wander;return !!(w&&Array.isArray(w.shelf)&&w.shelf.indexOf(id)>=0);}
function wanderOwns(id){const w=wanderStore();return w.shelf.indexOf(id)>=0||w.hold.indexOf(id)>=0;}
function wanderToShelf(id){
  const w=wanderStore();if(w.shelf.indexOf(id)>=0)return true;
  if(w.shelf.length>=WANDER_SHELF)return false;
  const i=w.hold.indexOf(id);if(i<0)return false;
  w.hold.splice(i,1);w.shelf.push(id);return true;
}
function wanderToHold(id){
  const w=wanderStore();const i=w.shelf.indexOf(id);if(i<0)return false;
  w.shelf.splice(i,1);w.hold.push(id);return true;
}
/* что читает stat(): один объект, дёшево */
function wanderStat(){
  const o={turn:1,fuel:0,jump:0,cool:1};
  if(!G.wander||!G.wander.shelf||!G.wander.shelf.length)return o;
  if(wanderHas("gyro"))o.turn=1.05;
  if(wanderHas("valve"))o.fuel=7;
  if(wanderHas("blanket"))o.cool=.94;
  if(wanderHas("sextant")&&sysDanger(G.sx,G.sy)>.5)o.jump=1;
  return o;
}
/* парусная игла: корпус срастается в полёте, не в бою */
let wanderNeedleAcc=0;
function wanderTick(dt){
  if(!wanderHas("needle")||G.mode!=="system")return;
  if((G.pirates||[]).some(p=>p.aware))return;
  wanderNeedleAcc+=dt;
  if(wanderNeedleAcc<3600)return;          /* кадров в минуте */
  wanderNeedleAcc=0;
  const st=stat();if(G.hull<st.hullMax)G.hull=Math.min(st.hullMax,G.hull+1);
}
/* ── полка стоянки: восемь мест, сеяно от эпохи; купленное — меловая бирка ── */
function wanderLots(w){
  w=w||wanderAt();
  const R=wanderStore(),r=rng(hashi(w.epoch|0,0x50A0,0x1075));
  const n=w.dark?4:8;
  const tools=WANDER_CAT.filter(c=>c.fam==="tool");
  for(let i=tools.length-1;i>0;i--){const j=Math.floor(r()*(i+1));const t=tools[i];tools[i]=tools[j];tools[j]=t;}
  const plan=w.dark?["tool","tool","paper","wild"]:["tool","tool","tool","tool","tool","paper","paper","wild"];
  const out=[];let ti=0,pi=0;
  const papers=WANDER_CAT.filter(c=>c.fam==="paper");
  if(r()<.5)papers.reverse();
  for(let i=0;i<n;i++){
    const fam=plan[i];let cat=null,id=null;
    if(fam==="tool"){cat=tools[ti++]||null;id=cat?cat.id:null;}
    else if(fam==="paper"){cat=papers[pi++%papers.length];id=cat.id+"@"+w.epoch;}
    else{cat=WANDER_BY_ID.wild;id="wild@"+w.epoch;}
    if(!cat){out.push({i,empty:true,ru:"пусто",chalk:"здесь ничего не лежало"});continue;}
    const gone=R.got.indexOf(id)>=0||(fam==="tool"&&wanderOwns(id));
    out.push({i,id,cat,fam,ru:cat.ru,note:cat.note,fx:cat.fx,pay:cat.pay,gone,
      chalk:gone?"продано · «"+cat.ru+"»":null});
  }
  return out;
}
function wanderPriceRu(cat){
  if(cat.pay.m)return matchesRu(cat.pay.m);
  if(cat.pay.cr)return cat.pay.cr.toLocaleString("ru")+" кр";
  return "хочет: "+cat.pay.ask;
}
/* что скажет хранитель, если купить сейчас: null — можно, строка — почему нет */
function wanderCant(lot){
  if(!lot||lot.empty||lot.gone)return "этого тут больше нет";
  if(lot.pay.m&&matchesRec()<lot.pay.m)return "не хватает спичек: "+matchesRu(lot.pay.m)+", у вас "+matchesRec();
  if(lot.pay.cr&&G.credits<lot.pay.cr)return "не хватает кредитов";
  if(lot.pay.ask&&!wanderAskPart())return "нет части не ниже отменной среди снятых";
  if(lot.id==="book"&&typeof bookCount==="function"&&bookCount()>=BOOKS.length)return "все сорок у вас уже есть";
  return null;
}
function wanderAskPart(){return (G.inv||[]).find(p=>!isFitted(p.id)&&(p.tier|0)>=4)||null;}
/* купить: спички, кредиты или обмен; вещь ложится куда ей положено */
function wanderBuy(lot){
  const why=wanderCant(lot);if(why){say(why);return false;}
  const R=wanderStore(),cat=lot.cat;
  if(cat.pay.m){if(!matchesSpend(cat.pay.m))return false;}
  else if(cat.pay.cr){G.credits-=cat.pay.cr;}
  else{const p=wanderAskPart();G.inv.splice(G.inv.indexOf(p),1);
    logAdd("money","«Сорока»: отдана часть «"+p.name+"» — свёрток под сукном ваш");}
  R.got.push(lot.id);
  while(R.got.length>120)R.got.shift();
  if(cat.fam==="tool"){
    if(R.shelf.length<WANDER_SHELF)R.shelf.push(cat.id);else R.hold.push(cat.id);
    tell("tech","С «Сороки»: "+cat.ru+" · "+cat.fx,cat.ru.toUpperCase()+"\n"+cat.note+"\n"+cat.fx+
      (R.shelf.indexOf(cat.id)>=0?"\n\nлежит на полке кабины — работает":"\n\nполка полна: лежит в трюме, работать будет с полки"));
  }else if(cat.id==="area")wanderAreaChart(lot);
  else if(cat.id==="book"){
    const b=(typeof bookFind==="function")?bookFind(hashi(lot.id.length,R.got.length,0xB00C),"куплена на «Сороке»"):null;
    tell("good","С «Сороки»: книга"+(b?" «"+b.ru+"»":""),"КНИГА\n"+(b?b.ru+"\n":"")+"на полку дома");
  }else wanderWildGrant(lot);
  if(typeof sfx==="function")sfx("ok");
  if(typeof saveGame==="function")saveGame(true);
  return true;
}
/* карта области: девять засечек вокруг далёкой станции — адреса, не маркеры */
function wanderAreaChart(lot){
  const r=rng(hashi(lot.id.length*7,G.wander.got.length,0xA2EA));
  let best=null;
  for(let t=0;t<60&&!best;t++){
    const a=r()*TAU,d=6+r()*8,sx=Math.round(G.sx+Math.cos(a)*d),sy=Math.round(G.sy+Math.sin(a)*d);
    if(starAt(sx,sy)&&getSystem(sx,sy).station)best={sx,sy};
  }
  if(!best)best={sx:G.sx+7,sy:G.sy};
  if(typeof loreMarks==="function")for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)
    if(starAt(best.sx+dx,best.sy+dy))loreMarks().push({sx:best.sx+dx,sy:best.sy+dy,id:"wander:"+lot.id+":"+dx+":"+dy});
  const nm=getSystem(best.sx,best.sy).name;
  tell("tech","С «Сороки»: карта области у «"+nm+"» · сектор "+best.sx+":"+best.sy,
    "КАРТА ОБЛАСТИ\nдевять секторов вокруг «"+nm+"»\nсектор "+best.sx+":"+best.sy+"\n\nзасечки легли на карту");
}
/* свёрток под сукном: артефакт, которого нет, пока их меньше трёх; иначе редкость из сотни */
function wanderWildGrant(lot){
  const owned=(typeof relicOwned==="function")?relicOwned():[];
  if(owned.length<3&&typeof RELIC_KEYS!=="undefined"){
    const lack=RELIC_KEYS.filter(k=>!relicHave(k));
    if(lack.length){const id=lack[hashi(lot.id.length,lack.length,0x2E1C)%lack.length];
      if(relicFind(id,"обмен на «Сороке»"))return true;}
  }
  const lack=RARE.filter(R=>!rareHas(R.id));
  if(!lack.length){tell("dim","Свёрток пуст: у вас уже всё","СВЁРТОК\nпусто: сотня собрана");return false;}
  const R=lack[hashi(lot.id.length,lack.length,0x2E1D)%lack.length];
  rareList().push(R.id);
  tell("tech","Редкость с «Сороки»: «"+R.ru+"» · "+rareCount()+"/100",
    "«"+R.ru+"»\n"+R.grade+", "+R.note+"\nиз свёртка «Сороки»: они были там, где вы не были\nэффект: "+R.fx.ru);
  logAdd("tech","Редкость «"+R.ru+"» — обмен на «Сороке» · "+rareCount()+"/100");
  return true;
}
/* ── прилавок Б: сырьё за спички, редкость показать ── */
function wanderRawLeft(w){
  w=w||wanderAt();const R=wanderStore();
  if(R.soldE!==w.epoch)return WANDER_RAW_CAP;
  return Math.max(0,WANDER_RAW_CAP-R.soldN);
}
/* сколько спичек дадут за всё это сырьё сейчас */
function wanderRawQuote(k,n){
  const per=WANDER_RAW[k];if(!per)return 0;
  return Math.floor(n/per);
}
function wanderSellRaw(k){
  const per=WANDER_RAW[k];if(!per)return 0;
  const w=wanderAt(),R=wanderStore();
  if(R.soldE!==w.epoch){R.soldE=w.epoch;R.soldN=0;}
  const have=G.cargo[k]|0,cap=wanderRawLeft(w);
  const units=Math.min(have,cap)-(Math.min(have,cap)%per);
  const m=units/per;
  if(m<=0){say(have<per?"Меньше "+per+" — не берём: спичка целая, доли нет":"Хватит на эту стоянку: мы тоже считаем коробок");return 0;}
  G.cargo[k]-=units;R.soldN+=units;matchesAdd(m);
  tell("money","«Сорока»: "+RES[k].ru.toLowerCase()+" ×"+units+" → "+matchesRu(m),
    RES[k].ru.toUpperCase()+" ×"+units+"\n→ "+matchesRu(m)+"\n«Кладу из своего коробка, помните это.»");
  if(typeof sfx==="function")sfx("ok");
  return m;
}
function wanderShowables(){
  const R=wanderStore();
  return rareList().filter(id=>R.gave.indexOf(id)<0).map(id=>RARE_BY_ID[id]).filter(Boolean);
}
function wanderShowRare(id){
  const R=wanderStore();
  if(!rareHas(id)||R.gave.indexOf(id)>=0)return false;
  R.gave.push(id);matchesAdd(4);
  const Rr=RARE_BY_ID[id];
  tell("money","«Сорока»: показана «"+(Rr?Rr.ru:id)+"» → 4 спички",
    "«"+(Rr?Rr.ru:id)+"»\nсписали в свой журнал · 4 спички\nвещь остаётся у вас");
  if(typeof sfx==="function")sfx("ok");
  return true;
}
/* ── строки хранителя (§13, дословно) ── */
const WANDER_LINES={
  hello:"Спички считаем целыми. Чиркнутая уже не спичка, а история.",
  idle:["Огня в космосе нет уже сто лет. Есть только то, что положили внутрь до нас.",
        "За гондолу шестьдесят. Не торгуюсь, у меня их тоже не делают.",
        "Летучих на двадцать спичек. Кладу из своего коробка, помните это."],
  leave1:"Сейчас узнаем, куда ветер.",leave2:"Туда."
};
/* «уходит через …» — для тетради ветра и шапки комнаты */
function wanderLeftRu(w){
  w=w||wanderAt();
  const ms=w.tLeft,h=Math.floor(ms/3600e3),m=Math.floor(ms%3600e3/60000);
  if(w.phase!=="stop")return "в пути · придёт через "+(h?h+" ч ":"")+m+" мин";
  if(h>=24){const d=Math.floor(h/24);return "уходит через "+d+" "+pl3(d,"день","дня","дней")+" "+(h%24)+" ч";}
  return "уходит через "+(h?h+" ч ":"")+m+" мин";
}
