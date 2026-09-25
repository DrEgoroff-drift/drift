/* ══════════════ тело станции и планеты: что построил игрок, видно ══════════════
   M296, шаг 8 (DESIGN-holding §13). Формы построек на станции кладёт 12ad
   (holdMods → drawStModule, вторым слоем после штатных модулей, внешним
   кольцом: штанги 40–50 против 22–38 у штатных, чтобы своё читалось поверх
   казённого). Здесь — то, что вне корпуса станции:

   ПРИЧАЛЕННАЯ БАРЖА. У станции с Причалом (E4), которая лежит на плечах вашей
   баржи, баржа стоит у борта — тем же рисунком, что и баржи фактора (12l,
   BARGE_ART по посеву), только неподвижно и с подписью «У ПРИЧАЛА». Одна
   движущаяся вещь на станцию по замыслу — у причаленной движения нет.

   ОГНИ НА НОЧНОЙ СТОРОНЕ. Планета системы с вашими постройками получает
   тёплые точки на тёмной половине диска: по три на постройку, до двадцати
   четырёх; с Пояса огней (28) — вся ночная сторона в огнях. Точки стоят,
   не мигают (движение — ход, мерцание — стоянке). Рисуются поверх кэшированного
   диска, в экранных координатах, и в кэш не входят. */
function drawMooredBarge(zx,zy,Z){
  const sys=G.sys;if(!sys||!sys.station)return;
  if(typeof bldHas!=="function"||!bldHas(sys.sx,sys.sy,"prichal"))return;
  const c=(G.crew||[]).find(c=>c.order&&c.order.kind==="barge"&&c.barge&&c.barge.legs.indexOf(sys.key)>=0);
  if(!c||typeof drawBarge!=="function")return;
  const st=sys.station;
  const b=drawMooredBarge.b||(drawMooredBarge.b={});
  b.seed=hashi(sys.seed,0xB0A7,1);b.x=st.x+96;b.y=st.y+58;b.a=-.55;
  b.hullMax=140;b.hp=140;b.capName=bargeName(c);b.distress=0;b.underFire=0;b.escort=0;b.done=0;
  const x=zx(b.x),y=zy(b.y);
  const s=clamp(Z,.5,1.5)*.8;
  /* на видеокарте, как баржи фактора (12l): корпус светом звезды, огни и зевы фигурами,
     имя — подписью. 2D-пути нет (25.09) */
  const pass=gpuScene();if(!pass)return;
  if(gpuBargeBody(b,x,y,s))bargeLiveGpu(pass,b,x,y,s,b.a);
  /* швартов: одна линия к станции, чтобы стоянка читалась стоянкой (срез прямой, как у штриха) */
  const x0=x-10*s,y0=y-6*s,x1=zx(st.x)+34*clamp(Z,.4,1.5)*1.7,y1=zy(st.y)+22*clamp(Z,.4,1.5)*1.7;
  gpuShapes(pass,[[4,(x0+x1)/2,(y0+y1)/2,Math.hypot(x1-x0,y1-y0)/2,.5,Math.atan2(y1-y0,x1-x0),0,242,178,92,.35]]);
  domLabel("mb"+sys.key,x,y+30,"«"+bargeName(c).toUpperCase()+"» · У ПРИЧАЛА","9px ui-monospace,monospace","rgba(242,178,92,.8)","center");
}
/* сколько огней у планеты этой системы: по постройкам и по Поясу огней */
function planetLightsN(sys){
  const H=G.hold&&G.hold[sys.key],nb=H&&H.bld?Object.keys(H.bld).length:0;
  if(!nb)return 0;
  const belt=(typeof rungOf==="function")&&rungOf(sys.sx,sys.sy)>=28;
  return belt?48:Math.min(24,nb*3);
}
/* сколько огней на этой планете: на первом твёрдом теле системы — там живут.
   Рисует их шейдер планеты (17ga) городами на ночной суше */
function planetLightsOn(sys,p,r){
  if(!p||p.type==="gas"||r<6)return 0;
  const first=(sys.planets||[]).find(q=>q.type!=="gas");
  return first===p?planetLightsN(sys):0;
}

/* ореол-конус (был радиальный градиент 0→R, альфа линейно до нуля) фигурами прохода сцены, сложением:
   три мягких круга по трети радиуса — профиль конуса в 3 %, свет 0.99, пик тот же. Одна гладкая
   ступень давала плоскую вершину — пятно вместо ореола. Мельче 1.5 px устройства — один круг */
