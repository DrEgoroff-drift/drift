"use strict";
/* Planet look-dev stand — shaders. One light, one air, one sky for every body in the frame.
   COMMON is shared by the scene module and the post module. */
const WGSL_COMMON = /* wgsl */`
struct Globals {
  viewProj: mat4x4f,
  invViewProj: mat4x4f,
  lightVP0: mat4x4f,
  lightVP1: mat4x4f,
  camPos: vec4f,      // xyz, time
  sunDir: vec4f,      // xyz, water level
  sunCol: vec4f,      // rgb, exposure
  screen: vec4f,      // w, h, 1/w, 1/h
  hero: vec4f,        // x, z, r1, r2
  misc: vec4f,        // clip y, clip on, shadow bias 0, shadow bias 1
  lampPos: array<vec4f, 4>,   // xyz, reach
  lampCol: array<vec4f, 4>,   // rgb, power
};
@group(0) @binding(0) var<uniform> g: Globals;

const PI = 3.14159265;

fn hashu(x: u32) -> u32 {
  var v = x;
  v ^= v >> 16u; v *= 0x7feb352du; v ^= v >> 15u; v *= 0x846ca68bu; v ^= v >> 16u;
  return v;
}
fn hash2(p: vec2i, s: u32) -> f32 {
  let h = hashu(u32(p.x) * 374761393u + u32(p.y) * 668265263u + s * 1274126177u);
  return f32(h >> 8u) / 16777216.0;
}
fn hash4(p: vec2i, s: u32) -> vec4f {
  let h = hashu(u32(p.x) * 374761393u + u32(p.y) * 668265263u + s * 1274126177u);
  let h2 = hashu(h + 0x9e3779b9u); let h3 = hashu(h2 + 0x9e3779b9u); let h4 = hashu(h3 + 0x9e3779b9u);
  return vec4f(f32(h >> 8u), f32(h2 >> 8u), f32(h3 >> 8u), f32(h4 >> 8u)) / 16777216.0;
}
fn vnoise(p: vec2f, s: u32) -> f32 {
  let i = floor(p); let f = p - i;
  let u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  let ii = vec2i(i);
  let a = hash2(ii, s); let b = hash2(ii + vec2i(1, 0), s);
  let c = hash2(ii + vec2i(0, 1), s); let d = hash2(ii + vec2i(1, 1), s);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
fn fbm(p: vec2f, s: u32) -> f32 {
  var v = 0.0; var a = 0.5; var q = p;
  for (var i = 0u; i < 4u; i++) { v += a * vnoise(q, s + i * 17u); q = q * 2.03 + vec2f(11.3, 7.7); a *= 0.5; }
  return v / 0.9375;
}
fn ign(p: vec2f) -> f32 { return fract(52.9829189 * fract(dot(p, vec2f(0.06711056, 0.00583715)))); }

/* ── the sky ── */
/* how close a bearing is to the bearing of the sun: warm lives on that side only */
fn sunSide(rd: vec3f) -> f32 {
  let a = normalize(rd.xz + vec2f(0.00001, 0.0)); let b = normalize(g.sunDir.xz);
  return pow(clamp(dot(a, b) * 0.5 + 0.5, 0.0, 1.0), 5.0);
}
fn horizonCol(rd: vec3f) -> vec3f {
  return mix(vec3f(0.62, 0.78, 0.95), vec3f(1.00, 0.89, 0.72), sunSide(rd));
}
fn skyBase(rd: vec3f) -> vec3f {
  let el = asin(clamp(rd.y, -1.0, 1.0));
  let t = pow(smoothstep(0.0, 0.24, el), 0.7);
  let zen = mix(vec3f(0.13, 0.33, 0.78), vec3f(0.26, 0.48, 0.84), sunSide(rd));
  var c = mix(horizonCol(rd), zen, t);
  let cs = max(dot(rd, normalize(g.sunDir.xyz)), 0.0);
  c += vec3f(1.0, 0.85, 0.6) * (pow(cs, 6.0) * 0.18 + pow(cs, 60.0) * 1.2);
  return c;
}
/* the day moon hangs between the peak and the far sign */
fn moonOver(rd: vec3f, sky: vec3f) -> vec3f {
  let az = -2.6 * PI / 180.0; let el = 7.63 * PI / 180.0; let r = 1.5 * PI / 180.0;
  let md = vec3f(sin(az) * cos(el), sin(el), cos(az) * cos(el));
  let right = normalize(cross(vec3f(0.0, 1.0, 0.0), md));
  let up = cross(md, right);
  let q = vec2f(dot(rd, right), dot(rd, up)) / r;
  let d2 = dot(q, q);
  if (d2 > 1.0) { return sky; }
  let n = q.x * right + q.y * up - sqrt(1.0 - d2) * md;
  let l = smoothstep(-0.05, 0.30, dot(n, normalize(g.sunDir.xyz)));
  let sea = 1.0 - 0.30 * smoothstep(0.45, 0.62, fbm(q * 2.3 + 7.0, 31u));
  let edge = smoothstep(1.0, 0.90, d2);
  return sky + vec3f(0.80, 0.86, 0.95) * (sea * 0.55 * l * edge);
}
/* one bank of cumulus: cells along the azimuth, a flat base, puffs heaped on it.
   returns light −1…1, cover 0…1, the height of the winning puff, the base of its cloud */
fn cloudBank(az: f32, el: f32, cw: f32, e0: f32, e1: f32, cover: f32, sd: u32, lc: vec3f) -> vec4f {
  var best = -1.0; var light = 0.0; var cov = 0.0; var baseEl = 0.0;
  let ci = i32(floor(az / cw));
  for (var dc = -1; dc <= 1; dc++) {
    let h = hash4(vec2i(ci + dc, 0), sd);
    if (h.x > cover) { continue; }
    let cx = (f32(ci + dc) + 0.5 + (h.y - 0.5) * 0.5) * cw;
    let eb = mix(e0, e1, h.z);
    let wd = cw * 0.62 * mix(0.55, 1.0, h.w);
    for (var k = 0; k < 9; k++) {
      let hk = hash4(vec2i(ci + dc, k + 1), sd + 7u);
      let u = (f32(k) + 0.5) / 9.0 * 2.0 - 1.0 + (hk.z - 0.5) * 0.15;
      let r = wd * (0.20 + 0.26 * (1.0 - u * u)) * (0.75 + 0.5 * hk.x);
      let c = vec2f(cx + u * wd * 0.78, eb + r * (0.35 + 0.75 * hk.y * (1.0 - 0.5 * u * u)));
      let d = (vec2f(az, el) - c) / vec2f(r * 1.2, r);
      let q = 1.0 - dot(d, d);
      if (q > 0.0) {
        let z = sqrt(q);
        if (z * r > best) {
          best = z * r;
          light = dot(normalize(vec3f(d.x, d.y, -z * 0.9)), lc);
          baseEl = eb;
        }
        cov = max(cov, smoothstep(0.0, 0.25, q));
      }
    }
  }
  return vec4f(light, cov, best, baseEl);
}
/* one cumulus where the frame wants it: c the middle of its base (azimuth, elevation), w its half-width.
   A row of puffs on the base and a second tier heaped over the middle. */
fn cloudOne(az: f32, el: f32, c: vec2f, w: f32, sd: u32, lc: vec3f, acc: vec4f) -> vec4f {
  var o = acc;
  if (abs(az - c.x) > w * 1.5 || el < c.y - w * 0.2 || el > c.y + w * 2.6) { return o; }
  for (var k = 0; k < 16; k++) {
    let hk = hash4(vec2i(k, 77), sd);
    var u = (f32(k) + 0.5) / 10.0 * 2.0 - 1.0 + (hk.z - 0.5) * 0.12;
    var lift = 0.30 + 0.8 * hk.y * (1.0 - 0.6 * u * u);
    var rk = 0.22 + 0.30 * (1.0 - u * u);
    if (k >= 10) {
      u = ((f32(k - 10) + 0.5) / 6.0 * 2.0 - 1.0) * 0.55 + (hk.z - 0.5) * 0.2;
      lift = 1.35 + 1.1 * hk.y * (1.0 - u * u);
      rk = 0.30 + 0.16 * (1.0 - u * u);
    }
    let r = w * rk * (0.7 + 0.6 * hk.x);
    let pc = vec2f(c.x + u * w * 0.85, c.y + r * lift);
    let d = (vec2f(az, el) - pc) / vec2f(r * 1.25, r);
    let q = 1.0 - dot(d, d);
    if (q > 0.0) {
      let z = sqrt(q);
      if (z * r > o.z) {
        o.z = z * r;
        /* the heap is lit as one body, and every puff only models its surface: the underside of an
           upper puff does not draw a dark seam over the puffs below */
        let gq = (vec2f(az, el) - vec2f(c.x, c.y + w * 0.8)) / vec2f(w * 1.3, w * 1.15);
        let gn = vec3f(gq.x, gq.y, -sqrt(max(0.08, 1.0 - dot(gq, gq))));
        let pn = vec3f(d.x, max(d.y, -0.35), -z * 0.9);
        o.x = dot(normalize(normalize(pn) * 0.5 + normalize(gn) * 0.5), lc);
        o.w = c.y;
      }
      o.y = max(o.y, smoothstep(0.0, 0.25, q));
    }
  }
  return o;
}
fn skyCol(rd: vec3f) -> vec3f {
  var c = moonOver(rd, skyBase(rd));
  let az = atan2(rd.x, rd.z); let el = asin(clamp(rd.y, -1.0, 1.0));
  if (el > 0.0) {
    let t = g.camPos.w;
    let wa = vec2f(fbm(vec2f(az * 38.0, el * 60.0), 11u), fbm(vec2f(az * 38.0 + 9.7, el * 60.0 + 3.1), 12u)) - 0.5;
    let wb = vec2f(fbm(vec2f(az * 150.0, el * 220.0), 13u), fbm(vec2f(az * 150.0 + 4.1, el * 220.0 + 8.3), 14u)) - 0.5;
    let a2 = az + wa.x * 0.012 + wb.x * 0.003 + t * 0.0004;
    let e2 = el + wa.y * 0.008 + wb.y * 0.002;
    let ci = smoothstep(0.5, 0.8, fbm(vec2f(az * 5.0 + 5.0 + t * 0.002, el * 55.0), 41u)) * smoothstep(0.07, 0.15, el) * 0.20;
    c = mix(c, vec3f(1.0, 0.98, 0.95), ci);
    let lc = normalize(vec3f(-0.75, 0.5, 0.35));
    let hz = horizonCol(rd);
    let warm = sunSide(rd);
    /* the far bank low over the land; the sky of the valley stays clean for the far sign */
    var b = cloudBank(a2, e2, 0.055, 0.014, 0.034, 0.5, 3u, lc);
    if (b.y > 0.0) {
      let l = smoothstep(-0.35, 0.55, b.x);
      var cc = mix(vec3f(0.58, 0.66, 0.86), vec3f(1.0, 0.95, 0.86) * 1.15, l);
      cc = mix(cc, hz, 0.45);
      let gap = 1.0 - exp(-pow((az - 0.0873) / 0.085, 2.0));
      c = mix(c, cc, b.y * smoothstep(b.w - 0.002, b.w + 0.003, e2) * 0.9 * gap);
    }
    /* the clouds of this frame, placed: a tower on the right behind the near tree, a heap behind the
       shoulder of the peak, a small one low in the middle */
    var h = vec4f(0.0, 0.0, -1.0, 0.0);
    h = cloudOne(a2, e2, vec2f(0.318, 0.050), 0.115, 21u, lc, h);
    h = cloudOne(a2, e2, vec2f(-0.300, 0.058), 0.085, 22u, lc, h);
    h = cloudOne(a2, e2, vec2f(-0.078, 0.060), 0.034, 23u, lc, h);
    h = cloudOne(a2, e2, vec2f(0.150, 0.118), 0.030, 24u, lc, h);
    /* two high ones that only the tall frame sees; the thread of the far sign runs between them */
    h = cloudOne(a2, e2, vec2f(-0.090, 0.235), 0.095, 25u, lc, h);
    h = cloudOne(a2, e2, vec2f(0.195, 0.400), 0.060, 26u, lc, h);
    if (h.y > 0.0) {
      let l = smoothstep(-0.35, 0.55, h.x);
      let dark = mix(vec3f(0.50, 0.58, 0.82), vec3f(0.70, 0.62, 0.70), warm);
      var cc = mix(dark, vec3f(1.0, 0.96, 0.88) * 1.28, l);
      cc *= mix(0.80, 1.0, smoothstep(h.w, h.w + 0.03, e2));
      cc = mix(cc, hz, exp(-e2 / 0.045) * 0.55);
      c = mix(c, cc, h.y * smoothstep(h.w - 0.003, h.w + 0.004, e2));
    }
  }
  return c;
}

/* ── the air ── */
fn fogAmount(dist: f32, yAvg: f32) -> f32 {
  let od = pow(dist / 1938.0, 0.713) * exp(-clamp(yAvg, 0.0, 300.0) * 0.003);
  return min(1.0 - exp(-od), 0.92);
}
/* the colour of the air: bluer and darker than the sky at the horizon, so every far flat stands as a
   shape against the sky instead of melting into it; greenish close to the ground nearby */
fn airCol(rd: vec3f, dist: f32) -> vec3f {
  let far = mix(vec3f(0.50, 0.66, 0.92), vec3f(0.95, 0.80, 0.66), sunSide(rd) * 0.8);
  return mix(far * vec3f(0.80, 0.98, 0.95), far, smoothstep(150.0, 1500.0, dist));
}
fn applyFog(col: vec3f, wpos: vec3f, cap: f32) -> vec3f {
  let d = wpos - g.camPos.xyz; let dist = length(d); let rd = d / dist;
  let f = fogAmount(dist, 0.5 * (wpos.y + g.camPos.y)) * cap;
  return mix(col, airCol(rd, dist), f);
}
/* shadows of clouds on the land; the ship and the man stand in a pool of light */
fn cloudLight(p: vec3f) -> f32 {
  let t = g.camPos.w;
  let l = normalize(g.sunDir.xyz);
  let q = p.xz - l.xz * (p.y / l.y);
  let n = fbm(vec2f(q.x * 0.0045 + t * 0.006, q.y * 0.0085 + 3.7), 7u);
  var c = mix(0.34, 1.0, smoothstep(0.43, 0.60, n));
  /* planes part by light: a shadow lies in the hollow behind the far shore and on the foot of the hills,
     their crests stand in the sun; the same again between the ridge and the mountains */
  let e = (fbm(vec2f(q.x * 0.012 + 2.0, q.y * 0.02), 19u) - 0.5) * 70.0;
  let band = smoothstep(190.0, 235.0, q.y + e) * (1.0 - smoothstep(300.0, 345.0, q.y + e));
  let band2 = smoothstep(1250.0, 1500.0, q.y + e * 6.0) * (1.0 - smoothstep(2500.0, 3000.0, q.y + e * 6.0));
  c = min(c, 1.0 - 0.62 * max(band, band2 * 0.8));
  let d = length((q - g.hero.xy) * vec2f(1.0, 1.7));
  c = max(c, 1.0 - smoothstep(g.hero.z, g.hero.w, d));
  return c;
}
/* the near slope stands in shade, as if under crowns behind the lens: the dark wing of the stage.
   The shade has the outline of crowns, and the sun falls through them in spots. */
fn nearShadeZ(z: f32) -> f32 { return mix(0.26, 1.0, smoothstep(-16.0, -3.0, z)); }
fn nearShade(p: vec3f) -> f32 {
  let n = fbm(p.xz * 0.09 + vec2f(3.1, 7.7), 23u) - 0.5;
  let e = p.z + n * 13.0;
  var s = smoothstep(-12.5, -6.5, e);
  let d1 = fbm(p.xz * vec2f(0.50, 0.75) + vec2f(9.0, 2.0), 29u);
  let d2 = fbm(p.xz * vec2f(1.6, 2.2) + vec2f(1.0, 5.0), 37u);
  let dap = smoothstep(0.50, 0.62, d1 * 0.72 + d2 * 0.28);
  s = max(s, dap * 0.85 * smoothstep(-24.0, -9.0, e));
  /* and the shade throws a few fingers forward into the light */
  let fin = smoothstep(0.60, 0.70, fbm(p.xz * vec2f(0.34, 0.5) + vec2f(4.0, 8.0), 43u));
  s *= 1.0 - 0.55 * fin * (1.0 - smoothstep(-8.0, -3.5, e));
  return mix(0.26, 1.0, s);
}
`;

