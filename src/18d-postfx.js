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
   марево — это искажение, а не свечение. (x0,y0,w,h) — в CSS-единицах. */
function heatHaze(x0,y0,w,h,k,seed){
  if(!(w>=4&&h>=4&&k>0))return;
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
    ctx.drawImage(cvs,sx0*DPR,y*DPR,sw*DPR,Math.ceil(bh)*DPR,sx0+dx,y,sw,Math.ceil(bh));
  }
  ctx.restore();
}
/* ── хроматическая аберрация на попадании ──
   Удар по корпусу — на мгновение объектив «разъезжается»: красная копия кадра
   уходит влево, синяя вправо, на контрастных кромках появляются цветные
   каёмки, и через треть секунды всё сходится обратно. Копия красится
   умножением на чистый цвет в своём холсте и складывается светом (lighter):
   середина кадра почти не светлеет, красятся только сдвинутые края. */
function drawHitFx(dt){
  if(HIT_FX<=.02){HIT_FX=0;return;}
  const k=HIT_FX,off=fxCanvas(),o=off.getContext("2d");
  const dx=(1.5+5*k)*(1+.35*Math.sin(G.t*2.1));
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
