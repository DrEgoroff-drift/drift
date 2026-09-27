"use strict";
/* Planet look-dev stand — the far lens (M600 on the move). The world is the day's and is planted by the same
   dice; what the near lens never saw is added to it: the lane to the left of the ship and to the right of the
   near tree, the near slope down to the foot of the far frame, the mouth of the cave the man is walking to.
   The far lens is the near one pulled back along its own line of sight: the walk line and the horizon keep
   their places in the frame, the actors halve. ?dolly=0 is the near lens, 1 the far one.
   The far page redeclares the lens, the path and the scene of the day; everything else is called as it stands. */

const FR_Q = new URLSearchParams(typeof location === "undefined" ? "" : location.search);
const frK = (name, def) => FR_Q.has(name) ? parseFloat(FR_Q.get(name)) : def;
const FR_DOLLY = clamp(frK("dolly", 1), 0, 1);

/* The game keeps the man at 4.2 % of a broad frame and 2.8 % of a tall one; the far lens does the same.
   Broad: the eye goes from 50 m to 100 m along the line of sight to the walk line, so it rises from 8 m to
   14.45 m. Tall: the near lens is set by the phone's interface, as the night's is (feet at .32 of the height,
   horizon at .52), the far one keeps both and stands 74 m away. */
const FR_NEAR_TALL = { eye: [frK("ntx", -.8), 8.4, -42], tgt: [frK("ntx", -.8), 7.6, 0] };
const FR_FAR_WIDE = { eye: [frK("fx", 8), 14.45, -100], tgt: [frK("fx", 8), 10.85, 0] };
const FR_FAR_TALL = { eye: [frK("tx", -4.2), 14.1, -74], tgt: [frK("tx", -4.2), 12.85, 0] };
function setCam(aspect) {
  const k = smooth(.6, 1.5, aspect), d = FR_DOLLY;
  for (let a = 0; a < 3; a++) {
    const we = lerp(CAM_WIDE.eye[a], FR_FAR_WIDE.eye[a], d), wt = lerp(CAM_WIDE.tgt[a], FR_FAR_WIDE.tgt[a], d);
    const te = lerp(FR_NEAR_TALL.eye[a], FR_FAR_TALL.eye[a], d), tt = lerp(FR_NEAR_TALL.tgt[a], FR_FAR_TALL.tgt[a], d);
    CAM.eye[a] = lerp(te, we, k); CAM.tgt[a] = lerp(tt, wt, k);
  }
  CAM.fov = lerp(CAM_TALL.fov, CAM_WIDE.fov, k); CAM.tall = 1 - k;
}

/* the mouth of the cave: a knoll on the shore, behind the walk line and ahead of the man. Its front has
   fallen away and shows a face of bedded rock with the way in; its left side is a prow turned to the sun.
   The knoll is a mesh of its own, finer than the land: the land under it stays the day's, and whatever is
   planted asks for the knoll's surface. The knoll's own frame: u to the right of the threshold, v up from
   it, w into the knoll. */
const FR_MOUTH = { x: frK("mx", 30), z: frK("mz", 2.8) };
const FR_MOUND = { u: -.5, w: frK("md", 6), rl: 7, rr: 12.5, rz: 8, h: frK("mh", 6.8), sink: .6 };
const FR_ARCH = { l: 1.7, r: 2.0, h: frK("ah", 3.1), lean: .5 };
const FR_DIP = -.1, FR_BROW = 1.0, FR_EDGE = .5, FR_DEEP = 3.0, FR_V0 = -2.6;
const frGround0 = groundH;
const FR_G0 = frGround0(FR_MOUTH.x, FR_MOUTH.z);
/* the land is laid bare of the knoll; the colour of turf is asked without the path */
let FR_BARE = false, FR_NOPATH = false;
/* how much the knoll lifts the land: steep on the left, a long tail to the right. It stands on the level
   of the crest: behind the crest the land falls to the water, and there the knoll lifts it the more. */
function frLift(x, z) {
  const u = x - FR_MOUTH.x - FR_MOUND.u, w = z - FR_MOUTH.z - FR_MOUND.w;
  const s = 1 - Math.pow(u / (u < 0 ? FR_MOUND.rl : FR_MOUND.rr), 2) - Math.pow(w / FR_MOUND.rz, 2);
  if (s <= 0) return 0;
  const h0 = frGround0(x, z), top = frGround0(x, FR_MOUTH.z) - FR_MOUND.sink + FR_MOUND.h * s * s * (3 - 2 * s) * (1 + .12 * gnoise(x * .35, z * .35, 71));
  return (smax(h0, top, .5) - h0) * smooth(0, .25, s);
}
function frSurf(x, z) { return frGround0(x, z) + frLift(x, z); }
/* the line of the face in plan, from its left end to its right one, a point every five centimetres:
   where it stands, which way is into the knoll, how far along the line, how high the knoll is on the brow
   behind it, how high the land is at its foot. The corners are rounded. */
