# The holding — routes, demand, development, buildings

Design, 2026-08-31, ordered by the author across one long evening. Nothing here is built yet:
this file exists so the reasoning survives the session that produced it. Written in English
like the rest of `docs/`; the in-game names stay Russian because they are game text.

The author's own words, in order, because they are the brief:

> «В маршрут на карте тоже непонятно зачем он сделан.»
> «маршруты нафига, вот тебе показывают что возить, а как возить то, ты же купить не можешь…
> продавать непонятно, можно бесконечно по карте тыкать и продавать маршруты.»
> «кнопка в маршрут это как будто ты уже летишь туда.»
> «хочу чтобы можно было собрать баржу, нанять туда пилота и сделать какой нить ебический
> маршрут… чтобы там цены росли а не только падали, типо ты такой отвозил кому то что то,
> там цена на это упала, и там че то построилось, а потом отвез в другую систему другой
> материал… чтобы станций много зацепить можно было.»
> «надо еще как то показывать мож уровень станции или системы… завод х3 и че дает там в
> процентах… давай дохерище построек придумаем, и станции и системы сами развиваются от того
> что ты там делаешь, не только от того что ты возишь товары.»

---

## 1. What is actually in the code today

Two findings, both measured, both the root of what the author felt.

### 1.1 Every price move the player can make points down

All eight writers of `pressure`, which is the only term that bends a station's price
(`marketFor` applies `clamp(1 + pressure, .4, 1.8)`):

| who | move | clamp |
|---|---|---|
| the player sells (`12-economy:34,40`) | −0.005 per unit | `[-0.35, **0**]` |
| the factor's barge delivers (`12c-mgr-core:646`) | −0.004 per volume | `[-0.35, **0**]` |
| a route is sold (`12r-route:134`) | −0.14 | `[-0.35, **0**]` |
| **news** (`12p-news:98,106`) | **+0.35…+0.65** | `[-0.6, +0.8]` |

Everything the player does is capped at zero from above. The only thing that lifts a price is a
random news event. The world can get poorer from the player and never richer. That is the whole
of «цены только падают», and it is one clamp.

### 1.2 A route can be sold without ever being flown

`routeSell()` (`12r-route:128`) asks for two things: `legs.length >= 2` and `routeValue() > 0`.

- `routeValue()` = `(loop gross − fuel) × 3.2 × 0.82^loops`, and `loops` is reset to `0` by the
  sale itself.
- `routeLegs()` prices every leg through `marketFor(getSystem(sx,sy))` — **for any station,
  visited or not**. The map shows stations before you go there, so the prices of a station you
  have never seen are already in hand.
- The only cost is −0.14 pressure at the delivery stations, capped at −0.35, and only at the pair
  you just sold.

So: tap two unseen stations on the map → ПРОДАТЬ → collect money for knowledge you do not have →
tap two others → repeat. Without leaving the map. This is not a number to tune, it is a mechanic
to replace.

### 1.3 And the button lies about the first leg

`drawRouteMap` returns immediately when `legs.length < 2` (`12r-route:161`), and `routeLine()` is
only drawn from two legs as well. After marking the **first** station the map changes by nothing
at all — a two-second flash and an identical screen. That is «непонятно зачем он сделан», and it
is three lines of code.

---

## 2. The route becomes an order, not a calculator

A route today computes and displays. It should be **the paper you walk**, worth money because you
walked it. Its life has three parts — *found it yourself → walked it yourself → handed it on* —
and today only the third exists and can be entered directly.

**R1. A leg can only be a station whose prices you have seen with your own eyes.**
`G.seenPrices` already exists, is already written on docking and already remembers the day
(`12aa-need`). The route shows **your note with its date**, not a live price: «титан 41 · видел 6
дней назад». This closes 1.2, gives the ЦЕНЫ page a reason to exist, and turns a stale note into
a risk rather than a bug. The map button at an unvisited station says so: «цен этой станции вы не
видели».

**R2. «В МАРШРУТ» means «I am going there».**
Marked stars carry a number (1, 2, 3); the next one in the ring is lit. The footer says
«СЛЕДУЮЩЕЕ ПЛЕЧО · «Сардразль» · 2 прыжка · везём титан». When that system is the selected one,
the jump button is named «ПРЫЖОК ПО МАРШРУТУ». All of it visible **from the first leg**.

**R3. The station knows about the route.** The missing half, and the answer to «а как возить-то».
First row of ТОРГОВЛЯ:

