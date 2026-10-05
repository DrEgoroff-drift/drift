/* ══════════════ тела неба на движке (27.09.2026) ══════════════
   Что стоит в небе, решает планета (skyScene, 19b): гигант, соседний мир, луны,
   галактика, дыра, сияние, туманность, комета, пульсар, рой. Где встали и какой
   стороной повёрнуты — зерно посадки (skyRoll, 19ca). Каждое тело — шар или
   облако в своём поле, освещённое оттуда, где стоит звезда (sunSpot):
   · гигант — шар с полосами по широте, вихрями и штормовым пятном; кольца —
     плоскость с делениями, тень планеты ложится на них, задняя половина за
     диском; ночная сторона уходит в тон воздуха, не в дыру (законы 19b живы:
     пол по воздуху, терминатор не мельче 72, не ярче своей звезды);
   · соседний мир — материки, шапки, облачные вихри, блик моря, кромка воздуха;
   · луна — фаза от звезды и от зерна, моря и кратеры; днём её тёмная сторона
     прозрачна (сквозь неё небо), в пустоте — чёрная и гасит звёзды;
   · галактика — спираль с ядром и пылевой полосой; дыра — горизонт, кольцо
     фотонов, диск с доплеровской стороной и поднятой линзой дугой; сияние —
     занавеси лучами, зелёный низ и лиловый верх; туманность — мягкая, без
     контура; комета — ионный хвост от звезды и изогнутый пылевой.
   Одно поле на тело под ножницами своей рамки: пикселей ровно столько, сколько
   тело занимает. */
