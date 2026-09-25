# Ship «base» — the base in cross-section (G11)

Branch `claude/gpu-base`, from the fleet base `claude/optimistic-gates-u46osn`.
Zone: `21a-mode-base`, `21aa-base-rooms`, `21ab-base-interiors`, `21ab-base-interiors2`,
`21ab1-base-ground`, `21ac-base-draw`, `21ac1-base-banya`, `21ac2-base-farm`, `21ac3-base-van`,
plus the new `21ad-base-gpu.js`.

## How to see the scene

`docs/mkview.ps1` has **no `base` scene**: `?s=base` falls back to the surface (the fleet brief's
command shoots a surface frame). The base is set up with a `--js` snippet — the same base
`docs/mkbase.ps1` builds (every room kind, eight hands on the base):

```
(function(){var p=G.sys.planets.find(function(x){return x.type!=="gas";})||G.sys.planets[0];
var kinds=Object.keys(BUILD),cells=[];
for(var i=0;i<BASE_COLS*BASE_ROWS;i++)cells.push(((i*7)%11<8)?{k:kinds[i%kinds.length],hp:1}:null);
G.bases[baseKey(G.sx,G.sy,p.idx)]={sx:G.sx,sy:G.sy,idx:p.idx,name:p.name,type:p.type,res:p.res.slice(0,3),cells:cells,pool:{},tMs:now(),built:now()};
for(var q=0;q<8;q++){var cw=genMerc(hashi(q*77+13,5,3));cw.order={kind:"base",sx:G.sx,sy:G.sy,idx:p.idx};G.crew.push(cw);}
enterBase(p);})();
```

`python3 docs/shot.py surface --js "$(cat base-scene.js)" --w 760 --h 475 --dpr 1 --budget 900000 --out …`
(~2 min on SwiftShader). The left view (gate, tunnel, shaft M396) appends
`G.base.x=BASE_OX-BCELL_W*.5;G.base.cur=-1;G.base.row=1;` before `})();`.

**The fleet base's base scene was broken.** Since the 21ab1 split (M413) the refinery smoke in
`drawBase` read `surfYs`, a local of `baseDrawGround`: every frame with a refinery threw
`ReferenceError: surfYs is not defined` and the frame guard dropped the frame. The «before»
frames were shot from a scratch worktree with a one-line patch (`window.surfYs=surfYs`) so the
old picture could be seen at all; the port fixes it for real (`baseSurfY`, a world function).

## Commits

1. `a850203` **Base on the GPU: world bakes, light and air fields** — see §1.
2. **Room machines split into a baked body and a live part; their own lamps become field light** — §2.

### 1. World bakes, light and air

The frame (was: every stroke of ground, rock, excavation, walls and furniture in 2D, every
frame, then the whole `#c` uploaded):

| layer | how | when it changes |
|---|---|---|
| sky + far ridge | bake, parallax .3 (`baseSkyPaint`) | planet, W×H |
| near ridge | bake, parallax .6 (`baseRidgePaint`) | planet, W×H |
| back: mountain, rock, soil, grain, boulders, surface structures, excavation, shaft M396, tunnel lamp housings, lift column | bake, world (`baseGroundPaint` + `baseBackPaint`) | cells, hp, light step (1/40), van, W×H |
| live iron: both cages, ropes, counterweight, landings, mast beacon, pad lights | `gpuShapes` in the scene pass | every frame |
| rooms: floor slabs + room shells (wall, wall dress, lamp housings, junk) | bake, world (`baseRoomsPaint` → `drawModuleShell`) | cells, hp, light step |
| machines and hands (`drawModuleLive`: `BASE_ROOM[k]` + staff), walkers, named hands | 2D, live | every frame |
| front: floors, damage crosses, bulkheads and doors, cable channels | bake, world, in the `gpuOver` pass (`baseFrontPaint`) | cells, hp, light step |
| frost rime | `gpuShapes` | heat band |
| **light** | `gpuField` `baselight`, blend `mul` | every frame |
| **air** | `gpuField` `baseair`, blend `add` | every frame |
| names, shaft numbers, smoke, astronaut, cursor, adjacency, board, note, avral, pennant, menu | 2D, live | every frame |

Bakes are keyed (`BASE_BK`), drawn texel-to-pixel (camera snapped to device pixels, bake at
`min(2,DPR)`, bicubic when the screen is denser), and re-baked only when the base changes.
Two `#c` uploads a frame (the `gpuOver` and `gpuWorld`), as before; the 2D on `#c` is now only
what moves.

What got better (the gain line): **each room is lit by its own lamps** — a pool on the floor
under every lamp, a visible shaft of light with slow dust drifting up in it, the corners and the
ceiling between lamps falling off into shadow — **against cold grained rock**: the planet's
material now lies in the rock as texture under a cold light (in 2D it was a flat overlay film),
warm light bleeds into the rock from the excavation edge and dies with distance, instead of the
old flat amber `lighter` halo that sat on top of everything. Frost and heat haze are air, not a
full-screen rectangle. Also fixed on the way: grain and boulders were fixed to the SCREEN (the
rock slid under them when the camera moved) — now they lie in the rock; the mountain's height
no longer changes with the vertical camera; the refinery crash above.

