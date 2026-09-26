/* ══════════════ корпус корабля на видеокарте (15/n п.2, DESIGN-gpu §L.S) ══════════════
   2D-корпус на #c стоил кадру дважды: печка тела перекладывалась в слой каждый кадр,
   а emit() делал из огней и факела источники по порогу. Здесь тело — та же выпечка
   hullPart1..3 (03e1), но одна на корпус и масштаб, при крене 0: крен даёт сжатие
   по размаху в самом спрайте, свет звезды кладёт gpuLitSprite по рельефу (как
   пиратам и станциям). Живое — в проходе сцены с явным светом: брюхо крена, факелы
   (поле, длина сглажена, поток шума вместо rndFx), ходовые огни, тормозные языки,
   полоса уровня двигателя, огни бегущей строки и венцы. Тело — одна выпечка на корпус
   с мипами на холсте видеокарты (08ca gpuBake, 25.09): кисти 03e рисуют в него, как в
   2D, зум берёт уровень, а не перепекает и не грузит. */
const HG_BAKE=new WeakMap();   // h → Map(ключ → {B,E,sb}) выпечка тела при крене 0
/* корпуса живут в HULL_CACHE вечно — потолок общий на все: HG_KEEP недавних выпечек, старейшая долой
   (ревью 25.09 п. 4: призраки «оставленного» копили мастера до 1024²) */
const HG_LRU=new Map(),HG_KEEP=8;   /* обход 15 систем (26.09): в полёте одна выпечка корпуса — свой корабль */
const HG_BELLY=new WeakMap();  // h → {B,E,sb} тёмный силуэт брюха
const HG_THR=new Map();        // id → сглаженная тяга 0..1 (эфемерное, не в сейве)
const HG_SIDE=1024;
/* уровень мипа сдвинут к резкому: трилинейка смешивает два уровня, а примета
   изготовителя (makerRead) держится резкостью мелкого плана. HG_LOD — и станциям (17c3);
   тело корабля — HG_BODY_LOD −.45: его мипы теперь коробка 2×2 выпечки (08ca), а не уменьшение
   Skia 2D-мастера; на −.35 резкость −1.2 % у одного корпуса, на −.45 все не ниже, рябь та же (25.09) */
const HG_LOD=-.35,HG_BODY_LOD=-.45;
function hullGpuE(h){return Math.max(h.nose,-h.tail,h.bw*3)*1.6+8;}
/* масштаб мастера: вдвое больше самого крупного корабля в полёте (shipScaleCap у
   ZOOM_MAX) в пикселях сцены, шагом в четверть октавы — зум его не меняет вовсе */
function hullGpuSb(h,dk){
  const x=2*shipScaleCap(ZOOM_MAX)*dk,sb=Math.pow(2,Math.ceil(Math.log2(x)*4)/4);
  return Math.min(sb,HG_SIDE/(2*hullGpuE(h)));
}
function hullGpuBake(h,id,sb){
  let M=HG_BAKE.get(h);if(!M){M=new Map();HG_BAKE.set(h,M);}
  const key=hullBakeKey(id,sb);let b=M.get(key);
  if(b){const q=b.q;HG_LRU.delete(q);HG_LRU.set(q,[M,key]);return b;}
  const E=hullGpuE(h),side=Math.ceil(E*2*sb);
  /* кисти читают только корпус и ключ — выпечка после потери устройства та же */
  const B=gpuBake(side,side,g=>{g.setTransform(sb,0,0,sb,side/2,side/2);hullPart1(h,id,0,false);hullPart2(h);hullPart3(h,id);},{ss:1,mat:sb});   /* mat — материал раз на корпус (08cd) */
  if(!B)return null;
  if(M.size>=4){const k=M.keys().next().value;HG_LRU.delete(M.get(k).q);gpuBakeDrop(M.get(k).B);M.delete(k);}
  b={B,E:side/(2*sb),sb,q:{}};M.set(key,b);HG_LRU.set(b.q,[M,key]);
  while(HG_LRU.size>HG_KEEP){const [q,[M0,k0]]=HG_LRU.entries().next().value;HG_LRU.delete(q);
    const o=M0.get(k0);if(o){gpuBakeDrop(o.B);M0.delete(k0);}}
  return b;
}
function hullGpuBelly(h,sb){
  let b=HG_BELLY.get(h);if(b&&b.sb===sb)return b;if(b)gpuBakeDrop(b.B);
  const E=hullGpuE(h),side=Math.ceil(E*2*sb);
  const B=gpuBake(side,side,g=>{g.setTransform(sb,0,0,sb,side/2,side/2);tracePoly(h.poly);g.fillStyle=rgba(h.dark,.85);g.fill();},{ss:1});
  b={B,E:side/(2*sb),sb};HG_BELLY.set(h,b);return b;
}
/* факелы: перо, зарево и ядро одной формулой на все сопла. Цвет — подпись
   изготовителя (makerFlame) или люкс (холодная игла); ядро светит выше единицы */
