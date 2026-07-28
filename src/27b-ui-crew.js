/* ══════════════ экран экипажа ══════════════ */
/* Наёмники раньше жили только во вкладке станции: нанял — и до следующей стыковки
   не видно ни где человек, ни что он делает, ни приносит ли он деньги. Экран
   открывается из полёта кнопкой ЭКИПАЖ, показывает баланс каждого, даёт приказ,
   приоритет по материалу, передачу своих модулей и режим наблюдения. */
const $cv=document.getElementById("crewview"),$cvBody=document.getElementById("cvBody");
function crewByIdG(id){return G.crew.find(c=>c.id===id)||null;}
/* кого сейчас видно в этой системе настоящим кораблём */
function allyOf(id){return (G.allies||[]).find(A=>A.c.id===id)||null;}
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
  document.getElementById("cvSub").textContent=
    "сектор "+G.sx+","+G.sy+" · нанимают на станциях";
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
    $cvBody.appendChild(el("div","sec",c.name.toUpperCase()+" · "+
      CREW_SPEC[c.spec].ru.toUpperCase()+(here?" · В ЭТОЙ СИСТЕМЕ":"")));
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
      (c.debt>0?" · <b style='color:#ff6b57'>долг "+Math.round(c.debt)+" кр</b>":"")+"</s>"));
    const bw=el("button","act sm"+(G.watch===c.id?"":" gold"),
      G.watch===c.id?"НЕ СЛЕДИТЬ":"СЛЕДИТЬ");
    bw.disabled=!here;
    bw.onclick=()=>watchCrew(c);
    r.appendChild(bw);
    $cvBody.appendChild(r);

    /* приказ */
    if(c.shipId){
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
