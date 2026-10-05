/* ══════════════ постройки на движке (G15) ══════════════
   Постройка от кадра к кадру не меняется — камера её только двигает. Поэтому тело
   (силуэт, порода, потёки, срез по грунту, статичные огни) печётся один раз на
   постройку в свой холст и дальше ложится одной картинкой в проход видеокарты, как
   ломти грунта. Живое — маяк остова, кабина лифта, блики кристаллов, импульс кольца,
   обломки аномалии, насечки монолита, дым и огонь завода, кольца врат, тарелка
   обсерватории — каждый кадр фигурами (gpuShapes) поверх выпечки.

   Одна и та же функция фигуры (20aa) рисует все три фазы, POI_PH говорит какую:
   ""     — по-старому, всё в ctx (нет видеокарты, ярус тестов);
   "base" — выпечка: живые кисти poiL* молчат;
   "live" — кадр: ctx подменён пустышкой POI_NULL, которая помнит только матрицу,
            а poiL* кладут фигуры в POI_SH по этой матрице. Остальное рисование
            уходит в пустоту — зато порядок rng и все размеры те же, что у выпечки. */
let POI_PH="";
const POI_SH=[];
const POI_NULL_G={addColorStop(){}};
const POI_NULL={m:[1,0,0,1,0,0],st:[],fillStyle:"#000",strokeStyle:"#000",lineWidth:1,globalAlpha:1,
  globalCompositeOperation:"source-over",lineCap:"butt",lineJoin:"miter",
  save(){this.st.push(this.m.slice());},
  restore(){const m=this.st.pop();if(m)this.m=m;},
  translate(x,y){const m=this.m;m[4]+=m[0]*x+m[2]*y;m[5]+=m[1]*x+m[3]*y;},
  rotate(a){const m=this.m,c=Math.cos(a),s=Math.sin(a),a0=m[0],b0=m[1],c0=m[2],d0=m[3];
    m[0]=a0*c+c0*s;m[1]=b0*c+d0*s;m[2]=c0*c-a0*s;m[3]=d0*c-b0*s;},
  scale(x,y){const m=this.m;m[0]*=x;m[1]*=x;m[2]*=y;m[3]*=y;},
  createLinearGradient(){return POI_NULL_G;},createRadialGradient(){return POI_NULL_G;}};
for(const f of ["beginPath","moveTo","lineTo","arc","ellipse","closePath","fill","stroke","fillRect","strokeRect",
  "clip","rect","quadraticCurveTo","bezierCurveTo","setLineDash","clearRect"])POI_NULL[f]=function(){};

/* точка постройки → пиксели CSS кадра; масштаб матрицы — для толщин и радиусов */
function poiPt(x,y){const m=POI_NULL.m;return [m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]];}
function poiSc(){const m=POI_NULL.m;return Math.sqrt(Math.abs(m[0]*m[3]-m[1]*m[2]));}
function poiC(col,a){const c=gcColor(col);return [c[0]*255,c[1]*255,c[2]*255,c[3]*(a==null?1:a)];}

