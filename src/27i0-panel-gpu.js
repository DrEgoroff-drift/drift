/* ══ 27i0 · картинки панелей на видеокарте (G15) ══
   Стол (27i, 27ia) рисовал 2D: столешницу, ленты, значки вещей — в свежую канву при
   каждой перестройке. Теперь та же кисть печётся разово (gpuBake через ckgSpr) и одним
   проходом ложится в свою канву WebGPU; канва держит картинку до следующей перестройки,
   выпечка сразу в мусор. Проход — своим энкодером и сразу в очередь: панель строят
   клик и таймер, а не кадр.
   lw×lh — поле кисти (то, в чём она рисовала в 2D), nd — пикселей канвы на единицу поля. */
const PANEL={T:null,dev:null,n:0};
/* плотность панели: экран и zoom интерфейса (M221) — как у прежней 2D-печи стола */
function panelNd(){return Math.min(2,window.devicePixelRatio||1)*(typeof UIK==="number"?UIK:1);}
function panelGpu(cv,lw,lh,nd,paint){
  const pw=Math.max(1,Math.round(lw*nd)),ph=Math.max(1,Math.round(lh*nd));
  if(cv.width!==pw)cv.width=pw;if(cv.height!==ph)cv.height=ph;
  if(!GPU.ok||!GPU.dev)return false;
  const d=GPU.dev,cx=cv.getContext("webgpu");if(!cx)return false;
  if(cv._pdev!==d){cx.configure({device:d,format:GPU.fmt,alphaMode:"premultiplied"});cv._pdev=d;}
  if(PANEL.dev!==d){PANEL.T=ovTarget();PANEL.dev=d;}
  const T=PANEL.T;let M=null;
  ovInto(T,pw/lw,()=>{M=ckgSpr(0,0,lw,lh,paint,{once:true});ckgPut(M);});
  const e0=GPU.enc;GPU.enc=d.createCommandEncoder();
  try{ovPass(T,cx.getCurrentTexture().createView(),pw,ph,[T.uq],"panel");d.queue.submit([GPU.enc.finish()]);}
  finally{GPU.enc=e0;if(M)gpuBakeDrop(M.B);}
  PANEL.n++;return true;
}
