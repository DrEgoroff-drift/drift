# The game — logic, pressure, story, combat (design, 2026-10-09)

The author, 09.10.2026, after the remake moved everything into 3D: «а сам давай логику продумывай
игры … изучи структуру экономику сюжет, и думай как лучше и интереснее сделать на основе нашей
тематики, игра должна быть сложной, думай считай пиши логику, критикуй себя и еще раз пиши. Нужен
а крутая игра, чтобы всегда было что делать.» Then: «Сейчас скучно играть, надо сделать интересно.
Боевку еще посмотри сейчас она херовая, пойми как сделать и делай. Решай сам.»

This document is the answer. It is written in three passes in one file: §1–§8 the first draft,
§9 the hostile read of it, §10 the rewrite — what the second pass changes, and the queue (M900+)
that builders get. Where §10 contradicts §1–§8, **§10 wins**. Nothing here is built. Game text
stays Russian; the doc is English like the rest of `docs/`.

**Where it sits.** `DESIGN-remake.md` §0 says the remake does not move «what the player does, the
physics, the generation and the save». That still holds for M8xx. This is the programme *after* it,
M900+, and it moves exactly those things. Builders on M8xx do not read this as a brief.

**What was read before writing** (four survey passes over the docs and the code on 09.10, plus
`DESIGN-economy.md`, `ECONOMY-AUDIT.md`, `DESIGN-review-2026-09-14.md`, `DESIGN-first-hour.md`,
`DESIGN-quest.md`, `DESIGN-act2.md`, `DESIGN-war.md` §0–§5 and §18 stage A, `DESIGN-marks.md`):
the economy with every faucet and sink, the story organs and the hundred stories, the seventeen
modes and their verbs, the risk and failure layer, the remake laws.

---

## 1. Diagnosis — why it is boring, in numbers

The game has a world worth living in and nothing that makes you live in it. Six findings, each
measured, each with the file that proves it.

1. **Nothing bites.** There is no death and no game over (`16c-rescue.js:15`), credits never go
   negative (`ECONOMY-AUDIT.md:25` — «no debt»), a wreck costs cargo only (`28-loop.js:16-44`: the
   hull is rebuilt to 45 %, fuel to 30, the ship and every mod survive), a tow is free, wear costs
   at most 12 % handling and never the hull (`12s-wear.js:38`), hired hands are an 85 % bet, and
   manager wages come out of the cut, not the account (`12c-mgr-core.js:172`). Every system has
   a sentence saying it «never turns into punishment». Added together they say: nothing you do
   can go wrong, so nothing you do matters.
