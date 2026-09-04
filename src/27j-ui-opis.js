/* ══════════════ ОПИСЬ: один стол для всего, что на тебе и в трюме (M341) ══════════════
   Автор нарисовал стол: тёмное дерево, зелёное сукно, четыре пронумерованные
   зоны, полка инструментов сверху, шкатулка справа, круглый люк в углу. Правило
   одно: всё, что НАДЕТО, ПОСТАВЛЕНО или ТРАТИТСЯ, лежит на сукне; всё, что
   ЧИТАЮТ, — на столе (27i). До M341 это было размазано по трём местам: экран
   КОРАБЛЬ (части), его вкладка СКАФАНДР (кукла), накладная на столе (кучи).

   Зоны: 1 ТРЮМ — кучи (27j-ui-hold), под каждой память о лучшей виденной цене;
   2 КОМПЛЕКТ — кукла, раскладка, шесть мест и запас с полки; 3 ЧАСТИ И ВЕЩИ —
   силуэт корпуса с якорями, слоты слева, снятые справа; 4 ЛЮК — за борт.

   ПРИБОРЫ: под силуэтом и под куклой стоят панели с настоящими числами stat() и
   kitStat(). Наведи или выбери вещь — панель показывает БУДУЩЕЕ: у стоящей части
   «если снять», у запасной — разницу против той, что стоит, у запасной вещи
   комплекта — то же. Карточки сравнений не носят: сравнение живёт в панели.

   Две раскладки. Широкий экран: сетка с сукном, перетаскивание — главный жест,
   кнопки остаются. Телефон (≤760): одна лента — полка и шкатулка одной полосой,
   зона 3, зона 2, зона 1; люк не в ленте, а полосой снизу, пока что-то поднято.
   Главный жест — тап: выбрал → панель показала будущее → под вещью выехали
   кнопки; долгое нажатие поднимает для переноса.

   ПРАВИЛА ФАЙЛА:
   1. Читает G.cargo, G.inv, G.fit, G.kit, G.kitShelf, G.seenPrices; меняет их
      только готовыми ручками (fitPart/unfitPart/scrapPart/kitWearPiece). В сейве
      своего нет: выбор, подхват и «ТОЧНО?» живут в OPIS и умирают с закрытием.
   2. Всё, что тыкают пальцем, — кнопка не меньше 44 px; перетаскивание — вторая
      дорога, не единственная (фаззер и телефон без него обходятся).
   3. Людей за борт не выбрасывают: у кучи пассажиров нет ни люка, ни кнопки.
   4. Часть выше добротной разбирается через «ТОЧНО?» — кнопка меняет слово на
      три секунды, никаких confirm(). */
const OPIS={box:null,sel:null,hover:null,arm:null,drag:null,ask:null,hit:[],panels:{}};
/* восемь строк автора плюс корпус, бур и урон: часть с одним аффиксом к корпусу
   иначе не сдвинула бы на панели ни одного числа, и «будущее» врало бы молчанием */
const OPIS_SHIP=[
  {k:"thr",      ru:"тяга",       fix:2},
  {k:"turn",     ru:"поворот",    fix:2},
  {k:"hullMax",  ru:"корпус",     fix:0},
  {k:"shieldMax",ru:"щит",        fix:0},
  {k:"fuelMax",  ru:"бак",        fix:0},
  {k:"cargoMax", ru:"трюм",       fix:0},
  {k:"drill",    ru:"бур",        fix:2},
  {k:"see",      ru:"радар",      fix:0},
  {k:"jump",     ru:"прыжок",     fix:1},
  {k:"dmg",      ru:"урон",       fix:1},
  {k:"cool",     ru:"охлаждение", fix:0, less:1}
];
const OPIS_KIT=[
  {k:"weight",ru:"вес",      fix:1, less:1},
  {k:"walk",  ru:"ход",      fix:2},
  {k:"armor", ru:"броня",    fix:2},
  {k:"lamp",  ru:"фонарь",   fix:2},
  {k:"scan",  ru:"обзор",    fix:2},
  {k:"charge",ru:"кислород", fix:0}
];
const OPIS_HW=420,OPIS_HH=190;   /* логический размер канвы силуэта */
function opisPhone(){return innerWidth<=760;}
function opisRerender(){if(OPIS.box)opisRender(OPIS.box);}
function opisSame(a,b){return !!a&&!!b&&a.t===b.t&&a.id===b.id&&a.i===b.i&&a.k===b.k;}
function opisFocus(){return OPIS.hover||OPIS.sel;}
/* куда встанет запасная часть: выбранный слот, если он её рода, иначе первый
   свободный своего рода, иначе первый своего рода (замена) */
function opisTarget(p){
  const slots=slotsOf(G.shipId),fm=G.fit[G.shipId]||{},s=OPIS.sel;
  if(s&&s.t==="slot"&&slots[s.i]===p.kind)return s.i;
  for(let i=0;i<slots.length;i++)if(slots[i]===p.kind&&fm[i]==null)return i;
  for(let i=0;i<slots.length;i++)if(slots[i]===p.kind)return i;
  return -1;
}
function opisSlotOf(id){
  const fm=G.fit[G.shipId]||{};
  for(const k in fm)if(fm[k]===id)return +k;
  return -1;
}
/* ── будущее приборов: что покажут, если сделать то, на что смотрят ── */
function opisShipFuture(f){
  if(!f)return null;
  const fm=G.fit[G.shipId]||{};
  if(f.t==="slot"){
    if(fm[f.i]==null)return null;
    return {st:statPreview(f.i,null),why:"если снять",slot:f.i};
  }
  if(f.t==="part"){
    const p=partById(f.id);if(!p||isFitted(p.id))return null;
    const t=opisTarget(p);
    if(t<0)return {st:null,why:"на «"+stat().S.ru+"» нет слота под такую часть",slot:-1};
    const need=capUsed()-(fm[t]!=null?partById(fm[t]).cap:0)+p.cap,cap=capOf(G.shipId);
    return {st:statPreview(t,p.id),
            why:fm[t]!=null?"вместо «"+partById(fm[t]).name+"»":"в свободный слот "+(t+1),
            slot:t,cap:need>cap?need-cap:0};
  }
  return null;
}
function opisKitFuture(f){
  if(!f||f.t!=="kit")return null;
  const x=kitShelf()[f.i];if(!x)return null;
  const K=kitAll(),old=K[x.p];
  K[x.p]=x;let st=null;
  try{st=kitStat();}finally{K[x.p]=old;}
  return {st,why:"если надеть вместо «"+kitName(old)+"»",place:x.p};
}
function opisPanel(id,title,rows,cur,fut,extra){
  const box=document.createElement("div");box.className="op-panel";box.dataset.p=id;
  let h="<h4>"+title+(extra?"<s>"+extra+"</s>":"")+"</h4>";
  for(const d of rows){
    const x=+cur[d.k]||0;let cell="";
    if(fut&&fut.st){
      const y=+fut.st[d.k]||0;
      if(Math.abs(x-y)>=(d.fix?Math.pow(10,-d.fix)*.5:.5)){
        const better=d.less?y<x:y>x;
        cell="<u class='"+(better?"up":"dn")+"'>→ "+y.toFixed(d.fix)+"</u>";
      }
    }
    h+="<div class='ln'><em>"+d.ru+"</em><b>"+x.toFixed(d.fix)+"</b>"+cell+"</div>";
  }
  if(fut&&fut.why)h+="<div class='why"+(fut.cap?" dn":"")+"'>"+fut.why+
    (fut.cap?" · оснастка: не хватает "+fut.cap:"")+"</div>";
  box.innerHTML=h;
  return box;
}
/* панели перерисовываются отдельно от стола: наведение не должно перестраивать
   сотню карточек ради двух чисел */
