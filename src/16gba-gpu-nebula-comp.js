/* ══════════════ туманность системы: сведение и связка (разрез 16gb, M825) ══════════════
   Объём, шум и GNB_GEN — в 16gb-gpu-nebula.js; здесь — сведение в полном разрешении
   (GNB_FINE, поглощение в шейдере звезды, GNB_EMI), палитра, достопримечательность,
   пересчёт gpuNebulaGen и проход gpuNebulaComp. */
/* сведение в полном разрешении. Общая часть: мелкие гребни по течению (волокна и
   зерно), резкие края пыли */
const GNB_FINE=GNB_NOISE+GNB_TILE+`
fn fineT(p:vec2f,T0:f32)->f32{
  /* чистое небо: при T0≥.97 гребни не весят ничего, mix(T0,Ts,.2)·1.12 ≥ 1.09 — ровно 1 после clamp */
  if(T0>=.97){return 1.;}
  let H=fu.res.w;
  let qf=((p-fu.res.zw*.5)+fu.v[0].xy*.09)/H*7.+fu.v[0].w;
  let r=1.-abs(2.*fbt(qf*1.9+vec2f(gnt(qf*.7),gnt(qf*.7+3.3))*1.6,2)-1.);
  /* края полос чуть резче бикубики — но мягко: резкий край пыли автор видит лужей */
  let Ts=clamp((T0-.5)*1.7+.5,0.,1.);
  return clamp(mix(T0,Ts,.2)*mix(1.12,.86,r*r*(1.-smoothstep(.6,.97,T0))),0.,1.);}
fn fineE(p:vec2f)->f32{
  let H=fu.res.w;
  let qf=((p-fu.res.zw*.5)+fu.v[0].xy*.09)/H*9.+fu.v[0].w+vec2f(4.,9.);
  let wv=vec2f(gnt(qf*.45+fu.v[0].z),gnt(qf*.45+vec2f(5.,1.)))*2.2;
  let r=1.-abs(2.*fbt(qf+wv,2)-1.);
  return .5+.95*r*r;}${GNB_FIL}`;
/* поглощение — в шейдере звезды (P1 11/n): полноэкранный проход ABS умножал цель сцены, а под
   туманностью в ней только чёрная очистка и звёзды. Смешение «поверх» линейно по цвету, поэтому множитель на каждом
   пикселе звезды даёт то же, что множитель на экране, — и платится площадью звёзд.
   Звёзды — поверх газа, под пылью: общее плечо кадра сжимает слабую звезду на светлом
   газе в ноль, поэтому то, что за газом (почти одни звёзды — фон чёрный), поднято на
   его яркость. Прячет звёзды только пыль */
const GNB_STAR_ABS=GNB_FINE+`
struct FU{res:vec4f,v:array<vec4f,15>};
@group(0) @binding(2) var<uniform> fu:FU;
@group(0) @binding(3) var smp:sampler;
@group(0) @binding(4) var t0:texture_2d<f32>;
@group(0) @binding(5) var t1:texture_2d<f32>;
@fragment fn fs(i:VO)->@location(0) vec4f{
  let al=i.col.a*gspCov(i);
  let uv=i.p.xy/fu.res.xy;let p=uv*fu.res.zw;
  let g=texCubic(t0,smp,uv);
  let T=fineT(p,clamp(1.-g.a,0.,1.));
  let le=1.-exp(-max(g.r,max(g.g,g.b))*6.)+fu.v[1].w*.6;
  return vec4f(i.col.rgb*al*(pow(vec3f(T),vec3f(.72,1.,1.42))*(1.+2.6*le)),al);}`;
