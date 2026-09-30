/* ══════════════ планета: кадр нового вида (M610) ══════════════
   Собирает кадр из состояния игры и сдаёт его рендеру (21pe): объектив по
   рамке 2D-игры, свет по часу планеты, два короба теней, земля (21pf), то, что
   на ней растёт и лежит (21pg, 21pga), человек и корабль (21ph), вещи игры —
   залежи, вход в пещеру, устье шахты (21pi), её растения (21pia) и звери
   (21pib). Поверх кадра — подписи, следы и то, что ещё не перерисовано (21pj).
   Приборы рисует игра, как рисовала, и тычок «идти сюда» попадает туда же:
   рамка кадра на линии ходьбы — та же, что была.

   Старый кадр не тронут: drawSurface обёрнут здесь, последним модулем
   семейства. Переключатель выключен — идёт старая рисовалка; новый вид упал —
   тоже она, и после трёх сбоев подряд новый вид снимает себя сам.

   Свет по часу — пять картин суток и переход между ними по высоте светила,
   тела неба от мира, облака и воздух от его погоды (M612). Цвета земли пока
   одни, землеподобные: пустыня и лёд — M613. */
const PLN_FRAME={blobs:new Float32Array(260),bloom:BLOOM_K.surface,
  clouds:[[.318,.050,.115,21],[-.300,.058,.085,22],[-.078,.060,.034,23],[.150,.118,.030,24],[-.090,.235,.095,25],[.195,.400,.060,26]],
  bands:[190,345,1250,3000],
  thru:[1.2,1.1,.4,0],waterA:[.10,.30,.30,0],waterB:[.02,.10,.17,0]};
/* Наборы чисел неба, воздуха и заполняющего света — картины суток. Четвёртое число у каждого
   своё (21pb): звёзды, узость тёплой стороны неба, перистые, дальняя гряда, сила зарева,
   плотность воздуха и как он редеет с высотой, у облака на свету — сколько неба открыто
   (меньше — больше теней облаков на земле).
   Картин пять: ночь, синий час (светило под горизонтом, землю светит небо), золотой час,
   день — принятый кадр M600 — и полдень. У полудня светило стоит прямо за сценой, и вся
   ширина кадра — «его сторона»: тёплый горизонт дня там заливал кадр молоком */
const PLN_LOOK={
  noon:{skyZen:[.11,.30,.78,0],skyZenS:[.15,.37,.82,5],skyHor:[.58,.76,.96,.2],skyHorS:[.76,.85,.97,.5],sunGlow:[1,.92,.75,.7],
    airFar:[.50,.67,.94,1],airFarS:[.64,.76,.95,.003],airNear:[.8,.98,.95,0],ambSky:[.23,.32,.48,0],ambGnd:[.165,.18,.09,0],
    bounce:[.44,.5,.2,0],cloudLit:[1.3,1.27,1.2,.5],cloudDark:[.5,.58,.82,0],cloudDarkS:[.6,.62,.78,0],key:[1.6,1.5,1.3,0]},
  day:{skyZen:[.13,.33,.78,0],skyZenS:[.26,.48,.84,5],skyHor:[.62,.78,.95,.2],skyHorS:[1,.89,.72,.5],sunGlow:[1,.85,.6,1],
    airFar:[.5,.66,.92,1],airFarS:[.95,.8,.66,.003],airNear:[.8,.98,.95,0],ambSky:[.22,.3025,.451,0],ambGnd:[.16,.176,.088,0],
    bounce:[.42,.5,.2,0],cloudLit:[1.28,1.229,1.126,.5],cloudDark:[.5,.58,.82,0],cloudDarkS:[.7,.62,.7,0],key:[1.55,1.42,1.18,0]},
  gold:{skyZen:[.10,.21,.58,0],skyZenS:[.30,.33,.60,1.7],skyHor:[.70,.62,.72,.2],skyHorS:[1.45,.78,.34,.5],sunGlow:[1,.58,.26,1.6],
    airFar:[.54,.52,.74,1],airFarS:[1.15,.70,.42,.003],airNear:[.9,.95,.92,0],ambSky:[.18,.21,.34,0],ambGnd:[.14,.125,.078,0],
    bounce:[.5,.4,.12,0],cloudLit:[1.4,.9,.58,.5],cloudDark:[.38,.39,.62,0],cloudDarkS:[.86,.47,.42,0],key:[1.8,1.1,.54,0]},
  blue:{skyZen:[.035,.075,.24,.3],skyZenS:[.07,.12,.30,1.4],skyHor:[.22,.28,.50,.2],skyHorS:[1.05,.50,.30,.5],sunGlow:[1,.5,.25,1.1],
    airFar:[.15,.20,.40,1],airFarS:[.52,.36,.38,.003],airNear:[.85,.95,1,0],ambSky:[.085,.125,.25,0],ambGnd:[.035,.045,.055,0],
    bounce:[.06,.05,.03,0],cloudLit:[.74,.40,.38,.5],cloudDark:[.11,.13,.27,0],cloudDarkS:[.30,.19,.26,0],key:[1.3,.62,.3,0]},
  night:{skyZen:[.010,.020,.048,1],skyZenS:[.014,.028,.062,3],skyHor:[.046,.080,.122,.2],skyHorS:[.056,.090,.130,.5],sunGlow:[.35,.5,.8,.12],
    airFar:[.030,.052,.085,1],airFarS:[.040,.064,.098,.003],airNear:[.8,.95,1,0],ambSky:[.018,.034,.072,0],ambGnd:[.0054,.0116,.0187,0],
    bounce:[.013,.030,.024,0],cloudLit:[.10,.13,.19,.5],cloudDark:[.020,.030,.055,0],cloudDarkS:[.024,.034,.058,0],key:[.075,.125,.19,0]}};
