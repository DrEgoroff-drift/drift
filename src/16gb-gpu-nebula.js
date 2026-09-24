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
const GNB={tex:null,view:null,dev:null,w:0,h:0,last:-99,cx:1e9,cy:1e9,sys:null,U:new Float32Array(44),C:new Float32Array(60)};
const GNB_NOISE=`
fn gh(p:vec2f)->f32{var q=fract(vec3f(p.xyx)*.1031);q=q+dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
fn gn(p:vec2f)->f32{let i=floor(p);let f=fract(p);let w=f*f*(3.-2.*f);
  return mix(mix(gh(i),gh(i+vec2f(1.,0.)),w.x),mix(gh(i+vec2f(0.,1.)),gh(i+vec2f(1.,1.)),w.x),w.y);}
fn fb(p0:vec2f,n:i32)->f32{var p=p0;var s=0.;var a=.5;var m=0.;
  for(var k=0;k<n;k++){s=s+a*gn(p);m=m+a;p=mat2x2f(1.6,1.2,-1.2,1.6)*p+vec2f(3.1,7.7);a=a*.5;}
  return s/m;}
fn sat(c:vec3f)->f32{let mx=max(c.r,max(c.g,c.b));return (mx-min(c.r,min(c.g,c.b)))/max(mx,1e-4);}
fn sq(x:f32)->f32{return x*x;}
/* громадина (L1.7) — общая геометрия для объёма и сведения. h: x,y (в H от центра),
   размер (в H), вид · i: угол, наклон, зерно, сила. Комета ставит хвост от звезды,
   джеты выходят из самой дыры по оси, перпендикулярной её диску (17g: наклон -.25) */
fn lfr(p:vec2f,W:f32,H:f32,sp:vec2f,h:vec4f,i:vec4f,cam:vec2f,par:f32)->vec2f{
  /* место — доли полукадра по каждой оси: и на широком экране, и на телефоне громадина в своём углу */
  var Lc=vec2f(W,H)*(.5+h.xy*.5)-cam*par;var a=i.x;
  if(h.w>2.5){Lc=sp;a=1.3208;}
  else if(h.w>.5&&h.w<1.5){
    /* комета: хвост от звезды хордой вдоль кромки кадра — голова у угла, хвост во внешнем
       кольце, а не за краем. Направление — от звезды (в долях полукадра), сторона хорды —
       знак потока; голова отступает на полхвоста назад */
    let hf=vec2f(W,H)*.5;let v=(hf-sp)/hf;
    var us=vec2f(1.,0.);if(dot(v,v)>1e-6){us=normalize(v);}
    let pr=vec2f(-us.y,us.x)*select(-1.,1.,h.x*us.y-h.y*us.x<0.);
    Lc=hf*(1.+pr*.82-us*.62)-cam*par;let t=us*hf;a=atan2(t.y,t.x);}
  let d0=(p-Lc)/(H*h.z);let c=cos(a);let s=sin(a);
  return vec2f(c*d0.x+s*d0.y,-s*d0.x+c*d0.y);}
/* пылевой хвост отстаёт по орбите — в свою сторону у каждой кометы */
fn lbend(i:vec4f)->f32{return select(-.22,.22,fract(i.z)>.5);}
fn lcy(d:vec2f,i:vec4f)->f32{let x=max(d.x,0.);return d.y+lbend(i)*(.6*x+x*x);}
/* окно: вокруг громадины газ отступает, туман гаснет — пустота чёрная, а не серая */
fn lwin(d:vec2f,h:vec4f,i:vec4f)->f32{
  let t=h.w;var w=0.;
  if(t<.5){w=smoothstep(1.45,.95,length(d));}
  else if(t<1.5){let x=d.x;let yc=lcy(d,i);let wd=.04+.22*max(x,0.);
    w=exp(-sq(yc/(wd*1.8+.06)))*smoothstep(1.4,.5,x)*smoothstep(-.2,0.,x);}
  else if(t<2.5){w=smoothstep(1.2,.55,length(vec2f(d.x,d.y/i.y)));}
  else{let x=abs(d.x);w=exp(-sq(d.y/(.04+.2*x)))*smoothstep(1.8,.9,x);}
  return min(w*1.4,1.)*select(0.,1.,i.w>0.);}`;
