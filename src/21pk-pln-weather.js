/* ══════════════ осадки в воздухе сцены (M626) ══════════════
   Старый слой рисовал дождь поверх кадра, в экранных координатах: капли шли и по кораблю, и по
   подписям, свет их не касался, тьма не прятала. Здесь осадок — карточки в воздухе самой сцены:
   у каждой своё место в глубине от объектива до дальней полосы, её прячут деревья и тела
   (проверка глубины), её красит тот же ключ и то же заполнение неба, ночью её зажигает лампа
   человека, дальнюю топит воздух — как всё в кадре (план §2.5: «погода — частицы, освещённые
   солнцем и лампами»).

   Буферов нет: номер карточки и часы дают место (хэш → план глубины, доля ширины кадра, ход
   падения). Четыре плана глубины, как у старого слоя: дальний тонкий, бледный, ленивый; ближний
   толстый, яркий, быстрый. Планы лежат долями дистанции объектива (D = расстояние до линии
   ходьбы): ближний объектив вдвое ближе — и осадок с ним. Размеры заданы в пикселях и переводятся
   в метры по расстоянию: объектив узкий (24°), и капля в метрах у ближнего плана была полосой
   в полкадра. Капля стоит в мире, не в кадре: объектив едет — она остаётся, и параллакс выходит
   сам из перспективы. Полотна — пласты пыли поперёк кадра и полосы тумана низко над землёй —
   те же карточки, большие и мягкие, с зерном fbm.

   Род осадка, сила, ветер и мокрота земли идут в блок Globals (wx, wxCol, wxBox); число карточек —
   от рода и силы, с ярусом (plK). Сам цикл погоды — у игры (19d: weatherOf, weatherPower),
   её небо, воздух и свет — у 21pz (plnWeatherLook, M612).

   В шаре каждой лампы — своя горсть капель или хлопьев: в общем облаке карточек в её шар попадают
   единицы. Молния — двойная вспышка ключа и неба и ломаное тело за грядой, двумя карточками на
   звено (жила и ореол); дальняя завеса дождя под облаком — знак непогоды издали. Мокрая земля —
   в шейдере сцены (21pc) по g.wx.z: темнее, гуще цветом, с бликом неба по глади. */
const PLN_WX={on:true,
  id:{rain:1,snow:2,ash:3,acid:4,dust:5,fog:6,spore:7},
  n:{rain:1800,snow:1500,ash:600,acid:900,dust:1600,fog:0,spore:300},   /* карточек при полной силе */
  sheets:{dust:6,fog:20,rain:5,acid:4,snow:3},                           /* полотен: пласты пыли, полосы тумана, дальние завесы */
  wet:0,wetT:0,flash:null,flashSeed:0,drawn:false};   /* flash — стенд принуждает вспышку */

/* мокрая земля набирает за полминуты дождя и сохнет две минуты — по часам стены; стенд ставит
   PLN_WX.wet сам (его часы стоят). Кладёт в кадр род, силу, ветер, мокроту и число карточек */
