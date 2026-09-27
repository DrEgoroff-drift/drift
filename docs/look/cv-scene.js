"use strict";
/* Cave look-dev stand — the cast and the scene of key frame M601: the upper gallery just past the mouth.
   From the left: the mouth with the day falling down it on a heap of rubble grown with plants of the surface;
   the man with his lamp, walking right, under an arch that opens into a far chamber with its own skylight;
   the crack down with a rope; the hall with columns in a still lake; a grotto of crystals beyond the water.
   Three lights, three colours: the day is white and green, the lamp is warm, the crystals are mauve.
   Stand-ins for the key frame: every family gets its own design pass later (docs/DESIGN-planet.md, stage 3). */

const CV_WIDE = { eye: [0, 3.6, -50], tgt: [0, 3.4, 0], fov: 24 * DEG };
const CV_TALL = { eye: [CVP.manX + 1.5, 3.6, -30], tgt: [CVP.manX + 1.5, 5.2, 0], fov: 46 * DEG };
function cvCam(aspect) {
  const k = smooth(.6, 1.5, aspect);
  for (let a = 0; a < 3; a++) { CAM.eye[a] = lerp(CV_TALL.eye[a], CV_WIDE.eye[a], k); CAM.tgt[a] = lerp(CV_TALL.tgt[a], CV_WIDE.tgt[a], k); }
  CAM.fov = lerp(CV_TALL.fov, CV_WIDE.fov, k); CAM.tall = 1 - k; CAM.near = 6; CAM.far = 600;
}
/* the day comes down the shafts leaning along the walk line and a little towards the lens: a ray that reaches
   the floor has come through the rock of the grid, never through the open face of the cut */
const CV_SUN = v3.norm([-CVP.lean[0], 1, CVP.lean[1]]);
/* the lamp looks where the man goes and a little into the depth: the wall beside him is in its light.
   near and reach: where the light begins to fail and where it is gone */
const CV_LAMP = { col: [4, 3.1, 1.95], dir: v3.norm([1, -.15, .6]), inner: 32 * DEG, outer: 58 * DEG, fall: 3.2, fov: 128 * DEG, near: 12, reach: 27 };
const CV_DAY = [1.3, 1.42, 1.4];

/* dripstone is pale and wet, with darker rings where the water stood */
function cvCream(t, a, p) {
  const n = cvN3(p[0] * 1.1, p[1] * .5, p[2] * 1.1, 61);
  return mix3(CVC.creamD, CVC.cream, clamp(.55 + .35 * n + .12 * Math.cos(a * 3 + p[1] * 2), 0, 1));
}

/* a band of a turned body. o: c (y)→[x, z] the axis, rings [[y, r, u]…] (u is handed on to mod, dy, col and x),
   sides, mod (a, u)→factor of the radius, dy (a, u)→how much lower, nup — which way a level face of the band
   looks (+ up, − down), col (u, a, p)→rgb, x (u, a, p)→shade or a number, mat, glow */
function cvBand(m, o) {
  const R = o.rings, n = R.length, S = o.sides, P = new Array(n * S), base = m.nv;
  for (let k = 0; k < n; k++) {
    const y = R[k][0], r = R[k][1], u = R[k][2], c = o.c(y);
    for (let s = 0; s < S; s++) {
      const a = s / S * TAU, rr = r * (o.mod ? o.mod(a, u) : 1);
      P[k * S + s] = [c[0] + Math.cos(a) * rr, y + (o.dy ? o.dy(a, u) : 0), c[1] + Math.sin(a) * rr];
    }
  }
  for (let k = 0; k < n; k++) {
    const u = R[k][2];
    for (let s = 0; s < S; s++) {
      const a = s / S * TAU, p = P[k * S + s];
      const up = P[Math.min(k + 1, n - 1) * S + s], dn = P[Math.max(k - 1, 0) * S + s], rt = P[k * S + (s + 1) % S], lf = P[k * S + (s + S - 1) % S];
      let nr = v3.cross(v3.sub(up, dn), v3.sub(rt, lf));
      const l = v3.len(nr), ref = [Math.cos(a), o.nup || 0, Math.sin(a)];
      nr = l < 1e-9 ? v3.norm(ref) : v3.mul(nr, 1 / l);
      if (v3.dot(nr, ref) < 0) nr = v3.mul(nr, -1);
      m.vert(p, nr, o.col(u, a, p), o.mat, 0, o.glow || 0, typeof o.x === "function" ? o.x(u, a, p) : (o.x == null ? 1 : o.x));
    }
  }
  for (let k = 0; k + 1 < n; k++) for (let s = 0; s < S; s++) {
    const s2 = (s + 1) % S;
    m.quad(base + k * S + s, base + k * S + s2, base + (k + 1) * S + s2, base + (k + 1) * S + s);
  }
}
const CV_DOME = [0, .1, .25, .42, .6, .78, .92, 1];
/* how many lobes the rim of a cap has: a lobe is round when it has seven sides of the ring or more */
const cvLobes = (sides, rnd) => Math.max(3, Math.round(sides / 7) - 1 + (rnd() * 3 | 0));
/* A stack of caps: the shape of this world, in stone. Every cap is a dome with an underside that hangs over
   the cap below and keeps it in shade; the rims are scalloped where the water ran down.
   o: x, z, foot, tiers [[height, radius]…] from the floor up, rnd, tipR — the radius the last dome ends with,
      sides, bend. Returns the height of the top */
function cvCaps(m, o) {
  const rnd = o.rnd, ph = rnd() * TAU, bend = o.bend || 0, H = o.tiers.reduce((a, t) => a + t[0], 0);
  const c = (y) => { const t = clamp((y - o.foot) / H, 0, 1); return [o.x + bend * Math.sin(t * 2.2 + ph), o.z + bend * .6 * Math.sin(t * 1.7 + ph * 2)]; };
  let y = o.foot - .35, prevTop = 0;
  o.tiers.forEach(([h, R], i) => {
    const next = o.tiers[i + 1], rTop = next ? next[1] * .58 : (o.tipR == null ? .02 : o.tipR);
    const nf = cvLobes(o.sides, rnd), fp = rnd() * TAU, amp = .05 + rnd() * .06, droop = i ? h * .16 : 0, tone = .9 + rnd() * .2, lip = h * .1;
    const sc = (a) => Math.abs(Math.sin(a * nf * .5 + fp));
    const mod = (a, f) => 1 + amp * Math.pow(1 - f, 1.5) * (sc(a) - .6);
    const dy = (a, f) => i && f < .3 ? -lip * (1 - f / .3) * Math.max(0, sc(a) - .4) / .6 : 0;
    if (i) cvBand(m, {
      c, sides: o.sides, nup: -1, mat: CVM.drip, glow: .5, rings: [[y + h * .05, prevTop, 1], [y - droop * .5, (prevTop + R) * .55, .5], [y - droop, R * .985, 0]],
      mod: (a, f) => f < .25 ? mod(a, 0) : 1, dy, col: (f, a, p) => v3.mul(cvCream(0, a, p), .55 * tone), x: f => lerp(.45, .2, f)
    });
    const rings = [];
    for (const f of CV_DOME) rings.push([y - droop + (h + droop) * f, rTop + (R - rTop) * Math.sqrt(1 - f * f), f]);
    cvBand(m, {
      c, sides: o.sides, nup: .7, mat: CVM.drip, glow: .6, rings, mod, dy,
      col: (f, a, p) => v3.mul(cvCream(f, a, p), tone * lerp(.9, 1.05, f)), x: f => next || o.tipR != null ? lerp(1, .3, smooth(.62, 1, f)) : 1
    });
    y += h; prevTop = rTop;
  });
  return y;
}
/* What hangs from the roof is made of the same caps: bells one under another, each smaller than the one over
   it. The last one ends in a point, or in the neck of a column.
   o: x, z, top (the roof), tiers [[height, radius]…] from the roof down, rnd, sides, drip (the length of the
      point), join {y, r} (the neck goes down to y with the radius r). Returns the height of the lowest rim */
