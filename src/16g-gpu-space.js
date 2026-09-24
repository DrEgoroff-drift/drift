/* ══════════════ космос на видеокарте (G1, docs/DESIGN-gpu.md) ══════════════
   Фон системы и заставки: туманность (её печёт 2D — сюда она ложится текстурой),
   звёзды и пыль — формулами в шейдере, один вызов на слой вместо сотен fillRect.
   Логика та же, что у drawStars / drawSpaceDust (16-flight, 16a-space): те же
   таблицы, тот же ход камеры starMove и закон «движение, а не мигание».
   Лучше, чем в 2D:
   · звезда — точка с ореолом: круглое тело той же площади, мягкий гауссов ореол
     у ярких и близких, лучи крестика — сходящие на нет, а не палочки в пиксель;
     на ходу тело — капсула-прочерк, ореол и лучи гаснут плавно, без щелчка;
   · туманность живая: печёная текстура (192² на заставке, свой холст в системе)
     растянута на весь экран и была мыльной — шейдер добавляет ей нити и тёмные
     прожилки в полном разрешении экрана и медленно ведёт их течением;
   · пыль с глубиной резкости: дальний слой — мелкий и резкий, ближний — крупные
     размытые пятна. В 2D было наоборот — самые крупные пылинки летели в самом
     дальнем слое (s 1.7 при par .22), и ближний план читался как дальний. */
const SPACE_BG={r:5/255,g:7/255,b:12/255,a:1};
const GSP={stars:null,dustBase:-1,dustN:0,UA:new Float32Array(28),star:null,QA:new Float32Array(24)};
/* размер и мягкость пылинки по слоям DUST_LAYERS (дальний → ближний) */
const GSP_DUST_L=[{s:.75,soft:0,a:1},{s:1.05,soft:0,a:1},{s:2.2,soft:1,a:.26}];
const GSP_WGSL_U=`
struct SP{a:vec4f,b:vec4f,c:vec4f,d:vec4f,e:vec4f,f:vec4f,g:vec4f};
@group(0) @binding(0) var<uniform> u:SP;
fn toClip(p:vec2f)->vec4f{return vec4f(p.x/u.a.x*2.-1.,1.-p.y/u.a.y*2.,0.,1.);}
fn corn(i:u32)->vec2f{var c=array(vec2f(0.,0.),vec2f(1.,0.),vec2f(1.,1.),vec2f(0.,0.),vec2f(1.,1.),vec2f(0.,1.));return c[i];}
struct VO{@builtin(position) p:vec4f,@location(0) col:vec4f,@location(1) @interpolate(flat) g:vec4f,@location(2) @interpolate(flat) h:vec4f};
@fragment fn fs(i:VO)->@location(0) vec4f{
  let p=i.p.xy;var cov=0.;
  if(i.h.x<.5){cov=covRect(p,i.g);}
  else if(i.h.x<1.5){cov=covDisc(p,i.g.xy,i.g.z);}
  else if(i.h.x<2.5){cov=covSeg(p,i.g.xy,i.g.zw,i.h.y);}
  else if(i.h.x<3.5){let d=p-i.g.xy;cov=exp(-3.2*dot(d,d)/(i.g.z*i.g.z));}
  else{let d=abs(p-i.g.xy);let al=select(d.y,d.x,i.g.w>.5);let ac=select(d.x,d.y,i.g.w>.5);
       let f=max(0.,1.-al/i.g.z);cov=exp(-ac*ac/(i.h.y*i.h.y))*f*sqrt(f);}
  let al=i.col.a*cov;return vec4f(i.col.rgb*al,al);}`;
