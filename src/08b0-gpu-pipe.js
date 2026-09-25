/* ══════════════ конвейеры: одна воронка (прогрев, DESIGN-gpu §G) ══════════════
   Chrome компилирует конвейер WebGPU при создании и хранит скомпилированное
   по сайту: игрок с первого захода ловил рывки 50–67 мс у гостиницы и щита
   (S23, 25.09) — там создавались пять вариантов gcPipe, размытие и неон.
   Каждый ленивый создатель идёт сюда: gpuPipeline(ключ, рецепт). Прогретый
   ключ отдаётся готовым, иначе конвейер строится здесь же и ключ пишется
   в GPU_PIPES.lazy — это и видит детектор. Модули шейдеров — по тексту, один раз. */
const GPU_PIPES={dev:null,warm:new Map(),mods:new Map(),lazy:[]};
function gpuPipesDev(){
  const d=GPU.dev;
  if(GPU_PIPES.dev!==d){GPU_PIPES.dev=d;GPU_PIPES.warm=new Map();GPU_PIPES.mods=new Map();}
  return d;
}
function gpuShader(code){
  const d=gpuPipesDev();let m=GPU_PIPES.mods.get(code);
  if(!m){m=d.createShaderModule({code});GPU_PIPES.mods.set(code,m);}
  return m;
}
function gpuPipeline(key,mk){
  const d=gpuPipesDev(),w=GPU_PIPES.warm.get(key);
  if(w&&w.p)return w.p;
  if(GPU_PIPES.lazy.length<256)GPU_PIPES.lazy.push(key);
  return d.createRenderPipeline(mk());
}
