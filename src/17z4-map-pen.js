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
   Без видеокарты (Node-ярус, Chrome без WebGPU) каждое движение пера — тот же
   вызов на ctx, что был. Прозрачность пера — mpAlpha (без видеокарты она же
   ctx.globalAlpha). Цвет — строкой, как у 2D */
const MPN={q:[],lay:"u",gpu:false,al:1,a0:1,w:1};
function mpBegin(){MPN.gpu=typeof GPU!=="undefined"&&!!GPU.ok&&!!GPU.on&&!!GPU.enc;MPN.lay="u";MPN.q.length=0;MPN.al=MPN.a0=MPN.w=1;}
function mpEnd(){mpFlush();MPN.gpu=false;MPN.al=MPN.a0=MPN.w=1;if(typeof ctx!=="undefined"&&ctx)ctx.globalAlpha=1;}
/* слой: с "u" на "o" — сначала сброс фигур под звёздами */
function mpLay(l){if(MPN.lay==="u"&&l!=="u")mpFlush();MPN.lay=l;}
function mpFlush(){const q=MPN.q;if(q.length&&MPN.gpu){const p=gpuNext();if(p)gpuShapes(p,q,{blend:"over"});}q.length=0;}
function mpAlpha(a){MPN.a0=a;MPN.al=a*MPN.w;if(!MPN.gpu)ctx.globalAlpha=MPN.al;}
/* вес слоя (M822): у карты три веса — «вы» (вы, выбор, курс), путь (круг прыжка, связи, свой
   маршрут) и всё остальное. Вес множит прозрачность каждого движения пера, mpAlpha слоя — внутри
   него: слой, который сам гасит дальнее, гасит его от своего веса */
function mpWeight(w){MPN.w=w;mpAlpha(MPN.a0);}
/* рисунок без видеокарты на время fn (выпечка в чужой холст: ctx подменён) */
function mp2d(fn){const g=MPN.gpu,a=MPN.al;MPN.gpu=false;MPN.al=1;try{return fn();}finally{MPN.gpu=g;MPN.al=a;}}
function mpU(){return MPN.gpu&&MPN.lay==="u";}
function mpS(kind,a,b,c,d,hw,soft,col,al){const C=gcColor(col),A=C[3]*MPN.al*(al==null?1:al);
  if(A>.002)MPN.q.push([kind,a,b,c,d,hw,soft,C[0]*255,C[1]*255,C[2]*255,A]);}