const FR_LINE = (() => {
  const plan = [[-6.6, 9.5], [-6.2, 6.0], [-2.6, .6], [3.6, .3], [4.0, 1.1], [9.5, 3.0], [12, 5]];
  let cur = [];
  for (let k = 0; k + 1 < plan.length; k++) {
    const a = plan[k], b = plan[k + 1], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / .05));
    for (let i = 0; i < n; i++) cur.push([lerp(a[0], b[0], i / n), lerp(a[1], b[1], i / n)]);
  }
  cur.push(plan[plan.length - 1]);
  for (let pass = 0; pass < 2; pass++) cur = cur.map((p, i) => {
    let su = 0, sw = 0;
    for (let d = -14; d <= 14; d++) { const q = cur[clamp(i + d, 0, cur.length - 1)]; su += q[0]; sw += q[1]; }
    return [su / 29, sw / 29];
  });
  let t = 0;
  return cur.map((p, i) => {
    const a = cur[Math.max(0, i - 1)], b = cur[Math.min(cur.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (i) t += Math.hypot(p[0] - cur[i - 1][0], p[1] - cur[i - 1][1]);
    const nu = -(b[1] - a[1]) / l, nw = (b[0] - a[0]) / l;
    return {
      u: p[0], w: p[1], nu, nw, t,
      top: frSurf(FR_MOUTH.x + p[0] + nu * FR_BROW, FR_MOUTH.z + p[1] + nw * FR_BROW) - FR_G0,
      foot: frGround0(FR_MOUTH.x + p[0], FR_MOUTH.z + p[1]) - FR_G0
    };
  });
})();
/* the nearest point of the line: [how far into the knoll (negative before the face), which point] */
function frNear(u, w) {
  let best = 1e9, bi = 0;
  for (let i = 0; i < FR_LINE.length; i += 2) { const p = FR_LINE[i], d = (u - p.u) * (u - p.u) + (w - p.w) * (w - p.w); if (d < best) { best = d; bi = i; } }
  const p = FR_LINE[bi];
  return [(u - p.u) * p.nu + (w - p.w) * p.nw, bi];
}
const frIdx = (u, w) => frNear(u, w)[1];
/* along the line: the way in, and the prow where the rock is bare on top */
const FR_T0 = FR_LINE[frIdx(0, .3)].t, FR_TB = FR_LINE[frIdx(-2.6, .6)].t;
function frBald(i, d) { return (1 - smooth(1.0, 2.6, Math.abs(FR_LINE[i].t - FR_TB))) * (1 - smooth(1.4, 2.8, d)); }
/* the knoll as it is planted: nothing before the face, the rounded edge of turf over it, the dome behind */
function frMoundH(x, z) {
  const u = x - FR_MOUTH.x, w = z - FR_MOUTH.z;
  if (u < -9 || u > 14 || w < -1 || w > 16.5) return 0;
  const [d, i] = frNear(u, w);
  if (d >= FR_BROW) return frLift(x, z);
  if (d <= .4) return 0;
  const t = 1 - (d - .4) / (FR_BROW - .4);
  return Math.max(0, FR_G0 + FR_LINE[i].top - FR_EDGE * (1 - Math.sqrt(1 - t * t)) - frGround0(x, z));
}
/* where nothing grows: the strip the rock of the face stands on, and the bare top of the prow */
function frOnRock(x, z) {
  const u = x - FR_MOUTH.x, w = z - FR_MOUTH.z;
  if (u < -9 || u > 14 || w < -1 || w > 16.5) return false;
  const [d, i] = frNear(u, w), p = FR_LINE[i];
  if (d > -.25 && d < .45 && p.top - FR_EDGE > p.foot + .1) return true;
  return d > 0 && hashI((x * 37) | 0, (z * 37) | 0, 9) < frBald(i, d) * 1.2;
}
groundH = function (x, z) { const h = frGround0(x, z), k = GK, m = FR_BARE ? 0 : frMoundH(x, z); GK = k; return h + m; };

function frBranch(x) { const t = clamp((x - (FR_MOUTH.x - 8)) / 8, 0, 1); return lerp(-.15, FR_MOUTH.z - .3, t * t * (3 - 2 * t)); }
function pathW(x, z) {
  if (FR_NOPATH) return 0;
  const e1 = .22 * Math.sin(x * .31) + .16 * Math.sin(x * .83 + 1.3), e2 = .2 * Math.sin(x * .27 + 2) + .15 * Math.sin(x * .71 + .4);
  const zc = -.15 + (e2 - e1) * .5, hw = .85 + (e1 + e2) * .5;
  let w = 1 - smooth(hw, hw + .8, Math.abs(z - zc));
  if (x > RAMP_X - 1 && x < RAMP_X + 10.5) w = Math.max(w, (1 - smooth(.5, 1.2, Math.abs(z - rampLine(x)))) * smooth(RAMP_X - 1, RAMP_X - .2, x));
  /* the branch to the threshold, and the ground trodden bare before the way in and inside it */
  if (x > FR_MOUTH.x - 8 && x < FR_MOUTH.x + 1) w = Math.max(w, (1 - smooth(.5, 1.2, Math.abs(z - frBranch(x)))) * (1 - smooth(FR_MOUTH.x, FR_MOUTH.x + 1, x)));
  w = Math.max(w, 1 - smooth(1.3, 2.7, Math.hypot(x - FR_MOUTH.x, (z - FR_MOUTH.z + .9) * 1.4)));
  if (z > FR_MOUTH.z - 1 && z < FR_MOUTH.z + FR_DEEP + .9) w = Math.max(w, 1 - smooth(1.5, 2.2, Math.abs(x - FR_MOUTH.x)));
  return w * smooth(.25, .6, fbm(x * .9, z * .9, 2, SEED + 51) * .5 + .5 + w * .35);
}

