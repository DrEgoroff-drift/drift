/* ══════════════ комната в панели — на видеокарте (G11) ══════════════
   Штаб и кантина рисуют свою комнату на своей канве в DOM, мимо кадра мира.
   Здесь эта канва становится WebGPU-холстом того же устройства, что и кадр:
   1. неподвижное печётся GPU-холстом (08ca) частями и лежит текстурой;
   2. то, что движется (люди дышат, экраны бегут, голограмма крутится), —
      спрайты и фигуры набора (08c) со своим сдвигом каждый кадр, без перепечки;
   3. последний проход — свет и воздух: у ламп есть источник и спад, в конусе
      висит пыль, под тем, что стоит, — тень, по кадру зерно и дизеринг.
   Конвейеры те же, что у кадра (kit.img, kit.shp, поля — цель rgba16float), так
   что прогретые годятся как есть; числа (разрешение, свои буферы) у панели свои:
   общий буфер набора кадр переписывает под свой размер.
   Без устройства (Node, gpuNone) всё молчит — комната остаётся без картинки,
   но попадания по людям считаются в JS и работают. */
const RPG_CAP=1<<15;   /* чисел в буфере фигур и картинок на кадр панели (по 12 на штуку) */
function rpgGet(cn){
  if(!GPU.ok||!GPU.dev||!cn||typeof cn.getContext!=="function")return null;
  let R=cn.__rpg;
  if(!R||R.dev!==GPU.dev){
    const cx=cn.getContext("webgpu");if(!cx)return null;
    cx.configure({device:GPU.dev,format:"rgba16float",alphaMode:"premultiplied"});
    const U=GPUBufferUsage,d=GPU.dev;
    R=cn.__rpg={cn,cx,dev:d,S:null,Sv:null,W:0,H:0,bg:new Map(),
      ku:d.createBuffer({size:16,usage:U.UNIFORM|U.COPY_DST}),
      sa:d.createBuffer({size:RPG_CAP*4,usage:U.STORAGE|U.COPY_DST}),sf:new Float32Array(RPG_CAP),n:0,
      fa:d.createBuffer({size:256*8,usage:U.UNIFORM|U.COPY_DST}),fn:0,bk:new Map()};
  }
  return R;
}
/* кадр панели: scene(pass) рисует комнату в свою текстуру (CSS-пиксели, как в 2D),
   light(pass,S) — последний проход на холст панели, S — текстура сцены */
function rpgFrame(R,scene,light){
  const d=GPU.dev,cn=R.cn,w=cn.width,h=cn.height,U=GPUTextureUsage;
  if(w<2||h<2)return false;
  if(!R.S||R.W!==w||R.H!==h){
    if(R.S)GPU.trash.push(R.S);
    R.S=d.createTexture({size:[w,h],format:"rgba16float",usage:U.RENDER_ATTACHMENT|U.TEXTURE_BINDING});
    R.Sv=R.S.createView();R.W=w;R.H=h;R.bg.clear();
  }
  R.n=0;R.fn=0;R.cssW=w/R.dpr;R.cssH=h/R.dpr;
  d.queue.writeBuffer(R.ku,0,new Float32Array([w,h,R.dpr,0]));
  const enc=d.createCommandEncoder();
  const ps=enc.beginRenderPass({colorAttachments:[{view:R.Sv,loadOp:"clear",storeOp:"store",clearValue:{r:0,g:0,b:0,a:1}}]});
  scene(ps);ps.end();
  const pl=enc.beginRenderPass({colorAttachments:[{view:R.cx.getCurrentTexture().createView(),loadOp:"clear",storeOp:"store",clearValue:{r:0,g:0,b:0,a:1}}]});
  light(pl,R.S);pl.end();
  if(R.n)d.queue.writeBuffer(R.sa,0,R.sf,0,R.n);
  d.queue.submit([enc.finish()]);
  return true;
}
/* кусок общего буфера кадра панели: n штук по 12 чисел; переполнение — молча режем
   (комната в панели — сотни штук, потолок в разы выше) */
