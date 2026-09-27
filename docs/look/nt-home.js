"use strict";
/* Planet look-dev stand, key frame M602 — what people built. The home is a wagon on skids with a wheelhouse
   over it and a porch under a lantern; beside it a vaulted garage and a banded mast. The base stands on
   stilts in the shallows of the far shore. One grammar for all of it: cream panels with joints, a belt in the
   colour of people, vaulted roofs, warm light behind glass. Every builder works in its own metres about its
   own pivot, gives back its mesh and writes its lights, already placed in the world, into L. */

/* the land's functions as the day has them: the night redeclares them, and the flora of the night must be
   planted by the dice of the day */
const NT_DAY = { pathW: pathW, prof: prof, padLine: padLine };
const NT_MAT = { window: 10, cloth: 11 };
const NT_C = {
  panel: hex("#ddd6c2"), panelB: hex("#cdc6b0"), seam: hex("#55534c"), belt: hex("#e8702a"), door: hex("#d9541e"),
  roof: hex("#8f959e"), roofB: hex("#646a73"), under: hex("#2a2c30"), leg: hex("#4b4e54"), frame: hex("#efe9dc"),
  timber: hex("#b08a5e"), timberB: hex("#6e543a"), cut: hex("#e0c08c"), barkD: hex("#4f3e30"), soil: hex("#4a3a2c"),
  steel: hex("#9aa0a8"), dark: hex("#25272c"), cab: hex("#8fb39a"), cabD: hex("#3f6a52"), white: hex("#f1ede2"),
  teal: hex("#3f6f78"), rust: hex("#b5532a"), clothA: hex("#f0ece0"), clothB: hex("#86b4bc"),
  warm: [1, .60, .27], room: [1, .56, .22], cold: [1, .80, .55], red: [1, .16, .06], amber: [1, .38, .10]
};

/* a pivot and a turn about y: the same turn Mesh.add makes */
function ntPlace(pivot, yaw) {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  return {
    pivot, yaw,
    at: (l) => [l[0] * c + l[2] * s + pivot[0], l[1] + pivot[1], -l[0] * s + l[2] * c + pivot[2]],
    dir: (l) => [l[0] * c + l[2] * s, l[1], -l[0] * s + l[2] * c]
  };
}

/* a box by two corners; skip names the faces left out: x y z the low sides, X Y Z the high ones */
function ntBox(m, lo, hi, col, mat, x, skip, glow) {
  const F = [["x", 0, -1], ["X", 0, 1], ["y", 1, -1], ["Y", 1, 1], ["z", 2, -1], ["Z", 2, 1]];
  for (const [id, ax, s] of F) {
    if (skip && skip.indexOf(id) >= 0) continue;
    const n = [0, 0, 0], u = (ax + 1) % 3, v = (ax + 2) % 3, q = [];
    n[ax] = s;
    for (const [a, b] of [[0, 0], [1, 0], [1, 1], [0, 1]]) {
      const p = [0, 0, 0];
      p[ax] = s < 0 ? lo[ax] : hi[ax]; p[u] = a ? hi[u] : lo[u]; p[v] = b ? hi[v] : lo[v];
      q.push(p);
    }
    addQuad(m, q[0], q[1], q[2], q[3], n, typeof col === "function" ? col(n, q) : col, mat, null, glow || 0, x || 0);
  }
}

/* an arc over a span: from (−hw, y0) over the crest (0, y0 + rise) to (hw, y0) */
function ntArc(hw, y0, rise, n) {
  const R = (hw * hw + rise * rise) / (2 * rise), cy = y0 + rise - R, f = Math.atan2(hw, R - rise), out = [];
  for (let k = 0; k <= n; k++) { const a = -f + 2 * f * k / n; out.push([R * Math.sin(a), cy + R * Math.cos(a)]); }
  return out;
}

/* A body of one section pulled along an axis. prof: the section as a closed loop [[a, y]…]; along "x" (a is z)
   or "z" (a is x); t0…t1 its length; cuts: where the panels meet — a joint is a narrow strip of its own.
   Every face keeps one colour: col(mid, n, seam, seg, span). open leaves the closing segment out, skip(mid, n)
   leaves out what it names, caps: false | "lo" | "hi" | true. */
