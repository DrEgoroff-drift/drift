# The planet, reinvented — the style in numbers

M603. The ten laws of the style «Сцена» are §3 of [`DESIGN-planet.md`](DESIGN-planet.md); the
laws the key frames paid for are its §11. This sheet gives them numbers, taken from the three
key frames as they stand in the branch: M600 the surface by day (pass 3, accepted by the
author), M601 the cave (pass 7), M602 the night by the home (pass 8). A number here is a
measurement first and a rule second: the rules stand in bold under the tables.

One world is measured, the terran one. Stage 4 (M640) writes the same sheet for the other
ten; what must hold for all of them is marked **every world**.

## 1. How the numbers are taken

- **Value** is the display luma: Rec.709 weights on the sRGB values of the finished picture,
  0 to 1. Black is 0, a lit window is 0.75.
- **Colour** is OKLCH: lightness L, chroma C, hue h in degrees. Grey is C under 0.035;
  strong colour is C over 0.10.
- A lane is measured over boxes laid on the frame by hand; a family of colour is the pixels
  of one range of hue inside a box. Both are listed in `docs/look/lanes.json`. The three
  numbers of a band are the 10th, the 50th and the 90th percentile.
- **Depth** of a box is found by marching a ray from the lens to the land with the stand's
  own land function. Distances are from the lens unless said otherwise; the lens of the
  broad frame stands 50 m from the walk line.
- The tool is `docs/look/measure.py`, the frames are shot by the commands of
  `docs/look/README.md`. One command prints every number of §2 and §3:
  `measure.py lanes docs/look/lanes.json --dir <frames>`. The stand is deterministic: the
  frames shot again from the branch gave the same numbers to the last digit.

In the engine the lanes will be known by depth, not by boxes: the wing is what stands within
20 m of the lens, the play lane lies from there to the near waterline (some 65 m), the far
lane begins at the far shore (150 m and on), the sky is what has no depth. M651 turns the
rules of this sheet into detectors.

## 2. Value

Broad frame, 1600 × 900. An arrow runs from the near end of a lane to its far end.

| Lane | By day | Underground | By night |
|---|---|---|---|
| The wing (underground: the cut face) | .15 .17 .18 | .07 .08 .09 | .09 .09 .10 |
| Play lane out of the light | .23 .46 .65 | .08 .12 .27 | .10 .13 .15 |
| Play lane in the light | .43 .60 .72 | .26 .29 .36 | .26 .37 .50 |
| Water | .43 .47 .54 | .16 .18 .21 | .16 .17 .21 |
| Far lane | .48 .53 .61 → .54 .68 .79 | .18 .20 .25 | .14 .14 .15 → .14 .17 .18 |
| Sky, zenith → horizon | .61 .63 .68 → .80 .81 .82 | — | .17 .18 .19 → .19 .24 .26 |
| Whole frame (5th, 50th, 95th) | .18 .54 .82 | .07 .12 .35 | .09 .16 .28 |
| The ends: darkest pixel, 99.9th percentile, lightest pixel | .13 .94 .96 | .07 .77 .95 | .09 .80 .97 |

What stands behind each cell. By day the lane out of the light is grass in the dappled shade
of the near tree (the slope at the foot of the frame lies deeper in it, .24 .29 .35), the
lane in the light is grass in the sun, the far lane runs from the face of the far shore to
the ridge; clouds are .68–.92. Underground the lane out of the light is the wall of the
gallery, the lane in the light is the floor in the lamp, the far lane is the chamber behind
the arch; the hall in its own light stands at .20 .29 .36. By night the lane in the light
is the grass in the lantern; a window is .70 .75 .79, the limb of the giant .37 .44 .51.

How much of the frame lies in each band of value:

| Share of the frame | under .12 | .12 – .30 | .30 – .60 | over .60 |
|---|---|---|---|---|
| By day | 0 | .20 | .39 | .41 |
| Underground | .53 | .39 | .08 | .01 |
| By night | .28 | .68 | .04 | .01 |

