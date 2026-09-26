/* ══════════════ пещера на видеокарте: темнота, фонарь, тени, пыль (G7) ══════════════
   Было: темнота — спрайт-виньетка поверх всего, фонарь — три треугольника с
   градиентом в воздухе, пятно на полу, пыль — восемь крупинок, чужая лампа —
   маска теней, печённая один раз. Свет лежал ПОВЕРХ камня и сквозь камень.
   Стало: сцена до этого места — альбедо (порода, натёки, вода, находки, жизнь);
   один проход поля УМНОЖАЕТ её на свет. Свет — от источников и только от них:
   фонарь шлема конусом, чужая лампа, мох, кристаллы, жилы, дневной свет в
   устье. Каждый источник бросает тени от породы: луч идёт по маске породы
   (сетка C.g, одна текстура с мипами), и чем дальше от источника, тем крупнее
   мип — полутень растёт с расстоянием, как у настоящего фонаря. Порода не
   режет свет ступенькой: свет гаснет в толще за несколько пикселей, и стена,
   обращённая к фонарю, светится кромкой. Дальняя стена берёт свет слабее —
   она за ходом, а не в нём.
   Второе поле СКЛАДЫВАЕТ: рассеяние луча в воздухе (с теми же тенями — за
   колонной в луче тёмная полоса) и пылинки, которые висят и медленно плывут,
   светясь только там, где их застал луч. Третье — руда: ядра кристаллов,
   жилы и стекло лампы светят выше единицы и уходят в лестницу свечения (L2).
   Общая часть (маска, тени, источники) — CAVE_LIT_WGSL: её же берёт шахта (23). */

/* числа в поле: fu.v[0] камера (x,y,K,t) · [1] маска: мир → uv (ox,oy,1/w,1/h) ·
   [2] фонарь: место и направление · [3] фонарь: дальность, cos края, cos ядра, сила ·
   [4] цвет фонаря, число источников · [5] окружающий свет, доля дальней стены ·
   [6..13] источники: x, y, радиус, цвет×сила (упакован: r·65536+g·256+b, 1.00 = 100) ·
   [14] числа режима (пещера — ближнее озеро: x0, x1, уровень, есть ли).
   Маска: красный — порода, зелёный — открытое небо (шахта). Свои места у режима —
   пять функций: ambAt (окружающий), dayAt (свет сверху), skyAt (не освещается —
   само светит), airAt (где висит воздух: рассеяние и пыль), waterAt (вода: блеск). WGSL не требует
   объявлять функцию до вызова, поэтому режим дописывает их после общего поля */
