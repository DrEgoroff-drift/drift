<!-- docs/done/done-18.md — part 18 of 30 of the done work, in the order it was written; see README.md -->

# ~~The war — queued (M360–M388, designed 2026-09-06)~~ — closed 0.388.0 (2026-09-06)

**Все двадцать девять вех закрыты**: бой (M360–M363), мир (M364–M375), все (M376–M381) и семь
семей механик Директора (M382–M388). Дальше по войне — только то, что помечено «Deferred» в
§18 к своей вехе; отдельной очереди больше нет.

Design in `docs/DESIGN-war.md`: laws §0, helm §1, guns §2, mounts §3, energy/shields/missiles
§4, pirate roles §5, episodes instead of reputation §6, six powers and the chronicle §7, the
book §8, the crowd's ceiling / «Ревизия» / leftovers / clearance §11, the regulator §12, the
server §13, the rites §14, the Director §15, **the architecture §16 (with «Ялта» in §16.6), the
critique pass's decisions §17 (D01–D24), the staged queue §18, everything has a maker §19 (the grammar's eight
dimensions in §19.4)**.
Read §16–§19 first; the rest is the record of the author's brief of 2026-09-06 and the reasoning.

**Handoff (author, 2026-09-06: «могу в новом диалоге отдавать всё на реализацию?» — yes):** a
fresh session takes the first open pass below, reads its brief in `DESIGN-war.md` §20 and only
the sections and symbols the brief names (grep `docs/INDEX.md`, then `Read` with an offset),
builds, runs the named suites and `test.ps1`, measures what the brief says, publishes to /dev,
commits one version, strikes the pass here and in §18, and edits a later brief if it learned
something. §17 is not reopened; §10 forks keep their defaults unless the author says otherwise.

Three stages, each playable on /dev before the next starts:

- **A — the fight** (client only): ~~M360 helm and lock · M360a the helm frame redone ·
  M361 ships shoot each other and rank roles · M362 energy, seven numbers, three shields ·
  M363 ОСНАСТКА, clearance, groups, стрельбище~~ — 0.360.0…0.363.0 (2026-09-06); each is
  struck in `docs/DESIGN-war.md` §18 with what it built and what it deferred, and written
  out in `PATCHNOTES.md`. **The layer's baseline, measured, and everything after M361 is
  compared with it:** `prof(80)`, phone 375×812 @2, system mode — JS 2.6–3.0 ms idle and
  with eight armed ships alike. **For M362's successors:** eight aware ships kill a
  standing unshielded ship in about fifty frames. **M363 still owes one debt from an earlier
  passes:** a gun's class by family instead of by tier (§11.4) — M363 reads it from the
  tier as a stand-in, and the twenty families now exist to replace that.
  · ~~M364–M366 двадцать семейств орудий~~ (0.364.0…0.366.0, 2026-09-06: `05b-guns` семейства,
  заводы, серии и двадцать именных; `13a-guns` восемнадцать повадок — снаряд, рельса, дробь,
  луч, наводящаяся, иглы, сифон, импульс, бур, волна, мина, помеха, разряд, сгусток, зенитка,
  кассета, трос, таран; жар, горение и молчание перегретого; `PART_GEN` 2 с настоящим замком
  на первое поколение; долг M362 отдан — бак на утилиту, прыжок на двигатель, реактору
  ёмкость и восполнение)
  · ~~M367 missiles ×5~~ (0.367.0, 2026-09-06: `16b-missile` пять видов боеприпаса от зерна
  самой пусковой — обычная, роевая по взятым меткам, ЭМИ в поле и молчание, торпеда без доводки,
  ловушка в сторону; чужая ракета с капитана и чужая зенитка с ранга 2; вид на карточке описи;
  тесты `91zzzw-msl`)
  · ~~M368 pirate loadouts by rank~~ (0.368.0, 2026-09-06: `13d-loadout` — таблица §5 в коде,
  чужая сторона девяти повадок, поле по рангу, зенитка и пусковая по снаряжению,
  стволы на корпусе в `12i-pirate-hull`, флаг `deserter` заготовлен для M369a;
  тесты `91zzzw-combat`).