function glowCone(SH,x,y,R,c,a){
  const dk=GPU.bw/W;
  if(R*dk<=1.5){SH.push([1,x,y,0,0,0,R+.5/dk,c[0],c[1],c[2],a*(1.1-.35/Math.max(R*dk,.5))]);return;}
  for(let i=0;i<3;i++)SH.push([1,x,y,i*R/3+.5/dk,0,0,R/3-.5/dk,c[0],c[1],c[2],a/3]);
}
/* ── планета меняется тоже (M306, DESIGN-holding §13) ──
   Огни на ночной стороне были, а дневная сторона молчала. Три знака, каждый
   от своей причины и ни один — цифра: ОТВАЛ у шахты — бледное пятно на
   дневной стороне (любая добыча семьи A с породы: реголит, бурение, отвальный
   промысел); КУПОЛ оранжереи ловит солнце — одна яркая точка у терминатора с
   холодным ореолом (оранжерея, биостанция); ПОЛОСА — прямая линия там, где
   прямых не бывает, с рунга 6 «Полоса» (вы стояли на грунте). Всё в экранных
   координатах поверх кэшированного диска, как и огни; ничего не хранится.
   На видеокарте (25.09): фигуры прохода сцены. Эллипс — веер треугольников с жёсткими
   внутренними рёбрами; клипа по диску нет — дальше .85r от центра ни один знак не лежит,
   а клип был по r−1. Ореол купола — glowCone (выше) */
function drawPlanetWorks(sys,p,x,y,r){
  if(!p||p.type==="gas"||r<12)return;
  const first=(sys.planets||[]).find(q=>q.type!=="gas");
  if(first!==p)return;
  const H=G.hold&&G.hold[sys.key],B=H&&H.bld?H.bld:null;
  const has=id=>!!(B&&B[id]&&(typeof bldReady!=="function"||bldReady(B[id])));
  const dump=has("regolith")||has("deepdrill")||has("dumpworks");
  const dome=has("greenhouse")||has("biostation");
  const strip=(typeof rungOf==="function")&&rungOf(sys.sx,sys.sy)>=6;
  if(!dump&&!dome&&!strip)return;
  /* дневная сторона — к звезде; звезда системы в (0,0) */
  let ux=-(p.x||0),uy=-(p.y||0);const ln=Math.hypot(ux,uy)||1;ux/=ln;uy/=ln;
  const vx=-uy,vy=ux;                       /* вдоль лимба */
  const rr=rng(hashi(p.seed,0x0D0E,7));
  const pass=gpuScene();if(!pass)return;
  const dk=GPU.bw/W,SH=[];
  /* эллипс (центр, полуоси, поворот) — веер: рёбра к центру жёсткие, пиксель у одного треугольника */
  const ell=(cx,cy,ea,eb,an,C)=>{const N=clamp(Math.ceil(Math.sqrt(Math.max(ea,eb)*dk)*7),12,64),c=Math.cos(an),n=Math.sin(an);
    let px=cx+ea*c,py=cy+ea*n;
    for(let i=1;i<=N;i++){const t=i/N*TAU,ex=ea*Math.cos(t),ey=eb*Math.sin(t),qx=cx+ex*c-ey*n,qy=cy+ex*n+ey*c;
      SH.push([5,cx,cy,px,py,qx,qy,C[0],C[1],C[2],C[3],5]);px=qx;py=qy;}};
  if(dump){
    const d=r*.52, ox=x+ux*d+vx*r*(rr()-.5)*.5, oy=y+uy*d+vy*r*(rr()-.5)*.5;
    const ang=Math.atan2(vy,vx);
    ell(ox,oy,r*.13,r*.06,ang,[232,222,200,.30]);
    ell(ox+vx*r*.04,oy+vy*r*.04,r*.07,r*.035,ang+.3,[216,204,182,.34]);
    /* тень отвала со стороны от солнца — пятно стало горкой */
    ell(ox-ux*r*.035,oy-uy*r*.035,r*.11,r*.03,ang,[0,0,0,.22]);
  }
  if(strip){
    const d=r*.34, sx=x+ux*d+vx*r*(rr()-.5)*.6, sy=y+uy*d+vy*r*(rr()-.5)*.6;
    const a=Math.atan2(uy,ux)+(rr()-.5)*1.2, L=r*.16;
    SH.push([4,sx,sy,L,Math.max(1,r*.012)/2,a,0,236,232,220,.55]);   /* срез прямой (butt) */
  }
  gpuShapes(pass,SH);
  if(dome){
    /* у терминатора: там купол ловит низкое солнце */
    const a=Math.atan2(uy,ux)+(rr()<.5?1:-1)*(1.05+rr()*.25), d=r*.78;
    const dx=x+Math.cos(a)*d, dy=y+Math.sin(a)*d;
    /* купол светится грунтом того, кто его ставил (M369a, §19.4 «купола») */
    const dby=(G.sys&&G.sys.station&&G.sys.station.by)||"gt";
    const dc=(typeof makerGround==="function")?mixc(makerGround(dby),[200,255,230],.5):[200,255,230];
    const GL=[];glowCone(GL,dx,dy,r*.07,dc,.55);gpuShapes(pass,GL,{blend:"add"});
    gpuShapes(pass,[[1,dx,dy,Math.max(1.2,r*.014),0,0,0,255,255,244,.95]]);
  }
}
