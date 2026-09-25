/* ══════════════ автотесты: телефонный вид (M167) ══════════════ */
TEST_SUITES.push(()=>suite("телефон: опись одной лентой, кукла из вещей, тормоза на поверхности нет",{tier:"browser"},()=>{
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
  }
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
TEST_SUITES.push(()=>suite("телефон: ряд пэдов помещается в экран",{tier:"browser",win:"phone"},()=>{
  resetWorld();
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
TEST_SUITES.push(()=>suite("телефон: пэды не гаснут сами",{tier:"browser"},()=>{
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
TEST_SUITES.push(()=>suite("телефон: этажи внизу не налезают друг на друга",{tier:"browser",win:"phone"},()=>{
  resetWorld();
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  G.mode="surface";
  G.surf={p:{type:"terran",T:{atm:"есть",ru:"землеподобная"},name:"т",seed:1},
          suit:100,x:0,y:0,shipX:0,fauna:[],plants:[]};
  G.prompt="ДЕЙСТВИЕ — СКАНИРОВАТЬ ОРГАНИЗМ";
  hud();
  if(ok(document.body.classList.contains("mobile"),"вёрстка в телефонном режиме (body.mobile)")){
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
TEST_SUITES.push(()=>suite("телефон: мир не зажимают в щель",{tier:"browser",win:"phone"},()=>{
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
TEST_SUITES.push(()=>suite("телефон: этажи не налезают ни в одном режиме",{tier:"browser",win:"phone"},()=>{
  if(!ok(document.body.classList.contains("mobile"),"вёрстка в телефонном режиме (body.mobile)")){resetWorld();return;}
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
TEST_SUITES.push(()=>suite("телефон: стик не ложится на приборы и подсказку",{tier:"browser",win:"phone"},()=>{
  if(!ok(document.body.classList.contains("mobile"),"вёрстка в телефонном режиме (body.mobile)")){resetWorld();return;}
  resetWorld();
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  G.mode="system";
  /* 1. рисунок не выходит за объявленный след, как бы далеко ни увели палец */
  const s0={x0:0,y0:0,x:900,y:120};helmDrag(s0);
  const reach=Math.hypot(s0.x-s0.x0,s0.y-s0.y0);
  near(reach,HELM_DEAD+HELM_REACH,.01,"центр бежит за пальцем: дальше полного хода палец не уходит");
  const far=helmStickShape(s0);
  ok(far.r<=HELM_DEAD+HELM_REACH-HELM_GAP+.01,"тело ленты не растёт бесконечно: "+far.r.toFixed(1));
  ok(HELM_FOOT<=40,"след вокруг любой точки ленты не больше 40 px (кольца M360 были 93): "+HELM_FOOT);
  const dead=helmStickShape({x0:0,y0:0,x:4,y:0});
  ok(!dead.live,"в мёртвой зоне ленты нет вовсе");
  /* 2. большой палец в своей зоне: приборы и подсказка уходят выше следа */
  HELM.lift=-1;document.body.style.removeProperty("--helmlift");
  /* палец кладём ровно на строку подсказки — там, где и был спор */
  G.prompt="ЦЕЛЬ ИЛИ ТЫЧОК ПО КОРПУСУ — ЗАХВАТ\nПРЕСЛЕДУЮТ: 3 · МОЖНО УЙТИ ИЛИ ПРЫГНУТЬ";
  hud();               /* текст подсказки — сперва в DOM, потом мерка */
  const r0=document.getElementById("prompt").getBoundingClientRect();
  const cy=Math.round(r0.top+r0.height/2);
  /* стик один (M410) — под левым пальцем; кладём его на строку подсказки */
  HELM.S={id:1,x0:Math.round(r0.left+50),y0:cy,x:Math.round(r0.left+50)+55,y:cy-35};
  const foot=helmStickFoot();
  ok(foot.length>=2&&foot.length<=5,"след стика — капсула от центра к пальцу: "+foot.length+" кружка");
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
  HELM.S=null;HELM.fade=null;
  helmLift();hud();
  eq(HELM.lift,0,"палец убран — подсказка на своём месте");
  ok(!document.body.classList.contains("helmstick"),"и пульт вернулся");
  /* 5. точка покоя (M410): внизу слева, и палец на ней попадает в холст, а не
     в приёмник или кнопку — иначе стик там не родится */
  HELM.home=null;
  const hm=helmHome();
  ok(hm.x<W/2&&hm.y>H*.6,"точка покоя внизу слева: "+Math.round(hm.x)+","+Math.round(hm.y));
  {
    const rc=cvs.getBoundingClientRect();
    const cx=rc.left+hm.x*rc.width/W,cy2=rc.top+hm.y*rc.height/H;
    const under=document.elementFromPoint(cx,cy2);
    ok(under===cvs,"под точкой покоя — холст, а не "+(under?(under.id||under.className||under.tagName):"ничего"));
  }
  G.prompt="";G.ship.x=0;G.ship.y=0;resetWorld();hud();
}));

/* ── M360a: две мысли — две строки, а не одна полоса во всю ширину ──
   `say("ГРАВИТАЦИОННЫЙ ЯКОРЬ\nдальше корабль не уходит\nкурс к звезде свободен")`
   на телефоне выходил одной строкой от края до края с многоточием: у #msg и
   #prompt в узком окне стоял white-space:nowrap. */
TEST_SUITES.push(()=>suite("телефон: перевод строки в сообщении и подсказке жив",{tier:"browser",win:"phone"},()=>{
  if(!ok(document.body.classList.contains("mobile"),"вёрстка в телефонном режиме (body.mobile)")){resetWorld();return;}
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

/* ══════════════ M422: палец где угодно — настоящими событиями ══════════════
   Остальные наборы кладут `HELM.S` руками и меряют физику. Здесь проверяется
   то, что между пальцем и `HELM.S`: настоящие PointerEvent на холсте, обе
   половины экрана, и главное — что стик не отнял тычок. Набор телефонный. */
TEST_SUITES.push(()=>suite("телефон: стик рождается под пальцем, а тычок остаётся тычком",{tier:"browser",win:"phone"},()=>{
  if(!ok(document.body.classList.contains("mobile"),"вёрстка в телефонном режиме (body.mobile)")){resetWorld();return;}
  resetWorld();
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  G.mode="system";G.ap=null;G.orbit=null;G.marks=[];
  HELM.S=null;HELM.P=null;HELM.fade=null;HELM.trail=[];
  const rc=cvs.getBoundingClientRect();
  const send=(t,id,cx,cy)=>cvs.dispatchEvent(new PointerEvent(t,
    {pointerId:id,pointerType:"touch",clientX:cx,clientY:cy,bubbles:true,cancelable:true}));
  /* Кадр после движения пальца. Сенсор шлёт движение чаще кадра, поэтому
     `pointermove` с 0.446 только запоминает сырые координаты, а переводит их в
     пиксели канвы и решает «тычок или стик» — helmSyncPointer(), РАЗ ЗА КАДР
     (15a-helm, разбор каденции 18.09). Значит стик рождается не в обработчике
     события, а в ближайшем кадре: набор делает этот кадр явно, иначе он мерил
     бы состояние между двумя кадрами, какого игрок никогда не видит. */
  const frame=()=>helmSyncPointer();
  /* 1. правая половина — тоже штурвал (до M422 там не рождалось ничего) */
  const rx=rc.left+rc.width*.78,ry=rc.top+rc.height*.42;
  send("pointerdown",11,rx,ry);
  ok(HELM.P&&!HELM.S,"палец лёг — он ещё тычок, стика нет");
  send("pointermove",11,rx-30,ry-10);frame();
  ok(!!HELM.S,"сдвинулся — родился стик, и это ПРАВАЯ половина");
  ok(Math.abs(HELM.S.x0-(rx-rc.left)*W/rc.width)<2,"центр там, где палец лёг, а не там, где он сейчас");
  helmTick(1);
  ok(G.ctl.assist,"штурвал взял ход с него");
  ok(G.ctl.ax<0,"ведут влево — и ход влево: "+G.ctl.ax.toFixed(2));
  send("pointerup",11,rx-30,ry-10);
  ok(!HELM.S&&!HELM.P,"палец снят — стика нет");
  ok(!!HELM.fade,"…и остался тающий след");
  HELM.fade=null;
  /* 2. короткий тычок стиком НЕ становится: его разбирает 15-input */
  G.ap=null;
  send("pointerdown",12,rc.left+rc.width*.3,rc.top+rc.height*.3);
  ok(HELM.P&&!HELM.S,"тычок на левой половине — тоже сперва тычок");
  send("pointerup",12,rc.left+rc.width*.3,rc.top+rc.height*.3);
  ok(!HELM.S&&!HELM.P,"отпустил быстро — стик не родился");
  /* 3. второй палец при ждущем — щипок, а не второй стик */
  send("pointerdown",13,rc.left+rc.width*.4,rc.top+rc.height*.5);
  send("pointerdown",14,rc.left+rc.width*.6,rc.top+rc.height*.5);
  ok(!HELM.P&&!HELM.S,"два пальца разом — это щипок, стик уступает");
  ok(!helmPinchBlocked(),"…и зум не заблокирован");
  send("pointerup",13,rc.left+rc.width*.4,rc.top+rc.height*.5);
  send("pointerup",14,rc.left+rc.width*.6,rc.top+rc.height*.5);
  /* 4. при живом стике второй палец щипок не открывает */
  send("pointerdown",15,rc.left+rc.width*.5,rc.top+rc.height*.5);
  send("pointermove",15,rc.left+rc.width*.5+40,rc.top+rc.height*.5);frame();
  ok(!!HELM.S,"стик жив");
  ok(helmPinchBlocked(),"пока он жив, щипок не мешает рулю");
  send("pointerup",15,rc.left+rc.width*.5+40,rc.top+rc.height*.5);
  HELM.S=null;HELM.P=null;HELM.fade=null;HELM.trail=[];
  resetWorld();
}));

/* Пара HUD 15/n: «Долгое · форсаж» над ДЕЙСТВИЕМ сидела на нижней кромке ФОТО и
   на полосе ленты — три вещи в одном месте. Потом — подписью под пэдом, в 4,5 px
   от кромки (Контроль: мало). Теперь она строкой внутри пэда. Сторож — в любом окне (390×844 под -Mobile, 760 под
   -Size 760,760, обычное): подсказка, ФОТО, лента и ЦЕЛЬ попарно не пересекаются,
   и подсказка целиком в кадре. У подсказки нет своего прямоугольника — это
   ::after пэда: считаем его из стиля псевдоэлемента и ширины текста, в мерке
   пэда (масштаб пэдов и --ui — отношением видимой ширины к вёрстке). */
TEST_SUITES.push(()=>suite("пульт: подсказка системы, ФОТО, лента и ЦЕЛЬ не налезают друг на друга",{tier:"browser"},()=>{
  resetWorld();G.mode="system";
  ABIL_ST.cd=0;hud();abilPadRim();camBtnTick();
  const act=document.querySelector('.pads button[data-k="act"]');
  const cam=document.getElementById("camBtn"),rx=document.getElementById("rx"),lock=document.getElementById("lockbtn");
  ok(act.classList.contains("abil-ok"),"подсказка системы горит: «"+act.dataset.abil+"»");
  ok(cam.getClientRects().length>0&&lock.getClientRects().length>0,"ФОТО и ЦЕЛЬ стоят в системе");
  const R={"подсказка":abilHintRect(act),
    "ФОТО":cam.getBoundingClientRect(),"лента":rx.getBoundingClientRect(),"ЦЕЛЬ":lock.getBoundingClientRect()};
  const f=r=>Math.round(r.left)+","+Math.round(r.top)+"–"+Math.round(r.right)+","+Math.round(r.bottom);
  const names=Object.keys(R);
  for(let i=0;i<names.length;i++)for(let j=i+1;j<names.length;j++){
    const a=R[names[i]],b=R[names[j]];
    const hit=a.left<b.right-.5&&b.left<a.right-.5&&a.top<b.bottom-.5&&b.top<a.bottom-.5;
    ok(!hit,names[i]+" ["+f(a)+"] и "+names[j]+" ["+f(b)+"] не пересекаются · окно "+innerWidth+"×"+innerHeight);
  }
  const h=R["подсказка"];
  ok(h.left>=0&&h.right<=innerWidth&&h.top>=0&&h.bottom<=innerHeight,"подсказка целиком в кадре: ["+f(h)+"]");
  /* подсказку гасим за собой: в кадре её снимает abilTick, в наборах его нет,
     и сквозная сеть «текст в кнопках помещается» читала бы её как вылет текста */
  G.mode="dock";abilPadRim();
  resetWorld();
}));
/* У подсказки системы нет своего прямоугольника — это ::after пэда. Строкой
   внутри пэда (position:static) она лежит в его рамке; подписью снаружи
   (absolute) — считаем из стиля псевдоэлемента и ширины текста, в мерке пэда
   (масштаб пэдов и --ui — отношением видимой ширины к вёрстке). */
function abilHintRect(act){
  const ar=act.getBoundingClientRect(),cs=getComputedStyle(act,"::after");
  if(cs.position==="static")return {left:ar.left,right:ar.right,top:ar.top,bottom:ar.bottom};
  const k=ar.width/act.offsetWidth,g=document.createElement("canvas").getContext("2d");
  g.font=cs.fontWeight+" "+cs.fontSize+" "+cs.fontFamily;
  const tw=g.measureText(act.dataset.abil).width*k,fh=(parseFloat(cs.lineHeight)||parseFloat(cs.fontSize)*1.2)*k;
  const top=ar.top+parseFloat(cs.top)*k,mid=ar.left+ar.width/2;
  return {left:mid-tw/2,right:mid+tw/2,top,bottom:top+fh};
}
/* относительная яркость и контраст по WCAG: цвета — [r,g,b] 0..255 */
function wcagL(c){const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);};return .2126*f(c[0])+.7152*f(c[1])+.0722*f(c[2]);}
function wcagK(a,b){const x=wcagL(a),y=wcagL(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
function rgbaOf(s){const m=/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/.exec(s)||[0,0,0,0,0];return [+m[1],+m[2],+m[3],m[4]===undefined?1:+m[4]];}

/* Правка Контроля к паре HUD 15/n: «Долгое · форсаж» стояла в 4,5 px от нижней
   кромки и в 9 px от правой при контрасте 2:1 (погашенный пэд гасил и её), шапка —
   в 10 px слева и 8 сверху. Закон: ни одна видимая строка приборов не ближе 12 px
   к кромке окна плюс вырез (env(safe-area-inset-*)). Строки — текстовые узлы
   приборов (прямоугольники строк через Range), подсказка системы и плашки фишек
   компаса. Подсказке — контраст не ниже 4,5:1 к плашке пэда даже над светлым
   небом. Тут же регистр имён: имя на пэде, на фишке и в названии места — как в
   таблицах (CSS-строчные делали «К главтрассе»), и одна десятичная запятая:
   «×1,40» рядом с «1,4к», а не «×1.40». Окно любое: 390×844 под -Mobile. */
TEST_SUITES.push(()=>suite("приборы: строки не ближе 12 px к кромке, имена как в таблицах, одна запятая",{tier:"browser"},()=>{
  resetWorld();
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  G.mode="system";
  /* улететь, чтобы звезда и станция ушли за кадр: фишки лягут на кромку */
  G.ship.x=9000;G.ship.y=-7000;G.ship.vx=0;G.ship.vy=0;G.ap=null;G.orbit=null;
  ABIL_ST.cd=0;G.prompt="";hud();abilPadRim();camBtnTick();
  try{drawSystem();}catch(e){}
  const pr=document.createElement("div");
  pr.style.cssText="position:fixed;visibility:hidden;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)";
  document.body.appendChild(pr);const pc=getComputedStyle(pr);
  const E=12,L=E+parseFloat(pc.paddingLeft),Rt=innerWidth-E-parseFloat(pc.paddingRight),
    Tp=E+parseFloat(pc.paddingTop),Bt=innerHeight-E-parseFloat(pc.paddingBottom);
  pr.remove();
  const f=r=>Math.round(r.left)+","+Math.round(r.top)+"–"+Math.round(r.right)+","+Math.round(r.bottom);
  const bad=[],texts=[];let seen=0;
  const chk=(what,r)=>{
    if(!(r.right-r.left>=1&&r.bottom-r.top>=1))return;
    if(r.right<=0||r.left>=innerWidth||r.bottom<=0||r.top>=innerHeight)return;   // за кадром — не видна
    seen++;
    if(r.left<L-.5||r.right>Rt+.5||r.top<Tp-.5||r.bottom>Bt+.5)bad.push("«"+what+"» ["+f(r)+"]");
  };
  const rg=document.createRange();
  const walk=()=>{texts.length=0;
    for(const sel of [".hud",".pads","#console","#camBtn",".rail","#prompt"]){
      const root=document.querySelector(sel);if(!root)continue;
      const tw=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
      for(let n=tw.nextNode();n;n=tw.nextNode()){
        const t=n.data.trim(),el=n.parentElement;
        if(!t||!el||!el.checkVisibility({opacityProperty:true,visibilityProperty:true}))continue;
        texts.push(t);rg.selectNodeContents(n);
        for(const r of rg.getClientRects())chk(t,r);
      }
    }};
  walk();
  const act=document.querySelector('.pads button[data-k="act"]');
  ok(act.classList.contains("abil-ok"),"подсказка системы горит: «"+act.dataset.abil+"»");
  chk(act.dataset.abil,abilHintRect(act));
  ok(SYS_CHIPS.length>0,"фишки у кромки есть: "+SYS_CHIPS.length);
  for(const c of SYS_CHIPS)if(c.pl)chk(c.l,{left:c.pl[0],top:c.pl[1],right:c.pl[0]+c.pl[2],bottom:c.pl[1]+c.pl[3]});
  ok(seen>=8,"строк приборов в кадре: "+seen);
  eq(bad.join(", "),"","строки не ближе "+E+" px к кромке окна "+innerWidth+"×"+innerHeight);
  /* контраст подсказки: её цвет с прозрачностью пэда (без общего затухания ряда
     .pads.faded — это нарочно) на плашке пэда, положенной на светлое небо #808080 */
  {
    const ca=rgbaOf(getComputedStyle(act,"::after").color);
    let o=ca[3];for(let e=act;e&&!e.classList.contains("pads");e=e.parentElement)o*=+getComputedStyle(e).opacity;
    const pl=rgbaOf(getComputedStyle(act).backgroundColor),sky=128;
    const bg=[0,1,2].map(i=>pl[i]*pl[3]+sky*(1-pl[3]));
    const fg=[0,1,2].map(i=>ca[i]*o+bg[i]*(1-o));
    const K=wcagK(fg,bg);
    ok(K>=4.5,"контраст подсказки "+K.toFixed(2)+":1 (не ниже 4,5)");
  }
  /* и подсказка не врёт: долгое нажатие доходит до пэда и без действия рядом
     (.off снимал касания — форсаж в открытом космосе был только на клавише V) */
  ok(act.classList.contains("off"),"сцена без действия: пэд погашен");
  ok(getComputedStyle(act).pointerEvents!=="none","погашенный пэд с готовой системой принимает касание");
  /* одна десятичная запятая: ни одной «1.40» в строках приборов */
  eq(texts.filter(t=>/\d\.\d/.test(t)).join(" | "),"","числа приборов — с запятой");
  eq(document.getElementById("zoomlbl").innerText.trim(),"Масштаб ×"+G.zoom.toFixed(2).replace(".",","),"масштаб с запятой");
  /* имена: пэд, фишка, место — как в таблицах; четыре системы и все державы */
  const $w=act.querySelector("span")||act,miss=[],sys0=G.sys;
  const padIs=(prompt,want)=>{G.prompt=prompt;hud();const got=$w.innerText.trim();if(got!==want)miss.push("«"+got+"» вместо «"+want+"»");};
  for(const p in POWERS)padIs("ДЕЙСТВИЕ — К "+POWERS[p].ru.toUpperCase(),"К "+POWERS[p].ru.split(/\s+/)[0]);
  padIs("ДЕЙСТВИЕ — К ГЛАВТРАССЕ","К ГЛАВТРАССЕ");
  padIs("ДЕЙСТВИЕ — ДО КОММУНЫ · 3","До Коммуны");
  for(const [sx,sy] of [[0,0],[1,0],[0,2],[-3,1]]){
    const S=getSystem(sx,sy);G.sys=S;
    const names=[S.name].concat(S.station?[S.station.name]:[],(S.planets||[]).map(p=>p.name));
    for(const nm of names){const w0=String(nm).split(/\s+/)[0];if(w0)padIs("ДЕЙСТВИЕ — К "+String(nm).toUpperCase(),"К "+w0);}
  }
  G.sys=sys0;G.prompt="";hud();
  eq(miss.join(", "),"","имя на пэде — как в таблицах");
  /* фишки называют имя как есть; место — имя системы как есть */
  const known=new Set(["Звезда","Цель"].concat(G.sys.station?[G.sys.station.name]:[],(G.sys.planets||[]).map(p=>p.name)));
  const odd=SYS_CHIPS.map(c=>String(c.l||"").split(" · ")[0]).filter(n=>n&&!known.has(n));
  eq(odd.join(", "),"","фишки: имена как в таблицах");
  ok(document.querySelector(".locus").innerText.includes(G.sys.name),"название места — «"+G.sys.name+"» как есть: "+document.querySelector(".locus").innerText.replace(/\n/g," / "));
  G.ship.x=0;G.ship.y=0;G.mode="dock";abilPadRim();resetWorld();
}));
