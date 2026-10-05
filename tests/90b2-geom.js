/* ══════════════ Зрение: экран в числах и неравенствах (27.09.2026) ══════════════
   Экран — набор прямоугольников: надписи, плашки, обводы, кнопки. Их отдаёт сама игра:
   вёрстку считает браузер (DOM), холст #c — запись его вызовов 2D, слой #ovl — ovText и ovPush.
   Брак — нарушенное неравенство. Пикселей и снимков нет, поэтому быстро.
     вылет    надпись вылезает из своей плашки. Плашка в DOM — ближайший предок с фоном или
              рамкой (или сама кнопка); на холсте — фигура, нарисованная прямо перед надписью,
              накрывающая её якорь и не ниже её самой (виджет рисует рамку, потом подпись);
     срез     надпись срезана обрезкой (overflow:hidden, clip), которую не прокрутить;
     край     надпись или кнопка частью за краем экрана (целиком за краем — спрятана, не брак);
     наезд    надписи наезжают друг на друга там, где обе видны; кнопки — друг на друга;
     накрыта  тычок в середину кнопки ловит чужой элемент — не окно во весь экран;
     цель     кнопка меньше 24 px на сенсорном экране, и круг в 24 px задевает соседей (WCAG 2.5.8);
     невидим  контраст надписи к её подложке ниже 1.35 — текста нет;
     мусор    undefined / NaN / [object / null / Infinity в тексте, NaN в координатах холста;
     сбой     кадр бросил исключение;  кегль — шрифт мельче 8 px;
     сжатие   maxWidth сжал строку сильнее, чем на 20 %.
   Невидимое не бракуется: надпись под сплошной плашкой, за обрезкой, в прокрутке — это слой.
   Множители: ширина знака a (моноширинный шрифт: строка = n·a·кегль; test-geom.js гоняет обе
   крайности и считает порог), ширина окна (края кусков @media), разрешение (DPR).
   Тест теста (geoSelf): заложенные поломки обязаны найтись, чистая плашка — нет; иначе зрение
   слепо и прогон красный. Водитель — test-geom.js. */
const GEO={on:false,c:[],ov:{lab:[],chip:[],ui:[],dock:[]},n:0,k:1,bad:[],crash:[],fx:null,into:null,intoId:0,ids:new WeakMap(),gid:0,xn:0};
const GEO_Z={c:0,lab:1,chip:2,ui:3,dock:3,dom:4};
const GEO_SIDE={l:"влево",r:"вправо",u:"вверх",d:"вниз"};
const GEO_JUNK=/undefined|NaN|\[object|\bnull\b|Infinity/;
const GEO_DANGER=/войти|сброс|стереть|удал|выйти|выход|перезап/i;   /* уводит со страницы или стирает сейв (27-ui-ship) */

/* ── прямоугольники {x0,y0,x1,y1} в пикселях CSS ── */
function geoR(x0,y0,x1,y1){return {x0:Math.min(x0,x1),y0:Math.min(y0,y1),x1:Math.max(x0,x1),y1:Math.max(y0,y1)};}
function geoD(r){return {x0:r.left,y0:r.top,x1:r.right,y1:r.bottom};}
function geoArea(r){return r?Math.max(0,r.x1-r.x0)*Math.max(0,r.y1-r.y0):0;}
function geoAnd(a,b){if(!a||!b)return null;const x0=Math.max(a.x0,b.x0),y0=Math.max(a.y0,b.y0),x1=Math.min(a.x1,b.x1),y1=Math.min(a.y1,b.y1);
  return (x1>x0&&y1>y0)?{x0,y0,x1,y1}:null;}
function geoFin(r){return isFinite(r.x0)&&isFinite(r.y0)&&isFinite(r.x1)&&isFinite(r.y1);}
function geoMin(r){return Math.min(r.x1-r.x0,r.y1-r.y0);}
function geoIn(p,r){return p[0]>=r.x0&&p[0]<=r.x1&&p[1]>=r.y0&&p[1]<=r.y1;}
/* насколько t торчит из b: худшая сторона сверх допуска (th по x, tv по y); null — внутри */
function geoOut(t,b,th,tv){
  const o={l:b.x0-t.x0,r:t.x1-b.x1,u:b.y0-t.y0,d:t.y1-b.y1},lim={l:th,r:th,u:tv,d:tv};let k=null;
  for(const q in o)if(o[q]>lim[q]&&(!k||o[q]-lim[q]>o[k]-lim[k]))k=q;
  return k?{side:k,v:o[k]}:null;
}
/* часть на экране, часть за краем */
function geoEdge(r,V){return geoAnd(r,V)?geoOut(r,V,1,1):null;}
function geoRs(r){return Math.round(r.x0)+","+Math.round(r.y0)+" "+Math.round(r.x1-r.x0)+"×"+Math.round(r.y1-r.y0);}

/* ── цвет: любая строка CSS → [r,g,b,a]; градиент, узор — null ── */
let GEO_CC=null;
function geoCol(s){
  if(typeof s!=="string")return null;
  let m=/^rgba?\(([^)]*)\)$/.exec(s);
  if(!m){
    if(!GEO_CC)GEO_CC=document.createElement("canvas").getContext("2d");
    GEO_CC.fillStyle="#000";GEO_CC.fillStyle=s;const v=GEO_CC.fillStyle;
    if(v[0]==="#")return [parseInt(v.slice(1,3),16),parseInt(v.slice(3,5),16),parseInt(v.slice(5,7),16),1];
    m=/^rgba?\(([^)]*)\)$/.exec(v);if(!m)return null;
  }
  const p=m[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat);
  return p.length<3?null:[p[0],p[1],p[2],p.length>3?p[3]:1];
}
function geoLum(c){const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);};return .2126*f(c[0])+.7152*f(c[1])+.0722*f(c[2]);}
function geoOver(t,b){const a=t[3];return [t[0]*a+b[0]*(1-a),t[1]*a+b[1]*(1-a),t[2]*a+b[2]*(1-a),1];}
function geoContrast(a,b){const x=geoLum(a),y=geoLum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}

/* ── запись холста #c ──
   Вешается на сам MAIN_CTX поверх обёрток видеокарты (gpuFrontHook ставит свои на экземпляр и,
   поставленный позже, наши снимает — тогда перевешиваемся). Путь, обрезка и save/restore ведутся
   всегда (иначе стопка разъедется), в список идёт только при GEO.on. Координаты — пиксели
   холста; в CSS делит GEO.k */
function geoHookCtx(c){
  if(!c)return;
  if(typeof gpuFrontHook==="function"&&typeof GPU!=="undefined"&&GPU.dev)try{gpuFrontHook();}catch(e){}
  if(c.fillText&&c.fillText.__g)return;
  const S=c.__geoS||(c.__geoS={p:null,clip:null,st:[]});
  const tf=()=>c.getTransform();
  const pt=(m,x,y)=>{const X=m.a*x+m.c*y+m.e,Y=m.b*x+m.d*y+m.f,p=S.p;
    if(!p)S.p={x0:X,y0:Y,x1:X,y1:Y};else{if(X<p.x0)p.x0=X;if(X>p.x1)p.x1=X;if(Y<p.y0)p.y0=Y;if(Y>p.y1)p.y1=Y;}};
  const box=(x,y,w,h)=>{const m=tf();pt(m,x,y);pt(m,x+w,y);pt(m,x+w,y+h);pt(m,x,y+h);};
  const fin=a=>{for(const v of a)if(typeof v==="number"&&!isFinite(v))return false;return true;};
  const bad=(k,a)=>{if(GEO.on)GEO.bad.push(k+"("+[...a].slice(0,4).map(v=>typeof v==="number"?+v.toFixed(1):String(v).slice(0,20)).join(",")+")");};
  const wrap=(k,fn,always)=>{const o=c[k];if(typeof o!=="function"||o.__g)return;
    const w=function(){if(always||GEO.on)try{fn.apply(this,arguments);}catch(e){}return o.apply(this,arguments);};w.__g=true;c[k]=w;};
  const P2=a=>typeof Path2D!=="undefined"&&a[0] instanceof Path2D;
  wrap("beginPath",()=>{S.p=null;},true);
  for(const k of ["moveTo","lineTo"])wrap(k,function(x,y){if(fin([x,y]))pt(tf(),x,y);else bad(k,arguments);},true);
  wrap("rect",function(x,y,w,h){if(fin([x,y,w,h]))box(x,y,w,h);else bad("rect",arguments);},true);
  wrap("roundRect",function(x,y,w,h){if(fin([x,y,w,h]))box(x,y,w,h);else bad("roundRect",arguments);},true);
  wrap("arc",function(x,y,r){if(fin([x,y,r]))box(x-r,y-r,2*r,2*r);else bad("arc",arguments);},true);
  wrap("ellipse",function(x,y,rx,ry){const R=Math.max(rx,ry);if(fin([x,y,R]))box(x-R,y-R,2*R,2*R);else bad("ellipse",arguments);},true);
  wrap("arcTo",function(a,b,x,y){if(fin([a,b,x,y])){const m=tf();pt(m,a,b);pt(m,x,y);}},true);
  wrap("quadraticCurveTo",function(a,b,x,y){if(fin([a,b,x,y])){const m=tf();pt(m,a,b);pt(m,x,y);}},true);
  wrap("bezierCurveTo",function(a,b,d,e,x,y){if(fin([a,b,d,e,x,y])){const m=tf();pt(m,a,b);pt(m,d,e);pt(m,x,y);}},true);
  wrap("fill",function(){if(S.p&&!P2(arguments))geoShape(c,S,S.p,true);});
  wrap("stroke",function(){if(S.p&&!P2(arguments))geoShape(c,S,S.p,false);});
  wrap("fillRect",function(x,y,w,h){if(!fin([x,y,w,h]))return bad("fillRect",arguments);const p0=S.p;S.p=null;box(x,y,w,h);geoShape(c,S,S.p,true);S.p=p0;});
  wrap("strokeRect",function(x,y,w,h){if(!fin([x,y,w,h]))return bad("strokeRect",arguments);const p0=S.p;S.p=null;box(x,y,w,h);geoShape(c,S,S.p,false);S.p=p0;});
  wrap("fillText",function(t,x,y,mw){geoText(c,S,t,x,y,mw,true);});
  wrap("strokeText",function(t,x,y,mw){geoText(c,S,t,x,y,mw,false);});
  wrap("clip",function(){if(S.p&&!P2(arguments)){const p={x0:S.p.x0,y0:S.p.y0,x1:S.p.x1,y1:S.p.y1};S.clip=S.clip?(geoAnd(S.clip,p)||{x0:0,y0:0,x1:0,y1:0}):p;}},true);
  wrap("save",()=>{S.st.push(S.clip);},true);
  wrap("restore",()=>{S.clip=S.st.length?S.st.pop():null;},true);
}
/* O — куда класть (по умолчанию кадр #c в CSS через GEO.k; список другого холста — в его пикселях, k=1) */
function geoShape(c,S,p,fill,O){
  const k=O?1:GEO.k;let r={x0:p.x0/k,y0:p.y0/k,x1:p.x1/k,y1:p.y1/k};
  if(!fill){const m=c.getTransform(),h=c.lineWidth*Math.hypot(m.a,m.b)/k/2;r={x0:r.x0-h,y0:r.y0-h,x1:r.x1+h,y1:r.y1+h};}
  (O||GEO.c).push({L:"c",k:"b",r,col:geoCol(fill?c.fillStyle:c.strokeStyle),a:c.globalAlpha,fill,z:0,g:0,n:O?++GEO.xn:GEO.n++});
}
function geoText(c,S,t,x,y,mw,fill,O){
  const s=String(t);if(!/\S/.test(s))return;
  if(!isFinite(x)||!isFinite(y)){const b="fillText(«"+s.slice(0,24)+"», "+x+", "+y+")";if(O)O.push({k:"x",s:b,n:++GEO.xn});else GEO.bad.push(b);return;}
  const m=c.getTransform(),tm=c.measureText(s),k=O?1:GEO.k;
  let L=tm.actualBoundingBoxLeft,R=tm.actualBoundingBoxRight,sq=1;
  if(mw!==undefined&&mw>0&&tm.width>mw){sq=mw/tm.width;L*=sq;R*=sq;}
  const A=tm.actualBoundingBoxAscent,D=tm.actualBoundingBoxDescent;
  const P=(u,v)=>[(m.a*u+m.c*v+m.e)/k,(m.b*u+m.d*v+m.f)/k];
  const q=[P(x-L,y-A),P(x+R,y-A),P(x+R,y+D),P(x-L,y+D)],xs=q.map(p=>p[0]),ys=q.map(p=>p[1]);
  const f=/(\d*\.?\d+)px/.exec(c.font);
  (O||GEO.c).push({L:"c",k:"t",s,r:geoR(Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)),
    px:f?+f[1]*Math.hypot(m.a,m.b)/k:0,col:geoCol(fill?c.fillStyle:c.strokeStyle),a:c.globalAlpha,sq,
    clip:S.clip?{x0:S.clip.x0/k,y0:S.clip.y0/k,x1:S.clip.x1/k,y1:S.clip.y1/k}:null,an:P(x,y),z:0,g:0,n:O?++GEO.xn:GEO.n++});
}

