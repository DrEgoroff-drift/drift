/* Двери глав (M910, DESIGN-game §7.3, §7.4): таблица дверей. Запись на части N открывает главу
   N+1 только названным делом: каждое чужое дело, сделанное настоящей функцией игры, дверь не
   открывает, своё — открывает. Внутри части — вытянутая дверь или два разных дела. 72 строки
   диспетчера, тридцать историй на делах вахты, второй акт на участке, шестая — на участке. */
const DR_P=n=>({type:"дверь"+n,mix:"m"+n,name:"Мир "+n});
function drOutside(){
  for(let d=3;d<=9;d++)for(let x=-d;x<=d;x++)for(let y=-d;y<=d;y++){
    if(Math.max(Math.abs(x),Math.abs(y))!==d||!starAt(x,y))continue;
    const S=getSystem(x,y);if(S&&S.station&&!watchHas(S))return S;
  }
  return null;
}
/* дела — настоящими функциями игры */
let drSeed=0;
const DR_DO={
  norm:()=>{const W=watchSt();W.w0=0;W.w1=1;W.ord=1000;W.run.lo=0;return watchJudge(W);},
  srv: ()=>{const W=watchSt();W.w0=0;W.w1=1;W.ord=1000;W.run.lo=1;return watchJudge(W);},
  ransom:()=>{G.credits+=500;const c={name:"Тест "+(++drSeed),seed:drSeed,state:"hostage",ransom:100,shipId:null,order:{kind:"home",sx:G.sx,sy:G.sy}};G.crew.push(c);return ransomPay(c);},
  offer:()=>offerTake({kind:"word",named:1,who:"тест"+(++drSeed),seed:drSeed,sx:G.sx,sy:G.sy}),
  door:()=>folkShut("тест:"+(++drSeed)),
  notch:()=>{const pOn=PLN.on,pBad=PLN.bad;PLN.on=true;PLN.bad=0;
    const q={k:"obelisk",ru:"ЗАРУБКА",x:6000,y:0,h:150,sc:1,seed:(0x0BE1+(++drSeed))>>>0};
    plnActDo(q,"read",{d:.3});const r=plnActDo(q,"carve",{d:.3});PLN.on=pOn;PLN.bad=pBad;return r;},
  mark:()=>{const pOn=PLN.on,pBad=PLN.bad;PLN.on=true;PLN.bad=0;
    const r=plnActDo({k:"obelisk",ru:"ЗАРУБКА",x:6000,y:0,h:150,sc:1,seed:(0x0CE1+(++drSeed))>>>0},"read",{d:.3});PLN.on=pOn;PLN.bad=pBad;return r;},
  hull:()=>hullLost(G.shipId,"тест"),
  handover:()=>{watchHand();clockAdvance(60000);return watchBack();}
};
/* что ещё пишет дело-водитель: срыв пережит с нормой ≥ 90 % — это и норма; засечка — и знак */
const DR_ALSO={srv:["norm"],notch:["mark"]};
function drAt(n){
  resetWorld();G.flownMs=2*FIRST_HOUR_MS;
  G.smena=[];for(let i=1;i<n;i++)G.smena.push(i);
  doorSt().at[n-1]=now();clockAdvance(1000);
}
TEST_SUITES.push(()=>suite("двери глав: часть N открывает N+1 только своим делом",()=>{
  const parts=Object.keys(DOOR_PART).map(Number);
  eq(parts.join(","),"10,19,28,37,46,55,64","двери частей — на 10, 19, 28, 37, 46, 55, 64");
  for(const n of parts){
    drAt(n);
    const need=DOOR_PART[n],p=DR_P(n);
    eq(smenaNext(),n,"глава "+n+": следующая — она");
    eq(smenaLand(p),0,"глава "+n+": посадка в новом месте без дела главу не взводит");
    const wrong=Object.keys(DR_DO).filter(k=>need.indexOf(k)<0&&!(DR_ALSO[k]||[]).some(x=>need.indexOf(x)>=0));
    for(const k of wrong){
      DR_DO[k]();
      ok(doorDone(k,doorSince(n)),"глава "+n+": дело «"+k+"» записано");
      eq(smenaLand(p),0,"глава "+n+": чужое дело «"+k+"» дверь не открывает");
    }
    const k=need.find(x=>DR_DO[x]);
    ok(k,"глава "+n+": у двери есть дело, которое игра умеет ("+need.join("/")+")");
    DR_DO[k]();
    eq(smenaLand(p),n,"глава "+n+": своё дело «"+k+"» — глава взведена");
    const n0=G.log.length;
    eq(smenaOpenHere(p),n,"глава "+n+": прожита");
    ok(doorSt().at[n]>0,"глава "+n+": минута двери записана");
    const said=G.log.slice(n0).find(x=>x.k==="ether"||/диспетчер/.test(x.s));
    ok(said&&said.s.indexOf(doorLine(n))>=0,"глава "+n+": диспетчер говорит её строкой: "+(said?said.s:"—"));
    /* следующая дверь считается с этой минуты: старое дело её не открывает */
    clockAdvance(1000);
    ok(!doorDone(k,doorSince(n+1)),"глава "+(n+1)+": дело главы "+n+" к ней не переходит");
  }
}));
TEST_SUITES.push(()=>suite("двери глав: внутри части — вытянутая дверь или два дела; часть I — без двери",()=>{
  drAt(5);
  ok(doorOpen(5)&&smenaLand(DR_P(5))===5,"часть I: глава 5 — на посадке, без двери");
  drAt(12);
  const k=doorDraw(12);
  ok(DOOR_INNER.indexOf(k)>=0&&doorDraw(12)===k,"глава 12: дверь вытянута один раз ("+k+")");
  const other=Object.keys(DR_DO).find(x=>x!==k&&!(DR_ALSO[x]||[]).length&&x!=="hull");
  if(DR_DO[k]){
    DR_DO[other]();
    eq(smenaLand(DR_P(12)),0,"глава 12: одно чужое дело («"+other+"») — закрыто");
    DR_DO[k]();
    eq(smenaLand(DR_P(12)),12,"глава 12: вытянутое дело «"+k+"» — открыто");
  }else{
    eq(k,"story","глава 12: дверь без водителя здесь — только поворот истории");
  }
  drAt(13);
  const k2=doorDraw(13),two=Object.keys(DR_DO).filter(x=>x!==k2&&!(DR_ALSO[x]||[]).length&&x!=="hull").slice(0,2);
  DR_DO[two[0]]();
  ok(!doorOpen(13),"глава 13: одно дело («"+two[0]+"», вытянута «"+k2+"») — закрыто");
  DR_DO[two[1]]();
  ok(doorOpen(13),"глава 13: два разных дела («"+two.join("», «")+"») — открыто, никто не застревает");
  /* вес «чего не делал»: сделанное много раз тянется реже */
  resetWorld();
  for(let i=0;i<40;i++)doorDeed("norm");
  let nn=0;for(let n=100;n<400;n++){doorSt().dr={};if(doorDraw(n)==="norm")nn++;}
  ok(nn<300/DOOR_INNER.length/3,"сделанное сорок раз тянется редко: норма "+nn+" из 300");
}));
TEST_SUITES.push(()=>suite("двери глав: 72 строки диспетчера из таблицы глав",()=>{
  resetWorld();
  const bad=[],seen=new Set();
  for(let n=1;n<=72;n++){
    const L=doorLine(n);
    if(!L||L.length>120||/сказал|сказала/.test(L))bad.push(n+": "+L);
    seen.add(L);
  }
  eq(bad.length,0,"72 строки, каждая не пуста, ≤ 120 знаков, без ремарки: "+bad.slice(0,3).join(" | "));
  ok(seen.size>=70,"строки разные: "+seen.size+" из 72");
  /* у стойки: свежая глава — её строка десять минут, потом — снова норма */
  G.smena=[1,2];doorSt().at[2]=now();
  eq(doorsDispLine(),doorLine(2),"свежая глава 2 — у диспетчера её строка");
  clockAdvance(DOOR_DISP_MS+1000);
  eq(doorsDispLine(),null,"через десять минут строка уходит");
}));
TEST_SUITES.push(()=>suite("двери глав: тридцать историй поворачиваются на делах вахты",()=>{
  resetWorld();
  eq(DOOR_STORIES.length,30,"историй на делах вахты: "+DOOR_STORIES.length);
  const by={};for(const x of DOOR_STORIES)by[x.k]=(by[x.k]|0)+1;
  ok(DOOR_STORY_KEYS.every(k=>by[k]>=7),"каждое дело ведёт хотя бы семь: "+JSON.stringify(by));
  eq(storyLint().join(" | "),"","линтер историй чист");
  const turns=storyAll().filter(S=>(S.turns||[]).some(T=>T.when||T.unless)).length;
  ok(turns>=30,"историй, чей поворот зависит от руки игрока: "+turns);
  /* поворот: дело ДО знакомства не считается, ПОСЛЕ — считается */
  for(const k of ["norm","handover"]){
    const x=DOOR_STORIES.find(y=>y.k===k),S=storyById(x.id),t0=S.traces[0].id,last=S.traces[S.traces.length-1];
    resetWorld();G.flownMs=2*FIRST_HOUR_MS;
    DR_DO[k]();G.t+=CEL_DAY*2;
    storySeen()[S.id+"."+t0]=storyDay();G.t+=CEL_DAY*2;
    storyTurns(S,storyCtx());
    ok(!storyFlag(S,"wd"),S.id+": дело до знакомства с историей её не поворачивает");
    eq(last.when.flag,"wd",S.id+": последний след ждёт поворота");
    clockAdvance(1000);DR_DO[k]();
    storyTurns(S,storyCtx());
    ok(storyFlag(S,"wd"),S.id+": дело «"+k+"» после знакомства — поворот");
    ok(doorDone("story",0),S.id+": поворот историй — тоже дело (дверь внутри части)");
  }
}));
TEST_SUITES.push(()=>suite("двери глав: второй акт на участке, шестая — на участке",()=>{
  resetWorld();G.flownMs=2*FIRST_HOUR_MS;
  const In=watchStations()[0],Out=drOutside();
  ok(In&&Out,"есть станция участка и станция вне его");
  const six=storyById("sixth_report");
  eq(six.at,"watch","шестая живёт по адресу «участок»");
  ok(storyAddrMatch(six,{key:In.key,sys:In,st:In.station}),"шестая встречается на станции участка");
  ok(!storyAddrMatch(six,{key:Out.key,sys:Out,st:Out.station}),"вне участка шестой нет");
  const E=expAll();E.phase=1;E.day0=celDay();
  ok(expDemandOf(In),"спрос циркуляра — на доске вашей станции");
  eq(expDemandOf(Out),null,"чужая станция — без спроса");
  const m0=gaugeOf(In).m,r=rng(7);
  let S=null;for(let i=0;i<20&&(!S||S.key!==In.key);i++)S=expNearStation(r);
  ok(S&&watchHas(S),"баржа с людьми уходит с вашей станции: "+(S&&S.station.name));
  ok(S.key!==In.key||gaugeOf(In).m<m0-.05,"с ушедшими настроение станции падает: "+m0+" → "+gaugeOf(In).m);
  E.phase=2;E.depDay=celDay();
  dispTestDock(In);
  ok(!expOfferHere(),"«Есть место» без года нормы — нет");
  DR_DO.norm();DR_DO.norm();
  ok(doorSt().y===celDay()&&doorSt().yn===2,"ряд нормы ≥ 90 % считается: с суток "+doorSt().y+", сводок "+doorSt().yn);
  G.t+=CEL_DAY*(DOOR_YEAR+1);
  ok(expOfferHere(),"год нормы ≥ 90 % — «Есть место» на вашей станции");
  dispTestDock(Out);
  ok(!expOfferHere(),"на чужой станции места нет");
}));
TEST_SUITES.push(()=>suite("двери глав: запись — журнал дел и двери переживают сохранение",()=>{
  resetWorld();G.flownMs=2*FIRST_HOUR_MS;
  DR_DO.door();doorDraw(14);doorSt().at[9]=now();
  const s=JSON.parse(JSON.stringify(snapshot()));
  G.wd=null;G.doors=null;
  ok(applySave(s),"запись читается");
  eq(doorWd().door[0],1,"дело «door» на месте");
  eq(doorSt().dr[14],s.doors.dr[14],"вытянутая дверь главы 14 на месте");
  eq(doorSt().at[9],s.doors.at[9],"минута главы 9 на месте");
  /* старая запись и битая — без падения, с пустым журналом */
  const o=JSON.parse(JSON.stringify(s));delete o.wd;delete o.doors;
  ok(applySave(o)&&!doorWd().door&&doorOpen(5)&&!doorOpen(10),"запись до M910: дел нет, часть II ждёт своего дела");
  const b=JSON.parse(JSON.stringify(s));b.wd={norm:["x",null,1],door:"?"};b.doors={at:{1:"q",99:5},dr:{12:"взлом"},y:"z"};
  ok(applySave(b)&&!doorWd().norm&&!doorSt().at[99]&&!doorSt().dr[12]&&doorSt().y===null,"битая запись — пустой журнал, без мусора");
}));
