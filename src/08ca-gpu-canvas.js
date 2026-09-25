/* ══════════════ GPU-холст: 2D-контекст, что рисует видеокартой (docs/DESIGN-gpu.md, «GPU canvas») ══════════════
   Решение автора 25.09: 2D-холсты вырезаются — провал в 83–183 мс у отеля и флота был растром
   Skia в процессе видеокарты и выгрузкой каждого уровня мипов. Печка получает вместо
   getContext("2d") объект с тем же подмножеством CanvasRenderingContext2D (gpuBake): команды
   копятся, путь режется на треугольники, и всё рисуется одним проходом в текстуру с мипами.
   Ни Skia, ни copyExternalImageToTexture.
   Сглаживание — MSAA 4×, а малые выпечки ещё и вдвое крупнее (16 отсчётов на пиксель — как
   у растра Skia). Трафарет: бит 0x80 — клип, младшие семь — обмотка пути (заливка —
   nonzero/evenodd, штрих — «покрыто», чтобы полупрозрачный штрих не темнел на стыках).
   Чего холст не умеет — бросает «GPU-холст: нет …»: кадр ловит это как СБОЙ, тест краснеет. */
const GC_TOL=.2;   /* допуск ломаной на кривых, px выпечки с запасом */
/* смешения в премультиплицированном цвете; u — «неограниченные» (вне фигуры холст чистится) */
const GC_OPS={
  "source-over":{c:["one","one-minus-src-alpha"],a:["one","one-minus-src-alpha"]},
  "lighter":{c:["one","one"],a:["one","one"]},
  "destination-out":{c:["zero","one-minus-src-alpha"],a:["zero","one-minus-src-alpha"]},
  "source-atop":{c:["dst-alpha","one-minus-src-alpha"],a:["zero","one"]},
  "destination-over":{c:["one-minus-dst-alpha","one"],a:["one-minus-dst-alpha","one"]},
  "screen":{c:["one","one-minus-src"],a:["one","one-minus-src-alpha"]},
  /* multiply — два вызова (Cs·Cb + Cs(1−ab) + Cb(1−as) одним смешением не собрать): первый (mul1) даёт
     Cs·Cb + Cb(1−as) и оставляет альфу ab, второй (вот этот) добавляет Cs(1−ab) и as(1−ab) */
  "multiply":{c:["one-minus-dst-alpha","one"],a:["one-minus-dst-alpha","one"]},
  "destination-in":{c:["zero","src-alpha"],a:["zero","src-alpha"],u:1},
  "source-in":{c:["dst-alpha","zero"],a:["dst-alpha","zero"],u:1},
  "copy":{c:["one","zero"],a:["one","zero"],u:1}};
const GC_OPX={mul1:{c:["dst","one-minus-src-alpha"],a:["dst-alpha","one-minus-src-alpha"]}};   /* служебные смешения */
const GC_MISS=[];   /* что просили и чего нет — тесты и стенд читают, кадр падает */
function gcNo(what){GC_MISS.push(what);return new Error("GPU-холст: нет «"+what+"»");}

/* ── цвет CSS → [r,g,b,a] 0..1 без премультипликации; неразобранный — громко ── */
const GC_COL=new Map(),GC_NAMED={black:"#000",white:"#fff",red:"#f00",lime:"#0f0",green:"#008000",blue:"#00f",
  yellow:"#ff0",cyan:"#0ff",aqua:"#0ff",magenta:"#f0f",fuchsia:"#f0f",gray:"#808080",grey:"#808080",silver:"#c0c0c0",
  orange:"#ffa500",gold:"#ffd700",navy:"#000080",maroon:"#800000",purple:"#800080",teal:"#008080",olive:"#808000",
  pink:"#ffc0cb",brown:"#a52a2a",crimson:"#dc143c",coral:"#ff7f50",salmon:"#fa8072",tomato:"#ff6347",khaki:"#f0e68c",
  ivory:"#fffff0",beige:"#f5f5dc",wheat:"#f5deb3",tan:"#d2b48c",indigo:"#4b0082",violet:"#ee82ee",orchid:"#da70d6",
  plum:"#dda0dd",turquoise:"#40e0d0",skyblue:"#87ceeb",steelblue:"#4682b4",slategray:"#708090",darkgray:"#a9a9a9",
  lightgray:"#d3d3d3",dimgray:"#696969",darkred:"#8b0000",darkgreen:"#006400",darkblue:"#00008b",orangered:"#ff4500",
  goldenrod:"#daa520",chartreuse:"#7fff00",lightblue:"#add8e6"};
function gcColor(s){
  let c=GC_COL.get(s);if(c)return c;
  let t=String(s).trim().toLowerCase(),m;c=null;
  if(GC_NAMED[t])t=GC_NAMED[t];
  if(t==="transparent")c=[0,0,0,0];
  else if(t[0]==="#"){const h=t.slice(1),L=h.length;
    if(L===3||L===4)c=[...h].map(x=>parseInt(x+x,16)/255);
    else if(L===6||L===8)c=h.match(/../g).map(x=>parseInt(x,16)/255);
    if(c&&c.length===3)c.push(1);}
  else if((m=/^(rgba?|hsla?)\(([^)]*)\)$/.exec(t))){
    const p=m[2].split(/[\s,\/]+/).filter(Boolean),n=(v,k)=>v.endsWith("%")?parseFloat(v)/100*k:parseFloat(v);
    if(p.length>=3){const a=p.length>3?clamp(n(p[3],1),0,1):1;
      if(m[1][0]==="r")c=[n(p[0],255)/255,n(p[1],255)/255,n(p[2],255)/255,a].map(v=>clamp(v,0,1));
      else{const H=(((parseFloat(p[0])%360)+360)%360)/30,pc=v=>{const x=n(v,1);return clamp(v.endsWith("%")||x<=1?x:x/100,0,1);};
        const S=pc(p[1]),L=pc(p[2]),A=S*Math.min(L,1-L),f=q=>{const k=(q+H)%12;return L-A*Math.max(-1,Math.min(k-3,9-k,1));};
        c=[f(0),f(8),f(4),a];}}}
  if(!c||c.some(v=>!isFinite(v)))throw gcNo("цвет «"+s+"»");
  if(GC_COL.size>512)GC_COL.clear();
  GC_COL.set(s,c);return c;
}
function gcInv(m){const d=m[0]*m[3]-m[1]*m[2];if(!d||!isFinite(d))return null;
  return [m[3]/d,-m[1]/d,-m[2]/d,m[0]/d,(m[2]*m[5]-m[3]*m[4])/d,(m[1]*m[4]-m[0]*m[5])/d];}

/* градиент: координаты — в пространстве, что действует при заливке (как у 2D).
   Лента — по ключу точек в общем кэше GC_RAMPS: у гостиницы свой градиент на каждое окно, а точки
   почти одни (замер GPU-3: лента съедала ~27 % JS выпечки гостиницы); к ленте цепляется её half-float */
const GC_RAMPS=new Map();
class GcGrad{
  constructor(k,a){this.k=k;this.a=a;this.s=[];this._r=null;}
  addColorStop(o,c){if(!(o>=0&&o<=1))throw new RangeError("GPU-холст: точка градиента "+o);this.s.push([+o,gcColor(c)]);this._r=null;}
  ramp(){if(this._r)return this._r;
    const S=this.s.slice().sort((a,b)=>a[0]-b[0]),key=S.map(q=>q[0]+":"+q[1].join(",")).join(";");
    let r=GC_RAMPS.get(key);if(!r){if(GC_RAMPS.size>512)GC_RAMPS.clear();GC_RAMPS.set(key,r=GcGrad.band(S));}
    return this._r=r;}
  /* 256 точек ленты: смесь без премультипликации (так делает 2D в Chrome), потом премультипликация.
     Лента в half-float: восьмибитная теряла дробь между уровнями, и дизеру нечего было рассеивать */
  static band(S){const o=new Float32Array(1024);
    for(let i=0;i<256;i++){const t=i/255;let c;
      if(!S.length)c=[0,0,0,0];
      else if(t<=S[0][0])c=S[0][1];
      else if(t>=S[S.length-1][0])c=S[S.length-1][1];
      else{let j=0;while(S[j+1][0]<t)j++;const a=S[j],b=S[j+1],u=b[0]>a[0]?(t-a[0])/(b[0]-a[0]):1;
        c=a[1].map((v,q)=>v+(b[1][q]-v)*u);}
      const al=c[3];o[i*4]=c[0]*al;o[i*4+1]=c[1]*al;o[i*4+2]=c[2]*al;o[i*4+3]=al;}
    return o;}
}
const GC_DEF={fillStyle:"#000",strokeStyle:"#000",lineCap:"butt",lineJoin:"miter",globalCompositeOperation:"source-over",
  lineDashOffset:0,font:"10px sans-serif",textAlign:"start",textBaseline:"alphabetic",direction:"inherit",
  letterSpacing:"0px",wordSpacing:"0px",fontKerning:"auto",
  shadowBlur:0,shadowColor:"rgba(0,0,0,0)",shadowOffsetX:0,shadowOffsetY:0,filter:"none",
  imageSmoothingEnabled:true,imageSmoothingQuality:"low",_lw:1,_ga:1,_ml:10};