const CAVE_LIT_MAX=8;                            /* v[14] — свои числа режима: озеро, глубина */
const CAVE_LIT_WGSL=`
const SIG=.05;
fn chs(p:vec2f)->f32{var q=fract(vec3f(p.xyx)*.1031);q=q+dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
fn cvn(p:vec2f)->f32{let i=floor(p);let f=fract(p);let w=f*f*(3.-2.*f);
  return mix(mix(chs(i),chs(i+vec2f(1.,0.)),w.x),mix(chs(i+vec2f(0.,1.)),chs(i+vec2f(1.,1.)),w.x),w.y);}
fn maskAt(w:vec2f,lod:f32)->vec4f{return textureSampleLevel(t0,smp,(w-fu.v[1].xy)*fu.v[1].zw,lod);}
fn rockAt(w:vec2f,lod:f32)->f32{return maskAt(w,lod).r;}
/* пропускание от источника a до точки b: n шагов по маске, мип растёт от источника —
   мягкая полутень; старт шага сдвинут по хешу точки, ступеньки уходят в зерно */
fn trans(a:vec2f,b:vec2f,n:i32)->f32{
  let d=b-a;let L=length(d);if(L<1.){return 1.;}
  let ds=L/f32(n);let j=chs(floor(b))*ds;var s=0.;
  for(var i=0;i<n;i++){
    let x=j+ds*f32(i);
    s+=rockAt(a+d*(x/L),clamp(log2(1.+x*.02),0.,3.));
  }
  return exp(-s*ds*SIG);}
fn lampAt(w:vec2f)->f32{
  let d=w-fu.v[2].xy;let L=length(d);let R=fu.v[3].x;
  if(L>R){return 0.;}
  let c=dot(d/max(L,1e-3),fu.v[2].zw);
  let cone=smoothstep(fu.v[3].y,fu.v[3].z,c);
  let fall=pow(1.-L/R,1.4);
  let fill=exp(-L*L/(2.*48.*48.))*.42;
  return (cone*fall+fill)*fu.v[3].w;}
/* отражённый: фонарь, упёршийся в стены, подсвечивает всё вокруг без теней */
fn bounceAt(w:vec2f)->f32{let d=w-fu.v[2].xy;return exp(-dot(d,d)/(2.*130.*130.))*.30*fu.v[3].w;}
fn litCol(pk:f32)->vec3f{return vec3f(floor(pk/65536.),pmod(floor(pk/256.),256.),pmod(pk,256.))*.01;}
`;
/* свет: сцена × (окружающий + источники с тенями) */
const CAVE_MUL_WGSL=CAVE_LIT_WGSL+`
fn field(p:vec2f,uv:vec2f)->vec4f{
  let w=p/fu.v[0].z+fu.v[0].xy;
  let rk=smoothstep(.3,.7,rockAt(w,0.));
  let sk=skyAt(w);
  if(sk>.995){return vec4f(1.,1.,1.,1.);}
  var li=fu.v[4].rgb*lampAt(w)+dayAt(w);
  if(li.x+li.y+li.z>.003){li=li*trans(fu.v[2].xy,w,20);}
  li+=fu.v[4].rgb*bounceAt(w);
  let n=i32(fu.v[4].w);
  for(var k=0;k<${CAVE_LIT_MAX};k++){
    if(k>=n){break;}
    let P=fu.v[6+k];let dd=length(w-P.xy);
    if(dd<P.z){let a=1.-dd/P.z;li+=litCol(P.w)*a*a*trans(P.xy,w,10);}
  }
  return vec4f(mix(ambAt(w)+li*mix(fu.v[5].w,1.,rk),vec3f(1.),sk),1.);}
`;
/* воздух: рассеяние луча (с тенями) и пыль в нём; мох и кристаллы — лёгкий ореол */
const CAVE_ADD_WGSL=CAVE_LIT_WGSL+`
fn field(p:vec2f,uv:vec2f)->vec4f{
  let K=fu.v[0].z;let w=p/K+fu.v[0].xy;let t=fu.v[0].w;
  let air=airAt(w);
  if(air<.01){return vec4f(0.);}
  var sc=vec3f(0.);
  let l0=lampAt(w);
  if(l0>.003){
    let beam=l0*trans(fu.v[2].xy,w,16);
    let den=.35+.65*cvn(w*.016+vec2f(t*.0021,t*.0009))*cvn(w*.041-vec2f(t*.0013,0.));
    sc=fu.v[4].rgb*beam*den*.34;
    /* пылинки: сетка 9 px в мире сносится медленно, в клетке одна крупинка
       с покачиванием — плывут, а не мигают; видны только в луче */
    let g=w/9.+vec2f(t*.0032,-t*.0011);let c=floor(g);let h=chs(c);
    if(h>.93){
      let o=vec2f(chs(c+17.1),chs(c+3.3))*.4+.3+.14*vec2f(sin(t*.011+h*40.),cos(t*.008+h*23.));
      let r=.35+.6*chs(c+9.9);let dd=length((fract(g)-o)*9.*K);
      sc+=fu.v[4].rgb*beam*(1.-smoothstep(r-.5,r+.7,dd))*(.35+1.1*chs(c+5.5));
    }
  }
  let n=i32(fu.v[4].w);
  for(var k=0;k<${CAVE_LIT_MAX};k++){
    if(k>=n){break;}
    let P=fu.v[6+k];let dd=length(w-P.xy);
    if(dd<P.z){let a=1.-dd/P.z;
      var v=a*a*a*.07;
      if(P.z>300.){v=a*a*.10*trans(P.xy,w,10);}   /* дневной свет в устье — столб с тенями */
      sc+=litCol(P.w)*v;}
  }
  sc+=waterAt(w,t,K);
  return vec4f(sc*air,0.);}
`;
/* места пещеры: неба нет (день в устье — источник), окружающий ровный */
const CAVE_OWN_WGSL=`
fn ambAt(w:vec2f)->vec3f{return fu.v[5].rgb;}
fn dayAt(w:vec2f)->vec3f{return vec3f(0.);}
fn skyAt(w:vec2f)->f32{return 0.;}
fn airAt(w:vec2f)->f32{return 1.-smoothstep(.3,.7,rockAt(w,0.));}
/* озеро (22a cavePool): кромка ловит фонарь той же рябью, что рисует 2D, а под ней —
   столб отражения фонаря, раздробленный рябью: вода читается водой, а не заливкой */
fn waterAt(w:vec2f,t:f32,K:f32)->vec3f{
  let P=fu.v[14];
  if(P.w<.5||w.x<P.x||w.x>P.y){return vec3f(0.);}
  let d=w.y-P.z-sin(w.x*.06+t*.02)*.9;
  if(d<-3.){return vec3f(0.);}
  var c=fu.v[4].rgb*lampAt(vec2f(w.x,P.z-3.))*exp(-d*d*K*K/1.6)*.5;
  let lp=fu.v[2].xy;let h=P.z-lp.y;
  if(d>0.&&h>0.){
    let rx=w.x-lp.x;let sp=5.+d*.4;
    let col=exp(-rx*rx/(sp*sp))*exp(-d/(h*1.6+24.));
    let g=cvn(vec2f(w.x*.13+t*.006,d*.7-t*.035));
    c+=fu.v[4].rgb*col*smoothstep(.42,.78,g)*fu.v[3].w*.8;
  }
  /* край зала — не обрез: блеск сходит на нет за 30 px */
  return c*smoothstep(P.x,P.x+30.,w.x)*(1.-smoothstep(P.y-30.,P.y,w.x));}
`;
/* маска породы: одна на пещеру, клетка = тексель, мипы — мягкие тени */
function caveMaskCv(C){
  if(C.maskCv)return C.maskCv;
  const NX=CAVE_NX,NY=CAVE_NY,cv=document.createElement("canvas");
  cv.width=NX;cv.height=NY;
  const c=cv.getContext("2d"),im=c.createImageData(NX,NY),d=im.data,g=C.g;
  for(let i=0;i<NX*NY;i++){d[i*4+3]=255;if(g[i])d[i*4]=255;}
  c.putImageData(im,0,0);
  return C.maskCv=cv;
}
/* источник в поле: x, y, радиус и упакованный цвет×сила */
function caveLitPack(r,g,b,I){
  const q=v=>Math.max(0,Math.min(255,Math.round(v*I*100)));
  return q(r)*65536+q(g)*256+q(b);
}
const CAVE_LIT_U=new Float32Array(60), CAVE_LIT_C=[];
/* источники в кадре: мир (x,y,r) и цвет 0..1; ближние к середине кадра — первыми */
function caveLights(C,camx,camy){
  const L=CAVE_LIT_C;L.length=0;
  const vw=W,vh=H,cx=camx+vw/2,cy=camy+vh/2;
  const put=(x,y,r,col,I,pri)=>{
    if(x+r<camx||x-r>camx+vw||y+r<camy||y-r>camy+vh)return;
    L.push({x,y,r,c:col,I,k:Math.hypot(x-cx,y-cy)-r-(pri||0)});
  };
  /* день в устье — холодный сверху, по нему виден выход */
  put(60,caveGalY(C,60)-230,520,[.58,.72,.92],1.05,2000);
  const Lp=caveLampSpot(C);
  put(Lp.x,Lp.y-6,130,[1,.74,.48],(.78+.22*Math.sin(G.t*.011+Lp.ph))*1.3,1000);
  for(const m of caveMossSpots(C)){
    const pu=.62+.38*Math.sin(G.t*.006+m.ph);
    put(m.x,m.y,m.rr*5,m.col.map(v=>v/255),.55*pu);
  }
  const D=C.deco;
  if(D){
    for(const c of D.crystals){
      const y=c.up?caveFloorOf(C,c.x,c.low):caveCeilOf(C,c.x,c.low);
      const pu=.55+.45*Math.sin(G.t*.014+c.ph);
      put(c.x,y+(c.up?-10:10),Math.max(90,c.rad*4.5),c.col.map(v=>v/255),.9*(.6+.4*pu));
    }
    for(const v of D.veins){
      const q=v.pts[Math.floor(v.pts.length/2)];
      const y=(v.up?caveCeilOf(C,q[0],v.low):caveFloorOf(C,q[0],v.low))+q[1];
      put(q[0],y,110,v.col.map(k=>k/255),.6*(.6+.4*Math.sin(G.t*.009+v.ph)));
    }
  }
  if(C.watch>0)for(let i=0;i<2;i++){
    const x=118+i*26+(i?3:-3);
    put(x,caveFloor(C,118+i*26)-20,90,[1,.72,.42],1.1,500);
  }
  L.sort((a,b)=>a.k-b.k);
  if(L.length>CAVE_LIT_MAX)L.length=CAVE_LIT_MAX;
  return L;
}
/* ближнее озеро в кадре — одно: в поле для него четыре числа */
function cavePoolInView(C,camx,camy){
  let best=null,bd=1e9;
  const cx=camx+W/2;
  for(const z of caveZones(C)){
    const p=cavePool(C,z);if(!p)continue;
    if(p.x1<camx||p.x0>camx+W||p.y<camy-20||p.y>camy+H+20)continue;
    const d=Math.max(0,p.x0-cx,cx-p.x1);
    if(d<bd){bd=d;best=p;}
  }
  return best;
}
/* тон темноты — от самой породы планеты (M233), холодный (M304) */
function caveAmbient(){
  const cpl=(G.surf&&G.surf.p)||null;
  const pcv=(cpl&&cpl.T&&cpl.T.pal)?cpl.T.pal[Math.min(cpl.T.pal.length-1,1)]:[26,30,42];
  const dk=[pcv[0]*.20+6,pcv[1]*.22+8,pcv[2]*.28+14];
  const m=Math.max(dk[0],dk[1],dk[2],1);
  return [dk[0]/m*.46,dk[1]/m*.52,dk[2]/m*.64];
}
/* свет на всё, что нарисовано до этого места. lamp — {x,y,f} фонарь в мире */
function drawCaveLight(C,camx,camy,lamp){
  const pass=gpuOver();if(!pass)return;
  const U=CAVE_LIT_U,K=G.viewK||1,lk=kitStat().lamp;
  U.fill(0);
  U[0]=camx;U[1]=camy;U[2]=K;U[3]=G.t;
  U[4]=0;U[5]=CAVE_Y0;U[6]=1/(CAVE_NX*CAVE_CS);U[7]=1/(CAVE_NY*CAVE_CS);
  const a=.2;                                   /* луч чуть вниз — на пол перед ходоком */
  U[8]=lamp.x;U[9]=lamp.y;U[10]=lamp.f*Math.cos(a);U[11]=Math.sin(a);
  U[12]=300*lk;U[13]=Math.cos(.52);U[14]=Math.cos(.16);U[15]=2.5;
  U[16]=1;U[17]=.76;U[18]=.50;
  const am=caveAmbient();
  U[20]=am[0];U[21]=am[1];U[22]=am[2];U[23]=.45;
  const L=caveLights(C,camx,camy);
  U[19]=L.length;
  for(let i=0;i<L.length;i++){const s=L[i],o=24+i*4;
    U[o]=s.x;U[o+1]=s.y;U[o+2]=s.r;U[o+3]=caveLitPack(s.c[0],s.c[1],s.c[2],s.I);}
  const pl=cavePoolInView(C,camx,camy);
  if(pl){U[56]=pl.x0;U[57]=pl.x1;U[58]=pl.y;U[59]=1;}
  const mt={view:gpuMipTex(caveMaskCv(C)).view},sm=gpuMipSmp();
  gpuField(pass,"cave.mul",CAVE_MUL_WGSL+CAVE_OWN_WGSL,U,[mt],{blend:"mul",smp:sm});
  gpuField(pass,"cave.add",CAVE_ADD_WGSL+CAVE_OWN_WGSL,U,[mt],{blend:"add",smp:sm});
  caveEmit(C,camx,camy,pass,K);
}
/* руда светит сама (L2): ядро выше единицы — узкий ореол в лестнице свечения,
   широкое зарево слабое. Координаты — пиксели кадра (мир × K) */
