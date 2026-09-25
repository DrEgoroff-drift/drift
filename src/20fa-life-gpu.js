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
   Экземпляр — восемь vec4: 0 спрайт (центр, размер; ширина <0 — зеркало), 1 растр-рамка,
   2 поворот/альфа/уровень нормали/режим, 3 свет (к звезде xy, сила, кромка), 4 изгиб
   (сдвиг верха, строка основания, вдох, строка пояса), 5 цвет ключа + дымка,
   6 цвет заполняющего + доля прямого света, 7 тень (скос, сплющивание, сила, радиус пятна).
   Режим 0 — освещённый спрайт, 1 — тень на грунт. */
const LG_WGSL=GPU_KIT_WGSL+`
@group(0) @binding(1) var<storage,read> lq:array<vec4f>;
@group(0) @binding(2) var ltx:texture_2d<f32>;
@group(0) @binding(3) var lsm:sampler;
struct LO{@builtin(position) p:vec4f,@location(0) q:vec2f,@location(1) @interpolate(flat) ii:u32};
@vertex fn vs(@builtin(vertex_index) vi:u32,@builtin(instance_index) ii:u32)->LO{
  let r=lq[ii*8u+1u];let q=mix(r.xy,r.zw,kCorn(vi));
  var o:LO;o.p=kClip(q);o.q=q;o.ii=ii;return o;}
fn la(uv:vec2f,l:f32)->f32{return textureSampleLevel(ltx,lsm,uv,l).a;}
@fragment fn fs(i:LO)->@location(0) vec4f{
  let b=i.ii*8u;let S=lq[b];let M=lq[b+2u];let Lt=lq[b+3u];let Wp=lq[b+4u];
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
  rgb=mix(rgb,A.rgb*c.a,K.w);
  return vec4f(rgb,c.a)*M.y;}`;
