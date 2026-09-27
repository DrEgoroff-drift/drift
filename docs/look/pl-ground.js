"use strict";
/* Planet look-dev stand — the ground. The land is a stack of stage flats: every flat is a ridge with a crest
   line, a front slope towards the camera and a back slope behind. The walk line runs along the first flat,
   on a slope raked towards the lens like a stage. Behind it lies a hollow with water, then the far shore,
   hills, a ridge and mountains; a valley opens through all of them towards the far sign. */
const SEED = 20260927;
const DEG = Math.PI / 180;
const WATER_Y = -3.2;
const SUN = v3.norm([-0.70, 0.42, 0.55]);
/* the far sign stands where the man is heading; the peak answers it from the other side */
const AZ_ELEV = 5 * DEG, AZ_PEAK = -11 * DEG;
const MAN_X = -3.6, SHIP_X = -12.8, SHIP_Z = 7, SHIP_YAW = .2;
/* the foot of the ship's ramp (ship-local .75, −4.26 turned by the yaw) */
const RAMP_X = SHIP_X + .75 * Math.cos(SHIP_YAW) - 4.26 * Math.sin(SHIP_YAW), RAMP_Z = SHIP_Z - .75 * Math.sin(SHIP_YAW) - 4.26 * Math.cos(SHIP_YAW);
/* the point the land is laid out from: bearings of the far sign, the peak and the valley are counted from
   here, whatever lens looks at them */
const LAY = { x: 0, z: -50 };
/* two lenses for one world. The broad one (16:9): the man is about a twelfth of the frame's height, the ship
   and the near tree stand in the frame with him. The tall one (the phone in the hand): closer and wider in
   angle, the man below, the far sign above him. Between them the lens is blended by the aspect. */
const CAM_WIDE = { eye: [0, 8, -50], tgt: [0, 6.2, 0], fov: 24 * DEG };
const CAM_TALL = { eye: [MAN_X + 2.4, 7.2, -30], tgt: [MAN_X + 2.4, 8.46, 0], fov: 46 * DEG };
const CAM = { eye: [0, 8, -50], tgt: [0, 6.2, 0], fov: 24 * DEG, near: 2, far: 70000, tall: 0 };
function setCam(aspect) {
  const k = smooth(.6, 1.5, aspect);
  for (let a = 0; a < 3; a++) { CAM.eye[a] = lerp(CAM_TALL.eye[a], CAM_WIDE.eye[a], k); CAM.tgt[a] = lerp(CAM_TALL.tgt[a], CAM_WIDE.tgt[a], k); }
  CAM.fov = lerp(CAM_TALL.fov, CAM_WIDE.fov, k); CAM.tall = 1 - k;
}

/* where a height at a distance lands in the frame: 0 bottom … 1 top (for laying the flats out by eye) */
function frameY(y, z) {
  const d = z - CAM.eye[2], pitch = (CAM.eye[1] - CAM.tgt[1]) / (CAM.tgt[2] - CAM.eye[2]), th = Math.tan(CAM.fov / 2);
  return .5 + (pitch + (y - CAM.eye[1]) / d) / (2 * th);
}
/* where a bearing lands across the frame: −1 left edge … 1 right edge */
function frameX(az, aspect) { return Math.tan(az) / (Math.tan(CAM.fov / 2) * aspect); }

/* greens change their hue with depth: olive close by, cooler on the far shore, blue-green on the hills */
const PAL = {
  grassLit: hex("#93a94f"), grassMid: hex("#5c8a47"), grassCool: hex("#3b7560"), dry: hex("#c4a659"),
  heather: hex("#b56a8e"), clover: hex("#7d70ad"), soil: hex("#b08a5e"), soilDark: hex("#7a5a40"), mud: hex("#4a4f3c"),
  rockWarm: hex("#b3aa98"), rockCool: hex("#8a8d9a"), crag: hex("#5d6378"), cragWarm: hex("#8a7f78"), snow: hex("#f2f4f8"),
  forest: hex("#2f5f52"), glade: hex("#6b9558"), plain: hex("#8aa880"), moss: hex("#5d7f35")
};

