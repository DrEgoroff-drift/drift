/* ══════════════ зимовка: месяц одному ══════════════
   M197. Наряд с доски, каких в игре нет: не «привезти», не «убить», не
   «найти», а ПРОСТОЯТЬ. Месяц на дальней станции, один. Держать баланс,
   писать дневник, слушать стену, ждать баржу. Денег мало, книжка полна.

   ПОЧЕМУ ЭТО ОДНА КОМНАТА. Соблазн был нарисовать станцию с отсеками и ходить
   по ним. Но зимовка — про одиночество и распорядок, а одиночество — это как
   раз одна комната, из которой месяц не выходят. Всё остальное живёт в
   приборах на панели и в звуке за стеной: станция вокруг ЕСТЬ, её просто не
   видно, и от этого её больше.

   БАЛАНС — ЭТО ВЫБОР, А НЕ АРИФМЕТИКА. Реактор даёт меньше с каждой неделей
   (лёд, износ), а потребителей четверо, и все нужны. К концу месяца выключать
   приходится что-то живое: тепло, воздух, свет или антенну. Игра нигде не
   говорит, что правильно.

   ДНЕВНИК — ТЕ ЖЕ БЛАНКИ, ЧТО У ОТКРЫТКИ (25h). Это не экономия: зимовщик и
   пишет бланками, потому что писать ему некому и не о чем, а форма — это то,
   что остаётся, когда слова кончились. Страница дневника устроена как
   открытка, которую никто не отправит.

   ПРАВИЛА ФАЙЛА:
   1. Ни одной цифры «до конца осталось» крупно на кадре. День и месяц — да,
      обратный отсчёт — нет: считать дни это дело зимовщика, а не интерфейса.
   2. Сутки идут, только когда смена сдана. Время здесь не капает само.
   3. Ничего не моделируется за кадром: всё состояние — в G.win. */
const WIN_DAYS=30;                 /* месяц */
const WIN_PAY=1400;                /* и это правда немного */
const WIN_USE=["heat","air","light","ant"];
const WIN_RU={heat:"ТЕПЛО",air:"ВОЗДУХ",light:"СВЕТ",ant:"АНТЕННА"};
const WIN_MIN={heat:2,air:2,light:1,ant:1};       /* ниже — начинается плохое */
const WIN_BAD={heat:"мёрз",air:"дышал тяжело",light:"сидел в темноте",ant:"остался без эфира"};
/* поломки: каждая отнимает у реактора единицу, пока не починена */
const WIN_FAULT=[
  {k:"ice",  ru:"обледенел радиатор",      fix:"сбить лёд"},
  {k:"pump", ru:"насос контура стучит",    fix:"перебрать насос"},
  {k:"filt", ru:"фильтр забился пылью",    fix:"вытряхнуть фильтр"},
  {k:"cell", ru:"просела батарея",         fix:"переставить банки"},
  {k:"seal", ru:"свистит уплотнение шлюза",fix:"подтянуть уплотнение"}
];
const WIN_FAULT_BY={};WIN_FAULT.forEach(f=>WIN_FAULT_BY[f.k]=f);
/* ── стена ──
   Станция разговаривает: сначала железом, к концу месяца — почти словами.
   Ничего сверхъестественного здесь нет и не будет: объяснение всегда в
   первой половине списка, а к концу просто дольше слушаешь. */
