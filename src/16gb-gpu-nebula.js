/* ══════════════ туманность системы объёмом (L1, docs/DESIGN-gpu.md) ══════════════
   Была: 2D печёт тайл 256² раз на систему, растягивает на весь экран, шейдер 16g
   добавлял ей нити. Мыльно, плоско, и звезда её не освещала — зарево держал только
   мягкий круг 17g. Теперь туманность считается целиком на видеокарте:
   · три слоя на разной глубине (свой параллакс у каждого), форма — FBM с двойным
     искривлением пространства (domain warp): жгуты, завитки, рваные кромки;
   · газ светится (эмиссия) и поглощает: тёмные пылевые прожилки ложатся ПОВЕРХ
     звёзд и гасят их, а не рисуются серой краской;
   · звезда системы освещает газ: ближе к ней ярче и теплее; её зарево — рассеяние
     в газе и пыли, поэтому у него есть структура, а прожилки режут его;
   · всё медленно течёт.
   Цена: считается в четверть разрешения кадра (текстура rgba16f, без ступеней в
   тёмном), пересчёт — когда камера сдвинулась или раз в три кадра; на экран
   ложится двумя полноэкранными проходами с бикубикой (поглощение, свечение).
   Цвета — gnbPalette: у каждой системы своя пара тонов по кругу и своя тень. */
const GNB={tex:null,view:null,dev:null,w:0,h:0,last:-99,cx:1e9,cy:1e9,sys:null,U:new Float32Array(28)};
const GNB_GEN=`
struct NU{a:vec4f,b:vec4f,c:vec4f,d:vec4f,e:vec4f,f:vec4f,g:vec4f};
@group(0) @binding(0) var<uniform> u:NU;
struct VO{@builtin(position) p:vec4f,@location(0) uv:vec2f};
@vertex fn vs(@builtin(vertex_index) i:u32)->VO{
  var P=array(vec2f(-1.,-1.),vec2f(3.,-1.),vec2f(-1.,3.));
  var o:VO;o.p=vec4f(P[i],0.,1.);o.uv=vec2f(P[i].x*.5+.5,.5-P[i].y*.5);return o;}
fn gh(p:vec2f)->f32{var q=fract(vec3f(p.xyx)*.1031);q=q+dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
fn gn(p:vec2f)->f32{let i=floor(p);let f=fract(p);let w=f*f*(3.-2.*f);
  return mix(mix(gh(i),gh(i+vec2f(1.,0.)),w.x),mix(gh(i+vec2f(0.,1.)),gh(i+vec2f(1.,1.)),w.x),w.y);}
fn fb(p0:vec2f,n:i32)->f32{var p=p0;var s=0.;var a=.5;var m=0.;
  for(var k=0;k<n;k++){s=s+a*gn(p);m=m+a;p=mat2x2f(1.6,1.2,-1.2,1.6)*p+vec2f(3.1,7.7);a=a*.5;}
  return s/m;}
/* пыль ест синий сильнее красного: что за полосой — тусклее и краснее */
const RED=vec3f(.72,1.,1.42);
@fragment fn fs(i:VO)->@location(0) vec4f{
  let W=u.a.z;let H=u.a.w;let p=i.uv*vec2f(W,H);
  let t=u.b.z;let seed=u.b.w;
  let A=u.c.rgb;let dust=u.c.w;let B=u.d.rgb;let dens0=u.d.w;
  let sp=u.e.xy;let rr=max(u.e.z/H,.012);let son=u.e.w;let sc=u.f.rgb;let fill=u.f.w;
  let Cc=u.g.rgb;
  /* освещённость от звезды: мягкий закон 1/(1+r²) от края диска, а не от центра —
     у гиганта и у карлика свет спадает по кадру одинаково */
  let sd=max(length(p-sp)/H-rr,0.);
  let lit=son/(1.+pow(sd/.2,2.));
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
    /* макро: газ лежит массами, между ними пустота — кадр из 2–3 пятен, не сплошная
       пелена; внутри эмиссионной туманности (fill) газ кроет весь кадр */
    let mass=smoothstep(.5-.4*fill,.7-.3*fill,fb(q*.3+vec2f(fl*3.7,1.1),3));
    /* дальний слой мягче (широкий порог), ближний контрастнее */
    let g=smoothstep(.46-.06*(2.-fl)-.12*fill,.76+.07*(2.-fl),d)*amp*mass;
    /* пыль: хребты шума — тонкие тёмные прожилки, у ближнего слоя гуще */
    let rid=1.-abs(2.*fb(q*1.6+w2*1.4+vec2f(9.,4.),4)-1.);
    let ab=smoothstep(.74,.96,rid)*dust*(.35+.4*fl)*(.4+.6*smoothstep(.3,.6,d));
    /* цвет: два тона системы по завиткам; тень газа — третий, холодный (или свой у
       монохромной системы); к звезде — её цветом */
    /* FBM держится у .5 — порог узкий, иначе два тона смешиваются в серо-бурое */
    var col=mix(A,B,smoothstep(.45,.57,w2.x+(w.y-.5)*.6));
    col=mix(col,Cc,clamp((.75-.2*fl)*(1.-lit*1.8)*(1.-smoothstep(.55,.85,d)),0.,1.));
    col=mix(col,sc,clamp(lit*.6,0.,.5));
    /* самое светлое в газе — край, обращённый к звезде */
    /* волокна — самые плотные гребни — светят ярче тела: газ читается жгутами, а не дымом */
    let e=col*g*(.62+1.3*lit)*(.6+1.1*smoothstep(.62,.84,d))*(1.+.8*lit*smoothstep(.55,.9,d));
    /* пыль у звезды подсвечена по краю — тёмное с тёплой кромкой */
    let rim=sc*lit*ab*.35;
    let tr=exp(-ab*2.6*RED);
    C=C*tr+e+rim;T=T*exp(-ab*2.6);dsum=dsum+g;
  }
  /* зарево звезды — рассеяние: по плотности газа (гуще — ярче), тесное ядро у
     диска ровное; прожилки ближнего слоя режут его на полосы */
  let core=.55*exp(-sd/.05)+.25*exp(-sd/.3);
  let wide=.35*exp(-sd/.3)+.12*exp(-sd/1.2);
  C=C+sc*son*(core+wide*1.6*dsum)*mix(1.,T,.6);
  return vec4f(C,1.-T);}`;
