/* ══════════════ автотесты: телефонный вид (M167) ══════════════ */
TEST_SUITES.push(()=>suite("телефон: опись одной лентой, кукла из вещей, тормоза на поверхности нет",()=>{
  resetWorld();
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  /* ОПИСЬ (M341) вместо экрана КОРАБЛЬ|СКАФАНДР: одна лента, люк — полосой снизу */
  ok(!document.getElementById("shipview"),"экрана корабля в разметке больше нет");
  tableToggle(true,"hold");
  const box=document.getElementById("loglist");
  ok(box.classList.contains("opis"),"опись открыта на сукне");
  ok(!!box.querySelector("canvas.doll"),"кукла на месте");
  ok(kitDollHit.length===6,"шесть зон нажатия");
  ok(kitDollHit.every(h=>h.w>=44&&h.h>=44),"каждая зона не меньше 44 px");
  if(innerWidth<=760){
    const order=[...box.children].filter(e=>e.classList.contains("op-z")).map(e=>+getComputedStyle(e).order).sort((a,b)=>a-b).join(",");
    eq(order,"1,2,3,4","лента: части, комплект, трюм, спички (или ящик у станции)");
    eq(getComputedStyle(box.querySelector(".op-hatch")).display,"none","люк не в ленте");
    ok(box.scrollWidth<=box.clientWidth+1,"лента не шире экрана ("+box.scrollWidth+"/"+box.clientWidth+")");
    const bar=document.getElementById("opisBar");
    ok(!!bar&&getComputedStyle(bar).display==="none","полоса люка спрятана, пока ничего не поднято");
  }else ok(true,"широкий экран — порядок ленты не меряем");
  tableToggle(false);
  /* палитра комплекта читается и семейства различимы */
  G.kit=null;
  const p1=kitPalette().torso.main;
  kitAll().torso=kitPiece("torso",1,0,1);kitAll().torso.model=2;
  ok(kitPalette().torso.main!==p1,"другое семейство — другой цвет куклы и ходока");
  G.kit=null;
  /* кнопка не исчезает — кнопка гаснет (M181): на поверхности тормоз погашен
     и не ловит нажатий, но стоит на месте — палец помнит раскладку */
  G.mode="surface";G.surf={p:{type:"terran",T:{atm:"есть"},name:"т"},suit:100,x:0,y:0,fauna:[],plants:[]};
  hud();
  const $brk=document.querySelector("[data-k=brake]");
  ok($brk.style.display!=="none","на поверхности тормоз ВИДЕН");
  ok($brk.classList.contains("off"),"но погашен");
  eq(getComputedStyle($brk).pointerEvents,"none","и не ловит нажатий");
  G.mode="system";G.surf=null;hud();
  ok(!$brk.classList.contains("off"),"в полёте живой");
  /* и ДЕЙСТВИЕ так же: без действия гаснет, место держит */
  const $act2=document.querySelector("[data-k=act]");
  G.prompt="";hud();
  ok($act2.style.display!=="none","ДЕЙСТВИЕ видно всегда");
  ok($act2.classList.contains("off"),"без действия — погашено");
  G.prompt="ДЕЙСТВИЕ — СТЫКОВКА";hud();
  ok(!$act2.classList.contains("off"),"с действием — живое");
  G.prompt="";hud();
  /* погашенная кнопка читается как выключенная вещь, а не как призрак */
  G.mode="surface";G.surf={p:{type:"terran",T:{atm:"есть"},name:"т"},suit:100,x:0,y:0,fauna:[],plants:[]};
  hud();
  ok(parseFloat(getComputedStyle($brk).opacity)>=.3,"погашенная — видна, не призрак");
  G.mode="system";G.surf=null;hud();
  /* ▲▼ — единственное исключение: пояс это смена контура (девять кнопок в ряд
     влезают только по 32 px, вдвое ниже правила «палец») */
  const $pup=document.querySelector("[data-k=pup]");
  document.body.classList.remove("inbelt");
  eq(getComputedStyle($pup).display,"none","▲ живёт только в поясе");
  document.body.classList.add("inbelt");
  eq(getComputedStyle($pup).display!=="none",true,"в поясе она есть");
  document.body.classList.remove("inbelt");
  /* ОГОНЬ: есть пушка — кнопка стоит всегда, вне боя погашена; нет пушки —
     места не занимает */
  const $f=document.getElementById("firebtn");
  G.mods.weapon=0;G.mode="system";hud();
  eq($f.style.display,"none","без оружия ОГНЯ нет вовсе");
  G.mods.weapon=1;G.mode="system";hud();
  /* M360: в системе огонь идёт по захвату, кнопки ОГОНЬ в ряду нет */
  eq($f.style.display,"none","с оружием в системе ОГОНЬ убран — стреляет захват");
  eq(document.getElementById("lockbtn").style.display!=="none",true,"а ЦЕЛЬ стоит");
  G.mode="belt";hud();
  eq($f.style.display!=="none",true,"в поясе ОГОНЬ виден");
  ok(!$f.classList.contains("off"),"и живой");
  G.mode="surface";G.surf={p:{type:"terran",T:{atm:"есть"},name:"т"},suit:100,x:0,y:0,fauna:[],plants:[]};
  hud();
  eq($f.style.display!=="none",true,"на поверхности НЕ пропадает");
  ok($f.classList.contains("off"),"а гаснет");
  G.mods.weapon=0;G.mode="system";G.surf=null;hud();
}));

