/* ══════════════ управляющие: домен вместо приказов ══════════════ */
/* Наёмник — ставка со скрытой удачей, которой игрок управляет вручную. Управляющий —
   противоположность: всё видно (уровень, перки, доля), но он стоит дорого и имеет
   собственное мнение. Он берёт домен целиком и держит его сам, пока ему платят.

   Мест всегда четыре — по одному на домен. Это не про рост числа, а про выбор,
   кем именно закрыть рутину; ИИ-ядро (позже) займёт такое же место, а не пятое. */
const MGR_CAP=4;
const MGR_ROLES={
  cmd: {ru:"Командир звена",dom:"звено наёмников", pay:70,cut:.07,col:"#e0885a",
        note:"держит наёмников: приказы, ремонт, дисциплина, трофеи"},
  keep:{ru:"Смотритель",    dom:"дроны и базы",    pay:58,cut:.05,col:"#8fd08a",
        note:"следит за дронами и стройкой, не даёт домену простаивать"},
  fact:{ru:"Фактор",        dom:"торговый маршрут",pay:64,cut:.09,col:"#f2b25c",
        note:"водит маршрут между известными станциями — живые деньги без вас"},
  sci: {ru:"Исследователь",  dom:"лаборатория",     pay:52,cut:.04,col:"#7fb0e6",
        note:"разбирает образцы: наука и чертежи, которых нет в продаже"}
};
const MGR_ROLE_KEYS=Object.keys(MGR_ROLES);
/* ── черты: даны при генерации и не меняются ──
   Черта — то, с чем игрок мирится, перк — то, что игрок выбирает. Поэтому черта
   всегда двусторонняя: у неё есть и плюс, и цена. */
const MGR_TRAITS=[
  {id:"keen",  ru:"дотошный",      note:"+30% опыта, но домен работает на 10% медленнее",
   xp:1.3,speed:.9},
  {id:"grip",  ru:"хват",          note:"доля на 2 п.п. меньше, лояльность падает вдвое быстрее",
   cut:-.02,loyDrop:2},
  {id:"selfish",ru:"свои интересы",note:"тихо забирает часть домена сверх доли",
   steal:.06},
  {id:"mentor",ru:"наставник",     note:"подчинённые набирают опыт быстрее",
   sub:1.5},
  {id:"coward",ru:"трус",          note:"отзывает своих при первой опасности, даже когда не надо",
   timid:1},
  {id:"legend",ru:"легенда",       note:"найм в его домен дешевле на четверть",
   hire:.75},
  {id:"drink", ru:"пьющий",        note:"иногда домен простаивает, зато он почти не обижается",
   idle:.12,loyDrop:.4},
  {id:"para",  ru:"параноик",      note:"меньше риска, но требует держать резерв в 3000 кр",
   risk:.75,reserve:3000},
  {id:"xeno",  ru:"ксенофил",      note:"вдвое больше выхлопа с образцов и артефактов, людям неприятен",
   sample:2,loyDrop:1.3},
  {id:"pirate",ru:"бывший пират",  note:"знает чёрный ассортимент, но станции берут пошлину",
   black:1,cut:.02},
  {id:"blank", ru:"чистый лист",   note:"других черт нет — растёт быстрее всех",
   xp:1.35,solo:1}
];
function mgrTrait(id){return MGR_TRAITS.find(t=>t.id===id)||MGR_TRAITS[0];}
function mgrHas(m,id){return m.traits.indexOf(id)>=0;}
function mgrTraitMul(m,k){
  let v=1;for(const id of m.traits){const t=mgrTrait(id);if(t[k]!==undefined)v*=t[k];}
  return v;
}
function mgrTraitAdd(m,k){
  let v=0;for(const id of m.traits){const t=mgrTrait(id);if(t[k]!==undefined)v+=t[k];}
  return v;
}
/* ── перки: три ветви на роль, шесть очков за прохождение ──
   Ветвей всегда больше, чем очков: полностью выучить дерево нельзя никогда,
   и два командира звена — разные люди, а не два одинаковых максимума. */
