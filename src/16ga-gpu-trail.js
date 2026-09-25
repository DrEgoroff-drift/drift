/* ══════════════ шлейф, факел и свет на корпусе корабля на видеокарте (G4, docs/DESIGN-gpu.md) ══════════════
   Те же ленты по соплам из TRAIL, тот же цвет по возрасту (ядро → акцент корпуса) и
   та же толщина; лучше, чем в 2D:
   · лента — одна полоса треугольников с общими нормалями в узлах, а не отрезки
     встык: ни колбасок на стыках, ни щелей на изгибе;
   · возраст — у каждой точки свой, без двадцати четырёх ступеней спада;
   · поперёк — гауссов профиль газа: тонкое ядро и широкий ореол одной формулой,
     а не два stroke с резкой кромкой. */
const GTR={f:new Float32Array(12*6*256),n:0,u:new Float32Array(8)};
const GTR_WGSL=`
struct U{a:vec4f,b:vec4f};
@group(0) @binding(0) var<uniform> u:U;
@group(0) @binding(1) var<storage,read> vb:array<vec4f>;
struct VO{@builtin(position) p:vec4f,@location(0) s:f32,@location(1) a:f32,@location(2) c:vec3f,@location(3) k:f32,@location(4) h:f32,@location(5) w:vec3f};
@vertex fn vs(@builtin(vertex_index) vi:u32)->VO{
  let v0=vb[vi*3u];let v1=vb[vi*3u+1u];let q=v0.xy*u.b.x;
  var o:VO;o.p=vec4f(q.x/u.a.x*2.-1.,1.-q.y/u.a.y*2.,0.,1.);
  let v2=vb[vi*3u+2u];o.s=v0.z;o.a=v0.w;o.c=v1.rgb;o.k=v1.w;o.h=v2.x;o.w=v2.yzw;return o;}
fn th(p:vec2f)->f32{var q=fract(vec3f(p.xyx)*.1031);q=q+dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
fn tn(p:vec2f)->f32{let i=floor(p);let f=fract(p);let w=f*f*(3.-2.*f);
  return mix(mix(th(i),th(i+vec2f(1.,0.)),w.x),mix(th(i+vec2f(0.,1.)),th(i+vec2f(1.,1.)),w.x),w.y);}
@fragment fn fs(i:VO)->@location(0) vec4f{
  let s=i.s;var core=exp(-(s*s)/(i.k*i.k)*1.6);var halo=exp(-s*s*2.);
  /* потревоженная среда: клочья, неподвижные в мире (w.xy — место в мире), медленно текут */
  if(i.w.z>0.){let q=i.w.xy+vec2f(s*.35,0.);let tt=u.b.y*.05;
    let n=tn(q+vec2f(tt,0.))*.6+tn(q*2.3-vec2f(0.,tt*1.7))*.4;
    halo=halo*mix(1.,.2+1.6*n*n,i.w.z);core=core*mix(1.,.7+.6*n,i.w.z*.5);}
  let I=i.a*core+i.h*halo;return vec4f(i.c*I,I);}`;
/* вершина ленты: место, поперечная координата s∈[-1,1], альфа ядра, цвет, доля ядра
   в ширине, альфа ореола */
