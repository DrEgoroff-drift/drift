# Ship «places» — notes

Zone: the surface's regional passes (`11g` lights, `11h` hours, `11i` glow, `11j` grove, `11l` county,
`11o` slow, `11p` pass, `11v` places) and the quiet features outside (`21f-home-out`,
`21g-greenhouse`, `21h-pennant`). Goal: PLAN G6 for them — on the GPU and better lit.

## The idea: painters light lamps, one pass lights the world

Before, every lamp outside was a 2D «lighter» blob drawn *before* the surface frame's night block
(`21e1`, the gradient that darkens the frame by up to `nite*.9`) — so the night laid its shadow over
the lamp: a lit spot by the door, and the porch, the wall and the path around it dark.

New module `src/11va-places-lit.js`:

- `placeLamp(x,y,rad,rgb,k,hz)` — a painter lights a lamp (screen CSS px; `rgb` 0…1; `k` strength;
  `hz` how far in front of the frame plane — negative `hz` = a window/slit: lights the same, but has no
  point core). The list lives one frame (keyed by `GPU.frameNo` + `G.t`), `PL_MAX`=24 lamps, the
  weakest are dropped; off-screen lamps are not lit.
- `placesLit(p,tr,camx,camy)` — one `gpuOver()` pass (additive, `gpuField` "placesLit") that must run
  **after** the night block: the ground near a lamp is lit *by its own colour* (light × the front
  layer's premultiplied colour, so the material stays visible), with a cosine to the slope (the slope
  facing the lamp is brighter) and only the top layer of the cut; standing things (walls, stalks,
  people) catch the same light on their face; a narrow air halo where there is air; an HDR core
  (>1) that the frame's bloom picks up. By day (`placesLitK(p)`=0) the pass is skipped entirely.
  It ends and submits the encoder, the same order `gpuOver` itself keeps, so `gpuWorld`'s upload of
  `#c` cannot overtake the read of the front texture.

## Commits

| # | Commit | What |
|---|---|---|
| 1 | *(this push)* | `11va-places-lit` (lamps + the GPU light pass); `21f-home-out` lights the porch lamp, the two windows and the dock beacon instead of 2D blobs; tests `91zt1-places-lit` (registry, day/night, the home's lamps) |

## Pairs (scratchpad of session f4cd0b32…, 760×475 dpr 1)

Scratchpad: `/tmp/claude-0/-home-user-drift/f4cd0b32-de40-5b68-a0bf-cb93a3af9961/scratchpad/`

| Pair | Scene | Gain |
|---|---|---|
| `before-homenight.png` \| `after-homenight.png` | `homeout` at hour .80 (`--js` in `nightjs.txt`) | the porch lamp lights the wall, the door, the porch and the yard down the slope in their own colours; the beacon glows (bloom) instead of being a flat dot; the house is the warm mass of a cold frame |

The «after» of pair 1 is shot with the one-line call below applied locally (not committed — it is
outside the zone). Without the call the lamps are registered and nothing is lit (the old 2D blob of
the porch lamp is gone), so **the request below is what makes this commit visible**.

## Requests for files outside the zone

1. **`src/21e1-surface-world.js` (surface ship / coordinator)** — one line at the end of
   `drawSurfaceWorld`, after the night block and before `lightShafts(p)`:

   ```js
     placesLit(p,tr,camx,camy);   /* фонари мест светят ПОСЛЕ ночи (11va) */
     lightShafts(p);
     gradePass(p);
   ```

   If the surface ship ports the night block itself to the GPU, `placesLit` stays the right call right
   after it. The lander's cabin window and belly glow (the `M243` block in the same function) could be
   `placeLamp` calls too — then they would light the ground under the ship instead of a blob.
2. **`src/12tb-settle-draw.js` (no ship owns it)** — `sdWindow(x,y,w,h,pal,nite,seed)` is the one window
   painter of settlements and the home; one line inside the `lit` branch,
   `placeLamp(x+w*.5,y+h*.55,Math.max(w,h)*3.2,[1,.76,.47],.3,-Math.max(w,h))`, would light every
   settlement's yards at night. (The home's windows light their lamps from `21f` already, so after this
   change `21f`'s two window `placeLamp` calls should be removed to avoid double light.)

## New render pipelines (for the warm-up table `08b1`)

- `pipe:fld.placesLit|add` — `gpuField` layout (`gpuFieldLayout`), target `rgba16float`, blend `add`.

## Open problems

- 24 lamps a frame is plenty for a home or a settlement street; a busy frame drops the weakest.
- The object term treats every standing pixel as facing the camera; walls get light, but no shadow of
  one object on another — no occlusion in this pass.
