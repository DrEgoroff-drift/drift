/* ══════════════ камни пояса в настоящем 3D (G8) ══════════════
   Камень — сетка makeRock (24) в проходе с глубиной (gpuScene3D): вершины лежат на
   видеокарте одним пулом на пояс (слот на сетку, обломки берут слот родителя), грань
   ищет свою вершину сама (индексы SPHERE2 — общие), и все камни кадра — один вызов.
   Свет — по пикселю, от настоящего светила в начале координат: освещённая сторона,
   мягкий терминатор (Ламберт с долей Ломмеля — Зеелигера, как у реголита), теневая
   сторона в холодном отсвете туманности, ложбины темнее выпуклостей (затенение из
   самой сетки), зерно и сколы — шумом в координатах камня, жилы руды — тоже шумом,
   с бликом, когда на них светит звезда. Грань читается: гладкая нормаль сетки
   смешана с нормалью плоскости, и скала остаётся колотой, а не пластилиновой.
   Туман темнит цвет, как в 2D, прозрачности не трогает.

   Пыль у стекла — в том же проходе, после камней: глубину она читает, но не пишет,
   поэтому пылинка за камнем прячется за него (в 2D пыль всегда лежала под камнями),
   а светится она по-разному в зависимости от того, куда смотрит камера: против
   светила — ярче (рассеяние вперёд), по свету — тусклее. */

