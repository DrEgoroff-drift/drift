# The WebGPU porting fleet (25.09)

Cloud sessions that move the modes still drawn with Canvas 2D onto WebGPU, one ship per zone, in
parallel. The plan items are PLAN §0 G6–G13; the recipe is `docs/DESIGN-gpu.md` (§0 the author's
decisions, §2 the frame, §3 the one rule of layer order, §4 the kit, §5 the porting checklist); the
map of what to port, file by file, is `docs/GPU-PORT-CENSUS.md`; the machine is `docs/CLOUD.md`.

The coordinator is the session that launched the fleet. It merges ship branches into
`claude/optimistic-gates-u46osn` (the fleet base: `claude/base-gpu` + the cloud setup + the census),
rebuilds, runs the fast tier and pushes. Nobody else merges.

## Rules for every ship

1. **Branch.** Start from `origin/claude/optimistic-gates-u46osn`; push only to your own
   `claude/gpu-<ship>`. Never `main`, never another branch; no force-push, no `--no-verify`, no
   amend, no git config changes (the session hook already set `core.hooksPath`). To pick up another
   ship's work, merge `origin/claude/optimistic-gates-u46osn` into your branch — merge, not rebase.
2. **Zone.** Edit only the files your brief lists, plus new files you create next to them (a
   fractional prefix after the file you port, e.g. `22c-cave-gpu.js`) and tests for your zone. A
   change needed in a file outside your zone — even one line — goes into your notes as a request,
   not into your commit. A shared helper keeps its signature: port its insides, not its callers.
3. **Never touch.** Flight and the dock — the author is porting them now: anything drawn in
   `G.mode==="system"` or on the station dock, `src/08b*` (the core, the pipe funnel, the warm-up
   table `08b1`), `16*`, `17*` (except `17z*` for the map ship), `13*`, `03*`, `12ai*`, `12i*`,
   `12l*`, and the instrument rack shared with flight (`25a`–`25e`). The air of landing and surface
   is frozen (PLAN G5): `19b-sky`, `19c-light`, `19c1-cast`, `19ca-gpu-sky`, `19d-weather`,
   `19e-clouds`. And: `PLAN.md`, `PATCHNOTES.md`, `docs/DESIGN-gpu.md`, `CLAUDE.md`, `VER`,
   `.github/`, `build.ps1`, `drift.html`, `tests.html`, `docs/INDEX.md`.
4. **Better, not the same** (DESIGN-gpu §0, §1). A ported layer looks better within the frame's
   laws — one light with a source, cold key and warm accent, grain instead of flat fill, motion not
   blinking, a shadow under what stands. Parity is the floor. Canvas 2D stays the brush for text
   and complex vector shapes, via `gpuBake`/`GcCtx` when it has to live on the GPU.
5. **Only painting changes.** Save format, `stateHash`, game logic and balance stay as they are;
   chance for visuals only through `rndFx`, never `rnd`.
6. **One commit per sub-item, pushed at once.** Before each push:
   - `pwsh ./build.ps1` clean, `node test-node.js` all green;
   - do not commit `drift.html`, `tests.html` or `docs/INDEX.md` — the build rewrites them:
     `git checkout -- drift.html docs/INDEX.md` before staging, stage by explicit path;
   - a whole-frame pair «before | after» of the scene you changed, shot with
     `python3 docs/shot.py <scene> --w 760 --h 475 --dpr 1 --out <scratchpad>/…` — «before» from a
     worktree of the fleet base, «after» from your build — kept in your session's scratchpad (never
     in git), with one line of what got better. Scenes are the `?s=` names in `docs/mkview.ps1`.
7. **Notes.** Keep `docs/fleet/<ship>.md` in your branch (English) and update it with every push:
   commits and what each changed; the pairs (scratchpad paths, one line each); requests for files
   outside your zone; new render pipelines, for the warm-up table in `08b1`; open problems.
8. **Words.** Code comments and everything the player sees stay Russian; commit messages and notes
   are English. End commit messages with the attribution lines your session gives you;
   `Co-Authored-By: …` is the last line.
9. **Files.** No images in git; UTF-8; keep every file's line endings byte for byte (`* -text`,
   the repo has mixed endings — write bytes, not text mode).
10. **Never** `drift-game.ru` — live shared pools; the network policy denies it anyway.
11. **Blocked?** A missing kit capability or a file outside your zone: write it in your notes,
    push, and carry on with the rest of your zone. Work until the zone is done.

## Ships

Wave 1 starts at once. Wave 2 starts when the kit ship's `Path2D` support is merged into the base.

