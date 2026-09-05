/* ══════════════ нищий и двойной тычок (M354) ══════════════
   Сквозной набор жмёт всё, что нажимается, на БОГАТОМ мире: там у любой
   кнопки хватает и денег, и места, и топлива, и потому проверяется ровно
   счастливый путь. Игрок так не живёт. Он приходит к прилавку с нулём в
   кассе, полным трюмом и пустым баком — и жмёт, потому что не знает, что
   нельзя. И жмёт ДВАЖДЫ, потому что первый раз «не сработало».

   Отсюда три опыта, и в каждом проверяются одни и те же законы состояния:

   • деньги никогда не отрицательны — минус в кассе это не «долг», это дыра:
     сейв грузится через Math.max(0,…) и долг молча исчезает;
   • трюм никогда не переполнен, а каждая куча в нём — целое число ≥ 0;
   • бак и корпус остаются в своих пределах, и ни одно число не становится NaN;
   • денег из воздуха не приходит: у нищего с пустым трюмом продавать нечего.

   Двойной тычок здесь не украшение: он ловит «списали дважды, выдали один
   раз» и «купил на последние, а потом ещё раз» — то, чего одиночный тычок
   не увидит по устройству. */

/* законы состояния: список нарушений, пустой — значит всё цело */
function brLaws(){
  const bad=[],st=stat();
  if(!(G.credits>=0))bad.push("касса "+G.credits);
  if(!Number.isFinite(G.credits))bad.push("касса не число");
  if((G.matches|0)<0)bad.push("спички "+G.matches);
  if(!(G.fuel>=0)||G.fuel>st.fuelMax+.01)bad.push("бак "+G.fuel+" из "+st.fuelMax);
  if(!(G.hull>=0)||G.hull>st.hullMax+.01)bad.push("корпус "+G.hull+" из "+st.hullMax);
  if(!Number.isFinite(G.data)||G.data<0)bad.push("данные "+G.data);
  for(const k of RES_KEYS){
    const v=G.cargo[k];
    if(!Number.isFinite(v))bad.push("куча "+k+"="+v);
    else if(v<0)bad.push("куча "+k+" в минусе: "+v);
    else if(Math.abs(v-Math.round(v))>1e-9)bad.push("куча "+k+" дробная: "+v);
  }
  const h=held();
  if(h>st.cargoMax+.01)bad.push("трюм "+Math.round(h)+" из "+st.cargoMax);
  return bad;
}
/* тычок во всё на столе и на станции — каждая кнопка ДВАЖДЫ подряд.
   Возвращает {clicks, bad, rich} — rich это кнопки, после которых прибыло денег */
function brSweep(limit){
  const bad=[],rich=[];let clicks=0;
  const sweep=(tabsSel,bodySel,setTab,render,ru)=>{
    const tabs=[...document.querySelectorAll(tabsSel)].map(b=>b.dataset.tab);
    for(const t of tabs){
      try{ setTab(t); render(); }catch(e){ bad.push(ru+"/"+t+" · отрисовка: "+e.message); continue; }
      const els=e2eClickables(bodySel,limit||18);
      for(const el of els){
        const nm=ru+"/"+t+" · "+String(el.textContent||"").replace(/\s+/g," ").trim().slice(0,22);
        for(let twice=0;twice<2;twice++){
          const c0=G.credits;
          try{ el.click(); clicks++; }
          catch(e){ bad.push(nm+" · тычок "+(twice+1)+": "+e.message); break; }
          const sick=brLaws();
          if(sick.length)bad.push(nm+" · тычок "+(twice+1)+": "+sick.slice(0,2).join(", "));
          if(G.credits>c0)rich.push(nm+" +"+(G.credits-c0));
          if(sick.length)break;
        }
        try{ setTab(t); render(); }catch(e){ bad.push(nm+" · перерисовка: "+e.message); break; }
      }
    }
  };
  sweep("#tableTabs button","#tableBody",t=>{tableTab=t;},()=>tableRender(),"стол");
  tableTab="ether";
  if(G.sys.station){
    G.st=G.sys.station;G.mode="dock";
    sweep("#stTabs button","#stBody",t=>{tab=t;},()=>renderTab(),"станция");
    tab="market";G.mode="system";G.st=null;
  }
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  return {clicks,bad,rich};
}

