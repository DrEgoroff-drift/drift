/* ══════════════ туманность системы объёмом (L1, docs/DESIGN-gpu.md) ══════════════
   Была: 2D печёт тайл 256² раз на систему, растягивает на весь экран, шейдер 16g
   добавлял ей нити. Мыльно, плоско, и звезда её не освещала — зарево держал только
   мягкий круг 17g. Теперь туманность считается целиком на видеокарте:
   · кадр строится крупно: одна большая масса газа с формой, одна широкая тёмная
     полоса пыли поперёк, спокойная пустота; у каждой массы свой тон, между тонами —
     тёмный шов, а не смесь (дополнительные цвета в одном пикселе дают серо-оливковое);
   · внутри массы — три слоя на разной глубине (свой параллакс), FBM с двойным
     искривлением пространства: жгуты, завитки, рваные кромки;
   · газ светится и поглощает: пыль ложится ПОВЕРХ звёзд и гасит их, краснит то,
     что за ней;
   · звезда освещает газ: ближе к ней ярче; её зарево — рассеяние по плотности газа;
     кромка газа, обращённая к звезде, — тонкий яркий обод (фронт ионизации);
   · мелкий масштаб — в полном разрешении при сведении: гребни шума по тому же
     течению режут газ на волокна, края пыли резкие; тени тонируются третьим цветом.
   Цена: объём и свет — в четверть кадра (rgba16f), пересчёт — когда камера
   сдвинулась или раз в три кадра; сведение — два полноэкранных прохода
   (поглощение, свечение). Цвета — gnbPalette: своя пара тонов и своя тень. */
const GNB={tex:null,view:null,dev:null,w:0,h:0,last:-99,cx:1e9,cy:1e9,sys:null,U:new Float32Array(48),C:new Float32Array(60)};
const GNB_NOISE=`
fn gh(p:vec2f)->f32{var q=fract(vec3f(p.xyx)*.1031);q=q+dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
fn gn(p:vec2f)->f32{let i=floor(p);let f=fract(p);let w=f*f*(3.-2.*f);
  return mix(mix(gh(i),gh(i+vec2f(1.,0.)),w.x),mix(gh(i+vec2f(0.,1.)),gh(i+vec2f(1.,1.)),w.x),w.y);}
fn fb(p0:vec2f,n:i32)->f32{var p=p0;var s=0.;var a=.5;var m=0.;
  for(var k=0;k<n;k++){s=s+a*gn(p);m=m+a;p=mat2x2f(1.6,1.2,-1.2,1.6)*p+vec2f(3.1,7.7);a=a*.5;}
  return s/m;}
fn sat(c:vec3f)->f32{let mx=max(c.r,max(c.g,c.b));return (mx-min(c.r,min(c.g,c.b)))/max(mx,1e-4);}
fn sq(x:f32)->f32{return x*x;}
/* громадина (L1.7) — общая геометрия для объёма и сведения. q: центр в px, cos и sin
   угла; sc — размер в px. Всё это константы кадра — их считает gnbLfr на процессоре */
fn lfr(p:vec2f,q:vec4f,sc:f32)->vec2f{
  let d0=(p-q.xy)/sc;
  return vec2f(q.z*d0.x+q.w*d0.y,-q.w*d0.x+q.z*d0.y);}
/* пылевой хвост отстаёт по орбите — в свою сторону у каждой кометы */
fn lbend(i:vec4f)->f32{return select(-.36,.36,fract(i.z)>.5);}
fn lcy(d:vec2f,i:vec4f)->f32{let x=max(d.x,0.);return d.y+lbend(i)*(x+.35*x*x);}
/* окно: вокруг громадины газ отступает, туман гаснет — пустота чёрная, а не серая */
fn lwin(d:vec2f,h:vec4f,i:vec4f)->f32{
  let t=h.w;var w=0.;
  if(t<.5){w=smoothstep(1.45,.95,length(d));}
  else if(t<1.5){let x=d.x;let yc=lcy(d,i);let wd=.012+.13*max(x,0.);
    w=exp(-sq(yc/(wd*1.8+.04)))*smoothstep(.95,.35,x)*smoothstep(-.1,0.,x);}
  else if(t<2.5){w=smoothstep(1.2,.55,length(vec2f(d.x,d.y/i.y)));}
  else{let x=abs(d.x);w=exp(-sq(d.y/(.04+.2*x)))*smoothstep(1.8,.9,x);}
  return min(w*1.4,1.)*select(0.,1.,i.w>0.);}`;
