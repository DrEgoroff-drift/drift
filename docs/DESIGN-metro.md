# The galactic metro — gates, tunnels, «выйти на третьей» (2026-09-14)

The author, 14.09.2026: «хочу ещё врата, чтобы туннели были и можно туда прилететь — они тебя
как по трассе везут. Ну телепорт. Типа метро своё галактическое, ахаха, выйти на 3-й станции».
The research, the model, the ride and the queue М1–М7; nothing is built yet. Companions:
`docs/DESIGN-life.md` (the approach, §2 — the gate stands at its end) and `docs/DESIGN-borders.md`.

## 0. What others did, and the gap

| where | how it works | what we take |
|---|---|---|
| Freelancer | trade lanes: a chain of rings you ride at speed inside a system; pirates can cut a lane; jump gates (built, guarded) vs jump holes (wild) | the ride along rings; a line can be cut |
| X Rebirth / X4 | highways: join and leave anywhere along the length; large ships may not enter, they fly outside | the size limit — «крупногабарит» |
| EVE | stargates are the political map; live «gate camp» status | a line's status on the scheme |
| Mass Effect | primary relays (one fixed partner) and secondary (flexible) | two kinds of line |
| Cowboy Bebop | gates charge a toll and announce the destination; a gate accident still haunts the world | the fare, the announcement |
| The Expanse | the Ring: a slow zone with a speed limit; a garrison station inside | the gate as an administered place |
| Stellaris | hyperlanes + gateways + L-gates through one hub | the ordinary line and an express |
| No Man's Sky | portals by glyph address; the Anomaly as a hub with other players | the hub as a place |
| Moscow Metro | every station a palace of its own; «Осторожно, двери закрываются. Следующая станция…»; жетоны; the scheme on the wall; the ring line; «поезд дальше не идёт» | almost everything |

**The gap:** nobody does stations *along* a line that you may leave early. Every game above is a
lane (continuous) or a point-to-point jump. «Выйти на третьей» is ours.