function plnWeatherFrame(F,p,Hr,C,L){
  const W=Hr.wx||{},kind=W.kind,wp=W.wp||0,id=kind?(PLN_WX.id[kind]||0):0;
  const t=wallMs(),dt=Math.min(.25,Math.max(0,(t-(PLN_WX.wetT||t))/1000));PLN_WX.wetT=t;
  const want=(kind==="rain"||kind==="acid")?plnSmooth(.1,.5,wp):0,tau=want>PLN_WX.wet?30:150;
  PLN_WX.wet+=(want-PLN_WX.wet)*(1-Math.exp(-dt/tau));
  if(Math.abs(PLN_WX.wet-want)<.002)PLN_WX.wet=want;
  const on=PLN_WX.on&&id>0&&wp>.04,k=on?Math.pow(wp,.75)*PLN_GPU.plK:0;
  const nP=on?Math.round((PLN_WX.n[kind]||0)*k):0,nS=on?(PLN_WX.sheets[kind]||0):0;
  /* капли и хлопья в свете ламп: своя горсть карточек вокруг каждой лампы */
  const lit=kind==="rain"||kind==="acid"||kind==="snow"||kind==="ash";
  const nLamps=on&&lit?Math.min(4,(F.lamps||[]).length):0,nL=nLamps*Math.round(90*k);
  /* молния: в ливень раз в несколько секунд — двойная вспышка ключа и неба, тело разряда за грядой */
  let fl=0,bseed=0;
  if(on&&(kind==="rain"||kind==="acid")&&wp>.5){
    const T=F.t,w=Math.floor(T/6.5),ph=T-w*6.5;
    if(h01(w,3,(p.seed|0)+17)<(wp-.5)*1.4){fl=ph<.07?1:ph<.16?.3:ph<.22?.75:ph<.4?.75*(1-(ph-.22)/.18):0;bseed=w;}
  }
  if(PLN_WX.flash!=null){fl=PLN_WX.flash;bseed=PLN_WX.flashSeed||3;}
  const nB=fl>0?32:0;
  if(fl>0){
    const m=1+4*fl,lk=F.look,wh=(v,a)=>{v[0]=lerp(v[0],1.6,a);v[1]=lerp(v[1],1.7,a);v[2]=lerp(v[2],2,a);};
    F.key=[F.key[0]*m*.9,F.key[1]*m*.95,F.key[2]*m*1.1];
    wh(lk.skyZen,.3*fl);wh(lk.skyZenS,.3*fl);wh(lk.skyHor,.22*fl);wh(lk.skyHorS,.22*fl);
    wh(lk.cloudDark,.3*fl);wh(lk.cloudDarkS,.3*fl);wh(lk.cloudLit,.2*fl);
    lk.ambSky[0]*=1+1.5*fl;lk.ambSky[1]*=1+1.5*fl;lk.ambSky[2]*=1+1.8*fl;
  }
  const col=(typeof PLN_WX_COL!=="undefined"&&PLN_WX_COL[kind])||[.5,.5,.5];
  F.look.wx=[id,wp,PLN_WX.wet,clamp(WIND*1.4,-1.2,1.2)];
  F.look.wxCol=[col[0],col[1],col[2],nP];
  F.look.wxBox=[nS,nL,nLamps,nB];
  /* земля линии хода под героем: по ней стелются ближние полосы тумана */
  const gy=L&&L.P?plnLandTab(L,L.P,F.hero[0]):F.waterY;
  F.look.wxSpare=[fl,bseed,gy,0];
  F.wx={n:nP+nS+nL+nB};
  PLN_WX.drawn=on;
  PLN.stat.wx={kind:kind||null,wp:+wp.toFixed(2),n:nP,sheets:nS,lamp:nL,bolt:nB,fl:+fl.toFixed(2),wet:+PLN_WX.wet.toFixed(2)};
}

