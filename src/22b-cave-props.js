/* ══════════════ пещера: гладкий обвод и то, что в ней лежит (M305) ══════════════ */
/* Две беды пещеры после M304 были уже не про свет. Первая — обвод: поле
   породы лежит клетками по 5 px, и contour шёл по серединам рёбер, так что
   каждая стена была лесенкой под 90° и 45°, а пещера читалась картой, а не
   камнем. Вторая — пустота: прибор мерил 75–83 % клеток без единой детали,
   и это была ЧЕСТНАЯ пустота — в пещере нечего было разглядывать, кроме
   натёков и своего фонаря.

   Обвод: то же поле, но сглаженное окном 3×3 и пройденное марширующими
   квадратами С ИНТЕРПОЛЯЦИЕЙ по порогу .5, а сверху один проход Чайкина.
   Прямых углов не остаётся — камень округляется, как его и точит вода.
   Ориентация рёбер держится единым правилом «порода справа», поэтому все
   петли складываются в один Path2D, и nonzero-заливка сама вырезает дыры.
   Тайлу за окном 2 клетки подкладывается «порода», и петли замыкаются по
   краю окна — заливка честная в границах тайла, хвост срезает сам тайл.
   Собственно сетка (столкновения, пол, свод) не тронута: расходится с
   картинкой не больше чем на полклетки. Печётся в тайл, кадру — ноль.

   Содержимое: пещеру до тебя проходили и в ней умирали. Кости зверя на полу
   (рёбра, череп, разброс), верёвка в каждой шахте с колом наверху — по ней
   видно, что шахта ведёт вниз, и что это уже кто-то знал; зарубки счёта у
   устья шахты; брошенная стоянка у чужого фонаря (ящик, кострище с золой,
   кирка); в конце тупикового ответвления — либо кости, либо ящик, либо
   ничего: за этим и сворачивают. Всё сеяно от C.seed, ничего не хранится,
   рисуется ДО темноты, чтобы фонарь это освещал, а не проявлял. */

