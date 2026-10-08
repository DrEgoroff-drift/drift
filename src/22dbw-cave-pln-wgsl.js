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
  zone: array<vec4f, 4>,      // залы в кадре: x0, x1 (м), отделка стены (0 рёбра, 1 друза, 2 шов, 3 гладь)
  farDay: vec4f,      // дальний зал (22de): окно свода x, z, радиус луча, высота окна
  farK: vec4f,        // сила дальнего дня (0 — зала в кадре нет), где тепло фонаря кончается, сырость воздуха
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
  let att = pow(1.0 + dl / g.lampPos.w, -1.55) * (1.0 - smoothstep(g.skyHi.w, g.dayP.w, dl));
  let hot = 1.0 + 0.7 * smoothstep(0.86, 1.0, cs);
  return vec4f(L, cone * att * hot);
}
/* цвет фонаря на камне: тёплый вблизи (лужа, ближняя стена), дальше — холодный серый той же силы,
   чтобы камень вне ближнего круга держал тон страницы; farK.yz — где тепло кончается */
fn lampTint(p: vec3f) -> vec3f {
  let w = 1.0 - smoothstep(g.farK.y, g.farK.z, length(p - g.lampPos.xyz));
  let l = dot(g.lampCol.rgb, vec3f(0.3, 0.5, 0.2));
  return mix(l * vec3f(0.62, 0.8, 1.12), g.lampCol.rgb, w);
}
/* под плашками приборов свечение гаснет: вещь не стоит под плашкой (рамки — в zone[i].w, пиксели кадра:
   правый край и низ борта слева, левый край и низ места справа); гасит до 8 %: свечение втрое выше белого,
   четверть после тонмапа ещё светится) */
