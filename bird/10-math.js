/* ══════════════ математика ══════════════
   Своя, потому что модуль обязан остаться одним файлом без зависимостей.
   Матрицы — column-major, как их ждёт WebGL (uniformMatrix4fv, transpose=false).
   Векторы — обычные массивы из трёх чисел: типизированные тут ничего не дают,
   а читаются хуже. */

const TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const mix=(a,b,k)=>a+(b-a)*k;
const smooth=(e0,e1,x)=>{const t=clamp((x-e0)/(e1-e0),0,1);return t*t*(3-2*t);};

/* ── детерминированный шум ──
   Всё, что «случайно» в птице (разброс перьев, фазы ряби), берётся отсюда:
   одна и та же птица должна собираться одинаково в каждом запуске. */
function hashf(x,y){
  let h=Math.imul(x|0,374761393)+Math.imul(y|0,668265263);
  h=Math.imul(h^(h>>>13),1274126177);
  return ((h^(h>>>16))>>>0)/4294967296;
}
function rnd(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};}

/* ── вектор ── */
const v3=(x,y,z)=>[x,y,z];
const vAdd=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const vSub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const vMul=(a,k)=>[a[0]*k,a[1]*k,a[2]*k];
const vDot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const vCross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const vLen=a=>Math.hypot(a[0],a[1],a[2]);
function vNorm(a){const l=vLen(a)||1;return [a[0]/l,a[1]/l,a[2]/l];}
const vLerp=(a,b,k)=>[mix(a[0],b[0],k),mix(a[1],b[1],k),mix(a[2],b[2],k)];

/* ── матрица 4×4 ── */
function mIdent(){return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);}
function mMul(a,b,out){
  const o=out||new Float32Array(16);
  for(let c=0;c<4;c++){
    const b0=b[c*4],b1=b[c*4+1],b2=b[c*4+2],b3=b[c*4+3];
    o[c*4  ]=a[0]*b0+a[4]*b1+a[8 ]*b2+a[12]*b3;
    o[c*4+1]=a[1]*b0+a[5]*b1+a[9 ]*b2+a[13]*b3;
    o[c*4+2]=a[2]*b0+a[6]*b1+a[10]*b2+a[14]*b3;
    o[c*4+3]=a[3]*b0+a[7]*b1+a[11]*b2+a[15]*b3;
  }
  return o;
}
function mPersp(fovy,asp,near,far){
  const f=1/Math.tan(fovy/2),o=new Float32Array(16);
  o[0]=f/asp;o[5]=f;o[11]=-1;
  o[10]=(far+near)/(near-far);o[14]=2*far*near/(near-far);
  return o;
}
function mOrtho(l,r,b,t,n,f){
  const o=mIdent();
  o[0]=2/(r-l);o[5]=2/(t-b);o[10]=-2/(f-n);
  o[12]=-(r+l)/(r-l);o[13]=-(t+b)/(t-b);o[14]=-(f+n)/(f-n);
  return o;
}
function mLook(eye,at,up){
  const z=vNorm(vSub(eye,at)),x=vNorm(vCross(up,z)),y=vCross(z,x);
  const o=new Float32Array(16);
  o[0]=x[0];o[1]=y[0];o[2]=z[0];o[3]=0;
  o[4]=x[1];o[5]=y[1];o[6]=z[1];o[7]=0;
  o[8]=x[2];o[9]=y[2];o[10]=z[2];o[11]=0;
  o[12]=-vDot(x,eye);o[13]=-vDot(y,eye);o[14]=-vDot(z,eye);o[15]=1;
  return o;
}
function mTrans(t){const o=mIdent();o[12]=t[0];o[13]=t[1];o[14]=t[2];return o;}
function mScale(s){const o=mIdent();o[0]=s[0];o[5]=s[1];o[10]=s[2];return o;}
function mRotX(a){const o=mIdent(),c=Math.cos(a),s=Math.sin(a);o[5]=c;o[6]=s;o[9]=-s;o[10]=c;return o;}
function mRotY(a){const o=mIdent(),c=Math.cos(a),s=Math.sin(a);o[0]=c;o[2]=-s;o[8]=s;o[10]=c;return o;}
function mRotZ(a){const o=mIdent(),c=Math.cos(a),s=Math.sin(a);o[0]=c;o[1]=s;o[4]=-s;o[5]=c;return o;}
/* обратная к матрице вида/модели: нужна нормалям и лучу из курсора */
function mInv(m){
  const o=new Float32Array(16);
  const a00=m[0],a01=m[1],a02=m[2],a03=m[3],a10=m[4],a11=m[5],a12=m[6],a13=m[7],
        a20=m[8],a21=m[9],a22=m[10],a23=m[11],a30=m[12],a31=m[13],a32=m[14],a33=m[15];
  const b00=a00*a11-a01*a10,b01=a00*a12-a02*a10,b02=a00*a13-a03*a10,
        b03=a01*a12-a02*a11,b04=a01*a13-a03*a11,b05=a02*a13-a03*a12,
        b06=a20*a31-a21*a30,b07=a20*a32-a22*a30,b08=a20*a33-a23*a30,
        b09=a21*a32-a22*a31,b10=a21*a33-a23*a31,b11=a22*a33-a23*a32;
  let det=b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06;
  if(!det)return mIdent();
  det=1/det;
  o[0]=(a11*b11-a12*b10+a13*b09)*det; o[1]=(a02*b10-a01*b11-a03*b09)*det;
  o[2]=(a31*b05-a32*b04+a33*b03)*det; o[3]=(a22*b04-a21*b05-a23*b03)*det;
  o[4]=(a12*b08-a10*b11-a13*b07)*det; o[5]=(a00*b11-a02*b08+a03*b07)*det;
  o[6]=(a32*b02-a30*b05-a33*b01)*det; o[7]=(a20*b05-a22*b02+a23*b01)*det;
  o[8]=(a10*b10-a11*b08+a13*b06)*det; o[9]=(a01*b08-a00*b10-a03*b06)*det;
  o[10]=(a30*b04-a31*b02+a33*b00)*det;o[11]=(a21*b02-a20*b04-a23*b00)*det;
  o[12]=(a11*b07-a10*b09-a12*b06)*det;o[13]=(a00*b09-a01*b07+a02*b06)*det;
  o[14]=(a31*b01-a30*b03-a32*b00)*det;o[15]=(a20*b03-a21*b01+a22*b00)*det;
  return o;
}
function mTranspose(m){
  return new Float32Array([m[0],m[4],m[8],m[12], m[1],m[5],m[9],m[13],
                           m[2],m[6],m[10],m[14], m[3],m[7],m[11],m[15]]);
}
/* базис из направления: одна ось задана, две другие выбираются устойчиво —
   без этого перо на «полюсе» тела получает случайный поворот и торчит боком */
