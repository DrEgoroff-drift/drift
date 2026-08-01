/* ══════════════ поручения управляющих ══════════════ */
/* Поручение придумывает не игра, а конкретный человек, и приходит оно от него.
   Поэтому здесь нет «принеси десять руды»: каждое — сцена с решением, у которой
   есть цена и у отказа тоже. Награда почти никогда не в кредитах: очко перка,
   слот приказа, человек, корпус, координаты.

   Техника простая: поручение — запись {id,t0,mins,...} на управляющем, а вся
   логика живёт в таблице по id. Функции не сериализуются, поэтому в сохранении
   лежит только id и счётчики. */
function jobDef(id){return MGR_JOBS.find(j=>j.id===id)||null;}
function jobLeft(m){
  if(!m.job)return 0;
  return Math.max(0,m.job.mins-(Date.now()-m.job.t0)/60000);
}
function jobGive(m,what,arg){
  if(what==="perk"){m.gift=(m.gift||0)+1;return "свободное очко перка";}
  if(what==="slot"){m.slotBonus=(m.slotBonus||0)+1;return "+1 слот приказов навсегда";}
  if(what==="loy"){m.loy=clamp(m.loy+arg,0,100);return arg>0?"он это запомнил":"он это тоже запомнил";}
  if(what==="credits"){earn(arg,"job");return "+"+arg.toLocaleString("ru")+" кр";}
  if(what==="data"){G.data+=arg;return "+"+arg+" данных";}
  if(what==="rare"){
    const k=RARE_RES[Math.abs(arg)%RARE_RES.length];
    G.cargo[k]=(G.cargo[k]|0)+8;return RES[k].ru.toLowerCase()+" ×8";
  }
  if(what==="merc"){
    if(G.crew.length>=crewCap())return "человека взять некуда — мест в экипаже нет";
    const c=genMerc(hashi(m.seed,Date.now()&0xffff,0x3E1),null);
    G.crew.push(Object.assign({},c,{cargo:{},order:{kind:"home",sx:G.sx,sy:G.sy},
      tMs:Date.now(),paidMs:Date.now(),fee:0}));
    return c.name+" пришёл в экипаж даром";
  }
  return "";
}
/* ── итоги ── */
function jobDone(m,text){
  const J=jobDef(m.job.id);
  let got=[];
  for(const rw of J.win)got.push(jobGive(m,rw[0],rw[1]));
  m.loy=clamp(m.loy+8,0,100);
  m.jobsDone=(m.jobsDone||0)+1;
  m.jobPast=(m.jobPast||[]).concat(m.job.id);
  mgrSay(m,(text||J.win_ru)+" · "+got.filter(Boolean).join(", "),"good");
  tell("","Поручение закрыто: "+J.ru,m.name+": "+J.ru+"\n"+got.filter(Boolean).join("\n"));
  m.job=null;
}
function jobFail(m,text){
  const J=jobDef(m.job.id);
  m.loy=clamp(m.loy-(J.loss||10),0,100);
  m.jobPast=(m.jobPast||[]).concat(m.job.id);
  mgrSay(m,(text||J.fail_ru),"warn");
  logAdd("warn",m.name+": "+(text||J.fail_ru));
  m.job=null;
}
/* Отказ — тоже ход. Он дешевле провала, но человек его помнит. */
function jobRefuse(m){
  if(!m.job)return false;
  const J=jobDef(m.job.id);
  m.loy=clamp(m.loy-6,0,100);
  m.jobPast=(m.jobPast||[]).concat(m.job.id);
  mgrSay(m,"Отказ принят. "+(J.refuse_ru||"Ладно."),"warn");
  m.job=null;
  return true;
}
/* Выбор в поручении-сцене: варианты видны сразу, последствия — не всегда. */
function jobChoose(m,i){
  if(!m.job)return false;
  const J=jobDef(m.job.id),opt=J.opts&&J.opts[i];
  if(!opt)return false;
  const out=[];
  for(const rw of opt.give||[]){const s=jobGive(m,rw[0],rw[1]);if(s)out.push(s);}
  if(opt.wait){
    /* решение принято, а последствие приходит позже — тем и отличается сцена
       от кнопки «получить награду» */
    m.job={id:J.id,t0:Date.now(),mins:opt.wait,pick:i,armed:1};
    mgrSay(m,opt.said+(out.length?" · "+out.join(", "):""));
    return true;
  }
  m.jobPast=(m.jobPast||[]).concat(J.id);
  m.job=null;
  mgrSay(m,opt.said+(out.length?" · "+out.join(", "):""),opt.bad?"warn":"good");
  tell("",m.name+": "+opt.ru,m.name+"\n"+opt.said+(out.length?"\n"+out.join("\n"):""));
  return true;
}
/* ══════════════ таблица поручений ══════════════ */
/* check возвращает "win" | "fail" | null. Всё, что она читает, — обычное
   состояние игры: никаких отдельных счётчиков ради квестов. */
