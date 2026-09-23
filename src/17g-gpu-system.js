/* ══════════════ система под планетами на видеокарте (G2, docs/DESIGN-gpu.md) ══════════════
   Всё, что drawSystem клал между фоном и планетами: орбиты с хвостами комет, кольцо
   станции, полоса и точки пояса, светило любого вида и его зарево. Данные и законы
   прежние (кеплеров эллипс, хвост по ходу аномалии, зарево в мировых координатах,
   пустое внутри короны); лучше, чем в 2D:
   · орбита — точный эллипс по формуле на каждый пиксель, а не 48-угольник: на
     крупном зуме у 2D проступали изломы; хвост кометы — непрерывный, толще у
     головы и сходит на нет, а не девять ступенек яркости;
   · полоса пояса — с мягкими краями, а не обруч с резкой кромкой;
   · звезда — фотосфера с потемнением к краю и живой грануляцией (у гиганта ячейки
     крупнее), корона — стримеры из шума, медленно вращаются, вместо четырнадцати
     плоских треугольников; лучи — с растушёвкой по формуле, без трёх клиньев;
   · зарево — по той же кривой, но точно, а не шестнадцатью стопами градиента;
   · нейтронная: лучи с гауссовым краем вместо прямоугольника;
   · чёрная дыра (G2b): фон за ней собран линзой в кольцо Эйнштейна, диск горячий
     внутри и течёт по Кеплеру, сторона, что летит на нас, ярче и белее (доплер),
     у горизонта — тонкое фотонное кольцо, дальняя сторона диска загнута над тенью. */
const GSY={OA:new Float32Array(24*20),UA:new Float32Array(8),SA:new Float32Array(36),belt:[]};
const GSY_ORB_WGSL=`
struct U{a:vec4f,b:vec4f};
@group(0) @binding(0) var<uniform> u:U;
@group(0) @binding(1) var<storage,read> ob:array<vec4f>;
struct VO{@builtin(position) p:vec4f,@location(0) @interpolate(flat) k:u32};
@vertex fn vs(@builtin(vertex_index) vi:u32,@builtin(instance_index) ii:u32)->VO{
  var c=array(vec2f(0.,0.),vec2f(1.,0.),vec2f(1.,1.),vec2f(0.,0.),vec2f(1.,1.),vec2f(0.,1.));
  let k=ii*5u;let o0=ob[k];let e=o0.z+ob[k+3u].w*2.+ob[k+4u].x+4.;
  let q=(o0.xy-e+c[vi]*2.*e)*u.b.x;
  var o:VO;o.p=vec4f(q.x/u.a.x*2.-1.,1.-q.y/u.a.y*2.,0.,1.);o.k=k;return o;}
@fragment fn fs(i:VO)->@location(0) vec4f{
  let o0=ob[i.k];let o1=ob[i.k+1u];let o2=ob[i.k+2u];let o3=ob[i.k+3u];let o4=ob[i.k+4u];
  let q=i.p.xy/u.b.x;let l=q-o0.xy;
  let x=dot(l,o1.xy);let y=dot(l,vec2f(-o1.y,o1.x))*o1.z;
  let A=o0.z;let B=max(o0.w,.001);
  let f=x*x/(A*A)+y*y/(B*B)-1.;let g=2.*vec2f(x/(A*A),y/(B*B));
  let d=abs(f)/max(length(g),1e-6);
  var al=o2.z;var hw=o3.w;
  if(o2.y>0.){
    let E=atan2(y/B,x/A);let M=E-o1.w*sin(E);
    var dm=o2.x-M;dm=dm-floor(dm/6.2831853)*6.2831853;
    if(dm<o2.y){let t=1.-dm/o2.y;al=al+o2.w*t*t;hw=hw*(1.+.9*t*t);}
  }
  let px=1./u.b.x;
  let cov=1.-smoothstep(hw-o4.x-.5*px,hw+.5*px,d);
  let a=al*cov;return vec4f(o3.rgb*a,a);}`;
