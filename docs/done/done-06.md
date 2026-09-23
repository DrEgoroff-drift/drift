<!-- docs/done/done-06.md — part 6 of 30 of the done work, in the order it was written; see README.md -->

## M88 (0.37–0.38). Маршрут на карте, постройки на земле, журнал дел, тысяча узлов

**Маршрут виден.** `drawFactRoute` кладёт плечи домена на карту: пунктир между
станциями, ромбы плеч, ползущая точка борта и подпись на лучшем плече —
«товар, цена покупки → цена продажи, процент». Спред фактора теперь можно
использовать самому: он ищет, а пользуется кто хочет. Кадр: `docs/shots/route.png`.

**Постройки стоят на земле.** `21c-built`: база и дом рисуются на поверхности
тем же слоем, что POI, — садишься и видишь их, заходить в меню, чтобы узнать
об их существовании, не нужно. Место выводится из seed планеты и ищется по
РОВНОМУ участку: на склоне у дома половина двери уходила в грунт. Дом растёт
окнами по числу ступеней, на восьмой зажигается маяк причала.
Кадр: `docs/shots/built.png`.

**Шахта помнит выработку.** `G.mines` хранит только список выкопанных ячеек —
порода, руда и жилы по-прежнему выводятся из seed. Спуск во второй раз попадает
в свой ствол, а не в целик.

**Журнал дел.** `11a-quests`: принятое поручение записывается, у дела есть адрес,
срок и награда, по строке тыкают — курс ложится на карту. Мир заводит дела сам
там, где что-то случилось: пленный наёмник, занятая система. Закрывает дело тот
код, который его выполнил. Кадр: `docs/shots/journal.png`.

**Тысяча узлов.** `05a-nodes`: десять наборов по сто именованных узлов, пять
грейдов редкости. Узел сам по себе не даёт ничего — он буква; слово получается
из набора: сто узлов одной семьи дают венец, которого нельзя получить иначе
(эффекты читаются в `stat()` вместе с модулями и частями). Узлы не покупаются
и не крафтятся, только падают — с пиратов, в шахте, в рейде; шанс низкий
намеренно. В записи лежат только номера найденных.

**Осталось замыслом:** квесты кантины (не «принеси-подай», а сцена с выбором);
узлы пока не видно нигде, кроме экрана наборов, — просится вещь в руках;
последний узел набора должен падать только в логове барона.

## M89 (0.39.0). Дела кантины

`27g-deals`: за столиками сидят люди со своими делами. Ни одно дело не просит
привезти или убить столько-то — игрок только ОТВЕЧАЕТ, а работа уже сделана
кем-то другим: чужой долг, поручительство за пилота, ящик без объяснений,
ставка на чужой бой, разметка пласта от выгнанного геолога, пассажирка без
обратного билета, слух за выпивку у диспетчера.

**Устройство.** У ответа всегда есть цена (деньги, репутация, чужая судьба),
бесплатных вариантов нет ни у одного дела. Немедленная часть исполняется сразу,
отложенная уходит делом в журнал с адресом и сроком и закрывается сама.
Бросок исхода делается ЗАРАНЕЕ по ключу дела: одно и то же дело не может
кончиться по-разному от того, когда игрок открыл журнал.

**Осталось замыслом:** дела пока живут строчками — их место в нарисованном
зале кантины, за столиками, с фигурой и меткой над ней; исходы не влияют на
репутацию у станции, хотя цена «rep» в таблице уже заложена.

### M89, проход второй (0.39.1): дела сели за столики

`cantTables` в сцене кантины: дела рисуются столиками на переднем плане, после
стойки, — подойти к ним можно, только пройдя зал, и порядок рисования говорит
ровно это. По столику тыкают, как по кандидату: выбор фильтрует то, что
раскрывается ниже, и наём с делами больше не смешивается в одну колонку.
Кадр: `docs/shots/cantina-deals.png`.

**Найдено кадрами:** у нижней кромки сидящим обрезало плечи, а метки налезали
на стойку — столики подняты и разнесены шире; за столиком сидят в тени зала
(тон темнее), иначе человек с делом читался ещё одним кандидатом на найм.

