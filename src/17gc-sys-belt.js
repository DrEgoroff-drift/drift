/* ══════════════ пояс в кадре системы (M824) ══════════════
   Пояс — не полоса через кадр, а сгустки по кольцу: каждый — свой кусок дуги со своей
   плотностью, шириной и сдвигом от средней орбиты; между ними камни редки. Сгустки
   выведены из seed-а пояса и живут на нём (как крошка beltDots) — хранить нечего.
   Камни — тела (сетки makeRock в пуле 24be, один вызов на кадр), гуще всего вокруг
   корабля: кто в кадре главный, у того и камни. Появляются и уходят прозрачностью,
   никогда не выскакивают. Далеко и между камнями — пыльная дымка поля gsy.belt
   (17g зовёт gsyBeltHaze), а не ровная светлая лента. */
const SBELT_ARC=560;
const sbss=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};   /* длина клетки дуги, в которой может лежать один сгусток */
function sbeltClumps(B){
  if(B.clumps)return B.clumps;
  const n=Math.max(8,Math.round(TAU*B.orbit/SBELT_ARC)),L=TAU*B.orbit/n,out=[];
  for(let i=0;i<n;i++){
    const r=rng(hashi(i,B.seed,0x8E17));
    const on=r()<.55,u=r(),sg=70+110*r(),ro=(r()-.5)*80,rw=34+30*r(),dn=.45+.55*r();
    out.push({on,s:(i+.2+.6*u)*L,sg,ro,rw,dn});
  }
  return B.clumps={n,L,c:out,C:TAU*B.orbit};
}
/* плотность пояса в точке мира: сгустки (вдоль дуги — гаусс, поперёк — свой) и тонкая подложка */
function sbeltDens(B,x,y){
  const K=sbeltClumps(B),r=Math.hypot(x,y),dr=r-B.orbit;
  if(Math.abs(dr)>200)return 0;
  let a=Math.atan2(y,x);if(a<0)a+=TAU;
  const s=a*B.orbit,i0=Math.floor(s/K.L);
  let d=.1*Math.exp(-(dr/70)*(dr/70));
  for(let j=-1;j<=1;j++){
    const c=K.c[((i0+j)%K.n+K.n)%K.n];if(!c.on)continue;
    let ds=s-c.s;if(ds>K.C/2)ds-=K.C;else if(ds<-K.C/2)ds+=K.C;
    const q=(dr-c.ro)/c.rw,p=ds/c.sg;
    d+=c.dn*Math.exp(-p*p-q*q);
  }
  return Math.min(d,1.2);
}
/* заготовки гранёных скал для рисунка без видеокарты: единичный радиус */
const ROCK_SHAPES=(function(){
  const out=[];
  for(let s=0;s<16;s++){
    const r=rng(hashi(s,7,0x0CCA)),n=8+Math.floor(r()*7),p=[];
    for(let k=0;k<n;k++){
      const t=k/n*TAU, q=.55+r()*.6;
      p.push([Math.cos(t)*q,Math.sin(t)*q]);
    }
    out.push(p);
  }
  return out;
})();
/* камни по ячейкам сетки мира: у каждой ячейки свой порог, камень есть, где плотность
   (с прибавкой у корабля) его перешла — с мягким краем, это и есть его прозрачность */
/* три слоя по глубине (M825): камень лежит на своей глубине под камерой сверху — ближний крупнее и
   бежит быстрее, дальний мельче и отстаёт; параллакс настоящий, его даёт проекция. Слой — своя
   сетка и своё зерно: [глубина в долях D, клетка, наименьший радиус, тон] */