const LG_N=8,LG_CAP=160,LG_BK=new Map();
let LG_ID=0,LG_F=new Float32Array(LG_N*4*8);
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
function lifeBakeDrop(B){gpuBakeDrop(B);if(GPU.bgs)delete GPU.bgs["life:"+B.lid];}
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
  const put=(i,mode,q)=>{const k=i*32;
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
  const A=gpuArena("life",n*32,32);
  GPU.dev.queue.writeBuffer(A.buf,A.off*4,f,0,n*32);
  const P=gpuPipe("life.spr",LG_WGSL,"over");
  pass.setPipeline(P);
  pass.setBindGroup(0,gpuBind("life:"+B.lid,P,[gpuKitU(),A.buf,B.view,gpuMipSmp()]));
  pass.draw(6,n,0,A.off/32);
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
/* точка и масштаб из текущего преобразования 2D-холста — для режима на полпути: он ещё
   двигает ctx (translate/scale, withScale), а фигуру уже отдаёт двойнику. Холст #c
   стоит в DPR, двойник — в пикселях CSS */
function lifeHere(x,y){const m=ctx.getTransform(),d=DPR||1;x=x||0;y=y||0;
  return {x:(m.a*x+m.c*y+m.e)/d,y:(m.b*x+m.d*y+m.f)/d,s:Math.hypot(m.a,m.b)/d};}

/* ══ зверь ══
   Тело печётся неподвижным (drawBeast с выпечкой k: профиль вправо, без ног и парения),
   а всё, что шевелится каждый кадр, — ноги, хвост, щупальца, жало, шов кристалла — живые
   капсулы со светом мира: 2D резал их одним цветом, здесь нога в тени темнее ноги на свету.
   Ключ выпечки: особь, враждебность, оглушение, моргание; манта — ещё фаза крыла (16),
   панцирный — голова наружу. Купол медузы дышит масштабом спрайта, а не новой выпечкой */
const LG_OID=new WeakMap(),LG_TH=16;
let LG_ON=0;
function lifeId(o){let i=LG_OID.get(o);if(!i)LG_OID.set(o,i=++LG_ON);return i;}
/* цвет по свету мира: d — доля прямого (0 тень, 1 свет), как множитель шейдера */
function lifeTint(c,L,d){
  const o=[0,0,0],k=L.k==null?.8:L.k,lt=L.lit==null?1:L.lit,t=d*lt;
  const Y=v=>Math.max(.05,v[0]*.3+v[1]*.59+v[2]*.11),yk=Y(L.key),ya=Y(L.amb),lum=lerp(.78,1.12,t);
  for(let i=0;i<3;i++){
    const kc=lerp(1,L.key[i]/yk,.42),ac=lerp(1,L.amb[i]/ya,.5),m=lerp(ac,kc,t)*lum;
    o[i]=clamp(c[i]*(1+(m-1)*k),0,255);}
  return o;
}
/* рамка выпечки в единицах зверя (начало — центр тела, как у 2D после translate) */
function lifeBeastBox(b){
  const R=b.r,m=2;
  switch(b.alien){
    case "jelly":return {x0:-1.3*R-m,y0:-R-m,x1:1.3*R+m,y1:m};
    case "strider":return {x0:-R-m,y0:-1.95*R-m,x1:2.15*R+m,y1:.55*R+m};
    case "crystal":return {x0:-1.45*R-m,y0:-.66*R-m,x1:1.45*R+m,y1:.66*R+m};
    case "manta":return {x0:-R*b.span-m,y0:-1.25*R-m,x1:R*b.span+m,y1:.8*R+m};
    case "shell":return {x0:-1.2*R-m,y0:-.75*R-m,x1:1.65*R+m,y1:.45*R+m};
  }
  const hx=R*b.headX,hs=R*b.headSize*(1.05),bx=b.bx,by=b.by;
  return {x0:-1.3*bx*R-m,y0:-Math.max(1.3*by*R,b.crest?1.55*by*R:0,b.ears?.3*by*R+hs*.85+.4*R:0)-m,
    x1:Math.max(1.3*bx*R,hx+hs*1.3)+m,y1:1.2*by*R+m};
}
/* ДВОЙНИК drawBeast (и drawBeastAlien): те же (b,x,y,hostile,stun); o.s — масштаб, o.light —
   свет, o.shadow:false — без тени, o.noLabel — без «ОГЛУШЁН» (подпись — 2D, поверх) */
function lifeBeastGpu(pass,b,x,y,hostile,stun,o){
  if(!pass||!GPU.dev||!b)return false;
  o=o||{};
  const s=o.s||1,L=o.light||lifeLight(),R=b.r,t=G.t*b.spd+b.phase,fc=b.face||1,al=b.alien,c=b.body;
  const hov=al?(b.hover?b.hover*(1+.16*Math.sin(t*.6)):0):0;
  const bob=al?0:(b.hop?Math.abs(Math.sin(t))*R*.35:Math.sin(t)*R*.08);
  const oy=y-(R*.9+hov+bob)*s;
  const blink=!al&&Math.sin(G.t*.05+b.phase*3)>.96;
  const th=al==="manta"?Math.round((((t*1.5)%TAU+TAU)%TAU)/TAU*LG_TH)%LG_TH:0;
  const moving=al==="shell"&&Math.abs(b.vx)>.02;
  const X=lifeBeastBox(b),bw=X.x1-X.x0,bh=X.y1-X.y0,ss=clamp(512/Math.max(bw,bh),1,3);
  const key="b|"+lifeId(b)+"|"+(hostile?1:0)+(stun>0?1:0)+(blink?1:0)+(moving?1:0)+"|"+th;
  const B=lifeBaked(key,bw*ss,bh*ss,g=>{
    g.translate(-X.x0*ss,-X.y0*ss);g.scale(ss,ss);
    drawBeast(b,0,R*.9,hostile,stun,{blink,moving,th:th/LG_TH*TAU});
  });
  if(!B)return false;
  /* купол медузы сжимается и тянется — масштаб спрайта вокруг центра тела */
  const pu=al==="jelly"?.82+.18*Math.sin(t*1.6):1,kx=pu,ky=1/pu;
  const S={x:x+fc*(X.x0+X.x1)/2*kx*s,y:oy+(X.y0+X.y1)/2*ky*s,w:fc*bw*kx*s,h:bh*ky*s,
    base:(R*.9+hov+bob-X.y0)/bh,lod:1.3,ao:R*1.15*s,shadow:hov?clamp(1-hov/70,.25,1):1};
  const P=(lx,ly)=>[x+fc*lx*s,oy+ly*s];
  const col=(k,d)=>lifeTint([c[0]*k,c[1]*k,c[2]*k],L,d);
  const seg=(A,a,b2,hw,C,al2)=>{const p=P(a[0],a[1]),q=P(b2[0],b2[1]);A.push([2,p[0],p[1],q[0],q[1],hw*s,.35*s,C[0],C[1],C[2],al2]);};
  /* кривая Безье второго порядка — цепью капсул, толщина от hw0 к hw1 */
  const qd=(A,a,cc,e,hw0,hw1,C,al2,n)=>{n=n||5;let pr=a;
    for(let j=1;j<=n;j++){const u=j/n,v=1-u,q=[v*v*a[0]+2*v*u*cc[0]+u*u*e[0],v*v*a[1]+2*v*u*cc[1]+u*u*e[1]];
      seg(A,pr,q,lerp(hw0,hw1,u),C,al2);pr=q;}};
  const back=[],front=[],glow=[];
  if(!al){
    const lc=col(.55,.35),lw=Math.max(1,R*.16)/2;
    for(let i=0;i<b.legs;i++){
      const u=(i/(b.legs-1||1)-.5)*1.7,sw=stun>0?0:Math.sin(t*2+i*1.9)*R*.3;
      seg(back,[u*R*.8*b.bx,R*.35*b.by],[u*R*.9*b.bx+sw,R*.95],lw,lc,1);
    }
    if(b.tail){const tw=Math.max(1,R*.22)/2;
      qd(back,[-R*.8*b.bx,-R*.1],[-R*1.7*b.bx,-R*.5-Math.sin(t*1.6)*R*.3],[-R*1.9*b.bx,R*.2],tw,tw*.55,col(.7,.5),1);}
    if(b.glow)glow.push([0,0,R*2.2,col(1.4,1),.2]);
  }else if(al==="jelly"){
    const bw2=R*1.25*pu;
    for(let i=0;i<b.tent;i++){
      const u=(i/(b.tent-1)-.5)*1.7,sx=u*bw2*.85,w=(1+(1-Math.abs(u))*1.2)/2,Ln=R*(1.6+Math.abs(u)*.9);
      qd(front,[sx,0],[sx+Math.sin(t*1.3+i)*R*.4,Ln*.55],[sx+Math.sin(t*1.1+i*1.7)*R*.7,Ln],w,w*.35,col(1.1,.6),.5);
    }
    glow.push([0,-R*.95/pu*.2,R*2.2,col(1.6,1),.2]);
  }else if(al==="strider"){
    const legH=R*2.2,lc=col(.65,.4);
    for(let i=0;i<6;i++){
      const sd=i<3?-1:1,k=i%3,px=(k-1)*R*.55,st=Math.sin(t*1.4+i*2.1)*R*.5;
      qd(back,[px,0],[px+sd*R*1.1,legH*.45],[px+st+sd*R*.5,legH],.8,.6,lc,.9);
    }
  }else if(al==="crystal"){
    const Q=[];for(let i=0;i<b.facets;i++){const a=i/b.facets*TAU;Q.push([Math.cos(a)*R*(.9+((i*37)%5)/5*.5),Math.sin(a)*R*.62]);}
    seg(front,Q[0],Q[b.facets>>1],.7,col(1.8,1),.5+.3*Math.sin(t*2));
    const lc=col(.6,.4);
    for(let i=0;i<6;i++){const px=(i%3-1)*R*.5,sd=i<3?-1:1,st=Math.sin(t*1.8+i)*R*.3;
      seg(front,[px,R*.3],[px+st+sd*R*.6,R*1.25],.5,lc,.85);}
    glow.push([0,0,R*1.8,col(1.9,1),.16]);
  }else if(al==="manta"){
    qd(front,[0,R*.6],[-R*.3,R*1.4],[-R*.1+Math.sin(t)*R*.3,R*2.1],.6,.3,col(.7,.5),.7);
  }else{
    const lc=col(.5,.3);
    for(let i=0;i<4;i++){const px=(i-1.5)*R*.5,st=Math.sin(t*1.6+i*1.6)*R*.22,a=P(px-1.2,R*.2),e=P(px+1.2,R*.8+st);
      back.push([0,Math.min(a[0],e[0]),a[1],Math.max(a[0],e[0]),e[1],0,0,lc[0],lc[1],lc[2],.95]);}
  }
  if(al&&b.glow)glow.push([0,0,R*2.2,col(1.5,1),.2]);
  /* порядок 2D: тень, то, что за телом, тело, то, что перед ним, свечение */
  S.part=1;lifeSprite(pass,B,S,L);
  if(stun>0){const p=P(0,0);gpuShapes(pass,[[1,p[0],p[1],R*s*.4,0,0,R*s*2.2,140,220,255,.3]],{blend:"add"});}
  gpuShapes(pass,back);
  S.part=2;lifeSprite(pass,B,S,L);
  gpuShapes(pass,front);
  if(glow.length)gpuShapes(pass,glow.map(q=>{const p=P(q[0],q[1]);return [1,p[0],p[1],q[2]*s*.15,0,0,q[2]*s*.85,q[3][0],q[3][1],q[3][2],q[4]];}),{blend:"add"});
  if(stun>0&&!o.noLabel){
    ctx.save();ctx.setTransform(DPR,0,0,DPR,0,0);
    ctx.fillStyle="rgba(160,225,255,.85)";ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
    ctx.fillText("ОГЛУШЁН",x,y-R*2.6*s);ctx.restore();
  }
  return true;
}

/* ══ трава и кусты ══
   Растение печётся стоящим ровно (PLANT_BAKE в 20-life: без порыва, затмения, тени гребня
   и дымки), свет звезды в выпечке — ступенью (восемь по горизонту). Каждый кадр шейдер
   гнёт его от комля (порыв plantBend и качание режима — сдвиг верха, квадрат высоты),
   тенит гребнем (lit), уводит дальнее в воздух (haze) и кладёт тень на грунт. 2D-кисть
   гнула ствол ломаной, но лист и шляпка ехали с ним жёстко; поворот режима клонил куст
   целиком, как палку */
const PLANT_UXQ=8;
function lifePlantBox(pl){
  const h=Math.max(8,pl.h||20),w=(pl.w||2)+6;
  if(pl.kind===6){const hw=((pl.blobs||3)*.45+1.2)*h+6;return {x0:-hw,y0:-h*1.1-6,x1:hw,y1:5};}
  const hw=h*1.05+w;
  return {x0:-hw,y0:-h*1.5-8,x1:hw,y1:5};
}
/* ДВОЙНИК drawPlant: (pl,x,y,haze) — то же, x,y — комель на экране. o.s — масштаб (глубина
   куртины и масштаб мира), o.a — прозрачность, o.sway — качание режима (радианы, как
   ctx.rotate у поверхности), o.light, o.shadow:false. Тень гребня (castLive) — сама */
function lifePlantGpu(pass,pl,x,y,haze,o){
  if(!pass||!GPU.dev||!pl)return false;
  o=o||{};
  const s=o.s||1,L=o.light||lifeLight(),X=lifePlantBox(pl),bw=X.x1-X.x0,bh=X.y1-X.y0;
  const uq=Math.round(clamp(plantUx(),-1,1)*PLANT_UXQ/2);
  const ss=clamp(420/Math.max(bw,bh),1,3);
  const key="p|"+lifeId(pl)+"|"+uq+"|"+(pl.scanned?1:0);
  const B=lifeBaked(key,bw*ss,bh*ss,g=>{
    g.translate(-X.x0*ss,-X.y0*ss);g.scale(ss,ss);
    PLANT_BAKE={ux:uq/(PLANT_UXQ/2)||.01};
    try{drawPlant(pl,0,0,0);}finally{PLANT_BAKE=null;}
  });
  if(!B)return false;
  const h=Math.max(8,pl.h||20);
  /* изгиб: сдвиг верха в пикселях → доля ширины спрайта. Ствол у 2D уходил на bend*.28
     высоты (у форм-силуэтов .22·.2), ленты ещё и волной */
  let top=(pl.kind===4||pl.kind===6?0:plantBend(pl)*(pl.kind>=7?.06:.28))+(o.sway||0)*(pl.kind===6?.3:1);
  if(pl.kind===11)top+=Math.sin(G.t*(pl.sway||.02)*1.6+(pl.phase||0))*.22;
  /* затмение: то, что живёт светом, приседает (06a-celest) — масштаб, как у 2D */
  const DK=pl.kind>=7&&pl.kind<=11&&typeof celDark==="function"?celDark():0;
  const kx=DK>.05?1-.10*DK:1,ky=DK>.05?1-.32*DK:1;
  const cast=(G.mode==="surface"&&typeof castLive==="function"&&G.surf&&G.surf.tr)?castLive(G.surf.tr,pl.x):0;
  const lit=(L.lit==null?1:L.lit)*(1-((typeof CAST_LIVE==="number")?CAST_LIVE:.5)*cast);
  const hz=haze>0?clamp(haze,0,.8):0;
  const S={x:x+(X.x0+X.x1)/2*kx*s,y:y+(X.y0+X.y1)/2*ky*s,w:bw*kx*s,h:bh*ky*s,
    base:-X.y0/bh,bend:top*h/bw,lod:1.5,a:o.a,haze:hz,lit,ao:Math.min(22,h*.32)*s,
    shadow:o.shadow===false?false:(1-hz)*.85};
  return lifeSprite(pass,B,S,Object.assign({},L,{k:(L.k==null?.8:L.k)*.75,rim:(L.rim==null?1:L.rim)*.5}));
}

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