const HG_FLAME_WGSL=`
fn fh(p:vec2f)->f32{var q=fract(vec3f(p.xyx)*.1031);q=q+dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
fn fn2(p:vec2f)->f32{let i=floor(p);let f=fract(p);let w=f*f*(3.-2.*f);
  return mix(mix(fh(i),fh(i+vec2f(1.,0.)),w.x),mix(fh(i+vec2f(0.,1.)),fh(i+vec2f(1.,1.)),w.x),w.y);}
fn st4(t:f32,a:f32,b:f32,c0:vec4f,c1:vec4f,c2:vec4f,c3:vec4f)->vec4f{
  if(t<a){return mix(c0,c1,t/a);} if(t<b){return mix(c1,c2,(t-a)/(b-a));} return mix(c2,c3,(t-b)/(1.-b));}
fn field(p:vec2f,uv0:vec2f)->vec4f{
  let dp=p-fu.v[0].xy;let ro=fu.v[0].zw;let sc=fu.v[1].x;let cb=max(fu.v[1].y,.05);let tm=fu.v[1].z;let n=i32(fu.v[1].w);
  var l=vec2f(dot(dp,ro),dot(dp,vec2f(-ro.y,ro.x)))/sc;l.y=l.y/cb;
  let px=1./sc;let md=fu.v[3].x;let tn=fu.v[4].rgb;let W=vec3f(1.);
  var gc=vec3f(1.,.62,.34);var ga=.34;
  if(md>1.5){gc=mix(tn,W,.3);}else if(md>.5){gc=vec3f(.588,.804,1.);ga=.2;}
  var acc=vec3f(0.);
  for(var i=0;i<4;i++){
    if(i>=n){break;}
    let e=fu.v[5+i];let r=e.z;let f=e.w;if(f<=0.){continue;}
    let u=e.x-l.x;let v=l.y-e.y;
    let gd=length(vec2f(u-.25*f,v))/(1.15*f);
    if(gd>1.&&(u<-px||u>f||abs(v)>r)){continue;}
    let ag=max(1.-gd,0.)*ga;
    /* перо: ширина спадает к хвосту, край несёт поток шума — к хвосту сильнее */
    let tt=clamp(u/f,0.,1.);
    let nz=fn2(vec2f(u/r*1.2-tm*.55,v/r*1.6+fu.v[9+i].x))-.5;
    let hw=r*(1.-tt)*(1.-.35*tt)*(1.+.5*nz*tt);
    let ap=smoothstep(-px,px,hw-abs(v))*step(-px,u)*step(u,f);
    var cp:vec4f;
    if(md>1.5){cp=st4(tt,.22,.6,vec4f(1.,.988,.957,.95),vec4f(mix(tn,W,.35),.86),vec4f(tn,.42),vec4f(tn*.8,0.));}
    else if(md>.5){cp=st4(tt,.24,.62,vec4f(1.,1.,1.,.95),vec4f(.776,.91,1.,.8),vec4f(.494,.698,1.,.34),vec4f(.353,.549,.941,0.));}
    else{cp=st4(tt,.2,.58,vec4f(1.,.965,.863,.95),vec4f(1.,.761,.439,.86),vec4f(1.,.455,.243,.42),vec4f(1.,.275,.157,0.));}
    let apa=ap*cp.a*(1.-.35*max(nz,0.)*tt);
    /* ядро: у горячей тяги узкий клин на две пятых пера, у люкса мягкая капля */
    let cool=md>.5&&md<1.5;
    let cf=select(.4,.5,cool)*f;let tc=clamp(u/cf,0.,1.);
    let hc=select(.46*r*(1.-tc),.3*r*(1.-tc)*(1.-.6*tc),cool);
    let ac=smoothstep(-px,px,hc-abs(v))*step(-px,u)*step(u,cf)*select(.8,.85*(1.-tc),cool);
    let cc=select(vec3f(1.,1.,.949),mix(W,vec3f(.824,.922,1.),tc),cool);
    acc=acc+cc*ac*fu.v[3].y+(1.-ac)*(cp.rgb*apa*fu.v[3].z+(1.-apa)*gc*ag*fu.v[3].w);
  }
  return vec4f(acc,0.);
}`;
const HG_U=new Float32Array(60);
/* свет факела: ядро, перо, зарево. Прежний ореол давало emit() над #c; в сцене
   свечение начинается с 1.4, поэтому зарево несёт его само (пара 760, 25.09) */
