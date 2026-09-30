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
| `eval-frame.js` | the default question: errors, counts, the man, the lens, the light, the bodies of the sky, the weather |
| `eval-sys.js` | the system: planets, moons, their angular size and phase |
| `eval-crags.js` | the crags placed near the man, the measures of the kit, the steep steps of the line |
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
python docs/look/game/gshot.py js=g_wx_rain_8_125.js out=rain.png
python docs/look/game/eclipse.py 3300 .25 0
python docs/look/game/gshot.py js=g_ec_3300_25_0.js out=totality.png
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
