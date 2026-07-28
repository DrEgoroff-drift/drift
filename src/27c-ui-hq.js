/* ══════════════ ШТАБ и кантина ══════════════ */
/* Наёмники живут списком строк, и это честно: они безличны. Управляющий — нет,
   поэтому у него свой экран, где первое, что видно, — лицо, а не цифра. */
const $hq=document.getElementById("hqview"),$hqBody=document.getElementById("hqBody");
let hqSel=null;
function faceEl(m,size){
  const cn=mgrFace(m,size);
  const w=el("div","face");
  w.style.cssText="flex:0 0 auto;width:"+size+"px;height:"+size+"px;line-height:0";
  w.appendChild(cn);
  return w;
}
function loyWord(m){
  const l=m.loy;
  return l>=80?"предан":l>=60?"ровно":l>=40?"холодно":l>=20?"на грани":"уходит";
}
function loyBar(m){
  const l=clamp(m.loy,0,100);
  const col=l>=60?"#8fd08a":(l>=30?"#f2b25c":"#ff6b57");
  return "<span style='display:inline-block;width:78px;height:4px;background:rgba(255,255,255,.12);"+
    "vertical-align:middle'><i style='display:block;height:4px;width:"+l.toFixed(0)+"%;background:"+
    col+"'></i></span> <span style='color:"+col+"'>"+loyWord(m)+"</span>";
}
function mgrHead(m){
  const R=MGR_ROLES[m.role],lv=mgrLevel(m),nx=mgrNext(m);
  return "<b style='color:"+R.col+"'>"+m.name+"</b><s>"+R.ru.toLowerCase()+" · уровень "+lv+
    (nx?" · до следующего "+Math.max(0,Math.round(nx-(m.xp||0)))+" оп":" · потолок")+
    "<br>"+loyBar(m)+" · доля "+(mgrCut(m)*100).toFixed(1)+"% · оклад "+mgrPay(m)+" кр/мин"+
    "<br>"+m.traits.map(t=>mgrTrait(t).ru).join(" · ")+"</s>";
}
/* ── кантина ──
   Не список найма, а место: те же 2–4 человека держатся на seed станции и
   временном бакете. Разговор бесплатен, но кандидат после него занят до
   следующего бакета — «подумать и вернуться» стоит именно этого. */