const SBELT_LAY=[[.2,28,1.6,.7],[0,34,2.2,1],[-.16,64,3.4,1.08]];
const SBELT_BAS={right:[1,0,0],up:[0,-1,0],fwd:[0,0,1]};
/* скол и выемка у крупных: вершины за плоскостью скола ложатся на неё (ровная грань), у выемки — внутрь */
function sbeltChip(m,seed){
  const r=rng(seed),V=m.verts,dir=()=>{const z=r()*2-1,t=r()*TAU,c=Math.sqrt(1-z*z);return [Math.cos(t)*c,Math.sin(t)*c,z];};
  let mr=0;for(const v of V)mr=Math.max(mr,Math.hypot(v[0],v[1],v[2]));
  for(let k=0;k<2;k++){const n=dir(),d=(.58+.18*r())*mr;
    for(const v of V){const t=v[0]*n[0]+v[1]*n[1]+v[2]*n[2];if(t>d){v[0]-=n[0]*(t-d);v[1]-=n[1]*(t-d);v[2]-=n[2]*(t-d);}}}
  const u=dir();
  for(const v of V){const l=Math.hypot(v[0],v[1],v[2])||1,c=(v[0]*u[0]+v[1]*u[1]+v[2]*u[2])/l,k=1-.24*sbss(.8,1,c);
    v[0]*=k;v[1]*=k;v[2]*=k;}
  return m;
}
function drawBeltRocks(ox,oy,B,Z,shx,shy){
  if(Z<.24)return;
  const zf=clamp((Z-.24)/.1,0,1);
  const cx0=(W/2-ox)/Z,cy0=(H/2-oy)/Z;
  const M=Math.min(W,H),sx=ox+shx*Z,sy=oy+shy*Z;
  const cap=Math.round(320*G.opts.gfx.draw);
  const p3ok=GPU.on&&GPU.enc&&!GPU.overPass;
  let cam=null,ub=null,ms=1,nf=0;const LIST=SBELT_LIST;LIST.length=0;
  for(let L=0;L<3;L++){
    const [dz,C,r0,tone]=SBELT_LAY[L],sc=1/(1+dz),zs=Z*sc;   /* zs — масштаб слоя на экране */
    const half=(Math.max(W,H)/2/zs)*G.opts.gfx.draw+C;
    const c0x=Math.floor((cx0-half)/C), c1x=Math.floor((cx0+half)/C);
    const c0y=Math.floor((cy0-half)/C), c1y=Math.floor((cy0+half)/C);
    for(let cx=c0x;cx<=c1x;cx++)for(let cy=c0y;cy<=c1y;cy++){
      if(LIST.length>=cap)break;
      const mx=(cx+.5)*C,my=(cy+.5)*C;
      if(Math.abs(Math.hypot(mx,my)-B.orbit)>200)continue;
      const hh=hashi(cx,cy,B.seed+L*7919),r=rng(hh);
      const wx=(cx+r())*C, wy=(cy+r())*C;
      const x=W/2+(wx-cx0)*zs, y=H/2+(wy-cy0)*zs;
      if(x<-120||x>W+120||y<-120||y>H+120)continue;
      /* к оси полосы гуще: сгустки плюс ровная подложка у средней орбиты */
      const dr=(Math.hypot(wx,wy)-B.orbit)/85;
      const den=sbeltDens(B,wx,wy)+.2*Math.exp(-dr*dr*1.6);if(den<.02)continue;
      /* у корабля гуще: кольцо сгущения вокруг него, под самим кораблём — просвет */
      const dk=Math.hypot(x-sx,y-sy)/M;
      const act=(.55+1.3*Math.exp(-((dk-.22)/.18)*((dk-.22)/.18)))*(.3+.7*sbss(.03,.09,dk));
      const nr=Math.exp(-((dk-.2)/.17)*((dk-.2)/.17))*sbss(.03,.09,dk);
      const t=r(),v=den*act+Math.exp(-dr*dr/1.7)*nr;
      const al=sbss(t*.9+.05,t*.9+.17,v)*zf;
      if(al<.01)continue;
      /* размеры — степенной закон: на 8–12 мелких один крупный; в густом сгустке изредка глыба */
      const big=den>.7&&r()<.05;
      const rad=big?24+r()*20:Math.min(26,r0*Math.pow(1-r()*.985,-.55));
      if(rad*zs<.9)continue;
      LIST.push({x,y,wx,wy,wz:0,L,rad,al,hh,big,tone,r1:r(),r2:r(),r3:r(),r4:r(),ore:r()<.2});
    }
  }
  if(!LIST.length)return;
  if(p3ok){
    if(!B.rm){B.rm=[];for(let k=0;k<12;k++){const m=makeRock(hashi(B.seed,k,0x50C),1);B.rm.push(k>=8?sbeltChip(m,hashi(B.seed,k,0xC41)):m);}}
    const D=2400/Z;
    cam=B.cam3||(B.cam3={x:0,y:0,z:0});cam.x=cx0;cam.y=cy0;cam.z=-D;
    const sys=G.sys,stl=sysStyle(sys),sc0=hex2rgb(sys.cls.col),scol=[sc0[0]*.6+92,sc0[1]*.6+90,sc0[2]*.6+88];
    brockReset(cam);
    /* светило чуть над плоскостью — камень виден освещённым боком, а не ровно в полутень */
    ub=brockCam(cam,SBELT_BAS,Z*D,scol,stl.neb[0],stl.neb[1],Math.hypot(cx0,cy0)*.2+150,1e7);
    ms=brockMs();BROCK.ni=0;
    for(let pass=0;pass<2;pass++)for(const o of LIST){
      if((o.al>=.99)===(pass===1))continue;
      const m=B.rm[o.big||o.rad>9?8+o.hh%4:o.hh%8],tn=SBELT_TINT[(o.hh>>>8)%SBELT_TINT.length],rk=SBELT_RK;
      for(let j=0;j<3;j++)rk[j]=m.rock[j]*tn[j]*o.tone;
      const ore=o.ore?[150+o.r1*80,110+o.r2*60,64+o.r3*34]:rk;
      /* ближние вертятся с периодом 20–60 с, средние втрое, дальние вшестеро медленнее */
      const w=(o.r3<.5?-1:1)*TAU/(60*(20+40*o.r4))/[6,3,1][o.L];
      brockPut(cam,m,o.wx,o.wy,SBELT_LAY[o.L][0]*D,o.rad,1,o.r1*TAU,o.r2*TAU+G.t*w,o.al>=.99?1:o.al,rk,ore,false);
      /* треть камней вытянута 1:1.6–1:2.5 — столбцы поворота умножаются на оси масштаба */
      if((o.hh>>>4)%3===0){const e=1.6+.9*o.r4,ex=Math.pow(e,.6),ey=Math.pow(e,-.4),I=BROCK.I,k=(BROCK.ni-1)*28;
        for(const q of [4,8,12]){I[k+q]*=ex;I[k+q+1]*=ey;I[k+q+2]*=ey;}}
      if(pass)nf++;
    }
    const p3=brockBegin(ms),n1=BROCK.ni-nf;
    brockDraw(p3,ub,0,n1,false,ms);
    brockDraw(p3,ub,n1,nf,true,ms);
    brockEnd(ms);
    return;
  }
  /* без видеокарты — гранёные силуэты, свет со стороны светила */
  for(const o of LIST){
    const P=ROCK_SHAPES[o.hh%ROCK_SHAPES.length],s=o.rad*Z;
    const ll=Math.hypot(o.wx,o.wy)||1,lx=-o.wx/ll,ly=-o.wy/ll;
    const rot=o.r1*TAU+G.t*(o.r3-.5)*.004,cr=Math.cos(rot),sr=Math.sin(rot);
    const g=.42+o.r2*.6,col=[54+96*g,53+92*g,60+98*g];
    ctx.save();ctx.globalAlpha=o.al;ctx.translate(o.x,o.y);ctx.rotate(rot);ctx.scale(s,s);
    for(let i=0;i<P.length;i++){
      const A=P[i],Bp=P[(i+1)%P.length];
      const mx=(A[0]+Bp[0])*.5,my=(A[1]+Bp[1])*.5,ml=Math.hypot(mx,my)||1;
      const nx=(mx/ml)*cr-(my/ml)*sr, ny=(mx/ml)*sr+(my/ml)*cr;
      const li=clamp(.2+(nx*lx+ny*ly)*.9,.07,1.15);
      ctx.fillStyle="rgb("+(col[0]*li|0)+","+(col[1]*li|0)+","+(col[2]*li|0)+")";
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(A[0],A[1]);ctx.lineTo(Bp[0],Bp[1]);
      ctx.closePath();ctx.fill();
    }
    ctx.restore();
  }
}
const SBELT_LIST=[];
/* тон породы: холодный серый, тёплый бурый, пыльная олива, сизый — по кругу, не в одну сторону */
const SBELT_TINT=[[.86,.92,1.08],[1.1,.96,.82],[.98,1.,.84],[.9,.9,1.02],[1.04,.94,.9],[1,1,1]],SBELT_RK=[0,0,0];
/* Крошка пояса неподвижна: угол и радиус каждого камешка заданы seed-ом пояса
   и не меняются никогда. Таблица считается один раз и живёт на самом поясе, а он
   живёт ровно столько, сколько система в кэше. */
