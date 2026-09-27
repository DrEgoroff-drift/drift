"use strict";
/* Cave look-dev stand — the rock.
   The cave is one density function, negative in the air and positive in stone. Its body is meshed by surface
   nets on a grid laid in the frustum of the lens: a cell is the same few pixels near and far. The layer of
   the grid in front of the cut plane is closed, which makes the flat face of the cut.
   Axes as on the surface stand: x along the walk line, y up, z away from the lens; metres. */

/* the places of this cave. The shafts lean the way the day comes down them: lean is the run in x and in z for
   a metre of height, y0 the height the places of the shafts are given at, r1 and r2 their radii */
const CVP = {
  cut: -2.5, water: -1.9, manX: -5.5, mouth: [-14.4, -1], chasm: [-1, 0], sky2: [-6.2, 26], bed: 1.15, far: 46,
  lean: [.2, .05], y0: 6, r1: [2.5, 3.9], r2: 1.7
};
/* how much of a staircase the beds make of every face: 0 a smooth hollow, 1 risers upright and treads level */
const CV_TER = .3;
/* the crawl from the pocket to the hall, in the bent space: it runs in the plane of the cut and is seen whole */
const CV_CRAWL = [[-5.4, 9.9, -2.3], [-1.2, 11.0, -2.4], [2.6, 10.3, -2.3], [6.6, 8.9, -1.2]];
/* materials of the cave, after the ten of the kit */
const CVM = { cut: 10, drip: 11, crystal: 12, rope: 13, section: 14, veil: 15 };
/* limestone in warm grey beds, dark shale between them, rust where iron bleeds; dripstone is pale and wet;
   moss lives where the day or the water reaches; the face of the cut is the darkest thing in the frame */
const CVC = {
  limeA: hex("#77736e"), limeB: hex("#a19c90"), shale: hex("#4f4a4a"), rust: hex("#a0683c"), cream: hex("#e6dfcf"), creamD: hex("#aaa090"),
  sand: hex("#8f8672"), moss: hex("#3f7a62"), mossSun: hex("#6f9440"), deep: hex("#16383a"),
  cutLo: hex("#06080c"), cut: hex("#0a0e15"), cutHi: hex("#111822")
};

function cvH3(ix, iy, iz, s) {
  let h = Math.imul(ix | 0, 374761393) ^ Math.imul(iy | 0, 668265263) ^ Math.imul(iz | 0, 1440662683) ^ Math.imul(s | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
/* value noise in space, −1…1 */
function cvN3(x, y, z, s) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = x - ix, fy = y - iy, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy), uz = fz * fz * (3 - 2 * fz);
  const a = cvH3(ix, iy, iz, s), b = cvH3(ix + 1, iy, iz, s), c = cvH3(ix, iy + 1, iz, s), d = cvH3(ix + 1, iy + 1, iz, s);
  const e = cvH3(ix, iy, iz + 1, s), f = cvH3(ix + 1, iy, iz + 1, s), g = cvH3(ix, iy + 1, iz + 1, s), h = cvH3(ix + 1, iy + 1, iz + 1, s);
  const k0 = a + (b - a) * ux, k1 = c + (d - c) * ux, k2 = e + (f - e) * ux, k3 = g + (h - g) * ux;
  const m0 = k0 + (k1 - k0) * uy, m1 = k2 + (k3 - k2) * uy;
  return (m0 + (m1 - m0) * uz) * 2 - 1;
}
const cvSmin = (a, b, k) => -smax(-a, -b, k);
/* an ellipsoid, an ellipse in plan, a capsule: distances, negative inside */
function cvE3(x, y, z, cx, cy, cz, rx, ry, rz) {
  const ax = (x - cx) / rx, ay = (y - cy) / ry, az = (z - cz) / rz, k0 = Math.sqrt(ax * ax + ay * ay + az * az);
  if (k0 < 1e-6) return -Math.min(rx, ry, rz);
  const bx = ax / rx, by = ay / ry, bz = az / rz;
  return k0 * (k0 - 1) / Math.sqrt(bx * bx + by * by + bz * bz);
}
function cvE2(x, z, cx, cz, rx, rz) {
  const ax = (x - cx) / rx, az = (z - cz) / rz, k0 = Math.sqrt(ax * ax + az * az);
  if (k0 < 1e-6) return -Math.min(rx, rz);
  const bx = ax / rx, bz = az / rz;
  return k0 * (k0 - 1) / Math.sqrt(bx * bx + bz * bz);
}
function cvCap(x, y, z, ax, ay, az, bx, by, bz, r) {
  const px = x - ax, py = y - ay, pz = z - az, dx = bx - ax, dy = by - ay, dz = bz - az;
  const h = clamp((px * dx + py * dy + pz * dz) / (dx * dx + dy * dy + dz * dz), 0, 1);
  return Math.hypot(px - dx * h, py - dy * h, pz - dz * h) - r;
}

