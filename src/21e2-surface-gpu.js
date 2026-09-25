/* ══════════════ поверхность на видеокарте (G6, docs/DESIGN-gpu.md) ══════════════
   Дальние гряды и ближний грунт — слоями видеокарты, а не drawImage тайлов.
   Порядок кадра (§3 «одно правило»): небо — под всем (19ca); звёзды, светила и
   облака — 2D; ПОВЕРХ них первый gpuOver кладёт гряды; дымка и дальний дождь —
   снова 2D; второй gpuOver кладёт грунт; всё, что стоит на земле, — 2D поверх.
   Два gpuOver на кадр — в пределах правила «два-три».

   Гряды — одно полноэкранное поле на обе, лучше прежней плоской заливки:
   · профиль тот же (tr.farH, гребневой шум 21e1), но по кромке сидит мелкий
     зубец — у гряды появляется скальная кромка, а не ломаная в двадцать пикселей;
   · склон, обращённый к звезде, светлее, отвёрнутый — в тень; с глубиной под
     гребнем лепка гаснет, а подошва тонет в воздухе (высотная дымка): ближе к
     низу гряда уходит в цвет неба, а не стоит глухой стеной;
   · в долинах между гребнями медленно тянется туман (движение, не мигание);
   · по гребню со стороны звезды — тонкая кромка, поймавшая свет;
   · зерно привязано к миру: при ходьбе оно едет вместе с грядой.
   Высоты едут текстурой N×3 (rgba8: старший и младший байт), по планете раз. */