/* a: res.xy, css.xy · b: dpr, t, cx, cy · c: par, mdx, mdy, mov · d: kx, ky, a0, – · e: пыль dcx, dcy, sw, sh */
/* звезда = четыре части: тело, ореол, два луча; на ходу тело — прочерк */
const GSP_STARS=`
@group(0) @binding(1) var<storage,read> st:array<vec4f>;
@vertex fn vs(@builtin(vertex_index) vi:u32,@builtin(instance_index) ii:u32)->VO{
  let s=st[(ii/4u)*2u];let c=st[(ii/4u)*2u+1u];let part=ii%4u;
  let z=s.z;let bright=c.w>.5;let dpr=u.b.x;let mov=u.c.w;
  /* номер среди ярких: лучи — только у первых шести из четырнадцати (в кадре их
     около половины — три-четыре крестика, а не десятки) */
  let bi=i32(ii/4u)-i32(u.d.w);let spiky=bright&&bi<6;
  let px=pmod(s.x*1600.-u.b.z*u.c.x*z,1600.)/1600.*u.a.z;
  let py=pmod(s.y*1200.-u.b.w*u.c.x*z,1200.)/1200.*u.a.w;
  var a=0.;var sz=1.;
  /* яркость по степенному закону: много слабых, мало ярких; пол .2 — слабая звезда видна, как у 2D (L1b 6/n) */
  let zz=clamp((z-.2)/.8,0.,1.);
  if(bright){a=(.42+.4*select(0.,1.,spiky))+.2*sin(u.b.y*.03+s.w)*(1.-mov);}
  else{a=(.2+.55*pow(zz,1.5))*(.76+.24*sin(u.b.y*.045*(.4+z)+s.w)*(1.-mov));sz=select(select(1.,1.4,z>.5),2.1,z>.85);}
  a=a*u.d.z;
  let still=1.-smoothstep(.04,.3,mov);
  let l=vec2f(u.c.y*u.d.x*u.c.x*z,u.c.z*u.d.y*u.c.x*z);let ll=length(l);
  var mode=-1.;var g=vec4f(0.);var hw=0.;
  let ctr=vec2f(px,py)+select(vec2f(sz*.5),vec2f(.6),bright);
  if(part==0u){
    if(bright){
      if(mov>.04&&ll>1.2){mode=2.;g=vec4f(px,py,px+l.x,py+l.y);hw=1.;}
      else{mode=1.;g=vec4f(ctr,1.55,0.);}
    }else{
      if(mov>.04&&z>.4&&ll>1.2){mode=2.;g=vec4f(px,py,px+l.x,py+l.y);hw=sz*.36;}
      else{mode=1.;g=vec4f(ctr,sz*.5641896,0.);}
    }
  }else if(part==1u){
    if(bright){mode=3.;g=vec4f(ctr,8.5,0.);a=a*.42*(.35+.65*still);}
    else if(zz>.9){mode=3.;g=vec4f(ctr,2.6+sz,0.);a=a*.14*(.35+.65*still);}
  }else if(still>.01&&spiky){mode=4.;g=vec4f(ctr,11.,f32(part==2u));hw=.72;a=min(1.,a*1.25)*still;}
  let m=1./dpr;var lo=vec2f(-9.);var hi=vec2f(-8.);
  if(mode==1.){lo=g.xy-g.z-m;hi=g.xy+g.z+m;}
  else if(mode==2.){lo=min(g.xy,g.zw)-hw-m;hi=max(g.xy,g.zw)+hw+m;}
  else if(mode==3.){lo=g.xy-g.z*1.25-m;hi=g.xy+g.z*1.25+m;}
  else if(mode==4.){lo=g.xy-g.z-m;hi=g.xy+g.z+m;}
  var o:VO;o.p=toClip(mix(lo,hi,corn(vi))*dpr);o.col=vec4f(c.rgb,a);
  o.g=select(g*dpr,vec4f(g.xyz*dpr,g.w),mode==4.);o.h=vec4f(mode,hw*dpr,0.,0.);
  return o;}`;