Deleted 2D: the per-lamp trapezoid cones in `drawModule`, the per-cell radial halos into the
rock, the tunnel's radial pools, the junction glow, the shaft cage's cone and halo, the gate
lamp's cone, the two `lighter` rim strokes, the full-screen frost/heat fills. The light model
that replaces them is analytic in the shader (the lamp table is generated from `ROOM_FIN`, the
same table the shell draws the lamp housings from — light falls from the lamp that is drawn).

Pairs (scratchpad of this session, never in git):
- `scratchpad/pair-1-base.png` — the grid, cursor on the drill: lit rooms with pools and shafts,
  textured cold rock, warm/cold rooms apart. Left: the fleet base (with the surfYs patch).
- `scratchpad/pair-1-left.png` — the left view: gate tunnel, shaft M396 with its cage lamp.

### 2. Machines: body baked, motion live; their lamps are light

Every room painter (`BASE_ROOM[k]`: reactor, solar, drill, storage, habitat, refinery, pad, lab,
battery, banya, farm; and `drawVan`) now asks which pass it is in: `bS()` — the body (vessel,
racks, casing, shelves, the sleeper on the bunk), `bL()` — what moves (steam, needles, the auger,
the ore on the belt, the trolley, the ladle and the pour, the lift platform, bubbles, the flywheel,
the arc, workers). `drawModuleBody` bakes the body into the rooms layer right after the shell
(pass 1); `drawModuleLive` draws only the motion every frame (pass 2). Pass 0 is the old
everything-at-once, for anyone calling a brush outside the base. `bWorker` is always live,
`bScreen` bakes its glass and lines and runs only the scan bar live.

The rooms key follows what the bodies read besides the cells: the storage shelves' fill step,
the banya's heat on a bath night, the farm's beast, the van (`baseRoomsKey`).

Pass 3 is light: the painter runs with `ctx` swapped for a sink, and only `bLamp` and the static
`bGlow` calls land — in the blue channel of the field's mask, as a light map. The light field
adds it to the room's lamps (`roomLight(…, ex)`), so the reactor's lamp over its console, the
habitat's desk lamp, the lab's and battery's ceiling lamps, the flasks' glow, the banya stove, the
van's headlight now **light what is under them** (multiply) and put dust in their cones, instead
of a flat trapezoid film baked on top. In the bakes there is no `lighter` at all (a test checks).

Numbers (the only thing measurable here): 2D calls in one `drawBase` frame, same scene —
**7 151 on the fleet base → 1 766** after this item (−75%; the rest is machines in motion,
people, and the UI: board, note, cursor, names).

Tests: `tests/91zzzw-base5-gpu.js` (Node tier) — for every painter the body pass records the
same commands at two different `G.t` (so it is legal to bake), the live pass is smaller than the
old whole paint, the pass is restored; every world bake painter is time-independent; the light
map carries the machines' lamps and the rooms bake has no `lighter`; a frame with a refinery
draws to the end (the `surfYs` regression). It caught two slips of this split on first run.

Pairs:
- `scratchpad/pair-2-base.png` — fleet base | after item 2, whole frame.
- `scratchpad/pair-2-reactor-x3.png` — item 1 | item 2, ×3 on the reactor and solar rooms: the
  reactor's own lamp now lights the console and the operator.

## New render pipelines (for the warm-up table `08b1`)

- `fld.baselight|mul` — `gpuField`, the base light field (WGSL from `baseLightWgsl()`).
- `fld.baseair|add` — `gpuField`, the base air field (`baseAirWgsl()`).
- Kit pipelines used, already in the table: `kit.img|over`, `kit.shp|over`, the `gc.*` bake set.

## Requests outside the zone

- `docs/mkview.ps1`: add a `base` scene (the snippet above) so `?s=base` is the base, and a
  `baseleft` one. Without it every ship's and tool's «base» frame is a surface frame.
- `17ga-gpu-planets.js` is the only caller of `matTick()`; the base now calls `planetMat` +
  `matTick` itself when it enters a planet whose material was never baked (e.g. a save loaded
  straight into the base). Fine as is; noted in case the material job moves.

## Open problems

- The live `bGlow` calls (reactor core pulse, forge, pour, arc, running lights) are still
  additive 2D radials on `#c`; they move, so they cannot be baked. They could become point
  lights in the air field (uniform budget: 12 floats left) — not done.
- Browser suites for the base (`91j-art` «три пересмотренные сцены рисуются», goldens) could not
  be run here: `test.ps1` finds Chrome only on Windows paths until the tools ship lands.
- Bakes at DPR 2 on a 1920 window are ~2200×1800 textures (three world layers ≈ 40 MB); the
  one-off MSAA target for such a bake is ~90 MB for a moment. Measured only for correctness on
  SwiftShader; the phone numbers are for the author's S23.
