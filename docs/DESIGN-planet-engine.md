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
26. **The tiers** (`PLN_QUAL`, `plnQualSet`, `plnQualAuto`, 21pe). One table of what the
    frame pays: the samples of the smoothing, the side of the shadow map, the divisor and
    the steps of the shafts, the divisors of the mirror and of the wing, the blurs of the
    wing, the levels of the bloom, the taps of the shadow beyond the centre, the density of
    the plantings, the thinning of the far world. `high` is the frame of M600; `mid` keeps
    the smoothing and cuts the rest (the shafts at a quarter with 16 steps, the mirror at a
    quarter, the shadow 2048, four taps, two blurs, four levels, the far world 1.5× sparser);
    `low` is the phone: no smoothing, the shadow 1024, 12 steps, the wing at a quarter, the
    plantings at .6, the far world 2× sparser. The tier is chosen once a frame before the
    planet draws: `G.opts.gfx.pln` if it names one, else a phone (the short side ≤ 760 with
    a coarse pointer, as 08-state) takes `low`, an engine already stepped down
    (`RES_AUTO < 2`) takes `mid`, the rest `high`. A change rebuilds the post layout, the
    shadow map and the pipelines (`plnGpuTier`), the targets after them; the density and
    the far thinning are taken on the next landing. Two lessons: WebGPU knows the sample
    counts 1 and 4 only (a `mid` with 2 drew nothing at all), and the shaders read the
    tier from slots the Globals already had — `thru.w` the taps, `pp.b.x` the steps — so
    no layout moved and the `high` frame is the same to the pixel.
27. **The build by frames** (`PLN_BUILD`, `plnLandStep`, `plnPlantStep`; 21pf, 21pga,
    21pz). The first frame of the planet built and planted everything in view at once:
    2.6 s on the 9950X, several times that on a phone. Now every job is small (a far piece
    is 1200 vertices, ~5 ms; the grass goes in pieces of 1200 probes) and a frame builds
    while the wall clock allows — 8 ms, the land first, the plantings the rest — or, where
    the clock stands (the test harness), while the count allows; the first call takes
    40 ms for the ground by the ship. Jobs go nearest first, so the horizon rises last:
    2.5 s on the PC. The far heights are computed once per land, by row, on demand
    (`L.farC`): the pieces share margins of three cells and computed each of them twice
    before. The scene is composed around one point (`L.cx0` — the far heights, the basin,
    the pass, the pad; since M621 it is `tr.plnCx`, set at the first frame of the descent):
    the descent builds the land around the pad while the ship is still in the air, the
    touch moves the ship within it without a rebuild (§2.30), and the first frame of the
    surface takes the land from the cache (`drawLanding` is wrapped in 21pza as
    `drawSurface` is in 21pz). `PLN.rush` still builds all at once, for the stand and the
    shots.
28. **The man is a rig** (`21pha`, `plnMan*`; M620). A hinge skeleton of thirteen bones in
    the x–y plane: pelvis, spine, head, two legs of three, two arms of two. The parts are
    built once from the kit (blobs, tubes, rings — ~2.5k vertices) in their bone's own
    frame, and the pose is assembled on the CPU every frame into one vertex buffer
    (`writeBuffer`): one geometry, one record, one draw; yaw π flips the facing. The pose
    reads the game's own state — `walkPhase`, `walkAmp`, `on`, `jetOn`, `vy`, `swim` —
    nothing of `21-mode-surface` moved (§8.3 of the plan); the stride is a law (the knee by
    `sin^1.2`, toe-off and heel-strike, counter-swung arms, the bob) and four keys (air,
    jet, fall, swim) blend over it. The silhouette is the «Орлан»: a stocky suit, not a
    slim man. The body is orange on every world (§8.6); the kit's three families colour
    the marks of the six slots through `kitPalette()` — the helmet's shell and band, the
    chest plate and the belt, the gloves, the boots, the pack's tanks, the lamp's housing
    — so the man the station dresses is the man the planet shows. The lamp's lens, the
    antenna's bead, the chest light and the flame are glow bodies driven per frame
    (`dyn`), and the rig pushes the frame's lamps itself: the headlamp's pool ahead of the
    man by night and in the eclipse, the jet's warm light under the pack. `PLN.near` is
    the near lens of §8.4: the lens alone glides twice as close (0 the game, 1 twice as
    near); the stand sets it for the frames of the man, play will set it at a thing (M624).
