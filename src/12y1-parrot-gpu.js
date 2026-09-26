/* ══════════════ трепло на движке: атлас перьев и экземпляры (G15, DESIGN-gpu «Where I stopped») ══════════════
   Птица рисовалась в 2D: своё rAF, каждый кадр полторы сотни перьев с градиентами в слой и слой в окно —
   21 мс на кадр в стенде без видеокарты (26.09), и каждые пять секунд то же ради иконки на пульте. Теперь:
   • АТЛАС. Каждая деталь, что не меняет формы, печётся один раз (gpuBake) теми же кистями 12y — перо,
     опахало, чешуйка, масса тела, клюв, жёрдочка. Перья сделаны при угле 0: опахало от угла не зависит
     (parPlume поворачивает все точки на ang), поэтому угол и длина — это поворот и растяжение экземпляра.
   • ЭКЗЕМПЛЯРЫ. parrotDraw больше не рисует, а раскладывает: та же последовательность, что была у 2D,
     с тем же стеком преобразований (pg*), только вместо кисти — запись «деталь, матрица». Раскладка —
     чистый JS: в Node её зовёт пульт, и сторож «птицу не рисуют каждую секунду» считает вызовы как прежде.
   • ШЕЙДЕР. Спрайт из атласа под любой аффинной матрицей (разворот боком — сжатие с поворотом, это сдвиг),
     эллипс заливкой и обводом, ломаная до четырёх точек, бусина (ореол и ядро — «lighter», вторым проходом
     со сложением). Черепица корпуса режется массой тела в шейдере: маска — альфа детали «body».
   Свет (source-atop, правило 3 в шапке 12y) в 2D-версии ложился мимо птицы: прямоугольник заливки уже стоял
   в переносе (L.ox, L.oy) и накрывал только правый низ под жёрдочкой — замер 26.09: 0 пикселей из 280 тыс.
   Перенесено как было — без света; вернуть его — решение с парой, не побочный эффект переноса. */
const PAR_K=2;   /* точек атласа на единицу птицы: окно даёт ≤1.4, стенд mkparrot — 2.2 */
let PAR_CELLS=null;
/* рамки деталей — по их же геометрии (контрольные точки кривых охватывают кривую) */
function parQuillBox(len,wid,curl){
  const P=[0,0,len*.45,-wid,len,-wid*.14+curl*len*.14,len*.5,wid*.12+curl*len*.12,0,wid*.36,len*.5,-wid*.26,len*.94,-wid*.08+curl*len*.13];
  let x0=0,y0=0,x1=0,y1=0;for(let i=0;i<P.length;i+=2){x0=Math.min(x0,P[i]);x1=Math.max(x1,P[i]);y0=Math.min(y0,P[i+1]);y1=Math.max(y1,P[i+1]);}
  const m=1+Math.max(.6,wid*.08)/2;return [x0-m,y0-m,x1+m,y1+m];}
function parPlumeBox(len,bend,wid,fw){
  const cx=Math.cos(-bend)*len*.55,cy=Math.sin(-bend)*len*.55,W=fw===undefined?1:fw;let x0=0,y0=0,x1=0,y1=0;
  for(let i=0;i<=14;i++){const t=i/14,px=2*(1-t)*t*cx+t*t*len,py=2*(1-t)*t*cy,dx=2*(1-t)*cx+2*t*(len-cx),dy=2*(1-t)*cy-2*t*cy,
    L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L,w=Math.sin(Math.pow(t,.62)*Math.PI)*wid*W;
    for(const [x,y] of [[px+nx*w,py+ny*w],[px-nx*w*.6,py-ny*w*.6]]){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}}
  const m=1.5+Math.max(.7,wid*.17)/2;return [x0-m,y0-m,x1+m,y1+m];}
