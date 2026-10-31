/* ══════════════ жизнь на видеокарте: двойники кистей ходока, зверя и травы ══════════════
   Кисти 20-life / 20f-fauna / 20c-peep остаются как были — их зовут пять режимов, и
   многие ещё рисуют в 2D. Рядом с ними — двойники для режимов, перешедших на видеокарту
   (docs/fleet/life.md): поза печётся один раз через gpuBake (ключ — вид, поза, краска),
   а свет кладётся шейдером каждый кадр:

   • свет мира, а не свой: направление к звезде (SUN_DIR), её цвет (starRGB) и холодный
     заполняющий свет неба (ambRGB). Нормаль берётся из размытой альфы выпечки — у фигуры
     появляется объём: освещённый бок тёплый, теневой уходит в цвет неба, по краю к свету
     горит кромка. Прежний «ободок со стороны звезды» (M172) был нарисованной линией —
     здесь он следует за звездой сам;
   • тень касания: силуэт той же выпечки, положенный на грунт от звезды и размытый тем
     сильнее, чем дальше от ног, плюс плотное пятно под самыми ногами. Раньше под фигурой
     лежал одинаковый для всех овал;
   • движение, которое дышит: стоящий ходок дышит (грудь и шлем чуть поднимаются), трава
     гнётся от комля, а не поворачивается палкой, зверь пульсирует и переступает между
     выпечками плавно.

   Координаты — пиксели CSS, как у 2D; всё рисуется в переданный проход (gpuScene/gpuOver).
   Без видеокарты (Node, gpuNone) двойники молча возвращают false — режим тогда зовёт
   2D-кисть. Случайность — только rndFx. */

/* ── общий конвейер ──
   Экземпляр — девять vec4: 0 спрайт (центр, размер; ширина <0 — зеркало), 1 растр-рамка,
   2 поворот/альфа/уровень нормали/режим, 3 свет (к звезде xy, сила, кромка), 4 изгиб
   (сдвиг верха, строка основания, вдох, строка пояса), 5 цвет ключа + дымка,
   6 цвет заполняющего + доля прямого света, 7 тень (скос, сплющивание, сила, радиус пятна),
   8 множитель цвета (dim: куст в падающей тени гребня темнеет, как у 2D).
   Режим 0 — освещённый спрайт, 1 — тень на грунт. */
