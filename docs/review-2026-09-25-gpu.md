# Adversarial pre-release review of `claude/base-gpu` (25.09.2026)

Reviewed tree: `origin/claude/base-gpu` at **ae410a3** (`ae410a3fec0ae0c685a89d75f5a77442a0a5751a`).
Range: `origin/main` (2a288f7) … ae410a3 — 139 commits, 67 files under `src/` (+4980 −1514).
Every `file:line` below is a line in ae410a3.

Method: reading the code only. Nothing was built or run (PowerShell is not available here; the suites
are another agent's job). Each finding quotes the lines that prove it. Where the trigger or the size of
the effect cannot be proven from the code, the finding says PLAUSIBLE. WebGPU limits are checked against
the spec defaults, because `gpuInit` asks for the device with default limits (`src/08b-gpu.js:53`).

Left out as already known (brief): pipelines compiled on first use (the warm-up table in 08b1 is
empty), the `let V=fu.v;` copy in full-screen shaders, and the 2D that is still left (billboard 17k,
guns and launcher, crew clock, matTick).

Severity: crash · hang · broken picture · phone speed · leak · compatibility.

## Findings, heaviest first

### 1 · broken picture (unplayable) · `src/17c-system-draw.js:490` · after a GPU device loss the flight scene stays black — CONFIRMED

**What breaks.** On a loss, `gpuDrop` → `gpuInit` builds the core on a new `GPUDevice` and resets only
the `GPU.*` caches (`src/08b-gpu.js:73`). Bakes (`gpuBake` objects) kept in module caches are rebaked
lazily, and only when they are drawn through `gpuImage` or `drawImage` on the GPU canvas.
`gpuLitSprite` hands the bake straight to `gpuField`, which binds `texs[k].view` with no device check
(`src/08c-gpu-kit.js:340`). The hull body cache (`hullGpuBake`), `FLEET_ART` (the lit `cnA` path),
`PIR_ART` and `BARGE_ART` (the rescue tow uses it too) keep returning their old-device bakes. So
`createBindGroup` gets a view of the dead device. That is a validation error: the bind group is invalid,
so is the scene pass, and so is the frame's only command buffer, which `submit` rejects. The own
ship is drawn this way every frame in system mode (`src/17-mode-system.js:655`), so every frame fails.
The canvas shows its never-rendered swap texture (black) under the DOM HUD. That lasts until a reload.
The own hull comes back when its cache key changes (the next wear step, a DPR change), but even then
every frame with an old-device pirate, fleet ship or barge on screen fails the same way. The player is
told nothing (see 8). No test covers device loss.

**Trigger.** Any loss that `gpuInit` recovers from: Android killing and restarting the GPU process while
the tab is in the background. The code's own comment names this case, «сон телефона, сброс драйвера»
(`08b-gpu.js:80`). A driver reset or a GPU OOM (see 3 and 4) does the same. So does finding 2, which
builds a new device with no loss at all.

```js
// src/08c-gpu-kit.js:220 — gpuImage rebakes a bake that belongs to another device
if(mip&&cv.draw&&cv.dev!==GPU.dev)gpuBakeRedo(cv);
// src/17c-system-draw.js:490 — gpuLitSprite does not
gpuField(pass,"gst",GST_WGSL,U,[mip?cv:gpuCanvasTex(cv),{view:GPU.V.lt},rel||null],{blend:"hull",smp:mip?gpuMipSmp():null});
// src/17c2-hull-gpu.js:29 — cached per hull, never compared with GPU.dev (same: 12ai1-fleet-art.js:24, 12i-pirate-hull.js:243, 12l-barge.js:406)
const key=hullBakeKey(id,sb);let b=M.get(key);if(b)return b;
```

These bakes reach `gpuLitSprite` from `17c2-hull-gpu.js:151`, `12ai1-fleet-art.js:428`,
`12i-pirate-hull.js:425`, `12l-barge.js:549` and `16c-rescue.js:473`. Station masters are safe: they
check the device (`17c3-station-live.js:91`).

**Fix sketch.** In `gpuLitSprite` do for `cv` and `rel` what `gpuImage` does:
`if(cv.draw&&cv.dev!==GPU.dev)gpuBakeRedo(cv)`. Better: one helper, `gpuBakeLive(B)`, used by everything
that samples a bake (`gpuImage`, `gcImg`, `gpuLitSprite`, `gpuField` textures). Add a test that calls
`GPU.dev.destroy()` mid-flight, then waits for re-init and reads a non-black `gpuSnapshot()`.

### 2 · broken picture + leak · `src/08b-gpu.js:604` and `:627` · any JS exception in the HUD layer tears down the GPU — CONFIRMED path, trigger PLAUSIBLE

**What breaks.** `gpuWorld` and `gpuPresent` wrap their bodies in `catch(e){gpuDrop(…,true)}`. Inside
`gpuWorld`'s `try`, `gpuHudFlush` runs every painter queued with `gpuHud`: the belt cockpit and glass
(`bhudDraw` → `drawGlassHUD`/`drawCockpit`, `src/24bc-belt-hud.js:136`), the helm sticks
(`src/17-mode-system.js:702`) and the observation caption (`:676–683`). `ovFlush` and `domLabelEnd`
run there too. The `catch` itself is older; what is new is what runs inside it. In main these painters
ran in the frame body, where an exception is one «СБОЙ» line and the next frame goes on. Now the same
exception does four things:

- It never reaches the frame guard, so the player sees no «СБОЙ».
- It sets `GPU.ok=false`, which freezes the picture for 1.5 s.
- It abandons the live device without `destroy()`, so nothing on it is freed at once. The frame
  targets (scene+emit in rgba16float alone: 10.5 MiB on S23, 127 MiB at 4K) and the ~30 MB bake pool
  wait for the garbage collector. Every bake that a module cache still holds stays allocated.
- It builds a new device, and finding 1 then turns the screen black.

If a painter throws every frame, the drop and the re-init repeat every ~1.5 s, and each round abandons
another whole device.

```js
// src/08b-gpu.js:603-604 (inside gpuWorld's try)
gpuHudFlush((typeof rackOpen==="function")&&rackOpen()&&G.running&&!scrOpen());ctx=GPU.uctx;
}catch(e){gpuDrop("сборка: "+((e&&e.message)||e),true);}
// src/08b-gpu.js:85 — gpuDrop never destroys the old device; it just builds a new one later
if(retry)setTimeout(()=>{GPU.lost=false;GPU.dev=null;gpuInit();},1500);
```

**Fix sketch.** Treat only real device trouble as device trouble. Call `gpuDrop` from `dev.lost`, and
rethrow everything else from `gpuWorld`/`gpuPresent` to the frame guard. Run each queued HUD painter in
its own `try` that reports through `crashSay` and goes on. When a drop is not caused by `dev.lost`,
call `GPU.dev.destroy()` before asking for a new device.

### 3 · leak / broken picture (desktop HiDPI) · `src/16c-abil.js:127-133` · the survey hull's searchlight is a screen-sized, 2×DPR, MSAA-4× bake — CONFIRMED

**What breaks.** «ПРОЖЕКТОР» is the ability of every ship whose `hullClassOf` is `survey`, «Игла»
among them (`abilKind`, `src/16c-abil.js:26`). Its wedge comes from `abilCone(Math.max(W,H)*.6)`
(`:162`). The bake is `ceil(1.2·max(W,H)·DPR)+2` px wide (`d=DPR*2`) and has a full mip chain.
`gpuBakeRedo` then takes a pool set of the same size: rgba8 at 4 samples, stencil8 at 4 samples and a
resolve texture. That set is a «великан» (over 16 MB), created for this one bake and thrown away
(`src/08ca-gpu-canvas.js:410`). In main the wedge was a 2D radial gradient drawn every frame. The sizes
below follow from the code's own arithmetic, in MiB (the S23 viewport is the one in the
`src/08-state.js:8` note, a ×2 canvas of 822×1484):

