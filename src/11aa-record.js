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
  /* и запись в ОТЧЁТ трогает только свою страницу (P1) */
  if(typeof tableIsOpen==="function"&&tableIsOpen()
    &&(typeof tableShowsRecord!=="function"||tableShowsRecord()))tableRender();else logBtnLabel();
  return e;
}
function recordYears(){const R=recordAll();return Math.floor((celDay()-R.t0)/365);}
/* ── отпускные (P14): 28 дней за год неба, копятся со стажем. Санаторий
   списывает свои три дня (29h); что не отгулял до комиссии — бухгалтерия
   выплачивает при уходе на пенсию. R.vac — сколько дней уже отгулял ── */
const RECORD_VAC_YEAR=28,RECORD_VAC_PAY=40;
function recordVac(){
  const R=recordAll();
  const got=Math.floor(Math.max(0,celDay()-R.t0)*RECORD_VAC_YEAR/365),used=R.vac|0;
  return {got,used,left:got-used};
}
function recordVacUse(days){const R=recordAll();R.vac=(R.vac|0)+(days|0);}
/* печать или подпись: учреждение ставит круглую печать, человек расписывается.
   Люди в книжке — те, у кого инициалы, и домашние */
const RECORD_PEOPLE=["Вега","попугай","замполит","неизвестные"];
function recordSeal(a){return /\s[А-ЯЁ]\.\s?[А-ЯЁ]?\.?$/.test(a)||RECORD_PEOPLE.includes(a)?"sign":"seal";}
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
  /* неотгулянный отпуск — деньгами, строкой бухгалтерии (P14) */
  const V=recordVac();
  if(V.left>0){
    const pay=earn(V.left*RECORD_VAC_PAY,"отпуск");
    recordVacUse(V.left);
    recordAdd("бухгалтерия","компенсация за неиспользованный отпуск: "+V.left+" дн. · "+pay+" кр.");
  }
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
  /* обложка документа: серия и номер от зерна, и зачем он вообще (P14) */
  const hn=hashi(R.t0|0,0xB00C,1)>>>0,ser="АТ-"+"IVX"[hn%3]+" № "+String(hn%9000000+1000000);
  tableRow(box,"dim","","серия "+ser+" · записи делают другие: станция, институт, люди. Три записи от станции — ваше имя на её доске почёта. Через "+RECORD_YEARS+" лет неба — медкомиссия");
  const H=recordHonour();
  if(H.length)tableRow(box,"sec","","НА ДОСКЕ ПОЧЁТА: "+H.join(", "));
  /* кому осталось чуть-чуть: одна-две записи до доски */
  const by={};for(const x of R.e)by[x.a]=(by[x.a]|0)+1;
  const near=Object.keys(by).filter(a=>by[a]<3&&recordSeal(a)==="seal").sort((a,b)=>by[b]-by[a]).slice(0,3);
  if(near.length)tableRow(box,"dim","","до доски почёта: "+near.map(a=>a+" — ещё "+(3-by[a])).join(" · "));
  /* отпуск и концовка — на странице, а не только в голове (P14) */
  const V=recordVac();
  tableRow(box,"sec","","ОТПУСК · НАКОПЛЕНО "+V.got+" ДН. · ОТГУЛЯНО "+V.used+" · ОСТАТОК "+V.left);
  if(R.grounded)tableRow(box,"sec","","ЗАКЛЮЧЕНИЕ КОМИССИИ · К ПОЛЁТАМ НЕ ДОПУЩЕН · ФЛОТ ЛЕТАЕТ БЕЗ ВАС");
  else{const y=RECORD_YEARS-recordYears();
    tableRow(box,"dim","",y>0?"до медкомиссии: "+y+" "+pl3(y,"год","года","лет")+" неба":"медкомиссия ждёт на стойке ядра дома");}
  if(typeof stampPage==="function")stampPage(box);   /* первая настоящая страница документа (M453) */
  if(R.udar)tableRow(box,"sec","","ОТМЕТКИ «УДАРНИК»: "+R.udar+" · госзаказы сданы по твёрдой цене");   /* M503 */
  if(typeof socPage==="function")socPage(box);   /* общества и льготы (M512) */
  if(typeof volPage==="function")volPage(box);   /* волокита: бумаги на животных (M511) */
  if(!R.e.length){tableRow(box,"dim","","записей нет: их делают другие — станции, институт, люди");return;}
  for(let i=R.e.length-1;i>=0;i--){
    const x=R.e[i];
    const row=document.createElement("div");row.className="li talk";
    /* просто число, не «день N» (П6, §4.4): колонка встроена в 34px, до самой
       красной линии поля (left:48px, #loglist::before) — тот же приём, что и
       у соседних страниц (logTime, координаты сектора), а не отдельное слово.
       Через время суток растут (скачки часов — 11ab-institute и другие), и
       «день 11» уже не помещался; голое число помещается всегда */
    const em=document.createElement("em");em.textContent=String(x.d);
    const sp=document.createElement("span");sp.innerHTML="<b>"+x.a+"</b> — "+x.s+
      (recordSeal(x.a)==="seal"?"<i class='rec-seal'>м.п.</i>":"<i class='rec-sign'>"+x.a.slice(0,3)+"~</i>");
    row.appendChild(em);row.appendChild(sp);box.appendChild(row);
  }
}
