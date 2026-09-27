"use strict";
/* Planet look-dev stand, key frame M602 — the shaders of the night. The day's modules are taken whole and
   given more: a block of the night's numbers, the lantern's depth map, a sky of its own, the light of lamps
   and of windows, the air that shows it. Nothing of the day is redefined: what the night adds has names of
   its own. */

const NT_WGSL_NIGHT = /* wgsl */`
struct Night {
  lampVP: mat4x4f,
  lampPos: vec4f,                 // the lantern: xyz, reach
  lampDir: vec4f,                 // xyz, cos of the outer cone
  lampCol: vec4f,                 // rgb by power, cos of the inner cone
  amb: vec4f,                     // the fill of the sky; the mist over the lake, per metre
  mist: vec4f,                    // the colour of the mist; its height
  body: vec4f,                    // the way to the giant; its angular radius
  ring: vec4f,                    // the pole of its rings; their light
  gsun: vec4f,                    // the way from the giant to its sun; the light of the giant
  sunk: vec4f,                    // where the sun went down; the afterglow
  band: vec4f,                    // the pole of the galaxy's band; its light
  knob: vec4f,                    // stars, the glow of what grows, the haze of the yard per metre, smoke
  flue: vec4f,                    // where the smoke starts; its drift
  yard: vec4f,                    // the middle of the yard x z, its radius; the bias of the lantern's map
  box0: vec4f,                    // the air of the yard: the low corner; how much colour the night leaves
  box1: vec4f,                    // the high corner; how much light the dark wing keeps
  ckPos: array<vec4f, 6>,         // windows that throw light: the lamp of the room xyz, its power
  ckMid: array<vec4f, 6>,         // the middle of the opening xyz, its half-width
  ckDir: array<vec4f, 6>,         // along the wall xyz, the half-height
  ckCol: array<vec4f, 6>,         // rgb, panes across
  ptPos: array<vec4f, 12>,        // small lights: xyz, reach
  ptCol: array<vec4f, 12>,        // rgb by power, how even
  glowPos: array<vec4f, 16>,      // halos: xyz, power
  glowCol: array<vec4f, 16>,      // rgb, size
  n: vec4f,                       // how many: windows, small lights, halos; the air that lies before the giant
  more: vec4f,                    // the high clouds, the mauve of the afterglow, its teal
};
`;