/* the floor: the walk line of the gallery, raked towards its back wall like a stage, and past the arch it
   goes down again: the floor of the far chamber is seen over it. Past the shaft the gallery steps down to the
   shore, and the lake lies in two bowls that reach the grotto */
const CV_G0 = .25 * Math.sin(CVP.manX * .23 + 1) + .12 * Math.sin(CVP.manX * .61 + .3);
function cvFloor(x, z) {
  const rk = z > 0 ? .05 * Math.min(z, 9) - .03 * Math.max(0, z - 9) : .14 * z;
  const gal = .25 * Math.sin(x * .23 + 1) + .12 * Math.sin(x * .61 + .3) - CV_G0 + rk;
  const b1 = 1 - Math.pow((x - 12.5) / 9.5, 2) - Math.pow((z - 8) / 18, 2), b2 = 1 - Math.pow((x - 17) / 8, 2) - Math.pow((z - 22) / 8, 2);
  const hall = -1.5 - 2.8 * smooth(0, .8, Math.max(b1, b2)) + .09 * Math.max(0, z - 31);
  return lerp(gal, hall, smooth(.8, 6.5, x));
}

/* the bed a point lies in: the same line is drawn by the shader (cv-wgsl.js, strat) */
function cvStrat(x, y, z) {
  const s = y - .06 * x + .25 * Math.sin(x * .09 + z * .05);
  return (s + .28 * Math.sin(s * 1.9 + .7)) / CVP.bed;
}
/* every bed stands out or back by its own measure; shale is soft and eaten back */
const CV_LAY = (function () {
  const off = new Float32Array(128), tone = new Float32Array(128), shale = new Uint8Array(128);
  for (let k = 0; k < 128; k++) {
    off[k] = (hashI(k, 3, 41) - .5) * .5; tone[k] = hashI(k, 7, 43); shale[k] = hashI(k, 11, 47) < .16 ? 1 : 0;
    if (shale[k]) off[k] = .2 + .12 * hashI(k, 13, 49);
  }
  return { off, tone, shale };
})();

