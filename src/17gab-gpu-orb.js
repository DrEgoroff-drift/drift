/* ══════════════ планета с орбиты, заново (M700, docs/DESIGN-space.md) ══════════════
   Не перенос развёртки 07/17gb, а шар, придуманный по законам M600: у каждого из
   двенадцати миров — своя крупная форма, видная с орбиты (материки и шапки, архипелаги,
   поле граней, сетка мёртвых городов, полосы и одна буря, трещины льда, разломы лавы,
   дюнные моря и столовые горы, кратеры), цвета — из палитры мира (T.pal) с потолком
   хромы .10 в OKLab, один свет звезды сбоку (z .46 вместо .74: у шара есть ночь),
   воздух — оболочка, что толще к лимбу и теплеет у терминатора.
   Ничто не мигает: мелкий слой гаснет, когда его период мельче пикселя.
   Облик выращен на стенде docs/look/space/planets.html; поверхность — та же WGSL.
   Старый шар (17ga) остаётся запасным: ?orb=0 рисует им. */
const GOR={on:typeof location==="undefined"||!/[?&]orb=0\b/.test(location.search),A:new Float32Array(256),U:new Float32Array(8),
  K:{rocky:0,crystal:1,ruin:2,gas:3,jungle:4,ice:5,toxic:6,ocean:7,volcanic:8,terran:9,metal:10,desert:11}};