function ntHull(m, o) {
  const P = o.prof, n = P.length, ax = o.along === "z" ? 2 : 0, e = o.seam == null ? .02 : o.seam;
  const pt = (q, t) => ax === 0 ? [t, q[1], q[0]] : [q[0], q[1], t];
  const n3 = (s) => ax === 0 ? [0, s[1], s[0]] : [s[0], s[1], 0];
  const T = [o.t0];
  for (const c of (o.cuts || [])) if (c > o.t0 + 3 * e && c < o.t1 - 3 * e) T.push(c - e, c + e);
  T.push(o.t1);
  let area = 0;
  for (let i = 0; i < n; i++) { const a = P[i], b = P[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; }
  const sg = area > 0 ? 1 : -1, sn = [], crease = o.crease == null ? .8 : o.crease;
  for (let i = 0; i < n; i++) {
    const a = P[i], b = P[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    sn.push([dy / l * sg, -dx / l * sg]);
  }
  /* the normal where segment i meets segment j: shared if the fold is gentle, its own if it is an edge */
  const soft = (i, j) => {
    const a = sn[i], b = sn[(j + n) % n];
    if (a[0] * b[0] + a[1] * b[1] < crease) return a;
    const s = [a[0] + b[0], a[1] + b[1]], l = Math.hypot(s[0], s[1]) || 1;
    return [s[0] / l, s[1] / l];
  };
  for (let i = 0; i < n; i++) {
    if (o.open && i === n - 1) continue;
    const a = P[i], b = P[(i + 1) % n], na = n3(soft(i, i - 1)), nb = n3(soft(i, i + 1)), nm = n3(sn[i]);
    for (let k = 0; k + 1 < T.length; k++) {
      const seam = (k & 1) === 1, mid = pt([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], (T[k] + T[k + 1]) / 2);
      if (o.skip && o.skip(mid, nm, i)) continue;
      const c = typeof o.col === "function" ? o.col(mid, nm, seam, i, k >> 1) : o.col;
      const x = typeof o.x === "function" ? o.x(mid, nm, seam) : (o.x || 0);
      const i0 = m.vert(pt(a, T[k]), na, c, o.mat, 0, 0, x), i1 = m.vert(pt(a, T[k + 1]), na, c, o.mat, 0, 0, x);
      const i2 = m.vert(pt(b, T[k + 1]), nb, c, o.mat, 0, 0, x), i3 = m.vert(pt(b, T[k]), nb, c, o.mat, 0, 0, x);
      m.quad(i0, i1, i2, i3);
    }
  }
  if (o.caps === false) return;
  let ca = 0, cy = 0;
  for (const q of P) { ca += q[0]; cy += q[1]; }
  ca /= n; cy /= n;
  for (const [t, s, id] of [[o.t0, -1, "lo"], [o.t1, 1, "hi"]]) {
    if (o.caps === "lo" && id !== "lo" || o.caps === "hi" && id !== "hi") continue;
    const nn = ax === 0 ? [s, 0, 0] : [0, 0, s], cc = o.capCol || NT_C.panel, cx = o.capX == null ? .12 : o.capX;
    const c0 = m.vert(pt([ca, cy], t), nn, cc, o.mat, 0, 0, cx), ring = P.map(q => m.vert(pt(q, t), nn, cc, o.mat, 0, 0, cx));
    for (let i = 0; i < n; i++) m.tri(c0, ring[i], ring[(i + 1) % n]);
  }
}

/* A window on a wall that stands along an axis. wall { ax: "z" | "x", at, out: −1 | 1 }: the plane and the
   side it looks to; a0…a1 along the wall, y0…y1 up. The glass is one card of the window material: where in
   the opening a point lies is written into its colour, the kind and the seed beside it, the emission into the
   glow, the proportion into the extra. kind: 0 a window with a cross, 1 a band, 2 a porthole, 3 a window of
   the base, 4 dark glass. Gives back the opening, for the light that falls out of it. */
function ntWindow(m, wall, a0, y0, a1, y1, kind, glow, seed, trim) {
  const o = wall.out, zax = wall.ax === "z";
  const N = zax ? [0, 0, o] : [o, 0, 0], R = zax ? [-o, 0, 0] : [0, 0, o];
  const P = (a, y, d) => zax ? [a, y, wall.at + o * d] : [wall.at + o * d, y, a];
  const asp = (a1 - a0) / (y1 - y0), kz = kind + clamp(seed || 0, 0, .99), flip = zax ? o > 0 : o < 0, id = [];
  for (const [ua, vy] of [[0, 0], [1, 0], [1, 1], [0, 1]])
    id.push(m.vert(P(lerp(a0, a1, ua), lerp(y0, y1, vy), .03), N, [flip ? 1 - ua : ua, vy, kz], NT_MAT.window, 0, glow, asp));
  m.quad(id[0], id[1], id[2], id[3]);
  const t = trim == null ? .07 : trim;
  if (t > 0) {
    const bx = (aa, ya, ab, yb, d) => {
      const p = P(aa, ya, 0), q = P(ab, yb, d);
      ntBox(m, [Math.min(p[0], q[0]), ya, Math.min(p[2], q[2])], [Math.max(p[0], q[0]), yb, Math.max(p[2], q[2])], NT_C.frame, MAT.man, .15);
    };
    bx(a0 - t, y0 - t, a0, y1 + t, t); bx(a1, y0 - t, a1 + t, y1 + t, t); bx(a0, y1, a1, y1 + t, t); bx(a0, y0 - t, a1, y0, t);
    bx(a0 - t * 1.6, y0 - t * 1.9, a1 + t * 1.6, y0 - t, t * 1.9);
  }
  return { c: P((a0 + a1) / 2, (y0 + y1) / 2, 0), R, N, hw: (a1 - a0) / 2, hh: (y1 - y0) / 2 };
}

/* the light that falls out of a lit window: the lamp of the room hangs behind the wall under the ceiling, and
   a point outside is lit if its way to the lamp passes through the opening */
function ntCookie(L, T, w, power, col, nx, back, up) {
  const p = v3.add(v3.add(w.c, v3.mul(w.N, -(back || 1.3))), [0, up == null ? .75 : up, 0]);
  L.cookies.push({ p: T.at(p), c: T.at(w.c), R: T.dir(w.R), hw: w.hw, hh: w.hh, col, power, nx: nx || 2 });
}

/* a cloth on the line: a and b are its pegs; it hangs, bellies out and takes the wind at its hem */
function ntCloth(m, a, b, drop, col, seed) {
  const NU = 6, NV = 8, id = [];
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
    const u = i / NU, v = j / NV, top = v3.lerp(a, b, u);
    const belly = Math.sin(u * Math.PI) * v * v * .14 + Math.sin(u * 9 + seed) * v * .035;
    const p = [top[0] + Math.sin(v * 3 + seed) * .025, top[1] - drop * v, top[2] - belly];
    id.push(m.vert(p, [0, .15, -1], v3.mul(col, .9 + .1 * Math.sin(u * 14 + seed)), NT_MAT.cloth, v * v * .22, 0, v));
  }
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) {
    const q = j * (NU + 1) + i;
    m.quad(id[q], id[q + 1], id[q + NU + 2], id[q + NU + 1]);
  }
}