function caveSmoothPath(C,wx0,wy0){
  const CS=CAVE_CS,NX=CAVE_NX,NY=CAVE_NY,g=C.g;
  const PAD=3;
  const cx0=Math.floor(wx0/CS)-PAD, cx1=Math.floor((wx0+TILE-1)/CS)+PAD;
  const cy0=Math.floor((wy0-CAVE_Y0)/CS)-PAD, cy1=Math.floor((wy0+TILE-1-CAVE_Y0)/CS)+PAD;
  const NW=cx1-cx0+1, NH=cy1-cy0+1;
  const at=(cx,cy)=>(cx<0||cx>=NX||cy<0||cy>=NY)?1:g[cy*NX+cx];
  /* сглаженное поле; крайний ряд окна — порода, чтобы петли замкнулись */
  const f=new Float32Array(NW*NH);
  for(let j=0;j<NH;j++)for(let i=0;i<NW;i++){
    if(i===0||j===0||i===NW-1||j===NH-1){f[j*NW+i]=1;continue;}
    const cx=cx0+i,cy=cy0+j;let s=0;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)s+=at(cx+dx,cy+dy);
    f[j*NW+i]=s/9;
  }
  /* кромки по ориентации для капель (M257): пол k=3, свод k=12 — по сырой сетке */
  const fl=[],ce=[];
  for(let cy=cy0+1;cy<cy1-1;cy++)for(let cx=cx0+1;cx<cx1-1;cx++){
    const k=(at(cx,cy)<<3)|(at(cx+1,cy)<<2)|(at(cx+1,cy+1)<<1)|at(cx,cy+1);
    if(k===3)fl.push([cx,cy]);else if(k===12)ce.push([cx,cy]);
  }
  const T=.5;
  const nx=i=>(cx0+i+.5)*CS-wx0, ny=j=>(cy0+j+.5)*CS+CAVE_Y0-wy0;
  /* точка на ребре между узлами (i,j)-(i2,j2) */
  const lerp=(i,j,i2,j2)=>{
    const a=f[j*NW+i],b=f[j2*NW+i2];
    let t=(T-a)/((b-a)||1e-6);t=clamp(t,.02,.98);
    return [nx(i)+(nx(i2)-nx(i))*t, ny(j)+(ny(j2)-ny(j))*t];
  };
  /* рёбра квадрата (i,j): T=(H,i,j) B=(H,i,j+1) L=(V,i,j) R=(V,i+1,j) */
  const ek=(h,i,j)=>((j*(NW+1)+i)<<1)|h;
  const segs=[], byStart=new Map();
  const add=(e0,p0,e1,p1)=>{const s={e0,p0,e1,p1,used:false};byStart.set(e0,s);segs.push(s);};
  for(let j=0;j<NH-1;j++)for(let i=0;i<NW-1;i++){
    const a=f[j*NW+i]>=T,b=f[j*NW+i+1]>=T,c=f[(j+1)*NW+i+1]>=T,d=f[(j+1)*NW+i]>=T;
    const k=(a<<3)|(b<<2)|(c<<1)|(d?1:0);
    if(k===0||k===15)continue;
    const Tp=()=>lerp(i,j,i+1,j),Bp=()=>lerp(i,j+1,i+1,j+1),Lp=()=>lerp(i,j,i,j+1),Rp=()=>lerp(i+1,j,i+1,j+1);
    const Te=ek(0,i,j),Be=ek(0,i,j+1),Le=ek(1,i,j),Re=ek(1,i+1,j);
    /* порода справа по ходу (экранные оси, y вниз) */
    switch(k){
      case 8:add(Te,Tp(),Le,Lp());break;
      case 4:add(Re,Rp(),Te,Tp());break;
      case 2:add(Be,Bp(),Re,Rp());break;
      case 1:add(Le,Lp(),Be,Bp());break;
      case 7:add(Le,Lp(),Te,Tp());break;
      case 11:add(Te,Tp(),Re,Rp());break;
      case 13:add(Re,Rp(),Be,Bp());break;
      case 14:add(Be,Bp(),Le,Lp());break;
      case 12:add(Re,Rp(),Le,Lp());break;
      case 3:add(Le,Lp(),Re,Rp());break;
      case 9:add(Te,Tp(),Be,Bp());break;
      case 6:add(Be,Bp(),Te,Tp());break;
      case 5:add(Te,Tp(),Le,Lp());add(Be,Bp(),Re,Rp());break;
      case 10:add(Re,Rp(),Te,Tp());add(Le,Lp(),Be,Bp());break;
    }
  }
  const P=new Path2D();
  for(const s0 of segs){
    if(s0.used)continue;
    const pts=[];let s=s0,guard=0;
    while(s&&!s.used&&guard++<20000){s.used=true;pts.push(s.p0);s=byStart.get(s.e1);if(s===s0)break;}
    if(pts.length<3)continue;
    /* один проход Чайкина: срезает последние изломы, не съедая форму */
    const n=pts.length,q=[];
    for(let i=0;i<n;i++){
      const A=pts[i],B=pts[(i+1)%n];
      q.push([A[0]*.75+B[0]*.25,A[1]*.75+B[1]*.25],[A[0]*.25+B[0]*.75,A[1]*.25+B[1]*.75]);
    }
    P.moveTo(q[0][0],q[0][1]);
    for(let i=1;i<q.length;i++)P.lineTo(q[i][0],q[i][1]);
    P.closePath();
  }
  P.fl=fl;P.ce=ce;
  return P;
}

/* ── что лежит в пещере ── */
function caveProps(C){
  if(C.props)return C.props;
  const r=rng(C.seed^0x9B0E), out=[];
  const floorAt=(x,y)=>caveScanDown(C,x,y);
  /* кости: три скелета, верхняя и нижняя галерея, в залах с водой чаще */
  for(let i=0;i<3;i++){
    const low=i===2;
    const x=low?420+r()*(CAVE_W-720):260+r()*(CAVE_W-420);
    const y=(low?caveFloorLow(C,x):caveFloor(C,x));
    if(y>=CAVE_Y1-10)continue;
    out.push({k:"bones",x,y,s:.9+r()*.7,face:r()<.5?1:-1,seed:(r()*1e9)|0});
  }
  /* верёвка в каждой шахте: кол на краю, узлы по длине */
  for(const sh of C.shafts||[]){
    if(!sh.pts||sh.pts.length<4)continue;
    out.push({k:"rope",pts:sh.pts,ph:r()*TAU});
    /* зарубки счёта рядом с устьем шахты: кто-то считал спуски */
    const mx=sh.x-34, my=caveFloor(C,mx);
    out.push({k:"tally",x:mx,y:my,n:3+Math.floor(r()*8),dir:1});
  }
  /* стоянка у чужого фонаря */
  {
    const L=caveLampSpot(C);
    out.push({k:"camp",x:L.x-24,y:floorAt(L.x-24,L.y-30),face:1,seed:(r()*1e9)|0});
  }
  /* концы ответвлений: ради них и сворачивают */
  for(const e of C.branchEnds||[]){
    const roll=r();
    const y=floorAt(e.x,e.y);
    if(y>=CAVE_Y1-10)continue;
    if(roll<.45)out.push({k:"bones",x:e.x,y,s:.7+r()*.5,face:r()<.5?1:-1,seed:(r()*1e9)|0});
    else if(roll<.75)out.push({k:"crate",x:e.x,y,seed:(r()*1e9)|0});
  }
  return C.props=out;
}

