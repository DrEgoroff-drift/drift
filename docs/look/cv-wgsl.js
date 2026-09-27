"use strict";
/* Cave look-dev stand — shaders. Underground the key light is the lamp of the man: a cone with a real shadow.
   The day comes down the shafts as a second light with its own shadow; what glows by itself is small and
   takes no shadow. The air holds the light: the cone of the lamp and the beams of the day are seen in it.
   Values go in bands: the face of the cut is the darkest, then the unlit void, then far halls in haze, then
   what the lamp reaches, then the lights themselves. */
const cvF = (v) => Number(v).toFixed(4);
const CV_WGSL_COMMON = /* wgsl */`
struct Globals {
  viewProj: mat4x4f,
  invViewProj: mat4x4f,
  lampVP: mat4x4f,
  sunVP: mat4x4f,
  camPos: vec4f,      // xyz, time
  lampPos: vec4f,     // xyz, the length the light halves over
  lampDir: vec4f,     // xyz, cos of the outer angle
  lampCol: vec4f,     // rgb, cos of the inner angle
  sunDir: vec4f,      // xyz towards the light, water level
  sunCol: vec4f,      // rgb, exposure
  screen: vec4f,      // w, h, 1/w, 1/h
  misc: vec4f,        // clip y, 1 the mirror / -1 the wing, z of the cut, density of the haze
  amb: vec4f,         // rgb, thickness of a bed
  fogCol: vec4f,      // rgb, bias of the day's shadow
  ptPos: array<vec4f, 12>,    // xyz, reach
  ptCol: array<vec4f, 12>,    // rgb
  glowPos: array<vec4f, 6>,   // xyz, strength of the halo
  glowCol: array<vec4f, 6>,   // rgb, how wide the halo is
};
@group(0) @binding(0) var<uniform> g: Globals;

const PI = 3.14159265;
const TAU = 6.2831853;

fn hashu(x: u32) -> u32 {
  var v = x;
  v ^= v >> 16u; v *= 0x7feb352du; v ^= v >> 15u; v *= 0x846ca68bu; v ^= v >> 16u;
  return v;
}
fn hash2(p: vec2i, s: u32) -> f32 {
  let h = hashu(u32(p.x) * 374761393u + u32(p.y) * 668265263u + s * 1274126177u);
  return f32(h >> 8u) / 16777216.0;
}
fn hash3(p: vec3i, s: u32) -> f32 {
  let h = hashu(u32(p.x) * 374761393u + u32(p.y) * 668265263u + u32(p.z) * 1440662683u + s * 1274126177u);
  return f32(h >> 8u) / 16777216.0;
}
fn vnoise(p: vec2f, s: u32) -> f32 {
  let i = floor(p); let f = p - i;
  let u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  let ii = vec2i(i);
  let a = hash2(ii, s); let b = hash2(ii + vec2i(1, 0), s);
  let c = hash2(ii + vec2i(0, 1), s); let d = hash2(ii + vec2i(1, 1), s);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
fn vn3(p: vec3f, s: u32) -> f32 {
  let i = floor(p); let f = p - i;
  let u = f * f * (3.0 - 2.0 * f);
  let ii = vec3i(i);
  let a = mix(hash3(ii, s), hash3(ii + vec3i(1, 0, 0), s), u.x);
  let b = mix(hash3(ii + vec3i(0, 1, 0), s), hash3(ii + vec3i(1, 1, 0), s), u.x);
  let c = mix(hash3(ii + vec3i(0, 0, 1), s), hash3(ii + vec3i(1, 0, 1), s), u.x);
  let d = mix(hash3(ii + vec3i(0, 1, 1), s), hash3(ii + vec3i(1, 1, 1), s), u.x);
  return mix(mix(a, b, u.y), mix(c, d, u.y), u.z);
}
fn ign(p: vec2f) -> f32 { return fract(52.9829189 * fract(dot(p, vec2f(0.06711056, 0.00583715)))); }

/* the lamp at a point: the way to it and how much of its light comes here (the cone and the distance) */
fn lampAt(p: vec3f) -> vec4f {
  let d = g.lampPos.xyz - p; let dl = max(length(d), 0.001); let L = d / dl;
  let cs = dot(-L, g.lampDir.xyz);
  let cone = smoothstep(g.lampDir.w, g.lampCol.w, cs);
  /* the lamp has its reach: past it the hall belongs to other lights */
  let att = pow(1.0 + dl / g.lampPos.w, -1.6) * (1.0 - smoothstep(${cvF(CV_LAMP.near)}, ${cvF(CV_LAMP.reach)}, dl));
  let hot = 1.0 + 0.7 * smoothstep(0.86, 1.0, cs);
  return vec4f(L, cone * att * hot);
}
/* the face of the cut and what is drawn on it go dark towards the edges of the frame: the stage is in the middle */
fn faceDim(fragXY: vec2f) -> f32 {
  let q = (fragXY * g.screen.zw - 0.5) * vec2f(1.0, 0.85);
  return mix(1.0, 0.55, smoothstep(0.22, 0.62, length(q)));
}
/* haze: the farther behind the cut, the more of the colour of the dark air */
fn haze(c: vec3f, wpos: vec3f, cap: f32) -> vec3f {
  let d = max(wpos.z - g.misc.z, 0.0);
  return mix(c, g.fogCol.rgb, (1.0 - exp(-d * g.misc.w)) * cap);
}
/* The day lives in the shafts only. A ray of the day keeps its place in the plan taken at the height the
   shafts are given at (cv-rock.js, cvShaftX); shaftOf says how far that place lies from the axis of the nearer
   shaft, in radii of the shaft. A map of shadows leaks in the thin gaps between the beds: the mask does not */
fn dayPlan(p: vec3f) -> vec2f {
  let k = ${cvF(CVP.y0)} - p.y;
  return vec2f(p.x - ${cvF(CVP.lean[0])} * k, p.z + ${cvF(CVP.lean[1])} * k);
}
fn shaftOf(o: vec2f) -> f32 {
  let a = length((o - vec2f(${cvF(CVP.mouth[0])}, ${cvF(CVP.mouth[1])})) / vec2f(${cvF(CVP.r1[0])}, ${cvF(CVP.r1[1])}));
  let b = length(o - vec2f(${cvF(CVP.sky2[0])}, ${cvF(CVP.sky2[1])})) / ${cvF(CVP.r2)};
  return min(a, b);
}
/* the day is brightest where it lands: towards the top of the frame it is held back, or the eye leaves by the corner */
fn dayTop(y: f32) -> f32 { return mix(1.0, 0.42, smoothstep(6.5, 13.0, y)); }
fn dayMask(p: vec3f) -> f32 { return (1.0 - smoothstep(1.25, 1.7, shaftOf(dayPlan(p)))) * dayTop(p.y); }
`;

