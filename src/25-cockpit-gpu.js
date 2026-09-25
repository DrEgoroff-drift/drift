/* ══════════════ кабина пояса на видеокарте (G12, кабина) ══════════════
   Рама кабины (выпечка cockpitBake, 25-cockpit) и стекло — одним полем в сцене, после мира:
   · под рамой — стекло: тонировка, блик по крену и тангажу, отражение доски у нижней
     кромки (всё как в 2D) — и свет звезды: мягкая пелена вокруг светила на стекле, призрак
     светила в зеркальной точке, царапины стекла вспыхивают рядом с ним;
   · рама — та же выпечка, но кромки, что смотрят на светило через проём, горят его светом:
     пиксель рамы, у которого в сторону звезды лежит стекло, освещён — стойка справа
     от звезды светится своей левой гранью, левая — в тени; звезда за спиной — рама тёмная;
   · поверх всего — виньетка кабины (была запечена в раму и тонировала мир в углах).
   Рама получает зерно и свечение кадра как часть мира; приборы и символика стекла
   остаются на слое #hud (24bc). */
const CKGPU_WGSL=`
fn ov(s:vec4f,d:vec4f)->vec4f{return s+d*(1.-s.a);}
fn fr(a:f32)->f32{return smoothstep(.75,.98,a);}
fn field(p:vec2f,uv:vec2f)->vec4f{
  let res=fu.res.zw;let S=fu.v[0];let L=fu.v[1];let sc=fu.v[2].rgb;let glow=fu.v[2].w;
  let bk=textureSampleLevel(t0,smp,uv,0.);let f0=fr(bk.a);
  /* стекло: тонировка, блик, отражение доски */
  var g=vec4f(fu.v[3].rgb*.035,.035);
  let s0=L.zw+vec2f(-.3,-.2)*res;let e=vec2f(.55,.45)*res;
  let t=clamp(dot(p-s0,e)/dot(e,e),0.,1.);let sa=.045*glow*(1.-abs(t-.5)*2.);
  g=ov(vec4f(vec3f(.745,.882,1.)*sa,sa),g);
  let dY=fu.v[3].w;let rh=res.y*.12;
  let ra=select(0.,clamp((p.y-(dY-rh))/rh,0.,1.)*.05*glow,p.y<=dY);
  g=ov(vec4f(fu.v[4].rgb*ra,ra),g);
  /* светило на стекле: пелена, призрак в зеркальной точке, царапины у светила */
  if(S.z>.5){
    let d=length(p-S.xy);let R=select(res.y*.55,res.y*.16,S.z<1.5);
    let vk=glow*S.w*(.07*exp(-d/R)+.05*exp(-d*d/(R*R*.08)));
    g=vec4f(g.rgb+sc*vk,g.a);
    if(S.z<1.5){let q=res-S.xy;let gk=.06*glow*S.w*exp(-pow(length(p-q)/(res.y*.03),2.));
      g=vec4f(g.rgb+sc*vec3f(.8,.9,1.)*gk,g.a);}
    if(f0<.5){g=vec4f(g.rgb+bk.rgb*vk*16.,g.a);}
  }
  /* рама: кромки, открытые на светило через проём */
  var f=bk;
  if(S.w>0.){
    var ex=0.;var ws=array(1.,.8,.6,.4,.25);var ds=array(1.5,3.,5.,8.,12.);
    for(var i=0;i<5;i++){ex+=ws[i]*(1.-textureSampleLevel(t0,smp,(p+L.xy*ds[i])/res,0.).a);}
    ex=ex/3.05;
    f=vec4f(f.rgb+sc*bk.a*(ex*ex*.55+.03)*S.w,f.a);
  }
  var o=ov(f,g);
  /* виньетка кабины */
  let vc=vec2f(res.x*.5,res.y*.42);let r0=min(res.x,res.y)*.34;let r1=max(res.x,res.y)*.72;
  let v=.34*clamp((length(p-vc)-r0)/(r1-r0),0.,1.);
  o=ov(vec4f(0.,0.,0.,v),o);
  return o;
}`;
const CKGPU_U=new Float32Array(60);
/* star — место светила на экране {x,y,k} (k 1 — диск в кадре, 2 — зарево за краем, 0 — нет);
   sf — косинус между взглядом и светилом (свет через проём — только когда оно впереди);
   sd — экранное направление на светило */
function cockpitGpu(pass,b,star,sf,sdx,sdy,scol){
  if(!pass)return;
  const C=cockpitTex(G.shipId),B=cockpitBake();if(!B)return;
  const P=C.plan,K=P.K,A=hex2rgb(P.acc),U=CKGPU_U,I=clamp(sf*1.3+.25,0,1),sl=Math.hypot(sdx,sdy);
  U[0]=star.x;U[1]=star.y;U[2]=star.k;U[3]=I;
  U[4]=sl>1e-4?sdx/sl:0;U[5]=sl>1e-4?sdy/sl:0;
  U[6]=W/2+Math.sin(b.roll)*W*.4;U[7]=H*.3-Math.sin(b.pitch)*H*.2;
  U[8]=scol[0]/255;U[9]=scol[1]/255;U[10]=scol[2]/255;U[11]=K.glow;
  U[12]=K.tint[0]/255;U[13]=K.tint[1]/255;U[14]=K.tint[2]/255;U[15]=P.dashY;
  U[16]=A[0]/255;U[17]=A[1]/255;U[18]=A[2]/255;
  gpuField(pass,"belt.ckpt",CKGPU_WGSL,U,[B]);
  cockpitLeds(pass,P);
}
/* горящие лампы стоек — в сцене, после рамы: ядро и ореол сложением, свечение кадра даёт им
   настоящий ореол (в 2D — диск в .22 альфы на своём холстике над слоем приборов) */
const CKLED=[[],[]];
function cockpitLeds(pass,P){
  const C=CKLED[0],A=CKLED[1],c=hex2rgb(P.K.led);C.length=0;A.length=0;
  for(let s=-1;s<=1;s+=2)for(const L of P.leds){
    if(!ckptLedOn(L,G.t))continue;
    const x=s<0?P.pw*.42:W-P.pw*.42;
    C.push([1,x,L.y,L.r,0,0,0,c[0],c[1],c[2],1]);
    A.push([1,x,L.y,L.r*1.3,0,0,L.r*3.2,c[0],c[1],c[2],.42]);
  }
  if(C.length){gpuShapes(pass,C);gpuShapes(pass,A,{blend:"add"});}
}