const GNB_GEN=`
struct NU{a:vec4f,b:vec4f,c:vec4f,d:vec4f,e:vec4f,f:vec4f,g:vec4f,h:vec4f,i:vec4f,j:vec4f,k:vec4f,l:vec4f};
@group(0) @binding(0) var<uniform> u:NU;
struct VO{@builtin(position) p:vec4f,@location(0) uv:vec2f};
@vertex fn vs(@builtin(vertex_index) i:u32)->VO{
  var P=array(vec2f(-1.,-1.),vec2f(3.,-1.),vec2f(-1.,3.));
  var o:VO;o.p=vec4f(P[i],0.,1.);o.uv=vec2f(P[i].x*.5+.5,.5-P[i].y*.5);return o;}
${GNB_NOISE}${GNB_TILE}
/* узлы шума — из плитки (16gaz, P1 14/n): один сбор вместо четырёх хэшей */
@group(0) @binding(1) var smp:sampler;
@group(0) @binding(2) var t1:texture_2d<f32>;
/* пыль ест синий сильнее красного: что за полосой — тусклее и краснее */
const RED=vec3f(.72,1.,1.42);
/* достопримечательность системы (L1.7): одна громадина на заднике, видна отовсюду —
   почти без параллакса, за всеми слоями газа (пыль её гасит). Вид и место — своим
   потоком случайности. 0 — остаток сверхновой: рваное кольцо волокон, снаружи ударный
   фронт в холодном тоне, внутри — тёплые нити, тона не смешиваются; 1 — комета через
   полнеба: хвосты от звезды; 2 — далёкая спиральная галактика под углом: жёлтое ядро,
   голубые рукава с розовыми узлами, пылевые прожилки; 3 — у дыры: джеты из её полюсов.
   Закон фона: ничто не похоже на игровой объект (луч, снаряд, выхлоп) — края мягкие,
   яркость ниже игрового слоя */
/* L1b: пыль — стена полости вокруг звезды (H II: Столпы, Киль). Всё строится в полярных
   координатах вокруг экранной звезды: шум по (угол, ln r), вытянут по радиусу — волокна и
   столпы сами смотрят на звезду, и за кадром тоже. Угол меряется от направления «звезда →
   центр кадра»: шов (±π) — за звездой. u.g.x — сдвиг угла, u.g.y — сдвиг ln r (копятся в
   JS): узор ползёт по экрану с параллаксом ~.12, а не со звездой. */
struct DQ{tr:f32,q:vec2f,s:f32,r:f32,r0:f32,r1:f32,k:f32,lc:f32};
/* масштаб узора пыли (L1b 4/n): в лог-полярных ячейка растёт с расстоянием до звезды — на
   ×2 звезда вдвое дальше, и в кадр влезали одни куски кромок. Дальше .9H узор сжат в k раз
   вокруг центра кадра: столп того же размера в px на любом зуме, как газ, и смотрит на звезду */
var<private> DK:f32=1.;
fn dpolar(p:vec2f,W:f32,H:f32)->DQ{
  let sp=u.e.xy;let v=p-sp;let r=max(length(v),.5);
  let c=normalize(vec2f(W,H)*.5-sp+vec2f(1e-3,0.));
  var o:DQ;o.tr=atan2(c.x*v.y-c.y*v.x,dot(c,v));
  let lc=log(max(length(vec2f(W,H)*.5-sp),1.)/H);let k=max(1.,exp(lc)/.9);DK=k;
  o.q=vec2f(o.tr*k+u.g.x,(log(r/H)-lc)*k+u.g.y);o.k=k;o.lc=lc;
  /* по радиусу в кадре: 0 — ближняя к звезде точка кадра, 1 — дальний угол; в том же ln r
     со сдвигом (u.g.zw копятся в JS так же), иначе при полёте к звезде стена стояла бы на экране */
  o.s=(o.q.y-u.g.z)/max(u.g.w-u.g.z,.05);o.r=r/H;o.r0=u.g.z;o.r1=u.g.w;return o;}
/* шум по полярным координатам: у шва (±π) — смесь двух оборотов, без ступеньки */
fn nzs(tr:f32,q:vec2f,fq:vec2f,o:vec2f,n:i32)->f32{
  let a=fbt(q*fq+o,n);let w=smoothstep(.6,1.,abs(tr)/3.1416)*.5;
  if(w<=0.){return a;}
  return mix(a,fbt(vec2f(q.x-6.2832*DK*sign(tr),q.y)*fq+o,n),w);}
/* ln r узора (сжатого) → радиус в H */
fn dR(D:DQ,y:f32)->f32{return exp((y-u.g.y)/D.k+D.lc);}
/* капсула со сужением: a — вдоль от головы наружу, d — поперёк (всё в H); голова — круг wa,
   к основанию ширина растёт до wb на длине L */
fn caps(a:f32,d:f32,wa:f32,wb:f32,L:f32)->f32{
  if(a<0.){return length(vec2f(a,d))-wa;}
  if(a<L){return abs(d)-mix(wa,wb,a/L);}
  return length(vec2f(a-L,d))-wb;}
/* столп — сужающийся ствол (L1b 6/n): одна ячейка по углу (n на оборот) — не больше одного
   столпа, с вероятностью pr. Длина — не больше половины пути от стены до звезды и не больше
   .72 кадра: столп растёт из стены, кадр ему пересекать незачем. У основания ширина ≈ ⅓
   длины, к голове сужается, по длине 2–3 вздутия, изгиб до 15°; голова круглая и чуть шире
   шеи. gl — доля голов с глобулой впереди */
fn pillars(D:DQ,rw:f32,n:f32,pr:f32,gl:f32,sd:f32)->f32{
  var m=-1.;let per=6.2832/n;
  let i0=floor(D.q.x/per);
  for(var di=-2;di<=2;di++){
    let i=i0+f32(di);let im=i-n*floor(i/n);
    let h=gh(vec2f(im*1.37+sd,sd*.7+3.));
    if(h>pr){continue;}
    let h2=gh(vec2f(im+sd*3.1,7.));let h3=gh(vec2f(im*1.9+5.,sd*.3));
    let L=min(.5*rw,.72)*(.7+.3*h3);
    let rh=rw-L;let a=D.r-rh;
    let t=clamp(a/L,0.,1.);
    /* изгиб: основание сидит в стене, голова уходит вбок — наклон у головы ≤ 15° */
    let sg=select(-1.,1.,h2>.5);
    let dd=(D.q.x-(i+.25+.5*h2)*per)/D.k*D.r-sg*L*.12*(1.-t)*(1.-t);
    let wb=L/5.;let wn=max(wb*.55,.01);let wh=wn*1.25;
    let bul=1.+.22*(2.*gnt(vec2f(t*2.6+h*9.,im*1.7+sd))-1.);
    let hw=(wn+(wb-wn)*pow(t,1.3))*bul;
    if(a>wh){m=max(m,hw-abs(dd));}
    m=max(m,wh-length(vec2f(a-wh,dd)));
    /* глобула — впереди головы, хвостом к столпу */
    if(h2<gl||h2>1.-gl*.5){
      let g=wh*(.4+.2*h3);let gp=wh*(2.6+2.5*h3);
      if(rh-gp>.1){m=max(m,-caps(a+gp,dd+wh*.4*(h3-.5),g,g*.25,g*4.));}}
  }
  return m;}
/* x: поле в H (>0 — внутри тела), y: свечение полости, z: плотность толщи, w: s */
fn dustAt(p:vec2f,W:f32,H:f32,seed:f32)->vec4f{
  let D=dpolar(p,W,H);let tr=D.tr;let s=D.s;
  let o=vec2f(fract(seed*.37)*50.+7.,fract(seed*.71)*50.+3.);
  let sd=fract(seed*.113)*97.;
  /* стена полости: вдали от звезды — материнское облако, у кромки кадра */
  let se=.76+(nzs(tr,D.q,vec2f(4.,1.),o+vec2f(21.,9.),2)-.5)*.2+(nzs(tr,D.q,vec2f(11.,2.5),o+vec2f(4.,13.),2)-.5)*.16;
  let rw=dR(D,D.r0+se*(D.r1-D.r0));
  /* край комковатый: крупные наплывы и мелкие — у стены в полную силу, у столпа на треть
     (иначе наплыв размером с голову съедает её в остриё) */
  let lu=(nzs(tr,D.q,vec2f(7.,1.8),o+vec2f(8.,8.),2)-.5)*.04+(nzs(tr,D.q,vec2f(14.,7.),o+vec2f(1.,3.),3)-.5)*.022
    +(nzs(tr,D.q,vec2f(40.,18.),o+vec2f(6.,1.),2)-.5)*.01;
  var m=D.r-rw+lu-(1.-smoothstep(.0,.2,s))*.04;
  /* из стены к звезде — 2–4 столпа в кадре, у части голов — глобулы */
  m=max(m,pillars(D,rw,14.,.5,.2,sd)+lu*.35);
  let dn=nzs(tr,D.q,vec2f(12.,3.),o+vec2f(2.,9.),3);
  /* y: свечение полости — ионизованный газ перед стеной, от середины пути к звезде до стены */
  let cav=smoothstep(.4*rw,.92*rw,D.r)*(1.-smoothstep(rw-.02,rw+.12,D.r+lu));
  return vec4f(m,cav,dn,s);}
struct LK{e:vec3f,a:f32,w:f32};
fn lmk(p:vec2f,W:f32,H:f32,sp:vec2f)->LK{
  let ty=u.h.w;let k=u.i.w;
  if(k<=0.){return LK(vec3f(0.),0.,0.);}
  let d=lfr(p,u.l,u.k.w);
  let ls=u.i.z;let c1=u.j.rgb;let c2=u.k.rgb;
  var e=vec3f(0.);var ab=0.;
  if(ty<.5){
    let wv=vec2f(fbt(d*2.2+vec2f(ls,1.),3),fbt(d*2.2+vec2f(4.,ls),3))-.5;
    let q=d+wv*.22;let r=length(q);
    let th=atan2(q.y,q.x);let dir=q/max(r,1e-3);
    /* кольцо рвано: одна дуга яркая, противоположная — почти пропала */
    let arc=.15+.85*smoothstep(.35,.7,fbt(dir*1.3+vec2f(ls*2.,3.),3));
    let w=.05+.07*fbt(dir*2.+vec2f(7.,ls),2);
    let sh=exp(-sq((r-1.)/w));
    let rid=1.-abs(2.*fbt(q*7.+wv*3.+vec2f(ls,9.),4)-1.);
    let fil=pow(rid,5.)*(.35+.9*sh)+sh*.25;
    let outer=smoothstep(-.02,.03,r-1.+ .03*sin(th*9.+ls));
    let seam=1.-.7*exp(-sq((r-1.)/.012));
    e=mix(c1,c2,outer)*fil*sh*arc*seam*1.5;
    /* внутри — слабое свечение и клочья */
    e=e+c1*(.05+.14*pow(rid,3.))*smoothstep(1.,.2,r)*(.4+.6*arc);
  } else if(ty<1.5){
    /* голова в начале координат, хвосты — вдоль +x. d в долях H·s: 1 px на 760 ≈ .0024.
       Голова — самая яркая точка громадины: ядро 2–3 px, кома ~12 px, тёплый белый.
       Ионный хвост — прямой узкий голубой луч (1–2 px у головы, ~8 px к концу, длина
       ~.4 ширины кадра); пылевой — широкий изогнутый тёплый веер, отходит на ~20° */
    let x=d.x;let r=length(d);let xp=max(x,0.);
    /* ионный хвост — мягкий: гаусс 2→10 px, слабые продольные струи поперёк ширины */
    let wi=.0026+.0095*min(xp/.7,1.);
    let st=.72+.28*fbt(vec2f(x*1.5-u.b.z*2.,d.y/wi*1.3+ls),2);
    let ion=exp(-sq(d.y/wi))*smoothstep(-.004,.02,x)*(1.-smoothstep(.35,.8,x))*st;
    let yc=lcy(d,u.i);let wd=.006+.11*xp;
    let dst=exp(-sq(yc/wd))*smoothstep(0.,.08,x)*exp(-xp/.35)*(.7+.3*fbt(vec2f(x*3.,yc*8.)+ls,2));
    e=vec3f(.05,.55,1.)*ion*.55+vec3f(1.,.86,.62)*dst*.85
      +vec3f(1.,.95,.86)*(8.*exp(-sq(r/.0035))+.5*exp(-sq(r/.014)));
  } else if(ty<2.5){
    let g=vec2f(d.x,d.y/u.i.y);let r=length(g);let th=atan2(g.y,g.x);
    let disk=exp(-r/.3)*smoothstep(1.05,.6,r);
    let spi=cos(2.*(th-3.2*log(r+.03))+fbt(g*5.+ls,2)*1.5);
    let arm=pow(.5+.5*spi,3.);
    let knot=smoothstep(.6,.8,fbt(g*18.+ls,3))*arm;
    let bul=exp(-pow(r/.07,1.3));
    /* межрукавье тёмное, рукава — насыщенно-голубые, ядро золотое: белёсая дымка по
       полкадра читалась серой */
    e=vec3f(1.,.8,.5)*bul*1.4+mix(vec3f(.35,.55,1.),vec3f(1.,.78,.5),exp(-r/.15))*disk*1.3*arm*arm*arm
      +vec3f(1.,.4,.65)*knot*disk*1.8;
    /* пыль по внутренней кромке рукава, ближняя половина диска темнее — она гасит и
       саму галактику, иначе та гладкая, как наклейка */
    let lane=pow(.5+.5*cos(2.*(th-3.2*log(r+.03))-.9),10.)*smoothstep(.02,.12,r)*smoothstep(1.,.4,r);
    ab=lane*(.5+.8*smoothstep(0.,-.3,g.y))*1.2;
    e=e*exp(-ab*1.6);
  }
  /* 3 — джеты рисует сама дыра (17g), поверх линзы: они у дыры, не за ней, и линза
     не должна скручивать их в кольца. Здесь от них только окно в газе */
  /* L3 3/n: громадина обрамляет игру — к середине кадра её сила (не газ) падает до .35.
     Мера — по эллипсу кадра (на диагонали она же, что доля диагонали): середина кромки
     не гаснет, как центр — у широкого кадра она ближе .3 диагонали */
  let dc=length((p-vec2f(W,H)*.5)/vec2f(W,H))*.7071;
  let kc=k*mix(.35,1.,smoothstep(.2,.45,dc));
  return LK(e*kc,ab*kc,lwin(d,u.h,u.i));}
@fragment fn fs(i:VO)->@location(0) vec4f{
  let W=u.a.z;let H=u.a.w;let p=i.uv*vec2f(W,H);
  let t=u.b.z;let seed=u.b.w;
  let A=u.c.rgb;let dust=u.c.w;let B=u.d.rgb;let dens0=u.d.w;
  let sp=u.e.xy;let rr=max(u.e.z/H,.012);let son=u.e.w;let sc=u.f.rgb;let fill=u.f.w;
  /* освещённость от звезды: 1/(1+r²) от края диска — у гиганта и у карлика одинаково по кадру */
  let sd=max(length(p-sp)/H-rr,0.);
  let lit=son/(1.+sq(sd/.2));
  /* крупный план кадра — общий для всех слоёв (средний параллакс): форма массы,
     области тонов со швом между ними, широкая полоса пыли */
  let qm=((p-vec2f(W,H)*.5)+u.b.xy*.045)/H*.62+vec2f(seed*1.3,seed*.4);
  let wm=vec2f(fbt(qm+vec2f(0.,t*.5),3),fbt(qm+vec2f(4.1,7.3),3));
  let M=fbt(qm*.8+wm*1.3,4);
  /* окно громадины — газ не тускнеет (тусклый газ сер), а отступает: порог массы растёт,
     остаётся плотное и яркое, между ним — пустота со звёздами */
  /* у самой звезды громадину засвечивает её сияние: два ярких пятна не спорят */
  let gl=mix(1.,.3+.7*smoothstep(.02,.22,sd),son);
  let L0=lmk(p,W,H,sp);let LM=LK(L0.e*gl,L0.a*gl,L0.w*gl);let er=LM.w*(.32+.2*fill);
  let mass=smoothstep(.47-.22*fill+er,.6-.12*fill+er,M);
  let ns=normalize(sc+vec3f(1e-3));
  let near=select(1.,-1.,dot(ns,normalize(A))>dot(ns,normalize(B)));
  /* стык тонов — не стенка: переход ≥150 px при 760, тона перемешаны клочьями (варп мельче
     крупного плана), между маджентой и бирюзой — широкая синяя полоса (автор 24.09: «лужа») */
  let sel0=fbt(qm*.55+wm*.9+vec2f(11.,3.),3)+near*.3*smoothstep(.05,.45,lit)*son;
  let sel=sel0+(fbt(qm*2.6+wm*2.+vec2f(3.,17.),3)-.5)*.16;
  let tone=smoothstep(.27,.73,sel);
  let seam=1.-smoothstep(.0,.13,abs(sel-.5));
  let bv=fbt(vec2f(qm.x*.3+wm.y*.6,qm.y*.95+wm.x*.3)+vec2f(21.,5.),3);
  /* полоса узкая, но без порога: шум fb держится у .5, и широкий порог клал её на полкадра */
  let band=1.-smoothstep(.0,.075,abs(bv-.5));
  /* свет звезды красит газ только настолько, насколько сама звезда цветная: белая
     звезда делает газ ярче, а не серее */
  /* тон зарева — чистый тон своей стороны шва: смесь двух дополнительных — серая */
  /* тон свечений (кайма, рассеяние звезды, полость) — та же плавная смесь, что у газа: жёсткий
     выбор стороны шва рисовал дугу мадженты у звезды и клин у баржи (автор, 24.09) */
  var gt=mix(A,B,tone);let gmx=max(gt.r,max(gt.g,gt.b));
  gt=max(gmx+(gt-gmx)*mix(sat(A),sat(B),tone)/max(sat(gt),1e-3),vec3f(0.));
  let gc=gt/max(max(gt.r,max(gt.g,gt.b)),1e-4);
  /* звёздный ветер выдул пузырь: у самой звезды газ редкий, кромка пузыря — ярче;
     светило остаётся самым ярким в кадре */
  let bub=mix(.28,1.,smoothstep(.04,.5,sd));
  let tint=clamp(lit*.6,0.,.5)*sat(sc)*max(dot(normalize(sc),normalize(mix(A,B,.5))),0.)*.6;
  var C=vec3f(0.);var T=1.;var dsum=0.;var Cf=vec3f(0.);
  for(var L=0;L<3;L++){
    let fl=f32(L);
    /* дальний слой крупный и медленный, ближний — мельче и быстрее */
    let par=.02*pow(2.2,fl);let fr=1.25*pow(1.55,fl);
    let q=((p-vec2f(W,H)*.5)+u.b.xy*par)/H*fr+vec2f(seed+fl*17.3,seed*.7+fl*9.1);
    let tt=t*(1.+fl*.4);
    let w=vec2f(fbt(q+vec2f(0.,tt),4),fbt(q+vec2f(5.2,1.3)-vec2f(tt*.7,0.),4));
    let w2=vec2f(fbt(q+1.9*w+vec2f(1.7,9.2),4),fbt(q+1.9*w+vec2f(8.3,2.8)+vec2f(0.,tt*.5),4));
    let d=fbt(q+2.1*w2,5);
    let amp=select(select(.55,.95,L==1),.6,L==2)*dens0;
    /* дальний слой мягче (широкий порог), ближний контрастнее */
    let g=smoothstep(.46-.06*(2.-fl)-.12*fill+er*.6,.76+.07*(2.-fl)+er*.3,d)*amp*mass*(1.-.45*seam)*bub*(1.-.5*LM.w);
    /* пыль: тонкие прожилки-хребты у каждого слоя, у ближнего — ещё и широкая полоса */
    let rid=1.-abs(2.*fbt(q*1.6+w2*1.4+vec2f(9.,4.),4)-1.);
    var ab=smoothstep(.7,.97,rid)*dust*(.26+.3*fl)*(.4+.6*smoothstep(.3,.6,d));
    /* вне газа полоса лишь приглушает звёзды — тёмная лента видна на газе, а не на пустоте */
    if(L==2){ab=ab+band*(.9+.5*smoothstep(.4,.7,d))*clamp(dust,.6,1.4)*mix(.3,1.,smoothstep(.02,.25,g));}
    /* в окне пыль тоньше — громадину видно целиком, а не клочьями */
    ab=ab*(1.-.6*LM.w);
    /* тон — по области массы, а не по завитку: в одном пикселе один цвет */
    /* промежуточный тон — той же насыщенности, что края: смесь двух дополнительных иначе серая */
    var col=mix(A,B,tone);
    let cmx=max(col.r,max(col.g,col.b));
    col=max(cmx+(col-cmx)*mix(sat(A),sat(B),tone)/max(sat(col),1e-3),vec3f(0.));
    col=mix(col,sc,tint)*(1.+.25*fl);
    /* волокна — самые плотные гребни — светят ярче тела */
    let e=col*g*(.62+1.3*lit)*(.6+1.1*smoothstep(.62,.84,d))*(1.+.8*lit*smoothstep(.55,.9,d));
    let rim=mix(gc,vec3f(1.),.25)*max(sc.r,max(sc.g,sc.b))*lit*ab*.3;
    C=C*exp(-ab*2.6)+e+rim;T=T*exp(-ab*2.6);dsum=dsum+g;if(L==2){Cf=e+rim;}
  }
  /* зарево звезды — рассеяние: ядро у диска ровное, дальше — по плотности газа;
     полоса пыли режет его */
  let core=.15*exp(-sd/.05)+.1*exp(-sd/.3);
  let wide=.35*exp(-sd/.3)+.12*exp(-sd/1.2);
  /* у звезды свет уходит в тёплый белый, а не в её цвет поверх чужого тона: оранжевое
     на бирюзе давало серое */
  let sw=mix(sc,vec3f(1.,.95,.88)*max(sc.r,max(sc.g,sc.b)),.6);
  let wc=mix(sw,gc*max(sc.r,max(sc.g,sc.b)),.8);
  C=C+son*(sw*core+wc*wide*1.6*dsum*(1.-.8*seam))*mix(1.,T,.6);
  /* L1b: пыль перед газом (Киль, Столпы) — кадр перестаёт быть стеной газа. Непрозрачные
     массы с резким краем, внутри бурые с тонкой структурой; к звезде край горит тонкой яркой
     каймой — фронт ионизации; глобулы; в газе — тёмные волокна. В разрывах пыли видны звёзды
     за ней (она гасит и их, через T). Не вуаль: либо газ, либо тело пыли */
  let DD=dustAt(p,W,H,seed);let dn=DD.z;
  /* полость светится за столпами: пыль встаёт силуэтом на свету, а не лежит на пустоте
     (Орёл) — свет неровный, клочьями, в тон газа с долей белого звезды */
  let cvn=(.3+.7*smoothstep(.3,.7,fbt(p/H*3.2+vec2f(seed*.3+4.,2.),3)))*(.55+.45*fbt(p/H*9.+vec2f(2.,seed*.2),3));
  let cvg=DD.y*cvn*son*(.4+.8*lit)*(1.-.5*LM.w);
  C=C+mix(gc,sw,.3)*cvg*.3;dsum=dsum+cvg*.5;
  /* край — в пикселях: расстояние до порога по градиенту гладкого поля */
  let ex=1.5;
  let gD=vec2f(dustAt(p+vec2f(ex,0.),W,H,seed).x-dustAt(p-vec2f(ex,0.),W,H,seed).x,
               dustAt(p+vec2f(0.,ex),W,H,seed).x-dustAt(p-vec2f(0.,ex),W,H,seed).x)/(2.*ex);
  let gl2=max(length(gD),1e-5);
  let tS=normalize(sp-p+vec2f(1e-3));
  let fd=dot(-gD/gl2,tS);let face=max(fd,0.);
  let fw=smoothstep(.15,.55,face);
  let DQ0=dpolar(p,W,H);
  /* мелочь края — в слое с параллаксом пыли (.12): у центра кадра она едет вместе с пылью */
  let pl=(p+u.b.xy*.12)/H;
  /* тыльный край рвётся клочьями (средний масштаб), освещённый — мелко изъеден */
  let ero=(fbt(pl*55.+vec2f(5.,5.),3)-.5)*(.005+.012*fw)+(fbt(pl*16.+vec2f(2.,7.),3)-.5)*.045*(1.-fw);
  let dk=clamp(dust,.6,1.3)*(1.-.75*LM.w);
  let thr=-.012*(dk-1.)+.08*LM.w;
  let dpx=(thr-DD.x-ero)/gl2;                   /* >0 — снаружи тела, в CSS px */
  /* край мягкий и наружу, и внутрь: ~135 CSS px на тыле, ~115 на боках и к звезде — 10–90%
     непрозрачности ≥40 px при 760; резкая граница читалась лужей (автор, 24.09) */
  let wsoft=mix(135.,115.,smoothstep(-.75,-.25,fd));
  let body=1.-smoothstep(-wsoft*.78,wsoft*.22,dpx);
  /* плотность растёт вглубь; в толще — неровная: местами газ и звёзды просвечивают */
  /* газ за телом закрыт его силуэтом; звёзды — по толщине: столп в 20–60 px просвечивает
     ими вполсилы, стена глухая */
  /* толща неровная: сгустки и разрежения, а не ровная чернота */
  let dv=smoothstep(.3,.72,dn);
  /* непрозрачность — сама рампа края (10–90% на ≥40 px при 760), толща выводится из неё:
     экспонента от рампы насыщалась в первой трети, и край снова читался резким (автор, 24.09) */
  let od=-log(1.-body*mix(.8,.985,dv))/2.4*dk;
  let odT=body*(.1+3.4*pow(smoothstep(8.,70.,-dpx),1.5)*(.15+1.1*dn))*dk;
  /* кайма фронта ионизации — только к звезде: линия 1–3 px светлее газа и свечение наружу */
  let brk=smoothstep(.25,.55,fbt(pl*9.+vec2f(7.,3.),2));
  let o=max(dpx,0.);
  /* кайма — мягкое свечение 15–30 px при 760: ярче у тела, наружу гаснет, без внутренней границы */
  let edge=smoothstep(-26.,4.,dpx)*(.45*exp(-o/10.)+.55*exp(-o/28.));
  /* кайма — фронт ионизации: светится газ у кромки, её сила — по его плотности; на пустом
     космосе пыль только гасит звёзды — ни каймы, ни бурого */
  let gas=smoothstep(.02,.3,dsum);
  let ion=edge*face*face*fw*brk*(.8+2.2*lit)*dk*gas;
  let ic=mix(gc*1.5,vec3f(1.,.95,.86),.3)*max(max(sc.r,max(sc.g,sc.b)),.7);
  /* внутри — бурый (тон 15–30°): отражённый свет, прожилки вдоль столпа, к сердцевине темнее */
  let vein=1.-abs(2.*nzs(DQ0.tr,DQ0.q,vec2f(30.,4.),vec2f(1.,6.),3)-1.);
  let deep=.2+.8*exp(min(dpx,0.)/14.);
  /* рельеф толщи: бугры светлее на склоне к звезде — облако объёмное, а не вуаль */
  let dn2=nzs(DQ0.tr,DQ0.q-vec2f(0.,.035),vec2f(12.,3.),vec2f(fract(seed*.37)*50.+9.,fract(seed*.71)*50.+12.),3);
  let dn1=nzs(DQ0.tr,DQ0.q,vec2f(12.,3.),vec2f(fract(seed*.37)*50.+9.,fract(seed*.71)*50.+12.),3);
  let emb=clamp((dn2-dn1)*9.,-1.,1.);
  let brown=vec3f(.13,.08,.02)*(.55+.35*lit)*(.6+.8*pow(vein,4.))*deep*max(1.+.6*emb,.15)
    *(1.+2.*face*fw*exp(min(dpx,0.)/6.))*body*(1.-exp(-od*2.4))*dk*gas;
  /* отражённый свет звезды и без газа — на стороне тела к звезде (L1b 5/n) */
  /* кора: серо-бурый с третью тона газа рядом, внутрь тела гаснет за 5–8 px */
  let refl=mix(vec3f(.17,.15,.13),gc*.16,.3)*(.3+.7*fw)*(.06+.94*exp(min(dpx,0.)/6.5))*body*(1.-gas)*dk
    *mix(.6,1.,smoothstep(.3,.7,dn));
  /* ближний слой газа отчасти перед пылью: тело не вырезано из кадра, а лежит в глубине */
  let ta=exp(-od*2.4);
  /* …но сердцевина глухая: чем глубже, тем меньше ближнего газа поверх — драма столпа */
  C=(C-Cf)*ta+Cf*mix(ta,1.,.3*(1.-smoothstep(6.,30.,-dpx)))+ic*ion*1.5+brown+refl;T=T*exp(-odT*2.4);
  /* громадина — за всеми слоями: её свет прошёл сквозь их пыль (T), её пыль гасит звёзды */
  C=C+LM.e*mix(T,1.,.5);T=T*exp(-LM.a*2.);
  return vec4f(C,1.-T);}`;
