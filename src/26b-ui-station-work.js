/* ══════════════ станция: мастерская и наука ══════════════
   Отрезано от `26-ui-station` 25.08.2026: файл дорос до 50 КБ, и почти весь
   его вес держала одна функция `renderTab` — цепочка из полутора десятков
   вкладок в одном теле. Резать её пополам нельзя, а вот вынести вкладку
   целиком — можно, и так в этом файле уже сделано для кантины, блошинки и
   бонов (`renderCantina`, `fleaRender`, `scripRender`). Здесь ещё четыре по
   тому же образцу: ОСНАСТКА, ПРИБОРЫ, ЛАБОРАТОРИЯ, СПЛАВ.

   Каждая рисует в общий `$body` теми же кистями (`el`) и перерисовывает экран
   через `renderTab` — состояние станции остаётся в `26`, здесь только вид. */

function stTabMods(){
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
      /* касса — в момент нажатия: между отрисовкой и тычком её мог опустошить
         другой тычок, и счёт уходил в минус (сеть «полный трюм», 0.360.0) */
      b.onclick=()=>{if(G.credits<cost){say("НЕ ХВАТАЕТ КРЕДИТОВ",60);return;}
        G.credits-=cost;G.modsOwned[k]++;
        if(capUsed()+1<=cap)G.mods[k]++;
        else say("Куплено, но места в оснастке нет\nснимите что-нибудь");
        afterFitChange();
        tell("money",M.ru+" → ур."+G.modsOwned[k]+" · −"+cost.toLocaleString("ru")+" кр",
             M.ru+"\nуровень "+G.modsOwned[k]);
        renderTab();};
      box.appendChild(b);
      r.appendChild(box);$body.appendChild(r);
    }

    /* сборка живёт на столе ОПИСЬ — здесь только вход в неё */
    {
      const slots=slotsOf(G.shipId),fm=G.fit[G.shipId]||{};
      const r=el("div","row");
      r.appendChild(el("div","nm","<b>ОСНАСТКА КОРПУСА</b><s>"+
        Object.keys(fm).length+" из "+slots.length+" слотов занято · в инвентаре "+
        G.inv.length+" частей</s>"));
      const b=el("button","act sm gold","ОТКРЫТЬ");
      /* ОПИСЬ (M341) ложится ПОВЕРХ терминала, как стол: закрыл — снова на
         станции, а не в открытом космосе без управления */
      b.onclick=()=>{tableToggle(true,"hold");};
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
          if(bought||G.partsBought[o.key]||G.credits<o.price){say("НЕ ХВАТАЕТ КРЕДИТОВ",60);return;}
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
      "<br>энергия "+s2.energyMax+" · восполнение "+s2.energyRegen.toFixed(2)+"/кадр"+
      (s2.shieldMax?" · поле "+SHIELD_TYPES[s2.shieldType].ru:"")+"</s>"));
    $body.appendChild(r);
    /* семь чисел ствола — все на карточке: скрытых чисел у орудия нет (§2,
       M362). Прежняя строка «урон · откат» в общем списке ушла сюда — два
       места для одного и того же числа расходятся при первой же правке. */
    if(s2.armed){
      const g=s2.gun;
      $body.appendChild(el("div","sec","ОРУДИЕ · СЕМЬ ЧИСЕЛ"));
      const rg=el("div","row");
      rg.appendChild(el("div","nm","<s>урон "+g.dmg.toFixed(1)+" · "+DMG_TYPES[g.type].ru+
        "<br>откат "+g.cool+" кадров · дальность "+g.range+
        "<br>скорость снаряда "+g.speed.toFixed(1)+" · конус "+Math.round(g.cone*180/Math.PI)+"°"+
        "<br>наводка "+g.lead.toFixed(2)+" рад/кадр · разброс "+(g.spread*100).toFixed(1)+"%"+
        "</s>"));
      $body.appendChild(rg);
      /* три итога — по ним и сравнивают сборку со сборкой (§3.2, M363) */
      const T=s2.gunTot||{hull:0,shield:0,perEnergy:0};
      const rt=el("div","row");
      rt.appendChild(el("div","nm","<s>урон/с по корпусу "+T.hull.toFixed(1)+
        " · по щиту "+T.shield.toFixed(1)+"<br>урон на энергию "+T.perEnergy.toFixed(2)+
        " · стволов "+(s2.guns?s2.guns.length:0)+"</s>"));
      $body.appendChild(rt);
      /* группы 1–3 (§3.3): по умолчанию выбирает автоогонь, закрепить — здесь */
      if(s2.guns&&s2.guns.length>1){
        const rgr=el("div","row");
        rgr.appendChild(el("div","nm","<s>группа орудий</s>"));
        GUN_GROUPS.forEach((gg,gi)=>{
          const b=el("button","",gg.ru.toUpperCase());
          if(G.gunPin&&(G.gunGroup|0)===gi)b.classList.add("on");
          b.onclick=()=>{
            if(G.gunPin&&(G.gunGroup|0)===gi){G.gunPin=false;}
            else{G.gunPin=true;G.gunGroup=gi;}
            renderTab();};
          rgr.appendChild(b);
        });
        const nb=el("div","nm","<s>"+(G.gunPin?"закреплена":"выбирает сама")+"</s>");
        rgr.appendChild(nb);
        $body.appendChild(rgr);
      }
      /* стрельбище: списанная баржа у причала, минута наружу и обратно */
      if(typeof rangeCanHere==="function"&&rangeCanHere()){
        const rr=el("div","row");
        rr.appendChild(el("div","nm","<s>стрельбище · списанная баржа у причала<br>минута наружу и обратно, числа честные</s>"));
        const b=el("button","","ПРОВЕРИТЬ");
        b.onclick=()=>{$st.classList.remove("open");rangeStart();};
        rr.appendChild(b);
        $body.appendChild(rr);
      }
    }
  }
  /* ── приборы (M127) ──
     Прилавок, гнёзда и полка. Прибор — вещь: у него завод, возраст и характер,
     и он не «улучшает характеристику», а лучше или хуже различает отклонение.
     Поэтому в строке пишется не число, а то, что игрок реально почувствует. */
function stTabInstr(){
    /* самописец — товар (хвост M127): второй барабан, лента вдвое длиннее */
    {
      const r=el("div","row");
      r.appendChild(el("div","nm","<b>Самописец · второй барабан</b><s>"+
        (G.tapeLong?"стоит: лента идёт вдвое медленнее и помнит вдвое дольше":
         "лента идёт вдвое медленнее и помнит вдвое дольше")+"</s>"));
      if(!G.tapeLong){
        const b=el("button","act sm gold","2 400 кр");
        b.disabled=G.credits<2400;
        b.onclick=()=>{if(G.credits<2400||G.tapeLong)return;G.credits-=2400;G.tapeLong=1;
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
function stTabLab(){
    /* наборы узлов идут первыми: это долгая цель, а наука — текущая работа */
    if(nodeCount()>0||Object.keys(G.crowns||{}).length)nodesRender();
    if(typeof probeBlock==="function")probeBlock();   /* вымпел: зонд без возврата (M196) */
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
function stTabFuse(){
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