## M90 (0.40.0). Репутация, хвост набора и облик узла

Три хвоста, записанные за M87–M89, закрыты.

**Репутация (`12k-rep`).** В таблице дел цена «rep» лежала с самого начала, а
тратить её было некуда — обещание без кода. Репутация сделана узко: своя у
каждой станции, от −5 до +5, меняется ТОЛЬКО от поступков (закрытые и сорванные
дела, снятая блокада) и влияет лишь на то, что назначает человек: топливо,
ремонт, найм — до четверти и до трети соответственно. Рынка она не касается:
торговля про спрос, а не про симпатию. На экране — слово, не число.

**Хвост набора только из логова.** Пока в семье больше трёх ненайденных узлов,
они падают везде, где водятся; последние три — только в логове барона. Набор
должен кончаться не тем, что вы ещё сто раз слетали в шахту, а тем, что вы туда
дошли.

**У узла появился облик.** Тысяча находок жила строчкой текста, а вещь, которую
нельзя увидеть, вещью не ощущается. `drawNodeIcon` собирает узел из его же seed:
многоугольное тело, деталь по семье, отделка по грейду — точный получает кант,
штучный клеймо, утраченный патину и скол, несбыточный свечение изнутри.
Кадр: `docs/shots/nodes.png`.

**Найдено кадрами:** в первом проходе семьи делили рисунок парами, и «Ковчег»
было не отличить от «Колодца» — теперь десять наборов, десять разных нутр
(обод с перемычками, сопло с огнём, крылья, колодец, катушка, кладка, эхо,
складка, арка печи, волна).

**Осталось замыслом:** репутация не влияет на то, какие дела предлагают, хотя
логично, что своим предлагают больше; венцы не видно на корабле — они работают,
но не показываются нигде, кроме экрана наборов.

## M91 (0.41.0). Недостижимые узлы, памятники и колодка венцов

**Найдена дыра, а не хвост.** В каталоге узлов семь мест падения, а подключены
были три: «в поясе», «в пещере», «в аномалии» и «с ушедшего управляющего» не
вызывались нигде — пятьсот с лишним узлов были недостижимы. Это ровно та же
ошибка, что «перк без кода», и теперь её стережёт набор «узлы: каждое место
падения живое»: список мест закрыт (`NODE_WHERE`), каталог не знает мест сверх
него, и по каждому месту узел действительно достаётся.

Подключено: выработанный астероид в поясе, находка в глубине пещеры, разбитый
ренегат — и осмотр памятника на поверхности.

**Памятники перестали быть декорацией.** POI стояли на горизонте, подойти было
можно, сделать нельзя. Теперь у них есть осмотр: данные по опасности сектора,
шанс узла «из аномалии» и запись в `G.poiSeen` — второй раз к тому же монолиту
идти незачем. Радиус подхода считается от размера самой формы, а не константой.

**Репутация правит кантину.** У тех, кому вы свой, за столиками сидит на одного
человека больше; у тех, кто вас не ждёт, — на одного меньше. Содержание дел
репутация не трогает: иначе вышла бы «прокачка доступа».

**Венцы видно на корабле.** Сотня узлов ради строчки в списке — плохая сделка.
Собранные венцы висят наградной колодкой вдоль бортов у кормы, свой знак на
каждый набор, и с ростом их числа корабль заметнее светится в темноте.
Рисуются только на вашем корабле. Кадр: `docs/shots/crowns.png`.

**Найдено кадром:** россыпь ромбиков впритык к обшивке читалась мусором на
корпусе — знакам нужна планка-основание, тогда они опознаются как знаки.

**Осталось замыслом:** осмотр памятника даёт одно и то же у любого типа POI —
храм, завод и врата просятся отличаться не только видом; репутация не влияет
на цену частей и корпусов в доке.

## M92 (0.42.0). У каждого памятника свой ответ, репутация в цене железа

