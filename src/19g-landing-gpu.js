/* ══════════════ посадка на видеокарте (G6, флот «landing») ══════════════
   Воздух заморожен (G5): небо, облака, дымка и погода остаются, как их оставил
   автор, и зовутся как есть. Здесь — тела кадра посадки:
   · дальние гряды — одно поле: силуэт по той же высоте рельефа, что и раньше,
     но с формой (склон к звезде светлее, от неё — в воздух), с зерном породы и
     с подошвой, что тонет в цвете воздуха. Лежит ПОВЕРХ небесных тел и облаков
     (они 2D) — отсюда свой gpuOver; дымка у горизонта ложится уже поверх гряд.
   Высота рельефа уходит на видеокарту один раз на заход: текстура N×1 (h−hMin). */

/* ── высота рельефа текстурой ── одна на заход: сменился рельеф — старая в корзину */
let LG_H=null;
function lgHTex(tr){
  if(!GPU.dev||!tr||!tr.h)return null;
  if(LG_H&&LG_H.tr===tr&&LG_H.dev===GPU.dev)return LG_H;
  if(LG_H&&LG_H.dev===GPU.dev)GPU.trash.push(LG_H.tex);
  const N=tr.N;let a=1e9;for(let i=0;i<N;i++)if(tr.h[i]<a)a=tr.h[i];
  const D=new Uint16Array(N*4),one=f16(1);
  for(let i=0;i<N;i++){D[i*4]=f16(tr.h[i]-a);D[i*4+3]=one;}
  const tex=GPU.dev.createTexture({size:[N,1],format:"rgba16float",
    usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});
  GPU.dev.queue.writeTexture({texture:tex},D,{bytesPerRow:N*8},[N,1]);
  LG_H={tr,dev:GPU.dev,tex,view:tex.createView(),hMin:a};
  return LG_H;
}
/* «rgb(a,b,c)» → [a,b,c]/255: hazeFar отдаёт строку для 2D */
function lgRGB(s,U,k){const m=String(s).match(/[\d.]+/g)||[0,0,0];U[k]=+m[0]/255;U[k+1]=+m[1]/255;U[k+2]=+m[2]/255;}

/* шум и высота — общие для полей посадки */
const LG_WGSL_NOISE=`
fn lgh(p:vec2f)->f32{var q=fract(vec3f(p.xyx)*.1031);q=q+dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
fn lgn(p:vec2f)->f32{let i=floor(p);let f=fract(p);let w=f*f*(3.-2.*f);
  return mix(mix(lgh(i),lgh(i+vec2f(1.,0.)),w.x),mix(lgh(i+vec2f(0.,1.)),lgh(i+vec2f(1.,1.)),w.x),w.y);}
fn lgf(p:vec2f)->f32{return lgn(p)*.55+lgn(p*2.03+vec2f(5.2,1.3))*.28+lgn(p*4.1+vec2f(1.7,9.2))*.17;}
/* высота рельефа по дробному индексу: t0.r = h−hMin, линейная выборка */
fn lgH(i:f32)->f32{let n=f32(textureDimensions(t0).x);return textureSampleLevel(t0,smp,vec2f((i+.5)/n,.5),0.).r;}
`;

/* ── дальние гряды ──
   V0/V1 — гряда A (дальняя) и B: сдвиг камеры, подъём (hMin−f), шаг, доля воздуха;
   V2/V3 — их цвет (hazeFar); V4 — к звезде (x,y), дневной ключ, низкое солнце;
   V5 — воздух (rgb), есть ли атмосфера; V6 — цвет звезды; V7 — H, время, наклон пластов */
