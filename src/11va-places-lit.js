/* ══════════════ свет, который светит: фонари мест на видеокарте (G6) ══════════════
   До порта каждый фонарь поверхности — крыльцо дома, окна, огоньки мха у
   площадки, арка третьего света — был пятном «lighter» в 2D, и ночь (21e1)
   клала поверх него свою тень: фонарь горел сам по себе, а земля вокруг
   оставалась тёмной. Свет так не работает: видно не лампу, а ОСВЕЩЁННОЕ.

   Теперь художники мест не рисуют ореолы, а зажигают фонари: placeLamp()
   кладёт источник в список кадра (экранные px CSS). После ночи кадр зовёт
   placesLit() — один проход видеокарты поверх всего, что 2D уже нарисовал:
   1. грунт у фонаря светлеет по-настоящему — свет умножается на цвет того,
      что лежит под ним (материал остаётся виден), с косинусом к склону:
      скат к лампе светлее, от лампы — темнее; в разрезе светит верхний слой;
   2. стены, стволы и люди рядом ловят тот же свет своей стороной;
   3. в воздухе — узкое рассеяние, только где есть воздух;
   4. сердце лампы ярче единицы — его подхватывает свечение кадра (08b).
   Днём проход не делается вовсе: фонари есть, а свет их в солнце не виден. */

const PL_MAX=24;                             // фонарей в кадре; лишние — слабейшие — отбрасываются
const PL_GS=4;                               // шаг профиля грунта, px CSS
const PL={n:0,f:-1,t:-1,a:new Float32Array(PL_MAX*8),gnd:null,lamp:null,gv:null,lv:null,fr:null,fv:null,dev:null,gw:0};
/* зажечь фонарь: x,y — сама лампа на экране; rad — докуда достаёт свет;
   rgb — 0…1; k — сила (1 — фонарь крыльца); hz — насколько лампа «перед»
   плоскостью кадра (свет ложится и на полосу грунта вглубь); hz<0 — окно
   или щель: светит так же, но своей точки-лампы у него нет. Список
   живёт один кадр: новый кадр начинает его заново сам */
function placeLamp(x,y,rad,rgb,k,hz){
  if(!(k>0)||!(rad>0))return;
  const f=(typeof GPU!=="undefined")?GPU.frameNo:0,t=G.t||0;
  if(PL.f!==f||PL.t!==t){PL.f=f;PL.t=t;PL.n=0;}
  if(x+rad<0||x-rad>W||y+rad<0||y-rad>H)return;
  const A=PL.a,s=k*rad;
  let i=PL.n;
  if(i>=PL_MAX){                                 /* полно: вытесняем слабейший, если новый сильнее */
    let lo=0;for(let j=1;j<PL_MAX;j++)if(A[j*8+7]*A[j*8+2]<A[lo*8+7]*A[lo*8+2])lo=j;
    if(A[lo*8+7]*A[lo*8+2]>=s)return;
    i=lo;
  }else PL.n++;
  const o=i*8;
  A[o]=x;A[o+1]=y;A[o+2]=rad;A[o+3]=hz==null?rad*.3:(hz||.01);
  A[o+4]=rgb[0];A[o+5]=rgb[1];A[o+6]=rgb[2];A[o+7]=k;
}
/* сколько фонарей зажжено в этом кадре (для тестов и стенда) */
function placeLampsN(){
  const f=(typeof GPU!=="undefined")?GPU.frameNo:0;
  return (PL.f===f&&PL.t===(G.t||0))?PL.n:0;
}
/* сила света фонарей от ночи: в сумерках его ещё нет, к ночи — весь */
function placesLitK(p){
  const n=(typeof surfNight==="function")?surfNight(p):0;
  return clamp((n-.08)/.34,0,1);
}
const PL_WGSL=`
fn plG(x:f32)->vec2f{
  let n=f32(textureDimensions(t2).x);
  return textureSampleLevel(t2,smp,vec2f((x/${PL_GS.toFixed(1)}+.5)/n,.5),0.).xy;}
fn field(p:vec2f,uv:vec2f)->vec4f{
  let g=fu.v[0];let K=g.x;let gain=g.y;let air=g.z;let n=i32(g.w);
  let fr=textureSampleLevel(t0,smp,uv,0.);
  let G0=plG(p.x);let gy=G0.x;let sl=G0.y;
  let below=p.y-gy;
  /* нормаль склона: y=g(x) на экране, «вверх» — это минус y; третья ось — вглубь кадра */
  let nG=normalize(vec3f(sl,-1.,0.));
  let inG=smoothstep(-1.5,2.5,below);
  let cut=exp(-max(below,0.)/13.);                  /* в разрезе светит верхний слой */
  var acc=vec3f(0.);
  for(var i=0;i<${PL_MAX};i++){
    if(i>=n){break;}
    let A=textureLoad(t1,vec2i(i,0),0);let B=textureLoad(t1,vec2i(i,1),0);
    let L=A.xy;let R=A.z;let hz=abs(A.w);let lampK=step(0.,A.w);   /* hz<0 — окно: светит, но точки-лампы нет */
    /* грунт: свет падает на точку профиля над этим пикселем */
    let vg=vec3f(L.x-p.x,L.y-gy,hz);
    let rg=length(vg.xy)/R;
    let lg=max(dot(nG,normalize(vg)),0.);
    let wg=clamp(1.-rg*rg,0.,1.);
    let Eg=lg*wg*wg/(1.+rg*rg*5.)*cut;
    /* стоящее: стена, ствол, человек — лицом к нам, свет приходит сбоку и спереди */
    let vo=vec3f(L-p,hz);
    let ro=length(vo.xy)/R;
    let wo=clamp(1.-ro*ro,0.,1.);
    let Eo=(.3+.5*hz/length(vo))*wo*wo/(1.+ro*ro*9.);
    let E=mix(Eo,Eg,inG);
    /* воздух: узкое рассеяние у самой лампы; сердце — выше единицы, для свечения */
    let d2=dot(p-L,p-L);
    let halo=air*.10*exp(-d2/(R*R*.018));
    let core=lampK*2.2*exp(-d2/(2.+R*.01));
    acc=acc+B.rgb*B.w*(fr.rgb*E*gain+halo+core);
  }
  return vec4f(acc*K,0.);}`;