**Осмотр по типу (`POI_FIND`).** Первый заход дал всем десяти формам один и тот
же осмотр — десять силуэтов на горизонте оказались десятью способами получить
одно и то же. Теперь у каждой свой ответ на вопрос «зачем к ней идти», и все
ответы даны тем, что в игре уже есть:

| памятник | что даёт |
|---|---|
| остов корабля | часть с обломков (тир от опасности сектора) |
| храм | координаты следующего артефакта |
| завод | техкомпоненты со склада |
| врата | топливо: кольцо ещё держит заряд |
| обсерватория | цены соседней станции, которую вы не посещали |
| друза | кристаллы |
| ускоритель | иридий |
| лифт, монолит, аномалия | наука, по-разному |

**Ни один осмотр не даёт кредитов** — памятник не банкомат: он отдаёт вещи,
знания и направление, а деньги игрок получает работой. Осмотр разовый и
помнится, поэтому находка может быть весомой. Набор проверяет и покрытие всех
видов POI таблицей, и что кредиты не растут ни от одного осмотра.

**Репутация в цене железа.** Части и корпуса в доке тоже дешевеют, но вдвое
слабее, чем работа: продавец помнит вас наполовину, а станок не помнит вовсе.

**Осталось замыслом:** обсерватория открывает цены, но на карте это никак не
помечено — просится метка «известны цены»; храм молчит, если координата уже
есть, вместо того чтобы дать что-то другое.

## M93 (0.43.0). Дом переделан: десять проходов по кадрам

Комната дома была худшим экраном игры: предметы стояли в ряд, как товар на
витрине, стена — плоская плита, хозяин — серый столбик с кружком вместо головы.
Десять проходов, каждый по кадру:

1. **Стена в три масштаба** — секции обшивки со швами и заклёпками, потолочный
   кант, микрозерно. Была заливка с еле заметными полосами.
2. **Пол** — доски с перспективой, плинтус, ковёр под жилым углом. Была линия.
3. **Хозяин** — то же тело, что стоит у пультов в рубке (`hqFigure`), ужатое до
   роста этой комнаты: один язык фигур на всю игру, а не три разных человечка.
4. **Корабль в гараже** — настоящий `drawHull`, а не залитый контур: плоская
   заливка превращала его в розовую сосиску. Ниша со створом, козлы, кабель.
5. **Витрина** — образцы вместо «ёлочек»: кристалл огранён, слиток лежит бруском,
   изотоп светится в колбе, ксенобиом — комок в банке.
6. **Трофеи** (хвост M83) — вымпелы и образцы породы на стене, над зонами, а не
   равномерно: висящий над пустотой вымпел читался фигурой в воздухе.
7. **Мастерская и кабинет** — тумбы с ящиками, тиски, лампа-прищепка, стружка,
   стул со спинкой, терминал со своим светом. Были дощечки на палках.
8. **Причал** — рама с переплётом и подоконником, вид с планетой и фермой дока,
   свет из окна на полу, кресло, откуда смотрят. Был прямоугольник с точками.
9. **Первая ступень** — матрас с продавленным верхом, одеяло к ногам, ящик с
   кружкой, лампа-переноска со своим пятном. Бедность — не пустота.
10. **Найдена ошибка масштаба:** без потолка на `k` дом из двух ступеней
    растягивался во всю ширину панели — кружка выходила с ведро. Масштаб
    ограничен (≤2.2 px на единицу), картинка ровно в ширину дома и стоит по
    центру. Это правило было записано ещё в M83 и потерялось при переносе.

Кадры: `docs/shots/home.png` (достроенный), `docs/shots/home-small.png` (две
ступени — та же комната, только маленькая).

**Осталось замыслом:** по вещам в комнате нельзя тыкнуть — гараж и витрина
просятся быть кликабельными прямо в сцене; ступени 2 (прихожая) и 3 (гараж)
рисуются беднее прочих.

---

---

# Archived at M108: the eleventh pass (M94–M105), all closed

Moved out of `PLAN.md` when it passed the 60 KB guard. These are decisions, not plans.

# QUEUE: what is left today

