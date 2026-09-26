/* ══════════════ облака, дымка и дальняя погода на движке (27.09.2026) ══════════════
   Облака больше не спрайты: каждое небо лепит их заново из зерна посадки.
   Законы старого неба (19e) живут: у эшелона ОДНА линия конденсации (плоский
   низ), верх — купола и клубы, кучевые ходят кучами с пустотой между ними,
   дальний эшелон — цепь мелких у горизонта, ближний — два-три крупных; свет
   сверху и со стороны звезды, низ холодный, каёмка к звезде ярче, но облако не
   ярче своей звезды (краски считает skyCloudCols); в непогоду тонут в сизом;
   верх скошен по ветру. Кромка мягкая: край — не контур, а убывание плотности.
   Выше кучевых — перья, у верхней кромки кадра — полог, когда он стоит; внизу —
   дымка у горизонта со своим рисунком. Дальняя погода — поле штрихов, хлопьев и
   полос; ближняя остаётся за миром (19d). */
const GCL=new Float32Array(60);
const GCL_WGSL=SKY_NOISE_WGSL+`
/* эшелон кучевых: (плотность, светлота, каёмка). Облако — куча круглых клубов,
   слитых мягким объединением: купол круглый, низ срезан линией конденсации.
   Клетка на облако; есть ли облако и какой величины — от медленного шума по
   клеткам, поэтому они ходят кучами с пустотой между */
fn smax(a:f32,b:f32,k:f32)->f32{let h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(a,b,h)+k*h*(1.-h);}
fn cuTier(p:vec2f,base:f32,S:f32,X0:f32,cover:f32,sd:f32,wind:f32)->vec3f{
  let d=base-p.y;
  if(d<-S*.2||d>S*1.5||cover<=0.){return vec3f(0.);}
  let X=p.x+X0+d*wind*.22;
  let cw=S*1.6;let ci=floor(X/cw);
  var best=-1e4;
  for(var k=-1;k<=1;k=k+1){
    let id=ci+f32(k);
    let env=smoothstep(1.-cover,1.-cover+.22,vn(vec2f(id*.45,sd+1.)));
    if(env<.03){continue;}
    for(var j=0;j<4;j=j+1){
      let h=kh2(vec2f(id*3.1+f32(j)*1.7,sd+9.));
      let mid=select(.55,1.,j==1||j==2);
      let r=S*(.20+.26*h.y)*mid*(.45+.55*env);
      let cx=(id+.12+.76*(f32(j)+h.x)/4.)*cw;
      let cy=r*(.35+.25*h.y);
      let q=vec2f(X-cx,d-cy);
      best=smax(best,r-length(q*vec2f(.82,1.)),S*.10);
    }
  }
  if(best<-S*.2){return vec3f(0.);}
  let e=fbm(vec2f(X/(S*.30),d/(S*.30))+vec2f(sd,0.),3);
  let top=best+(e-.5)*S*.16;
  let dens=smoothstep(-S*.018,S*.035,top)*smoothstep(-S*.02,S*.02,d+(e-.5)*S*.06);
  let lt=clamp(.34+clamp(d/(S*.75),0.,1.)*.62+(e-.5)*.5,0.,1.);
  let rim=(1.-smoothstep(0.,S*.12,top))*dens;
  return vec3f(dens,lt,rim);
}
fn field(p:vec2f,uv:vec2f)->vec4f{
  let Wd=fu.res.z;let H=fu.res.w;
  let litC=fu.v[0].rgb;let wp=fu.v[0].w;let bodyC=fu.v[1].rgb;let wind=fu.v[1].w;
  let shC=fu.v[2].rgb;let yH=fu.v[2].w;let cirC=fu.v[3].rgb;let cirA=fu.v[3].w;
  let sun=fu.v[4].xy;let glowK=fu.v[4].z;let sunUp=fu.v[4].w;
  let t6=fu.v[6];let ci=fu.v[9];let dk=fu.v[10];let hz=fu.v[11];let hz2=fu.v[12];
  let dark=vec3f(56.,62.,74.)/255.;let rain=.66*min(1.,wp*1.15);
  var col=vec3f(0.);var a=0.;
  /* перья: тонкие пряди по ветру, пятнами, высоко */
  if(cirA>0.&&p.y>ci.y-30.&&p.y<ci.z+80.){
    let X=p.x+ci.x;
    let f=fbm(vec2f(X/340.,p.y/15.)+vec2f(ci.w,0.),4);
    let g=fbm(vec2f(X/900.,p.y/110.)+vec2f(ci.w+3.,0.),3);
    let win=smoothstep(ci.y-30.,ci.y+20.,p.y)*(1.-smoothstep(ci.z,ci.z+80.,p.y));
    let ca=smoothstep(.52,.80,f)*smoothstep(.44,.66,g)*win*cirA*(1.-wp*.35);
    col=mix(cirC,dark,rain*.5)*ca;a=ca;
  }
  /* полог: изнанка массы над головой, между полотнищами рвётся синева */
  if(dk.x>0.){
    let X=p.x+dk.z;
    let yb=dk.y+(fbm(vec2f(X/260.,dk.w),3)-.5)*90.;
    if(p.y<yb+30.){
      let under=1.-smoothstep(yb-60.,yb+18.,p.y);
      let det=fbm(vec2f(X/170.,p.y/70.)+vec2f(dk.w,2.),4);
      let gaps=smoothstep(.42,.60,fbm(vec2f(X/430.,p.y/160.)+vec2f(dk.w,4.),4)+dk.x*.22);
      let da=under*gaps*(.52+dk.x*.48)*.94;
      let edge=1.-smoothstep(0.,40.,yb-p.y);
      var dc=mix(shC,bodyC,.30+.45*det);
      dc=mix(dc,litC,edge*.35*sunUp);
      dc=mix(dc,dark,rain);
      col=dc*da+col*(1.-da);a=da+a*(1.-da);
    }
  }
  /* кучевые: дальний эшелон, средний, ближний */
  for(var i=0;i<3;i=i+1){
    let T=fu.v[5+select(select(0,2,i==1),3,i==2)];
    let al=select(select(t6.x,t6.z,i==1),t6.w,i==2);
    let r=cuTier(p,T.x,T.y,T.z,T.w,t6.y+f32(i)*31.7,wind);
    if(r.x>.002){
      let face=clamp(1.-abs(p.x-sun.x)/(Wd*.75),0.,1.)*sunUp;
      let rim=r.z*(.35+.65*face);
      var cc=mix(mix(shC,bodyC,r.y),litC,rim*.85);
      cc=mix(cc,dark,rain);
      let near=1.-clamp(length(p-sun)/(Wd*.5),0.,1.);
      if(near>.25){cc=cc+bodyC*(near-.25)*.44*glowK*(1.-r.x*.5);}
      let ca=r.x*al*(1.-wp*.12);
      col=cc*ca+col*(1.-ca);a=ca+a*(1.-ca);
    }
  }
  /* ночь: облако — тёмный силуэт в тон ночного неба, а не дневная вата */
  col=mix(col,col*fu.v[13].rgb,fu.v[13].w);
  /* дымка у горизонта облачного слоя: гаснет в обе стороны, рисунок от зерна */
  let ht=(p.y-(yH-H*.18))/(H*.30);
  if(ht>0.&&ht<1.){
    let w=.78+.44*fbm(vec2f((p.x+hz2.x)/520.,p.y/46.)+vec2f(hz2.y,0.),3);
    let ha=hz.w*smoothstep(0.,.6,ht)*(1.-smoothstep(.6,1.,ht))*w;
    col=hz.rgb*ha+col*(1.-ha);a=ha+a*(1.-ha);
  }
  return vec4f(col,a);
}`;
/* краски облаков — те же, что пёк спрайт (19e): не ярче своей звезды (§13) */
function skyCloudCols(p){
  const sun=starRGB(),amb=p.T.sky[1];
  const sunL=.299*sun[0]+.587*sun[1]+.114*sun[2];
  const litC=[0,1,2].map(j=>lerp(Math.min(212,sunL),sun[j],.16));
  const bodyC=capLum(litC,litC,.80);
  const shRaw=[0,1,2].map(j=>lerp(lerp(210,amb[j],.72),amb[j],.5)*.86);
  const shC=capLum(shRaw,litC,.45);
  const cirC=[0,1,2].map(j=>lerp(Math.min(224,sunL),sun[j],.12));
  return {litC,bodyC,shC,cirC,sunL};
}
function gpuClouds(p,camx,camy){
  if(p.T.atm==="отсутствует"||CLOUDS_OFF)return false;
  const pass=gpuScene();if(!pass)return false;
  const R=skyRoll(p),Cl=R.cl,K=cloudsOf(p).K,C=skyCloudCols(p);
  const wp=weatherPower(p),SS=sunSpot(p);
  const yH=H*SURF_HOR-camy*.03,tw=G.t%100000;
  const U=GCL;U.fill(0);
  const set3=(o,c)=>{U[o]=c[0]/255;U[o+1]=c[1]/255;U[o+2]=c[2]/255;};
  set3(0,C.litC);U[3]=wp;set3(4,C.bodyC);U[7]=WIND;set3(8,C.shC);U[11]=yH;
  set3(12,C.cirC);U[15]=clamp(.45*K.cir*Cl.cir,0,.8);
  U[16]=SS.x;U[17]=SS.y;U[18]=clamp((C.sunL-150)/70,0,1);U[19]=SS.up?1:clamp((SS.alt+.3)/.3,0,1);
  /* эшелоны: высота низа, мерка, сдвиг, покрытие */
  const TI=[5,7,8];
  for(let t=0;t<3;t++){
    const T=CLOUD_TIER[t],o=TI[t]*4;
    const n=T.n*K.n*(.55+wp*.85)*Cl.cover,span=W*(2.6+t*.9);
    const S=168*.8*T.sc*Cl.sc;
    const ty=clamp(T.y-(K.hi-.30)*.42+Cl.lift,.18,.94);
    U[o]=yH*ty-camy*T.par*.5;U[o+1]=S;U[o+2]=camx*T.par+tw*T.spd;
    U[o+3]=clamp(.16+n*288*T.sc*Cl.sc*1.35/span,0,.9);   /* vn редко выше .85: покрытие растянуто, иначе кучевых нет */
  }
  U[24]=CLOUD_TIER[0].a*.84;U[25]=Cl.sd;U[26]=CLOUD_TIER[1].a*.84;U[27]=CLOUD_TIER[2].a*.84;
  /* перья */
  U[36]=camx*.018+tw*.09;U[37]=yH*.04-camy*.02;U[38]=yH*.26-camy*.02;U[39]=Cl.sd*.7+5;
  /* полог: стоит ли сегодня и как низко висит (климат + погода + зерно) */
  const dAmt=clamp(Math.max(clamp(cloudsOf(p).deckAmt+Cl.deck*K.cover,0,1),wp*.92)*(.85+wp*.55),0,1);
  if(dAmt>.18){
    U[40]=dAmt;U[41]=H*(.07+.17*dAmt)-camy*.012;U[42]=camx*.030+tw*.16;U[43]=Cl.sd*1.3+2;
  }
  const amb=capLum((typeof ambRGB==="function")?ambRGB(p):p.T.sky[1],[C.sunL,C.sunL,C.sunL],1);
  set3(44,amb);U[47]=.34*R.haze[0];U[48]=camx*.05+tw*.05;U[49]=R.haze[1];
  const nt=surfNight(p);U[52]=.30;U[53]=.33;U[54]=.46;U[55]=clamp(nt*1.35,0,.86);
  const y1=Math.min(H,yH+H*.14);
  /* мягкому полю полная плотность не нужна: где на пиксель CSS больше точки (телефон),
     оно считается в своей текстуре по .7 точки на пиксель CSS и ложится в кадр растянутым
     (S23 в полдень: 1.06 мс по точке). На ПК (точка на пиксель) — прямо в проход */
  if(W/GPU.bw>.85){
    if(!skyClip(pass,0,0,W,y1))return true;
    gpuField(pass,"gcloud",GCL_WGSL,U,[]);
    pass.setScissorRect(0,0,GPU.bw,GPU.bh);
    return true;
  }
  const B=cloudLow(.7*W/GPU.bw,U,y1);if(B)gpuImage(pass,B,[{x:W/2,y:H/2,w:W,h:H}]);   /* x,y — центр */
  return true;
}
let CLOUD_LOW=null;
/* поле облаков в текстуру доли k от кадра; своим кодировщиком, отправлен сразу —
   раньше кадра, который её читает */