function profRaw(x) { return 1.5 * Math.sin(x * .043 + 1.1) + .8 * Math.sin(x * .097 + .5) + .3 * Math.sin(x * .21 + 2.0); }
const PAD_Y = profRaw(SHIP_X);
function padLine(x) { return 1 - smooth(5.5, 10, Math.abs(x - SHIP_X)); }
/* the walk profile: what the game calls h(x); flattened under the ship */
function prof(x) { return lerp(profRaw(x), PAD_Y, padLine(x)); }
function softp(d) { return .5 * (d + Math.sqrt(d * d + 1.5)); }
function ridge(z, zc, yc, sf, sb, k) { const d = z - zc, a = yc + sf * d, b = yc - sb * d; return -smax(-a, -b, k); }
/* the play lane is raked like a stage: the slope under the walk line faces the lens, so the path, the flowers
   and the feet of the actors are seen from above and not edge-on. Zero on the walk line itself. */
function rake(z) { return .9 * (Math.exp(-Math.max(0, 1.2 - z) / 3.5) - Math.exp(-1.2 / 3.5)); }
/* the valley that opens towards the far sign: every flat bows down along this bearing */
function valley(x, z) { const az = Math.atan2(x - LAY.x, z - LAY.z); return Math.exp(-Math.pow((az - AZ_ELEV) / .075, 2)); }