A summary of the M83–M93 tails plus the intent of the eleventh pass. Kept here so a session
starts in one place instead of reading the whole plan. Same rule as before: one milestone, one
commit, and a tail is either done or closed by a decision. There is no separate tail list any
more — **every tail is assigned to the milestone** inside which it closes by meaning, rather than
as a one-off patch.

## The principle behind this queue

The new is the old given a body. The game has accumulated abstractions that spin under the hood
and have no form anywhere: the trade factor computes routes, reputation computes attitude,
`earn()` computes turnover. None of them can be seen, touched or lost. So milestones M94–M105
don't start parallel systems — they give a body to numbers that already exist:

- **the barge** — the body of the trade factor (M94–M95);
- **the rarity** — a line in the monument's existing answer table, only without the right to
  repeat (M96);
- **the planet** — a second growth counter, driven by completeness rather than turnover (M97);
- **the hunter** — the far side of reputation, which it has never had (M98);
- **the retelling** — the body of the time that passes while the player flies the other way (M99).

Hence the order: first the things the rest leans on.

## M94 (0.44.0). Barges: the trade factor gets a hull — DONE

New module `12l-barge.js` (after `12k-rep`, before `13-pirates`). Built, 1307 green, hull stand
captured (`scratchpad/barge-stand2.png`). Legs are taken from the factor; on an empty route there
is an honest fallback (the nearest OTHER station, not the same one: `nearestStation` returned the
current one and the leg collapsed — that was the single failure on the run). Spawning at the end
of `spawnPirates()` — one entry point for all modes. Captain temper, trade without docking, a dot
on the map, the suite `"barges: the route is real"`.

**Found by the stand:** the first exhaust was drawn as overlapping translucent circles — at the
stern they merged into "soap bubbles". A nozzle needs a dark throat and a compact glow, and the
rings must not overlap.

**Left as a tail (into M95):** the barge only flies and trades — pirates don't see it, there is no
escort contract, no wreckage and no passenger. Captain temper in combat (flee / shoot) is declared
by the `BARGE_TEMPER` table but is never read while the barge takes no part in fights. The intent was:

- `G.barges` — a live list, at most six per galaxy; each `{seed, from, to, t, good, qty, cap,
  temper, hp}`. Ephemeral: derived from the galaxy seed and time, never in `snapshot()`
  (cross-cutting rule).
- **The route comes from the real factor**, not invented: the station pair is the one `12-economy`
  would compute. A barge must be a visible consequence of the economy, otherwise it is scenery
  with cargo.
- On the map (`18-mode-map`) — a slow dot between two stations, loaded out and empty back. In a
  system (`17-mode-system`) — an object you can approach.
- The hull is baked by the `12i-pirate-hull` machinery with a new "barge" class: a long body, a
  spine of containers, no weapons. The three assembly rules are mandatory — body first, fittings
  inside the outline, one light as the last layer.
- **Trade without docking.** Price = the destination station's price, 8–12% worse in your
  direction; volume limited by cargo. The player's gain is time, not money: the arbitrage "buy
  from the barge, sell at that same station" must be a loss.
- The captain has a name and a temper (`temper`: greedy / cowardly / fighting) — it drives the
  discount, whether he runs from pirates and whether he shoots first.
- A deal with a faction barge moves reputation (`12k-rep`) like a small station deal.

Suite: **"barges: the route is real"** — every barge's `from`/`to` exist and differ; a barge price
is never better than the destination station; the barge count never exceeds the cap; a barge never
enters the save.

## M95 (0.45.0). A barge in distress, escort runs, wreckage — DONE

Built, 1313 green, the scene frame (crippled barge + wreck) renders without errors; the
distress → rescue → reward pipeline ran as a live cycle. All in `12l-barge.js` plus hooks: your
shot hitting a barge in `updateCombat` (13-pirates), approaching and drawing a wreck in
`17-mode-system`, the rescued passenger as a candidate in `stationMercs` (12a-crew). Wrecks and
passengers persist (`G.wrecks`, `G.bargePax` in 14-save). Suite `"a barge: death leaves a trace"`.

