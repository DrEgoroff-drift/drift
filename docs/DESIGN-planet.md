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

**In numbers (M603).** The laws above and those of §11 are measured on the three key frames
and written down in [`DESIGN-planet-style.md`](DESIGN-planet-style.md): value by lanes,
colour by depth and by families, sizes in men, the lenses, light and air, motion, and the
twelve checks M651 turns into detectors. Four things the measuring settled:

- The wing is the darkest lane and the sky the lightest, but **by day the play lane and the
  far lane share one band of value** (.60 against .53–.68). They are parted by bands of
  light and shade laid in turn, each lighter with depth, and by colour: from flat to flat
  the hue turns towards the air, some 25° a flat, and the chroma falls to a quarter.
- By night and underground nine tenths of the frame lie under .30; what is lighter is the
  work of a light. The lightest thousandth of a frame tells whose the frame is.
- No neon: chroma passes .22 nowhere, and the strongest colour is the orange of people.
- The man takes .085 of the height of a broad frame in the near lens, and never under .05.

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
4. **The gate.** Until 27.09.2026 it was the author's verdict on every frame: yes, no, or
   edits. That day, after he accepted M600, he lifted it: «кадры не надо со мной согласовывать,
   направление верное, делай все». Since then the gate is mine — the pair of step 6 and a
   written self-critique against the bar of §6, with the weak spots named in §13 — and the
   author is shown the result of a stage, not every frame. His word overrides anything here.
5. **Build** in `src/` with the kit.
6. **The pair** «was | now» of the whole frame at 760 and 390 wide, by day and by night.
   While the look lives on the stand, «was» is the game's frame and «now» is the stand's: the
   stand carries no interface, the game's frame does — say so under every such pair.
7. **Phone**: the S23 frame budget holds.
8. Accepted — the element is struck from the queue.

## 6. The bar — what «at the level» means

A frame passes its gate (§5.4) only if it holds all of these:

- **Squint**: at 96 px wide the hero and the three lanes still read.
- **Silhouette**: every actor filled with black is still recognised.
- **Values**: each lane inside its band, the bands of `DESIGN-planet-style.md` §2.
- **One hero**: the brightest, sharpest, most saturated spot is the hero; three accents at most.
- **No flat fill, no spray**: texture only where a cluster was placed.
- **Beside the references**: put next to frames of Planet of Lana and Cocoon at the same size,
  it does not lose in composition, light and air. The author's eye is the last word; between
  his looks the frame is judged harder than he would judge it.
- **Motion**: a strip of several moments shows wind and gait, and nothing blinks.

## 7. Stages and gates

**Stage 0 — the look (stand).** Gate: the author said «yes, like this» to M600; the frames
after it pass by §5.4.
- M600 key frame: the surface by day, terran — man, ship, grove, beasts, a landmark far away
- M601 key frame: the cave
- M602 key frame: night by the home and the base — lamps, windows, the sky
- M603 the style frozen with numbers: value bands, colour, sizes, light, motion — the sheet
  `DESIGN-planet-style.md`, its summary in §3

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
4. **The camera distance.** The key frame M600 is shot with the **near** lens: the man is
   8.5 % of the frame's height and the frame holds some 38 m of the walk line. The old frame
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
| the man | 8.5 % of the height | 7 % |
| lane in the frame | 38 m | 12 m |

Between them the camera is blended by the aspect of the frame (0.6 … 1.5). The tall lens
looks up: the far sign and the sky take the upper half, high clouds are placed for it.

**11.8 Underground** (M601, seven passes)

Light
- **Three lights, three colours, three places**: the day at the mouth, cool; the man's lamp,
  warm; the crystals of the hall, mauve. Each owns its part of the frame; where two meet,
  one yields.
- **The lamp has a reach.** It dies between 12 and 27 m, so the hall keeps its own light.
- **The lamp carries its own pool**: a small warm light without shadows sits at the lamp, or
  the man walks in a hole of his own making.
- **Far is lighter.** The haze behind the cut is lighter than unlit near stone: a far chamber
  reads as air, not as a pit.