/* сведение в полном разрешении. Общая часть: мелкие гребни по течению (волокна и
   зерно), резкие края пыли */
const GNB_FINE=GNB_NOISE+GNB_TILE+`
fn fineT(p:vec2f,T0:f32)->f32{
  /* чистое небо: при T0≥.97 гребни не весят ничего, mix(T0,Ts,.2)·1.12 ≥ 1.09 — ровно 1 после clamp */
  if(T0>=.97){return 1.;}
  let V=fu.v;let H=fu.res.w;
  let qf=((p-fu.res.zw*.5)+V[0].xy*.09)/H*7.+V[0].w;
  let r=1.-abs(2.*fbt(qf*1.9+vec2f(gnt(qf*.7),gnt(qf*.7+3.3))*1.6,2)-1.);
  /* края полос чуть резче бикубики — но мягко: резкий край пыли автор видит лужей */
  let Ts=clamp((T0-.5)*1.7+.5,0.,1.);
  return clamp(mix(T0,Ts,.2)*mix(1.12,.86,r*r*smoothstep(.97,.6,T0)),0.,1.);}
fn fineE(p:vec2f)->f32{
  let V=fu.v;let H=fu.res.w;
  let qf=((p-fu.res.zw*.5)+V[0].xy*.09)/H*9.+V[0].w+vec2f(4.,9.);
  let wv=vec2f(gnt(qf*.45+V[0].z),gnt(qf*.45+vec2f(5.,1.)))*2.2;
  let r=1.-abs(2.*fbt(qf+wv,2)-1.);
  return .5+.95*r*r;}`;
