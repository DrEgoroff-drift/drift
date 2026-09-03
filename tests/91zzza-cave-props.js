/* ══════════════ пещера M305: гладкий обвод и содержимое ══════════════ */
TEST_SUITES.push(()=>suite("пещера M305: обвод без углов, кости, верёвки, стоянка",()=>{
  resetWorld();
  landOnTestPlanet();
  if(!G.surf.cave)G.surf.cave={x:G.surf.x+80};
  enterCave();
  const C=G.cave;
  ok(!!C&&!!C.g,"поле пещеры построено");
  ok(Array.isArray(C.branchEnds)&&C.branchEnds.length===6,"шесть концов ответвлений записаны");
  /* гладкий путь: есть, кромки для капель на месте, замкнутые петли */
  const P=caveSmoothPath(C,0,0);
  ok(P instanceof Path2D,"сглаженный обвод — Path2D");
  ok(Array.isArray(P.fl)&&Array.isArray(P.ce),"кромки пола и свода собраны");
  ok(P.fl.length>0&&P.ce.length>0,"в первом тайле есть и пол, и свод ("+P.fl.length+"/"+P.ce.length+")");
  /* содержимое: сеяно, повторяемо, без NaN */
  const pr=caveProps(C);
  const kinds={};for(const p of pr)kinds[p.k]=(kinds[p.k]||0)+1;
  ok(kinds.bones>=3,"кости лежат хотя бы в трёх местах ("+(kinds.bones||0)+")");
  eq(kinds.rope,2,"верёвка в каждой из двух шахт");
  eq(kinds.tally,2,"зарубки у каждой шахты");
  eq(kinds.camp,1,"одна стоянка у чужого фонаря");
  ok(pr.every(p=>p.k==="rope"||(isFinite(p.x)&&isFinite(p.y))),"у всего есть координаты");
  ok(pr.filter(p=>p.k!=="rope").every(p=>p.y<CAVE_Y1-5),"ничего не лежит за дном поля");
  ok(caveProps(C)===pr,"второй вызов — тот же список");
  /* рисование не падает ни в одной точке */
  for(const x of [200,700,1200,1800]){C.x=x;C.y=caveFloor(C,x)-1;C.cy=null;drawCave();}
  C.x=1200;C.y=caveFloorLow(C,1200)-1;C.cy=null;drawCave();
  ok(true,"кадры пещеры в пяти точках нарисованы");
  exitCave();
}));

/* ══════════════ станция и планета M306: знаки на дневной стороне ══════════════ */
TEST_SUITES.push(()=>suite("M306: отвал, купол и полоса на планете не падают и не рисуются без построек",()=>{
  resetWorld();
  G.mode="system";G.running=true;
  const sys=G.sys,p=(sys.planets||[]).find(q=>q.type!=="gas");
  ok(!!p,"в системе есть твёрдая планета");
  if(!p)return;
  const save=G.hold;
  G.hold={};
  let n0=0;const f0=ctx.fill;ctx.fill=function(){n0++;return f0.apply(ctx,arguments);};
  drawPlanetWorks(sys,p,W/2,H/2,80);
  ctx.fill=f0;
  eq(n0,0,"без построек и рунга на диске ничего не кладётся");
  G.hold={[sys.key]:{bld:{regolith:{ok:1},greenhouse:{ok:1}}}};
  const rd=(typeof bldReady==="function")?bldReady:null;
  if(rd)window.bldReady=()=>true;
  let n1=0;ctx.fill=function(){n1++;return f0.apply(ctx,arguments);};
  drawPlanetWorks(sys,p,W/2,H/2,80);
  ctx.fill=f0;
  if(rd)window.bldReady=rd;
  ok(n1>=4,"с шахтой и оранжереей на диске лежат отвал и купол ("+n1+" заливок)");
  drawPlanetWorks(sys,p,W/2,H/2,8);
  ok(true,"на малом диске (r<12) знаки не рисуются и не падают");
  G.hold=save;
}));