function rpgPut(R,n){
  if(R.n+n*12>RPG_CAP)return -1;
  const o=R.n;R.n+=n*12;return o;
}
function rpgBindKit(R,P,key,res){
  let b=R.bg.get(key);if(b&&b.P===P)return b.bg;
  b={P,bg:GPU.dev.createBindGroup({layout:P.getBindGroupLayout(0),
    entries:res.map((r,i)=>({binding:i,resource:(r instanceof GPUBuffer)?{buffer:r}:r}))})};
  R.bg.set(key,b);return b.bg;
}
/* картинка из выпечки: те же поля, что у gpuImage (08c), координаты — CSS-пиксели панели */
function rpgImage(R,pass,B,rects,blend){
  if(!B||!B.view||!rects.length)return;
  if(B.draw&&B.dev!==GPU.dev)gpuBakeRedo(B);
  blend=blend||"over";
  const n=rects.length,o=rpgPut(R,n);if(o<0)return;
  const f=R.sf,P=gpuPipe("kit.img",GPU_IMG_WGSL,blend);
  for(let i=0;i<n;i++){const r=rects[i],k=o+i*12;
    f[k]=r.x;f[k+1]=r.y;f[k+2]=r.w;f[k+3]=r.h;f[k+4]=r.a==null?1:r.a;f[k+5]=r.rot||0;f[k+6]=0;f[k+7]=GPU_MIP_LOD;
    f[k+8]=r.u0||0;f[k+9]=r.v0||0;f[k+10]=r.u1==null?1:r.u1;f[k+11]=r.v1==null?1:r.v1;}
  pass.setPipeline(P);
  pass.setBindGroup(0,rpgBindKit(R,P,"img|"+blend+"|"+rpgTexId(B),[R.ku,R.sa,B.view,gpuMipSmp()]));
  pass.draw(6,n,0,o/12);
}
/* фигуры: те же записи, что у gpuShapes (08c) — [вид,x0,y0,x1,y1,hw,soft,r,g,b,a,жёсткие] */
function rpgShapes(R,pass,items,blend){
  if(!items.length)return;
  blend=blend||"over";
  const n=items.length,o=rpgPut(R,n);if(o<0)return;
  const f=R.sf,P=gpuPipe("kit.shp",GPU_SHP_WGSL,blend);
  for(let i=0;i<n;i++){const t=items[i],k=o+i*12;
    f[k]=t[0];f[k+1]=t[1];f[k+2]=t[2];f[k+3]=t[3];f[k+4]=t[4];f[k+5]=t[5]||0;f[k+6]=t[6]||0;
    f[k+7]=t[11]||0;f[k+8]=t[7]/255;f[k+9]=t[8]/255;f[k+10]=t[9]/255;f[k+11]=t[10];}
  pass.setPipeline(P);
  pass.setBindGroup(0,rpgBindKit(R,P,"shp|"+blend,[R.ku,R.sa]));
  pass.draw(6,n,0,o/12);
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
/* общее WGSL панельных комнат: шум для дымки, пылинки, зерно */
const RPG_WGSL=`
fn rh1(p:vec2f)->f32{return fract(sin(dot(p,vec2f(127.1,311.7)))*43758.5453);}
fn rh2(p:vec2f)->vec2f{return fract(sin(vec2f(dot(p,vec2f(127.1,311.7)),dot(p,vec2f(269.5,183.3))))*43758.5453);}
fn rvn(p:vec2f)->f32{let i=floor(p);let f=fract(p);let u=f*f*(3.-2.*f);
  return mix(mix(rh1(i),rh1(i+vec2f(1.,0.)),u.x),mix(rh1(i+vec2f(0.,1.)),rh1(i+vec2f(1.,1.)),u.x),u.y);}
/* плечо светлых: выше .72 яркость подходит к единице плавно, а не обрезается —
   лица под лампой и экраном не выгорают в белое пятно */
fn rshoulder(c:vec3f)->vec3f{let k=.72;return select(c,k+(1.-k)*(1.-exp(-(c-k)/(1.-k))),c>vec3f(k));}
fn rfbm(p:vec2f)->f32{return rvn(p)*.55+rvn(p*2.03+vec2f(5.2,1.3))*.3+rvn(p*4.1+vec2f(2.7,8.1))*.15;}
/* пылинки: слой ячеек, в ячейке одна (не во всякой), плывёт вниз и вбок, мерцает медленно */
fn rmotes(q:vec2f,t:f32,s:f32,dens:f32)->f32{
  let pp=q*s+vec2f(sin(t*.07+q.y*.02)*.6,t*.05);
  let c=floor(pp);let f=fract(pp);var a=0.;
  for(var j=-1;j<=1;j++){for(var i=-1;i<=1;i++){
    let cc=c+vec2f(f32(i),f32(j));let h=rh2(cc);
    if(rh1(cc+vec2f(3.7,9.1))>dens){continue;}
    let m=vec2f(f32(i),f32(j))+.5+.38*sin(vec2f(t*.21,t*.17)+h*6.28);
    let r=length(f-m)/s;let sz=.55+h.x*.7;
    a+=(1.-smoothstep(sz*.25,sz,r))*(.55+.45*sin(t*.9+h.y*20.));
  }}
  return a;}`;
/* пустая кисть: без видеокарты (Node) комната «рисуется» ею ради попаданий — где
   стоят люди и столики; всё, что она отвечает, — ноль и пустой градиент */
const RPG_NOP_R={addColorStop(){},width:0,a:1,b:0,c:0,d:1,e:0,f:0};
function RPG_NOP(){return RPG_NOP_R;}
const RPG_NULL=new Proxy({},{get(o,k){return k in o?o[k]:RPG_NOP;},set(){return true;}});
