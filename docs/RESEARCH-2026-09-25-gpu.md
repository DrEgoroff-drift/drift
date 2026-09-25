# Research of 2026-09-25 — the renderer: what the web does, what tholman does, what we take

The author, 25.09: «изучи репозитории tholman… движок… погугли какие фишки применяют… выбери лучшие».
One session, solo. §0 is where our renderer stands (read from the code, not from memory), §1 the picks in
order of worth, §2 what is worth taking from github.com/tholman, §3 what was looked at and rejected, §4 sources.
Nothing here is done; the picks that pass become PLAN.md items in their own place (§0 of the plan).

One correction of words: the engine is **WebGPU**, not WebGL (DECISIONS «The renderer», 23.09). WebGL tricks
still apply where they are about bandwidth and passes; the extra levers are WebGPU-only (compute, storage
buffers, immediates, f16, timestamp queries).

## 0. Where we stand (0.4xx, branch `gpu`, 25.09)

- **Frame:** the world into `scene` (rgba16f, full backing res) plus `emit` (rgba16f, second target of the
  `comp` pipeline); the nebula at ¼ res, recomputed when the camera moved or every third frame, composed in
  two full-screen passes; the 2D canvas `#c` copied into `front` once a frame (`gpuFrontCopy` — the upload the
  §0 gate drives to zero); the HUD is a DOM canvas over the WebGPU canvas, never in the frame.
- **Post:** `fsDown` (16 taps of front + scene + emit at ¼ res: knee 1.4, plus the paint glow `c*c` the plan
  retires) → five `fsMipDn` levels (5-tap Kawase down, a knee per level) → five `fsMipUp` (8-tap tent, additive,
  warmer with level) → `fsFinal` (tone, grain, vignette, haze/shock refraction, ui). That ladder **is** the ARM
  dual filter (Bjørge, SIGGRAPH 2015) — the cheap mobile bloom the web recommends; we already have it.
  12 of the 15.4 passes a frame are this ladder plus final (PLAN §0 «Heat margin»).
- **Dead in the frame:** the pipelines `blurH`/`blurV`, the `blur()` WGSL and `u.sigma` — built in `gpuPipes`,
  never drawn by `gpuBloom`.
- **Kit:** instanced quads (`draw(6,n,…)`), one bind group layout with 9 bindings, a 528-byte uniform written
  once a frame, timestamp queries when the adapter has them (`prof()`); `gpuScene3D` with `depth24plus`,
  `depthStoreOp:"discard"` (right for a tile GPU). **No compute pipelines anywhere.** `alphaMode:"opaque"`,
  preferred canvas format. Requested features: only `timestamp-query`.