/* пылинка: (u,v,размер,ход слоя) (dx,dy,сдвиг слоя) (альфа слоя, мягкость) */
const GSP_DUST=`
@group(0) @binding(1) var<storage,read> du:array<vec4f>;
@vertex fn vs(@builtin(vertex_index) vi:u32,@builtin(instance_index) ii:u32)->VO{
  let p0=du[ii*3u];let p1=du[ii*3u+1u];let p2=du[ii*3u+2u];let dpr=u.b.x;
  let px=pmod(p0.x*900.+p1.z+(p1.x*u.b.y*.09-u.e.x)*p0.w,900.)/900.*u.e.z-20.;
  let py=pmod(p0.y*900.+p1.w+(p1.y*u.b.y*.09-u.e.y)*p0.w,900.)/900.*u.e.w-20.;
  let soft=p2.y>.5;let c=vec2f(px,py)+p0.z*.5;let m=1./dpr;
  let r=select(p0.z*.5641896,p0.z*.9,soft);let e=select(r,r*1.25,soft);
  /* свет звезды: пылинка ближе к ней теплее и ярче, вдали — холодная серо-голубая */
  let sd=length(c-u.f.xy)/u.a.w;let lit=u.f.w/(1.+sd*sd*6.);
  let col=mix(vec3f(150.,176.,222.)/255.,u.g.rgb,clamp(lit,0.,.85));
  let al=p2.x*u.d.z*(.55+.9*lit);
  /* на ходу ближняя пылинка — росчерк против хода, длиной по своему параллаксу */
  let l=-vec2f(u.c.y,u.c.z)/.06*p0.w*2.2;let ll=length(l);
  var o:VO;
  if(u.c.w>.04&&ll>1.5&&p0.w>.5){
    let hw=max(r*.45,.5);o.p=toClip(mix(min(c,c+l)-hw-m,max(c,c+l)+hw+m,corn(vi))*dpr);
    o.col=vec4f(col,al*clamp(2.2/sqrt(ll),.25,1.));o.g=vec4f(c*dpr,(c+l)*dpr);o.h=vec4f(2.,hw*dpr,0.,0.);
  }else{
    o.p=toClip(mix(c-e-m,c+e+m,corn(vi))*dpr);
    o.col=vec4f(col,al);o.g=vec4f(c*dpr,r*dpr,0.);o.h=vec4f(select(1.,3.,soft),0.,0.,0.);
  }
  return o;}`;
/* туманность: прямоугольник с текстурой (x,y,w,h) в пикселях CSS, (альфа, бикубика,
   сила живой детали); деталь — шум в пикселях CSS прямоугольника, едет вместе с ним */
const GSP_QUAD=`
@group(0) @binding(1) var<storage,read> q:array<vec4f>;
@group(0) @binding(2) var tx:texture_2d<f32>;
@group(0) @binding(3) var sm:sampler;
struct QO{@builtin(position) p:vec4f,@location(0) uv:vec2f,@location(1) @interpolate(flat) k:vec4f,@location(2) @interpolate(flat) r:vec4f};
fn gh(p:vec2f)->f32{var q=fract(vec3f(p.xyx)*.1031);q=q+dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
fn gn(p:vec2f)->f32{let i=floor(p);let f=fract(p);let w=f*f*(3.-2.*f);
  return mix(mix(gh(i),gh(i+vec2f(1.,0.)),w.x),mix(gh(i+vec2f(0.,1.)),gh(i+vec2f(1.,1.)),w.x),w.y);}
fn gf(p0:vec2f)->f32{var p=p0;var s=0.;var a=.5;
  for(var k=0;k<5;k++){s=s+a*gn(p);p=mat2x2f(1.6,1.2,-1.2,1.6)*p+vec2f(3.1,7.7);a=a*.5;}
  return s;}
@vertex fn vs(@builtin(vertex_index) vi:u32,@builtin(instance_index) ii:u32)->QO{
  let r=q[ii*2u];let k=q[ii*2u+1u];let cn=corn(vi);
  var o:QO;o.p=toClip((r.xy+cn*r.zw)*u.b.x);o.uv=cn;o.k=k;o.r=r;return o;}
@fragment fn fs(i:QO)->@location(0) vec4f{
  let t=u.b.y*.0005;let det=i.k.z;
  let qp=i.uv*i.r.zw/170.+i.k.w;
  let w=vec2f(gf(qp+vec2f(t,0.)),gf(qp+vec2f(5.2,1.3)-vec2f(0.,t)));
  let uv=i.uv+(w-.5)*.018*det;
  var c:vec4f;
  if(i.k.y>.5){c=texCubic(tx,sm,uv);}else{c=textureSampleLevel(tx,sm,uv,0.);}
  let lum=max(c.r,max(c.g,c.b));
  let fil=gf(qp*2.6+w*2.2);
  let rid=1.-abs(2.*gf(qp*1.3+w*1.1+vec2f(9.,4.))-1.);
  let lane=smoothstep(.72,.97,rid);
  let body=smoothstep(.02,.22,lum);
  let wisp=smoothstep(.46,.74,fil);let gap=1.-smoothstep(.28,.48,fil);
  let k=1.+det*body*(.95*wisp-.5*gap-.45*lane);
  c=vec4f(c.rgb*k,c.a);
  return c*i.k.x;}`;