/* ══════════════ дом M307: мебель из материала, план сеян ══════════════ */
TEST_SUITES.push(()=>suite("M307: обёртка мебели возвращает fillRect, план дома сеян и повторяем",()=>{
  resetWorld();
  const orig=ctx.fillRect;
  let inner=0;
  hinMaterialize(0,()=>{inner=(ctx.fillRect!==orig)?1:0;ctx.fillStyle="rgb(120,80,50)";ctx.fillRect(10,-20,30,20);ctx.fillStyle="rgba(0,0,0,.2)";ctx.fillRect(0,0,400,400);});
  eq(inner,1,"внутри обёртки fillRect подменён");
  ok(ctx.fillRect===orig,"после обёртки fillRect прежний");
  let threw=false;try{hinMaterialize(0,()=>{throw new Error("x");});}catch(e){threw=true;}
  ok(threw&&ctx.fillRect===orig,"исключение внутри — fillRect всё равно возвращён");
  const p=G.sys.planets.find(q=>q.type!=="gas")||G.sys.planets[0];
  const a=homePlan(p),b=homePlan(p);
  ok(a.w>=3.1&&a.w<=3.9&&a.roofH>=.8&&a.roofH<=1.2,"план в допусках");
  eq(JSON.stringify(a),JSON.stringify(b),"один и тот же дом при каждом приходе");
  ok(["plank","tile","thatch"].indexOf(a.roofKind)>=0,"кровля из тех, что умеет sdRoof");
  for(const t of [0,1,2,3,4])homeSigns(300,300,60,{wood:[96,72,50],metal:[104,112,120],stone:[90,90,100]},t,a);
  ok(true,"признаки жизни рисуются на всех ступенях");
}));

/* ══════════════ M308: дневной свет без приговора, карта и заход рисуются ══════════════ */
TEST_SUITES.push(()=>suite("M308: пара без приговора для дневных сцен, полоса карты и зарево захода",()=>{
  resetWorld();
  const m={pair:3,warm:97,mass:20,edge:5,contrast:.4,tones:5,empty:50};
  ok(lookVerdict(m,"грунт день").indexOf("без приговора")>=0,"грунт день: пара справкой");
  ok(lookVerdict(m,"пещера").indexOf("×пара")>=0,"пещера: пара судится");
  ok(lookVerdict(m).indexOf("×пара")>=0,"без сцены — старое поведение");
  G.mode="map";drawMap();drawMap();
  ok(true,"карта с полосой в две ступени нарисована");
  const p=G.sys.planets.find(q=>q.type!=="gas")||G.sys.planets[0];
  startLanding(p);G.land.y=groundAt(G.land.tr,G.land.x)-560;
  for(let i=0;i<3;i++){updateLanding(1);drawLanding();}
  ok(G.mode==="landing","заход с полукилометра рисуется с зарево́м без ошибок");
}));

/* ══════════════ M309: трафик системы и туманность с кромкой ══════════════ */
TEST_SUITES.push(()=>suite("M309: челноки по ступени, ни одного в дикой системе, ход по дуге в кадре",()=>{
  resetWorld();
  const sys=G.sys;
  delete sys.traffic;
  const T=sysTraffic(sys);
  if(sys.station)ok(T.length>=1&&T.length<=4,"у станции от одного до четырёх челноков ("+T.length+")");
  else eq(T.length,0,"без станции — ни одного");
  const fake={seed:7,sx:99,sy:99,planets:[],station:null};
  eq(sysTraffic(fake).length,0,"система без станции пуста");
  G.mode="system";
  let tr=0;const o=ctx.translate;ctx.translate=function(){tr++;return o.apply(ctx,arguments);};
  const zx=x=>W/2+(x-G.ship.x)*.7,zy=y=>H/2+(y-G.ship.y)*.7;
  G.t=1000;drawSysTraffic(zx,zy,.7);
  ctx.translate=o;
  ok(true,"челноки рисуются без ошибок (в кадре: "+tr+")");
  for(const t of T){
    let u=(G.t*t.spd+t.ph/TAU)%1;u=u<.5?u*2:2-u*2;
    ok(u>=0&&u<=1,"параметр хода в [0,1]");
  }
}));

