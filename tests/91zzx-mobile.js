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
  /* призрачных кнопок нет: на поверхности тормоз отсутствует */
  G.mode="surface";G.surf={p:{type:"terran",T:{atm:"есть"},name:"т"},suit:100,x:0,y:0,fauna:[],plants:[]};
  hud();
  eq(document.querySelector("[data-k=brake]").style.display,"none","на поверхности тормоза нет");
  G.mode="system";G.surf=null;hud();
  ok(document.querySelector("[data-k=brake]").style.display!=="none","в полёте есть");
}));
