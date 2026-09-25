/* ══════════════ дорожный спутник: небо ══════════════
   Задник дорожного экрана, отделён от 27l-road-draw на M168k: файл перешёл
   сорок килобайт, а шов тут естественный — небо не знает ни о корпусе, ни о
   шлейфе, ни о числах, и берёт снаружи только меры кадра.

   Три слоя от дальнего к ближнему: туманности настроения, звёздный поток,
   попутчики по сектору. Плюс то, что рождает музыка: искры на битах и белые
   импульсы касания. Всё живёт на RD и на шкале хода `fast`.

   G12 (25.09): небо рисует видеокарта, под всем 2D кадра (gpuScene). Одно поле
   — фон, туманности, тоннель гипердрайва; всё точечное — одним вызовом фигур
   (gpuShapes). Что стало лучше:
   - туманность — ОБЛАКО, а не круглое пятно: плотность радиального спада
     изрезана варпнутым шумом, край рваный, внутри волокна и провалы, и всё
     это медленно течёт. Прежде три ровных градиентных круга;
   - тоннель гипердрайва — не 46 черт, а поле: росчерки в два слоя, у каждого
     свой угол и фаза, яркость растёт к наружному концу — он читается полётом
     сквозь, а не лучами, нарисованными поверх;
   - у звёзд мягкая кромка, и у крупных — свой ореол, который свечение кадра
     подхватывает: на ходу росчерки светятся, а не лежат плоскими палочками;
   - вспышка касания — свет с мягким спадом и кольцо со сглаживанием. */
const ROAD_SKY_WGSL=`
fn rsH(p:vec2f)->f32{var q=fract(vec3f(p.xyx)*.1031);q=q+dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
fn rsN(p:vec2f)->f32{let i=floor(p);let f=fract(p);let w=f*f*(3.-2.*f);
  return mix(mix(rsH(i),rsH(i+vec2f(1.,0.)),w.x),mix(rsH(i+vec2f(0.,1.)),rsH(i+vec2f(1.,1.)),w.x),w.y);}
fn rsF(p:vec2f)->f32{var v=0.;var a=.5;var q=p;
  for(var i=0;i<4;i++){v+=a*rsN(q);q=q*2.03+vec2f(11.7,-5.3);a*=.5;}
  return v/.9375;}
fn rsHsl(h0:f32,s:f32,l:f32)->vec3f{
  let h=pmod(h0,360.)/360.;
  let q=select(l+s-l*s,l*(1.+s),l<.5);let p=2.*l-q;
  var o=vec3f(0.);
  for(var k=0;k<3;k++){
    var x=h+(1./3.)-f32(k)/3.;x=x-floor(x);
    var c=p;
    if(x<1./6.){c=p+(q-p)*6.*x;}else if(x<.5){c=q;}else if(x<2./3.){c=p+(q-p)*(2./3.-x)*6.;}
    o[k]=c;}
  return o;}
fn field(p:vec2f,uv:vec2f)->vec4f{
  let t=fu.v[6].x;
  /* фон: тот же вертикальный градиент, что был у 2D */
  var col=mix(vec3f(4.,6.,12.)/255.,vec3f(8.,13.,24.)/255.,smoothstep(0.,.65,uv.y));
  col=mix(col,vec3f(6.,10.,18.)/255.,smoothstep(.65,1.,uv.y));
  /* туманности: спад по радиусу, изрезанный варпнутым шумом — облако, а не круг */
  let S=min(fu.res.z,fu.res.w);
  for(var i=0;i<3;i++){
    let B=fu.v[i];let C=fu.v[3+i];
    let d=length(p-B.xy)/max(B.z,1.);
    if(d>1.25){continue;}
    let fi=f32(i);
    let q=(p-B.xy)/S*3.2+vec2f(fi*7.3,fi*3.1);
    let w=vec2f(rsF(q+vec2f(t*.021,-t*.013)),rsF(q*1.3+vec2f(-t*.017,t*.011)+5.2));
    let n=rsF(q*1.1+w*1.7);
    let fall=1.-smoothstep(0.,1.,d+(w.x-.5)*.45);
    let dens=fall*fall*(.25+1.55*n*n);
    let l=mix(.30,C.z,exp(-d*d*3.));
    col=col+rsHsl(C.x,C.y,l)*B.w*dens;
  }
  /* тоннель гипердрайва: росчерки в два слоя сходятся в точку по курсу */
  let tk=fu.v[6].y;
  if(tk>0.){
    let vp=fu.v[7].xy;let dv=p-vp;let r=length(dv);
    let ang=atan2(dv.y,dv.x)/6.2831853+.5;
    let R=max(fu.res.z,fu.res.w);
    var s=0.;
    for(var L=0;L<2;L++){
      let N=40.+f32(L)*17.;
      let cell=floor(ang*N);let h1=rsH(vec2f(cell,f32(L)*7.1));let h2=rsH(vec2f(cell+3.3,f32(L)*2.9+1.));
      let ac=(cell+.5+(h1-.5)*.7)/N;
      let da=abs(ang-ac)*6.2831853*r;
      let wid=.55+h2*.8;
      let line=1.-smoothstep(wid*.5,wid*.5+1.,da);
      let r0=(60.+h1*R)*(1.+fract(t*1.6+h2));
      let u=(r-r0*.72)/(r0*.28);
      if(u>0.&&u<1.){s+=line*u*u*(1.+h2);}
    }
    col=col+rsHsl(fu.v[6].w,.70,.80)*s*tk;
  }
  return vec4f(col,1.);}`;
