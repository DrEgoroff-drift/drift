/* ══════════════ станция: вкладка «дом и базы» ══════════════ */
/* Отпилено от 26-ui-station по шву вкладки (2026-08-23): renderTab зовёт
   renderBasesTab(st), всё остальное — те же $body/el/renderTab. */
function renderBasesTab(st){
    /* ── к чему всё идёт ──
       У игры не было названной цели: дом рос сам, яхта была одним из корпусов,
       пиратов сбивали без счёта. Три строки называют это вслух — и каждая
       считается по настоящему состоянию, а не по флажку «квест выполнен». */
    goalCard();
    /* ── дом первой строкой ──
       До настоящего экрана-помещения (следующий проход M83) дом должен быть
       хотя бы видим: игрок не обязан догадываться, что у него что-то растёт.
       Здесь нет ни одной цены — дом не покупается, и вместо ценника стоит
       строка «до следующей ступени столько-то оборота». */
    if(G.home&&G.home.tier){
      const pr=homeProgress();
      /* не «оборот», а «заработано»: строка над домом объясняет, ОТЧЕГО он
         растёт, и делает это словами, которые человек говорит вслух */
      $body.appendChild(el("div","sec","ВАШ ДОМ · СЕКТОР "+G.home.sx+","+G.home.sy+
        " · ВЫРОС НА ЗАРАБОТАННЫЕ "+G.home.turn.toLocaleString("ru")+" КР"));
      /* дом — помещение, а не список: комната растёт слева направо, и в ней
         видно нажитое (27e-ui-home). Кадр рисуется один раз при открытии:
         своего цикла у экрана станции нет и заводить его незачем */
      /* картинка ровно такой ширины, какой сам дом: он растёт — растёт и она.
         Растянутая на всю панель комната из двух ступеней теряла масштаб, а
         вписанная в высоту жалась к левому краю */
      const hcv=document.createElement("canvas");
      const dpr=window.devicePixelRatio||1, upx=1.5;
      const roomW=homeRoomW();
      hcv.width=Math.round(roomW*upx*dpr);
      hcv.height=Math.round(HOME_ROOM_H*upx*dpr);
      hcv.style.cssText="display:block;border-radius:8px;margin:6px 0;max-width:100%;"+
        "width:"+Math.round(roomW*upx)+"px";
      $body.appendChild(hcv);
      drawHomeRoom(hcv);
      /* ── по вещам можно ткнуть ──
         Кнопки ниже остаются, но перестают быть единственным входом: гараж
         ставит корабль, витрина выносит редкое, кабинет и жилая часть
         рассказывают, что там есть. Зоны считает сам рисунок (27e-ui-home),
         второго описания геометрии нет. */
      hcv.addEventListener("click",(e)=>{if(homeSceneClick(hcv,e))renderTab();});
      const rooms=HOME_TIERS.slice(0,G.home.tier).map(t=>t.ru).join(" · ");
      const hr=el("div","row");
      /* строку «до ступени» не повторяем: она уже нарисована в самой комнате */
      hr.appendChild(el("div","nm","<b>"+rooms+"</b><s>"+
        "здесь вас не найдут пираты, и сюда вы вернётесь, потеряв корабль</s>"));
      const hb=document.createElement("button");
      const hc=homeBeaconCost();
      hb.textContent="МАЯК ДОМОЙ · "+hc.toLocaleString("ru")+" КР";
      hb.disabled=G.credits<hc||(G.sx===G.home.sx&&G.sy===G.home.sy);
      /* маяк работает из полёта, а кнопка стоит на станции: сперва отстыковка, потом
         маяк. Раньше было наоборот — маяк отказывал «только из полёта по системе»,
         и игрок не понимал, из какого полёта (плейтест 02.09) */
      hb.addEventListener("click",()=>{
        if(G.mode==="dock"){closeStation();if(G.mode==="dock")return;}
        if(homeBeacon())renderTab();
      });
      hr.appendChild(hb);
      $body.appendChild(hr);
      /* ── что дом умеет: по одной строке на ступень, и только на ту, что есть.
         Раньше поставить корабль в гараж или вынести редкое на витрину можно
         было только из кода, то есть нельзя. ── */
      /* домочадец: раз на ступень и ни разом больше (12j) */
      if(typeof homeMateKind==="function"&&homeMateKind()){
        const mr=el("div","row");
        mr.appendChild(el("div","nm","<b>"+homeMateName()+"</b><s>"+
          "живёт тут же и хочет что-то сказать · один раз на ступень</s>"));
        const mb=document.createElement("button");
        mb.textContent="ПОГОВОРИТЬ";
        mb.addEventListener("click",()=>{homeMateTake();renderTab();});
        mr.appendChild(mb);
        $body.appendChild(mr);
      }
      if(typeof vegaHomeBlock==="function")vegaHomeBlock();   /* жиличка (M153) */
      if(typeof zooHomeBlock==="function")zooHomeBlock();     /* живой угол (M164) */
      /* домино дома (M166): с Вегой или домочадцем */
      if(typeof dominoBlock==="function"&&homeHas("living"))dominoBlock((typeof vegaHas==="function"&&vegaHas()&&!G.vega.aboard)?"Вега":homeMateName());
      /* стена-музей: доска прогресса живёт в кабинете, а не на отдельном экране */
      if(homeHas("study")&&typeof rareCount==="function"){
        $body.appendChild(el("div","sec","СТЕНА В КАБИНЕТЕ · "+rareCount()+" / 100 · "+
          "ЧТО УНЕСЕНО И ОТКУДА"));
        const have=rareList().map(id=>RARE_BY_ID[id]).filter(Boolean).slice(-5).reverse();
        if(!have.length)$body.appendChild(el("div","row",
          "<div class='nm'><s>гвозди вбиты, рамки пусты: пока не принесено ничего</s></div>"));
        for(const R of have)
          $body.appendChild(el("div","row","<div class='nm'><b>«"+R.ru+"»</b><s>"+
            R.grade+" · "+R.whereRu+" · "+R.note+"</s></div>"));
        const rv=Object.keys(G.rivals||{}).length;
        if(rv)$body.appendChild(el("div","row","<div class='nm'><b>у соперников: "+rv+
          "</b><s>их адреса — в кантине: унесённое не потеряно, оно переехало</s></div>"));
      }
      if(homeHas("garage")){
        const free=Object.keys(G.owned).filter(id=>
          id!==G.shipId&&!G.home.garage.includes(id)&&shipData(id));
        const gr=el("div","row");
        gr.appendChild(el("div","nm","<b>Гараж</b><s>"+
          (G.home.garage.length
            ?"стоят: "+G.home.garage.map(id=>"«"+shipData(id).ru+"»").join(", ")
            :"пуст — потеряв корабль, вы вернётесь домой пешком")+
          "<br>отсюда поднимается корабль, если ваш погиб</s>"));
        if(free.length){
          const gb=document.createElement("button");
          gb.textContent="ПОСТАВИТЬ «"+shipData(free[0]).ru.toUpperCase()+"»";
          gb.addEventListener("click",()=>{homeStore(free[0]);renderTab();});
          gr.appendChild(gb);
        }
        $body.appendChild(gr);
      }
      if(homeHas("case")){
        const have=RARE_RES.filter(k=>(G.cargo[k]|0)>0);
        const shown=Object.keys(G.home.showcase||{});
        const cr=el("div","row");
        cr.appendChild(el("div","nm","<b>Витрина</b><s>"+
          (shown.length?shown.map(k=>RES[k].ru.toLowerCase()+" ×"+G.home.showcase[k]).join(", ")
            :"пуста")+
          "<br>надбавка доменам +"+Math.round(homeShowBonus()*100)+
          "% · выставленное не продаётся</s>"));
        if(have.length){
          const cb=document.createElement("button");
          const k=have[0],q=Math.min(3,G.cargo[k]|0);
          cb.textContent="ВЫСТАВИТЬ "+RES[k].ru.toUpperCase()+" ×"+q;
          cb.addEventListener("click",()=>{homeShow(k,q);renderTab();});
          cr.appendChild(cb);
        }
        $body.appendChild(cr);
      }
      if(homeHas("shop")&&typeof kitShopBlock==="function")kitShopBlock();   /* скафандр: починка и заплаты (M152) */
      if(homeCanRebuild()){
        $body.appendChild(el("div","sec",
          "МАСТЕРСКАЯ · ПЕРЕБОРКА ВЫДАЁТ НОВЫЕ СВОЙСТВА, НО СТУПЕНЬЮ НИЖЕ"));
        const free=G.inv.filter(p=>!Object.values(G.fit[G.shipId]||{}).includes(p.id));
        if(!free.length)$body.appendChild(el("div","row",
          "<div class='nm'><s>перебирать нечего: все части стоят на корабле</s></div>"));
        for(const p of free.slice(0,6)){
          const pr2=el("div","row");
          pr2.appendChild(el("div","nm","<b>"+p.name+"</b> <span style='color:var(--dim)'>"+
            TIER_RU[p.tier]+"</span><s>"+p.aff.map(affLabel).join(" · ")+"</s>"));
          const pb=document.createElement("button");
          pb.textContent=p.tier>1?"ПЕРЕБРАТЬ":"ПЕРЕБРАТЬ · УЖЕ НИЖЕ НЕКУДА";
          pb.addEventListener("click",()=>{homeRebuild(p.id);renderTab();});
          pr2.appendChild(pb);
          $body.appendChild(pr2);
        }
      }
    }
    /* сеть баз одним экраном: где, что копают, сколько накопили, чем больны */
    baseTick();
    const list=baseList();
    $body.appendChild(el("div","sec","ВАШИ БАЗЫ "+list.length+
      " · НАКОПЛЕННОЕ ЖДЁТ НА МЕСТЕ · ПЛОЩАДКА ПОЗВОЛЯЕТ ПЕРЕБРОСКУ"));
    if(!list.length)$body.appendChild(el("div","sec",
      "БАЗ НЕТ — САДИТЕСЬ НА ПЛАНЕТУ И ЗАКЛАДЫВАЙТЕ (2500 КР + 10 СПЛАВОВ)"));
    for(const B of list){
      const P=basePower(B),hold=basePoolHeld(B);
      const here=B.sx===G.sx&&B.sy===G.sy;
      const warn=[];
      if(P.eff<.99)warn.push("энергии не хватает — всё замедлено");
      if(!P.drills)warn.push("нет буровой — база ничего не добывает");
      if(hold>=P.store*.98)warn.push("склад полон — добыча встала");
      if(P.habPenalty)warn.push("жилой отсек прижат к реактору");
      const r=el("div","row");
      r.appendChild(el("div","nm","<b>"+B.name+"</b> <span style='color:var(--dim)'>сектор "+
        B.sx+","+B.sy+(here?" · вы здесь":"")+"</span><s>"+
        "энергия "+P.prod+"/"+P.cons+" · отдача "+Math.round(P.eff*100)+"% · буров "+P.drills+
        "<br>склад "+hold+"/"+P.store+
        (hold?" · "+Object.keys(B.pool).filter(k=>B.pool[k]>0)
          .map(k=>RES[k].ru.toLowerCase()+" "+B.pool[k]).join(", "):"")+
        (warn.length?"<br><b style='color:#ff6b57'>"+warn.join(" · ")+"</b>":"")+"</s>"));
      const staff=baseStaff(B);
      if(staff.length||baseSlots(B))
        r.firstChild.innerHTML+="<s>персонал "+staff.length+"/"+baseSlots(B)+
          (staff.length?" · "+staff.map(c=>c.name+" — "+BASE_ROLES[c.role].ru+
            (roleForce(c)<1?" (не по профилю)":"")).join(", "):"")+"</s>";
      r.appendChild(el("div","qt",P.pads?"площадка":"—"));
      /* логист на месте — груз можно забрать отсюда, не прилетая (M38) */
      if(baseRoleForce(B,"logist")>0&&hold>0){
        const b=el("button","act","ЗАБРАТЬ");
        b.onclick=()=>{baseCollect(B);renderTab();};
        r.appendChild(b);
      }
      if(P.pads&&!here){
        const c=baseJumpCost(B);
        const b=el("button","act gold",c.credits+" кр");
        b.disabled=G.credits<c.credits||G.fuel<c.fuel;
        b.title="переброска: "+c.credits+" кр и "+c.fuel+" топлива";
        b.onclick=()=>{if(jumpToBase(B))closeStation();};
        r.appendChild(b);
      }
      $body.appendChild(r);
    }
}
