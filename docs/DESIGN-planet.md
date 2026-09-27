# The planet, reinvented — design and plan

Branch `planet`, worktree `C:\Claude\drift-planet`. Milestones **M600–M652** are reserved for
this programme (the rest of the project was at M513 on 27.09.2026).

## 1. Why

The surface and the cave were drawn for Canvas 2D: flat polygons plus blurred blots, no light
logic, a toy scale, the same composition everywhere. On the WebGPU engine that language reads
as a port, not as a picture. The author, 27.09.2026:

- the surface and the cave «look disgusting — fine for canvas 2D, not on the new engine»;
- «a bit of 3D»; the planet is a separate, important place with many events, it must be cool;
- references that landed: **Planet of Lana** and **Cocoon** (Erwin Kho);
- **«we will not redraw what exists into the new look. We reinvent.»**
- **«at last we unify the visual style on the planet.»**

So nothing old is carried over as a picture. Every family below is designed again from its
purpose in play. What does not move: rules of play, physics, world generation, the save format,
names and texts. A thing keeps its place, footprint and meaning; it gets a new body.

## 2. What is on the planet (the cast)

| Group | Members |
|---|---|
| Ways in | cave, mine, base in cross-section, home, settlement behind its wall |
| Landmarks | twelve POI: wreck, temple, space elevator, crystals, accelerator ring, anomaly, monolith, factory, gate, observatory, the Long March notch, dead battery — 150…900 tall against a man of 17 |
| Things to take | deposits under the drill, finds, artifacts, amber in caves, the far goods that are dug or drilled, a sample from a stunned beast |
| Life | twelve plant forms, two or three dominant per world; ten beast silhouettes, the hostile rodent; everything is scanned into the register |
| Own | ship on its gear, base, home with fence and lit window, greenhouse, battery, pennant, tracks |
| Other people's | the settlement you feed and bring people to, its wall, signs of other players, the stone that remembers, «Жестянка» |
| Sky and weather | dust storm, blizzard, ash with embers, rain and fog, acid drizzle; day and night; eclipse with corona; the meadow seen only in an eclipse; the world that ends on schedule |
| Moves | walk, jump, jetpack for 2.5 s, lamp; cave pockets reached only by jetpack |
| Worlds | eleven types: rocky, desert, ice, terran, toxic, volcanic, ocean, crystal, jungle, metal, ruin |

Conclusion: the planet is **a stage with a cast, not a landscape**. One frame may hold the man,
a way in, a landmark, beasts, a building, weather and a prompt. The ground therefore keeps
quiet, and every law below is about how an actor stands in the frame.

## 3. The style — «Сцена»

One set of laws for everything on the planet, above and below ground.

1. **Form.** Every thing is a body with a clear silhouette made of a few large shapes. Detail is
   placed in clusters where an actor stands, never sprayed. No conventional textures: form,
   layered colour, light and air do the work.
2. **Three makers, three grammars.** Nature: faceted or softly swollen, matte, in the palette of
   the world. People (own and other): smooth, engineered, Soviet industrial forms, the only
   source of warm light. The ancients: perfect geometry, their own light, a colour the world's
   palette does not have.
3. **Colour.** Each world type has one dominant hue family and one opposing accent, and one
   shape identity. Life takes its colour from the world; the ancients argue with it. Values sit
   in four bands: dark wing, mid play lane, light distance, bright sky. Hues are mixed round
   the wheel — a green world is not a green frame.
4. **Light.** One key (the star) with real shadows, a sky fill, warm lamps of people, emissive
   things with bloom. At night and underground the lamp is the key. Light never passes through
   stone. One hero per frame gets the light; the rest stands in air.
5. **Air.** Haze by depth with a colour ramp, shafts through clouds and crowns, weather as
   particles lit by the sun and the lamps. The far sinks into the colour of the sky.
6. **Staging.** Three lanes: the dark wing in front, the play lane, the far lane with a
   landmark. Two camera distances: far on the move, near when the man stops at a thing. The walk
   line is a crest, so the man stands against air, not against ground of the same colour.
7. **Events in three beats.** A sign in the distance, the meeting up close, the trace left
   after. Beasts, weather fronts, settlements and landmarks all announce themselves first.
