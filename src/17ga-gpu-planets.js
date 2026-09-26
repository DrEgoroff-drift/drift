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
   · луны — освещённые шары со своим терминатором, а не плоские серые кружки.
   G3b — вблизи развёртка остаётся крупным масштабом, а средний и мелкий дают:
   · рельеф из объёмного шума на вращающемся шаре: склоны к звезде светлее,
     гребни уходят в верхний цвет палитры, лощины — в нижний (свой у каждого биома);
     проступает, только когда тексель развёртки крупнее пикселя — издали не рябит;
   · вода (землеподобная, океан) — там, где развёртка синее зелени, и на ней мягкий
     блик звезды; рельефа у воды нет;
   · облака у планет с воздухом — свой слой, плывёт медленнее суток, край мягкий,
     тень на грунте сдвинута от звезды;
   · огни построек (planetLightsN) — города на ночной суше, а не кружки поверх диска;
   · у терминатора воздух теплеет: закатная полоса на грунте и облаках, рыжий край. */
/* A: 16 vec4 тела + 48 огней (pb[16..63]: x,y в долях радиуса, вес) */
const GPL={A:new Float32Array(256),U:new Float32Array(8)};
/* отметка воды на высоте развёртки (доля палитры): ниже — море с бликом */
const GPL_SEA={terran:.27,ocean:.8};
/* облачность и оттенок облаков по типу: доля неба и сколько в них цвета воздуха */
const GPL_CLOUD={terran:[.34,.12],ocean:[.5,.1],jungle:[.52,.18],ice:[.26,.1],desert:[.1,.35],
  volcanic:[.3,.5],toxic:[.46,.6],crystal:[.12,.3],ruin:[.16,.3]};
