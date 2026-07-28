/* ══════════════ станция ══════════════ */
const $st=document.getElementById("station"),$body=document.getElementById("stBody");
let tab="market";
function openStation(){
  G.st=G.sys.station;G.mode="dock";G.ap=null;toggleLog(false);
  logAdd("dim","Стыковка с «"+G.st.name+"»");
  for(const k in keys)keys[k]=false;
  document.querySelectorAll(".pads button").forEach(b=>b.classList.remove("on"));
  document.getElementById("stName").textContent=G.st.name.toUpperCase();
  document.getElementById("stKind").textContent=G.st.kind+" · система "+G.sys.name;
  $st.classList.add("open");renderTab();saveGame(true);
}
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
  const per=14,can=Math.min(need,Math.floor(G.credits/per));
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
  if(tab==="market"){
    const prices=marketFor(G.sys),mkt=G.market[G.sys.key];
    $body.appendChild(el("div","sec","ТРЮМ "+held()+" / "+st.cargoMax+
      " · ТОПЛИВО "+G.st.fuelPrice+" кр/ед · РЕМОНТ 14 кр/ед"));
    let any=false,tot=0;
    for(const k of RES_KEYS){
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
        for(const k of RES_KEYS){const q=G.cargo[k];if(q>0){sum+=sellCargo(G.sys,k,q);n+=q;}}
        tell("money","Груз сдан на «"+G.st.name+"» · "+n+" ед · +"+sum.toLocaleString("ru")+" кр",
             "Груз реализован\n+"+sum.toLocaleString("ru")+" кр");
        renderTab();};
      r.appendChild(b);$body.appendChild(r);
    }else $body.appendChild(el("div","sec","ТРЮМ ПУСТ — САДИТЕСЬ НА ПЛАНЕТУ ИЛИ ИДИТЕ В ПОЯС"));
    $body.appendChild(el("div","sec","ЗАКУПОЧНЫЕ ЦЕНЫ ЗДЕСЬ — МЕНЯЮТСЯ ОТ ПРОДАЖ И СО ВРЕМЕНЕМ"));
    for(const k of RES_KEYS){
      const r=el("div","row");
      r.appendChild(el("div","nm","<b style='color:"+RES[k].col+"'>"+RES[k].ru+"</b>"));
      r.appendChild(el("div","qt",prices[k]+"<s>кр/ед</s>"));
      $body.appendChild(r);
    }
  }
  else if(tab==="yard"){
    $body.appendChild(el("div","sec","КОРПУСА В ДОКЕ · МОДУЛИ ПЕРЕСТАВЛЯЮТСЯ БЕСПЛАТНО"));
    for(const id of SHIP_KEYS)$body.appendChild(shipRow(id,SHIPS[id]));
    const offer=stationUniqueOffer(G.sys);
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