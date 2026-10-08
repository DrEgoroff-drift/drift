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
    meet; in window pixels since M624, the drill's bar under its label), dust, near weather;
    the beam and the tracks are bodies since M624 (§2.38–§2.39). What is not redrawn yet —
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

31. **The twelve forms are anatomies, not sticks with balls** (`21pia`, `PLN_HERB_MAKE`;
    M622). Each form of the genome has a body of its own: the stem form — a basal rosette,
    saucer leaves on petioles, a candle of buds; branched — a shrub of caps with flat
    undersides; fern — a trunk and two tiers of fronds with fiddleheads; pod — pods hung in
    pairs and a bunch at the top; druse — crystals out of a crust, not out of the grass;
    spike — ears with awns over narrow leaves; carpet — cushions with lobes, built in
    metres, because a species half a metre tall sank in the grass when its cushions
    followed its height; mushroom — a dense cap with a rim, gills underneath, a ring on
    the stem, spots; spiral — a tapering coil with feathers; umbrella — a translucent
    membrane scalloped on its ribs, a second tier when old; ball — tethered balls with
    calyxes over a rosette; ribbon — twisted strips, every other one a petal when the
    species blooms. The body is built at unit height and scaled by the record. The
    catalogue (`herb.py`) lines the forms up at the near lens and is shot at `dpr=3`: the
    pixel size of a plant comes from the device ratio, the lens itself is clamped.

32. **Colour: the leaves are the world's greens, the accent is for flower parts only**
    (`plnHerbMesh`; M622). A whole plant in the world's accent read as a maroon yucca —
    the under colour dominates on vertical blades. A species' leaves take one of the
    world's three green pairs by species index (one rule near the line and in the wild);
    only the blooming species carry the accent pair, on their flower parts — buds, pods,
    ears, balls, the cap, petals, the druse's crystals — as literal colours on matte
    materials, while the other species carry those parts in the record's tone (ears straw,
    caps ochre). The accent on a four-metre cap read as candy, so the cap takes it dusty,
    mixed toward ochre.

33. **The genome is in the carpet** (`21pgd`, `plnWild*`; M622). The planet's species grow
    beyond the line the game planted them on: drifts of one species behind the line (3–9
    bodies in an ellipse, tall species one to three, up to three drifts a chunk by
    lushness, on free land — not the path, the water, the pad lane or steep ground), and
    the tall species (from 2.5 m) as silhouettes by the crests of the far shore at one and
    a half their height. The bodies are the same `plnHerbMesh` in the world's tone, cached
    per species and age on the landing and freed with it. The trees answer the world too:
    `PLN_WILD.trees` multiplies the kit's weights in `plnTreeKind` — a desert stands in
    snags and forks, a jungle in umbrellas and tiers. The far bank's heather lies in
    ragged drifts muted toward the grass: an even patch of pure heather read as a puddle.

34. **Stone: planes part by light** (`fs_main`, `plnFloraCrag`, `K.crag`; M623). A rock's lit
    facet is warm and its shaded facet is cool — `(1.16, 1.05, .86)` against `(.76, .86, 1.14)`,
    scaled by the key, so by night there is no split; the facet normal rules the shading (rock
    bodies .92, the stone share of the ground .85) and the lit step of rock is harder. The
    crag maker's facet lightness runs .58–1.14 by where the facet looks, and the moss is a
    cap with a ragged edge, not a wash. Big stones — near, behind the line, and on the far
    shore — are crag bodies of the kit (`K.crag`: a coarse sphere, ico 1, cut by 9–13 planes
    from .42), because a bumpy sphere read as a lump of clay at every distance. The first
    pass (±10 % of hue and strata by height) changed nothing visible, and the strata were
    smudges on a lit face: dropped.

35. **The ground's dress** (`21pge`, `plnDress*`; M623). The path is not a brush stroke: its
    mask falls over .4 m (was .8); inside it a trodden core of .45 of the half-width is darker
    (soilDark toward soil) and the rim is dusty (soil toward dry) — the core is the same
    `plnLandPath` with a width factor. Pebbles are bodies in heaps: 3–5 heaps a chunk
    straddling the path's edge, 5–10 stones of 6–20 cm each, and one heap at the ramp's
    foot where the man steps down; they give no shadow blots (a frame holds 65, and the
    trees need them). The ground takes a fine brush grain within 45 m of the lens.