/* толщина воздуха в радиусах; безвоздушные (T.atm «отсутствует») — 0 */
const GOR_AIR={crystal:.012,ruin:.025,gas:.03,jungle:.045,ice:.02,toxic:.06,ocean:.05,volcanic:.012,terran:.045,desert:.03};
/* свет звезды к смотрящему: z .46 — у шара есть ночь (прежде .74, «звезда за спиной») */
const GOR_LZ=.46;
/* яркость звезды на шаре (линейная) и наклон оси */
const GOR_LIT=1.4,GOR_TILT=.38;
const GOR_WGSL=`
diagnostic(off, derivative_uniformity);
struct U { a: vec4f, b: vec4f };
@group(0) @binding(0) var<uniform> u: U;
@group(0) @binding(1) var<storage, read> pb: array<vec4f, 64>;
struct VO { @builtin(position) p: vec4f };
@vertex fn vs(@builtin(vertex_index) vi: u32) -> VO {
  var c = array(vec2f(-1., -1.), vec2f(1., -1.), vec2f(1., 1.), vec2f(-1., -1.), vec2f(1., 1.), vec2f(-1., 1.));
  let v0 = pb[0]; let v4 = pb[4];
  let e = v0.z*max(max(1.2, 1. + pb[2].w*3.5), select(1., v4.y*1.05, v4.w > 0.)) + 3.;
  let q = (v0.xy + c[vi]*e)*u.b.x;
  var o: VO; o.p = vec4f(q.x/u.a.x*2. - 1., 1. - q.y/u.a.y*2., 0., 1.); return o;
}
fn h1(x: f32) -> f32 { return fract(sin(x*127.1)*43758.5453); }
fn over(acc: vec4f, s: vec4f) -> vec4f { return s + acc*(1. - s.a); }
/* кольцо — как в 17ga: радиус в долях r → цвет и прозрачность; мельче пикселя гаснет в среднее */
fn ring0(rho: f32, v4: vec4f, v5: vec4f, dr: f32) -> vec4f {
  let ri = v4.x; let ro = v4.y; let n = max(v5.w, 1.);
  if (rho < ri - .02 || rho > ro + .02) { return vec4f(0.); }
  let f = (rho - ri)/(ro - ri); let b = clamp(floor(f*n), 0., n - 1.);
  let kb = clamp((ro - ri)/n/dr - .7, 0., 1.); let hb = mix(.5, h1(v4.z + b*7.31), kb);
  var a = .06 + hb*.16;
  let fine = .8 + .2*clamp((.0298/dr - 1.)*.7, 0., 1.)*sin(rho*211. + hb*6.)*sin(rho*67. + v4.z);
  let gw = max(.06, .6*n*dr/(ro - ri));
  let gap = mix(.94, mix(1., smoothstep(0., gw, abs(fract(f*n) - .5)*2.), min(1., .1/gw)), kb);
  a = a*fine*mix(.55, 1., gap)*smoothstep(ri - .02, ri + .03, rho)*(1. - smoothstep(ro - .03, ro + .02, rho));
  let col = vec3f(190. + hb*50., 172. + h1(hb*9.)*46., 146. + h1(hb*3.)*54.)/255.;
  return vec4f(col*a*2.3, min(a*2.3, 1.));
}
fn ring(rho: f32, v4: vec4f, v5: vec4f, dr: f32) -> vec4f {
  return .25*(ring0(rho - .375*dr, v4, v5, dr) + ring0(rho - .125*dr, v4, v5, dr) + ring0(rho + .125*dr, v4, v5, dr) + ring0(rho + .375*dr, v4, v5, dr));
}
/* суша под городом: у мокрых миров — та же отметка, что рисует материки */
fn landAt(k: i32, p: vec3f, s: vec3f, fw: f32) -> f32 {
  if (k != 4 && k != 7 && k != 9) { return 1.; }
  var lv = .05; var sc = 1.1;
  if (k == 4) { lv = -.06; sc = 1.4; }
  if (k == 7) { lv = .34; sc = 2.3; }
  let n = fbm(warp(p*sc + s, .55, fw), 6, fw) + select(0., .12*n3(p*9. + s), k == 7);
  return smoothstep(lv, lv + .012, n);
}
fn tmap(x0: vec3f) -> vec3f {
  let x = max(x0, vec3f(0.));
  let y = dot(x, vec3f(.2126, .7152, .0722));
  let ty = clamp((y*(2.51*y + .03))/(y*(2.43*y + .59) + .14), 0., 1.);
  var tm = x*ty/max(y, 1e-5);
  tm = mix(tm, vec3f(1.), clamp(max(max(tm.r, tm.g), tm.b) - 1., 0., 1.)*.5);
  return pow(min(tm, vec3f(1.)), vec3f(1./2.2));
}
fn hu(h: u32) -> u32 { var x = h; x ^= x >> 16u; x *= 0x7feb352du; x ^= x >> 15u; x *= 0x846ca68bu; x ^= x >> 16u; return x; }
fn h3(c: vec3f) -> vec3f {
  let q = bitcast<vec3u>(vec3i(floor(c)));
  let a = hu(q.x + hu(q.y + hu(q.z)));
  return vec3f(f32(a), f32(hu(a + 1u)), f32(hu(a + 2u))) / 4294967295.;
}
fn gc(i: vec3f, f: vec3f, o: vec3f) -> f32 { return dot(h3(i + o)*2. - 1., f - o); }
fn n3(p: vec3f) -> f32 {
  let i = floor(p); let f = p - i; let w = f*f*f*(f*(f*6. - 15.) + 10.);
  let a = mix(gc(i,f,vec3f(0.,0.,0.)), gc(i,f,vec3f(1.,0.,0.)), w.x);
  let b = mix(gc(i,f,vec3f(0.,1.,0.)), gc(i,f,vec3f(1.,1.,0.)), w.x);
  let c = mix(gc(i,f,vec3f(0.,0.,1.)), gc(i,f,vec3f(1.,0.,1.)), w.x);
  let d = mix(gc(i,f,vec3f(0.,1.,1.)), gc(i,f,vec3f(1.,1.,1.)), w.x);
  return mix(mix(a,b,w.y), mix(c,d,w.y), w.z) * 1.4;
}
// fbm whose finest octaves fade out once they are smaller than a pixel: nothing blinks
fn fbm(p: vec3f, oct: i32, fw: f32) -> f32 {
  var s = 0.; var a = .5; var q = p; var f = 1.;
  for (var i = 0; i < oct; i++) {
    if (fw*f > .6) { break; }
    s += a * n3(q) * (1. - smoothstep(.25, .6, fw*f));
    q = q*2.03 + vec3f(1.7, 9.2, 3.1); a *= .5; f *= 2.03;
  }
  return s;
}
fn warp(p: vec3f, k: f32, fw: f32) -> vec3f {
  return p + k*vec3f(fbm(p + vec3f(0.,3.1,7.4), 3, fw), fbm(p + vec3f(5.2,1.3,2.8), 3, fw), fbm(p + vec3f(9.7,6.6,.5), 3, fw));
}
fn rp(k: i32, i: i32) -> vec3f { return pb[8 + clamp(i, 0, 5)].rgb; }
fn ramp(k: i32, t: f32) -> vec3f {
  let n = pb[6].x - 1.; let x = clamp(t, 0., 1.) * n; let i = i32(floor(x));
  return mix(rp(k, i), rp(k, min(i + 1, i32(n))), x - floor(x));
}

struct V { f1: f32, f2: f32, c: vec3f, id: vec3f };
fn vor(q: vec3f) -> V {
  let i = floor(q); let f = q - i;
  var r: V; r.f1 = 9.; r.f2 = 9.; r.c = vec3f(0.); r.id = vec3f(0.);
  for (var z = -1; z <= 1; z++) { for (var y = -1; y <= 1; y++) { for (var x = -1; x <= 1; x++) {
    let o = vec3f(f32(x), f32(y), f32(z)); let hh = h3(i + o);
    let c = o + .15 + .7*hh - f; let d = length(c);
    if (d < r.f1) { r.f2 = r.f1; r.f1 = d; r.c = c; r.id = hh; } else if (d < r.f2) { r.f2 = d; }
  } } }
  return r;
}

// a crater field: height, slope (object space) and the rim's brightness
struct C { h: f32, g: vec3f, rim: f32, fl: f32 };
fn crat(p: vec3f, sc: f32, dens: f32, dep: f32, fw: f32) -> C {
  var r: C; r.h = 0.; r.g = vec3f(0.); r.rim = 0.; r.fl = 0.;
  let v = vor(p*sc);
  if (fract(v.id.z*13.7) > dens) { return r; }
  let rc = mix(.2, .44, v.id.y);
  let d = v.f1; let x = d/rc;
  if (x > 1.6) { return r; }
  let fade = 1. - smoothstep(.3, .9, fw*sc/rc);
  let dir = -v.c/max(d, 1e-4);
  var h = 0.; var dh = 0.;
  if (x < 1.) { h = max(x*x - 1., -.75); dh = select(2.*x, 0., x*x - 1. < -.75); }
  let e = (x - 1.)/.2; let rh = .3*exp(-e*e); h += rh; dh += rh*(-2.*e/.2);
  r.h = h*dep*fade; r.g = dir*dh*dep*fade; r.rim = rh/.3*fade; r.fl = select(0., 1., x < 1.)*fade;
  return r;
}

struct S { hs: f32, alb: vec3f, b: vec3f, spec: f32, rough: f32, emit: vec3f, glow: vec3f, cloud: f32, ccol: vec3f };

fn toLab(c: vec3f) -> vec3f {
  let l = .4122214708*c.r + .5363325363*c.g + .0514459929*c.b; let m = .2119034982*c.r + .6806995451*c.g + .1073969566*c.b; let s = .0883024619*c.r + .2817188376*c.g + .6299787005*c.b;
  let a = pow(max(vec3f(l, m, s), vec3f(0.)), vec3f(1./3.));
  return vec3f(.2104542553*a.x + .7936177850*a.y - .0040720468*a.z, 1.9779984951*a.x - 2.4285922050*a.y + .4505937099*a.z, .0259040371*a.x + .7827717662*a.y - .8086757660*a.z);
}
fn toRgb(c: vec3f) -> vec3f {
  let l = c.x + .3963377774*c.y + .2158037573*c.z; let m = c.x - .1055613458*c.y - .0638541728*c.z; let s = c.x - .0894841775*c.y - 1.2914855480*c.z;
  let a = vec3f(l*l*l, m*m*m, s*s*s);
  return vec3f(4.0767416621*a.x - 3.3077115913*a.y + .2309699292*a.z, -1.2684380046*a.x + 2.6097574011*a.y - .3413193965*a.z, -.0041960863*a.x - .7034186147*a.y + 1.7076147010*a.z);
}
fn chromaCap(c: vec3f, cmax: f32) -> vec3f {
  let q = toLab(c); let ch = length(q.yz);
  if (ch <= cmax) { return c; }
  return max(toRgb(vec3f(q.x, q.yz*cmax/ch)), vec3f(0.));
}
fn tang(g: vec3f, n: vec3f) -> vec3f { return g - n*dot(g, n); }

fn surf(k: i32, p: vec3f, s: vec3f, fw: f32) -> S {
  var o: S; o.hs = 0.; o.b = vec3f(0.); o.spec = 0.; o.rough = .5; o.emit = vec3f(0.); o.glow = vec3f(0.); o.cloud = 0.; o.ccol = vec3f(.9);
  let t = u.b.y;
  if (k == 0 || k == 10) {                      // rocky, metal: few big craters, maria
    let mar = smoothstep(.0, .3, fbm(p*1.3 + s, 4, fw));
    let c1 = crat(p, 1.6, .7, .5, fw); let c2 = crat(p + 3.1, 4., .55, .45, fw); let c3 = crat(p + 7.7, 10., .5, .4, fw);
    let fine = fbm(p*8. + s, 4, fw);
    var tone = mix(.62, .3, mar) + .07*fine + .1*(c1.rim + c2.rim*.8 + c3.rim*.6) - .06*c1.fl;
    if (k == 10) {
      tone = mix(.38, .2, mar) + .05*fine + .35*(c1.rim + c2.rim + c3.rim*.8);
      let pl = vor(p*2.4 + s); tone -= .1*(1. - smoothstep(.0, .04 + fw*2.4, pl.f2 - pl.f1));
      o.spec = .7; o.rough = .3;
    }
    o.alb = ramp(k, tone);
    o.b = c1.g + c2.g + c3.g + .15*vec3f(fbm(p*5. + 1., 3, fw), fbm(p*5. + 2., 3, fw), fbm(p*5. + 3., 3, fw));
  } else if (k == 1) {                          // crystal: tilted facets, pale seams
    let v = vor(p*3.2 + s); let v2 = vor(p*8.5 + s + 4.);
    let seam = 1. - smoothstep(.0, .035 + fw*3.2, v.f2 - v.f1);
    let seam2 = 1. - smoothstep(.0, .03 + fw*8.5, v2.f2 - v2.f1);
    o.alb = ramp(k, .3 + .3*v.id.x + .08*v2.id.x + .3*seam*step(.55, fract(v.id.z*7.)) + .06*seam2*(1. - smoothstep(.2, .6, fw*8.5)));
    o.b = (v.id - .5)*1.1 + (v2.id - .5)*.35;
    o.spec = .6; o.rough = .22;
    o.glow = vec3f(.55, .45, 1.)*.06*seam*step(.55, fract(v.id.z*7.));
  } else if (k == 2) {                          // ruin: dead continents, a city grid on the land
    let n = fbm(warp(p*1.2 + s, .5, fw), 5, fw);
    let land = smoothstep(-.04, .04, n);
    let dist = smoothstep(-.05, .25, fbm(p*3. + s + 9., 3, fw))*land;
    let q = p*14.;
    let gl = 1. - smoothstep(.0, .05 + fw*14., min(abs(fract(q.x) - .5), abs(fract(q.z) - .5)));
    let gfade = 1. - smoothstep(.15, .5, fw*14.);
    let basin = .08 + .12*smoothstep(-.3, -.04, n);
    o.alb = ramp(k, mix(basin, .5 + .1*fbm(p*6., 3, fw), land) - .25*gl*dist*gfade - .08*dist);
    let pts = smoothstep(.85, .97, h3(floor(q) + 3.).x)*(1. - smoothstep(.0, .25, length(fract(q) - .5)))*gfade;
    o.emit = vec3f(1., .55, .25)*1.2*pts*dist;
  } else if (k == 3) {                          // gas: belts and zones of uneven width, turbulence at their edges, storms
    let sd = s.x/1.37;
    /* пояса (M703): число, ширина, тон и мягкость каждой кромки — от зерна мира; ровная тельняшка
       одинаковых полос читалась одной и той же планетой во всех системах */
    let nb = 4. + floor(fract(sd*.618)*5.);
    let tb = fbm(vec3f(p.x*2.5, p.y*14., p.z*2.5) + s, 4, fw);
    let lat = p.y + .03*tb + .045*fbm(warp(p*3. + s, .6, fw), 3, fw);
    let yy = lat*nb + .5*sin(lat*nb*.8 + sd) + .22*sin(lat*nb*2.1 + sd*1.7) - .5;
    let bi = floor(yy); let bf = fract(yy);
    let ta = smoothstep(.15, .85, h3(vec3f(bi, sd, 1.)).x); let tb2 = smoothstep(.15, .85, h3(vec3f(bi + 1., sd, 1.)).x);
    let ew = mix(.04, .3, h3(vec3f(bi, sd, 2.)).y);
    var tone = .12 + .66*mix(ta, tb2, smoothstep(.5 - ew, .5 + ew, bf + .06*tb));
    let fine = sin(yy*9. + 2.*tb)*(1. - smoothstep(.2, .6, fw*nb*9.));
    tone += .05*fine + .07*fbm(p*vec3f(4., 20., 4.) + s, 3, fw);
    /* полюса — без поясов, рябая шапка темнее */
    let pol = smoothstep(.62, .9, abs(p.y));
    tone = mix(tone, .2 + .22*fbm(p*7. + s, 3, fw), pol*.85);
    /* штормы: от нуля до трёх, место и размер — от зерна; светлый овал или тёмный глаз */
    let ns = i32(floor(fract(sd*.377)*3.999));
    for (var j = 0; j < 3; j++) {
      if (j >= ns) { break; }
      let hj = h3(vec3f(sd, f32(j), 5.));
      let la = (hj.x - .5)*1.1; let lo = hj.y*6.2832;
      let cs = vec3f(cos(lo)*sqrt(1. - la*la), la, sin(lo)*sqrt(1. - la*la));
      let ex = normalize(cross(vec3f(0., 1., 0.), cs)); let ey = cross(cs, ex);
      let rw = mix(.11, .26, hj.z)/(1. + f32(j)*.4);
      let d = p - cs; let sx = dot(d, ex)/rw; let sy = dot(d, ey)/(rw*.55);
      if (dot(d, cs) < -.2 || sx*sx + sy*sy > 2.) { continue; }
      let sr = sqrt(sx*sx + sy*sy); let ang = atan2(sy, sx) + 2.5*exp(-sr*1.5);
      let sw = fbm(vec3f(cos(ang)*sr, sin(ang)*sr, f32(j))*3. + s, 3, fw);
      let st = 1. - smoothstep(.75, 1.05, sr + .1*sw);
      let lit = step(.4, fract(hj.z*7.));
      let core = mix(tone*.55 + .05*sw, .88 + .08*sw - .35*(1. - smoothstep(.1, .45, abs(sr - .62))), lit);
      tone = mix(tone, core, st);
    }
    o.alb = ramp(k, tone);
  } else if (k == 4 || k == 7 || k == 9) {      // jungle, ocean, terran: water and land
    var lv = .05; var sc = 1.1;
    if (k == 4) { lv = -.06; sc = 1.4; }
    if (k == 7) { lv = .34; sc = 2.3; }
    let n = fbm(warp(p*sc + s, .55, fw), 6, fw) + select(0., .12*n3(p*9. + s), k == 7);
    let land = smoothstep(lv, lv + .012, n);
    let shelf = smoothstep(lv - .14, lv, n);
    var sea = mix(rp(k, 0), rp(k, 1), shelf*shelf);
    if (k == 7) { sea = mix(rp(k, 0), rp(k, 3), shelf*shelf*.8); }
    let lat = abs(p.y);
    let rid = 1. - abs(n3(p*7. + s)); let mtn = smoothstep(.75, .95, rid)*smoothstep(lv + .04, lv + .2, n);
    var gr = ramp(k, .5 + .1*fbm(p*7. + s, 3, fw));
    if (k == 4) { gr = mix(mix(rp(k, 2), rp(k, 1), smoothstep(-.2, .3, fbm(p*5. + s, 4, fw))), rp(k, 3), (1.-smoothstep(lv + .01,lv + .06, n))*.6); }
    if (k == 7) { gr = mix(rp(k, 4), rp(k, 5), .3); }
    var ground = gr;
    if (k == 9) {
      let dry = (1.-smoothstep(.03,.17, abs(lat - .3)))*smoothstep(lv + .02, lv + .2, n);
      ground = mix(rp(k, 3), vec3f(.42, .33, .2), dry*.8);
      ground = mix(ground, rp(k, 2)*.8, (1.-smoothstep(.1,.4, lat))*.5);
    }
    ground = mix(ground, rp(k, 4)*.8, mtn*select(.6, .0, k == 4));
    var alb = mix(sea, ground, land);
    if (k != 4) {
      let cap = smoothstep(.94, .97, lat + .04*n3(p*6. + s));
      alb = mix(alb, rp(k, 5), cap); o.spec = (1. - land)*(1. - cap);
    } else { o.spec = 1. - land; }
    o.rough = .11; o.alb = alb;
    if (k == 9) {
      let city = smoothstep(.6, .75, n3(p*55. + s))*smoothstep(.3, .6, n3(p*6. + s + 2.))*land*(1. - smoothstep(.5, .7, lat))*(1. - smoothstep(.3, .6, fw*55.));
      o.emit = vec3f(1., .72, .38)*.9*city;
    }
    let cw = warp(p*vec3f(1.4, 4.2, 1.4) + s + vec3f(0., 0., t*.004), 1.1, fw);
    var cv = .5; if (k == 4) { cv = .6; } if (k == 7) { cv = .55; }
    let cf = fbm(cw*1.3, 5, fw); o.cloud = smoothstep(.05, .5, cf + cv - .55)*(.55 + .3*smoothstep(.1, .5, cf))*smoothstep(.0, .25, abs(p.y) + .15);
    o.b = .5*mtn*vec3f(n3(p*20.), n3(p*20. + 3.), n3(p*20. + 6.));
  } else if (k == 5) {                          // ice: white shell, long rust cracks
    let l1 = 1. - smoothstep(.0, .02 + fw*3., abs(n3(warp(p*2.2 + s, .3, fw))));
    let l2 = 1. - smoothstep(.0, .015 + fw*7., abs(n3(p*6.5 + s + 5.)));
    let mot = fbm(p*4. + s, 4, fw);
    let chaos = smoothstep(.25, .45, fbm(p*1.8 + s + 8., 3, fw));
    var alb = ramp(k, .82 + .1*mot - .3*chaos);
    let rust = vec3f(.28, .16, .1);
    alb = mix(alb, rust, .75*l1 + .5*l2*(1. - smoothstep(.2, .6, fw*7.)));
    o.alb = alb; o.spec = .4; o.rough = .35;
  } else if (k == 6) {                          // toxic: Venus-like haze, soft bands, chevrons
    let lon = atan2(p.z, p.x);
    let ch = p.y*4. + .6*abs(sin(lon*1.)) + .5*fbm(vec3f(p.x*3., p.y*9., p.z*3.) + s, 4, fw);
    let band = .5 + .5*sin(ch*3.);
    o.alb = ramp(k, .42 + .2*band + .06*fbm(warp(p*3. + s, .5, fw), 3, fw));
  } else if (k == 8) {                          // volcanic: basalt, ash, glowing rifts and lakes
    let ash = smoothstep(-.1, .3, fbm(p*1.7 + s, 4, fw));
    let r = 1. - abs(n3(warp(p*2.6 + s, .4, fw)));
    let crack = smoothstep(.975 - fw*2., .995, r)*smoothstep(-.1, .2, fbm(p*1.2 + s + 4., 3, fw));
    let lake = smoothstep(.56, .6, fbm(p*2.2 + s + 7., 4, fw));
    let crust = smoothstep(.42, .52, fbm(p*2.2 + s + 7., 4, fw));
    o.alb = mix(vec3f(.012, .010, .010) + .5*ramp(k, .05 + .08*fbm(p*6., 3, fw)), ramp(k, .22)*.8, ash*.6)*(1. - .5*crust);
    o.emit = vec3f(1., .3, .06)*(1.6*crack + 2.4*lake) + vec3f(.6, .12, .02)*crust*(1. - lake)*.4;
  } else {                                      // desert: dune seas, dark mesas
    let erg = smoothstep(-.05, .3, fbm(p*1.6 + s, 4, fw));
    let dir = normalize(vec3f(1., .3, .5));
    let dn = sin(dot(p, dir)*70. + 6.*fbm(p*4. + s, 3, fw));
    let dfade = 1. - smoothstep(.15, .5, fw*70./6.28);
    let mf = fbm(p*2.6 + s + 7., 5, fw); let mesa = smoothstep(.12, .24, mf + .06*n3(p*18. + s));
    var tone = .5 + .1*fbm(p*6. + s, 3, fw) + .1*dn*erg*dfade;
    tone = mix(tone, .2 + .12*fbm(p*12., 3, fw), mesa);
    o.alb = ramp(k, tone);
    o.hs = .05*mesa;
  }
  return o;
}

fn rx(v: vec3f, a: f32) -> vec3f { let c = cos(a); let s = sin(a); return vec3f(v.x, c*v.y - s*v.z, s*v.y + c*v.z); }
fn ry(v: vec3f, a: f32) -> vec3f { let c = cos(a); let s = sin(a); return vec3f(c*v.x + s*v.z, v.y, -s*v.x + c*v.z); }
fn toObj(v: vec3f, tilt: f32, spin: f32) -> vec3f { return ry(rx(v, -tilt), -spin); }
fn toView(v: vec3f, tilt: f32, spin: f32) -> vec3f { return rx(ry(v, spin), tilt); }

@fragment fn fs(i: VO) -> @location(0) vec4f {
  let v0 = pb[0]; let v1 = pb[1]; let v2 = pb[2]; let v3 = pb[3]; let v4 = pb[4]; let v5 = pb[5]; let v6 = pb[6];
  let q = i.p.xy/u.b.x; let r = v0.z; let d = (q - v0.xy)/r; let px = 1./(u.b.x*r);
  let k = i32(v0.w); let L = normalize(v1.xyz);
  let spin = v1.w*6.2831853; let tilt = v6.z;
  let air = chromaCap(v2.rgb, .09); let thick = v2.w;
  let sun = v3.rgb*v6.y;
  let seed = v3.w; let s = vec3f(seed*1.37, seed*.71, seed*2.13);
  let len = length(d);
  /* детализация — по CSS-пикселю, а не по физическому: на DPR 3 мельче глаз не видит, а платим октавами */
  let fw = 1.5*px*max(1., u.b.x*.6);
  var lin = vec3f(0.); var cov = 0.; var nz = -1.;
  if (len < 1. + px) {
    nz = sqrt(max(0., 1. - len*len));
    let N = vec3f(d, nz);
    let p = toObj(N, tilt, spin);
    let Lo = toObj(L, tilt, spin);
    let Vo = toObj(vec3f(0., 0., 1.), tilt, spin);
    let fwp = fw/max(nz, .15);
    var sf = surf(k, p, s, fwp);
    sf.alb = chromaCap(sf.alb, .1);
    let gv = toObj(vec3f(dpdx(sf.hs), dpdy(sf.hs), 0.)/px, tilt, spin)*nz;
    let n = normalize(p - tang(sf.b + gv, p)*.9);
    let mu0 = dot(n, Lo); let mu = max(dot(n, Vo), .02); let m0g = dot(p, Lo);
    var dif = 0.;
    if (thick == 0.) {
      dif = max(mu0, 0.)*1.6/(max(mu0, 0.) + mu + .2)*smoothstep(-.02, .06, m0g) + .02*max(mu0, 0.);
      dif = mix(dif, max(mu0, 0.), .35);
    } else {
      let w = thick*3.;
      dif = clamp((mu0 + w)/(1. + w), 0., 1.)*smoothstep(-w, .05, m0g);
    }
    var sc = sf.alb*dif*sun;
    let H = normalize(Lo + Vo);
    let sp = pow(max(dot(n, H), 0.), 2./(sf.rough*sf.rough*sf.rough + .002))*sf.spec*smoothstep(.0, .1, mu0);
    sc += sun*sp*(.04 + .5*pow(1. - mu, 5.))*select(1., 3., sf.rough < .32);
    let night = 1. - smoothstep(-.12, .12, m0g);
    sc += sf.emit*(.05 + .95*night) + sf.glow*(.3 + .7*night);
    if (sf.cloud > 0.) {
      let cd = clamp((dot(p, Lo) + .15)/1.15, 0., 1.);
      sc = mix(sc, sf.ccol*cd*sun, sf.cloud);
    }
    /* огни построек (gplCities, 17ga): точки тела на стороне от звезды; на мокрых мирах — только на суше */
    let nc = i32(v6.w);
    if (nc > 0) {
      var g = 0.; var ha = 0.;
      for (var j = 0; j < nc; j++) {
        let c = pb[16 + j]; let dv = (d - c.xy)*r; let dd = dot(dv, dv);
        if (dd < 160.) {
          let cp = toObj(vec3f(c.xy, sqrt(max(0., 1. - dot(c.xy, c.xy)))), tilt, spin);
          let ld = landAt(k, cp, s, fw);
          g += exp(-dd/6.)*c.z*ld; ha += exp(-dd/54.)*c.z*ld;
        }
      }
      let lk = (.25 + .75*night)*(1. - sf.cloud*.5);
      sc += (vec3f(1., .82, .55)*min(g, 1.)*1.4 + vec3f(1., .45, .18)*min(ha, 1.)*.25)*lk;
    }
    if (thick > 0.) {
      let path = min(thick*3./max(nz, .04), 3.);
      let litA = smoothstep(-.25, .35, m0g);
      let warm = (1.-smoothstep(-.05,.4, m0g))*litA;
      let tint = mix(air, air*vec3f(1.6, .75, .45), warm);
      sc = sc*exp(-path*.3) + tint*(1. - exp(-path))*litA*sun*.6;
    }
    if (k == 3 || k == 6) { sc *= .55 + .45*pow(nz, .35); }
    /* тень кольца на диске: луч к звезде пересекает плоскость кольца */
    if (v4.w > 0.) {
      let tt = v4.w; let RN = vec3f(0., sqrt(1. - tt*tt), -tt); let dq = dot(L, RN);
      if (abs(dq) > 1e-3) {
        let sh = -dot(N, RN)/dq;
        let rh = length(N + L*sh);
        if (sh > 0.) { let rg = ring(rh, v4, v5, max(px*3., .004)); sc *= 1. - rg.a*.85; }
      }
    }
    cov = clamp((1. - len)/px + .5, 0., 1.);
    lin = sc*cov;
  }
  /* воздух за краем диска — с дневной стороны, у терминатора рыжий */
  if (thick > 0. && len > 1. - 2.*px) {
    let h = max(len - 1., 0.)/thick;
    let n2 = vec3f(d/max(len, 1e-4), 0.);
    let litA = smoothstep(-.35, .45, dot(n2, L));
    let warm = (1.-smoothstep(-.1,.35, dot(n2, L)))*litA;
    let tint = mix(air, air*vec3f(1.6, .75, .45), warm);
    lin += tint*exp(-h*2.2)*smoothstep(1. - 2.*px, 1., len)*litA*sun*.9;
  }
  var acc = vec4f(tmap(lin), cov);
  if (v4.w > 0.) {
    let tt = v4.w; let st = sqrt(1. - tt*tt);
    let rho = length(vec2f(d.x, d.y/tt)); let zr = d.y/tt*st;
    var rg = ring(rho, v4, v5, px*length(vec2f(d.x, d.y/max(tt*tt, .0064)))/max(rho, .01));
    /* тень планеты на кольце */
    let P = vec3f(d.x, d.y, zr); let b = dot(P, L); let cc = dot(P, P) - 1.; let disc = b*b - cc;
    if (b < 0. && disc > 0.) { rg = vec4f(rg.rgb*(1. - smoothstep(0., .04, disc)*.85), rg.a); }
    let lt = .55 + .45*clamp(abs(L.z), 0., 1.);
    rg = vec4f(rg.rgb*lt*mix(vec3f(1.), v5.rgb, .25), rg.a);
    if (zr > nz) { acc = over(acc, rg); } else { acc = over(rg, acc); }
  }
  return acc;
}`;
const gorLin=c=>Math.pow(Math.max(0,c)/255,2.2);
/* ── один конвейер на семью миров ──
   Все двенадцать миров в одной `surf` компилировались 3.1–3.5 с (Blackwell, D3D12): прогрев
   конвейеров кончался позже всех и ворота старта ждали его одного. Константа вместо `k` не
   спасает (2 с — ветки выбрасываются поздно), вырезанная из текста — спасает: семья стоит
   0.2–1.2 с, и строится она асинхронно, когда впервые понадобилась. Пока не готова — рисует
   запасной шар 17ga: подмена на полсекунды лучше замершего кадра. Семьи — по веткам `surf`:
   0 камень+металл, 1 кристалл, 2 руины, 3 газ, 4 джунгли+океан+земля, 5 лёд, 6 токсик,
   7 вулкан, 8 пустыня */
