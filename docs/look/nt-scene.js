"use strict";
/* Planet look-dev stand, key frame M602 — the night by the home. The land, the flora and the far shore are
   those of the day and are planted by the same dice; where the ship stood, people have levelled a yard and
   live. The night redeclares four functions of the day: the yard in the profile of the land, the ways people
   trod, the lens of the tall frame. Everything else of the day is called as it stands. */

const NT_Q = new URLSearchParams(typeof location === "undefined" ? "" : location.search);
const ntK = (name, def) => NT_Q.has(name) ? parseFloat(NT_Q.get(name)) : def;

/* the yard: a terrace cut into the slope; towards the man it ends early, so that he stands on the ridge */
const NT_YARD = { x: -13, y: .7, l0: 8.8, l1: 17, r0: ntK("yr0", 5.6), r1: ntK("yr1", 9.4) };
const NT_HOME = { x: -10.4, z: 7.1 }, NT_GARAGE = { x: -20.1, z: 7.4 }, NT_MAST = { x: -16, z: 9.4, h: 11.5 };
const NT_BASE = { x: ntK("basex", 29.5), out: 4 };
const NT_MAN_X = ntK("manx", -4.7);

function padLine(x) {
  const d = x - NT_YARD.x;
  return d < 0 ? 1 - smooth(NT_YARD.l0, NT_YARD.l1, -d) : 1 - smooth(NT_YARD.r0, NT_YARD.r1, d);
}
function prof(x) { return lerp(profRaw(x), NT_YARD.y, padLine(x)); }

/* the ways of the yard: from the steps to the walk line, from the garage to it, a footpath along the porch
   to the bed and the washing line */
const NT_WAYS = [
  { p: [[-5.5, 3.0], [-4.9, 2.7], [-4.3, 2.0], [-3.9, 1.1], [-3.6, .2]], r: .4, f: .7, k: 1 },
  { p: [[-20.1, 4.3], [-19.7, 2.9], [-18.6, 1.6], [-17.0, .5]], r: .95, f: .9, k: 1 },
  { p: [[-20.1, 4.6], [-20.1, 3.7]], r: 1.5, f: 1.0, k: .9 },
  { p: [[-6.4, 2.0], [-9.0, 1.55], [-11.4, 1.2], [-14.4, 2.2], [-16.4, 3.3]], r: .22, f: .55, k: .8 }
];
function ntWayD(x, z, p) {
  let best = 1e9;
  for (let k = 0; k + 1 < p.length; k++) {
    const ax = p[k][0], az = p[k][1], bx = p[k + 1][0] - ax, bz = p[k + 1][1] - az;
    const t = clamp(((x - ax) * bx + (z - az) * bz) / (bx * bx + bz * bz), 0, 1);
    best = Math.min(best, Math.hypot(x - ax - bx * t, z - az - bz * t));
  }
  return best;
}
function pathW(x, z) {
  const e1 = .22 * Math.sin(x * .31) + .16 * Math.sin(x * .83 + 1.3), e2 = .2 * Math.sin(x * .27 + 2) + .15 * Math.sin(x * .71 + .4);
  const zc = -.15 + (e2 - e1) * .5, hw = .85 + (e1 + e2) * .5;
  let w = 1 - smooth(hw, hw + .8, Math.abs(z - zc));
  if (x > -24 && x < -2 && z > -1.5 && z < 8)
    for (const s of NT_WAYS) w = Math.max(w, s.k * (1 - smooth(s.r, s.r + s.f, ntWayD(x, z, s.p))));
  return w * smooth(.25, .6, fbm(x * .9, z * .9, 2, SEED + 51) * .5 + .5 + w * .35);
}

/* the broad lens is the day's, so that the two frames make a pair; the tall one looks at the home and the man */
/* what matters in it lies between the quarters that the phone's interface covers */
const NT_TALL = { eye: [ntK("tx", -8), ntK("te", 8.4), ntK("tz", -42)], tgt: [ntK("tx", -8), ntK("ty", 7.6), 0], fov: 46 * DEG };
function setCam(aspect) {
  const k = smooth(.6, 1.5, aspect);
  for (let a = 0; a < 3; a++) { CAM.eye[a] = lerp(NT_TALL.eye[a], CAM_WIDE.eye[a], k); CAM.tgt[a] = lerp(NT_TALL.tgt[a], CAM_WIDE.tgt[a], k); }
  CAM.fov = lerp(NT_TALL.fov, CAM_WIDE.fov, k); CAM.tall = 1 - k;
}

