"use strict";
/* Planet look-dev stand — the cast: flora, stone, the ship, the man, beasts, a deposit, the landmark,
   the dark wing. Every body comes out of the kit and is lit by the same light. Stand-ins for the key frame:
   each family gets its own design pass later (docs/DESIGN-planet.md, stage 2). */

/* crowns of this world: green is the body, straw and teal vary it, mauve blossom is the accent and keeps to
   one grove. Orange is not in the list: it belongs to people and to ore. */
const TINTS = [
  { top: hex("#9cc04a"), under: hex("#2f5f45") }, { top: hex("#bfc04e"), under: hex("#4a6a3a") },
  { top: hex("#cf8fb0"), under: hex("#5a4466") }, { top: hex("#6fb58a"), under: hex("#24514f") }
];

/* shrubs of the far shore: the same greens, quieter */
const FAR_TINTS = [{ top: hex("#86a850"), under: hex("#33594a") }, { top: hex("#a9ab5a"), under: hex("#4a6044") }];

/* a point given by where it sits in the frame: sx −1…1, sy 0 bottom … 1 top, d metres from the lens */
function atFrame(sx, sy, d, aspect) {
  const th = Math.tan(CAM.fov / 2), pitch = (CAM.eye[1] - CAM.tgt[1]) / (CAM.tgt[2] - CAM.eye[2]);
  return [CAM.eye[0] + sx * th * aspect * d, CAM.eye[1] + d * ((sy - .5) * 2 * th - pitch), CAM.eye[2] + d];
}
/* the crest of a flat at this x: the highest point between two depths */
function crestAt(x, z0, z1, step) {
  let bz = z0, by = -1e9;
  for (let z = z0; z <= z1; z += step) { const h = groundH(x, z); if (h > by) { by = h; bz = z; } }
  return [x, by, bz];
}

/* a cap: a dome with a flat underside — the shape this world repeats in clouds, crowns and shrubs */
function addCap(m, c, pr, ph, o) {
  addBlob(m, {
    c, r: [pr, ph, pr], sub: o.sub, bump: o.bump == null ? .2 : o.bump, bumpF: o.bumpF || 2.4, seed: o.seed, yaw: o.yaw || 0, lean: o.lean || 0,
    cut: -.22 * ph, col: o.col, mat: MAT.leaf, wind: o.wind, nc: o.nc, ncK: o.ncK == null ? .5 : o.ncK
  });
}

/* the umbrella tree — the dominant form of this world: a thick foot, a fork, a vase of limbs and a crown in
   three tiers of caps with shade between them. R is the radius of the whole crown. */
function makeTree(rnd, H, R, tint, sub, rich, o) {
  o = o || {};
  const m = new Mesh(4096), barkA = hex("#a88c6c"), barkB = hex("#5c4a3c"), k = H / 9, thin = o.thin || 1;
  const lean = o.lean == null ? (rnd() - .5) * .5 : o.lean, bend = o.bend == null ? (rnd() - .5) * 1.2 : o.bend;
  const fork = H * (.40 + rnd() * .12), cx = lean * H * .2, path = [];
  for (let i = 0; i <= 8; i++) { const t = i / 8; path.push([cx * t * .5 + bend * Math.sin(t * Math.PI * .9) * .3 * k, fork * t - .35, .15 * bend * Math.sin(t * 3.3) * k]); }
  addTube(m, {
    path, rad: t => lerp(.46, .27, Math.pow(t, .6)) * k * thin * (1 + 1.1 * Math.pow(1 - t, 5)), sides: 9,
    col: (t, a) => v3.mul(mix3(barkB, barkA, .5 + .5 * Math.cos(a + 1)), .82 + .18 * Math.sin(t * 23 + a * 2)), mat: MAT.bark, wind: t => t * t * .02 * k
  });
  const F = path[8], nc = [cx, H * .60, 0];
  const leafCol = (u, p, n) => v3.mul(mix3(tint.under, tint.top, smooth(-.15, .5, n[1])), 1 + gnoise(p[0] * .8, p[2] * .8 + p[1], 7) * .14);
  const wnd = p => (.08 + .14 * Math.hypot(p[0] - cx, p[2]) / R) * k;
  /* a tier: its height, the radius of its ring, the radius of its caps, how many of them */
  const tiers = rich ? [[.71, .64, .38, 6], [.835, .33, .37, 4], [.95, 0, .33, 1]]
    : [[.72, .60, .42, 4 + (rnd() * 2 | 0)], [.85, .27, .40, 2 + (rnd() * 2 | 0)], [.96, 0, .33, 1]];
  tiers.forEach(([th, tr, tp, tn], ti) => {
    const a0 = rnd() * TAU;
    for (let b = 0; b < tn; b++) {
      const ang = a0 + b / tn * TAU + (rnd() - .5) * .5, rr = R * tr * (.85 + rnd() * .3);
      const pr = R * tp * (.85 + rnd() * .3), ph = pr * (.34 + rnd() * .1);
      const e = [cx + Math.cos(ang) * rr, H * (th + (rnd() - .5) * .035), Math.sin(ang) * rr * .9];
      const mid = [lerp(F[0], e[0], .3), lerp(F[1], e[1], .8), lerp(F[2], e[2], .3)];
      addTube(m, { path: bez(F, mid, e, 7), rad: t => lerp(.22, .06, Math.pow(t, .8)) * k, sides: 6, col: barkB, mat: MAT.bark, wind: t => (.02 + .1 * t * t) * k });
      addCap(m, [e[0], e[1] + ph * .2, e[2]], pr, ph, { sub, seed: ti * 31 + b * 7 + (rnd() * 99 | 0), yaw: rnd() * TAU, lean: (rnd() - .5) * .12, col: leafCol, wind: wnd, nc, ncK: .35 });
      /* a small cap on the rim of the lowest tier breaks the outline */
      if (!ti && (rich || rnd() < .5)) {
        const a2 = ang + (rnd() - .5) * .9, r2 = rr + pr * (.75 + rnd() * .2), sr = pr * (.36 + rnd() * .16);
        addCap(m, [cx + Math.cos(a2) * r2, e[1] - pr * (.1 + rnd() * .15), Math.sin(a2) * r2 * .9], sr, sr * .45, { sub: Math.max(1, sub - 1), seed: b * 5 + 3, yaw: rnd() * TAU, col: leafCol, wind: wnd, nc, ncK: .35 });
      }
    }
  });
  return m;
}

