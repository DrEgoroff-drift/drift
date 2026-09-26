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
  if(!any(G.shots)&&!any(G.beams)&&!any(G.gmines)&&!any(G.msl)&&!any(G.mslFx)&&!any(G.battFx)&&!any(G.loot)&&!BFX.length)return;
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
    gpuLight(x0,y0,x1,y1,c[0],c[1],c[2],26*zk+10,a*c[3]*1.8);   /* L3: луч красит ближний борт */
  }
  /* разряд батареи с грунта (21d): тот же луч, гаснет за четырнадцать кадров */
  if(G.battFx)for(const f of G.battFx){
    const a=Math.max(0,f.t/14);
    genPush(zx(f.x1),zy(f.y1),zx(f.x2),zy(f.y2),Math.max(.8,1.3*a),2.6+2*(1-a),a*.9,.85,GEN_BATT,a*1.2);
    gpuLight(zx(f.x1),zy(f.y1),zx(f.x2),zy(f.y2),GEN_BATT[0],GEN_BATT[1],GEN_BATT[2],30,a*.9);
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
    const sc=s.mine?GEN_MINE:GEN_FOE;gpuLight(x,y,x,y,sc[0],sc[1],sc[2],16*cz,.4);
  }
  if(zones.length)gpuShapes(pass,zones,{blend:"add"});
  gpuBooms(pass,zx,zy,Z);
  gpuBursts(pass,zx,zy,Z);   /* гибель корабля (L4): под снарядами — они ярче и резче */
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
    /* огненный шар: рваная кромка по шуму направления, остывает с возрастом */
    let dir=dp/max(d,1e-3);let sd=V.x*.013+V.y*.017;
    let nn=bn(dir*2.6+vec2f(sd,-sd))*.65+bn(dir*6.+vec2f(-sd,sd)+d*.08)*.35;
    let rf=rs*(.62+.38*nn)*(.55+.45*a);
    let fb=pow(1.-smoothstep(0.,rf,d),1.4);
    let T=fb*(.35+.9*a*a);
    let hot=mix(mix(vec3f(.55,.08,.04),vec3f(1.,.45,.12),smoothstep(.1,.45,T)),mix(vec3f(1.,.82,.4),vec3f(1.,.98,.92),smoothstep(.75,1.1,T)),smoothstep(.4,.8,T));
    e=e+hot*T*1.7+vec3f(1.,.5,.25)*exp(-d/(rs*.5+2.))*a*.35;
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
    /* L3: разрыв вспыхивает на всех корпусах рядом: первые ~100 мс — белая вспышка вдвое ярче
       и шире, потом тёплое тление */
    const fl=clamp((f.t-12)/6,0,1),fk=fl*fl;
    gpuLight(x,y,x,y,1,.72+.22*fk,.42+.4*fk,r*2.2+24+40*fk,3.6*a+.6+30*fk);
    /* ударная волна — не нарисованное кольцо, а преломление (L4, 08b) */
    gpuShock(x,y,r,1.5+r*.08,2.2*a);
  }
  if(!n)return;
  GBM[56]=n;
  gpuField(pass,"gbm",GBM_WGSL,GBM,[],{blend:"add"});
}
/* ── гибель корабля (L4) ──
   Только картинка: мир о ней не знает, в сохранение не попадает, случайность — своя
   (номер разрыва по золотому сечению, шейдер берёт из него всё остальное). Возраст — по
   G.t (кадры, 60 в секунду): на паузе разрыв стоит. Слои в одном поле, снизу вверх:
   дым (освещён звездой с одной стороны, непрозрачность ≤ .45), обломки (свет звезды и
   вспышки, раскалённые кромки), огненный шар по лестнице температур ~0.6 с, искры
   штрихами с размытием движения. Свечение — выше единицы, через лестницу мипов (L2);
   ударная волна — преломление (gpuShock), вспышка — точечный свет на корпусах (L3) */