const WGSL_SCENE = WGSL_COMMON + /* wgsl */`
struct Blobs { n: vec4f, b: array<vec4f, 64> };
@group(0) @binding(1) var shadowTex: texture_depth_2d_array;
@group(0) @binding(2) var shadowSamp: sampler_comparison;
@group(0) @binding(3) var reflTex: texture_2d<f32>;
@group(0) @binding(4) var linSamp: sampler;
@group(0) @binding(5) var<uniform> blobs: Blobs;

struct VOut {
  @builtin(position) pos: vec4f,
  @location(0) wpos: vec3f,
  @location(1) nrm: vec3f,
  @location(2) col: vec3f,
  @location(3) par: vec4f,    // material, wind, glow, extra
};
struct FOut { @builtin(position) pos: vec4f, @location(0) uv: vec2f };

fn windAt(p: vec3f, amp: f32) -> vec3f {
  let t = g.camPos.w;
  let gust = sin(t * 0.7 + p.x * 0.05 + p.z * 0.03) * 0.5 + 0.5;
  let a = sin(t * 1.7 + p.x * 0.45 + p.z * 0.31) * 0.6 + sin(t * 3.1 + p.x * 1.3 + p.z * 0.9) * 0.25;
  return vec3f(amp * (0.5 + gust) * (0.4 + a * 0.6), 0.0, amp * a * 0.25);
}

@vertex fn vs_main(@location(0) pos: vec3f, @location(1) nrm: vec3f, @location(2) col: vec3f, @location(3) par: vec4f) -> VOut {
  var o: VOut;
  let p = pos + windAt(pos, par.y);
  o.pos = g.viewProj * vec4f(p, 1.0);
  o.wpos = p; o.nrm = nrm; o.col = col; o.par = par;
  return o;
}
@vertex fn vs_shadow(@location(0) pos: vec3f, @location(3) par: vec4f) -> @builtin(position) vec4f {
  return g.lightVP0 * vec4f(pos + windAt(pos, par.y), 1.0);
}
@vertex fn vs_full(@builtin(vertex_index) i: u32) -> FOut {
  var o: FOut;
  let p = vec2f(f32((i << 1u) & 2u), f32(i & 2u));
  o.pos = vec4f(p * 2.0 - 1.0, 0.0, 1.0);
  o.uv = vec2f(p.x, 1.0 - p.y);
  return o;
}

fn shadowTap(uv: vec2f, layer: i32, z: f32, rad: f32, rot: f32) -> f32 {
  var s = textureSampleCompareLevel(shadowTex, shadowSamp, uv, layer, z);
  for (var i = 0; i < 8; i++) {
    let a = f32(i) * 2.39996 + rot;
    let r = rad * sqrt((f32(i) + 0.5) / 8.0);
    s += textureSampleCompareLevel(shadowTex, shadowSamp, uv + vec2f(cos(a), sin(a)) * r, layer, z);
  }
  return s / 9.0;
}
fn shadowAt(wpos: vec3f, n: vec3f, fragXY: vec2f) -> f32 {
  let p = wpos + n * 0.05;
  let rot = ign(fragXY) * 6.2831853;
  var lp = g.lightVP0 * vec4f(p, 1.0);
  var uv = lp.xy * vec2f(0.5, -0.5) + 0.5;
  if (uv.x > 0.004 && uv.x < 0.996 && uv.y > 0.004 && uv.y < 0.996 && lp.z > 0.0 && lp.z < 1.0) {
    return shadowTap(uv, 0, lp.z - g.misc.z, 3.0 / 4096.0, rot);
  }
  lp = g.lightVP1 * vec4f(p, 1.0);
  uv = lp.xy * vec2f(0.5, -0.5) + 0.5;
  if (uv.x > 0.004 && uv.x < 0.996 && uv.y > 0.004 && uv.y < 0.996 && lp.z > 0.0 && lp.z < 1.0) {
    return shadowTap(uv, 1, lp.z - g.misc.w, 1.6 / 4096.0, rot);
  }
  return 1.0;
}

@fragment fn fs_sky(in: FOut) -> @location(0) vec4f {
  let ndc = vec2f(in.uv.x * 2.0 - 1.0, 1.0 - in.uv.y * 2.0);
  let pn = g.invViewProj * vec4f(ndc, 1.0, 1.0);
  let rd = normalize(pn.xyz / pn.w - g.camPos.xyz);
  return vec4f(skyCol(rd), 1.0);
}

@fragment fn fs_main(in: VOut) -> @location(0) vec4f {
  let fx = dpdx(in.wpos); let fy = dpdy(in.wpos);
  if (g.misc.y > 0.5 && in.wpos.y < g.misc.x) { discard; }
  let mat = i32(round(in.par.x));
  let glow = in.par.z; let ex = in.par.w;
  if (mat == 5) { return vec4f(applyFog(in.col * glow, in.wpos, 0.9), 1.0); }
  let V = normalize(g.camPos.xyz - in.wpos);
  let L = normalize(g.sunDir.xyz);
  let dist = length(g.camPos.xyz - in.wpos);
  var N = normalize(in.nrm);
  if (mat == 1) {
    var fN = normalize(cross(fx, fy));
    if (dot(fN, V) < 0.0) { fN = -fN; }
    N = normalize(mix(N, fN, 0.7));
  }
  var alb = in.col;
  /* on the ground the glow slot carries how much of it is stone, and nothing on the ground shines */
  var stone = 0.0; var emis = glow;
  if (mat == 0) {
    stone = glow; emis = 0.0;
    /* the land is laid with a brush: broad strokes along the lane and a fine grain close by */
    let near = 1.0 - smoothstep(60.0, 220.0, dist);
    let mid = 1.0 - smoothstep(400.0, 1200.0, dist);
    let s1 = fbm(in.wpos.xz * vec2f(0.045, 0.11) + vec2f(17.0, 3.0), 51u) - 0.5;
    let s2 = fbm(in.wpos.xz * vec2f(0.55, 1.2) + vec2f(5.0, 9.0), 53u) - 0.5;
    alb *= 1.0 + s1 * 0.30 * mid + s2 * 0.20 * near;
    if (stone > 0.0) {
      var fN = normalize(cross(fx, fy));
      if (dot(fN, V) < 0.0) { fN = -fN; }
      N = normalize(mix(N, fN, 0.55 * stone));
    }
  }
  let ndl = dot(N, L);
  /* the wing stands a few metres from the lens, where a texel of the far map is a palm wide: it takes none */
  var sh = 1.0;
  if (g.misc.y > -0.5) { sh = shadowAt(in.wpos, N, in.pos.xy); }
  let cl = cloudLight(in.wpos);
  let fg = nearShade(in.wpos);
  var lit = smoothstep(-0.02, 0.30, ndl);
  var ao = 1.0;
  var through = 0.0;
  if (mat == 0) { ao = ex; lit = smoothstep(mix(-0.10, 0.0, stone), mix(0.45, 0.24, stone), ndl); }
  if (mat == 7) { ao = mix(0.45, 1.0, smoothstep(0.0, 0.7, ex)); }
  if (mat == 0 || mat == 7) {
    let nb = i32(blobs.n.x);
    for (var i = 0; i < nb; i++) {
      let b = blobs.b[i];
      let d = length(in.wpos.xz - b.xy) / b.z;
      ao *= 1.0 - b.w * (1.0 - smoothstep(0.2, 1.0, d));
    }
  }
  if (mat == 2) {
    /* a crown is a body: its top takes the sun, its underside keeps the shade, and the light comes
       through only along its rim */
    lit = smoothstep(-0.25, 0.45, ndl);
    let edge = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.0);
    through = clamp(0.25 - ndl * 0.8, 0.0, 1.0) * (0.12 + 0.55 * edge);
    ao = mix(0.55, 1.0, smoothstep(-0.7, 0.3, N.y));
  }
  if (mat == 7) {
    lit = smoothstep(-0.4, 0.45, ndl);
    through = pow(clamp(dot(-V, L), 0.0, 1.0), 2.0) * 0.7 * ex;
  }
  let sun = g.sunCol.rgb * (sh * cl * fg);
  let skyAmb = vec3f(0.40, 0.55, 0.82) * 0.55;
  let gndAmb = vec3f(0.40, 0.44, 0.22) * 0.40;
  let amb = mix(gndAmb, skyAmb, N.y * 0.5 + 0.5) * ao * mix(0.55, 1.0, fg);
  var c = alb * (sun * lit * mix(1.0, ao, 0.6) + amb);
  c += alb * vec3f(1.2, 1.1, 0.4) * sun * through;
  if (mat == 1 || mat == 3 || mat == 4 || mat == 8 || mat == 9) {
    /* the light comes from behind: a body is drawn by its lit rim */
    var rk = 0.30; var rp = 3.0;
    if (mat == 4 || mat == 8) { rk = 0.75; rp = 2.2; }
    if (mat == 3 || mat == 1) { rk = 0.60; rp = 2.4; }
    let rim = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), rp) * smoothstep(-0.4, 0.4, ndl);
    c += sun * rim * rk * mix(alb, vec3f(1.0), 0.4);
    /* the lit grass throws its light back on what stands in it */
    if (mat == 3 || mat == 1) {
      c += alb * vec3f(0.42, 0.50, 0.20) * (cl * fg * 0.45 * (1.0 - N.y * 0.5));
    }
  }
  if (mat == 4) {
    let hv = normalize(L + V);
    c += sun * pow(clamp(dot(N, hv), 0.0, 1.0), 60.0) * ex * lit * 1.5;
    let rv = reflect(-V, N);
    let fr = 0.05 + 0.95 * pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 4.0);
    c += skyBase(normalize(vec3f(rv.x, abs(rv.y) + 0.02, rv.z))) * (ex * fr * 0.5 * mix(0.55, 1.0, fg));
  }
  for (var i = 0; i < 4; i++) {
    let lp = g.lampPos[i]; let lc = g.lampCol[i];
    if (lc.w <= 0.0) { continue; }
    let d = lp.xyz - in.wpos; let dl = length(d);
    let att = pow(clamp(1.0 - dl / lp.w, 0.0, 1.0), 2.0);
    let nl = clamp(dot(N, d / dl) * 0.7 + 0.3, 0.0, 1.0);
    c += alb * lc.rgb * (lc.w * att * nl);
  }
  c += alb * emis;
  var cap = 1.0;
  if (mat == 9) { cap = 0.93; }
  return vec4f(applyFog(c, in.wpos, cap), 1.0);
}

@fragment fn fs_water(in: VOut) -> @location(0) vec4f {
  let depth = in.par.w;
  let t = g.camPos.w;
  let V = normalize(g.camPos.xyz - in.wpos);
  let p = in.wpos.xz;
  let n1 = vnoise(vec2f(p.x * 0.30 + t * 0.25, p.y * 1.5 - t * 0.15), 3u) - 0.5;
  let n2 = vnoise(vec2f(p.x * 0.85 - t * 0.20, p.y * 3.9 + t * 0.30), 5u) - 0.5;
  let calm = smoothstep(0.35, 0.65, fbm(vec2f(p.x * 0.02 + 1.0, p.y * 0.06 + t * 0.01), 9u));
  let rip = mix(0.35, 1.0, calm);
  let N = normalize(vec3f((n1 + n2 * 0.5) * 0.10 * rip, 1.0, (n1 * 0.5 + n2) * 0.16 * rip));
  let uv = in.pos.xy * g.screen.zw + vec2f((n1 + n2) * 0.004, (n1 + n2 * 0.6) * 0.030) * rip;
  let refl = textureSampleLevel(reflTex, linSamp, clamp(uv, vec2f(0.002), vec2f(0.998)), 0.0).rgb;
  let nv = clamp(dot(N, V), 0.0, 1.0);
  let fr = 0.04 + 0.96 * pow(1.0 - nv, 5.0);
  let cl = cloudLight(in.wpos);
  let deep = smoothstep(0.0, 2.2, depth);
  var body = mix(vec3f(0.10, 0.30, 0.30), vec3f(0.02, 0.10, 0.17), deep);
  body *= g.sunCol.rgb * (0.55 * cl) + vec3f(0.40, 0.55, 0.82) * 0.5;
  var c = mix(body, refl * vec3f(0.84, 0.90, 0.92), clamp(fr * 1.05, 0.0, 1.0));
  // the wet line along the shore
  c = mix(c, vec3f(0.85, 0.92, 0.95) * (0.4 + 0.6 * cl), (1.0 - smoothstep(0.02, 0.16, depth)) * 0.35);
  let alpha = smoothstep(-0.03, 0.30, depth);
  return vec4f(applyFog(c, in.wpos, 1.0), alpha);
}
`;