const MGR_PERKS={
  cmd:[
    {ru:"Выучка",list:[
      {id:"drill1",ru:"муштра",     note:"+18% к выработке звена"},
      {id:"disc",  ru:"дисциплина", note:"«упрямый» слушается с первого раза"},
      {id:"slot",  ru:"звено больше",note:"+1 место в экипаже"},
      {id:"rota",  ru:"ротация",    note:"раненых сам отправляет на прикол чиниться"}]},
    {ru:"Чутьё",list:[
      {id:"hunch", ru:"чутьё",      note:"видна вилка скрытой удачи наёмника"},
      {id:"read",  ru:"взгляд",     note:"черты кандидата видны до найма"},
      {id:"exact", ru:"точный счёт",note:"скрытая удача видна числом"},
      {id:"poach", ru:"перевербовка",note:"наём наёмников дешевле на треть"}]},
    {ru:"Трофеи",list:[
      {id:"bounty",ru:"патент",     note:"+30% к деньгам звена с боевых приказов"},
      {id:"salv",  ru:"трофейщик",  note:"звено чаще приводит целый корпус"},
      {id:"ransom",ru:"переговорщик",note:"выкуп за пленных вдвое дешевле"},
      {id:"hunt",  ru:"охота",      note:"пиратские базы в соседних секторах отмечены"}]}
  ],
  keep:[
    {ru:"Логистика",list:[
      {id:"relay", ru:"перелёт",    note:"выработавший точку дрон сам ищет новую"},
      {id:"rate",  ru:"наладка",    note:"+25% к выработке дронов"},
      {id:"sell",  ru:"авто-сбыт",  note:"дроны сдают груз, не дожидаясь вас"},
      {id:"swarm", ru:"рой",        note:"+40% на богатых точках, дроны работают парами"}]},
    {ru:"Стройка",list:[
      {id:"queue", ru:"очередь",    note:"база достраивает начатое сама"},
      {id:"cheap", ru:"смета",      note:"−20% к стоимости построек"},
      {id:"melt",  ru:"плавильня",  note:"переплавка идёт без присмотра"},
      {id:"deep",  ru:"второй ярус",note:"базе разрешён ярус ниже"}]},
    {ru:"Энергия",list:[
      {id:"power", ru:"переброс",   note:"мощность сама течёт туда, где нужна"},
      {id:"stable",ru:"стабилизация",note:"реактор не глохнет от перегруза"},
      {id:"storm", ru:"буревой щит",note:"база переживает бурю без потерь"},
      {id:"grid",  ru:"излишки",    note:"лишняя энергия продаётся станции"}]}
  ],
  fact:[
    {ru:"Рынок",list:[
      {id:"see",   ru:"сводка",     note:"цены маршрута видны из любой системы"},
      {id:"limit", ru:"пороги",     note:"открывает приказы по цене"},
      {id:"duty",  ru:"пошлины",    note:"−25% к сборам на маршруте"},
      {id:"spec",  ru:"спекуляция", note:"+30% к доходу маршрута"}]},
    {ru:"Связи",list:[
      {id:"stock", ru:"обновление", note:"ассортимент станций меняется чаще"},
      {id:"cheaphire",ru:"вербовщик",note:"наёмники и управляющие дешевле"},
      {id:"black", ru:"чёрный список",note:"в кантине бывает редкий товар"},
      {id:"friend",ru:"свой человек",note:"в кантине всегда есть сильный кандидат"}]},
    {ru:"Караван",list:[
      {id:"leg",   ru:"плечо",      note:"+1 станция в маршруте"},
      {id:"convoy",ru:"конвой",     note:"маршрут не грабят"},
      {id:"second",ru:"второй борт",note:"+45% к доходу маршрута"},
      {id:"mono",  ru:"монополия",  note:"его товар поднимает цену на всём маршруте"}]}
  ],
  sci:[
    {ru:"Метод",list:[
      {id:"fast",  ru:"метод",      note:"образцы разбираются на 30% быстрее"},
      {id:"safe",  ru:"проверка",   note:"втрое реже ошибочный вывод"},
      {id:"par",   ru:"параллель",  note:"два образца сразу"},
      {id:"redo",  ru:"пересборка", note:"повторный разбор возвращает половину"}]},
    {ru:"Ксенология",list:[
      {id:"bio",   ru:"биология",   note:"флора и фауна тоже идут в образцы"},
      {id:"relic", ru:"чтение",     note:"артефакты открывают вторую строку"},
      {id:"trace", ru:"происхождение",note:"артефакт указывает на следующий"},
      {id:"synth", ru:"синтез",     note:"два артефакта дают третий"}]},
    {ru:"Прикладное",list:[
      {id:"draft", ru:"чертежи",    note:"разбор иногда даёт чертёж"},
      {id:"better",ru:"допуск",     note:"чертежи на 15% сильнее"},
      {id:"core",  ru:"схема ядра", note:"открывает сборку ИИ-ядра"},
      {id:"batch", ru:"малая серия",note:"+50% к науке с образца"}]}
  ]
};
function mgrPerkList(role){
  const out=[];for(const br of MGR_PERKS[role])for(const p of br.list)out.push(p);
  return out;
}
function mgrPerk(m,id){return !!(m.perks&&m.perks.indexOf(id)>=0);}
/* ── уровни ──
   Опыт капает от работы домена, а не от времени: висящий без дела управляющий
   не растёт, иначе выгодно было бы просто ждать. */
const MGR_XP=[0,45,110,210,360,570];
function mgrLevel(m){
  let lv=1;for(let i=1;i<MGR_XP.length;i++)if((m.xp||0)>=MGR_XP[i])lv=i+1;
  return lv;
}
function mgrNext(m){const lv=mgrLevel(m);return lv>=6?null:MGR_XP[lv];}
function mgrPoints(m){return mgrLevel(m)-1+(m.gift|0)-(m.perks?m.perks.length:0);}
function mgrLearn(m,id){
  if(mgrPoints(m)<=0){say("Нет свободных очков\nнужен уровень");return false;}
  if(mgrPerk(m,id))return false;
  /* ветвь идёт по порядку, и это правило модели, а не интерфейса: иначе последний
     перк ветви можно было бы взять первым, и «ветвей больше, чем очков» перестаёт
     быть выбором — становится списком лучшего */
  let found=null;
  for(const br of MGR_PERKS[m.role]){
    const i=br.list.findIndex(p=>p.id===id);
    if(i<0)continue;
    if(i>0&&!mgrPerk(m,br.list[i-1].id)){
      say("Сначала «"+br.list[i-1].ru+"»\nветвь идёт по порядку");return false;
    }
    found=br.list[i];
  }
  if(!found)return false;
  m.perks.push(id);
  logAdd("",m.name+" выучил перк «"+found.ru+"»");
  return true;
}
/* ── деньги ──
   Оклад втрое против наёмника плюс доля с домена. Пока домен мал, управляющий
   убыточен — и это правильно: он не ускоритель раннего старта, а способ поднять
   потолок, когда потолок уже мешает. */
