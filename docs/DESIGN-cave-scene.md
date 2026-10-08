# The cave as a place (M630)

Design for the third step of Stage E of the remake (`DESIGN-remake.md` §4: base and home →
**cave** → dig → raid). Written 09.10.2026 from the scout of `22-mode-cave`, `22a`–`22c`,
`20d`, `11ah`, `21pi`, `21pz`, `21pha`, the stand `docs/look/cave.html` (`cv-*.js`)
(`scratchpad/scout/cave.md`). The laws are `DESIGN-remake.md` §2, `DESIGN-planet.md` §3 and
§11.8 (underground: light, form, staging, life, the two lenses) and the mouth law of §11; the
M601 key frame (`DESIGN-planet-frames.md`) is the target, with the far lens it deferred to
M630. Nothing here changes what the cave *plays*: the grid, the galleries and shafts, the
pockets by jetpack, the find, the beasts, the amber, the wall of receipts all stay.

## 1. What is wrong today

The cave is a map: a field of 5 px cells (`CAVE_W`=2200 × 1500, `caveBuild`) baked into
512 px rock tiles with a brush grain, a thin lit band in a flat dark field, the lamp a flat
wedge (`CAVE_CONE_WGSL`), the far wall a parallax tile store. There is no depth and no
vault; the man is a 26 px card (share .042 at 1080 — `DESIGN-remake` M801 lists it). The
mouth on the planet is already a body (`plnThingCaveMesh`: the knoll with the arch and the
dark void sheet), but pressing ACTION at it is a **cut**: the mode flips and a different
picture appears. The stand's M601 frame — a lamp with real shadows and a cone in the air, a
vault over the man, the cut face as a page of the earth, an arch to a far chamber with its
own day, a lake that mirrors the crystals — exists in `docs/look/cave.html` with its own rock
density, meshing and shaders, and the game never got it.

