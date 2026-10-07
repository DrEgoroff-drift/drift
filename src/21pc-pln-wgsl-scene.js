/* ══════════════ планета: шейдер тел, земли, воды и тени (M610) ══════════════
   Одна вершина на всё (21pa): место, нормаль, цвет, [материал, ветер, свечение,
   запас]. Каждая отрисовка несёт ещё запись расстановки (64 байта на штуку):
   тонкое и многочисленное — трава, кроны, камни — стоит одной сеткой много раз,
   а цельные сетки идут с единичной записью.

   Материал — номер из PLN_MAT. У земли в гнезде «свечение» лежит доля камня, в
   «запасе» — затенение от соседей; у травы в «запасе» высота по стеблю; у
   человека — блеск; у воды — глубина в метрах; у свечения — доля пустоты
   (темнота проёма: не светится и воздуха не берёт). */
const PLN_WGSL_SCENE=PLN_WGSL_AIR+/* wgsl */`
struct Blobs { n: vec4f, b: array<vec4f, 64> };
@group(0) @binding(1) var shadowTex: texture_depth_2d_array;
@group(0) @binding(2) var shadowSamp: sampler_comparison;
@group(0) @binding(3) var reflTex: texture_2d<f32>;
@group(0) @binding(4) var linSamp: sampler;
@group(0) @binding(5) var<uniform> blobs: Blobs;

struct VIn {
  @location(0) pos: vec3f,
  @location(1) nrm: vec3f,
  @location(2) col: vec3f,
  @location(3) par: vec4f,    // материал, ветер, свечение, запас
  @location(4) i0: vec4f,     // место, размер
  @location(5) i1: vec4f,     // cos и sin поворота, доля высоты, семя
  @location(6) i2: vec4f,     // цвет А, режим цвета
  @location(7) i3: vec4f,     // цвет Б, едет ли с дальним миром (0 или 1)
};
struct VOut {
  @builtin(position) pos: vec4f,
  @location(0) wpos: vec3f,
  @location(1) nrm: vec3f,
  @location(2) col: vec3f,
  @location(3) par: vec4f,
};
struct FOut { @builtin(position) pos: vec4f, @location(0) uv: vec2f };

fn windAt(p: vec3f, amp: f32) -> vec3f {
  let t = g.camPos.w;
  let gust = sin(t * 0.7 + p.x * 0.05 + p.z * 0.03) * 0.5 + 0.5;
  let a = sin(t * 1.7 + p.x * 0.45 + p.z * 0.31) * 0.6 + sin(t * 3.1 + p.x * 1.3 + p.z * 0.9) * 0.25;
  return vec3f(amp * (0.5 + gust) * (0.4 + a * 0.6), 0.0, amp * a * 0.25);
}
/* запись расстановки: размер, доля высоты, поворот вокруг вертикали, место.
   Дальний мир стоит на своём уровне и едет по высоте целиком, не гнётся */
/* размер со знаком минус — твёрдое тело с креном: угол вокруг z лежит в ячейке зерна (i1.w);
   крен идёт до поворота, в теле (корабль на спуске, M621) */
fn placeAt(p: vec3f, i0: vec4f, i1: vec4f, i3: vec4f) -> vec3f {
  let sc = abs(i0.w);
  let roll = select(0.0, i1.w, i0.w < 0.0);
  let q0 = p * vec3f(sc, sc * i1.z, sc);
  let cr = cos(roll); let sr = sin(roll);
  let q = vec3f(q0.x * cr - q0.y * sr, q0.x * sr + q0.y * cr, q0.z);
  return i0.xyz + vec3f(q.x * i1.x + q.z * i1.y, q.y + i3.w * g.waterB.w, q.z * i1.x - q.x * i1.y);
}
fn turnBy(n: vec3f, i0: vec4f, i1: vec4f) -> vec3f {
  let roll = select(0.0, i1.w, i0.w < 0.0);
  let q0 = vec3f(n.x, n.y / max(i1.z, 0.05), n.z);
  let cr = cos(roll); let sr = sin(roll);
  let q = vec3f(q0.x * cr - q0.y * sr, q0.x * sr + q0.y * cr, q0.z);
  return normalize(vec3f(q.x * i1.x + q.z * i1.y, q.y, q.z * i1.x - q.x * i1.y));
}

@vertex fn vs_main(in: VIn) -> VOut {
  var o: VOut;
  let w = placeAt(in.pos, in.i0, in.i1, in.i3);
  let p = w + windAt(w, in.par.y * abs(in.i0.w) * g.world.y);
  o.pos = g.viewProj * vec4f(p, 1.0);
  o.wpos = p; o.nrm = turnBy(in.nrm, in.i0, in.i1);
  /* режим 0 — цвет сетки, подкрашенный записью; режим 1 — сетка несёт только ход от корня
     к макушке (r) и свою светлоту (g), а оба цвета даёт запись; режим 2 — так красится
     только листва, кора остаётся своей: дерево — одно тело и одна запись */
  var c = in.col * in.i2.rgb;
  if (in.i2.w > 0.5) {
    let ramp = mix(in.i2.rgb, in.i3.rgb, in.col.r) * (0.5 + in.col.g);
    let leafy = (in.par.x > 1.5 && in.par.x < 2.5) || (in.par.x > 6.5 && in.par.x < 7.5);
    if (in.i2.w < 1.5 || leafy) { c = ramp; } else { c = in.col; }
  }
  o.col = c; o.par = in.par;
  /* вода: в цвете вершины лежит дно — высота ленты (мировая) и высота дальнего мира (на его
     уровне); глубина считается здесь, потому что уровень воды в кадре свой */
  if (in.par.x > 5.5 && in.par.x < 6.5) {
    o.par.w = p.y - max(in.col.r, in.col.g + g.waterB.w);
  }
  return o;
}
/* у прохода тени матрица его карты лежит на месте первой */
@vertex fn vs_shadow(@location(0) pos: vec3f, @location(3) par: vec4f, @location(4) i0: vec4f, @location(5) i1: vec4f,
    @location(7) i3: vec4f) -> @builtin(position) vec4f {
  let w = placeAt(pos, i0, i1, i3);
  return g.lightVP0 * vec4f(w + windAt(w, par.y * abs(i0.w) * g.world.y), 1.0);
}
@vertex fn vs_full(@builtin(vertex_index) i: u32) -> FOut {
  var o: FOut;
  let p = vec2f(f32((i << 1u) & 2u), f32(i & 2u));
  o.pos = vec4f(p * 2.0 - 1.0, 0.0, 1.0);
  o.uv = vec2f(p.x, 1.0 - p.y);
  return o;
}

/* отводов сверх центрального — g.thru.w (ярус, 21pe): 8 на ПК, 4 на телефоне, 0 — один отвод */
fn shadowTap(uv: vec2f, layer: i32, z: f32, rad: f32, rot: f32) -> f32 {
  var s = textureSampleCompareLevel(shadowTex, shadowSamp, uv, layer, z);
  let nt = i32(g.thru.w);
  for (var i = 0; i < nt; i++) {
    let a = f32(i) * 2.39996 + rot;
    let r = rad * sqrt((f32(i) + 0.5) / f32(nt));
    s += textureSampleCompareLevel(shadowTex, shadowSamp, uv + vec2f(cos(a), sin(a)) * r, layer, z);
  }
  return s / f32(nt + 1);
}
fn shadowAt(wpos: vec3f, n: vec3f, fragXY: vec2f) -> f32 {
  let p = wpos + n * 0.05;
  let rot = ign(fragXY) * 6.2831853;
  var lp = g.lightVP0 * vec4f(p, 1.0);
  var uv = lp.xy * vec2f(0.5, -0.5) + 0.5;
  if (uv.x > 0.004 && uv.x < 0.996 && uv.y > 0.004 && uv.y < 0.996 && lp.z > 0.0 && lp.z < 1.0) {
    return shadowTap(uv, 0, lp.z - g.misc.z, 3.0 * g.ambSky.w, rot);
  }
  lp = g.lightVP1 * vec4f(p, 1.0);
  uv = lp.xy * vec2f(0.5, -0.5) + 0.5;
  if (uv.x > 0.004 && uv.x < 0.996 && uv.y > 0.004 && uv.y < 0.996 && lp.z > 0.0 && lp.z < 1.0) {
    return shadowTap(uv, 1, lp.z - g.misc.w, 1.6 * g.ambSky.w, rot);
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
  /* своё свечение света не берёт; в запасе у него доля пустоты: темнота проёма воздуха почти не берёт */
  if (mat == 5) { return vec4f(applyFog(in.col * glow, in.wpos, 0.9 * (1.0 - clamp(ex, 0.0, 1.0))), 1.0); }
  let V = normalize(g.camPos.xyz - in.wpos);
  let L = normalize(g.sunDir.xyz);
  let dist = length(g.camPos.xyz - in.wpos);
  var N = normalize(in.nrm);
  if (mat == 1) {
    var fN = normalize(cross(fx, fy));
    if (dot(fN, V) < 0.0) { fN = -fN; }
    N = normalize(mix(N, fN, 0.92));
  }
  var alb = in.col;
  /* у земли в гнезде свечения — доля камня, и на земле ничто не светится */
  var stone = 0.0; var emis = glow;
  if (mat == 0) {
    stone = glow; emis = 0.0;
    /* земля положена кистью: широкие мазки вдоль плана и мелкое зерно вблизи */
    let near = 1.0 - smoothstep(60.0, 220.0, dist);
    let mid = 1.0 - smoothstep(400.0, 1200.0, dist);
    let s1 = fbm(in.wpos.xz * vec2f(0.045, 0.11) + vec2f(17.0, 3.0), 51u) - 0.5;
    let s2 = fbm(in.wpos.xz * vec2f(0.55, 1.2) + vec2f(5.0, 9.0), 53u) - 0.5;
    alb *= 1.0 + s1 * 0.30 * mid + s2 * 0.20 * near;
    /* у объектива — мелкое зерно: пыль и крошка на тропе (M623) */
    let s3 = fbm(in.wpos.xz * vec2f(2.4, 4.8) + vec2f(1.0, 2.0), 59u) - 0.5;
    alb *= 1.0 + s3 * 0.12 * (1.0 - smoothstep(14.0, 45.0, dist));
    if (stone > 0.0) {
      var fN = normalize(cross(fx, fy));
      if (dot(fN, V) < 0.0) { fN = -fN; }
      N = normalize(mix(N, fN, 0.85 * stone));
    }
  }
  /* мокрая земля (M626): темнее и гуще цветом; блик неба по глади — ниже, после света */
  let wet = g.wx.z * select(0.0, 1.0, mat == 0 || mat == 1);
  alb *= mix(vec3f(1.0), vec3f(0.50, 0.52, 0.56), wet);
  let ndl = dot(N, L);
  /* кулиса стоит в метрах от объектива, где тексель дальней карты — с ладонь: карты она не берёт */
  var sh = 1.0;
  if (g.misc.y > -0.5) { sh = shadowAt(in.wpos, N, in.pos.xy); }
  let cl = cloudLight(in.wpos);
  let fg = nearShade(in.wpos);
  var lit = smoothstep(-0.02, 0.30, ndl);
  if (mat == 1) { lit = smoothstep(0.0, 0.22, ndl); }
  /* шерсть рассеивает: свет заходит за край тела дальше, чем по камню (M625) */
  if (mat == 8) { lit = smoothstep(-0.22, 0.42, ndl); }
  var ao = 1.0;
  var through = 0.0;
  if (mat == 0) { ao = ex; lit = smoothstep(mix(-0.10, 0.0, stone), mix(0.45, 0.22, stone), ndl); }
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
    /* крона — тело: верх берёт солнце, испод держит тень, насквозь свет идёт только по краю */
    lit = smoothstep(-0.25, 0.45, ndl);
    let edge = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.0);
    through = clamp(0.25 - ndl * 0.8, 0.0, 1.0) * (0.12 + 0.55 * edge);
    ao = mix(0.55, 1.0, smoothstep(-0.7, 0.3, N.y));
    /* кулиса — холодный тёмный обвод: тёплый свет насквозь делает её бурым пятном */
    if (g.misc.y < -0.5) { through = 0.0; }
  }
  if (mat == 7) {
    lit = smoothstep(-0.4, 0.45, ndl);
    through = pow(clamp(dot(-V, L), 0.0, 1.0), 2.0) * 0.7 * ex;
  }
  /* камень: плоскости делит свет — освещённая грань теплеет, теневая холодеет, насколько силён
     ключ (ночью деления нет). Пласты по высоте пробовали — на свету это мазня (M623) */
  let stoneK = select(stone, 1.0, mat == 1);
  if (stoneK > 0.0) {
    let key = clamp(dot(g.sunCol.rgb, vec3f(0.3333)) / 1.38, 0.0, 1.0);
    let lk = lit * sh * cl;
    alb *= mix(vec3f(1.0), mix(vec3f(0.76, 0.86, 1.14), vec3f(1.16, 1.05, 0.86), lk), stoneK * key);
  }
  let sun = g.sunCol.rgb * (sh * cl * fg);
  let amb = mix(g.ambGnd.rgb, g.ambSky.rgb, N.y * 0.5 + 0.5) * ao * mix(0.55, 1.0, fg);
  var c = alb * (sun * lit * mix(1.0, ao, 0.6) + amb);
  c += alb * g.thru.rgb * sun * through;
  if (mat == 0) {
    /* крутой бок земли стоит к свету спиной, и светит ему освещённая земля вокруг: в тени — цвет */
    /* скала ступени стоит среди своих тел и берёт его, как они: вполовину */
    c += alb * g.bounce.rgb * (cl * fg * (1.0 - N.y) * mix(1.1, 0.6, stone * (1.0 - smoothstep(60.0, 220.0, dist))));
  }
  if (mat == 1 || mat == 3 || mat == 4 || mat == 8 || mat == 9) {
    /* свет идёт из-за сцены: тело рисует его освещённый край */
    var rk = 0.30; var rp = 3.0;
    if (mat == 4 || mat == 8) { rk = 0.75; rp = 2.2; }
    if (mat == 3 || mat == 1) { rk = 0.60; rp = 2.4; }
    let rim = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), rp) * smoothstep(-0.4, 0.4, ndl);
    c += sun * rim * rk * mix(alb, vec3f(1.0), 0.4);
    /* освещённая трава отдаёт свет тому, что в ней стоит — и зверю тоже (M625) */
    if (mat == 3 || mat == 1 || mat == 8) {
      c += alb * g.bounce.rgb * (cl * fg * 0.45 * (1.0 - N.y * 0.5));
    }
  }
  if (mat == 4) {
    let hv = normalize(L + V);
    c += sun * pow(clamp(dot(N, hv), 0.0, 1.0), 60.0) * ex * lit * 1.5;
    let rv = reflect(-V, N);
    let fr = 0.05 + 0.95 * pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 4.0);
    c += skyBase(normalize(vec3f(rv.x, abs(rv.y) + 0.02, rv.z))) * (ex * fr * 0.5 * mix(0.55, 1.0, fg));
  }
  if (wet > 0.0) {
    /* мокрая гладь отражает небо под скользящим углом и ловит ключ узким бликом */
    let hv = normalize(L + V);
    let fr = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.0);
    let rv = reflect(-V, N);
    let flat = clamp(N.y, 0.0, 1.0);
    c += skyBase(normalize(vec3f(rv.x, abs(rv.y) + 0.02, rv.z))) * (wet * fr * 0.60 * flat * mix(0.55, 1.0, fg));
    c += sun * pow(clamp(dot(N, hv), 0.0, 1.0), 36.0) * (wet * 0.8 * flat);
  }
  for (var i = 0; i < 4; i++) {
    let lp = g.lampPos[i]; let lc = g.lampCol[i];
    if (lc.w <= 0.0) { continue; }
    let d = lp.xyz - in.wpos; let dl = length(d);
    /* лампа людей — под козырьком: светит вниз и в стороны, а крону над собой не зажигает */
    let hood = 1.0 - smoothstep(0.2, 1.6, in.wpos.y - lp.y);
    let att = pow(clamp(1.0 - dl / lp.w, 0.0, 1.0), 2.0) * hood;
    let nl = clamp(dot(N, d / dl) * 0.7 + 0.3, 0.0, 1.0);
    c += alb * lc.rgb * (lc.w * att * nl);
  }
  /* цветок, лист, руда светятся отражённым: днём это запас яркости, ночью его почти нет.
     Лист, что светится сам (вид игры, свечение от .45), светится и ночью */
  {
    let day = clamp(dot(g.sunCol.rgb, vec3f(0.3333)) / 1.38, 0.0, 1.0);
    var own = 0.0;
    if (mat == 7 || mat == 2) { own = smoothstep(0.25, 0.45, emis); }
    emis *= mix(mix(0.22, 1.0, day), 1.0, own);
  }
  c += alb * emis;
  var cap = 1.0;
  if (mat == 9) { cap = 0.93; }
  /* кулиса темна, и воздух, светлый против неё, красит её в серое: между нею и объективом его нет */
  if (g.misc.y < -0.5) { cap = 0.0; }
  return vec4f(applyFog(c, in.wpos, cap), 1.0);
}

@fragment fn fs_water(in: VOut) -> @location(0) vec4f {
  let depth = in.par.w;
  let t = g.camPos.w;
  let murk = g.waterA.w;
  let V = normalize(g.camPos.xyz - in.wpos);
  let p = in.wpos.xz;
  let n1 = vnoise(vec2f(p.x * 0.30 + t * 0.25, p.y * 1.5 - t * 0.15), 3u) - 0.5;
  let n2 = vnoise(vec2f(p.x * 0.85 - t * 0.20, p.y * 3.9 + t * 0.30), 5u) - 0.5;
  let calm = smoothstep(0.35, 0.65, fbm(vec2f(p.x * 0.02 + 1.0, p.y * 0.06 + t * 0.01), 9u));
  let rip = mix(0.35, 1.0, calm) * mix(1.0, 0.6, murk);
  let N = normalize(vec3f((n1 + n2 * 0.5) * 0.10 * rip, 1.0, (n1 * 0.5 + n2) * 0.16 * rip));
  let uv = in.pos.xy * g.screen.zw + vec2f((n1 + n2) * 0.004, (n1 + n2 * 0.6) * 0.030) * rip;
  let refl = textureSampleLevel(reflTex, linSamp, clamp(uv, vec2f(0.002), vec2f(0.998)), 0.0).rgb;
  let nv = clamp(dot(N, V), 0.0, 1.0);
  let fr = 0.04 + 0.96 * pow(1.0 - nv, 5.0);
  let cl = cloudLight(in.wpos);
  /* мутная вода непрозрачна с малой глубины, зеркало в ней проигрывает телу, и тело чуть светит само:
     сильнее в упор и пятнами, слабее вскользь — иначе ночью это плоский лист */
  let deep = smoothstep(0.0, mix(2.2, 0.5, murk), depth);
  var body = mix(g.waterA.rgb, g.waterB.rgb, deep);
  /* отмель: у уреза тело воды светлее и зеленее, дно сквозит (M623) */
  body = mix(body * vec3f(1.12, 1.18, 1.04), body, smoothstep(0.0, 0.7, depth));
  let gl = murk * (0.16 + 0.30 * nv) * (0.6 + 0.6 * calm);
  body = body * (g.sunCol.rgb * (0.55 * cl) + g.ambSky.rgb * 0.91) + g.waterA.rgb * gl;
  var c = mix(body, refl * vec3f(0.84, 0.90, 0.92), clamp(fr * 1.05 * (1.0 - 0.8 * murk), 0.0, 1.0));
  /* мокрая кромка вдоль берега: светла настолько, насколько светел ключ; у мутной воды — её же цвета */
  let key = clamp(dot(g.sunCol.rgb, vec3f(0.3333)) / 1.38, 0.0, 1.0);
  let edge = mix(vec3f(0.85, 0.92, 0.95), g.waterA.rgb * 2.2, murk);
  /* мягкая полоса у берега и тонкая светлая нитка по самому урезу, рваная рябью (M623) */
  let shore = (1.0 - smoothstep(0.02, 0.16, depth)) * 0.30 + (1.0 - smoothstep(0.0, 0.06, depth + n2 * 0.03)) * 0.35;
  c = mix(c, edge * (key * (0.4 + 0.6 * cl)), clamp(shore, 0.0, 1.0));
  let alpha = smoothstep(-0.03, 0.6, depth);
  return vec4f(applyFog(c, in.wpos, 1.0), alpha);
}
`;
