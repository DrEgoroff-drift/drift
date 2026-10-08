/* ══════════════ планета в окне зала (M810) ══════════════
   В окне зала стоит настоящая планета станции — шар 17gab (gorBody), а не плоский круг неба:
   ближайшая к станции планета системы, если до её края не дальше 2000 единиц; иначе — звёзды.
   Шар печётся в свою текстуру один раз за стыковку (обёртка подменяет пять чисел кадра — размер
   холста, размер мира и плотность, 17gab:473, и возвращает их), шейдер окна (27f2 outside) берёт её
   дальним слоем — за фермами дока, дымом литейки и стапелем. Ночная сторона шара (M804) остаётся,
   терминатор смотрит на звезду станции, как и на карте системы.

   ПРАВИЛА ФАЙЛА:
   1. Печь только вне кадра мира: общий буфер чисел шара (gpl.u) кадр переписывает сам перед своими
      шарами, а наш проход отправлен своей очередью раньше или позже — не посередине.
   2. Конвейер семьи шара может быть ещё не собран (gorPipe собирает в фоне): тогда пробуем на
      следующих кадрах зала, не больше сорока раз, и зал остаётся со звёздами. */
const HALL_ORB_N=512;
/* ближайшая планета: {p, d} или null */
function hallPlanet(){
  const S=G.st||(G.sys&&G.sys.station);if(!S||!G.sys||!G.sys.planets)return null;
  let best=null,bd=2000;
  for(const p of G.sys.planets){const d=Math.hypot(p.x-S.x,p.y-S.y)-(p.radius||0);if(d<bd){bd=d;best=p;}}
  return best?{p:best,d:Math.max(1,bd)}:null;
}
/* место шара на дальней плоскости окна (м): из глаза места КОРАБЛЬ через левый верх проёма; радиус — по
   угловому размеру, на научной станции — большой всегда */
function hallOrbPlace(n,st){
  const c=HALL_CAMS.ship,e=c.eye,pt=[HALL_WIN[0]+1.55,2.55,HALL_B],k=(HALL_B-40-e[2])/(HALL_B-e[2]);
  const ang=(n.p.radius||40)/Math.max(n.d,(n.p.radius||40)*1.2);
  let r=clamp(2.6+9*ang,2.6,7);if(hallT(st).big)r=Math.max(r,7.4);
  return [e[0]+(pt[0]-e[0])*k,e[1]+(pt[1]-e[1])*k,r,1.0];
}
function hallOrbBake(n){
  if(!GPU.ok||!GPU.dev||!GOR.on)return false;
  const p=n.p,k=GOR.K[p.type];if(k===undefined||!p.T||!p.T.pal)return false;
  const d=GPU.dev,N=HALL_ORB_N,U=GPUTextureUsage;
  if(!HALL.orbTex||HALL.orbTex.dev!==d){
    const tex=d.createTexture({size:[N,N],format:"rgba16float",usage:U.RENDER_ATTACHMENT|U.TEXTURE_BINDING});
    HALL.orbTex={tex,view:tex.createView(),dev:d};}
  const gas=p.type==="gas",airless=!gas&&p.T.atm==="отсутствует",gp=GOR_GAS[(h01(p.seed|0,3,0x6A5)*GOR_GAS.length)|0];
  const sky=gas?gp[4]:((p.T.sky&&p.T.sky[0])||[130,180,210]);
  const sa=PLANET_BAKE_ANG+planetSunRot(p);
  const o={k,sx:Math.cos(sa),sy:Math.sin(sa),turn:planetSpin(p)/TAU,air:sky,th:airless?0:(GOR_AIR[p.type]||0),sun:gplSun(),
    seed:p.seed%97,pal:gas?gp:p.T.pal,ring:p.ring||null,cities:0};
  /* пять чисел кадра — на размер текстуры, потом назад */
  const sv=[GPU.bw,GPU.bh,W,H,DPR];let ok=false;
  GPU.bw=N;GPU.bh=N;W=N;H=N;DPR=1;
  try{
    const enc=d.createCommandEncoder();
    const pass=enc.beginRenderPass({colorAttachments:[{view:HALL.orbTex.view,loadOp:"clear",storeOp:"store",clearValue:{r:0,g:0,b:0,a:0}}]});
    ok=gorBody(pass,"hall",N/2,N/2,N*.38/((p.ring&&p.ring.o)?Math.max(1,p.ring.o*.9):1),o);
    pass.end();d.queue.submit([enc.finish()]);
  }finally{GPU.bw=sv[0];GPU.bh=sv[1];W=sv[2];H=sv[3];DPR=sv[4];}
  return ok;
}
/* раз в стыковку: какая планета, где она в окне; пока конвейер не готов — пробуем снова */
function hallOrbUp(L){
  const key=(G.sys&&G.sys.key)+"|"+L.st;
  if(HALL.orbKey===key&&(HALL.orb||HALL.orbTry>40))return;
  if(HALL.orbKey!==key){HALL.orbKey=key;HALL.orbTry=0;HALL.orb=null;}
  HALL.orbTry++;
  const n=hallPlanet();if(!n){HALL.orbTry=99;return;}
  if(!hallOrbBake(n))return;
  const f=hallOrbPlace(n,L.st);
  /* кольцо шире шара: радиус места — по шару, текстура уменьшена под кольцо */
  if(n.p.ring&&n.p.ring.o)f[2]*=Math.max(1,n.p.ring.o*.9);
  HALL.orb={flm:f,p:n.p,d:n.d};
}