> **ПО МАРШРУТУ · взять титан ×18** — 738 кр · трюм 18/32 → `[ВЗЯТЬ]`

and at the selling end:

> **ПО МАРШРУТУ · сдать титан ×18** — 1 728 кр · +990 за плечо → `[СДАТЬ]`

One button instead of "scroll the market, find titan, press buy eighteen times". It tells the
truth when it cannot: «денег хватит на 11 из 18», «трюм возьмёт 12».

**R4. Only a walked route can be sold**, for a share of what it earned **you** — not of a
theoretical spread. Zero loops, zero price, and the button says why: «продавать нечего: вы по нему
не ходили». One loop pays about half of what that loop gave you; it grows to about a loop and a
half and stops. And the pair remembers: the same two stations will not buy the same route twice.

**R5. Handing it to the factor stays the other ending.** `routeToFactor` already exists and is the
real prize: you found the spread with your eyes, walked it with your hands, and now it earns while
you fly elsewhere. Selling is for money now, handing on is for a holding. Both close a route, and
both now require it to have been real.

---

## 3. Demand instead of a pit

Lift the ceiling at zero, but not into a well. A place that **eats** something pays more for it —
**up to what it eats in a day**, and no further:

- the first N units a day at +X%;
- the (N+1)-th and everything after at the normal price, and then down as now.

This is the single rule that keeps the whole layer from being a money printer: income becomes a
**rate per hour**, not a jackpot, and a big hold cannot drain it in one call. It is also the
reason a barge is needed later — a quota is emptied evenly, not in one drop.

---

## 4. Two ladders

**A station grows by buildings.** Each has a level ×1…×3 — the author's own «завод х3».
**A system grows by development** — 0…4 — and it is fed by *everything* the player does there,
not only by cargo.

### 4.1 Development of a system

Contributions, all of which the game already counts separately: a drilled deposit and a worked
mine shaft, a drone that finished its point, a cell of a built base, a sector taken back from
pirates and a pirate base boarded, a monument examined and a node taken, a name given to the
system, cargo delivered to its station (by volume), a settlement that grew, a home or a wintering
put down, a beacon set.

| level | name | what it gives |
|---|---|---|
| 0 | **пустая** | as now |
| 1 | **обжитая** | a ring at the star on the map · fuel −5% · hires work here for −10% |
| 2 | **узловая** | the **стройплощадка** opens — without development 2 nothing can be built · barges call more often |
| 3 | **округ** | a need closes at double · a pirate focus grows a quarter slower |
| 4 | **столица округа** | the spread settles half as fast · the factor's domain moves here |

This is the answer to «не только от того что ты возишь»: hauling is how you build, but the right
to build is earned by *living* in a system.

---

## 5. The catalogue — thirty-five buildings

Every building eats a **daily quota**, never a stock. Levels ×1/×2/×3 scale the quota and the
effect. Where a building can stand is decided by the station type (`ST_TYPES`, `06-galaxy:8`) and
by what the system physically has (a solid world, a belt, a gas giant, fauna).

Goods, for reference (`02-world:2`): лёд 7 · железо 11 · кремний 17 · органика 29 · титан 38 ·
изотопы 55 · иридий 74 · кристаллы 105 · углерод 46 · ксенобиом 190. Not tradeable and today only
obtainable one way each: **летучие газы** (scooping by hand), **кристаллы льда** (cutting in a
belt), **техкомпоненты** (boarding a pirate base), **сплавы** (paid smelting). Making those
producible is the strongest single reason to build anything.

### Добыча — makes raw material out of the system itself

| building | where | eats → makes | effect |
|---|---|---|---|
| **Рудничный подъём** | аванпост, комбинат | — → железо, кремний by world profile | its own ore −30% to buy here |
| **Буровая вышка** | a solid world in the system | — → титан, изотопы | ×3 makes double |
| **Ледовый карьер** | an ice world in the system | — → лёд | fuel −12% |
| **Оранжерея** | any | лёд → органика | feeds a settlement, grows development |
| **Ловчая ферма** | fauna in the system | органика → углерод, rarely ксенобиом | the only ксено without walking |
| **Газосборник** | a gas giant in the system | — → летучие газы | otherwise only the scoop, by hand |
| **Дражный ковш** | a belt in the system | — → кристаллы льда | otherwise only the cutter |

### Передел — eats the cheap, makes what cannot be bought

