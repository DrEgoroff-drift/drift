/* ── живое на станции: огни и вращающиеся части. Мастер станции (выпечка 2D-тела) снят 22.10 —
   полёт рисует тело 17c2g; ST_REC больше никто не ставит, stLive рисует на месте */
/* ── живое на станции поверх мастера (ступень 1) ──
   Мастер станции печётся раз на плотность экрана (мипы, как у корпусов), без
   времени в ключе. Что живёт — огни, кран, стволы турелей, тарелки, кольцо — в
   выпечку не идёт: stLive записывает кусок с его матрицей в осях станции, кадр
   зовёт его снова, и кусок кладёт фигуры (ST_EM) и спрайты поверх. В 2D кусок
   рисует на месте, как рисовал. Огни — явная эмиссия (правило 16/n): точка
   краской, ядро сложением (в выпечке их поднимал множитель em у GST), узкий ореол */
let ST_REC=null,ST_EM=null;
const ST_EMIT=.7,ST_HALO=.35;
function stLive(fn){
  if(ST_REC){ST_REC.L.push({m:ST_REC.inv.multiply(ctx.getTransform()),fn,z:ST_REC.z});return;}
  fn();
}
function stEmP(x,y){const m=ST_EM.m,s=ST_EM.s;return [ST_EM.x+(m.a*x+m.c*y+m.e)*s,ST_EM.y+(m.b*x+m.d*y+m.f)*s];}
function stEmK(){return ST_EM.s*Math.hypot(ST_EM.m.a,ST_EM.m.b);}
function stLamp(x,y,r,c,a){
  if(ST_EM){const [px,py]=stEmP(x,y),R=r*stEmK();
    ST_EM.L.push([1,px,py,R,0,0,0,c[0],c[1],c[2],a]);
    ST_EM.A.push([1,px,py,R,0,0,0,c[0],c[1],c[2],a*ST_EMIT],[1,px,py,R*.5,0,0,R*1.8,c[0],c[1],c[2],a*ST_HALO]);return;}
  ctx.fillStyle=rgba(c,a);ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();
}
/* окно-огонь прямоугольником; rot — поворот вокруг начала куска (кольцо) */
function stLampRect(x,y,w,h,c,a,rot){
  if(ST_EM){const m=ST_EM.m,k=stEmK();
    if(!rot&&!m.b&&!m.c){const [x0,y0]=stEmP(x,y),[x1,y1]=stEmP(x+w,y+h),q=Math.min(w,h)*k*.9;
      ST_EM.L.push([0,x0,y0,x1,y1,0,0,c[0],c[1],c[2],a]);
      ST_EM.A.push([0,x0,y0,x1,y1,0,0,c[0],c[1],c[2],a*ST_EMIT],[0,x0,y0,x1,y1,0,q,c[0],c[1],c[2],a*ST_HALO]);return;}
    const cs=Math.cos(rot||0),sn=Math.sin(rot||0),P=(u,v)=>stEmP(u*cs-v*sn,u*sn+v*cs);
    const cx=x+w/2,cy=y+h/2,hw=Math.min(w,h)/2,L=Math.max(w,h)/2-hw,ax=w>=h;
    const [x0,y0]=P(ax?cx-L:cx,ax?cy:cy-L),[x1,y1]=P(ax?cx+L:cx,ax?cy:cy+L),H=hw*k;
    ST_EM.L.push([2,x0,y0,x1,y1,H,0,c[0],c[1],c[2],a]);
    ST_EM.A.push([2,x0,y0,x1,y1,H,0,c[0],c[1],c[2],a*ST_EMIT],[2,x0,y0,x1,y1,H*.5,H*1.8,c[0],c[1],c[2],a*ST_HALO]);return;}
  ctx.fillStyle=rgba(c,a);
  if(rot){ctx.save();ctx.rotate(rot);ctx.fillRect(x,y,w,h);ctx.restore();}else ctx.fillRect(x,y,w,h);
}
/* вращающаяся часть: draw рисует её в своих осях (центр — ось вращения, радиус ext);
   на видеокарте — свой мастер, повёрнутый и освещённый, как корпус */
function stSpin(key,ext,rot,draw){
  if(ST_EM){ST_EM.S.push({key,ext,rot,draw,m:ST_EM.m});return;}
  ctx.save();ctx.rotate(rot);draw();ctx.restore();
}
