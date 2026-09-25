/* ══════════════ абордаж на видеокарте (G11) ══════════════
   Отсеки пиратской базы — настоящая геометрия в мире: четырёхугольники пола,
   стен, потолка, тары и обстановки идут одним вызовом в проход с глубиной
   (gpuScene3D). Сортировки художника больше нет, и с ней ушли её грехи: грань,
   у которой один угол за камерой, не пропадает целиком (её режет ближняя
   плоскость), а соседние грани не спорят, кто кого закрыл.
   Свет — на пиксель, а не на клетку:
   · фонарь на шлеме — прожектор с конусом и спадом, и его луч виден в воздухе:
     на каждом пикселе он интегрируется вдоль взгляда от глаза до грани, так что
     стена луч обрезает, а пыль в нём светится;
   · потолочные светильники — точки света со спадом (реакторные дышат), ворота
     ангара — холодный свет из космоса;
   · нормаль грани — из производных её точки: тот же свет по-разному ложится
     на пол, стену и крышку ящика;
   · дымка по расстоянию и контур грани (там, где светло) — как было, но на пиксель.
   Тела пиратов — спрайты своих выпечек (raidFoeSprite, 24ab) щитом к камере в
   том же проходе: их закрывает стена, освещает фонарь. Под ногами у всех, кто
   стоит, — тень в свете пола. Ходок, метки, полоски здоровья и выстрелы —
   2D поверх (ходок — кисть 20-life), пыль у фонаря — фигуры набора. */
const RAID_LAMPS=24,RAID_OCC=8;
function raidGpuDesc(){
  const m=gpuShader(RAID_GPU_WGSL);
  return {layout:"auto",vertex:{module:m,entryPoint:"vs"},
    fragment:{module:m,entryPoint:"fs",targets:[{format:"rgba16float",blend:GPU_BLEND.over}]},
    primitive:{topology:"triangle-list"},
    depthStencil:{format:"depth24plus",depthWriteEnabled:true,depthCompare:"less"}};
}
let RAID_QF=new Float32Array(20*4096);
const RAID_UF=new Float32Array(4*(8+RAID_LAMPS*2+RAID_OCC));
/* Q — четырёхугольники мира {a,b,c,d,col,li,edge,emis,bias,minL}; V — камера; LP — лампы;
   FS — тела-спрайты {B,c,hw,hh}; OC — кто стоит на полу [x,z,радиус тени] */
