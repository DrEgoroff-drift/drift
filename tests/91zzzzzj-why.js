/* ══════════════ зачем оно всё (M355) ══════════════
   Продолжение «обещания кнопки», но на уровень выше: не «сработала ли
   кнопка», а ЧЕСТНА ЛИ ВЕЩЬ, ради которой игрок к ней пришёл.

   1. Приборы не врут. Полоса и цифра в углу — единственное, по чему игрок
      судит о баке, корпусе и трюме. Прибор, показывающий не то, что в мире,
      хуже сломанного: сломанный виден.
   2. Модуль платит обещанным. «Топливные баки — запас топлива» обязаны
      поднимать запас топлива. Уровень, который ничего не меняет в `stat()`, —
      это купленный воздух.
   3. Технология — не подпись без кода. То же правило, что для перков
      управляющих («перк без кода — ложь»), применённое ко всей таблице TECH:
      каждый идентификатор обязан читаться игрой по имени, иначе игрок платит
      данными за строку в списке.
   4. Подсказка обещает — ДЕЙСТВИЕ исполняет. Подсказка внизу экрана и есть
      ответ на «что тут можно и зачем»: если она говорит «ДЕЙСТВИЕ — …», то
      ДЕЙСТВИЕ обязано что-то сделать или объяснить отказ.
   5. Область даёт то, ради чего в неё идут: в черпаке трюм наполняется. */

/* исходник без пробелов — чтобы вхождение искалось простой строкой */
let WHY_TIGHT=null;
function whyTight(src){
  if(WHY_TIGHT===null)WHY_TIGHT=String(src||"").split(/\s+/).join("");
  return WHY_TIGHT;
}
/* след сцены: состояние того режима, в котором стоим. Без него «мир двинулся»
   меряется одними общими числами — а зимовка двигает СВОЙ день, и набор
   объявлял честную кнопку немой. */
function whyScene(){
  const k={surface:"surf",landing:"land",dig:"dig",cave:"cave",belt:"belt",scoop:"scoop",
    base:"base",raid:"raid",homein:"hin",winter:"win",spa:"spa",wanderer:"wan"}[G.mode];
  if(!k||!G[k])return "";
  try{ return JSON.stringify(G[k]).slice(0,4000); }catch(e){ return ""; }
}
/* показания приборов: то, что игрок читает глазами */
function whyDial(id){const e=document.getElementById(id);return e?String(e.textContent||"").trim():null;}
function whyBar(id){const e=document.querySelector("#"+id+" i");return e?e.style.width:null;}

TEST_SUITES.push(() => suite("приборы: цифра и полоса показывают мир, а не что-то своё", () => {
  resetWorld();
  const bad=[];
  const check=(ru)=>{
    hud();hud();
    const st=stat();
    const f=whyDial("fnum"),h=whyDial("hnum"),c=whyDial("cnum");
    const wantF=Math.round(G.fuel)+"/"+Math.round(st.fuelMax);
    const wantH=Math.round(G.hull)+"/"+Math.round(st.hullMax);
    const wantC=held()+"/"+st.cargoMax;
    if(f!==wantF)bad.push(ru+" · бак: прибор «"+f+"», мир «"+wantF+"»");
    if(h!==wantH)bad.push(ru+" · корпус: прибор «"+h+"», мир «"+wantH+"»");
    if(c!==wantC)bad.push(ru+" · трюм: прибор «"+c+"», мир «"+wantC+"»");
    /* полоса — та же правда, только длиной: пустой бак не рисуется полным */
    const fw=parseFloat(whyBar("fbar")||"-1"),want=clamp(G.fuel/st.fuelMax*100,0,100);
    if(!(Math.abs(fw-want)<1.2))bad.push(ru+" · полоса бака "+fw+"% против "+want.toFixed(1)+"%");
    /* кошелёк */
    /* в кошельке две величины — кредиты и данные; сверяем первую */
    const pm=/(\d[\d   ]*)/.exec(whyDial("purse")||"");
    const purse=pm?pm[1].replace(/[   ]/g,""):"";
    if(purse!==String(G.credits|0))bad.push(ru+" · кошелёк «"+purse+"» против "+G.credits);
  };
  G.fuel=37.6;G.hull=12.4;G.credits=123456;
  for(const k of RES_KEYS)G.cargo[k]=0;
  G.cargo[RES_KEYS[0]]=7;
  check("полёт");
  /* пустой бак и полный трюм — крайние показания, на них прибор и врёт чаще */
  G.fuel=0;G.hull=1;G.credits=0;
  G.cargo[RES_KEYS[0]]=stat().cargoMax;
  check("на нуле");
  /* и на грунте: там состав приборов другой, а правда та же */
  resetWorld();
  if(typeof landOnTestPlanet==="function"){
    landOnTestPlanet();
    G.fuel=11.2;G.hull=63.7;
    check("на грунте");
    /* скафандр показывается только там, где он течёт */
    hud();
    const vs=document.getElementById("vSuit");
    ok(vs&&getComputedStyle(vs).display!=="none","на грунте показан скафандр");
  }
  resetWorld();hud();
  const vs2=document.getElementById("vSuit");
  ok(!vs2||getComputedStyle(vs2).display==="none","в полёте скафандра на приборах нет: ему нечего показывать");
  eq(bad.slice(0,5).join(" ;; "),"","приборы показывают мир"+(bad.length?" (всего "+bad.length+")":""));
}));

