/* ══════════════ плитка шума для сведения туманности (P1 13/n, docs/DESIGN-gpu.md) ══════════════
   Мелкая деталь сведения (fineT/fineE, 16gb) — шум по решётке: четыре хэша gh на каждый gn,
   на полном разрешении это половина прохода EMI. Узлы решётки запечены плиткой 513² (r16float):
   тексел k — узел gh(k−256), окно −256..255 (у решётки бывают и отрицательные узлы), период 512, последний ряд и столбец повторяют первый, чтобы
   сбор четырёх соседей у края не упирался в обрезку сэмплера. На экране решётки 9–30 клеток,
   до повтора — полтысячи. Смесь по сглаженным долям — в арифметике, как у gn: фильтр сэмплера
   дал бы 8-битные веса и ступени в плавном газе */
const GNB_TILE=`
fn gnt(p:vec2f)->f32{let i=floor(p);let f=p-i;let w=f*f*(3.-2.*f);
  let k=i+256.-512.*floor((i+256.)/512.);
  let g=textureGather(0,t1,smp,(k+1.)/513.);
  return mix(mix(g.w,g.z,w.x),mix(g.x,g.y,w.x),w.y);}
fn fbt(p0:vec2f,n:i32)->f32{var p=p0;var s=0.;var a=.5;var m=0.;
  for(var k=0;k<n;k++){s=s+a*gnt(p);m=m+a;p=mat2x2f(1.6,1.2,-1.2,1.6)*p+vec2f(3.1,7.7);a=a*.5;}
  return s/m;}`;
/* gh из GNB_NOISE в одинарной точности — те же шаги, что у шейдера */
function gnbGh(x,y){
  const F=Math.fround,fr=v=>F(v-Math.floor(v)),c=F(.1031),k=F(33.33);
  let qx=fr(F(x*c)),qy=fr(F(y*c)),qz=qx;
  const d=F(F(F(qx*F(qy+k))+F(qy*F(qz+k)))+F(qz*F(qx+k)));
  qx=F(qx+d);qy=F(qy+d);qz=F(qz+d);
  return fr(F(F(qx+qy)*qz));
}
/* половинная точность: значения в [0,1), ошибка узла ≤ 2.5e-4 */
function gnbHalf(v){
  if(v<6.103515625e-5)return Math.round(v/5.960464477539063e-8);
  let e=Math.floor(Math.log2(v)),m=Math.round((v/Math.pow(2,e)-1)*1024);
  if(m===1024){e++;m=0;}
  return ((e+15)<<10)|m;
}
function gnbNoiseTile(){
  if(GNB.nzv&&GNB.nzDev===GPU.dev)return GNB.nzv;
  const N=512,S=N+1,a=new Uint16Array(S*S);
  for(let y=0;y<S;y++)for(let x=0;x<S;x++)a[y*S+x]=gnbHalf(gnbGh(x%N-N/2,y%N-N/2));
  const U=GPUTextureUsage,t=GPU.dev.createTexture({size:[S,S],format:"r16float",usage:U.TEXTURE_BINDING|U.COPY_DST});
  GPU.dev.queue.writeTexture({texture:t},a,{bytesPerRow:S*2,rowsPerImage:S},[S,S]);
  GNB.nzDev=GPU.dev;return GNB.nzv=t.createView();
}
