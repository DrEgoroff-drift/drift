# The rooms the player is in (M850–M851)

Design for Stage F of the remake (`DESIGN-remake.md` §4): HQ, the home (the desk room and the
walkable home), the wintering, the sanatorium — M850 — and «Сорока» with the road — M851.
Written 09.10.2026 from the scout of `27c`, `27f`, `27e`, `29c`–`29i`, `24c`, `27f2`–`27f6`
(`scratchpad/scout/rooms.md`) and the frames `review/rooms/{winter,spa,hq,home}.png`. The
laws are `DESIGN-remake.md` §2 (L1 a place, L2 one astronaut, L3 one generator, L4 one kit
and one light, L5 words on things, L6 one hero), the station hall's bones (`DESIGN-hall.md`
§4–§7: the renderer full-bleed under the screen, the plate, the camera stations) and the
planet's «a window is a room» (`DESIGN-planet.md` §11). What the rooms *play* stays whole.

## 1. What is wrong today

- **Winter** (`29g`): the composition is right — the stove's warmth left, the lamp over the
  table, the cold window right, the panel with the levers — and it stays. What fails: the man
  is a black cut-out nobody lights (`winFigure`), the room is a wall and a floor strip with no
  depth, the window a card, the two prompts in a line at the bottom.
- **Spa** (`29i`): a paper figure at the rail, a paper neighbour in the deck chair, and the
  schedule board hung on the sky over a quarter of the frame (L5). The sea and the awning's
  shadows on the deck are the good part and they stay as ideas.
- **HQ** (`27c`/`27f`): a room inside a form — a 2D bake of four consoles under four identical
  cold lamps, a holo table, parka dolls (`hqFigure`) with a 26 px 2D face, and under it a
  DOM card with a 3D portrait of the same man (`DESIGN-remake` §3: «2D parka dolls beside a
  3D bust»). The screen hides the station whole (L1).
- **Home** (`29d` walkable, `27e` desk): a black roof on half the frame, the hint in the centre
  of it (L5), a paper figure, two lamps, tiers as boxes; the desk room is a second painting
  of the same house.
- **«Сорока»** (`24c-draw`): keep; the keeper has no face and the words float.

Verdict (`DESIGN-remake.md` §3.3): HQ, home, winter, spa — **reinvent on `27f2`**; «Сорока» —
keep, a face for the keeper, the line to his head.

## 2. The idea in one paragraph

Every room is a scene of the **interior renderer** (`r3Frame`), drawn full-bleed under the
HUD the way the station hall is (`DESIGN-hall.md` §7: a canvas under the screen, the HUD and
plates over it), with **one key lamp with shadows**, a hero object, and the room's own palette
round the wheel. The people are the **generator's** (`cpMesh`, the live face of `27f6`), and
the player among them is **one person**: outside he is the rig in the suit (`21pha`), indoors
he is the generator's body with the pilot's own gene in the clothes of the place — the same
face through the visor and bare. Windows are rooms of their own: `outside()` learns the
planet's sky at the hour, the blizzard, the sea with the sun's path, the home's yard with the
mast's beacon. Words hang on things: a prompt is a plate on the bunk, the lamp, the board,
the door. The camera has stations and breathes; it never cuts.

## 3. Composition and the human measure