const MGR_JOBS=[
  /* ── общее: приходит не по желанию, а по цифре (§10) ──
     Ультиматум — единственная сцена, где отказ стоит не лояльности, а человека.
     Роли у него нет: так разговаривает любой, кому надоело. */
  {id:"ultimatum",role:"*",ru:"Ультиматум",mins:12,loss:100,ult:1,choice:1,
   text:m=>"Я держу «"+MGR_ROLES[m.role].dom+"» "+(mgrLevel(m))+
     " уровнем и вижу, сколько это приносит. Мне столько не достаётся. "+
     "Или мы договариваемся сегодня, или я ухожу — и ухожу не пустым.",
   opts:[
     {ru:"ПОДНЯТЬ ДОЛЮ · +3 п.п.",said:"Вот теперь разговор.",cutUp:.03,setLoy:62},
     {ru:"ОТСТУПНЫЕ",said:"Деньги — не то же самое, что уважение. Но сойдёт.",
      payoff:1,setLoy:52},
     {ru:"ОТКАЗАТЬ",said:"Понял. Больше не побеспокою.",bad:1,defect:1}
   ]},
  /* ── командир звена ── */
  {id:"silence",role:"cmd",ru:"Тишина в эфире",mins:18,loss:8,
   text:"Сутки — ни одного приказа. Ни мне, ни людям. Хочу посмотреть, как звено "+
        "работает, когда его не дёргают.",
   win:[["slot",1],["loy",6]],
   win_ru:"Звено отработало само. Он это докажет каждому",
   fail_ru:"Вы всё-таки влезли с приказом — разговор окончен",
   refuse_ru:"Ясно. Значит, руки у вас дрожат.",
   need:()=>G.crew.some(c=>c.shipId&&c.order&&c.order.kind!=="home"),
   start:m=>{m.job.mark=G.orderStamp|0;},
   check:m=>(G.orderStamp|0)!==m.job.mark?"fail":(jobLeft(m)<=0?"win":null)},
  {id:"showfight",role:"cmd",ru:"Показательный бой",mins:25,loss:12,
   text:"Нас держат за наёмный сброд. Возьмите шесть пиратов там, где на это "+
        "смотрят со станции. Драться будете рядом со мной, а не вместо меня.",
   win:[["perk",1],["credits",2500]],
   win_ru:"Про звено теперь говорят, и говорят правильно",
   fail_ru:"Смотреть было не на что. Про нас забыли",
   start:m=>{m.job.mark=G.kills|0;},
   check:m=>((G.kills|0)-m.job.mark>=6)?"win":(jobLeft(m)<=0?"fail":null)},
  {id:"honor",role:"cmd",ru:"Долг чести",choice:1,loss:10,
   text:"В чужом звене сидит человек, с которым мы вместе выходили из «Тарна». "+
        "Его продали. Я могу его выкупить, могу вытащить — или могу забыть, "+
        "если вы так решите.",
   opts:[
     {ru:"ВЫКУПИТЬ · 4200 кр",said:"Выкуплен. Дорого и правильно.",
      cost:4200,give:[["merc",0],["loy",12]]},
     {ru:"ВЫТАЩИТЬ",said:"Вытащили ночью. Станция теперь считает нас похитителями.",
      give:[["merc",0],["loy",6],["credits",-1500]],bad:1},
     {ru:"ЗАБЫТЬ",said:"Забыли. Я запомню, что мы умеем забывать.",
      give:[["loy",-14]],bad:1}]},
  /* ── смотритель ── */
  {id:"underground",role:"keep",ru:"Сигнал из-под грунта",choice:1,loss:8,
   text:"Дрон встал: под точкой что-то глушит связь. Могу пробить ярус ниже, "+
        "чем позволяет наша техника. Может, там ответ. Может, обвалится отсек.",
   opts:[
     {ru:"КОПАТЬ",said:"Копаем. Ждите — быстро такое не делается.",wait:12},
     {ru:"НЕ ТРОГАТЬ",said:"Ладно. Дрон переставлю, а любопытство переживу.",
      give:[["loy",-4]]}],
   /* согласились — результат приходит позже и не всегда тот, которого ждали */
   check:m=>jobLeft(m)>0?null:(m.job.pick===0
     ? (rng(hashi(m.seed,m.job.t0&0xffff,0x11D))()<.6?"win":"fail") : "win"),
   win:[["rare",1],["data",40]],
   win_ru:"Пробили. То, что там лежало, стоило риска",
   fail_ru:"Обвал. Отсек засыпало, дрон потерян"},
  {id:"freeze",role:"keep",ru:"Замерзание",choice:1,loss:8,
   text:"Реактор не тянет. Отключать придётся что-то. Вот список. В списке — "+
        "жилой отсек, где сейчас люди. Решать вам, я исполню.",
   opts:[
     {ru:"ГЛУШИТЬ БУРОВУЮ",said:"Заглушил буровую. Добыча просядет, люди в тепле.",
      give:[["loy",8],["credits",-800]]},
     {ru:"ГЛУШИТЬ ЖИЛОЙ",said:"Заглушил жилой. Добыча идёт. Люди молчат.",
      give:[["credits",1800],["loy",-12]],bad:1},
     {ru:"ВЕЗТИ ТОПЛИВО · 2600 кр",said:"Дотянем на привозном. Дорого, зато никого не трогаем.",
      cost:2600,give:[["loy",10]]}]},
  {id:"toosilent",role:"keep",ru:"Слишком тихо",choice:1,loss:6,
   text:"Один дрон вернулся с грузом, которого не добывал. Я могу не спрашивать, "+
        "откуда. Могу спросить. Второе честнее, первое прибыльнее.",
   opts:[
     {ru:"НЕ СПРАШИВАТЬ",said:"Не спрашиваю. Груз идёт в общий котёл.",
      give:[["credits",3200]],wait:20,bad:1},
     {ru:"СПРОСИТЬ",said:"Спросил. Дрон отправлен на профилактику, груз возвращён.",
      give:[["loy",6]]}],
   check:m=>jobLeft(m)>0?null:(m.job.pick===0?"fail":"win"),
   win:[["loy",4]],win_ru:"Тишина оказалась тишиной",
   fail_ru:"Пришли за своим грузом. Пришлось отдать вдвое"},
  /* ── фактор ── */
  {id:"bubble",role:"fact",ru:"Пузырь",mins:15,loss:14,
   text:"Я скупил всё и держу. Цена стоит на моей руке. У вас есть время сдать "+
        "свои запасы по этой цене — потом она рухнет, и станция посчитает, кто виноват.",
   win:[["credits",4000],["loy",6]],
   win_ru:"Успели выйти до обвала. Красиво",
   fail_ru:"Пузырь лопнул с нашим товаром внутри",
   start:m=>{m.job.mark=G.soldTotal|0;},
   check:m=>((G.soldTotal|0)-m.job.mark>=6000)?"win":(jobLeft(m)<=0?"fail":null)},
  {id:"books",role:"fact",ru:"Двойная книга",choice:1,loss:6,
   text:"Цифры не сходятся. У меня есть объяснение, и оно вам понравится. "+
        "Хотите — примите его. Хотите — считайте сами.",
   need:m=>mgrHas(m,"selfish")||mgrHas(m,"grip"),
   opts:[
     {ru:"ПОВЕРИТЬ",said:"Хорошо, что мы понимаем друг друга.",
      give:[["loy",6]],bad:1},
     {ru:"АУДИТ",said:"Оскорбительно. Но проверяйте.",
      give:[["loy",-10],["credits",1200]]},
     {ru:"ПРОВЕРИТЬ ТИХО",said:"Он не знает, что вы знаете. Теперь он работает дешевле.",
      give:[["loy",-4]],quiet:1}]},
  {id:"hunger",role:"fact",ru:"Голод на Гаранте",choice:1,loss:8,
   text:"На планете нехватка еды, цена вчетверо. Везти органику туда — деньги. "+
        "Нехватку, кстати, сделали искусственно. Частично — нашим же маршрутом.",
   opts:[
     {ru:"ПО ЧЕТЫРЁХКРАТНОЙ",said:"Продали дорого. На станции это запомнили.",
      give:[["credits",6500],["loy",-8]],bad:1},
     {ru:"ПО ОБЫЧНОЙ",said:"Продали как всегда. Про нас теперь говорят иначе.",
      give:[["credits",1600],["loy",14]]},
     {ru:"РАЗОРВАТЬ ПЛЕЧО",said:"Плечо закрыто. Маршрут короче, совесть чище.",
      give:[["loy",10]],cut:1}]},
  /* ── исследователь ── */
  {id:"xenonoise",role:"sci",ru:"Ксеношум",mins:20,loss:6,
   text:"Оно что-то передаёт. Я могу слушать, но тогда лаборатория стоит: "+
        "ни науки, ни чертежей, только запись. Сутки. Может, зря.",
   win:[["data",120]],
   win_ru:"В шуме была последовательность. Это координаты",
   fail_ru:"Слушать не дали — шум ушёл",
   start:m=>{m.job.hold=1;},
   check:m=>jobLeft(m)<=0?"win":null},
  {id:"live",role:"sci",ru:"Живой образец",mins:26,loss:10,
   text:"Мне нужна тварь живой, а не в виде органики на дне трюма. Двенадцать "+
        "единиц органики — это её корм и её же вес. Гипер ей не понравится.",
   win:[["perk",1],["data",60]],
   win_ru:"Довезли. Теперь у нас есть источник образцов, который сам растёт",
   fail_ru:"Не довезли. Она уже не в трюме",
   check:m=>((G.cargo.organics|0)>=12)?"win":(jobLeft(m)<=0?"fail":null)},
  {id:"wrongcall",role:"sci",ru:"Ложный вывод",choice:1,loss:8,
   text:"Чертёж, который вы ставите третью неделю, — моя ошибка. Я хочу его "+
        "откатить. Да, он работает. Я всё равно хочу его откатить.",
   need:()=>Object.keys(G.blueprints||{}).some(k=>G.blueprints[k]>0),
   opts:[
     {ru:"ОТКАТИТЬ",said:"Спасибо. Ошибкой был не чертёж, а мой страх её признать.",
      give:[["perk",1],["loy",12]],rollback:1},
     {ru:"ОСТАВИТЬ",said:"Как скажете. Работает же.",
      give:[["loy",-8]],bad:1}]}
];
/* ── выдача ──
   Поручение приходит от человека, а не из списка задач: только когда домен уже
   работает, только по одному за раз и никогда дважды одно и то же. */