function gspPipes(){
  const H=GPU_WGSL_COMMON+GSP_WGSL_U;
  return {stars:gpuPipe("gsp.stars",H+GSP_STARS),dust:gpuPipe("gsp.dust",H+GSP_DUST),
          quad:gpuPipe("gsp.quad",H.replace(/@fragment fn fs\(i:VO\)[\s\S]*$/,"")+GSP_QUAD)};
}
/* таблица звёзд — та же, что у 2D (BG_GROUP по цветам, затем BG_BRIGHT), один раз */
function gspStarBuf(){
  if(GSP.stars&&GPU.bufs["gsp.st"]===GSP.stars)return GSP.stars;
  const a=[];
  for(let gi=0;gi<BG_GROUP.length;gi++){const c=STAR_COLS[gi];
    for(const s of BG_GROUP[gi].list)a.push(s.x,s.y,s.z,s.ph,c[0]/255,c[1]/255,c[2]/255,0);}
  for(const s of BG_BRIGHT){const c=s.css.match(/\d+/g).map(Number);a.push(s.x,s.y,s.z,s.ph,c[0]/255,c[1]/255,c[2]/255,1);}
  const f=new Float32Array(a),U=GPUBufferUsage;
  const b=gpuBuf("gsp.st",f.byteLength,U.STORAGE|U.COPY_DST);
  GPU.dev.queue.writeBuffer(b,0,f);GSP.nStars=a.length/8;
  return GSP.stars=b;
}
/* пыль: три слоя с разным ходом, та же таблица dustTable, что у 2D */
function gspDustBuf(base){
  const U=GPUBufferUsage;
  if(base===GSP.dustBase&&GPU.bufs["gsp.du"])return GPU.bufs["gsp.du"];
  const T=dustTable(base),a=[];
  for(let L=0;L<DUST_LAYERS.length;L++){
    const LY=DUST_LAYERS[L],DL=GSP_DUST_L[L],n=Math.round(base*LY.n);
    for(let i=0;i<n;i++){const d=T[(i+L*37)%base];
      a.push(d.u,d.v,d.s*DL.s,LY.par, d.dx,d.dy,L*211,L*137, LY.a*.62*DL.a,DL.soft,0,0);}
  }
  const f=new Float32Array(a.length?a:[0,0,0,0,0,0,0,0,0,0,0,0]);
  const b=gpuBuf("gsp.du",f.byteLength,U.STORAGE|U.COPY_DST);
  GPU.dev.queue.writeBuffer(b,0,f);GSP.dustBase=base;GSP.dustN=a.length/12;
  return b;
}
function gspUni(cx,cy,par,M,dcx,dcy){
  const a=GSP.UA;
  a[0]=GPU.bw;a[1]=GPU.bh;a[2]=W;a[3]=H;a[4]=DPR;a[5]=G.t;a[6]=cx;a[7]=cy;
  a[8]=par;a[9]=M.dx;a[10]=M.dy;a[11]=M.mov;a[12]=M.kx;a[13]=M.ky;a[14]=1;a[15]=GSP.nStars?GSP.nStars-BG_BRIGHT.length:0;
  a[16]=dcx;a[17]=dcy;a[18]=W+40;a[19]=H+40;
  const S=GSP.star;a[20]=S?S.x:0;a[21]=S?S.y:0;a[23]=S?S.on:0;a[24]=S?S.c[0]/255:0;a[25]=S?S.c[1]/255:0;a[26]=S?S.c[2]/255:0;
  const U=GPUBufferUsage,b=gpuBuf("gsp.u",112,U.UNIFORM|U.COPY_DST);
  GPU.dev.queue.writeBuffer(b,0,a);return b;
}
/* до трёх прямоугольников туманности за кадр — в одном буфере:
   [x, y, w, h, альфа, сила детали, сдвиг шума] */