const GC_KEYS=Object.keys(GC_DEF);

/* ── сам холст: запись команд. Точки пути хранятся уже в пикселях выпечки (преобразование
   применяется при построении, как у 2D); штрих берёт толщину в преобразовании момента stroke ── */
class GcCtx{
  constructor(w,h,k){this.canvas={width:w,height:h};this._k=k;this._ops=[];this._sp=[];this._st=[];
    this._m=[1,0,0,1,0,0];this._dash=[];this._clip=[];Object.assign(this,GC_DEF);}
  get lineWidth(){return this._lw;} set lineWidth(v){if(v>0&&isFinite(v))this._lw=+v;}
  get globalAlpha(){return this._ga;} set globalAlpha(v){if(v>=0&&v<=1)this._ga=+v;}
  get miterLimit(){return this._ml;} set miterLimit(v){if(v>0&&isFinite(v))this._ml=+v;}
  save(){const s={};for(const k of GC_KEYS)s[k]=this[k];this._st.push([s,this._m.slice(),this._dash.slice(),this._clip]);}
  restore(){const s=this._st.pop();if(!s)return;Object.assign(this,s[0]);this._m=s[1];this._dash=s[2];this._clip=s[3];}
  reset(){this._st=[];this._sp=[];this._m=[1,0,0,1,0,0];this._dash=[];this._clip=[];Object.assign(this,GC_DEF);this.clearRect(0,0,this.canvas.width,this.canvas.height);}
  /* преобразование */
  setTransform(a,b,c,d,e,f){if(a&&typeof a==="object"){const M=a;this._m=[M.a??1,M.b??0,M.c??0,M.d??1,M.e??0,M.f??0];}
    else if(arguments.length===0)this._m=[1,0,0,1,0,0];
    else if([a,b,c,d,e,f].every(isFinite))this._m=[a,b,c,d,e,f];}
  resetTransform(){this._m=[1,0,0,1,0,0];}
  getTransform(){const m=this._m;return {a:m[0],b:m[1],c:m[2],d:m[3],e:m[4],f:m[5]};}   /* как DOMMatrix для setTransform(obj) и чтения */
  transform(a,b,c,d,e,f){if(![a,b,c,d,e,f].every(isFinite))return;const m=this._m;
    this._m=[m[0]*a+m[2]*b,m[1]*a+m[3]*b,m[0]*c+m[2]*d,m[1]*c+m[3]*d,m[0]*e+m[2]*f+m[4],m[1]*e+m[3]*f+m[5]];}
  translate(x,y){this.transform(1,0,0,1,x,y);}
  scale(x,y){this.transform(x,0,0,y,0,0);}
  rotate(a){const c=Math.cos(a),s=Math.sin(a);this.transform(c,s,-s,c,0,0);}
  _P(x,y){const m=this._m;return [m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]];}
  _sc(){const m=this._m;return Math.max(Math.hypot(m[0],m[1]),Math.hypot(m[2],m[3]));}
  _last(){const s=this._sp[this._sp.length-1];return s?[s.p[s.p.length-2],s.p[s.p.length-1]]:null;}
  _to(q){const s=this._sp[this._sp.length-1];if(s)s.p.push(q[0],q[1]);else this._sp.push({p:[q[0],q[1]],c:false});}
  /* доли параметра кривой из n кусков: плюс точка в ε от каждого конца. Стык и конец линии берут направление
     первого и последнего отрезка; без этих точек у мелкой дуги это хорда, а не касательная, — крюк 03a
     (lineTo и arc назад) давал поворот 157° вместо 180°, острие в пределах miterLimit и шип наружу там,
     где 2D кладёт срез. Точки лежат на самой кривой: заливке всё равно */
  _ts(n){const e=Math.min(1e-3,.25/n),t=[0,e];for(let i=1;i<n;i++)t.push(i/n);t.push(1-e,1);return t;}
  /* путь */
  beginPath(){this._sp=[];}
  moveTo(x,y){if(isFinite(x)&&isFinite(y))this._sp.push({p:this._P(x,y),c:false});}
  lineTo(x,y){if(isFinite(x)&&isFinite(y))this._to(this._P(x,y));}
  closePath(){const s=this._sp[this._sp.length-1];if(!s)return;s.c=true;this._sp.push({p:[s.p[0],s.p[1]],c:false});}
  rect(x,y,w,h){if(![x,y,w,h].every(isFinite))return;
    this._sp.push({p:[...this._P(x,y),...this._P(x+w,y),...this._P(x+w,y+h),...this._P(x,y+h)],c:true});this.moveTo(x,y);}
  roundRect(x,y,w,h,r){if(![x,y,w,h].every(isFinite))return;
    let R=Array.isArray(r)?r:[r==null?0:r];
    if(R.length<1||R.length>4)throw new RangeError("GPU-холст: roundRect радиусов "+R.length);
    R=R.map(v=>typeof v==="object"?[v.x||0,v.y||0]:[+v,+v]);
    if(R.some(v=>v[0]<0||v[1]<0))throw new RangeError("GPU-холст: roundRect радиус < 0");
    let [tl,tr,br,bl]=R.length===1?[R[0],R[0],R[0],R[0]]:R.length===2?[R[0],R[1],R[0],R[1]]:R.length===3?[R[0],R[1],R[2],R[1]]:R;
    if(w<0){x+=w;w=-w;[tl,tr]=[tr,tl];[bl,br]=[br,bl];}
    if(h<0){y+=h;h=-h;[tl,bl]=[bl,tl];[tr,br]=[br,tr];}
    const f=Math.min(1,w/(tl[0]+tr[0]||1),w/(bl[0]+br[0]||1),h/(tl[1]+bl[1]||1),h/(tr[1]+br[1]||1)),P=Math.PI;
    [tl,tr,br,bl]=[tl,tr,br,bl].map(v=>[v[0]*f,v[1]*f]);
    this.moveTo(x+tl[0],y);
    this.ellipse(x+w-tr[0],y+tr[1],tr[0],tr[1],0,-P/2,0);
    this.ellipse(x+w-br[0],y+h-br[1],br[0],br[1],0,0,P/2);
    this.ellipse(x+bl[0],y+h-bl[1],bl[0],bl[1],0,P/2,P);
    this.ellipse(x+tl[0],y+tl[1],tl[0],tl[1],0,P,P*1.5);
    this.closePath();this.moveTo(x,y);}
  arc(x,y,r,a0,a1,ccw){this.ellipse(x,y,r,r,0,a0,a1,ccw);}
  ellipse(x,y,rx,ry,rot,a0,a1,ccw){
    if(![x,y,rx,ry,rot,a0,a1].every(isFinite))return;
    if(rx<0||ry<0)throw new RangeError("GPU-холст: радиус < 0");
    const T=2*Math.PI;let sw;
    if(!ccw&&a1-a0>=T)sw=T;else if(ccw&&a0-a1>=T)sw=-T;
    else{sw=(a1-a0)%T;if(!ccw&&sw<0)sw+=T;if(ccw&&sw>0)sw-=T;}
    const rd=Math.max(rx,ry)*this._sc()*this._k,st=rd>GC_TOL?2*Math.acos(1-GC_TOL/rd):T/4;
    const n=Math.min(1024,Math.max(2,Math.ceil(Math.abs(sw)/st))),cr=Math.cos(rot),sr=Math.sin(rot);
    for(const f of this._ts(n)){const t=a0+sw*f,u=Math.cos(t)*rx,v=Math.sin(t)*ry,q=this._P(x+u*cr-v*sr,y+u*sr+v*cr);
      if(!f&&!this._sp.length)this._sp.push({p:q,c:false});else this._to(q);}}
  arcTo(x1,y1,x2,y2,r){
    if(![x1,y1,x2,y2,r].every(isFinite))return;if(r<0)throw new RangeError("GPU-холст: arcTo r < 0");
    const L=this._last(),iv=gcInv(this._m);if(!L){this.moveTo(x1,y1);return;}
    if(!iv){this.lineTo(x1,y1);return;}
    const x0=iv[0]*L[0]+iv[2]*L[1]+iv[4],y0=iv[1]*L[0]+iv[3]*L[1]+iv[5];
    const ax=x0-x1,ay=y0-y1,bx=x2-x1,by=y2-y1,la=Math.hypot(ax,ay),lb=Math.hypot(bx,by),cr=ax*by-ay*bx;
    if(!r||la<1e-9||lb<1e-9||Math.abs(cr)<1e-9*la*lb){this.lineTo(x1,y1);return;}
    const ux=ax/la,uy=ay/la,vx=bx/lb,vy=by/lb,th=Math.acos(clamp(ux*vx+uy*vy,-1,1)),dd=r/Math.tan(th/2);
    const hx=ux+vx,hy=uy+vy,hl=Math.hypot(hx,hy),cd=r/Math.sin(th/2),cx=x1+hx/hl*cd,cy=y1+hy/hl*cd;
    const t1x=x1+ux*dd,t1y=y1+uy*dd,t2x=x1+vx*dd,t2y=y1+vy*dd;
    this.lineTo(t1x,t1y);this.ellipse(cx,cy,r,r,0,Math.atan2(t1y-cy,t1x-cx),Math.atan2(t2y-cy,t2x-cx),cr>0);}
  quadraticCurveTo(cx,cy,x,y){
    if(![cx,cy,x,y].every(isFinite))return;if(!this._sp.length)this.moveTo(cx,cy);
    const a=this._last(),b=this._P(cx,cy),c=this._P(x,y),k=this._k;
    const M=Math.hypot(a[0]-2*b[0]+c[0],a[1]-2*b[1]+c[1])*k,n=Math.min(256,Math.max(1,Math.ceil(Math.sqrt(.25*M/GC_TOL))));
    for(const t of this._ts(n)){if(!t)continue;const s=1-t;this._to([s*s*a[0]+2*s*t*b[0]+t*t*c[0],s*s*a[1]+2*s*t*b[1]+t*t*c[1]]);}}
  bezierCurveTo(ax,ay,bx,by,x,y){
    if(![ax,ay,bx,by,x,y].every(isFinite))return;if(!this._sp.length)this.moveTo(ax,ay);
    const p=this._last(),a=this._P(ax,ay),b=this._P(bx,by),c=this._P(x,y),k=this._k;
    const M=Math.max(Math.hypot(p[0]-2*a[0]+b[0],p[1]-2*a[1]+b[1]),Math.hypot(a[0]-2*b[0]+c[0],a[1]-2*b[1]+c[1]))*k;
    const n=Math.min(256,Math.max(1,Math.ceil(Math.sqrt(.75*M/GC_TOL))));
    for(const t of this._ts(n)){if(!t)continue;const s=1-t,A=s*s*s,B=3*s*s*t,C=3*s*t*t,D=t*t*t;
      this._to([A*p[0]+B*a[0]+C*b[0]+D*c[0],A*p[1]+B*a[1]+C*b[1]+D*c[1]]);}}
  /* штрих-пунктир */
  setLineDash(a){if(!Array.isArray(a)||a.some(v=>!(v>=0)||!isFinite(v)))return;this._dash=a.length%2?a.concat(a):a.slice();}
  getLineDash(){return this._dash.slice();}
  /* рисование */
  fill(a,b){if(a&&typeof a==="object")throw gcNo("fill(Path2D)");this._fill(this._sp,a==="evenodd",this.fillStyle,this.globalCompositeOperation,1);}
  stroke(a){if(a)throw gcNo("stroke(Path2D)");this._stroke(this._sp);}
  clip(a,b){if(a&&typeof a==="object")throw gcNo("clip(Path2D)");this._clip=this._clip.concat([{v:gcFan(this._sp,this._k),eo:a==="evenodd"}]);}
  fillRect(x,y,w,h){if([x,y,w,h].every(isFinite)&&w&&h)this._fill(gcRectSp(this,x,y,w,h),false,this.fillStyle,this.globalCompositeOperation,1);}
  strokeRect(x,y,w,h){if([x,y,w,h].every(isFinite)&&(w||h))this._stroke(gcRectSp(this,x,y,w,h));}
  /* clearRect — вычитание непрозрачным: globalAlpha и смешение не действуют, клип — да */
  clearRect(x,y,w,h){if([x,y,w,h].every(isFinite)&&w&&h)this._fill(gcRectSp(this,x,y,w,h),false,"#000","destination-out",-1);}
  drawImage(img,a,b,c,d,e,f,g,h){
    this._chk(this.globalCompositeOperation);
    const T=gcImg(img),n=arguments.length;let sx=0,sy=0,sw=T.w,sh=T.h,dx,dy,dw,dh;
    if(n===3){dx=a;dy=b;dw=T.w;dh=T.h;}else if(n===5){dx=a;dy=b;dw=c;dh=d;}
    else if(n===9){sx=a;sy=b;sw=c;sh=d;dx=e;dy=f;dw=g;dh=h;}else throw new TypeError("GPU-холст: drawImage с "+n+" аргументами");
    if(![sx,sy,sw,sh,dx,dy,dw,dh].every(isFinite)||!sw||!sh||!dw||!dh)return;
    const k=this._k,C=[[dx,dy,sx,sy],[dx+dw,dy,sx+sw,sy],[dx+dw,dy+dh,sx+sw,sy+sh],[dx,dy+dh,sx,sy+sh]],v=[];
    for(const i of [0,1,2,0,2,3]){const q=this._P(C[i][0],C[i][1]);v.push(q[0]*k,q[1]*k,C[i][2]/T.w,C[i][3]/T.h);}
    this._ops.push({t:"i",v,view:T.view,near:!this.imageSmoothingEnabled,a:this._ga,op:this.globalCompositeOperation,clip:this._clip,sh:this._sh(this.globalCompositeOperation)});}
  /* fillText/strokeText/measureText — в 08cb (атлас масок) */
  createLinearGradient(x0,y0,x1,y1){return new GcGrad(1,[x0,y0,x1,y1]);}
  createRadialGradient(x0,y0,r0,x1,y1,r1){if(r0<0||r1<0)throw new RangeError("GPU-холст: радиус градиента < 0");return new GcGrad(2,[x0,y0,r0,x1,y1,r1]);}
  _chk(op){
    if(!GC_OPS[op])throw gcNo("globalCompositeOperation "+op);
    if(this.filter&&this.filter!=="none")throw gcNo("filter "+this.filter);}
  /* краска: сплошная — премультиплицированный цвет; градиент — обратная матрица (px выпечки ×k → пространство градиента) */
  _paint(style,amul){
    const al=amul<0?1:this._ga*amul;
    if(typeof style==="string"){const c=gcColor(style),a=c[3]*al;return {k:0,c:[c[0]*a,c[1]*a,c[2]*a,a]};}
    if(style instanceof GcGrad){const k=this._k,m=this._m,iv=gcInv([m[0]*k,m[1]*k,m[2]*k,m[3]*k,m[4]*k,m[5]*k]);
      return iv?{k:style.k,g:style,ramp:style.ramp(),a:al,iv}:null;}
    throw gcNo("краска "+(style&&style.constructor&&style.constructor.name||typeof style));}
  _fill(sp,eo,style,op,amul){
    if(amul>=0)this._chk(op);const v=gcFan(sp,this._k),p=this._paint(style,amul);
    if(v.length&&p)this._ops.push({t:"f",v,eo,p,op,clip:this._clip,sh:amul>=0?this._sh(op):null});}
  _stroke(sp){
    const op=this.globalCompositeOperation;this._chk(op);
    const m=this._m,iv=gcInv(m);if(!iv)return;
    /* тоньше пикселя — как «волосок» Skia: ширина в пиксель, прозрачность по толщине */
    const dw=this._lw*Math.sqrt(Math.abs(m[0]*m[3]-m[1]*m[2]));let hw=this._lw/2,am=1;
    if(dw<1){hw/=dw;am=dw;}
    const p=this._paint(this.strokeStyle,am);if(!p)return;
    const U=[];
    for(const s of sp){const q=[];
      for(let i=0;i<s.p.length;i+=2){const x=iv[0]*s.p[i]+iv[2]*s.p[i+1]+iv[4],y=iv[1]*s.p[i]+iv[3]*s.p[i+1]+iv[5],L=q[q.length-1];
        if(!L||Math.hypot(x-L[0],y-L[1])>1e-6)q.push([x,y]);}
      if(s.p.length<4)continue;
      let cl=s.c;if(cl&&q.length>1){const a=q[0],b=q[q.length-1];if(Math.hypot(a[0]-b[0],a[1]-b[1])<=1e-6)q.pop();}
      const pieces=this._dash.length?gcDash(q,cl,this._dash,this.lineDashOffset):[[q,cl]];
      for(const [pl,c] of pieces)gcStrokeLine(U,pl,c,hw,this,dw);}
    if(!U.length)return;
    const k=this._k,v=new Array(U.length);
    for(let i=0;i<U.length;i+=2){v[i]=(m[0]*U[i]+m[2]*U[i+1]+m[4])*k;v[i+1]=(m[1]*U[i]+m[3]*U[i+1]+m[5])*k;}
    this._ops.push({t:"s",v,p,op,clip:this._clip,sh:this._sh(op)});}
}
/* чего нет на видеокарте — громко (чтение пикселей, узоры, конический градиент, попадание в путь) */
for(const k of ["getImageData","putImageData","createImageData","createPattern","createConicGradient","isPointInPath","isPointInStroke","drawFocusIfNeeded"])
  GcCtx.prototype[k]=function(){throw gcNo(k);};
