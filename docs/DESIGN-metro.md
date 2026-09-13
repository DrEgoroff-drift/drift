# The metro and the mainline — a railway that wraps the galaxy (2026-09-14, third draft)

The author, 14.09.2026, three times the same day. First: «хочу врата, туннели… метро своё
галактическое, выйти на 3-й станции». Then: «станции можно не делать… абстрактно, карта куда вам…
за секунды». Then, which this draft follows: **«это прям станция — стыкуешься, покупаешь колу,
сидишь, быстро; да, 6 секунд, но можно долго, как в реальном метро, до минуты. Если есть топливо
— херачишь, но так далеко за 1-2-3 прыжка не сделать, легче на метро сесть. В системах как
посадочная полоса — круглые врата: подлетаешь, тебя спрашивают «стыковка?», медленно ровняешь
курс и на гипердрайве уезжаешь. Потом другой интерфейс: карту показывают, можно раньше выйти,
летим с остановками, как поезд в метро, на пару секунд. Карта звёздного неба. Эта штука должна
опутывать галактику, процедурно, чтобы прям в жопу улететь можно было. Как линии метро в Москве
или как поезда по стране»**. Nothing is built. Companions: `DESIGN-life.md` (the approach),
`DESIGN-borders.md`, `DESIGN-resources.md` (why go far — the rim pays).

## 0. Research, kept short

Freelancer's lanes (a ride you enter at a ring), X4's highways (big hulls may not enter), EVE's
gates as the political map, Mass Effect's relays, Bebop's toll and announcement, Stellaris'
ordinary lanes plus an express, the Moscow Metro (the scheme, the ring and radials, the жетон, «Следующая
станция…», «Поезд дальше не идёт») and the country's railway (the электричка that stops
everywhere, the скорый that stops at junctions, the полустанок with one lamp). **The gap nobody
fills:** a line with stops you may leave at. That is ours.

## 1. Laws

1. **Jumps are for near, the rails are for far.** A jump reaches 3–7 sectors (`stat().jump`) for
   9 + 13·d fuel. The rim is 40 sectors out: ten jumps and three refuellings. The rails make it one
   ride of under a minute — and they only go where there is a station.
2. **A real station in the system, and a real gate.** You dock, you buy a drink, you wait a little,
   you go. Nothing is a menu that pretends to be a place.
3. **The ride is the star map.** While you travel, the interface is the galaxy with your train on
   its line, the stops ticking, ВЫЙТИ at every stop.
4. **Seconds to a minute, as in a real metro.** A hop is ~6 s; across the galaxy ≤ 60 s. Never a
   loading screen, never a wait you cannot leave.
5. **It wraps the whole galaxy, by procedure.** Dense in the heart, sparse at the rim, and it goes
   on past the rim for as far as anyone flies.
6. **Only the player builds** (the standing decision): the network exists by seed; the player's
   holding may add a station, nothing else does.
7. **Nothing derived persists.** Lines and stations come from the seed; the save keeps tokens,
   tickets, a ride in progress and holding-built stations.

## 2. The network — Moscow in the heart, the country's railway beyond

Two services on one track net:

| service | where | stops | interval | fare |
|---|---|---|---|---|
| **МЕТРО** | inside the settled circle (r ≤ 12) | every 1.5–2.5 sectors | a train every ~10 s | **жетон**, 5 кр flat, for forty years |
| **ЭЛЕКТРИЧКА** | the mainline, all stops | every 4–8 sectors | every 30–90 s, rarer outward | **билет** by distance, 2 кр/sector |
| **СКОРЫЙ** | the mainline, junctions only | junctions (узловые) | every 1–3 min, rarer outward | ×2 the электричка; half the ride time |

**The procedure (lazy, deterministic, infinite):**
- **Radials.** Six from the core, one per power, at the angles of their home clusters. A radial
  **forks** outward whenever the gap between it and its neighbour exceeds a spacing that grows with
  r — a river network turned inside out — so the density of lines stays even as the circle widens:
  6 radials at r=6, ~12 at r=15, ~24 at r=35, and so on without end.
