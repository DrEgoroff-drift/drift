/* ══════════════ болты и лучи боя на видеокарте (G4, docs/DESIGN-gpu.md) ══════════════
   Те же снаряды G.shots (свои — бирюза, чужие — сурик) и те же следы лучей
   G.beams (цвет, толщина, четыре кадра жизни); лучше, чем линия stroke и её
   полупрозрачная копия потолще:
   · энергия светится: белое ядро по оси и цветной ореол, спадающий по экспоненте,
     а не две ровные полосы с кромкой;
   · болт летит: голова раскалена, хвост остывает к нулю по длине следа;
   · луч упирается: в конце — вспышка удара, у ствола — вспышка выхода;
   · наложения тонируются по старшему каналу: залп не выгорает в белое, и цвет
     (чей выстрел) держится и в ядре, и в ореоле; белая — только нить по оси.
   Тем же отрезком — факел ракеты (раскалён у сопла, гаснет к хвосту) и огонь
   мины (точка нулевой длины: ядро и ореол, пульс взведённой). Зона мины — мягкое
   поле к кромке, а не волосяная окружность. Разрыв ракеты — огненный шар с
   рваной кромкой и остыванием белый → жёлтый → вишнёвый внутри ударной волны,
   а не кольцо с кругом. */
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
  /* цвет = чей выстрел: ядро и ореол в цвете, белая только нить по самой оси */
  let cs=max(col-vec3f(min(col.r,min(col.g,col.b))*.6),vec3f(0.));let hs=cs/max(max(cs.r,max(cs.g,cs.b)),1e-3);
  var e=(col*core*1.2+hs*glow*1.2+vec3f(pow(core,6.)*.7))*fade;
  /* вспышка на голове (удар или раскалённая голова болта) и у ствола */
  let fh=length(p-b);let fs=length(p-a);
  e=e+(hs*exp(-fh/(gr*1.6))*.9+vec3f(exp(-(fh*fh)/(cw*cw*1.5))*.6))*v2.w;
  e=e+col*exp(-fs/(gr*1.1))*.5*v1.w*v2.w;
  /* тон по старшему каналу: яркость сжимается, отношение каналов (оттенок) — нет */
  e=e*v1.z*1.2;let m=max(e.r,max(e.g,e.b));
  let I=e*(1.-exp(-m))/max(m,1e-4);
  /* L2: что светит сверх единицы — ядро луча, голова болта, вспышка удара — остаётся
     выше неё: сцена rgba16f, плечо сведения и узкое свечение берут это как свет */
  let x=e*max(m-1.2,0.)/max(m,1e-4)*.8;
  return vec4f(I+x,max(I.r,max(I.g,I.b)));
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
const GEN_MINE=[127/255,230/255,216/255],GEN_FOE=[1,107/255,87/255],GEN_BATT=[150/255,230/255,1];
function gpuCombatEnergy(zx,zy,Z){
  const any=L=>L&&L.length;
  if(!any(G.shots)&&!any(G.beams)&&!any(G.gmines)&&!any(G.msl)&&!any(G.mslFx)&&!any(G.battFx)&&!any(G.loot))return;
  const pass=gpuScene();if(!pass)return;
  GEN.n=0;
  const zk=clamp(Z,.5,2),zones=[];
  if(G.gmines)for(const m of G.gmines){
    const x=zx(m.x),y=zy(m.y),R=MINE_R*Z;
    if(x<-R||x>W+R||y<-R||y>H+R)continue;
    const on=m.arm<=0,c=on?genCol(m.foe?"#ff6b57":"#ffb25c"):genCol("#8fa0b0"),mz=clamp(Z,.5,1.8);
    genPush(x,y,x,y,1.7*mz,2.6*mz,on?(.6+.4*Math.abs(Math.sin(G.t*.16))):.35,1,c,on?.35:0);
    /* зона: мягкое поле, густеющее к кромке, и сама кромка тонкой светящейся нитью */
    zones.push([1,x,y,R*.7,0,0,R*.3,c[0]*255,c[1]*255,c[2]*255,.035],[3,x,y,R,0,.5,2.2,c[0]*255,c[1]*255,c[2]*255,.13]);
  }
  if(G.msl)for(const m of G.msl){
    const x=zx(m.x),y=zy(m.y);
    if(x<-60||x>W+60||y<-60||y>H+60)continue;
    const P=m.foe?MSL_PAINT_FOE:(MSL_PAINT[m.kind]||MSL_PAINT.plain),c=genCol(P.head),lw=Math.max(1,(m.big?3.6:2.6)*Z);
    genPush(x-Math.cos(m.a)*P.len*Z*1.3,y-Math.sin(m.a)*P.len*Z*1.3,x,y,lw*.42,lw*1.1,c[3],0,c,m.kind==="decoy"?.1:.45);
  }
  if(G.beams)for(const b of G.beams){
    const a=clamp(b.life/BEAM_LIFE,0,1),c=genCol(b.col);
    const x0=zx(b.x1),y0=zy(b.y1),x1=zx(b.x2),y1=zy(b.y2);
    if(Math.max(x0,x1)<-40||Math.min(x0,x1)>W+40||Math.max(y0,y1)<-40||Math.min(y0,y1)>H+40)continue;
    genPush(x0,y0,x1,y1,b.w*zk*.55,b.w*zk*1.5,a*c[3],.8,c,a);
  }
  /* разряд батареи с грунта (21d): тот же луч, гаснет за четырнадцать кадров */
  if(G.battFx)for(const f of G.battFx){
    const a=Math.max(0,f.t/14);
    genPush(zx(f.x1),zy(f.y1),zx(f.x2),zy(f.y2),Math.max(.8,1.3*a),2.6+2*(1-a),a*.9,.85,GEN_BATT,a*1.2);
  }
  /* свет маячка контейнера: коробка стоит в своём свете (цвет категории), огонёк — в 2D поверх */
  if(G.loot)for(const L of G.loot){
    const x=zx(L.x),y=zy(L.y);
    if(x<-40||x>W+40||y<-40||y>H+40)continue;
    const pulse=.45+.55*Math.abs(Math.sin(G.t*.05+L.spin));
    const s=clamp(Z,.6,1.6)*7;genPush(x,y,x,y,.5,s*.8,pulse*.7,1,genCol(PART_KINDS[L.part.kind].col),0);
  }
  for(const s of G.shots){
    const x=zx(s.x),y=zy(s.y);
    if(x<-40||x>W+40||y<-40||y>H+40)continue;
    const cz=clamp(Z,.6,1.6);
    genPush(x-s.vx*2.4*Z,y-s.vy*2.4*Z,x,y,1.05*cz,2.4*cz,1,0,s.mine?GEN_MINE:GEN_FOE,.55);
  }
  if(zones.length)gpuShapes(pass,zones,{blend:"add"});
  gpuBooms(pass,zx,zy,Z);
  genDraw(pass,"gen");
}
/* накопленные genPush — одним вызовом; key — своё имя буфера на каждого, кто рисует в кадре */
function genDraw(pass,key){
  if(!GEN.n)return;
  const U=GPUBufferUsage,d=GPU.dev,uu=GEN.u;
  const ub=gpuBuf("gen.u",32,U.UNIFORM|U.COPY_DST);uu[0]=GPU.bw;uu[1]=GPU.bh;uu[2]=W;uu[3]=H;uu[4]=DPR;d.queue.writeBuffer(ub,0,uu);
  const eb=gpuBuf(key+".e",GEN.f.byteLength,U.STORAGE|U.COPY_DST);d.queue.writeBuffer(eb,0,GEN.f,0,GEN.n*12);
  const P=gpuPipe("gen",GEN_WGSL,"over");   /* over: свет луча заслоняет фон под собой — оттенок не плывёт в цвет туманности */
  pass.setPipeline(P);pass.setBindGroup(0,gpuBind(key,P,[ub,eb]));pass.draw(6,GEN.n);
}
/* разрывы ракет: до четырнадцати за кадр одним полем; V[i] = (x, y, радиус волны, остаток жизни) */
const GBM=new Float32Array(60);
const GBM_WGSL=`
fn bh(p:vec2f)->f32{var q=fract(vec3f(p.xyx)*.1031);q=q+dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
fn bn(p:vec2f)->f32{let i=floor(p);let f=fract(p);let w=f*f*(3.-2.*f);
  return mix(mix(bh(i),bh(i+vec2f(1.,0.)),w.x),mix(bh(i+vec2f(0.,1.)),bh(i+vec2f(1.,1.)),w.x),w.y);}
fn field(p:vec2f,uv:vec2f)->vec4f{
  var e=vec3f(0.);let n=i32(fu.v[14].x);
  for(var k=0;k<n;k++){
    let V=fu.v[k];let dp=p-V.xy;let d=length(dp);let rs=V.z;let a=V.w;
    if(d>rs*1.6+8.){continue;}
    /* ударная волна: тонкая, светлая, гаснет с остатком жизни */
    let sw=1.2+rs*.06;let ring=exp(-((d-rs)*(d-rs))/(sw*sw))*a*.75;
    /* огненный шар: рваная кромка по шуму направления, остывает с возрастом */
    let dir=dp/max(d,1e-3);let sd=V.x*.013+V.y*.017;
    let nn=bn(dir*2.6+vec2f(sd,-sd))*.65+bn(dir*6.+vec2f(-sd,sd)+d*.08)*.35;
    let rf=rs*(.62+.38*nn)*(.55+.45*a);
    let fb=pow(1.-smoothstep(0.,rf,d),1.4);
    let T=fb*(.35+.9*a*a);
    let hot=mix(mix(vec3f(.55,.08,.04),vec3f(1.,.45,.12),smoothstep(.1,.45,T)),mix(vec3f(1.,.82,.4),vec3f(1.,.98,.92),smoothstep(.75,1.1,T)),smoothstep(.4,.8,T));
    e=e+hot*T*1.7+vec3f(1.,.76,.52)*ring+vec3f(1.,.5,.25)*exp(-d/(rs*.5+2.))*a*.35;
  }
  let I=vec3f(1.)-exp(-e);
  /* L2: сердце шара светит выше единицы — белое по плечу и со своим ореолом */
  return vec4f(I+max(e-vec3f(1.5),vec3f(0.))*.6,max(I.r,max(I.g,I.b)));
}`;
function gpuBooms(pass,zx,zy,Z){
  const L=G.mslFx;if(!L||!L.length)return;
  let n=0;
  for(const f of L){
    if(n>=14)break;
    const a=Math.max(0,f.t/18),x=zx(f.x),y=zy(f.y),r=(1-a)*34*Z+4;
    if(x<-r*2||x>W+r*2||y<-r*2||y>H+r*2)continue;
    GBM[n*4]=x;GBM[n*4+1]=y;GBM[n*4+2]=r;GBM[n*4+3]=a;n++;
  }
  if(!n)return;
  GBM[56]=n;
  gpuField(pass,"gbm",GBM_WGSL,GBM,[],{blend:"add"});
}
