/* ══════════════ комнаты на видеокарте (G11): общее для дома, зимовки, санатория ══════════════
   Выпечка по роли: у каждой комнаты несколько неподвижных слоёв (пол, вещи, надписи),
   и каждый держит ровно одну текстуру — сменился ключ (кадр, рычаг, день), старая
   уходит в корзину. Печётся в пикселях устройства, а кисти рисуют в пикселях CSS,
   как рисовали в 2D: на время печи глобальный ctx — GPU-холст.
   Шум для полей — один на все комнаты: хеш и гладкий шум значений. */
const ROOM_BAKE=new Map();
function roomBake(role,key,w,h,draw){
  const e=ROOM_BAKE.get(role);
  if(e&&e.key===key&&e.B)return e.B;   /* пережил потерю устройства — gpuImage перепечёт сам */
  if(e&&e.B)gpuBakeDrop(e.B);
  const B=gpuBake(w*DPR,h*DPR,c=>{c.scale(DPR,DPR);draw();},{mips:false});
  ROOM_BAKE.set(role,{key,B});return B;
}
/* ключ размера кадра: без него печь пережила бы поворот телефона */
function roomSz(){return W+"x"+H+"|"+DPR;}
const ROOM_WGSL_NOISE=`
fn rh(p:vec2f)->f32{return fract(sin(dot(p,vec2f(127.1,311.7)))*43758.5453);}
fn rn(p:vec2f)->f32{let i=floor(p);let f=fract(p);let u=f*f*(3.-2.*f);
  return mix(mix(rh(i),rh(i+vec2f(1.,0.)),u.x),mix(rh(i+vec2f(0.,1.)),rh(i+vec2f(1.,1.)),u.x),u.y);}
fn rfbm(p:vec2f)->f32{return rn(p)*.5+rn(p*2.03+vec2f(1.7,9.2))*.3+rn(p*4.01+vec2f(8.3,2.8))*.2;}`;