function addRock(m, c, r, seed, tone, sub, shade) {
  const a = v3.mul(mix3(PAL.rockWarm, PAL.rockCool, tone), shade == null ? 1 : shade), b = v3.mul(a, .62);
  addBlob(m, {
    c, r, sub: sub == null ? 1 : sub, bump: .5, bumpF: 1.25, seed, yaw: seed * 1.37, lean: Math.sin(seed) * .2, cut: -.4 * r[1],
    col: (u, p, n) => {
      const base = mix3(b, a, smooth(-.6, .6, u[1] + gnoise(p[0] * .9, p[1] * 2.2, seed) * .5));
      return mix3(base, v3.mul(PAL.moss, shade == null ? 1 : shade * 1.3), smooth(.55, .9, n[1]) * smooth(-.1, .3, gnoise(p[0] * .7 + 3, p[2] * .7, seed + 2)) * .7);
    }, mat: MAT.rock
  });
}
/* a rosette: blades that spring from one root and droop — the shrub of the near lane, where a smooth cap
   among blades of grass would read as a pillow */
function addRosette(m, c, r, rnd, root, tip, n, bloom) {
  for (let b = 0; b < n; b++) {
    const a = rnd() * TAU, el = .15 + 1.15 * Math.sqrt(rnd()), len = r * (.75 + rnd() * .55) * (.7 + .3 * Math.sin(el)), w = r * (.10 + rnd() * .05);
    const out = [Math.cos(a), 0, Math.sin(a)], side = [-Math.sin(a), 0, Math.cos(a)], droop = .35 + rnd() * .5;
    const tcol = v3.mul(tip, .85 + rnd() * .3);
    let pa = -1, pb = -1, px = 0, py = 0;
    for (let s = 0; s <= 5; s++) {
      /* the blade leaves the root at el from the vertical and droops further along its length */
      const t = s / 5, e = el + droop * t * t * 1.2;
      if (s) { const em = el + droop * (t - .1) * (t - .1) * 1.2; px += Math.sin(em) * len / 5; py += Math.cos(em) * len / 5; }
      const p = [c[0] + out[0] * px, c[1] + py - .05, c[2] + out[2] * px];
      const ww = w * Math.sin(Math.PI * Math.pow(t, .6)) * .9 + (s === 5 ? 0 : .006);
      const nr = v3.norm([-out[0] * Math.cos(e), Math.sin(e) + .35, -out[2] * Math.cos(e)]);
      const col = mix3(root, tcol, Math.pow(t, .7));
      const va = m.vert([p[0] - side[0] * ww, p[1], p[2] - side[2] * ww], nr, col, MAT.grass, t * t * .18 * len, 0, t);
      const vb = m.vert([p[0] + side[0] * ww, p[1], p[2] + side[2] * ww], nr, col, MAT.grass, t * t * .18 * len, 0, t);
      if (s) m.quad(pa, pb, vb, va);
      pa = va; pb = vb;
    }
  }
  /* a spike of blossom over the rosette: the accent of this world, sparingly */
  if (bloom) for (let k = 0; k < bloom; k++) {
    const a = rnd() * TAU, d = r * .25 * rnd(), top = [c[0] + Math.cos(a) * d * 2, c[1] + r * (1.25 + rnd() * .5), c[2] + Math.sin(a) * d * 2];
    addTube(m, { path: [[c[0] + Math.cos(a) * d, c[1], c[2] + Math.sin(a) * d], top], rad: .012, sides: 4, col: root, mat: MAT.grass, wind: t => t * t * .12 });
    for (let j = 0; j < 5; j++) addBlob(m, { c: [top[0] + (rnd() - .5) * .08, top[1] - j * .075, top[2] + (rnd() - .5) * .08], r: [.05, .045, .05], sub: 0, col: v3.mul(hex("#d983b0"), .9 + rnd() * .25), mat: MAT.grass, wind: .12, x: 1, glow: .12 });
  }
}
function addBush(m, c, r, rnd, tint) {
  const n = 3 + (rnd() * 3 | 0), nc = [c[0], c[1] - r * .4, c[2]];
  const col = (u, p, nn) => v3.mul(mix3(tint.under, tint.top, smooth(-.2, .5, nn[1])), 1 + gnoise(p[0] * 1.3, p[2] * 1.3 + p[1], 3) * .12);
  for (let k = 0; k < n; k++) {
    const a = rnd() * TAU, d = k ? r * (.3 + rnd() * .6) : 0, rr = r * (k ? .45 + rnd() * .3 : .8);
    addCap(m, [c[0] + Math.cos(a) * d, c[1] + rr * .2, c[2] + Math.sin(a) * d * .7], rr, rr * .78, { sub: 1, seed: k * 3 + (rnd() * 50 | 0), yaw: rnd() * TAU, col, wind: .04, nc });
  }
}