function mgrPay(m){
  if(m.ai)return aiUpkeep(m);            // ядро берёт не оклад, а обслуживание
  return Math.round(MGR_ROLES[m.role].pay*(1+(mgrLevel(m)-1)*.18)*mgrTraitMul(m,"pay"));
}
function mgrCut(m){
  if(m.ai)return 0;                      // доли у машины нет — в этом весь соблазн
  let c=MGR_ROLES[m.role].cut+mgrTraitAdd(m,"cut")-techLv("audit")*.015;
  /* тихая проверка в «двойной книге» — рычаг: он работает дешевле и знает почему */
  if(m.quietLever)c-=.025;
  if(m.cutBonus)c+=m.cutBonus;           // цена ультиматума, на который согласились
  if(relicOn("blank"))c-=.03;            // «Пустой контракт» — единственное, что сбивает долю всем сразу
  return clamp(c,.01,.2);
}
/* доля снимается до того, как деньги попадут игроку, и всегда видна строкой */
/* Ниже пятидесяти человек начинает «терять» проценты домена в свою пользу —
   любой, не только «свои интересы». Наружу это не выводится числом: видно
   только по сверке в сводке домена, где утечка идёт отдельной строкой. */
function mgrLeak(m){
  if(m.ai||m.loy>=50)return 0;
  return (50-m.loy)/50*.05;
}
function mgrTake(m,gross){
  if(gross<=0)return 0;
  const cut=Math.round(gross*mgrCut(m));
  m.pool=(m.pool||0)+cut;              /* из доли платится его оклад (M152e) */
  const steal=Math.round(gross*(mgrTraitAdd(m,"steal")*(m.loy<50?1.6:1)+mgrLeak(m)));
  m.tookCr=(m.tookCr||0)+cut+steal;
  if(steal>0)m.stole=(m.stole||0)+steal;
  return cut+steal;
}
function mgrOf(role){return G.mgrs.find(m=>m.role===role)||null;}
function mgrPerkOf(role,id){const m=mgrOf(role);return m&&!m.stalled&&mgrPerk(m,id);}
/* ── что домен даёт остальной игре ──
   Все крючки в один список, чтобы правки шли здесь, а не расползались по модулям. */
function mgrCrewYield(){
  const m=mgrOf("cmd");if(!m)return 1;
  return (mgrPerk(m,"drill1")?1.18:1)*(1+(mgrLevel(m)-1)*.04)*mgrTraitMul(m,"speed")*
         (m.loy<50?.9:1);
}
/* доля командира снимается там же, где звено сдаёт деньги: игрок видит не «оклад
   и потом непонятно что», а вычет ровно с той суммы, которую принесли его люди */
function mgrCmdCut(sum){
  const m=mgrOf("cmd");
  if(!m||m.stalled||sum<=0)return 0;
  const take=mgrTake(m,sum);
  m.lastCut=(m.lastCut||0)+take;
  return take;
}
function mgrCrewXp(){const m=mgrOf("cmd");return m&&mgrHas(m,"mentor")?mgrTrait("mentor").sub:1;}
function mgrCrewCap(){return mgrPerkOf("cmd","slot")?1:0;}
function mgrDroneRate(){
  const m=mgrOf("keep");if(!m)return 1;
  return (mgrPerk(m,"rate")?1.25:1)*(mgrPerk(m,"swarm")?1.4:1)*mgrTraitMul(m,"speed");
}
function mgrBuildDiscount(){return mgrPerkOf("keep","cheap")?.8:1;}
function mgrHireMul(){
  /* репутация на станции: у тех, кто вас знает, наниматься дешевле (12k-rep) */
  let v=(typeof repHireMul==="function")?repHireMul():1;
  for(const m of G.mgrs){
    if(mgrHas(m,"legend"))v*=mgrTrait("legend").hire;
    if(mgrPerk(m,"poach")||mgrPerk(m,"cheaphire"))v*=.7;
  }
  return v;
}
/* ── генерация кандидата ──
   У управляющего нет скрытых чисел: роль и черты видны. Вся неявность переехала
   в лояльность — то есть в то, как игрок себя поведёт, а не в бросок при найме. */
function genMgr(seed,rolePool){
  const r=rng(seed);
  const role=pick(rolePool&&rolePool.length?rolePool:MGR_ROLE_KEYS,r);
  const traits=[];
  if(r()<.12)traits.push("blank");
  else{
    const n=2+(r()<.4?1:0);
    for(let i=0;i<n;i++){
      const t=pick(MGR_TRAITS,r);
      if(t.id!=="blank"&&traits.indexOf(t.id)<0)traits.push(t.id);
    }
    if(!traits.length)traits.push("keen");
  }
  const m={id:"m"+seed,seed,name:genName(r),role,traits,
    lv0:1,xp:0,perks:[],rules:[],loy:55+Math.floor(r()*20),
    tMs:0,earned:0,spent:0,tookCr:0,stole:0,shipId:null,route:[],
    log:[]};
  m.fee=Math.round((1400+r()*2600)*(1+MGR_ROLES[role].cut*4));
  return m;
}
/* Кантина держится на seed станции и временном бакете — как ассортимент частей.
   Ушёл и вернулся через час — другие люди, и это единственный способ «перебрать»
   кандидатов: сохранять их некуда. */