/* a lamp under a hood: the hood, the rod it hangs on, the bulb */
function ntFixture(m, p, col, glow, r, breathe) {
  addBlob(m, { c: [p[0], p[1] + .11, p[2]], r: [r * 2.6, r * 1.1, r * 2.6], sub: 1, cut: -.01, col: NT_C.dark, mat: MAT.man, x: .2 });
  addBlob(m, { c: p, r: [r, r * 1.2, r], sub: 1, col, mat: MAT.glow, glow, x: breathe || 0 });
}

/* ── the home ── */
function ntHouse(T, L) {
  const m = new Mesh(1 << 15), C = NT_C;
  const X0 = -3.8, X1 = 3.8, ZF = -1.7, ZB = 1.7, YB = .68, YF = .8, YW = 3.3;

  /* skids: the wagon was dragged here and stayed */
  for (const z of [-1.25, 1.25]) {
    addTube(m, { path: [[-4.6, .66, z], [-4.35, .34, z], [-3.9, .14, z], [0, .1, z], [3.9, .14, z], [4.35, .34, z], [4.6, .66, z]], rad: .085, sides: 8, col: C.leg, mat: MAT.man, x: .2, cap: true });
    for (const x of [-3.3, -1.1, 1.1, 3.3]) ntBox(m, [x - .06, .1, z - .06], [x + .06, YB, z + .06], C.leg, MAT.man, .1, "yY");
  }

  /* the body: panels, the belt, the vault of the roof */
  const body = [[ZF + .12, YB], [ZF + .035, YB + .035], [ZF, YB + .12], [ZF, 1.5], [ZF, 1.78], [ZF, YW], [ZF - .14, YW]]
    .concat(ntArc(1.84, YW + .08, 1.0, 14), [[ZB + .14, YW], [ZB, YW], [ZB, 1.78], [ZB, 1.5], [ZB, YB + .12], [ZB - .035, YB + .035], [ZB - .12, YB]]);
  const skin = (top, b0, b1) => (mid, n, seam, seg, span) => {
    const y = mid[1];
    if (n[1] < -.5) return C.under;
    if (y > top || n[1] > .3) return seam ? C.roofB : C.roof;
    if (y > b0 && y < b1) return seam ? v3.mul(C.belt, .6) : C.belt;
    if (seam) return C.seam;
    const tone = span % 2 ? C.panelB : C.panel;
    return y < b0 ? v3.mul(tone, .86) : tone;
  };
  const gloss = (mid, n) => n[1] > .3 ? .35 : .12;
  ntHull(m, { prof: body, along: "x", t0: X0, t1: X1, cuts: [-2.28, -.76, .76, 2.28], col: skin(YW - .01, 1.5, 1.78), mat: MAT.man, x: gloss, capCol: C.panel });
  /* the end that looks at the path: the belt runs round the corner, a joint down the middle */
  ntBox(m, [X1, 1.5, ZF], [X1 + .012, 1.78, ZB], C.belt, MAT.man, .12, "xyYzZ");
  ntBox(m, [X1, YB + .1, -.02], [X1 + .01, 1.5, .02], C.seam, MAT.man, .1, "xyYzZ");
  ntBox(m, [X1, 1.78, -.02], [X1 + .01, YW, .02], C.seam, MAT.man, .1, "xyYzZ");

  const front = { ax: "z", at: ZF, out: -1 }, right = { ax: "x", at: X1, out: 1 };
  const w1 = ntWindow(m, front, -3.58, 1.9, -2.5, 2.9, 0, 2.3, .13);
  const w2 = ntWindow(m, front, -2.06, 1.9, -.98, 2.9, 0, 1.9, .57);
  ntWindow(m, front, -.54, 1.9, .54, 2.9, 4, 0, .31);
  const we = ntWindow(m, right, -.55, 1.9, .45, 2.9, 0, 1.7, .81);
  ntCookie(L, T, w1, 4.2, C.room, 2); ntCookie(L, T, w2, 3.6, C.room, 2); ntCookie(L, T, we, 3.2, C.room, 2);
  L.halos.push({ p: T.at([-2.28, 2.4, ZF - .25]), c: C.room, k: .3, s: 1.1 }, { p: T.at([X1 + .25, 2.4, -.05]), c: C.room, k: .2, s: .8 });

  /* the vestibule with the door */
  const VX0 = .76, VX1 = 3.2, VZ = -3.4;
  ntHull(m, {
    prof: [[VZ, YB], [VZ, 1.5], [VZ, 1.78], [VZ, 2.95], [VZ - .12, 2.95], [VZ - .12, 3.02], [ZF, 3.28], [ZF, YB]], along: "x", t0: VX0, t1: VX1, cuts: [1.98],
    col: skin(2.94, 1.5, 1.78), mat: MAT.man, x: gloss, skip: (mid, n) => n[2] > .5, capCol: C.panelB
  });
  ntBox(m, [1.48, YF, VZ - .05], [2.48, 2.8, VZ], C.door, MAT.man, .25, "Z");
  for (const [a, b] of [[[1.41, YF, VZ - .07], [1.48, 2.87, VZ]], [[2.48, YF, VZ - .07], [2.55, 2.87, VZ]], [[1.48, 2.8, VZ - .07], [2.48, 2.87, VZ]]]) ntBox(m, a, b, C.frame, MAT.man, .15, "Z");
  ntWindow(m, { ax: "z", at: VZ - .05, out: -1 }, 1.80, 2.06, 2.16, 2.42, 2, 2.4, .4, 0);
  ntBox(m, [2.30, 1.72, VZ - .1], [2.40, 1.78, VZ - .05], C.steel, MAT.man, .6);
  L.halos.push({ p: T.at([1.98, 2.24, VZ - .2]), c: C.room, k: .12, s: .4 });

  /* the porch: a timber deck, a railing, a canopy, steps down towards the path */
  const PX0 = .56, PX1 = 3.4, PZ0 = -4.8, PZ1 = VZ;
  ntBox(m, [PX0, YB, PZ0], [PX1, YF, PZ1], (n) => n[1] > .5 ? C.timber : C.timberB, MAT.bark, 0);
  for (let z = PZ0 + .28; z < PZ1 - .1; z += .28) ntBox(m, [PX0, YF, z - .012], [PX1, YF + .004, z + .012], C.barkD, MAT.bark, 0, "xXyzZ");
  for (const [x, z] of [[PX0 + .08, PZ0 + .08], [PX1 - .08, PZ0 + .08], [PX0 + .08, PZ1 - .08], [PX1 - .08, PZ1 - .08], [(PX0 + PX1) / 2, PZ0 + .08]])
    ntBox(m, [x - .06, -.25, z - .06], [x + .06, YB, z + .06], C.timberB, MAT.bark, 0, "yY");
  for (const x of [PX0 + .06, PX1 - .06]) ntBox(m, [x - .05, YF, PZ0 + .02], [x + .05, 2.88, PZ0 + .12], C.timber, MAT.bark, 0, "yY");
  ntHull(m, {
    prof: [[PZ0 - .16, 2.83], [PZ0 - .16, 2.895], [PZ1, 3.16], [PZ1, 3.095]], along: "x", t0: PX0 - .14, t1: PX1 + .14, cuts: [1.98],
    col: (mid, n, seam) => n[1] > .3 ? (seam ? C.roofB : C.roof) : (n[1] < -.3 ? C.panelB : C.roofB), mat: MAT.man, x: gloss, capCol: C.roofB
  });
  ntBox(m, [PX0, 1.72, PZ0 + .03], [PX1, 1.79, PZ0 + .10], C.timber, MAT.bark, 0);
  ntBox(m, [PX0 + .02, 1.72, PZ0 + .03], [PX0 + .09, 1.79, PZ1], C.timber, MAT.bark, 0);
  for (let x = PX0 + .3; x < PX1 - .15; x += .27) ntBox(m, [x - .018, YF, PZ0 + .05], [x + .018, 1.72, PZ0 + .085], C.timberB, MAT.bark, 0, "yY");
  for (let z = PZ0 + .32; z < PZ1 - .1; z += .27) ntBox(m, [PX0 + .037, YF, z - .018], [PX0 + .072, 1.72, z + .018], C.timberB, MAT.bark, 0, "yY");
  for (let k = 0; k < 4; k++) {
    const top = YF - (k + 1) * .2;
    ntBox(m, [PX1 + k * .32, -.2, -4.62], [PX1 + (k + 1) * .32, top, -3.58], (n) => n[1] > .5 ? C.timber : C.timberB, MAT.bark, 0, "xy");
  }
  /* the lantern under the canopy, in the middle of its front edge: the posts stand a stride and a half away
     and throw narrow shadows, none of them on the steps */
  const LP = [1.98, 2.62, PZ0 + .32];
  addTube(m, { path: [[LP[0], 2.92, LP[2]], [LP[0], LP[1] + .12, LP[2]]], rad: .012, sides: 5, col: C.dark, mat: MAT.man });
  ntFixture(m, LP, C.warm, 18, .06);
  L.lamp = { p: T.at(LP), dir: v3.norm(T.dir([.35, -1, -.45])), outer: 76 * DEG, inner: 50 * DEG, fov: 150 * DEG, col: C.warm, power: 6, reach: 17 };
  /* what the lit deck and the ground give back to the walls: a light without a shadow, low and wide */
  L.points.push({ p: T.at([LP[0], LP[1] - .05, LP[2]]), r: 4.2, c: C.warm, k: 1.5, even: .45 });
  L.points.push({ p: T.at([.4, 1.5, -5.6]), r: 9, c: C.warm, k: 1.5, even: .25 });
  L.halos.push({ p: T.at(LP), c: C.warm, k: .8, s: .45 });

  /* the wheelhouse over the roof: a lookout with a band of glass */
  const UX0 = -.76, UX1 = 3.2, UZ = 1.35;
  ntHull(m, {
    prof: [[-UZ, 3.6], [-UZ, 4.45], [-UZ, 4.58], [-UZ, 5.75], [-UZ - .1, 5.75], [-UZ - .1, 5.81]].concat(ntArc(UZ + .1, 5.81, .55, 10), [[UZ + .1, 5.75], [UZ, 5.75], [UZ, 4.58], [UZ, 4.45], [UZ, 3.6]]),
    along: "x", t0: UX0, t1: UX1, cuts: [.56, 1.88], open: true, col: skin(5.74, 4.45, 4.58), mat: MAT.man, x: gloss, capCol: C.panel
  });
  ntBox(m, [UX1, 4.45, -UZ], [UX1 + .012, 4.58, UZ], C.belt, MAT.man, .12, "xyYzZ");
  const wb = ntWindow(m, { ax: "z", at: -UZ, out: -1 }, -.42, 4.78, 2.86, 5.42, 1, 1.6, .22, .06);
  const wu = ntWindow(m, { ax: "x", at: UX1, out: 1 }, -.85, 4.78, .85, 5.42, 1, 1.2, .66, .06);
  ntCookie(L, T, wb, 2.4, C.room, 5, 1.1, .45); ntCookie(L, T, wu, 1.6, C.room, 3, 1.1, .45);
  L.halos.push({ p: T.at([1.2, 5.1, -UZ - .25]), c: C.room, k: .22, s: 1.1 });
  addTube(m, { path: [[2.6, 6.2, .6], [2.6, 8.1, .6]], rad: .012, sides: 5, col: C.dark, mat: MAT.man });
  /* the ladder up the end wall */
  for (const z of [.85, 1.25]) addTube(m, { path: [[X1 + .09, .25, z], [X1 + .09, 4.7, z]], rad: .02, sides: 6, col: C.steel, mat: MAT.man, x: .4 });
  for (let y = .55; y < 4.6; y += .3) addTube(m, { path: [[X1 + .09, y, .85], [X1 + .09, y, 1.25]], rad: .014, sides: 5, col: C.steel, mat: MAT.man, x: .4 });

  /* the flue */
  addTube(m, { path: [[-3.0, 3.9, .75], [-3.0, 5.4, .75]], rad: .085, sides: 10, col: C.leg, mat: MAT.man, x: .3 });
  addBlob(m, { c: [-3.0, 5.52, .75], r: [.18, .09, .18], sub: 1, cut: -.015, col: C.dark, mat: MAT.man, x: .3 });
  L.flue = T.at([-3.0, 5.62, .75]);

  /* firewood stacked under the dark window: the cut ends look at the lens */
  for (let j = 0; j < 5; j++) for (let i = 0; i < 6 - j; i++) {
    const r = .105 + .02 * Math.sin(i * 7.3 + j * 3.1), x = -.62 + (i + j * .5) * .235, y = .11 + j * .2, z0 = -2.72 - .06 * Math.sin(i * 5 + j);
    addTube(m, { path: [[x, y, z0], [x, y, -1.86]], rad: r, sides: 8, col: (t, a, p) => (p[0] === x && p[1] === y) ? C.cut : C.barkD, mat: MAT.bark, cap: true });
  }
  /* a bed of cabbages in the light of the windows */
  const GX0 = -3.5, GX1 = -1.0, GZ0 = -5.4, GZ1 = -3.9;
  for (const [a, b] of [[[GX0, 0, GZ0], [GX1, .28, GZ0 + .07]], [[GX0, 0, GZ1 - .07], [GX1, .28, GZ1]], [[GX0, 0, GZ0], [GX0 + .07, .28, GZ1]], [[GX1 - .07, 0, GZ0], [GX1, .28, GZ1]]]) ntBox(m, a, b, C.timberB, MAT.bark, 0, "y");
  ntBox(m, [GX0 + .07, .15, GZ0 + .07], [GX1 - .07, .2, GZ1 - .07], C.soil, MAT.ground, 1, "xXyzZ");
  for (let j = 0; j < 2; j++) for (let i = 0; i < 4; i++) {
    const x = GX0 + .42 + i * .56, z = GZ0 + .42 + j * .66, r = .17 + .04 * Math.sin(i * 3 + j * 5);
    addBlob(m, { c: [x, .2 + r * .55, z], r: [r, r * .8, r], sub: 1, bump: .25, seed: i * 3 + j, cut: -.3 * r, col: (u) => mix3(C.cabD, C.cab, smooth(-.3, .7, u[1])), mat: MAT.leaf });
  }
  /* two drums by the end wall */
  for (const [x, z, col, h] of [[X1 + .62, -1.15, C.teal, .9], [X1 + 1.08, -.55, C.rust, .86]]) {
    addTube(m, { path: [[x, 0, z], [x, h * .33, z], [x, h * .34, z], [x, h * .66, z], [x, h * .67, z], [x, h, z]], rad: t => .29 + (Math.abs(t - .335) < .03 || Math.abs(t - .665) < .03 ? .012 : 0), sides: 14, col, mat: MAT.man, x: .3, cap: true });
  }
  /* the washing line: from the corner of the house to a pole in the yard */
  const pegA = [X0 - .05, 2.55, ZF - .1], pegB = [-6.6, 2.55, -3.3], line = [];
  for (let k = 0; k <= 12; k++) { const t = k / 12, p = v3.lerp(pegA, pegB, t); p[1] -= .34 * 4 * t * (1 - t); line.push(p); }
  addTube(m, { path: line, rad: .008, sides: 4, col: C.dark, mat: MAT.man });
  addTube(m, { path: [[pegB[0], -.2, pegB[2]], [pegB[0], 2.65, pegB[2]]], rad: .04, sides: 6, col: C.timberB, mat: MAT.bark });
  const onLine = (t) => { const p = v3.lerp(pegA, pegB, t); p[1] -= .34 * 4 * t * (1 - t) + .01; return p; };
  ntCloth(m, onLine(.16), onLine(.44), 1.05, C.clothA, 1.3);
  ntCloth(m, onLine(.54), onLine(.76), .8, C.clothB, 4.1);
  return m;
}