/* stations of a hull, smoothed: Catmull–Rom through the given ones */
function resample(st, n) {
  const out = [], keys = ["x", "ry", "rz", "y"];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1) * (st.length - 1), k = Math.min(Math.floor(u), st.length - 2), t = u - k;
    const a = st[Math.max(k - 1, 0)], b = st[k], c = st[k + 1], d = st[Math.min(k + 2, st.length - 1)], o = {};
    for (const q of keys) o[q] = .5 * ((2 * b[q]) + (-a[q] + c[q]) * t + (2 * a[q] - 5 * b[q] + 4 * c[q] - d[q]) * t * t + (-a[q] + 3 * b[q] - 3 * c[q] + d[q]) * t * t * t);
    out.push(o);
  }
  return out;
}
/* the ship on its gear: about five heights of the man; the livery stripe is the colour the man wears */
function makeShip(lamps, at, yaw) {
  const m = new Mesh(16384);
  const hull = hex("#d9d5c8"), belly = hex("#34373e"), accent = hex("#ee7326"), glass = hex("#0d1820"), metal = hex("#7d828a"), dark = hex("#25272c");
  const st = resample([
    { x: -4.5, ry: .62, rz: .85, y: 2.30 }, { x: -3.9, ry: .98, rz: 1.25, y: 2.25 }, { x: -2.0, ry: 1.22, rz: 1.55, y: 2.20 }, { x: 0, ry: 1.28, rz: 1.62, y: 2.15 },
    { x: 1.9, ry: 1.16, rz: 1.48, y: 2.12 }, { x: 3.2, ry: .90, rz: 1.15, y: 2.16 }, { x: 4.05, ry: .56, rz: .72, y: 2.24 }, { x: 4.5, ry: .16, rz: .22, y: 2.30 }], 56);
  const zone = (t, s, p) => {
    const x = p[0];
    if (s < -.42) return 0;
    if (x > 2.3 && x < 3.7 && s > .30 && s < .88) return 1;
    if (s > .02 && s < .2 && x > -3.9 && x < 2.9) return 2;
    return 3;
  };
  addLoft(m, {
    st, sides: 64, mat: MAT.man,
    col: (t, s, p) => {
      const z = zone(t, s, p); if (z === 0) return belly; if (z === 1) return glass; if (z === 2) return accent;
      return v3.mul(hull, Math.abs(((p[0] + 9) % 1.15) - .575) > .54 ? .78 : 1 - .06 * smooth(.2, -.4, s));
    },
    x: (t, s, p) => [.1, 1, .3, .3][zone(t, s, p)]
  });
  for (const z of [-.62, .62]) addTube(m, { path: [[-4.2, 2.26, z], [-4.8, 2.26, z], [-5.35, 2.26, z]], rad: t => lerp(.36, .56, t), sides: 14, col: (t) => mix3(metal, dark, t), mat: MAT.man, x: .5 });
  addBlob(m, { c: [-3.1, 3.72, 0], r: [1.05, .8, .07], box: .5, sub: 2, lean: -.38, col: (u) => u[1] > .55 ? accent : hull, mat: MAT.man, x: .3 });
  for (const z of [-1.95, 1.95]) addBlob(m, { c: [-2.3, 2.0, z], r: [1.15, .06, .75], box: .6, sub: 2, yaw: z > 0 ? .25 : -.25, col: hull, mat: MAT.man, x: .3 });
  const leg = (hip, foot) => {
    const knee = [lerp(hip[0], foot[0], .45), lerp(hip[1], foot[1], .4) + .05, lerp(hip[2], foot[2], .7)];
    addTube(m, { path: [hip, knee, foot], rad: t => lerp(.11, .075, t), sides: 8, col: metal, mat: MAT.man, x: .5 });
    addTube(m, { path: [[hip[0] - .7, hip[1] + .1, hip[2] * .8], knee], rad: .05, sides: 6, col: dark, mat: MAT.man, x: .4 });
    addBlob(m, { c: [foot[0], foot[1] - .04, foot[2]], r: [.36, .07, .36], sub: 1, col: dark, mat: MAT.man, x: .2 });
  };
  leg([2.7, 1.3, 0], [3.2, .12, 0]); leg([-2.3, 1.4, -1.2], [-2.9, .12, -2.1]); leg([-2.3, 1.4, 1.2], [-2.9, .12, 2.1]);
  /* the hatch on the side that looks at us: a collar, a dark frame, the lit doorway (warmer and brighter
     towards the floor, as a room is) and the ramp */
  addBlob(m, { c: [.75, 2.0, -1.28], r: [.82, .92, .42], box: .35, sub: 2, col: v3.mul(hull, .8), mat: MAT.man, x: .3 });
  addQuad(m, [.24, 1.26, -1.712], [1.26, 1.26, -1.712], [1.26, 2.76, -1.712], [.24, 2.76, -1.712], [0, 0, -1], dark, MAT.man, null, 0, .2);
  {
    const NXD = 6, NYD = 10, ids = [];
    for (let j = 0; j <= NYD; j++) for (let i = 0; i <= NXD; i++) {
      const u = i / NXD, v = j / NYD, jamb = .62 + .38 * Math.sin(u * Math.PI), room = lerp(3.1, .95, Math.pow(v, .8));
      ids.push(m.vert([lerp(.36, 1.14, u), lerp(1.34, 2.68, v), -1.722], [0, 0, -1], [1, lerp(.54, .40, v), lerp(.22, .12, v)], MAT.glow, 0, room * jamb, 0));
    }
    for (let j = 0; j < NYD; j++) for (let i = 0; i < NXD; i++) {
      const a = j * (NXD + 1) + i;
      m.quad(ids[a], ids[a + 1], ids[a + NXD + 2], ids[a + NXD + 1]);
    }
  }
  addBlob(m, { c: [.75, .68, -2.95], r: [.56, .05, 1.45], box: .35, sub: 2, pitch: -.45, col: metal, mat: MAT.man, x: .3 });
  addBlob(m, { c: [-3.55, 4.5, 0], r: [.07, .07, .07], sub: 1, col: [1, .12, .08], mat: MAT.glow, glow: 5 });
  addBlob(m, { c: [.9, 3.5, 0], r: [.5, .1, .5], sub: 1, col: hull, mat: MAT.man, x: .3 });
  addTube(m, { path: [[.9, 3.4, 0], [.9, 4.3, 0]], rad: .025, sides: 5, col: dark, mat: MAT.man });
  const c = Math.cos(yaw), s = Math.sin(yaw), L = [.75, 1.9, -2.4];
  lamps.push({ p: [at[0] + L[0] * c + L[2] * s, at[1] + L[1], at[2] - L[0] * s + L[2] * c], r: 7.5, c: [1, .6, .28], k: 2.6 });
  return m;
}