const GSR=new Float32Array(60);
const GSR_WGSL=`
fn srh(x:f32)->f32{return fract(sin(x*127.1+311.7)*43758.5453);}
fn srn(x:f32)->f32{let i=floor(x);let f=fract(x);return mix(srh(i),srh(i+1.),f*f*(3.-2.*f));}
fn srk(p:vec2f)->f32{var q=fract(vec3f(p.xyx)*.1031);q=q+dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
fn srn2(p:vec2f)->f32{let i=floor(p);let f=fract(p);let u=f*f*(3.-2.*f);
  return mix(mix(srk(i),srk(i+vec2f(1.,0.)),u.x),mix(srk(i+vec2f(0.,1.)),srk(i+vec2f(1.,1.)),u.x),u.y);}
/* высота отсчёта i слоя row: два байта, 1/8 px, от середины профиля */
fn srH(row:i32,i:i32)->f32{
  let n=i32(fu.v[5].w);let t=textureLoad(t0,vec2i(clamp(i,0,n-1),row),0);
  return fu.v[1].w+((t.r*255.*256.+t.g*255.)/8.-4096.);}
/* гребень слоя: y кромки на экране, наклон, есть ли слой здесь (x в пределах полосы) */
fn srRidge(row:i32,x:f32,o:vec4f,det:f32)->vec3f{
  let n=fu.v[5].w;let fi=(x+o.x)/o.z;
  if(fi<0.||fi>n-1.){return vec3f(1e9,0.,0.);}
  let i=i32(floor(fi));let f=fi-floor(fi);
  let h0=srH(row,i);let h1=srH(row,i+1);
  let wx=x+o.x;
  /* мелкий зубец по кромке: две октавы в мировом x слоя */
  let d=((srn(wx*.085+f32(row)*17.)-.5)*2.4+(srn(wx*.31+f32(row)*5.)-.5)*.9)*det;
  return vec3f(mix(h0,h1,f)-o.y+d,(h1-h0)/o.z,1.);
}
fn srLayer(p:vec2f,row:i32,o:vec4f,col:vec3f,k:f32,det:f32,ink:vec4f)->vec4f{
  let r=srRidge(row,p.x,o,det);
  if(r.z<.5){return ink;}
  let px=fu.res.z/fu.res.x;
  let dd=p.y-r.x;
  let cov=clamp(dd/(px*sqrt(1.+r.y*r.y))+.5,0.,1.);
  if(cov<=0.){return ink;}
  let V=fu.v;let air=V[4].rgb;let hasAir=V[6].w;let day=V[5].z;
  /* лепка склона по звезде: нормаль профиля, как у litRGB (19c-light) */
  let nl=sqrt(1.+r.y*r.y);let nrm=vec2f(-r.y,-1.)/nl;
  let lit=clamp(dot(nrm,V[5].xy),0.,1.);
  let fade=exp(-max(dd,0.)/(60.*(1.2-k)));
  var c=col*(1.+(pow(lit,.8)-.55)*(.46-.4*k)*(.35+.65*day)*fade);
  /* воздух у подошвы: чем ниже под гребнем, тем больше неба между глазом и склоном */
  let wx=p.x+o.x;
  let mist=srn2(vec2f(wx*.006-V[7].x*(.35+k),p.y*.02+f32(row)*9.));
  let fog=smoothstep(0.,150.*(1.1-k),dd)*(.26+.16*k)*(.7+.6*mist)*hasAir;
  c=mix(c,air,clamp(fog,0.,.85));
  /* промоины по линии падения: вытянутые вниз тени, у гребня сильнее */
  let gul=srn2(vec2f(wx*.09+f32(row)*3.,(p.y+o.y)*.011));
  c=c*(1.-(gul-.5)*.26*exp(-max(dd,0.)/(110.*(1.2-k)))*(1.-k*.7));
  /* кромка, поймавшая свет: тонкая, со стороны звезды */
  let rim=exp(-max(dd,0.)/(1.3*px+.6))*smoothstep(.35,.9,lit)*(.10+.12*day)*(1.-k*.6);
  c=c+V[6].rgb*rim;
  /* зерно в мире слоя — едет вместе с грядой */
  c=c*(1.+(srk(floor(vec2f(wx,p.y+o.y)/max(px,.5)))-.5)*.035);
  return vec4f(c*cov,cov)+ink*(1.-cov);
}
fn field(p:vec2f,uv:vec2f)->vec4f{
  let V=fu.v;
  /* ближняя гряда (B) поверх дальней (A), обе поверх самой дальней (C) */
  let b=srLayer(p,1,V[1],V[3].rgb,V[3].w,1.,vec4f(0.));
  if(b.a>=.999){return b;}
  var a=srLayer(p,0,V[0],V[2].rgb,V[2].w,.7,vec4f(0.));
  if(a.a<.999&&V[8].z>0.){let c=srLayer(p,3,V[8],V[9].rgb,V[9].w,.45,vec4f(0.));a=a+c*(1.-a.a);}
  return b+a*(1.-b.a);
}`;
const SRG_RGB=s=>{const m=String(s).match(/\d+(\.\d+)?/g)||[0,0,0];return [+m[0]/255,+m[1]/255,+m[2]/255];};
/* текстура высот: строки 0, 1 — дальние гряды, 2 — ближний грунт, 3 — самая дальняя
   (её нет — строка повторяет A и поле её не кладёт). Середина — mid ближнего */
