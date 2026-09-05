/* ══════════════ кнопка, до которой не доходит палец (M354) ══════════════
   Все наборы, которые «жмут кнопки», зовут `el.click()` — а это не тычок.
   `click()` бьёт по узлу напрямую, минуя попадание: кнопка, накрытая
   прозрачной панелью, невидимой подсказкой или чужим экраном, отзовётся на
   `click()` как ни в чём не бывало, а игрок будет жать по ней пальцем и
   ничего не добьётся. Ровно этот класс дефекта («призрачный тычок») уже
   ловили руками в M315 — и ловили именно руками, потому что набора не было.

   Здесь спрашивают браузер, а не DOM: у каждой видимой кнопки берётся центр,
   и `elementFromPoint` обязан вернуть её саму или её потроха. Если он
   возвращает чужой узел — кнопка накрыта, и это баг раскладки, а не вкуса.

   Меряется в каждой сцене (пульты, борт, меню) и на каждом экране (стол,
   станция), то есть там, где игрок и жмёт. */

/* видима и крупнее ногтя. Ни окно, ни прокрутку тут не учитываем: длинный
   список на станции почти весь стоит ниже кромки, а игрок до него доматывает —
   в вид его приводит уже сама проверка. */
function hitCandidates(root,cap){
  const box=(typeof root==="string")?document.querySelector(root):root;
  if(!box)return [];
  const out=[];
  /* «нажимается» здесь то же, что у сквозного набора: кнопка или узел с
     собственным onclick. Селектор по классам («.item», «[data-k]») ловил на
     столе три строки из трёхсот — доски собраны из своих див, и обработчик
     на них ставится свойством, а не атрибутом. */
  for(const el of box.querySelectorAll("*")){
    if(el.tagName==="BUTTON"?el.disabled:!el.onclick)continue;
    const cs=getComputedStyle(el);
    if(cs.display==="none"||cs.visibility==="hidden"||+cs.opacity<.05||cs.pointerEvents==="none")continue;
    const r=el.getBoundingClientRect();
    if(r.width<8||r.height<8)continue;
    out.push({el,nm:(el.dataset&&el.dataset.k?"["+el.dataset.k+"]":"")+
      String(el.textContent||"").replace(/\s+/g," ").trim().slice(0,18)});
    if(out.length>=(cap||40))break;
  }
  return out;
}
/* кого браузер отдаст по центру кнопки: она сама, её потроха — или чужой узел.
   Перед вопросом строку доматывают в вид, как это делает палец. */
function hitCovered(list,where,bad){
  let asked=0;
  for(const c of list){
    try{ c.el.scrollIntoView({block:"center",inline:"center"}); }catch(e){ }
    const r=c.el.getBoundingClientRect();
    const cx=r.x+r.width/2,cy=r.y+r.height/2;
    if(r.width<8||r.height<8)continue;
    if(cx<1||cy<1||cx>innerWidth-1||cy>innerHeight-1)continue;   /* не доматывается — не в счёт */
    asked++;
    const at=document.elementFromPoint(cx,cy);
    if(!at){bad.push(where+" · "+c.nm+": в точке пусто");continue;}
    if(at===c.el||c.el.contains(at))continue;
    /* попадание в родителя — это тоже попадание: обработчик у него */
    if(at.contains(c.el))continue;
    /* адрес накрывателя обязателен: «накрыта B» — это ребус. Пишем цепочку
       из трёх узлов и его прямоугольник, чтобы правку можно было начать
       с CSS, а не с расследования. */
    const addr=e=>(e.id?"#"+e.id:"")+(e.className&&typeof e.className==="string"?"."+e.className.trim().split(/\s+/).join("."):"")||e.tagName;
    let p2=at,chain=[];
    for(let i=0;i<3&&p2&&p2!==document.body;i++){chain.push(addr(p2));p2=p2.parentElement;}
    const ra=at.getBoundingClientRect();
    bad.push(where+" · "+c.nm+" накрыта "+chain.join("←")+
      "["+Math.round(ra.x)+","+Math.round(ra.y)+" "+Math.round(ra.width)+"×"+Math.round(ra.height)+"]"+
      " · сама["+Math.round(r.x)+","+Math.round(r.y)+" "+Math.round(r.width)+"×"+Math.round(r.height)+"]");
  }
  return asked;
}

