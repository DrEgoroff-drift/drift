/* ══════════════ ДЕЛО — одно место для всего, что на вас работает ══════════════
   Один вопрос игрока — «что на меня сейчас работает?» — до сих пор отвечался в
   четырёх разных местах: наёмники в ЭКИПАЖе, управляющие в ШТАБе, дроны в
   СТОЛ → РЕЙСЫ, базы в станции → ВЛАДЕНИЯ. Каждое из четырёх было право, когда
   его заводили; вместе они и есть то, что автор назвал «кашей»: «наёмники
   никуда не летали, непонятно», «проверь, как работают дроны» (30.08.2026).
   Ни одно из тех мест не врало — просто ни одно не отвечало целиком, а игрок
   не обязан знать, в каком ящике лежит какая часть его хозяйства.

   ДЕЛО не управляет ничем. Это СВОДКА: строка на каждого, кто на вас работает,
   с состоянием и деньгами, — и дорога в тот экран, где им и правда командуют.
   Поэтому здесь нет ни одной кнопки, меняющей мир: строка человека ведёт в его
   карточку, строка управляющего — в ШТАБ, а строка маршрута раскрывается тут
   же машинами (M288: со стола рейсы ушли, стол — для того, что читают).
   Список отвечает, экраны распоряжаются.

   Порядок разделов — по тому, кто чаще встаёт: люди, машины, места. */
const $dl=document.getElementById("dealview"),$dlBody=document.getElementById("dlBody");
/* какой маршрут раскрыт по машинам; null — все свёрнуты */
let dealRun=null;

/* ── сколько всего в деле ── одно число для кнопки и для шапки */
function dealCount(){
  return (G.crew?G.crew.length:0)+(G.mgrs?G.mgrs.length:0)+
         (G.drones?G.drones.length:0)+
         ((typeof baseList==="function")?baseList().length:0);
}
/* ── кто простаивает ── ради точки на кнопке: хозяйство, которое встало,
   обязано быть видно из полёта, а не только из открытого экрана */