function surfHeightTex(tr){
  const d=GPU.dev,N=tr.N,key=tr.farK+"|"+N+"|"+tr.farH.length;
  if(tr._gpuH&&tr._gpuH.dev===d&&tr._gpuH.key===key)return tr._gpuH;
  if(tr._gpuH&&tr._gpuH.dev===d)GPU.trash.push(tr._gpuH.tex);
  let s=0;for(let i=0;i<N;i++)s+=tr.h[i];
  const mid=Math.round(s/N),b=new Uint8Array(N*4*4);
  const rows=[tr.farH[0],tr.farH[1],tr.h,tr.farH[2]||tr.farH[0]];
  for(let r=0;r<4;r++)for(let i=0;i<N;i++){
    const v=clamp(Math.round((rows[r][i]-mid+4096)*8),0,65535),o=(r*N+i)*4;
    b[o]=v>>8;b[o+1]=v&255;b[o+2]=0;b[o+3]=255;
  }
  const U=GPUTextureUsage,tex=d.createTexture({size:[N,4],format:"rgba8unorm",usage:U.TEXTURE_BINDING|U.COPY_DST});
  d.queue.writeTexture({texture:tex},b,{bytesPerRow:N*4},[N,4]);
  return tr._gpuH={dev:d,key,tex,view:tex.createView(),mid};
}
/* обе дальние гряды одним полем; false — видеокарты нет, рисуют тайлы 2D */
function surfRidgesGpu(tr,p,camx,camy,stpK){
  if(!GPU.on||!tr.farH)return false;
  const pass=gpuOver();if(!pass)return false;
  const HT=surfHeightTex(tr),U=GSR;U.fill(0);
  const sA=tr.step*3.6*stpK,sB=tr.step*2.4*stpK;
  U[0]=camx*.22;U[1]=camy*.42+130;U[2]=sA;
  U[4]=camx*.35;U[5]=camy*.5+80;U[6]=sB;U[7]=HT.mid;
  const cA=SRG_RGB(hazeFar(p,.58)),cB=SRG_RGB(hazeFar(p,.32)),air=SRG_RGB(hazeFar(p,1));
  U[8]=cA[0];U[9]=cA[1];U[10]=cA[2];U[11]=.58;
  U[12]=cB[0];U[13]=cB[1];U[14]=cB[2];U[15]=.32;
  U[16]=air[0];U[17]=air[1];U[18]=air[2];U[19]=surfNight(p);
  U[20]=SUN_DIR.x;U[21]=SUN_DIR.y;U[22]=dayK(p);U[23]=tr.N;
  const sc=starRGB();
  U[24]=sc[0]/255;U[25]=sc[1]/255;U[26]=sc[2]/255;U[27]=p.T.atm==="отсутствует"?0:1;
  U[28]=(G.t||0)*.0012;
  /* самая дальняя гряда: выше и крупнее, почти в цвет воздуха, параллакс слабее */
  if(tr.farH[2]){
    U[32]=camx*.12;U[33]=camy*.34+215;U[34]=tr.step*5.4*stpK;
    const cC=SRG_RGB(hazeFar(p,.85));U[36]=cC[0];U[37]=cC[1];U[38]=cC[2];U[39]=.85;
  }
  gpuField(pass,"sridge",GSR_WGSL,U,[HT]);
  return true;
}

/* ══════════════ ближний грунт: ломти текстурами и порода под светом ══════════════
   Ломти пекутся тем же рецептом, что у drawGround (19-mode-landing-ground: форма,
   лессировка, оттенок, валуны), и тем же ключом — кэш общий. Кадр кладёт их
   gpuImage вторым gpuOver: поверх дымки и дальнего дождя, под всем, что стоит.
   Сверху — одно поле умножением, лучше плоского ломтя:
   · мелкий рельеф породы: бугры поля высот освещены с той стороны, где звезда,
     и гаснут с глубиной разреза — срез читается камнем, а не картинкой;
   · гребни выпуклые — светлее у кромки, ложбины глубже в тени;
   · зерно в пиксель, привязанное к миру: едет вместе с землёй. */
