# The suit as a kit (M152)

Design, 2026-08-23. Today the suit is one number, `S.suit` (charge 0–100): spent in caves, on the
drill and by shots in raids (`st.suitWear`, `S.armor`), recharged by the ship. There is a jetpack
(`20d-jetpack`: burn, regen, max thrust), a lamp in caves, a walking speed, a hold carried on foot.
This milestone makes the suit a **kit of six places** and routes every effect through those
existing knobs — nothing new in the combat maths.

## Six places, always a trade-off

| place | gives | costs |
|---|---|---|
| helmet | scan range, cave field of view, head armour in raids | weight |
| torso | charge capacity (100 → 140 → 180), armour | walking speed, jet burn |
| gloves | drill and repair speed | precision (mining hits wider) |
| boots | walking speed, falls from height, footing per biome (ice/sand) | noise — beasts shy earlier |
| pack (jetpack) | fuel, regen, max thrust | weight |
| lamp | light radius in cave/dig | eats charge |

Weight is the common currency: it slows walking and feeds jet burn. A heavy armoured kit walks
like a barge; a light kit dies in a raid. No piece is a plain "+1".

## Pieces

A piece has a **model** (fictional in the Soviet key: «Стриж-2», «Буревестник», «Гагара-М»,
«Ястреб-Т», «Кречет-3»), a **class** I–III, **wear** in the four layers of `docs/PASSPORTS.md`
(new / worn / patched / foreign), and **two mod slots**. Mods are patches, not numbers: heated
liner, reinforced seam, breathing cartridge, spare glass, stitched knee, lamp reflector.

## Where it comes from — not a shop

- issued at institute depots by the plan (`11r-plan`): a class-I set is standard issue;
- found in hulks and on the flea (`12ua-flea`) — worn, sometimes foreign;
- given by stories (a piece is a trace);
- **repaired and modernised at home in the workshop** — the "workshop" tier finally has a job.

## Screen

In the home, on the workshop tier: the astronaut figure with six places, pieces in cells, the
effective stats in one line below in the passport style, not an RPG table
(«заряд 140 · ход 0.9 · броня II · ранец 1.2 · свет 1.4 · шум высокий»).
The cockpit HUD line for the suit shows the torso model instead of a bare percentage.

## Data and tests

`12x-suit` (pieces, mods, models), `11y-kit` (effective stats → `st.suitWear`, `S.armor`,
`JET_*`, walk, lamp). Persisted `G.kit` (six places + a shelf at home). Suite `91zzg`: each place
changes exactly its knobs; weight slows and burns; wear layers render; a foreign piece has no mods.