/* ── живые кисти: в 2D — ровно прежний вызов, в выпечке — ничего, в кадре — фигуры ── */
function poiLGlow(x,y,rad,col,a){
  if(POI_PH==="base")return;
  if(POI_PH!=="live"){poiGlow(x,y,rad,col,a);return;}
  /* радиальный спад 1 → .28 к середине → 0: мягкий круг шириной в радиус */
  const [X,Y]=poiPt(x,y),R=rad*poiSc(),c=col.split(",").map(Number);
  POI_SH.push([1,X,Y,0,0,0,R,c[0],c[1],c[2],a*.8]);
}
function poiLDisc(x,y,r,col){
  if(POI_PH==="base")return;
  if(POI_PH!=="live"){ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();return;}
  const [X,Y]=poiPt(x,y),C=poiC(col);POI_SH.push([1,X,Y,r*poiSc(),0,0,0,C[0],C[1],C[2],C[3]]);
}
function poiLRect(x,y,w,h,col){
  if(POI_PH==="base")return;
  if(POI_PH!=="live"){ctx.fillStyle=col;ctx.fillRect(x,y,w,h);return;}
  gpuQuad(POI_SH,poiPt(x,y),poiPt(x+w,y),poiPt(x+w,y+h),poiPt(x,y+h),poiC(col));
}
/* многоугольник: в 2D — poiPoly со сколом кромки и кожей, в кадре — веер треугольников и обвод */
function poiLPoly(pts,fill,line){
  if(POI_PH==="base")return;
  if(POI_PH!=="live"){poiPoly(pts,fill,line);return;}
  const P=pts.map(p=>poiPt(p[0],p[1]));
  if(fill){const C=poiC(fill);
    for(let i=1;i+1<P.length;i++)POI_SH.push([5,P[0][0],P[0][1],P[i][0],P[i][1],P[i+1][0],P[i+1][1],C[0],C[1],C[2],C[3],
      (i>1?1:0)|(i+2<P.length?4:0)]);}   /* внутренние рёбра веера жёсткие — без шва */
  if(line){const C=poiC(line),hw=.5*poiSc();
    for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length];POI_SH.push([2,a[0],a[1],b[0],b[1],hw,0,C[0],C[1],C[2],C[3]]);}}
}
/* дуга обводкой: в кадре — ломаная из капсул */
function poiLArc(cx,cy,R,a0,a1,w,col){
  if(POI_PH==="base")return;
  if(POI_PH!=="live"){ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();ctx.arc(cx,cy,R,a0,a1);ctx.stroke();return;}
  const C=poiC(col),hw=w*.5*poiSc(),n=Math.max(4,Math.ceil(Math.abs(a1-a0)*R/6));
  let p=poiPt(cx+Math.cos(a0)*R,cy+Math.sin(a0)*R);
  for(let i=1;i<=n;i++){const a=a0+(a1-a0)*i/n,q=poiPt(cx+Math.cos(a)*R,cy+Math.sin(a)*R);
    POI_SH.push([2,p[0],p[1],q[0],q[1],hw,0,C[0],C[1],C[2],C[3]]);p=q;}
}
/* эллипс под углом: w>0 — обвод, иначе заливка */
function poiLEll(cx,cy,rx,ry,rot,col,w){
  if(POI_PH==="base")return;
  if(POI_PH!=="live"){ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,rot,0,TAU);
    if(w>0){ctx.strokeStyle=col;ctx.lineWidth=w;ctx.stroke();}else{ctx.fillStyle=col;ctx.fill();}return;}
  const C=poiC(col),n=Math.max(12,Math.min(48,Math.ceil(Math.max(rx,ry)*poiSc()/3))),cr=Math.cos(rot),sr=Math.sin(rot),P=[];
  for(let i=0;i<n;i++){const a=i/n*TAU,u=Math.cos(a)*rx,v=Math.sin(a)*ry;P.push(poiPt(cx+u*cr-v*sr,cy+u*sr+v*cr));}
  if(w>0){const hw=w*.5*poiSc();
    for(let i=0;i<n;i++){const a=P[i],b=P[(i+1)%n];POI_SH.push([2,a[0],a[1],b[0],b[1],hw,0,C[0],C[1],C[2],C[3]]);}}
  else{const [X,Y]=poiPt(cx,cy);
    for(let i=0;i<n;i++){const a=P[i],b=P[(i+1)%n];POI_SH.push([5,X,Y,a[0],a[1],b[0],b[1],C[0],C[1],C[2],C[3],5]);}}
}

/* поле выпечки вокруг подножия, в долях высоты: полуширина и верх (что выше — живое или воздух) */
const POI_BOX={wreck:[2.1,1.1],temple:[1.15,1.05],elevator:[.25,1.02],crystals:[1.25,1.2],ring:[1.25,1.55],
  anomaly:[1,1.6],monolith:[.75,1.3],factory:[1.3,1.1],portal:[1.15,1.65],observ:[1.15,.9],obelisk:[.7,1.05],battery:[1.25,1.35]};
const POI_BK=new WeakMap();
/* клип выпечки по профилю грунта: начало в (x,y) мира, ниже линии земли плюс pad не рисуется;
   floor — не выше этой отметки: там, где грунт поднимается над подножием, тело стоит перед ним */
