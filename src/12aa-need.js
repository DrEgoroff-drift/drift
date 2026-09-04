/* ══════════════ нужда станции и наряд ══════════════
   M152e. Два ответа на «где заработать», которые читаются, а не фармятся.

   НУЖДА — советский дефицит. Раз в окно (три дня) у станции может кончиться
   один товар: цена на него ×2 — НА ОДИН ПРИВОЗ. Привёз — нужда закрыта до
   конца окна, второй рейс оплачивается обычно. Слышно по приёмнику, видно
   на ДОСКЕ; станция помнит (12k-rep), тетрадь ЛЮДИ получает строку.
   Нужда — расчёт от посева и окна, хранится только её закрытие (G.need).

   НАРЯД — один на станцию и один на руках: «отвезти N товара на такую-то
   станцию до такого-то дня · столько-то кр». Взял — второй не дадут, пока не
   закрыл; опоздал — наряд просто снят. Пишет план региона (11r) через посев
   и окно в два дня; во втором акте — циркуляр. Хранится только взятый (G.order).

   ПРАВИЛА ФАЙЛА:
   1. Ничего не сочиняется: товар — из цен станции, получатель — соседняя
      станция, цена — от рынка. Детерминизм по посеву: перезаход не перебирает.
   2. Никаких списков: одна нужда и один наряд на станцию, один наряд на руках. */
/* Окно было 3 «дня», а сутки — минута (CEL_DAY): нужда жила три минуты и
   перекатывалась прямо на глазах у пристыкованного — записал «Энтурикс · лёд»,
   поднял глаза, а там уже кристаллы (плейтест 30.08.2026). Цель обязана жить
   дольше, чем перелёт к ней: прыжок плюс подлёт — минут пять и больше. */
const NEED_WIN=15,NEED_P=.3,NEED_MUL=2;   /* замер 91zzw: при .42 нужда была у 44% станций — слишком буднично */
function needWin(){return Math.floor(celDay()/NEED_WIN);}
function needAll(){return (G.need||(G.need={}));}
function needOf(sys){
  if(!sys||!sys.station||!sys.station.prices)return null;
  const win=needWin();
  const r=rng(hashi(sys.sx,sys.sy,0x4EED+win));
  if(r()>=NEED_P)return null;
  const keys=TRADE_KEYS.filter(k=>sys.station.prices[k]);
  if(!keys.length)return null;
  const k=keys[Math.floor(r()*keys.length)];
  const closed=needAll()[sys.key];
  if(closed&&closed.win===win)return null;
  return {k,win,ru:RES[k].ru.toLowerCase()};
}
/* продажа закрывает нужду: одна строка в ЛЮДИ, станция помнит */
function needClose(sys,k){
  const N=needOf(sys);
  if(!N||N.k!==k)return false;
  needAll()[sys.key]={win:N.win,k,t:Date.now()};
  if(typeof recordAdd==="function")recordAdd(sys.station.name,"благодарность: привёз "+N.ru+", когда не было");
  if(typeof repAdd==="function")repAdd(2,sys);
  if(typeof peopleLine==="function")peopleLine("привезли "+N.ru+", когда "+(RES[k].ru.endsWith("ы")?"их":"её")+" не было. Это помнят.",sys.station.name,true);
  sfx("ok",{v:.4});
  return true;
}
/* станции с нуждой в радиусе — для доски и эфира */
function needsNear(rad){
  rad=rad||7;const out=[];
  for(let x=G.sx-rad;x<=G.sx+rad;x++)for(let y=G.sy-rad;y<=G.sy+rad;y++){
    if(!starAt(x,y))continue;
    const S=getSystem(x,y);if(!S||!S.station)continue;
    const N=needOf(S);if(N)out.push({sys:S,need:N,d:Math.max(Math.abs(x-G.sx),Math.abs(y-G.sy))});
  }
  out.sort((a,b)=>a.d-b.d);
  return out;
}
/* строка в эфир (11b): раз из нескольких — о нужде поблизости, иногда с ошибкой,
   как и слухи (11t): 15% — не тот товар */
function needEtherLine(r){
  if(r()>.3)return null;
  const L=needsNear(6);if(!L.length)return null;
  const n=L[Math.floor(r()*L.length)];
  let ru=n.need.ru;
  if(r()<.15){const k=pick(TRADE_KEYS,r);ru=RES[k].ru.toLowerCase();}
  return pick(["…"+n.sys.station.name+": кончилось — "+ru+". Кто привезёт — берут вдвое.",
               "…передайте по цепочке: на "+n.sys.station.name+" нет "+ru+".",
               "…"+n.sys.station.name+" просит "+ru+". Срочно, говорят."],r);
}
/* ── наряд ── (окно расширено той же правкой, что у нужды: два «дня» — это две
   минуты, наряд через полкарты за такой срок не возится) */
