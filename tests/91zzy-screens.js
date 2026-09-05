/* ══════════════ автотесты: экраны M299 — заголовки, подгляд карты, зал как ввод ══════════════
   docs/DESIGN-screens.md. Проверяется то, что плейтест 02.09 назвал словами:
   «НА КАРТУ ничего не делает», «имя назвал — поле осталось», «что за Рыба»,
   «лонгрид», «не видно, где я». */
TEST_SUITES.push(()=>suite("экраны M299: заголовок называет, а не объясняет — на каждой вкладке станции",()=>{
  resetWorld();
  const S=G.sys.station;
  ok(!!S,"станция есть");
  G.ship.x=S.x+40;G.ship.y=S.y;
  openStation();
  const CAP=24;
  let worst="",worstN=0,heads=0;
  for(const t of stTabsHere()){
    tab=t;renderTab();
    for(const h of $body.querySelectorAll(".sec:not(.note):not(.lane)")){
      const sp=h.querySelector("span");
      const txt=(sp?sp.textContent:h.textContent).trim();
      heads++;
      if(txt.length>worstN){worstN=txt.length;worst=t+": "+txt;}
    }
  }
  ok(heads>0,"заголовки найдены: "+heads);
  ok(worstN<=CAP,"самый длинный заголовок ≤ "+CAP+" знаков (было "+worstN+": «"+worst+"»)");
  /* объяснение живёт заметкой, не заголовком: заметок не больше одной на секцию */
  tab="board";renderTab();
  let dbl=0,prev=null;
  for(const x of $body.children){
    const note=x.classList.contains("sec")&&x.classList.contains("note");
    if(note&&prev)dbl++;
    prev=note;
  }
  eq(dbl,0,"две заметки подряд не стоят");
  /* полосы доски: К ВАМ / ЗДЕСЬ / ДАЛЕКО, в этом порядке, пустых нет */
  const lanes=[...$body.querySelectorAll(".sec.lane")].map(x=>x.querySelector("span").textContent);
  ok(lanes.length>=1&&lanes.length<=3,"полос от одной до трёх: "+lanes.join(" / "));
  const order=["К ВАМ","ЗДЕСЬ","ДАЛЕКО"];
  ok(lanes.every((l,i)=>i===0||order.indexOf(l)>order.indexOf(lanes[i-1])),"порядок полос держится");
  /* имя системы ушло с доски */
  ok(!/ИМЯ СИСТЕМЫ/.test($body.textContent),"поля «имя системы» на доске больше нет");
  closeStation();
}));

TEST_SUITES.push(()=>suite("экраны M299: НА КАРТУ со станции — подгляд, НАЗАД возвращает на ту же вкладку",()=>{
  resetWorld();
  const S=G.sys.station;
  G.ship.x=S.x+40;G.ship.y=S.y;
  openStation();
  tab="board";renderTab();
  eq(G.mode,"dock","стоим у станции");
  gotoSector(G.sx+7,G.sy+2,"слух");
  eq(G.mode,"map","режим — карта");
  ok(!$st.classList.contains("open"),"экран станции спрятан, карта видна");
  ok(!!G.mapPeek&&G.mapPeek.tab==="board","подгляд помнит вкладку");
  ok(G.sel.x===G.sx+7&&G.sel.y===G.sy+2,"сектор выбран");
  /* прыжок из подгляда невозможен: стыковка не рвётся */
  let jumped=false;const j0=jump;window.jump=()=>{jumped=true;};
  actEdge=true;try{drawMap();}catch(e){}actEdge=false;window.jump=j0;
  ok(!jumped,"из подгляда не прыгают");
  ok(mapBack(),"НАЗАД возвращает");
  eq(G.mode,"dock","снова на станции");
  ok($st.classList.contains("open"),"экран станции открыт");
  eq(tab,"board","и та же вкладка");
  ok(!G.mapPeek&&!G.mapView,"подгляд и окно сброшены");
  closeStation();
}));