36. **Water: the shallows and the shore** (`fs_water`, `plnLandRim`, `plnLandFarH`; M623).
    The pond's shelf is wider (.28 m deep over 1.3 m), the water's alpha ramps to .6 m of
    depth and its body is lighter and greener in the shallows, so the bottom shows through
    in a band along the shore; the bottom there is a lighter mix of soil and mud
    (`plnDressShore`), the mud only deeper. A thin light line runs along the waterline,
    broken by the ripple, over the softer band. The far water of the hollow keeps its line
    in bays and spits: the distance that dries the floor wanders by fbm (±7 m) instead of
    running parallel to the lens. Reeds stand in a few clumps with open water between —
    one clump per 9 m, a third skipped — instead of a continuous row.

37. **A deposit is a boulder with the ore on its crown** (`plnThingBoulder`,
    `plnThingDeposit`, `plnThingSpoil`; M624). A faceted stone of the world — an icosphere
    cut by eight planes, one of them the flat crown, each facet coloured by where it faces
    (the crown lighter) and parted further by the light (§2.34) — breaks the turf with its
    base .15 m under the ground; the ore of the seven forms stands on the crown, a fifth
    larger than the old painter's, and eight clods of dark soil lie at the foot. The old
    dark «nest» read as the stand of a figurine, the first pass's flat slab as a platter.
    What is taken out is a spoil heap of its own mesh: two blobs of ground mixed from the
    ore and the soil, scaled by the record from nothing at a full deposit to full at an
    empty one, so a worked deposit shows its work.
38. **The drill is a tool in the hand; the beam and the chips are bodies** (`21pic`,
    `21pha`; M624). The rig has a `drill` pose — the torso leans to the bite, the head
    looks down, the near arm points the tool — eased by `K.drill` from `S.mining`, with a
    small vibration of the arms and the torso while it runs; the tool is a part of the near
    forearm (grip, barrel with the gloves' accent ring, nose, bit, a side box, a glowing
    tip) built once from the kit and written each frame like the flame. The beam is a tube
    from the tip to the bite — on the ore's near face, at a height from what is left — of
    the ore's colour mixed with white, glow 5, pulsing in radius; a flare blob sits at the
    bite and sixteen chips fly from it toward the man in arcs of their own (hashed ages,
    angles and speeds), bigger and brighter when young; one lamp at the bite lights the man
    and the stone. The per-frame mesh is rebuilt on the CPU into one buffer, one record,
    one batch. The 2D beam and the bar at the man's waist are gone; the bar sits under the
    label.
39. **Footprints are bodies** (`21pid`; M624). The game's `S.tracks` (one every 13 units,
    alive `TRACK_LIFE` ticks) are drawn as one sole mesh (a flat cut blob with a heel) in up
    to 220 records, newest first within the frame, left and right of the walk line by turns
    (.13 m), turned by the facing; each takes the ground's colour at its spot (cached per
    track) darkened by 42 % when fresh and fading to the ground over the second half of its
    life; no shadow blots. The old dashes of dirt in 2D are gone.
40. **The lens glides to a thing** (`plnGlide`, `plnAtThing`; M624, the decision of §8.4 of
    the plan). The far lens on the move, the near one (twice as close, `PLN.near` of M620)
    when the man stands at a thing: mining, or within 26 units of a deposit, 34 of the cave
    mouth, 40 of the ship, the mine mouth's radius, 30 of a plant, or at a landmark
    (`poiNear`); never while walking (`walkAmp` > .25), on the jet or in the air. The glide
    is an exponential ease by the wall clock, .45 s in and .7 s out, snapping within .002;
    the frame's `K` is `surfScale()·(1 + max(PLN.near, glide))`, so the stand's `near`
    still works. Labels and the drill's bar are drawn in window pixels
    (`surfScale()/G.viewK`), so the near lens does not blow them up.