/* поглощение — в шейдере звезды (P1 11/n): полноэкранный проход ABS умножал цель сцены, а под
   туманностью в ней только чёрная очистка и звёзды (пересчёт идёт до открытия сцены, всё
   прочее — после сведения). Смешение «поверх» линейно по цвету, поэтому множитель на каждом
   пикселе звезды даёт то же, что множитель на экране, — и платится площадью звёзд.
   Звёзды — поверх газа, под пылью: общее плечо кадра сжимает слабую звезду на светлом
   газе в ноль, поэтому то, что за газом (почти одни звёзды — фон чёрный), поднято на
   его яркость. Прячет звёзды только пыль */
const GNB_STAR_ABS=GNB_FINE+`
struct FU{res:vec4f,v:array<vec4f,15>};
@group(0) @binding(2) var<uniform> fu:FU;
@group(0) @binding(3) var smp:sampler;
@group(0) @binding(4) var t0:texture_2d<f32>;
@group(0) @binding(5) var t1:texture_2d<f32>;
@fragment fn fs(i:VO)->@location(0) vec4f{
  let al=i.col.a*gspCov(i);
  let uv=i.p.xy/fu.res.xy;let p=uv*fu.res.zw;
  let g=texCubic(t0,smp,uv);
  let T=fineT(p,clamp(1.-g.a,0.,1.));
  let le=1.-exp(-max(g.r,max(g.g,g.b))*6.)+fu.v[1].w*.6;
  return vec4f(i.col.rgb*al*(pow(vec3f(T),vec3f(.72,1.,1.42))*(1.+2.6*le)),al);}`;