| window (CSS) · DPR | bake | pool set (freed next frame) | kept (`bakeKeep` holds 2) |
|---|---|---|---|
| S23 411×742 · 1.5 | 1338×918 | 30 | 6 |
| 1920×1080 · 1 | 2306×1584 | 87 | 19 |
| MacBook Air 1470×956 · 2 | 3530×2422 | 200 | 44 |
| 1920×1080 · 2 (4K at 200 %) | 4610×3164 | 342 | 74 |
| 2560×1440 · 2 (5K) | 6146×4216 | 600 | 132 |
| 3840×2160 · 2 (8K at 200 %) | 9218×6324 | invalid (> 8192) | invalid |

On a HiDPI desktop one press asks for 0.2–0.8 GB at once. At best that is a long stall. At worst it is a
GPU OOM, a device loss and then finding 1. Past `max(W,H)·DPR ≈ 6825` the width exceeds
`maxTextureDimension2D` (8192; the device has default limits). The texture is then invalid, so is the
bind group in `gpuImage`, and every frame fails for the 10 s the ability lasts. A window resize while the
ability is on bakes one more size.

```js
// src/16c-abil.js:128-130
const d=DPR*2;
return bakeKeep(ABIL_CONE,Math.round(R*d)+"|"+d,2,()=>{
  const Rd=R*d,w=Math.ceil(Rd)+2,h=2*Math.ceil(Rd*Math.sin(.35))+2;
```