const GPL_WGSL=`
struct U{a:vec4f,b:vec4f};
@group(0) @binding(0) var<uniform> u:U;
@group(0) @binding(1) var<storage,read> pb:array<vec4f,64>;
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
fn hs3(p:vec3f)->f32{var q=fract(p*vec3f(.1031,.103,.0973));q=q+dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
fn vn3(p:vec3f)->f32{
  let i=floor(p);let f=fract(p);let w=f*f*(3.-2.*f);
  let a=mix(mix(hs3(i),hs3(i+vec3f(1.,0.,0.)),w.x),mix(hs3(i+vec3f(0.,1.,0.)),hs3(i+vec3f(1.,1.,0.)),w.x),w.y);
  let b=mix(mix(hs3(i+vec3f(0.,0.,1.)),hs3(i+vec3f(1.,0.,1.)),w.x),mix(hs3(i+vec3f(0.,1.,1.)),hs3(i+vec3f(1.,1.,1.)),w.x),w.y);
  return mix(a,b,w.z);}
fn fb3(p:vec3f,o:i32)->f32{
  var s=0.;var a=.5;var t=0.;var q=p;
  for(var k=0;k<o;k++){s=s+a*vn3(q);t=t+a;q=q*2.03+vec3f(1.7,9.2,3.1);a=a*.5;}
  return s/t;}
/* палитра тела (pb[10..15], число отрезков в pb[10].w): высота → цвет и обратно — ближайшая
   точка ломаной палитры. Так средний и мелкий слой продолжают ту же развёртку, её же цветами */
fn palAt(t:f32)->vec3f{
  let np=pb[10].w;let x=clamp(t,0.,.9999)*np;let i=u32(x);
  return mix(pb[10u+i].rgb,pb[10u+min(i+1u,u32(np))].rgb,x-f32(i));}
fn palV(c:vec3f)->vec2f{
  let np=u32(pb[10].w);var bd=1e9;var bv=0.;
  for(var i=0u;i<np;i++){let a=pb[10u+i].rgb;let ab=pb[11u+i].rgb-a;
    let t=clamp(dot(c-a,ab)/max(dot(ab,ab),1e-6),0.,1.);let dd=length(c-a-ab*t);
    if(dd<bd){bd=dd;bv=(f32(i)+t)/f32(np);}}
  return vec2f(bv,bd);}
/* газ: полосы плывут каждая со своей скоростью (сдвиг на границах), границы волнистые —
   развёртку читаем сквозь вихревое поле (ротор шума: завитки без разрывов), и 1–3 овала-шторма
   закручивают цвета самих полос. u — обороты, y — синус широты; шум — на сфере, без шва */
fn gpsi(uq:f32,y:f32,so:vec3f,t:f32)->f32{
  let c=sqrt(max(1.-y*y,0.));let a=6.2831853*uq;
  return fb3(vec3f(c*sin(a)*4.,y*24.+t*.0003,c*cos(a)*4.)+so,2);}
fn gasUV(u0:f32,y:f32,so:vec3f,t:f32,am:f32)->vec3f{
  let la=asin(clamp(y,-1.,1.));
  let sp=.000022*sin(la*7.+so.x)+.00001*sin(la*13.+so.y);
  var uq=u0+t*sp;var v=y;
  /* штормы — по чистой развёртке: вихревой сдвиг вдоль полос шире самого овала и рвал его в нитки */
  var gl=0.;var ms=0.;
  /* 2–3 шторма вразброс по долготе — с любой стороны виден хоть один */
  let ns=2+i32(h1(so.x*3.1+.2)*1.99);
  for(var i=0;i<ns;i++){
    let fi=f32(i);
    let yc=(h1(so.y+fi*7.1)-.5)*1.1;let lc0=asin(yc);
    let lc=(fi+.35*h1(so.z*1.3+fi*2.7))/f32(ns)+t*(.000022*sin(lc0*7.+so.x)+.00001*sin(lc0*13.+so.y));
    /* rx в оборотах, ry в синусе широты: ry=rx·π·(.8…1.1) — овал вдвое шире высоты */
    let rx=.022+.028*h1(fi*5.3+so.x);let ry=rx*3.1416*(.8+.3*h1(fi*3.9+so.z));
    let dx=(fract(uq-lc+.5)-.5)/rx;let dy=(v-yc)/ry;let q2=dx*dx+dy*dy;
    if(q2<6.){
      let an=3.2*exp(-q2*1.1)*select(-1.,1.,h1(fi+so.y)>.5)+t*.002*exp(-q2);
      let cs=cos(an);let sn=sin(an);
      let rx2=dx*cs-dy*sn;let ry2=dx*sn+dy*cs;
      /* ядро шторма поднимает цвет соседней полосы — овал читается своим тоном, без контура */
      let kc=exp(-q2*1.6)*.85;
      uq=lc+rx2*rx;v=mix(yc+ry2*ry,yc+.07*select(-1.,1.,h1(fi*1.7+so.z)>.5)+ry2*ry*.15,kc);
      gl=gl+exp(-q2*2.2)-.5*exp(-pow(q2-1.3,2.)*3.);
      ms=max(ms,exp(-q2*.45));
    }
  }
  let e=.0015;let p0=gpsi(uq,v,so,t);
  let pu=gpsi(uq+e,v,so,t);let pv=gpsi(uq,v+e,so,t);
  /* вихрь стихает внутри шторма — овал держит форму, вокруг него полосы рвутся */
  let A=.0022*(.5+.5*am)*(1.-ms);
  /* вдоль полос тянет сильно, поперёк — чуть: полосы остаются полосами */
  uq=uq+(pv-p0)/e*A*1.2;v=v-(pu-p0)/e*A*.2;
  /* мелкие волны на кромках полос */
  v=v+.004*am*(1.-ms)*(fb3(vec3f(sin(6.2831853*uq)*20.,v*90.,cos(6.2831853*uq)*20.)+so*2.,2)-.5);
  return vec3f(uq,v,gl);}
/* точка экрана на шаре → точка на поверхности, которая вращается вместе с развёрткой */
fn rotY(v:vec3f,a:f32)->vec3f{let c=cos(a);let s=sin(a);return vec3f(v.x*c+v.z*s,v.y,-v.x*s+v.z*c);}
/* гребни: хребты линиями, а не ровная рябь */
fn rg3(p:vec3f,o:i32)->f32{
  var s=0.;var a=.5;var t=0.;var q=p;
  for(var k=0;k<o;k++){let x=2.*vn3(q)-1.;let v=1.-sqrt(x*x+.015);s=s+a*v*v;t=t+a;q=q*2.07+vec3f(4.1,2.3,7.7);a=a*.5;}
  return s/t;}
/* высота: пологие холмы везде, хребты — поясами (крупная маска), изогнутыми;
   вблизи — мелкий слой */
fn hgt(b:vec3f,so:vec3f,af:f32)->f32{
  let mt=smoothstep(.5,.7,fb3(b*1.8+so+vec3f(3.,1.,7.),3));
  let wq=vec3f(fb3(b*4.+so,2),fb3(b*4.+so+vec3f(8.,2.,5.),2),fb3(b*4.+so+vec3f(1.,9.,3.),2))-.5;
  let hm=.42+.5*(fb3(b*8.+so,3)-.5);
  /* мелкий слой — шершавость гор: в низинах гладко, на хребтах и высотах грубо */
  let rgh=max(mt,smoothstep(.44,.6,hm));
  return hm+mt*.5*(rg3(b*14.+wq*1.6+so*1.3,3)-.3)+.16*af*rgh*(fb3(b*48.+so*1.7,3)-.5);}
/* облака: широтные гряды с завихрениями; порог — пологий склон, а не обрез */
fn cld(b:vec3f,so:vec3f,cv:f32,af:f32)->f32{
  let wq=vec3f(fb3(b*2.2+so,3),fb3(b*2.2+so+vec3f(5.2,1.3,2.8),3),fb3(b*2.2+so+vec3f(2.9,7.1,.4),3))-.5;
  let c=fb3(b*vec3f(3.,5.5,3.)+wq*1.6+so*.5,5);
  /* край объедается мелким шумом — рваный и прозрачный, без обреза */
  let e=.2*(fb3(b*vec3f(14.,22.,14.)+wq*3.+so,3)-.5)+.08*af*(fb3(b*52.+so,2)-.5);
  return smoothstep(.6-cv*.3,.8-cv*.3,c+e);}
/* кольцо в точке P своей плоскости: радиус в долях r → цвет и прозрачность; dr — шаг rho на пиксель.
   Что мельче пикселя (полоса, завиток, щель), гаснет в среднее, а не мелькает строкой */
fn ring0(rho:f32,v4:vec4f,v5:vec4f,dr:f32)->vec4f{
  let ri=v4.x;let ro=v4.y;let n=max(v5.w,1.);
  if(rho<ri-.02||rho>ro+.02){return vec4f(0.);}
  let f=(rho-ri)/(ro-ri);let b=clamp(floor(f*n),0.,n-1.);
  let kb=clamp((ro-ri)/n/dr-.7,0.,1.);let hb=mix(.5,h1(v4.z+b*7.31),kb);
  var a=.06+hb*.16;
  /* тонкие щели и завитки внутри полосы — вместо ровной обводки */
  let fine=.8+.2*clamp((.0298/dr-1.)*.7,0.,1.)*sin(rho*211.+hb*6.)*sin(rho*67.+v4.z);
  let gw=max(.06,.6*n*dr/(ro-ri));
  let gap=mix(.94,mix(1.,smoothstep(0.,gw,abs(fract(f*n)-.5)*2.),min(1.,.1/gw)),kb);
  a=a*fine*mix(.55,1.,gap)*smoothstep(ri-.02,ri+.03,rho)*(1.-smoothstep(ro-.03,ro+.02,rho));
  let col=vec3f(190.+hb*50.,172.+h1(hb*9.)*46.,146.+h1(hb*3.)*54.)/255.;
  return vec4f(col*a*2.3,min(a*2.3,1.));
}
/* пиксель кольца — среднее четырёх отсчётов поперёк: сжатое к ребру кольцо давало ровные строки,
   как развёртка; что крупнее пикселя, держит контраст */
fn ring(rho:f32,v4:vec4f,v5:vec4f,dr:f32)->vec4f{
  return .25*(ring0(rho-.375*dr,v4,v5,dr)+ring0(rho-.125*dr,v4,v5,dr)+ring0(rho+.125*dr,v4,v5,dr)+ring0(rho+.375*dr,v4,v5,dr));
}
@fragment fn fs(i:VO)->@location(0) vec4f{
  let v0=pb[0];let v1=pb[1];let v2=pb[2];let v3=pb[3];let v4=pb[4];let v5=pb[5];
  let v6=pb[6];let v7=pb[7];let v8=pb[8];let v9=pb[9];
  let q=i.p.xy/u.b.x;let r=v0.z;let d=(q-v0.xy)/r;let px=1./(u.b.x*r);
  let L=normalize(vec3f(v1.x*.67,v1.y*.67,.74));
  let r2=dot(d,d);let len=sqrt(r2);
  var sph=vec4f(0.);var nz=-1.;
  let rimK=v1.w;let air=select(0.,1.,rimK>0.);
  let kind=v3.w;let t=u.b.y;
  /* закатная полоса: свет у терминатора проходит длинный путь в воздухе */
  let warm=vec3f(1.,.56,.36);
  if(len<1.+px){
    nz=sqrt(max(0.,1.-r2));let n=vec3f(d,nz);
    let th=6.2831853*v1.z;let B=rotY(n,th);
    let so=vec3f(v2.w*1.37,v2.w*.71,v2.w*2.13);
    /* сколько пикселей в текселе развёртки: вблизи проступают средний и мелкий слой */
    let tpx=6.2831853*r*u.b.x/max(v9.y,1.);
    /* у лимба шар сжат — слой гаснет раньше, чем начнёт рябить */
    let am=smoothstep(.8,3.,tpx*sqrt(nz));let af=smoothstep(3.,12.,tpx*nz);
    var base=v3.rgb;
    if(v0.w<.5){
      let u0=atan2(n.x,n.z)/6.2831853+v1.z;let vv=(n.y+1.)*.5;
      /* вблизи развёртку читаем сквозь изгиб шума в пару текселей — берег и край
         леса становятся изрезанными, а не размытыми; и лёгкая резкость против мыла */
      let te=vec2f(1.,2.)/max(v9.y,1.);
      let wp=(vec2f(fb3(B*18.+so,3),fb3(B*18.+so+vec3f(4.,7.,1.),3))-.5)*te*2.4*am;
      var uu=u0+wp.x;var yy=n.y;var gz=0.;
      var jt=0.;
      if(kind>1.5){let g=gasUV(u0,n.y,so,t,am);uu=g.x;yy=g.y;gz=g.z;
        /* G3b: тонкие струи вдоль потока — шум длинный по долготе и частый по широте, на уже
           закрученных координатах (идёт за вихрем); сдвигает выборку поперёк полос — струя несёт
           цвет соседней полосы. Каждая октава гаснет, когда её шаг уже 2.5 px: издали не рябит */
        let rp=r*u.b.x;let cu=6.2831853*uu;let cs=sqrt(max(1.-yy*yy,0.));
        let j1=fb3(vec3f(cs*sin(cu)*3.,yy*26.,cs*cos(cu)*3.)+so*3.,2)-.5;
        let j2=fb3(vec3f(cs*sin(cu)*7.,yy*70.,cs*cos(cu)*7.)+so*5.,2)-.5;
        jt=j1*smoothstep(2.,4.,rp/26.)+.8*j2*smoothstep(2.,4.,rp/70.);}
      let uv=vec2f(fract(uu),clamp((yy+1.)*.5+wp.y+jt*14./max(v9.y,1.),.002,.998));
      base=textureSampleLevel(tx,smp,uv,0.).rgb*(1.+.18*gz)*(1.+.45*jt);
    }
    let dl=dot(n,L);
    /* терминатор: с воздухом — мягкий, рассеянный; без — резкий */
    let w=mix(.02,.14,air);
    var wm=0.;var nn=n;
    if(kind<1.5){
      let tx0=normalize(vec3f(n.z+1e-5,0.,-n.x));let ty0=cross(n,tx0);
      let e=.004;
      let h0=hgt(B,so,af);
      /* высота развёртки по палитре + средний и мелкий слой → снова в палитру; у
         вспаханной жизнью зелени (далеко от ломаной) прибавка слабее. Вода — ниже
         своей отметки (v6.w), берег — склон в пару сотых высоты */
      if(kind>.5&&v0.w<.5){
        let pv=palV(base);
        let dv=(h0-.42)*.22*am+(fb3(B*90.+so,2)-.5)*.05*af*smoothstep(.4,.6,h0);
        let vn=pv.x+dv;
        if(v6.w>0.){wm=1.-smoothstep(v6.w-.012,v6.w+.012,vn);}
        base=max(base+(palAt(vn)-palAt(pv.x))*(1.-smoothstep(.04,.14,pv.y)),vec3f(0.));
      }
      let hx=hgt(rotY(normalize(n+tx0*e),th),so,af)-h0;
      let hy=hgt(rotY(normalize(n+ty0*e),th),so,af)-h0;
      let rk=(.012+.018*(1.-air))*am*(1.-wm);
      nn=normalize(n-(tx0*hx+ty0*hy)/e*rk);
      let hd=(h0-.42)*am*(1.-wm);
      var land=base*(1.+hd*.45);
      if(kind>.5){land=mix(land,v6.rgb,clamp(hd*1.2,0.,.22));land=mix(land,v7.rgb,clamp(-hd*1.2,0.,.22));}
      else{land=base*(.8+.34*fb3(B*3.5+so,4))*(1.+hd*.5);}
      let sea=base*(.9+.2*fb3(B*13.+so,3)*am);
      base=mix(land,sea,wm);
    }else{
      /* газ: мелкие вихри вдоль полос */
      let hb=fb3(vec3f(B.x*5.,B.y*34.,B.z*5.)+so+vec3f(t*.0004,0.,0.),4);
      let hf=fb3(vec3f(B.x*22.,B.y*120.,B.z*22.)+so,3);
      base=base*(1.+(hb-.5)*.34*am+(hf-.5)*.16*af);
    }
    let dn=dot(nn,L);
    let l=clamp((dn+w)/(1.+w),0.,1.);
    let k=.1+1.08*pow(l,.85);
    /* звезда тонирует свет, а не красит планету своим цветом целиком */
    let sun=mix(vec3f(1.),v5.rgb,.25);
    let ss=exp(-pow((dl-.04)/.12,2.))*air;
    var col=base*k*sun*mix(vec3f(1.),warm*1.2,ss*.3);
    /* ночь холодная, а не серая */
    col=col+base*vec3f(.03,.04,.07)*(1.-l);
    /* блик звезды на воде: широкий ореол и узкое пятно, рябь — от мелкого слоя */
    if(wm>0.){
      let wv=vec3f(fb3(B*70.+so+vec3f(t*.002,0.,0.),2),fb3(B*70.+so+vec3f(3.1,t*.0017,5.),2),0.)-.5;
      let hv=normalize(L+vec3f(0.,0.,1.));
      let nh0=max(dot(n,hv),0.);let nh=max(dot(normalize(n+vec3f(wv.xy,0.)*(.02+.03*af)),hv),0.);
      /* широкое пятно — ровная вода в целом, ядро — гребни волн, дробится рябью */
      let gl=pow(nh0,36.)*.3+pow(nh,260.)*1.6+pow(nh0,6.)*.05;
      col=col+sun*vec3f(1.,.95,.86)*gl*wm*smoothstep(-.05,.25,dl)*mix(1.,.6,ss);
    }
    /* облака и их тень */
    var cl=0.;
    if(v7.w>0.){
      let Bc=rotY(n,th*1.04+t*.00004);
      cl=cld(Bc,so,v7.w,af);
      let cs=cld(rotY(normalize(n+L*.012),th*1.04+t*.00004),so,v7.w,0.);
      col=col*(1.-.32*cs*smoothstep(-.1,.3,dl));
      let lc=clamp((dl+.22)/1.22,0.,1.);
      /* облако светлее там, где толще; звезду берёт слабее грунта — белое не розовеет */
      var cc=v8.rgb*(.06+1.1*pow(lc,.8))*mix(vec3f(1.),v5.rgb,.08)*(.8+.25*cl);
      cc=cc*mix(vec3f(1.),warm*1.25,ss*.5);
      col=mix(col,cc,cl*.9);
    }
    /* огни построек — города на суше. Точки кладёт gplCities (CPU): пояс .35–.85 R на
       дальней от звезды стороне, едут вместе с поверхностью. Ядро меряется пикселями
       экрана, а не долей шара: три огня — три точки и на малом диске, и на большом;
       тёплый ореол втрое шире ядра (Контроль 24.09) */
    if(v8.w>.5){
      var g=0.;var ha=0.;let N=i32(min(v8.w,48.));
      for(var j=0;j<N;j++){
        let c=pb[16+j];let dv=(d-c.xy)*r;let dd=dot(dv,dv);
        g=g+exp(-dd/6.)*c.z;ha=ha+exp(-dd/54.)*c.z;
      }
      let lk=(1.-wm)*(1.-cl*.4);
      col=col+(vec3f(1.,.95,.84)*min(g,1.)*.8+vec3f(1.,.64,.34)*min(ha,1.)*.16)*lk;
    }
    /* ободок: рассеяние по краю, днём; у терминатора теплеет */
    let rim=pow(1.-nz,3.)*rimK*smoothstep(-.25,.35,dl);
    col=col+mix(v2.rgb,warm*.9,exp(-pow(dl/.2,2.))*.35)*rim;
    /* тень кольца на диске: луч к звезде пересекает плоскость кольца */
    if(v4.w>0.){
      let tt=v4.w;let N=vec3f(0.,sqrt(1.-tt*tt),-tt);let dq=dot(L,N);
      if(abs(dq)>1e-3){let s=-dot(n,N)/dq;
        /* шаг тени на пикселе — по соседям: проекция лучом сжимает полосы сильнее, чем наклон */
        let dx=d+vec2f(px,0.);let dy=d+vec2f(0.,px);
        let nx=vec3f(dx,sqrt(max(0.,1.-dot(dx,dx))));let ny=vec3f(dy,sqrt(max(0.,1.-dot(dy,dy))));
        let rh=length(n+L*s);
        let dr=max(abs(length(nx-L*dot(nx,N)/dq)-rh),abs(length(ny-L*dot(ny,N)/dq)-rh));
        if(s>0.){let rg=ring(rh,v4,v5,max(dr,px));col=col*(1.-rg.a*.85);}}
    }
    let cov=clamp((1.-len)/px+.5,0.,1.);
    sph=vec4f(col*cov,cov);
  }
  /* атмосфера за краем диска — только с дневной стороны, у терминатора рыжая */
  var halo=vec3f(0.);
  if(len>=1.-px&&rimK>0.){
    let hw=.05+.05*rimK;let x=(len-1.)/hw;
    let ca=dot(d/len,normalize(L.xy));
    let day=smoothstep(-.3,.5,ca);
    let hc=mix(v2.rgb,warm*.85,exp(-pow((ca+.05)/.3,2.))*.5);
    halo=hc*rimK*.8*exp(-max(x,0.)*2.2)*day*step(-1.,x);
  }
  var acc=vec4f(halo,0.);
  if(v4.w>0.){
    let tt=v4.w;let st=sqrt(1.-tt*tt);
    let rho=length(vec2f(d.x,d.y/tt));let zr=d.y/tt*st;
    var rg=ring(rho,v4,v5,px*length(vec2f(d.x,d.y/max(tt*tt,.0064)))/max(rho,.01));
    /* тень планеты на кольце: луч от точки кольца к звезде задевает шар */
    let P=vec3f(d.x,d.y,zr);let b=dot(P,L);let cc=dot(P,P)-1.;let disc=b*b-cc;
    if(b<0.&&disc>0.){rg=vec4f(rg.rgb*(1.-smoothstep(0.,.04,disc)*.85),rg.a);}
    let lit=.55+.45*clamp(abs(L.z),0.,1.);
    rg=vec4f(rg.rgb*lit*mix(vec3f(1.),v5.rgb,.25),rg.a);
    if(zr>nz){acc=over(over(acc,sph),rg);}else{acc=over(over(acc,rg),sph);}
  }else{acc=over(acc,sph);}
  return acc;
}`;
/* одно тело в кадре: x,y,r — экранные; tex — развёртка {view,w} (17gb) или null; o — свет, кольцо, слои G3b */
function gplBody(pass,key,x,y,r,tex,o){
  const a=GPL.A;a.fill(0);
  a[0]=x;a[1]=y;a[2]=r;a[3]=tex?0:1;
  a[4]=o.sx;a[5]=o.sy;a[6]=o.turn||0;a[7]=o.rimK||0;
  a[8]=o.rim[0]/255;a[9]=o.rim[1]/255;a[10]=o.rim[2]/255;a[11]=o.seed||0;
  a[12]=o.base[0]/255;a[13]=o.base[1]/255;a[14]=o.base[2]/255;a[15]=o.kind||0;
  const R=o.ring;if(R){a[16]=R.i;a[17]=R.o;a[18]=(R.s%997)*.013;a[19]=R.tilt;a[23]=R.n;}
  a[20]=o.sun[0];a[21]=o.sun[1];a[22]=o.sun[2];
  const hi=o.hi||o.base,lo=o.lo||o.base,ct=o.cloudTint||[255,255,255];
  a[24]=hi[0]/255;a[25]=hi[1]/255;a[26]=hi[2]/255;a[27]=o.wet||0;
  a[28]=lo[0]/255;a[29]=lo[1]/255;a[30]=lo[2]/255;a[31]=o.cloud||0;
  a[32]=ct[0]/255;a[33]=ct[1]/255;a[34]=ct[2]/255;
  a[35]=o.lights?gplCities(o,a):0;
  a[36]=0;a[37]=tex?tex.w:256;
  const pal=o.pal;if(pal){const np=Math.min(5,pal.length-1);
    for(let i=0;i<=np;i++){a[40+i*4]=pal[i][0]/255;a[41+i*4]=pal[i][1]/255;a[42+i*4]=pal[i][2]/255;}a[43]=np;}
  const U=GPUBufferUsage,d=GPU.dev;
  const ub=gpuBuf("gpl.u",32,U.UNIFORM|U.COPY_DST);
  const u=GPL.U;u[0]=GPU.bw;u[1]=GPU.bh;u[2]=W;u[3]=H;u[4]=DPR;u[5]=G.t||0;d.queue.writeBuffer(ub,0,u);
  const sb=gpuBuf("gpl.b."+key,1024,U.STORAGE|U.COPY_DST);d.queue.writeBuffer(sb,0,a);
  const P=gpuPipe("gpl",GPL_WGSL,"over");
  const tv=tex?tex.view:(GPU.nView||(GPU.nView=GPU.N.createView()));
  pass.setPipeline(P);pass.setBindGroup(0,gpuBind("gpl."+key,P,[ub,sb,GPU.S.lin,tv]));pass.draw(6);
}
/* свет звезды — нормированный по светлоте, как в planetLight */
function gplSun(){
  const c=(typeof starRGB==="function")?starRGB():[255,244,214],m=Math.max(1,c[0],c[1],c[2]);
  return [c[0]/m,c[1]/m,c[2]/m];
}
/* планета системы: развёртка — шейдером (07/17gb), свет, воздух, облака и огни — здесь.
   lights — сколько огней построек на ней (planetLightsOn, 17e) */