function gnbStars(pass,ub,sb){
  const P=gpuPipe("gnb.stars",GPU_PIPE_SRC["gnb.stars"]()[0]);
  const f=GNB.SU||(GNB.SU=new Float32Array(64));
  f[0]=GPU.bw;f[1]=GPU.bh;f[2]=W;f[3]=H;f.set(GNB.C.subarray(0,60),4);
  const nb=gpuBuf("gnb.su",256,GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST);GPU.dev.queue.writeBuffer(nb,0,f);
  pass.setPipeline(P);pass.setBindGroup(0,gpuBind("gnb.stars",P,[ub,sb,nb,GPU.S.lin,GNB.view,gnbNoiseTile()]));
  pass.draw(6,GSP.nStars*4);
}
/* V[0]: камера x,y, время, зерно · V[1]: звезда x,y, радиус/H, вкл · V[2]: цвет звезды, ширина тени ·
   V[3]: цвет теней · V[4..10]: планеты x,y,r (CSS px) — их тени */
const GNB_EMI=GNB_FINE+`
fn field(p:vec2f,uv:vec2f)->vec4f{
  let V=fu.v;let H=fu.res.w;
  /* одна бикубика на пиксель: цвет, туман и цвет космоса читают её (было три — 12 выборок) */
  let g0=texCubic(t0,smp,uv);
  var c=max(g0.rgb,vec3f(0.));
  let l0=max(c.r,max(c.g,c.b));
  /* тон газа до волокон: тусклый газ окрашивает туман своим цветом */
  let gh0=c/max(l0,1e-4);
  /* волокна: гребни в полном разрешении режут тело газа */
  let body=smoothstep(.015,.14,l0);
  /* деталь — только где её вес не ноль: вне газа шум не считается */
  if(body>0.){c=c*mix(1.,fineE(p),body*.85);}
  /* фронт ионизации: где газ густеет прочь от звезды — это его кромка к звезде */
  let ts=1./vec2f(textureDimensions(t0));
  let lx=textureSampleLevel(t0,smp,uv+vec2f(ts.x*1.5,0.),0.).rgb-textureSampleLevel(t0,smp,uv-vec2f(ts.x*1.5,0.),0.).rgb;
  let ly=textureSampleLevel(t0,smp,uv+vec2f(0.,ts.y*1.5),0.).rgb-textureSampleLevel(t0,smp,uv-vec2f(0.,ts.y*1.5),0.).rgb;
  let gr=vec2f(max(lx.r,max(lx.g,lx.b)),max(ly.r,max(ly.g,ly.b)));
  let dir=normalize(p-V[1].xy+vec2f(1e-3));
  let sd=max(length(p-V[1].xy)/H-V[1].z,0.);let lit=V[1].w/(1.+sq(sd/.2));
  let fr=max(dot(gr,dir),0.)*lit;
  /* тени планет (L1.6): планета между звездой и газом режет свет — за ней по газу
     тёмный клин от звезды, край мягкий и расходится с расстоянием (у звезды есть
     размер), вдали клин тает — газ освещает и рассеянный свет */
  var shd=0.;var ray=0.;
  let toS=V[1].xy-p;let Ls=max(length(toS),1.);let ds=toS/Ls;
  for(var k=0;k<7;k++){let P=V[4+k];if(P.z<=0.){break;}
    let q=P.xy-p;let tq=dot(q,ds);
    /* ни одного порога: клин начинается за диском и кончается у звезды склонами;
       полутень не уже ~40 px на 760 кадра (55 CSS px на полуширину) и расходится вдаль.
       Лучи вдоль краёв включались ступенькой на dq=R — прямая через весь кадр (24.09) */
    let on=smoothstep(P.z*.2,P.z*.9,tq)*smoothstep(0.,P.z,Ls-tq);
    /* конус, а не полоса (Контроль 24.09, ph_tri): ядро тени сужается, полутень растёт
       с расстоянием, и сама тень светлеет за ~4 радиуса — затухание в 11.5 радиуса у
       крупной планеты уводило почти чёрную полосу за край экрана */
    if(on>0.){let dq=length(q-ds*tq);let pen=P.z*.15+tq*.3+30.;
      let Rz=P.z*max(.35,1.-tq/(P.z*9.));
      /* в пыли и газе тень гасит не больше половины: туман перед ней её заполняет */
      let fd=.5*exp(-tq/(P.z*4.+90.))*on;
      let sh=1.-smoothstep(Rz-pen,Rz+pen,dq);
      shd=max(shd,sh*fd);
      /* по краям клина свет чуть ярче — лучи между тенями, растут, пока тень сходит */
      let e=(dq-Rz-pen)/(pen+P.z*.6);ray=max(ray,exp(-e*e)*(1.-sh)*fd);}}
  c=c*(1.-shd)*(1.+.3*ray);
  /* тонкая пыль всюду: свет звезды в ней — лучи, тени планет — тёмные клинья */
  let dl=max(length(p-V[1].xy)/H-V[1].z,0.);
  /* освещённая звездой пыль по всей системе, и в пустотах: ровный тёплый туман (L ~10–15
     на кадре), у самой звезды его нет — там царит её корона; клинья режут и его */
  let wn=lwin(lfr(p,V[14],V[13].x),V[11],V[12])*mix(1.,.3+.7*smoothstep(.02,.22,sd),V[1].w);
  /* густая пыль закрывает и туман за собой: тело пыли темнее пустоты */
  let fog=V[1].w*(.1+.05/(1.+sq(dl/.4)))*smoothstep(.12,.3,dl)*(1.-body)*(1.-.92*wn)
    *mix(.55,1.,clamp(1.-g0.a,0.,1.));
  /* где есть хоть тусклый газ, туман берёт его тон: тёплый туман на бирюзе был серым */
  /* в пустоте туман — цвет звезды, но не бледнее насыщенности .5: бледно-тёплое на
     тёмном читалось серой дымкой */
  let smx=max(V[2].r,max(V[2].g,V[2].b));let sn=mix(V[2].rgb,vec3f(1.,.92,.8)*smx,.35)/smx;
  let sk=.5/max(1.-min(sn.r,min(sn.g,sn.b)),.08);let fs=clamp(1.-(1.-sn)*max(sk,1.),vec3f(0.),vec3f(1.))*smx;
  let fc=mix(fs,gh0*smx,smoothstep(.0003,.004,l0));
  let hue=c/max(l0,1e-3);
  let fw=smoothstep(.02,.16,fr);
  if(fw>0.){c=c+mix(hue,vec3f(1.),.3)*fw*fineE(p*1.7)*.55;}
  /* тени — третьим цветом: тёмный газ уходит в тон теней, светлый держит свой */
  let lum=max(c.r,max(c.g,c.b));
  let cn=V[3].rgb/max(max(V[3].r,max(V[3].g,V[3].b)),1e-3);
  /* только в глубокой тени и коротким переходом: широкая смесь тона с тенью по кругу
     давала серо-оливковое по всему тусклому газу. Янтарь со сливой смешиваются через
     красное, не через серое, — у гиганта переход широкий (V[2].w) */
  c=mix(c,cn*lum,(1.-smoothstep(V[2].w*.55,V[2].w,lum))*.9);
  /* туман — после тона теней: тёплый свет поверх индиго давал серое */
  c=c+fc*fog*(1.-shd)*(1.+.3*ray);
  let m=max(lum,1e-4);let mm=max(max(c.r,c.g),max(c.b,1e-4));
  /* цвет космоса — здесь, а не очисткой сцены: подъём звёзд на газе (ABS) его не трогает,
     пыль гасит его так же, как звёзды */
  let Tb=pow(vec3f(fineT(p,clamp(1.-g0.a,0.,1.))),vec3f(.72,1.,1.42));
  /* неон ушёл: насыщенность и яркость газа ниже, туманность остаётся цветной (автор, 24.09) */
  let co=c*(1.-exp(-mm*1.25))/(mm*1.25)*1.12;let cy=dot(co,vec3f(.2126,.7152,.0722));
  return vec4f(mix(vec3f(cy),co,.66)*mix(1.,.72,smoothstep(.12,.6,cy))+vec3f(5.,7.,12.)/255.*Tb,0.);}`;
