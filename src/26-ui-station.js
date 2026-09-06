/* ══════════════ станция ══════════════ */
const $st=document.getElementById("station"),$body=document.getElementById("stBody");
let tab="market";
let fuseSel=[];   // два корпуса, выбранных под сплав в лаборатории
function openStation(){
  G.st=G.sys.station;G.mode="dock";G.ap=null;toggleLog(false);
  if(typeof cosmChimePlay==="function")cosmChimePlay();   /* свой сигнал стыковки (M344) */
  mgrTick();mgrRouteVisit(G.sys);routeVisit(G.sys);
  if(typeof holdDock==="function")holdDock(G.sys);   /* груз, с которым пристыковались, и бункеры (M291) */
  scripVisitReset();          // потолок обмена бонами — на заход (12u-scrip)
  if(typeof coopVisitReset==="function")coopVisitReset();   /* потолок прилавка — на заход (12aj, M351) */
  /* трепло (12x): у прилавка оно слышит цены, а иногда выдаёт то, что слышало
     у вас. Обе стороны одной птицы, и обе — на стыковке */
  if(typeof parrotDock==="function")parrotDock(G.sys);
  /* почта (M190): ОДИН поход наружу на стыковку — забрать ответы и, если
     повезло, поймать чужую карточку. Ни таймера, ни опроса (правило M171) */
  if(typeof mailDock==="function")mailDock();
  /* праздник по настоящему календарю (M201): раз в год, при первой стыковке */
  if(typeof holDock==="function")holDock();
  /* переходящий вымпел (M206): раз в квартал, при первой стыковке */
  if(typeof pennTick==="function")pennTick();
  /* счётчик посадок на это место (11b-speech): от него зависит, как к вам
     обращаются и какая реплика в очереди станет следующей */
  if(typeof visitMark==="function")visitMark();
  if(typeof placeMark==="function")placeMark();   // память места и одометр (11d)
  /* что здесь сегодня предлагают (11ah): часть предложений — не вам, и это
     нормально. Именное приходит только от того, кто вас помнит хорошо */
  /* сперва сдать привезённое, потом смотреть, что предлагают сегодня (11ah) */
  if(typeof offerDeliver==="function"){
    const got=offerDeliver();
    if(got>0)tell("money","Работа сдана · +"+got.toLocaleString("ru")+" кр",
                  "Сдано\n+"+got.toLocaleString("ru")+" кр");
  }
  if(typeof offerVisit==="function")offerVisit();
  /* четверо (12u-folk): если кто-то из своих сегодня здесь, он может назвать
     твой позывной — и тогда предложение весит столько, сколько весит он */
  if(typeof folkVisit==="function"){
    const fv=folkVisit();
    if(fv&&typeof folkOffer==="function")folkOffer(fv.id);
  }
  /* почтовый круг (11e): если это следующее звено, человек подходит сам */
  if(typeof postDock==="function"){const pr=postDock();if(pr)say(pr.who+":\n"+pr.line);}
  if(typeof keepersDock==="function"){const kr=keepersDock();if(kr&&kr.line)say("Смотритель:\n"+kr.line);}   /* линия смотрителей (11k) */
  if(typeof chartsDock==="function"){const cr=chartsDock();if(cr)say("Местные:\n"+cr.line);}   /* несогласие карт (11m) */
  if(typeof quietDock==="function"){const qr=quietDock();if(qr)say("Колония:\n"+qr.line);}     /* тихий уезд (11n) */
  if(typeof retDock==="function"){const rr=retDock();if(rr)say("Вернувшиеся:\n"+rr.line);}     /* возвращение (11s) */
  logAdd("dim","Стыковка с «"+G.st.name+"»");
  /* цены на бумагу (M152e): что видели здесь — лежит на столе, закладка ЦЕНЫ */
  if(typeof pricesSeen==="function")pricesSeen(G.sys);
  if(typeof vegaHomeArrive==="function"&&vegaAtHome())vegaHomeArrive();   /* «я прибралась» (M153) */
  if(typeof vegaLanded==="function")vegaLanded();
  if(typeof expPaxDock==="function")expPaxDock();   /* попутчик сошёл (M156) */
  for(const k in keys)keys[k]=false;
  document.querySelectorAll(".pads button").forEach(b=>b.classList.remove("on"));
  document.getElementById("stName").textContent=G.st.name.toUpperCase();
  /* модули названы прямо в шапке: снаружи игрок видит их силуэты, внутри —
     читает списком. Услуги при этом по-прежнему от типа станции, модули
     ничего не открывают (17a-station-mod) */
  /* ── чей это дом (M369a, §19.4 «бумаги и одна строка») ──
     Станцию строил кто-то, и это слышно в первой же строке: приветствие
     державы и её цвет в акценте шапки. Не перекраска интерфейса — одна
     строка и один цвет, как и договорено в §19.1. */
  const stBy=(G.sys.station&&G.sys.station.by)||"gt";
  const stP=(typeof powerOf==="function")?powerOf(stBy):null;
  document.getElementById("stKind").textContent=
    G.st.kind+" · система "+G.sys.name+"\n"+stationModsLine(G.sys)+
    (stP?"\n"+stP.ru+" · "+stP.hail:"")+
    /* флаг сменился (M372): пока хозяин свежий, станция говорит об этом
       первой строкой — и по ней же понятно, почему цены другие */
    ((typeof occPowerHere==="function"&&occPowerHere())
      ?"\nФЛАГ СМЕНИЛСЯ · "+powerOf(occPowerHere().by).ru.toUpperCase()+
        " · треть выработки в реквизицию":"");
  if(stP)document.getElementById("stName").style.color=stP.col;
  syncTabs();
  /* новая стыковка — новый экран: высоту прошлого захода не помним */
  renderTab._tab=null;
  $st.classList.add("open");renderTab();saveGame(true);
}
/* ── навигация станции: раздел, потом вкладка ──
   Десять вкладок в один ряд сжимались до полусотни пикселей и обрезали подписи.
   Разделов же всегда мало, и они отвечают на вопрос, с которым игрок пришёл:
   продать, снарядиться, узнать, нанять, распорядиться. Внутри раздела с одной
   вкладкой вторая ступень не показывается — нечего выбирать. */