function gtrPush(x,y,s,a,c,k,h,wx,wy,wn){
  let f=GTR.f;const o=GTR.n*12;
  if(o+12>f.length){const g=new Float32Array(f.length*2);g.set(f);f=GTR.f=g;}
  f[o]=x;f[o+1]=y;f[o+2]=s;f[o+3]=a;f[o+4]=c[0]/255;f[o+5]=c[1]/255;f[o+6]=c[2]/255;f[o+7]=k;f[o+8]=h;f[o+9]=wx||0;f[o+10]=wy||0;f[o+11]=wn||0;GTR.n++;
}
/* узлы одной дорожки → полоса треугольников с общими нормалями в узлах */
function gtrLane(A,B){
  const off=(A.x<-60&&B.x<-60)||(A.x>W+60&&B.x>W+60)||(A.y<-60&&B.y<-60)||(A.y>H+60&&B.y>H+60);
  if(off)return;
  const a0=(N,s)=>gtrPush(N.x+N.nx*s,N.y+N.ny*s,s,N.a,N.col,N.k,N.h,N.wx,N.wy,N.wn);
  a0(A,-1);a0(A,1);a0(B,1);a0(A,-1);a0(B,1);a0(B,-1);
}
function gtrDraw(pass,key){
  if(!GTR.n)return;
  const U=GPUBufferUsage,d=GPU.dev;
  const ub=gpuBuf("gtr.u",32,U.UNIFORM|U.COPY_DST),uu=GTR.u;uu[0]=GPU.bw;uu[1]=GPU.bh;uu[2]=W;uu[3]=H;uu[4]=DPR;uu[5]=G.t;
  d.queue.writeBuffer(ub,0,uu);
  const vb=gpuBuf(key+".v",GTR.f.byteLength,U.STORAGE|U.COPY_DST);d.queue.writeBuffer(vb,0,GTR.f,0,GTR.n*12);
  const P=gpuPipe("gtr",GTR_WGSL,"add");
  pass.setPipeline(P);pass.setBindGroup(0,gpuBind(key,P,[ub,vb]));pass.draw(GTR.n);
}
/* ленты горячих струй; холодные дымки маневровых и корешки у сопел — кругами кита */
function gpuTrail(zx,zy,Z){
  const pass=gpuScene();if(!pass)return;
  const T0=trailTint(G.shipId,G.mods.engine|0),T=(typeof cosmTrail==="function")?cosmTrail(T0):T0;
  const SZ=shipZ(Z),CW=trailChar(G.shipId).w,K=TRAIL_HALO.core/TRAIL_HALO.w;
  const lanes={};
  for(const t of TRAIL){if(!t.hot)continue;const k=t.e+"/"+(t.b|0);(lanes[k]||(lanes[k]=[])).push(t);}
  GTR.n=0;const puffs=[];
  /* под факелом ленты нет: там горит шлейф (gpuExhaust) и перо корпуса, и белое ядро
     ленты, сложенное с ними, выбеливало весь факел (п.3, пара 760: S .21 → .38 без
     ленты). Лента проявляется за длиной шлейфа — там газ уже остыл и отстал */
  let dist=null,Lf=1;
  const node=(arr,i)=>{
    const t=arr[i],u=clamp(t.life/t.max,0,1);
    const g=clamp((dist[i]-Lf*.3)/(Lf*.55),0,1),fo=.2+.8*g*g*(3-2*g);
    const a=Math.min(TRAIL_AMAX,Math.pow(u,TRAIL_LIFE.fall)*.30+u*u*u*u*.5)*fo;
    const col=u>.78?mixc(T.mid,T.core,(u-.78)/.22):mixc(T.edge,T.mid,u/.78);
    /* газ расходится: к хвосту лента шире (яркость и так гаснет с возрастом) */
    const hw=(Math.max(1,t.r*SZ*(2.4-u*1.3)*CW*1.35)*TRAIL_HALO.w*.5+1)*(1+(1-u)*1.6);
    const p=arr[Math.max(0,i-1)],q=arr[Math.min(arr.length-1,i+1)];
    let dx=zx(q.x)-zx(p.x),dy=zy(q.y)-zy(p.y);const l=Math.hypot(dx,dy)||1;dx/=l;dy/=l;
    return {x:zx(t.x),y:zy(t.y),nx:-dy*hw,ny:dx*hw,a,col,k:K,h:a*.3};
  };
  for(const k in lanes){
    const arr=lanes[k];if(arr.length<2)continue;
    dist=new Float32Array(arr.length);
    for(let i=arr.length-2;i>=0;i--)dist[i]=dist[i+1]+Math.hypot(zx(arr[i].x)-zx(arr[i+1].x),zy(arr[i].y)-zy(arr[i+1].y));
    Lf=Math.max(2.5,arr[arr.length-1].r*SZ*2.2)*9;   /* длина шлейфа при средней пульсации */
    let A=node(arr,0);
    for(let i=1;i<arr.length;i++){
      const B=node(arr,i);gtrLane(A,B);A=B;
    }
    /* добела раскалённый корешок у сопла */
    const f=arr[arr.length-1],x=zx(f.x),y=zy(f.y),r=Math.max(.8,f.r*SZ*1.3);
    if(x>-40&&x<W+40&&y>-40&&y<H+40)puffs.push([1,x,y,r,0,0,r*.8,T.core[0],T.core[1],T.core[2],.2]);   /* ядро сопла светит шлейф */
  }
  gtrDraw(pass,"gtr");
  /* холодные струи маневровых — мягкие дымки */
  for(const t of TRAIL){
    if(t.hot)continue;
    const x=zx(t.x),y=zy(t.y);
    if(x<-30||x>W+30||y<-30||y>H+30)continue;
    const u=clamp(t.life/t.max,0,1),rr=Math.max(.5,t.r*SZ*(2.6-u*1.9));
    puffs.push([1,x,y,rr,0,0,rr*.9,205,232,246,u*.22]);
  }
  if(puffs.length)gpuShapes(pass,puffs,{blend:"add"});
}
/* ── кильватер (G4) ──
   Те же дорожки WAKE (борт/всплеск/кромка), тот же цвет, возраст и спад, что у
   2D-нити; лучше, чем тридцать две ступени яркости обводками:
   · у каждого узла свой возраст — ни ступеней по яркости, ни шва между ними;
   · ядро и ореол — одна гауссова лента: ясная нить у кромки корпуса и мягкая
     среда, расплывающаяся с возрастом, без жёсткого края stroke;
   · среда потревожена: ореол рвётся на клочья, привязанные к месту в мире (корабль
     проходит сквозь них, а не тащит узор за собой), и клочья медленно текут. */
