/* ══════════════ перо карты (G15: карта с #c на видеокарту) ══════════════
   Карта рисовала линии, кольца, плашки и подписи на 2D (#c) — 2 400 вызовов за кадр
   и загрузка холста в кадр. Перо — те же вещи прямыми путями, раскладка карты не
   меняется ни на пиксель:
   · слой "u" (под звёздами: сетка, связи, владения, слухи) — фигуры gpuShapes в
     сцену, в проход gpuNext; сброс — mpFlush, перед звёздами и в конце кадра;
   · слой "o" (над звёздами: метки систем, курс, карточка, подвал, линейки) —
     в очередь интерфейса #ovl (OVL.uq) на родном DPR, в порядке вызовов;
   · текст — всегда в OVL.uq: шрифт, выравнивание и линия — из ctx, как у fillText
     (mapFont и textAlign ставятся как прежде; ctx только мерит, не рисует).
   Прозрачность пера — mpAlpha. Цвет — строкой, как у 2D.
   2D-запасного пути у карты нет (M822b, 22.10): кадр карты всегда пишет в очереди; без
   видеокарты кадр не отправляется, и игрок видит плашку 08b2, а не 2D-карту. 2D-цели у пера
   нет и вне карты (M817, 22.10): эмблему на сайте рисует своё 2D-перо site/war-pen.js (build.ps1
   кладёт его в war.js вместо этого модуля), табличка стапеля 26e2 — перо холста движка. На ctx перо не красит */
/* регистр текста пера (M817): шрифт, выравнивание, основание и цвет строки — поля MPN, а не свойства ctx
   (их сеттеры на 2D-контексте стоили 360 вызовов за 90 кадров карты). Начальные — как у нового ctx */
const MPN={q:[],lay:"u",al:1,a0:1,w:1,font:"10px sans-serif",textAlign:"start",textBaseline:"alphabetic",fillStyle:"#000000"};
/* MPN.dev — устройство есть: без него у слоя нет атласа и кадр не уйдёт — строки не кладутся (мерка у карты своя) */
function mpBegin(){MPN.dev=typeof GPU!=="undefined"&&!!GPU.ok&&!!GPU.dev;MPN.lay="u";MPN.q.length=0;MPN.al=MPN.a0=MPN.w=1;}
function mpEnd(){mpFlush();MPN.al=MPN.a0=MPN.w=1;}
/* слой: с "u" на "o" — сначала сброс фигур под звёздами */
function mpLay(l){if(MPN.lay==="u"&&l!=="u")mpFlush();MPN.lay=l;}
function mpFlush(){const q=MPN.q;if(q.length&&typeof GPU!=="undefined"&&GPU.ok&&GPU.enc){const p=gpuNext();if(p)gpuShapes(p,q,{blend:"over"});}q.length=0;}
function mpAlpha(a){MPN.a0=a;MPN.al=a*MPN.w;}
/* вес слоя (M822): у карты три веса — «вы» (вы, выбор, курс), путь (круг прыжка, связи, свой
   маршрут) и всё остальное. Вес множит прозрачность каждого движения пера, mpAlpha слоя — внутри
   него: слой, который сам гасит дальнее, гасит его от своего веса */
function mpWeight(w){MPN.w=w;mpAlpha(MPN.a0);}
function mpU(){return MPN.lay==="u";}
function mpS(kind,a,b,c,d,hw,soft,col,al){const C=gcColor(col),A=C[3]*MPN.al*(al==null?1:al);
  if(A>.002)MPN.q.push([kind,a,b,c,d,hw,soft,C[0]*255,C[1]*255,C[2]*255,A]);}