- **Rings.** The **Кольцевая** at Ялта's radius (r≈6; Ялта is its great interchange, «Площадь
  Шести Держав»); the **Большое кольцо** at r≈18; the **Дальнее кольцо** at r≈35; further rings
  every ×1.9 of radius. A ring's stations are its crossings with the radials.
- **Arms.** Along each of the galaxy's two arms (`galaxyAt`, M447) runs a spiral **трасса** —
  the country's great line, crossing rings and radials alike.
- **Stations.** On each line, at every spacing step, the nearest system *with a station* within a
  tolerance becomes a stop; a step with none is skipped (a long run with no stop is a feature — the
  «перегон»). Stations where lines cross are **junctions**.
- **Past the rim** (r > 40): the lines go on as single tracks with **полустанки** — one lamp, a
  bench, a train every few minutes. The last station of every line that anyone has reached is
  called **«Край»** on the scheme until someone rides further.
- Computed per region on demand (a cell of the plane → the line segments and stations in it);
  one Node suite for determinism, reachability and «no two stops in one system».

**Names.** Inside a power's land a line and its stops follow the owner's naming rule (birchpunk
Д5: «Горловина Каунти», «Бецирк Нейэль № 4»…); lines carry numbers and the arm's or region's name
(M449): «Линия 7, Рукав Лебедя». Beyond the powers, the old railway names: «разъезд 214-й
сектор», «полустанок Сухой», «платформа Дальняя».

## 3. The station in the system

A stop is a system object of its own at the end of the approach (life §2), past the ordinary
station:

- **The gate** — a round ring lying like a runway threshold, a line of lights leading into it (the
  glide path), lit chasing inward (motion, not blinking); the line's number on a plate.
- **The vestibule** — a small block beside the ring where ships moor (one drawing, six finishes by
  the owner, as the post in borders §3; at the rim a bare platform with one lamp).

**Docking — the runway.** Within ~300 of the ring the hail comes: «Станция «Нейэль». Стыковка?»
— ДА on the pad. Then the only piloting in the whole thing: **align slowly** — the glide path draws
a cone of lights and a speed mark; hold speed under the mark and the nose inside the cone for two
seconds (assisted: the helm damps the turn, as `ap` does; a wide cone on a phone). Too fast —
«Сбросьте скорость», the approach restarts, no penalty. On «ПРИНЯТО» the ship slides into its berth.

