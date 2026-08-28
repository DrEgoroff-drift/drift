/* ══════════════ стол: одно место для всего, что читают ══════════════
   M151a. Раньше читать было негде: сообщение мелькало по центру, журнал
   складывал восемь видов записей в одну ленту, отчёт и трепло жили в своих
   окошках, а приёмник — во вкладке кантины. Стол — ответ на «где посмотреть»:
   один экран, открывается ПОВЕРХ ЛЮБОГО РЕЖИМА (полёт, карта, станция,
   поверхность, пещера, копь, пояс, рейд, база, баржа) и возвращает ровно туда,
   где игрок был. Режим он не меняет и ничего не останавливает.

   На столе лежат:
     тетрадь — ЭФИР · БОРТ · ЛЮДИ (11-log маршрутизирует по виду записи);
     ДЕЛА    — «что я должен» (11a), по строке — курс на карту;
     ЛЕНТЫ   — оторванные полосы самописца (11b/25b), вещь, а не число;
     ВЕЩИ    — то, что игроку досталось и что читают: письма, находки, бумаги
               (`G.things`, общая полка для M152e/M153/M158/M161);
     ОТЧЁТ   — доска «Долгого хода» (27h), пока есть хоть один кусок.

   ПРАВИЛА ФАЙЛА:
   1. Стол ничего не сочиняет: все строки приходят из G.log, G.strips,
      G.things, квестов и лора. Сам он хранит только «видел» (seenThings).
   2. Фон — нарисованная столешница, печётся раз на размер; поверх — обычные
      списки того же каркаса, что у всех экранов. */
let tableTab="ether",tableOpenNow=false,tableBaked=null;
function tableIsOpen(){return tableOpenNow;}
/* ── где мы, по-русски ──
   В шапке стола печаталось `G.mode` как есть, и игрок читал «Нейэль · system»:
   внутренний ключ режима, английским словом, в русской игре. Таблица держит
   все режимы разом — если появится новый и его сюда не впишут, шапка честно
   промолчит, а не выдаст ключ. */
const MODE_RU={system:"в системе",map:"навигация",landing:"посадка",surface:"на поверхности",
  cave:"в пещере",dig:"в шахте",belt:"в поясе",scoop:"в атмосфере",base:"на базе",
  homein:"дома",raid:"абордаж",dock:"на станции",road:"в дороге"};
function modeRu(){return MODE_RU[G.mode]||"";}
/* ── вещи: общая полка ──
   {k:вид, ru:имя, note:строка, t:время, seen:0/1, sx,sy:откуда}. Кладут
   вехи; стол показывает. Новое светится, пока стол не открыли на ВЕЩАХ. */
function thingsAll(){return (G.things||(G.things=[]));}
function thingAdd(k,ru,note,extra){
  const L=thingsAll();
  const th=Object.assign({k,ru,note:note||"",t:Date.now(),seen:0,sx:G.sx,sy:G.sy},extra||{});
  L.unshift(th);
  while(L.length>40)L.pop();
  if(tableOpenNow&&tableTab==="things")tableRender();else logBtnLabel();
  return th;
}
/* ── огонёк: «пришло» и «не прочитано» — разные вещи ──
   Автор (2026-08-26): «на столе чтобы не случилось в меню огонёк, он типо
   всегда горит и соответственно не работает». Так и было: огонёк считал
   вещи с `!seen`, то есть ВСЁ, что игрок не открыл поштучно. На столе всегда
   лежит десяток не открытых бумаг, значит огонёк горел всегда, а сигнал,
   который горит всегда, не сигнал, а часть рамки кнопки.

   Понятия разведены:
   · **огонёк в меню** = «пришло после того, как вы последний раз подходили к
     столу». Меряется временем прихода против `G.tableSeen`; открыл стол —
     погас, даже если ничего не читал. Гореть вечно он теперь не может.
   · **сургучная точка на предмете** = «не прочитано» (A3). Живёт своей
     жизнью и гаснет только когда предмет открыли. Это правильная вещь, она
     остаётся — просто она не про кнопку МЕНЮ.
   · **счётчик на закладке** показывает, КУДА смотреть, и держится, пока стол
     открыт: если гасить его вместе с огоньком, игрок откроет стол и не
     узнает, на какой закладке новость.

   Метка визита — свой флаг `noticed` на предмете, а не сравнение времени
   прихода с временем визита. Времени тут доверять нельзя: `Date.now()` идёт
   миллисекундами, а бумага вполне может лечь на стол в ту же миллисекунду,
   в которую его закрыли (одно нажатие делает и то, и другое), — и тогда
   новость теряется навсегда. Флаг ставится явно и не зависит от часов. */
