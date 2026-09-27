# The planet, reinvented — the key frames

The briefs of the key frames of stage 0 and what came of each. The plan, the style and the
laws are in [`DESIGN-planet.md`](DESIGN-planet.md); section numbers below point there.

## M601, the cave

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

**What came of it** (pass 7). The frame holds what the brief asked for, and three things the
brief did not foresee:

- **The far lane had to be invented.** A gallery in section has no distance of its own: behind
  the man there was a wall. Now an arch opens behind him into a far chamber with a second
  shaft of day and a great stack of caps in its beam — the cave's own far sign.
- **The cut face became a subject.** The brief treated it as the dark wing; in the frame it
  takes a third of the area, so it is drawn as a page of the earth: strata, a swimmer's
  bones, a shell, roots from the surface, an ore vein under the lake, soil on top, and the
  crawl with its amber seen whole.
- **The lamp alone could not be the hero.** One spot with a hard edge made the man a torch in
  a void. He is the hero by three means together: the pool his lamp carries, the cone seen in
  the air, and the dome of the vault over him.

Against the old frame the man is 8.5 % of the height instead of 2.4 %: the map became a
place. What the map gave — the whole cave at a glance — the frame does not; like the surface
(§8.4), the cave needs its far lens before play is asked to live in it.

## M602, night by the home and the base

**What play gives.** On a planet the player keeps a home and may found a base; by night the
old frame darkens the day: the home is a small sign on the ground line with one lamp, the
ringed giant is a flat dark disc, the interface carries the rest. None of play moves.

**Why the old frame fails.** Nothing says «somebody lives here and I am coming home». The
night is the day with the light taken away: no lamp lights anything, the windows warm
nothing, the giant is not a body.

**The frame chosen.** The place and the broad lens of M600, so the day and the night make a
pair: where the ship stood, people have levelled a yard and live. Left of centre the home
with its lit windows and the porch under a lantern; the man comes home along the path;
across the lake the base on its deck; over the ridge the giant with its rings; the far sign
keeps its place.

**The same laws by night**
- Three lanes: the wing is still the darkest, the far lane is outlines in mist, the play
  lane is dark teal with warm pools.
- One key with real shadows is now two: the giant's cold light lays the long shadows of the
  land, the lantern owns the yard. Every other lamp is a small light without shadows.
- The three makers keep their grammar: nature in caps, people in smooth seamed hulls with
  the orange belt and the only warm light, the far sign in perfect geometry.
- The identity of the world continues: the mauve is on the ridge where the sun went down,
  orange stays with people.

**How it is built on the stand.** A third page, `night.html`, with its own scene, shaders
and renderer. The land, the flora and the far shore are the day's, called as they stand and
planted by the same dice; the night redeclares four functions of the day to cut the yard
and tread the ways. The accepted files of M600 and the committed files of M601 are not
edited. The night's shaders are the day's modules with more added under names of their own:
a block of the night's numbers, the lantern's depth map, a sky with the giant, the light of
lamps and of windows, the air of the yard marched at half resolution with smoke and halos.

**What came of it** (pass 8). The frame holds what the brief asked for, and four things the
brief did not foresee:

- **The hero needed three lights.** The lantern alone lit the ground and left the facade
  black; a low light without a shadow gives the walls what the ground throws back, and the
  lamp on the man's helmet makes him a figure instead of a shadow on the water.
- **The giant had to go down.** High in the sky it was a sticker. Risen from behind the
  ridge, cut by the land, with its night side made of the sky itself, it became far and huge.
- **The man turned round.** Walking away from the door he told nothing; coming home he takes
  the light on his chest and the frame has a story.
- **The tall lens is set by the interface.** The game's own phone frame showed the pads, the
  chips and the buttons of the right edge; the lens was moved until the home, the man, the
  beacon and the giant all stood in what is left.

Against the old frame the home takes 27 % of the height of the broad frame and its windows
are the brightest and warmest spot in it; the wing is the darkest at 0.08 of the display's
range, the lit path stands at 0.3 to 0.4, a window at 0.7 to 0.9.
