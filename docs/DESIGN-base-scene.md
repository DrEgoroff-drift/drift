# The base and the home as a place (M628, M632)

Design for Stage E of the remake (`DESIGN-remake.md` §4), the first two of its four steps
(base and home → cave → dig → raid). Written 09.10.2026 from the scout of `21a*`, `21c`,
`21f`, `21g`, `21h`, `21pie`, `21pz` (`scratchpad/scout/own_base.md`). The laws are those of
`DESIGN-remake.md` §2 and `DESIGN-planet.md` §3 and §11; the base's *game* — gauges, people,
charter, director, аврал, the board — is `DESIGN-base.md` and is not touched here. The three
frame rules of `DESIGN-base.md` §51.3 hold for every frame below: state goes on an
instrument, an answer goes in the prompt; a thing in the world is lit by the world; a body
needs a detail the eye can name.

## 1. What is wrong today

**On the planet** the base is a sticker: `drawBuilt` (`21c`) paints a 104×150 cube, a mast
and three panels at `builtSpot`, and the engine's frame lays that painter over itself through
`plnOverOld` (`21pj`). The home is a second sticker (`drawHomeOut`, `21f`), with the
greenhouse bed painted inside it; there is no fence; the pennant exists only in the
cross-section; the battery is a module with no body outside. The player enters the base by
walking up to the **ship** (`21-mode-surface:603`), not to the base, so the facade is scenery
with a door that is not where the door is drawn. Lamps light nothing; by night the home is a
sign on the ground line.

**In the cross-section** (`21ac`, `21ad`) the dollhouse reads, and that is kept. What fails
the laws: twelve rooms of one grey box in brown paper (`review/ground/base_a.png`), light from
nowhere in every room at once, the man a 26 px card (frame share .022 at 1080 — `DESIGN-remake`
M801 lists it as a debt), the hint lines in the centre of the frame, the surface a thin strip
with its own sky that is not the planet's. The M602 key frame of the planet
(`DESIGN-planet-frames.md`) already answered the outside — *modules on a deck over the
shallows, a pier with a lamp, a dome, a mast with a steady red light; the home a body with a
wheelhouse band of glass and a porch under the lantern* — and the game never got it.

Verdict (`DESIGN-remake.md` §3): the base above ground and the home — **replace whole**
(kind 1, the planet's own M628); the cross-section — **reinvent dressing and ground, keep the
grid, power, lift, crew** (M632).

## 2. The idea in one paragraph

Own things are **bodies of the people's grammar** planted on the engine's land like the
landmarks of `21pie`: smooth seamed hulls, grey steel, rust and soot, the orange belt, the
only warm lights. The base stands on a deck over the flattest water or ground of the profile;
the home stands in its yard behind a low fence with the greenhouse beside it; the travelling
pennant flies on the home's mast when it is here; the battery is a bank on the deck whose one
lamp says the charge. The player enters the base through its **gate** — the lens glides into
it and the land turns into a **section**: the same rock kit cut by a plane, rooms as lit rooms
each under its own lamp, the lift a shaft of light, the man the rig in 3D at human measure.
The first frame of the section is the last frame of the walk; nothing cuts.

## 3. Composition and the human measure

All sizes in metres of the engine (`PLN_M`; the man 1.8 m). The walk lens of `21pz` is the
day frame; the engine's `near` lens is the close frame.

**The base (outside).** A deck 1.2 m over the shallows (or over the ground where the planet
has no water near the spot), 40 m long; on it 3–5 modules 9 × 3.4 m with rounded ends and one
orange belt each, a dome 6 m across at the land end, a pier 10 m out over the water with
**one lamp** on a post at its end (2.6 m), and a lattice mast 12 m with a **steady red light**
at the top — never a blink; it is the base's sign against the dark hill. The gate: a lit
door 2.2 m high in the module nearest the land, a step down to the ground, the prompt plate
hung on it (L5). Modules are as many as the base's top row has cells built (`B.cells`, the
surface row): an empty cell is an empty span of deck with a rail, so the base outside tells
what is built inside.