function gcRectSp(g,x,y,w,h){return [{p:[...g._P(x,y),...g._P(x+w,y),...g._P(x+w,y+h),...g._P(x,y+h)],c:true}];}
/* заливка — веер от первой точки подпути; трафарет считает обмотку, так что вогнутость и дыры честные */
function gcFan(sp,k){const v=[];
  for(const s of sp){const p=s.p;if(p.length<6)continue;
    for(let i=2;i+3<p.length;i+=2)v.push(p[0]*k,p[1]*k,p[i]*k,p[i+1]*k,p[i+2]*k,p[i+3]*k);}
  return v;}
function gcDash(q,cl,D,off){
  const L=D.reduce((a,b)=>a+b,0);if(!(L>0))return [[q,cl]];
  const pts=cl?q.concat([q[0]]):q,out=[];let pos=((off%L)+L)%L,i=0;
  while(pos>=D[i]){pos-=D[i];i=(i+1)%D.length;}
  let rem=D[i]-pos,on=i%2===0,cur=on?[pts[0]]:null;
  for(let j=0;j+1<pts.length;j++){const a=pts[j],b=pts[j+1],len=Math.hypot(b[0]-a[0],b[1]-a[1]);let t=0;
    while(len-t>rem){t+=rem;const pt=[a[0]+(b[0]-a[0])*t/len,a[1]+(b[1]-a[1])*t/len];
      if(on){cur.push(pt);out.push([cur,false]);cur=null;}else cur=[pt];
      on=!on;i=(i+1)%D.length;rem=D[i];}
    rem-=len-t;if(on)cur.push(b);}
  if(on&&cur&&cur.length>1)out.push([cur,false]);
  return out;}