8. **Ways in without a cut.** Cave: the camera pushes into the rock. Base and home: the wall
   melts and the cross-section opens. Mine: a vertical pan.
9. **Motion.** Wind runs through grass, crowns, cloth and dust; beasts walk with a procedural
   gait; nothing blinks.
10. **Words.** A prompt hangs on its thing. Nothing sits in the centre of the frame.

## 4. The kit — how a thing is built

One kit for every family, so that the style cannot drift:

- **Bodies**: procedural meshes from a small set of generators (loft, blob, facet, ribbon,
  lathe), coloured by layered vertex colour. Seeded, so a planet always meets you the same.
- **Cards**: thin and numerous things (grass, leaves, distant herds, rain) are shader-drawn
  cards — lit by the same key, shadowed by the same map, sunk in the same air.
- **Light**: one shadow map for the key, analytic sky fill, up to a few warm lamps, blob
  occlusion at the feet of things.
- **Air**: height fog with a ramp, shafts marched through the shadow map at half resolution,
  lit particles.
- **Post**: bloom, grade, grain, dither — the engine's own (`18d-postfx`).
- **The man**: a rig with the six suit slots as parts. The same rig rendered to a card can
  later replace the painter in the modes outside the planet, so the law «one astronaut
  everywhere» survives.

New code lives in **new modules** and runs behind a switch until the hand-over. Old painters
are not edited, so the fleet session's port of the old surface and this work never meet in one
file.

**Not to be touched by this programme** while other sessions work there: the sky of the fleet
(`src/19*`, `11ak-skywatch`, `27la-road-sky`) and the nebula (`16gay`, `16gb`). The planet's
own sky is built in the new modules and meets the old one only at the hand-over (M652).

## 5. The method — how one element goes through

1. **Purpose**: what the player does with the thing and what it must say from afar and up close.
2. **References** and two or three silhouette ideas; self-critique; one is chosen.
3. **Key frame** on the stand (`docs/look/`), three passes: draft, self-critique, tightening.
4. **The author's verdict**: yes, no, or edits. Nothing is built in the engine before a yes.
5. **Build** in `src/` with the kit.
6. **The pair** «was | now» of the whole frame at 760 and 390 wide, by day and by night.
   While the look lives on the stand, «was» is the game's frame and «now» is the stand's: the
   stand carries no interface, the game's frame does — say so under every such pair.
7. **Phone**: the S23 frame budget holds.
8. Accepted — the element is struck from the queue.

## 6. The bar — what «at the level» means

A frame is shown to the author only if it passes all of these:

- **Squint**: at 96 px wide the hero and the three lanes still read.
- **Silhouette**: every actor filled with black is still recognised.
- **Values**: four bands, each lane inside its own.
- **One hero**: the brightest, sharpest, most saturated spot is the hero; three accents at most.
- **No flat fill, no spray**: texture only where a cluster was placed.
- **Beside the references**: put next to frames of Planet of Lana and Cocoon at the same size,
  it does not lose in composition, light and air. The author is the judge.
- **Motion**: an eight-frame strip shows wind and gait, and nothing blinks.

## 7. Stages and gates

**Stage 0 — the look (stand).** Gate: the author says «yes, like this».
- M600 key frame: the surface by day, terran — man, ship, grove, beasts, a landmark far away
- M601 key frame: the cave
- M602 key frame: night by the home and the base — lamps, windows, the sky
- M603 the style frozen: palettes, value bands, sizes, written into §3 with numbers

**Stage 1 — the stage in the engine.** Gate: a real planet is walked in the new look.
- M610 lit bodies in the engine: depth, the key with its shadow map, sky fill, fog, vertex colour
- M611 the ground: the ribbon from the real profile, lanes, far ridges, two camera distances
- M612 sky and air: sky, clouds, shafts, haze, the real day and night, hooks for the eclipse
- M613 the three-world test: terran, desert, ice on one sheet — the style must hold on bare worlds
- M614 the phone gate for the foundation

**Stage 2 — the cast.** Each by the method of §5.
- M620 the man: rig, six suit slots, lamp, jetpack
- M621 the ship on its gear and the descent
- M622 flora: twelve forms as a kit, the genome of a world
- M623 stone and ground dress, water
- M624 things to take: deposits, finds, drill, tracks
- M625 fauna: ten silhouettes, gait, the hostile pose, far-then-near
- M626 weather and sky events
- M627 landmarks: the twelve POI
- M628 own things: base above ground, home and fence, greenhouse, battery, pennant
- M629 other people's things: settlement and wall, signs, the stone, «Жестянка»