function cvBells(m, o) {
  const rnd = o.rnd, S = o.sides || 20, c = () => [o.x, o.z], T = o.tiers, ph = rnd() * TAU;
  /* the root spreads into the roof */
  const R0 = T[0][1];
  cvBand(m, {
    c, sides: S, nup: -.5, mat: CVM.drip, glow: .6, rings: [[o.top + .5, R0 * 1.7, 0], [o.top + .05, R0 * 1.22, .5], [o.top - .25, R0 * .95, 1]],
    col: (u, a, p) => v3.mul(cvCream(u, a, p), .8), x: u => lerp(.3, .6, u)
  });
  let yT = o.top - .25, yR = yT;
  T.forEach(([h, R], i) => {
    const neck = i ? R * .55 : R * .95, nf = cvLobes(S, rnd), fp = rnd() * TAU, amp = .06 + rnd() * .06, tone = .9 + rnd() * .2, lip = h * .14;
    const sc = (a) => Math.abs(Math.sin(a * nf * .5 + fp));
    const dy = (a, f) => f < .3 ? -lip * (1 - f / .3) * Math.max(0, sc(a) - .4) / .6 : 0;
    yR = yT - h;
    const rings = [];
    for (const f of CV_DOME) rings.push([yR + h * f, neck + (R - neck) * Math.sqrt(1 - f * f), f]);
    cvBand(m, {
      c, sides: S, nup: .4, mat: CVM.drip, glow: .6, rings, mod: (a, f) => 1 + amp * Math.pow(1 - f, 1.5) * (sc(a) - .6), dy,
      col: (f, a, p) => v3.mul(cvCream(f, a, p), tone * lerp(.9, 1.05, f)), x: f => lerp(1, .3, smooth(.6, 1, f))
    });
    const nx = T[i + 1], inR = nx ? nx[1] * .55 : (o.join ? o.join.r : R * .42), tuck = nx ? nx[0] * .12 : .04;
    cvBand(m, {
      c, sides: S, nup: -1, mat: CVM.drip, glow: .5, rings: [[yR, R * .985, 0], [yR + tuck * .5, (R + inR) * .5, .5], [yR + tuck, inR, 1]],
      mod: (a, f) => f < .25 ? 1 + amp * (sc(a) - .6) : 1, dy, col: (f, a, p) => v3.mul(cvCream(0, a, p), .55 * tone), x: f => lerp(.45, .22, f)
    });
    yT = yR + tuck;
  });
  const last = T[T.length - 1];
  if (o.join) {
    const r = o.join.r, rings = [];
    for (let k = 0; k <= 8; k++) { const t = k / 8; rings.push([lerp(yT, o.join.y, t), r * (1 - .1 * Math.sin(Math.PI * t)), t]); }
    cvBand(m, {
      c, sides: S, nup: 0, mat: CVM.drip, glow: .7, rings, mod: (a) => 1 + .09 * (Math.abs(Math.sin(a * 3.5 + ph)) - .6),
      col: (t, a, p) => cvCream(t, a, p), x: t => lerp(.4, 1, smooth(0, .22, Math.min(t, 1 - t)))
    });
  } else {
    const r = last[1] * .42, len = o.drip || last[0] * 1.6;
    cvBand(m, {
      c, sides: S, nup: -.3, mat: CVM.drip, glow: .7, rings: [[yT, r, 0], [yT - len * .3, r * .66, .3], [yT - len * .68, r * .32, .68], [yT - len, .004, 1]],
      col: (t, a, p) => v3.mul(cvCream(t, a, p), lerp(1, .85, t)), x: t => lerp(.4, 1, smooth(0, .25, t))
    });
  }
  return yR;
}
/* A small tooth of the roof: a cone, flared where it meets the stone.
   o: x, z, top (the roof), len, r, rnd, flare, sides, rings */