41. **A beast is an anatomy with a gait, not a blob with legs** (`21piba`; M625). Five
    earthly anatomies by the species' `shape`: capsule (0; the hopper when `hop` and two
    legs or fewer — hind legs longer, front paws, thighs), long (1; a tube body with a
    lateral sway, sprawled legs bent up, a dorsal sail if `crest`), stout (2; a big torso on
    columnar legs, a hump and a ridge, a big low head), upright (3; a leaned egg, folded
    wings on the flanks — without them it read as a lizard — an S-neck, a beak, a comb if
    `ears`), segmented (4; six segments in a wave, leg pairs from `legs` on the front
    segments with a metachronal phase, antennae, a tail spike). The skin is a baked gradient
    along the body's up axis (`skin(lo,hi)`: .8 at the belly, 1.1 at the back) with the
    species' spots as noise; legs darker (.72). The five aliens (jelly, strider, crystal,
    manta, shell) keep their own bodies in `21pib`.

42. **The leg law** (`plnStride`, `plnLeg`; M625). One stride for every walker: stance for
    `duty` .6 of the cycle (the foot slides from +s to −s), swing by a smoothstep with a
    lift of `lift`·sin; legs alternate by `plnLegPhase` (the parity of index and side, a
    hopper moves its pairs together). A leg is a two-bone chain solved by IK: the knee sits
    at the midpoint plus the bend direction given by the anatomy (forward for a hind leg,
    backward for a front one, up and out for a sprawler), a tube of five sides with a foot
    blob. Six walk frames (`PLN_BEAST.N`) go into the flip book; the body rides on `up` (a
    hopper by |sin|, a walker by a small bob).

43. **The book of poses** (`PLN_BEAST.poses`; M625). After the six walk frames the book holds
    stand, graze, hostile and stun. Hostile: the torso lower and forward, the ridge raised, a
    lower jaw with two fangs, the eyes hot (`[1,.32,.2]`, glow .9, a third bigger — the first
    thing that reads at night); graze: the head down to the grass; stun: the body laid on its
    side by `plnBeastLay` (roll 1.35, the lowest point at .03), the eyes flattened. The aliens
    answer in their own way: the jelly flattens and spreads when hostile and lies beached with
    its tentacles radial when stunned, the strider lunges with the neck forward and lies down,
    the manta dives and droops flat on the ground, the shell is flipped by π with its legs up.
    The frame takes `b.pose` when the game sets one, else stun, hostile, the walk, or a slow
    sine between stand and graze. A book is keyed by the species' identity (`plnBeastSpId`,
    a WeakMap counter) plus tail, crest and head size, so the young (no tail, no crest, a big
    head) get a book of their own.