/* ── прочие 2D-холсты страницы (#ipod, #tablecv, #roadcv, …) рисуют в своё время, не в кадре.
   Запись — на прототипе, всегда, в список у холста: на нём то, что нарисовано после последнего
   сброса. Сброс — очистка, новая ширина или сплошная заливка/картинка во весь холст; частичная
   очистка снимает то, что целиком под ней. Пиксели холста; в CSS — при взгляде (geoExtra) ── */
function geoHookAll(){
  const P=typeof CanvasRenderingContext2D!=="undefined"&&CanvasRenderingContext2D.prototype;
  if(!P||typeof P.fillText!=="function"||P.fillText.__ga)return;
  geoRec(P,c=>{let S=c.__geoA;if(S)return S;const cv=c.canvas;
    if(!cv||!cv.isConnected||cv.id==="c"||c.__geoS)return null;
    S=c.__geoA={p:null,clip:null,st:[]};cv.__geoC=c;if(!cv.__geoL)cv.__geoL=[];return S;},c=>c.canvas.__geoL);
  /* новая ширина или высота стирает холст и сбрасывает его состояние */
  for(const k of ["width","height"]){const d=Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype,k);
    if(!d||!d.set||d.set.__ga)continue;
    const s=function(v){if(this.__geoL)this.__geoL.length=0;const c=this.__geoC,S=c&&c.__geoA;if(S){S.p=null;S.clip=null;S.st=[];}return d.set.call(this,v);};
    s.__ga=true;Object.defineProperty(HTMLCanvasElement.prototype,k,{get:d.get,set:s,configurable:true,enumerable:d.enumerable});}
}
/* выпечки (gpuBake: стол, опись, чертёж, окно почты, клавиатура…) рисуют своим GcCtx, не 2D: запись —
   на его прототипе, в список выпечки (её пиксели), пока идёт её draw. Выпечка без надписей списка не
   держит — арт кораблей и планет памяти не ест. Куда выпечку кладут (ovImage), туда и список */
function geoHookBake(){
  if(typeof GcCtx==="undefined"||typeof gpuBakeRedo!=="function"||gpuBakeRedo.__g)return;
  const F=[],oR=gpuBakeRedo;
  gpuBakeRedo=function(B){const f={c:null,L:[],S:{p:null,clip:null,st:[]}};F.push(f);
    try{return oR.apply(this,arguments);}finally{F.pop();if(B)B.__geoL=f.L.some(x=>x.k==="t"||x.k==="x")?f.L:null;}};
  gpuBakeRedo.__g=true;
  const cur=c=>{const f=F[F.length-1];if(!f)return null;if(!f.c)f.c=c;return f.c===c?f:null;};
  geoRec(GcCtx.prototype,c=>{const f=cur(c);return f&&f.S;},c=>cur(c).L);
}
/* запись контекста: st(c) — состояние пути и обрезки (null — не пишем), L(c) — список */
function geoRec(P,st,L){
  const fin=a=>{for(const v of a)if(typeof v==="number"&&!isFinite(v))return false;return true;};
  const pt=(S,m,x,y)=>{const X=m.a*x+m.c*y+m.e,Y=m.b*x+m.d*y+m.f,p=S.p;
    if(!p)S.p={x0:X,y0:Y,x1:X,y1:Y};else{if(X<p.x0)p.x0=X;if(X>p.x1)p.x1=X;if(Y<p.y0)p.y0=Y;if(Y>p.y1)p.y1=Y;}};
  const box=(c,S,x,y,w,h)=>{const m=c.getTransform();pt(S,m,x,y);pt(S,m,x+w,y);pt(S,m,x+w,y+h);pt(S,m,x,y+h);};
  const rectOf=(c,x,y,w,h)=>{const T={p:null};box(c,T,x,y,w,h);return T.p;};
  const all=(c,r)=>!!r&&r.x0<=.5&&r.y0<=.5&&r.x1>=c.canvas.width-.5&&r.y1>=c.canvas.height-.5;
  const plain=c=>c.globalAlpha>=.99&&c.globalCompositeOperation==="source-over";
  const P2=a=>typeof Path2D!=="undefined"&&a[0] instanceof Path2D;
  const W=(k,fn)=>{const o=P[k];if(typeof o!=="function"||o.__ga)return;
    const w=function(){const S=st(this);
      if(S)try{fn.call(this,S,arguments);const A=L(this);if(A.length>4000)A.splice(0,A.length-3000);}catch(e){}
      return o.apply(this,arguments);};
    w.__ga=true;P[k]=w;};
  W("beginPath",S=>{S.p=null;});
  for(const k of ["moveTo","lineTo"])W(k,function(S,a){if(fin(a))pt(S,this.getTransform(),a[0],a[1]);});
  for(const k of ["rect","roundRect"])W(k,function(S,a){if(fin([a[0],a[1],a[2],a[3]]))box(this,S,a[0],a[1],a[2],a[3]);});
  W("arc",function(S,a){if(fin([a[0],a[1],a[2]]))box(this,S,a[0]-a[2],a[1]-a[2],2*a[2],2*a[2]);});
  W("ellipse",function(S,a){const R=Math.max(a[2],a[3]);if(fin([a[0],a[1],R]))box(this,S,a[0]-R,a[1]-R,2*R,2*R);});
  for(const k of ["arcTo","quadraticCurveTo","bezierCurveTo"])
    W(k,function(S,a){const m=this.getTransform();for(let i=0;i+1<a.length&&i<(k==="bezierCurveTo"?6:4);i+=2)if(fin([a[i],a[i+1]]))pt(S,m,a[i],a[i+1]);});
  W("fill",function(S,a){if(S.p&&!P2(a))geoShape(this,S,S.p,true,L(this));});
  W("stroke",function(S,a){if(S.p&&!P2(a))geoShape(this,S,S.p,false,L(this));});
  W("fillRect",function(S,a){if(!fin(a))return;const r=rectOf(this,a[0],a[1],a[2],a[3]),c=geoCol(this.fillStyle);
    if(all(this,r)&&c&&c[3]>=.99&&plain(this))L(this).length=0;   /* сплошная заливка во весь холст — всё прежнее под ней */
    geoShape(this,S,r,true,L(this));});
  W("strokeRect",function(S,a){if(fin(a))geoShape(this,S,rectOf(this,a[0],a[1],a[2],a[3]),false,L(this));});
  W("clearRect",function(S,a){if(!fin(a))return;const r=rectOf(this,a[0],a[1],a[2],a[3]),A=L(this);
    if(all(this,r)){A.length=0;return;}
    for(let i=A.length-1;i>=0;i--){const q=A[i].r;if(q&&q.x0>=r.x0&&q.y0>=r.y0&&q.x1<=r.x1&&q.y1<=r.y1)A.splice(i,1);}});
  W("drawImage",function(S,a){const n=a.length,im=a[0];let x,y,w,h;
    if(n>=9){x=a[5];y=a[6];w=a[7];h=a[8];}else if(n>=5){x=a[1];y=a[2];w=a[3];h=a[4];}
    else{x=a[1];y=a[2];w=im&&(im.width||im.videoWidth)||0;h=im&&(im.height||im.videoHeight)||0;}
    if(fin([x,y,w,h])&&all(this,rectOf(this,x,y,w,h))&&plain(this))L(this).length=0;});
  W("fillText",function(S,a){geoText(this,S,a[0],a[1],a[2],a[3],true,L(this));});
  W("strokeText",function(S,a){geoText(this,S,a[0],a[1],a[2],a[3],false,L(this));});
  W("clip",function(S,a){if(S.p&&!P2(a)){const p={x0:S.p.x0,y0:S.p.y0,x1:S.p.x1,y1:S.p.y1};S.clip=S.clip?(geoAnd(S.clip,p)||{x0:0,y0:0,x1:0,y1:0}):p;}});
  W("save",S=>{S.st.push(S.clip);});
  W("restore",S=>{S.clip=S.st.length?S.st.pop():null;});
  W("reset",function(S){S.p=null;S.clip=null;S.st=[];L(this).length=0;});
}
/* в прогоне зрения запись идёт с загрузки страницы: холсты, нарисованные до осмотра, тоже в списке */
if(typeof location!=="undefined"&&/__geom/.test(location.search||"")){geoHookAll();geoHookOvl();}
/* прочие холсты в CSS: масштаб — рамка на пиксели холста по каждой оси; видимая доля — рамка,
   обрезанная окном и предками с overflow; scr — холст в прокрутке (край не в счёт) */
function geoExtra(vp,root){
  const V={x0:0,y0:0,x1:vp.w,y1:vp.h},out=[];
  for(const cv of (root||document).querySelectorAll("canvas")){
    const A0=cv.__geoL;if(!A0||!A0.length||cv.id==="c"||cv.id==="g"||cv.id==="ovl")continue;
    if(!root&&GEO.fx&&GEO.fx.contains(cv))continue;
    if(!cv.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}))continue;
    const R=geoD(cv.getBoundingClientRect()),[Wl,Hl]=cv.__geoW||[cv.width,cv.height];if(R.x1-R.x0<1||R.y1-R.y0<1||!Wl||!Hl)continue;
    let view=geoAnd(R,V),scr=false;
    for(let a=cv.parentElement;view&&a&&a!==document.body&&a!==document.documentElement;a=a.parentElement){const s=getComputedStyle(a);
      if(s.overflowX!=="visible"||s.overflowY!=="visible"){view=geoAnd(view,geoPad(a,s));
        if(/(auto|scroll)/.test(s.overflowX+s.overflowY)&&(a.scrollHeight>a.clientHeight+1||a.scrollWidth>a.clientWidth+1))scr=true;}}
    if(!view)continue;
    const kx=(R.x1-R.x0)/Wl,ky=(R.y1-R.y0)/Hl;   /* CSS на единицу списка: пиксель 2D-холста или пиксель CSS цели */
    const cr=r=>r&&{x0:R.x0+r.x0*kx,y0:R.y0+r.y0*ky,x1:R.x0+r.x1*kx,y1:R.y0+r.y1*ky};
    const A=[];
    for(const it of A0){
      if(it.k==="x"){A.push(it);continue;}
      const q=Object.assign({},it,{r:cr(it.r),z:3.5,g:0,cv,view,scr});
      if(it.k==="t"){q.clip=it.clip?(geoAnd(cr(it.clip),R)||{x0:0,y0:0,x1:0,y1:0}):R;q.an=[R.x0+it.an[0]*kx,R.y0+it.an[1]*ky];q.px=it.px*ky;}
      A.push(q);}
    out.push(["холст "+(cv.id?"#"+cv.id:geoWho(cv).slice(0,30)),A]);}
  return out;
}