const ORDER_WIN=6;
function orderWin(){return Math.floor(celDay()/ORDER_WIN);}
function orderOf(sys){
  if(!sys||!sys.station||!sys.station.prices)return null;
  const win=orderWin();
  const r=rng(hashi(sys.sx,sys.sy,0x0A9D+win));
  const artel=(typeof holdArtel==="function")&&holdArtel(sys);   /* Артель (G5): наряд есть всегда и платит больше */
  if(r()>.6&&!artel)return null;
  /* получатель — станция в радиусе 2–8, не эта */
  let to=null;
  for(let i=0;i<24&&!to;i++){
    const dx=Math.round((r()-.5)*16),dy=Math.round((r()-.5)*16);
    if(Math.max(Math.abs(dx),Math.abs(dy))<2)continue;
    const x=sys.sx+dx,y=sys.sy+dy;
    if(!starAt(x,y))continue;
    const S=getSystem(x,y);if(S&&S.station&&S.station.prices)to=S;
  }
  if(!to)return null;
  const keys=TRADE_KEYS.filter(k=>sys.station.prices[k]&&to.station.prices[k]);
  if(!keys.length)return null;
  const k=keys[Math.floor(r()*keys.length)];
  const qty=10+Math.floor(r()*5)*5;                    /* 10–30 */
  const d=Math.max(Math.abs(to.sx-sys.sx),Math.abs(to.sy-sys.sy));
  const pay=Math.round((qty*RES[k].price*1.5+d*120)*(artel?1.25:1)/10)*10;
  const due=(win+1)*ORDER_WIN+2;                        /* до конца окна плюс два дня */
  return {key:sys.key,from:sys.station.name,k,ru:RES[k].ru.toLowerCase(),qty,to:{sx:to.sx,sy:to.sy,name:to.station.name},pay,due,win};
}
function orderTake(sys){
  if(G.order)return false;
  const O=orderOf(sys);if(!O)return false;
  G.order=O;
  tell("tech","Наряд взят: "+O.qty+" "+O.ru+" → "+O.to.name+" до "+O.due+"-го · "+O.pay+" кр",
       "НАРЯД\n"+O.qty+" "+O.ru+" → "+O.to.name);
  if(typeof thingAdd==="function")thingAdd("paper","Наряд · "+O.from,O.qty+" "+O.ru+" → "+O.to.name+" до "+O.due+"-го · "+O.pay+" кр");
  return true;
}
function orderHere(){
  const O=G.order;if(!O||!G.sys)return null;
  return (G.sys.sx===O.to.sx&&G.sys.sy===O.to.sy)?O:null;
}
function orderDeliver(){
  const O=orderHere();if(!O)return false;
  if((G.cargo[O.k]||0)<O.qty)return false;
  G.cargo[O.k]-=O.qty;
  earn(O.pay,"order");
  G.order=null;
  tell("money","Наряд закрыт: "+O.pay+" кр · "+O.to.name,"НАРЯД ЗАКРЫТ\n+"+O.pay+" кр");
  if(typeof repAdd==="function")repAdd(1,G.sys);
  if(typeof peopleLine==="function")peopleLine("наряд принят, "+O.qty+" "+O.ru+". Спасибо, что в срок.",O.to.name);
  if(typeof recordAdd==="function")recordAdd(O.to.name,"благодарность за наряд");
  return true;
}
/* срок вышел — наряд снимается без штрафа, просто строкой */
function orderTick(){
  const O=G.order;if(!O)return;
  if(celDay()>O.due){
    G.order=null;
    logAdd("warn","Наряд "+O.from+" снят: срок вышел");
  }
}
/* блок доски (26): нужда здесь и рядом, наряд здесь */
function needBlock(){
  if(!G.sys||!G.sys.station)return;
  const N=needOf(G.sys);
  const near=needsNear(7).filter(n=>n.sys!==G.sys).slice(0,3);
  if(N||near.length){
    $body.appendChild(el("div","sec","НУЖДА · ПРИВОЗ ВДВОЕ, ОДИН РАЗ"));
    if(N)$body.appendChild(el("div","row","<div class='nm'><b>Здесь кончилось: "+N.ru+"</b><s>берут "+marketFor(G.sys)[N.k]+" кр за единицу — пока не привезут</s></div>"));
    for(const n of near)$body.appendChild(el("div","row","<div class='nm'><b>"+n.sys.station.name+" · "+n.need.ru+"</b><s>"+n.d+" "+pl3(n.d,"прыжок","прыжка","прыжков")+" · сектор "+n.sys.sx+":"+n.sys.sy+"</s></div>"));
  }
  const O=orderOf(G.sys),H=orderHere();
  if(H){
    const can=(G.cargo[H.k]||0)>=H.qty;
    const r=el("div","row","<div class='nm'><b>Сдать наряд: "+H.qty+" "+H.ru+"</b><s>в трюме "+(G.cargo[H.k]||0)+" · "+H.pay+" кр</s></div>");
    const b=el("button","act sm gold","СДАТЬ · "+H.pay+" кр");b.disabled=!can;
    b.onclick=()=>{if(orderDeliver())renderTab();};
    r.appendChild(b);$body.appendChild(el("div","sec","НАРЯД · ПРИЁМ"));$body.appendChild(r);
  }
  if(O){
    $body.appendChild(el("div","sec","НАРЯД · ОДИН НА СТАНЦИЮ"));
    const r=el("div","row","<div class='nm'><b>"+O.qty+" "+O.ru+" → "+O.to.name+"</b><s>сектор "+O.to.sx+":"+O.to.sy+" · до "+O.due+"-го дня · "+O.pay+" кр"+
      (G.order?"<br>на руках уже есть наряд — сначала закройте его":"")+"</s></div>");
    const b=el("button","act sm","ВЗЯТЬ");b.disabled=!!G.order;
    b.onclick=()=>{if(orderTake(G.sys))renderTab();};
    r.appendChild(b);$body.appendChild(r);
  }else if(G.order){
    $body.appendChild(el("div","sec","НАРЯД НА РУКАХ"));
    $body.appendChild(el("div","row","<div class='nm'><b>"+G.order.qty+" "+G.order.ru+" → "+G.order.to.name+"</b><s>до "+G.order.due+"-го дня · "+G.order.pay+" кр</s></div>"));
  }
}
/* ── находки на доске: сдать институту за четверть или продать с рук ── */
function findsBlock(){
  const L=(typeof thingsAll==="function")?thingsAll().filter(t=>t.k==="find"&&!t.gone):[];
  if(!L.length||!G.st)return;
  const bazaar=G.st.stype==="bazaar";
  $body.appendChild(el("div","sec","НАХОДКИ · ИНСТИТУТУ — ЧЕТВЕРТЬ И ЗАПИСЬ · С РУК — ВСЁ, НО ЧУЖОЕ"));
  L.forEach(t=>{
    const r=el("div","row","<div class='nm'><b>"+t.ru+"</b><s>"+t.note+"</s></div>");
    const b1=el("button","act sm","СДАТЬ · "+Math.round(t.val/4)+" кр");
    b1.onclick=()=>{
      t.gone=1;earn(Math.round(t.val/4),"handin");
      tell("money","Находка сдана институту: "+t.ru+" · "+Math.round(t.val/4)+" кр","СДАНО ИНСТИТУТУ\n+"+Math.round(t.val/4)+" кр");
      if(typeof repAdd==="function")repAdd(1,G.sys);
      if(typeof recordAdd==="function")recordAdd("институт","сдана находка: "+t.ru.toLowerCase());
      thingsAll().splice(thingsAll().indexOf(t),1);renderTab();
    };
    r.appendChild(b1);
    if(bazaar){
      const b2=el("button","act sm gold","С РУК · "+t.val+" кр");
      b2.onclick=()=>{
        t.gone=1;earn(t.val,"flea");
        tell("money","Продано с рук: "+t.ru+" · "+t.val+" кр","С РУК\n+"+t.val+" кр");
        thingsAll().splice(thingsAll().indexOf(t),1);renderTab();
      };
      r.appendChild(b2);
    }
    $body.appendChild(r);
  });
}
/* ── цены на бумаге: последнее виденное по станциям, на столе (ЦЕНЫ) ── */
function pricesSeen(sys){
  if(!sys||!sys.station||!sys.station.prices)return;
  G.seenPrices=G.seenPrices||{};
  const P=marketFor(sys),N=needOf(sys);
  G.seenPrices[sys.key]={name:sys.station.name,sx:sys.sx,sy:sys.sy,day:celDay(),p:Object.assign({},P),need:N?N.k:null};
  pricesTrim();
}
/* бумага держит 24 станции; плечо действующего маршрута с неё не вытесняется —
   иначе «посмотрел ещё ценники — маршрут потерял цену» (M289, F18) */
