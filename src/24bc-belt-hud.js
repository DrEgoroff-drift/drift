/* ══════════════ кабина пояса на слое приборов #hud (ступень 2, п.2; docs/DESIGN-gpu.md) ══════════════
   Кабина и символика стекла — интерфейс: их место на #hud поверх #g, как у приборов полёта
   (08bh). Браузер кладёт слой сам, копии #c в Dawn нет, и холст — на родном DPR устройства.
   Растр — только когда картинка другая. Ключ собран руками по входам рисунка, как подпись
   колодки 25c: камера (базис), курс, вектор скорости, цель, топливо и корпус, скорость,
   радар, трюм, лампы, держатель узла, рукоятки. Что ключ не упустил ничего, стережёт оракул в
   воротах (91zzzzzzy1): там рисунок идёт в подставной ctx, и любая смена протокола вызовов
   обязана сменить ключ. Протокол на боевом кадре стоил втрое дороже самого рисунка и ~400 КБ
   мусора (замер на 4× троттлинге).
   На ходу слой перерисовывается каждый кадр, и мусор там — это рывок сборщика на телефоне.
   Поэтому ключ не выделяет памяти: числа пишутся в заведённый Float64Array и сравниваются
   на месте, ссылки и строки — в заведённый массив; строка ключа для 08bh собирается, только
   когда вход сменился. Рисунок зовётся одной функцией модуля, без замыканий на кадр */
const BHUD={redraw:0,rec:false,pod:"",podF:0,
  K:new Float64Array(256),R:[],n:0,m:0,n0:-1,m0:-1,chg:true,gen:0,ks:"belt|0",
  b:null,proj:null,fwd:null,st:null,font:[],need:new Map()};
/* кегль доски: строка шрифта на размер — одна на всю игру, а не новая на каждый кадр */
function ckptFont(px){const F=BHUD.font;return F[px]||(F[px]=px+"px ui-monospace,monospace");}
/* ширина самой длинной подписи ламп — от шрифта и трёх постоянных слов, не от кадра */
function ckptLampNeed(lamps){
  const f=ctx.font;let v=BHUD.need.get(f);
  if(v===undefined){v=0;for(let i=0;i<lamps.length;i++)v=Math.max(v,ctx.measureText(lamps[i][0]).width);v+=14;BHUD.need.set(f,v);}
  return v;
}
/* ячейки ключа: число — в Float64Array, ссылка или строка — в массив; сравнение на месте */
function bkN(v){const i=BHUD.n++;if(BHUD.K[i]!==v){BHUD.K[i]=v;BHUD.chg=true;}}
function bkR(v){const i=BHUD.m++;if(BHUD.R[i]!==v){BHUD.R[i]=v;BHUD.chg=true;}}
/* ключ кадра кабины и стекла: всё, от чего зависит рисунок, с шагом отображения — четверть
   пикселя. Углы и базис камеры — 1/(4·max(W,H)) рад: поворот на шаг сдвигает самую дальнюю
   точку стекла меньше чем на ¼ px (мельче ключ ловил, как крен после манёвра доползает к
   цели по 5 % за кадр, и перерисовывал слой в прямом полёте каждый кадр). Возвращает строку
   для 08bh: новая — только когда вход сменился */