/* штрих ломаной в пространстве пользователя: отрезки, стыки на внешней стороне, концы */
function gcStrokeLine(U,q,cl,hw,g,dw){
  const T=(a,b,c)=>U.push(a[0],a[1],b[0],b[1],c[0],c[1]),n=q.length,cap=g.lineCap,join=g.lineJoin;
  const hd=hw*(dw>=1?dw/g._lw:1/hw*.5)*g._k,rs=hd>GC_TOL?Math.acos(1-GC_TOL/hd):Math.PI/2;
  const fan=(c,a0,a1)=>{const m=Math.max(1,Math.ceil(Math.abs(a1-a0)/(2*rs)));let pr=[c[0]+Math.cos(a0)*hw,c[1]+Math.sin(a0)*hw];
    for(let i=1;i<=m;i++){const t=a0+(a1-a0)*i/m,p=[c[0]+Math.cos(t)*hw,c[1]+Math.sin(t)*hw];T(c,pr,p);pr=p;}};
  if(n===1){if(cap==="round")fan(q[0],0,2*Math.PI);
    else if(cap==="square"){const [x,y]=q[0];T([x-hw,y-hw],[x+hw,y-hw],[x+hw,y+hw]);T([x-hw,y-hw],[x+hw,y+hw],[x-hw,y+hw]);}
    return;}
  const seg=cl?n:n-1,dir=i=>{const a=q[i],b=q[(i+1)%n],l=Math.hypot(b[0]-a[0],b[1]-a[1]);return [(b[0]-a[0])/l,(b[1]-a[1])/l];};
  for(let i=0;i<seg;i++){const a=q[i],b=q[(i+1)%n],d=dir(i),nx=-d[1]*hw,ny=d[0]*hw;
    T([a[0]+nx,a[1]+ny],[b[0]+nx,b[1]+ny],[b[0]-nx,b[1]-ny]);T([a[0]+nx,a[1]+ny],[b[0]-nx,b[1]-ny],[a[0]-nx,a[1]-ny]);}
  for(let j=cl?0:1;j<(cl?n:n-1);j++){const P=q[j],d0=dir((j-1+n)%n),d1=dir(j),cr=d0[0]*d1[1]-d0[1]*d1[0],dt=d0[0]*d1[0]+d0[1]*d1[1];
    if(Math.abs(cr)<1e-9&&dt>0)continue;
    const s=cr>0?-1:1,o0=[-d0[1]*hw*s,d0[0]*hw*s],o1=[-d1[1]*hw*s,d1[0]*hw*s],A=[P[0]+o0[0],P[1]+o0[1]],B=[P[0]+o1[0],P[1]+o1[1]];
    if(join==="round"){const a0=Math.atan2(o0[1],o0[0]);let da=Math.atan2(o1[1],o1[0])-a0;
      while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;fan(P,a0,a0+da);continue;}
    const ml=1/Math.sqrt(Math.max(1e-12,(1+dt)/2));
    if(join==="miter"&&ml<=g._ml){const mx=o0[0]+o1[0],my=o0[1]+o1[1],l=Math.hypot(mx,my)||1,M=[P[0]+mx/l*hw*ml,P[1]+my/l*hw*ml];T(P,A,M);T(P,M,B);}
    else T(P,A,B);}
  if(cl||cap==="butt")return;
  for(const [P,d] of [[q[0],dir(0).map(v=>-v)],[q[n-1],dir(n-2)]]){
    if(cap==="round"){const a=Math.atan2(d[1],d[0]);fan(P,a-Math.PI/2,a+Math.PI/2);}
    else{const nx=-d[1]*hw,ny=d[0]*hw,ex=d[0]*hw,ey=d[1]*hw;
      T([P[0]+nx,P[1]+ny],[P[0]+nx+ex,P[1]+ny+ey],[P[0]-nx+ex,P[1]-ny+ey]);T([P[0]+nx,P[1]+ny],[P[0]-nx+ex,P[1]-ny+ey],[P[0]-nx,P[1]-ny]);}}
}
/* источник картинки: выпечка GPU-холста; 2D-холст — только переходно (грузится, ворота это видят) */
function gcImg(img){
  if(img&&img.draw&&img.o){gpuBakeLive(img);return {view:img.view,w:img.w,h:img.h};}
  if(img instanceof GcCtx)throw gcNo("drawImage(незапечённый GPU-холст)");
  if(img&&img.width&&img.height&&typeof img.getContext==="function"){const t=gpuCanvasTex(img);return {view:t.view,w:img.width,h:img.height};}
  throw gcNo("drawImage("+(img&&img.constructor&&img.constructor.name||typeof img)+")");}