- **The day is held back towards the top of the frame**, or the upper corner outshines the man.
- **Nothing casts a striped shadow on the heap**: no bars across the mouth.
- **In full day stone wears moss**: pale ledges in the beam read as a flight of steps.

Form
- **Dripstone is built of caps**: stacks of caps rise from the floor, bells hang from the
  roof, a column is both with a neck between. Rims are scalloped in round lobes of **at
  least seven ring sides each** — with fewer the rim reads as torn paper.
- **What hangs, hangs in clumps** with bare roof between them; a clump has one long member.
- **The vault is a vault**: a dome over the man, noses at its ends. **Ledges run and die
  away**; a ledge drawn across the whole frame turns the rock into a staircase.
- **Ore is orange and dim**: a tenth to four tenths of its colour. Orange is the colour of
  people's things, and the vein must not call louder than the lamp.

Staging
- **The cut face is a page.** It is the darkest band and dims towards the frame's edges; a
  lip and a wash of light run along the void; things lie in the stone — bones, a shell,
  roots, an ore vein — and earth lies on top.
- **A void that matters lies in the plane of the cut.** A passage behind the cut is not
  seen at all; the crawl with its amber is shown whole, in section.
- **The far lane underground is a window wider than its beam**: an arch behind the man opens
  into a far chamber with its own shaft of day and a great stack of caps as the landmark.
- **The man's head never touches a far line.** A stack, a rim, the edge of an arch stand
  clear of him by a head at least.

Life
- Small lives are lights: glow-worms on the roof in fields like a sky, pale fish behind the
  pane of the water. They drift; they do not blink.

The two lenses underground

| | broad (16:9) | tall (phone) |
|---|---|---|
| eye, from the walk line | 50 m, 3.6 m up | 30 m, 3.6 m up |
| looks at | 3.4 m up | 5.2 m up |
| lens | 24° | 46° |
| frame at the cut | 36 m × 20 m | 10.8 m × 23 m |
| the man | 8.5 % of the height | 7.7 % |
| walk line, from the bottom | 0.34 | 0.29 |

The phone's interface covers the top of the frame (chips) and its bottom quarter (pads):
dark rock belongs there. The tall lens looks up the shafts, the broad one along the gallery.

**11.9 Night and people's things** (M602, eight passes)

Light
- **The night keeps the value of a thing and lets most of its colour go; a lamp gives the
  colour back.** Unlit, a thing keeps 45 % of its colour.
- **The key of the night is the giant**: cold, an eighteenth of the day's sun by luminance,
  from behind and from the left, so a body is drawn by its lit rim. The exposure is the
  day's: the night is dark because its key is weak, not because the frame was dimmed.
- **Warm light is people's**: windows, the lantern of the porch, the lamp on the man's
  helmet. The lantern alone casts shadows; every other lamp is a small light without them.
- **Walls are lit by what the lit ground gives back**: a low, wide light without a shadow
  lies before the porch, or the hero's facade stays black beside its own lantern.
- **A window throws its light out** as a patch with the bars of the frame in it, and the
  patch has an end: it dies between 9 and 16 m.
- **A halo has a short tail**: it falls as 1/(1+s²). With 1/(1+s) a far lamp grows a cloud.
- **No bright lamp at the frame's edge.** The garage's lamp is dimmed for that.
- **The man's lamp is on.** Without it he is a dark figure on dark water; with it the hero
  is found at 96 px.
- **The air of the yard is thin**: it shows the lantern's cone and the shadows of the posts
  in it. Mist lies on the lake and nowhere else.

Sky
- **No orange in the sky.** Where the sun went down the ridge wears the mauve of this world,
  with teal over it.
- **The giant rises from behind the ridge**: the land cuts its lower third, and that makes it
  far and huge. Its night side is the sky itself, a little darker; air lies before it; its
  rings go out in the shadow of the ball, they do not turn black.
- **Stars are steady**: one to a cell of the sky, three sizes, and the air over the land
  puts the faint ones out.
- **No dark blots over stars**: high clouds are off; low banks at the horizon are dark
  bodies with a pale rim.