fn hudDim(xy: vec2f) -> f32 {
  let l = (1.0 - smoothstep(g.zone[0].w, g.zone[0].w + 40.0, xy.x)) * (1.0 - smoothstep(g.zone[1].w, g.zone[1].w + 40.0, xy.y));
  let r = smoothstep(g.zone[2].w - 40.0, g.zone[2].w, xy.x) * (1.0 - smoothstep(g.zone[3].w, g.zone[3].w + 40.0, xy.y));
  return 1.0 - 0.92 * max(l, r);
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
/* дальний зал: свой столб дня сквозь окно свода; карты тени нет — окно и есть тень */
fn farOf(p: vec3f) -> f32 {
  let k = g.farDay.w - p.y;
  return length(vec2f(p.x - g.dayP.x * k, p.z + g.dayP.y * k) - g.farDay.xy) / g.farDay.z;
}
fn farDay(p: vec3f) -> f32 {
  if (g.farK.x <= 0.0) { return 0.0; }
  return (1.0 - smoothstep(0.7, 1.15, farOf(p))) * g.skyLo.w * g.farK.x * step(g.farDay.w - 30.0, p.y);
}
`;

const CAVE3_WGSL_SCENE=CAVE3_WGSL_COMMON+/* wgsl */`
@group(0) @binding(1) var lampTex: texture_depth_2d;
@group(0) @binding(2) var sunTex: texture_depth_2d;
@group(0) @binding(3) var cmpSamp: sampler_comparison;
@group(0) @binding(4) var reflTex: texture_2d<f32>;
@group(0) @binding(5) var linSamp: sampler;

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
/* отделка стены там, где точка: рёбра, друза, гладь — с мягким переходом на стыке залов */
fn finish(x: f32) -> vec3f {
  var f = vec3f(0.0); var any = 0.0;
  for (var i = 0; i < 4; i++) {
    let z = g.zone[i];
    if (z.y <= z.x) { continue; }
    let w = smoothstep(z.x - 2.5, z.x + 2.5, x) * (1.0 - smoothstep(z.y - 2.5, z.y + 2.5, x));
    let k = i32(round(z.z));
    if (k == 0) { f.x += w; } else if (k == 1) { f.y += w; } else if (k == 3) { f.z += w; }
    any += w;
  }
  if (any < 0.001) { return vec3f(1.0, 0.0, 0.0); }
  return f;
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
/* блик огней на мокром: мокрая стена ловит свет событий и кристаллов, а не только фонарь */
fn pointSpec(wpos: vec3f, N: vec3f, V: vec3f, wet: f32) -> vec3f {
  var c = vec3f(0.0);
  for (var i = 0; i < 12; i++) {
    let lp = g.ptPos[i];
    if (lp.w <= 0.0) { continue; }
    let d = lp.xyz - wpos; let dl = max(length(d), 0.001);
    let att = pow(clamp(1.0 - dl / lp.w, 0.0, 1.0), 2.0);
    let h = normalize(d / dl + V);
    c += g.ptCol[i].rgb * (att * pow(clamp(dot(N, h), 0.0, 1.0), mix(18.0, 80.0, wet)) * step(0.0, dot(N, d)));
  }
  return c;
}

@fragment fn fs_main(in: VOut) -> @location(0) vec4f {
  let fx = dpdx(in.wpos); let fy = dpdy(in.wpos);
  /* в зеркале озера то, что под водой, не отражается */
  if (g.misc.y > 0.5 && in.wpos.y < g.misc.x) { discard; }
  let mat = i32(round(in.par.x));
  let glow = in.par.z; let ex = in.par.w;
  let V = normalize(g.camPos.xyz - in.wpos);
  var fN = normalize(cross(fx, fy));
  if (dot(fN, V) < 0.0) { fN = -fN; }
  if (mat == 5) {
    var c5 = in.col * glow * hudDim(in.pos.xy);
    if (in.wpos.z < g.misc.z) { c5 *= faceDim(in.pos.xy); }
    return vec4f(haze(c5, in.wpos, 0.7), 1.0);
  }
  if (mat == 12) {
    /* кристалл светит изнутри: сердце ярче края; грани делит свет — своя доля неба и фонаря на каждой */
    let nv = clamp(dot(fN, V), 0.0, 1.0);
    let fac = 0.25 + 0.45 * clamp(dot(fN, normalize(vec3f(-0.35, 0.8, -0.5))), 0.0, 1.0);
    let ll = lampAt(in.wpos);
    let lmp = ll.w * clamp(dot(fN, ll.xyz), 0.0, 1.0);
    let hv = normalize(ll.xyz + V);
    var cc = in.col * glow * (fac + 1.1 * pow(nv, 1.6) + 0.15 * pow(1.0 - nv, 3.0));
    cc += lampTint(in.wpos) * (in.col * lmp * 0.5 + vec3f(ll.w * pow(clamp(dot(fN, hv), 0.0, 1.0), 60.0) * 1.2));
    return vec4f(haze(cc * hudDim(in.pos.xy), in.wpos, 0.55), 1.0);
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
    /* лист — темнее всего в кадре (.10–.14): камень за ним отделяется от него и тоном, и кромкой */
    c *= faceDim(in.pos.xy) * 0.55;
    /* холодная заливка от устья: днём страница у входа светлее и голубее, вглубь гаснет */
    let md = length(vec2f(in.wpos.x - g.mouth.x, (g.dayP.z - in.wpos.y) * 0.8));
    c += in.col * vec3f(0.55, 0.78, 1.05) * (g.skyLo.w * 0.5 * exp(-md / 6.5) * (1.0 - soil));
    if (wash + lip > 0.002) {
      let Nr = normalize(Ni + vec3f(0.0, 0.0, -0.6));
      let q = in.wpos + Ni * (ex + 0.22) + vec3f(0.0, 0.0, 0.30);
      var light = g.amb.rgb * 0.8;
      let ll = lampAt(q);
      light += lampTint(q) * (ll.w * clamp(dot(Nr, ll.xyz) * 0.6 + 0.4, 0.0, 1.0) * lampShade(q, Nr, in.pos.xy));
      let dm = dayMask(q);
      if (dm > 0.001) { light += g.sunCol.rgb * (dm * clamp(dot(Nr, normalize(g.sunDir.xyz)) * 0.6 + 0.4, 0.0, 1.0) * sunShade(q, Nr, in.pos.xy)); }
      light += points(q, Nr, 0.3);
      c += vec3f(0.34, 0.31, 0.27) * light * (lip * 0.9 + wash * 0.10);
      c += in.col * light * (wash * 0.7);
    }
    return vec4f(c, 1.0);
  }
  /* нормаль на тонком стыке граней сходится в ноль: normalize дал бы NaN, а размытие свечения
     раздуло бы одну битую точку в чёрный шар */
  let nl = dot(in.nrm, in.nrm);
  var N = select(vec3f(0.0, 0.0, -1.0), in.nrm * inverseSqrt(max(nl, 1e-20)), nl > 1e-12);
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
    let fin = finish(in.wpos.x);
    let gr = (gb * 0.10 + gq * 0.10) / 0.07 * (1.0 - 0.7 * fin.z);
    N = normalize(N - (gr - N * dot(gr, N)));
    wet = mix(wet, max(wet, 0.45), fin.z);
    /* камень колется гранями (M623: грани делит свет): плиты по пластам — шире, чем выше; у каждой
       свой наклон, фонарь кладёт на них разный тон; шов между плитами — тёмная трещина. В гроте —
       друза: грани в ладонь и круче. Шов гаснет, когда тоньше пикселя, иначе даль рябит */
    {
      let fsc = mix(vec3f(1.1, 2.0, 1.1), vec3f(2.6, 2.6, 2.6), fin.y);
      let wq = in.wpos * vec3f(0.45, 0.6, 0.45);
      let dp = in.wpos * fsc + vec3f(vn3(wq, 61u), vn3(wq + 3.0, 63u), vn3(wq + 7.0, 65u)) * 1.1;
      let b = vec3i(floor(dp));
      var d1 = 9.0; var d2 = 9.0; var id = b;
      for (var k = 0; k < 27; k++) {
        let o = vec3i(k % 3 - 1, (k / 3) % 3 - 1, k / 9 - 1);
        let c = b + o;
        let q = vec3f(c) + vec3f(hash3(c, 91u), hash3(c, 93u), hash3(c, 95u));
        let d = dot(dp - q, dp - q);
        if (d < d1) { d2 = d1; d1 = d; id = c; } else if (d < d2) { d2 = d; }
      }
      let dn = vec3f(hash3(id, 81u), hash3(id, 83u) * 0.7, hash3(id, 85u)) - vec3f(0.5, 0.35, 0.5);
      N = normalize(N + dn * mix(0.75 * (1.0 - 0.6 * fin.z), 0.9, fin.y));
      alb *= 1.0 - mix(0.10, 0.3, fin.y) * hash3(id, 87u);
      wet = mix(wet, 0.75, fin.y * step(0.65, hash3(id, 89u)));
      /* трещина — не у каждой плиты: пучками, где камень колется, и тоньше к краю пучка */
      let e = sqrt(d2) - sqrt(d1);
      let pw = length((abs(fx) + abs(fy)) * fsc);
      let crk = smoothstep(0.5, 0.75, vn3(in.wpos * vec3f(0.6, 0.9, 0.6) + 11.0, 67u));
      let seam = (1.0 - smoothstep(0.0, max(0.05 * crk, pw * 1.2), e)) * crk * (1.0 - smoothstep(0.12, 0.35, pw));
      ao *= 1.0 - mix(0.4, 0.55, fin.y) * seam;
    }
    ao *= 0.72 + 0.28 * smoothstep(0.2, 0.65, b0);
    /* натёчные борозды на стене, что смотрит на нас: пятнами, сверху вниз; фонарь ловит рёбра, не плоскость */
    let wf = smoothstep(0.25, 0.7, -N.z) * smoothstep(0.6, 1.6, in.wpos.z) * fin.x;
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
    let dmm = dayMask(in.wpos) + farDay(in.wpos);
    if (dmm > 0.001) {
      let mn = vn3(in.wpos * 0.7 + vec3f(3.0, 0.0, 1.0), 41u);
      let mk = dmm * smoothstep(0.35, 0.9, N.y) * smoothstep(0.4, 0.65, mn) * 0.85;
      alb = mix(alb, mix(vec3f(0.05, 0.19, 0.12), vec3f(0.16, 0.30, 0.05), n2), mk);
    }
  }
  if (mat == 11) {
    ao = ex; wet = glow; wrap = 0.3;
    /* натёк тоже гранён (M623): плоскость сетки и наклон по ячейкам в ладонь — фонарь кладёт на грани
       разный тон, гладкой свечи нет */
    N = normalize(mix(N, fN, 0.5));
    let fc = vec3i(floor(in.wpos * vec3f(2.4, 1.6, 2.4) + 0.6 * vn3(in.wpos * 0.8, 19u)));
    N = normalize(N + (vec3f(hash3(fc, 21u), hash3(fc, 23u) * 0.5, hash3(fc, 25u)) - vec3f(0.5, 0.25, 0.5)) * 0.45);
    alb *= 0.88 + 0.2 * hash3(fc, 27u);
    alb *= 0.85 + 0.3 * vn3(in.wpos * vec3f(3.0, 0.7, 3.0), 9u);
    alb *= 0.8 + 0.3 * vn3(in.wpos * vec3f(9.0, 0.6, 9.0), 13u);
    alb *= 1.0 - 0.3 * smoothstep(0.45, 0.95, N.y) * smoothstep(-0.2, 0.4, vn3(in.wpos * 2.5, 15u));
    /* натёк ребрист: борозды сверху вниз, гребень мокрый и ловит фонарь, ложбина в тени */
    let rp = in.wpos * vec3f(7.0, 0.35, 7.0);
    let r0 = vn3(rp, 17u);
    let rg = vec3f(vn3(rp + vec3f(0.08, 0.0, 0.0), 17u) - r0, 0.0, vn3(rp + vec3f(0.0, 0.0, 0.08), 17u) - r0) / 0.08 * 7.0;
    let side = 1.0 - smoothstep(0.55, 0.9, abs(N.y));
    N = normalize(N - (rg - N * dot(rg, N)) * (0.09 * side));
    let crest = smoothstep(0.55, 0.8, r0) * side;
    ao *= 1.0 - 0.35 * (1.0 - smoothstep(0.25, 0.5, r0)) * side;
    wet = mix(wet, max(wet, 0.8), crest);
  }
  if (mat == 15) {
    /* завеса: тонкий лист, свет идёт сквозь него */
    ao = ex; wet = glow; wrap = 0.5;
    alb *= 0.9 + 0.2 * vn3(in.wpos * vec3f(2.0, 5.0, 2.0), 11u);
  }
  /* натёк — не светится сам: окклюзия рядом стоящих держит его в тени темнее стены */
  var ambK = 1.0;
  if (mat == 11) { ambK = 0.45; }
  /* человек и звери: свечение в запасе (стекло шлема, огни ранца) */
  if (mat == 4 || mat == 8) { wet = 0.35; emis = glow; }
  if (mat == 7) { ao = mix(0.5, 1.0, smoothstep(0.0, 0.7, ex)); emis = glow; }
  if (mat == 2) { emis = glow; }

  var c = alb * g.amb.rgb * (ao * ambK * mix(0.6, 1.25, N.y * 0.5 + 0.5));
  let ll = lampAt(in.wpos);
  if (ll.w > 0.0005) {
    let ndl = dot(N, ll.xyz);
    var lit = smoothstep(-0.08 - wrap, 0.5, ndl);
    if (mat == 7 || mat == 2) { lit = smoothstep(-0.5, 0.5, ndl); }
    let e = lampTint(in.wpos) * (ll.w * lampShade(in.wpos, N, in.pos.xy));
    c += alb * e * (lit * mix(1.0, ao, 0.6));
    let hv = normalize(ll.xyz + V);
    c += e * (pow(clamp(dot(N, hv), 0.0, 1.0), mix(18.0, 80.0, wet)) * wet * lit * 0.9);
    /* натёк пускает свет в свои края */
    if (mat == 11) { c += alb * e * (pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.0) * 0.1 * smoothstep(-0.6, 0.2, ndl)); }
    /* сквозь лист: кальцит теплеет, лёд остаётся своим */
    if (mat == 15) {
      let tn = mix(vec3f(1.25, 0.8, 0.45), vec3f(0.9, 1.05, 1.2), smoothstep(0.02, 0.15, alb.b - alb.r));
      c += alb * tn * e * (clamp(-ndl, 0.0, 1.0) * 0.7 + 0.12);
    }
  }
  let Ls = normalize(g.sunDir.xyz);
  let dm = dayMask(in.wpos);
  var ss = 0.0;
  if (dm > 0.001) { ss = dm * sunShade(in.wpos, N, in.pos.xy); }
  ss += farDay(in.wpos);
  if (ss > 0.0) {
    let nds = dot(N, Ls);
    var lit = smoothstep(-0.05, 0.4, nds);
    if (mat == 7 || mat == 2) { lit = smoothstep(-0.5, 0.45, nds); }
    let e = g.sunCol.rgb * ss;
    c += alb * e * (lit * mix(1.0, ao, 0.5));
    let hv = normalize(Ls + V);
    c += e * (pow(clamp(dot(N, hv), 0.0, 1.0), mix(18.0, 80.0, wet)) * wet * lit * 0.5);
  }
  /* кромка дня (проход 5): плечи верхних граней ловят холодный отсвет устья и арки — дальний камень
     отделяется от листа кромкой, а не общим тоном */
  if (mat == 1 && g.skyLo.w > 0.01) {
    let rv = smoothstep(0.22, 0.55, N.y) * (1.0 - smoothstep(0.8, 0.97, N.y)) * pow(1.0 - clamp(abs(dot(N, V)), 0.0, 1.0), 1.5);
    let dmo = length(vec2f(in.wpos.x - g.mouth.x, (g.dayP.z - in.wpos.y) * 0.6));
    var rk = exp(-dmo / 24.0);
    if (g.farK.x > 0.0) { rk = max(rk, exp(-length(in.wpos.xz - g.farDay.xy) / 18.0) * g.farK.x); }
    c += g.skyLo.rgb * (rv * rk * g.skyLo.w * 0.10);
  }
  var even = 0.0;
  if (mat == 11 || mat == 15) { even = 0.35; }
  c += alb * points(in.wpos, N, even) * mix(0.5, 1.0, ao);
  if (wet > 0.3 && mat != 4) { c += pointSpec(in.wpos, N, V, wet) * (wet * 0.8); }
  /* зверь отделяется от тьмы кромкой: свет события обводит край тела */
  if (mat == 8) { c += points(in.wpos, N, 1.0) * (pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.5) * 0.7); }
  c += alb * emis;
  /* на тонком стыке граней сумма света бывает меньше нуля — свет не бывает отрицательным */
  return vec4f(haze(max(c, vec3f(0.0)), in.wpos, 1.0), 1.0);
}

