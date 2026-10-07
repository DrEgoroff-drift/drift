# Shooting the game's frame in the new look

The stand one folder up draws key frames with none of the game in it. These tools shoot
the **game** with the new look switched on (`PLN.on`), through `docs/shot.py`: a headless
Chrome of their own on the real GPU. They came out of M611 and are thrown away with the
stand at the hand-over.

Frames are pictures and never enter git. They are written to the folder of frames:
`PLN_SHOTS` if it is set, else `<temp>/drift-planet-shots`. Scene snippets and the text of
every shot lie there too.

| File | What it does |
|---|---|
| `gshot.py` | one shot: `js=` a scene snippet, `eval=` a question to the page, `out=` the picture |
| `at.py` | writes a snippet for the test planet: the man at x, his facing, the hour, the ring |
| `world.py` | writes a snippet that lands on another type of world, another terrain |
| `pic.py` | `crop` (the box in fractions), `pair` «было / стало», `pix` (colour of a patch), `strip` (a sheet of frames) |
| `hours.py` | shoots x through the hours (default eight of them) and joins the frames into a sheet |
| `withmoon.py` | the test planet with a moon borrowed from the gas giant, its phase set (0 new, .5 full) |
| `eclipse.py` | the same moon set so that its eclipse runs at a given point (−1 start, 0 middle, 1 end) |
| `moonland.py` | lands on a moon of the first gas giant: the parent in the sky |
| `weather.py` | the test planet under a fixed kind and power of weather |
| `sheet.py` | a contact sheet of the eleven worlds shot with one prefix: `<prefix>_<type>.png` → `<prefix>_sheet.png` |
| `diff.py` | what changed between two frames: the share of moved pixels, their box, an 8 × 4 grid of shares, a mask |
| `cost.py` | the cost of a frame by the real clock: `[type] [sizes] [q=JS] [tag=]`, sizes `pc 2k 4k s23 phone tab`; the GPU passes, the engine, the CPU, the first frame, what was built. The stand steps the page's clock by hand, so the game's own `ms` read 0 under it — this one hooks the real clock |
| `eval-cost.js` | the question of `cost.py`: the GPU passes, the CPU by the real clock, the stats, the tier |
| `eval-frame.js` | the default question: errors, counts, the man, the lens, the light, the bodies of the sky, the weather |
| `eval-sys.js` | the system: planets, moons, their angular size and phase |
| `eval-crags.js` | the crags placed near the man, the measures of the kit, the steep steps of the line |
| `dep.py` | a snippet at the deposit nearest to x: the man short of it with a trail of footprints; `[phase] [act] [left] [glide]` — the drill held, a worked deposit, the near lens pre-set (the stand draws two frames after a snippet, an eased value never settles) |
| `eval-things.js` | the question of things: the deposits near the man, mining, tracks, «at a thing», the lens and its glide, the nearest plant |
| `beast.py` | writes a stand snippet of one beast archetype in eleven slots (`<archetype> [hour] [young]`; archetypes capsule long stout upright segmented jelly strider crystal manta shell, suffix `.hop` for a hopper or `.N` for a leg count): five walk frames, the man for scale, the sixth walk frame, stand, graze, hostile, stun; the near lens pre-set when the row fits |
| `eval-beasts.js` | the question of beasts: on/bad/err, the books and records, the man, the lens, the species list, the nearest sixteen beasts with their pose, the far lane's numbers (`PLN.stat.beasts.dbg`) |
| `pose.py` | the man in a given pose, cropped out: `<name>:ph=;amp=;air=;jet=;vy=;raise=;swim=;hour=;near=;face=;where=;crop=;scale=` — the state is frozen through getters, the near lens is on by default |
| `ship.py` | writes a pad snippet with a synthetic hull of a given form and class (`<form> [class] [colour] [hour]`; forms swept/delta/xwing/twin/slab/boxed/disc/trident), so the planet's ship (21phb) can be looked at across the fleet; shoot it with `pose.py base=g_ship_<form>_<class>.js` |
| `descent.py` | writes a snippet that holds the landing still at a height: `<name>:alt=;dx=;a=;gear=;thr=;touched=;flow=;hour=;t=;n=` — the descent frame of 21pza; `flow=N` switches to the surface after N frames, shoot it with `until=window.__FLOW` |
| `herb.py` | lines the twelve plant forms up along the walk line: `<name>:forms=;ages=;gap=;x=;near=;hour=;seed=;wet=;walk=` — one species per form, the row's species become the planet's for the frame; shoot with `dpr=3` (the plant's pixel size comes from the device ratio) |
| `where.py` | where the frames go |

```bash
python docs/look/game/at.py 4600 1 .125
python docs/look/game/gshot.py js=g_at_4600_125.js out=crag.png
python docs/look/game/world.py rocky 1 7900
python docs/look/game/gshot.py js=g_w_rocky_1_7900.js eval=eval-crags.js out=rocky.png
python docs/look/game/pic.py pair old.png crag.png pair.png --a "было" --b "стало"
python docs/look/game/gshot.py js=g_at_4600_125.js out=tall.png w=390 h=844 dpr=2
python docs/look/game/hours.py h1 3300
python docs/look/game/weather.py 3300 .125 rain .8
python docs/look/game/world.py toxic 1 lake .125
python docs/look/game/gshot.py js=g_w_toxic_1_lake.js out=w_toxic.png tail=1500
python docs/look/game/sheet.py w 3 960
python docs/look/game/diff.py w_toxic.png w2_toxic.png mask.png
python docs/look/game/cost.py terran pc,4k,s23 q="G.opts.gfx.pln='low'" tag=low
python docs/look/game/gshot.py js=g_wx_rain_8_125.js out=rain.png
python docs/look/game/eclipse.py 3300 .25 0
python docs/look/game/gshot.py js=g_ec_3300_25_0.js out=totality.png
python docs/look/game/world.py terran 1 pad .30
python docs/look/game/pose.py "walk:ph=2.1;amp=1" "jet:air=1;jet=1;vy=-.6;raise=1.4" "night:hour=.8" "far:near=0;dpr=1"
python docs/look/game/ship.py delta warship && python docs/look/game/pose.py "f_delta:base=g_ship_delta_warship.js;near=1;dpr=1;face=-1;crop=.02,.30,.62,.80;scale=1"
python docs/look/game/pic.py strip states.png pose_walk_crop.png pose_jet_crop.png pose_night_crop.png --w 300 --cols 3 --t "шаг,ранец,ночь"
```

Hours are the phase of `celSun`: .125 the key frame, .25 noon, .5 sunset, .75 midnight, 0
sunrise. A shot is about eight seconds; shoot one after another. `pic.py pix` gives the
mean colour of a patch: ask the frame in numbers before trusting the eye.

What to know:

- a shot takes about 7.5 s; shots run one after another, never two at once (one port);
- `seed=` does not change the planet: the test planet is «Нейэль I», terran; its ship
  stands at x = 3048, the cave at 7928, the lake at 8202–8442, the mine spot near 4600;
- the hour is the phase of `celSun`: .125 is the key frame of M600, .25 noon, .5 sunset,
  .75 midnight, 0 sunrise;
- `PLN.rush` plants the whole frame at once, so the first frame is already full;
- a shot is clean when the answer holds `errs: 0`, `crash: false`, `errors: []` and an
  empty `err`.
