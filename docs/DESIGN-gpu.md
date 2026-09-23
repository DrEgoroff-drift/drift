# The renderer — WebGPU, with Canvas 2D as the brush

The author, 23.09.2026: «переноси все на новые технологии, то что не умеют новые оставлять в канвас»;
«нахуй откат и поддержку старой версии, все по новой»; «графику только улучшать … не надо одинакого, надо
лучше»; «первое — на новый движок, потом по плану». This file is the recipe; the open work is PLAN.md §0.

## 1. What changed and what did not

- **The world is still math.** Seeds, noise, the galaxy, orbits, economy, `stateHash` — all in JS, unchanged.
  Only the *painting* moved: a shader is a formula per pixel, so the math simply got closer to the screen.
- **WebGPU only.** No 2D fallback, no switch. Without WebGPU the player sees a plain message naming the
  browsers that can play (`gpuNone`, 08b). caniuse (23.09): WebGPU 87 %, WebGL2 96 % — the gap is iOS < 26,
  Firefox on Android/Linux, old Android.
- **Canvas 2D stays as the brush** for what the GPU does not do well: text, and complex vector shapes
  (hulls, props, people, rooms). It paints either live onto `#c` (a transparent layer the GPU composites)
  or once into a canvas that becomes a texture (`gpuImage`) — the hull bake already works that way.
- **Better, not the same.** Every ported layer should look better within the art direction
  (`docs/DECISIONS.md`: one light, rich palette, motion not twinkle, the frame's laws): per-pixel light from the
  real sun direction, soft particles and depth of field on near layers, analytic anti-aliasing, live fields where
  a bake used to freeze them, no banding (the final pass dithers every mode). Parity is the floor, not the goal.

## 2. The frame

```
gpuFrame()        #c cleared (the 2D layer), command encoder opened; false = no device → nothing is drawn
  gpuScene()      layers UNDER everything 2D: backdrops, sky, fields (gpuScene3D: the same with depth)
  …2D on ctx…     text and vector shapes land on #c
  gpuOver()       a layer ABOVE what 2D has drawn so far (each call: upload #c, composite, submit)
  …2D on ctx…     lands above that layer
gpuWorld(k,…)     #c uploaded; bloom at a quarter of the frame (4×4 box, gaussian in rgba16f)
  …UI on ctx…     the rack (25d) draws onto the UI layer — no bloom, no grain
gpuPresent()      one pass: frame + bloom, grain (overlay 7.5 %), vignette, hit chromatics, UI, blue-noise dither
```

`drawWorld()` called outside the loop (tests, stands, `look`) builds its own frame (`gpuManual`) and snapshots
it in the same task; `gpuSnapshot()` returns the composed frame as a 2D canvas (a presented WebGPU canvas
cannot be read after its task ends). `#c` is invisible (`opacity:0`) and still takes the finger; the GPU canvas
`#g` has `pointer-events:none`.

## 3. Layer order — the one rule

A GPU layer is either **under** all 2D of the frame (`gpuScene`) or **above** the 2D drawn so far (`gpuOver`).
So port a mode **from the back**: sky and backdrops first (under), then whatever sits between 2D shapes moves
together with its neighbours (a sprite via `gpuImage`), and full-frame effects on top (night, fog, light, near
particles) go through `gpuOver`. Each `gpuOver` costs one upload and one full-screen composite — two or three
per frame at most; consecutive GPU layers share the pass one call returns.

## 4. The kit (08b core, 08c kit) — coordinates in CSS pixels, colour in, premultiplied out

| call | what |
|---|---|
| `gpuScene()` / `gpuScene3D()` / `gpuOver()` | the pass to draw into; `null` outside a frame — the layer then does nothing |
| `gpuImage(pass, canvas, [{x,y,w,h,a,rot,u0,v0,u1,v1,cubic}], {blend})` | pictures and sprites; `x,y` is the centre; the canvas is uploaded once per canvas object |
| `gpuShapes(pass, [[kind,x0,y0,x1,y1,hw,soft,r,g,b,a]], {blend})` | 0 rect, 1 disc (x0,y0,r=x1), 2 capsule (hw), 3 ring; colour 0–255, a 0–1; `soft` = a soft edge that wide |
| `gpuField(pass, name, wgsl, Float32Array(≤60), [tex…], {blend})` | a full-screen field: `wgsl` defines `fn field(p:vec2f, uv:vec2f)->vec4f` (premultiplied), reads `fu.v[0..14]`, `t0..t3` via `smp` |
| `gpuPipe / gpuBuf / gpuBind / gpuCanvasTex` | your own pipelines (`layout:"auto"`, target `rgba8unorm`); `GPU_WGSL_COMMON` has `pmod`, `covRect`, `covDisc`, `covSeg`, `texCubic` |
| `GPU_BLEND` | `over` (source-over), `add` (lighter), `mul` (multiply on an opaque backdrop) |

The space layer (`16g-gpu-space`) is the worked example: instanced stars with the 2D table and `starMove`,
the dust layers from `dustTable`, the nebula composite as a texture.

## 5. Porting a mode — the checklist

1. Read the mode's draw order (`drawWorld` → the mode's draw). Mark each step: field, particles, shape, text.
2. Port from the back. Delete the 2D code you replaced — there is no fallback to keep. Keep the data and the
   seeded generation in JS; move only the painting.
3. **Improve** (§1) and say how in the commit. Check the logic you port — the old code may carry a bug or a
   wasted pass; fix it rather than copy it.
4. Precision: feed noise camera-relative coordinates (fp32 at large world coords ripples); `highp` for positions.
5. No per-frame allocations in JS: reuse `Float32Array`s, one draw per layer (instances), textures re-uploaded only
   when the source canvas changes (`gpuCanvasTex` keys by object — a bake that redraws in place needs a new canvas
   or an explicit re-upload).
6. New files are `NNg-gpu-<mode>.js` next to the mode; LF line endings (keep a CRLF file CRLF); scripts that edit
   files are `.py` files run by path — never heredocs.
7. Look: `build.ps1`, then `python docs/shot.py <scenes> --look --tag after` (and `--tag before` on the parent
   commit); zero `gpu.errs`, no page errors, no «СБОЙ»; compare the sheets side by side. Phone:
   `--w 390 --h 844 --dpr 2.625`.

## 6. Tests and tools

- Headless Chrome has WebGPU on this laptop by default (file:// is a secure context); tools must not pass
  `--disable-gpu`. GPU-less CI: `--enable-unsafe-webgpu --use-webgpu-adapter=swiftshader`.
- The Node tier draws nothing (`GPU.ok` is false there) — it checks logic only. Browser suites that read pixels
  read `gpuSnapshot()`; goldens are re-accepted after each ported mode (`test.ps1 -Accept`).
- One way to take a frame: `docs/shot.py`. `shot.ps1`, `pageshot.ps1` and the stand server go (PLAN §0).