let GK = 0;   // which flat won at the last groundH call
function groundH(x, z) {
  const p = prof(x), zb = 2.5 + 11.5 * padLine(x);
  let f0;
  if (z >= 0) f0 = p - .42 * (softp(z - zb) - softp(-zb));
  else {
    const d = -z;
    f0 = p * (1 - .45 * smooth(4, 30, d)) - .07 * d - 1.6 * smooth(8, 30, d) + fbm(x * .03 + 1.7, z * .03 + 4.2, 3, SEED + 5) * 1.3 * smooth(3, 22, d);
  }
  f0 += rake(z) + fbm(x * .35, z * .35, 2, SEED + 13) * .09 * smooth(1.2, 4, Math.abs(z));
  let h = f0, k = 0;
  const take = (v, id, soft) => { if (v > h) k = id; h = smax(h, v, soft); };
  /* The far flats are laid out by where their crests land in the frame (frameY, the eye at 8 m): the far shore
     about .55, hills .62, the ridge .65, mountains .71 with the peak at .84. In the valley they bow to .53,
     .57, .59 and the saddle of the mountains stays at .61, so the far sign rises from the saddle. */
  if (z > 4) {
    const pass = valley(x, z);
    take(-6.4 + .6 * fbm(x * .02 + 3, z * .02 + 8, 2, SEED + 7) + 7 * smooth(70, 130, Math.abs(x - 10)), 1, 2.5);
    const n1 = fbm(x * .008 + 5, .5, 2, SEED + 21), n1b = fbm(x * .012 + 9, 1.5, 3, SEED + 22);
    /* the far waterline is drawn in bays and spits: the foot of the far shore steps back and forth */
    const bay = 17 * fbm(x * .034 + 1.3, 2.5, 2, SEED + 47);
    take(ridge(z, 136 + 20 * n1 + bay * (1 - smooth(122, 140, z)), (5 + 4 * n1b) * (1 - .35 * pass), .26, .10, 6) + fbm(x * .03 + 2, z * .03 + 5, 3, SEED + 31) * .9, 2, 3);
    if (z > 110) {
      take(lerp(-60, 3 + z * .003, smooth(120, 230, z)), 6, 6);
      const n2 = fbm(x * .004 + 2, 2.5, 2, SEED + 23), n2b = fbm(x * .006 + 7, 3.5, 3, SEED + 24);
      /* the hills are folded: gullies run down their faces, so the light has something to draw */
      const fold = (ridged(x * .011 + 4 + .4 * fbm(z * .01, x * .01, 2, SEED + 48), z * .004 + 2, 3, SEED + 49) - .5) * 7;
      take(ridge(z, 340 + 70 * n2, (14 + 9 * n2b) * (1 - .7 * pass), .16, .08, 14) + (fbm(x * .05 + 1, z * .05 + 3, 3, SEED + 32) * 1.6 + fold) * (1 - .5 * pass), 3, 8);
    }
    if (z > 400) {
      const az = Math.atan2(x - LAY.x, z - LAY.z);
      const n3 = fbm(x * .0012 + 4, 4.5, 2, SEED + 25);
      const y3 = (22 + 30 * ridged(x * .0016 + 11, 5.5, 4, SEED + 26)) * (1 - .8 * pass);
      take(ridge(z, 1050 + 180 * n3, y3, .22, .14, 30) + (ridged(x * .004 + 3, z * .0013 + 1, 4, SEED + 33) - .45) * 12 * (1 - .6 * pass), 4, 20);
      if (z > 1500) {
        /* the massif stands on the left and carries the peak; to the right the range sinks behind the ridge */
        const env = .55 + .65 * Math.exp(-Math.pow((az - AZ_PEAK) / .2, 2));
        const peak = 200 * Math.exp(-Math.pow((az - AZ_PEAK) / .05, 2)) + 95 * Math.exp(-Math.pow((az - AZ_PEAK + .105) / .036, 2));
        const n4 = fbm(x * .0004 + 6, 6.5, 2, SEED + 27);
        const y4 = (120 + 110 * ridged(x * .0006 + 2.3, 7.5, 5, SEED + 28)) * env * (1 - .8 * pass) + peak;
        /* ribs run down the faces from the crest: the higher the mountain, the deeper they are cut */
        const ribs = (ridged(x * .0030 + 8 + .5 * fbm(z * .001, x * .001, 2, SEED + 38), z * .0006 + 4, 5, SEED + 34) - .5) * .62 * y4;
        take(ridge(z, 3700 + 600 * n4, y4, .5, .35, 50) + ribs, 5, 40);
        take(25 + 12 * fbm(x * .0002, z * .0002, 2, SEED + 29) - .5 * Math.max(0, 4800 - z), 6, 30);
      }
      if (z > 5000) {
        /* two far ranges: the valley is not a bowl, it is one slope behind another, each paler */
        const n5 = fbm(x * .0002 + 3, 8.5, 2, SEED + 35);
        const y5 = (70 + 150 * ridged(x * .00035 + 5.1, 9.5, 5, SEED + 36)) * (1 - .45 * pass);
        take(ridge(z, 7000 + 800 * n5, y5, .4, .3, 60) + (ridged(x * .0016 + 2, z * .0004 + 1, 4, SEED + 39) - .5) * .5 * y5, 7, 40);
        const y6 = (150 + 260 * ridged(x * .00022 + 1.7, 10.5, 5, SEED + 37)) * (1 - .35 * pass);
        take(ridge(z, 11000 + 1000 * n5, y6, .4, .3, 80) + (ridged(x * .0011 + 6, z * .0003 + 3, 4, SEED + 40) - .5) * .5 * y6, 7, 40);
      }
    }
  }
  GK = k;
  return h;
}
function groundN(x, z) {
  const e = Math.max(.3, (z - CAM.eye[2]) * .004);
  return v3.norm([groundH(x - e, z) - groundH(x + e, z), 2 * e, groundH(x, z - e) - groundH(x, z + e)]);
}
/* the worn path: the walk line (z = 0 is what the man walks), and the branch from the ship's ramp */
function pathW(x, z) {
  const e1 = .22 * Math.sin(x * .31) + .16 * Math.sin(x * .83 + 1.3), e2 = .2 * Math.sin(x * .27 + 2) + .15 * Math.sin(x * .71 + .4);
  const zc = -.15 + (e2 - e1) * .5, hw = .85 + (e1 + e2) * .5;
  let w = 1 - smooth(hw, hw + .8, Math.abs(z - zc));
  if (x > RAMP_X - 1 && x < RAMP_X + 10.5) w = Math.max(w, (1 - smooth(.5, 1.2, Math.abs(z - rampLine(x)))) * smooth(RAMP_X - 1, RAMP_X - .2, x));
  return w * smooth(.25, .6, fbm(x * .9, z * .9, 2, SEED + 51) * .5 + .5 + w * .35);
}
/* the line the man walked from the ramp to the walk line */
function rampLine(x) { const t = clamp((x - RAMP_X) / 10, 0, 1); return lerp(RAMP_Z, 0, t * t * (3 - 2 * t)); }
/* the colour fields of the land: large patches, one hue apart from each other, never one green */
function groundCol(x, z, h, n, k) {
  const slope = 1 - n[1];
  const v1 = fbm(x * .05 + 9, z * .05 + 2, 3, SEED + 41) * .5 + .5, v2 = fbm(x * .011 + 4, z * .011 + 6, 3, SEED + 42) * .5 + .5;
  let c;
  if (k === 0) {
    const va = fbm(x * .045 + 1, z * .07 + 7, 3, SEED + 43) * .5 + .5, vb = fbm(x * .09 + 5, z * .13 + 3, 2, SEED + 44) * .5 + .5;
    const dry = smooth(.52, .68, va);
    c = mix3(PAL.grassMid, PAL.grassLit, smooth(.3, .7, v1));
    c = mix3(c, PAL.dry, dry * .75);
    c = mix3(c, PAL.clover, smooth(.60, .72, vb) * .42 * (1 - dry));
    if (z < -3) c = mix3(c, PAL.grassCool, smooth(3, 16, -z) * .7);
  } else if (k === 1) c = mix3(PAL.grassCool, PAL.mud, smooth(WATER_Y + .7, WATER_Y - .5, h));
  else if (k === 2) {
    const va = fbm(x * .016 + 1, z * .03 + 7, 3, SEED + 45) * .5 + .5, vb = fbm(x * .02 + 5, z * .04 + 3, 3, SEED + 46) * .5 + .5;
    c = mix3(mix3(PAL.grassMid, PAL.grassLit, smooth(.35, .7, v1)), PAL.grassCool, .35);
    /* heather lies in drifts, thin at the rim and broken inside: never a flat stain */
    c = mix3(c, PAL.heather, smooth(.52, .74, va) * (.25 + .4 * smooth(.35, .65, v1)));
    c = mix3(c, PAL.dry, smooth(.56, .74, vb) * .55);
    c = mix3(c, PAL.grassCool, smooth(WATER_Y + 2.5, WATER_Y + .2, h) * .6);
  } else if (k === 3) {
    c = mix3(PAL.forest, PAL.glade, smooth(.45, .7, v2));
    c = mix3(c, PAL.heather, smooth(.6, .8, v1) * .35);
  } else if (k === 4) c = mix3(PAL.forest, PAL.crag, smooth(20, 52, h + 14 * (v1 - .5)));
  else if (k === 5 || k === 7) {
    c = mix3(PAL.crag, PAL.cragWarm, v1);
    c = mix3(c, PAL.forest, smooth(150, 60, h) * .6);
    /* snow caps the peak and runs down its gullies: it holds where the slope lets it */
    c = mix3(c, PAL.snow, smooth(235, 310, h + 70 * (v2 - .5)) * smooth(.85, .5, slope));
  } else c = mix3(PAL.plain, PAL.glade, v2);
  if (k < 5) c = mix3(c, mix3(PAL.rockWarm, PAL.rockCool, v1), smooth(.22, .42, slope) * (k >= 4 ? 1 : .8));
  if (k === 0) c = mix3(c, mix3(PAL.soil, PAL.soilDark, v1), pathW(x, z) * .92);
  return c;
}