const GNB_GEN=`
struct NU{a:vec4f,b:vec4f,c:vec4f,d:vec4f,e:vec4f,f:vec4f,g:vec4f,h:vec4f,i:vec4f,j:vec4f,k:vec4f};
@group(0) @binding(0) var<uniform> u:NU;
struct VO{@builtin(position) p:vec4f,@location(0) uv:vec2f};
@vertex fn vs(@builtin(vertex_index) i:u32)->VO{
  var P=array(vec2f(-1.,-1.),vec2f(3.,-1.),vec2f(-1.,3.));
  var o:VO;o.p=vec4f(P[i],0.,1.);o.uv=vec2f(P[i].x*.5+.5,.5-P[i].y*.5);return o;}
${GNB_NOISE}
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
struct LK{e:vec3f,a:f32,w:f32};
fn lmk(p:vec2f,W:f32,H:f32,sp:vec2f)->LK{
  let ty=u.h.w;let k=u.i.w;
  if(k<=0.){return LK(vec3f(0.),0.,0.);}
  let d=lfr(p,W,H,sp,u.h,u.i,u.b.xy,u.j.w);
  let ls=u.i.z;let c1=u.j.rgb;let c2=u.k.rgb;
  var e=vec3f(0.);var ab=0.;
  if(ty<.5){
    let wv=vec2f(fb(d*2.2+vec2f(ls,1.),3),fb(d*2.2+vec2f(4.,ls),3))-.5;
    let q=d+wv*.22;let r=length(q);
    let th=atan2(q.y,q.x);let dir=q/max(r,1e-3);
    /* кольцо рвано: одна дуга яркая, противоположная — почти пропала */
    let arc=.15+.85*smoothstep(.35,.7,fb(dir*1.3+vec2f(ls*2.,3.),3));
    let w=.05+.07*fb(dir*2.+vec2f(7.,ls),2);
    let sh=exp(-sq((r-1.)/w));
    let rid=1.-abs(2.*fb(q*7.+wv*3.+vec2f(ls,9.),4)-1.);
    let fil=pow(rid,5.)*(.35+.9*sh)+sh*.25;
    let outer=smoothstep(-.02,.03,r-1.+ .03*sin(th*9.+ls));
    let seam=1.-.7*exp(-sq((r-1.)/.012));
    e=mix(c1,c2,outer)*fil*sh*arc*seam*1.5;
    /* внутри — слабое свечение и клочья */
    e=e+c1*(.05+.14*pow(rid,3.))*smoothstep(1.,.2,r)*(.4+.6*arc);
  } else if(ty<1.5){
    /* голова в начале координат, хвост — вдоль +x, от звезды. Голова мелкая и тусклая,
       хвост набирает свет не сразу за ней: белая полоса от точки читалась выстрелом */
    let x=d.x;let r=length(d);
    let wi=.015+.035*max(x,0.);
    let st=.45+.55*fb(vec2f(x*3.-u.b.z*4.,d.y/wi*.6+ls),3);
    let ion=exp(-sq(d.y/wi))*smoothstep(0.,.3,x)*exp(-max(x,0.)/1.2)*st;
    /* пыль — широкий мягкий веер, не факел: свет набирает поодаль от головы */
    let yc=lcy(d,u.i);let wd=.04+.22*max(x,0.);
    let dst=exp(-sq(yc/wd))*smoothstep(0.,.35,x)*exp(-max(x,0.)/.8)*(.6+.4*fb(vec2f(x*2.,yc*6.)+ls,2));
    e=c1*ion*.8+c2*dst*.55+vec3f(.7,.9,1.)*(.14*exp(-r/.012)+.07*exp(-r/.04));
  } else if(ty<2.5){
    let g=vec2f(d.x,d.y/u.i.y);let r=length(g);let th=atan2(g.y,g.x);
    let disk=exp(-r/.3)*smoothstep(1.05,.6,r);
    let spi=cos(2.*(th-3.2*log(r+.03))+fb(g*5.+ls,2)*1.5);
    let arm=pow(.5+.5*spi,3.);
    let knot=smoothstep(.6,.8,fb(g*18.+ls,3))*arm;
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
  let lit=son/(1.+pow(sd/.2,2.));
  /* крупный план кадра — общий для всех слоёв (средний параллакс): форма массы,
     области тонов со швом между ними, широкая полоса пыли */
  let qm=((p-vec2f(W,H)*.5)+u.b.xy*.045)/H*.62+vec2f(seed*1.3,seed*.4);
  let wm=vec2f(fb(qm+vec2f(0.,t*.5),3),fb(qm+vec2f(4.1,7.3),3));
  let M=fb(qm*.8+wm*1.3,4);
  /* окно громадины — газ не тускнеет (тусклый газ сер), а отступает: порог массы растёт,
     остаётся плотное и яркое, между ним — пустота со звёздами */
  /* у самой звезды громадину засвечивает её сияние: два ярких пятна не спорят */
  let gl=mix(1.,.3+.7*smoothstep(.02,.22,sd),son);
  let L0=lmk(p,W,H,sp);let LM=LK(L0.e*gl,L0.a*gl,L0.w*gl);let er=LM.w*(.32+.2*fill);
  let mass=smoothstep(.47-.22*fill+er,.6-.12*fill+er,M);
  let ns=normalize(sc+vec3f(1e-3));
  let near=select(1.,-1.,dot(ns,normalize(A))>dot(ns,normalize(B)));
  let sel=fb(qm*.55+wm*.9+vec2f(11.,3.),3)+near*.3*smoothstep(.05,.45,lit)*son;
  let tone=smoothstep(.485,.515,sel);
  let seam=1.-smoothstep(.0,.045,abs(sel-.5));
  let bv=fb(vec2f(qm.x*.3+wm.y*.6,qm.y*.95+wm.x*.3)+vec2f(21.,5.),3);
  let band=1.-smoothstep(.035,.1,abs(bv-.5));
  /* свет звезды красит газ только настолько, насколько сама звезда цветная: белая
     звезда делает газ ярче, а не серее */
  /* тон зарева — чистый тон своей стороны шва: смесь двух дополнительных — серая */
  let gt=select(A,B,tone>.5);let gc=gt/max(gt.r,max(gt.g,gt.b));
  /* звёздный ветер выдул пузырь: у самой звезды газ редкий, кромка пузыря — ярче;
     светило остаётся самым ярким в кадре */
  let bub=mix(.28,1.,smoothstep(.04,.5,sd));
  let tint=clamp(lit*.6,0.,.5)*sat(sc)*max(dot(normalize(sc),normalize(mix(A,B,.5))),0.)*.6;
  var C=vec3f(0.);var T=1.;var dsum=0.;
  for(var L=0;L<3;L++){
    let fl=f32(L);
    /* дальний слой крупный и медленный, ближний — мельче и быстрее */
    let par=.02*pow(2.2,fl);let fr=1.25*pow(1.55,fl);
    let q=((p-vec2f(W,H)*.5)+u.b.xy*par)/H*fr+vec2f(seed+fl*17.3,seed*.7+fl*9.1);
    let tt=t*(1.+fl*.4);
    let w=vec2f(fb(q+vec2f(0.,tt),4),fb(q+vec2f(5.2,1.3)-vec2f(tt*.7,0.),4));
    let w2=vec2f(fb(q+1.9*w+vec2f(1.7,9.2),4),fb(q+1.9*w+vec2f(8.3,2.8)+vec2f(0.,tt*.5),4));
    let d=fb(q+2.1*w2,5);
    let amp=select(select(.55,.95,L==1),.6,L==2)*dens0;
    /* дальний слой мягче (широкий порог), ближний контрастнее */
    let g=smoothstep(.46-.06*(2.-fl)-.12*fill+er*.6,.76+.07*(2.-fl)+er*.3,d)*amp*mass*(1.-.9*seam)*bub*(1.-.5*LM.w);
    /* пыль: тонкие прожилки-хребты у каждого слоя, у ближнего — ещё и широкая полоса */
    let rid=1.-abs(2.*fb(q*1.6+w2*1.4+vec2f(9.,4.),4)-1.);
    var ab=smoothstep(.8,.9,rid)*dust*(.3+.35*fl)*(.4+.6*smoothstep(.3,.6,d));
    if(L==2){ab=ab+band*(.9+.5*smoothstep(.4,.7,d))*clamp(dust,.6,1.4);}
    /* в окне пыль тоньше — громадину видно целиком, а не клочьями */
    ab=ab*(1.-.6*LM.w);
    /* тон — по области массы, а не по завитку: в одном пикселе один цвет */
    var col=mix(A,B,tone);
    col=mix(col,sc,tint)*(1.+.25*fl);
    /* волокна — самые плотные гребни — светят ярче тела */
    let e=col*g*(.62+1.3*lit)*(.6+1.1*smoothstep(.62,.84,d))*(1.+.8*lit*smoothstep(.55,.9,d));
    let rim=mix(gc,vec3f(1.),.25)*max(sc.r,max(sc.g,sc.b))*lit*ab*.3;
    C=C*exp(-ab*2.6)+e+rim;T=T*exp(-ab*2.6);dsum=dsum+g;
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
  /* громадина — за всеми слоями: её свет прошёл сквозь их пыль (T), её пыль гасит звёзды */
  C=C+LM.e*mix(T,1.,.5);T=T*exp(-LM.a*2.);
  return vec4f(C,1.-T);}`;