/* ── запись слоя #ovl: подписи мира (lq), фишки (cq), приборы (uq) — в кадре. Своя цель (ovInto:
   карточки стола, колодка, приборы на своих холстах) — всегда, в список цели; её проход (ovPass)
   кладёт список на холст: картинка держится до следующего прохода. Холст прохода приносит вид
   кадра счётной видеокарты (view.__cv); с настоящей видеокартой цели не видны ── */
function geoOvQ(Q){return GEO.into?"dock":(typeof OVL==="undefined")?null:Q===OVL.lq?"lab":Q===OVL.cq?"chip":Q===OVL.uq?"ui":null;}
function geoHookOvl(){
  geoHookBake();
  if(typeof ovText!=="function"||ovText.__g)return;
  const oT=ovText,oP=ovPush;
  const tgt=()=>{const T=GEO.into;if(!T)return null;if(!T.__geoP)T.__geoP=[];T.__geoNd=ovNd();return T.__geoP;};
  /* выпечка на месте: пиксели выпечки → поле цели или слоя (вырезка u0..u1 растянута на w×h);
     повёрнутую и чужую текстуру (inv — кадр видеокарты, не выпечка) не переносим */
  if(typeof ovImage==="function"){const oM=ovImage;
    ovImage=function(B,x,y,w,h,rot,u0,v0,u1,v1,mul){
      try{const A=B&&B.__geoL;
        if(A&&A.length&&!B.inv&&!(Math.abs(rot||0)>1e-3)&&B.w&&B.h){const P=tgt(),q=!P&&GEO.on&&geoOvQ(OVL.uq);
          if(P||q){u0=u0||0;v0=v0||0;u1=u1==null?1:u1;v1=v1==null?1:v1;
            const sx=w/((u1-u0)*B.w),sy=h/((v1-v0)*B.h),ox=x-w/2-u0*B.w*sx,oy=y-h/2-v0*B.h*sy,O=P||GEO.ov[q];
            const m=r=>r&&{x0:ox+r.x0*sx,y0:oy+r.y0*sy,x1:ox+r.x1*sx,y1:oy+r.y1*sy};
            const crop={x0:u0*B.w,y0:v0*B.h,x1:u1*B.w,y1:v1*B.h},al=typeof mul==="number"?mul:(mul?mul[3]:1);
            for(const it of A){const n=P?++GEO.xn:GEO.n++;
              if(it.k==="x"){O.push(Object.assign({},it,{n}));continue;}
              if(!geoAnd(it.r,crop))continue;
              const o=Object.assign({},it,{L:q||"dock",r:m(it.r),a:(it.a==null?1:it.a)*al,z:q?GEO_Z[q]:3,g:0,n});
              if(it.k==="t"){o.clip=m((it.clip?geoAnd(it.clip,crop):crop)||{x0:0,y0:0,x1:0,y1:0});o.an=[ox+it.an[0]*sx,oy+it.an[1]*sy];o.px=it.px*sy;}
              O.push(o);}}}}catch(e){}
      return oM.apply(this,arguments);};}
  ovText=function(Q,x,y,text,font,col,align,base,al,sc,vert){
    const r=oT.apply(this,arguments);
    try{const P=tgt(),q=!P&&GEO.on&&geoOvQ(Q);
      if(r&&(P||q)){const f=/(\d*\.?\d+)px/.exec(font);
        (P||GEO.ov[q]).push({L:q||"dock",k:"t",s:String(text),r:geoR(r.x0,r.y0,r.x1,r.y1),px:f?+f[1]*(sc||1):0,col:geoCol(col),a:al==null?1:al,sq:1,an:[x,y],
          z:q?GEO_Z[q]:3,g:0,n:P?++GEO.xn:GEO.n++});}}catch(e){}
    return r;};
  ovText.__g=true;
  ovPush=function(Q,x0,y0,x1,y1,c,m){
    try{if(m===0){const P=tgt(),q=!P&&GEO.on&&geoOvQ(Q);
      if(P||q){const s=ovNd(),a=c[3]||0;
        (P||GEO.ov[q]).push({L:q||"dock",k:"b",r:geoR(x0/s,y0/s,x1/s,y1/s),col:a?[c[0]/a*255,c[1]/a*255,c[2]/a*255,a]:[0,0,0,0],a:1,fill:true,
          z:q?GEO_Z[q]:3,g:0,n:P?++GEO.xn:GEO.n++});}}}catch(e){}
    return oP.apply(this,arguments);};
  if(typeof ovPass==="function"){const oS=ovPass;
    ovPass=function(T,view,w,h){const r=oS.apply(this,arguments);
      if(typeof OVL==="undefined"||T!==OVL){const cv=view&&view.__cv,nd=T.__geoNd||1;
        if(cv){cv.__geoL=T.__geoP||[];cv.__geoW=[w/nd,h/nd];}T.__geoP=[];}
      return r;};}
  if(typeof ovInto==="function"){const oI=ovInto;
    ovInto=function(T){const p=GEO.into,pi=GEO.intoId;GEO.into=T;
      let id=GEO.ids.get(T);if(!id){id=++GEO.gid;GEO.ids.set(T,id);}GEO.intoId=id;
      try{return oI.apply(this,arguments);}finally{GEO.into=p;GEO.intoId=pi;}};}
}

/* ── кадр под записью: тот же порядок, что в frameBody (28-loop) ── */
function geoFrame(){
  GEO.c.length=0;for(const q in GEO.ov)GEO.ov[q].length=0;GEO.bad.length=0;GEO.crash.length=0;GEO.n=0;
  geoHookCtx(typeof MAIN_CTX!=="undefined"?MAIN_CTX:ctx);geoHookOvl();
  const rc=cvs.getBoundingClientRect();GEO.k=(rc.width>0)?cvs.width/rc.width:1;
  GEO.on=true;let drew=false;const T0=GEO.tm||(GEO.tm={}),q=(k,t)=>{T0[k]=(T0[k]||0)+performance.now()-t;};let t=performance.now();
  try{
    try{drew=!!gpuFrame();}catch(e){GEO.crash.push("gpuFrame: "+(e&&e.message));}
    q("gpuFrame",t);t=performance.now();
    if(drew){try{if(typeof rackDraw==="function")rackDraw();drawWorld();}catch(e){GEO.crash.push("drawWorld: "+(e&&e.message));}}
    q("drawWorld",t);t=performance.now();
    try{hud();}catch(e){GEO.crash.push("hud: "+(e&&e.message));}
    q("hud",t);t=performance.now();
    if(drew)try{gpuPresent();}catch(e){GEO.crash.push("gpuPresent: "+(e&&e.message));}
    q("present",t);
  }finally{GEO.on=false;}
  return drew;
}

/* ── кадр дороги (27l drawRoad): свой цикл, корпус на #c, числа на слое #ovl. Оба холста — в рамке
   листа внутри #roadwin, не в углу окна: записи сдвигаются на её место ── */
function geoRoadFrame(){
  GEO.c.length=0;for(const q in GEO.ov)GEO.ov[q].length=0;GEO.bad.length=0;GEO.crash.length=0;GEO.n=0;
  geoHookCtx(typeof MAIN_CTX!=="undefined"?MAIN_CTX:ctx);geoHookOvl();
  try{roadFit();}catch(e){}
  const gR=(typeof GPU!=="undefined"&&GPU.cv||cvs).getBoundingClientRect();
  GEO.k=gR.width>0?cvs.width/gR.width:1;
  GEO.on=true;
  try{drawRoad(performance.now());}catch(e){GEO.crash.push("drawRoad: "+(e&&e.message));}
  finally{GEO.on=false;}
  const sh=(A,dx,dy)=>{if(!dx&&!dy)return;const m=r=>r&&{x0:r.x0+dx,y0:r.y0+dy,x1:r.x1+dx,y1:r.y1+dy};
    for(const t of A){if(t.k==="x")continue;t.r=m(t.r);if(t.clip)t.clip=m(t.clip);if(t.an)t.an=[t.an[0]+dx,t.an[1]+dy];}};
  sh(GEO.c,gR.left,gR.top);
  const oR=typeof OVL!=="undefined"&&OVL.cv?OVL.cv.getBoundingClientRect():null;
  if(oR)for(const q in GEO.ov)sh(GEO.ov[q],oR.left,oR.top);
  return true;
}