const CV_WGSL_SCENE = CV_WGSL_COMMON + /* wgsl */`
@group(0) @binding(1) var lampTex: texture_depth_2d;
@group(0) @binding(2) var sunTex: texture_depth_2d;
@group(0) @binding(3) var cmpSamp: sampler_comparison;
@group(0) @binding(4) var reflTex: texture_2d<f32>;
@group(0) @binding(5) var linSamp: sampler;

struct VOut {
  @builtin(position) pos: vec4f,
  @location(0) wpos: vec3f,
  @location(1) nrm: vec3f,
  @location(2) col: vec3f,
  @location(3) par: vec4f,    // material, wind, glow, extra
};

/* a draught from the mouth stirs what grows on the heap */
fn windAt(p: vec3f, amp: f32) -> vec3f {
  let t = g.camPos.w;
  let a = sin(t * 1.3 + p.x * 0.45 + p.z * 0.31) * 0.6 + sin(t * 2.7 + p.x * 1.3 + p.z * 0.9) * 0.25;
  return vec3f(amp * (0.25 + a * 0.35), 0.0, amp * a * 0.15);
}

@vertex fn vs_main(@location(0) pos: vec3f, @location(1) nrm: vec3f, @location(2) col: vec3f, @location(3) par: vec4f) -> VOut {
  var o: VOut;
  let p = pos + windAt(pos, par.y);
  o.pos = g.viewProj * vec4f(p, 1.0);
  o.wpos = p; o.nrm = nrm; o.col = col; o.par = par;
  return o;
}
/* the matrix of the light whose map is drawn sits in the slot of the lamp */
@vertex fn vs_shadow(@location(0) pos: vec3f, @location(3) par: vec4f) -> @builtin(position) vec4f {
  return g.lampVP * vec4f(pos + windAt(pos, par.y), 1.0);
}

fn tap9(t: texture_depth_2d, uv: vec2f, z: f32, rad: f32, rot: f32) -> f32 {
  var s = textureSampleCompareLevel(t, cmpSamp, uv, z);
  for (var i = 0; i < 8; i++) {
    let a = f32(i) * 2.39996 + rot;
    let r = rad * sqrt((f32(i) + 0.5) / 8.0);
    s += textureSampleCompareLevel(t, cmpSamp, uv + vec2f(cos(a), sin(a)) * r, z);
  }
  return s / 9.0;
}
fn lampShade(wpos: vec3f, n: vec3f, fragXY: vec2f) -> f32 {
  let dl = length(wpos - g.lampPos.xyz);
  let p = wpos + n * (0.02 + dl * 0.003);
  let lp = g.lampVP * vec4f(p, 1.0);
  if (lp.w <= 0.05) { return 0.0; }
  let q = lp.xyz / lp.w;
  let uv = q.xy * vec2f(0.5, -0.5) + 0.5;
  if (uv.x < 0.002 || uv.x > 0.998 || uv.y < 0.002 || uv.y > 0.998) { return 0.0; }
  return tap9(lampTex, uv, q.z - 0.004 / (lp.w * lp.w), 3.0 / 4096.0, ign(fragXY) * TAU);
}
fn sunShade(wpos: vec3f, n: vec3f, fragXY: vec2f) -> f32 {
  let p = wpos + n * 0.05;
  let lp = g.sunVP * vec4f(p, 1.0);
  let uv = lp.xy * vec2f(0.5, -0.5) + 0.5;
  if (uv.x < 0.002 || uv.x > 0.998 || uv.y < 0.002 || uv.y > 0.998 || lp.z <= 0.0 || lp.z >= 1.0) { return 0.0; }
  return tap9(sunTex, uv, lp.z - g.fogCol.w, 2.5 / 4096.0, ign(fragXY) * TAU + 1.3);
}
/* the bed a point lies in: the same line the rock is built by (cv-rock.js, cvStrat) */
fn strat(p: vec3f) -> f32 {
  let s = p.y - 0.06 * p.x + 0.25 * sin(p.x * 0.09 + p.z * 0.05);
  return (s + 0.28 * sin(s * 1.9 + 0.7)) / g.amb.w;
}
/* lights without shadows */
fn points(wpos: vec3f, N: vec3f, even: f32) -> vec3f {
  var c = vec3f(0.0);
  for (var i = 0; i < 12; i++) {
    let lp = g.ptPos[i];
    if (lp.w <= 0.0) { continue; }
    let d = lp.xyz - wpos; let dl = max(length(d), 0.001);
    let att = pow(clamp(1.0 - dl / lp.w, 0.0, 1.0), 2.0);
    let nl = mix(clamp(dot(N, d / dl) * 0.7 + 0.3, 0.0, 1.0), 1.0, even);
    c += g.ptCol[i].rgb * (att * nl);
  }
  return c;
}

@fragment fn fs_main(in: VOut) -> @location(0) vec4f {
  let fx = dpdx(in.wpos); let fy = dpdy(in.wpos);
  if (g.misc.y > 0.5 && in.wpos.y < g.misc.x) { discard; }
  let mat = i32(round(in.par.x));
  let glow = in.par.z; let ex = in.par.w;
  let V = normalize(g.camPos.xyz - in.wpos);
  var fN = normalize(cross(fx, fy));
  if (dot(fN, V) < 0.0) { fN = -fN; }
  if (mat == 5) {
    var c5 = in.col * glow;
    if (in.wpos.z < g.misc.z) { c5 *= faceDim(in.pos.xy); }
    return vec4f(haze(c5, in.wpos, 0.7), 1.0);
  }
  if (mat == 12) {
    /* a crystal shines from within: its faces differ, its edges burn */
    let fac = 0.40 + 0.60 * clamp(dot(fN, normalize(vec3f(-0.35, 0.8, -0.5))), 0.0, 1.0);
    let rim = pow(1.0 - clamp(dot(fN, V), 0.0, 1.0), 2.0);
    return vec4f(haze(in.col * glow * (fac + rim * 0.9), in.wpos, 0.55), 1.0);
  }
  let wingless = g.misc.y > -0.5;
  if (mat == 10) {
    /* the face of the cut: beds and their laminae drawn on the dark, and a rim that takes the light of the void */
    let b = strat(in.wpos); let f = fract(b);
    let n1 = vn3(in.wpos * vec3f(0.9, 2.2, 0.9), 71u);
    let n2 = vn3(in.wpos * vec3f(0.23, 0.6, 0.23) + 5.0, 73u);
    let ln = 1.0 - smoothstep(0.0, 0.035 + 0.03 * n1, min(f, 1.0 - f));
    let lam = fract(b * 5.0 + n2 * 1.5);
    let l2 = (1.0 - smoothstep(0.0, 0.10, min(lam, 1.0 - lam))) * smoothstep(0.35, 0.6, n2);
    let n3 = vn3(in.wpos * vec3f(3.1, 7.0, 3.1), 75u);
    var c = in.col * (0.72 + 0.4 * n2 + 0.16 * n3);
    /* over the beds lies the earth the roots come from: warm, with small stones, without beds */
    let soil = smoothstep(13.7, 14.5, in.wpos.y + 0.8 * (n2 - 0.5) + 0.35 * sin(in.wpos.x * 0.35));
    c *= 1.0 - 0.6 * ln * (1.0 - soil);
    c += in.col * 0.35 * l2 * (1.0 - soil);
    let grit = vn3(in.wpos * vec3f(2.3, 2.3, 1.0), 77u);
    c = mix(c, vec3f(0.0085, 0.0062, 0.0048) * (0.7 + 0.6 * n3) + vec3f(0.012, 0.011, 0.010) * smoothstep(0.7, 0.78, grit), soil);
    /* the light of the void on the stone about it: a wash that dies in a few metres, and the rim of the cut,
       which burns. The light is asked for inside the void, past the rim; the extra slot holds how far that is */
    let nl = length(in.nrm);
    let Ni = in.nrm / max(nl, 0.0001);
    let sure = smoothstep(0.45, 0.95, nl);
    let lip = pow(1.0 - smoothstep(0.0, 0.5, ex), 2.0);
    let wash = pow(1.0 - smoothstep(0.0, 3.6, ex), 2.0) * sure;
    c *= faceDim(in.pos.xy);
    if (wash + lip > 0.002) {
      let Nr = normalize(Ni + vec3f(0.0, 0.0, -0.6));
      let q = in.wpos + Ni * (ex + 0.22) + vec3f(0.0, 0.0, 0.30);
      var light = g.amb.rgb * 1.5;
      let ll = lampAt(q);
      light += g.lampCol.rgb * (ll.w * clamp(dot(Nr, ll.xyz) * 0.6 + 0.4, 0.0, 1.0) * lampShade(q, Nr, in.pos.xy));
      let dm = dayMask(q);
      if (dm > 0.001) { light += g.sunCol.rgb * (dm * clamp(dot(Nr, normalize(g.sunDir.xyz)) * 0.6 + 0.4, 0.0, 1.0) * sunShade(q, Nr, in.pos.xy)); }
      light += points(q, Nr, 0.3);
      c += vec3f(0.34, 0.31, 0.27) * light * (lip * 0.9 + wash * 0.10);
      c += in.col * light * (wash * 0.7);
    }
    return vec4f(c, 1.0);
  }
  var N = normalize(in.nrm);
  if ((mat == 7 || mat == 2 || mat == 15) && dot(N, V) < 0.0) { N = -N; }
  var alb = in.col; var ao = 1.0; var wet = 0.0; var emis = 0.0; var wrap = 0.0;
  if (mat == 1) {
    ao = ex; wet = glow;
    N = normalize(mix(N, fN, 0.4));
    let n1 = vn3(in.wpos * 1.3, 3u); let n2 = vn3(in.wpos * 4.7, 5u); let n3 = vn3(in.wpos * 14.0, 7u);
    alb *= 0.76 + 0.26 * n1 + 0.14 * n2 + 0.10 * n3;
    let b = strat(in.wpos); let f = fract(b);
    let wall = 1.0 - smoothstep(0.5, 0.9, abs(N.y));
    let ln = 1.0 - smoothstep(0.0, 0.05, min(f, 1.0 - f));
    let lam = fract(b * 5.0 + n1 * 1.2);
    let l2 = 1.0 - smoothstep(0.0, 0.14, min(lam, 1.0 - lam));
    alb *= 1.0 - (ln * 0.4 + l2 * 0.07) * wall;
  }
  if (mat == 11) {
    ao = ex; wet = glow; wrap = 0.45;
    alb *= 0.85 + 0.3 * vn3(in.wpos * vec3f(3.0, 0.7, 3.0), 9u);
    alb *= mix(0.5, 1.0, smoothstep(0.0, 0.5, in.wpos.y - g.sunDir.w));
  }
  if (mat == 15) {
    /* a curtain: a thin sheet, the light comes through it */
    ao = ex; wet = glow; wrap = 0.5;
    alb *= 0.9 + 0.2 * vn3(in.wpos * vec3f(2.0, 5.0, 2.0), 11u);
  }
  if (mat == 4) { wet = ex; }
  if (mat == 7) { ao = mix(0.5, 1.0, smoothstep(0.0, 0.7, ex)); emis = glow; }
  if (mat == 2) { emis = glow; }

  var c = alb * g.amb.rgb * (ao * mix(0.6, 1.25, N.y * 0.5 + 0.5));
  if (wingless) {
    let ll = lampAt(in.wpos);
    if (ll.w > 0.0005) {
      let ndl = dot(N, ll.xyz);
      var lit = smoothstep(-0.08 - wrap, 0.5, ndl);
      if (mat == 7 || mat == 2) { lit = smoothstep(-0.5, 0.5, ndl); }
      let e = g.lampCol.rgb * (ll.w * lampShade(in.wpos, N, in.pos.xy));
      c += alb * e * (lit * mix(1.0, ao, 0.6));
      let hv = normalize(ll.xyz + V);
      c += e * (pow(clamp(dot(N, hv), 0.0, 1.0), mix(18.0, 80.0, wet)) * wet * lit * 0.9);
      if (mat == 7) { c += alb * vec3f(1.2, 1.1, 0.4) * e * (pow(clamp(dot(-V, ll.xyz), 0.0, 1.0), 2.0) * 0.6 * ex); }
      if (mat == 4) { c += e * (pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.5) * smoothstep(-0.4, 0.4, ndl) * 0.5); }
      if (mat == 15) { c += alb * vec3f(1.25, 0.8, 0.45) * e * (clamp(-ndl, 0.0, 1.0) * 0.7 + 0.12); }
      /* dripstone lets the light into its edges */
      if (mat == 11) { c += alb * e * (pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.0) * 0.35 * smoothstep(-0.6, 0.2, ndl)); }
    }
    let Ls = normalize(g.sunDir.xyz);
    let dm = dayMask(in.wpos);
    var ss = 0.0;
    if (dm > 0.001) { ss = dm * sunShade(in.wpos, N, in.pos.xy); }
    if (ss > 0.0) {
      let nds = dot(N, Ls);
      var lit = smoothstep(-0.05, 0.4, nds);
      if (mat == 7 || mat == 2) { lit = smoothstep(-0.5, 0.45, nds); }
      let e = g.sunCol.rgb * ss;
      c += alb * e * (lit * mix(1.0, ao, 0.5));
      if (mat == 7) { c += alb * vec3f(1.2, 1.1, 0.4) * e * (0.35 * ex); }
      if (mat == 2) { c += alb * vec3f(1.1, 1.2, 0.5) * e * (clamp(-nds, 0.0, 1.0) * 0.5); }
      let hv = normalize(Ls + V);
      c += e * (pow(clamp(dot(N, hv), 0.0, 1.0), mix(18.0, 80.0, wet)) * wet * lit * 0.5);
    }
  }
  var pk = 1.0; var even = 0.0;
  if (mat == 4) { pk = 2.6; }
  if (mat == 11 || mat == 15) { even = 0.35; }
  c += alb * points(in.wpos, N, even) * (pk * mix(0.5, 1.0, ao));
  c += alb * emis;
  return vec4f(haze(c, in.wpos, 1.0), 1.0);
}

@fragment fn fs_water(in: VOut) -> @location(0) vec4f {
  let mat = i32(round(in.par.x));
  let V = normalize(g.camPos.xyz - in.wpos);
  let t = g.camPos.w;
  /* the light that reaches this place, whatever way the water faces */
  var light = g.amb.rgb * 2.0 + points(in.wpos, vec3f(0.0, 1.0, 0.0), 1.0) * 0.6;
  let up = vec3f(0.0, 1.0, 0.0);
  let ll = lampAt(in.wpos);
  light += g.lampCol.rgb * (ll.w * lampShade(in.wpos + vec3f(0.0, 0.06, 0.0), up, in.pos.xy) * 0.5);
  if (mat == 14) {
    /* the body of the water where the cut goes through it */
    let d = in.par.w;
    /* the light goes down into it in slow blades and dies with the depth */
    let s1 = vnoise(vec2f(in.wpos.x * 1.7 + d * 0.30 + t * 0.03, 0.5), 47u);
    let s2 = vnoise(vec2f(in.wpos.x * 4.3 - d * 0.20 - t * 0.05, 1.5), 49u);
    let blade = pow(s1 * 0.7 + s2 * 0.3, 3.0) * exp(-d * 0.8);
    let body = mix(vec3f(0.11, 0.37, 0.36), vec3f(0.008, 0.04, 0.075), smoothstep(0.0, 2.6, d));
    var c = body * light * (1.0 + 2.4 * blade) + vec3f(0.002, 0.006, 0.009);
    c += vec3f(0.6, 0.8, 0.82) * light * ((1.0 - smoothstep(0.0, 0.05, d)) * 0.8);
    return vec4f(c, mix(0.60, 0.95, smoothstep(0.0, 2.0, d)));
  }
  let depth = in.par.w;
  let p = in.wpos.xz;
  let n1 = vnoise(vec2f(p.x * 0.9 + t * 0.10, p.y * 2.6 - t * 0.06), 3u) - 0.5;
  let n2 = vnoise(vec2f(p.x * 2.3 - t * 0.08, p.y * 6.0 + t * 0.12), 5u) - 0.5;
  /* rings where drops fall from the teeth of the vault */
  var ring = vec2f(0.0);
  for (var i = 0; i < 4; i++) {
    let h = vec2f(hash2(vec2i(i, 3), 91u), hash2(vec2i(i, 5), 93u));
    let c0 = vec2f(7.5 + h.x * 11.0, 1.0 + h.y * 14.0);
    let dv = p - c0; let r = max(length(dv), 0.001);
    let ph = fract(t * 0.17 + f32(i) * 0.31);
    let w = sin((r - ph * 3.2) * 11.0) * exp(-r * 0.8) * (1.0 - smoothstep(ph * 3.2 - 0.2, ph * 3.2 + 0.5, r)) * (1.0 - ph);
    ring += dv / r * w;
  }
  let N = normalize(vec3f((n1 + n2 * 0.5) * 0.02 + ring.x * 0.05, 1.0, (n1 * 0.5 + n2) * 0.035 + ring.y * 0.05));
  let uv = in.pos.xy * g.screen.zw + vec2f(N.x * 0.08, N.z * 0.30);
  let refl = textureSampleLevel(reflTex, linSamp, clamp(uv, vec2f(0.002), vec2f(0.998)), 0.0).rgb;
  let nv = clamp(dot(N, V), 0.0, 1.0);
  let fr = 0.04 + 0.96 * pow(1.0 - nv, 5.0);
  let deep = smoothstep(0.0, 1.6, depth);
  let body = mix(vec3f(0.10, 0.30, 0.28), vec3f(0.015, 0.07, 0.10), deep) * light;
  var c = mix(body, refl * vec3f(0.86, 0.93, 0.95), clamp(fr * 1.15, 0.0, 1.0));
  c = mix(c, vec3f(0.7, 0.85, 0.85) * light, (1.0 - smoothstep(0.02, 0.12, depth)) * 0.3);
  let alpha = smoothstep(-0.03, 0.22, depth) * mix(0.72, 1.0, max(fr, deep));
  return vec4f(haze(c, in.wpos, 1.0), alpha);
}
`;