function bhudKey(b,fwd,st,bas){
  const A=4*Math.max(W,H),F=Math.min(W,H)*.95;BHUD.n=BHUD.m=0;BHUD.chg=false;
  bkR(CKPT.key);bkN(W);bkN(H);bkN(uiK());bkR(G.shipId);
  const vf=bas.fwd,vr=bas.right,vu=bas.up;
  bkN(Math.round(vf[0]*A));bkN(Math.round(vf[1]*A));bkN(Math.round(vf[2]*A));
  bkN(Math.round(vr[0]*A));bkN(Math.round(vr[1]*A));bkN(Math.round(vr[2]*A));
  bkN(Math.round(vu[0]*A));bkN(Math.round(vu[1]*A));bkN(Math.round(vu[2]*A));
  bkN(Math.round(b.yaw*A));bkN(Math.round(b.pitch*A));bkN(Math.round(b.roll*A));
  const sp=Math.hypot(b.vx,b.vy,b.vz);
  bkN(Math.round(sp*10));
  if(sp>.12){bkN(Math.round(b.vx/sp*A));bkN(Math.round(b.vy/sp*A));bkN(Math.round(b.vz/sp*A));}else bkN(-1e9);
  const L=b.lock;
  bkR(L||null);
  /* цель — тем, что видно: рамка на стекле (место и размер ¼ px, дальность в метрах) и
     дальность до поверхности на доске; место цели на радаре несёт место корабля ниже */
  if(L){
    bkR(L.res);bkN(L.left);bkN(L.r);bkN(Math.round(b.prog*256));
    const dx=L.x-b.x,dy=L.y-b.y,dz=L.z-b.z,zc=dx*vf[0]+dy*vf[1]+dz*vf[2];
    if(zc<2)bkN(-1e9);
    else{bkN(Math.round((W/2+(dx*vr[0]+dy*vr[1]+dz*vr[2])*F/zc)*4));bkN(Math.round((H/2-(dx*vu[0]+dy*vu[1]+dz*vu[2])*F/zc)*4));
      bkN(Math.round(clamp(L.r*F/zc,16,190)*4));bkN(Math.round(zc));}
    const dd=Math.hypot(dx,dy,dz)-L.r;bkN(Math.round(dd));bkN(dd>CUT_RANGE?1:0);
  }
  bkN(b.hit>0?Math.round(b.hit/14*22):0);
  const hd=held();
  bkN(Math.round(G.fuel/st.fuelMax*1024));bkN(Math.round(G.hull/st.hullMax*1024));
  bkN(st.fuelMax);bkN(st.hullMax);bkN(st.cargoMax);bkN(hd);
  for(let i=0;i<RES_KEYS.length;i++)bkN(G.cargo[RES_KEYS[i]]||0);
  /* панель и лента — подпись колодки 25c (стрелки 1/256 шкалы, голова и откат ленты). Она
     дороже всего ключа (instrRead), а стрелки ползут долями пикселя — читается раз в четыре
     кадра: одна стрелка опоздает не больше чем на три кадра, любая другая смена перерисует
     кабину со свежими стрелками */
  if(!BHUD.pod||GPU.frameNo-BHUD.podF>=4||GPU.frameNo<BHUD.podF){
    BHUD.pod=$ipod?instrPodSig(instrRead(),tapeInit()):instrMisclose().toFixed(3);BHUD.podF=GPU.frameNo;}
  bkR(BHUD.pod);
  /* радар: камни пояса стоят (перенос вокруг камеры — только от хода корабля), так что точки
     шкалы двигает лишь корабль. Вместо сотни камней в ключе — место корабля с шагом в четверть
     пикселя шкалы (радиус ≤ 77 px на 2000 м) и прозрачность по высоте 1/256; список камней —
     по ссылке и длине (выработанный уходит из списка), захват — ссылкой выше */
  bkR(b.ast);bkN(b.ast.length);
  bkN(Math.round(b.x*.16));bkN(Math.round(b.y*.4));bkN(Math.round(b.z*.16));
  /* лампы доски: сближение мигает, подпись чередуется, когда горят две и тесно */
  const nearOn=b.near<130&&Math.sin(G.t*.25)>-.2,lit=(nearOn?1:0)+(G.fuel/st.fuelMax<.2?1:0)+(hd>=st.cargoMax?1:0);
  bkN(b.near<130?1:0);bkN(nearOn?1:0);bkN(lit>1?Math.floor(G.t/150):0);
  /* держатель узла: качание и мерцание венцов — только когда есть что держать */
  const N=nodeHolder();
  bkR(N?N.id:null);
  if(N)bkN(Math.round((Math.sin(G.t*.045)*.05+clamp(b.roll*.6+b.avYaw*3,-.5,.5)*.5)*2048));
  for(let i=0,c=0;i<NODE_FAMS.length;i++){
    const F=NODE_FAMS[i];
    if(G.crowns&&G.crowns[F.id]){bkR(F.id);bkN(Math.round((.6+.4*Math.sin(G.t*.06+c*1.3))*64));c++;}
  }
  /* рукоятки и рычаг тяги */
  bkN(keys.act?1:0);bkN(keys.fire?1:0);bkN(keys.thrust?1:0);bkN(keys.brake?1:0);
  bkN(Math.round(clamp(b.avYaw*8,-.5,.5)*1024));bkN(Math.round(clamp(-b.avPitch*7,-.45,.45)*1024));
  /* сменилось число ячеек (цель появилась, венец добавился) — тоже смена */
  if(BHUD.n!==BHUD.n0||BHUD.m!==BHUD.m0){BHUD.n0=BHUD.n;BHUD.m0=BHUD.m;BHUD.chg=true;}
  if(BHUD.chg)BHUD.ks="belt|"+(++BHUD.gen);
  return BHUD.ks;
}
/* рисунок слоя: входы кадра лежат в BHUD, чтобы не заводить замыкание на кадр */
function bhudDraw(){
  BHUD.redraw++;BHUD.rec=true;
  try{
    /* символика — только на стекле: рама и переплёт теперь под слоем (в сцене), и без
       клипа лесенка и рамка цели легли бы поверх стоек */
    const P=cockpitTex(G.shipId).plan;
    ctx.save();ctx.beginPath();addPath(ctx,P.glass);
    for(const s of P.strut)addPath(ctx,[[s.xt-s.w,P.brow-2],[s.xt+s.w,P.brow-2],[s.xb+s.w*1.5,P.dashY+2],[s.xb-s.w*1.5,P.dashY+2]]);
    if(P.beam)ctx.rect(P.pw,P.beam.y-P.beam.h,W-2*P.pw,P.beam.h*2);
    ctx.clip("evenodd");
    try{drawGlassHUD(BHUD.b,BHUD.proj,BHUD.fwd,BHUD.st);}finally{ctx.restore();}
    drawCockpit(BHUD.b,BHUD.st);
  }finally{BHUD.rec=false;}
}
/* стекло и кабина пояса: с видеокартой — на слой приборов по изменению, без неё — на #c */
function beltHudPush(b,proj,fwd,st,bas){
  if(!GPU.on||!GPU.uctx){drawGlassHUD(b,proj,fwd,st);drawCockpit(b,st);return;}
  BHUD.b=b;BHUD.proj=proj;BHUD.fwd=fwd;BHUD.st=st;
  cockpitTex(G.shipId);
  gpuHud(bhudKey(b,fwd,st,bas||beltBasis(b)),bhudDraw);
}
