/* ══════════════ планета заново: состояние, мерка, математика (M610) ══════════════
   Поверхность перепридумана целиком (docs/DESIGN-planet.md, «Сцена»): земля —
   объёмная лента в три плана, один ключевой свет с настоящей тенью, один воздух.
   Старые рисовалки (21e, 21e1) не правятся и живут рядом: новый вид стоит за
   переключателем, пока не сдан весь (M652). Как он встаёт в кадр движка —
   docs/DESIGN-planet-engine.md.

   Семейство 21p…: все имена начинаются с pln/PLN — область видимости у игры
   одна, и свои `smooth` или `ridged` здесь затёрли бы чужие.

   Мир планеты — в МЕТРАХ: x вдоль линии ходьбы, y вверх, z от объектива вглубь.
   У игры единицы свои и y растёт вниз; человек в ней ростом 23.6 единицы, в
   новом виде — 1.8 м, отсюда мерка. */
const PLN_M=13.1;                     /* единиц игры в метре */
const PLN={on:false,                  /* переключатель: ?pln=1 или PLN.on=true со стенда */
  err:"",bad:0,                       /* последний сбой нового вида и сколько их было подряд */
  y0:900,                             /* уровень игры, принятый за ноль высоты (ставит кадр) */
  cam:null,sun:null,                  /* объектив и свет последнего кадра */
  near:0,                             /* ближний объектив: 0 — дальний (игра), 1 — вдвое ближе (у вещи, стенд) */
  stat:{},                            /* что построено и сколько стоило: для замера и стенда */
  warm:-1,                            /* поколение устройства, под которое посадка уже согрела набор растений (21pz) */
  log:[]};                            /* что сказали шейдеры и видеокарта: не больше сорока строк */
try{PLN.on=/[?&]pln=1(&|$)/.test(location.search||"");}catch(e){}
function plnLog(s){if(PLN.log.length<40)PLN.log.push(String(s).slice(0,400));}
function plnX(X){return X/PLN_M;}
function plnY(Y){return (PLN.y0-Y)/PLN_M;}
function plnXu(x){return x*PLN_M;}
function plnYu(y){return PLN.y0-y*PLN_M;}

const PLN_DEG=Math.PI/180;
function plnSmooth(a,b,x){const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);}
function plnMix3(a,b,t){return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];}
function plnAdd(a,b){return [a[0]+b[0],a[1]+b[1],a[2]+b[2]];}
function plnSub(a,b){return [a[0]-b[0],a[1]-b[1],a[2]-b[2]];}
function plnMul(a,s){return [a[0]*s,a[1]*s,a[2]*s];}
function plnDot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
function plnCross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function plnLen(a){return Math.hypot(a[0],a[1],a[2]);}
function plnNorm(a){const l=Math.hypot(a[0],a[1],a[2])||1;return [a[0]/l,a[1]/l,a[2]/l];}
function plnRotY(p,a){const c=Math.cos(a),s=Math.sin(a);return [p[0]*c+p[2]*s,p[1],-p[0]*s+p[2]*c];}
function plnRotZ(p,a){const c=Math.cos(a),s=Math.sin(a);return [p[0]*c-p[1]*s,p[0]*s+p[1]*c,p[2]];}
function plnRotX(p,a){const c=Math.cos(a),s=Math.sin(a);return [p[0],p[1]*c-p[2]*s,p[1]*s+p[2]*c];}
/* цвет вершины — линейный: свет считается в линейном, в тона экрана кадр
   переводит свёртка (21pd) */
function plnHex(s){
  const n=parseInt(s.slice(1),16),f=v=>Math.pow(v/255,2.2);
  return [f(n>>16&255),f(n>>8&255),f(n&255)];
}
function plnRgb(c){const f=v=>Math.pow(clamp(v,0,255)/255,2.2);return [f(c[0]),f(c[1]),f(c[2])];}

/* ── шум стенда ──
   Формы дальних планов подобраны на стенде под ЭТОТ шум (градиентный, −1…1):
   с шумом игры (значений, 0…1) те же числа дали бы другие горы. */
function plnHash(ix,iy,s){
  let h=Math.imul(ix|0,374761393)^Math.imul(iy|0,668265263)^Math.imul(s|0,1274126177);
  h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;
  return (h>>>0)/4294967296;
}
function plnNoise(x,y,s){
  const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
  const ux=fx*fx*fx*(fx*(fx*6-15)+10),uy=fy*fy*fy*(fy*(fy*6-15)+10);
  const a0=plnHash(ix,iy,s)*TAU,a1=plnHash(ix+1,iy,s)*TAU,a2=plnHash(ix,iy+1,s)*TAU,a3=plnHash(ix+1,iy+1,s)*TAU;
  const a=Math.cos(a0)*fx+Math.sin(a0)*fy,b=Math.cos(a1)*(fx-1)+Math.sin(a1)*fy,
        c=Math.cos(a2)*fx+Math.sin(a2)*(fy-1),d=Math.cos(a3)*(fx-1)+Math.sin(a3)*(fy-1);
  return (a+(b-a)*ux+(c-a)*uy+(a-b-c+d)*ux*uy)*1.41;
}
function plnFbm(x,y,oct,s){
  let v=0,a=.5,f=1,n=0;
  for(let i=0;i<oct;i++){v+=a*plnNoise(x*f,y*f,s+i*19);n+=a;a*=.5;f*=2.02;}
  return v/n;
}
/* гребни: острые хребты, 0…1 */
function plnRidged(x,y,oct,s){
  let v=0,a=.5,f=1,n=0,w=1;
  for(let i=0;i<oct;i++){
    let r=1-Math.abs(plnNoise(x*f,y*f,s+i*23));r*=r;
    v+=a*r*w;w=clamp(r*1.6,0,1);n+=a;a*=.5;f*=2.07;
  }
  return v/n;
}
/* мягкий максимум: k — ширина перехода в единицах a и b */
function plnSmax(a,b,k){const h=clamp(.5+.5*(a-b)/k,0,1);return lerp(b,a,h)+k*h*(1-h);}

