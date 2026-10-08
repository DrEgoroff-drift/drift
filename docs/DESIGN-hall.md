# The hall behind the screens — the station as a place (M810–M815)

Design for Stage B of the remake (`DESIGN-remake.md` §4). Written 09.10.2026 from the scout of
`26-ui-station`, `27f2-room3d`, `27f4-cant3d`, `27f3-person3d`, `21pie-pln-marks`, `17gab-gpu-orb`
(`scratchpad/scout/station_hall.md`). The laws are those of `DESIGN-remake.md` §2 and
`DESIGN-planet.md` §3; nothing here overrides them.

## 1. What is wrong today

The station is a graphite table (`div.scr#station`, a centred card of ~1000/--ui px, z 20, HUD
hidden) that hides the station whole: a dock with no dock. The only room is the cantina, a
200–320 px strip in the flow of `#stBody` with its cards *below* it, a fixed camera
(`c3Cam`), one mannequin on four stools. The window of every room is a procedural sky
(`outside()`, `27f2:205`); no planet ever stands in it. The hull of the yard is a 52×42 px
thumbnail. Verdict in `DESIGN-remake.md` §3.2: **reinvent** — the station is a place; the
screen is a plate over its hall.

## 2. The idea in one paragraph

Docking opens a **hall**, not a table. The hall is one interior scene per station type, drawn
by the interior renderer (`r3Frame`) into a canvas that fills the whole station screen behind
everything. The sections of the station (ДОСКА, ТОРГОВЛЯ, КОРАБЛЬ, НАУКА, ЛЮДИ, ВЛАДЕНИЯ) are
**places in the hall** — the board wall, the counter, the yard window, the bench, the bar, the
office desk — and choosing a section glides the camera to that place. What the player reads and
presses is a **plate** hung over the hall at 60 % of the width; the other 40 % always shows the
hall itself, and through its window the station's own world: the dock, the slip, the foundry,
the planet it orbits. One hall holds the bar too: the cantina is not a separate strip any more
but the far end of the same room.

## 3. Composition

**Desktop (≥ 900 px).** The hall canvas is full-bleed under the screen. The plate stands on the
**right 60 %**, from the top edge to the bottom, an opaque dark material (one material, the
graphite of the plate; no navy, no felt). The left 40 % is the hall's hero zone: here stand
the counter and the keeper, the window with the planet, the board. Reading goes left to right:
first the place, then the words. The header (name, kind, money, СТОЛ) sits on the plate, not
across the hall. The nav (one row of sections) is the plate's top edge.

**Phone (≤ 760 px).** The hall is a strip of 36 % of the height at the top, the plate below it,
scrolling; the hall does not scroll away — it is fixed and the plate slides over its lower third.

**Human measure.** The camera eye is at 1.5 m, the counter top at 1.0 m, the window sill at
1.2 m, the door 2.1 m; the keeper is 1.75 m. At 1920 the keeper stands ~340 px tall in the hero
zone; at 390 the window and the counter must still read (the strip shows the counter's end and
the window — never the empty middle).

**One light.** The key is the lamp over the counter (warm, the only warm light of people);
the fill is the window (cold or hot by the type); everything else is bounce. Six shadowed lamps
at most (`R3P` limits: 32 instances, 16 parts, 12 lamps, 6 shadowed).

**A key never hangs straight over a head.** A spot right above a person burns the crown white
and the face falls into shadow: the keeper read as a mannequin until the counter lamp moved
.66 m toward the camera (M810 pass 4). Any key lamp sits at least .4 m off a person's head,
toward the camera; `91qc-hall` checks the keeper.

**A warm bounce, a cold day.** By day the floor bounce may warm the ceiling, but the ceiling's
hue stays within 15° of the wall's, and the tops of the walls by the second window stay cold,
so the day still reads as day.

## 4. The hall's bones and the seven dressings

Every hall has the same bones so the camera stations are the same: a floor, a back wall with
the **window**, a **counter** along the left, a **board** wall at the back-left, the **bar**
at the far right end (stools, shelf, the keeper's second counter), an **office desk** in the
right-back corner, a **door** to the dock behind the camera (never shown; it is where the
player stands). The bones come from `r3Kit` (`box/tube/lathe/slab/surf`), pieces assembled as
one body under one light — the `21pie` grammar's *rules* (pieces of one family, a base, an
accent, one light), not its code: `plnMarkMesh` writes 13-float vertices for the planet's
pass and cannot enter `r3Frame` without a port, and the port is not this milestone.