/* ── детали: имя, рамка в единицах птицы, кисть ── */
function parCellDefs(){
  const C=PAR_C,L=[];
  const q=(nm,len,wid,curl,t,b)=>L.push([nm,parQuillBox(len,wid,curl),g=>parQuill(g,len,wid,curl,t,b)]);
  const pl=(nm,len,bend,wid,c1,c2,fr,fw)=>L.push([nm,parPlumeBox(len,bend,wid,fw),g=>{parPlume(g,len,0,bend,wid,c1,c2,fr,fw);}]);
  /* жёрдочка — не труба из каталога, а обрезок ветки: два сучка, волокно вдоль и светлая верхняя кромка */
  L.push(["perch",[-94,-5,94,10],g=>{
    const pg=g.createLinearGradient(0,-4,0,10);
    pg.addColorStop(0,"#6b5334");pg.addColorStop(.42,"#3d2e1c");pg.addColorStop(1,"#1c1510");
    g.fillStyle=pg;g.beginPath();g.roundRect(-92,-3,184,11,5);g.fill();
    g.strokeStyle="rgba(140,110,70,.35)";g.lineWidth=.8;
    for(let i=0;i<5;i++){const y=-1+i*1.9;g.beginPath();g.moveTo(-88,y);
      g.bezierCurveTo(-30,y+(i&1?.9:-.7),30,y+(i&1?-.8:.8),88,y);g.stroke();}
    for(const kx of [-46,28]){g.fillStyle="rgba(28,20,12,.55)";g.beginPath();g.ellipse(kx,2.6,5,2.6,.2,0,7);g.fill();}
    g.strokeStyle="rgba(190,240,235,.22)";g.lineWidth=1;g.beginPath();g.moveTo(-90,-2.4);g.lineTo(90,-2.4);g.stroke();}]);
  for(let i=0;i<7;i++){const k=i/6,amb=i===2||i===5;
    pl("tail"+i,152-k*54,.34,9-k*3.4,amb?C.amber:(i&1?C.blueL:C.blue),amb?C.amberD:C.blueD,5,1.7);}
  for(let i=0;i<6;i++){const k=i/5;pl("wing"+i,104-k*38,.30,11-k*3.6,i&1?C.blue:C.blueL,C.blueD,5,1.5);}
  for(let i=0;i<9;i++){const k=i/8;
    pl("crest"+i,46+Math.sin(k*3.1)*30+Math.sin(i*2.3)*5,.86,6.2-k*1.6,i%3===0?C.amber:(i%3===1?C.blue:C.viol),
      i%3===0?C.amberD:(i%3===1?C.blueD:"#4a2f9c"),4,1.1);}
  q("qUT",34,13,.3,C.cream,C.creamD);q("qWC",30,12,.3,C.blueL,C.blueD);q("qSh",28,11,.3,C.amber,C.amberD);
  q("qCol",16,10,.3,C.cream,C.blue);q("qChB",9,6,.2,C.blueL,C.blue);q("qChC",9,6,.2,C.cream,C.creamD);
  q("qBN",30,15,.26,C.blueL,C.blue);q("qBF",30,15,.26,C.blue,C.blueD);q("qAm",22,12,.26,C.amber,C.amberD);
  L.push(["scale",[-7.5,-7,7.5,6.5],g=>parScale(g,0,0,11.5,9.5,C.cream,C.creamD)]);
  /* масса корпуса — она же маска черепицы (альфа 1 внутри обвода) */
  L.push(["body",[-38,-182,40,-26],g=>{const bg=g.createLinearGradient(-40,0,42,0);
    bg.addColorStop(0,C.blueD);bg.addColorStop(.52,"#42566c");bg.addColorStop(1,C.creamD);
    g.fillStyle=bg;parBodyPath(g);g.fill();}]);
  /* неподвижное поверх чешуи: холодная кромка по спине и тень крыла на груди — уже обрезаны телом */
  L.push(["coatTop",[-38,-182,40,-26],g=>{parBodyPath(g);g.clip();
    g.strokeStyle="rgba(150,225,255,.34)";g.lineWidth=3.2;
    g.beginPath();g.moveTo(-30,-52);g.bezierCurveTo(-36,-104,-34,-146,-12,-170);g.stroke();
    const cg=g.createLinearGradient(-14,0,42,0);
    cg.addColorStop(0,"rgba(20,34,60,.55)");cg.addColorStop(.45,"rgba(20,34,60,0)");cg.addColorStop(1,"rgba(255,240,210,.28)");
    g.fillStyle=cg;g.fillRect(-14,-190,60,170);}]);
  L.push(["wingBack",[-17,0,19,88],g=>{g.fillStyle="rgba(10,26,58,.85)";
    g.beginPath();g.moveTo(4,6);g.quadraticCurveTo(-16,34,-6,86);g.quadraticCurveTo(14,44,18,2);g.closePath();g.fill();}]);
  L.push(["neck",[-32,-19,20,19],g=>{const ng=g.createLinearGradient(-18,0,18,0);
    ng.addColorStop(0,C.blue);ng.addColorStop(.5,"#a9c4de");ng.addColorStop(1,C.cream);
    g.fillStyle=ng;g.beginPath();g.ellipse(-6,0,24,17,-.15,0,7);g.fill();}]);
  L.push(["skull",[-24,-22,24,22],g=>{const sg=g.createLinearGradient(-20,0,22,0);
    sg.addColorStop(0,C.blue);sg.addColorStop(.42,"#a9c4de");sg.addColorStop(.7,C.cream);
    g.fillStyle=sg;g.beginPath();g.ellipse(0,0,22,20,-.08,0,7);g.fill();}]);
  /* надклювье с подрезом, бликом и ноздрёй: ноздря в 2D шла после подклювья, но с ним не пересекается */
  L.push(["beakU",[-10,-16,25,18],g=>{const bg2=g.createLinearGradient(0,-12,0,14);
    bg2.addColorStop(0,C.beak);bg2.addColorStop(1,C.beakD);g.fillStyle=bg2;
    g.beginPath();g.moveTo(-9,-13);g.bezierCurveTo(6,-15,18,-10,22,-2);g.bezierCurveTo(25,4,23,11,20,15);
    g.lineTo(17,17);g.bezierCurveTo(15,12,12,9,9,7);g.bezierCurveTo(4,5,-2,4.5,-9,4.5);g.closePath();g.fill();
    g.strokeStyle="rgba(90,54,16,.45)";g.lineWidth=1.1;g.beginPath();g.moveTo(19,14.5);g.bezierCurveTo(15,11,12,8.5,9,7);g.stroke();
    g.fillStyle="rgba(255,246,226,.5)";g.beginPath();g.moveTo(-4,-10);g.quadraticCurveTo(8,-11,15,-3);
    g.quadraticCurveTo(7,-6,-4,-6);g.closePath();g.fill();
    g.fillStyle="rgba(60,30,10,.55)";g.beginPath();g.arc(-2,-8,1.6,0,7);g.fill();}]);
  /* зев при закрытом клюве; раскрытие — растяжение вниз от верхней кромки (y 2) */
  L.push(["mouth",[-8,0,19,12],g=>{g.fillStyle="rgba(58,20,26,.92)";
    g.beginPath();g.moveTo(-6,2);g.quadraticCurveTo(9,3,17,7);g.quadraticCurveTo(4,10,-6,9);g.closePath();g.fill();}]);
  L.push(["beakL",[-10,3,11,15],g=>{const lg2=g.createLinearGradient(0,4,0,15);
    lg2.addColorStop(0,C.beakD);lg2.addColorStop(1,"#a06a2e");g.fillStyle=lg2;
    g.beginPath();g.moveTo(-9,4);g.bezierCurveTo(2,5,9,7,10,11);g.bezierCurveTo(6,14,-3,14,-9,13);g.closePath();g.fill();}]);
  return L;
}
/* раскладка атласа полками, выше — раньше; поле PAD — запас мипам */
function parCells(){
  if(PAR_CELLS)return PAR_CELLS;
  const L=parCellDefs(),K=PAR_K,PAD=6,AW=1024,C={};let x=0,y=0,rh=0;
  L.sort((a,b)=>(b[1][3]-b[1][1])-(a[1][3]-a[1][1]));
  for(const [nm,b,paint] of L){
    const w=Math.ceil((b[2]-b[0])*K)+2*PAD,h=Math.ceil((b[3]-b[1])*K)+2*PAD;
    if(x+w>AW){x=0;y+=rh;rh=0;}
    C[nm]={b,px:x+PAD,py:y+PAD,paint};x+=w;rh=Math.max(rh,h);}
  const AH=y+rh;
  for(const nm in C){const c=C[nm],b=c.b;c.u=[c.px/AW,c.py/AH,(c.px+(b[2]-b[0])*K)/AW,(c.py+(b[3]-b[1])*K)/AH];}
  return PAR_CELLS={C,AW,AH};
}