/* ── the sky of the night, in directions: azimuth from the far side towards the right, elevation up ── */
const ntDir = (az, el) => [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)];
const NT_SKY = (function () {
  /* the giant rises from behind the ridge: the land cuts its lower third, and that is what makes it far and huge */
  const giant = ntDir(ntK("gaz", -2.6) * DEG, ntK("gel", 4.7) * DEG), R = ntK("gr", 2.6) * DEG;
  const sunk = ntDir(-50 * DEG, -8 * DEG);
  /* the sky at the giant: U runs to the right, V up */
  const U = v3.norm(v3.cross([0, 1, 0], giant)), V = v3.cross(giant, U);
  /* the giant is lit by the sun that has gone under the land on the left: from the lower left and a little
     from behind. selong is the turn of the light away from the line of the look: 0 a dark disc, 90 a half,
     180 a full one; the true 49 would leave a sliver, the frame takes a fat crescent */
  const se = ntK("selong", 75) * DEG, pa = ntK("spa", 188) * DEG;
  const gsun = v3.norm(v3.add(v3.mul(v3.add(v3.mul(U, Math.cos(pa)), v3.mul(V, Math.sin(pa))), Math.sin(se)), v3.mul(giant, Math.cos(se))));
  /* the rings: their long axis is turned in the sky by the tilt, they open to the look by ropen, and rside
     says from where we look at them: 1 from above, −1 from below, the side the sun lights */
  const tilt = ntK("rtilt", 14) * DEG, open = ntK("ropen", .16), side = ntK("rside", -1);
  const m = v3.add(v3.mul(U, -Math.sin(tilt)), v3.mul(V, Math.cos(tilt)));
  const pole = v3.norm(v3.add(v3.mul(m, side * Math.sqrt(1 - open * open)), v3.mul(giant, -open)));
  /* the band of the galaxy: a great circle through two places of the sky */
  const bandPole = v3.norm(v3.cross(ntDir(ntK("baz0", 20) * DEG, ntK("bel0", 1) * DEG), ntDir(ntK("baz1", 8) * DEG, ntK("bel1", 9.9) * DEG)));
  return { key: ntDir(ntK("kaz", -14) * DEG, ntK("kel", 22) * DEG), giant, giantR: R, sunk, gsun, pole, bandPole };
})();
/* the beacon of the mast breathes; its glow blob, its light and its halo keep one time */
const NT_BREATH = { rate: 1.3, phase: (14 * 13.7 % 1) * TAU };

function ntFlies(m, list, rnd, n, tone) {
  for (const [cx, cz, rx, rz, y0, y1] of list) for (let k = 0; k < n; k++) {
    const a = rnd() * TAU, d = Math.sqrt(rnd()), x = cx + Math.cos(a) * d * rx, z = cz + Math.sin(a) * d * rz;
    const y = groundH(x, z) + lerp(y0, y1, rnd()), r = .028 + .02 * rnd(), g = 2.2 + 3.2 * rnd();
    if (GK !== 0) continue;
    addBlob(m, { c: [x, y, z], r: [r, r, r], sub: 1, col: tone, mat: MAT.glow, glow: g, wind: .25 + .35 * rnd(), x: .55 });
  }
}