function tableNoticeAll(){
  thingsAll().forEach(t=>{t.noticed=1;});
  (G.strips||[]).forEach(t=>{t.noticed=1;});
  G.tableSeen=Date.now();
}
function tableNewThings(){return thingsAll().filter(t=>!t.noticed).length;}
/* снимок «что было новым» на момент открытия — живёт, пока стол открыт */
let tableWasNew=null;
function tableNewBy(tab){
  const w=tableWasNew;
  if(w)return w[tab]|0;
  if(tab==="ether"||tab==="bort"||tab==="folk")return (G.logNewBy&&G.logNewBy[tab])|0;
  if(tab==="things")return thingsAll().filter(t=>!t.noticed).length;
  if(tab==="strips")return (G.strips||[]).filter(t=>!t.noticed).length;
  return 0;
}
function tableToggle(open,tab){
  const w=document.getElementById("tablewin");if(!w)return;
  tableOpenNow=open===undefined?!tableOpenNow:!!open;
  if(tab)tableTab=tab;
  w.classList.toggle("open",tableOpenNow);
  document.body.classList.toggle("table",tableOpenNow);
  logOpen=tableOpenNow;
  if(tableOpenNow){
    /* Сперва снимок — иначе закладки погаснут в тот же миг, и игрок,
       открывший стол «потому что горело», не узнает, где именно новость. */
    tableWasNew={ether:tableNewBy("ether"),bort:tableNewBy("bort"),folk:tableNewBy("folk"),
                 things:tableNewBy("things"),strips:tableNewBy("strips")};
    G.logNew=0;G.logNewBy={};tableNoticeAll();
    tableBake();tableRender();
  }else tableWasNew=null;
  logBtnLabel();
}
function tableSetTab(t){tableTab=t;tableRender();}
/* столешница: дерево, лампа сверху, лист бумаги под списком. Статика — печём. */
function tableBake(){
  const cv=document.getElementById("tablecv");if(!cv)return;
  const W=cv.clientWidth||innerWidth,H=cv.clientHeight||innerHeight;
  /* панель увеличена zoom-ом (M221), значит и печь её надо во столько же раз
     плотнее: иначе доски стола расплываются ровно на большом мониторе */
  const dpr=Math.min(2,window.devicePixelRatio||1)*(typeof UIK==="number"?UIK:1);
  if(tableBaked&&tableBaked.W===W&&tableBaked.H===H)return;
  cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
  const c=cv.getContext("2d");c.setTransform(dpr,0,0,dpr,0,0);
  /* доски: четыре полосы с лёгкой разницей тона и стыками */
  const base=c.createLinearGradient(0,0,0,H);
  base.addColorStop(0,"#1a120b");base.addColorStop(.5,"#241810");base.addColorStop(1,"#150e08");
  c.fillStyle=base;c.fillRect(0,0,W,H);
  const r=rng(0x7AB1E);
  const n=Math.max(4,Math.round(W/190));
  for(let i=0;i<n;i++){
    const x0=i*W/n,w=W/n;
    c.fillStyle="rgba(255,210,150,"+(.025+r()*.035).toFixed(3)+")";c.fillRect(x0,0,w,H);
    /* волокна */
    c.strokeStyle="rgba(0,0,0,.18)";c.lineWidth=1;
    for(let k=0;k<14;k++){const y=r()*H;c.beginPath();c.moveTo(x0+2,y);
      c.bezierCurveTo(x0+w*.3,y+(r()-.5)*30,x0+w*.7,y+(r()-.5)*30,x0+w-2,y+(r()-.5)*12);c.stroke();}
    c.fillStyle="rgba(0,0,0,.35)";c.fillRect(x0+w-1.5,0,1.5,H);
  }
  /* свет лампы сверху — тёплое пятно, края уходят в тень */
  const g=c.createRadialGradient(W*.5,-H*.1,20,W*.5,H*.25,Math.max(W,H)*.9);
  g.addColorStop(0,"rgba(255,214,150,.22)");g.addColorStop(.45,"rgba(255,190,120,.06)");g.addColorStop(1,"rgba(0,0,0,.55)");
  c.fillStyle=g;c.fillRect(0,0,W,H);
  tableBaked={W,H};
}
function tableRender(){
  const box=document.getElementById("loglist"),lore=document.getElementById("lorelist");
  if(!box)return;
  document.querySelectorAll("#tableTabs button").forEach(b=>{
    b.classList.toggle("on",b.dataset.tab===tableTab);
    if(b.dataset.tab==="lore")b.style.display=(typeof loreCount==="function"&&loreCount())?"":"none";
    /* альбом заводится с первым снимком: пустая закладка обещает содержимое,
       которого нет, и на телефоне отнимает место у тех, где что-то лежит */
    if(b.dataset.tab==="album")b.style.display=(typeof albumAll==="function"&&albumAll().length)?"":"none";
    /* почта появляется, когда она есть: офлайн её нет вовсе, и пустая закладка
       обещала бы то, чего в этой сборке не бывает (M190) */
    if(b.dataset.tab==="chess")b.style.display=
      (typeof chessAll==="function"&&Object.keys(chessAll().g).length)?"":"none";
    /* приёмники появляются, когда хоть один пойман: пустая панель обещала бы
       список, которого нет, а находят их ручкой, а не закладкой (M218) */
    if(b.dataset.tab==="relay")b.style.display=
      (typeof relayAll==="function"&&Object.keys(relayAll()).length)?"":"none";
    if(b.dataset.tab==="qsl")b.style.display=
      (typeof qslAll==="function"&&Object.keys(qslAll().heard).length)?"":"none";
    /* рейсы заводятся с первым дроном: пустая закладка обещала бы список,
       которого у новичка нет (M237) */
    if(b.dataset.tab==="fleet")b.style.display=
      ((G.drones&&G.drones.length)||(G.droneInventory|0))?"":"none";
    if(b.dataset.tab==="books")b.style.display=
      (typeof bookCount==="function"&&bookCount())?"":"none";
    if(b.dataset.tab==="diary")b.style.display=
      ((typeof winOn==="function"&&winOn())||thingsAll().some(t=>t.diary))?"":"none";
    if(b.dataset.tab==="mail")b.style.display=
      (typeof mailOn==="function"&&mailOn()&&(mailAll().st.length||albumAll().length))?"":"none";
    /* счётчик новостей на самой закладке: огонёк привёл к столу, закладка
       говорит, на какую полку смотреть. Подпись не переписываем — у неё своя
       ширина, и прыгающие вкладки читаются браком. */
    let dot=b.querySelector("i");
    const n=tableNewBy(b.dataset.tab);
    if(n){
      if(!dot){dot=document.createElement("i");b.appendChild(dot);}
      dot.textContent=n>99?"99+":n;
    }else if(dot)dot.remove();
  });
  const sub=document.getElementById("tableSub"),cr=document.getElementById("tableCr"),wh=document.getElementById("tableWhere");
  const SUB={ether:"эфир · что было услышано",bort:"борт · техника и деньги",folk:"люди · что вам сказали",
             deeds:"дела · что вы должны",strips:"ленты · оторванные полосы самописца",things:"вещи · письма, находки, бумаги",
             hold:"трюм · груз, разложенный по кучам",
             fleet:"рейсы · кто на вас работает и что возит",
             prices:"цены · как их видели, по станциям",record:"трудовая книжка · записи чужими руками",
             album:"альбом · снимки мест, где вы стояли",
             mail:"почта · стопки карточек, скреплённые скрепкой",
             diary:"дневник зимовки · бланками, потому что писать некому",
             books:"полка · что нашлось в обломках и уцелело",
             qsl:"карточки · кого слышал и кто ответил",
             relay:"приёмники · мачты, пойманные в шуме между диапазонами",
             chess:"партия · ход в сутки, доска считается из ходов",
             lore:"отчёт «Долгого хода»"};
  if(sub)sub.textContent=SUB[tableTab]||"";
  if(cr)cr.textContent=Math.round(G.credits).toLocaleString("ru")+" кр";
  if(wh){const mr=modeRu();
    wh.textContent=(G.sys&&G.sys.name?G.sys.name:"—")+(mr?" · "+mr:"");}
  box.style.display=tableTab==="lore"?"none":"";
  if(lore)lore.style.display=tableTab==="lore"?"":"none";
  /* Что читают — лежит на ЛИСТЕ; что держат в руках — лежит на СТОЛЕ (A3).
     Тетрадь, дела, цены и книжка — это записи, им место на бумаге. Ленты и
     вещи — предметы: письмо, накладная, вырезка, полоса самописца, — и лист
     под ними был бы ошибкой: бумага на бумаге не читается. */
  box.classList.toggle("desk",tableTab==="things"||tableTab==="strips"||tableTab==="hold"||
    tableTab==="album"||tableTab==="mail"||tableTab==="diary");
  if(tableTab==="ether"||tableTab==="bort"||tableTab==="folk")renderLog(tableTab);
  else if(tableTab==="deeds")renderDeeds();
  else if(tableTab==="strips")renderStrips(box);
  else if(tableTab==="things")renderThings(box);
  else if(tableTab==="hold"&&typeof renderHold==="function")renderHold(box);
  else if(tableTab==="fleet"&&typeof renderFleetRuns==="function")renderFleetRuns(box);
  else if(tableTab==="prices"&&typeof renderPrices==="function")renderPrices(box);
  else if(tableTab==="record"&&typeof renderRecord==="function")renderRecord(box);
  else if(tableTab==="album"&&typeof renderAlbum==="function")renderAlbum(box);
  else if(tableTab==="mail"&&typeof renderMail==="function")renderMail(box);
  else if(tableTab==="diary"&&typeof renderDiary==="function")renderDiary(box);
  else if(tableTab==="books"&&typeof renderBooks==="function")renderBooks(box);
  else if(tableTab==="qsl"&&typeof renderQsl==="function")renderQsl(box);
  else if(tableTab==="relay"&&typeof renderRelays==="function")renderRelays(box);
  else if(tableTab==="chess"&&typeof renderChess==="function")renderChess(box);
  else if(tableTab==="lore"&&typeof renderLoreBoard==="function")renderLoreBoard();
}
function tableRow(box,cls,em,text){
  const row=document.createElement("div");row.className="li "+(cls||"");
  const e=document.createElement("em");e.textContent=em||"";
  const s=document.createElement("span");s.textContent=text;
  row.appendChild(e);row.appendChild(s);box.appendChild(row);return row;
}
/* лента как вещь: полоса с кривой невязки. Три и больше — лежат рядом (M155
   сложит из них фигуру; здесь они просто видны вместе) */
