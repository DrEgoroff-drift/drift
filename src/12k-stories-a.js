/* ══════════════ истории, часть первая ══════════════
   Данные для 11c-stories. Формат и правила — docs/DESIGN-stories.md.
   Названия историй рабочие: игроку не показываются никогда.

   Как читать запись:
     at      — адрес: fixed:N (система по посеву), stype:X (любая станция
               типа), any, danger:far. Плавающая прибивается при первой встрече.
     traces  — следы; via: ether | queue | table | find | news | cant.
               text:null — молчание (полноправная реплика).
               scene (cant): {seat:corner|far|end|door, figure:0|1, props:[…]}.
     when    — условия из словаря STORY_WHEN (11c). Порядок следов свободен.
     turns   — повороты: {after:"seen:t2",days:N,set:"flag"} или {day:N,set}.
     form    — главная форма: habit pair after ongoing versions thing place
               beast ether witness.
     links   — связи с другими историями; никогда не обязательны.

   Труппа: имя, роль, дом. Один и тот же человек во всех историях, где он назван. */

const CAST={
  zero7:    {name:"Ноль-семь",        role:"позывной"},
  corner:   {name:"человек в углу",   role:"без имени"},
  lamp:     {name:"диспетчер площадки",role:"форпост"},
  baker:    {name:"Пекарь",           role:"соперник",home:"fixed:7"},
  sovenya:  {name:"Совеня",           role:"соперник",home:"fixed:8"},
  efim:     {name:"Тихий Ефим",       role:"соперник"},
  krapiva:  {name:"Мадам Крапива",    role:"соперник",home:"fixed:9"},
  kim:      {name:"Долгий Ким",       role:"соперник",home:"fixed:10"},
  shtof:    {name:"Штоф",             role:"соперник",home:"fixed:11"},
  forecaster:{name:"голос прогноза",  role:"эфир"},
  rack:     {name:"Стойка",           role:"диспетчер"},
  miner:    {name:"ночной",           role:"шахтёр"},
  pairA:    {name:"Два-девять",       role:"позывной"},
  pairB:    {name:"Два-девять-бис",   role:"позывной"},
  semyon:   {name:"Семён Палыч",      role:"наблюдатель",home:"fixed:12"},
  commission:{name:"комиссия",        role:"трое с бумагой"},
  nt:       {name:"Гедеван",          role:"монтажник",home:"fixed:13"},
  letter:   {name:"голос с письмом",  role:"эфир"},
  librarian:{name:"Ада Львовна",      role:"хранитель полки",home:"fixed:14"},
  reporter: {name:"дежурный по явлению",role:"научная"}
};