function cloudLow(k,U,y1){
  const d=GPU.dev,tw=Math.max(1,Math.round(GPU.bw*k)),th=Math.max(1,Math.round(GPU.bh*k));
  let B=CLOUD_LOW;
  if(!B||B.dev!==d||B.w!==tw||B.h!==th){
    if(B&&B.dev===d)GPU.trash.push(B.tex);
    const tex=d.createTexture({size:[tw,th],format:"rgba16float",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.RENDER_ATTACHMENT});
    B=CLOUD_LOW={tex,view:tex.createView(),w:tw,h:th,dev:d};
  }
  const enc=d.createCommandEncoder(),p=enc.beginRenderPass({colorAttachments:[{view:B.view,loadOp:"clear",clearValue:{r:0,g:0,b:0,a:0},storeOp:"store"}],timestampWrites:gpuTs("cloudLow")});
  const bw=GPU.bw,bh=GPU.bh;GPU.bw=tw;GPU.bh=th;
  try{if(skyClip(p,0,0,W,y1))gpuField(p,"gcloud",GCL_WGSL,U,[],{blend:"bake"});}
  finally{GPU.bw=bw;GPU.bh=bh;p.end();d.queue.submit([enc.finish()]);}
  return B;
}
/* ── дымка шириной в кисть (M304, §13) — поле над грядами ──
   Тон — сегодняшний воздух (ambRGB); рисунок медленных прядей — от зерна. */