/* the man: 1.8 m, the suit in the colour of people, white helmet and pack, a dark visor, legs in a stride.
   Orange holds in light and in shade against grass, water and sky alike. */
function makeMan() {
  const m = new Mesh(8192);
  const suit = hex("#ee7326"), white = hex("#efe9dc"), joint = hex("#8a8f96"), glass = hex("#0e1a22"), dark = hex("#3a3d42");
  const limb = (path, r0, r1, col) => addTube(m, { path, rad: t => lerp(r0, r1, t), sides: 10, col, mat: MAT.man, x: .15, cap: true });
  const legCol = (t) => t > .42 && t < .56 ? white : suit;
  limb([[0, .94, .1], [.17, .52, .1], [.30, .13, .1]], .115, .085, legCol);
  limb([[0, .94, -.1], [-.07, .50, -.1], [-.32, .17, -.1]], .115, .085, legCol);
  addBlob(m, { c: [.35, .07, .1], r: [.16, .075, .095], sub: 1, col: white, mat: MAT.man, x: .2 });
  addBlob(m, { c: [-.33, .12, -.1], r: [.16, .075, .095], sub: 1, lean: -.5, col: white, mat: MAT.man, x: .2 });
  addBlob(m, { c: [.02, 1.2, 0], r: [.2, .33, .25], sub: 2, lean: -.08, col: (u) => u[1] < -.55 ? dark : suit, mat: MAT.man, x: .15 });
  addBlob(m, { c: [-.26, 1.24, 0], r: [.13, .29, .2], box: .45, sub: 2, col: (u) => u[1] > .25 && u[1] < .5 ? joint : white, mat: MAT.man, x: .25 });
  addTube(m, { path: [[-.3, 1.5, .12], [-.31, 1.95, .12]], rad: .012, sides: 5, col: dark, mat: MAT.man });
  const vis = (u) => u[0] > .25 && u[1] < .55 && u[1] > -.45;
  addBlob(m, { c: [.04, 1.64, 0], r: [.175, .175, .175], sub: 2, col: (u) => vis(u) ? glass : white, mat: MAT.man, x: (u) => vis(u) ? 1 : .3 });
  addBlob(m, { c: [.12, 1.74, -.17], r: [.04, .04, .04], sub: 1, col: joint, mat: MAT.man, x: .4 });
  const armCol = (t) => t > .5 && t < .62 ? white : suit;
  limb([[0, 1.44, -.27], [-.12, 1.16, -.3], [-.22, .93, -.27]], .082, .065, armCol);
  limb([[0, 1.44, .27], [.14, 1.17, .3], [.30, .98, .27]], .082, .065, armCol);
  addBlob(m, { c: [-.24, .88, -.27], r: [.07, .075, .06], sub: 1, col: white, mat: MAT.man, x: .2 });
  addBlob(m, { c: [.33, .94, .27], r: [.07, .075, .06], sub: 1, col: white, mat: MAT.man, x: .2 });
  return m;
}

