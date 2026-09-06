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
  /* карточка человека (M301, DESIGN-screens §3): сначала слова — роль,
     настроение, черты; цифры отдельным блоком под ними, а не внутри фразы */
  return "<b style='color:"+R.col+"'>"+m.name+"</b><s>"+R.ru.toLowerCase()+" · "+loyBar(m)+
    "<br>"+m.traits.map(t=>mgrTrait(t).ru).join(" · ")+"</s>"+
    "<s class='fig'>уровень "+lv+(nx?" · до следующего "+Math.max(0,Math.round(nx-(m.xp||0)))+" оп":" · потолок")+
    "<br>доля "+(mgrCut(m)*100).toFixed(1)+"% · оклад "+mgrPay(m)+" кр/мин из доли</s>";
}
/* ── кантина ──
   Не список найма, а место: те же 2–4 человека держатся на seed станции и
   временном бакете. Разговор бесплатен, но кандидат после него занят до
   следующего бакета — «подумать и вернуться» стоит именно этого.

   ПОРЯДОК ЭКРАНА. Плейтест 30.08.2026: «в кантине вообще непонятно: скролишь
   вниз, вверху надо тыкать, внизу что-то выбираешь, непонятно, что
   происходит». Экран набирал до пятнадцати блоков подряд одинаковыми строками
   — найм, дела, копщик, домино, почта, смотритель, чужая карта, стол, поздний
   час, — и НОВОСТИ МИРА стояли перед залом, то есть первым, что читал вошедший.
   Ни одна секция не говорила, что она такое и сколько в ней строк.

   Теперь экран отвечает сверху вниз на три вопроса: КТО ЗДЕСЬ (зал), КОГО МОЖНО
   НАНЯТЬ (стойка), ЧТО ЗДЕСЬ ПРЕДЛАГАЮТ (столики). Ниже — то, что в кантине
   делают руками: копщик, игра, стол. Новости ушли в самый низ: это чтение, а не
   действие, и очередь у них последняя.

   ВЫБОР В ЗАЛЕ БОЛЬШЕ НЕ ПРЯЧЕТ ОСТАЛЬНЫХ. Он подсвечивает строку, и только.
   Фильтр экономил высоту, но отвечал на нажатие исчезновением двух третей
   экрана: игрок тыкал в зал и терял из виду то, что читал минуту назад. И
   наоборот — строку теперь можно нажать саму: зал и список это одни и те же
   люди, и любой открывается с любой стороны.

   ПРОКРУТКА НЕ СБРАСЫВАЕТСЯ — это уже не здесь, а в `renderTab` (26-ui-station):
   любое нажатие перебирало $body заново и уносило экран в шапку. */