/* ── видеокарта: один модуль, явная раскладка, конвейеры по (режим трафарета | смешение) ── */
const GC_WGSL=`
struct GU{sz:vec4f,o:vec4f};   /* o.xy — угол цели в px выпечки (слой тени — цель размером со свою рамку) */
@group(0) @binding(0) var<uniform> gu:GU;
@group(0) @binding(1) var<storage,read> gp:array<vec4f>;
@group(0) @binding(2) var ramp:texture_2d<f32>;
@group(0) @binding(3) var rsm:sampler;
@group(0) @binding(4) var img:texture_2d<f32>;
@group(0) @binding(5) var ism:sampler;
struct VO{@builtin(position) p:vec4f,@location(0) @interpolate(flat) k:u32,@location(1) uv:vec2f};
@vertex fn vs(@location(0) a:vec2f,@location(1) k:f32,@location(2) uv:vec2f)->VO{
  let b=a-gu.o.xy;var o:VO;o.p=vec4f(b.x/gu.sz.x*2.-1.,1.-b.y/gu.sz.y*2.,0.,1.);o.k=u32(k+.5);o.uv=uv;return o;}
@fragment fn fnone()->@location(0) vec4f{return vec4f(0.);}
fn bayer8(p:vec2f)->f32{let x=u32(p.x)&7u;let y=u32(p.y)&7u;let v=x^y;
  let b=((v&1u)<<5u)|((y&1u)<<4u)|((v&2u)<<2u)|((y&2u)<<1u)|((v&4u)>>1u)|((y&4u)>>2u);return (f32(b)+.5)/64.;}
@fragment fn fimg(i:VO)->@location(0) vec4f{return textureSample(img,ism,i.uv)*gp[i.k*5u].w;}
fn paintOf(k:u32,d:vec2f)->vec4f{
  let b=k*5u;let q=gp[b+1u];
  if(q.x<.5){return gp[b];}
  let m=gp[b+2u];let n=gp[b+3u];let g=gp[b+4u];
  let u=vec2f(m.x*d.x+m.z*d.y+n.x,m.y*d.x+m.w*d.y+n.y);
  var t=0.;
  if(q.x<1.5){let e=g.xy-n.zw;t=dot(u-n.zw,e)/max(dot(e,e),1e-12);}
  else{let cd=g.yz-n.zw;let pd=u-n.zw;let r0=g.x;let dr=g.w-g.x;
    let A=dot(cd,cd)-dr*dr;let B=dot(pd,cd)+r0*dr;let C=dot(pd,pd)-r0*r0;
    if(abs(A)<1e-6){if(abs(B)<1e-9){return vec4f(0.);}t=C/(2.*B);if(r0+t*dr<0.){return vec4f(0.);}}
    else{let D=B*B-A*C;if(D<0.){return vec4f(0.);}let s=sqrt(D);let w1=(B+s)/A;let w2=(B-s)/A;
      let hi=max(w1,w2);let lo=min(w1,w2);
      if(r0+hi*dr>=0.){t=hi;}else if(r0+lo*dr>=0.){t=lo;}else{return vec4f(0.);}}}
  t=clamp(t,0.,1.);
  /* дизер Байера ±⅜ ступени: столько же смешанных соседей, сколько у градиента 2D (Skia), 0,38;
     тёмное свечение без полос; ровный уровень не трогает */
  let c=textureSampleLevel(ramp,rsm,vec2f((t*255.+.5)/256.,q.y),0.)*q.z;let dd=(bayer8(d)-.5)*.75/255.;
  let a=clamp(c.a+dd,0.,1.);return vec4f(clamp(c.rgb+vec3f(dd),vec3f(0.),vec3f(a)),a);}
@fragment fn fpaint(i:VO)->@location(0) vec4f{return paintOf(i.k,i.p.xy+gu.o.xy);}
/* текст: маска из атласа × краска (цвет или градиент) */
/* тень: размытый слой — рамка атласа (r8): угол на холсте gp[b+2].xy, размер .zw, место в атласе gp[b+3].xy */
@fragment fn fshadow(i:VO)->@location(0) vec4f{let b=i.k*5u;let o=gp[b+2u];let q=vec2i(floor(i.p.xy-o.xy));
  if(any(q<vec2i(0))||any(q>=vec2i(o.zw))){return vec4f(0.);}return gp[b]*textureLoad(img,q+vec2i(gp[b+3u].xy),0).r;}
@fragment fn fmask(i:VO)->@location(0) vec4f{let m=textureSample(img,ism,i.uv).r;return paintOf(i.k,i.p.xy+gu.o.xy)*m;}`;
const GC_MIP_WGSL=`
@group(0) @binding(0) var s:texture_2d<f32>;
@group(0) @binding(1) var sm:sampler;
@group(0) @binding(2) var<uniform> sc:vec4f;   /* доля источника: цель из пула бывает больше выпечки */
struct O{@builtin(position) p:vec4f,@location(0) uv:vec2f};
@vertex fn vs(@builtin(vertex_index) i:u32)->O{var P=array(vec2f(-1.,-1.),vec2f(3.,-1.),vec2f(-1.,3.));
  var o:O;o.p=vec4f(P[i],0.,1.);o.uv=vec2f(P[i].x*.5+.5,.5-P[i].y*.5);return o;}
@fragment fn fs(i:O)->@location(0) vec4f{return textureSampleLevel(s,sm,i.uv*sc.xy,0.);}`;
/* трафарет: f — лицевая грань, b — изнаночная (обмотка nonzero), rm/wm — маски, c — пишет ли цвет */
const GC_ST={
  wnz:{f:{compare:"equal",passOp:"increment-wrap"},b:{compare:"equal",passOp:"decrement-wrap"},rm:0x80,wm:0x7F},
  weo:{f:{compare:"equal",passOp:"invert"},rm:0x80,wm:0x7F},
  wst:{f:{compare:"equal",passOp:"replace"},rm:0x80,wm:0x7F},
  clp:{f:{compare:"not-equal",passOp:"replace",failOp:"zero"},rm:0x7F,wm:0xFF},
  crs:{f:{compare:"always",passOp:"replace"},rm:0xFF,wm:0xFF},
  out:{f:{compare:"equal"},rm:0xFF,wm:0,c:"none"},
  cov:{f:{compare:"not-equal",passOp:"zero"},rm:0x7F,wm:0x7F,c:"paint"},
  cvk:{f:{compare:"not-equal"},rm:0x7F,wm:0,c:"paint"},
  img:{f:{compare:"equal"},rm:0x80,wm:0,c:"img"},
  imc:{f:{compare:"not-equal",passOp:"zero"},rm:0x7F,wm:0x7F,c:"img"},
  msk:{f:{compare:"equal"},rm:0x80,wm:0,c:"mask"},
  mkc:{f:{compare:"not-equal",passOp:"zero"},rm:0x7F,wm:0x7F,c:"mask"},
  shw:{f:{compare:"equal"},rm:0x80,wm:0,c:"shadow"}};
