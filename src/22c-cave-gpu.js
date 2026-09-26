/* ══════════════ пещера на видеокарте: темнота, фонарь, тени, пыль (G7) ══════════════
   Было: темнота — спрайт-виньетка поверх всего, фонарь — три треугольника с
   градиентом в воздухе, пятно на полу, пыль — восемь крупинок, чужая лампа —
   маска теней, печённая один раз. Свет лежал ПОВЕРХ камня и сквозь камень.
   Стало: сцена до этого места — альбедо (порода, натёки, вода, находки, жизнь);
   один проход поля УМНОЖАЕТ её на свет. Свет — от источников и только от них:
   фонарь шлема конусом, чужая лампа, мох, кристаллы, жилы (день в устье —
   трапеция сложением, как у main). Каждый источник бросает тени от породы:
   луч идёт по маске породы
   (сетка C.g, одна текстура с мипами), и чем дальше от источника, тем крупнее
   мип — полутень растёт с расстоянием, как у настоящего фонаря. Порода не
   режет свет ступенькой: свет гаснет в толще за несколько пикселей, и стена,
   обращённая к фонарю, светится кромкой. Дальняя стена берёт свет слабее —
   она за ходом, а не в нём.
   Второе поле СКЛАДЫВАЕТ: рассеяние луча в воздухе (с теми же тенями — за
   колонной в луче тёмная полоса) и пылинки, которые висят и медленно плывут,
   светясь только там, где их застал луч. Третье — руда: ядра кристаллов,
   жилы и стекло лампы светят выше единицы и уходят в лестницу свечения (L2).
   Общая часть (маска, тени, источники) — CAVE_LIT_WGSL: её же берёт шахта (23).
   Пещера 26.09 вернулась к модели main (Контроль: «цвет main»): множитель — одна темнота
   от фонаря; фонарь скафандра — конус сложением; грани, жилы, мох и пыль — слой сложения
   main (caveMainAdd); с тенями от породы светит только чужая лампа (ownAdd). */

/* числа в поле: fu.v[0] камера (x,y,K,t) · [1] маска: мир → uv (ox,oy,1/w,1/h) ·
   [2] фонарь: место и направление · [3] фонарь: дальность, cos края, cos ядра, сила ·
   [4] цвет фонаря, число источников · [5] окружающий свет, доля дальней стены ·
   [6..13] источники: x, y, радиус, цвет×сила (упакован: r·65536+g·256+b, 1.00 = 100) ·
   [14] числа режима (пещера — ближнее озеро: x0, x1, уровень, есть ли; шахта — .xy человек,
   .z камера под землёй).
   Маска: красный — порода, зелёный — открытое небо (шахта). Свои места у режима —
   шесть функций: ambAt (окружающий), dayAt (свет сверху), skyAt (не освещается —
   само светит), airAt (где висит воздух: рассеяние и пыль), waterAt (вода: блеск),
   ownAdd (своё сложением везде, не только в воздухе). WGSL не требует
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
fn lampAt(w:vec2f)->f32{return lampCone(w)*fu.v[3].w;}
/* форма луча без силы: ею же блестит вода пещеры, где в полях фонаря больше нет */
fn lampCone(w:vec2f)->f32{
  let d=w-fu.v[2].xy;let L=length(d);let R=fu.v[3].x;
  if(L>R){return 0.;}
  let c=dot(d/max(L,1e-3),fu.v[2].zw);
  let cone=smoothstep(fu.v[3].y,fu.v[3].z,c);
  let fall=pow(1.-L/R,1.4);
  /* ни ближней заливки, ни отражённого: у main у самого фонаря только тёплое зарево сложением
     (warmGlow), а пятно σ48 и отражённый σ130 выжигали ядро — шахта 146 против 115 у main,
     пещера белела у фонаря (Контроль 26.09) */
  return cone*fall;}
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
  let air=airAt(w);let ex=ownAdd(w);
  if(air<.01){return vec4f(ex,0.);}
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
      sc+=litCol(P.w)*(a*a*a*.07);}
  }
  sc+=waterAt(w,t,K);
  return vec4f(sc*air+ex,0.);}