**Fix sketch.** The wedge is an analytic shape. Draw it as a `gpuField` (a radial falloff times an
angular mask, a few lines of WGSL) and bake nothing. If a bake stays, cap it (≤1024 px, ss 1, no MSAA; a
soft gradient needs neither) and let the cubic sampler scale it up.

### 4 · leak · `src/12ai1-fleet-art.js:24` (also `12i-pirate-hull.js:243`, `12l-barge.js:406`, `17c2-hull-gpu.js:29` via `12as-left.js:141`, `17h-sys-gesture.js:181`) · VRAM grows with play time: the art caches keep mipped GPU textures forever — CONFIRMED (nothing evicts), size PLAUSIBLE

**What breaks.** These caches have no cap and no eviction. Each entry now owns GPU textures with full
mip chains. In main, where these caches existed, they held 2D canvases, and the GPU copies went through
the 64-entry `gpuCanvasTex` LRU.

- `FLEET_ART`: two bakes per ship (`cn` and `cnA`, lines 364–365), each `4.5·L` px square (≈0.6 MiB
  each for the «post», L=76). Fleet seeds change every `FLEET_PERIOD`, ten minutes, in every system
  (`src/12ai-fleet.js:77`). So even a player who stays in one system keeps adding ships.
- `PIR_ART`: one entry per pirate seed (`"p"+seed`) × hurt × rank variants, 0.25–1 MiB each. Every
  system gets a new set of seeds every 15 minutes (`src/13-pirates.js:33`).
- `BARGE_ART`: one per barge seed, 1.1–2.1 MiB each. The rescue tow uses it too.
- `HG_BAKE`: the ghost hulls of «оставленное» go through `hullGpuBake`, up to 1024² (5.3 MiB) each.
  They are keyed by hull objects that live forever in `HULL_CACHE`.
- `GEST_POST_CV`: one 360×210 bake per system (0.4 MiB).

A few hours of flying through populated systems can plausibly add hundreds of MB. On a phone that ends
in a GPU OOM and a device loss, which leads to finding 1. On iOS it ends with the web content process
killed.

```js
// src/12ai1-fleet-art.js:24,28 — read and filled; nothing ever deletes
if(FLEET_ART[key])return FLEET_ART[key];
if(art)FLEET_ART[key]=art;
// src/12ai-fleet.js:77 — a new seed, so a new key, every ten-minute window
const seed=hashi(sys.seed,bucket*97+out.length,0xF1E7);
```