function gpuWake(zx,zy,Z){
  if(!WAKE.length)return;
  const pass=gpuScene();if(!pass)return;
  const SZ=shipZ(Z),col=mixc([196,222,255],hex2rgb(shipData(G.shipId).col),.25);
  const lanes=wakeLanes;
  for(const a of lanes.values())a.length=0;
  for(const t of WAKE){const k=t.s+"/"+t.b+"/"+t.t.x;let a=lanes.get(k);if(!a)lanes.set(k,a=[]);a.push(t);}
  GTR.n=0;
  const sh=G.ship,ca=Math.cos(sh.a),sa=Math.sin(sh.a),eS=shipZ(G.zoom)/G.zoom;
  const node=(arr,i)=>{
    const t=arr[i],u=clamp(t.life/t.max,0,1),u4=u*u*u*u;
    /* те же пики, что у 2D: ореол f1, ядро f2 (ядро гаснет к половине жизни) */
    let f1=(u*u*.08+u4*.10)*t.k,f2=(u4*.22+u4*u4*.34)*t.k;
    /* у кормы пик не выше 2D (два мазка lighter: f1 + ядро u³·.26+u⁶·.30): гауссов пик
       ядро·1.25 + ореол·2.3 выходил в полтора раза ярче, белел и белил гондолы (п.3).
       Меряем от сопла в единицах корпуса (по жизни нельзя: у кормы и в двух корпусах
       за ней — одни и те же 5 % жизни); дальше 26 единиц — как было */
    const tp=t.t,tx=sh.x+(tp.x*ca-tp.y*t.s*sa)*eS,ty=sh.y+(tp.x*sa+tp.y*t.s*ca)*eS;
    const u3=u*u*u,pk=f2*1.25+f1*2.3,q2=f1+(u3*.26+u3*u3*.30)*t.k,g=1-clamp((Math.hypot(t.x-tx,t.y-ty)/eS-20)/6,0,1);
    if(pk>q2){const s=1-(1-q2/pk)*g*g*(3-2*g);f1*=s;f2*=s;}
    const w1=(2.2+(1-u)*4.5)*SZ,w2=Math.max(.8,(1+(1-u)*.6)*SZ);
    const hw=w1*1.25+1;
    const p=arr[Math.max(0,i-1)],q=arr[Math.min(arr.length-1,i+1)];
    let dx=zx(q.x)-zx(p.x),dy=zy(q.y)-zy(p.y);const l=Math.hypot(dx,dy)||1;dx/=l;dy/=l;
    return {x:zx(t.x),y:zy(t.y),nx:-dy*hw,ny:dx*hw,a:f2*1.25,col,k:w2*.5/hw,h:f1*2.3,wx:t.x*.07,wy:t.y*.07,wn:.9};
  };
  for(const arr of lanes.values()){
    if(arr.length<2)continue;
    let A=node(arr,0);
    for(let i=1;i<arr.length;i++){const B=node(arr,i);gtrLane(A,B);A=B;}
  }
  gtrDraw(pass,"gwk");
}
/* ── дроны (G4) ──
   Те же машины и то же положение по часам (dronePos), тот же цвет груза; лучше,
   чем семь отрезков полилинии и два круга:
   · хвост — одна гладкая лента по шестнадцати точкам, сужается и гаснет по длине,
     без изломов на стыках;
   · машина — огонёк: ядро и ореол в цвет груза у гружёной, тусклая искра у порожней;
   · аварийная лампа того, кто стоит в ремонте, светит и дышит, а не мигает кругом. */
