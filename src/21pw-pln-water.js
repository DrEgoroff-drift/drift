/* ══════════════ вода на движке: одна на все сцены (M634) ══════════════
   Вода стенда, вынесенная в свой модуль: её зовут планета (21pe/21pf) и пещера (22db/22dd), своего
   кода воды они не держат. Части:
   — ядро WGSL без чисел кадра: рябь двумя слоями по ветру, пятна штиля, зыбь вдали (растёт с
     расстоянием, период 3–8 м), кольца капель; тело A↔B по глубине, отмель, Френель тело↔зеркало,
     блеск светила дорожкой, мокрая кромка и нитка по урезу, муть;
   — точки входа fs_water: планеты (небо, облака, туман на воде ночью, воздух) и пещеры (фонарь,
     огни, сечение-тело в плоскости разреза);
   — конвейер воды и проход зеркала — одни на обе сцены;
   — сетки глади: пруд игры, вода ложбины, море до горизонта (океанский мир).
   Один вызов на сцену — числа: уровень, маска (сетка), муть, ветер, цвета тела A/B, туман. */

const PLN_WGSL_WATER_CORE=/* wgsl */`
/* ── вода (21pw): ядро без чисел кадра ── */
fn wHash(p: vec2i, s: u32) -> f32 {
  var v = u32(p.x) * 374761393u + u32(p.y) * 668265263u + s * 1274126177u;
  v ^= v >> 16u; v *= 0x7feb352du; v ^= v >> 15u; v *= 0x846ca68bu; v ^= v >> 16u;
  return f32(v >> 8u) / 16777216.0;
}
fn wNoise(p: vec2f, s: u32) -> f32 {
  let i = floor(p); let f = p - i; let u = f * f * (3.0 - 2.0 * f);
  let ii = vec2i(i);
  return mix(mix(wHash(ii, s), wHash(ii + vec2i(1, 0), s), u.x), mix(wHash(ii + vec2i(0, 1), s), wHash(ii + vec2i(1, 1), s), u.x), u.y);
}
fn wFbm(p: vec2f, s: u32) -> f32 {
  return wNoise(p, s) * 0.55 + wNoise(p * 2.03 + 7.1, s + 1u) * 0.3 + wNoise(p * 4.1 + 3.3, s + 2u) * 0.15;
}
struct WSurf { n: vec3f, rough: f32, calm: f32, thr: f32 };
/* Поверхность. p — место на глади (м), wind — направление (xy) и сила 0…1 (z), dist — до объектива,
   foot — сколько метров глади в пикселе (мельче него волна не рисуется, её доля уходит в шероховатость),
   swell — зыбь открытой воды 0…1, drops — кольца капель 0…1, rip — сила ряби (муть и пещера её глушат) */
fn waterSurf(p: vec2f, t: f32, wind: vec3f, dist: f32, foot: f32, swell: f32, drops: f32, rip: f32) -> WSurf {
  var o: WSurf;
  let wd = normalize(wind.xy + vec2f(0.0001, 0.0));
  let wp = vec2f(-wd.y, wd.x);
  let q = vec2f(dot(p, wd), dot(p, wp));
  let s = 0.6 + 0.8 * wind.z;
  /* рябь: длинный слой по ветру и короткий поперёк; пятна штиля — где ветер не лёг на воду */
  let n1 = wNoise(vec2f(q.x * 0.30 + t * 0.25 * s, q.y * 1.5 - t * 0.15), 3u) - 0.5;
  let n2 = wNoise(vec2f(q.x * 0.85 - t * 0.20 * s, q.y * 3.9 + t * 0.30), 5u) - 0.5;
  /* пятна штиля (calm 0 — гладь, 1 — ветер лёг на воду): вблизи — десятки метров, вдали те же пятна
     крупнее, иначе они мельче пикселя */
  let cq = vec2f(q.x * 0.02 + 1.0, q.y * 0.06 + t * 0.01);
  o.calm = smoothstep(0.35, 0.65, mix(wFbm(cq, 9u), wFbm(cq * vec2f(0.12, 0.04) + 5.0, 11u), smoothstep(60.0, 600.0, dist)));
  /* слой гаснет, пока на его ячейку по глубине (1/1.5 и 1/3.9 м) приходится больше двух пикселей:
     дальше он рвал бы отражение ломтями-ступенями, а не рябил */
  let f1 = 1.0 - smoothstep(0.14, 0.32, foot);
  let f2 = 1.0 - smoothstep(0.05, 0.125, foot);
  let k = mix(0.35, 1.0, o.calm) * rip;
  var sl = vec2f((n1 * f1 + n2 * 0.5 * f2) * 0.10, (n1 * 0.5 * f1 + n2 * f2) * 0.16) * k;
  var rough = 0.025 + 0.05 * k * ((1.0 - f1) + 0.5 * (1.0 - f2));
  sl = wd * sl.x + wp * sl.y;
  /* зыбь: три гряды веером вокруг ветра, 3, 5 и 8 м; вдали её больше, ближе — гладь стенда */
  if (swell > 0.001) {
    let far = swell * smoothstep(6.0, 70.0, dist) * (0.55 + 0.45 * smoothstep(70.0, 400.0, dist));
    for (var i = 0; i < 3; i++) {
      let fi = f32(i);
      let lam = 3.0 + 2.5 * fi;
      let a = (fi - 1.0) * 0.38;
      let d = wd * cos(a) + wp * sin(a);
      let kw = 6.2832 / lam;
      let ph = kw * dot(p, d) - sqrt(9.8 * kw) * t + fi * 2.1;
      let fade = 1.0 - smoothstep(lam * 0.12, lam * 0.4, foot);
      let amp = kw * lam * 0.022 * far;
      sl += d * (amp * fade * cos(ph));
      rough += amp * (1.0 - fade) * 0.45 * mix(0.35, 1.3, o.calm);
    }
  }
  /* кольца капель: в клетке 2.5 м своя капля и своё время; живых в окне — три-пять */
  if (drops > 0.001) {
    var ring = vec2f(0.0);
    let cb = vec2i(floor(p / 2.5));
    for (var j = 0; j < 4; j++) {
      let cc = cb + vec2i(j % 2, j / 2);
      let on = wHash(cc, 97u);
      if (on < 0.45) { continue; }
      let c0 = (vec2f(cc) + vec2f(wHash(cc, 91u), wHash(cc, 93u))) * 2.5;
      let dv = p - c0; let r = max(length(dv), 0.001);
      let ph = fract(t * (0.12 + 0.1 * on) + wHash(cc, 95u));
      let w = sin((r - ph * 2.8) * 11.0) * exp(-r * 0.8) * (1.0 - smoothstep(ph * 2.8 - 0.2, ph * 2.8 + 0.5, r)) * (1.0 - ph);
      ring += dv / r * w;
    }
    sl += ring * (0.06 * drops);
  }
  o.n = normalize(vec3f(sl.x, 1.0, sl.y));
  o.rough = clamp(rough, 0.02, 0.5);
  o.thr = n2;
  return o;
}
/* Выборка зеркала. Зеркало — в полкадра и без сглаживания: сдвиг рябью растягивает его лесенку в
   горизонтальные ступени. Пять отсчётов поперёк ряби (вверх-вниз на полтора пикселя кадра, вбок на
   три четверти) их сводят, а рисунок отражения остаётся. px — размер пикселя кадра в долях */
fn mirrorTap(uv: vec2f, px: vec2f) -> vec3f {
  let lo = vec2f(0.002); let hi = vec2f(0.998);
  var c = textureSampleLevel(reflTex, linSamp, clamp(uv, lo, hi), 0.0).rgb * 0.4;
  c += textureSampleLevel(reflTex, linSamp, clamp(uv + vec2f(0.0, 1.5 * px.y), lo, hi), 0.0).rgb * 0.2;
  c += textureSampleLevel(reflTex, linSamp, clamp(uv - vec2f(0.0, 1.5 * px.y), lo, hi), 0.0).rgb * 0.2;
  c += textureSampleLevel(reflTex, linSamp, clamp(uv + vec2f(0.75 * px.x, 0.0), lo, hi), 0.0).rgb * 0.1;
  c += textureSampleLevel(reflTex, linSamp, clamp(uv - vec2f(0.75 * px.x, 0.0), lo, hi), 0.0).rgb * 0.1;
  return c;
}
/* Вид глади. A — мель, B — глубина (свои цвета сцены), lit — свет, что входит в тело, own — свечение
   тела (муть), refl — зеркало, ld/lc — светило или фонарь: направление и цвет блика, edge — мокрая
   кромка (уже со светом), aD — с какой глубины гладь непрозрачна */
fn waterLook(S: WSurf, V: vec3f, depth: f32, murk: f32, A: vec3f, B: vec3f, lit: vec3f, own: vec3f,
    refl: vec3f, ld: vec3f, lc: vec3f, edge: vec3f, aD: f32) -> vec4f {
  let N = S.n;
  let deep = smoothstep(0.0, mix(2.2, 0.5, murk), depth);
  var body = mix(A, B, deep);
  /* отмель: у уреза тело светлее и зеленее, дно сквозит */
  body = mix(body * vec3f(1.12, 1.18, 1.04), body, smoothstep(0.0, 0.7, depth));
  body = body * lit + own;
  /* вскользь шершавая вода показывает объективу грани, повёрнутые к нему: зеркала меньше, тела больше —
     поэтому рябь, которой уже не видно, всё ещё темнит воду пятнами ветра */
  let nv = max(clamp(dot(N, V), 0.0, 1.0), S.rough * 1.3);
  let fr = 0.04 + 0.96 * pow(1.0 - nv, 5.0);
  var c = mix(body, refl * vec3f(0.84, 0.90, 0.92), clamp(fr * 1.05 * (1.0 - 0.8 * murk), 0.0, 1.0));
  /* блеск светила — дорожка. Вскользь наклон грани вдоль взгляда уводит отражённый луч по высоте вдвое,
     а вбок — лишь на долю синуса угла взгляда: дорожка узкая и тянется от горизонта к объективу,
     у шершавой воды длиннее; разрешённые гряды зыби рвут её на блёстки */
  let R = reflect(-V, N);
  let sg = S.rough * 1.5 + 0.02;
  let se = 2.0 * sg;
  let sa = max(se * max(V.y, 0.02) / max(sqrt(1.0 - R.y * R.y), 0.2), 0.004);
  let de = asin(clamp(R.y, -1.0, 1.0)) - asin(clamp(ld.y, -1.0, 1.0));
  var da = atan2(R.x, R.z) - atan2(ld.x, ld.z);
  da -= 6.2832 * round(da / 6.2832);
  let lobe = exp(-(de * de) / (se * se) - (da * da) / (sa * sa));
  /* сила сжата мягко (до 9): иначе дорожка насыщается плато и читается лужей; горячая середина белеет */
  let gl = lobe * min(0.05 / (se * sa), 60.0) * fr * (1.0 - 0.7 * murk);
  let gs = 9.0 * gl / (9.0 + gl);
  c += mix(lc, vec3f(dot(lc, vec3f(0.3333))) * vec3f(1.05, 1.0, 0.92), smoothstep(0.6, 3.0, gs) * 0.6) * gs;
  /* мягкая полоса у берега и тонкая светлая нитка по самому урезу, рваная рябью */
  let shore = (1.0 - smoothstep(0.02, 0.16, depth)) * 0.30 + (1.0 - smoothstep(0.0, 0.06, depth + S.thr * 0.03)) * 0.35;
  c = mix(c, edge, clamp(shore, 0.0, 1.0));
  return vec4f(c, smoothstep(-0.03, aD, depth));
}
`;