function gnbStars(pass,ub,sb){
  const P=gpuPipe("gnb.stars",GPU_PIPE_SRC["gnb.stars"]()[0]);
  const f=GNB.SU||(GNB.SU=new Float32Array(64));
  f[0]=GPU.bw;f[1]=GPU.bh;f[2]=W;f[3]=H;f.set(GNB.C.subarray(0,60),4);
  const nb=gpuBuf("gnb.su",256,GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST);GPU.dev.queue.writeBuffer(nb,0,f);
  pass.setPipeline(P);pass.setBindGroup(0,gpuBind("gnb.stars",P,[ub,sb,nb,GPU.S.lin,GNB.view,gnbNoiseTile()]));
  pass.draw(6,GSP.nStars*4);
}
/* V[0]: камера x,y, время, зерно · V[1]: звезда x,y, радиус/H, вкл · V[2]: цвет звезды, ширина тени ·
   V[3]: цвет теней · V[4..10]: планеты x,y,r (CSS px) — их тени */
const GNB_EMI=GNB_FINE+GNB_FGAL+`
fn field(p:vec2f,uv:vec2f)->vec4f{
  let H=fu.res.w;
  /* одна бикубика на пиксель: цвет, туман и цвет космоса читают её (было три — 12 выборок) */
  let g0=texCubic(t0,smp,uv);
  var c=max(g0.rgb,vec3f(0.));
  let l0=max(c.r,max(c.g,c.b));
  /* тон газа до волокон: тусклый газ окрашивает туман своим цветом */
  let gh0=c/max(l0,1e-4);
  /* волокна: гребни в полном разрешении режут тело газа */
  let body=smoothstep(.015,.14,l0);
  /* деталь — только где её вес не ноль: вне газа шум не считается */
  if(body>0.){c=c*mix(1.,fineE(p),body*.85);}${GNB_FILC}${GNB_FARC}
  /* фронт ионизации: где газ густеет прочь от звезды — это его кромка к звезде */
  let ts=1./vec2f(textureDimensions(t0));
  let lx=textureSampleLevel(t0,smp,uv+vec2f(ts.x*1.5,0.),0.).rgb-textureSampleLevel(t0,smp,uv-vec2f(ts.x*1.5,0.),0.).rgb;
  let ly=textureSampleLevel(t0,smp,uv+vec2f(0.,ts.y*1.5),0.).rgb-textureSampleLevel(t0,smp,uv-vec2f(0.,ts.y*1.5),0.).rgb;
  let gr=vec2f(max(lx.r,max(lx.g,lx.b)),max(ly.r,max(ly.g,ly.b)));
  let dir=normalize(p-fu.v[1].xy+vec2f(1e-3));
  let sd=max(length(p-fu.v[1].xy)/H-fu.v[1].z,0.);let lit=fu.v[1].w/(1.+sq(sd/.2));
  let fr=max(dot(gr,dir),0.)*lit;${GNB_VOL}
  /* тени планет (L1.6): планета между звездой и газом режет свет — за ней по газу
     тёмный клин от звезды, край мягкий и расходится с расстоянием (у звезды есть
     размер), вдали клин тает — газ освещает и рассеянный свет */
  var shd=0.;var ray=0.;
  let toS=fu.v[1].xy-p;let Ls=max(length(toS),1.);let ds=toS/Ls;
  for(var k=0;k<7;k++){let P=fu.v[4+k];if(P.z<=0.){break;}
    let q=P.xy-p;let tq=dot(q,ds);
    /* ни одного порога: клин начинается за диском и кончается у звезды склонами;
       полутень не уже ~40 px на 760 кадра (55 CSS px на полуширину) и расходится вдаль.
       Лучи вдоль краёв включались ступенькой на dq=R — прямая через весь кадр (24.09) */
    let on=smoothstep(P.z*.2,P.z*.9,tq)*smoothstep(0.,P.z,Ls-tq);
    /* конус, а не полоса (Контроль 24.09, ph_tri): ядро тени сужается, полутень растёт
       с расстоянием, и сама тень светлеет за ~4 радиуса — затухание в 11.5 радиуса у
       крупной планеты уводило почти чёрную полосу за край экрана */
    if(on>0.){let dq=length(q-ds*tq);let pen=P.z*.15+tq*.3+30.;
      let Rz=P.z*max(.35,1.-tq/(P.z*9.));
      /* в пыли и газе тень гасит не больше половины: туман перед ней её заполняет */
      let fd=.5*exp(-tq/(P.z*4.+90.))*on;
      let sh=1.-smoothstep(Rz-pen,Rz+pen,dq);
      shd=max(shd,sh*fd);
      /* по краям клина свет чуть ярче — лучи между тенями, растут, пока тень сходит */
      let e=(dq-Rz-pen)/(pen+P.z*.6);ray=max(ray,exp(-e*e)*(1.-sh)*fd);}}
  c=c*(1.-shd)*(1.+.3*ray);
  /* тонкая пыль всюду: свет звезды в ней — лучи, тени планет — тёмные клинья */
  let dl=max(length(p-fu.v[1].xy)/H-fu.v[1].z,0.);
  /* освещённая звездой пыль по всей системе, и в пустотах: ровный тёплый туман (L ~10–15
     на кадре), у самой звезды его нет — там царит её корона; клинья режут и его */
  let wn=lwin(lfr(p,fu.v[14],fu.v[13].x),fu.v[11],fu.v[12])*mix(1.,.3+.7*smoothstep(.02,.22,sd),fu.v[1].w);
  /* густая пыль закрывает и туман за собой: тело пыли темнее пустоты */
  let fog=fu.v[1].w*(.1+.05/(1.+sq(dl/.4)))*smoothstep(.12,.3,dl)*(1.-body)*(1.-.92*wn)
    *mix(.55,1.,clamp(1.-g0.a,0.,1.));
  /* где есть хоть тусклый газ, туман берёт его тон: тёплый туман на бирюзе был серым */
  /* в пустоте туман — цвет звезды, но не бледнее насыщенности .5: бледно-тёплое на
     тёмном читалось серой дымкой */
  let smx=max(fu.v[2].r,max(fu.v[2].g,fu.v[2].b));let sn=mix(fu.v[2].rgb,vec3f(1.,.92,.8)*smx,.35)/smx;
  let sk=.5/max(1.-min(sn.r,min(sn.g,sn.b)),.08);let fs=clamp(1.-(1.-sn)*max(sk,1.),vec3f(0.),vec3f(1.))*smx;
  let fc=mix(fs,gh0*smx,smoothstep(.0003,.004,l0));
  let hue=c/max(l0,1e-3);
  let fw=smoothstep(.02,.16,fr);
  if(fw>0.){c=c+mix(hue,vec3f(1.),.3)*fw*fineE(p*1.7)*.55;}
  /* тени — третьим цветом: тёмный газ уходит в тон теней, светлый держит свой */
  let lum=max(c.r,max(c.g,c.b));
  let cn=fu.v[3].rgb/max(max(fu.v[3].r,max(fu.v[3].g,fu.v[3].b)),1e-3);
  /* только в глубокой тени и коротким переходом: широкая смесь тона с тенью по кругу
     давала серо-оливковое по всему тусклому газу. Янтарь со сливой смешиваются через
     красное, не через серое, — у гиганта переход широкий (fu.v[2].w) */
  c=mix(c,cn*lum,(1.-smoothstep(fu.v[2].w*.55,fu.v[2].w,lum))*.9);
  /* туман — после тона теней: тёплый свет поверх индиго давал серое */
  c=c+fc*fog*(1.-shd)*(1.+.3*ray);
  let m=max(lum,1e-4);let mm=max(max(c.r,c.g),max(c.b,1e-4));
  /* цвет космоса — здесь, а не очисткой сцены: подъём звёзд на газе (ABS) его не трогает,
     пыль гасит его так же, как звёзды */
  let Tb=pow(vec3f(fineT(p,clamp(1.-g0.a,0.,1.))),vec3f(.72,1.,1.42));
  /* неон ушёл: насыщенность и яркость газа ниже, туманность остаётся цветной (автор, 24.09) */
  var co=c*(1.-exp(-mm*1.25))/(mm*1.25)*1.12;var cy=dot(co,vec3f(.2126,.7152,.0722));
  /* закон «центр» (M825): вокруг корабля туманность тихая, а не дырой — свет сжат мягким коленом
     (порядок ярких и тёмных цел: прожилки и пряди остаются, только темнеют); полная сила — за
     r 700 px (на 1080), между — плавно; у звезды зарево держится */
  {let M=min(fu.res.z,fu.res.w);let hn=gnt(((p-fu.res.zw*.5)+fu.v[0].xy*.09)/H*2.4+vec2f(4.,1.));
   let dq=length(p-fu.v[13].yz)/(M*(.9+.2*hn));
   let hw=(1.-smoothstep(.37,.65,dq))*step(-9e4,fu.v[13].y)*mix(.6,1.,smoothstep(.1,.4,sd));
   let cq=.1*(1.-exp(-cy/.1));
   co=co*mix(1.,cq/max(cy,1e-4),hw);cy=dot(co,vec3f(.2126,.7152,.0722));}
  /* далёкие галактики — за газом: густой газ их закрывает, пыль гасит, как космос */
  return vec4f(mix(vec3f(cy),co,.66)*mix(1.,.72,smoothstep(.12,.6,cy))+(vec3f(5.,7.,12.)/255.)*Tb+fgal(p)*(1.-.8*body)*mix(.4,1.,Tb.g),0.);}`;