const WGSL_POST = WGSL_COMMON + /* wgsl */`
struct PostP { a: vec4f, b: vec4f };
@group(0) @binding(1) var<uniform> pp: PostP;
@group(0) @binding(2) var texA: texture_2d<f32>;
@group(0) @binding(3) var texB: texture_2d<f32>;
@group(0) @binding(4) var texC: texture_2d<f32>;
@group(0) @binding(5) var texD: texture_2d<f32>;
@group(0) @binding(6) var samp: sampler;
@group(0) @binding(7) var depthTex: texture_depth_2d;
@group(0) @binding(8) var shadowTex: texture_depth_2d_array;
@group(0) @binding(9) var shadowSamp: sampler_comparison;

struct FOut { @builtin(position) pos: vec4f, @location(0) uv: vec2f };
@vertex fn vs_full(@builtin(vertex_index) i: u32) -> FOut {
  var o: FOut;
  let p = vec2f(f32((i << 1u) & 2u), f32(i & 2u));
  o.pos = vec4f(p * 2.0 - 1.0, 0.0, 1.0);
  o.uv = vec2f(p.x, 1.0 - p.y);
  return o;
}

/* a = (step.x, step.y, 0, 0) in uv */
@fragment fn fs_blur(in: FOut) -> @location(0) vec4f {
  let d = pp.a.xy;
  var c = textureSampleLevel(texA, samp, in.uv, 0.0) * 0.227027;
  c += (textureSampleLevel(texA, samp, in.uv + d * 1.3846154, 0.0) + textureSampleLevel(texA, samp, in.uv - d * 1.3846154, 0.0)) * 0.3162162;
  c += (textureSampleLevel(texA, samp, in.uv + d * 3.2307692, 0.0) + textureSampleLevel(texA, samp, in.uv - d * 3.2307692, 0.0)) * 0.0702703;
  return c;
}

/* bloom: a = (texel.x, texel.y of the source, 0, 0) */
@fragment fn fs_down(in: FOut) -> @location(0) vec4f {
  let d = pp.a.xy;
  var c = textureSampleLevel(texA, samp, in.uv, 0.0) * 4.0;
  c += textureSampleLevel(texA, samp, in.uv + vec2f(-d.x, -d.y), 0.0);
  c += textureSampleLevel(texA, samp, in.uv + vec2f(d.x, -d.y), 0.0);
  c += textureSampleLevel(texA, samp, in.uv + vec2f(-d.x, d.y), 0.0);
  c += textureSampleLevel(texA, samp, in.uv + vec2f(d.x, d.y), 0.0);
  return vec4f(min(c.rgb / 8.0, vec3f(24.0)), 1.0);
}
/* texA the smaller level, texB the level of this size */
@fragment fn fs_up(in: FOut) -> @location(0) vec4f {
  let d = pp.a.xy;
  var c = textureSampleLevel(texA, samp, in.uv, 0.0) * 4.0;
  c += (textureSampleLevel(texA, samp, in.uv + vec2f(-d.x, 0.0), 0.0) + textureSampleLevel(texA, samp, in.uv + vec2f(d.x, 0.0), 0.0)
      + textureSampleLevel(texA, samp, in.uv + vec2f(0.0, -d.y), 0.0) + textureSampleLevel(texA, samp, in.uv + vec2f(0.0, d.y), 0.0)) * 2.0;
  c += textureSampleLevel(texA, samp, in.uv + vec2f(-d.x, -d.y), 0.0) + textureSampleLevel(texA, samp, in.uv + vec2f(d.x, -d.y), 0.0)
      + textureSampleLevel(texA, samp, in.uv + vec2f(-d.x, d.y), 0.0) + textureSampleLevel(texA, samp, in.uv + vec2f(d.x, d.y), 0.0);
  let lo = c.rgb / 16.0;
  let hi = textureSampleLevel(texB, samp, in.uv, 0.0).rgb;
  return vec4f(mix(hi, lo, pp.a.z), 1.0);
}

/* light through the air: marched through the shadow of things and of clouds, and counted against the mean
   light of the air, so that beams and the dusk between them both show and no veil is laid over the frame.
   a = (strength, reach, the mean, the floor) */
@fragment fn fs_shafts(in: FOut) -> @location(0) vec4f {
  let dim = vec2f(textureDimensions(depthTex));
  let px = vec2i(clamp(in.uv * dim, vec2f(0.0), dim - 1.0));
  let dz = textureLoad(depthTex, px, 0);
  let ndc = vec2f(in.uv.x * 2.0 - 1.0, 1.0 - in.uv.y * 2.0);
  let pn = g.invViewProj * vec4f(ndc, 1.0, 1.0);
  let rd = normalize(pn.xyz / pn.w - g.camPos.xyz);
  var dist = pp.a.y;
  if (dz > 0.0) {
    let pw = g.invViewProj * vec4f(ndc, dz, 1.0);
    dist = min(length(pw.xyz / pw.w - g.camPos.xyz), pp.a.y);
  }
  let L = normalize(g.sunDir.xyz);
  let jit = ign(in.pos.xy);
  var acc = 0.0;
  let n = 32;
  for (var i = 0; i < n; i++) {
    let s = (f32(i) + jit) / f32(n);
    let tt = dist * s * s;
    let wgt = dist * 2.0 * s / f32(n);
    let p = g.camPos.xyz + rd * tt;
    var l = cloudLight(p) * nearShadeZ(p.z);
    let lp = g.lightVP1 * vec4f(p, 1.0);
    let uv = lp.xy * vec2f(0.5, -0.5) + 0.5;
    if (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0 && lp.z > 0.0 && lp.z < 1.0) {
      l *= textureSampleCompareLevel(shadowTex, shadowSamp, uv, 1, lp.z - g.misc.w);
    }
    let dens = exp(-max(p.y, 0.0) * 0.010) * exp(-tt * 0.0012);
    acc += (l - pp.a.z) * dens * wgt;
  }
  let cs = dot(rd, L);
  let ph = 0.35 + 1.4 * pow(max(cs, 0.0), 4.0) + 0.25 * cs * cs;
  let v = max(acc * ph * pp.a.x, pp.a.w);
  return vec4f(g.sunCol.rgb * vec3f(1.0, 0.93, 0.78) * v, 1.0);
}

fn neutral(cin: vec3f) -> vec3f {
  let startC = 0.8 - 0.04; let desat = 0.15;
  let x = min(cin.r, min(cin.g, cin.b));
  var off = 0.04;
  if (x < 0.08) { off = x - 6.25 * x * x; }
  var c = cin - off;
  let peak = max(c.r, max(c.g, c.b));
  if (peak < startC) { return c; }
  let d = 1.0 - startC;
  let newPeak = 1.0 - d * d / (peak + d - startC);
  c *= newPeak / peak;
  let k = 1.0 - 1.0 / (desat * (peak - newPeak) + 1.0);
  return mix(c, vec3f(newPeak), k);
}

/* texA the frame, texB bloom, texC shafts, texD the wing (premultiplied). a = (bloom, vignette, grade, grain) */
@fragment fn fs_comp(in: FOut) -> @location(0) vec4f {
  var c = textureSampleLevel(texA, samp, in.uv, 0.0).rgb;
  c = max(c + textureSampleLevel(texC, samp, in.uv, 0.0).rgb, vec3f(0.0));
  let w = textureSampleLevel(texD, samp, in.uv, 0.0);
  c = c * (1.0 - clamp(w.a, 0.0, 1.0)) + w.rgb;
  c = mix(c, textureSampleLevel(texB, samp, in.uv, 0.0).rgb, pp.a.x);
  c *= g.sunCol.w;
  let q = in.uv - 0.5;
  c *= 1.0 - dot(q, q) * pp.a.y;
  c = neutral(max(c, vec3f(0.0)));
  let lum = dot(c, vec3f(0.2126, 0.7152, 0.0722));
  c = mix(vec3f(lum), c, 1.0 + 0.08 * pp.a.z);
  c = mix(c, c * vec3f(1.03, 1.0, 0.95), smoothstep(0.3, 0.9, lum) * pp.a.z);
  c = mix(c, c * vec3f(0.94, 0.98, 1.08) + vec3f(0.004, 0.006, 0.012), (1.0 - smoothstep(0.0, 0.35, lum)) * pp.a.z);
  c = pow(max(c, vec3f(0.0)), vec3f(1.0 / 2.2));
  c += (ign(in.pos.xy + vec2f(g.camPos.w * 61.0, 0.0)) - 0.5) * pp.a.w;
  return vec4f(c, 1.0);
}
`;
