/* ── туманность: пересчёт полосами и показ по сдвигу камеры (24.10, телефон) ──
   На S23 при потолке видеокарты 295 МГц полный пересчёт объёма стоил 10.7 мс, и шёл он каждый кадр: на орбите
   камера всегда сдвигалась больше прежнего порога «стоя» (.03), и перетекание раз в 6 кадров не включалось никогда.
   Теперь объём считается в цель с полем запаса GNB_GM текселей по краю, одной полосой из GNB_N за кадр и с
   камерой и временем, замороженными на начало цикла (16gba пишет форму раз в цикл). Видимую (GNB.tex — её читают
   сведение, звёзды, корпуса и блум) каждый кадр собирает gnbResolve из двух готовых пересчётов: каждый сдвинут на
   свой (камера − камера пересчёта)·GNB_RP — параллакс газа, — и свежий перетекает в прежний за GNB_N кадров.
   Цикл считается для камеры и времени, упреждённых на середину его показа (gnbLead, скорость — gnbCamVel): остаток
   параллакса слоёв и узор, стоящий на звезде (стены пыли, свет), расходятся в обе стороны от нуля, а не отстают на
   весь возраст цикла. Проба на ПК (полный пересчёт против собранной, тон 0–255): стоя .08 при шуме .07, орбита .3,
   пролёт 3 px/кадр ~1.5.
   Течение газа и остаток параллакса слоёв (.02–.12 против GNB_RP) идут ровно, без скачка раз в цикл: прежний
   закон 26.09 (туманность стояла и прыгала на полпикселя — автор видел «просадку») держится. Выборка — Catmull-Rom:
   в покое возвращает тексель как есть, на ходу не мылит. Сразу и целиком — при смене системы, размера, потере
   устройства и когда сдвиг вышел за запас (рывок камеры). */
const GNB_RES=`
struct RU{a:vec4f,b:vec4f};
@group(0) @binding(0) var<uniform> r:RU;
@group(0) @binding(1) var smp:sampler;
@group(0) @binding(2) var tA:texture_2d<f32>;
@group(0) @binding(3) var tB:texture_2d<f32>;
@vertex fn vs(@builtin(vertex_index) i:u32)->@builtin(position) vec4f{
  var P=array(vec2f(-1.,-1.),vec2f(3.,-1.),vec2f(-1.,3.));return vec4f(P[i],0.,1.);}
/* Catmull-Rom девятью билинейными выборками; j — координата в текселях (центры на .5) */
fn cr(t:texture_2d<f32>,j:vec2f)->vec4f{
  let ts=vec2f(textureDimensions(t));let c=floor(j-.5)+.5;let f=j-c;
  let w0=f*(-.5+f*(1.-.5*f));let w1=1.+f*f*(-2.5+1.5*f);let w2=f*(.5+f*(2.-1.5*f));let w3=f*f*(-.5+.5*f);
  let w12=w1+w2;let o0=(c-1.)/ts;let o3=(c+2.)/ts;let o12=(c+w2/w12)/ts;
  return (textureSampleLevel(t,smp,vec2f(o0.x,o0.y),0.)*w0.x+textureSampleLevel(t,smp,vec2f(o12.x,o0.y),0.)*w12.x+textureSampleLevel(t,smp,vec2f(o3.x,o0.y),0.)*w3.x)*w0.y
        +(textureSampleLevel(t,smp,vec2f(o0.x,o12.y),0.)*w0.x+textureSampleLevel(t,smp,vec2f(o12.x,o12.y),0.)*w12.x+textureSampleLevel(t,smp,vec2f(o3.x,o12.y),0.)*w3.x)*w12.y
        +(textureSampleLevel(t,smp,vec2f(o0.x,o3.y),0.)*w0.x+textureSampleLevel(t,smp,vec2f(o12.x,o3.y),0.)*w12.x+textureSampleLevel(t,smp,vec2f(o3.x,o3.y),0.)*w3.x)*w3.y;}
/* r.a — сдвиг газа в текселях у A и B, r.b — доля свежей, размер цели пересчёта, поле запаса. Сдвиг не выходит
   за поле (за ним выборка тянула бы кромку) */
@fragment fn fs(@builtin(position) p:vec4f)->@location(0) vec4f{
  let j=p.xy+vec2f(r.b.w);let M=vec2f(r.b.w-2.);
  let b=cr(tB,j+clamp(r.a.zw,-M,M));
  if(r.b.x>=1.){return max(b,vec4f(0.));}
  return max(mix(cr(tA,j+clamp(r.a.xy,-M,M)),b,r.b.x),vec4f(0.));}`;
