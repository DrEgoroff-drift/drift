# Ship «hq» — HQ, cantina, «Сорока», the raid (G11)

Branch `claude/gpu-hq`, from the fleet base `claude/optimistic-gates-u46osn`.
Zone: `27c-ui-hq`, `27f-hq-room`, `27d-ui-cantina`, `27d-ui-cantina-props`, `12v-wander`,
`12va-wander-cosm`, `24c-mode-wanderer`, `24c-mode-wanderer-draw`, `24a-mode-raid`,
`24aa-raid-draw`, `24ab-raid-foe`, their tests. New files: `27f1-room-gpu.js`, `24aa1-raid-gpu.js`,
`tests/91zzzzzzy5-gpu-rooms-hq.js`.

## Commits

1. **HQ room on the GPU** (`27f1-room-gpu`, `27f-hq-room`). HQ's room canvas lives in a DOM panel
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

The panel reuses `pipe:kit.img|over`, `pipe:kit.img|add`, `pipe:kit.shp|over`, `pipe:kit.shp|add`
as they are (same code, same `rgba16float` target).

## Open problems

- The panel renderer is a second copy of the kit's thin wrappers (`gpuImage`/`gpuShapes`/
  `gpuField` bind `gpuKitU()`, the frame's resolution, so a DOM panel cannot use them as they
  are). If the kit grows a «target» argument (resolution + buffers), `27f1` shrinks to that.
  Kino and chess (the rooms ship) are DOM panel canvases too and could use `27f1` as it is.
- `docs/TESTMAP.json` is rewritten by the build (one line for the new suite); like `INDEX.md` it
  is left to the integrator.