function cvFlute(m, o) {
  const rnd = o.rnd, n = o.rings || 8, ph = rnd() * TAU, dx = (rnd() - .5) * .1 * o.len, dz = (rnd() - .5) * .1 * o.len;
  const y0 = o.top + .35, y1 = o.top - o.len;
  const c = (y) => { const t = clamp((y0 - y) / (y0 - y1), 0, 1); return [o.x + dx * t * t, o.z + dz * t * t]; };
  const rings = [], wave = 5 + o.len * 3;
  for (let k = 0; k <= n; k++) {
    const t = k / n;
    rings.push([lerp(y0, y1, t), o.r * (.1 + .9 * Math.pow(1 - t, 1.25)) * (1 + (o.flare == null ? .7 : o.flare) * Math.pow(1 - t, 5)) * (1 + .05 * Math.sin(t * wave + ph)), t]);
  }
  rings.push([y1 - o.r * .35, .002, 1]);
  cvBand(m, {
    c, sides: o.sides || 8, nup: -.3, mat: CVM.drip, glow: .7, rings,
    col: (t, a, p) => v3.mul(cvCream(t, a, p), lerp(1, .8, t)), x: t => lerp(.3, 1, smooth(.05, .4, t))
  });
}
/* what hangs over the air point (x, y, z): a tooth if it is short, bells with a point if it is long */
function cvHang(m, x, y, z, len, rnd) {
  const top = cvUp(x, y, z);
  if (len < 1.3) { cvFlute(m, { x, z, top, len, r: .07 + len * .08, rnd }); return; }
  const N = len > 3 ? 4 : len > 2 ? 3 : 2, R0 = .2 + len * .115, tiers = [], w = [], hb = len * .55;
  let sum = 0;
  for (let i = 0; i < N; i++) { w.push(1.3 - .5 * i / N + rnd() * .25); sum += w[i]; }
  for (let i = 0; i < N; i++) tiers.push([hb * w[i] / sum, R0 * Math.pow(.72, i) * (.92 + rnd() * .16)]);
  cvBells(m, { x, z, top, tiers, rnd, sides: 24, drip: len * .45 });
}
/* a stack on the floor under the air point */
function cvMite(m, x, y, z, h, r, rnd) {
  const bot = cvDown(x, y, z), N = clamp(Math.round(h / .42), 2, 6), tiers = [], w = [];
  let sum = 0;
  for (let i = 0; i < N; i++) { w.push(1.2 - .4 * i / N + rnd() * .3); sum += w[i]; }
  for (let i = 0; i < N; i++) tiers.push([h * w[i] / sum, r * lerp(1, .34, Math.pow(i / Math.max(1, N - 1), .8)) * (.9 + rnd() * .2)]);
  cvCaps(m, { x, z, foot: bot, tiers, rnd, sides: 24, bend: .04 * h });
  return bot;
}
/* a column: the stack that grew from the floor, the bells that came down from the roof, the neck between */
function cvColumn(m, x, y, z, r, rnd) {
  const bot = cvDown(x, y, z), top = cvUp(x, y, z), H = top - bot, hs = H * (.38 + rnd() * .1), hb = H * (.34 + rnd() * .08);
  const N = 5 + (rnd() * 2 | 0), M = 4 + (rnd() * 2 | 0), tiers = [], bells = [], w = [], v = [];
  let sum = 0;
  for (let i = 0; i < N; i++) { w.push(1.25 - .5 * i / N + rnd() * .3); sum += w[i]; }
  for (let i = 0; i < N; i++) tiers.push([hs * w[i] / sum, r * lerp(3, 1.3, Math.pow(i / (N - 1), .75)) * (.92 + rnd() * .16)]);
  const yTop = cvCaps(m, { x, z, foot: bot, tiers, rnd, tipR: r, sides: 42 });
  sum = 0;
  for (let i = 0; i < M; i++) { v.push(1.3 - .5 * i / M + rnd() * .3); sum += v[i]; }
  for (let i = 0; i < M; i++) bells.push([hb * v[i] / sum, r * lerp(2.5, 1.25, Math.pow(i / (M - 1), .75)) * (.92 + rnd() * .16)]);
  cvBells(m, { x, z, top, tiers: bells, rnd, sides: 42, join: { y: yTop - .15, r } });
  return [bot, top];
}
/* a curtain: a thin sheet of stone that hangs along a crack of the roof in folds, banded like bacon; the light
   comes through it. From (ax, az) to (bx, bz), probe — a height in the air under the roof */
function cvVeil(m, ax, az, bx, bz, probe, drop, rnd) {
  const n = 30, rows = 7, ph = rnd() * TAU, wav = 2 + rnd() * 2, px = -(bz - az), pz = bx - ax, pl = Math.hypot(px, pz) || 1, P = [], U = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, x0 = lerp(ax, bx, u), z0 = lerp(az, bz, u);
    if (cvRock(x0, probe, z0) > -.4) return false;
    const top = cvUp(x0, probe, z0) + .25, w = Math.sin(u * TAU * wav + ph) * .17 + Math.sin(u * TAU * wav * 2.3 + ph * 2) * .06;
    const len = drop * (.3 + .7 * Math.pow(Math.sin(Math.PI * u), .6)) * (.82 + .18 * Math.sin(u * TAU * wav + ph + 1));
    for (let j = 0; j <= rows; j++) {
      const v = j / rows, sw = w * (.25 + .75 * v);
      P.push([x0 + px / pl * sw, top - len * v, z0 + pz / pl * sw]); U.push([u, v, len]);
    }
  }
  const base = m.nv, W = rows + 1, rust = hex("#b4703c");
  for (let i = 0; i <= n; i++) for (let j = 0; j <= rows; j++) {
    const k = i * W + j, p = P[k], a = P[Math.min(i + 1, n) * W + j], b = P[Math.max(i - 1, 0) * W + j], c = P[i * W + Math.min(j + 1, rows)], d = P[i * W + Math.max(j - 1, 0)];
    let nr = v3.norm(v3.cross(v3.sub(a, b), v3.sub(c, d)));
    if (nr[2] > 0) nr = v3.mul(nr, -1);
    const [u, v, len] = U[k], band = .5 + .5 * Math.sin((1 - v) * len * 7 + u * 2.5 + ph);
    const col = mix3(mix3(CVC.cream, CVC.creamD, .3), rust, smooth(.5, .95, band) * .6);
    m.vert(p, nr, col, CVM.veil, 0, .6, lerp(.35, 1, smooth(0, .3, v)));
  }
  for (let i = 0; i < n; i++) for (let j = 0; j < rows; j++) m.quad(base + i * W + j, base + (i + 1) * W + j, base + (i + 1) * W + j + 1, base + i * W + j + 1);
  return true;
}
/* a stone of the cave: limestone with moss where asked; wet in the glow slot, the shade of its foot in the extra */
function cvStone(m, c, r, seed, tone, moss, shade) {
  const a = v3.mul(mix3(CVC.limeA, CVC.limeB, tone), shade == null ? 1 : shade), b = v3.mul(a, .6), green = v3.mul(CVC.mossSun, shade == null ? 1 : shade);
  addBlob(m, {
    c, r, sub: 1, bump: .5, bumpF: 1.25, seed, yaw: seed * 1.37, lean: Math.sin(seed) * .2, cut: -.4 * r[1],
    col: (u, p, n) => mix3(mix3(b, a, smooth(-.6, .6, u[1] + gnoise(p[0] * .9, p[1] * 2.2, seed) * .5)), green,
      moss * smooth(.35, .9, n[1]) * smooth(-.2, .3, gnoise(p[0] * .7 + 3, p[2] * .7, seed + 2)) * .85),
    mat: MAT.rock, glow: .15, x: (u) => lerp(.35, 1, smooth(-.5, .3, u[1]))
  });
}
/* a crystal: a six-sided prism with a point; a cluster is a fan of them about one way */
function cvCrystal(m, base, dir, len, r, tint, glow) {
  const b0 = v3.add(base, v3.mul(dir, -.15 * len)), sh = v3.add(base, v3.mul(dir, len * .78)), tip = v3.add(base, v3.mul(dir, len));
  addTube(m, { path: [b0, sh, tip], sides: 6, mat: CVM.crystal, glow, rad: t => t < .25 ? r * .8 : t < .75 ? r : .004, col: (t) => mix3(tint[0], tint[1], t), x: 1 });
}
function cvCluster(m, c, up, n, size, rnd, tint, glow) {
  const a1 = v3.norm(v3.cross(up, Math.abs(up[1]) > .9 ? [1, 0, 0] : [0, 1, 0])), a2 = v3.cross(up, a1);
  for (let k = 0; k < n; k++) {
    const a = rnd() * TAU, s = k ? Math.sqrt(rnd()) * .8 : 0, len = size * (k ? .4 + rnd() * .6 : 1) * (1 - s * .35);
    const dir = v3.norm([up[0] + s * (a1[0] * Math.cos(a) + a2[0] * Math.sin(a)), up[1] + s * (a1[1] * Math.cos(a) + a2[1] * Math.sin(a)), up[2] + s * (a1[2] * Math.cos(a) + a2[2] * Math.sin(a))]);
    const o = [c[0] + (rnd() - .5) * size * .3, c[1] + (rnd() - .5) * size * .1, c[2] + (rnd() - .5) * size * .3];
    cvCrystal(m, o, dir, len, len * (.10 + rnd() * .05), tint, glow * (.7 + rnd() * .6));
  }
}
/* a drop of amber on its thread under the roof */
function cvAmber(m, x, y, z, len, rnd) {
  const top = cvUp(x, y, z), c = [x, top - len, z], col = [1, .58, .16];
  addTube(m, { path: [[x, top + .1, z], [x, top - len + .05, z]], rad: .008, sides: 4, col: v3.mul(col, .5), mat: MAT.glow, glow: .5 });
  addBlob(m, { c, r: [.05, .085, .05], sub: 1, col, mat: MAT.glow, glow: 3.2 });
  return c;
}
/* what the surface sends down the mouth: a stem that hangs in a slow wave, leaves along it */
function cvVine(m, top, len, rnd, root, tip) {
  const sway = (rnd() - .5) * .9, sz = (rnd() - .5) * .5, ph = rnd() * TAU, n = Math.max(12, Math.round(len * 5)), path = [];
  for (let k = 0; k <= n; k++) {
    const t = k / n, w = Math.sin(t * 4.2 + ph) * .16 * t;
    path.push([top[0] + sway * t * t + w, top[1] - len * t, top[2] + sz * t * t + w * .5]);
  }
  const stem = hex("#33422a"), sw = (t) => t * t * .06;
  addTube(m, { path, rad: t => lerp(.03, .01, t), sides: 5, col: stem, mat: MAT.bark, wind: sw, x: 1 });
  for (let k = 2; k <= n; k++) {
    if (rnd() < .3) continue;
    const a = path[k], t = k / n, turn = rnd() * TAU, l = .26 + rnd() * .3, dir = [Math.cos(turn), -.5 - rnd() * .4, Math.sin(turn) * .6], w0 = sw(t);
    addTube(m, {
      path: bez(a, [a[0] + dir[0] * l * .5, a[1] + dir[1] * l * .15 + .05, a[2] + dir[2] * l * .5], [a[0] + dir[0] * l, a[1] + dir[1] * l, a[2] + dir[2] * l], 8),
      rad: u => l * .22 * Math.sin(Math.PI * Math.pow(u, .7)) + .01, flat: .08, sides: 6, up: [Math.cos(turn + 1.57), 0, Math.sin(turn + 1.57)],
      col: (u, ang) => mix3(root, tip, clamp(u * .8 + .2 * Math.cos(ang), 0, 1)), mat: MAT.leaf, wind: (u) => w0 + u * u * .04, x: 1
    });
  }
}
/* What lies in the stone, seen where the cut goes through it: the bones of a swimmer of the sea that laid these
   beds down, a shell of the same sea, the roots of what grows above, a vein of ore. All of it is drawn flat, in
   tones a little off the face of the cut; it takes no light and asks for no attention */