- **A faint band has no thin threads.** The galaxy is a soft glow with one wide rift, laid
  where the sky is empty, away from the giant; a thread of dust in it reads as a scratch.
- **The far sign catches the sun the land has lost**: high up, its line is lit.

Staging
- **One hero: the home with the man.** The giant, the base and the beacon are the accents;
  the far sign is a silhouette with a few lamps.
- **The man comes home.** He walks towards the lit door, so the light is on his chest and
  the frame tells where he is going.
- **A roof never meets a far line**: beasts, the feet of far trees and the far waterline
  stand clear of the roofs in both lenses. What is clear in one lens may stand on the roof
  in the other — both are checked.
- **A mast's light is seen against the dark hill**, clear of any crown; **a lamp is seen
  against a dark wall**, never against a pale dome.
- **The yard ends before the man**: the bank behind him is narrow and its crest crosses him
  at the waist, not at the head.
- **Small lives in a few clusters**: fireflies in three, by the water and in the near grass.
  They drift and breathe slowly.

People's things
- Hulls are smooth and seamed, with **a belt of orange** along the body. The home: a body,
  a wheelhouse with a band of glass, a porch under the lantern; beside it a vaulted garage
  and a banded lattice mast whose beacon breathes. The base: modules on a deck over the
  shallows, a pier with a lamp, a dome, a mast with a steady red light.
- **A window is a room**: a lamp hangs in it, the wall behind is lit, a curtain is drawn
  half-way, a pot stands on the sill, the jambs are the darkest. It is one card and a
  shader; nothing is built inside.
- **Life is told by small things**: smoke from the flue, washing on a line, a woodpile, a
  bed of cabbages, the small beast waiting on the porch.

The two lenses by night

| | broad (16:9) | tall (phone) |
|---|---|---|
| eye, from the walk line | 50 m, 8 m up | 42 m, 8.4 m up |
| looks at | 6.2 m up | 7.6 m up |
| lens | 24° | 46° |
| horizon, from the bottom | 0.585 | 0.52 |
| the man's feet, from the bottom | 0.27 | 0.32 |
| the man | 8.4 % of the height | 5 % |
| lane in the frame | 38 m | 16.5 m |

The game's old phone frame shows where the interface lies, and the tall lens is set by it.
Besides the top and the bottom, **the right edge carries buttons between 0.22 and 0.40 of
the height**: there nothing that matters stands further right than 0.75 of the width. The
man is at 0.70 and between 0.32 and 0.37 of the height. The day's tall lens (§11.7) keeps
his feet at 0.22, under the pads — a weak spot of M600, named in §13.

## 12. The stand

`docs/look/` draws the key frames on WebGPU with none of the game in it: three pages,
`planet.html` (M600), `cave.html` (M601) and `night.html` (M602), a shooter and a measuring
tool. It is a sketchbook: nothing in `src/` reads it, and it is thrown away at the hand-over.

Its manual is [`docs/look/README.md`](look/README.md): the files, the commands that shoot
the six frames of the style sheet and the old frames for the pairs, the switches and knobs
of every page, and how a frame is measured. Frames are written outside the repository —
pictures do not go into git.

## 13. State on 27.09.2026

**Done**
- The concept and this plan.
- The stand and its shooter.
- M600, three passes, in both lenses; the pairs «was | now» at 760 and at 390.
- **M600 is accepted.** The author on pass 3, 27.09.2026: «да, делай так, мне нравится».
  The frames he accepted show the two lenses and the orange suit, so §8.5 and §8.6 are taken
  as accepted with them unless he says otherwise. §8.1–§8.4 stay open.

- **The gate changed** the same day (§5.4): frames are no longer agreed one by one.
- **M601, the cave**: seven passes, both lenses, the pairs «was | now» at 760 and at 390,
  motion looked at on strips of four moments. Passed by §5.4; the brief and the result are in
  `DESIGN-planet-frames.md`, the laws it paid for are §11.8.

- **M602, night by the home and the base**: eight passes, both lenses, the pairs «was | now»
  at 760 and at 390, motion looked at on strips of four moments. Passed by §5.4; the brief
  and the result are in `DESIGN-planet-frames.md`, the laws it paid for are §11.9.