const LG_WGSL=GPU_KIT_WGSL+`
@group(0) @binding(1) var<storage,read> lq:array<vec4f>;
@group(0) @binding(2) var ltx:texture_2d<f32>;
@group(0) @binding(3) var lsm:sampler;
struct LO{@builtin(position) p:vec4f,@location(0) q:vec2f,@location(1) @interpolate(flat) ii:u32};
@vertex fn vs(@builtin(vertex_index) vi:u32,@builtin(instance_index) ii:u32)->LO{
  let r=lq[ii*9u+1u];let q=mix(r.xy,r.zw,kCorn(vi));
  var o:LO;o.p=kClip(q);o.q=q;o.ii=ii;return o;}
fn la(uv:vec2f,l:f32)->f32{return textureSampleLevel(ltx,lsm,uv,l).a;}
@fragment fn fs(i:LO)->@location(0) vec4f{
  let b=i.ii*9u;let D=lq[b+8u];let S=lq[b];let M=lq[b+2u];let Lt=lq[b+3u];let Wp=lq[b+4u];
  let K=lq[b+5u];let A=lq[b+6u];let Sh=lq[b+7u];
  let cs=cos(M.x);let sn=sin(M.x);let d=i.q-S.xy;
  let l=vec2f(d.x*cs+d.y*sn,-d.x*sn+d.y*cs);
  var uv=l/S.zw+.5;
  /* изгиб от основания: сдвиг растёт квадратом высоты — стебель гнётся, а не валится */
  let f=clamp((Wp.y-uv.y)/max(Wp.y,1e-3),0.,1.);
  uv.x=uv.x-Wp.x*f*f*sign(S.z);
  /* вдох: всё выше пояса чуть вытягивается вверх */
  if(uv.y<Wp.w){uv.y=Wp.w+(uv.y-Wp.w)/(1.+Wp.z);}
  /* тень: точка грунта (скос Sh.x, сплющивание Sh.y) → точка силуэта на высоте hgt */
  let yb=(Wp.y-.5)*abs(S.w);let hgt=(yb-l.y)/max(Sh.y,1e-3);
  let us=vec2f(l.x-Sh.x*hgt,yb-hgt)/S.zw+.5;
  /* уровень мипа — на ступень резче следа пикселя (как GPU_MIP_LOD у набора): трилинейка
     по следу гасила тонкий стебель и тёмный обвод шара */
  let dx=dpdx(uv)*.55;let dy=dpdy(uv)*.55;
  let c=textureSampleGrad(ltx,lsm,uv,dx,dy)*select(0.,1.,all(uv>vec2f(0.))&&all(uv<vec2f(1.)));
  if(M.w>.5){
    var a=0.;let H=abs(S.w)*Wp.y;
    if(hgt>0.&&all(us>vec2f(0.))&&all(us<vec2f(1.))){
      let k=clamp(hgt/max(H,1.),0.,1.);
      a=la(us,M.z+.5+k*2.5)*(1.-k*.75)*Sh.z;}
    let e=vec2f(l.x/max(Sh.w,.5),(l.y-yb)/max(Sh.w*.3,.5));
    let ao=exp(-dot(e,e)*1.6)*Sh.z*.9;
    let al=clamp(max(a,ao),0.,1.)*M.y;
    return vec4f(0.,0.,0.,al);}
  if(c.a<.003){return vec4f(0.);}
  /* нормаль из размытой альфы: край силуэта смотрит наружу, середина — на зрителя */
  let ts=vec2f(textureDimensions(ltx));let e=exp2(M.z)/ts;
  var g=vec2f(la(uv+vec2f(e.x,0.),M.z)-la(uv-vec2f(e.x,0.),M.z),la(uv+vec2f(0.,e.y),M.z)-la(uv-vec2f(0.,e.y),M.z));
  g=vec2f(g.x*sign(S.z),g.y);g=vec2f(g.x*cs-g.y*sn,g.x*sn+g.y*cs);
  let n=normalize(vec3f(-g*1.7,.5+.5*la(uv,M.z)));
  let L=normalize(vec3f(Lt.xy,.55));
  let nl=dot(n,L);let dl=smoothstep(-.35,.85,nl)*A.w;
  /* свет — множитель по выпечке: освещённое теплеет ключом, теневое уходит в небо.
     Цвет источников — только оттенок (светлота к единице, насыщенность вполовину):
     оранжевая звезда красила белый скафандр в лосося (первая пара, 25.09) */
  let Y=vec3f(.3,.59,.11);
  let kc=mix(vec3f(1.),K.rgb/max(dot(K.rgb,Y),.05),.34);let ac=mix(vec3f(1.),A.rgb/max(dot(A.rgb,Y),.05),.3);
  let tint=mix(ac,kc,dl)*mix(.8,1.08,dl);
  var rgb=c.rgb*mix(vec3f(1.),tint,Lt.z);
  let gl=length(g);
  let fw=max(dot(-g/max(gl,1e-4),normalize(Lt.xy+vec2f(0.,1e-4))),0.);
  /* кромка — только у тела: тонкий стебель весь «край», и кромка выбеливала его целиком */
  let rim=fw*fw*clamp(gl*2.4,0.,1.)*smoothstep(.25,.7,la(uv,M.z))*Lt.w*A.w;
  rgb=rgb+min(kc,vec3f(1.3))*rim*c.a*.5;
  rgb=rgb*D.x;
  rgb=mix(rgb,A.rgb*c.a,K.w);
  return vec4f(rgb,c.a)*M.y;}`;