const GSY_STAR_WGSL=`
fn sh(p:vec2f)->f32{var q=fract(vec3f(p.xyx)*.1031);q=q+dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
fn sn(p:vec2f)->f32{let i=floor(p);let f=fract(p);let w=f*f*(3.-2.*f);
  return mix(mix(sh(i),sh(i+vec2f(1.,0.)),w.x),mix(sh(i+vec2f(0.,1.)),sh(i+vec2f(1.,1.)),w.x),w.y);}
fn sf(p0:vec2f)->f32{var p=p0;var s=0.;var a=.5;
  for(var k=0;k<4;k++){s=s+a*sn(p);p=mat2x2f(1.6,1.2,-1.2,1.6)*p+vec2f(3.1,7.7);a=a*.5;}
  return s;}
fn lrot(d:vec2f,a:f32)->vec2f{let c=cos(a);let s=sin(a);return vec2f(c*d.x+s*d.y,-s*d.x+c*d.y);}
fn edist(l:vec2f,A:f32,B:f32)->f32{let f=l.x*l.x/(A*A)+l.y*l.y/(B*B)-1.;
  return abs(f)/max(length(2.*vec2f(l.x/(A*A),l.y/(B*B))),1e-6);}
fn over(acc:vec4f,s:vec4f)->vec4f{return s+acc*(1.-s.a);}
/* одно светило: фотосфера (закрывает фон), корона со стримерами, ореол, четыре луча */
fn star(p:vec2f,sv:vec4f,cv:vec4f,t:f32,big:f32,px:f32)->vec4f{
  let d=p-sv.xy;let R=sv.z;let heat=sv.w;let col=cv.rgb;let rr=length(d);let r=rr/R;
  if(cv.w<.5||r>9.5){return vec4f(0.);}
  /* диск маленький (белое ядро — точка, а не блин), у гиганта крупнее */
  let Rd=mix(.24,.42,big);let dir=d/max(rr,1e-4);
  var e=vec3f(0.);
  let breath=.93+.07*sin(t*.04);
  {
    /* корона: тугой ореол у диска и слабые стримеры дальше; без порога по
       радиусу — ступень была бы видна кольцом */
    let n=sf(lrot(dir,t*.0014)*(2.4+big)+vec2f(r*.45,-r*.3)+vec2f(0.,t*.002));
    let x=max(r-Rd,0.);
    e=e+col*(exp(-x*2.6)*.85+exp(-x*.9)*.2*(.6+.8*n))*breath;
  }
  e=e+col*.15*heat*pow(clamp(1.-(r-.3)/6.7,0.,1.),2.2)*smoothstep(Rd*.9,Rd*1.3,r);
  e=e+col*.03*exp(-pow((r-2.3)/.3,2.));
  for(var i=0;i<4;i++){
    let a=f32(i)*1.5707963+.2;let ax=vec2f(cos(a),sin(a));
    let s=dot(d,ax)/R;let q=abs(dot(d,vec2f(-ax.y,ax.x)))/R;
    let len=(4.2+1.2*sin(t*.02+f32(i)))*heat;
    if(s>Rd*.6&&s<len){let k=(s-Rd*.6)/(len-Rd*.6);
      let w=max(.05*(1.-k)+.006,.7*px/R);
      e=e+col*.36*(1.-k)*smoothstep(Rd*.6,Rd*1.4,s)*exp(-q*q/(w*w))*(.6+.4*exp(-q*q/(w*w*.12)));}
  }
  var photo=vec4f(0.);var gl=1.;
  if(r<Rd+.06){
    let rn=min(r/Rd,1.);let mu=sqrt(max(0.,1.-rn*rn));
    let lk=1.-mu;let limb=1.-(.5+.15*big)*lk-(.25+.1*big)*lk*lk;
    let gs=(5.+6.*(1.-big))/Rd;
    let ga=.32+.3*big;let gr=1.-ga*.5+ga*sf(d/R*gs+vec2f(t*.0015,-t*.001));
    /* белизна — от жара: гигант холодный и остаётся оранжевым, карлик — добела */
    let wh=mix(.12,.85,clamp((heat-.7)/.3,0.,1.));
    let hot=mix(col,vec3f(1.,.99,.965),wh*mu*mu);
    let cov=clamp((Rd*R-rr)/(2.*px)+.5,0.,1.);
    /* гигант холоднее — и поверхность у него тусклее: выдержка меньше */
    let I=hot*limb*mix(1.,gr,mu)*mix(2.2,1.35,big);
    photo=vec4f(I*cov,cov);
    gl=1.-.6*cov*mu;   /* засветка над серединой диска слабее — цвет поверхности не выцветает */
  }
  /* тон — один на диск и корону: 1−exp(−x) вместо обрезки на единице. Середина
     белая, к лимбу видно потемнение и цвет звезды, плоского пересвеченного блина
     нет; свечение продолжается через край диска, поэтому кромки-обводки нет */
  let tone=vec3f(1.)-exp(-(photo.rgb+e*1.15*gl));
  return vec4f(tone,photo.a);
}
fn bleed(p:vec2f,bv:vec4f,col:vec3f)->vec3f{
  if(bv.w<.5){return vec3f(0.);}
  let t=length(p-bv.xy)/bv.z;if(t>=1.){return vec3f(0.);}
  let inn=min(1.,t/.24);return col*.115*inn*inn*pow(1.-t,2.2);}
fn neutron(p:vec2f,nv:vec4f,rot:f32,px:f32)->vec4f{
  let d=p-nv.xy;let R=nv.z;let f=nv.w;let rr=length(d);
  var e=vec3f(0.);
  let l=lrot(d,rot);let Lb=R*(6.+8.*f);
  if(abs(l.y)<Lb){let k=1.-abs(l.y)/Lb;let sg=R*.13;
    e=e+mix(vec3f(150.,200.,255.),vec3f(225.,240.,255.),k)/255.*(.30+.4*f)*k*exp(-l.x*l.x/(sg*sg));}
  let s=rr/(R*2.6);
  if(s<1.){var a=0.;var c=vec3f(0.);
    if(s<.18){let k=s/.18;a=mix(.95,.5,k);c=mix(vec3f(1.),vec3f(190.,225.,255.)/255.,k);}
    else{let k=(s-.18)/.82;a=.5*(1.-k);c=mix(vec3f(190.,225.,255.),vec3f(120.,180.,255.),k)/255.;}
    e=e+c*a;}
  let el=lrot(d,.4);let de=edist(el,R*3.4,R*1.1);
  e=e+vec3f(170.,210.,255.)/255.*.16*(1.-smoothstep(R*.09-.5*px,R*.09+.5*px,de));
  return vec4f(e,0.);
}
/* чёрная дыра (G2b): линза фона, диск с доплеровской асимметрией, фотонное кольцо.
   Тень — радиус Rs; линза — точечная: источник на β=ρ−θE²/ρ, усиление |ρ⁴/(ρ⁴−θE⁴)|;
   туманность берётся той же текстурой, что у фона (16g), звёзды за дырой — свои,
   из хэша в плоскости источника: они и вытягиваются в дуги у кольца Эйнштейна */
fn hstars(q:vec2f)->f32{
  let c=floor(q/13.);let h=sh(c+vec2f(17.,3.));
  if(h<.9){return 0.;}
  let o=(vec2f(sh(c+vec2f(5.,9.)),sh(c+vec2f(2.,31.)))*.6+.2)*13.;
  let dd=q-c*13.-o;return (h-.9)*9.*exp(-dot(dd,dd)/.5);}
fn disc(l:vec2f,Rs:f32,t:f32,px:f32)->vec4f{
  /* плоскость диска: наклон .24, от 1.5Rs до 3.8Rs; горячее внутри */
  let q=vec2f(l.x,l.y/.24);let rd=length(q);let ri=Rs*1.5;let ro=Rs*3.8;
  if(rd<ri*.8||rd>ro*1.1){return vec4f(0.);}
  let ph=atan2(q.y,q.x);let Tk=pow(ri/max(rd,ri),.75);
  /* поток: кеплеров сдвиг — внутренние нити обгоняют внешние */
  let w=t*.02*pow(ri/rd,1.5);
  let n=sf(vec2f((ph+w)*3.2,rd/Rs*2.6))*.7+sf(vec2f((ph+w)*9.,rd/Rs*7.))*.5;
  let edge=smoothstep(ri*.85,ri*1.05,rd)*(1.-smoothstep(ro*.7,ro*1.08,rd));
  /* доплер: левая сторона летит на нас — ярче и белее, правая — тусклее и краснее */
  let los=-cos(ph)*.42*sqrt(ri/rd);
  let dop=pow(1.+los,3.);
  var col=mix(vec3f(1.,.42,.16),vec3f(1.,.86,.62),Tk);
  col=mix(col,vec3f(.86,.92,1.),clamp(los*1.3,0.,.65));
  col=col*mix(vec3f(1.),vec3f(1.,.62,.45),clamp(-los*1.6,0.,1.));
  let I=col*Tk*Tk*1.5*dop*(.45+.75*n)*edge;
  let a=clamp(edge*(.35+.5*Tk),0.,1.);
  return vec4f(I,a);
}
fn hole(p:vec2f,hv:vec4f,nb:vec4f,t:f32,px:f32)->vec4f{
  let d=p-hv.xy;let Rs=hv.z*.8;let rr=length(d);let dir=d/max(rr,1e-4);
  var acc=vec4f(0.);
  /* 1. линза: фон за дырой, собранный кольцом Эйнштейна */
  let tE=Rs*2.1;let wl=1.-smoothstep(Rs*4.,Rs*7.5,rr);
  if(wl>0.){
    let src=hv.xy+dir*(rr-tE*tE/max(rr,1e-3));
    let r4=rr*rr*rr*rr;let e4=tE*tE*tE*tE;
    let mag=min(abs(r4/max(abs(r4-e4),1.)),7.);
    var bg=vec3f(0.);
    /* у кольца линза тянет фон по радиусу в разы — одна выборка давала рябь
       кругами; четыре выборки на размер пикселя в плоскости источника, а у самого
       кольца — шире: полосы туманности, стянутые в круги, читались муаром */
    if(nb.z>0.){let j=max(px*(1.+tE*tE/max(rr*rr,1.))*1.8,Rs*.3*exp(-pow((rr-tE)/(Rs*1.4),2.)));let tg=vec2f(-dir.y,dir.x);
      for(var k=0;k<4;k++){let o=select(-1.,1.,k%2==0)*select(dir,tg,k<2)*j;
        bg=bg+textureSampleLevel(t0,smp,(src+o-nb.xy)/nb.zw,0.).rgb*.25;}}
    /* свои звёзды — редкие, как у фона, который линза закрыла, и ярче там, где она
       их усиливает (дуги у кольца); не из-за самой тени: иначе одна звезда за центром рисует циркульную окружность */
    let st=hstars(src)*(.35+clamp(mag-1.3,0.,3.))*smoothstep(Rs*.8,Rs*1.6,length(src-hv.xy));
    let a=wl*select(0.,1.,nb.z>0.);
    acc=vec4f(bg*(.85+.15*min(mag,3.))*a+vec3f(1.,.96,.9)*st*wl,a);
  }
  /* 2. задняя половина диска — за тенью */
  let l=lrot(d,-.25);
  var em=vec3f(0.);
  if(l.y<0.){let dk=disc(l,Rs,t,px);acc=over(acc,vec4f(vec3f(1.)-exp(-dk.rgb),dk.a));}
  /* 3. тень горизонта */
  let dc=clamp((Rs-rr)/(1.5*px)+.5,0.,1.);
  acc=over(acc,vec4f(0.,0.,0.,dc));
  /* 4. фотонное кольцо: тонкое, у самой тени, ярче на стороне, что летит к нам */
  let rw=max(Rs*.035,1.1*px);
  let pr=exp(-pow((rr-Rs*1.04)/rw,2.));
  let side=.6+.9*clamp(-l.x/Rs*.5+.5,0.,1.);
  em=em+vec3f(1.,.9,.72)*pr*1.6*side;
  /* 5. изображение дальней стороны диска, загнутое линзой над тенью */
  if(l.y<0.){
    let k=(rr-Rs*1.12)/(Rs*.55);
    if(k>0.&&k<1.){let ang=clamp(-l.y/rr,0.,1.);
      let los=-l.x/rr*.5;
      em=em+mix(vec3f(1.,.55,.25),vec3f(1.,.9,.75),1.-k)*pow(1.+los,3.)*ang*sin(3.1416*k)*.55;}
  }
  acc=over(acc,vec4f(vec3f(1.)-exp(-em),0.));
  /* 6. ближняя половина диска — поверх тени */
  if(l.y>=0.){let dk=disc(l,Rs,t,px);acc=over(acc,vec4f(vec3f(1.)-exp(-dk.rgb),dk.a));}
  return acc;
}
fn field(p:vec2f,uv:vec2f)->vec4f{
  let V=fu.v;let kind=V[4].x;let t=V[4].y;let px=1./V[6].w;
  var acc=vec4f(0.);
  if(kind<.5){acc=over(acc,star(p,V[0],V[1],t,V[4].w,px));acc=over(acc,star(p,V[2],V[3],t,V[4].w,px));}
  else if(kind<1.5){acc=over(acc,neutron(p,V[7],V[4].z+t*.006,px));}
  else{acc=over(acc,hole(p,V[7],V[8],t,px));}
  return over(acc,vec4f(bleed(p,V[5],V[6].rgb),0.));
}`;
function gsyUni(){
  const a=GSY.UA;a[0]=GPU.bw;a[1]=GPU.bh;a[2]=W;a[3]=H;a[4]=DPR;
  const U=GPUBufferUsage,b=gpuBuf("gsy.u",32,U.UNIFORM|U.COPY_DST);
  GPU.dev.queue.writeBuffer(b,0,a);return b;
}
/* одна орбита в буфер: центр, полуоси (px), ось перицентра, поворот, e, хвост */
function gsyOrb(n,cx,cy,A,B,ux,uy,sg,e,Mp,span,base,tail,r,g,b,hw,soft){
  const a=GSY.OA,k=n*20;
  a[k]=cx;a[k+1]=cy;a[k+2]=A;a[k+3]=B;a[k+4]=ux;a[k+5]=uy;a[k+6]=sg;a[k+7]=e;
  a[k+8]=Mp;a[k+9]=span;a[k+10]=base;a[k+11]=tail;a[k+12]=r/255;a[k+13]=g/255;a[k+14]=b/255;a[k+15]=hw;
  a[k+16]=soft;a[k+17]=0;a[k+18]=0;a[k+19]=0;
  return n+1;
}
/* кадр эллипса из кеплерова пути: перицентр — точка 0, апоцентр — точка 24, точка 12 задаёт ход */
function gsyEll(p){
  let F=p._gsyE;
  if(!F){
    const O=orbPathOf(p),cx=(O[0]+O[48])/2,cy=(O[1]+O[49])/2;
    const A=Math.hypot(O[0]-O[48],O[1]-O[49])/2||1,ux=(O[0]-cx)/A,uy=(O[1]-cy)/A;
    const sg=((O[24]-cx)*-uy+(O[25]-cy)*ux)<0?-1:1;
    F=p._gsyE={cx,cy,A,B:A*Math.sqrt(Math.max(0,1-(p.ecc||0)*(p.ecc||0))),ux,uy,sg};
  }
  return F;
}
function gsyMean(F,x,y,e){
  const lx=x-F.cx,ly=y-F.cy,px=lx*F.ux+ly*F.uy,py=(-lx*F.uy+ly*F.ux)*F.sg;
  const E=Math.atan2(py/(F.B||1),px/F.A);return E-e*Math.sin(E);
}
function gsyOrbits(pass,sys,ox,oy,Z){
  let n=0;
  for(const p of sys.planets){
    if(n>=22)break;
    const F=gsyEll(p),fade=clamp(1-p.orbit*Z/(W*1.6),.3,1),e=p.ecc||0;
    n=gsyOrb(n,ox+F.cx*Z,oy+F.cy*Z,F.A*Z,F.B*Z,F.ux,F.uy,F.sg,e,gsyMean(F,p.x,p.y,e),9/48*TAU,
             .05*fade,.24*fade,120,190,210,.5,0);
  }
  if(sys.station){const st=sys.station;
    n=gsyOrb(n,ox,oy,st.orbit*Z,st.orbit*Z,1,0,1,0,Math.atan2(st.y,st.x),.9,.04,.15,242,178,92,.5,0);}
  if(sys.belt){const hw=Math.max(.5,30*Z);
    n=gsyOrb(n,ox,oy,sys.belt.orbit*Z,sys.belt.orbit*Z,1,0,1,0,0,0,.09,0,200,200,210,hw,hw*.8);}
  if(!n)return;
  const U=GPUBufferUsage,ob=gpuBuf("gsy.o",GSY.OA.byteLength,U.STORAGE|U.COPY_DST);
  GPU.dev.queue.writeBuffer(ob,0,GSY.OA,0,n*20);
  const P=gpuPipe("gsy.orb",GSY_ORB_WGSL,"over");
  pass.setPipeline(P);pass.setBindGroup(0,gpuBind("gsy.orb",P,[gsyUni(),ob]));pass.draw(6,n);
}
/* точки пояса — круглые той же площади, что квадрат 1.4 px у 2D */
function gsyBeltDots(pass,B,ox,oy,Z){
  const t=beltDots(B),L=GSY.belt;let n=0;
  for(let i=0;i<190;i++){
    const a=t[i*2],rr=(B.orbit+t[i*2+1])*Z,x=ox+Math.cos(a)*rr,y=oy+Math.sin(a)*rr;
    if(x<-2||x>W+2||y<-2||y>H+2)continue;
    const it=L[n]||(L[n]=[1,0,0,.79,0,0,0,170,180,190,.5]);it[1]=x+.7;it[2]=y+.7;n++;
  }
  L.length=n;if(n)gpuShapes(pass,L);
}
function gsyStar(pass,sys,ox,oy,R){
  const st=sysStyle(sys),S=GSY.SA;S.fill(0);
  const put=(o,x,y,r,heat,col)=>{const c=hex2rgb(col);S[o]=x;S[o+1]=y;S[o+2]=r;S[o+3]=heat;
    S[o+4]=c[0]/255;S[o+5]=c[1]/255;S[o+6]=c[2]/255;S[o+7]=1;};
  let kind=0,big=0;
  let tex=null;
  if(st.kind==="hole"){kind=2;S[28]=ox;S[29]=oy;S[30]=R;
    /* линзе нужна туманность фона — та же текстура и та же рамка, что у 16g */
    const C=sysNebComp(sys);
    if(C){const cx=(W/2-ox)*.06,cy=(H/2-oy)*.06,ex=W*.24,ey=H*.24;
      S[32]=-ex/2+clamp(-cx*.012,-ex/2,ex/2);S[33]=-ey/2+clamp(-cy*.012,-ey/2,ey/2);S[34]=W+ex;S[35]=H+ey;tex=C.cv;}}
  else if(st.kind==="neutron"){kind=1;const per=110;
    S[28]=ox;S[29]=oy;S[30]=R;S[31]=Math.pow(Math.max(0,Math.sin((G.t%per)/per*Math.PI)),8);}
  else if(st.kind==="binary"){const a=G.t*.0022+st.phase,d=R*st.sep*1.6;
    put(0,ox+Math.cos(a)*d,oy+Math.sin(a)*d*.42,R*.72,1,sys.cls.col);
    put(8,ox-Math.cos(a)*d*.8,oy-Math.sin(a)*d*.34,R*.5,.8,"#ffb060");}
  else if(st.kind==="giant"){put(0,ox,oy,R*1.85,.72,"#ff7448");big=1;}
  else if(st.kind==="dwarf")put(0,ox,oy,R*.34,1.5,"#e8f4ff");
  else put(0,ox,oy,R,1,sys.cls.col);
  S[16]=kind;S[17]=G.t;S[18]=st.phase||0;S[19]=big;
  /* зарево в мировых координатах: вокруг звезды, без порога по краю кадра */
  const reach=R*30,dx=ox<0?-ox:(ox>W?ox-W:0),dy=oy<0?-oy:(oy>H?oy-H:0);
  const c=hex2rgb(sys.cls.col);
  S[20]=ox;S[21]=oy;S[22]=reach;S[23]=Math.hypot(dx,dy)<reach?1:0;
  S[24]=c[0]/255;S[25]=c[1]/255;S[26]=c[2]/255;S[27]=DPR;
  gpuField(pass,"gsy.star",GSY_STAR_WGSL,S,tex?[tex]:[]);
}
/* всё под планетами — в проход сцены, сразу за фоном (16g) */
function gpuSysUnder(sys,ox,oy,R,Z){
  const pass=gpuScene();if(!pass)return;
  gsyOrbits(pass,sys,ox,oy,Z);
  if(sys.belt)gsyBeltDots(pass,sys.belt,ox,oy,Z);
  gsyStar(pass,sys,ox,oy,R);
}