**Fix sketch.** Put all of them behind `bakeKeep`-style LRUs that call `gpuBakeDrop` on eviction
(for example 16 fleet ships, 24 pirate variants, 12 barges, 4 ghost hulls, 8 posts). A ghost drawn at
alpha .22 does not need a 1024² master: bake it at a small fixed `sb`.

### 5 · broken picture · `src/17c3-station-live.js:82-83` · a station master baked over several frames can bind text masks that were destroyed in between — PLAUSIBLE (mechanism confirmed)

**What breaks.** `stMasterJob` records the whole station body into one GPU-canvas command list in its
first step. After that it bakes one layer per frame by replaying slices of that list
(`q._ops.push(O[j])`). The body contains text: `stMakerDress` draws «СТ-nn», «★», «КОМПАНИЯ™» and rib
numbers (`src/17c1-station-dress.js:17–29`). That text is recorded as quads that point at pages of the
shared mask atlas `GC_ATL`.

When the atlas reaches 6 pages, it sends every page to `GPU.trash` (`src/08cb-gpu-text.js:65`).
`gpuFrame` destroys the trash at the start of the next frame (`src/08b-gpu.js:510`). A later layer bake
then creates a bind group on a destroyed texture (`src/08ca-gpu-canvas.js:525`), which fails with
«Destroyed texture used in a submit». The whole bake submit is dropped, every pass and every mip, so the
layer comes out transparent. The master is still stored as finished (`17c3-station-live.js:100`). The
station body disappears while its lamps and rotating parts are still drawn, and it stays gone until the
density or the key changes. The only report is an `uncapturederror` line, at most 10 per session.

**Trigger.** Other text bakes keep filling the atlas. Fleet art paints each ship's number and name
(`src/12ai1-fleet-art.js:324,326`). Neon signs are rebaked at every √2 zoom step, with masks close to
or above 1024 px wide at large zoom, and a mask that wide takes a page of its own. So the atlas resets
from time to time in a long session. A station master job runs on system entry, when a building is
added, and whenever the DPR changes. On a slow phone the automatic resolution step changes the DPR and
re-keys the neon and the station master together. The recording step can also trigger the reset itself
and invalidate the masks it recorded a moment earlier.

```js
// src/17c3-station-live.js:82-83 — replays ops recorded in an earlier frame
for(let i=0;i+1<rec.cut.length;i++){yield;const a=rec.cut[i],b=rec.cut[i+1];
  const B=gpuBake(side,side,q=>{for(let j=a;j<b;j++)q._ops.push(O[j]);},{ss:k});
// src/08cb-gpu-text.js:65 — the reset destroys pages those ops still point at
if(A.pages.length>=6){for(const p of A.pages)GPU.trash.push(p.tex);A.pages=[];A.map.clear();}
```

**Fix sketch.** Pin the atlas while a prebake job holds recorded ops: count live jobs on `GC_ATL` and
reset only at zero. Another option is to re-record the slice in the step that bakes it, instead of
replaying ops from an earlier frame.

### 6 · phone speed · `src/17-mode-system.js:701-702` · while a finger is on the stick, the native-DPR `#hud` canvas is cleared and redrawn every frame — CONFIRMED mechanism, cost PLAUSIBLE

**What breaks.** The HUD layer is meant to raster only when something changes. The 08bh header says a
full-screen canvas at 2.625 «весит ~10 МБ». But the stick's key contains `GPU.frameNo` whenever
`HELM.S` (finger down) or `HELM.fade` is set. Touch steering is the normal state of flight on a phone.
During it, `gpuHudFlush` clears the whole canvas every frame (S23: 1079×1948, 8 MiB), re-rasters
every queued HUD item, and hands the compositor a changed full-screen layer. P1 removed exactly this
per-frame full clear from `#c`, calling it «ограничитель частоты Chrome на телефоне»
(`src/08b-gpu.js:512-514`). The same happens every frame while the rack is open
(`src/08bh-gpu-hud.js:21`).