/* шейдер осадков: дописывается к шейдеру сцены (21pe), блок Globals общий */
const PLN_WGSL_WX=/* wgsl */`
struct WxOut { @builtin(position) pos: vec4f, @location(0) uv: vec2f, @location(1) col: vec4f, @location(2) wpos: vec3f, @location(3) par: vec4f };
fn wxH(i: u32, k: u32) -> f32 { return f32(hashu(i * 7919u + k * 104729u + 17u) & 0xFFFFu) / 65535.0; }
/* луч из объектива через точку окна */
fn wxRay(ndc: vec2f) -> vec3f {
  let a = g.invViewProj * vec4f(ndc, 1.0, 1.0);
  let b = g.invViewProj * vec4f(ndc, 0.0, 1.0);
  var d = b.xyz / b.w - a.xyz / a.w;
  if (d.z < 0.0) { d = -d; }
  return normalize(d);
}
/* par: x — форма (0 штрих, 1 хлопок, 2 полотно, 3 уголёк или спора), y — расстояние, z — свечение */
@vertex fn vs_wx(@builtin(vertex_index) vi: u32) -> WxOut {
  var o: WxOut; o.par = vec4f(0.0);
  let id = vi / 6u; let c = vi % 6u;
  var uv = vec2f(0.0, 0.0);
  if (c == 1u || c == 2u || c == 4u) { uv.x = 1.0; }
  if (c == 2u || c == 4u || c == 5u) { uv.y = 1.0; }
  let kind = i32(round(g.wx.x)); let pw = g.wx.y; let wind = g.wx.w; let t = g.camPos.w;
  let nP = u32(g.wxCol.w); let nS = u32(g.wxBox.x); let nL = u32(g.wxBox.y); let nLamps = max(u32(g.wxBox.z), 1u);
  let fl = g.wxSpare.x;
  let E = g.camPos.xyz;
  let D = max(-E.z, 8.0);   /* дистанция объектива до линии ходьбы: планы лежат её долями */
  let h1 = wxH(id, 1u); let h2 = wxH(id, 2u); let h3 = wxH(id, 3u); let h4 = wxH(id, 4u);
  /* кромки кадра на расстоянии s от объектива — лучами через края окна */
  let rL = wxRay(vec2f(-1.0, 0.0)); let rR = wxRay(vec2f(1.0, 0.0));
  let rB = wxRay(vec2f(0.0, -1.0)); let rT = wxRay(vec2f(0.0, 1.0));
  let hpm = rT.y / rT.z - rB.y / rB.z;   /* высота кадра на метр дистанции */
  var P = vec3f(0.0); var w = 0.1; var l = 0.1; var axis = vec3f(0.0, 1.0, 0.0);
  var shape = 0.0; var alpha = 0.0; var emis = 0.0; var s = 10.0;
  let sgn = select(1.0, -1.0, wind < 0.0);
  if (id < nP) {
    /* план по хэшу: дальний — тонкий, бледный, ленивый; ближний — толстый, яркий, быстрый */
    let fl = select(0.0, 1.0, kind == 2 || kind == 3 || kind == 7);   /* хлопья висят ближе, чем летят капли */
    var q = 0; if (h2 > mix(0.45, 0.30, fl)) { q = 1; } if (h2 > mix(0.74, 0.58, fl)) { q = 2; } if (h2 > mix(0.90, 0.82, fl)) { q = 3; }
    var s0 = array<f32, 4>(1.0, 0.6, 0.35, 0.2); var s1 = array<f32, 4>(2.4, 1.0, 0.6, 0.35);
    var sp = array<f32, 4>(0.45, 0.70, 1.30, 1.95); var spr = array<f32, 4>(0.35, 0.55, 0.60, 0.75);
    var al = array<f32, 4>(0.40, 0.55, 0.70, 0.85); var szk = array<f32, 4>(0.7, 1.0, 1.4, 1.9);
    var wpx = array<f32, 4>(1.0, 1.3, 1.8, 2.6); var lpx = array<f32, 4>(0.6, 0.9, 1.45, 2.1);
    s = D * mix(s0[q], s1[q], h3 * h3);
    let xl = E.x + rL.x * s / rL.z; let xr = E.x + rR.x * s / rR.z;
    let yb = E.y + rB.y * s / rB.z; let yt = E.y + rT.y * s / rT.z;
    let mpp = (yt - yb) / g.screen.y;   /* метров в пикселе на этом расстоянии */
    let W = (xr - xl) * 1.2; let Hh = (yt - yb) * 1.3;
    let x0 = xl - (W - (xr - xl)) * 0.5; let y1 = yt + (Hh - (yt - yb)) * 0.5;
    /* род осадка: скорость (м/с), длина штриха (px) или хлопок, снос ветром, покачивание */
    var spd = 10.0; var len = 34.0; var dr = 0.12; var flake = 0.0; var sway = 0.0; var thick = 1.0;
    if (kind == 2) { spd = 1.0; flake = 1.0; sway = 1.0; }
    else if (kind == 3) { spd = 0.9; flake = 1.0; sway = 0.8; }
    else if (kind == 4) { spd = 5.0; len = 14.0; dr = 0.35; thick = 1.4; }
    else if (kind == 5) { spd = 13.0; len = 9.0; dr = 0.92; thick = 1.3; }
    else if (kind == 7) { spd = 0.5; flake = 1.0; sway = 1.4; }
    let v = spd * (sp[q] + h4 * spr[q]);
    let dx = dr * 3.4 + abs(wind) * 0.4; let dy = 1.0 - dr * 0.82;
    let vx = sgn * v * dx * 0.5 + wind * 1.2 * (1.0 + 2.5 * flake * pw);   /* метель несёт хлопья вбок */
    let vy = v * dy;
    var x = x0 + fract((h3 * 4096.0 + t * vx - x0) / W) * W;
    var y = y1 - fract((h1 * 4096.0 + t * vy) / Hh) * Hh;
    if (sway > 0.0) { x += sin(t * 0.5 * (0.5 + h2) + h3 * 6.2832) * 0.6 * sway * mpp * 40.0; }
    P = vec3f(x, y, E.z + s);
    if (flake > 0.0) {
      let r = (1.4 + 2.8 * h4) * szk[q] * mpp;   /* радиус хлопка 1…8 px */
      w = r * 2.0; l = w; shape = 1.0;
      axis = vec3f(0.0, 1.0, 0.0);
    } else {
      w = wpx[q] * thick * mpp; l = len * lpx[q] * clamp(length(vec2f(dx, dy)), 1.0, 1.6) * mpp; shape = 0.0;
      axis = normalize(vec3f(vx, -vy, 0.0));
    }
    alpha = al[q] * (0.55 + 0.45 * pw);
    /* угли в пепле — редкие, живые, единственный тёплый свет в сером; споры светятся сами */
    if (kind == 3 && (id % 9u) == 0u) {
      let gl = 0.5 + 0.5 * sin(t * 2.0 + h1 * 6.2832);
      shape = 3.0; emis = 1.6 + 1.6 * gl; w = (3.0 + 2.0 * gl) * mpp; l = w;
    }
    if (kind == 7) { shape = 3.0; emis = 0.9; }
  } else if (id < nP + nS) {
    /* полотна: пыль несёт пласты поперёк кадра, туман стелется полосами у земли, дождь висит
       завесами под дальним облаком */
    let j = id - nP;
    let hj1 = wxH(j + 977u, 5u); let hj2 = wxH(j + 977u, 6u); let hj3 = wxH(j + 977u, 7u);
    shape = 2.0;
    if (kind == 5) {
      s = D * (0.45 + hj1 * 0.9);
      let xl = E.x + rL.x * s / rL.z; let xr = E.x + rR.x * s / rR.z;
      let yb = E.y + rB.y * s / rB.z; let yt = E.y + rT.y * s / rT.z;
      w = (xr - xl) * (0.5 + hj2 * 0.4); l = (yt - yb) * (0.35 + hj3 * 0.4);
      let W = (xr - xl) + w * 2.0; let x0 = xl - w;
      let vx = sgn * (0.06 + hj2 * 0.09) * D * (1.0 + pw);
      let x = x0 + fract((hj3 * 4096.0 + t * vx - x0) / W) * W;
      let y = yb + (yt - yb) * (0.2 + hj1 * 0.6);
      P = vec3f(x, y, E.z + s); alpha = (0.5 + 0.3 * hj1) * pw;
    } else if (kind == 6) {
      /* полосы лежат там, где в кадре вода и земля: 60 % — на дальней воде за линией хода
         (вода — sunDir.w, видна с z ≈ 60 до 150), 40 % — у ног героя (земля линии — wxSpare.z) */
      let nearB = select(0.0, 1.0, hj1 < 0.4);
      let u = select((hj1 - 0.4) / 0.6, hj1 / 0.4, nearB > 0.5);
      s = D * mix(1.7 + u * 1.0, 0.75 + u * 0.4, nearB);
      let base = mix(g.sunDir.w, g.wxSpare.z, nearB);
      let xl = E.x + rL.x * s / rL.z; let xr = E.x + rR.x * s / rR.z;
      w = (xr - xl) * mix(0.25 + hj2 * 0.35, 0.2 + hj2 * 0.3, nearB); l = mix(1.5 + hj3 * 2.5, 1.2 + hj3 * 2.0, nearB);
      let W = (xr - xl) + w * 2.0; let x0 = xl - w;
      let vx = (0.3 + hj2 * 0.8) * (1.0 + wind * 0.4) * sgn;
      let x = x0 + fract((hj3 * 4096.0 + t * vx - x0) / W) * W;
      let y = base + 0.3 + hj2 * 2.0 + l * 0.3 + sin(t * 0.07 + hj2 * 6.2832) * 0.25;
      P = vec3f(x, y, E.z + s); alpha = mix(0.55 + 0.3 * hj2, 0.7 + 0.3 * hj2, nearB) * pw;
    } else {
      /* дальняя завеса: серые полосы дождя из-под облака за грядой — знак непогоды издали */
      shape = 4.0;
      s = D * (8.0 + hj1 * 6.0);   /* за грядой: ближе её закрывают холмы */
      let xl = E.x + rL.x * s / rL.z; let xr = E.x + rR.x * s / rR.z;
      w = (xr - xl) * (0.06 + hj2 * 0.1); l = 420.0; axis = normalize(vec3f(wind * 0.35, 1.0, 0.0));   /* полосы косые, по ветру */
      let W = (xr - xl) + w; let x0 = xl - w * 0.5;
      let vx = (1.5 + hj2 * 2.0) * sgn;
      let x = x0 + fract((hj3 * 4096.0 + t * vx - x0) / W) * W;
      P = vec3f(x, g.sunDir.w + 20.0 + l * 0.5, E.z + s); alpha = (0.85 + 0.15 * hj3) * pw;
    }
  } else if (id < nP + nS + nL) {
    /* в шаре лампы: капли или хлопья падают сквозь её свет, за светом гаснут */
    let j = id - nP - nS; let li = i32(j % nLamps); let lp = g.lampPos[li]; let lc = g.lampCol[li];
    let hj1 = wxH(j + 3011u, 8u); let hj2 = wxH(j + 3011u, 9u); let hj3 = wxH(j + 3011u, 10u);
    let R = lp.w; let flake = select(0.0, 1.0, kind == 2 || kind == 3);
    let spd = select(select(10.0, 5.0, kind == 4), 1.0, flake > 0.5) * (0.7 + hj2 * 0.6);
    let top = lp.y + R * 0.4; let span = R * 0.4 + 2.0;
    let x = lp.x + (hj3 - 0.5) * R * 1.5 + select(0.0, sin(t * 0.7 + hj1 * 6.2832) * 0.5, flake > 0.5);
    let y = top - fract((hj1 * 4096.0 + t * spd) / span) * span;
    P = vec3f(x, y, lp.z + (hj2 - 0.5) * R);
    s = max(P.z - E.z, 4.0);
    let mpp = hpm * s / g.screen.y;
    if (flake > 0.5) { let r = (1.6 + 2.4 * hj3) * mpp; w = r * 2.0; l = w; shape = 1.0; axis = vec3f(0.0, 1.0, 0.0); }
    else { w = 1.6 * mpp; l = 22.0 * mpp; shape = 0.0; axis = normalize(vec3f(wind * 0.45, -1.0, 0.0)); }
    let dl = length(lp.xyz - P);
    alpha = 0.9 * clamp(1.0 - dl / R, 0.0, 1.0) * step(0.01, lc.w) * (1.0 - smoothstep(0.2, 1.6, P.y - lp.y));
  } else {
    /* тело молнии: ломаная из-под облака к гряде, по две карточки на звено — жила и ореол */
    let j = id - nP - nS - nL; let seg = j / 2u; let halo = f32(j % 2u);
    let bs = u32(g.wxSpare.y) * 131u;
    let bx = E.x + (wxH(bs, 11u) - 0.5) * D * 5.0; s = D * (4.0 + wxH(bs, 12u) * 2.0);
    /* разряд идёт от верхней кромки кадра на этой дистанции: выше неё его никто не увидит */
    let yTop = E.y + rT.y / rT.z * s * (0.9 + wxH(bs, 13u) * 0.3); let yBot = 10.0; let nseg = 16.0;
    var x0 = bx; var y0 = yTop; var x1 = bx; var y1 = yTop;
    let sp = D * 0.35;
    for (var q = 0u; q <= seg; q++) {
      x0 = x1; y0 = y1;
      let f = f32(q + 1u) / nseg;
      x1 = bx + (wxH(bs + q + 1u, 14u) - 0.5) * sp * 2.0 * smoothstep(0.0, 0.6, f) + sin(f * 9.0 + f32(bs % 7u)) * sp * 0.5 * f;
      y1 = yTop - (yTop - yBot) * f;
    }
    let dir = vec3f(x1 - x0, y1 - y0, 0.0); let len = length(dir);
    let mpp = hpm * s / g.screen.y;
    P = vec3f((x0 + x1) * 0.5, (y0 + y1) * 0.5, E.z + s); axis = dir / max(len, 0.001); l = len * 1.08;
    w = mix(2.2, 26.0, halo) * mpp; shape = 5.0; emis = mix(18.0, 2.2, halo) * fl; alpha = mix(1.0, 0.35, halo) * fl;
    o.par.w = halo;
  }
  /* свет: заполняющий неба и ключ; капля — линза, ярче против света; лампы людей — ближним */
  let rd = normalize(P - E);
  let L = normalize(g.sunDir.xyz);
  let back = pow(clamp(dot(rd, L), 0.0, 1.0), 6.0);
  var lampL = vec3f(0.0);
  for (var i = 0; i < 4; i++) {
    let lp = g.lampPos[i]; let lc = g.lampCol[i];
    if (lc.w <= 0.0) { continue; }
    let dl = length(lp.xyz - P);
    let hood = 1.0 - smoothstep(0.2, 1.6, P.y - lp.y);
    lampL += lc.rgb * lc.w * pow(clamp(1.0 - dl / lp.w, 0.0, 1.0), 2.0) * hood * 1.5;
  }
  let light = g.ambSky.rgb * 1.6 + g.sunCol.rgb * (0.22 + 0.9 * back) * cloudLight(P) + lampL;
  var col = g.wxCol.rgb * light;
  if (shape > 4.5) { col = vec3f(0.80, 0.88, 1.0) * emis; }
  /* полотна — не тела, а поправка к тому, что за ними: завеса темнее неба, полоса тумана белее
     мглы, пласт пыли гуще и темнее мглы; воздух их уже не топит (fs), лампа подсвечивает */
  else if (shape > 3.5) { col = skyBase(rd) * 0.45 + g.wxCol.rgb * lampL * 0.3; }
  else if (shape > 2.5) {
    if (kind == 3) { col = vec3f(1.0, 0.5, 0.18) * emis; } else { col = g.wxCol.rgb * (light + emis); }
  }
  else if (shape > 1.5) {
    let ac = airCol(rd, s);
    if (kind == 6) { col = mix(ac, vec3f(1.0), 0.4) * 1.2 + vec3f(0.05) + g.wxCol.rgb * lampL * 0.6; }   /* белее и мягче воздуха, без неона */ else { col = ac * 0.6 + g.wxCol.rgb * lampL * 0.3; }
  }
  let right = normalize(cross(axis, rd));
  let wp = P + right * (uv.x - 0.5) * w + axis * (uv.y - 0.5) * l;
  o.pos = g.viewProj * vec4f(wp, 1.0);
  o.uv = uv; o.col = vec4f(col, alpha); o.wpos = wp; o.par = vec4f(shape, s, emis, o.par.w);
  return o;
}
@fragment fn fs_wx(in: WxOut) -> @location(0) vec4f {
  let shape = i32(round(in.par.x));
  let x = in.uv.x * 2.0 - 1.0; let y = in.uv.y * 2.0 - 1.0;
  var a = 0.0;
  if (shape == 0) { a = pow(max(1.0 - x * x, 0.0), 1.5) * smoothstep(0.0, 0.25, in.uv.y) * (1.0 - smoothstep(0.75, 1.0, in.uv.y)); }
  else if (shape == 1) { a = 1.0 - smoothstep(0.45, 1.0, length(vec2f(x, y))); }
  else if (shape == 2) {
    let n = fbm(in.wpos.xy * 0.05 + vec2f(g.camPos.w * 0.03, 0.0), 31u);
    a = pow(max(1.0 - abs(x), 0.0), 1.6) * pow(max(1.0 - abs(y), 0.0), 1.6) * (0.1 + 1.4 * smoothstep(0.15, 0.85, n));
  }
  else if (shape == 4) {
    /* завеса: вертикальное зерно — полосы дождя, сносимые ветром */
    let n = fbm(vec2f(in.wpos.x * 0.03 + g.camPos.w * 0.15, in.wpos.y * 0.0025), 37u);
    a = pow(max(1.0 - abs(x), 0.0), 1.3) * smoothstep(0.0, 0.3, in.uv.y) * (1.0 - smoothstep(0.75, 1.0, in.uv.y)) * (0.35 + 1.0 * n);
  }
  else if (shape == 5) { a = pow(max(1.0 - x * x, 0.0), mix(0.8, 2.5, in.par.w)); }
  else { a = 1.0 - smoothstep(0.15, 1.0, length(vec2f(x, y))); }
  if (a < 0.003) { discard; }
  let col = applyFog(in.col.rgb, in.wpos, select(1.0, 0.0, shape == 4 || shape == 2));
  return vec4f(col, a * in.col.a);
}
`;