/* на какой высоте светила (синус) стоит какая картина; между соседними — плавно */
const PLN_ACTS=[[-.17,"night"],[-.05,"blue"],[.075,"gold"],[.40,"day"],[.60,"noon"]];
function plnLookMix(a,b,t){
  const o={};
  for(const k in a){const x=a[k],y=b[k];o[k]=[lerp(x[0],y[0],t),lerp(x[1],y[1],t),lerp(x[2],y[2],t),lerp(x[3],y[3],t)];}
  return o;
}
function plnLookAt(sy){
  const T=PLN_ACTS,A=PLN_LOOK;
  for(let k=1;k<T.length;k++)if(sy<T[k][0])return plnLookMix(A[T[k-1][1]],A[T[k][1]],plnSmooth(T[k-1][0],T[k][0],sy));
  return plnLookMix(A.noon,A.noon,0);
}

/* ── объектив ──
   Рамка кадра на линии ходьбы — прямоугольник мира, который показывает 2D-игра; ноги человека
   стоят на доле f высоты от низа, горизонт — на доле hor. Узкому окну — шире угол: в высоком
   кадре земли и неба помещается больше, и объектив подходит ближе */
function plnLens(S,K){
  const ws=W/K,hs=H/K,k=plnSmooth(.6,1.5,ws/hs),f=lerp(.32,.28,k),hor=lerp(.52,.585,k),fov=lerp(46,24,k)*PLN_DEG;
  const co=camOffset(S),vx=S.cam.x-ws/2+co.x,vy=S.cam.y+10-hs*(1-f)+co.y;
  const l=vx/PLN_M,r=(vx+ws)/PLN_M,t=(PLN.y0-vy)/PLN_M,b=(PLN.y0-vy-hs)/PLN_M;
  const D=((t-b)/2)/Math.tan(fov/2),ex=(l+r)/2,ey=b+hor*(t-b);
  const vp=plnM4mul(plnM4lens(l-ex,r-ex,b-ey,t-ey,D,2,70000),plnM4move(-ex,-ey,D));
  return {vx,vy,ws,hs,ex,ey,D,hw:(r-l)/2,vp,eye:[ex,ey,-D]};
}