Verdict (`DESIGN-remake.md` §3): **reinvent** on the planet's M630 — kind 1 of §2.1: the stand
built it, the game takes it whole; the 2D painter (`drawCaveRock`, `drawCaveFar`, the tiles,
`22c`'s light passes) is switched off, never patched.

## 2. The idea in one paragraph

The cave is the stand's scene fed by the game's grid. The rock is **one density function
built from `C.g`** — the play grid smoothed as `caveSmoothPath` does, extruded in depth so every
gallery, shaft and pocket is a tube whose depth follows its height, strata as displacement —
meshed by surface nets per chunk inside the lens, the front layer closed to make the **cut
face**. Play and picture cannot disagree because they are the same field: where
`caveSolidAt` says rock, the mesh is rock. The man is the rig in 3D with his lamp as the
**key light with shadows and a cone in the air**; the day falls down the mouth by a second
shadow map; the crystals are the mauve accent; everything else is a small light without
shadows. The broad lens looks along the gallery, the tall lens up the shafts, the far lens
shows 72 × 40 m of the section when the map is asked for. The way in is a push: at the
mouth the surface lens glides into the arch, and the first cave frame is that same lens one
step further, the sky still seen behind through the mouth.

## 3. Composition and the human measure

The cave's metre is the body box: 21 px = 1.8 m (`cavePpm` = 11.67 px/m; `CAVE_CS` = .43 m).
The galleries are 3–5.5 m high as play makes them; the cut face is the plane z = 0; the void's
depth is 1.2 × the local height (a gallery 4 m high is a tube 4.8 m deep), halls up to 2 ×.

| | broad (≥ 900 px, 16:9) | tall (phone) | far |
|---|---|---|---|
| eye from the walk line | 36 m, 3.2 m up | 18 m, 3.2 m up | 100 m |
| lens | 24° | 46° | 24° |
| frame at the cut | 26 × 14.5 m | 6.6 × 14.5 m | 72 × 40 m |
| the man | 12 % of the height | 12 % | 4.2 % |
| walk line from the bottom | .34 | .29 | .40 |
| when | walking, by default | the phone, always | the map key / the lift of the rope; never on the phone |

A gallery of 3–5.5 m takes about .28 of the frame's height in both lenses; the rest of the
page is stone (10–15 % value, the strata, the cool fill from the mouth), never black. At a
thing the lens comes ×1.6 nearer (`plnGlide`), on the phone always. (The first table asked
36 × 20 m and 10.8 × 23 m; M630a pass 1 showed the gallery at 15–25 % and two thirds of the
frame void — changed 08.10.)
The lens follows the man eased (`plnGlide`'s curve, .45 s in, .7 s out); the floor is raked
and the ceiling falls as §11.8 asks, so both are seen. The phone keeps dark rock under its
chips and over its pads. **The man's head never touches a far line**: the lens may drop or
lift up to 1 m to keep a rim, a stack or an arch edge a head clear of him.

## 4. Bones and dressings

New modules after `22c` in byte order: `22d-cave-pln.js` (the scene: lenses, the glide, the
frame order, the switch), `22da-cave-pln-rock.js` (the density from `C.g`, strata, surface
nets per chunk, the cut face as a page), `22db-cave-pln-light.js` (two shadow maps, the cone
marched at half resolution, the small lights, post), `22dc-cave-pln-dress.js` (caps, bells,
columns, the lake, crystals, veins, moss, worms, fish, props) — each ≤ 40 KB, ported from the
stand's `cv-rock.js`, `cv-scene.js`, `cv-wgsl.js`, `cv-render.js` with the engine's kit
(`plnBlob`, `plnLoft`, `plnCard`, the WGSL conventions and post of `21pe`). The switch
`CAVE3.on` true by default, `?cave=0` the old painter until M890.

| Layer | Built from | Rule (§11.8) |
|---|---|---|
| rock | density = smoothed `C.g` × a depth profile + strata displacement by the world's rock (`CUN` kind → strata style: long soft beds, chopped blocks, level ribbon, grit); surface nets on a grid laid in the lens's frustum, chunks cached by cell range | the shape underground is the layer; ledges run and die away |
| the cut face | the front layer closed; the darkest band, dims to the frame's edges, a lip and a wash of light along the void; things in the stone from the game's own data: ore veins (`caveDeco` :159) under the lake, bones where `caveProps` puts them, roots under the surface, soil on top, the amber crawl (`branchEnds`) seen whole | a void that matters lies in the plane of the cut; nothing behind the cut is seen |
| the far lane | behind the gallery, where the grid has a pocket or a hall, an **arch** opens into a far chamber with its own shaft of day and a great stack of caps; built from the grid's halls, not invented twice | a window wider than its beam; far is lighter than unlit near stone |
| the day | a shadow map from above through the mouth column; cool; held to the top of the frame; a second shaft of day for the far chamber | no striped shadow on the heap; in full day stone wears moss |
| the lamp | the rig's helmet lamp (`plnManFrame` lamp) as the key: a perspective shadow map, a cone in the air at half resolution, a small warm pool without shadows at the lamp, reach 12–27 m by `kitStat().lamp` | the lamp carries its own pool; where two lights meet, one yields |
| small lights | the crystals (mauve, no shadows), amber (warm, dim), the stranger's camp lamp, the find's pulse, glow-worm fields on the roof, fish behind the water | lights drift, they do not blink; ore orange at a tenth to four tenths |
| dripstone | caps stacked from the floor, bells from the roof, a column where both meet with a neck; rims of ≥ 7 lobes; clumps with bare roof between, one long member per clump; placed where `caveDeco` places tips, columns and curtains | the vault is a vault: a dome over the man with noses at its ends |
| water | the lake of the water zone as a mirror plane with its section drawn on the cut; wet rim | the lake repeats the crystals |
| life | beasts by the planet's beast kit `21pib` (hostile dark palette, lit by the lamp, dropping from the roof as play does); plants by the planet's anatomies `21pia` in the cave's palette (pale caps, fungi, lichen pads at `caveMossSpots`) | small lives are lights |
| props | bones, crate, camp, rope and tally, the stranger's lamp body, the find — bodies of the people's grammar (grey steel, rust, one orange belt on the crate) | a body has a detail the eye can name |
| the wall of receipts | `wallDraw`'s marks as a decal card on the cut face at `CAVE_WALL_X0..X1`, lit by the lamp | kept whole; server-only as now |
| words | prompts as plates on their things with a leader (the mouth, the wall, the find, the amber, a beast); the HUD lines stay DOM | nothing in the centre |

The man: the rig (`21pha`) in 3D, poses air/jet/fall/swim as the play state gives them, the
jet flame as a lamp; `rigCardCave` (M801) is superseded under `CAVE3.on`.

## 5. The way in and out

On the surface the mouth is `plnThingCaveMesh` with `plnAtThing` < 34. On ACTION the lens
glides to the arch (the engine's glide, .45 s); on the frame it reaches the void sheet the
cave scene takes over **with the same lens** (position, fov, look), the knoll's arch drawn
from inside by the same mesh, and the last surface frame baked once to a texture is seen
through the mouth as the world outside — then the lens eases to the broad lens on the man.
Leaving is the reverse: the lens eases back to the arch, the surface frame is live again,
the glide out. No frame is black and no frame is a different picture. `enterCave` and
`exitCave` keep their logic; `28-loop`'s dispatch calls the new scene's draw under the switch.

## 6. What stays, what goes

- **Stays:** `caveBuild`, the grid and every query, `enterCave`/`exitCave`, `updateCave`
  whole (walk, jet, zap, sample, amber, prompts), `caveZones`, `caveDeco`'s *placements*,
  `caveProps`' *placements*, the wall (`11ah`), beasts' and plants' *logic*, the HUD, saves.
- **Goes behind the switch:** `drawCaveRock`, `drawCaveFar`, the tile stores, `drawCaveSolid`,
  `drawCaveWater`, `drawCaveGlow`, `22c`'s passes (`cave.mul`, `cave.add`, the cone,
  `helmBeamGpu`), the 2D prop drawers, `rigCardCave`'s taker.
- **Changes:** the 2D painters are never edited (`22-mode-cave` is read-only; `22a`–`22c` are
  wrapped at their draw seams); the new scene reads their tables.

## 7. Milestones

- **M630a The rock and the lens** — `22d`, `22da`, `22db`: density from the grid, chunks,
  the cut face, the broad and tall lenses with the eased follow, the rig in 3D with the lamp
  as key (shadows, cone, pool), the day at the mouth, the way in and out without a cut.
  Gate: the gallery past the mouth at 1920 and 390 on two worlds (sedimentary, volcanic);
  the mesh agrees with `caveSolidAt`; share ≥ .11 broad and tall, the gallery ≥ .25 of the
  height, no black above or below it; `errs 0`; vision clean.
- **M630b The halls** — `22dc`: dripstone, the lake mirror, crystals, veins, moss, the amber
  crawl in section, the far lane's arch and its day shaft, the far lens. Gate: the five
  zones each at the broad lens, the far lens at 1920.
  **The bar for every pass from here on (the designer, 08.10):** the stand's key frame
  `docs/look/cave.html` is the measure — the AAA level, not «it works and isn't black». Each game
  frame is set beside it on six points: (1) the cut page is stone with content — strata, fossils,
  roots, an ore vein, soil; (2) the day shaft — beam, moss, dust; (3) the arch with its own day
  and a cap stack, measured against the stand's right hall; (4) a dome over the man and the lamp's
  cone in the air; (5) the palette — dark-blue stone, amber dripstone, green at the mouth, lilac
  only as an accent; (6) a dark lake, teal only at the shore. A frame that reads as «a tube in
  haze» beside the stand fails and is reworked before it is reported. Shaders and light come from
  `cv-wgsl`/`cv-scene`/`cv-render`, not reinvented; density comes from the game's grid (`C.g`).
- **M630c Life and things** — beasts and plants as bodies, worms and fish, props, the wall
  decal, plates on things. Gate: a contact sheet of the props and the beast in the lamp.
- **M630d Cost and the phone** — the cave ≤ the surface frame at the same window
  (`docs/look/game/cost.py`); chunk cache ≤ 20 like the tiles; the S23 gate is the designer's.

## 8. Tests

A Node suite `91qg-cave`: at 400 sampled points the density's sign equals `caveSolidAt`
(the picture is the play); the first cave frame's lens equals the surface lens at the arch
and the first surface frame on exit equals the last cave lens; the broad lens holds the man
at ≥ .11 and the tall at ≥ .11; the far lens is refused on a phone window; the lamp's reach
is within 12–27 m for every `kitStat().lamp`; only the day and the lamp own shadow maps;
`?cave=0` leaves the old path and `rigCardCave` alive. The detectors (`90b/90c`) judge the
cave after every gesture as today.
