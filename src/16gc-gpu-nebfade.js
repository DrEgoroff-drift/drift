/* ── туманность: плавный пересчёт ──
   Стоя (сдвиг камеры < .5) пересчёт идёт раз в GNB_AGE кадров в запасную текстуру, а видимая
   за GNB_AGE кадров линейно перетекает в неё: смешение с постоянной k = 1/6, 1/5 … 1 даёт
   ровную линию от старой к свежей. Течение газа (~1 px за 6 кадров) идёт по 1/6 за кадр, а не
   скачком раз в пересчёт; пересчёт стоя — вдвое реже прежнего (был раз в 3 кадра). На ходу,
   при смене системы и размера цели — пишет прямо в видимую, без перетекания */
const GNB_AGE=6;
const GNB_FADE=`
@group(0) @binding(0) var t:texture_2d<f32>;
@vertex fn vs(@builtin(vertex_index) i:u32)->@builtin(position) vec4f{
  var P=array(vec2f(-1.,-1.),vec2f(3.,-1.),vec2f(-1.,3.));return vec4f(P[i],0.,1.);}
@fragment fn fs(@builtin(position) p:vec4f)->@location(0) vec4f{return textureLoad(t,vec2i(p.xy),0);}`;
function gnbFadeDesc(){
  const m=gpuShader(GNB_FADE),b={srcFactor:"constant",dstFactor:"one-minus-constant"};
  return {layout:"auto",vertex:{module:m,entryPoint:"vs"},
    fragment:{module:m,entryPoint:"fs",targets:[{format:"rgba16float",blend:{color:b,alpha:b}}]},primitive:{topology:"triangle-list"}};
}
/* куда писать пересчёт: стоя в той же системе — в запасную (перетекание), иначе в видимую */
function gnbGenView(sys,moved){
  if(!(GNB.sys===sys&&moved<.5&&GNB.last>=0)){GNB.fi=GNB_AGE;return GNB.view;}
  if(!(GNB.t2&&GNB.t2d===GNB.tex)){
    if(GNB.t2)GPU.trash.push(GNB.t2);
    const U=GPUTextureUsage;
    GNB.t2=GPU.dev.createTexture({size:[GNB.w,GNB.h],format:"rgba16float",usage:U.TEXTURE_BINDING|U.RENDER_ATTACHMENT});
    GNB.t2v=GNB.t2.createView();GNB.t2d=GNB.tex;
  }
  GNB.fi=0;return GNB.t2v;
}
/* шаг перетекания: k=1/(AGE−i) — через AGE шагов видимая равна свежей */
function gnbFade(){
  if(!(GNB.fi<GNB_AGE)||GNB.t2d!==GNB.tex)return;
  const k=1/(GNB_AGE-GNB.fi),K="gnb.fade",P=GPU.lay[K]||(GPU.lay[K]=gpuPipeline(K,gnbFadeDesc));GNB.fi++;
  const p=GPU.enc.beginRenderPass({colorAttachments:[{view:GNB.view,loadOp:"load",storeOp:"store"}],timestampWrites:gpuTs("nebFade")});
  p.setPipeline(P);p.setBlendConstant([k,k,k,k]);p.setBindGroup(0,gpuBind(K,P,[GNB.t2v]));p.draw(3);p.end();
}