/* ── DOM: надписи, их плашки, обрезки, кнопки ── */
function geoSty(M,e){let s=M.get(e);if(!s){s=getComputedStyle(e);M.set(e,s);}return s;}
function geoBoxy(e,s){
  if(/^(BUTTON|INPUT|SELECT|TEXTAREA)$/.test(e.tagName))return true;
  const bg=geoCol(s.backgroundColor);if(bg&&bg[3]>=.08)return true;
  if(s.backgroundImage&&s.backgroundImage!=="none")return true;
  for(const q of ["Top","Right","Bottom","Left"])if(parseFloat(s["border"+q+"Width"])>=1){const c=geoCol(s["border"+q+"Color"]);if(c&&c[3]>=.15)return true;}
  return false;
}
function geoOpaque(e,s){
  if(/^(IMG|VIDEO|CANVAS)$/.test(e.tagName))return true;
  if(+s.opacity<.9)return false;
  /* матовое стекло: размытие фона от 4 px сливает штрихи соседних букв (кегль 8–12, штрих 1–1.5 px) —
     надпись под ним не читается, для надписей это крышка */
  const bf=/blur\(\s*([\d.]+)px/.exec(s.backdropFilter||s.webkitBackdropFilter||"");if(bf&&+bf[1]>=4)return true;
  const bg=geoCol(s.backgroundColor);return !!(bg&&bg[3]>=.9)||(s.backgroundImage&&s.backgroundImage!=="none");
}
function geoPad(e,s){const r=e.getBoundingClientRect(),f=v=>parseFloat(v)||0;
  return {x0:r.left+f(s.borderLeftWidth),y0:r.top+f(s.borderTopWidth),x1:r.right-f(s.borderRightWidth),y1:r.bottom-f(s.borderBottomWidth)};}
function geoWho(e){
  const lbl=((e.getAttribute&&(e.getAttribute("aria-label")||e.getAttribute("title")))||String(e.textContent||"")).replace(/\s+/g," ").trim().slice(0,28);
  const path=[];
  for(let a=e;a&&a!==document.body&&path.length<3;a=a.parentElement){
    if(a.id){path.unshift("#"+a.id);break;}
    const c=(typeof a.className==="string"&&a.className.trim())?"."+a.className.trim().split(/\s+/)[0]:"";
    path.unshift(a.tagName.toLowerCase()+c);
  }
  return path.join(" › ")+(lbl?" «"+lbl+"»":"");
}
const GEO_CTL="button,[onclick],[role=button]";
function geoDom(root,vp){
  const V={x0:0,y0:0,x1:vp.w,y1:vp.h},M=new Map(),sty=e=>geoSty(M,e),boxOf=new Map(),inner=new Map(),scrOf=new Map(),texts=[],R=document.createRange();
  const top=e=>!e||e.nodeType!==1||e===document.body||e===document.documentElement;
  const box=e=>{if(boxOf.has(e))return boxOf.get(e);let b=null;
    for(let a=e;!top(a);a=a.parentElement)if(geoBoxy(a,sty(a))){b=a;break;}
    boxOf.set(e,b);return b;};
  /* что e показывает из своего содержимого: экран ∩ обрезки e и предков; null — ничего */
  const innerOf=e=>{if(top(e))return V;if(inner.has(e))return inner.get(e);
    const s=sty(e);let r=s.position==="fixed"?V:innerOf(e.parentElement);
    if(r&&(s.overflowX!=="visible"||s.overflowY!=="visible"))r=geoAnd(r,geoPad(e,s));
    inner.set(e,r);return r;};
  /* e или предок прокручивается: что за его краем — докручивается */
  const scr=e=>{if(top(e))return false;if(scrOf.has(e))return scrOf.get(e);
    const s=sty(e),v=/auto|scroll/.test(s.overflowX+s.overflowY)||(s.position!=="fixed"&&scr(e.parentElement));scrOf.set(e,v);return v;};
  /* обрезка, которая срезает надпись: ближайший предок с overflow, за край которого она торчит;
     прокрутку не считаем — ту докрутят */
  const cutBy=(e,r,th,tv)=>{for(let a=e;!top(a);a=a.parentElement){const s=sty(a);
      if(s.overflowX!=="visible"||s.overflowY!=="visible"){const o=geoOut(r,geoPad(a,s),th,tv);
        if(o)return /auto|scroll/.test(s.overflowX+s.overflowY)?null:{e:a,o,ell:s.textOverflow==="ellipsis"};}
      if(s.position==="fixed")break;}
    return null;};
  const tw=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT,{acceptNode(n){
    if(n.nodeType===1){
      if(n.id==="testout"||n.tagName==="SCRIPT"||n.tagName==="STYLE"||(GEO.fx&&n===GEO.fx&&root!==GEO.fx))return NodeFilter.FILTER_REJECT;
      return n.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})?NodeFilter.FILTER_SKIP:NodeFilter.FILTER_REJECT;}
    return /\S/.test(n.nodeValue)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP;}});
  for(let n=tw.nextNode();n;n=tw.nextNode()){
    const p=n.parentElement;if(!p)continue;
    const cl=innerOf(p);if(!cl)continue;
    R.selectNodeContents(n);let r=null;const lines=[];
    for(const q of R.getClientRects()){if(q.width<.5||q.height<.5)continue;const g=geoD(q);lines.push(g);
      r=r?{x0:Math.min(r.x0,g.x0),y0:Math.min(r.y0,g.y0),x1:Math.max(r.x1,g.x1),y1:Math.max(r.y1,g.y1)}:g;}
    if(!r)continue;
    const vis=geoAnd(r,cl);if(!vis)continue;
    const s=sty(p);let op=1;for(let a=p;a&&a.nodeType===1;a=a.parentElement)op*=+sty(a).opacity;
    const col=geoCol(s.color);if(col&&col[3]*op<.05)continue;   /* прозрачный текст — замысел (место, подсказка для чтеца) */
    texts.push({L:"dom",k:"t",s:n.nodeValue.replace(/\s+/g," ").trim(),r,vis,lines,cl,px:parseFloat(s.fontSize)||0,p,box:box(p),
      scr:scr(p),ctl:p.closest(GEO_CTL),dis:!!p.closest("button:disabled,[aria-disabled=true]"),col,op,z:4,g:0});
  }
  const ctls=[];
  for(const e of root.querySelectorAll(GEO_CTL)){
    if(e.disabled||(GEO.fx&&root!==GEO.fx&&GEO.fx.contains(e)))continue;
    if(!e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}))continue;
    const s=sty(e);if(s.pointerEvents==="none")continue;
    const r=geoD(e.getBoundingClientRect());if(r.x1-r.x0<1||r.y1-r.y0<1)continue;
    const vis=geoAnd(r,s.position==="fixed"?V:innerOf(e.parentElement));if(!vis)continue;
    ctls.push({e,r,vis,scr:s.position!=="fixed"&&scr(e.parentElement)});
  }
  /* окно элемента: ближайший предок с position:fixed. Окно поверх окна — слой, а не брак */
  const layOf=new Map(),layer=e=>{if(top(e))return document.body;if(layOf.has(e))return layOf.get(e);
    const v=sty(e).position==="fixed"?e:layer(e.parentElement);layOf.set(e,v);return v;};
  return {texts,ctls,M,sty,box,cutBy,V,layer};
}

