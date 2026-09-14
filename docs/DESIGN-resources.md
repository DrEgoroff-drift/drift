# Ten new resources — the farther, the dearer, as luck will have it (2026-09-14)

> **Reviewed the same day — `docs/DESIGN-review-2026-09-14.md` wins where it differs:** гелий-3 →
> «солнечный газ», палладий → «белая руда», антивещество → «ловушки» on the hold row; every eater
> speaks at its counter (review §3); glyphs and hues in the review §4.4.

The author, 14.09.2026: «ещё про ресурсы надо подумать, добавить с десяток. Чем дальше, тем
ценнее, но как повезёт». The model, the ten, the luck, the prices, the eaters and the queue Р1–Р5;
nothing is built. This is the reason to ride the mainline out (`DESIGN-metro.md`): the rim pays.

## 0. What there is (0.449.0, `02-world`)

Ten trade goods (лёд 7 … кристаллы 105, углерод and ксенобиом from fauna), four rare raws with no
market and a named eater (летучие газы, кристаллы льда, техкомпоненты, сплавы), the industrial
chain (tiers 1–3, sold only where a shop eats them), missiles, people. Deposits come from planet
profiles (`PROFILE` by world type) and `BELT_RES`. Every existing good is findable in the settled
circle; distance changes the tier of parts and the danger (`sysDanger`), **not what is in the ground**.

**The constraint the code states:** goods added later take **their own random stream** — otherwise
the generation of every existing station and planet shifts (the note above `FAUNA_RES`). All ten
below roll from a new salt; no existing deposit, price or station moves.

## 1. Laws

1. **The farther, the dearer — in the heart.** A far good is cheap where it is found and dear where
   people live. The value is made by carrying it back.
2. **Luck is a heavy tail, not a coin.** Most deposits are poor, some are good, one in hundreds is
   a **жила** that pays for the trip ten times. Luck is honest: the roll is the world's, it is seen
   by the scanner, and nothing is hidden (unlike `crewLuck`, which stays hidden by design).
3. **Every good has a verb and an eater.** Found by a verb the game already has (drill, belt, scoop,
   fauna, cave); eaten by someone named on its row (the rare goods' `use` rule — «и нафиг они нужны»
   must never be asked again).
4. **One property per good, at most.** Heavy, fragile, perishable, dangerous — a far good is
   interesting cargo, not a number.
5. **Nothing derived persists** — deposits are rolled from the seed; only what was dug persists
   (`G.mined`, as today).

## 2. The ten

Three bands by distance from the core (sectors): **frontier** 10–25, **deep** 25–40, **rim and
beyond** 40+. Base price = the price in the heart; at its own band it sells for half (§4).

| # | good | band | where, by which verb | property | heart price | eater |
|---|---|---|---|---|---|---|
| 1 | **Гелий-3** | frontier | gas giants — the scoop (`19a-mode-scoop`) | — | 85 | reactors: shipyard reactor density; the holding's power shop |
| 2 | **Палладий** | frontier | metal belts — the belt | — | 95 | instruments and the ПРИБОРЫ tier; the co-operative's workshop |
| 3 | **Космический янтарь** | frontier | caves of ice and jungle worlds — the cave; a resin with things caught inside | **fragile**: a hull hit cracks 20 % of it to «крошка» (sells at a third) | 130 | the Коммуна's jewellers (×1.5 in its land); a book for ПОЛКА about what is inside |
| 4 | **Осмий** | deep | metal worlds — the mine, deep veins | **heavy**: one unit takes two of the hold | 190 | armour: the shipyard's armour density; hulls of ГЛАВТРАССА |
| 5 | **Звёздный чернозём** | deep | the surface of jungle and terran worlds far out — the drill | — | 170 | **greenhouses**: bases, the holding's farms, the дачники (birchpunk Д9) pay ×1.5 |
| 6 | **Магнитная пыль** | deep | belts around white dwarfs and neutron stars (by star class) — the belt | — | 260 | shields: shield parts' density; Орднунг's rails |
| 7 | **Жемчуг пустоты** | deep | the void's fauna — the hunt (`20f-fauna`) | — | 320 | the Компания's luxury counter (×1.5 in its land); the hotel's shop (life Ж3) |
| 8 | **Тёмное стекло** | rim | volcanic and crystal worlds around dead stars — the drill | — | 600 | Хай-Фронт's optics (×1.5 in its land); the instrument that reads deposits finer (§3) |
| 9 | **Антивещество в ловушке** | rim | gas giants past r = 40 — the scoop, with a trap in the hold | **perishable and dangerous**: loses 1 % a minute unless the reactor feeds the traps (energy drawn); a hull breach below 20 % detonates it — the cargo is gone and the hull takes a blow | 900 | the heaviest torpedo; a reactor's top tier; bought by every power's navy |
| 10 | **Нейтронная крошка** | beyond (r > 50) | the smallest bodies around pulsars — the drill, the deepest | **heavy**: one unit takes five of the hold | 1 500 | доводка at a yard (shipyard §6) instead of a node; the heaviest armour |

