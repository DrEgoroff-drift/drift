/* ══════════════ планеты и луны на видеокарте (G3, docs/DESIGN-gpu.md) ══════════════
   Та же развёртка (07-planet: долгота поперёк, синус широты вдоль) и тот же свет
   от звезды (угол на неё, z .74, k=.16+1.02·l^.85), только шар — формула на пиксель:
   · развёртка наматывается честно: долгота = atan2(nx,nz), а не asin(nx) одной
     полоской на всю высоту — у полюсов 2D растягивал её в полосы;
   · терминатор мягкий там, где есть воздух (рассеяние), и резкий у безвоздушных;
     ночь — не серая, а холодная и тёмная;
   · атмосфера светится и за краем диска, только с дневной стороны, цветом неба —
     вместо ровного голубого обвода r+2.5 у каждой не-скалы;
   · кольца — полоса в своей плоскости с тонкими щелями; планета бросает тень на
     кольцо, кольцо — на планету;
   · луны — освещённые шары со своим терминатором, а не плоские серые кружки. */
const GPL={A:new Float32Array(24),U:new Float32Array(8)};
const GPL_WGSL=`
struct U{a:vec4f,b:vec4f};
@group(0) @binding(0) var<uniform> u:U;
@group(0) @binding(1) var<storage,read> pb:array<vec4f,6>;
@group(0) @binding(2) var smp:sampler;
@group(0) @binding(3) var tx:texture_2d<f32>;
struct VO{@builtin(position) p:vec4f};
@vertex fn vs(@builtin(vertex_index) vi:u32)->VO{
  var c=array(vec2f(-1.,-1.),vec2f(1.,-1.),vec2f(1.,1.),vec2f(-1.,-1.),vec2f(1.,1.),vec2f(-1.,1.));
  let v0=pb[0];let v4=pb[4];
  let e=v0.z*max(1.2,select(1.,v4.y*1.05,v4.w>0.))+3.;
  let q=(v0.xy+c[vi]*e)*u.b.x;
  var o:VO;o.p=vec4f(q.x/u.a.x*2.-1.,1.-q.y/u.a.y*2.,0.,1.);return o;}
fn h1(x:f32)->f32{return fract(sin(x*127.1)*43758.5453);}
fn over(acc:vec4f,s:vec4f)->vec4f{return s+acc*(1.-s.a);}
/* кольцо в точке P своей плоскости: радиус в долях r → цвет и прозрачность */
fn ring(rho:f32,v4:vec4f,v5:vec4f,px:f32)->vec4f{
  let ri=v4.x;let ro=v4.y;let n=max(v5.w,1.);
  if(rho<ri-.02||rho>ro+.02){return vec4f(0.);}
  let f=(rho-ri)/(ro-ri);let b=clamp(floor(f*n),0.,n-1.);
  let hb=h1(v4.z+b*7.31);
  var a=.06+hb*.16;
  /* тонкие щели и завитки внутри полосы — вместо ровной обводки */
  let fine=.8+.2*sin(rho*211.+hb*6.)*sin(rho*67.+v4.z);
  let gap=smoothstep(.0,.06,abs(fract(f*n)-.5)*2.-.0);
  a=a*fine*mix(.55,1.,gap)*smoothstep(ri-.02,ri+.03,rho)*(1.-smoothstep(ro-.03,ro+.02,rho));
  let col=vec3f(190.+hb*50.,172.+h1(hb*9.)*46.,146.+h1(hb*3.)*54.)/255.;
  return vec4f(col*a*2.3,min(a*2.3,1.));
}
@fragment fn fs(i:VO)->@location(0) vec4f{
  let v0=pb[0];let v1=pb[1];let v2=pb[2];let v3=pb[3];let v4=pb[4];let v5=pb[5];
  let q=i.p.xy/u.b.x;let r=v0.z;let d=(q-v0.xy)/r;let px=1./(u.b.x*r);
  let L=normalize(vec3f(v1.x*.67,v1.y*.67,.74));
  let r2=dot(d,d);let len=sqrt(r2);
  var sph=vec4f(0.);var nz=-1.;
  let rimK=v1.w;let air=select(0.,1.,rimK>0.);
  if(len<1.+px){
    nz=sqrt(max(0.,1.-r2));let n=vec3f(d,nz);
    var base=v3.rgb;
    if(v0.w<.5){
      let u0=atan2(n.x,n.z)/6.2831853+v1.z;let vv=(n.y+1.)*.5;
      base=textureSampleLevel(tx,smp,vec2f(fract(u0),clamp(vv,.002,.998)),0.).rgb;
    }else{
      /* луна: старая серость, но с оспинами кратеров */
      let c=fract(sin(dot(floor(d*5.+v2.w),vec2f(12.9898,78.233)))*43758.5453);
      base=base*(.86+.18*c);
    }
    let dl=dot(n,L);
    /* терминатор: с воздухом — мягкий, рассеянный; без — резкий */
    let w=mix(.02,.14,air);
    let l=clamp((dl+w)/(1.+w),0.,1.);
    let k=.1+1.08*pow(l,.85);
    /* звезда тонирует свет, а не красит планету своим цветом целиком */
    let sun=mix(vec3f(1.),v5.rgb,.25);
    var col=base*k*sun;
    /* ночь холодная, а не серая */
    col=col+base*vec3f(.03,.04,.07)*(1.-l);
    /* ободок: рассеяние по краю, днём */
    let rim=pow(1.-nz,3.)*rimK*smoothstep(-.25,.35,dl);
    col=col+v2.rgb*rim;
    /* тень кольца на диске: луч к звезде пересекает плоскость кольца */
    if(v4.w>0.){
      let t=v4.w;let N=vec3f(0.,sqrt(1.-t*t),-t);let dn=dot(L,N);
      if(abs(dn)>1e-3){let s=-dot(n,N)/dn;
        if(s>0.){let P=n+L*s;let rg=ring(length(P),v4,v5,px);col=col*(1.-rg.a*.85);}}
    }
    let cov=clamp((1.-len)/px+.5,0.,1.);
    sph=vec4f(col*cov,cov);
  }
  /* атмосфера за краем диска — только с дневной стороны */
  var halo=vec3f(0.);
  if(len>=1.-px&&rimK>0.){
    let hw=.05+.05*rimK;let x=(len-1.)/hw;
    let day=smoothstep(-.3,.5,dot(d/len,normalize(L.xy)));
    halo=v2.rgb*rimK*.8*exp(-max(x,0.)*2.2)*day*step(-1.,x);
  }
  var acc=vec4f(halo,0.);
  if(v4.w>0.){
    let t=v4.w;let st=sqrt(1.-t*t);
    let rho=length(vec2f(d.x,d.y/t));let zr=d.y/t*st;
    var rg=ring(rho,v4,v5,px);
    /* тень планеты на кольце: луч от точки кольца к звезде задевает шар */
    let P=vec3f(d.x,d.y,zr);let b=dot(P,L);let cc=dot(P,P)-1.;let disc=b*b-cc;
    if(b<0.&&disc>0.){rg=vec4f(rg.rgb*(1.-smoothstep(0.,.04,disc)*.85),rg.a);}
    let lit=.55+.45*clamp(abs(L.z),0.,1.);
    rg=vec4f(rg.rgb*lit*mix(vec3f(1.),v5.rgb,.25),rg.a);
    if(zr>nz){acc=over(over(acc,sph),rg);}else{acc=over(over(acc,rg),sph);}
  }else{acc=over(acc,sph);}
  return acc;
}`;
/* одно тело в кадре: x,y,r — экранные; tex — развёртка или null; o — свет и кольцо */
function gplBody(pass,key,x,y,r,tex,o){
  const a=GPL.A;a.fill(0);
  a[0]=x;a[1]=y;a[2]=r;a[3]=tex?0:1;
  a[4]=o.sx;a[5]=o.sy;a[6]=o.turn||0;a[7]=o.rimK||0;
  a[8]=o.rim[0]/255;a[9]=o.rim[1]/255;a[10]=o.rim[2]/255;a[11]=o.seed||0;
  a[12]=o.base[0]/255;a[13]=o.base[1]/255;a[14]=o.base[2]/255;
  const R=o.ring;if(R){a[16]=R.i;a[17]=R.o;a[18]=(R.s%997)*.013;a[19]=R.tilt;a[23]=R.n;}
  a[20]=o.sun[0];a[21]=o.sun[1];a[22]=o.sun[2];
  const U=GPUBufferUsage,d=GPU.dev;
  const ub=gpuBuf("gpl.u",32,U.UNIFORM|U.COPY_DST);
  const u=GPL.U;u[0]=GPU.bw;u[1]=GPU.bh;u[2]=W;u[3]=H;u[4]=DPR;d.queue.writeBuffer(ub,0,u);
  const sb=gpuBuf("gpl.b."+key,96,U.STORAGE|U.COPY_DST);d.queue.writeBuffer(sb,0,a);
  const P=gpuPipe("gpl",GPL_WGSL,"over");
  const tv=tex?gpuCanvasTex(tex).view:(GPU.nView||(GPU.nView=GPU.N.createView()));
  pass.setPipeline(P);pass.setBindGroup(0,gpuBind("gpl."+key,P,[ub,sb,GPU.S.lin,tv]));pass.draw(6);
}
/* свет звезды — нормированный по светлоте, как в planetLight */
function gplSun(){
  const c=(typeof starRGB==="function")?starRGB():[255,244,214],m=Math.max(1,c[0],c[1],c[2]);
  return [c[0]/m,c[1]/m,c[2]/m];
}
/* планета системы: развёртка печётся тем же порядком (07), свет и кольцо — здесь */
function gpuPlanet(p,x,y,r){
  const pass=gpuScene();if(!pass)return;
  const lvl=r>150?2:(r>60?1:0);
  const S=planetStrip(p,lvl);
  planetStripTick();
  if(typeof matTick==="function")matTick();
  const gas=p.type==="gas",airless=!gas&&!!(p.T&&p.T.atm==="отсутствует");
  const sk=(p.T&&((gas&&p.T.pal&&p.T.pal[p.T.pal.length-1])||(p.T.sky&&p.T.sky[0])))||[130,180,210];
  const pal=p.T.pal,bc=pal[Math.min(pal.length-1,pal.length>>1)];
  /* направление на звезду — тем же planetSunRot, что проверяет 91zzzb-bio */
  const sa=PLANET_BAKE_ANG+planetSunRot(p);
  gplBody(pass,"p"+(p.idx|0),x,y,r,S,{sx:Math.cos(sa),sy:Math.sin(sa),turn:planetSpin(p)/TAU,
    rimK:airless?0:(gas?.5:.34),rim:[lerp(sk[0],255,.35),lerp(sk[1],255,.35),lerp(sk[2],255,.35)],
    base:bc,ring:(p.ring&&r>5)?p.ring:null,sun:gplSun(),seed:p.seed%97});
}
/* луна: освещённый шар; свет — от звезды, как у её планеты */
function gpuMoon(m,key,x,y,r){
  const pass=gpuScene();if(!pass)return;
  const dx=-(m.x||0),dy=-(m.y||0),dl=Math.hypot(dx,dy)||1;
  gplBody(pass,"m"+key,x,y,Math.max(1.2,r),null,{sx:dx/dl,sy:dy/dl,rimK:0,rim:[0,0,0],
    base:[154,168,178],sun:gplSun(),seed:(m.seed||key.length*13)%97});
}