function cvInk(m) {
  const z = CVP.cut - .03, bone = hex("#333d4b"), dim = hex("#222a35"), rnd = rngOf(SEED + 77), fl = .2;
  const solid = (x, y) => cvRock(x, y, CVP.cut + .1) > .3;
  const ink = (p) => mix3(dim, bone, clamp(.6 + .5 * cvN3(p[0] * 1.3, p[1] * 1.3, 7, 81), 0, 1));
  /* a bone lies flat in the face of the cut: the broad axis of its section is in that plane, across its run */
  const tube = (path, rad, col, up) => {
    const d = v3.sub(path[path.length - 1], path[0]), l = Math.hypot(d[0], d[1]);
    addTube(m, { path, rad, sides: 8, flat: fl, up: up || (l > 1e-6 ? [-d[1] / l, d[0] / l, 0] : [0, 1, 0]), col: col || ((t, a, p) => ink(p)), mat: MAT.glow, glow: 1, cap: true });
  };
  /* the swimmer: the spine bead by bead, the ribs, two paddles, the skull with its long jaws */
  const sp = (t) => { const x = lerp(-15.8, -6.4, t); return [x, -4.3 + .06 * (x + 10) + .42 * Math.sin(t * 3.4 + .4) - .9 * Math.pow(Math.max(0, .2 - t) / .2, 2), z]; };
  const body = (t) => .25 + .75 * Math.pow(Math.sin(Math.PI * clamp((t - .05) / 1.05, 0, 1)), .7);
  const spine = [];
  for (let k = 0; k <= 150; k++) spine.push(sp(k / 150));
  tube(spine, t => (.035 + .075 * body(t)) * (.62 + .38 * Math.pow(Math.abs(Math.sin(t * Math.PI * 47)), .6)));
  for (let t = .44; t < .83; t += .021) {
    if (rnd() < .12) continue;
    const p = sp(t), L = (.55 + 1.5 * Math.pow(Math.sin(Math.PI * (t - .44) / .39), .6)) * (rnd() < .15 ? .45 + rnd() * .3 : 1);
    tube(bez([p[0], p[1] - .06, z], [p[0] - .55 * L, p[1] - .42 * L, z], [p[0] - .38 * L + (rnd() - .5) * .1, p[1] - L, z], 10), u => .03 * (1 - u * .6));
  }
  for (const [t, s] of [[.8, 1], [.36, .62]]) {
    const p = sp(t);
    for (let f = 0; f < 5; f++) {
      const a = lerp(-2.25, -1.25, f / 4) + (rnd() - .5) * .08, L = s * (1.05 + .5 * Math.sin(Math.PI * (f + .5) / 5)), o = [p[0] + (f - 2) * .07 * s, p[1] - .25 * s, z];
      tube(bez(o, [o[0] + Math.cos(a) * L * .5 - .1 * s, o[1] + Math.sin(a) * L * .5, z], [o[0] + Math.cos(a) * L - .3 * s, o[1] + Math.sin(a) * L, z], 24),
        u => s * .05 * (1 - u * .5) * (.45 + .55 * Math.pow(Math.abs(Math.sin(u * Math.PI * 7)), .5)));
    }
  }
  const h = sp(1);
  addBlob(m, { c: [h[0] + .45, h[1] + .1, z], r: [.62, .4, .06], sub: 2, col: (u, p) => ink(p), mat: MAT.glow, glow: 1 });
  tube(bez([h[0] + .7, h[1] + .16, z], [h[0] + 1.7, h[1] + .1, z], [h[0] + 2.75, h[1] - .2, z], 14), u => lerp(.2, .03, Math.pow(u, .8)));
  tube(bez([h[0] + .45, h[1] - .26, z], [h[0] + 1.5, h[1] - .42, z], [h[0] + 2.6, h[1] - .42, z], 14), u => lerp(.11, .025, u));
  addBlob(m, { c: [h[0] + .42, h[1] + .12, z - .08], r: [.2, .2, .02], sub: 2, col: v3.mul(bone, 1.5), mat: MAT.glow, glow: 1 });
  addBlob(m, { c: [h[0] + .42, h[1] + .12, z - .11], r: [.13, .13, .02], sub: 2, col: CVC.cutLo, mat: MAT.glow, glow: 1 });
  /* the shell: a coil with its ribs */
  {
    const c = [12.4, 11.6], r0 = .07, turns = 2.6, n = 130, path = [], grow = Math.log(.8 / r0) / (turns * TAU);
    for (let k = 0; k <= n; k++) { const th = k / n * turns * TAU, r = r0 * Math.exp(grow * th); path.push([c[0] + r * Math.cos(th + 2), c[1] + r * Math.sin(th + 2), z]); }
    if (solid(c[0], c[1]) && solid(c[0] + .8, c[1]) && solid(c[0] - .8, c[1]) && solid(c[0], c[1] - .8))
      tube(path, t => r0 * Math.exp(grow * t * turns * TAU) * .2 * (.6 + .4 * Math.pow(Math.abs(Math.sin(t * t * 90)), .5)), null, [Math.cos(2), Math.sin(2), 0]);
  }
  /* roots come down from the surface and stop where the stone opens */
  const bark = hex("#2f2a25"), barkD = hex("#1d1a18");
  const root = (p, ang, len, r, depth) => {
    const n = 12, path = [p];
    let a = ang, q = p;
    for (let k = 0; k < n; k++) {
      a = lerp(a + (rnd() - .5) * .7, -Math.PI / 2, .1);
      q = [q[0] + Math.cos(a) * len / n, q[1] + Math.sin(a) * len / n, z];
      if (!solid(q[0], q[1])) break;
      path.push(q);
    }
    if (path.length < 3) return;
    tube(path, t => r * (1 - .6 * t), (t, a2, pp) => mix3(barkD, bark, clamp(.5 + .6 * cvN3(pp[0] * 2, pp[1] * 2, 3, 83), 0, 1)));
    if (depth > 0) for (let b = 0; b < 2 + (rnd() < .4 ? 1 : 0); b++) {
      const k = 2 + (rnd() * (path.length - 3) | 0);
      root(path[k], a + (rnd() - .5) * 2, len * (.5 + rnd() * .3), r * (1 - .6 * k / (path.length - 1)) * .7, depth - 1);
    }
  };
  for (const x of [-12, -10.6, -8.2, -5.5, -2.4, .8, 3.6, 7.5, 11, 15.5]) {
    const x0 = x + (rnd() - .5) * 1.2, big = rnd();
    if (solid(x0, 13.4)) root([x0, 14.3 + rnd() * 1.2, z], -Math.PI / 2 + (rnd() - .5) * .8, 2.6 + big * 4, .06 + big * .07, 2);
  }
  /* the vein: a dark seam under the lake with grains of ore in it */
  {
    const seam = hex("#2a1c14"), ore = hex("#d2742a"), vy = (x) => -5.9 + .075 * (x - 5) + .22 * Math.sin(x * .8), path = [];
    for (let x = 4.5; x <= 17.8; x += .25) path.push([x, vy(x), z]);
    tube(path, t => .05 + .04 * Math.sin(t * 40) * Math.sin(t * 7), seam);
    for (let k = 0; k < 46; k++) {
      const x = 4.8 + rnd() * 12.8, y = vy(x) + (rnd() - .5) * .34, s = .04 + Math.pow(rnd(), 2) * .1;
      if (!solid(x, y)) continue;
      addBlob(m, { c: [x, y, z - .02], r: [s * (1 + rnd()), s, .02], sub: 1, yaw: rnd() * 3, col: v3.mul(ore, .1 + Math.pow(rnd(), 2) * .34), mat: MAT.glow, glow: 1 });
    }
  }
}

