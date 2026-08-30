# The holding — routes, share, development, buildings

Design, 2026-08-31, worked out with the author across one long evening and settled the same
night. Nothing here is built yet: this file exists so the reasoning survives the session that
produced it. Written in English like the rest of `docs/`; the in-game names stay Russian because
they are game text, and the register they are in was chosen deliberately — see §7.

The author's brief, in his own words and in the order they came:

> «В маршрут на карте тоже непонятно зачем он сделан.»
> «маршруты нафига, вот тебе показывают что возить, а как возить то, ты же купить не можешь…
> продавать непонятно, можно бесконечно по карте тыкать и продавать маршруты.»
> «кнопка в маршрут это как будто ты уже летишь туда.»
> «хочу чтобы можно было собрать баржу, нанять туда пилота и сделать какой нить ебический
> маршрут… чтобы там цены росли а не только падали, типо ты такой отвозил кому то что то, там
> цена на это упала, и там че то построилось, а потом отвез в другую систему другой материал…
> чтобы станций много зацепить можно было.»
> «надо еще как то показывать мож уровень станции или системы… завод х3 и че дает там в
> процентах… давай дохерище построек придумаем, и станции и системы сами развиваются от того
> что ты там делаешь, не только от того что ты возишь товары.»
> «навалим дополнительных материалов, сплавов… не по рецептам, а если ты возишь то тебе
> производят материалы какие нибудь.»
> «прям видно должно быть что там строятся станции планеты там или еще как то очевидно
> показать что система прокачана.»
> «лестница освоения — давай число ступеней увеличим до 30.»

---

## 1. What is in the code today — two measured findings

### 1.1 Every price move the player can make points down

All the writers of `pressure`, the only term that bends a station's price (`marketFor` applies
`clamp(1 + pressure, .4, 1.8)`):

| who | move | clamp |
|---|---|---|
| the player sells (`12-economy:34,40`) | −0.005 per unit | `[-0.35, **0**]` |
| the factor's barge delivers (`12c-mgr-core:646`) | −0.004 per volume | `[-0.35, **0**]` |
| a route is sold (`12r-route:134`) | −0.14 | `[-0.35, **0**]` |
| **news** (`12p-news:98,106`) | **+0.35…+0.65** | `[-0.6, +0.8]` |

Everything the player does is capped at zero from above. The only thing that lifts a price is a
random news event. The world can get poorer from the player and never richer. That is the whole of
«цены только падают», and it is one clamp.

### 1.2 A route can be sold without ever being flown

`routeSell()` (`12r-route:128`) asks for `legs.length >= 2` and `routeValue() > 0`.
`routeValue()` = `(loop gross − fuel) × 3.2 × 0.82^loops`, and `loops` is reset by the sale itself.
`routeLegs()` prices every leg through `marketFor(getSystem(sx,sy))` — **for any station, visited
or not**. Tap two unseen stations on the map, sell, repeat, without leaving the map.

### 1.3 And the button lies about the first leg

`drawRouteMap` returns when `legs.length < 2` (`12r-route:161`) and `routeLine()` is gated the
same way. After marking the **first** station the map changes by nothing at all.

---

## 2. The route becomes an order, not a calculator

Its life has three parts — *found it yourself → walked it yourself → handed it on* — and today
only the third exists and can be entered directly.

**R1. A leg only where you have seen the prices with your own eyes.** `G.seenPrices` already
exists, is written on docking and remembers the day. The route shows **your note with its date**:
«титан 41 · видел 6 дней назад». At an unvisited station the map button says «цен этой станции вы
не видели».

**R2. «В МАРШРУТ» means «I am going there».** Marked stars carry a number, the next one in the
ring is lit, the footer says «СЛЕДУЮЩЕЕ ПЛЕЧО · «Сардразль» · 2 прыжка · везём титан», and the
jump button becomes «ПРЫЖОК ПО МАРШРУТУ». Visible **from the first leg**.

**R3. The station knows about the route.** First row of ТОРГОВЛЯ:

> **ПО МАРШРУТУ · взять титан ×18** — 738 кр · трюм 18/32 → `[ВЗЯТЬ]`