/* композиция: четверть кадра — на весь экран бикубикой, тон по наибольшему каналу
   (оттенок не белеет), поглощение — альфой: звёзды под прожилками гаснут */
const GNB_ABS=`
fn field(p:vec2f,uv:vec2f)->vec4f{
  let T=clamp(1.-texCubic(t0,smp,uv).a,0.,1.);
  return vec4f(pow(vec3f(T),vec3f(.72,1.,1.42)),1.);}`;
const GNB_EMI=`
fn field(p:vec2f,uv:vec2f)->vec4f{
  let c=max(texCubic(t0,smp,uv).rgb,vec3f(0.));
  let m=max(max(c.r,c.g),max(c.b,1e-4));
  return vec4f(c*(1.-exp(-m*1.25))/(m*1.25)*1.12,0.);}`;
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
   трогает. Тона по кругу с разносом, тень — третьим, холодным; у гиганта — янтарный
   монохром, у горячих — лёд и индиго, у дыры — выцветший с оранжевым акцентом.
   Одна система из пяти — внутри яркой эмиссионной туманности: газ кроет весь кадр,
   корпуса на нём — силуэтами */
const GNB_PAL=[
  {a:[236,112,58],b:[36,150,178],c:[22,44,104]},    // оранж + бирюза
  {a:[206,58,164],b:[64,186,118],c:[34,26,98]},     // маджента + зелень
  {a:[150,86,214],b:[232,86,118],c:[24,40,118]},    // фиолет + роза
  {a:[112,186,255],b:[84,70,214],c:[16,26,84]},     // лёд + индиго
  {a:[255,166,72],b:[214,92,40],c:[46,20,70]},      // янтарь, монохром; тени — слива, не бурое
  {a:[176,168,160],b:[120,116,124],c:[30,30,40]}];  // выцветший (дыра)
function gnbPalette(sys){
  if(sys.gnbPal)return sys.gnbPal;
  const r=rng((sys.seed^0x4E42)>>>0),k=sysStyle(sys).kind;
  const hot=/^#[89a-f]/i.test(sys.cls.col)&&parseInt(sys.cls.col.slice(5,7),16)>200;
  let i=k==="giant"?4:k==="hole"?5:(k==="dwarf"||k==="neutron"||hot)?3:(r()*3)|0;
  if(r()<.2&&k!=="hole")i=(i+1+((r()*3)|0))%5;
  const fill=r()<.2?1:0;
  return sys.gnbPal=Object.assign({fill,dens:fill?1.3:1},GNB_PAL[i]);
}
/* светило для туманности: место на экране, радиус, цвет по виду звезды */
function gnbStar(sys,ox,oy,R){
  const k=sysStyle(sys).kind;
  if(k==="hole")return {x:ox,y:oy,r:R,on:.35,c:hex2rgb("#ffb070")};
  const col=k==="giant"?"#ff7448":k==="dwarf"?"#e8f4ff":k==="neutron"?"#bfe0ff":sys.cls.col;
  return {x:ox,y:oy,r:k==="giant"?R*1.85:k==="dwarf"?R*.6:R,on:1,c:hex2rgb(col)};
}
/* пересчёт в четверть кадра — отдельным проходом ДО прохода сцены. cam — камера в
   пикселях CSS (cx0*Z), st — gnbStar */
function gpuNebulaGen(sys,camx,camy,st){
  if(!GPU.on||!GPU.enc||GPU.scenePass||GPU.overPass)return false;
  gnbTarget();
  const moved=Math.hypot(camx-GNB.cx,camy-GNB.cy)*.09;
  if(GNB.sys===sys&&moved<.5&&GPU.frameNo-GNB.last<3&&GPU.frameNo>=GNB.last)return true;
  const st2=sysStyle(sys),pl=gnbPalette(sys),a=GNB.U;
  a[0]=GNB.w;a[1]=GNB.h;a[2]=W;a[3]=H;
  a[4]=camx;a[5]=camy;a[6]=(G.t||0)*.0004;a[7]=(st2.nseed%997)*.013;
  a[8]=pl.a[0]/255;a[9]=pl.a[1]/255;a[10]=pl.a[2]/255;a[11]=clamp(st2.dust,.3,1.7);
  a[12]=pl.b[0]/255;a[13]=pl.b[1]/255;a[14]=pl.b[2]/255;a[15]=pl.dens;
  a[16]=st.x;a[17]=st.y;a[18]=st.r;a[19]=st.on;
  a[20]=st.c[0]/255;a[21]=st.c[1]/255;a[22]=st.c[2]/255;a[23]=pl.fill;
  a[24]=pl.c[0]/255;a[25]=pl.c[1]/255;a[26]=pl.c[2]/255;
  const U=GPUBufferUsage,ub=gpuBuf("gnb.u",112,U.UNIFORM|U.COPY_DST);
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
  gpuField(pass,"gnb.abs",GNB_ABS,null,[{view:GNB.view}],{blend:"mul"});
  gpuField(pass,"gnb.emi",GNB_EMI,null,[{view:GNB.view}],{blend:"add"});
}