/* a strider: long legs, a neck, a small head — a silhouette read from far away */
function makeStrider(rnd, ph) {
  const m = new Mesh(4096), body = hex("#b98a5a"), under = hex("#d9c39a"), legc = hex("#5c4a3a");
  addBlob(m, { c: [0, 3.7, 0], r: [1.55, .62, .7], sub: 2, lean: .06, col: (u) => mix3(under, body, smooth(-.5, .2, u[1])), mat: MAT.beast });
  addTube(m, { path: bez([1.2, 3.85, 0], [1.9, 4.5, 0], [2.05, 5.55, 0], 6), rad: t => lerp(.24, .13, t), sides: 8, col: body, mat: MAT.beast });
  addBlob(m, { c: [2.32, 5.66, 0], r: [.44, .2, .2], sub: 1, lean: -.15, col: body, mat: MAT.beast });
  addTube(m, { path: bez([-1.4, 3.8, 0], [-2.1, 3.7, 0], [-2.7, 3.1, 0], 5), rad: t => lerp(.17, .03, t), sides: 6, col: body, mat: MAT.beast });
  for (const [hx, hz, k] of [[.95, .38, 0], [.95, -.38, 1], [-.95, .38, 1], [-.95, -.38, 0]]) {
    const sw = Math.sin(ph + k * Math.PI) * .7, lift = Math.max(0, Math.cos(ph + k * Math.PI)) * .35;
    addTube(m, { path: [[hx, 3.45, hz], [hx + sw * .5 + .25, 1.9, hz], [hx + sw, lift, hz]], rad: t => lerp(.14, .065, t), sides: 7, col: (t) => mix3(body, legc, smooth(.1, .5, t)), mat: MAT.beast });
  }
  return m;
}
/* a small beast by the path: it watches the man */
function makeCritter() {
  const m = new Mesh(2048), body = hex("#c9b07a"), under = hex("#efe2b8"), mark = hex("#d05a8a"), dark = hex("#4a4232");
  addBlob(m, { c: [0, .3, 0], r: [.4, .21, .21], sub: 2, col: (u) => mix3(under, body, smooth(-.4, .2, u[1])), mat: MAT.beast });
  addBlob(m, { c: [-.4, .42, 0], r: [.17, .15, .14], sub: 2, col: (u) => u[0] < -.2 && u[1] < -.1 ? mark : body, mat: MAT.beast });
  for (const z of [-.08, .08]) addBlob(m, { c: [-.38, .6, z], r: [.035, .12, .05], sub: 1, lean: .25, col: body, mat: MAT.beast });
  addTube(m, { path: bez([.36, .32, 0], [.62, .38, 0], [.7, .66, 0], 5), rad: t => lerp(.06, .02, t), sides: 6, col: body, mat: MAT.beast });
  for (const [x, z] of [[-.22, .13], [-.22, -.13], [.22, .13], [.22, -.13]]) addTube(m, { path: [[x, .22, z], [x - .02, 0, z]], rad: .045, sides: 6, col: dark, mat: MAT.beast });
  return m;
}
/* a flyer far over the water: a body and two raised wings, read as a tick in the sky */
function addBird(m, c, span, yaw, flap) {
  const col = hex("#2a2f3a"), w = span / 2, up = flap * w * .5;
  addBlob(m, { c, r: [span * .17, span * .05, span * .05], sub: 0, yaw, col, mat: MAT.beast });
  for (const s of [-1, 1]) {
    const q = (l) => v3.add(rotY(l, yaw), c);
    addQuad(m, q([span * .12, 0, 0]), q([-span * .12, 0, 0]), q([-span * .16, up, s * w]), q([-span * .08, up, s * w * .96]), [0, 1, 0], col, MAT.beast);
  }
}
/* a deposit: a low mound with ore standing out of it */
function addDeposit(m, c, rnd, blobs) {
  addRock(m, [c[0], c[1] + .1, c[2]], [1.15, .5, .9], 17, .4);
  const ore = hex("#c8743a"), oreB = hex("#f0a860");
  for (let k = 0; k < 7; k++) {
    const a = rnd() * TAU, d = .25 + rnd() * .75, r = .16 + rnd() * .2;
    addBlob(m, {
      c: [c[0] + Math.cos(a) * d, c[1] + .38 - d * .25 + r * .3, c[2] + Math.sin(a) * d * .7], r: [r, r * (1.1 + rnd() * .8), r], sub: 0, yaw: rnd() * 3, lean: (rnd() - .5) * .8,
      col: (u) => mix3(ore, oreB, smooth(0, 1, u[1])), mat: MAT.rock, x: 1, glow: .12
    });
  }
  blobs.push([c[0], c[2], 1.9, .5]);
}

/* the space elevator beyond the saddle: the far sign of this frame. A flared foot, three decks, the thread. */
function addElevator(m) {
  const R = 16000, x = LAY.x + R * Math.sin(AZ_ELEV), z = LAY.z + R * Math.cos(AZ_ELEV), y = groundH(x, z) - 40;
  const a = hex("#e6e2d6"), b = hex("#8f96a6");
  const prof = [[0, 520], [150, 470], [400, 300], [800, 170], [1300, 110], [2000, 70], [3000, 46], [5000, 32], [9000, 26], [14000, 22]];
  addTube(m, { path: prof.map(q => [x, y + q[0], z]), rad: t => { const u = t * (prof.length - 1), k = Math.min(Math.floor(u), prof.length - 2); return lerp(prof[k][1], prof[k + 1][1], u - k); }, sides: 12, up: [1, 0, 0], col: (t, ang) => mix3(b, a, .5 + .5 * Math.cos(ang)), mat: MAT.far });
  for (const [h, r] of [[640, 380], [1500, 210], [2300, 135]]) addBlob(m, { c: [x, y + h, z], r: [r, r * .16, r], sub: 2, col: a, mat: MAT.far });
  /* the climber on its way up, and the lights of the foot */
  addBlob(m, { c: [x, y + 1950, z], r: [70, 120, 70], sub: 1, col: a, mat: MAT.far });
  addBlob(m, { c: [x - 60, y + 1950, z - 90], r: [26, 26, 26], sub: 0, col: [1, .7, .35], mat: MAT.glow, glow: 9 });
  for (let k = 0; k < 5; k++) addBlob(m, { c: [x + (k - 2) * 190, y + 330 + (k % 2) * 110, z - 500], r: [22, 22, 22], sub: 0, col: [1, .7, .35], mat: MAT.glow, glow: 8 });
}