- **B — the powers, by seed** (client only; the galaxy lives with no server):
  ~~M369 the maker grammar layer on `hullOf`, measured by `makerRead()`, «Ялта»~~ (0.369.0,
  2026-09-06: `03a-hull-maker` — восемь измерений на шесть пород, закон профиля и набор схем в
  `hullOf`, приметы за обводом, стык, поверхность, метки, огни, факел, след, крен и тембр;
  `12al-powers` — таблица §7.1, приветствия, эмблемы и флаг, который не зависит от корпуса;
  «Ялта» по зерну на шестом круге: без пиратов, оружие опечатано, фронт туда не приходит;
  прибор `makerRead()` — 92.4 % на 630 корпусах — и стенд `docs/shot.py maker`; альманах,
  выпуск IV. Не сделано: остальные четыре генератора — M369a, и авторская проверка шести
  листов на /dev)
  · ~~M369a грамматика в остальных генераторах~~ (0.369.1, 2026-09-06: `makerWidth`,
  `makerGround`, `makerAssembly` — один слой на пятерых; баржа по закону профиля со сварными
  швами, станция по закону сборки, пиратский корпус с закрашенной меткой и износом вдвое,
  дезертир со свежей заплатой, флот с полем `by`, купол грунтом строителя, шесть чужих книг,
  строка еды в кантине, приветствие и акцент в шапке станции, марка на чужом снаряжении)
  · ~~M369b как это достаётся~~ (0.369.2, 2026-09-06: у части есть `b` — имя, перекос аффиксов
  ±12 %, строка на карточке, в сейве только у чужого; прилавок держит своё железо; чужой корпус
  без эпизода не продаётся (`hasEpisode` до M374 отвечает «нет»), значит достаётся тросом:
  дерелик на буксир, верфь восстанавливает за деньги; сплав берёт грамматику тяжёлого родителя;
  пикет отмечает чужой корпус под своим флагом) · M369a the grammar in the fleet,
  barges, pirate hulls, stations, domes, papers · M369b the having of things ·
  ~~M370 chronicle core~~ (0.370.0, 2026-09-06: `12am-chron` + `12am-chron-agents` — повтор от
  нуля, кэш в своём ключе, хэш FNV, целая математика с таблицей насыщения, шесть агентов с
  нуждами и ходами, фронты и ограничители, чипы владений на карте; год истории повторяется за
  доли миллисекунды, «Ялта» ничья навсегда) ·
  ~~M371 the Director~~ (0.371.0, 2026-09-06: `12am-chron-director` — напряжение с настоящим
  спадом, происшествия семи семей, дуги с обязательной развязкой, обряды, сезон с проверкой и
  «автопилотом», гарантия «не молчать дольше четырёх сводок»; `12am-chron-lines` — шесть волн на
  одно событие, ручка ЭФИР на доске, свой темп и высота голоса у каждой волны, фронт пунктиром
  на карте) ·
  ~~M372 the war seen~~ (0.372.0, 2026-09-06: `13d-npc` — пикет в тылу, чужой бой на фронте на
  входе в систему, потолок восьми, корпус после боя на буксир; свежая оккупация державой — цены,
  строка в шапке и треть выработки в реквизицию; «Ялта» с шестью посольствами и шестью
  мастерскими вдвое дороже) ·
  ~~M373 the four rules~~ (0.373.0, 2026-09-06: `12ar-hail` — оклик раз на систему, два ответа на
  тех же кнопках плюс молчание, предупреждение и огонь на второе молчание; четыре правила там,
  где они случаются: выстрел, клеймо кассеты, блокада; злость местная) ·
  ~~M374 episodes and the notebook~~ (0.374.0, 2026-09-06: `12ap-notebook` — эпизод при
  свидетеле, привязан к человеку, едет три сектора за сводку; на месте самый тяжёлый доехавший,
  а не сумма; книжка на двенадцать человек с одной просьбой в сводку; «не простил»; допуск IV,
  покупка чужого корпуса и подарок — за дела) ·
  ~~M375 the rescuer~~ (0.375.0, 2026-09-06: после боя остаются корпуса обеих сторон с экипажем и
  сигналом; топливо подбитому, трос на ДЕЙСТВИЕ, экипаж на ЦЕЛЬ — три дела на двух кнопках, и
  каждое пишет эпизод со своей стороной; один бой даёт два эпизода у двух держав).