/* ── стек преобразований раскладки: те же save/restore/translate/rotate/scale, что у 2D ── */
function pgSave(S){S.st.push(S.m.slice());}
function pgRest(S){S.m=S.st.pop();}
function pgTr(S,x,y){const m=S.m;m[4]+=m[0]*x+m[2]*y;m[5]+=m[1]*x+m[3]*y;}
function pgRot(S,a){const m=S.m,c=Math.cos(a),s=Math.sin(a),a0=m[0],b0=m[1],c0=m[2],d0=m[3];
  m[0]=a0*c+c0*s;m[1]=b0*c+d0*s;m[2]=c0*c-a0*s;m[3]=d0*c-b0*s;}
function pgScl(S,x,y){const m=S.m;m[0]*=x;m[1]*=x;m[2]*=y;m[3]*=y;}
function parInv(m){const D=m[0]*m[3]-m[1]*m[2]||1e-9;
  return [m[3]/D,-m[1]/D,-m[2]/D,m[0]/D,(m[2]*m[5]-m[3]*m[4])/D,(m[1]*m[4]-m[0]*m[5])/D];}
/* сток: q — обычный проход, qa — сложение (бусины); u — форма прохода (размер, маска тела) */
function parSink(S,m){
  S=S||{q:[],qa:[],st:[],u:new Float32Array(28)};
  S.q.length=S.qa.length=S.st.length=0;S.m=m.slice();S.fl=0;S.mb=null;return S;}
/* цвет CSS → премультиплицированный [r,g,b,a]; k — множитель прозрачности */
const PAR_CC=new Map();
function parCol(s,k){
  let c=PAR_CC.get(s);
  if(!c){let r=0,g=0,b=0,a=1;
    if(s[0]==="#"){const v=parseInt(s.slice(1),16);r=(v>>16&255)/255;g=(v>>8&255)/255;b=(v&255)/255;}
    else{const n=s.match(/[\d.]+/g);r=n[0]/255;g=n[1]/255;b=n[2]/255;a=n[3]===undefined?1:+n[3];}
    PAR_CC.set(s,c=[r,g,b,a]);}
  const a=c[3]*(k===undefined?1:k);return [c[0]*a,c[1]*a,c[2]*a,a];}
/* запись: матрица, вид (0 спрайт, 1 эллипс, 2 обвод эллипса, 3 бусина, 4 ломаная), флаги (2 — обрез телом, 4 — рамкой слоя),
   рамка в своих единицах, uv или точки 0–1, цвет, точки 2–3 или эллипс, полутолщина и число точек */
function parPut(S,ty,fl,r,u,col,e,h){const m=S.m;(ty===3?S.qa:S.q).push(m[0],m[1],m[2],m[3],m[4],m[5],ty,fl|S.fl,
  r[0],r[1],r[2],r[3],u[0],u[1],u[2],u[3],col[0],col[1],col[2],col[3],e[0],e[1],e[2],e[3],h[0],h[1],h[2],h[3]);}
const PAR_Z=[0,0,0,0],PAR_W=[1,1,1,1],PAR_LAY=[-115,-285.76,115,18.24];
/* запас рамки аналитической фигуры — два пикселя в своих единицах */
function parPad(S){const m=S.m;return 2/Math.max(1e-3,Math.min(Math.hypot(m[0],m[1]),Math.hypot(m[2],m[3])));}
function parSpr(S,nm,fl){const c=parCells().C[nm];parPut(S,0,fl||0,c.b,c.u,PAR_W,PAR_Z,PAR_Z);}
function parEll(S,cx,cy,rx,ry,col,hw){const p=parPad(S)+(hw||0);
  parPut(S,hw?2:1,0,[cx-rx-p,cy-ry-p,cx+rx+p,cy+ry+p],PAR_Z,col,[cx,cy,rx,ry],[hw||0,0,0,0]);}
