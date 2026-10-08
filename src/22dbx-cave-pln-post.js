/* ══════════════ пещера на движке: шейдеры после сцены (M630b проход 5) ══════════════
   Свет в воздухе (фонарь и день по своим картам тени, в долю кадра), свечение, свёртка в сцену
   движка. Общее (Globals, фонарь, день) — CAVE3_WGSL_COMMON из 22dbw. */
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
/* не число (NaN, бесконечность) — по битам: сравнение x != x компилятор вправе выбросить */
fn bad3(c: vec3f) -> bool {
  return any((bitcast<vec3u>(c) & vec3u(0x7f800000u)) == vec3u(0x7f800000u));
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
  /* свечение не берёт ни отрицательного, ни не-числа: одна такая точка расползлась бы чёрным шаром */
  let o = clamp(c.rgb / 8.0, vec3f(0.0), vec3f(24.0));
  return vec4f(select(o, vec3f(0.0), bad3(o)), 1.0);
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
          /* свет, что бежит к объективу, виден ярче бокового; воздух показывает клин, а не облако:
             у клина чёткая внешняя кромка по внутреннему конусу, за ней воздух пуст, и клин
             отпускает свет за несколько метров, иначе весь зал стоит в молоке */
          let cs = dot(ll.xyz, rd);
          let ax = dot(-ll.xyz, g.lampDir.xyz);
          let core = smoothstep(g.lampCol.w - 0.015, g.lampCol.w + 0.015, ax) * (0.55 + 0.45 * smoothstep(0.9, 0.98, ax));
          let dl = length(p - g.lampPos.xyz);
          /* клин идёт от шлема: у самого фонаря воздух светится гуще */
          let wet = (1.0 + 0.6 * g.farK.w) * (1.0 + 1.6 * exp(-dl / 2.2));
          let du = 0.7 + 0.6 * vn3(p * 0.7 + vec3f(g.camPos.w * 0.02, 0.0, 0.0), 45u);
          accL += ll.w * core * exp(-dl / 14.0) * wet * sh * du * (0.55 + 0.9 * pow(max(cs, 0.0), 3.0) + 0.2 * cs * cs);
        }
      }
    }
    if (g.farK.x > 0.0 && g.skyLo.w > 0.01) {
      /* луч дальнего зала: те же лезвия, без карты тени */
      let ef = farOf(p);
      if (ef < 1.2 && p.y > g.farDay.w - 16.0 && p.y < g.farDay.w + 1.0) {
        let u2 = (p.x - g.camPos.x) / max(p.z - g.camPos.z, 1.0);
        let f1 = vnoise(vec2f(u2 * 70.0 + g.camPos.w * 0.010, 2.5), 43u);
        accS += (1.0 - smoothstep(0.3, 1.15, ef)) * (0.30 + 1.5 * f1 * f1) * g.skyLo.w * g.farK.x * 0.8;
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
