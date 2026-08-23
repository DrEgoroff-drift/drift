/* ══════════════ станция ══════════════ */
const $st=document.getElementById("station"),$body=document.getElementById("stBody");
let tab="market";
let fuseSel=[];   // два корпуса, выбранных под сплав в лаборатории
function openStation(){
  G.st=G.sys.station;G.mode="dock";G.ap=null;toggleLog(false);
  mgrTick();mgrRouteVisit(G.sys);routeVisit(G.sys);
  scripVisitReset();          // потолок обмена бонами — на заход (12u-scrip)
  /* трепло (12x): у прилавка оно слышит цены, а иногда выдаёт то, что слышало
     у вас. Обе стороны одной птицы, и обе — на стыковке */
  if(typeof parrotDock==="function")parrotDock(G.sys);
  /* счётчик посадок на это место (11b-speech): от него зависит, как к вам
     обращаются и какая реплика в очереди станет следующей */
  if(typeof visitMark==="function")visitMark();
  if(typeof placeMark==="function")placeMark();   // память места и одометр (11d)
  /* почтовый круг (11e): если это следующее звено, человек подходит сам */
  if(typeof postDock==="function"){const pr=postDock();if(pr)say(pr.who+":\n"+pr.line);}
  if(typeof keepersDock==="function"){const kr=keepersDock();if(kr&&kr.line)say("Смотритель:\n"+kr.line);}   /* линия смотрителей (11k) */
  if(typeof chartsDock==="function"){const cr=chartsDock();if(cr)say("Местные:\n"+cr.line);}   /* несогласие карт (11m) */
  if(typeof quietDock==="function"){const qr=quietDock();if(qr)say("Колония:\n"+qr.line);}     /* тихий уезд (11n) */
  if(typeof retDock==="function"){const rr=retDock();if(rr)say("Вернувшиеся:\n"+rr.line);}     /* возвращение (11s) */
  logAdd("dim","Стыковка с «"+G.st.name+"»");
  /* цены на бумагу (M152e): что видели здесь — лежит на столе, закладка ЦЕНЫ */
  if(typeof pricesSeen==="function")pricesSeen(G.sys);
  if(typeof vegaHomeArrive==="function"&&vegaAtHome())vegaHomeArrive();   /* «я прибралась» (M153) */
  if(typeof vegaLanded==="function")vegaLanded();
  if(typeof expPaxDock==="function")expPaxDock();   /* попутчик сошёл (M156) */
  for(const k in keys)keys[k]=false;
  document.querySelectorAll(".pads button").forEach(b=>b.classList.remove("on"));
  document.getElementById("stName").textContent=G.st.name.toUpperCase();
  /* модули названы прямо в шапке: снаружи игрок видит их силуэты, внутри —
     читает списком. Услуги при этом по-прежнему от типа станции, модули
     ничего не открывают (17a-station-mod) */
  document.getElementById("stKind").textContent=
    G.st.kind+" · система "+G.sys.name+"\n"+stationModsLine(G.sys);
  syncTabs();
  $st.classList.add("open");renderTab();saveGame(true);
}
/* ── навигация станции: раздел, потом вкладка ──
   Десять вкладок в один ряд сжимались до полусотни пикселей и обрезали подписи.
   Разделов же всегда мало, и они отвечают на вопрос, с которым игрок пришёл:
   продать, снарядиться, узнать, нанять, распорядиться. Внутри раздела с одной
   вкладкой вторая ступень не показывается — нечего выбирать. */
const ST_GROUPS=[
  {id:"board", ru:"ДОСКА",     tabs:["board"]},   /* M151a: всё, что мир говорит о себе, на одной стене */
  {id:"trade", ru:"ТОРГОВЛЯ",  tabs:["market","barter","flea","smelt","scrip"]},
  {id:"ship",  ru:"КОРАБЛЬ",   tabs:["yard","mods","fuse","instr"]},
  {id:"know",  ru:"НАУКА",     tabs:["lab"]},
  {id:"folk",  ru:"ЛЮДИ",      tabs:["crew","cantina"]},
  {id:"hold",  ru:"ВЛАДЕНИЯ",  tabs:["bases"]}
];
function stGroupOf(t){const g=ST_GROUPS.find(G0=>G0.tabs.indexOf(t)>=0);return g?g.id:ST_GROUPS[0].id;}
let stGroup="trade";
function stTabsHere(){return ["board"].concat(stTypeOf(G.st.stype).tabs);}   /* доска есть у всех (M151a) */
function syncTabs(){
  const has=stTabsHere();
  /* раздел живёт, только если у него есть хоть одна вкладка на этой станции */
  const live=ST_GROUPS.filter(g=>g.tabs.some(t=>has.indexOf(t)>=0));
  if(has.indexOf(tab)<0)tab=(live[0]&&live[0].tabs.filter(t=>has.indexOf(t)>=0)[0])||"none";
  stGroup=stGroupOf(tab);
  const $g=document.getElementById("stGroups");
  $g.textContent="";
  for(const g of live){
    const b=document.createElement("button");
    b.textContent=g.ru;
    if(g.id===stGroup)b.classList.add("on");
    b.addEventListener("click",()=>{
      const first=g.tabs.filter(t=>has.indexOf(t)>=0)[0];
      if(!first)return;
      tab=first;syncTabs();renderTab();
    });
    $g.appendChild(b);
  }
  const grp=ST_GROUPS.find(g=>g.id===stGroup);
  let shown=0;
  document.querySelectorAll("#stTabs button").forEach(b=>{
    const ok=has.indexOf(b.dataset.tab)>=0&&grp&&grp.tabs.indexOf(b.dataset.tab)>=0;
    b.style.display=ok?"":"none";
    if(ok)shown++;
    b.classList.toggle("on",b.dataset.tab===tab);
  });
  /* одна вкладка в разделе — вторая ступень только мешает */
  document.getElementById("stTabs").classList.toggle("solo",shown<2);
}
function repairCost(){
  /* репутация станции идёт в цену работы: чинят руки, а не рынок (12k-rep) */
  return Math.max(4,Math.round(14*stTypeOf(G.st.stype).rep*repRepairMul()));
}
function closeStation(){
  if(typeof vegaLaunchHold==="function"&&vegaLaunchHold())return;   /* зеркало (M153): раз в день — «вы обещали остаться» */
  /* блошинец (12ua): то, что про вас записано, вы либо забрали, либо оставили
     на прилавке — и тогда его покупает кто-то другой */
  if(typeof fleaLeave==="function")fleaLeave(G.sys);
  $st.classList.remove("open");G.mode="system";
  const S=G.st,dx=G.ship.x-S.x,dy=G.ship.y-S.y,d=Math.hypot(dx,dy)||1;
  G.ship.x=S.x+dx/d*150;G.ship.y=S.y+dy/d*150;
  G.ship.vx=S.vx;G.ship.vy=S.vy;
  say("Отстыковка");
}
document.querySelectorAll("#stTabs button").forEach(b=>b.addEventListener("click",()=>{
  document.querySelectorAll("#stTabs button").forEach(x=>x.classList.remove("on"));
  b.classList.add("on");tab=b.dataset.tab;renderTab();
}));
document.getElementById("bUndock").addEventListener("click",closeStation);
document.getElementById("bRefuel").addEventListener("click",()=>{
  const st=stat(),need=Math.ceil(st.fuelMax-G.fuel);
  if(need<=0){say("Баки полны");return;}
  const per=fuelPriceHere(),can=Math.min(need,Math.floor(G.credits/per));
  if(can<=0){say("Не хватает кредитов");return;}
  G.credits-=can*per;G.fuel+=can;renderTab();
});
document.getElementById("bRepair").addEventListener("click",()=>{
  const st=stat(),need=Math.ceil(st.hullMax-G.hull);
  if(need<=0){say("Корпус цел");return;}
  const per=repairCost(),can=Math.min(need,Math.floor(G.credits/per));
  if(can<=0){say("Не хватает кредитов");return;}
  G.credits-=can*per;G.hull+=can;renderTab();
  if(typeof placeNote==="function")placeNote("care",1);   // починка здесь — забота о месте (11d)
});
function el(tag,cls,html){const e=document.createElement(tag);if(cls)e.className=cls;
  /* правило 1 оформления: капслок — подписям, а не тексту. Длинный заголовок
     секции — это фраза, которую читают, и она набирается обычным текстом */
  if(cls==="sec"&&typeof html==="string"&&(html.length>48||html.indexOf(" — ")>=0)){
    e.className="sec note";
    /* исходники набраны капслоком под прежний стиль; фраза переводится в
       обычный регистр с заглавной в начале предложения */
    if(!/[а-яёa-z]/.test(html))html=html.toLocaleLowerCase("ru").replace(/(^|[.!?]\s+)([а-яёa-z])/g,(m,a,b)=>a+b.toUpperCase());
  }
  if(html!=null)e.innerHTML=html;return e;}