const LG_N=8,LG_CAP=160,LG_BK=new Map();
let LG_ID=0,LG_F=new Float32Array(LG_N*4*9);
/* выпечка по ключу (LRU): устройство потеряно — печём заново тем же draw */
function lifeBaked(key,w,h,draw,o){
  let B=LG_BK.get(key);
  if(B&&B.dev===GPU.dev){LG_BK.delete(key);LG_BK.set(key,B);return B;}
  if(B){LG_BK.delete(key);lifeBakeDrop(B);}
  B=gpuBake(w,h,draw,o);if(!B)return null;
  B.lid=++LG_ID;LG_BK.set(key,B);
  while(LG_BK.size>LG_CAP){const k=LG_BK.keys().next().value;lifeBakeDrop(LG_BK.get(k));LG_BK.delete(k);}
  return B;
}
function lifeBakeDrop(B){gpuBakeDrop(B);if(GPU.bgs){delete GPU.bgs["life:"+B.lid+"h"];delete GPU.bgs["life:"+B.lid+"o"];}}
/* ── свет мира ──
   {lx,ly} — к источнику в экранных осях (y вниз), key/amb — цвета 0..1, k — сила света
   по выпечке, rim — кромка, lit — доля прямого света (падающая тень гребня, затмение),
   shx/sq/sa — тень на грунт: скос на пиксель высоты, сплющивание, плотность.
   Без аргумента — по режиму: поверхность берёт звезду и небо, подземелье — фонарь,
   база и абордаж — потолочный свет. Любое поле можно переопределить (o). */
function lifeLight(o){
  o=o||{};
  const m=o.mode||G.mode,p=G.surf&&G.surf.p;
  let L;
  if(m==="surface"&&p){
    const sd=(typeof SUN_DIR==="object")?SUN_DIR:{x:.55,y:-.83};
    const st=(typeof starRGB==="function")?starRGB():[255,244,214],sm=Math.max(1,st[0],st[1],st[2]);
    const am=(typeof ambRGB==="function")?ambRGB(p):[120,140,170];
    const up=sd.y<.05,hi=clamp(-sd.y,0,1);
    L={lx:sd.x,ly:sd.y,key:[st[0]/sm,st[1]/sm,st[2]/sm],amb:[am[0]/255,am[1]/255,am[2]/255],
      k:.85,rim:up?1:0,lit:up?1:.25,shx:up?clamp(-sd.x/Math.max(.28,hi),-2.4,2.4)*.55:0,sq:.2,sa:up?.34*(1-.35*(1-hi)):.16};
  }else if(m==="cave"||m==="dig"){
    L={lx:.35,ly:-.9,key:[1,.93,.78],amb:[.36,.44,.58],k:.9,rim:.55,lit:1,shx:0,sq:.2,sa:.4};
  }else{
    L={lx:.3,ly:-.95,key:[1,.95,.86],amb:[.62,.68,.78],k:.7,rim:.45,lit:1,shx:-.25,sq:.2,sa:.3};
  }
  for(const k in o)if(k!=="mode")L[k]=o[k];
  return L;
}
/* падающая тень гребня в точке мира wx (19c1-cast): 1 — на свету, меньше — в тени.
   Только на поверхности: под землёй и в комнатах звезды нет */
function lifeDim(wx){
  const c=(G.mode==="surface"&&wx!=null&&typeof castLive==="function"&&G.surf&&G.surf.tr)?castLive(G.surf.tr,wx):0;
  return 1-((typeof CAST_LIVE==="number")?CAST_LIVE:.5)*c;
}
/* ── рисование: S — спрайт, L — свет ──
   S: {x,y,w,h} центр и размер в пикселях CSS (w<0 — зеркало), rot, a, lod (размытие
   нормали, уровень мипа), base (строка основания 0..1 — где стоит), bend (сдвиг верха в
   долях ширины), breath (вдох), waist (строка пояса), haze (дымка к цвету неба), lit,
   shadow (false — без тени; число — её плотность). Тень рисуется первой, тем же вызовом */
