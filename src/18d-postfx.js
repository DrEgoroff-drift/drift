/* ══════════════ эффекты кадра: марево, хроматика (M325) ══════════════
   Из списка автора (эффекты, 2026-09-03: «берём все»). Оба — про сам кадр,
   а не про мир: они читают уже нарисованное и кладут его обратно чуть иначе.
   Правила файла:
   1. Ничего не хранится, кроме силы удара (HIT_FX): состояние — в кадре.
   2. Самокопия канвы берётся в её собственных пикселях (×DPR): холст крупнее
      W×H, а ctx считает в CSS-единицах — иначе марево уедет в угол.
   3. Дорого — только когда есть повод: марево лишь при тяге, хроматика лишь
      несколько кадров после попадания. В тихом кадре здесь ноль работы. */
let HIT_FX=0,FX_CN=null;
function hitFx(k){HIT_FX=Math.max(HIT_FX,clamp(k==null?1:k,0,1));}
function fxCanvas(){
  if(!FX_CN||FX_CN.width!==cvs.width||FX_CN.height!==cvs.height){
    FX_CN=document.createElement("canvas");FX_CN.width=cvs.width;FX_CN.height=cvs.height;
  }
  return FX_CN;
}
/* ── марево над соплами ──
   Горячий газ преломляет: то, что за факелом, дрожит. Прямоугольник кадра за
   соплом режется на полоски поперёк факела, и каждая кладётся обратно со своим
   сдвигом в пиксель-полтора, бегущим по синусу от времени. Никакого цвета:
   марево — это искажение, а не свечение. (x0,y0,w,h) — в CSS-единицах.

   ── и почему оно теперь через офскрин (0.2, 17.09) ──
   Первая версия брала полоски прямо из cvs — холст в самого себя, до девяти
   раз на сопло и до восемнадцати у корабля с двумя. Каждое такое чтение
   только что нарисованного холста ломает конвейер видеокарты: растр ждёт, пока
   кадр долетит до памяти, и так девять раз подряд. Замер Тестировщика на S23
   (17.09, одна вкладка, 20 с руления): со маревом 33.5 fps и каденция 67 %, без него —
   59.8 fps и 99.6 %. Одна функция стоила больше, чем всё остальное в игре вместе.
   Условие автора — оптимизировать, не резать: «это красиво».
   Теперь самокопия СЛУЧАЕТСЯ ОДИН РАЗ за кадр: кусок холста, накрывающий все
   сопла, ложится в маленький офскрин, а полоски идут из него — чтение чужого
   холста конвейера не рвёт. Полосок, альфа, синус и сдвиги — те же самые.
   Одно отличие по сути: полоски берутся из НЕТРОНУТОГО кадра, а не из того, куда
   уже легло марево соседнего сопла — то есть двойного искажения больше нет. */
let HZ_CN=null,HZ_OX=0,HZ_OY=0,HZ_OK=false;
/* кусок кадра в офскрин: возвращает false, если брать нечего */
function hazeGrab(x0,y0,w,h){
  HZ_OK=false;
  const sx0=Math.max(0,Math.floor(x0)),sy0=Math.max(0,Math.floor(y0));
  const sw=Math.min(W-sx0,Math.ceil(w)),sh=Math.min(H-sy0,Math.ceil(h));
  if(sw<4||sh<4)return false;
  const pw=Math.max(1,Math.ceil(sw*DPR)),ph=Math.max(1,Math.ceil(sh*DPR));
  if(!HZ_CN)HZ_CN=document.createElement("canvas");
  /* холст только растёт и никогда не пересоздаётся на каждый кадр:
     новый холст в кадре — это та же цена, от которой мы уходим */
  if(HZ_CN.width<pw)HZ_CN.width=pw;
  if(HZ_CN.height<ph)HZ_CN.height=ph;
  const g=HZ_CN.getContext("2d");
  g.setTransform(1,0,0,1,0,0);
  g.globalCompositeOperation="copy";   /* без clearRect: copy сам затирает */
  g.drawImage(frameCanvas(),sx0*DPR,sy0*DPR,pw,ph,0,0,pw,ph);
  HZ_OX=sx0;HZ_OY=sy0;HZ_OK=true;
  return true;
}
/* полоски одного сопла — из уже снятого офскрина */
function heatHazeFrom(x0,y0,w,h,k,seed){
  if(!HZ_OK||!(w>=4&&h>=4&&k>0))return;
  const sx0=Math.max(0,Math.floor(x0)),sy0=Math.max(0,Math.floor(y0));
  const sw=Math.min(W-sx0,Math.ceil(w)),sh=Math.min(H-sy0,Math.ceil(h));
  if(sw<4||sh<4)return;
  const n=Math.max(3,Math.min(9,Math.round(sh/4)));
  const bh=sh/n;
  ctx.save();ctx.globalAlpha=Math.min(.9,.55+.35*k);
  for(let i=0;i<n;i++){
    const t=(i+.5)/n;
    const dx=Math.sin(G.t*1.35+i*1.9+(seed||0))*(.8+1.4*k)*(1-Math.abs(t-.5))*2;
    const y=sy0+i*bh;
    ctx.drawImage(HZ_CN,(sx0-HZ_OX)*DPR,(y-HZ_OY)*DPR,sw*DPR,Math.ceil(bh)*DPR,sx0+dx,y,sw,Math.ceil(bh));
  }
  ctx.restore();
}
function hazeDone(){HZ_OK=false;}
/* одиночный прямоугольник со своим снимком — для тех, кто зовёт марево само по себе */
function heatHaze(x0,y0,w,h,k,seed){
  if(!hazeGrab(x0,y0,w,h))return;
  heatHazeFrom(x0,y0,w,h,k,seed);
  HZ_OK=false;
}
/* ── хроматическая аберрация на попадании ──
   Удар по корпусу — на мгновение объектив «разъезжается»: красная копия кадра
   уходит влево, синяя вправо, на контрастных кромках появляются цветные
   каёмки, и через треть секунды всё сходится обратно. Копия красится
   умножением на чистый цвет в своём холсте и складывается светом (lighter):
   середина кадра почти не светлеет, красятся только сдвинутые края. */
function drawHitFx(dt){
  if(HIT_FX<=.02){HIT_FX=0;return;}
  const k=HIT_FX;
  const dx=(1.5+5*k)*(1+.35*Math.sin(G.t*2.1));
  /* у видеокарты хроматика — строка общего прохода (08b fsFinal) */
  if(GPU.on){GPU.hitK=k;GPU.hitDx=dx;HIT_FX*=Math.exp(-(dt||1)*.22);return;}
  const off=fxCanvas(),o=off.getContext("2d");
  ctx.save();
  for(const [col,sgn] of [["rgb(255,40,40)",-1],["rgb(40,90,255)",1]]){
    o.setTransform(1,0,0,1,0,0);
    o.globalCompositeOperation="source-over";
    o.clearRect(0,0,off.width,off.height);
    o.drawImage(cvs,0,0);
    o.globalCompositeOperation="multiply";
    o.fillStyle=col;o.fillRect(0,0,off.width,off.height);
    ctx.globalCompositeOperation="lighter";
    ctx.globalAlpha=.30*k;
    ctx.drawImage(off,0,0,off.width,off.height,sgn*dx,0,W,H);
  }
  ctx.restore();
  HIT_FX*=Math.exp(-(dt||1)*.22);
}