**The vestibule screen** (DOM, one page, the station screens' paper):
- **ТАБЛО** — the next trains: «ЭЛЕКТРИЧКА до «Край» · через 0:14», «СКОРЫЙ · через 1:40»,
  «МЕТРО · прибывает».
- **КУДА ВАМ** — the scheme / star map to pick a stop (§4); the pad says «ДО «НЕЙЭЛЬ» · 3 ОСТАНОВКИ ·
  5 кр» or «ДО «СУХОЙ» · 11 ОСТАНОВОК · 38 кр + багаж 12 кр».
- **КАССА** — жетоны, билеты, the baggage by ton, «крупногабаритный» ×3.
- **БУФЕТ** — a drink and a bite by the owner: ГЛАВТРАССА «лимонад «Звёздный»», the Компания's
  «Кола Партнёр™», Орднунг «вода минеральная, 0,33 л, № 2», the Коммуна's «кофе с круассаном (закрыто)»,
  Рассвет «чай из общего котла», Хай-Фронт «энергетик v4». **A drink comes with a rumour** (`11t`)
  and a line in ДНЕВНИК — the useful output — and costs a few кр. Nobody has to buy it.
- The wait is the train's interval: a few seconds in the heart, a minute at the rim — enough to
  drink the lemonade. The pad shows the countdown; nothing to do but wait or buy.

**Departure.** «Поезд прибывает» — the ship unmoors, the ring's lights run faster, and in the
system view the ship **goes into the ring on the hyperdrive**: a second of stretched streaks and a
flash, the ship gone — then the ride interface. (The coupling to an электровоз from the second
draft is dropped: the hyperdrive into the ring says the same thing with one drawing.)

## 4. The ride — on the star map

A new small mode, `G.mode="rail"`, drawn **on the galaxy map** (M447's world galaxy and the
sheet — the map already exists, so the ride is almost free to draw):

- the camera frames the line ahead; **your train is a bright mark moving along it**; the stops
  are ticks with names; junctions are circles; the other lines are faint (Beck's clarity on top of
  the real sky — the lines are drawn as smooth curves between stations, not straightened);
- between stops the mark accelerates and slows like a train; **a stop is ~2 s**: the name
  («Станция «Горловина»»), the announcer's voice once (`12pa-beacon`), and **ВЫЙТИ** on the pad;
- at a junction **ПЕРЕСАДКА** — the other line's next train is shown with its wait;
- the announcer: «Следующая станция — «Нейэль»» after each stop; at the end «Конечная. Поезд
  дальше не идёт, просьба освободить вагоны»;
- the desk stays open (ДЕЛО, ПОЧТА, ЭФИР) — a long ride is time to read.

**Timing** — segment = 0.8 s + 0.35 s per sector, a stop 2 s (the скорый skips small stops, so a
long run stays under a minute): a metro hop of three stops ≈ 6–8 s; the mainline from the heart to
the rim ≈ 45–60 s. Held pad = ×2, never a skip.

**Arrival** — the destination's ring throws the ship out onto its approach, slow, facing the
station: the post, the lane, the station ahead (borders Б1, life Ж1).

**A save during a ride** keeps `{line, from, to, t}`; loading resumes at the next stop.

## 5. Economy and danger

- **Why ride:** the rim pays (`DESIGN-resources.md`: the far resources, found by luck, sell dearest
  in the heart). The rails carry you out and your hold back — for the baggage fee per ton. **Why
  still jump:** the rails stop only at station systems; a deposit two sectors off the line is a
  jump from the platform, and a jump home is instant.
- **Oracle line** (`91zzzzzzzzz-worlds`): the best round trip by rail may not beat the best by jumps
  by more than ×1.3 in credits per minute of play; the baggage fee is the lever.
- **Danger lives at the ends, not in the ride.** Rim stations sit in dangerous sectors (`sysDanger`)
  — pirates wait on the approach to a полустанок. A station at the front is closed: «Поезд проследует
  без остановки» (the mark passes the tick). No ambush in transit.

## 6. Six powers, six railways (on the scheme and the табло)

| owner | how it runs its lines |
|---|---|
| ГЛАВТРАССА | the жетон, the tannoy, «временные трудности на отдельных участках» (a hatched stretch, nothing more said); the cheapest |
| Компания | **Express™** — a dashed twin line skipping small stops, ×10 fare, an advert on the pad under the fare |
| Орднунг | punctual to the second; late for the doors — the next one; boards only with the hold declared («ДЕКЛАРИРУЮ») |
| Коммуна | the most beautiful vestibules; greyed on strike days (`12ay-fx-soc`) and at lunch |
| Рассвет | **маршрутка** — stops on request at any system along the line («остановите у пояса!»), the only service that leaves you *between* stations |
| Хай-Фронт | driverless and fastest; now and then «обновление установлено» and the line stands a minute |

## 7. The queue — М1–М6, each playable on /dev

- **М1 the net** — radials with forks, rings, arm трассы, stations by spacing, junctions, the rim's
  полустанки and «Край»; lazy per region; the Node suite; names by the owner's rule.
- **М2 the station** — ring and vestibule at the end of the approach, six finishes and the bare rim
  platform; the hail, the glide-path alignment, the berth.
- **М3 the vestibule** — ТАБЛО, КУДА ВАМ, КАССА, БУФЕТ with the rumour; the interval wait.
- **М4 the ride** — `G.mode="rail"` on the galaxy map: the moving mark, stops, the announcer,
  ВЫЙТИ, ПЕРЕСАДКА, timing, «Конечная»; the ring's hyperdrive departure and arrival; the save.
- **М5 services and powers** — метро/электричка/скорый, Express™, declaration, strikes, маршрутка,
  updates; closed front stations.
- **М6 economy** — fares, baggage, the size rule; the oracle line; a holding-built station.

Struck from earlier drafts: tunnel walls, drawn station halls and mosaics, events inside the
tunnel, the couple-to-an-электровоз scene (the hyperdrive into the ring replaces it).