function shipThumb(id,w,h){
  const cn=document.createElement("canvas");cn.width=w;cn.height=h;
  const c=cn.getContext("2d");
  const hl=hullOf(id);
  const sc=Math.min(w/(hl.len+14),h/(hl.halfW*2+10));
  const old=ctx;ctx=c;
  c.save();
  c.translate(w/2-(hl.nose+hl.tail)*.5*sc,h/2);c.scale(sc,sc);
  drawHull(id,false,false,0);
  c.restore();
  ctx=old;
  return cn;
}
function shipRow(id,S){
  const mine=G.shipId===id,own=!!G.owned[id];
  const r=el("div","row");
  r.appendChild(shipThumb(id,52,42));
  /* Тир — первое, что видно в строке: он говорит, встретите ли вы такой ещё раз */
  const T=typeof tierOf==="function"?tierOf(S):null;
  r.appendChild(el("div","nm","<b style='color:"+S.col+"'>«"+S.ru+"» <span style='color:var(--dim)'>"+
    S.cls+"</span></b><s>"+(T?"<b style='color:"+T.col+"'>"+T.ru.toUpperCase()+"</b> — "+T.note+"<br>":"")+
    S.note+"<br>тяга "+S.thr.toFixed(2)+" · поворот "+S.turn.toFixed(2)+
    " · трюм "+S.cargo+" · бак "+S.fuel+" · корпус "+S.hull+"</s>"));
  if(mine)r.appendChild(el("div","qt","В РЕЙСЕ"));
  else{
    /* цена корпуса с поправкой на то, как к вам тут относятся (12k-rep) */
    const pay=Math.round(S.price*repShipMul(G.sys));
    const b=el("button","act"+(own?"":" gold"),own?"ПЕРЕСЕСТЬ":pay.toLocaleString("ru")+" кр");
    b.disabled=!own&&G.credits<pay;
    b.onclick=()=>{
      if(!own){G.credits-=pay;G.owned[id]=true;
        logAdd("money","Куплен корабль «"+S.ru+"» за "+pay.toLocaleString("ru")+" кр");
        /* вторая строка «Ключа от верфи»: уникальный корпус приходит не пустым */
        if(relicDeep("key")&&id[0]==="u"){
          const seed=hashi(S.seed||0,0x4EF0,3);
          for(let i=0;i<2;i++)addPart(genPart(hashi(seed,i,0x71),2));
          logAdd("tech","«Ключ от верфи»: корпус пришёл с частями");
        }}
      else logAdd("dim","Пересадка на «"+S.ru+"»");
      G.shipId=id;
      const ns=stat();
      G.fuel=Math.min(G.fuel,ns.fuelMax);G.hull=Math.min(G.hull,ns.hullMax);
      let over=held()-ns.cargoMax;
      /* людей (M114) за борт не высыпают: при пересадке лишним оказывается
         груз, а не пассажиры — они остаются, даже если трюм стал теснее */
      for(const k of RES_KEYS){if(over<=0)break;
        if(PAX_KEYS.indexOf(k)>=0)continue;
        const t=Math.min(over,G.cargo[k]);G.cargo[k]-=t;over-=t;}
      say("Приняли «"+S.ru+"»");renderTab();
    };
    r.appendChild(b);
  }
  return r;
}
function renderTab(){
  const st=stat();
  document.getElementById("wCr").textContent=G.credits.toLocaleString("ru")+" кр";
  document.getElementById("wDt").textContent=G.data+" данных";
  $body.innerHTML="";
  if(tab==="none"){
    /* заправочная: вкладок нет вовсе, но экран не должен выглядеть сломанным */
    $body.appendChild(el("div","sec","ТОПЛИВО "+fuelPriceHere()+" кр/ед · РЕМОНТ "+repairCost()+" кр/ед · "+repLine(G.sys).toUpperCase()));
    $body.appendChild(el("div","row","<div class='nm'><b>Только заправка и ремонт</b>"+
      "<s>перевалочный узел на отшибе: ни рынка, ни верфи, ни лаборатории —<br>"+
      "зато баки полны и корпус залатан</s></div>"));
    return;
  }
  if(tab==="board"){
    /* ДОСКА (M151a): всё, что мир говорит о себе, на одной стене — очередь у
       стойки, дела здесь, табло прибытий, слухи, имя системы. Сюда же лягут
       наряды (M152e), циркуляр (M156), стенгазета (M165), доска почёта (M161). */
    if(stTypeOf(G.st.stype).tabs.length===0)
      $body.appendChild(el("div","sec","ТОПЛИВО "+fuelPriceHere()+" кр/ед · РЕМОНТ "+repairCost()+" кр/ед · "+repLine(G.sys).toUpperCase()));
    const sp=(typeof speechHere==="function")?speechHere():null;
    if(sp){
      $body.appendChild(el("div","sec","ОЧЕРЕДЬ У СТОЙКИ · "+sp.addr.toUpperCase()));
      $body.appendChild(el("div","row","<div class='nm'><s style='color:#cfe3ea;line-height:1.9'>"+
        (sp.silent?"<i>смотрит и ничего не говорит</i>":sp.line)+"</s><s>следующая реплика — в следующий заход</s></div>"));
      const tag=G.sys.key+"#"+visitHere();
      if(G.spLogged!==tag&&!sp.silent){G.spLogged=tag;peopleLine(sp.line,G.st.name);}
    }
    if(typeof questOpen==="function"){
      const here=questOpen().filter(q=>q.sx===G.sx&&q.sy===G.sy);
      if(here.length){
        $body.appendChild(el("div","sec","ДЕЛА ЗДЕСЬ"));
        for(const q of here)$body.appendChild(el("div","row","<div class='nm'><b>"+q.ru+"</b><s>"+(q.note||"")+
          (q.reward?" · награда: "+q.reward:"")+"</s></div>"));
      }
    }
    if(typeof needBlock==="function")needBlock();         /* нужда и наряд (M152e) */
    if(typeof findsBlock==="function")findsBlock();       /* находки: институту или с рук (M152e) */
    if(typeof kitDepotBlock==="function")kitDepotBlock();   /* склад института: комплект (M152) */
    if(typeof vegaFleaBlock==="function")vegaFleaBlock();   /* дед с лотка (M153) */
    if(typeof ringBlock==="function")ringBlock();           /* ленты Кольца (M154) */
    if(typeof misBlock==="function")misBlock();             /* часы станции против неба (M155) */
    if(typeof expBlock==="function")expBlock();             /* экспедиция: собираем, отпустить, попутчик (M156) */
    if(typeof lettersBlock==="function")lettersBlock();     /* письма с содержанием (M158) */
    if(typeof expOfferBlock==="function")expOfferBlock();   /* есть место (M159) */
    if(typeof retBlock==="function")retBlock();           /* табло прибытий (11s) */
    if(typeof rumourBlock==="function")rumourBlock();     /* слухи (11t) */
    if(typeof namesBlock==="function")namesBlock();       /* имя системы (11u) */
    $body.appendChild(el("div","sec","ПРИЁМНИК — НА ПУЛЬТЕ ВНИЗУ · У СТОЙКИ ЛОВИТ ЛУЧШЕ"));
    return;
  }
  if(tab==="market"){
    const prices=marketFor(G.sys),mkt=G.market[G.sys.key];
    $body.appendChild(el("div","sec","ТРЮМ "+held()+" / "+st.cargoMax+
      " · ТОПЛИВО "+G.st.fuelPrice+" кр/ед · РЕМОНТ "+repairCost()+" кр/ед"));
    renderRoute();
    let any=false,tot=0;
    for(const k of TRADE_KEYS){
      const q=G.cargo[k];if(!q)continue;any=true;
      const price=prices[k],base=RES[k].price;tot+=q*price;
      let tg=price>base*1.12?"выгодно":(price<base*.9?"дёшево":"обычная цена");
      if((mkt.pressure[k]||0)<-.05)tg+=" · недавно продавали здесь";
      const r=el("div","row");
      r.appendChild(el("div","nm","<b style='color:"+RES[k].col+"'>"+RES[k].ru+
        "</b><s>"+price+" кр/ед · "+tg+" (база "+base+")</s>"));
      r.appendChild(el("div","qt",q+"<s>"+(q*price).toLocaleString("ru")+" кр</s>"));
      const b=el("button","act","ПРОДАТЬ");
      b.onclick=()=>{const rev=sellCargo(G.sys,k,q);
        tell("money","Продано на «"+G.st.name+"»: "+RES[k].ru.toLowerCase()+" ×"+q+" · +"+rev.toLocaleString("ru")+" кр",
             "Продано: "+RES[k].ru+" ×"+q+"\n+"+rev.toLocaleString("ru")+" кр");
        renderTab();};
      r.appendChild(b);$body.appendChild(r);
    }
    if(any){
      const r=el("div","row");
      r.appendChild(el("div","nm","<b>Продать весь груз</b><s>по ценам этой станции</s>"));
      r.appendChild(el("div","qt",tot.toLocaleString("ru")+"<s>кр</s>"));
      const b=el("button","act gold","ПРОДАТЬ ВСЁ");
      b.onclick=()=>{let sum=0,n=0;
        for(const k of TRADE_KEYS){const q=G.cargo[k];if(q>0){sum+=sellCargo(G.sys,k,q);n+=q;}}
        tell("money","Груз сдан на «"+G.st.name+"» · "+n+" ед · +"+sum.toLocaleString("ru")+" кр",
             "Груз реализован\n+"+sum.toLocaleString("ru")+" кр");
        renderTab();};
      r.appendChild(b);$body.appendChild(r);
    }else $body.appendChild(el("div","sec","ТРЮМ ПУСТ — САДИТЕСЬ НА ПЛАНЕТУ ИЛИ ИДИТЕ В ПОЯС"));
    /* редкое лежит в том же трюме, но купить его никто не возьмётся:
       оно тратится, а не продаётся — поэтому отдельной секцией и без кнопки */
    if(RARE_RES.some(k=>G.cargo[k]>0)){
      $body.appendChild(el("div","sec","РЕДКОЕ СЫРЬЁ · РЫНОК НЕ БЕРЁТ · ИДЁТ НА ЛАБОРАТОРИЮ, БАЗЫ И КОРАБЛИ"));
      for(const k of RARE_RES){
        const q=G.cargo[k];if(!q)continue;
        const r=el("div","row");
        r.appendChild(el("div","nm","<b style='color:"+RES[k].col+"'>"+RES[k].ru+"</b><s>"+RES[k].rare+"</s>"));
        r.appendChild(el("div","qt",q+"<s>ед</s>"));
        $body.appendChild(r);
      }
    }
    $body.appendChild(el("div","sec","ЗАКУПОЧНЫЕ ЦЕНЫ ЗДЕСЬ — МЕНЯЮТСЯ ОТ ПРОДАЖ И СО ВРЕМЕНЕМ"));
    for(const k of TRADE_KEYS){
      const r=el("div","row");
      r.appendChild(el("div","nm","<b style='color:"+RES[k].col+"'>"+RES[k].ru+"</b>"));
      r.appendChild(el("div","qt",prices[k]+"<s>кр/ед</s>"));
      $body.appendChild(r);
    }
  }
  else if(tab==="yard"){
    /* Под блокадой док не строит и не продаёт: занятость — это отнятые службы,
       а не отнятые числа. Топливо остаётся всегда, иначе игрок застревает */
    if(!occService("yard")){
      $body.appendChild(el("div","sec","ДОК ЗАКРЫТ · СИСТЕМА ПОД ПИРАТАМИ"));
      $body.appendChild(el("div","row","<div class='nm'><s>"+occInfo(occHere()).note+
        "<br>верфь откроется, когда систему отобьют: сбивайте патрули здесь же — "+
        "счёт идёт по этой системе.</s></div>"));
    }else{
    /* Ряд дока, а не склад всей галактики: что стоит здесь сегодня. Ряд держится
       на seed станции и временном бакете — вернулись через час, ряд другой. */
    /* ── налёт часов ──
       Верфь берёт деньги и снимает половину: работа сменная, корабль ждать
       не будет. До чистого доводят только дома, в своём гараже (12s-wear). */
    $body.appendChild(el("div","sec",wearLine()));
    if(wearOf()>.05){
      const cost=wearYardCost();
      const r=el("div","row");
      r.appendChild(el("div","nm","<b>Обслуживание корпуса</b><s>"+
        "снимут половину налёта: пескоструй, промывка сопел, подкраска.<br>"+
        "до чистого доводят только в своём гараже</s>"));
      r.appendChild(el("div","qt",cost.toLocaleString("ru")+"<s>кр</s>"));
      const b=el("button","act","ОБСЛУЖИТЬ");
      b.disabled=G.credits<cost;
      b.onclick=()=>{
        if(G.credits<cost)return;
        G.credits-=cost;
        const got=wearService(.5);
        tell("tech","Обслуживание на «"+G.st.name+"» · снято "+Math.round(got*100)+"% налёта",
             "Корпус обслужен\nналёт "+Math.round(wearOf()*100)+"%");
        renderTab();
      };
      r.appendChild(b);$body.appendChild(r);
    }
    const yard=stationFleet(G.sys);
    $body.appendChild(el("div","sec","КОРПУСА В ЭТОМ ДОКЕ · РЯД МЕНЯЕТСЯ САМ · МОДУЛИ ПЕРЕСТАВЛЯЮТСЯ БЕСПЛАТНО"));
    for(const id of yard)$body.appendChild(shipRow(id,FLEET[id]));
    /* Свои корпуса из ангара показываем всегда: пересесть обратно можно везде */
    const own=Object.keys(G.owned).filter(id=>id!==G.shipId&&yard.indexOf(id)<0);
    if(own.length){
      $body.appendChild(el("div","sec","ВАШ АНГАР · ПЕРЕСЕСТЬ МОЖНО В ЛЮБОМ ДОКЕ"));
      for(const id of own){const S=shipData(id);if(S)$body.appendChild(shipRow(id,S));}
    }
    $body.appendChild(el("div","sec","СЕРИЙНЫЙ РЯД · ЕСТЬ В ЛЮБОМ ДОКЕ"));
    for(const id of SHIP_KEYS)$body.appendChild(shipRow(id,SHIPS[id]));
    /* уникальный корпус строят только на верфи — у торгового узла док слабый */
    /* «Ключ от верфи» открывает единственный экземпляр в любом доке, а не
       только на верфи: это его первая строка и есть */
    const offer=(G.st.stype==="yard"||relicOn("key"))?stationUniqueOffer(G.sys):null;
    if(offer){
      const uid="u"+offer.seed;
      G.uniqueShips[uid]=offer;
      $body.appendChild(el("div","sec","НАЙДЕНО ЗДЕСЬ · ЕДИНСТВЕННЫЙ ЭКЗЕМПЛЯР · ПРЕДЛОЖЕНИЕ СМЕНИТСЯ"+
        (relicDeep("key")?" · УЖЕ С ЧАСТЯМИ В СЛОТАХ":"")));
      $body.appendChild(shipRow(uid,offer));
    }
    const dr=DRONES.miner;
    $body.appendChild(el("div","sec","ДРОНЫ · РАЗМЕЩАЮТСЯ НА ЗАЛЕЖИ ИЛИ АСТЕРОИДЕ · САМИ ВОЗЯТ И ПРОДАЮТ РУДУ"));
    const rd=el("div","row");
    rd.appendChild(el("div","nm","<b>"+dr.ru+"</b><s>"+dr.note+
      "<br>в запасе: "+G.droneInventory+" · развёрнуто: "+G.drones.length+"</s>"));
    const bd=el("button","act gold",dr.price.toLocaleString("ru")+" кр");
    bd.disabled=G.credits<dr.price;
    bd.onclick=()=>{G.credits-=dr.price;G.droneInventory++;
      tell("money","Куплен "+dr.ru.toLowerCase()+" за "+dr.price.toLocaleString("ru")+" кр",
           "Дрон куплен\nв запасе: "+G.droneInventory);
      renderTab();};
    rd.appendChild(bd);$body.appendChild(rd);
    for(const d of G.drones){
      const home=nearestStation(d.sx,d.sy);
      const r=el("div","row");
      r.appendChild(el("div","nm","<b style='color:"+RES[d.res].col+"'>"+RES[d.res].ru+"</b><s>сектор "+d.sx+":"+d.sy+
        " · везёт на «"+home.name+"» · осталось "+d.pool+"</s>"));
      $body.appendChild(r);
    }
  }
  }
  else if(tab==="mods"){
    const cap=capOf(G.shipId);
    const capBar=()=>{
      const used=capUsed();
      $body.appendChild(el("div","sec","ОСНАСТКА: "+used+" / "+cap+
        " · МОДУЛИ И ЧАСТИ ДЕЛЯТ ОДИН БЮДЖЕТ"+(used>cap?" · ПЕРЕГРУЗ":"")));
    };
    capBar();
    $body.appendChild(el("div","sec","МОДУЛИ — ДО 4 УРОВНЕЙ · КАЖДЫЙ УРОВЕНЬ ЗАНИМАЕТ 1 МЕСТО"));
    for(const k in MODS){
      const M=MODS[k],own=G.modsOwned[k],lvl=G.mods[k],cost=modCost(k,own),max=own>=4;
      const r=el("div","row");
      /* точка залита — уровень стоит на корабле, обведена — куплен, но снят */
      let dots="";for(let i=0;i<4;i++)dots+="<i class='"+(i<lvl?"f":(i<own?"o":""))+"'></i>";
      r.appendChild(el("div","nm","<b>"+M.ru+"</b><s>"+M.note+
        (own>lvl?" · снято "+(own-lvl):"")+"</s><div class='dots'>"+dots+"</div>"));
      const box=el("div","modbtns");
      if(lvl>0){
        const bm=el("button","act sm","−");
        bm.title="снять уровень";
        bm.onclick=()=>{G.mods[k]--;afterFitChange();renderTab();};
        box.appendChild(bm);
      }
      if(lvl<own){
        const bp=el("button","act sm","+");
        bp.title="поставить уровень";
        bp.disabled=capUsed()+1>cap;
        bp.onclick=()=>{
          if(capUsed()+1>cap){say("Не хватает места в оснастке");return;}
          G.mods[k]++;afterFitChange();renderTab();};
        box.appendChild(bp);
      }
      const b=el("button","act"+(max?"":" gold"),max?"МАКСИМУМ":cost.toLocaleString("ru")+" кр");
      b.disabled=max||G.credits<cost;
      b.onclick=()=>{G.credits-=cost;G.modsOwned[k]++;
        if(capUsed()+1<=cap)G.mods[k]++;
        else say("Куплено, но места в оснастке нет\nснимите что-нибудь");
        afterFitChange();
        tell("money",M.ru+" → ур."+G.modsOwned[k]+" · −"+cost.toLocaleString("ru")+" кр",
             M.ru+"\nуровень "+G.modsOwned[k]);
        renderTab();};
      box.appendChild(b);
      r.appendChild(box);$body.appendChild(r);
    }

    /* сборка живёт на экране корабля — здесь только вход в неё */
    {
      const slots=slotsOf(G.shipId),fm=G.fit[G.shipId]||{};
      const r=el("div","row");
      r.appendChild(el("div","nm","<b>ОСНАСТКА КОРПУСА</b><s>"+
        Object.keys(fm).length+" из "+slots.length+" слотов занято · в инвентаре "+
        G.inv.length+" частей</s>"));
      const b=el("button","act sm gold","ОТКРЫТЬ");
      /* уходим на экран корабля, не отстыковываясь: раньше здесь просто снимали
         .open со станции, режим оставался "dock", и после ЗАКРЫТЬ игрок висел
         в космосе без управления. Теперь помним, что вернуться надо на станцию. */
      b.onclick=()=>{svReturn="station";$st.classList.remove("open");openShipView();};
      r.appendChild(b);$body.appendChild(r);
    }

    /* ── части в продаже: ассортимент детерминирован seed станции и временным бакетом ── */
    const offers=stationParts(G.sys);
    if(offers.length){
      $body.appendChild(el("div","sec","ЧАСТИ В ПРОДАЖЕ · АССОРТИМЕНТ СМЕНИТСЯ"));
      for(const o of offers){
        const K=PART_KINDS[o.part.kind],bought=G.partsBought[o.key];
        const r=el("div","row");
        r.appendChild(el("div","nm","<b style='color:"+K.col+"'>"+o.part.name+
          (o.black?" <span style='color:#c58ae0;font-size:9px'>ПО СВЯЗЯМ ФАКТОРА</span>":"")+"</b><s>"+
          K.ru.toLowerCase()+" · "+TIER_RU[o.part.tier]+" · место "+o.part.cap+"<br>"+
          o.part.aff.map(a=>"<span style='color:"+(a.v>0?"#8fd08a":"#ff9d7a")+"'>"+affLabel(a)+"</span>").join(" · ")+"</s>"));
        const b=el("button","act"+(bought?"":" gold"),bought?"КУПЛЕНО":o.price.toLocaleString("ru")+" кр");
        b.disabled=!!bought||G.credits<o.price;
        b.onclick=()=>{
          G.credits-=o.price;G.partsBought[o.key]=1;
          addPart(genPart(o.part.seed,o.part.tier,o.part.kind));
          tell("money","Куплена часть: "+o.part.name+" · −"+o.price.toLocaleString("ru")+" кр",
               o.part.name+"\nв инвентаре");
          renderTab();};
        r.appendChild(b);$body.appendChild(r);
      }
    }

    $body.appendChild(el("div","sec","ТЕКУЩИЕ ХАРАКТЕРИСТИКИ"));
    const s2=stat(),r=el("div","row");
    r.appendChild(el("div","nm","<s>тяга "+s2.thr.toFixed(2)+" · поворот "+s2.turn.toFixed(2)+
      "<br>бак "+s2.fuelMax+" · трюм "+s2.cargoMax+" · корпус "+s2.hullMax+
      (s2.shieldMax?" · щит "+s2.shieldMax:"")+
      "<br>бур ×"+s2.drill.toFixed(2)+" · прыжок "+s2.jump.toFixed(1)+" пк"+
      (s2.armed?"<br>урон "+s2.dmg.toFixed(1)+" · откат "+s2.cool:"")+"</s>"));
    $body.appendChild(r);
  }
  /* ── приборы (M127) ──
     Прилавок, гнёзда и полка. Прибор — вещь: у него завод, возраст и характер,
     и он не «улучшает характеристику», а лучше или хуже различает отклонение.
     Поэтому в строке пишется не число, а то, что игрок реально почувствует. */
  else if(tab==="instr"){
    /* самописец — товар (хвост M127): второй барабан, лента вдвое длиннее */
    {
      const r=el("div","row");
      r.appendChild(el("div","nm","<b>Самописец · второй барабан</b><s>"+
        (G.tapeLong?"стоит: лента идёт вдвое медленнее и помнит вдвое дольше":
         "лента идёт вдвое медленнее и помнит вдвое дольше")+"</s>"));
      if(!G.tapeLong){
        const b=el("button","act sm gold","2 400 кр");
        b.disabled=G.credits<2400;
        b.onclick=()=>{G.credits-=2400;G.tapeLong=1;
          tell("tech","Самописец: второй барабан установлен","Второй барабан\nлента помнит вдвое дольше");renderTab();};
        r.appendChild(b);
      }else r.appendChild(el("div","nm","<s>установлен</s>"));
      $body.appendChild(r);
    }
    $body.appendChild(el("div","sec","ПЯТЬ ГНЁЗД ПАНЕЛИ · ПРИБОР РАЗЛИЧАЕТ ОТКЛОНЕНИЕ, А НЕ ДАЁТ ПРОЦЕНТ"));
    for(const id of INSTR_KEYS){
      const I=INSTR_BY_ID[id],u=instrUnit(id),T=instrTraits(u);
      /* в строке описывается САМ прибор: профессия корпуса умножает все пять
         одинаково, и в лавке ей не место (03f учитывается на панели) */
      const q=T.res*(1-clamp(u.wear||0,0,1)*.45), fix=instrFixCost(id);
      const r=el("div","row");
      r.appendChild(el("div","nm","<b>"+I.ru+"</b><s>"+T.ru+" · "+instrWearRu(u.wear||0)+
        " · "+T.note+"</s><s>различает "+(q>=1.25?"тонко":q>=.95?"как положено":
        q>=.75?"грубовато":"едва")+" · стрелка "+(T.jit>=1.6?"нервная":T.jit>=1?"живая":"спокойная")+
        " · перо "+(T.pen>=1.2?"жирное":T.pen>=.95?"обычное":"волосом")+"</s>"));
      if(fix>0){
        const b=el("button","act sm gold",fix.toLocaleString("ru")+" кр");
        b.title="выверить и почистить";
        b.disabled=G.credits<fix;
        b.onclick=()=>{if(instrFix(id))renderTab();};
        r.appendChild(b);
      }else r.appendChild(el("div","nm","<s>выверен</s>"));
      $body.appendChild(r);
    }
    const offers=instrOffers();
    $body.appendChild(el("div","sec","ПРИЛАВОК · ТОВАР МЕНЯЕТСЯ РАЗ В НЕСКОЛЬКО ЧАСОВ"));
    if(!offers.length)$body.appendChild(el("div","row","<div class='nm'><s>сегодня пусто</s></div>"));
    for(const off of offers){
      const I=INSTR_BY_ID[off.id],T=instrTraits(off.u),price=instrPrice(off.u);
      const cu=instrUnit(off.id),ct=instrTraits(cu);
      const cur=ct.res*(1-clamp(cu.wear||0,0,1)*.45);
      const would=T.res*(1-clamp(off.u.wear||0,0,1)*.45);
      const r=el("div","row");
      r.appendChild(el("div","nm","<b>"+I.ru+" · "+T.ru+"</b><s>"+instrWearRu(off.u.wear||0)+
        " · "+T.note+"</s><s>"+(would>cur*1.08?"различает лучше вашего":
        would<cur*.92?"различает хуже вашего":"как ваш")+"</s>"));
      const b=el("button","act gold",price.toLocaleString("ru")+" кр");
      b.disabled=G.credits<price;
      b.onclick=()=>{if(instrBuy(off))renderTab();};
      r.appendChild(b);$body.appendChild(r);
    }
    const shelf=instrShelf();
    if(shelf.length){
      $body.appendChild(el("div","sec","ПОЛКА · СНЯТОЕ ХРАНИТСЯ ЗДЕСЬ, МЕСТ "+INSTR_SHELF_MAX));
      shelf.forEach((it,k)=>{
        const I=INSTR_BY_ID[it.id],T=instrTraits(it.u);
        const r=el("div","row");
        r.appendChild(el("div","nm","<b>"+I.ru+" · "+T.ru+"</b><s>"+
          instrWearRu(it.u.wear||0)+" · снят с панели</s>"));
        const b=el("button","act sm","ПОСТАВИТЬ");
        b.onclick=()=>{instrFromShelf(k);renderTab();};
        r.appendChild(b);$body.appendChild(r);
      });
    }
  }
  else if(tab==="lab"){
    /* наборы узлов идут первыми: это долгая цель, а наука — текущая работа */
    if(nodeCount()>0||Object.keys(G.crowns||{}).length)nodesRender();
    $body.appendChild(el("div","sec","ДАННЫЕ: "+G.data+
      " · ИСТОЧНИКИ — НОВЫЕ ПЛАНЕТЫ (+6) И ВИДЫ (+9)"));
    for(const k in TECH){
      const T=TECH[k],max=T.max||1,lvl=techLv(k),done=lvl>=max,cost=techCost(k);
      const r=el("div","row");
      let dots="";
      if(T.max)for(let i=0;i<max;i++)dots+="<i class='"+(i<lvl?"f":"")+"'></i>";
      r.appendChild(el("div","nm","<b"+(done?" style='color:var(--dim)'":"")+">"+T.ru+"</b><s>"+T.note+
        "</s>"+(dots?"<div class='dots'>"+dots+"</div>":"")));
      const b=el("button","act"+(done?"":" gold"),done?(T.max?"МАКСИМУМ":"ИЗУЧЕНО"):cost+" дан");
      b.disabled=done||G.data<cost;
      b.onclick=()=>{
        G.data-=cost;
        if(T.max)G.techLvl[k]=(G.techLvl[k]|0)+1; else G.tech.add(k);
        if(k==="cera")G.hull+=30;
        tell("tech","Изучено: "+T.ru+(T.max?" (ур."+techLv(k)+")":"")+" · −"+cost+" данных",
             "Изучено:\n"+T.ru+(T.max?"\nуровень "+techLv(k):""));
        renderTab();
      };
      r.appendChild(b);$body.appendChild(r);
    }
  }
  else if(tab==="fuse"){
    /* сплав корпусов: два корабля из ангара и редкое сырьё — на выходе один
       новый, исходные расходуются. Прибавка тает с каждым поколением. */
    const c=fuseCost();
    $body.appendChild(el("div","sec","СПЛАВ КОРПУСОВ · ПОКОЛЕНИЕ "+(fuseGen()+1)+
      " · ИСХОДНЫЕ КОРАБЛИ РАСХОДУЮТСЯ БЕЗВОЗВРАТНО"));
    const free=Object.keys(G.owned).filter(id=>!G.crew.some(o=>o.shipId===id));
    if(!fuseSel)fuseSel=[];
    fuseSel=fuseSel.filter(id=>free.indexOf(id)>=0);
    for(const id of free){
      const S=shipData(id);if(!S)continue;
      const on=fuseSel.indexOf(id)>=0;
      const r=el("div","row");
      r.appendChild(shipThumb(id,52,42));
      r.appendChild(el("div","nm","<b style='color:"+S.col+"'>«"+S.ru+"»</b><s>"+
        "тяга "+S.thr.toFixed(2)+" · поворот "+S.turn.toFixed(2)+" · трюм "+S.cargo+
        " · бак "+S.fuel+" · корпус "+S.hull+(id===G.shipId?"<br>сейчас в рейсе — сплав пересадит вас на результат":"")+"</s>"));
      const b=el("button","act"+(on?" gold":""),on?"ВЫБРАН":"ВЗЯТЬ");
      b.onclick=()=>{
        if(on)fuseSel.splice(fuseSel.indexOf(id),1);
        else if(fuseSel.length<2)fuseSel.push(id);
        else{fuseSel.shift();fuseSel.push(id);}
        renderTab();
      };
      r.appendChild(b);$body.appendChild(r);
    }
    const need=el("div","row");
    need.appendChild(el("div","nm","<b>Стоимость плавки</b><s>"+
      c.credits.toLocaleString("ru")+" кр · сплавы "+G.cargo.alloy+"/"+c.alloy+
      " · летучие газы "+G.cargo.volatiles+"/"+c.volatiles+
      " · кристаллы льда "+G.cargo.icecrys+"/"+c.icecrys+
      "<br>лишнее редкое сырьё в трюме идёт в прибавку, но каждое поколение прибавляет меньше</s>"));
    const bf=el("button","act gold","СПЛАВИТЬ");
    bf.disabled=fuseSel.length!==2||!fuseAffordable(c);
    bf.onclick=()=>{if(fuseShips(fuseSel[0],fuseSel[1])){fuseSel=[];renderTab();}};
    need.appendChild(bf);$body.appendChild(need);
    $body.appendChild(el("div","sec","СБОРКА ЧАСТЕЙ ИЗ РЕДКОГО СЫРЬЯ · СТОК ДЛЯ ИЗЛИШКОВ"));
    for(const spec of CRAFT_TIERS){
      const r=el("div","row");
      r.appendChild(el("div","nm","<b>"+spec.ru[0].toUpperCase()+spec.ru.slice(1)+"</b><s>"+
        TIER_RU[spec.tier]+" · "+Object.keys(spec.cost).map(k=>
          k==="credits"?spec.cost[k]+" кр":RES[k].ru.toLowerCase()+" "+spec.cost[k]).join(" · ")+"</s>"));
      const b=el("button","act gold","СОБРАТЬ");
      b.disabled=!craftAffordable(spec.cost)||G.inv.length>=PART_MAX;
      b.onclick=()=>{craftPart(spec);renderTab();};
      r.appendChild(b);$body.appendChild(r);
    }
    /* ракеты (M112): та же лаборатория, но выход — не часть, а груз. Сама
       строка живёт в 16b-missile, рядом с механикой, а не здесь. */
    ammoRow($body,renderTab);
  }
  else if(tab==="bases"){
    renderBasesTab(st);
  }
  else if(tab==="cantina"){renderCantina();}
  /* боны дома (M113): вкладка живёт в своём модуле, 12u-scrip */
  else if(tab==="flea"){fleaRender();}
  else if(tab==="scrip"){scripRender();}
  else if(tab==="crew"){
    /* одна вкладка на всё: кто уже работает — сверху, кандидаты станции — ниже.
       Отсюда же выдают корабль, дают приказ и рассчитывают. */
    crewTick();
    $body.appendChild(el("div","sec","ВАШ ЭКИПАЖ "+G.crew.length+" / "+crewCap()+
      " · ЛИЦЕНЗИЯ РАСШИРЯЕТ ФЛОТ · ЗАРПЛАТА ИДЁТ ПОКА ОНИ РАБОТАЮТ"));
    if(!G.crew.length)$body.appendChild(el("div","sec","ПОКА НИКОГО — НАЙМИТЕ НИЖЕ"));
    G.crew.forEach((c,i)=>{
      const S=c.shipId?shipData(c.shipId):null;
      const hold=crewHold(c),cap=crewCargoMax(c);
      const r=el("div","row");
      const st8=c.state==="hostage"
        ? "<br><b style='color:#ff6b57'>В ПЛЕНУ · выкуп "+(c.ransom||0).toLocaleString("ru")+
          " кр — платить или штурмовать базу в секторе "+c.ransomSx+","+c.ransomSy+"</b>"
        : (c.state==="away"?"<br><b style='color:#f2b25c'>В ЗАГУЛЕ</b>":"");
      r.appendChild(el("div","nm","<b>"+c.name+"</b> <span style='color:var(--dim)'>"+
        CREW_SPEC[c.spec].ru+"</span><s>"+c.traits.map(t=>traitOf(t).ru).join(" · ")+st8+
        "<br>приказ: "+ORDERS[c.order.kind].ru+" · сектор "+c.order.sx+","+c.order.sy+
        " · рейсов "+(c.trips||0)+
        "<br>корабль: "+(S?"«"+S.ru+"» корпус "+Math.round(c.hull)+"/"+Math.round(c.hullMax):"не выдан")+
        (cap?" · трюм "+hold+"/"+cap:"")+
        "<br>жалованье "+crewPay(c)+" кр/мин · опыт "+Math.round(c.xp)+
        " · настрой "+Math.round(c.morale*100)+"%"+
        /* главный вопрос к наёмнику — окупается ли он; ответ должен быть на виду */
        "<br>заработал "+(c.earned||0).toLocaleString("ru")+" кр · съел "+
        (c.spent||0).toLocaleString("ru")+" кр · итог <b style='color:"+
        (((c.earned||0)-(c.spent||0))>=0?"#8fd08a":"#ff6b57")+"'>"+
        ((c.earned||0)-(c.spent||0)).toLocaleString("ru")+" кр</b>"+
        (c.debt>0?" · <b style='color:#ff6b57'>долг "+Math.round(c.debt)+" кр</b>":"")+"</s>"));
      const box=el("div","qt","");
      r.appendChild(box);
      /* ремонт: сам идёт медленно и бесплатно на приколе, за деньги — сразу */
      if(c.shipId&&c.hull<c.hullMax){
        const bRep=el("button","act gold",crewRepairCost(c).toLocaleString("ru")+" кр");
        bRep.disabled=G.credits<crewRepairCost(c);
        bRep.onclick=()=>{if(crewRepair(c))renderTab();};
        r.appendChild(bRep);
      }
      const bFire=el("button","act","РАСЧЁТ "+crewSeverance(c).toLocaleString("ru"));
      bFire.title="выходное пособие — чтобы перебор наёмников не был бесплатным";
      bFire.onclick=()=>{fireMerc(i);renderTab();};
      r.appendChild(bFire);
      $body.appendChild(r);
      /* выдача корабля: только свободные корпуса из ангара, свой текущий не отдаём */
      if(!c.shipId){
        const free=Object.keys(G.owned).filter(id=>id!==G.shipId&&!G.crew.some(o=>o.shipId===id));
        const rr=el("div","row");
        rr.appendChild(el("div","nm","<b>Выдать корабль</b><s>"+
          (free.length?"свободны: "+free.map(id=>{const d=shipData(id);return d?d.ru:id;}).join(", ")
                      :"свободных корпусов нет — купите или пересядьте")+"</s>"));
        for(const id of free.slice(0,3)){
          const d=shipData(id);
          const b=el("button","act gold",(d?d.ru:id).toUpperCase());
          b.onclick=()=>{crewAssignShip(c,id);renderTab();};
          rr.appendChild(b);
        }
        $body.appendChild(rr);
      }else{
        const ro=el("div","row");
        ro.appendChild(el("div","nm","<b>Приказ</b><s>"+ORDERS[c.order.kind].note+
          "<br>район назначается по системе, где вы сейчас: "+G.sx+","+G.sy+"</s>"));
        for(const k in ORDERS){
          if(ORDERS[k].spec&&ORDERS[k].spec!==c.spec)continue;
          if(k==="base")continue;               // на базу отправляют отдельной строкой ниже
          const b=el("button","act"+(c.order.kind===k?"":" gold"),ORDERS[k].ru.toUpperCase());
          b.disabled=c.order.kind===k&&c.order.sx===G.sx&&c.order.sy===G.sy;
          b.onclick=()=>{crewOrder(c,k);renderTab();};
          ro.appendChild(b);
        }
        $body.appendChild(ro);
      }
      /* на базу берут и без корабля: там живут, а не летают */
      const localBase=baseList().find(B=>B.sx===G.sx&&B.sy===G.sy);
      if(localBase&&baseSlots(localBase)>0){
        const rb=el("div","row");
        rb.appendChild(el("div","nm","<b>На базу «"+localBase.name+"»</b><s>мест "+
          baseStaff(localBase).length+"/"+baseSlots(localBase)+
          " · по своей специальности человек работает вдвое лучше</s>"));
        for(const role of ROLE_KEYS){
          const R=BASE_ROLES[role];
          const b=el("button","act"+(c.order.kind==="base"&&c.role===role?"":" gold"),R.ru.toUpperCase());
          b.title=R.note;
          b.disabled=c.order.kind==="base"&&c.role===role;
          b.onclick=()=>{assignToBase(c,localBase,role);renderTab();};
          rb.appendChild(b);
        }
        $body.appendChild(rb);
      }
    });
    $body.appendChild(el("div","sec","ИЩУТ РАБОТУ ЗДЕСЬ · СОСТАВ МЕНЯЕТСЯ СО ВРЕМЕНЕМ"));
    for(const m of stationMercs(G.sys)){
      if(G.crew.some(c=>c.id===m.id))continue;
      const r=el("div","row");
      r.appendChild(el("div","nm","<b>"+m.name+"</b> <span style='color:var(--dim)'>"+
        CREW_SPEC[m.spec].ru+"</span>"+(m.pax?" <span style='color:var(--phos)'>· спасён с баржи</span>":"")+"<s>"+
        (m.pax&&m.story?"<i style='color:var(--phos)'>"+m.story+"</i><br>":"")+
        CREW_SPEC[m.spec].note+
        "<br>"+m.traits.map(t=>traitOf(t).ru+" — "+traitOf(t).note).join("<br>")+
        "<br>жалованье "+crewPay(m)+" кр/мин · опыт "+m.xp+"</s>"));
      r.appendChild(el("div","qt",m.fee.toLocaleString("ru")+"<s>кр найм</s>"));
      const b=el("button","act gold","НАНЯТЬ");
      b.disabled=G.credits<m.fee||G.crew.length>=crewCap();
      b.onclick=()=>{if(hireMerc(m))renderTab();};
      r.appendChild(b);$body.appendChild(r);
    }
  }
  else if(tab==="smelt"){
    /* сплавы нигде не добываются — только здесь: руда в печь, на выходе слиток.
       Это единственная точка входа для сырья, которое потом тратится (M40, M37, M46). */
    $body.appendChild(el("div","sec","ПЕРЕПЛАВКА · СЫРЬЁ ИЗ ТРЮМА → СПЛАВЫ · СПЛАВЫ НЕ ПРОДАЮТСЯ"));
    /* места в трюме не спрашиваем: плавка всегда съедает больше, чем отдаёт,
       так что после неё груза становится меньше, а не больше */
    for(const R of SMELT){
      const have=Math.min(...R.in.map(([k,q])=>Math.floor(G.cargo[k]/q)));
      const can=Math.min(have,Math.floor(G.credits/R.fee));
      const r=el("div","row");
      r.appendChild(el("div","nm","<b style='color:"+RES.alloy.col+"'>"+R.ru+"</b><s>"+
        R.in.map(([k,q])=>RES[k].ru.toLowerCase()+" ×"+q).join(" + ")+" → сплавы ×1 · "+R.fee+" кр за плавку"+
        "<br>в трюме хватит на "+have+"</s>"));
      r.appendChild(el("div","qt",G.cargo.alloy+"<s>сплавов</s>"));
      const b=el("button","act"+(can?" gold":""),can?"ПЛАВИТЬ ×"+Math.min(can,10):"НЕ ХВАТАЕТ");
      b.disabled=!can;
      b.onclick=()=>{
        const n=Math.min(can,10);
        for(const [k,q] of R.in)G.cargo[k]-=q*n;
        G.credits-=R.fee*n;G.cargo.alloy+=n;
        tell("money","Переплавка на «"+G.st.name+"»: сплавы ×"+n,"Переплавка\nсплавы ×"+n);
        /* рацпредложение (M152e): первая плавка этого рецепта платит один раз и честно */
        G.ratios=G.ratios||{};
        if(!G.ratios[R.ru]){
          G.ratios[R.ru]=1;const prem=Math.round((R.fee*6+400)/10)*10;
          earn(prem,"ratio");
          tell("money","Рацпредложение принято: «"+R.ru+"» · премия "+prem+" кр","РАЦПРЕДЛОЖЕНИЕ\n+"+prem+" кр");
          if(typeof thingAdd==="function")thingAdd("paper","Рацпредложение · "+R.ru,"принято на «"+G.st.name+"» · премия "+prem+" кр · повторы — просто сплав");
          if(typeof recordAdd==="function")recordAdd(G.st.name,"рацпредложение: "+R.ru);
        }
        renderTab();
      };
      r.appendChild(b);$body.appendChild(r);
    }
  }
  else if(tab==="barter"){
    $body.appendChild(el("div","sec","ОБМЕН НА РЕСУРСЫ — БЕЗ ДЕНЕГ, ТОЛЬКО ГРУЗ ИЗ ТРЮМА"));
    for(const k in BARTER){
      const item=BARTER[k],done=G.barter.has(k);
      const costTxt=Object.keys(item.cost).map(rk=>"<span style='color:"+RES[rk].col+"'>"+item.cost[rk]+" "+RES[rk].ru.toLowerCase()+"</span>").join(" + ");
      const have=Object.keys(item.cost).every(rk=>G.cargo[rk]>=item.cost[rk]);
      const r=el("div","row");
      r.appendChild(el("div","nm","<b"+(done?" style='color:var(--dim)'":"")+">"+item.ru+"</b><s>"+item.note+"<br>"+costTxt+"</s>"));
      const b=el("button","act"+(done?"":" gold"),done?"ПОЛУЧЕНО":"ОБМЕНЯТЬ");
      b.disabled=done||!have;
      b.onclick=()=>{
        for(const rk in item.cost)G.cargo[rk]-=item.cost[rk];
        G.barter.add(k);
        const ns=stat();G.fuel=Math.min(G.fuel,ns.fuelMax);G.hull=Math.min(G.hull,ns.hullMax);
        tell("tech","Бартер на «"+G.st.name+"»: "+item.ru,"Получено:\n"+item.ru);
        renderTab();
      };
      r.appendChild(b);$body.appendChild(r);
    }
  }
}

/* ══════════════ настройки ══════════════ */
let resetArm=false;
const $opts=document.getElementById("opts"),$optBody=document.getElementById("optBody");
document.getElementById("optbtn").addEventListener("click",()=>{
  for(const k in keys)keys[k]=false;
  document.querySelectorAll(".pads button").forEach(b=>b.classList.remove("on"));
  toggleLog(false);
  $opts.classList.add("open");renderOpts();
});
document.getElementById("optClose").addEventListener("click",()=>$opts.classList.remove("open"));
