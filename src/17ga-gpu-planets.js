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
const GPL={A:new Float32Array(64),U:new Float32Array(8)};
/* отметка воды на высоте развёртки (доля палитры): ниже — море с бликом */
const GPL_SEA={terran:.27,ocean:.8};
/* облачность и оттенок облаков по типу: доля неба и сколько в них цвета воздуха */
const GPL_CLOUD={terran:[.34,.12],ocean:[.5,.1],jungle:[.52,.18],ice:[.26,.1],desert:[.1,.35],
  volcanic:[.3,.5],toxic:[.46,.6],crystal:[.12,.3],ruin:[.16,.3]};
const GPL_WGSL=`
struct U{a:vec4f,b:vec4f};
@group(0) @binding(0) var<uniform> u:U;
@group(0) @binding(1) var<storage,read> pb:array<vec4f,16>;
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
  return .42+.5*(fb3(b*8.+so,3)-.5)+mt*.5*(rg3(b*14.+wq*1.6+so*1.3,3)-.3)+.12*af*(fb3(b*48.+so*1.7,3)-.5);}
/* облака: широтные гряды с завихрениями; порог — пологий склон, а не обрез */
fn cld(b:vec3f,so:vec3f,cv:f32,af:f32)->f32{
  let wq=vec3f(fb3(b*2.2+so,3),fb3(b*2.2+so+vec3f(5.2,1.3,2.8),3),fb3(b*2.2+so+vec3f(2.9,7.1,.4),3))-.5;
  let c=fb3(b*vec3f(3.,5.5,3.)+wq*1.6+so*.5,5);
  /* край объедается мелким шумом — рваный и прозрачный, без обреза */
  let e=.2*(fb3(b*vec3f(14.,22.,14.)+wq*3.+so,3)-.5)+.08*af*(fb3(b*52.+so,2)-.5);
  return smoothstep(.6-cv*.3,.8-cv*.3,c+e);}
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
      let uv=vec2f(fract(u0)+wp.x,clamp(vv+wp.y,.002,.998));
      base=textureSampleLevel(tx,smp,uv,0.).rgb;
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
        let dv=(h0-.42)*.22*am+(fb3(B*90.+so,2)-.5)*.05*af;
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
    /* огни построек — города на ночной суше */
    if(v8.w>.5){
      var g=0.;let N=i32(min(v8.w*6.,160.));
      for(var j=0;j<N;j++){
        let fj=f32(j);let z=h1(fj*3.7+v2.w)*1.6-.8;let a=6.2831853*h1(fj*1.9+v2.w*.3+.5);
        let s=vec3f(sqrt(1.-z*z)*sin(a),z,sqrt(1.-z*z)*cos(a));
        let sz=.00012+.0004*h1(fj*5.1+.3);
        let dd=1.-dot(B,s);g=g+(exp(-dd/sz)+.45*exp(-dd/(sz*6.)))*(.55+.45*h1(fj*7.3+.1));
      }
      let grain=.3+1.4*smoothstep(.42,.72,fb3(B*140.+so,2));
      /* звезда почти всегда за спиной смотрящего, и настоящая ночь — узкий серп у края;
         огни горят на всей дальней от звезды половине и гаснут к свету, как в 2D */
      let night=1.-smoothstep(.05,.45,dl);
      col=col+vec3f(1.,.74,.44)*min(g*grain,1.)*night*(1.-wm)*(1.-cl*.75)*.75;
    }
    /* ободок: рассеяние по краю, днём; у терминатора теплеет */
    let rim=pow(1.-nz,3.)*rimK*smoothstep(-.25,.35,dl);
    col=col+mix(v2.rgb,warm*.9,exp(-pow(dl/.2,2.))*.35)*rim;
    /* тень кольца на диске: луч к звезде пересекает плоскость кольца */
    if(v4.w>0.){
      let tt=v4.w;let N=vec3f(0.,sqrt(1.-tt*tt),-tt);let dq=dot(L,N);
      if(abs(dq)>1e-3){let s=-dot(n,N)/dq;
        if(s>0.){let P=n+L*s;let rg=ring(length(P),v4,v5,px);col=col*(1.-rg.a*.85);}}
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
/* одно тело в кадре: x,y,r — экранные; tex — развёртка или null; o — свет, кольцо, слои G3b */
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
  a[32]=ct[0]/255;a[33]=ct[1]/255;a[34]=ct[2]/255;a[35]=o.lights||0;
  a[36]=0;a[37]=tex?tex.width:256;
  const pal=o.pal;if(pal){const np=Math.min(5,pal.length-1);
    for(let i=0;i<=np;i++){a[40+i*4]=pal[i][0]/255;a[41+i*4]=pal[i][1]/255;a[42+i*4]=pal[i][2]/255;}a[43]=np;}
  const U=GPUBufferUsage,d=GPU.dev;
  const ub=gpuBuf("gpl.u",32,U.UNIFORM|U.COPY_DST);
  const u=GPL.U;u[0]=GPU.bw;u[1]=GPU.bh;u[2]=W;u[3]=H;u[4]=DPR;u[5]=G.t||0;d.queue.writeBuffer(ub,0,u);
  const sb=gpuBuf("gpl.b."+key,256,U.STORAGE|U.COPY_DST);d.queue.writeBuffer(sb,0,a);
  const P=gpuPipe("gpl",GPL_WGSL,"over");
  const tv=tex?gpuCanvasTex(tex).view:(GPU.nView||(GPU.nView=GPU.N.createView()));
  pass.setPipeline(P);pass.setBindGroup(0,gpuBind("gpl."+key,P,[ub,sb,GPU.S.lin,tv]));pass.draw(6);
}
/* свет звезды — нормированный по светлоте, как в planetLight */
function gplSun(){
  const c=(typeof starRGB==="function")?starRGB():[255,244,214],m=Math.max(1,c[0],c[1],c[2]);
  return [c[0]/m,c[1]/m,c[2]/m];
}
/* планета системы: развёртка печётся тем же порядком (07), свет, воздух, облака и огни — здесь.
   lights — сколько огней построек на ней (planetLightsOn, 17e) */
function gpuPlanet(p,x,y,r,lights){
  const pass=gpuScene();if(!pass)return;
  const lvl=r>150?2:(r>60?1:0);
  const S=planetStrip(p,lvl);
  planetStripTick();
  if(typeof matTick==="function")matTick();
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
    lights:lights||0});
}
/* луна: освещённый шар; свет — от звезды, как у её планеты */
function gpuMoon(m,key,x,y,r){
  const pass=gpuScene();if(!pass)return;
  const dx=-(m.x||0),dy=-(m.y||0),dl=Math.hypot(dx,dy)||1;
  gplBody(pass,"m"+key,x,y,Math.max(1.2,r),null,{sx:dx/dl,sy:dy/dl,rimK:0,rim:[0,0,0],
    base:[154,168,178],sun:gplSun(),seed:(m.seed||key.length*13)%97,kind:0});
}