function parLine(S,P,hw,col){const p=parPad(S)+hw;let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  for(let i=0;i<P.length;i+=2){x0=Math.min(x0,P[i]);x1=Math.max(x1,P[i]);y0=Math.min(y0,P[i+1]);y1=Math.max(y1,P[i+1]);}
  parPut(S,4,0,[x0-p,y0-p,x1+p,y1+p],[P[0],P[1],P[2],P[3]],col,[P[4]||0,P[5]||0,P[6]||0,P[7]||0],[hw,P.length/2,0,0]);}
/* квадратичная кривая ломаной в n звеньев (3 — четыре точки, потолок шейдера) */
function parQuad(S,x0,y0,cx,cy,x1,y1,hw,col,n){n=n||3;const P=[];
  for(let i=0;i<=n;i++){const t=i/n,u=1-t;P.push(u*u*x0+2*u*t*cx+t*t*x1,u*u*y0+2*u*t*cy+t*t*y1);}
  parLine(S,P,hw,col);}
function parBeadG(S,x,y,r,k){const R=r*3.4+parPad(S);parPut(S,3,0,[x-R,y-R,x+R,y+R],PAR_Z,PAR_Z,[x,y,r,k],PAR_Z);}
/* ряд перьев по дуге (parRow 2D): перо ряда — одна деталь, t — её масштаб, sx — вытяжка вдоль (воротник) */
function parRowG(S,ax,ay,r1,r2,a0,a1,n,cell,ph,amp,spread,sx,fl){
  for(let i=0;i<n;i++){
    const k=n>1?i/(n-1):.5,a=a0+(a1-a0)*k,x=ax+Math.cos(a)*r1,y=ay+Math.sin(a)*r2;
    const w=Math.sin(PAR.t*2.1+ph+i*.55)*amp,t=1-Math.abs(k-.5)*(1-spread)*2*.55;
    pgSave(S);pgTr(S,x,y);pgRot(S,a+w);pgScl(S,t*(sx||1),t);parSpr(S,cell,fl);pgRest(S);}
}
/* ── лапа (parFoot 2D): цевка, восемь колечек, три пальца с когтями и задний — ломаными ── */
function parFootG(S,x,dir,grip,up){
  const U=up||0,Sc=up?(PAR.scratch||0):0,F=parCol(PAR_C.foot),D=parCol(PAR_C.footD);
  pgSave(S);pgTr(S,x-U*6+Sc*6,-U*26-Sc*84);pgScl(S,dir,1);pgRot(S,-U*.5-Sc*2.3);
  const tl=38+Sc*26;
  parQuad(S,1,-tl,0,-20,0,-4,3.2,D);
  parQuad(S,1,2-tl,0,-20,0,-5,2.2,F);
  const rc=parCol("rgba(70,42,18,.45)");
  for(let i=0;i<7+Sc*6;i++){const y=-33-Sc*26+i*4.4;parQuad(S,-2.4,y,0,y+1.6,2.4,y,.5,rc,2);}
  for(let i=0;i<3;i++){
    const a=(-.85+i*.72)+grip*.14,ex=Math.cos(a)*15,ey=4+Math.sin(a)*2;
    parQuad(S,0,-5,Math.cos(a)*10,-3,ex,ey,2.3,F);
    parLine(S,[ex,ey,Math.cos(a)*18,7+Math.sin(a)*2],.9,D);}
  parQuad(S,0,-5,-9,-3,-12,4,2,D);
  pgRest(S);
}
/* ── корпус (parCoat 2D): масса, чешуя, кромка и тень, спина, янтарь — всё внутри обвода ── */
function parCoatG(S,T){
  /* форма прохода: обратная матрица корпуса (точка канвы → его единицы), рамка и uv маски */
  const c=parCells().C.body,iv=parInv(S.m);
  S.u.set(iv.slice(0,4),4);S.u[8]=iv[4];S.u[9]=iv[5];S.u.set(c.b,12);S.u.set(c.u,16);
  parSpr(S,"body");
  for(let r=0;r<22;r++){
    const y=-32-r*6;
    for(let i=0;i<6;i++){
      const j=Math.sin(r*12.9898+i*78.233)*43758.5453;
      const jx=(j-Math.floor(j)-.5)*3.4,jy=(Math.sin(j)*.5)*2.2;
      const x=-6+i*10+((r&1)?5:0)+jx,w=Math.sin(T*1.7+r*.6+i*.5)*.9;
      pgSave(S);pgTr(S,x+w,y+jy);pgScl(S,(11.5+jx*.5)/11.5,(9.5+jy*.4)/9.5);parSpr(S,"scale",2);pgRest(S);
    }
  }
  parSpr(S,"coatTop");
  for(let r=0;r<9;r++){
    const y=-48-r*13;
    for(let i=0;i<3;i++){
      const x=-46+i*14+((r&1)?7:0),w=Math.sin(T*2.0+r*.7+i*.55)*.05;
      pgSave(S);pgTr(S,x,y);pgRot(S,1.34+w);parSpr(S,x>-22?"qBN":"qBF",2);pgRest(S);
    }
  }
  for(let i=0;i<5;i++){pgSave(S);pgTr(S,-27+i*5,-140+i*6);pgRot(S,1.25);parSpr(S,"qAm",2);pgRest(S);}
}
/* ══ сама птица ══ (0,0) — жёрдочка под лапами. S — сток (parSink) с корневой матрицей в точках канвы;
   порядок и числа — строка в строку из 2D-версии (0.470.0), пояснения к позам там же, в истории 12y */
