/* ══════════════ истории: следы, якорь, повороты, каналы ══════════════ */
TEST_SUITES.push(()=>suite("истории: данные здоровы, словарь условий закрыт",()=>{
  resetWorld();
  ok(STORIES.length>=20,"историй не меньше двадцати (есть "+STORIES.length+")");
  const bad=storyLint();
  eq(bad.length,0,"лент нет: "+bad.slice(0,5).join("; "));
  const ids=new Set();let dup=0;
  for(const S of STORIES){if(ids.has(S.id))dup++;ids.add(S.id);}
  eq(dup,0,"id историй уникальны");
  for(const S of STORIES)for(const L of (S.links||[]))
    ok(!!storyById(L),S.id+": связь "+L+" существует");
  /* каждая фиксированная — на станции */
  for(const S of STORIES)if((S.at||"").slice(0,6)==="fixed:"){
    const k=storyFixedAddr(+S.at.slice(6));
    ok(!!k,S.id+": fixed-адрес найден");
    if(k){const p=k.split(",");const s=getSystem(+p[0],+p[1]);ok(!!(s&&s.station),S.id+": по адресу есть станция");}
  }
  /* треть необъяснимого: истории без поворота и без «развязки» — их не меньше четверти */
  const open=STORIES.filter(S=>!S.turns||!S.turns.length).length;
  ok(open>=STORIES.length/4,"без поворота не меньше четверти историй ("+open+" из "+STORIES.length+")");
}));

TEST_SUITES.push(()=>suite("истории: якорь при первой встрече и выдача по каналам",()=>{
  resetWorld();
  G.st=G.sys.station;G.mode="dock";
  const c=storyCtx();
  ok(!!c.key&&!!c.st,"контекст: мы на станции");
  /* плавающая история прибивается, если выпал жребий; если прибилась — навсегда */
  const before=Object.keys(storyPins()).length;
  storyTraces("queue",c);
  const after=Object.keys(storyPins()).length;
  ok(after>=before,"якоря появились или их не стало меньше");
  ok(after<=STORY_PIN_CAP+STORIES.filter(S=>(S.at||"").slice(0,6)==="fixed:").length,"на одно место не больше потолка плавающих");
  for(const id in storyPins())eq(typeof storyPins()[id],"string","якорь — ключ места");
  /* детерминизм жребия */
  const r1=storyAnchorRoll(STORIES[0],"3,4"),r2=storyAnchorRoll(STORIES[0],"3,4");
  eq(r1,r2,"жребий детерминирован парой (история, место)");
  /* очередь: реплика истории, если есть, держится всю посадку */
  G.storyPin["rack_voice"]=G.sys.key;               // прибьём руками историю со строкой на visits:1
  G.visits={};G.visits[G.sys.key]=1;
  G.speech={};
  const a=speechHere(),b=speechHere();
  eq(a.line,b.line,"в одну посадку реплика не меняется");
  ok(typeof a.line==="string"||a.silent,"реплика или молчание");
  /* показ записывает след, и только его */
  const seenN=Object.keys(storySeen()).length;
  ok(seenN>=1,"показанный след записан в G.seen");
  /* стол: история отвечает раньше общей таблицы */
  G.storyPin["report_nothing"]=G.sys.key;
  const tr=putOnTable("strip",0);
  ok(tr&&/невязка|лента/i.test(tr.line||""),"лента на столе у Дальней-2 — ответ истории");
  /* поворот по дням считается лениво */
  const S=storyById("report_nothing");
  ok(!storyFlag(S,"event"),"до срока флага нет");
  G.t+=STORY_DAY*4;
  storyTraces("queue",storyCtx());
  ok(storyFlag(S,"event"),"через трое суток после ленты явление зарегистрировано");
  const q=storyTraces("queue",storyCtx()).filter(h=>h.S.id==="report_nothing");
  ok(q.length===1&&q[0].t.id==="t7","после поворота очередь отдаёт след t7");
  /* эфир: доля */
  let got=0;for(let i=0;i<60;i++){const r=rng(i*7+1);if(storyEtherLine(r)!=null)got++;}
  ok(got>0&&got<60,"эфир берёт строки истории иногда, не всегда ("+got+" из 60)");
  /* слух: о прибитой истории, с адресом */
  const si=storyNewsItem(()=>0);
  ok(!si||(typeof si.sx==="number"&&typeof si.ru==="string"),"слух истории имеет адрес и текст");
  /* кантина: сцены рисуются без ошибок */
  const cn=document.createElement("canvas");cn.width=400;cn.height=200;
  const cc=cn.getContext("2d");
  storyCantFigures(cc,400,180,128);storyCantProps(cc,400,180,128);
  ok(true,"сцены кантины нарисовались");
  for(const p of ["glass","glass_empty","cup","cap","bread","tally","candle","key","jar","paper","stool_empty"])storyProp(cc,p,10,10);
  ok(true,"все вещи стойки нарисовались");
  /* сохранение */
  const snap=snapshot();
  ok(!!snap.seen&&!!snap.storyPin,"следы и якоря в снимке");
  applySave(snap);
  ok(storyFlag(storyById("report_nothing"),"event"),"флаг поворота пережил сохранение");
  G.st=null;G.mode="system";
}));