const BROCK_NV=162, BROCK_NEAR=2, BROCK_FAR=12000;
const BROCK_WGSL=`
struct RU{r:vec4f,u:vec4f,f:vec4f,s:vec4f,sc:vec4f,n0:vec4f,n1:vec4f};
@group(0) @binding(0) var<uniform> ru:RU;
@group(0) @binding(1) var<storage,read> idx:array<u32>;
@group(0) @binding(2) var<storage,read> msh:array<vec4f>;
@group(0) @binding(3) var<storage,read> ins:array<vec4f>;
struct RO{@builtin(position) p:vec4f,@location(0) wp:vec3f,@location(1) n:vec3f,@location(2) q:vec3f,
  @location(3) @interpolate(flat) rk:vec4f,@location(4) @interpolate(flat) or:vec4f,@location(5) oa:vec2f,
  @location(6) @interpolate(flat) ft:vec4f,@location(7) @interpolate(flat) mo:vec4f};
fn hsh(i:u32,s:u32)->f32{var h=(i*374761393u)^(s*668265263u);h=(h^(h>>13u))*1274126177u;return f32(h^(h>>16u))/4294967296.;}
fn bclip(w:vec3f)->vec4f{
  let xc=dot(w,ru.r.xyz);let yc=dot(w,ru.u.xyz);let zc=dot(w,ru.f.xyz);
  return vec4f(xc*2.*ru.r.w/ru.u.w,yc*2.*ru.r.w/ru.f.w,(zc-${BROCK_NEAR}.)*${BROCK_FAR}./(${BROCK_FAR-BROCK_NEAR}.),zc);}
@vertex fn vs(@builtin(vertex_index) vi:u32,@builtin(instance_index) ii:u32)->RO{
  let j=ii*7u;let I0=ins[j];let I1=ins[j+1u];let I2=ins[j+2u];let I3=ins[j+3u];let I4=ins[j+4u];let I5=ins[j+5u];let I6=ins[j+6u];
  let sl=u32(I1.w+.5);let b=(sl*${BROCK_NV}u+idx[vi])*2u;var A=msh[b];let B=msh[b+1u];
  /* устье (ориентир «УСТЬЕ»): воронка вдавлена в саму сетку вокруг оси I6 */
  if(I6.w<1.5){A=vec4f(A.xyz*(1.-.34*smoothstep(I6.w-.14,1.,dot(normalize(A.xyz),I6.xyz))),A.w);}
  let l=vec3f(dot(I1.xyz,A.xyz),dot(I2.xyz,A.xyz),dot(I3.xyz,A.xyz));
  let w=I0.xyz+l*I0.w;
  var o:RO;o.p=bclip(w);o.wp=w;
  o.n=vec3f(dot(I1.xyz,B.xyz),dot(I2.xyz,B.xyz),dot(I3.xyz,B.xyz));
  o.q=A.xyz*I0.w;o.rk=vec4f(I4.xyz,I2.w);o.or=vec4f(I5.xyz,I3.w);o.oa=vec2f(B.w,A.w);
  o.ft=vec4f(.92+.16*hsh(vi/3u,sl*977u+13u),I5.w,I4.w,0.);o.mo=I6;
  return o;}
fn h3(p:vec3f)->f32{let i=vec3i(p);
  var h=(u32(i.x)*374761393u)^(u32(i.y)*668265263u)^(u32(i.z)*1274126177u);h=(h^(h>>13u))*1274126177u;
  return f32(h^(h>>16u))/4294967296.;}
fn vn(p:vec3f)->f32{let i=floor(p);let f=p-i;let u=f*f*(3.-2.*f);
  let a=mix(mix(h3(i),h3(i+vec3f(1.,0.,0.)),u.x),mix(h3(i+vec3f(0.,1.,0.)),h3(i+vec3f(1.,1.,0.)),u.x),u.y);
  let c=mix(mix(h3(i+vec3f(0.,0.,1.)),h3(i+vec3f(1.,0.,1.)),u.x),mix(h3(i+vec3f(0.,1.,1.)),h3(i+vec3f(1.,1.,1.)),u.x),u.y);
  return mix(a,c,u.z)-.5;}
/* октавы гаснут, когда мельче пикселя: зерно не рябит на дальнем камне */
fn fbmF(p:vec3f,fw:f32)->f32{var v=0.;var a=.5;var f=1.;
  for(var i=0;i<5;i++){v+=a*vn(p*f+vec3f(f32(i)*17.3))*clamp(1.6-fw*f*2.2,0.,1.);a*=.5;f*=2.03;}
  return v;}
@fragment fn fs(i:RO)->@location(0) vec4f{
  let V=normalize(-i.wp);let dpx=dpdx(i.wp);let dpy=dpdy(i.wp);
  var Nf=normalize(cross(dpx,dpy));if(dot(Nf,V)<0.){Nf=-Nf;}
  var N=normalize(i.n);if(dot(N,V)<-.2){N=Nf;}
  N=normalize(mix(N,Nf,.64));
  let rad=i.ft.y;let sd=vec3f(i.ft.z*.0137,i.ft.z*.0071,i.ft.z*.0113);
  let fw=length(fwidth(i.q));
  let h=fbmF(i.q/(rad*.34)+sd,fw/(rad*.34));
  let g=fbmF(i.q/2.6+sd*3.,fw/2.6);
  /* рельеф: производные высоты по экрану — наклон нормали (Микельсен) */
  let Hh=h*rad*.075+g*.35;
  let r1=cross(dpy,N);let r2=cross(N,dpx);let det=dot(dpx,r1);
  let gr=sign(det)*(dpdx(Hh)*r1+dpdy(Hh)*r2);
  let Nb=normalize(abs(det)*N-gr);
  var alb=i.rk.rgb*i.ft.x*(.84+h*.55+g*.3);
  /* руда: богатая зона (руда сетки + шум) — пятно цвета руды, а по нему жилы —
     тонкие линии там, где шум переходит через ноль (гребни), толщина — от пикселя */
  let zone=smoothstep(.56,.64,i.oa.x+h*.10);
  let vq=i.q/(rad*.3)+sd*2.;let rv=vn(vq)+.5*vn(vq*2.1+3.7);
  let lw=max(fwidth(rv),.004);
  let vein=zone*(1.-smoothstep(lw*.6,lw*.6+.05,abs(rv)));
  alb=mix(alb,alb*.66+i.or.rgb*.34,zone*.5);
  alb=mix(alb,i.or.rgb*1.05,vein*.75);
  let ao=i.oa.y;
  let L=normalize(ru.s.xyz-i.wp);let ndl=dot(Nb,L);let ndv=max(dot(Nb,V),0.);
  let lam=max(ndl,0.);
  let dif=mix(lam,1.15*lam/(lam+ndv+.08),.35);
  let sc=ru.sc.rgb;
  var col=alb*(sc*1.55*dif*mix(1.,ao,.45)+ru.n0.rgb*.2*ao+ru.n1.rgb*.12*max(-ndl,0.)*ao);
  col+=sc*lam*lam*(.07+vein*.06);
  let Hv=normalize(L+V);
  col+=sc*lam*(pow(max(dot(Nb,Hv),0.),44.)*.7*vein+pow(max(dot(Nb,Hv),0.),9.)*.035);
  col+=vec3f(.17,.185,.215)*pow(1.-ndv,3.)*(.3+.7*lam)*ao;
  /* светило за камнем: пыль на кромке горит в его свете (рассеяние вперёд) — силуэт на пелене */
  col+=sc*pow(1.-ndv,4.)*pow(max(dot(-V,L),0.),6.)*.9;
  var lamp=vec3f(0.);
  if(i.mo.w<1.5){
    /* чёрный зев и пять рабочих огней по кромке: мигают медленно, каждый своим ходом */
    let dq=normalize(i.q);let md=i.mo.xyz;let cm=dot(dq,md);
    col*=1.-.94*smoothstep(i.mo.w+.03,i.mo.w+.13,cm);
    let t1=normalize(cross(md,select(vec3f(1.,0.,0.),vec3f(0.,1.,0.),abs(md.y)<.9)));let t2=cross(md,t1);
    let cl=i.mo.w-.04;let sl2=sqrt(max(1.-cl*cl,0.));
    for(var k=0;k<5;k++){let a=f32(k)/5.*6.2831853+.4;
      let ld=md*cl+(t1*cos(a)+t2*sin(a))*sl2;
      let bl=.4+.6*pow(max(0.,sin(ru.n0.w*.03+f32(k))),4.);
      lamp+=vec3f(1.,.67,.43)*exp(-(1.-dot(dq,ld))*2400.)*bl*2.2;}
  }
  let zc=dot(i.wp,ru.f.xyz);let fog=clamp(1.-zc/ru.s.w,.1,1.);
  col=col*fog+ru.n0.rgb*.05*(1.-fog)+lamp*sqrt(fog);
  col=mix(col,col*.82+vec3f(26.,52.,50.)/255.,i.or.w);
  let a=i.rk.w;
  return vec4f(col*a,a);}`;