const ROAD_SKY_U=new Float32Array(32);
/* цвет в 0..255 для фигур: тон, насыщенность и светлота долями */
function roadRgb(h,s,l){
  h=((h%360)+360)%360/360;
  const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;
  const f=k=>{let x=h+k;if(x<0)x+=1;if(x>1)x-=1;
    return 255*(x<1/6?p+(q-p)*6*x:x<.5?q:x<2/3?p+(q-p)*(2/3-x)*6:p);};
  return [f(1/3),f(0),f(-1/3)];
}
const ROAD_SKY_SH=[];
function roadSky(W,H,t,dt,spd,tier,fast,hue,en){
  const ease=tau=>1-Math.exp(-dt/tau);
  const pass=gpuScene();
  /* абсолютные меры (размер звезды, росчерк, искра) настраивались на холсте с
     плотностью 2 — в пикселях CSS они вдвое меньше на телефоне и те же на столе */
  const k=1/Math.min(2,(typeof window!=="undefined"&&window.devicePixelRatio)||1);
  /* туманности: дышат энергией, цвет — настроение музыки; тона разведены по
     кругу (ROAD_SKY_H), иначе небо одноцветное (автор: «хочется богатую палитру») */
  const U=ROAD_SKY_U;
  for(let i=0;i<3;i++){
    U[i*4]=W*(.16+.34*i)+Math.sin(t*.05+i*2.1)*W*.06;
    U[i*4+1]=H*(.16+.14*Math.sin(t*.04+i*1.7))+i*H*.12;
    U[i*4+2]=(H*.16+H*.06*Math.sin(t*.09+i))*(1+en*.9)*1.25;
    U[i*4+3]=(.13+en*.36)*(1-i*.16);
    U[12+i*4]=hue+ROAD_SKY_H[i];U[12+i*4+1]=ROAD_SKY_S[i]/100;U[12+i*4+2]=(40+RD.bright*20)/100;U[12+i*4+3]=0;
  }
  U[24]=t;U[25]=tier===3?.05+fast*.12:0;U[26]=fast;U[27]=hue;
  U[28]=W*.5;U[29]=H*.2;U[30]=RD.bright;U[31]=en;
  gpuField(pass,"road.sky",ROAD_SKY_WGSL,U,null,{blend:"over"});
  const SH=ROAD_SKY_SH;SH.length=0;
  /* корабль летит ВВЕРХ (портретный экран — дорога впереди): звёзды текут
     вниз; на экспрессе тянутся вдвое, бит рождает новые. У каждой звезды СВОИ
     размер, длина и яркость (M168g): мелких много, жирных единицы (куб от
     ровного), одна из восьми — тёплая или в цвет настроения. */
  const r=rng(0x50AD);
  const streak=tier===2?2.2:tier===3?4:1;
  const nst=tier===3?190:tier===2?150:110;
  /* Ход, а не мигание (M168k, слова автора): мерцание — приём для СТОЯНКИ,
     на ходу амплитуда гаснет к половине шкалы хода */
  const tw=.18*clamp(1-fast*2,0,1);
  const glint=clamp((.30-fast)/.14,0,1);   /* крестик-блик гаснет плавно: жёсткий порог мигал на каждом светофоре */
  const warmC=roadRgb(hue,.6,.86);
  for(let i=0;i<nst;i++){
    const depth=.25+r()*.75,x=r()*W;
    const q=r(),sz=(.7+q*q*q*2.2)*k;
    const own=.5+r()*1.3;
    const warm=r()<.125;
    const y=(r()*H+t*(28+Math.min(spd,300)*7)*depth)%H;
    const bri=clamp((.30+depth*.62)*(.62+sz/k*.30)*(1-tw+tw*Math.sin(t*2.3+i*1.7)),0,1);
    const C=warm?warmC:depth>.8?[238,247,252]:[168,188,203];
    const yv=((y%H)+H)%H,len=fast*30*depth*streak*own*k,hw=Math.max(.35,sz*.5);
    /* крупная звезда получает крестик-блик и ореол: без них и яркая точка тонет */
    if(sz/k>2.3&&depth>.7){
      if(glint>0)SH.push([2,x-sz*.9,yv+sz*.5,x+sz*1.9,yv+sz*.5,.5,.6,C[0],C[1],C[2],bri*glint]);
      SH.push([1,x+sz*.5,yv+sz*.5,sz*.5,0,0,sz*3.5,C[0],C[1],C[2],bri*.22]);
    }
    SH.push([2,x+sz*.5,yv+hw,x+sz*.5,yv+hw+len,hw,.6,C[0],C[1],C[2],bri*(sz/k>2?1.25:1)]);
  }
  /* дальняя пыль: почти неподвижна — от неё берётся глубина, а не скорость */
  for(let i=0;i<60;i++){
    const depth=.05+r()*.15,x=r()*W;
    const y=(r()*H+t*(6+Math.min(spd,300)*1.2)*depth)%H;
    SH.push([1,x,((y%H)+H)%H,.55*k+.2,0,0,.5,92,107,122,.10+depth*.5]);
  }
  /* пилоты рядом (M168f): кто сейчас едет по этому же сектору — далёкие
     попутные корабли: искра с выхлопом, своя глубина и свой дрейф. Рисунок
     детерминирован сектором, появляются и тают плавно */
  RD.matesShow=(RD.matesShow||0)+(Math.min(RD.mates||0,5)-(RD.matesShow||0))*ease(.83);
  if(RD.matesShow>.05&&RD.sys){
    const pr=rng(hashi(RD.sys.cx,RD.sys.cy,0x9110));
    const n=Math.ceil(RD.matesShow);
    const mc=roadRgb(hue,.6,.88),tc=roadRgb(hue,.8,.70);
    for(let i=0;i<n;i++){
      const depth=.35+pr()*.45,bx=W*(.1+pr()*.8),ph=pr()*TAU,spdK=.004+pr()*.006;
      const fr=(ph/TAU+t*spdK*(1.2-depth))%1;
      const x=bx+Math.sin(t*.13+ph)*W*.05*depth;
      const y=H*(.12+.6*fr);
      const vis=Math.sin(Math.PI*fr)*clamp(RD.matesShow-i,0,1);
      if(vis<=0)continue;
      const s=(.9+depth*1.4)*k;
      /* выхлоп — сужающимся следом из четырёх звеньев, гаснет к хвосту */
      for(let j=0;j<4;j++)SH.push([2,x,y+2*s+j*4*s,x,y+2*s+(j+1)*4*s,.8*s*(1-j*.18),s,tc[0],tc[1],tc[2],vis*.5*(1-j*.26)]);
      SH.push([2,x,y-1.5*s,x,y+1.5*s,1.1*s,.6,mc[0],mc[1],mc[2],vis*.85]);
    }
  }
  if(RD.beat>.6&&RD.sparks.length<24)
    RD.sparks.push({x:W*(.1+rndFx()*.8),y:-20,v:2+rndFx()*3+fast*6,life:1,big:rndFx()<.2});
  const sc=roadRgb(hue,.8,.80);
  for(let i=RD.sparks.length-1;i>=0;i--){
    const s=RD.sparks[i];
    s.y+=s.v*(H/700)*60*dt;s.life-=.24*dt;
    if(s.y>H+30||s.life<=0){RD.sparks.splice(i,1);continue;}
    const a=s.life*.9;
    if(s.big){
      for(let j=1;j<=4;j++){const an=j*Math.PI/4,cx=Math.cos(an)*5*k,sy=Math.sin(an)*5*k;
        SH.push([2,s.x-cx,s.y-sy,s.x+cx,s.y+sy,.8*k,.6,sc[0],sc[1],sc[2],a]);}
      SH.push([1,s.x,s.y,1.2*k,0,0,6*k,sc[0],sc[1],sc[2],a*.35]);
    }else SH.push([2,s.x+.7*k,s.y,s.x+.7*k,s.y+(4+s.v)*k,.7*k,.6,sc[0],sc[1],sc[2],a]);
  }
  /* касание — вспышка, как у «Волны»: местное свечение в тон настроения,
     затухающее по экспоненте, и тонкое кольцо по фронту (M168k) */
  const pc=roadRgb(hue,.9,.64);
  for(let i=RD.pulses.length-1;i>=0;i--){
    const p=RD.pulses[i];p.r+=W*.012*60*dt;p.a*=Math.exp(-dt/.27);
    if(p.a<.02){RD.pulses.splice(i,1);continue;}
    const R=p.r+W*.10;
    SH.push([1,p.x,p.y,R*.12,0,0,R*.88,pc[0],pc[1],pc[2],p.a*.7]);
    SH.push([3,p.x,p.y,p.r,0,.75,.6,255,255,255,p.a*.45]);
  }
  gpuShapes(pass,SH,{blend:"add"});
}