- **M603, the style in numbers**: the sheet `DESIGN-planet-style.md`, measured on the six
  frames (three key frames, two lenses each) with `docs/look/measure.py` over the boxes of
  `docs/look/lanes.json`; every box was checked against the land by a ray from the lens.
  The measuring corrected the plan in three places: the four bands of value overlap by day
  (§3, «In numbers»), the night's key is an eighteenth of the sun and not a seventh
  (§11.9), the man of the near lens is 8.5 % of the height.

**Not done**
- M600 with the **far lens** (§8.4) and in weather; the cave has no far lens either.
- Nothing is built in `src/`; the frame budget is not measured on the S23, and the frames
  of the cave and of the night are not measured at all.

**Weak spots found by measuring** (M603; the numbers are in §8 of the style sheet):
- M600: the heap of ore by the path is as strong as the suit and five times its size — the
  cave's law «ore is orange and dim» is not applied by day; the man's suit is 63 pixels of
  orange, the hero's colour is carried by the ship;
- M600: the greatest change of the frame in 0.6 s is the wing swaying in a bottom corner,
  away from the hero;
- M601: the moss at the mouth has the greatest chroma of the frame, over the suit's; the
  hall's columns are grey bodies in a mauve room;
- M602: the base holds more of the lightest thousandth of the frame than the home does —
  the accent is lighter than the hero.

**Known weak spots of M602, pass 8** — named, not hidden:
- the roofs of the home are dark on a dark shore: the hero is carried by its windows and
  its lit front, not by its outline;
- in the tall frame the smoke climbs across the lower limb of the giant, where the ridge
  already cuts it;
- the man is the stand-in of M600 with a lamp on his helmet; the lamp is a small even light
  ahead of him, not a cone, and it casts no shadow;
- the base and the garage are first drafts: the dome is a dark ball by night, the garage is
  cut by the edge of the broad frame;
- the striders are dark on dark and read only against the mist; the band of the galaxy is
  hardly seen in the broad frame;
- the tall frame holds neither the base nor the garage, and its upper third is sky with the
  line of the far sign, under the chips;
- the cost is unknown: three shadow maps of 4096², 56 steps of air at half resolution, six
  windows that throw light and up to twelve small lights for every pixel of the yard. Each
  has a cheaper form; M614 measures.

**Known weak spots of M601, pass 7** — named, not hidden:
- the rock over the gallery is still heavy with ledges, and the walls of the mouth step in
  places;
- the columns are plain: no wet sheen, no lines of flow;
- fish and glow-worms are dots, and the fish only drift;
- the man is the stand-in of M600;
- the tall frame holds neither the mouth nor the hall — the man, the arch, the far chamber
  and the shaft above him; its upper fifth is earth and roots, under the chips;
- the wing underground is almost nothing: a bank and two stacks in one corner;
- the cost is unknown: 48 steps of light in the air at half resolution, twelve point lights,
  two shadow maps of 4096². Each has a cheaper form; M614 measures.

**Known weak spots of M600, pass 3** — to be fixed in the elements' own passes, not hidden:
- far shore and hills are smooth: at distance they read as plasticine, they want the brush;
- near stones are grey low-poly lumps, the same stone everywhere;
- the ship and the small beast by the path are stand-ins: a toy hull, a beast on pegs;
- big clouds are still heaps of balls; high streaks in the tall frame read as scratches;
- the stand has no interface: on the phone the lower fifth of the frame lies under the
  controls, which is where the wing and the path are;
- the tall lens keeps the man's feet at 0.22 of the height, under the pads, and it was set
  before the buttons of the right edge were looked at; the night's tall lens (§11.9) is
  the one to take over;
- the tall frame does not hold the ship.

## 14. The key frames

What each key frame was asked to be and what came of it is kept apart, in
[`DESIGN-planet-frames.md`](DESIGN-planet-frames.md): M601 the cave, M602 the night by the
home and the base. The laws the frames paid for stay here, in §11.
