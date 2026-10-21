/* Развилка 4 плейтеста 14.10: авария у звезды не чинит выше 45 %, корона не лечит. */
TEST_SUITES.push(()=>suite("развилка 4: авария у звезды не чинит выше 45 %, корона не лечит",()=>{
  resetWorld();
  G.mode="system";
  const max=stat().hullMax,cap=Math.round(max*.45);
  const burn=()=>{G.hull=0;wreck("перегрев у звезды");return G.hull;};
  /* корпус был целым и держался: после короны — не выше 45 % */
  hullHeld().v=max;
  ok(burn()<=cap,"из целого — не выше 45 %: "+G.hull+" из "+max);
  for(let i=0;i<6;i++){const h=burn();ok(h<=cap,"круг "+(i+1)+": корпус "+h+" ≤ "+cap);}
  /* корпус был 20 % и держался: петля через корону его не поднимает */
  const low=Math.round(max*.2);
  hullHeld().v=low;
  ok(burn()===low,"из 20 % — те же 20 %, не 45: "+G.hull);
  /* цифры «что держалось» нет (свежая загрузка) — собирают не выше 45 %, не больше */
  hullHeld().v=-1;
  const unk=burn();
  ok(unk<=cap&&unk>=Math.round(max*.1),"неизвестно, что было: "+unk+" в пределах 10–45 %");
  /* сама корона корпус только жжёт: за шаги внутри кромки он убывает, не растёт */
  resetWorld();
  G.mode="system";G.ap=null;G.haul=null;G.pirates=[];
  const sys=G.sys,sh=G.ship;
  sh.x=sys.radius*.5;sh.y=0;sh.vx=0;sh.vy=0;
  G.hull=60;
  let prev=G.hull,up=0;
  for(let i=0;i<5;i++){updateSystem(1);if(G.mode!=="system")break;if(G.hull>prev)up++;prev=G.hull;}
  ok(up===0&&G.hull<60,"в короне корпус только убывает: 60 → "+G.hull.toFixed(1));
}));