and at the selling end «ПО МАРШРУТУ · сдать титан ×18». One button instead of "scroll the market,
find titan, press buy eighteen times". It tells the truth when it cannot: «денег хватит на 11 из
18».

**R4. Only a walked route can be sold**, for a share of what it earned **you**. Zero loops, zero
price, and the button says why. The same pair will not buy the same route twice.

**R5. Handing it to the factor stays the other ending.** `routeToFactor` already exists and is the
real prize. Selling is money now; handing on is a holding. Both close a route and both now require
it to have been real.

---

## 3. Пай — the core mechanic, and it has no new button

The author's own formulation: «не по рецептам, а если ты возишь, то тебе производят».

A building eats a daily quota. Anyone may feed it — the factor's barges, other people's traffic,
you. **Feeding is simply selling that good at that station.** No new verb: the player already
knows how to sell.

The game remembers **whose share** of what it ate over the last day. The same share of what it
made is yours.

```
ПЛАВИЛЬНЫЙ ПЕРЕДЕЛ ×2 · ест 6 железа и 2 кварца в сутки
вы кормите 4 из 6 · ваша доля 67%
ВАШ ПАЙ: 14 сплавов · накопитель держит до 18        [ЗАБРАТЬ]
```

The share accrues at that station under your name and **stops at three days of output**. Not
coming back does not stop production — it stops being yours. That is the reason to return, and the
reason a barge exists: a hold empties a quota in one drop, a quota is filled evenly.

Three consequences that make this a strategy rather than a farm:

- **Feeding is not selling.** The iron you fed to the smelter is iron you did not carry to market.
  The price of a share is **cargo space** — the scarcest thing you own.
- **Others feed it too.** Disappear for a week and your share melts. A holding is held, not
  founded.
- **Nobody hands out recipes.** You do not "craft an alloy". You haul iron to «Сардразль» and they
  issue you alloy. Those are different games.

---

## 4. Demand instead of a pit

Lift the ceiling at zero, but not into a well. A place that **eats** something pays more for it —
**up to what it eats in a day**:

- the first N units a day at +X%;
- the (N+1)-th and everything after at the normal price, and then down as now.

This one rule keeps the layer from being a printing press: income becomes a **rate per hour**, and
a big hold cannot drain it in one call.

---

## 5. The industrial market exists only where you made it

Tier 1 and above are **not taken by the ordinary market**. Rolled steel is bought where there is
something to eat it — a station with the matching building. So:

- **you create the market yourself.** A forge three sectors away turns dead cargo into money;
- **other people start hauling it too**: the factor's barges smell the demand. The world comes
  alive around your building, not only around you;
- **money cannot cut the corner.** Techcomps are not for sale: either you take them off pirates or
  you feed the instrument shop.

---

## 6. Two ladders

**A station grows by buildings** — each ×1…×3, the author's «завод х3».
**A system grows up thirty rungs** — fed by everything the player does there, not only by cargo.

What counts towards a rung: a drilled deposit and a worked shaft, a drone that finished its point,
a cell of a built base, a sector taken back from pirates and a pirate base boarded, a monument
examined and a node taken, a name given to the system, cargo delivered (by volume), a settlement
grown, a home or a wintering put down, a beacon set.

---

## 7. The register of the names — Б+А

Three registers were written out and heard against each other:

- **А · ЭФЕМЕРИДА** — Efremov, the great science: Засечка, Керн, Спираль, Кольцо. Beautiful, but
  speaks from above; a first probe has no «обитаемый горизонт».
- **Б · МОНТАЖ** — the Strugatskys and a real launch complex: Вымпел, Купол, Монтажный корпус,
  Стыковочный узел, Трасса. Dry words used by people doing the work.
- **В · ФРОНТИР** — Заимка, Шурф, Прииск, Барак, Пакгауз. Warm, but it is Siberia, not space. The
  author's verdict: «че то какие то не космические названия».

**Chosen: Б below, А above.** It starts with metal and automatics and ends with a civilisation —
from a pennant to the Ring. Two earthly words are kept on purpose — «Красный уголок» and
«Столовая», and «Дружина» beside them: in a module at the edge of the galaxy they read as home,
and that seam is what Soviet science fiction was made of.

---

## 8. The ladder — thirty rungs in six five-year plans