`;
/* места пещеры: неба нет (день в устье — трапеция main, drawCaveLight), окружающий ровный */
const CAVE_OWN_WGSL=`
/* темнота — как у main (drawCaveDark): в круге фонаря R=.52·max(W,H) порода гаснет от нуля
   через .18 на .45 круга до .42 у края и дальше, и гаснет ровно — тон камня, воды и мха
   остаётся своим. Синий множитель (.2,.3,.64) уводил бирюзу хода в синий (Контроль 26.09);
   холод темноты теперь сложением — тоном самой планеты (warmGlow, профиль 2). fu.v[5] —
   общий уровень, 1 как у main: материала под землёй нет, порода из печи того же цвета */
fn darkA(w:vec2f)->f32{
  let R=max(fu.res.z,fu.res.w)*.52*(fu.v[3].x/300.);
  let r0=min(.5,40./max(R,1.));
  let s=clamp((length(w-fu.v[2].xy)/max(R,1.)-r0)/(1.-r0),0.,1.);
  return select(.18+.24*(s-.45)/.55,.18*s/.45,s<.45);}
fn ambAt(w:vec2f)->vec3f{return fu.v[5].rgb*(1.-darkA(w));}
fn dayAt(w:vec2f)->vec3f{return vec3f(0.);}
fn skyAt(w:vec2f)->f32{return 0.;}
/* чужая лампа — как маска main (caveLampMask): тёплое .24 → .08 на середине → ноль, сложением,
   с тенями от породы. В поле её радиус со знаком минус — множитель и воздух её не видят */
fn ownAdd(w:vec2f)->vec3f{
  var o=vec3f(0.);
  let n=i32(fu.v[4].w);
  for(var k=0;k<${CAVE_LIT_MAX};k++){
    if(k>=n){break;}
    let P=fu.v[6+k];if(P.z>=0.){continue;}
    let t=length(w-P.xy)/(-P.z);
    if(t<1.){
      let c=select(vec3f(.08,.0596,.0376)*(2.-2.*t),mix(vec3f(.24,.1939,.1299),vec3f(.08,.0596,.0376),t*2.),t<.5);
      o+=c*litCol(P.w).x*trans(P.xy,w,10);}
  }
  return o;}
fn airAt(w:vec2f)->f32{return 1.-smoothstep(.3,.7,rockAt(w,0.));}
/* озеро (22a cavePool): кромка ловит фонарь той же рябью, что рисует 2D, а под ней —
   столб отражения фонаря, раздробленный рябью: вода читается водой, а не заливкой */