const CAVE_EMIT=[];
function caveEmit(C,camx,camy,pass,K){
  const S=CAVE_EMIT;S.length=0;
  const D=C.deco;
  const sx=x=>(x-camx)*K, sy=y=>(y-camy)*K;
  if(D){
    for(const c of D.crystals){
      const x=c.x-camx;if(x<-c.rad||x>W+c.rad)continue;
      const y=(c.up?caveFloorOf(C,c.x,c.low):caveCeilOf(C,c.x,c.low));
      if(c.low&&y>=CAVE_Y1-10)continue;
      const pu=.55+.45*Math.sin(G.t*.014+c.ph), col=c.col, dir=c.up?-1:1;
      S.push([1,sx(c.x),sy(y+dir*6),c.rad*.7*K,0,0,c.rad*1.6*K,col[0],col[1],col[2],.30+.25*pu]);
      for(const s of c.spikes){
        const bx=c.x+s.dx, tx=bx+s.lean*s.h*.55, ty=y+s.h*.55*dir;
        S.push([2,sx(bx),sy(y),sx(tx),sy(ty),.8*K,2.2*K,col[0]*2.6,col[1]*2.6,col[2]*2.6,.7+.5*pu]);
      }
    }
    for(const v of D.veins){
      const x0=v.pts[0][0]-camx, xn=v.pts[v.pts.length-1][0]-camx;
      if(xn<-30||x0>W+30)continue;
      const pu=.6+.4*Math.sin(G.t*.009+v.ph), col=v.col;
      let px=null,py=null;
      for(let i=0;i<v.pts.length;i++){
        const wx=v.pts[i][0];
        const wy=(v.up?caveCeilOf(C,wx,v.low):caveFloorOf(C,wx,v.low))+v.pts[i][1];
        if(px!==null)S.push([2,sx(px),sy(py),sx(wx),sy(wy),v.w*.5*K,1.2*K,col[0]*2.6,col[1]*2.6,col[2]*2.6,Math.min(1,v.a*pu*1.5)]);
        px=wx;py=wy;
      }
    }
  }
  const Lp=caveLampSpot(C);
  if(Lp.x-camx>-40&&Lp.x-camx<W+40){
    const pu=.78+.22*Math.sin(G.t*.011+Lp.ph);
    S.push([1,sx(Lp.x),sy(Lp.y-5.4),2.4*K,0,0,2*K,255*2.2,226*2.2,170*2.2,pu]);
  }
  gpuShapes(pass,S,{blend:"add"});
}
