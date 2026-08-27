/* ══════════════ автотесты: телефонный вид (M167) ══════════════ */
TEST_SUITES.push(()=>suite("телефон: разрез КОРАБЛЬ|СКАФАНДР, кукла из вещей, тормоза на поверхности нет",()=>{
  resetWorld();
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  /* вкладки корабельного экрана */
  ok(!!document.getElementById("svTabs"),"вкладки есть");
  openShipView();
  eq(svMode,"ship","открывается на корабле");
  document.querySelector('#svTabs button[data-tab="suit"]').click();
  eq(svMode,"suit","переключились на скафандр");
  ok(!!document.getElementById("kitDoll"),"кукла на месте");
  ok(kitDollHit.length===6,"шесть зон нажатия");
  ok(kitDollHit.every(h=>h.w>=44&&h.h>=44),"каждая зона не меньше 44 px");
  eq(document.getElementById("svstage").style.display,"none","сцена корабля спрятана");
  document.querySelector('#svTabs button[data-tab="ship"]').click();
  eq(svMode,"ship","и обратно");
  kitAnimStop();
  document.getElementById("shipview").classList.remove("open");
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
  eq($f.style.display!=="none",true,"с оружием в системе виден");
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
  if(innerWidth>760){ok(true,"не телефон — пропуск");return;}
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
  for(const k in pSys)eq(pSurf[k],pSys[k],"«"+k+"» на том же месте на поверхности");
  G.mode="belt";hud();padsFit();const pBelt=place();
  for(const k of ["left","right","fire","brake","act","thrust"])
    eq(pBelt[k],pSys[k],"«"+k+"» на том же месте и в поясе");
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
    const items=[".vitals",".locus","#prompt","#console",".rail",
                 ".pads>div:first-child",".pads>div:last-child"].map(box).filter(Boolean);
    const hit=(a,b)=>!(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y);
    const clash=[];
    for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++)
      if(hit(items[i],items[j]))clash.push(items[i].s+"×"+items[j].s);
    eq(clash.join(", "),"","этажи не пересекаются");
    const out=items.filter(i=>i.x<-1||i.x+i.w>innerWidth+1);
    eq(out.map(i=>i.s).join(", "),"","и ничто не уехало за край");
  }
  G.prompt="";G.surf=null;G.mode="system";hud();
}));

/* ── M222: мерка мира обязана видеть обе стороны кадра ──
   M217 считал масштаб по одной высоте. У телефона высота как у монитора, а
   ширина втрое меньше: на 390×844 мир увеличивался в полтора раза, и в кадр
   переставала помещаться дорога — оставалось меньше трёхсот единиц мира в
   ширину. Проверка живёт в телефонном наборе, потому что только там это и
   видно (`test.ps1 -Mobile`). */
TEST_SUITES.push(()=>suite("телефон: мир не зажимают в щель",()=>{
  if(innerWidth>760){ok(true,"не телефон — пропуск");return;}
  resetWorld();
  const k=surfScale();
  ok(k>=1,"мерка не ужимает мир никогда");
  /* сколько мира видно в ширину: узкому экрану его и так мало */
  const wide=W/k;
  ok(wide>=380,"в кадр помещается дорога, а не щель: "+Math.round(wide)+" единиц мира");
  /* и на телефоне мир не крупнее, чем был до M217: там своя мерка у всего */
  near(k,1,.001,"на узком экране мерка остаётся единицей");
}));