/* сведение в полном разрешении. Общая часть: мелкие гребни по течению (волокна и
   зерно), резкие края пыли */
const GNB_FINE=GNB_NOISE+`
fn fineT(p:vec2f,T0:f32)->f32{
  let V=fu.v;let H=fu.res.w;
  let qf=((p-fu.res.zw*.5)+V[0].xy*.09)/H*7.+V[0].w;
  let r=1.-abs(2.*fb(qf*1.9+vec2f(gn(qf*.7),gn(qf*.7+3.3))*1.6,2)-1.);
  /* края полос резче: бикубика из четверти их размыла */
  let Ts=clamp((T0-.5)*1.7+.5,0.,1.);
  return clamp(mix(T0,Ts,.7)*mix(1.12,.86,r*r*smoothstep(.97,.6,T0)),0.,1.);}
fn fineE(p:vec2f)->f32{
  let V=fu.v;let H=fu.res.w;
  let qf=((p-fu.res.zw*.5)+V[0].xy*.09)/H*9.+V[0].w+vec2f(4.,9.);
  let wv=vec2f(gn(qf*.45+V[0].z),gn(qf*.45+vec2f(5.,1.)))*2.2;
  let r=1.-abs(2.*fb(qf+wv,2)-1.);
  return .5+.95*r*r;}`;