function basisFrom(dir,hint){
  const z=vNorm(dir);
  let up=hint||[0,1,0];
  if(Math.abs(vDot(z,up))>.97)up=[1,0,0];
  const x=vNorm(vCross(up,z)),y=vCross(z,x);
  return [x,y,z];
}
/* матрица «положить в точке p с базисом b и масштабом s» */
function mPlace(p,b,s){
  const o=new Float32Array(16);
  o[0]=b[0][0]*s[0];o[1]=b[0][1]*s[0];o[2]=b[0][2]*s[0];o[3]=0;
  o[4]=b[1][0]*s[1];o[5]=b[1][1]*s[1];o[6]=b[1][2]*s[1];o[7]=0;
  o[8]=b[2][0]*s[2];o[9]=b[2][1]*s[2];o[10]=b[2][2]*s[2];o[11]=0;
  o[12]=p[0];o[13]=p[1];o[14]=p[2];o[15]=1;
  return o;
}
/* ── сплайн Кэтмулла—Рома ──
   Кривая, проходящая ЧЕРЕЗ опорные точки: породу птицы задают именно точки
   силуэта, и правка одной не должна уводить соседние. */
function catmull(pts,t){
  const n=pts.length-1,x=clamp(t,0,1)*n,i=Math.min(n-1,Math.floor(x)),f=x-i;
  const p0=pts[Math.max(0,i-1)],p1=pts[i],p2=pts[i+1],p3=pts[Math.min(n,i+2)];
  const out=[];
  for(let k=0;k<p1.length;k++){
    const a=p0[k],b=p1[k],c=p2[k],d=p3[k];
    out[k]=.5*((2*b)+(-a+c)*f+(2*a-5*b+4*c-d)*f*f+(-a+3*b-3*c+d)*f*f*f);
  }
  return out;
}
/* цвет из «#rrggbb» в линейное пространство: весь свет считается в линейном,
   а палитра породы записана так, как её видит глаз */
function sRGB(hex){
  const n=parseInt(hex.slice(1),16);
  const f=v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);};
  return [f((n>>16)&255),f((n>>8)&255),f(n&255)];
}