Eye 1.5 m, lens 40° on the desktop and 55° on the phone (`r3Persp`); the man 1.75 m (the
generator's height) and .18–.22 of the frame's height at his station; on the phone the camera
stands 1.5 m further back and the HUD's pads cover dark floor. The key is always **off centre**
and the hero is under it; the fill is the second light of the place (a stove, a window, a
screen) and it is dimmer by half at least. The palette per room is one hue, one accent, the
rest value (the hall's rule); the accent is the people's orange only where people's things
are. The camera **breathes** (2 cm/s, the hall's idle) and **glides** between stations
(600 ms eased) — to the thing under the cursor, the person spoken to, the bunk at the day's
end. No frame is black between two rooms: a room is entered through its door with the lens
moving (the home from the yard, HQ from the hall's office desk), or through the previous
frame's fade of light (the spa from the shore's day, the wintering from the station's hall).

## 4. The bones shared by all rooms

A new module `29r-rooms-r3.js` (after `29i`): the canvas `#room3d` (the hall's `#stHall` twin,
one for the four modes), the scene cache per room, the camera stations, the breath and the
glide, the hit rectangles of the room's things published in game pixels for `15-input`
(anchors projected through `vp`, as the hall's plate does), the switch `ROOM3.on` true by
default, `?room=0` the old painters until M890. New window kinds in `outside()` (`27f2:206`,
`C3_VIEW`): `planet` (the planet's sky at the hour as a card baked by `21pz`'s sky once per
hour), `snow` (the ridge and the blizzard, driven by the wintering's storm), `sea` (the spa's
`spaSea` ported: waves and the sun's path by the day's slot), `yard` (the home's yard, the
fence, the mast's breathing beacon, the giant at night). **The pilot**: `CP_KIT.pilot` — the
player's gene is one fixed seed (`PILOT_SEED`, set once in `08-state` and saved so a
player keeps his face), his clothes by room (a parka with the hood for winter, a shirt for the
spa, a jacket at home, the suit's underlayer in HQ); the live face reads the room's state
(cold → `sad`, a fault → `angry`, the spa → `glad`). New poses in `cpPose`: `lie` (the bunk),
`recline` (the deck chair), `walk` (shared with the raid's M633b — whichever lands first).

| Room | Where it opens | Place and bones | Key / fill | Hero | Words |
|---|---|---|---|---|---|
| **HQ** (M850a) | from ДЕЛО, and from the hall's office desk (`DESIGN-hall` §5) | the ops room behind the office: four stations along the back wall (consoles, a chair each) in `HQ_ORDER`, the holo table in the middle, the window kind `dock`/`planet` by the station | the holo table's cold glow with a shadow; **one lamp per occupied domain** — an empty domain is dark (the light tells the state), the selected manager's lamp the brightest | the selected manager at his station (`chair`/`table` poses, the live face); the camera glides to him | the manager's card is the **plate** on the right 60 % (desktop) / the lower part (phone), as the hall; «ДОМЕН СВОБОДЕН» a dim sign on a dark screen, not centred caps; the hint on the empty chair |
| **Home** (M850b) | the yard's door (`homeDoorX`) and the station tab «дом и базы» | one strip of rooms by `HOME_TIERS` (corner, hall, garage, case, shop, study, living, dock), 5 m each, the loft over the hall by the stairs; the camera follows along the strip from a 3/4 angle so floor and far wall both read — **no roof in the frame** (the roof is seen only up the stairs); tiers not yet earned are closed doors; the window kind `yard` | the lamp of the tier the man is in, with a shadow; the neighbours' lamps as spill; the window's cold at night, the day's warm by day | the thing under the cursor or the person spoken to (Vega, the mate, the trainee, the crew — the generator, the live face) | the look text a plate on the thing; «НАЗАД — ВЫЙТИ» on the door; the desk tab shows the same scene from the desk's station (baked once per open, the portraits' path) |
| **Winter** (M850c) | `winTake` at a far station | the room as it stands: the panel with four levers left, the stove, the pipes, the table with the diary, the bunk right under the window; 6 × 3 m, straight on with a little depth; the window kind `snow` | **the lamp is СВЕТ**: its power sets the key (shadowed); **the stove is ТЕПЛО**: a warm fill with a flicker as movement; the window is the blizzard's cold; the reactor's red bar the fourth, small | the pilot in the parka at the panel, the live face by cold and faults; at the day's end he lies on the bunk (`lie`) and the camera glides there as the light fades | the tally on the wall as a decal; the diary a book on the table; «СДАТЬ СМЕНУ» a plate on the bunk, the fault's «ТРОНЬТЕ» on the lamp it names |
| **Spa** (M850d) | `instRest` on an ocean world | the veranda: deck, rail, the awning, the chess table, the deck chair, a glass; the sea as the window kind `sea` filling the back; the board on a post at the rail's end | **the sun** is the key with shadows — the awning's stripes lie on the deck and move with the day's slot (morning long, noon short, evening long and warm); the sea's glare the fill | the pilot at the rail (`lean`) and the neighbour reclining (`recline`), the generator, the live face `glad` | the schedule on its post, crossed lines as decals; «СПАТЬ» a plate on the deck chair |
| **«Сорока»** (M851) | `wanderDock` | keep the corridor of cases and the slit window; the keeper gets the generator's body and a live face (a fixed gene, the kit `keep`), standing behind the cases | keep the room's light; the keeper's face takes a small key | the case under the cursor; the keeper when he speaks | the card's leader goes to **his head**; the road screen's (`27k`) ship becomes the 3D hull (`hullStudio`) and its sky soft |

The old painters (`drawHqRoom`, `hqFigure`, `drawHomeRoom`, `drawHomeIn`, `hinFigure`,
`drawWinter`, `winFigure`, `drawSpa`, `spaFolk`, `wanKeeper`) go behind `ROOM3.on`; none is
edited. `mgrFace(` loses its last caller (M802's gate closes).

## 5. What stays, what goes

- **Stays:** every mode's logic (`enterHomeIn`, `winShift`, `spaSleep`, `wanStep`, the tiers,
  the levers, the faults, the diary, the folk's lines), the saves, the HUD, `winGeom`'s hit
  shapes as the source of the hit rectangles, the DOM of HQ's card and «Сорока»'s panel.
- **Goes behind the switch:** the 2D rooms and figures above; `roomBake`/`roomSz` for these
  four modes.
- **Changes:** `outside()` gains four kinds; `cpPose` gains `lie`, `recline`, `walk`; `CP_KIT`
  gains `pilot`; `15-input` reads the room's published rectangles where it read `winGeom`
  and `HOME_HIT` (at the seam, the tables kept as the fallback).

## 6. Milestones

- **M850a HQ** — the ops room on `r3Frame` under the plate, the four stations, the lamps by
  domain, the managers by the generator with the live face, the glide to the selected. Gate:
  the room with 0, 2 and 4 managers at 1920 and 390; `errs 0`; vision clean.
- **M850b Home** — the strip, the loft, the window `yard`, the folk, the pilot, the desk tab
  from the same scene, the way in from the yard without a cut. Gate: tiers 1, 4 and 8 at
  1920 and 390; the night pair through the window.
- **M850c Winter** — the room with its three lights as instruments, the pilot in the parka,
  `lie`, the sleep glide. Gate: day 17 at full and low power (the balance seen, not read).
- **M850d Spa** — the veranda, the sun by slot, `recline`, the board on its post. Gate: the
  three slots of one day.
- **M851 «Сорока» and the road** — the keeper's face and body, the leader to his head, the
  road's hull and sky. Gate: the room and the road at 1920 and 390.

## 7. Tests

A Node suite `91qj-rooms`: every room has a scene builder and one shadowed key; shadowed
lights ≤ 6 and lights ≤ 12 per frame; the four window kinds exist; under `ROOM3.on` no 2D
figure painter runs (the old names are not called); each room publishes a hit rectangle for
every thing its tap table names; the winter's key power follows `G.win.pw.light`; the spa's
sun angle follows the day's slot; the pilot's gene is stable across a save round trip;
`?room=0` leaves every old path whole. A browser suite: open each room, tap its things, close
— `errs 0`, no bind group meets a foreign pipeline.