/* пыль: отрезок голова—хвост (или точка), глубина головы, покрытие — капсула набора.
   I0 — голова (от камеры) и альфа, I1 — хвост назад и полутолщина в px, I2 — цвет */
const BDUST_WGSL=GPU_WGSL_COMMON+`
struct RU{r:vec4f,u:vec4f,f:vec4f,s:vec4f,sc:vec4f,n0:vec4f,n1:vec4f};
@group(0) @binding(0) var<uniform> ru:RU;
@group(0) @binding(1) var<storage,read> ins:array<vec4f>;
struct DO{@builtin(position) p:vec4f,@location(0) @interpolate(flat) a:vec4f,@location(1) @interpolate(flat) c:vec4f,@location(2) @interpolate(flat) w:f32};
fn scr(w:vec3f)->vec3f{let zc=max(dot(w,ru.f.xyz),.001);
  return vec3f(ru.u.w*.5+dot(w,ru.r.xyz)*ru.r.w/zc,ru.f.w*.5-dot(w,ru.u.xyz)*ru.r.w/zc,zc);}
@vertex fn vs(@builtin(vertex_index) vi:u32,@builtin(instance_index) ii:u32)->DO{
  let I0=ins[ii*3u];let I1=ins[ii*3u+1u];let I2=ins[ii*3u+2u];
  let h=scr(I0.xyz);let t=scr(I0.xyz-I1.xyz);let hw=I1.w;
  var c=array(vec2f(0.,0.),vec2f(1.,0.),vec2f(1.,1.),vec2f(0.,0.),vec2f(1.,1.),vec2f(0.,1.));
  let lo=min(h.xy,t.xy)-hw-1.;let hi=max(h.xy,t.xy)+hw+1.;let s=mix(lo,hi,c[vi]);
  var o:DO;
  let z=clamp((h.z-${BROCK_NEAR}.)*${BROCK_FAR}./(${BROCK_FAR-BROCK_NEAR}.*h.z),0.,1.);
  o.p=vec4f(s.x/ru.u.w*2.-1.,1.-s.y/ru.f.w*2.,z,1.);
  if(h.z<${BROCK_NEAR}.||t.z<${BROCK_NEAR}.){o.p=vec4f(-9.,-9.,0.,1.);}
  o.a=vec4f(h.xy,t.xy);o.c=vec4f(I2.xyz,I0.w);o.w=hw;return o;}
@fragment fn fs(i:DO)->@location(0) vec4f{
  let a=covSeg(i.p.xy/ru.n1.w,i.a.xy,i.a.zw,i.w)*i.c.w;
  return vec4f(i.c.rgb*a,a);}`;