function lifeSprite(pass,B,S,L){
  if(!pass||!B||!GPU.dev)return false;
  if(B.draw&&B.dev!==GPU.dev)gpuBakeRedo(B);
  L=L||lifeLight();
  const f=LG_F,base=S.base==null?1:S.base,aw=Math.abs(S.w),ah=Math.abs(S.h);
  const lit=S.lit==null?(L.lit==null?1:L.lit):S.lit;
  const put=(i,mode,q)=>{const k=i*36;f[k+32]=S.dim==null?1:S.dim;f[k+33]=f[k+34]=f[k+35]=0;
    f[k]=S.x;f[k+1]=S.y;f[k+2]=S.w;f[k+3]=S.h;
    f[k+4]=q[0];f[k+5]=q[1];f[k+6]=q[2];f[k+7]=q[3];
    f[k+8]=mode?0:(S.rot||0);f[k+9]=S.a==null?1:S.a;f[k+10]=S.lod==null?2:S.lod;f[k+11]=mode;
    f[k+12]=L.lx;f[k+13]=L.ly;f[k+14]=L.k==null?.8:L.k;f[k+15]=L.rim==null?1:L.rim;
    f[k+16]=mode?0:(S.bend||0);f[k+17]=base;f[k+18]=mode?0:(S.breath||0);f[k+19]=S.waist==null?0:S.waist;
    f[k+20]=L.key[0];f[k+21]=L.key[1];f[k+22]=L.key[2];f[k+23]=S.haze||0;
    f[k+24]=L.amb[0];f[k+25]=L.amb[1];f[k+26]=L.amb[2];f[k+27]=lit;
    f[k+28]=L.shx||0;f[k+29]=L.sq||.2;f[k+30]=(S.shadow===true||S.shadow==null?1:+S.shadow)*(L.sa==null?.3:L.sa);f[k+31]=S.ao||aw*.3;};
  let n=0;
  const sh=S.shadow!==false&&(L.sa||0)>0&&S.part!==2;
  if(sh){
    /* рамка тени: от ног вверх-вбок на высоту фигуры, сплющенную, и чуть ниже ног */
    const yb=S.y+(base-.5)*ah,H=ah*base,dx=(L.shx||0)*H,rx=aw*.5+Math.abs(S.ao||aw*.3);
    put(n++,1,[S.x-rx+Math.min(0,dx)-2,yb-H*(L.sq||.2)-2,S.x+rx+Math.max(0,dx)+2,yb+Math.max(4,(S.ao||aw*.3)*.6)]);
  }
  /* рамка спрайта: с запасом на изгиб и поворот. S.part: 1 — только тень, 2 — только спрайт
     (между ними режим кладёт то, что стоит за телом: ноги, хвост) */
  if(S.part!==1){const ex=Math.abs(S.bend||0)*aw,r=S.rot?Math.hypot(aw,ah)*.5:0;
  const hx=r||aw*.5,hy=r||ah*.5;
  put(n++,0,[S.x-hx-ex-1,S.y-hy-ah*(S.breath||0)-1,S.x+hx+ex+1,S.y+hy+1]);}
  if(!n)return false;
  const A=gpuArena("life",n*36,36);
  GPU.dev.queue.writeBuffer(A.buf,A.off*4,f,0,n*36);
  /* тень — обычным наложением, фигура — смешением корпуса (hull): она гасит альфу сцены
     на своём покрытии, и последний проход знает, что здесь тело, а не фон (марево не
     гнёт, а когда ядро научится — лучи и свечение не льются поверх, docs/fleet/life.md) */
  const res=[gpuKitU(),A.buf,B.view,gpuMipSmp()],o0=A.off/36;
  for(let i=0;i<n;i++){const hull=!(sh&&i===0),P=gpuPipe("life.spr",LG_WGSL,hull?"hull":"over");
    pass.setPipeline(P);pass.setBindGroup(0,gpuBind("life:"+B.lid+(hull?"h":"o"),P,res));pass.draw(6,1,0,o0+i);}
  return true;
}

/* ══ ходок ══
   Поза печётся в рамку 20×28 единиц фигуры (ноги, ранец, шлем, рука с буром) с запасом
   ×4 — зум до четырёх не мылит. Ключ: фаза шага (24 кадра на шаг), размах (пять ступеней),
   прыжок, бур, тревога скафандра, краска комплекта. Струя ранца, огонёк антенны, луч
   фонаря и свет звезды — не в выпечке: они живые, их кладёт двойник поверх */
