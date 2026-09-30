# The planet in the engine — the brief of stage 1

How the look of [`DESIGN-planet.md`](DESIGN-planet.md) stands inside the game (M610–M614).
The look itself is decided on the stand (`docs/look/`); this file says where its passes go
in the game's frame, what is taken from the engine and what is not, and what each step
builds. Laws of the picture stay in the plan (§11) and in the style sheet.

## 1. What the engine gives

Read in `src/08b-gpu.js`, `08b0`, `08b2`, `08c`, `28-loop.js`, `docs/DESIGN-gpu.md` §2–§5.

```
gpuFrame()      canvas #c cleared, the encoder GPU.enc opened
  gpuScene()    a pass into GPU.V.scene (rgba16float): what lies UNDER all 2D
  …2D on ctx…
  gpuOver()     uploads #c, opens a pass ABOVE the 2D drawn so far
gpuWorld(k,grain,vig)   bloom ladder if k>0
gpuPresent()    the final pass: frame + bloom, the shoulder, grain, vignette, dither
```

- The scene target is **display-referred**: 2D paints in the tones of the screen, and the
  scene keeps the same tones, open above 1. The final pass lays a shoulder over it:
  `tone(c) = min(c,.75) + .25·(1 − exp(−(c − .75)/.25))`.
- The engine's bloom is additive over the squared display frame. On a day frame it lifts a
  sky of .80 to about .89: it is a look of its own.
- There is no lit mesh, no shadow map and no user of depth in `src/`. `08cc-gpu-shadow` is
  the canvas's `shadowBlur`, `08cd-gpu-mat` bakes the hull's material; the belt projects
  its meshes on the CPU.
- Pipelines go through one funnel, `gpuPipeline(key, recipe, code)`; a key that was not
  warmed is built on the spot and written to `GPU_PIPES.lazy`. A lost device is rebuilt by
  `gpuInit`, which drops every cache: whatever a module keeps must be keyed by `GPU.dev`
  and by the size of the frame (`GPU.bw`, `GPU.bh`).
- The surface keeps one scale (M217): `surfScale()` K = clamp(min(H/560, W/1000), 1, 2.4).
  A broad frame holds 1000 × 562 units, a phone 390 × 844. The man is 23.6 units tall, so
  **13.1 units are a metre**; the strip is 1500 samples × 6 units, 687 m of walk line.
  The game's y grows downwards.

## 2. Decisions

1. **The planet has a renderer of its own**, a port of the stand's: two shadow maps, the
   mirror for water at half size, the scene with depth and MSAA, the wing, light in the
   air at half size, its own bloom and its own grade. All of it is recorded into `GPU.enc`
   before the engine's scene pass is opened.
2. **The finished frame enters the game as the bottom layer**: one triangle inside
   `gpuScene()`, in the tones of the screen. Above .75 it writes the inverse of the
   shoulder, `s = .75 − .25·ln(1 − (d − .75)/.25)`, so the final pass gives the graded
   value back untouched. Alpha of the scene is not written.
3. **From the engine's post the planet takes grain and dither.** The engine's bloom is
   switched off for the new look (`BLOOM_K.surface` is set to 0 while the switch is on and
   put back when it is off; `19c-light.js` is not edited). The plan's §4 said «post — the
   engine's own»: that holds for grain and dither only.
4. **The switch.** New modules only. `drawSurface` is wrapped by assignment from the new
   family; the old painter stays whole and is called when the switch is off, when there
   is no open frame, or when the new look fails. On: `?pln=1` in the address, or
   `PLN.on=true` from a stand. Off by default until the hand-over (M652), so the tests
   and golden frames of the old surface stay green.
5. **The lens is a shifted one.** The eye looks straight along +z; its window on the plane
   z = 0 is exactly the rectangle the 2D game shows. The play plane therefore maps by pure
   scale — a tap, a chip and a label land where they landed before — and the new frame
   sets `G.viewX`, `G.viewY`, `G.viewK` itself. The vertical angle is the stand's far
   lens: 24° for a broad frame, 46° for a tall one, blended by the aspect; the distance
   follows from the height of the window (100 m and 74 m). The horizon stands at .585 and
   .52 of the height, the feet at .28 and .32.
6. **Coordinates.** The planet's world is in metres, x along the walk line, y up, z away
   from the lens: `x = X/13.1`, `y = (Y0 − Y)/13.1`, with `Y0` the level of the pad.