function gcLay(){
  let L=GPU.lay["gc.L"];if(L)return L;
  const d=GPU.dev,F=GPUShaderStage.FRAGMENT|GPUShaderStage.VERTEX,U=GPUTextureUsage;
  const bgl=d.createBindGroupLayout({entries:[{binding:0,visibility:F,buffer:{type:"uniform"}},{binding:1,visibility:F,buffer:{type:"read-only-storage"}},
    {binding:2,visibility:F,texture:{sampleType:"float"}},{binding:3,visibility:F,sampler:{type:"filtering"}},
    {binding:4,visibility:F,texture:{sampleType:"float"}},{binding:5,visibility:F,sampler:{type:"filtering"}}]});
  const dm=d.createTexture({size:[1,1],format:"rgba8unorm",usage:U.TEXTURE_BINDING|U.COPY_DST});
  return GPU.lay["gc.L"]={bgl,pl:d.createPipelineLayout({bindGroupLayouts:[bgl]}),mod:gpuShader(GC_WGSL),dm:dm.createView(),
    near:d.createSampler({magFilter:"nearest",minFilter:"nearest"})};
}
function gcPipe(key){
  const c=GPU.lay["gc."+key];if(c)return c;
  return GPU.lay["gc."+key]=gpuPipeline("gc:"+key,()=>gcPipeDesc(key));
}
function gcPipeDesc(key){
  const [md,op]=key.split("|"),S=GC_ST[md],L=gcLay(),G=GC_OPS[op]||GC_OPX[op];
  const blend=G?{color:{srcFactor:G.c[0],dstFactor:G.c[1]},alpha:{srcFactor:G.a[0],dstFactor:G.a[1]}}:undefined;
  return {layout:L.pl,
    vertex:{module:L.mod,entryPoint:"vs",buffers:[{arrayStride:20,attributes:[{shaderLocation:0,offset:0,format:"float32x2"},
      {shaderLocation:1,offset:8,format:"float32"},{shaderLocation:2,offset:12,format:"float32x2"}]}]},
    fragment:{module:L.mod,entryPoint:S.c==="img"?"fimg":S.c==="mask"?"fmask":S.c==="shadow"?"fshadow":S.c==="paint"?"fpaint":"fnone",targets:[{format:"rgba8unorm",blend,writeMask:S.c?15:0}]},
    primitive:{topology:"triangle-list"},
    depthStencil:{format:"stencil8",depthWriteEnabled:false,depthCompare:"always",stencilFront:S.f,stencilBack:S.b||S.f,stencilReadMask:S.rm,stencilWriteMask:S.wm},
    multisample:{count:4}};
}
function gcMipPipe(){return GPU.lay["gc.mip"]||(GPU.lay["gc.mip"]=gpuPipeline("gc.mip",gcMipDesc));}
function gcMipDesc(){const m=gpuShader(GC_MIP_WGSL);return {layout:"auto",vertex:{module:m,entryPoint:"vs"},
  fragment:{module:m,entryPoint:"fs",targets:[{format:"rgba8unorm"}]},primitive:{topology:"triangle-list"}};}

/* ── пул целей выпечки. Создать текстуру в процессе GPU стоит ~1.5 мс (замер 25.09: 36 слоёв r8 —
   45–70 мс ожидания очереди, те же проходы в одну текстуру — 1 мс), а выпечка просила их ~40.
   Набор целей одного размера (MSAA, трафарет, resolve; атласы тени; лента) берётся из пула: годится
   любой не меньше нужного и не больше 2.25 его площади (мелочи до 256² — любой до 256²), новый — с запасом
   до 64 px. Буферы — по роли, растут степенью двойки. Пул живёт в GPU.lay и сбрасывается с устройством;
   gpuInit (за экраном загрузки и после потери устройства) прогревает его ходовыми размерами (GC_POOL_WARM, ~30 МБ): первая встреча с
   крупной выпечкой создаёт одну текстуру — её саму. Повтор безопасен порядком очереди: запись
   следующей выпечки встаёт после чтения прошлой ── */
/* великан 1024² (выпечки гостиницы 500×340 и её свечения при ss 2 — 1024×704) живёт в пуле с загрузки: холодный S23
   на 49f75cf (26.09) — подлёт к гостинице создал 6 разовых наборов 1024² разом (~120 МБ с обнулением), кадр 67 мс.
   Прогрев с ним ~54 МБ; разовым остаётся только набор больше половины потолка. Тень 512×128 — полоса
   неона и щита (448×64 рождалась посреди полёта, холодный S23 cold3) */
const GC_POOL_CAP=80<<20;
const GC_POOL_WARM=[["bake",256,256],["bake",512,512],["bake",768,768],["bake",1024,1024],["shadow",256,256],["shadow",512,128],["shadow",512,512],["ramp",256,128]];
/* наборы: [формат, выборок, usage] — все одного размера */
function gcPoolSpec(role){
  const U=GPUTextureUsage,RA=U.RENDER_ATTACHMENT,TB=U.TEXTURE_BINDING;
  return role==="bake"?[["rgba8unorm",4,RA],["stencil8",4,RA],["rgba8unorm",1,TB|RA]]
    :role==="shadow"?[["rgba8unorm",4,RA],["stencil8",4,RA],["rgba8unorm",1,TB|RA],["r8unorm",1,TB|RA],["r8unorm",1,TB|RA]]
    :[["rgba16float",1,TB|U.COPY_DST]];}
function gcPool(){
  let Q=GPU.lay["gc.pool"];if(Q)return Q;
  Q=GPU.lay["gc.pool"]={t:[],b:{},by:0,peak:0,made:0};
  for(const [r,w,h] of GC_POOL_WARM)gcPoolSet(r,w,h);
  /* обнулить прогретое здесь же: WebGPU чистит память текстуры при первом касании — пусть оно будет за заставкой */
  const e=GPU.dev.createCommandEncoder();
  for(const x of Q.t)if(x.role!=="ramp"){const [ms,st,rs]=x.T;e.beginRenderPass({colorAttachments:[{view:ms.createView(),resolveTarget:rs.createView(),
    loadOp:"clear",storeOp:"discard",clearValue:[0,0,0,0]}],depthStencilAttachment:{view:st.createView(),stencilLoadOp:"clear",stencilStoreOp:"discard"}}).end();}
  GPU.dev.queue.submit([e.finish()]);
  return Q;}
/* → текстуры набора role размером w×h или больше */
function gcPoolSet(role,w,h){
  const Q=gcPool(),need=Math.max((w*h+4096)*2.25,65536);let e=null;
  for(const x of Q.t)if(x.role===role&&x.w>=w&&x.h>=h&&x.w*x.h<=need&&(!e||x.w*x.h<e.w*e.h))e=x;
  if(e){Q.t.splice(Q.t.indexOf(e),1);Q.t.push(e);return e.T;}
  const W=Math.ceil(w/64)*64,H=Math.ceil(h/64)*64,px={rgba16float:8,r8unorm:1,stencil8:1};let by=0;
  const T=gcPoolSpec(role).map(([f,n,us])=>{by+=W*H*n*(px[f]||4);Q.made++;return GPU.dev.createTexture({size:[W,H],sampleCount:n,format:f,usage:us});});
  if(by>GC_POOL_CAP/2||GC_ONCE){GPU.trash.push(...T);return T;}   /* больше полупотолка или выпечка once — разовый, в пул не идёт */
  Q.t.push({role,w:W,h:H,T,by});Q.by+=by;Q.peak=Math.max(Q.peak,Q.by);
  while(Q.by>GC_POOL_CAP&&Q.t.length>1){const o=Q.t.shift();Q.by-=o.by;GPU.trash.push(...o.T);}
  return T;}
function gcPoolBuf(role,us,a){
  const Q=gcPool(),n=Math.max(256,a.byteLength);let b=Q.b[role];
  if(!b||b.size<n){if(b)GPU.trash.push(b);let s=256;while(s<n)s*=2;b=Q.b[role]=GPU.dev.createBuffer({size:s,usage:us|GPUBufferUsage.COPY_DST});Q.made++;}
  GPU.dev.queue.writeBuffer(b,0,a);return b;}

/* ── выпечка: gpuBake(w,h,draw,o) → B {tex,view,w,h,n,dev}. B годится везде, где мастер
   gpuMipTex (gpuImage, gpuLitSprite). На время draw глобальный ctx — этот холст, так что
   кисти, что рисуют в ctx, переносятся без переписи. o.ss — во сколько крупнее рисовать
   (по умолчанию 2 для выпечек до 512², иначе 1); o.mips:false — один уровень.
   Без видеокарты (Node, gpuNone) — null: 2D-пути у выпечек больше нет ── */
function gpuBake(w,h,draw,o){
  if(!GPU.dev)return null;
  o=o||{};w=Math.max(1,Math.round(w));h=Math.max(1,Math.round(h));
  let n=1;if(o.mips!==false)while(n<9&&(w>>n)>=4&&(h>>n)>=4)n++;
  const B={w,h,n,draw,o,tex:null,view:null,dev:null};gpuBakeRedo(B);return B;
}
/* кэш выпечек по ключу: устройство потеряно и поднято — печём заново тем же draw.
   Недавние держатся (o.keep, по умолчанию 32), старейшая — долой с текстурой: без потолка
   кэш рос с каждой новой системой (ревью 25.09 п. 4) */