/* ── the garage: a vault of ribbed metal, its gable with the doors looks into the yard ── */
function ntGarage(T, L) {
  const m = new Mesh(1 << 14), C = NT_C, Z0 = -2.8, Z1 = 2.8, cuts = [];
  for (let z = Z0 + .62; z < Z1 - .3; z += .62) cuts.push(z);
  ntHull(m, { prof: ntArc(2.5, -.15, 3.45, 22), along: "z", t0: Z0, t1: Z1, cuts, seam: .035, open: true, col: (mid, n, seam) => seam ? C.roofB : C.roof, mat: MAT.man, x: .3, capCol: C.panelB });
  for (const s of [-1, 1]) {
    ntBox(m, [s < 0 ? -1.45 : .02, 0, Z0 - .05], [s < 0 ? -.02 : 1.45, 2.55, Z0], C.teal, MAT.man, .2, "Z");
    ntWindow(m, { ax: "z", at: Z0 - .05, out: -1 }, s < 0 ? -1.0 : .45, 1.7, s < 0 ? -.45 : 1.0, 2.1, 4, 0, .2 + .3 * s, .04);
  }
  ntBox(m, [-1.45, 1.05, Z0 - .062], [1.45, 1.22, Z0 - .05], C.belt, MAT.man, .2, "Z");
  ntBox(m, [-1.56, 2.55, Z0 - .09], [1.56, 2.68, Z0], C.frame, MAT.man, .15, "Z");
  for (const x of [-1.56, 1.45]) ntBox(m, [x, 0, Z0 - .09], [x + .11, 2.55, Z0], C.frame, MAT.man, .15, "Z");
  const LP = [0, 2.92, Z0 - .3];
  addTube(m, { path: [[0, 3.05, Z0], [0, 3.05, Z0 - .3]], rad: .015, sides: 5, col: C.dark, mat: MAT.man });
  ntFixture(m, LP, C.cold, 4, .045);
  L.points.push({ p: T.at([LP[0], LP[1] - .08, LP[2] - .05]), r: 6.5, c: C.cold, k: .55, even: .3 });
  L.halos.push({ p: T.at(LP), c: C.cold, k: .16, s: .35 });
  return m;
}