const GSG=new Float32Array(60);
const GSG_WGSL=`
fn sgk(p:vec2f)->f32{var q=fract(vec3f(p.xyx)*.1031);q=q+dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
fn sgn(p:vec2f)->f32{let i=floor(p);let f=fract(p);let u=f*f*(3.-2.*f);
  return mix(mix(sgk(i),sgk(i+vec2f(1.,0.)),u.x),mix(sgk(i+vec2f(0.,1.)),sgk(i+vec2f(1.,1.)),u.x),u.y);}
/* бугры: две октавы, крупная вытянута вдоль пластов */
fn sgb(w:vec2f)->f32{return sgn(w*vec2f(.045,.08))*.65+sgn(w*.19+vec2f(7.,3.))*.35;}
fn sgH(i:i32)->f32{
  let n=i32(fu.v[1].y);let t=textureLoad(t0,vec2i(clamp(i,0,n-1),2),0);
  return fu.v[1].z+((t.r*255.*256.+t.g*255.)/8.-4096.);}
fn field(p:vec2f,uv:vec2f)->vec4f{
  let V=fu.v;let st=V[1].x;let n=V[1].y;
  let wx=p.x+V[0].x;let fi=wx/st;
  if(fi<0.||fi>n-1.){return vec4f(0.);}
  let i=i32(floor(fi));let f=fi-floor(fi);
  let h0=sgH(i);let h1=sgH(i+1);let hm=sgH(i-1);let hp=sgH(i+2);
  let ey=mix(h0,h1,f)-V[0].y;let s=(h1-h0)/st;
  let px=fu.res.z/fu.res.x;
  let dd=p.y-ey;
  let cov=clamp(dd/(px*sqrt(1.+s*s))+.5,0.,1.);
  if(cov<=0.){return vec4f(0.);}
  let w=vec2f(wx,p.y+V[0].y);
  let sun=V[2].xy;let day=V[2].z;let str=V[2].w;
  /* нормаль бугров конечными разностями; свет — с неба звезды, чуть на зрителя */
  let e=1.6;let b0=sgb(w);
  let gx=(sgb(w+vec2f(e,0.))-b0)/e;let gy=(sgb(w+vec2f(0.,e))-b0)/e;
  let nr=normalize(vec3f(-gx*9.,-gy*9.,1.));let L=normalize(vec3f(sun.x,sun.y,.75));
  let sh=dot(nr,L)/L.z-1.;
  let deep=exp(-max(dd,0.)/190.);
  var m=1.+clamp(sh,-.6,.6)*.30*str*(.3+.7*day)*deep;
  /* выпуклость профиля: гребень ловит свет, ложбина держит тень */
  let cv=mix((hm+h1-2.*h0),(h0+hp-2.*h1),f)/st;
  m=m*(1.+clamp(cv,-1.,1.)*.20*exp(-max(dd,0.)/36.)*(.4+.6*day));
  /* зерно в пиксель, в координатах мира */
  m=m*(1.+(sgk(floor(w/max(px,.5)))-.5)*.07);
  /* тёплый ключ и холодная тень: верхняя кожа склона, повёрнутого к звезде, берёт
     цвет звезды; тело разреза с глубиной уходит в холод неба (закон «ключ тёплый,
     заполнение холодное») */
  let nl=sqrt(1.+s*s);let lit=clamp(dot(vec2f(-s,-1.)/nl,sun),0.,1.);
  let band=exp(-max(dd,0.)/26.)*pow(lit,1.2)*day;
  var mc=vec3f(m)*(vec3f(1.)+V[3].rgb*band*.42);
  let cold=smoothstep(14.,240.,dd)*.34;
  mc=mc*mix(vec3f(1.),V[4].rgb,cold);
  return vec4f(mc*cov,cov);
}`;
function surfGroundGpu(tr,camx,camy,fill,line,pal){
  if(!GPU.on||!pal||!tr.mat)return false;
  const pass=gpuOver();if(!pass)return false;
  if(tr.hMin==null){let a=1e9,b=-1e9;for(let i=0;i<tr.N;i++){if(tr.h[i]<a)a=tr.h[i];if(tr.h[i]>b)b=tr.h[i];}tr.hMin=a;tr.hMax=b;}
  const top=Math.floor(tr.hMin-90),ch=Math.ceil(tr.hMax-tr.hMin+H+120);
  /* ключ и рецепт — ровно drawGround: ломоть, испечённый там, годится здесь и наоборот */
  tr.chunks=chunkStore(tr.chunks,(tr.p?tr.p.seed:0)+"|"+fill+"|"+line+"|"+H+"|"+DPR+
    "|d"+(tr.p?dayKq(tr.p):0)+"|a"+(tr.p?sunAzQ(tr.p):0),top,ch);
  const paint=(g,wx0,wy0)=>{
    GROUND_BAKING=true;
    try{
      GLAZE_PASS="form";
      drawGround(tr,wx0,wy0,fill,line,pal);drawRocks(tr,wx0,wy0,pal);
      glazeGround(tr,wx0,wy0,pal);
      GLAZE_PASS="hue";
      drawGround(tr,wx0,wy0,fill,line,pal);drawRocks(tr,wx0,wy0,pal);
    }finally{GROUND_BAKING=false;GLAZE_PASS="";}
  };
  const K=G.viewK||1,k0=Math.floor(camx/CHUNK_W),k1=Math.floor((camx+W)/CHUNK_W);
  for(let k=k0;k<=k1;k++){
    const cn=chunkAt(tr.chunks,k,paint);
    gpuImage(pass,cn,[{x:(k*CHUNK_W-camx+CHUNK_W/2)*K,y:(top-camy+ch/2)*K,w:CHUNK_W*K,h:ch*K}]);
  }
  const HT=surfHeightTex(tr),U=GSG;U.fill(0);
  U[0]=camx;U[1]=camy;U[4]=tr.step;U[5]=tr.N;U[6]=HT.mid;
  U[8]=SUN_DIR.x;U[9]=SUN_DIR.y;U[10]=tr.p?dayK(tr.p):.6;U[11]=1;
  /* цвета света по светлоте единицы: оттенок, а не затемнение */
  const lu=c=>Math.max(1,.3*c[0]+.59*c[1]+.11*c[2]);
  const sc=starRGB(),am=tr.p?ambRGB(tr.p):[150,170,200],ls=lu(sc),la=lu(am);
  U[12]=sc[0]/ls;U[13]=sc[1]/ls;U[14]=sc[2]/ls;
  U[16]=am[0]/la;U[17]=am[1]/la;U[18]=am[2]/la;
  gpuField(pass,"sground",GSG_WGSL,U,[HT],{blend:"mul"});
  SURF_P2=pass;
  /* трава живая — кланяется ветру, остаётся 2D поверх */
  drawGroundGrass(tr,camx,camy);
  return true;
}

