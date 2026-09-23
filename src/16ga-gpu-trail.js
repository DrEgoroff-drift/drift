/* ══════════════ шлейф и факел корабля на видеокарте (G4, docs/DESIGN-gpu.md) ══════════════
   Те же ленты по соплам из TRAIL, тот же цвет по возрасту (ядро → акцент корпуса) и
   та же толщина; лучше, чем в 2D:
   · лента — одна полоса треугольников с общими нормалями в узлах, а не отрезки
     встык: ни колбасок на стыках, ни щелей на изгибе;
   · возраст — у каждой точки свой, без двадцати четырёх ступеней спада;
   · поперёк — гауссов профиль газа: тонкое ядро и широкий ореол одной формулой,
     а не два stroke с резкой кромкой. */
const GTR={f:new Float32Array(8*6*256),n:0,u:new Float32Array(8)};
const GTR_WGSL=`
struct U{a:vec4f,b:vec4f};
@group(0) @binding(0) var<uniform> u:U;
@group(0) @binding(1) var<storage,read> vb:array<vec4f>;
struct VO{@builtin(position) p:vec4f,@location(0) s:f32,@location(1) a:f32,@location(2) c:vec3f,@location(3) k:f32};
@vertex fn vs(@builtin(vertex_index) vi:u32)->VO{
  let v0=vb[vi*2u];let v1=vb[vi*2u+1u];let q=v0.xy*u.b.x;
  var o:VO;o.p=vec4f(q.x/u.a.x*2.-1.,1.-q.y/u.a.y*2.,0.,1.);
  o.s=v0.z;o.a=v0.w;o.c=v1.rgb;o.k=v1.w;return o;}
@fragment fn fs(i:VO)->@location(0) vec4f{
  let s=i.s;let core=exp(-(s*s)/(i.k*i.k)*1.6);let halo=exp(-s*s*2.)*.3;
  let I=i.a*(core+halo);return vec4f(i.c*I,I);}`;