| building | eats → makes | effect |
|---|---|---|
| **Плавильня** | железо + кремний → **сплавы** | железо bought here at +35% up to the quota |
| **Кузня деталей** | сплавы + кремний → **техкомпоненты** | the second source in the game besides boarding |
| **Изотопная колонна** | изотопы + лёд → fuel | fuel −25% here, and cheaper for neighbours |
| **Кристаллорезка** | кристаллы → parts | +1 class to the yard's stock |
| **Химкомбинат** | органика + углерод → **ракеты** | otherwise only the lab, one at a time |

### Торговля

| building | effect |
|---|---|
| **Склад ×1/2/3** | your selling presses the price 40 / 60 / 80% less — a leg lives longer |
| **Биржа** | prices of stations within 5 / 10 / 15 sectors, without flying |
| **Ряды** (блошинец) | +1 lot and +1 class of lots at the flea market |
| **Меняльная контора** | scrip is accepted in neighbouring systems |
| **Причал барж** | your barge loads without you · +1 leg for the factor |

### Флот

| building | effect |
|---|---|
| **Ремонтный док** | repair −40% and twice as fast |
| **Топливная колонка** | fuel −18% |
| **Стапель** | сплавы + техкомпоненты → hulls. **The barge is built here** |
| **Дроновая мастерская** | drones repair twice as fast and cost −25% |
| **Ангар** | +1 free hull parked here — a hire has something to sit in |

### Люди

| building | effect |
|---|---|
| **Кантина-долгожитель** | the roster of hires turns over twice as often, at higher experience |
| **Учебка** | a hire grows twice as fast; **a barge pilot is trained here** |
| **Лазарет** | captivity and a bender end twice as fast |
| **Контора найма** | hiring −20%, managers call more often |

### Оборона — the economy becomes a reason to fight

| building | effect |
|---|---|
| **Батарея** | a pirate focus in the system grows half as fast |
| **Дозорная сеть** | a blockade is announced a day ahead instead of on arrival |
| **Ополчение** | the system fights back on its own — a chance to lift a blockade without you |

### Знание

| building | effect |
|---|---|
| **Обсерватория** | makes data a day · opens neighbours' prices and coordinates |
| **Лаборатория** | tech −20% · recipes of its own |
| **Архив** | pieces of the «Долгий ход» report arrive by themselves |

### Жизнь

| building | effect |
|---|---|
| **Посёлок** | grows by itself on organics and water · gives people and a name to the place |
| **Причал дома** | the home can be put down in this system |
| **Радиомачта** | the system is heard further on the air · your rumours travel by themselves |

---

## 6. The rule that makes it a strategy

**No building eats what its own system makes.** A smelter wants silicon, and silicon comes off
rocky worlds; a forge wants alloy from the smelter; a slipway wants both. A self-sufficient node
**cannot** be built — something is always missing, and that shortage *is* the route.

A worked example, end to end:

1. **«Тегра»**, a frontier outpost. You drilled there, left a drone, cleared the focus —
   development 2, the стройплощадка opens.
2. You lay down a **рудничный подъём**: 60 техкомпонентов, 30 сплавов. You haul it. It stands up,
   and «Тегра» makes iron 30% under the market.
3. Cheap iron has to go somewhere. Three sectors away is a **комбинат**; you put a **плавильня**
   there, it eats iron (+35% up to the quota) and makes alloy.
4. The alloy is wanted back at «Тегра» — and a **склад ×2** so the leg is not drained. The ring
   closes, and you made it yourself.
5. A quota is emptied evenly, a hold is emptied in one drop. So you need a **стапель** for a
   **баржа** and an **учебка** for its pilot.
6. Then a **кузня деталей**: техкомпоненты, which until now came only off a boarded pirate base.
   Now you make the material everything else is built from.
7. Pirates close the system and all of it stops. You build a **батарея** and **ополчение**, or you
   go and fight.

---

## 7. The barge and the pilot

The barge already exists (`12l-barge`) — but as the factor's: a route given a body, ephemeral,
regenerated from a seed, `BARGE_CAP=6` in the galaxy. The player's own is assembled from parts
that are already in the game:

- **hull** — at a **стапель** (or on your own base), for alloy and techcomp, not in one visit;
- **pilot** — an ordinary hire with a new order kind `barge`: he already has a ship, an order,
  runs, wear, hidden luck and a history of his own;
- **route** — the one you walked yourself.

It takes ten times your hold, moves slowly, trades without docking, empties a quota evenly, and is
a target for pirates — which already works, and a blockade stops it along with the building.

---

## 8. How all of it is shown

The author asked for this explicitly: «хочется просто описание где нить завод х3 и че дает там в
процентах».