function renderCantina(){
  mgrTick();
  G.cantina=G.cantina&&G.cantina.key===G.sys.key?G.cantina:{key:G.sys.key,list:stationMgrs(G.sys),talked:{}};
  const free=G.cantina.list.filter(m=>!G.mgrs.some(x=>x.seed===m.seed));
  const deals=stationDeals(G.sys).filter(d=>!dealTaken(d.key));
  const folk=(typeof folkShown==="function")?folkShown():null;
  /* ── зал — всегда, и зал — это ввод (M299) ──
     Раньше сцена рисовалась только при кандидатах, а под ней всё равно шёл
     список из четырнадцати блоков. Теперь стойка, люди и дверь — точки
     нажатия; ниже рисуется только то, во что ткнули. */
  cantinaScene(free,deals,folk);
  const isDeal=!!cantSel&&cantSel.indexOf("deal:")===0, isFolk=!!cantSel&&cantSel.indexOf("folk:")===0;
  if(cantSel&&cantSel!=="counter"&&!isDeal&&!isFolk&&!free.some(m=>m.id===cantSel))cantSel=null;
  if(isDeal&&!deals.some(d=>"deal:"+d.key===cantSel))cantSel=null;
  if(isFolk&&!(folk&&FOLK[folk.id]&&"folk:"+folk.id===cantSel))cantSel=null;
  const back=()=>{cantSel=null;sfx("ui");renderTab();};
  if(!cantSel){
    secHead("В ЗАЛЕ",{count:free.length+deals.length+(folk?1:0)+1,
      note:"тыкните по человеку или по стойке — или по строке ниже: это те же люди",key:"cant"});
    const rc=el("div","row");rc.style.cursor="pointer";
    rc.onclick=()=>{cantSel="counter";sfx("ui");renderTab();};
    rc.appendChild(el("div","nm","<b>Бармен</b><s>у стойки: слушают, отвечают на вещь, наливают допоздна</s>"));
    const bc=el("button","act sm","К СТОЙКЕ");bc.onclick=rc.onclick;rc.appendChild(bc);
    $body.appendChild(rc);
    for(const m of free)cantHireRow(m,false);
    for(const d of deals)cantDealRow(d,false);
    if(folk&&FOLK[folk.id])cantFolkRow(folk,false);
    if(typeof mayakBlock==="function")mayakBlock();   /* лист маяка на стене (M349) */
    if(typeof noteBlock==="function")noteBlock();     /* записная книжка (M374) */
    if(typeof voteBlock==="function")voteBlock();     /* выборы и сбор (M378) */
    if(typeof riteBlock==="function")riteBlock();     /* обряды (M379) */
    if(typeof circBlock==="function")circBlock();     /* бумага сверху (M381) */
    if(typeof dipBlock==="function")dipBlock();       /* письмо и обмен (M386) */
  }else if(cantSel==="counter"){
    secHead("У СТОЙКИ",{back});
    if(typeof putOnTable==="function")tableBlock();
    if(typeof lateBlock==="function")lateBlock();
    if(typeof toldOffBlock==="function")toldOffBlock();
  }else if(isDeal){
    const d=deals.find(x=>"deal:"+x.key===cantSel);
    secHead("ЗА СТОЛИКОМ",{back});
    cantDealRow(d,true);
  }else if(isFolk){
    secHead(FOLK[folk.id].where==="dock"?"У ДОКА":"В ЗАЛЕ",{back});
    cantFolkRow(folk,true);
  }else{
    const m=free.find(x=>x.id===cantSel);
    secHead("У СТОЙКИ",{back,note:"управляющий берёт домен целиком — звено, базы, маршрут или лабораторию — и долю с того, что домен приносит",key:"hire"});
    cantHireRow(m,true);
  }
  /* всё остальное, что живёт в зале: за сгибом, но с честным счётом */
  foldBlock("ЕЩЁ В ЗАЛЕ",()=>{
    grokBlock();
    if(typeof vegaCantinaBlock==="function")vegaCantinaBlock();   /* Вега за столиком (M153) */
    if(typeof dominoBlock==="function"){const RIV=["Пекарь","Совеня","Долгий Ким","Штоф"];dominoBlock((typeof vegaAboard==="function"&&vegaAboard())?"Вега":RIV[Math.abs(hashi(G.sx,G.sy,celDay()))%RIV.length]);}
    if(typeof postBlock==="function")postBlock();
    if(typeof keepersBlock==="function")keepersBlock();
    if(typeof chartsBlock==="function")chartsBlock();
    if(typeof quietBlock==="function")quietBlock();
    if(typeof newsRender==="function")newsRender();
  },"cantMore");
}
/* карточка кандидата: сжатая — имя, роль, одна строка, НАНЯТЬ; полная — с цифрами и чертами */
function cantHireRow(m,full){
  const R=MGR_ROLES[m.role],taken=mgrTaken(m.role),fee=mgrFee(m);
  const spoke=!!G.cantina.talked[m.id];
  const known=spoke||mgrPerkOf("cmd","read")||relicDeep("ledger");
  const r=el("div","row"+(full?" on":""));
  r.style.cursor="pointer";
  r.onclick=ev=>{
    if(ev.target.closest("button"))return;
    cantSel=full?null:m.id;sfx("ui");renderTab();
  };
  r.appendChild(faceEl(m,full?64:44));
  /* сжатый ряд — одна строка (M300): роль и уровень; чем он занят — в полной карточке */
  const line=full?R.ru.toLowerCase()+" · "+R.note:R.ru.toLowerCase()+" · уровень "+mgrLevel(m)+(taken?" · домен занят":"");
  let html="<b style='color:"+R.col+"'>"+m.name+"</b><s>"+line+"</s>";
  if(full){
    html+="<s class='fig'>уровень "+mgrLevel(m)+" · оклад "+mgrPay(m)+" кр/мин · доля "+(mgrCut(m)*100).toFixed(1)+"%</s>"+
      "<s>"+(known
        ? m.traits.map(t=>"<b>"+mgrTrait(t).ru+"</b> — "+mgrTrait(t).note).join("<br>")
        : "чем хорош и чем плох — видно после разговора"+(m.traits.length>2?" (черт три)":""))+"</s>"+
      (taken?"<s style='color:#ff9d7a'>домен занят: "+mgrOf(m.role).name+"</s>":"");
  }
  r.appendChild(el("div","nm",html));
  if(full&&!known){
    const bt=el("button","act sm","РАССПРОСИТЬ");
    bt.onclick=()=>{G.cantina.talked[m.id]=1;renderTab();};
    r.appendChild(bt);
  }
  const b=el("button","act"+(taken?"":" gold")+(full?"":" sm"),"НАНЯТЬ · "+fee.toLocaleString("ru")+" кр");
  b.disabled=taken||G.credits<fee||G.mgrs.length>=MGR_CAP;
  b.onclick=()=>{if(hireMgr(m)){hqSel=m.id;cantSel=null;renderTab();}};
  r.appendChild(b);
  $body.appendChild(r);
}
/* чужое дело: сжатое — что и кто; полное — текст и ответы */
function cantDealRow(d,full){
  const D=d.def;
  const c=el("div","row"+(full?" on":""));
  c.style.cursor="pointer";
  c.onclick=ev=>{
    if(ev.target.closest("button"))return;
    cantSel=full?null:"deal:"+d.key;sfx("ui");renderTab();
  };
  c.appendChild(el("div","nm","<b style='color:#f2b25c'>"+D.ru+"</b><s>"+d.name+" · "+D.who+"</s>"+
    (full?"<s style='color:#cfe3ea;line-height:1.8'>— "+D.text+"</s>":"")));
  if(!full){
    /* своя ручка, а не ссылка на ручку строки: та отбрасывает нажатия по кнопкам
       (чтобы ответы внутри карточки не сворачивали её) — и отбрасывала саму
       ВЫСЛУШАТЬ. Плейтест 02.09: «нажимаешь — ничего не происходит» */
    const b=el("button","act sm","ВЫСЛУШАТЬ");
    b.onclick=()=>{cantSel="deal:"+d.key;sfx("ui");renderTab();};
    c.appendChild(b);
  }
  $body.appendChild(c);
  if(full){
    const rr=el("div","row");
    D.opts.forEach((o,i)=>{
      const b=el("button","act sm"+(o.free?"":" gold"),o.ru+(o.cost?" · "+o.cost.toLocaleString("ru")+" кр":""));
      b.disabled=!!(o.cost&&G.credits<o.cost);
      b.onclick=()=>{if(dealAnswer(d,i)){cantSel=null;renderTab();}};
      rr.appendChild(b);
    });
    $body.appendChild(rr);
  }
}
/* завсегдатай (12u-folk): человек, а не кнопка — говорит своё, попросить не может */
function cantFolkRow(f,full){
  const F=FOLK[f.id];
  const r=el("div","row"+(full?" on":""));
  r.style.cursor="pointer";
  r.onclick=ev=>{if(ev.target.closest("button"))return;cantSel=full?null:"folk:"+f.id;sfx("ui");renderTab();};
  r.appendChild(el("div","nm","<b>"+F.ru+" · завсегдатай</b><s>"+(F.where==="dock"?"у дока":"в зале")+(F.note?" · "+F.note:"")+"</s>"+
    (full?"<s style='color:#cfe3ea;line-height:1.8'>"+f.line+"</s><s>говорит своё; попросить о чём-то не может</s>":"")));
  $body.appendChild(r);
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
    $body.appendChild(el("div","row","<div class='nm'><b>Копать пока негде</b><s>"+
      "он копает только там, где вы уже что-то нашли: площадки берутся из адресов "+
      "отчёта и их съёмки. Соберите первое свидетельство — и здесь появится список секторов"+
      "</s></div>"));
    return;
  }
  for(const s of sites.slice(0,6)){
    const rr=el("div","row");
    rr.appendChild(el("div","nm","<b>сектор "+s.sx+":"+s.sy+"</b><s>"+s.why+
      " · уйдёт туда с вашим "+RES[want].ru.toLowerCase()+" и вернётся с тем, что выкопал"+
      "</s>"));
    /* кнопка называет действие, а не цену: «ЛЁД ×120» не говорит, что случится */
    const b=el("button","act"+(have>=price?" gold":""),
      "ОТПРАВИТЬ · "+RES[want].ru.toUpperCase()+" ×"+price);
    b.disabled=have<price;
    b.onclick=()=>{if(grokSend(s.sx,s.sy))renderTab();};
    rr.appendChild(b);
    $body.appendChild(rr);
  }
}
/* реплика бармена над стойкой (M299): ответ на вещь произносится в зале,
   а не только меняет строку списка */