const CV_WGSL_POST = CV_WGSL_COMMON + /* wgsl */`
struct PostP { a: vec4f, b: vec4f };
@group(0) @binding(1) var<uniform> pp: PostP;
@group(0) @binding(2) var texA: texture_2d<f32>;
@group(0) @binding(3) var texB: texture_2d<f32>;
@group(0) @binding(4) var texC: texture_2d<f32>;
@group(0) @binding(5) var texD: texture_2d<f32>;
@group(0) @binding(6) var samp: sampler;
@group(0) @binding(7) var depthTex: texture_depth_2d;
@group(0) @binding(8) var lampTex: texture_depth_2d;
@group(0) @binding(9) var sunTex: texture_depth_2d;
@group(0) @binding(10) var cmpSamp: sampler_comparison;

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

/* the light the air holds: marched from the cut to the first body through the shadow of the lamp and the
   shadow of the day. a = (the lamp, the day, halos, 0), b = (reach, 0, 0, 0) */
@fragment fn fs_air(in: FOut) -> @location(0) vec4f {
  let dim = vec2f(textureDimensions(depthTex));
  let px = vec2i(clamp(in.uv * dim, vec2f(0.0), dim - 1.0));
  let dz = textureLoad(depthTex, px, 0);
  let ndc = vec2f(in.uv.x * 2.0 - 1.0, 1.0 - in.uv.y * 2.0);
  let pn = g.invViewProj * vec4f(ndc, 0.5, 1.0);
  let rd = normalize(pn.xyz / pn.w - g.camPos.xyz);
  var dist = pp.b.x;
  if (dz > 0.0) {
    let pw = g.invViewProj * vec4f(ndc, dz, 1.0);
    dist = min(length(pw.xyz / pw.w - g.camPos.xyz), pp.b.x);
  }
  let t0 = (g.misc.z - g.camPos.z) / rd.z;
  if (dist <= t0 + 0.05) { return vec4f(0.0, 0.0, 0.0, 1.0); }
  let span = dist - t0;
  let jit = ign(in.pos.xy);
  let n = 48;
  var accL = 0.0; var accS = 0.0;
  for (var i = 0; i < n; i++) {
    let s = (f32(i) + jit) / f32(n);
    let p = g.camPos.xyz + rd * (t0 + span * s);
    let ll = lampAt(p);
    if (ll.w > 0.002) {
      let lp = g.lampVP * vec4f(p, 1.0);
      if (lp.w > 0.05) {
        let q = lp.xyz / lp.w;
        let uv = q.xy * vec2f(0.5, -0.5) + 0.5;
        if (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0) {
          let sh = textureSampleCompareLevel(lampTex, cmpSamp, uv, q.z - 0.004 / (lp.w * lp.w));
          /* light that runs on towards the lens shows brighter than light seen from the side; the air shows
             the heart of the cone and lets it go in a few metres, or the whole hall stands in milk */
          let cs = dot(ll.xyz, rd);
          let ax = dot(-ll.xyz, g.lampDir.xyz);
          let core = 0.2 * smoothstep(g.lampDir.w, g.lampCol.w, ax) + smoothstep(0.88, 0.99, ax);
          let dl = length(p - g.lampPos.xyz);
          let du = 0.7 + 0.6 * vn3(p * 0.7 + vec3f(g.camPos.w * 0.02, 0.0, 0.0), 45u);
          accL += ll.w * core * exp(-dl / 9.0) * sh * du * (0.55 + 0.9 * pow(max(cs, 0.0), 3.0) + 0.2 * cs * cs);
        }
      }
    }
    let o = dayPlan(p);
    let e = shaftOf(o);
    if (e < 1.7) {
      let sp = g.sunVP * vec4f(p, 1.0);
      let suv = sp.xy * vec2f(0.5, -0.5) + 0.5;
      if (suv.x > 0.0 && suv.x < 1.0 && suv.y > 0.0 && suv.y < 1.0 && sp.z > 0.0 && sp.z < 1.0) {
        let sh = textureSampleCompareLevel(sunTex, cmpSamp, suv, sp.z - g.fogCol.w);
        if (sh > 0.0) {
          /* the beam is soft at its sides and stands in blades: a blade keeps its place along a ray of the
             day and along the look of the lens, so it is seen edge on. Dust hangs in it in slow folds */
          let edge = 1.0 - smoothstep(0.30, 1.5, e);
          let u = (o.x - g.camPos.x) / max(o.y - g.camPos.z, 1.0);
          let b1 = vnoise(vec2f(u * 70.0 + g.camPos.w * 0.010, 0.5), 43u);
          let b2 = vnoise(vec2f(u * 190.0 - g.camPos.w * 0.016, 1.5), 44u);
          let blade = 0.30 + 1.5 * pow(b1 * 0.7 + b2 * 0.3, 2.0);
          let du = 0.7 + 0.6 * vn3(p * vec3f(0.5, 0.25, 0.5) + vec3f(0.0, -g.camPos.w * 0.03, 0.0), 41u);
          accS += sh * edge * blade * du * mix(0.55, 1.0, smoothstep(-1.0, 6.0, p.y)) * dayTop(p.y);
        }
      }
    }
  }
  let k = span / f32(n);
  var c = g.lampCol.rgb * (accL * k * pp.a.x) + g.sunCol.rgb * (accS * k * pp.a.y);
  for (var i = 0; i < 6; i++) {
    let gp = g.glowPos[i];
    if (gp.w <= 0.0) { continue; }
    let tc = clamp(dot(gp.xyz - g.camPos.xyz, rd), t0, dist);
    let dv = gp.xyz - (g.camPos.xyz + rd * tc);
    let sg = max(g.glowCol[i].w, 0.05);
    let s = dot(dv, dv) / (sg * sg);
    c += g.glowCol[i].rgb * (gp.w * pp.a.z * (0.65 * exp(-s * 0.5) + 0.35 / (1.0 + s)));
  }
  return vec4f(c, 1.0);
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

/* texA the frame, texB bloom, texC the air, texD the wing (premultiplied). a = (bloom, vignette, grade, grain) */
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
  c = mix(c, c * vec3f(0.94, 0.98, 1.08) + vec3f(0.002, 0.003, 0.006), (1.0 - smoothstep(0.0, 0.35, lum)) * pp.a.z);
  c = pow(max(c, vec3f(0.0)), vec3f(1.0 / 2.2));
  c += (ign(in.pos.xy + vec2f(g.camPos.w * 61.0, 0.0)) - 0.5) * pp.a.w;
  return vec4f(c, 1.0);
}
`;
