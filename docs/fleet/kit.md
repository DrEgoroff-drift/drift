# Ship «kit» — notes

Zone: `08c-gpu-kit` (additive only), `08ca-gpu-canvas`, `08cb-gpu-text`, `08cc-gpu-shadow`, `18c-chunks`,
plus new files next to them and their tests. Branch `claude/gpu-kit`, from `claude/optimistic-gates-u46osn`.

## Commits

1. **Path2D in GcCtx** (census §2 gap 1) — new `src/08caa-gpu-path.js`, three lines of `08ca`
   (`fill`/`stroke`/`clip`), new Node suite `tests/91zzzzzzy3-gpu-path.js` (18 assertions).

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

## Requests for files outside the zone

- `build.ps1`'s typeof guard knows no `Path2D` in `$HOST_GLOBALS`; `08caa` reads `globalThis.Path2D`
  instead of `typeof Path2D==="function"`. Nothing needed; noted in case someone adds a guard.

## New render pipelines (for the warm-up table `08b1`)

- None so far: Path2D goes through the existing GcCtx pipelines.

## Open problems

- none yet