**Decisions taken along the way:**
- a rescue counts ONLY for a barge that pirates were mauling (`wasPirateDistress`): nobody
  "rescues" a barge the player shot up himself — otherwise firing on a peaceful barge would pay;
- under fire the counter is closed (no trading mid-fight): approaching a barge in distress you see
  its hull in percent and the choice "drive them off or finish her";
- a wreck is searched through the `POI_FIND.wreck` branch — the same reward as a planet-side
  "ship wreck", so as not to breed a second source of parts.

**Left as a tail:** captain temper (`BARGE_TEMPER`) is still not read in combat — the timid one
should pull the barge away from pirates, the fighter should shoot back; today temper lives only in
haggling. Finishing off a faction baron is declared as "the way into M98", but the revenge itself
doesn't exist yet — that is M98.

### Original M95 intent

- **Interception.** Pirates (`13-pirates`) see barges. Arriving in a system you may walk into a
  fight. Three outcomes, all counted as deeds: join in (reputation, a share of cargo, the captain
  remembers), pass by (nothing), finish her yourself (reputation drops sharply, the cargo is yours
  — the way into M98).
- **An escort contract** through `11a-quests`: paid up front, route known in advance. Failure
  doesn't take credits — it takes reputation. There is no steady profit here, same as with a hired hand.
- **Wreckage.** A sunk barge leaves a wreck, searched later through the "ship wreck" branch of
  `POI_FIND` (`20a-poi`) — exactly once.
- **A passenger.** Now and then a barge carries a person rather than cargo. Deliver them and they
  surface in the cantina (`27d-ui-cantina`) as a hired hand (`12a-crew`) with their own line about
  that run. This is the only hired hand who comes to you.

Suite: **"a barge: death leaves a trace"** — a sunk barge yields exactly one searchable wreck; a
failed escort pays no credits; a rescue moves reputation within the cap; a passenger never appears twice.

## M96 (0.46.0). A hundred rarities: a table of addresses, not a roulette — DONE

Built, 1340 green (was 1313), parse check and empty console. Module `12m-rare.js` after
`12l-barge`, before `13-pirates`. `RARE` — a hundred records, generated deterministically from a
fixed seed (like `NODES`) and frozen. Persistence is `G.rareFound` (list of ids, default `[]`, in
`snapshot`/`applySave`), cleared by `resetWorld`. Effects are read from `stat()` through
`rareSum(tag)` — the same place as modules and crowns. The rarity board hangs next to the node
sets (`rareRender` called from `nodesRender`).

