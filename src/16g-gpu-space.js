/* ══════════════ космос на видеокарте (G1, docs/DESIGN-gpu.md) ══════════════
   Фон системы и заставки: туманность (её печёт 2D — сюда она ложится текстурой),
   звёзды и пыль — формулами в шейдере, один вызов на слой вместо сотен fillRect.
   Логика та же, что у drawStars / drawSpaceDust (16-flight, 16a-space): те же
   таблицы, тот же ход камеры starMove и закон «движение, а не мигание».
   Лучше, чем в 2D: звезда и пылинка — круглые точки той же площади (квадрат в пять
   пикселей при DPR 2.6 читался квадратом); прочерк на ходу — капсула, как и
   выглядит смазанная точка; туманность заставки (192²) растянута бикубикой — у
   билинейной выборки на ×13 проступал ромб. */
const SPACE_BG={r:5/255,g:7/255,b:12/255,a:1};
const GSP={stars:null,dustBase:-1,dustN:0,UA:new Float32Array(20),QA:new Float32Array(16)};
const GSP_WGSL_U=`
struct SP{a:vec4f,b:vec4f,c:vec4f,d:vec4f,e:vec4f};
@group(0) @binding(0) var<uniform> u:SP;
fn toClip(p:vec2f)->vec4f{return vec4f(p.x/u.a.x*2.-1.,1.-p.y/u.a.y*2.,0.,1.);}
fn corn(i:u32)->vec2f{var c=array(vec2f(0.,0.),vec2f(1.,0.),vec2f(1.,1.),vec2f(0.,0.),vec2f(1.,1.),vec2f(0.,1.));return c[i];}
struct VO{@builtin(position) p:vec4f,@location(0) col:vec4f,@location(1) @interpolate(flat) g:vec4f,@location(2) @interpolate(flat) h:vec4f};
@fragment fn fs(i:VO)->@location(0) vec4f{
  let p=i.p.xy;var cov=0.;
  if(i.h.x<.5){cov=covRect(p,i.g);}
  else if(i.h.x<1.5){cov=covDisc(p,i.g.xy,i.g.z);}
  else{cov=covSeg(p,i.g.xy,i.g.zw,i.h.y);}
  let al=i.col.a*cov;return vec4f(i.col.rgb*al,al);}`;
/* a: res.xy, css.xy · b: dpr, t, cx, cy · c: par, mdx, mdy, mov · d: kx, ky, a0, – · e: пыль dcx, dcy, sw, sh */
/* звезда = три части (тело, два луча крестика); на ходу тело — прочерк */
const GSP_STARS=`
@group(0) @binding(1) var<storage,read> st:array<vec4f>;
@vertex fn vs(@builtin(vertex_index) vi:u32,@builtin(instance_index) ii:u32)->VO{
  let s=st[(ii/3u)*2u];let c=st[(ii/3u)*2u+1u];let part=ii%3u;
  let z=s.z;let bright=c.w>.5;let dpr=u.b.x;let mov=u.c.w;
  let px=pmod(s.x*1600.-u.b.z*u.c.x*z,1600.)/1600.*u.a.z;
  let py=pmod(s.y*1200.-u.b.w*u.c.x*z,1200.)/1200.*u.a.w;
  var a=0.;var sz=1.;
  if(bright){a=.55+.25*sin(u.b.y*.03+s.w)*(1.-mov);}
  else{a=(.11+z*.55)*(.76+.24*sin(u.b.y*.045*(.4+z)+s.w)*(1.-mov));sz=select(select(1.,1.4,z>.5),2.1,z>.85);}
  a=a*u.d.z;
  let l=vec2f(u.c.y*u.d.x*u.c.x*z,u.c.z*u.d.y*u.c.x*z);let ll=length(l);
  var mode=-1.;var g=vec4f(0.);var hw=0.;
  if(part==0u){
    if(bright){
      if(mov>.04&&ll>1.2){mode=2.;g=vec4f(px,py,px+l.x,py+l.y);hw=1.;}
      else{mode=1.;g=vec4f(px+.1,py+.1,2.6*.5641896,0.);}
    }else{
      if(mov>.04&&z>.4&&ll>1.2){mode=2.;g=vec4f(px,py,px+l.x,py+l.y);hw=sz*.36;}
      else{mode=1.;g=vec4f(px+sz*.5,py+sz*.5,sz*.5641896,0.);}
    }
  }else if(bright){
    if(mov<.2){mode=0.;a=a*.35;g=select(vec4f(px+.1,py-3.4,px+1.1,py+4.2),vec4f(px-3.4,py+.1,px+4.2,py+1.1),part==1u);}
  }else if(z>.9&&mov<.2){
    mode=0.;a=a*.3;g=select(vec4f(px+.35,py-2.4,px+1.15,py+3.4),vec4f(px-2.4,py+.35,px+3.4,py+1.15),part==1u);
  }
  let m=1./dpr;var lo=vec2f(-9.);var hi=vec2f(-8.);
  if(mode==0.){lo=g.xy-m;hi=g.zw+m;}
  else if(mode==1.){lo=g.xy-g.z-m;hi=g.xy+g.z+m;}
  else if(mode==2.){lo=min(g.xy,g.zw)-hw-m;hi=max(g.xy,g.zw)+hw+m;}
  var o:VO;o.p=toClip(mix(lo,hi,corn(vi))*dpr);o.col=vec4f(c.rgb,a);o.g=g*dpr;o.h=vec4f(mode,hw*dpr,0.,0.);
  return o;}`;
