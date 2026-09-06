/* ══════════════ бортовой журнал ══════════════
   M151a: журнал — не окно, а тетрадь на столе (27i-ui-table) с тремя
   закладками. Здесь только запись и маршрутизация: какой голос — на какую
   страницу. Правило: у каждого голоса своё место.
     ЭФИР  — всё, что было услышано: приёмник, диспетчер, слухи, звонки;
     ЛЮДИ  — всё, что сказал человек: стойка, стол, истории, письма, записки;
     БОРТ  — техника и деньги: tech, money, warn, kill, good, dim.
   Сообщение по центру (`say`) — только подсказка и авария; реплика человека
   идёт через `peopleLine`, услышанное — через `etherLine`, и стекло лишь
   показывает их мельком, а владеет ими тетрадь. */
const LOG_MAX=160;
const LOG_PAGE={ether:"ether",talk:"folk",bad:"bort",dim:"bort",good:"bort",kill:"bort",money:"bort",tech:"bort",warn:"bort"};
function logPageOf(kind){return LOG_PAGE[kind]||"bort";}
let logOpen=false;   /* совместимость: «журнал открыт» = стол открыт на тетради */
function logAdd(kind,text){
  if(typeof quietMute==="function"&&quietMute())return;   /* тихий уезд (11n): журнал не пишет */
  G.log.push({t:Date.now(),k:kind,s:text});
  if(G.log.length>LOG_MAX)G.log.splice(0,G.log.length-LOG_MAX);
  const open=typeof tableIsOpen==="function"&&tableIsOpen();
  if(open&&typeof tableRender==="function")tableRender();
  /* огонёк и счётчики закладок считают новости, а не всё подряд: серые строки
     (стыковка, сближение, маяк) и эфир — не новость. Эфир и есть уведомление,
     он идёт на приёмник живьём; тетрадь его только помнит. Иначе стол горел
     всегда и огонёк переставал быть сигналом (плейтест 02.09) */
  else if(kind!=="dim"&&kind!=="ether"){
    G.logNew=(G.logNew|0)+1;
    const p=logPageOf(kind);
    G.logNewBy=G.logNewBy||{};G.logNewBy[p]=(G.logNewBy[p]|0)+1;
    logBtnLabel();
  }
}
/* услышанное: приёмник на пульте показывает строку, тетрадь её помнит */
function etherLine(text,who){
  if(!text)return;
  const s=who?who+": "+text:text;
  logAdd("ether",s);
  if(typeof consoleHeard==="function")consoleHeard(text,who);
}
/* сказанное человеком: в ЛЮДИ всегда, на стекло — если попросили */
function peopleLine(text,who,flash){
  if(!text)return;
  const s=who?who+" — "+text:text;
  logAdd("talk",s);
  if(flash)say(who?who+"\n"+text:text,flash===true?150:flash);
}
/* сказать и записать одним движением */
const TELL_SFX={money:{f:660,to:990,d:.13,v:.3},tech:{f:520,to:1180,d:.2,v:.3},
                kill:{f:880,to:520,d:.12,v:.26},warn:{f:300,to:190,d:.2,v:.3}};
function tell(kind,short,full){
  const s=TELL_SFX[kind];
  if(s)sfx("ui",s);
  say(full||short);logAdd(kind,short);
}
function logTime(ms){
  const d=new Date(ms);
  return ("0"+d.getHours()).slice(-2)+":"+("0"+d.getMinutes()).slice(-2);
}
/* Счётчик непрочитанного — значок внутри пункта меню СТОЛ, а не переписанная
   подпись: у пункта есть ещё и вторая строка, и затирать её нельзя. */