/* ── законы ── */
function geoLaws(D,C,O,vp,where,opt){
  opt=opt||{};
  const F=[],V=D.V,sty=D.sty,big=vp.w*vp.h*.4;
  const add=(law,who,m,extra)=>F.push(Object.assign({law,who,m:Math.round(m*10)/10,where},extra||{}));
  /* порядок рисования: мир (#g, куда видеокарта переносит MAIN_CTX) и слой подписей (#ovl) прозрачны
     для пальца (pointer-events:none) — тычок их не видит, и холст над кнопкой выглядел бы холстом под
     ней. Порядок двух элементов один в любой их общей точке: на миг холст ловит палец,
     elementsFromPoint отдаёт стопку сверху вниз — кто раньше, тот выше */
  /* K — холст надписи: "c" (мир #g), "ov" (#ovl) или сам элемент прочего холста (geoExtra) */
  const CVK={c:document.getElementById("g"),ov:document.getElementById("ovl")},cvMemo=new Map();
  const Kof=a=>(a.t&&a.t.cv)||a.cv||(a.z===0?"c":"ov"),cvEl=K=>typeof K==="string"?CVK[K]:K;
  const cvOver=(K,e,x,y)=>{const c=cvEl(K);if(!c||!c.isConnected||sty(c).display==="none"||x<0||y<0||x>=vp.w||y>=vp.h)return false;
    let m=cvMemo.get(e);if(!m)cvMemo.set(e,m=new Map());if(m.has(c))return m.get(c);
    const pe=c.style.pointerEvents;c.style.pointerEvents="auto";let r=false;
    try{const st=document.elementsFromPoint(x,y),i=st.indexOf(c),j=st.findIndex(q=>q===e||e.contains(q));r=i>=0&&j>=0&&i<j;}
    finally{c.style.pointerEvents=pe;}
    m.set(c,r);return r;};
  /* под сплошным DOM в точке (x,y)? Холст во весь экран — это мир, не крышка. K — слой надписи:
     сплошное, нарисованное ниже её холста, её не прячет; сам её холст — не крышка */
  const coverAt=(x,y,K)=>{if(opt.noCover||x<0||y<0||x>=vp.w||y>=vp.h)return false;const own=K&&cvEl(K);
    for(let e=document.elementFromPoint(x,y);e&&e!==document.body&&e!==document.documentElement;e=e.parentElement){
      if(own&&e===own)return false;
      if(e.tagName==="CANVAS"){const r=e.getBoundingClientRect();return r.width*r.height<.9*vp.w*vp.h&&!(K&&cvOver(K,e,x,y));}
      if(geoOpaque(e,sty(e)))return !(K&&cvOver(K,e,x,y));}
    return false;};
  /* DOM-надпись видна в своей середине: сверху она сама или прозрачное */
  /* окно и виджет. Слой — ближайший fixed-предок. Окно — страница, слой от четверти экрана или
     открытое по просьбе (.open — всплывашка): оно вправе лечь поверх всего, то, что под ним, спрятано,
     а не испорчено. Мелкий fixed — виджет: кнопки рельса, пульт, приёмник, лоток. Виджет на виджете —
     наезд, как внутри одного окна; виджет на чём угодно прячет его не как окно, а портит */
  const winM=new Map(),win=L=>{if(!L||L===document.body||L.classList.contains("open"))return true;if(winM.has(L))return winM.get(L);
    const r=geoAnd(geoD(L.getBoundingClientRect()),V),v=!r||geoArea(r)>=.25*vp.w*vp.h;winM.set(L,v);return v;};
  const plane=(a,b)=>a===b||(!win(a)&&!win(b));
  const hid=new Map(),hideBy=new Map(),by=e=>{const k=geoWho(e).slice(0,48);hideBy.set(k,(hideBy.get(k)||0)+1);},capped=[];
  const domHid=t=>{if(hid.has(t))return hid.get(t);let h=false;
    const x=(t.vis.x0+t.vis.x1)/2,y=(t.vis.y0+t.vis.y1)/2,e=(x>=0&&y>=0&&x<vp.w&&y<vp.h)?document.elementFromPoint(x,y):null;
    if(e&&e!==t.p&&!t.p.contains(e)&&!e.contains(t.p)){
      const Le=D.layer(e),Lt=D.layer(t.p);
      if(Le!==Lt&&win(Le))h=true;   /* под чужим окном */
      else{for(let a=e;a&&a!==document.body&&!a.contains(t.p);a=a.parentElement)if(geoOpaque(a,sty(a))){h=true;break;}
        if(h&&Le!==Lt)capped.push([t,e]);}   /* сплошной чужой виджет лёг на надпись */
      if(h)by(e);}
    hid.set(t,h);return h;};
  /* ── DOM: надписи ── */
  for(const t of D.texts){
    const who=geoWho(t.p),th=1+.05*t.px,tv=1+.15*t.px,f=[],tx={px:t.px,n:t.s.length};
    if(GEO_JUNK.test(t.s))f.push(["мусор",0,{s:t.s.slice(0,40)}]);
    if(t.px&&t.px<8)f.push(["кегль",t.px,{}]);
    const cut=D.cutBy(t.p,t.r,th,tv);
    if(cut){if(!(cut.ell&&(cut.o.side==="l"||cut.o.side==="r"))||t.ctl)
        f.push([cut.ell?"срез…":"срез",cut.o.v,Object.assign({side:GEO_SIDE[cut.o.side],box:geoWho(cut.e)},tx)]);}
    else if(t.box){const o=geoOut(t.r,geoPad(t.box,sty(t.box)),th,tv);
      if(o)f.push(["вылет",o.v,Object.assign({side:GEO_SIDE[o.side],box:geoWho(t.box),r:geoRs(t.r)},tx)]);}
    if(!t.scr){const o=geoEdge(t.r,V);if(o)f.push(["край",o.v,Object.assign({side:GEO_SIDE[o.side]},tx)]);}
    /* контраст: подложка — фоны предков снизу вверх до первого сплошного; картинка на пути — не знаем */
    if(t.col&&!t.dis){const L=[];let base=null;
      for(let a=t.p;a&&a.nodeType===1;a=a.parentElement){const s=sty(a);
        if(s.backgroundImage&&s.backgroundImage!=="none"){base=null;break;}
        const c=geoCol(s.backgroundColor);if(c&&c[3]>0){if(c[3]>=.99){base=c;break;}L.push(c);}}
      if(base){let bg=base;for(let i=L.length-1;i>=0;i--)bg=geoOver(L[i],bg);
        const k=geoContrast(geoOver([t.col[0],t.col[1],t.col[2],t.col[3]*t.op],bg),bg);
        if(k<1.35)f.push(["невидим",k,{s:t.s.slice(0,24)}]);}}
    if(f.length&&!domHid(t))for(const [l,m,x] of f)add(l,who,m,x);
  }
  /* ── DOM: кнопки ── */
  /* тычок в середину: кнопка сверху — видна; под чужим окном или под крышкой во весь экран — спрятана
     (слой); под мелким элементом своего окна — накрыта */
  const small=[],on=[],covC=new Set();
  /* подвал над прокруткой — не крышка, если прокрутка выводит середину кнопки из-под него (запас
     прокрутки в ту сторону ≥ нужного сдвига и между краем прокрутки и подвалом кнопке есть место) */
  const reach=(c,cy,tp)=>{let S=c.e.parentElement;
    for(;S&&S!==document.body;S=S.parentElement){const s=sty(S);if(/(auto|scroll)/.test(s.overflowY)&&S.scrollHeight>S.clientHeight+1)break;}
    if(!S||S===document.body||S.contains(tp))return false;
    const sr=S.getBoundingClientRect(),cr=tp.getBoundingClientRect(),hh=(c.r.y1-c.r.y0)/2;
    const down=S.scrollHeight-S.clientHeight-S.scrollTop,up=S.scrollTop;
    if(cr.top>sr.top+hh*2&&cy-(cr.top-hh-1)<=down)return true;          /* крышка снизу: прокрутить вниз */
    if(cr.bottom<sr.bottom-hh*2&&(cr.bottom+hh+1)-cy<=up)return true;   /* крышка сверху: прокрутить вверх */
    return false;};
  for(const c of D.ctls){const who=geoWho(c.e),cx=(c.vis.x0+c.vis.x1)/2,cy=(c.vis.y0+c.vis.y1)/2;
    const tp=(cx>=0&&cy>=0&&cx<vp.w&&cy<vp.h)?document.elementFromPoint(cx,cy):null;
    if(tp&&tp!==c.e&&!c.e.contains(tp)&&!tp.contains(c.e)){
      const Lp=D.layer(tp);
      if((Lp===D.layer(c.e)||!win(Lp))&&geoArea(geoD(tp.getBoundingClientRect()))<big){if(!reach(c,cy,tp)){add("накрыта",who,0,{by:geoWho(tp)});covC.add(c.e);}}
      else by(tp);
      continue;}
    on.push(c);c.lay=D.layer(c.e);
    if(!c.scr){const o=geoEdge(c.r,V);if(o)add("край",who,o.v,{side:GEO_SIDE[o.side],kind:"кнопка"});}
    if(vp.touch&&geoMin(c.r)<24)small.push(c);}
  for(let i=0;i<on.length;i++){const c=on[i];
    for(let j=i+1;j<on.length;j++){const d=on[j];if(!plane(c.lay,d.lay)||c.e.contains(d.e)||d.e.contains(c.e))continue;
      const x=geoAnd(c.vis,d.vis);if(x&&x.x1-x.x0>=2&&x.y1-x.y0>=2)add("наезд",geoWho(c.e),Math.min(x.x1-x.x0,x.y1-x.y0),{with:geoWho(d.e),kind:"кнопки"});}}
  /* WCAG 2.5.8: мелкая цель годится, если круг в 24 px вокруг неё не задевает чужих целей и чужих кругов */
  const sq=c=>{const x=(c.r.x0+c.r.x1)/2,y=(c.r.y0+c.r.y1)/2;return {x0:x-12,y0:y-12,x1:x+12,y1:y+12};};
  for(const c of small){const s=sq(c);
    const hit=on.some(d=>d!==c&&!c.e.contains(d.e)&&!d.e.contains(c.e)&&(geoAnd(s,d.r)||(small.includes(d)&&geoAnd(s,sq(d)))));
    if(hit)add("цель",geoWho(c.e),geoMin(c.r),{r:geoRs(c.r)});}
  /* ── холст и #ovl: владелец надписи — фигура прямо перед ней, накрывающая якорь и не ниже её ── */
  const own=(A,i,t)=>{for(let j=i-1,seen=0;j>=0&&seen<8;j--,seen++){const b=A[j];if(b.k!=="b")continue;
      if(geoMin(b.r)<6||(b.col?b.col[3]:1)*(b.a==null?1:b.a)<.15||b.r.y1-b.r.y0<t.r.y1-t.r.y0-1)continue;
      if(geoIn(t.an,b.r))return b;}return null;};
  const layers=[["холст",C],["подпись",O.lab],["фишка",O.chip],["прибор",O.ui],["колодка",O.dock],...(opt.x||[])];
  const cvHid=new Map();
  for(const [nm,A] of layers)for(let i=0;i<A.length;i++){const t=A[i];
    if(t.k==="x"){add("мусор",nm,0,{s:t.s});continue;}
    if(t.k!=="t")continue;
    const who=nm+" «"+t.s.slice(0,28)+"»",f=[],tx={px:t.px,n:t.s.length};
    if(!geoFin(t.r)){add("мусор",who,0,{s:"NaN в рамке"});continue;}
    t.vis=t.clip?geoAnd(t.r,t.clip):t.r;if(t.vis&&t.view)t.vis=geoAnd(t.vis,t.view);if(!t.vis)continue;
    if(GEO_JUNK.test(t.s))f.push(["мусор",0,{s:t.s.slice(0,40)}]);
    if(t.px&&t.px<8)f.push(["кегль",t.px,{}]);
    if(t.sq<.8)f.push(["сжатие",Math.round(t.sq*100),{}]);
    if(t.clip){const o=geoOut(t.r,t.clip,1,1);if(o)f.push(["срез",o.v,Object.assign({side:GEO_SIDE[o.side]},tx)]);}
    const b=own(A,i,t);
    if(b){const o=geoOut(t.r,b.r,1,1);if(o)f.push(["вылет",o.v,Object.assign({side:GEO_SIDE[o.side],box:"плашка "+geoRs(b.r),r:geoRs(t.r)},tx)]);
      if(t.col&&b.col&&b.fill&&b.col[3]*b.a>=.9){const bg=[b.col[0],b.col[1],b.col[2],1],k=geoContrast(geoOver([t.col[0],t.col[1],t.col[2],t.col[3]*t.a],bg),bg);
        if(k<1.35)f.push(["невидим",k,{s:t.s.slice(0,24)}]);}}
    if(!t.g&&!t.scr&&(b||nm==="фишка")){const o=geoEdge(t.r,V);if(o)f.push(["край",o.v,Object.assign({side:GEO_SIDE[o.side]},tx)]);}
    if(!t.g){const h=coverAt((t.vis.x0+t.vis.x1)/2,(t.vis.y0+t.vis.y1)/2,Kof(t));cvHid.set(t,h);if(h)continue;}
    for(const [l,m,x] of f)add(l,who,m,x);
  }
  for(const s of GEO.bad)add("мусор","холст",0,{s});
  for(const s of GEO.crash)add("сбой","кадр",0,{s});
  /* ── наезд надписей: все слои. DOM — по строкам, строка ужата до чернил (минус межстрочный воздух).
     Кто сверху: DOM выше #ovl, #ovl выше холста, внутри слоя — кто нарисован позже. Нижняя под
     сплошной плашкой верхней в месте встречи — это слой, не наезд ── */
  const T=[];
  for(const t of D.texts){if(domHid(t))continue;const e=.15*t.px;
    for(const q of t.lines){const r=geoAnd({x0:q.x0,y0:q.y0+e,x1:q.x1,y1:q.y1-e},t.cl);if(r)T.push({r,t,z:4,g:0,nm:"dom"});}}
  for(const [nm,A] of layers)for(const t of A)if(t.k==="t"&&t.vis&&geoFin(t.r)&&!cvHid.get(t))T.push({r:t.vis,t,z:t.z,g:t.g,nm});
  const boxes=[];for(const [,A] of layers)for(const b of A)if(b.k==="b"&&b.fill&&(b.col?b.col[3]:0)*b.a>=.9)boxes.push(b);
  const above=(a,b)=>a.z!==b.z?a.z>b.z:(a.t.n||0)>(b.t.n||0);
  const lbl=a=>a.z===4?geoWho(a.t.p):(a.nm+" «"+a.t.s.slice(0,24)+"»");
  T.sort((a,b)=>a.r.x0-b.r.x0);
  for(let i=0;i<T.length;i++){const a=T[i];
    for(let j=i+1;j<T.length&&T[j].r.x0<a.r.x1;j++){const b=T[j];if(a.t===b.t||a.g!==b.g)continue;
      const x=geoAnd(a.r,b.r);if(!x)continue;const w=x.x1-x.x0,h=x.y1-x.y0;
      if(w<1.5||h<1.5||w*h<.1*Math.min(geoArea(a.r),geoArea(b.r)))continue;
      if(a.z===b.z&&a.t.s===b.t.s&&Math.abs(a.r.x0-b.r.x0)<=3&&Math.abs(a.r.y0-b.r.y0)<=3)continue;   /* тень и обвод той же строки; та же строка в двух слоях — двойная печать, брак */
      const cx=(x.x0+x.x1)/2,cy=(x.y0+x.y1)/2,hi=above(a,b)?a:b,lo=hi===a?b:a;
      if(hi.z===4&&lo.z===4){   /* DOM с DOM: кто сверху в месте встречи */
        const tp=(cx>=0&&cy>=0&&cx<vp.w&&cy<vp.h)?document.elementFromPoint(cx,cy):null;if(!tp)continue;
        const ia=a.t.p.contains(tp)||tp.contains(a.t.p),ib=b.t.p.contains(tp)||tp.contains(b.t.p);
        if(!ia&&!ib)continue;
        const H=ia?a:b,Lo=ia?b:a;let cov=false;
        for(let e=H.t.p;e&&e!==document.body&&!e.contains(Lo.t.p);e=e.parentElement)if(geoOpaque(e,sty(e))){cov=true;break;}
        if(cov)continue;
      }else if(hi.z===4){   /* DOM над холстом: его сплошная подложка или сплошное DOM в месте встречи */
        const K=Kof(lo);let cov=coverAt(cx,cy,K);
        for(let e=hi.t.p;!cov&&e&&e!==document.body;e=e.parentElement){const s=sty(e);if(geoOpaque(e,s)&&geoOut(x,geoD(e.getBoundingClientRect()),0,0)===null&&!cvOver(K,e,cx,cy))cov=true;}
        if(cov)continue;
      }else{   /* холст и #ovl: сплошная фигура между ними по порядку рисования, накрывающая место встречи */
        if(!hi.g&&coverAt(cx,cy,Kof(hi)))continue;
        if(boxes.some(B=>B.g===lo.g&&above({z:B.z,t:B},lo)&&above(hi,{z:B.z,t:B})&&geoOut(x,B.r,0,0)===null))continue;
      }
      const alf=q=>Math.round((q.t.col?q.t.col[3]:1)*(q.z===4?(q.t.op==null?1:q.t.op):(q.t.a==null?1:q.t.a))*100)/100;
      add("наезд",lbl(a),Math.min(w,h),{with:lbl(b),kind:"надписи",al:[alf(a),alf(b)]});
    }
  }
  /* ── чужая надпись на кнопке. Кнопка видна в своей середине (on), надпись не её и лежит на ней
     заметной долей — от четверти меньшей из двух площадей. Кто сверху в середине встречи:
       поверх — надпись (её элемент) над кнопкой того же окна;
       сквозь — кнопка, но не сплошная: надпись видна через неё, а у кнопки своя подпись — две
                подписи в одной рамке. Прозрачная кнопка без своей подписи над холстом — цель
                поверх нарисованной кнопки, подпись на холсте и есть её подпись ── */
  const lab=new Set();for(const t of D.texts)if(t.ctl&&!domHid(t))lab.add(t.ctl);
  /* сквозь — по контрасту, как невидим: надпись под полупрозрачной кнопкой видна, если её след на кнопке
     отличается от кнопки над пустым местом не меньше 1.35:1. Пустое место — фон страницы (растра нет) */
  const ground=(()=>{const c=geoCol(sty(document.body).backgroundColor);return c&&c[3]>=.99?c:[0,0,0,1];})();
  const backOf=p=>{const L=[];for(let a=p;a&&a.nodeType===1;a=a.parentElement){const s=sty(a);   /* как у «невидим» */
      if(s.backgroundImage&&s.backgroundImage!=="none")return null;
      const c=geoCol(s.backgroundColor);if(c&&c[3]>0){if(c[3]>=.99){let bg=c;for(let i=L.length-1;i>=0;i--)bg=geoOver(L[i],bg);return bg;}L.push(c);}}
    return null;};
  const through=(a,c)=>{const bc=geoCol(sty(c.e).backgroundColor),tc=a.t.col;if(!bc||!tc)return 99;
    const ta=tc[3]*(a.z===4?(a.t.op==null?1:a.t.op):(a.t.a==null?1:a.t.a)),g=(a.z===4&&backOf(a.t.p))||ground;
    return geoContrast(geoOver(bc,geoOver([tc[0],tc[1],tc[2],ta],g)),geoOver(bc,g));};
  for(const c of on){const cw=geoWho(c.e),ca=geoArea(c.vis);
    for(const a of T){
      if(a.z===4&&(a.t.ctl===c.e||c.e.contains(a.t.p)))continue;
      const x=geoAnd(a.r,c.vis);if(!x)continue;const w=x.x1-x.x0,h=x.y1-x.y0;
      if(w<2||h<2||w*h<.25*Math.min(geoArea(a.r),ca))continue;
      const cx=(x.x0+x.x1)/2,cy=(x.y0+x.y1)/2,tp=(cx>=0&&cy>=0&&cx<vp.w&&cy<vp.h)?document.elementFromPoint(cx,cy):null;if(!tp)continue;
      /* холст, нарисованный выше кнопки: его надпись лежит на кнопке, какой бы сплошной та ни была
         (у кнопки без своей подписи надпись холста — её подпись) */
      if(a.z<4&&!a.g&&cvOver(Kof(a),c.e,cx,cy)){if(lab.has(c.e))add("поверх",lbl(a),Math.min(w,h),{with:cw,kind:"надпись холста на кнопке"});continue;}
      if(!(tp===c.e||c.e.contains(tp))){
        if(a.z===4&&(tp===a.t.p||a.t.p.contains(tp))&&plane(D.layer(a.t.p),c.lay))add("поверх",lbl(a),Math.min(w,h),{with:cw,kind:"надпись на кнопке"});
        continue;}
      if(!lab.has(c.e))continue;
      let cov=false;
      if(a.z===4){for(let e=tp;e&&e!==document.body&&!e.contains(a.t.p);e=e.parentElement)if(geoOpaque(e,sty(e))){cov=true;break;}}
      else cov=coverAt(cx,cy,Kof(a));
      if(cov)continue;const k=through(a,c);
      if(k>=1.35)add("сквозь",lbl(a),Math.min(w,h),{with:cw,kind:"надпись под кнопкой",k:k>=99?undefined:Math.round(k*100)/100});
    }}
  /* видит ли зрение экран: сколько кнопок и надписей видно и что закрывает остальное (geoRun) */
  let txtHid=0;for(const t of D.texts)if(domHid(t))txtHid++;
  for(const [t,e] of capped)if(!(t.ctl&&covC.has(t.ctl)))add("накрыта",geoWho(t.p),0,{by:geoWho(e),kind:"надпись под виджетом"});   /* подпись накрытой кнопки — та же находка */
  F.st={ctl:D.ctls.length,on:on.length,txt:D.texts.length,txtHid,by:[...hideBy].sort((a,b)=>b[1]-a[1]).slice(0,2).map(([k,n])=>k+" ×"+n).join("; ")};
  return F;
}