/* текстуры прохода: профиль грунта (y и уклон по колонкам) и фонари (две строки).
   Живут при устройстве: после потери gpuInit даёт новое — пересоздаём */
function placesLitTex(nc){
  const d=GPU.dev,U=GPUTextureUsage;
  if(PL.dev!==d){PL.dev=d;PL.gnd=null;PL.lamp=null;PL.fr=null;}
  if(!PL.lamp){PL.lamp=d.createTexture({size:[PL_MAX,2],format:"rgba16float",usage:U.TEXTURE_BINDING|U.COPY_DST});PL.lv=PL.lamp.createView();}
  if(!PL.gnd||PL.gw!==nc){
    if(PL.gnd)GPU.trash.push(PL.gnd);
    PL.gnd=d.createTexture({size:[nc,1],format:"rgba16float",usage:U.TEXTURE_BINDING|U.COPY_DST});PL.gv=PL.gnd.createView();PL.gw=nc;
    PL.gh=new Uint16Array(nc*4);
  }
  if(PL.fr!==GPU.T.front){PL.fr=GPU.T.front;PL.fv=PL.fr.createView();}
}
const PL_LH=new Uint16Array(PL_MAX*2*4),PL_U=new Float32Array(4);
/* ── проход: зовётся кадром поверхности ПОСЛЕ ночи (21e1) ──
   Слой поверх нарисованного (gpuOver): #c уходит в сцену, фонари прибавляются
   к ней. Потом кадр отправляется сразу — тот же порядок, что у самого gpuOver:
   следующая выгрузка #c (сборка кадра) не должна обогнать чтение переднего слоя */
function placesLit(p,tr,camx,camy){
  const n=placeLampsN();PL.n=0;
  if(!n||!p||!tr)return;
  const K=placesLitK(p);if(K<=0)return;
  if(typeof GPU==="undefined"||!GPU.on)return;
  const pass=gpuOver();if(!pass)return;
  const nc=Math.ceil(W/PL_GS)+2;
  placesLitTex(nc);
  const GH=PL.gh;
  let prev=groundAt(tr,camx-PL_GS)-camy;
  for(let i=0;i<nc;i++){
    const y=groundAt(tr,camx+i*PL_GS)-camy;
    GH[i*4]=f16(y);GH[i*4+1]=f16((y-prev)/PL_GS);GH[i*4+2]=0;GH[i*4+3]=0;prev=y;
  }
  GPU.dev.queue.writeTexture({texture:PL.gnd},GH,{bytesPerRow:nc*8},[nc,1]);
  const A=PL.a,LH=PL_LH;LH.fill(0);
  for(let i=0;i<n;i++)for(let j=0;j<4;j++){LH[i*4+j]=f16(A[i*8+j]);LH[PL_MAX*4+i*4+j]=f16(A[i*8+4+j]);}
  GPU.dev.queue.writeTexture({texture:PL.lamp},LH,{bytesPerRow:PL_MAX*8},[PL_MAX,2]);
  const nite=(typeof surfNight==="function")?surfNight(p):0;
  PL_U[0]=K;PL_U[1]=.5+nite*1.4;
PL_U[2]=(p.T&&p.T.atm==="отсутствует")?0:1;PL_U[3]=n;
  gpuField(pass,"placesLit",PL_WGSL,PL_U,[{view:PL.fv},{view:PL.lv},{view:PL.gv}],{blend:"add"});
  GPU.overPass.end();GPU.overPass=null;
  GPU.dev.queue.submit([GPU.enc.finish()]);GPU.enc=GPU.dev.createCommandEncoder();
}
