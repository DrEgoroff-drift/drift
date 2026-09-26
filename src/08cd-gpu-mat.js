/* ══════════════ материал корпуса: раз на корпус, в той же выпечке (ступень 1, DESIGN-gpu §L.S) ══════════════
   GST (17c) выводил рельеф из альфы мастера на каждом пикселе каждого кадра: 12 выборок нормалей на
   трёх масштабах и 8 — купол стекла с нулевого уровня (рябь на мелком). Здесь это один проход при
   выпечке мастера (o.mat — текселей мастера на единицу корпуса), в том же кодировщике: лишнего submit
   нет. Цель — полуразмерная rgba16f с мипами:
   rg — широкая нормаль (перепад альфы на ±3 и ±8 единиц, как было);
   ba — мелкий рельеф: краска (перепад яркости на ±¾ единицы: швы и панели ловят кромку звезды, а не
        только край силуэта) и купол стекла на ±2 и ±4 единицы. GST кладёт его в тонкую нормаль и блик стекла.
   Перепады — в осях мастера и в единицах корпуса, так что зум их не меняет; поворот и крен — в шейдере.
   Тонкая кромка (полпикселя экрана) остаётся живой: она про экран, не про корпус */
const GC_MAT_K=2;   /* вес рельефа краски: .35 и 1.2 не видно (корпус светится плоско), 4 — рябит жестью */
const GC_MAT_WGSL=`
@group(0) @binding(0) var s:texture_2d<f32>;
@group(0) @binding(1) var sm:sampler;
@group(0) @binding(2) var<uniform> mu:vec4f;   /* xy — единица корпуса в uv, z — уровень мипа (тексель ≈ ⅓ единицы), w — вес рельефа краски */
struct O{@builtin(position) p:vec4f,@location(0) uv:vec2f};
@vertex fn vs(@builtin(vertex_index) i:u32)->O{var P=array(vec2f(-1.,-1.),vec2f(3.,-1.),vec2f(-1.,3.));
  var o:O;o.p=vec4f(P[i],0.,1.);o.uv=vec2f(P[i].x*.5+.5,.5-P[i].y*.5);return o;}
fn al(uv:vec2f,l:f32)->f32{return textureSampleLevel(s,sm,uv,l).a;}
fn lu(uv:vec2f,l:f32)->f32{return dot(textureSampleLevel(s,sm,uv,l).rgb,vec3f(.299,.587,.114));}
fn gs(uv:vec2f,l:f32)->f32{let c=textureSampleLevel(s,sm,uv,l);let rgb=c.rgb/max(c.a,1e-3);let mx=max(rgb.r,max(rgb.g,rgb.b));
  return smoothstep(.03,.2,rgb.b-rgb.r)*smoothstep(.08,.25,mx)*(1.-smoothstep(.6,.85,mx))*smoothstep(.3,.7,c.a);}
fn dA(uv:vec2f,d:vec2f,l:f32)->vec2f{return vec2f(al(uv+vec2f(d.x,0.),l)-al(uv-vec2f(d.x,0.),l),al(uv+vec2f(0.,d.y),l)-al(uv-vec2f(0.,d.y),l));}
fn dL(uv:vec2f,d:vec2f,l:f32)->vec2f{return vec2f(lu(uv+vec2f(d.x,0.),l)-lu(uv-vec2f(d.x,0.),l),lu(uv+vec2f(0.,d.y),l)-lu(uv-vec2f(0.,d.y),l));}
fn dG(uv:vec2f,d:vec2f,l:f32)->vec2f{return vec2f(gs(uv+vec2f(d.x,0.),l)-gs(uv-vec2f(d.x,0.),l),gs(uv+vec2f(0.,d.y),l)-gs(uv-vec2f(0.,d.y),l));}
@fragment fn fs(i:O)->@location(0) vec4f{let u=mu.xy;let l=mu.z;
  return vec4f(-(dA(i.uv,u*3.,l+1.)*.5+dA(i.uv,u*8.,l+2.)*.5),-dL(i.uv,u*.75,l)*mu.w-(dG(i.uv,u*2.,l)+dG(i.uv,u*4.,l))*.5);}`;
function gcMatPipe(){return GPU.lay["gc.mat"]||(GPU.lay["gc.mat"]=gpuPipeline("gc.mat",gcMatDesc));}
function gcMatDesc(){const m=gpuShader(GC_MAT_WGSL);return {layout:"auto",vertex:{module:m,entryPoint:"vs"},
  fragment:{module:m,entryPoint:"fs",targets:[{format:"rgba16float"}]},primitive:{topology:"triangle-list"}};}
function gcMip16Pipe(){return GPU.lay["gc.mip16"]||(GPU.lay["gc.mip16"]=gpuPipeline("gc.mip16",gcMip16Desc));}
function gcMip16Desc(){const m=gpuShader(GC_MIP_WGSL);return {layout:"auto",vertex:{module:m,entryPoint:"vs"},
  fragment:{module:m,entryPoint:"fs",targets:[{format:"rgba16float"}]},primitive:{topology:"triangle-list"}};}
/* проходы материала в кодировщик выпечки B (его мипы уже готовы); ub — буфер выпечки (512 — единица для мипов) */
function gcMat(enc,B,ub){
  const d=GPU.dev,U=GPUTextureUsage,w=Math.max(1,B.w>>1),h=Math.max(1,B.h>>1),n=Math.max(1,B.n-1),t=B.o.mat;
  const T=d.createTexture({size:[w,h],mipLevelCount:n,format:"rgba16float",usage:U.TEXTURE_BINDING|U.RENDER_ATTACHMENT});
  const mb=gcPoolBuf("mat",GPUBufferUsage.UNIFORM,new Float32Array([t/B.w,t/B.h,Math.max(0,Math.log2(t/3)),GC_MAT_K]));
  const pass=(P,src,lv,buf,off)=>{
    const p=enc.beginRenderPass({colorAttachments:[{view:T.createView({baseMipLevel:lv,mipLevelCount:1}),loadOp:"clear",clearValue:{r:0,g:0,b:0,a:0},storeOp:"store"}]});
    p.setPipeline(P);p.setBindGroup(0,d.createBindGroup({layout:P.getBindGroupLayout(0),entries:[{binding:0,resource:src},{binding:1,resource:gpuMipSmp()},{binding:2,resource:{buffer:buf,offset:off,size:16}}]}));
    p.draw(3);p.end();};
  pass(gcMatPipe(),B.view,0,mb,0);
  const MP=gcMip16Pipe();for(let i=1;i<n;i++)pass(MP,T.createView({baseMipLevel:i-1,mipLevelCount:1}),i,ub,512);
  B.mat={tex:T,view:T.createView()};
}
