/* ══════════════ истории, часть третья ══════════════
   M131. Связи как данные: условие seenOf:"история.след" — след чужой истории
   уже виден. Переносчик: след с carry:true птица запоминает (12x) и показывает
   в списке услышанного с адресом места; в другом месте его спрашивают.
   Формат — как в первых двух частях, правила — docs/DESIGN-stories.md. */

const CAST_C={
  gardener: {name:"та, что поливала",role:"без имени"},
  anchorman:{name:"якорный",         role:"верфь"},
  nightnurse:{name:"Зоя",            role:"ночная смена",home:"fixed:21"},
  bellman:  {name:"звонарь",         role:"металлический мир"},
  accountant:{name:"Гурам Ильич",    role:"учётчик",home:"fixed:22"},
  radioman: {name:"дежурный Седьмого",role:"эфир"},
  fisher:   {name:"рыбак без моря",  role:"пустынный мир"},
  keeper:   {name:"смотритель",      role:"руины"},
  painter:  {name:"тот, кто красит", role:"комбинат"},
  teacher:  {name:"Фаина",           role:"учит счёту",home:"fixed:23"},
  pilotess: {name:"пилот Самохина",  role:"позывной Сорок-два"},
  dog:      {name:"собака",          role:"не собака"}
};
for(const k in CAST_C)CAST[k]=CAST_C[k];

