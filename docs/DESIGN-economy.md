# The economy without a debt (M152e)

Design, 2026-08-23, agreed with the author. The brief: **the player earns for himself, grinds
moderately, hires stay a bet with tails, drones stay a passive on the spot.** The market is kept.
What changes is what *forces* grinding, and what makes each earning an event. No salary, no
"allocation economy" — those were considered and rejected.

## Where the numbers stand (0.110.0)

- Start: 600 cr, «Стриж», hold 40. Ore 7–105 cr a unit; station prices are the base ±36% noise,
  trade hub ×1.08, outpost ×0.9. Selling presses the price down (to −35%), half-life 30 min.
- One trade leg: 300–600 cr minus fuel (5–12 cr a unit). A dig: 1–3 units a cell; the suit
  charge bounds the visit. Drones: `ratePerMin × price`, sell on the spot.
- Steps up: a mod 750–1600 · a hull 3 400–24 000 · lab assemblies 900–2 600 + alloy · the home
  grows on turnover 1 000 → 9 000 → 70 000 → … → 2 000 000.
- **Drains per minute:** a hire 22–34 cr/min (a run returns 85% by design); a manager 58–70
  cr/min **plus** a 5–9% cut; the HQ shows «содержание 261 кр/мин». Three managers and two hires
  are 300+ cr/min against 300–600 cr per hand-flown leg.
- Fourteen `earn()` sources (trade, bounty, deal, job, drone, base, escort, scrip, crew, mgr,
  rogue, ai, free); none scales, and the tails (a captured hull, a drone's rarity, a find) pass
  as `dim` log lines.

## Diagnosis

1. **The drain per minute is the only thing that obliges grinding.** Remove it and grinding
   becomes a choice.
2. **The flat start:** fifty identical legs to the first real hold («Вьюк», 6 200).
3. **Legs are indistinguishable:** ±36% noise says nothing about where to go.
4. **The tails are invisible:** the most interesting part of the economy is a dim line.

## The nine changes

1. **No manager salary — the cut only.** A manager lives on 5–9% of his domain; a wage is paid
   only out of the domain's own revenue, never from the player. A hire is paid **per run**; idle
   costs nothing but morale. «Содержание штаба» ceases to exist as a notion. (Design rules in
   `CLAUDE.md` stand: the cut is taken before the money reaches the player and is always shown;
   the hire stays a bet.)
2. **Station need** — the Soviet deficit. Every few days a station develops a need («Цициин:
   кончилась органика»): heard on the receiver, shown on ДОСКА, price ×2 **for one delivery**,
   then closed for a week. A second run pays the ordinary price. The delivery is an event: a line
   in ЛЮДИ, the station remembers (`12k-rep`). Rumours become money; 15% are wrong.
3. **One order, not a list.** ДОСКА carries **one** order («наряд») per station: «Отвезти 30
   изотопов на Урнейур до 12-го · 1 800 кр». Taken — no second until closed; expired — simply
   gone. Orders come from the region plan (`11r-plan`); in the second act, from the circular.
4. **The first hull by allocation, the rest for money.** Once, when turnover reaches ~3 000,
   the plan allocates a used «Вьюк» (foreign wear, a passport with a history). Everything after
   is bought as now.
5. **Tails on display.** A hire's trophy, a drone's rarity, a find go to the table (M151a) and
   to the **home case** (the "case" tier gets its job): «Дед Кузьма притащил корпус „Скат“».
6. **A find handed to the institute — 25%.** The Soviet treasure law. A satellite, container or
   hulk is sold on the flea at full price as «чужое», or **handed in for a quarter** with a
   record-book entry, a topic (M162) and trust. Two roads from one find.
7. **The rationalisation proposal.** The first alloy of a kind fused in the lab (M40) pays a
   one-off premium and a record-book line; repeats are just alloy.
8. **A price chart on the table.** Last seen prices and needs on the county charts (M141).
   Planning a leg on paper, as the factor does.
9. **The market fills slower.** Price pressure after selling holds hours, not thirty minutes:
   flying further beats shuttling one leg. Soft, no bans.

## Target curve

10 min: the first mod · 20 min: «Вьюк» by allocation · 1 h: the first hire and drone ·
2–3 h: a manager on the cut · the home's garage (70 000) by hour 5–6. The player does it all
himself, something new every hour, and no minute is a debt.

## Method — measure first

A simulation suite `91zzw-economy` drives the real `G` through 60 game-minutes under three
profiles — hands only / with hires and a drone / with managers — and prints cr/min per `earn()`
source and per drain. Numbers are tuned against that printout, not by feel; the suite stays as
the guard that the curve does not drift in later milestones.

## Code

`12-economy` (need, pressure half-life), `12c-mgr-core` (cut only), `12a-crew` (pay per run),
`11ag-orders` (one order per station, on ДОСКА), `12j-home` (allocation at 3 000 turnover, the
case), `17b-finds` (hand-in), `12h-relic`/lab (rationalisation), `11k-charts` (prices). Persisted:
`G.need` (sparse by `"sx,sy"`), `G.order`, `G.alloc`, `G.ratios`. Suites `91zzw` (simulation),
plus cases in the suites the mechanics belong to.

## Measured (0.112.0, `91zzw-economy`, seed world, radius 7 → 68 stations)

- hands, «Стриж», 600 cr, no need: best leg 642 cr / 3.1 min ≈ 207 cr/min → first mod in ~6 min;
- hands, «Вьюк» 150, no capital cap: best pair 20 770 cr a leg (a tail, not the norm);
- need: with `NEED_P=.42` 30 of 68 stations had one — too ordinary, set to `.3`; best one-off
  delivery of 40 units 10 800 cr;
- orders: 39 of 68 stations, average pay 2 118 cr for goods worth ~945 cr;
- drone 25 cr/min for 2 200 cr (pays off in ~90 min); hire −2 cr/min in flight;
- managers: 52–70 cr/min wage each, now paid from the cut; drain from the player: 0.