const NT_WGSL_SHARED = /* wgsl */`
const NTAU = 6.2831853;

/* ── the sky of the night ── */
/* dusk gone into night: deep blue above, a band of teal over the land, and on the left, where the sun went
   down, the mauve of this world lies on the ridge. No orange in the sky: orange belongs to people. */
fn nskyBase(rd: vec3f) -> vec3f {
  let y = rd.y;
  let hor = vec3f(0.046, 0.080, 0.122);
  let mid = vec3f(0.014, 0.028, 0.062);
  let zen = vec3f(0.0045, 0.0085, 0.024);
  var c = mix(hor, mid, smoothstep(0.0, 0.17, y));
  c = mix(c, zen, smoothstep(0.14, 0.65, y));
  let s = normalize(nt.sunk.xyz);
  var da = atan2(rd.x, rd.z) - atan2(s.x, s.z);
  da = da - NTAU * round(da / NTAU);
  let up = max(y, 0.0);
  let gl = exp(-da * da / 0.42) * nt.sunk.w;
  c += vec3f(0.030, 0.100, 0.100) * (gl * nt.more.z * exp(-up / 0.22) * smoothstep(0.02, 0.14, up));
  c += vec3f(0.240, 0.045, 0.130) * (gl * nt.more.y * exp(-up / 0.09));
  return mix(hor * 0.62, c, smoothstep(-0.05, 0.0, y));
}

/* stars stand in cells of the sky, one to a cell at most; they are steady */
fn nStars(az: f32, el: f32, dens: f32) -> vec3f {
  var cells = array<f32, 3>(0.011, 0.030, 0.085);
  var rads = array<f32, 3>(0.00036, 0.00044, 0.00054);
  var thrs = array<f32, 3>(0.42, 0.36, 0.34);
  var gain = array<f32, 3>(0.09, 0.26, 0.85);
  var c = vec3f(0.0);
  let ce = max(cos(el), 0.3);
  for (var l = 0; l < 3; l++) {
    let cell = cells[l];
    let q = vec2f(az * ce, el) / cell;
    let id = vec2i(floor(q)); let f = fract(q);
    let h = hash4(id, 91u + u32(l));
    if (h.z > thrs[l] + dens * 0.45) { continue; }
    let p = (f - (0.14 + 0.72 * h.xy)) * cell;
    let r = rads[l] * (0.75 + 0.5 * h.w);
    let b = gain[l] * (0.5 + 3.0 * pow(h.w, 5.0));
    let tint = mix(vec3f(0.70, 0.83, 1.0), vec3f(1.0, 0.86, 0.66), smoothstep(0.62, 0.95, h.x));
    c += tint * (b * exp(-dot(p, p) / (r * r)));
  }
  return c;
}

/* the band of the galaxy: x its glow, y the dust that lies in it */
fn nBand(rd: vec3f) -> vec2f {
  let P = normalize(nt.band.xyz);
  let d = dot(rd, P);
  let A = normalize(cross(P, vec3f(0.0, 1.0, 0.0))); let B = cross(P, A);
  let al = atan2(dot(rd, B), dot(rd, A));
  /* clouds of stars, large and soft; one rift of dust runs along the middle, wide, and it has no thin threads:
     a thread of dust in a faint band is a scratch on the sky */
  let n1 = fbm(vec2f(al * 5.0 + 3.1, d * 9.0 + 7.7), 61u);
  let n2 = fbm(vec2f(al * 13.0 + 11.0, d * 26.0 + 2.0), 62u);
  let w = 0.10 * (0.75 + 0.5 * n1);
  let body = exp(-d * d / (w * w));
  let off = (fbm(vec2f(al * 3.0 + 1.0, 1.7), 63u) - 0.5) * 0.09;
  let rift = exp(-pow((d - off) / 0.030, 2.0)) * smoothstep(0.30, 0.62, fbm(vec2f(al * 2.4 + 5.0, 9.1), 64u));
  return vec2f(body * (0.50 + 2.0 * n1 * n2), rift);
}

/* how much light the rings stop at a radius, counted in radii of the giant */
fn nRing(r: f32) -> f32 {
  let body = smoothstep(1.26, 1.34, r) * (1.0 - smoothstep(2.10, 2.16, r));
  let gap = 1.0 - smoothstep(1.80, 1.825, r) * (1.0 - smoothstep(1.865, 1.89, r));
  let thin = mix(0.30, 1.0, smoothstep(1.42, 1.56, r));
  let fine = 0.80 + 0.20 * sin(r * 58.0) * sin(r * 21.0 + 1.3);
  return body * gap * thin * fine;
}

/* the giant and its rings, laid over the sky: rgb is already weighed by w, w says how much of the sky is hidden */
fn nGiant(rd: vec3f, sky: vec3f) -> vec4f {
  let D = normalize(nt.body.xyz); let R = nt.body.w;
  let cd = dot(rd, D);
  if (cd < cos(R * 2.5)) { return vec4f(0.0); }
  let C = D / sin(R);
  let S = normalize(nt.gsun.xyz);
  let P = normalize(nt.ring.xyz);
  let b = dot(rd, C); let disc = b * b - (dot(C, C) - 1.0);
  var rgb = vec3f(0.0); var a = 0.0;
  var tBall = 1e9;
  let ang = acos(clamp(cd, -1.0, 1.0));
  let cover = 1.0 - smoothstep(R - 0.0004, R + 0.0004, ang);
  if (cover > 0.0) {
    let tb = b - sqrt(max(disc, 0.0));
    let p = rd * tb - C; let n = normalize(p);
    let lat = dot(n, P);
    let A1 = normalize(cross(P, vec3f(0.0, 0.0, 1.0))); let B1 = cross(P, A1);
    let lon = atan2(dot(n, B1), dot(n, A1));
    /* bands run along the parallels, storms bend them */
    let tw = fbm(vec2f(lon * 2.2 + 4.0, lat * 9.0), 71u) - 0.5;
    let bandv = sin(lat * 15.0 + tw * 2.6 + sin(lat * 6.0) * 1.2);
    var alb = mix(vec3f(0.62, 0.43, 0.30), vec3f(0.88, 0.79, 0.64), smoothstep(-0.6, 0.6, bandv));
    alb = mix(alb, vec3f(0.56, 0.63, 0.72), smoothstep(0.55, 0.92, abs(lat)));
    let ndl = dot(n, S);
    var lit = smoothstep(-0.14, 0.58, ndl);
    let ds = dot(S, P);
    if (abs(ds) > 0.001) {
      let ts = -dot(p, P) / ds;
      if (ts > 0.0) { lit *= 1.0 - 0.75 * nRing(length(p + S * ts)); }
    }
    let face = clamp(dot(n, -rd), 0.0, 1.0);
    let day = alb * (lit * pow(face, 0.45) * nt.gsun.w);
    /* the side the sun does not reach is the sky itself, a little darker: the air lies before the giant */
    let night = sky * 0.84;
    let air = vec3f(0.35, 0.52, 0.85) * (pow(1.0 - face, 4.0) * smoothstep(-0.25, 0.3, ndl) * 0.30 * nt.gsun.w);
    rgb = mix(night + day + air, sky, nt.n.w) * cover; a = cover;
    if (disc > 0.0) { tBall = tb; }
  }
  let den = dot(rd, P);
  if (abs(den) > 0.0001) {
    let tr = dot(C, P) / den;
    if (tr > 0.0 && tr < tBall) {
      let q = rd * tr - C; let r = length(q);
      var o = nRing(r) * 0.92;
      if (o > 0.0) {
        /* in the shadow of the ball the rings go out: what is left of them there is the sky */
        let al = dot(q, S); let pr = length(q - S * al);
        var sh = 1.0;
        if (al < 0.0) { sh = smoothstep(0.92, 1.10, pr); }
        o *= 0.10 + 0.90 * sh;
        let tone = mix(vec3f(0.80, 0.71, 0.58), vec3f(0.93, 0.89, 0.81), smoothstep(1.5, 2.0, r));
        let rc = mix(tone * nt.ring.w, sky, nt.n.w);
        rgb = rgb * (1.0 - o) + rc * o; a = a + o * (1.0 - a);
      }
    }
  }
  return vec4f(rgb, a);
}

fn nskyCol(rd: vec3f) -> vec3f {
  var c = nskyBase(rd);
  let az = atan2(rd.x, rd.z); let el = asin(clamp(rd.y, -1.0, 1.0));
  if (el <= 0.0) { return c; }
  /* the air over the land puts the faint out */
  let clear = smoothstep(0.0, 0.075, el);
  let bd = nBand(rd);
  let veil = bd.x * (1.0 - 0.8 * bd.y);
  c += vec3f(0.60, 0.74, 1.0) * (veil * nt.band.w * clear);
  c += nStars(az, el, veil) * (nt.knob.x * clear * (1.0 - 0.6 * bd.y));
  let gi = nGiant(rd, nskyBase(rd));
  c = c * (1.0 - gi.w) + gi.rgb;
  /* clouds of the day, now dark bodies with a pale rim: the light stands behind them */
  let t = g.camPos.w;
  let wa = vec2f(fbm(vec2f(az * 38.0, el * 60.0), 11u), fbm(vec2f(az * 38.0 + 9.7, el * 60.0 + 3.1), 12u)) - 0.5;
  let wb = vec2f(fbm(vec2f(az * 150.0, el * 220.0), 13u), fbm(vec2f(az * 150.0 + 4.1, el * 220.0 + 8.3), 14u)) - 0.5;
  let a2 = az + wa.x * 0.012 + wb.x * 0.003 + t * 0.0004;
  let e2 = el + wa.y * 0.008 + wb.y * 0.002;
  let lc = normalize(vec3f(-0.30, 0.55, 0.78));
  let hz = nskyBase(normalize(vec3f(rd.x, 0.01, rd.z)));
  let bk = cloudBank(a2, e2, 0.055, 0.014, 0.034, 0.5, 3u, lc);
  if (bk.y > 0.0) {
    let l = smoothstep(-0.10, 0.60, bk.x);
    let cc = mix(hz * 0.50, hz * 1.30 + vec3f(0.008, 0.013, 0.022), l);
    let gap = 1.0 - exp(-pow((az - 0.0873) / 0.085, 2.0));
    c = mix(c, cc, bk.y * smoothstep(bk.w - 0.002, bk.w + 0.003, e2) * 0.9 * gap);
  }
  /* the high clouds are veils: the sky and its brightest stars show through, the edge that looks at the
     light is pale */
  var h = vec4f(0.0, 0.0, -1.0, 0.0);
  h = cloudOne(a2, e2, vec2f(-0.300, 0.058), 0.085, 22u, lc, h);
  h = cloudOne(a2, e2, vec2f(0.150, 0.118), 0.030, 24u, lc, h);
  h = cloudOne(a2, e2, vec2f(-0.090, 0.235), 0.095, 25u, lc, h);
  if (h.y > 0.0 && nt.more.x > 0.0) {
    let l = smoothstep(-0.05, 0.65, h.x);
    let base = nskyBase(rd);
    var cc = mix(base * 0.72, base * 1.25 + vec3f(0.030, 0.046, 0.070), l);
    cc = mix(cc, hz * 0.8, exp(-e2 / 0.045) * 0.5);
    c = mix(c, cc, h.y * smoothstep(h.w - 0.003, h.w + 0.004, e2) * nt.more.x);
  }
  return c;
}

/* ── the air of the night ── */
fn nAir(rd: vec3f) -> vec3f { return nskyBase(normalize(vec3f(rd.x, 0.015, rd.z))) * 0.62; }
/* the mist that lies on the lake: how much of the way to a point it hides */
fn nMist(wpos: vec3f) -> f32 {
  let o = g.camPos.xyz; let dist = length(wpos - o);
  let h = max(nt.mist.w, 0.1);
  let y0 = max(o.y - g.sunDir.w, 0.0); let y1 = max(wpos.y - g.sunDir.w, 0.0);
  let dy = y1 - y0;
  var k = exp(-y0 / h);
  if (abs(dy) > 0.02) { k = h * (exp(-y0 / h) - exp(-y1 / h)) / dy; }
  return 1.0 - exp(-nt.amb.w * dist * k * smoothstep(8.0, 30.0, wpos.z));
}
fn nFog(col: vec3f, wpos: vec3f, cap: f32) -> vec3f {
  let d = wpos - g.camPos.xyz; let dist = length(d); let rd = d / dist;
  let f = fogAmount(dist, 0.5 * (wpos.y + g.camPos.y)) * cap;
  var c = mix(col, nAir(rd), f);
  if (g.misc.y < 0.5) { c = mix(c, nt.mist.rgb, nMist(wpos) * cap); }
  return c;
}

/* ── the lights of people ── */
/* the lantern: xyz the way to it, w how much of its light comes */
fn nLamp(p: vec3f) -> vec4f {
  let d = nt.lampPos.xyz - p; let dl = max(length(d), 0.001); let ld = d / dl;
  let cs = dot(-ld, nt.lampDir.xyz);
  let cone = smoothstep(nt.lampDir.w, nt.lampCol.w, cs);
  let att = (1.0 - smoothstep(nt.lampPos.w * 0.55, nt.lampPos.w, dl)) / (1.0 + dl * dl / 12.0);
  return vec4f(ld, cone * att);
}
fn nLampUV(p: vec3f) -> vec3f {   // where a point lies in the lantern's map; z < 0 if it lies outside
  let lp = nt.lampVP * vec4f(p, 1.0);
  if (lp.w <= 0.05) { return vec3f(0.0, 0.0, -1.0); }
  let q = lp.xyz / lp.w; let uv = q.xy * vec2f(0.5, -0.5) + 0.5;
  if (uv.x < 0.002 || uv.x > 0.998 || uv.y < 0.002 || uv.y > 0.998) { return vec3f(0.0, 0.0, -1.0); }
  return vec3f(uv, max(q.z - nt.yard.w / (lp.w * lp.w), 0.0));
}
fn nLampShade(wpos: vec3f, n: vec3f, rot: f32) -> f32 {
  let dl = length(wpos - nt.lampPos.xyz);
  let q = nLampUV(wpos + n * (0.015 + dl * 0.004));
  if (q.z < 0.0) { return 0.0; }
  let rad = 4.0 / 4096.0;
  var s = textureSampleCompareLevel(lampTex, shadowSamp, q.xy, q.z);
  for (var i = 0; i < 8; i++) {
    let a = f32(i) * 2.39996 + rot; let r = rad * sqrt((f32(i) + 0.5) / 8.0);
    s += textureSampleCompareLevel(lampTex, shadowSamp, q.xy + vec2f(cos(a), sin(a)) * r, q.z);
  }
  return s / 9.0;
}
/* a lit window throws its light out: a point takes it if its way to the lamp of the room passes the opening */
fn nCookie(i: i32, p: vec3f) -> vec4f {
  let lp = nt.ckPos[i].xyz; let mid = nt.ckMid[i].xyz; let R = nt.ckDir[i].xyz;
  let hw = nt.ckMid[i].w; let hh = nt.ckDir[i].w;
  let nw = cross(vec3f(0.0, 1.0, 0.0), R);
  let side = dot(p - mid, nw);
  if (side < 0.03) { return vec4f(0.0); }
  let d = lp - p; let dl = length(d);
  let den = dot(d, nw);
  if (den > -0.01) { return vec4f(0.0); }
  let q = p + d * (side / -den) - mid;
  let a = dot(q, R); let b = q.y;
  let soft = 0.025 + 0.06 * side;
  let m = (1.0 - smoothstep(hw - soft, hw + soft, abs(a))) * (1.0 - smoothstep(hh - soft, hh + soft, abs(b)));
  if (m <= 0.0) { return vec4f(0.0); }
  /* the bars of the frame stand in the light, and blur with the way */
  let na = nt.ckCol[i].w;
  let fa = (a / hw * 0.5 + 0.5) * na;
  let da = abs(fa - round(fa)) * (2.0 * hw / na);
  let deep = clamp(0.06 / soft, 0.0, 1.0);
  var bar = 1.0 - (1.0 - smoothstep(0.02, 0.02 + soft, da)) * deep * step(0.5, fa) * step(fa, na - 0.5);
  if (na < 2.5) { bar *= 1.0 - (1.0 - smoothstep(0.02, 0.02 + soft, abs(b - hh * 0.24))) * deep; }
  let att = (1.0 - smoothstep(9.0, 16.0, dl)) / (1.0 + dl * dl / 4.84);
  return vec4f(d / dl, m * bar * att * nt.ckPos[i].w);
}
fn nPoints(p: vec3f, N: vec3f, wrap: f32) -> vec3f {
  var c = vec3f(0.0);
  let n = i32(nt.n.y);
  for (var i = 0; i < n; i++) {
    let lp = nt.ptPos[i]; let lc = nt.ptCol[i];
    let d = lp.xyz - p; let dl = length(d);
    if (dl > lp.w) { continue; }
    let att = pow(1.0 - dl / lp.w, 2.0) / (1.0 + dl * dl * 0.08);
    let nl = mix(clamp(dot(N, d / max(dl, 0.001)) * (1.0 - wrap) + wrap, 0.0, 1.0), 1.0, lc.w);
    c += lc.rgb * (att * nl);
  }
  return c;
}
`;