/* ── M131: связи как данные и птица-переносчик ── */
TEST_SUITES.push(()=>suite("истории: связи через seenOf и след, который уносит птица",()=>{
  resetWorld();
  ok(STORIES.length>=100,"историй не меньше ста (есть "+STORIES.length+")");
  for(const S of STORIES)for(const t of S.traces)if(t.when&&t.when.seenOf){
    const p=t.when.seenOf.split(".");const O=storyById(p[0]);
    ok(!!O&&O.traces.some(x=>x.id===p[1]),S.id+"."+t.id+": seenOf указывает на существующий след "+t.when.seenOf);
  }
  G.st=G.sys.station;G.mode="dock";G.visits={};G.visits[G.sys.key]=1;
  /* без чужого следа связанная история молчит */
  G.storyPin["carried_callsign"]=G.sys.key;G.parrot={name:"Тест",who:"тест",said:0};G.heard=[];
  eq(storyTraces("queue",storyCtx()).filter(h=>h.S.id==="carried_callsign").length,0,"без «Второго стакана» птице нечего сказать");
  storySeen()["second_glass.t1"]=0;
  eq(storyTraces("queue",storyCtx()).filter(h=>h.S.id==="carried_callsign").length,1,"увидели чужой след — связь открылась");
  /* переносчик: след с carry попадает в услышанное птицей */
  G.storyPin["door_found"]=G.sys.key;storySeen()["baker_oven.t4"]=0;
  const h=storyTraces("queue",storyCtx()).find(x=>x.S.id==="door_found");
  ok(!!h,"след с carry доступен");
  storyShow(h);
  ok(heardAll().some(r=>r.kind==="story"&&/дверц/i.test(r.note)),"птица запомнила строку");
  const n=heardAll().length;storyShow(h);
  eq(heardAll().length,n,"повторный показ не дублирует запись");
  G.parrot=null;G.heard=[];G.st=null;G.mode="system";
}));

/* ══════════════ M259: поворот читает руку игрока ══════════════
   when ждёт условия, unless тихо отменяет и ставит else-флаг; развилка не
   предъявляется — это проверяют не тексты, а сама механика флагов. */
TEST_SUITES.push(()=>suite("повороты: рука игрока, развилка молчит",()=>{
  resetWorld();
  const day=storyDay();
  const mk=(id)=>({id,traces:[],turns:[{after:"seen:t1",days:2,set:"gone",unless:{parrot:true},else:"met"}]});
  const S1=mk("~turnA");
  storySeen()["~turnA.t1"]=day;
  G.t+=STORY_DAY*3;
  G.parrot=null;
  storyTurns(S1,storyCtx());
  ok(storyFlag(S1,"gone")&&!storyFlag(S1,"met"),"без поступка — прежний ход мира");
  const S2=mk("~turnB");
  storySeen()["~turnB.t1"]=storyDay()-3;
  G.parrot={ok:1};
  storyTurns(S2,storyCtx());
  ok(storyFlag(S2,"met")&&!storyFlag(S2,"gone"),"с поступком — другой исход, молча");
  const S3={id:"~turnC",traces:[],turns:[{after:"seen:t1",days:0,set:"go",when:{parrot:false}}]};
  storySeen()["~turnC.t1"]=storyDay()-5;
  storyTurns(S3,storyCtx());
  ok(!storyFlag(S3,"go"),"when ложно — поворот ждёт, не сгорает");
  G.parrot=null;
  storyTurns(S3,storyCtx());
  ok(storyFlag(S3,"go"),"when истинно — сработал");
  /* и данные ста историй по-прежнему чисты: else-флаги читаются, ключи есть */
  eq(storyLint().length,0,"storyLint пуст после развилок M259");
  resetWorld();
}));

/* ══════════════ дыра контекста (автор, 30.08): hand меряет место ИСТОРИИ ══════════════
   Через news поворот считается издалека: c.sx/c.sy — игрок, а адрес места
   лежит в ключе. hand обязан читать ключ, как strip. */
TEST_SUITES.push(()=>suite("hand: адрес из ключа места, не игрока",()=>{
  resetWorld();
  settleMap()["5,7"]={handAt:3,name:"тест"};
  const far={sx:0,sy:0,key:"5,7/2"};       /* игрок в 0,0 — история в 5,7 */
  ok(STORY_WHEN.hand(true,null,far),"под рукой — по адресу истории");
  ok(!STORY_WHEN.hand(true,null,{sx:0,sy:0,key:"0,0"}),"чужое место — не под рукой");
  ok(STORY_WHEN.hand(false,null,{sx:0,sy:0,key:"0,0"}),"и hand:false там истинен");
  resetWorld();
}));