const GNB_ABS=GNB_FINE+`
fn field(p:vec2f,uv:vec2f)->vec4f{
  let T=fineT(p,clamp(1.-texCubic(t0,smp,uv).a,0.,1.));
  return vec4f(pow(vec3f(T),vec3f(.72,1.,1.42)),1.);}`;
/* V[0]: камера x,y, время, зерно · V[1]: звезда x,y, радиус/H, вкл · V[2]: цвет звезды, ширина тени ·
   V[3]: цвет теней · V[4..10]: планеты x,y,r (CSS px) — их тени */
const GNB_EMI=GNB_FINE+`
fn field(p:vec2f,uv:vec2f)->vec4f{
  let V=fu.v;let H=fu.res.w;
  var c=max(texCubic(t0,smp,uv).rgb,vec3f(0.));
  let l0=max(c.r,max(c.g,c.b));
  /* тон газа до волокон: тусклый газ окрашивает туман своим цветом */
  let gh0=c/max(l0,1e-4);
  /* волокна: гребни в полном разрешении режут тело газа */
  let body=smoothstep(.015,.14,l0);
  c=c*mix(1.,fineE(p),body*.85);
  /* фронт ионизации: где газ густеет прочь от звезды — это его кромка к звезде */
  let ts=1./vec2f(textureDimensions(t0));
  let lx=textureSampleLevel(t0,smp,uv+vec2f(ts.x*1.5,0.),0.).rgb-textureSampleLevel(t0,smp,uv-vec2f(ts.x*1.5,0.),0.).rgb;
  let ly=textureSampleLevel(t0,smp,uv+vec2f(0.,ts.y*1.5),0.).rgb-textureSampleLevel(t0,smp,uv-vec2f(0.,ts.y*1.5),0.).rgb;
  let gr=vec2f(max(lx.r,max(lx.g,lx.b)),max(ly.r,max(ly.g,ly.b)));
  let dir=normalize(p-V[1].xy+vec2f(1e-3));
  let sd=max(length(p-V[1].xy)/H-V[1].z,0.);let lit=V[1].w/(1.+pow(sd/.2,2.));
  let fr=max(dot(gr,dir),0.)*lit;
  /* тени планет (L1.6): планета между звездой и газом режет свет — за ней по газу
     тёмный клин от звезды, край мягкий и расходится с расстоянием (у звезды есть
     размер), вдали клин тает — газ освещает и рассеянный свет */
  var shd=0.;var ray=0.;
  let toS=V[1].xy-p;let Ls=max(length(toS),1.);let ds=toS/Ls;
  for(var k=0;k<7;k++){let P=V[4+k];if(P.z<=0.){break;}
    let q=P.xy-p;let tq=dot(q,ds);
    if(tq>P.z*.5&&tq<Ls){let dq=length(q-ds*tq);let pen=P.z*.12+tq*.05;
      /* у планеты ×.2, через четыре диаметра ×.6 — туман перед тенью её заполняет */
      let fd=exp(-tq/(P.z*11.5));
      shd=max(shd,(1.-smoothstep(P.z-pen,P.z+pen,dq))*fd);
      /* по краям клина свет чуть ярче — лучи между тенями */
      let e=(dq-P.z-pen)/(pen+P.z*.6);ray=max(ray,exp(-e*e)*select(0.,1.,dq>P.z)*fd);}}
  c=c*(1.-.8*shd)*(1.+.3*ray);
  /* тонкая пыль всюду: свет звезды в ней — лучи, тени планет — тёмные клинья */
  let dl=max(length(p-V[1].xy)/H-V[1].z,0.);
  /* освещённая звездой пыль по всей системе, и в пустотах: ровный тёплый туман (L ~10–15
     на кадре), у самой звезды его нет — там царит её корона; клинья режут и его */
  let wn=lwin(lfr(p,fu.res.z,H,V[1].xy,V[11],V[12],V[0].xy,V[13].w),V[11],V[12])*mix(1.,.3+.7*smoothstep(.02,.22,sd),V[1].w);
  let fog=V[1].w*(.045+.05/(1.+pow(dl/.4,2.)))*smoothstep(.12,.3,dl)*(1.-body)*(1.-.92*wn);
  /* где есть хоть тусклый газ, туман берёт его тон: тёплый туман на бирюзе был серым */
  /* в пустоте туман — цвет звезды, но не бледнее насыщенности .5: бледно-тёплое на
     тёмном читалось серой дымкой */
  let smx=max(V[2].r,max(V[2].g,V[2].b));let sn=mix(V[2].rgb,vec3f(1.,.92,.8)*smx,.35)/smx;
  let sk=.5/max(1.-min(sn.r,min(sn.g,sn.b)),.08);let fs=clamp(1.-(1.-sn)*max(sk,1.),vec3f(0.),vec3f(1.))*smx;
  let fc=mix(fs,gh0*smx,smoothstep(.0003,.004,l0));
  let hue=c/max(l0,1e-3);
  c=c+mix(hue,vec3f(1.),.3)*smoothstep(.02,.16,fr)*fineE(p*1.7)*.55;
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
  return vec4f(c*(1.-exp(-mm*1.25))/(mm*1.25)*1.12,0.);}`;
