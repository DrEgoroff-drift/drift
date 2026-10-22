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

### 4.1a Measured — M903, 14.10 (`tests/91zzzw4-ecosim.js`, one hour per tier under Node)

The probe plays the mining loop with the real `G`: lands, drills, sells, refuels, repairs, books
every credit by phase. Numbers after the three bugs it found were fixed (deposits under the
settlement wall, the silent wall branch, drones that never finished a trip — all in 0.493.5).

| tier | gross cr/h | upkeep cr/h | net cr/h | U/G | oracle net | drones cr/h |
|---|---|---|---|---|---|---|
| T0 Стриж, 14 laps | 15 275 | 3 607 | 11 668 | .24 | 4 400 | — |
| T1 | — | — | 43 498 | — | 13 900 | ≈500 (42 trips) |
| T2 | — | — | 47 193 | .06–.07 | 14 200 | — |
| T3 | — | — | 46 923 | .06–.07 | 12 700 | ≈1 860 |

Read it: **the loop pays 2.6–3.7× the oracle and the pressure is a fifth of the band.** Fuel
(≈2–2.6 k/h) and repair (≈0.5–1 k/h) are not pressure at any tier. The flattening after T1 is
there — but at three times the height. A hired hand ran 3 trips and lost 655, as designed.

The levers, in order of honesty: the lap (≈4.3 min at T0 — the oracle wants ≈8), deposit size
and the sale price of the first raw tier, then the bill of §10.1. Upkeep alone cannot close a gap
of 3× without making the T0 hour negative. This is M904's input: the bill is built against
**these** grosses, not the model's.

**After M904d (0.496.0, 14.10).** The lever that worked is the deposit's type, not its size: a dear
ore keeps its deposit with weight 17 / price, else the profile's cheapest ore (`21pzc-dep-value.js`).
Thinner dear veins were tried first and made T0 *richer* (the bot reached cheap deposits sooner). T2
and T3 now insure; two rows crash the T2 hull at 30 min.

| tier | gross | upkeep | net | U/G | oracle net |
|---|---|---|---|---|---|
| T0 Стриж, 14 laps of 4.3 min | 10 429 | 3 607 | 6 822 | .35 | 4 400 |
| T1 Вьюк, 1 hand, 1 drone | 24 458 | 3 246 | 21 212 | .13 | 13 900 |
| T2 Обод, insured | 26 805 | 11 933 | 14 871 | .45 | 14 200 |
| T3 Мамонт, insured | 26 365 | 19 448 | 6 917 | .74 | 12 700 |
| T2, uninsured wreck at 30 min | 20 235 | 34 771 | −14 535 | — | negative |
| T2, insured wreck at 30 min | 23 438 | 11 762 | 11 676 | — | — |

Read it: hand mining is walk-bound — every hull from Вьюк up grosses ≈25 000, because the bot visits
about ten deposits a lap whatever the hold; the tiers differ by what they own, as §4.1 wants. Three
gaps stay, each with an owner: **T0** nets 1.5× the oracle on a 4.3-min lap a human will not fly
(M909 measures the first watch with its own oracle); **T1** has nothing to pay but fuel and one hand
(U/G .13 against .50 — the drone's parts line of §3.1 would make a 500 cr/h drone worthless, so it
waits for a drone that earns); **T3**'s managers cost 3 700 cr/h each and produce nothing in the
probe, which builds no workshops and no base. M905/M906 did not give them work the probe can count
(the gauges have nothing for a manager either): open, for M907.

### 4.1b Measured after the dispatcher — M912, 22.10 (three hours per tier)

M907–M911 changed the faucet of demand: К ВАМ with two addressed and one urgent at every dock, the
access rungs, orders as forks. The probe now plays the dispatcher between laps the way a careful
player would: it walks the legs (jump, dock, land, cantina, cargo bought at the nearest shop), takes
only paper that pays for its goods and fuel, urgent first, then by net per estimated minute, and
skips paper with a fight in it. A fresh save gets its own row: 600 cr, no flight preset, the first
watch from minute zero. Purchases for cargo paper are taken off gross, not booked as upkeep — U/G is
the pressure of keeping things, not the turnover of goods. Every row is three hours; «было» is the
last line of §4.1a (one hour, M904d).

| tier | было net | стало net | oracle | vs oracle | стало U/G | band | dispatcher cr/h | mining only, net |
|---|---|---|---|---|---|---|---|---|
| T0, fresh save | — | 5 514 | 4 400 | +25 % | .51 | .40 | 2 630 (13 deeds) | 6 282 (.37) |
| T0 Стриж | 6 822 | 6 898 | 4 400 | +57 % | .48 | .40 | 3 622 (16) | 6 118 (.38) |
| T1 Вьюк, 1 hand, 1 drone | 21 212 | 20 704 | 13 900 | +49 % | .24 | .50 | 8 863 (30) | 17 000 (.15) |
| T2 Обод, insured | 14 871 | 12 199 | 14 200 | −14 % | .57 | .65 | 5 434 (20) | 14 739 (.46) |
| T3 Мамонт, insured | 6 917 | 7 294 | 12 700 | −43 % | .78 | .70 | 9 552 (24) | 7 890 (.72) |
| T2, uninsured wreck | −14 535 | −694 | negative | ✓ | 1.03 | — | 3 802 | 1 538 |
| T2, insured wreck | 11 676 | 11 516 | — | — | .58 | — | 5 726 | 12 353 |

(The wreck falls at half the run — 1.5 h of three, not 30 min of one — so its loss is spread over three
hours; the hull loss is the same 8–11 k.)

**The «Вьюк» lap.** 5.0 min with the dispatcher, 5.9 mining only: 457 and 335 cr/min, under 900.

**The norm moves with filled needs.** Judged per сводка over the run, with the player and on a copy
with the player's fills and orders removed: 81–90 % against 76–79 % at every tier (19–22 needs,
12–14 windows). The player is the 5–11 points that lift a station over the 80 % line.

**The first hour of a fresh save** (minutes of play): two addressed items at 0.2, urgent at 6.0,
the watch line at 0.2, the first hour and the first watch end at 60.2, the стажёр paper at
60.2–60.7, the mutual-aid debt never above 0. Credits from 600: 1 551 at minute 2, 2 306 at 6,
5 276 at 60 (dispatcher) / 7 043 (mining only); the first hour nets 4 700–6 400 against the
oracle's 4 400.

**What a player gets done in the first hour** (22.10, after main 0.499.19). The fresh-save row now
buys like a player: it boards the allotted «Вьюк» at the next dock, then one module per dock in the
order hold, drill, hold, drill, engine, keeping 900 cr for fuel and repairs; purchases are their own
line, neither upkeep nor gross (`ECO_BUY=0` gives the old Стриж-only row). Minutes of play, with the
dispatcher (`ECO_TIERS="T0 " ECO_FRESH_H=3`); mining only in brackets where it differs:

| first | minute |
|---|---|
| undock, landing, sale | 0.2, 0.3, 1.7 |
| deed 1 / 3 / 5 | 2.3 / 8.5 / 20.5 (none) |
| cash for the first hold (900) and drill (1 250) | 1.7 |
| turnover 3 000 = the «Вьюк» allotment, boarded | 8.3 (12.5) |
| modules bought: hold 1, drill 1, hold 2, drill 2, engine 1 | 5.8, 20.3, 45.7, 56.2, 61.9 |
| cash for the first drone (9 000), with modules bought first | 112 (113) |
| two addressed / urgent | 0.2 / 6.0 |
| the hour ends / the стажёр paper and the three-station order | 60.2 / 62.0 |
| coop exam, clearance II, first kill | not in three hours (the bot does not fight) |

At minute 60: 1 202 cr in hand after 9 031 invested, turnover 16 958, 11 laps, 70 deposits, 6 deeds
for 3 750 cr (pod 2, probe, convoy, SOS, double), 6 lost by deadline, 12 jumps, 4 systems. Hours
two and three net 14–16 k/h on a «Вьюк» with two holds and two drills; the three-hour row is 18 428
(mining only 15 429), U/G .26.

Read it: **T0 lasts eight to twelve minutes, not two hours.** The allotment at turnover 3 000 is
§4.1's own milestone («Вьюк» по разнарядке, 25 min at the oracle's 7 200 gross; the bot's
4-minute lap gets there in 8), and the «Вьюк» doubles a hand lap's gross at once. So the oracle's
T0 row (Стриж, 0–2 h, 4 400) describes a quarter of an hour; from there to the first drone (≈ 2 h)
the player is on a T1 hull without T1's hand and drone, and nets about T1's oracle. Not changed,
on purpose: the allotment is the author's cut of the dullest stretch of the start (M152e), and
the deeds of the first hour pay their fuel (≈ 60 % of their gross goes on jumps) but stay worth a
few minutes each. The lever if the start should be slower is the allotment threshold (12j), not
the dispatcher; it is listed under Disputed in the M912 report.

**What the probe found and what was fixed** (one commit each):

- **The first hour counted flight, not play.** `firstHour()` read `G.flownMs`, which advances only
  in system, belt, landing and scoop; a fresh save that worked the dispatcher had flown 11 of its
  first 90 minutes, and the стажёр paper, the end of the first watch and the bill came after about
  eight hours of play. `28v-playhour` counts play time (every running tick outside the dock),
  saves it, and `firstHour()` is `max(play, flown) < 1 h`; the watch menu asks `firstHour()`.
- **The probe hired managers and gave them no orders.** A factor without «водить постоянно» moves
  no credit (`mgrWorkFact`); the probe now gives each domain its main order and hires the factor
  first, as a player paying wages would. T2 went −56 % → −14 %, T3 −83 % → −43 %; the domain line
  («tick» in the probe) is 7 900–9 500 cr/h at T2–T3.