TEST_SUITES.push(() => suite("нищий: с нулём в кассе и пустым трюмом двойной тычок ничего не ломает", () => {
  resetWorld(); fuzzRich();
  /* обобрать до нитки, но мир оставить прожитым: экраны должны рисоваться */
  G.credits=0;G.data=0;G.matches=0;G.fuel=0;G.hull=1;
  for(const k of RES_KEYS)G.cargo[k]=0;
  const r=brSweep(18);
  ok(r.clicks>60,"тычков у нищего: "+r.clicks);
  eq(r.bad.slice(0,5).join(" ;; "),"","у нищего ни одна кнопка не нарушила законов состояния"+
    (r.bad.length?" (всего "+r.bad.length+")":""));
  /* денег из воздуха: продавать нечего, а значит и приходить неоткуда помногу */
  const big=r.rich.filter(s=>+String(s).split("+").pop()>50000);
  eq(big.slice(0,3).join(" ;; "),"","нищему ни одна кнопка не насыпала денег из воздуха");
  eq(G.credits>=0,true,"касса после прогона не в минусе: "+G.credits);
  resetWorld();
}));

TEST_SUITES.push(() => suite("полный трюм: покупка и погрузка не пролезают сверх ёмкости", () => {
  resetWorld(); fuzzRich();
  const cap=stat().cargoMax;
  /* набить трюм под завязку одним сырьём и оставить деньги: соблазн есть, места нет */
  for(const k of RES_KEYS)G.cargo[k]=0;
  G.cargo[RES_KEYS[0]]=cap;
  G.credits=500000;
  eq(held(),cap,"трюм полон: "+held()+" из "+cap);
  const r=brSweep(18);
  ok(r.clicks>60,"тычков при полном трюме: "+r.clicks);
  eq(r.bad.slice(0,5).join(" ;; "),"","при полном трюме ни одна кнопка не переполнила его"+
    (r.bad.length?" (всего "+r.bad.length+")":""));
  ok(held()<=cap+.01,"трюм после прогона: "+Math.round(held())+" из "+cap);
  resetWorld();
}));

TEST_SUITES.push(() => suite("сдача части в лом дважды не платит дважды", () => {
  resetWorld(); fuzzRich();
  G.credits=1000;G.matches=0;G.inv=[];
  /* три части в трюме — руками, генератором игры */
  /* только через addPart: он и раздаёт id, а часть без id — это часть,
     которую partById найдёт по `undefined` и разберёт вместо неё соседнюю */
  for(let i=0;i<3;i++){const q=genPart(hashi(1234,i*7717,0x51A),3);if(q)addPart(q);}
  eq(G.inv.filter(q=>typeof q.id==="string").length,3,"у каждой части свой id");
  ok(G.inv.length===3,"частей в описи: "+G.inv.length);
  const id=G.inv[0].id,c0=G.credits,m0=G.matches|0;
  const a=scrapPart(id);
  const c1=G.credits,m1=G.matches|0;
  ok(c1>=c0,"первая сдача что-то дала: "+c0+" → "+c1);
  eq(G.inv.length,2,"часть ушла из описи");
  /* второй раз тем же id: части уже нет — и заплатить за неё нельзя */
  let threw="";
  try{ scrapPart(id); }catch(e){ threw=e.message; }
  eq(threw,"","повторная сдача не бросает");
  eq(G.credits,c1,"повторная сдача не платит второй раз");
  eq(G.matches|0,m1,"и спичек второй раз не даёт");
  eq(G.inv.length,2,"и опись не меняется");
  /* и сдача несуществующего id тоже никого не обогащает */
  try{ scrapPart("нет-такой"); }catch(e){ ok(false,"сдача несуществующей части бросает: "+e.message); }
  eq(G.credits,c1,"сдача несуществующей части не платит");
  resetWorld();
}));

