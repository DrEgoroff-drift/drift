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
function tableNewThings(){return thingsAll().filter(t=>!t.seen).length;}
function tableToggle(open,tab){
  const w=document.getElementById("tablewin");if(!w)return;
  tableOpenNow=open===undefined?!tableOpenNow:!!open;
  if(tab)tableTab=tab;
  w.classList.toggle("open",tableOpenNow);
  document.body.classList.toggle("table",tableOpenNow);
  logOpen=tableOpenNow;
  if(tableOpenNow){
    G.logNew=0;G.logNewBy={};
    tableBake();tableRender();
  }
  logBtnLabel();
}
function tableSetTab(t){tableTab=t;tableRender();}
/* столешница: дерево, лампа сверху, лист бумаги под списком. Статика — печём. */
function tableBake(){
  const cv=document.getElementById("tablecv");if(!cv)return;
  const W=cv.clientWidth||innerWidth,H=cv.clientHeight||innerHeight;
  const dpr=Math.min(2,window.devicePixelRatio||1);
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
  });
  const sub=document.getElementById("tableSub"),cr=document.getElementById("tableCr"),wh=document.getElementById("tableWhere");
  const SUB={ether:"эфир · что было услышано",bort:"борт · техника и деньги",folk:"люди · что вам сказали",
             deeds:"дела · что вы должны",strips:"ленты · оторванные полосы самописца",things:"вещи · письма, находки, бумаги",
             prices:"цены · как их видели, по станциям",lore:"отчёт «Долгого хода»"};
  if(sub)sub.textContent=SUB[tableTab]||"";
  if(cr)cr.textContent=Math.round(G.credits).toLocaleString("ru")+" кр";
  if(wh)wh.textContent=(G.sys&&G.sys.name?G.sys.name:"—")+" · "+(G.mode||"");
  box.style.display=tableTab==="lore"?"none":"";
  if(lore)lore.style.display=tableTab==="lore"?"":"none";
  if(tableTab==="ether"||tableTab==="bort"||tableTab==="folk")renderLog(tableTab);
  else if(tableTab==="deeds")renderDeeds();
  else if(tableTab==="strips")renderStrips(box);
  else if(tableTab==="things")renderThings(box);
  else if(tableTab==="prices"&&typeof renderPrices==="function")renderPrices(box);
  else if(tableTab==="prices"&&typeof renderPrices==="function")renderPrices(box);
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
    drawThingIcon(cv.getContext("2d"),t.k,128,80);
    const nm=document.createElement("div");nm.className="nm";
    nm.innerHTML="<b>"+t.ru+"</b><s>"+(t.note||"")+(t.sx!=null?" · "+t.sx+":"+t.sy:"")+"</s>";
    row.appendChild(cv);row.appendChild(nm);box.appendChild(row);
    t.seen=1;
  });
  logBtnLabel();
}
/* значок вещи: конверт, бумага, предмет — три формы, остальное цветом */
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
  }else{
    c.fillStyle="#6f7b86";c.beginPath();c.roundRect(-30,-18,60,36,6);c.fill();
    c.fillStyle="rgba(255,255,255,.12)";c.fillRect(-30,-18,60,8);
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