const HG_GAIN=[2.6,1,1.2];
function hullGpuFlames(pass,h,id,x,y,a,sc,cb,thr,lvl){
  const MF=(typeof makerFlame==="function")?makerFlame(h.by):null;
  let p=HG_THR.get(id)||0;p+=((thr?1:0)-p)*.22;if(p<.004)p=0;HG_THR.set(id,p);
  if(!p)return;
  const U=HG_U;U.fill(0);
  U[0]=x;U[1]=y;U[2]=Math.cos(a);U[3]=Math.sin(a);U[4]=sc;U[5]=cb;U[6]=G.t/60;
  const tint=MF&&MF.col,cool=!!h.lux,pow=1+(lvl||0)*.22;
  U[12]=cool?1:(tint?2:0);U[13]=HG_GAIN[0];U[14]=HG_GAIN[1];U[15]=HG_GAIN[2];
  if(tint){U[16]=tint[0]/255;U[17]=tint[1]/255;U[18]=tint[2]/255;}
  let n=0;
  for(const e of h.eng){if(n>=4)break;
    const r=e.r*(MF?MF.w:1),ph=n*1.7+(e.y||0)*.37;
    /* длина дышит плавно: сумма медленных синусов вместо броска rndFx каждый кадр */
    const w=.5+.5*(Math.sin(G.t*.23+ph)*.6+Math.sin(G.t*.61+ph*2.3)*.4);
    const f=r*(cool?1.5+w*.8:2.4+w*1.7)*pow*p;
    const k=20+n*4;U[k]=e.x;U[k+1]=e.y;U[k+2]=r;U[k+3]=f;U[36+n*4]=ph*3.1;n++;}
  U[7]=n;
  gpuField(pass,"hgflame",HG_FLAME_WGSL,U,null,{blend:"add"});
  /* f) огонь светит корму (§L.S): точка у среза сопел (среднее по радиусу), досягаемость — сопло и ~.3
     языка; цвет — ореол пламени. Второй свет корпуса — нарушение «одного света», названное */
  let sx=0,sy=0,sw=0,rc=0;
  for(let i=0;i<n;i++){const k=20+i*4,r=U[k+2],f=U[k+3];sx+=(U[k]-f*.1)*r;sy+=U[k+1]*r;sw+=r;rc=Math.max(rc,r*2.6+f*.3);}
  if(!sw)return null;
  const gc=cool?[.588,.804,1]:tint?mixc(tint,[255,255,255],.3).map(v=>v/255):[1,.62,.34];
  return {x:sx/sw,y:sy/sw,r:rc,k:p,c:gc};
}
/* живые вставки поверх тела: огни строки Компании (makerTicks) и венцы (drawCrowns) —
   те же места и цвета в осях корпуса; повёрнутые прямоугольники — капсулами */