44. **Far herds and flocks, then the near beast** (`plnBeastFarKit`; M625, the «sign at a
    distance» of the plan's §4). On the far lane (`PLN_BEAST.far` 140, scale `farK` 1.6) a
    herd of three of the world's herd species walks one way in a loose file, and a flock of
    five of its first flying species crosses the sky at `flockH` 24 above the far ground.
    Both drift by the clock on a cycle of the lane's width plus `farGap` 220, so a group is in
    view about four tenths of the time (the stand forces it with `farGap` −60). A far beast
    is skipped in water, in front of the elevation's azimuth and off the lane; far records go
    to the main pass, the mirror and the far shadow, no blots. `PLN.stat.beasts.dbg` reports
    the lane's width and each group's drift and skips. A beast within 20 units is «a thing»
    for the near lens (`plnAtThing`).

45. **Fur in the light** (`21pc`; M625). The scene at the key hour is backlit: a body facing
    the camera gets only the ambient, and mid-brown fur read black. The beast material (8)
    has a wrapped terminator (`smoothstep(−.22, .42, ndl)`) and takes the grass bounce like
    bark and rock — a fill at the material, not a brighter palette.
46. **Weather is cards in the scene's air, not an overlay** (`21pk`; M626). Drops, flakes,
    embers, spores and dust grains are quads born in the vertex stage from a hash and the
    clock — no buffers, nothing uploaded. Four depth planes as fractions of the lens
    distance D (far 1–2.4 D thin and lazy, near 0.2–0.35 D thick and fast); widths and
    lengths are set in pixels and turned into metres through the frame's height at that
    distance (`mpp`), so a drop is 1–2.6 px wide at any size of window. The cards wrap in
    the world, not in the frame: the man walks through the rain, it does not walk with
    him. Being in the scene they are occluded by the hills and the trees, lit by the key,
    the sky and the lamps, and sunk by the air like every body. The old overlay stays
    behind `PLN_WX.on`.
47. **Lamp drops** (M626). Of the global cards only a handful ever fall inside a lamp's
    sphere, so the night read dry. Each lamp (headlamp, the ship's door, the mine, the drill,
    the glowing pond) gets its own range of cards — 90 at full power — falling through its
    light, under the hood (nothing above the lamp), tilted by the wind, fading with distance
    from the lamp's centre.
48. **Lightning** (M626). A double flash in the look (the key ×(1 + 4 fl), the sky, the
    clouds and the ambient whitened by a share of fl) and a bolt body of two cards per
    segment (core and halo, sixteen segments) running from the frame's top at its distance
    behind the ridge. The vertical field is ≈ 24°: the frame's top at distance s is only
    E.y + 0.177 s, so a bolt placed at 300 m up was never seen — it hangs from the top edge
    of the frame now.
49. **Sheets are a poke at what lies behind them** (M626). Fog banks, dust veils and the
    far rain curtains were drawn with their own lit colour and vanished: measured, a curtain
    darkened the sky by 2 % and a fog bank in thick air came out exactly the air's colour.
    A sheet now takes the colour of what is behind it and bends it — a curtain is the sky
    at 0.45, a fog bank the air whitened and brightened, a dust veil the air at 0.6 — and
    the air does not fog it again. Fog banks lie where the picture has water and ground:
    six of ten over the far water (z 60–150, the water's level), four at the hero's feet
    (the ground of the walking line, passed from the land profile). The method: a magenta
    debug return proves the geometry is on screen, a diff against a frame with zero sheets
    measures what they add.
50. **Wet ground** (`21pc`; M626). Under rain and acid the ground and the stone darken
    (albedo ×(.50, .52, .56)), take the sky by Fresnel on flat faces and a sun glint; the wet
    eases in over 30 s and dries over 150 s (`PLN_WX.wet`), so a passing shower leaves a
    dark path for a while.
51. **Landmarks are bodies behind the crest** (`21pie`; M627). The twelve POI of the game
    stand on the land ribbon at `tr.poi[].x / PLN_M`, each kind at its own depth behind the
    walk line (12–36 m), with its own yaw and its own size law (`h × sc / PLN_M × .8 × s`,
    `s` per kind). The walk line is a crest and the ribbon drops 5–28 m behind it, so a body
    set on its own ground shows only its top: the base is `max(ground − .4, crest − 2.5)`,
    the crest being the highest ground between the line and the body, and a mound of the
    world's stone fills the gap down to the ground. The old sticker is off while
    `PLN_MARK.on`; the pad of each landmark is a clearance for the planter (`plnMarkPad`).
52. **Three grammars** (M627). People's things (wreck, elevator, factory, observatory,
    obelisk, battery) are mid steel with rust and soot by noise, orange belts and concrete;
    the ancients' things (temple, ring, anomaly, monolith, portal) are dark blue-grey stone
    (`#2a3040`/`#4e566c`) and carry the world's accent (the old sticker's colour per world
    type) as their own light; crystals are the world's crag colour graded to the accent by
    height, with snow on the tops. Every body is one mesh of the kit (blobs as boxes,
    tubes, lofts, cards) in MAN or ROCK; the mound is a ROCK blob in the world's palette.
53. **Light and move records** (M627). A landmark is three records of one instance set:
    the body, the light (the GLOW parts — windows, seams, beacons, panes — with `ca` = the
    pulse of the hour) and the moving part (the elevator's climber, the anomaly's shards)
    placed by `moveAt(t)`. The ancients' light is always on and brings a tinted lamp
    (`always`); people's windows and lamps come with the night key `nk`, their lamps are
    warm and strong (k 3). Lamps go into `F.lamps` behind the headlamp and the mine, so two
    ancients in view may push the lake's lamp over the cap of four.