function gspQuads(pass,P,ub,tex,list,cubic){
  const a=GSP.QA;let n=0;
  for(const r of list){a.set([r[0],r[1],r[2],r[3],r[4],cubic?1:0,r[5]||0,r[6]||0],n*8);n++;}
  const U=GPUBufferUsage,qb=gpuBuf("gsp.q",96,U.STORAGE|U.COPY_DST);
  GPU.dev.queue.writeBuffer(qb,0,a);
  pass.setPipeline(P.quad);
  pass.setBindGroup(0,gpuBind("gsp.quad",P.quad,[ub,qb,tex.view,GPU.S.lin]));
  pass.draw(6,n);
}
function gspStarsDust(pass,P,ub,dustBase,noStars){
  if(!noStars){const sb=gspStarBuf();
    pass.setPipeline(P.stars);pass.setBindGroup(0,gpuBind("gsp.stars",P.stars,[ub,sb]));
    pass.draw(6,GSP.nStars*4);}
  if(dustBase>0){
    const db=gspDustBuf(dustBase);
    if(GSP.dustN>0){pass.setPipeline(P.dust);pass.setBindGroup(0,gpuBind("gsp.dust",P.dust,[ub,db]));pass.draw(6,GSP.dustN);}
  }
}
/* сдвиг шума детали — из цветов туманности системы: у каждой свои нити */
function gspSeed(nb){return ((nb[0][0]*3+nb[0][1]*7+nb[1][2]*11)%97)*1.7;}
/* фон системы: туманность (или ровная ночь, пока она печётся), звёзды, пыль —
   те же камеры, что у 2D-ветки drawSystem; шум детали сдвинут по зерну системы */
function gpuSpaceSys(sys,cx0,cy0,Z){
  GPU.sceneBg=SPACE_BG;
  /* туманность объёмом (16gb) считается своим проходом — до прохода сцены */
  GSP.star=gnbStar(sys,W/2-cx0*Z,H/2-cy0*Z,sys.radius*Z);
  const neb=gpuNebulaGen(sys,cx0*Z,cy0*Z,GSP.star,Z);
  const pass=gpuScene();if(!pass)return;
  const P=gspPipes();
  const cx=cx0*.06*Z,cy=cy0*.06*Z;
  const M=starMove(cx,cy,1);
  const ub=gspUni(cx,cy,1,M,cx0*Z,cy0*Z);
  /* звёзды — под туманностью: её пыль гасит их, газ светит поверх */
  gspStarsDust(pass,P,ub,0);
  if(neb)gpuNebulaComp(pass);
  gspStarsDust(pass,P,ub,Math.round(46*sysStyle(sys).dust*G.opts.gfx.particles),true);
}
/* заставка: две туманности на разной глубине и звёзды (drawNebula + drawStars) */
function gpuSpaceTitle(c){
  GPU.sceneBg=SPACE_BG;GSP.star=null;
  const pass=gpuScene();if(!pass)return;
  const P=gspPipes();
  const M=starMove(c,0,1);
  const ub=gspUni(c,0,1,M,0,0);
  const ex=W*.2,ey=H*.2,ex2=W*.5,ey2=H*.5;
  const ox=-ex/2+clamp(-c*.01,-ex/2,ex/2),oy=-ey/2;
  const ox2=-ex2/2+clamp(-c*.03,-ex2/2,ex2/2)+W*.18,oy2=-ey2/2-H*.12;
  gspQuads(pass,P,ub,gpuCanvasTex(nebula()),[[ox,oy,W+ex,H+ey,.6,1,0],[ox2,oy2,W+ex2,H+ey2,.26,.8,40]],true);
  gspStarsDust(pass,P,ub,0);
}