/* Ряд не выпихивает кнопки за кромку: чем больше их в строю, тем они меньше,
   но никогда меньше 44 px — правило пальца сильнее желания показать всё. */
TEST_SUITES.push(()=>suite("телефон: ряд пэдов помещается в экран",()=>{
  resetWorld();
  if(innerWidth>760){TEST.lines.push("  · не телефон — набор только для test.ps1 -Mobile");return;}
  const check=nm=>{
    padsFit();
    const bs=[...document.querySelectorAll(".pads button")]
      .filter(b=>getComputedStyle(b).display!=="none");
    for(const b of bs){
      const r=b.getBoundingClientRect();
      ok(r.right<=innerWidth+1,nm+": «"+(b.textContent||b.dataset.k).slice(0,7)+"» не за кромкой");
      ok(r.left>=-1,nm+": и не за левой");
      ok(r.width>=43.5,nm+": не мельче 44 px");
    }
    /* группы не наезжают друг на друга */
    const gs=[...document.querySelector(".pads").children].map(d=>d.getBoundingClientRect());
    if(gs.length===2)ok(gs[0].right<=gs[1].left+1,nm+": группы не наехали");
  };
  /* и главное: кнопка не переезжает при смене режима — палец помнит место */
  const place=()=>{const o={};document.querySelectorAll(".pads button").forEach(b=>{
    if(getComputedStyle(b).display==="none")return;
    const r=b.getBoundingClientRect();o[b.dataset.k]=Math.round(r.x)+","+Math.round(r.y);});return o;};
  G.mods.weapon=1;G.mode="system";hud();padsFit();const pSys=place();
  G.mode="surface";G.surf={p:{type:"terran",T:{atm:"есть"},name:"т"},suit:100,x:0,y:0,fauna:[],plants:[]};
  hud();padsFit();const pSurf=place();
  /* в системе ряд другой (M360: стики и ЦЕЛЬ вместо ◀ ▶ ▲ ТОРМОЗ ОГОНЬ) —
     сравнивается то, что стоит в обоих рядах */
  ok(pSys.lock&&!pSys.left&&!pSys.thrust,"в системе ряд штурвала: ЦЕЛЬ есть, ◀ ▲ нет");
  ok(pSurf.left&&pSurf.thrust&&!pSurf.lock,"на поверхности — прежний ряд");
  G.mode="belt";hud();padsFit();const pBelt=place();
  for(const k of ["left","right","fire","brake","act","thrust"])
    eq(pBelt[k],pSurf[k],"«"+k+"» на том же месте и в поясе");
  G.surf=null;
  G.mods.weapon=0;G.mode="system";hud();check("без оружия");
  G.mods.weapon=1;G.mode="system";hud();check("с пушкой");
  G.mode="belt";hud();check("в поясе");
  G.mode="surface";G.surf={p:{type:"terran",T:{atm:"есть"},name:"т"},suit:100,x:0,y:0,fauna:[],plants:[]};
  hud();check("на поверхности");
  G.mods.weapon=0;G.mode="system";G.surf=null;hud();
}));