/* ── тела неба ──
   Луны мира идут низкой дугой над дальними холмами: встают за левым краем кадра, садятся за
   правым, выше восьми градусов не поднимаются. Дорога луны лежит там, куда смотрит объектив,
   иначе её не увидеть никогда: светило и всё, что ходит его кругом, в кадр не попадает.
   Час луны — час светила минус её фаза: полная стоит над сценой в полночь, новая ходит днём.
   Освещает тела светило как оно есть, и фаза выходит сама: днём луна у горизонта — серп,
   ночью — почти полная. Стоим на луне — родитель висит на одном месте (луна повёрнута к нему
   одной стороной), большой; ночью его свет — ключ.
   Отдаёт до трёх тел [азимут, высота, радиус, яркость], их род и самое сильное над горизонтом:
   направление и силу его света для ночи */
function plnBodies(p,th,sun){
  const B=[],K=[0,0,0,(p.seed>>>0)%97],ps=(G.sys&&G.sys.planets)||[];
  const kindOf=t=>t==="gas"?4:(t==="terran"||t==="ocean"||t==="jungle"||t==="toxic")?5:t==="ice"?2:(t==="metal"||t==="ruin")?3:1;
  const u=(s,k)=>((hashi(s,k,0x612)>>>0)%1000)/1000;
  let best=0,dir=null,warm=0;
  const put=(az,el,r,kind,giant)=>{
    if(B.length>=3||el<-r)return;
    K[B.length]=kind;B.push([az,el,r,1]);
    const md=[Math.sin(az)*Math.cos(el),Math.sin(el),Math.cos(az)*Math.cos(el)];
    /* сколько диска освещено — по углу между светилом и телом; свет тела — по его величине */
    const lit=clamp(.5-.5*(md[0]*sun[0]+md[1]*sun[1]+md[2]*sun[2]),0,1);
    const k=lit*(giant?1.7:Math.min(1,r/.035))*plnSmooth(-r,r*.5,el);
    if(k>best){best=k;dir=md;warm=giant?1:0;}
  };
  if(p.parentIdx!=null){
    const par=ps[p.parentIdx];
    if(par)put((u(p.seed,1)-.5)*.5,.10+u(p.seed,2)*.05,clamp(par.radius/Math.max(20,p.orbit),.06,.15),kindOf(par.type),true);
  }
  for(const m of (p.moons||[])){
    const A=.40+u(m.seed,3)*.14,E=.10+u(m.seed,4)*.04,h=th-celMoonPhase(m,G.t)*TAU;
    if(Math.sin(h)<=0)continue;
    put(-A*Math.cos(h),E*Math.sin(h),clamp(m.radius/Math.max(20,m.orbit),.02,.07),kindOf(m.type),false);
  }
  return {B,K,k:best,dir,warm};
}

/* ── погода в небе ──
   Облака, воздух и свет от погоды мира (19d). Дождь, снег и кислота идут из сплошного покрова:
   небо серое, ключ гаснет, свет плоский, лучей в воздухе нет, воздух гуще; туман кладёт воздух
   низко и густо, небо и облака уходят в молоко; пыль и пепел красят воздух и небо в свой цвет
   и гасят ключ, пепел ещё и темнит; споры чуть зеленят воздух. Сила погоды ходит своим циклом
   (weatherPower), затишья длиннее бурь. Сами осадки рисует слой поверх кадра (M626).
   Цвета погоды — линейные, от WEATHER.col */