/* отрезок толщиной w */
function mpLine(x0,y0,x1,y1,w,col){
  if(!MPN.gpu){ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();return;}
  /* длинная косая тонкая линия — кусками: рамка примитива — её прямоугольник, и румб через
     весь кадр иначе красит каждый пиксель экрана (стык кусков тоньше пикселя) */
  const L=Math.abs(x1-x0)+Math.abs(y1-y0),n=w<=2.5&&L>240&&Math.abs(x1-x0)>8&&Math.abs(y1-y0)>8?Math.ceil(L/160):1;
  for(let i=0;i<n;i++){const a=i/n,b=(i+1)/n,ax=x0+(x1-x0)*a,ay=y0+(y1-y0)*a,bx=x0+(x1-x0)*b,by=y0+(y1-y0)*b;
    if(MPN.lay==="u")mpS(2,ax,ay,bx,by,w/2,0,col);else ovCap(ax,ay,bx,by,w,col,MPN.al);}
}
/* ломаная pts=[x,y,x,y…] */
function mpPath(pts,w,col,closed){
  if(!MPN.gpu){ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(pts[0],pts[1]);
    for(let i=2;i<pts.length;i+=2)ctx.lineTo(pts[i],pts[i+1]);if(closed)ctx.closePath();ctx.stroke();return;}
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
  if(!MPN.gpu){ctx.setLineDash(pat);mpLine(x0,y0,x1,y1,w,col);ctx.setLineDash([]);return;}
  const L=Math.hypot(x1-x0,y1-y0);if(L<.01)return;
  const ux=(x1-x0)/L,uy=(y1-y0)/L;let t=0,i=0;
  for(let g=0;t<L&&g<4000;g++){const d=pat[i%pat.length];
    if(!(i&1)){const e=Math.min(L,t+d);mpLine(x0+ux*t,y0+uy*t,x0+ux*e,y0+uy*e,w,col);}
    t+=d;i++;}
}
/* окружность (обвод) */
function mpCircle(x,y,r,w,col){
  if(!MPN.gpu){ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke();return;}
  if(MPN.lay==="u")mpS(3,x,y,r,0,w/2,0,col);else ovEll(x,y,r,r,w,col,MPN.al);
}
/* дуга от a0 до a1 (a1>a0) */
function mpArc(x,y,r,a0,a1,w,col){
  if(!MPN.gpu){ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();ctx.arc(x,y,r,a0,a1);ctx.stroke();return;}
  const sw=a1-a0;if(sw<=0)return;
  if(sw>=TAU-1e-4){mpCircle(x,y,r,w,col);return;}
  if(MPN.lay!=="u"){ovArc(x,y,r,a0,sw,w,col,MPN.al);return;}
  const n=Math.max(2,Math.ceil(sw*r/6));let px=x+Math.cos(a0)*r,py=y+Math.sin(a0)*r;
  for(let i=1;i<=n;i++){const a=a0+sw*i/n,qx=x+Math.cos(a)*r,qy=y+Math.sin(a)*r;mpLine(px,py,qx,qy,w,col);px=qx;py=qy;}
}
/* окружность пунктиром: черты — дуги, за кадром не рисуются */
function mpDashCircle(x,y,r,w,col,pat){
  if(!MPN.gpu){ctx.setLineDash(pat);mpCircle(x,y,r,w,col);ctx.setLineDash([]);return;}
  if(x+r<0||x-r>W||y+r<0||y-r>H||r<.5)return;
  const C=TAU*r;let t=0,i=0;
  for(let g=0;t<C&&g<4000;g++){const d=pat[i%pat.length];
    if(!(i&1)){const a0=t/r,a1=Math.min(C,t+d)/r,am=(a0+a1)/2,cx=x+Math.cos(am)*r,cy=y+Math.sin(am)*r;
      if(cx>-d&&cx<W+d&&cy>-d&&cy<H+d)mpArc(x,y,r,a0,a1,w,col);}
    t+=d;i++;}
}
/* круг (заливка) */
function mpDisc(x,y,r,col){
  if(!MPN.gpu){ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();return;}
  if(MPN.lay==="u")mpS(1,x,y,r,0,0,0,col);else ovEll(x,y,r,r,0,col,MPN.al);
}
/* эллипс (заливка), без поворота */
function mpEll(x,y,rx,ry,col){
  if(!MPN.gpu){ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fill();return;}
  if(MPN.lay==="u"){mpS(1,x,y,(rx+ry)/2,0,0,0,col);return;}
  ovEll(x,y,rx,ry,0,col,MPN.al);
}
/* выпуклый четырёхугольник a b c d (заливка): повёрнутые плашки */
function mpQuad(ax,ay,bx,by,cx,cy,dx,dy,col){
  if(!MPN.gpu){ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.lineTo(cx,cy);ctx.lineTo(dx,dy);ctx.closePath();ctx.fill();return;}
  if(MPN.lay==="u"){const C=gcColor(col);gpuQuad(MPN.q,[ax,ay],[bx,by],[cx,cy],[dx,dy],[C[0]*255,C[1]*255,C[2]*255,C[3]*MPN.al]);return;}
  ovQuad(ax,ay,bx,by,cx,cy,dx,dy,col,MPN.al,1,1);
}
/* мягкое пятно: свет от a в середине к нулю на r (радиальный градиент 2D) — только под звёздами */
function mpGlow(x,y,r,col){
  if(!MPN.gpu){const g=ctx.createRadialGradient(x,y,0,x,y,r),C=gcColor(col);
    g.addColorStop(0,col);g.addColorStop(1,"rgba("+Math.round(C[0]*255)+","+Math.round(C[1]*255)+","+Math.round(C[2]*255)+",0)");
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();return;}
  const l=MPN.lay;MPN.lay="u";mpS(1,x,y,0,0,0,r,col);MPN.lay=l;
}
/* прямоугольник (заливка) */
function mpRect(x,y,w,h,col){
  if(!MPN.gpu){ctx.fillStyle=col;ctx.fillRect(x,y,w,h);return;}
  if(MPN.lay==="u")mpS(0,x,y,x+w,y+h,0,0,col);else ovRect(x,y,x+w,y+h,col,MPN.al);
}
/* обвод прямоугольника линией lw по середине кромки — как strokeRect */
function mpFrame(x,y,w,h,lw,col){
  if(!MPN.gpu){ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.strokeRect(x,y,w,h);return;}
  const d=lw/2;
  mpRect(x-d,y-d,w+lw,lw,col);mpRect(x-d,y+h-d,w+lw,lw,col);
  mpRect(x-d,y+d,lw,h-lw,col);mpRect(x+w-d,y+d,lw,h-lw,col);
}
/* обвод прямоугольника пунктиром */
function mpDashFrame(x,y,w,h,lw,col,pat){
  if(!MPN.gpu){ctx.setLineDash(pat);mpFrame(x,y,w,h,lw,col);ctx.setLineDash([]);return;}
  mpDash(x,y,x+w,y,lw,col,pat);mpDash(x+w,y,x+w,y+h,lw,col,pat);
  mpDash(x+w,y+h,x,y+h,lw,col,pat);mpDash(x,y+h,x,y,lw,col,pat);
}
/* треугольник (заливка) */
function mpTri(ax,ay,bx,by,cx,cy,col){
  if(!MPN.gpu){ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.lineTo(cx,cy);ctx.closePath();ctx.fill();return;}
  if(MPN.lay==="u"){mpS(5,ax,ay,bx,by,cx,cy,col);return;}
  const s=ovNd(),t=[ax*s,ay*s,bx*s,by*s,cx*s,cy*s];
  ovPush(OVL.uq,Math.min(t[0],t[2],t[4]),Math.min(t[1],t[3],t[5]),Math.max(t[0],t[2],t[4]),Math.max(t[1],t[3],t[5]),ovPm(col,MPN.al),2,0,0,0,t);
}
/* штриховка прямоугольника косыми (обрез по рамке, как clip): шаг st, наклон dir=+1 «\», -1 «/» */
function mpHatch(x0,y0,w,h,st,dir,lw,col){
  if(!MPN.gpu){ctx.save();ctx.beginPath();ctx.rect(x0,y0,w,h);ctx.clip();ctx.strokeStyle=col;ctx.lineWidth=lw;
    for(let q=-w;q<w;q+=st){ctx.beginPath();if(dir>0){ctx.moveTo(x0+q,y0);ctx.lineTo(x0+q+w,y0+h);}else{ctx.moveTo(x0+q,y0+h);ctx.lineTo(x0+q+w,y0);}ctx.stroke();}
    ctx.restore();return;}
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
  const ca=Math.cos(ang),sa=Math.sin(ang),al=ctx.textAlign;
  /* на видеокарте — вся строка одной повёрнутой маской (08bi ovTextRot), как 2D под rotate */
  if(MPN.gpu){ovTextRot(OVL.uq,x-dy*sa,y+dy*ca,t,ctx.font,col,"center",ctx.textBaseline,MPN.al,ang);return;}
  ctx.save();ctx.translate(x-dy*sa,y+dy*ca);ctx.rotate(ang);ctx.textAlign="center";ctx.fillStyle=col;
  ctx.fillText(t,0,0);ctx.restore();ctx.textAlign=al;
}
/* сеть пеленгов — mapRhumbPaint (17z-map-backdrop, её же рисует карта войны сайта) пером:
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
   звёздами (слой "o") — тем же шестиугольником, что табличка у вещи; без видеокарты — прямоугольником */
function mpPlate(x,y,w,h){
  const U=(typeof mapU==="function")?mapU():1;
  if(!MPN.gpu||MPN.lay==="u"){mpRect(x,y,w,h,HANG.BODY);return;}
  const nd=ovNd(),sn=v=>Math.round(v*nd)/nd,x0=sn(x),y0=sn(y),x1=sn(x+w),y1=sn(y+h),c=sn(5*U),e=1*U;
  hangHex(sn(x0-e),sn(y0-e),sn(x1+e),sn(y1+e),sn(c+e*.42),HANG.EDGE,.17*MPN.al);
  hangHex(x0,y0,x1,y1,c,HANG.BODY,.94*MPN.al);
}
/* подпись: шрифт, выравнивание и линия — нынешние ctx (mapFont, textAlign, textBaseline) */
function mpText(t,x,y,col){
  if(!MPN.gpu){ctx.fillStyle=col;ctx.fillText(t,x,y);return;}
  if(!t&&t!==0)return;
  ovText(OVL.uq,x,y,String(t),ctx.font,col,ctx.textAlign,ctx.textBaseline,MPN.al,1);
}