let cantBubble=null;
function cantSay(line){cantBubble={line:String(line||"").replace(/^—\s*/,""),t:performance.now()};}
/* Зал: канва во всю ширину панели, по сидящему тыкают. Перерисовывается своим
   rAF, пока канва жива и вкладка та же, — иначе цикл продолжал бы крутиться
   после ухода со вкладки и жёг бы кадр впустую. */
let cantSel=null, cantHover=null;
function cantinaScene(list,deals,folk){
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
  /* стойка и завсегдатай — тоже выбор (M299); сверка с залом делается в renderCantina */
  if(cantSel&&cantSel!=="counter"&&cantSel.indexOf("folk:")!==0&&cantSel.indexOf("deal:")!==0&&!list.some(m=>m.id===cantSel))cantSel=null;
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
                          list,cantSel,cantHover,deals,folk);
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
  /* Первый рендер после открытия часто идёт по НЕ разложенной панели: класс
     open только что поставлен, clientHeight ещё нулевой или вчерашний, и рубка
     меряет высоту не того экрана (M223). Один повтор кадром позже — по уже
     разложенной; дальше размеры стабильны и повторов нет. */
  if(!hqRender._laid){
    hqRender._laid=true;
    requestAnimationFrame(()=>{if($hq.classList.contains("open"))hqRender();});
  }
  mgrTick();
  document.getElementById("hqCr").textContent=G.credits.toLocaleString("ru")+" кр";
  document.getElementById("hqCap").textContent=G.mgrs.length+" / "+MGR_CAP+" мест";
  let upkeep=0;for(const m of G.mgrs)upkeep+=mgrPay(m);
  document.getElementById("hqSub").textContent=G.mgrs.length
    ? "оклады "+upkeep+" кр/мин — из долей доменов, не из вашей кассы"
    : "домены пусты — управляющих нанимают в кантине станции";
  $hqBody.textContent="";
  if(!G.mgrs.length){
    /* ── пустая рубка — это КАРТИНКА, а не пустой экран ──
       Плейтест 26.08.2026: «открыл ШТАБ — на весь экран чёрное поле, две
       строки текста вверху и кнопка внизу, между ними пятьсот пикселей
       пустоты… я что-то сломал?». Рубка в игре нарисована (27f-hq-room), но
       её показывали только когда управляющие уже есть, — то есть ровно тогда,
       когда экран и без того не пустой. Теперь она рисуется всегда: тёмные
       пульты, за которыми никто не сидит, отвечают на «а где все» лучше любой
       строки текста, и «пока никого» перестаёт читаться поломкой. */
    hqScene();
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
  $hqBody.appendChild(el("div","sec note","тыкните по человеку у пульта · пустой пульт — свободный домен"));
  if(typeof secTidy==="function")requestAnimationFrame(()=>secTidy($hqBody));   /* после карточек (M300) */
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
  $hq.classList.add("open");hqRender._laid=false;hqRender();
}
/* Кнопки ШТАБ в ящике больше нет: управляющие — это тоже те, кто на вас
   работает, и попадают сюда строкой из ДЕЛА (27n). Слушатель условный. */
{const hb=document.getElementById("hqbtn");if(hb)hb.addEventListener("click",openHq);}
/* окно поменялось — рубка перемеряется: без этого её высота остаётся от
   прежнего окна (и в headless — от запасного 640×480, с которого страница
   начинает жить, пока не пришёл настоящий размер) */