const ASTRO_BOX={x0:-10,y0:-15,w:20,h:28},ASTRO_SS=4,ASTRO_STEPS=24;
let ASTRO_PAL={f:-1,k:""};
function lifeAstroPal(){
  const fn=GPU.frameNo;if(ASTRO_PAL.f===fn&&fn!=null)return ASTRO_PAL.k;
  const KP=(typeof kitPalette==="function")?kitPalette():null;
  const VC=(typeof cosmVisor==="function")?cosmVisor():null;
  const acc=(typeof shipData==="function"&&G.shipId!=null)?shipData(G.shipId).col:"";
  ASTRO_PAL={f:fn,k:acc+"|"+(VC?VC.join(","):"")+"|"+(KP?[KP.torso.main,KP.torso.dark,KP.boots.dark,KP.pack.dark,KP.helmet.main,KP.lamp.acc].join(","):"")};
  return ASTRO_PAL.k;
}
/* поза → ключ выпечки; чистая функция (её сторожит тест) */
function lifeAstroPose(o){
  const amp=o.amp!=null?o.amp:(o.walk?1:0);
  const aq=Math.round(clamp(amp,0,1)*4)/4;
  const ph=(((o.phase||0)%TAU)+TAU)%TAU;
  const pq=aq>0?Math.round(ph/TAU*ASTRO_STEPS)%ASTRO_STEPS:0;
  return {aq,pq,phase:pq/ASTRO_STEPS*TAU,key:"a|"+pq+"|"+aq+"|"+(o.air?1:0)+(o.mining?1:0)+(o.suitLow?1:0)};
}
function lifeAstroBake(o){
  const P=lifeAstroPose(o),X=ASTRO_BOX,s=ASTRO_SS;
  return lifeBaked(P.key+"|"+lifeAstroPal(),X.w*s,X.h*s,g=>{
    g.translate(-X.x0*s,-X.y0*s);g.scale(s,s);
    drawAstronaut({phase:P.phase,amp:P.aq,air:!!o.air,mining:!!o.mining,suitLow:!!o.suitLow,face:1,bake:true});
  });
}
/* ДВОЙНИК drawAstronaut: (x,y) — та же точка, куда 2D-вызов делал translate; o — те же
   поля ({face,amp,phase,walk,air,jet,mining,suitLow,lamp}), плюс s — масштаб (как
   ctx.scale у базы и абордажа), light — свет (lifeLight), shadow:false — без тени
   (в воде, в полёте без грунта), ground — экранный y грунта, если ходок в воздухе */