/* ── the mast: a lattice in bands of white and orange, guy wires, a dish, the beacon that breathes ── */
function ntMast(T, L, H) {
  const m = new Mesh(1 << 14), C = NT_C, NS = 10;
  const chord = (k, y) => { const a = k / 3 * TAU + .4, r = lerp(.62, .2, clamp(y / H, 0, 1)) / Math.sqrt(3); return [Math.cos(a) * r, y, Math.sin(a) * r]; };
  for (let j = 0; j < NS; j++) {
    const y0 = j ? j * H / NS : -.25, y1 = (j + 1) * H / NS, col = j % 2 ? C.white : C.belt;
    for (let k = 0; k < 3; k++) {
      addTube(m, { path: [chord(k, y0), chord(k, y1)], rad: .028, sides: 6, col, mat: MAT.man, x: .3 });
      addTube(m, { path: [chord(k, y1), chord((k + 1) % 3, y1)], rad: .013, sides: 4, col, mat: MAT.man, x: .3 });
      addTube(m, { path: [chord(k, Math.max(y0, 0)), chord((k + 1) % 3, y1)], rad: .011, sides: 4, col, mat: MAT.man, x: .3 });
    }
  }
  for (let k = 0; k < 3; k++) {
    const a = k / 3 * TAU + .4 + .25, foot = [Math.cos(a) * 5.6, -.05, Math.sin(a) * 5.6];
    addTube(m, { path: [chord(k, H * .7), foot], rad: .009, sides: 4, col: C.steel, mat: MAT.man, x: .4 });
    ntBox(m, [foot[0] - .12, -.1, foot[2] - .12], [foot[0] + .12, .14, foot[2] + .12], C.leg, MAT.man, .1, "y");
  }
  /* the dish looks over the water */
  addBlob(m, { c: [.12, H * .62, -.42], r: [.52, .52, .1], sub: 2, pitch: -.3, yaw: .35, col: (u) => u[2] < -.2 ? C.white : C.panelB, mat: MAT.man, x: .3 });
  addTube(m, { path: [[.05, H * .62, -.1], [.2, H * .64, -.8]], rad: .015, sides: 4, col: C.dark, mat: MAT.man });
  const top = [0, H + .14, 0], mid = chord(0, H * .5);
  addBlob(m, { c: top, r: [.1, .13, .1], sub: 1, col: C.amber, mat: MAT.glow, glow: 14, x: .6 });
  addBlob(m, { c: [mid[0] * 1.3, mid[1], mid[2] * 1.3], r: [.05, .06, .05], sub: 1, col: C.red, mat: MAT.glow, glow: 5 });
  L.points.push({ p: T.at(top), r: 15, c: C.amber, k: .8, even: .35, breathe: .6 });
  L.halos.push({ p: T.at(top), c: C.amber, k: .7, s: .6, breathe: .6 }, { p: T.at([mid[0] * 1.3, mid[1], mid[2] * 1.3]), c: C.red, k: .1, s: .3 });
  return m;
}