const BFX=[],GBX=new Float32Array(60);let BFX_N=0;
function burstFx(p,r){
  BFX.push({x:p.x,y:p.y,vx:p.vx||0,vy:p.vy||0,r:r||50,t0:G.t,seed:((++BFX_N)*.6180339887)%1*89.3+3.7,sys:G.sx+","+G.sy});
  if(BFX.length>6)BFX.shift();
}
const GBX_WGSL=`
fn xh(p:vec2f)->f32{var q=fract(vec3f(p.xyx)*.1031);q=q+dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
fn xn(p:vec2f)->f32{let i=floor(p);let f=fract(p);let w=f*f*(3.-2.*f);
  return mix(mix(xh(i),xh(i+vec2f(1.,0.)),w.x),mix(xh(i+vec2f(0.,1.)),xh(i+vec2f(1.,1.)),w.x),w.y);}
fn xf(p:vec2f)->f32{return xn(p)*.5+xn(p*2.03+vec2f(3.1,7.7))*.3+xn(p*4.1+vec2f(9.2,1.4))*.2;}
fn lad(T:f32)->vec3f{
  var c=mix(vec3f(.12,.02,.01),vec3f(.42,.06,.025),smoothstep(.08,.25,T));
  c=mix(c,vec3f(1.,.45,.12),smoothstep(.25,.45,T));c=mix(c,vec3f(1.,.8,.34),smoothstep(.45,.66,T));
  return mix(c,vec3f(.74,.86,1.),smoothstep(.72,.95,T));}
fn field(p:vec2f,uv:vec2f)->vec4f{
  let n=i32(fu.v[0].z);let sp=fu.v[0].xy;let sc=fu.v[1].rgb;
  var col=vec3f(0.);var al=0.;var em=vec3f(0.);
  for(var b=0;b<6;b++){
    if(b>=n){break;}
    let A=fu.v[2+b*2];let B=fu.v[3+b*2];
    let c=A.xy;let R=A.z;let a=A.w;let sd=B.x;let vel=B.yz;
    let dp=p-c;let d=length(dp);
    if(d>R*9.){continue;}
    let Ls=normalize(vec3f(normalize(sp-p),.5));
    /* дым: клубы расширяются и редеют; сторона к звезде светлее, от неё — тень; изнутри
       его ещё греет шар */
    let heat=smoothstep(0.,.035,a)*exp(-a/.42)*(1.-smoothstep(.6,1.1,a));
    let rsm=R*(.95+2.*(1.-exp(-a/.9)));let ps=(dp-vel*a*.4)/rsm;
    let wq=vec2f(xf(ps*1.7+sd),xf(ps*1.7+sd+5.3))-.5;
    let sb=xf(ps*2.4+wq*1.6+vec2f(sd*1.3,-a*.2));
    let rq=length(ps)/(.62+.55*sb);
    if(rq<1.){
      let op=smoothstep(.1,.45,a)*(1.-smoothstep(1.4,4.2,a))*.45;
      let sa=clamp((1.-smoothstep(.45,1.,rq))*(.55+.6*sb)*op,0.,.45);
      let g=vec2f(xf(ps*2.4+wq*1.6+vec2f(sd*1.3+.05,-a*.2))-sb,xf(ps*2.4+wq*1.6+vec2f(sd*1.3,-a*.2+.05))-sb)*20.;
      let nb=normalize(vec3f(ps*.95-g*.35,sqrt(max(1.-dot(ps,ps)*.85,.06))));
      let lit=sc*max(dot(nb,Ls),0.)*1.5+vec3f(.07,.075,.09)+vec3f(1.,.38,.1)*heat*1.6*(1.-rq);
      col=col*(1.-sa)+vec3f(.55,.52,.5)*lit*sa;al=al+sa*(1.-al);
    }
    /* обломки: плоские куски обшивки кувыркаются, грань ловит то звезду, то вспышку */
    for(var j=0;j<7;j++){
      let fj=f32(j);let h1=xh(vec2f(fj*1.7,sd));let h2=xh(vec2f(sd,fj+3.1));let h3=xh(vec2f(fj+7.3,sd*1.7));let h4=xh(vec2f(sd+fj,9.1));
      let an=(fj+h1*.8)*.8976;let dr=vec2f(cos(an),sin(an));
      let pos=c+dr*R*(1.2+3.2*h2)*(1.-exp(-a*.8))/.8+vel*a;
      let sz=R*(.07+.12*h3);
      let ang=h4*6.283+a*(h1-.5)*9.;let cs=vec2f(cos(ang),sin(ang));
      let lq=p-pos;let l2=vec2f(dot(lq,cs),dot(lq,vec2f(-cs.y,cs.x)));
      let hb=vec2f(sz,sz*(.3+.45*h2));
      let qd=abs(l2)-hb+vec2f(abs(l2.y)*(h1-.5)*.6,0.);
      let ca=h2*6.283+fj;let nc=vec2f(cos(ca),sin(ca));
      let sdf=max(length(max(qd,vec2f(0.)))+min(max(qd.x,qd.y),0.),dot(l2,nc)-sz*(.05+.45*h4));
      let cov=clamp(.6-sdf,0.,1.);
      if(cov<=0.){continue;}
      let tl=a*(2.+4.*h4)+h3*6.283;
      let nf=normalize(vec3f(cs*sin(tl),.3+abs(cos(tl))));
      let fl=exp(-a/.13)*5.+exp(-a/.6)*.5;let toC=c-pos;
      let fla=vec3f(1.,.62,.32)*max(dot(nf,normalize(vec3f(toC,R*.6))),0.)*fl/(1.+dot(toC,toC)/(R*R*3.));
      let alb=vec3f(.44,.43,.45)*(.65+.55*h1);
      let edge=smoothstep(-1.2,0.,sdf);
      var dc=alb*(sc*(max(dot(nf,Ls),0.)*.9+.12)+vec3f(.03)+fla)+vec3f(1.,.32,.07)*(.15+.85*edge)*exp(-a/.28)*1.2;
      col=col*(1.-cov)+dc*cov;al=al+cov*(1.-al);
    }
    /* огненный шар: клубы в растущих координатах, кромка рваная; жар гаснет за ~0.6 с —
       бело-голубое сердце уходит в жёлтое, оранжевое, тёмно-красное */
    if(heat>0.){
      let rf=R*(.5+1.25*(1.-exp(-a/.1)));let pn=dp/rf;
      let w2=vec2f(xf(pn*2.2+sd*2.),xf(pn*2.2+sd*2.+7.7))-.5;
      let bl=xf(pn*3.+w2*1.8+vec2f(sd,a*1.5));
      let rr=length(pn)/(.7+.5*bl);
      let T=clamp(heat*pow(max(1.-rr,0.),.55)*(.78+.45*bl),0.,1.);
      em=em+lad(T)*(.06+2.6*T*T*T)*(1.-smoothstep(.75,1.,rr));
    }
    /* искры: раскалённые капли, штрих — путь за окно выдержки (размытие движения). Не звезда из
       равных лучей (L4): 3–4 длинных тяжёлых штриха под своими углами, остальные — короткая
       мелочь, вылетающая с задержкой из разных точек шара, половина — двумя струями; каждая
       капля чуть загибает, штрих ярче у головы и гаснет к хвосту */
    if(a<1.3){
      let nl=3+i32(step(.5,xh(vec2f(sd,.7))));
      let j0=xh(vec2f(sd,2.9))*6.2832;let j1=j0+2.+xh(vec2f(4.4,sd))*2.2;
      for(var i=0;i<26;i++){
        let fi=f32(i);let h1=xh(vec2f(fi,sd));let h2=xh(vec2f(sd,fi+3.1));let h3=xh(vec2f(fi+7.,sd+1.));let h4=xh(vec2f(sd+2.3,fi*1.3));
        let lg=i<nl;
        var an=h1*6.2832;var spd=R*(3.5+7.5*h2*h2);var k=2.+2.*h4;var win=.024+.03*h3;var life=.35+.55*h3;var dl=.08*h4*h4;
        if(lg){an=(fi+.55*h1)*6.2832/f32(nl)+j0*.37;spd=R*(9.+9.*h2);k=1.1+.5*h4;win=.028+.034*h3;life=.75+.45*h3;dl=0.;}
        else if(h4>.45){an=select(j0,j1,h1>.5)+(h2-.5)*1.7;}
        let ae=a-dl;if(ae<=0.||ae>life){continue;}
        let dr=vec2f(cos(an),sin(an));let pr=vec2f(-dr.y,dr.x)*(h3-.5)*R*select(3.,1.2,lg);
        let a0=max(ae-win,0.);let c0=c+vec2f(h3-.5,h2-.5)*R*select(.9,.25,lg)+dr*R*select(.15,.5,lg);   /* длинные рвутся с кромки шара, а не из точки */
        let P1=c0+dr*spd*(1.-exp(-ae*k))/k+pr*ae*ae+vel*a;let P0=c0+dr*spd*(1.-exp(-a0*k))/k+pr*a0*a0+vel*(a-(ae-a0));
        let ab=P1-P0;let q=clamp(dot(p-P0,ab)/max(dot(ab,ab),1e-4),0.,1.);let ds=length(p-P0-ab*q);
        if(ds>3.){continue;}
        let tt=1.-ae/life;let ln=length(ab);
        let wd=select(.22,.42,lg);let tail=mix(.2,1.,q*q);
        em=em+lad(.3+.45*tt)*(.4+3.*tt*tt)*select(.85+1.7*h3,1.5,lg)*tail*exp(-ds*ds/wd)*clamp(3./max(ln,1.),select(.35,.6,lg),1.);
        /* голова капли — раскалённая точка: штрих читается летящей искрой, а не проведённой чертой */
        let dh=p-P1;em=em+lad(.45+.5*tt)*exp(-dot(dh,dh)/select(.5,.9,lg))*tt*select(1.,1.6,lg);
      }
    }
  }
  return vec4f(col+em,min(al,1.));
}`;
function gpuBursts(pass,zx,zy,Z){
  const key=G.sx+","+G.sy;let n=0;
  for(let i=BFX.length-1;i>=0;i--){const b=BFX[i];if(b.sys!==key||G.t-b.t0>270||G.t<b.t0)BFX.splice(i,1);}
  if(!BFX.length)return;
  const sz=shipScaleAt(Z);
  for(const b of BFX){
    const af=G.t-b.t0,a=af/60,x=zx(b.x+b.vx*af),y=zy(b.y+b.vy*af),R=b.r*sz;
    if(x<-R*9||x>W+R*9||y<-R*9||y>H+R*9)continue;
    const o=8+n*8;GBX[o]=x;GBX[o+1]=y;GBX[o+2]=R;GBX[o+3]=a;GBX[o+4]=b.seed;GBX[o+5]=b.vx*Z*60;GBX[o+6]=b.vy*Z*60;n++;
    /* L3: вспышка — белая первые ~0.1 с, потом тёплое тление шара */
    const fk=Math.exp(-a/.1),hk=clamp(1-a/.6,0,1);
    gpuLight(x,y,x,y,1,.7+.25*fk,.4+.45*fk,R*4+60*fk,26*fk+3*hk*hk);
    /* ударная волна — кольцо преломления, бежит и гаснет за ~1 с */
    if(a<1.1)gpuShock(x,y,R*(1.3+6*a),2+R*.3+R*.4*a,14*Math.pow(1-a/1.1,1.2));
    if(n>=6)break;
  }
  if(!n)return;
  const c=(typeof starRGB==="function")?starRGB():[255,244,214],m=Math.max(1,c[0],c[1],c[2]);
  GBX[0]=zx(0);GBX[1]=zy(0);GBX[2]=n;GBX[4]=c[0]/m;GBX[5]=c[1]/m;GBX[6]=c[2]/m;
  gpuField(pass,"gbx",GBX_WGSL,GBX,[],{blend:"over"});
}