29. **The ship is the game's hull** (`21phb`, `plnShip*`; M621). The stand's blockout was
    one ship for all; now the body is lofted from `hullOf(G.shipId)`: the plan-form stations
    (nose, midship, step, stern), the airframe scheme (`form`), the wings as plates from
    the hull's own polygons, the nacelles on pylons, the class marks (`HULL_CLASS`:
    radiators, fin, dish, containers), a windscreen band with a rim, the owner's paint with
    the people's colour as the stripe (§3 of the plan). The loft has a squareness
    (superellipse section) so the flat forms read as boxes. The scale is the man: 7–10 m
    long (`landerLen`), the belly at the waist, three legs under it. The body is one mesh
    per hull; the legs and the flames are small dynamic meshes rewritten in place: each
    foot on its own ground (as in the old landing), folded in flight (`gear` 0…1), squatting
    at the touch (`sq`); embers idle and flame rings grow by thrust (`plnShipFx`) — from
    the main nozzles along the body, or from the belly jets downward (`down`), wider and
    longer so they read from the far lens. The hatch is on the near side (−z): in the body
    a collar and a closed door with a window; the open door, the lit room (warmer and
    brighter toward the floor, as a room is) and the ramp down to where the land expects it
    (21pf `rampX`/`rampZ`) are a geometry of their own (`plnShipOpen`), drawn with the
    hatch lamp when the ship stands (`open`). The frame also gets the thrust lamp under
    the jets and the ground blob under the body, fading with altitude. A rigid body may
    roll: a negative scale in the record marks it and the roll (about z, before the yaw)
    rides in the seed slot (`plnRec`, `placeAt`, `turnBy`); the wind reads `abs(scale)`.
30. **The descent is the surface's frame** (`21pza`, `plnDescent`; M621). The old landing
    (`19-mode-landing`) still computes everything — the thrust, the tilt, the touch, the
    gear, the squat — and its painter stays the fallback; the new frame calls `plnSurface`
    with a lens and a ship. The ship hangs at the game's altitude over the pad lane with
    the landing's tilt, the legs come out from 14 m and stand by 5 (or as the game's gear
    says), the belly jets burn by thrust (eased over frames) and glow hot after the touch
    while the touchdown count runs; the hatch stays closed. The window is the surface's:
    the ground under the ship at the same share of the frame as on the surface (1−f from
    the top) while the ship is low, the ship pinned at 24 % from the top when high — so
    the touchdown and the first frame of the surface are one window (at 3 m: the ground
    at 72 % of the view, the body at 62 %, K 1.6). The composition sticks to the pad:
    `tr.plnCx` is set on the terrain at the first frame of the descent and read by
    `plnLandMake` on the surface, so the far heights, the basin, the pass and the pad are
    composed around one point and the land built in flight is the land the surface takes
    from the cache. The touch moves the ship within that land without a rebuild:
    `plnLandMove` updates the ship's spot, the pad height and the ramp, and
    `plnPlantRefit` replants only the band the ship covers (the grass of a chunk stays
    drawn as `stale` until the chunk regrows); the mode switch replants once more, because
    the game's deposits, plants and the cave mouth exist only from `enterSurface`
    (`L.flora.src`). The first frame of the descent carries the land by the ship and the
    flora kit (~110 ms); nothing of the sort remains at the touchdown.

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
| `21ph-pln-cast` | the life ring, the cast's frame (the man and the ship are called from here) |
| `21pha-pln-man` | the man: the rig's bones, parts from the kit, the poses, the flame, the lamps of his own |
| `21phb-pln-ship` | the ship from the game's hull: the loft, the class marks, the legs, the flames, the hatch open and closed |
| `21pi-pln-things` | deposits, the cave mouth, the mine mouth |
| `21pia-pln-herb` | the plants of the game, the algae of the pond |
| `21pib-pln-beast` | the beasts of the game, a flip book of seven bodies each |
| `21pj-pln-over` | what lies over the frame in 2D, and the stickers of the old painters |
| `21pz-pln-frame` | the lens, the five acts of the hour, the bodies of the sky, the weather's look, what is built when, the frame, the wrap |
| `21pza-pln-descent` | the descent: the landing's state as a lens and a ship for the frame of 21pz, the wrap of `drawLanding` |

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
- **M614** the cost. **Done**: the measure by the real clock (`docs/look/game/cost.py`),
  the series of cuts at 4K and at the phone's pixel count, the tiers (§2.26), the build
  by frames and the far heights once (§2.27). The numbers are in §6.
