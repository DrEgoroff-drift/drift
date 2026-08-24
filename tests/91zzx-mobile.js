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