**The addressing decision.** The galaxy is universal and deterministic (there is no per-save
seed), so an "address" is not a precomputed point but a deterministic function of the place key:
`rareAtPlace(where,key)=pool[hashi(key…)%pool.length]`. The same place (a monument's `q.seed`, a
cave face, a rock seed, a lair's system, a barge wreck seed) always yields the same rarity —
reload-farming can't touch it. A rarity therefore has many addresses rather than one: with
infinite keys and a hundred rarities every one is guaranteed reachable (pigeonhole). The strict
"exactly one address" of the original intent was replaced by "a deterministic answer per place +
guaranteed reachability" — which is honest for an infinite procedural world, and is what the
guard checks (sweeping keys reaches all hundred).

**Hooks (six places, `typeof rareTake==="function"`):** inspecting a monument (`poiInspect`, as
`poi`; a temple with a known coordinate as `temple`, closing the M92 tail), a cave find
(`22-mode-cave`), a worked-out belt rock (`24-mode-belt`), killing a baron while boarding
(`24a-mode-raid`), searching a barge wreck (`12l-barge`). The effect is a small property of a
thing, never credits.

**Left as a tail (into M97/M100):** a museum wall for the hundred rarities belongs in the house
(`27e-ui-home`), with the circumstances of each find; today the board only counts by place and
shows the last six. The planet for a full set is M97 itself.

### Original intent

New module `12m-rare.js`. `RARE` — a closed table of exactly a hundred records
`{id, ru, note, where, effect}`.

- **No drop chance at all.** At world generation every rarity gets exactly one address,
  deterministic from the save seed. Either it is there or it isn't. `G.rareFound` is what has been
  carried off (persisted, default `[]`).
- **Places are taken from the living ones** — like `NODE_WHERE` for nodes: a monument (all ten
  types), the depth of a cave (`22-mode-cave`), the belt (`24b-belt-poi`), a barge (M94), a
  baron's lair (M87), a temple with a known coordinate.
- **Closes the tail "the temple stays silent when the coordinate is known" (M92):** it hands over
  a rarity if the address is here, and that is its repeat answer.
- **Closes the tail "the baron has no trophy of his own" (M87):** the baron's trophy is one of the
  hundred, not a separate system. The other monuments' "repeat answers" close the same way: a
  repeat is a rarity's address, not a second draw.
- **The showcase effect** is small, singular in the meaning of the thing, and never credits. A
  monument is not an ATM, and neither is the showcase.

Suite: **"rarities: a hundred addresses, not one repeat"** — the table holds exactly 100 records,
ids are unique, every `where` value exists among the living places and actually yields a rarity;
none of them pays credits; none can be taken twice. The same guard that found 500 unreachable
nodes at M91.

## M97 (0.48.0). A planet for the collection: a node, not a checkbox — DONE

New module `12n-planet.js`. Built, all green (1815 assertions), suite `91q-planet`. The hundredth
rarity grants the planet you are standing on (`planetGrant` from `rareTake`); stock accrues lazily
by real time and is capped per resource; `planetHaul` only works in the node's own system. The
barge router takes the node as a stop (`planetStop` inside `bargeSysAt`, a leg in `bargeLegs`), and
a passing barge carries your goods to you for free (`planetBargeLoad`/`planetTakeLoad`) — a
delivery, never a purchase. Persisted through `G.pnode`; the save format stayed `v:4`.

- **Only for the full set.** 100 out of 100, with no partial handouts: partial progress is already
  rewarded by the wall in the house (M100). A planet can't be bought, just as a house can't.
- **It is the second growth counter.** The house grows from turnover (`earn()`), the planet from
  completeness. The two funnels don't mix.
- **The planet's job is to be a point on the factor's map.** It produces goods like a station, and
  barges start calling on it (M94). The player stops being a client of the system and becomes a
  node of it — that is the reward, not an income line.
- The planet's yield comes as goods, not credits: haul them yourself or wait for a barge.

Suite: **"the planet: full set only"** — nothing is granted below a hundred; the planet never pays
credits directly; the barge router accepts the player's node on equal terms with a station.

## M98 (0.49.0). The shadow of reputation: the hunter and his lair — DONE

New module `12o-hunter.js`, suite `91r-hunter`, all green (1837 assertions). `huntMark` is the only
entrance and it is called from a deed (`bargeSunk` by the player), never from a number; `huntHere`
keeps him inside `HUNT_RADIUS` of his own sector; `huntSpawn` puts him into `G.pirates` through the
one entry point everybody uses, with the flagship bake (12i) for the silhouette. `huntDefeated`
writes `dead`/`paid` — the bounty is one-off and survives saves. The lair got its owner: in his
sector the base takes his name and colour outside and one more tier of guard inside.

**Deliberately left for the visual queue:** his crew's marks on the lair plating and its own dock
outline. Today the difference outside is name, colour and guard — real, but not yet drawn.

## M98 (0.48.0). The shadow of reputation — original spec

Today reputation only helps — cheaper hardware, more people at the tables. There is no far side,
and so hostility costs nothing.

- **A personal score.** Attacking a barge or faction ships creates
  `G.hunted[faction] = {cap, seed, tier}` — not an abstract minus on a number but a captain with a
  name who comes after you.
- The hunter's hull is baked by the M82 machinery as a distinct silhouette: he is recognised in a fight.
- **Closes the tail "a lair looks like an ordinary base from outside" (M87):** the lair gets an
  owner, and therefore a reason to look different from outside — his crew's marks on the plating,
  its own dock outline.
- **A contract on a specific captain** — the reward is one-off, never obtainable a second time.

Suite: **"the hunter: comes only for a debt"** — without a hostile deed no hunter appears; a killed
one never respawns; the bounty is paid once.

## M99 (0.50.0). The world moves without you: the retelling — DONE

New module `12p-news.js` (12o went to the hunter), suite `91s-news`, all green (2820 assertions).
Five kinds of change, each applying real state before it says a word: market pressure, an owner
swap, a barge wreck added to `G.wrecks`, a sector quieted through `occCalm`/`occSet`, and the rival
collector. Rolled lazily off `G.newsT`, at most three per return, heard in the cantina. Every
rumour drops a `newsMark`, and the map draws that layer (M92 tail closed). The rival takes only
rarities you have not found, never the last free one, flies his own sector as an ordinary
`G.pirates` entry and yields the piece when beaten — `rareTake` on his address tells you who has it
instead of going silent.

## M99 (0.49.0). The world moves without you — original spec

Not a simulation — rolls over elapsed time, told in words. An extension of `12b-crew-events` or a
new `12o-news`. Faking beats computing: the player only ever sees the outcome.

- What happens while you're away: a baron went broke, another faction bought out a station (prices
  and stock changed), someone else sank a pirate captain, a barge vanished on its route, a rival
  collector took a rarity.