```js
// src/17-mode-system.js:701 (the idle branch of the key is elided)
const hh=(HELM.S||HELM.fade)?"stk"+GPU.frameNo:"stk"+(…)+helmDry()+document.body.className;
// src/08bh-gpu-hud.js:23 — any key change clears the whole native-DPR canvas
if(GPU.uiWas){u.setTransform(1,0,0,1,0,0);u.clearRect(0,0,GPU.ui.width,GPU.ui.height);}
```

**Fix sketch.** Draw the live sticks on the GPU. `#ovl` already has rectangles, triangles and an
analytic edge; rings and capsules are a few more primitives. Or give the sticks a small canvas that
follows the finger, and keep `#hud` for what does not move. Measure with `?g11=deep` on the S23 with a
finger held down.

### 7 · phone speed · `src/08c-gpu-kit.js:223` · `gpuImage` builds a new bind group on almost every call, and typed arrays are allocated per call everywhere — CONFIRMED mechanism, cost PLAUSIBLE

**What breaks.** `gpuBind` keeps one cached bind group per name and compares its resources. `gpuImage`
uses the name `"kit.img|"+blend` for every image, so a call whose texture differs from the previous
call's creates a new `GPUBindGroup`. A system frame draws a dozen or more distinct textures through it:
the hotel alone has six call sites, then neon, Cheburek, bazaar, buoys, finds, shuttles and loot. That
means a dozen `createBindGroup` calls per frame, hundreds per second. Each one allocates a bind group in
the GPU process. `GPUBindGroup` has no `destroy()`, so that memory is freed only when V8 collects the
wrapper.

The same calls allocate a `new Float32Array(n*12)` (`:215`, and `:291` in `gpuShapes`). `gpuField`
allocates a `Float32Array(64)` and an array per call (`:337`, `:340`). `gpuLitSprite` allocates a
`Float32Array(16)` (`src/17c-system-draw.js:487`). `gpuKitU` and `ovFlush` allocate one each per frame.
DESIGN-gpu §5, rule 5, says «No per-frame allocations in JS».

```js
// src/08c-gpu-kit.js:40 — one slot per name
if(c&&c.res.length===res.length&&c.res.every((r,i)=>r===res[i]))return c.bg;
// src/08c-gpu-kit.js:223 — every image shares the slot "kit.img|over"
pass.setBindGroup(0,gpuBind("kit.img|"+blend,P,[gpuKitU(),A.buf,t.view,mip?gpuMipSmp():GPU.S.lin]));
```

**Fix sketch.** Split the bind group. Keep the uniform and the arena in group 0, which does not change.
Put the texture and sampler in group 1, cached per (texture view, blend) in a `WeakMap` on the texture
entry. Reuse scratch `Float32Array`s sized to the largest instance count.

### 8 · compatibility · `src/08b-gpu.js:36-43` · every GPU failure is reported as «Этому браузеру не хватает WebGPU», while losses and validation errors are silent — CONFIRMED

**What breaks.**

- `gpuNone` covers four different failures: `requestAdapter()` returning `null`, a failed
  `requestDevice`, a failed re-init after a loss, and a missing `navigator.gpu`. A null adapter happens
  in Chrome with hardware acceleration off, on a blocklisted GPU or driver, or once repeated
  GPU-process crashes disable the GPU. Every case gets the same text: the browser lacks WebGPU, use
  «свежие Chrome, Edge…». For a Chrome user that is the wrong advice. After a loss mid-session it is
  also permanent, because nothing retries.
- During a loss (at least 1.5 s), and forever if re-init fails, the world keeps simulating behind a
  frozen or black frame (`src/28-loop.js:549-551`). Combat, pirates and fuel all go on. The player is
  not told, and the world does not wait the way it does for a hidden tab (`28-loop.js:436`).
- WebGPU validation errors, such as the black frames of findings 1, 3 and 5, go only to `crashShip`, at
  most 10 per session (`:58`). The frame guard never sees them.
- If `requestAdapter` or `requestDevice` never settles, `GPU.busy` stays true and there is no message
  at all.