/* the lake: a sheet at the level of the water; the extra slot carries how far the stone is */
function cvLake(m) {
  const x0 = 3, x1 = 30, z0 = CVP.cut, z1 = 41, s = .35, nx = Math.ceil((x1 - x0) / s), nz = Math.ceil((z1 - z0) / s), id = new Int32Array((nx + 1) * (nz + 1)), dp = new Float32Array((nx + 1) * (nz + 1));
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const x = x0 + i * s, z = z0 + j * s, d = -cvRock(x, CVP.water, z);
    dp[i + (nx + 1) * j] = d;
    id[i + (nx + 1) * j] = m.vert([x, CVP.water, z], [0, 1, 0], [0, 0, 0], MAT.water, 0, 0, d);
  }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const a = i + (nx + 1) * j, b = a + 1, c = a + nx + 2, d = a + nx + 1;
    if (Math.max(dp[a], dp[b], dp[c], dp[d]) < -.15) continue;
    m.quad(id[a], id[b], id[c], id[d]);
  }
}
/* the body of the water where the cut goes through it: a pane a finger behind the face of the cut */
function cvSection(m) {
  const zc = CVP.cut + .04, s = .15, col = [0, 0, 0], n = [0, 0, -1];
  let pa = -1, pb = -1;
  for (let x = 3; x <= 30; x += s) {
    if (cvRock(x, CVP.water - .04, zc + .04) >= 0) { pa = -1; continue; }
    const bed = cvDown(x, CVP.water - .04, zc + .04) - .4;
    const a = m.vert([x, CVP.water, zc], n, col, CVM.section, 0, 0, 0), b = m.vert([x, bed, zc], n, col, CVM.section, 0, 0, CVP.water - bed);
    if (pa >= 0) m.quad(pa, a, b, pb);
    pa = a; pb = b;
  }
}
/* who lives in the lake: pale and blind, seen through the pane of the water */
function cvFish(m, rnd) {
  const pale = hex("#f0e0d8");
  let n = 0;
  for (let k = 0; k < 60 && n < 6; k++) {
    const x = 5.5 + rnd() * 10, y = CVP.water - .35 - rnd() * 1.3, z = CVP.cut + .3 + rnd() * .9, s = (.6 + rnd() * .6) * (rnd() < .5 ? 1 : -1), a = Math.abs(s);
    if (cvRock(x, y, z) > -.3 || cvRock(x + .4, y, z) > -.2 || cvRock(x - .4, y, z) > -.2) continue;
    /* the draught of the shader is their slow drift: each hangs and slides a palm to and fro */
    addBlob(m, { c: [x, y, z], r: [.2 * a, .055 * a, .035 * a], sub: 1, col: pale, mat: MAT.glow, glow: .6, wind: .5 * s });
    addBlob(m, { c: [x - .24 * s, y, z], r: [.08 * a, .07 * a, .012 * a], sub: 1, col: pale, mat: MAT.glow, glow: .45, wind: .5 * s });
    n++;
  }
  return n;
}
/* who lives on the roof of the hall: small lights on threads, in fields like the stars of a sky */
function cvWorms(m, rnd) {
  const col = [.38, 1, .84];
  let n = 0;
  for (let k = 0; k < 2600 && n < 150; k++) {
    const x = 4 + rnd() * 19, z = -1.5 + rnd() * 28;
    if (cvN3(x * .2, 3, z * .2, 131) + .5 * cvN3(x * .55, 5, z * .55, 133) < .12) continue;
    if (cvRock(x, 5, z) > -1) continue;
    const top = cvUp(x, 5, z);
    if (top > 13 || top < 6.5) continue;
    const l = .08 + Math.pow(rnd(), 2) * .5, c = [x, top - l, z];
    addTube(m, { path: [[x, top + .05, z], c], rad: .006, sides: 3, col: v3.mul(col, .4), mat: MAT.glow, glow: .5 });
    addBlob(m, { c, r: [.03, .03, .03], sub: 0, col, mat: MAT.glow, glow: 1.6 + rnd() * 2.6 });
    n++;
  }
  return n;
}

