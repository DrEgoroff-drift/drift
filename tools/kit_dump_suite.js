// Template suite: dump h3dKit prop meshes as JSON. Copy to tests/99zz-dump-kit.js, build,
// run `tools\node\node test-node.js --only=dump-kit`, then `python tools/kit_render.py`.
// Delete the copy and rebuild afterwards — it must not live in the build.
//
// Same reason as tools/man_dump_suite.js: the surface cannot be captured headless, but every
// h3dKit builder is pure CPU, so props, ships and stations can be taken out of the engine and
// rendered elsewhere. That is what makes the audit's "before" pictures possible at all.
suite("zz-dump-kit", () => {
  const want = [
    ["buoy", () => bodyBuoyMesh()],
    ["gestpost", () => bodyGestPostMesh()],
    ["bb", () => bodyBbMesh()],
    ["cheb", () => bodyChebMesh()],
    ["find", () => bodyFindMesh(0)]
  ];
  const out = {};
  for (const [name, fn] of want) {
    try {
      const m = fn();
      out[name] = {
        vs: 12, len: m.len || 0, R: m.R || 0,
        v: Array.prototype.slice.call(m.v || m.V || []).map(x => Math.round(x * 1e4) / 1e4),
        // у h3dPack есть индексный буфер: без него вершины подряд — мусор
        i: Array.prototype.slice.call(m.i || m.I || [])
      };
    } catch (e) {
      out[name] = { err: String((e && e.message) || e) };
    }
  }
  console.log("KITDUMP" + JSON.stringify(out));
  ok(true, "ok");
});