const ST_GROUPS=[
  {id:"board", ru:"ДОСКА",     tabs:["board"]},   /* M151a: всё, что мир говорит о себе, на одной стене */
  {id:"trade", ru:"ТОРГОВЛЯ",  tabs:["market","barter","flea","scrip"]},
  {id:"ship",  ru:"КОРАБЛЬ",   tabs:["yard","mods","fuse","instr"]},
  {id:"know",  ru:"НАУКА",     tabs:["lab"]},
  {id:"folk",  ru:"ЛЮДИ",      tabs:["crew","cantina"]},
  {id:"hold",  ru:"ВЛАДЕНИЯ",  tabs:["bases","site"]}   /* СТРОЙКА (M291): вкладка, не раздел */
];
function stGroupOf(t){const g=ST_GROUPS.find(G0=>G0.tabs.indexOf(t)>=0);return g?g.id:ST_GROUPS[0].id;}
let stGroup="trade";
function stTabsHere(){return ["board"].concat(stTypeOf(G.st.stype).tabs,G.st.stype==="fuel"?[]:["site"]);}   /* доска есть у всех (M151a); стройка — у всех, кроме заправки (M291) */
function syncTabs(){
  const has=stTabsHere();
  /* раздел живёт, только если у него есть хоть одна вкладка на этой станции */
  const live=ST_GROUPS.filter(g=>g.tabs.some(t=>has.indexOf(t)>=0));
  if(has.indexOf(tab)<0)tab=(live[0]&&live[0].tabs.filter(t=>has.indexOf(t)>=0)[0])||"none";
  stGroup=stGroupOf(tab);
  const $g=document.getElementById("stGroups");
  $g.textContent="";
  for(const g of live){
    const b=document.createElement("button");
    b.textContent=g.ru;
    if(g.id===stGroup)b.classList.add("on");
    b.addEventListener("click",()=>{
      const first=g.tabs.filter(t=>has.indexOf(t)>=0)[0];
      if(!first)return;
      tab=first;syncTabs();renderTab();
    });
    $g.appendChild(b);
  }
  const grp=ST_GROUPS.find(g=>g.id===stGroup);
  let shown=0;
  document.querySelectorAll("#stTabs button").forEach(b=>{
    const ok=has.indexOf(b.dataset.tab)>=0&&grp&&grp.tabs.indexOf(b.dataset.tab)>=0;
    b.style.display=ok?"":"none";
    if(ok)shown++;
    b.classList.toggle("on",b.dataset.tab===tab);
  });
  /* одна вкладка в разделе — вторая ступень только мешает */
  document.getElementById("stTabs").classList.toggle("solo",shown<2);
  /* и обе полосы подводят выбранное под глаз (15-input) */
  if(typeof tabsSync==="function"){tabsSync($g);tabsSync(document.getElementById("stTabs"));}
}
function repairCost(){
  /* репутация станции идёт в цену работы: чинят руки, а не рынок (12k-rep).
     Станции под рукой может не быть: экран остаётся открытым, когда стыковку
     отпустили под ним (загрузка сейва). Цена всё равно обязана быть числом —
     иначе отрисовка вкладки умирает целиком и экран становится ловушкой
     (M331, тот же случай, что у closeStation) */
  const S=G.st||(G.sys&&G.sys.station);
  if(!S)return 4;
  return Math.max(4,Math.round(14*stTypeOf(S.stype).rep*repRepairMul()*(typeof holdRepairMul==="function"?holdRepairMul():1)));   /* Ремонтный док (F1) */
}
function closeStation(){
  if(typeof vegaLaunchHold==="function"&&vegaLaunchHold())return;   /* зеркало (M153): раз в день — «вы обещали остаться» */
  if(typeof folkLeave==="function")folkLeave();   /* свои остались на станции (12u-folk) */
  /* блошинец (12ua): то, что про вас записано, вы либо забрали, либо оставили
     на прилавке — и тогда его покупает кто-то другой */
  if(typeof fleaLeave==="function")fleaLeave(G.sys);
  if(typeof traineeFind==="function")traineeFind();   /* заяц в трюме после блошинца (M163) */
  $st.classList.remove("open");G.mode="system";
  /* ── дверь обязана открываться всегда (M331) ──
     Стыковку могут отпустить под открытым экраном: загрузка сейва (своя или
     приехавшая из облака) ставит `G.st=null`, а экран остаётся. Раньше
     ОТСТЫКОВАТЬСЯ падала на `S.x` — то есть единственная кнопка, которая
     обязана работать в любом состоянии, не работала именно тогда, когда она
     единственная. Нет станции — просто выходим в космос, без отхода от неё. */
  const S=G.st||(G.sys&&G.sys.station);
  if(S){
    const dx=G.ship.x-S.x,dy=G.ship.y-S.y,d=Math.hypot(dx,dy)||1;
    G.ship.x=S.x+dx/d*150;G.ship.y=S.y+dy/d*150;
    G.ship.vx=S.vx||0;G.ship.vy=S.vy||0;
  }
  say("Отстыковка");
  /* запись на выходе — парой к записи на входе (плейтест 30.08.2026): вход
     сохранял 428 кр до ремонта, а всё купленное в доке жило лишь до перезагрузки */
  saveGame(true);
}
document.querySelectorAll("#stTabs button").forEach(b=>b.addEventListener("click",()=>{
  document.querySelectorAll("#stTabs button").forEach(x=>x.classList.remove("on"));
  b.classList.add("on");tab=b.dataset.tab;renderTab();
}));
document.getElementById("bUndock").addEventListener("click",closeStation);
/* тетрадь поверх станции (плейтест 02.09): слухи и дела ложатся на стол, а
   смотреть их приходилось, отстыковавшись. Стол закрывается своим ЗАКРЫТЬ,
   станция под ним остаётся */
document.getElementById("stDesk").addEventListener("click",()=>{sfx("ui");tableToggle(true);});
document.getElementById("bRefuel").addEventListener("click",()=>{
  const st=stat(),need=Math.ceil(st.fuelMax-G.fuel);
  if(need<=0){say("Баки полны");return;}
  const per=fuelPriceHere(),can=Math.min(need,Math.floor(G.credits/per));
  if(can<=0){say("Не хватает кредитов");return;}
  G.credits-=can*per;G.fuel+=can;renderTab();
});
document.getElementById("bRepair").addEventListener("click",()=>{
  const st=stat(),need=Math.ceil(st.hullMax-G.hull);
  if(need<=0){say("Корпус цел");return;}
  const per=repairCost(),can=Math.min(need,Math.floor(G.credits/per));
  if(can<=0){say("Не хватает кредитов");return;}
  G.credits-=can*per;G.hull+=can;renderTab();
  if(typeof placeNote==="function")placeNote("care",1);   // починка здесь — забота о месте (11d)
  if(typeof seamAdd==="function")seamAdd();               // заплатка остаётся швом (12s, M256)
});
function el(tag,cls,html){const e=document.createElement(tag);if(cls)e.className=cls;
  /* правило 1 оформления: капслок — подписям, а не тексту. Длинный заголовок
     секции — это фраза, которую читают, и она набирается обычным текстом */
  /* цепочка «ИМЯ · объяснение» с короткой головой остаётся заголовком (M300):
     secTidy разделит её на заголовок и заметку; иначе секция теряла начало и
     на доске уезжала в чужую полосу */
  const chain=cls==="sec"&&typeof html==="string"&&html.indexOf(" · ")>0&&html.split(" · ")[0].trim().length<=SEC_CAP&&html.indexOf("<")<0;
  if(cls==="sec"&&typeof html==="string"&&!chain&&(html.length>48||html.indexOf(" — ")>=0)){
    e.className="sec note";
    /* исходники набраны капслоком под прежний стиль; фраза переводится в
       обычный регистр с заглавной в начале предложения */
    if(!/[а-яёa-z]/.test(html))html=html.toLocaleLowerCase("ru").replace(/(^|[.!?]\s+)([а-яёa-z])/g,(m,a,b)=>a+b.toUpperCase());
  }
  if(html!=null)e.innerHTML=html;return e;}
/* ══════════════ заголовки и полосы (M299, docs/DESIGN-screens.md §1a) ══════════════
   Заголовок называет, а не объясняет: три слова, счётчик справа отдельной
   цифрой, объяснение — заметкой в одну строку при первом заходе, потом за
   чипом «?». Раньше .sec делал обе работы разом, и страница читалась одной
   серой массой без начал. */