- **C — everyone** (server): ~~M376 `war.php` and ведомости~~ (0.376.0, 2026-09-06: четыре
  операции, ленивое закрытие сводки под `flock` без крона, потолки на учётную запись, насыщение по
  числу записей, а не строк, журнал расхождений по хэшу, ssh-дайджест; на клиенте `14b-war-net` —
  ведомость в шаг 1 повтора, давление не больше четверти, часы от сервера) ·
  ~~M377 leftovers and ghosts~~ (0.377.0, 2026-09-06: `left/here/take/thank` на сервере с числами
  §11.5, `12as-left` — оставить ствол из трюма, копия стёрта на тир и один аффикс, место записи
  от её семени, благодарность числом, призрак там, где кто-то не дошёл; §G в рисках) · ~~M378 votes, elections, сигнал сбора~~ (0.378.0, 2026-09-06: вопрос месяца от зерна,
  один голос на борт, победивший ответ — курс державы на месяц; сигнал сбора: три поля, одна
  кнопка, счётчик и чип на карте) · ~~M379 the nine rites~~ (0.379.0, 2026-09-06: `12au-rites` — девять обрядов §14 и регата,
  счётчик по ведомости, порог и последствие: талоны, субботник, амнистия, карантин, стройка,
  заём через `earn`) · ~~M380 «Ревизия»~~ (0.380.0, 2026-09-06: `12av-boss` — область из летописи, корпус из
  ведомостей и без восстановления, поле, которое один не продавит, окно в двадцать секунд раз в
  десять минут, «в бою бортов: N», вклад толпы в его области вчетверо меньше; попутно починена
  цена свежей оккупации — она поднимала только сдачу) · ~~M381 циркуляры и конституция~~ (0.381.0, 2026-09-06: `docs/WAR-CONSTITUTION.md` —
  что можно и чего нельзя никогда; `circValid` написан по нему построчно, тот же список в
  `war.php circ`, негодный циркуляр не применяется вовсе, годный виден бумагой в голосе своей
  волны) · M382–M388 the Director's mechanics, one family a pass:
  ~~M382 economy~~ (0.382.0, 2026-09-06: волна цен державы, жила, ярмарка, эмбарго — всё в одном
  множителе прилавка и всё из летописи) ·
  ~~M383 society~~ (0.383.0: переселенцы дешевят труд у соседа, забастовка закрывает всё кроме
  заправки, праздник со скидкой, тихий уезд секты, бунт по счётчику обороны) ·
  ~~M384 nature~~ (0.384.0: вспышка глушит приборы и уводит пикеты, рой бьёт стоящих, истощение
  оставляет пояс без руды, находка делает поверхность богаче) ·
  ~~M385 power~~ (0.385.0: чистка и преемник меняют состояние в повторе, переворот переворачивает
  выбранный толпой курс, дезертиров вдвое, волна молчит; попутно пойман повтор внутри повтора) ·
  ~~M386 diplomacy~~ (0.386.0: война начинается с ноты со сроком — шесть сводок, число на станции,
  истёк — война сама; посольство, которое можно провести или сбить; обмен пленными по свежему
  перемирию; письмо из гл. 49 с тремя полями и без единой свободной строки) ·
  ~~M387 security~~ (0.387.0: пиратский король держит область неделю из двадцати четырёх суток —
  ни пикетов, вдвое пиратов, снимает его счётчик расчистки; шпион врёт ценами в обе стороны;
  молчащая волна чинится сканированием; досмотр окликает вдвое дальше; бак мимо талона —
  контрабанда на сутки) ·
  ~~M388 science and culture~~ (0.388.0: радиоспектакль «Седьмая смена» — шесть частей по суткам
  и шесть версий у каждой; экспедиция со счётчиком сканирований и обрывком «Долгого Хода» — шесть
  написанных кусков, собираются как книги; новая серия завода на месяц; олимпиада флота — старт,
  финиш и своё время, у толпы только явка). **Очередь M360–M388 закрыта.**