const DRONE_SEG=16;
function gpuDrones(zx,zy,Z){
  const list=G.drones||[];if(!list.length)return;
  const pass=gpuScene();if(!pass)return;
  const now=clockNow(),k=clamp(Z,.7,1.8),rings=[];
  GTR.n=0;GEN.n=0;
  const grey=[150,170,180];
  for(const d of list){
    if((d.sx!==G.sx||d.sy!==G.sy)&&d.mkt&&d.mkt.sx===G.sx&&d.mkt.sy===G.sy&&!d.down){
      droneNormalize(d,now);
      const g=droneGuestPos(d,now);if(!g)continue;
      const c=genCol((RES[d.res]&&RES[d.res].col)||"#cfe3ea");
      genPush(zx(g.x),zy(g.y),zx(g.x),zy(g.y),(g.loaded?1.5:1.1)*k,(g.loaded?3:1.6)*k,g.loaded?.9:.5,1,g.loaded?c:[.67,.73,.77],g.loaded?.2:0);
      continue;
    }
    if(d.sx!==G.sx||d.sy!==G.sy)continue;
    droneNormalize(d,now);
    const P=dronePos(d,now,G.sys),x=zx(P.x),y=zy(P.y);
    if(x<-60||x>W+60||y<-60||y>H+60)continue;
    const hex=(RES[d.res]&&RES[d.res].col)||"#cfe3ea",c=genCol(hex);
    if(d.down>now){
      const pu=.5+.5*Math.sin(now*.004),amb=[242/255,178/255,92/255];
      genPush(x,y,x,y,1.8,3+pu*2.5,.35+pu*.55,1,amb,.25+pu*.3);
      rings.push([3,x,y,6.5+pu*2,0,.6,2.5,242,178,92,.1+pu*.2]);
      continue;
    }
    /* хвост: шестнадцать точек за те же 2.6 с */
    const pts=[];
    for(let i=0;i<DRONE_SEG;i++){const q=dronePos(d,now-i*(DRONE_TAIL_MS/DRONE_SEG),G.sys);pts.push([zx(q.x),zy(q.y)]);}
    const c255=P.loaded?hex2rgb(hex):grey;
    const node=i=>{
      const u=1-i/(DRONE_SEG-1),p=pts[Math.max(0,i-1)],q=pts[Math.min(DRONE_SEG-1,i+1)];
      let dx=q[0]-p[0],dy=q[1]-p[1];const l=Math.hypot(dx,dy)||1;dx/=l;dy/=l;
      const hw=(P.loaded?1.9:1.3)*(.35+.65*u)*1.6+1;
      const a=(P.loaded?.5:.26)*u*u;
      return {x:pts[i][0],y:pts[i][1],nx:-dy*hw,ny:dx*hw,a,col:c255,k:.45,h:a*.35};
    };
    let A=node(0);
    for(let i=1;i<DRONE_SEG;i++){const B=node(i);gtrLane(A,B);A=B;}
    if(P.loaded)genPush(x,y,x,y,1.7*k,3.4*k,.95,1,c,.3);
    else genPush(x,y,x,y,1.2*k,1.8*k,.55,1,[.67,.73,.77],0);
  }
  gtrDraw(pass,"gdt");
  if(rings.length)gpuShapes(pass,rings,{blend:"add"});
  genDraw(pass,"gdn");
}
/* ── факел сопла (G4) ──
   Та же геометрия (сопла в масштабе корпуса, длина от пульса, косметика «Сороки»:
   цвета, длина, ширина, двойной факел, кольцо); лучше, чем три градиентных
   треугольника и радиальное пятно:
   · поперёк — гауссов профиль, а не треугольник с кромкой; к хвосту факел
     сужается и остывает по трём цветам косметики;
   · газ течёт: шум сносится вдоль струи, а у оси стоят ударные «ромбы» —
     яркие узлы сверхзвуковой струи, неподвижные относительно сопла;
   · ядро сопла — тон 1−exp, без плоского белого пятна. */