/* Пэды на телефоне не гаснут сами (автор, 25.08.2026): касание холста браузер
   дублирует совместимым mousemove, и весь ряд уходил в .14 — палец жмёт туда,
   где кнопок почти нет. */
TEST_SUITES.push(()=>suite("телефон: пэды не гаснут сами",()=>{
  resetWorld();
  const wasMob=document.body.classList.contains("mobile");
  const $p=document.querySelector(".pads");
  G.opts.pads="auto";applyPadMode();
  document.body.classList.add("mobile");
  dispatchEvent(new MouseEvent("mousemove",{bubbles:true}));
  ok(!$p.classList.contains("faded"),"на телефоне мышиный ход не гасит");
  padsFadeOut();
  ok(!$p.classList.contains("faded"),"и прямой вызов гашения тоже");
  document.body.classList.remove("mobile");
  padsFadeOut();
  ok($p.classList.contains("faded"),"на компьютере «авто» работает как прежде");
  padsFadeIn();
  ok(!$p.classList.contains("faded"),"и возвращается");
  /* «СКРЫТЬ» — осознанный выбор, он остаётся рабочим везде */
  G.opts.pads="hide";applyPadMode();
  ok($p.classList.contains("faded"),"«скрыть» из настроек работает");
  G.opts.pads="auto";applyPadMode();
  if(wasMob)document.body.classList.add("mobile");
}));

/* Низ телефона после релизного вида (A2) стал трёхэтажным: пульт, подсказка
   действия, строка состояния. Проверяем не «красиво», а что этажи не налезают
   друг на друга и не заходят под правый борт — на телефоне это стоило бы
   игроку кнопки, а не вида. Класс .mobile ставится по ширине окна, поэтому в
   узком окне проверка идёт по-настоящему, а в широком честно пропускается. */
TEST_SUITES.push(()=>suite("телефон: этажи внизу не налезают друг на друга",()=>{
  resetWorld();
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  G.mode="surface";
  G.surf={p:{type:"terran",T:{atm:"есть",ru:"землеподобная"},name:"т",seed:1},
          suit:100,x:0,y:0,shipX:0,fauna:[],plants:[]};
  G.prompt="ДЕЙСТВИЕ — СКАНИРОВАТЬ ОРГАНИЗМ";
  hud();
  if(!document.body.classList.contains("mobile")){
    ok(true,"окно не телефонное — проверку пропускаем");
  }else{
    const box=s=>{const e=document.querySelector(s);if(!e)return null;
      const r=e.getBoundingClientRect();return r.width?{s,x:r.x,y:r.y,w:r.width,h:r.height}:null;};
    /* ВЗЛЁТ — та же обязанность, что у остальных этажей (M234). Он появляется
       только у корабля, поэтому в проверке его показывают руками: на телефоне
       он висел ровно на пульте, поверх ФОТО, и улететь было нельзя. */
    const lb=document.getElementById("launchbtn");
    if(lb)lb.style.display="";
    const items=[".vitals",".locus","#prompt","#console",".rail","#launchbtn",
                 ".pads>div:first-child",".pads>div:last-child"].map(box).filter(Boolean);
    const hit=(a,b)=>!(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y);
    const clash=[];
    for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++)
      if(hit(items[i],items[j]))clash.push(items[i].s+"×"+items[j].s);
    eq(clash.join(", "),"","этажи не пересекаются");
    const out=items.filter(i=>i.x<-1||i.x+i.w>innerWidth+1);
    eq(out.map(i=>i.s).join(", "),"","и ничто не уехало за край");
  }
  const lb2=document.getElementById("launchbtn");if(lb2)lb2.style.display="none";
  G.prompt="";G.surf=null;G.mode="system";hud();
}));