- **Phone:** S23, Adreno 740 — a tile-based GPU: a render pass costs a tile load + store per attachment, so pass
  count matters more than taps; 16-bit math runs at about twice the rate and half the power of 32-bit
  (Qualcomm's guide). The world runs at DPR 1.5, the HUD at the native 2.625.

## 1. The picks, in order of worth

Each: what, why, the cost, where it lands. «Measure» means `prof()` on the S23 and the 760 pair, as the gate says.

**P1. The bloom ladder in half the passes (mobile, first).** The five `fsMipUp` passes go: `fsFinal` samples the
five mips itself with the same tent weights and the same per-level warmth (five texture reads instead of five
render passes). The ladder is one texture with mip levels; no level narrower than 6 texels (the phone's ¼-res
base ~146×316 gives 5 levels, the laptop 6 — the look needs the same count, texel size in CSS px is alike).
`blurH`/`blurV`/`sigma` deleted. Result: 12 passes → 6 or 7, the picture the same up to the chained blur
(check in the pair). **Done 0.459.0–0.460.0**: pair `system` max|d| 3, 0.00 % > 8 (laptop and S23 emulation);
bloom off for the same frame gives max|d| 70 on 22 % of pixels, so the pair does measure the bloom. **But the
premise was wrong on the S23**: the ten tiny ladder passes cost 0.12 ms together (a pass is ~10 µs there),
and the final reading five levels at full resolution cost +0.34 ms; 0.460.0 sums the upper levels in one pass
at ⅛ resolution (0.02 ms) and the final reads two taps — frame 9.8 → 9.6 ms, within the run-to-run noise.
Lesson: on this GPU count taps at full resolution, not passes.
A further step, only if the pair asks for it: `fsDown` merged into level 1 (the knee at ¼ res straight from scene).

**P2. `shader-f16` for the post chain and the nebula.** **Measured 0.460.0, left off**: requesting the feature
made every pass on the S23 ~6 % slower (nebula 2.43 → 2.63 ms, `under` 3.30 → 3.50, A/B on the same build with the feature switched off by the URL,
i.e. the same shaders), and the ladder in f16 gained nothing (texture-bound). The code keeps `H`/`H3` aliases and `?f16=1`
for a re-measure elsewhere. The original idea: request the feature when the adapter has it, `enable f16;`
in the WGSL of the ladder, final and the nebula field; positions and uv stay f32. On Adreno that is ~2× ALU
throughput and half the power for those passes (Qualcomm). Risk: banding in the HDR ladder — bloom in half floats
is the industry default (the render targets are rgba16f already). Cost: an hour; measure with `prof()`.

**P3. L4 particles on compute (the first compute pipeline).** Exhaust, sparks, burst debris and smoke as a storage
buffer of particles, ping-pong, stepped by a compute pass (curl noise in WGSL, temperature ladder from age),
drawn as instanced quads straight from the buffer. Zero CPU per particle and zero uploads a frame — exactly the
§0 gate («uploads 0, submits 1»). Demos run 250 k–1 M particles at 60 fps in the browser; we need thousands.
Lands in L4. The kit gets `gpuCompute(name, wgsl, buffers)` once; P5 and G9 reuse it.

**P4. Light in caves and rooms: a distance field, then cascades.** G7 asks for «darkness and lamp light per pixel,
a cone with soft shadows from rocks». The cheap, right tool: a jump-flood distance field of the cave's occluders
(static per chunk, computed once), then per-pixel light for a few lamps with SDF soft shadows (jason.today/gi).
The upgrade when one lamp is not enough (rooms with many lights, bounce off warm walls): **radiance cascades** —
2D global illumination with soft shadows and bounce in a handful of passes; a WGSL implementation exists (MIT,
0.36 ms at 1080p on a desktop GPU; at our ¼ res the phone is realistic, measure). Lands in G7 and G11.

**P5. The star (G2) with numbers.** Granulation as Worley (cellular) noise, two or three generations drifting so
it boils; limb darkening by the quadratic law I(μ)/I(1) = 0.30 + 0.94 μ − 0.24 μ² — this closes the «flat
orange ball» item (R ≤ 245 on the limb falls out of the law); spots as dark umbra + filamented penumbra in
latitude bands; the texture sheared with latitude (the equator leads). Corona and prominences as in DESIGN-gpu G2.

**P6. The nebula (L1): a colour LUT per star class.** Our L1 recipe (domain-warped FBM, absorption, three
parallax layers, shafts) matches what the web does for real-time nebulae. Two things to add: a 1-D
density → colour ramp per star class (Pegwars samples them from NASA photographs; ours hand-made per class,
2–3 hues ≥ 90° apart as L1 says), and the warp kept subtle — iq's article and Pegwars both warn that strong
warping «degenerates into a mess». The star inside the gas: in-scatter added along the march, density-weighted.

**P7. Immediates and buffer hygiene, only if `prof()` says JS-bound.** Chrome 149+ has `setImmediates`: a few
bytes of per-draw data straight to the shader, no uniform offsets, no bind group per object — right for chips,
labels and lit sprites. webgpufundamentals measured: one big uniform buffer with offsets instead of many
`writeBuffer` calls −40 % JS time; mapped staging buffers +87 % objects/frame. Our census is by uploads and
submits, not by draw calls, so this is a reserve, not a step.

**P8. Sharpness on the phone: RCAS.** The world runs at DPR 1.5 and the compositor scales it bilinearly to 2.625.
A 5-tap RCAS (FSR 1.0's sharpening, WGSL ports exist) at the end of `fsFinal` sharpens the world before the
scale for the price of five reads. EASU (the 12-tap edge-adaptive upscale) would need the canvas at native res
— a full native-res pass; an experiment, not a step. The pair at 390×844 judges.

**P9. Formats and flags to check on the S23, one line each:** `rg11b10ufloat-renderable` for `scene` halves HDR
bandwidth — but it has no alpha, and `sil()` reads `S.a`; only if that mask moves to `emit.a`.
`GPUTextureUsage.TRANSIENT_ATTACHMENT` (Chrome 146) for the 3D depth: no VRAM allocation for a target that is
never stored (we already discard). `adapter.info.architecture` («adreno-7xx» / «mali-…») to pick the phone
profile instead of DPR and UA guesses.

## 2. tholman — what is worth taking, and where it lands

Tim Holman's 66 repositories are toys, libraries and generative art, all Canvas 2D or DOM, MIT. None is a
renderer; the value is ideas that fit rooms, cards and easter eggs. In order of worth:

- **image-nodes** (particles from a picture's pixels) → **the burst (L4):** a destroyed hull dissolves into
  particles made of its own baked pixels, lit by fire and star, instead of a generic debris sprite. Pairs with P3.
- **rasterizer** (2026; halftone dots sized by brightness in the image's own colours) → **the postcard as a
  print** (G14, the postcard painter): one shader pass turns the frame into a printed card — dots, paper grain,
  the frame's colours. The album and the site gallery get a look nobody else's screenshots have.
- **generative-artistry** (his tutorials: tiled lines, Joy Division, cubic disarray, triangular mesh, circle
  packing, hypnotic squares, Mondrian, un deux trois) → **pictures on walls (G11):** base, home, hotel rooms,
  the cantina and HQ get framed procedural pictures by seed, baked once as textures; the same algorithms give
  station facade panels and cargo labels. Cheap, endless, in the game's own hand.
- **tetris-pieces** (an AI playing Tetris on a wall) → **life in rooms (G11):** a wall screen in the cantina or
  HQ that plays itself. One canvas bake every second, a texture on the wall.
- **ascii-morph** (morphing between two ASCII pictures) → **the night ether (25l) and the table (27i):** the
  receiver's text card morphs between stations instead of cutting; the boot and the «СБОЙ ·» screens too.
- **abstract-clocks** → **an instrument on the rack (25d):** ship time told abstractly (rings, bars), one more
  quiet instrument for the flight HUD pass.
- **the-zen-zone** (a breathing guide) → **the hotel (17l):** «a door for quiet things» — a breathing room as a
  hotel service, no words, no score.
- **elevator.js** (a lift with lift music) → **the metro (DESIGN-metro):** the ride between stations with a
  track from 10a-radio; a smile, not a feature — the author decides.
- **s.js, console-fright-night, dom-animator, bsod.js** → **easter eggs:** the cool S scratched on a cave wall;
  a greeting in the console; an ASCII ship flying through the site's HTML comments; the frame guard's «СБОЙ»
  dressed as a birchpunk blue screen. An evening's work, the indie-web spirit the game already has.
- **intense-images** → the site's gallery: pan a big shot by mouse. Small, site only.

## 3. Looked at, not taken (and why)

- **Render bundles:** they pay when a scene is replayed unchanged; our world is rebuilt every frame and the
  HUD is DOM. Nothing to bundle (toji.dev).
- **OffscreenCanvas + a render worker:** the S23 profile showed the frame waiting on seams between `#c` and
  Dawn, not on JavaScript; a worker moves the seam, does not remove it, and the game's `ctx` is one global.
  Not now.
- **HTML-in-Canvas** (`copyElementImageToTexture`, Chrome 148–150 origin trial, ship expected late 2026,
  Chrome only): would put the DOM chips into the GPU frame under post. Watch it; nothing to do yet.
- **MSDF text on the GPU** (the WebGPU sample): the answer if DOM chips ever cost too much. The decision of
  24.09 (UI on its own canvas, text stays Canvas 2D) stands.
- **Vello** (Rust/wasm compute-centric 2D renderer): a foreign body in a hand-written JS game, mobile unproven.
- **cursor-effects, github-corners, zenpen, office-simulator, the-vintage-web, toms.toys puzzles:** desktop or
  off-theme; the frame laws forbid twinkle, and a daily puzzle in the cantina is a design question, not a port.
- **Texture compression (ASTC):** our textures are baked at runtime on canvases; no encoder in the browser.
- **Platform coverage, for the record (WebGPU only, no fallback):** Chrome/Edge since 2023 (Android since 121,
  Android 12+, Qualcomm/ARM), Safari 26 (iOS/macOS 26, June 2025), Firefox 141 Windows (July 2025), 145
  macOS Apple Silicon; Firefox Android behind a flag, promised late 2026. Compatibility mode (GL ES 3.1)
  shipped in Chrome 146 — `featureLevel:"compatibility"` widens Android if we ever need it; our WGSL has
  nothing compat forbids except what P3 adds (compute is allowed in compat).

## 4. Sources

- tholman: https://github.com/tholman (repos via the API, 66), https://tholman.com/, https://toms.toys/,
  https://generativeartistry.com/tutorials/, https://tholman.com/rasterizer/
- WebGPU practice: https://toji.dev/webgpu-best-practices/ (render bundles, bind groups, buffer uploads),
  https://webgpufundamentals.org/webgpu/lessons/webgpu-optimization.html (the measured steps)
- Chrome «What's new in WebGPU»: 146 (compat mode, transient attachments), 149–150 (immediates),
  151–152 (subgroup size control), 153–154 (buffer_view, swizzle assignment):
  https://developer.chrome.com/blog/new-in-webgpu-146 … /new-in-webgpu-153-154
- Tile GPUs: Qualcomm «Adreno GPU on Mobile: Best Practices»
  https://docs.qualcomm.com/bundle/publicresource/topics/80-78185-2/mobile_best_practices.html;
  Vulkan guide, tile-based rendering best practices
  https://docs.vulkan.org/guide/latest/tile_based_rendering_best_practices.html
- Bloom: Bjørge, «Bandwidth-Efficient Rendering», SIGGRAPH 2015 (dual filter);
  https://learnopengl.com/Guest-Articles/2022/Phys.-Based-Bloom
- 2D light: https://jason.today/gi and https://jason.today/rc; https://github.com/nff747/radiance-cascades-wgsl;
  https://tmpvar.com/poc/radiance-cascades/; https://vgpu.sh/examples/radiance-cascades
- Particles: https://github.com/takumifukasawa/webgpu-particle-compute-shader-curl-noise-demo;
  https://martinlaxenaire.github.io/gpu-curtains/examples/
- Nebula and star: https://iquilezles.org/articles/warp/; http://pegwars.blogspot.com/2018/12/rendering-nebulae.html;
  limb darkening https://en.wikipedia.org/wiki/Limb_darkening
- Upscaling: https://jntesteves.github.io/shadesofnoice/graphics/shaders/upscaling/2021/09/11/amd-fsr-demystified.html;
  https://gpuopen.com/fidelityfx-superresolution/
- Text and DOM: https://webgpu.github.io/webgpu-samples/?sample=textRenderingMsdf;
  https://developer.chrome.com/blog/html-in-canvas-origin-trial; https://github.com/WICG/html-in-canvas
- Coverage: https://github.com/gpuweb/gpuweb/wiki/Implementation-Status;
  https://web.dev/blog/webgpu-supported-major-browsers
