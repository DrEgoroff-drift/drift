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
| 1 | `1ac408b` | `11va-places-lit` (lamps + the GPU light pass); `21f-home-out` lights the porch lamp, the two windows and the dock beacon instead of 2D blobs; tests `91zt1-places-lit` (registry, day/night, the home's lamps) |
| 2 | `b189c2c` | the pass generalised (`placesLitRun`: with ground on the surface, without ground for the belt — `placesGlow`); `placeSun`/`placeShade`/`placeFigure` in `11va` — one way to stand a thing under the same star as the ground (warm side to the star, shadow side, sky on top, ground occlusion below, grain, a rim only on the star's side); `11p` the pass ship (plating seams, a repair plate in the wrong colour, rust streaks under the portholes, soil drifted to the keel, brass-ringed portholes with sky in the glass, a real gangway; lit portholes and hatch light the ground and the pilgrims); `11v` tower/bowl/stair lit by the star, the tower's shadow across the ground, the bowl's inner wall in shade; `11l` the county door (stone jambs and lintel, a planked leaf with iron bands, depth in the opening, warm spill on the threshold and ground at level 2, lit windows and nursery as lamps); `11i` moss jars on stakes around the pad that light it, glow patches light the ground around them; `11g` the three lights' satellites as stars (halo, limb darkening, white core), open shutters light the yard; `11j` grove growths are light sources in the belt (their own surface and neighbouring rocks catch green, HDR halo blooms) instead of a 2D circle; `21g` beds with a dug ridge, clods, the stalk's shadow from the star, leaves lit on the star's side; `21h` the pennant's velvet folds catch the light and travel with the wave |
| 3 | `df38730` | `11p` the pass ship reads at night: lighter hull, stronger porthole and hatch light |

## Pairs (scratchpad of session f4cd0b32…, 760×475 dpr 1)

Scratchpad: `/tmp/claude-0/-home-user-drift/f4cd0b32-de40-5b68-a0bf-cb93a3af9961/scratchpad/`

| Pair | Scene | Gain |
|---|---|---|
| `before-homenight.png` \| `after-homenight.png` | `homeout` at hour .80 (`--js` in `nightjs.txt`) | the porch lamp lights the wall, the door, the porch and the yard down the slope in their own colours; the beacon glows (bloom) instead of being a flat dot; the house is the warm mass of a cold frame |
| `before-passday.png` \| `after-passday.png` (`pair-passday.png`) | pass core, hour .30, cave moved aside (`js-passday.txt`) | the ship is a ship, not a flat polygon: plating seams, a repair plate, brass portholes with sky in the glass, the sun rim on its edges, a gangway. Honest: at 760 px in this world's green haze the gain is modest |
| `before-passnight.png` \| `after-passnight.png` (`pair-passnight.png`) | pass core, hour .80, light on | lit portholes and the open hatch lay warm light on the ground in front of the hull and on the pilgrims; before, six dots. Shot before commit 3 (lighter hull, stronger porthole light) |
| `before-tower.png` \| `after-tower.png` (`pair-tower.png`) | the tower place, hour .36 (`js-place0.txt`) | honest: no visible gain at 760 px — the post is 10 px wide, its ring is above the frame, and at dusk the star-side light is weak |
| `before-county.png` \| `after-county.png` (`pair-county.png`) | county core at level 2, hour .80 (`js-county.txt`) | the giant door stops being a black slab: stone jambs and lintel, and through the open door warm light pours onto the threshold and the ground; the town's windows light the wall under them — the frame's one warm source in a cold night |

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

3. **Belt ship (`24-mode-belt`)** — nothing to change, a note: `groveDraw(b,proj)` (called after the
   rocks) now ends with `placesGlow()`, i.e. one `gpuOver()` + submit when grove rocks are on screen
   (only in grove regions). If the belt frame moves its rocks to a 3D pass, keep `groveDraw` after
   them so the grove's light reads the rocks.
4. **`src/11p-pass.js` layout (mine, not changed — it is logic)** — in the pass core, `passShipX` puts
   the ship at settlement+420, and the cave mouth landed at x 5216 against the ship at 5285: the mouth
   sits inside the hull. The pairs move the cave aside in the stand's `--js`. Placing the ship (or the
   cave) apart is a world-layout change for the coordinator/author to approve.

## New render pipelines (for the warm-up table `08b1`)

- `pipe:fld.placesLit|add` — `gpuField` layout (`gpuFieldLayout`), target `rgba16float`, blend `add`.

## Open problems

- 24 lamps a frame is plenty for a home or a settlement street; a busy frame drops the weakest.
- The object term treats every standing pixel as facing the camera; walls get light, but no shadow of
  one object on another — no occlusion in this pass.