- **The decision about the rival:** he does not close a slot forever — otherwise a hundred out of a
  hundred becomes unreachable and the planet (M97) hangs. A taken rarity changes address: it is his
  now, and he becomes the address. A rival is a transfer, not a loss.
- You hear it in the cantina, the same way people already sit there by reputation.
- **Closes the tail "the observatory marks nothing on the map" (M92):** knowledge becomes a layer
  on the map — "prices known", "tip is stale", "the owner changed here".

Suite: **"the retelling: rumours don't lie"** — behind every rumour stands a real state change; no
rumour makes a hundred out of a hundred unreachable.

## M100 (0.51.0). A lived-in house — DONE

Suite `91t-home-live`, all green (2846). Hit zones (`HOME_HIT`/`homeHitAt`/`homeSceneClick`) are
emitted by the drawing pass itself — one description of the geometry, not two. The hallway grew to
50 units and got a real doorway, coats with shoulders, boots and a shelf; the garage got a
workbench, a tool board, a drum and a puddle. Crew at home are drawn as `hqFigure` bodies with
morale in the pose (`homeCrewFigure`). The housemate (`homeMate*` in 12j) gives one thing per tier,
remembered in `H.mateTier` through the save. The museum wall hangs in the study, with the progress
log in the panel below.

**Faults found by eye in this pass** (worth more than a list of achievements): coats read as a
bottle in a 40-unit hallway; the tool board sat inside the ship's hull; the ship floated above its
trestles; the power cable crossed the silhouette; the museum wall shouted over the room until its
colours were mixed into the wall.

## M100 (0.50.0). A lived-in house — original spec

Collects three debts at once (tails 1, 2 and intent 7 of the previous queue).

- **The things can be poked.** Hit zones right in the scene (`27e-ui-home`): the garage parks a
  ship, the showcase puts out the rare. The buttons in HOLDINGS stay, but stop being the only way.
- **The hallway and the garage become concrete** — after M93 the other seven steps are lived in,
  and these two fall out of the room's language.
- **Hired hands are visible at home.** Whoever is not on a job sits in the living quarters as a
  `hqFigure` body, squeezed to the room's scale (one language of figures across the whole game).
  Morale stops being an invisible multiplier.
- **A housemate** offers something once a pass: a tip, a spare part, a rumour. Livens a step up
  without a new window.
- **The museum wall** for the hundred rarities: not a counter but a ship's log — what was taken,
  where, and under what circumstances. Trophies already hang by zone (M93), the hundred rarities
  belong there too. The progress board goes in the study, not on a separate screen.

## M101 (0.52.0). Nodes and crowns in hand — DONE