function gnbTarget(){
  const w=Math.max(2,Math.ceil(GPU.bw/4)),h=Math.max(2,Math.ceil(GPU.bh/4));
  if(GNB.tex&&GNB.dev===GPU.dev&&GNB.w===w&&GNB.h===h)return;
  if(GNB.tex&&GNB.dev===GPU.dev)GPU.trash.push(GNB.tex);
  const U=GPUTextureUsage;
  GNB.tex=GPU.dev.createTexture({size:[w,h],format:"rgba16float",usage:U.TEXTURE_BINDING|U.RENDER_ATTACHMENT});
  GNB.view=GNB.tex.createView();GNB.dev=GPU.dev;GNB.w=w;GNB.h=h;GNB.last=-99;
}
function gnbPipe(){const k="gnb.gen|16f";return GPU.lay[k]||(GPU.lay[k]=gpuPipeline(k,gnbGenDesc));}
function gnbGenDesc(){const mod=gpuShader(GNB_GEN);return {layout:"auto",vertex:{module:mod,entryPoint:"vs"},
    fragment:{module:mod,entryPoint:"fs",targets:[{format:"rgba16float"}]},primitive:{topology:"triangle-list"}};
}
/* палитра туманности системы — своим потоком случайности (0x4E42), сид мира не
   трогает. Два тона по кругу — по областям массы, тень — третьим; у гиганта —
   раздельное тонирование: свет янтарный, тени сливовые (290–330°); у горячих —
   лёд (190–205°) и индиго (240–260°); у дыры — выцветший с оранжевым акцентом.
   Одна система из пяти — внутри яркой эмиссионной туманности (fill): газ кроет
   почти весь кадр, корпуса на нём — силуэтами */