/* точка входа планеты: свет неба и облаков, муть мира, туман на воде ночью, воздух (21pb) */
const PLN_WGSL_WATER=PLN_WGSL_WATER_CORE+/* wgsl */`
@fragment fn fs_water(in: VOut) -> @location(0) vec4f {
  let foot = length(fwidth(in.wpos.xz));
  let depth = in.par.w;
  let t = g.camPos.w;
  let murk = g.waterA.w;
  let V = normalize(g.camPos.xyz - in.wpos);
  let dist = length(g.camPos.xyz - in.wpos);
  let wv = g.world.y;
  let S = waterSurf(in.wpos.xz, t, vec3f(select(-1.0, 1.0, wv >= 0.0), 0.0, clamp(abs(wv), 0.0, 1.0)), dist, foot, g.wxSpare.w, 0.0, mix(1.0, 0.6, murk));
  let uv = in.pos.xy * g.screen.zw + vec2f(S.n.x * 0.04, S.n.z * 0.22);
  let key = clamp(dot(g.sunCol.rgb, vec3f(0.3333)) / 1.38, 0.0, 1.0);
  let night = 1.0 - smoothstep(0.15, 0.6, key);
  /* грань, повёрнутая к объективу, отражает небо выше горизонта, а оно темнее — ночью вчетверо:
     пятна ветра ночью читаются тёмными по светлой глади у горизонта. Видимые грани зеркало уже
     отразило верно; темнит только рябь мельче пикселя — её шероховатость */
  let refl = mirrorTap(uv, g.screen.zw) * (1.0 - mix(0.25, 0.7, night) * smoothstep(0.03, 0.2, S.rough));
  let cl = cloudLight(in.wpos);
  let nv = clamp(dot(S.n, V), 0.0, 1.0);
  let lit = g.sunCol.rgb * (0.55 * cl) + g.ambSky.rgb * 0.91;
  /* мутная вода непрозрачна с малой глубины и чуть светит сама: сильнее в упор и пятнами */
  let own = g.waterA.rgb * (murk * (0.16 + 0.30 * nv) * (0.6 + 0.6 * S.calm));
  let edge = mix(vec3f(0.85, 0.92, 0.95), g.waterA.rgb * 2.2, murk) * (key * (0.4 + 0.6 * cl));
  var o = waterLook(S, V, depth, murk, g.waterA.rgb, g.waterB.rgb, lit, own, refl,
    normalize(g.sunDir.xyz), g.sunCol.rgb * cl, edge, 0.6);
  /* ночью над водой лежит туман: гладь вдали уходит в него раньше суши; лежит он банками, а не
     ровным слоем — между ними вода открыта и держит отражение */
  let bank = smoothstep(0.5, 0.62, wFbm(vec2f(in.wpos.x * 0.004 + t * 0.004, in.wpos.z * 0.012), 13u));
  let mist = night * smoothstep(60.0, 400.0, dist) * mix(0.0, 0.5, bank);
  o = vec4f(mix(o.rgb, g.airFar.rgb * 0.55, mist), o.a);
  /* ночной воздух над открытой водой прозрачнее дневной дымки: гладь держит пятна дальше суши,
     а к горизонту уходит в дымку целиком — шва с небом нет */
  let clear = 0.6 * night * (1.0 - 0.5 * bank) * (1.0 - smoothstep(1500.0, 6000.0, dist));
  return vec4f(applyFog(o.rgb, in.wpos, 1.0 - clear), o.a);
}
`;