function logBtnLabel(){
  const b=document.getElementById("tablebtn");if(!b)return;
  const em=b.querySelector("em")||b;
  em.textContent="СТОЛ";
  const n=(G.logNew|0)+(typeof tableNewThings==="function"?tableNewThings():0);
  if(n){
    const i=document.createElement("i");
    i.textContent=n>99?"99+":n;
    em.appendChild(i);
  }
  /* точка на кнопке МЕНЮ: ящик закрыт, а на столе что-то новое */
  const mb=document.getElementById("menubtn");
  if(mb)mb.classList.toggle("on",!!n);
  /* та же фишка на СТОЛе в шапке станции */
  const sd=document.getElementById("stDesk");
  if(sd){const e=sd.querySelector("em")||sd;e.textContent="СТОЛ";
    if(n){const i=document.createElement("i");i.textContent=n>99?"99+":n;e.appendChild(i);}}
}
/* страница тетради: строки выбранной закладки, новые — сверху */
function renderLog(page){
  const box=document.getElementById("loglist");if(!box)return;
  box.textContent="";
  page=page||"ether";
  const rows=G.log.filter(it=>logPageOf(it.k)===page);
  if(!rows.length){
    const e=document.createElement("div");e.className="li dim";
    const s=document.createElement("span");
    s.textContent=page==="ether"?"эфир пуст: крутите ручку приёмника на пульте":
                  page==="folk"?"никто ещё ничего не сказал":"пока пусто";
    e.appendChild(s);box.appendChild(e);return;
  }
  for(let i=rows.length-1;i>=0;i--){
    const it=rows[i];
    const row=document.createElement("div");row.className="li "+(it.k||"");
    const em=document.createElement("em");em.textContent=logTime(it.t);
    const sp=document.createElement("span");
    if(typeof glyphHasRunes==="function"&&glyphHasRunes(it.s))sp.appendChild(glyphNodes(it.s));
    else sp.textContent=it.s;
    row.appendChild(em);row.appendChild(sp);box.appendChild(row);
  }
}
/* дела: «что я должен» — своя закладка, по строке можно ткнуть: курс на карту */
function renderDeeds(){
  const box=document.getElementById("loglist");if(!box)return;
  box.textContent="";
  if(typeof coopBlock==="function")coopBlock(box);   /* кооператив — первым блоком (12aj, M351) */
  if(typeof questSync!=="function"){return;}
  questSync();
  const open=questOpen();
  if(!open.length){
    const e=document.createElement("div");e.className="li dim";
    const s=document.createElement("span");s.textContent="дел нет";
    e.appendChild(s);box.appendChild(e);return;
  }
  const head=document.createElement("div");head.className="li head";
  const hs=document.createElement("span");hs.textContent="ДЕЛА · "+open.length+" · ТКНИТЕ ПО СТРОКЕ — КУРС НА КАРТЕ";
  head.appendChild(hs);box.appendChild(head);
  for(const q of open){
    const row=document.createElement("div");
    row.className="li quest"+(q.sx!==null?" go":"");
    const em=document.createElement("em");
    em.textContent=q.sx!==null?(q.sx+":"+q.sy):"—";
    const sp=document.createElement("span");
    const left=questLeft(q);
    sp.innerHTML="<b>"+q.ru+"</b>"+(q.from?" <i>· "+q.from+"</i>":"")+
      (left?" <b style='color:#f2b25c'>· "+left+"</b>":"")+
      (q.note?"<br><i>"+q.note+"</i>":"")+
      (q.reward?"<br><i style='color:#8fd08a'>награда: "+q.reward+"</i>":"");
    row.appendChild(em);row.appendChild(sp);
    if(q.sx!==null){row.style.cursor="pointer";row.onclick=()=>{questGoto(q);};}
    box.appendChild(row);
  }
}
/* совместимость со старыми вызовами: toggleLog(false) закрывало журнал перед
   экраном — теперь закрывает стол; toggleLog() открывает стол на тетради */
function toggleLog(open){
  if(typeof tableToggle!=="function")return;
  if(open===false){tableToggle(false);return;}
  tableToggle(open===undefined?undefined:true);
}
function modCost(k,lvl){return Math.round(MODS[k].base*Math.pow(lvl+1,1.55));}
function addRes(k,n){
  /* истощение (M384, §15.1): в поясах этой державы руды нет вовсе, и это
     событие, а не цифра — поэтому ноль, а не «меньше» */
  if(typeof natOreMul==="function")n=n*natOreMul(k);
  const cap=stat().cargoMax,free=cap-held();
  const t=Math.min(n,free);if(t>0)G.cargo[k]+=t;return t;
}
/* штучная добыча: дробный бонус обогащения копится, чтобы +18% не съедалось округлением */
let refineBank=0;
function minedUnit(k){
  sfx("drill");
  refineBank+=stat().refine;
  const n=Math.floor(refineBank);refineBank-=n;
  if(n>0&&typeof placeNote==="function")placeNote("take",n);   // место помнит, что вырыли (11d)
  return addRes(k,n);
}