**The home (outside).** On its own spot (`homeSpotX`, ≥ 760 units from the pad as now), a
body 7 × 4 m with a wheelhouse band of glass at 2.2 m, a porch 2 m deep under the lantern
(2.6 m, the **key of the yard by night**, with a shadow), a vaulted garage 5 × 3 m beside it,
and a banded lattice mast 9 m whose beacon **breathes** (an emissive, not a lamp). The yard:
flat ground 18 m wide, trodden (the flora pad `plnMarkPad` cleared), a path from the walk
line to the porch. The fence: posts 1.1 m every 2.5 m with two wires, round the yard, open on
the path. **The yard ends before the man** (`DESIGN-planet` §11): the fence crosses him at
the waist in both lenses, never at the head.

**The greenhouse.** A glass vault 6 × 3 m on the yard's far side, ribs of grey steel, the
bed of `21g` inside it as green bodies seen through the glass, a cold-white grow lamp inside
that is an emissive by day and the yard's second light by night (no shadow).

**The battery.** Four cells 1 × 1.2 m in a row at the deck's land end with a cable to the
dome; one small green lamp whose brightness is the charge (`battTick`), an emissive.

**The pennant.** When the travelling pennant of `21h` is at this base it is a cloth card
(`plnCard`) under the home's beacon, moved by the weather's wind (`21pk`), lit by the world
— never full saturation (§51.3). Its plate names whose it is.

**The section (inside).** The grid is the grid (`BASE_COLS × baseRows(B)`, the lift shaft at
column −1, the tunnel from the gate); only its scale changes: a cell is **9 × 4 m** (3.2 m of
room under 0.8 m of slab), the lift 3 m wide, the tunnel 3 m high. Two lenses:

| Lens | When | What is in frame at 1920×1080 | The man |
|---|---|---|---|
| **far** | the build menu, the lift, the first second after entry | the whole base: 5 cols + lift + gate ≈ 55 m wide, every row | 63 px — share .058 |
| **near** | walking, repair, talk | 2.3 cells wide, 3 rows tall, the man's room centred | 162 px — share .15 |

The phone (≤ 760 px) has only the near lens, panned with the man; the build menu there pans
by column. The glide between lenses is the engine's (`plnGlide` eased, 600 ms), never a cut.
At the far lens the rooms read as the dollhouse they are; at the near lens one room is a
scene with a floor the man stands on, a back wall, props as bodies and one lamp.

## 4. Bones and dressings

