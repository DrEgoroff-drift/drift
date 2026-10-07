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
| Composition | Own ×4 MSAA layer (one of `H3D_L`=4 array layers per frame, 512²), its own submit before the frame encoder — the scene pass is never broken — then one `gpuImage` with the "hull" blend (hull mask kept). A class out of layers steps the hull down to the next smaller class (M713: 512 → 256 → 128, 6/8/16 layers); only then the sprite |
| Warm | `h3d.hull` in `GPU_PIPE_ONE` and the key table; the orb per family `pipe:gor0/3/4/7/8|over`, the rest built async |

Open:
- **M711** S23 cost (A/B/A with `?h3d=0`), together with M702: one 512² ×4 layer per ship, clear + resolve.

## The interface (M720) «Борт»

The author, 06.10: the desktop interface looked bad at 4K — «перепридумай», «игровые панельки, удобные
кнопки, как в ААА», then «приборы сверху плохие … перепридумывай все», no limits, phone included.
The CSS lives in one block at the end of `src/style.css` (from the `M720 «Борт»` marker) and overrides
everything above it.

Laws:
1. **One material — the instrument plate.** Smoky glass (`--pl-bg`), a cut corner (`--pl-cutp`), an edge
   hair, a short glowing role tick on the top edge. Vitals, place, receiver, rail keys, pads and the menu
   are all plates; nothing is a rounded dialog.
2. **One face** — a narrow grotesque (`--face`: Bahnschrift / Roboto Condensed), tabular digits.
   Monospace stays only on the canvas.
3. **Hierarchy by size**: the place name 21, the main numbers 19, captions 10–11 caps with tracking.
4. **A key is drawn on its button** (keycap `kbd`), read live from the key map (`actionKey`/`keyLabel`,
   so a rebind shows at once); hidden on a phone and under a finger.
5. **Corners are addresses**: ship top-left, place and purse top-right, instruments top-centre, tools on
   the right rail, action bottom-right, the receiver bottom-left/centre.
6. **The collapsed instruments are a piece of the rack** (`25c`): the same cream dials under glass,
   amber needles, the misclose window, an `I` keycap — not a separate tape gadget. Opening the rack
   (`I`) hides the pod.
7. **The open rack stands under the top band** (`HUD_BAND`), never behind plates; it is drawn in layout
   pixels with the overlay density times `UIK` (`RACK_K`), so at 4K it is the size the plates are; the
   world's labels and chips are dropped for that frame (`OVL.hush`); `#msg` goes under it (`--rackbot`),
   the prompt rests. A narrow rack (< 640 layout px) stands its gauges in two rows and ends above the rail.
8. **The console's place is measured, not guessed**: left edge, right after the left pads, or centre —
   the first the pad row leaves free (`body.conleft/.conlow`, `--conx`, set in `hudFloorMeasure`);
   only otherwise it lifts over the plates.
9. **The menu** is a plate under the top band at the right edge; `Esc` opens and closes it when nothing
   else wants the key.

Open: the S23 cost of the pod (M702/M711).

### «Сурик» (M721) — the palette

The author, 06.10: «все синее не очень, можно че то акцентное». Three candidates were painted over the station
concept (`docs/ui-brief/concept/station.html`): «Сурик», «Лайм», «Коралл»; «Сурик» won — a Soyuz panel.

1. **Graphite, cream ink, one accent.** Plates warm graphite (no navy), ink cream `#f1ebde`/`#a59d8f`, the accent red
   lead `#ff6a2b` (`--amber`, the name is a fossil), alarm crimson `#ff2d55` — never mixed up with the accent.
2. **The accent means act, choose, money** — buttons, the selected section, the purse. Prices, names, full gauges are
   cream; a goods' colour is a diamond by its name, not a rainbow of names.
3. **A full gauge is cream; only shortage lights up** (crimson).
4. **Colours are tokens**: `--c-phos/--c-acc/--c-edge/--c-ink/--c-alarm` triplets for `rgba(var(--c-acc),.2)`; a
   new rule takes a token, never a literal. The canvas still has literals (world chips are recoloured; the rest
   with M728).

## Parts on the mounts (M722–M724)

