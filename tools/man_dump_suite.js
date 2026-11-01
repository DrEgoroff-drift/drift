// Template suite: dumps the in-game man's geometry, bone binding and pose as JSON.
//
//   copy tests/../tools/man_dump_suite.js  ->  tests/99zz-dump-man.js
//   powershell -ExecutionPolicy Bypass -File build.ps1
//   tools\node\node test-node.js --only=dump-man > _scratch/man_dump.txt
//   python tools/man_render.py _scratch/man_dump.txt _scratch/man_pose
//   delete tests/99zz-dump-man.js and rebuild
//
// Why it exists: the surface cannot be captured headless — `plnGpuReady()` stays false because
// headless Chrome stops requestAnimationFrame at ~41 frames and the eighteen `pln.*` pipelines
// never finish (docs/GOTCHAS.md). `plnManBuild` is pure CPU, so the figure can be taken out of
// the engine and rendered elsewhere, which is what makes before/after possible at all.
suite("zz-dump-man", () => {
  const P = plnManPalette();
  const m = plnManBuild(P, false, {});
  const W = plnManPose(plnManState(null, 0, 0));
  const parts = m.parts.map(q => ({ bone: q.bone, off: q.off, nv: q.m.nv, ni: q.m.ni }));
  const pose = W.map(w => [w.c, w.s, w.x, w.y, w.z, w.a].map(x => Math.round(x * 1e4) / 1e4));
  const v = Array.prototype.slice.call(m.V).map(x => Math.round(x * 1e4) / 1e4);
  const idx = Array.prototype.slice.call(m.I);
  console.log("MANDUMP" + JSON.stringify({ vs: PLN_VS, nv: m.nv, ni: m.ni, parts, pose, v, i: idx }));
  ok(m.nv > 0, "человек собрался");
});