Names are ordinary words on purpose — янтарь, чернозём, крошка, пыль — the naming register: the
edge of the galaxy in the words of home.

## 3. Luck — the heavy tail, and how it is read

**Presence.** For each system and each of the ten, a roll on the new salt: a good appears only in
its band and its places, with a probability that rises through the band (frontier goods thin at 10,
common by 20). Beyond its band a good keeps appearing — the frontier's goods are everywhere past the
frontier — but the band's own are what make a place worth the ride.

**Richness.** Each deposit's richness is `exp(N(μ(r), 1))` — a lognormal whose median grows
slowly with distance. What that means in play, per deposit found:
- ~70 % **бедная** (a few units, «на обратную дорогу»);
- ~25 % **хорошая** (a hold's worth);
- ~5 % **богатая** (×5);
- ~0.5 % **ЖИЛА** (×20) — announced on the spot, a word across the screen and a line in ДНЕВНИК;
  within a сводка it becomes a rumour at the nearest stations (`11t`), and after that the approach
  to that system has company.

**Reading it.** The scanner shows a deposit as a range, «осмий: 40–160», and the range narrows by
the instrument's resolution — the professions' honesty rule (`03f-hull-role`: a poor instrument is
coarser, never lying). The изыскатель sees ±10 %, the рудовоз ±60 %; tier-8 тёмное стекло in the
instruments narrows every reading by half. So luck is gambled on *before* the landing, by a
reading, and the good instrument is a real advantage out there.

## 4. Prices by distance

A far good sells for **½ of its base in its own band**, **1× at the edge of the settled circle**
(r ≈ 10), **1.3× in the heart** (r < 6) — and each power's eater adds ×1.5 in its land (the table).
The live market (`12-economy`) already lowers a price you flood and lets it recover; that keeps
one жила from printing money. Far goods also appear for sale in the heart, rarely and dear —
a player who does not go can still buy one for the shipyard.

The arithmetic the design is after: a mainline ticket to the deep band and back with baggage costs
the value of ~10–20 units of a deep good; a good deposit is 30–80 units; a жила is several hundred.
The trip pays when luck is average and makes a fortune when it is not — and a poor trip still pays
its ticket in the frontier goods on the way.

## 5. The queue — Р1–Р5

- **Р1 the table and the roll** — ten rows in `RES` with band, verb, property, price and eater
  line; the new salt; presence and lognormal richness per system; a Node suite: the distribution
  over 10 000 systems matches §3, and **no existing deposit or station changed** (the old salt's
  hashes before and after).
- **Р2 reading and ЖИЛА** — the scanner's range by resolution; the жила's word, ДНЕВНИК line and the
  rumour after a сводка.
- **Р3 prices by distance** — the ½ / 1 / 1.3 curve and the power eaters; heart markets list far goods
  rarely.
- **Р4 properties** — heavy (hold ×2, ×5), fragile (крошка on a hit), perishable and dangerous
  (the trap's energy draw, the detonation below 20 % hull).
- **Р5 eaters** — the shipyard densities (reactor, armour, shields, instruments; доводка by
  нейтронная крошка), greenhouses and дачники, the jewellers, the luxury counter, the navy's buy.

Order with the others: Р1–Р3 before the mainline (М1–М6) is worth riding; Р4–Р5 with the shipyard.