function gtrPush(x,y,s,a,c,k){
  let f=GTR.f;const o=GTR.n*8;
  if(o+8>f.length){const g=new Float32Array(f.length*2);g.set(f);f=GTR.f=g;}
  f[o]=x;f[o+1]=y;f[o+2]=s;f[o+3]=a;f[o+4]=c[0]/255;f[o+5]=c[1]/255;f[o+6]=c[2]/255;f[o+7]=k;GTR.n++;
}
/* ленты горячих струй; холодные дымки маневровых и корешки у сопел — кругами кита */
function gpuTrail(zx,zy,Z){
  const pass=gpuScene();if(!pass)return;
  const T0=trailTint(G.shipId,G.mods.engine|0),T=(typeof cosmTrail==="function")?cosmTrail(T0):T0;
  const SZ=shipZ(Z),CW=trailChar(G.shipId).w,K=TRAIL_HALO.core/TRAIL_HALO.w;
  const lanes={};
  for(const t of TRAIL){if(!t.hot)continue;const k=t.e+"/"+(t.b|0);(lanes[k]||(lanes[k]=[])).push(t);}
  GTR.n=0;const puffs=[];
  const node=(arr,i)=>{
    const t=arr[i],u=clamp(t.life/t.max,0,1);
    const a=Math.min(TRAIL_AMAX,Math.pow(u,TRAIL_LIFE.fall)*.30+u*u*u*u*.5);
    const col=u>.78?mixc(T.mid,T.core,(u-.78)/.22):mixc(T.edge,T.mid,u/.78);
    /* газ расходится: к хвосту лента шире (яркость и так гаснет с возрастом) */
    const hw=(Math.max(1,t.r*SZ*(2.4-u*1.3)*CW*1.35)*TRAIL_HALO.w*.5+1)*(1+(1-u)*1.6);
    const p=arr[Math.max(0,i-1)],q=arr[Math.min(arr.length-1,i+1)];
    let dx=zx(q.x)-zx(p.x),dy=zy(q.y)-zy(p.y);const l=Math.hypot(dx,dy)||1;dx/=l;dy/=l;
    return {x:zx(t.x),y:zy(t.y),nx:-dy*hw,ny:dx*hw,a,col};
  };
  for(const k in lanes){
    const arr=lanes[k];if(arr.length<2)continue;
    let A=node(arr,0);
    for(let i=1;i<arr.length;i++){
      const B=node(arr,i);
      const off=(A.x<-60&&B.x<-60)||(A.x>W+60&&B.x>W+60)||(A.y<-60&&B.y<-60)||(A.y>H+60&&B.y>H+60);
      if(!off){
        gtrPush(A.x-A.nx,A.y-A.ny,-1,A.a,A.col,K);gtrPush(A.x+A.nx,A.y+A.ny,1,A.a,A.col,K);gtrPush(B.x+B.nx,B.y+B.ny,1,B.a,B.col,K);
        gtrPush(A.x-A.nx,A.y-A.ny,-1,A.a,A.col,K);gtrPush(B.x+B.nx,B.y+B.ny,1,B.a,B.col,K);gtrPush(B.x-B.nx,B.y-B.ny,-1,B.a,B.col,K);
      }
      A=B;
    }
    /* добела раскалённый корешок у сопла */
    const f=arr[arr.length-1],x=zx(f.x),y=zy(f.y),r=Math.max(.8,f.r*SZ*1.3);
    if(x>-40&&x<W+40&&y>-40&&y<H+40)puffs.push([1,x,y,r,0,0,r*.8,T.core[0],T.core[1],T.core[2],.62]);
  }
  if(GTR.n){
    const U=GPUBufferUsage,d=GPU.dev;
    const ub=gpuBuf("gtr.u",32,U.UNIFORM|U.COPY_DST),uu=GTR.u;uu[0]=GPU.bw;uu[1]=GPU.bh;uu[2]=W;uu[3]=H;uu[4]=DPR;
    d.queue.writeBuffer(ub,0,uu);
    const vb=gpuBuf("gtr.v",GTR.f.byteLength,U.STORAGE|U.COPY_DST);d.queue.writeBuffer(vb,0,GTR.f,0,GTR.n*8);
    const P=gpuPipe("gtr",GTR_WGSL,"add");
    pass.setPipeline(P);pass.setBindGroup(0,gpuBind("gtr",P,[ub,vb]));pass.draw(GTR.n);
  }
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
/* ── факел сопла (G4) ──
   Та же геометрия (сопла в масштабе корпуса, длина от пульса, косметика «Сороки»:
   цвета, длина, ширина, двойной факел, кольцо); лучше, чем три градиентных
   треугольника и радиальное пятно:
   · поперёк — гауссов профиль, а не треугольник с кромкой; к хвосту факел
     сужается и остывает по трём цветам косметики;
   · газ течёт: шум сносится вдоль струи, а у оси стоят ударные «ромбы» —
     яркие узлы сверхзвуковой струи, неподвижные относительно сопла;
   · ядро сопла — тон 1−exp, без плоского белого пятна. */
const GEX={f:new Float32Array(20*8),n:0,u:new Float32Array(8)};
const GEX_WGSL=`
struct U{a:vec4f,b:vec4f};
@group(0) @binding(0) var<uniform> u:U;
@group(0) @binding(1) var<storage,read> eb:array<vec4f>;
struct VO{@builtin(position) p:vec4f,@location(0) @interpolate(flat) k:u32};
@vertex fn vs(@builtin(vertex_index) vi:u32,@builtin(instance_index) ii:u32)->VO{
  var c=array(vec2f(-1.,-1.),vec2f(1.,-1.),vec2f(1.,1.),vec2f(-1.,-1.),vec2f(1.,1.),vec2f(-1.,1.));
  let k=ii*5u;let v0=eb[k];let v1=eb[k+1u];
  let h=v1.x*.5+v1.y*2.5;let ctr=v0.xy-v0.zw*v1.x*.5;
  let q=(ctr+c[vi]*h)*u.b.x;
  var o:VO;o.p=vec4f(q.x/u.a.x*2.-1.,1.-q.y/u.a.y*2.,0.,1.);o.k=k;return o;}
fn eh(p:vec2f)->f32{var q=fract(vec3f(p.xyx)*.1031);q=q+dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
fn en(p:vec2f)->f32{let i=floor(p);let f=fract(p);let w=f*f*(3.-2.*f);
  return mix(mix(eh(i),eh(i+vec2f(1.,0.)),w.x),mix(eh(i+vec2f(0.,1.)),eh(i+vec2f(1.,1.)),w.x),w.y);}
@fragment fn fs(i:VO)->@location(0) vec4f{
  let v0=eb[i.k];let v1=eb[i.k+1u];let v2=eb[i.k+2u];let v3=eb[i.k+3u];let v4=eb[i.k+4u];
  let p=i.p.xy/u.b.x;let d=p-v0.xy;let ax=-v0.zw;let pr=vec2f(-ax.y,ax.x);
  let s=dot(d,ax);let q=dot(d,pr);let L=max(v1.x,1.);let R=v1.y;let wk=v1.z;let thr=v1.w;let t=v3.w;
  var e=vec3f(0.);
  let k=clamp(s/L,0.,1.);
  if(s>-R){
    let wq=max(R*.7*wk*(1.-k*.8),.6);
    let n=en(vec2f(s/R*.55-t*.9,q/R*.8));
    let prof=exp(-(q*q)/(wq*wq)*1.6)*pow(1.-k,1.4)*smoothstep(-R*.4,R*.3,s);
    let turb=mix(1.,.6+.8*n,smoothstep(.1,.5,k));
    let axis=exp(-(q*q)/(wq*wq*.12));
    let dia=1.+.45*axis*(1.-k)*pow(.5+.5*cos(s/R*4.6),3.);
    let temp=clamp(prof*1.2,0.,1.);
    let col=mix(mix(v4.rgb,v3.rgb,smoothstep(0.,.45,temp)),v2.rgb,smoothstep(.45,.95,temp));
    e=e+col*prof*turb*dia*.95*thr;
  }
  /* кольцо косметики — на середине факела, движется с пульсом */
  if(v4.w>.5){let rq=vec2f((s-L*.45)/(R*.55),q/(R*1.1));let rl=abs(length(rq)-1.);
    e=e+v3.rgb*.35*thr*exp(-rl*rl*40.);}
  /* ядро сопла */
  let dn=length(d)/(R*1.7);
  e=e+mix(vec3f(1.,1.,.98),v3.rgb,smoothstep(0.,.5,dn))*exp(-dn*dn*4.)*.9*thr;
  let I=vec3f(1.)-exp(-e*1.3);
  return vec4f(I,max(I.r,max(I.g,I.b)));
}`;
function gexPush(px,py,dx,dy,L,R,wk,thr,C0,C1,C2,t,ring){
  const f=GEX.f,o=GEX.n*20;if(o+20>f.length)return;
  f[o]=px;f[o+1]=py;f[o+2]=dx;f[o+3]=dy;f[o+4]=L;f[o+5]=R;f[o+6]=wk;f[o+7]=thr;
  f[o+8]=C0[0]/255;f[o+9]=C0[1]/255;f[o+10]=C0[2]/255;f[o+11]=0;
  f[o+12]=C1[0]/255;f[o+13]=C1[1]/255;f[o+14]=C1[2]/255;f[o+15]=t;
  f[o+16]=C2[0]/255;f[o+17]=C2[1]/255;f[o+18]=C2[2]/255;f[o+19]=ring?1:0;GEX.n++;
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
  GEX.n=0;
  for(const e of h.eng){
    const px=cx0+(e.x*ca-e.y*sa)*SZ,py=cy0+(e.x*sa+e.y*ca)*SZ;
    const R=Math.max(2.5,e.r*SZ*2.2),puls=.82+.18*Math.sin(G.t*.55+e.x);
    const L=R*(3.4+2.6*puls)*thr*kL;
    if(shape==="twin"){
      gexPush(px-sa*R*.55,py+ca*R*.55,ca,sa,L,R,kW,thr,C0,C1,C2,G.t*.05,false);
      gexPush(px+sa*R*.55,py-ca*R*.55,ca,sa,L,R,kW,thr,C0,C1,C2,G.t*.05,false);
    }else gexPush(px,py,ca,sa,L,R,kW,thr,C0,C1,C2,G.t*.05,shape==="ring");
  }
  if(!GEX.n)return;
  const U=GPUBufferUsage,d=GPU.dev,uu=GEX.u;
  const ub=gpuBuf("gex.u",32,U.UNIFORM|U.COPY_DST);uu[0]=GPU.bw;uu[1]=GPU.bh;uu[2]=W;uu[3]=H;uu[4]=DPR;d.queue.writeBuffer(ub,0,uu);
  const eb=gpuBuf("gex.e",GEX.f.byteLength,U.STORAGE|U.COPY_DST);d.queue.writeBuffer(eb,0,GEX.f,0,GEX.n*20);
  const P=gpuPipe("gex",GEX_WGSL,"add");
  pass.setPipeline(P);pass.setBindGroup(0,gpuBind("gex",P,[ub,eb]));pass.draw(6,GEX.n);
}