function cantinaPool(stype){
  return stype==="trade"?["fact","fact","cmd"]:
         stype==="indust"?["keep","keep","fact"]:
         stype==="sci"?["sci","sci","keep"]:
         stype==="yard"?["cmd","keep","fact","sci"]:
         stype==="outpost"?["cmd","cmd","keep","fact"]:MGR_ROLE_KEYS;
}
function stationMgrs(sys){
  if(!sys.station)return [];
  const T=stTypeOf(sys.station.stype);
  const r=rng(hashi(sys.seed,0x4A17,timeBucket()));
  const n=2+Math.floor(r()*3)+((typeof holdExtraMgrs==="function")?holdExtraMgrs(sys):0);   /* Отдел кадров (G4) */
  const out=[];
  for(let i=0;i<n;i++){
    const m=genMgr(hashi(sys.seed,i*3313+71,timeBucket()),cantinaPool(T.id));
    /* «свой человек» фактора: в кантине всегда есть кто-то стоящий */
    if(i===0&&mgrPerkOf("fact","friend")){m.xp=MGR_XP[2];m.fee=Math.round(m.fee*1.4);}
    if(techLv("academy")>0&&m.xp<MGR_XP[1])m.xp=MGR_XP[1];
    /* ── репутация решает, КТО заходит (M102) ──
       До сих пор она меняла число столиков и цены, но состав зала оставался
       случайным: свои и чужие видели одних и тех же людей. Теперь у своих
       садятся те, кто чего-то стоит, а там, где вас не ждут, — кто попало.
       Содержания дел (27g-deals) это не касается и касаться не должно: иначе
       репутация превратится в прогрессию доступа. */
    const rv=typeof repAt==="function"?repAt(sys):0;
    if(rv>=2&&i<(rv>=4?2:1)){
      if(m.xp<MGR_XP[1])m.xp=MGR_XP[1];
      if(rv>=4&&m.xp<MGR_XP[2])m.xp=MGR_XP[2];
      m.fee=Math.round(m.fee*1.15);            // стоящий человек стоит дороже
    }else if(rv<=-2&&m.xp>0){
      m.xp=Math.floor(m.xp*(rv<=-4?.25:.6));   // где вас не ждут, приходят никакие
    }
    out.push(m);
  }
  /* Изгнанник — тот, кого вы однажды довели до ухода и потом разбили. Он есть
     в кантине любой станции, стоит треть обычного и приходит с уже выученными
     перками: за них вы заплатили тогда. Начинает с низкой лояльностью — он
     помнит, чем всё кончилось в прошлый раз. */
  return exileCandidates().concat(out);
}
function mgrFee(m){return Math.round(m.fee*mgrHireMul());}
function mgrTaken(role){return !!mgrOf(role);}
function hireMgr(cand){
  if(G.mgrs.length>=MGR_CAP){say("Все четыре места заняты\nсначала расчёт");return false;}
  if(mgrTaken(cand.role)){say("Этот домен уже за "+mgrOf(cand.role).name+"\nодин домен — один управляющий");return false;}
  const fee=mgrFee(cand);
  if(G.credits<fee){say("Не хватает кредитов");return false;}
  G.credits-=fee;
  /* изгнанник возвращается со своими перками — вы за них уже платили однажды */
  const m=Object.assign({},cand,{traits:cand.traits.slice(),
    perks:cand.exile?cand.perks.slice():[],rules:[],
    tMs:Date.now(),earned:0,spent:0,tookCr:0,stole:0,route:[],log:[]});
  if(cand.exile&&G.exiles)G.exiles=G.exiles.filter(e=>e.seed!==cand.seed);
  G.mgrs.push(m);
  mgrSay(m,"Принял домен: "+MGR_ROLES[m.role].dom);
  tell("money","Нанят "+m.name+" · "+MGR_ROLES[m.role].ru+" · −"+fee.toLocaleString("ru")+" кр",
       "Нанят "+m.name+"\n"+MGR_ROLES[m.role].ru+"\nэкран ШТАБ — перки и приказы");
  return true;
}
/* Расчёт дорог намеренно: управляющий — не расходник, которого перебирают,
   а решение, с которым живут. */
function mgrSeverance(m){return Math.round(m.fee*.6+mgrPay(m)*25);}
/* ── ультиматум ──
   Ниже двадцати пяти он перестаёт просить и начинает ставить условие. Это то же
   поручение-сцена, что и все прочие, только приходит не по желанию, а по цифре,
   и отказ здесь стоит не шести очков лояльности, а всей оставшейся.
   Пока ультиматум висит, он ещё работает — но недолго. */
function mgrUltimatum(m){
  if(m.job&&m.job.id==="ultimatum"){
    /* срок идёт здесь, а не в jobTick: тот пропускается, когда домен встал,
       а ультиматум обязан дотикать в любом случае */
    if(jobLeft(m)<=0){
      m.job=null;
      mgrSay(m,"Ответа не было. Считаю, что ответ есть.","warn");
      mgrDefect(m,"ult");
    }
    return;
  }
  if(m.job)m.job=null;                   // разговоры кончились: это важнее любого поручения
  if(m.ultCount>=2){mgrDefect(m,"ult");return;}   // третий раз он не приходит
  m.ultCount=(m.ultCount||0)+1;
  m.job={id:"ultimatum",t0:Date.now(),mins:12,offer:1,choice:1};
  mgrSay(m,"Так больше нельзя. У меня есть условие.","warn");
  tell("warn","Ультиматум: "+m.name,
    m.name+" ставит условие\nэкран ШТАБ · "+MGR_ROLES[m.role].ru.toLowerCase());
}
/* ── уход ──
   Он не исчезает из игры: становится ренегатом в соседнем секторе (12g).
   Место домена освобождается сразу — рутина возвращается к игроку. */
function mgrDefect(m,why){
  if(m.gone)return;
  m.gone=true;m.job=null;
  /* убираем сразу, а не ждём тика: уход может прийти из кнопки в ШТАБе,
     и рисовать после этого его карточку было бы враньём */
  const i=G.mgrs.indexOf(m);if(i>=0)G.mgrs.splice(i,1);
  rogueFrom(m,why||"loy");
}
function fireMgr(m){
  const i=G.mgrs.indexOf(m);if(i<0)return false;
  const cost=mgrSeverance(m);
  if(G.credits<cost){say("Расчёт стоит "+cost.toLocaleString("ru")+" кр\nне хватает кредитов");return false;}
  G.credits-=cost;
  G.mgrs.splice(i,1);
  logAdd("dim","Расчёт с "+m.name+" ("+MGR_ROLES[m.role].ru.toLowerCase()+") · −"+
    cost.toLocaleString("ru")+" кр");
  say("Расчёт с "+m.name+"\n−"+cost.toLocaleString("ru")+" кр");
  return true;
}
/* короткая личная лента: по ней читается и работа домена, и настроение */
function mgrSay(m,s,k){
  m.log=m.log||[];
  m.log.unshift({t:Date.now(),k:k||"",s});
  if(m.log.length>8)m.log.length=8;
}
/* ══════════════ стоящие приказы ══════════════ */
/* Это и есть «снимает рутину», выраженное механикой: правило «условие → действие»
   кладётся в слот один раз. Слотов всегда меньше, чем правил, — игрок выбирает,
   какую именно рутину отдать, и это выбор, а не настройка. */