The tall frames keep the bands of the broad ones within .05, but for two. The day's zenith
is .55 against .63: the tall lens looks higher, where the sky is deeper. The day's near
slope is .37 against .29: the tall lens stands closer and sees less of the near shade.

**Rules, every world**

1. **The wing is the darkest lane.** Its median is under .20 by day and under .10
   underground and by night, and its 90th percentile lies under the median of every other
   lane.
2. **By day light answers light and shade answers shade, each lighter with depth.** Bands
   of light: the lane in the sun .60, the crest of the far shore .62, the hills .63, the
   ridge .68, the horizon .81. Bands of shade between them: the wing .17, the near slope
   .29, the water under the far shore .47, the plain in the shadow band .53. By night there
   is one cold light, so the land only rises, .11 → .13 → .14 → .17 (the mountain, a
   silhouette against the afterglow, .15), and all of it lies under the sky (.18–.24):
   land is a silhouette. Underground far is lighter: the cut face
   .08, the unlit wall .12, the far chamber .20.
3. **By day value alone does not part the play lane from the far shore**: .60 against .53
   to .62. They are parted by colour (§3.1) and by the bands of shade laid between them. A
   frame that parts them by value only has lost its air.
4. **By night and underground the dark is one narrow band and light is rare.** Under .30
   lies .96 of the frame by night and .92 underground; what is over .30 is the work of a
   light.
5. **The lightest thousandth of the frame belongs to the hero and to the lights.** By day
   two thirds of it is the hull of the ship in the sun and a quarter the lit side of the
   clouds. Underground it is what the man's lamp lights, the great stack in its shaft of
   day and the moss at the mouth. By night it is windows and lamps.
