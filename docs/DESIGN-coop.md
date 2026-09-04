# The cooperative — buying for yourself, and the people who do it with you

Design note, 2026-09-04 (author's brief in chat the same day). Replaces the route-gated buying of
M289 R3. Not built yet; queued as M351 in `PLAN.md`.

## 0. The ladder (author, 2026-09-04): на дядю → кооператив → своё

1. **Working for the house** (today's game, kept): the house gives the run — the order («наряд»,
   one per station, `11ah-offer`/`12aa-need`) and the assigned leg «ПО МАРШРУТУ · взять титан ×150».
   The goods ride on the house's account: you do not pay for them, you get the fee. You choose
   nothing; the counter is closed to you. This is the first hour and the exam's turnover.
2. **The licence — the cooperative.** Turnover proves you, the patron stamps the book. From here
   the counter opens (any good, capped by rank), the route on the map is *yours* (any seen
   stations, your capital, your risk), and **hiring opens**: hands and managers are cooperative
   members; `crewCap` is read from the cooperative's rank (I: 1, II: 3, III: 5) instead of the
   «license» tech, which becomes the cooperative's own paper.
3. **Own route and hired crew** — the holding, the barge, the drones, the fleet as today.

So the assigned leg does not go away: it is what a pilot without a cooperative flies. The old
R3 row stays for stage 1 and becomes a reminder for stage 2.

## 1. The three decisions

1. **The route is a pencil, not a permit.** On the map you tap stations whose prices you have seen,
   the game draws the legs and says what a lap pays; you save it and go. At a station the route
   only *reminds* («ПО МАРШРУТУ · на «Урнейур» ждут титан по 58»). It gates nothing.
2. **Buying at the counter is open — for a cooperative.** (Before it, only the house's assigned leg, on the house's account.) Any tradeable good, any station, at
   `buyPriceFor` with sliced pricing (audit A2: the ask rises inside the transaction per 10 units,
   the sale price falls the same way). Not open to a lone pilot: the law says a crew trades for
   itself only as a registered cooperative.
3. **The cooperative is the page in ДЕЛА** where everything on your payroll stands in one list —
   machines, hands, managers — with what they earned this shift, what they cost, and what they ask
   for. Their asks are the game's existing social buildings; granting one lifts their spirit, and
   spirit is a small percentage on everything they bring in.

## 2. Lore

«Закон о кооперации Главтрассы» — a late, grudging law: a crew may buy and sell for its own account
only as a cooperative registered under one of the four houses, which becomes its **patron**. The
patron's clerk at any of its stations takes the charter fee, looks at the record book (КНИЖКА), and
stamps it if the turnover is there. Nobody asks what you will trade; they ask whether you have
already traded enough not to be a tourist. The stamp is called «экзамен» by everyone and «проверка
оборота» by nobody. The cooperative has a name — the player types it, the game never offers one
(as with system names, `11u`) — and the name goes on the record book, on the ДЕЛА page and, through
the beacon (M349), on the air when the crew over-delivers.

## 3. Registration (the exam)

- Where: any station of a house; the house becomes patron. Fee 1 500 cr.
- Exam: `G.soldTotal ≥ 12 000` (the same turnover counter that allocates «Вьюк» at 3 000).
  The station says the number before you are ready: «взять товар могут только кооперативы ·
  оборот 3 400 из 12 000». The receiver mentions the law once in the first hour (`11ao`).
- Persisted: `G.coop = {name, house, since, sold0, spirit, wants:[…], done:[…], ledger:{}}`.
- Patron effects, small: the patron's scrip buys at its stations without the 6 % spread; its
  clerks greet by the cooperative's name; the beacon uses it.

## 4. Ranks (разряды)

| rank | name | needs | counter cap per visit per good | other |
|---|---|---|---|---|
| I | Кооператив | exam | 60 units | buying opens |
| II | Артель | turnover since registration ≥ 100 000 and 2 asks granted | 150 units | drone shops sell 2 per two days |
| III | Товарищество | ≥ 500 000 and 4 asks granted | no cap | `BUY_SPREAD` 1.06 → 1.03 |

The cap is the brake the audit needed once buying is open: with sliced pricing and a 60-unit cap a
«Стриж» trades as today; a «Вьюк» fills only at rank II, after the player has already built a
holding. Re-measure with `91zzw-eco-probe` after building; expected peaks ~700 cr/min at I,
~1 500 at II with rotation, sustained lower.

## 5. The page in ДЕЛА

First block of the ДЕЛА tab (`11-log` `renderDeeds`), above the orders:

```
КООПЕРАТИВ «ТИХИЙ ХОД» · АРТЕЛЬ (II) · под домом «Ковш» · с 14-го дня
машин 10 · людей 5 · управляющих 1 · настроение бодрое (+3 %)
ЗА СМЕНУ · торговля 1 200 · дроны 3 400 · наёмники 600 · пай 300 · = 5 500
            оклады 800 · ремонт 120 · чистыми 4 580
ПРОСЬБЫ
  · столовая на «Солзеикс» — «люди едят всухомятку» → рейсы реже кончаются худом, +1 % дух
  · ангар — «десять машин, а чинят под открытым небом» → дроны не ломаются там, +2 % дух
  · выходной в День Свободы Трасс — «один день в году» → +1 % дух, без стройки
```

- **Members** are whatever is on payroll: `G.drones` (+inventory), `G.crew`, `G.mgrs`, the own
  barge. No new entity — the page reads the lists that exist.
- **Ledger per shift** (`HOLD_SHIFT`, 20 min): `earn(sum, why)` already names its source; the
  cooperative keeps a rolling sum per `why` for the current and last shift (`G.coop.ledger`), and
  costs from `crewPayroll`, `crewRepair`, drone fix downtime (as lost minutes × rate, shown, not
  charged). Nothing simulated: the same numbers the game already moves.
- **Asks** are generated from composition, at most three open at once, each pointing at an
  existing building of family G on a holding station (`12ac-bld`): ≥3 hands → столовая; ≥5 drones
  → ангар (F); a manager → отдел кадров; ≥2 managers → красный уголок; hands captured twice →
  медпункт; ≥10 drones → учебный пункт. Two non-building asks: a holiday off (`11am`: no runs
  sent that day) and a name plate on the hull (a «Сорока» cosmetic, M344). An ask granted moves
  to `done`, says thanks in ЛЮДИ, and adds spirit.
- **Spirit** (`дух`): integer 0…5, each point = +1 % on drone output and hired-hand gross, shown
  as words: ровное / бодрое / кислое. Up: an ask granted (+1 or +2), the holiday kept. Down: wages
  unpaid at a shift's end (−1), a member captured and not ransomed within a day (−1), a manager
  gone renegade (−2). Never below 0, never above 5 — a small number that says the crew is people.

## 6. What changes in code (for M351)

- `12r-route`: drop R3's gate; keep the reminder row. Route stays a calculator on seen prices.
- `12-economy`: `buyPriceFor`/`sellQuote` sliced per 10 units (A2); counter cap by rank.
- `26-ui-station`: a ВЗЯТЬ row per tradeable good with a quantity picker (10 / 50 / max); the
  closed-counter line with the turnover before registration; the registration row at a house
  station (name input, fee, stamp).
- New `12aj-coop.js`: state, ranks, ledger hooks (`earn`, payroll), asks, spirit, `coopMul()`
  read by `stat().droneRate` and `crewEff`.
- `11-log` `renderDeeds`: the block. `14-save`: `coop` with defaults. Tests `91zzzzb-coop`: exam
  threshold, caps by rank, sliced pricing monotone (a 150-unit buy costs more than 150 × ask₀),
  ledger sums equal what `earn` moved, spirit bounds, an ask appears only from composition.