function jobOffer(m){
  if(m.job||m.stalled||m.loy<25)return;
  const past=m.jobPast||[];
  const pool=MGR_JOBS.filter(J=>J.role===m.role&&past.indexOf(J.id)<0&&
    (!J.need||J.need(m)));
  if(!pool.length)return;
  const r=rng(hashi(m.seed,Math.floor(Date.now()/60000),0x30B));
  if(r()>.05)return;                     // примерно раз в двадцать минут работы
  const J=pool[Math.floor(r()*pool.length)];
  m.job={id:J.id,t0:Date.now(),mins:J.mins||0,offer:1};
  mgrSay(m,"Есть разговор: «"+J.ru+"»");
  tell("","Поручение от "+m.name+": "+J.ru,m.name+" хочет поговорить\n«"+J.ru+"»\nэкран ШТАБ");
}
/* принять поручение-цель: с этого момента идёт срок */
function jobAccept(m){
  if(!m.job||!m.job.offer)return false;
  const J=jobDef(m.job.id);
  if(J.choice)return false;
  m.job={id:J.id,t0:Date.now(),mins:J.mins,mark:0};
  if(J.start)J.start(m);
  mgrSay(m,"Взялись. Срок — "+J.mins+" минут");
  return true;
}
/* оплаченный вариант выбора списывает деньги до последствий */
function jobPick(m,i){
  const J=jobDef(m.job&&m.job.id);
  if(!J||!J.opts||!J.opts[i])return false;
  const opt=J.opts[i];
  /* цена отступных считается от человека, а не из таблицы: дорогой управляющий
     и требует дорого. Кнопка сама показывает сумму — см. hqJobCard. */
  const cost=opt.payoff?mgrUltCost(m):opt.cost;
  if(cost&&G.credits<cost){say("Не хватает кредитов\nнужно "+cost.toLocaleString("ru")+" кр");return false;}
  if(cost)G.credits-=cost;
  if(opt.defect){
    m.job=null;
    mgrSay(m,opt.said,"warn");
    mgrDefect(m,"ult");
    return true;
  }
  if(opt.cutUp)m.cutBonus=(m.cutBonus||0)+opt.cutUp;
  if(opt.setLoy)m.loy=Math.max(m.loy,opt.setLoy);
  if(opt.quiet)m.quietLever=1;           // рычаг: он работает дешевле и знает почему
  if(opt.cut&&m.route.length)m.route.pop();
  if(opt.rollback){
    for(const k in G.blueprints)if(G.blueprints[k]>0){delete G.blueprints[k];break;}
  }
  return jobChoose(m,i);
}
/* Сколько он хочет отступными: столько же, во что обошёлся бы расчёт,
   плюс надбавка за уровень. Дешёвого выхода из ультиматума нет. */
function mgrUltCost(m){return Math.round(mgrSeverance(m)*1.3+mgrPay(m)*mgrLevel(m)*12);}
/* ход поручения внутри общего тика домена */
function jobTick(m){
  if(!m.job){jobOffer(m);return;}
  if(m.job.id==="ultimatum")return;      // у него свой срок, он тикает в mgrUltimatum
  if(m.job.offer)return;                 // предложение ждёт игрока сколько угодно
  const J=jobDef(m.job.id);
  if(!J||!J.check)return;
  const res=J.check(m);
  if(res==="win")jobDone(m);
  else if(res==="fail")jobFail(m);
}