- **M620** the man. **Done**, in three passes: the rig and its poses (§2.28), the stocky
  suit after the first frame read as a slim man, then the flame in the rig's frame, the
  tanks proud of the pack, the glint of the visor, the shorter legs. The decisions of §8
  of the plan were handed to me the same day («про открытые решения сам реши») and are
  written there.
- **M621** the ship and the descent. **Done**, in two passes: 1 — the ship from the game's
  hull (§2.29), 2 — the descent as the surface's own frame (§2.30): the sticky
  composition, the move at the touch, the replant at the switch.

## 5. What is not done here

The cave, the mine and the base keep their old painters until their own steps
(M630–M632); the landing is drawn by `21pza` since M621, its old painter is the fallback. The precipitation of the weather is M626, its light is M612.
The old painters, the fleet's sky
(`src/19*`, `11ak-skywatch`, `27la-road-sky`) and the nebula are read and never edited.

## 6. State on 02.10.2026

Stage 1 is closed (M610–M614); stage 2 stands at M620 and M621 done, M622 (the flora
kit) next. The new look is walked in the game behind
`?pln=1`; it is off by default, so the tests and the golden frames of the old surface
are those of `main`.

**M612** went in four passes (`a38f36be` the five acts, `544ca5e6` the bodies of the sky
and the stars, `0045a98a` the weather, `4ffb79bc` the eclipse). The Globals block is 248
floats (992 bytes); its spare slots are `airNear.w`, `bounce.w`, `cloudDarkS.w`
(`waterA.w` is the murk since M613, `thru.w` the shadow taps since M614). The frames of the passes are in the
author's chat; the shooting helpers for hours, moons, weather and eclipses are in
`docs/look/game/`.

**M613** went in four passes (`62bb05b1` the sheets of the worlds and the pull of the sky,
`8adec61e` the murk of water, `b9ab0b55` the far world by type, `5cf8e2b2` stone and flora
by type). The test is one terrain landed as every type (`world.py <type> 1 lake`), so the
silhouettes compare across the sheet; `sheet.py` glues the eleven, `diff.py` says what a
pass touched. Passes 2–4 leave the terran frame unchanged to the pixel.

**M614** (the cost) is measured by the wall clock: the stand steps the page's clock by
hand, so the game's own `ms` read 0 under it until `cost.py` hooked the real one
(`__STEP.real`). RTX 5070, the test terrain, everything planted, the tier `high`:

| frame | ms | scene / air / mirror / engine |
|---|---|---|
| 1600 × 900 | 5.8–6.0 | 3.1 / .7 / .4 / .9 |
| 3840 × 2160 | 18.2–18.7 | 10.7 / 3.9 / 1.3 / 1.1 |
| 390 × 844 at 1.5 (the S23's pixels) | 3.1 | 1.1 / .4 / .2 / .8 |

The base at 4K drifts by .5 between runs, so a cut under that is noise. What a cut buys
at 4K: no smoothing −2.9; the shafts at a quarter of the frame −2.9, or 12 steps −2.2;
the plantings at .6 −2.3; four taps of the shadow −1.1, none −1.3; the mirror at a
quarter −.8; the wing at a quarter with two blurs −.5; four levels of bloom, the shadow
map at 2048 or 1024, the far world 1.5× sparser — noise; the far world 2× sparser −.4 on
the GPU, but the land builds in .85 s instead of 2.1. The tiers: `low` 11.1 at 4K (−41 %)
and 2.0 at the S23's pixels (−35 %); `mid` 15.0–15.3 at 4K (−20 %; the base drifts
18.2–19.6 between runs and the scene pass is the same in both) and 2.6 at the S23's
pixels (−18 %). At the phone's pixel count every cut buys .1–.3 of 3.1 and the engine's
own passes are a fixed .8; the shadow map matters there (the pass .16 → .05 at 1024)
while the taps, the wing, the bloom and the density do not; at 1600 × 900 `low` is 3.3
(−45 %).

