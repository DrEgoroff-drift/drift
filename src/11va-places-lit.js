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
  let hv=fu.v[1];let haloK=hv.x;let haloW=hv.y;let coreK=hv.z;let hasG=hv.w;
  let fr=textureSampleLevel(t0,smp,uv,0.);
  let G0=plG(p.x);let gy=G0.x;let sl=G0.y;
  let below=p.y-gy;
  /* нормаль склона: y=g(x) на экране, «вверх» — это минус y; третья ось — вглубь кадра */
  let nG=normalize(vec3f(sl,-1.,0.));
  let inG=smoothstep(-1.5,2.5,below)*hasG;
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
    let halo=air*haloK*exp(-d2/(R*R*haloW));
    let core=lampK*coreK*exp(-d2/(2.+R*.01));
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
const PL_LH=new Uint16Array(PL_MAX*2*4),PL_U=new Float32Array(8);
/* ── проход поверх нарисованного (gpuOver) ──
   #c уходит в сцену, фонари прибавляются к ней. Потом кадр отправляется сразу —
   тот же порядок, что у самого gpuOver: следующая выгрузка #c (сборка кадра) не
   должна обогнать чтение переднего слоя. gr — грунт {tr,camx,camy} или null
   (пояс: грунта нет, всё — «стоящее») */
function placesLitRun(n,gr){
  if(typeof GPU==="undefined"||!GPU.on)return;
  const pass=gpuOver();if(!pass)return;
  const nc=Math.ceil(W/PL_GS)+2;
  placesLitTex(nc);
  const GH=PL.gh;
  if(gr){
    let prev=groundAt(gr.tr,gr.camx-PL_GS)-gr.camy;
    for(let i=0;i<nc;i++){
      const y=groundAt(gr.tr,gr.camx+i*PL_GS)-gr.camy;
      GH[i*4]=f16(y);GH[i*4+1]=f16((y-prev)/PL_GS);GH[i*4+2]=0;GH[i*4+3]=0;prev=y;
    }
  }else{const b=f16(1e4);for(let i=0;i<nc;i++){GH[i*4]=b;GH[i*4+1]=0;GH[i*4+2]=0;GH[i*4+3]=0;}}
  GPU.dev.queue.writeTexture({texture:PL.gnd},GH,{bytesPerRow:nc*8},[nc,1]);
  const A=PL.a,LH=PL_LH;LH.fill(0);
  for(let i=0;i<n;i++)for(let j=0;j<4;j++){LH[i*4+j]=f16(A[i*8+j]);LH[PL_MAX*4+i*4+j]=f16(A[i*8+4+j]);}
  GPU.dev.queue.writeTexture({texture:PL.lamp},LH,{bytesPerRow:PL_MAX*8},[PL_MAX,2]);
  PL_U[3]=n;
  gpuField(pass,"placesLit",PL_WGSL,PL_U,[{view:PL.fv},{view:PL.lv},{view:PL.gv}],{blend:"add"});
  GPU.overPass.end();GPU.overPass=null;
  GPU.dev.queue.submit([GPU.enc.finish()]);GPU.enc=GPU.dev.createCommandEncoder();
}
/* поверхность: зовётся кадром ПОСЛЕ ночи (21e1) */
function placesLit(p,tr,camx,camy){
  const n=placeLampsN();PL.n=0;
  if(!n||!p||!tr)return;
  const K=placesLitK(p);if(K<=0)return;
  const nite=(typeof surfNight==="function")?surfNight(p):0;
  PL_U[0]=K;PL_U[1]=.5+nite*1.4;PL_U[2]=(p.T&&p.T.atm==="отсутствует")?0:1;
  PL_U[4]=.10;PL_U[5]=.018;PL_U[6]=2.2;PL_U[7]=1;
  placesLitRun(n,{tr,camx,camy});
}
/* пояс: свет рощи (11j) — без грунта, без точек-ламп, с широким ореолом ярче
   единицы: его подхватывает свечение кадра, а соседние камни ловят зелёное */
function placesGlow(){
  const n=placeLampsN();PL.n=0;
  if(!n)return;
  PL_U[0]=1;PL_U[1]=1.3;PL_U[2]=1;
  PL_U[4]=1.25;PL_U[5]=.10;PL_U[6]=0;PL_U[7]=0;
  placesLitRun(n,null);
}