**Stage 3 — underground and inside.**
- M630 the cave: rock, lamp light, water, moss and amber, props, life; the way in without a cut
- M631 the mine
- M632 the base in cross-section and the rooms entered from the planet

**Stage 4 — the worlds.**
- M640 eleven identities: colour script and shape per type; acceptance by contact sheet —
  every type by day, by night and in its weather

**Stage 5 — the hand-over.**
- M650 words on the planet: prompts on their things
- M651 tests, detectors and golden frames for the new planet
- M652 old painters removed, release

## 8. Decisions that are the author's

1. **How it ships.** Recommended: a vertical slice — terran surface with its cave goes out when
   stages 1–3 are complete for it, then the worlds follow type by type. The alternative is one
   release at the end of stage 4. Until then the old look, ported by the fleet session, lives on.
2. **The man outside the planet.** Recommended: the new rig replaces the painter in the other
   modes after M620, rendered to a card.
3. **What may move in play** if a new body asks for it (a footprint, a height, a camera
   distance). Default: nothing moves without a question.
4. **The camera distance.** The key frame M600 is shot with the **near** lens: the man is about
   8 % of the frame's height and the frame holds some 38 m of the walk line. The old frame
   keeps him near 2 % and shows several times more land. §3.6 asks for two distances — near
   at a thing, far on the move — and the far one has to show about as much land as the game
   does today, or play changes (what is seen coming, how far a landmark announces itself).
   The far lens is not drawn yet. Default until the author decides: play keeps its reach; the
   near lens is used only when the man stands.
5. **Two lenses for one world.** A broad one for 16:9 and a tall one for the phone (§11.7).
   The tall lens shows 12 m of the lane instead of 38 and gives the height to the sky and the
   far sign. The ship does not fit beside the man in it. Recommended: accept, the phone frame
   is composed as a portrait, not as a cut from the broad one.
6. **The man's suit.** On the stand the man wears orange with a white helmet and pack: orange
   is the colour of people (the ship's stripe, markers) and holds against grass, water and sky
   in light and in shade. The six suit slots must keep that read. The author decides whether
   the astronaut changes colour.

## 9. Risks

- **Size.** About forty elements. Each stage ends in something that can be looked at, and the
  author can stop or turn the work at any gate.
- **Phone.** Shadow map, shafts and a second pass for water are paid on the S23. Each has a
  cheaper form; M614 measures before the cast is built.
- **Procedural taste.** A generator makes a thousand things, some ugly. Acceptance is by contact
  sheet across seeds, not by one lucky frame.
- **Eleven worlds.** A style tuned on a green world may fail on a bare one — hence M613 early.
- **Tests and golden frames** of the old planet go red at the hand-over by design; M651 replaces
  them, not patches them.

## 10. References

Planet of Lana (hand-painted worlds on 3D forms, shadow planes, the dark wing); Cocoon (clean
forms, layered vertex colour, one colour and one shape per world, thick lit fog); INSIDE (fog
and silhouettes, cheap volumetric light, blue-noise dither); FAR: Lone Sails (camera distance
by speed, landmarks that announce places, the cutaway home); Kentucky Route Zero (theatre
scenography, walls that open); Journey (the mountain always in sight); No Man's Sky (palette of
the planet bleeds into its life; rules instead of chance; drones that land and photograph);
Rain World (beasts that live without the player); Kingdom (the state of a settlement read from
its look); Firewatch (colour script, fog by a ramp); Ghibli backgrounds (large soft passages
first, few details last).

## 11. Laws found on the stand

Three passes of M600 turned the ten laws of §3 into things that can be checked in a frame.
Each line below was paid for by a frame that failed without it.

**11.1 Staging**
- The play lane is **raked like a stage**: it rises away from the lens, so the path, the
  flowers and the feet of things are seen from above and the man stands on a crest.
- A **valley opens through every flat towards the far sign**; nothing tall stands in it. The
  sign is found by the eye along the valley, not by luck.
- Trees stand in **groves with air between them**, never in a row along the horizon.
- The world is laid out from a **fixed point**, not from the camera, so a change of lens
  does not move a mountain.

