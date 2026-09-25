/* ══════════════ небо гиганта на видеокарте (G9, docs/DESIGN-gpu.md) ══════════════
   Прежде небо пеклось один раз на планету пиксельным циклом (giantTex, 768×384, ~400 мс)
   и растягивалось двумя эшелонами на полтора экрана: лента была замёрзшей картинкой,
   которую просто тащили мимо, и мылилась от растяжения. Теперь это поле — формула на
   пиксель, считается каждый кадр и живёт само:
   · полосы текут: у каждой широты своя скорость струи, на границах — сдвиг;
   · завитки — ротор шума, который медленно плывёт: газ крутится, а не мигает;
   · штормы — ячейки вдоль ленты, без повторов тайла; их закрутка дышит;
   · свет один и с источником: звезда стоит там, где она на самом деле относительно
     точки захода, валы освещены с её стороны и затенены с обратной, на ночной
     стороне гиганта небо гаснет, у терминатора свет теплеет;
   · ближний эшелон — рваная гряда облаков с рельефом, а не та же лента на .3:
     одинаковые ленты, наложенные друг на друга, усреднялись в розовую кашу.
   Шум — плитка туманности (16gaz, gnt/fbt): одна выборка вместо четырёх хэшей. */
const SCP={U:new Float32Array(60),s:null,t0:0,fl:{x:0,y:0,k:0}};
const SCP_AIR=GNB_TILE+`
fn spal(t:f32)->vec3f{let x=clamp(t,0.,.9999)*4.;let i=u32(x);return mix(fu.v[4u+i].rgb,fu.v[5u+i].rgb,x-f32(i));}
fn sh1(x:f32)->f32{return fract(sin(x*127.1+311.7)*43758.5453);}
/* эшелон ленты: u — вдоль (доли тайла), v — высота слоя 0..1. Ответ: тон, светлота, рельеф */
fn deck(u:f32,v:f32,t:f32,s:vec2f,kind:f32)->vec3f{
  /* струи: у каждой широты своя скорость — сдвиг на кромках полос */
  let u0=u+t*(.020*sin(v*9.+s.x)+.011*sin(v*23.+s.y));
  let fl=vec2f(t*.021,-t*.013);
  let w1=fbt(vec2f(u0*3.2,v*8.5)+s,4)-.5;
  let w2=fbt(vec2f(u0*7.4+3.1,v*15.-2.2)+s*1.7+fl,3)-.5;
  /* ротор медленно плывущего шума: завитки без разрывов */
  let e=.03;let cp=vec2f(u0*5.,v*12.)+s*.7+fl*2.;
  let c0=fbt(cp,2);let cu=fbt(cp+vec2f(e,0.),2);let cv=fbt(cp+vec2f(0.,e),2);
  var uu=u0+w1*.30+w2*.07+(cv-c0)/e*.05;
  var vv=v+w2*.022+w1*.012-(cu-c0)/e*.006;
  /* штормы: ячейки вдоль ленты, в каждой — вихрь или ничего; закрутка дышит */
  let cw=select(1.,.34,kind>.5&&kind<1.5);
  let c=floor(uu/cw);var bump=0.;
  for(var k=-1;k<=1;k++){
    let ci=c+f32(k)+s.x*13.;
    if(sh1(ci)<=select(.55,.8,kind>.5&&kind<1.5)){
    let cx=(floor(uu/cw)+f32(k)+.2+.6*sh1(ci+.31))*cw;let cy=.18+.64*sh1(ci+.57);
    let r=select(.06+.09*sh1(ci+.73),.025+.035*sh1(ci+.73),kind>.5&&kind<1.5)*cw*2.;
    let sg=select(-1.,1.,sh1(ci+.91)>.5)*(.5+sh1(ci+.13));
    let dx=uu-cx;let dy=(vv-cy)*1.9;let dd=length(vec2f(dx,dy));
    if(dd<r*2.2){
      let q=1.-dd/(r*2.2);let an=q*q*sg*(2.4+.5*sin(t*.23+ci));
      let ca=cos(an);let sa=sin(an);
      uu=cx+(dx*ca-dy*sa);vv=cy+(dx*sa+dy*ca)/1.9;bump=max(bump,q*q);
    }}
  }
  /* фронт полосы резкий, хвост мягкий — облачный вал; у струйного типа ленты рвёт */
  var phs=vv*7.+sin(uu*2.1)*.08;
  if(kind>1.5){phs=phs+(fbt(vec2f(uu*5.,vv*3.)+s*2.3,2)-.5)*.6;}
  let fr=fract(phs);
  let band=select(1.-(fr-.26)/.74,fr/.26,fr<.26);
  let grain=fbt(vec2f(uu*9.,vv*22.)+s*3.1,3)-.5;
  var tt=clamp(vv*.42+band*.52+grain*.18,0.,1.);
  tt=pow(clamp((tt-.5)*1.5+.5,0.,1.),1.35);
  let lift=1.+(fbt(vec2f(uu*26.,vv*40.)+s*1.3,2)-.5)*.2;
  return vec3f(tt,lift,band*.55+grain*.45+bump*.35);
}
fn field(p0:vec2f,uv:vec2f)->vec4f{
  let W=fu.res.z;let H=fu.res.w;let A=fu.v[0];let L=fu.v[1];let Sn=fu.v[2];
  let p=vec2f(p0.x,p0.y-A.w);let y=p.y/H;
  let s=vec2f(fu.v[4].w,fu.v[5].w);let kind=fu.v[6].w;
  let dk=fu.res.x/W;
  /* дальний эшелон: крупный и медленный */
  let hF=H*1.35;
  let F=deck(p.x/(hF*1.25)+A.x,(p.y-H*.5+hF*.5)/hF,A.z,s,kind);
  /* ближний: мельче, быстрее, своим сидом — рваная гряда поверх */
  let N=deck(p.x/(H*1.25)+A.y,(p.y-H*.05)/H,A.z*1.3,s+vec2f(17.3,-9.1),kind);
  /* рельеф: склон к звезде светлее, от неё темнее. Производные — экранные, на пиксель */
  let gF=vec2f(dpdx(F.z),dpdy(F.z))*dk;
  let gN=vec2f(dpdx(N.z),dpdy(N.z))*dk;
  let ld=L.xy;
  let key=mix(.30,1.,L.z);
  let sun=fu.v[3].rgb;
  /* тёплый свет у терминатора, холодный — днём; тень холодная всегда */
  let lc=mix(mix(vec3f(1.),sun,.55),vec3f(1.,.62,.40),L.w);
  let shF=clamp(1.-dot(gF,ld)*22.,.55,1.5);
  var col=spal(F.x)*F.y*mix(vec3f(.78,.80,1.),lc,.6)*mix(1.,shF,key)*key;
  let cov=smoothstep(.50,.74,N.x)*smoothstep(.02,.18,(p.y-H*.05)/H);
  let shN=clamp(1.-dot(gN,ld)*30.,.5,1.6);
  let nc=spal(min(N.x*1.05+.08,1.))*N.y*mix(vec3f(.78,.80,1.),lc,.7)*mix(1.,shN,key)*key;
  col=mix(col,nc,cov*.78);
  /* свет звезды сквозь верхнюю дымку: ореол с её стороны, гаснет вглубь */
  let sd=length(p-Sn.xy)/Sn.z;
  col=col+sun*(.42*exp(-sd*2.2)+.10*exp(-sd*.7))*L.z*(1.-smoothstep(.15,.7,y));
  /* глубина: вверху разрежённая холодная муть и чернота космоса, внизу горячая мгла
     и тёмное дно — вниз лететь страшно, и свет туда не доходит */
  let p4=fu.v[8].rgb;let p0c=fu.v[4].rgb*vec3f(.7,.6,.7);
  var dc=vec4f(0.);
  if(y<.14){dc=mix(vec4f(3.,5.,11.,.95*255.),vec4f(8.,12.,24.,.55*255.),y/.14)/255.;}
  else if(y<.34){dc=mix(vec4f(8.,12.,24.,.55*255.),vec4f(10.,14.,26.,.10*255.),(y-.14)/.2)/255.;}
  else if(y<.58){dc=vec4f(10./255.,14./255.,26./255.,mix(.10,0.,(y-.34)/.24));}
  else if(y<.74){dc=vec4f(p4,mix(0.,.26,(y-.58)/.16));}
  else if(y<.86){dc=mix(vec4f(p4,.26),vec4f(p0c,.62),(y-.74)/.12);}
  else{dc=mix(vec4f(p0c,.62),vec4f(6./255.,4./255.,10./255.,.93),(y-.86)/.14);}
  col=mix(col,dc.rgb,dc.a);
  /* гроза внизу: вспышка гаснет за несколько кадров и светит валы снизу */
  let Fl=fu.v[9];
  if(Fl.z>.01){
    let fd=length(p-Fl.xy)/Fl.w;
    let up=clamp(1.+dot(gN,vec2f(0.,1.))*30.,.4,1.8);
    col=col+vec3f(1.,.93,.80)*Fl.z*.55*exp(-fd*fd*2.5)*up;
  }
  return vec4f(col,1.);
}`;
/* откуда светит звезда: угол от гиганта на звезду против точки захода, и корабль
   за заход проходит по дуге — звезда за полминуты заметно сдвигается. Ответ —
   [к звезде по экрану x, y; день 0..1; тёплость у терминатора; солнце на экране x, y] */