const GNB_PAL=[
  {a:[236,112,58],b:[36,150,178],c:[26,48,120]},    // оранж + бирюза, тени синие
  {a:[206,58,164],b:[36,196,176],c:[40,26,110]},    // маджента + изумруд, тени индиго (лайм читался ядовитым)
  {a:[150,86,214],b:[232,86,118],c:[24,40,128]},    // фиолет + роза, тени синие
  {a:[56,200,232],b:[40,164,212],c:[84,42,204],sw:.15}, // лёд в двух тонах, тени индиго
  {a:[255,166,72],b:[236,120,50],c:[50,16,140],sw:.2}, // янтарь, тени слива: раздельный тон по всему тусклому
  {a:[206,120,74],b:[96,104,210],c:[34,18,80]}];   // дыра: медь диска и холодный фиолет джетов (серый «выцветший» был грязью)
function gnbPalette(sys){
  if(sys.gnbPal)return sys.gnbPal;
  const r=rng((sys.seed^0x4E42)>>>0),k=sysStyle(sys).kind;
  const hot=/^#[89a-f]/i.test(sys.cls.col)&&parseInt(sys.cls.col.slice(5,7),16)>200;
  let i=k==="giant"?4:k==="hole"?5:(k==="dwarf"||k==="neutron"||hot)?3:(r()*3)|0;
  if(r()<.2&&k!=="hole")i=(i+1+((r()*3)|0))%5;
  const fill=r()<.2?1:0;
  return sys.gnbPal=Object.assign({fill,dens:fill?1.3:1,lm:gnbLandmark(sys,k)},GNB_PAL[i]);
}
/* достопримечательность — свой поток (0x4C4D): вид, место на заднике, размер, поворот */
const GNB_LM_COL=[[[1,.36,.3],[.3,.72,1]],[[.3,.55,1],[1,.78,.45]],[[1,1,1],[1,1,1]],[[.55,.65,1],[.75,.5,1]]];
function gnbLandmark(sys,k){
  const r=rng((sys.seed^0x4C4D)>>>0);
  const t=k==="hole"?3:(r()*3)|0;
  const s=[.62,.9,.55,1][t]*(.85+r()*.3);
  /* L2/L1 возврат: громадина обрамляет игру, а не лежит под кораблём (при параллаксе .006 она
     стоит на экране почти намертво) — центр в угловой четверти, .66–.95 полукадра по осям:
     дальше .3 диагонали от центра кадра, в середину заходит только край. Те же два числа потока */
  /* угол — решёткой по месту системы: у соседей углы разные, любые четыре подряд — все четыре */
  const x0=r()-.5,y0=r()-.5,cr=((sys.sx|0)+2*(sys.sy|0))&3,
        q=(v,sg)=>sg*(.66+.29*Math.min(1,Math.abs(v)*2));
  /* верхний левый — под полосами HUD: громадину ниже блока полос, ближе к кромке по x */
  const tl=cr===0,x=q(x0,cr&1?1:-1),y=tl?-(.36+.14*Math.min(1,Math.abs(y0)*2)):q(y0,cr&2?1:-1);
  /* спираль-громадина (вид 2) снята 06.10: читалась наклейкой поверх. Далёкие галактики —
     россыпью в сведении (fgal); поток случайности тот же, у остальных видов ничего не сдвинулось */
  return {t,x:tl?Math.min(x,-.74):x,y,s,a:r()*6.283,p:.35+r()*.3,l:r()*40,k:t===2?0:2.2,c:GNB_LM_COL[t]};
}
/* место и поворот громадины в кадре (P1 14/n г): константы кадра — раз на процессоре, а не в
   каждом пикселе. Параллакс .006. Возвращает [x, y, cos, sin, размер в px] */