const GOR_FAM=[0,1,2,3,4,5,6,4,7,4,0,8],GOR_CODE=[];
function gorCode(f){
  if(GOR_CODE[f])return GOR_CODE[f];
  const s=GOR_WGSL,a=s.indexOf("fn surf("),b=s.indexOf("fn rx("),body=s.slice(a,b);
  const h=body.indexOf("  if (k == 0 || k == 10) {"),t=body.lastIndexOf("  return o;");
  const parts=body.slice(h,t).split(/\n  \} else (?:if \([^\n]*\) )?\{/);
  /* ветки разошлись с таблицей семей — честнее целый шар, чем чужая ветка */
  if(h<0||t<0||parts.length!==9)return GOR_CODE[f]=s;
  parts[0]=parts[0].replace(/^  if \([^\n]*\) \{/,"");
  parts[8]=parts[8].replace(/\n  \}\s*$/,"");
  return GOR_CODE[f]=s.slice(0,a)+body.slice(0,h)+"  {"+parts[f]+"\n  }\n"+body.slice(t)+s.slice(b);
}
/* конвейер семьи: прогретый (08b1) — сразу; иначе сборка в фоне и null, пока не собран */
function gorPipe(f){
  const key="pipe:gor"+f+"|over",code=gorCode(f),w=GPU_PIPES.warm.get(key);GPU_PIPES.used.add(key);
  if(GPU.lay["gor"+f+"|over"]||(w&&w.p))return gpuPipe("gor"+f,code,"over");
  if(!w){const d=gpuPipesDev(),e={p:null,code};GPU_PIPES.warm.set(key,e);
    d.createRenderPipelineAsync(gpuPipeDesc(code,"over")).then(p=>{if(GPU_PIPES.dev===d)e.p=p;},
      ()=>{GPU_PIPES.warm.delete(key);GOR_CODE[f]=null;});}
  return null;
}
/* газовые гиганты (M703): своя палитра у каждого — по зерну; у мира одна сиреневая на всех, и все
   гиганты галактики выходили близнецами. Тёмное → светлое, пять ступеней, sRGB */