function raidGpuDraw(Q,V,LP,FS,OC){
  const ps=gpuScene3D();if(!ps)return;
  const n=Q.length;if(!n)return;
  if(RAID_QF.length<n*20)RAID_QF=new Float32Array(n*20*2);
  const f=RAID_QF;
  for(let i=0;i<n;i++){
    const q=Q[i],o=i*20,c=q.col,pts=[q.a,q.b,q.c,q.d];
    for(let j=0;j<4;j++){const p=pts[j];f[o+j*4]=p[0];f[o+j*4+1]=p[1];f[o+j*4+2]=p[2];}
    f[o+3]=c[0]/255;f[o+7]=c[1]/255;f[o+11]=c[2]/255;f[o+15]=q.li;
    f[o+16]=q.emis?1:0;f[o+17]=q.edge?1:0;f[o+18]=q.bias||0;f[o+19]=q.minL||0;
  }
  const u=RAID_UF;u.fill(0);
  u.set(V.cam,0);u.set(V.fwd,4);u.set(V.right,8);u.set(V.up,12);
  u.set([V.F,V.CY,W,H],16);u.set([V.px,V.py,V.pz,V.a],20);
  u.set([G.t,RCELL,RCELL*10,Math.min(LP.length,RAID_LAMPS)],24);
  u.set([Math.sin(V.a),-.16,Math.cos(V.a),DPR],28);
  {const l=Math.hypot(u[28],u[29],u[30]);u[28]/=l;u[29]/=l;u[30]/=l;}
  for(let i=0;i<Math.min(LP.length,RAID_LAMPS);i++){
    const L=LP[i];u.set([L.x,L.y,L.z,L.f],32+i*4);u.set([L.col[0]/255,L.col[1]/255,L.col[2]/255,L.r],32+RAID_LAMPS*4+i*4);
  }
  const oc0=32+RAID_LAMPS*8;OC=OC||[];
  for(let i=0;i<RAID_OCC;i++)u.set(i<OC.length?[OC[i][0],OC[i][1],OC[i][2],1]:[0,0,1,0],oc0+i*4);
  const d=GPU.dev,BU=GPUBufferUsage;
  const qb=gpuBuf("raid.q",n*80,BU.STORAGE|BU.COPY_DST),ub=gpuBuf("raid.u",u.byteLength,BU.UNIFORM|BU.COPY_DST);
  d.queue.writeBuffer(qb,0,f,0,n*20);d.queue.writeBuffer(ub,0,u);
  /* конвейер — один на устройство (GPU.lay сбрасывается с ним); gpuPipeline сам не кэширует */
  const P=GPU.lay.raid3d||(GPU.lay.raid3d=gpuPipeline("raid3d",raidGpuDesc));
  ps.setPipeline(P);
  ps.setBindGroup(0,gpuBind("raid3d",P,[ub,qb]));
  ps.draw(6,n,0,0);
  /* тела — после всех граней: полупрозрачная кромка ложится на уже нарисованное */
  if(FS&&FS.length){
    const SP=GPU.lay.raidspr||(GPU.lay.raidspr=gpuPipeline("raid3d.spr",raidSprDesc));
    const sf=new Float32Array(FS.length*8);
    FS.forEach((s,i)=>sf.set([s.c[0],s.c[1],s.c[2],s.hw,s.hh,-16,0,0],i*8));
    const sb=gpuBuf("raid.s",sf.byteLength,BU.STORAGE|BU.COPY_DST);d.queue.writeBuffer(sb,0,sf);
    ps.setPipeline(SP);
    FS.forEach((s,i)=>{
      if(s.B.draw&&s.B.dev!==GPU.dev)gpuBakeRedo(s.B);
      ps.setBindGroup(0,gpuBind("raid3d.spr|"+i,SP,[ub,sb,s.B.view,gpuMipSmp()]));
      ps.draw(6,1,0,i);
    });
  }
}
function raidSprDesc(){
  const m=gpuShader(RAID_SPR_WGSL);
  return {layout:"auto",vertex:{module:m,entryPoint:"vs"},
    fragment:{module:m,entryPoint:"fs",targets:[{format:"rgba16float",blend:GPU_BLEND.over}]},
    primitive:{topology:"triangle-list"},
    depthStencil:{format:"depth24plus",depthWriteEnabled:true,depthCompare:"less"}};
}
/* общее: числа кадра, проекция, свет в точке мира (рассеянный, фонарь, лампы, тени на полу) */
const RAID_WGSL_COMMON=`
struct RU{cam:vec4f,fwd:vec4f,rgt:vec4f,up:vec4f,prj:vec4f,ply:vec4f,misc:vec4f,tor:vec4f,
  lp:array<vec4f,${RAID_LAMPS}>,lc:array<vec4f,${RAID_LAMPS}>,oc:array<vec4f,${RAID_OCC}>};
@group(0) @binding(0) var<uniform> ru:RU;
/* та же проекция, что у 2D (x = W/2 + dr·F/z, y = CY − du·F/z), в отсечённых координатах;
   глубина — 1 − n/z со сдвигом (минус — ближе) */
fn rclip(w:vec3f,bias:f32)->vec4f{
  let v=w-ru.cam.xyz;let zc=dot(v,ru.fwd.xyz);
  let F=ru.prj.x;let CY=ru.prj.y;let Wd=ru.prj.z;let Hd=ru.prj.w;
  let n=4.;let a=8000./(8000.-n);
  return vec4f(2.*F/Wd*dot(v,ru.rgt.xyz),zc*(1.-2.*CY/Hd)+2.*F/Hd*dot(v,ru.up.xyz),a*(zc+bias)-a*n,zc);}
/* плечо светлых: у фонаря вплотную стена и тело не выгорают в белое */
fn rshoul(c:vec3f)->vec3f{let k=.70;return select(c,k+(1.-k)*(1.-exp(-(c-k)/(1.-k))),c>vec3f(k));}
fn rhs(p:vec3f)->f32{return fract(sin(dot(p,vec3f(127.1,311.7,74.7)))*43758.5453);}
/* прожектор шлема в точке s: конус, спад, 0..1 */
fn torch(s:vec3f)->f32{
  let hp=ru.ply.xyz+vec3f(0.,44.,0.);let ld=s-hp;let dl=length(ld);
  let cs=dot(ld/max(dl,1e-3),ru.tor.xyz);
  return smoothstep(.60,.93,cs)/(1.+dl*dl/(430.*430.));}
/* свет в точке w с нормалью N: рассеянный от человека, пятно у ног, фонарь, лампы */
fn rlight(w:vec3f,N:vec3f)->vec3f{
  let rc=ru.misc.y;let pp=ru.ply.xyz;let dp=length((w-pp).xz);
  var L=vec3f(clamp(.74-dp/(rc*9.),.05,1.)+clamp(1.-dp/(rc*2.6),0.,1.)*.20);
  let hp=pp+vec3f(0.,44.,0.);let ln=normalize(w-hp);
  L+=vec3f(1.,.93,.80)*torch(w)*(clamp(dot(N,-ln),0.,1.)*.8+.2)*1.05;
  let nl=i32(ru.misc.w);
  for(var k=0;k<${RAID_LAMPS};k++){
    if(k>=nl){break;}
    let q=ru.lp[k];let lv=q.xyz-w;let d2=dot(lv,lv);let rr=ru.lc[k].w;
    let nd=clamp(dot(N,lv*inverseSqrt(max(d2,1.))),0.,1.)*.75+.25;
    L+=ru.lc[k].rgb*q.w*nd/(1.+d2/(rr*rr));
  }
  /* под тем, кто стоит, — тень на полу (только на том, что смотрит вверх) */
  if(N.y>.6){
    for(var k=0;k<${RAID_OCC};k++){
      let o=ru.oc[k];if(o.w<.5){continue;}
      let d=length(w.xz-o.xy)/o.z;L*=1.-.55*exp(-d*d);
    }
  }
  return L;}`;