/* свой слой (×4) копит и альфу — её читает склейка; прямо в сцене альфа — маска корпусов, её не трогаем */
const BROCK_BLEND={color:{srcFactor:"one",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}};
function brockDesc(code,write,ms){
  const mod=gpuShader(code);
  return {layout:"auto",vertex:{module:mod,entryPoint:"vs"},
    fragment:{module:mod,entryPoint:"fs",targets:[{format:"rgba16float",blend:ms>1?BROCK_BLEND:GPU_BLEND.over}]},
    primitive:{topology:"triangle-list",cullMode:"back",frontFace:"ccw"},multisample:{count:ms},
    depthStencil:{format:"depth24plus",depthWriteEnabled:write,depthCompare:"less"}};
}
/* ключи конвейеров — для таблицы прогрева 08b1 (рецепт — brockDesc): belt.rock, belt.rockf,
   belt.dust и их ×4 (belt.rock4 …). gpuPipeline не держит построенное — держим сами */
const BROCK_P={dev:null};
function brockPipe(k,ms){
  if(BROCK_P.dev!==GPU.dev){for(const j in BROCK_P)delete BROCK_P[j];BROCK_P.dev=GPU.dev;}
  const key="belt."+k+(ms>1?ms:"");
  if(BROCK_P[key])return BROCK_P[key];
  /* в таблицу прогрева — все шесть: какой вид возьмёт кадр, решает устройство (brockMs),
     а детектор ходит одним окном; иначе телефон строил бы ×1 на входе в пояс */
  for(const j of ["rock","rockf","dust"])for(const m of ["","4"])GPU_PIPES.used.add("belt."+j+m);
  return BROCK_P[key]=gpuPipeline(key,()=>brockPipeDesc(key));
}
/* рецепт по ключу — для прогрева (08b0, GPU_PIPE_ONE: "belt.rock" … "belt.dust4" → brockPipeDesc) */
function brockPipeDesc(key){
  const m=/^belt\.(rock|rockf|dust)(4?)$/.exec(key);if(!m)return null;
  const k=m[1],d=brockDesc(k==="dust"?BDUST_WGSL:BROCK_WGSL,k==="rock",m[2]?4:1);
  if(k==="dust")d.primitive={topology:"triangle-list"};
  return d;
}
/* сглаживание краёв камня: 4× MSAA в свой слой и склейка в сцену одним полем — пока
   кадр не больше BROCK_MS_PX при DPR < 1.5 (ПК, 760-е пары); на телефоне с DPR 2.6 ступенька мельче
   точки, а четыре выборки 16-битного цвета стоили бы десятки мегабайт — там камни идут
   прямо в gpuScene3D */
const BROCK_MS_PX=2.1e6;
const BROCK_LAY_WGSL=`fn field(p:vec2f,uv:vec2f)->vec4f{return textureSampleLevel(t0,smp,uv,0.);}`;
function brockMs(){return DPR<1.5&&GPU.bw*GPU.bh<=BROCK_MS_PX?4:1;}
function brockTex(){
  const B=BROCK,w=GPU.bw,h=GPU.bh;
  if(B.tw===w&&B.th===h&&B.tdev===GPU.dev&&B.ms)return;
  for(const k of ["ms","msd","lay"])if(B[k])GPU.trash.push(B[k]);
  const RA=GPUTextureUsage.RENDER_ATTACHMENT,d=GPU.dev;
  B.ms=d.createTexture({size:[w,h],format:"rgba16float",sampleCount:4,usage:RA});
  B.msd=d.createTexture({size:[w,h],format:"depth24plus",sampleCount:4,usage:RA});
  B.lay=d.createTexture({size:[w,h],format:"rgba16float",usage:RA|GPUTextureUsage.TEXTURE_BINDING});
  B.msV=B.ms.createView();B.msdV=B.msd.createView();B.layV={view:B.lay.createView()};
  B.tw=w;B.th=h;B.tdev=GPU.dev;
}
/* проход для камней: ×4 — свой, в слой (проход сцены закрывается, как в gpuWorld); ×1 — gpuScene3D */
function brockBegin(ms){
  if(ms===1)return gpuScene3D();
  if(!GPU.on||!GPU.enc)return null;
  brockTex();
  if(GPU.scenePass){GPU.scenePass.end();GPU.scenePass=null;GPU.scene3D=false;}
  const B=BROCK;
  return B.pass=GPU.enc.beginRenderPass({colorAttachments:[{view:B.msV,resolveTarget:B.layV.view,loadOp:"clear",storeOp:"discard",clearValue:{r:0,g:0,b:0,a:0}}],
    depthStencilAttachment:{view:B.msdV,depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"discard"}});
}
function brockEnd(ms){
  if(ms===1||!BROCK.pass)return;
  BROCK.pass.end();BROCK.pass=null;
  gpuField(gpuScene(),"belt.rocklay",BROCK_LAY_WGSL,null,[BROCK.layV]);
}
/* ── пул сеток: слот на сетку, на устройство и на пояс ── */
const BROCK={dev:null,belt:null,slot:new WeakMap(),n:0,cap:0,cpu:null,buf:null,idx:null,U:new Float32Array(28),
  I:new Float32Array(28*64),D:new Float32Array(12*256)};