function gpuBaked(M,key,w,h,draw,o){
  let B=M.get(key);if(B&&B.dev===GPU.dev){M.delete(key);M.set(key,B);return B;}
  if(B){gpuBakeDrop(B);M.delete(key);}B=gpuBake(w,h,draw,o);if(!B)return B;M.set(key,B);
  const cap=(o&&o.keep)||32;while(M.size>cap){const k=M.keys().next().value;gpuBakeDrop(M.get(k));M.delete(k);}
  return B;
}
function gpuBakeDrop(B){if(B&&B.tex){if(B.dev===GPU.dev)GPU.trash.push(B.tex);B.tex=B.view=null;}}
/* выпечка годна к рисованию: пережила потерю устройства или ушла из кэша, а держатель ещё рисует её —
   печём заново тем же draw (все места, что берут вид выпечки: gpuImage, gpuField, gcImg) */
function gpuBakeLive(B){if(B.dev!==GPU.dev||!B.tex)gpuBakeRedo(B);return B;}
/* кэш арта (флот, пираты, баржи) — объект по ключу; недавние держатся, старейшая вещь уходит
   со всеми своими выпечками (ревью 25.09 п. 4: посевы меняются каждые 10–15 минут в каждой системе) */
function artGet(M,key){const v=M[key];if(v){delete M[key];M[key]=v;}return v;}
function artPut(M,key,v,cap){
  M[key]=v;const ks=Object.keys(M);
  for(let i=0;i<ks.length-cap;i++){const o=M[ks[i]];delete M[ks[i]];for(const f in o){const B=o[f];if(B&&B.draw&&B.o)gpuBakeDrop(B);}}
  return v;}
/* GC_PX — точек MSAA, выпеченных с загрузки: prebake (17a0) не начинает шаг, если кадр уже испёк PB_PX */
let GC_PX=0;
let GC_VA=new Float32Array(1<<16);   /* вершины выпечки (x,y,краска,u,v) — общий растущий буфер */
/* o.once — выпечка редкая и крупная (стойка 25d): наборы пула берутся разово и в пул не ложатся,
   иначе вытеснили бы прогретые записи, и их родила бы заново первая же выпечка в полёте */