**M620** (the man) went in three passes, uncommitted between them. The rig costs nothing
measurable: ~2.5k vertices posed on the CPU in well under a millisecond and one
`writeBuffer` of 130 KB a frame. The frames of the passes are in the author's chat; the
pose shooter is `docs/look/game/pose.py` (a frozen state through getters, the near lens,
the crop). At the game's far lens the man stands 38 px tall at 1600 × 900 and reads as
an orange body with a white helmet and pack; at the 96-px squint he is one orange dot.

The first frame: 2.6 s at once → 95 ms after a landing (the descent warmed the kit), 170
when a save opens on the surface; then ~11 ms a frame for 2.5 s while the world rises
nearest first, with a frame over 16 ms now and then (a ribbon chunk is 13 ms and atomic)
and the land standing by frame 150. The far heights once took a far piece from 8 to
5.4 ms and the far build from 1.7 to 1.1 s; the whole build at once is 1.6 s of land and
1.0 s of plantings. The S23 itself is not measured: that is the author's daytime.

**M621** (the ship and the descent) went in two passes (`863ed075` the ship from the
game's hull, then the descent). The ship is one geo per hull and two cap-sized dynamic
geos a frame. The descent window was measured at 3 m (the ground at 72 % of the view, the
body at 62 %, K 1.6 — the surface's own numbers) and the flow touchdown → `plnLandMove` →
`enterSurface` → the first frame of the surface was run under the stepped clock
(`descent.py "<name>:alt=0;touched=1;flow=12"`, shot with `until=window.__FLOW`): the same
land object, the band replanted in the frame of the switch, no errors. The ship's shadow is
cast by the near map (the ship and its shadow point both inside the box; the ground under
it 27–42 % darker, measured with the ship's frame stubbed out), but at a low sun it lies
ten metres toward the lens — below the ship in the frame, among the trees' shadows. The
frames are in the author's chat; the shooter is `docs/look/game/descent.py`.

**Known weak spots** — named, not hidden:
- M620: at the far lens the man is a dot in the squint — the far lens is the game's own
  scale (§8.4 of the plan) and the near lens at a thing is the answer, not a bigger man;
  the arms are slim for an Orlan; the flame is a plain cone; the far arm and leg are told
  from the near ones by depth alone; behind the visor there is no face, a dark glass with
  one glint; the poses of the mine, the dig and the cave come with M630+ and the card of
  §8.2; the belt and the collar are rings, not seams;
- the face of a crag knoll is smooth in places and its facets are low in contrast;
- the water of the pond is darker than the far water;
- M621: the descent has no weather and no dust at the touch; the game's deposits, plants
  and beasts appear at the switch to the surface and the hatch opens with a pop
  (`enterSurface` makes them and cannot run earlier); the landing's caption stays where
  the old painter's ship stood, not under the new one (it is drawn by the old HUD); the
  first frame of the descent carries ~110 ms; the flames are plain rings, the landing lamp
  a disc of light; the ship's shadow at a low sun lies far below the ship in the frame;
- beasts are blockouts (M625); tracks are the old game's dashes; landmarks, the base, the
  home and the settlement are stickers of the old painters (M626–M629);
- the markers of the interface at the top of the frame repeat the labels of the things;
- by the pad two orbs of the composition stand outside the frame, the far orb is dark;
- 4K at `high` is over the budget (18 ms; `mid` is the answer until the scene pass is
  cheaper); the first 2.5 s after a landing drop a frame now and then while the world
  rises, and the horizon pops in piece by piece without a fade; a change of tier takes
  its density and its far world on the next landing only; the S23 itself is not measured;
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
