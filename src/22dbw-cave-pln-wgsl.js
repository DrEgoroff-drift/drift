/* ══════════════ пещера на движке: шейдеры (M630a) ══════════════
   Перенос стенда docs/look/cv-wgsl.js в вершины движка (две очереди: сетка и запись, 21pc).
   Под землёй ключ — фонарь человека: конус с настоящей тенью (своя перспективная карта).
   День падает в столб устья вторым светом со своей картой; что светится само — мало и без тени.
   Воздух держит свет: конус фонаря и лучи дня видны в нём (шагами по лучу в полкадра).
   Тона идут полосами: лист разреза темнее всего, потом пустота без света, потом даль в дымке,
   потом то, до чего достаёт фонарь, потом сами огни. */
const CAVE3_WGSL_COMMON=/* wgsl */`
struct Globals {
  viewProj: mat4x4f,
  invViewProj: mat4x4f,
  lampVP: mat4x4f,
  sunVP: mat4x4f,
  camPos: vec4f,      // xyz, время
  lampPos: vec4f,     // xyz, длина, на которой свет слабеет вдвое
  lampDir: vec4f,     // xyz, cos внешнего угла
  lampCol: vec4f,     // rgb, cos внутреннего угла
  sunDir: vec4f,      // xyz к свету, уровень воды
  sunCol: vec4f,      // rgb, выдержка
  screen: vec4f,      // w, h, 1/w, 1/h
  misc: vec4f,        // срез по y, 1 зеркало / -1 кулиса, z разреза, густота дымки
  amb: vec4f,         // rgb, толщина пласта
  fogCol: vec4f,      // rgb, сдвиг тени дня
  ptPos: array<vec4f, 12>,    // xyz, досягаемость
  ptCol: array<vec4f, 12>,    // rgb
  glowPos: array<vec4f, 6>,   // xyz, сила ореола
  glowCol: array<vec4f, 6>,   // rgb, ширина ореола
  mouth: vec4f,       // ось столба устья на поверхности: x, z; полуоси по x и z
  dayP: vec4f,        // наклон дня по x и z на метр высоты, высота поверхности, досягаемость фонаря
  skyLo: vec4f,       // небо у горизонта, сила дня
  skyHi: vec4f,       // небо в зените, где фонарь начинает слабеть
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

/* фонарь в точке: путь к нему и сколько его света приходит (конус и расстояние) */
fn lampAt(p: vec3f) -> vec4f {
  let d = g.lampPos.xyz - p; let dl = max(length(d), 0.001); let L = d / dl;
  let cs = dot(-L, g.lampDir.xyz);
  let cone = smoothstep(g.lampDir.w, g.lampCol.w, cs);
  /* у фонаря своя досягаемость: дальше зал принадлежит другим огням */
  let att = pow(1.0 + dl / g.lampPos.w, -1.6) * (1.0 - smoothstep(g.skyHi.w, g.dayP.w, dl));
  let hot = 1.0 + 0.7 * smoothstep(0.86, 1.0, cs);
  return vec4f(L, cone * att * hot);
}
/* лист разреза и то, что на нём, темнеют к краям кадра: сцена в середине */
fn faceDim(fragXY: vec2f) -> f32 {
  let q = (fragXY * g.screen.zw - 0.5) * vec2f(1.0, 0.85);
  return mix(1.0, 0.7, smoothstep(0.22, 0.62, length(q)));
}
/* дымка: чем дальше за разрезом, тем больше цвета тёмного воздуха */
fn haze(c: vec3f, wpos: vec3f, cap: f32) -> vec3f {
  let d = max(wpos.z - g.misc.z, 0.0);
  return mix(c, g.fogCol.rgb, (1.0 - exp(-d * g.misc.w)) * cap);
}
/* день живёт только в столбе устья: луч дня держит место в плане на высоте поверхности;
   shaftOf — как далеко это место от оси столба, в полуосях. Карта тени течёт в щелях пластов,
   маска — нет */
fn dayPlan(p: vec3f) -> vec2f {
  let k = g.dayP.z - p.y;
  return vec2f(p.x - g.dayP.x * k, p.z + g.dayP.y * k);
}
fn shaftOf(o: vec2f) -> f32 { return length((o - g.mouth.xy) / g.mouth.zw); }
/* день ярче всего там, где ложится: к верху кадра он придержан, иначе глаз уходит в угол */
fn dayTop(y: f32) -> f32 { return mix(1.0, 0.42, smoothstep(g.dayP.z - 6.0, g.dayP.z + 0.5, y)); }
fn dayMask(p: vec3f) -> f32 { return (1.0 - smoothstep(1.25, 1.7, shaftOf(dayPlan(p)))) * dayTop(p.y) * g.skyLo.w; }
`;