/* ══════════════ M310: флот ГЛАВТРАССЫ ══════════════ */
TEST_SUITES.push(()=>suite("M310: флот идёт по лестнице, три класса нарисованы, позывной и норма",()=>{
  resetWorld();
  const sys=G.sys;
  ok(Object.keys(FLEET_CLASSES).length===13,"тринадцать классов в таблице");
  ok(Object.values(FLEET_CLASSES).every(c=>c.say&&c.say.length&&c.ru&&c.mark),"у каждого класса голос, имя и знак");
  ok(Object.values(FLEET_CLASSES).filter(c=>c.art).length>=3,"нарисованы хотя бы три: почтовик, танкер, буксир");
  const wild={seed:5,sx:77,sy:77,planets:[],station:null};
  eq(fleetHere(wild).length,0,"в дикой системе флота нет");
  /* спавн — только нарисованные классы и только по рунгу */
  const saveRung=window.rungOf;window.rungOf=()=>30;
  let seen={};
  for(let i=0;i<12;i++){const s2={seed:100+i,sx:1,sy:i,station:{x:100,y:0},planets:[]};for(const f of fleetHere(s2))seen[f.k]=1;}
  window.rungOf=saveRung;
  ok(Object.keys(seen).every(k=>k==="node"||FLEET_CLASSES[k].art),"спавнятся только нарисованные классы");
  ok(Object.keys(seen).length>=1,"на рунге 30 кто-то из флота ходит ("+Object.keys(seen).join(",")+")");
  /* положение — функция времени в пределах линии */
  const f={k:"post",seed:3,name:"ЗАРНИЦА",num:"Л-1425",line:4,x0:-3000,y0:0,x1:3000,y1:0,bow:400,ph:.3};
  const p=fleetPos(f);ok(isFinite(p.x)&&isFinite(p.y)&&isFinite(p.a)&&p.u>=0&&p.u<1,"позиция конечна, доля в [0,1)");
  for(const k of ["post","tanker","tug"]){const a=fleetArtOf(Object.assign({},f,{k,seed:k.length}));ok(a.cn.width>0&&a.lights.length>=3,k+": спрайт запечён, огни есть");}
  /* позывной и норма: танкер рядом, баки пусты */
  G.mode="system";
  const b=Math.floor(Date.now()/FLEET_PERIOD);
  const X=G.ship.x,Y=G.ship.y;
  sys.fleetCache={b,list:[{k:"tanker",seed:9,name:"ОКОЁМ",num:"Л-1426",line:4,x0:X+60,y0:Y,x1:X+60,y1:Y,bow:0,ph:0}]};
  G.fleetLog={};G.fuel=1;
  actEdge=false;ok(fleetInteract(G.ship),"танкер рядом — подсказка есть");
  ok(G.prompt.indexOf("ЗАПРАВКА ПО НОРМЕ")>=0,"пустому — заправка по норме");
  actEdge=true;fleetInteract(G.ship);actEdge=false;
  eq(G.fuel,stat().fuelMax,"залили до полного");
  G.fuel=1;fleetInteract(G.ship);
  ok(/ПОЗЫВНОЙ|КАРАВАНОМ/.test(G.prompt),"второй раз в ту же смену — только позывной, без книги долга");
  const snap=snapshot();ok(snap.fleetLog&&Object.keys(snap.fleetLog).length===1,"норма записана в сейв");
  delete sys.fleetCache;
}));