2. **Nothing demands.** An order lapses with a log line (`12aa-need.js:135-141`), an offer closes
   silently, a need goes unfilled and the station does not notice. The only clock on the player's
   neck is the ransom of a hired hand (+35 %/h) — one of forty earn sources. The world has
   magnificent clocks (сводка every 6 h, the front, the circular, «Сорока»'s three days) and none
   of them is pointed at the player.
3. **Money piles up and buys nothing.** Hand trade sustains 78–466 cr/min (`ECONOMY-AUDIT.md:138`),
   sinks are «deliberately small». The author's own line is in the code: «у меня полтора ляма, я
   должен быть король» (`16c-rescue.js:3`). The arc's law — «the game never hands out credits, it
   hands out access» (`DESIGN-arc.md:19`) — is written, and the game hands out credits.
4. **The ladder is painted on.** 24 of the 30 system rungs do nothing (`DESIGN-holding.md:391`),
   the researcher domain earns nothing, luxe hulls «never pay back», rare raws have no market
   («и нафиг они нужны», `02-world.js:14-20`), industrial goods sell only where you built the
   eater. Forty `earn()` call sites and none of them scales with anything.
5. **The story is watched, not played.** 72 chapters open «on a landing at a new, scenic kind of
   world» (`12ud1-smena-quest.js:1-12`) — the main quest is sightseeing. Act 2 is designed and
   partly coded, but `DESIGN-act2.md:11-17` admits it: «the world speaks, and nothing changes
   it». The hundred stories are the best thing in the game and nine of a hundred turn on a deed.
6. **The first hour has no reason to move** (`DESIGN-first-hour.md:32-39`), and after hour four
   nobody has walked it at all.

And one thing that is *right* and becomes the template: the landmark grammar of `DESIGN-marks.md`
— one exclusive fork per thing (**take** now and the thing dies, or **wake** it and it gives a
little every day), the risk is the suit, never death, no credits ever. That is what a decision in
this game should feel like. The rest of the game has to learn it.

---

## 2. The thesis — «Смена»

The theme is already written in `DESIGN-war.md:535`: *people nobody comes to relieve, and orders
nobody can cancel*. The game is that, played:

> You hold a watch. It is a stretch of the road with people on it who need things on a clock.
> Nobody relieves you. What you own wears out and eats. Money is never the goal — access is,
> and a name. The hard part is not earning; it is choosing what to let fall, because everything
> you let fall has a face and remembers.

Four laws of difficulty follow. They are the whole design; everything in §3–§8 is one of them
worked out.

- **D1 · Everything you own costs per shift.** Ship, hands, managers, drones, workshops, base
  people. The bill is one paper at every dock, one line per thing, each line with a voice. Idling
  is not free; the account can go below zero.
- **D2 · Every demand has a clock and a face.** Nothing addressed to you lapses with a log line.
  It lapses with a person, and the person is on your road tomorrow.
- **D3 · Choices are exclusive.** The landmark grammar everywhere: a deal, a job, an order, a
  rung — each is a fork with a shut side. You cannot do everything in a shift, by arithmetic
  (§4.3), and the game never pretends you can.
- **D4 · Real loss, no game over.** A hull can be lost. A workshop can burn. A manager can walk
  out with your flagship (already true). The floor is always there — a «Стриж» по разнарядке, a
  free tow, Тихий уезд — but the floor is a *floor*, not a trampoline.

Three guards against meanness, so that D1–D4 stay difficulty and not spite (the code's own
distinction, `12az-fx-nat.js:8-9`):

- **G1 · Foreseeable.** Every loss is announced by a thing you could have seen: the bill before
  the debt, the smoke before the fire, the deadline on the paper, the pirate's rank on his hull.
- **G2 · Voiced.** A fee is a paper with a voice or it goes (`DESIGN-review-2026-09-14.md` §1.5).
  «Страхкасса ГЛАВТРАССЫ: взнос за смену. Не задерживайте.» is a line; a silent −372 is a bug.
- **G3 · A way out that costs time.** Sell the drones, dismiss the hands, hand the watch over
  (§3.4), sit a week in Тихий уезд. Scaling down is always allowed and never shamed.

---

## 3. The clocks

Everything runs on clocks the game already has. No new unit of time.

| clock | length | exists as | what it does now | what it will drive |
|---|---|---|---|---|
| frame | 1/60 s | — | physics | — |
| **day** | 1 min of play | `CEL_DAY` | stories, offers, needs | story turns, landmark gifts |
| **shift** | 20 min | `HOLD_SHIFT`, station visit key | holding tick, appetite | **the bill**, the norm's step, wages |
| **сводка** | 6 h real | `12am-chron` | the war's step | **the norm's judgement**, the front at your door |
| season | 90 days (1.5 h) | winter job only | — | the weather of demand (§4.5) |
| year | 365 days (6 h) | endings' windows | endings | the record book's page |

**The session is three shifts.** One hour of play has one bill paid, one long order resolved,
one holding tick, one incident. The twenty-minute exam of `DECISIONS.md:155` stands: after any
shift the question is «захотелось самому сделать ещё рейс?», and §4.3 is built so the answer is
yes because something *is* waiting, not because something *might* be.

### 3.1 The bill — «СЧЁТ ЗА СМЕНУ»

At every dock, before the board, one paper. Lines, each with a voice, each a real transfer:

| line | per shift | voice |
|---|---|---|
| топливо | as bought | the pump: «Норма расхода. Перерасход — ваш.» |
| обслуживание корпуса | 3 % of hull list price × wear share | the yard: «Прошли бы ТО вовремя — было бы дешевле.» |
| Страхкасса | 2 % of hull list price (optional, §5.1) | «Взнос за смену. Не задерживайте.» |
| наёмные руки | wage × minutes on order (as now, `12a-crew.js:13`) | the hand himself, one line of character |
| управляющие | 52–70 × (1 + .18·(lvl−1)) per manager | **moved from the cut to the player** (§9 fork F2) |
| дроны | parts: 6 cr/min per drone (1.5 % breakdown per trip) | «Дрон 3 — замена форсунки.» |
| мастерские | 12 cr/min per workshop, in industrial goods if you have them | the holding's ledger |
| люди на базе | 1.4 cr/min per person, in ice and organics first | «Съели. Ещё хотят.» |
| взносы обществ | as now (`socDues`) | as now |

The paper is one plate in the hall (L1, L5) and one tap pays it. Unpaid lines carry over at
1 % per shift and open the ledger (§5.2). **The first hour has no bill**: ГЛАВТРАССА covers a
стажёр («Первая смена за счёт управления. Дальше — сами.»), and the paper appears at hour one
with that line on it, so the player meets it with a voice, not a number.

### 3.2 The norm — «НОРМА ПО УЧАСТКУ»

The watch is a **participation** (участок): the sector you were issued at the start plus any
you take over (§6). Every сводка the regional plan writes the participation's **norm**: the share
of needs and orders on its stations that were filled in time by anyone — you, barges, factors.
The player sees it only as paper: a line on the board («Участок 14-Б. Норма 71 %. План 103 %.»)
and a line in КНИЖКА. There is no bar, no HUD number, no marker; the rule of `DESIGN-quest.md`
§1.4 stands.

What the norm does:

- **≥ 90 % three сводки running** → an allocation: a hull по разнарядке (the «Вьюк» rule of
  `12j-home.js:69` generalised up the table), a clearance step, a named offer. Credits never.
- **< 60 %** → «срыв»: a line in КНИЖКА in ГЛАВТРАССА's voice («Участок не тянет. Отмечено.»),
  and the station keepers whose needs fell take it personally (§4.2).
- **three срывы in a row** → a door shuts (the existing `11ar-doors` organ), and the participation
  is *reduced* — a station is reassigned to a neighbour's watch. Smaller watch, smaller norm,
  smaller access. That is the game's demotion, and it is reversible by the norm.

The norm is the thing that makes «always something to do» true at the top: a player who has
everything still has a participation with a number on it every six hours.

### 3.3 The front at your door

The war already moves one or two systems per сводка. A participation that touches the front
gets what the war does to stations: occupation pays .90/.78/.62, needs double, orders stop.
Nothing new is built; the participation is simply where the player now *has* to care about the
front, because the norm counts occupied stations as unfilled.

### 3.4 Handing the watch over — «СДАТЬ СМЕНУ»

Before a long absence the player can hand the watch over at any ГЛАВТРАССА counter. A form
(birchpunk: three fields, a stamp), one shift to process. While handed over: no bill, no norm,
no income from anything but drones at half; the participation is held by «сменщик», a named
NPC who leaves a line when you return. Taking it back costs one shift and the сменщик's
opinion of what he found. This is G3 made concrete, and it is the only fix for «I came back
after a week to a mountain of debt» (§9.7).

---

## 4. The economy — pressure, not plenty

### 4.1 The target curve

Four tiers by what the player owns, the measured income, the proposed upkeep. The model is
`scratchpad/ecomodel.py` (assumptions in its header); every line below is an oracle for the
bot (§8).

| tier | hours | hull | gross cr/h | upkeep cr/h | net cr/h | pressure U/G |
|---|---|---|---|---|---|---|
| T0 | 0–2 | Стриж | 7 200 | 2 800 | 4 400 | .39 |
| T1 | 2–6 | Вьюк + 1 hand + 1 drone | 21 300 | 7 400 | 13 900 | .35 |
| T2 | 6–15 | Обод, 3 hands, 2 drones, 2 managers, 2 workshops, base of 8 | 37 200 | 23 000 | 14 200 | .62 |
| T3 | 15–40 | Мамонт, 5 hands, 4 drones, 4 managers, 5 workshops, base of 20 | 54 300 | 41 600 | 12 700 | .77 |

Read it: **net income stops growing after T1.** Owning more earns more and costs more, and the
curve flattens. That is deliberate — this is the game where a bigger estate is a bigger watch,
not a bigger pile. The pressure band to hold: **.40 at T0, .50 at T1, .65 at T2, .70 at T3**
(the model's T1 is too loose and T3 too tight; §10 adjusts). A bad hour at T2 — a hostage, a
raid, a wreck — is negative. A good hour is +20 000. The spread is the game.

Milestones at those nets (rough): first mod 7 min; «Вьюк» по разнарядке 25 min (3 000 turnover);
coop exam 1.7 h; first drone 40 min after T1; Обод + first manager 1.3 h into T1; Мамонт + two
workshops 2.3 h into T2; the garage (70 000 turnover) at ~4 h; an uninsured hull loss at T2
(Обод 15 000 + mods 8 000) is 1.6 h of T2 net. The designed curve of `DESIGN-economy.md:62`
(first mod 10 min, Вьюк 20 min, hire 1 h, manager 2–3 h, garage 5–6 h) survives within an hour.

### 4.2 Stations have three gauges, and they fall

Every station gets three numbers, lazy, saved as three bytes: **склад** (stock, 0–1), **люди**
(mood, 0–1), **порядок** (order, 0–1). They are already half there: appetite is stock, occupation
is order, the keeper's episodes are mood.

- A need unfilled through its window: stock −.2, and the station's **workshop stops** — the goods
  it makes disappear from its market for a сводка and appear as a *need at the neighbours*
  (the cascade). Mood −.1.
- Mood < .4: prices for you ×.92, the keeper's face, no named offers from this station, rumours
  about you travel one sector further than they should.
- Order < .4: pirates get a foothold (the existing `13b-occupy` spread gets ×1.5 here), the
  board has «Отбить» on it.
- Every filled need: stock +.3, mood +.05. Every freed system: order +.5. Every сводка: all three
  drift .05 toward .6 — the world heals slowly on its own, so a watch left alone is mediocre,
  not dead.

The three gauges are **what the walkable hall shows** (§7): crates on the counter are stock,
the number of people in the hall is mood, the lights and the picket at the door are order. No
number is printed; the hall is the gauge.

### 4.3 The dispatcher — always something to do, by arithmetic

A generator, not a scheduler, in the spirit of `storyTraces`: at every dock it reads the
participation and guarantees the board's К ВАМ lane has at least:

- **two demands addressed to you** by name (the board's paper notices of M814b are their form):
  one haul (наряд/нужда), one not-haul (dig a sample for the institute, fly a hand to a station,
  escort a barge one jump, walk to a landmark for the observatory's piece, talk to a man in the
  cantina for a keeper);
- **one «сейчас или никогда»** with a window under 10 min real — the alarm plate of M803/M826b:
  a barge's distress, a need that doubles for the next shift only, a pirate at a neighbour's
  door, a story turn that is leaving;
- **one long order** across three stations over the hour (the наряд generalised);
- the standing things: keeper supplies, expedition demand, the norm itself.

Rules of the generator: never the same verb twice in a row (variety over the last five);
weights by the three gauges (a station low on stock issues hauls; low on order issues «Отбить»
and escorts; low on mood issues people — talk, carry, bring the doctor); every item has a face
(a keeper, a clerk, a hand) and a clock; and **capacity exceeds the hour**: the four items above
take ~80 minutes of a T1 player's hour. You choose. The ones you drop go to the cascade (§4.2).

### 4.4 Credits buy things; access buys *the right* things

The arc's law applied to the catalogue. Credits remain the price; **access is the gate**, and
the gates are the organs that already exist and currently do nothing:

| thing | credits | and the gate |
|---|---|---|
| hulls up to «Скат» | list price | — |
| «Клинок», «Обод», «Топор» | list price | clearance II, or an allocation by norm |
| «Мамонт», catalogue line hulls | list price | clearance III **and** a named sponsor (a manager at lvl ≥ 3, a house, a keeper you supplied 8 visits) |
| rare and legend hulls | list price | never for credits alone: an allocation, a fuse, a renegade's hull taken back, the «Сорока» |
| weapons by family | list price | clearance I–IV as `DESIGN-war.md` §11.4 already says |
| tier-2 / tier-3 workshops | credits + alloy | rung 20 / 25 as now, **and** the norm ≥ 75 % last сводка |
| a second participation | — | three сводки ≥ 90 % and a stamp |

And the 30 rungs: every rung from 1 to 30 gets one line of consequence (a price, a face, a
right), no rung is silent. The table is the builder's (M905); the rule is: a rung is a thing the
*system* does for you, never a stat.

### 4.5 Seasons — the weather of demand

Ninety days (90 min of play) per season, four per year. A season sets the demand weather for the
whole galaxy, read on the board and in the ether: **зима** — ice and organics ×1.4, the winter job,
base food ×1.5; **весна** — builds (alloy, industrial ×1.3), workshops open; **лето** — travel
(fuel ×1.2, the sanatorium, passengers), «Сорока» lingers; **осень** — the plan closes (orders
×1.3, the norm judged harder: thresholds +5 %). A season is one byte and four multipliers; it
exists so that the same road is not the same road in hour three and hour nine.

---

## 5. Loss

### 5.1 The hull can be lost

`wreck()` changes: the hull, the mods on it and the hold are gone. The player gets a «Стриж» по
разнарядке at the nearest ГЛАВТРАССА station after a tow (5 min, as now), with a line in КНИЖКА.
What stays: credits, parts in the home garage, holdings, managers, drones, every acquaintance.

**Страхкасса ГЛАВТРАССЫ.** A line on the bill, 2 % of list price per shift, opt-in at any yard.
Insured: the same hull returns at the yard within two jumps after one shift, 55 % worn, mods
intact, hold empty. The «Стриж» is always insured for free. The premium is the line that makes
the Мамонт cost 1 440 cr/h to *own* — that is the point.

First-hour protections stay (landing ≤ 20 %, never fatal; a power's fire stops at 50 % hull in
the start system). The scoop's 18 % auto-abort stays. Nothing here is a surprise death: the hull
bar is the hull bar.

### 5.2 Debt — «Касса взаимопомощи»

Credits go below zero. The floor is **two hours of the tier's net** (T1 ≈ −28 000, T2 ≈ −28 000,
T3 ≈ −25 000 — the model's numbers; the rule is the ratio, not the number). While below zero:
1 % per shift on the balance, a paper on the desk in Тётя Устя's hand, and at the floor the
collector — one named episode, not a penalty: he sits in your cantina and the ДЕЛА page lists
what he will take first (drones, then workshops, then the hull). Pay above zero and he leaves a
line. The «Вы просто не тянете» door of `11ar-doors` is the long shadow of three visits.

### 5.3 What else can be lost, and what tells you first

| loss | already exists | what tells you first (G1) |
|---|---|---|
| a hired hand's ship, hostage, desertion | yes (`12b-crew-events`) | the order's risk setting and the sector's danger on the paper |
| a manager walks out as a renegade | yes (`12g-mgr-rogue`) | loyalty on his card, the unpaid line on the bill |
| a workshop burns / is looted | raid exists, destruction new | smoke in the holding's silhouette one shift before; guards on the bill |
| base people leave | new | hunger line on the bill two shifts before |
| a station reassigned off your watch | new (§3.2) | two срывы on paper before the third |
| a door shut | yes (`11ar-doors`) | the shut doors are listed on the desk |
| the hull | new (§5.1) | the hull bar; the rank on the pirate's hull |

---

## 6. Progression — access, name, participation

The ladder has three rails and the player climbs all three:

1. **Access** — clearance I–IV, the coop ranks I–III, the 30 rungs, allocations by norm. Gates
   on things, §4.4.
2. **Name** — the arc's one value, *named / not named*. Episodes in the 12-slot notebook,
   acquaintances, the kindness ledger. Gates on people: who offers, who vouches, who comes
   when you call. The record book is written by others; the player's own name is seen once.
3. **Participation** — the watch itself: one sector at start, up to four. The number on it every
   сводка. Gates on the world: what the plan sends you, what the front does to you.

The three rails cross: a hull by allocation needs the norm (participation) and a sponsor (name);
a second participation needs the stamp (access) and a сменщик who will vouch (name).

**The long arc stays as designed** — the 72 chapters of «Смена», the expedition of act 2, the
five endings in their windows. What changes (§7.3): chapters open on *deeds on the watch*, not
on landings at scenic worlds.

---

## 7. The world as a place — hall, landmarks, story

### 7.1 The walkable hall (M810–M815) as logic

Walking adds no verb. It adds **where people are**, and that becomes the logic:

- the keeper at the counter is the station's face: his mood is the station's (§4.2), his lines
  are the bill's and the board's voice;
- the clerk at the board holds the К ВАМ notices (§4.3); she hands you the «сейчас или никогда»
  paper when you walk in — it does not wait on the board;
- the crowd at the cantina is the mood gauge: three people at .6, seven at .9, one drunk at .3;
  what they say is the rumour channel, heard only if you pass by (`via:"cant"` already exists);
- the visitor by the window is the long order's face, or the сменщик, or the collector;
- the queue at a hub (birchpunk): at stock > .8 and mood > .7 the counter has a queue of three;
  you wait a shift's minute or you have standing (a named offer skips the queue, by name).

The hall never prints a number. The three gauges are read by looking (crates, people, lights).

### 7.2 Landmarks and obelisks — the grammar goes everywhere

`DESIGN-marks.md` stays as written; two extensions:

- **Obelisks are notches, and notches are the exploration arc.** The «Долгий Ход» left 100
  notches (`12q-lore.js`). Finding one is a chapter's *door* (§7.3) and gives one access line:
  a coordinate, a word for a monolith, a price lead. Carving your own notch below theirs is the
  settlement's standing (+mood at the nearest station) and the player's one permanent mark in
  the world — the only thing in the game that is never lost.
- **Every deal, job and order is a landmark fork.** Cantina deals already are decisions with a
  price; manager jobs are scenes; orders become forks too: *take the order* (the haul, the
  clock, the face) or *pass it to a hand* (your man goes, 85 % of the money, the 3 % catastrophe
  weight, and the keeper remembers that you did not come yourself). Nothing is «bring 10 ore».

### 7.3 The story, played

The story organs are good. What is missing is the *door* to each chapter being a deed, and the
chapters being on the road you are already on. Three changes, nothing new written:

- **Chapters open on deeds on the watch.** The next chapter's door is one of: a norm ≥ 90 %
  сводка, a срыв survived, a notch found, a hull lost and the «Стриж» taken, a door shut in
  your face, a hand ransomed, a story turned by your deed, a landmark woken, a watch handed
  over and taken back. The order stays strict (chapter N+1 after N); the door for N+1 is drawn
  from the set weighted by what the player has *not* done. The scenic-landing rule becomes the
  *place* the chapter card is painted at, not the trigger.
- **Act 2 lands on the participation.** The circular's demanded good is on *your* board; the
  barges leaving with people leave from *your* stations (mood −.1 each, a face gone from the
  hall); the six rivals' traces are at *your* landmarks. The sixth, Зоя Варламова, is met on the
  watch. «Есть место» is offered after the norm has been ≥ 90 % for a year — going is the ending
  that says the watch can be left.
- **The hundred stories turn on deeds, thirty of them.** Now nine. The deed keys exist (`hand`,
  `seams`, `card`, `wall`, `tinfed`); the new ones are the watch's: `norm`, `srv` (срыв), `bill`
  (paid a stranger's bill), `notch`, `handover`. Thirty stories get a turn on one of these. The
  rest stay unexplained, as the law says (a third never are).

The main quest keeps its laws: no «нужно», no marker, the desk is the journal, the name is seen
once. The difference is that the player now *does* something between chapters, and the chapter
is what the something was.

---

### 7.4 The story as it will be played — the eight parts on the watch (second pass, 09.10)

§7.3 changed triggers. The author said «сюжет нужен, посмотри наш который есть» — so this is
the existing story (`docs/saga/КНИГА.md`, 72 chapters in eight parts, the value **НАЗВАН / НЕ
НАЗВАН**, the two ledgers «вселенная прощает, люди помнят», the four turns, the lamp) laid
over the shift of §2–§5, part by part. Nothing new is written; the shift is what makes each
part *playable* instead of *read on a landing*. The rule that binds every row: the player is
never told the value's name. He is named, or he is not, and the work is the same either way.

| part (chapters) | what the book does | what the watch does — and which M builds it |
|---|---|---|
| **I. Подряд** (1–9) | he learns the work; his name is said once; the first line in the ledger nobody keeps | the first watch (§10.7, M909): two addressed items by minute 2, the urgent one by minute 6, the first «Сдать смену?» on the first quit. The one number per chapter the book demands is the shift's: the bill of the first hour is *one line* (fuel), and the dispatcher reads it aloud. Chapter 3 «Почтовый круг» is the mail circle (`11e-post`) — the first *named* offer, and the one place where the ledger shows for a second (the old man writes your call sign under his). Door for II: a norm ≥ 90 % on any сводка |
| **II. Плечо** (10–18) | he is good; the people who stay appear | the four (`12u-folk`: Гуся, Рыба, Гвоздь, Птица) are *on your participation* — they take your orders as hands (M911: the fork «take / send a hand»), and the bill's people-lines (§10.1) are *their* lines. Гуся never flies: his order is the one you must carry yourself. Door for III: a hand ransomed, or a named offer taken |
| **III. Соседи** (19–27) | the first big opportunity and the first real failure; nobody is angry | an order lapses into a face (§3.2 G2): the first time the dispatcher's line is «ничего для вас нет» after a missed clock — and he greets you as warmly as before. The three просёры (`27d` cantina hours, Птица, `11t` rumours) close doors the same way: the named offers from that person stop, nothing else changes. Door for IV: a door shut in your face |
| **IV. Счёт** (28–36) | doors close one by one; none slams | the bill (M904) and the ledger (§5.2): the first negative hour is this part. The debt floor is voiced by the dispatcher in the book's register — no «долг», one line about the Касса. Chapter 35 «Счёт» *is* the bill's first full paper. Door for V: a срыв survived |
| **V. Прибой** (37–45) | he compares logs and sees what he missed for years | the misclosure of act 2 (M155): the norm's сводка and the ledger disagree in one region — the tapes against the sky. Chapter 36 «Своя невязка» is the player's own: the bill says one thing, the plan says another, and the Глобус's second hand points at nothing. Door for VI: a notch found (§7.2) |
| **VI. Раскол** (46–54) | **the Blade**: he goes for Гуся knowing the fuel will not bring him back; nobody asked; Рыба comes, who does not sleep | §5.1 is what makes the Blade possible at all: the hull can be lost, so the run is real. Once per game: Гуся is stranded on a world past your fuel; no order, no plate, one line from Рыба on the receiver. If you go and the fuel runs out, Рыба tows you — the one rescue the game ever hands you, and the «Стриж» по разнарядке is *not* offered that time. The captain (§8) is this part's pirate: you cannot kill him, you leave or you pay. Door for VII: the Blade taken, either way |
| **VII. Тишина** (55–63) | the expedition leaves; nobody names him; the work is the same | the dispatcher goes with the expedition (§10.3): no more addressed items from him, the board still fills by arithmetic (§4.3), the norm still counts. «Есть место» (chapter 61) is the ending the participation offers after a year of ≥ 90 % — leaving is a door, not a reward. Solitude is allowed *only here*, and it is made of the absence of one voice, not of empty systems |
| **VIII. Тихоня** (64–72) | debts return in the wrong order; he stops being the named one and becomes the one who names | the handover (§3.4): the player's сменщик is one of the four, named by the player; «По списку восьмой» is said *at his side* to someone else (turn 3). Тихоня's hundred notches are the obelisk grammar (§7.2): the eighth column, «кто принял», is empty until the player leaves his mark for a stranger (Q12). The record book is written by others (M161); the board grounds him — he signs it. The finale is the nights-at-home counter (Q11): the game has counted them from minute one and nearly everyone's is zero |

**Three laws this pass adds to the shift** (they come from the book, and §2–§5 must obey them):

1. **The dispatcher is not one more voice — he is the watch's «я тебя назвал».** Every addressed
   item on К ВАМ is him naming you; every lapse is him *not* naming you next time, in the same
   warm tone. He must be one of the book's registers, not a fifth type: he is the clerk of the
   regional plan (§10.3), he leaves in VII, and his 72 lines are the chapters' plates. His name
   is never asked; the player learns it from the record book in VIII, the way the player's own
   name is learned.
2. **The bill is never the story's villain.** The book's cruelty is that nobody reproaches; so a
   negative hour, a lost hull, a lapsed order get one line of weather, never a sermon. The
   «ПОМЕХА» and «ЗАКРЫТО» voices of §3 are the book's «ничего для тебя нет» and must sound like it.
3. **The ledger nobody keeps is the kindness ledger (`11ai`), and it stays invisible.** The
   shift adds deeds to it (a stranger's bill paid, the Blade, a hand given away before the
   norm) and never shows a number. Turn 2 of the book — «к полётам не допущен» is his eighth
   column — is the one time it is read back, in VIII, by the board.

**What this costs the queue (§10.8):** M905 (the dispatcher) gets the rule that his lines are
drawn from the chapter table (`12ud-smena-text`, `SMENA_TITLE`) by part, not written new; M909
(the first watch) owns chapters 1–9; M910 becomes «parts II–VIII on the watch» with the door
table above as its test (a save at part N opens N+1 only through the named door, and the probe
drives the deed); M911 adds the Blade as a scripted once-per-game run. Nothing else grows.

---

## 8. Combat — measured, fixed, and what «good» means

The design of `DESIGN-war.md` §1–§5 is right and most of it is built (M360–M388). The author
still said «херовая». The fault was not design; it was that **nobody had measured a fight**.
`tests/91zzzw-fightsim.js` («проба · дуэль», M901, 09.10) runs the real helm, guns, roles and
shot loop under Node for six scripted players (dummy / turret / kiter / flanker / orbiter /
leaver) against four sets (one jackal, two, a veteran, a captain) on three dangers and four
builds («Стриж» w1, «Стриж» w2, «Вьюк» w2, «Топор» w3), 257 rows in 40 s. Run it after a
build: `node test-node.js --only="проба · дуэль"` (`FIGHT_QUICK=1`, `FIGHT_TRACE=1`,
`FIGHT_PICK="topor w3 капитан 0.5 flanker"`).

**What the probe found on the first run (all fixed in 0.493.0–0.493.1, M902a/b):**

1. **The pirate speed cap never held.** `ROLE_LIM` was applied and then overwritten by the
   nose-blend block with the old magnitude. A fleeing jackal reached 21 px/frame against a cap
   of 5.2 — 58 000 px in two minutes — and nobody noticed because nobody measured.
2. **The flee jump never fired.** It lived inside the role tick, which runs only while the
   pirate sees you; the runner left sight before his clock and flew for ever. `roleJumpDue` now
   fires from `13-pirates` whether he sees you or not.
3. **The captain could not be fought by anyone.** His jammer removed the lock within 600 px
   (nobody aiming by mark could shoot at all), he turned at 170°/s with a front shield, and he
   backed away for ever under 700 px — there was no side to reach. Every build from «Стриж» to
   «Топор» w3 died in 120 s with 0 hits. Now: the jammer keeps the mark and slips the aim (half
   lead, ±4°, «ПОМЕХА · НАВОДКА ПЛЫВЁТ»), he turns at 41°/s, backs off only under 400 px and
   holds ground between 400 and 700.

**Measured after the fixes (danger .5 unless said; «Стриж» w1 = stock):**

| fight | stand still | flank / orbit | leave |
|---|---|---|---|
| 1 jackal | 5–9 s, −27 % hull; at .5 he flees under a quarter | 9–17 s, −1…−14 % | clear in 16 s, −27 % |
| 2 jackals | −69 % at .5, dead at .8 | 19–28 s, −3…−22 % | clear in 17 s, 0 % |
| veteran | dead at .5 and .8; −66 % at .2 | 10–18 s from behind, −0…−6 % | clear in 8 s, 0 % |
| captain | dead on every build | «Стриж» drives him off in 30–38 s at −28…−38 %; «Топор» w3 kills in 15–25 s at −11…−27 %; «Вьюк» dies | clear in 10 s, one missile: −20…−50 % |

Hit rate of the autofire 30–60 % on crossing targets, 75–100 % on a dummy; the energy bar
never emptied in any row. Kiting (nose on him, flying away) fires almost nothing and is the
wrong verb — leaving is the verb, and it works.

**What «good» means, re-stated against the table:** a stock ship *wins by flying*, not by
sitting — met on every set but the captain, and the captain is a «leave or pay» encounter for
a «Стриж» and a kill for a warship, as §2 wanted. The remaining gaps:

- **TTK at danger .2 for a slow hull.** A «Вьюк» w2 at .2 against one jackal reaches neither a
  kill nor a flight in 120 s when it flies (the jackal breaks past 650 px and the slow hull never
  closes); the same rows at .5 resolve in 10–17 s. Wanted: the jackal's break returns to a dash
  within 3 s wherever he is — measure after M902c.
- **The bounty.** Under a quarter a lone pirate runs and jumps in 3–4 s; a stock gun at 19 dmg/s
  catches him about half the time. That is by design (the chase is the last 4 s of every
  fight), but the player must *see* the jump coming: his burn, and «уходит» on the plate (G2).
- **Readability** (unchanged from the first draft): rank on the hull before the fight (L7:
  8 px, half a second), shield type by where it glows, the rear-hit ×1.6 as a brighter hit, the
  jackal's break telegraphed by his burn. Readable with the HUD off.
- **The duel room.** The стрельбище at yards becomes the test the player can buy: a 60-second
  duel against each rank for 50 cr, the probe's rows as its pass marks.
- **Stakes.** With §5.1 the fight has a cost; the salvage (the tow after a kill) is the money, a
  captured hull is access (§4.4), the bounty stays small.

---

## 9. The hostile read — what is wrong with §1–§8

Read the way the rulebook demands: one's own work meaner than anyone else's.

1. **It is a tax, and taxes are not fun.** §3.1 is nine lines of bills. The 14.09 review cut
   exactly this («penalties are not humour… a bill with no voice is a grind»). Voices on the
   lines are not enough if the player's hour is spent *paying*. — Half right. The bill must be
   *one tap*, the lines must be mostly *people* (wages, food, the hand's own line), and the
   player must feel he is feeding a crew, not a treasury. Fuel and service already exist and are
   paid; what is new is wages and insurance — two lines, not nine. §10 cuts the paper to five
   lines and makes three of them people.
2. **The norm is a quest log with a stamp on it.** §3.2 is a percentage judged every six hours;
   the author rejected «ничего не обращено к игроку» being broken. — Partly. The norm is written
   *about the participation*, not to the player; it is on paper in a voice, never on the HUD;
   and it is thematically exact. But §3.2's thresholds and «three срывы» read as a progress
   system. §10 keeps the norm and strips it to one line per сводка and one consequence per
   direction; the «reduced participation» mechanic stays because it is the only demotion the
   game has.
3. **Six of everything, again.** Three gauges per station, four seasons, three rails, a
   generator with four guaranteed items, a дispatcher, a сменщик, a collector, an insurer. The
   14.09 review's first fault. — Guilty. §10 cuts: seasons go (one byte, four multipliers, and
   nobody will feel them before hour nine; the winter job already is a season); the collector
   and the сменщик become one person, the regional plan's clerk, who appears in both roles; the
   three gauges stay because they replace three things that already exist separately.
4. **Hand trade still wins.** Nothing in §4 lowers Вьюк's opening laps (1 900–2 400 cr/min) to
   the 500–900 target. Pressure on the sink side does not fix a faucet. — Right. §10 adds the
   faucet rule: the counter cap of 60/150 is the *appetite* (the first N units pay +35 %, the
   rest −35 % immediately, pressure recovering as now). That alone brings a lap to ≤ 900.
5. **The numbers are a model, not a measurement.** §4.1 is a Python script with twelve
   assumptions. — Right, and said so. Every row is an oracle, and M903 is the bot that walks each
   tier for three hours under Node (the way warsim measures the war) before any tuning goes in.
   The pressure band is the target; the lines are the first guess.
6. **Loss without death is still softened.** The hull is lost but a free «Стриж» appears in five
   minutes. Is that hard? — It is hard enough *at the tier*: losing an Обод with mods is 1.6
   hours of T2 net, and the «Стриж» cannot carry the watch (hold 40 against orders of 10–30
   units), so the norm falls that сводка. The loss is time and standing, which is what this
   game has always charged. A death screen would be cheaper and worse.
7. **Offline is negative at T0–T2** (model: −700 to −950 cr/h, −17 000 to −23 000 over the 24 h
   cap). A player who leaves for a day returns at the debt floor. — The cap must be *one hour of
   tier net*, not 24 h of drain, and the watch handover (§3.4) must be offered on *every* quit
   («Сдать смену?» — one tap, no form) so the default for leaving is the safe one. §10 fixes
   both.
8. **The story section changes triggers, not content.** «Chapters open on deeds» is a rule, not
   a story. Where is the person who makes you care? — The person is the *сменщик*: the one who
   holds your watch when you are gone, who leaves lines about what he found, who is the one
   face the player meets every time he comes back. He is the game's Vega for the road. §10
   gives him a name, a hull, an arc across the 72 chapters, and makes him the sixth rival's
   colleague — so act 2 takes *him* away.
9. **Combat has no decision in it.** §8 tunes numbers. A fight with the right TTK is still
   «hold the nose on him». — Right. The decision already designed and not felt: the **shield
   type** (where to hit), the **rear rule** (where to be), the **break-off** (chase or let the
   bounty go), the **energy bar** (fire or regen). §10 adds the one thing that makes them felt:
   the fight has a *second* verb besides shooting — **«ОТПУСТИТЬ»** at any time: cut the lock,
   the pirate takes the dropped cargo pod (one hold slot, your choice which) and leaves. Every
   fight is then a decision: pay or fight, and at danger .8 with a hostage on board, paying is
   right. The rescuer rule (§6.4 of the war doc) makes it honest: the neutral who pays is not
   a coward, he is a trader.
10. **The first hour is not designed here.** §3.1 waives the bill; nothing else. — §10 writes
    the first hour as the first watch: the clerk hands you the participation, one station, one
    named need, one «сейчас или никогда» in the first ten minutes, the bill at hour one with the
    стажёр line, the сменщик introduced at the first undock.

---

## 10. The second pass — what changes, and the queue

The thesis of §2 and the four laws stand. The following replace their sections.

### 10.1 The bill is five lines, three of them people

| line | voice | note |
|---|---|---|
| топливо и ТО | the yard | existing costs, now on the paper |
| руки | the hand's own line | wages while on order, as now |
| управляющие | the manager's own line | **new: paid by the player**; the cut stays his |
| люди на базе | «Съели. Ещё хотят.» | new: 1.4 cr/min each, in goods first |
| Страхкасса | «Взнос за смену.» | opt-in; «Стриж» free |

Drone parts and workshop upkeep go *inside* the drone's and the workshop's own line of income
(net shown, cost in the tooltip) — the player sees fewer lines, the model's numbers hold. The
first hour has no paper; the paper arrives at hour one with the стажёр line.

### 10.2 The norm is one line per сводка

«Участок 14-Б. Норма 71 %.» on the board and in КНИЖКА, once per сводка. Up: ≥ 90 % → one
allocation or clearance step per three сводки. Down: < 60 % → one срыв line; three running → one
station reassigned. No other thresholds, no other consequences. The participation is the
player's; its number is the world's opinion of his watch.

### 10.3 The clerk — one person for the plan

**Диспетчер участка** — one named NPC per participation (the person generator, L3), met at the
first dock. She (the generator decides) hands the participation, reads the norm, holds the watch
when you hand it over, writes the срыв lines, and comes to sit in your cantina when the ledger
is at the floor. One face for the plan, the demotion, the handover and the debt. In act 2 she is
the one the circular takes: she goes with the expedition, and the last tape a year later is
hers. Her 72 lines are the 72 chapters' voice — the book's narrator, in the game, is her.

### 10.4 Seasons are cut; the appetite is the faucet rule

Seasons go. The faucet rule: a station's appetite (the first N units per shift) pays +35 % as
now; **every unit past it pays −35 % at once** (today's pressure floor, reached immediately
instead of over 70 units), recovering with the 3 h half-life. Oracle: a «Вьюк» opening lap
≤ 900 cr/min; a «Стриж» lap unchanged (its 40 units sit inside appetite).

### 10.5 Offline and quitting

Offline drain is capped at **one hour of tier net** regardless of time away; passive income
(drones, workshops) runs at 60 % to the same cap. On every quit, the menu's one tap is
«СДАТЬ СМЕНУ» (default) or «ОСТАВИТЬ ЗА СОБОЙ»; handed over, nothing runs and nothing is owed.
Taking the watch back costs a shift's minute at any counter and the диспетчер's line.

### 10.6 Combat gets its second verb

Everything in §8 stands (the three bugs are fixed and the table is measured), plus **«ОТПУСТИТЬ»** (phone: the ЦЕЛЬ button held; keyboard: X):
drop one chosen hold slot as a pod, the locked pirate takes it and jumps, the fight is over,
one line in КНИЖКА in his voice. A jackal takes any pod; a veteran wants the dearest; a captain
takes the pod *and* a hand if you carry one; a baron does not deal. The pod is the fight's
price, visible before the fight (the rank on the hull, G1). The rescuer rule stands: a neutral
who pays stays neutral.

### 10.7 The first hour is the first watch

Minute 0: the диспетчер at the first counter hands the participation — one station, hers.
Minute 2: one named need on the board, addressed, with a face and a 15-day window. Minute 6:
the first «сейчас или никогда» — a barge's pod drifting off the station, 8 minutes. Minute 10:
the first undock; she says the line that names the watch. Hour 1: the first paper with the
стажёр line. Four ether lines of `11ao-firsthour` stay. The eight board sections stay; the
К ВАМ lane is first and has two things in it.

### 10.8 The queue — M900+

Build order; each closes on its own and is measured by the bot before the next starts. Builders
read §2, §10 and the one section named in their brief. Tests live beside the thing.

| M | what | gate |
|---|---|---|
| M901 | `tests/91zzzw-fightsim.js` — the duel measured under Node — **done 09.10** | the table of TTK / hits / hull by hull × gun × rank × danger |
| M902 | a/b **done 09.10** (cap, jump, captain, jammer); c: the slow-hull TTK at .2, readability, the стрельбище duel, «ОТПУСТИТЬ» (§8, §10.6) | the §8 table holds as `91zzzw-duel` asserts; the стрельбище sells the duel |
| M903 | `tests/ecosim.js` — three hours per tier under Node, gross/upkeep/net | the §4.1 oracles within ±20 %; a «Вьюк» lap ≤ 900 |
| M904 | the bill (§10.1), manager wages to the player, insurance, the ledger (§5.2), hull loss (§5.1) | the bot at T2 ends a bad hour negative and a good hour +15 000; the floor holds |
| M905 | the participation, the диспетчер, the norm line, the handover, reassignment (§3.2–3.4, §10.2–10.5) | the bot's norm moves with filled needs; handover stops every clock |
| M906 | station gauges and the cascade (§4.2); the hall shows them (§7.1) | an unfilled need produces a neighbour's need within one сводка; the hall's crowd follows mood |
| M907 | the dispatcher generator (§4.3) | at every dock К ВАМ has ≥ 2 addressed + 1 urgent; verbs vary over five |
| M908 | access gates and the 30 rungs (§4.4) | no rung silent; «Мамонт» refused without clearance III + sponsor |
| M909 | the first watch (§10.7) | a fresh save: two addressed items by minute 2, urgent by minute 6, paper at hour 1 |
| M910 | story doors on deeds, the диспетчер's 72 lines, 30 stories on watch deeds, act 2 on the participation (§7.3, §10.3) | chapter N+1's door is a deed; the sixth is met on the watch |
| M911 | orders as forks (take / send a hand), obelisk notches as the exploration arc (§7.2) | every order has both sides; a found notch gives one access line |

Not built, and said so: anything that needs a new screen (none above does), a new currency
(none), a reputation number (never), a difficulty slider («the planet is the difficulty»),
real-time simulation while away (lazy with cap, as `DECISIONS.md:53`).

### 10.9 Forks the author should know about (defaults chosen)

- **F1 · Debt exists.** Breaks «no debt» (`ECONOMY-AUDIT.md:25`). Default: yes, floored at two
  hours of tier net, voiced. Price if refused: D1 loses its teeth; the bill becomes advice.
- **F2 · Manager wages are the player's.** Breaks «the cut pays the wage» (`CLAUDE.md`). Default:
  yes; the cut stays as the manager's own money and his loyalty. Price if refused: T2–T3 pressure
  falls from .65 to .45 and estates are free.
- **F3 · The hull can be lost.** Breaks «a wreck costs cargo only». Default: yes, with Страхкасса
  and a free «Стриж». Price if refused: combat has no stakes and §10.6 has no reason to exist.
- **F4 · Orders expire into faces, not log lines.** Default: yes. Price if refused: D2 is gone.
- **F5 · The norm.** Closest thing to a progress number the game has ever had. Default: one line
  per сводка, paper only. Price if refused: nothing at the top says what to do next.

---

*Judged against the remake laws:* nothing here adds a screen (L1 — every new thing is a plate
in a place), every face is the person generator (L3), every paper hangs on a thing (L5), and
the hero of each frame is the thing the player is about to act on (L6) — the clerk with the
notice, the pod drifting, the rank on the hull.