const CAVE3_WGSL_SCENE=CAVE3_WGSL_COMMON+/* wgsl */`
@group(0) @binding(1) var lampTex: texture_depth_2d;
@group(0) @binding(2) var sunTex: texture_depth_2d;
@group(0) @binding(3) var cmpSamp: sampler_comparison;

struct VIn {
  @location(0) pos: vec3f,
  @location(1) nrm: vec3f,
  @location(2) col: vec3f,
  @location(3) par: vec4f,    // материал, ветер, свечение, запас
  @location(4) i0: vec4f,     // место, размер
  @location(5) i1: vec4f,     // cos и sin поворота, доля высоты, семя
  @location(6) i2: vec4f,     // цвет А, режим цвета
  @location(7) i3: vec4f,     // цвет Б
};
struct VOut {
  @builtin(position) pos: vec4f,
  @location(0) wpos: vec3f,
  @location(1) nrm: vec3f,
  @location(2) col: vec3f,
  @location(3) par: vec4f,
};
/* запись расстановки, как у движка (21pc placeAt), без дальнего мира */
fn placeAt(p: vec3f, i0: vec4f, i1: vec4f) -> vec3f {
  let sc = abs(i0.w);
  let roll = select(0.0, i1.w, i0.w < 0.0);
  let q0 = p * vec3f(sc, sc * i1.z, sc);
  let cr = cos(roll); let sr = sin(roll);
  let q = vec3f(q0.x * cr - q0.y * sr, q0.x * sr + q0.y * cr, q0.z);
  return i0.xyz + vec3f(q.x * i1.x + q.z * i1.y, q.y, q.z * i1.x - q.x * i1.y);
}
fn turnBy(n: vec3f, i0: vec4f, i1: vec4f) -> vec3f {
  let roll = select(0.0, i1.w, i0.w < 0.0);
  let q0 = vec3f(n.x, n.y / max(i1.z, 0.05), n.z);
  let cr = cos(roll); let sr = sin(roll);
  let q = vec3f(q0.x * cr - q0.y * sr, q0.x * sr + q0.y * cr, q0.z);
  let m = length(n);
  return normalize(vec3f(q.x * i1.x + q.z * i1.y, q.y, q.z * i1.x - q.x * i1.y)) * m;
}

@vertex fn vs_main(in: VIn) -> VOut {
  var o: VOut;
  let p = placeAt(in.pos, in.i0, in.i1);
  o.pos = g.viewProj * vec4f(p, 1.0);
  o.wpos = p;
  /* лист разреза несёт в нормали путь к пустоте вместе с уверенностью — её длину не трогаем */
  if (in.par.x > 9.5 && in.par.x < 10.5) { o.nrm = in.nrm; } else { o.nrm = turnBy(in.nrm, in.i0, in.i1); }
  var c = in.col * in.i2.rgb;
  if (in.i2.w > 0.5) {
    let ramp = mix(in.i2.rgb, in.i3.rgb, in.col.r) * (0.5 + in.col.g);
    let leafy = (in.par.x > 1.5 && in.par.x < 2.5) || (in.par.x > 6.5 && in.par.x < 7.5);
    if (in.i2.w < 1.5 || leafy) { c = ramp; } else { c = in.col; }
  }
  o.col = c; o.par = in.par;
  return o;
}
/* матрица света, чью карту рисуют, лежит в ячейке фонаря */
@vertex fn vs_shadow(@location(0) pos: vec3f, @location(4) i0: vec4f, @location(5) i1: vec4f) -> @builtin(position) vec4f {
  return g.lampVP * vec4f(placeAt(pos, i0, i1), 1.0);
}

struct FOut { @builtin(position) pos: vec4f, @location(0) uv: vec2f };
@vertex fn vs_full(@builtin(vertex_index) i: u32) -> FOut {
  var o: FOut;
  let p = vec2f(f32((i << 1u) & 2u), f32(i & 2u));
  o.pos = vec4f(p * 2.0 - 1.0, 0.0, 1.0);
  o.uv = vec2f(p.x, 1.0 - p.y);
  return o;
}
/* фон: над поверхностью мира — его небо (днём), ниже — тёмный воздух пещеры */
@fragment fn fs_sky(in: FOut) -> @location(0) vec4f {
  let ndc = vec2f(in.uv.x * 2.0 - 1.0, 1.0 - in.uv.y * 2.0);
  let pn = g.invViewProj * vec4f(ndc, 0.5, 1.0);
  let rd = normalize(pn.xyz / pn.w - g.camPos.xyz);
  let t = (g.misc.z - g.camPos.z) / max(rd.z, 0.001);
  let y = g.camPos.y + rd.y * t;
  let up = smoothstep(g.dayP.z - 0.2, g.dayP.z + 0.6, y);
  let sky = mix(g.skyLo.rgb, g.skyHi.rgb, smoothstep(g.dayP.z, g.dayP.z + 14.0, y));
  return vec4f(mix(g.fogCol.rgb, sky, up), 1.0);
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
  return tap9(lampTex, uv, q.z - 0.004 / (lp.w * lp.w), 3.0 / 2048.0, ign(fragXY) * TAU);
}
fn sunShade(wpos: vec3f, n: vec3f, fragXY: vec2f) -> f32 {
  let p = wpos + n * 0.05;
  let lp = g.sunVP * vec4f(p, 1.0);
  let uv = lp.xy * vec2f(0.5, -0.5) + 0.5;
  if (uv.x < 0.002 || uv.x > 0.998 || uv.y < 0.002 || uv.y > 0.998 || lp.z <= 0.0 || lp.z >= 1.0) { return 0.0; }
  return tap9(sunTex, uv, lp.z - g.fogCol.w, 2.5 / 2048.0, ign(fragXY) * TAU + 1.3);
}
/* пласт, в котором лежит точка: та же линия, по которой построена порода (22da) */
fn strat(p: vec3f) -> f32 {
  let s = p.y - 0.06 * p.x + 0.25 * sin(p.x * 0.09 + p.z * 0.05);
  return (s + 0.28 * sin(s * 1.9 + 0.7)) / g.amb.w;
}
/* огни без теней */
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
    /* кристалл светит изнутри: грани разные, рёбра горят */
    let fac = 0.40 + 0.60 * clamp(dot(fN, normalize(vec3f(-0.35, 0.8, -0.5))), 0.0, 1.0);
    let rim = pow(1.0 - clamp(dot(fN, V), 0.0, 1.0), 2.0);
    return vec4f(haze(in.col * glow * (fac + rim * 0.9), in.wpos, 0.55), 1.0);
  }
  if (mat == 10) {
    /* лист разреза: пласты и их прослои на тёмном и кромка, что берёт свет пустоты */
    let b = strat(in.wpos); let f = fract(b);
    let n1 = vn3(in.wpos * vec3f(0.9, 2.2, 0.9), 71u);
    let n2 = vn3(in.wpos * vec3f(0.23, 0.6, 0.23) + 5.0, 73u);
    let ln = 1.0 - smoothstep(0.0, 0.035 + 0.03 * n1, min(f, 1.0 - f));
    let lam = fract(b * 5.0 + n2 * 1.5);
    let l2 = (1.0 - smoothstep(0.0, 0.10, min(lam, 1.0 - lam))) * smoothstep(0.35, 0.6, n2);
    let n3 = vn3(in.wpos * vec3f(3.1, 7.0, 3.1), 75u);
    var c = in.col * (0.72 + 0.4 * n2 + 0.16 * n3);
    /* над пластами — земля, из неё идут корни: тёплая, с мелким камнем, без пластов */
    let soil = smoothstep(g.dayP.z - 1.6, g.dayP.z - 0.6, in.wpos.y + 0.8 * (n2 - 0.5) + 0.35 * sin(in.wpos.x * 0.35));
    c *= 1.0 - 0.6 * ln * (1.0 - soil);
    c += in.col * 0.35 * l2 * (1.0 - soil);
    let grit = vn3(in.wpos * vec3f(2.3, 2.3, 1.0), 77u);
    c = mix(c, vec3f(0.0085, 0.0062, 0.0048) * (0.7 + 0.6 * n3) + vec3f(0.012, 0.011, 0.010) * smoothstep(0.7, 0.78, grit), soil);
    /* свет пустоты на камне вокруг неё: отсвет, что гаснет за несколько метров, и кромка
       разреза, которая горит. Свет спрашивают внутри пустоты, за кромкой; в запасе — как далеко */
    let nl = length(in.nrm);
    let Ni = in.nrm / max(nl, 0.0001);
    let sure = smoothstep(0.45, 0.95, nl);
    let lip = pow(1.0 - smoothstep(0.0, 0.5, ex), 2.0);
    let wash = pow(1.0 - smoothstep(0.0, 3.6, ex), 2.0) * sure;
    c *= faceDim(in.pos.xy);
    /* холодная заливка от устья: днём страница у входа светлее и голубее, вглубь гаснет */
    let md = length(vec2f(in.wpos.x - g.mouth.x, (g.dayP.z - in.wpos.y) * 0.8));
    c += in.col * vec3f(0.55, 0.78, 1.05) * (g.skyLo.w * 1.1 * exp(-md / 16.0) * (1.0 - soil));
    if (wash + lip > 0.002) {
      let Nr = normalize(Ni + vec3f(0.0, 0.0, -0.6));
      let q = in.wpos + Ni * (ex + 0.22) + vec3f(0.0, 0.0, 0.30);
      var light = g.amb.rgb * 0.8;
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
  if ((mat == 7 || mat == 2) && dot(N, V) < 0.0) { N = -N; }
  var alb = in.col; var ao = 1.0; var wet = 0.0; var emis = 0.0; var wrap = 0.0;
  if (mat == 1) {
    ao = ex; wet = glow;
    N = normalize(mix(N, fN, 0.4));
    let n1 = vn3(in.wpos * 1.3, 3u); let n2 = vn3(in.wpos * 4.7, 5u); let n3 = vn3(in.wpos * 14.0, 7u);
    alb *= 0.76 + 0.26 * n1 + 0.14 * n2 + 0.10 * n3;
    /* мелкий рельеф, которого нет в сетке: бугры в ладонь и зерно — фонарь скользит по ним */
    let bp = in.wpos * 2.2; let bq = in.wpos * 7.0;
    let b0 = vn3(bp, 31u); let q0 = vn3(bq, 33u);
    let gb = vec3f(vn3(bp + vec3f(0.07, 0.0, 0.0), 31u), vn3(bp + vec3f(0.0, 0.07, 0.0), 31u), vn3(bp + vec3f(0.0, 0.0, 0.07), 31u)) - b0;
    let gq = vec3f(vn3(bq + vec3f(0.07, 0.0, 0.0), 33u), vn3(bq + vec3f(0.0, 0.07, 0.0), 33u), vn3(bq + vec3f(0.0, 0.0, 0.07), 33u)) - q0;
    let gr = (gb * 0.30 + gq * 0.12) / 0.07;
    N = normalize(N - (gr - N * dot(gr, N)));
    ao *= 0.72 + 0.28 * smoothstep(0.2, 0.65, b0);
    /* натёчные борозды на стене, что смотрит на нас: пятнами, сверху вниз; фонарь ловит рёбра, не плоскость */
    let wf = smoothstep(0.25, 0.7, -N.z) * smoothstep(0.6, 1.6, in.wpos.z);
    if (wf > 0.001) {
      /* ребро к ребру разной ширины; пучками, между ними гладко; каждое кончается на своей высоте */
      let u = in.wpos.x * 1.7 + 1.8 * vn3(in.wpos * vec3f(0.5, 0.1, 0.5), 45u);
      let id = floor(u); let fu = u - id;
      let rh = hash2(vec2i(i32(id), 7), 51u);
      let run = smoothstep(0.35, 0.6, vn3(vec3f(id * 1.37, in.wpos.y * 0.5, in.wpos.z * 0.3), 53u));
      let mk = wf * run * step(0.3, rh) * (0.5 + 0.5 * rh) * smoothstep(0.3, 0.55, vn3(in.wpos * vec3f(0.25, 0.4, 0.25) + vec3f(7.0, 0.0, 3.0), 43u));
      let sr = sin(3.14159 * fu); let cr = cos(3.14159 * fu);
      N = normalize(N + vec3f(-cr * 0.7 * mk, 0.0, 0.0));
      ao *= 1.0 - 0.3 * mk * (1.0 - sr);
      alb *= 1.0 + 0.08 * mk * (sr - 0.5);
    }
    let b = strat(in.wpos); let f = fract(b);
    let wall = 1.0 - smoothstep(0.5, 0.9, abs(N.y));
    /* пласты — только на разрезе; на стене пласт лишь чуть меняет тон, без линии */
    alb *= 0.9 + 0.12 * sin(3.14159 * f) * wall;
    /* в полном дне камень носит мох: на том, что смотрит вверх, пятнами */
    let dmm = dayMask(in.wpos);
    if (dmm > 0.001) {
      let mn = vn3(in.wpos * 0.7 + vec3f(3.0, 0.0, 1.0), 41u);
      let mk = dmm * smoothstep(0.35, 0.9, N.y) * smoothstep(0.4, 0.65, mn) * 0.85;
      alb = mix(alb, mix(vec3f(0.05, 0.19, 0.12), vec3f(0.16, 0.30, 0.05), n2), mk);
    }
  }
  if (mat == 11) {
    ao = ex; wet = glow; wrap = 0.45;
    alb *= 0.85 + 0.3 * vn3(in.wpos * vec3f(3.0, 0.7, 3.0), 9u);
  }
  if (mat == 15) {
    /* завеса: тонкий лист, свет идёт сквозь него */
    ao = ex; wet = glow; wrap = 0.5;
    alb *= 0.9 + 0.2 * vn3(in.wpos * vec3f(2.0, 5.0, 2.0), 11u);
  }
  /* человек и звери: свечение в запасе (стекло шлема, огни ранца) */
  if (mat == 4 || mat == 8) { wet = 0.35; emis = glow; }
  if (mat == 7) { ao = mix(0.5, 1.0, smoothstep(0.0, 0.7, ex)); emis = glow; }
  if (mat == 2) { emis = glow; }

  var c = alb * g.amb.rgb * (ao * mix(0.6, 1.25, N.y * 0.5 + 0.5));
  let ll = lampAt(in.wpos);
  if (ll.w > 0.0005) {
    let ndl = dot(N, ll.xyz);
    var lit = smoothstep(-0.08 - wrap, 0.5, ndl);
    if (mat == 7 || mat == 2) { lit = smoothstep(-0.5, 0.5, ndl); }
    let e = g.lampCol.rgb * (ll.w * lampShade(in.wpos, N, in.pos.xy));
    c += alb * e * (lit * mix(1.0, ao, 0.6));
    let hv = normalize(ll.xyz + V);
    c += e * (pow(clamp(dot(N, hv), 0.0, 1.0), mix(18.0, 80.0, wet)) * wet * lit * 0.9);
    /* натёк пускает свет в свои края */
    if (mat == 11) { c += alb * e * (pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.0) * 0.35 * smoothstep(-0.6, 0.2, ndl)); }
    if (mat == 15) { c += alb * vec3f(1.25, 0.8, 0.45) * e * (clamp(-ndl, 0.0, 1.0) * 0.7 + 0.12); }
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
    let hv = normalize(Ls + V);
    c += e * (pow(clamp(dot(N, hv), 0.0, 1.0), mix(18.0, 80.0, wet)) * wet * lit * 0.5);
  }
  var even = 0.0;
  if (mat == 11 || mat == 15) { even = 0.35; }
  c += alb * points(in.wpos, N, even) * mix(0.5, 1.0, ao);
  c += alb * emis;
  return vec4f(haze(c, in.wpos, 1.0), 1.0);
}
`;