/* пылинка: (u,v,размер,ход слоя) (dx,dy,сдвиг слоя) (альфа слоя) */
const GSP_DUST=`
@group(0) @binding(1) var<storage,read> du:array<vec4f>;
@vertex fn vs(@builtin(vertex_index) vi:u32,@builtin(instance_index) ii:u32)->VO{
  let p0=du[ii*3u];let p1=du[ii*3u+1u];let p2=du[ii*3u+2u];let dpr=u.b.x;
  let px=pmod(p0.x*900.+p1.z+(p1.x*u.b.y*.09-u.e.x)*p0.w,900.)/900.*u.e.z-20.;
  let py=pmod(p0.y*900.+p1.w+(p1.y*u.b.y*.09-u.e.y)*p0.w,900.)/900.*u.e.w-20.;
  let r=p0.z*.5641896;let c=vec2f(px,py)+p0.z*.5;let m=1./dpr;
  var o:VO;o.p=toClip(mix(c-r-m,c+r+m,corn(vi))*dpr);
  o.col=vec4f(198./255.,214./255.,236./255.,p2.x*u.d.z);o.g=vec4f(c*dpr,r*dpr,0.);o.h=vec4f(1.,0.,0.,0.);
  return o;}`;
/* прямоугольник с текстурой: (x,y,w,h) в пикселях CSS, (альфа, бикубика) */
const GSP_QUAD=`
@group(0) @binding(1) var<storage,read> q:array<vec4f>;
@group(0) @binding(2) var tx:texture_2d<f32>;
@group(0) @binding(3) var sm:sampler;
struct QO{@builtin(position) p:vec4f,@location(0) uv:vec2f,@location(1) @interpolate(flat) k:vec4f};
@vertex fn vs(@builtin(vertex_index) vi:u32,@builtin(instance_index) ii:u32)->QO{
  let r=q[ii*2u];let k=q[ii*2u+1u];let cn=corn(vi);
  var o:QO;o.p=toClip((r.xy+cn*r.zw)*u.b.x);o.uv=cn;o.k=k;return o;}
@fragment fn fs(i:QO)->@location(0) vec4f{
  var c:vec4f;
  if(i.k.y>.5){c=texCubic(tx,sm,i.uv);}else{c=textureSampleLevel(tx,sm,i.uv,0.);}
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
    const LY=DUST_LAYERS[L],n=Math.round(base*LY.n);
    for(let i=0;i<n;i++){const d=T[(i+L*37)%base];
      a.push(d.u,d.v,d.s*LY.s,LY.par, d.dx,d.dy,L*211,L*137, LY.a*.62,0,0,0);}
  }
  const f=new Float32Array(a.length?a:[0,0,0,0,0,0,0,0,0,0,0,0]);
  const b=gpuBuf("gsp.du",f.byteLength,U.STORAGE|U.COPY_DST);
  GPU.dev.queue.writeBuffer(b,0,f);GSP.dustBase=base;GSP.dustN=a.length/12;
  return b;
}
function gspUni(cx,cy,par,M,dcx,dcy){
  const a=GSP.UA;
  a[0]=GPU.bw;a[1]=GPU.bh;a[2]=W;a[3]=H;a[4]=DPR;a[5]=G.t;a[6]=cx;a[7]=cy;
  a[8]=par;a[9]=M.dx;a[10]=M.dy;a[11]=M.mov;a[12]=M.kx;a[13]=M.ky;a[14]=1;a[15]=0;
  a[16]=dcx;a[17]=dcy;a[18]=W+40;a[19]=H+40;
  const U=GPUBufferUsage,b=gpuBuf("gsp.u",80,U.UNIFORM|U.COPY_DST);
  GPU.dev.queue.writeBuffer(b,0,a);return b;
}
/* до двух прямоугольников туманности за кадр — в одном буфере */
function gspQuads(pass,P,ub,tex,list,cubic){
  const a=GSP.QA;let n=0;
  for(const r of list){a.set([r[0],r[1],r[2],r[3],r[4],cubic?1:0,0,0],n*8);n++;}
  const U=GPUBufferUsage,qb=gpuBuf("gsp.q",64,U.STORAGE|U.COPY_DST);
  GPU.dev.queue.writeBuffer(qb,0,a);
  pass.setPipeline(P.quad);
  pass.setBindGroup(0,gpuBind("gsp.quad",P.quad,[ub,qb,tex.view,GPU.S.lin]));
  pass.draw(6,n);
}
function gspStarsDust(pass,P,ub,dustBase){
  const sb=gspStarBuf();
  pass.setPipeline(P.stars);pass.setBindGroup(0,gpuBind("gsp.stars",P.stars,[ub,sb]));
  pass.draw(6,GSP.nStars*3);
  if(dustBase>0){
    const db=gspDustBuf(dustBase);
    if(GSP.dustN>0){pass.setPipeline(P.dust);pass.setBindGroup(0,gpuBind("gsp.dust",P.dust,[ub,db]));pass.draw(6,GSP.dustN);}
  }
}
/* фон системы: туманность (или ровная ночь, пока она печётся), звёзды, пыль —
   те же камеры, что у 2D-ветки drawSystem */
function gpuSpaceSys(sys,cx0,cy0,Z){
  GPU.sceneBg=SPACE_BG;
  const pass=gpuScene(),P=gspPipes();
  const cx=cx0*.06*Z,cy=cy0*.06*Z;
  const M=starMove(cx,cy,1);
  const ub=gspUni(cx,cy,1,M,cx0*Z,cy0*Z);
  const C=sysNebComp(sys);
  if(C){
    const ex=W*.24,ey=H*.24;
    const ox=-ex/2+clamp(-cx*.012,-ex/2,ex/2),oy=-ey/2+clamp(-cy*.012,-ey/2,ey/2);
    gspQuads(pass,P,ub,gpuCanvasTex(C.cv),[[ox,oy,W+ex,H+ey,1]],false);
  }
  gspStarsDust(pass,P,ub,Math.round(46*sysStyle(sys).dust*G.opts.gfx.particles));
}
/* заставка: две туманности на разной глубине и звёзды (drawNebula + drawStars) */
function gpuSpaceTitle(c){
  GPU.sceneBg=SPACE_BG;
  const pass=gpuScene(),P=gspPipes();
  const M=starMove(c,0,1);
  const ub=gspUni(c,0,1,M,0,0);
  const ex=W*.2,ey=H*.2,ex2=W*.5,ey2=H*.5;
  const ox=-ex/2+clamp(-c*.01,-ex/2,ex/2),oy=-ey/2;
  const ox2=-ex2/2+clamp(-c*.03,-ex2/2,ex2/2)+W*.18,oy2=-ey2/2-H*.12;
  gspQuads(pass,P,ub,gpuCanvasTex(nebula()),[[ox,oy,W+ex,H+ey,.6],[ox2,oy2,W+ex2,H+ey2,.26]],true);
  gspStarsDust(pass,P,ub,0);
}
