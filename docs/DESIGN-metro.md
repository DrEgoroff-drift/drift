# The galactic metro — «куда вам?», seconds, off at the third (2026-09-14)

The author, 14.09.2026: «хочу ещё врата, чтобы туннели были и можно туда прилететь — они тебя
как по трассе везут. Ну телепорт. Типа метро своё галактическое, ахаха, выйти на 3-й станции».
Then, the same day, on the first draft: **«станции можно не делать, не сделаем красиво — абстрактно
давай, типа карта куда вам, прицепляться можно попробовать, показывать просто космос, поехали —
там за секунды должно, чтобы не бесило»**. This is the second draft, cut to that. Nothing is built.
Companions: `docs/DESIGN-life.md` (the approach — the ring stands at its end), `docs/DESIGN-borders.md`.

## 0. What others did, and the gap

| where | how it works | what we take |
|---|---|---|
| Freelancer | trade lanes: rings you ride at speed; pirates can cut a lane | the ride is a line; a line can be shut |
| X Rebirth / X4 | highways; large ships may not enter | «крупногабарит» |
| EVE | stargates are the political map; live gate status | a line's status on the scheme |
| Mass Effect | relays point to point | pick a destination, go |
| Cowboy Bebop | gates charge a toll and announce the destination | the fare, one announcement |
| Stellaris | ordinary lanes plus an express through a hub | the ordinary line and an express |
| Moscow Metro | the scheme on the wall; the ring and radials; the жетон; «Следующая станция…», «Поезд дальше не идёт» | the scheme, the ring, the voice |

**The gap** nobody fills: a line with stops you can get off at. Here it is a **choice on the
scheme**, not a stop you sit through — you pick the third station and you are there.

**The author's cut, as laws:** the scheme is the whole interface; the ride is seconds of plain
space; no station halls (they would not be beautiful — then they are not made).

## 1. Laws

1. **«Куда вам?» is the whole interface.** One paper scheme; tap a station; the button says where,
   how many stops and the fare. No platform scene, no waiting room, no timetable.
2. **Seconds, never a wait.** Boarding to arrival ≤ 6 s, whatever the distance. Nothing to sit
   through, nothing to skip.
3. **Plain space while you ride.** No tunnel walls, no halls: the stars stream past, the station
   names tick by at the top. The only drawn novelty is the coupling (§4).
4. **The metro is ГЛАВТРАССА's in spirit** — the жетон that has not changed in forty years, the
   announcer's voice, the scheme. «Метро» stays an earthly word on purpose (the naming register).
5. **Only the player builds**: the network exists by seed; beyond the settled circle it grows only
   by the player's holding.
6. **Nothing derived persists.** Lines come from the galaxy's seed; the save keeps tokens and the
   stations the player's holdings added.
7. **Jumping stays.** The metro trades fuel and range for a fare and a fixed network; systems off it
   are reached as today.

## 2. The network — Moscow on a galaxy

- **Кольцевая** — the ring line around the core at Ялта's radius; 12–16 stops. **Ялта** is the
  great interchange — «Площадь Шести Держав».
- **Six radial lines**, one per power, from the ring out through its home cluster to the edge of the
  settled circle; 3–5 stops each.
- **A stop is a system with a station**, the nearest to each ideal point of the curve, chosen by
  seed. Nothing is built in it for the metro except the ring (§3).
- **Extensions** beyond the settled circle only by a player's holding («продление линии», a late
  holding deed; the name from the game's name generator — no free text, the online rule).

About forty stops: a scheme with character, few enough to read on a phone.

## 3. The ring in the system

One drawn thing per stop: **a ring** at the end of the approach, past the station — a hoop of the
line's metal with its lights chasing round (motion, not blinking) and the line's number on a plate.
Six finishes by the line's power, one construction (the post's rule in borders §3). No platform,
no hall, no queue. Fly into the ring → «КУДА ВАМ?».

## 4. «Куда вам?» and the ride

