/* ══════════════ посадка на видеокарте (G6, флот «landing») ══════════════
   Воздух заморожен (G5): небо, облака, дымка и погода остаются, как их оставил
   автор, и зовутся как есть. Здесь — тела кадра посадки:
   · дальние гряды — одно поле: силуэт по той же высоте рельефа, что и раньше,
     но с формой (склон к звезде светлее, от неё — в воздух), с зерном породы и
     с подошвой, что тонет в цвете воздуха. Лежит ПОВЕРХ небесных тел и облаков
     (они 2D) — отсюда свой gpuOver; дымка у горизонта ложится уже поверх гряд.
   · под кораблём — второй gpuOver, после грунта: сам срез получает зерно и форму
     (бугры породы под звездой, выпуклые гребни, тёплая кожа освещённого склона,
     холод в глубине — та же лепка, что у поверхности, 21e2), тень корабля ложится
     на рельеф от звезды и растёт, темнеет и собирается, пока он садится; факел
     тормозных сопел светит на грунт тёплым светом, умножая его собственный цвет.
   · сам корабль — выпечка тела (drawLander в режиме bake, 08ca gpuBake) на ключ
     позы, и поле, которое кладёт на неё свет мира по рельефу маски: небо сверху,
     звезда со своей стороны с каймой, отсвет земли снизу, факел на брюхо;
     тлеющие сопла и маяк светят сами. Факелы и дым — 2D поверх (live).
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

/* ── под кораблём: лепка среза, тень от звезды, тень неба у самой земли, свет факела ──
   Смесь mul с альфой 1: ответ M даёт dst·M, где M = лепка·(1−s)·(1+L) — тень гасит,
   свет факела умножает собственный цвет грунта, а не кладёт поверх оранжевое пятно.
   V0 — сдвиг камеры по x, (hMin − camy), шаг рельефа, время; V1 — тень: центр x,
   полуширина, размытие, сила; V2 — тень неба: центр x, полуширина, сила, толщина
   тени по вертикали; V3 — факел: x, y, сила, радиус; V4 — его цвет; V5 — свет
   люка: x, y, сила, радиус; V6 — к звезде (x,y), дневной ключ, сила лепки;
   V7 — тон звезды, V8 — тон неба (оба по светлоте единицы) и сдвиг камеры по y */