**11.2 Colour**
- **Orange belongs to people and to ore.** Nothing in nature wears it.
- This world's accent is **mauve blossom**: one grove at the mouth of the valley and drifts of
  heather. Far shrubs are quiet greens; blossom stays in its grove.
- Flowers lie in **drifts of one colour** with bare grass between; a drift has a few strays
  of the neighbouring colour and no more.
- The air is **bluer and darker than the sky at the horizon**, so far land sinks into it and
  does not glow.

**11.3 Form**
- The repeated shape of this world is the **cap**: a dome with a flat underside. Crowns are
  built of caps in **three tiers with shade between them**; far shrubs are single caps.
- Near the lens a smooth cap among blades of grass reads as a pillow: shrubs of the near lane
  are **rosettes of blades**.
- Stone on the far flats is **cut in facets**; a mountain carries **ribs running down from
  the crest**; snow caps the peak and holds only where the slope lets it.
- A far waterline is drawn in **bays and spits**; reeds stand in **a few clumps** with open
  water between them.

**11.4 Light**
- **Planes part by light.** A shadow band is designed into the hollow behind the far shore
  and onto the foot of the hills; crests stand in the sun. Without it the flats merge into
  one green.
- A heap of cloud is lit **as one body**, its lobes second.
- A crown's top takes the sun, its underside keeps the shade, light comes through only along
  the rim. A trunk is drawn by its lit rim and by the light the grass throws back.
- The near shade has **the outline of crowns** and lets the sun through in dapples.
- A doorway glows as a room does: brighter and warmer at the floor, darker at the jambs.

**11.5 The wing**
- The wing is **the darkest thing in the frame**: dark banks with grass in the bottom
  corners, slightly out of focus.
- No thin stems, no single leaves, no bough across the top: out of focus they turn into
  smears. No pale stone under the grass: it shows the feet of the tufts as a flight of steps.
- The wing takes no shadow map: a few metres from the lens one texel is a palm wide.

**11.6 Life**
- Beasts of the far lane stand **in light against the shadow band**, in a loose group of
  three, all walking one way.
- A flock in the sky is a handful of strokes near the sign, never a scatter over the frame.

**11.7 The two lenses**

| | broad (16:9) | tall (phone) |
|---|---|---|
| eye, from the walk line | 50 m, 8 m up | 30 m, 7.2 m up |
| lens | 24° | 46° |
| horizon, from the bottom | 0.585 of the height | about 0.45 |
| walk line, from the bottom | 0.28 | about 0.22 |
| the man | 8 % of the height | 7 % |
| lane in the frame | 38 m | 12 m |

Between them the camera is blended by the aspect of the frame (0.6 … 1.5). The tall lens
looks up: the far sign and the sky take the upper half, high clouds are placed for it.

## 12. The stand

`docs/look/` is a page that draws one key frame on WebGPU with none of the game in it. It is
a sketchbook: nothing in `src/` reads it, and it is thrown away at the hand-over.

| File | What is inside |
|---|---|
| `planet.html` | the page; opens from disk, no server |
| `pl-math.js` | vectors, matrices, noise, colour |
| `pl-kit.js` | the mesh and its generators: blob, tube, loft, quad |
| `pl-ground.js` | the lenses, the palette, the land by lanes, grass and flowers |
| `pl-cast.js` | trees, stone, rosettes, the ship, the man, beasts, the far sign, the wing, the scene |
| `pl-wgsl.js` | shaders: sky and clouds, light of the scene, water, shafts, bloom, the grade |
| `pl-render.js` | passes and targets |
| `lookshot.py` | shoots the page in its own headless Chrome on the real GPU |

```bash
python docs/look/lookshot.py --out C:/tmp/m600.png --ss 2
python docs/look/lookshot.py --out C:/tmp/m600-phone.png --w 390 --h 844 --dpr 2 --ss 1.5
python docs/look/lookshot.py --out C:/tmp/wing.png --q "off=scene"
```

`--q "off=…"` switches parts off to judge the rest: `wing`, `water`, `shafts`, `bloom`,
`scene` (a grey card instead of the world, the wing alone). `--t` is the moment in seconds.
The shooter waits for the page's title: `LOOK_DONE`, `LOOK_DONE_ERR` (drawn, with shader or
GPU messages) or `LOOK_FAIL`. Frames are written outside the repository — pictures do not
go into git.