const GEX={f:new Float32Array(20*8),n:0,u:new Float32Array(12),nat:1};
const GEX_WGSL=`
struct U{a:vec4f,b:vec4f,c:vec4f};
@group(0) @binding(0) var<uniform> u:U;
@group(0) @binding(1) var<storage,read> eb:array<vec4f>;
struct VO{@builtin(position) p:vec4f,@location(0) @interpolate(flat) k:u32};
@vertex fn vs(@builtin(vertex_index) vi:u32,@builtin(instance_index) ii:u32)->VO{
  var c=array(vec2f(-1.,-1.),vec2f(1.,-1.),vec2f(1.,1.),vec2f(-1.,-1.),vec2f(1.,1.),vec2f(-1.,1.));
  let k=ii*5u;let v0=eb[k];let v1=eb[k+1u];
  let h=v1.x*.85+v1.y*3.2;let ctr=v0.xy-v0.zw*v1.x*.75;
  let q=(ctr+c[vi]*h)*u.b.x;
  var o:VO;o.p=vec4f(q.x/u.a.x*2.-1.,1.-q.y/u.a.y*2.,0.,1.);o.k=k;return o;}
fn eh(p:vec2f)->f32{var q=fract(vec3f(p.xyx)*.1031);q=q+dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
fn en(p:vec2f)->f32{let i=floor(p);let f=fract(p);let w=f*f*(3.-2.*f);
  return mix(mix(eh(i),eh(i+vec2f(1.,0.)),w.x),mix(eh(i+vec2f(0.,1.)),eh(i+vec2f(1.,1.)),w.x),w.y);}
/* вихрь шума: поток вдоль ротора потенциала — без стоков, газ крутится, а не толпится */
fn curl(p:vec2f)->vec2f{let e=.3;
  return vec2f(en(p+vec2f(0.,e))-en(p-vec2f(0.,e)),en(p-vec2f(e,0.))-en(p+vec2f(e,0.)))/(2.*e);}
/* лестница температур: бело-голубое ядро → жёлтый → оранжевый → тёмно-красный. Свой
   цвет косметики ведёт ту же лестницу своими ступенями */
fn lad(T:f32,c0:vec3f,c1:vec3f,c2:vec3f,nat:bool)->vec3f{
  let hb=select(mix(vec3f(1.),c0,.6),vec3f(.74,.86,1.),nat);
  let ye=select(mix(c0,c1,.45),vec3f(1.,.8,.34),nat);
  let orn=select(c1,vec3f(1.,.45,.12),nat);
  let dr=select(c2*.45,vec3f(.42,.06,.025),nat);
  var c=mix(dr*.3,dr,smoothstep(.08,.25,T));
  c=mix(c,orn,smoothstep(.25,.45,T));c=mix(c,ye,smoothstep(.45,.66,T));
  return mix(c,hb,smoothstep(.72,.95,T));}
@fragment fn fs(i:VO)->@location(0) vec4f{
  let v0=eb[i.k];let v1=eb[i.k+1u];let v2=eb[i.k+2u];let v3=eb[i.k+3u];let v4=eb[i.k+4u];
  let p=i.p.xy/u.b.x;let d=p-v0.xy;let ax=-v0.zw;let pr=vec2f(-ax.y,ax.x);
  let s0=dot(d,ax);let q0=dot(d,pr);let L=max(v1.x,1.);let R=v1.y;let wk=v1.z;let thr=v1.w;let t=v3.w;
  let nat=v2.w>.5;
  /* шлейф течёт: две октавы вихря, снос вниз по потоку; у сопла струя тугая, к хвосту — рвётся */
  let sc=R*2.6;let kk=clamp(s0/L,0.,1.7);
  let fa=vec2f(s0/sc-t*2.5,q0/sc);
  let cv=curl(fa)+.5*curl(fa*2.1+vec2f(5.2,1.3)-vec2f(t*2.5,0.));
  let amp=R*smoothstep(.05,.9,kk)*(.15+.55*kk);
  let s=s0+cv.x*amp*.35;let q=q0+cv.y*amp;
  let k=clamp(s/L,0.,1.7);
  let w=max(R*wk*(.5+1.05*k),.6);
  let dens=exp(-(q*q)/(w*w)*1.4)*smoothstep(-R*.35,R*.25,s);
  var e=vec3f(0.);var sa=0.;var sm=vec3f(0.);
  if(s>-R){
    /* горячо у оси и у сопла; пятна жара бегут с потоком */
    let n=en(vec2f(s/R*.7-t*3.,q/R*.9));
    let axis=exp(-(q*q)/(w*w*.5));
    let T=clamp(pow(1.-min(k,1.),.9)*axis*(.8+.35*n),0.,1.);
    let dia=1.+.35*exp(-(q*q)/(w*w*.1))*(1.-k)*pow(.5+.5*cos(s/R*4.6),3.);
    let tail=1.-smoothstep(.7,1.08,k);
    e=e+lad(T,v2.rgb,v3.rgb,v4.rgb,nat)*(.12+2.6*T*T*T)*dens*dia*tail*thr;
    /* остывший газ — дым: тонкий, со стороны звезды светлее; не глушит того, что за ним */
    let ws=w*1.25;let dsm=exp(-(q*q)/(ws*ws)*1.2);
    sa=clamp(dsm*smoothstep(.5,.95,k)*(1.-smoothstep(1.15,1.65,k))*(.55+.6*n)*.3*thr,0.,.3);
    let nb=normalize(vec3f(pr*clamp(q/ws,-1.,1.)*.85+cv*.25,.55));
    let Ls=normalize(vec3f(normalize(u.b.yz-p),.3));
    sm=vec3f(.3,.29,.28)*(.06+u.c.rgb*max(dot(nb,Ls),0.)*.9)*sa;
  }
  /* кольцо косметики — на середине факела, движется с пульсом */
  if(v4.w>.5){let rq=vec2f((s-L*.45)/(R*.55),q/(R*1.1));let rl=abs(length(rq)-1.);
    e=e+v3.rgb*.35*thr*exp(-rl*rl*40.);}
  /* ядро сопла — бело-голубое, выше единицы: светит лестницей мипов, своего ореола нет */
  let dn=length(d)/(R*.9);
  e=e+select(mix(vec3f(1.),v2.rgb,.5),vec3f(.8,.9,1.),nat)*exp(-dn*dn*4.)*1.5*thr;
  return vec4f(sm+e,sa);
}`;
/* X — чей список: свой факел (GEX) или факелы пиратов (13-pirates) */
function gexPush(px,py,dx,dy,L,R,wk,thr,C0,C1,C2,t,ring,X){
  X=X||GEX;const f=X.f,o=X.n*20;if(o+20>f.length)return;
  f[o]=px;f[o+1]=py;f[o+2]=dx;f[o+3]=dy;f[o+4]=L;f[o+5]=R;f[o+6]=wk;f[o+7]=thr;
  f[o+8]=C0[0]/255;f[o+9]=C0[1]/255;f[o+10]=C0[2]/255;f[o+11]=X.nat;
  f[o+12]=C1[0]/255;f[o+13]=C1[1]/255;f[o+14]=C1[2]/255;f[o+15]=t;
  f[o+16]=C2[0]/255;f[o+17]=C2[1]/255;f[o+18]=C2[2]/255;f[o+19]=ring?1:0;X.n++;
}
function gpuExhaust(zx,zy,Z,thr){
  if(thr<=0)return;
  const pass=gpuScene();if(!pass)return;
  const sh=G.ship,h=hullOf(G.shipId),ca=Math.cos(sh.a),sa=Math.sin(sh.a);
  const SZ=shipZ(Z),cx0=zx(sh.x),cy0=zy(sh.y);
  const CX=(typeof cosmExhaust==="function")?cosmExhaust():null;
  const cc=s=>s.split(",").map(Number);
  const C0=cc(CX?CX.col[0]:"255,246,222"),C1=cc(CX?CX.col[1]:"255,178,96"),C2=cc(CX?CX.col[2]:"255,96,48");
  const kL=CX?CX.len:1,kW=CX?CX.wide:1,shape=CX?CX.shape:"plain";
  /* свой цвет косметики — своя лестница; штатный — лестница температур как есть */
  GEX.nat=(!CX||CX.col.join("|")==="255,246,222|255,178,96|255,96,48")?1:0;
  GEX.n=0;
  for(const e of h.eng){
    const px=cx0+(e.x*ca-e.y*sa)*SZ,py=cy0+(e.x*sa+e.y*ca)*SZ;
    const R=Math.max(2.5,e.r*SZ*2.2),puls=.82+.18*Math.sin(G.t*.55+e.x);
    const L=R*(7.5+3.5*puls)*thr*kL;   /* L4: шлейф длиннее — хвост остывает до дыма */
    gpuHaze(px,py,-ca,-sa,L*(shape==="twin"?1.1:1),R*(shape==="twin"?1.6:1),.8*thr);   /* L4: марево за соплом */
    if(shape==="twin"){
      gexPush(px-sa*R*.55,py+ca*R*.55,ca,sa,L,R,kW,thr,C0,C1,C2,G.t*.05,false);
      gpuLight(px-ca*R,py-sa*R,px-ca*R,py-sa*R,C1[0]/255,C1[1]/255,C1[2]/255,R*6,thr*1.4);
      gexPush(px+sa*R*.55,py-ca*R*.55,ca,sa,L,R,kW,thr,C0,C1,C2,G.t*.05,false);
    }else gexPush(px,py,ca,sa,L,R,kW,thr,C0,C1,C2,G.t*.05,shape==="ring");
    /* L3: свой факел подсвечивает корму */
    if(shape!=="twin")gpuLight(px-ca*R,py-sa*R,px-ca*R,py-sa*R,C1[0]/255,C1[1]/255,C1[2]/255,R*6,thr*1.4);
  }
  gexDraw(pass,GEX,"gex",zx,zy);
}
/* список факелов — одним вызовом; key — свои буферы: две записи в один буфер за кадр
   легли бы обе последней */