function parrotDraw(S,W,H){
  if(!(W>0&&H>0))return;   /* канва нулевого размера (окно скрыто) */
  const T=PAR.t;
  const breathe=Math.sin(T*1.35)*1.6,sway=Math.sin(T*.62)*2.0;
  const flap=PAR.flap,lift=PAR.hop;
  pgSave(S);
  pgTr(S,W/2+4,H-16-PAR.hang*150);
  const s=Math.min(W/230,H/304);
  pgScl(S,s,s);
  /* жёрдочка и тень: без опоры и тени птица висит в пустоте */
  parEll(S,-2,1,44-lift*.18,6-lift*.03,parCol("rgba(0,0,0,.45)"));
  parSpr(S,"perch");
  pgSave(S);
  pgTr(S,sway+PAR.lean*10+PAR.step,-lift);
  /* вис вниз головой — вокруг точки хвата (низ корпуса), не вокруг жёрдочки */
  if(PAR.hang>.001){pgTr(S,0,-44);pgRot(S,PAR.hang*2.85);pgTr(S,0,44);}
  pgRot(S,PAR.lean*.05+PAR.bow*.20+Math.sin(T*.62+1)*.012);
  /* лапы держат жёрдочку и НЕ разворачиваются вместе с телом */
  pgSave(S);pgTr(S,0,-44);pgRot(S,-PAR.hang*2.85);pgTr(S,0,44);
  parFootG(S,-15,-1,lift*.06,0);
  if(!(PAR.scratch>.02))parFootG(S,15,1,lift*.06,PAR.footUp);
  pgRest(S);
  /* разворот боком — сжатие по ширине, не ниже трети */
  const tc=Math.cos((PAR.turn||0)*Math.PI);
  pgScl(S,tc<0?-Math.max(.34,-tc):Math.max(.34,tc),1);
  const MB=S.m.slice(),beads=[];   /* кадр слоя птицы: огни зажигаются в нём, без дыхания */
  /* 2D рисовала оперение в слой 230×304 вокруг точки (115, 285.76): что ниже жёрдочки на 18 единиц или шире 115 —
     срезалось краем слоя (хвост). Рамка иконки на пульте [19..208]×[43..303] стоит на этом срезе — он переносится */
  {const iv=parInv(MB);S.u.set(iv.slice(0,4),20);S.u[10]=iv[4];S.u[11]=iv[5];S.u.set(PAR_LAY,24);S.mb=MB;S.fl=4;}
  pgSave(S);
  pgScl(S,1,1+breathe*.006);
  /* 1. хвост — первым, он за телом */
  pgSave(S);pgTr(S,-24,-98);pgRot(S,Math.sin(T*.7)*.05+flap*.24);
  for(let i=0;i<7;i++){
    const k=i/6,a=1.82+k*(.52+PAR.fan*.72),len=(152-k*54)*(1+flap*.06),w=Math.sin(T*1.15+i*.62)*.045;
    pgSave(S);pgRot(S,w);pgRot(S,a);pgScl(S,1+flap*.06,1);parSpr(S,"tail"+i);pgRest(S);
    /* огни на двух перьях; место — как считала 2D-версия (поворот хвоста в него не входил) */
    if(i===0||i===4){const ca=Math.cos(w),sa=Math.sin(w),px=Math.cos(a)*len,py=Math.sin(a)*len;
      beads.push([-24+px*ca-py*sa,-98+px*sa+py*ca,2.4,.62]);}
  }
  pgRest(S);
  /* подхвостье: стык корпуса с хвостом */
  parRowG(S,-18,-70,10,10,1.55,2.30,5,"qUT",2.2,.05,.8);
  /* 2. корпус */
  parCoatG(S,T);
  /* 3. крыло: три ряда на одном шарнире у плеча */
  pgSave(S);pgTr(S,-20,-150);
  pgRot(S,-flap*1.35-PAR.stretch*.62+Math.sin(T*.9)*.03);
  if(PAR.stretch>.001)pgScl(S,1+PAR.stretch*.34,1+PAR.stretch*.16);
  parSpr(S,"wingBack");
  for(let i=0;i<6;i++){const k=i/5,a=1.42+k*.46,w=Math.sin(T*1.25+i*.7)*.04;
    pgSave(S);pgRot(S,w);pgRot(S,a);parSpr(S,"wing"+i);pgRest(S);}
  parRowG(S,2,-6,9,10,1.30,1.94,7,"qWC",1.4,.05,.9);
  parRowG(S,4,-10,8,9,1.30,1.90,5,"qSh",3.6,.05,.9);
  pgRest(S);
  const pr=PAR.preen,sc=PAR.scratch||0;
  const hx=12-pr*16-PAR.tuck*5+sc*4,hy=-168+pr*26+PAR.tuck*13+sc*20;
  /* воротничок идёт за головой на две трети */
  const rf2=Math.abs(PAR.ruff)+PAR.tuck*.85;
  parRowG(S,10+(hx-12)*.85,-150+(hy+168)*.9,16,13,-2.5,.45,11,"qCol",1.2,.10+rf2*.12,.92,(16+rf2*6)/16);
  /* 4. голова: шея на полпути, потом череп со всем, что на нём */
  pgSave(S);pgTr(S,12+(hx-12)*.5,-158+(hy+168)*.5);parSpr(S,"neck");pgRest(S);
  pgSave(S);
  pgTr(S,hx,hy);
  const hr=PAR.look*.12+Math.sin(T*.5)*.022+PAR.mad*.05+pr*1.05+PAR.roll*.62+PAR.bow*.5+sc*.4;
  pgRot(S,hr);
  /* 4а. хохол: бусина висит на голом стебле и отстаёт от пера */
  const cr=PAR.crest,stem=parCol("rgba(150,200,235,.6)");
  for(let i=0;i<9;i++){
    const k=i/8,a=-2.62+k*1.22-cr*.34;
    const len=(46+Math.sin(k*3.1)*30+Math.sin(i*2.3)*5)*(1+cr*.30);
    const w=Math.sin(T*1.6+i*.8)*.075;
    pgSave(S);pgRot(S,w);
    pgSave(S);pgRot(S,a);pgScl(S,1+cr*.30,1);parSpr(S,"crest"+i);pgRest(S);
    const px=Math.cos(a)*len,py=Math.sin(a)*len,st=6+Math.sin(i*1.7)*2;
    const sx=px+Math.cos(a+.30)*st,sy=py+Math.sin(a+.30)*st;
    parLine(S,[px,py,sx,sy],.8,stem);
    pgRest(S);
    const ca=Math.cos(hr),sa=Math.sin(hr),bx=sx*ca-sy*sa,by=sx*sa+sy*ca,lag=Math.sin(T*1.6+i*.8-.9)*3.5;
    beads.push([hx+bx+lag*.6,hy+by+lag,1.8+k*.4,.72+.28*Math.sin(T*2.2+i*1.1)]);
  }
  /* 4б. череп и мелкое перо на щеке */
  parSpr(S,"skull");
  for(let i=0;i<7;i++){const a=-1.5+i*.42;
    pgSave(S);pgTr(S,Math.cos(a)*13,Math.sin(a)*11);pgRot(S,a+1.4);parSpr(S,i<3?"qChB":"qChC");pgRest(S);}
  /* 4в. клюв: надклювье, зев при раскрытии, подклювье */
  pgSave(S);pgTr(S,15,-1);pgRot(S,PAR.peck*.16);pgScl(S,1.34,1.34);
  parSpr(S,"beakU");
  if(PAR.yawn>.02||PAR.beak>.3){pgSave(S);pgTr(S,0,2);pgScl(S,1,1+2*PAR.yawn);pgTr(S,0,-2);parSpr(S,"mouth");pgRest(S);}
  pgSave(S);pgTr(S,0,PAR.beak*5+PAR.yawn*17);pgRot(S,PAR.yawn*.42);parSpr(S,"beakL");pgRest(S);
  pgRest(S);
  /* 4г. глаз: кольцо смыкается вместе с глазом, веко — кремовая дуга */
  const bl=1-PAR.blink;
  pgSave(S);pgTr(S,4,-4);
  parEll(S,0,0,11.2,10.8*Math.max(.24,bl),parCol("rgba(28,44,74,.42)"));
  parEll(S,0,0,9.5,9.5*Math.max(.08,bl),parCol("#e9dcc6"));
  if(bl>.2){
    parEll(S,.6,0,7.4,7.4*bl,parCol(PAR_C.eye));
    parEll(S,.6,1.6,5.6,5.6*bl,parCol("rgba(120,190,240,.5)"));
    const hi=parCol("rgba(255,255,255,.95)");
    parEll(S,2.6,-3,2.5,2.5*bl,hi);parEll(S,-2.6,2.4,1.2,1.2*bl,hi);
  }
  parEll(S,0,0,9.5,9.5*Math.max(.08,bl),parCol("rgba(20,14,26,.75)"),.8);
  if(bl<.3)parQuad(S,-9,0,0,2.4,9,0,1.1,parCol("rgba(210,190,158,1)",1-bl/.3));
  pgRest(S);
  pgRest(S);
  pgRest(S);
  /* 5. огни — после всего и сложением */
  const M0=S.m;S.m=MB;for(const b of beads)parBeadG(S,b[0],b[1],b[2],b[3]);S.m=M0;
  S.fl=0;
  if(PAR.scratch>.02){
    pgSave(S);pgTr(S,0,-44);pgRot(S,-PAR.hang*2.85);pgTr(S,0,44);
    parFootG(S,15,1,lift*.06,PAR.footUp);
    pgRest(S);
  }
  pgRest(S);
  pgRest(S);
}
/* рамка разложенной птицы в точках канвы (без ореолов бусин) — сторож иконки на пульте */
function parrotBox(S){
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9,L=null;const f=S.q;
  if(S.mb){const m=S.mb,c=[];for(const [X,Y] of [[PAR_LAY[0],PAR_LAY[1]],[PAR_LAY[2],PAR_LAY[1]],[PAR_LAY[0],PAR_LAY[3]],[PAR_LAY[2],PAR_LAY[3]]])
    c.push(m[0]*X+m[2]*Y+m[4],m[1]*X+m[3]*Y+m[5]);
    L=[Math.min(c[0],c[2],c[4],c[6]),Math.min(c[1],c[3],c[5],c[7]),Math.max(c[0],c[2],c[4],c[6]),Math.max(c[1],c[3],c[5],c[7])];}
  for(let i=0;i<f.length;i+=28){let a=1e9,b=1e9,c=-1e9,d=-1e9;
    for(const [X,Y] of [[f[i+8],f[i+9]],[f[i+10],f[i+9]],[f[i+8],f[i+11]],[f[i+10],f[i+11]]]){
      const x=f[i]*X+f[i+2]*Y+f[i+4],y=f[i+1]*X+f[i+3]*Y+f[i+5];a=Math.min(a,x);c=Math.max(c,x);b=Math.min(b,y);d=Math.max(d,y);}
    if(L&&(f[i+7]&4)){a=Math.max(a,L[0]);b=Math.max(b,L[1]);c=Math.min(c,L[2]);d=Math.min(d,L[3]);}
    if(c>a&&d>b){x0=Math.min(x0,a);x1=Math.max(x1,c);y0=Math.min(y0,b);y1=Math.max(y1,d);}}
  return [x0,y0,x1,y1];
}