function scoopSunAt(S){
  const p=S.p,sa=Math.atan2(-(p.y||0),-(p.x||0));
  const a0=Math.atan2((G.ship.y||0)-(p.y||0),(G.ship.x||0)-(p.x||0))||0;
  const d=sa-a0-S.x*.00004,el=Math.cos(d),sx=Math.sin(d);
  const ly=-Math.max(el,.18),n=Math.hypot(sx,ly)||1;
  const day=clamp((el+.25)/.6,0,1);
  return [sx/n,ly/n,day*day*(3-2*day),Math.exp(-(el/.32)*(el/.32))*.85,W*(.5+.62*sx),H*(.10-.6*el)];
}
function scoopGpuAir(pass,S,sh){
  const U=SCP.U,p=S.p,pal=p.T.pal;
  if(SCP.s!==S){SCP.s=S;SCP.t0=G.t;SCP.fl.k=0;}
  const L=scoopSunAt(S);
  if(!pass)return L;
  U.fill(0);
  U[0]=S.x*.30*9/(H*1.35*1.25);U[1]=S.x*.85*9/(H*1.25)+.5;U[2]=(G.t-SCP.t0)/60;U[3]=sh;
  U[4]=L[0];U[5]=L[1];U[6]=L[2];U[7]=L[3];
  U[8]=L[4];U[9]=L[5];U[10]=Math.max(W,H)*.55;
  const sc=gplSun();U[12]=sc[0];U[13]=sc[1];U[14]=sc[2];
  for(let i=0;i<5;i++){const c=pal[Math.min(i,pal.length-1)];U[16+i*4]=c[0]/255;U[17+i*4]=c[1]/255;U[18+i*4]=c[2]/255;}
  const sd=p.seed|0;U[19]=((sd>>>5)&1023)*.173;U[23]=((sd>>>15)&1023)*.131;U[27]=(sd>>>3)%3;
  /* гроза: редкая вспышка снизу гаснет за несколько кадров, а не мигает одним */
  const F=SCP.fl;
  if(rndFx()<.012){F.x=rndFx()*W;F.y=H*(.86+rndFx()*.1);F.k=1;}
  else F.k*=.78;
  U[36]=F.x;U[37]=F.y;U[38]=F.k;U[39]=180;
  gpuField(pass,"scoop.air",SCP_AIR,U,[null,{view:gnbNoiseTile()}]);
  return L;
}