/* ── матрицы: по столбцам, Float32Array(16), левая тройка, глубина 0…1 ── */
function plnM4mul(a,b,o){
  o=o||new Float32Array(16);
  for(let c=0;c<4;c++)for(let r=0;r<4;r++)
    o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];
  return o;
}
function plnM4ortho(l,r,b,t,n,f){
  const o=new Float32Array(16);
  o[0]=2/(r-l);o[5]=2/(t-b);o[10]=1/(f-n);
  o[12]=-(r+l)/(r-l);o[13]=-(t+b)/(t-b);o[14]=-n/(f-n);o[15]=1;
  return o;
}
function plnM4look(eye,target,up){
  const z=plnNorm(plnSub(target,eye)),x=plnNorm(plnCross(up,z)),y=plnCross(z,x);
  return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,
    -plnDot(x,eye),-plnDot(y,eye),-plnDot(z,eye),1]);
}
/* зеркало относительно плоскости y = h */
function plnM4mirrorY(h){return new Float32Array([1,0,0,0,0,-1,0,0,0,0,1,0,0,2*h,0,1]);}
function plnM4inv(m,o){
  o=o||new Float32Array(16);
  const a00=m[0],a01=m[1],a02=m[2],a03=m[3],a10=m[4],a11=m[5],a12=m[6],a13=m[7],
    a20=m[8],a21=m[9],a22=m[10],a23=m[11],a30=m[12],a31=m[13],a32=m[14],a33=m[15],
    b00=a00*a11-a01*a10,b01=a00*a12-a02*a10,b02=a00*a13-a03*a10,
    b03=a01*a12-a02*a11,b04=a01*a13-a03*a11,b05=a02*a13-a03*a12,
    b06=a20*a31-a21*a30,b07=a20*a32-a22*a30,b08=a20*a33-a23*a30,
    b09=a21*a32-a22*a31,b10=a21*a33-a23*a31,b11=a22*a33-a23*a32;
  let det=b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06;
  det=1/(det||1e-30);
  o[0]=(a11*b11-a12*b10+a13*b09)*det;o[1]=(a02*b10-a01*b11-a03*b09)*det;
  o[2]=(a31*b05-a32*b04+a33*b03)*det;o[3]=(a22*b04-a21*b05-a23*b03)*det;
  o[4]=(a12*b08-a10*b11-a13*b07)*det;o[5]=(a00*b11-a02*b08+a03*b07)*det;
  o[6]=(a32*b02-a30*b05-a33*b01)*det;o[7]=(a20*b05-a22*b02+a23*b01)*det;
  o[8]=(a10*b10-a11*b08+a13*b06)*det;o[9]=(a01*b08-a00*b10-a03*b06)*det;
  o[10]=(a30*b04-a31*b02+a33*b00)*det;o[11]=(a21*b02-a20*b04-a23*b00)*det;
  o[12]=(a11*b07-a10*b09-a12*b06)*det;o[13]=(a00*b09-a01*b07+a02*b06)*det;
  o[14]=(a31*b01-a30*b03-a32*b00)*det;o[15]=(a20*b03-a21*b01+a22*b00)*det;
  return o;
}
/* ── сдвинутый объектив ──
   Глаз смотрит строго вдоль +z, а окно кадра на плоскости z=0 — ровно тот
   прямоугольник мира, что показывает 2D-игра: l…r и b…t в метрах, уже от глаза.
   Всё, что стоит на линии ходьбы, ложится на экран чистым масштабом, поэтому
   тычок «идти сюда», фишки и подписи попадают туда же, куда попадали.
   Глубина обратная: ближняя плоскость — 1, дальняя — 0. */
function plnM4lens(l,r,b,t,dist,near,far){
  const o=new Float32Array(16);
  o[0]=2*dist/(r-l);o[5]=2*dist/(t-b);
  o[8]=-(r+l)/(r-l);o[9]=-(t+b)/(t-b);
  o[10]=-near/(far-near);o[11]=1;o[14]=near*far/(far-near);
  return o;
}
function plnM4move(x,y,z){
  return new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,x,y,z,1]);
}
function plnTf(m,p){
  return [m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]];
}