TEST_SUITES.push(()=>suite("экраны M299: карта — «вы» в кадре, протяжка пальцем, масштаб",()=>{
  resetWorld();
  G.mode="map";mapReset();G.sel={x:G.sx,y:G.sy};
  /* дальний слух: лист отдаляется, а не уезжает */
  mapFit(G.sx+12,G.sy-9);
  const fits=(x,y)=>Math.abs(x-mapViewC().x)<=mapRange()&&Math.abs(y-mapViewC().y)<=mapRange();
  ok(fits(G.sx,G.sy)&&fits(G.sx+12,G.sy-9),"после mapFit в кадре и вы, и сектор");
  ok(mapZoomK()>1,"масштаб отдалён: "+mapZoomK().toFixed(2));
  mapReset();
  eq(mapZoomK(),1,"mapReset вернул масштаб");
  /* протяжка: указатель тянет лист, тап не срабатывает */
  const sel0={x:G.sel.x,y:G.sel.y};
  const rc=cvs.getBoundingClientRect();
  const ev=(type,x,y)=>cvs.dispatchEvent(new PointerEvent(type,{pointerId:7,clientX:rc.left+x,clientY:rc.top+y,bubbles:true}));
  ev("pointerdown",120,200);ev("pointermove",150,200);ev("pointermove",200,200);ev("pointerup",200,200);
  ok(!!G.mapView&&G.mapView.x<G.sx,"лист протянут вправо — окно уехало влево: "+(G.mapView?G.mapView.x.toFixed(2):"—"));
  ok(G.sel.x===sel0.x&&G.sel.y===sel0.y,"протяжка не считается тапом");
  /* карта рисуется с окном за краем: стрелка «вы» не роняет кадр */
  G.mapView={x:G.sx+30,y:G.sy+30};
  let okDraw=true;try{drawMap();}catch(e){okDraw=false;}
  ok(okDraw,"кадр с вами за краем рисуется");
  /* кнопка «К СЕБЕ» видна, когда окно уехало, и возвращает */
  hud();
  ok(document.getElementById("mebtn").style.display!=="none","«К СЕБЕ» показана");
  document.getElementById("mebtn").click();
  ok(!G.mapView&&mapZoomK()===1,"«К СЕБЕ» вернула окно и масштаб");
  hud();
  ok(document.getElementById("mebtn").style.display==="none","и спряталась");
  mapReset();G.mode="system";
}));

TEST_SUITES.push(()=>suite("экраны M299: зал — ввод; стол без пустых рядов; имя капитана; завсегдатай подписан",()=>{
  resetWorld();
  /* станция с кантиной */
  const cand=routeTestStations(8).find(s=>s.station&&stTypeOf(s.station.stype).tabs.indexOf("cantina")>=0)||null;
  ok(!!cand,"нашлась станция с кантиной");
  if(!ok(cand,"нашлось: cand"))return;
  G.sx=cand.sx;G.sy=cand.sy;G.sys=cand;G.st=cand.station;
  G.ship.x=cand.station.x+40;G.ship.y=cand.station.y;
  openStation();
  for(const k of RES_KEYS)G.cargo[k]=0;
  G.strips=[];G.news=[];
  folkNow={id:"ryba",line:"Я в кабине. Мне так лучше."};
  cantSel=null;tab="cantina";renderTab();
  ok(!!$body.querySelector("canvas"),"зал нарисован всегда");
  ok(/К СТОЙКЕ/.test($body.textContent),"стойка — точка нажатия");
  ok(/Рыба · завсегдатай/.test($body.textContent),"завсегдатай подписан, а не голое имя");
  const hasTable=()=>[...$body.querySelectorAll(".sec span:first-child")].some(s=>s.textContent==="СТОЛ");
  ok(!hasTable(),"стол не показан, пока не ткнули в стойку");
  cantSel="counter";renderTab();
  ok(hasTable(),"у стойки — стол");
  ok(!/трюм пуст|лент нет|ничего не слышали/.test($body.textContent),"пустых рядов на столе нет");
  ok(/Ваше имя/.test($body.textContent),"ряд имени есть");
  const nb=[...$body.querySelectorAll("button")].find(b=>b.textContent==="НАЗВАТЬ");
  ok(!!nb&&!nb.disabled,"«НАЗВАТЬ» активна");
  nb.click();
  const aw=document.getElementById("askwin");
  ok(!!aw&&aw.classList.contains("open"),"открылось окно имени, а не поле в ряду");
  aw.querySelector("input").value="Дрю";
  aw.querySelector("[data-a=ok]").click();
  eq(G.name,"Дрю","имя капитана записано");
  ok(!aw.classList.contains("open"),"окно закрылось");
  ok(!/трюм пуст/.test($body.textContent)&&!!G.tableUsed&&!!G.tableUsed.name,"ход именем сделан, ответ в ряду");
  /* имя переживает сохранение */
  const snap=snapshot();
  ok(snap.name==="Дрю","имя в снимке");
  /* завсегдатай у двери: точка нажатия в зале, своя карточка */
  cantSel="folk:ryba";renderTab();
  ok(/Я в кабине/.test($body.textContent),"карточка завсегдатая — его слова");
  ok(/У ДОКА/.test($body.textContent),"и где он стоит");
  cantSel=null;folkNow=null;
  /* доска: он же — под заголовком места, не голым именем */
  folkNow={id:"ryba",line:"Иду порожняком."};
  tab="board";renderTab();
  ok(/У ДОКА/.test($body.textContent)&&/Рыба · завсегдатай/.test($body.textContent),"на доске: «У ДОКА · Рыба · завсегдатай»");
  ok(!/^РЫБА$/m.test($body.textContent),"голого «РЫБА» нет");
  folkNow=null;
  /* шапка полёта под открытым экраном спрятана */
  eq(getComputedStyle(document.querySelector(".hud")).visibility,"hidden","шапка полёта под экраном спрятана");
  closeStation();
  G.name="";
}));

