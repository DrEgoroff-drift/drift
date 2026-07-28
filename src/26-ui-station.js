/* ══════════════ станция ══════════════ */
const $st=document.getElementById("station"),$body=document.getElementById("stBody");
let tab="market";
let fuseSel=[];   // два корпуса, выбранных под сплав в лаборатории
function openStation(){
  G.st=G.sys.station;G.mode="dock";G.ap=null;toggleLog(false);
  logAdd("dim","Стыковка с «"+G.st.name+"»");
  for(const k in keys)keys[k]=false;
  document.querySelectorAll(".pads button").forEach(b=>b.classList.remove("on"));
  document.getElementById("stName").textContent=G.st.name.toUpperCase();
  document.getElementById("stKind").textContent=G.st.kind+" · система "+G.sys.name;
  syncTabs();
  $st.classList.add("open");renderTab();saveGame(true);
}
/* тип станции решает, какие вкладки вообще есть: лишние кнопки прячем,
   а если открытая вкладка тут не водится — переключаемся на первую доступную */
function syncTabs(){
  const has=stTypeOf(G.st.stype).tabs;
  let first=null;
  document.querySelectorAll("#station nav button").forEach(b=>{
    const ok=has.indexOf(b.dataset.tab)>=0;
    b.style.display=ok?"":"none";
    b.classList.remove("on");
    if(ok&&!first)first=b.dataset.tab;
  });
  if(has.indexOf(tab)<0)tab=first||"none";
  document.querySelectorAll("#station nav button").forEach(b=>{
    if(b.dataset.tab===tab)b.classList.add("on");
  });
}
function repairCost(){return Math.max(4,Math.round(14*stTypeOf(G.st.stype).rep));}
function closeStation(){
  $st.classList.remove("open");G.mode="system";
  const S=G.st,dx=G.ship.x-S.x,dy=G.ship.y-S.y,d=Math.hypot(dx,dy)||1;
  G.ship.x=S.x+dx/d*150;G.ship.y=S.y+dy/d*150;
  G.ship.vx=S.vx;G.ship.vy=S.vy;
  say("Отстыковка");
}
document.querySelectorAll("#station nav button").forEach(b=>b.addEventListener("click",()=>{
  document.querySelectorAll("#station nav button").forEach(x=>x.classList.remove("on"));
  b.classList.add("on");tab=b.dataset.tab;renderTab();
}));
document.getElementById("bUndock").addEventListener("click",closeStation);
document.getElementById("bRefuel").addEventListener("click",()=>{
  const st=stat(),need=Math.ceil(st.fuelMax-G.fuel);
  if(need<=0){say("Баки полны");return;}
  const per=G.st.fuelPrice,can=Math.min(need,Math.floor(G.credits/per));
  if(can<=0){say("Не хватает кредитов");return;}
  G.credits-=can*per;G.fuel+=can;renderTab();
});
document.getElementById("bRepair").addEventListener("click",()=>{
  const st=stat(),need=Math.ceil(st.hullMax-G.hull);
  if(need<=0){say("Корпус цел");return;}
  const per=repairCost(),can=Math.min(need,Math.floor(G.credits/per));
  if(can<=0){say("Не хватает кредитов");return;}
  G.credits-=can*per;G.hull+=can;renderTab();
});
function el(tag,cls,html){const e=document.createElement(tag);if(cls)e.className=cls;
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
  r.appendChild(el("div","nm","<b style='color:"+S.col+"'>«"+S.ru+"» <span style='color:var(--dim)'>"+
    S.cls+"</span></b><s>"+S.note+"<br>тяга "+S.thr.toFixed(2)+" · поворот "+S.turn.toFixed(2)+
    " · трюм "+S.cargo+" · бак "+S.fuel+" · корпус "+S.hull+"</s>"));
  if(mine)r.appendChild(el("div","qt","В РЕЙСЕ"));
  else{
    const b=el("button","act"+(own?"":" gold"),own?"ПЕРЕСЕСТЬ":S.price.toLocaleString("ru")+" кр");
    b.disabled=!own&&G.credits<S.price;
    b.onclick=()=>{
      if(!own){G.credits-=S.price;G.owned[id]=true;
        logAdd("money","Куплен корабль «"+S.ru+"» за "+S.price.toLocaleString("ru")+" кр");}
      else logAdd("dim","Пересадка на «"+S.ru+"»");
      G.shipId=id;
      const ns=stat();
      G.fuel=Math.min(G.fuel,ns.fuelMax);G.hull=Math.min(G.hull,ns.hullMax);
      let over=held()-ns.cargoMax;
      for(const k of RES_KEYS){if(over<=0)break;
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
    $body.appendChild(el("div","sec","ТОПЛИВО "+G.st.fuelPrice+" кр/ед · РЕМОНТ "+repairCost()+" кр/ед"));
    $body.appendChild(el("div","row","<div class='nm'><b>Только заправка и ремонт</b>"+
      "<s>перевалочный узел на отшибе: ни рынка, ни верфи, ни лаборатории —<br>"+
      "зато баки полны и корпус залатан</s></div>"));
    return;
  }
  if(tab==="market"){
    const prices=marketFor(G.sys),mkt=G.market[G.sys.key];
    $body.appendChild(el("div","sec","ТРЮМ "+held()+" / "+st.cargoMax+
      " · ТОПЛИВО "+G.st.fuelPrice+" кр/ед · РЕМОНТ "+repairCost()+" кр/ед"));
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
    $body.appendChild(el("div","sec","КОРПУСА В ДОКЕ · МОДУЛИ ПЕРЕСТАВЛЯЮТСЯ БЕСПЛАТНО"));
    for(const id of SHIP_KEYS)$body.appendChild(shipRow(id,SHIPS[id]));
    /* уникальный корпус строят только на верфи — у торгового узла док слабый */
    const offer=G.st.stype==="yard"?stationUniqueOffer(G.sys):null;
    if(offer){
      const uid="u"+offer.seed;
      G.uniqueShips[uid]=offer;
      $body.appendChild(el("div","sec","НАЙДЕНО ЗДЕСЬ · ЕДИНСТВЕННЫЙ ЭКЗЕМПЛЯР · ПРЕДЛОЖЕНИЕ СМЕНИТСЯ"));
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
      b.onclick=()=>{$st.classList.remove("open");openShipView();};
      r.appendChild(b);$body.appendChild(r);
    }

    /* ── части в продаже: ассортимент детерминирован seed станции и временным бакетом ── */
    const offers=stationParts(G.sys);
    if(offers.length){
      $body.appendChild(el("div","sec","ЧАСТИ В ПРОДАЖЕ · АССОРТИМЕНТ СМЕНИТСЯ"));
      for(const o of offers){
        const K=PART_KINDS[o.part.kind],bought=G.partsBought[o.key];
        const r=el("div","row");
        r.appendChild(el("div","nm","<b style='color:"+K.col+"'>"+o.part.name+"</b><s>"+
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
  else if(tab==="lab"){
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
  }
  else if(tab==="bases"){
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
      r.appendChild(el("div","nm","<b>"+c.name+"</b> <span style='color:var(--dim)'>"+
        CREW_SPEC[c.spec].ru+"</span><s>"+c.traits.map(t=>traitOf(t).ru).join(" · ")+
        "<br>приказ: "+ORDERS[c.order.kind].ru+" · сектор "+c.order.sx+","+c.order.sy+
        "<br>корабль: "+(S?"«"+S.ru+"» корпус "+Math.round(c.hull)+"/"+Math.round(c.hullMax):"не выдан")+
        (cap?" · трюм "+hold+"/"+cap:"")+
        "<br>жалованье "+crewPay(c)+" кр/мин · опыт "+Math.round(c.xp)+
        " · настрой "+Math.round(c.morale*100)+"%"+
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
      const bFire=el("button","act","РАСЧЁТ");
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
        CREW_SPEC[m.spec].ru+"</span><s>"+CREW_SPEC[m.spec].note+
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