/* ══════════════ свет дня на вещах мест ══════════════
   Корабль перевала, башня, чаша, лестница, дверь уезда стояли плоской
   заливкой с белым контуром — «схемой вещи». Здесь общий способ поставить
   вещь под то же солнце, что грунт: бок к звезде — тёплый, от неё — в тени,
   снизу — земля её затеняет, сверху — небо кладёт холодный отсвет; кромка
   ловит свет только со стороны звезды; зерно вместо ровной краски. */
/* направленный свет звезды сейчас: сила, цвет и с какой стороны */
function placeSun(p){
  const s=(typeof celSun==="function"&&p)?celSun(p):{alt:.7};
  const dk=(typeof celDark==="function")?celDark():0;
  const k=clamp((s.alt+.08)*2.2,0,1)*(1-dk);
  const col=(typeof starRGB==="function")?starRGB():[255,236,200];
  const sx=(typeof SUN_DIR==="object")?(SUN_DIR.x>=0?1:-1):1;
  const sky=(p&&p.T&&p.T.sky)?p.T.sky[0]:[120,150,190];
  return {k,col,sx,sky};
}
/* тело вещи: path() — контур, (x0,y0,x1,y1) — его рамка, base — [r,g,b] */
function placeShade(path,x0,y0,x1,y1,base,p,seed,o){
  o=o||{};
  const L=placeSun(p),w=x1-x0,h=y1-y0;
  ctx.save();
  ctx.beginPath();path();
  ctx.fillStyle=sdRGB(base);ctx.fill();
  ctx.clip();
  /* бок к звезде и бок от неё */
  const gx=L.sx>0?ctx.createLinearGradient(x0,0,x1,0):ctx.createLinearGradient(x1,0,x0,0);
  gx.addColorStop(0,"rgba(8,10,16,"+(.34+.10*L.k).toFixed(3)+")");
  gx.addColorStop(.55,"rgba(0,0,0,0)");
  gx.addColorStop(1,rgba(L.col,.26*L.k));
  ctx.fillStyle=gx;ctx.fillRect(x0-1,y0-1,w+2,h+2);
  /* небо сверху, земля снизу */
  const gy=ctx.createLinearGradient(0,y0,0,y1);
  gy.addColorStop(0,rgba(L.sky,.16));
  gy.addColorStop(.45,"rgba(0,0,0,0)");
  gy.addColorStop(1,"rgba(6,6,10,"+(o.ao==null?.34:o.ao).toFixed(3)+")");
  ctx.fillStyle=gy;ctx.fillRect(x0-1,y0-1,w+2,h+2);
  /* зерно: краска, пыль и время — не заливка */
  const r=rng(hashi(seed|0,0x9A,0x6A));
  const n=Math.min(160,Math.round(w*h/90));
  for(let i=0;i<n;i++){
    const lt=r()<.45;
    ctx.fillStyle=lt?"rgba(255,246,226,.06)":"rgba(0,0,0,.09)";
    ctx.fillRect(x0+r()*w,y0+r()*h,1+r()*2,1);
  }
  ctx.restore();
  /* кромка: светится только край к звезде; остальное — тонкая тёмная линия */
  ctx.save();
  ctx.beginPath();path();
  ctx.strokeStyle="rgba(0,0,0,.35)";ctx.lineWidth=1;ctx.stroke();
  if(L.k>.02){
    ctx.clip();
    ctx.beginPath();path();
    ctx.translate(-L.sx*1.2,1.2);
    ctx.strokeStyle=rgba(sdMix(L.col,[255,255,255],.4),.55*L.k);ctx.lineWidth=1.4;ctx.stroke();
  }
  ctx.restore();
}
/* человек-силуэт мест: тело, голова, тень от звезды и край света с её стороны */
function placeFigure(x,y,h,p,dark){
  const L=placeSun(p),hw=h*.14;
  ctx.fillStyle="rgba(0,0,0,"+(.22*L.k+.08).toFixed(3)+")";
  ctx.beginPath();ctx.ellipse(x-L.sx*h*.35,y,h*.42,1.6,0,0,TAU);ctx.fill();
  ctx.fillStyle=dark||"rgba(22,26,32,.94)";
  ctx.beginPath();ctx.moveTo(x-hw*1.1,y);ctx.lineTo(x-hw,y-h*.78);ctx.lineTo(x+hw,y-h*.78);ctx.lineTo(x+hw*1.1,y);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.arc(x,y-h*.88,h*.13,0,TAU);ctx.fill();
  if(L.k>.02){
    ctx.fillStyle=rgba(L.col,.45*L.k);
    ctx.fillRect(L.sx>0?x+hw-1:x-hw,y-h*.78,1,h*.72);
  }
}