TEST_SUITES.push(() => suite("модуль: каждый уровень платит тем, что обещает его строка", () => {
  /* Что именно обещано — написано в самой таблице MODS, и связь «модуль →
     число в stat()» здесь выписана руками ровно один раз. Если модуль
     перестанет что-то менять, набор скажет об этом по имени. */
  const PAY={engine:"thr",tank:"fuelMax",hold:"cargoMax",armor:"hullMax",
             drill:"drill",hyper:"jump",weapon:"dmg"};
  resetWorld();
  const bad=[];
  eq(Object.keys(PAY).sort().join(","),Object.keys(MODS).sort().join(","),
     "в списке платежей столько же модулей, сколько в таблице MODS");
  for(const k in MODS){
    const field=PAY[k];
    if(!field){bad.push(k+": никто не знает, чем он платит");continue;}
    resetWorld();
    for(const q in G.mods){G.mods[q]=0;G.modsOwned[q]=0;}
    const a=stat()[field];
    G.mods[k]=1;G.modsOwned[k]=1;
    const b=stat()[field];
    G.mods[k]=3;G.modsOwned[k]=3;
    const c=stat()[field];
    if(!(b>a))bad.push(MODS[k].ru+" («"+MODS[k].note+"»): первый уровень не поднял "+field+" ("+a+" → "+b+")");
    else if(!(c>b))bad.push(MODS[k].ru+": третий уровень не лучше первого ("+b+" → "+c+")");
  }
  resetWorld();
  eq(bad.slice(0,4).join(" ;; "),"","каждый модуль платит обещанным");
}));

TEST_SUITES.push(() => suite("наука: ни одной технологии, за которую платят зря", () => {
  /* Половина технологий меряется прямо — они меняют число в `stat()`.
     Остальные читаются кодом по имени (`G.tech.has("navi")`, `techLv("suit")`),
     и это единственный способ проверить, что за них не берут данные впустую:
     игра читает собственный исходник, как в наборе про имена (91zzzzy). */
  resetWorld();
  const src=(typeof nmSource==="function")?nmSource():"";
  ok(src.length>100000,"исходник игры доступен набору");
  const bad=[],mute=[],paid=[];
  const nums=()=>{const s=stat(),o={};for(const k in s)if(typeof s[k]==="number")o[k]=s[k];return o;};
  for(const id in TECH){
    resetWorld();
    const a=nums();
    G.tech.add(id);
    if(TECH[id].max)G.techLvl[id]=Math.max(1,TECH[id].max);
    const b=nums();
    let moved=false;
    for(const k in a)if(a[k]!==b[k])moved=true;
    if(moved){paid.push(id);continue;}
    /* не меняет чисел — значит обязана читаться по имени где-то в игре */
    if(src){
      /* Читается не только вызовом: «Лаборатория» стоит полем needTech:"lab"
         в модуле базы, и его проверяет techLv(M.needTech) — тот же честный
         читатель, просто через таблицу. Ищем по исходнику БЕЗ пробелов и
         простым вхождением: собранное регулярное выражение с экранированием
         здесь однажды приехало битым и молча падало на первой же технологии. */
      const tight=whyTight(src);
      const pats=['techLv("'+id+'")','techHas("'+id+'")','tech.has("'+id+'")',
                  '.has("'+id+'")','techLvl["'+id+'"]','needTech:"'+id+'"'];
      if(pats.some(s=>tight.indexOf(s)>=0)){mute.push(id);continue;}
      bad.push(id+" («"+TECH[id].ru+"»): не меняет ни одного числа и нигде не читается по имени");
    }
  }
  resetWorld();
  ok(paid.length>=6,"технологий, меняющих приборы: "+paid.length);
  ok(mute.length>=6,"технологий, читаемых по имени: "+mute.length);
  eq(bad.slice(0,4).join(" ;; "),"","за каждую технологию платят не зря");
}));