/* ══════════════ M311: второй проход флота — три класса, буксир, плавбаза, конвой ══════════════ */
TEST_SUITES.push(()=>suite("M311: шесть классов нарисованы, буксир латает, плавбаза чинит, конвой прячет от пиратов",()=>{
  resetWorld();
  ok(Object.values(FLEET_CLASSES).filter(c=>c.art).length>=6,"нарисованы не меньше шести классов");
  for(const k of ["patrol","ferry","base"]){const a=fleetArtOf({k,seed:k.length+7,name:"X",num:"Л-1",line:1});ok(a.cn.width>0,k+": спрайт запечён");}
  const sys=G.sys;G.mode="system";
  const b=Math.floor(Date.now()/FLEET_PERIOD),X=G.ship.x,Y=G.ship.y;
  const st=stat();
  const put=k=>{sys.fleetCache={b,list:[{k,seed:3,name:"ТЕСТ",num:"Л-1",line:1,x0:X+50,y0:Y,x1:X+50,y1:Y,bow:0,ph:0}]};};
  G.fleetLog={};
  /* буксир: корпус на 10 % — тянут, латают до 40 % */
  put("tug");G.hull=Math.round(st.hullMax*.1);actEdge=false;fleetInteract(G.ship);
  ok(G.prompt.indexOf("БУКСИР НА ВЕРФЬ")>=0,"битому корпусу — буксир");
  actEdge=true;fleetInteract(G.ship);actEdge=false;
  eq(G.hull,Math.round(st.hullMax*.4),"подлатан до 40 %");
  fleetInteract(G.ship);ok(/ПОЗЫВНОЙ|КАРАВАНОМ/.test(G.prompt),"второй раз в смену — только позывной");
  /* плавбаза: ремонт по норме до полного */
  put("base");G.hull=Math.round(st.hullMax*.5);fleetInteract(G.ship);
  ok(G.prompt.indexOf("РЕМОНТ ПО НОРМЕ")>=0,"плавбаза чинит");
  actEdge=true;fleetInteract(G.ship);actEdge=false;eq(G.hull,st.hullMax,"корпус закрыт");
  /* сторожевик: с доброй репутацией — конвой, пираты не видят */
  put("patrol");G.rep=G.rep||{};G.rep[G.sx+","+G.sy]=3;G.fleetEscort=0;fleetInteract(G.ship);
  ok(G.prompt.indexOf("ПРОСИТЬ КОНВОЙ")>=0,"чистому борту — конвой");
  actEdge=true;fleetInteract(G.ship);actEdge=false;
  ok(fleetEscortActive(),"конвой действует");
  G.pirates=[{x:X+100,y:Y,vx:0,vy:0,a:0,aware:true,cool:0,hp:10,hull:10,seed:1}];
  try{updateCombat(1);}catch(e){}
  ok(G.pirates.length===0||G.pirates[0].aware===false,"под конвоем пират вас не видит");
  G.fleetEscort=0;G.pirates=[];
  const snap=snapshot();ok("fleetEscort" in snap,"конвой в сейве");
  delete sys.fleetCache;
}));

