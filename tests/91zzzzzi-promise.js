/* ══════════════ обещание кнопки (M355) ══════════════
   Автор (05.09.2026): «тесты на логику, каких никогда не делали: действие и
   ожидаемое поведение — верное или нет; не «экран открылся», а зачем этот
   экран, что на нём можно и ради чего».

   Все наборы до сих пор спрашивали, РАБОТАЕТ ли кнопка: не падает, не уводит
   в минус, не накрыта. Ни один не спрашивал, ДЕЛАЕТ ЛИ ОНА ТО, ЧТО НАПИСАНО.
   А это и есть договор игры с игроком: надпись — обещание, тычок — исполнение.
   Кнопка «ПРОДАТЬ», после которой в кассе не прибыло; «ЗАПРАВИТЬ», после
   которой бак тот же; «6 400 кр», списавшая другое число, — всё это не падает
   и не краснеет нигде, а игрок ловит это первым и перестаёт верить экрану.

   Три договора, и каждый проверяется на всех экранах сразу:
   1. глагол исполняется: продажа кладёт в кассу, покупка берёт из неё,
      заправка поднимает бак, ремонт — корпус, найм добавляет человека;
   2. цена на кнопке — та, что списали: «· 6 400 кр» значит ровно 6 400;
   3. у отказа есть голос: тычок, который не сделал НИЧЕГО — ни в мире, ни на
      экране, ни словом, — это молчаливый отказ, а таких в игре быть не должно.

   Отказ вслух — законный исход всюду: не хватило денег, места, ранга. Он
   отличим от нарушения тем, что игре есть что сказать. */

/* мерка мира: всё, чем кнопка может расплатиться или наградить */
function prState(){
  let cargo=0;for(const k of RES_KEYS)cargo+=G.cargo[k]|0;
  const W=(typeof wanderStore==="function")?wanderStore():null;
  return {cr:G.credits|0,matches:G.matches|0,fuel:+G.fuel,hull:+G.hull,data:G.data|0,
    crew:(G.crew||[]).length,inv:(G.inv||[]).length,cargo,
    mods:Object.values(G.mods).reduce((a,b)=>a+b,0),
    tech:G.tech?G.tech.size:0,drones:(G.drones||[]).length,
    tools:W?((W.shelf||[]).length+(W.hold||[]).length):0,
    log:(G.log||[]).length,mode:G.mode,t:G.t};
}
function prDelta(a,b){
  const d={};for(const k in a)if(typeof a[k]==="number")d[k]=b[k]-a[k];
  d.mode=(a.mode!==b.mode);
  return d;
}
/* что обещает надпись. Проверяем НАПРАВЛЕНИЕ, а не величину: величина — дело
   второго набора. Список нарочно короткий: только те глаголы, у которых
   обещание однозначно и не зависит от того, чем именно платят. */
const PR_VERBS=[
  {re:/^(ПРОДАТЬ|СДАТЬ В ЛОМ|СБЫТЬ|СДАТЬ ·)/,ru:"продажа",
   ok:d=>d.cr>0||d.matches>0||d.cargo<0||d.inv<0,
   why:"после продажи должно прибыть в кассе или убыть из трюма"},
  {re:/^(ЗАПРАВ)/,ru:"заправка",ok:d=>d.fuel>.01,why:"после заправки бак должен вырасти"},
  {re:/^(ПОЧИНИ|РЕМОНТ|ЛАТАТЬ)/,ru:"ремонт",ok:d=>d.hull>.01,why:"после ремонта корпус должен вырасти"},
  {re:/^(НАНЯТЬ)/,ru:"найм",ok:d=>d.crew>0,why:"после найма человек должен появиться"},
  {re:/^(КУПИТЬ|ОПЛАТИТЬ|ВЫКУПИТЬ|ВЗЯТЬ ×)/,ru:"покупка",
   ok:d=>d.cr<0||d.matches<0||d.inv>0||d.cargo>0||d.mods>0||d.tools>0||d.tech>0||d.drones>0,
   why:"покупка должна чего-то стоить или что-то давать"}
];
/* ── «игра что-то сказала» считается по вызовам, а не по тексту ──
   Сравнение G.msg с прежним врёт дважды: одинаковый отказ подряд оставляет
   строку прежней (и тычок выглядит немым, хотя игра ответила), а строка,
   поставленная кем-то ещё в том же кадре, выглядит ответом. Считаем сами
   вызовы `say`/`tell`/`logAdd` — это и есть голос игры. */
let PR_SAID=0;
(function(){
  for(const nm of ["say","tell","logAdd"]){
    const f=window[nm];
    if(typeof f!=="function")continue;
    window[nm]=function(){PR_SAID++;return f.apply(this,arguments);};
  }
})();
function prSpoke(fn){const n=PR_SAID;fn();return PR_SAID>n;}