- **On the galaxy map:** a thin ring at a developed system and the count of its buildings. Your
  holding is legible across a whole sector at a glance.
- **On arrival:** in the top summary — `НЕЙЭЛЬ · ОСВОЕНИЕ 2 · УЗЛОВАЯ · ПОСТРОЕК 4`.
- **On the station — a ХОЗЯЙСТВО section**, a shelf of buildings:

```
ХОЗЯЙСТВО «САРДРАЗЛЬ»  ·  ОСВОЕНИЕ 3 · ОКРУГ

ПЛАВИЛЬНЯ ×2       ест 6 железа + 2 кремния в сутки · родит 2 сплава
                   железо здесь берут +35% на первые 6 в сутки
                   ×3: 40 сплавов, 20 техкомпонентов        [РАСШИРИТЬ]

СКЛАД ×1           ваша продажа давит цену на 40% слабее
                   ×2: 25 сплавов, 10 техкомпонентов        [РАСШИРИТЬ]

РЕМОНТНЫЙ ДОК ×3   ремонт −40%, вдвое быстрее · предел

СТРОЙПЛОЩАДКА      свободна                                 [ЗАЛОЖИТЬ ▾]
```

- **A building's card** on a tap: what it eats, what it makes, what it gives in per cent, what the
  next level needs, and how much is still to be hauled.
- **Building itself:** one стройплощадка per station, occupied one at a time. You lay it down, the
  materials list appears, you haul them yourself or by barge, the counter fills. Missing the window
  does not destroy the site — it simply stands.

---

## 9. Where the rest of the game plugs in

- **Слухи** say where a building is wanted: «на границе поднимут рудник, если кто довезёт сплав».
- **Новости** stop being random wind: half of them are about what was built, yours or someone
  else's. «+0.35 on crystals» acquires a cause.
- **Цены** are the raw material of a route (R1), and a note ages.
- **Нужда** (`12aa-need`: `NEED_WIN=15` days, `NEED_P=.3`, ×2 for one delivery) is the doorway —
  the same idea for one visit; a building is the same need made permanent.
- **Скрип** and **поселения** already grow; now they have something to grow from.
- **Блокада** (`13b-occupy`) stops a system's eating and making: the economy becomes a weapon
  against you, and a reason to take a sector back.

---

## 10. Balance targets, and what to measure

1. **No printing press.** Demand is a daily quota, never a stock. Measure income per hour before
   and after a building: the fork must be 1.5–2×, not 10×.
2. **Payback.** The materials must cost more than the one-off gain: you build for a future leg,
   not for a bonus. Target payback 4–6 loops.
3. **Not compulsory.** The game without buildings must stay playable. This is a layer for whoever
   wants to play economics, not a new story line.
4. **No runaway.** One site per station, a window, real materials to haul. A sector cannot become
   a combine in an hour.
5. **Only the player builds.** The factor and other people's barges haul along what exists but
   raise nothing. The world changes where you have been — the same thought as names, the trace and
   the wall.
6. **Save shape.** `G.built = {"sx,sy": {plav:2, sklad:1}}` and `G.grown = {"sx,sy": n}` — sparse
   maps, pennies. Safe since M287 (`asMap`).

---

## 11. Decisions already taken

- **The buyer pays a share of what the route earned you**, not of a theoretical spread. Zero loops,
  zero price.
- **What is built is not for sale.** Knowledge of a road can be sold; your mark on the world cannot.
- **Stale price notes are shown as a fork** that widens with age: «титан 41…58 · записи шесть
  дней». Freshness becomes a value in itself.
- **Only the player builds** (see 10.5).
- **The server is left alone.** The cloud will keep turning `{}` into `[]`; the client is proof
  against it since M287, and `api.php` holds live accounts with no staging. Conditions for ever
  touching it are in `docs/DEPLOY.md`.

---

## 12. Order of work

Each step ships on its own and is playable on its own.

1. **The route as an order** — R1…R5. The foundation; nothing else stands without it.
2. **Demand upward** — lift the clamp at zero, introduce the daily quota. This alone delivers
   «цены растут» and can go out by itself.
3. **System development** — the 0–4 scale and its display on the map and in the summary. No
   buildings yet: just seeing where you have lived.
4. **The site and the first seven buildings** — добыча and передел. This is already a full loop.
5. **The player's barge and its pilot** — стапель, учебка, причал.
6. **The remaining families** — торговля, флот, люди, оборона, знание, жизнь.
7. **КУРС** — the route and a rumour as one thing on the map, and news with a cause.