function groundClip(g,tr,x,y,hw,top,pad,floor){
  const i0=clamp(Math.floor((x-hw)/tr.step),0,tr.N-1),i1=clamp(Math.ceil((x+hw)/tr.step),0,tr.N-1),f=floor==null?-1e9:floor;
  g.beginPath();g.moveTo(i0*tr.step-x,-top-4);
  for(let i=i0;i<=i1;i++)g.lineTo(i*tr.step-x,Math.max(f,tr.h[i]-y+pad));
  g.lineTo(i1*tr.step-x,-top-4);g.closePath();g.clip();
}
/* один свет на тело постройки: сторона к звезде теплеет её цветом, обратная
   уходит в холодную тень неба, низ берёт отсвет грунта, у самой земли — темнее.
   Без этого корпус читается вырезкой из картона, серой на любом мире. */
function poiLight(g,q,hw,top,p,tr,X,Y){
  const s=SUN_DIR.x>=0?1:-1,e=Math.min(hw,q.h*.8),k=.35+.65*dayKq(p);
  const sr=starRGB().join(","),am=(typeof ambRGB==="function"?ambRGB(p):[40,50,70]).map(v=>v*.35|0).join(","),gc=p.T.pal[2].join(",");
  g.save();g.globalCompositeOperation="source-atop";
  let gr=g.createLinearGradient(e*s,0,-e*s,0);
  gr.addColorStop(0,"rgba("+sr+","+(.26*k).toFixed(3)+")");gr.addColorStop(.42,"rgba("+sr+",0)");
  gr.addColorStop(.52,"rgba("+am+",0)");gr.addColorStop(1,"rgba("+am+","+(.30+.25*k).toFixed(3)+")");
  g.fillStyle=gr;g.fillRect(-hw,-top,2*hw,top+16);
  /* отсвет и прижим — от линии земли под каждым столбцом (tr): на склоне подножие не одно */
  const b=Math.min(q.h*.4,90),foot=(x0,w,gy)=>{
    gr=g.createLinearGradient(0,gy+6,0,gy-b);
    gr.addColorStop(0,"rgba("+gc+",.38)");gr.addColorStop(1,"rgba("+gc+",0)");
    g.fillStyle=gr;g.fillRect(x0,gy-b,w,b+16);
    gr=g.createLinearGradient(0,gy+6,0,gy-14);
    gr.addColorStop(0,"rgba(0,0,0,.45)");gr.addColorStop(1,"rgba(0,0,0,0)");
    g.fillStyle=gr;g.fillRect(x0,gy-14,w,30);};
  if(tr)for(let x=-hw;x<hw;x+=2)foot(x,2,groundAt(tr,X+x+1)-Y);
  else foot(-hw,2*hw,0);
  g.restore();
}
function poiBake(q,tr,p,dark,lite){
  const key=p.seed+"|"+DPR+"|"+SCK+"|d"+dayKq(p)+"|a"+sunAzQ(p)+"|"+(tr.mat?1:0);
  const o=POI_BK.get(q);if(o&&o.key===key)return o;
  const bx=POI_BOX[q.k]||[2.1,1.7],hw=Math.ceil(q.h*bx[0]),top=Math.ceil(q.h*bx[1]),bot=16,w=hw*2,h=top+bot;
  const cn=mkCanvas(w,h);
  withCtx(cn,w,h,0,0,g=>{
    g.translate(hw,top);
    /* срез по грунту — тот же, что клип кадра: ниже линии грунта плюс 6 px постройки нет */
    groundClip(g,tr,q.x,q.y,hw,top,6);
    POI_SEED=q.seed;POI_MAT=tr.mat;POI_OX=q.x;POI_OY=q.y;
    const p0=POI_PH;POI_PH="base";
    try{poiShape(q,rng(q.seed),dark,lite,p.T.pal);}finally{POI_PH=p0;}
    poiLight(g,q,hw,top,p,tr,q.x,q.y);
  });
  const B={key,cn,cx:0,cy:(bot-top)/2,w,h};POI_BK.set(q,B);return B;
}
/* проход для стоящего на земле: на грунте — его собственный проход (SURF_P2), даже если
   на #c уже рисовали: gpuNext тогда снял бы #c в новый слой, и падающие тени со
   светом мира (21e2) не нашли бы своего прохода. Вне грунта — обычный gpuNext */
