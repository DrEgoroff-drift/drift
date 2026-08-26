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
  /* что здесь сегодня предлагают (11ah): часть предложений — не вам, и это
     нормально. Именное приходит только от того, кто вас помнит хорошо */
  /* сперва сдать привезённое, потом смотреть, что предлагают сегодня (11ah) */
  if(typeof offerDeliver==="function"){
    const got=offerDeliver();
    if(got>0)tell("money","Работа сдана · +"+got.toLocaleString("ru")+" кр",
                  "Сдано\n+"+got.toLocaleString("ru")+" кр");
  }
  if(typeof offerVisit==="function")offerVisit();
  /* четверо (12u-folk): если кто-то из своих сегодня здесь, он может назвать
     твой позывной — и тогда предложение весит столько, сколько весит он */
  if(typeof folkVisit==="function"){
    const fv=folkVisit();
    if(fv&&typeof folkOffer==="function")folkOffer(fv.id);
  }
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
  if(typeof folkLeave==="function")folkLeave();   /* свои остались на станции (12u-folk) */
  /* блошинец (12ua): то, что про вас записано, вы либо забрали, либо оставили
     на прилавке — и тогда его покупает кто-то другой */
  if(typeof fleaLeave==="function")fleaLeave(G.sys);
  if(typeof traineeFind==="function")traineeFind();   /* заяц в трюме после блошинца (M163) */
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
    /* ── кто здесь (12u-folk) ──
       Свои. Стоят не на каждом причале и не каждую смену: человек, который
       есть всегда, перестаёт быть человеком. Говорят про своё и никогда — про
       игрока; попросить о чём-нибудь тоже не могут, это не их разговор. */
    if(typeof folkShown==="function"){
      const fs=folkShown();
      if(fs&&FOLK[fs.id]){
        $body.appendChild(el("div","sec",FOLK[fs.id].ru.toUpperCase()));
        $body.appendChild(el("div","row","<div class='nm'><s style='color:#cfe3ea;line-height:1.9'>"+
          fs.line+"</s></div>"));
      }
    }
    /* ── рассказать, где взяли (11aj) ──
       Появляется, только если он и правда где-то взял заметно, и только по разу
       на место. Ни предупреждения, ни последствий в тексте: человек слушает,
       благодарит, и всё. Счёт придёт через несколько дней и чужим голосом. */
    if(typeof toldWorth==="function"){
      const tw=toldWorth();
      if(tw){
        $body.appendChild(el("div","sec","У СТОЙКИ СЛУШАЮТ"));
        const r=el("div","row");
        r.appendChild(el("div","nm","<b>Рассказать, где взяли "+
          RES[tw.res].ru.toLowerCase()+"</b><s>тут любят, когда делятся</s>"));
        const b=el("button","act","РАССКАЗАТЬ");
        b.onclick=()=>{toldDo();renderTab();};
        r.appendChild(b);$body.appendChild(r);
      }
    }
    /* ── что вы уже взяли ──
       Не задание: ни стрелки, ни срока, ни напоминания вне этой строки.
       Настоящий журнал — бумага на столе (27i), она ложится туда при взятии.
       Здесь только строчка, чтобы человек, стоящий у доски, не вспоминал по
       памяти, куда он собирался. */
    if(typeof offerCarried==="function"){
      const car=offerCarried();
      if(car.length){
        $body.appendChild(el("div","sec","ВЕЗЁТЕ"));
        for(const o of car){
          const K=OFFER_KIND[o.kind];
          $body.appendChild(el("div","row","<div class='nm'><b>"+
            K.ru[0].toUpperCase()+K.ru.slice(1)+"</b><s>на «"+o.to.name+"»"+
            (o.named?" · вас назвали":"")+"</s></div>"));
        }
      }
    }
    /* ── возможности (11ah) ──
       Не задания: у них нет цели, нет маркера и нет напоминания. Это то, что
       здесь сегодня предлагают, и половина предложений — не тебе.
       Именное стоит первым и подписано «вам»: разница между «кто рядом» и
       «вам» — это вся дуга книги, набранная двумя словами. Платит оно втрое,
       и в этом весь смысл — закрытую дверь игрок почувствует кошельком, а не
       строкой интерфейса. */
    if(typeof offerHere==="function"){
      const oh=offerHere();
      if(oh.length){
        oh.sort((a,b)=>b.named-a.named);
        $body.appendChild(el("div","sec","ЧТО ПРЕДЛАГАЮТ"));
        for(const o of oh){
          const K=OFFER_KIND[o.kind];
          const r=el("div","row");
          r.appendChild(el("div","nm","<b>"+(o.named?"Вам":K.ru[0].toUpperCase()+K.ru.slice(1))+
            (o.named?" — "+K.ru:"")+"</b><s>"+K.note+"</s>"));
          const pay=offerPay(o);
          if(pay>0)r.appendChild(el("div","qt",pay+"<s>кр</s>"));
          const b=el("button","act"+(o.named?" gold":""),"ВЗЯТЬ");
          b.onclick=()=>{
            offerTake(o);
            const d=o.to;
            tell("","Взято: "+K.ru+(d?" · на «"+d.name+"»":""),
                 d?K.ru+"\nна «"+d.name+"»":K.ru);
            renderTab();
          };
          r.appendChild(b);$body.appendChild(r);
        }
      }
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
    if(typeof islandBlock==="function")islandBlock();       /* письмо на Остров (M160) */
    if(typeof recordBlock==="function")recordBlock();       /* доска почёта, комиссия (M161) */
    if(typeof instBlock==="function")instBlock();           /* институт: темы и отчёты (M162) */
    if(typeof skyBlock==="function")skyBlock();             /* небесная вахта (M195) */
    if(typeof traineeBlock==="function")traineeBlock();     /* диплом стажёру (M163) */
    if(typeof zooBlock==="function")zooBlock();             /* зоостанция (M164) */
    if(typeof wallBlock==="function")wallBlock();           /* стенгазета и заявки (M165) */
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
    /* Маршрут переехал в конец вкладки (проход «дорога»). Он стоял вторым
       блоком сверху, и у игрока без маршрута — то есть у всякого, кто открыл
       рынок впервые, — первая цена оказывалась ниже середины экрана: шапка,
       пустой маршрут в три строки, «трюм пуст», и только потом товар.
       Рынок открывают ради цен; маршрут — это планирование, ему место после
       того, ради чего пришли. Учить он меньше не стал, просто ждёт своей
       очереди.
       Но заведённый маршрут — не подсказка, а дело: он говорит, что грузить
       прямо сейчас. Такой остаётся наверху. */
    const hasRoute=(typeof routeOf==="function")&&routeOf().legs.length>=2;
    if(hasRoute)renderRoute();
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
    if(!hasRoute)renderRoute();
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
  else if(tab==="mods"){stTabMods();}
  else if(tab==="instr"){stTabInstr();}
  else if(tab==="lab"){stTabLab();}
  else if(tab==="fuse"){stTabFuse();}
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
