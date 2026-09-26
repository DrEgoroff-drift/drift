# Fleet → main, second merge (26.09)

Worker session «Флот: облако → main»; Контроль is «Оптимизация разработки». Worktree
`C:\Claude\drift-fleet`, branch `fleet` (from `b485d068` = `origin/claude/fleet-accept`).

## Where it stopped

- [x] 0. History: one `git fetch --deepen=200 origin` → merge-base(da6b1bfa, origin/main) = db057213.
- [x] 1. Zones merged, all clean: gpu-surface 49fd6863, gpu-belt 7fa944d8, gpu-landing 6c167bab,
  gpu-cave cb950e7f, gpu-road 72938bc0.
- [x] 2. origin/main 4778c719 (0.467.0) merged — `a860d9ce`.
- [x] 2b. Interface drawn after `gpuWorld` (the cloud's zones still expect `#hud`) → `#ovl`:
  only the road did it (see below).
- [x] 3. Checks at 39fe6de3: Node tier green; `-Full` and `-Mobile` red only on golden frames
  (Контроль's call); `docs/tour.py` green. The pipeline table (`08b1`) was re-accepted with
  `-Accept -Only конвейеры` by the author's word in chat; golden frames were not touched.
- [x] 3b. The hq / hqfull stands open HQ with `openHq()` (`#hqbtn` is gone) — f1f868d6.
- [x] 3c. The 2D census over 25 scenes, the bake pool's ceiling, the guard for 2D after
  `gpuWorld` — a5e849e3 (see below).
- [x] 3d. origin/main 43155172 (0.469.0) merged — deab3172; conflicts only in build artifacts.
- [x] 3e. `-Full -Jobs 3`: red only on golden frames (the same 13 scenes, the same numbers);
  pool numbers per suite taken, the `·pool` log line dropped; `once` sets die after their bake.
- [x] 4. Pairs 760 / 390 against origin/main (Контроль's review of the 760 set).
- [x] 5. Regressions, each with a 760 + 390 pair and a ×3 crop: map core 32e65aea; lamps,
  base sky strip, scoop lilac 17646e20; cave and mine a84a864b; out-of-memory fallback for
  the big bake set 53491f3b; panel rooms (black since the deab3172 merge), cantina light
  slots, kino screen, HQ vignette 1a9928ee; the lander at night d73ce4b1 (see below).
- [x] 5b. Cave and mine to main's colour, Контроль's gates per zone (L ±5 %, mean S ±10 %,
  hue ≤ 5°, σ of luminance not below main's by more than 5 %): mine and dig pass; the cave
  passes 6 zones of 8 — the two near-grey zones by the lamps fail on hue alone (see below).
- [x] 5c. Kino: main's canvas, the sign's own light (see below).
- [x] 5d. The winter caption: 390 3.47 (main 2.83), 760 4.77 (main 4.19) — see below.
- [x] 5e. Base, home and winter re-shot after the shared material change: equal to the frames
  before it (luma ratio 1.000 over a 4×4 grid at 760 and 390), except the winter caption.
- [x] 5f. origin/main 645732e4 (0.475.0) merged — 23f2d907; the one conflict is `08b0`
  `GPU_PIPE_ONE`: main's `gnb.fade`, `par`, `par.add` plus the fleet's belt loop.
- [x] 5g. The winter heroine over the room's light, the lever labels in two rows — 85f58892
  (see below).
- [x] 5h. The gates tool, Контроль's rule: hue is compared only where S ≥ .12 in both frames,
  below that every channel's mean within 2/255 of main's. Cave and mine pass all zones (the
  two grey zones by the lamps: d 1.8 and 0.1).
- [x] 5i. Material in main's stand frames: the surface carries it (the chunks wait for
  `tr.mat`), the base draws it live every frame; the race was underground only. Base, home and
  winter differ from main by the fleet's light, not the material (base +4…+28 % luma, home
  −18…+11 %) — Контроль's call.
- [x] 5j. origin/main b8191a35 (0.476.0) merged — 485ba8a7; conflicts only in build artifacts.
- [x] 5k. Base craters, winter levers under the lamp, labels not below 9 px (see below).
- [x] 6. Sheets 390 / 760 of all zones at 485ba8a7 with a line per scene → Контроль (pairs35).
- [x] 6b. The night surface is not black: the 93 s was the machine's load. Its cost, alternating
  fleet/main runs at 390 taken BEFORE 21:00 (not accepted — GPU-3's tiers loaded the CPU): fleet
  mean 5.6–7.0 ms, main 5.5–7.2; single fleet peaks 18–20 ms (main ≤ 12, once 17). No pipeline
  compile and no bake in the measured frames; the peaks land in random functions (weather,
  relight, front copy) — GC or contention suspected. An accepted A/B/A on a quiet machine is owed.
- [ ] 7. `-Mobile`, `docs/tour.py`, cadence on the PC (390×844 and 760, marked «ПК» — no S23
  until the author says so); drop the PLAN.md «In flight» fleet line; hand over the hash.
- [ ] 8. **Stopped 26.09 ~21:00** by the author's word (one worker does everything next; the
  graphics pass happens with the author before the release). The WIP commit on 72f7039d holds:
  HQ figures and labels laid `hull` (the light pass reads their mask from the scene alpha and
  gives them main's vignette only), the table laid `opaque`, feet on `fy-4`; the spa board text
  and people in their own bakes after `spaAir`, the board sized to its lines (font ≥ 9 px),
  `spaBoardGrid` shared by drawing and `spaHit`, a browser test «санаторий: строки щита…»; the
  rule «people and lettering after the light» in `docs/DECISIONS.md`. None of it was test-run.
  Open, with what is known:
  - HQ figures on a shared figure mask at 760 vs main 0d1e8255: L +17.5 % (left) / +6.6 %
    (right), S −5.3 / −3.8 % (gate L ≤ +5 %, S ≥ −8 %). Cause: the table bake laid `opaque`
    covers the figures with its faint glow, scene alpha ≈ .08 there, so ~8 % of the lamp-lit
    colour comes back. Lay only the solid table `opaque` (its glow `add`), or harden the alpha.
  - Spa board: fits the paper at 390 now, but at 9 px (main 14 px, overflowing) it reads small and
    faint on the sun-lit paper; ink contrast not measured. A 26-character header cannot pass
    ~10 px at 390 — split the header into two lines rather than shrink.
  - Home figure (≤ main +5 %) not measured: home's people come in through the 2D front copy and
    take the `hin.light` multiplier and haze, so they need the same mask treatment. Cantina
    people not checked.
  - Not started: the road glow (L .82–.85 against main), winter 760 S (.84 → ≥ .92), the
    descent / cold-start / black-room tests, `-Mobile`, the tour, the full run, the cadence.
  - Pairs against 0d1e8255 (spa, hq, hqfull, home, kino, cantina at 760; spa, hq, hqfull at
    390): `%TEMP%\claude\C--Claude\253595ac-…\scratchpad\pairs36\{760,390}`.

## Decisions

### The belt cockpit: main's, one
Two cockpits met. The cloud (ee8db0c3, 1ab0f007) drew the frame as a scene field `belt.ckpt`
lit by the star through the glass (edges towards the star catch light, the star's veil, ghost
and scratches on the glass), with the lamps as scene discs and the instruments and glass
symbology on the 2D `#hud` layer (`gpuHud`). Main (725037ad) moved the whole cockpit — frame,
panel, tape, glass — into a master baked in four bands by the 17a0 oven plus live `#ovl`
primitives, and then removed `#hud` altogether (9715711a).

Kept: main's. The cloud version cannot stand without `#hud`, and `#ovl` has no clip, so a
frame in the scene under `#ovl` would let the pitch ladder and target frame cross the struts
(main hides them under the opaque master frame). Main's also carries the entry-frame work
(26.5 → 20.6 ms at 760) and its gate, key oracle and mutants.

- `src/25-cockpit.js`, `src/24bc-belt-hud.js` — as in main.
- `src/25-cockpit-gpu.js` removed; its two Node suites in `tests/91zzzzzzy1a-belt3d.js`
  («кабина пояса: план без 2D-холста…», «лампы стоек кабины…») removed.
- `src/24ba-belt-gpu.js` keeps the cloud's second scene pass (`p2` after the 3D rocks) without
  the `cockpitGpu` call.
- `tests/91zzzzzzy1-gpugate-belt.js` header and `tests/mutants.json` — main's cockpit side
  (`belt-led-hud`, `belt-hud-key-*` go with the cloud cockpit).

What is lost against the cloud: the star light on the frame's edges and the star's veil/ghost on
the glass. If Контроль wants it back, the way is a lit-master kind in `#ovl` (the image kind
sampling the master's alpha towards the star), not a second frame.

### The bake pool: a ceiling, a guard, `once` sets
Main's pool (0.469.0) evicted by age into `GPU.trash` and sent `once` sets and sets above half the
ceiling to the trash too — each lived until the next `gpuFrame`, so a burst of bakes in one frame
held all of them at once. Here:

- `GC_POOL_CAP` (80 MB) bounds the pool's live sets plus those waiting to be destroyed, at every
  moment. Room is made *before* a creation: the oldest cold set no bake holds is destroyed at once.
  That is legal because pool textures are written only in the bake's own encoder, which is
  submitted inside the bake. The warm sets (`GC_POOL_WARM`, ~54 MB) are never evicted.
- A set handed to the bake being encoded is never destroyed before that submit: it waits in
  `dead` for `gcPoolFlush` (the end of the outermost `gpuBakeRedo`).
- A `once` bake's set lives for that one bake and dies right after its submit: the rack master
  2508×1008 (60 MB) and its shadow (65 MB), the belt cockpit, the instrument. Same number of
  creations as main, a frame less of life.
- A set bigger than the room the ceiling leaves above the warm sets (~24 MB: a full-frame room,
  the base's world-size layers) lives the same way — one bake, destroyed after its submit. A
  re-bake creates it again, as main's pool does with sets above half its ceiling (Контроль, 26.09:
  holding 131 MB for the whole base visit on a phone is a regression).
- The per-role slot (`Q.one`) keeps only a set that fits under the ceiling but found no room
  because the sets in its way are busy; it goes when replaced or when the scene changes
  (`gcPoolLeave` from `gpuFrame`).
- The guard in `tests/90-harness.js`: a suite whose pool peak passes the ceiling is red.

`-Full` with once sets dying after their bake (d8ec2fac): pool peak ≤ 79.8 MB in every suite;
61 `once` creations (rack, pipelines, the 2D gates, cockpit, the after-world guard, gestures).

The largest moment is 272 MB: the base at 2560×1440 — pool 74 MB plus the set of one
base layer, 4096×2112 at 4× MSAA with stencil = 198 MB. Measured on the base stand
(`baseBake`, all four world-size layers):

| window | layers above the free room | peak, all |
|---|---|---|
| 390×844, DPR 2.625 | 1587×1350 | 131 MB |
| 1280×800 | 1536×832 | 108 MB |
| 2560×1440 | 3021×944, 3474×944, 4078×2092, 2039×1046 | 277 MB |

Where the peak stays and why: the instant peak (277 MB at 2560×1440, 131 MB at 390×844) is the
base's own bake. The base on the GPU is the fleet's (a850203f, 25.09); main draws the base in 2D
and has no such bake, so this peak is new against main (first reported as main's — corrected
the same day). After Контроль's decision nothing of it is held past the bake's submit. Tiles
(MSAA kept, a tile ≤ 24 MB living in the pool) are a G15 item unless Контроль moves them up.

### The guard: no 2D on `#c` after `gpuWorld`
`tests/91zzzzzzy6-after-world.js` hooks `#c` the way 08c does (`gpuFrontHook`, then `MAIN_CTX`'s
own methods — prototype wrappers are blind to them) and runs every `lookScenes()` scene and the
road for 12 frames. After `gpuWorld` the count must be zero, and a scene that uploads `#c` must
also show a 2D call (the hook's truth check). A self-test injects one `fillRect` after
`gpuWorld` and expects exactly one. GPU-3's `91zzzzzzy3-gate2d` wraps prototypes only, so on `#c`
it sees setters but not method calls.

### Ground grain on the landing
Main's 9ee4edff (`planetMat` steps its own job, `matRows` for the planet frame) and the cloud's
shared chunk recipe (`groundChunkStore`/`groundChunkPaint`, 19-mode-landing-ground) agree:
`drawLanding` and `drawSurfaceWorld` ask `planetMat(p)` every frame, and the chunk path is taken
only once `tr.mat` is ready, so the chunks bake with grain.

### Interface after the world: `#hud` is gone, the road moves to `#ovl`
In the fleet's base `gpuWorld` switched `ctx` to the `#hud` layer, so a zone could draw its
numbers after the world. Main removed `#hud` (9715711a): after `gpuWorld` `ctx` stays on `#c`,
which nobody shows any more, and `gpuHud` no longer exists.

Census (every 2D draw call on `#c` counted after `GPU.wDone` or outside a GPU frame, 25 scenes:
map, landing, surface day/night/noon, cave, dig, home ×3, kino, hq, raid, winter, spa, system,
dock, cockpit, rack, belt, scoop, base, wanderer, road): zero everywhere except the road, which
crashed on `gpuHud`. The road now queues its numbers into `#ovl` *before* `gpuWorld` through
`roadOvl()` (27lc) — a small 2D-shaped adapter (fillText, fillRect, strokeRect, measureText,
save/restore) over `ovText`/`ovRect`, so the drawing code in 27l did not change; the coins stay
on `#c` as world light. `roadGpuMount` moves `#ovl` with `#g` into `#roadwin` and back.
The stand scenes `hq`/`hqfull` fail on main too (`#hqbtn` is gone from the shell) — for pairs
the HQ is opened with `openHq()`.

### Panel rooms: main's two-group image, the cantina's uniform slots (1a9928ee)
Main 43155172 gave `kit.img` an explicit layout of two groups (uniform + arena; texture +
sampler, cached per view). The fleet's `rpgImage` (27f1) kept binding one group of four to the
same cached pipeline: every bind group failed validation and HQ, the cantina and the kino hall
drew black — the merge was clean in text and broken in meaning, and `-Full` did not see it.
`rpgImgBind` binds the panel's own uniform and buffer as group 0 and takes group 1 from the
kit's cache. The census of GPU errors per scene (pair.py `gpu.errs`) is the net for this.
The cantina's light pass read `[n, cone, pow]` one slot off since 685ba474: the lamp count
worked as the cone, the cone as the power, and the show's dimming never reached the shader.
The kino screen is self-lit — the light pass leaves `kinoScreenRect` unlit. The HQ vignette is
an ellipse over the room: a circle by height put both outer seats of a wide panel at ×.38.

### The lander at night (d73ce4b1)
Контроль's measure: the hull's mean brightness at night at least 60 % of main's 2D. The cold
floor of the hull light went from (.13,.16,.22) to (.38,.43,.55) (still by `sky`, the top takes
more than the belly), the top edges take a cold rim of sky, and the cabin glass glows from
inside inside a frame per hull form. No uniform slot was free: the flame colour and the 1.25
gain became constants. Night 61 / 60 % (760 / 390), rain 67 / 65 %, from 42 / 40 and 51 / 48.
Measured on a hull mask from main's frame, the fleet's frame aligned by its edges.

### Cave and mine: main's colour (26.09)
Контроль's eye: both paler and greyer than main while the numbers passed. The causes, in order of
weight:

- The helmet beam was drawn with `lighter` on `#c`. The front layer is laid over the scene with
  alpha, not added, so the beam covered the rock with its own colour instead of lighting it. The
  beam is now added on the GPU (`helmBeamGpu`, 22c) in the cave and the dig;
  `drawAstronaut({lamp:"gpu"})` skips the 2D beam.
- Main's darkness is a 2D radial gradient from transparent black. Chrome interpolates gradient
  colours unpremultiplied, so the tone falls quadratically, not linearly: `WARM_GLOW` profile 2
  is `.18*e*e`. The floor spot and the cone walk main's colour stops, colour and alpha apart.
- The fleet's tone shoulder on the largest channel took red out of the moss petals and the
  pass's turquoise (petal core 190 vs 216): the dig and the cave use main's per-channel
  shoulder (`gpuHueFor`), the front-like clamp and bloom weight in the final pass (08b).
- Main's frame has no planet material on the cave walls: its tile bakes before the material is
  ready and is never baked again. The fleet re-baked with the material (`|m`) and the rock went
  grey. The walls carry the strata only, as main shows them; `fillMaterial` on the GPU canvas
  lays main's `overlay` (18a) instead of a third-strength `source-over`.
- Plants and beasts are drawn after the light, as in main (under the field they lost a quarter
  of their brightness).

Cave at 760 (pairs28), fleet against main: pass L −0.5 % σ +5.7 %, water L −1.0 % S −3.8 %,
rock L +1.6 %, beam −0.1 %, flowers σ +1.7 / +2.9 %. The pass by the lamp (hue 15.5°) and the
rock by the lamp (6.2°) have S .08 and .06, where a hue is a rounding: mean RGB 153.1 / 155.6 /
151.2 against 153.0 / 157.5 / 151.7. What is left is green about 1/255 low over the whole lit
hall — the tile bake (main's 8-bit 2D canvas against the fleet's GPU canvas), ~0.3 of it bloom.
More than an hour of work; open with Контроль.

### Kino: main's canvas, the sign's own light
The screen is main's again: smooth cream with its own grain and sheen. The scratches read as
seams, and the hot middle with falling corners and the breathing lamp greyed the canvas and took
the image's contrast. The cantina's light pass leaves both the screen and the session sign
(`kinoBillRect`) to their own light — lamps, dust, shoulder and the pass's grain do not touch
them (the grain on cream read as crumpled paper) — and gives them main's vignette. The lamps stay
at .18. The ink of the picture against the canvas: 1.93 vs main's 1.90 at 760, 2.14 vs 2.09 at
390; the canvas's luma ratio grid 0.998–1.004. The sign: 1.83 vs 1.71 (760), 2.47 vs 2.42 (390).

### The winter caption
The fleet's lamp lays light over the planks, and the wall under the event line is lighter than
main's (390: 1.45 against 2.83). In the winter mode `#msg` gets `.dim` (27z): a dark tone under
the letters and its own blurred shadow of the same tone, so the backing fades out beyond the line
with no edge. No padding: `#msg` is fixed at `left:50%`, so padding narrowed the line (half the
screen) and let the phone's `line-clamp` show a fourth line; the element's own shadow is not
clipped by its `overflow:hidden`. With a panel open the shadow is off.

### The winter heroine
The fleet laid the stove and lamp light after the props bake, the figure included: the coat went
rust-brown, the felt boots lost their contrast, the floor spot washed out the shadow under the
feet. The figure is its own bake (`win.fig`, in whole device pixels) drawn after `winLight`, as
in main — the light falls on the floor and the walls under her. The frame's halo still lays 2–8
levels of warm light over her from the brighter room, so her paint is denser by that much (body
×0.93, boots ×0.90) and the shadow is .44. Against main: coat −3.3 % (760) / −1.7 % (390), boots
−1.8 % / +0.9 %, floor beside the feet over the shadow 1.70 / 1.57 (main 1.44 / 1.53).

### Lever labels on a narrow frame
At 390 a lever is 19 px wide and «АНТЕННА» at the frame-height size is 46 px: the four labels
ran into one word (main too). `winLeverLabels()` is one layout for the frame and the check: a
label wider than its lever puts them in two rows, every other one, and the size goes down until
a label fits two levers, never below 9 px (Контроль: 7 px does not read on a phone); when the
full names do not fit even so, the short ones go in — ТЕПЛ / ВОЗД / СВЕТ / АНТ — not a smaller
size. The check (91zzzj) walks 390, 360, 760, 1280, 1920: no two label boxes meet, none below
9 px, all inside the frame.

### The levers under the lamp
In 85f58892 the panel instruments were part of the props bake, under the room's warm light: the
steel went pale beige on a beige wall. The instruments and the fault lamps are now their own
bake (`win.panel`) laid after `winLight`, as in main. The wall under the light is brighter than
main's (760: luma 79 against 61), so the steel is painted darker than in 2D and the shafts take a
colder steel (`WIN_C.steel`): the frame's warm halo ate their blue. Contrast to the wall, 760
(main): luma step heads 18.8 (7.3), shafts 14.6 (11.3); RGB distance heads 41.0 (32.4), shafts
38.5 (35.1). At 390 the wall is lighter still: steps 58 / 52 (main 6.7 / 1.3).

### Base craters
Контроль saw main's two craters nearly gone. They are the painter's boulders («валуны и
прожилки», `21ab1`); main draws them in screen space (`BR()*W`), so they stay on the glass while
the rock pans, and the fleet bakes them into the rock: main's bottom crater is the same boulder
(#23, r 20.4) 27 px to the right, the left one by the pad is off screen. What drowned them was
the air field (add): it laid the material as a film over the painted rock, 22 of 37 levels, and
the grain, veins and boulders under it lost their shadow. Main's order is material first, grain
and boulders over it — and `21ab1` already said the light field lays the material by
multiplication. Now it does: the film is gone, the material colour and grain are a multiplier in
the light field, and the strata are painted weaker (main's film dimmed them). Boulder #23 at 390:
shadow ring/pit 1.245, rim cap/pit 1.324 (main 1.182 / 1.167); rock luma 36.8 (was 37.0, main
30.3); step between strata 1.35 (was 1.33, main 1.27).