/* the ground as a fan: every row spans the view at its depth, so the density on screen stays even */
function buildGround(m, aspect) {
  const rows = [], NX = 300, th = Math.tan(CAM.fov / 2) * aspect * 1.75;
  /* rows stand closer where a flat turns its face to the lens: hills, the ridge, mountains, the far ranges */
  const stepOf = d => d < 210 ? 1.013 : (d > 300 && d < 480) ? 1.008 : (d > 900 && d < 1300) ? 1.006 : (d > 2900 && d < 4600) ? 1.004 : (d > 6000 && d < 12500) ? 1.008 : 1.022;
  for (let d = lerp(24, 9, CAM.tall); d < 62000; d *= stepOf(d)) rows.push(d);
  const R = rows.length, H = new Float32Array(R * (NX + 1)), K = new Uint8Array(R * (NX + 1)), X = new Float32Array(R * (NX + 1));
  for (let r = 0; r < R; r++) {
    const z = rows[r] + CAM.eye[2], hw = rows[r] * th;
    for (let c = 0; c <= NX; c++) { const x = CAM.eye[0] + hw * (c / NX * 2 - 1), o = r * (NX + 1) + c; X[o] = x; H[o] = groundH(x, z); K[o] = GK; }
  }
  const at = (r, c) => { r = clamp(r, 0, R - 1); c = clamp(c, 0, NX); const o = r * (NX + 1) + c; return [X[o], H[o], rows[r] + CAM.eye[2]]; };
  const base = m.nv;
  for (let r = 0; r < R; r++) for (let c = 0; c <= NX; c++) {
    const p = at(r, c), du = v3.sub(at(r, c + 1), at(r, c - 1)), dv = v3.sub(at(r + 1, c), at(r - 1, c));
    let n = v3.norm(v3.cross(dv, du)); if (n[1] < 0) n = v3.mul(n, -1);
    /* hollows are darker: how far the point sits below its neighbours three cells away */
    let av = 0; for (const [a, b] of [[3, 0], [-3, 0], [0, 3], [0, -3]]) av += at(r + a, c + b)[1];
    const span = Math.max(1, v3.len(v3.sub(at(r + 3, c), at(r, c))));
    const ao = clamp(1 - Math.max(0, av / 4 - p[1]) / span * 2.2, .45, 1);
    /* the glow slot of the ground says how much of it is stone: stone is cut in facets */
    const kk = K[r * (NX + 1) + c], stone = kk === 5 || kk === 7 ? 1 : (kk === 4 ? .6 : 0);
    m.vert(p, n, groundCol(p[0], p[2], p[1], n, kk), MAT.ground, 0, stone, ao);
  }
  for (let r = 0; r + 1 < R; r++) for (let c = 0; c < NX; c++) {
    const a = base + r * (NX + 1) + c;
    m.quad(a, a + 1, a + NX + 2, a + NX + 1);
  }
}