function opisPanels(){
  const f=opisFocus();
  const oldS=OPIS.panels.ship,oldK=OPIS.panels.kit;
  if(oldS&&oldS.isConnected){
    const cap=capUsed(),capM=capOf(G.shipId);
    const n=opisPanel("ship","ПРИБОРЫ",OPIS_SHIP,stat(),opisShipFuture(f),
      "оснастка "+cap+"/"+capM);
    oldS.replaceWith(n);OPIS.panels.ship=n;
  }
  if(oldK&&oldK.isConnected){
    const n=opisPanel("kit","КОМПЛЕКТ",OPIS_KIT,kitStat(),opisKitFuture(f),null);
    oldK.replaceWith(n);OPIS.panels.kit=n;
  }
  /* слот-мишень подсвечивается на силуэте и на фишке */
  opisHullRedraw();
  const fut=opisShipFuture(f);
  document.querySelectorAll(".opis .op-slot").forEach(e=>{
    e.classList.toggle("aim",!!fut&&fut.slot===+e.dataset.slot&&(!f||f.t!=="slot"));
  });
}
/* ── действия: те же ручки, что и у прежнего экрана ── */
function opisArmed(key){return !!(OPIS.arm&&OPIS.arm.key===key&&Date.now()-OPIS.arm.t<3000);}
function opisConfirm(key,run){
  if(opisArmed(key)){OPIS.arm=null;run();return;}
  OPIS.arm={key,t:Date.now()};opisRerender();
  setTimeout(()=>{if(OPIS.arm&&OPIS.arm.key===key){OPIS.arm=null;opisRerender();}},3100);
}
function opisFit(p,slot){
  const t=slot!==undefined&&slot>=0?slot:opisTarget(p);
  if(t<0){say("На этом корпусе нет такого слота");return false;}
  if(slotsOf(G.shipId)[t]!==p.kind){say("Не тот слот: там "+PART_KINDS[slotsOf(G.shipId)[t]].ru.toLowerCase());return false;}
  if(!fitPart(t,p.id)){say("Не встаёт: нет места в оснастке");return false;}
  OPIS.sel=null;OPIS.hover=null;opisRerender();
  return true;
}
function opisUnfit(i){unfitPart(i);OPIS.sel=null;OPIS.hover=null;opisRerender();}
function opisScrap(p){
  const go=()=>{
    if(isFitted(p.id)){const i=opisSlotOf(p.id);if(i>=0)unfitPart(i);}
    const res=scrapPart(p.id);if(!res)return;
    const list=Object.keys(res.got).map(k=>RES[k].ru.toLowerCase()+" ×"+res.got[k]).join(", ");
    const mn=(typeof matchesScrapNote==="function")?matchesScrapNote(res.matches):"";
    tell("money","Разобрано: "+res.part.name+(list?" → "+list:" → трюм полон")+(mn?" · "+mn:""),
         res.part.name+"\nразобрано"+(list?"\n"+list:"\nтрюм полон")+(mn?"\n"+mn:""));
    OPIS.sel=null;OPIS.hover=null;opisRerender();
  };
  if((p.tier|0)>=3)opisConfirm("scrap:"+p.id,go);else go();
}
function opisCanDump(k){return !!RES[k]&&!RES[k].pax&&k!=="folk";}
function opisAsk(k){
  if(!opisCanDump(k)){say("Людей за борт не выбрасывают");return;}
  OPIS.ask={k};opisRerender();
}
function opisDump(k,n){
  if(!opisCanDump(k))return false;
  n=Math.max(0,Math.min(G.cargo[k]|0,n|0));
  OPIS.ask=null;
  if(!n){opisRerender();return false;}
  G.cargo[k]-=n;
  tell("money","За борт: "+RES[k].ru.toLowerCase()+" ×"+n,RES[k].ru+"\nза борт ×"+n);
  OPIS.sel=null;OPIS.hover=null;opisRerender();
  return true;
}
function opisWear(i){
  if(!kitWearPiece(i))return false;
  OPIS.sel=null;OPIS.hover=null;opisRerender();
  return true;
}
/* ── перетаскивание: указатель, без HTML5-DnD (на телефоне его нет) ──
   Мышь поднимает вещь после 6 px хода; палец — долгим нажатием на ВЫБРАННОЙ
   вещи (иначе долгое нажатие спорит с прокруткой ленты). Призрак идёт за
   указателем и не ловит событий, так что elementFromPoint видит сквозь него. */