const GHZ=new Float32Array(16);
const GHZ_WGSL=SKY_NOISE_WGSL+`
fn field(p:vec2f,uv:vec2f)->vec4f{
  let y0=fu.v[1].x;let h=fu.v[1].y;
  let t=(p.y-(y0-h))/(h*1.35);
  if(t<=0.||t>=1.){return vec4f(0.);}
  let w=.72+.56*fbm(vec2f((p.x+fu.v[1].z)/430.,p.y/28.)+vec2f(fu.v[1].w,0.),3);
  let k=select((1.-t)/.45,t/.55,t<.55);
  var ha=fu.v[0].w*clamp(k,0.,1.)*w;
  let sd=length((p-fu.v[2].xy)*vec2f(.55,1.))/fu.res.w;
  let g=fu.v[2].z*exp(-sd*5.)*clamp(k*1.4,0.,1.);
  let hc=mix(fu.v[0].rgb,fu.v[3].rgb,clamp(g*1.6,0.,1.));
  ha=clamp(ha+g*.62,0.,1.);
  return vec4f(hc*ha,ha);
}`;
function hazeBand(p,y0,h){
  const pass=gpuNext();if(!pass)return;
  const R=skyRoll(p),c=ambRGB(p),U=GHZ;
  U[0]=c[0]/255;U[1]=c[1]/255;U[2]=c[2]/255;U[3]=(p.T.atm==="отсутствует"?.10:.34)*R.haze[0];
  U[4]=y0;U[5]=h;U[6]=(G.viewX||0)*.08+(G.t%100000)*.03;U[7]=R.haze[1];
  /* низкая звезда за грядой: сила — только у горизонта и в воздухе */
  const SS=sunSpot(p),sc=starRGB(),sa=SS.alt;
  U[8]=SS.x;U[9]=SS.y;U[10]=p.T.atm==="отсутствует"?0:clamp(1-Math.abs(sa-.06)*4.5,0,1)*.9;
  U[12]=sc[0]/255;U[13]=sc[1]/255;U[14]=sc[2]/255;
  if(!skyClip(pass,0,y0-h,W,y0+h*.36))return;
  gpuField(pass,"ghaze",GHZ_WGSL,U,[]);
  pass.setScissorRect(0,0,GPU.bw,GPU.bh);
}
/* ── дальняя погода на движке: пелена, туман, штрихи и хлопья двух дальних
   планов, полотна пыли, вспышка молнии. Рисунок капель — от зерна посадки ── */