/* ── the base: modules on a deck over the shallows, a pier with a lamp, a mast with a steady red light ── */
function ntBase(T, L) {
  const m = new Mesh(1 << 15), C = NT_C, DY = 2.2;
  const skin = (top, b0, b1) => (mid, n, seam, seg, span) => {
    const y = mid[1];
    if (n[1] < -.5) return C.under;
    if (y > top || n[1] > .3) return seam ? C.roofB : C.roof;
    if (y > b0 && y < b1) return seam ? v3.mul(C.belt, .6) : C.belt;
    if (seam) return C.seam;
    return span % 2 ? C.panelB : C.panel;
  };
  /* the deck and its stilts */
  ntBox(m, [-10, DY - .22, -3.6], [9.5, DY, 3.6], (n) => n[1] > .5 ? C.steel : C.leg, MAT.man, .2);
  for (let i = 0; i < 6; i++) for (const z of [-3.2, 3.2]) {
    const x = -9.4 + i * 3.7;
    addTube(m, { path: [[x, -2.2, z], [x, DY - .2, z]], rad: .13, sides: 8, col: C.leg, mat: MAT.man, x: .2 });
    if (i < 5) addTube(m, { path: [[x, DY - .3, z], [x + 3.7, .25, z]], rad: .05, sides: 5, col: C.leg, mat: MAT.man, x: .2 });
  }
  /* the main module */
  const MX0 = -7.6, MX1 = 3.6, MZ = 2.0, YW = DY + 2.9;
  ntHull(m, {
    prof: [[-MZ, DY], [-MZ, DY + .95], [-MZ, DY + 1.25], [-MZ, YW], [-MZ - .15, YW], [-MZ - .15, YW + .08]].concat(ntArc(MZ + .15, YW + .08, 1.15, 14), [[MZ + .15, YW], [MZ, YW], [MZ, DY]]),
    along: "x", t0: MX0, t1: MX1, cuts: [-5.36, -3.12, -.88, 1.36], seam: .03, open: true, col: skin(YW - .01, DY + .95, DY + 1.25), mat: MAT.man, x: .2, capCol: C.panel
  });
  const front = { ax: "z", at: -MZ, out: -1 };
  [[-6.9, 2.2], [-4.66, 1.7], [-2.42, 0], [-.18, 2.0], [2.06, 0]].forEach(([x, glow], k) => {
    ntWindow(m, front, x, DY + 1.45, x + 1.3, DY + 2.4, glow ? 3 : 4, glow, .1 + k * .17, .08);
    if (glow) L.halos.push({ p: T.at([x + .65, DY + 1.9, -MZ - .4]), c: C.cold, k: .12, s: 1.3 });
  });
  /* the upper module with its band of glass */
  ntHull(m, {
    prof: [[-1.4, YW + .3], [-1.4, YW + 2.5], [-1.5, YW + 2.5], [-1.5, YW + 2.57]].concat(ntArc(1.5, YW + 2.57, .7, 10), [[1.5, YW + 2.5], [1.4, YW + 2.5], [1.4, YW + .3]]),
    along: "x", t0: -3.2, t1: 1.4, cuts: [-.9], seam: .03, open: true, col: skin(YW + 2.49, YW + 1.0, YW + 1.2), mat: MAT.man, x: .2, capCol: C.panel
  });
  ntWindow(m, { ax: "z", at: -1.4, out: -1 }, -2.9, YW + 1.4, 1.1, YW + 2.15, 1, 2.0, .45, .08);
  L.halos.push({ p: T.at([-.9, YW + 1.8, -1.8]), c: C.cold, k: .12, s: 1.6 });
  /* the radome and the tank */
  addTube(m, { path: [[6.4, DY, .4], [6.4, DY + 1.0, .4]], rad: .8, sides: 12, col: C.panelB, mat: MAT.man, x: .2 });
  addBlob(m, { c: [6.4, DY + 2.3, .4], r: [1.6, 1.6, 1.6], sub: 2, col: (u) => v3.mul(C.white, .9 + .1 * Math.sin(u[1] * 9) * Math.sin(u[0] * 9)), mat: MAT.man, x: .25 });
  addTube(m, { path: [[-8.9, DY, -.6], [-8.9, DY + 2.5, -.6]], rad: .95, sides: 14, col: (t) => t > .62 && t < .76 ? C.belt : C.panelB, mat: MAT.man, x: .25, cap: true });
  /* the mast stands on the tank, at the end that is clear of the tree: its light is seen against the hill */
  addTube(m, { path: [[-8.9, DY + 2.5, -.6], [-8.9, DY + 8.0, -.6]], rad: .06, sides: 6, col: C.steel, mat: MAT.man, x: .3 });
  addBlob(m, { c: [-8.9, DY + 8.2, -.6], r: [.22, .26, .22], sub: 1, col: C.red, mat: MAT.glow, glow: 9 });
  L.halos.push({ p: T.at([-8.9, DY + 8.2, -.6]), c: C.red, k: .2, s: .6 });
  /* the pier and its lamp: the lamp is seen against the dark wall, not against the pale dome */
  const PX0 = -1.9, PX1 = -.3;
  ntBox(m, [PX0, DY - .95, -13], [PX1, DY - .8, -3.6], (n) => n[1] > .5 ? C.steel : C.leg, MAT.man, .2);
  for (let z = -12.6; z < -4; z += 2.8) for (const x of [PX0 + .15, PX1 - .15]) addTube(m, { path: [[x, -2.2, z], [x, DY - .9, z]], rad: .09, sides: 6, col: C.leg, mat: MAT.man, x: .2 });
  for (const x of [PX0 + .05, PX1 - .05]) {
    addTube(m, { path: [[x, DY + .2, -12.95], [x, DY + .2, -3.6]], rad: .03, sides: 4, col: C.steel, mat: MAT.man, x: .3 });
    for (let z = -12.9; z < -3.7; z += 1.55) addTube(m, { path: [[x, DY - .8, z], [x, DY + .2, z]], rad: .025, sides: 4, col: C.steel, mat: MAT.man, x: .3 });
  }
  const LX = PX1 - .05, LP = [LX, DY + 3.1, -12.7];
  addTube(m, { path: [[LX, DY - .8, -12.9], [LX, DY + 3.0, -12.9], [LX, DY + 3.25, -12.7]], rad: .05, sides: 6, col: C.leg, mat: MAT.man, x: .3 });
  addBlob(m, { c: LP, r: [.2, .22, .2], sub: 1, col: C.cold, mat: MAT.glow, glow: 16 });
  L.points.push({ p: T.at(LP), r: 16, c: C.cold, k: 2.4, even: .3 });
  L.halos.push({ p: T.at(LP), c: C.cold, k: .6, s: .9 });
  return m;
}