/* видимые кнопки экрана вместе с их надписью */
function prButtons(sel,cap,onlyBtn){
  const box=document.querySelector(sel);if(!box)return [];
  const out=[];
  for(const el of box.querySelectorAll("*")){
    if(el.tagName==="BUTTON"?el.disabled:(onlyBtn||!el.onclick))continue;
    const cs=getComputedStyle(el);
    if(cs.display==="none"||cs.visibility==="hidden"||cs.pointerEvents==="none")continue;
    const r=el.getBoundingClientRect();if(r.width<8||r.height<8)continue;
    const lbl=String(el.textContent||"").replace(/\s+/g," ").trim();
    if(!lbl)continue;
    out.push({el,lbl});
    if(out.length>=(cap||30))break;
  }
  return out;
}
/* обход всех экранов игры: стол и станция, открытые так, как их открывает игра.
   Восстановление после каждого тычка обязано быть НАСТОЙЧИВЫМ: тычок умеет
   открыть поверх другой экран или закрыть станцию совсем, а спрятанный ящик
   не отдаёт ни одной кнопки — первая версия обхода так теряла три четверти
   экранов и честно докладывала «проверено 7». */
function prRestore(kind,t){
  document.querySelectorAll(".scr.open").forEach(e=>{
    if(e.id!=="station"&&e.id!=="tablewin")e.classList.remove("open");
  });
  if(kind==="станция"){
    const st=document.getElementById("station");
    if(!st||!st.classList.contains("open")){
      G.st=G.sys.station;G.mode="dock";
      try{ openStation(); }catch(e){ }
    }
    try{ tab=t;renderTab(); }catch(e){ }
  }else{
    if(typeof tableOpenNow!=="undefined"&&!tableOpenNow)try{tableToggle(true);}catch(e){}
    try{ tableSetTab(t); }catch(e){ }
  }
}
/* ── ходок по кнопкам одного экрана ──
   Список кнопок нельзя брать один раз: после первого же тычка экран
   перерисовывается, и все остальные узлы из списка становятся ОТОРВАННЫМИ.
   Нажатие по оторванному узлу мир, может быть, и двинет, но на экране не
   отразится ничем — и проверка «тычок оставил след» начинала врать (чип «?»
   переключал заметку в мёртвой копии доски). Поэтому экран перечитывается
   перед каждым тычком, а кнопка берётся по номеру — как её видит игрок. */
function prWalk(body,redraw,cap,onlyBtn,fn){
  redraw();
  const n=prButtons(body,cap,onlyBtn).length;
  for(let i=0;i<n;i++){
    redraw();
    const b=prButtons(body,cap,onlyBtn)[i];
    if(!b)break;
    fn(b);
  }
  redraw();
}
function prSweep(each){
  if(typeof tableToggle==="function"){
    tableToggle(true);
    for(const b of [...document.querySelectorAll("#tableTabs button")]){
      const t=b.dataset.tab;
      prRestore("стол",t);
      each("стол/"+t,"#tableBody",()=>prRestore("стол",t));
    }
    if(typeof tableOpenNow!=="undefined"&&tableOpenNow)tableToggle(false);
  }
  if(G.sys.station&&typeof openStation==="function"){
    G.st=G.sys.station;G.mode="dock";
    try{ openStation(); }catch(e){ }
    for(const b of [...document.querySelectorAll("#stTabs button")]){
      const t=b.dataset.tab;
      prRestore("станция",t);
      each("станция/"+t,"#stBody",()=>prRestore("станция",t));
    }
    if(typeof closeStation==="function")try{closeStation();}catch(e){}
    tab="market";G.mode="system";G.st=null;
  }
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  document.body.classList.remove("table","screen");
}

TEST_SUITES.push(() => suite("обещание: кнопка делает то, что написано на ней", () => {
  resetWorld();
  if(typeof e2eLate==="function")e2eLate();else fuzzRich();
  G.credits=900000;G.matches=400;G.fuel=10;G.hull=40;G.data=9000;
  for(const k of RES_KEYS)G.cargo[k]=6;   /* есть что продать: иначе «ПРОДАТЬ» просто не рисуется */
  const bad=[],seen={};let tried=0,refused=0;
  prSweep((where,body,redraw)=>{
    prWalk(body,redraw,20,false,b=>{
      const V=PR_VERBS.find(v=>v.re.test(b.lbl));
      if(!V)return;
      /* корпус и бак держим низкими: иначе «ЗАПРАВИТЬ» законно ничего не делает */
      if(V.ru==="заправка")G.fuel=Math.min(G.fuel,10);
      if(V.ru==="ремонт")G.hull=Math.min(G.hull,40);
      const a=prState();
      let threw="";
      const spoke=prSpoke(()=>{try{ b.el.click(); }catch(e){ threw=e.message; }});
      if(threw){ bad.push(where+" · «"+b.lbl.slice(0,22)+"» бросила: "+threw); return; }
      const d=prDelta(a,prState());
      tried++;seen[V.ru]=(seen[V.ru]|0)+1;
      if(V.ok(d))return;
      if(spoke){ refused++; return; }   /* отказ вслух — законный исход */
      bad.push(where+" · «"+b.lbl.slice(0,26)+"» ("+V.ru+"): "+V.why+", а мир не двинулся и никто ничего не сказал");
    });
  });
  resetWorld();
  ok(tried>=8,"кнопок с обещанием проверено: "+tried+" ("+Object.keys(seen).map(k=>k+" "+seen[k]).join(", ")+"), из них отказов вслух: "+refused);
  eq(bad.slice(0,5).join(" ;; "),"","каждая кнопка исполняет свой глагол или объясняет отказ"+
    (bad.length?" (всего "+bad.length+")":""));
}));