/* ── композиция: заметки, не брак ──
   ровно — соседние кнопки одного родителя: ближний из трёх краёв (начало, середина, конец) поперёк
   ряда расходится на 1–4 px. Ровно — до пикселя, нарочно — заметно больше; между ними — промах.
   шаг — ряд из трёх и больше: зазоры разнятся на 1.5–8 px и на шестую долю.
   φ — окно висит ниже середины (оптический центр выше геометрического: верхнее поле к сумме полей
   — от 0.382 до 0.5) или сдвинуто вбок от середины больше чем на 5 % ── */
function geoCompose(D,vp,where){
  const N=[],add=(law,who,m,extra)=>N.push(Object.assign({law,who,m:Math.round(m*100)/100,where},extra||{}));
  const on=c=>c.vis&&c.r.x1-c.r.x0>=4&&c.r.y1-c.r.y0>=4&&c.r.x0>=0&&c.r.y0>=0&&c.r.x1<=vp.w&&c.r.y1<=vp.h;
  const G=new Map();for(const c of D.ctls)if(on(c)){const p=c.e.parentElement;if(!G.has(p))G.set(p,[]);G.get(p).push(c);}
  for(const A of G.values()){if(A.length<2)continue;
    for(const ax of [0,1]){   /* 0 — столбец (сверху вниз), 1 — строка (слева направо) */
      const lo=ax?"x0":"y0",hi=ax?"x1":"y1",plo=ax?"y0":"x0",phi=ax?"y1":"x1";
      const S=A.slice().sort((a,b)=>a.r[lo]-b.r[lo]);let run=[S[0]];
      const flush=()=>{if(run.length<3)return;const g=[];for(let i=1;i<run.length;i++)g.push(run[i].r[lo]-run[i-1].r[hi]);
        const mn=Math.min(...g),mx=Math.max(...g);
        if(mn>=0&&mx-mn>1.5&&mx-mn<=8&&(mx-mn)/mx>1/6)add("шаг",geoWho(run[0].e),mx-mn,{with:geoWho(run[run.length-1].e),g:g.map(v=>Math.round(v*10)/10)});};
      for(let i=1;i<S.length;i++){const a=S[i-1].r,b=S[i].r;
        const o=Math.min(a[phi],b[phi])-Math.max(a[plo],b[plo]);
        if(o>=.5*Math.min(a[phi]-a[plo],b[phi]-b[plo])&&b[lo]>=a[hi]-.5){   /* соседи: перекрыты поперёк, не перекрыты вдоль */
          const d=Math.min(Math.abs(a[plo]-b[plo]),Math.abs(a[phi]-b[phi]),Math.abs(a[plo]+a[phi]-b[plo]-b[phi])/2);
          if(d>1&&d<=4)add("ровно",geoWho(S[i-1].e),d,{with:geoWho(S[i].e),side:ax?"в строке":"в столбце"});
          run.push(S[i]);}
        else{flush();run=[S[i]];}}
      flush();}}
  for(const e of document.querySelectorAll(".scr.open")){const r=geoD(e.getBoundingClientRect()),a=(r.x1-r.x0)*(r.y1-r.y0);
    if(a<.1*vp.w*vp.h||a>.9*vp.w*vp.h)continue;
    const t=r.y0,b=vp.h-r.y1,l=r.x0,rt=vp.w-r.x1;
    if(t>4&&b>4&&t/(t+b)>.55)add("φ",geoWho(e),t/(t+b),{side:"ниже середины"});
    if(l>4&&rt>4&&Math.abs(l/(l+rt)-.5)>.05)add("φ",geoWho(e),l/(l+rt),{side:"вбок от середины"});}
  return N;
}