function standPass(){
  if(typeof SURF_P2!=="undefined"&&SURF_P2&&GPU.overPass===SURF_P2)return SURF_P2;
  return gpuNext();
}
/* выпечка неподвижного 2D-рисунка: тело, которое при данном свете не меняется,
   печётся раз на ключ; f рисует в ctx с началом в подножии, top — сколько над ним,
   bot — под ним. bakePut кладёт её в проход по матрице ctx (масштаб мира) */
const BK_AT=new Map();
function bakeAt(id,key,hw,top,bot,f){
  const o=BK_AT.get(id);if(o&&o.key===key)return o;
  const w=hw*2,h=top+bot,cn=mkCanvas(w,h);
  withCtx(cn,w,h,0,0,g=>{g.translate(hw,top);f(g);});
  const B={key,cn,w,h,cy:(bot-top)/2};BK_AT.set(id,B);return B;
}
function bakePut(pass,B,x,y,blend){
  const o=lifeHere(0,0),K=o.s;
  gpuImage(pass,B.cn,[{x:o.x+x*K,y:o.y+(y+B.cy)*K,w:B.w*K,h:B.h*K}],blend?{blend}:undefined);
}
/* мягкое пятно тени: радиальный спад, растянутый в эллипс — один холст на всю игру */
let POI_SHTEX=null;
function poiShadowTex(){
  if(POI_SHTEX)return POI_SHTEX;
  const cn=document.createElement("canvas");cn.width=cn.height=64;
  const g=cn.getContext("2d"),gr=g.createRadialGradient(32,32,0,32,32,32);
  gr.addColorStop(0,"rgba(0,0,0,1)");gr.addColorStop(1,"rgba(0,0,0,0)");
  g.fillStyle=gr;g.fillRect(0,0,64,64);
  return POI_SHTEX=cn;
}
/* то же место и тот же размах, что groundShadow (19-mode-landing), в пикселях кадра */
function poiShadowRect(x,y,rx,ry,al,o){
  const sx=SUN_DIR.x,sy=SUN_DIR.y,low=clamp(1-Math.abs(sy),0,1);
  const off=-sx*rx*(.35+low*1.6),kx=1+low*1.2,a=.32*(1-low*.40);
  const K=o.s;return {x:o.x+(x+off)*K,y:o.y+y*K,w:2*rx*kx*K,h:2*ry*K,a:a*al};
}
/* кадр построек на видеокарте; false — пусть рисует 2D */
function poiGpu(tr,camx,camy,p){
  if(typeof GPU==="undefined"||!GPU.ok||!GPU.on||!GPU.enc||typeof SUN_DIR!=="object")return false;
  const vis=[];
  for(const q of tr.poi){const x=q.x-camx;if(x<-q.h*1.6-200||x>W+q.h*1.6+200)continue;vis.push(q);}
  if(!vis.length)return true;
  const pass=standPass();if(!pass)return false;
  const o=lifeHere(0,0),K=o.s,pal=p.T.pal,[dark,lite]=poiTone(pal);   /* кадр — по матрице ctx (масштаб мира) */
  const sh=[];
  for(const q of vis){const rx=q.h*(q.k==="wreck"?1.1:(q.k==="ring"?.9:.55));
    sh.push(poiShadowRect(q.x-camx+rx*.12,q.y-camy+3,rx,Math.max(4,rx*.15),.55,o));}
  gpuImage(pass,poiShadowTex(),sh);
  const c0=ctx;
  for(const q of vis){
    const x=q.x-camx,y=q.y-camy,B=poiBake(q,tr,p,dark,lite);
    gpuImage(pass,B.cn,[{x:o.x+(x+B.cx)*K,y:o.y+(y+B.cy)*K,w:B.w*K,h:B.h*K}]);
    POI_SH.length=0;POI_NULL.m=[K,0,0,K,o.x+x*K,o.y+y*K];POI_NULL.st.length=0;
    POI_SEED=q.seed;POI_MAT=null;POI_PH="live";ctx=POI_NULL;
    try{poiShape(q,rng(q.seed),dark,lite,pal);}finally{ctx=c0;POI_PH="";}
    if(POI_SH.length)gpuShapes(pass,POI_SH,{blend:"over"});
  }
  return true;
}
