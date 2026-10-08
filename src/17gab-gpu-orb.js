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
/* огни городов (M800): города (×18) и кварталы (×55). Масштаб мельче двух пикселей не гаснет, а
   сходится к своему среднему — иначе на зуме 2–3 от огней оставалась одна точка (ничто не мигает, и
   ничто не пропадает) */
fn cityLit(p: vec3f, s: vec3f, fw: f32) -> f32 {
  let c1 = smoothstep(.32, .62, n3(p*18. + s + 5.));
  let c2 = smoothstep(.05, .45, n3(p*55. + s));
  return mix(c1, .07, smoothstep(.25, .6, fw*18.))*mix(c2, .22, smoothstep(.25, .6, fw*55.));
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

struct V { f1: f32, f2: f32, c: vec3f, id: vec3f, c2: vec3f, id2: vec3f };
fn vor(q: vec3f) -> V {
  let i = floor(q); let f = q - i;
  var r: V; r.f1 = 9.; r.f2 = 9.; r.c = vec3f(0.); r.id = vec3f(0.); r.c2 = vec3f(0.); r.id2 = vec3f(0.);
  for (var z = -1; z <= 1; z++) { for (var y = -1; y <= 1; y++) { for (var x = -1; x <= 1; x++) {
    let o = vec3f(f32(x), f32(y), f32(z)); let hh = h3(i + o);
    let c = o + .15 + .7*hh - f; let d = length(c);
    if (d < r.f1) { r.f2 = r.f1; r.c2 = r.c; r.id2 = r.id; r.f1 = d; r.c = c; r.id = hh; } else if (d < r.f2) { r.f2 = d; r.c2 = c; r.id2 = hh; }
  } } }
  return r;
}

fn vedge(v: V) -> f32 { return (dot(v.c2, v.c2) - dot(v.c, v.c))/(2.*max(length(v.c2 - v.c), 1e-4)); }

// a crater field: height, slope (object space) and the rim's brightness
struct C { h: f32, g: vec3f, rim: f32, fl: f32 };
fn crat(p: vec3f, sc: f32, dens: f32, dep: f32, fw: f32) -> C {
  var r: C; r.h = 0.; r.g = vec3f(0.); r.rim = 0.; r.fl = 0.;
  /* кратер — ближайший по d/rc среди живых ячеек (M825): ближайшая точка Вороного резала большой кратер
     прямым швом по границе соседней ячейки */
  let q = p*sc; let i0 = floor(q); let f = q - i0;
  var x = 9.; var rc = 1.; var dv = vec3f(0.);
  for (var z = -1; z <= 1; z++) { for (var y = -1; y <= 1; y++) { for (var xx = -1; xx <= 1; xx++) {
    let o = vec3f(f32(xx), f32(y), f32(z)); let hh = h3(i0 + o);
    if (fract(hh.z*13.7) > dens) { continue; }
    let c = o + .15 + .7*hh - f; let r0 = mix(.2, .44, hh.y); let xc = length(c)/r0;
    if (xc < x) { x = xc; rc = r0; dv = c; }
  } } }
  if (x > 1.6) { return r; }
  let d = x*rc;
  let fade = 1. - smoothstep(.3, .9, fw*sc/rc);
  let dir = -dv/max(d, 1e-4);
  var h = 0.; var dh = 0.;
  if (x < 1.) { h = max(x*x - 1., -.75); dh = select(2.*x, 0., x*x - 1. < -.75); }
  let e = (x - 1.)/.2; let rh = .3*exp(-e*e); h += rh; dh += rh*(-2.*e/.2);
  r.h = h*dep*fade; r.g = dir*dh*dep*fade; r.rim = rh/.3*fade; r.fl = select(0., 1., x < 1.)*fade;
  return r;
}

struct S { hs: f32, alb: vec3f, b: vec3f, spec: f32, rough: f32, emit: vec3f, glow: vec3f, cloud: f32, ccol: vec3f, land: f32 };

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

var<private> gLo: vec3f;
/* облака джунглей (M825c): рваный край — эрозия мелким шумом, без вихревых лент */
fn cloudJ(p: vec3f, s: vec3f, t: f32, fw: f32) -> f32 {
  let q = p*vec3f(1.8, 2.6, 1.8) + s + vec3f(t*.003, 0., 0.);
  let base = fbm(warp(q, .35, fw), 4, fw); let er = fbm(q*4.3 + 11., 3, fw);
  return smoothstep(.02, .2, base + .3*er - .1)*smoothstep(.0, .25, abs(p.y) + .15);
}
fn surf(k: i32, p: vec3f, s: vec3f, fw: f32) -> S {
  var o: S; o.hs = 0.; o.b = vec3f(0.); o.spec = 0.; o.rough = .5; o.emit = vec3f(0.); o.glow = vec3f(0.); o.cloud = 0.; o.ccol = vec3f(.9); o.land = 1.;
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
    if (k == 0) {
      /* камень не нейтрально-серый (M825): материки теплее (окислы — охра или ржавь, по зерну мира),
         моря — холодный базальт; тон гуляет медленным полем, а не заливкой */
      let mn = smoothstep(-.25, .3, fbm(p*2.1 + s + 11., 3, fw));
      let hw = fract(s.x*.37);
      let warm = mix(vec3f(1.45, 1.02, .62), vec3f(1.55, .9, .56), smoothstep(.55, .85, hw));
      o.alb = o.alb*mix(vec3f(.9, .95, 1.05), warm, clamp(.35 + .65*mn - .45*mar, 0., 1.));
    }
    o.b = c1.g + c2.g + c3.g + .15*vec3f(fbm(p*5. + 1., 3, fw), fbm(p*5. + 2., 3, fw), fbm(p*5. + 3., 3, fw));
  } else if (k == 1) {                          // crystal: fields of three sizes, chipped steps, light inside
    /* M825c: поля трёх размеров пятнами — крупные плоские грани (×1.5), средние (×4.5), друзы (×13.5); размер
       выбирает крупная ячейка по своему центру, так что поле не режется маской. Между крупными полями — скол
       ступенью: у верхнего светлая кромка, у нижнего тень со стороны от звезды и тёмная стенка. Швы светятся
       изнутри только у граней, повёрнутых к звезде, и не у всех */
    let qL = p*2.3 + s; let vL = vor(qL);
    let pc = (qL + vL.c - s)/2.3;
    let lv = h3(vL.id + 2.).x*.55 + .45*smoothstep(-.3, .35, fbm(pc*1.1 + s + 3., 3, fw));
    let dF = 1. - smoothstep(.2, .5, fw*15.);
    let med = step(.3, lv); let dru = step(.62, lv)*dF;
    let vM = vor(p*6. + s + 4.); let vD = vor(p*15. + s + 9.);
    var fid = vL.id; var fb = (vL.id - .5)*1.3;
    if (med > 0.) { fid = vM.id; fb = (vM.id - .5)*1.5; }
    if (dru > .5) { fid = vD.id; fb = (vD.id - .5)*1.3; }
    let eL = vedge(vL)/2.3; let eM = vedge(vM)/6.; let eD = vedge(vD)/15.;
    let sL = 1. - smoothstep(.0, .006 + fw, eL);
    let sM = (1. - smoothstep(.0, .004 + fw, eM))*med;
    let sD = (1. - smoothstep(.0, .003 + fw, eD))*dru;
    /* стекло фиолетовое при любой палитре мира: от палитры берётся только яркость; внутри грани — вуаль
       (грань не заливка) */
    let hue = mix(vec3f(.78, .6, 1.3), vec3f(.62, .64, 1.36), fid.y);
    let rv = ramp(k, .26 + .13*fid.x);
    let veil = fbm(p*7. + fid*13., 3, fw);
    var alb = vec3f(dot(rv, vec3f(.2126, .7152, .0722)))*hue*(.78 + .5*veil)*(1. - .45*sM - .4*sD);
    /* скол: ступень между крупными полями разной высоты */
    let hL = h3(vL.id + 5.).y; let hN = h3(vL.id2 + 5.).y;
    let stepK = smoothstep(.1, .3, abs(hL - hN))*(1. - med);   /* скол — у крупного поля; сквозь средние грани он шёл дугой-проволокой */
    let tdir = normalize(tang(vL.c2 - vL.c, p) + vec3f(1e-5));
    let bw = .014 + fw;
    if (hL > hN) {
      let lip = (1. - smoothstep(.0, bw, eL))*stepK;
      fb -= tdir*1.1*lip;
      alb = mix(alb, vec3f(dot(ramp(k, .9), vec3f(.2126, .7152, .0722)))*vec3f(.9, .86, 1.1), .45*lip);
    } else {
      let Lt = tang(gLo, p); let lt = length(Lt);
      let toward = max(dot(Lt, tdir)/max(lt, 1e-4), 0.);
      let ws = (hN - hL)*.07*toward*lt/max(dot(p, gLo), .08);
      let sh = (1. - smoothstep(ws*.6, ws + fw, eL))*step(.001, ws)*stepK;
      let wall = (1. - smoothstep(.0, .004 + fw, eL))*stepK;
      alb = alb*(1. - .7*sh)*(1. - .5*wall);
    }
    let nf = normalize(p - tang(fb, p)*.9);
    let face = smoothstep(.35, .75, dot(nf, gLo))*step(.55, fract(fid.z*7.));
    o.alb = alb; o.b = fb;
    o.spec = 1.; o.rough = .16;
    o.glow = vec3f(.5, .3, 1.)*(.02 + .03*fid.z + .16*clamp(sL*(1. - med)*(1. - stepK*.5) + sM + .6*sD, 0., 1.)*face);
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
    let land = smoothstep(lv, lv + .012 + fw*3., n);   /* берег — с поправкой на пиксель: без неё лесенка (M825c) */
    let shelf = smoothstep(lv - .14, lv, n);
    var sea = mix(rp(k, 0), rp(k, 1), shelf*shelf);
    if (k == 7) { sea = mix(rp(k, 0), rp(k, 3), shelf*shelf*.8); }
    let lat = abs(p.y);
    let rid = 1. - abs(n3(p*7. + s)); let mtn = smoothstep(.75, .95, rid)*smoothstep(lv + .04, lv + .2, n);
    var gr = ramp(k, .5 + .1*fbm(p*7. + s, 3, fw));
    if (k == 4) { gr = mix(mix(rp(k, 2), rp(k, 1), smoothstep(-.2, .3, fbm(p*5. + s, 4, fw))), rp(k, 3), (1.-smoothstep(lv + .01,lv + .06, n))*.6); }
    /* рельеф джунглей (M825c): хребты светлее, долины темнее, высота — через hs, свет её читает */
    var rel = 0.; var rb = vec3f(0.);
    if (k == 4) {
      rel = 1. - abs(fbm(p*4.2 + s + 2., 4, fw)*1.8); rel = rel*rel;
      /* наклон — разностями по телу, не dpdx: производная по квадам 2×2 клала лесенку по гребням и берегу */
      let u1 = normalize(cross(p, vec3f(.01, 1., .02))); let u2 = cross(p, u1); let ue = .006;
      var r1 = 1. - abs(fbm((p + u1*ue)*4.2 + s + 2., 4, fw)*1.8); r1 = r1*r1;
      var r2 = 1. - abs(fbm((p + u2*ue)*4.2 + s + 2., 4, fw)*1.8); r2 = r2*r2;
      rb = .035*(u1*(r1 - rel) + u2*(r2 - rel))/ue;
      gr = gr*mix(.68, 1.18, rel)*mix(vec3f(1.), vec3f(1.08, 1.04, .9), smoothstep(.6, .9, rel));
    }
    if (k == 7) { gr = mix(rp(k, 4), rp(k, 5), .3); }
    var ground = gr;
    if (k == 9) {
      let dry = (1.-smoothstep(.03,.17, abs(lat - .3)))*smoothstep(lv + .02, lv + .2, n);
      ground = mix(rp(k, 3), vec3f(.42, .33, .2), dry*.8);
      ground = mix(ground, rp(k, 2)*.8, (1.-smoothstep(.1,.4, lat))*.5);
    }
    ground = mix(ground, rp(k, 4)*.8, mtn*select(.6, .0, k == 4));
    var alb = mix(sea, ground, land);
    if (k == 4) {
      /* реки: нулевые линии искривлённого поля, рвутся по длине, только в глубине суши; два семейства —
         русла (5) и притоки (9.5, тоньше), иначе на материк выходила одна извилина */
      let t1 = normalize(cross(p, vec3f(.01, 1., .02))); let t2 = cross(p, t1); let he = .004;
      var rv = 0.;
      for (var ri = 0; ri < 2; ri++) {
        let fq = select(5., 9.5, ri == 1); let ro = s + 7. + f32(ri)*13.;
        let rf = fbm(warp(p*fq + ro, .6, fw), 3, fw);
        let rg = vec2f(fbm(warp((p + t1*he)*fq + ro, .6, fw), 3, fw) - rf, fbm(warp((p + t2*he)*fq + ro, .6, fw), 3, fw) - rf)/he;
        let rd = abs(rf)/max(length(rg), 1e-3); let rhw = max(select(.005, .0035, ri == 1), fw*.75);
        rv = max(rv, (1. - smoothstep(rhw, rhw + fw*.6, rd))*smoothstep(select(-.1, .3, ri == 1), select(.15, .5, ri == 1), n3(p*select(2.4, 4.1, ri == 1) + s + 1. + f32(ri)*5.)));
      }
      rv *= smoothstep(lv + .02, lv + .08, n)*(1. - smoothstep(.2, .6, fw*20.));
      alb = mix(alb, rp(k, 0)*.22, rv);
      rb = rb*smoothstep(lv, lv + .1, n);   /* рельеф растёт от берега */
      /* тень облаков — облако со стороны звезды, сдвиг ~1.5 % диска */
      let Lt = tang(gLo, p);
      let csh = cloudJ(normalize(p + Lt/max(length(Lt), 1e-4)*.03), s, t, fw);
      alb = alb*(1. - .55*csh);
    }
    if (k != 4) {
      /* шапка — зерно, не заливка (M804): рваный край двумя масштабами, крупа льда и голубые трещины */
      let cap = smoothstep(.93, .975, lat + .04*n3(p*6. + s) + .02*n3(p*21. + s));
      let grain = (.72 + .28*n3(p*70. + s))*(1. - .3*smoothstep(.55, .75, n3(p*120. + s)));
      let capC = rp(k, 5)*.88*grain*mix(vec3f(1.), vec3f(.8, .89, 1.), smoothstep(.4, .8, n3(p*34. + s)));
      alb = mix(alb, capC, cap); o.spec = (1. - land)*(1. - cap);
    } else { o.spec = 1. - land; }
    o.rough = .11; o.alb = alb; o.land = smoothstep(lv + .004, lv + .07, n)*(1. - smoothstep(.85, .95, lat));   // огни глубже в суше, берег не режет их краем
    if (k == 9) {
      /* свои огни у земли: районы ×6, в них города; тусклее огней ваших построек */
      let city = cityLit(p, s, fw)*smoothstep(.3, .6, n3(p*6. + s + 2.))*o.land*(1. - smoothstep(.5, .7, lat));
      o.emit = vec3f(1., .72, .38)*.5*city;
    }
    let cw = warp(p*vec3f(1.4, 4.2, 1.4) + s + vec3f(0., 0., t*.004), 1.1, fw);
    var cv = .5; if (k == 4) { cv = .6; } if (k == 7) { cv = .55; }
    let cf = fbm(cw*1.3, 5, fw); o.cloud = smoothstep(.05, .5, cf + cv - .55)*(.55 + .3*smoothstep(.1, .5, cf))*smoothstep(.0, .25, abs(p.y) + .15);
    if (k == 4) { o.cloud = cloudJ(p, s, t, fw)*.88; }
    o.b = .5*mtn*vec3f(n3(p*20.), n3(p*20. + 3.), n3(p*20. + 6.)) + rb;
  } else if (k == 5) {                          // ice: plates of snow, bare ice and frost, cut by deep cracks
    /* M825c: поля разного альбедо — наст, голый лёд, иней — пятнами с рваной кромкой; трещин немного, они
       широкие (.024–.07 радиуса) и глубокие: тёмное дно, стенки наклонены — к звезде светлая, дальняя в тени,
       по бокам валы; у трещин торосы */
    let mot = fbm(p*4. + s, 4, fw);
    let pf = fbm(warp(p*1.7 + s + 2., .5, fw), 4, fw);
    let pg = fbm(p*2.6 + s + 6., 3, fw) + .15*n3(p*11. + s) + .07*n3(p*31. + s)*(1. - smoothstep(.2, .6, fw*31.));
    let snow = smoothstep(.02, .07, pf + .05*n3(p*23. + s)); let bare = smoothstep(.05, .085, pg)*(1. - snow);
    var alb = mix(ramp(k, .64 + .05*mot)*(.95 + .1*n3(p*40. + s)*(1. - smoothstep(.2, .6, fw*40.))),
                  mix(vec3f(dot(ramp(k, .44 + .05*mot), vec3f(.2126, .7152, .0722))), ramp(k, .44 + .05*mot), .55)*(.9 + .14*fbm(p*14. + s, 2, fw)), bare);
    alb = mix(alb, ramp(k, .82 + .04*mot), snow);
    let chaos = smoothstep(.3, .5, fbm(p*1.8 + s + 8., 3, fw));
    alb = mix(alb, alb*vec3f(.82, .74, .68), .45*chaos*smoothstep(.4, .7, mot));
    let rust = vec3f(.24, .18, .14);
    var fl = 0.; var wl = 0.; var rim = 0.; var tor = 0.; var gb = vec3f(0.);
    /* четыре трещины по осям тетраэдра, повёрнутого зерном: оси всегда далеко друг от друга — не пучок */
    let hr = h3(vec3f(s.x, s.y, 13.)); let ra = hr.x*6.2832; let rb = (hr.y - .5)*3.1416;
    for (var j = 0; j < 4; j++) {
      let hj = h3(vec3f(s.x, f32(j), 9.));
      let tv = vec3f(select(-1., 1., j == 0 || j == 1), select(-1., 1., j == 0 || j == 2), select(-1., 1., j == 0 || j == 3));
      let t1 = vec3f(tv.x*cos(ra) - tv.z*sin(ra), tv.y, tv.x*sin(ra) + tv.z*cos(ra));
      let ax = normalize(vec3f(t1.x, t1.y*cos(rb) - t1.z*sin(rb), t1.y*sin(rb) + t1.z*cos(rb)) + (hj - .5)*.3);
      let wob = .05*n3(p*2.3 + f32(j)*7.1 + s) + .012*n3(p*9. + f32(j)*3.7 + s);
      let sd = dot(p, ax) - (hj.z - .5)*.5 + wob;
      let along = smoothstep(.2, .5, n3(p*1.1 + vec3f(f32(j)*3.3, 0., 1.) + s) + .35);
      let hw = .012 + .023*fract(hj.z*13.)*(.6 + .4*n3(p*3. + f32(j) + s)) + fw*.5;
      let ad = abs(sd);
      let inC = 1. - smoothstep(hw*.85, hw + fw, ad);
      let flK = 1. - smoothstep(hw*.45, hw*.8, ad);
      let le = (ad - hw*1.3)/(hw*.35); let lev = exp(-le*le);
      let g = tang(ax, p)*select(-1., 1., sd >= 0.);
      gb += g*(1.1*inC*(1. - flK) - .3*le*lev)*along;
      fl = max(fl, flK*along); wl = max(wl, inC*(1. - flK)*along); rim = max(rim, lev*along);
      tor = max(tor, (1. - smoothstep(hw*1.6, hw*5., ad))*along);
    }
    let tq = p*26. + s;
    let tfade = 1. - smoothstep(.2, .6, fw*26.);
    gb += tor*(1. - wl)*.25*tfade*vec3f(n3(tq), n3(tq + 3.), n3(tq + 6.));
    alb = alb*mix(1., .88 + .2*n3(tq*1.3 + 2.), tor*tfade);
    let l2 = 1. - smoothstep(.0, .01 + fw*7., abs(n3(p*6.5 + s + 5.)));
    alb = mix(alb, alb*vec3f(.8, .74, .7), .2*l2*(1. - smoothstep(.2, .6, fw*7.)));
    alb = mix(alb, ramp(k, .88), .12*rim);
    alb = mix(alb, alb*vec3f(.7, .8, .92), .5*wl);
    alb = mix(alb, rust, .85*fl);
    o.alb = alb; o.b = gb; o.spec = .35; o.rough = .3;
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
  let air = chromaCap(v2.rgb, select(select(.09, .055, k == 4), .02, k == 1)); let thick = v2.w;   /* у кристалла воздух почти серый: небо системы красило стекло (M825c) */
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
    gLo = Lo;
    var sf = surf(k, p, s, fwp);
    sf.alb = chromaCap(sf.alb, select(.1, .065, k == 4));   /* джунгли — под потолком насыщенности (M825) */
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
    /* стекло кристалла держит свой тон (M825c): тело освещено светом без его оттенка (8 % оттенка
       остаётся), цвет звезды — в блике и кромке */
    let sunB = select(sun, mix(vec3f(dot(sun, vec3f(.2126, .7152, .0722))), sun, .08), k == 1);
    var sc = sf.alb*dif*sunB;
    /* ночная сторона не чёрная (M804): пыль неба кладёт холодную заливку, воздух — свою, и у
       самого терминатора свет тёплый — в воздухе шире и краснее, на голом камне узкой кромкой */
    let airK = min(thick*3., 1.);
    let nightK = 1. - smoothstep(-.3, .12, m0g);
    let fillC = mix(vec3f(.05, .062, .09), chromaCap(air*1.5, .12), airK);
    sc += sf.alb*fillC*nightK*.32*sun;
    /* тёплый терминатор — только у воздуха (M825) и тоном освещённой стороны (M825c): прибавка полосой
       читалась вторым лимбом внутри ночной стороны */
    let warmT = airK*(1. - smoothstep(.0, .3, m0g))*smoothstep(-.04, .04, m0g);
    sc *= mix(vec3f(1.), vec3f(1.25, .85, .62), warmT*.6);
    let H = normalize(Lo + Vo);
    let sp = pow(max(dot(n, H), 0.), 2./(sf.rough*sf.rough*sf.rough + .002))*sf.spec*smoothstep(.0, .1, mu0);
    sc += sun*sp*(.04 + .5*pow(1. - mu, 5.))*select(1., 3., sf.rough < .32);
    let night = 1. - smoothstep(-.12, .12, m0g);
    sc += sf.emit*(.05 + .95*night) + sf.glow*(.3 + .7*night);
    if (sf.cloud > 0.) {
      let cd = clamp((dot(p, Lo) + .15)/1.15, 0., 1.);
      sc = mix(sc, sf.ccol*cd*sun, sf.cloud);
    }
    /* огни построек (gplCities, 17ga): поселение светит сушей вокруг себя — пятно на шаре (~.17 рад),
       в нём узор городов и ядро. Море и день не светят (M800: точка в море гасла целиком, и из 24 огней
       на зуме 2.5 читалась одна). Угол — в виде, без поворота в тело: dot(c, N) */
    let nc = i32(v6.w);
    if (nc > 0) {
      var ha = 0.; var co = 0.;
      for (var j = 0; j < nc; j++) {
        let c = pb[16 + j]; let dv = d - c.xy;
        if (dot(dv, dv) < .16) {
          let a = 1. - dot(vec3f(c.xy, sqrt(max(0., 1. - dot(c.xy, c.xy)))), N);
          ha += c.z*exp(-a/.015); co += c.z*exp(-a/.0004);
        }
      }
      /* огни зажигаются в сумерках, а не на освещённой суше: окно уже, чем у ночного свечения */
      let lk = (1. - smoothstep(-.1, .02, m0g))*(1. - sf.cloud*.6)*sf.land;
      let pat = cityLit(p, s, fwp);
      sc += (vec3f(1., .78, .45)*pat*min(ha, 1.)*4.2 + vec3f(1., .86, .62)*min(co, 1.)*(.25 + 2.*pat))*lk;
    }
    if (thick > 0.) {
      let path = min(thick*3./max(nz, .04), 3.);
      let litA = smoothstep(-.06, .3, m0g);   /* воздух светит от терминатора к свету (M825c) */
      let warm = (1.-smoothstep(-.05,.4, m0g))*litA;
      let tint = mix(air, air*vec3f(1.6, .75, .45), warm);
      sc = sc*exp(-path*.3) + tint*(1. - exp(-path))*litA*sun*.6;
    }
    if (k == 3 || k == 6) { sc *= .55 + .45*pow(nz, .35); }
    /* тень кольца на диске: луч к звезде пересекает плоскость кольца */
    if (v4.w > 0.) {
      /* тень кольца (M825): высокое светило клало тень на скрытую сторону, светило в плоскости — ниткой
         у самого кольца; для тени высота светила над плоскостью кольца сжата (×.3, не меньше .25) —
         тень ложится на освещённый диск полосой за кольцом */
      let tt = v4.w; let RN = vec3f(0., sqrt(1. - tt*tt), -tt); let d0 = dot(L, RN);
      var el = d0*.3; if (abs(el) < .25) { el = select(-.25, .25, d0 >= 0.); }
      let Ls = normalize(L - RN*(d0 - el)); let dq = dot(Ls, RN);
      if (abs(dq) > 1e-3) {
        let sh = -dot(N, RN)/dq;
        let rh = length(N + Ls*sh);
        if (sh > 0.) { let rg = ring(rh, v4, v5, max(px*3., .004)); let ta = 1. - pow(1. - min(rg.a, .95), 1./max(abs(dq), .12)); sc *= 1. - ta*.9; }   /* луч к звезде идёт сквозь кольцо косо — тень плотнее самого кольца (M825) */
      }
    }
    cov = clamp((1. - len)/px + .5, 0., 1.);
    lin = sc*cov;
  }
  /* воздух за краем диска — с дневной стороны, у терминатора рыжий */
  if (thick > 0. && len > 1. - 2.*px) {
    let h = max(len - 1., 0.)/thick;
    let n2 = vec3f(d/max(len, 1e-4), 0.);
    let litA = smoothstep(-.12, .4, dot(n2, L));
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