The old frame for a pair is taken from the game itself, in clear weather:

```bash
python docs/shot.py surface --js "G.land.p.wx={kind:null};" --out C:/tmp/old.png --w 1600 --h 900
```

## 13. State on 27.09.2026

**Done**
- The concept and this plan.
- The stand and its shooter.
- M600, three passes, in both lenses; the pairs «was | now» at 760 and at 390.
- **M600 is accepted.** The author on pass 3, 27.09.2026: «да, делай так, мне нравится».
  The frames he accepted show the two lenses and the orange suit, so §8.5 and §8.6 are taken
  as accepted with them unless he says otherwise. §8.1–§8.4 stay open.

**Not done**
- M600 with the **far lens** (§8.4), by night, and in weather.
- M601 the cave, M602 night by the home and the base, M603 the numbers.
- Nothing is built in `src/`; the frame budget is not measured on the S23.

**M601 is thought through and not drawn** — the brief is §14.

**Known weak spots of M600, pass 3** — to be fixed in the elements' own passes, not hidden:
- far shore and hills are smooth: at distance they read as plasticine, they want the brush;
- near stones are grey low-poly lumps, the same stone everywhere;
- the ship and the small beast by the path are stand-ins: a toy hull, a beast on pegs;
- big clouds are still heaps of balls; high streaks in the tall frame read as scratches;
- the stand has no interface: on the phone the lower fifth of the frame lies under the
  controls, which is where the wing and the path are;
- the tall frame does not hold the ship.

## 14. M601, the cave — the brief (not drawn yet)

**What play gives** (`src/22-mode-cave`, `22a`, `22b`; none of it moves). A field of rock and
void in cross-section, about 230 m by 160 m against a man of 1.8 m. The mouth is a shaft from
the surface; the upper gallery runs right, 3 to 5.5 m high; two shafts lead down, each with a
rope and a stake; the lower gallery runs back to the find; dead ends hold bones, a crate or
nothing; pockets are reached only by jetpack. Halls in order: a plain gallery first, then
dripstone, ore, the lake, and the crystal grotto last. Amber is the one warm spot. Few things
glow: darkness is the material.

**Why the old frame fails.** It reads as a map: a thin lit band in a flat dark field, no
depth, the lamp a flat wedge.

**The frame chosen** (of three: the hall beyond, the mouth, the lake). The upper gallery just
past the mouth, near lens. Far left, the daylight beam falls down the mouth onto rubble where
surface plants still grow. Left of centre, the man with his lamp, walking right. Before him a
shaft down with the rope. Right, the gallery opens into a hall with columns standing in a still
lake. Far right and deep, crystals glow and the lake repeats them. The hero is the man's warm
pool of light; the beam is cooler and weaker; the crystals are the small saturated accent.

**The same laws underground**
- Three lanes: the **cut face** of the rock is the wing and the darkest band; the play lane is
  what the lamp lights; the far lane is halls in haze.
- The floor is raked: it rises towards the back wall, the ceiling falls, so both are seen.
- Void must read against rock everywhere: the cut face takes no ambient and carries a dim lip
  along the outline; unlit void is dark blue and lightens with depth.
- The shape of rock underground is the **layer**: strata with ledges, the same lines drawn on
  the cut face. Dripstone is the soft maker's hand: pale, smooth, wet.
- The world's identity continues: caps (stalagmites as stacks of caps, fungi), the mauve
  accent in the crystals, orange for the man, his lamp and amber.
- Light: the lamp is the key, with real shadows and a cone seen in the air; the beam at the
  mouth comes through the rock by a shadow map; a few small lights without shadows.

**How to build it on the stand.** A separate page `cave.html` with its own scene, shaders and
renderer, sharing `pl-math.js`, `pl-kit.js` and the man from `pl-cast.js`; the accepted M600
files are not edited. Rock is one density function (gallery, hall, shafts, a side passage,
strata as displacement) meshed by surface nets on a grid laid in the frustum of the lens, the
front layer closed to make the cut face. Two shadow maps: the lamp in perspective, the beam
from above. Light in the air is marched through both at half resolution. The lake is a mirror
with its section drawn on the cut plane.