7. **The land** is `H(x, z)`. On the walk line it is the game's profile, sample for sample.
   In front of it the slope takes the *least* of the profile over a window that widens
   with the distance, less a fall: near ground can never stand between the lens and a
   thing on the walk line. Behind the path the lane is raked to a crest and falls into a
   hollow; the far lanes are laid from the planet's seed. The lake of the profile
   (`waterOf`) gives the level of the water.
8. **The land is built in world space, by chunks along x**, so that nothing swims when the
   lens moves: a near band of fine cells, and one strip for every far lane. Thin and
   numerous things are **instanced** — one tuft, one crown, one stone, placed by records
   of 64 bytes — and also kept by chunks.
9. **Antialiasing** is 4× MSAA on the scene pass; the stand's supersampling is a way to
   shoot, not a way to play.
10. **Until stage 2 the cast is a blockout**: the stand's man and ship, and plain bodies
    from the game's own lists — `S.plants`, `S.fauna`, `S.deposits`, `S.cave.x`,
    `mineSpotX(p)`, the water. The interface is the game's, `drawSurfaceHud`, unchanged.
11. **The sun goes where the hour says, in five acts.** `celSun(p).ph` turns the key along
    one circle tilted 52° back from the zenith: it rises on the left, stands 38° high behind
    the scene at noon, sets on the right; the key frame M600 is this circle at ph = .125,
    and shadows fall towards the lens. The hour is painted by five looks — noon, day, gold,
    blue, night (`PLN_LOOK`, `PLN_ACTS`) — mixed by the height of the sun; a low sun slides
    behind the scene so that its glow stands over the far hills, and dawn is warmer than
    dusk. The sun is never in the frame: nothing on its circle can enter the window the
    lens sees.
    - **The bodies of the sky come from the world** (`plnBodies`). The moons of the planet
      (`p.moons`) ride a low road over the far hills, rising behind the left edge of the
      frame and setting behind the right, never above eight degrees; a moon's hour is the
      sun's hour minus its phase, so the full moon stands over the scene at midnight. They
      are lit by the true sun (`sunTrue`), so the phase comes out by itself. Standing on a
      moon, the parent hangs at one place, large, banded if a gas giant, with seas and
      clouds if a living world. The brightest body over the horizon is the key of the night
      (cold for a moon, warm for a parent); a moonless night has no key, and its clouds go
      almost as dark as the sky. Stars and a galaxy band (its great circle through a point
      of the window, the tilt from the seed) come out with `skyZen.w`. A moon in conjunction
      stands before the sun and is off its road.
    - **Clouds, air and light come from the weather of the world** (`plnWeatherLook`, from
      `19d`). Rain, snow and acid bring a deck of overcast drawn in the sky shader from
      `cloudDark.w`: the grey of that hour's shaded cloud, darker towards the zenith, tinted
      by the precipitation; the key drops to a fifth, the shafts go, the cloud shadows on
      the ground flatten out, the far bank thins so the far hills stay, the air takes the
      same grey. While it gathers it hangs as dark patches on the blue. Fog lays the air low
      and thick and pulls the sky and the clouds into milk; dust and ash colour the air, the
      sky and the clouds and dim the key; spores tint the air. Fog, dust and ash take the
      brightness of the hour, so they do not glow at night. The clouds drift with the wind
      of the world. The precipitation itself is M626.
    - **The eclipse is a scene, not a dimmer.** `celDark()` deepens the sky and the air,
      darkens the clouds, brings the stars; a ring of sunset glow stands round the whole
      horizon (`skyBase`, from `sunTrue.w`); the shadow of the moon walks over the land as a
      band with soft edges whose middle follows `celEclipse().ph` (carried in `ambGnd.w`)
      from the far mountains through the hero to behind the lens (`cloudLight`, so the
      ground, the things and the shafts darken alike); the headlamp comes on in the dark.
      The calendar of `06a` is not touched.

12. **One kit of bodies, placed by records** (`21pg`, `21pga`). A body is built once for a
    device, in its own measure (a tuft and a stone are a metre, a tree is ten); a record of
    64 bytes puts it into the world: place, size, yaw, the share of its height and two
    colours. A record has **yaw only**, no tilt. Three ways of colour: 0 — the mesh carries
    its colour and the record tints it (stone, flower, crag); 1 — the vertex carries the run
    from root to top and its own lightness, both colours come from the record (tufts,
    rosettes, the wing); 2 — the same for the crown alone, bark keeps its own (trees).
    Records of one visibility group lie in one buffer, body after body; a draw takes its
    own stretch.
