/* ══════════════ трудовая книжка: биография, написанная другими ══════════════
   M161. У вещей есть паспорта (M150), у игрока не было ничего. Трудовая
   книжка — одна страница на столе (закладка КНИЖКА): записи делают ДРУГИЕ —
   станция «благодарность за наряд», институт «сдана лента», посёлок
   «бывает редко», Вега «дома не бывает», шестая — «рекомендация». Стаж — в
   годах неба. Доска почёта: на станции, где записей от неё три и больше,
   появляется ваше имя — единственная награда в игре.

   СТАРЕНИЕ И КОМИССИЯ. Через N лет (12) медкомиссия на стойке ядра снимает с
   полётов: «к полётам не допущен». Вторая концовка, тихая, в ключе
   «Стажёров»: пенсия дома — с Вегой и двумя попугаями, если так сложилось.
   Последнюю запись в книжке делает попугай.

   ПРАВИЛА ФАЙЛА:
   1. Игрок сам в книжку не пишет. Ни одной записи от первого лица.
   2. Хранится G.record: {e:[{a,s,d}], t0, grounded}. Не больше 120 записей. */
const RECORD_YEARS=12;
function recordAll(){
  if(!G.record||typeof G.record!=="object")G.record={e:[],t0:celDay(),grounded:0};
  return G.record;
}
function recordAdd(author,text){
  if(!author||!text)return null;
  const R=recordAll();
  const e={a:String(author),s:String(text),d:celDay()};
  /* одна и та же запись в один день не дублируется */
  if(R.e.some(x=>x.a===e.a&&x.s===e.s&&x.d===e.d))return null;
  R.e.push(e);while(R.e.length>120)R.e.shift();
  if(typeof tableIsOpen==="function"&&tableIsOpen())tableRender();else logBtnLabel();
  return e;
}
function recordYears(){const R=recordAll();return Math.floor((celDay()-R.t0)/365);}
function recordByAuthor(a){return recordAll().e.filter(x=>x.a===a);}
/* доска почёта: станции с тремя и больше записями */
function recordHonour(){
  const by={};for(const x of recordAll().e)by[x.a]=(by[x.a]|0)+1;
  return Object.keys(by).filter(a=>by[a]>=3);
}
function recordPilot(){return (G.shipId&&shipData(G.shipId))?"пилот «"+shipData(G.shipId).ru+"»":"пилот";}
/* ежедневно: чужие записи, которые зависят от состояния */
function recordTick(){
  const R=recordAll();const d=celDay();
  if(R.lastDay===d)return;R.lastDay=d;
  if(typeof sixthGone==="function"&&sixthGone()&&!R.sixth){R.sixth=1;recordAdd("Варламова З.","рекомендация: считает. Не объясняет. Годится.");}
  const V=G.vega;
  if(V&&V.stage>=2&&V.away>=8&&!R.vega){R.vega=1;recordAdd("Вега","характеристика: дома не бывает.");}
  if(V&&V.stage===4&&!R.vega2){R.vega2=1;recordAdd("Вега","характеристика: скучный. Это хорошо.");}
  if(V&&V.parrot2&&R.grounded&&!R.last){R.last=1;recordAdd("попугай","пр-р-р. дома. дома. не уходи.");}
}
/* комиссия: на стойке ядра, после N лет */
function recordBoardHere(){
  const R=recordAll();
  if(R.grounded||recordYears()<RECORD_YEARS)return false;
  /* эталон договора (P8, правило 4) проходит через сторожа вместе с прочими —
     не потому, что ему нужно окно, а потому, что таблица окон должна быть
     полной: конец без строки в ней — это конец без окна */
  if(typeof clockOpen==="function"&&!clockOpen("record"))return false;
  return !!(G.st&&typeof hoursDepthAt==="function"&&hoursDepthAt(G.sx,G.sy)===2);
}
function recordGround(){
  const R=recordAll();if(R.grounded)return false;
  R.grounded=1;
  recordAdd("медкомиссия","к полётам не допущен. Стаж "+recordYears()+" лет. Пенсия.");
  thingAdd("record","Заключение комиссии","«к полётам не допущен» · стаж "+recordYears()+" лет · флот летает без вас · вы дома"+(G.vega&&G.vega.stage===4?" · с Вегой и двумя попугаями":""));
  logAdd("warn","Медкомиссия: к полётам не допущен. Пенсия.");
  say("МЕДКОМИССИЯ\nк полётам не допущен\n\nпенсия",400);
  if(G.vega&&G.vega.parrot2)recordAdd("попугай","пр-р-р. дома. дома. не уходи.");
  return true;
}
function recordBlock(){
  /* доска почёта этой станции */
  if(G.st&&recordByAuthor(G.st.name).length>=3){
    $body.appendChild(el("div","sec","ДОСКА ПОЧЁТА"));
    $body.appendChild(el("div","row","<div class='nm'><b>"+recordPilot()+"</b><s>"+recordByAuthor(G.st.name).map(x=>x.s).slice(-3).join(" · ")+"</s></div>"));
  }
  if(recordBoardHere()){
    $body.appendChild(el("div","sec","МЕДКОМИССИЯ · СТАЖ "+recordYears()+" ЛЕТ"));
    const r=el("div","row","<div class='nm'><b>К полётам не допущен</b><s>трое с бумагой · флот летает без вас · домой</s></div>");
    const b=el("button","act sm","ПРИНЯТЬ");b.onclick=()=>{recordGround();renderTab();};
    r.appendChild(b);$body.appendChild(r);
  }
}
/* страница на столе */
function renderRecord(box){
  box.textContent="";
  const R=recordAll();
  tableRow(box,"head","","ТРУДОВАЯ КНИЖКА · "+recordPilot().toUpperCase()+" · СТАЖ "+recordYears()+" "+pl3(recordYears(),"ГОД","ГОДА","ЛЕТ")+(R.grounded?" · ПЕНСИЯ":""));
  const H=recordHonour();
  if(H.length)tableRow(box,"sec","","НА ДОСКЕ ПОЧЁТА: "+H.join(", "));
  if(!R.e.length){tableRow(box,"dim","","записей нет: их делают другие — станции, институт, люди");return;}
  for(let i=R.e.length-1;i>=0;i--){
    const x=R.e[i];
    const row=document.createElement("div");row.className="li talk";
    const em=document.createElement("em");em.textContent="день "+x.d;
    const sp=document.createElement("span");sp.innerHTML="<b>"+x.a+"</b> — "+x.s;
    row.appendChild(em);row.appendChild(sp);box.appendChild(row);
  }
}