function gnbLfr(lm,camx,camy,st){
  const o=GNB.LQ||(GNB.LQ=new Float32Array(5));
  /* место — доли полукадра по каждой оси: и на широком экране, и на телефоне громадина в своём углу */
  /* комета (M825) — в плоскости газа, с его параллаксом .09: при .006 хвост стоял прибитым к экрану,
     пока газ под ним плыл; голова в своём углу — там, где камера над звездой */
  const P=lm.t===1?.09:.006;
  let x=W*(.5+lm.x*.5)-camx*P,y=H*(.5+lm.y*.5)-camy*P,a=lm.a;
  if(lm.t>2.5){x=st.x;y=st.y;a=1.3208;}
  else if(lm.t===1){
    /* комета: голова в своём углу (решётка, отступ от HUD — как у всех), хвосты — внутрь
       кадра, но мимо середины: ось отведена от направления на центр на 30±5° к вертикальной
       кромке (в центре всегда свой корабль — прямая в него читалась лучом наведения; сверху
       и снизу — полосы HUD). Громадина на бесконечности: проекция хвоста любая */
    const vx=-W*lm.x*.5,vy=-H*lm.y*.5;   /* ось — от места покоя: с параллаксом хвост не крутится за камерой */
    a=Math.atan2(vy,vx)+(vx*vy>0?1:-1)*(.52+(lm.a/6.2832-.5)*.17);}
  o[0]=x;o[1]=y;o[2]=Math.cos(a);o[3]=Math.sin(a);o[4]=H*lm.s;return o;
}
/* светило для туманности: место на экране, радиус, цвет по виду звезды */
function gnbStar(sys,ox,oy,R){
  const k=sysStyle(sys).kind;
  if(k==="hole")return {x:ox,y:oy,r:R,on:.35,c:hex2rgb("#ffb070")};
  const col=k==="giant"?"#ff7448":k==="dwarf"?"#dcefff":k==="neutron"?"#bfe0ff":sys.cls.col;
  return {x:ox,y:oy,r:k==="giant"?R*1.85:k==="dwarf"?R*.6:R,on:1,c:hex2rgb(col)};
}
/* пересчёт в четверть кадра — отдельным проходом ДО прохода сцены. cam — камера в
   пикселях CSS (cx0*Z), st — gnbStar */