function gnbTarget(){
  const w=Math.max(2,Math.ceil(GPU.bw/4)),h=Math.max(2,Math.ceil(GPU.bh/4));
  if(GNB.tex&&GNB.dev===GPU.dev&&GNB.w===w&&GNB.h===h)return;
  if(GNB.tex&&GNB.dev===GPU.dev)GPU.trash.push(GNB.tex);
  const U=GPUTextureUsage;
  GNB.tex=GPU.dev.createTexture({size:[w,h],format:"rgba16float",usage:U.TEXTURE_BINDING|U.RENDER_ATTACHMENT});
  GNB.view=GNB.tex.createView();GNB.dev=GPU.dev;GNB.w=w;GNB.h=h;GNB.last=-99;
}
function gnbPipe(){
  const k="gnb.gen|16f";if(GPU.lay[k])return GPU.lay[k];
  const mod=GPU.dev.createShaderModule({code:GNB_GEN});
  return GPU.lay[k]=GPU.dev.createRenderPipeline({layout:"auto",vertex:{module:mod,entryPoint:"vs"},
    fragment:{module:mod,entryPoint:"fs",targets:[{format:"rgba16float"}]},primitive:{topology:"triangle-list"}});
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
  c[11]=pl.sw||.1;c[12]=pl.c[0]/255;c[13]=pl.c[1]/255;c[14]=pl.c[2]/255;
  const moved=Math.hypot(camx-GNB.cx,camy-GNB.cy)*.09;
  if(GNB.sys===sys&&moved<.5&&GPU.frameNo-GNB.last<3&&GPU.frameNo>=GNB.last)return true;
  const a=GNB.U;
  a[0]=GNB.w;a[1]=GNB.h;a[2]=W;a[3]=H;
  a[4]=camx;a[5]=camy;a[6]=c[2];a[7]=c[3];
  a[8]=pl.a[0]/255;a[9]=pl.a[1]/255;a[10]=pl.a[2]/255;a[11]=clamp(st2.dust,.3,1.7);
  a[12]=pl.b[0]/255;a[13]=pl.b[1]/255;a[14]=pl.b[2]/255;a[15]=pl.dens;
  a[16]=st.x;a[17]=st.y;a[18]=st.r;a[19]=st.on;
  a[20]=st.c[0]/255;a[21]=st.c[1]/255;a[22]=st.c[2]/255;a[23]=pl.fill;
  a[28]=lm.x;a[29]=lm.y;a[30]=lm.s;a[31]=lm.t;a[32]=lm.a;a[33]=lm.p;a[34]=lm.l;a[35]=lm.k;
  a[36]=lm.c[0][0];a[37]=lm.c[0][1];a[38]=lm.c[0][2];a[39]=.006;a[40]=lm.c[1][0];a[41]=lm.c[1][1];a[42]=lm.c[1][2];
  const U=GPUBufferUsage,ub=gpuBuf("gnb.u",176,U.UNIFORM|U.COPY_DST);
  GPU.dev.queue.writeBuffer(ub,0,a);
  const P=gnbPipe();
  const p=GPU.enc.beginRenderPass({colorAttachments:[{view:GNB.view,loadOp:"clear",storeOp:"store",clearValue:{r:0,g:0,b:0,a:0}}]});
  p.setPipeline(P);p.setBindGroup(0,gpuBind("gnb.gen",P,[ub]));p.draw(3);p.end();
  GNB.sys=sys;GNB.cx=camx;GNB.cy=camy;GNB.last=GPU.frameNo;
  return true;
}
function gpuNebulaComp(pass){
  if(!GNB.view||GNB.dev!==GPU.dev)return;
  /* сначала пыль гасит и краснит то, что за ней (звёзды, фон), потом газ светит поверх */
  gpuField(pass,"gnb.abs",GNB_ABS,GNB.C,[{view:GNB.view}],{blend:"mul"});
  gpuField(pass,"gnb.emi",GNB_EMI,GNB.C,[{view:GNB.view}],{blend:"add"});
  /* корпуса на ярком газе — силуэтами: общий проход темнит газ вокруг 2D (08b) */
  GPU.sep=.7;
}