`nodeHold`/`nodeHolder` in `05a-nodes`, drawn live in `drawCockpit` (not in the baked dash texture:
the node changes and it sways). Persisted as `G.nodeShow`, validated against the collection on
load. Tests added to `91m-nodes` — "the holder: the thing stands where you look": a node you do not
own cannot be put in, the holder never touches `stat()`, and a node that leaves the collection
leaves the holder. **Fault found by eye:** on the central stack the node collided with the pitch
ladder and the hull nose and read as a rock outside the glass; it moved to the left pillar.

## M101 (0.51.0). Nodes and crowns in hand — original spec

Intent 8. Crowns are worn as a bar aboard (M91), but the player never sees the thing itself
outside a list. Show it in the cockpit (`25-cockpit`): a holder under the instruments, the active
node visible from where the player spends all their time.

## M102 (0.53.0). Reputation drives who sits in the cantina — DONE

`stationMgrs` (12c) and `stationMercs` (12a) read `repAt(sys)`: at +2 one candidate is levelled (at
+4 two, and they cost 15% more), at −2 everyone's record is cut down. Suite added to `91c-mgr` —
"reputation: the ones worth hiring sit with their own". The guard that matters: the room never
empties, and a deal's content is byte-identical at +5 and −5 (the count of deals already moved with
reputation since M92 — that is table count, not content).

## M102 (0.52.0). Reputation drives who sits in the cantina — original spec

Intent 9. Reputation changes the number of tables and the prices, but not WHO walks in. Among your
own, better managers and hired hands with longer run records appear; among strangers, nothing but
random folk. Reputation still doesn't touch the content of the deals: that would turn into access
progression.

## M103 (0.54.0). A trade branch of your own — DONE

`12r-route` — the player's own ring of 2–4 stations, read off the live market: what to take on
each leg, what the loop nets after fuel, drawn on the map with arrows and one label on the best
leg. Sold to an information buyer it leaves the map and the prices on it settle; handed to the
factor it becomes his route and stops being yours. Every loop presses the destination price down,
so the ring thins with use — the wear that keeps it from being a machine for money.

**Decisions taken while building it:**
- the paper is valued at a **full hold**, not at what the player can afford right now: a spread
  does not get cheaper because you are broke, and the buyer has his own purse;
- **one label on the map, on the best leg only.** Three plates on three legs collided with each
  other and with the jump price — the map turned into a table, and the table lives on the station;
- the loop counter advances **in order**: docking out of order re-anchors the cursor instead of
  punishing, but only a full ring counts as a loop.

## M103 (0.53.0). A trade branch of your own — original spec

Intent 10, formerly M84. Now that barges are the factor's body, the player's branch is its mirror:
your own route with legs, run by hand rather than as a spread on the map. A route is an object: it
can be written down, sold and lost.

## M104 (0.55.0). The ship ages — DONE

`12s-wear` — hours flown pile up on the hull (`G.wear` keyed by ship id, `WEAR_RATE` per mode:
the belt and the scoop are dirtier than empty space). Costs up to −12% thrust and turn and nothing
else. The yard takes half for money; the home garage takes all of it for free, which is what
finally gives M93's garage a job.

**Decisions taken while building it, and the two faults the frames showed:**
- the first pass washed the whole hull in even grey — at a third of the wear the scout had already
  lost its colour and read as cement. Wear **collects in places**: the bleach follows the paint
  stripe, dust runs along the flow by the ribs, soot sits at the nozzles, and the paint between
  them stays paint;
- the second pass was invisible at flight scale, which defeats the point. The readable signal is
  the **colour stripe fading toward the body colour** — the ship loses its identifying mark before
  it gains a single scratch, and that reads in a thumbnail;
- wear never touches hull, tank or hold: an unwashed ship **handles** worse, it does not break.
  Anything else would turn ageing into a repair chore, and repair already exists.

## M104 (0.54.0). The ship ages — original spec

The garage (M93) has no reason to exist while the ship is only repaired after a fight. Hours flown
accumulate layers on the hull — scuffs, dust trails, sun-bleached paint (the live damage layer of
M82 already does this for pirates). You come home because it has piled up, not because something broke.