function lifeAstroGpu(pass,x,y,o){
  if(!pass||!GPU.dev)return false;
  o=o||{};
  const B=lifeAstroBake(o);if(!B)return false;
  const s=o.s||1,fc=o.face||1,X=ASTRO_BOX,L=o.light||lifeLight();
  const amp=o.amp!=null?o.amp:(o.walk?1:0);
  /* вдох только стоя: на ходу грудь и так в работе */
  const still=clamp(1-amp*4,0,1)*(o.air?0:1);
  const br=.024*still*(.5+.5*Math.sin(G.t*.045));
  const S={x:x+(X.x0+X.w/2)*s*fc,y:y+(X.y0+X.h/2)*s,w:X.w*s*fc,h:X.h*s,
    base:(11.9-X.y0)/X.h,waist:(2.2-X.y0)/X.h,breath:br,lod:1.6,ao:7*s,
    dim:lifeDim(o.wx!=null?o.wx:(G.mode==="surface"&&G.surf?G.surf.x:null)),
    shadow:o.shadow===false||o.air&&o.ground==null?false:1};
  lifeSprite(pass,B,S,L);
  const sp=[];
  /* огонёк антенны дышит (закон 6): мягкий, со своим ореолом */
  {const a=-amp*.09,px=-6,py=-6.5-2.2,ax=px*Math.cos(a)-py*Math.sin(a),ay=px*Math.sin(a)+py*Math.cos(a)+2.2-br*17;
   const k=.35+.35*Math.sin(G.t*.03),cx=x+ax*s*fc,cy=y+ay*s;
   sp.push([1,cx,cy,1.9*s,0,0,1.6*s,127,230,216,k*.35],[1,cx,cy,.9*s,0,0,.4*s,160,245,232,k]);}
  /* струя ранца: мягкая капсула, горячая у сопла */
  if(o.jet){const f=(5+rndFx()*7)*s;
    sp.push([2,x-fc*.2*s,y+4*s,x-fc*.2*s,y+4*s+f,2.2*s,2.4*s,255,120,60,.55],[2,x-fc*.2*s,y+4*s,x-fc*.2*s,y+4*s+f*.55,1.1*s,1.2*s,255,226,160,.9]);}
  gpuShapes(pass,sp,{blend:"add"});
  if(o.lamp)lifeLampGpu(pass,x,y,fc,s);
  return true;
}
/* луч фонаря — выпечка один раз (конус и отсвет на груди), дальше только зеркало и масштаб */
const LAMP_BOX={x0:-2,y0:-34,w:68,h:58};
function lifeLampGpu(pass,x,y,fc,s){
  const X=LAMP_BOX,B=lifeBaked("lamp",X.w*2,X.h*2,g=>{
    g.scale(2,2);g.translate(-X.x0,-X.y0);g.globalCompositeOperation="lighter";
    const gr=g.createRadialGradient(3,-7,2,3,-7,64);
    gr.addColorStop(0,"rgba(255,244,205,.30)");gr.addColorStop(1,"rgba(255,220,150,0)");
    g.fillStyle=gr;g.beginPath();g.moveTo(2,-8.6);g.lineTo(62,-30);g.lineTo(62,20);g.lineTo(2,-5);g.closePath();g.fill();
    const gs=g.createRadialGradient(2.4,-6.6,.5,2.4,-6.6,7.5);
    gs.addColorStop(0,"rgba(255,238,190,.30)");gs.addColorStop(1,"rgba(255,238,190,0)");
    g.fillStyle=gs;g.beginPath();g.arc(1.6,-3.6,7,0,TAU);g.fill();
  },{mips:true});
  if(!B)return;
  gpuImage(pass,B,[{x:x+(X.x0+X.w/2)*s*fc,y:y+(X.y0+X.h/2)*s,w:X.w*s*fc,h:X.h*s,a:1.15}],{blend:"add"});
}
/* точка и масштаб для режима на полпути: withScale пишет LIFE_XF (18c), фигуру
   отдаёт двойник в пикселях CSS. Без видеокарты — матрица ctx (запертый грунт).
   Холст #c на GPU-кадре больше не scale-ят ради lifeHere (G15) */
function lifeHere(x,y){
  x=x||0;y=y||0;
  if(GPU.on){const o=LIFE_XF;return {x:o.x+x*o.s,y:o.y+y*o.s,s:o.s};}
  const m=ctx.getTransform(),d=DPR||1;
  return {x:(m.a*x+m.c*y+m.e)/d,y:(m.b*x+m.d*y+m.f)/d,s:Math.hypot(m.a,m.b)/d};
}
/* ══ зверь / кусты ══
   lifeBeastGpu / lifePlantGpu и 2D-кисти drawBeast / drawPlant сняты (G15, M807):
   флора и фауна планеты — через PLN (21pga / 21pib). */

/* ══ подглядка: люди из света (20c) ══
   Двойник peepGhosts: те же идущие (peepWalk), но светом видеокарты — фигура из мягких
   капсул и граней на сложении, у головы и плеч ореол с мягкой кромкой (2D клал его
   радиальным градиентом в эллипсе, и край светлого пятна был виден), след — остывающая
   цепь, а не одна полоса. o.x0,o.y0,o.s — куда ложится 2D-кадр (lifeHere()), по умолчанию
   как есть. Подписей нет и здесь — правило 1 файла */