function caveDrawBones(p,sx,sy){
  const s=p.s,f=p.face;
  const R=rng(p.seed);
  ctx.save();ctx.translate(sx,sy);ctx.scale(f,1);
  ctx.strokeStyle="rgba(214,202,180,.62)";ctx.fillStyle="rgba(214,202,180,.55)";
  ctx.lineWidth=1.3;ctx.lineCap="round";
  /* хребет */
  ctx.beginPath();ctx.moveTo(-22*s,-5);ctx.quadraticCurveTo(0,-9*s,24*s,-6*s);ctx.stroke();
  /* рёбра: дуги вниз, к середине выше */
  for(let i=0;i<6;i++){
    const rx=-17*s+i*6.6*s, h=(9-Math.abs(i-2.5)*1.6)*s;
    ctx.beginPath();ctx.ellipse(rx,-6*s+h*.1,3.2*s,h,0,.2,Math.PI-.2);ctx.stroke();
  }
  /* череп */
  ctx.beginPath();ctx.ellipse(29*s,-7*s,6*s,4.6*s,-.2,0,TAU);ctx.fill();
  ctx.fillStyle="rgba(10,12,16,.9)";
  ctx.beginPath();ctx.ellipse(31*s,-8*s,1.7*s,1.3*s,0,0,TAU);ctx.fill();
  ctx.strokeStyle="rgba(214,202,180,.62)";
  ctx.beginPath();ctx.moveTo(25*s,-3*s);ctx.lineTo(34*s,-2.6*s);ctx.stroke();
  /* разброс */
  for(let i=0;i<4;i++){
    const x=(R()-.5)*70*s, a=R()*Math.PI, l=3+R()*5;
    ctx.beginPath();ctx.moveTo(x-Math.cos(a)*l,-1-Math.sin(a)*l*.3);ctx.lineTo(x+Math.cos(a)*l,-1+Math.sin(a)*l*.3);ctx.stroke();
  }
  ctx.restore();
}
function caveDrawCrate(p,sx,sy){
  ctx.fillStyle="rgba(58,50,40,.95)";ctx.fillRect(sx-7,sy-10,14,10);
  ctx.strokeStyle="rgba(120,104,84,.8)";ctx.lineWidth=1;
  ctx.strokeRect(sx-7,sy-10,14,10);
  ctx.beginPath();ctx.moveTo(sx-7,sy-10);ctx.lineTo(sx+7,sy);ctx.moveTo(sx+7,sy-10);ctx.lineTo(sx-7,sy);ctx.stroke();
  ctx.fillStyle="rgba(160,140,110,.7)";ctx.fillRect(sx-1.5,sy-11.5,3,1.5);
  groundShadow(sx,sy+1,8,2);
}
function caveDrawCamp(p,sx,sy){
  const R=rng(p.seed);
  caveDrawCrate(p,sx,sy);
  /* кирка у ящика */
  ctx.strokeStyle="rgba(96,82,64,.95)";ctx.lineWidth=1.4;
  ctx.beginPath();ctx.moveTo(sx+10,sy);ctx.lineTo(sx+4,sy-15);ctx.stroke();
  ctx.strokeStyle="rgba(150,156,164,.9)";ctx.lineWidth=1.6;
  ctx.beginPath();ctx.moveTo(sx,sy-16);ctx.quadraticCurveTo(sx+4,sy-19,sx+9,sy-15);ctx.stroke();
  /* кострище: кольцо камней и зола, давно холодная */
  const fx=sx-22;
  ctx.fillStyle="rgba(8,8,10,.8)";
  ctx.beginPath();ctx.ellipse(fx,sy-1,9,2.6,0,0,TAU);ctx.fill();
  ctx.fillStyle="rgba(78,84,92,.9)";
  for(let i=0;i<6;i++){
    const a=i/6*TAU, x=fx+Math.cos(a)*9, y=sy-1+Math.sin(a)*2.4;
    ctx.beginPath();ctx.ellipse(x,y,2+R()*1.2,1.4,a,0,TAU);ctx.fill();
  }
  /* обугленные палки */
  ctx.strokeStyle="rgba(30,28,26,.95)";ctx.lineWidth=1.4;
  ctx.beginPath();ctx.moveTo(fx-5,sy-1);ctx.lineTo(fx+4,sy-5);ctx.moveTo(fx-3,sy-4);ctx.lineTo(fx+5,sy-1);ctx.stroke();
  /* кружка */
  ctx.fillStyle="rgba(150,156,164,.85)";ctx.fillRect(sx-12,sy-4,3.5,4);
}
function caveDrawTally(p,sx,sy){
  ctx.strokeStyle="rgba(206,196,176,.55)";ctx.lineWidth=1;ctx.lineCap="round";
  const y0=sy-22;
  for(let i=0;i<p.n;i++){
    const x=sx+(i%5)*3.2-Math.floor(i/5)*0+Math.floor(i/5)*19;
    if(i%5===4){ctx.beginPath();ctx.moveTo(x-14,y0+7);ctx.lineTo(x+1,y0);ctx.stroke();continue;}
    ctx.beginPath();ctx.moveTo(x,y0);ctx.lineTo(x+.6,y0+7);ctx.stroke();
  }
  /* стрелка вниз к шахте — процарапана той же рукой */
  const ax=sx+14, ay=y0+11;
  ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(ax+9,ay+5);ctx.moveTo(ax+9,ay+5);ctx.lineTo(ax+5,ay+5);ctx.moveTo(ax+9,ay+5);ctx.lineTo(ax+9,ay+1);ctx.stroke();
}
function caveDrawRope(p,camx,camy){
  const pts=p.pts;
  const x0=pts[0][0]-camx, y0=pts[0][1]-camy;
  ctx.strokeStyle="rgba(118,96,64,.9)";ctx.lineWidth=1.4;ctx.lineCap="round";
  ctx.beginPath();
  for(let i=0;i<pts.length;i++){
    const sw=Math.sin(pts[i][1]*.05+p.ph)*2.2*Math.min(1,i/6);
    const x=pts[i][0]-camx+sw+6, y=pts[i][1]-camy;
    if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);
  }
  ctx.stroke();
  /* узлы через каждые семь точек */
  ctx.fillStyle="rgba(140,116,80,.95)";
  for(let i=7;i<pts.length;i+=7){
    const sw=Math.sin(pts[i][1]*.05+p.ph)*2.2;
    ctx.fillRect(pts[i][0]-camx+sw+6-1.8,pts[i][1]-camy-1,3.6,2);
  }
  /* кол наверху, вбитый в край */
  ctx.fillStyle="rgba(86,72,52,.95)";
  ctx.fillRect(x0+4,y0-9,3,10);
  ctx.fillStyle="rgba(150,156,164,.8)";ctx.fillRect(x0+3.4,y0-10,4.2,1.6);
}

function drawCaveProps(C,camx,camy){
  const P=caveProps(C);
  for(const p of P){
    if(p.k==="rope"){
      const a=p.pts[0],b=p.pts[p.pts.length-1];
      if(a[0]-camx<-80||a[0]-camx>W+80)continue;
      if(b[1]-camy<-20||a[1]-camy>H+20)continue;
      caveDrawRope(p,camx,camy);continue;
    }
    const sx=p.x-camx, sy=p.y-camy;
    if(sx<-90||sx>W+90||sy<-60||sy>H+60)continue;
    if(p.k==="bones")caveDrawBones(p,sx,sy);
    else if(p.k==="crate")caveDrawCrate(p,sx,sy);
    else if(p.k==="camp")caveDrawCamp(p,sx,sy);
    else if(p.k==="tally")caveDrawTally(p,sx,sy);
  }
}