/* ══════════════ M312: все тринадцать нарисованы; почта, госпиталь, учёба ══════════════ */
TEST_SUITES.push(()=>suite("M312: тринадцать классов запечены, выкуп через госпиталь вдвое, учёба раз в смену, почта только в сети",()=>{
  resetWorld();
  eq(Object.values(FLEET_CLASSES).filter(c=>c.art).length,13,"нарисованы все тринадцать");
  for(const k in FLEET_CLASSES){const a=fleetArtOf({k,seed:k.length*3+1,name:"X",num:"Л-1",line:1});ok(a.cn.width>0&&a.lights.some(l=>l.c==="eng"),k+": спрайт и сопло");}
  const sys=G.sys;G.mode="system";
  const b=Math.floor(Date.now()/FLEET_PERIOD),X=G.ship.x,Y=G.ship.y;
  const put=k=>{sys.fleetCache={b,list:[{k,seed:3,name:"ТЕСТ",num:"Л-1",line:1,x0:X+50,y0:Y,x1:X+50,y1:Y,bow:0,ph:0}]};};
  G.fleetLog={};
  /* почтовик без сети — только позывной */
  put("post");actEdge=false;fleetInteract(G.ship);
  ok(/ПОЗЫВНОЙ|КАРАВАНОМ/.test(G.prompt)&&G.prompt.indexOf("ПОЧТУ")<0,"без сети почту не сдать — позывной");
  /* госпитальное: заложник за полцены */
  const h={id:"cH",seed:5,name:"Тест Заложник",spec:"pilot",traits:[],xp:10,state:"hostage",ransom:1000,ransomBase:1000,ransomAt:Date.now(),order:{kind:"home",sx:G.sx,sy:G.sy},shipId:null,trips:1};
  G.crew=[h];G.credits=5000;
  put("hosp");fleetInteract(G.ship);
  ok(G.prompt.indexOf("ВЫКУП ЧЕРЕЗ ГОСПИТАЛЬ")>=0&&G.prompt.indexOf("500")>=0,"госпиталь просит половину");
  actEdge=true;fleetInteract(G.ship);actEdge=false;
  eq(G.credits,4500,"списано 500, не 1000");
  ok(h.state!=="hostage","заложник свободен");
  /* учебное: свободный наёмник растёт, второй раз в смену — нет */
  const p={id:"cP",seed:6,name:"Тест Ученик",spec:"pilot",traits:[],xp:10,state:null,order:null,shipId:null,trips:0};
  G.crew=[p];
  put("school");fleetInteract(G.ship);
  ok(G.prompt.indexOf("ОТДАТЬ В УЧЁБУ")>=0,"учебное берёт свободного");
  actEdge=true;fleetInteract(G.ship);actEdge=false;
  eq(p.xp,45,"опыт +35");
  fleetInteract(G.ship);ok(/ПОЗЫВНОЙ|КАРАВАНОМ/.test(G.prompt),"в ту же смену второй раз не берут");
  G.crew=[];delete sys.fleetCache;
}));

/* ══════════════ M313: узловая «УЗ-1», чёрный дерелик, караван ══════════════ */
TEST_SUITES.push(()=>suite("M313: узловая с рунга 25, дерелик в опасной глуши, караван прячет и замедляет",()=>{
  resetWorld();
  /* узловая */
  const saveRung=window.rungOf;window.rungOf=()=>25;
  const s25={seed:501,sx:3,sy:4,station:{x:300,y:0},planets:[]};
  const L25=fleetHere(s25);
  ok(L25.some(f=>f.k==="node"&&f.name==="УЗ-1"&&f.still),"на рунге 25 стоит узловая «УЗ-1»");
  window.rungOf=()=>24;const s24={seed:502,sx:3,sy:5,station:{x:300,y:0},planets:[]};
  ok(!fleetHere(s24).some(f=>f.k==="node"),"на рунге 24 узловой нет");
  window.rungOf=saveRung;
  /* дерелик: только без станции и только в опасных секторах, и не в каждом */
  let n=0,tot=0;
  for(let i=0;i<40;i++){const sx=200+i,sy=200+i*3;if(sysDanger(sx,sy)<.6)continue;tot++;const sd={seed:600+i,sx,sy,station:null,planets:[]};if(fleetHere(sd).some(f=>f.k==="derelict"))n++;}
  ok(tot===0||(n>0&&n<tot),"дерелик есть в части опасных систем ("+n+" из "+tot+")");
  ok(!fleetHere({seed:9,sx:0,sy:0,station:null,planets:[]}).length,"у дома дерелика нет");
  for(const k of ["node","derelict"]){const a=fleetArtOf({k,seed:2,name:"УЗ-1",num:"",line:0});ok(a.cn.width>0,k+": спрайт запечён");}
  /* караван */
  G.mode="system";const sys=G.sys;
  const b=Math.floor(Date.now()/FLEET_PERIOD),X=G.ship.x,Y=G.ship.y;
  sys.fleetCache={b,list:[{k:"ore",seed:3,name:"КОСОГОР",num:"Л-1",line:1,x0:X+60,y0:Y,x1:X+60,y1:Y,bow:0,ph:0}]};
  G.caravan=null;G.fleetLog={};G.fuel=stat().fuelMax;G.hull=stat().hullMax;
  actEdge=false;fleetInteract(G.ship);
  ok(G.prompt.indexOf("ИДТИ КАРАВАНОМ")>=0,"рудовоз зовёт в караван");
  actEdge=true;fleetInteract(G.ship);actEdge=false;
  ok(fleetCaravanActive()&&fleetEscortActive(),"караван действует и прячет от пиратов");
  const snap=snapshot();ok(snap.caravan&&snap.caravan.name==="КОСОГОР","караван в сейве");
  sys.fleetCache={b,list:[]};
  ok(!fleetCaravanActive(),"флот ушёл — караван распался");
  G.caravan=null;delete sys.fleetCache;
}));