const NT_WGSL_SCENE = WGSL_SCENE + NT_WGSL_NIGHT + /* wgsl */`
@group(0) @binding(6) var<uniform> nt: Night;
@group(0) @binding(7) var lampTex: texture_depth_2d;
` + NT_WGSL_SHARED + /* wgsl */`
@fragment fn fs_nsky(in: FOut) -> @location(0) vec4f {
  let ndc = vec2f(in.uv.x * 2.0 - 1.0, 1.0 - in.uv.y * 2.0);
  let pn = g.invViewProj * vec4f(ndc, 1.0, 1.0);
  let rd = normalize(pn.xyz / pn.w - g.camPos.xyz);
  return vec4f(nskyCol(rd), 1.0);
}

/* A window is one card. Behind its glass there is a room: a lamp that hangs in it, a wall lit by the lamp,
   a curtain drawn half-way, a pot with a plant on the sill. The room is a glow as a room is: its lamp the
   hottest, the jambs the darkest. col: where in the opening, the kind with the seed. */
fn nWindow(col: vec3f, glow: f32, asp: f32, N: vec3f, V: vec3f) -> vec3f {
  let uv = col.xy; let kind = i32(floor(col.z + 0.001)); let seed = fract(col.z);
  let R = normalize(cross(N, vec3f(0.0, 1.0, 0.0)));
  let vz = max(dot(V, N), 0.12);
  let slope = vec2f(-dot(V, R), -V.y) / vz;
  let a0 = vec2f((uv.x - 0.5) * asp, uv.y - 0.5);
  let rv = reflect(-V, N);
  let fr = 0.04 + 0.6 * pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.0);
  let sky = nskyBase(normalize(vec3f(rv.x, abs(rv.y) + 0.03, rv.z))) * (fr * 2.0);
  let dark = vec3f(0.010, 0.012, 0.016);
  var warm = vec3f(1.0, 0.56, 0.22);
  if (kind == 3) { warm = vec3f(1.0, 0.80, 0.55); }
  if (kind == 2) {
    /* the porthole of the door */
    let rr = length((uv - 0.5) * 2.0);
    if (rr > 1.0) { discard; }
    let room = warm * (glow * (0.55 + 0.6 * (1.0 - uv.y)) * (1.0 - 0.4 * smoothstep(0.4, 0.78, rr)));
    return mix(room, dark, smoothstep(0.74, 0.80, rr)) + sky;
  }
  var bar = 0.0;
  if (kind == 0 || kind == 4) {
    bar = max(1.0 - smoothstep(0.022, 0.034, abs(a0.x)), 1.0 - smoothstep(0.022, 0.034, abs(a0.y - 0.12)));
  } else {
    let n = max(round(asp / 1.05), 1.0);
    let fa = uv.x * n; let da = abs(fa - round(fa)) * asp / n;
    bar = (1.0 - smoothstep(0.030, 0.045, da)) * step(0.5, fa) * step(fa, n - 0.5);
  }
  if (kind == 4) { return mix(vec3f(0.003, 0.004, 0.007) + sky, dark, bar); }
  /* the lamp hangs a little more than a height into the room, the wall stands behind it */
  var pl = a0 + slope * 1.1;
  var pw = a0 + slope * 2.4;
  var lampAt = vec2f((seed - 0.5) * 0.7 * asp, 0.18 + 0.16 * fract(seed * 7.0));
  var squash = vec2f(1.0, 1.25);
  if (kind != 0) {
    /* a long room: a lamp to every pane and a half */
    let off = seed * 1.5;
    pl.x = (fract((pl.x + off) / 1.5) - 0.5) * 1.5;
    pw.x = (fract((pw.x + off) / 1.5) - 0.5) * 1.5;
    lampAt = vec2f(0.0, 0.24);
    if (kind == 3) { squash = vec2f(0.35, 1.6); }
  }
  let dlamp = length((pl - lampAt) * squash);
  let hot = 1.0 / (1.0 + pow(dlamp / 0.16, 2.0));
  let bulb = 1.0 - smoothstep(0.040, 0.058, dlamp);
  let dw = pw - lampAt;
  let wall = 0.40 + 0.36 * exp(-dot(dw, dw) / 0.5) - 0.12 * smoothstep(0.1, 0.5, pw.y);
  var room = warm * (wall + hot * 0.9) + vec3f(1.0, 0.86, 0.62) * (bulb * 2.2);
  let jx = min(uv.x, 1.0 - uv.x) * asp; let jy = min(uv.y, 1.0 - uv.y);
  room *= 0.55 + 0.45 * smoothstep(0.0, 0.10, min(jx, jy));
  if (kind == 0) {
    let side = step(0.5, seed);
    let cu = mix(uv.x, 1.0 - uv.x, side);
    let cur = 1.0 - smoothstep(0.27, 0.31, cu + 0.03 * sin(uv.y * 9.0 + seed * 20.0));
    let cloth = warm * (0.66 + 0.14 * sin(cu * 95.0) - 0.10 * uv.y);
    room = mix(room, cloth, cur * 0.92);
    /* on the sill, away from the curtain: a pot, a stem, a cap */
    let px = (side - 0.5) * 0.46 * asp;
    let x = a0.x - px; let y = a0.y;
    let pot = step(abs(x), 0.045 + (y + 0.5) * 0.18) * step(y, -0.37);
    let stem = step(abs(x), 0.009) * step(y, -0.20) * step(-0.38, y);
    let cap = step((x / 0.125) * (x / 0.125) + ((y + 0.21) / 0.075) * ((y + 0.21) / 0.075), 1.0) * step(-0.21, y);
    room = mix(room, vec3f(0.030, 0.016, 0.010), max(pot, max(stem, cap)));
  }
  return mix(room * glow, dark, bar) + sky;
}

@fragment fn fs_nmain(in: VOut) -> @location(0) vec4f {
  let fx = dpdx(in.wpos); let fy = dpdy(in.wpos);
  if (g.misc.y > 0.5 && in.wpos.y < g.misc.x) { discard; }
  let mat = i32(round(in.par.x));
  let glow = in.par.z; let ex = in.par.w;
  let t = g.camPos.w;
  if (mat == 5) {
    /* small lights breathe, each in its own time; none of them blinks */
    let ph = fract(in.par.y * 97.0 + glow * 13.7) * NTAU;
    let rate = 1.3 + step(0.001, in.par.y) * (fract(in.par.y * 53.0) - 0.5) * 0.9;
    let breath = 1.0 - ex * (0.5 - 0.5 * sin(t * rate + ph));
    return vec4f(nFog(in.col * (glow * breath), in.wpos, 0.9), 1.0);
  }
  let toEye = g.camPos.xyz - in.wpos;
  let dist = length(toEye); let V = toEye / dist;
  var N = normalize(in.nrm);
  if (mat == 10) { return vec4f(nFog(nWindow(in.col, glow, ex, N, V), in.wpos, 1.0), 1.0); }
  if (mat == 11 && dot(N, V) < 0.0) { N = -N; }
  let L = normalize(g.sunDir.xyz);
  if (mat == 1) {
    var fN = normalize(cross(fx, fy));
    if (dot(fN, V) < 0.0) { fN = -fN; }
    N = normalize(mix(N, fN, 0.7));
  }
  var alb = in.col;
  var stone = 0.0; var emis = glow * nt.knob.y;
  if (mat == 0) {
    stone = glow; emis = 0.0;
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
  let wing = g.misc.y <= -0.5;
  let ndl = dot(N, L);
  var sh = 1.0;
  if (!wing) { sh = shadowAt(in.wpos, N, in.pos.xy); }
  let fg = nearShade(in.wpos);
  var lit = smoothstep(-0.02, 0.30, ndl);
  var ao = 1.0;
  var through = 0.0;
  var wrap = 0.3;
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
    lit = smoothstep(-0.25, 0.45, ndl);
    let edge = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.0);
    through = clamp(0.25 - ndl * 0.8, 0.0, 1.0) * (0.12 + 0.55 * edge);
    ao = mix(0.55, 1.0, smoothstep(-0.7, 0.3, N.y));
    wrap = 0.5;
  }
  if (mat == 7) {
    lit = smoothstep(-0.4, 0.45, ndl);
    through = pow(clamp(dot(-V, L), 0.0, 1.0), 2.0) * 0.7 * ex;
    wrap = 0.6;
  }
  if (mat == 11) { lit = smoothstep(-0.6, 0.5, ndl); wrap = 0.7; }
  /* the night keeps the value of a thing and lets most of its colour go; a lamp gives the colour back */
  let lum = dot(alb, vec3f(0.2126, 0.7152, 0.0722));
  let nalb = mix(vec3f(lum), alb, nt.box0.w);
  let key = g.sunCol.rgb * (sh * fg);
  let skyAmb = nt.amb.rgb;
  let gndAmb = nt.amb.rgb * vec3f(0.30, 0.34, 0.26);
  let amb = mix(gndAmb, skyAmb, N.y * 0.5 + 0.5) * ao * mix(0.5, 1.0, fg);
  var c = nalb * (key * lit * mix(1.0, ao, 0.6) + amb);
  c += nalb * vec3f(0.85, 1.0, 1.1) * key * through;
  if (mat == 1 || mat == 3 || mat == 4 || mat == 8 || mat == 9 || mat == 11) {
    /* the light of the giant comes from behind: a body is drawn by its lit rim */
    var rk = 0.30; var rp = 3.0;
    if (mat == 4 || mat == 8) { rk = 0.75; rp = 2.2; }
    if (mat == 3 || mat == 1) { rk = 0.60; rp = 2.4; }
    let rim = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), rp) * smoothstep(-0.4, 0.4, ndl);
    c += key * rim * rk * mix(nalb, vec3f(1.0), 0.4);
  }
  if (mat == 4) {
    let hv = normalize(L + V);
    c += key * pow(clamp(dot(N, hv), 0.0, 1.0), 60.0) * ex * lit * 1.5;
    let rv = reflect(-V, N);
    let fr = 0.05 + 0.95 * pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 4.0);
    c += nskyBase(normalize(vec3f(rv.x, abs(rv.y) + 0.02, rv.z))) * (ex * fr * 0.5 * mix(0.55, 1.0, fg));
  }
  if (mat == 9) {
    /* the far sign climbs out of the shadow of the land: high up the sun still finds it */
    c += vec3f(1.0, 0.60, 0.36) * (0.85 * smoothstep(3000.0, 5600.0, in.wpos.y));
  }
  if (!wing) {
    var ll = vec3f(0.0);
    if (length(in.wpos.xz - nt.yard.xy) < nt.yard.z) {
      let la = nLamp(in.wpos);
      if (la.w > 0.0005) {
        let nl = clamp(dot(N, la.xyz) * (1.0 - wrap) + wrap, 0.0, 1.0);
        let ls = nLampShade(in.wpos, N, ign(in.pos.xy) * NTAU);
        ll += nt.lampCol.rgb * (la.w * nl * ls);
        if (mat == 4) {
          let hv = normalize(la.xyz + V);
          c += nt.lampCol.rgb * (pow(clamp(dot(N, hv), 0.0, 1.0), 40.0) * ex * la.w * ls * 1.2);
        }
      }
      let nc = i32(nt.n.x);
      for (var i = 0; i < nc; i++) {
        let ck = nCookie(i, in.wpos);
        if (ck.w <= 0.0) { continue; }
        ll += nt.ckCol[i].rgb * (ck.w * clamp(dot(N, ck.xyz) * (1.0 - wrap) + wrap, 0.0, 1.0));
      }
    }
    ll += nPoints(in.wpos, N, wrap);
    c += alb * ll * mix(1.0, ao, 0.5);
  } else {
    /* the wing is the darkest of the frame: outlines against the lit stage */
    c *= nt.box1.w;
  }
  c += alb * emis;
  var cap = 1.0;
  if (mat == 9) { cap = 0.93; }
  return vec4f(nFog(c, in.wpos, cap), 1.0);
}

@fragment fn fs_nwater(in: VOut) -> @location(0) vec4f {
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
  let deep = smoothstep(0.0, 2.2, depth);
  var body = mix(vec3f(0.10, 0.30, 0.30), vec3f(0.02, 0.10, 0.17), deep);
  body *= g.sunCol.rgb * 0.55 + nt.amb.rgb * 1.2;
  body += body * nPoints(in.wpos, vec3f(0.0, 1.0, 0.0), 0.3) * 0.6;
  var c = mix(body, refl * vec3f(0.84, 0.90, 0.92), clamp(fr * 1.05, 0.0, 1.0));
  c = mix(c, nt.amb.rgb * 3.0 + g.sunCol.rgb * 0.5, (1.0 - smoothstep(0.02, 0.16, depth)) * 0.25);
  let alpha = smoothstep(-0.03, 0.30, depth);
  return vec4f(nFog(c, in.wpos, 1.0), alpha);
}
`;