const LG_UNDER_WGSL=LG_WGSL_NOISE+`
/* высота по целому индексу, без фильтра: для кривизны профиля */
fn lgHi(i:i32)->f32{let n=i32(textureDimensions(t0).x);return textureLoad(t0,vec2i(clamp(i,0,n-1),0),0).r;}
/* бугры породы: две октавы, крупная вытянута вдоль пластов */
fn lgBump(w:vec2f)->f32{return lgn(w*vec2f(.045,.08))*.65+lgn(w*.19+vec2f(7.,3.))*.35;}
/* лепка среза (рецепт поверхности, 21e2, чуть тише — с высоты захода мельче): бугры
   под звездой, гаснущие с глубиной;
   выпуклый гребень светлее, ложбина темнее; зерно в пиксель в координатах мира;
   тёплая кожа склона к звезде и холод неба в глубине. Ответ — множитель цвета.
   Нормаль склона — (s,−1): профиль растёт вниз, и лицо, сходящее вправо, смотрит
   вправо-вверх. litRGB (19c) берёт (−s,−1) — зеркально; см. docs/fleet/landing.md */
fn lgForm(p:vec2f,d:f32,fi:f32)->vec3f{
  let V=fu.v;let sun=V[6].xy;let day=V[6].z;let str=V[6].w;
  let w=vec2f(fi*V[0].z,p.y+V[8].w);
  let e=1.6;let b0=lgBump(w);
  let gx=(lgBump(w+vec2f(e,0.))-b0)/e;let gy=(lgBump(w+vec2f(0.,e))-b0)/e;
  let nr=normalize(vec3f(-gx*9.,-gy*9.,1.));let L=normalize(vec3f(sun,.75));
  let sh=dot(nr,L)/L.z-1.;
  let deep=exp(-max(d,0.)/190.);
  var m=1.+clamp(sh,-.6,.6)*.24*str*(.3+.7*day)*deep;
  let i=i32(floor(fi));let f=fi-floor(fi);
  let h0=lgHi(i);let h1=lgHi(i+1);
  let cv=mix(lgHi(i-1)+h1-2.*h0,h0+lgHi(i+2)-2.*h1,f)/V[0].z;
  m=m*(1.+clamp(cv,-1.,1.)*.20*exp(-max(d,0.)/36.)*(.4+.6*day));
  let px=fu.res.z/fu.res.x;
  m=m*(1.+(lgh(floor(w/max(px,.5)))-.5)*.07);
  let s=(h1-h0)/V[0].z;let nl=sqrt(1.+s*s);
  let lit=clamp(dot(vec2f(s,-1.)/nl,sun),0.,1.);
  let band=exp(-max(d,0.)/26.)*pow(lit,1.2)*day;
  var mc=vec3f(m)*(vec3f(1.)+V[7].rgb*band*.34);
  mc=mc*mix(vec3f(1.),V[8].rgb,smoothstep(14.,240.,d)*.34);
  return mc;
}
fn field(p:vec2f,uv:vec2f)->vec4f{
  let V=fu.v;
  let fi=(p.x+V[0].x)/V[0].z;
  let yt=lgH(fi)+V[0].y;
  let d=p.y-yt;
  let on=clamp(d+.5,0.,1.);
  let form=mix(vec3f(1.),lgForm(p,d,fi),on*step(.5,V[6].w));
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
  /* свет из люка ложится на грунт у трапа: сплюснутое тёплое пятно (V5) */
  if(V[5].z>.002){
    let hv=(p-V[5].xy)/vec2f(V[5].w,V[5].w*.3);
    L=L+vec3f(1.,.72,.45)*V[5].z*exp(-dot(hv,hv)*2.2)*on;
  }
  return vec4f(form*(1.-s)*(1.+L),1.);
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
  /* люк открыт после посадки: трап сходит вперёд-вправо, свет — к его пяте */
  const landed=L.over>0&&L.ok;
  U[20]=lx+(-half*.06+len*.46)-6;U[21]=gy+1;U[22]=landed?.55*(1-.6*dayK(p))*clamp(L.gear,0,1):0;U[23]=len*.28;
  /* лепка среза: только у грунта с материалом (ломти), как у поверхности */
  U[24]=SUN_DIR.x;U[25]=SUN_DIR.y;U[26]=dayK(p);U[27]=tr.mat?1:0;
  const lu=c=>Math.max(1,.3*c[0]+.59*c[1]+.11*c[2]);
  const sc=starRGB(),am=ambRGB(p),ls=lu(sc),la=lu(am);
  U[28]=sc[0]/ls;U[29]=sc[1]/ls;U[30]=sc[2]/ls;
  U[32]=am[0]/la;U[33]=am[1]/la;U[34]=am[2]/la;U[35]=camy;
  gpuField(pass,"lg.under",LG_UNDER_WGSL,U,[{view:T.view}],{blend:"mul"});
  /* марево под соплами — последний проход гнёт кадр под струёй (L4) */
  if(LG_FIRE>.05)gpuHaze(U[12],U[13],Math.sin(L.a),Math.cos(L.a),34+alt*.2,12,.9*LG_FIRE);
  return true;
}

/* ── корабль: выпечка тела и свет мира на ней ──
   Тело печётся в своих осях (после поворота на L.a, до внутреннего кивка носа —
   он в выпечке): поле кадра поворачивает пиксель обратно и читает маску.
   Рельеф — перепад альфы на двух масштабах: резкий даёт кромку, широкий — округлость
   борта. Свет — как у грунта (litRGB, 19c): заполнение небом k·amb, прямой
   pow(n·l,.72)·df цветом звезды; плюс отсвет земли снизу и факел на брюхо.
   V0 — центр (экран), полуразмер E, сдвиг центра выпечки по y; V1 — cos/sin L.a,
   cos/sin кивка; V2 — к звезде в осях корабля, df, ambK; V3 — звезда, усиление;
   V4 — небо; V5 — отсвет земли; V6 — факел (оси корабля), сила, радиус; V7 — его
   цвет; V8 — сопло 1 (оси кивка), шаг до второго, радиус; V9 — жар сопел, маяк x,y,
   сила; V10 — проём люка (оси кивка); V11 — свет люка, тексель, уровень мипа */
const LG_LANDER_WGSL=`
fn lgA(uv:vec2f)->f32{if(any(uv<vec2f(0.))||any(uv>vec2f(1.))){return 0.;}return textureSampleLevel(t0,smp,uv,0.).a;}
fn lgG(uv:vec2f,d:f32)->vec2f{return vec2f(lgA(uv+vec2f(d,0.))-lgA(uv-vec2f(d,0.)),lgA(uv+vec2f(0.,d))-lgA(uv-vec2f(0.,d)));}
fn field(p:vec2f,uv0:vec2f)->vec4f{
  let V=fu.v;let dp=p-V[0].xy;let E=V[0].z;
  let q=vec2f(dp.x*V[1].x+dp.y*V[1].y,-dp.x*V[1].y+dp.y*V[1].x);
  if(abs(q.x)>E*1.25||abs(q.y-V[0].w)>E*1.25){return vec4f(0.);}
  let qi=vec2f(q.x*V[1].z+q.y*V[1].w,-q.x*V[1].w+q.y*V[1].z);
  /* светит само: тлеющие сопла, маяк, зарево факела под брюхом */
  var em=vec3f(0.);
  if(V[9].x>.02){
    for(var i=0;i<2;i++){
      let r=length(qi-vec2f(V[8].x+f32(i)*V[8].z,V[8].y));
      let f=max(1.-r/(V[8].w*2.2),0.);
      em=em+vec3f(1.,.59,.31)*V[9].x*.5*f*f;}
  }
  if(V[9].w>.01){
    let r=length(qi-V[9].yz);
    em=em+vec3f(1.,.47,.35)*V[9].w*(smoothstep(2.8,1.4,r)*.95+.30*exp(-r*r/60.));
  }
  if(V[6].z>.002){
    let v=q-V[6].xy;
    em=em+V[7].rgb*V[6].z*.10*exp(-dot(v,v)/(V[6].w*V[6].w*.9));
  }
  let uv=(q-vec2f(0.,V[0].w))/(2.*E)+.5;
  var c4=vec4f(0.);
  if(all(uv>=vec2f(0.))&&all(uv<=vec2f(1.))){c4=textureSampleLevel(t0,smp,uv,V[11].z);}
  let a=c4.a;
  if(a<.004){return vec4f(em,0.);}
  let alb=c4.rgb/a;
  let tx=V[11].y;
  let g0=-lgG(uv,tx*1.2);let tl=clamp(length(g0)*.9,0.,.78);
  let gb=-(lgG(uv,tx*4.)*.5+lgG(uv,tx*10.)*.5);let tb=clamp(length(gb)*1.1,0.,.8);
  var n2=g0/max(length(g0),1e-4)*tl+gb/max(length(gb),1e-4)*tb*.45;
  n2=n2*min(1.,.96/max(length(n2),1e-4));
  let n=vec3f(n2,sqrt(max(1.-dot(n2,n2),.02)));
  let sd=V[2].xy;let Ls=normalize(vec3f(sd,.55));
  /* свет с обёрткой: стойки и киль тонкие, их нормали почти в сторону, и чистый
     ламберт в полдень гасил их в чёрное — обёртка оставляет им скользящий свет */
  let ndl=max((dot(n,Ls)+.3)/1.3,0.);
  /* небо сверху, земля снизу: верх борта светлее от неба, брюхо берёт цвет грунта */
  let sky=.62-.38*n.y;let bn=max(n.y,0.)*.7+.12;
  var li=V[4].rgb*V[2].w*sky+V[3].rgb*pow(ndl,.72)*V[2].z+V[5].rgb*bn;
  /* ночью корпус не тонет в фон: холодный пол света — звёзды и отсвет неба */
  li=li+vec3f(.13,.16,.22)*(1.-min(V[2].z*1.6,1.))*sky;
  if(V[6].z>.002){
    let v=V[6].xy-q;let r2=dot(v,v);
    let fd=max(dot(n,normalize(vec3f(v,5.))),0.);
    li=li+V[7].rgb*V[6].z/(1.+r2/(V[6].w*V[6].w))*(.25+.75*fd);
  }
  var c=alb*li*V[3].w;
  /* кайма: кромка, повёрнутая к звезде, горит узкой нитью её цвета */
  let rim=tl*pow(max(dot(n2/max(length(n2),1e-4),normalize(sd)),0.),2.)*V[2].z*.5;
  c=c+V[3].rgb*rim;
  /* проём люка светится своим светом и в полночь */
  if(V[11].x>.01&&qi.x>V[10].x&&qi.x<V[10].z&&qi.y>V[10].y&&qi.y<V[10].w){c=max(c,alb*V[11].x);}
  return vec4f(c*a+em,a);
}`;
const LG_BAKE=new Map();       /* ключ позы → выпечка тела */
const LG_E=100,LG_OY=-30;      /* полуразмер выпечки и сдвиг её центра (нос, киль, трап влезают) */
const LGL=new Float32Array(60);
/* тело корабля на ключ позы: стойки, просадка, трап, поломка; ступени грубые —
   перепечка редкая (выпуск стоек — восемь, отдача — шестнадцать ступеней) */
function lgLanderBake(L,tr,dk){
  const h=hullOf(G.shipId),len=landerLen(G.shipId),half=len*.5;
  const gear=Math.round(clamp(L.gear||0,0,1)*8)/8,sq=Math.round(clamp(L.sq||0,-.25,1)*16)/16;
  const landed=L.over>0&&L.ok,broken=L.over>0&&!L.ok;
  const g0=groundAt(tr,L.x),gq=x=>Math.round(clamp(groundAt(tr,L.x+x)-g0,-9,9));
  /* вдвое плотнее экрана: кадр берёт мип чуть резче своего масштаба, и корпус не
     мылится на дробном сдвиге и повороте */
  const sb=lgLanderSb(dk);
  const key=G.shipId+"|"+[h.col,h.lite,h.dark,h.edge,h.body].join("/")+"|"+h.form+"|"+gear+"|"+sq+"|"+
    (landed?1:0)+(broken?1:0)+"|"+(gear>0?gq(-half*.42)+","+gq(-half*.1)+","+gq(half*.42):"")+
    (landed?"|"+gq(-half*.06+len*.46):"")+"|"+sb;
  let B=LG_BAKE.get(key);
  if(B&&B.dev===GPU.dev){LG_BAKE.delete(key);LG_BAKE.set(key,B);return B;}
  const side=Math.ceil(LG_E*2*sb);
  B=gpuBaked(LG_BAKE,key,side,side,g=>{
    g.setTransform(sb,0,0,sb,side/2,side/2-LG_OY*sb);
    drawLander(broken,false,{gear,sq,hot:0,landed,tr,gx:L.x,bake:true});
  });
  while(LG_BAKE.size>10){const k=LG_BAKE.keys().next().value;gpuBakeDrop(LG_BAKE.get(k));LG_BAKE.delete(k);}
  return B;
}
function lgLanderSb(dk){return Math.min(4,Math.max(1,Math.round(dk*2*4)/4));}
/* корабль в проход под ним (тот же сегмент gpuOver); false — видеокарты нет */
function lgLander(L,tr,camx,camy,p){
  const pass=GPU.overPass;if(!pass)return false;
  const dk=GPU.bw/W,B=lgLanderBake(L,tr,dk);if(!B)return false;
  const U=LGL,len=landerLen(G.shipId),half=len*.5,bodyH=len*.30;
  const sq=Math.round(clamp(L.sq||0,-.25,1)*16)/16,rin=-.05+sq*.12;
  const bY=LAND_GY-19+sq*4,tY=bY-bodyH;
  const ca=Math.cos(L.a),sa=Math.sin(L.a),ci=Math.cos(rin),si=Math.sin(rin);
  const sun=starRGB(),amb=ambRGB(p),SS=sunSpot(p);
  const df=SS.up?(.40+.58*dayK(p)):0;
  U[0]=L.x-camx;U[1]=L.y-camy;U[2]=LG_E;U[3]=LG_OY;
  U[4]=ca;U[5]=sa;U[6]=ci;U[7]=si;
  /* к звезде — в осях корабля: поворот SUN_DIR на −L.a */
  U[8]=SUN_DIR.x*ca+SUN_DIR.y*sa;U[9]=-SUN_DIR.x*sa+SUN_DIR.y*ca;U[10]=df;U[11]=ambK(p);
  /* глаз привыкает к свету своей звезды: белый корпус под оранжевым карликом —
     тёплый, но не лососевый. Тон звезды наполовину к белому, яркость та же */
  const sm=Math.max(1,sun[0],sun[1],sun[2]);
  for(let i=0;i<3;i++)U[12+i]=lerp(sun[i]/sm,1,.5)*sm/255;
  U[15]=1.25;
  U[16]=amb[0]/255;U[17]=amb[1]/255;U[18]=amb[2]/255;
  /* отсвет земли: цвет грунта под прямым светом, слабый */
  const gc=p.T.pal[2]||[120,110,100];
  for(let i=0;i<3;i++)U[20+i]=gc[i]/255*(.05+.16*df);
  /* факел: под брюхом, на оси среднего тормозного сопла, в осях корабля */
  const fx=-half*.05,fy=bY+bodyH*.30;
  const lvl=1+(G.mods.engine||0)*.22;
  U[24]=fx*ci-fy*si;U[25]=fx*si+fy*ci;U[26]=LG_FIRE*lvl*(1-.55*dayK(p));U[27]=half*.6;
  U[28]=1;U[29]=.64;U[30]=.36;
  const er=bodyH*.24;
  U[32]=-half*.80;U[33]=bY+bodyH*.02+er*.6;U[34]=er*1.7;U[35]=er;
  /* маяк — плавный огонь: разгорается и гаснет, а не щёлкает (закон «движение, не мигание») */
  const bk=clamp((Math.sin(G.t*.07)-.05)/.5,0,1);
  U[36]=L.hot||0;U[37]=half*.1;U[38]=tY-1.5;U[39]=bk*bk*(3-2*bk);
  const landed=L.over>0&&L.ok&&(L.gear||0)>.9;
  const hx=-half*.06,hw=len*.17;
  U[40]=hx-hw*.5+1.5;U[41]=tY+bodyH*.18+1.5;U[42]=hx+hw*.5-1.5;U[43]=bY-bodyH*.30-1.5;
  U[44]=landed?1.05:0;U[45]=1/(2*LG_E);U[46]=Math.max(0,Math.log2(lgLanderSb(dk)/dk)-.6);
  gpuField(pass,"lg.lander",LG_LANDER_WGSL,U,[B],{smp:gpuMipSmp()});
  return true;
}