/* the dark wing: what stands between the lens and the cut, out of focus. Underground the face of the cut is
   the wing already; before it stands only a low bank with two stacks in the bottom right corner */
function cvWing(F, rnd, aspect) {
  const P = (sx, sy, d) => atFrame(sx, sy, d, aspect), ink = hex("#090c12"), ink2 = hex("#121923");
  const col = (u) => mix3(ink, ink2, smooth(-.3, .8, u[1]));
  const bk = P(1.04, -.07, 17.5), bw = P(1.04, 0, 17.5)[0] - P(.7, 0, 17.5)[0], bh = P(0, .075, 17.5)[1] - P(0, -.07, 17.5)[1];
  addBlob(F, { c: bk, r: [bw, bh, 3], sub: 3, bump: .22, seed: 11, col, mat: MAT.rock, x: 1 });
  for (const [sx, sy, h, r] of [[.9, .0, .95, .3], [.955, .02, .55, .22]]) {
    const tk = P(sx, sy, 17.2 + rnd() * .5);
    addTube(F, { path: [[tk[0], tk[1] - .3, tk[2]], [tk[0], tk[1] + h * .5, tk[2]], [tk[0] + .04, tk[1] + h, tk[2]]], sides: 9, mat: MAT.rock, x: 1, rad: t => r * (.1 + .9 * Math.pow(1 - t, .8)), col: ink, cap: true });
  }
}

