/* ══════════════ экран экипажа ══════════════ */
/* Наёмники раньше жили только во вкладке станции: нанял — и до следующей стыковки
   не видно ни где человек, ни что он делает, ни приносит ли он деньги. Экран
   открывается из полёта кнопкой ЭКИПАЖ, показывает баланс каждого, даёт приказ,
   приоритет по материалу, передачу своих модулей и режим наблюдения. */
const $cv=document.getElementById("crewview"),$cvBody=document.getElementById("cvBody");
/* кого сейчас видно в этой системе настоящим кораблём */
function allyOf(id){return (G.allies||[]).find(A=>A.c.id===id)||null;}
/* ── скрытая удача наружу ──
   По умолчанию её не видно нигде и никогда: наёмник — ставка, и в этом весь он.
   Открывают её только три вещи, и каждая стоит игроку выбора: «чутьё» показывает
   вилку, «точный счёт» — число, «Чёрный журнал» — число сразу у всех.
   Это и есть обещанное в замысле «самый важный перк в игре»: он превращает
   непознаваемый шум в информацию, и стоит не кредитов, а уровней. */
function luckLine(c){
  const exact=mgrPerkOf("cmd","exact")||relicOn("ledger");
  const fork=mgrPerkOf("cmd","hunch");
  if(!exact&&!fork)return "";
  const L=crewLuck(c);
  if(exact)return "<br>скрытая удача: <b style='color:"+
    (L>=1.15?"#8fd08a":(L>=.9?"#f2b25c":"#ff9d7a"))+"'>"+L.toFixed(2)+"</b>";
  /* вилка нарочно широкая и своя у каждого: чутьё — не точный счёт */
  const w=.18+((c.seed||0)%7)*.02;
  return "<br>чутьё: удача около <b>"+Math.max(.5,L-w).toFixed(1)+"…"+(L+w).toFixed(1)+"</b>";
}
function crewBtnTick(){
  const b=document.getElementById("crewbtn");if(!b)return;
  const show=G.crew.length>0&&G.mode!=="dock";
  b.style.display=show?"":"none";
  if(G.watch&&!allyOf(G.watch))G.watch=null;
  b.classList.toggle("on",!!G.watch);
}
/* ── наблюдение: камера системы едет за наёмником, управление кораблём не трогаем ── */
function watchCrew(c){
  const A=allyOf(c.id);
  if(!A){
    say(c.name+" сейчас не в этой системе\nсектор "+c.order.sx+","+c.order.sy);
    return;
  }
  G.watch=(G.watch===c.id)?null:c.id;
  $cv.classList.remove("open");
  say(G.watch?"Наблюдение: "+c.name+"\nповторное нажатие ЭКИПАЖ — обратно"
             :"Камера вернулась к кораблю");
}
function crewRender(){
  crewTick();
  document.getElementById("cvCr").textContent=G.credits.toLocaleString("ru")+" кр";
  document.getElementById("cvCap").textContent=G.crew.length+" / "+crewCap()+" мест";
  const hs=crewHostages();
  document.getElementById("cvSub").textContent=hs.length
    ? "в плену: "+hs.map(c=>c.name).join(", ")
    : "сектор "+G.sx+","+G.sy+" · платите за риск, а не за доход";
  $cvBody.textContent="";
  if(!G.crew.length){
    $cvBody.appendChild(el("div","sec","ПОКА НИКОГО · НАЙМИТЕ НА СТАНЦИИ, ВКЛАДКА ЭКИПАЖ"));
    return;
  }
  for(const c of G.crew){
    const S=c.shipId?shipData(c.shipId):null;
    const hold=crewHold(c),cap=crewCargoMax(c);
    const here=!!allyOf(c.id);
    const bal=(c.earned||0)-(c.spent||0);
    const tag=c.state==="hostage"?" · В ПЛЕНУ":(c.state==="away"?" · В ЗАГУЛЕ":
              (here?" · В ЭТОЙ СИСТЕМЕ":""));
    $cvBody.appendChild(el("div","sec",c.name.toUpperCase()+" · "+
      CREW_SPEC[c.spec].ru.toUpperCase()+tag));
    const r=el("div","row");
    r.appendChild(el("div","nm","<s>приказ: <b>"+ORDERS[c.order.kind].ru+
      "</b> · сектор "+c.order.sx+","+c.order.sy+
      "<br>корабль: "+(S?"«"+S.ru+"» корпус "+Math.round(c.hull)+"/"+Math.round(c.hullMax)
                        :"<b style='color:#ff9d7a'>не выдан — он не может работать</b>")+
      (cap?" · трюм "+hold+"/"+cap:"")+
      "<br>жалованье "+crewPay(c)+" кр/мин · заработал "+(c.earned||0).toLocaleString("ru")+
      " кр · съел "+(c.spent||0).toLocaleString("ru")+" кр"+
      "<br>итог: <b style='color:"+(bal>=0?"#8fd08a":"#ff6b57")+"'>"+
      (bal>=0?"+":"")+bal.toLocaleString("ru")+" кр</b>"+
      (c.debt>0?" · <b style='color:#ff6b57'>долг "+Math.round(c.debt)+" кр</b>":"")+
      luckLine(c)+"</s>"));
    const bw=el("button","act sm"+(G.watch===c.id?"":" gold"),
      G.watch===c.id?"НЕ СЛЕДИТЬ":"СЛЕДИТЬ");
    bw.disabled=!here;
    bw.onclick=()=>watchCrew(c);
    r.appendChild(bw);
    $cvBody.appendChild(r);

    /* ── плен: выкуп или штурм ── */
    if(c.state==="hostage"){
      const rh=el("div","row");
      rh.appendChild(el("div","nm","<b style='color:#ff6b57'>В ПЛЕНУ</b><s>"+
        "держат в секторе "+c.ransomSx+","+c.ransomSy+" · выкуп растёт, пока вы тянете"+
        "<br>можно не платить: возьмите пиратскую базу в этом секторе на абордаж — "+
        "штурм освобождает даром</s>"));
      const b=el("button","act gold","ВЫКУП "+(c.ransom||0).toLocaleString("ru")+" кр");
      b.disabled=G.credits<(c.ransom||0);
      b.onclick=()=>{if(ransomPay(c))crewRender();};
      rh.appendChild(b);$cvBody.appendChild(rh);
    }else if(c.state==="away"){
      const left=Math.max(0,Math.ceil(((c.stateUntil||0)-Date.now())/3600000));
      $cvBody.appendChild(el("div","row","<div class='nm'><b>В ЗАГУЛЕ</b><s>вернётся примерно через "+
        left+" ч · жалованье за это время не идёт</s></div>"));
    }

    /* ── ставка: чем рискованнее приказ, тем длиннее оба хвоста ── */
    if(c.shipId){
      const rr2=el("div","row");
      rr2.appendChild(el("div","nm","<b>Как работать</b><s>риск двигает и провалы, и находки; "+
        "осторожно — ровно и скучно, отчаянно — как повезёт</s>"));
      const RISKS=[["safe","ОСТОРОЖНО"],["norm","ОБЫЧНО"],["bold","ОТЧАЯННО"]];
      for(const [k,lab] of RISKS){
        const b=el("button","act sm"+((c.risk||"norm")===k?"":" gold"),lab);
        b.disabled=(c.risk||"norm")===k;
        b.onclick=()=>{c.risk=k;crewRender();};
        rr2.appendChild(b);
      }
      $cvBody.appendChild(rr2);
    }

    /* ── история: единственный способ понять, везучий он или нет ── */
    if(c.hist&&c.hist.length){
      const COL={cat:"#ff6b57",bad:"#ff9d7a",norm:"var(--dim)",good:"#8fd08a",jack:"#f2b25c"};
      const rows=c.hist.slice(0,6).map(h=>
        "<span style='color:"+(COL[h.cat]||"var(--dim)")+"'>• "+h.ru+"</span>").join("<br>");
      $cvBody.appendChild(el("div","row","<div class='nm'><b>Последние рейсы</b><s>"+
        "всего рейсов: "+(c.trips||0)+"<br>"+rows+"</s></div>"));
    }else{
      $cvBody.appendChild(el("div","row","<div class='nm'><s>рейсов ещё не было — "+
        "каков он на деле, покажет только работа</s></div>"));
    }

    /* приказ */
    if(c.state==="hostage"){/* пока он у пиратов, приказывать некому */}
    else if(c.shipId){
      const ro=el("div","row");
      ro.appendChild(el("div","nm","<b>Приказ</b><s>"+ORDERS[c.order.kind].note+
        "<br>район берётся по системе, где вы сейчас</s>"));
      for(const k in ORDERS){
        if(ORDERS[k].spec&&ORDERS[k].spec!==c.spec)continue;
        if(k==="base")continue;
        const b=el("button","act sm"+(c.order.kind===k?"":" gold"),ORDERS[k].ru.toUpperCase());
        b.disabled=c.order.kind===k&&c.order.sx===G.sx&&c.order.sy===G.sy;
        b.onclick=()=>{crewOrder(c,k);crewRender();};
        ro.appendChild(b);
      }
      $cvBody.appendChild(ro);
    }else{
      const free=Object.keys(G.owned).filter(id=>id!==G.shipId&&!G.crew.some(o=>o.shipId===id));
      const rr=el("div","row");
      rr.appendChild(el("div","nm","<b>Выдать корабль</b><s>"+
        (free.length?"без корпуса приказ не выполняется — и жалованья тоже нет"
                    :"свободных корпусов нет: купите второй на верфи или пересядьте")+"</s>"));
      for(const id of free.slice(0,3)){
        const d=shipData(id);
        const b=el("button","act sm gold",(d?d.ru:id).toUpperCase());
        b.onclick=()=>{crewAssignShip(c,id);crewRender();};
        rr.appendChild(b);
      }
      $cvBody.appendChild(rr);
    }

    /* приоритет по материалу — только добытчику: остальным нечего выбирать */
    if(c.spec==="mine"){
      const sys=getSystem(c.order.sx,c.order.sy);
      const pool=sys.belt?sys.belt.res:(sys.planets.length?sys.planets[0].res:["iron"]);
      const rp=el("div","row");
      rp.appendChild(el("div","nm","<b>Что добывать</b><s>«всё» — берёт что попадётся; "+
        "выбранное сырьё копает только если оно есть в районе<br>в районе: "+
        pool.map(k=>RES[k].ru.toLowerCase()).join(", ")+"</s>"));
      const mk=(key,label)=>{
        const b=el("button","act sm"+((c.pref||"all")===key?"":" gold"),label);
        b.disabled=(c.pref||"all")===key;
        b.onclick=()=>{c.pref=key;crewRender();};
        rp.appendChild(b);
      };
      mk("all","ВСЁ");
      for(const k of pool)mk(k,RES[k].ru.toUpperCase());
      $cvBody.appendChild(rp);
    }

    /* передача модулей: снятые уровни игрока работают у наёмника */
    for(const k in CREW_MODS){
      const M=CREW_MODS[k],lv=crewModLv(c,k),spare=spareModLv(k);
      const rm=el("div","row");
      rm.appendChild(el("div","nm","<b>"+M.ru+"</b><s>"+M.note+
        " · у него уровень "+lv+" · свободно у вас "+spare+
        (spare===0&&lv===0?"<br>снимите уровень на станции (МОДУЛИ, кнопка −) — и его можно отдать":"")+
        "</s>"));
      const bm=el("button","act sm","−");
      bm.disabled=lv<=0;
      bm.onclick=()=>{crewGiveMod(c,k,-1);crewRender();};
      const bp=el("button","act sm"+(spare>0?" gold":""),"+");
      bp.disabled=spare<=0;
      bp.onclick=()=>{crewGiveMod(c,k,1);crewRender();};
      rm.appendChild(bm);rm.appendChild(bp);
      $cvBody.appendChild(rm);
    }
  }
}
function openCrewView(){
  for(const k in keys)keys[k]=false;
  document.querySelectorAll(".pads button").forEach(b=>b.classList.remove("on"));
  toggleLog(false);
  $cv.classList.add("open");crewRender();
}
document.getElementById("crewbtn").addEventListener("click",()=>{
  /* кнопка работает и как выход из наблюдения — так из режима камеры
     всегда есть очевидный путь назад */
  if(G.watch){G.watch=null;say("Камера вернулась к кораблю");return;}
  openCrewView();
});
document.getElementById("cvClose").addEventListener("click",()=>{
  $cv.classList.remove("open");saveGame(true);});