const WIN_WALL_EARLY=[
  "…где-то капает. Считал капли, сбился на четырёхстах.",
  "…вентиляция берёт ноту и держит. Всегда одну и ту же.",
  "…металл щёлкает на морозе, будто кто-то ходит по коридору.",
  "…под полом гудит насос. Ровно, как ему и положено.",
  "…ветер снаружи трогает антенну, и это слышно через всю станцию.",
  "…что-то шуршит в вентиляции. Пыль. Наверное, пыль."
];
const WIN_WALL_LATE=[
  "…шаги в коридоре. Свои. Обернулся всё равно.",
  "…в трубе голос. Слов нет, а интонация есть.",
  "…станция вздохнула. Так вздыхают, когда собираются что-то сказать.",
  "…показалось, что позвали по имени. Имени тут никто не знает.",
  "…тишина стала плотной. Её теперь слышно отдельно от всего.",
  "…кто-то дышит в стене. Это насос. Это насос."
];
function winAll(){return G.win||null;}
function winOn(){return !!(G.win&&!G.win.done);}
/* мощность реактора: падает с неделями и с каждой непочиненной поломкой */
function winCap(W){
  const wk=Math.floor((W.day||0)/7);
  return Math.max(3,9-wk-(W.faults||[]).length);
}
function winDraw_(W){return WIN_USE.reduce((s,k)=>s+(W.pw[k]|0),0);}
function winOver(W){return winDraw_(W)>winCap(W);}
/* что сегодня плохо: список бед по недобору */
function winBad(W){
  return WIN_USE.filter(k=>(W.pw[k]|0)<WIN_MIN[k]).map(k=>WIN_BAD[k]);
}
/* ── взять наряд ── */
function winOfferHere(){
  if(winOn()||!G.st||!G.sys)return null;
  /* далёкая станция: чем дальше от ядра, тем вероятнее, что зимовщик нужен */
  const d=Math.hypot(G.sx,G.sy);
  if(d<9)return null;
  const r=rng(hashi(G.sx,G.sy,0x21A7+Math.floor(celDay()/9)));
  if(r()>.42)return null;
  /* место — соседняя система с планетой: станция стоит НЕ здесь, сюда её
     только нанимают */
  for(let i=0;i<40;i++){
    const sx=G.sx+Math.round((r()-.5)*10), sy=G.sy+Math.round((r()-.5)*10);
    if(!starAt(sx,sy))continue;
    const S=getSystem(sx,sy);
    const p=(S.planets||[]).find(q=>q.type!=="gas");
    if(!p)continue;
    return {sx,sy,pname:p.name,sysName:S.name,pi:p.idx};
  }
  return null;
}
function winTake(o){
  if(!o||winOn())return false;
  G.win={sx:o.sx,sy:o.sy,pi:o.pi|0,pname:o.pname,sysName:o.sysName,
    day:1,days:WIN_DAYS,
    pw:{heat:3,air:3,light:2,ant:1},
    faults:[],diary:[],wall:0,cold:0,dark:0,
    home:{sx:G.sx,sy:G.sy},
    t0:Date.now(),done:0};
  thingAdd("paper","Наряд на зимовку · "+o.pname,
    "месяц один · держать баланс, вести дневник, дождаться баржи · оплата по возвращении");
  recordAdd("станция "+(G.st.name||""),"нанят зимовщиком на "+o.pname);
  logAdd("tech","Зимовка: "+o.pname+" · месяц · баржа придёт за вами");
  enterWinter();
  return true;
}
function enterWinter(){
  if(!G.win)return;
  for(const k in keys)keys[k]=false;
  G.mode="winter";
  G.win.zone=null;G.win.said=0;
  say("Зимовка. Сутки "+G.win.day+" из "+G.win.days+
      "\nтроньте панель, дневник или стену · ДЕЙСТВИЕ — сдать смену",260);
}
/* ── сутки ──
   Идут только когда смена сдана. Тут и вся зимовка: тридцать раз сделать
   одно и то же и тридцать раз это пережить. */
function winShift(){
  const W=winAll();if(!W||W.done)return false;
  const bad=winBad(W);
  const over=winOver(W);
  /* итог суток пишется коротко и без выговоров */
  if(over)logAdd("warn","Смена сдана с перегрузкой: реактор не тянет.");
  for(const b of bad)logAdd("dim","Сутки "+W.day+": "+b+".");
  if((W.pw.heat|0)<WIN_MIN.heat)W.cold=(W.cold|0)+1;
  if((W.pw.light|0)<WIN_MIN.light)W.dark=(W.dark|0)+1;
  W.day++;
  G.t+=CEL_DAY;
  /* новая поломка: не каждый день и не по расписанию */
  const r=rng(hashi(W.day,W.sx*31+W.sy,0x0FA7));
  if(r()<.22&&(W.faults||[]).length<3){
    const free=WIN_FAULT.filter(f=>!W.faults.some(x=>x.k===f.k));
    if(free.length){
      const f=free[Math.floor(r()*free.length)];
      W.faults.push({k:f.k,day:W.day});
      logAdd("warn","Сутки "+W.day+": "+f.ru+".");
      sfx("ui",{f:300,to:180,d:.12,v:.2});
    }
  }
  if(W.day>W.days)return winEnd();
  W.said=0;W.noDiary=0;   /* новый день — снова есть время писать */
  return true;
}
function winFix(k){
  const W=winAll();if(!W)return false;
  const i=(W.faults||[]).findIndex(f=>f.k===k);
  if(i<0)return false;
  W.faults.splice(i,1);
  /* починка съедает день целиком: писать дневник уже некогда, и это честная
     цена — в сутках одно дело, а не список дел */
  W.fixed=(W.fixed|0)+1;
  W.noDiary=1;
  logAdd("good","Починено: "+(WIN_FAULT_BY[k]?WIN_FAULT_BY[k].ru:k)+". День ушёл на это.");
  return true;
}
/* ── стена ── */
function winWall(){
  const W=winAll();if(!W)return "";
  W.wall=(W.wall|0)+1;
  const late=W.day>W.days*.55;
  const pool=late?WIN_WALL_LATE:WIN_WALL_EARLY;
  const r=rng(hashi(W.day,W.wall,0x5A11));
  const line=pool[Math.floor(r()*pool.length)];
  if(typeof consoleHeard==="function")consoleHeard(line,"стена");
  logAdd("ether",line);
  return line;
}
/* ── дневник ──
   Страница — та же карточка, что и открытка: бланк, вычёркивания, приписка.
   Только отправлять её некому, и в этом вся разница. */
