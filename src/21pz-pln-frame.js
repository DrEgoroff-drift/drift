/* ══════════════ планета: кадр нового вида (M610) ══════════════
   Собирает кадр из состояния игры и сдаёт его рендеру (21pe): объектив по
   рамке 2D-игры, свет по часу планеты, два короба теней, земля (21pf), человек
   и корабль (21ph). Приборы рисует игра, как рисовала, и тычок «идти сюда»
   попадает туда же: рамка кадра на линии ходьбы — та же, что была.

   Старый кадр не тронут: drawSurface обёрнут здесь, последним модулем
   семейства. Переключатель выключен — идёт старая рисовалка; новый вид упал —
   тоже она, и после трёх сбоев подряд новый вид снимает себя сам.

   Свет по часу здесь грубый: три набора чисел — день, закат, ночь — и переход
   между ними по высоте светила. Закат и ночь по числам стенда, облака от
   погоды и затмение как следует — M612. Цвета земли пока одни, землеподобные:
   пустыня и лёд — M613. */
const PLN_FRAME={blobs:new Float32Array(260),bloom:BLOOM_K.surface,
  clouds:[[.318,.050,.115,21],[-.300,.058,.085,22],[-.078,.060,.034,23],[.150,.118,.030,24],[-.090,.235,.095,25],[.195,.400,.060,26]],
  /* дневная луна: азимут, высота, радиус, яркость */
  moon:[-2.6*PLN_DEG,7.63*PLN_DEG,1.5*PLN_DEG,1],
  bands:[190,345,1250,3000],
  thru:[1.2,1.1,.4,0],waterA:[.10,.30,.30,0],waterB:[.02,.10,.17,0]};
/* Наборы чисел неба, воздуха и заполняющего света. Четвёртое число у каждого своё (21pb):
   звёзды, перистые, дальняя гряда, сила зарева, плотность воздуха и как он редеет с высотой,
   у облака на свету — сколько неба открыто (меньше — больше теней облаков на земле) */
const PLN_LOOK={
  day:{skyZen:[.13,.33,.78,0],skyZenS:[.26,.48,.84,0],skyHor:[.62,.78,.95,.2],skyHorS:[1,.89,.72,.5],sunGlow:[1,.85,.6,1],
    airFar:[.5,.66,.92,1],airFarS:[.95,.8,.66,.003],airNear:[.8,.98,.95,0],ambSky:[.22,.3025,.451,0],ambGnd:[.16,.176,.088,0],
    bounce:[.42,.5,.2,0],cloudLit:[1.28,1.229,1.126,.5],cloudDark:[.5,.58,.82,0],cloudDarkS:[.7,.62,.7,0],key:[1.55,1.42,1.18,0]},
  dusk:{skyZen:[.10,.20,.52,0],skyZenS:[.30,.34,.60,0],skyHor:[.66,.62,.70,.2],skyHorS:[1.3,.66,.32,.5],sunGlow:[1,.55,.25,1.5],
    airFar:[.5,.52,.72,1],airFarS:[1.05,.66,.42,.003],airNear:[.85,.95,.95,0],ambSky:[.17,.20,.31,0],ambGnd:[.13,.12,.075,0],
    bounce:[.46,.39,.10,0],cloudLit:[1.3,.84,.56,.5],cloudDark:[.38,.40,.60,0],cloudDarkS:[.78,.46,.42,0],key:[1.7,1.1,.59,0]},
  night:{skyZen:[.010,.020,.048,1],skyZenS:[.014,.028,.062,0],skyHor:[.046,.080,.122,.2],skyHorS:[.056,.090,.130,.5],sunGlow:[.35,.5,.8,.12],
    airFar:[.030,.052,.085,1],airFarS:[.040,.064,.098,.003],airNear:[.8,.95,1,0],ambSky:[.018,.034,.072,0],ambGnd:[.0054,.0116,.0187,0],
    bounce:[.013,.030,.024,0],cloudLit:[.10,.13,.19,.5],cloudDark:[.020,.030,.055,0],cloudDarkS:[.024,.034,.058,0],key:[.049,.084,.14,0]}};