/* нормаль вершины — сумма нормалей её граней; затенение — насколько вершина ниже соседей */
function brockMeshData(m,out,o){
  const V=m.verts,F=SPHERE2.faces,n=new Float32Array(BROCK_NV*3),nb=new Float32Array(BROCK_NV*2);
  for(const f of F){
    const a=V[f[0]],b=V[f[1]],c=V[f[2]];
    const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
    const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
    for(let j=0;j<3;j++){const k=f[j];n[k*3]+=nx;n[k*3+1]+=ny;n[k*3+2]+=nz;
      const w=V[f[(j+1)%3]];nb[k*2]+=Math.hypot(w[0],w[1],w[2]);nb[k*2+1]++;}
  }
  /* обход граней SPHERE2 даёт нормаль внутрь: сторону решает сумма по сетке (камень звёздный от центра) */
  let sg=0;for(let i=0;i<BROCK_NV;i++)sg+=n[i*3]*V[i][0]+n[i*3+1]*V[i][1]+n[i*3+2]*V[i][2];
  const ore=m.vore,fl=sg<0?-1:1;
  for(let i=0;i<BROCK_NV;i++){
    const v=V[i],r=Math.hypot(v[0],v[1],v[2]),mr=nb[i*2]/Math.max(1,nb[i*2+1]),k=o+i*8;
    const l=(Math.hypot(n[i*3],n[i*3+1],n[i*3+2])||1)*fl;
    out[k]=v[0];out[k+1]=v[1];out[k+2]=v[2];out[k+3]=clamp(1+(r-mr)/(mr*.09)*.5,.45,1.12);
    out[k+4]=n[i*3]/l;out[k+5]=n[i*3+1]/l;out[k+6]=n[i*3+2]/l;out[k+7]=ore?ore[i]:.4;
  }
}
function brockSlot(m){
  const B=BROCK;let s=B.slot.get(m);if(s!==undefined)return s;
  s=B.n++;B.slot.set(m,s);
  const U=GPUBufferUsage,per=BROCK_NV*8;
  if(s>=B.cap){
    const cap=Math.max(128,B.cap*2),cpu=new Float32Array(cap*per);if(B.cpu)cpu.set(B.cpu);
    if(B.buf)GPU.trash.push(B.buf);
    B.buf=GPU.dev.createBuffer({size:cap*per*4,usage:U.STORAGE|U.COPY_DST});
    B.cpu=cpu;B.cap=cap;
    brockMeshData(m,cpu,s*per);
    GPU.dev.queue.writeBuffer(B.buf,0,cpu,0,(s+1)*per);
    return s;
  }
  brockMeshData(m,B.cpu,s*per);
  GPU.dev.queue.writeBuffer(B.buf,s*per*4,B.cpu,s*per,per);
  return s;
}
function brockReset(b){
  const B=BROCK;
  if(B.dev===GPU.dev&&B.belt===b)return;
  if(B.dev!==GPU.dev){B.buf=null;B.idx=null;B.cap=0;B.cpu=null;}
  B.dev=GPU.dev;B.belt=b;B.slot=new WeakMap();B.n=0;
  if(!B.idx){const f=SPHERE2.faces,a=new Uint32Array(f.length*3);
    for(let i=0;i<f.length;i++){a[i*3]=f[i][0];a[i*3+1]=f[i][1];a[i*3+2]=f[i][2];}
    B.idx=GPU.dev.createBuffer({size:a.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST});
    GPU.dev.queue.writeBuffer(B.idx,0,a);}
}
/* камера и свет кадра: базис, фокус, светило (от камеры), цвета — один равномерный буфер */
function brockCam(b,bas,F,scol,neb0,neb1){
  const u=BROCK.U,r=bas.right,up=bas.up,f=bas.fwd;
  u[0]=r[0];u[1]=r[1];u[2]=r[2];u[3]=F;u[4]=up[0];u[5]=up[1];u[6]=up[2];u[7]=W;
  u[8]=f[0];u[9]=f[1];u[10]=f[2];u[11]=H;u[12]=-b.x;u[13]=-b.y;u[14]=-b.z;u[15]=2800;
  u[16]=scol[0]/255;u[17]=scol[1]/255;u[18]=scol[2]/255;u[19]=0;
  u[20]=neb0[0]/255;u[21]=neb0[1]/255;u[22]=neb0[2]/255;u[23]=G.t||0;
  u[24]=neb1[0]/255;u[25]=neb1[1]/255;u[26]=neb1[2]/255;u[27]=DPR;
  const U=GPUBufferUsage,buf=gpuBuf("belt.rock.u",u.byteLength,U.UNIFORM|U.COPY_DST);
  GPU.dev.queue.writeBuffer(buf,0,u);return buf;
}
/* экземпляр: сдвиг от камеры и масштаб, три строки поворота (Ry·Rx, как у 2D) со слотом,
   прозрачностью и захватом, цвет породы и зерно, цвет руды и радиус; устье — ось и
   косинус края (у простого камня 2 — устья нет) */