const PLN_WX_COL={dust:[.55,.31,.12],ash:[.39,.30,.29],fog:[.55,.67,.77],rain:[.32,.40,.50],snow:[.85,.93,1],acid:[.49,.67,.15],spore:[.30,.83,.51]};
function plnWeatherLook(p,look){
  const wx=weatherOf(p),kind=wx.kind,wp=kind?weatherPower(p):0;
  if(!kind||wp<.04)return {kind,wp:0,cover:0,fog:0};
  const mx=(v,c,k)=>{v[0]=lerp(v[0],c[0],k);v[1]=lerp(v[1],c[1],k);v[2]=lerp(v[2],c[2],k);};
  const sc=(v,k)=>{v[0]*=k;v[1]*=k;v[2]*=k;};
  const lum=v=>.2126*v[0]+.7152*v[1]+.0722*v[2];
  const col=PLN_WX_COL[kind]||[.5,.5,.5],hb=Math.min(1.2,lum(look.skyHor)/.76),colH=[col[0]*hb,col[1]*hb,col[2]*hb];
  let cover=0,fog=0;
  if(kind==="rain"||kind==="snow"||kind==="acid"){
    cover=plnSmooth(.08,.55,wp);
    /* серое небо: уровень — от облака в тени этого часа, темнее к зениту, светлее к горизонту; оттенок
       осадка: снег белит и светлит, кислота зеленит. Земля под покровом темнее ясного дня */
    const lg=lum(look.cloudDark)*(kind==="snow"?.7:.55),lc=lum(col)||1,grey=[lg*(.65+.35*col[0]/lc),lg*(.65+.35*col[1]/lc),lg*(.65+.35*col[2]/lc)];
    const g=k=>[grey[0]*k,grey[1]*k,grey[2]*k];
    look.cloudDark[3]=cover;look.skyHorS[3]=lerp(look.skyHorS[3],.3,cover);
    mx(look.skyZen,g(.8),cover*.9);mx(look.skyZenS,g(.85),cover*.9);
    mx(look.skyHor,g(1.15),cover*.85);mx(look.skyHorS,g(1.2),cover*.85);
    mx(look.sunGlow,g(1.1),cover*.7);look.sunGlow[3]*=1-.85*cover;
    /* облака серые раньше, чем покров сплошной */
    const cg=Math.min(1,cover*1.4);
    mx(look.cloudLit,g(1.35),cg);mx(look.cloudDark,g(.72),cg);mx(look.cloudDarkS,g(.95),cg);
    sc(look.key,1-.8*cover);mx(look.ambSky,g(1),cover*.6);sc(look.ambGnd,1-.35*cover);sc(look.bounce,1-.6*cover);
    look.cloudLit[3]=lerp(look.cloudLit[3],1,cover);
    /* воздух под покровом того же серого, осадок его сгущает */
    mx(look.airFar,g(1.05),cover*.5);mx(look.airFarS,g(1.05),cover*.5);
    look.airFar[3]*=1+.7*wp;
  }else if(kind==="fog"){
    fog=plnSmooth(.05,.6,wp);
    mx(look.airFar,colH,.6*fog);mx(look.airFarS,colH,.6*fog);
    look.airFar[3]*=1+4.5*wp;look.airFarS[3]*=1+2*fog;
    for(const n of ["skyZen","skyZenS","skyHor","skyHorS"])mx(look[n],colH,.75*fog);
    for(const n of ["cloudLit","cloudDark","cloudDarkS"])mx(look[n],colH,.85*fog);
    look.sunGlow[3]*=1-.7*fog;sc(look.key,1-.55*fog);mx(look.ambSky,colH,.4*fog);sc(look.bounce,1-.4*fog);
  }else if(kind==="dust"||kind==="ash"){
    const k=plnSmooth(.05,.7,wp);
    mx(look.airFar,colH,.8*k);mx(look.airFarS,colH,.8*k);look.airFar[3]*=1+3*wp;look.airFarS[3]*=1+1.2*k;
    for(const n of ["skyHor","skyHorS"])mx(look[n],colH,.8*k);
    for(const n of ["skyZen","skyZenS"])mx(look[n],colH,(kind==="ash"?.7:.4)*k);
    for(const n of ["cloudLit","cloudDark","cloudDarkS"])mx(look[n],colH,.8*k);
    look.sunGlow[3]*=1-.5*k;
    sc(look.key,1-(kind==="ash"?.6:.45)*k);
    if(kind==="dust")mx(look.key,[look.key[0],look.key[1]*.9,look.key[2]*.7],k);
    mx(look.ambSky,colH,.5*k);
    if(kind==="ash"){sc(look.ambSky,1-.4*k);for(const n of ["skyZen","skyZenS","skyHor","skyHorS"])sc(look[n],1-.45*k);}
  }else if(kind==="spore"){
    const k=plnSmooth(.1,.8,wp);
    mx(look.airFar,colH,.25*k);mx(look.airFarS,colH,.25*k);mx(look.ambSky,colH,.15*k);
  }
  return {kind,wp,cover,fog};
}