/* ── два хвоста альманаха II (M302) ──
   1. Закон 44 px ходил по пэдам, борту и меню; экраны были покрыты руками в
      двух наборах. Здесь — обход всех экранов: каждая видимая кнопка не меньше 44.
   2. Метки целей у края системного вида (SYS_CHIPS) никогда не мерялись против
      эфирной строки и пэдов — последний шов «канва против вёрстки». */
TEST_SUITES.push(()=>suite("экраны M302: 44 px на каждом экране, а не только на пульте",()=>{
  resetWorld();
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  const small=[];let seen=0;
  const sweep=(where,root)=>{
    for(const b of root.querySelectorAll("button")){
      const r=b.getBoundingClientRect();
      if(!r.width||!r.height)continue;
      seen++;
      if(r.width<44-.5||r.height<44-.5)small.push(where+": «"+(b.textContent||b.id).trim().slice(0,18)+"» "+Math.round(r.width)+"×"+Math.round(r.height));
    }
  };
  /* станция — каждая вкладка */
  const S=G.sys.station;G.ship.x=S.x+40;G.ship.y=S.y;
  openStation();G.credits=90000;
  for(const t of stTabsHere()){tab=t;syncTabs();renderTab();sweep("станция/"+t,$st);}
  /* кантина с выбранной стойкой и человеком: там свои кнопки */
  tab="cantina";syncTabs();cantSel="counter";renderTab();sweep("кантина/стойка",$st);
  const free=(G.cantina&&G.cantina.list||[]).filter(m=>!G.mgrs.some(x=>x.seed===m.seed));
  if(free.length){cantSel=free[0].id;renderTab();sweep("кантина/кандидат",$st);}
  cantSel=null;closeStation();
  /* штаб с управляющим */
  if(free.length)hireMgr(free[0]);
  G.mode="system";$hq.classList.add("open");hqRender();sweep("штаб",$hq);$hq.classList.remove("open");
  /* опись (M341): один стол вместо корабля и скафандра; с частью и запасом на нём */
  addPart(genPart(3021,3,slotsOf(G.shipId)[0]));
  kitShelf().push(kitPiece("helmet",2,1,7));
  tableToggle(true,"hold");sweep("опись",document.getElementById("tablewin"));tableToggle(false);
  /* стол */
  tableToggle(true);sweep("стол",document.getElementById("tablewin"));tableToggle(false);
  ok(seen>40,"кнопок обойдено: "+seen);
  eq(small.join(" | "),"","на экранах нет кнопок меньше 44 px");
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  G.mode="system";
}));

TEST_SUITES.push(()=>suite("экраны M302: метки целей у края не наезжают на эфирную строку и пульт",()=>{
  resetWorld();
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  G.mode="system";
  /* улететь так, чтобы звезда и станция оказались за кадром — тогда метки на краю */
  G.ship.x=9000;G.ship.y=-7000;G.ship.vx=0;G.ship.vy=0;G.ap=null;G.orbit=null;
  hud();
  let okDraw=true;try{drawSystem();}catch(e){okDraw=false;}
  ok(okDraw,"системный вид рисуется");
  ok(SYS_CHIPS.length>0,"метки у края есть: "+SYS_CHIPS.length);
  const dom=[];
  for(const sel of ["#console",".pads",".rail",".vitals",".locus","#prompt"]){
    const e=document.querySelector(sel);if(!e)continue;
    if(sel==="#prompt"&&!(e.textContent||"").trim())continue;
    const r=e.getBoundingClientRect();
    if(r.width>0&&r.height>0)dom.push({s:sel,x:r.x,y:r.y,w:r.width,h:r.height});
  }
  const hit=(a,b)=>!(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y);
  const clash=[];
  for(const c of SYS_CHIPS)for(const d of dom)if(hit(c,d))clash.push(Math.round(c.x)+","+Math.round(c.y)+"×"+d.s);
  eq(clash.join(", "),"","метки целей не наезжают на вёрстку");
  G.ship.x=0;G.ship.y=0;
}));