/* ── тест теста: заложенные поломки обязаны найтись, чистое — нет. Всё в квадрате 300×300 ── */
function geoSelf(vp){
  const fx=document.createElement("div");fx.id="geofx";
  fx.style.cssText="position:fixed;left:0;top:0;width:300px;height:300px;z-index:2147483647;font:12px monospace;background:#101418;color:#fff";
  const B="background:#234;border:0;color:#fff;font:12px monospace;position:absolute;";
  fx.innerHTML=
    '<button style="'+B+'left:10px;top:8px;width:60px;height:24px;white-space:nowrap;overflow:visible;padding:0 4px;border:1px solid #9cf">ПРОВЕРКА ВЫЛЕТА</button>'+
    '<div style="position:absolute;left:10px;top:40px;white-space:nowrap">НАЛОЖЕНИЕ ПЕРВОЕ</div>'+
    '<div style="position:absolute;left:40px;top:43px;white-space:nowrap">НАЛОЖЕНИЕ ВТОРОЕ</div>'+
    '<button style="'+B+'position:fixed;left:-40px;top:70px;width:90px;height:28px">КРАЙ ЭКРАНА</button>'+
    '<div style="position:absolute;left:10px;top:105px;width:60px;height:18px;overflow:hidden;white-space:nowrap"><span>СРЕЗАННАЯ ДЛИННАЯ СТРОКА</span></div>'+
    '<div style="position:absolute;left:10px;top:130px;background:#345;color:#345;padding:2px">НЕВИДИМКА</div>'+
    '<div style="position:absolute;left:10px;top:155px;background:#111;color:#fff">цена NaN ₽</div>'+
    '<button style="'+B+'left:10px;top:180px;width:12px;height:12px;padding:0"></button>'+
    '<button style="'+B+'left:24px;top:176px;width:40px;height:22px;padding:0">СОСЕД</button>'+
    '<button style="'+B+'left:10px;top:210px;width:100px;height:30px">ПОД ПЛАШКОЙ</button>'+
    '<div style="position:absolute;left:30px;top:210px;width:60px;height:30px;background:#543"></div>'+
    '<button style="'+B+'left:10px;top:255px;width:220px;height:32px;border:1px solid #9cf">ЧИСТАЯ ПЛАШКА</button>'+
    /* чужая надпись на кнопке: сверху (поверх) и под прозрачной кнопкой со своей подписью (сквозь);
       подписи кнопок в стороне от чужих строк — тут не наезд, а именно чужая надпись в рамке */
    '<button style="'+B+'left:160px;top:70px;width:120px;height:30px;border:1px solid #9cf">КНОПКА</button>'+
    '<div style="position:absolute;left:250px;top:78px;white-space:nowrap">ЧУЖАЯ</div>'+
    '<div style="position:absolute;left:190px;top:132px;white-space:nowrap">ПОДЛОЖКА</div>'+
    '<button style="'+B+'left:150px;top:112px;width:140px;height:40px;background:transparent;border:1px solid #9cf;display:flex;align-items:flex-start;justify-content:flex-start;padding:2px 4px">ВЕРХ</button>'+
    /* виджеты — мелкие fixed, каждый свой слой одной плоскости: чужая строка на кнопке виджета
       (середина кнопки свободна), надпись под сплошной плашкой другого виджета, чистый виджет рядом */
    '<button style="'+B+'position:fixed;left:160px;top:200px;width:130px;height:40px;display:flex;align-items:flex-start;justify-content:flex-start;padding:2px 4px">ВИДЖЕТ</button>'+
    '<div style="position:fixed;left:220px;top:224px;white-space:nowrap">ПРИШЕЛЕЦ</div>'+
    '<div style="position:fixed;left:160px;top:165px;white-space:nowrap">ПОД ВИДЖЕТОМ</div>'+
    '<div style="position:fixed;left:150px;top:160px;width:110px;height:24px;background:#234"></div>'+
    '<button style="'+B+'position:fixed;left:240px;top:258px;width:52px;height:26px;padding:0">ЧИСТО</button>'+
    /* прочие холсты: ужатый вдвое (12 px холста — 6 px на экране) и плашка с длинной подписью рядом с чистой */
    '<canvas id="geocvA" width="240" height="40" style="position:absolute;left:170px;top:6px;width:120px;height:20px"></canvas>'+
    '<canvas id="geocvB" width="120" height="36" style="position:absolute;left:170px;top:28px;width:120px;height:36px"></canvas>'+
    /* холст движка: выпечка (panelGpu, как стол и опись) с той же длинной подписью на короткой плашке */
    '<canvas id="geocvC" style="position:absolute;left:10px;top:292px;width:120px;height:24px"></canvas>'+
    /* и слой (ovPaint: ovRect, ovText — как приборы на своих холстах) */
    '<canvas id="geocvD" width="120" height="24" style="position:absolute;left:140px;top:292px;width:120px;height:24px"></canvas>';
  document.body.appendChild(fx);GEO.fx=fx;
  let F=[],bk=false;
  try{geoHookAll();geoHookOvl();
    const a=fx.querySelector("#geocvA").getContext("2d"),b=fx.querySelector("#geocvB").getContext("2d");
    a.font="12px monospace";a.fillStyle="#fff";a.fillText("МЕЛКО",4,20);
    b.font="12px monospace";b.fillStyle="#234";b.fillRect(2,2,50,16);b.fillStyle="#fff";b.fillText("ХОЛСТ ВЫЛЕТ",6,14);
    b.fillStyle="#234";b.fillRect(2,20,110,14);b.fillStyle="#fff";b.fillText("ЧИСТО",6,31);
    /* холсты движка видны только счётной видеокарте: её кадр знает свой холст (view.__cv). При ней обе
       находки обязательны — переименованная печь или кисть слоя ослепили бы зрение молча */
    const cC=fx.querySelector("#geocvC"),cD=fx.querySelector("#geocvD");
    try{bk=!!cC.getContext("webgpu").getCurrentTexture().createView().__cv;}catch(e){bk=false;}
    if(bk){
      try{panelGpu(cC,120,24,1,g=>{g.font="12px monospace";g.fillStyle="#234";g.fillRect(2,2,40,18);g.fillStyle="#fff";g.fillText("ВЫПЕЧКА ВЫЛЕТ",6,15);});}catch(e){}
      try{ovPaint(cD,1,()=>{ovRect(2,2,42,20,"#234",1);ovText(OVL.uq,6,15,"СЛОЙ ВЫЛЕТ","12px monospace","#fff","left","alphabetic",1,1);return true;});}catch(e){}}
    F=geoLaws(geoDom(fx,vp),[],{lab:[],chip:[],ui:[],dock:[]},vp,"тест теста",{x:geoExtra(vp,fx)});}
  finally{fx.remove();GEO.fx=null;}
  /* холст: плашка с длинной подписью, две наезжающие строки, NaN, сжатие вдвое, чистая плашка */
  const c=MAIN_CTX;geoHookCtx(c);
  GEO.c.length=0;GEO.bad.length=0;GEO.crash.length=0;GEO.n=0;for(const q in GEO.ov)GEO.ov[q].length=0;
  const rc=cvs.getBoundingClientRect();GEO.k=(rc.width>0)?cvs.width/rc.width:1;
  c.save();c.setTransform(GEO.k,0,0,GEO.k,0,0);c.font="12px monospace";c.textBaseline="alphabetic";c.textAlign="left";c.globalAlpha=1;
  GEO.on=true;
  try{
    c.fillStyle="#234";c.fillRect(10,10,60,20);c.fillStyle="#fff";c.fillText("ПЛАШКА С ДЛИННЫМ ТЕКСТОМ",14,24);
    c.fillText("СТРОКА ОДИН",10,60);c.fillText("СТРОКА ДВА",30,63);
    c.fillText("НЕ ЧИСЛО",NaN,80);
    c.fillText("СЖАТО ВДВОЕ ДЛИННАЯ",10,100,60);
    c.fillStyle="#234";c.fillRect(10,120,200,22);c.fillStyle="#fff";c.fillText("ЧИСТО",16,135);
  }finally{GEO.on=false;c.restore();}
  const D0={texts:[],ctls:[],M:new Map(),sty:e=>getComputedStyle(e),V:{x0:0,y0:0,x1:vp.w,y1:vp.h},cutBy:()=>null};
  F=F.concat(geoLaws(D0,GEO.c.slice(),{lab:[],chip:[],ui:[],dock:[]},vp,"тест теста",{noCover:true}));
  GEO.c.length=0;GEO.bad.length=0;
  try{c.save();c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,cvs.width,cvs.height);c.restore();}catch(e){}
  const has=(law,re)=>F.some(f=>f.law===law&&re.test(f.who+" "+(f.with||"")+" "+(f.s||"")));
  const need=[["вылет",/ПРОВЕРКА ВЫЛЕТА/],["наезд",/НАЛОЖЕНИЕ/],["край",/КРАЙ ЭКРАНА/],["срез",/СРЕЗАННАЯ/],["невидим",/НЕВИДИМКА/],
    ["мусор",/NaN/],["накрыта",/ПОД ПЛАШКОЙ/],["вылет",/ПЛАШКА С ДЛИННЫМ/],["наезд",/СТРОКА ОДИН|СТРОКА ДВА/],["мусор",/НЕ ЧИСЛО/],["сжатие",/СЖАТО/],
    ["поверх",/ЧУЖАЯ/],["сквозь",/ПОДЛОЖКА/],["поверх",/ПРИШЕЛЕЦ/],["накрыта",/ПОД ВИДЖЕТОМ/],["кегль",/МЕЛКО/],["вылет",/ХОЛСТ ВЫЛЕТ/]];
  if(vp.touch)need.push(["цель",/button/]);
  if(bk)need.push(["вылет",/ВЫПЕЧКА ВЫЛЕТ/],["вылет",/СЛОЙ ВЫЛЕТ/]);
  const miss=need.filter(([l,re])=>!has(l,re)).map(([l,re])=>l+" "+re.source);
  /* композиция: два соседа столбцом, левые края врозь на 2 px — заметка «ровно»; ровная пара рядом — без заметки */
  const cx=document.createElement("div");cx.style.cssText="position:fixed;left:140px;top:150px;width:150px;height:60px";
  const bt=(l,t,s)=>'<button style="position:absolute;left:'+l+'px;top:'+t+'px;width:60px;height:24px;padding:0">'+s+'</button>';
  cx.innerHTML='<div>'+bt(0,0,"РОВНО А")+bt(2,30,"РОВНО Б")+'</div><div>'+bt(80,0,"ЧИСТО В")+bt(80,30,"ЧИСТО Г")+'</div>';
  document.body.appendChild(cx);let NC=[];try{NC=geoCompose(geoDom(cx,vp),vp,"тест теста");}finally{cx.remove();}
  need.push(["ровно",/РОВНО/]);if(!NC.some(n=>n.law==="ровно"&&/РОВНО/.test(n.who+" "+(n.with||""))))miss.push("ровно РОВНО");
  const dirty=F.concat(NC).filter(f=>/ЧИСТАЯ ПЛАШКА|ЧИСТО/.test(f.who+" "+(f.with||""))).map(f=>f.law+": "+f.who);
  return {ok:!miss.length&&!dirty.length,need:need.length,found:need.length-miss.length,miss,dirty,n:F.length};
}

/* ── экраны: сцены look, вкладки станции и стола, меню. С каждого — тычок в каждую РАЗНУЮ кнопку
   (метка без цифр), новый экран (подпись: режим, открытые окна, набор кнопок) смотрится ── */
function geoRich(){T.go();T.give("late");G.credits=900000;G.fuel=10;G.hull=40;G.data=9000;for(const k of RES_KEYS)G.cargo[k]=6;}
function geoStation(t){if(!G.sys.station)return false;
  const st=document.getElementById("station");
  if(!st||!st.classList.contains("open")){G.st=G.sys.station;G.mode="dock";openStation();}
  tab=t;renderTab();return true;}
function geoTable(t){if(!tableOpenNow)tableToggle(true);tableSetTab(t);return true;}
function geoScreens(){
  const L=[];
  for(const sc of lookScenes())L.push({name:"сцена «"+sc.id+"»",open:()=>T.go(sc.id)&&G.mode!=="none",restore:()=>T.go(sc.id),body:null,dd:"hud"});
  let st=[],tb=[];
  try{geoRich();if(G.sys.station){G.st=G.sys.station;G.mode="dock";openStation();st=[...document.querySelectorAll("#stTabs button")].map(b=>b.dataset.tab).filter(Boolean);closeStation();}}catch(e){}
  try{geoRich();tableToggle(true);tb=[...document.querySelectorAll("#tableTabs button")].map(b=>b.dataset.tab).filter(Boolean);tableToggle(false);}catch(e){}
  for(const t of st)L.push({name:"станция/"+t,open:()=>{geoRich();return geoStation(t);},restore:()=>geoStation(t),body:"#stBody",dd:"st/"+t});
  for(const t of tb)L.push({name:"стол/"+t,open:()=>{geoRich();return geoTable(t);},restore:()=>geoTable(t),body:"#tableBody",dd:"tb/"+t});
  const menu=()=>{toggleMenu(true);return true;};
  L.push({name:"меню",open:()=>{geoRich();return menu();},restore:menu,body:"#menu",dd:"menu"});
  /* окна .scr, куда не ведут ни вкладки, ни тычки: открыватели по имени (typeof — сборка без
     окна обход не роняет). Окно, которого зрение так и не видело открытым, — слепое пятно (geoRun) */
  const fn=(n,...a)=>typeof window[n]==="function"&&window[n](...a)!==false;
  const isOpen=id=>{const e=document.getElementById(id);return !!e&&e.classList.contains("open");};
  const WIN=[["opts",()=>{const b=document.getElementById("optbtn");if(b)b.click();return !!b;}],
    ["pricewin",()=>fn("pricesOpen")],["dealview",()=>fn("openDeal")],["hqview",()=>fn("openHq")],
    ["crewview",()=>fn("openCrewView",(G.crew||[])[0]||null)],
    /* баржа — дело часа и случая (12l: окно времени, 60 % на плечо): ближайшая система, где она есть сейчас */
    ["barge",()=>{const has=()=>(G.barges||[]).length>0;
      for(let d=0;d<=8&&!has();d++)for(let dx=-d;dx<=d&&!has();dx++)for(let dy=-d;dy<=d&&!has();dy++){
        if(Math.max(Math.abs(dx),Math.abs(dy))!==d||!starAt(dx,dy))continue;
        const s=getSystem(dx,dy);G.sx=s.sx;G.sy=s.sy;G.sys=s;fn("spawnBarges");}
      const b=(G.barges||[])[0];return !!b&&fn("openBarge",b);}],
    ["roadwin",()=>fn("roadOpen")]];
  for(const [id,f] of WIN)L.push({name:"окно "+id,open:()=>{geoRich();return f()&&isOpen(id);},restore:()=>isOpen(id)||(f()&&isOpen(id)),body:"#"+id,dd:"win/"+id});
  return L;
}
function geoLbl(b){return (b.textContent.replace(/[\d\s.,:+\-−%₽×]+/g," ").trim()||b.getAttribute("aria-label")||b.getAttribute("title")||"").slice(0,24);}
function geoBtns(sel){const r=sel?document.querySelector(sel):document.body;if(!r)return [];
  return [...r.querySelectorAll(GEO_CTL)].filter(e=>!e.disabled&&e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})&&(!GEO.fx||!GEO.fx.contains(e)));}