const RAID_GPU_WGSL=RAID_WGSL_COMMON+`
@group(0) @binding(1) var<storage,read> rq:array<vec4f>;
struct VO{@builtin(position) p:vec4f,@location(0) w:vec3f,@location(1) @interpolate(flat) c:vec4f,
  @location(2) @interpolate(flat) e:vec4f,@location(3) uv:vec2f};
@vertex fn vs(@builtin(vertex_index) vi:u32,@builtin(instance_index) ii:u32)->VO{
  var ci=array(0u,1u,2u,0u,2u,3u);
  var uu=array(vec2f(0.,0.),vec2f(1.,0.),vec2f(1.,1.),vec2f(0.,1.));
  let k=ci[vi];let b=ii*5u;
  let w=rq[b+k].xyz;let e=rq[b+4u];
  var o:VO;
  o.p=rclip(w,e.z);
  o.w=w;o.c=vec4f(rq[b].w,rq[b+1u].w,rq[b+2u].w,rq[b+3u].w);o.e=e;o.uv=uu[k];
  return o;}
fn rvn3(p:vec3f)->f32{let i=floor(p);let f=fract(p);let u=f*f*(3.-2.*f);
  let a=mix(mix(rhs(i),rhs(i+vec3f(1.,0.,0.)),u.x),mix(rhs(i+vec3f(0.,1.,0.)),rhs(i+vec3f(1.,1.,0.)),u.x),u.y);
  let b=mix(mix(rhs(i+vec3f(0.,0.,1.)),rhs(i+vec3f(1.,0.,1.)),u.x),mix(rhs(i+vec3f(0.,1.,1.)),rhs(i+vec3f(1.,1.,1.)),u.x),u.y);
  return mix(a,b,u.z);}
@fragment fn fs(i:VO)->@location(0) vec4f{
  /* производные — до ветвления: в неоднородной ветке их нельзя */
  let dN=cross(dpdx(i.w),dpdy(i.w));let fw=max(fwidth(i.uv),vec2f(1e-4));
  let base=i.c.rgb*i.c.w;
  let fogc=vec3f(9.,11.,17.)/255.;
  let rc=ru.misc.y;let t=ru.misc.x;
  let cam=ru.cam.xyz;let seg=i.w-cam;let camd=length(seg);
  var col:vec3f;
  if(i.e.x>.5){col=base*1.3;}
  else{
    var N=normalize(dN);
    if(dot(N,cam-i.w)<0.){N=-N;}
    /* рассеянный гаснет от человека к дальним отсекам, у ног — пятно; фонарь на
       шлеме тёплый и ложится по нормали; светильники — точки со спадом */
    var L=rlight(i.w,N);
    L=max(L,vec3f(i.e.w));
    col=base*L;
    /* контур грани — где светло, как у 2D (штрих при li>.3) */
    if(i.e.y>.5){
      let ed=min(min(i.uv.x,1.-i.uv.x)/fw.x,min(i.uv.y,1.-i.uv.y)/fw.y);
      col*=1.-.35*clamp(1.5-ed,0.,1.)*step(.3,dot(L,vec3f(.333)));
    }
    col=mix(col,fogc,clamp((camd-rc*1.5)/(rc*10.),0.,.85));
  }
  /* луч в воздухе: от глаза до грани, двенадцать отсчётов со сдвигом по пикселю —
     стена луч обрезает; взвесь в луче — медленный шум по миру */
  var sc=0.;let jt=rhs(vec3f(i.p.xy,fract(t*.013)));
  let ns=12;let dl=camd/f32(ns);
  for(var j=0;j<ns;j++){
    let s=cam+seg*((f32(j)+jt)/f32(ns));
    let tv=torch(s);
    if(tv>.002){sc+=tv*(.45+.55*rvn3(s/38.+vec3f(t*.004,t*.002,-t*.003)));}
  }
  /* насыщение: вплотную к фонарю луч не заливает кадр белой стеной */
  let bm=sc*dl*.0018;col+=vec3f(1.,.92,.78)*bm/(1.+bm*2.2);
  /* светильники в воздухе: ореол у каждой из четырёх ближних */
  for(var k=0;k<4;k++){
    if(k>=i32(ru.misc.w)){break;}
    let q=ru.lp[k];let rr=ru.lc[k].w;
    let tt=clamp(dot(q.xyz-cam,seg)/max(camd*camd,1.),0.,1.);
    let h=length(cam+seg*tt-q.xyz);
    col+=ru.lc[k].rgb*q.w*.10*exp(-h*h/(rr*rr*.35));
  }
  /* края кадра темнее: база, в которую влезли с фонарём */
  let sp=(i.p.xy/ru.tor.w-vec2f(ru.prj.z*.5,ru.prj.w*.5))/(max(ru.prj.z,ru.prj.w)*.62);
  col*=1.-.42*smoothstep(.35,1.,length(sp));
  if(i.e.x<.5){col=rshoul(col);}
  return vec4f(col,1.);}`;
