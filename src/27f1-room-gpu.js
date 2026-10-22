/* ══════════════ комната в панели — на видеокарте (G11) ══════════════
   Комнаты (рубка, кантина, зал, дом, зимовка, санаторий) рисуют себя на своей канве в DOM, мимо
   кадра мира: эта канва становится WebGPU-холстом того же устройства, что и кадр. Здесь — общее
   для них: холст панели, выпечка по ключу (08ca) и полноэкранное поле (свет, воздух, пост 27f2).
   Спрайтов и 2D-фигур панели больше нет (22.10, автор: «2D не должно быть»). Без устройства
   (Node, gpuNone) всё молчит: комнаты не рисуются, их закрывает плашка «нет WebGPU» (08b2). */
function rpgGet(cn){
  if(!GPU.ok||!GPU.dev||!cn||typeof cn.getContext!=="function")return null;
  let R=cn.__rpg;
  if(!R||R.dev!==GPU.dev){
    const cx=cn.getContext("webgpu");if(!cx)return null;
    cx.configure({device:GPU.dev,format:"rgba16float",alphaMode:"premultiplied"});
    const U=GPUBufferUsage,d=GPU.dev;
    R=cn.__rpg={cn,cx,dev:d,S:null,Sv:null,W:0,H:0,bg:new Map(),
      fa:d.createBuffer({size:256*8,usage:U.UNIFORM|U.COPY_DST}),fn:0,bk:new Map()};
  }
  return R;
}
/* поле панели: код — как у gpuField (fn field(p,uv), fu.v[0..14], t0..t3), p — CSS-пиксели панели */
function rpgField(R,pass,name,code,uni,texs,blend){
  const d=GPU.dev;blend=blend||"over";
  const P=gpuPipe("fld."+name,GPU_WGSL_COMMON+GPU_FLD_HEAD+code,blend,gpuFieldLayout());
  if(R.fn>=8)return;
  const slot=R.fn++,f=new Float32Array(64);
  f[0]=R.W;f[1]=R.H;f[2]=R.cssW;f[3]=R.cssH;if(uni)f.set(uni.subarray?uni.subarray(0,60):uni.slice(0,60),4);
  d.queue.writeBuffer(R.fa,slot*256,f);
  if(!GPU.nView)GPU.nView=GPU.N.createView();
  const tv=[0,1,2,3].map(k=>(texs&&texs[k])?(texs[k].view||texs[k]):GPU.nView);
  const key="fld|"+slot+"|"+tv.map(rpgTexId).join(",");
  let b=R.bg.get(key);
  if(!b)R.bg.set(key,b={bg:d.createBindGroup({layout:GPU.fL,entries:[
    {binding:0,resource:{buffer:R.fa,offset:slot*256,size:256}},{binding:1,resource:GPU.S.lin},
    {binding:2,resource:tv[0]},{binding:3,resource:tv[1]},{binding:4,resource:tv[2]},{binding:5,resource:tv[3]}]})});
  pass.setPipeline(P);pass.setBindGroup(0,b.bg);pass.draw(3);
}
/* ярлык ресурса для ключа привязки: объект → номер (выпечки и виды меняются при перепечке) */
const RPG_IDS=new WeakMap();let RPG_ID=0;
function rpgTexId(x){if(!x)return 0;const o=x.view||x;let i=RPG_IDS.get(o);if(!i){i=++RPG_ID;RPG_IDS.set(o,i);}return i;}
/* выпечка панели по ключу: сменился ключ — старая уходит в корзину. M — Map панели,
   slot — имя части (стена, стол, подписи), key — всё, от чего часть зависит */
function rpgBake(R,slot,key,w,h,draw){
  const e=R.bk.get(slot);
  if(e&&e.key===key&&e.B&&e.B.dev===GPU.dev)return e.B;
  if(e&&e.B){gpuBakeDrop(e.B);R.bg.clear();}
  const B=gpuBake(w,h,draw,{mips:false});
  R.bk.set(slot,{key,B});return B;
}
