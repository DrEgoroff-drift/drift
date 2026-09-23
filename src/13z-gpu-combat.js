/* ══════════════ болты и лучи боя на видеокарте (G4, docs/DESIGN-gpu.md) ══════════════
   Те же снаряды G.shots (свои — бирюза, чужие — сурик) и те же следы лучей
   G.beams (цвет, толщина, четыре кадра жизни); лучше, чем линия stroke и её
   полупрозрачная копия потолще:
   · энергия светится: белое ядро по оси и цветной ореол, спадающий по экспоненте,
     а не две ровные полосы с кромкой;
   · болт летит: голова раскалена, хвост остывает к нулю по длине следа;
   · луч упирается: в конце — вспышка удара, у ствола — вспышка выхода;
   · наложения тонируются 1−exp: залп не выгорает в плоское белое пятно. */
const GEN={f:new Float32Array(12*64),n:0,u:new Float32Array(8),col:new Map()};
const GEN_WGSL=`
struct U{a:vec4f,b:vec4f};
@group(0) @binding(0) var<uniform> u:U;
@group(0) @binding(1) var<storage,read> eb:array<vec4f>;
struct VO{@builtin(position) p:vec4f,@location(0) @interpolate(flat) k:u32};
@vertex fn vs(@builtin(vertex_index) vi:u32,@builtin(instance_index) ii:u32)->VO{
  var c=array(vec2f(0.,0.),vec2f(1.,0.),vec2f(1.,1.),vec2f(0.,0.),vec2f(1.,1.),vec2f(0.,1.));
  let k=ii*3u;let v0=eb[k];let v1=eb[k+1u];let m=v1.y*5.+v1.x*3.+2.;
  let lo=min(v0.xy,v0.zw)-m;let hi=max(v0.xy,v0.zw)+m;
  let q=mix(lo,hi,c[vi])*u.b.x;
  var o:VO;o.p=vec4f(q.x/u.a.x*2.-1.,1.-q.y/u.a.y*2.,0.,1.);o.k=k;return o;}
@fragment fn fs(i:VO)->@location(0) vec4f{
  let v0=eb[i.k];let v1=eb[i.k+1u];let v2=eb[i.k+2u];
  let p=i.p.xy/u.b.x;let a=v0.xy;let b=v0.zw;let ab=b-a;
  let t=clamp(dot(p-a,ab)/max(dot(ab,ab),1e-4),0.,1.);let d=length(p-a-ab*t);
  let cw=max(v1.x,.5);let gr=max(v1.y,.8);let col=v2.rgb;
  let fade=pow(mix(v1.w,1.,t),1.6);
  let core=exp(-(d*d)/(cw*cw));let glow=exp(-d/gr);
  var e=(mix(col,vec3f(1.),.45)*core*1.5+col*glow*.7)*fade;
  /* вспышка на голове (удар или раскалённая голова болта) и у ствола */
  let fh=length(p-b);let fs=length(p-a);
  e=e+(col*exp(-fh/(gr*1.6))*.9+vec3f(1.)*exp(-(fh*fh)/(cw*cw*5.)))*v2.w;
  e=e+col*exp(-fs/(gr*1.1))*.5*v1.w*v2.w;
  let I=vec3f(1.)-exp(-e*v1.z*1.2);
  return vec4f(I,max(I.r,max(I.g,I.b)));
}`;
/* цвет из css-строки ("#rrggbb" или "rgba(r,g,b,a)") → [r,g,b,a] 0..1, с кэшем */
function genCol(s){
  let c=GEN.col.get(s);if(c)return c;
  if(s[0]==="#"){const h=hex2rgb(s);c=[h[0]/255,h[1]/255,h[2]/255,1];}
  else{const m=s.match(/[\d.]+/g)||[255,255,255,1];c=[m[0]/255,m[1]/255,m[2]/255,m[3]==null?1:+m[3]];}
  GEN.col.set(s,c);return c;
}
function genPush(x0,y0,x1,y1,cw,gr,inten,tailA,c,flare){
  let f=GEN.f;const o=GEN.n*12;
  if(o+12>f.length){const g=new Float32Array(f.length*2);g.set(f);f=GEN.f=g;}
  f[o]=x0;f[o+1]=y0;f[o+2]=x1;f[o+3]=y1;f[o+4]=cw;f[o+5]=gr;f[o+6]=inten;f[o+7]=tailA;
  f[o+8]=c[0];f[o+9]=c[1];f[o+10]=c[2];f[o+11]=flare;GEN.n++;
}
const GEN_MINE=[127/255,230/255,216/255],GEN_FOE=[1,107/255,87/255];
function gpuCombatEnergy(zx,zy,Z){
  if(!(G.shots&&G.shots.length)&&!(G.beams&&G.beams.length))return;
  const pass=gpuScene();if(!pass)return;
  GEN.n=0;
  const zk=clamp(Z,.5,2);
  if(G.beams)for(const b of G.beams){
    const a=clamp(b.life/BEAM_LIFE,0,1),c=genCol(b.col);
    const x0=zx(b.x1),y0=zy(b.y1),x1=zx(b.x2),y1=zy(b.y2);
    if(Math.max(x0,x1)<-40||Math.min(x0,x1)>W+40||Math.max(y0,y1)<-40||Math.min(y0,y1)>H+40)continue;
    genPush(x0,y0,x1,y1,b.w*zk*.55,b.w*zk*1.5,a*c[3],.8,c,a);
  }
  for(const s of G.shots){
    const x=zx(s.x),y=zy(s.y);
    if(x<-40||x>W+40||y<-40||y>H+40)continue;
    const cz=clamp(Z,.6,1.6);
    genPush(x-s.vx*2.4*Z,y-s.vy*2.4*Z,x,y,1.05*cz,2.4*cz,1,0,s.mine?GEN_MINE:GEN_FOE,.55);
  }
  if(!GEN.n)return;
  const U=GPUBufferUsage,d=GPU.dev,uu=GEN.u;
  const ub=gpuBuf("gen.u",32,U.UNIFORM|U.COPY_DST);uu[0]=GPU.bw;uu[1]=GPU.bh;uu[2]=W;uu[3]=H;uu[4]=DPR;d.queue.writeBuffer(ub,0,uu);
  const eb=gpuBuf("gen.e",GEN.f.byteLength,U.STORAGE|U.COPY_DST);d.queue.writeBuffer(eb,0,GEN.f,0,GEN.n*12);
  const P=gpuPipe("gen",GEN_WGSL,"add");
  pass.setPipeline(P);pass.setBindGroup(0,gpuBind("gen",P,[ub,eb]));pass.draw(6,GEN.n);
}