TEST_SUITES.push(() => suite("подсказка: если она обещает ДЕЙСТВИЕ, ДЕЙСТВИЕ что-то делает", () => {
  /* Подсказка внизу экрана — это и есть ответ на «что тут можно». Она пишется
     кадром под то, что сейчас под рукой: «ДЕЙСТВИЕ — СТЫКОВКА», «ДЕЙСТВИЕ —
     БУРЕНИЕ». Проверяем самое прямое: если обещание есть, нажатие обязано
     двинуть мир или объяснить отказ. Подсказка, которая обещает и молчит, —
     худший вид лжи в интерфейсе: игрок думает, что не понял управление. */
  const bad=[],saw=[];
  for(const sc of lookScenes()){
    resetWorld();
    let set=true;
    try{ set=sc.set()!==false; }catch(e){ continue; }
    if(!set||G.mode==="none")continue;
    /* даём сцене устояться: подсказку пишет апдейт, а не постановка */
    for(let i=0;i<8;i++){ actEdge=false; try{ stepWorld(1); }catch(e){ break; } G.t++; }
    const p=String(G.prompt||"");
    if(!/ДЕЙСТВ/.test(p))continue;
    saw.push(sc.id);
    const a=prState(),sig0=whyScene(),said0=(typeof PR_SAID==="number")?PR_SAID:0;
    /* «УДЕРЖИВАЙТЕ ДЕЙСТВИЕ» — это другое действие, и мерить его одним кадром
       нечестно: бурение и взлёт нарочно сделаны удержанием (M20). Держим
       столько, сколько просит подсказка, иначе — один кадр, как у игрока. */
    const hold=/УДЕРЖ/i.test(p)?90:1;
    keys.act=true;actEdge=true;
    let died="";
    for(let i=0;i<hold;i++){
      try{ stepWorld(1); }catch(e){ died=e.message; break; }
      G.t++;actEdge=false;
    }
    keys.act=false;actEdge=false;
    if(died){ bad.push(sc.id+" · ДЕЙСТВИЕ уронило кадр: "+died); continue; }
    const d=prDelta(a,prState());
    const moved=Object.keys(d).some(k=>k!=="mode"&&k!=="t"&&d[k])||d.mode||whyScene()!==sig0;
    const spoke=((typeof PR_SAID==="number")?PR_SAID:0)>said0;
    if(!moved&&!spoke)
      bad.push(sc.id+" · подсказка обещает «"+p.split("\n")[0].slice(0,34)+"», а ДЕЙСТВИЕ не сделало ничего");
  }
  resetWorld();
  ok(saw.length>=3,"сцен с обещанием в подсказке: "+saw.length+" ("+saw.join(", ")+")");
  eq(bad.slice(0,4).join(" ;; "),"","обещанное подсказкой исполняется");
}));

TEST_SUITES.push(() => suite("черпак: в него идут за газом — и газ там набирается", () => {
  /* Зачем область: черпак существует ради груза, который больше нигде не
     взять. Если в коридоре сбора трюм не растёт, вся сцена — красивый риск
     без награды. Ставим корабль в коридор и ждём. */
  resetWorld();
  const sys=(typeof e2eFind==="function")
    ? e2eFind(q=>(q.planets||[]).some(p=>p.type==="gas"))
    : null;
  if(!sys){ok(true,"газового гиганта поблизости нет — пропуск");return;}
  G.sx=sys.sx;G.sy=sys.sy;G.sys=sys;
  const p=sys.planets.find(q=>q.type==="gas");
  startScoop(p);
  ok(!!G.scoop,"черпак начался");
  if(!G.scoop)return;
  for(const k of RES_KEYS)G.cargo[k]=0;
  const before=held();
  /* держимся в коридоре сбора: игрок делает это рулём, набор — прямо */
  for(let i=0;i<240;i++){
    const b=scoopBand();               /* [верх, низ] — пара, а не объект */
    if(G.scoop){G.scoop.y=(b[0]+b[1])/2;G.scoop.vy=0;G.scoop.heat=0;}
    try{ updateScoop(1); }catch(e){ ok(false,"черпак упал на кадре "+i+": "+e.message); break; }
    G.t++;
    if(!G.scoop)break;
    if(held()>before)break;
  }
  ok(held()>before,"за две сотни кадров в коридоре трюм наполнился: "+before+" → "+held());
  ok(G.hull>0,"и корабль цел: корпус "+Math.round(G.hull));
  resetWorld();
}));
