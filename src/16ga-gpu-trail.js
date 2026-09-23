/* ══════════════ шлейф корабля на видеокарте (G4, docs/DESIGN-gpu.md) ══════════════
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
    const hw=Math.max(1,t.r*SZ*(2.4-u*1.3)*CW*1.35)*TRAIL_HALO.w*.5+1;
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