TEST_SUITES.push(() => suite("накрытые кнопки: в каждой сцене пульт и борт получают свой тычок", () => {
  const bad=[],seen=[];
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  for(const sc of lookScenes()){
    let set=true;
    try{ resetWorld(); set=sc.set()!==false; }catch(e){ continue; }
    if(!set||G.mode==="none")continue;
    G.prompt="ДЕЙСТВИЕ — СТЫКОВКА · ВЕРФЬ";
    try{ hud(); hud(); }catch(e){ bad.push(sc.id+" · hud: "+e.message); continue; }
    const list=[...hitCandidates(".pads",8),...hitCandidates(".rail",12),...hitCandidates("#menu",14)];
    seen.push(sc.id+":"+hitCovered(list,sc.id,bad));
  }
  G.prompt="";resetWorld();hud();
  ok(seen.length>=10,"сцен промерено: "+seen.length);
  eq(bad.slice(0,5).join(" ;; "),"","ни одна кнопка не накрыта чужим узлом"+
    (bad.length?" (всего "+bad.length+")":""));
}));

TEST_SUITES.push(() => suite("накрытые кнопки: на столе и на станции тычок доходит до строки", () => {
  resetWorld();
  if(typeof e2eLate==="function")e2eLate();else fuzzRich();
  const bad=[];let n=0;
  /* Экран открывается ИГРОЙ, а не рукой: `tableToggle`/`openStation` ставят
     ещё и классы тела (`table`, `screen`), а от них зависит вся раскладка.
     Первая версия вешала класс «open» сама — и в общем прогоне мерила ноль
     строк, потому что предыдущий набор оставил на теле `road`, при котором
     стол не показывается вовсе. Ноль промеренных строк теперь тоже провал. */
  const sweep=(tabsSel,bodySel,setTab,ru)=>{
    for(const b of [...document.querySelectorAll(tabsSel)]){
      const t=b.dataset.tab;
      try{ setTab(t); }catch(e){ continue; }
      n+=hitCovered(hitCandidates(bodySel,30),ru+"/"+t,bad);
      n+=hitCovered(hitCandidates(tabsSel.replace(" button",""),16),ru+"/закладки",bad);
    }
  };
  if(typeof tableToggle==="function"){
    tableToggle(true);
    sweep("#tableTabs button","#tableBody",t=>{tableSetTab(t);},"стол");
    tableToggle(false);
  }
  if(G.sys.station&&typeof openStation==="function"){
    G.st=G.sys.station;G.mode="dock";
    openStation();
    sweep("#stTabs button","#stBody",t=>{tab=t;renderTab();},"станция");
    if(typeof closeStation==="function")closeStation();
    tab="market";G.mode="system";G.st=null;
  }
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  document.body.classList.remove("table","screen");
  if(!n){
    const w=document.querySelector("#tablewin"),b=document.getElementById("tableBody");
    const r=w?w.getBoundingClientRect():null,rb=b?b.getBoundingClientRect():null;
    bad.push("нечего мерить · тело "+document.body.className+
      " · экранов открыто "+document.querySelectorAll(".scr.open").length+
      " · окно "+(w?getComputedStyle(w).display+" "+Math.round(r.width)+"×"+Math.round(r.height):"нет")+
      " · доска "+(b?getComputedStyle(b).display+" "+Math.round(rb.width)+"×"+Math.round(rb.height):"нет"));
  }
  ok(n>60,"строк и кнопок промерено: "+n);
  eq(bad.slice(0,5).join(" ;; "),"","на экранах тычок доходит до того, во что целятся"+
    (bad.length?" (всего "+bad.length+")":""));
  resetWorld();
}));
