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
  /* кромка, поймавшая свет: тонкая, со стороны звезды */
  let rim=exp(-max(dd,0.)/(1.3*px+.6))*smoothstep(.35,.9,lit)*(.10+.12*day)*(1.-k*.6);
  c=c+V[6].rgb*rim;
  /* зерно в мире слоя — едет вместе с грядой */
  c=c*(1.+(srk(floor(vec2f(wx,p.y+o.y)/max(px,.5)))-.5)*.035);
  return vec4f(c*cov,cov)+ink*(1.-cov);
}
fn field(p:vec2f,uv:vec2f)->vec4f{
  let V=fu.v;
  /* ближняя гряда (B) поверх дальней (A): сначала B, под ней — A */
  let b=srLayer(p,1,V[1],V[3].rgb,V[3].w,1.,vec4f(0.));
  if(b.a>=.999){return b;}
  let a=srLayer(p,0,V[0],V[2].rgb,V[2].w,.7,vec4f(0.));
  return b+a*(1.-b.a);
}`;
const SRG_RGB=s=>{const m=String(s).match(/\d+(\.\d+)?/g)||[0,0,0];return [+m[0]/255,+m[1]/255,+m[2]/255];};
/* текстура высот: строки 0, 1 — дальние гряды, 2 — ближний грунт. Середина — mid ближнего */
function surfHeightTex(tr){
  const d=GPU.dev,N=tr.N,key=tr.farK+"|"+N;
  if(tr._gpuH&&tr._gpuH.dev===d&&tr._gpuH.key===key)return tr._gpuH;
  if(tr._gpuH&&tr._gpuH.dev===d)GPU.trash.push(tr._gpuH.tex);
  let s=0;for(let i=0;i<N;i++)s+=tr.h[i];
  const mid=Math.round(s/N),b=new Uint8Array(N*4*3);
  const rows=[tr.farH[0],tr.farH[1],tr.h];
  for(let r=0;r<3;r++)for(let i=0;i<N;i++){
    const v=clamp(Math.round((rows[r][i]-mid+4096)*8),0,65535),o=(r*N+i)*4;
    b[o]=v>>8;b[o+1]=v&255;b[o+2]=0;b[o+3]=255;
  }
  const U=GPUTextureUsage,tex=d.createTexture({size:[N,3],format:"rgba8unorm",usage:U.TEXTURE_BINDING|U.COPY_DST});
  d.queue.writeTexture({texture:tex},b,{bytesPerRow:N*4},[N,3]);
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
  return vec4f(vec3f(m*cov),cov);
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
  gpuField(pass,"sground",GSG_WGSL,U,[HT],{blend:"mul"});
  /* трава живая — кланяется ветру, остаётся 2D поверх */
  drawGroundGrass(tr,camx,camy);
  return true;
}
