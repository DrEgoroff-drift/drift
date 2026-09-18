# A living space — neon, hotels, traffic (2026-09-14)

> **Reviewed the same day — `docs/DESIGN-review-2026-09-14.md` wins where it differs:** one hotel
> body with six dressings; the bazaar sells back what you threw away (`G.thrown`); the giants M464
> are deferred; the neon rules (three strokes, no flicker) are in the review §4.

The author, 14.09.2026: «как в фильмах космических — неоновые билборды, отели в космосе, как в
Стражах Галактики и во всех остальных. Надо наполнить космос жизнью, исследуй, как в кино
показывают». The research, the laws, the places and the queue M459–M464; nothing is built yet.
Companions: `docs/DESIGN-borders.md` (whose land — the post, the stamp, the laws) and
`docs/DESIGN-metro.md` (the gate lines). The three share one spatial grammar, §2.

## 0. How cinema does it — the devices, and what each costs us

Sources: Guardians of the Galaxy (Knowhere — a mining town in a dead giant's head; Contraxia — a
neon truck stop; the Ravagers' junk fleet), The Fifth Element (stacked traffic lanes, the flying
fast-food junk, the Fhloston Paradise liner-hotel), Valerian (Alpha station grown by accretion;
the Big Market), Blade Runner (advertising at monstrous scale; neon in many scripts; rain),
Star Wars (Coruscant lanes, the cantina, Canto Bight), DS9's Promenade, Cowboy Bebop (Mars neon,
ships stacking on arrival), Futurama (ads everywhere, satire played straight), and ours —
Кин-дза-дза! (the пепелац, КЦ as money, ку), Тайна третьей планеты (the space zoo's errand to the
animal market on Блук, Шелезяка), Гостья из будущего (the spaceport as a railway station).

The recurring devices, reduced to what a phone canvas can afford:

| device | why it works | our cheap form |
|---|---|---|
| traffic lanes with lights | motion along a line reads «alive» at once | lane buoys with a light chasing toward the dock; ships on fixed paths |
| advertising at monstrous scale | scale contrast; a voice filling the silence | a baked billboard sprite, neon tubes, one crawling line of text |
| a hotel / resort as a destination | somewhere to *want* to go | a docking place with lit windows and a sign; the quiet features get a door |
| food sold in space | commerce does not stop for the future | a food barge cruising the lane and hailing |
| junk and repurposed ships | history without new tech | a bazaar of docked hulks; the fleet art reused |
| customs, police, tolls | someone's jurisdiction | the post (borders M452) — already designed |
| crowds around one big thing | the cheapest scale cue | a holding queue at the dock |
| broadcast chatter | fills silence at zero draw cost | the six waves exist; billboards carry text |
| signs in many scripts | depth of history | each power's paper and lettering (borders §2.2) |
| one giant per region | a landmark and a ruler at once | one colossal structure per galactic arm |
| institutions that work | a zoo, a bazaar, a counter — more life per pixel than spectacle | each place has one useful thing to do |
| light pollution | mood | neon is an accent light on nearby hulls, not a wash |

**The lesson that decides the design:** in every one of these films the life is *institutions*
(the zoo errand, the customs desk, the cantina, the bazaar), and the spectacle is their lighting.
We build places with one useful thing each, and let them glow.

## 1. Laws

1. **A place, not a backdrop.** Every lit thing is somewhere you can go and do one thing, and that
   thing has a useful output (the lore rule: «куска лора не существует, у каждого есть полезная
   выдача»).
2. **Neon is a light with a source.** A sign is a thing lit from inside; it throws its colour on
   the hulls near it (craft: the source and the lit belong together). The star stays the key; neon is
   the warm accent (cold key + warm accent).
