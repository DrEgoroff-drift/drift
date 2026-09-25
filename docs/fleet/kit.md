# Ship «kit» — notes

Zone: `08c-gpu-kit` (additive only), `08ca-gpu-canvas`, `08cb-gpu-text`, `08cc-gpu-shadow`, `18c-chunks`,
plus new files next to them and their tests. Branch `claude/gpu-kit`, from `claude/optimistic-gates-u46osn`.

## Commits

1. **Path2D in GcCtx** (census §2 gap 1) — new `src/08caa-gpu-path.js`, three lines of `08ca`
   (`fill`/`stroke`/`clip`), new Node suite `tests/91zzzzzzy3-gpu-path.js` (18 assertions).
2. **createPattern in GcCtx** (census §2 gap 2) — new `src/08cab-gpu-pattern.js` (`GcPat`,
   `GcCtx.prototype.createPattern`, wrappers of the 2D `createPattern`/`CanvasPattern.setTransform`,
   the repeat sampler); `08ca`: pattern paint in `_paint`, a `kind 3` branch in the WGSL `paintOf`,
   the tile bound per draw (`put(…,tx)`, `bg` keyed by sampler kind), ramp rows skip patterns,
   `createPattern` dropped from the loud list. New Node suite `tests/91zzzzzzy4-gpu-pattern.js`.
3. **GPU twins of the 18c caches** — `18c-chunks.js` gains `gpuScreenLayer`, `gpuChunkStore`/`gpuChunkAt`/
   `gpuDrawChunks`, `gpuTileStore`/`gpuTileAt`/`gpuDrawTiles`, `gpuStoreDrop`. `screenLayer`,
   `drawChunks`, `drawTiles` are unchanged: their callers draw the returned canvas onto the live 2D `ctx`
   (`ctx.drawImage(screenLayer(…))` in 19c-light, 19d-weather, 19a-scoop; 29g returns it), and a bake
   there would break them — so the brief's «screenLayer → gpuBaked only if every caller keeps working»
   is met by a twin, not a swap. Suite `tests/91zzzzzzy5-gpu-chunks.js` (Node + a browser-tier suite).

## API for mode ships

### Path2D under GcCtx (commit 1)

Nothing to change in callers. At load, `08caa` replaces `globalThis.Path2D` with `GcPath2D`, a subclass
of the real `Path2D`: it is still a real Path2D (a live 2D context fills it as before), and it also
records its commands into a flat array. `GcCtx.fill(path, rule)`, `stroke(path)` and
`clip(path, rule)` replay the record through GcCtx's own path and triangulator with the transform in
force at the call — the same semantics as 2D. So a painter that builds `new Path2D()` and fills,
strokes and clips it (any number of times, any styles) now bakes through `gpuBake`/`gpuBaked` as is.

- Recorded: `moveTo lineTo closePath quadraticCurveTo bezierCurveTo arc arcTo ellipse rect roundRect`,
  `addPath(path, matrix)` (a snapshot at call time, matrix `a..f` or `m11..m42`, e.g. `DOMMatrix`),
  `new Path2D(path)` (copies the record). Fill rule `"evenodd"`/`"nonzero"` for `fill` and `clip`.
- Cache: the flattened subpaths are kept on the path, keyed by (matrix, bake scale, record length).
  Fill + stroke + clip of one silhouette under one transform flatten it once; repeat bakes of the same
  path object reuse it. Appending to the path invalidates it.
- Loud (`GPU-холст: нет …`, frame shows СБОЙ, tests go red): `new Path2D("svg string")` (and any
  path that `addPath`ed one), and a `Path2D` object not built by the recorder (none exist: the recorder
  is installed before any module builds a path at run time). Nothing in `src/` uses SVG strings.
- A module that builds a Path2D **at top level before `08caa`** would get the native class; none does.

### createPattern under GcCtx (commit 2)

Nothing to change in callers either.

- `g.createPattern(img, rep)` on a GcCtx returns a `GcPat`; `img` is anything `drawImage` takes on the GPU
  canvas (a bake, or a 2D canvas — uploaded once per canvas object by `gpuCanvasTex`: a tile redrawn in
  place needs a new canvas). `rep`: `repeat` (default, also for `null`/`""`), `repeat-x`, `repeat-y`,
  `no-repeat`; anything else throws `SyntaxError` like 2D. `pattern.setTransform(DOMMatrix)` works.