/* bedded rock: the beds of the cave come out to the day, in the cave's own tones, pale enough to be read
   in the shade and close to each other: a bed is drawn by the ledge it makes, not by its paint. The rusty
   bed is quietened: orange belongs to people and to ore. */
const FR_BEDS = [hex("#b9b2a2"), hex("#cfc9ba"), hex("#a19c90"), hex("#d8d1c0"), mix3(hex("#a0683c"), hex("#b9b2a2"), .68), hex("#aaa090")];
/* the beds of the face from under the ground upwards: thickness, how far the bed stands back, tone.
   Hard beds stand out, soft ones are eaten back: that makes the ledges. */
const FR_STRATA = [[2.4, .10, 5], [1.0, .02, 0], [.45, .34, 2], [1.15, 0, 1], [.4, .30, 4], [1.0, -.06, 3], [.5, .28, 2], [2.0, .12, 0]];
/* the bed a point of the face belongs to: [bed, height in the bed, thickness of the bed here]; s runs
   along the face from the way in. The beds dip to the right, wave a little, swell and pinch. */
function frBed(s, v) {
  const yb = v - FR_DIP * s + .18 * gnoise(s * .22, 3.3, 5) - FR_V0;
  let k = 0, acc = 0, th = 0;
  for (; ;) { th = FR_STRATA[k][0] * (1 + .3 * gnoise(s * .13 + k * 5.7, k * 1.3, 41)); if (k === FR_STRATA.length - 1 || yb <= acc + th) break; acc += th; k++; }
  return [k, yb - acc, th];
}
/* joints cut a bed into blocks, every bed in its own places and with its own lean. A block stands a
   little out or back and has its own shade; of the hard beds a block here and there has fallen out. */
function frBlock(k, s, v) {
  const bed = FR_STRATA[k], sp = 2.6 + 3.4 * hashI(k, 7, 31), ju = (s + 7.3 * k + (hashI(k, 3, 35) - .5) * .5 * v) / sp + .3 * gnoise(s * .2, k * 2.1, 23), b = Math.floor(ju);
  const gone = bed[1] < .15 && hashI(b, k, 93) > .84 ? .4 : 0;
  return { out: bed[1] + .16 * (hashI(b, k, 91) - .5) + gone, tone: .93 + .14 * hashI(b, k, 57), joint: Math.min(ju - b, b + 1 - ju) * sp, soft: bed[1] > .2 || gone > 0 };
}
/* the way in: an arch that leans; hard beds jut into it, soft ones are eaten back. 1 inside, 0 on the rock */
function frHole(s, v, out) {
  const vv = Math.max(v, 0) / FR_ARCH.h, sa = s + FR_ARCH.lean * vv * vv;
  const side = (sa > 0 ? FR_ARCH.r : FR_ARCH.l) * (1 + .9 * (out - .15));
  const q = (Math.pow(Math.abs(sa) / side, 2.4) + Math.pow(vv, 2.8)) * (1 + .14 * gnoise(Math.atan2(vv, sa / FR_ARCH.l) * 1.9, 1.7, 13));
  return 1 - smooth(.8, 1.06, q);
}
/* the knoll: the face of rock with the way in pressed into it, the rounded edge of turf over the face,
   the cap of turf behind */