function gpuPlanet(p,x,y,r,lights){
  const pass=gpuScene();if(!pass)return;
  const lvl=r>150?2:(r>60?1:0);
  const S=planetStrip(p,lvl);
  if(typeof matRows==="function")matRows();   /* строки материала — арифметика; сборку в узор делает 2D-кадр, которому он нужен (18a) */
  const gas=p.type==="gas",airless=!gas&&!!(p.T&&p.T.atm==="отсутствует");
  const sk=(p.T&&((gas&&p.T.pal&&p.T.pal[p.T.pal.length-1])||(p.T.sky&&p.T.sky[0])))||[130,180,210];
  const pal=p.T.pal,np=pal.length-1;
  /* направление на звезду — тем же planetSunRot, что проверяет 91zzzb-bio */
  const sa=PLANET_BAKE_ANG+planetSunRot(p);
  const cw=(!gas&&!airless&&GPL_CLOUD[p.type])||null;
  gplBody(pass,"p"+(p.idx|0),x,y,r,S,{sx:Math.cos(sa),sy:Math.sin(sa),turn:planetSpin(p)/TAU,
    rimK:airless?0:(gas?.5:.34),rim:[lerp(sk[0],255,.35),lerp(sk[1],255,.35),lerp(sk[2],255,.35)],
    base:pal[Math.min(np,pal.length>>1)],ring:(p.ring&&r>5)?p.ring:null,sun:gplSun(),seed:p.seed%97,kind:gas?2:1,
    hi:pal[Math.max(0,np-1)],lo:pal[Math.min(np,2)],wet:GPL_SEA[p.type]||0,pal,
    cloud:cw?cw[0]:0,cloudTint:cw?[lerp(236,sk[0],cw[1]),lerp(238,sk[1],cw[1]),lerp(242,sk[2],cw[1])]:null,
    lights:lights||0,strip:S,T:planetSpin(p)/TAU});
}
/* ── огни построек: где стоят города ──
   Контроль 24.09: огни — на суше, в поясе .35–.85 R от середины диска, на стороне от
   звезды, не у края; три огня читаются тремя точками, двадцать четыре — россыпью.
   Звезда почти всегда за спиной смотрящего, настоящей ночи на диске почти нет — поэтому
   окно, а не терминатор. Каждый город — точка тела: он едет с поверхностью ровно с её
   скоростью, пройдя окно (GPL_CITY_D по долготе) гаснет, и следующим оборотом окна
   зажигается следующий город на новой широте. Видимых — столько, сколько огней */