The part data stays as it is (`05-parts`: `{s,t,k,g,by}`, seven kinds; `slotsOf`, `mountsOf` — `{i,kind,size,mount,x,y}`
in hull coordinates). What is new is the picture: a part is geometry built into the hull mesh at its mount.

Laws:
1. **One mesh, one light.** Parts are built by the same kit (`h3dKit`) into the same vertex buffer as the hull, so
   the body shadows them, contact darkens them and the star glints on them. The mesh cache key is the hull plus the
   fit signature.
2. **Read from above.** The camera looks down; everything sits on the deck or the wing's top, never underneath.
3. **Kind by silhouette, tier by detail, maker by grammar.** A gun is barrels, a launcher a cell block, a shield an
   emitter ring, a core a domed housing with a glowing slit, armour bolted slabs, an engine a bigger bell with a
   collar, a utility a mast/dish/arm. Size L/M/H scales calibre and length; each tier adds parts (fins, cables, a
   second barrel, sensor boxes). Ordnung boxy, High-Front smooth drops, Company glossy (`H3D_MK`).
4. **Glow is a vertex channel**: `m.y` in (1,3] lights the part in its own colour (emitters, core slits); 0..1 stays
   the ember.

### The hangar (M723) — `27j1-ui-hangar`

Zone 3 of ОПИСЬ is a hangar bay: the fitted ship in 3D under studio light, every mount a numbered marker, every
marker a leader line to its slot card. Laws:
1. **The ship is the hero, the cards frame it.** Slot cards stand in a row above and a row below the stage, ordered
   by the marker's x so leader lines never cross; the stage is fitted to the hull alone (`hu0..hv1`), not to the
   markers. The camera is fixed by eye (tilt .95, yaw .14, perspective .14) and sways slowly; a drag turns it.
2. **Graphite bay, one accent.** Dark graphite plates with rivets and a bezel, ink `#f1ebde`, one accent `#ff6a2b`
   for the selection and the action; the part kind's colour lives only on the card's edge, the marker and the line.
3. **Markers never stack.** True positions are projected, then pushed apart (radius 25, five passes); a moved marker
   keeps a thin stalk to its true point.
4. **The studio renders at the frame's own size** (`h3dStudioRT`): no intermediate square layer, so 4K is sharp and
   the phone pays less than the 1024 class; the studio bake caps at `HS_SIDE` 2048, twice the flight's.
5. **Phone and narrow windows reflow, not shrink.** A container query (≤ 780 px of the bay) turns the two columns
   into one: stage, legend, slot chips in two columns, inspector, panel, spare parts, plan.
6. **The table yields to the hangar**: on the table the console's 56 px top padding is gone, and from 900 px the
   table widens to 1400 so the whole bay fits the first screen at 1920×1080.

### Part thumbnails (M724) — `17c2d-parts-thumb`

Every card that names a part shows the part: the hangar tray (banner on top of the card), the inspector's hero, the
phone's slot plate, the station's «части в продаже» and workshop rows, the «С БОЯ» loot card. Laws:
1. **The very model that goes on the mount.** `h3dParts` builds it on a synthetic one-pedestal hull; what is bought
   at the counter is what stands on the wing.
2. **A product shot, not a diagram.** Fixed camera (`P3T_CAM`: yaw .66, tilt 1.16 — low, near profile, so turret
   rings foreshorten and barrels read), studio key from the upper left; the part is fitted to 90 × 88 % of the frame
   by its own vertices, so L and H are the same height in a card — the size is written, not drawn.
3. **The pedestal serves the part.** A graphite turntable sized by the part's base (what lies within .2 of the top,
   ×1.1) — a long low barrel overhangs instead of inflating it; the top is darker than any part, the band and every
   sixth tick glow in the kind's colour. The niche behind is CSS (graphite, a horizon at 58 %, the kind's glow below),
   the canvas is transparent around the part.
4. **Painted outside the frame, one encoder each.** `partThumb` queues the canvas, a timer paints it through
   `ovPaint`; studio targets are shared per size, so two thumbnails never share an encoder. No GPU memory per card:
   the canvas keeps the picture; caches are meshes (48) and studios (8).