13. **Placement is by chunk and by dice of its own.** `rng(plnPlantSeed(L, chunk, k))`:
    k = 1 bodies, 3 the wing, 4 the pond, 5 the crags. A chunk planted today and tomorrow is
    the same, and the game's common chance is never drawn. Rules of the stand: grass is
    thick on the shelf by the path, there is none on the path, on stone and under water;
    flowers and hay heads lie in drifts; a rock is «a big one with its small ones»; trees of
    the ribbon stand only **behind** the walk line; round the ship, the ramp and every thing
    of the game there is a clearing of that thing's real size; by the pad the composition of
    the accepted frame stands as it was.
14. **Trees are six species** (`21pgb`), each with an outline letter of its own: umbrella T,
    column I, tiers E, orb O, fork Y and the rare snag. A place has a main species (per
    120 m and per band of depth) with a third of strangers. Every crown is made of caps
    with a flat underside: the key comes from behind the scene and the lens looks down, so
    a cap shows its lit top where a ball shows its shaded side.
15. **The wing has bodies of its own** (`21pgc`): tree fern, big pointed leaf, tall grass
    with plumes, cap saplings. Only the top two to five metres of a wing body enter the
    frame, so a body is built from the level at which it enters; the wing is a theatre
    flat — every leaf lies in the picture plane, a record turns a body by a third of a
    radian at most; its top is capped under the man's feet.
