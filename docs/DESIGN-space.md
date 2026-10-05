# Space redrawn on the engine (M700–M7xx)

The author, 06.10: «сможешь так же перерисовать планеты интерфейс корабли под новый движок?» —
the method of M600 («Сцена»: reinvent, don't port) applied to what the player sees in flight.
Branch `space`, worktree `C:\Claude\drift-space`. M600 and its modules (`21p*`, the planet
branch) are someone else's work and are not touched; their method is borrowed, not their code.

Order: planets from orbit → ships in flight → the interface. Each is a small M600: laws in
numbers, a key frame on a stand (`docs/look/space/`), three passes with written self-critique,
a port into new modules with the old painter kept as a fallback, pairs «было | стало» at 760
and 390 shown to the author in chat.

## Planets from orbit (M700)

Stand: `docs/look/space/planets.html` (shoot with `docs/look/space/shoot.py`). Engine:
`src/17gab-gpu-orb.js`, hooked at the top of `gpuPlanet` (17ga); `?orb=0` or `GOR.on=false`
draws the old textured ball.

### Laws

| Law | Number |
|---|---|
| one large signature form per world, readable at r = 40 px | twelve forms, below |
| colours from the world's own `T.pal`, no textures | ramp through 5–6 stops |
| chroma ceiling (OKLab) for surface and air | .10 surface, .09 air; only the accent glows past it |
| one key light, from the planet's star | z toward the viewer .46 (was .74): the ball has a night |
| exposure of the star on the ball | 1.4 linear, star colour taken half-way to white |
| tone curve on luminance, not per channel | per-channel ACES oversaturated the lit side |
| air is a shell, thicker to the limb, warm at the terminator | thickness .012–.06 radii by world; 0 airless |
| nothing blinks | every octave and stripe fades once its period is under ~2 px |
| one accent per world | volcanic rifts, terran and ruin lights, crystal seams, ice rust |

### The twelve forms

| World | Form from orbit |
|---|---|
| rocky | maria and three scales of craters with rims, Lommel–Seeliger light (flat full disc) |
| metal | the same craters with bright rims, plate seams, specular |
| crystal | tilted facets (Voronoi) with rare pale seams and a faint violet glow |
| ruin | dead continents and dark basins; a city grid on the land with sparse warm lights at night |
| gas | belts and zones with crisp edges, fine stripes, one oval storm; limb darkening |
| jungle | dark canopy continents, savanna edges, heavy long cloud systems |
| ice | white shell, two scales of rust lineae, darker chaos patches |
| toxic | Venus-like haze, soft chevron bands, no surface |
| ocean | deep water, island chains on turquoise shelves, polar caps, glint |
| volcanic | near-black basalt, ash plains, thin glowing rifts and lava lakes, strongest at night |
| terran | warped continents, dry belts at ±30°, ranges, small caps, cities at night, glint |
| desert | dune seas, eroded dark mesas with relief, warm thin air |

### Decisions taken

- **The star is no longer behind the viewer.** 24.09 (Контроль) put the light at z .74 so the
  disc had almost no night; the old city window logic depends on it. M700 lowers it to .46: the
  ball reads as a sphere, and the side away from the star is the night where building lights
  (`gplCities`, unchanged) now actually show. Cost: a quarter of each disc is dark.
- Building lights keep their places from `gplCities` (wet mask off); the shader drops those that
  fall into its own sea (`landAt`).

### Open

- M701 moons through the same shader (now still 17ga `gpuMoon`).
- M702 cost on the S23 (`docs/g11.ps1`, A/B/A with `?orb=0`) and a cheaper tier if needed:
  the surface runs up to ~6-octave fbm with a domain warp per pixel.
- M703 gas giants: more, irregular belts; cloud tint stays neutral under warm stars.
- Golden frames that show planets will need `-Accept` on the release machine.

## Ships in flight (M710) — not started

## The interface (M720) — not started
