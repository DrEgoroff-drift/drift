# The holding — routes, share, development, buildings

Design, 2026-08-31, worked out with the author across one long evening. **Revised 2026-09-02**
against `CRITIQUE-holding.md` (six lenses, 37 findings) after the author settled its forks:

| fork | the author's choice | what it means below |
|---|---|---|
| 1 · how feeding pays | **(б)** the +X% stays *and* the share exists, but the share is never paid for the surcharged units | the station's own appetite pays +35% in money; a building pays a share; one unit is never paid twice (§3, §4) |
| 2 · the ПЕРЕПЛАВКА tab | **(б)** the recipes go | `SMELT` and the smelt tab are deleted the day the first Плавильный цех can pay alloy; «nobody hands out recipes» becomes true (§10.3) |
| 3 · scope | **(б)** everything at once, with numbers | all 82 buildings and 48 materials are in the tables below with quota, intake→output, cost and effect; a row without them does not exist (§9, §10) |
| 4 · the fleet | **later** | §18 is kept as the record of the evening and bracketed until the measurement of step 5; its names are undecided (§18, §19) |

Nothing here is built yet; the order of work is §19. Written in English like the rest of `docs/`;
the in-game names stay Russian because they are game text, and the register they are in was
chosen deliberately — see §7. Where this revision overturns the 08-31 text, the finding that did
it is cited as `[F..]`.

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

## 0. The clock of the layer — one unit, the shift [F01]

`CEL_DAY` is a minute of play and ticks only in an open tab; drones, hires and settlements run on
`Date.now()` with a 24-hour ceiling. Neither is a «day» a building can eat by. The layer therefore
has **one unit of its own**:

```
HOLD_SHIFT = 20 min of real time          // one refill is seen inside one visit
```

Everything in this document that says *shift* means that constant. Nothing in the layer ticks:
every building stores `{t0, …}` and is brought up to date lazily when read, from
`Date.now() − t0`, with the same 24-hour (72-shift) ceiling as `tickDrones`. A closed game does not
run the world; it settles the arrears once, on return, and only up to the ceilings below.

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
random news event. That is the whole of «цены только падают», and it is one clamp.

### 1.2 A route can be sold without ever being flown

`routeSell()` asks for `legs.length >= 2` and `routeValue() > 0`; `routeValue()` is a multiple of
the *live* spread for any station, visited or not. Tap two unseen stations on the map, sell,
repeat, without leaving the map.

### 1.3 And the button lies about the first leg

`drawRouteMap` and `routeLine()` return when `legs.length < 2`. After marking the **first** station
the map changes by nothing at all.

---

## 2. The route becomes an order, not a calculator

Its life has three parts — *found it yourself → walked it yourself → handed it on* — and today
only the third exists and can be entered directly.

**R1. A leg only where you have seen the prices with your own eyes.** `G.seenPrices` is written on
docking and remembers the day. A leg **copies the note into itself** — `{key, day, p}` — so that a
later eviction from the 24-slot paper, or a fresher note overwriting it, does not change a route
already laid [F18]. The route shows *your* note with its date, and a stale note as a widening fork:
«титан 41…58 · записи шесть дней» (±3% per day, ±40% at most). A note **heard** on the air does not
found a leg: «слышал, не видел» — it takes a docking. At an unvisited station the map button reads
«ЦЕН НЕ ВИДЕЛИ» before it is pressed, and says so after.

**R2. «В МАРШРУТ» means «I am going there»** — and it is a different verb from flying [F32]. The
map keeps its jump as **КУРС**: tap a star, jump, no conditions, because *going somewhere* must
never be refused. **В МАРШРУТ** is the order: marked stars carry a number, the next one in the
ring is lit, the footer says «СЛЕДУЮЩЕЕ ПЛЕЧО · «Сардразль» · 2 прыжка · везём титан», and when
the selected star *is* the next leg the jump line reads «ПРЫЖОК ПО МАРШРУТУ». Visible **from the
first leg**.

**R3. The station knows about the route.** First row of ТОРГОВЛЯ:

> **ПО МАРШРУТУ · взять титан ×18** — 738 кр · трюм 18/32 → `[ВЗЯТЬ]`

and at the selling end «ПО МАРШРУТУ · сдать титан ×18». One button instead of "scroll the market,
find titan, press buy eighteen times". It tells the truth when it cannot: «денег хватит на 11 из
18».