**0 · ПУСТО** — a star and nothing else.

### I · РАЗВЕДКА — the automatics work

| № | rung | what it gives |
|---|---|---|
| 1 | **Засечка** | the system gets its mark on the map and a line in the summary |
| 2 | **Эфемерида** | orbits computed — the jump here is cheaper |
| 3 | **Облёт** | flown through under your own power; a thin arc at the star |
| 4 | **Вымпел** | a sign left: the system is yours by right of first |
| 5 | **Автомат** ★ | an automatic station works here: heard on the air, mail reaches it |

### II · ПРИСУТСТВИЕ — a human arrives

| № | rung | what it gives |
|---|---|---|
| 6 | **Посадка** | you have stood on the ground |
| 7 | **Проба грунта** | deposits show their content without drilling |
| 8 | **Полигон** | the work area is laid out: twice as many drones |
| 9 | **Купол** | first pressure; ore is richer |
| 10 | **Замкнутый цикл** ★ | air and water of its own — one can stay, and need not haul them |

### III · МОНТАЖ — the metal goes up

| № | rung | what it gives |
|---|---|---|
| 11 | **Монтажная площадка** ★ | **the building site opens** |
| 12 | **Жилой отсек** | there are hands: building goes a quarter faster |
| 13 | **Накопитель** | the share ceiling doubles |
| 14 | **Обогатитель** | tier 1 buildings may be laid down |
| 15 | **Литейный модуль** ★ | a second site |

### IV · УЗЕЛ — other people come

| № | rung | what it gives |
|---|---|---|
| 16 | **Стыковочный узел** | not only your ships dock here |
| 17 | **Грузовой терминал** | demand holds up without you |
| 18 | **Городок** | people live in families: artel, scrip, holidays |
| 19 | **Причальная ферма** | your own barge stands and loads |
| 20 | **Промышленный узел** ★ | tier 2 buildings and a third site |

### V · УПРАВЛЕНИЕ — the system decides for itself

| № | rung | what it gives |
|---|---|---|
| 21 | **Управление** | its own summary and its own plan |
| 22 | **Монтажный корпус** | hulls and barges are assembled here |
| 23 | **Институт** | teaches and computes: tech cheaper, recipes of its own |
| 24 | **Заслон** | a pirate focus does not grow here |
| 25 | **Узел трасс** ★ | the lines meet; the factor's domain moves in; tier 3 |

### VI · КОЛЬЦО — a civilisation

| № | rung | what it gives |
|---|---|---|
| 26 | **Главк** | the whole holding in one summary, without flying |
| 27 | **Трасса** | a regular line to a neighbour: the jump along it is half price |
| 28 | **Пояс огней** | the planet's night side is lit all the way round |
| 29 | **Полдень** | the system feeds itself: its buildings eat its own output |
| 30 | **Кольцо** ★ | it has entered the ring; others are named after it, and people come by themselves |

Six starred rungs are real thresholds; the other twenty-four are an even climb, so that every
return moves something.

### 8.1 What you are called

The rung changes how you are addressed at the counter — the game already has forms of address:

**никак** → **наблюдатель** (5) → **монтажник** (11) → **начальник участка** (15) →
**управляющий** (20) → **начальник трассы** (25) → **по имени-отчеству** (30)

The last is the best prize in the ladder: at thirty they stop calling you by your post.

---

## 9. The material tree

### Tier 0 — raw (exists)
Лёд 7 · Железо 11 · Кремний 17 · Органика 29 · Углерод 46 · Титан 38 · Изотопы 55 · Иридий 74 ·
Кристаллы 105 · Ксенобиом 190 · Летучие газы · Кристаллы льда

### Tier 1 — передел
**Прокат** · **Обшивка** · **Арматура** · **Огнеупор** · **Реголитобетон** · **Кварц** ·
**Диэлектрик** · **Кабель** · **Смола** · **Изолятор** · **Углеволокно** · **Графит** ·
**Карбид** · **Спирт** · **Синтебелок** · **Сплавы** · **Ферросплав** · **Тяжёлая вода** ·
**Кислород** · **Гидразин** · **Криоген** · **Теплозащита**