function frFace() {
  const m = new Mesh(1 << 17), V1 = 6.2, NX = FR_LINE.length - 1, NY = 220, NS = FR_STRATA.length;
  const night = [.020, .022, .030], up = [0, 1, 0], bare = v3.mul(FR_BEDS[3], .95), e = .15;
  const turfAt = (x, z, y, n) => { FR_NOPATH = true; const c = groundCol(x, z, y, n, 0); FR_NOPATH = false; return c; };
  const lieAt = (x, z) => v3.norm([frSurf(x - e, z) - frSurf(x + e, z), 2 * e, frSurf(x, z - e) - frSurf(x, z + e)]);
  /* by column: the colour and the lie of the turf on the brow */
  const TURF = [], TN = [];
  for (const p of FR_LINE) {
    const x = FR_MOUTH.x + p.u + p.nu * FR_BROW, z = FR_MOUTH.z + p.w + p.nw * FR_BROW;
    TURF.push(v3.mul(turfAt(x, z, p.top + FR_G0, up), .85)); TN.push(lieAt(x, z));
  }
  const P = [], C = [], O = [];
  for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) {
    const p = FR_LINE[i], s = p.t - FR_T0, v = lerp(FR_V0, V1, j / NY), top = p.top, e0 = top - FR_EDGE;
    const [k, d, th] = frBed(s, v), dTop = th - d, bed = FR_STRATA[k];
    const B = frBlock(k, s, v), A = k + 1 < NS ? frBlock(k + 1, s, v) : B, D = k > 0 ? frBlock(k - 1, s, v) : B;
    /* the face of a bed is flat and leans back a little; at a seam it steps to the next bed at once,
       and the edge of the step is chipped */
    let out = lerp(B.out, A.out, .5 * (1 - smooth(0, .025, dTop)));
    out = lerp(out, D.out, .5 * (1 - smooth(0, .025, d)));
    out += .07 * gnoise(s * 2.3, k * 1.7, 29) * (1 - smooth(0, .18, Math.min(d, dTop)));
    let off = out + .05 * Math.max(v, 0) + .06 * fbm(s * .45 + k * 3, v * .6, 2, 77) + .05 * (1 - smooth(0, .08, B.joint));
    let c = v3.mul(FR_BEDS[bed[2]], B.tone * (B.soft ? .86 : 1) * (.94 + .12 * gnoise(s * 1.3 + k, v * 2.6, 9)));
    /* a bed that hangs over this one lays its shade on it; where this bed or the one under it stands out,
       the top of the ledge is open to the sky and moss holds on it */
    c = v3.mul(c, 1 - .42 * smooth(.04, .25, B.out - A.out) * (1 - smooth(0, .32, dTop)));
    const ledge = Math.max(smooth(.04, .25, A.out - B.out) * (1 - smooth(0, .1, dTop)), smooth(.04, .25, B.out - D.out) * (1 - smooth(0, .06, d)));
    c = mix3(c, v3.mul(PAL.moss, 1.1), ledge * smooth(-.4, .2, gnoise(s * .6, k * 3.1, 17)) * .8);
    /* joints are thin; the foot is damp */
    c = v3.mul(c, (1 - .2 * (1 - smooth(0, .05, B.joint))) * lerp(.72, 1, smooth(-.2, 1.2, v)));
    /* under the turf the rock is eaten back to where the edge of the turf begins */
    off = lerp(off, .4, smooth(e0 - .35, e0, v));
    /* the way in */
    const hole = frHole(s, v, B.out);
    off = lerp(off, FR_DEEP, hole);
    c = mix3(c, night, smooth(.05, .55, hole));
    /* the edge: a rounded shoulder from the top of the rock back to the brow. It is turf with a ragged
       hem, and bare rock on the prow */
    let y = v, over = 0;
    if (v > e0) {
      const q = clamp((top - v) / FR_EDGE, 0, 1);
      off = .4 + (FR_BROW - .4) * (1 - Math.sqrt(q * (2 - q)));
      if (v >= top) { y = top; over = 1; }
    }
    const bald = frBald(i, FR_BROW);
    c = mix3(c, mix3(TURF[i], bare, bald), smooth(e0 - .1, e0 + .1, v + .16 * gnoise(s * 1.7, 2.2, 3)) * (1 - hole));
    P.push([p.u + p.nu * off, y, p.w + p.nw * off]); C.push(c); O.push(over);
  }
  const at = (i, j) => P[clamp(j, 0, NY) * (NX + 1) + clamp(i, 0, NX)];
  for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) {
    const o = j * (NX + 1) + i;
    let n = O[o] ? [TN[i][0], TN[i][1], TN[i][2]] : v3.cross(v3.sub(at(i, j + 1), at(i, j - 1)), v3.sub(at(i + 1, j), at(i - 1, j)));
    n = v3.len(n) > 1e-6 ? v3.norm(n) : [0, 0, -1];
    m.vert(P[o], n, C[o], MAT.rock, 0, 0, 0);
  }
  /* what lies above the brow is the cap's and is not laid here */
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const a = j * (NX + 1) + i;
    if (Math.min(O[a], O[a + 1], O[a + NX + 1], O[a + NX + 2]) < 1) m.quad(a, a + 1, a + NX + 2, a + NX + 1);
  }
  /* the cap: the knoll behind the brow, turf and the bare top of the prow; its rim dives under the land */
  const capVert = (u, w, sunk) => {
    const x = FR_MOUTH.x + u, z = FR_MOUTH.z + w, lift = frLift(x, z), [d, i] = frNear(u, w), n = lieAt(x, z);
    const y = frGround0(x, z) + lift - .1 * (1 - smooth(.03, .2, lift)) - sunk, bald = frBald(i, d);
    const c = mix3(turfAt(x, z, y, v3.norm([n[0], n[1] + .5, n[2]])), bare, bald);
    return [m.vert([u, y - FR_G0, w], n, c, MAT.ground, 0, bald, 1), d >= FR_BROW && lift > .02];
  };
  {
    const NU = 92, NW = 66, ids = [], IN = [];
    for (let j = 0; j <= NW; j++) for (let i = 0; i <= NU; i++) { const [id, ok] = capVert(lerp(-9, 14, i / NU), lerp(0, 16.5, j / NW), 0); ids.push(id); IN.push(ok); }
    for (let j = 0; j < NW; j++) for (let i = 0; i < NU; i++) {
      const a = j * (NU + 1) + i;
      if (IN[a] && IN[a + 1] && IN[a + NU + 1] && IN[a + NU + 2]) m.quad(ids[a], ids[a + 1], ids[a + NU + 2], ids[a + NU + 1]);
    }
    /* between the brow and the cap: a hem of three rows, the inner ones a finger under the cap */
    const hem = [];
    for (let i = 0; i <= NX; i += 4) {
      const p = FR_LINE[Math.min(i, NX)];
      hem.push([0, .4, .8].map((o, r) => capVert(p.u + p.nu * (FR_BROW + o), p.w + p.nw * (FR_BROW + o), r ? .03 : 0)[0]));
    }
    for (let i = 0; i + 1 < hem.length; i++) for (let r = 0; r < 2; r++) m.quad(hem[i][r], hem[i + 1][r], hem[i + 1][r + 1], hem[i][r + 1]);
  }
  /* the floor of the way in goes dark */
  {
    const N = 6, wf = FR_LINE[frIdx(0, .3)].w, rows = [[wf - .8, .10], [wf + .6, .035], [wf + FR_DEEP + .1, .008]].map(([w, k]) => {
      const ids = [];
      for (let i = 0; i <= N; i++) {
        const u = lerp(-FR_ARCH.l - .5, FR_ARCH.r + .5, i / N);
        ids.push(m.vert([u, frGround0(FR_MOUTH.x + u, FR_MOUTH.z + w) - FR_G0 + .04, w], [0, 1, -.2], [k * .9, k, k * 1.2], MAT.ground, 0, 0, .25));
      }
      return ids;
    });
    for (let r = 0; r < 2; r++) for (let i = 0; i < N; i++) m.quad(rows[r][i], rows[r][i + 1], rows[r + 1][i + 1], rows[r + 1][i]);
  }
  return m;
}

