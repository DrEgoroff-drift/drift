# Probe snippets

Snippets for `python lab/probe.py <scene> "@lab/snippets/<file>" [--wait N] [--w 390 --h 844 --dpr 1.5 --mobile]`.
Each returns a Promise with JSON. Rates are per headless rAF tick (uncapped, ~200/s), not per game frame,
unless the snippet counts `frameBody`.

| File | Measures |
|---|---|
| `mut.js` | who dirties the layout: a MutationObserver with the same config as `08-state` on the same nodes, mutations per second, the first writer's stack, `rectsDirty()` per second, while walking right 5 s |
| `2d.js` | the 2D remainder: calls on real 2D contexts per tick by canvas and owner (1-in-16 sampled stack), `copyExternalImageToTexture` MB per tick |
| `cant2.js` | the cantina tab: function times inside `renderTab()` and over the next 2 s (`cppFlush`, `cpMeshPump`, `cpMesh`) |
| `dock3.js` | first and second `openStation()`: action time, worst frames, GPU objects created |
| `spike.js` | frames over 50 ms against pipeline, shader and texture creation around them; `window.__GO` runs an action at 0.5 s |
| `passes.js` | render and compute passes per tick with the calling function |
| `mem5.js` | five minutes of JS heap minima every 30 s, GPU objects created, DOM node count |
| `res.js` | GPU resources and queue traffic for one action in `window.__ACT` (3 s window) |
| `pipes-dig.js` | sync and async pipelines built by `enterDig()` with their formats and callers |
| `front.js` | who dirties `#c`: the first 2D call per frame that makes `gpuFrontCopy` upload the whole canvas, with its stack, and the copies of `#c` (walks right 8 s; in a raid stands 2.5 s) |