/* отрезок толщиной w */
function mpLine(x0,y0,x1,y1,w,col){
  /* длинная косая тонкая линия — кусками: рамка примитива — её прямоугольник, и румб через
     весь кадр иначе красит каждый пиксель экрана (стык кусков тоньше пикселя) */
  const L=Math.abs(x1-x0)+Math.abs(y1-y0),n=w<=2.5&&L>240&&Math.abs(x1-x0)>8&&Math.abs(y1-y0)>8?Math.ceil(L/160):1;
  for(let i=0;i<n;i++){const a=i/n,b=(i+1)/n,ax=x0+(x1-x0)*a,ay=y0+(y1-y0)*a,bx=x0+(x1-x0)*b,by=y0+(y1-y0)*b;
    if(MPN.lay==="u")mpS(2,ax,ay,bx,by,w/2,0,col);else ovCap(ax,ay,bx,by,w,col,MPN.al);}
}
/* ломаная pts=[x,y,x,y…] */
function mpPath(pts,w,col,closed){
  const n=pts.length;
  /* под звёздами — лента с жёсткими стыками: полупрозрачная ломаная без бусин на изломах */
  if(MPN.lay==="u"){const C=gcColor(col),A=C[3]*MPN.al;if(A<=.002||n<4)return;const P=[];
    for(let i=0;i+1<n;i+=2)P.push([pts[i],pts[i+1]]);if(closed)P.push([pts[0],pts[1]]);
    mapRibbon(MPN.q,P,Math.max(.5,w/2),[C[0]*255,C[1]*255,C[2]*255,A]);return;}
  for(let i=0;i+3<n;i+=2)mpLine(pts[i],pts[i+1],pts[i+2],pts[i+3],w,col);
  if(closed&&n>=6)mpLine(pts[n-2],pts[n-1],pts[0],pts[1],w,col);
}
/* пунктир по шаблону pat ([черта, пробел, …]) — как setLineDash, фаза с начала отрезка */
function mpDash(x0,y0,x1,y1,w,col,pat){
  const L=Math.hypot(x1-x0,y1-y0);if(L<.01)return;
  const ux=(x1-x0)/L,uy=(y1-y0)/L;let t=0,i=0;
  for(let g=0;t<L&&g<4000;g++){const d=pat[i%pat.length];
    if(!(i&1)){const e=Math.min(L,t+d);mpLine(x0+ux*t,y0+uy*t,x0+ux*e,y0+uy*e,w,col);}
    t+=d;i++;}
}
/* окружность (обвод) */
function mpCircle(x,y,r,w,col){
  if(MPN.lay==="u")mpS(3,x,y,r,0,w/2,0,col);else ovEll(x,y,r,r,w,col,MPN.al);
}
/* дуга от a0 до a1 (a1>a0) */
function mpArc(x,y,r,a0,a1,w,col){
  const sw=a1-a0;if(sw<=0)return;
  if(sw>=TAU-1e-4){mpCircle(x,y,r,w,col);return;}
  if(MPN.lay!=="u"){ovArc(x,y,r,a0,sw,w,col,MPN.al);return;}
  const n=Math.max(2,Math.ceil(sw*r/6));let px=x+Math.cos(a0)*r,py=y+Math.sin(a0)*r;
  for(let i=1;i<=n;i++){const a=a0+sw*i/n,qx=x+Math.cos(a)*r,qy=y+Math.sin(a)*r;mpLine(px,py,qx,qy,w,col);px=qx;py=qy;}
}
/* окружность пунктиром: черты — дуги, за кадром не рисуются */
function mpDashCircle(x,y,r,w,col,pat){
  if(x+r<0||x-r>W||y+r<0||y-r>H||r<.5)return;
  const C=TAU*r;let t=0,i=0;
  for(let g=0;t<C&&g<4000;g++){const d=pat[i%pat.length];
    if(!(i&1)){const a0=t/r,a1=Math.min(C,t+d)/r,am=(a0+a1)/2,cx=x+Math.cos(am)*r,cy=y+Math.sin(am)*r;
      if(cx>-d&&cx<W+d&&cy>-d&&cy<H+d)mpArc(x,y,r,a0,a1,w,col);}
    t+=d;i++;}
}
/* круг (заливка) */
function mpDisc(x,y,r,col){
  if(MPN.lay==="u")mpS(1,x,y,r,0,0,0,col);else ovEll(x,y,r,r,0,col,MPN.al);
}
/* эллипс (заливка), без поворота */
function mpEll(x,y,rx,ry,col){
  if(MPN.lay==="u"){mpS(1,x,y,(rx+ry)/2,0,0,0,col);return;}
  ovEll(x,y,rx,ry,0,col,MPN.al);
}
/* выпуклый четырёхугольник a b c d (заливка): повёрнутые плашки */
function mpQuad(ax,ay,bx,by,cx,cy,dx,dy,col){
  if(MPN.lay==="u"){const C=gcColor(col);gpuQuad(MPN.q,[ax,ay],[bx,by],[cx,cy],[dx,dy],[C[0]*255,C[1]*255,C[2]*255,C[3]*MPN.al]);return;}
  ovQuad(ax,ay,bx,by,cx,cy,dx,dy,col,MPN.al,1,1);
}
/* мягкое пятно: свет от a в середине к нулю на r (радиальный градиент 2D) — только под звёздами */
function mpGlow(x,y,r,col){
  const l=MPN.lay;MPN.lay="u";mpS(1,x,y,0,0,0,r,col);MPN.lay=l;
}
/* прямоугольник (заливка) */
function mpRect(x,y,w,h,col){
  if(MPN.lay==="u")mpS(0,x,y,x+w,y+h,0,0,col);else ovRect(x,y,x+w,y+h,col,MPN.al);
}
/* обвод прямоугольника линией lw по середине кромки — как strokeRect */
function mpFrame(x,y,w,h,lw,col){
  const d=lw/2;
  mpRect(x-d,y-d,w+lw,lw,col);mpRect(x-d,y+h-d,w+lw,lw,col);
  mpRect(x-d,y+d,lw,h-lw,col);mpRect(x+w-d,y+d,lw,h-lw,col);
}
/* обвод прямоугольника пунктиром */
function mpDashFrame(x,y,w,h,lw,col,pat){
  mpDash(x,y,x+w,y,lw,col,pat);mpDash(x+w,y,x+w,y+h,lw,col,pat);
  mpDash(x+w,y+h,x,y+h,lw,col,pat);mpDash(x,y+h,x,y,lw,col,pat);
}
/* треугольник (заливка) */
function mpTri(ax,ay,bx,by,cx,cy,col){
  if(MPN.lay==="u"){mpS(5,ax,ay,bx,by,cx,cy,col);return;}
  const s=ovNd(),t=[ax*s,ay*s,bx*s,by*s,cx*s,cy*s];
  ovPush(OVL.uq,Math.min(t[0],t[2],t[4]),Math.min(t[1],t[3],t[5]),Math.max(t[0],t[2],t[4]),Math.max(t[1],t[3],t[5]),ovPm(col,MPN.al),2,0,0,0,t);
}
/* штриховка прямоугольника косыми (обрез по рамке, как clip): шаг st, наклон dir=+1 «\», -1 «/» */
function mpHatch(x0,y0,w,h,st,dir,lw,col){
  for(let q=-w;q<w;q+=st){
    /* отрезок (q,0)→(q+w,h) в долях: обрезка по x∈[0,w] (h=w у клеток; общий случай — по t) */
    const t0=Math.max(0,-q/w),t1=Math.min(1,(w-q)/w);if(t1<=t0)continue;
    const xa=x0+q+w*t0,xb=x0+q+w*t1,ya=h*t0,yb=h*t1;
    if(dir>0)mpLine(xa,y0+ya,xb,y0+yb,lw,col);else mpLine(xa,y0+h-ya,xb,y0+h-yb,lw,col);
  }
}
/* подпись вдоль линии под углом ang, середина — (x,y) со сдвигом dy поперёк: строка повёрнута
   целиком (рукава, трасса) — буквы прямо стоять не могут, на крутом рукаве они встают столбиком */