54. **The hour lesson** (M627). At .30 the key stands behind the subject and mid steel
    reads black — not a material bug: on the test terrain .2 and .4 are the front-lit day
    hours, .5 dusk, .55 and .8 night. The kit's colour callbacks differ in signature
    (blob `(u,p,n)`, tube `(t,ang,p)`, loft `(t,s,p,c)`): one callback used across kit
    calls gives NaN colours (white parts); `P3`/`N3` take the point and the normal from
    any of them.

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
| `21pgd-pln-wild` | the wild drifts of the planet's own species, near and far; the tree weights of a world |
| `21pge-pln-dress` | the ground's dress: the path's core and rim, the pond's shore and shelf, pebble heaps |
| `21ph-pln-cast` | the life ring, the cast's frame (the man and the ship are called from here) |
| `21pha-pln-man` | the man: the rig's bones, parts from the kit, the poses, the flame, the lamps of his own |
| `21phb-pln-ship` | the ship from the game's hull: the loft, the class marks, the legs, the flames, the hatch open and closed |
| `21pi-pln-things` | deposits (the boulder, the ore, the spoil), the cave mouth, the mine mouth, «at a thing» |
| `21pia-pln-herb` | the plants of the game, the algae of the pond |
| `21pib-pln-beast` | the beasts of the game: a flip book of ten frames per body (six of the walk, stand, graze, hostile, stun), the alien bodies, the far herd and flock |
| `21piba-pln-gait` | the gait: the stride law, two-bone legs, the five earthly anatomies and their poses |
| `21pic-pln-drill` | the drill in the hand, its beam, the flare and the chips at the bite, the lamp of the bite |
| `21pid-pln-tracks` | footprints as bodies: the ground's colour, fading by age |
| `21pie-pln-marks` | the landmarks: the twelve POI of the game as bodies behind the crest with a mound, the three grammars, the light and move records, their lamps |
| `21pj-pln-over` | what lies over the frame in 2D, and the stickers of the old painters |
| `21pk-pln-weather` | the precipitation as cards in the scene's air: drops, flakes, embers, spores, dust grains, lamp drops, lightning, sheets (dust veils, fog banks, far rain curtains); the wet of the ground |
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
- **M622** the flora. **Done**, in three passes: 1 — the twelve anatomies (§2.31), 1b —
  the colour law (§2.32), 2 — the wild drifts, the far silhouettes, the tree weights by
  world and the heather (§2.33).
- **M623** stone, the ground's dress, water. **Done**, in three passes: 1 — stone parted by
  light, crag bodies for big stones (§2.34), 2 — the path's core and rim, pebble heaps, the
  shallows and the shore line, the hollow's bays, reeds in clumps (§2.35–§2.36), 2b — the
  path's edge crisper, more pebbles.
- **M624** things to take. **Done**, in three passes: 1 — the drill in hand and the stance,
  the beam and the chips as bodies, the deposit on stone with clods, the spoil, footprints
  as bodies, labels in window pixels, the lens glide (§2.37–§2.40); 2 — the boulder instead
  of the slab, the beam hotter with a flare, the head to the bite; 3 — the deposit a fifth
  bigger, the chips bigger and wider.
- **M625** fauna. **Done**, in three passes: 1 — the five earthly anatomies on one leg law,
  six walk frames, the book of poses (stand, graze, hostile, stun), fur lit at the material
  (§2.41–§2.43, §2.45); 2 — the aliens' poses (the jelly beached, the strider's lunge, the
  manta's dive and its flat stun, the shell on its back); 3 — far herds and flocks on the
  far lane, a beast as a thing for the near lens (§2.44).
- **M626** weather and sky events. **Done**, in two passes: 1 — the seven kinds as cards in
  the scene's air on four depth planes, sized in pixels (§2.46); 2 — lamp drops at night,
  lightning with a bolt body, wet ground, sheets that bend what lies behind them
  (§2.47–§2.50).
- **M627** landmarks. **Done**, in three passes: 1 — the twelve POI as bodies of the kit
  behind the crest with a mound to the ground (§2.51); 2 — sizes by kind, the three
  grammars, the ring's band of light, the obelisk's notch (§2.52); 3 — the night: the
  ancients' light always on with a lamp, people's windows and lamps by the night key, the
  light and move records (§2.53–§2.54).

## 5. What is not done here

The cave, the mine and the base keep their old painters until their own steps
(M630–M632); the landing is drawn by `21pza` since M621, its old painter is the fallback. The precipitation of the weather is `21pk` since M626, its light is M612. The landmarks are `21pie` since M627; the old sticker is the fallback behind `PLN_MARK.on`.
The old painters, the fleet's sky
(`src/19*`, `11ak-skywatch`, `27la-road-sky`) and the nebula are read and never edited.

## 6. State on 07.10.2026

Stage 1 is closed (M610–M614); stage 2 stands at M620–M627 done, M628 (own things) next. The new look is walked in the game behind
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