const GPL_CITY_D=.8;
const GPL_WIN=new Map();   /* окна широт огней: сид планеты → {qa, e[j], w[j][tr]} (gplCities) */
const GPL_LAND=new WeakMap();
const gss=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const ghf=(a,b,c)=>hashi(a,b,c)/4294967296;
/* суша по развёртке: высота — ближайшая точка ломаной палитры (как palV шейдера), выше
   отметки воды — суша. Сетка 256×128, как прежде: клетка — развёртка, сведённая к этой
   сетке билинейно (drawImage 2D делал то же), в байтах. Прежде сетку целиком читали из
   2D-холста getImageData; теперь клетка считается по формуле точки (planetStripPx) в тот
   миг, когда город о ней спросил, и помнится: 2D нет, а спрашивают десятки клеток, не 32 тысячи */
function gplLandMask(S,pal,wet){
  let m=GPL_LAND.get(S);if(m)return m;
  const w=256,h=128,M=new Uint8Array(w*h).fill(2);
  m={w,h,M,J:planetStripParams(S.p,S.lvl),pal,wet,np:Math.min(5,pal.length-1),px:[0,0,0]};GPL_LAND.set(S,m);return m;
}
function gplLandAt(m,ix,iy){
  const i=iy*m.w+ix;if(m.M[i]<2)return m.M[i];
  const J=m.J,sx=(ix+.5)*J.SW/m.w-.5,sy=(iy+.5)*J.SH/m.h-.5,x0=Math.floor(sx),y0=Math.floor(sy),fx=sx-x0,fy=sy-y0;
  const C=[0,0,0];
  for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){const wgt=(dx?fx:1-fx)*(dy?fy:1-fy);if(wgt<=0)continue;
    const c=planetStripPx(J,Math.max(0,Math.min(J.SW-1,x0+dx)),Math.max(0,Math.min(J.SH-1,y0+dy)),m.px);
    for(let k=0;k<3;k++)C[k]+=Math.round(clamp(c[k],0,255))*wgt;}
  const r=Math.round(C[0]),gg=Math.round(C[1]),b=Math.round(C[2]),pal=m.pal,np=m.np;let bd=1e9,bv=0;
  for(let k=0;k<np;k++){
    const A=pal[k],E=pal[k+1],ax=E[0]-A[0],ay=E[1]-A[1],az=E[2]-A[2];
    const t=clamp(((r-A[0])*ax+(gg-A[1])*ay+(b-A[2])*az)/Math.max(ax*ax+ay*ay+az*az,1e-6),0,1);
    const dx=r-A[0]-ax*t,dy=gg-A[1]-ay*t,dz=b-A[2]-az*t,dd=dx*dx+dy*dy+dz*dz;
    if(dd<bd){bd=dd;bv=(k+t)/np;}
  }
  return m.M[i]=bv>m.wet+.01?1:0;
}
function gplCities(o,a){
  const n=Math.min(48,o.lights|0),wet=o.wet||0;
  const land=wet>0&&o.strip?gplLandMask(o.strip,o.pal,wet):null;
  if(wet>0&&!land)return 0;
  /* сторона от звезды на экране: свет шейдера — (sx,sy)·.67 и .74 к смотрящему */
  const l=Math.hypot(o.sx,o.sy)||1,ax=-o.sx/l,ay=-o.sy/l;
  const regA=(x,y,ux,uy)=>{const rr=Math.hypot(x,y);if(rr<.3||rr>.9)return 0;
    return gss(.3,.4,rr)*(1-gss(.8,.9,rr))*gss(.2,.45,(x*ux+y*uy)/rr);};
  const T=o.T||0,sd=(o.seed|0)*131+7;let k=0;
  /* окна широт — из кэша (ревью №10): поиск — до 32 широт × 41 долгота, до 63 000 reg() за кадр,
     а окно меняется, только когда меняется оборот e или сторона звезды. Сторона — в 1/1024 оборота:
     долготы и так идут шагом .07 рад, квант сдвигает лишь миг, когда окно перескакивает */
  const qa=Math.round(Math.atan2(ay,ax)/TAU*1024),qx=Math.cos(qa*TAU/1024),qy=Math.sin(qa*TAU/1024);
  let C=GPL_WIN.get(sd);
  if(!C||C.qa!==qa){C={qa,e:[],w:[]};GPL_WIN.delete(sd);GPL_WIN.set(sd,C);
    if(GPL_WIN.size>16)GPL_WIN.delete(GPL_WIN.keys().next().value);}
  for(let j=0;j<n;j++){
    const P=ghf(sd,j,77)+T*TAU/GPL_CITY_D,e=Math.floor(P),ph=P-e;
    if(C.e[j]!==e){C.e[j]=e;C.w[j]=[];}
    const Wj=C.w[j];
    /* широта этого оборота окна: первая, чья дорожка пересекает пояс и чей город — на суше */
    for(let tr=0;tr<32;tr++){
      const y0=ghf(sd+j*977,e,tr)*1.7-.85,c=Math.sqrt(1-y0*y0);
      let W=Wj[tr];
      if(W===undefined){
        let best=0,r0=null,la=0,lb=0;
        for(let s=0;s<=40;s++){const L=-1.45+2.9*s/40;
          if(regA(c*Math.sin(L),y0,qx,qy)>.5){if(r0===null)r0=L;if(L-r0>best){best=L-r0;la=r0;lb=L;}}else r0=null;}
        W=Wj[tr]=best<GPL_CITY_D?null:[la,lb];   /* окно целиком в поясе: город не гаснет на полпути */
      }
      if(!W)continue;
      const lam=(W[0]+W[1])/2+(.5-ph)*GPL_CITY_D;
      if(Math.abs(lam)>1.5)continue;
      /* точка тела под городом: та же долгота, что читает шейдер (u0 = atan2/2π + оборот) */
      if(land){const u=((lam/TAU+T)%1+1)%1,v=(y0+1)/2;
        if(!gplLandAt(land,Math.min(land.w-1,u*land.w|0),Math.min(land.h-1,v*land.h|0)))continue;}
      const x=c*Math.sin(lam),w=gss(0,.08,ph)*(1-gss(.92,1,ph))*regA(x,y0,ax,ay)*(.8+.2*ghf(sd,j,5));
      if(w>.02){a[64+k*4]=x;a[65+k*4]=y0;a[66+k*4]=w;k++;}
      break;
    }
  }
  return k;
}
/* луна: освещённый шар; свет — от звезды, как у её планеты */
function gpuMoon(m,key,x,y,r){
  const pass=gpuScene();if(!pass)return;
  const dx=-(m.x||0),dy=-(m.y||0),dl=Math.hypot(dx,dy)||1;
  gplBody(pass,"m"+key,x,y,Math.max(1.2,r),null,{sx:dx/dl,sy:dy/dl,rimK:0,rim:[0,0,0],
    base:[154,168,178],sun:gplSun(),seed:(m.seed||key.length*13)%97,kind:0});
}