const NT_WGSL_POST = WGSL_POST + NT_WGSL_NIGHT + /* wgsl */`
@group(0) @binding(10) var<uniform> nt: Night;
@group(0) @binding(11) var lampTex: texture_depth_2d;
` + NT_WGSL_SHARED + /* wgsl */`
fn nBoxHit(ro: vec3f, rd: vec3f, b0: vec3f, b1: vec3f) -> vec2f {
  let sd = select(rd, vec3f(0.000001), abs(rd) < vec3f(0.000001));
  let t0 = (b0 - ro) / sd; let t1 = (b1 - ro) / sd;
  let tn = min(t0, t1); let tf = max(t0, t1);
  return vec2f(max(max(tn.x, tn.y), max(tn.z, 0.0)), min(min(tf.x, tf.y), tf.z));
}

/* The air of the yard, drawn at half size and laid over the frame. A thin haze shows the light of the
   lantern with the shadows of the posts in it and the light that falls out of the windows; every lamp has
   a halo; the smoke of the flue climbs and leans with the wind. rgb is already weighed, a is what the smoke
   hides. */
@fragment fn fs_air(in: FOut) -> @location(0) vec4f {
  let dim = vec2f(textureDimensions(depthTex));
  let px = vec2i(clamp(in.uv * dim, vec2f(0.0), dim - 1.0));
  let dz = textureLoad(depthTex, px, 0);
  let ndc = vec2f(in.uv.x * 2.0 - 1.0, 1.0 - in.uv.y * 2.0);
  let pn = g.invViewProj * vec4f(ndc, 1.0, 1.0);
  let ro = g.camPos.xyz;
  let rd = normalize(pn.xyz / pn.w - ro);
  var dist = 60000.0;
  if (dz > 0.0) {
    let pw = g.invViewProj * vec4f(ndc, dz, 1.0);
    dist = length(pw.xyz / pw.w - ro);
  }
  let jit = ign(in.pos.xy);
  let t = g.camPos.w;
  var rgb = vec3f(0.0); var a = 0.0;

  if (nt.knob.w > 0.0) {
    let f0 = nt.flue.xyz;
    let sb = nBoxHit(ro, rd, f0 + vec3f(-1.5, 0.0, -3.0), f0 + vec3f(12.0, 15.0, 3.0));
    let t1 = min(sb.y, dist);
    if (t1 > sb.x) {
      let n = 28; let ds = (t1 - sb.x) / f32(n);
      let L = normalize(g.sunDir.xyz);
      let back = pow(max(dot(rd, L), 0.0), 2.0);
      for (var i = 0; i < n; i++) {
        let p = ro + rd * (sb.x + (f32(i) + jit) * ds);
        let h = p.y - f0.y;
        if (h < 0.0) { continue; }
        let sway = (fbm(vec2f(h * 0.35 - t * 0.2, 3.0), 85u) - 0.5) * 0.55 * h;
        let cx = f0.x + nt.flue.w * (0.20 * h * h / (1.0 + 0.10 * h)) + sin(h * 0.9 - t * 0.6) * 0.03 * h + sway;
        let cz = f0.z + sin(h * 0.6 + 1.7 - t * 0.45) * 0.05 * h;
        let r = 0.10 + 0.15 * h;
        let dd = length(vec2f(p.x - cx, p.z - cz)) / r;
        if (dd > 1.6) { continue; }
        let nz = fbm(vec2f((p.x - cx) * 1.3 + p.z * 0.9, h * 0.8 - t * 0.55), 83u) * 0.7
          + fbm(vec2f(p.x * 3.1 + p.z * 2.3, h * 2.2 - t * 0.9), 84u) * 0.3;
        var dens = exp(-dd * dd * 1.4) * smoothstep(0.25, 0.75, nz + 0.25 * (1.0 - dd));
        dens *= (1.0 - smoothstep(2.0, 6.5, h)) * smoothstep(0.0, 0.25, h) / (1.0 + h * 0.5);
        let al = 1.0 - exp(-dens * nt.knob.w * ds * 6.0);
        var lc = nt.amb.rgb * 2.2 + g.sunCol.rgb * ((0.35 + 0.9 * back) * (0.5 + 0.5 * dd));
        lc += vec3f(1.0, 0.56, 0.22) * (0.05 * exp(-h * 0.8));
        rgb += (1.0 - a) * al * lc;
        a += (1.0 - a) * al;
      }
    }
  }

  if (nt.knob.z > 0.0) {
    let hb = nBoxHit(ro, rd, nt.box0.xyz, nt.box1.xyz);
    let t1 = min(hb.y, dist);
    if (t1 > hb.x) {
      let n = 28; let ds = (t1 - hb.x) / f32(n);
      var acc = vec3f(0.0);
      let nc = i32(nt.n.x);
      for (var i = 0; i < n; i++) {
        let p = ro + rd * (hb.x + (f32(i) + jit) * ds);
        let la = nLamp(p);
        if (la.w > 0.002) {
          let q = nLampUV(p);
          if (q.z >= 0.0) {
            let s = textureSampleCompareLevel(lampTex, shadowSamp, q.xy, q.z);
            let cs = dot(rd, -la.xyz);
            acc += nt.lampCol.rgb * (la.w * s * (0.6 + 0.8 * pow(max(cs, 0.0), 3.0)));
          }
        }
        for (var k = 0; k < nc; k++) { acc += nt.ckCol[k].rgb * (nCookie(k, p).w * 0.5); }
        acc += nPoints(p, vec3f(0.0, 1.0, 0.0), 1.0) * 0.5;
      }
      rgb += acc * (ds * nt.knob.z);
    }
  }

  let nh = i32(nt.n.z);
  for (var i = 0; i < nh; i++) {
    let gp = nt.glowPos[i]; let gc = nt.glowCol[i];
    let tc = clamp(dot(gp.xyz - ro, rd), 0.0, dist);
    let dv = gp.xyz - (ro + rd * tc);
    let sg = max(gc.w, 0.05); let s = dot(dv, dv) / (sg * sg);
    rgb += gc.rgb * (gp.w * (0.65 * exp(-s * 0.5) + 0.35 / (1.0 + s * s)));
  }
  return vec4f(rgb, a);
}

/* texA the frame, texB bloom, texC the air (weighed), texD the wing (weighed). a = (bloom, vignette, grade, grain) */
@fragment fn fs_ncomp(in: FOut) -> @location(0) vec4f {
  var c = textureSampleLevel(texA, samp, in.uv, 0.0).rgb;
  let air = textureSampleLevel(texC, samp, in.uv, 0.0);
  c = c * (1.0 - clamp(air.a, 0.0, 1.0)) + max(air.rgb, vec3f(0.0));
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
  c = mix(c, c * vec3f(0.94, 0.98, 1.08) + vec3f(0.003, 0.005, 0.010), (1.0 - smoothstep(0.0, 0.35, lum)) * pp.a.z);
  c = pow(max(c, vec3f(0.0)), vec3f(1.0 / 2.2));
  c += (ign(in.pos.xy + vec2f(g.camPos.w * 61.0, 0.0)) - 0.5) * pp.a.w;
  return vec4f(c, 1.0);
}
`;
