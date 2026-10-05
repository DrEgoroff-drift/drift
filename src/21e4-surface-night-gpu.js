/* ══════════════ ночь поверхности на видеокарте (G15) ══════════════
   Весь ночной блок 21e1 одним полем поверх мира: строй значений сверху вниз, контровая кромка
   рельефа, след севшей звезды, свет налобника по грунту пятью слоями, луч в воздухе и ореол у
   шлема. Высоты — та же текстура, что у грунта (21e2): кромка — расстояние до ломаной профиля,
   без бусин на стыках. Смешения — как у 2D: заливка и кромка поверх, свет сложением (у поля
   альфа ноль). Канва тянет цвет градиента без премультипликации — отсюда квадрат у заката.
   false — видеокарты нет, рисует 2D */
const SNT=new Float32Array(60);
const SNT_WGSL=`
fn snC(x:f32)->f32{return clamp(x,0.,1.);}
fn snR(i:i32)->f32{let n=i32(fu.v[0].w);let t=textureLoad(t0,vec2i(clamp(i,0,n-1),2),0);
  return fu.v[1].x+((t.r*255.*256.+t.g*255.)/8.-4096.);}
/* высота грунта на экране под точкой x экрана */
fn snH(sx:f32)->f32{let V=fu.v;let fi=clamp((sx+V[0].x)/V[0].z,0.,V[0].w-1.);let i=i32(floor(fi));
  return mix(snR(i),snR(i+1),fi-floor(fi))-V[0].y;}
fn field(p:vec2f,uv:vec2f)->vec4f{
  let V=fu.v;let H=fu.res.w;
  /* строй значений: низ гаснет сильнее верха, горизонт остаётся линией (M172) */
  let t=p.y/H;var a:f32;var c:vec3f;
  if(t<.5){let k=snC(t/.5);a=mix(V[2].x,V[2].y,k);c=mix(vec3f(4.,7.,20.),vec3f(4.,7.,18.),k);}
  else if(t<.66){let k=(t-.5)/.16;a=mix(V[2].y,V[2].z,k);c=mix(vec3f(4.,7.,18.),vec3f(3.,5.,14.),k);}
  else{let k=snC((t-.66)/.34);a=mix(V[2].z,V[2].w,k);c=mix(vec3f(3.,5.,14.),vec3f(2.,3.,10.),k);}
  var A=a;var C=c/255.*a;
  let g=snH(p.x);
  /* контровая кромка: волосок 1.1 вдоль профиля */
  if(V[4].w>0.){let s=(snH(p.x+1.)-snH(p.x-1.))*.5;let d=abs(p.y-g)/sqrt(1.+s*s);
    let r=V[4].w*snC(1.05-d);C=C*(1.-r)+vec3f(168.,198.,232.)/255.*r;A=A*(1.-r)+r;}
  var L=vec3f(0.);
  /* след севшей звезды: круг у горизонта, полосой H·.30–.75 */
  if(V[3].w>0.&&p.y>=H*.30&&p.y<=H*.75){let q=1.-snC(length(p-vec2f(V[3].x,H*.6))/V[3].z);L+=V[4].xyz*V[3].y*q*q;}
  /* свет налобника по грунту: пять слоёв вглубь, спад вдоль луча */
  {let f=V[1].y;let A0=vec2f(V[5].x-f*30.,V[5].y);let D=vec2f(f*(V[1].z+30.),40.);
   let u=snC(dot(p-A0,D)/dot(D,D));
   var ga:f32;var gc:vec3f;
   if(u<.2){ga=mix(0.,.36,u/.2);gc=vec3f(255.,222.,164.);}
   else if(u<.42){let k=(u-.2)/.22;ga=mix(.36,.46,k);gc=mix(vec3f(255.,222.,164.),vec3f(255.,212.,148.),k);}
   else if(u<.78){let k=(u-.42)/.36;ga=mix(.46,.15,k);gc=mix(vec3f(255.,212.,148.),vec3f(255.,204.,138.),k);}
   else{let k=(u-.78)/.22;ga=mix(.15,0.,k);gc=mix(vec3f(255.,204.,138.),vec3f(255.,198.,130.),k);}
   let dd=p.y-g;
   let sk=.14*snC(66.5-dd)+.26*snC(42.5-dd)+.26*snC(26.5-dd)+.28*snC(14.5-dd)+.30*snC(6.5-dd);
   let ix=snC(p.x-V[5].w+.5)*snC(V[6].x-p.x+.5);
   L+=gc/255.*ga*V[5].z*sk*snC(dd+.5)*ix;}
  /* луч в воздухе: узкий клин по взгляду */
  if(V[6].y>0.){let f=V[1].y;let R=V[1].z;let hx=V[7].x-f*6.;let hy=V[7].y;let dr=V[6].z;
    let u=(p.x-hx)*f/R;
    if(u>-.01&&u<1.01){let top=mix(hy-2.,hy+dr*.5-16.,u);let bot=mix(hy+2.5,hy+dr*.5+20.,u);
      let cov=snC(p.y-top+.5)*snC(bot-p.y+.5)*snC(u*R+.5)*snC((1.-u)*R+.5);
      let Gd=vec2f(f*R,dr*.6);let w=snC(dot(p-vec2f(hx,hy),Gd)/dot(Gd,Gd));
      var ca:f32;var cc:vec3f;
      if(w<.5){let k=w/.5;ca=mix(.13,.05,k);cc=mix(vec3f(255.,238.,205.),vec3f(255.,232.,190.),k);}
      else{let k=(w-.5)/.5;ca=mix(.05,0.,k);cc=mix(vec3f(255.,232.,190.),vec3f(255.,226.,175.),k);}
      L+=cc/255.*ca*cov*V[6].y;}}
  /* ореол у шлема */
  {let r=length(p-V[7].xy)/34.;
   if(r<1.){let sa=select(mix(.22,0.,(r-.35)/.65),mix(.55,.22,r/.35),r<.35);L+=vec3f(255.,236.,200.)/255.*sa*V[7].z;}}
  return vec4f(C+L,A);
}`;
/* x,y — человек на экране (как в 21e1), nite — surfNight(p) */
function surfNightGpu(p,tr,S,camx,camy,x,y,nite){
  if(!GPU.on||!tr||!tr.h)return false;
  const pass=gpuNext();if(!pass)return false;
  const HT=surfHeightTex(tr),U=SNT;U.fill(0);
  const f=S.face||1,reach=170,hy=y-8;
  U[0]=camx;U[1]=camy;U[2]=tr.step;U[3]=tr.N;
  U[4]=HT.mid;U[5]=f;U[6]=reach;U[7]=nite;
  U[8]=nite*.40;U[9]=nite*.52;U[10]=nite*.74;U[11]=nite*.90;
  const SS=sunSpot(p);
  if(!SS.up&&SS.alt>-.55){
    const sc2=hex2rgb((G.sys&&G.sys.cls&&G.sys.cls.col)||"#ffe08a");
    U[12]=SS.x;U[13]=.20*clamp((SS.alt+.55)/.47,0,1);U[14]=W*.42;U[15]=1;
    U[16]=sc2[0]/255;U[17]=sc2[1]/255;U[18]=sc2[2]/255;
  }
  U[19]=nite>.25?.24*nite:0;
  U[20]=x;U[21]=y;U[22]=clamp(nite*1.3,0,1);
  U[23]=Math.min(S.x-f*30,S.x+f*reach)-camx;U[24]=Math.max(S.x-f*30,S.x+f*reach)-camx;
  U[25]=p.T.atm!=="отсутствует"?clamp(nite*1.25,0,1):0;U[26]=(groundAt(tr,S.x+f*reach)-camy)-hy;
  U[28]=x+f*8;U[29]=hy;U[30]=clamp(nite*.8,0,1);
  gpuField(pass,"snight",SNT_WGSL,U,[HT]);
  return true;
}