addEventListener("resize",()=>{if($hq.classList.contains("open"))hqRender();});
document.getElementById("hqClose").addEventListener("click",()=>{
  $hq.classList.remove("open");saveGame(true);});

/* ── стол (M128) ──
   Единственная поверхность ввода, какая в этой игре есть: игрок не выбирает
   слова, он кладёт вещь. Лента, груз, слух — человек отвечает на предмет.
   Молчание в ответ такая же строка, как любая другая. */
function tableBlock(){
  const sp=(typeof speechHere==="function")?speechHere():null;
  if(sp){
    $body.appendChild(el("div","row","<div class='nm'><b>"+sp.addr+"</b><s style='color:#cfe3ea;line-height:1.9'>"+
      (sp.silent?"<i>смотрит и ничего не говорит</i>":sp.line)+
      "</s><s>следующая реплика — в следующий заход</s></div>"));
  }
  secHead("СТОЛ",{note:"положите вещь — ответят на неё, а не на слова",key:"table"});
  /* ── один ход на вещь за заход (M298) ──
     Плейтест 30.08: «тыкаешь и ничего не происходит». Ответ печатался мелко в
     отдельный ряд ниже, молчание — как пустота, а зерно держалось на весь заход,
     так что десять нажатий давали одну и ту же строку. Теперь ответ встаёт в
     ТОТ ЖЕ ряд на место кнопки, цветом говорящего; молчание показано как ответ;
     каждый ряд говорит, ЗАЧЕМ этот ход; под ответом — след, который раньше был
     невидим: место запомнило, в тетрадь записано. Кнопка после хода уходит —
     это ход на этот заход, и повторные нажатия в пустоту кончились. */
  const tag=(G.sys?G.sys.key:"")+"#"+visitHere();
  if(!G.tableUsed||G.tableUsed.tag!==tag)G.tableUsed={tag};
  const row=(key,title,sub,why,btnTxt,kind,idx,extra)=>{
    const r=el("div","row"),u=G.tableUsed[key];
    if(u){
      r.appendChild(el("div","nm","<b>"+title+"</b><s>"+sub+"</s><s style='color:#cfe3ea;line-height:1.8'>"+
        (u.silent?"<i>посмотрел и промолчал — это тоже ответ</i>":u.line)+"</s>"+
        "<s>место вас запомнило"+(u.silent?"":" · записано в тетрадь, ЛЮДИ")+"</s>"));
    }else{
      r.appendChild(el("div","nm","<b>"+title+"</b><s>"+sub+"</s><s>"+why+"</s>"));
      const bt=el("button","act sm",btnTxt);
      bt.disabled=!!(extra&&extra.disabled);
      const go=()=>{
        G.tableN=(G.tableN|0)+1;
        const res=putOnTable(kind,idx)||{line:null,silent:true};
        if(typeof placeNote==="function")placeNote("care",1);   // вещь на столе — место помнит (хвост M132)
        if(!res.silent&&typeof peopleLine==="function")peopleLine(res.line,G.st?G.st.name:"");   /* в ЛЮДИ (M151a) */
        G.tableUsed[key]={line:res.line,silent:!!res.silent};
        if(typeof cantSay==="function"&&!res.silent)cantSay(res.line);   /* бармен говорит в зале (M299) */
        sfx("ui");
        renderTab();
      };
      bt.onclick=()=>{if(extra&&extra.ask)extra.ask(go);else go();};
      r.appendChild(bt);
    }
    if(extra&&extra.btn)r.appendChild(extra.btn);
    $body.appendChild(r);
  };
  /* ленты: их можно показать, а можно продать. Хорошая продаётся хорошо */
  const strips=(typeof stripsAll==="function")?stripsAll():[];
  /* пустые ряды не рисуются (M299): «лент нет», «трюм пуст» — не вещи */
  strips.forEach((s,k)=>{
    const bs=el("button","act sm gold",stripValue(s).toLocaleString("ru")+" кр");
    bs.title="продать ленту";
    bs.onclick=()=>{stripSell(k);renderTab();};
    row("strip"+k,"Лента · сектор "+s.sx+":"+s.sy,"невязка "+(s.mis||0).toFixed(3)+" · длина записи "+(s.span|0),
        "ПОКАЗАТЬ ЛЕНТУ — расскажут, что видели в тех же секторах","НА СТОЛ","strip",k,{btn:bs});
  });
  /* груз и слух: то же движение, другой предмет */
  const holdKey=RES_KEYS.filter(k=>G.cargo[k]>0)[0];
  if(holdKey)row("cargo","Из трюма",RES[holdKey].ru+" · "+G.cargo[holdKey]+" ед",
      "показать товар — скажут, кому он тут нужен","НА СТОЛ","cargo",RES_KEYS.indexOf(holdKey));
  /* новость из эфира, не «слух»: слух на доске — это место с промахом, а тут
     строка приёмника; одно слово на две вещи путало (M299) */
  const news=(typeof newsAll==="function")?newsAll():[];
  const last=news.length?news[news.length-1]:null;
  if(last)row("rumour","Новость из эфира",last.ru,
      "пересказать — её подтвердят или высмеют","НА СТОЛ","rumour",news.length);
  /* имя (хвост M128): то же движение, предмет — вы сами. Спрашивается окном (M299) */
  row("name","Ваше имя",G.name||"капитан — имени пока нет",
      G.name?"назваться ещё раз — вас узнают":"назваться — вас начнут узнавать на этой станции","НАЗВАТЬ","name",visitHere(),
      {ask:go=>{if(typeof askText!=="function")return go();
        askText("ВАШЕ ИМЯ",G.name||"",v=>{v=(v||"").replace(/[<>]/g,"").trim().slice(0,18);if(!v)return;G.name=v;go();});}});
  /* имя системы, если дали своё, кладут на стол же: с этого прыжка оно пойдёт по рукам (11u) */
  if(typeof namesFor==="function"&&G.sys){
    const nk=G.sys.key,cur=namesFor(nk);
    if(cur&&namesToldAll()[nk]==null){
      const r6=el("div","row");
      r6.appendChild(el("div","nm","<b>Имя системы · «"+cur+"»</b><s>рассказать — и через прыжки его повторит чужой диспетчер</s>"));
      const b6=el("button","act sm","РАССКАЗАТЬ");
      b6.onclick=()=>{nameTell(G.sys);sfx("ui");renderTab();};
      r6.appendChild(b6);$body.appendChild(r6);
    }
  }
  /* пеленг зеркала (хвост M134): отметку можно снять с карты */
  if(typeof mirrorAll==="function"&&mirrorAll().bearing===1){
    const r5=el("div","row");
    r5.appendChild(el("div","nm","<b>ПЕЛЕНГ ИСТОЧНИКА</b><s>отметка на карте · до неё не долететь</s>"));
    const b5=el("button","act sm","СНЯТЬ");
    b5.onclick=()=>{mirrorAck();renderTab();};
    r5.appendChild(b5);$body.appendChild(r5);
  }
}
