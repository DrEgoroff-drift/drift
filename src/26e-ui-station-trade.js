/* ══════════════ станция: доска, рынок и док (выделено из 26, M415) ══════════════
   Три вкладки из `renderTabBody` занимали три пятых модуля станции: доска
   (M151a) со всем, что мир говорит о себе, рынок с ценами и маршрутом и док с
   корпусами. Остальные вкладки давно живут по своим файлам —
   `stTabMods`/`stTabInstr`/`stTabLab`/`stTabFuse` в `26b`, стройка в `26c`, —
   и эти три просто не переехали вместе с ними. Здесь они по тому же образцу:
   одна функция на вкладку, `st` передаётся, как в `renderBasesTab(st)`.

   Порядок склейки: `26e-` ложится после `26d-ui-wanderer`; всё, чем эти
   вкладки пользуются ($body, el, secHead, boardLanes), объявлено раньше. */
function stTabBoard(){
    /* ДОСКА (M151a): всё, что мир говорит о себе, на одной стене — очередь у
       стойки, дела здесь, табло прибытий, слухи, имя системы. Сюда же лягут
       наряды (M152e), циркуляр (M156), стенгазета (M165), доска почёта (M161). */
    if(stTypeOf(G.st.stype).tabs.length===0)
      $body.appendChild(el("div","sec","ТОПЛИВО "+fuelPriceHere()+" кр/ед · РЕМОНТ "+repairCost()+" кр/ед · "+repLine(G.sys).toUpperCase()));
    const sp=(typeof speechHere==="function")?speechHere():null;
    if(sp){
      secHead("ОЧЕРЕДЬ У СТОЙКИ",{count:sp.addr});
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
        /* подпись, кто это (M299): голое «РЫБА» с цитатой читалось сбоем */
        secHead(FOLK[fs.id].where==="dock"?"У ДОКА":"В ЗАЛЕ");
        $body.appendChild(el("div","row","<div class='nm'><b>"+FOLK[fs.id].ru+" · завсегдатай</b>"+
          "<s style='color:#cfe3ea;line-height:1.8'>"+fs.line+"</s></div>"));
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
    if(typeof appetiteBlock==="function")appetiteBlock();  /* что станция берёт с надбавкой (M290) */
    if(typeof rungBoardBlock==="function")rungBoardBlock();  /* пятилетка и что здесь стоит (M292) */
    if(typeof holdMeteoLines==="function"){const ML=holdMeteoLines(G.sys);   /* Метеостанция (I6) */
      if(ML.length){$body.appendChild(el("div","sec","МЕТЕОСТАНЦИЯ · ПОГОДА НА ТЕЛАХ"));
        for(const l of ML)$body.appendChild(el("div","row","<div class='nm'><s>"+l+"</s></div>"));}}
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
    if(typeof winBlock==="function")winBlock();             /* зимовка: месяц одному (M197) */
    if(typeof traineeBlock==="function")traineeBlock();     /* диплом стажёру (M163) */
    if(typeof zooBlock==="function")zooBlock();             /* зоостанция (M164) */
    if(typeof wallBlock==="function")wallBlock();           /* стенгазета и заявки (M165) */
    if(typeof retBlock==="function")retBlock();           /* табло прибытий (11s) */
    if(typeof rumourBlock==="function")rumourBlock();     /* слухи (11t) */
    /* имя системы ушло с доски на карту (M299): поле «ваше имя. На карте — оно»
       читалось как имя капитана, и туда вписывали позывной */
    boardLanes(0);
    $body.appendChild(el("div","sec","ПРИЁМНИК — НА ПУЛЬТЕ ВНИЗУ · У СТОЙКИ ЛОВИТ ЛУЧШЕ"));
}
function stTabMarket(st){
    const prices=marketFor(G.sys),mkt=G.market[G.sys.key];
    $body.appendChild(el("div","sec","ТРЮМ "+held()+" / "+st.cargoMax+
      " · ТОПЛИВО "+fuelPriceHere()+" кр/ед · РЕМОНТ "+repairCost()+" кр/ед"));
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
      const price=prices[k],base=RES[k].price;
      /* котировка с аппетитом (M290): тег говорит правду для первых N единиц и
         для (N+1)-й — «берут первые 6», а не «выгодно» на весь трюм */
      const Q=(typeof sellQuote==="function")?sellQuote(G.sys,k,q):{revenue:q*price,nA:0,priceA:price};
      tot+=Q.revenue;
      let tg=price>base*1.12?"выгодно":(price<base*.9?"дёшево":"обычная цена");
      if(Q.nA)tg="берут первые "+Q.nA+" по "+Q.priceA+" кр"+(Q.nA<q?", остальное "+price:"");
      if((mkt.pressure[k]||0)<-.05)tg+=" · недавно продавали здесь";
      const r=el("div","row");
      r.appendChild(el("div","nm","<b style='color:"+RES[k].col+"'>"+RES[k].ru+
        "</b><s>"+price+" кр/ед · "+tg+" (база "+base+")</s>"));
      r.appendChild(el("div","qt",q+"<s>"+Math.round(Q.revenue).toLocaleString("ru")+" кр</s>"));
      const b=el("button","act"+(Q.nA?" gold":""),"ПРОДАТЬ");
      b.onclick=()=>{const rev=sellCargo(G.sys,k,q),L=sellCargo.last||{};
        const extra=L.nA?" · "+L.nA+" с надбавкой":"";
        tell("money","Продано на «"+G.st.name+"»: "+RES[k].ru.toLowerCase()+" ×"+q+" · +"+rev.toLocaleString("ru")+" кр"+extra,
             "Продано: "+RES[k].ru+" ×"+q+"\n+"+rev.toLocaleString("ru")+" кр"+extra);
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
    /* прилавок ВЗЯТЬ — кооперативу, запись — на станции дома (12aj, M351) */
    if(typeof coopCounterBlock==="function")coopCounterBlock();
    if(typeof coopRegBlock==="function")coopRegBlock();
    /* редкое лежит в том же трюме, но купить его никто не возьмётся:
       оно тратится, а не продаётся — поэтому отдельной секцией и без кнопки */
    if(RARE_RES.some(k=>G.cargo[k]>0)){
      $body.appendChild(el("div","sec","РЕДКОЕ СЫРЬЁ · РЫНОК НЕ БЕРЁТ · ИДЁТ НА ЛАБОРАТОРИЮ, БАЗЫ И КОРАБЛИ · ЛИШНЕЕ БЕРУТ ТОРГОВЫЕ БАРЖИ"));
      for(const k of RARE_RES){
        const q=G.cargo[k];if(!q)continue;
        const r=el("div","row");
        /* сперва «зачем», потом «откуда»: игрок и так знает, где это взял */
        r.appendChild(el("div","nm","<b style='color:"+RES[k].col+"'>"+RES[k].ru+"</b><s>"+
          (RES[k].use?RES[k].use+" · добыча: "+RES[k].rare:RES[k].rare)+"</s>"));
        r.appendChild(el("div","qt",q+"<s>ед</s>"));
        $body.appendChild(r);
      }
    }
    /* промышленное (M291): рынок не берёт — ряд называет ближайший свой цех, который ест */
    if(IND_KEYS.some(k=>G.cargo[k]>0)){
      $body.appendChild(el("div","sec","ПРОМЫШЛЕННОЕ · РЫНОК НЕ БЕРЁТ · СДАЁТСЯ В СВОЙ ЦЕХ"));
      for(const k of IND_KEYS){
        const q=G.cargo[k];if(!q)continue;
        const e=(typeof holdNearestEater==="function")?holdNearestEater(k):null;
        const r=el("div","row");
        r.appendChild(el("div","nm","<b style='color:"+RES[k].col+"'>"+RES[k].ru+"</b><s>"+
          (e?(e.d?"едят на «"+e.name+"» · "+e.d+" "+pl3(e.d,"прыжок","прыжка","прыжков"):"едят здесь — вкладка СТРОЙКА"):"едока пока нет — поставьте цех, который это ест")+"</s>"));
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
function stTabYard(st){
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
    {
      /* ── у верфи есть пол (M235) ──
         Он назван числом прямо в строке: игрок должен видеть, ЧТО именно
         купит, и почему второй раз нажимать бессмысленно. Ниже пола налёт
         снимают только дома, и об этом сказано здесь же. */
      const floor=wearFloor();
      const w=wearOf();
      if(w>floor+.02){
        const cost=wearYardCost();
        const r=el("div","row");
        r.appendChild(el("div","nm","<b>Обслуживание корпуса</b><s>"+
          "пескоструй, промывка сопел, подкраска: снимут налёт до "+Math.round(floor*100)+"%.<br>"+
          "ниже верфь не берётся — до чистого доводят только в своём гараже</s>"));
        r.appendChild(el("div","qt",cost.toLocaleString("ru")+"<s>кр</s>"));
        const b=el("button","act","ОБСЛУЖИТЬ");
        b.disabled=G.credits<cost;
        b.onclick=()=>{
          if(G.credits<cost)return;
          G.credits-=cost;
          const got=wearServiceTo(floor);
          tell("tech","Обслуживание на «"+G.st.name+"» · снято "+Math.round(got*100)+"% налёта",
               "Корпус обслужен\nналёт "+Math.round(wearOf()*100)+"% · это пол этой верфи\n"+
               "до чистого — только гараж дома");
          renderTab();
        };
        r.appendChild(b);$body.appendChild(r);
      }else if(w>.02){
        $body.appendChild(el("div","row","<div class='nm'><s>налёт "+Math.round(w*100)+
          "% — это пол здешней верфи ("+Math.round(floor*100)+"%), ниже она не берётся. "+
          "На настоящей верфи снимают больше, дома — всё и бесплатно.</s></div>"));
      }
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
    /* ── восстановление притащенного корпуса (M369b, §19.3 «tow») ──
       Чёрный корпус на тросе становится вашим не даром и не сразу: док берёт
       за работу, и только после неё у корпуса появляется имя. Порода — та, с
       которой он сошёл со стапеля, и она никуда не девается. */
    if(G.tow){
      const TB=G.tow.by||"gt";
      const TP=(typeof powerOf==="function")?powerOf(TB):null;
      const base=genUniqueShip(hashi(G.tow.seed,0x0E57,7));
      base.by=TB;
      base.cls="восстановленный корпус";
      base.note="Пришёл на тросе чёрным, без имени и огней. "+
        (TP?"Стапель "+TP.ru+".":"")+" Что с ним было — не написано нигде.";
      const cost=Math.round((2200+base.price*.45)/50)*50;
      $body.appendChild(el("div","sec","НА ТРОСЕ · ВОССТАНОВЛЕНИЕ"+(TP?" · "+TP.ru.toUpperCase():"")));
      const rr=el("div","row");
      rr.appendChild(el("div","nm","<b>Чёрный корпус</b><s>"+base.note+
        "<br>тяга "+base.thr.toFixed(2)+" · поворот "+base.turn.toFixed(2)+
        " · трюм "+base.cargo+" · бак "+base.fuel+" · корпус "+base.hull+"</s>"));
      const rb=el("button","act"+(G.credits>=cost?" gold":""),cost.toLocaleString("ru")+" кр");
      rb.disabled=G.credits<cost||G.st.stype!=="yard";
      rb.onclick=()=>{
        if(G.credits<cost){say("НЕ ХВАТАЕТ КРЕДИТОВ",60);return;}
        G.credits-=cost;
        const uid="t"+G.tow.seed;
        G.uniqueShips[uid]=base;G.owned[uid]=true;G.tow=null;
        tell("tech","Корпус восстановлен: «"+base.ru+"»",
          "Восстановлен\n«"+base.ru+"»\n"+(TP?TP.ru:""));
        renderTab();saveGame(true);
      };
      if(G.st.stype!=="yard")rr.appendChild(el("div","qt","ТОЛЬКО ВЕРФЬ"));
      else rr.appendChild(rb);
      $body.appendChild(rr);
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
    /* окупаемость — по ценам ЭТОЙ станции (M350): игрок видит, на какой руде машина себя отобьёт */
    const PM=marketFor(G.sys),pb=["crystal","titan","iron"].filter(k=>PM[k]).map(k=>RES[k].ru.toLowerCase()+" ~"+dronePaybackH(PM[k],dr.ratePerMin*stat().droneRate)+" ч").join(" · ");
    const shop=droneShopHas(G.sys),sells=G.st.stype==="yard"||G.st.stype==="indust";
    rd.appendChild(el("div","nm","<b>"+dr.ru+"</b><s>"+dr.note+
      "<br>окупится: "+(pb||"—")+"<br>в запасе: "+G.droneInventory+" · развёрнуто: "+G.drones.length+
      (sells?(shop?"":"<br>здесь уже брали — следующая машина через двое суток"):"<br>продают только верфь и завод")+"</s>"));
    const bd=el("button","act"+(shop?" gold":""),dr.price.toLocaleString("ru")+" кр");
    bd.disabled=G.credits<dr.price||!shop;
    bd.onclick=()=>{if(!droneShopTake(G.sys))return;G.credits-=dr.price;G.droneInventory++;
      tell("money","Куплен "+dr.ru.toLowerCase()+" за "+dr.price.toLocaleString("ru")+" кр",
           "Дрон куплен\nв запасе: "+G.droneInventory);
      renderTab();};
    rd.appendChild(bd);$body.appendChild(rd);
    /* машина, а не строка списка (M237): номер, состояние, круги. Весь
       список маршрутов живёт на столе, здесь — что стоит в этой системе */
    for(const d of G.drones){
      const home=nearestStation(d.sx,d.sy);
      const r=el("div","row");
      const mk=(typeof droneFar==="function")?droneFar(d):null;
      r.appendChild(el("div","nm","<b style='color:"+RES[d.res].col+"'>"+droneName(d)+" · "+RES[d.res].ru+
        "</b><s>сектор "+d.sx+":"+d.sy+" · возит на «"+(mk?mk.name:home.name)+"» · "+droneStateRu(d)+
        " · кругов "+(d.trips|0)+" · "+(d.earned|0).toLocaleString("ru")+" кр"+(d.pool>=0?" · осталось "+d.pool:"")+"</s>"));
      /* отозвать можно только там, где машина работает: за ней надо прилететь (M350) */
      if(d.sx===G.sx&&d.sy===G.sy){
        const rb=el("button","act sm","ВЕРНУТЬ");
        rb.onclick=()=>{droneRecall(d);renderTab();};
        r.appendChild(rb);
      }
      $body.appendChild(r);
    }
  }
}