/* тело-спрайт: щит лицом к камере (её «право» и «верх»), глубина — ближе на 16:
   иначе пол у самых ног спорит с подошвами. Прозрачное отбрасывается, кромка
   ложится поверх нарисованного; свет — тот же, что у граней, с нормалью к камере */
const RAID_SPR_WGSL=RAID_WGSL_COMMON+`
@group(0) @binding(1) var<storage,read> rs:array<vec4f>;
@group(0) @binding(2) var stx:texture_2d<f32>;
@group(0) @binding(3) var ssm:sampler;
struct SO{@builtin(position) p:vec4f,@location(0) w:vec3f,@location(1) uv:vec2f};
@vertex fn vs(@builtin(vertex_index) vi:u32,@builtin(instance_index) ii:u32)->SO{
  var cc=array(vec2f(-1.,1.),vec2f(1.,1.),vec2f(1.,-1.),vec2f(-1.,1.),vec2f(1.,-1.),vec2f(-1.,-1.));
  let a=rs[ii*2u];let b=rs[ii*2u+1u];let c=cc[vi];
  let w=a.xyz+ru.rgt.xyz*(c.x*a.w)+ru.up.xyz*(c.y*b.x);
  var o:SO;o.p=rclip(w,b.y);o.w=w;o.uv=vec2f(c.x*.5+.5,.5-c.y*.5);return o;}
@fragment fn fs(i:SO)->@location(0) vec4f{
  let s=textureSample(stx,ssm,i.uv);
  if(s.a<.3){discard;}
  let camd=length(i.w-ru.cam.xyz);let rc=ru.misc.y;
  let L=rlight(i.w,-ru.fwd.xyz)*.82;
  var col=rshoul(s.rgb*L);
  col=mix(col,vec3f(9.,11.,17.)/255.*s.a,clamp((camd-rc*1.5)/(rc*10.),0.,.85));
  return vec4f(col,s.a);}`;