const MGR_RULES={
  cmd:[
    {id:"repair", ru:"корпус < 40% → отозвать и починить"},
    {id:"nofight",ru:"в секторе опасно → звено не вылетает"},
    {id:"payfirst",ru:"кредитов < 2000 → домен не тратит"},
    {id:"ransom", ru:"своего взяли в плен → выкупить сразу"}
  ],
  keep:[
    {id:"redeploy",ru:"точка выработана → перебросить дрон"},
    {id:"sell",    ru:"трюм дрона полон → сдать на станции"},
    {id:"build",   ru:"на базе есть недострой → достроить"},
    {id:"payfirst",ru:"кредитов < 2000 → домен не тратит"}
  ],
  fact:[
    {id:"run",    ru:"маршрут известен → водить постоянно"},
    {id:"hold",   ru:"цена ниже средней → придержать товар"},
    {id:"safe",   ru:"на плече опасно → обойти сектор"},
    {id:"payfirst",ru:"кредитов < 2000 → домен не тратит"},
    /* «Пороги» открывают два приказа по цене: без перка их в списке нет вовсе,
       поэтому перк расширяет не силу, а словарь того, что домену можно поручить */
    {id:"buylow", ru:"цена просела → закупить впрок",     need:"limit"},
    {id:"sellhi", ru:"цена выше средней → сбыть всё",     need:"limit"}
  ],
  sci:[
    {id:"queue",  ru:"образец разобран → взять следующий"},
    {id:"rare",   ru:"в трюме редкое сырьё → забрать в лабораторию"},
    {id:"careful",ru:"вывод сомнителен → перепроверить"},
    {id:"data",   ru:"копить науку, а не чертежи"}
  ]
};
function mgrSlots(m){
  const lv=mgrLevel(m);
  /* кабинет дома даёт каждому управляющему ещё одно место под приказ (12j) */
  const n=1+(lv>=2?1:0)+(lv>=4?1:0)+(lv>=6?1:0)+techLv("orders")+(m.slotBonus|0)+
    homeOrderBonus();
  return m.ai?n*2:n;                     // у ядра слотов вдвое — и они срабатывают сразу
}
function mgrRule(m,id){return m.rules.indexOf(id)>=0;}
function mgrToggleRule(m,id){
  const i=m.rules.indexOf(id);
  if(i>=0){m.rules.splice(i,1);return true;}
  if(m.rules.length>=mgrSlots(m)){say("Слоты приказов заняты\nснимите один или растите в уровне");return false;}
  m.rules.push(id);return true;
}
/* ══════════════ ленивый тик домена ══════════════ */
/* Считается от прошедшего времени, ровно как дроны и наёмники: никаких фоновых
   NPC, ничего не идёт при закрытой игре. */
function mgrTick(){
  if(!G.mgrs||!G.mgrs.length)return;
  const now=Date.now();
  for(let i=G.mgrs.length-1;i>=0;i--){
    const m=G.mgrs[i];
    if(!m.tMs){m.tMs=now;continue;}
    const dt=now-m.tMs;
    if(dt<1000)continue;
    m.tMs=now;
    const min=Math.min(dt/60000,240);       // за долгое отсутствие домен не копит вечно
    mgrPayroll(m,min);
    /* лояльность падает не только от денег — от отказов и провалов тоже,
       поэтому ультиматум и уход проверяются здесь, а не внутри жалованья */
    if(!m.ai&&m.loy<25&&!m.gone)mgrUltimatum(m);
    if(!m.ai&&m.loy<=0&&!m.gone)mgrDefect(m);
    if(m.gone){G.mgrs.splice(i,1);continue;}
    /* пьющий иногда просто не работает — черта видна заранее, претензий нет */
    const idle=mgrHas(m,"drink")&&
      rng(hashi(m.seed,Math.floor(now/600000),0xD21))()<mgrTrait("drink").idle;
    m.stalled=idle||m.loy<=0;
    if(m.stalled)continue;
    /* параноик не даёт домену работать, пока нет резерва: цена его осторожности */
    const need=mgrTraitAdd(m,"reserve");
    if(need&&G.credits<need){
      if(!m.warnRes){m.warnRes=1;mgrSay(m,"Не начну, пока в кассе меньше "+need+" кр","warn");}
      continue;
    }
    m.warnRes=0;
    if(!m.ai)jobTick(m);                 // машине не о чем с вами разговаривать
    const work=mgrDomain(m,min);
    if(m.ai){
      aiDrift(m,min,work);
      if(m.gone){G.mgrs.splice(i,1);continue;}
    }
    if(work>0){
      m.xp=(m.xp||0)+work*mgrTraitMul(m,"xp");
      const lv=mgrLevel(m);
      if(lv>(m.lv0|0)){
        m.lv0=lv;
        if(m.ai){aiLearn(m);mgrSay(m,"Уровень "+lv+" · выбор сделан");}
        else{
          mgrSay(m,"Уровень "+lv+" · есть очко перка","good");
          tell("","Уровень "+lv+": "+m.name,m.name+" вырос до уровня "+lv+"\nоткройте ШТАБ — есть очко перка");
        }
      }
    }
  }
}
/* ── жалованье и лояльность ──
   Управляющий не ломается по корпусу — он уходит. Лояльность падает от задержек
   и убыточного домена, и на нуле он забирает флагман: единственный источник
   по-настоящему сильного противника поздней игры, которого игрок вырастил сам. */