TEST_SUITES.push(() => suite("обещание: цена на кнопке — та, что списали", () => {
  /* Половина покупок в игре подписана одной ценой и ничем больше: на верфи и
     в оснастке кнопка называется «6 016 кр», в лаборатории — «30 дан», у
     наёмника — «НАНЯТЬ · 2 534 кр». Это самое прямое обещание, какое умеет
     дать интерфейс, и до сих пор никто не сверял его с тем, что списывают.
     Кошелёк набит нарочно: отказ по бедности здесь не проверяется. */
  resetWorld();
  if(typeof e2eLate==="function")e2eLate();else fuzzRich();
  G.credits=2000000;G.data=90000;
  for(const k of RES_KEYS)G.cargo[k]=40;
  const bad=[];let checked=0,spokeN=0;
  const PRICE=/(\d[\d   ]{0,9})\s*(кр|дан)(?![\/\wа-яё])/i;
  prSweep((where,body,redraw)=>{
    prWalk(body,redraw,30,true,b=>{
      /* вилки цен, ставки и остатки обещанием разовой цены не являются; и
         спрашиваем только настоящие КНОПКИ — цена в тексте карточки человека
         («… · уровень 2 · 2 534 кр») это описание, а платит за него кнопка
         «НАНЯТЬ», которая рядом и подписана той же цифрой */
      if(/…|\.\.\.|кр\/|дан\/|из|за|осталось/i.test(b.lbl))return;
      const m=PRICE.exec(b.lbl);
      if(!m)return;
      const want=+String(m[1]).replace(/[   ]/g,"");
      if(!(want>0))return;
      const kind=m[2].toLowerCase();
      const c0=G.credits,d0=G.data;
      const spoke=prSpoke(()=>{try{ b.el.click(); }catch(e){ }});
      const paid=(kind==="кр")?(c0-G.credits):(d0-G.data);
      checked++;
      if(paid===0&&spoke){ spokeN++; return; }        /* отказ вслух */
      if(paid!==want)bad.push(where+" · «"+b.lbl.slice(0,30)+"»: обещано "+want+" "+kind+", списано "+paid);
    });
  });
  resetWorld();
  ok(checked>=10,"кнопок с ценой проверено: "+checked+", из них отказов вслух: "+spokeN);
  eq(bad.slice(0,5).join(" ;; "),"","списывается ровно то, что написано на кнопке"+
    (bad.length?" (всего "+bad.length+")":""));
}));

TEST_SUITES.push(() => suite("обещание: у отказа есть голос — молчаливых тычков нет", () => {
  /* Нищий жмёт всё подряд. Каждый тычок обязан оставить след: мир двинулся,
     экран перерисовался или игра что-то сказала. Тычок без следа — это
     «нажал и ничего», самый обидный ответ интерфейса и единственный, который
     никакой набор до сих пор не замечал. */
  resetWorld();
  if(typeof e2eLate==="function")e2eLate();else fuzzRich();
  G.credits=0;G.matches=0;
  for(const k of RES_KEYS)G.cargo[k]=0;
  const bad=[];let tried=0,quiet=0;
  prSweep((where,body,redraw)=>{
    const box=document.querySelector(body);
    prWalk(body,redraw,16,false,b=>{
      const a=prState();
      const dom0=box?box.innerHTML:"",scr0=document.querySelectorAll(".scr.open").length;
      const spoke=prSpoke(()=>{try{ b.el.click(); }catch(e){ }});
      tried++;
      const d=prDelta(a,prState());
      const moved=Object.keys(d).some(k=>k!=="mode"&&d[k])||d.mode;
      const drew=(box&&box.innerHTML!==dom0)||document.querySelectorAll(".scr.open").length!==scr0;
      if(!moved&&!spoke&&!drew){ quiet++; bad.push(where+" · «"+b.lbl.slice(0,26)+"» — тычок без следа"); }
    });
  });
  resetWorld();
  ok(tried>40,"тычков у нищего проверено: "+tried);
  eq(bad.slice(0,6).join(" ;; "),"","каждый тычок оставляет след: мир, экран или слово"+
    (quiet?" (молчаливых "+quiet+")":""));
}));