function gexDraw(pass,X,key,zx,zy){
  if(!X.n)return;
  const U=GPUBufferUsage,d=GPU.dev,uu=GEX.u;
  const sc=(typeof starRGB==="function")?starRGB():[255,244,214],sm=Math.max(1,sc[0],sc[1],sc[2]);
  const ub=gpuBuf(key+".u3",48,U.UNIFORM|U.COPY_DST);uu[0]=GPU.bw;uu[1]=GPU.bh;uu[2]=W;uu[3]=H;uu[4]=DPR;
  uu[5]=zx(0);uu[6]=zy(0);uu[8]=sc[0]/sm;uu[9]=sc[1]/sm;uu[10]=sc[2]/sm;d.queue.writeBuffer(ub,0,uu);
  const eb=gpuBuf(key+".e",X.f.byteLength,U.STORAGE|U.COPY_DST);d.queue.writeBuffer(eb,0,X.f,0,X.n*20);
  const P=gpuPipe("gex",GEX_WGSL,"over");   /* over: дым заслоняет, огонь — сложением (альфа 0) */
  pass.setPipeline(P);pass.setBindGroup(0,gpuBind(key,P,[ub,eb]));pass.draw(6,X.n);
}
/* ── свет звезды на корпусе (G4) ──
   Корпус рисуется кистью 2D (сотни штрихов — это вектор), но свет на нём — от
   звезды, а не запечённый сверху-слева: слой поверх (gpuOver) берёт альфу уже
   нарисованного кадра как маску корабля. Маска читается как рельеф: у кромки
   поверхность уходит от глаза (нормаль ложится в плоскость кадра), в середине
   смотрит на нас. Свет — Ламберт по этой нормали от звезды, почти в плоскости
   системы: ярче всего узкая скользящая полоса освещённого борта, к лицевым
   граням спадает; не обводка по всему контуру. Дальний борт и дальняя половина
   уходят в тень заметно — объём держит перепад, а не линия. */