/* вода (22dd): в тёмной пещере вода — не свет. Гладь тёмная, как тень стены, и читается тем, что
   отражает; бирюза — только в конусе фонаря и у берега; блик фонаря — узкая дорожка к объективу.
   Тело в разрезе — тёмное стекло, лопасти света фонаря гаснут за два метра */
@fragment fn fs_water(in: VOut) -> @location(0) vec4f {
  let mat = i32(round(in.par.x));
  let V = normalize(g.camPos.xyz - in.wpos);
  let t = g.camPos.w;
  let up = vec3f(0.0, 1.0, 0.0);
  let ll = lampAt(in.wpos);
  let lsh = lampShade(in.wpos + vec3f(0.0, 0.06, 0.0), up, in.pos.xy);
  /* свет, что проходит в воду: фонарь (квадратичный спад уже в нём), огни слабо, день в столбе */
  var lit = g.lampCol.rgb * (ll.w * lsh) + points(in.wpos, up, 1.0) * 0.25;
  let dm = dayMask(in.wpos);
  if (dm > 0.001) { lit += g.sunCol.rgb * (dm * 0.6 * sunShade(in.wpos + vec3f(0.0, 0.06, 0.0), up, in.pos.xy)); }
  let dark = g.amb.rgb * 0.18;
  let teal = vec3f(0.035, 0.12, 0.115);
  if (mat == 14) {
    let d = in.par.w;
    let s1 = vnoise(vec2f(in.wpos.x * 1.7 + d * 0.30 + t * 0.03, 0.5), 47u);
    let s2 = vnoise(vec2f(in.wpos.x * 4.3 - d * 0.20 - t * 0.05, 1.5), 49u);
    let blade = pow(s1 * 0.7 + s2 * 0.3, 3.0) * (1.0 - smoothstep(0.0, 2.0, d));
    /* свет сверху: фонарь над водой, у глади; чем глубже, тем меньше */
    let top = vec3f(in.wpos.x, in.wpos.y + d, in.wpos.z);
    let lt = lampAt(top);
    let down = g.lampCol.rgb * (lt.w * lampShade(top + vec3f(0.0, 0.06, 0.0), up, in.pos.xy)) + lit * 0.3;
    let fade = pow(1.0 - smoothstep(0.0, 2.0, d), 2.0);
    /* как у стенда: пустота над водой всегда даёт телу немного света — оно читается водой, а не
       дырой; бирюза у глади, в глубине тёмная синь; кромка глади светлая и без фонаря */
    let amb2 = g.amb.rgb * 2.0 + points(top, up, 1.0) * 0.6;
    let body = mix(vec3f(0.11, 0.37, 0.36), vec3f(0.008, 0.04, 0.075), smoothstep(0.0, 2.6, d));
    var c = body * amb2 * (1.0 + 2.4 * blade) + vec3f(0.002, 0.006, 0.009);
    c += teal * down * (0.12 * fade + 0.9 * blade);
    c += vec3f(0.6, 0.8, 0.82) * (amb2 + down * 0.5) * ((1.0 - smoothstep(0.0, 0.05, d)) * 0.8);
    return vec4f(haze(c, in.wpos, 1.0), mix(0.60, 0.95, smoothstep(0.0, 2.0, d)));
  }
  let depth = in.par.w;
  let p = in.wpos.xz;
  let n1 = vnoise(vec2f(p.x * 0.9 + t * 0.10, p.y * 2.6 - t * 0.06), 3u) - 0.5;
  let n2 = vnoise(vec2f(p.x * 2.3 - t * 0.08, p.y * 6.0 + t * 0.12), 5u) - 0.5;
  /* круги, где падают капли с зубьев свода: в клетке 3 м своя капля и своё время */
  var ring = vec2f(0.0);
  let cb = vec2i(floor(p / 3.0));
  for (var k = 0; k < 4; k++) {
    let cc = cb + vec2i(k % 2, k / 2);
    let on = hash2(cc, 97u);
    if (on < 0.45) { continue; }
    let c0 = (vec2f(cc) + vec2f(hash2(cc, 91u), hash2(cc, 93u))) * 3.0;
    let dv = p - c0; let r = max(length(dv), 0.001);
    let ph = fract(t * (0.12 + 0.1 * on) + hash2(cc, 95u));
    let w = sin((r - ph * 3.2) * 11.0) * exp(-r * 0.8) * (1.0 - smoothstep(ph * 3.2 - 0.2, ph * 3.2 + 0.5, r)) * (1.0 - ph);
    ring += dv / r * w;
  }
  let N = normalize(vec3f((n1 + n2 * 0.5) * 0.02 + ring.x * 0.05, 1.0, (n1 * 0.5 + n2) * 0.035 + ring.y * 0.05));
  let uv = in.pos.xy * g.screen.zw + vec2f(N.x * 0.08, N.z * 0.30);
  let refl = textureSampleLevel(reflTex, linSamp, clamp(uv, vec2f(0.002), vec2f(0.998)), 0.0).rgb;
  let nv = clamp(dot(N, V), 0.0, 1.0);
  let fr = 0.04 + 0.96 * pow(1.0 - nv, 5.0);
  /* под гладью: темно; бирюза — где светит фонарь, и у берега, где толща меньше 30 см */
  let shore = 1.0 - smoothstep(0.05, 0.3, depth);
  let body = dark + teal * lit * (0.15 + 0.6 * shore);
  var c = mix(body, refl * 0.9, clamp(fr * 1.1, 0.0, 1.0));
  /* блик фонаря: узкая дорожка к объективу, рябь её рвёт */
  let hv = normalize(ll.xyz + V);
  c += g.lampCol.rgb * (ll.w * lsh * pow(clamp(dot(N, hv), 0.0, 1.0), 260.0) * 2.2);
  let alpha = smoothstep(-0.03, 0.18, depth) * mix(0.8, 1.0, max(fr, smoothstep(0.0, 1.0, depth)));
  return vec4f(haze(c, in.wpos, 1.0), alpha);
}
`;
