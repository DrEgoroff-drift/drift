/* ══════════════ автотесты: каркас ══════════════ */
/* Эти файлы не попадают в drift.html. build.ps1 склеивает игру + tests/*.js в
   отдельный tests.html: код проверяется ровно тот, что играется, а игра остаётся
   чистой. Открыть tests.html в браузере — отчёт выводится на страницу, в консоль
   и в window.TEST (для чтения из инструментов).

   Тесты работают с настоящим G: каждый набор начинается с resetWorld(), которая
   возвращает состояние к стартовому. Ничего не мокаем — иначе проверялись бы
   моки, а не игра. */
const TEST={pass:0,fail:0,lines:[],failed:[]};
let _suite="";
function suite(name,fn){
  _suite=name;
  TEST.lines.push("── "+name);
  try{fn();}
  catch(e){TEST.fail++;TEST.failed.push(name+" · ИСКЛЮЧЕНИЕ: "+(e&&e.message||e));
    TEST.lines.push("  ✗ ИСКЛЮЧЕНИЕ: "+(e&&e.stack||e));}
}
function ok(cond,msg){
  if(cond){TEST.pass++;TEST.lines.push("  ✓ "+msg);}
  else{TEST.fail++;TEST.failed.push(_suite+" · "+msg);TEST.lines.push("  ✗ "+msg);}
}
function eq(a,b,msg){ok(a===b,msg+" (получено "+JSON.stringify(a)+", ждали "+JSON.stringify(b)+")");}
function near(a,b,tol,msg){ok(Math.abs(a-b)<=tol,msg+" (получено "+a+", ждали ≈"+b+"±"+tol+")");}

/* полный сброс мира: то же, что «начать заново», но без перезагрузки страницы */
function resetWorld(){
  G.mode="system";G.sx=0;G.sy=0;G.sys=getSystem(0,0);G.zoom=1;
  G.shipId="strizh";G.owned={strizh:true};
  G.ship={x:0,y:-760,vx:0,vy:0,a:0,av:0,bank:0};
  G.fuel=100;G.hull=100;G.credits=600;G.data=0;
  for(const k of RES_KEYS)G.cargo[k]=0;
  G.mods={engine:0,tank:0,hold:0,armor:0,drill:0,hyper:0,weapon:0};
  G.modsOwned={engine:0,tank:0,hold:0,armor:0,drill:0,hyper:0,weapon:0};
  G.inv=[];G.fit={};G.loot=[];G.partsBought={};invalidateParts();
  G.tech=new Set();G.techLvl={};G.barter=new Set();
  G.found=new Set();G.species=new Set();
  G.ap=null;G.orbit=null;G.watch=null;
  G.land=null;G.surf=null;G.st=null;G.belt=null;G.dig=null;G.cave=null;G.base=null;
  G.crew=[];G.allies=[];G.bases={};G.drones=[];G.droneInventory=0;
  G.rogues=[];G.exiles=[];G.aiRift=null;
  G.relics={};G.relicHint=null;G.bio=0;
  G.mgrs=[];G.blueprints={};G.cantina=null;G.aiRift=null;
  G.orderStamp=0;G.kills=0;G.soldTotal=0;
  G.pirates=[];G.shots=[];G.log=[];G.prompt="";G.msg="";
  G.t=0;G.running=true;
  for(const k in keys)keys[k]=false;
  actEdge=false;prevAct=false;
}
/* сажаем игрока на первую твёрдую планету стартовой системы — общая заготовка */
function landOnTestPlanet(){
  const p=G.sys.planets.find(x=>x.type!=="gas")||G.sys.planets[0];
  const tr=genTerrain(p);
  G.land={p,tr,x:tr.padX,y:groundAt(tr,tr.padX)};
  enterSurface();
  return G.surf.p;
}
/* прогон N кадров выбранного апдейта: время в игре идёт шагами по 1 */
function steps(n,fn){for(let i=0;i<n;i++){actEdge=false;fn(1);G.t+=1;}}

function runTests(){
  const t0=performance.now();
  for(const fn of TEST_SUITES){
    try{fn();}catch(e){TEST.fail++;TEST.failed.push("набор упал: "+(e&&e.message||e));
      TEST.lines.push("✗✗ НАБОР УПАЛ: "+(e&&e.stack||e));}
  }
  const ms=Math.round(performance.now()-t0);
  const head=(TEST.fail?"ПРОВАЛЕНО "+TEST.fail:"ВСЁ ЗЕЛЁНОЕ")+
    " · пройдено "+TEST.pass+" · "+ms+" мс";
  TEST.summary=head;
  const box=document.createElement("pre");
  box.id="testout";
  box.style.cssText="position:fixed;inset:0;z-index:9999;overflow:auto;margin:0;padding:14px;"+
    "background:#05070c;color:#bfe8f0;font:11px/1.5 ui-monospace,monospace;white-space:pre-wrap";
  box.textContent=head+"\n\n"+(TEST.failed.length?"ПРОВАЛЫ:\n"+TEST.failed.map(s=>"  ✗ "+s).join("\n")+"\n\n":"")+
    TEST.lines.join("\n");
  document.body.appendChild(box);
  console.log(head);
  if(TEST.failed.length)console.log("ПРОВАЛЫ:\n"+TEST.failed.join("\n"));
  return head;
}
const TEST_SUITES=[];