const GSB=new Float32Array(60);
const GSB_HEAD=SKY_NOISE_WGSL+`
fn rot2(q:vec2f,a:f32)->vec2f{let c=cos(a);let s=sin(a);return vec2f(c*q.x+s*q.y,-s*q.x+c*q.y);}
`;
const GSB_WGSL={
giant:`
fn rb(re:f32,c:f32,w:f32,aa:f32)->f32{return 1.-smoothstep(w*.5-aa,w*.5+aa,abs(re-c));}
fn field(p:vec2f,uv:vec2f)->vec4f{
  let c0=fu.v[0].xy;let R=fu.v[0].z;let A=fu.v[0].w;
  let lit=fu.v[1].rgb;let sk=fu.v[1].w;let shd=fu.v[2].rgb;let atm=fu.v[2].w;
  let u=fu.v[3].xy;let tilt=fu.v[3].z;let sd=fu.v[3].w;
  let airc=fu.v[4].rgb;let spot=fu.v[5].rgb;let t=fu.v[5].w;
  let stp=fu.v[6].xy;let stA=fu.v[6].z;let ringy=fu.v[8].x;let spin=fu.v[8].y;
  let q=(p-c0)/R;let r=length(q);
  let rq=rot2(q,tilt);
  var col=vec3f(0.);var a=0.;
  if(atm>.5&&r>.94){let h=.20*(1.-smoothstep(.94,1.3,r));col=airc*h;a=h;}
  var rA=0.;var rC=vec3f(0.);
  if(ringy>.5){
    let re=length(vec2f(rq.x,rq.y/.26));
    let aa=max(1.2/(R*.26),.004);
    var s=.34*rb(re,1.28,.055,aa)+.16*rb(re,1.40,.028,aa)+.46*rb(re,1.50,.075,aa)+.26*rb(re,1.66,.036,aa)+.13*rb(re,1.78,.020,aa);
    s=s*(.72+.56*vn(vec2f(re*90.,sd)));
    let side=dot(q/max(r,1e-3),u);
    rC=mix(shd,lit,.55+.45*side);
    /* тень планеты на кольце: за шаром по лучу от звезды */
    let along=dot(q,-u);let perp=abs(q.x*u.y-q.y*u.x);
    rC=rC*select(1.,mix(.28,1.,smoothstep(.9,1.05,perp)),along>0.);
    rA=clamp(s,0.,1.);
  }
  if(rA>0.&&rq.y<0.){let ra=rA*.52;col=rC*ra+col*(1.-ra);a=ra+a*(1.-ra);}
  let cov=clamp((1.-r)*R+.5,0.,1.);
  if(cov>0.){
    let z=sqrt(max(1.-r*r,0.));
    let n=vec3f(q,z);
    let L=normalize(vec3f(u*.92,.40));
    let ndl=dot(n,L);
    let nr=vec3f(rq,z);
    let lon=atan2(nr.x,nr.z)+spin;let la=nr.y;
    let turb=fbm(vec2f(lon*1.4,la*7.)+vec2f(sd,t*.00003),3);
    let fq=10.+fract(sd*.37)*10.;
    let bands=.5+.5*sin(la*fq+turb*3.0+sd);
    var body=mix(shd,lit,smoothstep(-.35,.75,ndl));
    body=body*(.86+.28*bands);
    body=mix(body,mix(body,spot,.35),smoothstep(.62,.9,turb)*.5);
    let sdd=vec2f((lon-stp.x)*1.1,(la-stp.y)*2.6);
    body=mix(body,vec3f(1.,.75,.59),exp(-dot(sdd,sdd)*30.)*stA*.5);
    body=body*(.80+.20*z);
    body=mix(body,airc,.58*(1.-smoothstep(-.7,.15,ndl)));
    let rim=smoothstep(.86,1.,r)*max(dot(q/max(r,1e-3),u),0.);
    body=min(body+vec3f(1.,.94,.84)*.34*sk*rim,vec3f(1.));
    col=body*cov+col*(1.-cov);a=cov+a*(1.-cov);
  }
  if(rA>0.&&rq.y>=0.){col=rC*rA+col*(1.-rA);a=rA+a*(1.-rA);}
  return vec4f(col,a)*A;
}`,
moon:`
fn field(p:vec2f,uv:vec2f)->vec4f{
  let c0=fu.v[0].xy;let R=fu.v[0].z;let A=fu.v[0].w;
  let mc=fu.v[1].rgb;let atm=fu.v[2].w;let airc=fu.v[2].rgb;
  let u=fu.v[3].xy;let pz=fu.v[3].z;let sd=fu.v[3].w;
  let q=(p-c0)/R;let r=length(q);
  let L=normalize(vec3f(u*sqrt(max(1.-pz*pz,0.)),pz));
  let litF=.5+.5*pz;
  var col=vec3f(0.);var a=0.;
  if(r>1.){let h=.10*exp(-(r-1.)*3.)*litF*select(.6,1.,atm>.5);return vec4f(mc*h,0.)*A;}
  let cov=clamp((1.-r)*R+.5,0.,1.);
  let z=sqrt(max(1.-r*r,0.));let n=vec3f(q,z);
  let ndl=dot(n,L);
  let lit=smoothstep(-.05,.12,ndl);
  let mar=smoothstep(.46,.66,fbm(q*2.2+vec2f(sd,1.),4));
  /* кратеры: ячейка — яма; кромка к звезде светлее, дно в тени */
  let g=q*5.+vec2f(sd*.1,0.);let id=floor(g);let f=fract(g)-.5-(kh2(id+sd)-.5)*.4;
  let cr=.18+.2*kh(id+vec2f(sd,4.));
  let cd=length(f)/cr;
  let cs=select(1.,.84+.3*smoothstep(.55,1.,cd)*max(dot(normalize(f+1e-4),u),0.),cd<1.);
  let alb=mc*(.92-.2*mar)*cs;
  let c=alb*(lit*(.5+.5*max(ndl,0.)))*(.84+.16*z)+alb*.05*(1.-lit);
  /* в воздухе тёмная сторона прозрачна: сквозь неё видно небо */
  let ta=select(.94,.10,atm>.5);
  let al=cov*mix(ta,1.,lit);
  return vec4f(c*cov,al)*A;
}`,
world:`
fn field(p:vec2f,uv:vec2f)->vec4f{
  let c0=fu.v[0].xy;let R=fu.v[0].z;let A=fu.v[0].w;
  let sea=fu.v[1].rgb;let seaT=fu.v[1].w;let land=fu.v[2].rgb;let atm=fu.v[2].w;
  let u=fu.v[3].xy;let spin=fu.v[3].z;let sd=fu.v[3].w;
  let cap=fu.v[5].rgb;let t=fu.v[5].w;let cld=fu.v[6].w;
  let q=(p-c0)/R;let r=length(q);
  let rimc=sea*.6+vec3f(90./255.);
  let L=normalize(vec3f(u*.9,.45));
  if(r>1.){let h=.34*(1.-smoothstep(1.,1.22,r));return vec4f(rimc*h,h)*A;}
  let cov=clamp((1.-r)*R+.5,0.,1.);
  let z=sqrt(max(1.-r*r,0.));let n=vec3f(q,z);
  let lon=atan2(n.x,n.z)+spin+t*.00004;let la=asin(clamp(n.y,-1.,1.));
  let cont=fbm(vec2f(lon*1.3,la*2.1)+vec2f(sd,2.),5);
  let ld=smoothstep(seaT,seaT+.035,cont);
  let cp=smoothstep(.70,.80,abs(n.y)+(cont-.5)*.18);
  let cl=smoothstep(.52,.78,fbm(vec2f(lon*2.2+la*1.5,la*5.)+vec2f(sd+7.,t*.00006),4))*cld;
  var alb=mix(sea,land*(.85+.3*cont),ld);
  alb=mix(alb,cap,cp);alb=mix(alb,vec3f(.94,.95,.96),cl);
  let ndl=dot(n,L);let day=smoothstep(-.12,.28,ndl);
  let h=reflect(-L,n);let gl=pow(max(h.z,0.),28.)*(1.-ld)*(1.-cl)*day*.45;
  var c=alb*(.05+.95*day*(.55+.45*max(ndl,0.)))+vec3f(1.,.97,.9)*gl;
  c=c+rimc*pow(1.-z,3.)*(.25+.75*day)*.8;
  return vec4f(c*cov,cov)*A;
}`,
galaxy:`
fn field(p:vec2f,uv:vec2f)->vec4f{
  let c0=fu.v[0].xy;let R=fu.v[0].z;let A=fu.v[0].w;
  let t1=fu.v[1].rgb;let tilt=fu.v[3].z;let sd=fu.v[3].w;
  let g=rot2((p-c0)/R,tilt);
  let d=vec2f(g.x,g.y/.24);let rr=length(d);let th=atan2(d.y,d.x);
  let arms=pow(.5+.5*cos(2.*th-log(max(rr,.03))*4.2+sd),3.);
  let dust=fbm(d*3.+vec2f(sd,0.),4);
  let b=exp(-rr*rr*10.)*1.5+arms*exp(-rr*2.6)*(.45+dust)*.55+exp(-rr*3.)*.22;
  let lane=exp(-pow((g.y-.03)/.035,2.))*(1.-smoothstep(.2,1.1,rr))*.55;
  let col=mix(t1,vec3f(1.,.96,.9),exp(-rr*4.));
  return vec4f(col*b*.55*(1.-lane),lane*.7)*A;
}`,
hole:`
fn field(p:vec2f,uv:vec2f)->vec4f{
  let c0=fu.v[0].xy;let R=fu.v[0].z;let A=fu.v[0].w;
  let dark=fu.v[1].x;let glow=fu.v[1].y;let tl=fu.v[3].z;
  let q=(p-c0)/R;let r=length(q);
  var col=vec3f(0.);var a=0.;
  /* линза: небо вокруг темнеет и еле заметное кольцо Эйнштейна */
  let ld=dark*(.9*(1.-smoothstep(.9,3.4,r)));
  a=ld*.6;col=vec3f(.59,.67,1.)*.07*bump(r,2.1,.35)*dark;
  let hc=clamp((1.-r)*R+.5,0.,1.)*dark;
  col=col*(1.-hc);a=hc+a*(1.-hc);
  let g=rot2(q,tl);
  let e=length(vec2f(g.x/1.9,g.y/.42));
  let dop=1.+.55*clamp(g.x/1.9,-1.,1.);
  let ring=exp(-pow((e-1.)/.09,2.))*dop;
  /* дальняя и ближняя половины диска сходятся плавно: ступенью по g.y=0 на кончиках эллипса
     был шов, а дуга над горизонтом обрывалась вертикальными обрубками — она тает к плоскости диска */
  let fw=smoothstep(-.12,.12,g.y);
  let back=ring*.32*(1.-clamp((1.-r)*R+.5,0.,1.))*(1.-fw);
  let front=ring*.75*fw;
  let arc=exp(-pow((r-1.18)/.045,2.))*.5*(1.-smoothstep(-.42,0.,g.y));
  let ph=exp(-pow((r-1.04)/.025,2.))*.55;
  let em=vec3f(1.,.84,.59)*front+vec3f(1.,.71,.43)*back+vec3f(1.,.93,.77)*(arc+ph);
  return vec4f(col+em*glow,a)*A;
}`,
aurora:`
fn field(p:vec2f,uv:vec2f)->vec4f{
  let c0=fu.v[0].xy;let hh=fu.v[0].z;let A=fu.v[0].w;
  let h1=fu.v[1].rgb;let h2=fu.v[2].rgb;let sd=fu.v[3].w;let t=fu.v[5].w;let Wd=fu.res.z;
  let X=p.x;
  let yb=c0.y+hh*(.78+.12*sin(X*.009+sd+t*.003)+.10*(vn(vec2f(X*.018+t*.002,sd))-.5));
  let hgt=yb-p.y;
  if(hgt<-8.||hgt>hh*1.2){return vec4f(0.);}
  let rays=.35+.65*pow(vn(vec2f(X*.11+t*.012,sd+3.)),2.)*(.5+vn(vec2f(X*.025-t*.004,sd)));
  let edge=1.-smoothstep(-4.,6.,-hgt);
  let up=exp(-max(hgt,0.)/(hh*.42));
  let env=exp(-pow((X-c0.x)/(Wd*.30),2.));
  let col=mix(h1,h2,clamp(hgt/hh,0.,1.));
  let I=rays*edge*up*env;
  return vec4f(col*I,0.)*A;
}`,
nebula:`
fn field(p:vec2f,uv:vec2f)->vec4f{
  let c0=fu.v[0].xy;let A=fu.v[0].w;let sz=fu.v[4].xy;
  let t1=fu.v[1].rgb;let t2=fu.v[2].rgb;let sd=fu.v[3].w;
  let d=(p-c0)/sz;
  let w=fbm(d*2.+vec2f(sd,0.),3);
  let f=fbm(d*2.8+vec2f(w*1.8)+vec2f(sd*.3,5.),4);
  let e=exp(-dot(d,d)*3.2);
  let a=smoothstep(.42,.80,f)*e;let b=smoothstep(.5,.85,fbm(d*4.+vec2f(sd+9.,1.),3))*e;
  let col=t1*a+t2*b*.7+vec3f(.1,0.,.16)*b;
  return vec4f(col*.55,0.)*A;
}`,
comet:`
fn field(p:vec2f,uv:vec2f)->vec4f{
  let c0=fu.v[0].xy;let len=fu.v[0].z;let A=fu.v[0].w;let u=fu.v[3].xy;let bend=fu.v[3].z;
  let q=p-c0;let al=dot(q,u);let pe=dot(q,vec2f(-u.y,u.x));
  let t=al/len;
  var em=vec3f(0.);
  if(t>0.&&t<1.){
    let w=1.1+t*4.;
    em=em+vec3f(.84,.94,1.)*exp(-(pe/w)*(pe/w))*pow(1.-t,1.5)*.55;
    let p2=pe-t*t*len*.22*bend;let w2=2.+t*13.;
    em=em+vec3f(1.,.94,.84)*exp(-(p2/w2)*(p2/w2))*pow(1.-t,2.)*.30*step(t,.75);
  }
  let r2=dot(q,q);
  em=em+vec3f(.94,.98,1.)*(exp(-r2/5.)*.9+exp(-r2/70.)*.18);
  return vec4f(em,0.)*A;
}`,
pulsar:`
fn field(p:vec2f,uv:vec2f)->vec4f{
  let c0=fu.v[0].xy;let L=fu.v[0].z;let A=fu.v[0].w;let f=fu.v[1].x;let an=fu.v[3].z;
  let q=rot2(p-c0,an);
  var em=vec3f(.78,.88,1.)*exp(-dot(q,q)/2.2)*.85;
  if(f>.01&&L>1.){
    let b=exp(-(q.x/1.6)*(q.x/1.6))*max(1.-abs(q.y)/L,0.)*.5*f;
    em=em+vec3f(.86,.94,1.)*b+vec3f(.75,.86,1.)*exp(-dot(q,q)/(26.*26.*.25))*.5*f;
  }
  return vec4f(em,0.)*A;
}`,
field:`
fn field(p:vec2f,uv:vec2f)->vec4f{
  let c0=fu.v[0].xy;let S=fu.v[0].z;let A=fu.v[0].w;let sd=fu.v[3].w;let t=fu.v[5].w;let Wd=fu.res.z;
  var em=0.;
  let n=i32(38.*S);
  for(var i=0;i<60;i=i+1){
    if(i>=n){break;}
    let fi=f32(i);
    let h=kh2(vec2f(fi*7.13,sd));let h2=kh2(vec2f(sd,fi*3.7));
    let an=h.x*6.2832+t*.0004;let rr=h.y*Wd*.2*S;
    let sp=c0+vec2f(cos(an)*rr,sin(an)*rr*.3);
    let s=.5+h2.x*.8;
    let d=length(p-sp);
    em=em+clamp(s+.5-d,0.,1.)*(.18+h2.y*.4);
  }
  return vec4f(vec3f(.82,.80,.76)*em*.7,0.)*A;
}`,
parade:`
fn field(p:vec2f,uv:vec2f)->vec4f{
  let n=i32(fu.v[0].x);let al=fu.v[0].y;let Wd=fu.res.z;let H=fu.res.w;
  var em=vec3f(0.);
  var prev=vec2f(0.);
  for(var i=0;i<9;i=i+1){
    if(i>=n){break;}
    let fi=f32(i);
    let pt=vec2f(Wd*(.10+fi*.082),H*(.29+sin(fi*1.7)*.022));
    let r=2.8+f32(i%3)*1.3;
    let d=length(p-pt);
    em=em+vec3f(.89,.93,.97)*(exp(-(d/(r*1.6))*(d/(r*1.6)))*al+clamp(r+.5-d,0.,1.)*min(.85,al*2.2));
    if(i>0){em=em+vec3f(.81,.87,.93)*clamp(1.-segD(p,prev,pt),0.,1.)*al*.5;}
    prev=pt;
  }
  return vec4f(em,0.);
}`
};
/* ножницы по рамке тела (пиксели CSS → пиксели цели); false — тело за кадром */
function skyClip(pass,x0,y0,x1,y1){
  const kx=GPU.bw/W,ky=GPU.bh/H;
  const a=Math.max(0,Math.floor(x0*kx)),b=Math.max(0,Math.floor(y0*ky)),c=Math.min(GPU.bw,Math.ceil(x1*kx)),d=Math.min(GPU.bh,Math.ceil(y1*ky));
  if(c<=a||d<=b)return false;
  pass.setScissorRect(a,b,c-a,d-b);return true;
}
function skyBodyDraw(pass,kind,box){
  if(!skyClip(pass,box[0],box[1],box[2],box[3]))return;
  gpuField(pass,"gsb."+kind,GSB_HEAD+GSB_WGSL[kind],GSB,[]);
  pass.setScissorRect(0,0,GPU.bw,GPU.bh);
}
/* свет и тень гиганта — законы 19b (M178, M242, лаборатория 10.09): тело в тон
   звезде, не темнее воздуха, отличается от воздуха, терминатор ≥ 72, не ярче
   своей звезды */