fn waterAt(w:vec2f,t:f32,K:f32)->vec3f{
  let P=fu.v[14];
  if(P.w<.5||w.x<P.x||w.x>P.y){return vec3f(0.);}
  let d=w.y-P.z-sin(w.x*.06+t*.02)*.9;
  if(d<-3.){return vec3f(0.);}
  /* сила — прежняя (.6 фонаря): в полях пещеры фонаря больше нет, блеск берёт форму луча */
  var c=fu.v[4].rgb*lampCone(vec2f(w.x,P.z-3.))*exp(-d*d*K*K/1.6)*.3;
  let lp=fu.v[2].xy;let h=P.z-lp.y;
  if(d>0.&&h>0.){
    let rx=w.x-lp.x;let sp=5.+d*.4;
    let col=exp(-rx*rx/(sp*sp))*exp(-d/(h*1.6+24.));
    let g=cvn(vec2f(w.x*.13+t*.006,d*.7-t*.035));
    c+=fu.v[4].rgb*col*smoothstep(.42,.78,g)*.48;
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
/* тёплое зарево сложением — то, что у main было спрайтом «lighter» поверх темноты: у фонаря
   пещеры и шахты, пятно на полу перед ходоком. Множитель поля на тёмной породе их не давал —
   тёплое пятно исчезало (Контроль 26.09). Центр и радиусы — пиксели кадра; профиль 0 —
   (1−t)^2.2, как у спрайтов, 1 — три ступени градиента пятна (a, .556a на .45, ноль) по кругу rx,
   обрезанные эллипсом rx×ry: у main пятно — радиальный градиент в эллипсе, край сверху и снизу чёткий,
   2 — холод темноты пещеры: от r0 через .18 на .45 до .42 у края и так же за кругом. Спрайт
   main начинается с прозрачного чёрного, а 2D тянет цвет между остановками без
   премультипликации: до .45 тон растёт квадратом (гасит поле — линейно). Линейный тон
   синил круг фонаря на 1–1.5 против main */
const WARM_GLOW_WGSL=`
fn field(p:vec2f,uv:vec2f)->vec4f{
  let A=fu.v[0];let B=fu.v[1];
  let t=length((p-A.xy)/max(A.zw,vec2f(1.)));
  if(fu.v[2].x>1.5){let s=clamp((t-fu.v[2].y)/(1.-fu.v[2].y),0.,1.);let e=s/.45;
    return vec4f(B.rgb*B.w*select(.18+.24*(s-.45)/.55,.18*e*e,s<.45),0.);}
  if(t>=1.){return vec4f(0.);}
  var a=B.w*pow(1.-t,2.2);
  if(fu.v[2].x>.5){let c=length(p-A.xy)/max(A.z,1.);let e=clamp((1.-t)*A.w,0.,1.);
    /* цвет идёт по остановкам main сам, без премультипликации: (255,214,150) → (255,196,120)
       на .45 → (255,190,110) у края; с одним цветом пятно выходило синее main на 2–3 */
    let col=select(mix(vec3f(1.,.769,.471),vec3f(1.,.745,.431),(c-.45)/.55),mix(B.rgb,vec3f(1.,.769,.471),c/.45),c<.45);
    a=select(mix(B.w*.556,0.,(c-.45)/.55),mix(B.w,B.w*.556,c/.45),c<.45)*e;
    return vec4f(col*a,0.);}
  return vec4f(B.rgb*a,0.);}`;
const WARM_GLOW_U=new Float32Array(12);
function warmGlow(pass,x,y,rx,ry,col,a,prof,r0){
  const U=WARM_GLOW_U;U[0]=x;U[1]=y;U[2]=rx;U[3]=ry;U[4]=col[0];U[5]=col[1];U[6]=col[2];U[7]=a;U[8]=prof|0;U[9]=r0||0;
  gpuField(pass,"warm.glow",WARM_GLOW_WGSL,U,null,{blend:"add"});
}
/* источник в поле: x, y, радиус и упакованный цвет×сила */
function caveLitPack(r,g,b,I){
  const q=v=>Math.max(0,Math.min(255,Math.round(v*I*100)));
  return q(r)*65536+q(g)*256+q(b);
}
const CAVE_LIT_U=new Float32Array(60), CAVE_LIT_C=[];
/* источники в кадре: мир (x,y,r) и цвет 0..1; ближние к середине кадра — первыми.
   add — свет сложением (в поле радиус со знаком минус) */
function caveLights(C,camx,camy){
  const L=CAVE_LIT_C;L.length=0;
  const vw=W,vh=H,cx=camx+vw/2,cy=camy+vh/2;
  const put=(x,y,r,col,I,pri,add)=>{
    if(x+r<camx||x-r>camx+vw||y+r<camy||y-r>camy+vh)return;
    L.push({x,y,r,c:col,I,add:!!add,k:Math.hypot(x-cx,y-cy)-r-(pri||0)});
  };
  /* чужая лампа — как у main: тёплое зарево сложением на 86 px над полом, с тенями от породы
     (ownAdd); в цвете — только дыхание. Мох, кристаллы и жилы светят слоем сложения main
     (caveMainAdd): умноженные источники белили и зеленили породу вокруг (Контроль 26.09);
     дозорных освещает их факел в 2D, как у main */
  const Lp=caveLampSpot(C);
  put(Lp.x,Lp.y-5,86,[1,1,1],.78+.22*Math.sin(G.t*.011+Lp.ph),1000,true);
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
/* тон темноты пещеры — как у main: порода планеты, уведённая почти в ноль (M233, M304) */
function caveDarkTone(){
  const cpl=(G.surf&&G.surf.p)||null;
  const pcv=(cpl&&cpl.T&&cpl.T.pal)?cpl.T.pal[Math.min(cpl.T.pal.length-1,1)]:[26,30,42];
  return [Math.min(30,Math.round(pcv[0]*.20+6))/255,Math.min(32,Math.round(pcv[1]*.22+8))/255,Math.min(38,Math.round(pcv[2]*.28+14))/255];
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
  /* форма луча — для блеска воды; силы у фонаря в полях нет: у main фонарь скафандра —
     конус сложением поверх темноты (caveMainAdd), порода под ним не умножается. Умноженный
     фонарь белил ход у человека и уводил его в бирюзу (Контроль 26.09) */
  U[12]=300*lk;U[13]=Math.cos(.52);U[14]=Math.cos(.16);U[15]=0;
  U[16]=.745;U[17]=.843;U[18]=.922;
  U[20]=1;U[21]=1;U[22]=1;U[23]=.45;
  const L=caveLights(C,camx,camy);
  U[19]=L.length;
  for(let i=0;i<L.length;i++){const s=L[i],o=24+i*4;
    U[o]=s.x;U[o+1]=s.y;U[o+2]=s.add?-s.r:s.r;U[o+3]=caveLitPack(s.c[0],s.c[1],s.c[2],s.I);}
  const pl=cavePoolInView(C,camx,camy);
  if(pl){U[56]=pl.x0;U[57]=pl.x1;U[58]=pl.y;U[59]=1;}
  const mt={view:gpuMipTex(caveMaskCv(C)).view},sm=gpuMipSmp();
  gpuField(pass,"cave.mul",CAVE_MUL_WGSL+CAVE_OWN_WGSL,U,[mt],{blend:"mul",smp:sm});
  gpuField(pass,"cave.add",CAVE_ADD_WGSL+CAVE_OWN_WGSL,U,[mt],{blend:"add",smp:sm});
  /* тёплое у фонаря, как у main: зарево .24 на .72 круга фонаря (R=.52·max(W,H)) и пятно
     на полу перед ходоком — эллипс 120×44, .18/.10/0 */
  const R=Math.max(W,H)*.52*lk,f=lamp.f||1;
  warmGlow(pass,(lamp.x-camx)*K,(lamp.y-camy)*K,R*K,R*K,caveDarkTone(),1,2,Math.min(.5,40/Math.max(R,1)));
  warmGlow(pass,(C.x-camx)*K,(C.y-25-camy)*K,R*.72*K,R*.72*K,[1,.784,.518],.24,0);
  warmGlow(pass,(C.x+f*46-camx)*K,(C.y-3-camy)*K,120*lk*K,44*lk*K,[1,.839,.588],.18,1);
  /* день в устье — как у main: трапеция сложением, холодная, .16 сверху и ноль у пола галереи;
     по ней виден выход. Источник с тенями давал белый столб (Контроль 26.09: «у main конус») */
  const mx=60-camx,my=caveGalY(C,60)-camy;
  if(mx>-200&&mx<W+200&&my>-300&&my<H+100){
    const u=CAVE_MOUTH_U;u[0]=mx*K;u[1]=my*K;u[2]=K;
    gpuField(pass,"cave.mouth",CAVE_MOUTH_WGSL,u,null,{blend:"add"});
  }
  caveMainAdd(C,camx,camy,pass,K);
  caveEmit(C,camx,camy,pass,K);
}
/* трапеция дня: верх 52 px на 240 над устьем, низ 140 px на 60 ниже; градиент по высоте */
const CAVE_MOUTH_WGSL=`
fn field(p:vec2f,uv:vec2f)->vec4f{
  let q=(p-fu.v[0].xy)/fu.v[0].z;
  if(q.y<-240.||q.y>60.||abs(q.x)>26.+44.*(q.y+240.)/300.){return vec4f(0.);}
  return vec4f(vec3f(.588,.745,.902)*(.16*(1.-clamp((q.y+220.)/280.,0.,1.))),0.);}`;
const CAVE_MOUTH_U=new Float32Array(4);
/* стекло чужой лампы светит само (L2): ядро выше единицы — узкий ореол в лестнице свечения.
   Грани кристаллов и жилы светят, как у main, слоем сложения (caveMainAdd) */
const CAVE_EMIT=[];
function caveEmit(C,camx,camy,pass,K){
  const Lp=caveLampSpot(C);
  if(Lp.x-camx<-40||Lp.x-camx>W+40)return;
  const pu=.78+.22*Math.sin(G.t*.011+Lp.ph),S=CAVE_EMIT;S.length=0;
  S.push([1,(Lp.x-camx)*K,(Lp.y-5.4-camy)*K,2.4*K,0,0,2*K,255*2.2,226*2.2,170*2.2,pu]);
  gpuShapes(pass,S,{blend:"add"});
}
/* ── слой сложения main на видеокарте ──
   Main клал поверх темноты сложением («lighter») грани кристаллов с ореолом, жилы, мох, пыль
   в воздухе, конус фонаря скафандра, пятно у ног и капли. На переднем 2D-слое флота «lighter»
   ложится поверх сцены с прозрачностью — сцена под ним гаснет на ту же долю, — и всё это
   выходило тусклее main (Контроль 26.09: «цветок и кристаллы слабые»). Здесь то же сложением
   по сцене, числа main (22a drawCaveGlow, drawCaveOwnLight). Координаты — пиксели кадра */
const CAVE_ADD_S=[],CAVE_GLOW_L=[];
function caveMainAdd(C,camx,camy,pass,K){
  const S=CAVE_ADD_S,GL=CAVE_GLOW_L;S.length=0;GL.length=0;
  const D=C.deco,t=G.t;
  const px=C.x-camx,py=C.y-11-camy,f=C.face||1,lk=kitStat().lamp;
  if(D){
    for(const c of D.crystals){
      const sx=c.x-camx;if(sx<-c.rad||sx>W+c.rad)continue;
      const sy=(c.up?caveFloorOf(C,c.x,c.low):caveCeilOf(C,c.x,c.low))-camy;
      if(c.low&&sy+camy>=CAVE_Y1-10)continue;
      const pu=.55+.45*Math.sin(t*.014+c.ph),col=c.col,dir=c.up?-1:1;
      /* две грани на иглу — тёмная и светлая — и белое ребро между ними; свет один на куст */
      for(const s of c.spikes){
        const bx=sx+s.dx,tx=bx+s.lean*s.h,ty=sy+s.h*dir,my=sy-dir*s.w*.5;
        S.push([5,(bx-s.w)*K,sy*K,tx*K,ty*K,bx*K,my*K,col[0],col[1],col[2],.10+pu*.07],
               [5,bx*K,my*K,tx*K,ty*K,(bx+s.w)*K,sy*K,col[0],col[1],col[2],.22+pu*.16],
               [2,bx*K,(sy-dir*s.w*.4)*K,tx*K,ty*K,.5*K,0,255,255,255,.10+pu*.16]);
      }
      GL.push(sx,sy+(c.up?-18:18),c.rad*1.9,.19*pu+.07,col[0],col[1],col[2],0);
    }
    for(const v of D.veins){
      const x0=v.pts[0][0]-camx,xn=v.pts[v.pts.length-1][0]-camx;
      if(xn<-30||x0>W+30)continue;
      const pu=.6+.4*Math.sin(t*.009+v.ph),col=v.col;
      /* широкий тусклый проход — свет вокруг жилы, узкий яркий — сама жила */
      let qx=0,qy=0;
      for(let i=0;i<v.pts.length;i++){
        const wx=v.pts[i][0],x=wx-camx;
        const y=(v.up?caveCeilOf(C,wx,v.low):caveFloorOf(C,wx,v.low))+v.pts[i][1]-camy;
        if(i)S.push([2,qx*K,qy*K,x*K,y*K,v.w*2.5*K,0,col[0],col[1],col[2],v.a*pu*.22],
                    [2,qx*K,qy*K,x*K,y*K,v.w*.5*K,0,col[0],col[1],col[2],v.a*pu]);
        qx=x;qy=y;
      }
    }
    for(const d of D.drops){
      const sx=d.x-camx;if(sx<-10||sx>W+10)continue;
      S.push([0,(sx-.6)*K,(d.y-camy-3)*K,(sx+.6)*K,(d.y-camy+1.5)*K,0,0,170,215,235,.5]);
    }
  }
  /* мох: пятно дышит (.16 → 0 по кругу 2.2 r), на нём несколько мелких разной величины */
  for(const m of caveMossSpots(C)){
    const x=m.x-camx,y=m.y-camy;
    if(x<-60||x>W+60||y<-60||y>H+60)continue;
    const pu=.62+.38*Math.sin(t*.006+m.ph),col=m.col;
    GL.push(x,y,m.rr*2.2,.16*pu,col[0],col[1],col[2],1);
    for(let i=0;i<m.n;i++){
      const a=m.ph+i*2.1,ex=x+Math.cos(a)*m.rr*.6,ey=y+Math.sin(a)*m.rr*.35;
      const rx=2.2+i*.7,ry=1.4+i*.4,hx=Math.cos(a)*(rx-ry),hy=Math.sin(a)*(rx-ry);
      S.push([2,(ex-hx)*K,(ey-hy)*K,(ex+hx)*K,(ey+hy)*K,ry*K,0,col[0],col[1],col[2],.20+.14*pu]);
    }
  }
  /* пыль в воздухе: 46 крупинок от координаты и времени, ярче у человека */
  for(let i=0;i<46;i++){
    const wx=(camx*.85+i*97.3+Math.sin(t*.004+i)*22)%(CAVE_W+400)-200;
    const sx=wx-camx*.85;
    if(sx<-10||sx>W+10)continue;
    const sy=(i*173.7+t*.09+Math.sin(t*.006+i*2.1)*14)%(H*.9)+H*.06;
    const a=clamp(1-Math.hypot(sx-px,sy-py)/240,0,1)*.30;
    if(a>.01)S.push([0,sx*K,sy*K,(sx+1.2)*K,(sy+1.2)*K,0,0,190,220,240,a]);
  }
  /* пыль в луче: восемь крупинок плывут от фонаря */
  for(let i=0;i<8;i++){
    const ph=(t*.004+i*.79)%1,a=(1-Math.abs(ph-.5)*2)*.22;
    if(a<=0)continue;
    const dx=f*(16+ph*96*lk),dy=-14+Math.sin(i*2.1+t*.006)*13+ph*20;
    S.push([1,(px+dx)*K,(py+dy)*K,(.9+ph*1.4)*K,0,0,0,255,232,190,a]);
  }
  /* пятно под ногами: без него астронавт висит в темноте */
  GL.push(px,py+6,90,.10,170,205,230,0);
  gpuShapes(pass,S,{blend:"add"});
  caveGlows(pass,GL,K);
  const u=CAVE_CONE_U;u[0]=px;u[1]=py;u[2]=f;u[3]=lk;u[4]=K;
  gpuField(pass,"cave.cone",CAVE_CONE_WGSL,u,null,{blend:"add"});
}
/* ореолы main: poiGlow (a, .28a на .45, ноль) и мох (линейно до нуля) — по семь за проход.
   Список: x, y, радиус, a, r, g, b, профиль (0 — poiGlow, 1 — линейный) в пикселях вида */
const CAVE_GLOW_WGSL=`
fn field(p:vec2f,uv:vec2f)->vec4f{
  var o=vec3f(0.);
  let n=i32(fu.v[0].x);
  for(var k=0;k<7;k++){
    if(k>=n){break;}
    let A=fu.v[1+k*2];let B=fu.v[2+k*2];
    let t=length(p-A.xy)/max(A.z,1e-3);
    if(t<1.){o+=B.rgb*(A.w*select(select(.28*(1.-t)/.55,1.-.72*t/.45,t<.45),1.-t,B.w>.5));}
  }
  return vec4f(o,0.);}`;
const CAVE_GLOW_U=new Float32Array(60);
function caveGlows(pass,GL,K){
  const U=CAVE_GLOW_U;let n=0;
  const flush=()=>{if(n){U[0]=n;gpuField(pass,"cave.glow",CAVE_GLOW_WGSL,U,null,{blend:"add"});n=0;}};
  for(let i=0;i<GL.length;i+=8){
    const x=GL[i],y=GL[i+1],R=GL[i+2];
    if(x+R<0||x-R>W||y+R<0||y-R>H)continue;
    const o=4+n*8;
    U[o]=x*K;U[o+1]=y*K;U[o+2]=R*K;U[o+3]=GL[i+3];
    U[o+4]=GL[i+4]/255;U[o+5]=GL[i+5]/255;U[o+6]=GL[i+6]/255;U[o+7]=GL[i+7];
    if(++n===7)flush();
  }
  flush();
}
/* конус фонаря скафандра — как у main: три слоя (k 1, .7, .4; раствор 1, 1.55, 2.1), в каждом
   градиент от человека вдоль взгляда (190,215,235)·.07k → (170,200,225)·.03k на .55 → ноль.
   Один слой давал жёсткую грань — свет читался нарисованным треугольником */
const CAVE_CONE_WGSL=`
fn field(p:vec2f,uv:vec2f)->vec4f{
  let A=fu.v[0];let q=p/fu.v[1].x-A.xy;let f=A.z;
  var o=vec3f(0.);
  for(var i=0;i<3;i++){
    let k=1.-f32(i)*.3;let sp=1.+f32(i)*.55;
    let u=q.x/(f*250.*k);
    if(u<0.||u>1.){continue;}
    if(q.y<-16.-(70.*sp-16.)*u||q.y>-16.+(56.*sp+16.)*u){continue;}
    let g=vec2f(f*230.*k*A.w,-20.);let t=clamp(dot(q,g)/dot(g,g),0.,1.);
    /* цвет и прозрачность — порознь, как тянет 2D: (190,215,235) → (170,200,225) → (150,190,220) */
    let u2=(t-.55)/.45;let u1=t/.55;
    o+=select(mix(vec3f(.667,.784,.882),vec3f(.588,.745,.863),u2)*(.03*k*(1.-u2)),
              mix(vec3f(.745,.843,.922),vec3f(.667,.784,.882),u1)*mix(.07*k,.03*k,u1),t<.55);
  }
  return vec4f(o,0.);}`;
const CAVE_CONE_U=new Float32Array(8);
/* луч фонаря со шлема (20-life drawAstronaut) — сложением по сцене, как «lighter» main по
   породе. На переднем 2D-слое флота «lighter» ложится поверх сцены с прозрачностью и гасит
   породу под собой: у лампы пещеры ядро выходило на 14 % темнее main (Контроль 26.09).
   Четырёхугольник и градиент main: центр (3,−7), радиус 2 → 64, (255,244,205)·.30 → ноль.
   Отсвет на груди остаётся в 2D — он лежит на самой фигуре. x, y — точка ходока в единицах
   вида (translate у drawAstronaut); true — луч лёг, 2D его не рисует */
const HELM_WGSL=`
fn field(p:vec2f,uv:vec2f)->vec4f{
  let A=fu.v[0];let q=(p/A.w-A.xy)*vec2f(A.z,1.);
  let u=(q.x-2.)/60.;
  let e=min(min(q.x-2.,62.-q.x),min((q.y+8.6+21.4*u)*.9419,(25.*u-5.-q.y)*.9231));
  let cv=clamp(e*A.w+.5,0.,1.);
  if(cv<=0.){return vec4f(0.);}
  let t=clamp((length(q-vec2f(3.,-7.))-2.)/62.,0.,1.);
  return vec4f(mix(vec3f(1.,.957,.804),vec3f(1.,.863,.588),t)*(.30*(1.-t)*cv),0.);}`;
const HELM_U=new Float32Array(4);
function helmBeamGpu(x,y,f){
  const pass=GPU.on&&GPU.overPass;
  if(!pass||!GPU_FRONT_LIKE.has(G.mode))return false;
  const u=HELM_U;u[0]=x;u[1]=y;u[2]=f||1;u[3]=G.viewK||1;
  gpuField(pass,"helm.beam",HELM_WGSL,u,null,{blend:"add"});
  return true;
}