function lifePeepGpu(pass,camx,camy,o){
  if(!pass||!GPU.dev)return false;
  const Q=peepWalk(camx,camy);if(!Q)return true;
  o=o||{};
  const x0=o.x0||0,y0=o.y0||0,s=o.s||1,{pos,sc}=Q,C=PEEP_LIT,SH=[];
  const at=(q,lx,ly)=>[x0+(q.x+q.face*lx)*s,y0+(q.y+ly)*s];
  const cap=(q,a,b,hw,al,soft,c)=>{const p=at(q,a[0],a[1]),e=at(q,b[0],b[1]);c=c||C;
    SH.push([2,p[0],p[1],e[0],e[1],hw*s,(soft||.3)*s,c[0],c[1],c[2],al]);};
  for(const q of pos){
    /* след остывает звеньями: у ног тёплый и плотный, за спиной гаснет */
    for(let j=0;j<6;j++){const u=(j+.5)/6;
      cap({x:q.x,y:q.y,face:1},[-sc.dir*j*15,.5],[-sc.dir*(j+1)*15,.5],1.1,q.a*.5*(1-u)*(1-u*.3),1.8,[255,238,196]);}
  }
  if(pos.length>1&&(sc.load==="шест"||sc.load==="носилки")){
    const A=pos[0],B=pos[1],a=Math.min(A.a,B.a),hy=sc.load==="шест"?-17.6:-11;
    const d=Math.max(1,Math.hypot(B.x-A.x,B.y-A.y)),k=4.5/d;
    const ax=A.x+(B.x-A.x)*k,ay=A.y+hy+(B.y-A.y)*k,bx=B.x-(B.x-A.x)*k,by=B.y+hy-(B.y-A.y)*k,O={x:0,y:0,face:1};
    cap(O,[ax,ay],[bx,by],sc.load==="шест"?1.1:1.5,Math.min(1,a*1.9));
    if(sc.load==="носилки"){const mx=(ax+bx)/2,my=(ay+by)/2-3,ux=(bx-ax)/d,uy=(by-ay)/d;
      cap(O,[mx-ux*d*.24,my-uy*d*.24],[mx+ux*d*.24,my+uy*d*.24],3,Math.min(1,a*1.3),1.2);}
  }
  const solo=(sc.load==="шест"||sc.load==="носилки")?"":sc.load;
  for(const q of pos){
    const sw=Math.sin(q.ph),sw2=Math.sin(q.ph+Math.PI),a=q.a,load=q.i===0?solo:"";
    /* ореол тела: мягкий, без края */
    {const p=at(q,0,-13);SH.push([1,p[0],p[1],3*s,0,0,9*s,C[0],C[1],C[2],a*.2]);}
    cap(q,[-.6,-8],[sw*1.8-.6,-4],1.1,a);cap(q,[sw*1.8-.6,-4],[sw*2.8-.6,0],1.1,a);
    cap(q,[.6,-8],[sw2*1.8+.6,-4],1.1,a);cap(q,[sw2*1.8+.6,-4],[sw2*2.8+.6,0],1.1,a);
    const P=(lx,ly)=>at(q,lx,ly),T=[C[0],C[1],C[2],a];
    gpuQuad(SH,P(-3.4,-8),P(-5,-17.6),P(5,-17.6),P(3.4,-8),T,2);
    gpuQuad(SH,P(-5,-17.6),P(-3,-19.2),P(3,-19.2),P(5,-17.6),T,8);
    cap(q,[.4,-19.2],[.4,-20.4],.8,a);
    {const p=at(q,.4,-22.4);SH.push([1,p[0],p[1],2.9*s,0,0,.4*s,C[0],C[1],C[2],a]);}
    if(load==="ящик"){
      cap(q,[2.6,-17],[6.4,-10.6],1.1,a);cap(q,[-2.6,-17],[5.4,-10.6],1.1,a);
      const p=at(q,5,-13.4),e=at(q,13.4,-5.8);
      SH.push([0,Math.min(p[0],e[0]),p[1],Math.max(p[0],e[0]),e[1],0,0,C[0],C[1],C[2],Math.min(1,a*1.25)]);
    }else if(load==="бочка"){
      cap(q,[-2.6,-17],[-4.6,-20.6],1.1,a);
      const p=at(q,-6,-23.4);SH.push([1,p[0],p[1],4.3*s,0,0,.5*s,C[0],C[1],C[2],a]);
      cap(q,[2.6,-17],[3.8,-10.6+sw*1.6],1.1,a);
    }else{
      cap(q,[4.4,-17.2],[sw2*3+5.2,-9.2],1.1,a);cap(q,[-4.4,-17.2],[sw*3-5.2,-9.2],1.1,a);
    }
  }
  gpuShapes(pass,SH,{blend:"add"});
  return true;
}