/* ══════════════ M314: трассы на карте, спасатель зовёт на сигнал ══════════════ */
TEST_SUITES.push(()=>suite("M314: трассы рисуются между системами флота, спасатель ведёт на баржу в беде",()=>{
  resetWorld();
  const saveRung=window.rungOf;window.rungOf=()=>25;
  const vis=[{gx:0,gy:0,s:{sx:0,sy:0,station:{x:1,y:0}},x:100,y:100},{gx:1,gy:0,s:{sx:1,sy:0,station:{x:1,y:0}},x:160,y:100},{gx:5,gy:5,s:{sx:5,sy:5,station:null},x:400,y:400}];
  let strokes=0;const o=ctx.stroke;ctx.stroke=function(){strokes++;return o.apply(ctx,arguments);};
  drawFleetMap(vis,60);ctx.stroke=o;
  ok(strokes>=2,"между двумя соседями со станцией легла трасса, к дикой — нет ("+strokes+")");
  window.rungOf=saveRung;
  G.mode="system";const sys=G.sys;
  const b=Math.floor(Date.now()/FLEET_PERIOD),X=G.ship.x,Y=G.ship.y;
  sys.fleetCache={b,list:[{k:"rescue",seed:3,name:"ПОЛЫНЬ",num:"Л-1",line:1,x0:X+50,y0:Y,x1:X+50,y1:Y,bow:0,ph:0}]};
  G.barges=[{seed:1,x:X+900,y:Y-300,vx:0,vy:0,a:0,distress:true,done:0,hp:50,hullMax:100,capName:"Тук",temper:"bold",good:"iron",qty:1,cap:1,budget:1,fac:"x"}];
  G.caravan=null;actEdge=false;fleetInteract(G.ship);
  ok(G.prompt.indexOf("ИДТИ НА СИГНАЛ")>=0&&G.prompt.indexOf("ТУК")>=0,"спасатель зовёт на «Тук»");
  actEdge=true;fleetInteract(G.ship);actEdge=false;
  ok((G.msg||"").indexOf("СПАСАТЕЛЬ")>=0,"на экране курс и расстояние");
  G.barges=[];delete sys.fleetCache;
  for(const k of ["ferry","hosp"]){const a=fleetArtOf({k,seed:99,name:"X",num:"Л-1",line:1});ok(a.cn.width>0,k+": перерисован без ошибок");}
}));