/* ── свет по часу ──
   Светило ходит по кругу, наклонённому на 52°: днём свет идёт из-за сцены и сбоку, в лицо
   объективу не светит никогда. Низкое светило уходит за сцену глубже: встаёт слева-сзади,
   садится справа-сзади — свет и на заре остаётся контровым, а зарево входит в кадр с его края.
   Выше двадцати градусов круг прежний, кадр M600 (ph = .125) стоит на нём, как стоял.
   Ночью ключ — самое сильное тело над горизонтом (plnBodies): луна или родитель; ключ гаснет
   в ноль между светилом и им, и смены стороны не видно. Тел нет — ночь без ключа: землю держат
   звёзды, воздух и лампы. Шаг круга — пятая доля градуса: тени не ползут каждый кадр */
function plnHour(p){
  const c=celSun(p),q=.0035,th=Math.round(c.ph*TAU/q)*q,tilt=52*PLN_DEG,A=PLN_LOOK;
  const s0=Math.sin(th)*Math.cos(tilt),back=.55*(1-plnSmooth(.05,.38,s0));
  const sun=plnNorm([-Math.cos(th),s0,Math.sin(th)*Math.sin(tilt)+back]),sy=sun[1],rise=Math.cos(th)>0;
  const atm=(p.T&&p.T.atm)||"",air=atm==="отсутствует"?0:(atm.indexOf("разреженная")>=0?.5:1);
  /* сколько ночи разрешает область (три света, 11g): в ядре её нет вовсе — там вечный золотой час */
  const n0=clamp(-c.alt*(air?1.5:1.9)+.15,0,.62),rk=n0>0?clamp(surfNight(p)/n0,0,1):1;
  const se=Math.max(sy,lerp(.075,-.2,rk)),nk=(1-plnSmooth(-.14,.02,sy))*rk,ecl=celDark();
  const Bd=plnBodies(p,th,sun),bk=clamp(Bd.k,0,1),moonlit=sy<-.08&&rk>.5&&Bd.k>.05;
  const dir=moonlit?plnNorm([Bd.dir[0],Math.max(Bd.dir[1],.25),Bd.dir[2]]):plnNorm([sun[0],Math.max(sy,.1),sun[2]]);
  const look=plnLookAt(se);
  /* утро не вечер: на заре воздух гуще и лежит низко, тёплое — розовее; вечер суше и рыжее */
  const low=1-plnSmooth(.08,.42,se),warm=low*plnSmooth(-.12,-.02,se);
  if(rise&&warm>0){
    const m=(v,c2,k)=>{v[0]=lerp(v[0],c2[0],k);v[1]=lerp(v[1],c2[1],k);v[2]=lerp(v[2],c2[2],k);};
    m(look.skyHorS,[1.3,.80,.62],.7*warm);m(look.airFarS,[1.05,.74,.62],.7*warm);m(look.cloudLit,[1.35,.98,.80],.6*warm);
    m(look.cloudDarkS,[.74,.50,.56],.6*warm);m(look.key,[1.7,1.16,.72],.5*warm);
    look.airFar[3]*=1+.45*warm;look.airFarS[3]*=1+.8*warm;
  }
  const Wx=plnWeatherLook(p,look),wq=(1-.8*Wx.cover)*(1-.5*Wx.fog);
  /* ключ светила гаснет у горизонта, ключ тела неба встаёт, когда светило ушло: луна холодная, родитель тёплый;
     покров и туман гасят и его */
  const kd=look.key,kDay=Math.max(plnSmooth(-.05,.05,sy),moonlit?0:(1-rk)*.25);
  const kn=moonlit?plnSmooth(-.08,-.22,sy)*rk*Math.min(Bd.k,1.2)*wq:0,e=1-ecl,kc=Bd.warm?[.20,.17,.13]:A.night.key;
  const key=[(kd[0]*kDay+kc[0]*kn)*e,(kd[1]*kDay+kc[1]*kn)*e,(kd[2]*kDay+kc[2]*kn)*e];
  /* отсвет земли светит настолько, насколько светит ключ */
  look.bounce=plnMul(look.bounce,clamp(kDay+kn,0,1)*e).concat(0);
  /* затмение гасит небо и воздух; без воздуха небо чёрное и днём, звёзды стоят всегда;
     ночью облака светит тело неба — без него они темнеют почти до неба, а звёзд при нём меньше */
  const dim=(1-.7*ecl),sk=dim*air,cm=dim*lerp(1,lerp(.3,1,bk),nk);
  for(const n of ["skyZen","skyZenS","skyHor","skyHorS","sunGlow","airFar","airFarS"]){const v=look[n];v[0]*=sk;v[1]*=sk;v[2]*=sk;}
  for(const n of ["cloudLit","cloudDark","cloudDarkS"]){const v=look[n];v[0]*=cm;v[1]*=cm;v[2]*=cm;}
  /* свет тела неба рассеян и в воздухе: лунная ночь светлее безлунной не только ключом */
  {const v=look.ambSky,g=look.ambGnd,a=dim*lerp(.3,1,air)*(1+.6*bk*nk);v[0]*=a;v[1]*=a;v[2]*=a;g[0]*=dim;g[1]*=dim;g[2]*=dim;}
  look.skyZen[3]=clamp(Math.max(look.skyZen[3],ecl,1-air),0,1)*(1-.3*bk*nk);
  look.airFar[3]*=air;
  const sky=air>.7;
  if(!sky){look.skyHor[3]=0;look.skyHorS[3]=0;look.cloudLit[3]=1.6;}
  /* тела неба и светило как оно есть — шейдеру */
  const Z=[0,0,0,0];
  look.sunTrue=[sun[0],sun[1],sun[2],ecl];look.moon=Bd.B[0]||Z;look.moon2=Bd.B[1]||Z;look.moon3=Bd.B[2]||Z;look.bodyKind=Bd.K;
  /* лучи в воздухе сильнее, когда светило низко; под покровом и в тумане их нет */
  const shafts=.0024*(1+.9*low*plnSmooth(-.02,.06,sy))*(1-Wx.cover)*(1-.85*Wx.fog);
  return {ph:c.ph,sun,dir,key,look,night:nk,low,rise,air,ecl,shafts,bodies:Bd,wx:Wx,clouds:sky?PLN_FRAME.clouds:[]};
}