**The outside** is a new module `21pif-pln-own.js` (byte order after `21pie*`, before `21pj`)
built from the pieces of `21pie` — `plnBlob`, `plnTube`, `plnLoft`, `plnCard` and the helpers
`box/rod/post/skirt/lamp/seam/pane` — in the people's branch of the grammar (steel + rust +
orange + warm lamps). Placement copies `plnMarks`: z on the mark line, y from
`plnLandRibAt`, the pad cleared, the mesh through `plnGeo/plnRec/plnInst`, the per-frame
call beside `plnMarksFrame`. The base spot keeps `builtSpot`'s seed and «flattest» rule,
re-measured in metres on the engine's land; where the profile has water within 30 m of the
spot the deck goes over the water, else over the ground. Lights per frame (the engine allows
four): the porch lantern (the yard's key, shadowed), the pier lamp, the man's helmet lamp,
one spare for the nearest landmark; everything else — windows, beacon, red light, the grow
lamp by day, the battery lamp — is emissive. The planet's weather, hour and fog pass over the
bodies like over the landmarks; the mast's red light is seen against the dark hill, the
lantern against a dark wall (§11).

**The section** is a new module `21ae-base-sect.js` (after `21ad`) that owns `drawBase`'s frame
when `SECT.on` and draws with the engine's passes, not the 2D brushes:

| Layer | Built from | Rule |
|---|---|---|
| sky strip and the far land | the planet's own frame (`21pz`), the hour's five acts | the top 18 % of the far lens is the planet at this hour; no second sky |
| the rock in section | the ground kit `21pg*` cut by the section plane: facets as strata, the world's dress on the cut face | darker with depth (three steps), the cut edge lit from the rooms, grain by the world's rock |
| the rooms | one cut of darkness for all built cells (as `21ac` does), a slab edge with light above and shadow below | an empty cell is rock, never a frame |
| room kits | nine `BASE_ROOM` brushes become nine kits of bodies (reactor core and coils, solar frames, the drill of `21pic` and its bite, shelves and crates, bunks, the furnace, the pad's lamps, the battery bank, the bench) | pieces of one family, a base, an accent, one light; a body has a detail the eye can name (§51.3) |
| light | one lamp per room (its key, warm or cold by kind), the reactor's glow, the lift's lamps every level, daylight through the gate and the top row's windows | one source through air only; a room with no power is lit only by the neighbour's spill (`lit=.55+.45*eff` becomes the lamp's power) |
| people | the rig (`21pha`) in 3D for the player; the crew by the generator (`27f3`) in the base's kit, LOD 1 at the far lens | 1.8 m everywhere; the rig *can* sit here (a `sit` pose is added to the book — the first time the rig sits) |
| the lift | a cage with a floor and one lamp, rails with a highlight, a cable, numbered levels | the shaft is a body, not a grey square |
| the board, gauges, prompt | the DOM panel as it is (state on an instrument); the prompt two lines on a plate hung on the room under the cursor (L5) | nothing in the centre of the frame |
| pipes, frost, the emergency marker, the pennant | kept as they are drawn, re-lit by the room's lamp | decoration takes less light and scale than machinery |

The bakes of `21ad` are not used under `SECT.on`; the engine's own cache of static meshes
(as the landmarks) carries the rooms, rebuilt when `B.cells` or power changes.

## 5. The way in

Entry is **by the gate**: `shipZoneR()` against the ship stays for `jumpToBase` from the
ship; on foot the condition becomes distance to the gate (a new predicate the surface mode's
seam calls — `21-mode-surface` is read-only, so the wrapper is in `21pif` and the seam reads it
through the existing `enterBase` hook). The glide: the lens eases to the gate (`plnAtThing`
gets `base` and `home` as things), the door's light grows, and on the frame the lens reaches
the door the section opens **with the same lens** — the section's first frame is the walk's
last frame with the land cut, then the near lens eases to the man's room. Leaving is the
reverse. The home's door works the same way for `homein` later (Stage F); for now the home
is a body with a prompt on the porch.

## 6. What stays, what goes

- **Stays:** everything of the base's game (`21a`, `21a1`–`21a9`, the board, the build menu,
  verbs, saves `G.bases`); `builtSpot`'s seed; `homeSpotX`; the greenhouse's and the
  pennant's state; the battery's tick.
- **Goes behind a switch:** `drawBuilt`/`drawBaseBuilding`, `drawHomeOut`'s facade and bed,
  the surface pennant — `OWN.on` true by default, `?own=0` the old stickers until M890. The
  2D section (`21aa`, `21ab*`, `21ab1`, `21ac`, `21ad`) — `SECT.on` true by default, `?sect=0`.
  Neither old painter is edited.
- **Changes:** `plnAtThing` learns `base`/`home`; the rig's pose book gets `sit`; the entry
  predicate; `RIG_CARD.on`'s base taker (M801) is superseded by the 3D rig under `SECT.on`.

## 7. Milestones

- **M628a The own things outside** — base body on the deck, the home and its yard, fence,
  greenhouse, battery, pennant; `OWN.on`; entry by the gate with the glide. Gate: the base and
  the home by day at 1920 and 390 on a desert and an ocean world; `errs 0`; vision clean.
- **M628b The night** — the lantern's shadow, the windows, the red light, the breathing beacon,
  the grow lamp, the man coming home with the light on his chest: the M602 frame in the game at
  1920 and 390. Gate: the night pair; the lamp count ≤ 4 with the man's.
- **M632a The section** — `21ae`: the rock cut, the rooms' darkness and slab, the two lenses
  and the glide, the way in without a cut, the rig in 3D with `sit`, the lift as a body,
  the prompt on its plate. Gate: far and near at 1920, near at 390; the first section frame
  equals the last walk frame; share ≥ .05 far and ≥ .12 near.
- **M632b The rooms** — nine kits as bodies with one lamp each, the crew by the generator,
  pipes and frost re-lit. Gate: a contact sheet of the nine rooms at the near lens.
- **M632c Cost and the phone** — the section ≤ the surface frame at the same window
  (`docs/look/game/cost.py`), the phone's near lens and column pan; the P1 gate on the S23 is
  the designer's.

## 8. Tests

A Node suite `91qe-own`: every own thing has a body kind and a spot on land (finite
`plnLandRibAt`); the base outside has as many modules as the top row has built cells; the
lamp count per frame ≤ 4; the entry predicate is the gate, not the ship, on foot and the ship
for `jumpToBase`; `?own=0` leaves the old path. A Node suite `91qf-sect`: the section's first
lens equals the last walk lens; the far lens holds every row and the lift; the near lens
centres the man's room; the man's share ≥ .05 far and ≥ .12 near at 1920×1080 and ≥ .05 at
390×844; the rig has `sit`; `?sect=0` leaves the old path; a base with no power lights
rooms only by spill. The scene detectors (`90b/90c`) judge both frames after every gesture
as they do today.

## 9. The rest of M632: the build menu on the layer, the 2D brushes go (22.10)

M632a–c are in (`21ae`, `21aea`, the per-frame overlay on `#ovl`); 0.499.15 took the 2D frame out
of `21ae`'s switch and planet's `2b449867` (0.499.16) removed the old `drawBase` body and
everything reachable only from it in `21ac`. What is left is one live 2D painter — the build menu
— and a set of brushes nothing reaches any more. This step moves the one and removes the set.
The §6 switch `?sect=0` is gone with them: the section is the base's only frame.

**What goes, by name** (reachability over `src/` with comments stripped, on planet-main
22.10; everything listed is reached only from inside this list):

| Where | KB | Names |
|---|---|---|
| `21aa-base-rooms` (whole file) | 21.4 | `BM_WARM`, `BASE_PASS`, `bS`, `bL`, `bBox`, `ROOM_FIN`, `FIN_DEF`, `bPipe`, `bScreen`, `bCrate`, `bLamp`, `bHazard`, `bGlow`, `bWorker`; `drawBuildMenu` moves to the layer |
| `21ab-base-interiors` (whole file) | 38.7 | `BASE_ROOM` and its rooms |
| `21ab-base-interiors2` (whole file) | 24.6 | `Object.assign(BASE_ROOM,{…})` — the second half of the rooms |
| `21ac-base-draw` (whole file) | 2.8 | comments only after `2b449867` |
| `21ad-base-gpu` (whole file) | 14.3 | `BASE_BK`, `BASE_LAMP_KEYS`, `BASE_WGSL_HEAD`, `baseWgslHead`, `baseLightWgsl`, `baseAirWgsl`; `baseBakeFree` stays as a name (below) |
| `21ac1-base-banya` | ≈ 8 | `BASE_ROOM.banya` (the steam room brush) |
| `21ac2-base-farm` | ≈ 4 | `BASE_ROOM.farm` |
| `21ac3-base-van` | 4.0 | `drawVan`, `drawVanSmall` |
| `21ac4-base-fridge` | ≈ 2 | `BASE_ROOM.fridge`, `BASE_ROOM.fridgesub` |

123 KiB (126 339 bytes) in all, counted at the commit: the five files 101 KiB, the brushes inside `21ac1`–`21ac4` 21.5 KiB.

**What stays, byte for byte:** the logic of `21ac1`–`21ac4` in its files under its names —
`banyaLive`, `banyaWarm`, `banyaSpirit`, `banyaStep`, `banyaRested`, `gribOn`, `gribStart`,
`gribMul`, `gribEat`, `gribAvral`, `gribCut`, the `BANYA_*`/`GRIB_*` constants; `farmCell`,
`farmWanted`, `beastTake`, `farmOf`, `farmBeast`, `farmName`, `farmGood`, `farmTalk`, `farmEnter`,
`farmStep`, `FARM_*`; `vanHasPad`, `vanOf`, `vanName`, `vanQuirk`, `vanLine`, `vanRename`,
`vanStart`, `vanStep`, `VAN_*`; `fridgeFirmAt`, `fridgeFee`, `fridgeLocked`, `fridgeStep`,
`subFightOffer`, `FRIDGE_*`; the `BLOG` entries. Proof: the remaining declarations diff empty
against main, and `91zzzzzbb-samehash` and the save fuzz stay green.

**The build menu on the layer** (`sectOvMenu` in `21ae`, beside `sectOvBoard`). Today it is a
420 px strip of all 20 kinds — 21 px a cell, names cut to nine letters in 8 px type: it cannot be
read at 1920 and at 390 it is 17 px a cell. It is also the only thing that puts the 2D canvas back
while it is open, and with it the full-frame copy (front2: 1.2 ms on the PC, 3.4 on the phone).
The new strip:

- a row of cells centred on the picked one, sliding as `S.pick` moves (eased 150 ms, never a
  jump); arrows at the ends while cells are hidden on that side;
- a cell is 84 × 60 CSS px on the PC (9 shown, 776 px) and 56 × 56 on the phone (3 shown at 390 —
  the strip steps round the right rail) — every cell and both arrows are tap targets ≥ 44 px; in the
  `uiK` measure. One name size for the whole strip (11 down to 9 px); a word that does not fit is
  hyphenated near its middle at a vowel, and when some kind needs three lines (the fridge on the
  phone) every cell grows by a line, so the strip keeps one height;
- in a cell: the kind's name (no cutting), the price from `baseCost` (this
  base's estimate) — «1800 кр · 6 спл»; a kind that cannot be built here is dimmed with its
  reason in one short word under the price (наука / фирма / сверху), read from the same fields
  `21a` reads (`needTech`, `firm`, `surfaceOnly`);
- the picked cell in the amber frame of the board, the others on the board's dark plate;
- the strip's bottom sits 12 px over the top of the bottom controls (`PADS_RECT`,
  `CONSOLE_RECT` — the layout the canvas publishes), never over the man: where it would lie on
  him (the phone on its side, 568 × 320) it moves under the HUD in place of the board, and
  `#msg`, which sits there, keeps quiet (`body.basehush`) — the same line stays in the ЭФИР strip;
- a tap on a cell picks it (`S.pick=i` — the same field the arrows set); building stays on the
  ДЕЙСТВИЕ button, which already says the verb. The tap is taken in `21ae` on the layer's own
  pointer listener only while `G.mode==="base"&&S.menu` and only inside a cell; `15-input` is not
  touched. The long text — what the kind does, the lock — stays on the room's plate (`G.prompt`
  of `21a`, as now).