- A pattern made by a **real 2D context** (`18a-material`'s `J.c.createPattern(J.cn,"repeat")`,
  `25g-postcard`'s `pcPrint` when it draws on a live 2D canvas) is tagged by a wrapper installed at load
  (`_gcImg`, `_gcRep`, `_gcM`), so it can be used as `fillStyle`/`strokeStyle` on a GcCtx as is.
- Pattern as fill and as stroke; `globalAlpha` and `imageSmoothingEnabled=false` (nearest) honoured;
  `no-repeat`/`repeat-x`/`repeat-y` are transparent past the tile on the unrepeated axis.
- Loud: text (`fillText`/`strokeText`) with a pattern paint; a paint object that is neither a colour,
  a gradient nor a pattern. **Not yet:** `globalCompositeOperation="overlay"` — `fillMaterial`'s second
  pass uses it, so the material still cannot bake as a whole (see Open problems).

### Chunks, tiles and screen layers on the GPU (commit 3)

Same paint contract as the 2D versions — `paint(g,wx0,wy0)` draws into the global `ctx` (a GcCtx during
the bake) with `W`,`H` set to the piece's size, at density `DPR·SCK` like `mkCanvas`; so a mode switches
by renaming, and the painter must only use what GcCtx supports (Path2D and patterns now do; `overlay`
and `getImageData` do not):

```js
S.farA=gpuTileStore(S.farA,key);            // was tileStore
gpuDrawTiles(gpuScene(),S.farA,cx,cy,paint);// was drawTiles(S.farA,cx,cy,paint)
T.chunks=gpuChunkStore(T.chunks,key,top,ch);gpuDrawChunks(pass,T.chunks,camx,camy,paint);
gpuImage(pass,gpuScreenLayer(key,paint),[{x:W/2,y:H/2,w:W,h:H}]);   // was ctx.drawImage(screenLayer(…),0,0,W,H)
```

- Placement reads the current `ctx` matrix (scale and translate — `withScale`, camera shake), as
  `drawImage` would; rotation is not supported. The pass is whatever the order rule needs
  (`gpuScene()` for back layers, `gpuOver()` above 2D).
- Evicted pieces and replaced stores give their textures back (`gpuBakeDrop`). A bake survives a lost
  device (gpuImage re-bakes it with the same draw, which sets `W`,`H` and the matrix itself).
- `gpuDrawTiles` has no «occupied rows» span (`tileSpan` reads pixels back; on the GPU an empty tile is
  one transparent quad, cheaper than a readback).
- Mind the order rule: in `gpuScene` the tiles sit under **all** 2D of the frame — anything 2D drawn
  earlier in the mode (e.g. `drawSkyLayer`'s bodies) will now be above them.

## Proofs (scratchpad, never in git)

Scratchpad: `/tmp/claude-0/-home-user-drift/e6da632b-601e-50c8-990d-925008133db0/scratchpad/`

- `proof-path2d.js` — a scratch page (run through `docs/shot.py title --js … --until "__pp.done"`)
  that draws the census's Path2D shapes (landing ridge filled with a gradient and stroked; cave loops
  with a nonzero hole; evenodd rects; arc/ellipse/arcTo; roundRect used as `clip`; `addPath` with a
  `DOMMatrix`) once with Canvas 2D (Skia) and once through `gpuBake` → GcCtx on WebGPU (SwiftShader),
  reads the bake back and puts both side by side.
- `path2d-before.png` — fleet base: the bake throws `GPU-холст: нет «fill(Path2D)»`, nothing drawn.
- `path2d-after.png` — this branch: the bake draws, same picture as Skia; mean channel difference
  3.1/255, 39 of 64 000 px differ by more than 48 (edge anti-aliasing), 0 GPU errors, `GC_MISS` empty.

- `proof-pattern.js` — the same stand for patterns: a tile made on a real 2D canvas, used as a
  native pattern with `setTransform` (rotate + scale) through `clip(Path2D)` + translate as
  `fillMaterial` does, the same pattern as a stroke, `repeat-x`/`no-repeat` (scaled 2×)/`repeat-y` made
  on the drawing context, and a `pcPrint`-style grain tile over the whole card.
- `pattern-before.png` — fleet base: throws (`clip(Path2D)` first; `createPattern` would be next).
- `pattern-after.png` — this branch: the same picture as Skia; mean difference 4.6/255, 868 of 64 000 px
  over 48 — the 1-px grain dots, sampled linearly under the bake's 2× supersampling; 0 GPU errors.

- `tiles-before.png` / `tiles-after.png` — whole frame, `surface` scene, 760×475: fleet base vs a
  scratch build (`route.py do`, never committed) where `21e1`'s far ridges go through
  `gpuTileStore`/`gpuDrawTiles(gpuScene(),…)`. The ridges (drawGround: paths, gradients) bake through GcCtx
  and land in the GPU pass; the frame is the same picture (6 tile bakes for farA, `GC_MISS` empty,
  0 GPU errors, no СБОЙ). Parity, not «better» — the gain belongs to the surface ship.

## Requests for files outside the zone

- `build.ps1`'s typeof guard knows no `Path2D` in `$HOST_GLOBALS`; `08caa` reads `globalThis.Path2D`
  instead of `typeof Path2D==="function"`. Nothing needed; noted in case someone adds a guard.

## New render pipelines (for the warm-up table `08b1`)

- None so far: Path2D goes through the existing GcCtx pipelines.

## Open problems

- **`overlay` composite** is missing in GcCtx (`GC_OPS`): `18a-material.fillMaterial` draws its second,
  large-scale pass with `globalCompositeOperation="overlay"`, so a mode that bakes a material fill through
  GcCtx still throws there. Overlay needs the backdrop in the shader (not a fixed-function blend): either
  a read of the resolved target (copy + sample) or dropping that pass on the GPU in favour of a shader
  material. Left to the underground ship (owns `18a-material`); the kit can add a copy-and-sample
  path if asked.