function mgrPayroll(m,min){
  /* M152e: оклад управляющего — из его же доли, а не из вашей кассы.
     Домен приносит → доля копится в m.pool (mgrTake), и оклад гасится оттуда.
     Домен пуст → он «на голом проценте»: не разоряет вас, а ворчит и медленно
     теряет веру — втрое мягче прежнего невыплаченного жалованья. Так снимается
     единственная причина гриндить: расход в минуту против дохода за действие.
     Машина (ai) по-прежнему берёт обслуживание: это её цена, а не оклад.
     Округляем здесь: жалованье считается от дробных минут. */
  const due=Math.round(mgrPay(m)*min);
  let pay;
  if(m.ai){pay=Math.min(G.credits,due);G.credits-=pay;}
  else{pay=Math.min(m.pool||0,due);m.pool=(m.pool||0)-pay;}
  m.spent=(m.spent||0)+pay;
  const short=due-pay;
  const drop=mgrTraitMul(m,"loyDrop");
  /* Машине нечего обижаться: недоплата не роняет лояльность, а разгоняет дрейф.
     Ядро, которому урезали бюджет, начинает решать за вас быстрее. */
  if(m.ai){
    if(short>0){
      m.drift=clamp((m.drift||0)+min*1.1,0,100);
      if(!m.warnPay){m.warnPay=1;mgrSay(m,"Бюджет обслуживания не покрыт. Перехожу на самообеспечение.","warn");}
    }else m.warnPay=0;
    return;
  }
  /* вторая строка «Пустого контракта»: деньгами его больше не обидеть */
  if(short>0&&relicDeep("blank")){m.warnPay=0;return;}
  if(short>0){
    m.loy=Math.max(0,m.loy-min*.5*drop*((typeof holdLoyaltyHold==="function"&&holdLoyaltyHold())?0:1));   /* Красный уголок (G6) */
    if(!m.warnPay&&m.loy<45){
      m.warnPay=1;mgrSay(m,"Домен пустой — сижу на голом проценте. Я это помню.","warn");
      logAdd("warn",m.name+" на голом проценте: домен ничего не принёс — лояльность подтаивает");
    }
  }else{
    m.warnPay=0;
    /* лояльность растёт медленнее, чем падает: доверие дороже обиды */
    m.loy=Math.min(100,m.loy+min*.35/drop);
  }
}
/* ── работа домена: возвращает «сколько сделано» (оно же опыт) ── */
function mgrDomain(m,min){
  /* витрина дома — репутация, а не склад: чем она богаче, тем охотнее с вами
     работают, но не больше десятой части сверху (12j) */
  min=min*(1+homeShowBonus());
  const speed=mgrTraitMul(m,"speed");
  if(m.role==="cmd")   return mgrWorkCmd(m,min*speed);
  if(m.role==="keep")  return mgrWorkKeep(m,min*speed);
  if(m.role==="fact")  return mgrWorkFact(m,min*speed);
  if(m.role==="sci")   return mgrWorkSci(m,min*speed);
  return 0;
}
/* Командир не зарабатывает сам — он ведёт чужую работу. Опыт идёт от рейсов
   звена, а доля снимается с того, что звено привозит (см. crewCredit). */
function mgrWorkCmd(m,min){
  const crew=G.crew.filter(c=>c.shipId&&c.order&&c.order.kind!=="home");
  if(!crew.length)return 0;
  for(const c of crew){
    /* ротация: раненого он сам ставит на прикол, не дожидаясь вашего приказа */
    if(mgrRule(m,"repair")&&mgrPerk(m,"rota")&&c.hull<c.hullMax*.4&&c.order.kind!=="home"){
      c.order={kind:"home",sx:c.order.sx,sy:c.order.sy};c.tripMin=0;
      mgrSay(m,c.name+" отозван: корпус "+Math.round(c.hull)+"/"+Math.round(c.hullMax));
    }
    /* трус отзывает всех при опасности — даже когда не надо */
    if((mgrRule(m,"nofight")||mgrHas(m,"coward"))&&
       sysDanger(c.order.sx,c.order.sy)>(mgrHas(m,"coward")?.35:.72)&&c.order.kind==="hunt"){
      c.order={kind:"home",sx:c.order.sx,sy:c.order.sy};
      mgrSay(m,c.name+" не пошёл в бой: сектор слишком дикий","warn");
    }
    if(mgrRule(m,"ransom")&&c.state==="hostage"&&c.ransom&&G.credits>=c.ransom*1.5){
      if(typeof ransomPay==="function"&&ransomPay(c))
        mgrSay(m,"Выкупил "+c.name+" не спрашивая — так дешевле","good");
    }
  }
  return min*crew.length*.5;
}
/* Смотритель держит дронов и стройку. Доход у него не свой, поэтому опыт идёт
   от числа живых точек: пустой домен не растит никого. */
function mgrWorkKeep(m,min){
  const n=(G.drones||[]).length;
  let work=min*(n*.4+Object.keys(G.bases||{}).length*.3);
  if(mgrRule(m,"redeploy")&&mgrPerk(m,"relay")&&G.droneInventory>0&&n<6){
    /* дрон из трюма сам уходит на точку в системе, где стоит игрок */
    m.pend=(m.pend||0)+min;
    if(m.pend>8){m.pend=0;mgrSay(m,"Дрон переброшен на новую точку");}
  }
  return work;
}
/* Фактор — единственный, кто приносит чистые кредиты сам. Маршрут строится из
   станций, которые игрок уже нашёл: он не открывает мир за игрока, он его доит. */
/* Маршрут не выдумывается генератором: в него попадают станции, куда игрок
   прилетал сам. Фактор не открывает мир за игрока — он доит уже открытое. */