function hullGpuInserts(pass,h,id,S,sc,live){
  const O=[],A=[];
  if(live.ticks)for(const o of h.outs)if(o.k==="runline")for(const s of [1,-1]){const y=o.y*s;
    for(let k=0;k<5;k++){const x=o.x-o.l+k*o.l*.2+((G.t*.6)%(o.l*.2))+o.l*.025,hw=o.l*.025;
      const [x0,y0]=S(x,y-o.w*.4+hw),[x1,y1]=S(x,y+o.w*.4-hw);O.push([2,x0,y0,x1,y1,hw*sc,0,200,235,255,.9]);}}
  if(live.crowns){const list=NODE_FAMS.filter(f=>G.crowns[f.id]),x0=h.tail+5,step=4.6,rows=[[],[]];
    list.forEach((F,i)=>rows[i%2].push(F));
    rows.forEach((row,s0)=>{if(!row.length)return;
      const y=(s0?1:-1)*(h.tailW*.5+2.6),w=row.length*step,[a0,b0]=S(x0-1.6+1.9,y),[a1,b1]=S(x0+w-1.9,y);
      O.push([2,a0,b0,a1,b1,2.15*sc,0,255,255,255,.14],[2,a0,b0,a1,b1,1.9*sc,0,0,0,0,.45]);
      row.forEach((F,k)=>{const c=mixc(hex2rgb(F.col),[255,255,255],.4),pu=.65+.35*Math.sin(G.t*.06+k*1.3+s0),[px,py]=S(x0+k*step+step*.5-.6,y);
        O.push([1,px,py,1.05*sc,0,0,0,c[0],c[1],c[2],.95*pu]);});});
    const c=hex2rgb(list[0].col),r=(7+list.length*2.2)*sc,[gx,gy]=S(x0,0);
    A.push([1,gx,gy,sc,0,0,r,c[0],c[1],c[2],.14]);}   /* как радиальный градиент 2D: от .14 в центре к нулю на r */
  if(O.length)gpuShapes(pass,O);if(A.length)gpuShapes(pass,A,{blend:"add"});
}
/* корабль целиком; x,y — экран, a — курс, sc — масштаб корабля, (lx,ly) — к звезде.
   false — прохода сцены нет, рисуй по-старому */
