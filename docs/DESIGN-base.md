# The base as a game of its own

Design proposal, 2026-09-06. **Nothing here is built.** Written while another session runs the war
queue (M360–M388); the seams with it are named in §20 and nothing below touches `13-*` or `15a-helm`.

Scope note (author, 2026-09-06): **«зимовка» is a separate thing** — a survival mini-game of its
own, sketched in [`docs/DESIGN-winter.md`](DESIGN-winter.md) and designed separately. This document
is the *base*: the place you build, staff, provision and come back to. Survival-as-drama lives in
the зимовка; survival-as-arithmetic lives here, and §2 draws the line.

Written in English like the rest of `docs/`; every in-game name stays Russian.

---

## 0. What is wrong with the base today

`21a-mode-base` is 400 lines and it is honest work: a cross-section in the rock, a 5×4 grid, nine
modules, an energy balance with two adjacency rules, a lazy tick, raids, storms, an engineer who
repairs, four crew roles, eight keeper perks, a pad network. It is drawn well — three files and
54 KB of drawing (`21aa`, `21ab`, `21ac`) put a lit room behind every module.

And it is not a game. Six findings, each of which the design below has to answer:

- **F1 · One number decides everything.** `basePower` returns nine fields and the player sees one:
  `eff`. Build a reactor, never think again. There is no second pressure to trade the first against.
- **F2 · Nobody lives there.** Crew are assigned through a station menu, four roles, each a flat
  multiplier. The rooms draw a worker (`bWorker`) who is a decoration: the drawing knows more about
  the people than the model does.
- **F3 · Visiting is worse than not visiting.** Everything the base does, it does while you are away.
  Arriving does exactly one thing: `baseCollect`. The best play is to never open the scene.
- **F4 · The threats are dice, not weather.** `baseRaid` and `baseStorm` roll against a constant.
  Nothing the player builds changes the odds except one guard and one perk; nothing warns; nothing
  can be prepared for. A loss is a line in the log about a place you were not at.
- **F5 · The pool is a box, not a household.** The base makes ore and holds it. It eats nothing,
  needs nothing, cannot be starved and cannot be provisioned. There is no reason to bring anything
  to a base, and the 48 industrial materials of the holding have almost no eater (§14).
- **F6 · The game already promised a module it does not have.** `02-world` says of летучие газы:
  «криогенный цех на базе», and `19a-mode-scoop` repeats it — «верфь, криоцех». There is no
  криоцех. The project's own rule about promises in text (the `crewGift` precedent, 2026-08-25)
  makes this a defect, not a wish.

The plan's loose ends have carried the line *«Base "like Fallout Shelter": it is one; what differs
is a question for the author»* since 2026-08-28. This document is the answer: it is not one, it is
the **shape** of one with none of the machinery, and what differs is everything below.

---

## 1. Where it comes from — nine games, one mechanic each

The author's brief names Fallout Shelter and Oxygen Not Included and asks for more of the family.
The family is large; taking all of it wholesale would be a different game. So each source lends
**exactly one mechanic**, chosen because it survives this project's laws (no real-time simulation,
lazy resolve from `Date.now()`, nothing ephemeral persisted) and because it answers a finding above.

| game | the one mechanic taken | how it lands here | answers |
|---|---|---|---|
| **Fallout Shelter** | dwellers you place by hand, rooms that merge, the rush gamble, incidents that spread | people are drawn where they work and assigned in the scene, three like modules in a row become a hall, «аврал» buys a shift at the price of a fire, an accident walks to the next cell | F2, F3 |
| **Oxygen Not Included** | every output is somebody's input; heat is the debt you cannot delete | four coupled gauges instead of one, with the ice→air→plants→people→ice loop closing on itself; heat is two-sided and the world sets its baseline | F1, F5 |
| **Frostpunk** | one heat source with rings, and laws that cost something | warmth falls off with distance from the reactor; the base charter is four laws, taken once, each buying output with morale | F1, F2 |
| **RimWorld** | the storyteller scales the trouble to what you own | the director reads the base's worth and the system's danger, warns first, and sometimes brings something good | F4 |
| **Surviving Mars** | disasters that belong to the planet, not to the calendar | the world type already exists — storm, cold snap, dust, quake are per-type, forecast a shift ahead | F4 |
| **Dwarf Fortress / ONI** | depth is the difficulty gradient | the lower rows are hotter and richer; the keeper's second tier stops being a free perk and becomes a decision | F1 |
| **Sheltered** | provisioning: the base needs what only you can bring | supplies flow *into* the base from the hold and the holding; what you do not bring, they do not have | F3, F5 |
| **Startopia / Space Haven** | the corridor and the shaft are part of the plan | the leftmost column is the lift; a module far from the shaft loses a slice of its shift to walking | F1 |
| **Kairosoft (Game Dev Story et al.)** | adjacency as a small puzzle with visible arrows | the two hidden adjacency rules of today become a table of nine, shown in the scene as short pipes between cells | F1 |

Deliberately **not** taken: ONI's per-tile gas and liquid simulation (the no-sim law, and it would
eat the frame budget whole); Factorio belts (the holding already carries routing); permadeath of
crew by neglect (§13); any survival-drama loop — that is the зимовка's job, not the base's.

---

## 2. The frame — a рабочая база on a вахта, and where the зимовка begins

The mechanics are FS's and ONI's. The **register** must not be — a vault door and a Pip-Boy in
«Дрейф» would read as somebody else's game. This project's language is industrial-and-radio: смена,
вахта, наряд, журнал, кают-компания, аврал, консервация, «большая земля» (the station).

So the base is a **промысловая база на вахте**: a small crew works a place for a season, the ship
comes and goes, supplies arrive by ship or by barge, and the journal says what happened while you
were flying. Nobody is *stranded* here — that is the difference that keeps the two designs apart:

| | **база** (this document) | **зимовка** (`DESIGN-winter.md`) |
|---|---|---|
| the question | what do I build, whom do I put there, what do I bring | do we get out of this |
| the clock | shifts, resolved lazily between visits | one continuous sitting |
| what runs out | supplies you can fly in tomorrow | everything, and there is no tomorrow |
| the crew | employees with a roster and a wage | the people who happened to be there |
| failure | the base parks itself (§13) | the mini-game ends and is told about afterwards |

The base is the **management** game; the зимовка is the **survival** game. They share the drawing,
the modules and the people, which is why the зимовка is cheap once this is built — and why it is
designed separately rather than folded in here.

**One sentence.** *The base stops being a drill that fills a box and becomes a household under the
rock: six gauges that feed each other, five to nine people who live off them, weather that is the
planet's own, and a journal that tells you what happened while you were flying.*

---

## 3. The clock — one unit, already in the game

    СМЕНА = 20 min of real time                 // = HOLD_SHIFT (DESIGN-holding §0)

There is no second clock. The holding measures in shifts, the base measures in shifts, and a player
who has learned one has learned both. Nothing ticks: every base stores `t0` and is resolved lazily
when read, exactly as `12ad-site` resolves a hopper.