function plnLookMix(a,b,t){
  const o={};
  for(const k in a){const x=a[k],y=b[k];o[k]=[lerp(x[0],y[0],t),lerp(x[1],y[1],t),lerp(x[2],y[2],t),lerp(x[3],y[3],t)];}
  return o;
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

/* ── свет по часу ──
   Светило ходит по кругу, наклонённому на 52°: днём свет идёт из-за сцены и сбоку, в лицо
   объективу не светит никогда. Ночью ключ — луна с другой стороны; ключ гаснет в ноль между
   ними, и смены стороны не видно. Шаг круга — пятая доля градуса: тени не ползут каждый кадр */
function plnHour(p){
  const c=celSun(p),q=.0035,th=Math.round(c.ph*TAU/q)*q,tilt=52*PLN_DEG,A=PLN_LOOK;
  const sun=plnNorm([-Math.cos(th),Math.sin(th)*Math.cos(tilt),Math.sin(th)*Math.sin(tilt)]),sy=sun[1];
  const atm=(p.T&&p.T.atm)||"",air=atm==="отсутствует"?0:(atm.indexOf("разреженная")>=0?.5:1);
  /* сколько ночи разрешает область (три света, 11g): в ядре её нет вовсе */
  const n0=clamp(-c.alt*(air?1.5:1.9)+.15,0,.62),rk=n0>0?clamp(surfNight(p)/n0,0,1):1;
  const high=plnSmooth(.05,.35,sy),nk=(1-plnSmooth(-.12,.08,sy))*rk,ecl=celDark();
  const moonlit=sy<-.08&&rk>.5;
  const dir=moonlit?plnNorm([-sun[0],Math.max(-sy,.25),Math.abs(sun[2])+.3]):plnNorm([sun[0],Math.max(sy,.1),sun[2]]);
  const look=plnLookMix(plnLookMix(A.dusk,A.day,high),A.night,nk);
  const kd=plnMix3(A.dusk.key,A.day.key,high),kDay=Math.max(plnSmooth(-.08,.06,sy),moonlit?0:(1-rk)*.25);
  const kn=moonlit?plnSmooth(-.08,-.22,sy)*rk:0,e=1-ecl;
  const key=[(kd[0]*kDay+A.night.key[0]*kn)*e,(kd[1]*kDay+A.night.key[1]*kn)*e,(kd[2]*kDay+A.night.key[2]*kn)*e];
  /* отсвет земли светит настолько, насколько светит ключ */
  const kb=clamp((key[0]+key[1]+key[2])/(kd[0]+kd[1]+kd[2]),0,1);
  look.bounce=plnMul(A.day.bounce,kb).concat(0);
  /* затмение гасит небо и воздух; без воздуха небо чёрное и днём, звёзды стоят всегда */
  const dim=(1-.7*ecl),sk=dim*air;
  for(const n of ["skyZen","skyZenS","skyHor","skyHorS","sunGlow","airFar","airFarS"]){const v=look[n];v[0]*=sk;v[1]*=sk;v[2]*=sk;}
  for(const n of ["cloudLit","cloudDark","cloudDarkS"]){const v=look[n];v[0]*=dim;v[1]*=dim;v[2]*=dim;}
  {const v=look.ambSky,g=look.ambGnd,a=dim*lerp(.3,1,air);v[0]*=a;v[1]*=a;v[2]*=a;g[0]*=dim;g[1]*=dim;g[2]*=dim;}
  look.skyZen[3]=clamp(Math.max(nk,ecl,1-air),0,1);
  look.airFar[3]*=air;
  const sky=air>.7;
  if(!sky){look.skyHor[3]=0;look.skyHorS[3]=0;look.cloudLit[3]=1.6;}
  return {ph:c.ph,sun,dir,key,look,night:nk,air,ecl,clouds:sky?PLN_FRAME.clouds:[]};
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
  const Hr=plnHour(p),span=plnLandSpan(L,C.ex-60,C.ex+60),look=Hr.look;
  look.thru=Q.thru;look.waterA=Q.waterA;look.waterB=[Q.waterB[0],Q.waterB[1],Q.waterB[2],ride];
  look.moon=Q.moon;look.bands=Q.bands;
  look.world=[L.sd%1000,clamp(WIND*1.4,-1.2,1.2),0,0];
  const F={vp:C.vp,vpMirror:plnM4mul(C.vp,plnM4mirrorY(wy)),eye:C.eye,t:(G.t/60)%7200,sun:Hr.dir,key:Hr.key,expo:1,waterY:wy,
    L0:plnLightBox(Hr.dir,[C.ex-58,C.ex+58,span.lo-8,span.hi+17,-50,24],PLN_GPU.shn),
    L1:plnLightBox(Hr.dir,[C.ex-250,C.ex+250,Math.min(ride-12,span.lo-8),Math.max(ride+60,span.hi+20),-50,460],PLN_GPU.shn),
    hero:[0,0,15,36],lamps:[],look,clouds:Hr.clouds,blobs:Q.blobs,batches:[],
    post:{shafts:[.0024,1600,.62,-.06],bloom:.085,vig:.42,grade:1}};
  Q.blobs.fill(0);
  plnLandBatches(L,F.batches,C.ex,V);
  const man=[S.x/PLN_M,plnY(S.y+10),0],ship=[L.shipX,plnLandRibAt(L,L.shipX,L.shipZ),L.shipZ];
  plnCastFrame(F,man,S.face,ship,L.shipYaw);
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
  const U=(typeof UIK==="number"&&UIK>0)?UIK:1;
  withScale(U,()=>drawSurfaceHud(G.viewX,G.viewY,G.viewK/U));
};