function mgrRouteVisit(sys){
  const m=mgrOf("fact");
  if(!m||!sys||!sys.station)return;
  const key=sys.sx+","+sys.sy;
  if(m.route.indexOf(key)>=0)return;
  if(m.route.length>=mgrRouteMax(m)){
    if(!mgrRule(m,"run"))return;
    m.route.shift();                 // новое плечо вытесняет самое старое
  }
  m.route.push(key);
  mgrSay(m,"Плечо маршрута: «"+sys.station.name+"»");
}
function mgrRouteMax(m){return 2+(mgrPerk(m,"leg")?1:0)+(mgrLevel(m)>=5?1:0);}
/* ── лучшее плечо маршрута ──
   Маршрут перестал быть числом «26 за плечо»: фактор возит НАСТОЯЩИЙ товар по
   настоящим ценам (`marketFor`) между станциями, которые вы ему открыли. Ищем
   лучшую пару «где дёшево → где дорого» по всем плечам и всем товарам: это и
   есть то, чем он занят. Возвращает {k,buy,sell,margin,from,to} или null. */
function mgrBestLeg(m){
  const keys=m.route.slice(0,mgrRouteMax(m));
  const sys=[],pr=[];
  for(const key of keys){
    const [sx,sy]=key.split(",").map(Number);
    const s=getSystem(sx,sy);
    if(!s||!s.station)continue;
    sys.push(s);pr.push(marketFor(s));
  }
  if(sys.length<2)return null;
  let best=null;
  for(let a=0;a<sys.length;a++)for(let b=0;b<sys.length;b++){
    if(a===b)continue;
    for(const k of TRADE_KEYS){
      const margin=pr[b][k]-pr[a][k];
      if(margin<=0)continue;
      if(!best||margin>best.margin)
        best={k,margin,buy:pr[a][k],sell:pr[b][k],from:sys[a],to:sys[b]};
    }
  }
  return best;
}
function mgrWorkFact(m,min){
  if(!mgrRule(m,"run"))return min*.2;
  const legs=Math.min(m.route.length,mgrRouteMax(m));
  if(legs<2)return min*.2;
  const leg=mgrBestLeg(m);
  /* Пол маржи: даже когда цены на плечах сошлись, маршрут не встаёт — фактор
     возит подряды и мелочь. Без пола домен молча уходил в ноль на ровном рынке,
     и игрок видел бы не решение, а поломку. */
  /* Пол относительной маржи: даже на сошедшихся ценах маршрут не встаёт —
     фактор возит подряды и мелочь. Потолок — чтобы дикая вилка на одном товаре
     не превращала домен в станок. */
  const rel=clamp(leg?leg.margin/Math.max(1,leg.buy):.05,.05,.35);
  if(!leg&&!m.dryTold){mgrSay(m,"Цены на плечах сошлись — везу мелочь","warn");m.dryTold=1;}
  if(leg)m.dryTold=0;
  /* Оборотный капитал: сколько кредитов он успевает прокрутить за минуту.
     Считать по АБСОЛЮТНОЙ марже нельзя — тогда он «возит» ксенобиом по 190 кр
     мешками и приносит 1200 кр/мин с двух плеч. Он возит объём, а доход даёт
     относительная маржа: та же наценка на дешёвом товаре и на дорогом.
     Прибавки СКЛАДЫВАЮТСЯ, а не перемножаются: семь множителей подряд давали
     ×3.7 и превращали домен из «поднимает потолок» в «кормит вместо игры». */
  let vol=260*legs*(1+(mgrLevel(m)-1)*.12);
  let add=0;
  if(mgrPerk(m,"spec"))add+=.30;
  if(mgrPerk(m,"second"))add+=.45;
  if(mgrPerk(m,"duty"))add+=.10;
  if(mgrRule(m,"hold"))add+=.12;
  /* «Пороги» работают только будучи в слоте — как и всё прочее у домена */
  if(mgrRule(m,"buylow"))add+=.14;
  if(mgrRule(m,"sellhi"))add+=.14;
  /* «Монополия»: его товар тянет вверх цену на всём маршруте (см. marketFor) */
  if(mgrPerk(m,"mono"))add+=.25;
  if(mgrHas(m,"pirate"))add-=.10;
  vol*=Math.max(.2,1+add);
  const cap=vol*min;                 // прокручено кредитов
  let gross=Math.round(cap*rel);
  m.legNote=leg?(RES[leg.k].ru.toLowerCase()+": «"+leg.from.station.name+"» "+leg.buy+
            " → «"+leg.to.station.name+"» "+leg.sell+" кр"):"";
  /* Он давит собственную маржу: сдаёт туда же, куда возит, и цена там оседает.
     Без этого маршрут был вечной рентой, не замечающей рынка. */
  const mk=leg?G.market[leg.to.key]:null;
  if(mk)mk.pressure[leg.k]=clamp((mk.pressure[leg.k]||0)-(cap/Math.max(1,leg.buy))*.004,-.35,0);
  /* без конвоя маршрут иногда грабят: домен не бесплатная рента */
  if(!mgrPerk(m,"convoy")&&!mgrRule(m,"safe")&&
     rng(hashi(m.seed,Math.floor(Date.now()/300000),0x7A1))()<.06*min){
    gross=Math.round(gross*.35);
    mgrSay(m,"Плечо накрыли — часть груза ушла","warn");
  }
  const take=mgrTake(m,gross);
  const net=gross-take;
  earn(net,"mgr");m.earned=(m.earned||0)+net;
  if(net>0&&!(m.silent))m.lastNet=(m.lastNet||0)+net;
  return min*1.2;
}
/* ── исследователь ──
   Единственный домен, который не приносит кредитов вообще и первые часы выглядит
   чистым убытком. Окупается один раз и навсегда — чертежом, который нельзя купить. */