function geoSig(){
  const open=[...document.querySelectorAll(".scr.open")].map(e=>e.id).join(",");
  return G.mode+"|"+document.body.className+"|"+open+"|"+geoBtns(null).map(geoLbl).sort().join("|");
}
/* окна игры открываются классом open (их закрыватели его же и снимают). Окно, открытое тычком, само
   не закроется: #kbWin из «КБ · ЧЕРТЁЖ» лёг поверх семидесяти следующих экранов. Закрыть всё, чего
   не было в base */
function geoShut(base){document.querySelectorAll(".open").forEach(e=>{if(!base||!base.has(e))e.classList.remove("open");});}
function geoCalm(){
  try{if(document.body.classList.contains("road")&&typeof roadClose==="function")roadClose();}catch(e){}   /* свой rAF, таймер, звук */
  try{if(G.mode==="barge"&&typeof closeBarge==="function")closeBarge();}catch(e){}
  try{T.calm();}catch(e){}try{closeStation();}catch(e){}try{if(tableOpenNow)tableToggle(false);}catch(e){}
  geoShut(GEO.base0);document.body.classList.remove("table","screen");}

/* экран в покое: появление окна (.scr.open — scrIn, 0.22 с) и прочие переходы — к концу;
   синхронный обход иначе видит окно на нулевой непрозрачности. Бесконечные не трогаем */
function geoSettle(){for(const a of document.getAnimations()){try{const t=a.effect&&a.effect.getTiming();if(t&&t.iterations!==Infinity)a.finish();}catch(e){}}}
/* главный вход: {vp, font, self, screens, clicks, findings, errs, ms}. Сеть, окна и диалоги — заглушки */
function geoRun(o){
  o=o||{};const t0=performance.now();
  const coarse=matchMedia("(pointer:coarse)").matches;
  const vp={w:innerWidth,h:innerHeight,touch:o.touch!=null?!!o.touch:coarse,coarse,dpr:devicePixelRatio};
  const keep={open:window.open,fetch:window.fetch,alert:window.alert,confirm:window.confirm,prompt:window.prompt};
  window.open=()=>null;window.fetch=()=>Promise.reject(new Error("зрение: сети нет"));window.alert=()=>{};window.confirm=()=>false;window.prompt=()=>null;
  /* плашка тестов (#testout) лежит поверх всей игры: тычок в любую точку ловил её — на время осмотра её нет */
  const tout=document.getElementById("testout"),tdisp=tout?tout.style.display:"";if(tout)tout.style.display="none";
  const out={vp,font:geoFontProbe(),self:null,screens:0,clicks:0,drew:0,findings:[],errs:[],seen:[],blind:[],sum:{ctl:0,on:0,txt:0,vis:0},tm:{},ms:0,geo:o.geo?[]:null,notes:[]};
  GEO.base0=new Set(document.querySelectorAll(".open"));geoHookAll();geoHookOvl();
  try{
    try{out.self=geoSelf(vp);}catch(e){out.self={ok:false,miss:["тест теста бросил: "+(e&&e.message)],dirty:[],need:0,found:0};}
    const seen=new Set(),clicked=new Set(),cap=o.clicks==null?200:o.clicks;
    const tm=out.tm,clk=(k,t)=>{tm[k]=(tm[k]||0)+performance.now()-t;};
    /* экран, только что открытый своим открывателем, обязан быть виден: из его кнопок (≥2) хоть одна
       сверху. Иначе его закрыло чужое окно — зрение смотрит не туда */
    const under=(where,body,D)=>{const R=body&&document.querySelector(body);if(!R)return;
      let n=0,top=0,cover=null;
      for(const c of D.ctls){if(!R.contains(c.e)||!c.vis)continue;   /* видимая доля: прокрученное за край — не в счёт */
        const x=(c.vis.x0+c.vis.x1)/2,y=(c.vis.y0+c.vis.y1)/2;if(x<0||y<0||x>=vp.w||y>=vp.h)continue;n++;
        const tp=document.elementFromPoint(x,y);if(tp&&(tp===c.e||c.e.contains(tp)||tp.contains(c.e)))top++;else if(tp&&!R.contains(tp)&&!cover)cover=tp;}
      if(n>=2&&!top){let w=cover;while(w&&w.parentElement&&w!==document.body&&getComputedStyle(w).position!=="fixed")w=w.parentElement;
        out.blind.push(where+": экран под чужим окном — "+(w?geoWho(w).slice(0,48):"?")+(cover&&cover!==w?" · "+geoWho(cover).slice(0,40):""));}};
    const look=(where,body)=>{let t=performance.now();geoSettle();
      /* окно во весь экран со сплошным фоном прячет холст целиком — кадр не нужен */
      /* дорога — экран во весь лист со своим кадром: его и пишем */
      const road=document.body.classList.contains("road")&&typeof drawRoad==="function"&&typeof RD!=="undefined"&&!!RD;
      const full=!road&&(document.body.classList.contains("screen")||   /* игра сама убрала мир и приборы (27l, 28-loop) */
        [...document.querySelectorAll(".scr.open")].some(e=>{const r=e.getBoundingClientRect();return r.width*r.height>=.9*vp.w*vp.h&&geoOpaque(e,getComputedStyle(e));}));
      if(road){if(geoRoadFrame())out.drew++;}
      else if(full){GEO.c.length=0;for(const q in GEO.ov)GEO.ov[q].length=0;GEO.bad.length=0;GEO.crash.length=0;}
      else if(geoFrame())out.drew++;
      clk("frame",t);t=performance.now();
      const D=geoDom(document.body,vp);clk("dom",t);t=performance.now();if(body)under(where,body,D);
      const nt=A=>A.reduce((n,x)=>n+(x.k==="t"),0),X=geoExtra(vp);
      out.seen.push([where,D.texts.length,D.ctls.length,nt(GEO.c),nt(GEO.ov.lab),nt(GEO.ov.chip),nt(GEO.ov.ui),nt(GEO.ov.dock),[...document.querySelectorAll(".scr.open")].map(e=>e.id).join(","),
        X.map(([n,A])=>n.replace(/^холст /,"")+":"+nt(A)).join(" ")]);
      /* o.geo — где стоит каждая надпись (CSS): прогон сверяет одно окно при двух DPR */
      if(out.geo){const A=[],r1=v=>Math.round(v*10)/10,put=(L,t,f)=>{if(t.k==="t"&&t.r)A.push([L,String(t.s).slice(0,40),r1(t.r.x0),r1(t.r.y0),r1(t.r.x1),r1(t.r.y1),r1(t.px||0),f||0]);};
        /* надпись под идущей анимацией или переходом ещё едет — в сверку не годится */
        const an=new Set();try{for(const a of document.getAnimations()){const e=a.effect&&a.effect.target;if(e)an.add(e);}}catch(e){}
        const mv=e=>{for(let x=e;x;x=x.parentElement)if(an.has(x))return 1;return 0;};
        for(const t of D.texts)put("dom",t,an.size?mv(t.p):0);for(const t of GEO.c)put("холст #c",t);for(const q in GEO.ov)for(const t of GEO.ov[q])put("слой "+q,t);
        for(const [n,L] of X)for(const t of L)put(n,t);out.geo.push([where,A]);}
      const F=geoLaws(D,GEO.c,GEO.ov,vp,where,{x:X}),st=F.st;
      for(const f of F)out.findings.push(f);for(const f of geoCompose(D,vp,where))out.notes.push(f);out.screens++;out.sum.ctl+=st.ctl;out.sum.on+=st.on;out.sum.txt+=st.txt;out.sum.vis+=st.txt-st.txtHid;
      /* слепота: кнопки есть — ни одной не видно, надписи есть — все спрятаны. Так было, пока плашка
         тестов лежала поверх игры: все законы DOM молчали, прогон — зелёный */
      if((st.ctl>=2&&!st.on)||(st.txt>=5&&st.txtHid>=st.txt))out.blind.push(where+": закрыто всё ("+st.on+"/"+st.ctl+" кнопок, "+(st.txt-st.txtHid)+"/"+st.txt+" надписей) — "+(st.by||"?"));
      clk("laws",t);};
    const tryDo=(fn,where)=>{try{return fn()!==false;}catch(e){out.errs.push(where+": "+(e&&e.message));return false;}};
    for(const S of geoScreens()){
      let t=performance.now();const ok=tryDo(S.open,S.name);clk("open",t);
      if(!ok){geoCalm();continue;}
      seen.add(geoSig());look(S.name,S.body);
      const base=new Set(document.querySelectorAll(".open"));
      const labels=[...new Set(geoBtns(S.body).map(geoLbl))].filter(l=>l&&!GEO_DANGER.test(l)&&!clicked.has(S.dd+"|"+l)).slice(0,16);
      for(const l of labels){
        if(out.clicks>=cap)break;
        clicked.add(S.dd+"|"+l);
        t=performance.now();
        geoShut(base);
        if(!tryDo(S.restore,S.name))break;
        const b=geoBtns(S.body).find(e=>geoLbl(e)===l);if(!b)continue;
        out.clicks++;
        if(!tryDo(()=>{b.click();},S.name+" › «"+l+"»"))continue;
        const sg=geoSig();clk("click",t);if(seen.has(sg))continue;seen.add(sg);
        look(S.name+" › «"+l+"»");
      }
      geoCalm();
    }
    /* слепые пятна: окна страницы, которых зрение ни разу не видело открытыми */
    const saw=new Set();for(const s of out.seen)for(const id of String(s[8]).split(","))if(id)saw.add(id);
    out.unseen=[...document.querySelectorAll(".scr[id]")].map(e=>e.id).filter(id=>!saw.has(id));
  }catch(e){out.errs.push("обход: "+(e&&e.stack||e));}
  finally{Object.assign(window,keep);if(tout)tout.style.display=tdisp;}
  out.ms=Math.round(performance.now()-t0);if(GEO.tm)for(const k in GEO.tm)out.tm["f."+k]=GEO.tm[k];GEO.tm=null;
  return out;
}
/* шрифт, которым игра меряет строку: ширина «0» в долях кегля (холст и DOM) */
function geoFontProbe(){
  const c=document.createElement("canvas").getContext("2d"),o={};
  for(const f of ["ui-monospace,monospace","monospace","Consolas"]){
    c.font="100px "+f;
    const e=document.createElement("span");e.style.cssText="position:absolute;visibility:hidden;white-space:pre;font:100px "+f;e.textContent="0000000000";
    document.body.appendChild(e);const dom=e.getBoundingClientRect().width/1000;e.remove();
    o[f]=Math.round(c.measureText("0").width*10)/1000+"/"+Math.round(dom*1000)/1000;}
  const k=o["ui-monospace,monospace"].split("/");o.canvas=+k[0];o.dom=+k[1];
  return o;
}