const LG_RIDGE_WGSL=LG_WGSL_NOISE+`
fn lgRidge(p:vec2f,R:vec4f,col:vec3f,det:f32)->vec4f{
  let V=fu.v;let fi=(p.x+R.x)/R.z;
  let top=lgH(fi)+R.y;let d=p.y-top;
  let cov=clamp(d+.5,0.,1.);
  if(cov<=0.){return vec4f(0.);}
  /* форма: нормаль склона по перепаду высоты, свет — от той же звезды, что у грунта */
  let s=(lgH(fi+.7)-lgH(fi-.7))/(1.4*R.z);
  let n=normalize(vec2f(s,-1.));let ndl=dot(n,V[4].xy);
  /* ночью склоны не гаснут в одну заливку: остаётся свет неба, а с ним и форма */
  var sh=(ndl-.6)*.55*max(V[4].z,.45);
  /* порода: пятна, промоины и пласты, привязанные к гряде (её x и глубина под
     кромкой) — едут с параллаксом вместе с силуэтом, а не плывут по экрану */
  let wx=fi*R.z;
  let g=lgf(vec2f(wx/30.,d/12.))-.5;
  /* промоины сбегают от гребня по линии падения: шум, вытянутый вдоль склона
     крупного масштаба (левый скат клонит их влево, правый — вправо), сильнее у кромки */
  let ss=clamp((lgH(fi+7.)-lgH(fi-7.))/(14.*R.z),-1.2,1.2);
  let gl=lgf(vec2f((wx-d*ss*.9)/9.,d/55.))-.5;
  let band=lgn(vec2f(wx/260.,(d+top*.35+wx*V[7].z)/6.))-.5;
  sh=sh+(g*.34+gl*.30*exp(-d/(V[7].x*.11))+band*.14)*det;
  var c=col*(1.+sh);
  /* подошва тонет в воздухе: чем ниже под кромкой, тем толще слой воздуха
     между глазом и склоном — дальнее уходит в цвет неба, а не в чёрный */
  let sk=clamp(d/(V[7].x*.20),0.,1.);
  c=mix(c,V[5].rgb,sk*(.25+.35*sk)*R.w*V[5].w);
  /* нить света по кромке, повёрнутой к низкому солнцу */
  c=c+V[6].rgb*exp(-d/1.3)*max(ndl,0.)*V[4].w*.32;
  return vec4f(c*cov,cov);
}
fn field(p:vec2f,uv:vec2f)->vec4f{
  let V=fu.v;
  let b=lgRidge(p,V[1],V[3].rgb,.8);
  if(b.a>=1.){return b;}
  let a=lgRidge(p,V[0],V[2].rgb,.5);
  return b+a*(1.-b.a);
}`;
const LGR=new Float32Array(60);
/* гряды одним полем; false — видеокарты нет (Node, стенд без кадра): тогда их нет вовсе */
function lgRidges(p,tr,camx,fA,fB){
  const T=lgHTex(tr);if(!T)return false;
  const pass=gpuOver();if(!pass)return false;
  const U=LGR,D=skyDay(p),air=p.T.atm!=="отсутствует",sun=starRGB();
  const cel=(typeof celSun==="function")?celSun(p):{alt:.7};
  const day=clamp(1+cel.alt*2.2,0,1);
  U[0]=camx*.26;U[1]=T.hMin-fA;U[2]=tr.step*3.6;U[3]=1;
  U[4]=camx*.4; U[5]=T.hMin-fB;U[6]=tr.step*2.4;U[7]=.6;
  lgRGB(hazeFar(p,.58),U,8);lgRGB(hazeFar(p,.32),U,12);
  U[16]=SUN_DIR.x;U[17]=SUN_DIR.y;U[18]=dayK(p);
  U[19]=(cel.alt>-.08)?clamp(1-Math.abs(cel.alt)*1.4,0,1)*day:0;
  for(let i=0;i<3;i++){U[20+i]=lerp(D.bot[i],D.top[i],.5)/255;U[24+i]=sun[i]/255;}
  U[23]=air?1:0;
  U[28]=H;U[29]=G.t;U[30]=(((p.seed|0)>>>3)%9-4)*.03;
  gpuField(pass,"lg.ridge",LG_RIDGE_WGSL,U,[{view:T.view}]);
  return true;
}