TEST_SUITES.push(() => suite("устаревшая кнопка: ушедшая с экрана строка не платит второй раз", () => {
  /* Кнопка, которая после нажатия перерисовала экран, из документа УХОДИТ —
     но её обработчик жив, пока на неё кто-то ссылается: палец на телефоне
     успевает попасть по ней вторым тычком, а тесты жмут её напрямую.
     Договор простой: узел, покинувший документ, обязан быть пустым. Иначе
     разовая награда выдаётся дважды — а список, из которого её вычёркивают
     через `splice(indexOf(...))`, на второй раз получает −1 и вычёркивает
     ЧУЖУЮ строку (splice(-1,1) снимает последнюю). */
  resetWorld(); fuzzRich();
  const bad=[];let stale=0;
  const sweep=(tabsSel,bodySel,setTab,render,ru)=>{
    for(const t of [...document.querySelectorAll(tabsSel)].map(b=>b.dataset.tab)){
      try{ setTab(t); render(); }catch(e){ continue; }
      for(const el of e2eClickables(bodySel,16)){
        const nm=ru+"/"+t+" · "+String(el.textContent||"").replace(/\s+/g," ").trim().slice(0,20);
        const c0=G.credits,m0=G.matches|0,i0=G.inv.length;
        try{ el.click(); }catch(e){ continue; }
        if(document.contains(el))continue;         /* строка на месте — это не тот случай */
        stale++;
        const c1=G.credits,m1=G.matches|0,i1=G.inv.length;
        try{ el.click(); }catch(e){ bad.push(nm+" · повторный тычок бросил: "+e.message); continue; }
        /* повторная ПОКУПКА через ушедший узел — не беда: игрок вторым тычком
           попадёт по новой такой же кнопке и купит второй раз честно. Беда —
           повторная ВЫДАЧА: разовая награда, вычеркнутая из списка, выданная
           дважды. Поэтому краснеет только приход, а не расход. */
        if(G.credits>c1)bad.push(nm+" · заплатила игроку снова: "+c1+" → "+G.credits);
        else if((G.matches|0)>m1)bad.push(nm+" · выдала спички снова: "+m1+" → "+(G.matches|0));
        void c0;void m0;void i0;
        try{ setTab(t); render(); }catch(e){ break; }
      }
    }
  };
  sweep("#tableTabs button","#tableBody",t=>{tableTab=t;},()=>tableRender(),"стол");
  tableTab="ether";
  if(G.sys.station){
    G.st=G.sys.station;G.mode="dock";
    sweep("#stTabs button","#stBody",t=>{tab=t;},()=>renderTab(),"станция");
    tab="market";G.mode="system";G.st=null;
  }
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  ok(stale>0,"кнопок, ушедших с экрана после нажатия: "+stale);
  eq(bad.slice(0,5).join(" ;; "),"","ни одна ушедшая кнопка не сработала повторно"+
    (bad.length?" (всего "+bad.length+")":""));
  resetWorld();
}));

TEST_SUITES.push(() => suite("новичок: экраны первого часа рисуются и жмутся на пустом мире", () => {
  /* Все сквозные наборы смотрят на экраны БОГАТОГО мира (fuzzRich, e2eLate):
     там есть всё, и пустых состояний не видно. А первый час игрока — ровно
     наоборот: ни находок, ни людей, ни построек, и половина досок обязана
     сказать «пусто» вместо того, чтобы сломаться на первом же undefined.
     Мир здесь чистый, как после «начать заново», и жмётся всё подряд. */
  resetWorld();
  const bad=[];let clicks=0,drawn=0;
  const DIRT=/undefined|\bNaN\b|\[object /;
  const sweep=(tabsSel,bodySel,setTab,render,ru)=>{
    for(const t of [...document.querySelectorAll(tabsSel)].map(b=>b.dataset.tab)){
      try{ setTab(t); render(); drawn++; }
      catch(e){ bad.push(ru+"/"+t+" · отрисовка: "+e.message+" | "+String(e.stack||"").split("\n")[1]); continue; }
      const box=document.querySelector(bodySel);
      const s=box?(box.textContent||""):"";
      const m=DIRT.exec(s);
      if(m)bad.push(ru+"/"+t+" · мусор в тексте: …"+s.slice(Math.max(0,m.index-24),m.index+24).replace(/\s+/g," "));
      if(box&&!s.trim())bad.push(ru+"/"+t+" · доска пуста и молчит");
      for(const el of e2eClickables(bodySel,14)){
        try{ el.click(); clicks++; }catch(e){ bad.push(ru+"/"+t+" · тычок: "+e.message); break; }
        const sick=brLaws();
        if(sick.length){ bad.push(ru+"/"+t+" · после тычка: "+sick.slice(0,2).join(", ")); break; }
        try{ setTab(t); render(); }catch(e){ bad.push(ru+"/"+t+" · перерисовка: "+e.message); break; }
      }
    }
  };
  sweep("#tableTabs button","#tableBody",t=>{tableTab=t;},()=>tableRender(),"стол");
  tableTab="ether";
  if(G.sys.station){
    G.st=G.sys.station;G.mode="dock";
    sweep("#stTabs button","#stBody",t=>{tab=t;},()=>renderTab(),"станция");
    tab="market";G.mode="system";G.st=null;
  }
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  ok(drawn>20,"экранов пустого мира нарисовано: "+drawn);
  ok(clicks>10,"тычков на пустом мире: "+clicks);
  eq(bad.slice(0,5).join(" ;; "),"","первый час не ломается и не молчит"+(bad.length?" (всего "+bad.length+")":""));
  resetWorld();
}));