/* ── M222: мерка мира обязана видеть обе стороны кадра ──
   M217 считал масштаб по одной высоте. У телефона высота как у монитора, а
   ширина втрое меньше: на 390×844 мир увеличивался в полтора раза, и в кадр
   переставала помещаться дорога — оставалось меньше трёхсот единиц мира в
   ширину. Проверка живёт в телефонном наборе, потому что только там это и
   видно (`test.ps1 -Mobile`). */
TEST_SUITES.push(()=>suite("телефон: мир не зажимают в щель",()=>{
  if(innerWidth>760){TEST.lines.push("  · не телефон — набор только для test.ps1 -Mobile");return;}
  resetWorld();
  const k=surfScale();
  ok(k>=1,"мерка не ужимает мир никогда");
  /* сколько мира видно в ширину: узкому экрану его и так мало */
  const wide=W/k;
  ok(wide>=380,"в кадр помещается дорога, а не щель: "+Math.round(wide)+" единиц мира");
  /* и на телефоне мир не крупнее, чем был до M217: там своя мерка у всего */
  near(k,1,.001,"на узком экране мерка остаётся единицей");
}));

/* ══════════════ телефон: КАЖДЫЙ режим, а не только поверхность (M239) ══════════════
   Раскладку на телефоне до сих пор мерили в одном режиме — на грунте. А набор
   кнопок меняется от режима к режиму (в поясе их восемь, в шахте другие, дома
   третьи), и ВЗЛЁТ, который автор не мог нажать, висел на пульте именно потому,
   что никто не смотрел на нижние этажи в других режимах. Сцены берём из
   фуззера (91zzzz): один список сцен на всю проверку — второй бы разошёлся. */
TEST_SUITES.push(()=>suite("телефон: этажи не налезают ни в одном режиме",()=>{
  if(!document.body.classList.contains("mobile")){
    resetWorld();ok(true,"окно не телефонное — проверку пропускаем");return;
  }
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  const box=s=>{const e=document.querySelector(s);if(!e)return null;
    const r=e.getBoundingClientRect();
    return (r.width&&r.height&&getComputedStyle(e).display!=="none")?{s,x:r.x,y:r.y,w:r.width,h:r.height}:null;};
  const hit=(a,b)=>!(a.x+a.w<=b.x+.5||b.x+b.w<=a.x+.5||a.y+a.h<=b.y+.5||b.y+b.h<=a.y+.5);
  const SEL=[".vitals",".locus","#prompt","#console",".rail","#launchbtn",
             ".pads>div:first-child",".pads>div:last-child"];
  const bad=[],seen=[];
  for(const sc of fuzzScenes()){
    /* карту тоже меряем. Здесь стоял пропуск `sc.id==="map"` — сцены зовутся
       по-русски («карта»), так что он не срабатывал НИ РАЗУ и был ровно тем
       сторожем-невидимкой, про который написано в CLAUDE.md. Убран вместе с
       причиной: подсказка на карте заходила под правый борт на пиксель. */
    let ok0=true;
    try{ok0=sc.set()!==false;}catch(e){bad.push(sc.id+" · сцена: "+e.message);continue;}
    if(!ok0)continue;
    /* подсказка подлиннее: на телефоне именно длинная строка выдавливает этажи */
    G.prompt="ДЕЙСТВИЕ — ЗАЛОЖИТЬ БАЗУ · 2500 КР + 10 СПЛАВОВ\nТРЮМ 12/40 · СКАФАНДР 88/100";
    try{hud();}catch(e){bad.push(sc.id+" · hud: "+e.message);continue;}
    /* ВЗЛЁТ показываем руками там, где он бывает: у корабля на поверхности */
    const lb=document.getElementById("launchbtn");
    if(lb)lb.style.display=(G.mode==="surface")?"":"none";
    const items=SEL.map(box).filter(Boolean);
    seen.push(sc.id+":"+items.length);
    for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++)
      if(hit(items[i],items[j]))bad.push(sc.id+" · "+items[i].s+"×"+items[j].s);
    for(const it of items)
      if(it.x<-1||it.x+it.w>innerWidth+1)bad.push(sc.id+" · за кромкой: "+it.s);
    if(lb)lb.style.display="none";
  }
  G.prompt="";resetWorld();hud();
  eq(bad.slice(0,5).join(" ;; "),"","этажи не пересекаются ни в одном режиме");
  ok(seen.length>=8,"режимов промерено: "+seen.length+" ("+seen.join(" ")+")");
}));