/* ── видеокарта: шейдер, конвейеры (обычный и сложение), проход в канву ── */
const PAR_WGSL=`
struct IO{@builtin(position) p:vec4f,@location(0) l:vec2f,@location(1) uv:vec2f,@location(2) @interpolate(flat) k:vec2f,
  @location(3) @interpolate(flat) u:vec4f,@location(4) @interpolate(flat) c:vec4f,@location(5) @interpolate(flat) e:vec4f,
  @location(6) @interpolate(flat) h:vec4f};
@group(0) @binding(0) var<storage,read> Q:array<vec4f>;
@group(0) @binding(1) var<uniform> U:array<vec4f,7>;
@group(0) @binding(2) var T:texture_2d<f32>;
@group(0) @binding(3) var sm:sampler;
@vertex fn vs(@builtin(vertex_index) vi:u32,@builtin(instance_index) ii:u32)->IO{
  let k=ii*7u;let m=Q[k];let t=Q[k+1u];let r=Q[k+2u];var o:IO;
  o.k=t.zw;o.u=Q[k+3u];o.c=Q[k+4u];o.e=Q[k+5u];o.h=Q[k+6u];
  let C=array<vec2f,6>(vec2f(0.,0.),vec2f(1.,0.),vec2f(0.,1.),vec2f(0.,1.),vec2f(1.,0.),vec2f(1.,1.));let cn=C[vi];
  o.l=mix(r.xy,r.zw,cn);o.uv=mix(o.u.xy,o.u.zw,cn);
  let q=vec2f(m.x*o.l.x+m.z*o.l.y+t.x,m.y*o.l.x+m.w*o.l.y+t.y);
  o.p=vec4f(q.x/U[0].x*2.-1.,1.-q.y/U[0].y*2.,0.,1.);return o;}
fn sd(p:vec2f,a:vec2f,b:vec2f)->f32{let d=b-a;let h=clamp(dot(p-a,d)/max(dot(d,d),1e-6),0.,1.);return length(p-a-d*h);}
@fragment fn fs(i:IO)->@location(0) vec4f{
  let dx=dpdx(i.uv);let dy=dpdy(i.uv);let px=max(length(fwidth(i.l))*.7071,1e-4);   /* единиц на точку — до ветвлений */
  var o=vec4f(0.);let ty=i.k.x;
  if(ty<.5){o=textureSampleGrad(T,sm,i.uv,dx*.574,dy*.574)*i.c;}   /* уровень мипа −0.8: чешуя и перо не мылятся (как у gpuLitSprite) */
  else if(ty<2.5){   /* эллипс: расстояние ≈ f/|∇f|; 2 — обвод полутолщиной h.x */
    let q=(i.l-i.e.xy)/i.e.zw;let L=max(length(q),1e-5);let g=max(length(q/i.e.zw),1e-6);let d=(L-1.)*L/g;
    var a=clamp(.5-d/px,0.,1.);if(ty>1.5){a=clamp((i.h.x-abs(d))/px+.5,0.,1.);}o=i.c*a;}
  else if(ty<3.5){   /* бусина (parBead): ореол до 3.4r, стопы 0/.24/1 без премультипликации, и ядро r */
    let r=length(i.l-i.e.xy);let t=r/(i.e.z*3.4);var c=vec3f(111.,240.,255.)/255.;var a=0.;
    if(t<.24){let f=t/.24;c=mix(vec3f(190.,252.,255.)/255.,c,f);a=mix(.85,.34,f)*i.e.w;}
    else if(t<1.){a=mix(.34,0.,(t-.24)/.76)*i.e.w;}
    let ca=clamp((i.e.z-r)/px+.5,0.,1.)*.95*i.e.w;
    o=vec4f(c*a,a)+vec4f(vec3f(228.,255.,255.)/255.*ca,ca);}
  else{var d=sd(i.l,i.u.xy,i.u.zw);if(i.h.y>2.5){d=min(d,sd(i.l,i.u.zw,i.e.xy));}if(i.h.y>3.5){d=min(d,sd(i.l,i.e.xy,i.e.zw));}
    o=i.c*clamp((i.h.x-d)/px+.5,0.,1.);}
  let fl=u32(i.k.y+.5);
  if((fl&4u)!=0u){   /* рамка слоя 2D (U[5], U[2].zw — обратная кадра слоя; U[6] — рамка): срез жёсткий, как у края канвы */
    let p=i.p.xy;let b=vec2f(U[5].x*p.x+U[5].z*p.y+U[2].z,U[5].y*p.x+U[5].w*p.y+U[2].w);
    if(any(b<U[6].xy)||any(b>U[6].zw)){o=vec4f(0.);}}
  if((fl&2u)!=0u){   /* обрез массой тела: точка канвы → единицы корпуса → альфа детали body */
    let p=i.p.xy;let b=vec2f(U[1].x*p.x+U[1].z*p.y+U[2].x,U[1].y*p.x+U[1].w*p.y+U[2].y);
    let s=(b-U[3].xy)/(U[3].zw-U[3].xy);var mk=0.;
    if(all(s>=vec2f(0.))&&all(s<=vec2f(1.))){mk=textureSampleLevel(T,sm,mix(U[4].xy,U[4].zw,s),0.).a;}
    o*=mk;}
  return o;}`;