let CV_FL = 0;     // floor − y at the last cvBase call
let CV_HEAP = 0;   // how far the heap is, at the last cvBase call
/* the axis of a shaft at a height: it leans the way the day comes */
const cvShaftX = (c, y) => c[0] - CVP.lean[0] * (y - CVP.y0);
const cvShaftZ = (c, y) => c[1] + CVP.lean[1] * (y - CVP.y0);
/* a hollow is not drawn with compasses: the space it is measured in is bent by a slow noise */
const cvWarpX = (x, y, z) => 1.5 * cvN3(x * .07 + 3, y * .07, z * .07, 101) + .5 * cvN3(x * .19, y * .19 + 7, z * .19, 103);
const cvWarpY = (x, y, z) => 1.2 * cvN3(x * .07, y * .07 + 5, z * .07, 105) + .4 * cvN3(x * .19 + 2, y * .19, z * .19, 107);
/* where a place named in the bent space lies in the cave */
function cvPlace(c) {
  let p = [c[0], c[1], c[2]];
  for (let k = 0; k < 5; k++) p = [c[0] - cvWarpX(p[0], p[1], p[2]), c[1] - cvWarpY(p[0], p[1], p[2]), c[2]];
  return p;
}
const CV_POCKET = cvPlace([-7.2, 9.6, -.5]);
/* the void without its detail */
function cvBase(x, y, z) {
  /* the gallery: a vault with a dome over the man and two noses that hang where it narrows, the back wall
     in buttresses, two ends */
  const C = 5.1 + 1.5 * Math.exp(-Math.pow((x + 5.2) / 3.4, 2)) - 1.1 * Math.exp(-Math.pow((x + 10.4) / 1.5, 2)) - .9 * Math.exp(-Math.pow((x - .8) / 1.8, 2))
    + .3 * Math.sin(x * .47 + .5) + .55 * cvN3(x * .3, 1, z * .3, 113) - .035 * (z - 1) * (z - 1);
  const B = 6.6 + 1.6 * Math.sin(x * .9 + .6 + .22 * y) * (.55 + .45 * Math.sin(x * .17 + 2)) + .8 * Math.sin(y * .7 + x * .13);
  let d = smax(smax(y - C, z - B, .9), smax(x - 3.4, -18.4 - x, .5), 1.2);
  const wx = x + cvWarpX(x, y, z), wy = y + cvWarpY(x, y, z);
  /* the hall with its lake, the grotto behind it, the way on to the right. Its walls come down steep:
     the floor is the floor function, not the bottom of a ball */
  let h = cvSmin(cvE3(wx, wy, z, 10.8, 1.5, 5, 10.5, 9.4, 13), cvE3(wx, wy, z, 14.5, .8, 22, 9.5, 7.6, 15), 1.5);
  h = cvSmin(h, cvE3(wx, wy, z, 20.5, .4, 31, 5.5, 3.8, 5.5), 1.2);
  h = cvSmin(h, cvE3(wx, wy, z, 21.5, 1, 5, 4.5, 2.7, 3.2), 1);
  d = cvSmin(d, h, 1.3);
  /* the arch behind the man and the chamber it opens into */
  d = cvSmin(d, cvSmin(cvE3(wx, wy, z, -5.6, 1.4, 9, 4.4, 3.7, 8.5), cvE3(wx, wy, z, -7.5, 3, 25, 12.5, 7, 11.5), 1.2), 1);
  /* nothing of these goes under the floor */
  const fl = cvFloor(x, z) - y;
  CV_FL = fl;
  d = smax(d, fl, .5);
  /* the pocket over the gallery, the chimney to it, and the crawl that leads from it to a window high in the hall */
  d = cvSmin(d, cvE3(wx, wy, z, -7.2, 9.6, -.5, 2.8, 1.6, 3.6), .5);
  d = cvSmin(d, cvCap(x, y, z, -8.6, 4.6, -2.1, CV_POCKET[0] - .6, CV_POCKET[1] - .5, -2.2, .75), .6);
  for (let k = 0; k < 3; k++) {
    const a = CV_CRAWL[k], b = CV_CRAWL[k + 1];
    d = cvSmin(d, cvCap(wx, wy, z, a[0], a[1], a[2], b[0], b[1], b[2], .66 + .1 * k), .5);
  }
  /* shafts: the mouth opens towards the surface like a funnel, the far skylight, the way down */
  const mr = 1 + .045 * Math.max(0, y - 8);
  d = cvSmin(d, Math.max(cvE2(x, z, cvShaftX(CVP.mouth, y) + .3 * Math.sin(y * .31 + 1), cvShaftZ(CVP.mouth, y), CVP.r1[0] * mr, CVP.r1[1] * mr), 3 - y), 1.2);
  d = cvSmin(d, Math.max(cvE2(x, z, cvShaftX(CVP.sky2, y), cvShaftZ(CVP.sky2, y), CVP.r2, CVP.r2), 7 - y), 1);
  d = cvSmin(d, Math.max(cvE2(x, z, CVP.chasm[0] + .35 * Math.sin(y * .3), CVP.chasm[1], 1.9, 9), y - 1), .6);
  /* the heap of rubble under the mouth */
  const hp = cvE3(x, y, z, CVP.mouth[0] + .4, -.5, -.6, 4, 1.9, 3.6);
  CV_HEAP = hp;
  d = smax(d, -hp, .8);
  return d;
}
/* the body of the rock. Beds make a staircase of every face: inside a bed the face stands, between two beds
   it lies level. Every bed stands out or back by its own measure, joints break it into blocks, and the stone
   is rough. Where a man walks the beds are worn almost level, and the heap is rubble, not beds. */