### Tier 2 — узлы
**Подшипник** · **Насос** · **Оптика** · **Радиолампа** · **Реле** · **Сельсин** · **Термопара** ·
**Гироскоп** · **Полупроводники** · **Сверхпроводник** · **Техкомпоненты** · **Реакторный блок** ·
**Аккумулятор** · **Регенератор** · **Консервы** · **Гермоткань** · **Гермоплёнка** ·
**Люминофор**

### Tier 3 — крупное
**Секция корпуса** · **Станочная линия** · **Жилой блок** · **Купол** · **Мачта** ·
**Причальная балка** · **Стартовая ферма** · **Солнечная панель**

The instrument row — радиолампа, реле, сельсин, термопара, гироскоп — feeds what the game already
has: the kit of instruments in the cockpit (`25a-instr`, `05b-instr-kit`). Your own shops start
making the dials in front of your face.

Спирт stays out of the cosmic dictionary on purpose: on a frontier it is solvent, antifreeze and
currency at once, and that is the truth of the place.

---

## 10. The buildings

Every building eats a **daily quota**, never a stock, and pays a **пай** in proportion. Levels
×1/×2/×3 scale the quota and the effect. Where one may stand is decided by the station type
(`ST_TYPES`, `06-galaxy:8`) and by what the system physically has — a solid world, a belt, a gas
giant, fauna.

**Добыча.** Реголитовая разработка · Буровой комплекс · Ледодобыча · Драга · Газовый промысел ·
Оранжерея · Биостанция · Отвальное хозяйство

**Передел.** Плавильный передел · Прокатный стан · Обшивочный цех · Арматурный · Огнеупорная печь ·
Бетонный узел · Стекловарня · Диэлектрический цех · Кабельный цех · Смолокурня · Изоляторный цех ·
Углеволоконный цех · Графитовый цех · Карбидная печь · Биосинтез · Синтезатор белка · Изотопная
колонна · Кислородная станция · Гидразиновый завод · Криогенный цех · Теплозащитный цех

**Приборы и узлы.** Приборный цех · Ламповый цех · Релейная мастерская · Гироскопная ·
Полупроводниковая лаборатория · Подшипниковый · Насосный · Оптическая мастерская · Кристаллорезка ·
Реакторная сборка · Консервный · Ткацкая · Регенераторный

**Крупное.** Стапель · Станкозавод · Домостроительный · Купольный участок · Мачтовая бригада ·
Стартовая ферма · Панельный цех

