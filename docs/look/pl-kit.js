"use strict";
/* Planet look-dev stand — the kit: one mesh format and a handful of body generators.
   Vertex: position 3, normal 3, colour 3 (linear albedo), material, wind, glow, extra = 13 floats. */
const MAT = { ground: 0, rock: 1, leaf: 2, bark: 3, man: 4, glow: 5, water: 6, grass: 7, beast: 8, far: 9 };
const VSTRIDE = 13;

function hex(s) {
  const n = parseInt(s.slice(1), 16), f = v => Math.pow(v / 255, 2.2);
  return [f(n >> 16 & 255), f(n >> 8 & 255), f(n & 255)];
}

class Mesh {
  constructor(cap) { cap = cap || 1 << 14; this.v = new Float32Array(cap * VSTRIDE); this.i = new Uint32Array(cap * 3); this.nv = 0; this.ni = 0; }
  vert(p, n, c, mat, wind, glow, x) {
    if ((this.nv + 1) * VSTRIDE > this.v.length) { const b = new Float32Array(this.v.length * 2); b.set(this.v); this.v = b; }
    const o = this.nv * VSTRIDE, v = this.v;
    v[o] = p[0]; v[o + 1] = p[1]; v[o + 2] = p[2]; v[o + 3] = n[0]; v[o + 4] = n[1]; v[o + 5] = n[2];
    v[o + 6] = c[0]; v[o + 7] = c[1]; v[o + 8] = c[2]; v[o + 9] = mat; v[o + 10] = wind || 0; v[o + 11] = glow || 0; v[o + 12] = x || 0;
    return this.nv++;
  }
  tri(a, b, c) {
    if (this.ni + 3 > this.i.length) { const b2 = new Uint32Array(this.i.length * 2); b2.set(this.i); this.i = b2; }
    this.i[this.ni++] = a; this.i[this.ni++] = b; this.i[this.ni++] = c;
  }
  quad(a, b, c, d) { this.tri(a, b, c); this.tri(a, c, d); }
  /* copy another mesh in, turned about y, scaled and moved */
  add(src, pos, yaw, scale) {
    const base = this.nv, s = scale == null ? 1 : scale, c = Math.cos(yaw || 0), sn = Math.sin(yaw || 0), v = src.v;
    for (let k = 0; k < src.nv; k++) {
      const o = k * VSTRIDE, x = v[o] * s, y = v[o + 1] * s, z = v[o + 2] * s, nx = v[o + 3], ny = v[o + 4], nz = v[o + 5];
      this.vert([x * c + z * sn + pos[0], y + pos[1], -x * sn + z * c + pos[2]], [nx * c + nz * sn, ny, -nx * sn + nz * c],
        [v[o + 6], v[o + 7], v[o + 8]], v[o + 9], v[o + 10] * s, v[o + 11], v[o + 12]);
    }
    for (let k = 0; k < src.ni; k++) { if (this.ni + 1 > this.i.length) { const b2 = new Uint32Array(this.i.length * 2); b2.set(this.i); this.i = b2; } this.i[this.ni++] = src.i[k] + base; }
  }
  done() { return { v: this.v.slice(0, this.nv * VSTRIDE), i: this.i.slice(0, this.ni), nv: this.nv, ni: this.ni }; }
}

const ICO = {};
function icoMesh(sub) {
  if (ICO[sub]) return ICO[sub];
  const t = (1 + Math.sqrt(5)) / 2;
  const p = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(v3.norm);
  let f = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
  [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  for (let s = 0; s < sub; s++) {
    const cache = new Map(), nf = [];
    const mid = (a, b) => {
      const k = a < b ? a * 65536 + b : b * 65536 + a; let m = cache.get(k);
      if (m === undefined) { m = p.length; p.push(v3.norm(v3.add(p[a], p[b]))); cache.set(k, m); }
      return m;
    };
    for (const [a, b, c] of f) { const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a); nf.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); }
    f = nf;
  }
  return ICO[sub] = { p, f };
}

/* A swollen body: an icosphere pushed by noise, squared off if asked, scaled, turned and placed.
   o: c centre, r [rx,ry,rz], sub, bump, bumpF, seed, yaw, lean (about z), pitch (about x), box (superquadric power, <1 is boxy),
      col (u,p,n)→rgb or rgb, mat, wind (p)→w or number, glow, x, nc (centre the normals swell from), ncK, cut (drop what is below this local y) */