function ntScene(aspect) {
  setCam(aspect);
  const t0 = performance.now(), rnd = rngOf(SEED + 1), gone = new Mesh(1 << 12);
  const S = new Mesh(1 << 19), W = new Mesh(1 << 15), F = new Mesh(1 << 15), blobs = [], clear = [];
  const L = { cookies: [], halos: [], points: [], lamp: null, flue: null };
  buildGround(S, aspect);
  buildWater(W);
  const tg = performance.now();

  /* what people built */
  const gy = groundH(NT_HOME.x, NT_HOME.z) + .02;
  const TH = ntPlace([NT_HOME.x, gy, NT_HOME.z], 0);
  S.add(ntHouse(TH, L), TH.pivot, TH.yaw, 1);
  const TG = ntPlace([NT_GARAGE.x, groundH(NT_GARAGE.x, NT_GARAGE.z) + .02, NT_GARAGE.z], 0);
  S.add(ntGarage(TG, L), TG.pivot, TG.yaw, 1);
  const TM = ntPlace([NT_MAST.x, groundH(NT_MAST.x, NT_MAST.z), NT_MAST.z], 0);
  S.add(ntMast(TM, L, NT_MAST.h), TM.pivot, TM.yaw, 1);
  for (const x of [-13.4, -11.4, -9.4, -7.4]) blobs.push([x, NT_HOME.z, 2.6, .5]);
  blobs.push([-8.4, 3.0, 2.0, .45], [NT_GARAGE.x, NT_GARAGE.z, 3.4, .5], [NT_MAST.x, NT_MAST.z, .8, .4], [-12.65, 2.45, 1.7, .35], [-10.3, 4.8, 1.2, .45], [-5.75, 6.25, .9, .45]);
  clear.push([NT_HOME.x, NT_HOME.z, 4.5, 2.3], [-8.4, 3.2, 2.1, 1.5], [-6.3, 3.0, 1.1, .9], [NT_GARAGE.x, NT_GARAGE.z, 3.0, 3.4], [NT_GARAGE.x, 3.7, 2.2, 1.4],
    [-12.65, 2.45, 1.6, 1.05], [-10.3, 4.8, 1.0, .7], [-5.75, 6.25, .9, .8], [NT_MAST.x, NT_MAST.z, .6, .6], [-17.0, 3.8, .3, .3]);

  /* the man comes home along the path; the small beast waits on the porch */
  const manAt = [NT_MAN_X, groundH(NT_MAN_X, 0), 0];
  S.add(makeMan(), manAt, Math.PI, 1); blobs.push([NT_MAN_X, 0, .55, .5]);
  /* the lamp of his helmet is on: a small light by the visor, and the ground before him takes it */
  const helm = [NT_MAN_X - .13, manAt[1] + 1.74, -.18];
  addBlob(S, { c: helm, r: [.04, .04, .04], sub: 1, col: NT_C.cold, mat: MAT.glow, glow: 10 });
  L.points.push({ p: [NT_MAN_X - 1.1, manAt[1] + 1.0, -.25], r: 4.6, c: NT_C.cold, k: ntK("manlamp", 1.2), even: .2 });
  L.halos.push({ p: helm, c: NT_C.cold, k: .22, s: .14 });
  S.add(makeCritter(), TH.at([2.85, .8, -4.12]), Math.PI, 1.1);

  addDeposit(S, [8.6, groundH(8.6, -1.8), -1.8], rnd, blobs); clear.push([8.6, -1.8, 1.6, 1.3]);

  /* stone: the day's boulders and small stones, but for those that lay where the yard is now */
  const rock = (x, z, r, tone, sub) => {
    addRock(S, [x, groundH(x, z) + r * .15, z], [r * 1.2, r * .8, r], (x * 7 + z * 3) | 0, tone, sub);
    blobs.push([x, z, r * 1.8, .5]); clear.push([x, z, r * 1.3, r * 1.3]);
  };
  for (const [x, z, r, tone] of [[14.2, 5.2, 1.6, .3], [15.6, 4.0, .9, .5], [12.9, 6.2, .7, .2], [-7.6, -2.7, .8, .4], [5.6, -3.3, .9, .6], [6.5, -3.9, .5, .3],
    [-9, -9, 1.3, .7], [2, -11, 1.0, .6], [11, -8.5, 1.5, .8], [-17.5, -1.5, .6, .4]]) rock(x, z, r, tone, r > .85 ? 2 : 1);
  for (let k = 0; k < 14; k++) {
    const x = -20 + rnd() * 40, z = -5 + rnd() * 6.5, r = .14 + rnd() * .2;
    if (NT_DAY.pathW(x, z) > .5 || Math.hypot(x - SHIP_X, (z - SHIP_Z) * 1.5) < 7 || Math.abs(x - MAN_X) < 1.2) continue;
    const rx = r * (1 + rnd() * .5), tone = rnd();
    if (pathW(x, z) > .4 || Math.abs(x - NT_MAN_X) < 1) continue;
    addRock(S, [x, groundH(x, z) + r * .1, z], [rx, r * .7, r], k * 3 + 1, tone, 1);
    blobs.push([x, z, r * 1.7, .4]);
  }

  /* the trees of the day */
  const tree = (x, z, H, R, ti, sub, rich, o) => {
    const y = groundH(x, z);
    if (y < WATER_Y + .5) return 0;
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
  let trees = tree(17.2, 8, 11.5, 6.2, 0, 3, true, { lean: -.95, bend: -1.7, yaw: 0, thin: .74 });
  trees += grove(-56, 142, 6, 10, 8, 14, 0, 1, 2);
  trees += grove(-78, 222, 7, 14, 9, 15, 3, 0, 1);
  trees += grove(-10, 312, 7, 13, 8, 13, 2, 2, 1);
  for (let k = 0; k < 9; k++) {
    const x = -330 + (k + rnd() * .7) * 74, c = crestAt(x, 270, 430, 10);
    if (x > -58 && x < 0) continue;
    trees += grove(c[0], c[2] - 8 + rnd() * 30, 6 + (rnd() * 5 | 0), 17, 9, 15, rnd() < .5 ? 0 : 3, 1, 1);
  }

  /* rosettes: two of the day's grew where the yard is, and are gone with their throw of the dice */
  const rosRoot = hex("#2c5a3c"), rosTip = hex("#8fb04e"), rosCool = hex("#5fa07a");
  for (const [x, z, r, cool, bloom] of [[-19.5, 3.5, 1.5, 0, 0], [-6.5, 4.2, 1.3, 0, 0], [.5, 4.8, 1.6, 1, 3], [7.5, 4.0, 1.2, 0, 0], [10.5, 5, 1.7, 0, 0],
    [-4, -7, 1.1, 1, 0], [6, -6.5, .9, 0, 2], [14, -5, 1.2, 0, 0], [-13, -6, 1.0, 0, 0]]) {
    const yard = x > -23 && x < -5.5 && z > 1;
    addRosette(yard ? gone : S, [x, groundH(x, z), z], r, rnd, rosRoot, cool ? rosCool : rosTip, 56, bloom);
    if (yard) continue;
    blobs.push([x, z, r * 1.3, .45]); clear.push([x, z, r * .9, r * .9]);
  }

  /* the far shore */
  const shoreZ = (x) => { for (let z = 70; z < 150; z += .5) if (groundH(x, z) > WATER_Y - .1) return z; return 0; };
  const baseAt = [NT_BASE.x, WATER_Y, shoreZ(NT_BASE.x) - NT_BASE.out];
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
  for (const [dx, dz, r] of [[-9, -5, 1.1], [-6.5, -7.5, .6], [-12, -3.5, .45]]) {
    const x = 40 + dx, z = shoreZ(x) + dz;
    addRock(S, [x, WATER_Y - r * .1, z], [r * 1.3, r * .7, r], (x * 5) | 0, .25, 1);
  }
  const rr = rngOf(SEED + 9), reedRoot = hex("#2f5040"), reedTip = hex("#8fa05a"), reedDry = hex("#c9b870");
  let reeds = 0;
  for (const [cx, wid, hgt, n] of [[-55, 8, 2.2, 50], [-17, 3.5, 1.6, 22], [13, 2.5, 1.2, 12], [29, 7, 2.7, 64], [50, 4, 1.8, 26]])
    for (let j = 0; j < n; j++) {
      const u = (rr() + rr() + rr()) / 3 * 2 - 1;
      const x = cx + u * wid * 1.3, z0 = shoreZ(x);
      if (!z0) continue;
      const z = z0 + (rr() - .45) * 3.2, hh = hgt * (1 - .5 * u * u) * (.7 + rr() * .5);
      /* no reed grows through the deck of the base */
      const under = Math.abs(x - baseAt[0]) < 10.6 && z < baseAt[2] + 3.9;
      tuftAt(under ? gone : S, x, Math.max(groundH(x, z), WATER_Y - .25), z, hh, rr, reedRoot, rr() < .25 ? reedDry : reedTip);
      if (!under) reeds++;
    }

  /* the striders have stopped for the night on the far crest */
  /* in either lens they stand over the water, clear of the roofs of the home and of the foot of the far sign */
  [[-19, 0, 1], [-13.5, 2.1, 1], [-9.5, 4.3, .78]].forEach(([x, ph, s]) => {
    const c = crestAt(x + ntK("strx", 21), 106, 170, 2);
    S.add(makeStrider(rnd, ph), c, -.12, s);
  });

  addElevator(S);
  const TB = ntPlace(baseAt, ntK("baseyaw", 0));
  S.add(ntBase(TB, L), TB.pivot, TB.yaw, 1);

  const tufts = buildGrass(S, clear, aspect);

  /* small lives of the night: pale green lights that drift over the dark of the slope */
  const rf = rngOf(SEED + 31), flyTone = [.62, 1, .42];
  ntFlies(S, [[7, -5, 4, 2.5, .3, 1.5], [-13, -8, 4, 2.5, .3, 1.4], [14, 2.5, 3, 2, .4, 1.9]], rf, 7, flyTone);

  buildWing(F, rngOf(SEED + 5), aspect);
  for (const [sx, sy, d] of [[-.93, -.52, 15], [-.78, -.74, 14], [.95, -.48, 15], [.8, -.7, 14]]) {
    const p = atFrame(sx, sy, d, aspect), r = .022 + .012 * rf();
    addBlob(F, { c: p, r: [r, r, r], sub: 1, col: flyTone, mat: MAT.glow, glow: 2.5 + 2 * rf(), wind: .2 + .2 * rf(), x: .55 });
  }

  const B = new Float32Array(4 + 64 * 4);
  B[0] = Math.min(blobs.length, 64);
  for (let k = 0; k < Math.min(blobs.length, 64); k++) B.set(blobs[k], 4 + k * 4);
  const t1 = performance.now();
  return {
    scene: S.done(), water: W.done(), fg: F.done(), blobs: B, L, man: manAt, home: TH.pivot, base: baseAt,
    stats: {
      verts: S.nv, tris: S.ni / 3, tufts, reeds, trees, blobs: blobs.length, cookies: L.cookies.length, points: L.points.length, halos: L.halos.length,
      msGround: Math.round(tg - t0), msCast: Math.round(t1 - tg), msAll: Math.round(t1 - t0)
    }
  };
}