/* ══════════════ M360a: след стика и то, что под ним ══════════════
   Автор о кадре M360 (телефон, 06.09.2026): «у меня только разочарование».
   Два кольца в 82 px с шапкой в 11 лежали на фишках компаса, на МАСШТАБе, на
   приёмнике и на подсказке — и всё это было ВИДНО на снимке, который прошёл
   как готовый. Здесь мерится ровно то, что глаз тогда увидел, а рука прошла
   мимо: рисунок стика умещается в свой след, а всё читаемое из-под следа
   уходит само. Набор телефонный: на мониторе стиков не бывает. */
TEST_SUITES.push(()=>suite("телефон: стик не ложится на приборы и подсказку",()=>{
  if(!document.body.classList.contains("mobile")){
    resetWorld();ok(true,"окно не телефонное — проверку пропускаем");return;
  }
  resetWorld();
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  G.mode="system";
  /* 1. рисунок не выходит за объявленный след, как бы далеко ни увели палец */
  const far=helmStickShape({x0:0,y0:0,x:900,y:120});
  ok(far.r<=HELM_ARC1+.01,"дуга не растёт бесконечно: "+far.r.toFixed(1));
  ok(Math.hypot(far.dx,far.dy)<=HELM_FOOT,"точка держится следа: "+Math.round(Math.hypot(far.dx,far.dy)));
  ok(HELM_FOOT<=52,"весь след стика не больше 52 px (было 93): "+HELM_FOOT);
  const dead=helmStickShape({x0:0,y0:0,x:4,y:0});
  ok(!dead.live,"в мёртвой зоне дуги нет вовсе");
  /* 2. большой палец в своей зоне: приборы и подсказка уходят выше следа */
  HELM.lift=-1;document.body.style.removeProperty("--helmlift");
  /* палец кладём ровно на строку подсказки — там, где и был спор */
  G.prompt="ЦЕЛЬ ИЛИ ТЫЧОК ПО КОРПУСУ — ЗАХВАТ\nПРЕСЛЕДУЮТ: 3 · МОЖНО УЙТИ ИЛИ ПРЫГНУТЬ";
  hud();               /* текст подсказки — сперва в DOM, потом мерка */
  const r0=document.getElementById("prompt").getBoundingClientRect();
  const cy=Math.round(r0.top+r0.height/2);
  HELM.L={id:1,x0:Math.round(r0.left+50),y0:cy,x:Math.round(r0.left+50)+55,y:cy-35};
  HELM.R={id:2,x0:Math.round(r0.right-40),y0:cy+18,x:Math.round(r0.right-40)-25,y:cy-60};
  const foot=helmStickFoot();
  eq(foot.length,2,"два живых стика — два следа");
  helmLift();hud();
  ok(HELM.lift>0,"подсказка под пальцем — её поднимает ("+HELM.lift+" px)");
  ok(HELM.lift<=Math.round(innerHeight*.22)+1,"но не на середину экрана");
  ok(document.body.classList.contains("helmstick"),"пока палец на стекле, пульт отступает");
  const hitBox=(f,r)=>f.x+f.r>r.left&&f.x-f.r<r.right&&f.y+f.r>r.top&&f.y-f.r<r.bottom;
  const pr=document.getElementById("prompt").getBoundingClientRect();
  ok(pr.height>0,"подсказка на экране");
  ok(!foot.some(f=>hitBox(f,pr)),"подсказка ушла из-под пальца ("+Math.round(pr.top)+")");
  /* и второй кадр её не роняет обратно: мерка идёт от неподнятого места */
  const lift1=HELM.lift;helmLift();
  eq(HELM.lift,lift1,"подъём не дрожит от кадра к кадру");
  /* 3. фишки целей у кромки — тоже не под пальцем */
  G.ship.x=9000;G.ship.y=-7000;G.ship.vx=0;G.ship.vy=0;G.ap=null;G.orbit=null;
  let okDraw=true;try{drawSystem();}catch(e){okDraw=false;TEST.lines.push("  · "+e.message);}
  ok(okDraw,"системный вид рисуется со стиками");
  ok(SYS_CHIPS.length>0,"метки у края есть: "+SYS_CHIPS.length);
  const clash=[];
  for(const c of SYS_CHIPS)for(const f of foot)
    if(hitBox(f,{left:c.x,right:c.x+c.w,top:c.y,bottom:c.y+c.h}))
      clash.push(Math.round(c.x)+","+Math.round(c.y));
  eq(clash.join(", "),"","фишки компаса не лежат под следом стика");
  /* 4. отпустили — всё вернулось на своё место */
  HELM.L=HELM.R=null;HELM.fadeL=HELM.fadeR=null;
  helmLift();hud();
  eq(HELM.lift,0,"палец убран — подсказка на своём месте");
  ok(!document.body.classList.contains("helmstick"),"и пульт вернулся");
  G.prompt="";G.ship.x=0;G.ship.y=0;resetWorld();hud();
}));