function addBlob(m, o) {
  const g = icoMesh(o.sub == null ? 2 : o.sub), r = o.r, e = o.box || 1, P = [], N = [], sd = o.seed || 0, bf = o.bumpF || 1.6;
  for (const u of g.p) {
    let q = u;
    if (e !== 1) q = [Math.sign(u[0]) * Math.pow(Math.abs(u[0]), e), Math.sign(u[1]) * Math.pow(Math.abs(u[1]), e), Math.sign(u[2]) * Math.pow(Math.abs(u[2]), e)];
    let b = 1;
    if (o.bump) b = 1 + o.bump * (gnoise(u[0] * bf + sd * .37, u[1] * bf + u[2] * bf * .7, sd) + gnoise(u[2] * bf - sd * .11, u[1] * bf * .8 + 3.1, sd + 5)) * .5;
    let l = [q[0] * r[0] * b, q[1] * r[1] * b, q[2] * r[2] * b];
    if (o.cut != null && l[1] < o.cut) l[1] = o.cut + (l[1] - o.cut) * .12;
    if (o.pitch) l = rotX(l, o.pitch);
    if (o.lean) l = rotZ(l, o.lean);
    if (o.yaw) l = rotY(l, o.yaw);
    P.push(v3.add(l, o.c)); N.push([0, 0, 0]);
  }
  for (const [a, b, c] of g.f) {
    const n = v3.cross(v3.sub(P[b], P[a]), v3.sub(P[c], P[a]));
    for (const k of [a, b, c]) { N[k][0] += n[0]; N[k][1] += n[1]; N[k][2] += n[2]; }
  }
  const base = m.nv;
  for (let k = 0; k < P.length; k++) {
    let n = v3.norm(N[k]);
    /* icosphere faces wind outward in a right-handed frame; make the normal point away from the centre */
    if (v3.dot(n, v3.sub(P[k], o.c)) < 0) n = v3.mul(n, -1);
    if (o.nc) n = v3.norm(v3.lerp(n, v3.norm(v3.sub(P[k], o.nc)), o.ncK == null ? .6 : o.ncK));
    const col = typeof o.col === "function" ? o.col(g.p[k], P[k], n) : o.col;
    const w = typeof o.wind === "function" ? o.wind(P[k]) : (o.wind || 0);
    m.vert(P[k], n, col, o.mat, w, o.glow || 0, typeof o.x === "function" ? o.x(g.p[k], P[k], n) : (o.x || 0));
  }
  for (const [a, b, c] of g.f) m.tri(base + a, base + b, base + c);
}

/* A tube along a path. o: path [[x,y,z]…], rad number | (t)→r, sides, col (t,a,p)→rgb or rgb, mat, wind (t,p)→w,
   flat (scale of the second axis of the section), up (where the first axis of the section looks), cap, glow, x */
function addTube(m, o) {
  const path = o.path, n = path.length, sides = o.sides || 8, rings = [];
  let nrm = null;
  for (let k = 0; k < n; k++) {
    const t = n > 1 ? k / (n - 1) : 0;
    const tan = v3.norm(v3.sub(path[Math.min(k + 1, n - 1)], path[Math.max(k - 1, 0)]));
    let a = nrm || o.up || (Math.abs(tan[1]) > .9 ? [0, 0, 1] : [0, 1, 0]);
    a = v3.norm(v3.sub(a, v3.mul(tan, v3.dot(a, tan)))); nrm = a;
    const b = v3.cross(tan, a), rad = typeof o.rad === "function" ? o.rad(t) : o.rad, ring = [];
    for (let s = 0; s < sides; s++) {
      const ang = s / sides * TAU, ca = Math.cos(ang), sa = Math.sin(ang) * (o.flat == null ? 1 : o.flat);
      const d = [a[0] * ca + b[0] * sa, a[1] * ca + b[1] * sa, a[2] * ca + b[2] * sa];
      const p = [path[k][0] + d[0] * rad, path[k][1] + d[1] * rad, path[k][2] + d[2] * rad];
      /* the normal of a flattened section leans towards its flat side */
      const nn = v3.norm([a[0] * ca * (o.flat == null ? 1 : o.flat) + b[0] * Math.sin(ang), a[1] * ca * (o.flat == null ? 1 : o.flat) + b[1] * Math.sin(ang), a[2] * ca * (o.flat == null ? 1 : o.flat) + b[2] * Math.sin(ang)]);
      const col = typeof o.col === "function" ? o.col(t, ang, p) : o.col;
      const w = typeof o.wind === "function" ? o.wind(t, p) : (o.wind || 0);
      ring.push(m.vert(p, nn, col, o.mat, w, o.glow || 0, typeof o.x === "function" ? o.x(t, ang, p) : (o.x || 0)));
    }
    rings.push(ring);
  }
  for (let k = 0; k + 1 < n; k++) for (let s = 0; s < sides; s++) {
    const s2 = (s + 1) % sides;
    m.quad(rings[k][s], rings[k][s2], rings[k + 1][s2], rings[k + 1][s]);
  }
  if (o.cap) for (const [k, dir] of [[0, -1], [n - 1, 1]]) {
    const tan = v3.mul(v3.norm(v3.sub(path[Math.min(k + 1, n - 1)], path[Math.max(k - 1, 0)])), dir);
    const col = typeof o.col === "function" ? o.col(k ? 1 : 0, 0, path[k]) : o.col;
    const c = m.vert(path[k], tan, col, o.mat, typeof o.wind === "function" ? o.wind(k ? 1 : 0, path[k]) : (o.wind || 0), o.glow || 0, o.x && typeof o.x !== "function" ? o.x : 0);
    for (let s = 0; s < sides; s++) m.tri(c, rings[k][s], rings[k][(s + 1) % sides]);
  }
}