function pricesTrim(){
  const keys=Object.keys(G.seenPrices);
  if(keys.length<=24)return;
  const legs=(typeof routeOf==="function")?routeOf().legs:[];
  const old=keys.filter(k=>legs.indexOf(k)<0).sort((a,b)=>G.seenPrices[a].day-G.seenPrices[b].day);
  if(old.length)delete G.seenPrices[old[0]];
}
/* ── и цены СО СЛУХА (плейтест, пункт 5, вторая половина) ──
   На диапазоне ЦЕНЫ приёмник называет ближнюю станцию и её лучший товар —
   живая биржа, в полёте, без всякой стыковки. И до сих пор услышать её можно
   было только ушами: на бумагу не ложилось ничего, курс проложить было не по
   чему, и мотор игры по-прежнему заводился только внутри станции.

   Записывается ровно то, что СКАЗАЛИ, — один товар и топливо, а не весь
   прейскурант: подслушанное не равно виденному. Строка помечена `heard`, и на
   бумаге она так и выглядит; стыковка на том же месте перепишет её полной.
   Нужду по эфиру не передают, и выдумывать её тут нельзя.

   Раз в сутки на станцию: ручка стоит на диапазоне сколько угодно, а новость
   у биржи одна. Без этого запись переписывалась бы каждый тик. */
