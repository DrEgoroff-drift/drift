# The look-dev stand

`docs/look/` draws the key frames of the planet's new look on WebGPU with none of the game
in it. The plan is [`docs/DESIGN-planet.md`](../DESIGN-planet.md), the numbers of the style
are [`docs/DESIGN-planet-style.md`](../DESIGN-planet-style.md). The stand is a sketchbook:
nothing in `src/` reads it, and it is thrown away at the hand-over.

Three pages, one per key frame. Each opens from disk, no server; the scripts are classic
ones and share one scope, as the game's do.

| Page | Key frame |
|---|---|
| `planet.html` | M600, the surface by day |
| `cave.html` | M601, the cave; builds its rock for some eight seconds |
| `night.html` | M602, the night by the home and the base; builds in three seconds |

The world is left-handed: x runs along the walk line, y is up, z goes away from the lens.
Units are metres; the man is 1.8 m.

## Files

| File | What is inside |
|---|---|
| `pl-math.js` | vectors, matrices, noise, colour |
| `pl-kit.js` | the mesh and its generators: blob, tube, loft, quad |
| `pl-ground.js` | the lenses, the palette, the land by flats, grass and flowers |
| `pl-cast.js` | trees, stone, rosettes, the ship, the man, beasts, the far sign, the wing, the scene |
| `pl-wgsl.js` | shaders: sky and clouds, light of the scene, water, shafts, bloom, the grade |
| `pl-render.js` | passes and targets |
| `cv-rock.js` | the rock: one density function, strata, the paint of stone, surface nets in the frustum of the lens, the cut face |
| `cv-scene.js` | the cave's lenses and lights; dripstone, veils, crystals, amber, vines, the lake, what lies in the cut face, fish and glow-worms; the scene |
| `cv-wgsl.js` | the cave's shaders: the three lights, the cut face, water, light in the air, halos |
| `cv-render.js` | the cave's passes: two shadow maps, the scene, the air at half resolution, bloom, the grade |
| `nt-home.js` | people's things: the home, the garage, the mast, the base; panes, fixtures, cloth; the lights they give |
| `nt-scene.js` | the yard cut into the day's land, the trodden ways, the tall lens, the directions of the sky, fireflies; the scene |
| `nt-wgsl.js` | the night's shaders: the sky with the giant and its rings, the lantern, the light of windows, the room behind a pane, the air of the yard, smoke, halos |
| `nt-render.js` | the night's passes: three shadow maps (two along the giant's light, one for the lantern), the mirror, the scene, the wing, the air at half resolution, bloom, the grade |
| `lookshot.py` | shoots a page in its own headless Chrome on the real GPU |
| `measure.py` | measures a frame: value by lanes, colour by families of hue |
| `lanes.json` | the boxes of the lanes for the six frames of the style sheet |

The cave shares `pl-math.js`, `pl-kit.js`, the constants of `pl-ground.js` and the man of
`pl-cast.js`. The night calls the day's land, flora and far shore as they stand.

## Shooting

Frames are pictures: they are written outside the repository and never go into git.

```bash
python docs/look/lookshot.py --out C:/tmp/frames/m600-broad.png --ss 2
python docs/look/lookshot.py --out C:/tmp/frames/m600-tall.png --w 390 --h 844 --dpr 2 --ss 1.5
python docs/look/lookshot.py --page cave.html --out C:/tmp/frames/m601-broad.png --ss 2 --budget 150
python docs/look/lookshot.py --page cave.html --out C:/tmp/frames/m601-tall.png --w 390 --h 844 --dpr 2 --ss 1.5 --budget 150
python docs/look/lookshot.py --page night.html --out C:/tmp/frames/m602-broad.png --ss 2 --budget 150
python docs/look/lookshot.py --page night.html --out C:/tmp/frames/m602-tall.png --w 390 --h 844 --dpr 2 --ss 1.5 --budget 150
```

A broad frame comes out 1600 × 900, a tall one 780 × 1688. `--ss` is the supersampling,
`--t` the moment in seconds, `--q` the page's query, `--port` the port of the shooter's
Chrome (give two shots that run at once different ports). The shooter waits for the page's
title: `LOOK_DONE`, `LOOK_DONE_ERR` (drawn, with shader or GPU messages) or `LOOK_FAIL`, and
prints the path with what the page said about itself.

The stand is deterministic: the same command gives the same picture to the last digit of
every measurement.

The old frame for a pair «was | now» is taken from the game itself:

```bash
python docs/shot.py surface --js "G.land.p.wx={kind:null};" --out C:/tmp/old.png --w 1600 --h 900
python docs/shot.py cave --out C:/tmp/old-cave.png --w 1600 --h 900
```

The old night wants a home of the last tier and a base founded on the spot; a script gives
them to `docs/shot.py night` through `--js`.