function secHead(title,opt){
  opt=opt||{};
  const h=el("div","sec"+(opt.lane?" lane":"")+(opt.cls?" "+opt.cls:""),"");
  const t=document.createElement("span");t.textContent=title;h.appendChild(t);
  if(opt.back){
    const b=document.createElement("button");b.className="cnt q";b.innerHTML="<i>В ЗАЛ</i>";
    b.onclick=ev=>{ev.stopPropagation();opt.back();};h.appendChild(b);
  }else if(opt.count!=null){
    const c=document.createElement("span");c.className="cnt";c.textContent=opt.count;h.appendChild(c);
  }
  let n=null;
  if(opt.note){
    const key="sec:"+(opt.key||title);
    G.seen=G.seen||{};
    if(!G.seen[key]){G.seen[key]=1;secHead.open[key]=true;}
    /* чип визуально 22 px, а зона нажатия 44 (закон 44 px): пилюля — внутри кнопки */
    const q=document.createElement("button");q.className="q";q.innerHTML="<i>?</i>";
    h.appendChild(q);
    n=el("div","sec note",opt.note);
    if(!secHead.open[key])n.style.display="none";
    q.onclick=ev=>{ev.stopPropagation();secHead.open[key]=!secHead.open[key];n.style.display=secHead.open[key]?"":"none";};
  }
  (opt.into||$body).appendChild(h);
  if(n)(opt.into||$body).appendChild(n);
  return h;
}
secHead.open={};
/* блок за сгибом: содержимое рисуется всегда (счётчик честный), показывается по нажатию */
function foldBlock(title,fn,key){
  key=key||title;
  const open=!!foldBlock.open[key];
  const n0=$body.children.length;
  fn();
  const nodes=[...$body.children].slice(n0);
  if(!nodes.length)return;
  const box=el("div","foldbox","");
  for(const x of nodes)box.appendChild(x);
  const secs=nodes.filter(x=>x.classList.contains("sec")&&!x.classList.contains("note")).length||1;
  const h=secHead(title,{count:(open?"СВЕРНУТЬ":"ЕЩЁ · "+secs),cls:"fold"+(open?" on":"")});
  h.style.cursor="pointer";
  h.onclick=()=>{foldBlock.open[key]=!open;renderTab();};
  if(!open)box.style.display="none";
  $body.appendChild(box);
}
foldBlock.open={};
/* ── пост-проход по заголовкам (M299) ──
   Тридцать модулей набирали заголовки цепочкой «НАЗВАНИЕ · ОБЪЯСНЕНИЕ · СЧЁТ».
   Не переписывать тридцать модулей: после рендера каждая .sec длиннее 32
   знаков делится по первому « · » — голова остаётся заголовком, хвост уходит
   заметкой обычным регистром, цифра на конце — счётчиком справа. Заголовок без
   « · » длиннее 32 целиком становится заметкой (как делает el при 48). */
const SEC_CAP=24;   /* было 32 (0.296.0); §1a просит 24 */
function secTidy(root){
  root=root||$body;
  const lc=t=>t.toLocaleLowerCase("ru").replace(/(^|[.!?]\s+)([а-яёa-z])/g,(m,a,b)=>a+b.toUpperCase());
  for(const h of [...root.querySelectorAll(".sec")]){
    if(h.classList.contains("note")||h.classList.contains("lane")||h.querySelector(".q,.cnt"))continue;
    const sp=h.querySelector("span");
    const txt=(sp?sp.textContent:h.textContent).trim();
    if(txt.length<=SEC_CAP)continue;
    const segs=txt.split(" · ").map(x=>x.trim()).filter(Boolean);
    let cnt=null;
    if(segs.length>1&&/\d/.test(segs[segs.length-1])&&segs[segs.length-1].length<=14)cnt=segs.pop();
    let head=segs.shift(),rest=segs.join(" · ");
    if(head.length>SEC_CAP){rest=rest?head+" · "+rest:head;head="";}
    if(!head){h.className="sec note";h.textContent=lc(rest);continue;}
    h.textContent="";
    const s1=document.createElement("span");s1.textContent=head;h.appendChild(s1);
    if(cnt){const c=document.createElement("span");c.className="cnt";c.textContent=cnt;h.appendChild(c);}
    if(rest){const n=el("div","sec note",lc(rest));h.parentNode.insertBefore(n,h.nextSibling);}
  }
}
/* ── доска в три полосы ──
   Тридцать блоков в порядке вех — это changelog, а не стена. Секции (заголовок
   и всё до следующего) раскладываются по трём вопросам: что обращено к вам,
   что есть здесь, что далеко. Внутри полосы первыми идут секции с кнопкой;
   сверх семи — за сгибом. Модули не трогаются: сортировка по заголовку. */
const LANE_RX=[
  [/^(ОЧЕРЕДЬ|У ДОКА|В ЗАЛЕ|У СТОЙКИ|ВЕЗЁТЕ|ЧТО ПРЕДЛАГАЮТ|ДЕЛА ЗДЕСЬ|ПИСЬМ|ПОСЫЛКА|ЭКСПЕДИЦИЯ|ЕСТЬ МЕСТО|ТАБЛО|ДОСКА ПОЧЁТА|ДИПЛОМ|ЗИМОВКА|ЧТО РАССКАЗЫВАЮТ|У КОГО|ВАМ)/i,"you"],
  [/^(О ЧЁМ|СЛУХ|ИМЯ СИСТЕМЫ|ДАЛЕКО)/i,"far"]
];
const LANE_RU={you:"К ВАМ",here:"ЗДЕСЬ",far:"ДАЛЕКО"};
function boardLanes(from){
  const nodes=[...$body.children].slice(from||0);
  if(!nodes.length)return;
  const secs=[];let cur=null;
  for(const x of nodes){
    const isHead=x.classList.contains("sec")&&!x.classList.contains("note")&&!x.classList.contains("lane");
    if(isHead||!cur){cur={head:isHead?x:null,nodes:[],lane:"here"};secs.push(cur);
      if(isHead){const t=(x.querySelector("span")||x).textContent.trim();
        for(const [rx,l] of LANE_RX)if(rx.test(t)){cur.lane=l;break;}}}
    cur.nodes.push(x);
  }
  for(const x of nodes)x.remove();
  for(const lane of ["you","here","far"]){
    const L=secs.filter(s=>s.lane===lane);
    if(!L.length)continue;
    L.sort((a,b)=>(b.nodes.some(n=>n.querySelector&&n.querySelector("button"))?1:0)-(a.nodes.some(n=>n.querySelector&&n.querySelector("button"))?1:0));
    secHead(LANE_RU[lane],{lane:1,count:L.length>1?L.length:null});
    const key="lane:"+lane,open=!!foldBlock.open[key];
    L.forEach((s,i)=>{
      if(i<7||open){for(const n of s.nodes)$body.appendChild(n);}
    });
    if(L.length>7){
      const h=secHead(open?"СВЕРНУТЬ":"ЕЩЁ · "+(L.length-7),{cls:"fold"+(open?" on":"")});
      h.style.cursor="pointer";h.onclick=()=>{foldBlock.open[key]=!open;renderTab();};
    }
  }
}
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
  /* Тир — первое, что видно в строке: он говорит, встретите ли вы такой ещё раз */
  const T=typeof tierOf==="function"?tierOf(S):null;
  r.appendChild(el("div","nm","<b style='color:"+S.col+"'>«"+S.ru+"» <span style='color:var(--dim)'>"+
    S.cls+"</span></b><s>"+(T?"<b style='color:"+T.col+"'>"+T.ru.toUpperCase()+"</b> — "+T.note+"<br>":"")+
    S.note+"<br>тяга "+S.thr.toFixed(2)+" · поворот "+S.turn.toFixed(2)+
    " · трюм "+S.cargo+" · бак "+S.fuel+" · корпус "+S.hull+"</s>"));
  if(mine)r.appendChild(el("div","qt","В РЕЙСЕ"));
  else{
    /* цена корпуса с поправкой на то, как к вам тут относятся (12k-rep) */
    const pay=Math.round(S.price*repShipMul(G.sys));
    const b=el("button","act"+(own?"":" gold"),own?"ПЕРЕСЕСТЬ":pay.toLocaleString("ru")+" кр");
    b.disabled=!own&&G.credits<pay;
    b.onclick=()=>{
      /* касса проверяется В МОМЕНТ нажатия, а не при отрисовке: между ними
         другой тычок мог её опустошить, и второй тычок уводил счёт в минус
         (сеть «полный трюм», 0.360.0) */
      if(!own&&G.credits<pay){say("НЕ ХВАТАЕТ КРЕДИТОВ",60);return;}
      if(!own){G.credits-=pay;G.owned[id]=true;
        logAdd("money","Куплен корабль «"+S.ru+"» за "+pay.toLocaleString("ru")+" кр");
        /* вторая строка «Ключа от верфи»: уникальный корпус приходит не пустым */
        if(relicDeep("key")&&id[0]==="u"){
          const seed=hashi(S.seed||0,0x4EF0,3);
          for(let i=0;i<2;i++)addPart(genPart(hashi(seed,i,0x71),2));
          logAdd("tech","«Ключ от верфи»: корпус пришёл с частями");
        }}
      else logAdd("dim","Пересадка на «"+S.ru+"»");
      G.shipId=id;
      const ns=stat();
      G.fuel=Math.min(G.fuel,ns.fuelMax);G.hull=Math.min(G.hull,ns.hullMax);
      let over=held()-ns.cargoMax;
      /* людей (M114) за борт не высыпают: при пересадке лишним оказывается
         груз, а не пассажиры — они остаются, даже если трюм стал теснее */
      for(const k of RES_KEYS){if(over<=0)break;
        if(PAX_KEYS.indexOf(k)>=0)continue;
        const t=Math.min(over,G.cargo[k]);G.cargo[k]-=t;over-=t;}
      say("Приняли «"+S.ru+"»");renderTab();
    };
    r.appendChild(b);
  }
  return r;
}
/* ── экран не прыгает вверх ──
   Плейтест 30.08.2026: «в кантине скролишь вниз, а вверху надо тыкать; нажал —
   экран прыгает вверх». Причина не в кантине: любое нажатие внутри вкладки
   перебирает $body заново, а вместе с ним обнуляется и прокрутка. Игрок
   ответил человеку в пятом ряду — и смотрит на шапку, заново ищет, где был.

   Место чтения принадлежит игроку, а не рендеру. Та же вкладка возвращается на
   ту же высоту; смена вкладки и новая стыковка — в начало, потому что это уже
   другой экран. Восстанавливаем и кадром позже: канвы зала и рубки меряют себя
   по разложенной панели, и высота списка на первом кадре ещё не окончательная. */