/* A hull lofted along local x. st: [{x, ry, rz, y}], section is an ellipse with a flatter belly.
   col (t, s, p)→rgb where s = sin of the section angle (−1 belly … +1 back), x likewise */
function addLoft(m, o) {
  const st = o.st, sides = o.sides || 24, rings = [];
  for (let k = 0; k < st.length; k++) {
    const S = st[k], t = k / (st.length - 1), ring = [];
    for (let s = 0; s < sides; s++) {
      const a = s / sides * TAU, sa = Math.sin(a), ca = Math.cos(a);
      const belly = sa < 0 ? (o.belly == null ? .8 : o.belly) : 1;
      const p = [S.x, S.y + S.ry * sa * belly, S.rz * ca];
      ring.push({ p, s: sa, c: ca, t });
    }
    rings.push(ring);
  }
  const ids = rings.map((ring, k) => ring.map((q, s) => {
    const kp = Math.min(k + 1, st.length - 1), km = Math.max(k - 1, 0), sp = (s + 1) % sides, sm = (s + sides - 1) % sides;
    const du = v3.sub(rings[kp][s].p, rings[km][s].p), dv = v3.sub(ring[sp].p, ring[sm].p);
    let n = v3.norm(v3.cross(du, dv));
    const out = [0, q.p[1] - st[k].y, q.p[2]];
    if (v3.dot(n, out) < 0) n = v3.mul(n, -1);
    const col = typeof o.col === "function" ? o.col(q.t, q.s, q.p, q.c) : o.col;
    return m.vert(q.p, n, col, o.mat, 0, typeof o.glow === "function" ? o.glow(q.t, q.s, q.p, q.c) : (o.glow || 0), typeof o.x === "function" ? o.x(q.t, q.s, q.p, q.c) : (o.x || 0));
  }));
  for (let k = 0; k + 1 < st.length; k++) for (let s = 0; s < sides; s++) {
    const s2 = (s + 1) % sides;
    m.quad(ids[k][s], ids[k][s2], ids[k + 1][s2], ids[k + 1][s]);
  }
  for (const k of [0, st.length - 1]) {
    const c = m.vert([st[k].x, st[k].y, 0], [k ? 1 : -1, 0, 0], typeof o.col === "function" ? o.col(k ? 1 : 0, 0, [st[k].x, st[k].y, 0], 0) : o.col, o.mat, 0, 0, 0);
    for (let s = 0; s < sides; s++) m.tri(c, ids[k][s], ids[k][(s + 1) % sides]);
  }
}

/* a flat card standing on a point: two triangles, normal given */
function addQuad(m, a, b, c, d, n, col, mat, wind, glow, x) {
  const w = wind || [0, 0, 0, 0];
  const ia = m.vert(a, n, col, mat, w[0], glow || 0, x || 0), ib = m.vert(b, n, col, mat, w[1], glow || 0, x || 0),
    ic = m.vert(c, n, col, mat, w[2], glow || 0, x || 0), id = m.vert(d, n, col, mat, w[3], glow || 0, x || 0);
  m.quad(ia, ib, ic, id);
}

/* quadratic bezier as a path */
function bez(a, b, c, n) {
  const out = [];
  for (let k = 0; k <= n; k++) { const t = k / n, u = 1 - t; out.push([u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], u * u * a[1] + 2 * u * t * b[1] + t * t * c[1], u * u * a[2] + 2 * u * t * b[2] + t * t * c[2]]); }
  return out;
}