function gnbResDesc(){
  const m=gpuShader(GNB_RES);
  return {layout:"auto",vertex:{module:m,entryPoint:"vs"},
    fragment:{module:m,entryPoint:"fs",targets:[{format:"rgba16float"}]},primitive:{topology:"triangle-list"}};
}
/* три цели пересчёта с полем запаса: A и B показываются, C строится полосами. Пересоздаются с видимой */
function gnbGenTargets(){
  if(GNB.g&&GNB.gd===GNB.tex)return;
  if(GNB.g&&GNB.g[0].dev===GPU.dev)for(const s of GNB.g)GPU.trash.push(s.tex);
  const gw=GNB.w+2*GNB_GM,gh=GNB.h+2*GNB_GM,U=GPUTextureUsage;
  GNB.g=[0,1,2].map(()=>{const tex=GPU.dev.createTexture({size:[gw,gh],format:"rgba16float",usage:U.TEXTURE_BINDING|U.RENDER_ATTACHMENT});
    return {tex,view:tex.createView(),cx:0,cy:0,dev:GPU.dev};});
  GNB.gd=GNB.tex;GNB.gw=gw;GNB.gh=gh;GNB.ia=0;GNB.ib=1;GNB.ic=2;GNB.cs=0;GNB.kn=GNB_N;GNB.gok=false;
  GNB.RO=GNB.RO||new Float32Array(8);
}
/* сдвиг выборки пересчёта s в текселях: газ уехал на (камера − камера пересчёта)·параллакс */
function gnbOff(s,camx,camy,o,i){o[i]=(camx-s.cx)*GNB_RP*GNB.w/W;o[i+1]=(camy-s.cy)*GNB_RP*GNB.h/H;}
/* нужен ли полный пересчёт сразу: нет готового, другая система, сдвиг свежего вышел за запас (2 — опора выборки) */
function gnbGenNeed(sys,camx,camy){
  gnbGenTargets();
  if(!GNB.gok||GNB.sys!==sys)return true;
  const o=GNB.RO;gnbOff(GNB.g[GNB.ib],camx,camy,o,2);
  return Math.max(Math.abs(o[2]),Math.abs(o[3]))>GNB_GM-2;
}
/* скорость камеры (px за кадр) и течения газа (время шейдера за кадр), сглаженные: прыжок — смена системы,
   телепорт, перемотка времени — их сбрасывает. Течение линейно во времени — упреждается точно */
function gnbCamVel(sys,camx,camy,t){
  if(GNB.pcx==null||GNB.vsys!==sys){GNB.vx=0;GNB.vy=0;GNB.vt=0;}
  else{const dx=camx-GNB.pcx,dy=camy-GNB.pcy,dt=t-GNB.pt;
    if(dx*dx+dy*dy>200*200){GNB.vx=0;GNB.vy=0;}else{GNB.vx+=(dx-GNB.vx)*.35;GNB.vy+=(dy-GNB.vy)*.35;}
    if(!(dt>=0&&dt<.01))GNB.vt=0;else GNB.vt+=(dt-GNB.vt)*.35;}
  GNB.pcx=camx;GNB.pcy=camy;GNB.pt=t;GNB.vsys=sys;
}
/* упреждение в кадрах: цикл, начатый в кадре F, строится до F+N−1, полный вес у него в F+2N−2, сходит к F+3N−2 —
   середина показа на 2N−2 кадров вперёд */
function gnbLead(){return 2*GNB_N-2;}
/* полоса цикла в C (или весь объём сразу); цикл кончился — C становится свежей B, B — прежней A. Камера цикла —
   упреждённая (GNB.gcx, 16gba) */
function gnbGenSlice(sync,camx,camy,ub){
  const C=GNB.g[GNB.ic],P=gnbPipe(),N=sync?1:GNB_N,s=sync?0:GNB.cs;
  if(s===0){C.cx=GNB.gcx;C.cy=GNB.gcy;}
  const p=GPU.enc.beginRenderPass({colorAttachments:[{view:C.view,loadOp:s===0?"clear":"load",storeOp:"store",clearValue:{r:0,g:0,b:0,a:0}}],timestampWrites:gpuTs("nebGen")});
  p.setPipeline(P);p.setBindGroup(0,gpuBind("gnb.gen",P,[ub,GPU.S.lin,gnbNoiseTile()]));
  if(N>1){const y0=Math.floor(GNB.gh*s/N),y1=Math.floor(GNB.gh*(s+1)/N);p.setScissorRect(0,y0,GNB.gw,y1-y0);}
  p.draw(3);p.end();
  GNB.nGen=(GNB.nGen||0)+1/N;
  if(sync||++GNB.cs>=GNB_N){const a=GNB.ia;GNB.ia=GNB.ib;GNB.ib=GNB.ic;GNB.ic=a;GNB.cs=0;GNB.kn=sync?GNB_N:0;GNB.gok=true;}
}
/* видимая = прежняя A и свежая B, каждая со своим сдвигом; свежая набирает вес 1/N за кадр */
function gnbResolve(camx,camy){
  if(!GNB.gok)return;
  const o=GNB.RO,A=GNB.g[GNB.ia],B=GNB.g[GNB.ib];
  gnbOff(A,camx,camy,o,0);gnbOff(B,camx,camy,o,2);
  let k=Math.min(1,(GNB.kn+1)/GNB_N);GNB.kn++;
  if(Math.max(Math.abs(o[0]),Math.abs(o[1]))>GNB_GM-2)k=1;
  o[4]=k;o[5]=GNB.gw;o[6]=GNB.gh;o[7]=GNB_GM;
  const U=GPUBufferUsage,ub=gpuBuf("gnb.r",32,U.UNIFORM|U.COPY_DST);GPU.dev.queue.writeBuffer(ub,0,o);
  const K="gnb.res",P=GPU.lay[K]||(GPU.lay[K]=gpuPipeline(K,gnbResDesc));
  const p=GPU.enc.beginRenderPass({colorAttachments:[{view:GNB.view,loadOp:"clear",storeOp:"store",clearValue:{r:0,g:0,b:0,a:0}}],timestampWrites:gpuTs("nebRes")});
  p.setPipeline(P);p.setBindGroup(0,gpuBind(K+GNB.ia+GNB.ib,P,[ub,GPU.S.lin,A.view,B.view]));p.draw(3);p.end();
}
