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
const ROCK_CELL=34;
const SBELT_BAS={right:[1,0,0],up:[0,-1,0],fwd:[0,0,1]};
function drawBeltRocks(ox,oy,B,Z,shx,shy){
  if(Z<.24)return;
  const zf=clamp((Z-.24)/.1,0,1);
  const half=(Math.max(W,H)/2/Z)*G.opts.gfx.draw+ROCK_CELL;
  const cx0=(W/2-ox)/Z,cy0=(H/2-oy)/Z;
  const c0x=Math.floor((cx0-half)/ROCK_CELL), c1x=Math.floor((cx0+half)/ROCK_CELL);
  const c0y=Math.floor((cy0-half)/ROCK_CELL), c1y=Math.floor((cy0+half)/ROCK_CELL);
  const M=Math.min(W,H),sx=ox+shx*Z,sy=oy+shy*Z;
  const cap=Math.round(260*G.opts.gfx.draw);
  const p3ok=GPU.on&&GPU.enc&&!GPU.overPass;
  /* тела: камера сверху, на высоте D над плоскостью; F=Z·D — мир ложится на экран ровно как 2D */
  let cam=null,ub=null,ms=1,nf=0;const LIST=SBELT_LIST;LIST.length=0;
  for(let cx=c0x;cx<=c1x;cx++)for(let cy=c0y;cy<=c1y;cy++){
    if(LIST.length>=cap)break;
    const mx=(cx+.5)*ROCK_CELL,my=(cy+.5)*ROCK_CELL;
    if(Math.abs(Math.hypot(mx,my)-B.orbit)>200)continue;
    const hh=hashi(cx,cy,B.seed),r=rng(hh);
    const wx=(cx+r())*ROCK_CELL, wy=(cy+r())*ROCK_CELL;
    const x=ox+wx*Z, y=oy+wy*Z;
    if(x<-100||x>W+100||y<-100||y>H+100)continue;
    const den=sbeltDens(B,wx,wy);if(den<.02)continue;
    /* у корабля гуще: кольцо сгущения вокруг него, под самим кораблём — просвет */
    const dk=Math.hypot(x-sx,y-sy)/M;
    const act=(.55+1.1*Math.exp(-((dk-.24)/.2)*((dk-.24)/.2)))*(.35+.65*sbss(.03,.09,dk));
    /* и само кольцо у корабля — камни вокруг него, даже если он между сгустками */
    const dr=(Math.hypot(wx,wy)-B.orbit)/85,nr=Math.exp(-((dk-.2)/.17)*((dk-.2)/.17))*sbss(.03,.09,dk);
    const t=r(),v=den*act+.55*Math.exp(-dr*dr)*nr;
    const al=sbss(t*.9+.05,t*.9+.17,v)*zf;
    if(al<.01)continue;
    const big=den>.7&&r()<.05;
    const rad=big?24+r()*20:2.2+r()*r()*14;
    if(rad*Z<.9)continue;
    LIST.push({x,y,wx,wy,rad,al,hh,r1:r(),r2:r(),r3:r(),ore:r()<.2});
  }
  if(!LIST.length)return;
  if(p3ok){
    if(!B.rm){B.rm=[];for(let k=0;k<12;k++)B.rm.push(makeRock(hashi(B.seed,k,0x50C),1));}
    const D=2400/Z;
    cam=B.cam3||(B.cam3={x:0,y:0,z:0});cam.x=cx0;cam.y=cy0;cam.z=-D;
    const sys=G.sys,stl=sysStyle(sys),sc0=hex2rgb(sys.cls.col),scol=[sc0[0]*.6+92,sc0[1]*.6+90,sc0[2]*.6+88];
    brockReset(cam);
    /* светило чуть над плоскостью — камень виден освещённым боком, а не ровно в полутень */
    ub=brockCam(cam,SBELT_BAS,Z*D,scol,stl.neb[0],stl.neb[1],Math.hypot(cx0,cy0)*.2+150,1e7);
    ms=brockMs();BROCK.ni=0;
    for(let pass=0;pass<2;pass++)for(const o of LIST){
      if((o.al>=.99)===(pass===1))continue;
      const m=B.rm[o.hh%12],tn=SBELT_TINT[(o.hh>>>8)%SBELT_TINT.length],rk=SBELT_RK;
      for(let j=0;j<3;j++)rk[j]=m.rock[j]*tn[j];
      const ore=o.ore?[150+o.r1*80,110+o.r2*60,64+o.r3*34]:rk;
      brockPut(cam,m,o.wx,o.wy,0,o.rad,1,o.r1*TAU,o.r2*TAU+G.t*(o.r3-.5)*.004,o.al>=.99?1:o.al,rk,ore,false);
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
  let a1=atan2(d.y,d.x);let a2=atan2(-d.y,-d.x);
  let s1=a1*c.z/Z;let s2=a2*c.z/Z+fu.v[2].w;
  let w2=smoothstep(.3,.8,-cos(a1));
  let n1=sbf(vec2f(s1/120.,dr/50.)+vec2f(sbn(vec2f(s1/70.,dr/45.))*1.3,0.));
  let n2=sbf(vec2f(s2/120.,dr/50.)+vec2f(sbn(vec2f(s2/70.,dr/45.))*1.3,0.));
  let n=mix(n1,n2,w2);
  let g=mix(sbn(vec2f(s1/28.,dr/11.)),sbn(vec2f(s2/28.,dr/11.)),w2);
  /* клочья: маска в координатах мира, круглая — дымка рвётся, а не тянется лентой */
  let wq=d/Z/260.+vec2f(fu.v[2].w*.0001,3.);
  let pf=smoothstep(.3,.62,sbf(wq+vec2f(sbn(wq*1.7)*.8,sbn(wq*1.7+vec2f(4.,9.))*.8)));
  let dd=clamp(m,0.,1.3)*(.05+1.5*smoothstep(.3,.75,n)*pf)*(.8+.4*g);
  let a=clamp(dd*fu.v[1].w,0.,.5);
  return vec4f(fu.v[1].rgb*a,a);}`;
const SBELT_U=new Float32Array(60);
function gsyBeltHaze(pass,sys,ox,oy,Z){
  const B=sys.belt,K=sbeltClumps(B),U=SBELT_U;U.fill(0);
  U[0]=ox;U[1]=oy;U[2]=B.orbit*Z;U[3]=Z;
  const sc=hex2rgb(sys.cls.col);
  for(let i=0;i<3;i++)U[4+i]=(118*.62+sc[i]*.38)/255;
  U[7]=.45;U[11]=TAU*B.orbit*.5;
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