/* ── M360a: две мысли — две строки, а не одна полоса во всю ширину ──
   `say("ГРАВИТАЦИОННЫЙ ЯКОРЬ\nдальше корабль не уходит\nкурс к звезде свободен")`
   на телефоне выходил одной строкой от края до края с многоточием: у #msg и
   #prompt в узком окне стоял white-space:nowrap. */
TEST_SUITES.push(()=>suite("телефон: перевод строки в сообщении и подсказке жив",()=>{
  if(!document.body.classList.contains("mobile")){
    resetWorld();ok(true,"окно не телефонное — проверку пропускаем");return;
  }
  resetWorld();
  const m=document.getElementById("msg"),p=document.getElementById("prompt");
  say("ГРАВИТАЦИОННЫЙ ЯКОРЬ\nдальше корабль не уходит\nкурс к звезде свободен");
  G.prompt="ЦЕЛЬ ИЛИ ТЫЧОК ПО КОРПУСУ — ЗАХВАТ\nПРЕСЛЕДУЮТ: 3 · МОЖНО УЙТИ ИЛИ ПРЫГНУТЬ";
  hud();
  for(const e of [m,p]){
    const ws=getComputedStyle(e).whiteSpace;
    ok(ws==="pre-line"||ws==="pre-wrap","перевод строки жив у #"+e.id+" ("+ws+")");
    const lh=parseFloat(getComputedStyle(e).lineHeight)||14;
    ok(e.getBoundingClientRect().height>lh*1.5,
       "#"+e.id+" встал в две строки и выше ("+Math.round(e.getBoundingClientRect().height)+" px)");
  }
  G.msgT=0;G.prompt="";hud();
}));
