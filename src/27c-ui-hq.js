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
  /* у машины нет лояльности и доли — вместо них поведение словами. Дрейф числом
     не показывается нигде: он читается по журналу, а не по полосе */
  if(m.ai){
    const st=aiStage(m);
    return "<b style='color:"+R.col+"'>"+m.name+"</b><s>ИИ-ядро · "+R.ru.toLowerCase()+
      " · уровень "+lv+(nx?" · до следующего "+Math.max(0,Math.round(nx-(m.xp||0)))+" оп":"")+
      "<br>режим: <b style='color:"+((m.drift||0)>=45?"#ff9d7a":"#8fd08a")+"'>"+st.ru+
      "</b> — "+st.note+
      "<br>доли не берёт · обслуживание "+mgrPay(m)+" кр/мин · перки выбирает само</s>";
  }
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
  /* новости слышны там, где их и слышат: мир двигался, пока вас не было (12p) */
  if(typeof newsRender==="function")newsRender();
  G.cantina=G.cantina&&G.cantina.key===G.sys.key?G.cantina:{key:G.sys.key,list:stationMgrs(G.sys),talked:{}};
  const free=G.cantina.list.filter(m=>!G.mgrs.some(x=>x.seed===m.seed));
  if(free.length)$body.appendChild(el("div","sec",
    cantSel?"ТКНИТЕ ПО НЕМУ ЕЩЁ РАЗ ИЛИ ПО ДРУГОМУ — ВЕРНЁТЕСЬ В ЗАЛ"
           :"ТКНИТЕ ПО ЧЕЛОВЕКУ В ЗАЛЕ — ОТКРОЕТСЯ ЕГО КАРТОЧКА"));
  /* ── зал ──
     Кандидаты у стойки, дела за столиками: рисуются одной сценой, потому что
     это одно помещение. Выбор в зале фильтрует то, что раскрывается ниже. */
  const deals=stationDeals(G.sys).filter(d=>!dealTaken(d.key));
  const dealSel=cantSel&&cantSel.indexOf("deal:")===0?cantSel.slice(5):null;
  if(free.length||deals.length)cantinaScene(free,deals);
  for(const m of free){
    if(dealSel)break;                          // выбрали столик — люди у стойки ждут
    if(cantSel&&m.id!==cantSel)continue;      // выбрали человека — показываем его
    const R=MGR_ROLES[m.role],taken=mgrTaken(m.role),fee=mgrFee(m);
    const spoke=!!G.cantina.talked[m.id];
    const known=spoke||mgrPerkOf("cmd","read")||relicDeep("ledger");
    const r=el("div","row");
    r.appendChild(faceEl(m,64));
    r.appendChild(el("div","nm","<b style='color:"+R.col+"'>"+m.name+"</b><s>"+
      R.ru.toLowerCase()+" · "+R.note+
      "<br>уровень "+mgrLevel(m)+" · оклад "+mgrPay(m)+" кр/мин · доля "+(mgrCut(m)*100).toFixed(1)+"%"+
      "<br>"+(known
        ? "черты: "+m.traits.map(t=>"<b>"+mgrTrait(t).ru+"</b> — "+mgrTrait(t).note).join("<br>черты: ")
        : "черты видны после разговора"+(m.traits.length>2?" (их у него три)":""))+
      (taken?"<br><b style='color:#ff9d7a'>домен занят: "+mgrOf(m.role).name+"</b>":"")+"</s>"));
    if(!spoke&&!mgrPerkOf("cmd","read")&&!relicDeep("ledger")){
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
  if(!free.length)
    $body.appendChild(el("div","row","<div class='nm'><s>зал пуст: всех, кто тут сидел, "+
      "вы уже наняли. Состав меняется сам — загляните позже или на другой станции.</s></div>"));
  /* ── за столиками ──
     Не найм и не поручение: люди со своими делами. Всё, что здесь делает игрок, —
     отвечает; работа уже сделана кем-то другим (27g-deals). */
  if(deals.length){
    $body.appendChild(el("div","sec","ЗА СТОЛИКАМИ · ЛЮДИ СО СВОИМИ ДЕЛАМИ · "+
      "ОТВЕТ СТОИТ ДЕНЕГ, ВРЕМЕНИ ИЛИ ЧУЖОЙ СУДЬБЫ"));
    for(const d of deals){
      if(dealSel&&d.key!==dealSel)continue;   // подошли к столику — говорим с ним
      const D=d.def;
      $body.appendChild(el("div","row","<div class='nm'><b style='color:#f2b25c'>"+
        D.ru+"</b><s>"+d.name+" · "+D.who+
        "<br><span style='color:#cfe3ea;line-height:1.8'>— "+D.text+"</span></s></div>"));
      const rr=el("div","row");
      D.opts.forEach((o,i)=>{
        const b=el("button","act sm"+(o.free?"":" gold"),
          o.ru+(o.cost?" · "+o.cost.toLocaleString("ru")+" кр":""));
        b.disabled=!!(o.cost&&G.credits<o.cost);
        b.onclick=()=>{if(dealAnswer(d,i))renderTab();};
        rr.appendChild(b);
      });
      $body.appendChild(rr);
    }
  }
  /* ── Грохотун (12tb) ──
     Он не в списке зала и не за столиком: он сам по себе, приходит к вам и
     занимает место ровно на одну строку. В экипаж не входит, кресла не
     занимает, кредитов не берёт — платят ему едой. */
  grokBlock();
  $body.appendChild(el("div","sec","СОСТАВ КАНТИНЫ МЕНЯЕТСЯ САМ · ЭКРАН ШТАБ — ПЕРКИ И ПРИКАЗЫ"));
}
/* ── строка Грохотуна ──
   Одна карточка со своим состоянием и списком площадок из СВОЕГО слоя карты.
   Кнопка «отправить» стоит у каждой площадки, а не у него: выбирают место, а не
   человека — он-то всегда согласен. */
function grokBlock(){
  const R=grokTick();
  const want=grokWant(), price=grokPrice(), have=G.cargo[want]|0;
  $body.appendChild(el("div","sec","ГРОХОТУН · КОПАЕТ ЗА ЕДУ, НЕ ЗА ДЕНЬГИ"));
  const r=el("div","row");
  const w=el("div","face");
  w.style.cssText="flex:0 0 auto;width:64px;height:64px;line-height:0";
  w.appendChild(grokFace(64));
  r.appendChild(w);
  r.appendChild(el("div","nm","<b style='color:#c9c08a'>Грохотун</b><s>"+
    "копщик · в экипаж не входит и места в штабе не занимает"+
    "<br>"+grokLine().toLowerCase()+
    "<br>в трюме "+RES[want].ru.toLowerCase()+": "+have+" · за площадку "+price+"</s>"));
  if(R.state==="back"){
    const b=el("button","act gold","СПРОСИТЬ, ЧТО ВЫНЕС");
    b.onclick=()=>{grokTake();renderTab();};
    r.appendChild(b);
  }
  $body.appendChild(r);
  if(grokCanTeach()){
    const rr=el("div","row");
    rr.appendChild(el("div","nm","<s>он косится на ваши непрочитанные глифы "+
      "и явно хочет что-то сказать</s>"));
    const b=el("button","act sm","СПРОСИТЬ ПРО ГЛИФЫ");
    b.onclick=()=>{grokTeach();renderTab();};
    rr.appendChild(b);
    $body.appendChild(rr);
  }
  if(R.state!=="idle")return;
  const sites=grokSites();
  if(!sites.length){
    $body.appendChild(el("div","row","<div class='nm'><s>копать пока нечего: "+
      "площадки берутся из вашего слоя карты — адресов отчёта и их съёмки. "+
      "Нет ни одного — значит, вы ещё не собрали ни одного свидетельства.</s></div>"));
    return;
  }
  for(const s of sites.slice(0,6)){
    const rr=el("div","row");
    rr.appendChild(el("div","nm","<b>сектор "+s.sx+":"+s.sy+"</b><s>"+s.why+
      " · копка поднимет там занятость на ступень</s>"));
    const b=el("button","act"+(have>=price?" gold":""),
      RES[want].ru.toUpperCase()+" ×"+price);
    b.disabled=have<price;
    b.onclick=()=>{if(grokSend(s.sx,s.sy))renderTab();};
    rr.appendChild(b);
    $body.appendChild(rr);
  }
}
/* Зал: канва во всю ширину панели, по сидящему тыкают. Перерисовывается своим
   rAF, пока канва жива и вкладка та же, — иначе цикл продолжал бы крутиться
   после ухода со вкладки и жёг бы кадр впустую. */
let cantSel=null, cantHover=null;
function cantinaScene(list,deals){
  const wrap=el("div","");
  wrap.style.cssText="margin:6px 0 10px;line-height:0;position:relative";
  const cn=document.createElement("canvas");
  const cssW=Math.max(360,Math.min(($body.clientWidth||640)-4,980));
  const cssH=Math.round(clamp(cssW*.30,190,260));
  const dpr=Math.min(window.devicePixelRatio||1,2);
  cn.width=Math.round(cssW*dpr);cn.height=Math.round(cssH*dpr);
  cn.style.cssText="width:100%;height:"+cssH+"px;display:block;border-radius:8px;"+
    "border:1px solid rgba(120,150,170,.25);cursor:pointer;touch-action:manipulation";
  wrap.appendChild(cn);
  $body.appendChild(wrap);
  /* выбор мог указывать на человека, которого уже наняли, или на дело,
     на которое уже ответили: и то и другое просто снимается */
  if(cantSel&&cantSel.indexOf("deal:")!==0&&!list.some(m=>m.id===cantSel))cantSel=null;
  if(cantSel&&cantSel.indexOf("deal:")===0&&
     !(deals||[]).some(d=>("deal:"+d.key)===cantSel))cantSel=null;
  let hits=[];
  const pick=ev=>{
    const r=cn.getBoundingClientRect();
    const px=(ev.clientX-r.left)/r.width*cn.width/dpr;
    const py=(ev.clientY-r.top)/r.height*cn.height/dpr;
    return (hits.find(h=>px>=h.x&&px<=h.x+h.w&&py>=h.y&&py<=h.y+h.h)||{}).id||null;
  };
  cn.onmousemove=ev=>{cantHover=pick(ev);};
  cn.onmouseleave=()=>{cantHover=null;};
  cn.onclick=ev=>{
    const id=pick(ev);
    /* повторное касание того же человека закрывает карточку — так зал снова
       виден целиком, и не приходится искать кнопку «назад» */
    cantSel=(id&&id===cantSel)?null:id;
    sfx("ui");renderTab();
  };
  const frame=()=>{
    if(!cn.isConnected||tab!=="cantina")return;
    const c=cn.getContext("2d");
    c.setTransform(dpr,0,0,dpr,0,0);
    hits=drawCantinaRoom({width:cn.width/dpr,height:cn.height/dpr,getContext:()=>c},
                          list,cantSel,cantHover,deals);
    requestAnimationFrame(frame);
  };
  frame();
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
    hqAiOffer();
    return;
  }
  if(!G.mgrs.some(m=>m.id===hqSel))hqSel=G.mgrs[0].id;
  /* рубка: люди стоят у пультов своих доменов, по человеку тыкают.
     Полоска портретов была плоской вырезкой — здесь видно и место, и то,
     чем домен занят прямо сейчас (`27f-hq-room`). */
  hqScene();
  $hqBody.appendChild(el("div","sec","ТКНИТЕ ПО ЧЕЛОВЕКУ У ПУЛЬТА · ПУСТОЙ ПУЛЬТ — СВОБОДНЫЙ ДОМЕН"));
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
  /* поручение — первое, что должно бросаться в глаза: у него есть срок */
  if(m.job)hqJobCard(m);
  /* его лента: домен рассказывает о себе сам, а не молчит между уровнями */
  if(m.log&&m.log.length){
    const COL={warn:"#ff9d7a",good:"#8fd08a"};
    $hqBody.appendChild(el("div","row","<div class='nm'><b>Что он говорит</b><s>"+
      m.log.map(e=>"<span style='color:"+(COL[e.k]||"var(--dim)")+"'>• "+e.s+"</span>").join("<br>")+
      "</s></div>"));
  }
  /* перки: дерево видно целиком, включая невыученное — игрок должен планировать.
     У ядра то же дерево, но рука своя: кнопок нет, только след его выбора. */
  const pts=m.ai?0:mgrPoints(m);
  hqRelicSlot(m);
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
      if(!have&&!m.ai){
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
    /* приказ, запертый перком, в списке не показываем совсем: перк открывает
       не силу, а словарь того, что домену вообще можно поручить */
    if(rl.need&&!mgrPerk(m,rl.need))continue;
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
  /* сборка ядра на свободный домен: оно занимает место, а не добавляет пятое */
  hqAiOffer();
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
/* ── сборка ИИ-ядра ──
   Появляется только когда исследователь дошёл до «схемы ядра». Выбор честный:
   человек стоит денег и требует внимания к настроению, машина бесплатна и
   безразлична — и постепенно перестаёт быть вашей. */
function hqAiOffer(){
  if(!aiCanBuild())return;
  const free=MGR_ROLE_KEYS.filter(k=>!mgrTaken(k));
  if(!free.length||G.mgrs.length>=MGR_CAP)return;
  $hqBody.appendChild(el("div","sec","ИИ-ЯДРО · ЗАНИМАЕТ МЕСТО ЧЕЛОВЕКА, А НЕ ПЯТОЕ"));
  const r=el("div","row");
  r.appendChild(el("div","nm","<b>Собрать ядро</b><s>не берёт долю и оклада не просит, "+
    "слотов приказов вдвое, не уходит и не ворует.<br>но бюджет оно тратит само и не "+
    "спрашивает, а чем дольше работает — тем больше решает за вас."+
    "<br>цена: "+AI_COST.credits.toLocaleString("ru")+" кр · иридий "+AI_COST.iridium+
    " · кристаллы "+AI_COST.crystal+" · изотопы "+AI_COST.isotopes+
    " (в трюме: "+(G.cargo.iridium|0)+"/"+(G.cargo.crystal|0)+"/"+(G.cargo.isotopes|0)+")</s>"));
  for(const k of free){
    const b=el("button","act sm"+(aiAfford()?" gold":""),MGR_ROLES[k].ru.toUpperCase());
    b.disabled=!aiAfford();
    b.onclick=()=>{if(buildAi(k)){hqSel=null;hqRender();}};
    r.appendChild(b);
  }
  $hqBody.appendChild(r);
}
/* ── слот артефакта ──
   Слот один на управляющего, а артефактов за прохождение семь: это всегда
   выбор, кому дать и что оставить лежать. Вторая строка эффекта открывается
   только при исследователе с «чтением» — и видно, что она есть и заперта,
   иначе половина артефакта была бы невидимой. */
function hqRelicSlot(m){
  if(!relicSlotOpen()&&!relicOwned().length)return;
  const own=relicOwned();
  $hqBody.appendChild(el("div","sec","АРТЕФАКТ · СЛОТ ОДИН · НАЙДЕНО "+own.length+" / "+RELIC_KEYS.length));
  if(!relicSlotOpen()){
    $hqBody.appendChild(el("div","row","<div class='nm'><s>носить артефакт негде: "+
      "нужна наука «Ксеноархив». Находки лежат в ящике и ничего не делают."+
      (own.length?"<br>в ящике: "+own.map(k=>"«"+ARTIFACTS[k].ru+"»").join(", "):"")+
      "</s></div>"));
    return;
  }
  if(!own.length){
    $hqBody.appendChild(el("div","row","<div class='nm'><s>артефакты не покупаются: "+
      "они лежат в глубоких пластах, достаются трофеем с ушедшего и собираются "+
      "в лаборатории из двух других</s></div>"));
    return;
  }
  const deep=!!mgrPerkOf("sci","relic");
  for(const id of own){
    const A=ARTIFACTS[id],holder=relicHolder(id),mine=m.relic===id;
    const r=el("div","row"+(mine?" on":""));
    r.appendChild(el("div","nm","<b style='color:#c58ae0'>"+A.ru+"</b><s>"+A.one+
      "<br><span style='color:"+(deep?"#8fd08a":"var(--dim)")+"'>"+
      (deep?"вторая строка: "+A.two:"вторая строка заперта — нужен исследователь с «чтением»")+
      "</span>"+(holder&&!mine?"<br><b style='color:#f2b25c'>носит "+holder.name+"</b>":"")+"</s>"));
    const b=el("button","act sm"+(mine?"":" gold"),mine?"СНЯТЬ":"НАДЕТЬ");
    b.onclick=()=>{if(mine)relicUnequip(m);else relicEquip(m,id);hqRender();};
    r.appendChild(b);
    $hqBody.appendChild(r);
  }
}
/* ── карточка поручения ──
   Его слова даются от первого лица и без пояснений от игры: это разговор,
   а не задание из журнала. */
function hqJobCard(m){
  const J=jobDef(m.job.id);
  if(!J)return;
  const left=jobLeft(m);
  /* у ультиматума срок идёт и пока он «ждёт ответа» — молчание тоже ответ */
  $hqBody.appendChild(el("div","sec",J.ult
    ?"УЛЬТИМАТУМ · ОН УЙДЁТ ЧЕРЕЗ "+Math.ceil(left)+" МИН"
    :"ПОРУЧЕНИЕ · "+J.ru.toUpperCase()+
      (m.job.offer?" · ЖДЁТ ОТВЕТА":(J.mins||m.job.mins?" · ОСТАЛОСЬ "+Math.ceil(left)+" МИН":""))));
  /* текст бывает и от человека, а не только от таблицы */
  const txt=typeof J.text==="function"?J.text(m):J.text;
  $hqBody.appendChild(el("div","row","<div class='nm'><s style='color:"+(J.ult?"#ffb2a0":"#cfe3ea")+
    ";font-size:10px;line-height:1.8'>— "+txt+"</s></div>"));
  const r=el("div","row");
  if(m.job.offer&&J.choice){
    r.appendChild(el("div","nm","<s>"+(J.ult?"молчание — тоже отказ":"решать вам, он исполнит")+"</s>"));
    J.opts.forEach((o,i)=>{
      const cost=o.payoff?mgrUltCost(m):o.cost;
      const b=el("button","act sm"+(o.bad?"":" gold"),
        o.ru+(o.payoff?" · "+cost.toLocaleString("ru")+" кр":""));
      b.disabled=!!(cost&&G.credits<cost);
      b.onclick=()=>{if(jobPick(m,i))hqRender();};
      r.appendChild(b);
    });
  }else if(m.job.offer){
    r.appendChild(el("div","nm","<s>срок "+J.mins+" минут · отказ он запомнит</s>"));
    const ba=el("button","act sm gold","ВЗЯТЬСЯ");
    ba.onclick=()=>{if(jobAccept(m))hqRender();};
    const bn=el("button","act sm","ОТКАЗАТЬ");
    bn.onclick=()=>{if(jobRefuse(m))hqRender();};
    r.appendChild(ba);r.appendChild(bn);
  }else{
    r.appendChild(el("div","nm","<s>идёт · "+(J.win_ru?"на кону: "+J.win_ru.toLowerCase():"")+"</s>"));
    const bn=el("button","act sm","БРОСИТЬ");
    bn.onclick=()=>{if(jobRefuse(m))hqRender();};
    r.appendChild(bn);
  }
  $hqBody.appendChild(r);
}
/* «Сводка» фактора: цены его маршрута видны из любой системы — до перка узнать
   их можно было только прилетев. Показываем лучшее предложение по каждому плечу:
   развёрнутая таблица здесь превратилась бы в терминал, а решение принимается
   по одной строке — «куда везти». */
function factPrices(m){
  if(!mgrPerk(m,"see")||!m.route.length)return "";
  const rows=[];
  for(const key of m.route){
    const [sx,sy]=key.split(",").map(Number);
    const sys=getSystem(sx,sy);
    if(!sys||!sys.station)continue;
    const pr=marketFor(sys);
    let best=null;
    for(const k of TRADE_KEYS){
      const rel=pr[k]/RES[k].price;
      if(!best||rel>best.rel)best={k,rel,p:pr[k]};
    }
    if(best)rows.push(sys.station.name+": "+RES[best.k].ru.toLowerCase()+" "+best.p+" кр"+
      (best.rel>1.12?" ↑":""));
  }
  return rows.length?"<br><span style='color:#8fd08a'>сводка по маршруту:</span> "+rows.join(" · "):"";
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
        (m.legNote?"<br><span style='color:#8fd08a'>везёт сейчас:</span> "+m.legNote
                  :"<br><b style='color:#ff9d7a'>цены на плечах сошлись — возить нечего</b>")+
        (mgrPerk(m,"mono")?"<br><b style='color:#8fd08a'>монополия: на плечах маршрута цена держится выше</b>":"")+
        factPrices(m)+
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