function gnbTarget(){
  const w=Math.max(2,Math.ceil(GPU.bw/4)),h=Math.max(2,Math.ceil(GPU.bh/4));
  if(GNB.tex&&GNB.dev===GPU.dev&&GNB.w===w&&GNB.h===h)return;
  if(GNB.tex&&GNB.dev===GPU.dev)GPU.trash.push(GNB.tex);
  const U=GPUTextureUsage;
  GNB.tex=GPU.dev.createTexture({size:[w,h],format:"rgba16float",usage:U.TEXTURE_BINDING|U.RENDER_ATTACHMENT});
  GNB.view=GNB.tex.createView();GNB.dev=GPU.dev;GNB.w=w;GNB.h=h;GNB.last=-99;
}
function gnbPipe(){const k="gnb.gen|16f";return GPU.lay[k]||(GPU.lay[k]=gpuPipeline(k,gnbGenDesc));}
function gnbGenDesc(){const mod=gpuShader(GNB_GEN);return {layout:"auto",vertex:{module:mod,entryPoint:"vs"},
    fragment:{module:mod,entryPoint:"fs",targets:[{format:"rgba16float"}]},primitive:{topology:"triangle-list"}};
}
/* палитра туманности системы — своим потоком случайности (0x4E42), сид мира не
   трогает. Два тона по кругу — по областям массы, тень — третьим; у гиганта —
   раздельное тонирование: свет янтарный, тени сливовые (290–330°); у горячих —
   лёд (190–205°) и индиго (240–260°); у дыры — выцветший с оранжевым акцентом.
   Одна система из пяти — внутри яркой эмиссионной туманности (fill): газ кроет
   почти весь кадр, корпуса на нём — силуэтами */