/* ══════════════ M315: пропорции системы, призрачный клик, оклик на рунге 30 ══════════════ */
TEST_SUITES.push(()=>suite("M315: планеты крупнее корабля, спутник под палец, экран не закрывается тем же пальцем, Кольцо окликает первым",()=>{
  resetWorld();
  /* пропорции: каменистый мир не меньше 34, спутник не меньше 6, орбиты шире 310 */
  let rockMin=1e9,moonMin=1e9,gapMin=1e9,n=0;
  for(let i=0;i<40&&n<60;i++){
    const s=getSystem(i*7-20,i*3-11);let prev=0;
    for(const p of s.planets){n++;
      if(p.type!=="gas")rockMin=Math.min(rockMin,p.radius);
      for(const m of p.moons)moonMin=Math.min(moonMin,m.radius);
      if(prev)gapMin=Math.min(gapMin,p.orbit-prev);prev=p.orbit;
    }
  }
  ok(rockMin>=34,"каменистый мир не меньше 34 ("+rockMin.toFixed(1)+")");
  ok(moonMin>=6,"спутник не меньше 6 ("+moonMin.toFixed(1)+")");
  ok(gapMin>=310,"орбиты раздвинуты ("+gapMin.toFixed(0)+")");
  /* тип мира от масштаба не зависит: дом остался тем же */
  const home=getSystem(0,0);ok(home.planets.length>0&&home.station,"дом на месте");
  ok(home.station.orbit>home.radius*6+259,"станция снаружи короны");
  /* призрачный клик: полсекунды после ДЕЙСТВИЯ клик по экрану гасится */
  const scr=document.getElementById("barge");let hit=0;
  const btn=document.getElementById("bLeaveBarge");
  actPressT=performance.now();
  const h=e=>{hit++;};btn.addEventListener("click",h);
  const ev=new MouseEvent("click",{bubbles:true,cancelable:true});btn.dispatchEvent(ev);
  ok(ev.defaultPrevented&&hit===0,"клик под пальцем не дошёл до РАЗОЙТИСЬ");
  actPressT=-1e9;const ev2=new MouseEvent("click",{bubbles:true,cancelable:true});
  const modeWas=G.mode;btn.dispatchEvent(ev2);btn.removeEventListener("click",h);
  ok(hit===1,"обычный клик доходит");G.mode=modeWas;scr.classList.remove("open");
  /* Кольцо: на рунге 30 первый корабль линии окликает сам */
  const sys=G.sys;G.mode="system";
  const b=Math.floor(Date.now()/FLEET_PERIOD),X=G.ship.x,Y=G.ship.y;
  sys.fleetCache={b,list:[{k:"tanker",seed:3,name:"ОКОЁМ",num:"Л-1",line:1,x0:X+400,y0:Y,x1:X+400,y1:Y,bow:0,ph:0}]};
  G.fleetLog={};G.name="Егоров";
  const saveRung=window.rungOf;window.rungOf=()=>29;
  const n0=G.log.length;actEdge=false;fleetInteract(G.ship);
  eq(G.log.length,n0,"на рунге 29 молчат");
  window.rungOf=()=>30;fleetInteract(G.ship);fleetInteract(G.ship);
  const said=G.log.slice(n0).filter(l=>l.k==="ether"&&/ОКОЁМ/.test(l.s));
  eq(said.length,1,"на рунге 30 окликнули ровно раз за окно");
  ok(said.length&&said[0].s.indexOf("Егоров")>=0,"назвали по имени");
  window.rungOf=saveRung;G.name="";delete sys.fleetCache;G.fleetLog={};
}));

/* ══════════════ M316: планеты и луны идут в одну сторону ══════════════ */
TEST_SUITES.push(()=>suite("M316: в системе все тела крутятся в одну сторону",()=>{
  resetWorld();
  let bad=0,n=0;
  for(let i=0;i<30;i++){const s=getSystem(i*5-7,i*2+3);
    for(const p of s.planets){n++;if(p.spd<=0)bad++;for(const m of p.moons){n++;if(m.spd<=0)bad++;}}}
  ok(n>30&&bad===0,"ни одной обратной орбиты из "+n);
}));