/* a broad leaf: a flattened tube whose face looks at the lens */
function addLeaf(m, a, b, c, wid, colA, colB, turn) {
  addTube(m, {
    path: bez(a, b, c, 12), rad: t => wid * Math.sin(Math.PI * Math.pow(t, .7)) + .012, flat: .07, sides: 8, up: [Math.cos(turn), 0, Math.sin(turn)],
    col: (t, ang) => mix3(colA, colB, clamp(t * .7 + .2 * Math.cos(ang), 0, 1)), mat: MAT.leaf, wind: (t) => t * t * .22
  });
}
/* a tuft at a given height (the wing stands on bodies, not on the ground function) */
function tuftAt(m, x, y, z, hgt, rnd, root, tip) {
  const nb = 3 + (rnd() * 2 | 0);
  for (let b = 0; b < nb; b++) {
    const yaw = (rnd() - .5) * 1.9, lean = (rnd() - .5) * 1.2, w = hgt * (.07 + rnd() * .04), bh = hgt * (.6 + rnd() * .5);
    const dir = [Math.cos(yaw), 0, Math.sin(yaw)], fwd = [-Math.sin(yaw), 0, Math.cos(yaw)], ox = (rnd() - .5) * .3, oz = (rnd() - .5) * .3;
    const nr = v3.norm([(rnd() - .5) * .5, 1, -.35]);
    let pa = -1, pb = -1;
    for (let s = 0; s <= 4; s++) {
      const t = s / 4, ww = w * (1 - t * t) * .5 + (s === 4 ? 0 : .004), bend = lean * bh * t * t, c = [x + ox + fwd[0] * bend, y + bh * t, z + oz + fwd[2] * bend];
      const col = mix3(root, tip, Math.pow(t, .8));
      const a = m.vert([c[0] - dir[0] * ww, c[1], c[2] - dir[2] * ww], nr, col, MAT.grass, t * t * .25 * bh, 0, t);
      const bb = m.vert([c[0] + dir[0] * ww, c[1], c[2] + dir[2] * ww], nr, col, MAT.grass, t * t * .25 * bh, 0, t);
      if (s) m.quad(pa, pb, bb, a);
      pa = a; pb = bb;
    }
  }
}
/* the dark wing: a bank with broad leaves in the left corner, a stone with tall grass in the right one — close
   to the lens, laid out by place in the frame so that it never covers an actor */
function buildWing(F, rnd, aspect) {
  /* the wing is the darkest thing in the frame: a cut-out in deep green, read by its outline */
  const soil = hex("#1c2620"), moss = hex("#26402c"), leafA = hex("#123a30"), leafB = hex("#2f6a3e"), root = hex("#10261e"), straw = hex("#5f6a3a");
  const P = (sx, sy, d) => atFrame(sx, sy, d, aspect);
  /* bottom left: a bank with grass */
  const bank = P(-1.04, -.07, 15), bw = P(-.54, 0, 15)[0] - P(-1.04, 0, 15)[0], bh = P(0, .15, 15)[1] - P(0, -.07, 15)[1];
  addBlob(F, { c: bank, r: [bw, bh, 4], sub: 3, bump: .16, seed: 5, col: (u) => mix3(soil, moss, smooth(.2, .9, u[1])), mat: MAT.ground, x: 1 });
  for (let k = 0; k < 90; k++) {
    const sx = -1.04 + rnd() * .5, u = (sx + 1.04) / .5, p = P(sx, -.07 + .22 * Math.sqrt(Math.max(0, 1 - u * u)) - .02, 14.2 + rnd() * 2);
    tuftAt(F, p[0], p[1], p[2], .4 + rnd() * .5, rnd, root, rnd() < .2 ? straw : v3.mul(leafB, .8));
  }
  /* a rosette of broad blades on the bank */
  const rs = P(-.86, .105, 14.8);
  addRosette(F, rs, 1.25, rnd, leafA, leafB, 30, 0);
  /* bottom right: the same bank, lower and longer, under tall grass. A stone here showed the feet of the
     tufts against its pale face, as a flight of steps */
  const bank2 = P(1.08, -.08, 15.6), bw2 = P(1.08, 0, 15.6)[0] - P(.5, 0, 15.6)[0], bh2 = P(0, .12, 15.6)[1] - P(0, -.08, 15.6)[1];
  addBlob(F, { c: bank2, r: [bw2, bh2, 4], sub: 3, bump: .16, seed: 9, col: (u) => mix3(soil, moss, smooth(.2, .9, u[1])), mat: MAT.ground, x: 1 });
  for (let k = 0; k < 120; k++) {
    const sx = .52 + rnd() * .56, u = (1.08 - sx) / .58, p = P(sx, -.08 + .2 * Math.sqrt(Math.max(0, 1 - u * u)) - .02, 14.8 + rnd() * 1.6);
    tuftAt(F, p[0], p[1], p[2], .5 + rnd() * .7, rnd, root, rnd() < .22 ? straw : v3.mul(leafB, .75));
  }
}