const GOR_GAS=[
  [[70,42,30],[128,82,52],[184,136,96],[222,196,160],[244,232,214]],     /* юпитер: охра и сливки */
  [[96,74,40],[156,124,72],[204,172,112],[232,212,160],[246,236,206]],   /* сатурн: ириска */
  [[40,88,104],[78,140,152],[128,186,192],[180,222,222],[222,244,240]],  /* ледяной: бирюза */
  [[18,32,92],[36,70,150],[70,118,196],[128,170,226],[204,226,248]],     /* глубокий синий */
  [[40,18,16],[92,40,30],[150,72,46],[198,120,80],[232,180,140]],        /* горячий: ржавь */
  [[64,52,24],[124,104,44],[184,160,76],[220,204,130],[242,234,190]],    /* серный */
  [[52,38,72],[96,68,110],[152,116,138],[204,168,158],[238,216,198]],    /* сиреневый, прежний */
  [[24,52,48],[50,96,84],[96,146,120],[156,194,160],[214,232,204]]];     /* аммиачный, зелёный */
/* одно тело: k — мир (GOR.K), pal — палитра 0..255, air — цвет воздуха, th — его толщина */
function gorBody(pass,key,x,y,r,o){
  const P=gorPipe(GOR_FAM[o.k]|0);if(!P)return false;
  const a=GOR.A;a.fill(0);
  const l=Math.hypot(o.sx,o.sy)||1,kx=Math.sqrt(1-GOR_LZ*GOR_LZ)/l;
  a[0]=x;a[1]=y;a[2]=r;a[3]=o.k;
  a[4]=o.sx*kx;a[5]=o.sy*kx;a[6]=GOR_LZ;a[7]=o.turn||0;
  a[8]=gorLin(o.air[0]);a[9]=gorLin(o.air[1]);a[10]=gorLin(o.air[2]);a[11]=o.th||0;
  /* цвет звезды — наполовину к белому: палитра мира должна читаться и у красного карлика */
  /* у гиганта — на три четверти к белому (M703): облака сами цветные, и под тёплой звездой все гиганты
     сползали в одну желтизну */
  const tw=o.k===3?.75:.5;
  a[12]=tw+(1-tw)*o.sun[0];a[13]=tw+(1-tw)*o.sun[1];a[14]=tw+(1-tw)*o.sun[2];a[15]=o.seed||0;
  const R=o.ring;if(R){a[16]=R.i;a[17]=R.o;a[18]=(R.s%997)*.013;a[19]=R.tilt;a[23]=R.n;}
  a[20]=o.sun[0];a[21]=o.sun[1];a[22]=o.sun[2];
  const pal=o.pal,np=Math.min(6,pal.length);
  a[24]=np;a[25]=GOR_LIT;a[26]=GOR_TILT;a[27]=o.cities||0;
  for(let i=0;i<(o.cities||0)*4;i++)a[64+i]=o.cpts[64+i];
  for(let i=0;i<6;i++){const c=pal[Math.min(i,np-1)];a[32+i*4]=gorLin(c[0]);a[33+i*4]=gorLin(c[1]);a[34+i*4]=gorLin(c[2]);}
  const U=GPUBufferUsage,d=GPU.dev;
  const ub=gpuBuf("gpl.u",32,U.UNIFORM|U.COPY_DST);
  const u=GOR.U;u[0]=GPU.bw;u[1]=GPU.bh;u[2]=W;u[3]=H;u[4]=DPR;u[5]=G.t||0;d.queue.writeBuffer(ub,0,u);
  const sb=gpuBuf("gor.b."+key,1024,U.STORAGE|U.COPY_DST);d.queue.writeBuffer(sb,0,a);
  pass.setPipeline(P);pass.setBindGroup(0,gpuBind("gor."+key,P,[ub,sb]));pass.draw(6);
  return true;
}
/* планета системы: false — мир не из двенадцати, пусть рисует 17ga */
function gpuOrb(p,x,y,r,lights){
  const k=GOR.K[p.type];if(k===undefined||!p.T||!p.T.pal)return false;
  const pass=gpuScene();if(!pass)return true;
  const gas=p.type==="gas",airless=!gas&&p.T.atm==="отсутствует";
  const sky=gas?GOR_GAS[(h01(p.seed|0,3,0x6A5)*GOR_GAS.length)|0][4]:((p.T.sky&&p.T.sky[0])||[130,180,210]);
  const sa=PLANET_BAKE_ANG+planetSunRot(p),sx=Math.cos(sa),sy=Math.sin(sa);
  const o={k,sx,sy,turn:planetSpin(p)/TAU,air:sky,th:airless?0:(GOR_AIR[p.type]||0),sun:gplSun(),seed:p.seed%97,
    pal:gas?GOR_GAS[(h01(p.seed|0,3,0x6A5)*GOR_GAS.length)|0]:p.T.pal,ring:(p.ring&&r>5)?p.ring:null,cities:0};
  /* огни построек — те же точки, что у 17ga; сушу под ними проверяет шейдер своими материками */
  if(lights){const C=GOR.C||(GOR.C=new Float32Array(256));C.fill(0);
    o.cities=gplCities({sx,sy,lights,wet:0,seed:o.seed,T:o.turn},C);o.cpts=C;}
  return gorBody(pass,"p"+(p.idx|0),x,y,r,o);
}
/* луна (M701): тот же шар, каменистый, серый по прежнему тону луны */
const GOR_MOON=[[30,32,36],[58,62,68],[92,98,106],[128,136,146],[160,168,178],[196,204,212]];
function gpuOrbMoon(m,key,x,y,r){
  const pass=gpuScene();if(!pass)return true;
  const dx=-(m.x||0),dy=-(m.y||0),dl=Math.hypot(dx,dy)||1;
  return gorBody(pass,"m"+key,x,y,Math.max(1.2,r),{k:0,sx:dx/dl,sy:dy/dl,turn:0,air:[0,0,0],th:0,sun:gplSun(),
    seed:(m.seed||key.length*13)%97,pal:GOR_MOON,ring:null,cities:0});
}