const GNB_PAL=[
  {a:[236,112,58],b:[36,150,178],c:[26,48,120]},    // оранж + бирюза, тени синие
  {a:[206,58,164],b:[36,196,176],c:[40,26,110]},    // маджента + изумруд, тени индиго (лайм читался ядовитым)
  {a:[150,86,214],b:[232,86,118],c:[24,40,128]},    // фиолет + роза, тени синие
  {a:[56,200,232],b:[40,164,212],c:[84,42,204],sw:.15}, // лёд в двух тонах, тени индиго
  {a:[255,166,72],b:[236,120,50],c:[50,16,140],sw:.2}, // янтарь, тени слива: раздельный тон по всему тусклому
  {a:[206,120,74],b:[96,104,210],c:[34,18,80]}];   // дыра: медь диска и холодный фиолет джетов (серый «выцветший» был грязью)
function gnbPalette(sys){
  if(sys.gnbPal)return sys.gnbPal;
  const r=rng((sys.seed^0x4E42)>>>0),k=sysStyle(sys).kind;
  const hot=/^#[89a-f]/i.test(sys.cls.col)&&parseInt(sys.cls.col.slice(5,7),16)>200;
  let i=k==="giant"?4:k==="hole"?5:(k==="dwarf"||k==="neutron"||hot)?3:(r()*3)|0;
  if(r()<.2&&k!=="hole")i=(i+1+((r()*3)|0))%5;
  const fill=r()<.2?1:0;
  return sys.gnbPal=Object.assign({fill,dens:fill?1.3:1,lm:gnbLandmark(sys,k)},GNB_PAL[i]);
}
/* достопримечательность — свой поток (0x4C4D): вид, место на заднике, размер, поворот */
const GNB_LM_COL=[[[1,.36,.3],[.3,.72,1]],[[.3,.55,1],[1,.78,.45]],[[1,1,1],[1,1,1]],[[.55,.65,1],[.75,.5,1]]];
function gnbLandmark(sys,k){
  const r=rng((sys.seed^0x4C4D)>>>0);
  const t=k==="hole"?3:(r()*3)|0;
  const s=[.62,.9,.55,1][t]*(.85+r()*.3);
  /* L2/L1 возврат: громадина обрамляет игру, а не лежит под кораблём (при параллаксе .006 она
     стоит на экране почти намертво) — центр в угловой четверти, .66–.95 полукадра по осям:
     дальше .3 диагонали от центра кадра, в середину заходит только край. Те же два числа потока */
  /* угол — решёткой по месту системы: у соседей углы разные, любые четыре подряд — все четыре */
  const x0=r()-.5,y0=r()-.5,cr=((sys.sx|0)+2*(sys.sy|0))&3,
        q=(v,sg)=>sg*(.66+.29*Math.min(1,Math.abs(v)*2));
  /* верхний левый — под полосами HUD: громадину ниже блока полос, ближе к кромке по x */
  const tl=cr===0,x=q(x0,cr&1?1:-1),y=tl?-(.36+.14*Math.min(1,Math.abs(y0)*2)):q(y0,cr&2?1:-1);
  return {t,x:tl?Math.min(x,-.74):x,y,s,a:r()*6.283,p:.35+r()*.3,l:r()*40,k:2.2,c:GNB_LM_COL[t]};
}
/* место и поворот громадины в кадре (P1 14/n г): константы кадра — раз на процессоре, а не в
   каждом пикселе. Параллакс .006. Возвращает [x, y, cos, sin, размер в px] */
function gnbLfr(lm,camx,camy,st){
  const o=GNB.LQ||(GNB.LQ=new Float32Array(5));
  /* место — доли полукадра по каждой оси: и на широком экране, и на телефоне громадина в своём углу */
  let x=W*(.5+lm.x*.5)-camx*.006,y=H*(.5+lm.y*.5)-camy*.006,a=lm.a;
  if(lm.t>2.5){x=st.x;y=st.y;a=1.3208;}
  else if(lm.t===1){
    /* комета: голова в своём углу (решётка, отступ от HUD — как у всех), хвосты — внутрь
       кадра, но мимо середины: ось отведена от направления на центр на 30±5° к вертикальной
       кромке (в центре всегда свой корабль — прямая в него читалась лучом наведения; сверху
       и снизу — полосы HUD). Громадина на бесконечности: проекция хвоста любая */
    const vx=W/2-x,vy=H/2-y;
    a=Math.atan2(vy,vx)+(vx*vy>0?1:-1)*(.52+(lm.a/6.2832-.5)*.17);}
  o[0]=x;o[1]=y;o[2]=Math.cos(a);o[3]=Math.sin(a);o[4]=H*lm.s;return o;
}
/* светило для туманности: место на экране, радиус, цвет по виду звезды */
function gnbStar(sys,ox,oy,R){
  const k=sysStyle(sys).kind;
  if(k==="hole")return {x:ox,y:oy,r:R,on:.35,c:hex2rgb("#ffb070")};
  const col=k==="giant"?"#ff7448":k==="dwarf"?"#dcefff":k==="neutron"?"#bfe0ff":sys.cls.col;
  return {x:ox,y:oy,r:k==="giant"?R*1.85:k==="dwarf"?R*.6:R,on:1,c:hex2rgb(col)};
}
/* пересчёт в четверть кадра — отдельным проходом ДО прохода сцены. cam — камера в
   пикселях CSS (cx0*Z), st — gnbStar */
