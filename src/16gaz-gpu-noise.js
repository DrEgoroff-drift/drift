/* ══════════════ плитка шума туманности (P1 13/n–14/n, docs/DESIGN-gpu.md) ══════════════
   Шум туманности (пересчёт GNB_GEN, мелкая деталь сведения fineT/fineE, 16gb) — по решётке:
   четыре хэша gh на каждый gn. Узлы решётки запечены плиткой 2049² (r16float, 8 МБ) — её
   печёт видеокарта тем же gh, один раз: тексел k — gh(k−1024). gnt собирает четыре узла одним
   textureGather; период 2048, последний ряд и столбец повторяют первый, так что шва нет. Узлы
   решётки у пересчёта: 98 % в ±511, за ±1023 — пять на сто тысяч (гистограмма 24.09) — только у
   них реализация шума другая. Ветка «за окном — считать хэш» дороже самой плитки: компилятор
   считает обе стороны. Смесь по сглаженным долям — в арифметике, как у gn: фильтр сэмплера дал
   бы 8-битные веса и ступени в плавном газе */
const GNB_TILE=`
fn gnt(p:vec2f)->f32{let i=floor(p);let f=p-i;let w=f*f*(3.-2.*f);
  let k=i+1024.-2048.*floor((i+1024.)/2048.);
  let g=textureGather(0,t1,smp,(k+1.)/2049.);
  return mix(mix(g.w,g.z,w.x),mix(g.x,g.y,w.x),w.y);}
fn fbt(p0:vec2f,n:i32)->f32{var p=p0;var s=0.;var a=.5;var m=0.;
  for(var k=0;k<n;k++){s=s+a*gnt(p);m=m+a;p=mat2x2f(1.6,1.2,-1.2,1.6)*p+vec2f(3.1,7.7);a=a*.5;}
  return s/m;}`;
/* печь плитки: к нему спереди — GNB_NOISE (16gb, склеен позже — берётся при вызове) */
const GNB_TILE_BAKE=`
@vertex fn vs(@builtin(vertex_index) i:u32)->@builtin(position) vec4f{
  var P=array(vec2f(-1.,-1.),vec2f(3.,-1.),vec2f(-1.,3.));return vec4f(P[i],0.,1.);}
@fragment fn fs(@builtin(position) q:vec4f)->@location(0) vec4f{
  let x=floor(q.xy);return vec4f(gh(x-2048.*floor(x/2048.)-1024.),0.,0.,1.);}`;
function gnbNoiseDesc(){const mod=gpuShader(GNB_NOISE+GNB_TILE_BAKE);return {layout:"auto",vertex:{module:mod,entryPoint:"vs"},
    fragment:{module:mod,entryPoint:"fs",targets:[{format:"r16float"}]},primitive:{topology:"triangle-list"}};}
function gnbNoiseTile(){
  if(GNB.nzv&&GNB.nzDev===GPU.dev)return GNB.nzv;
  const d=GPU.dev,S=2049,U=GPUTextureUsage;
  const t=d.createTexture({size:[S,S],format:"r16float",usage:U.TEXTURE_BINDING|U.RENDER_ATTACHMENT});
  const P=gpuPipeline("gnb.noise",gnbNoiseDesc);
  const v=t.createView(),e=d.createCommandEncoder();
  const p=e.beginRenderPass({colorAttachments:[{view:v,loadOp:"clear",storeOp:"store",clearValue:{r:0,g:0,b:0,a:0}}]});
  p.setPipeline(P);p.draw(3);p.end();d.queue.submit([e.finish()]);
  GNB.nzDev=d;return GNB.nzv=v;
}
