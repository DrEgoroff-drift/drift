# Economy audit — 2026-09-04 (0.337.0)

Measured, not guessed: `tests/91zzw-economy` (existing report suite) and the new
`tests/91zzw-eco-probe` (rotation with real `buyCargo`/`sellCargo` and pressure, drone cycles,
part tiers). Seed world, radius 7, 68 stations. All rates are credits per real minute of play.

## 1. Where money comes from (measured)

| source | rate | note |
|---|---|---|
| hand trade, «Стриж» hold 40, from 600 cr | **717 cr/min** sustained over 40 laps (141 min) → 102 000 cr | best single leg 1 665 cr/min; 20 legs above 1 000 |
| hand trade, «Вьюк» hold 150, from 20 000 cr | **3 009 cr/min** sustained (140 min) → 440 000 cr | best leg 6 313 cr/min = 19 570 cr per 3.1 min; 753 legs above 1 000, 61 above 3 000 |
| need (×2, one delivery) | up to 10 800 cr one-off | 21 of 68 stations; closed a week |
| order («наряд») | 2 118 cr avg for goods worth 945 | 39 of 68 stations, one at a time |
| drone, crystals | 33 cr/min per drone, 6 500 cr per cycle (195 min) | ice 2, titan 15, iridium 30 |
| drones, 20 on one crystal point | **581 cr/min** for 44 000 cr invested | pressure floor −35 % is the only brake; no cap per point |
| holding, best pai ×1 | 296 cr/shift = 15 cr/min | suite already flags §16.2 ×0.94 and §16.1 ×1.07 against targets 1.3–1.8 / 1.5–2 |
| hired hand | −2 cr/min expected, tails | by design |
| manager | 0 from the player; cut 4–9 % | by design |
| bounty | 183 / 315 / 447 cr per kill at danger .2 / .5 / .8 | plus a part 30–75 % |
| scrip | ≤ 40 units per visit, 6 % spread, moves 3–12 points on events | bounded, no hole |

Sinks per leg are small against these: a 1-sector jump costs 22 fuel ≈ 200 cr, dock repair
14 cr/hp, a mod 900–1 600 (×(lvl+1)^1.55), a hull 3 400–24 000, base buildings 1 000–4 000 plus
alloy, patches 180–380. The design says «no debt», so sinks are not the lever; the faucets are.

## 2. The holes, ranked

**H1 — hand trade scales with hold × noise, and pressure lands after the sale.** Station base
prices carry ±36 % noise, hubs ×1.08 / outposts ×0.9, xeno base 190: the best pairs sit at ×1.9
(140→271). `sellCargo` prices the whole quantity at the pre-sale price and moves the pressure
only afterwards; `buyCargo` the same for the ask. So one 150-unit sale takes full price for all
150 and the −35 % floor only bites the *next* visit — with 21 620 legs in radius 7 the next visit
is somewhere else. Result: 180 000 cr/h on «Вьюк» against a target curve of «garage 70 000 by
hour 5–6». Everything else in the game is calibrated as if trade paid 200 cr/min.

**H2 — drones: every drone gets its own full pool on the same point.** `droneCapacity(res)` is
handed to each deployed drone; twenty drones on one crystal deposit are twenty pools of 117.
The only brake is the market floor (−35 %), so income is linear in drone count: 581 cr/min
passive for 44 000 cr, 24 h offline cap → ~830 000 cr per day for logging in. Pressure decays on
`G.t` (play time), never offline, so the floor holds — but the floor is 65 % of price, not zero.

**H3 — planned: rare raw for matches is a faucet.** Scooping yields .012 units/frame in the
corridor = 43 units per minute at 100 % band time; at a realistic 50 % that is ~1 300 volatiles
per hour → 130 matches/h at the planned 10:1, against ~1.7 matches per part (a part costs
2 700–5 800 cr or a pirate kill). Must be re-priced before M343.

**H4 — small, by design, leave alone:** need ×2 (event, once a week), orders (one at a time),
scrip (40 units, 6 % spread), crew (a bet), managers (cut only). They only look small because
H1 dwarfs them; after H1 they are the tails they were meant to be.

## 3. Variants for the author

### H1 hand trade — pick one or combine (recommended: A2 + A1 at ±22 % + A4)
- **A1 · less noise, more structure.** Noise ±36 % → ±15–22 %; spread comes from station type,
  region theme, need and appetite — things the player can read and plan against. Best pair ratio
  ~1.9 → ~1.4; «Вьюк» leg 19 570 → ~6 000 cr.
- **A2 · the counter sees your hold.** Price the sale (and the buy) in slices: pressure applies
  per 10 units *within* the transaction, so 150 units earn the integral, not the top price ×150.
  At .005/unit the average discount over 150 units is ~26 %; hold stops scaling linearly.
  Cheap to build (a loop in `sellQuote`/`buyPriceFor`), reads honestly («вторая сотня дешевле»).
- **A3 · mass costs fuel.** Jump cost 9+13·d → ×(1+held/200): a full «Вьюк» pays ~1.75×.
  Alone it is weak (200 cr against 19 000), with A2 it makes range matter.
- **A4 · pressure half-life on real time, 6 h.** Today pressure decays only while playing
  (`G.t`); a player who flies 2 h and returns tomorrow finds the same floor. Real-time decay
  makes the world breathe; offline drones already use `Date.now()`.

### H2 drones — recommended: B1 + B3
- **B1 · one pool per point, shared.** The deposit key `"sx,sy,pi,res"` owns the pool
  (`droneCapacity`); N drones split it and finish N× sooner for the same money. No new rule to
  explain: «точка выработана» already exists. Income per hour becomes bounded by *points found
  and visited*, which is the game's own currency (a hundred addresses).
- **B2 · points regrow slowly.** A worked-out point refills over 7 real days (lazy, by
  `Date.now()`), so a tended field pays again but not on the same day.
- **B3 · offline cap 24 h → 8 h.** With B1 it matters less; keep the sentence «дрон работает и
  когда игра закрыта», shorten the catch-up.
- **B4 · a hard cap of drones per system (6, the manager's own limit).** Rejected as the only
  fix: a rule the player bumps into, not a property of the place.

### H3 matches from raw — recommended: C1 + C2
- **C1 · 40 raw → 1 match, cap 200 units per stop** («кладу из своего коробка»): at most 5
  matches per stop from raw; the keeper's store is finite.
- **C2 · parts stay the main source**: 1.7 matches/part at danger .5, 3.8 at .8; a 60-match
  unique = ~35 parts or ~30 kills in the dark. That is hours, not days.
- Re-price the planned papers upward once H1 is fixed: Страница журнала 6 000, Список отказов
  4 500, Карта области 2 000 (they were set against a 12 000 cr/h economy that does not exist).

### What falls into place without touching it
After A1+A2 the best leg per hold unit drops from ~38 to ~20 cr/ед; the holding's pai
(35.6 cr/ед) then meets §16.2 (×1.3–1.8) by itself, and the trade+pai ratio §16.1 lands near
its target. Need and orders become the events the design wanted.

## 4. What the tests must hold afterwards
- `91zzzzy-play` «деньги не печатаются» stays; add: a 150-unit sale earns less than 150 × the
  opening price (A2), and N drones on one point never exceed one pool (B1).
- `91zzw-eco-probe` prints the new rates; targets to write down after the author picks:
  «Стриж» 150–250 cr/min, «Вьюк» 500–900 cr/min sustained, 20 drones on one point = one cycle.