function gpuNebulaGen(sys,camx,camy,st,Z){
  if(!GPU.on||!GPU.enc||GPU.scenePass||GPU.overPass)return false;
  gnbTarget();
  const st2=sysStyle(sys),pl=gnbPalette(sys);
  /* сведению — камера, звезда и тень каждый кадр, даже без пересчёта объёма */
  const c=GNB.C;c[0]=camx;c[1]=camy;c[2]=(G.t||0)*.0004;c[3]=(st2.nseed%997)*.013;
  c[4]=st.x;c[5]=st.y;c[6]=st.r/H;c[7]=st.on;c[8]=st.c[0]/255;c[9]=st.c[1]/255;c[10]=st.c[2]/255;
  /* планеты — отбрасывают тени по газу; самые крупные на экране, до семи */
  let np=0;
  if(Z)for(const p of sys.planets){if(np>=7)break;const r=p.radius*Z;if(r<3)continue;
    const o=16+np*4;c[o]=W/2+p.x*Z-camx;c[o+1]=H/2+p.y*Z-camy;c[o+2]=r;c[o+3]=1;np++;}
  for(let k=np;k<7;k++)c[16+k*4+2]=0;
  /* громадина — и сведению: окно гасит туман */
  const lm=pl.lm;
  c[44]=lm.x;c[45]=lm.y;c[46]=lm.s;c[47]=lm.t;c[48]=lm.a;c[49]=lm.p;c[50]=lm.l;c[51]=lm.k;c[55]=.006;
  const lq=gnbLfr(lm,camx,camy,st);c[52]=lq[4];for(let k=0;k<4;k++)c[56+k]=lq[k];
  c[11]=pl.sw||.1;c[12]=pl.c[0]/255;c[13]=pl.c[1]/255;c[14]=pl.c[2]/255;
  /* пыль (L1b) в полярных координатах звезды: сдвиг угла и ln r копится по кадрам так, чтобы
     узор у центра кадра полз с параллаксом .12, а направления смотрели на настоящую звезду.
     Звезда у центра (D < .3H) — узор идёт с ней */
  const sx=st.x-W/2,sy=st.y-H/2,sD=Math.max(Math.hypot(sx,sy),1),ph=Math.atan2(sy,sx),
        wD=(1-.12)*Math.min(1,Math.max(0,(sD/H-.3)/.5)),lD=Math.log(sD/H);
  /* кромки кадра по радиусу (ближняя точка — не ближе .25H) — так же */
  const ex=Math.max(0,Math.abs(sx)-W/2),ey=Math.max(0,Math.abs(sy)-H/2),
        l0=Math.log(Math.max(Math.hypot(ex,ey),.25*H)/H),l1=Math.log(Math.hypot(Math.abs(sx)+W/2,Math.abs(sy)+H/2)/H);
  /* узор копится у центра кадра в сжатых координатах (kD — как в шейдере): смена зума или
     удаление от звезды меняют масштаб вокруг центра, а не сдвигают узор */
  const kD=Math.max(1,sD/H/.9);
  if(GNB.dsys!==sys){GNB.dsys=sys;GNB.Qc=kD*((1-wD)*ph+Math.PI);GNB.Yc=kD*(1-wD)*lD;}
  else{let d=ph-GNB.phP;d-=Math.round(d/(2*Math.PI))*2*Math.PI;GNB.Qc+=kD*(1-wD)*d;GNB.Yc+=kD*(1-wD)*(lD-GNB.lDP);}
  GNB.phP=ph;GNB.lDP=lD;
  const moved=Math.hypot(camx-GNB.cx,camy-GNB.cy)*.09;
  /* GPU.kill.ngen (проба ?g11=deep): сведение старой текстуры без пересчёта — цена одного пересчёта */
  if(GNB.sys===sys&&(GPU.kill.ngen||moved<.5&&GPU.frameNo-GNB.last<3&&GPU.frameNo>=GNB.last))return true;
  const a=GNB.U;
  a[0]=GNB.w;a[1]=GNB.h;a[2]=W;a[3]=H;
  a[4]=camx;a[5]=camy;a[6]=c[2];a[7]=c[3];
  a[8]=pl.a[0]/255;a[9]=pl.a[1]/255;a[10]=pl.a[2]/255;a[11]=clamp(st2.dust,.3,1.7);
  a[12]=pl.b[0]/255;a[13]=pl.b[1]/255;a[14]=pl.b[2]/255;a[15]=pl.dens;
  a[16]=st.x;a[17]=st.y;a[18]=st.r;a[19]=st.on;
  a[20]=st.c[0]/255;a[21]=st.c[1]/255;a[22]=st.c[2]/255;a[23]=pl.fill;
  a[24]=GNB.Qc;a[25]=GNB.Yc;a[26]=(l0-lD)*kD+GNB.Yc;a[27]=(l1-lD)*kD+GNB.Yc;
  a[28]=lm.x;a[29]=lm.y;a[30]=lm.s;a[31]=lm.t;a[32]=lm.a;a[33]=lm.p;a[34]=lm.l;a[35]=lm.k;
  a[36]=lm.c[0][0];a[37]=lm.c[0][1];a[38]=lm.c[0][2];a[39]=.006;a[40]=lm.c[1][0];a[41]=lm.c[1][1];a[42]=lm.c[1][2];
  a[43]=lq[4];for(let k=0;k<4;k++)a[44+k]=lq[k];
  const U=GPUBufferUsage,ub=gpuBuf("gnb.u",192,U.UNIFORM|U.COPY_DST);
  GPU.dev.queue.writeBuffer(ub,0,a);
  const P=gnbPipe();
  const p=GPU.enc.beginRenderPass({colorAttachments:[{view:GNB.view,loadOp:"clear",storeOp:"store",clearValue:{r:0,g:0,b:0,a:0}}],timestampWrites:gpuTs("nebGen")});
  p.setPipeline(P);p.setBindGroup(0,gpuBind("gnb.gen",P,[ub,GPU.S.lin,gnbNoiseTile()]));p.draw(3);p.end();
  GNB.sys=sys;GNB.cx=camx;GNB.cy=camy;GNB.last=GPU.frameNo;GNB.nGen=(GNB.nGen|0)+1;
  return true;
}
/* возвращает проход сцены, в который рисовать дальше: под меткой времени (проба) сведение
   идёт своим проходом — у меток нет записи внутри прохода на телефоне */
function gpuNebulaComp(pass){
  if(!GNB.view||GNB.dev!==GPU.dev)return pass;
  const ts=gpuTs("nebComp");let p=pass;
  if(ts){pass.end();GPU.scenePass=null;p=GPU.enc.beginRenderPass({colorAttachments:[{view:GPU.V.scene,loadOp:"load",storeOp:"store"}],timestampWrites:ts});}
  /* пыль уже погасила и покраснила звёзды (gnbStars); газ светит поверх */
  gpuField(p,"gnb.emi",GNB_EMI,GNB.C,[{view:GNB.view},{view:gnbNoiseTile()}],{blend:"add"});
  /* корпуса на ярком газе — силуэтами: общий проход темнит газ вокруг 2D (08b) */
  GPU.sep=.7;
  if(ts){p.end();return gpuScene();}
  return pass;
}