function renderCantina(){
  mgrTick();
  const T=stTypeOf(G.st.stype);
  $body.appendChild(el("div","sec","КАНТИНА «"+G.st.name.toUpperCase()+"» · МЕСТ "+
    G.mgrs.length+" / "+MGR_CAP+" · ОДИН ДОМЕН — ОДИН УПРАВЛЯЮЩИЙ"));
  $body.appendChild(el("div","row","<div class='nm'><s>здесь сидят те, кто берёт домен целиком, "+
    "а не приказ на рейс. Они дороже наёмника втрое и берут долю с того, что приносит "+
    "их домен — зато рутину держат сами.<br>кто сюда заходит, зависит от станции: "+
    T.ru.toLowerCase()+" собирает своих</s></div>"));
  G.cantina=G.cantina&&G.cantina.key===G.sys.key?G.cantina:{key:G.sys.key,list:stationMgrs(G.sys),talked:{}};
  for(const m of G.cantina.list){
    if(G.mgrs.some(x=>x.seed===m.seed))continue;
    const R=MGR_ROLES[m.role],taken=mgrTaken(m.role),fee=mgrFee(m);
    const spoke=!!G.cantina.talked[m.id];
    const known=spoke||mgrPerkOf("cmd","read");
    const r=el("div","row");
    r.appendChild(faceEl(m,64));
    r.appendChild(el("div","nm","<b style='color:"+R.col+"'>"+m.name+"</b><s>"+
      R.ru.toLowerCase()+" · "+R.note+
      "<br>уровень "+mgrLevel(m)+" · оклад "+mgrPay(m)+" кр/мин · доля "+(mgrCut(m)*100).toFixed(1)+"%"+
      "<br>"+(known
        ? "черты: "+m.traits.map(t=>"<b>"+mgrTrait(t).ru+"</b> — "+mgrTrait(t).note).join("<br>черты: ")
        : "черты видны после разговора"+(m.traits.length>2?" (их у него три)":""))+
      (taken?"<br><b style='color:#ff9d7a'>домен занят: "+mgrOf(m.role).name+"</b>":"")+"</s>"));
    if(!spoke&&!mgrPerkOf("cmd","read")){
      const bt=el("button","act sm","ПОГОВОРИТЬ");
      bt.onclick=()=>{G.cantina.talked[m.id]=1;renderTab();};
      r.appendChild(bt);
    }
    const b=el("button","act"+(taken?"":" gold"),fee.toLocaleString("ru")+" кр");
    b.disabled=taken||G.credits<fee||G.mgrs.length>=MGR_CAP;
    b.onclick=()=>{if(hireMgr(m)){hqSel=m.id;renderTab();}};
    r.appendChild(b);
    $body.appendChild(r);
  }
  $body.appendChild(el("div","sec","СОСТАВ КАНТИНЫ МЕНЯЕТСЯ САМ · ЭКРАН ШТАБ — ПЕРКИ И ПРИКАЗЫ"));
}
/* ── экран ШТАБ ── */
function hqBtnTick(){
  const b=document.getElementById("hqbtn");if(!b)return;
  b.style.display=(G.mgrs.length&&G.mode!=="dock")?"":"none";
  /* точка на кнопке: есть невыбранное очко перка или кто-то мрачнеет */
  const nag=G.mgrs.some(m=>mgrPoints(m)>0||m.loy<35);
  b.classList.toggle("on",nag);
}
function hqRender(){
  mgrTick();
  document.getElementById("hqCr").textContent=G.credits.toLocaleString("ru")+" кр";
  document.getElementById("hqCap").textContent=G.mgrs.length+" / "+MGR_CAP+" мест";
  let upkeep=0;for(const m of G.mgrs)upkeep+=mgrPay(m);
  document.getElementById("hqSub").textContent=G.mgrs.length
    ? "содержание "+upkeep+" кр/мин · доля снимается с домена сверх этого"
    : "домены пусты — управляющих нанимают в кантине станции";
  $hqBody.textContent="";
  if(!G.mgrs.length){
    $hqBody.appendChild(el("div","sec","НИКОГО · КАНТИНА ЕСТЬ НА ЛЮБОЙ СТАНЦИИ, КРОМЕ ЗАПРАВОЧНОЙ"));
    $hqBody.appendChild(el("div","row","<div class='nm'><s>управляющий берёт домен целиком: "+
      "звено наёмников, дроны и базы, торговый маршрут или лабораторию. Он не ускоряет "+
      "ранний старт — он поднимает потолок, когда потолок уже мешает.</s></div>"));
    return;
  }
  if(!G.mgrs.some(m=>m.id===hqSel))hqSel=G.mgrs[0].id;
  /* колонка людей: портреты, а не строки — мрачное лицо видно раньше полосы */
  const strip=el("div","row");
  strip.style.flexWrap="wrap";
  for(const m of G.mgrs){
    const w=el("div","");
    w.style.cssText="cursor:pointer;text-align:center;opacity:"+(m.id===hqSel?"1":".55");
    w.appendChild(mgrFace(m,64));
    w.appendChild(el("div","","<s style='font-size:8px;color:var(--dim);text-decoration:none'>"+
      m.name+(mgrPoints(m)>0?" <b style='color:#f2b25c'>•</b>":"")+"</s>"));
    w.onclick=()=>{hqSel=m.id;hqRender();};
    strip.appendChild(w);
  }
  $hqBody.appendChild(strip);
  const m=G.mgrs.find(x=>x.id===hqSel);
  const R=MGR_ROLES[m.role];
  $hqBody.appendChild(el("div","sec",m.name.toUpperCase()+" · "+R.ru.toUpperCase()+
    " · ДОМЕН: "+R.dom.toUpperCase()));
  const head=el("div","row");
  head.appendChild(faceEl(m,96));
  head.appendChild(el("div","nm",mgrHead(m)));
  $hqBody.appendChild(head);
  /* сводка домена: сколько он взял и что сделал — иначе доля выглядит грабежом */
  $hqBody.appendChild(el("div","row","<div class='nm'><b>Домен</b><s>"+
    mgrDomainLine(m)+"<br>взял долей: "+(m.tookCr||0).toLocaleString("ru")+" кр"+
    (m.stole?" · <b style='color:#ff9d7a'>сверх того «потерялось» "+m.stole.toLocaleString("ru")+" кр</b>":"")+
    "<br>отдал вам: "+(m.earned||0).toLocaleString("ru")+" кр · съел окладом "+
    (m.spent||0).toLocaleString("ru")+" кр</s></div>"));
  /* его лента: домен рассказывает о себе сам, а не молчит между уровнями */
  if(m.log&&m.log.length){
    const COL={warn:"#ff9d7a",good:"#8fd08a"};
    $hqBody.appendChild(el("div","row","<div class='nm'><b>Что он говорит</b><s>"+
      m.log.map(e=>"<span style='color:"+(COL[e.k]||"var(--dim)")+"'>• "+e.s+"</span>").join("<br>")+
      "</s></div>"));
  }
  /* перки: дерево видно целиком, включая невыученное — игрок должен планировать */
  const pts=mgrPoints(m);
  $hqBody.appendChild(el("div","sec","ПЕРКИ · СВОБОДНЫХ ОЧКОВ "+pts+
    " · ВЕТВЕЙ БОЛЬШЕ, ЧЕМ ОЧКОВ: ВЫУЧИТЬ ВСЁ НЕЛЬЗЯ"));
  for(const br of MGR_PERKS[m.role]){
    $hqBody.appendChild(el("div","sec",br.ru.toUpperCase()));
    br.list.forEach((p,i)=>{
      const have=mgrPerk(m,p.id);
      /* по ветви идут по порядку: перк открыт, если предыдущий уже взят */
      const open=i===0||mgrPerk(m,br.list[i-1].id);
      const r=el("div","row"+(have?" on":""));
      r.appendChild(el("div","nm","<b"+(have?" style='color:"+R.col+"'":"")+">"+p.ru+
        (have?" ✓":"")+"</b><s>"+p.note+(!open&&!have?" · сначала «"+br.list[i-1].ru+"»":"")+"</s>"));
      if(!have){
        const b=el("button","act sm"+(open&&pts>0?" gold":""),"ВЫУЧИТЬ");
        b.disabled=!open||pts<=0;
        b.onclick=()=>{if(mgrLearn(m,p.id))hqRender();};
        r.appendChild(b);
      }
      $hqBody.appendChild(r);
    });
  }
  /* стоящие приказы: слотов всегда меньше, чем правил */
  $hqBody.appendChild(el("div","sec","СТОЯЩИЕ ПРИКАЗЫ · "+m.rules.length+" / "+mgrSlots(m)+
    " СЛОТОВ · ЭТО И ЕСТЬ СНЯТАЯ РУТИНА"));
  for(const rl of MGR_RULES[m.role]){
    const on=mgrRule(m,rl.id);
    const r=el("div","row"+(on?" on":""));
    r.appendChild(el("div","nm","<b>"+(on?"● ":"○ ")+rl.ru+"</b>"));
    const b=el("button","act sm"+(on?"":" gold"),on?"СНЯТЬ":"В СЛОТ");
    b.onclick=()=>{if(mgrToggleRule(m,rl.id))hqRender();};
    r.appendChild(b);
    $hqBody.appendChild(r);
  }
  /* флагман: старые корпуса из ангара снова становятся решением */
  if(m.role==="cmd"){
    const S=m.shipId?shipData(m.shipId):null;
    const free=Object.keys(G.owned).filter(id=>id!==G.shipId&&
      !G.crew.some(c=>c.shipId===id)&&!G.mgrs.some(o=>o.shipId===id));
    const r=el("div","row");
    r.appendChild(el("div","nm","<b>Флагман</b><s>"+
      (S?"«"+S.ru+"» · звено вмещает "+Math.max(2,Math.floor(S.cargo/60))+" человек"
        :"без корабля он командует с чужой палубы — и на уходе ему нечего забрать")+
      "</s>"));
    for(const id of free.slice(0,3)){
      const d=shipData(id);
      const b=el("button","act sm gold",(d?d.ru:id).toUpperCase());
      b.onclick=()=>{m.shipId=id;mgrSay(m,"Принял «"+(d?d.ru:id)+"» под флаг","good");hqRender();};
      r.appendChild(b);
    }
    $hqBody.appendChild(r);
  }
  /* чертежи исследователя: ошибочный виден только как «что-то не так» */
  if(m.role==="sci"){
    $hqBody.appendChild(el("div","sec","ЧЕРТЕЖИ · ИХ НЕЛЬЗЯ КУПИТЬ · ВЫВОД БЫВАЕТ ОШИБОЧНЫМ"));
    let any=false;
    for(const k in BLUEPRINTS){
      const s=bpState(k);if(!s)continue;any=true;
      const B=BLUEPRINTS[k];
      const r=el("div","row");
      r.appendChild(el("div","nm","<b>"+B.ru+"</b><s>"+(s>0?B.note:"работает не так, как обещано")+"</s>"));
      const b=el("button","act sm","ПЕРЕСБОРКА · 60 ДАННЫХ");
      b.disabled=G.data<60||s>0;
      b.onclick=()=>{if(bpRecheck(k))hqRender();};
      r.appendChild(b);
      $hqBody.appendChild(r);
    }
    if(!any)$hqBody.appendChild(el("div","row","<div class='nm'><s>чертежей пока нет — "+
      "нужен перк «чертежи» и редкое сырьё в трюме как образцы</s></div>"));
  }
  /* расчёт: дорогой намеренно — с управляющим живут, а не перебирают */
  const rf=el("div","row");
  rf.appendChild(el("div","nm","<b>Расчёт</b><s>выходное пособие "+
    mgrSeverance(m).toLocaleString("ru")+" кр · перки и уровень уйдут с ним"+
    (m.shipId?"<br>флагман вернётся в ангар":"")+"</s>"));
  const bf=el("button","act sm","РАССЧИТАТЬ");
  bf.disabled=G.credits<mgrSeverance(m);
  bf.onclick=()=>{if(fireMgr(m)){hqSel=null;hqRender();}};
  rf.appendChild(bf);
  $hqBody.appendChild(rf);
}
/* одна строка про то, чем домен занят прямо сейчас */
function mgrDomainLine(m){
  if(m.role==="cmd"){
    const n=G.crew.filter(c=>c.shipId&&c.order&&c.order.kind!=="home").length;
    return n?"под ним работает "+n+" из "+G.crew.length+" наёмников":
      "звено пустое: наймите людей на станции и выдайте корабли";
  }
  if(m.role==="keep")
    return "дронов в работе: "+(G.drones||[]).length+" · баз: "+Object.keys(G.bases||{}).length;
  if(m.role==="fact")
    return m.route.length>=2
      ? "маршрут из "+m.route.length+" плеч (макс "+mgrRouteMax(m)+"): "+m.route.join(" → ")+
        (mgrRule(m,"run")?"":"<br><b style='color:#ff9d7a'>приказ «водить постоянно» не в слоте — маршрут стоит</b>")
      : "плеч мало: маршрут строится из станций, куда вы прилетали сами";
  return "разобрано образцов на "+(m.gotData||0)+" данных · в трюме образцов: "+mgrSamples()+
    (mgrRule(m,"rare")?"":"<br>приказ «забрать редкое сырьё» не в слоте — работает вхолостую");
}
function openHq(){
  for(const k in keys)keys[k]=false;
  document.querySelectorAll(".pads button").forEach(b=>b.classList.remove("on"));
  toggleLog(false);
  $hq.classList.add("open");hqRender();
}
document.getElementById("hqbtn").addEventListener("click",openHq);
document.getElementById("hqClose").addEventListener("click",()=>{
  $hq.classList.remove("open");saveGame(true);});