function opisDragWire(card,payload){
  card.addEventListener("contextmenu",e=>{if(OPIS.drag)e.preventDefault();});
  card.addEventListener("pointerdown",e=>{
    if(e.button)return;
    if(e.target.closest("button,input"))return;
    const touch=e.pointerType==="touch";
    if(touch&&!card.classList.contains("on"))return;      /* сперва выбрать тапом */
    const sx=e.clientX,sy=e.clientY,pid=e.pointerId;
    let lifted=false,timer=0;
    const cleanup=()=>{clearTimeout(timer);
      card.removeEventListener("pointermove",mv);card.removeEventListener("pointerup",up);
      card.removeEventListener("pointercancel",up);};
    const lift=()=>{if(lifted)return;lifted=true;cleanup();opisLift(card,payload,pid,sx,sy);};
    const mv=ev=>{if(lifted)return;
      const d=Math.hypot(ev.clientX-sx,ev.clientY-sy);
      if(touch){if(d>14)cleanup();}else if(d>6)lift();};
    const up=()=>cleanup();
    card.addEventListener("pointermove",mv);card.addEventListener("pointerup",up);
    card.addEventListener("pointercancel",up);
    if(touch)timer=setTimeout(lift,380);
  });
}
function opisLift(card,payload,pid,x,y){
  if(OPIS.drag)opisDropEnd();
  const g=card.cloneNode(true);
  g.className=card.className.replace(" on","")+" op-ghost";
  const rc=card.getBoundingClientRect();
  g.style.width=Math.round(rc.width)+"px";
  document.body.appendChild(g);
  OPIS.drag={payload,ghost:g,card,pid,dx:x-rc.left,dy:y-rc.top};
  card.classList.add("lifted");document.body.classList.add("op-lift");
  try{card.setPointerCapture(pid);}catch(e){}
  opisMarkCan(payload);
  opisGhostMove(x,y);
  if(navigator.vibrate)try{navigator.vibrate(12);}catch(e){}
  const mv=ev=>{opisGhostMove(ev.clientX,ev.clientY);opisMarkOver(ev.clientX,ev.clientY);};
  const up=ev=>{
    card.removeEventListener("pointermove",mv);card.removeEventListener("pointerup",up);
    card.removeEventListener("pointercancel",cancel);
    const tgt=opisDropAt(ev.clientX,ev.clientY);
    opisDropEnd();
    if(tgt)opisDrop(tgt,payload);
  };
  const cancel=()=>{card.removeEventListener("pointermove",mv);card.removeEventListener("pointerup",up);
    card.removeEventListener("pointercancel",cancel);opisDropEnd();};
  card.addEventListener("pointermove",mv);card.addEventListener("pointerup",up);
  card.addEventListener("pointercancel",cancel);
}
function opisGhostMove(x,y){
  const d=OPIS.drag;if(!d)return;
  d.ghost.style.transform="translate("+Math.round(x-d.dx)+"px,"+Math.round(y-d.dy)+"px) rotate(-2deg)";
}
/* что вообще примет эту вещь — подсвечивается на весь перенос */
function opisMarkCan(pl){
  const root=OPIS.box;if(!root)return;
  const p=(pl.t==="part"||pl.t==="slot")?partById(pl.id):null;
  root.querySelectorAll("[data-drop]").forEach(e=>{
    const k=e.dataset.drop;let can=false;
    if(k==="hatch")can=pl.t!=="kit"&&(pl.t!=="pile"||opisCanDump(pl.k));
    else if(k==="slot")can=!!p&&slotsOf(G.shipId)[+e.dataset.slot]===p.kind;
    else if(k==="hull")can=!!p||(pl.t==="cosm"&&cosmSlotOf(pl.id)!=="suit"&&cosmSlotOf(pl.id)!=="visor");
    else if(k==="spare")can=pl.t==="slot";
    else if(k==="kit")can=pl.t==="kit"||(pl.t==="cosm"&&(cosmSlotOf(pl.id)==="suit"||cosmSlotOf(pl.id)==="visor"));
    e.classList.toggle("can",can);
  });
  const bar=document.getElementById("opisBar");
  if(bar)bar.classList.toggle("can",pl.t!=="kit"&&(pl.t!=="pile"||opisCanDump(pl.k)));
}
function opisMarkOver(x,y){
  const tgt=opisDropAt(x,y);
  document.querySelectorAll("[data-drop].over").forEach(e=>{if(!tgt||e!==tgt.el)e.classList.remove("over");});
  if(tgt)tgt.el.classList.add("over");
}
function opisDropAt(x,y){
  const g=OPIS.drag&&OPIS.drag.ghost;
  const e=document.elementFromPoint(x,y);if(!e)return null;
  const d=e.closest("[data-drop]");if(!d||d===g)return null;
  return {kind:d.dataset.drop,el:d,x,y};
}
function opisDropEnd(){
  const d=OPIS.drag;if(!d)return;
  if(d.ghost&&d.ghost.parentNode)d.ghost.parentNode.removeChild(d.ghost);
  d.card.classList.remove("lifted");
  try{d.card.releasePointerCapture(d.pid);}catch(e){}
  document.body.classList.remove("op-lift");
  document.querySelectorAll("[data-drop].can,[data-drop].over").forEach(e=>{e.classList.remove("can");e.classList.remove("over");});
  OPIS.drag=null;
}
function opisDrop(tgt,pl){
  if(tgt.kind==="hatch"){
    if(pl.t==="part"||pl.t==="slot"){const p=partById(pl.id);if(p)opisScrap(p);}
    else if(pl.t==="pile")opisAsk(pl.k);
    return;
  }
  if(pl.t==="part"){
    const p=partById(pl.id);if(!p)return;
    if(tgt.kind==="slot")opisFit(p,+tgt.el.dataset.slot);
    else if(tgt.kind==="hull"){
      const i=opisHullSlotAt(tgt.el,tgt.x,tgt.y,p.kind);
      opisFit(p,i>=0?i:opisTarget(p));
    }
    return;
  }
  if(pl.t==="slot"){
    if(tgt.kind==="spare")opisUnfit(pl.i);
    else if(tgt.kind==="slot"){
      const j=+tgt.el.dataset.slot,fm=G.fit[G.shipId]||{},id=fm[pl.i];
      if(j!==pl.i&&id!=null&&fm[j]==null&&slotsOf(G.shipId)[j]===partById(id).kind){
        unfitPart(pl.i);fitPart(j,id);OPIS.sel=null;opisRerender();
      }
    }
    return;
  }
  if(pl.t==="kit"&&tgt.kind==="kit")opisWear(pl.i);
  if(pl.t==="cosm"){
    const slot=cosmSlotOf(pl.id);
    const hullish=slot&&slot!=="suit"&&slot!=="visor";
    if((hullish&&(tgt.kind==="hull"||tgt.kind==="slot"))||(!hullish&&tgt.kind==="kit")){cosmWear(pl.id);OPIS.sel=null;opisRerender();}
    else say(hullish?"Это на корпус":"Это на скафандр");
  }
}
/* ── силуэт корпуса: якоря слотов — мишени и для тапа, и для переноса ── */
function opisHullRedraw(){
  const cv=OPIS.box&&OPIS.box.querySelector("canvas.op-hull");if(!cv)return;
  const f=opisFocus(),fut=opisShipFuture(f);
  let sel=-1;
  if(OPIS.sel&&OPIS.sel.t==="slot")sel=OPIS.sel.i;
  else if(fut&&fut.slot>=0)sel=fut.slot;
  const dpr=Math.min(2,window.devicePixelRatio||1)*(typeof UIK==="number"?UIK:1);
  /* логический размер — по КЛЕТКЕ сетки, а не константой: канва растянута на
     ячейку, и рисунок другого отношения сторон вышел бы сплющенным (первый снимок
     M341: корпус читался повёрнутым). Без вёрстки (тесты, фаззер) — запас */
  const bw=cv.clientWidth|0,bh=cv.clientHeight|0;
  const cw=bw>40?bw:OPIS_HW,ch=bh>40?bh:OPIS_HH;
  OPIS.hullW=cw;OPIS.hullH=ch;
  cv.width=Math.round(cw*dpr);cv.height=Math.round(ch*dpr);
  const c=cv.getContext("2d");c.setTransform(dpr,0,0,dpr,0,0);
  OPIS.hit=hullSilhouette(c,cw,ch,G.shipId,sel,G.fit[G.shipId]||{});
}
function opisHullSlotAt(cv,x,y,kind){
  const rc=cv.getBoundingClientRect();if(!rc.width)return -1;
  const mx=(x-rc.left)*((OPIS.hullW||OPIS_HW)/rc.width),my=(y-rc.top)*((OPIS.hullH||OPIS_HH)/rc.height);
  const slots=slotsOf(G.shipId);
  let best=-1,bd=30;
  for(const h of OPIS.hit){
    if(kind&&slots[h.i]!==kind)continue;
    const d=Math.hypot(h.x-mx,h.y-my);
    if(d<bd){bd=d;best=h.i;}
  }
  return best;
}
/* ── рисунки сукна: коробок, шкатулка, люк ── */
function opisDrawMatchbox(c,w,h,n){
  c.clearRect(0,0,w,h);
  c.save();c.translate(w*.5,h*.55);
  c.fillStyle="rgba(0,0,0,.28)";c.beginPath();c.ellipse(0,h*.22,w*.36,h*.1,0,0,TAU);c.fill();
  /* коробок: картон, чиркало сбоку, этикетка старой фабрики */
  c.fillStyle="#a5843f";c.fillRect(-w*.3,-h*.22,w*.6,h*.36);
  c.fillStyle="#6e5427";c.fillRect(-w*.3,h*.06,w*.6,h*.08);
  c.fillStyle="#3e2b16";c.fillRect(-w*.3,-h*.22,w*.05,h*.36);
  c.fillStyle="#e2d2a8";c.fillRect(-w*.2,-h*.16,w*.44,h*.22);
  c.strokeStyle="#7a2a20";c.lineWidth=1;c.strokeRect(-w*.18,-h*.14,w*.4,h*.18);
  c.fillStyle="#7a2a20";c.fillRect(-w*.12,-h*.08,w*.28,h*.03);c.fillRect(-w*.12,-h*.02,w*.2,h*.03);
  /* спички рядом — сколько есть, до шести; нуль — только коробок */
  const m=Math.min(6,n|0);
  for(let i=0;i<m;i++){
    const a=-.35+i*.14,x0=w*.34+i*w*.02,y0=h*.2-i*h*.05;
    c.save();c.translate(x0,y0);c.rotate(a);
    c.fillStyle="#d9c79a";c.fillRect(-w*.16,-1,w*.32,2);
    c.fillStyle="#7a2a20";c.beginPath();c.ellipse(w*.16,0,2.6,2,0,0,TAU);c.fill();
    c.restore();
  }
  c.restore();
}
function opisDrawBox(c,w,h,open){
  c.clearRect(0,0,w,h);
  c.save();c.translate(w*.5,h*.56);
  if(open){
    /* крышка откинута: видна изнанка с шёлком и то, что внутри блестит */
    c.fillStyle="rgba(0,0,0,.3)";c.beginPath();c.ellipse(0,h*.24,w*.4,h*.1,0,0,TAU);c.fill();
    c.fillStyle="#2a1a1c";c.fillRect(-w*.33,-h*.1,w*.66,h*.34);
    c.fillStyle="#6b2a3a";c.fillRect(-w*.31,-h*.08,w*.62,h*.14);
    c.fillStyle="#3b2427";c.beginPath();c.moveTo(-w*.36,-h*.1);c.lineTo(-w*.30,-h*.5);c.lineTo(w*.30,-h*.5);c.lineTo(w*.36,-h*.1);c.closePath();c.fill();
    c.fillStyle="#7a3242";c.beginPath();c.moveTo(-w*.32,-h*.12);c.lineTo(-w*.27,-h*.46);c.lineTo(w*.27,-h*.46);c.lineTo(w*.32,-h*.12);c.closePath();c.fill();
    for(let i=0;i<5;i++){c.fillStyle=["#c9a24a","#7fe6d8","#e0885a","#d6c6a0","#a52a2a"][i];c.beginPath();c.arc(-w*.22+i*w*.11,-h*.02,3,0,TAU);c.fill();}
    c.fillStyle="rgba(255,235,200,.35)";c.fillRect(-w*.2,-h*.06,w*.16,1.5);
    c.restore();return;
  }
  c.fillStyle="rgba(0,0,0,.3)";c.beginPath();c.ellipse(0,h*.24,w*.4,h*.1,0,0,TAU);c.fill();
  /* лакированная шкатулка: тёмный корпус, крышка чуть шире, латунная защёлка */
  c.fillStyle="#2a1a1c";c.fillRect(-w*.33,-h*.1,w*.66,h*.34);
  const g=c.createLinearGradient(-w*.33,0,w*.33,0);
  g.addColorStop(0,"rgba(255,220,200,.10)");g.addColorStop(.5,"rgba(255,220,200,.02)");g.addColorStop(1,"rgba(0,0,0,.25)");
  c.fillStyle=g;c.fillRect(-w*.33,-h*.1,w*.66,h*.34);
  c.fillStyle="#3b2427";c.fillRect(-w*.36,-h*.26,w*.72,h*.18);
  c.fillStyle="rgba(255,225,205,.14)";c.fillRect(-w*.36,-h*.26,w*.72,h*.03);
  c.fillStyle="#c9a24a";c.fillRect(-w*.05,-h*.1,w*.1,h*.08);
  c.fillStyle="#8a6a2a";c.fillRect(-w*.05,-h*.04,w*.1,h*.02);
  /* росчерк на крышке — намёк на роспись, которой пока нет */
  c.strokeStyle="rgba(201,162,74,.5)";c.lineWidth=1;
  c.beginPath();c.moveTo(-w*.22,-h*.17);c.quadraticCurveTo(0,-h*.28,w*.22,-h*.17);c.stroke();
  c.restore();
}
function opisDrawHatch(c,w,h,warm){
  c.clearRect(0,0,w,h);
  const r=Math.min(w,h)*.42,cx=w*.5,cy=h*.5;
  c.save();
  c.fillStyle="rgba(0,0,0,.35)";c.beginPath();c.ellipse(cx+3,cy+6,r*1.04,r*.98,0,0,TAU);c.fill();
  const g=c.createRadialGradient(cx-r*.3,cy-r*.3,r*.1,cx,cy,r);
  g.addColorStop(0,"#5c6168");g.addColorStop(1,"#22262b");
  c.fillStyle=g;c.beginPath();c.arc(cx,cy,r,0,TAU);c.fill();
  c.strokeStyle=warm?"#f2b25c":"rgba(255,255,255,.18)";c.lineWidth=warm?2.5:1.5;
  c.beginPath();c.arc(cx,cy,r-2,0,TAU);c.stroke();
  /* болты по ободу */
  for(let i=0;i<8;i++){const a=i*TAU/8+.2;
    c.fillStyle="#141618";c.beginPath();c.arc(cx+Math.cos(a)*r*.84,cy+Math.sin(a)*r*.84,r*.05,0,TAU);c.fill();}
  /* штурвал */
  c.strokeStyle="#9aa0a8";c.lineWidth=Math.max(2,r*.08);
  c.beginPath();c.arc(cx,cy,r*.42,0,TAU);c.stroke();
  for(let i=0;i<3;i++){const a=i*TAU/3-Math.PI/2;
    c.beginPath();c.moveTo(cx,cy);c.lineTo(cx+Math.cos(a)*r*.42,cy+Math.sin(a)*r*.42);c.stroke();}
  c.fillStyle="#2b2f34";c.beginPath();c.arc(cx,cy,r*.1,0,TAU);c.fill();
  /* тьма в щели: люк ведёт наружу */
  c.strokeStyle="rgba(0,0,0,.55)";c.lineWidth=3;
  c.beginPath();c.arc(cx,cy,r*.66,Math.PI*.15,Math.PI*.85);c.stroke();
  c.restore();
}
/* ── карточки ── */
function opisCard(cls,payload,html){
  const card=document.createElement("div");
  card.className="op-card "+cls+(opisSame(OPIS.sel,payload)?" on":"");
  card.innerHTML=html;
  card.addEventListener("click",e=>{
    if(e.target.closest("button,input"))return;
    OPIS.sel=opisSame(OPIS.sel,payload)?null:payload;
    opisRerender();
  });
  card.addEventListener("mouseenter",()=>{if(opisPhone())return;OPIS.hover=payload;opisPanels();});
  card.addEventListener("mouseleave",()=>{if(opisSame(OPIS.hover,payload)){OPIS.hover=null;opisPanels();}});
  opisDragWire(card,payload);
  return card;
}
function opisActs(card,list){
  const acts=document.createElement("div");acts.className="acts";
  for(const a of list){
    const b=document.createElement("button");
    b.className="act sm"+(a.gold?" gold":"");
    b.textContent=a.ru;b.disabled=!!a.off;
    b.onclick=e=>{e.stopPropagation();a.go();};
    acts.appendChild(b);
  }
  card.appendChild(acts);
}
function opisPartHtml(p){
  const K=PART_KINDS[p.kind];
  return "<b>"+p.name+"</b><s>"+K.ru.toLowerCase()+" · "+TIER_RU[p.tier]+
    " · место "+p.cap+"</s><i>"+p.aff.map(a=>"<span class='"+(a.v>0?"up":"dn")+"'>"+affLabel(a)+"</span>").join(" · ")+"</i>";
}
function opisPartCard(p,where){
  const fitted=where==="slot",slot=fitted?opisSlotOf(p.id):-1;
  const payload=fitted?{t:"slot",i:slot,id:p.id}:{t:"part",id:p.id};
  const card=opisCard("part",payload,opisPartHtml(p));
  card.dataset.id=p.id;
  card.style.borderTop="3px solid "+PART_KINDS[p.kind].col;   /* род части — полосой, а не цветом букв на бумаге */
  const f=OPIS.sel;
  if(!fitted&&f&&f.t==="slot"&&slotsOf(G.shipId)[f.i]===p.kind)card.classList.add("fit");
  const scrapKey="scrap:"+p.id;
  const acts=[];
  if(fitted)acts.push({ru:"СНЯТЬ",go:()=>opisUnfit(slot)});
  else{
    const t=opisTarget(p),fm=G.fit[G.shipId]||{};
    const fits=t>=0&&capUsed()-(fm[t]!=null?partById(fm[t]).cap:0)+p.cap<=capOf(G.shipId);
    acts.push({ru:t<0?"НЕТ СЛОТА":(fm[t]!=null?"ЗАМЕНИТЬ":"СТАВИТЬ"),gold:fits,off:t<0||!fits,go:()=>opisFit(p)});
  }
  acts.push({ru:opisArmed(scrapKey)?"ТОЧНО?":"РАЗОБРАТЬ",gold:opisArmed(scrapKey),go:()=>opisScrap(p)});
  opisActs(card,acts);
  return card;
}
/* память о цене под кучей: лучшее из ВИДЕННОГО, со слуха — с пометкой (12aa) */
function opisPriceCue(k){
  const b=(typeof priceBestOf==="function")?priceBestOf(k):null;
  if(!b)return null;
  const d=Math.hypot(b.s.sx-G.sx,b.s.sy-G.sy);
  const j=Math.max(1,Math.ceil(d/Math.max(.5,stat().jump)));
  const here=b.s.sx===G.sx&&b.s.sy===G.sy;
  return {val:b.val,s:b.s,heard:b.heard,
    ru:(b.heard?"со слуха: ":"виденное: ")+b.val+" кр · "+b.s.sx+":"+b.s.sy+
       (here?" · здесь":" · "+j+" "+pl3(j,"прыжок","прыжка","прыжков"))};
}
function holdWorth(){
  let sum=0,seen=0;
  for(const k of RES_KEYS){
    const n=G.cargo[k]|0;if(!n)continue;
    const b=(typeof priceBestOf==="function")?priceBestOf(k):null;
    if(b){sum+=n*b.val;seen++;}else if(RES[k].price)sum+=n*RES[k].price;
  }
  return {sum:Math.round(sum),seen};
}
function opisPileCard(k,n){
  const payload={t:"pile",k};
  const R0=RES[k];
  const card=opisCard("pile",payload,"<b>"+R0.ru+" × "+n+"</b><s>"+
    (R0.price?"рынок ~"+R0.price+" кр":(R0.rare||R0.ammo||R0.pax||""))+"</s>");
  card.dataset.k=k;
  const cv=document.createElement("canvas");cv.width=250;cv.height=120;
  holdDrawPile(cv.getContext("2d"),k,n,250,120);
  card.insertBefore(cv,card.firstChild);
  const cue=opisPriceCue(k);
  if(cue){
    const b=document.createElement("button");b.className="act sm cue";
    b.textContent=cue.ru;
    b.onclick=e=>{e.stopPropagation();if(typeof gotoSector==="function")gotoSector(cue.s.sx,cue.s.sy,R0.ru.toLowerCase()+" по "+cue.val);};
    card.appendChild(b);
  }
  if(opisCanDump(k))opisActs(card,[{ru:"ЗА БОРТ",go:()=>opisAsk(k)}]);
  return card;
}
function opisKitCard(x,i){
  const payload={t:"kit",i};
  const card=opisCard("kit",payload,"<b>"+KIT_RU[x.p]+" · «"+kitName(x)+"» "+kitRoman(x.cls)+"</b><s>"+
    KIT_WEAR[x.wear]+(x.mods&&x.mods.length?" · "+x.mods.map(id=>KIT_MODS[id].ru).join(", "):"")+
    (x.wear===3?" · заплат не берёт":"")+"</s>");
  x.seen=1;
  opisActs(card,[{ru:"НАДЕТЬ",gold:true,go:()=>opisWear(i)}]);
  return card;
}
function opisHead(n,ru,sub){
  const h=document.createElement("h3");
  h.innerHTML="<i>"+n+"</i>"+ru+(sub?"<s>"+sub+"</s>":"");
  return h;
}
/* форма «сколько за борт» — внутри люка на широком экране, в нижней полосе на телефоне */
function opisAskForm(){
  const a=OPIS.ask;if(!a||!RES[a.k])return null;
  const n=G.cargo[a.k]|0;
  const f=document.createElement("div");f.className="op-ask";
  f.innerHTML="<b>"+RES[a.k].ru+" · за борт</b>";
  const inp=document.createElement("input");inp.type="number";inp.min=1;inp.max=n;inp.value=n;
  inp.setAttribute("aria-label","сколько");
  const row=document.createElement("div");row.className="ln";
  row.appendChild(inp);
  const of=document.createElement("s");of.textContent="из "+n;row.appendChild(of);
  f.appendChild(row);
  const acts=document.createElement("div");acts.className="acts";
  const ok=document.createElement("button");ok.className="act sm gold";ok.textContent="ЗА БОРТ";
  ok.onclick=()=>opisDump(a.k,+inp.value);
  const no=document.createElement("button");no.className="act sm";no.textContent="ОСТАВИТЬ";
  no.onclick=()=>{OPIS.ask=null;opisRerender();};
  acts.appendChild(ok);acts.appendChild(no);f.appendChild(acts);
  return f;
}
/* полоса люка на телефоне: живёт в #tablewin, видна, пока что-то поднято или спрошено */
function opisBar(){
  let bar=document.getElementById("opisBar");
  const win=document.getElementById("tablewin");if(!win)return null;
  if(!bar){
    bar=document.createElement("div");bar.id="opisBar";bar.className="op-hatchbar";bar.dataset.drop="hatch";
    win.appendChild(bar);
  }
  bar.textContent="";
  const cv=document.createElement("canvas");cv.width=64;cv.height=64;
  opisDrawHatch(cv.getContext("2d"),64,64,false);
  bar.appendChild(cv);
  const t=document.createElement("s");t.textContent="отпустите здесь — за борт";bar.appendChild(t);
  const ask=opisAskForm();if(ask)bar.appendChild(ask);
  bar.classList.toggle("ask",!!OPIS.ask);
  return bar;
}
/* ── сам стол ── */
function opisRender(box){
  OPIS.box=box;
  box.textContent="";
  const st=stat(),fm=G.fit[G.shipId]||{},slots=slotsOf(G.shipId);
  const phone=opisPhone();
  if(OPIS.ask&&!(G.cargo[OPIS.ask.k]|0))OPIS.ask=null;
  /* ── полка и шкатулка: верх сукна; на телефоне — одна полоса ── */
  const top=document.createElement("div");top.className="op-top";
  const shelf=document.createElement("div");shelf.className="op-shelf";
  shelf.innerHTML="<h4>ИНСТРУМЕНТЫ «СОРОКИ»<s>шесть мест · работают только отсюда</s></h4>";
  const sl=document.createElement("div");sl.className="slots";
  const WS=(typeof wanderStore==="function")?wanderStore():{shelf:[],hold:[]};
  for(let i=0;i<6;i++){
    const id=WS.shelf[i],cat=id&&typeof WANDER_BY_ID!=="undefined"?WANDER_BY_ID[id]:null;
    if(!cat){const e=document.createElement("i");e.className="empty";sl.appendChild(e);continue;}
    const e=document.createElement("div");e.className="op-tool";
    e.innerHTML="<b>"+cat.ru+"</b><s>"+cat.fx+"</s>";
    const b=document.createElement("button");b.className="act sm";b.textContent="В ТРЮМ";
    b.onclick=ev=>{ev.stopPropagation();wanderToHold(id);opisRerender();};
    e.appendChild(b);sl.appendChild(e);
  }
  shelf.appendChild(sl);
  if(WS.hold.length){
    const hl=document.createElement("div");hl.className="op-toolhold";
    hl.innerHTML="<em>В ТРЮМЕ · не работают</em>";
    for(const id of WS.hold){
      const cat=WANDER_BY_ID[id];if(!cat)continue;
      const e=document.createElement("div");e.className="op-tool";
      e.innerHTML="<b>"+cat.ru+"</b><s>"+cat.fx+"</s>";
      const b=document.createElement("button");b.className="act sm"+(WS.shelf.length<WANDER_SHELF?" gold":"");b.textContent="НА ПОЛКУ";
      b.disabled=WS.shelf.length>=WANDER_SHELF;
      b.onclick=ev=>{ev.stopPropagation();wanderToShelf(id);opisRerender();};
      e.appendChild(b);hl.appendChild(e);
    }
    shelf.appendChild(hl);
  }
  if(!WS.shelf.length&&!WS.hold.length){
    const chalk=document.createElement("s");chalk.className="chalk";
    chalk.textContent="пока пусто. Говорят, есть борт, где платят спичками — у него и спрашивать";
    shelf.appendChild(chalk);
  }
  const bx=document.createElement("div");bx.className="op-box";
  const CO=(typeof cosmRec==="function")?cosmRec():{owned:[]};
  const bcv=document.createElement("canvas");bcv.width=160;bcv.height=96;
  opisDrawBox(bcv.getContext("2d"),160,96,CO.owned.length>0);
  bx.appendChild(bcv);
  if(!CO.owned.length)bx.insertAdjacentHTML("beforeend","<h4>КОСМЕТИКА · шкатулка</h4><s>заперта: откроется с первой покупкой</s>");
  else{
    bx.insertAdjacentHTML("beforeend","<h4>КОСМЕТИКА · шкатулка</h4><s>надетое — на корпус или на комплект: тычком или перетащить</s>");
    const list=document.createElement("div");list.className="op-cosm";
    for(const id of CO.owned){
      const slot=cosmSlotOf(id);if(!slot)continue;
      const on=cosmOn(slot)===id;
      const card=opisCard("cosm"+(on?" worn":""),{t:"cosm",id},"<b>"+cosmRu(id)+"</b><s>"+COSM_SLOT_RU[slot]+(on?" · надето":"")+"</s>");
      card.dataset.id=id;
      opisActs(card,[on?{ru:"СНЯТЬ",go:()=>{cosmTakeOff(slot);opisRerender();}}:{ru:"НАДЕТЬ",gold:true,go:()=>{cosmWear(id);opisRerender();}}]);
      list.appendChild(card);
    }
    bx.appendChild(list);
  }
  top.appendChild(shelf);top.appendChild(bx);
  box.appendChild(top);
  /* ── зона 1: трюм кучами, память о ценах, коробок ── */
  const z1=document.createElement("section");z1.className="op-z op-hold";
  const keys2=RES_KEYS.filter(k=>(G.cargo[k]|0)>0);
  z1.appendChild(opisHead(1,"ТРЮМ",held()+" / "+st.cargoMax+(keys2.length?"":" · пусто")));
  const piles=document.createElement("div");piles.className="op-piles";
  if(!keys2.length){
    const e=document.createElement("s");e.className="chalk";
    e.textContent="всё, что добудете и купите, ляжет сюда кучами";piles.appendChild(e);
  }
  for(const k of keys2)piles.appendChild(opisPileCard(k,G.cargo[k]|0));
  z1.appendChild(piles);
  if(keys2.length){
    const w=holdWorth();
    const line=document.createElement("div");line.className="op-worth";
    line.textContent="трюм стоит около "+w.sum.toLocaleString("ru")+" кр, если развезти"+
      (w.seen?" по лучшим виденным ценам":" · цен ещё не видели, счёт по рынку");
    z1.appendChild(line);
  }
  const mb=document.createElement("div");mb.className="op-matchbox";
  const mcv=document.createElement("canvas");mcv.width=140;mcv.height=70;
  const mN=(typeof matchesRec==="function")?matchesRec():0;
  opisDrawMatchbox(mcv.getContext("2d"),140,70,mN);
  mb.appendChild(mcv);
  mb.insertAdjacentHTML("beforeend","<b>спичек: "+mN+"</b><s>из-под кожухов разобранных частей</s>");
  z1.appendChild(mb);
  /* ── зона 3: силуэт, приборы, слоты, снятые ── */
  const z3=document.createElement("section");z3.className="op-z op-parts";
  const inv=G.inv.filter(p=>!isFitted(p.id)).sort((a,b)=>b.tier-a.tier);
  z3.appendChild(opisHead(3,"ЧАСТИ И ВЕЩИ","«"+st.S.ru+"» · оснастка "+capUsed()+"/"+capOf(G.shipId)+
    " · частей "+G.inv.length+"/"+PART_MAX));
  const pg=document.createElement("div");pg.className="op-parts-grid";
  const sc=document.createElement("div");sc.className="op-slots";
  slots.forEach((kind,i)=>{
    const K=PART_KINDS[kind];
    const chip=document.createElement("div");chip.className="op-slot"+(OPIS.sel&&OPIS.sel.t==="slot"&&OPIS.sel.i===i?" on":"");
    chip.dataset.drop="slot";chip.dataset.slot=i;
    chip.innerHTML="<em style='color:"+K.col+"'>"+K.sh+" · слот "+(i+1)+"</em>";
    if(fm[i]!=null)chip.appendChild(opisPartCard(partById(fm[i]),"slot"));
    else{
      const e=document.createElement("s");e.className="chalk";e.textContent="пусто";
      chip.appendChild(e);
      chip.addEventListener("click",ev=>{if(ev.target.closest("button"))return;
        OPIS.sel=(OPIS.sel&&OPIS.sel.t==="slot"&&OPIS.sel.i===i)?null:{t:"slot",i};opisRerender();});
    }
    sc.appendChild(chip);
  });
  const hcv=document.createElement("canvas");hcv.className="op-hull";hcv.dataset.drop="hull";
  hcv.addEventListener("click",e=>{
    const i=opisHullSlotAt(hcv,e.clientX,e.clientY,null);
    if(i<0)return;
    OPIS.sel=(OPIS.sel&&OPIS.sel.t==="slot"&&OPIS.sel.i===i)?null:{t:"slot",i};opisRerender();
  });
  const ps=opisPanel("ship","ПРИБОРЫ",OPIS_SHIP,st,opisShipFuture(opisFocus()),"оснастка "+capUsed()+"/"+capOf(G.shipId));
  OPIS.panels.ship=ps;
  const sp=document.createElement("div");sp.className="op-spare";sp.dataset.drop="spare";
  sp.innerHTML="<h4>СНЯТЫЕ ЧАСТИ<s>"+inv.length+"</s></h4>";
  if(!inv.length){const e=document.createElement("s");e.className="chalk";
    e.textContent="снятых нет: части роняют пираты и продают станции";sp.appendChild(e);}
  for(const p of inv)sp.appendChild(opisPartCard(p,"spare"));
  /* корпус — герой зоны: силуэт сверху во всю левую половину, приборы рядом,
     под ними слоты и снятые двумя колонками */
  pg.appendChild(hcv);pg.appendChild(ps);pg.appendChild(sc);pg.appendChild(sp);
  z3.appendChild(pg);
  /* ── зона 2: кукла, раскладка, шесть мест, приборы комплекта, запас ── */
  const z2=document.createElement("section");z2.className="op-z op-kit";z2.dataset.drop="kit";
  const K=kitAll();
  z2.appendChild(opisHead(2,"КОМПЛЕКТ СКАФАНДРА",kitLine()));
  const kg=document.createElement("div");kg.className="op-kit-grid";
  const lay=document.createElement("div");lay.className="op-kitlay";
  const dcv=document.createElement("canvas");dcv.className="doll";dcv.width=120;dcv.height=200;
  kitDollHit=[];drawKitFigure(dcv.getContext("2d"),120,200,kitDollHit,0);
  lay.appendChild(dcv);
  const lcv=document.createElement("canvas");lcv.className="lay";lcv.width=420;lcv.height=300;
  kitLayDraw(lcv.getContext("2d"),420,300);
  lay.appendChild(lcv);
  kg.appendChild(lay);
  const kc=document.createElement("div");kc.className="op-kitslots";
  for(const p of KIT_PLACES){
    const x=K[p];
    const chip=document.createElement("div");chip.className="op-kslot";
    chip.innerHTML="<em>"+KIT_RU[p]+"</em><b>«"+kitName(x)+"» "+kitRoman(x.cls)+"</b><s>"+KIT_WEAR[x.wear]+
      (x.mods&&x.mods.length?" · "+x.mods.map(id=>KIT_MODS[id].ru).join(", "):"")+"</s>";
    kc.appendChild(chip);
  }
  kg.appendChild(kc);
  const pk=opisPanel("kit","КОМПЛЕКТ",OPIS_KIT,kitStat(),opisKitFuture(opisFocus()),null);
  OPIS.panels.kit=pk;kg.appendChild(pk);
  z2.appendChild(kg);
  const trim=document.createElement("div");trim.className="op-trim";
  trim.innerHTML="<em>ОТДЕЛКА СКАФАНДРА</em><s class='chalk'>пока нечем: отделку носят из шкатулки</s>";
  z2.appendChild(trim);
  const shelfK=kitShelf();
  const ks=document.createElement("div");ks.className="op-spare-kit";
  ks.innerHTML="<h4>ЗАПАС<s>"+shelfK.length+"</s></h4>";
  if(!shelfK.length){const e=document.createElement("s");e.className="chalk";
    e.textContent="полка пуста: вещи выдаёт склад института, отдаёт хулк, чинит мастерская дома";ks.appendChild(e);}
  shelfK.forEach((x,i)=>ks.appendChild(opisKitCard(x,i)));
  z2.appendChild(ks);
  /* ── зона 4: люк ── */
  const z4=document.createElement("div");z4.className="op-hatch";z4.dataset.drop="hatch";
  const hcv4=document.createElement("canvas");hcv4.width=120;hcv4.height=120;
  opisDrawHatch(hcv4.getContext("2d"),120,120,false);
  z4.appendChild(hcv4);
  z4.insertAdjacentHTML("beforeend","<h4><i>4</i>ЛЮК ЗА БОРТ</h4><s>перетащи, чтобы выбросить</s>");
  if(!phone){const ask=opisAskForm();if(ask)z4.appendChild(ask);}
  /* порядок в разметке — порядок ленты на телефоне; на широком экране расставит сетка */
  box.appendChild(z3);box.appendChild(z2);box.appendChild(z1);box.appendChild(z4);
  const foot=document.createElement("div");foot.className="op-foot";
  foot.textContent=phone?"тап — выбрать · долгое нажатие — поднять · кнопки под вещью":
    "перетащи предмет на нужное место · перетащи на люк, чтобы выбросить · части выше добротной требуют подтверждения";
  box.appendChild(foot);
  opisHullRedraw();
  const bar=opisBar();
  if(bar)document.body.classList.toggle("op-ask",!!OPIS.ask&&phone);
}
/* закрытие стола забирает с собой всё временное: подхват, выбор, полосу люка */
function opisLeave(){
  opisDropEnd();
  OPIS.sel=null;OPIS.hover=null;OPIS.ask=null;OPIS.arm=null;OPIS.box=null;
  document.body.classList.remove("op-ask");
  const bar=document.getElementById("opisBar");if(bar)bar.classList.remove("ask");
}
