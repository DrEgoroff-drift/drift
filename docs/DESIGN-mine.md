# The mine as a working rudnik, under the planet it is dug in (M631)

15.10.2026. Built solo on `planet-main`; supersedes the play half of `DESIGN-dig-scene.md` (the
rock, the light and the rooms of that design stand). Code: `23c` (frame), `23ca` (rock), `23cb`
(dressing), `23cc` (play), `23cd` (the planet above), `23ce` (biters). Switches: `?dig=0` — the
old mine whole, `?digtop=0` — the mine without the planet over it, `?digbeast=0` — the flat
biters.

## 1. Why

The author, 15.10: «че он вниз лезет и висит, давай че нить сгенерируй что типо реально шахта»,
then «грызунов с поверхности возьми и еще все соедени с поверхностью, а то сейчас где то
абстрактно шахта … где выкопал вниз уходит и планета там наверху остается как была», and
«короче бесшовно». Three faults: the man gnawed cells in four directions and hung in an empty
tube; the mine lived under an abstract sky, not under the planet one had just walked; the
biters were a 2D brush unrelated to the planet's beasts.

## 2. The rudnik

- **The shaft** is column 0. A **cage** rides it on a rope: W/S move it between stops, W at the
  top is out. At the collar the cage stands on the planet's ground; A/D there steps out of the
  cage onto the surface (the detectors' «A» gesture now has an answer).
- **Levels** every five rows (4, 9, 14 …). From each one **drifts** run sideways up to 40 cells
  (92 m); the man walks their floor (A/D) and never hangs.
- **The face** is a drift's end: walking into it drills, the drift grows a cell (2.3 m); rock goes
  to the dump, ore to the cage.
- **The cage carries the ore up** (22.10). It has its own load meter, 24 places counted like the hold
  (heavy ore takes more, `resW`); the prompt reads «КЛЕТЬ n/24 · ТРЮМ n/N». A full cage stops ore
  faces with «КЛЕТЬ ПОЛНА — РУДУ НАВЕРХ, К УСТЬЮ»; dead rock still drills. When the cage stands at
  the collar the load goes into the hold; what does not fit stays in the cage and waits. The load is
  kept in the mine's record beside the workings (`rec.cage`, written only when non-empty, an array
  from the cloud reads as empty). In the frame a tub stands at the cage's back mesh — the drift tub
  of the old mine in the body: a trough wider at the top, a steel rim with rivets, a rib across the
  end, two wheels with flanges on the cage's own rail; the ore heap rises over the rim with the load,
  tinted by the heaviest ore.