**M622** (the flora) went in three passes, committed as one. The forms were judged on a
catalogue at the near lens (`herb.py "c0:forms=0-2;gap=4;near=1;walk=25"`, shot at
`dpr=3`), then on the game's frames: the test terrain at 4600 by day and by night, one
terrain landed as jungle and as desert. The jungle stands in walls of four-metre
mushrooms and coils — that is the game's own planting (`S.plants`: 314 bodies on the
line, giants by the biome), not the drifts; the drifts of tall species were cut to one to
three. The desert has no flora and no drifts. No errors in any frame.

**M623** (stone, the ground's dress, water) went in three passes on the test terrain: the lake
by day and by night, the shore and the path at the near lens. The first stone pass changed
almost nothing visible — ±10 % of hue and a strata band under the facets' own lightness;
the second raised the split to ±15 % and let the facet normal rule, and the knolls stopped
being putty. The dress and the water went in one pass, the path's edge and the pebbles in a
short third. No errors in any frame.

**M624** (things to take) went in three passes at the organics deposit of the test terrain,
by day, by night and worked down to three: the deposit as a boulder with its ore and spoil,
the drill as a pose, a tool, a beam with a flare and chips, footprints as bodies, labels in
window pixels, the lens glide (§2.37–§2.40). No errors in any frame. The headless stand
draws two frames after a snippet, so an eased value never settles on its own: the near lens
is pre-set in the snippet (`PLN.glide=1`, `dep.py`), and the live step was checked by its
number (K 1.6 → 1.87 after one frame of 83 ms, as the ease says).

**M625** (fauna) went in three passes on the beast stand (`beast.py`: one archetype in eleven
slots — five walk frames, the man for scale, the sixth walk frame and the four poses;
`eval-beasts.js` answers with the books, the records, the nearest beasts and the far lane's
numbers) and in the game frame at 3300 by day and by night: the five earthly anatomies on one
leg law, the book of poses, the aliens' poses, the far herd and flock, fur lit at the
material. The first frames read black — not the fur (Ракваара is [.43,.35,.20]) but the
backlit key with a hard terminator; the fix went into the shader, not into the palette. The
far lane is empty in the natural frame about six tenths of the time by design; the stand
forces it. No errors in any frame.

**M626** (weather) went in two passes in the game frame at 3300 under a fixed weather
(`weather.py <x> <phase> <kind> <power>` writes the snippet next to the shots; `eval-wx.js`
answers with the kind, the power, the look's cover and fog, the cards' counts and the wet):
the seven kinds by day and by night, the downpour with its bolt, the blizzard, the dust
storm, spores on the crystal world, ash on the volcanic one; the eleven worlds for seven of
them. The first law drew cards in metres and they came out an order too big; the law in
pixels fixed every size at once. The sheets were the long debt of the pass: three builds
of guessing, then the measurement (§2.49) showed them on screen and invisible by colour.
The cost of the pass on the PC at 1600 × 900: 0.07 ms of a 6.2 ms frame. No errors in any
frame.

**M627** (landmarks) went in three passes in the game frame on each kind's own world
(`mark.py <kind> [type|-] [phase] [off] [near]` writes the snippet, trying seeds until the
terrain holds the kind — `genPOI` is called by the landing mode only, so the snippet calls
it; `eval-marks.js` answers with the bodies, their heights and mounds, the man and the
lens): the twelve kinds by day front-lit and by night, the far lens, the battery on ice
and desert. The first build hid the temple and the factory behind the crest of the walk
line, so the base went up to the crest and a mound of the world's stone fills the gap
(up to 26 m on a rough terran). The first scale made the wreck a 74 m hull across the
frame; the size law is per kind now. The cost with the factory in view: 3.85 ms on the PC
against 5.45 ms with the old sticker (the sticker is 1.7 ms of the 2D front pass; the
bodies add .03 ms to the scene).

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
- M622: the literal parts of a body (caps, ears, pods) take no jitter from the record, so
  the giants of a jungle wear one colour; the carpet is low in tall grass away from its
  clearing; the far silhouettes of tall species are small at 125–175 m; fiddleheads and
  gills are not read at the far lens; the herbs' tint is by species index, not by how
  common the species is;
- M623: the path is still a band of two tones, not a shape of its own; pebbles read only at
  the near lens or on the phone; the pond's far shore meets the grass in a hard edge at the
  grazing angle; a knoll's facets are the grid's own triangles; stone has no lichen and no
  cracks;
- M624: the boulder of a deposit sinks into a slope (its base is set at the ground of the
  deposit's x, the slope is not read); the chips are one colour; footprints are faint at
  the far lens; by day the beam is pale; the dust puffs under the feet are still 2D
  ellipses; the dust at the touch of a landing is still a debt; «finds» on the surface are
  the landmarks' inspection (M627);
- M625: bodies are smooth, no fur at the silhouette; the bird's folded wing is a patch on
  the flank; a lying beast is a lump; the crystal's poses barely differ; the far herd
  drifts relative to the camera on a cycle, not across the world; a flock only drifts, it
  does not wheel;
- M626: the fog banks are even bars of mist, not torn wisps; the dust veils are faint;
  the near banks at the hero's feet hide behind the ridge most of the time; the flakes of
  the near plane read as bokeh discs; the embers are small; the day flash is sharp; the
  far rain curtains are five even stripes under the cloud; the drops do not splash on the
  ground or on the water; the sky events of the plan (auroras, meteors, the giant's storms)
  are not drawn;
- M627: the factory's sawtooth wedges and the wreck's halves read as loaves; crystals are
  pale on ice; the obelisk's belt and notch are weak; the anomaly's shards are chunky; the
  game's cave often stands on the landmark's pad and hides it (rocky, desert and ice
  battery, crystals, monolith); the elevator's beacons stand above the near lens's frame;
  people's bodies vanish at night beyond their lamps; the temple's steps hide behind the
  crest; the mound reaches 26 m on rough worlds and reads as a hill of its own; the
  ancients' day lamps add nothing visible; there is no far sign of a landmark beyond the
  frame's edge; the «find» at a landmark keeps the game's old flow;
- the base, the home and the settlement are stickers of the old painters (M628–M629);
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
  line; the day crescent hides behind the
  cumulus; the giant's bands are subtle; the stars at the totality of an eclipse are faint
  and the shadow of the moon is a straight band in depth.

**Not looked at yet**: the crags, the ring and the algae by night and in the mirror; dust
on a dry world; the eleven worlds by night and in weather (only the methane night was
shot); the tints of scanned plants; beasts in motion; whether a crag can hide the
label of a deposit.

**No tests.** Nothing in `tests/` names the new modules: they come with M651. The crag
placement keeps its measures apart from the GPU (`K.ledge[v].top/rx/rz/low`, `F.crags`),
so a suite of the Node tier can check that no body in front rises over the line and no
body hangs over the slope.

**M634** (one water everywhere) moved the stand's water into its own module,
`src/21pw-pln-water.js`: the surface (`waterSurf`: two ripple layers along the signed wind,
calm patches that grow with distance, a swell of three crests 3, 5.5 and 8 m whose resolved
part bends the normal and whose lost part turns into roughness, drip rings), the look
(`waterLook`: shallows, Fresnel that roughness lowers at grazing, the mirror, an anisotropic
glitter that stretches into a path, the wet edge and its thread), the mirror pass
(`plnWaterMirror`), the pipeline and the meshes (the valley sheet, the pond, the sea). The
planet (`PLN_WGSL_WATER`) and the cave (`PLN_WGSL_WATER_CAVE`) each keep only an entry point
on that core; `fs_water` exists nowhere else (`tests/91qi-water.js`). An ocean world
(`far.shape === "isles"`) lays the sea in three bands to 30 km; isles rise through it where
the far land tops the level, and the open sea's floor sinks ten metres so the body is dark
there. `wxSpare.w` is the swell (1 at sea, .15 on a lake, scaled by the wind). By night the
water mirrors the horizon, which is bright and even: what keeps it from a flat sheet is the
roughness reflecting higher, darker sky (up to 70 % by night), mist that lies in banks past
60 m and air over open water a little clearer by night up to 1.5 km. The sun's path never
enters the lens by itself — the sun's law keeps the light behind the scene and to one side —
so it is shot with the stand hook `PLN.sunAim`; `PLN.noMirror` empties the mirror for the
mirror-share gate. The gate is `docs/look/game/water.py` (spread of value across the water
band, mirror share, the path and its control): lake .329 / .090 and sea .212 / .082 by day /
night, mirror .68–.97, path .40 against .05 without the aim. The cave lake runs the same
module but lies 2–7 m under the walk line in the seeds tried, so from the walk it shows as a
dark strip; that is the designer's fork.
