/* ══════════════ автотесты: «Глобус» ══════════════
   Указатель места полёта (25f): где ты и где окажешься, если затормозить прямо
   сейчас. Сторожатся три вещи, и каждая уже была сломана при постройке. */

/* Планеты стоят на орбитах не сразу после resetWorld — их расставляет ход
   системы. Тест, который этого не делает, меряет нули и врёт зелёным. */
function globusSys(){
  resetWorld();
  G.mode="system";
  for(let i=0;i<3;i++){G.t+=.02;updateSystem(1);}
}
TEST_SUITES.push(()=>suite("глобус: показывает место, а не число",()=>{
  globusSys();
  /* стоим — показывать нечего, и это тоже показание */
  G.ship.vx=0;G.ship.vy=0;
  eq(globusAim(),null,"на стоянке цели нет");
  /* идём на звезду из-под неё — упрёмся в звезду */
  G.ap=null;G.ship.x=0;G.ship.y=-1200;G.ship.vx=0;G.ship.vy=3;
  const a=globusAim();
  ok(a&&a.kind==="star","идя на звезду, прибор показывает звезду");
  ok(a.d>0&&a.d<1400,"и расстояние правдоподобно ("+(a&&a.d)+")");
  /* отвернулись — в ту сторону пусто */
  G.ship.vy=-3;
  const b=globusAim();
  ok(!b||b.kind!=="star","отвернувшись, в звезду уже не упираемся");
  /* и всё, что прибор называет, обязано быть настоящим телом этой системы:
     проверять «именно первую планету» нельзя — луч летит прямо и честно может
     упереться по дороге в другое тело, это и есть его работа */
  const names=[];
  for(const q of G.sys.planets){names.push(q.name);for(const m of q.moons)names.push(m.name);}
  if(G.sys.station)names.push(G.sys.station.name);
  names.push(typeof nameOf==="function"?nameOf(G.sys):G.sys.name);
  let hits=0,bad=0;
  for(let k=0;k<24;k++){
    const ang=k/24*Math.PI*2;
    G.ship.x=0;G.ship.y=0;G.ship.vx=Math.cos(ang)*3;G.ship.vy=Math.sin(ang)*3;
    const c=globusAim();
    if(!c)continue;
    hits++;
    if(names.indexOf(c.ru)<0)bad++;
  }
  ok(hits>0,"хоть куда-то прибор упирается ("+hits+" из 24 направлений)");
  eq(bad,0,"и всё названное — настоящие тела этой системы");
}));

TEST_SUITES.push(()=>suite("глобус: считает раз в секунду, а не в кадр",()=>{
  globusSys();
  G.ship.x=0;G.ship.y=-1200;G.ship.vx=0;G.ship.vy=3;
  GLOB.t=-1;
  const first=globusTick();
  const turn0=GLOB.turn;
  for(let i=0;i<50;i++)globusTick();
  eq(GLOB.turn,turn0,"в ту же секунду шар не поворачивается");
  ok(globusTick()===first,"и ответ тот же самый");
  GLOB.t=GLOB.t-1;
  globusTick();
  ok(GLOB.turn!==turn0,"на новой секунде шар повернулся рывком");
}));

TEST_SUITES.push(()=>suite("глобус: прибор не говорит",()=>{
  /* Правило мира (25a): ни писка, ни цветовой тревоги, ни строки в журнале.
     Единственный, кто может подать сигнал, — человек, посмотревший на цифру.
     Проверяется по исходнику, потому что нарушить это можно одной строкой. */
  const src=globusAim.toString()+globusTick.toString()+globusDraw.toString();
  for(const bad of ["say(","tell(","logAdd(","sfx(","alert("])
    ok(src.indexOf(bad)<0,"в приборе нет "+bad.replace("(",""));
  /* и он ничего не персистит: всё выводится из положения */
  globusSys();
  G.ship.vx=0;G.ship.vy=3;GLOB.t=-1;globusTick();
  ok(JSON.stringify(snapshot()).indexOf("glob")<0,"в сохранение прибор ничего не кладёт");
}));