function hullGpuDraw(id,x,y,a,sc,thrusting,braking,lvl,bank,lx,ly){
  const pass=gpuScene();if(!pass||!(sc>0))return false;
  const h=hullOf(id),live=hullLiveInserts(h,id);
  const dk=GPU.bw/W,sb=hullGpuSb(h,dk),B=hullGpuBake(h,id,sb);if(!B)return false;const T=B.B;
  const lod=Math.max(0,Math.log2(B.sb/(sc*dk))+HG_BODY_LOD);
  bank=bank||0;lvl=lvl||0;
  const cb=Math.cos(bank),ca=Math.cos(a),sa=Math.sin(a);
  const S=(px,py)=>{py*=cb;return [x+(px*ca-py*sa)*sc,y+(px*sa+py*ca)*sc];};   /* точка корпуса → экран */
  const FL=hullGpuFlames(pass,h,id,x,y,a,sc,cb,thrusting,lvl);
  /* сопла без тяги: у люкса кольцо среза, у прочих тлеющий зев */
  if(!thrusting){
    const sh=[],gl=[];
    for(const e of h.eng){const [ex,ey]=S(e.x+e.r*.1,e.y),q=(.5+.5*Math.sin(G.t*.13+e.y))*.1;
      if(h.lux){const PAL=luxPal(h),t=mixc(PAL.trim,[255,244,214],.3);
        sh.push([1,ex,ey,e.r*.6*sc,0,0,0,8,12,18,.9],[3,ex,ey,e.r*.6*sc,0,.2*sc,0,t[0],t[1],t[2],.9]);
        gl.push([1,ex,ey,e.r*.3*sc,0,0,e.r*.15*sc,170,215,255,.16+q]);}
      else gl.push([1,ex,ey,e.r*.42*sc,0,0,e.r*.12*sc,255,140,70,.2+q*1.2]);}
    if(sh.length)gpuShapes(pass,sh);
    gpuShapes(pass,gl,{blend:"add"});
  }
  /* брюхо: тёмный силуэт со стороны крена, под телом */
  if(bank){const Bl=hullGpuBelly(h,sb),[bx,by]=S(0,Math.sin(bank)*h.bw*.62);
    if(Bl.B)gpuImage(pass,Bl.B,[{x:bx,y:by,w:Bl.E*2*sc,h:Bl.E*2*sc*cb,rot:a}]);}
  const FS=FL?S(FL.x,FL.y):null;
  gpuLitSprite(T,x,y,B.E*sc,sc,a,lx,ly,-1,cb,lod,null,undefined,undefined,FL&&{x:FS[0],y:FS[1],r:FL.r*sc,k:FL.k,c:FL.c});   /* -1: свет корпуса, не станции (17c GST) */
  /* круг корпуса в финал (08b u.hl), как у 2D-корпуса: свечение не белит свою обшивку */
  if(GPU.sepH.length<8){if(!h._R){let r=0;for(const q of h.poly)r=Math.max(r,Math.hypot(q[0],q[1]));h._R=r*1.3;}
    GPU.sepH.push([x,y,h._R*sc]);}
  if(live.ticks||live.crowns)hullGpuInserts(pass,h,id,S,sc,live);
  /* тормозные языки у носа — живые, над телом */
  if(braking){const f=4+(.5+.5*Math.sin(G.t*.9))*6,T=[];
    for(const s of [-1,1]){const yy=h.bw*.5*s,[x0,y0]=S(h.nose*.5,yy),[x1,y1]=S(h.nose*.5+f,yy);
      T.push([2,x0,y0,x1,y1,1.1*sc,.6*sc,127,230,216,.7]);}
    gpuShapes(pass,T,{blend:"add"});}
  /* ходовые огни: точка краской и свой узкий ореол; мигание — как было */
  const blink=Math.sin(G.t*.07),L=[],Lg=[];
  for(const [s,c] of [[-1,[255,80,70]],[1,[110,255,150]]]){
    let wy;if(h.wings.length)wy=h.wings[0][2];else{const lx0=h.nose*.18;wy=[lx0,-profW(h.prof,lx0)*1.02];}
    const onS=(typeof cosmLightOn==="function")?cosmLightOn(s,blink,G.t):blink>0,[px,py]=S(wy[0],wy[1]*s),r=(h.yac?.7:1.25)*sc;
    L.push([1,px,py,r,0,0,0,c[0],c[1],c[2],onS?.95:.25]);
    if(onS)Lg.push([1,px,py,r*.6,0,0,r*1.6,c[0],c[1],c[2],.55]);}
  gpuShapes(pass,L);if(Lg.length)gpuShapes(pass,Lg,{blend:"add"});
  if(lvl>1){const [x0,y0]=S(h.tail*.35,-h.bw-lvl*.7),[x1,y1]=S(h.tail*.35,h.bw+lvl*.7);
    gpuShapes(pass,[[2,x0,y0,x1,y1,.5*sc,0,180,240,255,.16+lvl*.07]]);}
  return true;
}
