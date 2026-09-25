# Ship «hq» — HQ, cantina, «Сорока», the raid (G11)

Branch `claude/gpu-hq`, from the fleet base `claude/optimistic-gates-u46osn`.
Zone: `27c-ui-hq`, `27f-hq-room`, `27d-ui-cantina`, `27d-ui-cantina-props`, `12v-wander`,
`12va-wander-cosm`, `24c-mode-wanderer`, `24c-mode-wanderer-draw`, `24a-mode-raid`,
`24aa-raid-draw`, `24ab-raid-foe`, their tests. New files: `27f1-room-gpu.js`, `24aa1-raid-gpu.js`,
`tests/91zzzzzzy5-gpu-rooms-hq.js`.

## Commits

1. `5cf43e3` **HQ room on the GPU** (`27f1-room-gpu`, `27f-hq-room`). HQ's room canvas lives in a DOM panel
   with its own rAF, outside the world frame, so it gets a small panel renderer of its own
   (`27f1`): the panel `<canvas>` is configured as a WebGPU canvas on the shared device
   (`rgba16float`, so the kit's own `kit.img` / `kit.shp` / field pipelines draw into it as they are),
   with its own uniforms and buffers (`rpgImage`, `rpgShapes`, `rpgField`, `rpgBake`), a scene
   texture and a final light pass. HQ is split into parts: the wall with consoles and screen text,
   the holo table's static glow (added), the table and the selection labels are GPU-canvas bakes
   keyed by what is drawn on them (managers, the numbers on each screen, the selection, the
   panel size); each manager is two bakes (legs, torso) and breathes by an offset, not a re-bake;
   everything that runs (scan lines, console keys, drones, the route blip, the perk pulse, the
   window lights, the holo corona, planets on their orbits, star twinkle, the «вы здесь» marker,
   the job marker, the selection halo) is kit shapes every frame. The light pass (`HQ_LIT_WGSL`):
   four lamps as point sources with falloff and a glare at the strip, their cones with crisp
   edges and a top-bright fade, haze and dust motes lit only inside the cones, pools on the
   floor, the domain colour of each screen spilling onto its niche and the face below it, the
   holo table lighting from below and glowing in the air in the star's colour, the warm duty
   lamps under the table (the warm accent against the cold key), the window's cold spill, contact
   shadows under people and consoles and along the wall-floor seam, a curved vignette, a highlight
   shoulder (faces under a lamp no longer burn white), animated grain and dither. Hits are
   computed in JS, so clicking people works with no device (Node). `hqFigure` keeps its signature
   and gains an optional `part` ("legs"/"top") for the sprites; its other callers (11w, 27e) are
   untouched.

2. `685ba47` **Cantina on the GPU** (`27d-ui-cantina`, `27c-ui-hq`). Same panel renderer. The cantina's
   animations are spread through every layer (patrons and the barkeep breathe, the fan turns, the
   view blinks, the neon winks, the yard's lamps sway, the barkeep's bubble fades), so the room is
   one GPU-canvas bake re-made every `CANT_EVERY`=3 panel frames (slow motion reads smooth) and at
   once when the selection, the candidates, the deals or the bubble change. Lamp cones, floor
   pools, the gaps between lamps, dust and the vignette left the brush for the light pass
   (`CANT_LIT_WGSL`): the per-station light plan (`CANT_LIGHT`, was a table inside the body) gives
   lamps with falloff and crisp top-bright cones, warm pools on the bar top and on the floor, a
   cold ambient so the warm lamps are the accent, the sign's neon glowing on the wall in the
   accent colour (winking with the sign), the window's cold spill, the shadow under the bar's
   overhang and at its foot, sparse motes in the cones, a highlight shoulder, grain and dither;
   the kino evening dims the lamps. Without a device the body runs against a null brush
   (`RPG_NULL`, `27f1`) only to get the hits. `cantinaScene` hands the real canvas over.
3. `90a7ac8` **«Сорока» on the GPU** (`24c-mode-wanderer-draw`). A world mode, so it uses the frame's kit
   directly and draws nothing on `#c`. The corridor is three GPU-canvas bakes at device
   resolution: the shell (walls, deck, back wall), the middle (ribs, the curtain with the magpie
   and shelves, bar, keeper, the green shade, bales) and the cases (re-made only when the cursor
   moves or a lot changes). The ceiling slot is a live field (`WAN_SKY_WGSL`): the planet as a
   lit sphere with a terminator, cloud bands and an air rim, turning slowly, stars drifting, the
   frame bars in perspective. The five hanging things are sprites that drift by offset, ropes
   are kit capsules. Light is two fields: `wanlit` (multiply) — the cold strips on the deck where
   the slot's shafts land, the sails' gold running down the tops of the walls, every visible case
   bulb as a warm point light on its cloth, the keeper's green lamp, shadow at the wall-deck
   seams, the vignette; `wanair` (add) — the shafts from the slot to the deck as a volume
   (integrated over depth along each view ray, so they overlap into beams), haze, dust that
   sparkles in the beams, halos of the bulbs and the lamp. The match flash is a kit rect. The
   2D order bug where the curtain covered hanging things in front of it is gone (hanging things
   draw after the middle).
4. **The raid on the GPU** (`24aa-raid-draw`, new `24aa1-raid-gpu`, `24ab-raid-foe`). The
   compartments were thousands of projected quads, painter-sorted and filled with 2D. Now
   `quad()` keeps them in world space and one instanced draw puts them into `gpuScene3D` with a
   depth buffer (`raid3d`): the same projection as before, written in clip space, so a quad with a
   corner behind the camera is clipped by the near plane instead of vanishing, and neighbours no
   longer fight over who covers whom; overlays that lie in a wall's plane carry a small depth
   bias (the painter's `dBias`, now meaningful). Light moved from a number per cell to a value
   per pixel: the face normal from derivatives; the ambient fading away from the player and the
   pool at his feet; the helmet torch as a spotlight with cone and falloff, lit by the normal;
   every ceiling lamp (24 nearest) and the hangar gate as point lights (reactor lamps pulse);
   fog by distance and the face outline where it is lit, as before; and the torch beam in the
   air integrated along each view ray from the eye to the surface (walls cut it off), with slow
   3D haze, plus halos of the four nearest lamps. Lamp strips and the amber cable runs are
   emissive and bright enough to bloom. Pirates are sprites: `drawFoeBody` depends only on kind,
   baron, alert and seed, so it bakes once per combination through the GPU canvas
   (`raidFoeSprite`, `still` = no breath) and stands in the depth pass as a camera-facing
   billboard (`raid3d.spr`), occluded by walls and lit by the torch and lamps. Everyone standing
   (the player, visible pirates) gets a contact shadow in the floor's lighting. The dust around
   the player is kit discs that flare inside the torch cone; the 2D torch glow and vignette went
   into the pass. Still 2D on `#c`: the player (`drawAstronaut`, the life ship's zone — called as
   it is), his floor ellipse, the loot beacons, stencils, health bars, shots, the hurt flash.

## Pairs (scratchpad, never in git)

Scratchpad: `/tmp/claude-0/-home-user-drift/b8476022-0b61-5bc5-baac-2bed83b71aa9/scratchpad/`.
«before» is shot from a worktree of the fleet base (`../base-hq`), «after» from a frozen copy of
this branch's build. All 760×475 at DPR 1 on SwiftShader, 0 GPU errors, no page errors.
`pair-<scene>.png` is before | after side by side; `cmp-<scene>.png` is a ×1.3 crop, stacked.

- HQ (`hqfull` — the stand is broken on the base: `#hqbtn` no longer exists, so it is shot as
  `system` + `hireMgr` ×3 + `openHq()`): `pair-hqfull.png`. Better: the room has a light source —
  lamps glare and throw crisp cones with dust in them, corners and the spaces between stations
  fall into dark, the holo star glows in the air, the screens colour their niches, a warm pool
  sits under the table.

- Cantina (`late`): `pair-late.png`. Better: the lamps have cones with edges and warm pools on the
  bar and the floor, the sign's neon lights its wall, the window is a cold counterpoint.

- «Сорока» (`wanbare` — `system` + `openWanderer({force:true,epoch:0})` with the DOM panel
  `#wanwin` hidden, because in play the panel covers most of the room; `wanderer` is the same
  frame with the panel): `pair-wanbare.png`, `pair-wanderer.png`. Better: the slot throws real
  shafts of cold light down the corridor onto the deck, the tops of the walls glow gold from the
  sails, each case is lit by its own bulb, the bar sits in the green lamp's warm pool.

- Raid (`raid`, `raidhangar`, `raidfoe`): `pair-raid.png`, `pair-raidhangar.png`,
  `pair-raidfoe.png`. Better: the helmet torch is a real light — it pools on the far wall, and
  its beam hangs in the air with dust; the cable runs and panels glow amber; the hangar is lit
  cold from its gate and warm from its lamps; pirates are lit and hidden by walls properly.

## Requests for files outside the zone

- `docs/mkview.ps1` (stand `hq`/`hqfull`): `document.getElementById("hqbtn").click()` throws on
  the base — the button is gone. Call `openHq()` instead.
- `08b0-gpu-pipe.js` recipes, so the warm-up detector can name and warm the new pipelines (see
  below): `GPU_FLD` entries and `GPU_PIPE_ONE` entries.

## New render pipelines (for the warm-up table `08b1`)

All created lazily today (they land in `GPU_PIPES.lazy`). Recipes to add in `08b0`:

| key | recipe |
|---|---|
| `pipe:fld.hqlit\|over` | `GPU_FLD["fld.hqlit"]=()=>RPG_WGSL+HQ_LIT_WGSL` |
| `pipe:fld.cantlit\|over` | `GPU_FLD["fld.cantlit"]=()=>RPG_WGSL+CANT_LIT_WGSL` |
| `pipe:fld.wansky\|over` | `GPU_FLD["fld.wansky"]=()=>WAN_SKY_WGSL` |
| `pipe:fld.wanlit\|mul` | `GPU_FLD["fld.wanlit"]=()=>WAN_LIT_WGSL` |
| `pipe:fld.wanair\|add` | `GPU_FLD["fld.wanair"]=()=>WAN_AIR_WGSL` |
| `raid3d` | `GPU_PIPE_ONE.raid3d=()=>raidGpuDesc()` (depth24plus, rgba16float) |
| `raid3d.spr` | `GPU_PIPE_ONE["raid3d.spr"]=()=>raidSprDesc()` (depth24plus, rgba16float) |

Note: `gpuPipeline()` does not cache a lazily built pipeline (it returns a new one each call);
`24aa1` caches its two in `GPU.lay` itself (`GPU.lay.raid3d`, `GPU.lay.raidspr`), as `gcMipPipe`
does. The first cut did not, and every frame's bind group mismatched its new pipeline — 322
validation errors and a lost command buffer per frame. Anyone calling `gpuPipeline` directly
should know.

The panel reuses `pipe:kit.img|over`, `pipe:kit.img|add`, `pipe:kit.shp|over`, `pipe:kit.shp|add`
as they are (same code, same `rgba16float` target).

## Open problems

- The panel renderer is a second copy of the kit's thin wrappers (`gpuImage`/`gpuShapes`/
  `gpuField` bind `gpuKitU()`, the frame's resolution, so a DOM panel cannot use them as they
  are). If the kit grows a «target» argument (resolution + buffers), `27f1` shrinks to that.
  Kino and chess (the rooms ship) are DOM panel canvases too and could use `27f1` as it is.
- `docs/TESTMAP.json` is rewritten by the build (one line for the new suite); like `INDEX.md` it
  is left to the integrator.