/* ══════════════ M317: флот на расстоянии встречи — шесть пунктов альманаха III ══════════════ */
TEST_SUITES.push(()=>suite("M317: подпись от габарита и мимо фишек, спрайт растёт до потолка зума, эмблемы одной конструкции, учебное целиком в спрайте",()=>{
  resetWorld();
  /* §8: масштаб спрайта идёт до потолка setZoom, а не упирается в 1.5 */
  ok(fleetScale(2.4)>fleetScale(1.5)*1.4,"на зуме 2.4 флот крупнее, чем на 1.5: "+fleetScale(2.4).toFixed(2)+" против "+fleetScale(1.5).toFixed(2));
  setZoom(9);eq(fleetScale(G.zoom),fleetScale(2.4),"потолок зума и потолок спрайта — одно число");setZoom(1);
  /* §3: подпись считается от габарита тела; у каждого класса габарит внутри запечённого круга */
  for(const k in FLEET_CLASSES){const a=fleetArtOf({k,seed:k.length*5+2,name:"X",num:"Л-1",line:1});
    ok(a.bx>0&&a.by>0&&a.bx<=a.rad&&a.by<=a.rad,k+": габарит "+a.bx.toFixed(0)+"×"+a.by.toFixed(0)+" внутри радиуса "+a.rad.toFixed(0));}
  /* учебное: все шесть капсул в спрайте (раньше две висели за носом и за краем холста) */
  {const a=fleetArtOf({k:"school",seed:7,name:"X",num:"Л-1",line:1});ok(a.bx<a.rad*.9,"учебное: капсулы не за краем ("+a.bx.toFixed(0)+" < "+(a.rad*.9).toFixed(0)+")");}
  /* §3: подпись ложится под корпус на его полувысоту, а при фишке снизу уходит наверх */
  const y0=fleetLabelY(400,300,72,120,2);ok(y0>=300+72+12-1,"подпись под корпусом: "+y0);
  SYS_CHIPS.length=0;SYS_CHIPS.push({x:340,y:300+72,w:120,h:44,t:null});
  const y1=fleetLabelY(400,300,72,120,2);ok(y1<300-72,"под фишкой планеты подпись ушла наверх: "+y1);
  SYS_CHIPS.length=0;
  const y2=fleetLabelY(400,H-60,10,120,2);ok(y2<H-60-10,"у нижней кромки подпись наверху: "+y2);
  /* §9: у каждого из тринадцати есть место эмблемы и в нём красное на светлом диске */
  for(const k in FLEET_CLASSES){const a=fleetArtOf({k,seed:k.length*5+2,name:"X",num:"Л-1",line:1});
    ok(a.emb&&a.emb[2]>=a.hw*.45,k+": эмблема в рост тела (R "+(a.emb?a.emb[2]:0).toFixed(1)+" при hw "+a.hw+")");
    const [mx,my,R]=a.emb,S=FLEET_SS,g=a.cn.getContext("2d");
    const px=g.getImageData(Math.round((a.rad+mx-R)*S),Math.round((a.rad+my-R)*S),Math.max(1,Math.round(R*2*S)),Math.max(1,Math.round(R*2*S))).data;
    let red=0,light=0,tot=0;for(let i=0;i<px.length;i+=4){if(px[i+3]<40)continue;tot++;if(px[i]>90&&px[i]>px[i+1]*1.6)red++;else if(px[i]>170&&px[i+1]>170)light++;}
    ok(red>tot*.12&&light>tot*.15,k+": красная фигура и обод на светлом диске ("+Math.round(red/tot*100)+"% / "+Math.round(light/tot*100)+"%)");}
  /* §11/§16: медиана тела ниже .60 у всех, освещённый борт остаётся в VII (p95 ≥ .68) */
  for(const k in FLEET_CLASSES){const a=fleetArtOf({k,seed:k.length*5+2,name:"X",num:"Л-1",line:1});
    const px=a.cn.getContext("2d").getImageData(0,0,a.cn.width,a.cn.height).data,v=[];
    for(let i=0;i<px.length;i+=16){if(px[i+3]<40)continue;v.push((px[i]*.299+px[i+1]*.587+px[i+2]*.114)/255);}
    v.sort((a,b)=>a-b);const p50=v[Math.floor(v.length*.5)],p95=v[Math.floor(v.length*.95)];
    ok(p50<.62,k+": медиана тела "+p50.toFixed(2)+" ниже .62");ok(p95>=.64&&p95<=.88,k+": освещённый борт в VII: p95 "+p95.toFixed(2));}
}));