/* water in the hollow: the extra value is the depth in metres, the shader fades the shore with it */
function buildWater(m) {
  const x0 = -150, x1 = 170, z0 = 8, z1 = 136, sx = 2, sz = 1, nx = (x1 - x0) / sx, nz = (z1 - z0) / sz, id = [];
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const x = x0 + i * sx, z = z0 + j * sz;
    id.push(m.vert([x, WATER_Y, z], [0, 1, 0], [0, 0, 0], MAT.water, 0, 0, WATER_Y - groundH(x, z)));
  }
  const dep = k => m.v[k * VSTRIDE + 12];
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const a = id[j * (nx + 1) + i], b = a + 1, c = a + nx + 2, d = a + nx + 1;
    if (Math.max(dep(a), dep(b), dep(c), dep(d)) > -.4) m.quad(a, b, c, d);
  }
}

/* grass: tufts of bent blades. The carpet takes the colour of the land under it and only breathes;
   accents (tall heads, flowers) stand in clusters where the eye should stop. */
function addTuft(m, x, z, hgt, rnd, root, tip, y0) {
  const y = y0 == null ? groundH(x, z) : y0, nb = 3 + (rnd() * 2 | 0);
  for (let b = 0; b < nb; b++) {
    const yaw = (rnd() - .5) * 1.9, lean = (rnd() - .5) * 1.1, w = hgt * (.09 + rnd() * .06), bh = hgt * (.6 + rnd() * .5);
    const ox = (rnd() - .5) * .4, oz = (rnd() - .5) * .4, dir = [Math.cos(yaw), 0, Math.sin(yaw)], fwd = [-Math.sin(yaw), 0, Math.cos(yaw)];
    const nr = v3.norm([(rnd() - .5) * .5, 1, -.35 + (rnd() - .5) * .3]);
    let pa = -1, pb = -1;
    for (let s = 0; s <= 3; s++) {
      const t = s / 3, ww = w * (1 - t * t) * .5 + (s === 3 ? 0 : .004), bend = lean * bh * t * t;
      const c = [x + ox + fwd[0] * bend, y + bh * t - .04, z + oz + fwd[2] * bend], col = mix3(root, tip, Math.pow(t, .8));
      const a = m.vert([c[0] - dir[0] * ww, c[1], c[2] - dir[2] * ww], nr, col, MAT.grass, t * t * .3 * bh, 0, t);
      const bb = m.vert([c[0] + dir[0] * ww, c[1], c[2] + dir[2] * ww], nr, col, MAT.grass, t * t * .3 * bh, 0, t);
      if (s) m.quad(pa, pb, bb, a);
      pa = a; pb = bb;
    }
  }
}
function buildGrass(m, clear, aspect) {
  const rnd = rngOf(SEED + 77), up = [0, 1, 0], fan = Math.tan(CAM.fov / 2) * aspect * 1.06;
  const warm = [hex("#f6f2e6"), hex("#f2c84b")], cold = [hex("#e8709c"), hex("#c9a0ff")];
  let n = 0;
  for (let k = 0; k < 600000 && n < 30000; k++) {
    const x = (rnd() - .5) * 60, z = -20 + rnd() * 29;
    /* the fan of the view: nothing is planted where the lens does not look */
    if (Math.abs(x - CAM.eye[0]) > (z - CAM.eye[2]) * fan + 1.5) continue;
    const pw = pathW(x, z);
    if (pw > .3) continue;
    /* thick on the raked lane, thinner behind the crest and down the near slope */
    let d = z > 2.5 ? .55 : (z > -5 ? 1 : lerp(1, .4, smooth(5, 18, -z)));
    d *= .45 + .55 * smooth(.3, .6, fbm(x * .12, z * .12, 2, SEED + 61) * .5 + .5);
    for (const c of clear) { const q = Math.hypot((x - c[0]) / c[2], (z - c[1]) / c[3]); if (q < 1) d *= smooth(.7, 1, q); }
    if (rnd() > d) continue;
    const h = groundH(x, z); if (GK !== 0) continue;
    const gc = groundCol(x, z, h, up, 0);
    /* straw heads stand on the raked lane only, in a few clusters; the near slope keeps its tall dark grass */
    const head = z > -6 && fbm(x * .16 + 2, z * .16 + 9, 2, SEED + 62) > .26 && rnd() < .14;
    let hgt = z < -6 ? lerp(.42, .95, smooth(6, 20, -z)) : lerp(.2, .42, smooth(.1, .3, 1 - pw * 3)) * (.8 + rnd() * .5);
    let root = v3.mul(gc, .74), tip = v3.mul(mix3(gc, PAL.grassLit, .3), 1.2);
    if (head) { hgt *= 1.6; tip = v3.mul(mix3(PAL.dry, hex("#f0e0a0"), rnd() * .6), 1.2); }
    addTuft(m, x, z, hgt * (.8 + rnd() * .4), rnd, root, tip, h);
    /* flowers lie in drifts with bare grass between them; a drift has one colour and a few strays of its
       neighbour: warm drifts by the path, cold ones further down the lane */
    if (z > -7 && z < 2.2) {
      const f1 = fbm(x * .2 + 3, z * .2 + 1, 2, SEED + 63), f2 = fbm(x * .17 + 8, z * .17 + 5, 2, SEED + 65);
      const set = f1 > .3 ? warm : (f2 > .34 ? cold : null), deep = set === warm ? f1 - .3 : f2 - .34;
      if (set && rnd() < .12 + 1.6 * deep) {
        const pick = fbm(x * .05 + 1, z * .05 + 7, 2, SEED + 66) > 0 ? 0 : 1;
        const fc = set[rnd() < .88 ? pick : 1 - pick], fy = h + hgt * .7 + rnd() * .12, fx = x + (rnd() - .5) * .4, fz = z + (rnd() - .5) * .4;
        addBlob(m, { c: [fx, fy, fz], r: [.058, .042, .058], sub: 0, col: v3.mul(fc, 1.05), mat: MAT.grass, wind: .1, x: 1, glow: .18 });
      }
    }
    n++;
  }
  return n;
}
