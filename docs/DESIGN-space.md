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
- Moons (M701) are the same ball: rocky, a grey ramp `GOR_MOON`, no air (`gpuOrbMoon`).
- Building lights keep their places from `gplCities` (wet mask off); the shader drops those that
  fall into its own sea (`landAt`).

### Open

- M702 cost on the S23 (A/B/A with `?orb=0`). This desktop: a planet filling a 1200×900 frame
  (r 360 px) costs .26 (crystal) to .88 ms (ocean) — `docs/look/space/shoot.py --q bench=60&only=ocean&cols=1`.
  Already cheaper: the octave loop breaks once an octave is under a pixel, and detail follows the
  CSS pixel, not the device one (DPR 3 skips about one octave).
- M703 gas giants: more, irregular belts; cloud tint stays neutral under warm stars.
- Golden frames that show planets will need `-Accept` on the release machine.

## Ships in flight (M710) — full 3D

The author chose full 3D over sprite relief (06.10). Module `src/17c2a-hull3d.js`, hooked into
`hullGpuDraw` (17c2) in place of the `gpuLitSprite` body; `?h3d=0` / `H3D.on=false` brings the sprite back.
The studio (`GPU.rt`) and pirates/barges/fleet still use their sprites.

| Law | Decision |
|---|---|
| Geometry | A real mesh from `hullOf`: body lofted through the profile stations (tip from `poly[0]`), superellipse section, belly .55 of the back; wings as plates at mid-height (x-wing pairs splay ±.16), nacelle and nozzle barrels, pods, cargo, bridge, canopy bubble, drill cone, boom, radiator plates, deck greebles as bevelled boxes |
| Maker grammar | `H3D_MK`: section squareness, back height, gloss per maker — Ordnung boxy (3.6), High-Front a flat drop (2, .46), Company glossy |
| Paint | The existing body bake (17c2 `hullGpuBake`), projected from above: livery, panels, wear, scars, seals, maker marks stay in the 03e brushes and nowhere else. Side walls blend to the part's own colour by the object normal; where the bake is empty the part's colour |
| Nothing lost | Everything painted but given no volume (masts, struts, hooks, frames) lives on a paint plane at mid-height, cut out by the bake's alpha through `sample_mask` (manual alpha-to-coverage, colour alpha stays 1) |
| Light | Star at height `H3D_LZ` .48, fill .30 (darker towards the belly), key 1.6; Blinn sheen by maker gloss and the material's metal mask; glass from the material; own lights (windows) from the emissive mask ×`RL_EM` |
| Shadow | The body as a field (stations + superellipse in the uniform): parts march 6 steps toward the star and fall into the body's shadow; parts touching the body darken (contact) |
| Other light | Scene lights (08b light texture) at .25, as the sprite took .2; flame light only back-and-sideways and capped at .16 of the flame colour — uncapped, Mamont's long flame bleached the whole hull |
| Composition | Own ×4 MSAA layer (one of `H3D_L`=4 array layers per frame, 512²), its own submit before the frame encoder — the scene pass is never broken — then one `gpuImage` with the "hull" blend (hull mask kept). More than four hulls in a frame fall back to sprites |
| Warm | `h3d.hull` in `GPU_PIPE_ONE` and the key table (also `pipe:gor|over` for M700) |

Open:
- **M711** S23 cost (A/B/A with `?h3d=0`), together with M702: one 512² ×4 layer per ship, clear + resolve.
- **M712** the dish as a real dish; nose cap reads white on haulers (bridge + tip); bank .8 legibility.
- **M713** allies/escorts beyond four per frame — a smaller layer per far hull instead of the sprite.

## The interface (M720) — not started
