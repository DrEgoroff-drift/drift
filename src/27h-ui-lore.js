/* ══════════════ доска отчёта: место, где собранное можно прочесть ══════════════ */
/* Сто кусков и восемь глав собирались с M106, а читать их было негде: запись
   жила в `tell()` на один кадр и в ленте журнала вперемешку с ценами. Отсюда
   доска — второе окно того же каркаса, что журнал, и три правила:

   1. **Доска ничего не добавляет.** Здесь нет ни одной строки, которой игрок
      не подобрал сам. Это читальня, а не сводка: правило «конец меняет карту,
      а не текст» осталось бы пустым, если бы доска досказывала.
   2. **Пропуск остаётся пропуском.** Ненайденный кусок — не «???» и не
      проценты, а пустая строка на своём месте в главе. По доске видно не
      «сколько собрано», а какой формы дыра: в «Тишине» подряд четыре пробела,
      и это само по себе сведения.
   3. **Замечание главы открывается вместе с главой.** Восемь заметок,
      показанных с первого куска, — это оглавление чужой истории, выданное
      вперёд. Глава складывается с двух третей (`loreChapter`) — тогда и
      появляется строка о том, про что она была. */
let loreWinOpen=false;
function loreBtnTick(){
  const b=document.getElementById("lorebtn");if(!b)return;
  /* кнопки нет, пока нет ни куска: пустая читальня объявляет о существовании
     истории раньше, чем игрок наткнулся на первую зарубку */
  b.style.display=(typeof loreCount==="function"&&loreCount()&&G.mode!=="dock")?"":"none";
}
function loreRow(box,cls,num,text){
  const row=document.createElement("div");row.className="li "+(cls||"");
  const em=document.createElement("em");em.textContent=num||"";
  const sp=document.createElement("span");sp.textContent=text;
  row.appendChild(em);row.appendChild(sp);box.appendChild(row);
  return row;
}
function renderLoreBoard(){
  const box=document.getElementById("lorelist");if(!box)return;
  box.textContent="";
  const n=loreCount();
  loreRow(box,"head","","СОБРАНО "+n+" ИЗ 100 · ГЛАВ СЛОЖИЛОСЬ "+loreChaptersRead()+" ИЗ 8");
  for(const C of LORE_CHAP){
    const ch=loreChapter(C.id);
    loreRow(box,"chap"+(ch.read?" read":""),"",
      C.ru.toUpperCase()+" · "+ch.have+" из "+ch.total+(ch.read?" · СЛОЖИЛАСЬ":""));
    if(ch.read)loreRow(box,"note","",C.note);
    const all=LORE_BY_CHAP[C.id]||[];
    all.forEach((R,i)=>{
      const has=loreHas(R.id);
      /* номер — порядковый внутри главы, а не id: игрок читает главу, а не базу */
      loreRow(box,has?"":"gap",String(i+1),
        has?(R.ru+(R.word?" · «"+R.word+"»":"")):"· · · · · · · · · ·");
    });
  }
  /* словарь: тридцать слов пиджина. Здесь он лежит целиком и в одном месте —
     до доски его приходилось помнить по всплывающим строкам. */
  const V=loreVocab();
  loreRow(box,"chap","","СЛОВАРЬ · "+V.length+" ИЗ 30");
  loreRow(box,"vocab"+(V.length?"":" gap"),"",V.length?V.join(", "):"ни одного слова");
  /* адреса: то, ради чего кусок вообще брали. Метки уже нарисованы на карте
     (`drawLoreMarks`), здесь они списком — чтобы было видно, сколько мест
     зарубки успели назвать, и не одно ли и то же место названо дважды. */
  /* трепло (12x, M116): то, что оно помнит, читается там же, где отчёт, — это
     показания, а не отдельный экран. Непонятое стоит глифами и ждёт слова. */
  if(typeof parrotHas==="function"&&parrotHas()){
    const L=heardAll();
    loreRow(box,"chap","","ТРЕПЛО «"+G.parrot.name+"» · ИЗ ВЕЩЕЙ "+G.parrot.who.toUpperCase()+
      " · ПОМНИТ "+L.length);
    if(!L.length)loreRow(box,"gap","","пока молчит");
    for(const h of L.slice().reverse()){
      if(h.kind==="price")
        loreRow(box,h.used?"":"vocab","","цены "+(h.note||"станции")+" · сектор "+h.sx+":"+h.sy+
          (h.used?" · уже повторило":" · повторит, где спросят"));
      else if(h.kind==="yours")
        loreRow(box,h.used?"":"gap","","ваше: "+h.note+(h.used?" · уже ляпнуло":""));
      else if(h.kind==="story")   /* подслушанное (11c): птица повторяет чужую строку как свою */
        loreRow(box,"vocab","","услышало: «"+h.note+"» · сектор "+h.sx+":"+h.sy);
      else
        loreRow(box,h.read?"vocab":"gap","",heardWordsRu(h).join(" ")+
          (h.read?" · сектор "+h.sx+":"+h.sy:" · пока непонятно"));
    }
  }
  const M=loreMarks();
  loreRow(box,"chap","","АДРЕСА · "+M.length);
  if(!M.length)loreRow(box,"gap","","ни одного");
  else for(const m of M){
    const R=LORE_BY_ID[m.id];
    loreRow(box,"","","сектор "+m.sx+":"+m.sy+(R?" · "+R.chapRu:""));
  }
}
function toggleLoreBoard(open){
  loreWinOpen=open===undefined?!loreWinOpen:open;
  document.getElementById("lorewin").classList.toggle("open",loreWinOpen);
  if(loreWinOpen)renderLoreBoard();
}
document.getElementById("lorebtn").addEventListener("click",()=>toggleLoreBoard(true));
document.getElementById("loreclose").addEventListener("click",()=>toggleLoreBoard(false));