/* нижняя треть уходит в тень неба (хвост G2) — тем же градиентом, что 2D в 21e1,
   но в проходе грунта: иначе полупрозрачная заливка на #c отбрасывала бы тень */
const GSS_WGSL=`
fn field(p:vec2f,uv:vec2f)->vec4f{
  let y0=fu.v[0].x;let a=.30*clamp((p.y-y0)/max(fu.res.w-y0,1.),0.,1.);
  return vec4f(fu.v[1].rgb*a,a);
}`;
const GSS=new Float32Array(8);
function surfShadeGpu(p){
  const pass=GPU.overPass;if(!pass)return false;
  const sh=p.T.sky[1];
  GSS[0]=H*(SURF_HOR+.04);GSS[4]=sh[0]/255;GSS[5]=sh[1]/255;GSS[6]=sh[2]/255;
  gpuField(pass,"sshade",GSS_WGSL,GSS,[]);
  return true;
}

/* ══════════════ падающие тени того, что стоит ══════════════
   Всё, что стоит на земле (находки, формы, постройки, посёлок, корабль, кусты,
   звери, астронавт), уже лежит на #c. Его копия (выгрузка без склейки — третий
   gpuOver пустил бы весь мир через «огни 2D» и зажёг бы кусты) становится
   картой заслонов, а тень кладётся в ещё открытый проход грунта — ПОД 2D: для точки грунта на глубине d под кромкой заслон
   ищется на высоте t = d/B над кромкой, со сдвигом t·A от звезды — силуэт
   ложится на полосу земли сплющенным и скошенным, длиннее к закату. Полутень
   растёт с высотой заслона (семь выборок), тень холодная — цвет неба, а не
   чёрный, и на сами предметы не ложится: они нарисованы поверх. Слабые полупрозрачные пятна (ореолы,
   контактные тени) не заслоняют: порог по альфе. */