function renderStrips(box){
  box.textContent="";
  const L=(typeof stripsAll==="function")?stripsAll():[];
  if(!L.length){tableRow(box,"dim","","лент нет. Оторвать полосу — клавиша T в полёте, когда на бумаге уже что-то записано");return;}
  tableRow(box,"head","","ЛЕНТ "+L.length+(L.length>=3?" · ТРИ И БОЛЬШЕ ЛЕЖАТ РЯДОМ":""));
  /* фигура (M155): три и больше лент уезда — одна форма, без подписи */
  const F=(typeof misFigureStrips==="function")?misFigureStrips():[];
  if(F.length>=3&&typeof drawMisFigure==="function"){
    const row=document.createElement("div");row.className="thing";
    const cv=document.createElement("canvas");cv.width=520;cv.height=180;cv.style.cssText="width:260px;height:90px";
    drawMisFigure(cv.getContext("2d"),520,180);
    const nm=document.createElement("div");nm.className="nm";nm.innerHTML="<b>"+F.length+" ленты легли рядом</b><s></s>";
    row.appendChild(cv);row.appendChild(nm);box.appendChild(row);
  }
  L.forEach((s,k)=>{
    const row=document.createElement("div");row.className="thing";
    const cv=document.createElement("canvas");cv.width=128;cv.height=80;
    const c=cv.getContext("2d");
    c.fillStyle="#e9e2cc";c.fillRect(0,0,128,80);
    c.strokeStyle="rgba(120,90,60,.35)";c.lineWidth=1;
    for(let x=8;x<128;x+=12){c.beginPath();c.moveTo(x,0);c.lineTo(x,80);c.stroke();}
    const r=rng(hashi(s.sx,s.sy,s.span|0));
    c.strokeStyle="#2b3a8a";c.lineWidth=2;c.beginPath();
    for(let x=0;x<=128;x+=4){const y=40+Math.sin(x/18+r()*.4)*10*(s.mis*6+.4)+(r()-.5)*4;x?c.lineTo(x,y):c.moveTo(x,y);}
    c.stroke();
    const nm=document.createElement("div");nm.className="nm";
    nm.innerHTML="<b>Лента · сектор "+s.sx+":"+s.sy+"</b><s>невязка "+(+s.mis).toFixed(3)+" · "+s.span+" делений · "+
      (typeof stripValue==="function"?stripValue(s)+" кр на стойке":"")+"</s>";
    row.appendChild(cv);row.appendChild(nm);box.appendChild(row);
  });
}
function renderThings(box){
  box.textContent="";
  const L=thingsAll();
  if(!L.length){tableRow(box,"dim","","на столе пусто: письма, находки и бумаги лягут сюда");return;}
  L.forEach(t=>{
    const row=document.createElement("div");row.className="thing"+(t.seen?"":" new");
    const cv=document.createElement("canvas");cv.width=128;cv.height=80;
    if(t.k==="tape"&&t.full&&typeof drawMisFigure==="function")drawMisFigure(cv.getContext("2d"),128,80);
    else if(t.k==="tape"&&t.ring&&typeof drawRingTape==="function")drawRingTape(cv.getContext("2d"),t,128,80);
    else drawThingIcon(cv.getContext("2d"),t.k,128,80);
    const nm=document.createElement("div");nm.className="nm";
    nm.innerHTML="<b>"+t.ru+"</b><s>"+(t.note||"")+
      (t.sx!=null?(t.note?" · ":"")+"сектор "+t.sx+":"+t.sy:"")+"</s>";
    row.appendChild(cv);row.appendChild(nm);
    /* «Желание-1» (M153): три желания, и все три — она */
    if(t.k==="wish"&&G.wishDevice===1&&typeof vegaWish==="function"){
      const bb=document.createElement("div");bb.style.cssText="display:flex;flex-direction:column;gap:6px";
      for(const W of VEGA_WISHES){const b=document.createElement("button");b.className="act sm gold";b.textContent=W.ru.toUpperCase();b.onclick=()=>{vegaWish(W.id);tableRender();};bb.appendChild(b);}
      row.appendChild(bb);
    }
    box.appendChild(row);
    t.seen=1;
  });
  logBtnLabel();
}
/* Значок вещи: конверт, бумага, вырезка, предмет. Четвёртая форма появилась
   вместе с бумажным столом (A3): вырезка из газеты и найденная пластина
   выглядели одним и тем же серым прямоугольником, а на столе вещь опознают
   по силуэту раньше, чем прочтут подпись. */