**Хозяйство и порядок.** Накопитель · Товарная контора (neighbours' prices) · Расчётная касса
(scrip) · Грузовой причал · Сортировочная (the share may be collected in any of your systems) ·
Диспетчерская (all your quotas and shares without flying) · Грузовой двор (others feed your
buildings more readily) · Холодильник (the share ceiling ×3) · Заводоуправление (posts the plan)

**Флот.** Ремонтный док · Заправочный узел · Механические мастерские · Ангар · Отстойник

**Люди.** Дом приезжих · Учебный пункт · Медпункт · Отдел кадров · Артель · Красный уголок ·
Столовая

**Оборона.** Оборонная батарея · Наблюдательный пост · Дружина · Заграждение

**Знание и жизнь.** Обсерватория · Лаборатория · Архив экспедиции · Городок · Личный причал ·
Радиомачта · Метеостанция · Пункт связи

### 10.1 The rule that makes it a strategy

**No building eats what its own system makes.** A smelter wants quartz, and quartz comes off rocky
worlds; a forge wants alloy from the smelter; a slipway wants both. A self-sufficient node
**cannot** be built below rung 29 — something is always missing, and that shortage *is* the route.

### 10.2 A worked example

1. **«Тегра»**, a frontier station. You drilled, left a drone, cleared the focus — rung 11, the
   **монтажная площадка** opens.
2. You lay down a **реголитовая разработка**: 60 техкомпонентов, 30 сплавов. You haul it. It
   stands, and «Тегра» makes iron 30% under the market.
3. Cheap iron has to go somewhere. Three sectors away you put a **плавильный передел**; it eats
   iron at +35% up to the quota and pays you a share of the alloy.
4. The alloy is wanted back at «Тегра» — and a **накопитель** so the leg is not drained. The ring
   closes, and you made it.
5. A quota fills evenly, a hold empties in one drop. So: a **монтажный корпус** for a barge and an
   **учебный пункт** for its pilot.
6. Then a **приборный цех**: техкомпоненты, which until now came only off a boarded pirate base.
7. Pirates close the system and all of it stops. You build a **батарея** and a **дружина**, or you
   go and fight.

---

## 11. Уклады — what a system becomes

The уклад forms by itself out of what stands there, and goes into the news and the rumours in
other people's words.

**РУДНИК** · **КОМБИНАТ** · **ПРИБОРНЫЙ** · **ХИМИЧЕСКИЙ** · **ЭНЕРГЕТИЧЕСКИЙ** · **ВЕРФЬ** ·
**ТРАНСПОРТНЫЙ УЗЕЛ** · **НАУЧНЫЙ ПОСТ** · **ГОРОДОК** · **УКРЕПРАЙОН**

---

## 12. The barge and the pilot

The barge already exists (`12l-barge`) — but as the factor's: a route given a body, ephemeral,
`BARGE_CAP=6` in the galaxy. The player's own is assembled from parts already in the game:

- **hull** — at a **монтажный корпус** (or on your own base), out of секции корпуса, not in one
  visit;
- **pilot** — an ordinary hire with a new order kind `barge`: he already has a ship, an order,
  runs, wear, hidden luck and a history;
- **route** — the one you walked yourself.

Ten times your hold, slow, trades without docking, empties a quota evenly, and is a target for
pirates — which already works, and a blockade stops it along with the building.

Hull names, in the cargo register rather than the cruiser one: **«Лихтер»** · **«Паром»** ·
**«Тягач»** · **«Сухогруз»** · **«Транспорт»** · **«Караван»** · **«Кряж»**. Other people's barge
captains are already Тук, Барма, Овод, Севрюга, Ушкуй; yours stand in the same row.

---

## 13. How it is SEEN

A number in the corner is not an answer. A developed system must read **by silhouette**, before
any text. The author: «прям видно должно быть что там строятся станции планеты».

### On the galaxy map

- A ring at the star: a thin arc at Вымпел, a closed ring at Монтажная площадка, a double ring at
  Управление, a ring with a notch at Кольцо.
- **The ring's colour is the уклад**: рудник ochre, комбинат orange with smoke in it, верфь steel,
  научный пост phosphor, городок warm yellow, укрепрайон red.
- Beside it, a **column of lights** by the number of buildings. Not a figure — lights.
- Someone else's development (rivals, `12p`) is the same in another colour. One look at a sector
  says what is yours, what is theirs and what is empty.

### In the system — the main thing

**The station grows a body.** It is already drawn procedurally out of parts, so every building
hangs its own on it:

| building | what is seen on the station |
|---|---|
| Плавильный передел | a stack and a slow flare, the smoke drawn off along the orbit |
| Прокатный стан | a long shop down the hull, bands of light in its windows |
| Накопитель | rows of containers on the outer deck |
| Стапель | a truss with a hull inside it, growing from visit to visit |
| Оборонная батарея | turrets that turn to follow you |
| Городок / Жилой блок | lit windows, and more of them each time |
| Обсерватория | a dish turning towards its own star |
| Грузовой причал | a barge moored |

An empty station is a can in orbit. A Главк is a town you see on approach. **No figure is needed.**

### The planet changes too

A dump beside the shaft as a pale patch on the day side · **the lights of a городок on the night
side**, and more of them · a greenhouse dome catching the sun · a landing field, a straight line
where straight lines do not occur.

### Movement

At Засечка it is empty. At Узел трасс tugs run between the station and the planet, a barge loads
at the pier, drones draw their arcs. Alive is what moves.

### On the ground

You walk past what you built: a headframe over the shaft, a dome, cable masts, an antenna. The
game already draws player structures (`21c-built`); they only need tying to the buildings.

### On the air and at the counter

At Автомат the receiver picks up dispatch traffic — «…третий, приняли двести проката, сдавайте на
четвёртый…»; at ПУСТО, only noise. And at the counter they say it themselves: «— У нас теперь
печь. Год назад тут, кроме ветра, ничего не было».

---

## 14. The plan, and the vocabulary of order

**Заводоуправление** posts a **план** once a month: «прокат — 200». Closing it does not pay money
— it pays what money cannot buy: a **станочная линия** free, a person for the artel, a name on the
board, a line in the округ's news. Missing it is not punished. Next month the plan is simply
smaller, and that stings more.

**План** — what the заводоуправление posts for the month.
**Наряд** — a one-off errand (already in the game).
**Пай** — your share of the output for what you supplied.
**Сводка** — the line about a system: rung, уклад, buildings, plan.
**Отоварка** — collecting the share.
**Главк** — a rung, a building, and what you become.

And the floor under all of it: **you build among someone else's ruins.** The «Долгий ход» was
unrolling the same thing here and did not finish. A monument in the system gives a bonus to the
building whose drawing is on its slabs — «на плитах записано, как они ставили этот купол». The
pieces of the report are their summaries for a month just like yours. You are not developing an
emptiness; you are finishing what others did not reach, and one day someone will read your summary
the same way.

---

## 15. Where the rest of the game plugs in

- **Слухи** say where a building is wanted, and carry the уклад in other people's words.
- **Новости** stop being random wind: half of them are about what was built. «+0.35 on crystals»
  acquires a cause.
- **Цены** are the raw material of a route (R1), and a note ages.
- **Нужда** (`12aa-need`: `NEED_WIN=15`, `NEED_P=.3`, ×2 for one delivery) is the doorway — the
  same idea for one visit; a building is that need made permanent.
- **Скрип** and **посёлки** already grow; now they have something to grow from.
- **Блокада** (`13b-occupy`) stops a system eating and making: the economy becomes a weapon against
  you, and a reason to take a sector back.
- **Приборы в рубке** (`25a-instr`) are made by the instrument row of your own industry.

---

## 16. Balance targets, and what to measure

1. **No printing press.** Demand is a daily quota, never a stock. Income per hour before and after
   a building: the fork must be 1.5–2×, not 10×.
2. **The share against plain trade**: 1.3–1.8× per hour. Any more and trading dies.
3. **Payback** of a building 4–6 loops; ×2 twice that, ×3 four times.
4. **A full chain bottom to top spans at least five stations.** Otherwise one cluster closes the
   game.
5. **Not compulsory.** The game without buildings stays playable. This is a layer for whoever wants
   to play economics.
6. **No runaway.** One site per station until rung 15, a window, real materials to haul.
7. **Only the player builds.** The factor and other people's barges haul along what exists but
   raise nothing. The world changes where you have been — the same thought as names, the trace and
   the wall.
8. **Save shape.** `G.built = {"sx,sy": {plav:2, nakop:1}}`, `G.pai = {"sx,sy": {alloy:14}}`,
   `G.fed = {"sx,sy": {iron:.67}}`, `G.step = {"sx,sy": 19}` — sparse maps, pennies. Safe since
   M287 (`asMap`).

---

## 17. Decisions already taken

- **The buyer pays a share of what the route earned you**, not of a theoretical spread.
- **What is built is not for sale.** Knowledge of a road can be sold; your mark on the world cannot.
- **Stale price notes are shown as a widening fork**: «титан 41…58 · записи шесть дней».
- **Only the player builds.**
- **Register Б+А**, settled by the author 2026-08-31.
- **The server is left alone.** Conditions for ever touching `api.php` are in `docs/DEPLOY.md`.

---

## 18. Order of work

Each step ships on its own and is playable on its own.

1. **The route as an order** — R1…R5. The foundation.
2. **Demand upward** — lift the clamp at zero, introduce the daily quota. Delivers «цены растут» by
   itself.
3. **The ladder** — thirty rungs, the summary line, the ring on the map, the forms of address. No
   buildings yet: just seeing where you have lived.
4. **The site, пай, and the first tier** — добыча and передел. Already a full loop.
5. **The player's barge and its pilot** — монтажный корпус, учебный пункт, причальная ферма.
6. **The remaining families and the instrument row** — приборы, флот, люди, оборона, знание, жизнь.
7. **The station grows a body** — the visible half of §13; the map ring and the summary come with
   step 3, the silhouette comes here.
8. **КУРС** — the route and a rumour as one thing on the map; news with a cause; the plan.