const GWX=new Float32Array(40);
const GWX_WGSL=SKY_NOISE_WGSL+`
fn streak(p:vec2f,sl:f32,cw:f32,per:f32,len:f32,w:f32,fall:f32,sd:f32)->f32{
  let xs=p.x-sl*p.y;
  let c=floor(xs/cw);
  let r=kh(vec2f(c,sd));
  let cx=(c+.5+(kh(vec2f(c,sd+1.))-.5)*.7)*cw;
  let yy=pmod(p.y-fall*(1.+r*.6)-r*per*7.,per);
  let pe=abs(xs-cx);
  return (1.-smoothstep(w*.5,w*.5+1.,pe))*smoothstep(0.,len*.25,yy)*(1.-smoothstep(len*.75,len,yy));
}
fn flake(p:vec2f,cs:f32,rr:f32,fall:f32,sw:f32,t:f32,sd:f32)->f32{
  let q=vec2f(p.x,p.y-fall);
  let id=floor(q/cs);
  let h=kh2(id+vec2f(sd,0.));
  let fp=(id+vec2f(.2)+.6*h)*cs+vec2f(sin(t*.02*(.5+h.x)+h.y*6.28)*sw,0.);
  let d=length(q-fp);
  return clamp(rr*(.9+h.y*2.1)*.5+.5-d,0.,1.)*step(h.x,.8);
}
fn field(p:vec2f,uv:vec2f)->vec4f{
  let H=fu.res.w;
  let c=fu.v[0].rgb;let k=fu.v[0].w;let kind=fu.v[1].x;let len=fu.v[1].y;let sl=fu.v[1].z;let t=fu.v[1].w;
  let veil=fu.v[2].x;let fog=fu.v[2].y;let sheets=fu.v[2].z;let flash=fu.v[2].w;
  let sd=fu.v[3].x;let hor=fu.v[3].y;let wind=fu.v[3].z;let camx=fu.v[3].w;
  var a=0.;
  let v=p.y/H;
  a=veil*select(select(.7+(1.-.7)*(1.-(v-.55)/.45),.5+.5*v/.55,v<.55),1.,false);
  if(fog>0.){
    let f=fbm(vec2f((p.x+camx*.35+t*.4*(1.+wind*.2))/300.,p.y/26.)+vec2f(sd,0.),4);
    a=a+smoothstep(.55,.85,f)*fog;
  }
  if(sheets>0.){
    let f=fbm(vec2f((p.x-t*3.*sign(wind+.001))/520.,p.y/(H*.3))+vec2f(sd+5.,0.),3);
    a=a+smoothstep(.5,.8,f)*.16*sheets;
  }
  var s=0.;
  for(var q=0;q<2;q=q+1){
    let P=fu.v[4+q];let Q=fu.v[6+q];
    let pp=vec2f(p.x+camx*P.w,p.y);
    if(kind<1.5){
      let gnd=select(1.,.45,p.y>hor);
      s=s+streak(pp,sl,P.x,P.y,len*P.z*select(1.,.7,p.y>hor),Q.x,t*Q.y,sd+f32(q)*13.)*Q.z*gnd;
    }else{
      s=s+flake(pp,P.x,Q.x,t*Q.y,Q.w,t,sd+f32(q)*13.)*Q.z;
    }
  }
  a=clamp(a+s*k+flash,0.,1.);
  let cc=mix(c,vec3f(.78,.88,1.),clamp(flash*3.,0.,1.));
  return vec4f(cc*a,a);
}`;
function gpuWeatherFar(p,camx,camy){
  const w=weatherOf(p);if(!w.kind)return;
  const k=weatherPower(p);if(k<.04)return;
  const pass=gpuNext();if(!pass)return;
  const W0=WEATHER[w.kind],R=skyRoll(p),U=GWX;U.fill(0);
  const gp=G.opts.gfx.particles,n=W0.n*k*gp,tw=G.t%100000;
  const wind=WIND*2.2+(w.kind==="dust"?2.6*k:0),dr=W0.dir||0,sgn=wind<0?-1:1;
  U[0]=W0.col[0]/255;U[1]=W0.col[1]/255;U[2]=W0.col[2]/255;U[3]=k;
  const streaky=W0.len>0&&w.kind!=="fog";
  U[4]=w.kind==="fog"?3:streaky?1:2;U[5]=W0.len;
  U[6]=streaky?sgn*(dr*3.4+Math.abs(wind)*.4)/Math.max(.2,1-dr*.82):0;U[7]=tw;
  /* пелена ложилась дважды (дальний и ближний вызов) — здесь её половина */
  if(k>.12)U[8]=W0.tint*Math.round(k*40)/40;
  if(w.kind==="fog")U[9]=(.05+.045)*k*.9;
  if(W0.sheets&&k>.25)U[10]=k;
  if(w.kind==="rain"&&k>.5){const ph=(G.t%420)/420;if(ph<.06)U[11]=.30*Math.pow(1-ph/.06,2)*k;}
  U[12]=R.cl.wx;U[13]=H*SURF_HOR;U[14]=wind;U[15]=camx;
  /* два дальних плана WX_PLANES: клетка, период, доля длины, параллакс; ширина, скорость, альфа, качание */
  for(let q=0;q<2;q++){
    const P=WX_PLANES[q],nq=Math.max(1,n*(q?.29:.45));
    const per=streaky?Math.max(W0.len*P.l*3,60):26+q*10;
    const cell=streaky?Math.max(3,W*H/(nq*per)):Math.sqrt(W*H/nq);
    const o=16+q*4,o2=24+q*4;
    U[o]=cell;U[o+1]=per;U[o+2]=P.l;U[o+3]=P.px;
    U[o2]=streaky?(w.kind==="rain"?1:1.4)*P.w:P.r;
    U[o2+1]=W0.spd*(P.s+P.sr*.5);U[o2+2]=P.a*(streaky?1:.9);U[o2+3]=(10+16)*.5+wind*8;
  }
  gpuField(pass,"gwx",GWX_WGSL,U,[]);
}