| Ship | Branch | Zone | Goal |
|---|---|---|---|
| kit | `claude/gpu-kit` | `08c-gpu-kit` (additive only), `08ca-gpu-canvas`, `08cb-gpu-text`, `08cc-gpu-shadow`, `18c-chunks` | `GcCtx`: `Path2D` in `fill`/`stroke`/`clip` first, pushed alone (census gap 1, unblocks wave 2); then `createPattern` (gap 2); then `screenLayer` → `gpuBaked` |
| map | `claude/gpu-map` | `17z-map-backdrop`, `17z1-galaxy`, `17z2-galaxy-names`, `18-mode-map`, `18a-map-addr`, `18b-map-hold`, `18e-rail-net`, `18f-rail-station` | G10: galaxy backdrop as a field (`mapNebula`, `galBake`), stars as points, the rails; text stays 2D |
| road | `claude/gpu-road` | `18g-rail-ride`, `18k-rail-scheme`, `18h`–`18j` if they draw, `27l-road-draw`, `27la-road-sky`, `27lb-road-bloom` | G12: the road's CPU bloom field (`roadBloom`, `putImageData` 26 Hz) becomes a shader; the rail ride |
| scoop | `claude/gpu-scoop` | `19a-mode-scoop` | G9: the gas giant as a live flowing field (`giantTex` → `gpuField`) |
| belt | `claude/gpu-belt` | `24-mode-belt`, `24b-belt-poi`, `24ba-belt-gpu`, `24bb-belt-poi-gpu`, `24bc-belt-hud`, `24d-range`, `25-cockpit`, `25f-globus` | G8: the asteroids in real 3D (`gpuScene3D`, depth, per-pixel light), the backdrop in one pass; the cockpit |
| rooms | `claude/gpu-rooms` | `29c-home-in`, `29d-home-draw`, `29e-home-up` (after the kit's `Path2D`), `29f-winter`, `29g-winter-draw`, `29h-spa`, `29i-spa-draw`, `27da-kino`, `25n-chess` | G11: home, winter, spa, kino, chess — parts baked, light and air on the GPU |
| hq | `claude/gpu-hq` | `27c-ui-hq`, `27f-hq-room`, `27d-ui-cantina`, `27d-ui-cantina-props`, `12v-wander`, `12va-wander-cosm`, `24c-mode-wanderer`, `24c-mode-wanderer-draw`, `24a-mode-raid`, `24aa-raid-draw`, `24ab-raid-foe` | G11: HQ, cantina, «Сорока», the raid. HQ and cantina open over the dock or flight: port their own canvases only |
| life | `claude/gpu-life` | `20-life`, `20c-peep`, `20d-jetpack`, `20e-species`, `20f-fauna` | the shared painters: `drawAstronaut` (5 modes), `drawBeast`/`drawBeastAlien` (4), flora — once, behind the same signatures (G6) |
| places | `claude/gpu-places` | `11g`, `11h`, `11i`, `11j`, `11l`, `11o`, `11p`, `11v`, `21f-home-out`, `21g-greenhouse`, `21h-pennant` | the surface's regional passes and quiet features (G6) |
| tools | `claude/gpu-tools` | `test.ps1`, `docs/mkshots.ps1`, `docs/mksiteshots.ps1`, `tests/90-harness.js`, `tests/90a-tools.js` | G13 in the cloud: `test.ps1` finds `/opt/pw-browsers/chromium` and runs on SwiftShader (Windows unchanged); which browser suites pass there and what they cost; the shot scripts through `docs/shot.py`. No `.github/` — the CI proposal goes into notes |
| surface | `claude/gpu-surface` | `21-mode-surface`, `21e-surface-draw`, `21e1-surface-world`, `21b-surface-deco`, `21ba-deco-shapes`, `21bb-deco-biomes`, `21c-built`, `20a-poi`, `20aa-poi-shapes`, `20b-poi-find`, `18b-geology` | wave 2 — G6: ground chunks and far ridges as textures, deco as sprites where order needs it |
| landing | `claude/gpu-landing` | `19-mode-landing`, `19-mode-landing-ground`, `19f-lander` | wave 2 — G6 for landing: the ground and the lander; the air stays frozen |
| base | `claude/gpu-base` | `21a-mode-base`, `21aa-base-rooms`, `21ab-base-interiors`, `21ab-base-interiors2`, `21ab1-base-ground`, `21ac-base-draw`, `21ac1-base-banya`, `21ac2-base-farm`, `21ac3-base-van` | wave 2 — G11: the base in cross-section |
| underground | `claude/gpu-cave` | `22-mode-cave`, `22a-cave-deco`, `22b-cave-props`, `23-mode-dig`, `23a-dig-draw`, `23aa-dig-rock`, `18a-material`, `18a1-glaze` | wave 2 — G7: tiles as textures, darkness and lamp light per pixel, ore glows, dust |

Postcards (G14, «if it reads better») wait: no ship.