function pricesHeard(sys,res,val,fuel){
  if(!sys||!sys.station||!RES[res])return null;
  G.seenPrices=G.seenPrices||{};
  const was=G.seenPrices[sys.key];
  /* виденное своими глазами сильнее услышанного и не затирается */
  if(was&&!was.heard)return null;
  if(was&&was.heard&&was.day===celDay())return null;
  const p={};p[res]=val|0;
  G.seenPrices[sys.key]={name:sys.station.name,sx:sys.sx,sy:sys.sy,day:celDay(),
                         p,need:null,heard:1,fuel:fuel|0};
  pricesTrim();
  return G.seenPrices[sys.key];
}
/* ── лучшее по товару: виденное сильнее слышанного ──
   Одна услышанная цифра не перебивает прейскурант, снятый на месте: сперва
   ищем среди виденных, и только если товара не видели нигде — среди слухов.
   Возвращает {val, s:запись, heard} или null. Читают кучи ОПИСИ и карта. */
function priceBestOf(k){
  const S=G.seenPrices||{};let b=null,h=null;
  for(const key in S){
    const s=S[key];if(!s||!s.p||!s.p[k])continue;
    if(s.heard){if(!h||s.p[k]>h.p[k])h=s;}
    else if(!b||s.p[k]>b.p[k])b=s;
  }
  const s=b||h;if(!s)return null;
  return {val:s.p[k],s,heard:!b};
}
function pricesCount(){return Object.keys(G.seenPrices||{}).length;}
/* ── список виденных цен (M341) ──
   Бумага НАКЛАДНАЯ ушла со стола: цена показывается там, где принимают
   решение, — подписью под кучей в ОПИСИ и на карточке станции на карте. Этот
   список — для тех, кто сравнивал в таблице: кнопка ЦЕНЫ на правом борту карты.
   Строка — курс туда, тот же жест, что у дел. */