function parDesc(add){
  const m=gpuShader(PAR_WGSL),f=add?["one","one"]:["one","one-minus-src-alpha"];
  return {layout:"auto",vertex:{module:m,entryPoint:"vs"},primitive:{topology:"triangle-list"},
    fragment:{module:m,entryPoint:"fs",targets:[{format:GPU.fmt,blend:{color:{srcFactor:f[0],dstFactor:f[1]},alpha:{srcFactor:f[0],dstFactor:f[1]}}}]}};}
const PARG={A:null,P:null,Pa:null,Pd:null,S:null,Sp:null,pd:false,win:null,perch:null,cv:null,pcv:null};
function parTarget(){return {cx:null,dev:null,buf:null,U:null,f:null,bg:null,bga:null,k0:null,k1:null,k2:null};}
/* атлас печётся один раз на устройство; после потери — заново тем же draw (gpuBakeLive) */
function parAtlas(){
  const P=parCells();
  if(!PARG.A)PARG.A=gpuBake(P.AW,P.AH,g=>{for(const nm in P.C){const c=P.C[nm];
    g.save();g.translate(c.px-c.b[0]*PAR_K,c.py-c.b[1]*PAR_K);g.scale(PAR_K,PAR_K);c.paint(g);g.restore();}});
  return PARG.A?gpuBakeLive(PARG.A):null;
}
/* проход стока S в канву cv через цель T и энкодер enc: обычные записи, потом бусины сложением */
function parPass(T,cv,S,enc){
  const d=GPU.dev,A=parAtlas();if(!A||!A.view)return;
  if(T.dev!==d){T.cx=T.cx||cv.getContext("webgpu");T.cx.configure({device:d,format:GPU.fmt,alphaMode:"premultiplied"});
    T.dev=d;T.buf=null;T.U=d.createBuffer({size:112,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});T.k0=null;}
  if(PARG.Pd!==d){PARG.P=gpuPipeline("par",()=>parDesc(false));PARG.Pa=gpuPipeline("par.add",()=>parDesc(true));PARG.Pd=d;}
  const n=S.q.length/28,na=S.qa.length/28,need=S.q.length+S.qa.length;
  if(!T.f||T.f.length<need)T.f=new Float32Array(Math.max(need,28*512));
  T.f.set(S.q,0);T.f.set(S.qa,S.q.length);
  if(!T.buf||T.buf.size<T.f.byteLength){if(T.buf)GPU.trash.push(T.buf);
    T.buf=d.createBuffer({size:T.f.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST});}
  if(T.k0!==T.buf||T.k1!==A.view||T.k2!==PARG.P){T.k0=T.buf;T.k1=A.view;T.k2=PARG.P;
    const E=[{binding:0,resource:{buffer:T.buf}},{binding:1,resource:{buffer:T.U}},{binding:2,resource:A.view},{binding:3,resource:gpuMipSmp()}];
    T.bg=d.createBindGroup({layout:PARG.P.getBindGroupLayout(0),entries:E});
    T.bga=d.createBindGroup({layout:PARG.Pa.getBindGroupLayout(0),entries:E});}
  if(need)d.queue.writeBuffer(T.buf,0,T.f,0,need);
  S.u[0]=cv.width;S.u[1]=cv.height;d.queue.writeBuffer(T.U,0,S.u);
  const p=enc.beginRenderPass({colorAttachments:[{view:T.cx.getCurrentTexture().createView(),loadOp:"clear",storeOp:"store",
    clearValue:{r:0,g:0,b:0,a:0}}]});
  if(n){p.setPipeline(PARG.P);p.setBindGroup(0,T.bg);p.draw(6,n,0,0);}
  if(na){p.setPipeline(PARG.Pa);p.setBindGroup(0,T.bga);p.draw(6,na,0,n);}
  p.end();
}
/* кадр (hud, 27z — рядом с колодкой 25c): окно трепла шагает и рисуется, иконка пульта — когда пульт
   разложил новую позу (27j, раз в PERCH_EVERY). Открытый экран (body.screen) окно прячет — не рисуем */