```js
// src/08b-gpu.js:50 and :77 — a null adapter and a failed init take the same path
if(!ad){gpuNone("адаптера нет");return;}
GPU.ok=false;gpuNone("init: "+((e&&e.message)||e));
// src/08b-gpu.js:41 — the only text the player ever gets
d.innerHTML="<b>Этому браузеру не хватает WebGPU</b><s>«Дрейф» рисует мир видеокартой. Подойдут свежие Chrome, Edge, …";
```

**Fix sketch.** Use three messages:

- no `navigator.gpu`: the browser;
- no adapter, or `requestDevice` failed: hardware acceleration or the driver (point to the browser's
  hardware-acceleration setting);
- lost and not recovered: reload, the flight is saved.

While `GPU.lost`, skip the world step the way the `document.hidden` branch does. Count validation errors
per frame; after N bad frames in a row, raise «СБОЙ · видеокарта» through the frame guard. Time out
`gpuInit` after about 10 s.

### 9 · leak (small) · `src/08b-gpu.js:392` · `GPU.T.ui` is a full-frame rgba8 target that nothing writes — CONFIRMED

`gpuResize` still allocates `ui` at frame size and binds it into every post bind group. Since the UI moved
to the DOM canvas `#hud`, `gpuPresent` sets `GPU.uiOn=false` on every frame, so `fsFinal` never samples
it. The waste is 2.6 MiB on S23, 7.9 MiB at 1080p and 31.6 MiB at 4K, and the target is rebuilt on every
resize.

```js
// src/08b-gpu.js:392 (gpuResize) and :619 (gpuPresent)
GPU.T={front:mk(bw,bh,"rgba8unorm",TB|CD|RA|GPUTextureUsage.COPY_SRC),ui:mk(bw,bh,"rgba8unorm",TB|CD|RA),
GPU.uiOn=false;   /* слой приборов — DOM-холст (#hud), не текстура */
```

**Fix sketch.** Bind the 64×64 noise view (`GPU.N`) at binding 6, drop `T.ui`, and remove `u.ui` from
the final shaders.

### 10 · phone speed · `src/17ga-gpu-planets.js:387-392` · city lights cost up to 63 000 region tests per planet per frame, and more as the holding grows — CONFIRMED (loop arithmetic), ms PLAUSIBLE

`gplCities` runs every frame for the first solid planet of a system with buildings. `planetLightsN`
gives it `min(24, 3·buildings)` lights, or 48 at rung 28 and above. For each light it tries up to 32
latitudes and scans 41 longitudes for each. The result is not cached, although it only changes when a
light's window index `e` changes.

A Python mirror of the loop (same constants, random hashes) gives these counts for 48 lights:

- about 7 000 `reg()` calls per frame when the star is more than ~25° off the horizontal;
- 14 000–35 000 at those angles on wet planets, where the land test rejects cities;
- 29 000–40 000 when the star is 10–15° off the horizontal;
- **62 976 every frame, lighting nothing, when the star is within ~8° of straight left or right of
  the planet on screen**, because no latitude then has a 0.8-radian window.

On a phone that plausibly costs 1–2 ms of JS per frame for this planet alone.

```js
// src/17ga-gpu-planets.js:387,390
for(let tr=0;tr<32;tr++){
  for(let s=0;s<=40;s++){const L=-1.45+2.9*s/40;
```

**Fix sketch.** Cache each light's chosen latitude and window by (planet, j, e), recomputing only when
`e` or the sun's screen direction changes. Skip the search when the sun direction admits no window.

### 11 · phone speed (minor) · `src/08b0-gpu-pipe.js:61-67` · the warm-up gate is not armed before the device exists, and a dead device's warm-up can mark it done — CONFIRMED (code), impact PLAUSIBLE

- `done` starts as `true` and `warmP` is undefined until `gpuInit` finishes. A tap on start before
  that runs `start()`/`loadGame()` at once, and the warm-up then competes with the first flight
  frames.
- After a device loss, the old warm-up's `Promise.all` still resolves and sets `GPU_PIPES.done=true`
  while the new device's warm-up is still running. The device check exists only in each job's `then`.