6. **Nothing is black and nothing burns out**: no pixel under .06, none over .97. In the
   six frames the darkest pixel is .066 (the cave's tall frame), the lightest .967.

## 3. Colour

### 3.1 Hue turns with depth, chroma falls

By day, the land from the foot of the frame to the sky:

| Where | From the lens | Value | Hue | Chroma | Display colour |
|---|---|---|---|---|---|
| The wing | 14–16 m | .17 | 193° | .028 | `#192f2f` |
| The near slope, in the near shade | 38–42 m | .29 | 164° | .067 | `#245842` |
| Grass in the sun, play lane | 44–50 m | .60 | 123° | .117 | `#87a14b` |
| The path | 50 m | .55 | 94° | .074 | `#92834e` |
| Water by the near bank: it mirrors the sky | 115–122 m | .59 | 238° | .046 | `#7c9bb0` |
| Water under the far shore: it mirrors the shore | 128–149 m | .47 | 189° | .058 | `#4f8681` |
| The far shore, its face | 163–179 m | .53 | 146° | .077 | `#6a956d` |
| The far shore, its crest in the sun | 180–188 m | .62 | 138° | .093 | `#80ab72` |
| The plain behind it, in the shadow band | 270–360 m | .53 | 172° | .050 | `#679183` |
| Hills and the floor of the valley | from 360 m | .63 | 199° | .040 | `#789d9e` |
| The ridge and the ranges behind it | 1–11 km | .68 | 221° | .027 | `#97adb5` |
| The mountain | 3.1–3.7 km | .65 | 266° | .028 | `#a1a9bb` |
| Sky at the horizon | — | .81 | 252° | .030 | `#c2d1e3` |
| Sky at the zenith | — | .63, tall frame .55 | 257° | .09, tall frame .12 | `#81a7dc`, `#5993d9` |

**Rule, every world: from flat to flat the hue of the land turns one way, towards the
colour of the air — here from yellow-green to blue, some 25° a flat — and the chroma
falls.** The far shore keeps two thirds of the chroma of the play lane, the plain behind it
under a half, the ridge a quarter. A lit crest is some 10° warmer than the shaded face of
the same flat. The air is bluer and darker than the sky at the horizon, so the land sinks
into it and does not glow.

### 3.2 The budget of colour

| Share of the frame | By day | Underground | By night |
|---|---|---|---|
| Grey (C under .035) | .26 broad, .17 tall | .72 broad, .85 tall | .41 broad, .38 tall |
| Strong (C over .10) | .10 broad, .33 tall | .010 broad, .002 tall | .012 broad, .019 tall |
| 95th percentile of chroma | .12 broad, .13 tall | .06 | .06 |
| Greatest chroma in the frame | .20 | .21 | .21 |

By day the strong colour is grass in the sun (.08 of the frame) and, in the tall frame,
the zenith (.22). Underground it is the crystals (.005) and the moss at the mouth (.004). By
night all of it is warm: lit walls, the door, the path and the grass in the lantern.

The greatest chroma by whose colour it is:

| Whose | By day | Underground | By night |
|---|---|---|---|
| The orange of people | .20 | .19 | .21 |
| Grass, crowns, moss | .17 | .21 — the moss at the mouth, in the day | .13 |
| Flowers and blossom; crystals | .17 | .20 | .13 |
| The sky; the blue of the night | .11 broad, .13 tall | — | .06, single pixels to .10 |

**Rules, every world**

1. **No neon: chroma passes .22 nowhere.** The orange of people may reach .21; grass and
   flowers keep under .18, the sky by day under .13, the blue of the night under .07.
2. **Underground three quarters of the frame are grey**; colour lives in the three lights
   and nowhere else.
3. **By night nothing cold is strong.** The blue of the night is C .04–.06; every strong
   pixel is warm and is the work of somebody's lamp.

### 3.3 The families

| Family | Hue | Chroma | Share of the frame | Whose |
|---|---|---|---|---|
| Orange | 42°–66° | .08–.19 | .002 by day, .001 underground, .006 by night | people: the suit, the belt of a hull, a door; ore |
| Warm light | 56°–82° | .09–.12 | .04–.06 by night, a quarter of it strong | lamps of people and what they light |
| Mauve | 298°–316° | .05–.16 | .002 by day, .014 underground, .026 by night (the ridge, C .06) | this world's accent: blossom, heather, crystals, the afterglow |
| Green | 117°–146° | .08–.13 | .26 by day | the body of this world |

- **Orange belongs to people and to ore**, every world. The suit is authored `#ee7326` and
  reaches the display as `#cb7951` in the sun, `#d3773c` in the lamp underground, `#8f5622`
  by night. Underground ore is dim, chroma .07, as the law of the cave says; by day it is
  not yet (§8).
- **The accent takes a hundredth of the frame or less by day**: one grove in blossom and
  drifts of heather, .002 together. Underground it is the light of the hall.
- **The hero owns the warm end**: by day and by night the greatest chroma of the frame is
  the orange of people.

### 3.4 The palette as authored (terran)

Colours of the bodies before light and air, as they are written in the stand.

| Maker | What | Colours |
|---|---|---|
| Nature | grass by depth | `#93a94f` lit, `#5c8a47`, `#3b7560` cool, `#c4a659` dry, `#5d7f35` moss |
| | far flats | `#2f5f52` forest, `#6b9558` glade, `#8aa880` plain |
| | accents of the ground | `#b56a8e` heather, `#7d70ad` clover |
| | soil | `#b08a5e`, `#7a5a40`, `#4a4f3c` mud |
| | stone | `#b3aa98` warm, `#8a8d9a` cool, `#5d6378` crag, `#8a7f78`, `#f2f4f8` snow |
| | crowns, top and underside | `#9cc04a` `#2f5f45` · `#bfc04e` `#4a6a3a` · `#6fb58a` `#24514f` · blossom `#cf8fb0` `#5a4466` |
| | far shrubs | `#86a850` `#33594a` · `#a9ab5a` `#4a6044` |
| | bark, reeds | `#a88c6c` `#5c4a3c` · `#2f5040` `#8fa05a`, dry `#c9b870` |
| | beasts | `#b98a5a` `#d9c39a`, legs `#5c4a3a` · small `#c9b07a` `#efe2b8`, mark `#d05a8a` |
| | the wing | `#1c2620` `#26402c` `#123a30` `#2f6a3e` `#10261e`, straw `#5f6a3a` |
| | ore | `#c8743a` to `#f0a860` |
| | rock underground | `#77736e` `#a19c90` lime, `#4f4a4a` shale, `#a0683c` rust, `#8f8672` sand |
| | dripstone, moss, deep water | `#e6dfcf` `#aaa090` · `#3f7a62`, in the sun `#6f9440` · `#16383a` |
| | the cut face and what lies in it | `#06080c` `#0a0e15` `#111822` · bone `#333d4b` `#222a35` |
| | crystals | `#6a3a9a` to `#e2a0e6` |
| People | the orange | `#ee7326` suit and stripe, `#e8702a` belt, `#d9541e` door |
| | hulls and panels | `#d9d5c8` `#ddd6c2` `#cdc6b0`, white `#efe9dc`, seams `#55534c` |
| | roofs and steel | `#8f959e` `#646a73` · `#9aa0a8` `#7d828a` · legs `#4b4e54`, underside `#2a2c30` |
| | glass, timber, cloth | `#0d1820` · `#b08a5e` `#6e543a`, cut `#e0c08c` · `#f0ece0` `#86b4bc` |
| | second colours | `#3f6f78` teal door, `#b5532a` rust |
| The ancients | the far sign | `#e6e2d6` `#8f96a6`; its own colour is not chosen yet (M627) |

Lights, as ratios of red, green and blue: the lantern 1 : .60 : .27, a room behind a window
1 : .56 : .22, a cold work lamp 1 : .80 : .55, the man's lamp underground 1 : .78 : .49, the
beacon 1 : .38 : .10, a red marker 1 : .16 : .06. **Warm light is people's, every world.**

### 3.5 The sky

| | By day | By night |
|---|---|---|
| Zenith | `#81a7dc` (tall frame `#5993d9`) | `#1f2f4d` |
| Horizon | `#c2d1e3` | `#2b3f5c` |
| Where the sun went down | — | `#3d2c4e` on the ridge, h 306° |
| Clouds | .68–.92, C under .03 | off; low banks only |
| The second body | the day moon, pale | the giant: limb `#746f74` at .37–.51, night side `#253352`, the sky's own colour a little darker |

## 4. Size

### 4.1 The man is the measure

He is 1.8 m. Everything on the play lane is said in men.

| Thing | Metres | Men |
|---|---|---|
| Grass on the lane; on the near slope | 0.2–0.4; 0.4–0.95 | under a quarter; to a half |
| A straw head, a flower spike | 0.5–0.7 | a third |
| The small beast | 0.9 | a half |
| A stone of the lane; a pebble | 0.5–1.6 across; 0.15–0.35 | |
| A rosette of blades | 0.9–1.7 across | |
| Reeds | 1.2–2.7 | to one and a half |
| A door; a window | 1.0 × 2.0; 1.0 × 1.0, sill at 1.9 | 1.1 |
| The garage | 5 wide, 3.3 high, 5.6 long | 1.8 |
| The ship | 9 long, 3.2 across, 4.5 to the fin, on legs of 1.3 | 2.5 |
| A strider | 5.7 to the head | 3.2 |
| The home | 7.6 × 3.4, eaves 3.4, the wheelhouse 6.6 | 3.7 |
| The mast; the near tree | 11.5; 11.5 with a crown of 12.4 across | 6.4 |
| Trees of a grove | 8–15, crown 0.5–0.62 of the height in radius | 4.5–8 |
| The base | a deck 19.5 × 7.2 on stilts 2.2 over the water, walls 2.9 | |

**Rule, every world: on the play lane nothing of nature is taller than seven men and
nothing of people's is taller than the tree beside it.** What is greater stands in the far
lane and is measured in the frame, not in men.

### 4.2 The land

Where each flat lies and where the broad lens shows it. The lens stands 50 m from the walk
line and 8 m up.

| Flat | From the walk line | In the broad frame, from the bottom |
|---|---|---|
| The near slope, raked towards the lens | from 16 m before it | 0 to .28 |
| The walk line | 0 | .28–.30, as the ground rolls |
| Water, 3.2 m under the zero of the land | 12 to 105 m; the bank hides it up to 45–58 m | .31 to .41 |
| The far shore: its face, its crest | 102 to 138 m | .41 to .52 |
| The plain behind it, in the shadow band | 215 to 310 m | .52 to .57 |
| Hills | 310 to 420 m | .57 to .59 |
| The ridge | 0.9 to 1.2 km | .59 to .64 |
| The massif and its peak, 300–430 m high | 2.9 to 4.3 km | .64 to .72, the peak .84 |
| Two far ranges | 7 and 11 km | .60 in the valley, paler |
| The far sign, 14 km high | 16 km | out through the top |

The horizon lies at .585. The wing stands 14 to 16 m from the lens, in the bottom corners:
a quarter of the width on each side, up to .15 of the height.

### 4.3 The lenses

| | Day, broad | Day, tall | Cave, broad | Cave, tall | Night, broad | Night, tall |
|---|---|---|---|---|---|---|
| Eye from the walk line, m | 50 | 30 | 50 | 30 | 50 | 42 |
| Eye above the zero of the land, m | 8 | 7.2 | 3.6 | 3.6 | 8 | 8.4 |
| Lens | 24° | 46° | 24° | 46° | 24° | 46° |
| Frame at the walk line, m | 38 × 21 | 12 × 25 | 36 × 20 | 10.8 × 23 | 38 × 21 | 16.5 × 36 |
| The man, of the height | .085 | .070 | .085 | .077 | .085 | .050 |
| His feet, from the bottom | .28 | .22 | .34 | .29 | .27 | .32 |
| Pixels to a metre | 42 at 900 high | 33 at 844 | 42 | 36 | 42 | 24 |

**Rules, every world**

1. **Near lens: the man takes .085 of the height of a broad frame** — 76 px of 900 — and
   not less than .05 of a tall one, 42 px on a phone 844 px high. Smaller, and the suit
   stops being read.
2. **The hero building takes a quarter of the height** (the home: .27).
3. **Far lens: the man takes .042 of the height of a broad frame and .028 of a tall one**,
   as the game shows him today (one scale for the surface, the cave and the mine). It is
   the near lens pulled back to twice the distance; its numbers are §9.

### 4.4 The phone

The game's own phone frame, 390 × 844, shows what the interface covers:

| Part of the frame, from the bottom | What lies there |
|---|---|
| 0 to .15 | pads and the ether line |
| .22 to .40, right of .75 of the width | buttons of the right edge |
| .90 to 1 | chips and hints |

**Rule, every world: in the tall frame what matters stands between .15 and .90 of the
height, and between .22 and .40 it keeps left of .75 of the width.** The night's tall lens
is set so (the man at .70 of the width, feet at .32), and so are both tall lenses of the
far page (§9); the day's own is not (feet at .22).

## 5. Light and air

| | By day | Underground | By night |
|---|---|---|---|
| The key | the sun, 25° high, 52° to the left of the view and beyond the scene: bodies are drawn by a lit rim | the man's lamp: a cone of 32° to 58°, failing from 12 m, gone at 27 m | the giant, from behind and from the left |
| Its strength, red green blue | 1.55 1.42 1.18 | 4 3.1 1.95 at the lamp | .049 .084 .14 — an eighteenth of the sun by luminance |
| The fill | sky .22 .30 .45 from above, grass .16 .18 .09 from below | the day at the mouth 1.3 1.42 1.4; crystals in the hall | .010 .017 .032 |
| Shadows | two maps of 4096² along the sun; clouds dim the land to .34 | two maps | two maps along the giant's light, one for the lantern |
| Shade laid by hand | the shadow band: the sun is cut to .38 on the plain 190–345 m behind the walk line, and to .50 at 1.25–3 km | the cut face dims towards the edges of the frame | — |
| Light laid by hand | a pool of sun round the hero: no cloud shades him within 12 m, the pool ends at 26 m | the lamp carries a small warm light of its own | a low, wide light before the porch: what the lit ground gives back to the walls |
| Other lamps | the doorway of the ship, reach 7.5 m | twelve small lights | the lantern, reach 16 m; windows, their patches die between 9 and 16 m; small lights without shadows |
| Unlit colour | whole | whole | 45 % of it is kept |
| Air | thickens as distance to the power .71, half way at 1.2 km, never over .92; thins with height | fog .022, light in the air marched in 48 steps | haze .014 in the yard, mist .016 on the lake, smoke; 56 steps |
| Bloom, vignette, grain | .085, .42, .012 | .10, .36, .012 | .14, .42, .012 |
| Tone | the neutral curve (shoulder from .76), then gamma 2.2 | the same | the same |

**Rules, every world**

1. **One key casts shadows; by night the lantern is the second one that does.** Every other
   lamp is a small light without them.
2. **A lamp has a reach and an end**: it fails from half of its reach and is gone at the
   whole of it. A halo falls as 1 / (1 + s²).
3. **The exposure does not move** between day, cave and night: the night is dark because
   its key is an eighteenth of the sun, not because the frame was dimmed.

## 6. Motion

| What moves | Period | How far |
|---|---|---|
| A gust | 9 s | the sway grows from a half to one and a half |
| The sway of grass and crowns | 3.7 s by day, 4.8 s by night and underground | a blade 0.4 m high moves its tip by 0.1 m; a crown by 0.1–0.2 m at its rim |
| The flutter on top of it | 2.0–2.3 s | a quarter of the sway |
| The beacon of the mast | 4.8 s | falls to 40 % and comes back |
| Small lights: fireflies, glow-worms | 3.6–7.4 s, each its own | the same |
| Smoke, mist, water, fish | drift | — |

Between two moments 0.6 s apart (`measure.py motion`, the frames shot with `--t 3.7` and
`--t 4.3`):

| | By day | Underground | By night |
|---|---|---|---|
| Mean change pixel by pixel, of 255 | 4.4 | 0.8 | 1.7 |
| Pixels changed by more than 24 | .043 | .001 | .005 |
| At 96 px wide: mean change | 1.0 | 0.15 | 0.4 |
| At 96 px wide: the greatest change | 47, the wing over the lit lane | 7, the lake | 16, the beacon; the grass by the lantern |

**Rules, every world**

1. **Nothing blinks.** No light has a period under 3 s, none goes out altogether, stars
   are steady. At 96 px wide no light changes by more than 16 of 255 in 0.6 s.
2. **The wind is fine-grained.** By day a twentieth of the pixels changes in 0.6 s, and at
   96 px wide the frame changes by 1 of 255: the picture breathes, the squint stands still.
3. **What stands nearer sways less.** The wing is drawn at 141 px to a metre against 42 on
   the lane, so the same sway shows 3.3 times as far in it.

## 7. What a frame is checked against

The list M651 turns into detectors. A frame of the new planet passes when:

1. the wing's median value is under .20 by day and under .10 otherwise, and its 90th
   percentile lies under the median of every other lane (§2.1);
2. by day the bands of light rise with depth and so do the bands of shade; by night the
   land lies under the sky (§2.2);
3. by night and underground at least .90 of the frame lies under .30 (§2.4);
4. the greater part of the lightest thousandth of the frame lies on the hero (§2.5);
5. no pixel is under .06 and none over .97 (§2.6);
6. from flat to flat the hue turns towards the sky's and never back, and beyond the far
   shore the land keeps under half of the chroma of the play lane (§3.1);
7. chroma passes .22 nowhere; grass and flowers keep under .18, the sky under .13 (§3.2);
8. by night no strong pixel is cold; underground at least .70 of the frame is grey (§3.2);
9. orange of chroma over .10 is found on people's things and on ore only (§3.3);
10. the man takes at least .05 of the height of the frame in the near lens (§4.3);
11. in a tall frame the man stands in the band the interface leaves (§4.4);
12. over any 0.6 s, at 96 px wide, the frame changes by less than 2 of 255 on average and
    no light by more than 16 (§6).

## 8. Where the key frames break the sheet

Found by measuring; named, not hidden. Each is fixed in the pass of its element.

- **M600, tall**: the man's feet at .22, inside the band of the buttons' height and close to
  the pads (§4.4). The night's tall lens is the one to take over.
- **M600**: the heap of ore by the path is as strong as the suit (chroma .13 against .11)
  and five times its size in the frame. The law of the cave — ore is orange and dim — is
  not applied by day yet.
- **M600**: in the broad frame the suit is 63 pixels of orange; the orange of the hero is
  carried by the ship (.0016 of the frame). Without the ship the man needs the lit rim.
- **M600**: the greatest change of the frame in 0.6 s is the wing swaying over the lit
  lane, 47 of 255 at 96 px wide, in the corner away from the hero: the wing sways as far as
  the grass of the lane does (§6.3).
- **M601**: the moss at the mouth, in the day, has the greatest chroma of the frame, .21
  against .19 of the suit (§3.2).
- **M601**: the hall's columns stand at .18–.35 with chroma .002 — grey bodies in a mauve
  room; the light of the hall does not colour them.
- **M602**: the base holds .45 of the lightest thousandth of the frame and the home .26:
  the accent is lighter than the hero (§2.5). The windows of the base are paler than the
  home's, `#f6dcb6` against `#ffc990`.
- **M602**: the roofs of the home (.14–.24) are as dark as the far shore behind them (.14–
  .16): the hero has no outline, it is carried by its windows.
- The ancients have no colour of their own yet: on the stand the far sign is pale stone
  with warm lamps.
- **M600, far**: the suit is 14 pixels of orange in the broad frame (26 in the tall one)
  against 63 in the near lens: colour no longer carries the man (§9).
- **M600, far**: the clouds hold .78 of the lightest thousandth of the frame and the hull of
  the ship .22: at a quarter of its near size the hero cannot hold it (§2.5).
- **M600, far**: the way in to the cave is darker than the wing, .18 against .19 (§2.1).

## 9. The far lens

M600 on the move: the page `far.html`, pass 7, measured with the same tool over the boxes
`m600-far` and `m600-far-tall` of `lanes.json`. The world and its light are the day's; the
lens is the near one pulled back along its own line of sight to twice the distance.

| | Far, broad | Far, tall |
|---|---|---|
| Eye from the walk line, m | 100 | 74 |
| Eye above the zero of the land, m | 14.45 | 14.1 |
| Lens | 24° | 46° |
| Frame at the walk line, m | 76 × 43 | 29 × 63 |
| The man, of the height | .042 | .028 |
| His feet, from the bottom | .28 | .32 |
| Horizon, from the bottom | .585 | .52 |
| Pixels to a metre | 21 at 900 high | 13.4 at 844 |

The game's own frames were measured for the pair: the man is .042 of a broad frame and
.028 of a phone's, on the surface and in the cave alike.

Value, broad frame, the near lens beside the far one:

| Lane | Near | Far |
|---|---|---|
| The wing | .15 .17 .18 | .18 .19 .20 |
| The near slope | .24 .29 .35 | .21 .24 .27 |
| Play lane in the light | .43 .60 .72 | .41 .55 .68 |
| The path | .39 .55 .57 | .46 .48 .50 |
| Water under the far shore → by the lane | .43 .47 .54 → .50 .59 .67 | .42 .45 .49 → .52 .55 .60 |
| The far shore: its face; its crest | .48 .53 .61; .58 .62 .67 | .42 .46 .52; .57 .61 .64 |
| The plain in the shadow band | .52 .53 .54 | .48 .49 .51 |
| Hills | .43 .63 .72 | .59 .64 .67 |
| The mountain | .62 .65 .74 | .61 .64 .74 |
| Sky, zenith → horizon | .61 .63 .68 → .80 .81 .82 | .60 .63 .67 → .80 .82 .83 |
| Whole frame (5th, 50th, 95th) | .18 .54 .82 | .20 .53 .82 |
| The ends: darkest pixel, 99.9th percentile, lightest pixel | .13 .94 .96 | .14 .94 .96 |

The knoll of the cave, which only the far lens sees: the face of rock .27 .36 .49, grey-blue
in its own shade (chroma .031); the cap of turf .27 .30 .40; the way in .18.

The tall far frame: whole .19 .53 .79, the wing .18 .19 .24, the near slope .20 .22 .26,
the lane in the light .42 .57 .70, water .43 .51 .59, the crest of the far shore .55 .61
.65, the zenith .48 .50 .58, the horizon .75 .76 .78.

| Share of the frame | under .12 | .12 – .30 | .30 – .60 | over .60 |
|---|---|---|---|---|
| Near | 0 | .20 | .39 | .41 |
| Far | 0 | .27 | .33 | .41 |

Colour. Strong colour takes .044 of the far frame against .101 of the near one: the green
of the lit lane falls from .26 of the frame to .11, the teal of the near slope in its shade
rises from .16 to .30. The accents shrink with the actors:

| Family | Near | Far |
|---|---|---|
| The suit, pixels | 63 | 14 (26 in the tall frame) |
| The orange of the ship, of the frame | .0016 | .0005 |
| Ore, pixels | 321 | 76 |
| Blossom of the grove, pixels | 933 | 735 |
| Heather, pixels | 2085 | 694 |

Motion. Over 0.6 s at 96 px wide the far frame changes by .51 of 255 on average (the near
one by 1.03); the greatest change is 19 (47), in the wing in both.

**Rules, every world**

1. **The far lens keeps the bands of the near one** within .07, lane by lane, and the
   horizon and the walk line keep their places in the frame.
2. **At the far lens the man is read by value, not by colour.** His helmet and pack are the
   lightest thing on the lane around him, and he walks against water or shade.
3. **The wing of the far lens is crowns seen from above**, darkened to .45 of their own
   tint: that keeps its median under .20.
4. **A way in is the darkest thing of its place and never black**: .18 by day.

## 10. The kit as built in the game

What M611 put into `src/`, in the measures of §4.1. The rules behind the numbers are in
`DESIGN-planet-engine.md` §2.12–§2.21.

| Body | Metres | Where it stands |
|---|---|---|
| Umbrella (T) | 8–11.5, crown .5 of the height in radius | alone or in twos, behind the line |
| Column (I) | 9.5–13.5, crown .155 | in twos and threes, 2.1 m apart |
| Tiers (E) | 9–12.5, crown .38 | alone |
| Orb (O) | 6.5–9.5, crown .29 | alone or in twos |
| Fork (Y) | 6–8.5, crown .58 | alone |
| Snag | 5–8, bare | rare, never on the far shore |
| A plant of the game | by its species, three ages | 1.9 to 4.5 m behind the line |
| A deposit | by what is left | 1.7 to 2.5 m behind the line |
| The cave mouth; the headframe of the mine | the opening about 3 × 2.2; the headframe 1.45 times the old painter's | 2.6 and 2.9 m behind the line |
| A beast | its radius; a small one 1.7 times larger | small .5–1 m behind the line, large 1.3–2.8 |
| A crag behind the line | 1.5 to 9, by the rise of its step | sole in the slope, .8 to 8 m behind the line |
| A crag in front of the line | under the line within its footprint | 1.2 to 5.8 m before the line |
| The life ring | .92 across, the tube .3 | at the man's waist, 1 m over his sole |
| The wing | the top 2 to 5 m of a body | 47.5 to 51 m before the line |

**Rule, every world: what stands in front of the walk line is lower than the line where
the lens sees it against the line.** A tree never stands in front; a stone and a crag do,
and they are fitted to the lowest point of the line over their footprint.