| `ST_TYPES.id` | Hall | Window (`S.win` kind) | Dressing | Fill light |
|---|---|---|---|---|
| trade Торговый узел | wide, low | dock — ships' lamps, gantries | crates and sacks on the counter, scales, a ledger, price chalkboard | warm amber |
| indust Промышленный комбинат | tall, girders | foundry — orange pour, sparks | pipes along the ceiling, a crane hook, dust in the air (`smoke` pass), oil drums | hot orange from the window, cold tube lamps |
| yard Верфь | long, hangar end | slip — a hull on stocks at ≥160 px, hoist chains | blueprint boards, a parts crate, a welding glow | cold white + a welding flicker as *movement*, not a blink |
| sci Научная станция | glass partitions | the planet, large | instrument bench, glass vessels, a star chart | cold blue-white |
| outpost Пограничный аванпост | narrow, one lamp | stars, a patrol hull passing slowly | lockers, sandbags, the flag of the power, a rifle rack | one warm lamp, the rest dark |
| fuel Заправочная станция | a kiosk, no bar | tank farm, a hose arm | a pump console, one stool, a vending box; no cantina door, no site | sodium yellow |
| bazaar Блошинец | stalls, hung cloth | dock, crowded | 4–6 stalls with goods, hanging lamps of three colours, 3–5 people LOD 0 | mixed, warm dominant |

The planet in the window: the station's **nearest planet** (by distance in `G.sys`) if any is
within 2 000 units, else stars. Drawn by `gorBody` into a texture of the window's size once
per docking (a wrapper that overrides the five frame uniforms of `17gab:473`), sampled by
`outside()` as the window's far layer. The orb keeps its M804 night side; the terminator in
the window faces the station's star.

## 5. The camera and the sections

Each section group (`ST_GROUPS`) has a **camera station**: `eye`, `target`, `halfW`:

| group | place | eye → target |
|---|---|---|
| board ДОСКА | the board wall | from the room's centre to the wall, the board filling the hero zone |
| trade ТОРГОВЛЯ | the counter | three-quarter view over the counter, the keeper at the left third |
| ship КОРАБЛЬ | the yard window | the window fills the hero zone; the hull in the slip |
| know НАУКА | the bench | low over the bench, the vessels catching the window's light |
| folk ЛЮДИ | the bar | the cantina's old view (`c3Cam`) reused: the stools, the hero on one |
| hold ВЛАДЕНИЯ | the office desk | over the desk with the map; the window at the edge |
| site СТРОЙКА | the yard window | as ship, panned right to the site's silhouette |

Choosing a section **glides** the camera (ease in-out, 600 ms, one dolly, no cut); the first
open comes from the door (a 900 ms dolly in from the back wall). `S.cam`/`S.vp` are
interpolated per frame; the hall renders only while the screen is open and only while the
camera moves or a person breathes (idle: 12 fps, the cantina's `rAF` loop reused and
widened to the hall).

## 6. People

The keeper behind the counter (`cpMesh`, role `keep`, pose `stand`, LOD 1), breathing,
head turning to the camera station within ±20°. The bar end keeps the cantina's cast
(`c3Layout`). `bazaar` adds 3–5 LOD 0 extras at the stalls. No clerk kit exists — the keeper
of the counter wears the `keep` kit with the type's accent colour; a clerk kit is M814's.

## 7. What stays, what goes

- **Stays:** all DOM of the sections and their logic (`renderTab`, the tab bodies), the header
  and footer buttons, `closeStation`; the cantina's cards and their hit-testing.
- **Goes behind a switch:** the cantina strip (`cantinaScene`'s `canvas.cant-room`) — the hall
  draws the bar instead; `HALL.on` true by default, `?hall=0` the old table until M890.
- **Changes:** `.scr#station` gets the canvas `#stHall` as its first child; the card becomes the
  plate (CSS only, M810); the cantina tab's canvas is hidden when the hall is on.

## 8. Milestones

- **M810 The hall** — the bones, the seven dressings, the window with the planet, the camera
  stations and the glide, the keeper, the plate layout at 1920 and the strip at 390. Gate:
  the dock pair at 1920 and 390 for three types (trade, yard, outpost); `errs 0` on open, section
  change and close; `test.ps1` green; vision clean.
- **M811 The counter** — goods as crates on the counter that match the market rows (the row
  hovered lights its crate); the table on the plate loses its prose line.
- **M812 The yard** — the slip's hull at ≥160 px is the `hullStudio` of the selected hull;
  the class as a tag on the plate.
- **M813 ПРИБОРЫ** — the five dials as objects on the bench with their drift; prose gone.
- **M814 ДОСКА, ЛЮДИ, ВЛАДЕНИЯ, СТРОЙКА** — the board on the wall with the notices as paper;
  the cantina recomposed (one hero, the sign off centre); the site's silhouette in the window.
- **M815 The phone reflow** — the strip, the plate, 44 px targets, the P1 gate on the hall's
  cost (≤ 4 ms on the S23 at panel density).

## 9. Tests (M810)

A Node suite `91qc-hall`: every `ST_TYPES.id` has a dressing and a window kind; every
`ST_GROUPS` key has a camera station; the hall's `S` for each type keeps the `R3P` limits;
the glide reaches its target within 700 ms of game time; `?hall=0` leaves the DOM as before.
A browser suite: open, change every section, close — `errs 0`, no bind group meets a foreign
pipeline (the M800a guard).