/* точка входа пещеры: в тёмной пещере вода — не свет. Гладь тёмная, как тень стены, читается тем,
   что отражает; бирюза — в конусе фонаря и у берега; блик фонаря — дорожка к объективу; кольца капель
   с зубьев свода. Тело в разрезе (материал body) — тёмное стекло, лопасти света гаснут за два метра */
const PLN_WGSL_WATER_CAVE=PLN_WGSL_WATER_CORE+/* wgsl */`
@fragment fn fs_water(in: VOut) -> @location(0) vec4f {
  let foot = length(fwidth(in.wpos.xz));
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
  let teal = vec3f(0.035, 0.12, 0.115);
  if (mat == 14) {
    let d = in.par.w;
    let s1 = wNoise(vec2f(in.wpos.x * 1.7 + d * 0.30 + t * 0.03, 0.5), 47u);
    let s2 = wNoise(vec2f(in.wpos.x * 4.3 - d * 0.20 - t * 0.05, 1.5), 49u);
    let blade = pow(s1 * 0.7 + s2 * 0.3, 3.0) * (1.0 - smoothstep(0.0, 2.0, d));
    let top = vec3f(in.wpos.x, in.wpos.y + d, in.wpos.z);
    let lt = lampAt(top);
    let down = g.lampCol.rgb * (lt.w * lampShade(top + vec3f(0.0, 0.06, 0.0), up, in.pos.xy)) + lit * 0.3;
    let fade = pow(1.0 - smoothstep(0.0, 2.0, d), 2.0);
    let amb2 = g.amb.rgb * 2.0 + points(top, up, 1.0) * 0.6;
    let body = mix(vec3f(0.11, 0.37, 0.36), vec3f(0.008, 0.04, 0.075), smoothstep(0.0, 2.6, d));
    var c = body * amb2 * (1.0 + 2.4 * blade) + vec3f(0.002, 0.006, 0.009);
    c += teal * down * (0.12 * fade + 0.9 * blade);
    c += vec3f(0.6, 0.8, 0.82) * (amb2 + down * 0.5) * ((1.0 - smoothstep(0.0, 0.05, d)) * 0.8);
    return vec4f(haze(c, in.wpos, 1.0), mix(0.60, 0.95, smoothstep(0.0, 2.0, d)));
  }
  let depth = in.par.w;
  let dist = length(g.camPos.xyz - in.wpos);
  let S = waterSurf(in.wpos.xz, t, vec3f(1.0, 0.3, 0.0), dist, foot, 0.0, 1.0, 0.22);
  let uv = in.pos.xy * g.screen.zw + vec2f(S.n.x * 0.08, S.n.z * 0.30);
  let refl = mirrorTap(uv, g.screen.zw);
  /* под гладью темно: бирюза — где светит фонарь, у берега больше; огни событий ложатся на рябь
     и кольца капель отсветом — гладь в нижней галерее, куда фонарь не достаёт, читается ими */
  let own = g.amb.rgb * 0.18 + points(in.wpos + vec3f(0.0, 0.05, 0.0), S.n, 1.0) * 0.1;
  let edge = vec3f(0.6, 0.8, 0.82) * (g.amb.rgb * 0.9 + lit * 0.12);
  var o = waterLook(S, V, depth, 0.0, teal * 0.75, teal * 0.15, lit, own, refl * 1.3,
    ll.xyz, g.lampCol.rgb * (ll.w * lsh * 0.5), edge, 0.18);
  /* мель прозрачна, но не до пола: зеркало держит гладь и над песком в конусе (нырок M631) */
  return vec4f(haze(o.rgb, in.wpos, 1.0), o.a * mix(0.9, 1.0, smoothstep(0.0, 1.0, depth)));
}
`;