**The scheme** (Beck's logic, not geography) opens on the ring: the circle, six straight
radials at 60°, stops as evenly spaced ticks, interchanges as circles, «вы здесь», shut stretches
hatched. Tap a stop — the pad says **«ДО «НЕЙЭЛЬ» · 3 ОСТАНОВКИ · 5 кр»**. Tap it again (or the
pad) — you go. A change of line is not a separate act: pick any stop on any line and the route
goes through the interchange by itself («с пересадкой на Кольцевой»).

**The coupling — tried, and cheap to drop.** For the first second an электровоз (a ГЛАВТРАССА tug,
«ЭР-2») slides in ahead of your nose and a coupler line (`18d-verlet`'s rope) snaps taut between
you; two or three other ships hang behind on their own ropes — a трейдер, a вахтовка. If it reads
as clutter in the frame, the ride keeps working without it (Law 3).

**The ride** — `G.mode="metro"` (a new mode by the rule, but a small one): plain space; the stars
stretch into streaks and stream past (the starfield exists, `16-flight`); the galaxy's glow turns
slowly as the heading changes (M451's model). At the top, the stops tick by — «Горловина ·
Нейэль · …» — one tick per 0.6 s; the announcer (the beacon's voice, `12pa-beacon`) speaks once, at
arrival: «Станция «Нейэль»». At a terminus: «Конечная. Поезд дальше не идёт». Timing: 1 s
coupling + 0.6 s per stop, capped at 6 s total — a long ride just ticks faster.

**Arrival** puts the ship at the destination's ring, on its approach — the post, the lane and the
station ahead (borders Б1, life Ж1): the metro arrives by the front door.

## 5. Six lines, six ways — all on the scheme

The character lives where the player looks — the scheme and the pad — not in drawn halls:

| line | on the scheme / in the ride |
|---|---|
| **Кольцевая** + ГЛАВТРАССА's radial | the жетон, 5 кр; a shut stretch is hatched with «временные трудности на отдельных участках», and nothing more is said |
| **Компания** | **Express™**: a second, dashed line beside the radial that skips small stops, ten times the fare; its ride is 3 s flat, and the pad shows an ad under the fare |
| **Орднунг** | the fare in three copies on the pad; boards only if your hold is declared (one tap «ДЕКЛАРИРУЮ») |
| **Коммуна** | greyed on strike days (`12ay-fx-soc`) and at lunch: «сегодня мы не работаем» |
| **Рассвет** | **the маршрутка**: every system the line passes is a stop — «остановите у пояса!» — the only line where you may get off *between* the ticks |
| **Хай-Фронт** | now and then «обновление установлено» — the line greyed for a minute of game time; the fastest ordinary line |

## 6. Economy and danger

- The fare is flat; the cost is the fare, **baggage** per ton of cargo («провоз багажа») and the
  network's shape. Heavy hulls pay ×3 («крупногабаритный»); the largest may not board some lines.
- The worlds oracle (`91zzzzzzzzz-worlds`) gets a line: the best metro round trip may not beat the
  best by jumps by more than ×1.3 in credits per minute of play.
- No danger in the ride. A stop at the front is closed («поезд проследует без остановки» on the
  pad; the route goes past it); an occupied stop is under the new owner's line finish.

## 7. The queue — М1–М5, each playable on /dev

- **М1 the network and the scheme** — ring, six radials, stops by seed, Ялта; a Node suite (every
  stop reachable, one stop per system, stable across seeds); the «куда вам» scheme page; the lines
  as faint marks on the galaxy map, 1:1 (no parallax, M447).
- **М2 the ring** — at the end of the approach, six finishes, chasing lights, the plate; flying in
  opens the scheme.
- **М3 the ride** — `G.mode="metro"`, ≤ 6 s: coupling (tried, removable), streaming stars, the
  ticking stops, one announcement, arrival at the ring; routing through interchanges.
- **М4 six ways** — Express™, the declaration, strikes and lunch, the маршрутка's request stops,
  the update; shut stretches and closed front stops on the scheme.
- **М5 economy and growth** — fare, baggage, size rule; the oracle line; extensions as a holding deed.

Struck from the first draft by the author's cut: the tunnel with walls, the station halls and their
mosaics, the stop you sit through, the events in the tunnel (контролёр, musician, window vendor).
