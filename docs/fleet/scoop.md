# Ship «scoop» — G9, the gas giant's atmosphere on the GPU

Zone: `src/19a-mode-scoop.js`, new `src/19a1-scoop-gpu.js`, tests for them.
Branch `claude/gpu-scoop` from the fleet base `claude/optimistic-gates-u46osn`.

## How the frames are shot

`docs/mkview.ps1` has no `scoop` scene (and it is outside the zone), so the pairs are the `system`
scene plus a `--js` that finds the nearest system with a gas giant and calls `startScoop` —
the same search `docs/mkshots.ps1` uses. The snippet is kept in the scratchpad as `scoopjs.txt`:

    python3 docs/shot.py system --w 760 --h 475 --dpr 1 --seed 7 --js "$(cat scoopjs.txt)" --out …

«Before» is from a worktree of the fleet base (`../base-scoop`), «after» from this branch.

## Commits

1. **The giant's sky as a live field** (`scoop.air`). `giantTex` (a 768×384 CPU pixel loop,
   ~400 ms per giant, cached for three giants) and its two stretched parallax layers, the
   depth gradient `screenLayer` and the one-frame 2D lightning are gone. One `gpuField` draws
   both decks, the depth and the storm every frame: bands flow (each latitude its own jet
   speed), curl (the curl of a slowly drifting noise), storms are cells along the band (no
   tile repeat) whose twist breathes; the near deck is a broken cloud ridge with relief, not
   the same band at .3; one light with a source — the star's real side relative to the entry
   point, drifting over the pass (`scoopSunAt`), cloud tops lit toward it, night side dims,
   warm light at the terminator; lightning fades over frames and lights the cloud undersides.
   Noise is the nebula's tile (`gnbNoiseTile`, `fbt`) — one gather instead of four hashes.
2. **The flow over the sky** (`scoop.flow`): the five shear edges, their billows, the incoming
   streaks and the collection corridor leave 2D. Billows are lit bodies whose normal faces the
   star (they had one fixed «highlight on top» gradient); the edge is a soft shadow falling
   downward without the pencil core line; streaks (0.6 % alpha before — invisible) are traces
   with a head and a tail, denser low; the corridor is a glowing gas layer brighter at its
   inner edges, dashed edge kept for reading, motes ride the gas at three speeds. Every motion
   is a phase JS takes modulo its own period (a multiple of the cell size), so shader
   coordinates stay small and nothing jumps when a phase wraps. The relief of the sky takes a
   smooth band profile and fine derivatives — the sawtooth kink under a 2×2 screen derivative
   laid light in steps. Test `tests/91sc-scoop-gpu.js`: the corridor built from the shader's
   uniforms equals `scoopCenter` over the screen and along a 512 000-unit path; the star
   gives a unit direction, day in 0..1.
3. **Hazards, wake and the hull** (`scoop.obs` + kit shapes + `hullGpuDraw`). Vortex cores and
   plumes are a field over six slots: the core is a funnel with log-spiral arms turning with
   the pass, dark furrows between them, a dome lit from the star, a hot rim brighter on the
   star's side and its shadow on the gas away from the star; the plume is a jet whose puffs are
   torn by noise and carried along it. Hail is cracked ice of six facets, each lit by its own
   normal (was one «light on top» gradient); the frost trail is additive. The wake is in the
   field (a torn cut with two curls — the capsule chain beaded at its joints). The hull is the
   kit's bake (`hullGpuDraw`, 17c2) lit by the same star direction as the sky; heat tongues and
   the collector's horns are kit shapes. The sky's relief now takes the band's vertical slope
   analytically per pixel (the 2×2 derivative still stepped on steep fronts); billows got noisy
   edges and the star's tint. All reversed-edge `smoothstep` in the zone rewritten as
   `1-smoothstep(lo,hi,x)` — undefined in SPIR-V/Metal when edge0 ≥ edge1; SwiftShader happens
   to accept it. What still draws on `#c`: the «ПОЛОСА СБОРА» plaque and the heat gauge — text.