- Tried and reverted: pay by effort (minutes of legs × the hand-mining rate). It ignored the fuel of
  each jump (130–250 cr), made urgent paper lose money and took nothing off the T0/T1 excess,
  which is the mining lap's. The pays of §4.3 stand: net ≈ 220 cr/min, urgent ≈ ×2 — a premium,
  not a second economy.

**At a human's pace** (`ECO_HUMAN=1`, 22.10). The bot flies a lap in 3.8–4.1 minutes; a person
does not. The probe now pauses where a person would: 13 s on each landing approach, 4 s to pick
each deposit, 20 s at each dock for the сводка and the board, 7 s at the map before each jump,
10 s on each leg of paper; the lap is padded to at least six minutes. The world lives through the
pauses (wages, drones, deadlines). Three hours per tier, with the dispatcher / mining only:

| tier | bot net | human net | oracle | bot vs oracle | human vs oracle | human U/G | lap, min | dispatcher cr/h (deeds) |
|---|---|---|---|---|---|---|---|---|
| T0 Стриж | 6 898 / 6 118 | 3 838 / 4 791 | 4 400 | +57 % / +39 % | **−13 % / +9 %** | .47 / .28 | 6.7 / 6.4 | 2 398 (11) |
| T1 Вьюк | 20 704 / 17 000 | 15 635 / 13 606 | 13 900 | +49 % / +22 % | **+12 % / −2 %** | .24 / .16 | 8.8 / 7.6 | 6 240 (25) |
| T2 Обод | 12 199 / 14 739 | 11 336 / 9 918 | 14 200 | −14 % / +4 % | −20 % / −30 % | .58 / .55 | 8.0 | 8 595 (25) |
| T3 Мамонт | 7 294 / 7 890 | 9 234 / 1 764 | 12 700 | −43 % / −38 % | −27 % / −86 % | .75 / .92 | 9.5 | 16 393 (40) |
| T0, fresh save | 18 428 / 15 429 | 14 915 / 12 285 | — | — | — | .26 | 7.8 | 5 874 gross |
| T2, uninsured wreck | −694 | −615 / −2 326 | negative | ✓ | ✓ | 1.03 | 7.6 | — |
| T2, insured wreck | 11 516 | 12 143 / 8 157 | — | — | — | .56 | 7.9 | — |

Read it: **the T0 and T1 excess was the bot's pace.** At six minutes a lap and more, both rows sit
inside ±20 % with and without paper; no lever is needed. T2 slides to the band's edge and T3 stays
under: a slower lap pays the same wages per minute for less ore, and mining only at T3 nets almost
nothing (the bill is 18 400 cr/h). The T3 gap's owner is below. The rows above (bot pace) stay as
the probe's default — they find exploits; the human rows are the ones to hold against §4.1.

Disputed: the «Вьюк» allotment comes at 8.3 minutes of play (7.7 in the first count) instead of
§4.1's 25 — the bot's pace; the owner is the same as T0's excess above, and it is not changed.

**The drone's parts line, measured, not built** (§3.1: 6 cr/min = 360 cr/h per drone; 22.10).
What one drone earns over three hours at a human's pace, where the probe puts it: on the first
deposit of its world (as before), and with `ECO_DRONE=dear` on the dearest ore that drone may take
(`droneMayMine`: the far bands are refused). Payback is against the first drone's 9 000 cr; the
second costs ×1.6, the fourth 36 864.

| drone, ore | cr/h | after parts | payback, h (now / with parts) | trips in 3 h |
|---|---|---|---|---|
| T1, first deposit: iron | 480 | 120 | 19 / 75 | 120 |
| T1, dearest: silicon | 756 | 396 | 12 / 23 | 102 |
| T2–T3, first deposit: iron, silicon | 419–646 | 59–286 | 14–21 / 31–153 | 60–129 |
| T3, ice | 280 | −80 | 32 / never | 59 |
| T2–T3, dearest: titan | 1 241–1 275 | 881–915 | 7 / 10 | 69–75 |
| T3, dearest: isotopes | 1 466–1 519 | 1 106–1 159 | 6 / 8 | 55–57 |