16. **The things of the game stand as bodies, from the game's own state** (`21pi`, `21pia`,
    `21pib`): deposits (seven forms by `depKind`, the ore's colour from `RES`, the size by
    what is left), the cave mouth and the mine mouth, the plants of `S.plants` (twelve
    forms, three ages; a scanned one goes to the instrument's teal), the beasts of
    `S.fauna`. Places, remainders and clocks are the game's; nothing in play moves. A small
    beast is drawn larger than its measure (1.7 times at the smallest, as it is from a
    radius of 12 units): the game measures a beast by its place, not by its height.
17. **What is never a body lies over the frame in 2D** (`21pj`): labels (stacked when they
    meet), the drilling bar and beam, tracks, dust, near weather. What is not redrawn yet —
    finds, the base, the home, the settlement, signs — is laid by the old painters as
    stickers on the walk line, where the lens maps by pure scale. A sticker leaves the list
    when it gets a body (M626–M629). If an old painter throws, the whole list is dropped
    and the frame lives.
18. **Light, as it was added in M611.** The glow material carries a share of void: a dark
    opening takes almost no air on the long lens. The lamps of people are hooded. The
    reserve glow of flowers, leaves and ore fades at night; a plant that glows by itself
    keeps glowing. Rock takes its normal from the face (screen derivatives), so a smooth
    mesh of stone is still lit in facets; the ground carries its share of stone in the glow
    slot and does the same by that share.
19. **The pond** (`plnLandPond*`). On the walk line the water lies from `x0` to `x1`, as in
    the game; in depth the shore is a polygon of its own with bays and capes, made once for
    a landing. The rim next to the lens lies level with the water — the lens looks at the
    water at a glance, and a high grassy rim hides it. Under the edge there is a shelf, the
    depth begins a step away. A **ragged** strip of bare wet ground follows the waterline
    (a whole one reads as a second path round the pond). The sheet of water is laid inside
    the bowl only. Reeds, stones and saucer leaves stand along the shore; algae are curls
    that rise out of the water, and a taken one leaves the frame by the game's own list.
20. **The swimmer.** The life ring is a body: a torus in the colour of people with white
    bands. In the water the man sits in it to the waist — `PLN_CAST.sink` lowers the body
    below where the game holds it, `PLN_CAST.belt` is the height of the ring over the sole.
21. **A steep step of the walk line is rock.** Earth does not hold over forty degrees, and
    the ribbon drew such a step as a smooth green tent. A step steeper than
    `PLN_PLANT.steep` (tangent .9) and higher than .9 m is a crag:
    - the land keeps the table `L.crag` by column (the pond's shore stays a shore);
    - the ribbon's nodes on those columns are shifted so that face stands against face —
      in front of the line **downwards only**, and the line itself stays where the game
      has it;
    - those columns are painted with stone; the bounce light of the ground is halved
      there, for near ground only, so the far mountains keep their look;
    - a crag body is a sphere chopped by planes (`plnFloraCrag`): a facet has its own
      normal and its own lightness, moss lies on what looks up. `plnFloraLedge` joins two
      or three with a common dip; the kit holds six — tooth, twins and pillar stand tall,
      crest, block and slab lie low;
    - a body **behind** the line sits with its sole in the slope and rises over the ground
      at its middle by a given lift, the eldest at the high end of the step; a body **in
      front** never reaches the line within its footprint plus the window the lens opens
      (.25 of its depth), so the man on the step is never covered;
    - a body keeps off the things of the game by its own footprint and steps deeper when
      the place is taken; the pond and the pad stay free. `F.crags` logs what was placed.
22. **Every world has a sheet** (`21pfa`, `PLN_WORLDS`): eighteen colours of the land, two
    of water, the bounce of the ground, the near air, the pull of the sky `[hex, k, haze]`
    and the murk. `plnPalSet` fills the working `PLN_PAL` at landing; a mixed world takes
    up to a third of the other (`.7·mw`, capped at .34); an airless world does not tint
    the sky. The pull is **per element** — the sky by `k`, the far air by `.7k`, the ambient
    by `.8k`, the glow by `.6k`, the lit cloud by `.4k`, the key by `.25k` — because one
    pull over the whole frame is a colour filter: the methane world lost its blue and the
    crystal world went violet before this was learnt.
23. **The murk of water** is `waterA.w`: 0 clear, 1 opaque (acid, silt, tar). Murk
    shortens the ramp of depth, dims the reflection and tints the shore line with the water
    itself; a murky pond glows by night, `murk·(.16 + .30·nv)`, and lights its shore with a
    lamp of the water's colour. `lake.acid` now has a reader.
24. **The far world by type** (`PLN_FAR`, `plnFarLane`). The sheet names a shape — peaks,
    isles, mesa, cones, shelf, domes, spires, karst, slabs, blocks — a height for the terran
    lanes where the shape keeps them, the snow line, the tree line and craters; the shapers
    answer lane by lane (hills at 340 m, the ridge at 1050, the mountains at 3700, the two
    far ranges at 7 and 11 km) and `null` keeps the terran build. A far shape must clear the
    angular horizon of the near hills (400 m at 7 km ≈ 18 m at 340) and the haze eats four
    fifths at 7 km: a low shape far away is not there. The landmark azimuth `PLN_AZ_PEAK`
    carries every world's own mark — the volcano, the lone island, the tallest spire.
25. **Flora by world** (`PLN_WFLORA` → the working `PLN_FL`). The carpet of tufts takes the
    colour of the land already; the sheet gives the crowns, rosettes and bushes (four tints,
    the fourth an accent), the far bank, the pads, the reeds, the blooms and the wing.
    Rocks and crags are mode 1: the vertex carries the share of moss and the lightness of
    the facet, the record gives the stone and the moss of its world — an airless world gets
    caps of dust in its own colour, and the terran frame does not change by a pixel.

## 3. The family

New modules, glued after the old surface (`21h…` < `21p…` < `22…`). Every name begins
with `pln` or `PLN`: the game is one scope.

| Module | What is inside |
|---|---|
| `21p-pln` | the state `PLN`, the switch, units, small math: vectors, matrices, noise |
| `21pa-pln-mesh` | the mesh and its generators: blob, tube, loft, card, icosphere |
| `21pb-pln-wgsl-air` | shaders shared by all: the sky, its bodies, stars and the galaxy band, the deck of weather, clouds, the air, the light of clouds and the shadow of the eclipse |
| `21pc-pln-wgsl-scene` | shaders of bodies, the land, water, shadow |
| `21pd-pln-wgsl-post` | blur, bloom, light in the air, the grade, the hand-over triangle |
| `21pe-pln-gpu` | targets, pipelines, groups, the passes of one frame |
| `21pf-pln-land` | `H(x, z)`, the colour of the land, the pond, the crag table, chunks of the near band, far strips |
| `21pfa-pln-worlds` | the sheets of the eleven worlds: land, water, air and sky by type; the far world by type and its shapers; the flora sheet |
| `21pg-pln-flora` | the kit of bodies: tuft, flower, reed, stone, crag, rosette, bush |
| `21pga-pln-plant` | what grows and lies where: placement by chunk, the pad's composition, the pond's shore, the crags |
| `21pgb-pln-trees` | the six species of trees and their makers |
| `21pgc-pln-wing` | the wing: four families of bodies next to the lens |
| `21ph-pln-cast` | the man, the ship, the life ring |
| `21pi-pln-things` | deposits, the cave mouth, the mine mouth |
| `21pia-pln-herb` | the plants of the game, the algae of the pond |
| `21pib-pln-beast` | the beasts of the game, a flip book of seven bodies each |
| `21pj-pln-over` | what lies over the frame in 2D, and the stickers of the old painters |
| `21pz-pln-frame` | the lens, the five acts of the hour, the bodies of the sky, the weather's look, what is built when, the frame, the wrap |

`21pga` stands at 36 KB: the next pass of placement goes to a module of its own.

## 4. Steps

- **M610** the renderer and the switch: passes, targets, the hand-over triangle, the lens;
  a first land and the blockout man and ship, to have something lit. **Done.**
- **M611** the land proper: chunks, the near slope by the rule of §2.7, the raked lane,
  the hollow and water, far lanes from the seed, the wing. **Done**, in four passes:
  A — what grows (§2.12–§2.14), B — the things of the game (§2.16–§2.18), the wing
  (§2.15), C — the pond, the swimmer and the crags (§2.19–§2.21).
- **M612** sky and air by the hour: the five acts of the day, the bodies of the sky and the
  stars, the deck and the air of the weather, the eclipse. **Done**, in four passes.
- **M613** the worlds on one sheet. **Done**, in four passes: 1 — the sheets of the
  eleven worlds and the pull of the sky (§2.22), 2 — the murk of water (§2.23), 3 — the far
  world by type (§2.24; the author asked for it: «везде одинаковые горы сзади, должно быть
  разнообразие, задний фон для каждого»), 4 — stone and flora by type (§2.25).
- **M614** the cost: frame time on the PC by `docs/g11.ps1`, the list of what is cut for
  the phone and what each cut buys.

## 5. What is not done here

The landing, the cave, the mine and the base keep their old painters until their own
steps (M621, M630–M632). The precipitation of the weather is M626, its light is M612.
The old painters, the fleet's sky
(`src/19*`, `11ak-skywatch`, `27la-road-sky`) and the nebula are read and never edited.

## 6. State on 30.09.2026

Stage 1 stands at M613 done, M614 next. The new look is walked in the game behind
`?pln=1`; it is off by default, so the tests and the golden frames of the old surface
are those of `main`.

**M612** went in four passes (`a38f36be` the five acts, `544ca5e6` the bodies of the sky
and the stars, `0045a98a` the weather, `4ffb79bc` the eclipse). The Globals block is 248
floats (992 bytes); its spare slots are `airNear.w`, `thru.w`, `bounce.w`,
`cloudDarkS.w` (`waterA.w` is the murk since M613). The frames of the passes are in the
author's chat; the shooting helpers for hours, moons, weather and eclipses are in
`docs/look/game/`.

**M613** went in four passes (`62bb05b1` the sheets of the worlds and the pull of the sky,
`8adec61e` the murk of water, `b9ab0b55` the far world by type, `5cf8e2b2` stone and flora
by type). The test is one terrain landed as every type (`world.py <type> 1 lake`), so the
silhouettes compare across the sheet; `sheet.py` glues the eleven, `diff.py` says what a
pass touched. Passes 2–4 leave the terran frame unchanged to the pixel.

**Measured** (RTX 5070, everything planted, after pass A): 1600 × 900 — 5.5 ms;
3840 × 2160 — 20.8 ms, over the budget; the phone's frame — 2.7 ms. A broad frame holds
3.3 to 3.5 million triangles after pass C. The S23 is not measured.

**Known weak spots** — named, not hidden:
- the face of a crag knoll is smooth in places and its facets are low in contrast;
- the water of the pond is darker than the far water;
- beasts are blockouts (M625); tracks are the old game's dashes; landmarks, the base, the
  home and the settlement are stickers of the old painters (M626–M629);
- the markers of the interface at the top of the frame repeat the labels of the things;
- by the pad two orbs of the composition stand outside the frame, the far orb is dark;
- the first frame plants everything at once; 4K is over the budget (M614);
- the wing's fern is pale and its caps are flattish;
- M613: the far world of the swamp and of the jungle is pale in the haze; the crater on
  the metal world is one big ring; the volcano has no smoke and no glow of lava; the far
  plain of the ocean world is matte land, not sea; the species of trees are the same on
  every world; the blooms and the far bank are too small to carry a world's colour;
- the sky of M612: the lumps of the overcast deck are soft and its lower edge is a soft
  line; the drops and flakes are the old overlay (M626); the day crescent hides behind the
  cumulus; the giant's bands are subtle; the stars at the totality of an eclipse are faint
  and the shadow of the moon is a straight band in depth; wet ground neither darkens nor
  shines (M626).

**Not looked at yet**: the crags, the ring and the algae by night and in the mirror; dust
on a dry world; the eleven worlds by night and in weather (only the methane night was
shot); the tints of scanned plants; beasts in motion; whether a crag can hide the
label of a deposit.

**No tests.** Nothing in `tests/` names the new modules: they come with M651. The crag
placement keeps its measures apart from the GPU (`K.ledge[v].top/rx/rz/low`, `F.crags`),
so a suite of the Node tier can check that no body in front rises over the line and no
body hangs over the slope.