const GSC_WGSL=`
fn scH(i:i32)->f32{
  let n=i32(fu.v[1].y);let t=textureLoad(t0,vec2i(clamp(i,0,n-1),2),0);
  return fu.v[1].z+((t.r*255.*256.+t.g*255.)/8.-4096.);}
fn scEdge(x:f32)->vec2f{
  let st=fu.v[1].x;let fi=clamp((x+fu.v[0].x)/st,0.,fu.v[1].y-1.001);
  let i=i32(floor(fi));let f=fi-floor(fi);let h0=scH(i);let h1=scH(i+1);
  return vec2f(mix(h0,h1,f)-fu.v[0].y,(h1-h0)/st);}
fn scOcc(q:vec2f)->f32{
  let a=textureSampleLevel(t1,smp,q/fu.res.zw,0.).a;
  return smoothstep(.35,.8,a)*step(0.,q.x)*step(q.x,fu.res.z)*step(0.,q.y);}
fn field(p:vec2f,uv:vec2f)->vec4f{
  let V=fu.v;let e=scEdge(p.x);
  let px=fu.res.z/fu.res.x;let dd=p.y-e.x;
  let cov=clamp(dd/(px*sqrt(1.+e.y*e.y))+.5,0.,1.);
  if(cov<=0.){return vec4f(0.);}
  let A=V[2].x;let B=V[2].y;
  let t=max(dd,0.)/B;
  if(t<2.5||t>V[2].w){return vec4f(0.);}
  let x1=p.x-t*A;let e1=scEdge(x1).x;
  let r=.8+t*.03;
  var s=scOcc(vec2f(x1,e1-t))*2.;
  s=s+scOcc(vec2f(x1-r,e1-t))+scOcc(vec2f(x1+r,e1-t));
  s=s+scOcc(vec2f(x1-r*2.,e1-t+r))+scOcc(vec2f(x1+r*2.,e1-t-r));
  s=s+scOcc(vec2f(x1,e1-t-r*1.5))+scOcc(vec2f(x1,e1-t+r*1.5));
  s=s/8.;
  /* у основания тень гуще, к концу бледнеет: свет обходит края */
  s=s*V[2].z*(1.-smoothstep(V[2].w*.35,V[2].w,t));
  let m=mix(vec3f(1.),V[3].rgb,clamp(s,0.,1.));
  return vec4f(m*cov,cov);
}`;
const GSC=new Float32Array(16);
let SURF_SHADOW=null,SURF_P2=null;
function surfCastGpu(tr,p,camx,camy){
  /* только в проходе грунта этого кадра: если между ним и нами кто-то открыл
     свой слой, тень легла бы поверх предметов */
  const pass=GPU.overPass;
  if(!GPU.on||!pass||pass!==SURF_P2||!tr.farH)return false;
  const day=dayK(p);if(day<.05)return false;
  if(GPU.cState===0)return false;           /* на #c ничего не стоит — заслонять нечему */
  /* снимок #c — очередью, сейчас: тень рисуется позже, при отправке кадра, а к тому
     времени #c дорисован подписями и погодой */
  const d=GPU.dev,U=GPUTextureUsage;
  if(!SURF_SHADOW||SURF_SHADOW.dev!==d||SURF_SHADOW.w!==GPU.bw||SURF_SHADOW.h!==GPU.bh){
    if(SURF_SHADOW&&SURF_SHADOW.dev===d)GPU.trash.push(SURF_SHADOW.tex);
    const tex=d.createTexture({size:[GPU.bw,GPU.bh],format:"rgba8unorm",usage:U.TEXTURE_BINDING|U.COPY_DST|U.RENDER_ATTACHMENT});
    SURF_SHADOW={dev:d,w:GPU.bw,h:GPU.bh,tex,view:tex.createView()};
  }
  d.queue.copyExternalImageToTexture({source:cvs},{texture:SURF_SHADOW.tex,premultipliedAlpha:true},[GPU.bw,GPU.bh]);
  const HT=surfHeightTex(tr),F=GSC;F.fill(0);
  F[0]=camx;F[1]=camy;F[4]=tr.step;F[5]=tr.N;F[6]=HT.mid;
  /* звезда низко — тень длинная; сдвиг от звезды, сплющенная полоса земли */
  const sx=SUN_DIR.x,sy=Math.min(-.12,SUN_DIR.y);
  F[8]=clamp(-sx/-sy,-4.5,4.5)*.9;F[9]=.45;
  const lu=c=>Math.max(1,.3*c[0]+.59*c[1]+.11*c[2]),sc=starRGB();
  const vac=p.T.atm==="отсутствует";
  F[10]=clamp(day*1.4,0,1)*(vac?.78:.62)*clamp(lu(sc)/150,0,1);F[11]=260;
  const am=ambRGB(p),la=lu(am);
  F[12]=am[0]/la*.42;F[13]=am[1]/la*.42;F[14]=am[2]/la*.42;
  gpuField(pass,"scast",GSC_WGSL,F,[HT,SURF_SHADOW],{blend:"mul"});
  return true;
}
