/* ══════════════ посадка на видеокарте (G6, флот «landing») ══════════════
   Воздух заморожен (G5): небо, облака, дымка и погода остаются, как их оставил
   автор, и зовутся как есть. Здесь — тела кадра посадки:
   · дальние гряды — одно поле: силуэт по той же высоте рельефа, что и раньше,
     но с формой (склон к звезде светлее, от неё — в воздух), с зерном породы и
     с подошвой, что тонет в цвете воздуха. Лежит ПОВЕРХ небесных тел и облаков
     (они 2D) — отсюда свой gpuOver; дымка у горизонта ложится уже поверх гряд.
   · под кораблём — второй gpuOver, после площадки: тень корабля ложится на
     рельеф от звезды и растёт, темнеет и собирается, пока он садится; факел
     тормозных сопел светит на грунт тёплым светом, умножая его собственный цвет.
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

/* ── под кораблём: тень от звезды, тень неба у самой земли, свет факела ──
   Смесь mul: ответ (L·(1−s), s) даёт dst·(1−s)·(1+L) — тень гасит, свет факела
   умножает собственный цвет грунта, а не кладёт поверх оранжевое пятно.
   V0 — сдвиг камеры по x, (hMin − camy), шаг рельефа, время; V1 — тень: центр x,
   полуширина, размытие, сила; V2 — тень неба: центр x, полуширина, сила, толщина
   тени по вертикали; V3 — факел: x, y, сила, радиус; V4 — его цвет */
const LG_UNDER_WGSL=LG_WGSL_NOISE+`
fn field(p:vec2f,uv:vec2f)->vec4f{
  let V=fu.v;
  let yt=lgH((p.x+V[0].x)/V[0].z)+V[0].y;
  let d=p.y-yt;
  let on=clamp(d+1.,0.,1.);
  /* тень — эллипс на плоскости земли, увиденной вскользь: верх разреза и есть
     эта плоскость, глубина под кромкой — её даль. Эллипс идёт по кромке рельефа,
     а не по прямой, и к глубине сужается, а не обрывается отвесной стенкой */
  let dd=max(d-1.,0.);
  let ex=(p.x-V[1].x)/V[1].y;let ey=dd/V[2].w;let e=sqrt(ex*ex+ey*ey);
  let sn=clamp(V[1].z/V[1].y,.06,.9);
  let s1=V[1].w*(1.-smoothstep(1.-sn,1.+sn,e))*on;
  /* тень неба: тесный тёмный эллипс под самым брюхом */
  let ax=(p.x-V[2].x)/V[2].y;let ay=dd/5.;
  let s2=V[2].z*(1.-smoothstep(.55,1.08,sqrt(ax*ax+ay*ay)))*on;
  let s=1.-(1.-s1)*(1.-s2);
  /* факел: точечный источник над грунтом, освещённость ~ 1/(1+r²/R²) и косинус
     падения на лицо земли; дрожит плавно, шумом времени, а не мельканием */
  var L=vec3f(0.);
  if(V[3].z>.002){
    let v=p-V[3].xy;let r2=dot(v,v);
    let inc=clamp(v.y/sqrt(r2+1.),0.,1.);
    let fl=.9+.25*(lgn(vec2f(V[0].w*.21,3.7))-.5)+.12*(lgn(vec2f(V[0].w*.83,9.1))-.5);
    let I=V[3].z*fl/(1.+r2/(V[3].w*V[3].w));
    /* лицо земли — вскользь, у кромки ярче; над землёй — пыль и воздух чуть светятся */
    let g=I*(.35+.65*inc)*exp(-max(d,0.)/15.)*on;
    let a=I*.16*exp(min(d,0.)/34.)*(1.-on);
    L=V[4].rgb*(g+a);
  }
  return vec4f(L*(1.-s),s);
}`;
const LGU=new Float32Array(60);
let LG_FIRE=0;   /* сглаженная тяга для света факела — эфемерное, не в G и не в сейве */
/* тень и свет под кораблём одним полем; false — видеокарты нет */
function lgUnder(L,tr,camx,camy,p){
  const T=lgHTex(tr);if(!T)return false;
  const pass=gpuOver();if(!pass)return false;
  const U=LGU,len=landerLen(G.shipId),half=len*.5,air=p.T.atm!=="отсутствует";
  const lx=L.x-camx,ly=L.y-camy,gy=groundAt(tr,L.x)-camy,alt=Math.max(0,gy-ly-LAND_GY);
  LG_FIRE=lerp(LG_FIRE,(L.thrOn&&L.over<=0)?1:0,.22);
  const SS=sunSpot(p),cel=(typeof celSun==="function")?celSun(p):{alt:.7};
  const day=clamp(1+cel.alt*2.2,0,1),sunK=SS.up?day:0;
  const wp=(typeof weatherPower==="function")?weatherPower(p):0;
  const low=clamp(1-Math.abs(SUN_DIR.y),0,1),aN=clamp(alt/620,0,1);
  /* тень падает от звезды: луч от корпуса вниз, прочь от неё; у низкого солнца —
     дальше и длиннее. Стоящему кораблю — сдвиг от его собственной высоты */
  const shift=clamp(SUN_DIR.x/Math.min(-.2,SUN_DIR.y)*alt,-2.5*len,2.5*len)
    -SUN_DIR.x*half*(.35+low*1.6);
  U[0]=camx;U[1]=T.hMin-camy;U[2]=tr.step;U[3]=G.t;
  /* растёт навстречу: высоко — узкое бледное пятно, у земли — корпус целиком */
  U[4]=lx+shift;U[5]=half*(.95+low*.5)*(.55+.45*(1-aN));
  U[6]=2.5+alt*.07+(air?wp*18:0);
  U[7]=(air?.58:.74)*(1-aN*.8)*sunK*(1-.6*wp);
  /* тень неба: под брюхом у самой земли темно в любой час — небо заслонено */
  U[8]=lx;U[9]=half*.95;U[10]=(air?.40:.50)*clamp(1-alt/70,0,1);U[11]=16+alt*.04;
  const lvl=1+(G.mods.engine||0)*.22;
  /* днём звезда перекрывает факел: свет его виден в сумерки и ночью, а в полдень
     тень под кораблём главнее */
  U[12]=lx-Math.sin(L.a)*6;U[13]=ly+Math.cos(L.a)*(LAND_GY+4);U[14]=LG_FIRE*lvl*1.7*(1-.62*dayK(p));U[15]=40;
  U[16]=1;U[17]=.63;U[18]=.34;
  gpuField(pass,"lg.under",LG_UNDER_WGSL,U,[{view:T.view}],{blend:"mul"});
  /* марево под соплами — последний проход гнёт кадр под струёй (L4) */
  if(LG_FIRE>.05)gpuHaze(U[12],U[13],Math.sin(L.a),Math.cos(L.a),34+alt*.2,12,.9*LG_FIRE);
  return true;
}