const STORIES=[

/* ── 1. Второй стакан ── двое · торговый узел, плавающая */
{id:"second_glass",form:"pair",at:"stype:trade",cast:["zero7","corner"],
 traces:[
  {id:"t1",via:"ether",text:"…борт Ноль-семь, как слышно? Ноль-семь? …Повторяю для Ноль-семь."},
  {id:"t2",via:"cant",when:{visits:2,noflag:"gone"},scene:{seat:"corner",figure:1,props:["glass","glass"]}},
  {id:"t3",via:"queue",when:{visits:2,noflag:"gone"},text:"— Туда не садитесь. Занято."},
  {id:"t4",via:"cant",when:{flag:"gone"},scene:{seat:"corner",figure:0,props:["glass"]}},
  {id:"t5",via:"queue",when:{flag:"gone"},text:"— Дождался, наверное. Или перестал."},
  {id:"t6",via:"table",item:"strip",when:{item:"strip",flag:"gone"},text:null},
  /* развилка (M259): если игрок ВОЗВРАЩАЛСЯ — четыре захода на этот узел, —
     Ноль-семь дождался: флаг gone не ставится, и стаканы на t2 стоят дальше
     сами собой. Никто не говорит игроку, что это из-за него */
  {id:"t7",via:"queue",when:{flag:"met"},text:"— Теперь носим два. И оба полные недолго стоят."}
 ],
 turns:[{after:"seen:t2",days:6,set:"gone",unless:{visits:4},else:"met"}],
 links:["parrot_callsign"]},

/* ── 2. Лампа на площадке ── привычка · форпост, фиксированная */
{id:"pad_lamp",form:"habit",at:"fixed:1",cast:["lamp"],
 traces:[
  {id:"t1",via:"ether",when:{noflag:"off"},text:"…если слышите — у нас лампа на площадке горит. Одна. Идите на неё."},
  {id:"t2",via:"queue",when:{noflag:"off"},text:"— Зажигаю. В расписании плечо есть — значит, зажигаю. Кто там по расписанию, не спрашивайте."},
  {id:"t3",via:"queue",when:{visits:3,noflag:"off"},text:"— Лампу? Нет, не помню, кто её первый зажёг. Я её тушить не буду, это точно."},
  {id:"t4",via:"queue",when:{flag:"off"},text:null},
  {id:"t5",via:"ether",when:{flag:"off"},text:"…площадка тёмная. Садитесь по приборам, как все."},
  /* развилка (M259): открытка, отправленная С ЭТОГО места, — значит, лампу
     кто-то видел и запомнил. Диспетчер продолжает зажигать. Связь не
     называется: игрок в лучшем случае почувствует, что край его помнит */
  {id:"t6",via:"queue",when:{flag:"kept"},text:"— Лампу? Горит. Пока на неё идут — горит."}
 ],
 turns:[{after:"seen:t2",days:14,set:"off",unless:{strip:"here"},else:"kept"}]},

/* ── 3. Смена не придёт ── версии · три типа станций */
{id:"no_shift",form:"versions",at:"stype:indust",cast:[],
 traces:[
  {id:"t1",via:"ether",text:"…передайте на верхний ярус, что смена не придёт. Никакая."},
  {id:"t2",via:"queue",when:{visits:2},text:"— Верхний ярус? Газ там был. Не сильный, но после такого не ходят."},
  {id:"t3",via:"queue",when:{visits:3},text:"— Какой газ, кто вам сказал. Свадьба у них была. Вся смена — одна семья, представляете."},
  {id:"t4",via:"queue",when:{visits:4},text:"— Их просто не взяли на борт. Место кончилось. Вот и вся смена."},
  {id:"t5",via:"cant",when:{visits:2},scene:{seat:"far",figure:0,props:["cup","cup","cup"]}}
 ]},

/* ── 4. Пекарь не печёт ── соперник · дом Пекаря */
{id:"baker_oven",form:"thing",at:"fixed:7",cast:["baker"],
 traces:[
  {id:"t1",via:"cant",when:{noflag:"door"},scene:{seat:"end",figure:0,props:["bread","bread"]}},
  {id:"t2",via:"queue",text:"— Пекарь? Он не пёк никогда. Прозвище — за то, что встаёт рано. Всё остальное люди выдумали."},
  {id:"t3",via:"queue",when:{visits:2},text:"— Пёк. Ещё как пёк. Потом печь увезли, а он остался. Теперь собирает что попало."},
  {id:"t4",via:"news",when:{visits:2},text:"Пекарь ищет дверцу от печи. Обожжённую. Платит как за редкость."},
  {id:"t5",via:"table",item:"cargo",when:{item:"cargo",visits:3},text:"— Не то. Я узнаю, когда будет то."},
  {id:"t6",via:"cant",when:{flag:"door"},scene:{seat:"end",figure:1,props:[]}}
 ],
 turns:[{after:"seen:t4",days:20,set:"door"}]},

/* ── 5. Трепло знает слово ── переносчик · любой торговый узел, с птицей */
{id:"parrot_callsign",form:"pair",at:"stype:trade",cast:["zero7"],
 traces:[
  {id:"t1",via:"queue",when:{parrot:true},text:"— Откуда у вашей птицы этот позывной? Ноль-семь. Нет, не отвечайте."},
  {id:"t2",via:"queue",when:{parrot:true,visits:3},text:null}
 ],
 links:["second_glass"]},

/* ── 6. Мадам Крапива не летает ── привычка · дом Крапивы */
{id:"krapiva_suitcase",form:"habit",at:"fixed:9",cast:["krapiva"],
 traces:[
  {id:"t1",via:"cant",when:{none:["ship","rode"]},scene:{seat:"door",figure:1,col:[92,70,96],props:["paper"]}},
  {id:"t2",via:"queue",when:{none:["ship","rode"]},text:"— Это Крапива. Она не летает. Она сидит с билетом и ждёт баржу, а баржа её не берёт. Уже который год."},
  {id:"t3",via:"queue",when:{visits:3,none:["ship","rode"]},text:"— Говорит: я не летаю, я еду. Разницу не объясняет."},
  {id:"t4",via:"news",when:{flag:"ship"},text:"Мадам Крапива купила корабль. Целиком, с экипажем. Куда — не сказала."},
  {id:"t5",via:"cant",when:{flag:"ship"},scene:{seat:"door",figure:0,props:["paper"]}},
  /* развилка (M259/M260): она сидит У ДВЕРИ и смотрит на пилотов. Корпус в
     швах — живое доказательство, что падают и возвращаются. Тогда она не
     покупает корабль — она однажды просто просится на баржу. Связь не
     называется: билет остаётся лежать, и это весь текст */
  {id:"t6",via:"news",when:{flag:"rode"},text:"Мадам Крапива уехала. Баржей, палубной. Говорят, сама подошла и попросилась."},
  {id:"t7",via:"cant",when:{flag:"rode"},scene:{seat:"door",figure:0,props:["paper"]}}
 ],
 turns:[{after:"seen:t2",days:24,set:"ship",unless:{seams:4},else:"rode"}]},

/* ── 7. Ефимово место ── место · везде, где есть стойка */
{id:"efim_stool",form:"place",at:"any",cast:["efim"],
 traces:[
  {id:"t1",via:"cant",scene:{seat:"end",figure:0,props:["stool_empty"]}},
  {id:"t2",via:"queue",when:{visits:2},text:"— Крайний не занимайте. Ефимово."},
  {id:"t3",via:"find",when:{visits:1},text:"Капсула. Бирка «Е.», припасы свежие, не старше недели. Кто-то здесь был. Недавно."}
 ]},

/* ── 8. Прогноз без изменений ── идёт само · научная станция, фиксированная */
{id:"forecast_same",form:"ongoing",at:"fixed:2",cast:["forecaster"],
 traces:[
  {id:"t1",via:"ether",when:{noflag:"fixed"},text:"…прогноз: без изменений. Как вчера. Как всегда."},
  {id:"t2",via:"queue",when:{noflag:"fixed"},text:"— Прогноз у нас ровный. Прибор на обсерватории лет пять как не смотрит, а прогноз ровный. Удобно."},
  {id:"t3",via:"table",item:"strip",when:{item:"strip",noflag:"fixed"},text:"— Это с нашей планеты? Дайте. Дайте сюда. Вы понимаете, что тут невязка?"},
  {id:"t4",via:"ether",when:{flag:"fixed"},text:"…прогноз: пыль с ночной стороны, к утру разойдётся. Повторяю: к утру. Впервые повторяю."},
  {id:"t5",via:"queue",when:{flag:"fixed"},text:"— Прогноз теперь настоящий. Хуже стало, конечно. Раньше хоть знали, что будет."}
 ],
 turns:[{after:"seen:t3",days:2,set:"fixed"}]},

/* ── 9. Двое на одной орбите ── двое · любая станция */
{id:"two_on_orbit",form:"pair",at:"any",cast:["pairA","pairB"],
 traces:[
  {id:"t1",via:"ether",when:{noflag:"one"},text:"…— Два-девять, ты спишь? — Нет. — И я."},
  {id:"t2",via:"ether",when:{visits:2,noflag:"one"},text:"…— Два-девять, у тебя там свет горит. — Это не свет. — А что? — Не свет."},
  {id:"t3",via:"ether",when:{flag:"one"},text:"…— Два-девять, ты спишь? …Два-девять?"},
  {id:"t4",via:"cant",when:{flag:"one"},scene:{seat:"far",figure:1,dim:true,props:["cap"]}}
 ],
 turns:[{after:"seen:t1",days:9,set:"one"}]},

/* ── 10. Четыре кружки ── место · форпост, плавающая */
{id:"four_cups",form:"place",at:"stype:outpost",cast:[],
 traces:[
  {id:"t1",via:"cant",when:{freed:0,noflag:"used"},scene:{seat:"end",figure:0,props:["cup","cup","cup","cup"]}},
  {id:"t2",via:"queue",when:{noflag:"used"},text:"— Ставлю. Придут — уберу. Баржа по плечу ходила, пока там не завелись эти. Всё равно ставлю."},
  {id:"t3",via:"cant",when:{freed:1},scene:{seat:"end",figure:0,props:["cup","cup"]}},
  {id:"t4",via:"queue",when:{freed:1},text:"— Две вымыл. Двое пришли. Остальные — ну, остальные."}
 ]},

/* ── 11. Старое имя ── версии · после конца мира */
{id:"old_name",form:"versions",at:"any",cast:[],
 traces:[
  {id:"t1",via:"ether",when:{doomNear:true},text:"…я Ближняя. Да, по карте не Ближняя. По карте она давно не Ближняя."},
  {id:"t2",via:"queue",when:{doomNear:true},text:"— Переименовали. В честь тех, что остались там. Кого — не уточняли."},
  {id:"t3",via:"queue",when:{doomNear:true,visits:2},text:"— Да не в честь. Наоборот, чтобы не вспоминать. Назвали по-другому и не вспоминают."},
  {id:"t4",via:"queue",when:{doomNear:true,visits:3},text:"— Спутали просто. Картограф перепутал, а потом поздно стало. Вся история."}
 ]},

/* ── 12. Долгий Ким должен ── деньги · дом Кима */
{id:"kim_debt",form:"thing",at:"fixed:10",cast:["kim"],
 traces:[
  {id:"t1",via:"queue",when:{noflag:"paid"},text:"— Ким? Отдаст. Он всегда отдаёт. Долго, но всегда."},
  {id:"t2",via:"cant",when:{noflag:"paid"},scene:{seat:"far",figure:0,props:["key","paper"]}},
  {id:"t3",via:"news",when:{visits:2,noflag:"paid"},text:"Вещи Долгого Кима продаются с барахолки. Сам Ким не против. Сам Ким не здесь."},
  {id:"t4",via:"queue",when:{flag:"paid"},text:"— Отдал. Говорил же. Ключ только не забрал."},
  {id:"t5",via:"cant",when:{flag:"paid"},scene:{seat:"far",figure:0,props:["key"]}}
 ],
 turns:[{after:"seen:t1",days:30,set:"paid"}]},

/* ── 13. Стойка ── необъяснимое · фиксированная */
{id:"rack_voice",form:"habit",at:"fixed:3",cast:["rack"],
 traces:[
  {id:"t1",via:"ether",text:"…шестой, шестой, я стойка. Ты вообще куда ушёл?"},
  {id:"t2",via:"queue",when:{visits:1},text:"— Стойка — это я. Шестого нет. Шестого давно нет, а я всё его зову, привычка."},
  {id:"t3",via:"queue",when:{visits:3},text:"— Я стойка. Шестой… Нет, ничего."},
  {id:"t4",via:"queue",when:{visits:5},text:null},
  {id:"t5",via:"queue",when:{visits:6},text:"— Стойка — это я. Шестого нет. Шестого давно нет, а я всё его зову, привычка."}
 ]},

/* ── 14. Ночная смена ест одна ── привычка · комбинат, плавающая */
{id:"night_shift",form:"habit",at:"stype:indust",cast:["miner"],
 traces:[
  {id:"t1",via:"cant",when:{late:true},scene:{seat:"far",figure:1,dim:true,props:["candle"]}},
  {id:"t2",via:"queue",when:{visits:2},text:"— Шахту закрыли. А он всё равно по ночам. Ест, сидит, уходит. Куда — не знаю, шахта закрыта."},
  {id:"t3",via:"cant",when:{late:false},scene:{seat:"far",figure:0,props:["candle"]}}
 ]},

/* ── 15. Штоф считает ── небо · дом Штофа */
{id:"shtof_tally",form:"ongoing",at:"fixed:11",cast:["shtof"],
 traces:[
  {id:"t1",via:"cant",scene:{seat:"end",figure:0,props:["tally"]}},
  {id:"t2",via:"news",when:{eclipse:true},text:"Штоф объявил, что это было восьмое. Чего — не объявил."},
  {id:"t3",via:"queue",when:{eclipse:true},text:"— Сегодня он ставит палочку. Не подходите, он считает."},
  {id:"t4",via:"queue",when:{eclipse:false,visits:2},text:"— Палочки? Это Штоф. Не спрашивайте, что он считает, он сам не уверен."}
 ]},

/* ── 16. Чужой самописец ── вещь · контейнер, потом станция */
{id:"foreign_tape",form:"thing",at:"any",cast:[],
 traces:[
  {id:"t1",via:"find",when:{item:"cont"},text:"В контейнере лента самописца. Не ваша. Сектор и невязка читаются, остальное — нет."},
  {id:"t2",via:"queue",when:{noflag:"thanked"},text:"— Ждали борт. Не дождались. Ладно, садитесь."},
  {id:"t3",via:"table",item:"strip",when:{item:"strip",seen:"t1",noflag:"thanked"},text:null},
  {id:"t4",via:"queue",when:{flag:"thanked"},text:"— Спасибо, что привезли. Больше ничего не скажу."}
 ],
 turns:[{after:"seen:t3",days:1,set:"thanked"}]},

/* ── 17. Совеня не спит ── соперник · дом Совени */
{id:"sovenya_awake",form:"habit",at:"fixed:8",cast:["sovenya"],
 traces:[
  {id:"t1",via:"cant",when:{late:true},scene:{seat:"corner",figure:1,col:[86,92,70],props:["glass_empty","paper"]}},
  {id:"t2",via:"queue",when:{late:true},text:"— Совеня ночью покупает. Днём спит. Редкости любят ночь, говорит. Не знаю, что любят редкости."},
  {id:"t3",via:"queue",when:{late:false},text:"— Совеня? Спит. Приходите ночью, если хотите с ним говорить. Он не захочет."},
  {id:"t4",via:"news",text:"Совеня приобрёл нечто и не спит третьи сутки. Связь между этим не установлена."}
 ]},

/* ── 18. Письмо по эфиру ── эфир · любая станция */
{id:"ether_letter",form:"ether",at:"any",cast:["letter"],
 traces:[
  {id:"t1",via:"ether",text:"…«Дорогой… нет, это зачеркну. Здравствуй. Пишу тебе с Ближней, а передаю голосом, потому что почты нет»."},
  {id:"t2",via:"ether",when:{seen:"t1"},text:"…«У нас всё так же. Насос чинили. Чинили неделю, потом выяснилось, что не насос. Смеялись»."},
  {id:"t3",via:"ether",when:{seen:"t2"},text:"…«Ты спрашивала, видно ли отсюда ваше солнце. Видно. Я проверял. Маленькое, но видно»."},
  {id:"t4",via:"ether",when:{seen:"t3"},text:"…«Если слышишь — ответь. Нет? Ну ладно. Я ещё буду передавать, мне нетрудно»."}
 ]},

/* ══════════════ длинные — в духе институтской фантастики ══════════════ */

/* ── 19. Отчёт о непроисшедшем ── научная станция, фиксированная.
   Дежурный по явлению шесть лет ежедневно докладывает, что явления не было. */
{id:"report_nothing",form:"ongoing",at:"fixed:4",cast:["reporter"],
 traces:[
  {id:"t1",via:"ether",when:{noflag:"event"},text:"…станция Дальняя-2, сводка за сутки: явление не наблюдалось. Приборы в норме. Дежурный — тот же."},
  {id:"t2",via:"queue",when:{noflag:"event"},text:"— Явление? Его здесь ждут. Шестой год. Каждый день пишут отчёт, что его не было. Архив отчётов уже больше станции."},
  {id:"t3",via:"queue",when:{visits:2,noflag:"event"},text:"— Дежурный говорит: если перестать ждать, оно и произойдёт. Поэтому ждут. Логика у него железная, мы проверяли."},
  {id:"t4",via:"cant",when:{noflag:"event"},scene:{seat:"far",figure:1,col:[78,86,96],props:["paper","paper","paper"]}},
  {id:"t5",via:"table",item:"strip",when:{item:"strip",noflag:"event"},text:"— Что это? Лента? С невязкой? …Простите. Мне надо сесть. Мне надо это зарегистрировать. Вы понимаете, что вы привезли?"},
  {id:"t6",via:"ether",when:{flag:"event"},text:"…станция Дальняя-2. Явление… зарегистрировано. Повторяю. Зарегистрировано. Дежурный просит сменить дежурного."},
  {id:"t7",via:"queue",when:{flag:"event"},text:"— Отчётность прекращена. Ждать больше нечего, и он не знает, что теперь делать по утрам. Мы тоже не знаем."}
 ],
 turns:[{after:"seen:t5",days:3,set:"event"}]},

/* ── 20. Нуль-кабина ── верфь, фиксированная.
   Монтажник Гедеван собирает в углу верфи кабину для мгновенного переноса.
   Из чего — из того, что дают. */
{id:"null_cabin",form:"thing",at:"fixed:13",cast:["nt"],
 traces:[
  {id:"t1",via:"queue",when:{noflag:"gone"},text:"— В углу? Это Гедеван. Кабину собирает. Для переноса. Куда — туда, говорит, где нас нет. Не мешайте, он после смены."},
  {id:"t2",via:"cant",when:{noflag:"gone"},scene:{seat:"corner",figure:1,col:[96,84,70],props:["key","jar"]}},
  {id:"t3",via:"find",when:{item:"cont"},text:"Контейнер. Прибор без маркировки, три лампы, рукописная бирка: «НТ-3, не трясти». Кому-то это нужно."},
  {id:"t4",via:"table",item:"cargo",when:{item:"cargo",noflag:"gone"},text:"— Это он возьмёт. Он всё берёт. Вы не думайте, он отдаёт потом. Говорит, отдам оттуда."},
  {id:"t5",via:"queue",when:{visits:3,noflag:"gone"},text:"— Спросили его: а вернуться? Он говорит: а зачем. Вот и весь разговор, мы больше не спрашивали."},
  {id:"t6",via:"news",when:{flag:"gone"},text:"На верфи ночью был свет. Утром угол пуст, кабины нет, Гедевана нет. Сварка в углу тёплая."},
  {id:"t7",via:"cant",when:{flag:"gone"},scene:{seat:"corner",figure:0,props:["key"]}}
 ],
 turns:[{after:"seen:t2",days:18,set:"gone"}]},

/* ── 21. Семён Палыч ходит смотреть ── форпост, фиксированная.
   Наблюдатель каждый день уходит к горизонту и возвращается. Пока возвращается. */
{id:"semyon_walk",form:"habit",at:"fixed:12",cast:["semyon"],
 traces:[
  {id:"t1",via:"ether",when:{noflag:"stayed"},text:"…Семён Палыч, вернитесь на площадку. Семён Палыч. Он не слышит, он никогда не слышит, просто порядок такой."},
  {id:"t2",via:"queue",when:{noflag:"stayed"},text:"— Ходит. Каждый день к горизонту и обратно. Смотреть. Что там смотреть — не говорит, говорит: вы бы сами сходили."},
  {id:"t3",via:"cant",when:{noflag:"stayed",late:false},scene:{seat:"door",figure:1,col:[80,80,76],props:["jar"]}},
  {id:"t4",via:"queue",when:{visits:3,noflag:"stayed"},text:"— Семён Палыч говорит, там горизонт ближе, чем по приборам. Приборы мы проверили. Он тоже проверил. Ходит."},
  {id:"t5",via:"ether",when:{flag:"stayed"},text:"…Семён Палыч просил передать, что он теперь там. Что «там» — не уточнил. Передаю как есть."},
  {id:"t6",via:"cant",when:{flag:"stayed"},scene:{seat:"door",figure:0,props:["jar"]}},
  {id:"t7",via:"queue",when:{flag:"stayed"},text:"— Ушёл и не вернулся. Нет, не пропал. Передал, что там. Вы бы сами сходили, он всегда так говорил."}
 ],
 turns:[{after:"seen:t2",days:16,set:"stayed"}]},

/* ── 22. Комиссия ── комбинат, плавающая.
   Трое с бумагой третий день что-то проверяют. Что — не говорят. */
{id:"commission",form:"witness",at:"stype:indust",cast:["commission"],
 traces:[
  {id:"t1",via:"cant",when:{noflag:"left"},scene:{seat:"far",figure:1,col:[60,64,74],props:["paper","paper","glass_empty"]}},
  {id:"t2",via:"queue",when:{noflag:"left"},text:"— Комиссия. Третий день. Что проверяют — не говорят. Мы на всякий случай всё покрасили."},
  {id:"t3",via:"queue",when:{visits:2,noflag:"left"},text:"— Они смотрят на стену и записывают. Потом на другую стену. Мы уже сами начали на стены смотреть."},
  {id:"t4",via:"news",when:{flag:"left"},text:"Комиссия, направленная на комбинат, к месту назначения не прибыла. Комбинат отвечает, что комиссия была и уехала."},
  {id:"t5",via:"cant",when:{flag:"left"},scene:{seat:"far",figure:0,props:["paper"]}},
  {id:"t6",via:"queue",when:{flag:"left"},text:"— Уехали. Бумагу оставили. В бумаге — ничего, одни линии. Ровные такие. Мы её не выбрасываем."}
 ],
 turns:[{after:"seen:t1",days:7,set:"left"}]},

/* ── 23. Вторая полка ── научная станция, фиксированная.
   Ада Львовна выдаёт книги и требует вернуть. Не ей — полке. */
{id:"second_shelf",form:"place",at:"fixed:14",cast:["librarian"],
 traces:[
  {id:"t1",via:"cant",scene:{seat:"end",figure:1,col:[90,78,84],props:["paper","paper"]}},
  {id:"t2",via:"queue",text:"— Ада Львовна. Полка у неё. Вторая. Даёт читать, если попросить, и не даёт, если попросить неправильно."},
  {id:"t3",via:"table",item:"rumour",when:{item:"rumour"},text:"— Это не слух. Это из книги. Вторая полка, третья слева. Верните, когда дочитаете. Не мне — полке."},
  {id:"t4",via:"queue",when:{visits:3},text:"— Она говорит, на полке должно стоять столько же, сколько стояло. Сколько стояло — никто не помнит, кроме неё."},
  {id:"t5",via:"queue",when:{visits:5},text:null}
 ]},

/* ── 24. Насос, который не насос ── любая станция · связано с письмом */
{id:"pump_not_pump",form:"versions",at:"any",cast:[],
 traces:[
  {id:"t1",via:"queue",text:"— Насос чинили. Неделю. Потом оказалось, не насос. Что — не скажу, стыдно."},
  {id:"t2",via:"queue",when:{visits:2},text:"— Насос? Это у них на Ближней. У нас своё. У нас не насос, у нас вентилятор, и тоже не он."},
  {id:"t3",via:"ether",when:{seen:"t1"},text:"…и он мне говорит: насос в норме. По какой норме, он три дня как не насос…"}
 ],
 links:["ether_letter"]},

/* ── 25. Позывной, который отвечает ── эфир · далёкие системы */
{id:"answering_callsign",form:"ether",at:"danger:far",cast:[],
 traces:[
  {id:"t1",via:"ether",text:"…здесь Крайняя. Слышу вас. Слышу вас хорошо. Вы первые за долго."},
  {id:"t2",via:"ether",when:{seen:"t1"},text:"…здесь Крайняя. Не улетайте пока. Нет, ничего не нужно. Просто не улетайте пока."},
  {id:"t3",via:"queue",when:{visits:2},text:"— Крайняя? Нет тут такой. Позывной старый, кто-то пользуется. Кто — не знаем, мы не спрашиваем."}
 ]},

/* ── 26. Свеча на середине ── необъяснимое · любая станция */
{id:"candle_middle",form:"place",at:"any",cast:[],
 traces:[
  {id:"t1",via:"cant",scene:{seat:"far",figure:0,props:["candle"]}},
  {id:"t2",via:"queue",when:{visits:2},text:"— Свечу не трогайте. Она не наша. Она тут была, когда мы пришли."},
  {id:"t3",via:"queue",when:{visits:4},text:"— Горит. Ну да, всё время. Мы её не меняем. Вы спросите кого-нибудь другого, я не знаю."}
 ]}
];