const STORIES_C=[

/* ── 73. Птица принесла позывной ── переносчик · из «Второго стакана» */
{id:"carried_callsign",form:"pair",at:"stype:trade",cast:["zero7"],
 traces:[
  {id:"t1",via:"queue",when:{parrot:true,seenOf:"second_glass.t1"},text:"— Ваша птица сказала «Ноль-семь». Где вы это слышали? …Понятно. Не говорите ей больше ничего."},
  {id:"t2",via:"queue",when:{parrot:true,seenOf:"second_glass.t5"},text:"— «Дождался». Это птица сказала. Она не знает, что это значит. Вы, кажется, знаете."}
 ],
 links:["second_glass"]},

/* ── 74. Кто поливал ── после · связано с садом в кратере */
{id:"who_watered",form:"after",at:"stype:outpost",cast:["gardener"],
 traces:[
  {id:"t1",via:"queue",when:{seenOf:"crater_garden.t1"},text:"— Грядки в кратере? Это её. Она улетела сюда, чтобы заработать на воду. Зарабатывает. Воду туда никто не возит."},
  {id:"t2",via:"cant",when:{seenOf:"crater_garden.t1"},scene:{seat:"door",figure:1,col:[96,88,72],props:["jar"]}},
  {id:"t3",via:"queue",when:{seenOf:"crater_garden.t3"},text:"— Взошло? Правда? Не говорите ей. Она решит, что можно не возвращаться, и останется здесь насовсем."}
 ],
 links:["crater_garden"]},

/* ── 75. Якорный ── привычка · верфь */
{id:"anchorman",form:"habit",at:"stype:yard",cast:["anchorman"],
 traces:[
  {id:"t1",via:"queue",text:"— Якорный. Держит якорь. Какой якорь у станции — не спрашивайте; он держит, и она на месте."},
  {id:"t2",via:"cant",scene:{seat:"corner",figure:1,col:[70,74,84],props:["key","key"]}},
  {id:"t3",via:"queue",when:{visits:4},text:"— Якорный заболел на день. Станцию не унесло. Он говорит: это потому, что он держал из каюты."}
 ]},

/* ── 76. Ночная Зоя ── привычка · комбинат, фиксированная */
{id:"night_zoya",form:"habit",at:"fixed:21",cast:["nightnurse"],
 traces:[
  {id:"t1",via:"cant",when:{late:true},scene:{seat:"end",figure:1,col:[104,96,100],props:["cup","paper"]}},
  {id:"t2",via:"queue",when:{late:true},text:"— Зоя. Ночная. Она дежурит там, где дежурить уже не надо. Ей так спокойнее, и нам тоже."},
  {id:"t3",via:"queue",when:{late:false},text:"— Зоя? Спит. Ночью приходите. Днём её как будто нет, и в этом что-то есть."},
  {id:"t4",via:"table",item:"rumour",when:{item:"rumour",late:true},text:"— Знаю. Я ночью всё знаю. Днём забываю, это правило."}
 ]},

/* ── 77. Звонарь ── связано с колоколом · металлический мир */
{id:"bell_ringer",form:"pair",at:"stype:outpost",cast:["bellman"],
 traces:[
  {id:"t1",via:"queue",when:{seenOf:"rust_bell.t1"},text:"— Лист с костью на гребне? Это он повесил. Говорит: чтобы планета звучала. Она и звучит."},
  {id:"t2",via:"ether",when:{seenOf:"rust_bell.t1"},text:"…слышите? Это не помехи. Это он. Ветер и кость. Я записываю по ночам."}
 ],
 links:["rust_bell"]},

/* ── 78. Гурам Ильич сводит ── деньги · торговый узел, фиксированная */
{id:"accountant",form:"place",at:"fixed:22",cast:["accountant"],
 traces:[
  {id:"t1",via:"cant",scene:{seat:"far",figure:1,col:[88,84,78],props:["paper","paper","tally","glass_empty"]}},
  {id:"t2",via:"queue",text:"— Гурам Ильич сводит. Баланс станции. Он не сходится двадцать лет, и Гурам Ильич каждый вечер находит, где."},
  {id:"t3",via:"queue",when:{visits:3},text:"— Баланс сошёлся. Гурам Ильич не рад. Он говорит, что теперь не знает, что делать по вечерам."},
  {id:"t4",via:"queue",when:{visits:5},text:"— Баланс снова не сходится. Гурам Ильич спокоен. Мы подозреваем, что это он сам, но не спрашиваем."}
 ]},

/* ── 79. Дежурный Седьмого ── эфир */
{id:"seventh_duty",form:"ether",at:"any",cast:["radioman"],
 traces:[
  {id:"t1",via:"ether",text:"…Седьмой, дежурный. Докладываю: всё то же. Конец связи. …Нет, не конец. Ещё постою."},
  {id:"t2",via:"ether",when:{seen:"t1"},text:"…Седьмой, дежурный. Сегодня прошёл мимо кто-то с огнями. Не наш. Не ответил. Я не обиделся."},
  {id:"t3",via:"ether",when:{seen:"t2"},text:"…Седьмой. Дежурного сменили. Я новый. Старый велел говорить «всё то же». Всё то же."}
 ]},

/* ── 80. Рыбак без моря ── привычка · пустынный мир */
{id:"dry_fisher",form:"habit",at:"world:desert",cast:["fisher"],
 traces:[
  {id:"t1",via:"land",text:"На краю площадки сидит человек с удочкой. Леска уходит в песок."},
  {id:"t2",via:"land",when:{visits:2},text:"Удочка на месте. Рядом ведро. В ведре — песок. Он доволен."},
  {id:"t3",via:"queue",when:{seen:"t1"},text:"— С удочкой? Он ловит. Что — не говорит. Один раз вытащил что-то, мы не видели что, а он с тех пор спокойный."}
 ]},

/* ── 81. Смотритель руин ── привычка · руинный мир */
{id:"ruin_keeper",form:"habit",at:"world:ruin",cast:["keeper"],
 traces:[
  {id:"t1",via:"land",text:"У руин подметено. Кто-то метёт ступени, которые никуда не ведут."},
  {id:"t2",via:"cave",text:"Внизу тоже чисто. Метла стоит у стены. Рядом — вторая, на случай гостей."},
  {id:"t3",via:"land",when:{visits:3},text:"Ступени подметены. На верхней — кружка, ещё тёплая. Вас ждали к этому часу."}
 ]},

/* ── 82. Тот, кто красит ── привычка · комбинат, связано с комиссией */
{id:"painter",form:"habit",at:"stype:indust",cast:["painter"],
 traces:[
  {id:"t1",via:"queue",text:"— Красит. Всё. Стены, трубы, людей, если стоят. Комиссия уехала, а он не остановился."},
  {id:"t2",via:"queue",when:{seenOf:"commission.t6",visits:2},text:"— Бумагу с линиями тоже покрасил. Теперь там ровные линии поверх ровных линий. Комиссия бы одобрила."},
  {id:"t3",via:"cant",scene:{seat:"door",figure:1,col:[120,100,80],props:["jar","jar"]}}
 ],
 links:["commission"]},

/* ── 83. Фаина учит счёту ── место · научная, фиксированная */
{id:"teacher",form:"place",at:"fixed:23",cast:["teacher"],
 traces:[
  {id:"t1",via:"cant",scene:{seat:"far",figure:1,col:[96,90,100],props:["tally","paper"]}},
  {id:"t2",via:"queue",text:"— Фаина учит счёту. Всех. Кто умеет — тоже. Говорит, счёт забывается, если не учить заново."},
  {id:"t3",via:"queue",when:{seenOf:"glasses_counts.t1"},text:"— Тот, в очках, который считает прилёты? Её ученик. Лучший. Она им гордится и просит не считать вслух."},
  {id:"t4",via:"table",item:"cargo",when:{item:"cargo"},text:"— Сколько? Не говорите. Я сама. …Столько. Верно? Вот видите, считать надо заново."}
 ],
 links:["glasses_counts"]},

/* ── 84. Сорок-два ── эфир · двое */
{id:"forty_two",form:"pair",at:"any",cast:["pilotess"],
 traces:[
  {id:"t1",via:"ether",when:{noflag:"landed"},text:"…Сорок-два, заходите. Сорок-два? …Она не заходит. Третий год кружит и не заходит."},
  {id:"t2",via:"queue",when:{noflag:"landed"},text:"— Самохина. Позывной Сорок-два. Кружит над нами, садиться не хочет. Мы ей свет оставляем."},
  {id:"t3",via:"ether",when:{flag:"landed"},text:"…Сорок-два села. Повторяю для тех, кто не верит: села."},
  {id:"t4",via:"cant",when:{flag:"landed"},scene:{seat:"door",figure:1,col:[90,96,110],props:["cap","glass"]}},
  {id:"t5",via:"queue",when:{flag:"landed"},text:"— Села. Сидит у двери, молчит. Мы тоже молчим. Три года готовились, что сказать, — и молчим."}
 ],
 /* Развилка С1 (не показывается): «мы ей свет оставляем» — и садится она
    только там, где садятся при ней. Ворота when: поворот ждёт второго
    прилёта игрока; кто прочёл слух и исчез — оставил её кружить. */
 turns:[{after:"seen:t2",days:26,set:"landed",when:{visits:2}}]},

/* ── 85. Собака, которая не собака ── зверь · любая станция */
{id:"not_dog",form:"beast",at:"any",cast:["dog"],
 traces:[
  {id:"t1",via:"queue",text:"— Собака? Это не собака. Но мы зовём собакой, и она отзывается. Откуда — не знаем. Живёт."},
  {id:"t2",via:"cant",scene:{seat:"door",figure:0,props:["cup"]}},
  {id:"t3",via:"queue",when:{visits:3},text:"— Собака ушла с кем-то. Вернулась через неделю. Одна. Того, с кем ушла, мы больше не видели, а она не рассказывает."}
 ]},

/* ── 86. Стакан на Крайней ── связано с позывным */
{id:"edge_glass",form:"after",at:"danger:far",cast:[],
 traces:[
  {id:"t1",via:"cant",when:{seenOf:"answering_callsign.t1"},scene:{seat:"corner",figure:0,props:["glass","paper"]}},
  {id:"t2",via:"queue",when:{seenOf:"answering_callsign.t1"},text:"— Угловой стол? Там сидят, когда кто-то отвечает на старый позывной. Вы отвечали? Тогда сядьте."}
 ],
 links:["answering_callsign"]},

/* ── 87. Дверца нашлась ── вещь · связка Пекаря, переносчик */
{id:"door_found",form:"thing",at:"stype:yard",cast:["baker"],
 traces:[
  {id:"t1",via:"queue",when:{seenOf:"baker_oven.t4"},carry:true,text:"— Дверца от печи? Обожжённая? Была. Увезли на прошлой неделе. Куда — в сторону Пекаря, кажется."},
  {id:"t2",via:"queue",when:{seenOf:"baker_oven.t4",visits:2},text:"— Вы про дверцу спрашивали. Ещё одна нашлась. Не та. Но обожжённая. Возьмёте?"}
 ],
 links:["baker_oven"]},

/* ── 88. Вторая лампа ── связано с площадкой */
{id:"second_lamp",form:"after",at:"stype:outpost",cast:["lamp"],
 traces:[
  {id:"t1",via:"queue",when:{seenOf:"pad_lamp.t4"},text:"— У нас тоже лампа. Мы её зажгли, когда у них погасла. Кто-то же должен."},
  {id:"t2",via:"ether",when:{seenOf:"pad_lamp.t4"},text:"…площадка с одной лампой. Это теперь мы. Идите на неё, если что."}
 ],
 links:["pad_lamp"]},

/* ── 89. Тень на парад ── небо · научная */
{id:"parade_shadow",form:"ongoing",at:"stype:sci",cast:[],
 traces:[
  {id:"t1",via:"queue",when:{eclipse:true},text:"— Сегодня темно. У нас по этому поводу не работают. Не по правилу — просто все наверху."},
  {id:"t2",via:"cant",when:{eclipse:true},scene:{seat:"far",figure:0,props:["glass_empty","glass_empty","glass_empty"]}},
  {id:"t3",via:"queue",when:{eclipse:false,seen:"t1"},text:"— Вы были в темноту? Тогда вы наш. У нас так считается."}
 ]},

/* ── 90. Долг Кима закрыл кто-то другой ── связка */
{id:"kim_paid_by",form:"versions",at:"stype:trade",cast:["kim"],
 traces:[
  {id:"t1",via:"queue",when:{seenOf:"kim_debt.t4"},text:"— Ким отдал? Не Ким. За него отдали. Кто — мы знаем, но Ким не знает, и пусть."},
  {id:"t2",via:"news",when:{seenOf:"kim_debt.t4"},text:"Долг Долгого Кима закрыт. Ким говорит, что сам. Книга говорит иначе, но книгу не спрашивают."}
 ],
 links:["kim_debt"]},

/* ── 91. Прогноз пришёл на Стойку ── связка */
{id:"forecast_rack",form:"ongoing",at:"fixed:3",cast:["rack"],
 traces:[
  {id:"t1",via:"ether",when:{seenOf:"forecast_same.t4"},text:"…стойка. Прогноз слышали? Настоящий. Шестой, ты бы удивился. …Шестой?"}
 ,{id:"t2",via:"queue",when:{seenOf:"forecast_same.t4"},text:"— Прогноз настоящий теперь. Стойка говорит, шестой бы порадовался. Мы не спрашиваем, кто такой шестой."}
 ],
 links:["forecast_same","rack_voice"]},

/* ── 92. Кто сидел у окна ── связка двоих у окна */
{id:"window_one",form:"pair",at:"stype:trade",cast:["quiet"],
 traces:[
  {id:"t1",via:"cant",when:{seenOf:"two_window.t4"},scene:{seat:"far",figure:1,col:[80,90,100],props:["glass"]}},
  {id:"t2",via:"queue",when:{seenOf:"two_window.t4"},text:"— Этот? Прилетел с научной. Сидит, смотрит наружу. Говорит, там ему было с кем смотреть. Здесь учится смотреть одному."}
 ],
 links:["two_window"]},

/* ── 93. Чайник закипел у других ── вещь · связка */
{id:"kettle_moved",form:"thing",at:"stype:outpost",cast:["kettle"],
 traces:[
  {id:"t1",via:"queue",when:{seenOf:"kettle.t3"},text:"— Чайник, который сам кипит? Слышали. У нас такого нет. У нас есть кружка, которая сама остывает. Другой коленкор."},
  {id:"t2",via:"cant",when:{seenOf:"kettle.t3"},scene:{seat:"end",figure:0,props:["cup"]}}
 ],
 links:["kettle"]},

/* ── 94. Половина дока долетела ── после · связка */
{id:"half_dock_arrived",form:"after",at:"stype:yard",cast:[],
 traces:[
  {id:"t1",via:"queue",when:{seenOf:"half_dock.t2"},text:"— Половина дока? Прилетела. Встала рядом с нашим. Мы не спрашивали, чья. Теперь у нас полтора."},
  {id:"t2",via:"news",when:{seenOf:"half_dock.t2"},text:"Половина дока пристыковалась к чужой верфи. Верфь не возражает. Докам виднее."}
 ],
 links:["half_dock"]},

/* ── 95. Сторож маяка замолчал ── эфир · связка */
{id:"lighthouse_silent",form:"ether",at:"danger:far",cast:["watchman"],
 traces:[
  {id:"t1",via:"ether",when:{seenOf:"lighthouse.t3"},text:"…маяк Семнадцатый. Говорит автомат. Сторож просил передавать: «свет на месте». Передаю."},
  {id:"t2",via:"queue",when:{seenOf:"lighthouse.t3"},text:"— Сторож с Семнадцатого? Перевёлся. Куда — где слушают. Он так и написал в заявлении: «где слушают»."}
 ],
 links:["lighthouse"]},

/* ── 96. Свеча везде ── необъяснимое · связка */
{id:"candle_everywhere",form:"place",at:"stype:sci",cast:[],
 traces:[
  {id:"t1",via:"cant",when:{seenOf:"candle_middle.t1"},scene:{seat:"far",figure:0,props:["candle"]}},
  {id:"t2",via:"queue",when:{seenOf:"candle_middle.t2"},text:"— Свеча? Да, и у нас. Мы думали, только у нас. Вы третий, кто спрашивает. Значит, не только."}
 ],
 links:["candle_middle"]},

/* ── 97. Щёлканье ответило ── эфир · связка */
{id:"clicking_answer",form:"ether",at:"danger:far",cast:[],
 traces:[
  {id:"t1",via:"ether",when:{seenOf:"clicking.t2"},text:"…три и два. Три и два. Кто-то ответил. Я ответил. Теперь мы щёлкаем вдвоём, и мне не страшно."}
 ,{id:"t2",via:"ether",when:{seen:"t1"},text:"…три и два. …Два и три. Это не я. Нас трое."}
 ],
 links:["clicking"]},

/* ── 98. Собака узнала Ороза ── зверь · связка */
{id:"dog_oroz",form:"beast",at:"stype:outpost",cast:["dog","bargeman"],
 traces:[
  {id:"t1",via:"queue",when:{seenOf:"skipper.t3"},text:"— Когда Ороз заходил, собака его узнала. Она никого не узнаёт. Его — узнала. Мы не спрашиваем, откуда."}
 ,{id:"t2",via:"cant",when:{seenOf:"skipper.t3"},scene:{seat:"door",figure:0,props:["cup","cap"]}}
 ],
 links:["skipper","not_dog"]},

/* ── 99. Улей переехал ── привычка · связка */
{id:"hive_moved",form:"habit",at:"stype:trade",cast:["beekeeper"],
 traces:[
  {id:"t1",via:"queue",when:{seenOf:"beehive.t1"},text:"— Сильва прилетала. С ульем. Сидела в кантине, гудело. Улетела обратно: здесь, говорит, не тот воздух для них."},
  {id:"t2",via:"cant",when:{seenOf:"beehive.t1"},scene:{seat:"corner",figure:0,props:["jar","jar"]}}
 ],
 links:["beehive"]},

/* ── 100. Второй стакан — эпилог ── связка, переносчик */
{id:"second_glass_far",form:"after",at:"danger:far",cast:["zero7"],
 traces:[
  {id:"t1",via:"find",when:{item:"hulk",seenOf:"second_glass.t4"},carry:true,text:"В остове на стене — два стакана, закреплённые, чтобы не улетели. Один пустой. Бирка борта: Ноль-семь."},
  {id:"t2",via:"queue",when:{seen:"t1"},text:null}
 ],
 links:["second_glass"]},

/* ── 101. Чужая площадка занята ── после · связка */
{id:"pad_taken",form:"after",at:"planet",cast:[],
 traces:[
  {id:"t1",via:"land",when:{seenOf:"empty_pad.t2"},text:"Вторая площадка занята. Чужой борт, без огней. Дождались."},
  {id:"t2",via:"cave",when:{seenOf:"empty_pad.t2"},text:"В пещере двое спали. Недавно. Два места, примято одинаково."}
 ],
 links:["empty_pad"]},

/* ── 102. Имя на кристалле ── связка */
{id:"crystal_name_owner",form:"thing",at:"stype:sci",cast:[],
 traces:[
  {id:"t1",via:"queue",when:{seenOf:"named_crystal.t1"},text:"— Кристалл с именем? Это её имя. Она здесь работала. Улетела на кристаллический и не вернулась — не пропала, а не вернулась. Разница есть."},
  {id:"t2",via:"cant",when:{seenOf:"named_crystal.t1"},scene:{seat:"end",figure:0,props:["paper","glass_empty"]}}
 ],
 links:["named_crystal"]},

/* ── 108. Смотровая скамейка ── место · научная, плавающая ──
   Развилка С3 (не показывается): открытка — слепок сцены, ушедший в общую
   почту, и мир его видел (ключ card, G.mailed). Отправил карточку отсюда —
   к скамейке начали приезжать; не отправил — её снимут за ненадобностью.
   Никто никогда не скажет «после вашей карточки»: игрок сам сложит, или нет. */
{id:"bench_view",form:"place",at:"stype:sci",cast:[],
 traces:[
  {id:"t1",via:"queue",when:{none:["quiet","known"]},text:"— Со смотровой видно то же, что отовсюду. Но скамейка хорошая. Сидите, если хотите."},
  {id:"t2",via:"ether",when:{none:["quiet","known"]},text:"…смотровая закрыта на уборку. Открыта. Закрыта. Да сидите уже, кому вы мешаете."},
  {id:"t3",via:"queue",when:{flag:"quiet"},text:"— Скамейку со смотровой снимут. Не сидит никто, а метизы — дефицит."},
  {id:"t4",via:"queue",when:{flag:"known"},text:"— На смотровой теперь люди. Говорят: где-то это место видели. Где видели — не говорят. Сидят."},
  {id:"t5",via:"ether",when:{flag:"known"},text:"…к смотровой не подниматься группами больше трёх. Больше трёх! Никогда такого не было."}
 ],
 turns:[{after:"seen:t1",days:15,set:"quiet",unless:{card:true},else:"known"}]}
];
for(const S of STORIES_C)STORIES.push(S);