const CAVE3_WGSL_POST=CAVE3_WGSL_COMMON+/* wgsl */`
struct PostP { a: vec4f, b: vec4f };
@group(0) @binding(1) var<uniform> pp: PostP;
@group(0) @binding(2) var texA: texture_2d<f32>;
@group(0) @binding(3) var texB: texture_2d<f32>;
@group(0) @binding(4) var texC: texture_2d<f32>;
@group(0) @binding(5) var samp: sampler;
@group(0) @binding(6) var depthTex: texture_depth_2d;
@group(0) @binding(7) var lampTex: texture_depth_2d;
@group(0) @binding(8) var sunTex: texture_depth_2d;
@group(0) @binding(9) var cmpSamp: sampler_comparison;

struct FOut { @builtin(position) pos: vec4f, @location(0) uv: vec2f };
@vertex fn vs_full(@builtin(vertex_index) i: u32) -> FOut {
  var o: FOut;
  let p = vec2f(f32((i << 1u) & 2u), f32(i & 2u));
  o.pos = vec4f(p * 2.0 - 1.0, 0.0, 1.0);
  o.uv = vec2f(p.x, 1.0 - p.y);
  return o;
}
/* a = (шаг по x, шаг по y) в uv */
@fragment fn fs_blur(in: FOut) -> @location(0) vec4f {
  let d = pp.a.xy;
  var c = textureSampleLevel(texA, samp, in.uv, 0.0) * 0.227027;
  c += (textureSampleLevel(texA, samp, in.uv + d * 1.3846154, 0.0) + textureSampleLevel(texA, samp, in.uv - d * 1.3846154, 0.0)) * 0.3162162;
  c += (textureSampleLevel(texA, samp, in.uv + d * 3.2307692, 0.0) + textureSampleLevel(texA, samp, in.uv - d * 3.2307692, 0.0)) * 0.0702703;
  return c;
}
/* свечение: a = (тексель источника) */
@fragment fn fs_down(in: FOut) -> @location(0) vec4f {
  let d = pp.a.xy;
  var c = textureSampleLevel(texA, samp, in.uv, 0.0) * 4.0;
  c += textureSampleLevel(texA, samp, in.uv + vec2f(-d.x, -d.y), 0.0);
  c += textureSampleLevel(texA, samp, in.uv + vec2f(d.x, -d.y), 0.0);
  c += textureSampleLevel(texA, samp, in.uv + vec2f(-d.x, d.y), 0.0);
  c += textureSampleLevel(texA, samp, in.uv + vec2f(d.x, d.y), 0.0);
  return vec4f(min(c.rgb / 8.0, vec3f(24.0)), 1.0);
}
/* texA — меньшая ступень, texB — ступень этого размера */
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

/* свет, который держит воздух: шагами от разреза до первого тела сквозь тень фонаря и тень дня.
   a = (фонарь, день, ореолы, шагов), b = (досягаемость луча) */
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
  let t0 = (g.misc.z - g.camPos.z) / max(rd.z, 0.001);
  if (dist <= t0 + 0.05) { return vec4f(0.0, 0.0, 0.0, 1.0); }
  let span = dist - t0;
  let jit = ign(in.pos.xy);
  let n = i32(pp.a.w);
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
          /* свет, что бежит к объективу, виден ярче бокового; воздух показывает сердце конуса и
             отпускает его за несколько метров, иначе весь зал стоит в молоке */
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
    if (e < 1.7 && g.skyLo.w > 0.01) {
      let sp = g.sunVP * vec4f(p, 1.0);
      let suv = sp.xy * vec2f(0.5, -0.5) + 0.5;
      if (suv.x > 0.0 && suv.x < 1.0 && suv.y > 0.0 && suv.y < 1.0 && sp.z > 0.0 && sp.z < 1.0) {
        let sh = textureSampleCompareLevel(sunTex, cmpSamp, suv, sp.z - g.fogCol.w);
        if (sh > 0.0) {
          /* луч мягок по бокам и стоит лезвиями: лезвие держит место вдоль луча дня и вдоль взгляда
             объектива, поэтому видно с ребра. Пыль висит в нём медленными складками */
          let edge = 1.0 - smoothstep(0.30, 1.5, e);
          let u = (o.x - g.camPos.x) / max(o.y - g.camPos.z, 1.0);
          let b1 = vnoise(vec2f(u * 70.0 + g.camPos.w * 0.010, 0.5), 43u);
          let b2 = vnoise(vec2f(u * 190.0 - g.camPos.w * 0.016, 1.5), 44u);
          let blade = 0.30 + 1.5 * pow(b1 * 0.7 + b2 * 0.3, 2.0);
          let du = 0.7 + 0.6 * vn3(p * vec3f(0.5, 0.25, 0.5) + vec3f(0.0, -g.camPos.w * 0.03, 0.0), 41u);
          accS += sh * edge * blade * du * dayTop(p.y) * g.skyLo.w;
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
/* обратное плечо финала движка (как 21pd) */
fn unshoulder(d: vec3f) -> vec3f {
  let x = clamp(d, vec3f(0.0), vec3f(0.999));
  let hi = 0.75 - 0.25 * log(max(1.0 - (x - 0.75) / 0.25, vec3f(0.004)));
  return select(x, hi, x > vec3f(0.75));
}
/* texA — кадр, texB — свечение, texC — свет в воздухе. a = (свечение, виньетка, свёртка цвета) */
@fragment fn fs_comp(in: FOut) -> @location(0) vec4f {
  var c = textureSampleLevel(texA, samp, in.uv, 0.0).rgb;
  c = max(c + textureSampleLevel(texC, samp, in.uv, 0.0).rgb, vec3f(0.0));
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
  return vec4f(unshoulder(c), 1.0);
}
`;
