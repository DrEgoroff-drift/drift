/* Развилка 1 плейтеста 14.10: безоружному торговцу в тихом кольце налётчики не выходят. */
TEST_SUITES.push(()=>suite("развилка 1: безоружному в тихом кольце налётчики не выходят",()=>{
  resetWorld();
  const quiet=[];
  for(let x=-10;x<=10;x++)for(let y=-10;y<=10;y++)if(starAt(x,y)&&sysDanger(x,y)<.1)quiet.push([x,y]);
  ok(quiet.length>10,"тихих систем в кольце достаточно: "+quiet.length);
  /* налётчик из spawnPirates несёт deserter (0/1) и не несёт pw; заставы держав — наоборот.
     Бросок налёта зависит от четверти часа (900 с): идём по сорока четвертям, иначе выборка пуста */
  const run=()=>{let n=0;for(let b=0;b<40;b++){clockAdvance(900000);for(const [x,y] of quiet){
    G.sx=x;G.sy=y;G.sys=getSystem(x,y);G.haul=null;spawnPirates();
    n+=G.pirates.filter(p=>p.deserter!==undefined&&!p.pw).length;}}return n;};
  ok(!stat().armed,"стартовый борт без орудия");
  const bare=run();
  ok(bare===0,"безоружному в тихих системах налётчиков: "+bare);
  G.mods.weapon=1;
  ok(stat().armed,"орудие стоит — борт вооружён");
  const armed=run();
  ok(armed>0,"вооружённому налёты остаются (иначе проверка пуста): "+armed);
  /* глубже, где опасно, правило не работает вовсе: безоружный там встречает налёт как прежде */
  G.mods.weapon=0;
  let deep=0,seen=0;
  for(let x=-30;x<=30&&seen<40;x++)for(let y=-30;y<=30&&seen<40;y++){
    if(!starAt(x,y)||sysDanger(x,y)<.35)continue;
    seen++;G.sx=x;G.sy=y;G.sys=getSystem(x,y);G.haul=null;spawnPirates();
    deep+=G.pirates.filter(p=>p.deserter!==undefined&&!p.pw).length;
  }
  ok(seen>0&&deep>0,"в опасных системах налёт безоружному остаётся: "+deep+" налётчиков в "+seen+" системах");
}));