function dealIdle(){
  let n=0;
  for(const c of (G.crew||[]))
    if(!c.shipId||!c.order||c.order.kind==="home"||c.hull<=0)n++;
  for(const d of (G.drones||[]))if(d.stuck)n++;
  return n;
}
function dealBtnTick(){
  const b=document.getElementById("dealbtn");if(!b)return;
  b.style.display=(dealCount()&&G.mode!=="dock")?"":"none";
  /* наблюдение за наёмником живёт здесь же: этот экран его и включает */
  if(G.watch&&typeof allyOf==="function"&&!allyOf(G.watch))G.watch=null;
  b.classList.toggle("on",!!G.watch||dealIdle()>0);
}
/* ── строка ── имя, состояние, деньги; вся строка и есть кнопка */
function dealRow(nm,state,money,col,go){
  const r=el("div","row");
  r.appendChild(el("div","nm","<b"+(col?" style='color:"+col+"'":"")+">"+nm+"</b><s>"+state+"</s>"));
  if(money)r.appendChild(el("div","qt",money[0]+"<s>"+money[1]+"</s>"));
  if(go){r.style.cursor="pointer";r.onclick=()=>{sfx("ui");go();};}
  $dlBody.appendChild(r);
  return r;
}
function dealRender(){
  if(typeof crewTick==="function")crewTick();
  document.getElementById("dlCr").textContent=Math.round(G.credits).toLocaleString("ru")+" кр";
  document.getElementById("dlCap").textContent="в деле "+dealCount();
  $dlBody.textContent="";
  const idle=dealIdle();
  document.getElementById("dlSub").textContent=
    idle?("простаивает: "+idle):"кто и что на вас работает";

  /* ── деньги одной строкой ──
     Она и есть ответ. Считаем только то, что игра считает сама: рейсы дронов —
     по маршрутам, жалованье — по людям. База копит руду, а не кредиты, и
     приписывать ей кр/мин было бы враньём. */
  let perMin=0,pay=0;
  const runs=(typeof droneRoutes==="function")?droneRoutes():[];
  for(const r of runs)perMin+=r.perMin;
  for(const c of (G.crew||[]))if(typeof crewPay==="function")pay+=crewPay(c);
  for(const m of (G.mgrs||[]))if(typeof mgrPay==="function")pay+=mgrPay(m);
  if(perMin||pay)
    $dlBody.appendChild(el("div","sec",
      "МАШИНЫ ПРИНОСЯТ ≈ "+Math.round(perMin).toLocaleString("ru")+" КР/МИН · "+
      "ЛЮДЯМ ПЛАТИТЕ "+Math.round(pay).toLocaleString("ru")+" КР/МИН"));

  /* ── люди ── */
  const crew=G.crew||[],mgrs=G.mgrs||[];
  if(crew.length||mgrs.length){
    $dlBody.appendChild(el("div","sec","ЛЮДИ · "+(crew.length+mgrs.length)));
    for(const c of crew){
      const S=c.shipId?shipData(c.shipId):null;
      const bal=(c.earned||0)-(c.spent||0);
      let st,col="";
      if(c.state==="hostage"){st="в плену · выкуп "+(c.ransom||0).toLocaleString("ru")+" кр";col="#ff6b57";}
      else if(c.state==="away"){st="в загуле · жалованье не идёт";col="#f2b25c";}
      else if(!c.shipId){st="не выдан корабль — не работает и не получает";col="#ff9d7a";}
      else if(!c.order||c.order.kind==="home"){st="на приколе — приказа нет";col="#ff9d7a";}
      else if(c.hull<=0){st="корпус разбит — стоит";col="#ff9d7a";}
      else st=ORDERS[c.order.kind].ru.toLowerCase()+" · сектор "+c.order.sx+","+c.order.sy+
              " · «"+(S?S.ru:"—")+"» "+Math.round(c.hull)+"/"+Math.round(c.hullMax);
      dealRow(c.name+" · "+CREW_SPEC[c.spec].ru,st,
        [(bal>=0?"+":"")+bal.toLocaleString("ru"),"кр итог"],col,
        ()=>{closeDeal();openCrewView(c);});
    }
    for(const m of mgrs){
      const R=(typeof MGR_ROLES!=="undefined")?MGR_ROLES[m.role]:null;
      const loy=m.loy|0;
      const st=(R?R.ru:"управляющий")+" · верность "+loy+
        ((typeof mgrPoints==="function"&&mgrPoints(m)>0)?" · есть невыбранное очко":"")+
        (loy<35?" · мрачнеет":"");
      dealRow(m.name,st,
        [(typeof mgrPay==="function")?("−"+mgrPay(m)):"—","кр/мин"],
        loy<35?"#ff9d7a":"",
        ()=>{closeDeal();if(typeof openHq==="function")openHq();});
    }
  }

  /* ── машины ── маршрутами, а не поштучно: так на них и смотрят */
  if(runs.length||(G.droneInventory|0)){
    $dlBody.appendChild(el("div","sec","МАШИНЫ · "+((G.drones||[]).length)+
      ((G.droneInventory|0)?(" · В ЗАПАСЕ "+(G.droneInventory|0)):"")));
    runs.sort((a,b)=>b.perMin-a.perMin);
    for(const r of runs){
      const res=RES[r.res]||{ru:String(r.res||"груз")};
      const st=res.ru.toLowerCase()+" · в точке осталось "+r.pool+
        (r.stuck?(" · "+r.stuck+" стоит: систему закрыли пираты"):"")+
        (r.down?(" · "+r.down+" в ремонте"):"");
      const open=(dealRun===r.key);
      dealRow(r.from+" → «"+r.to+"» · "+r.drones.length+" "+
        pl3(r.drones.length,"дрон","дрона","дронов"),st,
        ["≈"+Math.round(r.perMin).toLocaleString("ru"),"кр/мин"],
        r.stuck?"#ff9d7a":"",
        ()=>{dealRun=open?null:r.key;dealRender();});
      /* машины маршрута — здесь же, а не на столе: раньше строка уводила в
         СТОЛ → РЕЙСЫ, то есть ровно в то разбегание по экранам, ради которого
         ДЕЛО и заводили (M286). Стол — для того, что читают. */
      if(open)for(const d of r.drones)
        $dlBody.appendChild(el("div","row","<div class='nm'><s>"+droneName(d)+" · "+
          droneStateRu(d)+" · кругов "+(d.trips|0)+" · заработал "+
          (d.earned|0).toLocaleString("ru")+" кр</s></div>"));
    }
    if(!runs.length)
      $dlBody.appendChild(el("div","row","<div class='nm'><s>в рейсе никого: дрон ставят "+
        "на залежь с грунта или на астероид в поясе — кнопка ДРОН появляется, "+
        "когда стоишь у точки</s></div>"));
  }

  /* ── места ── база копит руду, а не деньги: так и говорим */
  const bases=(typeof baseList==="function")?baseList():[];
  if(bases.length){
    $dlBody.appendChild(el("div","sec","МЕСТА · "+bases.length));
    for(const B of bases){
      const staff=(typeof baseStaff==="function")?baseStaff(B).length:0;
      const held=(typeof basePoolHeld==="function")?basePoolHeld(B):0;
      dealRow("База «"+B.name+"»",
        "сектор "+B.sx+","+B.sy+" · людей "+staff+" · в закромах "+held+
        (B.quiet?" · батарея обесточена, оборона молчит":""),
        null,B.quiet?"#ff9d7a":"",null);
    }
  }

  /* холдинг (M291): каждая постройка — строка; тычок ведёт курс к ней */
  const holdL=((typeof holdDealList==="function")?holdDealList():[]).concat((typeof bargeDealList==="function")?bargeDealList():[]);
  if(holdL.length){
    $dlBody.appendChild(el("div","sec","ХОЛДИНГ · "+holdL.length));
    for(const h of holdL)dealRow(h.nm,h.state,null,"",(typeof gotoSector==="function")?()=>gotoSector(h.sx,h.sy):null);
  }
  if(!crew.length&&!mgrs.length&&!runs.length&&!bases.length&&!holdL.length&&!(G.droneInventory|0))
    $dlBody.appendChild(el("div","row","<div class='nm'><s>на вас пока никто не работает. "+
      "Наёмник ищет работу на станции (ЛЮДИ → ЭКИПАЖ), управляющий сидит в кантине, "+
      "дрона покупают на верфи, база строится с грунта.</s></div>"));
}
function openDeal(){
  for(const k in keys)keys[k]=false;
  document.querySelectorAll(".pads button").forEach(b=>b.classList.remove("on"));
  if(typeof toggleLog==="function")toggleLog(false);
  $dl.classList.add("open");dealRender();
}
function closeDeal(){$dl.classList.remove("open");}
{
  const b=document.getElementById("dealbtn");
  if(b)b.addEventListener("click",()=>{
    /* кнопка работает и как выход из наблюдения — из режима камеры всегда есть
       очевидный путь назад (перешло от ЭКИПАЖа вместе с самим наблюдением) */
    if(G.watch){G.watch=null;say("Камера вернулась к кораблю");return;}
    openDeal();
  });
  const c=document.getElementById("dlClose");
  if(c)c.addEventListener("click",()=>{closeDeal();saveGame(true);});
}