/* ── короб тени ──
   Прямоугольник света вокруг короба мира bx = [x0,x1, y0,y1, z0,z1]. Размер округлён вверх до
   восьми метров, середина стоит на сетке текселей: на ходу тень не дрожит */
function plnLightBox(dir,bx,n){
  const view=plnM4look(plnMul(dir,600),[0,0,0],[0,1,0]),lo=[1e9,1e9,1e9],hi=[-1e9,-1e9,-1e9];
  for(let k=0;k<8;k++){
    const q=plnTf(view,[bx[k&1],bx[2+((k>>1)&1)],bx[4+((k>>2)&1)]]);
    for(let a=0;a<3;a++){if(q[a]<lo[a])lo[a]=q[a];if(q[a]>hi[a])hi[a]=q[a];}
  }
  const sx=Math.ceil((hi[0]-lo[0])/8)*8,sy=Math.ceil((hi[1]-lo[1])/8)*8,tx=sx/n,ty=sy/n;
  const cx=Math.round((lo[0]+hi[0])*.5/tx)*tx,cy=Math.round((lo[1]+hi[1])*.5/ty)*ty;
  const near=lo[2]-80,far=hi[2]+5;
  return {m:plnM4mul(plnM4ortho(cx-sx/2,cx+sx/2,cy-sy/2,cy+sy/2,near,far),view),range:far-near};
}