4. **Polish: heat, plumes, no pops.** Below the corridor a burning hull cuts the dense gas: a
   bow shock ahead of the nose and a heat haze, both shimmering with flowing noise, from half
   the gauge up (`v[14].w`). Plumes read (they were ~0.3 alpha warm on teal — invisible, while
   they are the hazard that carries you): wider body, hot core line, striations running along
   the jet show where it carries before it does. Slot phases no longer pop: the core's noise
   offset moves on a circle of its angle phase, the plume's phase wraps at 1000 (a multiple of
   its puff period) instead of 1. Checked the star's other positions: dusk comes out warm and
   side-lit, the night side dim but readable, the corridor glows at night (scratchpad
   `dusk-night.png`).

## Pairs (scratchpad, 760×475, before | after)

- `pair1-air.png` — the atmosphere reads as layered, lit cloud decks with depth instead of a
  flat purple smear; bands have crisp fronts and relief from the star's side.
- `pair2-flow.png` — the edges are soft shadows under lit billows instead of pencil lines, the
  corridor is a teal gas layer with motes, readable against the bands.
- `pair3-things.png` (a second scene 2150 units into the pass, hazards on screen; its «before»
  is `before-scoop2.png`) — the vortex is a lit funnel with a hot rim instead of pencil
  circles, the hull takes the star's light, the whole frame reads as lit layered cloud.
- `pair4-heat.png` (third scene: an unhit core, a plume and hail placed ahead, the ship below
  the corridor at 90 % heat; snippet `scoopjs3.txt`) — the vortex is a lit funnel with a dark
  eye, the plume a hot rising jet, the burning hull has a bow shock and haze.

Also checked: the phone's portrait frame 390×844 (`phone.png`) — the fields scale with `H`,
hazards, corridor and bow shock read; 0 GPU errors in every shot of this branch.

## State of the zone

Done: nothing of the scoop's world draws on `#c` any more — sky, depth, storm, shear edges,
billows, streaks, corridor and motes, cores, plumes, hail, wake, heat, collector and the hull
are on the GPU. `#c` keeps only text: the «ПОЛОСА СБОРА» plaque and the heat gauge (the
hybrid rule of DESIGN-gpu §0). `giantTex`, `GIANT` and the `scoopdepth` `screenLayer` are gone.

## Requests outside the zone

- `docs/mkview.ps1`: a `scoop` scene (`?s=scoop`) would let the shot tools and the stand reach
  the mode without a `--js` snippet. Suggested body = the `scoop` line of `docs/mkshots.ps1`.

## New render pipelines (for the warm-up table `08b1`)

- `fld.scoop.air` — `gpuField`, blend `over`, field layout (textures: t1 = `gnbNoiseTile()`).
- `fld.scoop.flow` — `gpuField`, blend `over`, field layout (t1 = `gnbNoiseTile()`).
- `fld.scoop.obs` — `gpuField`, blend `over`, field layout (t1 = `gnbNoiseTile()`).
- kit pipelines already in the table: `kit.shp` (over, add), and the hull's own (`hullGpuDraw`).

## Open problems

- Cost is unmeasured (SwiftShader is a CPU): three full-screen fields — `scoop.air` is the
  heavy one (two decks, ~40 noise-tile gathers a pixel), `scoop.flow` and `scoop.obs` are
  light. Worth one look on the S23; the cheap cut, if needed, is the near deck's curl
  (three `fbt` calls) or the air at half resolution.
- The browser tier (the text-contrast detector of `90b` on the «ПОЛОСА СБОРА» plaque, goldens)
  was not run here — `test.ps1` does not run in the cloud yet (tools ship, G13). The plaque
  itself is unchanged; its backdrop is now the lit sky and the corridor instead of 2D.

- `src/16gb-gpu-nebula.js` (flight, not this zone) has reversed-edge `smoothstep(1.,.2,r)`,
  `smoothstep(1.,.4,r)` — undefined by the WGSL→SPIR-V/MSL lowering; fine on SwiftShader and,
  apparently, on the author's GPU, but worth a look on Metal (iOS/macOS Safari).
- The second scene's `--js` also lives only in the scratchpad (`scoopjs2.txt`): the first
  snippet plus `G.scoop.x=1500;G.scoop.obs=[];scoopSpawn();G.scoop.x=2150;scoopSpawn();
  G.scoop.y=scoopBand()[0]+H*.05;`.