Measured from M360 on: `prof()` with eight armed ships on the phone layout; the pad row on the
44 px sweep (`91zzy-screens`); `91zzzw-chron` replay hashes browser vs Node.

---
# The base — M390–M409, closed 0.409.0 (2026-09-07)

Moved out of `PLAN.md` when the queue closed. What each pass actually did and measured is in
`docs/DESIGN-base.md` §51.1; this is the plan as it was written and struck.

# The base — queued (M390–M409, designed 2026-09-06)

Design in [`docs/DESIGN-base.md`](docs/DESIGN-base.md), 1512 lines, six parts: the diagnosis and the
nine source games §0–§1, the register and the clock §2–§3, the six gauges and the loop §4–§5,
modules §6, adjacency/merging/depth §7, people §8, the charter §9, the director §10, аврал §11, the
journal §12, консервация §13, the boundary with the holding §14, save shape §15, numbers §16,
**the planet as the difficulty §21**, **the nine laws of hardness §22**, the payoff §23,
**the one управляющий among a hundred §24, §34–§37**, **СВЯЗЬ — the base from anywhere §38**,
loss and recovery §39, **ПАЛАТА §27–§32, §40** (the layer's satire of registering as a sole trader
in Russia — the author's brief), **why a base is necessary, Part V §42–§46**, the self-critique §49,
**the two honest playstyles §50**, and **§51 — the settled forks and the queue in build order**.

Read §51 first: it holds every decision the author took on 2026-09-06 and the twenty passes in the
order they are built. `docs/DESIGN-winter.md` is a separate sketch — «зимовка» is its own survival
mini-game, not part of this queue, and is designed after M396.

**Author's decisions, 2026-09-06 (do not reopen):** scope **(a) — nothing is cut, all of it is
combined**; **one** управляющий per galaxy, hidden in a continuous distribution of about a hundred
candidates (§48), meetable on the very first interview; **no notebook** — the player judges by
whether the base works, heard over the receiver; a base can be lost and is **always recoverable**;
the joke is played **at maximum**, and §27's deadpan law is withdrawn; the real one **builds and
develops** the base himself; **playing by hand is a complete game with the higher ceiling** and
nothing is gated behind a manager.

**Handoff:** a fresh session takes the first open pass below, reads `DESIGN-base.md` §51 and only
the sections that pass names (grep `docs/INDEX.md`, then `Read` with an offset), builds, runs the
named suites and `test.ps1`, measures what the pass says, publishes to /dev, commits one version,
strikes the pass here and in §51. Unanswered forks keep the defaults listed in §51.

Five stages, each playable on /dev before the next starts:

- **A · хозяйство** — ~~M390 смена and `baseResolve`~~ (0.390.0, 2026-09-06: смена базы — это
  смена холдинга, ход смены — чистая функция от её номера, догон до 72 смен, глубже суток —
  арифметика и одна строка; журнал на 24 строки в десяти видах, и визит открывается им) ·
  ~~M391 воздух и вода~~ (0.391.0, 2026-09-06: две шкалы и две машины, лёд → воздух и вода,
  расход считают только люди; кончился запас — база встала и ничего не разрушила, снабжение
  кислородом и льдом её поднимает, консервация — кнопка на столе) · ~~M392 тепло, глубина,
  криоцех~~ (0.392.0, 2026-09-06: двусторонняя шкала из мира, машин, глубины и того, чем её
  сбрасывают; мороз держит воду, жара точит технику и в пределе останавливает бур; пороги выбраны
  по УЖЕ стоящей базе — она в первой ступени и лечится одним радиатором; глубина даёт буру +8 % за
  ряд; криоцех платит обещание `02-world`, и криоген возят между базами) ·
  ~~M393 харч и дух~~ (0.393.0, 2026-09-06: оранжерея с посадкой и бак со скверным вкусом, консервы
  и синтебелок с борта, дух как свод остальных четырёх шкал и настроение людей за ним; ниже
  четверти три смены подряд — один уходит на станцию, и его снова можно нанять).
  Playable after M391 (a base can be starved), a game after M393.
- **B · место и люди** — ~~M394 СВЯЗЬ и мачта~~ (0.394.0, 2026-09-06: база — канал на приёмнике,
  четыре уровня разборчивости, мачта на верхнем ряду, база зовёт сама на каждом прыжке, один приказ
  за сеанс и он может не дойти) · ~~M395 люди в комнате~~ (0.395.0, 2026-09-06: назначение в сцене по ЦЕЛИ, нарисованный
  рабочий — это назначенный человек с именем над головой, три новые роли работают, маяк приводит
  гостя к затвору) · ~~M396 соседство, залы, ствол,
  сетка 6×4~~ (0.396.0, 2026-09-06: девять правил таблицей, лазарет и мастерская под них, зал из
  трёх с общей скидкой и общей бедой, ствол шестой колонкой — и `baseCell` больше не принимает
  адрес вне сетки) · ~~M397 директор~~ (0.397.0, 2026-09-06: один бросок вместо двух, прогноз на смену вперёд в
  журнале, таблица бед по мирам и четверть доброго на каждом, ходячий пожар и гермозатвор против
  него) · ~~M398 аврал~~ (0.398.0, 2026-09-06: настоящее время внутри базы — дойти и держать
  ДЕЙСТВИЕ две секунды, люди и мастерская держат вместе с вами, упустил — беда пошла ходить сама;
  один на заход, телефон проверен) · ~~M399 устав~~ (0.399.0, 2026-09-06: четыре закона по ступеням роста базы, каждый навсегда,
  у каждого цена другой природы; открытая дверь приводит и того, из-за кого пропадает треть склада).
  **Ярус B закрыт.**
- **C · тяжёлая игра** — ~~M400 формуляр планеты~~ (0.400.0, 2026-09-06: восемь выводимых ручек,
  каждая что-то крутит, участок сдвигает свои; разведка тремя словами с орбиты, зондом за 300 кр и
  замером на грунте) · ~~M401 девять законов~~ (0.401.0, 2026-09-06: сведения покупаются радистом и приборами,
  изнашивается всё и тем быстрее, чем дальше тепло от нормы, у вахтовиков черты; и сторож — строка
  «почему» на столе всегда) · ~~M402 развалина и возврат~~ (0.402.0, 2026-09-06: сутки без людей и запаса — развалина;
  въезжают поселенцы или застава; вернуть можно всегда — даром, выкупом или руками, и чинить от
  нуля за четверть) ·
  ~~M403 плата и блокада~~ (0.403.0, 2026-09-06: решённая база делает то, чего нет ни на одном
  прилавке — по одной вещи в четыре смены; в блокаду свой лёд идёт в баки, а свои сплавы — в
  корпус; попутно найдено, что §23.1 называл товары С ЦЕНОЙ, и это была бы инфляция) ·
  ~~M404 the craft pass over the whole scene~~ (0.404.0, 2026-09-07: четыре шкалы в комнате,
  патрубки соседства, зал без внутренних стен, иней и марево; альманах, выпуск V). **Ярус C
  закрыт.**
- **D · человек** — ~~M405 сотня и распределение~~ (0.405.0, 2026-09-07: кандидат — бросок по
  кривой §48, у прилавка их двое-трое и они постоянны, единственная зацепка — вопрос о месте;
  жалованье, доля и три изъяна из шести; плохой хуже, чем никакой) · ~~M406 охота~~ (0.406.0, 2026-09-07: он функция времени и переезжает по работам; пеленг без
  дальности с враньём в пятнадцать градусов, слух про прошлое, дюжина ложных целей; и встреча без
  всякой отметки, если вы оказались там же) · ~~M407 он строит и развивает~~ (0.407.0, 2026-09-07: чинит раньше, чем строит; ставит по
  формуляру планеты, а плохой — тот же список задом наперёд; снабжает себя заранее или когда
  припёрло; три оставшихся изъяна). **Ярус D закрыт.**
- **E · дело и мир** — ~~M408 ПАЛАТА, тон на максимум~~ (0.408.0, 2026-09-07: шесть инструментов
  из восьми — реестр, участковый сбор, доля с оборота, сводка с пенёй, вежливый инспектор с
  биографией и снятие с учёта; три режима участка; и брошенная база продолжает начислять, пока её
  не изымут) · ~~M409 опорный пункт экспедиции~~ (0.409.0, 2026-09-07: годную базу за девятым кольцом
  циркуляр называет опорным пунктом; борта садятся, платят за приём и едят с её склада).
  **Очередь M390–M409 закрыта.**

**Seams with the war (M360–M388):** no file is shared. `baseRaid` takes its attackers from
`13c-roles` when those land (M397 reads whatever shipped); a blockade closes a system's counters and
M403 answers it; a base overrun, defended or provisioned is an episode for the chronicle
(`DESIGN-war` §6). Neither queue blocks the other.


## Side passes of 2026-09-07 — M410, M411, M412 (moved from `PLAN.md` 2026-09-08)

- ~~**M410 one thumb**~~ — 0.401.1: the phone helm is one stick under the left thumb, and it says
  «fly there», not «push there» — `G.ctl.assist` turns the stick vector into a wanted velocity
  and `helmApply` closes the gap (`15a-helm`, `DESIGN-war` §1.1). Thumb in the dead zone = stop;
  the nose is never the thumb's job — mark, else heading. A resting ring marks the stick's place
  (`helmHome`, measured from the pads row). Suites: `91zzzw-helm` (M410), `91zzx-mobile` (the
  resting point lands on the canvas). Mouse and arrows untouched.
- ~~**M411 the war on the site**~~ — 0.401.3: `site/war.html` + `site/war-map.js` over
  `site/war.js` (built by `build.ps1 War` from `site/war-head.js` + thirteen chronicle modules):
  territory by power (Коммуна hatched — two blues), borders and war borders, stars in the owner's
  colour, homes as emblems, fronts breathing, the previous flag's corner on a system taken within
  two days, ledger ticks (the players' hand), rallies, «Ревизия»; six powers with holdings,
  needs, strength, tension and relations; wars with takes, notes with deadlines, arcs, rites, the
  last two days' incidents; the line «кто куда когда» in the truth voice or any wave's; a slider
  over the last 720 сводки (snapshots every 24, replay from a snapshot); pull every 90 s. Linked
  from the nav and the footer; `docs/DEPLOY.md` has the rows.
- ~~**M412 the war runs by itself**~~ — 0.401.2: `docs/warsim.js` (a Node replay over the same
  `site/war.js` bundle) showed needs pinned at zero, 24 wars a month, strength at ~900 for all;
  now needs balance at home size and are moved by incidents, moves are drawn by probability
  (trade first, quarrel second, war only below −250 with strength and holdings to spare, ≤2 wars
  in the galaxy), war costs, home systems are defended, strength tracks the cap its holdings set,
  relations revert at 5 %. Closed state is the replay base and the open сводка is stepped on top
  each call, ledgers and circulars invalidate (`chronInvalidate`); circulars apply once at their
  сводка and the season lives in the state; «бунт», «находка», «откол» announced. Suites:
  `91zzzw-chron2`. A year: ~10 wars/month, ~30 takes, ~8 net changes, needs ~450.

## M354 — deep tests (0.352.0, 2026-09-05) — done

Author: «пиши глубокие тесты, все кликай, по интерфейсам, по логике, ищи баги». Twenty-six suites in
eight files, each a class of defect nothing asked about: a save whose fields are the wrong TYPE
(`91zzzzza`), the wall clock moved back three days / forward five years / a save stamped a year ahead
(`91zzzzzb`), every button pressed twice while broke and with a full hold plus «a button that left the
screen may not pay again» (`91zzzzzc`), the world out of its seed and nothing ephemeral in the save
(`91zzzzzd`), every key held alone in every scene with mode and state required to agree (`91zzzzze`),
the counter across the whole galaxy (`91zzzzzf`), the tap that reaches the control — `elementFromPoint`
instead of `el.click()` (`91zzzzzg`), and what grows over an evening in the page itself (`91zzzzzh`).

Four bugs fixed: `found`/`species` as an object threw out of `applySave` (white screen on an aged
record) and `zoom` as an object survived into `G.zoom`; on a phone the «Сорока» panel spanned the full
width over the rail, so КАРТА and МЕНЮ could not be pressed aboard the sail-ship, and the map's prompt
ran one pixel under the rail — both now off the measured `--railw`.

**The lesson worth keeping:** «В ДОРОГУ» is an ordinary button, so any sweep that clicks everything
enters the road companion, and `body.road` hides the whole page. `resetWorld` did not leave it — so
from that click on, every later suite measured an invisible page and passed. Two old assertions were
green only because of it. `resetWorld` now leaves the road and closes the menu and the desk, and a
guard suite in `91zzzzzh` holds it. A measurement that finds nothing to measure is a failure, not a
pass — new layout suites say so out loud.

Also: `test.ps1 -Size W,H` (a tall window puts the interface zoom at its 1.75 ceiling — a regime
nothing had measured; it is healthy), and the frame ledger judges only in the window its baseline
was shot in.

## M355 — does the button do what it says (0.354.0, 2026-09-05) — done

Author: «тесты на логику, каких никогда не делали: действие и ожидаемое поведение — верное или
нет; не «экран открылся», а зачем этот экран, что на нём можно и ради чего». Fourteen suites in
four files, all asking one question: not whether a control works, but whether it tells the truth.

- `91zzzzzi-promise` — the verb is kept, the price on the button is the price charged, and every
  tap leaves a trace (world, screen or word). **Found and fixed:** «ВЗЯТЬ ВСЁ» at the counter with
  an empty till did nothing and said nothing, while «ВЗЯТЬ ×N» beside it refused out loud.
- `91zzzzzj-why` — instruments show the world; every module level pays what its line promises; no
  technology is a signature without code; the prompt's promise is executed in every scene; the
  scoop fills the hold, which is what it is for.
- `91zzzzzk-fair` — the yard hands over the hull you tapped; no hull is dearer and worse in every
  number; module levels never cheapen; the game takes no money without a line in the journal.
- `91zzzzzl-gates` — a closed door names the cause (hiring, the counter, take-off without fuel →
  the evacuation and its price); every disabled button is explained by its row; refuel and repair
  charge exactly the advertised rate, and a pauper is told why.

Two laws out of the run: `planetSpin` fell back to the **wall clock** at `G.t===0`, so staged
scenes were irreproducible and the light/ledger suites flickered on «заход» — the world's clock is
used whenever there is a world; and **a word boundary does not work next to Cyrillic** in JS
(Russian letters are not word characters), so `/кр\b/` never matches «−17 кр» — a suite now holds
that nowhere in the game.

## M357 — hunting by search (0.355.0, 2026-09-05) — done

Author: «ищи ещё баги, как хочешь ищи». Four nets built on properties instead of case lists.

- `91zzzzzm-exploit` — splitting a deal never beats doing it whole; a buy-and-sell round loses on
  every station; and six hundred random sequences of ordinary actions with the clock STOPPED never
  make the player richer (worth priced at that counter's own prices). No holes.
- `91zzzzzn-doors` — the door matrix: every scene × every door, over a hundred cells, each checked
  for the mode/state pair, a living frame and a whole world on the way back, plus a save taken on
  the threshold. **The freeze is not here** — that is now measured, not assumed.
- `91zzzzzo-plural` — `pl3` over the whole hundred (11–14, 111–114), and the game's own text read
  for «number + word» disagreement without a dictionary.
- `91zzzzzp-balance` — the designed numbers are pinned to the documents that state them
  (CREW_YIELD, the locker, the cooperative, the spread, the drone-miner, the rank caps); a
  deliberate rebalance turns this red once and asks for the PLAN line to be updated too.

Still open for the freeze, and the cheapest next step: measure not time but WORK over a long
evening — `SYS_CACHE` size, the chunk store, the `screenLayer` cache over tens of thousands of
frames with system changes. If any of them grows linearly, that is the cause.

## M359 — the evidence, the hands, the things (0.357.0, 2026-09-05) — done

The state-and-rules half of a two-session hunt (the picture half is M358).

- **the frame guard stopped talking** — the same crash was announced once ever, so a crash that
  repeats every frame (which is what a freeze IS) left no trace after two seconds. It now reminds
  every fifteen seconds with the count; `91zzzzzn-doors` pins the contract. This may be why the
  author's freeze has never carried a «СБОЙ · …» line.
- `91zzzzzq-input` — the input layer had no suite at all: focus and tab-hide release the keys, a
  finger leaving a pad releases it, and the action edge lives one frame across a whole hold.
- `91zzzzzr-cloud` — boot never lets an older cloud record replace a fresher local one, takes a
  newer one, and survives ten malformed answers. (Both suites use a synchronous stand-in: a
  promise's `.then` lands after the report is built.)
- `91zzzzzs-quests` — every kind of deed has code that closes it; deeds do not double; the journal
  keeps its cap; an open deed has an address or an honest «адреса нет».
- `91zzzzzt-opis` — parts do not double or vanish across ten fit/unfit rounds; scrapping pays once;
  «за борт» throws exactly what was named and never people.
- `91zzzzzu-monotone` — what may never run backwards: the rung never falls for doing more, danger
  grows with distance (and is the same all round the ring), and a price flooded down stops at its
  floor and returns with time (measured on the market's own clock, not «a day»).
- `91zzzzzv-quote` — the quote does not lie: the row's breakdown («берут первые 6 по 41 кр») adds
  up to its own total, the total equals the money that actually arrives, the station's premium ends
  exactly where it was promised, and the cooperative's counter charges the slices it showed.
- `91zzzzzw-travel` — the evening measured along the ROAD instead of the clock: a hundred real jumps
  with docking and trade. Half the state is sparse by system (market, seen prices, places, holding,
  names), so it grows with travel and not with frames — an axis no suite had touched. The save stays
  readable, no map grows faster than the road itself, and `SYS_CACHE` stays proportional to the
  jumps (the state-side half of M358's raster question).
- `91zzzzzx-sound` — звук был единственной подсистемой без единой проверки: в headless нет
  колонок и автозапуска, настоящий `AudioContext` спит, и `sfx` выходит первой строкой. Стенд
  строит НАСТОЯЩИЙ `OfflineAudioContext` и приписывает ему «running» своим свойством — синтез
  идёт живой. Держит четыре закона: каждый звук из таблицы запускается и ГАСНЕТ (23 источника,
  23 стопа — иначе узел звучит вечно), выключенный звук и глушение «Дороги» молчат и не тратят
  голосов, полифония не переливается через VOICE_MAX, гул двигателя — один узел на весь полёт,
  и голос маяка не читает поверх экранов (только полёт и дорога).
- `91zzzzzy-alive` — третья ось вечера: не растр и не карты, а ЖИВЫЕ сущности. Пять тысяч кадров
  настоящего боя (система ищется, пока в ней не родятся пираты, иначе набор мерил бы пустое небо)
  — потолки держат все: пираты, выстрелы, дроны, новости, слухи, дела, обломки. И то, что
  принадлежало системе, уходит с ней: после прыжка ни один помеченный пират не летит следом.