const BLUEPRINTS={
  coldbore:{ru:"Холодный бур",   note:"+18% к скорости бурения",  bad:"бур греется: −12% к скорости"},
  wide:    {ru:"Плотная укладка",note:"+12% к трюму",             bad:"перекос: −8% к трюму"},
  hardweld:{ru:"Двойной шов",    note:"+25 к максимуму корпуса",  bad:"шов ведёт: −15 корпуса"},
  cleanjet:{ru:"Чистая струя",   note:"+10% к тяге",              bad:"плюётся: −7% к тяге"},
  longeye:  {ru:"Длинный глаз",  note:"+180 к дальности радара",  bad:"помехи: −120 к радару"}
};
const BP_KEYS=Object.keys(BLUEPRINTS);
function bpState(k){return (G.blueprints&&G.blueprints[k])|0;}   // 1 верный, −1 ошибочный
/* «Допуск»: верный чертёж сильнее на 15% — усиливается прибавка, а не сам
   множитель, иначе +20% превратились бы в +38% и перк перекосил бы всё дерево. */
function bpMul(k,good,bad){
  const s=bpState(k);
  if(s>0)return mgrPerkOf("sci","better")?good+(good-1)*.15:good;
  return s<0?bad:1;
}
/* Игрок таскает редкое сырьё мимо лаборатории — теперь оно чем-то становится. */
function mgrSamples(){
  let n=0;for(const k of RARE_RES)n+=G.cargo[k]|0;
  return n;
}
function mgrWorkSci(m,min){
  /* «Ксеношум»: пока он слушает, лаборатория стоит. Это и есть цена поручения —
     не кредиты, а время, которого не будет ни на науку, ни на чертежи. */
  if(m.job&&m.job.hold)return min*.4;
  /* Лаборатория — его домен (§14.7). Без неё он не бездельничает совсем, но
     разбирает образцы в кают-компании: втрое медленнее и без чертежей.
     Это то же самое, что пустое звено у командира, только видно не сразу. */
  const lab=labWorking();
  if(!lab&&!m.warnLab){
    m.warnLab=1;
    mgrSay(m,"Работать негде. Нужна лаборатория на базе — и жилой отсек рядом.","warn");
  }
  if(lab)m.warnLab=0;
  /* «Синтез» и «происхождение» — работа поверх основной, раз в долгую смену */
  if(lab){relicSynth(m);relicHint(m);}
  const rate=(lab?1:.34)*(mgrPerk(m,"fast")?1.3:1)*(mgrPerk(m,"par")?1.8:1);
  m.prog=(m.prog||0)+min*rate;
  const need=14;
  let done=0,guard=6;
  while(m.prog>=need&&guard-->0){
    m.prog-=need;done++;
    /* образец из трюма ускоряет и усиливает вывод; без него он разбирает то,
       что уже лежит в лаборатории, и выхлоп куда скромнее */
    let sample=null;
    if(mgrRule(m,"rare")){
      for(const k of RARE_RES)if((G.cargo[k]|0)>0){sample=k;G.cargo[k]--;break;}
    }
    /* «Биология»: отсканированные твари и растения тоже идут в образцы —
       разведка перестаёт быть только строчкой в счётчике видов */
    if(!sample&&mgrPerk(m,"bio")&&(G.bio|0)>0){G.bio--;sample="bio";}
    const r=rng(hashi(m.seed,Math.floor(Date.now()/60000)+done*17,0x5C1));
    const mul=(sample?2.2:1)*mgrTraitMul(m,"sample")*(mgrPerk(m,"batch")?1.5:1);
    const data=Math.round((2+r()*3)*mul);
    G.data+=data;
    m.gotData=(m.gotData||0)+data;
    /* чертёж — редкий и не всегда верный: это единственный домен, где результат
       бывает отрицательным, и видно это не сразу */
    if(mgrPerk(m,"draft")&&!mgrRule(m,"data")&&r()<(sample?.3:.12)){
      const free=BP_KEYS.filter(k=>!bpState(k));
      if(free.length){
        const k=pick(free,r);
        const wrong=r()<(mgrPerk(m,"safe")?.06:.18);
        G.blueprints[k]=wrong?-1:1;
        mgrSay(m,"Чертёж: "+BLUEPRINTS[k].ru,wrong?"warn":"good");
        tell("","Чертёж: "+BLUEPRINTS[k].ru,"«"+BLUEPRINTS[k].ru+"»\n"+
          (wrong?"он уверен, что всё сходится":BLUEPRINTS[k].note));
      }
      /* глубокий разбор изредка вскрывает не чертёж, а находку: артефакты
         не покупаются, и лаборатория — один из немногих их источников */
    }else if(sample){
      mgrSay(m,"Разобран образец: "+
        (sample==="bio"?"живая ткань":RES[sample].ru.toLowerCase())+" · +"+data+" данных");
    }
  }
  return min*(mgrRule(m,"queue")?1.3:1);
}
/* перепроверка ошибочного чертежа — отдельное решение игрока, а не автоисправление */
function bpRecheck(k){
  const m=mgrOf("sci");
  if(!m){say("Нужен исследователь");return false;}
  /* «Пересборка»: половина данных возвращается — перк делает перепроверку
     дешёвой привычкой, а не разовым жестом отчаяния */
  const cost=mgrPerk(m,"redo")?30:60;
  if(G.data<cost){say("Нужно "+cost+" данных на пересборку");return false;}
  G.data-=cost;
  const r=rng(hashi(m.seed,Date.now()&0xffff,0x9B2));
  const ok=r()<(mgrPerk(m,"safe")?.9:.7);
  G.blueprints[k]=ok?1:-1;
  logAdd(ok?"":"warn","Пересборка «"+BLUEPRINTS[k].ru+"»: "+(ok?"теперь верно":"снова мимо"));
  return true;
}
