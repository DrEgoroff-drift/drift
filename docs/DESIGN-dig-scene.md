# The dig as lit rooms (M631)

Design for the fourth step of Stage E of the remake (`DESIGN-remake.md` §4: base and home →
cave → **dig** → raid). Written 09.10.2026 from the scout of `23-mode-dig`, `23a`, `23aa`,
`23ac`, `23b`, `21pi`, `21pic`, `21pha` (`scratchpad/scout/dig.md`). The laws are
`DESIGN-remake.md` §2 and `DESIGN-planet.md` §3 and §11.8 (underground); the planet's law 8
«the mine: a vertical pan» (`DESIGN-planet.md:66`) names the way in. The dig is built **on the
cave's section kit** (`DESIGN-cave-scene.md` §4: `22da` density and surface nets, `22db` the
two shadow maps and the cone) — one kit, one light (L4); it follows M630a. What the dig
*plays* stays whole: the lazy cells, the tiers and the drill techs, the bite, the ore bodies,
the collapse, the rodents, the relic roll, the beacon, the ladder, the saves.

## 1. What is wrong today

`review/ground/dig_shaft.png`, `dig_deep.png`: the man stands in a flat olive field with a
wedge of light and nobody can say where the void is and where the rock — the dug cells are
black rectangles with a soft edge, the rock is a tone cloud with hatching. The sky strip at
the top is a 2D strip that ends at x ≈ 1000 (`DESIGN-remake` §3: «fix the strip first»; §4:
it is *not* patched, the dig gets the planet's sky whole). Ore is specks; the shaft props are
lines; the support lamps are dots; the man is the old painter (`drawAstronaut`, `23a:539` — the
one mode M801 left open); the headframe of the planet (`plnThingMineMesh`, a body with a
sheave and a lamp) is never seen from inside. Verdict: **reinvent** (kind 3, §2.1).

## 2. The idea in one paragraph

The dig is a **vertical section**: the planet's rock cut by the plane of the shaft, strata of
`geologyOf` read on the cut face as a page, and the dug cells are **rooms** in it — rounded
voids with a floor the man stands on, each lit by **one source through the air**: the man's
lamp where he is, a landing lamp where play puts one (every eighth row), the day where the
mouth still reaches. Ore is not specks: an ore body (`oreNode`: a centre and a radius) is
**one large form** on the page, dim orange, three or four of them in a frame at most, and the
cells near it carry its colour on their walls. At the top the planet's own frame continues —
its sky at this hour, the land cut at the mouth, the headframe over the shaft with its lamp —
and the way in is a **pan down**: the surface lens drops into the shaft without a cut.

## 3. Composition and the human measure

The dig's metre is the man: 23.6 units = 1.8 m, so a cell (`DIG_CELL` = 30) is 2.3 m and the
fifteen columns are 34 m — the broad lens (36 × 20 m at the cut, §11.8) holds the shaft's
whole width with a metre of rock on each side, and the frame pans only vertically on the
desktop. The tall lens (10.8 × 23 m) holds 4.7 columns and 10 rows and pans both ways. The man
is 8.5 % of the height (broad) and 7.7 % (tall); the walk line sits at .34 / .29 from the
bottom. The lens follows the man eased (the cave's follow); when he digs down, the lens leads
him by half a cell so the bite is seen. There is no far lens: a shaft is read by depth, which
the HUD says in metres.

Rooms: a dug cell is a void 2.3 × 2.3 m and 2.8 m deep, corners rounded by the cell's `prog`
history (`digVoidPath`'s inflation stays as the rule), the floor flat, the walls scarred by the
bite (a few chipped facets of the rock kit, not a texture). Where play makes a chamber (every
eleventh row) the depth doubles and the ceiling is a vault.

## 4. Bones and dressings

New modules after `23b`: `23c-dig-pln.js` (the scene, the lens, the pan, the switch
`DIG3.on`/`?dig=0`), `23ca-dig-pln-rock.js` (the density from `D.cells` and the strata page),
`23cb-dig-pln-dress.js` (ore forms, props, the ladder, the drill's bite, rodents) — each ≤ 40 KB.
The section's engine is the cave's: `22da` surface nets over a density, `22db` the maps and
the cone; the dig supplies its density and its lights.

| Layer | Built from | Rule |
|---|---|---|
| the sky and the mouth | the planet's frame (`21pz`) for the top of the section: the sky at the hour, the land cut at the shaft, `plnThingMineMesh` from inside (shaft wall, rim, spoil, headframe, its lamp) | no second sky; the strip is the planet, edge to edge |
| the rock | density = 1 − dug (rounded, inflated), depth profile 2.8 m, strata displacement by `geologyOf(p)` at `DIG_GEO_K`, the world's grain by `CUN` kind | the layer is the shape; three steps darker with depth |
| the cut face | the page: strata lines, joints and dikes where `digRockMass` puts them, the abandoned chambers of older diggers as voids in the plane, roots and soil under the turf at the top | a void that matters lies in the plane of the cut |
| ore | each `oreNode` in frame as one body on the page — a lens of dim orange (.1–.4 of its colour) with a few bright flecks at its heart; at most four in a frame; cells with `nearNode` take a wash of it on their walls; the relic rows (≥ 14) a colder vein | ore is orange and dim; it never calls louder than the lamp |
| light | the man's lamp as the key (shadow map, cone in the air, its own pool, reach by `kitStat().lamp`); landing lamps as small warm lights without shadows; the day from the mouth by the second map, gone by the eighth row; the cutter's flash and sparks (`plnDrillFrame`) as a brief third | one source through the air at a time: the cone is the lamp's, the day has none below row two |
| the drill | `21pic`: the tool on the forearm, the beam from the tip to the bite, the flash, 16 chips in the ore's colour, the warm lamp; the rig's `drill` pose; the bite as the cell's facets chipping with `prog` | the hero is the bite: the brightest, sharpest spot |
| props | rails and the cart, tools, the vent pipe, the landing with its lamp, the ladder as rungs on the wall — bodies of the people's grammar (grey steel, rust, one orange belt on the cart) | a body has a detail the eye can name |
| life | rodents by the planet's beast kit `21pib` (small, dark, eyes as two dim lights), stunned ones lying | small lives are lights |
| words | «ПРОХОДКА %» as a plate on the bite; «ЖИЛА» on the ore body; the tier wall «ПОРОДА НЕ ПОДДАЁТСЯ» on the rock face below; the HUD lines stay DOM | nothing in the centre |

The man: the rig in 3D (`21pha`) with poses stand/walk/drill/air as play gives them; the
helmet lamp is the key; `drawAstronaut` is superseded under `DIG3.on` (M801 closes for the
dig here).

## 5. The way in and out

On the surface the mouth is `plnThingMineMesh` with the near lens within `MINE_MOUTH_R`.
«ЗАЛОЖИТЬ ШАХТУ» first plants the headframe where the man stands (the same body, the spoil
heap small), then the pan. On descent the lens **pans down** from the surface frame into the
shaft: the land is cut at the shaft's plane, the first dig frame is the surface frame one step
lower with the cut, the sky still in the top of the frame; the pan continues until the man's
row is on the walk line. Leaving (W at row 0, the beacon, the suit failure) pans up; the beacon
and the failure may be fast (300 ms) but never a cut. `enterDig`/`exitDig` keep their logic;
`28-loop` dispatches to the new draw under the switch.

## 6. What stays, what goes

- **Stays:** `digCell`, `oreNode`, `DEPTH_TIERS`, `updateDig` whole, `digFauna`, `mineLoad`/
  `mineSave`, the HUD, `T.bot("dig")`.
- **Goes behind the switch:** `drawDigWorld`'s layers (tiles, `digRockBelow`, `digShade`,
  `digMid`/`digMidGpu`, the 2D sky and stars, `digSurfFringe`, `drawDigLight`, `digEmit`,
  `helmBeamGpu`, `drawAstronaut`). `23-mode-dig.js` is read-only; `23a`–`23b` are wrapped at
  their draw seams and never edited.

## 7. Milestones

- **M631a The section and the pan** — `23c`, `23ca`: the density from the cells, the rooms,
  the strata page, the planet's sky and the headframe from inside, the two lenses with the
  follow, the pan in and out, the rig with the lamp as key, the day by the second map.
  Gate: the shaft at rows 2, 14 and 40 at 1920 and 390 on two worlds; the void agrees with
  `cell.dug`; share ≥ .08 / .07; `errs 0`; vision clean.
- **M631b Ore, the bite and the things** — `23cb`: ore bodies as forms, the drill's bite with
  `21pic`, props and the ladder as bodies, rodents, plates. Gate: a contact sheet of the
  bite at three tiers, an ore body in frame, a landing with its lamp.
- **M631c Cost and the phone** — the dig ≤ the surface frame at the same window
  (`docs/look/game/cost.py`); the tall lens with both pans; the S23 gate is the designer's.

## 8. Tests

A Node suite `91qh-dig`: at 400 sampled points the density's sign equals `!cell.dug`; the
first dig frame's lens equals the surface lens at the mouth and the sky layer is the planet's
(no 2D strip drawn under `DIG3.on`); the man's share ≥ .08 broad and ≥ .07 tall; at most four
ore bodies in a frame; the day's light is zero below row eight; only the lamp and the day own
shadow maps; `?dig=0` leaves the old path whole. The detectors judge the dig after every
gesture as today.