let GC_ONCE=false;
function gpuBakeRedo(B){const o0=GC_ONCE;GC_ONCE=!!B.o.once;try{gpuBakeRedo0(B);}finally{GC_ONCE=o0;}}
function gpuBakeRedo0(B){
  const t0=wallMs(),{w,h}=B,k=B.o.ss||(w*h<=262144?2:1),g=new GcCtx(w,h,k),prev=ctx;
  ctx=g;try{B.draw(g);}finally{ctx=prev;}
  const d=GPU.dev,U=GPUTextureUsage,W=w*k,H=h*k;
  B.tex=d.createTexture({size:[w,h],mipLevelCount:B.n,format:"rgba8unorm",usage:U.TEXTURE_BINDING|U.RENDER_ATTACHMENT|U.COPY_SRC});
  B.view=B.tex.createView();B.dev=d;
  const [ms,st,rs]=gcPoolSet("bake",W,H),TW=ms.width,TH=ms.height;GC_PX+=W*H;
  /* вершины (x,y,краска,u,v), краски по 5 vec4, ленты градиентов, список вызовов */
  let V=GC_VA,vn=0;const P=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],R=[],RI=new Map(),D=[],Q=[0,0,W,0,W,H,0,0,W,H,0,H];
  let DL=D;const SH=[];   /* DL — куда идут вызовы: основной проход или слой тени */
  const put=(md,ref,v,pi,img)=>{const f=vn/5,e=vn+(img?v.length/4:v.length/2)*5;
    if(e>V.length){const A=new Float32Array(Math.max(e,V.length*2));A.set(V.subarray(0,vn));V=GC_VA=A;}
    if(img)for(let i=0;i<v.length;i+=4){V[vn]=v[i];V[vn+1]=v[i+1];V[vn+2]=pi;V[vn+3]=v[i+2];V[vn+4]=v[i+3];vn+=5;}
    else for(let i=0;i<v.length;i+=2){V[vn]=v[i];V[vn+1]=v[i+1];V[vn+2]=pi;V[vn+3]=0;V[vn+4]=0;vn+=5;}
    if(!v.length)return;const n=vn/5-f;
    if(md.endsWith("|multiply")){const m=md.slice(0,-9);DL.push({md:(m==="cov"?"cvk":m)+"|mul1",ref,f,n,img});}   /* первый не чистит трафарет */
    DL.push({md,ref,f,n,img});};
  const box=v=>{let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
    for(let i=0;i<v.length;i+=2){x0=Math.min(x0,v[i]);x1=Math.max(x1,v[i]);y0=Math.min(y0,v[i+1]);y1=Math.max(y1,v[i+1]);}
    x0=Math.max(0,x0-1);y0=Math.max(0,y0-1);x1=Math.min(W,x1+1);y1=Math.min(H,y1+1);return [x0,y0,x1,y0,x1,y1,x0,y0,x1,y1,x0,y1];};
  let on=[];
  const clip=cl=>{if(cl===on)return;let i=on.length;
    if(!(cl.length>=on.length&&on.every((c,j)=>c===cl[j]))){put("crs",0x80,Q,0);i=0;}
    for(;i<cl.length;i++){put(cl[i].eo?"weo":"wnz",0x80,cl[i].v,0);put("clp",0x80,Q,0);}
    on=cl;};
  const paint=p=>{const i=P.length/20;
    if(!p.k){P.push(...p.c,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);return i;}
    let r=RI.get(p.ramp);if(r===undefined){RI.set(p.ramp,r=R.length);R.push(p.ramp);}const a=p.g.a,iv=p.iv;   /* одна лента — одна строка */
    P.push(0,0,0,0,p.k,r,p.a,0,iv[0],iv[1],iv[2],iv[3],iv[4],iv[5],a[0],a[1]);
    if(p.k===1)P.push(a[2],a[3],0,0);else P.push(a[2],a[3],a[4],a[5]);
    return i;};
  /* вызовы одной команды со смешением op */
  const emit=(q,op)=>{const u=GC_OPS[op].u;
    if(q.t==="i"||q.t==="x"){const tx=q.t==="x";let pi;   /* картинка или маска текста — четырёхугольник с uv */
      if(tx)pi=paint(q.p);else{pi=P.length/20;P.push(0,0,0,q.a,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);}
      if(u){const s=[];for(let i=0;i<q.v.length;i+=4)s.push(q.v[i],q.v[i+1]);put("wst",0x81,s,0);put("out",0x80,Q,0);
        put((tx?"mkc|":"imc|")+op,0,q.v,pi,q);}
      else put((tx?"msk|":"img|")+op,0x80,q.v,pi,q);
      return;}
    put(q.t==="s"?"wst":q.eo?"weo":"wnz",q.t==="s"?0x81:0x80,q.v,0);
    if(u)put("out",0x80,Q,0);
    put("cov|"+op,0,u?Q:box(q.v),paint(q.p));};
  /* тень команды (08cc). Серия — подряд идущие команды с одной тенью (размытие, цвет, смещение,
     смешение, клип) — это один слой: одно размытие и одно наложение (гостиница: 84 окна — 84 прохода,
     347 мс против 74 без тени). Точно, пока следы теней серии (рамка + 3σ, со смещением) не
     пересекаются между собой (размытие суммы = сумма размытий, а source-over двух следов — не сумма)
     и не ложатся на нарисованное в серии раньше: в 2D тень №2 лежит поверх фигуры №1, а в серии она
     под ней. Команда без тени серию не рвёт, если её рамка не задевает следующих следов; иначе — рвёт */
  let ser=null;const L0=gcLay();
  const bx=q=>{const s=q.t==="i"||q.t==="x"?4:2,v=q.v;let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
    for(let i=0;i<v.length;i+=s){x0=Math.min(x0,v[i]);x1=Math.max(x1,v[i]);y0=Math.min(y0,v[i+1]);y1=Math.max(y1,v[i+1]);}
    return [x0-1,y0-1,x1+1,y1+1];};
  const hit=(a,b)=>a[0]<b[2]&&b[0]<a[2]&&a[1]<b[3]&&b[1]<a[3];
  const close=()=>{const s=ser;if(!s)return;ser=null;
    const X0=Math.max(0,s.x0+s.dx),Y0=Math.max(0,s.y0+s.dy),X1=Math.min(W,s.x1+s.dx),Y1=Math.min(H,s.y1+s.dy),w=s.x1-s.x0,h=s.y1-s.y0;
    SH.push({sd:s.sd,x0:s.x0,y0:s.y0,w,h,sg:s.sg,R:s.R,k,n:s.F.length,pi:s.pi,img:s.img});
    P[s.pi*20+8]=s.x0+s.dx;P[s.pi*20+9]=s.y0+s.dy;P[s.pi*20+10]=w;P[s.pi*20+11]=h;
    const r=[X0,Y0,X1,Y0,X1,Y1,X0,Y0,X1,Y1,X0,Y1];for(let j=0;j<6;j++){V[(s.vf+j)*5]=r[j*2];V[(s.vf+j)*5+1]=r[j*2+1];}};
  /* команда без тени (или с тенью вне холста) посреди серии: рамку — в «нарисованное» */
  const drew=q=>{if(!ser)return;if(GC_OPS[q.op].u)close();else ser.S.push(bx(q));};
  const shade=q0=>{const q=q0.sv?Object.assign({},q0,{v:q0.sv,view:q0.sview}):q0,sh=q.sh,sg=sh.b/2*k,Rr=Math.ceil(3*sg),dx=sh.x*k,dy=sh.y*k,b=bx(q);
    const x0=Math.max(0,Math.floor(b[0]-Rr)),y0=Math.max(0,Math.floor(b[1]-Rr)),x1=Math.min(W,Math.ceil(b[2]+Rr)),y1=Math.min(H,Math.ceil(b[3]+Rr));
    if(x1<=x0||y1<=y0||Math.min(W,x1+dx)<=Math.max(0,x0+dx)||Math.min(H,y1+dy)<=Math.max(0,y0+dy)){drew(q0);return;}
    const F=[x0+dx,y0+dy,x1+dx,y1+dy],s=ser;
    if(s&&s.op===q0.op&&s.clip===q0.clip&&s.b===sh.b&&s.x===sh.x&&s.y===sh.y&&s.c.every((v,i)=>v===sh.c[i])&&!s.F.some(f=>hit(f,F))&&!s.S.some(a=>hit(a,F))){
      s.F.push(F);s.x0=Math.min(s.x0,x0);s.y0=Math.min(s.y0,y0);s.x1=Math.max(s.x1,x1);s.y1=Math.max(s.y1,y1);
      DL=s.sd;emit(q,"source-over");DL=D;s.S.push(bx(q0));return;}
    close();
    ser={op:q0.op,clip:q0.clip,b:sh.b,x:sh.x,y:sh.y,c:sh.c,dx,dy,sg,R:Rr,F:[F],S:[bx(q0)],sd:[],x0,y0,x1,y1,img:{view:L0.dm,near:true}};
    DL=ser.sd;emit(q,"source-over");DL=D;
    ser.pi=P.length/20;P.push(...sh.c,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);
    ser.vf=vn/5;put("shw|"+q0.op,0x80,new Array(24).fill(0),ser.pi,ser.img);};
  for(const q of g._ops){clip(q.clip);if(q.sh)shade(q);else drew(q);emit(q,q.op);}
  close();
  /* слои тени — рамки одного атласа (08cc) */
  const SA=SH.length?gcShadowPack(SH):null;
  if(SA)for(const s of SH){P[s.pi*20+12]=s.ax;P[s.pi*20+13]=s.ay;s.img.view=SA.v2;}
  /* лента — строки текстуры из пула (строк бывает больше, чем лент) */
  const rt=R.length?gcPoolSet("ramp",256,R.length)[0]:null;
  for(let i=20;i<P.length;i+=20)if(P[i+4])P[i+5]=(P[i+5]+.5)/rt.height;
  /* буферы: vb, pb, ub (0 — GU; 256 — доля resolve для нулевого мипа; 512 — единица для остальных) */
  const bu=GPUBufferUsage,u0=new Float32Array(132);u0.set([TW,TH,k,0]);u0.set([W/TW,H/TH,0,0],64);u0.set([1,1,0,0],128);
  const vb=gcPoolBuf("vb",bu.VERTEX,V.subarray(0,Math.max(vn,4))),pb=gcPoolBuf("pb",bu.STORAGE,new Float32Array(P)),ub=gcPoolBuf("ub",bu.UNIFORM,u0);
  const L=gcLay();let rv=L.dm;
  if(rt){const h=new Uint16Array(R.length*1024);
    R.forEach((r,i)=>{if(!r.h16){r.h16=new Uint16Array(1024);for(let j=0;j<1024;j++)r.h16[j]=f16(r[j]);}h.set(r.h16,i*1024);});d.queue.writeTexture({texture:rt},h,{bytesPerRow:2048},[256,R.length]);rv=rt.createView();}
  const bgs=new Map(),bg=(q,u)=>{u=u||ub;const key=q?q.view:null,nr=q&&q.near;let M=bgs.get(u);if(!M)bgs.set(u,M=new Map());
    let b=M.get(key)&&M.get(key)[nr?1:0];if(b)return b;
    b=d.createBindGroup({layout:L.bgl,entries:[{binding:0,resource:u.buffer?u:{buffer:u,size:32}},{binding:1,resource:{buffer:pb}},{binding:2,resource:rv},
      {binding:3,resource:GPU.S.lin},{binding:4,resource:q?q.view:L.dm},{binding:5,resource:nr?L.near:gpuMipSmp()}]});
    const e=M.get(key)||[];e[nr?1:0]=b;M.set(key,e);return b;};
  const enc=d.createCommandEncoder();
  const run=(p,list,u)=>{p.setVertexBuffer(0,vb);let m=null,im=run,r=-1;   /* состояние — только когда меняется */
    for(const c of list){if(c.md!==m)p.setPipeline(gcPipe(m=c.md));if(c.img!==im)p.setBindGroup(0,bg(im=c.img,u));
      if(c.ref!==r)p.setStencilReference(r=c.ref);p.draw(c.n,1,c.f,0);}};
  B.shl=SH.length;if(SA)gcShadowPasses(enc,SH,SA,run);
  const ps=enc.beginRenderPass({colorAttachments:[{view:ms.createView(),resolveTarget:rs.createView(),
    loadOp:"clear",clearValue:{r:0,g:0,b:0,a:0},storeOp:"discard"}],
    depthStencilAttachment:{view:st.createView(),stencilLoadOp:"clear",stencilClearValue:0x80,stencilStoreOp:"discard"}});
  run(ps,D);ps.end();
  /* мипы на видеокарте: проход на уровень, среднее 2×2 (и сброс resolve в нулевой: копия 1:1 или среднее 2×2) */
  const MP=gcMipPipe(),down=(src,lv,uo)=>{
    const p=enc.beginRenderPass({colorAttachments:[{view:B.tex.createView({baseMipLevel:lv,mipLevelCount:1}),loadOp:"clear",clearValue:{r:0,g:0,b:0,a:0},storeOp:"store"}]});
    p.setPipeline(MP);p.setBindGroup(0,d.createBindGroup({layout:MP.getBindGroupLayout(0),entries:[{binding:0,resource:src},{binding:1,resource:GPU.S.lin},{binding:2,resource:{buffer:ub,offset:uo,size:16}}]}));
    p.draw(3);p.end();};
  down(rs.createView(),0,256);
  for(let i=1;i<B.n;i++)down(B.tex.createView({baseMipLevel:i-1,mipLevelCount:1}),i,512);
  d.queue.submit([enc.finish()]);
  if(V.length>1<<22)GC_VA=new Float32Array(1<<16);   /* после огромной выпечки 16 МБ не держим */
  GPU.bakeN=(GPU.bakeN||0)+1;GPU.bakeMs=(GPU.bakeMs||0)+(wallMs()-t0);
}