function gpuNebulaGen(sys,camx,camy,st,Z){
  if(!GPU.on||!GPU.enc||GPU.scenePass||GPU.overPass)return false;
  gnbTarget();
  const st2=sysStyle(sys),pl=gnbPalette(sys);
  /* сведению — камера, звезда и тень каждый кадр, даже без пересчёта объёма */
  const c=GNB.C;c[0]=camx;c[1]=camy;c[2]=(G.t||0)*.0004;c[3]=(st2.nseed%997)*.013;
  c[4]=st.x;c[5]=st.y;c[6]=st.r/H;c[7]=st.on;c[8]=st.c[0]/255;c[9]=st.c[1]/255;c[10]=st.c[2]/255;
  /* планеты — отбрасывают тени по газу; самые крупные на экране, до семи */
  let np=0;
  if(Z)for(const p of sys.planets){if(np>=7)break;const r=p.radius*Z;if(r<3)continue;
    const o=16+np*4;c[o]=W/2+p.x*Z-camx;c[o+1]=H/2+p.y*Z-camy;c[o+2]=r;c[o+3]=1;np++;}
  for(let k=np;k<7;k++)c[16+k*4+2]=0;
  /* громадина — и сведению: окно гасит туман */
  const lm=pl.lm;
  c[44]=lm.x;c[45]=lm.y;c[46]=lm.s;c[47]=lm.t;c[48]=lm.a;c[49]=lm.p;c[50]=lm.l;c[51]=lm.k;c[55]=.006;
  /* корабль на экране — дыра закона «центр» в сведении (только в системе) */
  if(Z&&G.mode==="system"&&G.ship){c[53]=W/2+G.ship.x*Z-camx;c[54]=H/2+G.ship.y*Z-camy;}else{c[53]=-1e5;c[54]=-1e5;}
  const lq=gnbLfr(lm,camx,camy,st);c[52]=lq[4];for(let k=0;k<4;k++)c[56+k]=lq[k];
  c[11]=pl.sw||.1;c[12]=pl.c[0]/255;c[13]=pl.c[1]/255;c[14]=pl.c[2]/255;
  /* пыль (L1b) в полярных координатах звезды: сдвиг угла и ln r копится по кадрам так, чтобы
     узор у центра кадра полз с параллаксом .12, а направления смотрели на настоящую звезду.
     Звезда у центра (D < .3H) — узор идёт с ней */
  const sx=st.x-W/2,sy=st.y-H/2,sD=Math.max(Math.hypot(sx,sy),1),ph=Math.atan2(sy,sx),
        wD=(1-.12)*Math.min(1,Math.max(0,(sD/H-.3)/.5)),lD=Math.log(sD/H);
  /* кромки кадра по радиусу (ближняя точка — не ближе .25H) — так же */
  const ex=Math.max(0,Math.abs(sx)-W/2),ey=Math.max(0,Math.abs(sy)-H/2),
        l0=Math.log(Math.max(Math.hypot(ex,ey),.25*H)/H),l1=Math.log(Math.hypot(Math.abs(sx)+W/2,Math.abs(sy)+H/2)/H);
  /* узор копится у центра кадра в сжатых координатах (kD — как в шейдере): смена зума или
     удаление от звезды меняют масштаб вокруг центра, а не сдвигают узор */
  const kD=Math.max(1,sD/H/.9);
  if(GNB.dsys!==sys){GNB.dsys=sys;GNB.Qc=kD*((1-wD)*ph+Math.PI);GNB.Yc=kD*(1-wD)*lD;}
  else{let d=ph-GNB.phP;d-=Math.round(d/(2*Math.PI))*2*Math.PI;GNB.Qc+=kD*(1-wD)*d;GNB.Yc+=kD*(1-wD)*(lD-GNB.lDP);}
  GNB.phP=ph;GNB.lDP=lD;
  const moved=Math.hypot(camx-GNB.cx,camy-GNB.cy)*.09;
  /* GPU.kill.ngen (?g11=deep): без пересчёта; стоя — перетекание (16gc) */
  if(GNB.sys===sys&&(GPU.kill.ngen||moved<GNB_MOVE&&GPU.frameNo-GNB.last<GNB_AGE&&GPU.frameNo>=GNB.last))return gnbFade(),true;
  const a=GNB.U;
  a[0]=GNB.w;a[1]=GNB.h;a[2]=W;a[3]=H;
  a[4]=camx;a[5]=camy;a[6]=c[2];a[7]=c[3];
  a[8]=pl.a[0]/255;a[9]=pl.a[1]/255;a[10]=pl.a[2]/255;a[11]=clamp(st2.dust,.3,1.7);
  a[12]=pl.b[0]/255;a[13]=pl.b[1]/255;a[14]=pl.b[2]/255;a[15]=pl.dens;
  a[16]=st.x;a[17]=st.y;a[18]=st.r;a[19]=st.on;
  a[20]=st.c[0]/255;a[21]=st.c[1]/255;a[22]=st.c[2]/255;a[23]=pl.fill;
  a[24]=GNB.Qc;a[25]=GNB.Yc;a[26]=(l0-lD)*kD+GNB.Yc;a[27]=(l1-lD)*kD+GNB.Yc;
  a[28]=lm.x;a[29]=lm.y;a[30]=lm.s;a[31]=lm.t;a[32]=lm.a;a[33]=lm.p;a[34]=lm.l;a[35]=lm.k;
  a[36]=lm.c[0][0];a[37]=lm.c[0][1];a[38]=lm.c[0][2];a[39]=gnbDeep(pl);a[40]=lm.c[1][0];a[41]=lm.c[1][1];a[42]=lm.c[1][2];
  a[43]=lq[4];for(let k=0;k<4;k++)a[44+k]=lq[k];
  const U=GPUBufferUsage,ub=gpuBuf("gnb.u",192,U.UNIFORM|U.COPY_DST);
  GPU.dev.queue.writeBuffer(ub,0,a);
  const P=gnbPipe();
  const p=GPU.enc.beginRenderPass({colorAttachments:[{view:gnbGenView(sys,moved),loadOp:"clear",storeOp:"store",clearValue:{r:0,g:0,b:0,a:0}}],timestampWrites:gpuTs("nebGen")});
  p.setPipeline(P);p.setBindGroup(0,gpuBind("gnb.gen",P,[ub,GPU.S.lin,gnbNoiseTile()]));p.draw(3);p.end();
  GNB.sys=sys;GNB.cx=camx;GNB.cy=camy;GNB.last=GPU.frameNo;GNB.nGen=(GNB.nGen|0)+1;gnbFade();
  return true;
}
/* возвращает проход сцены, в который рисовать дальше: под меткой времени (проба) сведение
   идёт своим проходом — у меток нет записи внутри прохода на телефоне */
function gpuNebulaComp(pass){
  if(!GNB.view||GNB.dev!==GPU.dev)return pass;
  const ts=gpuTs("nebComp");let p=pass;
  if(ts){pass.end();GPU.scenePass=null;p=GPU.enc.beginRenderPass({colorAttachments:[{view:GPU.V.scene,loadOp:"load",storeOp:"store"}],timestampWrites:ts});}
  /* пыль уже погасила и покраснила звёзды (gnbStars); газ светит поверх */
  gpuField(p,"gnb.emi",GNB_EMI,GNB.C,[{view:GNB.view},{view:gnbNoiseTile()}],{blend:"add"});
  /* корпуса на ярком газе — силуэтами: общий проход темнит газ вокруг 2D (08b) */
  GPU.sep=.7;
  if(ts){p.end();return gpuScene();}
  return pass;
}