function beltDots(B){
  if(B.dots)return B.dots;
  const r=rng(B.seed),t=new Float64Array(570);
  for(let i=0;i<190;i++){t[i*3]=r()*TAU;t[i*3+1]=(r()-.5)*130;
    const a=t[i*3],rr=B.orbit+t[i*3+1];t[i*3+2]=sbeltDens(B,Math.cos(a)*rr,Math.sin(a)*rr);}
  return B.dots=t;
}
/* дымка пояса — поле во весь экран: подложка кольца и до двенадцати сгустков в кадре,
   вытянутых вдоль дуги; внутри — пыль шумом в координатах дуги (шов atan2 спрятан
   смешением двух разверток) */
const SBELT_HAZE_WGSL=`
fn sbh(p:vec2f)->f32{let h=fract(sin(dot(p,vec2f(127.1,311.7)))*43758.545);return h;}
fn sbn(p:vec2f)->f32{let i=floor(p);let f=p-i;let u=f*f*(3.-2.*f);
  return mix(mix(sbh(i),sbh(i+vec2f(1.,0.)),u.x),mix(sbh(i+vec2f(0.,1.)),sbh(i+vec2f(1.,1.)),u.x),u.y);}
fn sbf(p:vec2f)->f32{return sbn(p)*.5+sbn(p*2.03+vec2f(5.2,1.3))*.3+sbn(p*4.1+vec2f(2.7,8.1))*.2;}
fn field(p:vec2f,uv:vec2f)->vec4f{
  let c=fu.v[0];let d=p-c.xy;let r=length(d);let Z=c.w;
  let dr=(r-c.z)/Z;
  if(abs(dr)>230.){return vec4f(0.);}
  let tn=vec2f(-d.y,d.x)/max(r,1.);
  var m=.035*exp(-dr*dr/(70.*70.));
  for(var k=3;k<15;k++){let b=fu.v[k];if(b.z<=0.){break;}
    let q=p-b.xy;let rw=floor(b.w);let dn=fract(b.w)/.99;
    let al=dot(q,tn)/b.z;let ac=(dot(q,vec2f(tn.y,-tn.x)))/max(rw,1.);
    m=m+dn*exp(-al*al-ac*ac);}
  /* край сгустка рваный, а не гауссов: порог плотности гуляет шумом мира */
  let ne=sbf(d/Z/30.+vec2f(2.,7.))*.65+sbn(d/Z/8.+vec2f(5.,1.))*.35;
  m=m*smoothstep(.05,.3,m*1.3-(ne-.45)*1.2)*(.6+.8*sbf(d/Z/13.+vec2f(9.,4.)));
  let a1=atan2(d.y,d.x);let a2=atan2(-d.y,-d.x);
  let s1=a1*c.z/Z;let s2=a2*c.z/Z+fu.v[2].w;
  let w2=smoothstep(.3,.8,-cos(a1));
  let n1=sbf(vec2f(s1/120.,dr/50.)+vec2f(sbn(vec2f(s1/70.,dr/45.))*1.3,0.));
  let n2=sbf(vec2f(s2/120.,dr/50.)+vec2f(sbn(vec2f(s2/70.,dr/45.))*1.3,0.));
  let n=mix(n1,n2,w2);
  let g=mix(sbn(vec2f(s1/28.,dr/11.)),sbn(vec2f(s2/28.,dr/11.)),w2);
  /* клочья: маска в координатах мира, круглая — дымка рвётся, а не тянется лентой */
  let wq=d/Z/260.+vec2f(fu.v[2].w*.0001,3.);
  let pf=smoothstep(.2,.55,sbf(wq+vec2f(sbn(wq*1.7)*.8,sbn(wq*1.7+vec2f(4.,9.))*.8)));
  let dd=clamp(m,0.,1.3)*(.08+1.5*smoothstep(.25,.65,n)*pf)*(.8+.4*g);
  /* зерно пыли 2–4 px, ±.05 по яркости — дымка не разлита ровной заливкой */
  let gr=sbn(d/3.1)*.6+sbn(d/1.8+vec2f(7.,2.))*.4;
  let a0=clamp(dd*fu.v[1].w,0.,.5);let a=clamp(a0+.16*(gr-.5)*smoothstep(.0,.06,a0),0.,.5);
  return vec4f(fu.v[1].rgb*a,a);}`;