- **Ore shows in the section** (22.10, reworked the same day). An ore body reads from the drift's
  distance as a field of grain: faceted nuggets of the ore's colour scattered over the whole lens,
  denser and larger towards its heart (`23cb dig3OreBodies`, `DIG3_ORE`), sunk into the sheet so only
  a cap shows (grain in the rock, not gravel in front of it), and on the back wall of a working the
  body crosses. Under them the sheet's paint darkens towards the ore's colour (`23ca`). The tone is
  three quarters ore, a quarter the cave's mineral band, so iron is not ice. Grain stops half a metre
  off a working. Only bodies within seven cells of a working (twelve under the shaft's bottom) are
  built. The first try — short seams in the cave's vein language — read as sticks up close and as
  nothing from the drift.
- **Lens** (22.10, `DIG3_LENS`): the working is the hero — the man is about a tenth of the frame's
  height on PC and a fifth on the phone, the drift about a third (PC). The section's lip
  (`DIG3_LIP`) is scaled to that lens: the cave shader burns half a metre off the void, which at the
  mine's lens drew a white rim round every working; the sheet now hands it its distance multiplied,
  leaving the stand's soft glow (~.45 m) and a 6 cm rim.
- **Day column** (22.10): the shader's moss and daylight fall inside the mouth's ellipse in plan;
  with the man more than a few metres down it narrows to the shaft — rock above the frame is not in
  the shadow map, and a wide column put moss on the drift floor through a roof that was not there.
- **Sinking:** at the bottom of the shaft S drills the shaft down and the cage follows the face;
  reaching a level row opens the level.
- **Up and down off a drift only along ore** (an ore cell or one beside an ore body): that is how
  a body is stoped; the workings are walked by ladders.
- **Dressing** (`23cb`): rails and sleepers along levels, timber sets (back post, front post, cap
  across), a lamp every four cells, ladders in the stopes, the headframe and the rope.
- Everything else is the old game (`23-mode-dig`, untouched): cells, ore, hardness, tiers,
  collapses, relics, the suit, the saved workings. The play layer only decides which cell is
  gnawed and where the man stands; `D.col/D.row` follow his feet, so fauna, instruments and the
  beacon read them as before.

## 3. The planet above — one world, two frames

The mine is a cross-section of the same planet where it was dug. Two engine frames per tick:
the cave frame (rock, cage, rope, man, lamps) in mine metres, and the planet frame — the very
`plnSurface` of the surface, with land, grass, beasts, ship, things, sky, hour and weather — in
world metres, offset by `o = (xm − CM/2, land height at the collar)`. `dig3TopComp` merges them
per MSAA sample: the nearer of the two wins.

- **The rock's top is the planet's land** (`23ca` reads `23cd`'s height table `F.tab`): at the
  cut it follows the ground; behind the cut it sits .25 m lower, so the grass is seen from above.
- **The planet is cut** in front of the plane `zc`: land rows and plants there are left out by
  index and per-group instance buffers; the shaft mouth is cut out of the land.
- **Entry and exit** (`DIG3_HAND {s:1.8, cut:[.05,.72], z0:−60}`): the lens slides from the
  surface frame into the mine while the cut runs from the camera to the plane z = 0 — the ground
  opens as a section instead of jumping. Exit plays it backwards from the collar.
- **The headframe** is a planet body in both modes (on the surface with the cage parked at the
  mouth), so the light does not change on the way in.
- Deep down, when no ground is in the window, the planet frame is not computed.
- **Depth deep down** (22.10): the collar's light falls into the shaft from the top edge of the frame
  — the sky by day, the headframe lamp by night — and fades with depth (`dig3ShaftK`, 1/(1+(d/30)³)),
  so depth reads in three steps: the shaft's column above the cage measures lum 48 at 27 m, 37 at
  72 m and 31 at 117 m (the light's own share +20 / +9 / +2.5, by A/B against the light off). Each
  level's gate carries a painted board with its depth from the collar («−72»); the seven has a hook
  (segment f), as on an abacus — with a bare top bar it read as a one on the phone.

## 4. The biters are the planet's beasts

`D.bugs` are spawned by the old `digFauna` from the planet's own species (`genBeast` on `D.p`) and
drawn by the planet's book of bodies (`plnBeastMesh`: six walk frames, stand, graze, hostile,
stunned). Scale .55 of the surface size — a rodent's measure. In a drift a body walks the floor
behind the man's plane; over a void it clings to the back wall; fliers hover under the roof. In
rock the body is not drawn — two glowing eyes ride the cut sheet and blink (dimmer when stunned).
The impulse stays a ring over the frame (`dig3ZapRing`).

## 5. The mouth stands on level ground

The headframe stood where the man stood and the land did not know it: under its legs the drop
reached 5.4 m (measured: the steepest spot near the pad on terran #1). `genPOI` is wrapped
(`23cc mineFlatten`): at landing, the walking line around the mine spot is levelled like a POI's
footing — flat ±6.4 m, back to the profile over 10 m, boulders off the flat, the ship's pad
untouched. The planet land is built from that line, so the apron's drop falls to 0.4 m (the
land's own rake and grain). The first descent into a new shaft does not rebuild the land: the
mouth is level from the next landing on.

A new shaft is laid only where the headframe stands (0.499.1, `mineLayFits`, the lab's law
`91qk`). The author: legs of different length on a step are fine. It does not stand where the long
leg is over twice the short one, where the brace (g0 + 1.1q) runs into the hill, or where the shaft
ring climbs the slope higher than the shaft is deep (.9 m). The mouth goes to the nearest fitting
spot within 90 px of the man (`mineLaySpot`); with none near, the prompt says «ЗДЕСЬ КОПЁР НЕ ВСТАНЕТ
— КРУТО» and points to level ground up to 600 px away.

## 6. Cost (PC 1600×900 / phone 390×844 @1.5, real clock and GPU timestamps)

22.10, 0.499.5 + this work, ms per drawn frame, p50 / p99 over 400 frames after 120 of warm-up:

| where | JS PC | GPU PC | JS phone | GPU phone |
|---|---|---|---|---|
| surface, no mine | 2.3 / 4.5 | 4.83 / 5.06 | 2.5 / 5.0 | 0.93 / 0.99 |
| collar, planet over the cut | 3.0 / 15.1 | 4.36 / 4.51 | 2.2 / 19.1 | 1.24 / 1.42 |
| level 1, gallery | 2.0 / 3.6 | 4.45 / 5.01 | 2.9 / 15.0 | 1.40 / 1.52 |
| level 1, at the face | 3.2 / 33.8 (max 712) | 4.36 / 6.74 | 1.7 / 4.2 | 1.36 / 1.48 |
| 72 m, cage | 1.9 / 4.7 | 0.79 / 0.86 | 1.4 / 3.3 | 0.46 / 0.48 |

Down to the first level the planet frame over the cut is most of the GPU bill; below the window's
reach of the ground the mine costs under a millisecond. Ore bodies (§2) add up to a few hundred nuggets per scene,
inside these numbers. The face row was measured before the chunk budget below; with it, a cell dug at
the face costs JS max 4.9 ms on PC (was 712).

**Entry** (22.10, three runs each, from the surface after the late warm-up, 3 s of frames):

| | worst entry frame, ms | writeBuffer in 3 s | MB written |
|---|---|---|---|
| PC, before | 184 / 217 / 188 | ~4050 | 96 |
| PC, after | 37.5 / 37.5 / 37.5 | ~3730 | 40 |
| phone, before | 150 / 142 / 138 | ~3800 | 71 |
| phone, after | 38 / 42 / 38 | ~3540 | 36 |

What it took: the compositing pipeline (`dig3.top1/4`) is built by the late warm-up
(`GPU_LATE_GROUPS`), so entry compiles nothing; a chunk is built in steps (`dig3ChunkGen`) within the
frame's budget and resumed next frame; the slide from the surface holds its lens at the surface
(where no rock shows) until the rock in the window is built, at most 0.6 s (`DIG3_HAND.wait`); the
land ribbon's indices and the plants' records are written once per shaft mouth, and the cut that
moves during the slide changes only counts and first instances (they were rewritten every frame of
the slide: 22 MB and 40 MB). What is left of the first frame (~38 ms): the field, the planet's frame
and the dressing, once. The remaining 40 MB per 3 s is the planet's man (`plnManFrame`, 21pha),
rewritten every frame everywhere, not the mine's. Tool: `entry.py` (scratchpad).

Steady frames: `minecost.py` (scratchpad) — the scene from `mkmine.py`, the page's own rAF
(`--clock wall`; the stand's stepped clock lies about time), `FRAME_JS` and the GPU `frame`
timestamp counted only on frames the GPU drew (the game skips rAF ticks on a 240 Hz screen).
`cost.py` reads the CPU wrong inside the mine and is not used here.

## 7. Disputed — decided without the author

- Honest planet terrain over the mine: hills are cut as dark slabs, and a valley may leave rows
  0–1 in open air.
- The man jumps to the cage at entry; cage, man and rope are lit by the cave's light.
- The burning lip of the cut sheet (`22dbw` mat 10, lamp-lit) is the planet session's look and
  stays.
- Biters in rock are eyes only; bodies appear in the void. Scale .55.
- A/D at the collar leaves the cage onto the surface.
- The first descent into a new shaft keeps the slope until the next landing (a land rebuild in
  view would pop the whole ground); the lay rule keeps that slope within what the legs take.
- The lab's law `91qk` was reworded by Control: the headframe is judged where the game puts it, and
  refusals may be at most a third of the spots.
- The lab's `91qm-seeds` is back in the gate (22.10). It never was on main (it lived on `lab-local`) and
  came back red on three surface laws; those defects are listed by world in `SEED_KNOWN` and put in
  `PLAN.md` §11 rather than fixed here — the fixes move deposits and POI in the surface's modules.
- The surface labels count px as «м» — older than this work, left alone.
- The cage's load is 24 places whatever the hold: a trip up per cage, not per hold. The cage rides up
  only with the man (there is no sending it alone); the ore of a drift reaches the cage at once (the
  tub on the level's rails is implied, not walked).
- Ore in a cage left down the mine (suit failure, beacon) is kept and unloaded at the next arrival at
  the collar.
- The shaft light is point lights only (two of the twelve, both «core»): the cave shader (`22d*`)
  is not this work's to edit, so there is no visible beam; the steps are measured on the frame (§3).
- Ore bodies borrow the cave's vein material and add the ore's colour, which the cave's veins refuse
  («рыжего нет»): in the mine the ore's kind is the decision, so it must read. The sheet around and
  between workings stays the cave's dark section paper with its strata lines — the planet session's
  look; the mine fills it with ore bodies, not with a new paint.

## 8. Open

(none)
