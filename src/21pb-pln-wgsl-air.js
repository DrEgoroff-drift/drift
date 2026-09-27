/* ══════════════ планета: небо, воздух и свет облаков — общее для всех шейдеров (M610) ══════════════
   Один свет, один воздух, одно небо на каждое тело в кадре: этот текст стоит
   в начале и шейдера сцены (21pc), и шейдера свёртки (21pd).

   Все цвета неба, воздуха и заполняющего света приходят числами из кадра
   (21pz): час и тип мира меняют числа, а не шейдер. Блок Globals — 928 байт,
   232 числа; раскладку держит plnGlobals (21pe), править только вместе. */
const PLN_WGSL_AIR=/* wgsl */`
struct Globals {
  viewProj: mat4x4f,
  invViewProj: mat4x4f,
  lightVP0: mat4x4f,
  lightVP1: mat4x4f,
  camPos: vec4f,      // xyz, время в секундах
  sunDir: vec4f,      // xyz, уровень воды
  sunCol: vec4f,      // rgb ключа, экспозиция
  screen: vec4f,      // w, h, 1/w, 1/h
  hero: vec4f,        // x, z пятна света героя, r1, r2
  misc: vec4f,        // y отсечения, 1 зеркало / −1 кулиса, смещения двух карт теней
  lampPos: array<vec4f, 4>,   // xyz, дальность
  lampCol: array<vec4f, 4>,   // rgb, сила
  skyZen: vec4f,      // зенит в стороне от светила; w — сколько звёзд
  skyZenS: vec4f,     // зенит со стороны светила; w — запас
  skyHor: vec4f,      // горизонт в стороне от светила; w — перистые
  skyHorS: vec4f,     // горизонт со стороны светила; w — дальняя гряда облаков
  sunGlow: vec4f,     // зарево вокруг светила; w — сила
  airFar: vec4f,      // воздух вдали, в стороне от светила; w — плотность
  airFarS: vec4f,     // воздух вдали со стороны светила; w — как быстро редеет с высотой
  airNear: vec4f,     // во что красится ближний воздух (множитель); w — запас
  ambSky: vec4f,      // заполняющий от неба; w — тексель карты теней (1/размер)
  ambGnd: vec4f,      // заполняющий от земли; w — запас
  thru: vec4f,        // свет сквозь лист и траву; w — запас
  bounce: vec4f,      // отсвет освещённой земли на то, что на ней стоит; w — запас
  waterA: vec4f,      // вода на мели; w — запас
  waterB: vec4f,      // вода в глубине; w — подъём дальнего мира, м (21pf: он едет за камерой)
  cloudLit: vec4f,    // облако на свету; w — сколько неба открыто: меньше — больше теней облаков на земле
  cloudDark: vec4f,   // облако в тени, в стороне от светила; w — запас
  cloudDarkS: vec4f,  // облако в тени со стороны светила; w — запас
  moon: vec4f,        // дневная луна: азимут, высота, радиус (рад), яркость
  world: vec4f,       // семя мира, сила ветра, число облаков, число пятен тени
  bands: vec4f,       // полосы тени по глубине: начало и конец ближней, начало и конец дальней
  clouds: array<vec4f, 8>,    // азимут, высота основания, полуширина, семя
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

/* ── небо ── */
/* насколько направление близко к стороне светила: тёплое живёт только там */
fn sunSide(rd: vec3f) -> f32 {
  let a = normalize(rd.xz + vec2f(0.00001, 0.0)); let b = normalize(g.sunDir.xz + vec2f(0.00001, 0.0));
  return pow(clamp(dot(a, b) * 0.5 + 0.5, 0.0, 1.0), 5.0);
}
fn horizonCol(rd: vec3f) -> vec3f {
  return mix(g.skyHor.rgb, g.skyHorS.rgb, sunSide(rd));
}
fn skyBase(rd: vec3f) -> vec3f {
  let el = asin(clamp(rd.y, -1.0, 1.0));
  let t = pow(smoothstep(0.0, 0.24, el), 0.7);
  let zen = mix(g.skyZen.rgb, g.skyZenS.rgb, sunSide(rd));
  var c = mix(horizonCol(rd), zen, t);
  let cs = max(dot(rd, normalize(g.sunDir.xyz)), 0.0);
  c += g.sunGlow.rgb * ((pow(cs, 6.0) * 0.18 + pow(cs, 60.0) * 1.2) * g.sunGlow.w);
  return c;
}
/* звёзды: редкие, разной силы; у горизонта их гасит воздух */
fn starsOver(rd: vec3f, sky: vec3f) -> vec3f {
  if (g.skyZen.w <= 0.0 || rd.y <= 0.0) { return sky; }
  let az = atan2(rd.x, rd.z); let el = asin(clamp(rd.y, -1.0, 1.0));
  let q = vec2f(az * cos(el), el) * 420.0;
  let i = vec2i(floor(q)); let f = q - floor(q);
  let h = hash4(i, 91u);
  if (h.x > 0.035) { return sky; }
  let d = length(f - vec2f(0.25) - h.yz * 0.5);
  let s = smoothstep(0.22, 0.0, d) * (0.25 + 0.75 * h.w * h.w);
  let tint = mix(vec3f(0.80, 0.88, 1.0), vec3f(1.0, 0.90, 0.78), h.y);
  return sky + tint * (s * g.skyZen.w * smoothstep(0.02, 0.22, el));
}
/* дневная луна: бледный диск со светлой стороной к светилу */
fn moonOver(rd: vec3f, sky: vec3f) -> vec3f {
  if (g.moon.w <= 0.0) { return sky; }
  let az = g.moon.x; let el = g.moon.y; let r = g.moon.z;
  let md = vec3f(sin(az) * cos(el), sin(el), cos(az) * cos(el));
  let right = normalize(cross(vec3f(0.0, 1.0, 0.0), md));
  let up = cross(md, right);
  let q = vec2f(dot(rd, right), dot(rd, up)) / r;
  let d2 = dot(q, q);
  if (d2 > 1.0 || dot(rd, md) < 0.0) { return sky; }
  let n = q.x * right + q.y * up - sqrt(1.0 - d2) * md;
  let l = smoothstep(-0.05, 0.30, dot(n, normalize(g.sunDir.xyz)));
  let sea = 1.0 - 0.30 * smoothstep(0.45, 0.62, fbm(q * 2.3 + 7.0, 31u));
  let edge = smoothstep(1.0, 0.90, d2);
  return sky + vec3f(0.80, 0.86, 0.95) * (sea * 0.55 * l * edge * g.moon.w);
}
/* гряда кучевых: ячейки по азимуту, плоское основание, на нём клубы.
   отдаёт свет −1…1, покрытие 0…1, высоту победившего клуба, основание его облака */
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
/* одно кучевое там, где его поставил кадр: c — середина основания, w — полуширина.
   Ряд клубов по основанию и второй ярус над серединой. */
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
        /* куча освещена как одно тело, клуб только лепит её поверхность: испод верхнего клуба
           не рисует тёмный шов по нижним */
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
  var c = moonOver(rd, starsOver(rd, skyBase(rd)));
  let az = atan2(rd.x, rd.z); let el = asin(clamp(rd.y, -1.0, 1.0));
  if (el > 0.0) {
    let t = g.camPos.w;
    let wa = vec2f(fbm(vec2f(az * 38.0, el * 60.0), 11u), fbm(vec2f(az * 38.0 + 9.7, el * 60.0 + 3.1), 12u)) - 0.5;
    let wb = vec2f(fbm(vec2f(az * 150.0, el * 220.0), 13u), fbm(vec2f(az * 150.0 + 4.1, el * 220.0 + 8.3), 14u)) - 0.5;
    let a2 = az + wa.x * 0.012 + wb.x * 0.003 + t * 0.0004;
    let e2 = el + wa.y * 0.008 + wb.y * 0.002;
    let sd = u32(g.world.x);
    let ci = smoothstep(0.5, 0.8, fbm(vec2f(az * 5.0 + 5.0 + t * 0.002, el * 55.0), 41u + sd)) * smoothstep(0.07, 0.15, el) * g.skyHor.w;
    c = mix(c, g.cloudLit.rgb * 0.9, ci);
    /* облака лепит свет ключа: его сторона и высота, довёрнутые к зрителю */
    let sl = normalize(g.sunDir.xyz);
    let lc = normalize(vec3f(sl.x, max(sl.y, 0.12) + 0.10, -0.35 - 0.3 * abs(sl.z)));
    let hz = horizonCol(rd);
    let warm = sunSide(rd);
    /* дальняя гряда низко над землёй */
    if (g.skyHorS.w > 0.0) {
      let b = cloudBank(a2, e2, 0.055, 0.014, 0.034, g.skyHorS.w, 3u + sd, lc);
      if (b.y > 0.0) {
        let l = smoothstep(-0.35, 0.55, b.x);
        var cc = mix(mix(g.cloudDark.rgb, g.cloudDarkS.rgb, warm), g.cloudLit.rgb * 0.9, l);
        cc = mix(cc, hz, 0.45);
        c = mix(c, cc, b.y * smoothstep(b.w - 0.002, b.w + 0.003, e2) * 0.9);
      }
    }
    /* облака этого неба, расставленные кадром */
    var h = vec4f(0.0, 0.0, -1.0, 0.0);
    let nc = i32(g.world.z);
    for (var k = 0; k < nc; k++) {
      let q = g.clouds[k];
      h = cloudOne(a2, e2, q.xy, q.z, u32(q.w), lc, h);
    }
    if (h.y > 0.0) {
      let l = smoothstep(-0.35, 0.55, h.x);
      let dark = mix(g.cloudDark.rgb, g.cloudDarkS.rgb, warm);
      var cc = mix(dark, g.cloudLit.rgb, l);
      cc *= mix(0.80, 1.0, smoothstep(h.w, h.w + 0.03, e2));
      cc = mix(cc, hz, exp(-e2 / 0.045) * 0.55);
      c = mix(c, cc, h.y * smoothstep(h.w - 0.003, h.w + 0.004, e2));
    }
  }
  return c;
}

/* ── воздух ── */
fn fogAmount(dist: f32, yAvg: f32) -> f32 {
  let od = pow(dist / 1938.0, 0.713) * exp(-clamp(yAvg, 0.0, 300.0) * g.airFarS.w) * g.airFar.w;
  return min(1.0 - exp(-od), 0.92);
}
/* цвет воздуха: синее и темнее неба у горизонта, чтобы каждый дальний план стоял силуэтом
   на небе, а не таял в нём; вблизи — оттенок земли */
fn airCol(rd: vec3f, dist: f32) -> vec3f {
  let far = mix(g.airFar.rgb, g.airFarS.rgb, sunSide(rd) * 0.8);
  return mix(far * g.airNear.rgb, far, smoothstep(150.0, 1500.0, dist));
}
fn applyFog(col: vec3f, wpos: vec3f, cap: f32) -> vec3f {
  let d = wpos - g.camPos.xyz; let dist = length(d); let rd = d / dist;
  let f = fogAmount(dist, 0.5 * (wpos.y + g.camPos.y) - g.waterB.w) * cap;
  return mix(col, airCol(rd, dist), f);
}
/* тени облаков на земле; герой стоит в пятне света */
fn cloudLight(p: vec3f) -> f32 {
  let t = g.camPos.w;
  let l = normalize(g.sunDir.xyz);
  let ly = max(l.y, 0.08);
  /* высота считается от уровня здешней сцены, а не от нуля мира */
  let q = p.xz - l.xz * ((p.y - g.waterB.w) / ly);
  let n = fbm(vec2f(q.x * 0.0045 + t * 0.006, q.y * 0.0085 + 3.7), 7u + u32(g.world.x));
  let lo = 0.43 + (0.5 - g.cloudLit.w) * 0.5;
  var c = mix(0.34, 1.0, smoothstep(lo, lo + 0.17, n));
  /* планы разводит свет: тень лежит в ложбине за дальним берегом и у подножия холмов, гребни
     стоят на солнце; то же между грядой и горами */
  let e = (fbm(vec2f(q.x * 0.012 + 2.0, q.y * 0.02), 19u) - 0.5) * 70.0;
  let band = smoothstep(g.bands.x, g.bands.x + 45.0, q.y + e) * (1.0 - smoothstep(g.bands.y - 45.0, g.bands.y, q.y + e));
  let band2 = smoothstep(g.bands.z, g.bands.z + 250.0, q.y + e * 6.0) * (1.0 - smoothstep(g.bands.w - 500.0, g.bands.w, q.y + e * 6.0));
  c = min(c, 1.0 - 0.62 * max(band, band2 * 0.8));
  let d = length((q - g.hero.xy) * vec2f(1.0, 1.7));
  c = max(c, 1.0 - smoothstep(g.hero.z, g.hero.w, d));
  return c;
}
/* ближний склон стоит в тени, как под кронами за спиной объектива: тёмная кулиса сцены.
   У тени очертание крон, и солнце пробивает её пятнами. */
fn nearShadeZ(z: f32) -> f32 { return mix(0.26, 1.0, smoothstep(-16.0, -3.0, z)); }
fn nearShade(p: vec3f) -> f32 {
  let n = fbm(p.xz * 0.09 + vec2f(3.1, 7.7), 23u) - 0.5;
  let e = p.z + n * 13.0;
  var s = smoothstep(-12.5, -6.5, e);
  let d1 = fbm(p.xz * vec2f(0.50, 0.75) + vec2f(9.0, 2.0), 29u);
  let d2 = fbm(p.xz * vec2f(1.6, 2.2) + vec2f(1.0, 5.0), 37u);
  let dap = smoothstep(0.50, 0.62, d1 * 0.72 + d2 * 0.28);
  s = max(s, dap * 0.85 * smoothstep(-24.0, -9.0, e));
  /* и тень бросает вперёд, на свет, несколько пальцев */
  let fin = smoothstep(0.60, 0.70, fbm(p.xz * vec2f(0.34, 0.5) + vec2f(4.0, 8.0), 43u));
  s *= 1.0 - 0.55 * fin * (1.0 - smoothstep(-8.0, -3.5, e));
  return mix(0.26, 1.0, s);
}
`;