function renderPrices(box){
  box.textContent="";
  const S=G.seenPrices||{};
  const L=Object.keys(S).map(k=>S[k]).sort((a,b)=>b.day-a.day);
  if(!L.length){box.appendChild(el("div","row","<div class='nm'><s>цен ещё не видели: они записываются при каждой стыковке и со слуха с приёмника</s></div>"));return;}
  box.appendChild(el("div","sec","ДЕНЬ "+celDay()+" · ЖИРНЫМ — ЛУЧШАЯ ПО ТОВАРУ · СВЕТЛЫМ — ТО, ЧТО В ТРЮМЕ"));
  const best={};
  for(const k of TRADE_KEYS){const b=priceBestOf(k);if(b&&!b.heard)best[k]=b.s;}
  for(const s of L){
    const cells=TRADE_KEYS.filter(k=>s.p[k]).map(k=>{
      const hot=(G.cargo[k]|0)>0,top=best[k]===s;
      return (top?"<b>":"")+"<span"+(hot?" class='hot'":"")+">"+RES[k].ru.toLowerCase()+" "+s.p[k]+"</span>"+(top?"</b>":"");
    });
    const r=el("div","row");
    r.appendChild(el("div","nm","<b>"+s.name+" · "+s.sx+":"+s.sy+"</b><s>день "+s.day+
      (s.heard?" · <i style='color:#9fb3c2'>со слуха</i>":"")+
      (s.need?" · <b style='color:#f2b25c'>нужда: "+RES[s.need].ru.toLowerCase()+"</b>":"")+
      "<br>"+cells.join(" · ")+(s.heard&&s.fuel?" · топливо "+s.fuel:"")+"</s>"));
    if(typeof gotoSector==="function"&&s.sx!==undefined){
      const b=el("button","act sm","КУРС");
      const go=()=>{pricesClose();gotoSector(s.sx,s.sy,s.need?("нужда: "+RES[s.need].ru.toLowerCase()):null);};
      b.onclick=e=>{e.stopPropagation();go();};
      r.appendChild(b);
      r.style.cursor="pointer";r.onclick=go;
    }
    box.appendChild(r);
  }
}
function pricesOpen(){
  const w=document.getElementById("pricewin");if(!w)return;
  const cr=document.getElementById("prCr"),dy=document.getElementById("prDay");
  if(cr)cr.textContent=Math.round(G.credits).toLocaleString("ru")+" кр";
  if(dy)dy.textContent="станций: "+pricesCount();
  renderPrices(document.getElementById("prBody"));
  w.classList.add("open");
}
function pricesClose(){const w=document.getElementById("pricewin");if(w)w.classList.remove("open");}
(function pricesWire(){
  const b=document.getElementById("pricesbtn"),x=document.getElementById("prClose");
  if(b)b.addEventListener("click",()=>{if(typeof sfx==="function")sfx("ui");pricesOpen();});
  if(x)x.addEventListener("click",pricesClose);
})();
/* ── цены на карточке карты (M341) ──
   Строки цен для карточки: ячейки «титан 41» по ширине карточки;
   hot — этот товар в трюме, best — лучшая из виденных по товару, mark —
   пометка (со слуха, нужда). Считается только для выбранной станции. */
function mapPriceRows(s,maxW){
  let pr=(G.seenPrices||{})[s.key];
  /* список цен («Сорока»): станции в трёх прыжках показывают прейскурант, даже не виденные */
  if((!pr||!pr.p)&&s.station&&s.station.prices&&typeof wanderHas==="function"&&wanderHas("pricelist")&&
     Math.hypot(s.sx-G.sx,s.sy-G.sy)<=3*Math.max(.5,stat().jump))pr={p:s.station.prices,list:1};
  if(!pr||!pr.p)return [];
  const cells=[];
  if(pr.list)cells.push({t:"по списку",mark:1});
  if(pr.heard)cells.push({t:"со слуха",mark:1});
  if(pr.need&&RES[pr.need])cells.push({t:"нужда: "+RES[pr.need].ru.toLowerCase(),mark:1});
  for(const k of TRADE_KEYS){
    if(!pr.p[k])continue;
    const b=(typeof priceBestOf==="function")?priceBestOf(k):null;
    cells.push({t:RES[k].ru.toLowerCase()+" "+pr.p[k],hot:(G.cargo[k]|0)>0,best:!!b&&!b.heard&&b.s===pr});
  }
  ctx.font="9px ui-monospace,monospace";
  const sep=ctx.measureText(" · ").width,rows=[];let row=[],w=0;
  for(const c of cells){
    const cw=ctx.measureText(c.t).width;
    if(row.length&&w+sep+cw>maxW){rows.push(row);row=[];w=0;}
    row.push(c);w+=(row.length>1?sep:0)+cw;
  }
  if(row.length)rows.push(row);
  return rows;
}
function mapPriceDraw(PR,x0,y0){
  const sep=ctx.measureText(" · ").width;
  PR.forEach((row,ri)=>{
    let x=x0;const y=y0+ri*11;
    row.forEach(cell=>{
      ctx.font=(cell.best?"bold ":"")+"9px ui-monospace,monospace";
      ctx.fillStyle=cell.hot?"#f2b25c":(cell.mark?"rgba(255,150,135,.85)":"rgba(160,182,192,.62)");
      ctx.fillText(cell.t,x,y);x+=ctx.measureText(cell.t).width+sep;
    });
  });
  ctx.font="9px ui-monospace,monospace";
}