`CREW_OFFLINE_CAP` is 24 h = **72 shifts** at the ceiling. The resolve replays at most 24 shifts in
detail (that is the journal's depth, §12); anything older collapses to one summary line and the
stores are settled arithmetically. Cost of a resolve at the ceiling: 24 × ~9 modules ≈ 220 rows of
integer arithmetic — under a millisecond, once, on entering the scene.

---

## 4. The six gauges

| gauge | in game | shape | fails as |
|---|---|---|---|
| ЭНЕРГИЯ | already `basePower` | production vs load, 0…1 | modules on standby, in a fixed order |
| ВОЗДУХ | new | store, in shifts of breathing left | headache → the crew stop working → they leave |
| ТЕПЛО | new | **two-sided**, −3…+3 around comfort | frost: water freezes, people slow · heat: modules wear, the drill stops |
| ВОДА | new | store, in shifts | plants die first, then people leave |
| ХАРЧ | new | store, in shifts, with a **quality** flag | hunger, and quality is the morale tax of §9 |
| ДУХ | per-crew `morale` exists; new base roll-up | 0…1, reads all five above | people leave one at a time, and the journal says why |

Four of the five stores are **internal levels, not cargo**: they never enter the market, never enter
the hold, never inflate anything. Cargo goods *refill* them (§6), which is the point of §14.

ТЕПЛО is two-sided on purpose: it is the one number both ONI and Frostpunk build a whole game out
of, and one-sided it would just be a second energy bar. The world type sets the baseline the same
table `STORM_WORLDS` already sets the wind by:

    ice −2 · ocean −1 · terran 0 · rocky 0 · desert +1 · volcanic +2 · toxic +1 · gas 0
    and every row below the first adds +0.4 (depth is heat — §7)

---

## 5. The loop

The whole point of ONI, in five arrows and no simulation:

           лёд (mined, or brought)
             │
             ├──► ЛЕДОПЛАВКА ──► ВОДА ──┬──► люди (2/смена each)
             │      тепло −1            │
             │                          └──► ОРАНЖЕРЕЯ ──► ХАРЧ ──► люди
             │                                  ▲   │
             └──► ЭЛЕКТРОЛИЗЁР ──► ВОЗДУХ ──► люди   │ +воздух 2
                    тепло +2, эн. −8       │        │
                                           └── CO₂ ─┘
           РЕАКТОР ──► энергия, тепло +6
           БУР     ──► руда, тепло +3 ──┐
                                        ├──► РАДИАТОР (только наверху) тепло −8
           глубина ──► тепло +0.4/ряд ──┘        ломается бурей

Read it as three closed circles: people breathe what ice becomes, plants eat what people exhale and
drink what ice becomes, and everything that works makes heat that only the surface can shed. Every
arrow is a row in a table (§16), resolved once per shift with integers. No tile, no gas, no float.

The **криоцех** of F6 lands here as the heat answer for hot worlds: летучие газы → криоген,
тепло −14, and the promise the game has been making since `02-world` becomes true.

---

## 6. Modules

Nine exist. Twelve are added. Fallout Shelter ships about twenty-five rooms; this is twenty-one,
and each new one is here because a gauge needs it or a decision needs a second answer.

**Existing, unchanged in kind:** Реактор · Солнечная панель · Буровая · Склад · Жилой отсек ·
Плавильня · Площадка · Батарея · Лаборатория.

**New — жизнеобеспечение (the four gauges):**

| module | eats / shift | gives / shift | эн. | тепло | notes |
|---|---|---|---|---|---|
| Электролизёр | лёд 6 | воздух 6 | −8 | +2 | the first thing built after the reactor |
| Регенератор | — (part: `regen`) | воздух 8 | −9 | +1 | tier 2: no ice at all, wants a spare part every 40 shifts |
| Ледоплавка | лёд 8 | вода 8 | −5 | −1 | melting is your cheap cooling |
| Оранжерея | вода 6 | харч 5, воздух 2 | −4 | 0 | needs органика 4 to plant; quality **good** |
| Белковый бак | органика 4 | харч 8 | −6 | +1 | quality **poor**: −4 дух while it is the only food |
| Радиатор | — | — | −2 | −8 | surface only; storms take it first |
| Криоцех | летучие газы 3 | криоген 1 | −10 | −14 | pays F6; the hot-world answer |

**New — люди и место:**

| module | эн. | what it does |
|---|---|---|
| Кают-компания | −3 | +12 дух; domino and the receiver are already written (`11af`, `11ap`) |
| Лазарет | −4 | halves the human cost of an incident; without it a hurt вахтовик leaves |
| Мастерская | −5 | repairs 1 hp / 3 shifts with no engineer; −15% build cost on this base |
| Маяк | −3 | someone asks to stay, ~1 per 30 shifts, scaled by дух — FS's radio studio, and it feeds «Сорока» |
| Гермозатвор | −1 | the shaft's door: an incident cannot walk past it (§10) |

The lift shaft is **not** a module: the leftmost column becomes the shaft, free and always there.
That is one column of the 5×4 grid gone, so the grid grows to **6 columns** (shaft + 5 buildable),
which the existing draw code already lays out per column and per row.

---

## 7. Adjacency, merging, depth

**Adjacency (Kairosoft's puzzle, the two rules of today grown to nine).** Each is one line in a
table, drawn in the scene as a short pipe or a hazard stripe between two cells:

    реактор  → бур, электролизёр, криоцех: −22% энергии на передачу     (exists today)
    реактор  → жилой: −8 дух                                            (exists today)
    оранжерея→ жилой: +6 дух, +1 воздух                                 (people and green)
    лазарет  → жилой: +4 дух
    ледоплавка→ электролизёр: −1 лёд (the melt feeds the cell directly)
    радиатор ↕ реактор в той же колонке: −3 тепла (the stack vents)
    склад    → бур, плавильня: +20% к тому, что успевает лечь на склад
    мастерская→ любой: ремонт вдвое быстрее у соседа
    батарея  → жилой: −4 дух (никто не спит рядом со стволом)

**Merging (Fallout Shelter's best idea).** Three identical modules side by side in one row merge
into a **зал**: −30% энергии на всех троих, one worker covers the whole hall, +1 to what it stores.
The price is FS's price: one accident takes the whole hall, not one cell. The drawing already
composes rooms per cell — a hall is the same brushes with the inner walls dropped.

**Depth.** Row 0 is surface (panels, radiator, battery). Each row below adds **+0.4 тепла** and
**+8% к выработке бура** and unlocks a richer ore in `B.res`. The keeper's `deep` perk stops being
free floor space and becomes a real fork: the bottom row is the best drilling and the worst heat.

---

## 8. The people

`12a-crew` already has names, specialities, skill, morale, an offline tick and four base roles. The
design needs almost no new person-model — it needs the people to be **in the room**.

- **Assigned in the scene.** Walk the captain to a cell, ДЕЙСТВИЕ on a manned module opens who works
  here; the station menu stays for the fleet, but the base is staffed where you can see it. The
  drawn `bWorker` becomes the actual assignee, with their name over them.
- **Roles grow from four to seven:** бурильщик, инженер, охранник, логист (today) + **жизнеобеспеченец**
  (air/water/heat throughput +30%), **садовод** (харч +40%, quality never drops to poor),
  **радист** (the beacon works, the journal is written, the daily radio hour to the station).
- **Slots**: жилой отсек holds two, as today. A hall of three habitats holds seven, not six — the
  merge bonus.
- **Needs** are the four stores, per person per shift: воздух 2, вода 2, харч 1.
- **Leaving, not dying.** When дух falls under 0.25 for three shifts running, **one** person walks
  out to the nearest station and is hireable again from the usual roster, with a line in the journal
  in their own voice. Nobody dies of the player's absence. An incident can hurt someone; the лазарет
  is what makes hurt temporary. (The зимовка is where people can actually be lost — and it is opt-in.)
- **Arrivals**: the маяк, and the «Сорока» wanderer queue, and the charter's «открытая дверь» (§9).

---

## 9. The charter — four laws (Frostpunk, in an industrial register)

Each base has a **устав**, taken one law at a time as the base grows (a law unlocks at 2, 4, 6 and 8
built modules), each irrevocable for that base — that is what makes it a decision and not a slider.

| law | gives | costs |
|---|---|---|
| **Двойная смена** | +25% ко всему, что база делает | −10 дух, incidents +40% |
| **Общий котёл** | никто не голодает: харч делится поровну | no one is ever above half rations either: −8% выработка |
| **Сухой закон** | спирт идёт в технужды: ремонт вдвое быстрее | −12 дух, и кают-компания даёт вдвое меньше |
| **Открытая дверь** | вдвое чаще приходят люди со стороны | one arrival in six is trouble: theft, a fire, a rumour that reaches the pirates |

Four laws, four bases with different characters, and the choice is legible in one screen. The
keeper's existing perk tree stays what it is — the keeper is *how well* the base runs, the charter
is *what kind of place it is*.

---

## 10. The director — weather instead of dice (RimWorld + Surviving Mars)

`baseRaid` and `baseStorm` become one **director** that reads the base and the place:

    угроза = f(worth, sysDanger, world type, charter, shift)
    worth  = built cost + pool value + crew skill    // RimWorld: trouble scales to what you own

Three rules that make it weather rather than dice:

1. **It forecasts.** A шторм or a налёт is decided one shift *ahead* and shows in the scene and in
   the journal as a warning: «барограф падает», «на орбите чужой транспондер». A player who is
   present can prepare (park the panels, arm the battery, wake the guard); a player who is away
   reads about the preparation the crew made themselves, at whatever level their roles allow.
2. **It belongs to the planet.** The event table is per world type — буря (desert/ice), пылевой
   занос (rocky), холодный удар (ice/ocean: тепло −2 for six shifts), толчок (volcanic: one cell
   loses hp), выброс (toxic: воздух −half), and гости (any: a passing barge, a newcomer, a vein
   found). One in four director events is **good**: RimWorld's storyteller is not only cruel, and a
   base that never brings good news is a chore.
3. **An incident walks.** Fire, breach and flood start in one cell and, if nobody works the
   neighbour and no гермозатвор stands between, take the next cell next shift. Deterministic from
   the seed, resolved at read time, and it is the reason the layout is a plan and not a shopping
   list.

Raids keep their existing shape (guard, loss, broken cell) and gain the war layer's pirate roles
when those land — see §20.

---

## 11. Аврал — the only thing that happens in real time

One moment of the design is not lazy, and it is the answer to F3 (why open the scene at all).

While the player is **inside** the base, the director can fire an аврал: a cell starts burning,
venting or flooding. The prompt names it, the cell shows it, and the player has **30–45 seconds** to
walk there and hold ДЕЙСТВИЕ for two seconds. Crew standing in or beside the cell shorten the hold;
the мастерская shortens it; nobody there and it spreads as in §10.3.

It uses the walking, the lighting and the camera that the scene already has — no new machinery, no
new mode. It is short, it is rare (at most one per visit, ~1 visit in 4), and it is the only place
in the base where the player's hands matter. That asymmetry is the design: **away, the crew handle
it as well as their roles allow; present, you handle it better than they can.**

---

## 12. Журнал базы

The base writes one line per shift, in the voice of whoever it concerns, and keeps the last 24. On
entering, the scene opens on the journal — *this is what the visit is for* — and only then the walk.

    смена 812 · «Ледоплавка встала на четверть — Гриша ушёл латать электролизёр»
    смена 813 · барограф падает
    смена 814 · буря. Панель во втором ряду выбита, остальное закрыли
    смена 815 · «Спирт кончился. По уставу — в технужды» — Нина
    смена 818 · пришёл человек со стороны, просится остаться. Ждёт у затвора

The channel exists: `logAdd`, the speech queues (`11b`), retelling (`12p`), the ПОЧТА/QSL desk. The
plan's rule about new lore riding an existing channel (2026-09-04) is satisfied by the journal being
**the** channel for everything the base has to say — and the ПОЛКА gets one book per base after 100
shifts: «Вахтенный журнал базы такой-то», which is the retelling of its own log.

---

## 13. Консервация — what a long absence must not do

The hard question of any life-support layer under an offline model: a week away must not equal a
bankruptcy. The answer is a rule, not a cap:

**The base consumes only while it works, and it stops working before it starves.** When any store
would go negative, the resolve stops the base at that shift: modules go to standby in a fixed order
(добыча → передел → свет → жизнеобеспечение), the crew go to «малый ход» and consume a third, and
the journal writes the day it happened. Nothing is destroyed, no debt accrues, no one dies. What is
lost is **tempo and people**: a parked base has made nothing since, and one person may have walked
to the station.

The player may also park a base **deliberately** before a long trip — консервация as a button,
which costs one shift to restart and is the correct play before a long flight.

---

## 14. What the base is not — the boundary with the holding

The holding (`12ab`–`12ah`, `DESIGN-holding`) is 82 buildings and 48 materials at station scale. The
base must not become a second one, and the line is sharp:

| | холдинг | база |
|---|---|---|
| scale | a station, a system, a ladder of 30 rungs | one grid you can see whole |
| who runs it | other people; you own a share | your own crew; you know their names |
| what it makes | goods and money | the ability of your people to keep working there |
| your presence | irrelevant | the аврал, the staffing, the charter |
| the verb | вози | держи |

And the two **feed** each other, which is the systemic argument for this whole design: the holding
makes кислород, консервы, синтебелок, регенератор, гермоплёнку, криоген, жилой блок, and today
almost nothing eats them. The base eats them all. Provisioning a base is what finally answers
«и что мне с этими материалами делать» — you fly them to the people who need them.

---

## 15. Save shape and the laws of the project

- `B.life={air,water,food,heat,t0}` — five integers per base. `snapshot()` writes them, `applySave()`
  defaults them for old saves (`s.v===5` branch, `14-save`). A pre-M390 base loads with full stores
  and one shift of grace.
- `B.charter=[ids]`, `B.rows`, `B.cells[]` as today; `cells` gain `{hall:n}` for merges.
- Nothing ephemeral: the director's rolls are `rng(hashi(...))` from the base's key and shift index,
  as `baseRaid` already does. The journal is the only new *stored* text, capped at 24 lines.
- No new tick. `baseTick` becomes `baseResolve(B, shifts)` — a loop over integer shifts, called from
  the same three places `baseTick` is called from now.
- Frame cost: the scene's static rock and grid are already candidates for `screenLayer`/chunks; the
  new drawing (gauges, pipes between cells, the people) is per-cell and small. The pass gets its own
  `look()` reading and its own almanac issue, as every new visual system does.

---

## 16. The numbers, in one place

Per shift (20 min), at ×1, before roles and perks:

    человек:      воздух 2 · вода 2 · харч 1
    электролизёр: лёд 6 → воздух 6 · эн 8 · тепло +2
    регенератор:  → воздух 8 · эн 9 · тепло +1 · part `regen` каждые 40 смен
    ледоплавка:   лёд 8 → вода 8 · эн 5 · тепло −1
    оранжерея:    вода 6 → харч 5 + воздух 2 · эн 4 · органика 4 на посадку
    белковый бак: органика 4 → харч 8 · эн 6 · тепло +1 · дух −4
    радиатор:     тепло −8 · эн 2 · только ряд 0
    криоцех:      газы 3 → криоген 1 · эн 10 · тепло −14
    реактор:      +14 эн · тепло +6
    бур:          руда по `drillEff` · эн 9 · тепло +3
    глубина:      +0.4 тепла и +8% буру за каждый ряд ниже первого

A five-person base at comfort, worked example: воздух 10, вода 10, харч 5 per shift. That is two
электролизёра (12 air, 12 лёд, 16 эн), one ледоплавка (8 water — short, so a second at ×½ or ice
brought in), one оранжерея (5 харч, +2 air). Load ≈ 33 эн against a reactor's 14 — **two reactors,
or one reactor and four panels**, and now the heat is +11 against one radiator's −8, so either a
second radiator on the surface (and storms take radiators) or the base sits one row higher. That is
the game: five gauges arguing, and no build order that satisfies all of them.

The refill rates for provisioning (what a delivered good is worth in the base's stores):

    кислород 1 ед → воздух 8   ·  лёд 1 → вода 1   ·  консервы 1 → харч 6 (good)
    синтебелок 1 → харч 4 (poor) ·  криоген 1 → тепло −6 for 12 shifts
    регенератор 1 → part  ·  гермоплёнка 1 → repairs a breach outright  ·  жилой блок 1 → +1 slot

---

## 17. The queue

Nine passes, one version each, each playable on /dev before the next starts. M-numbers are proposed
after the war queue's block and must be reconciled with `PLAN.md` when the author accepts.

- **M390 · the shift and the resolve.** `baseResolve` replaces `baseTick`; the shift becomes the
  base's unit; the journal's storage and the first ten lines. Nothing new is consumed yet — the same
  base, resolved differently, and every old save still loads. Tests: `91zzzw-base` on the replay's
  determinism and the 72-shift ceiling.
- **M391 · воздух и вода.** Two gauges, электролизёр and ледоплавка, standby order, консервация.
  The moment the base can be starved is the moment it becomes a game.
- **M392 · тепло.** The two-sided gauge, the world baselines, depth, радиатор, криоцех (pays F6).
- **M393 · харч и дух.** Оранжерея, белковый бак, quality, the дух roll-up, leaving-not-dying.
- **M394 · the people in the room.** In-scene assignment, three new roles, the drawn worker becomes
  the assignee, slots and the hall.
- **M395 · adjacency and merging.** The table of nine, the зал, the shaft column, the grid to 6×4.
- **M396 · the director.** Forecast, per-world events, the walking incident, one good event in four,
  the war layer's pirate roles if they have landed.
- **M397 · аврал.** The only real-time moment; the mobile check (`91zzx-mobile`) is part of the pass.
- **M398 · the charter.** Four laws, the unlock ladder, the screen.
- **M399 · the craft pass.** The whole scene against `DESIGN-craft` and `look()`: gauges, pipes,
  people, hall walls, the frost and the heat haze. Its own almanac issue, as every new visual
  system gets.

Playable after M391 (starvable), a real game after M393 (five gauges), a place after M394–M395,
weather after M396, and a scene worth entering after M397. The зимовка (`DESIGN-winter.md`) is
queued after M395: it needs the gauges and the people in the room, and nothing else from this list.

---

## 18. What this deliberately does not do

- **No per-tile simulation.** Ever. The gauges are five integers per base.
- **No second economy.** The stores never touch the market; goods flow *in* only.
- **No permadeath, no lost buildings by neglect.** §13 — the losses that hurt belong to the зимовка,
  where the player chose to be.
- **No new mode.** It is `G.mode==="base"` throughout — a large new scene would be a new mode by the
  plan's rule, and this is not a new scene, it is the same one finally doing something.
- **No encyclopedia.** Everything the layer has to say rides the journal, the ПОЛКА book and the
  existing speech queues (the 2026-09-04 rule).

---

## 19. Forks for the author

1. **Does the reactor eat fuel?** (a) no, as today — free power once built; (b) изотопы 1 per 4
   shifts, which makes even the power gauge a supply line and gives изотопы an eater. *Recommended:
   (b) at half strength — a reactor without fuel drops to a third instead of stopping.*
2. **How hard is starving?** (a) soft: standby and one person leaves (§13); (b) hard: modules take
   damage as well. *Recommended: (a). The offline model makes (b) a punishment for having a life.*
3. **Scope of the first pass.** (a) all nine milestones as one design, built in order; (b) M390–M393
   only (the gauges), and the people/weather/charter judged after they are played.
   *Recommended: (b) — the holding was built (a)-style at 82 buildings and its critique found 37
   things; four gauges played for an evening will settle more than another page of design.*
4. **Do old bases convert?** (a) full stores and a shift of grace, silently; (b) a journal line —
   «база принята на довольствие» — and a first provisioning run. *Recommended: (b).*
5. **Одна база или все?** Does life support apply to every base the player owns, or only to bases
   with a жилой отсек (an unmanned mining outpost stays the simple machine it is today)?
   *Recommended: the latter — it keeps the old base as an option and makes the жилой отсек the door
   into the whole layer.*

---

## 20. Seams

**With the war queue (M360–M388).** The war session is in `13-combat`, `13c-roles`, `13-pirates`,
`15a-helm`, hull grammar and the chronicle. This design touches `21a`/`21aa`/`21ab`/`21ac`,
`12a-crew`, `12c-mgr-core` (perk text only) and `14-save`. No file is shared, and the two meet at
exactly two points: `baseRaid` should take its attackers from the war layer's pirate roles when
those exist (M396 reads whatever `13c-roles` ships; until then it keeps today's roll); and a base
overrun, defended or provisioned during a war is an episode for the chronicle (`DESIGN-war` §6).
Neither is a blocker in either direction.

**With the зимовка (`DESIGN-winter.md`).** The survival mini-game reuses this base's grid, modules,
gauges and people, and adds nothing to them; it changes only the clock and the stakes. It is
designed separately and queued after M395.

---

# Part II — the hard game (author's brief, 2026-09-06)

> «надо чтобы игра прям мозг ебала… должно быть не просто сложно а пиздец как сложно»
> «но есть один выход — найти управляющего, который всё разрулит… но найти его это должен быть
> пиздец. Давай там процедурно, реально чтобы случайно можно было найти.»
> «от планеты кстати тоже много зависит»
> «но если база успешная на планете какой-то, если игрок прям сделал, то приносит мама не горюй»

Part I above is the machinery. Part II is the difficulty, the planet, the payoff and the one way
out. They are one design: the base is savage, the planet decides how savage, a base that is
actually solved pays like nothing else in the game, and a man exists somewhere who will run it for
you — and finding him is the hardest thing in «Дрейф».

---

## 21. The planet decides

The base is not one puzzle repeated. **Every planet is a different puzzle**, and which planet you
found on is the difficulty setting — chosen by flying there, not by a menu. «Дрейф» will never have
a difficulty slider; it has a galaxy where some rocks will kill you.

### 21.1 The formulary — eight dials, all derived, none stored

A planet already has `type`, `res`, a star class and `sysDanger`. From those, eight numbers are
derived (pure function of the seed — nothing new is persisted):

| dial | range | what it does to the base |
|---|---|---|
| **тепло** | −3…+3 | the ТЕПЛО baseline (§4). The single biggest lever |
| **свет** | 0…2 | solar panel yield; a dim star means the reactor is the only option |
| **давление** | 0…2 | air leak per shift: at 2 the электролизёр is a treadmill, not a solution |
| **тяжесть** | .5…2 | build cost ×, walk time ×, drill yield × (heavy worlds drill better) |
| **ветер** | 0…2 | storm frequency (today's `STORM_WORLDS`, promoted to a dial) |
| **дрожь** | 0…2 | quakes: a cell loses hp, and the shaft can close |
| **лёд** | 0…2 | whether water and cooling are free or flown in |
| **порода** | 1…5 | how rich the ore is, and how deep you must go for it |

### 21.2 The character of each world — the same eight dials, eight different games

| world | free | murderous | the puzzle it sets |
|---|---|---|---|
| **rocky** | nothing | nothing | the honest baseline. Poor, safe, and the place to learn |
| **terran** | воздух, вода, харч | nothing — except everyone else wants it | the raid magnet: cheap to live, expensive to hold (§23.3) |
| **ice** | вода, охлаждение | тепло −2: frost cracks the modules, people slow | you must *make* heat and the reactor becomes life support, not power |
| **desert** | свет | ветер 2: the surface is shredded, panels and radiators first | everything valuable must go underground, and depth is heat |
| **ocean** | вода | давление, затопление | flooding is the walking incident; the shaft is the weak point |
| **volcanic** | **тепло даром → геотермия: энергия почти бесплатна** | тепло +2 and дрожь: the base cooks | the richest power in the game, and the base is a heat problem from shift one |
| **toxic** | порода 4–5 | давление 2: air leaks forever | the treadmill world: only регенератор + гермоплёнка make it survivable |
| **gas** | летучие газы | no ground: no drill, no radiator, no shaft | not a base at all — a floating station, its own build list (later) |

The reading that matters: **the free thing on a world is never the thing that makes it rich.** A
comfortable planet is poor; a planet that pays is trying to kill you. That is the whole risk curve,
and it is drawn by the world table rather than tuned by hand.

### 21.3 Разведка перед закладкой

Founding blind must stop being possible-by-accident and start being a *choice you can regret*.
Before `foundBase`, the planet shows its formulary — but only as well as you have paid for:

- **с орбиты, даром**: type, star, «тепло: жарко / терпимо / холодно» — three words, no numbers.
- **зонд** (300 кр, one shift): five of the eight dials, in numbers.
- **высадка и замер** (the surface mode, already exists): all eight, plus the ore under the site.

So the first mistake of every player is founding on the strength of three words, and the lesson is
learned once. The probe is cheap; not buying it is the tuition.

### 21.4 The site inside the planet

Two bases on the same planet are not the same base: the **site** shifts порода ±1 and лёд ±1, and
the surface mode already walks the ground. Choosing where to plant the shaft is the last decision
before the grid, and it is worth a flight around the planet.

---

## 22. How hard, exactly — nine laws

Hard is not big numbers. Big numbers are tedium. These nine make the base genuinely difficult in
the way that keeps a player awake, and each is cheap under the lazy model.

1. **Everything touches at least three gauges.** No module is a pure gain. Solve air and you have
   made heat; solve heat and you have spent power; make power and you have made heat. There is no
   move that only helps — the player is always paying for something with something.
2. **The feedback is delayed by design.** A base resolves in shifts; a mistake made now surfaces
   five to twenty shifts later, when you are two systems away. The base cannot be *reacted* to; it
   must be **predicted**. This is the single strongest source of difficulty in the design and it
   costs nothing to build.
3. **Information is a purchase.** Without приборы and a радист the gauges read «мало / впритык /
   хватает», not digits; the forecast is «барограф падает», not «буря через 3 смены». Precision is
   a module, a person and a part. Most players will fly half the game on adjectives.
4. **Everything wears.** hp drifts down on its own, faster the further ТЕПЛО is from comfort. A
   base in perfect balance leaves perfect balance by itself. Nothing is ever finished.
5. **People are not multipliers.** Traits (`MGR_TRAITS` already models this for managers; crew get
   their own smaller set): боится тесноты, пьёт, не спит у реактора, не ладит с конкретным
   человеком. The best crew list is not the highest skills.
6. **Space is the hardest currency.** 5 buildable columns × 4–5 rows. Life support, mining,
   refining, defence and people do not fit together. Every base is a *specialisation*, and halls
   (§7) make the commitment permanent.
7. **Failure cascades.** Radiator down → heat up → drill stops and modules wear → smelter starves →
   no alloy → repairs impossible. Each link is one honest rule; together they are a spiral. A base
   is lost over an evening, not in a moment.
8. **The planet is the difficulty (§21).** And the player picks it, knowingly, for the payoff.
9. **Two bases are four times one.** One hold, one ship, one player. The trap is not any single
   base; it is the second one. Nothing stops you, and nothing warns you.

**The guard on all nine — hard, never obscure.** The playtests have already caught this game being
unclear («сам текст слуха прям нихрена не понятно»), and confusion is not difficulty, it is a bug.
Every rule above is stated in the game, in words, where it applies: the module card says what it
takes and what it does to every gauge; the journal names the cause of every loss; the forecast says
what is coming, in the vocabulary the player has paid for. **The player must always be able to say
what killed the base.** If they cannot, the pass is not finished.

**And the base stays optional.** It is a layer you enter by choosing to; the game is completable
without one. That is exactly what licences the savagery.

### 22.1 Real loss, without deletion

> **Revised by §39:** a lost base is always recoverable, from every state.

The soft consequence of Part I §13 (консервация) holds for neglect. For a base that is genuinely
lost — starved out and abandoned — the harder ending: the crew leave, and the base becomes a
**развалина** on the map, holding what you built. Given time, someone else moves in: a squatter, a
pirate outpost (which hands the war layer a target with your own walls). You can come back and
retake it — by paying, by clearing it, or by finding the one person who stayed.

Nothing is deleted from the account; what is lost is a place, its people and its momentum. And a
ruin is a *story* the world can tell about you — the wall, the retelling, the rumours all carry it.

---

## 23. What a solved base pays — «мама не горюй»

The difficulty is only justified by the payoff, and the payoff has to be enormous without being
inflation. The economy has been burnt once already by exactly this shape (the солнечная ферма:
«деньги делали деньги без внимания и без предела», M240). So the reward is built to a rule:

> **A great base does not print credits. It makes things that cannot be bought.**

### 23.1 The three tiers of payoff

- **Работающая база** (life support closed, one drill): ore, as today. Pays for itself, no more.
- **Отлаженная база** (5–7 modules, staffed, adjacency solved): ore ×2.5 through depth and roles,
  плюс on-site refining — it stops being a mine and becomes a supplier for the holding.
- **Решённая база** (full grid, halls, the planet's hostility turned into an asset): the
  **unique output**. Only a volcanic base at depth 4 smelts иридий на месте; only a toxic base
  makes ксенобиом in quantity; only an ice base makes криоген cheaply; only a heavy world's drill
  reaches порода 5. These are the materials the shipyard, the lab, the holding's tier-3 and the
  war layer's оснастка all need and **nowhere sells** (`price:0`, `rare:` in `RES`).

Numbers, to be ratified against `ECONOMY-AUDIT.md` before M393 ships: a solved hostile-world base
should out-produce the player's whole trade loop by **three to five times** in value, and be the
only source of two or three materials. Not by paying more credits per shift — by making the things
credits cannot reach.

### 23.2 And it compounds

The output feeds the holding (§14), the holding's ladder rungs raise the system, a raised system
raises the base's own prices and brings barges to your pad. A solved base is the engine of the
late game, not a side income. That is the reward the nine laws are charging for.

### 23.3 The magnet

RimWorld's rule, and the thing that keeps a solved base from becoming a chair to sit in: **the
director reads worth** (§10). A rich base on a rich rock is the loudest thing in its sector —
raids scale with it, rivals bid for its people, and the war layer's powers notice it. The endgame
of the layer is not «I have solved it», it is «I have solved it and now I must hold it».

---

## 24. Управляющий — the one way out, and why finding him is hell

> **Revised by Part IV (§33).** There is **one** управляющий, not three; there is no notebook; he
> builds and develops. Read §34–§38 with this section.

Everything above describes a layer that demands the player's whole attention. There is exactly one
way to buy that attention back, and it is a **person**, not an upgrade.

`12c-mgr-core` already has the shape: four domains, `keep` is «Смотритель» — «следит за дронами и
стройкой, не даёт домену простаивать». That is the *hire*: any station sells you one, and he keeps
things from idling. He does not play the base. What the author is asking for is the tier above:

> **УПРАВЛЯЮЩИЙ** — not hired. Found. He takes a base and *plays it*: balances the six gauges,
> provisions himself from your account, sets the shift's priority, answers the аврал, rebuilds
> after a storm, and turns the hardest layer in the game into a line of income.

### 24.1 There are three of them in a galaxy

`ROGUE_CAP=3` already carries the project's law for this — «больше трёх — уже не сюжет, а список».
Three per seed, generated at galaxy creation from the seed alone: имя, позывной, характер, one
trait from `MGR_TRAITS` that is a *demand* rather than a flavour, and a **fate route**.

They are different men, not three copies: one honest and ruinously expensive; one брошенный —
found in a ruin, the man who stayed when the others left, and cheap because he has nowhere to go;
one who was a пират's quartermaster and will run your base beautifully while stealing from it.

### 24.2 He is a function of time, not a stored object

    гдеОн(seed, смена) → станция | база | борт | развалина

His route is deterministic: a seeded sequence of jobs, each a few hundred shifts long, across real
places. Nothing is persisted — the same law as everything else in this project. He works whether
you look or not, and **he moves**. This is the whole difficulty of the hunt: every piece of
evidence you find describes where he *was*.

### 24.3 Found by accident — really

The author's requirement, honoured literally: **there is no gate.** If you walk into the cantina of
the station where he happens to be, he is there — a patron among patrons, with a name and a line.
Nothing marks him. One tell exists for a player who knows what to look for (his позывной on the
cup, the ledger under his elbow — a passport-level detail, `DESIGN-passports`), and that is all.

The odds are what they are: three men among hundreds of stations. It will happen to somebody, once,
and that story will be worth more than any quest marker ever printed.

### 24.4 Found by hunting — four channels, all of them already built

The hunt is inference, not a trail of markers. Each channel narrows the space, none of them alone
is enough, and the game already says how to read them (`11t-rumours`: «слух — область, никогда не
точка… два независимых источника, сошедшиеся в одном, — самый сильный сигнал в игре»).

| channel | what it gives | what it costs | how it lies |
|---|---|---|---|
| **Слух** (`11t`) | a region of 3–5 systems and a *time* — «месяц назад» | drinks, cantinas, flying | 15% are simply wrong; and a true rumour points at his **past** |
| **Пеленг** (`11ap`/`11an`, приёмник) | a **bearing** from where you stand: direction ±15°, no distance | you must be there, and listen at the right hour | a bearing ages; his route moves under it |
| **Вещь** (барахолка, провенанс) | «это со станции такой-то, недавно» — a recent, weak, cheap point | pocket change | provenance lies the way flea markets lie |
| **Стена и пересказ** (`11ah`, `12p`) | people who worked for him: what he demands, what he refuses | asking, and being someone worth answering | memory, and pride |

**The one real skill is triangulation.** Two bearings, taken from two systems far apart, *within a
few shifts of each other*, cross at where he is now. That is a genuine plan: fly wide, listen,
fly wider, listen again, draw the cross on the map (the map already draws трассы), and go. Do it
slowly and the cross points at a place he left.

**False targets.** The galaxy also holds a dozen ordinary-but-famous смотрители, and rumours
conflate them constantly. There is no way to be sure from one source — which is precisely why the
game's own two-source rule exists. Chasing the wrong man costs a week of flying, and the game will
not tell you that you are wrong; the ruin he is not standing in will.

### 24.5 The rivals

He is worth what he is worth to everyone. NPC holdings hunt him too, on a slow clock: unhunted, a
управляющий takes an NPC contract after a while. Then he is *easier* to locate — everyone knows
where he works now — and far harder to get: you buy out the contract at a price that hurts, wait
for it to end, or make his employer's base fail, which is its own campaign.

Nothing is ever lost forever. But there is a reason to hurry, without a timer on the screen.

### 24.6 What he costs, and why taking him is itself a hard decision

- **Доля**: 18–25% of everything the base makes, plus a wage. He is not cheap and never becomes cheap.
- **Требования**: his trait is a demand — «параноик» wants a reserve held, «пьющий» wants a
  кают-компания and refuses «сухой закон», the honest one refuses «двойная смена». Breaking a
  demand is the loyalty drop, not a warning box.
- **Один человек — одна база.** Three men in the galaxy, three bases run for you, ever.
- **Он занимает место `keep`** of the four (`MGR_CAP`) — taking him means not having a смотритель
  for everything else.
- **И он может уйти.** `12g-mgr-rogue` already models exactly this, and he is the worst possible
  renegade: he leaves knowing your base, and he can take it. The way out of the hard game is itself
  a bet.

### 24.7 What he does not do

He holds what is. He will not expand the base, will not found one, will not choose the planet, and
will refuse a rock he judges hopeless — the survey (§21.3) is still yours. The reward removes the
chore, not the game.

---

## 25. The queue, extended

Part I's M390–M399 stand. The hard game rides on top of them:

- **M400 · the planet's formulary.** Eight dials derived from the seed, the per-world characters of
  §21.2, the probe and the three levels of survey, the site inside the planet. Nothing else changes
  — and the existing bases become eight different problems overnight.
- **M401 · the nine laws.** Wear, delayed feedback made legible, information as a purchase, crew
  traits, the cascade. The pass is judged by a player who loses a base and can say why.
- **M402 · развалина.** Real loss, the squatter, retaking, and the seam to the war layer's outposts.
- **M403 · the payoff.** Unique per-planet output, the three tiers, the audit against
  `ECONOMY-AUDIT.md`, and the magnet in the director.
- **M404 · the three men.** Generation from the seed, the fate route as a pure function of time,
  the tell, and the accidental meeting in a cantina.
- **M405 · the hunt.** Rumours about a person, the bearing on the receiver, provenance, the wall;
  false targets; the notebook page that holds what you have gathered and lets you cross things out.
- **M406 · the hand on the base.** What he actually does per shift, the demands, the share, the
  rivals' contracts, the buy-out, and his renegade branch through `12g-mgr-rogue`.
- **M407 · ПАЛАТА.** Part III whole: the register, the eight instruments, the three
  режимы, the inspector, the seizure of a forgotten ruin. It ships LAST, after the payoff (M403)
  and after the управляющий (M406) — a joke about being taxed is only funny once there is
  something to tax and a way out of it.

Order matters: the way out must not exist before the thing it is a way out *of* (M401), and the
hunt must not ship before the world has enough places to hide a man in.

---

## 26. Forks — Part II

6. **Три или больше?** Three follows `ROGUE_CAP`'s law. More would make them a list, fewer would
   make the hunt a coin. *Recommended: three, and one of them always in a ruin.*
7. **Does the hunt have a notebook?** (a) nothing — the player keeps notes on paper, which is the
   purest version and the one the receiver-and-map crowd will love; (b) a ТЕТРАДЬ page that
   accumulates the evidence you have actually collected and lets you strike lines out, but never
   draws a marker or narrows the region for you. *Recommended: (b) — the playtests are clear that
   this game loses people to «непонятно», and a page of your own findings is not a quest marker.*
8. **Can a base be lost for real (§22.1)?** *Recommended: yes, and only after консервация, a
   warning in the journal, and a long silence. The ruin is worth more to the game than the safety.*
9. **Difficulty for the first base.** (a) nothing special — the galaxy's first rocks are `rocky`
   and forgiving by geography; (b) the first base gets one free grace (a shift of full stores).
   *Recommended: (a). The gradient is a place, not a setting.*

---

# Part III — ПАЛАТА: why the base is cheap to open (author's brief, 2026-09-06)

> «базу открыть дёшево, но потом мозг тебе взебёт)) это прям стёб на ИП в России: открывай,
> конечно, но потом мы тебя ебанём всем арсеналом, ахаха. Погугли, и прям стебись при
> проектировании.»

The nine laws of §22 explain why a base is hard to *run*. This part explains why it is hard to
*have* — and it is the funniest thing in the design, on condition that the game never once admits
it is joking.

## 27. The joke, and the single law that makes it work

Founding stays cheap: 2500 кр and ten alloys, one screen, a polite clerk, done in a minute. The
station *wants* you to found a base. What the station does not do is stop you.

Everything after that is the **ПАЛАТА** — the chamber that keeps the register of промысловые
участки. It is unfailingly courteous, it never threatens, every one of its papers is beautiful, and
it is going to bill you for the rest of the game.

> **[WITHDRAWN by the author 2026-09-06 — see §40, the tone is loud. Kept for the record.]**
> **The tone law: НИКОГДА НЕ ПОДМИГИВАТЬ.** Not one line of this layer is written as a joke. The
> forms are real forms in the game's own paper language (`DESIGN-passports`, the ТЕТРАДЬ/ОТЧЁТ/
> ПОЧТА desk), the inspector is genuinely polite and often right, the fee notice is a small,
> well-set document. The comedy is entirely in the accumulation and the timing. A game that winks
> gets one laugh; a game that keeps a straight face while charging you for a base that has been
> switched off for a month gets told about.
>
> The second half of the law: **everything is stated at founding.** The registration screen lists,
> in full and in small type, every obligation below. Nobody will read it. That is the joke *and*
> it is what keeps the layer inside §22's guard — the player was told, on paper, and can go back
> and read it any time from the desk.

Grounded in the real thing, checked 2026-09-06: fixed contributions in Russia in 2026 are 57 390 ₽
a year, owed for as long as you are in the register **whether or not you trade**, plus 1% on income
over 300 000 ₽; the fine for trading without a till starts at 30 000 ₽; and from October 2026 the
tax service receives marketplace payouts automatically. Every mechanic below is one of these,
translated and kept deadpan.

## 28. The arsenal — eight instruments, each small, together lethal

| instrument | in game | the bite |
|---|---|---|
| **Внесение в реестр** | founding registers the site with the ПАЛАТА. 2500 кр, one screen | the only cheap thing that ever happens |
| **Участковый сбор** | a fixed fee per 90 shifts, per registered site | **charged while the base is on консервация, while it is buried by a storm, while it is a ruin.** It is not a fee on production, it is a fee on being in the register |
| **Доля с оборота** | +1% of everything above a threshold, per period | success raises the bill by itself; it is never enough to ruin you and never small enough to forget |
| **Клеймо** | every lot shipped off the base must carry the site's stamp. The клеймитель is a part, and stamping costs a shift's fraction | an unstamped lot sells at 0.6 and, if an inspection sees it, is a fine |
| **Счётчик отгрузки** | a module the ПАЛАТА requires before the first shipment | the fine for not having it is set just above the cost of having it. This is the exact real-world calibration and it needs no exaggeration |
| **Сводка** | every 40 shifts, filed in person at any station — or by эфир if a радист works the base | missed sweeps accrue пеня, and пеня compounds quietly in a place the player is not looking |
| **Проверка** | *плановая*: announced a shift ahead, in the forecast · *внеплановая*: on a «сигнал» — a rumour, a rival, an unstamped lot seen at a market | the inspector is polite, competent and finds something. There is always something |
| **Снятие с учёта** | closing a base costs 800 кр and four shifts of paperwork | **abandoning one does not close it.** A ruin stays in the register and keeps billing until the ПАЛАТА seizes it — and the seizure notice is a lovely document |

Individually every line is small. The design is the arithmetic: four bases, two of them parked,
one of them a ruin the player forgot to deregister, and the quarterly notice arrives.

## 29. Режим — the one real escape, and it rewards reading

At registration the player picks the site's **режим**, once, changeable no oftener than every 200
shifts. This is the layer's actual strategy, and it is a direct lift of choosing between НПД,
патент and общий режим:

| режим | fee | ceiling | obligations |
|---|---|---|---|
| **Простой** | tiny fixed | no hired crew, one drill, output capped | no сводка, no счётчик, no клеймо. The honest small mine, and genuinely peaceful |
| **Патент** | large fixed per period, known in advance | none | no доля с оборота, сводка once per 200 shifts. **The режим of a solved base**: the better you do, the more it saves |
| **Общий** | small fixed + доля с оборота | none | everything in §28 |

A player who reads the founding screen picks патент for the volcanic monster and простой for the
ice outpost and never suffers. A player who does not read is on общий by default, because общий is
the default, because of course it is.

Two anti-dodges, both taken from life and both fair because they are printed: **дробление** — two
sites in one system are billed as one for the доля; and **уведомление о начале работ** — the first
shipment before the notice is filed is a fine, and the notice is one click on the founding screen
that nobody clicks.

## 30. Where this collides with the rest of the design, on purpose

- **With консервация (§13).** Parking a base saves supplies and saves nothing else. The right play
  before a long flight stops being obvious, which is the point.
- **With развалина (§22.1).** A lost base is now a *debt* as well as a ruin, until it is
  deregistered or seized. This is the harshest line in the whole design and it is the one that will
  be quoted.
- **With the payoff (§23).** Патент turns a solved base's fee into a rounding error. The reward for
  mastering the layer is partly that the layer stops taxing you — exactly the shape the joke wants.
- **With the war (§20).** The ПАЛАТА is a power's instrument. Under some powers the inspector comes
  twice as often; under others the register barely functions and nobody bills anybody, which is its
  own kind of trouble.
- **With the УПРАВЛЯЮЩИЙ (§24) — and this is the design's keystone.** What he really is, under the
  hood, is a **great accountant**: he files the сводка, he keeps the клеймо, he meets the inspector
  at the shaft, he moves the site to патент the shift it becomes profitable, and he deregisters the
  ruins. The dream of every real ИП, three of them in the galaxy, and finding one is the hardest
  thing in the game. The satire and the mechanics are the same object.

## 31. Fork — Part III

10. **How loud is the joke?** (a) deadpan throughout, as written above — the player works out on
    their own what the game is doing, and telling someone about it is the reward; (b) one or two
    lines somewhere that wink. *Recommended: (a), without exception. The moment the game admits the
    joke, the joke is over, and this one can run for the whole game.*
11. **Does the ПАЛАТА ever go too far?** One event exists where it is simply wrong: the счёт is
    frozen on a «сигнал» that turns out to be a rival's, and the player must fly there and explain
    themselves to a courteous person who apologises beautifully and unfreezes nothing for six
    shifts. *Recommended: yes, exactly once per playthrough, and never explained afterwards.*

## 32. Станция платит как бизнес — the other half of the relation

(Author, 2026-09-06: «не ну станция платит как бизнес, норм, можно».)

Part III gave the ПАЛАТА the taking half. The station has the paying half, and it behaves exactly
like a real customer: it is glad to buy, it is slow to pay, and its terms improve precisely as they
become less convenient.

Today `baseCollect` puts ore in the hold and the market pays cash on the spot. That stays for
small change. Everything above a lot of 40 units becomes a **поставка**, and a поставка has terms.

| term | in game | the bite |
|---|---|---|
| **Приёмка** | the station checks the lot: клеймо, чистота, срок | a lot without a stamp goes at 0.6; a lot from an overheated base grades down a step |
| **Акт и отсрочка** | a big buyer signs and pays in **20–40 смен**. A small buyer pays now, at 0.75 | the better the customer, the longer the wait |
| **Кассовый разрыв** | the сбор, the wages and the supplies are due **now**; the money for the last three lots arrives in thirty shifts | on paper the base is profitable. In the account there is nothing. This is the single most accurate thing in the whole design |
| **Аванс** | the station prepays against a future lot — at a discount, and it binds you to a volume and a date | miss the date and the advance becomes a пеня. The cure for the разрыв is a new way to lose |
| **Договор на объём** | N lots at a fixed price | protection from a price fall, and a noose if the drill stops |
| **Уступка долга** | sell the receivable to a passing barge (`12af`/`12l`) at 0.8, today | the honest, expensive exit from a разрыв, and it is always available |
| **Разряд поставщика** | reliability raises your grade: better prices, bigger lots — **and longer отсрочка** | the reward for being dependable is being paid later. Nobody will believe it is not a joke, and it is not |

### Why this belongs here

- **It makes time a resource in a second way.** §22.2 made *consequence* slow; this makes *money*
  slow. The player must now plan a calendar, not a balance sheet, and «когда придут деньги» becomes
  a real question with a real answer.
- **It gives the ladder and the holding a handle.** A raised system (`12ae-ladder`) pays faster and
  grades kinder; a system you have neglected pays like a stranger.
- **It sharpens the управляющий once more.** Beyond §30, what he really sells is cash flow: he
  takes the advance when it is cheap, sells the receivable before the сбор falls due, and never
  once lets a разрыв happen. A player who has found one stops thinking about the calendar entirely
  — which is the whole promise of the layer, stated in the only currency that matters here.
- **And it keeps the tone law.** Not one line of the table above is written as a joke. It is simply
  how it works.

Ships with **M407** as one pass with the ПАЛАТА: the taking and the paying halves are the same
mechanism, and shipping either alone would read as either cruelty or generosity instead of business.

---

# Part IV — the author's second round (2026-09-06, same evening)

> «один управляющий, его надо найти среди сотни пиздецовых.»
> «увольнять, понять что не такой — сразу нельзя. процедурно. вдруг кто-то сразу наткнётся.»
> «тетрадь — ну хз, давай просто пусть игрок понимает сам: база работает или нет.»
> «кстати управляйка строит и развивает, можно посмотреть — подумай как из любого места, давай в дело.»
> «потерять можно, но всегда можно восстановить.»
> «шутки прям пиздец до конца, не сухо, а прям максимум.»

## 33. What this supersedes

| where | was | is now |
|---|---|---|
| §24.1 | three управляющих per galaxy | **one**, hidden in a crowd of about a hundred who claim the same |
| §24.4, fork 7 | a ТЕТРАДЬ page collecting evidence | **no page.** The player judges by the base itself (§38) |
| §26 fork 6 | «three, one of them in a ruin» | **one** — see §34 |
| §22.1, fork 8 | a lost base may stay lost | **always recoverable** (§39) |
| §27, fork 10 | deadpan, never wink | **loud, to the end** (§40) |
| §24.7 | he holds, he does not expand | **he builds and develops** (§37) |

Everything else in Parts I–III stands.

---

## 34. Сто управляющих и один

> **Buckets withdrawn by §48** — the hundred are a continuous distribution, not three groups.
> The flaw table below stands; the counts and the срок do not.

The galaxy generates about **a hundred** candidates from the seed. All of them call themselves
управляющий, all of them are hireable, all of them have a позывной, a service record and
references. **Exactly one is real.**

    ~70   плохих   — each ruinous in his own way, and his way is generated
    ~29   сносных  — no disaster, no miracle: the base runs at about six tenths
      1   настоящий

The middle 29 matter. Without them the hundred would be a cruel lottery; with them, hiring a decent
man is a real, viable, permanently mediocre strategy — and the difference between «сносно» and
«по-настоящему» is what the whole hunt is for.

### 34.1 The flaw model — why you cannot tell at once

Each bad candidate carries three generated numbers, and it is the second one that makes the design:

    изъян        — what he does wrong (from the table)
    срок         — 15…120 смен before it becomes visible at all
    маскировка   — 0…1: how well his own reports hide it

| изъян | how it eventually shows |
|---|---|
| **тащит** | the pool never matches the drill's numbers, by a few percent, forever |
| **строит не то** | the third склад where the радиатор had to be — and it is built, and paid for |
| **паникует** | perfect until the first аврал, then consumes half the stores fixing a scratch |
| **пишет красиво** | the сводки are excellent. The base is not |
| **молчит** | does not file at all; the пеня compounds where nobody is looking |
| **боится глубины** | never opens the lower row: the base's best ore is simply never touched |
| **жжёт людей** | output is superb and the crew leave one by one, and each departure is explained away |
| **осторожный** | moves the site to общий режим «так надёжнее», and that costs the доля с оборота forever |
| **медленный** | he is right about everything, twenty shifts late |
| **берёт авансы** | the account looks healthy. The obligations behind it do not |
| **любит лёгкое** | flawless on a rocky world, helpless on a volcanic one |
| **свой человек** | hires his relatives into the жилой отсек at full wage |

Nothing about a candidate can be read off a screen. There is no hidden stat to reveal, no
«истинный уровень» behind a check. The flaw *is* his behaviour on a base over time, and time is
the only instrument. That is the point of the author's rule: understanding you hired wrong is not
an event, it is a slow suspicion.

---

## 35. Собеседование — where luck is possible on the first day

Every candidate talks well. Procedurally, they talk *too* well: promises, warmth, agreement.
One class of behaviour cannot be faked cheaply, and it is the only tell in the game:

> **The real one asks about the place before he answers about himself.**

He wants the формуляр (§21): what is the тепло, what is the порода, is there лёд, what does the
устав say. He will **refuse a hopeless rock** — the only candidate in the galaxy who ever refuses
work. He names one condition and does not move off it. He quotes a real number back at you.

The fakes flatter, agree to everything, and take any planet at any price. Some of them — the ones
with high маскировка — have learned to imitate a question or two, so the tell is a strong signal
and never a proof.

This is what makes the author's «вдруг кто-то сразу наткнётся» literally true: a player who reads
the interview text on their very first hire can meet him on day one and notice. No gate, no
prerequisite, no quest state. Most players will not notice, and will hire the man who promised
more.

### 35.1 Where the hundred are, and where he is not

The hundred stand at station counters, advertising. **He does not advertise.** He is working
somewhere, or drinking somewhere, or sitting in a ruin he did not leave. So a player who only
interviews candidates at counters will, with certainty, never meet him — they will only ever find
the best of the fakes, which is the trap the layer is built around.

To meet him you must be in the world: the rumour (`11t`), the bearing on the receiver (`11ap`), the
provenance of a thing at a flea market, the wall, the retelling — all of Part II §24.4 stands,
minus the notebook. And the cantina accident stands too, unchanged and ungated.

---

## 36. Испытание — the only test is a base under load

There is no interview that settles it and no document that proves it. The test is the job:

1. **Give him a base and fly away.** An easy planet proves nothing: most of the hundred hold a
   rocky world. **Only a hostile world separates them**, which means the test costs a real base on
   a real hostile rock.
2. **Watch it from wherever you are** (§38). Not his reports — the base.
3. **The cost of being wrong runs while you are being wrong.** He is not idle during his срок: he
   is building (§37), with your money, in the wrong places, and a built thing is not unbuilt cheaply.
4. **Firing costs.** Расторжение: выходное пособие, and the ПАЛАТА wants a notice about it too
   (§40 — it has a form). A player who tests candidates by rotation will go broke doing it, which
   is precisely why the rumour trail is worth flying.

The honest strategy that emerges — and it is a good one — is: hire сносного, run at six tenths,
and hunt the real one in the world at the same time. That is the layer's whole shape in one line.

---

## 37. Он строит и развивает

The hire keeps a base from idling. **The real one develops it.** Per shift, out of your account,
without asking:

- picks and builds the next module by the planet's формуляр, not by a template — a радиатор on
  volcanic before a second drill, a регенератор on toxic before anything;
- digs the lower row when the ore and the heat justify it, and not before;
- merges halls when three of a kind line up;
- moves the site to патент the shift it pays, and files everything (§30);
- provisions himself: orders ice, консервы, парты from your holdings or buys them, and takes the
  advance or sells the receivable so the сбор never catches the account empty (§32);
- rebuilds after a storm, meets the inspector, deregisters your ruins;
- and refuses to grow past what the planet can hold, which no bad candidate ever does.

The bad ones build too. That is the trap: **everybody builds, only one builds right**, and the
difference reads as a base that is quietly wrong for forty shifts.

He still does not choose the planet, does not found bases, and will hand back one he judges
hopeless. Survey and expansion stay yours.

---

## 38. СВЯЗЬ — the base from anywhere, and why it is the instrument

The author's «можно посмотреть, из любого места, давай в дело». It is not a screen — it is a
**channel on the receiver**, and it earns its keep three ways.

Tune the receiver (`11ap`, the знакомая ручка) to the base's позывной from anywhere in the galaxy.
What you get depends on the signal, and the signal is a designed resource:

| condition | what you hear |
|---|---|
| same system | the six gauges as numbers, the last journal lines, the shift's plan |
| a few sectors, радист on the base | three words per gauge («воздух — впритык»), the last two lines |
| far, or no радист, or a storm | one word about the base as a whole, and static |
| very far, or the мачта not built | nothing. And nothing is information too |

**One: it is how you judge a manager.** No notebook, no manager stats — exactly as the author asked.
You listen to your base from two systems away and you know whether it is alright. A liar's сводка
says one thing; the gauge says another; the difference is audible and it is the whole game of §34.

**Two: the base calls you.** A raid, an аврал, a кассовый разрыв, a departure — the receiver
crackles mid-flight and the crew say it themselves. Then it is a decision: turn back — fuel, time, a
missed trade — or let them handle it at whatever level their roles allow. Information that creates
a choice, not a panel that reports one.

**Three: one order per contact.** Switch the shift's priority, park the base, sell the receivable,
call a barge. Limited by signal quality, so a distant base is genuinely harder to steer — and the
real управляющий makes the whole mechanism unnecessary, which is the reward stated in the currency
that matters.

It gives the радист, the маяк and the мачта real jobs, it makes distance mean something outside
combat, and it costs one panel and a table.

---

## 39. Потерять можно, вернуть можно всегда

Loss stays real and stops being permanent:

- The crew leave, the base becomes a развалина, and what you built stands there broken (`hp:0`).
- Someone may move in: a squatter, a pirate outpost (the war layer's target with your own walls).
- **And you can always come back.** Clear it or buy the tenants out, pay the ПАЛАТА what it is owed
  or settle the seizure at auction, repair from `hp:0` at a fraction of the build cost. The
  формуляр, the site, the ore and the shaft are all still there.
- Nothing is ever deleted from the account, and no state exists from which a base cannot be
  restarted. What a loss costs is time, money, the people who left and the story of having lost it.

The auction of a seized site is one of the funniest scenes available (§40) and it is also the
mechanism that guarantees this rule.

---

## 40. Тон: максимум

**The deadpan law of §27 is withdrawn on the author's instruction.** The ПАЛАТА is played loud, to
the end, without restraint. What replaces the old law is a craft rule, because loud comedy fails
faster than quiet comedy and this joke has to run for a whole game:

> **The absurdity is always bureaucratic logic taken seriously to its conclusion — never a joke
> from outside the world.** No memes, no anachronism, no character who knows they are funny. The
> ПАЛАТА is hilarious because it is *consistent*, and the player laughs at a thing that is
> genuinely trying its best.

What that licenses, and it licenses a lot:

- **Forms with real numbers and unreal names.** «Форма 4-БУР-2, приложение Ж: сведения о
  намерении сведений не подавать.» Filed in triplicate, one copy to the station, one to the site,
  one to the applicant, who is you, from you.
- **Fees that describe themselves.** «Сбор за право пользования правом на участок.» «Пеня за
  своевременность» (levied when a filing arrives early: it disrupts the queue).
- **An inspector with a name and a recurring life.** He is polite, thorough, and always finds
  something; over a playthrough he is promoted twice, and each promotion makes him worse. He
  remembers your bases. He asks after your попугай.
- **Hold music on the эфир.** The ПАЛАТА's channel plays one bar, forever, between announcements
  that do not concern you. The music module is already there (`10-music`).
- **The seizure notice congratulates you** on the successful conclusion of your participation in
  the register, and encloses a form for the return of the notice.
- **The auction of your own seized base**, where the ПАЛАТА is the seller, the auctioneer and the
  only other bidder, and everybody is very glad to see you again.
- **A hundred terrible CVs** (§34) — this is where the volume of the comedy lives: «вёл три базы,
  все три стоят», «мой метод — доверие», «сводку не подписываю принципиально», «работаю только с
  живыми людьми, приборы искажают». Generated, endless, and every one of them is applying to run
  the thing that keeps your crew breathing.

Two guards that stay, and they are not about volume:

1. **The game never breaks its own world to be funny.** Everything above exists inside the fiction.
2. **The joke never eats the clarity (§22).** A player must still be able to say what killed the
   base. The ПАЛАТА may be ridiculous; it may never be *unclear* about what it charged and why.

## 41. Queue changes

- **M404** becomes «один и сотня»: the candidate generator, the flaw model, the interview tells,
  the real one's placement and route. The tell must be readable on the very first interview.
- **M405** drops the notebook and keeps the channels: rumour, bearing, provenance, the wall.
- **M406** gains §37 (he builds) — the largest single piece of the pass.
- **M407** carries §32, the ПАЛАТА and the loud tone together.
- **New M408 · СВЯЗЬ** (§38): the receiver channel, the signal table, the base calling, the one
  remote order. It can ship early — right after M393 — because it is what makes every later pass
  observable, and because it is good on its own.
- **§39** rides M402 (развалина), which now must guarantee recoverability from every state.

---

# Part V — why a base is necessary (author, 2026-09-06: «придумай причину»)

> «и база должна в своём финале или не в финале прям давать ценное, чтобы она прям пиздец была
> необходима. Придумай причину.»

The reason cannot be money. `DESIGN-arc` settles that in one line — **«The game never hands out
credits. It hands out access»** — and the whole arc turns on one value: **назван / не назван**,
will anyone say your call sign out loud.

So here is the reason, and it is one sentence:

> **A ship passes through. A base is the only thing the player owns that has a place on the map, a
> name, a call sign and people in it — and therefore the only thing of yours the world can come
> *to*, and name out loud.**

Four layers hang off that, near to far. Each is a real mechanism, none of them is a wall.

## 42. Near — the things nobody sells

Part I §23 and III §29: a solved base on a hostile world makes иридий, ксенобиом, криоген,
породу 5 — the materials with `price:0` that the shipyard, the lab, the holding's third tier and
the war layer's оснастка all need and no counter anywhere stocks. Wanting is not needing, but it is
where the necessity starts: after the mid-game there is a shopping list you cannot buy your way off.

## 43. Middle — the blockade

The war layer (M369–M378) gives powers the ability to close a system's counters. A blockade is the
moment the game stops being about profit: no fuel, no parts, no repairs, no air, and the nearest
open station is four jumps the wrong way.

**A base is the only supply the player controls.** Ice becomes water and air; the мастерская
repairs; the ледоплавка and the химия make гидразин for fuel; the pad takes a barge. A player with
a working base flies through a war. A player without one is grounded and watches, which in this
game is the worse fate.

One line of mechanism, no new systems: during a blockade, the base's own stores and мастерская
become a station's counters for their owner, at cost.

## 44. Far — the expedition names it

`11x-expedition` is already built: in Act II, once the Ring has been heard and a tape handed in, a
circular goes out on the эфир and **the whole world works for sixty days** on an expedition. Its own
header states the design's honest cruelty: «Игрок не герой экспедиции. Он — один из тысячи рук.»

The base is what changes that, and it is the finale the author asked for:

**An expedition into the far dark cannot be mounted from stations alone. It needs a forward base on
the way out** — a pad, a mast, people, closed life support, standing in the right corridor. The
world has a few candidates of its own, all mediocre. If the player has one that qualifies, the
circular names it:

> «…опорный пункт экспедиции — участок «Тишина», система −7:14. Всем бортам: приём и заправка
> там.»

And that is the arc's positive charge, paid in the only currency it accepts:

- **The world's traffic reroutes through your pad.** Barges land, crews eat, the ledger fills. Not a
  reward you collect — a place that is suddenly busy, and busy in your name.
- **Your call sign is said by everybody, for sixty days**, on a channel you did not pay for.
- **Access, not credits:** the expedition's own stores, a person who stays afterwards, a drawing
  nobody sells, the right to be on the list.
- **And afterwards, when it is over**, the base is still there and people still come. That is
  `DESIGN-after`'s material.

If the base does not qualify, nothing is taken away. The expedition simply goes the poor way, and
the player hears about it, from outside, one of a thousand hands. Absence is this game's punishment
and it has always been the sharpest one it has.

**Requirements, so a player can aim at it long before it happens:** площадка, мачта, жилой отсек
with people, life support closed for the last 200 shifts, and the site inside the corridor the
circular walks. All five are visible from the first day of building. None can be bought late.

## 45. The mast — the base is an instrument

One module makes the base necessary in a way that has nothing to do with cargo. The **мачта** can
only stand on a planet, on a base, on the surface row — and it is what turns the receiver from a
thing that hears into a thing that *locates*:

- the bearing on a signal becomes direction **and distance** — which is how the hunt of §35 stops
  being a lifetime (and yes: to find the man who will run your base, you need a base);
- the СВЯЗЬ channel (§38) reaches the whole galaxy instead of a few sectors;
- the Ring, the QSL correspondents and the far ether come in clean.

Nothing is gated behind it — everything above is audible without a mast, badly. The base is not a
key; it is the difference between hearing and knowing, which is the same difference the whole game
is about.

## 46. The quiet one — a place where somebody waits

The ship's crew rotate through orders. A base is the only address in «Дрейф» where a person can
simply **live**: the returners (`11s`), the wanderer, a musician who stayed, the man who did not
leave the ruin. And a place with people in it does one thing no station ever does — it hears you
coming and says your call sign first:

> «Борт, это база. Слышим тебя.»

That is the arc's value, spoken by a thing the player built, and it is the real answer to «зачем
база нужна». Everything in Parts I–IV is the price of that sentence.

## 47. Where this lands in the queue

- §42 ships with **M403** (the payoff).
- §43 needs the war's blockade; it is one function on the base side and belongs in **M403** too,
  dormant until the war layer lands.
- §45 (мачта) moves **earlier** — into **M408** with СВЯЗЬ, because the bearing depends on it.
- §44 is its own pass, **M409 · опорный пункт**: the qualification check, the circular naming the
  site, the rerouted traffic, the sixty days, and what stays afterwards. It ships last of the whole
  base queue, because it is the payoff of every pass before it.
- §46 is not a pass. It is the register every line of text in the layer is written in.

---

# Part VI — the distribution, and a critique of this document

## 48. Кандидаты — распределение, не список

**§34's three buckets are withdrawn.** Nothing about the hundred is hard-written: every candidate is
a roll, the outcome is continuous, and «плохой / сносный / настоящий» are places on a curve rather
than categories. The player can meet the best man in the galaxy on the first interview of the game,
and the game does not know or care that it happened.

### 48.1 The roll

Each candidate is a pure function of `hashi(galaxySeed, id)` — nothing stored, generated when a
counter is looked at, identical every time it is looked at again:

    q     = .12 + .78·pow(r(), 2.6)     // качество: какую долю потенциала базы он вытягивает
    жад   = .10 + .22·r()               // его доля с базы
    плата = 40 + 90·r()                 // жалованье в смену
    изъян = r() < .62 ? pick(ИЗЪЯНЫ,r) : null
    срок  = 15 + floor(105·r())         // смен ПОД НАГРУЗКОЙ до первых признаков
    маск  = pow(r(), 1.6)               // насколько его сводки это прячут
    чутьё = q·(1 − .5·маск)             // насколько он читает планету, а не шаблон

`pow(r(), 2.6)` is the whole design in one expression: the mass sits near the bottom, the tail is
thin, and there is no ceiling anyone can see.

### 48.2 What that actually produces

Net for the player = `q × потенциал базы − жад − плата − ущерб(изъян)`. Rolled out:

| what he turns out to be | доля кандидатов | what it feels like |
|---|---|---|
| **в минус** — доля, жалованье и ошибки съедают больше, чем он вытягивает | ≈ 44% | the base is fine and the account is emptier every month |
| **в ноль** — работает, платит за себя, и всё | ≈ 34% | «а что изменилось-то» |
| **в плюс**, .45–.65 потенциала | ≈ 19% | a real, good, permanent hire. Most players will end their game here |
| **почти**, .70–.85 | ≈ 3% | he is very good and something is still wrong |
| **настоящий**, .95+, без изъяна, **и он единственный, кто строит и развивает (§37)** | **один на галактику** | the layer stops being work |

The important line is the second one. The dominant experience of hiring is not disaster — it is
**nullity**: he manages, the base runs, the sводки arrive, and at the end of the period there is
nothing. That is truer than a table of villains, it is funnier, and it is exactly the author's
«другие тож управляют и тож могут просто не приносить нихрена».

### 48.3 The one, and the odds of meeting him

He is one specific `id`, chosen from the galaxy seed. He is a rolled person like everyone else —
he simply rolled the tail, and his `изъян` came up null.

- **At a counter: p = 0.** He does not advertise (§35.1). A player who only interviews at counters
  meets the 19% and calls it a day. This is the single most important number in the design.
- **In the world: p ≈ .003 per cantina/place visited**, since he is one man moving through a few
  hundred inhabited places. Blind wandering finds him about half the time in ~230 visits — a real
  possibility across a long game, and **it can be the very first one**.
- **With the hunt** (rumour → region, two bearings → a cross, provenance → recency): the space
  collapses to a handful of flights per attempt. The hunt does not raise a hidden chance; it tells
  you where to walk so the .003 becomes a certainty.
- **The tell is available at every interview, including the first** (§35). Luck is not a substitute
  for noticing; it is only ever an invitation to notice.

### 48.4 The срок was wrong — corrected

§34.1 said 15–120 смен to first signs. At 20 minutes a shift that is 5 to 40 hours of real time per
candidate, which is not difficulty, it is a bill. Two corrections:

1. **Срок counts shifts under load, not shifts elapsed.** A parked or idling base proves nothing.
2. **The planet is the accelerator.** The hostility of the world divides the срок: on a hostile
   rock a flaw shows in a quarter of the time, because the flaw is exactly an inability to answer
   what the planet is asking. On a rocky world it may never show — and on a rocky world it also
   costs almost nothing, which is why nobody needs to care.

So the test is: put him on the worst planet you own and listen for a few days of play. That is
expensive, honest, and finite.

---

## 49. Critique of this document (self, 2026-09-06)

The author asked whether these concepts still lead or have slid into pop gaming. The honest answer
belongs in the file, not only in the chat.

**What genuinely leads — three things, and only three:**

1. **A manager with no revealable statistic.** There is no hidden number to expose, no check to
   pass, no reveal. His quality *is* his behaviour over time, judged by the state of a thing he
   runs. Almost nothing does this; games hand you a stat because a stat is easy to render.
   Blade Runner's randomised culprit is the nearest relative and it is thirty years old.
2. **Judging by a degraded signal.** The СВЯЗЬ channel (§38) gives worse information the further
   away you are, and the base calls *you*. Every colony game in the genre gives a perfect remote
   panel. This one makes the panel lie with distance, and turns that into the instrument for §48.
3. **The reward being «назван», not credits** (§44). The expedition naming your site on a channel
   you did not pay for is not a mechanic any comparable game has, because it only works inside this
   game's own arc.

**What is stock, and should be admitted as stock:** the six gauges, adjacency, room merging, rush,
walking incidents, the wealth-scaled director, the world-type table, the tiered chains and the
charter laws are the genre's grammar — Fallout Shelter, ONI, RimWorld, Frostpunk, Surviving Mars,
each recognisable at a glance. That is fine and it is deliberate: a player must be able to sit down
and play. But none of it is where this design's value is, and none of it should be defended as if
it were.

**The real danger is not pop — it is the pile.** Twenty-one modules, nine laws, eight instruments of
the ПАЛАТА, eight dials, seven contract terms, a hundred candidates, five layers of necessity. Every
piece argues for itself; together they are at risk of being a list rather than a game. The holding
was designed this way (all 82 buildings at once) and its own critique found 37 things.

**The cut, if a cut is needed** — in this order, and the design survives all of it:

    contract terms (§32) → 3 of 7          keep отсрочка, аванс, уступка долга
    ПАЛАТА instruments  → 4 of 8           сбор, сводка, проверка, снятие с учёта
    modules             → 16 of 21         drop регенератор, белковый бак, лазарет, гермозатвор, маяк
    difficulty laws     → 5 of 9           keep 1, 2, 4, 6, 8 (coupling, delay, wear, space, planet)
    charter             → cut whole until the gauges have been played

What must never be cut, because it is the whole reason the layer exists: the six gauges, the
delayed feedback, the planet as the difficulty, the one manager, the degraded signal, and the
expedition naming the base.

**Verdict.** The substrate is pop and the spine is not. The design leads exactly as long as fork 3
is answered (b) — gauges first, played for an evening, everything else judged after. Built (a)-style
as one heroic pass, it becomes a very large list, and the three things that lead will be buried
under the eighteen that do not.

---

## 50. Две честные игры — руками и не глядя

(Author, 2026-09-06: «не ну можно вручную, и норм будет — построил, молодец, без управляйки. Просто
это ты упарываешься в базу и не летаешь, следишь. Как игроку тож норм».)

**The управляющий is not a fix for a layer that does not work without him. He is a trade.** What he
buys is attention, and attention is the only thing in this game that cannot be earned, mined,
bought or inherited.

| | **руками** | **через управляющего** |
|---|---|---|
| потолок базы | **100% — выше, чем у любого нанятого** | .12….85 by the roll (§48), 1.0 for the one |
| доля | никакой | 10–32% плюс жалованье |
| аврал | ты добегаешь сам, и делаешь это лучше всех (§11) | он справляется на своём уровне |
| сводка, клеймо, инспектор | сам, лично, на станции | его забота |
| цена | **ты живёшь у базы и не летаешь** | ты летаешь |

Both are complete games. The manual player is not playing a degraded version waiting for a hire —
he is playing the harder and better-paying one, and «построил сам» is the correct ending of that
story. This has three consequences that the rest of the design must honour:

1. **Nothing is gated behind a manager.** Not the expedition's опорный пункт (§44), not патент, not
   the deep row, not any material. Every requirement in this document is reachable by hand.
2. **Presence is strictly better at the base and strictly worse at everything else.** Sitting on a
   base means not trading, not hunting, not answering the эфир, not being where the war is. The
   opportunity cost is the whole rest of the game, and it is never spelled out as a penalty.
3. **The hunt of §§34–48 is optional content, not a fix.** That also de-risks §49's pile: a player
   who never hears of the hundred candidates loses nothing they were promised.

The СВЯЗЬ channel (§38) belongs to the flying player; the man sitting on his own base does not need
a receiver to know his air is short. And that asymmetry is the layer in one image — **one player
reads the gauges, the other listens to them from four sectors away and hopes.**

---

## 51. Settled — the author's decisions, so they are not re-litigated

Answered by the author on 2026-09-06, in this conversation. A fresh session does not reopen these.

| # | fork | settled |
|---|---|---|
| 3 | scope of the first pass | **(a) everything. Nothing is cut, all of it is combined and built in order.** §49's cut list is withdrawn as a plan and kept only as the record of a risk that was weighed and declined |
| 6 | how many управляющих | **one** per galaxy |
| — | the hundred | **a continuous distribution, not buckets** (§48). Meeting him on the first interview is possible and is not special-cased |
| 7 | a notebook for the hunt | **no notebook.** The player judges by whether the base works (§38) |
| 8 | can a base be lost | **yes, and it is always recoverable from every state** (§39) |
| 10 | how loud is the joke | **maximum, to the end** (§40); the deadpan law of §27 is withdrawn |
| — | he builds | **yes** — the real one develops the base himself (§37) |
| — | watching from anywhere | **the receiver channel** (§38), not a screen |
| — | why a base is necessary | **Part V** — the things nobody sells, the blockade, the expedition naming it, the place where somebody waits |
| — | playing by hand | **a complete game with the higher ceiling** (§50). Nothing is gated behind a manager |

Unanswered forks keep their recommended defaults and may be raised again when their pass is built:
**1** reactor fuel — (b) at half strength · **2** starving — (a) soft · **4** old bases — (b) with a
journal line · **5** which bases — only those with a жилой отсек · **9** the first base — (a) no
grace · **11** the ПАЛАТА is wrong exactly once — yes.

### 51.1 The queue in build order

The staged order below supersedes §17, §25, §41 and §47 wherever they disagree. Twenty passes, one
version each, each playable on /dev before the next starts.

**A · хозяйство** — ~~M390 смена и `baseResolve`~~ — 0.390.0 (2026-09-06): `21a1-base-life` —
`baseResolve`/`baseResolveAll` replace `baseTick`, the shift is `HOLD_SHIFT` and nothing else, every
roll is keyed by shift number so ten visits of one shift equal one visit of ten (suite
`91zzzw-base`), the catch-up stops at 72 shifts and collapses anything older than 24 into one
summary line, and the journal keeps 24 lines in ten kinds — the ten things the base already does —
with the visit opening on it. **Deferred:** nothing; the stores it exists for arrive with M391.
· ~~M391 воздух и вода~~ — 0.391.0 (2026-09-06): two gauges in `21a1-base-life`, электролизёр and
ледоплавка in `BUILD`, production scaled by the power actually available, consumption **only by
people** so an unstaffed base stands forever, the §13 stop (store clamps at zero, mining and
refining stop, crew to «малый ход» at a third, one journal line, nothing destroyed), provisioning
from the hold (кислород 1 → воздух 8, лёд 1 → вода 1 and into the store as feedstock), and
консервация as a button on the desk row — a hand-parked base does not wake itself. Suites in
`91zzzw-base`. **Deferred:** the person who walks to the station on a long stop (it belongs with
дух, M393), and standby as a partial shutdown in the §13 order — today the stop is whole-base and
the order table only names what stopped. ·
~~M392 тепло, глубина, криоцех~~ — 0.392.0 (2026-09-06): the two-sided gauge in tenths and
integers (world baseline + cells + 0.4/row − radiator − cryo shop − delivered cryogen), frost that
stops the melter outright, heat that wears machinery and at the top step stops the drill, depth
paying +8% per row to that drill, `радиатор` and `криоцех` in `BUILD`, and criogen as a supply that
buys 12 shifts of cold. **Thresholds measured against the installed base**: a reactor and a drill
is +9, which had to land in the first step (−15% output, no wear) and be cured by one 900-credit
radiator; §16's five-person +11 lands in the second and wants a second radiator, as written.
Suites in `91zzzw-base`; two older base suites were made weather-proof after the shift-keyed storm
roll turned them into a lottery on the wall clock. **Deferred:** the оранжерея and белковый бак
that §16 pairs with these numbers — they are M393 with харч and дух. · ~~M393 харч и дух~~ — 0.393.0 (2026-09-06): оранжерея (вода 6 → харч 5 + воздух 2, sown once with
4 organics and idle without them) and белковый бак (органика 4 → харч 8, quality poor), консервы and
синтебелок as supplies, and **дух** as the roll-up of the other four gauges that also pulls each
person's morale towards it. Under a quarter for three shifts and one person walks out to the station
with a line in their own voice, hireable again — nobody dies of the player's absence, per §8. Suites
in `91zzzw-base`. **Deferred:** the кают-компания and лазарет that lift дух (they are §6's «люди и
место» group, M394–M395), and the seven roles — жизнеобеспеченец, садовод and радист arrive with the
people in the room.

**B · место и люди** — ~~M394 СВЯЗЬ и мачта~~ — 0.394.0 (2026-09-06): `21a2-base-link` — the base as
a channel in the receiver panel (11ap), four levels of legibility (numbers · a word per gauge · one
word · static) from distance, mast, power and a радист hook that is honestly zero until the role
lands; `мачта` in `BUILD` as a surface-row module; the base calling out over the ether when it stops,
loses someone, is raided or cooks a module, with bases now resolved on **every jump** so it happens
on the road; and one order per contact (park/raise) gated at the legible-word level, i.e. about half
the mast's reach. Suites in `91zzzw-base`. **Deferred:** the shift's plan and «sell the receivable» as
further orders (they need §10's director and §23's money), and the радист himself (M395). · ~~M395 люди в комнате~~ — 0.395.0 (2026-09-06): `21a3-base-people` — `JOB_ROLE` gives every module
its job, ЦЕЛЬ on a module opens the people ribbon in the scene, the drawn `bWorker` is the assignee
with the name over him, and the three new roles do what §8 promised (жизнеобеспеченец +30% to air
and water, садовод +40% food and no poor quality, радист further signal and calls through a worse
one). `маяк` in `BUILD` brings a guest to the gate once every thirty shifts, scaled by дух, taken or
refused at the desk under the same crew ceiling and wages as any hire. Suites in `91zzzw-base`, and
the scene was looked at rather than argued about. **Deferred:** the hall bonus of seven people in
three habitats (that is M396's merging), and the лазарет/кают-компания/мастерская/гермозатвор of §6.
· ~~M396 соседство, залы, ствол, сетка 6×4~~ — 0.396.0 (2026-09-06): `21a4-base-adj` — the nine rules
as a table with the pairs computed per cell (the vent rule column-only), `лазарет` and `мастерская`
added because two rules named modules that did not exist, halls of three identical modules in a row
at −30% energy with the whole hall taking any single blow, and the shaft as the sixth column: drawn,
walkable, and not a module. `baseCell`/`baseSet` now refuse out-of-grid addresses — column −1 used to
fold into the previous row and the scene drew a «РАДИАТОР» frame over the shaft. Suites in
`91zzzw-base`. **Deferred:** the hall's «one worker covers three» (assignment is per role, not per
cell, so it already holds) and the pipes drawn between adjacent cells — the rules are in the prompt
line for now, and the drawing belongs with the craft pass M404. ·
~~M397 директор~~ — 0.397.0 (2026-09-06): `21a5-base-dir` — one roll built from `worth` (built
cost + pool + crew skill), sector danger and a floor, capped at 0.35 a shift; the forecast is simply
the same pure function asked about `n+1`, so it costs nothing to store and cannot lie; the event
table is per world with the good share **computed** as a third of the bad weight so every world gets
its quarter; and the walking fire with `гермозатвор` as the only thing that stops it. **Measured:**
a modest rocky base at threat 0.065 sees an event every ~16 shifts, about a third of them good.
**Deferred:** the аврал (M398) — the fire the player fights with his own hands — and the war layer's
pirate roles in a raid, which arrive with §20's seam. · ~~M398 аврал~~ — 0.398.0 (2026-09-06): `21a6-base-avral` — one roll per visit at a quarter, forty
seconds, a two-second hold that people on that job and a neighbouring мастерская shorten, the cell
drawn with its own glow and the hold bar inside it, and a miss handing the trouble to M397's walking
fire. Node, browser and **mobile** tiers all green — the pass includes the phone check because a
held button is the thing that is easy on a keyboard and awkward on glass. **Deferred:** the
different cures per kind (fire/vent/flood all take the same hold today) and the crew handling an
аврал *while you watch* — today they only handle the walking fire that follows it. · ~~M399 устав~~ — 0.399.0 (2026-09-06): `21a7-base-charter` — four laws unlocked at 2/4/6/8 built
compartments, irrevocable by construction (there is no function that takes one back, and the suite
asserts that), each wired to something real: work multiplier, spirit, the director's threat, the
repair rate, the guest rate and the one-in-six guest who costs a third of the store two days later.
Taken at the desk, logged in the journal. **Deferred:** «сухой закон» halving the кают-компания
(that module is not built yet) and the other two faces of the bad guest — a fire and a rumour that
reaches the pirates; today he steals. **Stage B is closed** (M394–M399).

**C · тяжёлая игра** — ~~M400 формуляр планеты~~ — 0.400.0 (2026-09-06): `21a8-base-world` — eight
derived dials cached by address **and type**, wired to heat, panel yield, an air leak per shift,
build cost and drill yield, the director's storm and quake weights, free water and ore richness; the
site inside the planet shifts them; and §21.3's three levels of scouting — three words from orbit, a
300-credit probe on ЦЕЛЬ during approach for five dials, and all eight when you are standing on the
ground. Suites in `91zzzw-base`, and the base suites now pin a flat formulary so they measure people
and machines rather than the world. **Deferred:** the gas giant as a floating station with its own
build list (§21.2 says «later»), and «затопление» as the ocean's own walking incident — the fire of
M397 is the only kind so far. · ~~M401 девять законов~~ — 0.401.0 (2026-09-06): `21a9-base-laws` — the three laws that were not yet
standing. Law 3: `baseSharp` counts a радист and a working приёмник, and the gauges and the forecast
speak in words until they are paid for. Law 4: a per-shift drift on one compartment, scaled by
distance from the calm band and retuned after the first cut turned it from a law into a fault. Law
5: crew traits derived from the seed with a condition each. Plus the guard — `baseWhy` on the desk
row, always, naming the cause in the vocabulary the player has. **Deferred:** «не ладит с конкретным
человеком» (it needs a pair, and pairs need a list the player can read) and instrument wear feeding
back into the reading — today one working приёмник is enough. · ~~M402 развалина и
возврат~~ — 0.402.0 (2026-09-06): `21b0-base-ruin` — a base with no crew and empty stores for a full
day becomes a ruin with every cell at `hp:0`; a tenant moves in after twelve shifts, squatter or
pirate outpost by sector danger; recovery is always available — free when empty, 2 200 from
settlers, 6 500 from the outpost **or nothing if you clear the system yourself** (the existing war,
not a new scene); repair from zero costs a quarter of the build price per cell. Nothing is deleted
from the save in any state, and the suite checks that too. **Deferred:** the ПАЛАТА's seizure and
its auction (§40 — that is M408's tone pass), and the ruin as a rumour the world retells. · ~~M403 плата и блокада~~ — 0.403.0 (2026-09-06): `21b1-base-pay` — the unique output of a solved
base (техкомпоненты · гидразин · криоген · карбид), one unit each per four shifts, gated on world,
depth and the module that does the work; and the base as its owner's counter — ice into the tanks at
two per unit, alloy into the hull through the мастерская, both out of the base's own stores.
**Found here:** §23.1 names иридий and ксенобиом as the unique output, and both have a price in
`RES` — a base making them would print credits, which §23's own first line forbids. The list is now
built from `price:0` goods and the suite asserts the price of every row. **Deferred:** the
blockade's own gate — the counter works whenever you are at your base, and the blockade is what
makes it matter rather than what unlocks it. · M404 ремесленный проход по всей
сцене (`DESIGN-craft`, `look()`, its own almanac issue).

**D · человек** — M405 сотня и распределение (§34, §35, §48) · M406 охота (§24.4, §35.1) ·
M407 он строит и развивает (§24.6, §37).

**E · дело и мир** — M408 ПАЛАТА и станция платит, тон на максимум (§28–§32, §40) ·
M409 опорный пункт экспедиции (§44).

§46 and §50 are not passes: they are the register every line of the layer is written in, and a law
every pass is checked against.