function brockPut(b,o,x,y,z,rad,r0,rx,ry,alpha,rock,ore,locked,maw){
  const B=BROCK,s=brockSlot(o);
  let I=B.I;const k=B.ni*28;
  if(k+28>I.length){const J=new Float32Array(I.length*2);J.set(I);B.I=I=J;}
  const c1=Math.cos(rx),s1=Math.sin(rx),c2=Math.cos(ry),s2=Math.sin(ry);
  I[k]=x-b.x;I[k+1]=y-b.y;I[k+2]=z-b.z;I[k+3]=rad/r0;
  I[k+4]=c2;I[k+5]=s2*s1;I[k+6]=s2*c1;I[k+7]=s;
  I[k+8]=0;I[k+9]=c1;I[k+10]=-s1;I[k+11]=alpha;
  I[k+12]=-s2;I[k+13]=c2*s1;I[k+14]=c2*c1;I[k+15]=locked?1:0;
  I[k+16]=rock[0]/255;I[k+17]=rock[1]/255;I[k+18]=rock[2]/255;I[k+19]=(s*131)%997;
  I[k+20]=ore[0]/255;I[k+21]=ore[1]/255;I[k+22]=ore[2]/255;I[k+23]=rad;
  if(maw){I[k+24]=maw[0];I[k+25]=maw[1];I[k+26]=maw[2];I[k+27]=maw[3];}else{I[k+24]=I[k+25]=0;I[k+26]=1;I[k+27]=2;}
  B.ni++;
}
function brockDraw(pass,ub,from,n,fade,ms){
  if(!pass||n<=0)return;
  const B=BROCK,P=brockPipe(fade?"rockf":"rock",ms),A=gpuArena("brock",n*28,28);
  GPU.dev.queue.writeBuffer(A.buf,A.off*4,B.I,from*28,n*28);
  pass.setPipeline(P);
  pass.setBindGroup(0,gpuBind("belt.rock|"+(fade?1:0)+ms,P,[ub,B.idx,B.buf,A.buf]));
  pass.draw(SPHERE2.faces.length*3,n,0,A.off/28);
}
/* устье — камень, а не силуэт: сетка makeRock размером с ориентир (своим зерном), ось зева
   от зерна; сетка живёт на самом ориентире (пояс не сохраняется) */
function beltMaw(q){
  if(!q.mesh){q.mesh=makeRock(q.seed>>>0,q.size*.8);
    const h=hashi(q.seed>>>0,0x3A11,7),th=(h&1023)/1023*TAU,ph=((h>>>10)&1023)/1023*2-1,c=Math.sqrt(1-ph*ph);
    q.mouth=[Math.cos(th)*c,ph,Math.sin(th)*c,.8];}
  return q;
}
function bdustDraw(pass,ub,n,ms){
  if(!pass||n<=0)return;
  const B=BROCK,P=brockPipe("dust",ms),A=gpuArena("bdust",n*12,12);
  GPU.dev.queue.writeBuffer(A.buf,A.off*4,B.D,0,n*12);
  pass.setPipeline(P);
  pass.setBindGroup(0,gpuBind("belt.dust"+ms,P,[ub,A.buf]));
  pass.draw(6,n,0,A.off/12);
}