const GHL=new Float32Array(16),GHL_M=512;
const GHL_WGSL=GPU_PL_WGSL+`
fn plOcc(q:vec2f)->f32{let V=fu.v;let uv=(q*fu.res.x/fu.res.z-V[3].xy)/V[3].z;
  if(any(uv<vec2f(0.))||any(uv>vec2f(1.))){return 0.;}
  return textureSampleLevel(t0,smp,uv,0.).a;}
fn ga(uv:vec2f,d:vec2f)->vec2f{
  return vec2f(textureSampleLevel(t0,smp,uv+vec2f(d.x,0.),0.).a-textureSampleLevel(t0,smp,uv-vec2f(d.x,0.),0.).a,
               textureSampleLevel(t0,smp,uv+vec2f(0.,d.y),0.).a-textureSampleLevel(t0,smp,uv-vec2f(0.,d.y),0.).a);}
fn field(p:vec2f,uv0:vec2f)->vec4f{
  let V=fu.v;let uv=(p*fu.res.x/fu.res.z-V[3].xy)/V[3].z;let c=V[0].xy;let rad=V[0].z;let sd=normalize(V[1].xy);let col=V[2].rgb;let k=V[2].w;
  let dp=p-c;let rr=length(dp);
  if(rr>rad||any(uv<vec2f(0.))||any(uv>vec2f(1.))){return vec4f(0.);}
  let u1=vec2f(fu.res.x/fu.res.z/V[3].z);
  let c4=textureSampleLevel(t0,smp,uv,0.);let a=c4.a;
  if(a<.02){return vec4f(0.);}
  /* рельеф маски: узкий шаг даёт кромку, широкий — скат борта к середине */
  let L=normalize(vec3f(sd,.22));
  let g=-ga(uv,u1*1.1);let tl=clamp(length(g),0.,.98);
  let n=vec3f(g/max(length(g),1e-4)*tl,sqrt(1.-tl*tl));
  let gb=-(ga(uv,u1*3.)*.5+ga(uv,u1*7.)*.5);let tb=clamp(length(gb)*1.2,0.,.9);
  let nb=vec3f(gb/max(length(gb),1e-4)*tb,sqrt(1.-tb*tb));
  let side=dot(dp,sd)/rad;
  let fade=1.-smoothstep(rad*.8,rad,rr);
  /* кромка: только грани, смотрящие на звезду (cos³), и только у самого края */
  let rim=pow(max(dot(n,L),0.),3.)*pow(1.-n.z,1.5);
  /* борт: скат к звезде теплеет, к лицевым граням спадает */
  let body=max(dot(nb,L),0.)*(1.-nb.z)*.3;
  /* огни светят сами и в тень не падают: яркое насыщенное (ходовые, маяки) — мимо света и тени */
  let rgb=c4.rgb/max(a,1e-3);let mx=max(rgb.r,max(rgb.g,rgb.b));let sat=(mx-min(rgb.r,min(rgb.g,rgb.b)))/max(mx,1e-3);
  let own=1.-smoothstep(.3,.55,sat*mx);
  let lit=col*(rim*1.1+body)*a*fade*k*own;
  /* тень: перепад через весь корпус, дальний скат — глубже */
  let away=max(-dot(nb.xy,sd),0.)*(1.-nb.z);
  let dark=clamp(.66*smoothstep(-.4,.6,-side)+.3*away,0.,.7)*a*fade*k*own;
  /* L3: точечный свет по альбедо корпуса — и на теневом борту: разрыв светит и туда */
  let pl=plAt(p,normalize(nb+vec3f(n.xy*.6,0.)),rad*.3,rad*.2)*own*fade;
  /* металл — жёсткий блик-штрих со стороны звезды; стекло отражает звезду */
  let Hs=normalize(L+vec3f(0.,0.,1.));
  let met=(1.-smoothstep(.1,.28,sat))*smoothstep(.12,.35,mx)*own;
  let gls=glassOf(c4)*own;
  let spec=(col*met*(1.-gls)*1.3*pow(max(dot(n,Hs),0.),40.)+mix(col,vec3f(1.),.6)*gls*glassSpec(glassG(uv,u1*6.),Hs))*a*fade*k;
  return vec4f(lit+rgb*a*pl+spec,dark);
}`;
function gpuHullLight(x,y,sx,sy,Z,sys,id){
  if(!sys||!GPU.on)return;
  const h=hullOf(id||G.shipId),sc=shipScaleAt(Z);   /* id — чужой корпус (союзник, 12a) */
  const rad=Math.max(h.nose||0,-(h.tail||0),(h.bw||8)*3)*1.25*sc+6;
  const dx=sx-x,dy=sy-y;if(!dx&&!dy)return;
  const pass=gpuOver();if(!pass)return;
  /* маска — копия кусочка слоя 2D вокруг корабля, сделанная СРАЗУ: сам слой
     до отправки этого прохода ещё раз перезальют (gpuWorld), и проход увидел бы
     уже слой без корпуса */
  const S=GHL_M,d=GPU.dev;
  if(!GPU.T.hm){GPU.T.hm=d.createTexture({size:[S,S],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});GPU.V.hm=null;}
  if(!GPU.V.hm)GPU.V.hm=GPU.T.hm.createView();
  const ox=Math.max(0,Math.min(GPU.bw-S,Math.round((x-rad)*DPR))),oy=Math.max(0,Math.min(GPU.bh-S,Math.round((y-rad)*DPR)));
  const cw=Math.min(S,GPU.bw),ch=Math.min(S,GPU.bh),e=d.createCommandEncoder();
  e.copyTextureToTexture({texture:GPU.T.front,origin:[ox,oy]},{texture:GPU.T.hm},[cw,ch]);d.queue.submit([e.finish()]);
  const c=(typeof starRGB==="function")?starRGB():[255,244,214],m=Math.max(1,c[0],c[1],c[2]);
  const U=GHL;U[0]=x;U[1]=y;U[2]=rad;U[4]=dx;U[5]=dy;U[8]=c[0]/m;U[9]=c[1]/m;U[10]=c[2]/m;U[11]=1;
  U[12]=ox;U[13]=oy;U[14]=S;
  gpuField(pass,"ghl",GHL_WGSL,U,[{view:GPU.V.hm},{view:GPU.V.lt}]);
}