3. **Life has a gradient.** Crowded in the heartland and near the core, thin at the edge, none in
   the wild (`sysDanger`, the galaxy's brightness). Keep the empty (craft §3): a crowded system
   means something only if most are not.
4. **Painted once.** Structures are baked sprites; only the lights, the crawling text and the ships
   move (the cross-cutting rule).
5. **Invented brands only, satire on states and firms, never on people.** Each power writes its own
   signs in its own voice.
6. **Soviet neon burns out.** A sign of ГЛАВТРАССА always has a dead letter or two — «ГОС ИНИЦА
   «КОСМОС»». Their neon is the most human thing in the frame.

## 2. The approach — one spatial grammar for three documents

Today the ship arrives at a random angle 1 500 from the star (`jump`, 18-mode-map). Life needs a
place to stand, so **each system gets a fixed entry point** (a seeded angle; the arrival lands
near it) and everything is laid along **the approach — «подъезд»**:

```
entry (the post, borders M452) → the lane (buoys, billboards, traffic, the food barge)
      → the station (the hotel, the bazaar beside it) → the gate (metro, M471)
```

A player who arrives reads the whole system along one line: whose it is, how it lives, what is
sold, where one can sleep, where the train leaves. The lane is also where the eye goes on a phone —
a line from the bottom of the screen to the dock.

Cost to watch: `jump` draws the angle from `rnd()`; a seeded angle removes one `rnd()` call, which
moves every recorded replay and the same-hash suites — one deliberate `-Accept` pass in M459.

## 3. The places

### 3.1 The lane — «подъезд» (M459)
Buoys every few hundred units from the entry to the dock, their lights **chasing toward the
dock** (runway lights — motion, not blinking). A **holding queue** at busy stations: two to six
ships circling, one docking, one leaving. Tugs, a taxi-shuttle. Density = rung × the heartland
gradient. Painted: buoys baked once per system; lights and ships per frame.

### 3.2 Billboards — the news with neon (M460)
A billboard is a frame of neon tubes on a truss, baked once; one crawling line of text on it. Its
content is **useful** — it is the market and the news riding a new surface:
- **prices**: «ТИТАН 41 У ПАРТНЁРА В 2 ПРЫЖКАХ — ВЫГОДНО КАК НИКОГДА» (Компания; real numbers from
  `G.market`, the stale ones as a fork, as the price notes already do);
- **news and circulars**: the сводка in the owner's voice (`12p-news`, the Director's циркуляры);
- **the player's deeds**: a holding's station advertises itself («СТАНЦИЯ … — ТОПЛИВО ЕСТЬ»).
Each power's neon: ГЛАВТРАССА red letters on a truss with a dead letter and a slogan; Компания
the loudest, a logo™ and a jingle line; Орднунг a white panel of numbered rules; Коммуна a poem in
italic neon; Рассвет hand-painted boards lit by lamps; Хай-Фронт a clean screen with a version
string. Near a billboard your hull catches its colour (Law 2).

### 3.3 Hotels — a door for the quiet features (M461)
Next to a station in the heartland: a hotel with lit windows and a sign. Docking there opens what
the game already has behind DOM screens — the sanatorium (`29h/29i-spa`), the cinema (`27da-kino`),
the rumours of the cantina — so the hotel is not a new system, it is **the world's door to the
quiet features**. Six faces:

| power | the hotel |
|---|---|
| ГЛАВТРАССА | «ГОСТИНИЦА «КОСМОС»» — a slab with a hundred windows, two lit letters dead; «мест нет» on the board (there are) |
| Компания | «ДЖЕКПОТ-СИТИ™» — a casino-resort ring, valet tugs, a fountain of lights; the dearest bed and the best rumours |
| Орднунг | «Пансион № 4» — house rules on a plate by the airlock; lights out at 22:00 by the game clock |
| Коммуна | a café-boat «Ля Люн» with a terrace to the stars; the longest conversations (rumours) |
| Рассвет | a guesthouse cut into an asteroid, a painted door, a common table |
| Хай-Фронт | a capsule hotel — a honeycomb of pods, each lit the same, one flickering |

### 3.4 The food barge — «Чебуречная» (M462)
A small junk boat cruising the lane (The Fifth Element's flying fast food), hailing: «Чебуреки!
Горячие!». Each power's barge sells its `POWERS[k].food`. **A meal comes with a rumour** (`11t`)
— the useful output; and a line in ДНЕВНИК. It is never needed and always nice.

### 3.5 The bazaar of hulks (M463)
In belt systems of the heartland: a knot of old hulls moored together, awnings, lights on strings
(Knowhere's market, Блук's bazaar). Docking gives **odd lots** — the rarities' and wreck-parts'
tables on a separate counter, a mixed bag by the seed — and the scarred hulls of the shipyard's §6
for sale cheap. Reuses the fleet art for the hulks.

### 3.6 One giant per arm (M464)
Each galactic arm and the core get one colossal structure, 20–50× a ship, seen from far in its
system and named in the galaxy's voice (M449): a hollow moon with a mining town inside, lit in
rings; a dry dock of the Коммуна where one hull has been under construction for three hundred
years; an O'Neill cylinder of the Компания with its logo along its length; ГЛАВТРАССА's «Дом
водителя» — a road house the size of a station. The giant is a landmark on the map and a ruler in
the frame. (The Ring, M154, is not one of these and is never explained.)

## 4. Budget

Per system at most: one post, 3–6 buoys, 1–3 billboards, one hotel, one food barge, one queue of
≤ 6 ships — baked sprites at `UIK`-aware density; per frame only lights, one crawling line and the
ships. `prof()` on the phone layout before and after M459 and M460; the frame ledger (`look()`) for
the heartland scene — neon must add the warm accent without breaking «pair %».

## 5. The queue — M459–M464, each playable on /dev

- **M459 the approach** — the fixed entry point per system, the lane with chasing buoy lights, the
  holding queue and tugs; the `-Accept` pass for the moved `rnd()`.
- **M460 billboards** — the neon sprite family per power, the crawling line fed by prices, news,
  circulars and holdings; the accent light on nearby hulls.
- **M461 hotels** — six faces; docking opens the sanatorium, cinema and cantina doors that exist.
- **M462 the food barge** — cruising and hailing; the meal with a rumour.
- **M463 the bazaar of hulks** — odd lots, scarred hulls.
- **M464 the giants** — one per arm and the core, named, on the map.

Order with the other queues: M459 goes together with borders M452 (the post stands at the same entry
point), M460 after M453. The craft codex judges each; neon gets its own almanac issue.
