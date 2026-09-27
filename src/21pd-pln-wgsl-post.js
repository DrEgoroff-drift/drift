/* ══════════════ планета: свёртка кадра (M610) ══════════════
   Размытие кулисы, своё свечение, свет в воздухе, цветовая свёртка — и она же
   сдаёт кадр движку: последний треугольник рисуется прямо в проход сцены
   (gpuScene) в тонах экрана. Финал движка кладёт на сцену плечо
   tone(c) = min(c,.75) + .25·(1 − exp(−(c − .75)/.25)); чтобы оно вернуло наш
   тон нетронутым, выше .75 пишем обратное плечо. Зерно и дизеринг — движка.

   Глубину сцены читает только свет в воздухе; при сглаживании 4× она
   многовыборочная, и тип привязки другой — отсюда текст функцией. */
function plnWgslPost(ms){
  return PLN_WGSL_AIR+/* wgsl */`
struct PostP { a: vec4f, b: vec4f };
@group(0) @binding(1) var<uniform> pp: PostP;
@group(0) @binding(2) var texA: texture_2d<f32>;
@group(0) @binding(3) var texB: texture_2d<f32>;
@group(0) @binding(4) var texC: texture_2d<f32>;
@group(0) @binding(5) var texD: texture_2d<f32>;
@group(0) @binding(6) var samp: sampler;
@group(0) @binding(7) var depthTex: ${ms>1?"texture_depth_multisampled_2d":"texture_depth_2d"};
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

/* a = (шаг по x, шаг по y, 0, 0) в долях кадра */
@fragment fn fs_blur(in: FOut) -> @location(0) vec4f {
  let d = pp.a.xy;
  var c = textureSampleLevel(texA, samp, in.uv, 0.0) * 0.227027;
  c += (textureSampleLevel(texA, samp, in.uv + d * 1.3846154, 0.0) + textureSampleLevel(texA, samp, in.uv - d * 1.3846154, 0.0)) * 0.3162162;
  c += (textureSampleLevel(texA, samp, in.uv + d * 3.2307692, 0.0) + textureSampleLevel(texA, samp, in.uv - d * 3.2307692, 0.0)) * 0.0702703;
  return c;
}

/* свечение: a = (тексель источника по x и y, 0, 0) */
@fragment fn fs_down(in: FOut) -> @location(0) vec4f {
  let d = pp.a.xy;
  var c = textureSampleLevel(texA, samp, in.uv, 0.0) * 4.0;
  c += textureSampleLevel(texA, samp, in.uv + vec2f(-d.x, -d.y), 0.0);
  c += textureSampleLevel(texA, samp, in.uv + vec2f(d.x, -d.y), 0.0);
  c += textureSampleLevel(texA, samp, in.uv + vec2f(-d.x, d.y), 0.0);
  c += textureSampleLevel(texA, samp, in.uv + vec2f(d.x, d.y), 0.0);
  return vec4f(min(c.rgb / 8.0, vec3f(24.0)), 1.0);
}
/* texA — уровень мельче, texB — уровень этого размера */
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

/* свет в воздухе: луч идёт сквозь тень вещей и облаков и считается против среднего света
   воздуха — видны и лучи, и сумрак между ними, а пелены на кадре нет.
   a = (сила, дальность, среднее, пол) */
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
    let dens = exp(-max(p.y - g.waterB.w, 0.0) * 0.010) * exp(-tt * 0.0012);
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
/* обратное плечо финала движка */
fn unshoulder(d: vec3f) -> vec3f {
  let x = clamp(d, vec3f(0.0), vec3f(0.999));
  let hi = 0.75 - 0.25 * log(max(1.0 - (x - 0.75) / 0.25, vec3f(0.004)));
  return select(x, hi, x > vec3f(0.75));
}

/* texA — кадр, texB — свечение, texC — свет в воздухе, texD — кулиса (цвет умножен на покрытие).
   a = (свечение, виньетка, свёртка цвета, 0) */
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
  return vec4f(unshoulder(c), 1.0);
}
`;
}