5. **Banners paint at their real box.** A fluid thumbnail (`fl`) measures `clientWidth/Height` in the timer (never
   in the frame or a pointer handler) and paints at that size, so it is never stretched; `max-height` caps it on a
   phone's single column.

## The cantina (M725) — full 3D, no 2D anywhere

The author, 07.10: «2d не должно быть». The hall, its people and every portrait of them are engine scenes; the 2D
hall (brushes, layered bakes, the light pass over a flat picture), the 2D props, the story figures and the cinema
overlay are deleted. Modules: `27f2-room3d` (the interior renderer), `27f3-person3d` (people), `27f4-cant3d` (the
hall), `27f5-portrait3d` (portraits); `27d-ui-cantina` keeps only the station styles, the lamp table and the entry.

### The interior renderer — `27f2-room3d`
1. **One forward pass, two targets.** Colour and the lamps' volumetric haze leave the main pass separately (MRT); the
   haze is resolved at half size and blurred with a tent, so cones are soft and never noisy. Shadows: one depth layer
   per shadowing lamp (≤ 6), up to 12 lamps.
2. **Bloom is a mip chain**, 13-tap downsamples with a soft-knee threshold on the first — a sign glows without rings.
3. **Linear colour, ACES, then gamma** — vertex colours are linear (`r3Lin`); the post owns the look (grain,
   vignette, halos).
4. **Normals agree with the face** (derivative face normal), not with `front_facing`: tubes, surfaces and boxes wind
   differently, and a flipped normal glows.
5. **Materials are patterns, not textures**: cloth (weave, matte — a broad highlight turns cloth into varnished
   wood), skin (wrap light reddening past the terminator, pores as normal jitter, oily patches), hair (strand
   clumps as normal jitter and two highlights along the strand, Kajiya–Kay), wet cornea, glass, film, neon.

### People — `27f3-person3d`
1. **A person is a seed.** `cpGene` (face, build, hair, skin, marks) and `cpCloth` (role kit) are read from the
   manager's seed; `cpMesh` caches by seed, pose, detail, mood bucket and level. Detail 0 is the crowd, 1 the hall,
   2 the portrait (denser everything: `K.q` multiplies segments).
2. **The face is a profile, not an ellipsoid**: the lower face is a plane down to the chin, the jaw keeps its width
   to the angle, eyes sit at mid-head; tone zones like a painter's (redder nose and cheeks, cooler under the eyes,
   lighter brow).
3. **Hair is strands over a cap.** The cap sinks under the skin below the hairline, so the edge is where two surfaces
   meet — smooth, never the grid's staircase; roots thin to skin. A bob and dreads are ribbons laid along the skull
   (Catmull–Rom), a fringe lies on the forehead, ends taper to nothing.
4. **Clothes read before the face**: a commander's vest with pouches, radio and pad; a keeper's overalls with flat
   straps (bands along the body's own normal, never hoses), hi-vis bands and a tool belt; a factor's coat with lapels
   and a scarf wound round the neck; a scientist's tunic with pens and a glowing pass. The neckline is geometry, and
   the torso table is a spline (cosine between rows put steps into the neckline).

### The hall — `27f4-cant3d`
1. **The room is the station's**: palette, sign, window view, props and lamp count from `stype` and the system seed.
2. **Lamps hang above the frame edge** so their cones cross the picture; the sign is read under them, never
   behind a shade. A low lamp over every table: whoever sits by the lens is a person, not a silhouette.
3. **Candidates sit on the stools** at the bar under a key light from the door; the keeper behind the counter; deals at
   the tables; story figures and their things on the counter; on cinema nights the hall goes dark and gets rows.

### Portraits — `27f5-portrait3d`
1. **The very mesh that sits on the stool** (`cpMesh(m,"stand",2)`), framed head and shoulders (`cut` — the head).
2. **The sitter looks into the lens**: the head turns most of the way, the eyes finish it (`CP_GAZE`).
3. **A studio of the role**: warm key with a shadow, cool fill, a rim in the role's colour, a curved backdrop.
4. **Painted outside the frame**: a timer queue paints connected canvases straight into each card's own WebGPU
   context; render targets are shared per size (≤ 4). The card niche lays no scanlines over the face.