/* the wing of the far lens: we look over the tops of trees that stand on the slope below. Crowns in the
   corners, dark and out of focus, laid out by place in the frame so that they never cover an actor. */
function frWing(F, rnd, aspect) {
  const wk = frK("wk", .45), tint = { top: v3.mul(hex("#2f6a3e"), wk), under: v3.mul(hex("#0f2c26"), wk) };
  const crown = (sx, sy, d, H, R, o) => {
    const p = atFrame(sx, sy, d, aspect);
    F.add(makeTree(rnd, H, R, tint, 3, true, o), [p[0], p[1] - H, p[2]], rnd() * TAU, 1);
  };
  crown(-.86, frK("wl", .19), 44, 13, 6.4, { lean: .3, bend: .8 });
  crown(.82, frK("wr", .23), 40, 14, 6.8, { lean: -.4, bend: -1 });
  crown(1.16, .17, 47, 11, 5.2, { lean: .1, bend: .4 });
  crown(-1.22, .13, 49, 11, 5, { lean: -.1, bend: .3 });
}

/* a tuft for the far lens: fewer, broader blades — at half the size the carpet is a texture, not a drawing */
function frTuft(m, x, z, hgt, rnd, root, tip, y, wide) {
  const nb = 3 + (rnd() * 2 | 0);
  for (let b = 0; b < nb; b++) {
    const yaw = (rnd() - .5) * 1.9, lean = (rnd() - .5) * 1.1, w = hgt * (.09 + rnd() * .06) * wide, bh = hgt * (.6 + rnd() * .5);
    const ox = (rnd() - .5) * .4 * wide, oz = (rnd() - .5) * .4 * wide, dir = [Math.cos(yaw), 0, Math.sin(yaw)], fwd = [-Math.sin(yaw), 0, Math.cos(yaw)];
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
/* grass over all the lane the lens sees. The rules are the day's: thick on the raked lane, thinner behind the
   crest and down the near slope, straw heads and flowers in drifts. The density is given to a square metre. */
function frGrass(m, clear, aspect) {
  const rnd = rngOf(SEED + 77), up = [0, 1, 0], fan = Math.tan(CAM.fov / 2) * aspect * 1.06;
  const warm = [hex("#f6f2e6"), hex("#f2c84b")], cold = [hex("#e8709c"), hex("#c9a0ff")];
  const far = FR_DOLLY, wide = lerp(1, frK("gw", 1.55), far), dens = lerp(30, frK("gd", 17), far);
  const zN = lerp(-20, -48, far), zF = 14, half = lerp(30, 56, far), x0 = CAM.eye[0] - half, area = 2 * half * (zF - zN);
  let n = 0;
  for (let k = 0, K = Math.round(dens * area); k < K; k++) {
    const x = x0 + rnd() * 2 * half, z = zN + rnd() * (zF - zN), turf = z > 2 ? frMoundH(x, z) : 0;
    /* behind the crest the day planted to nine metres; beyond that only the mound is grown over */
    if (z > 9 && turf < .3) continue;
    if (Math.abs(x - CAM.eye[0]) > (z - CAM.eye[2]) * fan + 1.5) continue;
    const pw = turf > .3 ? 0 : pathW(x, z);
    if (pw > .3 || frOnRock(x, z)) continue;
    let d = turf > .3 ? 1 : z > 2.5 ? .55 : (z > -5 ? 1 : lerp(1, .4, smooth(5, 18, -z)));
    d *= .45 + .55 * smooth(.3, .6, fbm(x * .12, z * .12, 2, SEED + 61) * .5 + .5);
    for (const c of clear) { const q = Math.hypot((x - c[0]) / c[2], (z - c[1]) / c[3]); if (q < 1) d *= smooth(.7, 1, q); }
    if (rnd() > d) continue;
    const h = groundH(x, z); if (GK !== 0) continue;
    FR_NOPATH = turf > .3;
    const gc = groundCol(x, z, h, up, 0);
    FR_NOPATH = false;
    const head = z > -6 && fbm(x * .16 + 2, z * .16 + 9, 2, SEED + 62) > .26 && rnd() < .14;
    let hgt = z < -6 ? lerp(.42, .95, smooth(6, 20, -z)) : lerp(.2, .42, smooth(.1, .3, 1 - pw * 3)) * (.8 + rnd() * .5);
    let root = v3.mul(gc, .74), tip = v3.mul(mix3(gc, PAL.grassLit, .3), 1.2);
    if (head) { hgt *= 1.6; tip = v3.mul(mix3(PAL.dry, hex("#f0e0a0"), rnd() * .6), 1.2); }
    if (turf > .3) hgt *= .6;
    frTuft(m, x, z, hgt * (.8 + rnd() * .4), rnd, root, tip, h, wide);
    if (z > lerp(-7, -15, far) && z < 2.2) {
      const f1 = fbm(x * .2 + 3, z * .2 + 1, 2, SEED + 63), f2 = fbm(x * .17 + 8, z * .17 + 5, 2, SEED + 65);
      const set = f1 > .3 ? warm : (f2 > .34 ? cold : null), deep = set === warm ? f1 - .3 : f2 - .34;
      if (set && rnd() < (.12 + 1.6 * deep) * (z > -7 ? 1 : .5)) {
        const pick = fbm(x * .05 + 1, z * .05 + 7, 2, SEED + 66) > 0 ? 0 : 1, fr = .058 * wide;
        const fc = set[rnd() < .88 ? pick : 1 - pick], fy = h + hgt * .7 + rnd() * .12, fx = x + (rnd() - .5) * .4, fz = z + (rnd() - .5) * .4;
        addBlob(m, { c: [fx, fy, fz], r: [fr, fr * .72, fr], sub: 0, col: v3.mul(fc, 1.05), mat: MAT.grass, wind: .1, x: 1, glow: .18 });
      }
    }
    n++;
  }
  return n;
}

function buildScene(aspect) {
  setCam(aspect);
  const t0 = performance.now(), rnd = rngOf(SEED + 1);
  const S = new Mesh(1 << 19), W = new Mesh(1 << 15), F = new Mesh(1 << 15), blobs = [], lamps = [], clear = [];
  /* the land is the day's: the knoll of the cave is laid as a mesh of its own, finer than the land */
  FR_BARE = true; buildGround(S, aspect); FR_BARE = false;
  const tGround = performance.now();
  buildWater(W);

  /* ── the day's cast, as the day plants it: the same calls in the same order, so the dice fall the same ── */
  const shipAt = [SHIP_X, groundH(SHIP_X, SHIP_Z), SHIP_Z];
  S.add(makeShip(lamps, shipAt, SHIP_YAW), shipAt, SHIP_YAW, 1);
  blobs.push([SHIP_X, SHIP_Z, 5.2, .55]); clear.push([SHIP_X, SHIP_Z, 6.5, 4]); clear.push([RAMP_X, RAMP_Z + 1.2, 1.2, 2.2]);
  const manAt = [MAN_X, groundH(MAN_X, 0), 0];
  S.add(makeMan(), manAt, 0, 1);
  blobs.push([MAN_X, 0, .55, .5]);
  for (let k = 0, x = RAMP_X + .4; x < MAN_X - .3; x += .36, k++) {
    const z = rampLine(x) + (k % 2 ? .13 : -.13);
    addBlob(S, { c: [x, groundH(x, z) + .012, z], r: [.14, .012, .075], sub: 1, col: v3.mul(PAL.soilDark, .45), mat: MAT.ground, x: 1 });
  }
  const crAt = [3.2, groundH(3.2, .4), .4];
  S.add(makeCritter(), crAt, .25, 1.25); blobs.push([crAt[0], crAt[2], .6, .45]);
  addDeposit(S, [8.6, groundH(8.6, -1.8), -1.8], rnd, blobs); clear.push([8.6, -1.8, 1.6, 1.3]);

  const rock = (x, z, r, tone, sub, shade) => {
    addRock(S, [x, groundH(x, z) + r * .15, z], [r * 1.2, r * .8, r], (x * 7 + z * 3) | 0, tone, sub, shade);
    blobs.push([x, z, r * 1.8, .5]);
    clear.push([x, z, r * 1.3, r * 1.3]);
  };
  for (const [x, z, r, tone] of [[14.2, 5.2, 1.6, .3], [15.6, 4.0, .9, .5], [12.9, 6.2, .7, .2], [-7.6, -2.7, .8, .4], [5.6, -3.3, .9, .6], [6.5, -3.9, .5, .3],
    [-9, -9, 1.3, .7], [2, -11, 1.0, .6], [11, -8.5, 1.5, .8], [-17.5, -1.5, .6, .4]]) rock(x, z, r, tone, r > .85 ? 2 : 1);
  for (let k = 0; k < 14; k++) {
    const x = -20 + rnd() * 40, z = -5 + rnd() * 6.5, r = .14 + rnd() * .2;
    if (pathW(x, z) > .5 || Math.hypot(x - SHIP_X, (z - SHIP_Z) * 1.5) < 7 || Math.abs(x - MAN_X) < 1.2) continue;
    addRock(S, [x, groundH(x, z) + r * .1, z], [r * (1 + rnd() * .5), r * .7, r], k * 3 + 1, rnd(), 1);
    blobs.push([x, z, r * 1.7, .4]);
  }

  const tree = (x, z, H, R, ti, sub, rich, o, dice) => {
    const y = groundH(x, z); if (y < WATER_Y + .5) return 0;
    const rd = dice || rnd;
    S.add(makeTree(rd, H, R, TINTS[ti], sub, rich, o), [x, y, z], o && o.yaw != null ? o.yaw : rd() * TAU, 1);
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

  const rosRoot = hex("#2c5a3c"), rosTip = hex("#8fb04e"), rosCool = hex("#5fa07a");
  const rosette = (x, z, r, cool, bloom, dice, shade) => {
    const k = shade == null ? 1 : shade;
    addRosette(S, [x, groundH(x, z), z], r, dice, v3.mul(rosRoot, k), v3.mul(cool ? rosCool : rosTip, k), 56, bloom);
    blobs.push([x, z, r * 1.3, .45]);
    clear.push([x, z, r * .9, r * .9]);
  };
  for (const [x, z, r, cool, bloom] of [[-19.5, 3.5, 1.5, 0, 0], [-6.5, 4.2, 1.3, 0, 0], [.5, 4.8, 1.6, 1, 3], [7.5, 4.0, 1.2, 0, 0], [10.5, 5, 1.7, 0, 0], [-4, -7, 1.1, 1, 0], [6, -6.5, .9, 0, 2], [14, -5, 1.2, 0, 0], [-13, -6, 1.0, 0, 0]])
    rosette(x, z, r, cool, bloom, rnd);
  const shoreZ = (x) => { for (let z = 70; z < 150; z += .5) if (groundH(x, z) > WATER_Y - .1) return z; return 0; };
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
  for (const [cx, wid, hgt, n] of [[-55, 8, 2.2, 50], [-17, 3.5, 1.6, 22], [13, 2.5, 1.2, 12], [29, 7, 2.7, 64], [50, 4, 1.8, 26]]) {
    for (let j = 0; j < n; j++) {
      const u = (rr() + rr() + rr()) / 3 * 2 - 1;
      const x = cx + u * wid * 1.3, z0 = shoreZ(x); if (!z0) continue;
      const z = z0 + (rr() - .45) * 3.2, hh = hgt * (1 - .5 * u * u) * (.7 + rr() * .5);
      tuftAt(S, x, Math.max(groundH(x, z), WATER_Y - .25), z, hh, rr, reedRoot, rr() < .25 ? reedDry : reedTip); reeds++;
    }
  }
  [[-21, 0, 1], [-13.5, 2.1, 1], [-8.6, 4.3, .78]].forEach(([x, ph, s]) => {
    const c = crestAt(x, 106, 170, 2);
    S.add(makeStrider(rnd, ph), c, -.12, s);
  });
  const rb = rngOf(SEED + 12);
  for (let k = 0; k < 9; k++) addBird(S, [-22 + rb() * 30 + k * 1.5, 22 + rb() * 9, 160 + rb() * 50], 2.3 + rb() * .8, .5 + rb() * .5, -.3 + rb() * 1.3);
  addElevator(S);

  /* ── what the near lens never saw, planted by dice of its own ── */
  const rf = rngOf(SEED + 201);
  /* the mouth of the cave, where the man is heading: the face of rock, and what grows on the mound */
  S.add(frFace(), [FR_MOUTH.x, FR_G0, FR_MOUTH.z], 0, 1);
  blobs.push([FR_MOUTH.x + 1, FR_MOUTH.z - 2.4, 5, .35]);
  clear.push([FR_MOUTH.x, FR_MOUTH.z - 1.2, 2.6, 2.0]);
  /* scree at the foot of the face, never before the way in: what fell out of the beds lies under them */
  for (let k = 0; k < 30; k++) {
    const p = FR_LINE[(rf() * FR_LINE.length) | 0], off = .45 + rf() * rf() * 1.6, r = .16 + rf() * rf() * .6;
    const x = FR_MOUTH.x + p.u - p.nu * off, z = FR_MOUTH.z + p.w - p.nw * off;
    if (Math.abs(p.t - FR_T0) < 2.8 || p.top - FR_EDGE - p.foot < 1) continue;
    addRock(S, [x, groundH(x, z) + r * .15, z], [r * (1.1 + rf() * .4), r * .75, r], k * 5 + 2, .1 + rf() * .3, 1);
  }
  /* blocks that fell out of the face lie by the way in; two crags stand on the bare top of the prow */
  for (const [du, dw, r, tone] of [[-3.5, -1.0, .85, .25], [-4.4, -.5, .4, .3], [3.3, -.7, .6, .2], [-1.9, 2.2, .75, .2], [-2.9, 3.1, .45, .3]])
    rock(FR_MOUTH.x + du, FR_MOUTH.z + dw, r, tone, r > .7 ? 2 : 1);
  trees += tree(FR_MOUTH.x + 7.6, FR_MOUTH.z + 5.0, 4.6, 2.6, 0, 2, false, { lean: .3, bend: .6 }, rf);
  for (const [dx, dz, r, ti] of [[1.4, 1.9, .9, 0], [4.6, 2.9, .8, 1], [9.4, 5.0, .7, 0], [2.2, 6.4, 1.1, 0], [-3.6, 6.6, .8, 1]]) {
    const x = FR_MOUTH.x + dx, z = FR_MOUTH.z + dz;
    addBush(S, [x, groundH(x, z) - .1, z], r, rf, TINTS[ti]);
  }
  /* two trees on the crest behind the ship close the lane on the left */
  trees += tree(-28.2, 4.6, 10.2, 5.4, 1, 3, false, { lean: .55, bend: 1.1, thin: .8 }, rf);
  trees += tree(-25.4, 6.4, 6.4, 3.4, 0, 2, false, { lean: -.2 }, rf);
  /* stone of the lane beyond what the near lens holds: a big one with its small ones, never a scatter */
  for (const [x, z, r, tone] of [[24.4, -2.4, .8, .4], [25.6, -3.0, .4, .3], [-21.5, -3.2, .9, .5], [-22.8, -2.5, .45, .4], [-26.5, 2.6, .6, .3], [43.5, -1.8, .7, .5], [44.4, -2.6, .35, .4]])
    rock(x, z, r, tone, r > .75 ? 2 : 1);
  for (const [x, z, r, cool, bloom] of [[22, 4.4, 1.4, 0, 0], [26.2, -4.2, 1.1, 1, 2], [35.5, -4.6, 1.2, 0, 0], [44, 3.0, 1.3, 0, 0], [-24.5, 3.6, 1.3, 0, 0], [-29.5, -4.5, 1.2, 1, 0], [20.5, -7.5, 1.0, 0, 0], [40, -7, 1.2, 0, 3], [-31, 1.8, 1.0, 0, 2]])
    rosette(x, z, r, cool, bloom, rf);
  /* the near slope lies in the shade and is kept quiet: three boulders with their small ones, a broad
     rosette at the foot of each, and nothing else but grass */
  const slope = (x, z, r, tone) => {
    addRock(S, [x, groundH(x, z) + r * .15, z], [r * 1.25, r * .8, r], (x * 7 + z * 3) | 0, tone, r > .85 ? 2 : 1, .85);
    blobs.push([x, z, r * 1.8, .5]);
    clear.push([x, z, r * 1.3, r * 1.3]);
  };
  for (const [cx, cz, r] of [[-4.5, -19, 1.8], [24, -24, 2.2], [-27, -14, 1.5]]) {
    slope(cx, cz, r, .6 + rf() * .3);
    slope(cx + r * 1.5 + rf() * .6, cz - .6 - rf(), r * (.4 + rf() * .15), .5 + rf() * .3);
    slope(cx - r * 1.3 - rf() * .5, cz + .5 + rf(), r * (.3 + rf() * .12), .5 + rf() * .3);
    rosette(cx - r * .4 + rf() * 1.5, cz - r * 1.4 - rf(), 1.6 + rf() * .6, rf() < .4 ? 1 : 0, 0, rf, .9);
  }
  /* small stone along the lane, where the near lens did not look */
  for (let k = 0; k < 22; k++) {
    const x = (k % 2 ? -34 + rf() * 14 : 20 + rf() * 28), z = -5 + rf() * 6.5, r = .14 + rf() * .2;
    if (pathW(x, z) > .3 || (z > 1 && frLift(x, z + 1.5) > .05)) continue;
    addRock(S, [x, groundH(x, z) + r * .1, z], [r * (1 + rf() * .5), r * .7, r], k * 3 + 2, rf(), 1);
  }

  const tCast = performance.now();
  const tufts = frGrass(S, clear, aspect);
  if (FR_DOLLY > .5) frWing(F, rngOf(SEED + 5), aspect); else buildWing(F, rngOf(SEED + 5), aspect);

  /* the ground keeps sixty-four blots of shade: the largest of those the lens sees */
  const halfW = Math.tan(CAM.fov / 2) * aspect * -CAM.eye[2] + 4;
  const seen = blobs.filter(b => Math.abs(b[0] - CAM.eye[0]) < halfW + b[2]).sort((a, b) => b[2] * b[3] - a[2] * a[3]).slice(0, 64);
  const B = new Float32Array(4 + 64 * 4); B[0] = seen.length;
  seen.forEach((b, k) => B.set(b, 4 + k * 4));
  const d = FR_DOLLY, mixBox = (a, b) => a.map((v, k) => lerp(v, b[k], d));
  return {
    scene: S.done(), water: W.done(), fg: F.done(), blobs: B, lamps, hero: [(MAN_X + SHIP_X) / 2 + 3, 3],
    /* what the renderer is told: the reach of the hero's pool of light, the boxes of the two shadow maps */
    pool: [lerp(12, frK("p0", 15), d), lerp(26, frK("p1", 36), d)],
    box0: mixBox([-30, 30, -7, 15, -24, 22], [-48, 60, -9, 17, -50, 24]), box1: [-250, 250, -12, 60, -50, 460],
    stats: { verts: S.nv, tris: S.ni / 3, tufts, reeds, trees, blobs: blobs.length, blots: seen.length, msGround: Math.round(tGround - t0), msCast: Math.round(tCast - tGround), msAll: Math.round(performance.now() - t0) }
  };
}