## Switches and knobs

`--q "off=a,b"` switches parts off to judge the rest; a knob is `name=number` in the same
query.

```bash
python docs/look/lookshot.py --out C:/tmp/wing.png --q "off=scene"
python docs/look/lookshot.py --page cave.html --out C:/tmp/lamp.png --budget 150 --q "off=wing&lamp=1.3&airl=2"
python docs/look/lookshot.py --page night.html --out C:/tmp/lamps.png --budget 150 --q "off=wing,smoke&key=.2&lamp=.5"
```

| Page | Parts for `off=` | Knobs |
|---|---|---|
| `planet.html` | `wing`, `water`, `shafts`, `bloom`, `scene` (a grey card instead of the world, the wing alone) | — |
| `cave.html` | `wing`, `water`, `air`, `bloom`, `cut`, `ink`, `cast`, `man` | multipliers of 1: `exp`, `amb`, `fogc`, `fog`, `day`, `lamp`, `air`, `airl`, `aird`, `airg` |
| `night.html` | `scene`, `wing`, `water`, `bloom`, `air`, `haze`, `smoke`, `halos`, `stars`, `lamp`, `windows`, `points`, `mist` | plain numbers, below |

The night's knobs, the default in brackets. Light: `key` (.14), `lamp` (.37), `win` (.5),
`pts` (.6), `halo` (.6), `manlamp` (1.2), `amb` (1), `ncol` (.45), `wingk` (.15), `grow`
(.15), `exp` (1), `bloom` (.14). Air: `haze` (.014), `mist` (.016), `smoke` (.7), `drift`
(1), `gair` (.28). Sky: `stars` (1), `band` (.05), `after` (1), `mauve` (1), `teal` (1),
`hcl` (0), `glight` (.5), `rlight` (.42); the giant `gaz`, `gel`, `gr`, its sun `selong`,
`spa`, its rings `rtilt`, `ropen`, `rside`. Staging: `manx` (−4.7), `basex` (29.5), `strx`
(21), `yr0`, `yr1`, and the tall lens `tx`, `te`, `tz`, `ty`.

## Measuring

The style sheet is kept by numbers, and the numbers are taken by one tool. Value is the
display luma (Rec.709 weights on the sRGB values, 0 to 1); colour is OKLCH. Boxes are
fractions of the frame, y from the top.

```bash
python docs/look/measure.py lanes docs/look/lanes.json --dir C:/tmp/frames
python docs/look/measure.py lanes docs/look/lanes.json --dir C:/tmp/frames m602 --boxes
python docs/look/measure.py hues C:/tmp/frames/m600-broad.png C:/tmp/frames/m602-broad.png
python docs/look/measure.py family C:/tmp/frames/m600-broad.png .385 .62 .425 .73 20 75
python docs/look/measure.py rows C:/tmp/frames/m600-broad.png .5 .6 .3 1 9
python docs/look/measure.py lightest C:/tmp/frames/m602-broad.png
python docs/look/measure.py motion C:/tmp/frames/m600-broad.png C:/tmp/frames/m600-broad-t43.png
```

- `lanes` reads the frames named in `lanes.json` from `--dir` and prints, for the whole
  frame, its percentiles, how much of it lies in each of the four bands of value and its two
  ends (the darkest and the lightest pixels); for every lane, the luma at the 10th, the 50th
  and the 90th percentile, the mean colour and its chroma and hue; then the families of the
  frame, as `family` prints them. `--boxes` writes `<key>-boxes.png` beside the frame, lanes
  in yellow and families in cyan: look at it before a number is believed, a box that slid
  off its lane measures something else.
- `hues` says how much of the frame each family of hue takes, how much of that is strong,
  how far its chroma goes and how much of the frame is grey.
- `family` counts the pixels of one family of hue inside a box: the orange of people, the
  mauve of the world. The example is the man's suit by day.
- `rows` prints the luma of a strip row by row: the profile from the feet to the mountains
  shows where a band of light or of shade lies, and no box has to be laid for it.
- `lightest` says where the lightest thousandth of the frame lies and what colour it has:
  whose the frame is.
- `motion` compares two moments of one frame, pixel by pixel and squinted to 96 px wide.
  The second moment is the same command of the shooter with `--t 4.3`, 0.6 s after the
  moment of the sheet.

`lanes.json` is laid by hand and is the source of the numbers in the style sheet. A lane is
a list of boxes `[x0, y0, x1, y1]`; a family is one box, the two ends of its arc of hue in
degrees (the first greater than the second wraps through 0) and the least chroma counted.
When a frame is staged anew its boxes move with it: lay them again and look at the overlay.
What flat of the land a box lies on, and how far from the lens, is asked of the land itself:
a ray from the lens is marched to `groundH` of `pl-ground.js` under Node.