/* ── конвейер воды: одни числа на обе сцены; ключ разогрева даёт сцена ── */
const PLN_WATER_BLEND={color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha",operation:"add"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha",operation:"add"}};
function plnWaterPipe(layout,module,mu){
  return {layout,vertex:{module,entryPoint:"vs_main",buffers:PLN_VB},
    fragment:{module,entryPoint:"fs_water",targets:[{format:PLN_HDR,blend:PLN_WATER_BLEND}]},
    primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:{format:PLN_DEP,depthWriteEnabled:false,depthCompare:"greater"},multisample:mu};
}
/* зеркальный проход: сцена, отражённая в уровне воды; что под водой — режет шейдер тел (misc) */
function plnWaterMirror(e,o){
  const p=e.beginRenderPass({colorAttachments:[{view:o.view,clearValue:o.bg,loadOp:"clear",storeOp:"store"}],timestampWrites:gpuTs(o.ts),
    depthStencilAttachment:{view:o.depth,depthClearValue:0,depthLoadOp:"clear",depthStoreOp:"discard"}});
  /* стенд: PLN.noMirror — зеркало пустое (цвет фона); кадр против обычного меряет долю зеркала на глади */
  if(!PLN.noMirror){
    p.setBindGroup(0,o.bind);
    if(o.sky){p.setPipeline(o.sky);p.draw(3);}
    p.setPipeline(o.body);o.draw(p);
  }
  p.end();
}
/* объектив в зеркале уровня y */
const plnWaterEye=(e,y)=>[e[0],2*y-e[1],e[2]];
const plnWaterVP=(vp,y)=>plnM4mul(vp,plnM4mirrorY(y));