**R4. Only a walked route can be sold**, for a share of what it earned **you** — and *earned* is a
number the game keeps, not a spread it imagines [F08]: `G.trade.earned` accumulates the net of
every ПО МАРШРУТУ sale (sale minus what the leg's note says the goods cost), **excluding** a sale
that closed a need at ×2 — luck is not a road. Not before two loops. Price = two average loops.
Zero loops, zero price, and the button says why. **The same road is not bought twice**: a route's
identity is its set of legs, and a new route sharing two or more legs with one already sold is the
same road [F08]. The sold sets are kept (`G.trade.soldSets`), which is also what step 6 needs: a
sold road grows a barge on those legs, and it eats your quotas — you sold a road and bought a
competitor you can see.

**R5. Handing it to the factor stays the other ending.** `routeToFactor` already exists and is the
real prize. Selling is money now; handing on is a holding. Both close a route and both now require
it to have been walked at least once.

**ROUTE_MAX = 6** [F18]: §16.4 asks a full chain to span five stations, and a ring of four could
never hold one. `mgrRouteMax` is untouched — the factor's ceiling is his own.

---

## 3. Пай — the core mechanic, and it has no new button

The author's own formulation: «не по рецептам, а если ты возишь, то тебе производят».

A building eats a **quota per shift**. Feeding it is **selling that good at that station** — no
new verb. The game remembers **what you fed**, and the same share of what the building made is
yours, under your name, at that station.

**Fork 1(б), as settled:** a unit is paid **once**. The station's own *appetite* (§4) pays +35% in
money and no share. A *building* pays the normal price **and** a share. Where both want the same
good, the appetite is served first, then the building; the row says so before the button is
pressed:

```
КОМБИНАТ БЕРЁТ железо · 6 из 18 по +35%
ПЛАВИЛЬНЫЙ ЦЕХ ×2 БЕРЁТ ещё 12 · ваша доля станет 67%
ВАШ ПАЙ: 14 сплавов · лежит до 18                                   [ЗАБРАТЬ]
```

### 3.1 The hopper — how the share is kept [F22]

There is no simulation of other people's traffic. A building runs whether or not you come; what it
lacks, the world fills. What is stored is **only yours**:

```
G.hold["sx,sy"].bld[id] = { lvl, my, t0, got }
   my   units of yours in the hopper, waiting to be eaten
   t0   when the hopper was last brought up to date (Date.now())
   got  output accrued to you and not yet collected
```

On every read the building catches up: for each whole shift since `t0`, it eats
`eat = min(my, Q)` of yours, credits you `O × eat / Q` of output, and empties `my` by `eat`.
Then `got` is clipped to **three shifts of output**, `my` to **three shifts of intake**, and
`t0` advances. That is the whole model:

- **«Others feed it too»** is the `Q − eat` the world supplied — a number, not a fleet.
- **«Your share melts»** is the hopper running dry: three shifts after your last drop the output is
  nobody's, and production goes on.
- **A hold empties a quota in one drop, a quota is filled evenly**: the hopper takes at most three
  shifts of intake at once — «БЕРЁТ 6 из 18 · возьмёт ещё 12 в запас» — the rest is an ordinary
  sale at the ordinary price. That is why a barge exists.
- **The ceiling is the reason to return**, and it is modified **once** per system, ≤ ×2 [F07]: the
  Накопитель building doubles both clips. Nothing else touches them; nothing shows or hands out a
  share from afar except the barge, which costs hold and time.

Three consequences that make this a strategy rather than a farm:

- **Feeding is not carrying to market.** The iron you fed to the smelter is iron you did not carry
  where it was +35%. The price of a share is **cargo space** — the scarcest thing you own.
- **Disappear for a week and the hopper is empty.** A holding is held, not founded.
- **Nobody hands out recipes** — and with fork 2(б) that sentence is finally true: the ПЕРЕПЛАВКА
  tab is deleted (§10.3). You do not "craft an alloy". You haul iron to «Сардразль» and they issue
  you alloy. Those are different games.

### 3.2 Sources — the buildings that eat nothing [F04]

A добыча building makes **M per shift** into a stock that is yours to buy at **0.7× the local
price**, clipped at three shifts. Beyond the stock, the market — and buying **pushes pressure up**
(+0.005 per unit, ceiling +0.35): that is «цены растут» from the author's brief, for free, in the
same term that already exists. The share of a source is the discount; the ceiling is the same
three shifts; the reason to return is the same.

---

## 4. «БЕРЁТ» — one object called demand [F14, F26]

After the layer lands, a counter could be asked for the same good by five mechanics at once: the
need (×2, `12aa-need`), the errand, a building's quota, a monthly plan, and a settlement's diet.
There is **one** object instead — a *norm*:

```
{ k, nPerShift, add, source }     source: "need" | "station" | "building"
```

- The **need** stays what it is: a norm for one delivery with a deadline, `add = +1.0`.
- The **station's appetite** [F26] is a norm without a deadline, from `ST_TYPES`, ephemeral, no
  building required — so «цены растут» happens in the **first hour** and step 2 ships on its own:

| type | eats per shift | pays |
|---|---|---|
| Торговый узел | органика 6 · лёд 8 | +35% on those units |
| Промышленный комбинат | железо 10 · кремний 6 · титан 4 | +35% |
| Верфь | титан 6 · иридий 2 | +35% |
| Научная станция | кристаллы 3 · изотопы 4 | +35% |
| Пограничный аванпост | лёд 6 · органика 4 | +35% |
| Блошинец | кремний 4 | +35% |
| Заправочная | — (no market) | — |

Only goods the station actually lists. What was sold into the appetite this shift is stored in
the same map (`G.hold[key].ate[k] = [n, shift]`), nothing else.

- A **building** adds norms of `source:"building"` at the normal price with a share (§3).
- The **monthly plan** (§14) is bracketed; the settlement's diet stays a settlement thing and is
  named in §15 as the second feeder it is.

**The surcharge adds, never multiplies** [F02]: it enters `marketFor` as an addend inside the
same clamp as `pressure` — `clamp(1 + pressure + appetite, .4, 1.8)` — so it stacks with the need
and the factor's monopoly the way `12c-mgr-core:626` demands, and the 1.8 ceiling still holds.

One line on the ДОСКА and on the air: «БЕРЁТ железо · 6 в смену · +35% · сдано 4». The «выгодно»
tag in a hold row says «выгодно первые 6», because it is true for six units and false for the
seventh, and the player presses ПРОДАТЬ ВСЁ.

---

## 5. The industrial market exists only where you made it

Tier 1 and above are **not taken by the ordinary market**: `RES[k].ind = tier`, `price: 0`, so
`TRADE_KEYS`, the drones and the fuzzer never see them. Rolled steel is bought where there is
something to eat it — a station with the matching building. So:

- **you create the market yourself.** A forge three sectors away turns dead cargo into money;
- **the hold row knows where** [F15]: «прокат ×12 · едят на Сардразли · 3 прыжка» — the nearest
  eater in `G.hold`, so an industrial good is never a row with a zero and a question;
- **money cannot cut the corner.** Techcomps are not on the market: you take them off pirates or
  you feed the Приборный цех.

A **shadow price** exists for every industrial good — `(Σ inputs × 1.5 + fee) / output`, fee 20 /
60 / 200 by tier — and it is used for exactly two things: the сводка's «на … кр» and the
`91zzw` printout. The market never reads it.

---

## 6. Two ladders

**A station grows by buildings** — each ×1…×3, the author's «завод х3».
**A system grows up thirty rungs** — fed by everything the player does there, not only by cargo.

What counts, **with weights** [F30], all read from counters that already exist (`placeNote`,
`visits`, `rep`, `bases`, `settle.stage`, `mines`, `hold`) — no second register [F16]:

| deed | points | cap |
|---|---|---|
| a deposit drilled | 1 | 4 |
| a shaft worked (`G.mines`) | 2 | 2 |
| a drone that finished its point | 1 | 6 |
| a cell of a built base | 1 | 8 |
| a sector taken back from pirates | 3 | 3 |
| a pirate base boarded | 3 | 3 |
| a monument examined | 1 | 3 |
| a node taken | 1 | 3 |
| a name given to the system | 2 | 2 |
| cargo **you docked with**, per 50 units — never a barge's [F12] | 1 | 6 |
| a settlement grown, per stage | 2 | 6 |
| a home or a wintering put down | 3 | 3 |
| a beacon set | 1 | 1 |
| a building, per level | 2 | 24 |
| a pennant left (`21h-pennant`) [F13] | 1 | 1 |

The rung is **a function of the points** (`rungOf(sx,sy)`), derived, never stored; `G.step` does
not exist. Thresholds: 1, 2, 3, 5, 7 · 9, 11, 13, 15, 18 · 21, 24, 27, 30, 34 · 38, 42, 46, 50, 55 ·
60, 65, 70, 75, 81 · 87, 93, 99, 105, 112. Four hard gates on top of the points, because a rung is
named after what stands there: 6 needs a landing, 11 needs a drilled deposit *and* a drone, 16 needs a
building, 21 needs three.

---

## 7. The register of the names — Б+А

Three registers were written out and heard against each other:

- **А · ЭФЕМЕРИДА** — Efremov, the great science: Керн, Спираль, Кольцо. Beautiful, but speaks
  from above; a first probe has no «обитаемый горизонт».
- **Б · МОНТАЖ** — the Strugatskys and a real launch complex: Вымпел, Монтажная площадка,
  Стыковочный узел, Трасса. Dry words used by people doing the work.
- **В · ФРОНТИР** — Заимка, Шурф, Прииск, Барак, Пакгауз. Warm, but it is Siberia, not space. The
  author's verdict: «че то какие то не космические названия».

**Chosen: Б below, А above.** It starts with metal and automatics and ends with a civilisation —
from a pennant to the Ring. Two earthly words are kept on purpose — «Красный уголок» and
«Столовая», and «Дружина» beside them: in a module at the edge of the galaxy they read as home,
and that seam is what Soviet science fiction was made of.

**Three laws of naming, applied throughout** [F13, F33, F37, F39]:

1. **One word, one column.** A rung is a *state of the system*, a building is a *shop*, a material
   is a *thing*. No word appears in two columns, and nothing already in the base's `BUILD` table
   (Реактор, Солнечная панель, Буровая, Склад, Жилой отсек, Плавильня, Площадка, Батарея,
   Лаборатория) is reused on a station.
2. **A rung is named after what now stands in the system** — not after an event, a procedure or a
   document. The one permitted exception is 30, Кольцо: a status, not a place, and named as such.
3. **One grammar per family**: передел — «X-ный цех»; узлы — «X-ный цех» too (a shop is a shop);
   добыча — «X-ный промысел» / «X-ная разработка»; крупное — «X-ный участок»; the offices are two,
   Контора and Диспетчерская; the укладов are adjectives.

---

## 8. The ladder — thirty rungs in six five-year plans

**0 · ПУСТО** — a star and nothing else.

Six starred rungs carry an **effect**; the other twenty-four are **moments** [F16, F30]: one line
on the air when you arrive («Тегра · КЕРН — залежи видны без бурения»), the ring growing on the
map, a different word at the counter — and **no code in any other module**. The word «ступень» is
not used in the interface [F30]: the player sees a five-year plan in Roman numerals and hears the
moments; the number lives in the summary on a second tap.

### I · РАЗВЕДКА — the automatics work

| № | rung | what stands |
|---|---|---|
| 1 | **Отметка** | the system's mark on the map and a line in the summary |
| 2 | **Расчёт** | the orbits computed and filed |
| 3 | **Створ** | flown through under your own power; the star gets its arc |
| 4 | **Вымпел** | a sign left: the system is yours by right of first |
| 5 | **Буй** ★ | an automatic beacon works here: **heard on the air, mail reaches it** (`11ap-relay`, `25k-post-mail`) |

### II · ПРИСУТСТВИЕ — a human arrives

| № | rung | what stands |
|---|---|---|
| 6 | **Полоса** | a landing strip: you have stood on the ground, and the line where straight lines do not occur (§13) |
| 7 | **Керн** | a core sample: deposits show their content without drilling |
| 8 | **Полигон** | the work area laid out |
| 9 | **Шлюз** | first pressure |
| 10 | **Замкнутый цикл** ★ | air and water of its own: **a hire rests here for nothing** (`crewRest` free) |

### III · МОНТАЖ — the metal goes up

| № | rung | what stands |
|---|---|---|
| 11 | **Монтажная площадка** ★ | **the building site opens** — one site |
| 12 | **Жилой модуль** | there are hands |
| 13 | **Хранилище** | a store stands: the share is *shown* on the ДОСКА from here (the ceiling is the Накопитель's, §3.1) |
| 14 | **Обогатитель** | the ore goes through a plant |
| 15 | **Литейный модуль** ★ | **a second site** |

### IV · УЗЕЛ — other people come

| № | rung | what stands |
|---|---|---|
| 16 | **Стыковочный узел** | not only your ships dock here |
| 17 | **Грузовой терминал** | the goods have a place to wait |
| 18 | **Городок** | people live in families |
| 19 | **Причальная ферма** | a barge can stand and load (the Причал building is what loads it) |
| 20 | **Промышленный узел** ★ | **tier 2 buildings and a third site** |

### V · ХОЗЯЙСТВО — the system decides for itself

| № | rung | what stands |
|---|---|---|
| 21 | **Правление** | its own summary |
| 22 | **Стапельная** | a slipway hall: the Стапель building may be laid down |
| 23 | **Кафедра** | a chair of the institute teaches here |
| 24 | **Рубеж** | a pirate focus does not grow here (moment: the ring gets a notch on the map) |
| 25 | **Узел трасс** ★ | **the lines meet; the factor's domain moves in; tier 3** |

### VI · КОЛЬЦО — a civilisation

| № | rung | what stands |
|---|---|---|
| 26 | **Округ** | the district office |
| 27 | **Трасса** | a regular line to a neighbour |
| 28 | **Пояс огней** | the planet's night side lit all the way round |
| 29 | **Полдень** | the system feeds itself: its buildings eat its own output (the only rung where §10.1 is lifted) |
| 30 | **Кольцо** ★ | **they hail you first, by the name you gave the system** |

The twenty-four unstarred rungs may acquire effects later — **one at a time, each with its code
and a test that `rungHas(sx,sy,id)` is read somewhere** [F16]. Not before.

### 8.1 What you are called [F35]

The rung changes how you are addressed at the counter, and the address is **tied to the place**:
«на Тегре вас зовут монтажником».

**никак** → **наблюдатель** (5) → **монтажник** (11) → **начальник участка** (15) →
**начальник узла** (20) → **начальник трассы** (25) → at thirty, **by the word you gave the
system**: «— А, это вы… с „Сардразли“».

«Управляющий» is not in the row: it is a protected word (`12c-mgr-core:303`, one domain — one
manager), and the player does not stand in line with the people he seats. A patronymic is a
feature of its own (the player has no name in the game) and goes to the queue, not the ladder.

---

## 9. The material tree — 48 goods, each with its maker, its eater and a shadow price

Tier n eats tier n−1 as its main input and anything below as a secondary. `ind` is the tier; a
good with `ind` has `price: 0` and is invisible to the market, the drones and the errands. The
shadow price is §5's number. «ест» names the family of eaters; the buildings are in §10.

### Tier 0 — raw (exists)

Лёд 7 · Железо 11 · Кремний 17 · Органика 29 · Титан 38 · Изотопы 55 · Иридий 74 · Кристаллы
105 · Углерод 46 · Ксенобиом 190 · Летучие газы (shadow 30) · Кристаллы льда (shadow 40).
Сплавы and Техкомпоненты, today `rare`, move to tiers 1 and 2 and keep their keys.

### Tier 1 — передел (22) · ×1 quota per shift · intake → output

| key | good | made by | eats → makes | shadow |
|---|---|---|---|---|
| `alloy` | **Сплавы** | Плавильный цех | железо 8 + кремний 4 → 2 | 127 |
| `ferro` | **Ферросплав** | Ферросплавный цех | железо 6 + титан 2 → 2 | 116 |
| `roll` | **Прокат** | Прокатный цех | железо 8 + кремний 2 → 3 | 68 |
| `plate` | **Обшивка** | Обшивочный цех | титан 6 + железо 2 → 2 | 198 |
| `rebar` | **Арматура** | Арматурный цех | железо 10 → 3 | 62 |
| `refr` | **Огнеупор** | Огнеупорный цех | кремний 6 + титан 2 → 2 | 144 |
| `concrete` | **Реголитобетон** | Бетонный цех | кремний 6 + лёд 4 → 4 | 54 |
| `quartz` | **Кварц** | Кварцевый цех | кремний 8 → 2 | 112 |
| `dielec` | **Диэлектрик** | Диэлектрический цех | кремний 4 + органика 4 → 2 | 148 |
| `cable` | **Кабель** | Кабельный цех | железо 4 + иридий 1 + органика 2 → 2 | 142 |
| `resin` | **Смола** | Смоляной цех | органика 8 → 3 | 123 |
| `insul` | **Изолятор** | Изоляторный цех | кремний 4 + органика 2 → 2 | 104 |
| `cfiber` | **Углеволокно** | Углеволоконный цех | углерод 3 + органика 3 → 2 | 179 |
| `graphite` | **Графит** | Графитовый цех | углерод 4 → 2 | 148 |
| `carbide` | **Карбид** | Карбидный цех | углерод 2 + кремний 4 → 2 | 130 |
| `spirit` | **Спирт** | Спиртовой цех | органика 6 + лёд 4 → 4 | 81 |
| `protein` | **Синтебелок** | Белковый цех | органика 8 → 3 | 123 |
| `heavyw` | **Тяжёлая вода** | Изотопный цех | лёд 8 + изотопы 1 → 2 | 93 |
| `oxygen` | **Кислород** | Кислородный цех | лёд 8 → 4 | 26 |
| `hydrazine` | **Гидразин** | Гидразиновый цех | лёд 4 + органика 4 → 2 | 118 |
| `cryo` | **Криоген** | Криогенный цех | летучие газы 4 + лёд 2 → 2 | 110 |
| `thermo` | **Теплозащита** | Теплозащитный цех | кремний 4 + углерод 2 → 2 | 130 |

### Tier 2 — узлы (18)

| key | good | made by | eats → makes | shadow |
|---|---|---|---|---|
| `bearing` | **Подшипник** | Подшипниковый цех | прокат 4 + графит 1 → 2 | 345 |
| `pump` | **Насос** | Насосный цех | прокат 3 + сплавы 2 + изолятор 1 → 2 | 452 |
| `optics` | **Оптика** | Оптический цех | кварц 4 + диэлектрик 1 → 2 | 477 |
| `tube` | **Радиолампа** | Ламповый цех | кварц 2 + кабель 1 + сплавы 1 → 3 | 266 |
| `relay` | **Реле** | Релейный цех | кабель 2 + изолятор 2 + сплавы 1 → 3 | 330 |
| `selsyn` | **Сельсин** | Сельсинный цех | кабель 3 + прокат 1 + сплавы 1 → 2 | 496 |
| `thermoc` | **Термопара** | Термопарный цех | ферросплав 2 + изолятор 1 → 3 | 188 |
| `gyro` | **Гироскоп** | Гироскопный цех | прокат 2 + сплавы 2 + кабель 1 → 1 | 858 |
| `semi` | **Полупроводники** | Полупроводниковый цех | кварц 3 + диэлектрик 2 + графит 1 → 2 | 615 |
| `supercon` | **Сверхпроводник** | Сверхпроводниковый цех | криоген 2 + кабель 2 + карбид 1 → 1 | 1011 |
| `techcomp` | **Техкомпоненты** | Приборный цех | сплавы 2 + кабель 2 + кварц 1 → 2 | 518 |
| `reactorb` | **Реакторный блок** | Реакторный цех | тяжёлая вода 2 + огнеупор 2 + ферросплав 2 → 1 | 1119 |
| `accum` | **Аккумулятор** | Аккумуляторный цех | диэлектрик 2 + кабель 1 + графит 1 → 2 | 470 |
| `regen` | **Регенератор** | Регенераторный цех | кислород 2 + изолятор 1 + сплавы 1 → 2 | 242 |
| `canned` | **Консервы** | Консервный цех | синтебелок 4 + спирт 1 → 4 | 230 |
| `fabric` | **Гермоткань** | Ткацкий цех | углеволокно 2 + смола 2 → 2 | 483 |
| `film` | **Гермоплёнка** | Плёночный цех | смола 3 + диэлектрик 1 → 3 | 278 |
| `phosphor` | **Люминофор** | Люминофорный цех | кварц 2 + изотопы 1 + диэлектрик 1 → 2 | 350 |

The instrument row — радиолампа, реле, сельсин, термопара, гироскоп — feeds what the game
already has: the kit of instruments in the cockpit (`25a-instr`, `05b-instr-kit`). Your own shops
start making the dials in front of your face. Techcomps stop being pirate loot only: the raid
still gives them, and now so does the Приборный цех — a fight speeds up, it does not unlock [F09].

### Tier 3 — крупное (8) · eaten by the site, not by the market

| key | good | made by | eats → makes | shadow |
|---|---|---|---|---|
| `hullsec` | **Секция корпуса** | Стапель | обшивка 4 + арматура 2 + подшипник 1 → 1 | 2092 |
| `mline` | **Станочная линия** | Станочный участок | подшипник 2 + реле 2 + прокат 2 → 1 | 2429 |
| `habblock` | **Жилой блок** | Блочный участок | реголитобетон 4 + гермоплёнка 2 + регенератор 1 → 1 | 1721 |
| `shell` | **Гермооболочка** | Купольный участок | гермоткань 3 + арматура 2 + оптика 1 → 1 | 3275 |
| `mast` | **Мачта** | Мачтовый участок | арматура 3 + кабель 2 + углеволокно 1 → 1 | 1174 |
| `beam` | **Причальная балка** | Балочный участок | прокат 4 + ферросплав 2 + подшипник 1 → 1 | 1474 |
| `launchf` | **Стартовая ферма** | Стартовый участок | огнеупор 3 + арматура 2 + гидразин 2 → 1 | 1388 |
| `panel` | **Фотопанель** | Панельный участок | полупроводники 2 + гермоплёнка 1 + кабель 1 → 1 | 2675 |

Tier 3 is cargo like everything else (a barge hauls it), but nothing *eats* it except
construction: level ×2 of any shop wants a Станочная линия, ×3 two and a Жилой блок; the
non-cargo families (§10, D–H) each want one large thing; a barge hull is four Секции корпуса at a
Стапель (§12). What the site eats shows on the building's card, never in a market row [F15].

Спирт stays out of the cosmic dictionary on purpose: on a frontier it is solvent, antifreeze and
currency at once, and that is the truth of the place.

---

## 10. The buildings — 82 rows, one constant

```
BLD[id] = { ru, note, fam, tier, at, eats, makes, cost, fx, sh }
```

`at` — where it may stand: the station type (`ST_TYPES`) and what the system physically has
(a solid world, a belt, a gas giant, fauna, a worked shaft). `eats`/`makes` — per shift at ×1;
×2 doubles them, ×3 triples. `cost` — what the site eats before the thing stands, **haulable by
hold** for tier 1 [F09]; the build takes **1 / 3 / 5** shifts by tier (2 / 4 / 6 in the 08-31 text;
the measurement of step 5 showed two shifts of assembly plus one of feeding is an hour, and §16.8
asks for forty minutes), and the truss is visible on the station while it grows. `fx` — the one hook the row is wired to; **a row whose `fx` is read
by nobody is not shipped** (test: every `fx` id is read through `bldHas(sx,sy,id)` at least once).
`sh` — the piece it hangs on the station's body, out of the vocabulary of `17a-station-mod`
(§13).

**Cost by level:** ×1 as in the table; **×2** = ×1 again + 1 Станочная линия; **×3** = ×1 twice
+ 2 Станочные линии + 1 Жилой блок. The hopper and the share ceiling scale with the level
(§3.1), the effect of a non-cargo building does not — its level is its silhouette.

### A · Добыча (8) — make M per shift into a stock sold to you at 0.7× [§3.2]

| id | building | at | makes / shift | cost ×1 |
|---|---|---|---|---|
| `regolith` | **Реголитовая разработка** | a solid world with железо in `PROFILE` | железо 12 · кремний 6 | 1 600 кр · сплавы 10 · железо 24 |
| `deepdrill` | **Буровой комплекс** | rocky · metal · volcanic · desert | титан 4 · иридий 1 | 2 400 кр · сплавы 14 · железо 30 |
| `icefield` | **Ледовый промысел** | ice · ocean · terran | лёд 16 | 1 200 кр · сплавы 8 · железо 20 |
| `beltmine` | **Поясной промысел** | a belt in the system | кристаллы 2 · изотопы 3 | 2 800 кр · сплавы 16 · титан 12 |
| `gasfield` | **Газовый промысел** | a gas giant | летучие газы 6 | 2 200 кр · сплавы 12 · титан 8 |
| `greenhouse` | **Оранжерея** | terran · jungle · ocean | органика 10 | 1 400 кр · сплавы 8 · кремний 20 |
| `biostation` | **Биостанция** | fauna in the system | углерод 4 · ксенобиом 1 | 3 000 кр · сплавы 16 · органика 24 |
| `dumpworks` | **Отвальный промысел** | a worked shaft here (`G.mines`) | железо 6 · кремний 4 | 1 000 кр · сплавы 6 · железо 12 |

### B · Передел (22) — tier 1, eats tier 0 [recipes in §9]

Every row: `at` = any station with a site, **not** in a system whose `PROFILE` makes its main
input (§10.1); `cost ×1` = **сплавы 8 · 24 of its main input · credits = ten shifts of the shop's
share at the shadow price less the materials, never under 400** (the measurement of step 5: a flat
1 200 кр paid back in five loops for the Плавильный цех and eleven for the Кислородный — the
credits now follow the share, and every shop pays back in about five loops); `fx` = the share;
`sh` = the family's stack. The twenty-two are the makers of the tier-1 column of §9:
Плавильный · Ферросплавный · Прокатный · Обшивочный · Арматурный · Огнеупорный · Бетонный ·
Кварцевый · Диэлектрический · Кабельный · Смоляной · Изоляторный · Углеволоконный · Графитовый ·
Карбидный · Спиртовой · Белковый · Изотопный · Кислородный · Гидразиновый · Криогенный ·
Теплозащитный **цех**.

### C · Узлы (18) — tier 2, eats tier 1, from rung 20

Every row: `cost ×1` = **сплавы 12 · прокат 6 · 12 of its main input · credits by the share, as
in B**; `fx` = the share. The eighteen are the makers of the tier-2 column: Подшипниковый · Насосный · Оптический ·
Ламповый · Релейный · Сельсинный · Термопарный · Гироскопный · Полупроводниковый ·
Сверхпроводниковый · Приборный · Реакторный · Аккумуляторный · Регенераторный · Консервный ·
Ткацкий · Плёночный · Люминофорный **цех**.

### D · Крупное (8) — tier 3, from rung 25 (the Стапель from 22)

Every row: `cost ×1` = **прокат 12 · арматура 8 · подшипник 2 · credits by the share, as in B**;
`fx` = the share.
The eight makers of the tier-3 column: Стапель · Станочный · Блочный · Купольный · Мачтовый ·
Балочный · Стартовый · Панельный **участок**.

### E · Хозяйство (5)

| id | building | fx (the hook) | cost ×1 |
|---|---|---|---|
| `nakop` | **Накопитель** | both clips of §3.1 ×2 for every building at this station — the *one* ceiling modifier [F07] | 2 000 кр · сплавы 10 · реголитобетон 8 |
| `kontora` | **Контора** | the prices of stations within 4 pc are written to the paper as «со слуха» notes at every docking (`pricesHeard`) | 1 800 кр · сплавы 6 · кабель 4 |
| `kassa` | **Касса** | scrip changes at par here (the `scrip` tab's rate = 1) | 1 200 кр · сплавы 4 · реле 2 |
| `prichal` | **Причал** | your barge loads herself here from your промыслы at this station, at 0.7× (built M295; the moored silhouette waits for step 8) | 3 000 кр · сплавы 8 · причальная балка 1 |
| `dispatch` | **Диспетчерская** | only with the factor seated [F21]: the ether reports your empty hoppers and your uncollected share (ДЕЛО already lists everything, so the office got a voice, not a screen) | 2 600 кр · сплавы 8 · реле 4 · радиолампа 2 |

### F · Флот (4)

| id | building | fx | cost ×1 |
|---|---|---|---|
| `dock` | **Ремонтный док** | `repairCost()` −30% here | 2 400 кр · сплавы 12 · прокат 8 |
| `fuelnode` | **Заправочный узел** | fuel −25% here | 2 000 кр · сплавы 8 · насос 2 |
| `workshop` | **Мастерская** | hull service (`12s-wear`) here as at a yard | 2 200 кр · сплавы 10 · подшипник 2 |
| `hangar` | **Ангар** | drones of this system never break down (`12e`) | 2 800 кр · сплавы 12 · обшивка 6 |

### G · Люди (7)

| id | building | fx | cost ×1 |
|---|---|---|---|
| `guesthouse` | **Дом приезжих** | +2 candidates in the hire list here | 2 000 кр · сплавы 8 · жилой блок 1 |
| `school` | **Учебный пункт** | the good tails of the run table ×1.5 for a hire sent from here (`12b`) | 2 200 кр · сплавы 8 · консервы 4 |
| `medpoint` | **Медпункт** | `crewRest` twice as fast; a ransom −25% | 2 000 кр · сплавы 6 · регенератор 2 |
| `personnel` | **Отдел кадров** | the HQ candidate pool refreshes at every docking here (`12c`) | 1 800 кр · сплавы 6 · радиолампа 2 |
| `artel` | **Артель** | the errand (`12aa`) is always posted here and pays +25% | 2 400 кр · сплавы 10 · консервы 6 |
| `redcorner` | **Красный уголок** | a manager's loyalty does not fall while you are docked here, +1 per visit | 1 600 кр · сплавы 4 · люминофор 2 |
| `canteen` | **Столовая** | benders (`12b`) −50% for hires on runs from here | 1 400 кр · сплавы 4 · консервы 8 |

### H · Оборона (4)

| id | building | fx | cost ×1 |
|---|---|---|---|
| `guns` | **Орудийная батарея** | a blockade (`13b`) of this system lifts by itself within 2 shifts | 3 600 кр · сплавы 16 · огнеупор 6 · реле 2 |
| `lookout` | **Дозор** | pirate foci within 5 pc shown on the map | 1 800 кр · сплавы 6 · оптика 2 |
| `druzhina` | **Дружина** | boarding a base in this sector: one fewer in every room — the дружина holds the approaches (the player boards alone in the code; there are no hands to add) | 2 400 кр · сплавы 8 · гермоткань 4 |
| `barrier` | **Заграждение** | a pirate ambush on approach −50% | 2 800 кр · сплавы 12 · мачта 2 |

### I · Знание и жизнь (6)

| id | building | fx | cost ×1 |
|---|---|---|---|
| `observatory` | **Обсерватория** | skywatch orders (`11ak`) for this system pay ×2; its sky events named a day ahead | 3 200 кр · сплавы 10 · оптика 4 |
| `branch` | **Филиал** | the `lab` tab −15% here (a science station only) | 4 000 кр · сплавы 14 · полупроводники 4 |
| `archive` | **Архив** | the board carries the system's chronicle: every rung it has passed, with its line (the hundred's traces are per landing and server-side, nothing lists them by system) | 1 600 кр · сплавы 4 · гермоплёнка 4 |
| `ownpier` | **Личный причал** | hours of wear come *off* the hull while you stand docked here (docking never added any) | 2 000 кр · сплавы 8 · причальная балка 1 |
| `radiomast` | **Радиомачта** | the system becomes a relay (`11ap`): the ether reaches 1.5× as far | 2 400 кр · сплавы 8 · мачта 1 · кабель 4 |
| `meteo` | **Метеостанция** | the surface weather known before landing | 1 400 кр · сплавы 4 · термопара 4 |

**Struck from the 08-31 list, and why:** Холодильник (a second ceiling, F07) · Сортировочная and
Грузовой двор (show-without-flying and a base-rate knob, F07/F21) · Заводоуправление and the
five offices (the plan is bracketed, F24; two offices remain, F39) · Отстойник (no effect) ·
Городок (a rung and an уклад already, F13) · Стартовая ферма as a building (the material keeps
the word; the shop is the Стартовый участок) · Лаборатория and Оборонная батарея (the base's
`BUILD` has them, F13) · Институт (11ab has the one institute, F39; Филиал) · Пункт связи (=
Радиомачта) · Наблюдательный пост (= Дозор, 11ap's НП) · Биосинтез (= Белковый цех) · Драга,
Стекловарня, Смолокурня, Ткацкая, Отвальное хозяйство, Домостроительный (register В or a
comic word in orbit, F39 — renamed under the family grammar).

### 10.1 The rule that makes it a strategy

**No building eats what its own system makes.** A smelter wants iron, and iron comes off rocky
worlds; a forge wants alloy from the smelter; a slipway wants both. A self-sufficient node
**cannot** be built below rung 29 — something is always missing, and that shortage *is* the route.

Written as a test [F15]: for every system below 29, `(PROFILE ∪ makes of its buildings) ∩ eats of
any building there = ∅`; the site refuses the row with one line: «здесь это и так делают».

### 10.2 A worked example — the first share inside forty minutes [F09]

1. **«Тегра»**, a frontier station over an ice world. You drilled, left a drone, cleared the focus —
   rung 11, the **монтажная площадка** opens.
2. You lay down a **Ледовый промысел**: 1 200 кр, 8 сплавы (the base's Плавильня or the lab made
   them), 20 железо hauled in the hold. Two shifts later it stands; «Тегра» sells you 16 ice a
   shift at 0.7×.
3. Cheap ice has to go somewhere. Two jumps away, at «Сардразль» over a rocky world, you put a
   **Кислородный цех** (1 200 кр · сплавы 8 · лёд 24): it eats 8 ice a shift and pays you oxygen
   in proportion. First drop, first share — about half an hour after rung 11.
4. Oxygen is wanted where a **Регенераторный цех** stands, and that is rung 20 — so for now it is
   the Накопитель at «Тегра» so the leg is not drained, and a Прокатный цех at a third station for
   the tier-1 goods the Станочный участок will one day want. The ring closes, and you made it.
5. A quota fills evenly, a hold empties in one drop. So: the barge (§12).
6. Then a **Приборный цех**: техкомпоненты, which until now came only off a boarded pirate base.
7. Pirates close the system and all of it stops. You build an **Орудийная батарея** and a
   **Дружина**, or you go and fight.

### 10.3 The ПЕРЕПЛАВКА tab goes [fork 2(б), F03]

`SMELT` (`02-world:58`), the `smelt` tab on the industrial station (`26-ui-station:677`) and its
рацпредложение premium are deleted **in the same milestone that ships the Плавильный цех** —
never a day earlier, so alloy always has a source: until then the base's Плавильня, the lab's
premium and the perk; from then, the share. The «сплавы нигде не добываются — только здесь»
comment becomes untrue and goes with it. `G.ratios` keeps loading (old saves) and is read by
nothing.

---

## 11. Уклады — what a system becomes [F37]

The уклад forms by itself out of what stands there, and goes into the news and the rumours in
other people's words — as an **adjective**, never as a station type:

**горная** · **заводская** · **приборная** · **химическая** · **энергетическая** · **судовая** ·
**узловая** · **учёная** · **жилая** · **крепостная**

«Сардразль-то заводская, туда железо возят.»

---

## 12. The barge and the pilot [F05, F06, F26, F36]

The barge already exists (`12l-barge`) — but as the factor's: a route given a body, ephemeral,
`BARGE_CAP=6` in the galaxy. The player's own is assembled from parts already in the game — and it
**feeds, it does not trade**:

- **hull** — any hull of class `hauler` (`SHIPS.hcls`): the «Вьюк» by allocation or bought at a
  yard; later four Секции корпуса at a Стапель (rung 22);
- **pilot** — an ordinary hire with the order kind `barge` (`ORDERS.barge`, logic in
  `12af-barge`): he already has a ship, an order, wear, hidden luck and a history;
- **route** — the one you walked yourself (one loop at least), with at least one of your shops on
  it. «Only between stations with a Причал» waits for family E (step 7).
- **loading** — you load her yourself at the counter: ПОГРУЗИТЬ takes from your hold what the
  shops on her legs eat, up to her hull's capacity; ВЫГРУЗИТЬ gives it back.

Its **only** output is the share: it drops your goods into hoppers on its legs, evenly, once a
shift; it brings no money. The pilot's run is paid as any `haul` — by `CREW_YIELD`, a minus in his
own line — so the law of the hired hand holds: he is a bet, not an income. Under a blockade
(`occLvl ≥ 2`) the barge stops with one line, like the drones. In ДЕЛО the two lines cannot be
confused: «фактор возит на продажу · срез 7%» / «„Тюк“ кормит печь на Сардразли · пай растёт».
Measured in §16: the barge's credits-per-minute never above the factor's domain.

**One barge** [F06]: «груз в попутную» (§18.7 p.2) is struck; the fleet's cargo handover, if it
ever exists, is a reward of Трасса (27) and only along a leg you walked.

The class is «лихтер»; the names, in the row of Вьюк and Тук: **«Тюк»** · **«Куль»** ·
**«Кладь»** · **«Волокуша»** · **«Шаланда»** · **«Плашкоут»** · **«Дощаник»**.

---

## 13. How it is SEEN

A number in the corner is not an answer. A developed system must read **by silhouette**, before
any text. The author: «прям видно должно быть что там строятся станции планеты».

### On the galaxy map [F19, F22, F30]

- **A ring at the star only from Буй (★5)** — «there is someone there» — growing by **six
  segments**, one per five-year plan I–VI; a notch at Рубеж (24); closed at Кольцо. Stars merely
  flown through stay bare, so the map does not grow over with arcs.
- **One colour.** Only the player builds, so there is nothing else to colour: the ring is yours or
  it is not there. The уклад is a word in the footer and the rumours, not a hue — ten categorical
  colours on a phone are noise.
- Beside it, a **column of lights** by the number of buildings. Not a figure — lights.

### In the system — the main thing, and it comes with the first building [F28]

**The station grows a body.** It is drawn procedurally out of parts, and every `BLD` row carries
`sh` — one of about seven family forms from `17a-station-mod`'s vocabulary (rack, drum, pods,
hangar, tank, dish, mast), in three sizes for the three levels; not eighty drawings:

| family | what is seen on the station |
|---|---|
| передел | a stack and a slow flare; ×3 — the smoke drawn off along the orbit |
| узлы | a long shop down the hull, bands of light in its windows |
| Накопитель | rows of containers on the outer deck |
| Стапель | a truss with a hull inside it, growing from visit to visit |
| Орудийная батарея | turrets — still, until `prof()` says they may turn |
| Дом приезжих · Жилой блок | lit windows, and more of them each time |
| Обсерватория | a dish, turned towards its own star |
| Причал | a barge moored |

What does not move is **baked once** into an offscreen keyed by the station's built set, like
`BARGE_ART`; at most **two** moving things per station (the flare, the moored barge); the town's
lights are one `screenLayer`. Turrets that track and tugs that run come after a measurement, not
before.

An empty station is a can in orbit. A system at Округ is a town you see on approach. **No figure
is needed.**

### The planet changes too

A dump beside the shaft as a pale patch on the day side · **the lights on the night side**, and
more of them · a greenhouse dome catching the sun · the Полоса (6): a straight line where straight
lines do not occur.

### On the ground

You walk past what you built: a headframe over the shaft, a dome, cable masts, an antenna. The
game already draws player structures (`21c-built`); they only need tying to the rows.

### On the air and at the counter

At Буй the receiver picks up dispatch traffic — «…третий, приняли двести проката, сдавайте на
четвёртый…»; at ПУСТО, only noise. And at the counter they say it themselves: «— У нас теперь
печь. Год назад тут, кроме ветра, ничего не было».

### The summary fits the footer [F29]

On the map: the name, the Roman numeral, the ring. «построек 7» is the column of lights; «план
закрыт» belongs to the station's board. The rung's name is on the second tap, ПОДРОБНЕЕ. The
footer is ≤ 2 lines on a phone, and `91f-ui` measures it through `MAP_BOX`.

---

## 14. The vocabulary of order — and what was bracketed [F24, F38]

**Наряд** — a one-off errand (already in the game).
**Пай** — your share of the output for what you supplied.
**Сводка** — the line about a system: plan, уклад, buildings.
**Отоварка** — collecting the share.

The **monthly план** of a Заводоуправление is bracketed: it re-introduced a debt («you sign, and
you owe») and paid in a Станочная линия, i.e. in money. If it returns it is a **Наряд-заказ** that
pays what money cannot buy — a line in the notebook, a name on the board, trust — and never a
thing. Not before step 5 is measured.

Every term is first met **in a consequence, in the player's words** [F32]: «ПЕЧЬ ВЗЯЛА 6 ЖЕЛЕЗА —
ЗА ВАМИ ЗАПИСАНЫ СПЛАВЫ», «СИСТЕМА ПЕРЕШЛА В III ПЯТИЛЕТКУ — ОТКРЫЛАСЬ СТРОЙКА». Пай, уклад and
the five-year plan live in the mouths of people and in the notebook, not on buttons.

And the floor under all of it: **you build among someone else's ruins.** The name is introduced
here for the first time — it exists nowhere in the code or the docs yet [F38] — and its home in
the code is the monument texts of `20aa-poi` and the pieces of the report: the **«Долгий волок»**
was unrolling the same thing here and did not finish. A monument in the system gives a bonus to
the building whose drawing is on its slabs — «на плитах записано, как они ставили этот купол».
You are not developing an emptiness; you are finishing what others did not reach, and one day
someone will read your summary the same way.

---

## 15. Where the rest of the game plugs in

- **Слухи** say where a building is wanted, and carry the уклад in other people's words.
- **Новости** stop being random wind: half of them are about what was built. «+0.35 on crystals»
  acquires a cause.
- **Цены** are the raw material of a route (R1), and a note ages.
- **Нужда** (`12aa-need`) is the doorway — the same norm for one visit; a building is that norm
  made permanent, and both are one object (§4).
- **Посёлки** (`12t-settle`, `SETTLE_GIVE=.34`) are the second feeder, and are named as such: a
  settlement's diet is a share in the small, on the ground, and it is left as it is.
- **Блокада** (`13b-occupy`) stops a system eating and making: the economy becomes a weapon against
  you, and a reason to take a sector back.
- **Приборы в рубке** (`25a-instr`) are made by the instrument row of your own industry.

---

## 16. Balance targets — numbers, and what measures them [F11]

All measured by a «холдинг» profile in `tests/91zzw-economy`; nothing past step 3 is accepted
without its printout.

1. **No printing press.** Income per hour before and after a building: **1.5–2×**, never 10×.
2. **The share against plain trade**: **1.3–1.8× per hour**, at the shadow price. Any more and
   trading dies.
3. **Payback** of a ×1 shop: **4–6 loops** of its ring (a loop ≈ two shifts); ×2 twice that, ×3
   four times.
4. **A full chain bottom to top spans at least five stations** — hence `ROUTE_MAX = 6`.
5. **Not compulsory.** The game without buildings stays playable.
6. **No runaway.** One site per station until rung 15, a window, real materials to haul.
7. **Only the player builds.** The factor and other people's barges haul along what exists but
   raise nothing. The world changes where you have been — the same thought as names, the trace and
   the wall.
8. **First share ≤ 40 min after rung 11**, in one system with one building — one shift of
   assembly plus one shift of feeding, measured in `91zzw-holding`.
9. **The barge's credits-per-minute never above the factor's domain.**
10. **Save shape — one map** [F27]:
    `G.hold = {"sx,sy": {ate:{k:[n,shift]}, bld:{id:{lvl,my,t0,got}}, src:{id:{t0,stock}}}}` —
    one `asMap`, one default, one version branch; a barge pilot's `step` in the manager/hire
    whitelist with a save-load test.

---

## 17. Decisions already taken

- **The buyer pays a share of what the route earned you**, not of a theoretical spread.
- **What is built is not for sale.** Knowledge of a road can be sold; your mark on the world cannot.
- **Stale price notes are shown as a widening fork**: «титан 41…58 · записи шесть дней».
- **Only the player builds.**
- **Register Б+А**, settled by the author 2026-08-31; the three naming laws of §7 on top of it.
- **The server is left alone.** Conditions for ever touching `api.php` are in `docs/DEPLOY.md`.
- **Forks 1(б), 2(б), 3(б)** settled by the author 2026-09-02; **fork 4 — later.**

---

## 18. The fleet — bracketed until the measurement of step 5

> **Status (2026-09-02):** the author said «давай потом». What follows is the record of the
> evening of 08-31, kept whole because it will be wanted; **nothing in it is queued** (§19). The
> critique's findings against it stand unanswered on purpose: the class names off real ISS/«Мир»
> modules and the «Полюс» [F23], the price of thirteen drawings [F17], the debt in «заправка под
> расписку» [F24] — those are the fork the author will settle when the ladder exists to reward.

Settled with the author 2026-08-31. The dividing line first, because without it the fleet and the
barges become the same thing:

> **A barge trades. The fleet hauls and serves.**

The factor's barges (`12l-barge`) are private traders with a spread; you haggle with them. The
state fleet does not trade at all: it tows, refuels, treats, teaches, carries the mail and stands
on the line. It cannot be bought for the same reason a scheduled bus cannot.

### 18.1 The department

Not a state — a **directorate**, on the model of Главсевморпуть, which ran ships, ports, polar
stations, aviation and settlements at once. That is exactly what this layer is about.

> **ГЛАВТРАССА** — Главное управление дальних трасс.
> **Главк** — its district office. (The rung is Округ; «Главк» is only the office — F13.)

Where the real ships carried «СССР», these carry **ГЛАВТРАССА**. The author's instruction was
«наш сеттинг, не СССР, но что-то близкое и похожее»: the grammar of the Soviet arms is kept, the
arms themselves are not.

**Герб:** a spanner and a surveyor's staff crossed — to make and to measure — inside a ring, a
star above them. Three colours: red, white, black. It stencils onto a hull and reads at twenty
pixels. The ring is the Кольцо of rung 30: the arms are a promise.

### 18.2 The marks have a grammar (§9 of the craft codex)

- **frame** — a circle, one stroke weight for every mark;
- **figure** — one primitive from a closed alphabet, centred, occupying 0.62 of the circle:
  рожок (почта) · крест (медицина) · якорь с цепью (буксир) · звезда и циркуль (наука) ·
  щит (сторож) · раскрытая ладонь (спасение) · капля (топливо) · кайло (руда) ·
  раскрытая книга (учебное) · кольцо с четырьмя лучами (плавбаза);
- **operations** — rotation by 0°, 45°, 90° and reflection, nothing else;
- **one solid** — every mark has exactly one filled element, and it is the thing that names it.

### 18.3 The classes and their donors

| class | donor | what is seen |
|---|---|---|
| **Почтовик** | «Союз» | sphere, bell, instrument cylinder, two panel wings, docking probe |
| **Рефрижератор** | «Прогресс» | the same nose and a long ribbed refrigerated bay |
| **Танкер** | «Протон» | fat body, six strap-on tanks around it, a ring of fill necks |
| **Буксир** | ядерный буксир | a spine: reactor forward on a boom, two huge flat radiators as wings, a bell aft |
| **Рудовоз** | «Энергия» | a barrel with four containers strapped along it — the packet, loaded |
| **Лихтеровоз** | «семёрка» | the Korolev cross assembled out of four other people's barges |
| **Паром** | «Буран» | delta wing, black belly, white back. Carries people down from orbit — and stands on the strip at a settlement |
| **Сторожевик** | «Спираль» + «Алмаз» | lifting body with an upturned nose, short wings, a cannon under the cheek |
| **Спасатель** | «Луна-9» | a sphere that opens on four petals — a flower airlock for taking people aboard |
| **Госпитальное** | ТКС | a large body with a returnable capsule on the nose |
| **Учебное** | «Восток» ×6 | a cluster of spherical capsules on a common truss, each with its own hatch |
| **Экспедиционное** | «Салют» | cylinder, a truss of dishes, probes on outriggers |
| **Плавбаза** | «Мир» | cylinders of unequal diameter, a node module, panels at odd angles |

The wing went to the ferry and not to the patrol on purpose: a wing belongs to whoever lands.

### 18.4 The places — names undecided (fork 4)

A truss station of the lines at rung 25; your own station growing by modules; a black blind
derelict in the far sectors. The 08-31 names (Заря, Звезда, Причал, Поиск, Рассвет, Наука,
Кристалл, Спектр, Квант; «МКС»; «Полюс») are real ISS and «Мир» names and read as pastiche next
to Сардразль and Тук [F23]; the silhouettes are the donors, the words will be ours — Короб, Кубрик,
Воротник (`03b-hull-paint` already calls the node that), Тамбур, Погреб — or the buildings' own
names from §10. The node station by call-sign («УЗ-1», after `11an-qsl`); the derelict without a
name at all: a black hull, which is its voice. To be settled with the author.

### 18.5 Paint, lettering, wear

Grey-white hull, a **red band** the full length, black numerals a third of the hull high, burnt
copper at the nozzles. The name large along the body; below it, small: department, number, line.

```
«ЗАРНИЦА»
ГЛАВТРАССА · Л-1425 · ТРАССА 4
```

Wear is compulsory: patches in the wrong shade · soot fanned back from the manoeuvring jets · the
band burnt to pink on the sunward side · the outline of a knocked-off mark nobody painted over ·
a number over a number in a different typeface.

### 18.6 Held against the craft codex

Checked before anything is drawn: §1 layer order (санкирь → greys → glazes → wear → движки, wear
*under* the highlights) · §12 the dead layer · §3 emptiness is not a defect, one ship in the frame
· §5 four materials, four treatments · §8 one joint at every scale · §13 contour first · §14 a trace
on the map must be steerable · §15 day-for-night · §16 the zone system, white in VII–VIII, the
ferry's belly in II–III.

### 18.7 Twelve ways to interact — none of them a shop

1. **Позывной** — you hail them and they answer in the voice of their class.
2. ~~Груз в попутную~~ — struck [F06]; if ever, a reward of Трасса (27).
3. **Заправка** — a tanker fills you in the void: for money, for a service remembered by `12k-rep`,
   or «по норме» — a volume for nothing once in N shifts, **no book of debt** [F24].
4. **Буксир** — a hull that will not make it is towed to a yard.
5. **Почта** — hand your postcards to the mail ship; it brings yours.
6. **Караван** — fly in formation and pirates leave you alone. Slow.
7. **Плавбаза** — a walking station, only while it is in your system.
8. **Госпитальное** — heals twice as fast, ransoms cheaper, takes away the evacuated.
9. **Учебное** — takes your hire for a run and returns him grown.
10. **Сторожевик** — with a good reputation it escorts you; with a bad one it inspects your hold.
11. **Спасатель** — answers someone else's distress and asks you along.
12. **Заявка** — the errand in reverse: the fleet lends a hull for one run, you lead it. Not a
    right, not a purchase [F24].

### 18.8 The fleet as the visible reward of the ladder

Буй (5) — a mail ship passes · Стыковочный узел (16) — transports call · Причальная ферма (19) —
a плавбаза puts in · Правление (21) — a заявка · Узел трасс (25) — the node station · Трасса
(27) — a scheduled line with a number · Кольцо (30) — they hail you first.

### 18.9 Drawing order and cost

Each class is its own drawing; the paint pass is one for all. Order by whom the player meets
first: почтовик → танкер → буксир → сторожевик → плавбаза → паром → спасатель → рудовоз →
госпитальное → учебное → экспедиционное → рефрижератор → лихтеровоз, then the node station and
the derelict. Estimate [F17]: one class plus the paint pipeline 2–3 sessions, each next 1–1.5, the
interactions 6–10. Movement, when it comes, as `spawnBarges`: position = f(line, seed, `Date.now()`),
only consequences stored.

---

## 19. Order of work — the rebuilt plan, with the forks settled

Each step ships on its own and is playable on its own. The core that proves the loop
«возишь → берёт → построил → пай → вернулся» is steps 1–3; everything after is only by the
printout of step 5. Modules: **`12ab-hold`** (BLD, appetite, hopper, share), **`12ac-ladder`**
(rungs, points, addresses), **`17e-station-body`** (the silhouette); the barge order in `12a`,
its logic in `12ab`.

**0. Paper — done in this revision.** One clock (§0); one sentence on feeding (§3, fork 1б); the
tables with numbers (§4, §9, §10; fork 3б); one map (§16.10); the naming pass (§7–§11); the
ПЕРЕПЛАВКА verdict (§10.3, fork 2б); the fleet bracketed (§18; fork 4 later).

**1. The route as an order** — R1…R5; КУРС and В МАРШРУТ as two verbs; a leg carries its own
note and fork; `ROUTE_MAX = 6`; heard notes do not found a leg; `earned` and `soldSets` in
`G.trade`; the road not bought twice. `91u-route` grows with it.

**2. «БЕРЁТ»** — the station's appetite by type (§4) and one norm object; `HOLD_SHIFT` and the
lazy catch-up; the surcharge as an addend; buying pushes pressure up; the ДОСКА line and the
honest «выгодно первые 6». «Цены растут» happens in the first hour. The «холдинг» profile in
`91zzw`.

**3. The site, the hopper and all the cargo families** — rung 11 computed from the counters
(§6); `BLD` with families A–D whole (56 rows: they are data on one mechanism, and shipping 56
costs what shipping 8 would); tier gates by rung; `RES` gets the 46 industrial keys with `ind`;
the hold row names the nearest eater; the body's `sh` with the first building (§13); the share and
the stock as rows in ДЕЛО — **no new screen** (`91f-ui` keeps six sections); **`SMELT` and the
smelt tab deleted here** (§10.3). Target: the first share ≤ 40 min after rung 11.

**4. The ladder visible** — `RUNGS` with `fx` at ★ only and the addresses; the ring from ★5 by
five-year plans; the moments on the air; the footer ≤ 2 lines; the address tied to the place.

**5. Measure.** `91zzw` «холдинг» against §16 with numbers: payback, share against trade, time to
first share, income before/after. Nothing below ships without this printout.

**6. Your own barge** — feeds, does not trade; the pilot by `CREW_YIELD`; the hull by allocation
at a yard; `ORDERS.barge`; a sold road spawns a barge on its legs (§2 R4). One barge.

**7. The non-cargo families E–I** — 26 rows, each with its hook and a `bldHas` test; the
instrument row first (it already has a consumer); the Стапель and tier 3 (rung 22/25).

**8. The station's body — the codex pass** over what step 3 made visible; the planet; the ground.

**9. КУРС, rumours, news** — the route and a rumour as one thing on the map; news with a cause;
the Наряд-заказ if the printout of step 5 asks for it.

**Bracketed:** §18 (the author: later) · the monthly plan and the offices [F24] · contraband,
refuelling on a receipt, the заявка as a right [F24] · rivals' rings and the ten colours [F19,
F22] · rungs that multiply drones or ore [F12] · the twenty-four unstarred effects [F16].