**No WebGPU.** The base has no frame without the GPU: the plate of `08b2` (`gpuNone`) closes the
screen, as for the rooms and the home — one mechanism for the game.

**Seams.** `21a-mode-base` is read-only and calls `baseBakeFree()` on leaving, so `21ae` keeps the
name as an empty function — the section makes no bakes. `drawBase` is already `21ae`'s own
declaration (`2b449867`).

**Control's part.** `08b0`: drop `fld.baselight` and `fld.baseair` from the late warm-up (the
table at line 39 and the pipe keys at line 97) — their WGSL leaves with `21ad`; both must go in
the same release as this commit, or the warm-up throws on a missing function. `28-loop`: nothing —
it calls `drawBase` by name. `21phc`: `rigCardWorker` has no caller once `bWorker` is gone; it is
planet's to remove or keep.

**Tests.** `91qf-sect` loses the `?sect=0` path and gains: with the menu open the 2D canvas stays
empty and the layer holds one cell per shown kind; the picked cell is whole inside 390 px; every
cell ≥ 44 × 44 CSS px; a tap on a cell sets `S.pick`. `90c-detect-laws` changes in a comment only.

**Gate.** The section at both lenses, PC 1920 and phone 390, day and night, before and after the
removal — pixel diff ≈ 0; the menu frame new at both sizes; `test.ps1`, `-Full`,
`node test-node.js --full` and `-Browser` green; the section's frame by `cost.py` with the menu
open no dearer than closed.
