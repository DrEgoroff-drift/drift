/* ══════════════ стенгазета и концерт по заявкам ══════════════
   M165. Народный слой станции. У новостей (12p) и книжки (11aa) есть факты —
   стенгазета вешает их на стену: лист с тремя клетками — карикатура (на того,
   кто задержал баржу; при худой репутации — на вас), «молния» о перевыполнении
   и стихи смотрителя. Рисуется, не пишется: правило «сто кусков — одно тело»
   тут ни при чём, это бумага.

   КОНЦЕРТ ПО ЗАЯВКАМ. Раз в день с любой стойки можно передать привет другой
   станции: три ноты её позывного (M42 умеет синтез) уходят в эфир, строка —
   в ЭФИР; Вега слушает; иногда соперник отвечает своим приветом.

   ПРАВИЛА ФАЙЛА:
   1. Стенгазета ничего не сочиняет: карикатура — по видимым фактам (баржа,
      репутация), «молния» — по нуждам и наряду, стихи — из таблицы.
   2. Хранится только G.concert.lastDay: привет — раз в день. */
const WALL_POEMS=[
  "Стоит на смене человек,\nа смена — как назло, навек.\nНо лампа светит, счёт идёт —\nи кто-то всё-таки придёт.",
  "Не спрашивай, куда ушли —\nспроси, зачем остались мы.\nОстались — значит, здесь дела.\nБери метлу. Мети с угла.",
  "Часы стоят. Часы идут.\nКому как выпало. А тут\nмы сверим время по гудку —\nи по гудку же на боку.",
  "Прилетел — не мусори.\nУлетел — вернись.\nЭто вся поэзия.\nОстальное — жизнь."
];
function concertAll(){if(!G.concert||typeof G.concert!=="object")G.concert={lastDay:-1};return G.concert;}
/* герой карикатуры: худая репутация — вы; иначе баржа этого окна */
function wallHero(){
  const rep=(typeof repAt==="function")?repAt(G.sys):0;
  if(rep<0)return {ru:"пилот, который вечно торопится",you:1};
  const r=rng(hashi(G.sx,G.sy,0xA11+Math.floor(celDay()/3)));
  return {ru:"баржа «"+genName(r)+"», опоздавшая на "+(2+Math.floor(r()*9))+" часов",you:0};
}
/* «молния»: перевыполнение — по сданному для экспедиции или закрытой нужде */
function wallFlash(){
  const E=G.exp;
  if(E&&E.phase===1){const total=Object.keys(E.coll||{}).reduce((a,k)=>a+E.coll[k],0);if(total>0)return "план по сбору перевыполнен: сдано "+total+" единиц. Так держать.";}
  const closed=Object.keys(G.need||{}).length;
  if(closed)return "нужда закрыта: "+closed+" "+pl3(closed,"станция получила","станции получили","станций получили")+" своё вовремя.";
  return "план выполняется. Подробности — у стойки.";
}
/* лист: бумага, три клетки, кнопки-гвозди */
function drawWallPaper(c,W,H){
  c.fillStyle="#e8e0c8";c.fillRect(0,0,W,H);
  c.strokeStyle="rgba(120,90,60,.5)";c.lineWidth=2;c.strokeRect(3,3,W-6,H-6);
  c.fillStyle="#8a2d2d";c.font="bold 13px monospace";c.textAlign="center";
  c.fillText("СТЕННАЯ ГАЗЕТА",W/2,20);
  c.strokeStyle="rgba(120,90,60,.35)";c.lineWidth=1;
  c.beginPath();c.moveTo(W/3,30);c.lineTo(W/3,H-8);c.moveTo(W*2/3,30);c.lineTo(W*2/3,H-8);c.moveTo(6,28);c.lineTo(W-6,28);c.stroke();
  /* гвозди по углам */
  c.fillStyle="#555";for(const [x,y] of [[8,8],[W-8,8],[8,H-8],[W-8,H-8]]){c.beginPath();c.arc(x,y,2,0,TAU);c.fill();}
  /* 1: карикатура — рожица с подписью */
  const hero=wallHero();
  c.save();c.translate(W/6,H*.5);
  c.strokeStyle="#3a3a3a";c.lineWidth=1.4;
  c.beginPath();c.arc(0,-8,12,0,TAU);c.stroke();
  c.beginPath();c.arc(-4,-11,1.6,0,TAU);c.arc(5,-11,1.6,0,TAU);c.stroke();
  c.beginPath();c.arc(0,-4,5,.2,Math.PI-.2,hero.you);c.stroke();     /* вам — грустный рот */
  c.beginPath();c.moveTo(-10,4);c.lineTo(10,10);c.stroke();          /* спешит: наклонён */
  c.restore();
  c.fillStyle="#3a3a3a";c.font="8px monospace";
  wallWrap(c,hero.ru,W/6,H*.72,W/3-14);
  /* 2: молния */
  c.strokeStyle="#8a2d2d";c.lineWidth=2.4;
  c.beginPath();c.moveTo(W/2-14,36);c.lineTo(W/2+2,52);c.lineTo(W/2-6,52);c.lineTo(W/2+12,70);c.stroke();
  c.fillStyle="#8a2d2d";c.font="bold 9px monospace";c.fillText("МОЛНИЯ",W/2,82);
  c.fillStyle="#3a3a3a";c.font="8px monospace";
  wallWrap(c,wallFlash(),W/2,H*.62,W/3-14);
  /* 3: стихи смотрителя */
  c.fillStyle="#3a3a3a";c.font="italic 8px monospace";
  const poem=WALL_POEMS[Math.abs(hashi(G.sx,G.sy,Math.floor(celDay()/7)))%WALL_POEMS.length];
  poem.split("\n").forEach((ln,i)=>c.fillText(ln,W*5/6,44+i*11));
  c.font="7px monospace";c.fillText("— смотритель",W*5/6,44+5*11);
  c.textAlign="left";
}
function wallWrap(c,text,cx,y0,maxW){
  const words=text.split(" ");let line="",y=y0;
  for(const w of words){
    const t=line?line+" "+w:w;
    if(c.measureText(t).width>maxW&&line){c.fillText(line,cx,y);y+=10;line=w;}
    else line=t;
  }
  if(line)c.fillText(line,cx,y);
}
/* позывной станции: три ноты из посева — тем же синтезом, что музыка */
function concertNotes(sys){
  const r=rng(hashi(sys.sx,sys.sy,0xC0DE));
  const base=220*Math.pow(2,Math.floor(r()*12)/12);
  return [base,base*Math.pow(2,[3,4,5][Math.floor(r()*3)]/12),base*Math.pow(2,7/12)];
}
function concertSend(to){
  const C=concertAll();
  if(C.lastDay===celDay()||!to||!to.station)return false;
  if(G.credits<10)return false;
  G.credits-=10;C.lastDay=celDay();
  const notes=concertNotes(to);
  notes.forEach((f,i)=>setTimeout(()=>sfx("ui",{f,to:f,d:.28,v:.25}),i*300));
  etherLine("…по заявке борта — для станции "+to.station.name+": привет и три ноты позывного. Принимайте.");
  if(typeof recordAdd==="function")recordAdd(to.station.name,"передан привет по заявке");
  if(typeof repAdd==="function")repAdd(1,to);
  if(G.vega&&G.vega.stage>0&&G.vega.stage<4)peopleLine("Это ты передал? Я слышала. Мне никто не передавал никогда. Передай мне тоже. Нет, не сейчас — я обижусь, что по заказу.","Вега");
  const r=rng(hashi(celDay(),to.sx,0xC077));
  if(r()<.3){
    const RIV=["Пекарь","Совеня","Долгий Ким","Штоф","Мадам Крапива"];
    etherLine("…и встречная заявка: "+pick(RIV,r)+" передаёт привет борту, который передаёт приветы. Уели.");
  }
  return true;
}
/* блок доски: газета на стене + заявка */
function wallBlock(){
  if(!G.sys||!G.sys.station)return;
  $body.appendChild(el("div","sec","НА СТЕНЕ"));
  const row=document.createElement("div");row.className="row";
  const cv=document.createElement("canvas");cv.width=460;cv.height=150;cv.style.cssText="width:100%;max-width:460px;height:auto";
  drawWallPaper(cv.getContext("2d"),460,150);
  row.appendChild(cv);$body.appendChild(row);
  /* заявка: ближайшая другая станция */
  let to=null,best=1e9;
  for(let x=G.sx-6;x<=G.sx+6;x++)for(let y=G.sy-6;y<=G.sy+6;y++){
    if((x===G.sx&&y===G.sy)||!starAt(x,y))continue;
    const S=getSystem(x,y);if(!S||!S.station)continue;
    const d=Math.max(Math.abs(x-G.sx),Math.abs(y-G.sy));
    if(d<best){best=d;to=S;}
  }
  if(to){
    const sent=concertAll().lastDay===celDay();
    const r=el("div","row","<div class='nm'><b>Концерт по заявкам</b><s>передать привет станции "+to.station.name+" · три ноты её позывного · 10 кр · раз в день</s></div>");
    const b=el("button","act sm","ПЕРЕДАТЬ · 10 кр");b.disabled=sent||G.credits<10;
    b.onclick=()=>{concertSend(to);renderTab();};
    r.appendChild(b);$body.appendChild(r);
  }
}