What makes a network fun and not a loading screen (the research's list, kept): the ride is a
scene; waiting has a reason (interval, fare); stations in between with the choice to get off;
disruptions that make the scheme worth checking; danger that is visible; a scheme drawn by Beck's
logic, not by geography.

## 1. Laws

1. **The ride is a scene, never a cut.** The tunnel is a place with walls, lamps, windows onto the
   galaxy and other people's ships.
2. **Stations, not endpoints.** Every stop offers ВЫЙТИ; the line is a route with choices.
3. **The metro is ГЛАВТРАССА's in spirit**: a flat fare that has not changed in forty years,
   an announcer's voice, a tannoy, a scheme on the wall, halls like palaces. Earthly on purpose — the
   naming register keeps «Метро» the way it keeps «Столовая»: at the edge of the galaxy it reads as home.
4. **Only the player builds** (the standing decision). The network exists by seed; it grows beyond
   the settled circle only by the player's holding.
5. **Nothing derived persists.** Lines and stations come from the galaxy's seed; the save keeps
   only the player's ride state, tokens and the stations their holdings added.
6. **Jumping stays.** The metro trades fuel and range for time and a fare; systems off the network
   are reached as today.

## 2. The network — Moscow on a galaxy

The galaxy has a core at 0:0, the settled circle `CHRON_R`, six powers with home clusters by seed
(war §7.4) and Ялта at r≈6. The metro lays over it the way Moscow's lies over the city:

- **Кольцевая** — the ring line around the core at Ялта's radius, operated by ГЛАВТРАССА;
  ~12–16 stations (a station every 2–3 sectors of the circle). **Ялта** is its great interchange —
  «Площадь Шести Держав», where every line meets and weapons are sealed.
- **Six radial lines**, one per power, from the ring outward through that power's home cluster to
  the edge of the settled circle; 3–5 stations each. Each is run the power's way (§5).
- **Stations** are gate systems chosen by seed along those curves (a system with a station, the
  nearest to each ideal point); the rest of the systems along a line are passed through.
- **Extensions**: beyond the settled circle a line grows only when a player's holding funds a
  station (a late holding deed, «продление линии»; built over N сводки; the name comes from the
  game's name generator — no free text, the online rule).

Total ~40 stations — enough for a scheme with character, few enough for every hall to have a face.

## 3. The gate in the system

The gate stands at the end of the approach (life §2), past the station: an arch or a ring in the
line's architecture, **the station's name in lights** in the power's lettering, a platform where
the train stands, a board with the **interval** («интервал движения 3 мин») and the next departure.
- **Fare**: a **жетон** — 5 кр on every ГЛАВТРАССА line, for forty years (the joke is that it never
  changes). Tokens are bought at the gate or carried (ВЕЩИ). Baggage: a fee per ton of cargo
  («провоз багажа»). Heavy hulls (the shipyard's size class) pay ×3 — «крупногабаритный»; the
  largest may not ride at all on some lines (X4's rule).
- **Boarding**: fly into the platform zone and wait for the train, or arrive as it stands. The ship
  **couples into the состав** — behind an электровоз (a ГЛАВТРАССА tug, «ЭР-2»), in a string of
  other ships: traders, a shift bus, a family yacht. The coupling is a rope (`18d-verlet` has ropes).

## 4. The ride — a new mode, «metro»

`G.mode = "metro"`, its own `updateMetro`/`drawMetro` (the rule for a large new scene).

**The tunnel** (phone portrait, nose up): the tube's walls run down the screen as ribbed rings, a
baked tile scrolled (motion, not blinking); lamps streak past as short strokes; cables sag between
them. Every so often **a window** — the wall thins to a lattice and the galaxy outside passes: the
arm's named nebula (M449), a giant of the region (life §3.6), the front's flares. The состав is on
screen: the электровоз ahead, the coupled ships behind, all swaying a little on their ropes.

**A stop**: the tunnel opens into **the hall** (§6) — the platform, the name on the wall, lamps.
The announcer (the beacon's voice, `12pa-beacon`) says: «Станция «Горловина». Следующая станция —
«Нейэль»». **ВЫЙТИ** stands on the pad for the whole stop; at its end — «Осторожно, двери
закрываются» — and the train goes on. At the terminus: «Конечная. Поезд дальше не идёт, просьба
освободить вагоны». At an interchange: ПЕРЕСАДКА opens the other line's platform.

**Getting off** puts the ship at that system's gate, on its approach — the post, the lane, the
station ahead (borders Б1, life Ж1): arriving by metro is arriving by the front door.

**Time**: ~25–35 s of tunnel between stations and ~8 s at a stop — long enough to be a scene,
short enough to be quicker than flying the same distance. Held pad = ×3 («ехать молча»), never a skip.

**During the ride** the desk is open (ДЕЛО, ПОЧТА, ЭФИР) — the ride is also a moment to read.

## 5. Six lines, six ways to run a railway

| line | how it runs | the thing to know |
|---|---|---|
| **Кольцевая** (ГЛАВТРАССА) and its radial | the жетон, the tannoy, the электровоз «ЭР-2»; «временные трудности на отдельных участках» when a stretch is shut | cheapest; reliable except where it is not; the announcer never says why |
| **Компания** | **the Express™**: a sleek pusher, ten times the fare, twice the speed, skips small stations, an ad between stops | time for money |
| **Орднунг** | punctual to the second; a board with the timetable; late for the doors — you wait for the next one | predictable; no mercy |
| **Коммуна** | beautiful halls, the slowest trains; closed on strike days (`12ay-fx-soc`) and at lunch | the halls are worth the ride |
| **Рассвет** | not a train — **a маршрутка**: a small bus-ship that **stops on request** anywhere along the line («остановите у пояса!») — the only line where you get off between stations, into a system without a gate | the line with no wrong stop |
| **Хай-Фронт** | driverless, spotless, doors by sensor; now and then «обновление установлено» and the line stands 30 s | the fastest ordinary line, and it tells you nothing |

## 6. The halls — every station a palace

The Moscow rule: no two halls alike. A hall is the line's architecture (the six powers' grammar,
borders §2) plus **one mosaic panel made from the system's own history** — the retelling that
already exists, on a new surface:
- the war: a liberation in smalt, in the owner's heroic style — and when the flag changes, the
  mosaic is re-laid («мозаику переложили»; the old one shows at the edges for a while);
- the player's deeds in that system (the holding, a rescued barge, a road opened) — **your ship in
  the mosaic**, the rarest reward the game can give without a word;
- lamps per power: chandeliers of ГЛАВТРАССА, the Компания's backlit logo, Орднунг's even
  strip-lights, the Коммуна's glass flowers, Рассвет's lanterns, Хай-Фронт's light from under the floor.
Front stations are dark; the train passes without stopping — «Поезд проследует без остановки» —
and flares show through the hall's far arch.

## 7. The scheme

**«СХЕМА ЛИНИЙ МЕЖЗВЁЗДНОГО МЕТРОПОЛИТЕНА»** — a paper page (on the menu and on every gate's wall):
Beck's logic, not geography — the ring a circle, the six radials straight at 60°, stations evenly
spaced ticks, interchanges as circles, «вы здесь», shut stretches hatched, strike lines greyed.
Lines carry numbers and patterns first, colours as accent (the no-colour-coding rule relaxes on
paper, as every metro scheme does). On the galaxy map the tunnels appear as faint lines in the
world, 1:1 with the sheet (no parallax, M447).

## 8. Economy and danger

- The fare is flat; the cost of the metro is **time** and **baggage**. The worlds oracle
  (`91zzzzzzzzz-worlds`) gets a line: the best round trip by metro may not beat the best by jumps by
  more than ×1.3 in credits per minute.
- No pirates in the tunnel (there are контролёры); the danger is at the ends — a gate station at the
  front is closed, an occupied one is someone else's platform.
- A tunnel is never a trap: a shut stretch is known on the scheme before you board.

## 9. Events in the tunnel (М7)

Rare and short, one at a time: the **контролёр** walks the состав (no жетон — a fine, a line in
КНИЖКА); a **musician** in a passing hall (the music plays his tune — «музыкант в переходе»); a
passenger talks (the passenger-talk table exists, M156); the food barge's cousin sells through the
window (life Ж4); a lost can drifts past a window — ПОДОБРАТЬ at the next stop.

## 10. The queue — М1–М7, each playable on /dev

- **М1 the network** — the ring, six radials, stations by seed, Ялта the interchange; a Node suite
  (every station reachable, no two stations in one system, lines never cross the core); the scheme
  page; tunnels on the galaxy map.
- **М2 the gate** — the arch per line at the end of the approach, the name in lights, the platform,
  the interval board, the жетон, baggage and the size rule.
- **М3 the ride** — `G.mode="metro"`: the tunnel, the windows, the состав on ropes, the stop, the
  announcer, ВЫЙТИ/ПЕРЕСАДКА, «Конечная»; arriving at the gate; the save keeps a ride in progress.
- **М4 the halls** — six architectures, the mosaic from the chronicle and the player's deeds, the
  re-laid mosaic, dark front halls and «без остановки».
- **М5 the six ways** — Express™, the punctual line, strikes and lunch, the маршрутка's request
  stops, the Хай-Фронт update; shut stretches on the scheme.
- **М6 economy** — fares, baggage, the size rule tuned; the oracle line; extensions as a holding deed.
- **М7 events** — контролёр, musician, passengers, the window vendor, the drifting can.

Decided on the author's behalf (the author: «пока только в план пиши»): the ship couples into a
состав rather than flying the tube itself; the network is open from the start inside the settled
circle; extensions only by the player's holding; the ride can be sped ×3, never skipped.