/* ── сетки глади ──
   Решётка: xs — шаг по x от xa, zs — ряды в глубину; at(x,z) кладёт вершину и говорит, держит ли
   она воду; квадрат — если воду держит хоть один угол (у берега гладь уходит под землю, а не рвётся) */
function plnWaterGrid(m,xa,nx,sx,zs,at){
  const nz=zs.length,keep=new Uint8Array((nx+1)*nz);
  for(let j=0;j<nz;j++)for(let i=0;i<=nx;i++)keep[j*(nx+1)+i]=at(xa+i*sx,zs[j])?1:0;
  for(let j=0;j+1<nz;j++)for(let i=0;i<nx;i++){
    const a=j*(nx+1)+i,b=a+1,c=a+nx+2,d=a+nx+1;
    if(keep[a]|keep[b]|keep[c]|keep[d])plnQuad(m,a,b,c,d);
  }
  return m;
}
const plnWaterRows=(z0,z1,s)=>{const z=[],n=Math.ceil((z1-z0)/s-1e-9);for(let k=0;k<=n;k++)z.push(z0+k*s);return z;};
/* Вода ложбины едет с дальним миром. Дно лежит в цвете вершины: высота ленты (мировая) и дна
   ложбины (на её уровне) — глубину считает шейдер, потому что уровень воды в кадре свой */