function skyGiantCols(p){
  const st=hex2rgb((G.sys&&G.sys.cls&&G.sys.cls.col)||"#ffe08a");
  const c1=hueToward(skyTint(p,3),st,.30),c2=skyTint(p,1);
  let lit=c1.map((v,i)=>clamp(v*.55+st[i]*.42+26,0,255)|0);
  let shd=c2.map((v,i)=>clamp(v*.34+st[i]*.06+10,0,255)|0);
  const nite=surfNight(p);
  const airF=[0,1,2].map(i=>lerp(p.T.sky[0][i],p.T.sky[1][i],nite)|0);
  lit=lit.map((v,i)=>clamp(Math.max(v,airF[i]+42),0,255)|0);
  shd=shd.map((v,i)=>clamp(Math.max(v,airF[i]+12),0,255)|0);
  const airM=(airF[0]+airF[1]+airF[2])/3;
  const sep=(c,mn)=>{const d=(c[0]+c[1]+c[2])/3-airM;if(Math.abs(d)>=mn)return c;
    const k=(d>=0?1:-1)*(mn-Math.abs(d));return c.map(v=>clamp(v+k,0,255)|0);};
  lit=sep(lit,34);shd=sep(shd,18);
  const dLS=(lit[0]+lit[1]+lit[2])/3-(shd[0]+shd[1]+shd[2])/3;
  if(dLS<72){const add=72-dLS;lit=lit.map(v=>clamp(v+add,0,255)|0);}
  const c=starRGB(),sk=clamp((.299*c[0]+.587*c[1]+.114*c[2])/(.299*255+.587*224+.114*138),.3,1);
  if(sk<1){lit=lit.map(v=>v*sk|0);shd=shd.map(v=>v*sk|0);}
  return {lit,shd,airF,sk};
}
const AURORA_HUE=[[[120,255,190],[200,150,255]],[[150,220,255],[236,150,210]],[[200,160,255],[255,160,190]],[[255,190,140],[210,140,230]]];
function gpuSkyBodies(p,camx,camy){
  const pass=gpuScene();if(!pass)return false;
  const R=skyRoll(p);
  const atm=p.T.atm!=="отсутствует";
  const wp=(atm&&typeof weatherPower==="function")?weatherPower(p):0;
  const dim=(atm?.42:1)*(1-wp*.75);
  const U=GSB,t=G.t,nite=surfNight(p),SS=sunSpot(p);
  const set3=(o,c)=>{U[o]=c[0]/255;U[o+1]=c[1]/255;U[o+2]=c[2]/255;};
  const toSun=(x,y)=>{const ux=SS.x-x,uy=SS.y-y,l=Math.hypot(ux,uy)||1;return [ux/l,uy/l];};
  if(dim>=.04){
    const tw=(G.surf&&G.surf.tr?G.surf.tr.W:(G.land&&G.land.tr?G.land.tr.W:9000));
    const px=-(camx-tw*.5)*.05,py=-(camy-260)*.05;
    const u=skyU();
    for(const e of R.bodies){
      const x=e.x*W+px,y=e.y*H+py,r=rng(e.seed);
      U.fill(0);U[3]=dim;U[15]=(hashi(e.seed,1,7)%997)*.5+3;U[23]=t;
      const k=e.k;
      if(k==="giant"||k==="rings"){
        const Rr=u*.17*e.s*(k==="rings"?.8:1),C=skyGiantCols(p);
        const hasRing=k==="rings"||r()<.45,tilt=-.28-r()*.4;
        U[0]=x;U[1]=y;U[2]=Rr;U[3]=dim*.95;
        set3(4,C.lit);U[7]=C.sk;set3(8,C.shd);U[11]=atm?1:0;
        const us=toSun(x,y);U[12]=us[0];U[13]=us[1];U[14]=tilt;
        set3(16,C.airF);set3(20,[255,190,150]);
        U[24]=(r()-.5)*1.4;U[25]=(r()-.5)*.8;U[26]=r()<.6?1:0;
        U[32]=hasRing?1:0;U[33]=e.spin;
        const b=Rr*(hasRing?1.9:1.32);
        skyBodyDraw(pass,"giant",[x-b,y-b,x+b,y+b]);
      }else if(k==="moon"){
        const Rr=u*.035*e.s;
        const c=hueToward(skyTint(p,4),hex2rgb((G.sys&&G.sys.cls&&G.sys.cls.col)||"#ffe08a"),.34).map(v=>Math.round(v*.75+30));
        U[0]=x;U[1]=y;U[2]=Rr;U[3]=dim*.95;set3(4,c);U[11]=atm?1:0;
        const us=toSun(x,y);U[12]=us[0];U[13]=us[1];U[14]=Math.sin(e.ph)*.8;U[15]=(hashi(e.seed,2,9)%997)*.37;
        skyBodyDraw(pass,"moon",[x-Rr*2.2,y-Rr*2.2,x+Rr*2.2,y+Rr*2.2]);
      }else if(k==="world"){
        const Rr=u*.12*e.s,K=SKY_WORLD_KINDS[e.seed%SKY_WORLD_KINDS.length];
        U[0]=x;U[1]=y;U[2]=Rr;U[3]=dim*.96;
        set3(4,K.sea);U[7]=.34+(((e.seed^0x77A9)>>>7)&255)/255*.34;set3(8,K.land);U[11]=atm?1:0;
        const us=toSun(x,y);U[12]=us[0];U[13]=us[1];U[14]=e.spin;
        set3(20,K.cap);U[27]=K.cloud;
        skyBodyDraw(pass,"world",[x-Rr*1.25,y-Rr*1.25,x+Rr*1.25,y+Rr*1.25]);
      }else if(k==="galaxy"){
        const Rr=u*.30*e.s,tilt=(r()-.5)*1.5+(e.spin-Math.PI)*.2;
        U[0]=x;U[1]=y;U[2]=Rr;U[3]=dim*.8;set3(4,skyTint(p,4));U[14]=tilt;
        skyBodyDraw(pass,"galaxy",[x-Rr*1.15,y-Rr*1.15,x+Rr*1.15,y+Rr*1.15]);
      }else if(k==="hole"){
        const Rr=u*.075*e.s;
        U[0]=x;U[1]=y;U[2]=Rr;U[3]=1;U[4]=atm?nite*.85/.62:1;U[5]=atm?.35+nite*.5/.62:1;U[14]=-.22+(e.spin-Math.PI)*.12;
        U[4]=Math.min(U[4],1);U[5]=Math.min(U[5],1);
        skyBodyDraw(pass,"hole",[x-Rr*3.5,y-Rr*3.5,x+Rr*3.5,y+Rr*3.5]);
      }else if(k==="aurora"){
        const hh=H*(.18+r()*.22)*e.s,HU=AURORA_HUE[e.seed%4];
        U[0]=x;U[1]=H*.02+r()*H*.06;U[2]=hh;
        U[3]=(atm?.55:.35)*(atm?.35+.65*Math.min(1,nite/.5):1)*(1-wp*.75);
        set3(4,HU[0]);set3(8,HU[1]);
        skyBodyDraw(pass,"aurora",[x-W*.62,0,x+W*.62,U[1]+hh*1.1+10]);
      }else if(k==="nebula"){
        const w=W*(.5+e.s*.6),h=H*(.28+e.s*.3);
        const NC=skyNebCols(p,hex2rgb((G.sys&&G.sys.cls&&G.sys.cls.col)||"#ffe08a"));
        U[0]=x;U[1]=y+h*.1;U[3]=dim;set3(4,NC[0]);set3(8,NC[1]);U[16]=w*.5;U[17]=h*.5;
        skyBodyDraw(pass,"nebula",[x-w*.55,y-h*.45,x+w*.55,y+h*.65]);
      }else if(k==="comet"){
        const tt=((t*.00035+e.ph/TAU)%1),cx=W*(1.15-tt*1.3),cy=y+Math.sin(tt*Math.PI)*H*.1;
        const len=u*.12*e.s,us=toSun(cx,cy);
        U[0]=cx;U[1]=cy;U[2]=len;U[3]=dim*.9;U[12]=-us[0];U[13]=-us[1];U[14]=e.spin<Math.PI?1:-1;
        skyBodyDraw(pass,"comet",[cx-len*1.1,cy-len*1.1,cx+len*1.1,cy+len*1.1]);
      }else if(k==="pulsar"){
        const per=90+(e.seed%120),ph=(t%per)/per,f=Math.pow(Math.max(0,Math.sin(ph*Math.PI)),12);
        const L=u*.2*e.s*f;
        U[0]=x;U[1]=y;U[2]=L;U[3]=dim;U[4]=f;U[14]=e.spin;
        const b=Math.max(L,34);
        skyBodyDraw(pass,"pulsar",[x-b,y-b,x+b,y+b]);
      }else if(k==="field"){
        U[0]=x;U[1]=y;U[2]=e.s;U[3]=dim*.7;
        const bx=W*.21*e.s+4,by=W*.07*e.s+4;
        skyBodyDraw(pass,"field",[x-bx,y-by,x+bx,y+by]);
      }
    }
  }
  /* календарь неба (06a): парад и комета — поверх тел, под облаками */
  const C=(typeof celNow==="function")?celNow():{};
  if(C.conj){
    U.fill(0);U[0]=C.conj.n;U[1]=.14+.22*C.conj.k;
    skyBodyDraw(pass,"parade",[0,0,W*.85,H*.4]);
  }
  if(C.comet){
    const a=C.comet.ang,x=W*.2+Math.cos(a)*W*.3,y=H*.2+Math.sin(a)*H*.12,len=60+120*C.comet.k;
    U.fill(0);U[0]=x;U[1]=y;U[2]=len;U[3]=C.comet.k;U[12]=-Math.cos(a-.4);U[13]=-Math.sin(a-.4);U[14]=1;
    skyBodyDraw(pass,"comet",[x-len*1.1,y-len*1.1,x+len*1.1,y+len*1.1]);
  }
  return true;
}
