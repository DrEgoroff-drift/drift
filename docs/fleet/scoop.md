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

## Pairs (scratchpad, 760×475, before | after)

- `pair1-air.png` — the atmosphere reads as layered, lit cloud decks with depth instead of a
  flat purple smear; bands have crisp fronts and relief from the star's side.

## Requests outside the zone

- `docs/mkview.ps1`: a `scoop` scene (`?s=scoop`) would let the shot tools and the stand reach
  the mode without a `--js` snippet. Suggested body = the `scoop` line of `docs/mkshots.ps1`.

## New render pipelines (for the warm-up table `08b1`)

- `fld.scoop.air` — `gpuField`, blend `over`, field layout (textures: t1 = `gnbNoiseTile()`).

## Open problems

- none yet.