function plnWaterSheet(L,J){
  const C=PLN_LAND,sx=2,zs=plnWaterRows(4,136,1),nx=Math.ceil((J.xb-J.xa)/sx),m=plnMesh((nx+1)*zs.length*2);
  return plnWaterGrid(m,J.xa,nx,sx,zs,(x,z)=>{
    const f=plnLandFarH(L,x,z),hr=z<=C.zBack?plnLandRibAt(L,x,z):-1e3;
    plnVert(m,[x,C.wRel,z],[0,1,0],[hr,f,0],PLN_MAT.water,0,0,0);
    return C.wRel-f>-.4&&plnLandTab(L,L.liftHi,x)+C.wRel-hr>-.4;
  });
}
/* пруд стоит в мире, на уровне озера игры; вода — только в чаше: за валом бугры склона уходят ниже
   её уровня, и там она легла бы лужами */
function plnWaterPond(L,J){
  const k=L.lake,sx=L.dx*2,zs=plnWaterRows(k.zn-2.4,k.zf+2,.6),nx=Math.ceil((J.xb-J.xa)/sx),m=plnMesh((nx+1)*zs.length*2);
  return plnWaterGrid(m,J.xa,nx,sx,zs,(x,z)=>{
    const hr=plnLandRibAt(L,x,z);
    plnVert(m,[x,k.level,z],[0,1,0],[hr,-1e3,0],PLN_MAT.water,0,0,0);
    return k.level-hr>-.4&&(Math.abs(z)<2.5||plnLandPond(L,x,z)<1.2);
  });
}
/* Море до горизонта (океанский мир): лист на уровне ложбины за дальним берегом, ряды реже вдаль,
   ширина — как у дальнего мира на этой глубине. Острова встают из него сами: суша выше воды
   закрывает лист глубиной. Дно — дальняя суша под листом: мель и мокрая кромка там, где она
   подходит к уровню, — у островов и у ложбины; в открытом море дно на десять метров ниже, тело тёмное */
function plnWaterSea(L,J){
  const C=PLN_LAND,zs=[];
  for(let z=J.za;z<J.zb;z*=1.06)zs.push(z);
  zs.push(J.zb);
  const NC=96,m=plnMesh((NC+1)*zs.length*2),keep=new Uint8Array((NC+1)*zs.length);
  for(let j=0;j<zs.length;j++){
    const z=zs[j],e=plnLandE(z);
    for(let i=0;i<=NC;i++){
      const x=-e+(L.len+2*e)*i/NC,f=plnLandFarH(L,x,z);
      plnVert(m,[x,C.wRel,z],[0,1,0],[-1e3,f,0],PLN_MAT.water,0,0,0);
      keep[j*(NC+1)+i]=C.wRel-f>-.4?1:0;
    }
  }
  for(let j=0;j+1<zs.length;j++)for(let i=0;i<NC;i++){
    const a=j*(NC+1)+i,b=a+1,c=a+NC+2,d=a+NC+1;
    if(keep[a]|keep[b]|keep[c]|keep[d])plnQuad(m,a,b,c,d);
  }
  return m;
}
/* Час блика (M634, 08.10). Светило за час проходит по кругу 15°, и высота sy от 0 до .16: окно —
   этот час над горизонтом, края мягкие. Направление тянется к оси объектива со стороны светила
   (x .05 — дорожка у середины, мимо человека) и остаётся низким; k — доля поворота 0…1 */
const plnGlintHour=sy=>plnSmooth(-.02,.02,sy)*(1-plnSmooth(.13,.19,sy));
function plnGlintDir(dir,sun,k){
  const y=Math.max(.04,Math.min(sun[1],.16)),x=(sun[0]<0?-1:1)*.05;
  return plnNorm([lerp(dir[0],x,k),lerp(dir[1],y,k),lerp(dir[2],Math.sqrt(1-x*x-y*y),k)]);
}
/* у какого мира море до горизонта и сколько в нём зыби */
const plnWaterSwell=L=>L.sea?1:(L.lake||L.wet?.15:0);