- There is no once-guard. During the wait (up to 2.5 s, with no feedback) every tap on «Новая игра» or
  «Продолжить» queues another `start()` or `loadGame()`. Both are close to idempotent, so the effect is
  cosmetic.

```js
// src/08b0-gpu-pipe.js:61 and :65
return GPU_PIPES.warmP=Promise.all(jobs).then(()=>{GPU_PIPES.done=true;GPU_PIPES.ms=Math.round(wallMs()-t0);});
if(GPU_PIPES.done||!GPU_PIPES.warmP){fn();return;}
```

**Fix sketch.** Arm the gate at the start of `gpuInit`, and resolve it on `gpuNone` too. Set `done` only
`if(GPU_PIPES.dev===d)`. Disable the intro buttons, or show a line like «готовлю шейдеры…», while
waiting.

## Checked, nothing to report

- **Save compatibility and world logic.** `src/14-save.js`, `14a*` and `08a-statehash.js` are unchanged
  in the range. `G` gains no persisted field: the 08-state diff adds only `PHONE_DPR` and the phone cap
  by short side. The `v:4` read path is untouched. The rendering commits call only `rndFx`, never
  `rnd`, so the world RNG sequence is unchanged. `p.strip` became a plain object
  `{tex,view,w,h,lvl,p,dev}` that `stateHash` walks. Its render-dependent `stripLvl` was already
  hashed, so this adds no new kind of divergence.
- **Limits and features.** Default limits are enough everywhere except in finding 3:
  - one bind group per pipeline;
  - at most 6 sampled textures, in the post shader;
  - the two rgba16float targets of `comp` take 16 of the 32 bytes per sample;
  - storage buffers are read-only;
  - no MSAA on rgba16float (MSAA is used only on rgba8unorm and stencil8, and core guarantees 4× for
    both);
  - r16float rendering, `textureGather` on it and rgba16float blending are all core;
  - uniform offsets are multiples of 256;
  - `firstInstance` appears only in direct draws.

  No optional format or feature is used except `timestamp-query`, which is requested only when the
  adapter lists it.
- **Pipeline race.** `gpuPipeline` never hands out an unfinished pipeline. A warm key whose result is
  not in yet falls back to synchronous creation, so the worst case is compiling it twice. `GPU_PIPES`
  resets its maps per device.
- **Resize, DPR and rotation.** Before the encoder opens, `gpuFrame` compares the canvas size, DPR, W/H
  and the HUD DPR, and rebuilds all targets and post bind groups if any changed. Old targets are
  destroyed only when no unsubmitted work refers to them, and bakes never use frame targets. `#ovl`
  resizes itself. `gpuOver` has no callers any more, so each frame's own work is one encoder; bakes
  submit their own before it.
- **Promises.** `dev.lost`, the async pipeline jobs and `gpuInit` all handle rejection. No GPU promise
  outside the `?g11` probe can reach `unhandledrejection`.

## Top 3 before release

1. **Make device loss survivable (findings 1 and 2).** `gpuLitSprite` must rebake like `gpuImage` does
   (or `hullGpuBake`, `FLEET_ART`, `PIR_ART` and `BARGE_ART` must check the device). JS exceptions in
   `gpuWorld`/`gpuPresent` must stop turning into `gpuDrop`: let them reach the frame guard, and destroy
   the old device when a drop is not a real loss. Today one GPU-process restart on a phone, or one throw
   in a HUD painter, leaves the world black until a reload.
2. **Replace the survey searchlight bake (finding 3)** with an analytic field or a capped bake. On a
   HiDPI desktop one press allocates 0.2–0.8 GB, and past 8192 px it kills every frame for 10 s.
3. **Bound the art caches (finding 4)** with LRUs that call `gpuBakeDrop`. Fleet seeds rotate every
   10 minutes and pirate seeds every 15, so VRAM grows for as long as the player flies. The OOM it ends
   in leads straight to finding 1.