function drawThingIcon(c,k,W,H){
  c.clearRect(0,0,W,H);
  c.save();c.translate(W/2,H/2);
  if(k==="letter"){
    c.fillStyle="#e6dcc2";c.fillRect(-40,-22,80,44);
    c.strokeStyle="rgba(90,70,40,.6)";c.lineWidth=1.5;c.strokeRect(-40,-22,80,44);
    c.beginPath();c.moveTo(-40,-22);c.lineTo(0,6);c.lineTo(40,-22);c.stroke();
  }else if(k==="paper"||k==="record"||k==="voucher"){
    c.fillStyle="#ece6d2";c.fillRect(-28,-34,56,68);
    c.strokeStyle="rgba(90,70,40,.35)";c.lineWidth=1;
    for(let y=-22;y<30;y+=8){c.beginPath();c.moveTo(-20,y);c.lineTo(20,y);c.stroke();}
    if(k==="record"){c.fillStyle="#8a2d2d";c.fillRect(-28,-34,56,10);}
  }else if(k==="cut"||k==="clip"||k==="news"){
    /* вырезка: рваный край справа, заголовок жирной строкой, две колонки */
    c.fillStyle="#e4dcc6";
    c.beginPath();c.moveTo(-36,-28);c.lineTo(30,-28);
    for(let y=-24;y<28;y+=8)c.lineTo(30+((y/8)%2?4:-3),y);
    c.lineTo(30,28);c.lineTo(-36,28);c.closePath();c.fill();
    c.strokeStyle="rgba(90,70,40,.45)";c.lineWidth=1;c.stroke();
    c.fillStyle="rgba(60,46,26,.75)";c.fillRect(-30,-22,50,4);
    c.strokeStyle="rgba(90,70,40,.40)";
    for(let y=-12;y<24;y+=5){
      c.beginPath();c.moveTo(-30,y);c.lineTo(-6,y);c.stroke();
      c.beginPath();c.moveTo(2,y);c.lineTo(24,y);c.stroke();
    }
  }else{
    /* пластина: металл с фаской, вырезом на кромке и парой царапин */
    c.fillStyle="#6f7b86";c.beginPath();c.roundRect(-30,-18,60,36,6);c.fill();
    c.fillStyle="rgba(255,255,255,.12)";c.fillRect(-30,-18,60,8);
    c.fillStyle="rgba(0,0,0,.45)";c.beginPath();c.arc(30,0,7,0,TAU);c.fill();
    c.strokeStyle="rgba(255,255,255,.22)";c.lineWidth=1;
    c.beginPath();c.moveTo(-22,6);c.lineTo(-4,-2);c.stroke();
    c.beginPath();c.moveTo(-14,12);c.lineTo(12,4);c.stroke();
    c.strokeStyle="rgba(0,0,0,.5)";c.lineWidth=1.5;c.beginPath();c.roundRect(-30,-18,60,36,6);c.stroke();
  }
  c.restore();
}
(function tableWire(){
  const b=document.getElementById("tablebtn"),x=document.getElementById("tableClose");
  if(b)b.addEventListener("click",()=>tableToggle(true));
  if(x)x.addEventListener("click",()=>tableToggle(false));
  document.querySelectorAll("#tableTabs button").forEach(bt=>bt.addEventListener("click",()=>tableSetTab(bt.dataset.tab)));
  addEventListener("resize",()=>{if(tableOpenNow){tableBaked=null;tableBake();}});
  addEventListener("keydown",e=>{
    if(e.code==="Escape"&&tableOpenNow){tableToggle(false);e.preventDefault();}
  });
})();