Whole rows with every drone on its dearest ore: T1 15 925 (+15 %), T2 13 172 (−7 %), T3 11 086
(−13 %, from −23 %). Read it: at 6 cr/min the line is 2–3 % of a T1 row's net, so as pressure it
does nothing T1 needs (T1 is in band at a human's pace). What it does is choose for the player: a
drone on iron or ice stops paying, a drone on titan or isotopes hardly notices. That is a decision
the line would create, which is the honest reason to build it — not the band. Not built; the
placement is the player's lever already (where the drone sits moves T3 by ten points).

**The estate at T2–T3** (22.10; on by default, `ECO_EST=0` drops it). The oracle's T3 gross
assumes five workshops and a base of 20; the probe now owns them, as a T3 player would:

- *Workshops* (families B–D) that eat the ores of the home system, three to a station, nearest
  first. None may stand at home — the home system «already makes» what it mines (`bldRuleWhy`) —
  so they stand one jump away, and the bot hauls to them when their hoppers would take at least
  15 units, sells there at the market price (the hopper takes its share at that price), collects
  the output and comes back. Output with no market (ferro, plate) goes to any workshop that eats
  it, wherever the bot docks.
- *A base* on a home-system world, laid out the way a player watching the drill would: habitats
  for its people first, then one cell at a time whatever raises drill output under power and
  heat, then single-cell swaps until nothing improves. Two people on it (T3 asked for four; the
  station's list ran out), the «Лицензия на флот» bought for the places. Its ore is collected at
  every home dock (30 s at a human's pace) and, once the bot has moved on, by a trip back when its
  store is half full.

Three hours, each tier alone in its world:

| tier, pace | without estate | with estate | vs oracle | base, gross cr/h | workshops, gross / spend cr/h |
|---|---|---|---|---|---|
| T2, bot | 12 243 | 22 643 | −14 % → +59 % | 5 732 (8 modules, 3 drills) | 0 / 125 |
| T2, human | 10 760 | 12 440 | −24 % → −12 % | 5 577 | 3 / 70 |
| T3, bot | 7 168 | 14 000 | −44 % → +10 % | 7 527 (20 modules, 4 drills) | 1 433 / 3 800 |
| T3, human | 9 732 | 5 208 | −23 % → −59 % | 5 432 | 753 / 1 312 |

What it says:

- **The base is the estate.** 5.4–7.5 k cr/h gross at T3, 5.6–5.7 k at T2. At the bot's pace,
  where servicing it costs nothing, T3 comes into band (+10 %) — the −43 % was the missing estate,
  not the wages of the commander and the keeper.
- **Heat caps the base at four drills.** The first layout (three reactors, five drills) sat at
  heat 330 and its drills stood for the whole run (`baseHeatMul` = 0); the best layout the search
  finds is four drills, two reactors, two radiators and storage, heat 88 (×0.6). A base of 20 is
  a base of four drills.
- **Workshops lose money.** Their hoppers are one jump away by rule, the hauls cost more than the
  ore they place, and their output has no buyer within reach: 4 300 cr of ferro and plate in
  three hours with nobody to eat it. No market takes industrial goods, and the chain's next
  workshop is not where the first one stands.
- **At a human's pace the estate takes the hull's time.** With the estate a T3 lap mines 30 % less
  ore (152 units against 215 in three hours), the dispatcher earns 27 % less, and hull repair
  triples on the extra jumps; the base's 5.4 k does not cover it. The logist role («забирать
  добычу со станции, не прилетая») is the game's own answer to this and the probe does not
  play it.

**The logist — M913, measured 22.10** (`ECO_LOGIST=1`; `ECO_SHOPS=0` keeps the base and drops the
workshops). The logist on the base is the game's own answer to fetching its ore: «ЗАБРАТЬ» on the
station's home tab (26a) puts the base's store into the hold from any station, no flight (5 s at a
human's pace, against 30 s at the base's system and a trip back once the bot has moved on). He
takes the first of the base's two places, so the base drills with one driller instead of a
driller and an engineer. T3 at a human's pace, the tier alone; net cr/h and against 12 700:

| T3, human | 3 h | 6 h | minutes per hour (6 h): mining · pauses · paper · workshops · base |
|---|---|---|---|
| no estate | 9 732 (−23 %) | 2 660 (−79 %) | 37 · 11 · 9 · — · — |
| workshops + base | 5 208 (−59 %) | 6 534 (−49 %) | 33 · 15 · 5 · 3 · 2 |
| workshops + base + logist | 11 873 (−7 %) | 9 132 (−28 %) | 35 · 11 · 8 · 4 · — |
| base only | 12 213 (−4 %) | 11 291 (−11 %) | 38 · 14 · 5 · — · 1 |
| **base only + logist** | 15 684 (+23 %) | **13 943 (+10 %)** | 36 · 10 · 12 · — · — |

(The rest of each hour is flight: 2–3 minutes. Six hours without an estate fall to 2 660: the home
worlds are worked out, the wages are not.)

Read it: **the logist is worth 2.6–3.5 k cr/h to a base, and he closes the T3 gap only without
workshops** — base and logist sit at +10 % (6 h) to +23 % (3 h), inside or at the edge of ±15 %;
with the workshops kept, −7 % to −28 %. The minutes say why: the logist gives the hull back its
paper (12 minutes an hour against 5), the workshops take 3–4 minutes an hour of hauls for nothing
(their owner is M914 below). The run-to-run spread is wide (the dispatcher's take moves by 2–3×
between runs), so read the order of the rows, which holds at 3 h and at 6 h, more than any one
number. Nothing changed in the game.

**An eater for ferro and plate — M914, measured 22.10** (`ECO_EATER=1`; the survey prints on every
estate run). Industrial goods have no market; they turn into credits only in the player's own
workshop that eats them (`bldSellInd`, at the shadow price `indPrice`). Who eats what, and where
one may stand within three jumps of home (121 stations; a jump here is ≈ 3 cells):

| good | shadow price | eaters (12ac) | may stand: home · 1 jump · 2 · 3 | with a site rung | nearest |
|---|---|---|---|---|---|
| ferro | 117 | thermocshop, reactorshop, beamyard | 1/1 · 14/15 · 36/36 · 69/69 | 0 of 121 | home, 0 fuel |
| plate | 198 | slipway | 1/1 · 14/15 · 36/36 · 69/69 | 0 of 121 | home, 0 fuel |
| resin / protein / spirit | 123 / 123 / 81 | fabricshop, filmshop / cannedshop | the same | 0 of 121 | home |

An eater may stand anywhere the good is not already made (`bldRuleWhy` counts the player's own
maker too, so not at 1,0 where the ferro and plate shops are) — home included, where the hull docks
every lap. Placed there by the probe (no price, no ladder, like the other workshops), T3 at a
human's pace with the logist:

| T3, human, base + workshops + logist | 3 h net | 6 h net | industrial sold, cr/h | left without an eater (6 h) | hauls (6 h) |
|---|---|---|---|---|---|
| no eater | 11 873 (−7 %) | 9 132 (−28 %) | 0 | ferro 31, plate 17: 6 993 cr | 13 |
| eater at home | 13 541 (+7 %) | 7 750 (−39 %) | 686 / 1 054 | thermoc 21, hullsec 1: 6 082 cr | 16 |
| (base + logist, no workshops) | 15 684 (+23 %) | 13 943 (+10 %) | — | — | — |

Read it:

- **Geography is not the problem; the chain and the ladder are.** An eater may stand at home, so
  ferro and plate sell with no trip at all. But the eater makes a good of its own (thermoc,
  hullsec) that has no eater either: six hours leave 6 000 cr of thermoc where there were 7 000 of
  ferro. Every link needs the next one, and the last link (a hull section, a reactor block) has no
  buyer in this probe.
- **A haul to the makers does not pay.** The makers may not stand at home (home makes their ore),
  so each feeding is a jump: 440–540 cr of fuel for a round trip of one jump, carrying ~8.5 units
  of ore and earning ~395 cr of industrial goods (6 h: 16 hauls, 6 300 cr).
- **No station within three jumps has a site rung for this player** (`bldSitesAt` = 0 at all 121)
  — measured at the tier's start, before the first landing. M916 below measures it after play:
  one site, at home.
- Owner: the workshop chain (§3.1 workshops, 12ac families C–D) — the next link's buyer, or a market
  for the last link. Questions for the author; nothing changed.

**The access ladder — M916, measured 22.10** (`ecoLadder` in `-rep` prints the ladder at a tier's
start and end for home and the 121 stations within three jumps; `ECO_SAVE=1` adds a round through
`snapshot()` → JSON → `applySave()`). A site is the ★11 rung «Монтажная площадка» (`bldSitesAt` →
`rungHas(…,"site")`, `src/12ad-site.js:100-103`). The rung is derived, never stored: points for the
player's deeds in that system (`rungPoints`, `12ad-site.js:45-68`), capped by three gates (`rungOf`,
`12ad-site.js:69-83`) — landed on a body there, drilled a deposit there, a drone there. Under Node,
a human's pace, three hours:

| run | home rung, start → end (points) | home sites | stations within 3 jumps: docked / landed / rung ≥ 11 | after the save round |
|---|---|---|---|---|
| T0, a fresh game | 0 → 10 (18) | 0 — gate «оставить дрона» | 4 / 1 / 0 | 10 (18) · 0 sites |
| T3, no estate | 0 → 11 (21) | 1 | 9 / 1 / 1 | 11 (21) · 1 site |
| T3, estate | 5 → 13 (28) | 1 | 9 / 1 / 1 | 13 (28) · 1 site |

Read it:

- **Not a bug — the probe's timing.** The M914 survey ran at the tier's setup, before the first
  landing. The rung climbs with play and survives a save (every input — `place`, `hold.deeds`,
  drones, bases — is a saved field). No author save is on this machine (the cloud copy lives on the
  live site, which this work does not touch); the save round is the proxy, and it changes nothing.
- **The ladder needs feet on the ground, system by system.** A station the player only docks at
  stays at rung ≤ 5 (the landing gate): the neighbour at 1,0 earns 14 points and is held at rung 5,
  0,-1 earns 6 (rung 4). After three hours a T3 player has one site, at home — and the probe's
  workshops at the neighbours (above) could not be built in the game.
- **T0 stops one step short.** 18 points would give rung 10 anyway; the drone gate holds it there,
  and a player with no drone has no site anywhere. The design of DESIGN-holding §6, noted.
- **The eaters stand much higher.** A family-C workshop (thermocshop eats ferro) needs ★20
  «Промышленный узел» (`bldTierOpenAt`, `12ad-site.js:104-108`): 55 points and three buildings in
  the system; the slipway (eats plate) needs ★22, 65 points. Home at T3 holds 28 after three hours.
  M914's «eater at home» is a late-game picture, not a T3 one.

**The second hour: T0 → T1 at a human's pace — M919, measured 22.10** (`ECO_TIERS=свеж ECO_HUMAN=1
ECO_FRESH_H=3`; the fresh-save row of M912, now with ten-minute slices; `ECO_T1` adds the T1 kit).
T1 in §4.1 is the «Вьюк» with one hand and one drone. What the game asks for each: the hand needs a
cooperative (`hireMerc`, `12a-crew.js:219`; the stamp needs turnover 12 000 and a 1 500 fee,
`coopRegister`, `12aj-coop.js:27,47`), a seat (`crewCap`) and a free hull (the Стриж, left
behind when the player boards the «Вьюк»); the drone needs 9 000 cr and a yard or factory station
(`droneShopHas`, `12-economy.js:245`), which the probe flies to (the nearest within four sectors)
and back. The player keeps 900 cr for fuel and repairs, buys one thing per dock, and puts the drone
on the first deposit of the next landing. Three players, one world:

- **modules only** — the M912 row unchanged (hold, drill, hold, drill, engine, hold, drill);
- **modules, then T1** (`ECO_T1=1`) — the five modules first, then cooperative → drone → hand
  (the hold-3 and drill-3 purchases keep running beside them);
- **T1 first** (`ECO_T1=2`) — after the first hold and drill, cooperative → drone → hand, the
  modules wait.

| | modules only | modules, then T1 | T1 first |
|---|---|---|---|
| cooperative / drone / hand | — | 64.8′ / 144.6′ / 153.0′ | 55.1′ / 65.5′ / 75.6′ |
| net, hour 1 · 2 · 3 | 15 336 · 16 405 · 12 073 | 15 336 · 13 637 · 11 944 | 15 348 · **7 192** · 5 980 |
| invested, hour 1 · 2 · 3 | 9 031 · 13 801 · 0 | 9 031 · 15 301 · 9 231 | 3 650 · 18 262 · 900 |
| three-hour row, net cr/h | 14 915 | 13 138 | 9 532 |
| waited for (minutes of play) | cash for a module 72 | cash for the drone 71, for a module 49 | cash for a module 113, turnover for the cooperative 23 |

(«T1 first» lost its uninsured «Вьюк» in a fight on a dispatcher leg at 82′ — «сбит в бою · не
застрахован · выдан «Стриж» по разнарядке» — with the modules on it; hours two and three are a Стриж
with 66 units of hold. The runs are deterministic; the fight is the world's, not the order's.)

The second hour minute by minute, «modules, then T1» (each row is the ten minutes up to it; time
in minutes of play):

| up to | cash | invested | gross | net | walk · drill · fly · pauses · paper · fetching the drone | waiting for | kit |
|---|---|---|---|---|---|---|---|
| 60′ | 6 870 | 3 660 | 6 630 | 6 024 | 5.3 · 1.0 · 0.3 · 2.6 · 0.8 · 0 | a module, at the next dock | «Вьюк», hold 2, drill 2 |
| 70′ | 6 865 | 2 400 | 3 806 | 2 395 | 6.7 · 0.7 · 0.3 · 1.4 · 1.0 · 0 | — (cooperative 1 500, engine 900) | + engine, cooperative |
| 80′ | 3 634 | 6 039 | 3 433 | 2 808 | 8.0 · 0.4 · 0.5 · 1.0 · 0 · 0 | cash for the drone | hold 3 |
| 90′ | 6 369 | 0 | 4 639 | 2 735 | 5.0 · 1.1 · 0.7 · 2.6 · 0.7 · 0 | cash for the drone | |
| 100′ | 1 751 | 6 862 | 2 574 | 2 244 | 4.5 · 0.9 · 0.4 · 4.2 · 0 · 0 | cash for the drone | drill 3 |
| 110′ | 3 187 | 0 | 2 058 | 1 436 | 5.6 · 0.5 · 0.6 · 3.3 · 0 · 0 | cash for the drone | |
| 120′ | 5 206 | 0 | 2 175 | 2 019 | 7.2 · 0.6 · 0.3 · 1.8 · 0 · 0 | cash for the drone | |
| 140′ | 9 389 | 0 | 3 855 | 2 143 | 5.4 · 0.4 · 0.3 · 1.1 · 2.8 · 0 | cash for the drone | |
| 150′ | 1 301 | 9 000 | 1 710 | 912 | 6.5 · 0.6 · 0.3 · 1.4 · 0 · 1.2 | — (drone, at the yard 3,-1) | + drone |
| 160′ | 2 977 | 231 | 2 789 | 1 907 | 5.2 · 0.6 · 0.2 · 1.5 · 0.8 · 1.8 | — (hand, on the Стриж) | + hand: T1 at 161.7′ |

The four walls, where each stands:

| wall | when, and how big | §12 item that moves it |
|---|---|---|
| **cash** | the first wall and the longest: a module at a time to 64.8′ (72 minutes of waiting in the modules-only row), then the drone's 9 000 + 900 waits 71 minutes (to 144.6′) because hold 3 and drill 3 (12.9 k) go first; «T1 first» has the drone at 65.5′ | none. The levers are the drone's price (`DRONES.miner`) and the buying order, which is the player's |
| **walking** | the biggest time: 29–38 of every 60 minutes are walking to deposits (48–63 %), drilling 3–6, flight 2–3, the human's pauses 9–16, paper 2–6; it is the same in all three rows and all three hours | none (item 3 touches one prompt near the Жестянка). The lever measured in §4.1a (M904–M905) is the deposit type and layout, not the dispatcher |
| **the cooperative's turnover** | 12 000 sold comes at about 55′; only «T1 first» meets it as a wall (23 minutes waiting) | none |
| **the hold** | not a wall after the «Вьюк»: the hold was full on 3 of 7 laps in hour 1 (on the Стриж, to 20.5′) and on 0 of 8 in hour 2; a lap ends at the probe's cap of 12 deposits a landing before the hold fills | none |
| the ladder | not on the T1 path: the cooperative, the drone and the hand ask no rung. The home rung stays at 5 (19 points) for three hours, under the landing gate | none |

Read it:

- **T1's kit does not pay in its first hour at T0's place.** In «modules, then T1» the drone sits on
  iron and brings 87 cr/h (−273 after the §3.1 parts line; payback 103 h), and over their first
  half hour the background line («tick», drone and hand) takes in 0.7 k cr and pays out 1.0 k. In «T1 first», over 105 minutes, the drone
  brings 215 cr/h and the hand earns about 1.2 k/h against wages of ~2.2 k/h. The modules-only player
  ends three hours with the most money (21 547 cr in hand, 14 915 cr/h). So the second hour has no
  hard wall. The player can buy T1 by 65′–145′, and buying it costs them money in that hour. The
  oracle's T1 row (13 900, a drone on its dearest ore) assumes a placement this player does not
  yet know.
- **The real risk of the second hour is the uninsured hull.** One fight on a dispatcher leg took
  the «Вьюк» and its modules at 82′ and halved the next two hours (7.2 k and 6.0 k cr/h against
  16.4 k and 12.1 k). The probe skips paper that names a fight; this one met it on the way.
- **None of the eight §12 items moves a T0→T1 wall.** §12 is the T2–T3 economy (workshops, base,
  dead goods). The second hour's walls are the drone's price, the buying order and walking — none
  of them a code bug; they are listed for the author, nothing changed.

Two caveats on these rows (accepted with M919):

- *The hold is «not a wall» partly by the probe's own cap.* A landing digs at most 12 deposits
  (`lap`, the ground loop), and the lap ends there with room in the hold. A person who walks further
  for a 13th deposit could meet the hold — and would walk even more than the 48–63 % above.
- *The drone goes where a beginner puts it.* It takes the first deposit of the next landing
  (iron here), hence 87–215 cr/h. On the dearest ore it may take (`ECO_DRONE=dear`, M912) it pays
  back far sooner, but a fresh player does not know the prices yet; the rows keep the beginner.

**The second hour across ten seeds — M920, measured 22.10** (`ECO_SEED=1…10`, the two T1 orders of
M919, three hours at a human's pace). A seed alone (`rndSeed`) changes nothing before the third
hour: ten seeds gave one run, the «Вьюк» lost at 82.2′ in all ten. A T0 world draws its events
from hashes of place and clock, so the seed also shifts the hour the player starts (seed × 26.3 h);
the map is the same. Each wreck is logged with its minute, hull, insurance, first-hour protection,
phase and system (`wreck` wrapped in `91zzzw4-ecosim-t1.js`).

| ten seeds, median (min–max) | modules, then T1 | T1 first |
|---|---|---|
| cooperative / drone / hand, minute | 64.3 (55.1–64.9) / 140.7 (132–146) / 148.9 (140–155); 2 runs never buy the drone | 55.1 / 65.5 (63.8–65.6) / 75.6 (71.7–76.7) |
| net, hour 1 | 15 448 (14 012–16 330) | 15 457 (14 024–16 330) |
| net, hour 2 | 14 214 (9 021–17 728) | 14 390 (1 973–17 695) |
| net, hour 3 | 11 152 (1 557–15 668) | 10 157 (2 067–14 775) |
| uninsured hull lost, by hour 1 · 2 · 3 | 0 · 2 · 2 of 10 (at 93′, 93′, 154′, 162′) | 0 · 3 · 1 of 10 (at 82′ ×3, 140′) |
| hour-2 net, a run that lost the hull / did not | 9 383 / 14 751 | 7 903 / 16 014 |
| docked at a yard before the loss (the only place insurance is sold) | 0 of 4 | 0 of 4 |

All sixteen wrecks of the twenty runs (the uninsured «Вьюк» eight times, the always-insured Стриж
eight) fell in the same phase: the probe's lap padding. The human pace pads a lap to six minutes, and
the probe does it by waiting in open space after launch, without fighting back, at the neighbour
systems where it digs (1,0 twelve times, 1,-1 three, -1,1 once). With the same wait spent at the
pier instead (`ECO_PAD=dock`), the twenty runs have no wreck at all. Those runs have a slower first
hour (9.8 k against 15.4 k cr/h, median; not analysed). Their T1 minutes are cooperative 71 / 81,
drone 155 / 108, hand 164 / 115.

Read it: **the uninsured hull is a rule of the world, not a rare case — for a ship that lingers in
space next door.** Four runs in ten lose the «Вьюк» and its modules within three hours, two or
three of them in the second hour. That halves the hour: 7.9–9.4 k against 14.8–16.0 k. Which order
the player buys in changes the minute, not the odds. How often a real player lingers is the open
number. The probe's wait is the worst case (still, silent, no guns), and the pier is the best. The
truth sits between them, and the probe cannot place it.

**What the player sees of the Страхкасса (M904c) before minute 82: nothing that offers it.** The
offer is a plate with a button on the ДОСКА tab of a *yard* (`insSection`, `28i-insure.js:89`).
None of the forty runs docked at a yard with a hull of their own; the drone trip goes to the nearest
yard or factory, and a factory has no plate. The first watch (`28o-firstwatch`, M909) has no line
about insurance. The only words on it are «страхует только «Стриж»» in the hand-over row on the
home station's board (`28j-watch.js:265-266`). That row speaks of handing the watch over, and the
first watch hides it for the first hour (`:261`). The first hour's protection (`firstHour()` in
`wreck`, `28i:67`) is silent too: it ends at minute 60 with no word. Nothing changed; it goes to
the author as it is.

**Gaps that stay, each with an owner** — none has an honest lever in the dispatcher:

- **T0 +57 % at the bot's pace, −13 % / +9 % at a human's.** Closed by the pace table above:
  the lap of 3.8–4.1 minutes was the excess, as §4.1a guessed.
- **T1 +49 % at the bot's pace, +12 % / −2 % at a human's.** In band; U/G .24 stays under the
  .50 of §4.1 — nothing to pay at T1 but fuel and one hand. The drone's parts line (§3.1) is
  measured below, not built.
- **T3 −43 % at the bot's pace → +10 % with the estate; −23 % at a human's, worse with it.** The
  base closes the gap where servicing is free. Where it is not, the owners are three, none of them
  wages: workshops whose output has no buyer (no market for industrial goods, no eater one jump
  away), heat that makes a base of 20 a base of four drills, and the minutes the hull spends
  fetching the base's ore (the logist, not played). The commander and the keeper still add
  nothing countable at level 1 (3 500–4 200 cr/h of wages each); the keeper's «build» rule has no
  code. Numbers only; nothing changed.
- Bot findings in files this series may not edit: the Жестянка's «НАРЯД НЕ ЗАКРЫТ · НУЖЕН …»
  prompt takes ДЕЙСТВИЕ from any deposit within 56 of it (and reads «НУЖЕН ЛЕТУЧИЕ ГАЗЫ»);
  swimming takes it on water worlds; «ВОЙТИ В ПОЯС ВОРОН» takes the landing prompt near a belt.
  The probe steps around all three.

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

**Built 15.10 (0.498.0, `28l-gauge`).** Three changes from the text. Needs roll every 15 minutes
of play and a сводка is six hours of wall clock, so per-need stops and a .05-per-сводка heal
stopped every station around the player within an evening. The workshop stops only when an
unfilled need takes stock below .25; the heal is a two-hour time constant toward .6 (order toward
.6 − .15 × occupation level); a stop and its cascade last an hour. Judged: the participation's
stations and two jumps around the player, per played window; barge-filled needs count neither way.
The cascade need goes ahead of the neighbour's own (the own one is then judged by nobody). Not
built: rumours a sector further, crates and lights in the hall, the keeper's face.

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

**Built 22.10 (M907, `28m-dispatch`).** Four slots — haul, task, urgent, long — filled at every dock
and again the moment one is handed in at the counter; everything on the lane is already the
player's, nothing is «taken». Twenty verbs (five hauls, seven tasks, five urgents, three long), each
a chain of real steps caught by wrapping the real function: cargo (a button), dock, arrive, land
(`enterSurface`), kill (`killPirate`), cant (`cantHall`). A dropped item hits the issuer's gauge by
its class (stock −.1, mood or order −.06). The long order is written by the participation's
диспетчер. Measured (`tests/91zzzw9e-dispatch.js`, 60 docks of a bot that plays): the lane full at
every dock, 0 repeats in a window of five over 67 issues, the urgent at most 9.4 min, the four
items' estimate ≥ 83 min. Gauge weights: low order 37 % order verbs against 15 %, low mood 51 %
against 22 %, empty stock 66 % hauls-here against 17 %. Not built: the clerk handing the urgent
paper in the walkable hall (§7.1) — it is on the board and over the ship as the alarm plate; «walk
to a landmark» is counted as a landing in that system, the marks have no hook yet.

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

**Built 22.10 (M908, `28n-access`).** Hull gates ride on `yardGate`, so the dock row shows the
reason instead of a buy button («допуск II или разнарядка», «допуск III и поручитель», «нужен
поручитель», «только по разнарядке»); a hull you own is never locked. Catalogue hulls follow the
same ladder by price: up to «Скат»'s price free, up to «Топор»'s clearance II, above that III plus
a sponsor; rare, legend and proto hulls are never sold for credits. An allocation by norm
(`watchAllot`) sets a lasting right to the clearance-II hulls. The sponsor is a manager at level 3
or higher, a house you had an episode with, or a station supplied on 8 separate visits (a need
closed, an order delivered or a dispatcher haul handed in — once per visit). The 22 rungs without
a ★ get a lever each — dispatcher pay, fuel, repair, the buyer's bid, the counter, gauge floors,
barge rate — read inside the real price functions, and the lever's line is appended to the rung's
note so the board and the dock moment say it in words. Tier-2 and tier-3 workshops (the slipway
excepted) also need the last сводка at 75 % or more. Not built: the second participation (the
watch has one participation). Test `tests/91zzzw9f-access.js` walks rungs 0→30 against a stub
and holds that every step changes what the system does.

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

**Built 15.10 (0.498.0).** The crowd follows people in the cantina (`c3Layout`) and in the
walkable hall (`hallLayout`): the type's crowd at .6, up to nine at .9, one at .3. The board says
the rest in words (ПОЛОЖЕНИЕ). The keeper's face, the clerk's paper, the queue and the crates wait
for the hall's next pass.

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

**Built 22.10 (M910, `28p-doors`).** A landing is now only the *place* a chapter is lived; the
door is a deed done after the previous chapter opened. A deed log (`G.wd`) is fed by hooks on
what the game already does: a сводка ≥ 90 % (`norm`), a сводка ≥ 60 % right after a срыв
(`srv`), a hull lost, a door shut (`folkShut`), a ransom or a storm that frees hands, a named
offer taken, a landmark acted on (`mark`), one's own notch on an obelisk (`notch`), a watch
handed over and taken back, a story turned by a deed. The part doors follow the table above
(chapter 55 takes `blade` only since M911). Inside a part the door is drawn
once per chapter, weighted 1/(1+times done); any two different deeds also open it, so nobody is
stuck. Part I stays on landings. The диспетчер's 72 lines come from `SMENA_TEXT`: the chapter's
first journal line, else its first spoken line without a «сказал» tag, cut at a sentence to 120
characters. When a chapter opens, she says it on the ether, and for ten minutes it replaces her
line on the participation plate. Thirty stories with no turns of their own get one: after their
first trace, a deed of the watch (`norm`, `srv`, `notch`, `handover`, 7–8 stories each) done
*after* meeting the story sets `wd`, and the last trace waits for it. Act 2: the circular's good
is demanded only on the participation's boards, barges with people leave from its stations (mood
−0.1 each), the sixth (`sixth_report`) has the new address `watch`, and «Есть место» is offered
at a participation station once the run of ≥ 90 % сводки is 365 sky days old and holds at least
two. Not done: the rivals' traces at your landmarks, «a face gone from the hall», the `bill`
deed (no stranger's bill exists yet). The door table is `tests/91zzzw9h-doors.js`.

**Built 22.10 (M910c, `28t-hallgone`).** The cantina crowd was nameless (a seed per slot), so
nobody could be missing from it. Now whoever wrote you a live paper (the dispatcher's face,
`28m` `dispFace`) sits in the cantina of the station that issued it, on a crowd seat, with the
paper's face (at most two). Let a paper's time run out and that person is gone: the seat stays
empty for thirty sky days, and the barman, unless he has just said something, says «Лидия
Карповна? Больше не заходит. Ждала вас, потом перестала.» The district's dispatcher (the long
order) never sits there and never leaves. A hand sent in your place (`cold`) is not a failure:
the paper was done, the keeper only writes it down. `G.hallGone` keeps the last three per
station and is saved. Tests: `tests/91zzzw9l-hallgone.js`.

**Built 22.10 (M910b, `28s-rivmarks`).** The six are the troupe's «соперник» (Ефим, Пекарь,
Крапива, Ким, Штоф, Совеня); Зоя stays on the watch. A landmark is yours once you acted on it
(`G.poiSeen[seed].n.last`). Landing again, at least ten sky days after that act, you find at its
foot the trace of one rival you have met in any story (a seen trace of a story with them in the
cast), picked by the landmark's seed; one trace per rival for the whole game, one per landmark.
The trace is a «· СЛЕД ПЕКАРЯ» tail on the landmark's «ИМЯ · СОСТОЯНИЕ» plate every visit, and
once a line of what lies there (say, and the journal in full). No body for it yet: the landmark's
picture is `21pie`. `G.rivMk` is saved. Tests: `tests/91zzzw9k-rivmarks.js`.

**Built 22.10 (M911, `28q-fork`).** Every paper on the dock row has two sides: КУРС (yourself) and
РУКОЙ (a hand). A hand is an idle hired hand with a ship and no order; it takes the job for
85 % of the pay minus the goods at base price and its wage for the road, takes 0.8 of your
minutes (at least 4), and fails 3 % of the time into a real hostage with a real ransom. The face
remembers: a record line «сами не пришли» and a cold counter, no penalty yet. With no idle hand
the second side is named in words («свободных рук нет», «рука не успеет»). A read obelisk notch
always adds one access line — the rune's own, else a price on an unknown station within four
hops, else an address within eight; carving your own adds +0.05 mood at the nearest station.
The Blade: once part VI is open, Рыба says one ether line — Гуся sat down on a world with no
station, reachable on a full tank and not back (path cost in hops of the jump range). Arriving
there is the `blade` deed and the only door to chapter 55; on an empty tank there, the rescue
offers «РЫБА» (a free tow, once) instead of tow, rail and reset. Not done: the four folk as
hands, «Гуся's order is carried yourself». The fork table is `tests/91zzzw9i-fork.js`.

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

**Built 22.10 (M902c, `28r-fight`).** The slow-hull gap was a bug, not tuning: under 30 % hull the
jackal re-entered his break every frame, and past 650 px the break handed over to a dash that the
next frame turned back into a break — a hurt jackal flew nose-away for ever. The break under 30 %
now fires once (`13c-roles`). After the fix every flying row resolves: «Вьюк» w2 at .2 kills in
16.6 s (flank) and 7.8 s (orbit); the .8 orbit row, unresolved before, takes 17.4 s. The flee
jump shows «УХОДИТ · N С» under the pirate's name while the clock runs. Rank was already on the
hull as the name's prefix. «ОТПУСТИТЬ» is X, or ЦЕЛЬ held for 0.6 s (the press has already cycled
the lock, so the pirate locked before the press is the one let go): a jackal takes the cheapest
slot, a veteran the dearest, a captain the two dearest (there are no hands aboard — hands fly
their own hulls), a baron, a renegade, a hunter and a rival do not deal; the pirate turns away,
holds fire and jumps a second later; one КНИЖКА line in his voice. The duel: a row under the
стрельбище, 50 cr, a real pirate of the next unbeaten rank (jackal, veteran, captain) at danger
.5; under a quarter he yields; no bounty; «сбит» ends the duel with the hull returned; the best
time per rank persists (`G.duel`). Marks are the probe's flank/orbit bounds: 17, 18, 38 s. Not
done: shield type by where it glows, the rear hit as a brighter hit (pictures, for the remake).
Tests: `tests/91zzzw9j-fight.js`.

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

**Built 14.10 (0.497.0).** The faucet applies to the goods a station eats; what it does not eat
keeps the old half-percent pressure, so the surplus is carried to where nobody ate it. Measured:
−5…6 % gross on every tier (the probe's bulk iron and silicon already sell where nobody eats
them), a «Вьюк» lap 350 cr/min. The §4.5 seasons were never built; nothing was cut.

### 10.5 Offline and quitting

Offline drain is capped at **one hour of tier net** regardless of time away; passive income
(drones, workshops) runs at 60 % to the same cap. On every quit, the menu's one tap is
«СДАТЬ СМЕНУ» (default) or «ОСТАВИТЬ ЗА СОБОЙ»; handed over, nothing runs and nothing is owed.
Taking the watch back costs a shift's minute at any counter and the диспетчер's line.

**Built 14.10 (0.497.0).** People were already online-only (`12a-crew`, the author 11.09) and the
bill caps its offline lines at an hour, so the drain cap holds by construction. Drones were the
one passive income with a day's catch-up at full pay: a catch-up now pays 60 % up to one hour of
tier net (`28k-offline`). A browser game has no quit to hook, so СДАТЬ СМЕНУ is a menu item from
the paper hour; the relief (сменщик) holds the watch, not the диспетчер. The norm is judged only
over played need windows: a сводка lived offline is not judged at all.

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

**Built 22.10 (M909, `28o-firstwatch`).** The first hour paces the dispatcher by the game clock
from the start of the save. The first counter gets the participation plate (28j) and two
addressed items with faces, a haul and a task; the urgent and the three-station order are held
back. At minute 6 the first urgent comes by itself, wherever the player is: a barge's pod, 8
minutes, as the plate at the ship or a board row. The first undock carries the диспетчер's ether
line naming the watch, once per save. The first hour flown brings the first paper with the стажёр
line (27ib, unchanged), and the lane opens fully. While the watch is handed over, the first watch
stands still with everything else. The «уезжаете надолго?» row is hidden in the first watch; the
menu keeps the hand-over. Not done: the participation is still the 5×5 square of 28j, not «one
station, hers». The Node scenario `tests/91zzzw9g-firstwatch.js` plays the hour.

### 10.8 The queue — M900+

Build order; each closes on its own and is measured by the bot before the next starts. Builders
read §2, §10 and the one section named in their brief. Tests live beside the thing.

| M | what | gate |
|---|---|---|
| M901 | `tests/91zzzw-fightsim.js` — the duel measured under Node — **done 09.10** | the table of TTK / hits / hull by hull × gun × rank × danger |
| M902 | a/b **done 09.10** (cap, jump, captain, jammer); c: the slow-hull TTK at .2, readability, the стрельбище duel, «ОТПУСТИТЬ» (§8, §10.6) **done 22.10 (`28r-fight`)** | the §8 table holds as `91zzzw-duel` asserts; the стрельбище sells the duel |
| M903 | the economy probe `tests/91zzzw4-ecosim.js` — **measured 14.10, §4.1a**: net 2.6–3.7× the oracle, U/G .06–.24 | the §4.1 oracles within ±20 %; a «Вьюк» lap ≤ 900 |
| M904 | the bill (§10.1) and manager wages to the player — **a done 14.10 (0.494.0, T2 U/G .22, T3 .36)**; b the ledger (§5.2) and c Страхкасса with hull loss (§5.1) **done 14.10 (0.495.0)** — debt is its own number, not credits below zero (twenty `min(credits, x)` sites); d the gross lever and the bad hour **done 14.10 (0.496.0, §4.1a): good T2 hour +14 900, uninsured wreck −14 500** | the bot at T2 ends a bad hour negative and a good hour +15 000; the floor holds |
| M905 | the participation, the диспетчер, the norm line, the handover, reassignment (§3.2–3.4, §10.2–10.5) **done 14.10 (0.497.0)**: `28j-watch`, `28k-offline`, the faucet in `12ab-hold` | the bot's norm moves with filled needs; handover stops every clock |
| M906 | station gauges and the cascade (§4.2); the hall shows them (§7.1) **done 15.10 (0.498.0)**: `28l-gauge` | an unfilled need produces a neighbour's need within one сводка; the hall's crowd follows mood |
| M907 | the dispatcher generator (§4.3) **done 22.10 (`28m-dispatch`)** | at every dock К ВАМ has ≥ 2 addressed + 1 urgent; verbs vary over five |
| M908 | access gates and the 30 rungs (§4.4) **done 22.10 (`28n-access`)** | no rung silent; «Мамонт» refused without clearance III + sponsor |
| M909 | the first watch (§10.7) **done 22.10 (`28o-firstwatch`)** | a fresh save: two addressed items by minute 2, urgent by minute 6, paper at hour 1 |
| M910 | story doors on deeds, the диспетчер's 72 lines, 30 stories on watch deeds, act 2 on the participation (§7.3, §10.3) **done 22.10 (`28p-doors`)** | chapter N+1's door is a deed; the sixth is met on the watch |
| M911 | orders as forks (take / send a hand), obelisk notches as the exploration arc (§7.2) **done 22.10 (`28q-fork`)** | every order has both sides; a found notch gives one access line |
| M912 | economy after the dispatcher **measured 22.10, §4.1b**: the first hour counts play (`28v-playhour`); the probe plays the dispatcher and a fresh save | at a human's pace T0, T1 within ±20 %, T2 at its edge; T3 in band only with the estate at the bot's pace |
| M913 | the logist in the probe **measured 22.10, §4.1b**: T3 at a human's pace, without and with the logist, minutes by phase | base + logist +10 % (6 h); with workshops −7…−28 %: the workshops are the remaining gap |
| M914 | an eater for ferro/plate **measured 22.10, §4.1b**: where one may stand within 3 jumps, at what shadow price, whether the haul pays | an eater may stand at home; the haul to the makers does not pay (~395 cr for 440–540 fuel); the eater's own good has no eater; no site rung within 3 jumps at the tier's start (M916: one at home after play) |
| M915 | workshops: three levers in numbers **measured 22.10, §11**: (а) a buyer for the next link, (б) a market for the last link, (в) the maker at home — cr/h at T3 and the code each costs | (а)+(в) is the pair (five workshops −3.8k → −0.2k cr/h at 6 h); no lever makes workshops a T3 income; 10 of 49 industrial goods have no consumer in the code; (в) is 1–3 lines, (а) ~40 |
| M916 | «no sites» checked **measured 22.10, §4.1b**: the probe's ladder or the game's | the probe's timing, not a bug: home climbs to ★11–13 in three hours at T3 (one site) and keeps it through a save; T0 stops at 10 on the drone gate; eaters need ★20–22 |
| M917 | the ten dead industrial goods **measured 22.10, §11**: who eats each by meaning, and what an eater gives a chain with (а)+(в) | nine of ten are base modules by name, hullsec the hull; a chain with an eater pays 0.4–13k cr/h, mostly through its internal links (shadow price at every link); none fits three sites and the ★20–25 tiers at T3 |
| M918 | the probe M912–M917 summed up for the author **written 22.10, §12**: proposals ranked by return per line, and what the measurements say to leave alone | (в) maker at home (1–3 lines) and (а) buyer of tier-1 goods (~40 lines) first: workshops −3.8k → −0.2k cr/h; prompt collisions; dead goods as base prices (~10 lines + a key each), late game; drone parts, internal-link pay and the allotment threshold disputed |
| M919 | the second hour, T0 → T1 at a human's pace **measured 22.10, §4.1b**: ten-minute slices of the fresh save; three buying orders (modules only / modules then T1 / T1 first); where the first wall stands | cash is the wall (the drone waits 71 min behind hold 3 and drill 3; T1 assembled at 161.7′ or, T1 first, 82.6′), walking takes 48–63 % of play, the hold and the ladder are not walls; T1's kit loses money in its first hour; an uninsured «Вьюк» lost in a fight at 82′ halves hours two and three; no §12 item moves these walls |
| M920 | the second hour across ten seeds **measured 22.10, §4.1b**: seed = random stream + start hour; both T1 orders; wrecks logged by minute, hull, insurance, phase | the uninsured «Вьюк» is lost in 4 of 10 runs within 3 h (2–3 in hour 2, never in hour 1), halving that hour; all wrecks fall in the probe's lap padding (idle in space next door), none with the wait at the pier; no run docked at a yard, so the Страхкасса was never offered; the first watch says nothing of insurance |

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
- **F6 · Who is a hand (M911).** Default: only an idle hired hand with a ship and no order takes
  the second side of a paper; the four of the settlement (Гуся, Рыба, Гвоздь, Птица) do not, and
  «Гуся's order is carried yourself» is not built. Price if refused: the four need their own
  availability and a voice per job, and Гуся's order needs a paper that refuses the hand.
- **F7 · The counter's floor (M908).** Default: the counter stays 3 % (at least 1 cr) above the
  buyback, but a rung never makes it dearer than without the rungs (cap at the price before the
  buyback lever); the rung's promise wins over the 3 %. Price: on narrow-spread goods the top
  rungs leave the counter at base with a 1 cr spread.

## 11. Workshops: three levers, in numbers (M915, 22.10) — for the author

Nothing here is built or changed; it is one page to choose from. The levers are switched on in the
probe only (`ECO_LEVER=a|b|c`, letters together; `ECO_LEVER_MUL` multiplies the shadow price;
`ECO_SHOPS=N` sets the number of workshops; code in `tests/91zzzw4-ecosim-est.js`, `leverSell`).
T3 at a human's pace with the base and the logist, as M913.

**What to read.** The workshops' own line — what they bring (raw sold into the bunkers, industrial
goods sold) minus what the hauls cost (fuel and the minutes booked to the «цеха» phase) — is clean
across variants: the runs are deterministic, so a lever changes it and nothing else. The tier's
total net is not: the dispatcher's take wanders by chaos alone. One workshop that never runs
(`ECO_SHOPS=1` without (в): it lands at a neighbour and is never fed, 3 cr/h) still moves the
dispatcher from 11.6 to 5.0 minutes an hour and the net from 13 943 to 7 291. The totals are
printed below for completeness; judge by the first columns.

**Five workshops** (the probe's estate of §4.1b: three at 0,-1, two at 1,0 — positions the ladder
would not allow, see M916):

| lever | workshops' line, cr/h: 3 h · 6 h | vs no lever, 6 h | left without a buyer, 6 h | tier net 3 h · 6 h (noisy) |
|---|---|---|---|---|
| none | −2 501 · −3 754 | — | ferro 31, plate 17: 6 993 cr | 11 873 · 9 132 |
| (а) buyer ×1 | −1 657 · −2 589 | +1 165 | 0 | 12 717 · 10 296 |
| (а) buyer ×2 | −813 · −1 425 | +2 329 | 0 | 13 561 · 11 461 |
| eater at home (M914) | −2 405 · −4 938 | −1 184 | thermoc 21, hullsec 1: 6 082 cr | 13 541 · 7 750 |
| eater + (б) | −2 091 · −3 835 | −81 | 0 | 13 855 · 8 853 |
| (в) maker at home | −944 · −2 224 | +1 530 | alloy 36, ferro 33, roll 54: 12 105 cr | 9 230 · 8 335 |
| (а) + (в) | +570 · −235 | +3 519 | 0 | 10 743 · 10 324 |
| (а) + (б) + (в) + eater | +1 169 · +942 | +4 696 | 0 | 15 524 · 12 561 |
| no workshops | — | — | — | 15 684 · 13 943 |

**One workshop at home** — what the ladder actually gives a T3 player after three hours (M916:
one site, at home). Without (в) nothing that eats the player's own ore may stand there:

| lever | workshops' line, cr/h: 3 h · 6 h | left without a buyer, 6 h | tier net 3 h · 6 h (noisy) |
|---|---|---|---|
| (в) — an alloy shop at home | +136 · −714 | alloy 34: 4 318 cr | 15 602 · 8 693 |
| (а) + (в) | +882 · +3 | 0 | 16 349 · 9 409 |

### (а) A buyer for the next link

- **What it is.** A station that buys tier-1 industrial goods (ferro, plate, roll, resin…) where
  they are not made. In the probe: any station but the maker's, at the shadow price × MUL.
- **What it gives.** The stranded stock turns into money: +1.2k cr/h at ×1, +2.3k at ×2 (five
  workshops, 6 h). Alone it does not make the haul pay. The haul's cost is not the 440–540 cr of
  fuel alone: the line books ~2.2k cr per haul in all (fuel plus the wages and upkeep that run
  during its minutes). The five-workshop line reaches zero at about ×3.2 the shadow price (6 h; ×3.0
  at 3 h — linear in the multiplier). With (в) it needs only ×1.
- **Where in the code.** `bldSellInd` (`src/12ad-site.js:271-279`) sells only into the player's own
  eater. The trade screen already has the row «ПРОМЫШЛЕННОЕ · РЫНОК НЕ БЕРЁТ» (`src/26e-ui-station-trade.js:258-269`,
  naming the nearest eater through `holdNearestEater`, `12ad-site.js:310-322`); the button goes
  there. Who buys: a list per station type. `ST_TYPES` lives in `src/06-galaxy.js:50-68`, and the
  station prices are rolled at `06-galaxy.js:164`, so a new list must use its own random stream or
  a table in a new module keyed by `stype`. A cap per shift, or the buyer is a bottomless sink: the
  ore appetite does this (`appetiteEat`/`sellQuote`, `src/12ab-hold.js:108-152`), but the pressure
  decay in `marketFor` (`src/12-economy.js:16-17`) walks only `TRADE_KEYS` and `FAR_KEYS`, so
  industrial keys need adding there. Money already goes through `earn`. About 40 lines in three
  or four files, no new save field (pressure lives in `G.market`).

### (б) A market for the last link

- **What it is.** Tier 2–3 goods (thermoc, hullsec, reactorb…) sold anywhere. In the probe: any
  station, at the shadow price.
- **What it gives.** +1.1k cr/h on the M914 eater chain (6 h). It does not save the chain: the
  eater adds hauls, and the line stays at −3.8k cr/h.
- **The finding behind it.** 10 of the 49 industrial goods have no consumer anywhere in the code:
  thermo (tier 1); selsyn, gyro, supercon, reactorb, accum (tier 2); hullsec, shell, launchf, panel
  (tier 3). Thermoc is consumed once, as 4 units of the Метеостанция's price (`src/12ac-bld.js:144`);
  techcomp goes into missile parts (`src/05-parts.js:446`).
- **Where in the code.** Two ways. Extend the (а) buyer to tier ≥ 2: the same code, a longer list.
  Or give each dead good a consumer: building prices (`12ac-bld.js:114-144`, upgrades in
  `bldUpgradeCost`, `12ac-bld.js:153-160`, which already take mline and habblock); hullsec into the
  hull itself (a repair or refit at a slipway — `03-ships`, `27-ui-ship`, the largest of the three).

### (в) The maker at home

- **What it is.** A workshop may eat what its own system makes, at least at home. In the probe:
  `bldRuleWhy` is skipped for home.
- **What it gives.** The haul disappears: the five-workshop line improves by 1.5k cr/h. But the
  output still has no buyer: 12 105 cr of alloy, ferro and roll are left after six hours. Alone, one
  workshop at home is roughly flat: +0.1k cr/h at 3 h, −0.7k cr/h at 6 h. Alloy is the soft case:
  it has a use (building prices, the shipyard), so its 4 318 cr are not all lost.
- **Where in the code.** `bldRuleWhy` (`src/12ad-site.js:141-146`) refuses a workshop that eats what
  the system makes: the planets' `PROFILE` and the player's own buildings (`sysMakes`,
  `12ad-site.js:134-140`). Its reason is in `12ac-bld.js:14-15`: «иначе не нужен маршрут». The change
  is one condition — the home system, or a rung; ★29 «Полдень» already lifts the rule at line 142.
  `tests/91zzzw9f-access.js:66` reads the rule. Size: 1–3 lines.

### Read together

- **(а) + (в) is the pair.** Each alone leaves money on the floor: (а) pays for hauls that still
  lose, (в) makes goods nobody buys. Together, five workshops go from −3.8k to −0.2k cr/h (6 h), and
  one at home from −0.7k to 0. With (б) and an eater on top, the line turns positive, +0.9k cr/h.
- **No lever makes workshops a T3 income.** The best line, +0.9–1.2k cr/h, is a tenth of what the
  base with the logist brings (§4.1b: 7.8k cr/h of ore). At T3 the workshops are a sink for the ore
  a player carries anyway, not a reason to carry more.
- **The ladder decides before the levers do** (M916). In three hours a T3 player has one site, at
  home, and without (в) nothing they carry may be eaten there. The levers matter for the
  neighbours only after landing, drilling and leaving a drone in each.
- Cheapest first: (в) is 1–3 lines; (а) is about 40 lines and a list of who buys; (б) is (а) with a
  longer list, or a consumer for each of ten dead goods.

### The ten dead goods — who would eat them (M917, 22.10)

For each good: the consumer it means by name, and what such a consumer gives in the probe.
`ECO_SINK=<good>` puts the whole chain down to that good at home (its maker and the makers of its
industrial inputs, without the ladder and without the three-site limit) and lets the eater take the
good at its shadow price, with (а)+(в) on. T3, a human's pace, the base and the logist.

| good (tier) | shadow, cr | eats it by meaning | chain at home | eater took, cr/h: 3 h · 6 h | chain's line, cr/h: 3 h · 6 h | starves |
|---|---|---|---|---|---|---|
| thermo (1) | 130 | base radiator (`BUILD.radiator`, `21a-mode-base.js:47`) | 1 shop | 433 · 368 | +430 · +364 | — |
| selsyn (2) | 496 | the gun's mount (`MODS.weapon`, `04-mods.js:12`); the base mast (`21a:56`) | 4 | 1 984 · 2 149 | +3 860 · +2 462 | — |
| gyro (2) | 858 | the engine's turn (`MODS.engine`, `04-mods.js:3`) | 4 | 2 002 · 2 288 | +3 832 · +2 598 | — |
| supercon (2) | 1 014 | the hyperdrive (`MODS.hyper`, `04-mods.js:11`); the base cryo shop (`21a:49`) | 4 | 1 352 · 1 352 | +2 653 · +2 640 | — |
| reactorb (2) | 1 122 | the base reactor (`BUILD.reactor`, `21a:24`) — the name says it | 4 | 2 618 · 2 244 | +3 108 · +1 570 | — |
| accum (2) | 470 | the base battery (`BUILD.battery`, `21a:35`) | 4 | 1 723 · 1 801 | +3 523 · +3 380 | graphite (no carbon at home) |
| hullsec (3) | 2 092 | the hull: repair at the base workshop (`baseRepairShip`, `21b1-base-pay.js:117-131`, today 14 hull per alloy); armour plates (`MODS.armor`, `04-mods.js:9`) | 6 | 3 486 · 3 138 | +6 363 · +5 468 | graphite |
| shell (3) | 3 275 | the base habitat (`BUILD.habitat`, `21a:29`) | 8 | 4 366 · 6 550 | +9 938 · +13 277 | — |
| launchf (3) | 1 388 | the base pad, «причал для переброски» (`BUILD.pad`, `21a:31`) | 4 | 2 776 · 1 619 | +3 101 · +2 422 | — |
| panel (3) | 2 677 | the base solar panel (`BUILD.solar`, `21a:25`) | 8 | 4 461 · 4 015 | +9 481 · +9 982 | graphite |

For comparison: the M915 estate with (а)+(в), −0.2k cr/h at six hours; thermoc already has its
eater (the Метеостанция's price), so it is not on the list.

Read it:

- **Every dead good has a consumer by name, and nine of ten are on the base** — the module that
  already exists and costs credits and alloy. Hullsec belongs to the hull (repair or armour); selsyn,
  gyro and supercon to the ship's modules.
- **A chain with an eater at the end pays — but mostly not through the eater.** The chain's line is
  two to three times what the eater pays: every internal link is paid too. Feeding a workshop its
  industrial input pays the shadow price (`bldSellInd`, `12ad-site.js:271-279`), and the share comes
  back on top. That is the bunker-and-share design (DESIGN-holding §6, «если ты возишь, то тебе
  производят»), but a deep chain at one station multiplies it: shell's eight links bring 13.3k cr/h,
  of which the eater pays 6.6k. A question for the author, not a fix.
- **None of these chains can stand in the game at T3.** A station holds at most three sites
  (`bldSitesAt`, `12ad-site.js:100-103`); the chains are 4–8 workshops; the C links need ★20 and the D
  links ★22–25 (M916). Thermo — one family-B shop, one site — is the only chain that fits what a T3
  player has, and it is the poorest: 0.4k cr/h. These are late-game pictures, or arguments for a
  chain spread over the player's stations — with the hauls M915 measured.
- **Carbon is the bottleneck at this home.** The probe sells no carbon at home (it is a fauna good and
  the bot does not hunt), so graphite makes nothing in three chains. Links that eat graphite among
  other inputs still run at a share (`bldTick` pays output by the share eaten), so the chains do not
  stop.

**What a consumer costs in the code.** The base modules pay through `canPay`/`payCost`
(`21a-mode-base.js:99-100`), which know credits and alloy only, and the price is spelled at `:459`
and `:471`. One generalisation — any key of `cost` from the hold — is about 10 lines; each consumer
after that is one key in `BUILD` (`21a:23-82`). Ship modules cost credits only (`modCost`,
`11-log.js:157-160`), so selsyn/gyro/supercon need the same generalisation on the ОСНАСТКА buy path.
Hullsec as repair is a second rate in `baseRepairShip` next to `HULL_PER_ALLOY` (`21b1:116`). All of
these files are outside this worker's list (21a, 11-log); the numbers above change no price.

## 12. Summary of the probe M912–M917 — for the author (M918, 22.10)

One page over §4.1b and §11: what the probe says to change in the game, ranked from the best return
per line of code to the most disputable, then what it says to leave alone. Every number is from
those sections (T3 at a human's pace with the base and the logist unless named; cr/h; 3 h · 6 h).
Nothing here is built; prices and balance are the author's.

**First: the uninsured hull, lost unwarned (M920).** In four fresh saves out of ten the «Вьюк» is
lost between minutes 82 and 162, uninsured, with every module on it. It goes in open space at a
neighbour system where the player digs (1,0 most often), not at the pier: the probe waits there
idle, padding a lap to a human's six minutes, and with the same wait at the pier none of twenty runs
lost anything. The game could have said so, and does not. The first hour's protection ends at
minute 60 without a word (`firstHour()` in `wreck`, `28i-insure.js:67`). The first watch has no
line about insurance (`28o-firstwatch`). The offer itself is a plate on the ДОСКА of a *yard* only
(`insSection`, `28i-insure.js:89`), and no run docked at a yard with a hull of its own. The M904c
screen nearest that minute is the shift bill on the ДОСКА (`billSection`, `27ib-bill.js:225`). It
shows wherever a bill is open or was issued, which is every few laps. It has a «Страхкасса» row
(`27ib-bill.js:31`, `:134-136`), but the row appears only once a hull is insured. Lever and its price are M921 (§4.1b).

### Proposals, ranked

**1. Let a workshop eat what its own system makes, at home — lever (в).** Today `bldRuleWhy`
(`src/12ad-site.js:141-146`, reason at `12ac-bld.js:14-15`, «иначе не нужен маршрут») refuses any
workshop that eats the system's own ore, so every feeding is a jump that costs ≈ 2.2k cr all-in
(fuel 440–540 plus the minutes' wages) against ~395 cr of goods. And the ladder gives a T3 player
after three hours exactly one site, at home (M916), so in the game as it is the one site a T3 player
has cannot hold anything that eats what they carry. With (в): the five-workshop line −3.8k → −2.2k
(+1.5k cr/h), one alloy shop at home +0.1k · −0.7k. Alone it strands output (12.1k cr after 6 h),
which is why item 2 follows. Cost: 1–3 lines (the home system, or a rung; ★29 «Полдень» lifts the
rule already at `:142`), plus the test that reads the rule (`tests/91zzzw9f-access.js:66`).

**2. A buyer for tier-1 industrial goods where they are not made — lever (а), together with (в).**
Ferro, plate, roll, resin… have no market; they become credits only in the player's own eater
(`bldSellInd`, `12ad-site.js:271-279`). A station list per type that buys them at the shadow price,
with a per-shift cap, turns the stranded stock into money. The pair is the measured best: five
workshops −3.8k → −0.2k cr/h (6 h), one at home −0.7k → 0, nothing left without a buyer. Where:
the button goes on the existing row «ПРОМЫШЛЕННОЕ · РЫНОК НЕ БЕРЁТ»
(`26e-ui-station-trade.js:258-269`); the list keyed by `stype` in a new module (the station roll at
`06-galaxy.js:164` must keep its random stream); the cap reuses `appetiteEat`/`sellQuote`
(`12ab-hold.js:108-152`) once `marketFor`'s decay (`12-economy.js:16-17`) walks industrial keys.
About 40 lines in three or four files, no save field. Even with it, workshops at T3 stay a sink for
ore the player carries anyway (+0.9–1.2k cr/h at best against the base's 7.8k), not an income.

**3. Three prompt collisions the bot steps around.** Not money; certain and small. The Жестянка's
«НАРЯД НЕ ЗАКРЫТ · НУЖЕН …» (`21-mode-surface.js:502`) takes ДЕЙСТВИЕ from any deposit within 56
of it, and its grammar reads «НУЖЕН ЛЕТУЧИЕ ГАЗЫ»; swimming takes the same key on water worlds;
«ВОЙТИ В ПОЯС ВОРОН» takes the landing prompt near a belt. A player standing by a deposit near the
Жестянка cannot dig it. Cost: a distance or priority check each, a few lines, in files this worker
may not edit (21-mode-surface, the belt prompt).

**4. Base modules priced in the dead goods — one generalisation, then one key each.** Ten
industrial goods have no consumer in the code (thermo; selsyn, gyro, supercon, reactorb, accum;
hullsec, shell, launchf, panel), and nine of them name a base module (§11, M917: reactorb → reactor,
panel → solar, shell → habitat…); hullsec is the hull (repair rate beside `HULL_PER_ALLOY`,
`21b1-base-pay.js:116`). A chain with such an eater pays 0.4k (thermo) to 13.3k (shell) cr/h in the
probe. But none of these chains fits a T3 player: four to eight workshops against at most three
sites (`bldSitesAt`, `12ad-site.js:100-103`), the C and D links behind ★20–25. At T3 it is thermo,
+0.4k; the rest is the late game's reason to build a chain. Cost: `canPay`/`payCost`
(`21a-mode-base.js:99-100`) taking any key of `cost` from the hold, and the price text at `:459`,
`:471` — about 10 lines; then one key per `BUILD` entry (`21a:23-82`). Ship modules (selsyn, gyro,
supercon) need the same on the ОСНАСТКА path (`modCost`, `11-log.js:157-160`), credits-only today.

**5. A market for the last link — lever (б), only on top of 1 and 2.** Tier 2–3 goods sold
anywhere is lever (а)'s list made longer. On the M914 eater chain alone it adds +1.1k and leaves
the line at −3.8k; on top of (а)+(в) with an eater the line turns positive, −0.2k → +0.9k cr/h
(6 h). Cost: a few rows in item 2's table. Behind 4 because a consumer by meaning is worth more to
the world than a counter that takes everything.

**6. The drone's parts line, 6 cr/min (§3.1) — disputed.** Measured, not built: it does nothing for
the band (2–3 % of a T1 row; T1 is in band at a human's pace), but it chooses for the player — iron
480 → 120 cr/h (payback 19 → 75 h), ice 280 → −80 (never), titan ~1.25k → ~0.9k, isotopes
~1.5k → ~1.1k. The honest reason to build it is that decision, not the money. Cost: a cost tick in
the drone loop next to `droneMayMine` (`12-economy.js:303`) and a line on the drone's card, ~10–15
lines and no save field if it is charged as it accrues.

**7. Internal links paid at the shadow price — a question, not a fix.** A chain at one station
pays at every link: feeding a workshop its industrial input pays `indPrice` and the share of output
comes back on top (`bldSellInd`). So a chain's line is two to three times what its eater pays —
shell: 13.3k cr/h, of which the eater 6.6k. That is DESIGN-holding §6 («если ты возишь, то тебе
производят»), and deep chains multiply it. If the author wants the eater to be the chain's money,
the internal sale pays a fraction; a few lines in `bldSellInd`. Late game only (item 4).

**8. The «Вьюк» allotment at turnover 3 000 — the most disputed.** T0 lasts 8–12 minutes of play,
not the oracle's two hours: the allotment (`12j`, `H.turn>=3000` at line 69) comes at 8.3 minutes,
and the «Вьюк» doubles a hand lap at once. It is the author's cut of the dullest stretch of the
start (M152e). If the start should be slower, this threshold is the one lever, not the dispatcher;
one number.

**The bottleneck at home: carbon.** Not a proposal, a fact every chain above meets: graphite starves
in three of the ten dead-good chains (accum, hullsec, panel) because the probe's home makes no
carbon (its worlds are fauna) and the bot does not haul it; carbon fibre runs only at a share on
organics. Whatever the author picks from items 1–5, the home's carbon decides how deep a chain at
home can go; the haul that would bring it costs what M915 measured (≈ 2.2k cr all-in).

**The home rung in a fresh save stays at 5.** Three hours of play bring 19 points, but the
landing gate (`rungOf`, `12ad-site.js:69-83`) holds the rung at 5: the fresh-save probe never lands
in its home system (0,0) — it digs at the neighbours. Nothing on the T0 → T1 path asks for a rung
(M919); a rung of 10 by the third hour needs a landing at home.

### Don't touch — the measurement said no

- **The dispatcher's pay.** Pay by effort was tried and reverted: it ignored jump fuel
  (130–250 cr), made urgent paper lose money and took nothing off the T0/T1 excess. Net ≈ 220 cr/min,
  urgent ≈ ×2 stand.
- **T0 and T1 levers.** At a human's pace T0 is −13 % / +9 %, T1 +12 % / −2 % of the oracle (with /
  without paper): the excess was the bot's 4-minute lap.
- **The logist.** Worth +2.6–3.5k cr/h to a base; base + logist is +23 % · +10 % at T3, the only
  estate inside ±15 %.
- **Wages as the T3 lever.** T3's gap was the missing base (bot pace −43 % → +10 % with it) and the
  hull's fetching minutes (the logist), not the commander's and keeper's pay.
- **(а) alone.** +1.2k cr/h at ×1; the five-workshop line breaks even only at ×3.2 the shadow
  price.
- **(б) alone, or an eater alone.** (б): +1.1k, line still −3.8k. An eater at home without (а)+(в):
  −3.8k → −4.9k (it adds hauls).
- **The access ladder.** Not a bug: home climbs to ★11–13 in three hours at T3 and the rung
  survives a save round (13 / 28 points before and after); T0 stops at 10 on the drone gate by
  design.
- **More drills on the base.** Five drills sat at heat 330 and drilled nothing (`baseHeatMul` 0); the
  best layout is four drills at heat 88 (×0.6). A base of 20 is a base of four drills.

---

*Judged against the remake laws:* nothing here adds a screen (L1 — every new thing is a plate
in a place), every face is the person generator (L3), every paper hangs on a thing (L5), and
the hero of each frame is the thing the player is about to act on (L6) — the clerk with the
notice, the pod drifting, the rank on the hull.