function cvRock(x, y, z) {
  let d = cvBase(x, y, z);
  if (d > 2.2 || d < -2.2) return d;
  const afl = Math.abs(CV_FL), worn = .25 + .75 * smooth(.15, 1, afl);
  const s0 = y - .06 * x + .25 * Math.sin(x * .09 + z * .05), sb = (s0 + .28 * Math.sin(s0 * 1.9 + .7)) / CVP.bed;
  /* a face is a staircase in places and a smooth wall in others */
  const L = Math.floor(sb), ter = CV_TER * smooth(.5, 2, afl) * smooth(.3, 1.6, CV_HEAP) * (.25 + .75 * smooth(-.25, .35, cvN3(x * .13 + 1, y * .13, z * .13, 111)));
  if (ter > .01) d = cvBase(x, y + (.5 - (sb - L)) * ter * CVP.bed / (1 + .532 * Math.cos(s0 * 1.9 + .7)), z);
  /* a ledge runs a few metres and dies away: no bed is a shelf from wall to wall */
  const jx = Math.floor((x + L * 1.7) / 3.4), jz = Math.floor((z + L * 2.3) / 4.2), run = .15 + .85 * smooth(-.3, .3, cvN3(x * .11 + L * .7, L * .37, z * .11, 115));
  d -= (CV_LAY.off[(L + 64) & 127] * .6 * run + (cvH3(jx, L, jz, 77) - .5) * .1) * worn;
  d += .10 * cvN3(x * .9, y * .9, z * .9, 5) + .045 * cvN3(x * 2.3, y * 2.3, z * 2.3, 9);
  return d;
}
/* the floor under a point in the air and the roof over it */
function cvDown(x, y, z) {
  let a = y;
  for (let n = 0; n < 240 && cvRock(x, a - .25, z) <= 0; n++) a -= .25;
  let lo = a - .25, hi = a;
  for (let n = 0; n < 14; n++) { const m = (lo + hi) / 2; if (cvRock(x, m, z) > 0) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
function cvUp(x, y, z) {
  let a = y;
  for (let n = 0; n < 240 && cvRock(x, a + .25, z) <= 0; n++) a += .25;
  let lo = a, hi = a + .25;
  for (let n = 0; n < 14; n++) { const m = (lo + hi) / 2; if (cvRock(x, m, z) > 0) hi = m; else lo = m; }
  return (lo + hi) / 2;
}
/* how open the air is before a face: a close look and a broad one */
function cvAO(p, n) {
  const a = clamp(-cvRock(p[0] + n[0] * .4, p[1] + n[1] * .4, p[2] + n[2] * .4) / .4, 0, 1);
  const b = clamp(-cvBase(p[0] + n[0] * 1.6, p[1] + n[1] * 1.6, p[2] + n[2] * 1.6) / 1.6, 0, 1);
  return a * (.35 + .65 * b);
}

/* the colour of stone at a point: rgb, how wet */
const CV_INK = new Float32Array(4);
function cvPaint(x, y, z, ny) {
  const k = (Math.floor(cvStrat(x, y, z)) + 64) & 127, o = CV_INK;
  let c = mix3(CVC.limeA, CVC.limeB, CV_LAY.tone[k]);
  if (CV_LAY.shale[k]) c = mix3(c, CVC.shale, .85);
  const big = cvN3(x * .22, y * .22, z * .22, 21), mid = cvN3(x * .8, y * .8, z * .8, 23);
  c = v3.mul(c, 1 + .14 * big + .07 * mid);
  c = mix3(c, CVC.rust, smooth(.45, .8, cvN3(x * .35 + 9, y * .6, z * .35, 25)) * .45);
  /* water that ran down a wall left a pale crust */
  const run = smooth(.35, .7, cvN3(x * .55, y * .1, z * .55, 27)) * smooth(.95, .55, Math.abs(ny));
  c = mix3(c, CVC.cream, run * .75);
  let wet = run * .7;
  /* sediment on what lies flat */
  c = mix3(c, CVC.sand, smooth(.72, .95, ny) * .55);
  /* moss where the day reaches */
  const dm = Math.hypot(x - cvShaftX(CVP.mouth, y), z - cvShaftZ(CVP.mouth, y)), d2 = Math.hypot(x - cvShaftX(CVP.sky2, y), z - cvShaftZ(CVP.sky2, y));
  const day = Math.max((1 - smooth(2.5, 9.5, dm)) * smooth(-3, -1, y), (1 - smooth(2, 7, d2)) * .8);
  /* it grows in patches, not in stripes along every bed; in the full day it is a carpet */
  const patch = Math.max(smooth(-.45, .2, cvN3(x * .31 + 4, y * .31, z * .31, 29) + .35 * mid), smooth(.4, .85, day) * .9);
  c = mix3(c, mix3(CVC.moss, CVC.mossSun, smooth(.4, 1, day) * smooth(.3, .9, ny)), day * smooth(-.25, .5, ny + .4 * mid) * .85 * patch);
  /* by the water: a dark wet band with a green line, and the bed under it goes to deep teal */
  const wl = y - CVP.water;
  if (wl < 1.2) {
    const band = 1 - smooth(.05, .9, wl);
    c = v3.mul(c, 1 - .45 * band); wet = Math.max(wet, band);
    c = mix3(c, CVC.moss, (1 - smooth(0, .35, Math.abs(wl - .12))) * .5 * smooth(.2, .7, ny + .5));
    if (wl < 0) c = mix3(c, CVC.deep, smooth(0, 1.2, -wl) * .7);
  }
  o[0] = c[0]; o[1] = c[1]; o[2] = c[2]; o[3] = wet;
  return o;
}

/* the field on the grid of the lens and its mesh. rows — cells across the height of the frame */
function cvRockMesh(aspect, rows) {
  const t0 = performance.now();
  const th = Math.tan(CAM.fov / 2), pitch = (CAM.tgt[1] - CAM.eye[1]) / (CAM.tgt[2] - CAM.eye[2]), a = 2 * th * 1.06 / rows;
  const CJ = Math.ceil(rows / 4) * 4, CI = Math.ceil(rows * aspect / 4) * 4, NI = CI + 1, NJ = CJ + 1;
  const ex = CAM.eye[0], ey = CAM.eye[1], ez = CAM.eye[2], d0 = CVP.cut - ez, q = 1 + a * 1.8;
  /* depths of the layers: the first one is the closed layer before the cut, the cut lies between it and the second */
  const dl = [d0 * (1 - a * .9), d0 * (1 + a * .9)];
  while (ez + dl[dl.length - 1] < CVP.far || (dl.length - 2) % 4) dl.push(dl[dl.length - 1] * q);
  const NK = dl.length, dk = new Float32Array(dl), sx = new Float32Array(NI), sy = new Float32Array(NJ);
  for (let i = 0; i < NI; i++) sx[i] = (i - CI / 2) * a;
  for (let j = 0; j < NJ; j++) sy[j] = pitch + (j - CJ / 2) * a;
  const sJ = NI, sK = NI * NJ, V = new Float32Array(NI * NJ * NK).fill(NaN);
  /* blocks of 4×4×4 cells: a block far from any face is filled with one number */
  const BI = CI / 4, BJ = CJ / 4, BK = (NK - 2) / 4, away = new Float32Array(BI * BJ * BK);
  let evals = 0;
  for (let bk = 0; bk < BK; bk++) for (let bj = 0; bj < BJ; bj++) for (let bi = 0; bi < BI; bi++) {
    const i0 = bi * 4, j0 = bj * 4, k0 = 1 + bk * 4, dc = dk[k0 + 2];
    const d = cvBase(ex + sx[i0 + 2] * dc, ey + sy[j0 + 2] * dc, ez + dc);
    const rad = .5 * Math.hypot(sx[i0 + 4] * dk[k0 + 4] - sx[i0] * dk[k0], sy[j0 + 4] * dk[k0 + 4] - sy[j0] * dk[k0], dk[k0 + 4] - dk[k0]);
    if (Math.abs(d) > rad * 1.8 + 1.6) { away[bi + BI * (bj + BJ * bk)] = d; continue; }
    for (let k = k0; k <= k0 + 4; k++) {
      const dz = dk[k], z = ez + dz;
      for (let j = j0; j <= j0 + 4; j++) {
        const y = ey + sy[j] * dz;
        let n = i0 + sJ * j + sK * k;
        for (let i = i0; i <= i0 + 4; i++, n++) if (V[n] !== V[n]) { V[n] = cvRock(ex + sx[i] * dz, y, z); evals++; }
      }
    }
  }
  for (let bk = 0; bk < BK; bk++) for (let bj = 0; bj < BJ; bj++) for (let bi = 0; bi < BI; bi++) {
    const d = away[bi + BI * (bj + BJ * bk)];
    if (!d) continue;
    const i0 = bi * 4, j0 = bj * 4, k0 = 1 + bk * 4;
    for (let k = k0; k <= k0 + 4; k++) for (let j = j0; j <= j0 + 4; j++) {
      let n = i0 + sJ * j + sK * k;
      for (let i = i0; i <= i0 + 4; i++, n++) if (V[n] !== V[n]) V[n] = d;
    }
  }
  for (let n = 0; n < sK; n++) V[n] = -Math.abs(V[n + sK]);
  const tField = performance.now();

  /* surface nets: a vertex in every cell the face goes through, at the mean of the crossings of its edges */
  const CK = NK - 1, cell = new Int32Array(CI * CJ * CK).fill(-1);
  let cap = 1 << 18, P = new Float32Array(cap * 3), nv = 0;
  const E = [0, 1, 2, 3, 4, 5, 6, 7, 0, 2, 1, 3, 4, 6, 5, 7, 0, 4, 1, 5, 2, 6, 3, 7];
  const cv = new Float32Array(8), cx = new Float32Array(8), cy = new Float32Array(8), cz = new Float32Array(8);
  for (let k = 0; k < CK; k++) for (let j = 0; j < CJ; j++) {
    let n = sJ * j + sK * k;
    for (let i = 0; i < CI; i++, n++) {
      cv[0] = V[n]; cv[1] = V[n + 1]; cv[2] = V[n + sJ]; cv[3] = V[n + sJ + 1];
      cv[4] = V[n + sK]; cv[5] = V[n + sK + 1]; cv[6] = V[n + sK + sJ]; cv[7] = V[n + sK + sJ + 1];
      let pos = 0;
      for (let c = 0; c < 8; c++) if (cv[c] > 0) pos++;
      if (pos === 0 || pos === 8) continue;
      for (let c = 0; c < 8; c++) { const d = dk[k + (c >> 2)]; cx[c] = ex + sx[i + (c & 1)] * d; cy[c] = ey + sy[j + (c >> 1 & 1)] * d; cz[c] = ez + d; }
      let px = 0, py = 0, pz = 0, cnt = 0;
      for (let e = 0; e < 24; e += 2) {
        const p = E[e], r = E[e + 1], va = cv[p], vb = cv[r];
        if ((va > 0) === (vb > 0)) continue;
        const t = va / (va - vb);
        px += cx[p] + (cx[r] - cx[p]) * t; py += cy[p] + (cy[r] - cy[p]) * t; pz += cz[p] + (cz[r] - cz[p]) * t; cnt++;
      }
      if (nv === cap) { cap *= 2; const b = new Float32Array(cap * 3); b.set(P); P = b; }
      P[nv * 3] = px / cnt; P[nv * 3 + 1] = py / cnt; P[nv * 3 + 2] = pz / cnt;
      cell[i + CI * (j + CJ * k)] = nv++;
    }
  }
  /* faces: one quad about every edge of the grid that the face crosses, turned to look into the air */
  const N = new Float32Array(nv * 3), cutOf = new Int32Array(nv).fill(-1);
  let icap = 1 << 20, I = new Uint32Array(icap), ni = 0, ccap = 1 << 18, IC = new Uint32Array(ccap), nic = 0, nvc = 0;
  const cutP = [];
  const cutId = (v) => { if (cutOf[v] < 0) { cutOf[v] = nvc++; cutP.push(v); } return cutOf[v]; };
  function quad(c0, c1, c2, c3, vx, vy, vz, front) {
    if (c0 < 0 || c1 < 0 || c2 < 0 || c3 < 0) return;
    const ax = P[c1 * 3] - P[c0 * 3], ay = P[c1 * 3 + 1] - P[c0 * 3 + 1], az = P[c1 * 3 + 2] - P[c0 * 3 + 2];
    const bx = P[c3 * 3] - P[c0 * 3], by = P[c3 * 3 + 1] - P[c0 * 3 + 1], bz = P[c3 * 3 + 2] - P[c0 * 3 + 2];
    const ux = P[c2 * 3] - P[c1 * 3], uy = P[c2 * 3 + 1] - P[c1 * 3 + 1], uz = P[c2 * 3 + 2] - P[c1 * 3 + 2];
    const wx = P[c2 * 3] - P[c3 * 3], wy = P[c2 * 3 + 1] - P[c3 * 3 + 1], wz = P[c2 * 3 + 2] - P[c3 * 3 + 2];
    /* the normal of the quad: the sum over its two halves */
    let nx = ay * bz - az * by + (wy * uz - wz * uy), ny = az * bx - ax * bz + (wz * ux - wx * uz), nz = ax * by - ay * bx + (wx * uy - wy * ux);
    let flip = false;
    if (nx * vx + ny * vy + nz * vz < 0) { nx = -nx; ny = -ny; nz = -nz; flip = true; }
    if (front) {
      if (nic + 6 > ccap) { ccap *= 2; const b = new Uint32Array(ccap); b.set(IC); IC = b; }
      const q0 = cutId(c0), q1 = cutId(flip ? c3 : c1), q2 = cutId(c2), q3 = cutId(flip ? c1 : c3);
      IC[nic++] = q0; IC[nic++] = q1; IC[nic++] = q2; IC[nic++] = q0; IC[nic++] = q2; IC[nic++] = q3;
      return;
    }
    for (const c of [c0, c1, c2, c3]) { N[c * 3] += nx; N[c * 3 + 1] += ny; N[c * 3 + 2] += nz; }
    if (ni + 6 > icap) { icap *= 2; const b = new Uint32Array(icap); b.set(I); I = b; }
    const e1 = flip ? c3 : c1, e3 = flip ? c1 : c3;
    I[ni++] = c0; I[ni++] = e1; I[ni++] = c2; I[ni++] = c0; I[ni++] = c2; I[ni++] = e3;
  }
  const cid = (i, j, k) => cell[i + CI * (j + CJ * k)];
  for (let k = 0; k < NK; k++) for (let j = 0; j < NJ; j++) {
    let n = sJ * j + sK * k;
    for (let i = 0; i < NI; i++, n++) {
      const v = V[n], s = v > 0 ? 1 : -1;
      if (i < CI && j > 0 && j < CJ && k > 0 && k < CK && (V[n + 1] > 0) !== (v > 0))
        quad(cid(i, j - 1, k - 1), cid(i, j, k - 1), cid(i, j, k), cid(i, j - 1, k), s, 0, 0, false);
      if (j < CJ && i > 0 && i < CI && k > 0 && k < CK && (V[n + sJ] > 0) !== (v > 0))
        quad(cid(i - 1, j, k - 1), cid(i, j, k - 1), cid(i, j, k), cid(i - 1, j, k), 0, s, 0, false);
      if (k < CK && i > 0 && i < CI && j > 0 && j < CJ && (V[n + sK] > 0) !== (v > 0))
        quad(cid(i - 1, j - 1, k), cid(i, j - 1, k), cid(i, j, k), cid(i - 1, j, k), s * sx[i], s * sy[j], s, k === 0);
    }
  }
  const tNets = performance.now();

  /* paint: every vertex takes the colour of its bed, its wetness and how open the air is before it */
  const rock = new Mesh(nv + 8), nrm = [0, 0, 0], pp = [0, 0, 0];
  for (let v = 0; v < nv; v++) {
    const x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2], l = Math.hypot(N[v * 3], N[v * 3 + 1], N[v * 3 + 2]) || 1;
    nrm[0] = N[v * 3] / l; nrm[1] = N[v * 3 + 1] / l; nrm[2] = N[v * 3 + 2] / l; pp[0] = x; pp[1] = y; pp[2] = z;
    const ink = cvPaint(x, y, z, nrm[1]);
    rock.vert(pp, nrm, ink, MAT.rock, 0, ink[3], cvAO(pp, nrm));
  }
  rock.i = I; rock.ni = ni;
  /* the face of the cut: its own vertices in the same places. The normal slot carries the way to the void in
     the plane of the cut, the extra slot how far the void is: the rim takes the light of the void.
     A bed keeps its tone from the lit rock, in the dark: pale beds, plain beds, shale almost black */
  const cut = new Mesh(nvc + 8), zc = CVP.cut + .08;
  for (let c = 0; c < nvc; c++) {
    const v = cutP[c], x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2], k = (Math.floor(cvStrat(x, y, CVP.cut)) + 64) & 127;
    const tn = CV_LAY.tone[k], big = cvN3(x * .13, y * .13, 3, 31);
    let col = CV_LAY.shale[k] ? CVC.cutLo : mix3(CVC.cut, CVC.cutHi, smooth(.45, 1, tn) * (.75 + .25 * big));
    col = v3.mul(col, 1 + .18 * big);
    const dv = cvRock(x, y, zc);
    const gx = cvRock(x + .06, y, zc) - cvRock(x - .06, y, zc), gy = cvRock(x, y + .06, zc) - cvRock(x, y - .06, zc), gl = Math.hypot(gx, gy) || 1;
    cut.vert([x, y, z], [-gx / gl, -gy / gl, 0], col, CVM.cut, 0, 0, clamp(dv, 0, 4));
  }
  cut.i = IC; cut.ni = nic;
  return {
    rock: rock.done(), cut: cut.done(),
    stats: { grid: [NI, NJ, NK], evals, verts: nv, tris: ni / 3, cutVerts: nvc, fieldMs: Math.round(tField - t0), netsMs: Math.round(tNets - tField), paintMs: Math.round(performance.now() - tNets) }
  };
}