/* ── кадр ── */
function plnSurface(){
  const t0=wallMs(),S=G.surf,tr=S.tr,p=S.p,K=surfScale(),Q=PLN_FRAME;
  /* то, что старый кадр делал попутно и на что опирается игра: свет 2D, ветер, камера */
  tr.p=p;sunDirSet(p);WIND=windOf(p);
  if(!S.cam)S.cam={x:S.x,y:S.y};
  PLN.y0=tr.padY;
  const L=plnLand(tr,p,S.shipX),C=plnLens(S,K),V={hw:C.hw,D:C.D},ride=plnLandLift(L,C.ex),wy=ride+PLN_LAND.wRel;
  G.viewX=C.vx;G.viewY=C.vy;G.viewK=K;
  plnLandStep(L,C.ex,V,2);
  plnPlantStep(L,p,C.ex,V);
  const Hr=plnHour(p),span=plnLandSpan(L,C.ex-60,C.ex+60),look=Hr.look;
  look.thru=Q.thru;look.waterA=Q.waterA;look.waterB=[Q.waterB[0],Q.waterB[1],Q.waterB[2],ride];
  look.bands=Q.bands;
  look.world=[L.sd%1000,clamp(WIND*1.4,-1.2,1.2),0,0];
  const F={vp:C.vp,vpMirror:plnM4mul(C.vp,plnM4mirrorY(wy)),eye:C.eye,t:(G.t/60)%7200,sun:Hr.dir,key:Hr.key,expo:1,waterY:wy,
    L0:plnLightBox(Hr.dir,[C.ex-58,C.ex+58,span.lo-8,span.hi+17,-50,24],PLN_GPU.shn),
    L1:plnLightBox(Hr.dir,[C.ex-250,C.ex+250,Math.min(ride-12,span.lo-8),Math.max(ride+60,span.hi+20),-50,460],PLN_GPU.shn),
    hero:[0,0,15,36],lamps:[],look,clouds:Hr.clouds,blobs:Q.blobs,batches:[],
    post:{shafts:[Hr.shafts,1600,.62,-.06],bloom:.085,vig:.42,grade:1}};
  Q.blobs.fill(0);
  plnLandBatches(L,F.batches,C.ex,V);
  /* в воде человек сидит в круге по пояс: тело стоит ниже, чем его держит игра */
  const swim=clamp(S.swim||0,0,1),man=[S.x/PLN_M,plnY(S.y+10)-PLN_CAST.sink*swim,0],ship=[L.shipX,plnLandRibAt(L,L.shipX,L.shipZ),L.shipZ];
  plnCastFrame(F,man,S.face,ship,L.shipYaw,swim);
  plnThingsFrame(L,F,S,p,C.ex,V);
  plnBeastFrame(L,F,S,p,C.ex,V);
  plnHerbFrame(L,F,S,p,C.ex,V);
  /* ночью у человека горит налобник: светит вперёд по взгляду, на землю перед ним */
  if(Hr.night>.15)F.lamps.push({p:[man[0]+S.face*1.6,man[1]+1.5,man[2]-.4],r:8,c:[1,.86,.62],k:2.4*plnSmooth(.15,.6,Hr.night)});
  /* пятна тени героев и вещей легли первыми, остаток мест — тому, что растёт */
  plnPlantBatches(L,F,C.ex,V);
  /* герой стоит в пятне света: пятно лежит там, куда его тень падает на уровень сцены */
  const hk=(man[1]-ride)/Math.max(Hr.dir[1],.08);
  F.hero[0]=man[0]-Hr.dir[0]*hk;F.hero[1]=man[2]-Hr.dir[2]*hk;
  PLN.cam=C;PLN.sun=Hr;
  PLN.stat.cpu=+(wallMs()-t0).toFixed(2);
  return plnGpuFrame(F);
}

/* ── переключатель ── */
const PLN_OLD_SURFACE=drawSurface;
drawSurface=function(){
  let ok=false;
  if(PLN.on&&PLN.bad<3&&G.surf&&G.surf.tr&&G.surf.p){
    try{
      ok=plnGpuReady()&&plnSurface();
      if(ok)PLN.bad=0;
    }catch(e){
      PLN.bad++;PLN.err=String((e&&e.stack)||e).slice(0,600);plnLog("кадр: "+PLN.err);
      /* кадр мог упасть с открытым проходом: кодировщик берём новый, старой рисовалке — чистый лист */
      if(GPU.on&&GPU.dev){GPU.enc=GPU.dev.createCommandEncoder();GPU.scenePass=null;GPU.sceneOn=false;GPU.scene3D=false;}
    }
  }
  /* свечение у нового вида своё; движку оставлено только зерно */
  BLOOM_K.surface=ok?0:PLN_FRAME.bloom;
  if(!ok){PLN_OLD_SURFACE();return;}
  withScale(G.viewK,plnOver);
  const U=(typeof UIK==="number"&&UIK>0)?UIK:1;
  withScale(U,()=>drawSurfaceHud(G.viewX,G.viewY,G.viewK/U));
};