const SBELT_U=new Float32Array(60);
function gsyBeltHaze(pass,sys,ox,oy,Z){
  const B=sys.belt,K=sbeltClumps(B),U=SBELT_U;U.fill(0);
  U[0]=ox;U[1]=oy;U[2]=B.orbit*Z;U[3]=Z;
  const sc=hex2rgb(sys.cls.col);
  for(let i=0;i<3;i++)U[4+i]=(118*.62+sc[i]*.38)/255;
  U[7]=.40;U[11]=TAU*B.orbit*.5;
  /* сгустки в кадре — ближние к центру первыми */
  const pick=SBELT_PICK;pick.length=0;
  for(const c of K.c){if(!c.on)continue;
    const a=c.s/B.orbit,rr=(B.orbit+c.ro)*Z,x=ox+Math.cos(a)*rr,y=oy+Math.sin(a)*rr,m=c.sg*Z*2.4+c.rw*Z;
    if(x<-m||x>W+m||y<-m||y>H+m)continue;
    pick.push([Math.hypot(x-W/2,y-H/2),x,y,c.sg*Z,Math.floor(c.rw*Z)+c.dn*.99]);}
  pick.sort((p,q)=>p[0]-q[0]);
  for(let i=0;i<Math.min(12,pick.length);i++){const o=12+i*4,p=pick[i];U[o]=p[1];U[o+1]=p[2];U[o+2]=p[3];U[o+3]=p[4];}
  gpuField(pass,"gsy.belt",SBELT_HAZE_WGSL,U);
}
const SBELT_PICK=[];