function winDiaryToday(){
  const W=winAll();if(!W)return null;
  let d=(W.diary||[]).find(x=>x.day===W.day);
  if(d)return d;
  if(W.noDiary)return null;
  const S=getSystem(W.sx,W.sy);
  const p=(S.planets||[])[W.pi]||(S.planets||[])[0];
  d={day:W.day,v:POST_V,m:"s",sx:W.sx,sy:W.sy,pi:p?p.idx:0,mi:-1,lon:null,
     cx:0,t:Math.round(G.t),ver:VER};
  /* бланк по умолчанию — зимовочный: игрок перелистает, если захочет */
  d.f=["w1","w2","w3"][W.day%3];
  d.c=postForm(d.f).l.map(()=>0);
  d.g=[];
  W.diary.push(d);
  return d;
}
/* ── баржа ── */
function winEnd(){
  const W=winAll();if(!W||W.done)return false;
  W.done=1;
  const pay=Math.round(WIN_PAY*(1-Math.min(.35,(W.cold|0)*.012)));
  earn(pay,"зимовка");
  thingAdd("record","Дневник зимовки · "+W.pname,
    (W.diary||[]).length+" страниц · месяц один · бланками, потому что писать было некому",
    {diary:1});
  recordAdd("зимовка","отстоял месяц на "+W.pname+" · смена сдана");
  if((W.cold|0)>4)recordAdd("зимовка","мёрз "+W.cold+" суток и не сообщил");
  if((W.fixed|0)>0)recordAdd("зимовка","починок за смену: "+W.fixed);
  if((W.wall|0)>=W.days)recordAdd("зимовка","слушал стену каждый день");
  logAdd("good","Баржа пришла. Зимовка окончена: +"+pay+" кр");
  tell("good","Баржа пришла. Месяц отстоян","БАРЖА ПРИШЛА\nМЕСЯЦ ОТСТОЯН\n+"+pay+" КР");
  exitWinter();
  return true;
}
function exitWinter(){
  const W=winAll();
  for(const k in keys)keys[k]=false;
  if(W&&W.home){G.sx=W.home.sx;G.sy=W.home.sy;G.sys=getSystem(G.sx,G.sy);}
  G.mode="system";
  if(W&&W.done)G.win=null;
}

/* ── дневник на столе ──
   Сегодняшняя страница заполняется, прошлые только читаются. Ровно как с
   настоящим дневником: вчерашнее уже написано. */
function renderDiary(box){
  box.innerHTML="";
  const W=winAll();
  const finished=(typeof thingsAll==="function")&&thingsAll().some(t=>t.diary);
  if(!W&&!finished){tableRow(box,"dim","","дневника нет");return;}
  if(!W){
    tableRow(box,"dim","","дневник сдан вместе со сменой и лежит в вещах");
    return;
  }
  const wrap=document.createElement("div");wrap.className="album mail";
  const today=(W.diary||[]).find(x=>x.day===W.day);
  if(!today&&W.noDiary)
    tableRow(box,"dim","","сегодня день ушёл на починку — писать нечего");
  const list=(W.diary||[]).slice().reverse();
  for(const d of list){
    const pack=document.createElement("div");
    pack.className="pack open"+(d.day===W.day?"":" mute");
    const hd=document.createElement("div");hd.className="ph";
    hd.innerHTML="<b>СУТКИ "+d.day+"</b><s>"+(d.day===W.day?"сегодня":"уже написано")+"</s>";
    pack.appendChild(hd);
    const host=document.createElement("div");
    host.className="card side";host.style.width="min(680px,100%)";
    renderCardBack(host,d,()=>tableRender(),d.day!==W.day);
    pack.appendChild(host);
    wrap.appendChild(pack);
  }
  if(!list.length)tableRow(box,"dim","","страниц пока нет: тронь дневник на столе");
  box.appendChild(wrap);
}
/* ── наряд на доске ──
   Стоит среди прочих предложений и ничем себя не выделяет: это работа, а не
   приключение. Ни слова про «испытание себя» — только срок и оплата. */
function winBlock(){
  const W=winAll();
  if(W&&!W.done){
    $body.appendChild(el("div","sec","ЗИМОВКА · СМЕНА ИДЁТ"));
    $body.appendChild(el("div","row","<div class='nm'><b>"+W.pname+"</b><s>сутки "+
      W.day+" из "+W.days+" · вернуться туда нельзя и не нужно: баржа придёт сама</s></div>"));
    return;
  }
  const o=winOfferHere();
  if(!o)return;
  $body.appendChild(el("div","sec","ЗИМОВКА · МЕСЯЦ ОДНОМУ"));
  const r=el("div","row","<div class='nm'><b>"+o.pname+" · "+WIN_DAYS+" суток</b><s>"+
    "держать баланс, вести дневник, дождаться баржи · "+WIN_PAY+" кр по возвращении · "+
    "уйти раньше нельзя</s></div>");
  const b=el("button","act sm","ПОДПИСАТЬ");
  b.onclick=()=>{winTake(o);};
  r.appendChild(b);$body.appendChild(r);
}