function mpTextAlong(t,x,y,ang,dy,col){
  const ca=Math.cos(ang),sa=Math.sin(ang);
  /* вся строка одной повёрнутой маской (08bi ovTextRot), как 2D под rotate */
  if(MPN.dev)ovTextRot(OVL.uq,x-dy*sa,y+dy*ca,t,MPN.font,col,"center",MPN.textBaseline,MPN.al,ang);
}
/* сеть пеленгов — mapRhumbPaint (site/war-backdrop.js, ею рисует карта войны сайта) пером:
   шестнадцать румбов из вашей системы до дальнего угла кадра и окружность построения */
function mpRhumb(ox,oy){
  let L=0;
  for(const [x,y] of [[0,0],[W,0],[0,H],[W,H]])L=Math.max(L,Math.hypot(x-ox,y-oy));
  L*=1.02;
  for(let i=0;i<16;i++){const a=i/16*TAU;
    mpLine(ox,oy,ox+Math.cos(a)*L,oy+Math.sin(a)*L,(i%4===0)?1:.7,"rgba(150,182,212,"+((i%4===0)?.075:.04)+")");}
  mpCircle(ox,oy,Math.min(W,H)*.42,1,"rgba(150,182,212,.05)");
}
/* плашка материалом «Борта» (M720, 08bj): графит, кайма, срезы справа сверху и слева снизу. Над
   звёздами (слой "o") — тем же шестиугольником, что табличка у вещи; под звёздами — прямоугольником */
function mpPlate(x,y,w,h){
  const U=(typeof mapU==="function")?mapU():1;
  if(MPN.lay==="u"){mpRect(x,y,w,h,HANG.BODY);return;}
  const nd=ovNd(),sn=v=>Math.round(v*nd)/nd,x0=sn(x),y0=sn(y),x1=sn(x+w),y1=sn(y+h),c=sn(5*U),e=1*U;
  hangHex(sn(x0-e),sn(y0-e),sn(x1+e),sn(y1+e),sn(c+e*.42),HANG.EDGE,.17*MPN.al);
  hangHex(x0,y0,x1,y1,c,HANG.BODY,.94*MPN.al);
}
/* подпись: шрифт, выравнивание и линия — нынешний регистр пера (mapFont, MPN.textAlign, MPN.textBaseline) */
function mpText(t,x,y,col){
  if((!t&&t!==0)||!MPN.dev)return;
  ovText(OVL.uq,x,y,String(t),MPN.font,col,MPN.textAlign,MPN.textBaseline,MPN.al,1);
}