function renderTab(){
  const same=renderTab._tab===tab;
  const keep=same?$body.scrollTop:0;
  renderTab._tab=tab;
  renderTabBody();
  secTidy($body);   /* заголовки по закону §1a (M299) */
  if(typeof addrify==="function")addrify($body);   /* всякий адрес — на карту (M347) */
  if(keep>0){
    const put=()=>{$body.scrollTop=Math.min(keep,Math.max(0,$body.scrollHeight-$body.clientHeight));};
    put();requestAnimationFrame(put);
  }
}
function renderTabBody(){
  const st=stat();
  document.getElementById("wCr").textContent=G.credits.toLocaleString("ru")+" кр";
  document.getElementById("wDt").textContent=G.data+" данных";
  $body.innerHTML="";
  if(tab==="none"){
    /* заправочная: вкладок нет вовсе, но экран не должен выглядеть сломанным */
    $body.appendChild(el("div","sec","ТОПЛИВО "+fuelPriceHere()+" кр/ед · РЕМОНТ "+repairCost()+" кр/ед · "+repLine(G.sys).toUpperCase()));
    $body.appendChild(el("div","row","<div class='nm'><b>Только заправка и ремонт</b>"+
      "<s>перевалочный узел на отшибе: ни рынка, ни верфи, ни лаборатории —<br>"+
      "зато баки полны и корпус залатан</s></div>"));
    return;
  }
  if(tab==="board"){
    /* ДОСКА (M151a): всё, что мир говорит о себе, на одной стене — очередь у
       стойки, дела здесь, табло прибытий, слухи, имя системы. Сюда же лягут
       наряды (M152e), циркуляр (M156), стенгазета (M165), доска почёта (M161). */
    if(stTypeOf(G.st.stype).tabs.length===0)
      $body.appendChild(el("div","sec","ТОПЛИВО "+fuelPriceHere()+" кр/ед · РЕМОНТ "+repairCost()+" кр/ед · "+repLine(G.sys).toUpperCase()));
    const sp=(typeof speechHere==="function")?speechHere():null;
    if(sp){
      secHead("ОЧЕРЕДЬ У СТОЙКИ",{count:sp.addr});
      $body.appendChild(el("div","row","<div class='nm'><s style='color:#cfe3ea;line-height:1.9'>"+
        (sp.silent?"<i>смотрит и ничего не говорит</i>":sp.line)+"</s><s>следующая реплика — в следующий заход</s></div>"));
      const tag=G.sys.key+"#"+visitHere();
      if(G.spLogged!==tag&&!sp.silent){G.spLogged=tag;peopleLine(sp.line,G.st.name);}
    }
    /* ── кто здесь (12u-folk) ──
       Свои. Стоят не на каждом причале и не каждую смену: человек, который
       есть всегда, перестаёт быть человеком. Говорят про своё и никогда — про
       игрока; попросить о чём-нибудь тоже не могут, это не их разговор. */
    if(typeof folkShown==="function"){
      const fs=folkShown();
      if(fs&&FOLK[fs.id]){
        /* подпись, кто это (M299): голое «РЫБА» с цитатой читалось сбоем */
        secHead(FOLK[fs.id].where==="dock"?"У ДОКА":"В ЗАЛЕ");
        $body.appendChild(el("div","row","<div class='nm'><b>"+FOLK[fs.id].ru+" · завсегдатай</b>"+
          "<s style='color:#cfe3ea;line-height:1.8'>"+fs.line+"</s></div>"));
      }
    }
    /* ── рассказать, где взяли (11aj) ──
       Появляется, только если он и правда где-то взял заметно, и только по разу
       на место. Ни предупреждения, ни последствий в тексте: человек слушает,
       благодарит, и всё. Счёт придёт через несколько дней и чужим голосом. */
    if(typeof toldWorth==="function"){
      const tw=toldWorth();
      if(tw){
        $body.appendChild(el("div","sec","У СТОЙКИ СЛУШАЮТ"));
        const r=el("div","row");
        r.appendChild(el("div","nm","<b>Рассказать, где взяли "+
          RES[tw.res].ru.toLowerCase()+"</b><s>тут любят, когда делятся</s>"));
        const b=el("button","act","РАССКАЗАТЬ");
        b.onclick=()=>{toldDo();renderTab();};
        r.appendChild(b);$body.appendChild(r);
      }
    }
    /* ── что вы уже взяли ──
       Не задание: ни стрелки, ни срока, ни напоминания вне этой строки.
       Настоящий журнал — бумага на столе (27i), она ложится туда при взятии.
       Здесь только строчка, чтобы человек, стоящий у доски, не вспоминал по
       памяти, куда он собирался. */
    if(typeof offerCarried==="function"){
      const car=offerCarried();
      if(car.length){
        $body.appendChild(el("div","sec","ВЕЗЁТЕ"));
        for(const o of car){
          const K=OFFER_KIND[o.kind];
          $body.appendChild(el("div","row","<div class='nm'><b>"+
            K.ru[0].toUpperCase()+K.ru.slice(1)+"</b><s>на «"+o.to.name+"»"+
            (o.named?" · вас назвали":"")+"</s></div>"));
        }
      }
    }
    /* ── возможности (11ah) ──
       Не задания: у них нет цели, нет маркера и нет напоминания. Это то, что
       здесь сегодня предлагают, и половина предложений — не тебе.
       Именное стоит первым и подписано «вам»: разница между «кто рядом» и
       «вам» — это вся дуга книги, набранная двумя словами. Платит оно втрое,
       и в этом весь смысл — закрытую дверь игрок почувствует кошельком, а не
       строкой интерфейса. */
    if(typeof offerHere==="function"){
      const oh=offerHere();
      if(oh.length){
        oh.sort((a,b)=>b.named-a.named);
        $body.appendChild(el("div","sec","ЧТО ПРЕДЛАГАЮТ"));
        for(const o of oh){
          const K=OFFER_KIND[o.kind];
          const r=el("div","row");
          r.appendChild(el("div","nm","<b>"+(o.named?"Вам":K.ru[0].toUpperCase()+K.ru.slice(1))+
            (o.named?" — "+K.ru:"")+"</b><s>"+K.note+"</s>"));
          const pay=offerPay(o);
          if(pay>0)r.appendChild(el("div","qt",pay+"<s>кр</s>"));
          const b=el("button","act"+(o.named?" gold":""),"ВЗЯТЬ");
          b.onclick=()=>{
            offerTake(o);
            const d=o.to;
            tell("","Взято: "+K.ru+(d?" · на «"+d.name+"»":""),
                 d?K.ru+"\nна «"+d.name+"»":K.ru);
            renderTab();
          };
          r.appendChild(b);$body.appendChild(r);
        }
      }
    }
    if(typeof questOpen==="function"){
      const here=questOpen().filter(q=>q.sx===G.sx&&q.sy===G.sy);
      if(here.length){
        $body.appendChild(el("div","sec","ДЕЛА ЗДЕСЬ"));
        for(const q of here)$body.appendChild(el("div","row","<div class='nm'><b>"+q.ru+"</b><s>"+(q.note||"")+
          (q.reward?" · награда: "+q.reward:"")+"</s></div>"));
      }
    }
    if(typeof needBlock==="function")needBlock();         /* нужда и наряд (M152e) */
    if(typeof appetiteBlock==="function")appetiteBlock();  /* что станция берёт с надбавкой (M290) */
    if(typeof rungBoardBlock==="function")rungBoardBlock();  /* пятилетка и что здесь стоит (M292) */
    if(typeof holdMeteoLines==="function"){const ML=holdMeteoLines(G.sys);   /* Метеостанция (I6) */
      if(ML.length){$body.appendChild(el("div","sec","МЕТЕОСТАНЦИЯ · ПОГОДА НА ТЕЛАХ"));
        for(const l of ML)$body.appendChild(el("div","row","<div class='nm'><s>"+l+"</s></div>"));}}
    if(typeof findsBlock==="function")findsBlock();       /* находки: институту или с рук (M152e) */
    if(typeof kitDepotBlock==="function")kitDepotBlock();   /* склад института: комплект (M152) */
    if(typeof vegaFleaBlock==="function")vegaFleaBlock();   /* дед с лотка (M153) */
    if(typeof ringBlock==="function")ringBlock();           /* ленты Кольца (M154) */
    if(typeof misBlock==="function")misBlock();             /* часы станции против неба (M155) */
    if(typeof expBlock==="function")expBlock();             /* экспедиция: собираем, отпустить, попутчик (M156) */
    if(typeof lettersBlock==="function")lettersBlock();     /* письма с содержанием (M158) */
    if(typeof expOfferBlock==="function")expOfferBlock();   /* есть место (M159) */
    if(typeof islandBlock==="function")islandBlock();       /* письмо на Остров (M160) */
    if(typeof recordBlock==="function")recordBlock();       /* доска почёта, комиссия (M161) */
    if(typeof instBlock==="function")instBlock();           /* институт: темы и отчёты (M162) */
    if(typeof skyBlock==="function")skyBlock();             /* небесная вахта (M195) */
    if(typeof winBlock==="function")winBlock();             /* зимовка: месяц одному (M197) */
    if(typeof traineeBlock==="function")traineeBlock();     /* диплом стажёру (M163) */
    if(typeof zooBlock==="function")zooBlock();             /* зоостанция (M164) */
    if(typeof wallBlock==="function")wallBlock();           /* стенгазета и заявки (M165) */
    if(typeof retBlock==="function")retBlock();           /* табло прибытий (11s) */
    if(typeof rumourBlock==="function")rumourBlock();     /* слухи (11t) */
    /* имя системы ушло с доски на карту (M299): поле «ваше имя. На карте — оно»
       читалось как имя капитана, и туда вписывали позывной */
    boardLanes(0);
    $body.appendChild(el("div","sec","ПРИЁМНИК — НА ПУЛЬТЕ ВНИЗУ · У СТОЙКИ ЛОВИТ ЛУЧШЕ"));
    return;
  }
  if(tab==="market"){
    const prices=marketFor(G.sys),mkt=G.market[G.sys.key];
    $body.appendChild(el("div","sec","ТРЮМ "+held()+" / "+st.cargoMax+
      " · ТОПЛИВО "+fuelPriceHere()+" кр/ед · РЕМОНТ "+repairCost()+" кр/ед"));
    /* Маршрут переехал в конец вкладки (проход «дорога»). Он стоял вторым
       блоком сверху, и у игрока без маршрута — то есть у всякого, кто открыл
       рынок впервые, — первая цена оказывалась ниже середины экрана: шапка,
       пустой маршрут в три строки, «трюм пуст», и только потом товар.
       Рынок открывают ради цен; маршрут — это планирование, ему место после
       того, ради чего пришли. Учить он меньше не стал, просто ждёт своей
       очереди.
       Но заведённый маршрут — не подсказка, а дело: он говорит, что грузить
       прямо сейчас. Такой остаётся наверху. */
    const hasRoute=(typeof routeOf==="function")&&routeOf().legs.length>=2;
    if(hasRoute)renderRoute();
    let any=false,tot=0;
    for(const k of TRADE_KEYS){
      const q=G.cargo[k];if(!q)continue;any=true;
      const price=prices[k],base=RES[k].price;
      /* котировка с аппетитом (M290): тег говорит правду для первых N единиц и
         для (N+1)-й — «берут первые 6», а не «выгодно» на весь трюм */
      const Q=(typeof sellQuote==="function")?sellQuote(G.sys,k,q):{revenue:q*price,nA:0,priceA:price};
      tot+=Q.revenue;
      let tg=price>base*1.12?"выгодно":(price<base*.9?"дёшево":"обычная цена");
      if(Q.nA)tg="берут первые "+Q.nA+" по "+Q.priceA+" кр"+(Q.nA<q?", остальное "+price:"");
      if((mkt.pressure[k]||0)<-.05)tg+=" · недавно продавали здесь";
      const r=el("div","row");
      r.appendChild(el("div","nm","<b style='color:"+RES[k].col+"'>"+RES[k].ru+
        "</b><s>"+price+" кр/ед · "+tg+" (база "+base+")</s>"));
      r.appendChild(el("div","qt",q+"<s>"+Math.round(Q.revenue).toLocaleString("ru")+" кр</s>"));
      const b=el("button","act"+(Q.nA?" gold":""),"ПРОДАТЬ");
      b.onclick=()=>{const rev=sellCargo(G.sys,k,q),L=sellCargo.last||{};
        const extra=L.nA?" · "+L.nA+" с надбавкой":"";
        tell("money","Продано на «"+G.st.name+"»: "+RES[k].ru.toLowerCase()+" ×"+q+" · +"+rev.toLocaleString("ru")+" кр"+extra,
             "Продано: "+RES[k].ru+" ×"+q+"\n+"+rev.toLocaleString("ru")+" кр"+extra);
        renderTab();};
      r.appendChild(b);$body.appendChild(r);
    }
    if(any){
      const r=el("div","row");
      r.appendChild(el("div","nm","<b>Продать весь груз</b><s>по ценам этой станции</s>"));
      r.appendChild(el("div","qt",tot.toLocaleString("ru")+"<s>кр</s>"));
      const b=el("button","act gold","ПРОДАТЬ ВСЁ");
      b.onclick=()=>{let sum=0,n=0;
        for(const k of TRADE_KEYS){const q=G.cargo[k];if(q>0){sum+=sellCargo(G.sys,k,q);n+=q;}}
        tell("money","Груз сдан на «"+G.st.name+"» · "+n+" ед · +"+sum.toLocaleString("ru")+" кр",
             "Груз реализован\n+"+sum.toLocaleString("ru")+" кр");
        renderTab();};
      r.appendChild(b);$body.appendChild(r);
    }else $body.appendChild(el("div","sec","ТРЮМ ПУСТ — САДИТЕСЬ НА ПЛАНЕТУ ИЛИ ИДИТЕ В ПОЯС"));
    /* прилавок ВЗЯТЬ — кооперативу, запись — на станции дома (12aj, M351) */
    if(typeof coopCounterBlock==="function")coopCounterBlock();
    if(typeof coopRegBlock==="function")coopRegBlock();
    /* редкое лежит в том же трюме, но купить его никто не возьмётся:
       оно тратится, а не продаётся — поэтому отдельной секцией и без кнопки */
    if(RARE_RES.some(k=>G.cargo[k]>0)){
      $body.appendChild(el("div","sec","РЕДКОЕ СЫРЬЁ · РЫНОК НЕ БЕРЁТ · ИДЁТ НА ЛАБОРАТОРИЮ, БАЗЫ И КОРАБЛИ · ЛИШНЕЕ БЕРУТ ТОРГОВЫЕ БАРЖИ"));
      for(const k of RARE_RES){
        const q=G.cargo[k];if(!q)continue;
        const r=el("div","row");
        /* сперва «зачем», потом «откуда»: игрок и так знает, где это взял */
        r.appendChild(el("div","nm","<b style='color:"+RES[k].col+"'>"+RES[k].ru+"</b><s>"+
          (RES[k].use?RES[k].use+" · добыча: "+RES[k].rare:RES[k].rare)+"</s>"));
        r.appendChild(el("div","qt",q+"<s>ед</s>"));
        $body.appendChild(r);
      }
    }
    /* промышленное (M291): рынок не берёт — ряд называет ближайший свой цех, который ест */
    if(IND_KEYS.some(k=>G.cargo[k]>0)){
      $body.appendChild(el("div","sec","ПРОМЫШЛЕННОЕ · РЫНОК НЕ БЕРЁТ · СДАЁТСЯ В СВОЙ ЦЕХ"));
      for(const k of IND_KEYS){
        const q=G.cargo[k];if(!q)continue;
        const e=(typeof holdNearestEater==="function")?holdNearestEater(k):null;
        const r=el("div","row");
        r.appendChild(el("div","nm","<b style='color:"+RES[k].col+"'>"+RES[k].ru+"</b><s>"+
          (e?(e.d?"едят на «"+e.name+"» · "+e.d+" "+pl3(e.d,"прыжок","прыжка","прыжков"):"едят здесь — вкладка СТРОЙКА"):"едока пока нет — поставьте цех, который это ест")+"</s>"));
        r.appendChild(el("div","qt",q+"<s>ед</s>"));
        $body.appendChild(r);
      }
    }
    $body.appendChild(el("div","sec","ЗАКУПОЧНЫЕ ЦЕНЫ ЗДЕСЬ — МЕНЯЮТСЯ ОТ ПРОДАЖ И СО ВРЕМЕНЕМ"));
    for(const k of TRADE_KEYS){
      const r=el("div","row");
      r.appendChild(el("div","nm","<b style='color:"+RES[k].col+"'>"+RES[k].ru+"</b>"));
      r.appendChild(el("div","qt",prices[k]+"<s>кр/ед</s>"));
      $body.appendChild(r);
    }
    if(!hasRoute)renderRoute();
  }
  else if(tab==="yard"){
    /* Под блокадой док не строит и не продаёт: занятость — это отнятые службы,
       а не отнятые числа. Топливо остаётся всегда, иначе игрок застревает */
    if(!occService("yard")){
      $body.appendChild(el("div","sec","ДОК ЗАКРЫТ · СИСТЕМА ПОД ПИРАТАМИ"));
      $body.appendChild(el("div","row","<div class='nm'><s>"+occInfo(occHere()).note+
        "<br>верфь откроется, когда систему отобьют: сбивайте патрули здесь же — "+
        "счёт идёт по этой системе.</s></div>"));
    }else{
    /* Ряд дока, а не склад всей галактики: что стоит здесь сегодня. Ряд держится
       на seed станции и временном бакете — вернулись через час, ряд другой. */
    /* ── налёт часов ──
       Верфь берёт деньги и снимает половину: работа сменная, корабль ждать
       не будет. До чистого доводят только дома, в своём гараже (12s-wear). */
    $body.appendChild(el("div","sec",wearLine()));
    {
      /* ── у верфи есть пол (M235) ──
         Он назван числом прямо в строке: игрок должен видеть, ЧТО именно
         купит, и почему второй раз нажимать бессмысленно. Ниже пола налёт
         снимают только дома, и об этом сказано здесь же. */
      const floor=wearFloor();
      const w=wearOf();
      if(w>floor+.02){
        const cost=wearYardCost();
        const r=el("div","row");
        r.appendChild(el("div","nm","<b>Обслуживание корпуса</b><s>"+
          "пескоструй, промывка сопел, подкраска: снимут налёт до "+Math.round(floor*100)+"%.<br>"+
          "ниже верфь не берётся — до чистого доводят только в своём гараже</s>"));
        r.appendChild(el("div","qt",cost.toLocaleString("ru")+"<s>кр</s>"));
        const b=el("button","act","ОБСЛУЖИТЬ");
        b.disabled=G.credits<cost;
        b.onclick=()=>{
          if(G.credits<cost)return;
          G.credits-=cost;
          const got=wearServiceTo(floor);
          tell("tech","Обслуживание на «"+G.st.name+"» · снято "+Math.round(got*100)+"% налёта",
               "Корпус обслужен\nналёт "+Math.round(wearOf()*100)+"% · это пол этой верфи\n"+
               "до чистого — только гараж дома");
          renderTab();
        };
        r.appendChild(b);$body.appendChild(r);
      }else if(w>.02){
        $body.appendChild(el("div","row","<div class='nm'><s>налёт "+Math.round(w*100)+
          "% — это пол здешней верфи ("+Math.round(floor*100)+"%), ниже она не берётся. "+
          "На настоящей верфи снимают больше, дома — всё и бесплатно.</s></div>"));
      }
    }
    const yard=stationFleet(G.sys);
    $body.appendChild(el("div","sec","КОРПУСА В ЭТОМ ДОКЕ · РЯД МЕНЯЕТСЯ САМ · МОДУЛИ ПЕРЕСТАВЛЯЮТСЯ БЕСПЛАТНО"));
    for(const id of yard)$body.appendChild(shipRow(id,FLEET[id]));
    /* Свои корпуса из ангара показываем всегда: пересесть обратно можно везде */
    const own=Object.keys(G.owned).filter(id=>id!==G.shipId&&yard.indexOf(id)<0);
    if(own.length){
      $body.appendChild(el("div","sec","ВАШ АНГАР · ПЕРЕСЕСТЬ МОЖНО В ЛЮБОМ ДОКЕ"));
      for(const id of own){const S=shipData(id);if(S)$body.appendChild(shipRow(id,S));}
    }
    /* ── восстановление притащенного корпуса (M369b, §19.3 «tow») ──
       Чёрный корпус на тросе становится вашим не даром и не сразу: док берёт
       за работу, и только после неё у корпуса появляется имя. Порода — та, с
       которой он сошёл со стапеля, и она никуда не девается. */
    if(G.tow){
      const TB=G.tow.by||"gt";
      const TP=(typeof powerOf==="function")?powerOf(TB):null;
      const base=genUniqueShip(hashi(G.tow.seed,0x0E57,7));
      base.by=TB;
      base.cls="восстановленный корпус";
      base.note="Пришёл на тросе чёрным, без имени и огней. "+
        (TP?"Стапель "+TP.ru+".":"")+" Что с ним было — не написано нигде.";
      const cost=Math.round((2200+base.price*.45)/50)*50;
      $body.appendChild(el("div","sec","НА ТРОСЕ · ВОССТАНОВЛЕНИЕ"+(TP?" · "+TP.ru.toUpperCase():"")));
      const rr=el("div","row");
      rr.appendChild(el("div","nm","<b>Чёрный корпус</b><s>"+base.note+
        "<br>тяга "+base.thr.toFixed(2)+" · поворот "+base.turn.toFixed(2)+
        " · трюм "+base.cargo+" · бак "+base.fuel+" · корпус "+base.hull+"</s>"));
      const rb=el("button","act"+(G.credits>=cost?" gold":""),cost.toLocaleString("ru")+" кр");
      rb.disabled=G.credits<cost||G.st.stype!=="yard";
      rb.onclick=()=>{
        if(G.credits<cost){say("НЕ ХВАТАЕТ КРЕДИТОВ",60);return;}
        G.credits-=cost;
        const uid="t"+G.tow.seed;
        G.uniqueShips[uid]=base;G.owned[uid]=true;G.tow=null;
        tell("tech","Корпус восстановлен: «"+base.ru+"»",
          "Восстановлен\n«"+base.ru+"»\n"+(TP?TP.ru:""));
        renderTab();saveGame(true);
      };
      if(G.st.stype!=="yard")rr.appendChild(el("div","qt","ТОЛЬКО ВЕРФЬ"));
      else rr.appendChild(rb);
      $body.appendChild(rr);
    }
    $body.appendChild(el("div","sec","СЕРИЙНЫЙ РЯД · ЕСТЬ В ЛЮБОМ ДОКЕ"));
    for(const id of SHIP_KEYS)$body.appendChild(shipRow(id,SHIPS[id]));
    /* уникальный корпус строят только на верфи — у торгового узла док слабый */
    /* «Ключ от верфи» открывает единственный экземпляр в любом доке, а не
       только на верфи: это его первая строка и есть */
    const offer=(G.st.stype==="yard"||relicOn("key"))?stationUniqueOffer(G.sys):null;
    if(offer){
      const uid="u"+offer.seed;
      G.uniqueShips[uid]=offer;
      $body.appendChild(el("div","sec","НАЙДЕНО ЗДЕСЬ · ЕДИНСТВЕННЫЙ ЭКЗЕМПЛЯР · ПРЕДЛОЖЕНИЕ СМЕНИТСЯ"+
        (relicDeep("key")?" · УЖЕ С ЧАСТЯМИ В СЛОТАХ":"")));
      $body.appendChild(shipRow(uid,offer));
    }
    const dr=DRONES.miner;
    $body.appendChild(el("div","sec","ДРОНЫ · РАЗМЕЩАЮТСЯ НА ЗАЛЕЖИ ИЛИ АСТЕРОИДЕ · САМИ ВОЗЯТ И ПРОДАЮТ РУДУ"));
    const rd=el("div","row");
    /* окупаемость — по ценам ЭТОЙ станции (M350): игрок видит, на какой руде машина себя отобьёт */
    const PM=marketFor(G.sys),pb=["crystal","titan","iron"].filter(k=>PM[k]).map(k=>RES[k].ru.toLowerCase()+" ~"+dronePaybackH(PM[k],dr.ratePerMin*stat().droneRate)+" ч").join(" · ");
    const shop=droneShopHas(G.sys),sells=G.st.stype==="yard"||G.st.stype==="indust";
    rd.appendChild(el("div","nm","<b>"+dr.ru+"</b><s>"+dr.note+
      "<br>окупится: "+(pb||"—")+"<br>в запасе: "+G.droneInventory+" · развёрнуто: "+G.drones.length+
      (sells?(shop?"":"<br>здесь уже брали — следующая машина через двое суток"):"<br>продают только верфь и завод")+"</s>"));
    const bd=el("button","act"+(shop?" gold":""),dr.price.toLocaleString("ru")+" кр");
    bd.disabled=G.credits<dr.price||!shop;
    bd.onclick=()=>{if(!droneShopTake(G.sys))return;G.credits-=dr.price;G.droneInventory++;
      tell("money","Куплен "+dr.ru.toLowerCase()+" за "+dr.price.toLocaleString("ru")+" кр",
           "Дрон куплен\nв запасе: "+G.droneInventory);
      renderTab();};
    rd.appendChild(bd);$body.appendChild(rd);
    /* машина, а не строка списка (M237): номер, состояние, круги. Весь
       список маршрутов живёт на столе, здесь — что стоит в этой системе */
    for(const d of G.drones){
      const home=nearestStation(d.sx,d.sy);
      const r=el("div","row");
      const mk=(typeof droneFar==="function")?droneFar(d):null;
      r.appendChild(el("div","nm","<b style='color:"+RES[d.res].col+"'>"+droneName(d)+" · "+RES[d.res].ru+
        "</b><s>сектор "+d.sx+":"+d.sy+" · возит на «"+(mk?mk.name:home.name)+"» · "+droneStateRu(d)+
        " · кругов "+(d.trips|0)+" · "+(d.earned|0).toLocaleString("ru")+" кр"+(d.pool>=0?" · осталось "+d.pool:"")+"</s>"));
      /* отозвать можно только там, где машина работает: за ней надо прилететь (M350) */
      if(d.sx===G.sx&&d.sy===G.sy){
        const rb=el("button","act sm","ВЕРНУТЬ");
        rb.onclick=()=>{droneRecall(d);renderTab();};
        r.appendChild(rb);
      }
      $body.appendChild(r);
    }
  }
  }
  else if(tab==="mods"){stTabMods();}
  else if(tab==="instr"){stTabInstr();}
  else if(tab==="lab"){stTabLab();}
  else if(tab==="fuse"){stTabFuse();}
  else if(tab==="site"){if(typeof renderSiteTab==="function")renderSiteTab();}
  else if(tab==="bases"){
    renderBasesTab(st);
  }
  else if(tab==="cantina"){renderCantina();}
  /* боны дома (M113): вкладка живёт в своём модуле, 12u-scrip */
  else if(tab==="flea"){fleaRender();}
  else if(tab==="scrip"){scripRender();}
  else if(tab==="crew"){
    /* одна вкладка на всё: кто уже работает — сверху, кандидаты станции — ниже.
       Отсюда же выдают корабль, дают приказ и рассчитывают. */
    crewTick();
    /* ── чего наёмнику не хватает, СКАЗАНО ДО НАЙМА (обход третьего часа, M215) ──
       Новичок платит за человека треть всех своих денег — и только после этого
       узнаёт, что тот не может выполнить ни одного приказа: «корабль: не выдан ·
       свободных корпусов нет — купите или пересядьте». На экране найма про это
       не было ни слова: ни в шапке, ни в описании специальности, ни в строке
       кандидата. Деньги уже потрачены, и отменить нечем.

       Строка появляется ТОЛЬКО когда свободного корпуса и правда нет: у того, у
       кого второй корабль есть, это шум. То же правило, что и везде, — над
       миром висит лишь то, что нужно прямо сейчас. */
    /* тот же счёт, что и у кнопки выдачи ниже: свободен корпус из ангара,
       кроме того, на котором летите сами и который уже кому-то выдан */
    const spare=Object.keys(G.owned||{})
      .filter(id=>id!==G.shipId&&!G.crew.some(o=>o.shipId===id)).length;
    if(typeof coopHas==="function"&&!coopHas())$body.appendChild(el("div","sec","НАНИМАТЬ МОГУТ ТОЛЬКО КООПЕРАТИВЫ · ОБОРОТ "+(G.soldTotal|0).toLocaleString("ru")+" ИЗ "+COOP_EXAM.toLocaleString("ru")+" · ЗАПИСЬ — НА РЫНКЕ СТАНЦИИ ДОМА"));
    $body.appendChild(el("div","sec","ВАШ ЭКИПАЖ "+G.crew.length+" / "+crewCap()+
      " · РАЗРЯД КООПЕРАТИВА, ЛИЦЕНЗИЯ И УПРАВЛЯЮЩИЙ ДАЮТ МЕСТА · ЗАРПЛАТА ИДЁТ ПОКА ОНИ РАБОТАЮТ"+
      (spare>0?"":" · СВОБОДНЫХ КОРПУСОВ НЕТ: НАЁМНИКУ НУЖЕН СВОЙ КОРАБЛЬ")));
    if(!G.crew.length)$body.appendChild(el("div","sec","ПОКА НИКОГО — НАЙМИТЕ НИЖЕ"));
    G.crew.forEach((c,i)=>{
      const S=c.shipId?shipData(c.shipId):null;
      const hold=crewHold(c),cap=crewCargoMax(c);
      const r=el("div","row");
      const st8=c.state==="hostage"
        ? "<br><b style='color:#ff6b57'>В ПЛЕНУ · выкуп "+(c.ransom||0).toLocaleString("ru")+
          " кр — платить или штурмовать базу в секторе "+c.ransomSx+","+c.ransomSy+"</b>"
        : (c.state==="away"?"<br><b style='color:#f2b25c'>В ЗАГУЛЕ</b>":"");
      /* карточка человека (M301, DESIGN-screens §3): словами — кто, что делает,
         на чём и в каком духе; цифры блоком ниже. Главный вопрос — окупается ли —
         остаётся на виду первой строкой цифр */
      const net=(c.earned||0)-(c.spent||0);
      const mood=c.morale>=.7?"в духе":(c.morale>=.4?"ровно":"мрачен");
      /* <b> внутри .nm — блок; внутри строки цифр цвет даёт span, иначе строка ломается */
      r.appendChild(el("div","nm","<b>"+c.name+"</b><s>"+CREW_SPEC[c.spec].ru+" · "+ORDERS[c.order.kind].ru+" · сектор "+c.order.sx+","+c.order.sy+
        " · "+(S?"на «"+S.ru+"»":"корабль не выдан")+" · "+mood+st8+
        "<br>"+c.traits.map(t=>traitOf(t).ru).join(" · ")+"</s>"+
        "<s class='fig'>итог <span style='color:"+(net>=0?"#8fd08a":"#ff6b57")+"'>"+net.toLocaleString("ru")+" кр</span>"+
        " · заработал "+(c.earned||0).toLocaleString("ru")+" · съел "+(c.spent||0).toLocaleString("ru")+
        (c.debt>0?" · <span style='color:#ff6b57'>долг "+Math.round(c.debt)+"</span>":"")+
        "<br>жалованье "+crewPay(c)+" кр/мин · опыт "+Math.round(c.xp)+" · рейсов "+(c.trips||0)+
        (S?"<br>корпус "+Math.round(c.hull)+"/"+Math.round(c.hullMax)+(cap?" · трюм "+hold+"/"+cap:""):"")+"</s>"));
      const box=el("div","qt","");
      r.appendChild(box);
      /* ремонт: сам идёт медленно и бесплатно на приколе, за деньги — сразу */
      if(c.shipId&&c.hull<c.hullMax){
        const bRep=el("button","act gold",crewRepairCost(c).toLocaleString("ru")+" кр");
        bRep.disabled=G.credits<crewRepairCost(c);
        bRep.onclick=()=>{if(crewRepair(c))renderTab();};
        r.appendChild(bRep);
      }
      const bFire=el("button","act","РАСЧЁТ "+crewSeverance(c).toLocaleString("ru"));
      bFire.title="выходное пособие — чтобы перебор наёмников не был бесплатным";
      bFire.onclick=()=>{fireMerc(i);renderTab();};
      r.appendChild(bFire);
      $body.appendChild(r);
      /* выдача корабля: только свободные корпуса из ангара, свой текущий не отдаём */
      if(!c.shipId){
        const free=Object.keys(G.owned).filter(id=>id!==G.shipId&&!G.crew.some(o=>o.shipId===id));
        const rr=el("div","row");
        rr.appendChild(el("div","nm","<b>Выдать корабль</b><s>"+
          (free.length?"свободны: "+free.map(id=>{const d=shipData(id);return d?d.ru:id;}).join(", ")
                      :"свободных корпусов нет — купите или пересядьте")+"</s>"));
        for(const id of free.slice(0,3)){
          const d=shipData(id);
          const b=el("button","act gold",(d?d.ru:id).toUpperCase());
          b.onclick=()=>{crewAssignShip(c,id);renderTab();};
          rr.appendChild(b);
        }
        $body.appendChild(rr);
      }else{
        const ro=el("div","row");
        ro.appendChild(el("div","nm","<b>Приказ</b><s>"+ORDERS[c.order.kind].note+
          "<br>район назначается по системе, где вы сейчас: "+G.sx+","+G.sy+"</s>"));
        for(const k in ORDERS){
          if(ORDERS[k].spec&&ORDERS[k].spec!==c.spec)continue;
          if(k==="base")continue;               // на базу отправляют отдельной строкой ниже
          const b=el("button","act"+(c.order.kind===k?"":" gold"),ORDERS[k].ru.toUpperCase());
          b.disabled=c.order.kind===k&&c.order.sx===G.sx&&c.order.sy===G.sy;
          b.onclick=()=>{crewOrder(c,k);renderTab();};
          ro.appendChild(b);
        }
        $body.appendChild(ro);
        if(typeof bargeCrewRow==="function")bargeCrewRow(c);   /* погрузить/выгрузить баржу (M294) */
      }
      /* на базу берут и без корабля: там живут, а не летают */
      const localBase=baseList().find(B=>B.sx===G.sx&&B.sy===G.sy);
      if(localBase&&baseSlots(localBase)>0){
        const rb=el("div","row");
        rb.appendChild(el("div","nm","<b>На базу «"+localBase.name+"»</b><s>мест "+
          baseStaff(localBase).length+"/"+baseSlots(localBase)+
          " · по своей специальности человек работает вдвое лучше</s>"));
        for(const role of ROLE_KEYS){
          const R=BASE_ROLES[role];
          const b=el("button","act"+(c.order.kind==="base"&&c.role===role?"":" gold"),R.ru.toUpperCase());
          b.title=R.note;
          b.disabled=c.order.kind==="base"&&c.role===role;
          b.onclick=()=>{assignToBase(c,localBase,role);renderTab();};
          rb.appendChild(b);
        }
        $body.appendChild(rb);
      }
    });
    /* ── честно ДО найма, а не после ──
       Наёмник работает только на своём корпусе. Свободных корпусов может не
       быть вовсе — и тогда найм покупает человека, который не сможет сделать
       ничего: он сядет в список, а игра об этом промолчит. Автор так и
       написал: «наёмники никуда не летали, непонятно» (30.08.2026). Кнопку не
       гасим — второй корпус можно купить и завтра, — но цену выбора называем
       здесь, а не на карточке, куда ещё надо догадаться зайти. */
    const freeHulls=Object.keys(G.owned).filter(id=>id!==G.shipId&&
      !G.crew.some(c=>c.shipId===id)).length;
    $body.appendChild(el("div","sec","ИЩУТ РАБОТУ ЗДЕСЬ · СОСТАВ МЕНЯЕТСЯ СО ВРЕМЕНЕМ"+
      (freeHulls?(" · СВОБОДНЫХ КОРПУСОВ "+freeHulls):" · СВОБОДНЫХ КОРПУСОВ НЕТ")));
    if(!freeHulls)
      $body.appendChild(el("div","row","<div class='nm'><s>наёмник летает на своём "+
        "корабле, а все ваши заняты. Нанять можно и сейчас, но до второго корпуса "+
        "с верфи он будет сидеть на станции: ни рейсов, ни жалованья, ни денег.</s></div>"));
    for(const m of stationMercs(G.sys)){
      if(G.crew.some(c=>c.id===m.id))continue;
      const r=el("div","row");
      r.appendChild(el("div","nm","<b>"+m.name+"</b> <span style='color:var(--dim)'>"+
        CREW_SPEC[m.spec].ru+"</span>"+(m.pax?" <span style='color:var(--phos)'>· спасён с баржи</span>":"")+"<s>"+
        (m.pax&&m.story?"<i style='color:var(--phos)'>"+m.story+"</i><br>":"")+
        CREW_SPEC[m.spec].note+
        "<br>"+m.traits.map(t=>traitOf(t).ru+" — "+traitOf(t).note).join("<br>")+
        "<br>жалованье "+crewPay(m)+" кр/мин · опыт "+m.xp+
        /* цена расставания называется ДО найма: «РАСЧЁТ 298» при найме за 176
           читался ловушкой, когда открывался уже на карточке (плейтест 30.08.2026) */
        " · расчёт при увольнении "+crewSeverance(m).toLocaleString("ru")+" кр</s>"));
      r.appendChild(el("div","qt",m.fee.toLocaleString("ru")+"<s>кр найм</s>"));
      const b=el("button","act gold","НАНЯТЬ");
      b.disabled=G.credits<m.fee||G.crew.length>=crewCap();
      b.onclick=()=>{if(hireMerc(m))renderTab();};
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