function buildScene(aspect) {
  setCam(aspect);
  const t0 = performance.now(), rnd = rngOf(SEED + 1);
  const S = new Mesh(1 << 19), W = new Mesh(1 << 15), F = new Mesh(1 << 15), blobs = [], lamps = [], clear = [];
  buildGround(S, aspect);
  const tGround = performance.now();
  buildWater(W);

  /* the ship and the man */
  const shipAt = [SHIP_X, groundH(SHIP_X, SHIP_Z), SHIP_Z];
  S.add(makeShip(lamps, shipAt, SHIP_YAW), shipAt, SHIP_YAW, 1);
  blobs.push([SHIP_X, SHIP_Z, 5.2, .55]); clear.push([SHIP_X, SHIP_Z, 6.5, 4]); clear.push([RAMP_X, RAMP_Z + 1.2, 1.2, 2.2]);
  const manAt = [MAN_X, groundH(MAN_X, 0), 0];
  S.add(makeMan(), manAt, 0, 1);
  blobs.push([MAN_X, 0, .55, .5]);
  /* tracks from the ramp to the man */
  for (let k = 0, x = RAMP_X + .4; x < MAN_X - .3; x += .36, k++) {
    const z = rampLine(x) + (k % 2 ? .13 : -.13);
    addBlob(S, { c: [x, groundH(x, z) + .012, z], r: [.14, .012, .075], sub: 1, col: v3.mul(PAL.soilDark, .45), mat: MAT.ground, x: 1 });
  }
  /* life by the path */
  const crAt = [3.2, groundH(3.2, .4), .4];
  S.add(makeCritter(), crAt, .25, 1.25); blobs.push([crAt[0], crAt[2], .6, .45]);
  addDeposit(S, [8.6, groundH(8.6, -1.8), -1.8], rnd, blobs); clear.push([8.6, -1.8, 1.6, 1.3]);

  /* stone, placed by hand: an outcrop under the near tree, a boulder by the branch of the path, a pair on the
     raked lane, three dark ones down the near slope; small ones scattered along the path */
  const rock = (x, z, r, tone, sub) => {
    addRock(S, [x, groundH(x, z) + r * .15, z], [r * 1.2, r * .8, r], (x * 7 + z * 3) | 0, tone, sub);
    blobs.push([x, z, r * 1.8, .5]); clear.push([x, z, r * 1.3, r * 1.3]);
  };
  for (const [x, z, r, tone] of [[14.2, 5.2, 1.6, .3], [15.6, 4.0, .9, .5], [12.9, 6.2, .7, .2], [-7.6, -2.7, .8, .4], [5.6, -3.3, .9, .6], [6.5, -3.9, .5, .3],
    [-9, -9, 1.3, .7], [2, -11, 1.0, .6], [11, -8.5, 1.5, .8], [-17.5, -1.5, .6, .4]]) rock(x, z, r, tone, r > .85 ? 2 : 1);
  for (let k = 0; k < 14; k++) {
    const x = -20 + rnd() * 40, z = -5 + rnd() * 6.5, r = .14 + rnd() * .2;
    if (pathW(x, z) > .5 || Math.hypot(x - SHIP_X, (z - SHIP_Z) * 1.5) < 7 || Math.abs(x - MAN_X) < 1.2) continue;
    addRock(S, [x, groundH(x, z) + r * .1, z], [r * (1 + rnd() * .5), r * .7, r], k * 3 + 1, rnd(), 1);
    blobs.push([x, z, r * 1.7, .4]);
  }

  /* flora: the near tree on the right, a grove on the far shore to the left with another behind it, the
     blossom grove at the mouth of the valley, woods along the hills. The valley stays open. */
  const tree = (x, z, H, R, ti, sub, rich, o) => {
    const y = groundH(x, z); if (y < WATER_Y + .5) return 0;
    S.add(makeTree(rnd, H, R, TINTS[ti], sub, rich, o), [x, y, z], o && o.yaw != null ? o.yaw : rnd() * TAU, 1);
    if (z < 30) blobs.push([x, z, R * .5, .4]);
    return 1;
  };
  const grove = (cx, cz, n, spread, h0, h1, main, acc, sub) => {
    let made = 0;
    for (let k = 0; k < n; k++) {
      const a = rnd() * TAU, d = k ? spread * Math.sqrt(rnd()) : 0, x = cx + Math.cos(a) * d * 1.5, z = cz + Math.sin(a) * d;
      const H = lerp(h0, h1, k ? .1 + rnd() * .6 : 1), R = H * (.5 + rnd() * .12), ti = rnd() < .22 ? acc : main;
      if (valley(x, z) > .25) continue;
      made += tree(x, z, H, R, ti, sub);
    }
    return made;
  };
  /* the near tree leans into the frame: its foot stands by the edge, its crown reaches towards the valley */
  let trees = tree(17.2, 8, 11.5, 6.2, 0, 3, true, { lean: -.95, bend: -1.7, yaw: 0, thin: .74 });
  trees += grove(-56, 142, 6, 10, 8, 14, 0, 1, 2);
  trees += grove(-78, 222, 7, 14, 9, 15, 3, 0, 1);
  trees += grove(-10, 312, 7, 13, 8, 13, 2, 2, 1);
  for (let k = 0; k < 9; k++) {
    const x = -330 + (k + rnd() * .7) * 74, c = crestAt(x, 270, 430, 10);
    /* behind the striders the slope stays bare */
    if (x > -58 && x < 0) continue;
    trees += grove(c[0], c[2] - 8 + rnd() * 30, 6 + (rnd() * 5 | 0), 17, 9, 15, rnd() < .5 ? 0 : 3, 1, 1);
  }

  /* shrubs of the near lane are rosettes of blades: behind the crest they break its line, a few stand on
     the near slope; two of them carry a spike of blossom */
  const rosRoot = hex("#2c5a3c"), rosTip = hex("#8fb04e"), rosCool = hex("#5fa07a");
  for (const [x, z, r, cool, bloom] of [[-19.5, 3.5, 1.5, 0, 0], [-6.5, 4.2, 1.3, 0, 0], [.5, 4.8, 1.6, 1, 3], [7.5, 4.0, 1.2, 0, 0], [10.5, 5, 1.7, 0, 0], [-4, -7, 1.1, 1, 0], [6, -6.5, .9, 0, 2], [14, -5, 1.2, 0, 0], [-13, -6, 1.0, 0, 0]]) {
    addRosette(S, [x, groundH(x, z), z], r, rnd, rosRoot, cool ? rosCool : rosTip, 56, bloom);
    blobs.push([x, z, r * 1.3, .45]); clear.push([x, z, r * .9, r * .9]);
  }
  /* where the far shore comes out of the water at this x */
  const shoreZ = (x) => { for (let z = 70; z < 150; z += .5) if (groundH(x, z) > WATER_Y - .1) return z; return 0; };
  /* the far shore: clumps of shrubs and two outcrops of pale stone, never an even scatter. Far shrubs are
     green with a straw one here and there; blossom stays in its grove */
  for (const [cx, dz, n] of [[-34, 22, 4], [20, 17, 3], [58, 24, 5], [84, 20, 4]]) for (let k = 0; k < n; k++) {
    const x = cx + (rnd() - .5) * 13, z = shoreZ(x) + dz + (rnd() - .5) * 8, y = groundH(x, z);
    if (y < WATER_Y + .3) continue;
    addBush(S, [x, y, z], 1 + rnd() * 1.3, rnd, FAR_TINTS[rnd() < .3 ? 1 : 0]);
  }
  const outcrop = (cx, dz, list) => list.forEach(([dx, dd, r, tone], k) => {
    const x = cx + dx, z = shoreZ(x) + dz + dd, y = groundH(x, z);
    addRock(S, [x, y + r * .2, z], [r * 1.25, r * .85, r], (cx * 3 + k * 7) | 0, tone, 2);
  });
  outcrop(40, 14, [[0, 0, 2.6, .15], [3.8, -1.5, 1.4, .3], [-3.4, 1, 1.0, .1], [6.8, .5, .7, .4]]);
  outcrop(-64, 18, [[0, 0, 2.0, .3], [-3, -1, 1.1, .2]]);
  /* stones in the shallows under the outcrop: the water shows them twice */
  for (const [dx, dz, r] of [[-9, -5, 1.1], [-6.5, -7.5, .6], [-12, -3.5, .45]]) {
    const x = 40 + dx, z = shoreZ(x) + dz;
    addRock(S, [x, WATER_Y - r * .1, z], [r * 1.3, r * .7, r], (x * 5) | 0, .25, 1);
  }
  /* reeds along the far waterline: a few clumps of different breadth, open water between them */
  const rr = rngOf(SEED + 9), reedRoot = hex("#2f5040"), reedTip = hex("#8fa05a"), reedDry = hex("#c9b870");
  let reeds = 0;
  for (const [cx, wid, hgt, n] of [[-55, 8, 2.2, 50], [-17, 3.5, 1.6, 22], [13, 2.5, 1.2, 12], [29, 7, 2.7, 64], [50, 4, 1.8, 26]]) {
    for (let j = 0; j < n; j++) {
      const u = (rr() + rr() + rr()) / 3 * 2 - 1;
      const x = cx + u * wid * 1.3, z0 = shoreZ(x); if (!z0) continue;
      const z = z0 + (rr() - .45) * 3.2, hh = hgt * (1 - .5 * u * u) * (.7 + rr() * .5);
      tuftAt(S, x, Math.max(groundH(x, z), WATER_Y - .25), z, hh, rr, reedRoot, rr() < .25 ? reedDry : reedTip); reeds++;
    }
  }

  /* beasts on the far shore: three striders walking the crest, left of the man's way */
  [[-21, 0, 1], [-13.5, 2.1, 1], [-8.6, 4.3, .78]].forEach(([x, ph, s]) => {
    const c = crestAt(x, 106, 170, 2);
    S.add(makeStrider(rnd, ph), c, -.12, s);
  });
  /* flyers over the water */
  const rb = rngOf(SEED + 12);
  for (let k = 0; k < 9; k++) addBird(S, [-22 + rb() * 30 + k * 1.5, 22 + rb() * 9, 160 + rb() * 50], 2.3 + rb() * .8, .5 + rb() * .5, -.3 + rb() * 1.3);

  addElevator(S);
  const tCast = performance.now();
  const tufts = buildGrass(S, clear, aspect);
  buildWing(F, rngOf(SEED + 5), aspect);

  const B = new Float32Array(4 + 64 * 4); B[0] = Math.min(blobs.length, 64);
  for (let k = 0; k < Math.min(blobs.length, 64); k++) B.set(blobs[k], 4 + k * 4);
  return {
    scene: S.done(), water: W.done(), fg: F.done(), blobs: B, lamps, hero: [(MAN_X + SHIP_X) / 2 + 3, 3],
    stats: { verts: S.nv, tris: S.ni / 3, tufts, reeds, trees, blobs: blobs.length, msGround: Math.round(tGround - t0), msCast: Math.round(tCast - tGround), msAll: Math.round(performance.now() - t0) }
  };
}