function cvScene(aspect) {
  cvCam(aspect);
  const t0 = performance.now(), rnd = rngOf(SEED + 601);
  const R = cvRockMesh(aspect, Math.round(lerp(180, 230, CAM.tall)));
  const cast = new Mesh(1 << 18), man = new Mesh(8192), water = new Mesh(1 << 15), wing = new Mesh(1 << 13), ink = new Mesh(1 << 15);
  const inShaft = (x, z) => Math.hypot((x - cvShaftX(CVP.mouth, 6)) / 3.6, (z - CVP.mouth[1]) / 5) < 1 || Math.hypot(x - cvShaftX(CVP.sky2, 9), z - cvShaftZ(CVP.sky2, 9)) < 3;
  const onChasm = (x, z) => Math.hypot((x - CVP.chasm[0]) / 2.7, (z - CVP.chasm[1]) / 9.8) < 1;
  const air = (x, y, z, m) => cvRock(x, y, z) < -(m || .5);

  /* the man and his lamp */
  const my = cvDown(CVP.manX, 1.2, 0);
  man.add(makeMan(), [CVP.manX, my - .03, 0], 0, 1);
  const lampP = [CVP.manX + .2, my + 1.71, -.17];
  addBlob(man, { c: [lampP[0] - .02, lampP[1], lampP[2]], r: [.035, .045, .045], sub: 1, col: [1, .78, .45], mat: MAT.glow, glow: 9 });

  /* the hall: columns in the lake — a slender one at the shore, the great one, and three that stand back */
  let cols = 0, tites = 0, mites = 0, veils = 0;
  for (const [x, z, r] of [[6.4, 2, .4], [10.3, 9, .92], [13.4, 18, .6], [15, 5, .55], [21.4, 15, .62]]) {
    if (!air(x, 1.5, z, .6) || cvUp(x, 1.5, z) > 13.5) continue;
    cvColumn(cast, x, 1.5, z, r, rnd); cols++;
  }
  /* what hangs from a vault hangs in clumps about its cracks: one long, the rest about it, shorter the farther */
  const hang = (x, z, len, probe, maxTop) => {
    if (inShaft(x, z) || !air(x, probe, z, .8) || cvUp(x, probe, z) > maxTop) return;
    cvHang(cast, x, probe, z, len, rnd); tites++;
  };
  const clump = (x0, z0, n, spread, maxLen, probe, maxTop) => {
    for (let k = 0; k < n; k++) {
      const a = rnd() * TAU, d = k ? Math.sqrt(rnd()) * spread : 0;
      hang(x0 + Math.cos(a) * d * 1.6, z0 + Math.sin(a) * d, maxLen * (k ? (.2 + .5 * rnd()) * (1 - .5 * d / spread) : 1), probe, maxTop);
    }
  };
  for (const [x, z, len] of [[8.3, 4.5, 3.4], [12.6, 12, 4.4], [17.6, 9, 3], [19, 19, 3.8], [8.8, 16, 2.6], [16.4, 1.5, 2.2], [4.9, 1.2, 1.9]]) hang(x, z, len, 3, 13.5);
  clump(9.6, 1.5, 7, 1.6, 1.2, 3, 13); clump(13.2, 7, 8, 2, 1.6, 3, 13); clump(18.5, 4, 6, 1.5, 1.1, 3, 13); clump(11, 20, 8, 2.2, 1.5, 3, 13);
  clump(16, 14, 7, 1.8, 1.2, 3, 13); clump(20.5, 24, 6, 1.8, 1.4, 2.5, 12); clump(6.5, 8, 6, 1.5, 1, 3, 13);
  /* curtains in the hall: one in the light of the lamp, one before the crystals */
  for (const [ax, az, bx, bz, drop] of [[6.2, 5.5, 9.4, 4.2, 2.6], [15.2, 20, 18.6, 21.5, 2.9], [11.5, 12.5, 13.6, 14, 1.8]])
    if (cvVeil(cast, ax, az, bx, bz, 3.5, drop, rnd)) veils++;
  /* the gallery: three clumps on the roof, a few stacks by the back wall, a group past the crack */
  clump(-10.6, 3.2, 5, 1.2, 1.5, 2.6, 7.2); clump(-1.6, 3.6, 6, 1.3, 1.9, 2.6, 7.2); clump(1.6, 1, 4, 1, 1.1, 2.6, 8);
  for (let k = 0, n = 0; k < 400 && n < 9; k++) {
    const x = -18 + rnd() * 21, z = 2.6 + rnd() * 3;
    if (inShaft(x, z) || onChasm(x, z) || (x > -9.5 && x < -.4) || Math.abs(x - CVP.mouth[0]) < 4.8 || !air(x, 1.6, z)) continue;
    const h = .35 + Math.pow(rnd(), 1.6) * 1.2;
    cvMite(cast, x, 1.6, z, h, .2 + h * .2, rnd); n++; mites++;
  }
  for (const [x, z, h] of [[1.8, 3.4, 1.7], [2.7, 2.1, .9], [3.1, 4.7, 2.5], [1.9, 5.6, .8], [3.9, 3.0, .55], [4.6, 5.6, 1.4]]) {
    if (!air(x, 1, z, .4)) continue;
    cvMite(cast, x, 1, z, h, .24 + h * .2, rnd); mites++;
  }

  /* the heap under the mouth: stones, and the plants of the surface where the day reaches them */
  const hx = CVP.mouth[0] + .4, hz = CVP.mouth[1], root = hex("#2a5a40"), tipA = hex("#8fbf4a"), tipB = hex("#c4c25a");
  const heapY = (x, z) => cvDown(x, 4.2, z);
  for (let k = 0; k < 18; k++) {
    const a = rnd() * TAU, d = Math.sqrt(rnd()) * 3.6, x = hx + Math.cos(a) * d, z = hz + .4 + Math.sin(a) * d * .7, r = .22 + Math.pow(rnd(), 2) * .6;
    if (z < CVP.cut + r + .2 || !air(x, 4.2, z, .3)) continue;
    cvStone(cast, [x, heapY(x, z) + r * .25, z], [r * (1 + rnd() * .5), r * (.6 + rnd() * .3), r * (.9 + rnd() * .4)], 7 + k * 3, rnd(), .4 + rnd() * .6);
  }
  for (let k = 0; k < 11; k++) {
    const x = hx + .6 + (rnd() - .5) * 4.6, z = hz + .6 + (rnd() - .5) * 3.2;
    if (z < CVP.cut + .6 || !air(x, 4.2, z, .3)) continue;
    addRosette(cast, [x, heapY(x, z) + .02, z], .3 + rnd() * .5, rnd, root, rnd() < .3 ? tipB : tipA, 12 + (rnd() * 8 | 0), k % 4 === 1 ? 2 : 0);
  }
  for (let k = 0; k < 110; k++) {
    const x = hx + .5 + (rnd() - .5) * 6.4, z = hz + .7 + (rnd() - .5) * 4.2;
    if (z < CVP.cut + .3 || !air(x, 4.2, z, .3)) continue;
    tuftAt(cast, x, heapY(x, z) - .03, z, .18 + rnd() * .34, rnd, root, rnd() < .25 ? tipB : tipA);
  }
  /* what hangs down the mouth: vines from its walls, and long ones from the roots above, in the beam itself */
  let vines = 0;
  for (let k = 0; k < 60 && vines < 8; k++) {
    const y = 6.5 + rnd() * 7.5, a = rnd() * TAU, x = cvShaftX(CVP.mouth, y) + Math.cos(a) * 2.2, z = cvShaftZ(CVP.mouth, y) + Math.abs(Math.sin(a)) * 3.2;
    if (!air(x, y, z, .15) || cvRock(x, y + .45, z) < 0 && cvRock(x - .5, y, z) < 0 && cvRock(x + .5, y, z) < 0 && cvRock(x, y, z + .5) < 0) continue;
    cvVine(cast, [x, y + .3, z], 1.6 + rnd() * 3.4, rnd, root, rnd() < .3 ? tipB : tipA); vines++;
  }
  for (const [dx, dz, len] of [[-1.3, .4, 8.5], [-.2, 1.6, 5.5], [.9, -.4, 9.5], [1.7, 1, 4.5], [-2.1, 1.9, 6.5]]) {
    const y = 15.8, x = cvShaftX(CVP.mouth, y) + dx + 1.2, z = cvShaftZ(CVP.mouth, y) + dz;
    if (!air(x, y - len, z, .3) || !air(x, y - len * .5, z, .3)) continue;
    cvVine(cast, [x, y, z], len, rnd, root, rnd() < .3 ? tipB : tipA); vines++;
  }
  /* the rope the man came down by */
  const ropeC = hex("#d9a25e"), steel = hex("#8a8f96"), rx = hx + .9, rz = hz + .5, ry = heapY(rx, rz);
  addTube(cast, { path: [[rx - .15, 30, rz], [rx - .1, 12, rz], [rx - .04, 5, rz], [rx, ry + .04, rz], [rx + .5, heapY(rx + .5, rz + .2) + .04, rz + .2], [rx + .9, heapY(rx + .9, rz) + .04, rz]], rad: .028, sides: 6, col: ropeC, mat: CVM.rope, x: 1 });

  /* the crack: a stake at its edge and the rope down */
  const sx0 = CVP.chasm[0] - 2.55, sz0 = .5, sy0 = cvDown(sx0, 1.2, sz0);
  addTube(cast, { path: [[sx0, sy0 - .2, sz0], [sx0 + .05, sy0 + .5, sz0]], rad: t => lerp(.045, .035, t), sides: 7, col: steel, mat: CVM.rope, cap: true, x: 1 });
  addBlob(cast, { c: [sx0 + .05, sy0 + .52, sz0], r: [.06, .03, .06], sub: 1, col: hex("#ee7326"), mat: CVM.rope, x: 1 });
  const ex0 = CVP.chasm[0] - 1.55;
  addTube(cast, { path: [[sx0 + .04, sy0 + .42, sz0], [sx0 + .45, sy0 + .16, sz0], [ex0 - .1, cvDown(ex0 - .1, 1.2, sz0) + .06, sz0], [ex0 + .12, sy0 - .6, sz0], [ex0 + .16, -4, sz0], [ex0 + .16, -14, sz0]], rad: .028, sides: 6, col: ropeC, mat: CVM.rope, x: 1 });

  /* the far chamber behind the arch: where its own day lands stands a great stack, with green at its foot */
  const fx = cvShaftX(CVP.sky2, 1), fz = cvShaftZ(CVP.sky2, 1);
  for (const [dx, dz, h, r] of [[-.5, .3, 3.6, 1.15], [2.9, 2.2, 1.9, .7], [1.4, -5, 1.3, .55], [-3.6, 1.6, 1.2, .5], [-5.4, -2.5, 2.2, .7]])
    if (air(fx + dx, 3, fz + dz)) { cvMite(cast, fx + dx, 3, fz + dz, h, r, rnd); mites++; }
  for (let k = 0; k < 9; k++) {
    const x = fx + (rnd() - .5) * 4.4, z = fz + (rnd() - .5) * 4;
    if (!air(x, 3, z)) continue;
    const y = cvDown(x, 3, z);
    if (k < 4) cvStone(cast, [x, y + .15, z], [.5 + rnd() * .5, .35 + rnd() * .2, .5 + rnd() * .4], 40 + k * 5, rnd(), 1);
    else addRosette(cast, [x, y + .02, z], .5 + rnd() * .6, rnd, root, tipA, 14, 0);
  }
  clump(fx - 3.5, fz - 3, 5, 1.6, 2.2, 4, 12); clump(fx + 3, fz + 1, 5, 1.6, 1.6, 4, 12);

  /* the crystals: a grotto of them on the far shore, and a few strays that lead the eye there */
  const mauve = [hex("#6a3a9a"), hex("#e2a0e6")], lights = [], glows = [];
  const grow = (x, y, z, n, size, glow, roof) => {
    if (!air(x, y, z, .3)) return null;
    const py = roof ? cvUp(x, y, z) : cvDown(x, y, z), e = .25, p = [x, py, z];
    const nrm = v3.norm([cvRock(x - e, py, z) - cvRock(x + e, py, z), cvRock(x, py - e, z) - cvRock(x, py + e, z), cvRock(x, py, z - e) - cvRock(x, py, z + e)]);
    cvCluster(cast, [x - nrm[0] * .1, py - nrm[1] * .1, z - nrm[2] * .1], nrm, n, size, rnd, mauve, glow);
    return v3.add(p, v3.mul(nrm, size * .5));
  };
  const cA = grow(19.6, .2, 31, 14, 3.4, 3.4), cB = grow(16.2, 0, 30.2, 8, 2.0, 3), cC = grow(22.6, .6, 32.5, 9, 2.4, 3.2, true);
  grow(23.2, -.4, 30, 7, 1.7, 3); grow(13.4, -.6, 29.6, 5, 1.1, 2.6); grow(21, 0, 27.6, 5, 1.2, 2.8);

  /* amber: drops in the pocket over the gallery and along the crawl that leads from it to the hall */
  const amb = [], trail = [], pk = CV_POCKET;
  for (const [dx, dz, l] of [[-.2, -.1, .5], [.6, .8, .8], [-.9, 1.1, .35], [.2, 1.9, .6], [1.3, .1, .45]])
    if (air(pk[0] + dx, pk[1] - .2, pk[2] + dz, .2)) amb.push(cvAmber(cast, pk[0] + dx, pk[1] - .2, pk[2] + dz, l, rnd));
  for (const t of [.3, .75, 1.2, 1.6, 2.1, 2.5]) {
    const k = Math.min(2, Math.floor(t)), a = CV_CRAWL[k], b = CV_CRAWL[k + 1], p = cvPlace(v3.lerp(a, b, t - k));
    if (air(p[0], p[1], p[2] + .2, .15)) trail.push(cvAmber(cast, p[0], p[1], p[2] + .2, .2 + rnd() * .3, rnd));
  }

  /* life: the lights on the roof of the hall, the pale ones in the lake */
  const worms = cvWorms(cast, rnd), fish = cvFish(cast, rnd);

  /* water, what lies in the stone of the cut, the wing */
  cvLake(water); cvSection(water);
  cvInk(ink);
  cvWing(wing, rnd, aspect);

  /* lights without shadows: what the lamp spills, what the lit places give back, what glows by itself */
  const L = (p, r, c) => lights.push({ p, r, c });
  L(lampP, 12, v3.mul(CV_LAMP.col, .34));
  L([CVP.manX + 3.6, my + .7, 1.3], 9, [.22, .15, .08]);
  L([CVP.manX - 3.4, my + 2.4, -.6], 7.5, [.085, .125, .15]);
  L([hx + 1.2, 2.8, hz + .5], 11, [.13, .18, .15]);
  L([cvShaftX(CVP.mouth, 12), 12, hz + .4], 13, [.30, .38, .44]);
  L([fx + .6, 3.2, fz], 17, [.22, .30, .27]);
  if (cA) L(cA, 26, [.8, .39, 1.05]);
  if (cC) L(cC, 14, [.4, .2, .55]);
  if (amb.length) L([amb[0][0] + .3, amb[0][1] - .2, amb[0][2] + .4], 3.8, [.5, .27, .07]);
  if (trail.length > 2) L([trail[2][0], trail[2][1] - .1, trail[2][2]], 3.2, [.4, .22, .06]);
  L([10, CVP.water - .6, .5], 10, [.04, .14, .15]);
  L([12, 7.5, 7], 22, [.05, .07, .105]);
  /* the glows of the air: where a halo hangs, how strong, how wide */
  const G = (p, c, k, s) => glows.push({ p, c, k, s });
  if (cA) G(cA, [.62, .30, .85], 1.3, 3.8);
  if (cB) G(cB, [.62, .30, .85], .7, 2.6);
  if (cC) G(cC, [.62, .30, .85], .7, 2.6);
  if (amb.length) G(amb[0], [1, .55, .15], .35, 1.1);
  G(lampP, [1, .74, .42], .9, .42);

  return {
    rock: R.rock, cut: R.cut, cast: cast.done(), man: man.done(), water: water.done(), wing: wing.done(), ink: ink.done(),
    lamp: { p: lampP, d: CV_LAMP.dir }, sun: CV_SUN, lights, glows, manY: my,
    stats: Object.assign({ cols, tites, mites, veils, vines, worms, fish, lights: lights.length, castTris: cast.ni / 3, waterTris: water.ni / 3, sceneMs: Math.round(performance.now() - t0) }, R.stats)
  };
}