function parrotGpuTick(){
  if(!GPU.on||!GPU.enc||!GPU.dev)return;
  if(parWin&&!document.body.classList.contains("screen")){
    const cv=PARG.cv||(PARG.cv=document.getElementById("parrotcv"));
    const t=wallMs(),dt=Math.min(.05,(t-parT0)/1000||.016);parT0=t;
    parStep(dt);
    if(cv&&cv.width&&cv.height){
      const S=PARG.S=parSink(PARG.S,[PAR_DPR,0,0,PAR_DPR,0,0]);
      parrotDraw(S,cv.width/PAR_DPR,cv.height/PAR_DPR);
      parPass(PARG.win||(PARG.win=parTarget()),cv,S,GPU.enc);
    }
  }
  if(PARG.pd&&PARG.Sp){
    const cv=PARG.pcv||(PARG.pcv=document.getElementById("perchcv"));
    if(cv&&cv.width)parPass(PARG.perch||(PARG.perch=parTarget()),cv,PARG.Sp,GPU.enc);
    PARG.pd=false;
  }
}
/* стенд (docs/mkparrot.ps1): птица текущей позы на своей канве WebGPU — её кладут drawImage в 2D-лист */
function parrotSnap(W,H,dpr){
  if(!GPU.dev)return null;
  const cv=document.createElement("canvas");cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
  const S=parSink(null,[dpr,0,0,dpr,0,0]);parrotDraw(S,W,H);
  const e=GPU.dev.createCommandEncoder();parPass(parTarget(),cv,S,e);GPU.dev.queue.submit([e.finish()]);
  return cv;
}
