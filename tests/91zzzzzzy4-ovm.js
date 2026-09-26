/* ══════════════ цвет картинки по матрице и зерно (08bi ovImage, 26.09) ══════════════
   Фильтры альбома (25g1) читали пиксели 2D: сепия и ночь — яркость во все три канала, холод —
   контраст со сдвигом, и зерно ±n на пиксель. Смешениями это не выражается, поэтому у картинки
   ovImage есть матрица 3×4 по чистому цвету и зерно с посевом. Кадр собирает и читает ovRead
   вне цикла. Полосы — сплошные цвета, так что формула проверяется до единицы. */
function ovmStrip(){
  const cols=[[200,120,40],[30,90,220],[250,250,250],[10,10,10]],W=64,H=16;
  const B=gpuBake(W,H,c=>{cols.forEach((q,i)=>{c.fillStyle="rgb("+q.join(",")+")";c.fillRect(i*16,0,16,16);});},{mips:false,ss:1,once:true});
  const px=M=>ovRead(W,H,()=>{ovImage(B,W/2,H/2,W,H,0,0,0,1,1,1,M);});
  return {cols,W,H,B,px};
}
TEST_SUITES.push(()=>suite("картинка ovImage: цвет по матрице 3×4 — формулы альбома до единицы",{tier:"browser"},()=>{
  resetWorld();
  const S=ovmStrip();
  ok(S.B,"видеокарта есть — без неё матрицу мерить не на чем");
  if(!S.B)return;
  const at=(d,i)=>[0,1,2].map(c=>d[(8*S.W+i*16+8)*4+c]);
  const cl=v=>Math.round(Math.min(255,Math.max(0,v)));
  const L=q=>.3*q[0]+.59*q[1]+.11*q[2];
  const d0=S.px(null);
  S.cols.forEach((q,i)=>eq(at(d0,i).join(),q.join(),"без матрицы цвет как есть: полоса "+i));
  /* сепия 25g1: R=L·1.07+28, G=L·.88+14, B=L·.66 */
  const sep={m:[.3*1.07,.59*1.07,.11*1.07,28/255, .3*.88,.59*.88,.11*.88,14/255, .3*.66,.59*.66,.11*.66,0]};
  const d1=S.px(sep);
  S.cols.forEach((q,i)=>{const e=[L(q)*1.07+28,L(q)*.88+14,L(q)*.66].map(cl),g=at(d1,i);
    ok(g.every((v,c)=>Math.abs(v-e[c])<=1),"сепия, полоса "+i+": "+g.join()+" против "+e.join());});
  /* холод 25g1: R·.86, G·.97+4, B·1.08+14, потом контраст ×1.12 вокруг 128 — сдвиг (1−k)·128 */
  const k=1.12,o=(1-k)*128/255;
  const cold={m:[.86*k,0,0,o, 0,.97*k,0,4*k/255+o, 0,0,1.08*k,14*k/255+o]};
  const d2=S.px(cold);
  S.cols.forEach((q,i)=>{const e=[(q[0]*.86-128)*k+128,(q[1]*.97+4-128)*k+128,(q[2]*1.08+14-128)*k+128].map(cl),g=at(d2,i);
    ok(g.every((v,c)=>Math.abs(v-e[c])<=1),"холод, полоса "+i+": "+g.join()+" против "+e.join());});
  gpuBakeDrop(S.B);
}));
TEST_SUITES.push(()=>suite("картинка ovImage: зерно по посеву — размах, среднее, повтор",{tier:"browser"},()=>{
  resetWorld();
  const S=ovmStrip();
  ok(S.B,"видеокарта есть — без неё зерно мерить не на чем");
  if(!S.B)return;
  const a=26/255,d1=S.px({grain:a,seed:7}),d2=S.px({grain:a,seed:7}),d3=S.px({grain:a,seed:8}),d0=S.px({grain:0,seed:7});
  eq(d1.join(),d2.join(),"тот же посев — тот же кадр до пикселя");
  ok(d1.join()!==d3.join(),"другой посев — другое зерно");
  eq(d0.join(),S.px(null).join(),"размах 0 — зерна нет");
  /* синий 220 во второй полосе: зерно ±13 не упирается в край */
  let s=0,s2=0,n=0,mx=0,same=0;
  for(let y=0;y<S.H;y++)for(let x=16;x<32;x++){const i=(y*S.W+x)*4,v=d1[i+2]-220;s+=v;s2+=v*v;n++;mx=Math.max(mx,Math.abs(v));
    if(Math.abs(d1[i]-30-v)<=1&&Math.abs(d1[i+1]-90-v)<=1)same++;}   /* каналы округляются порознь — до единицы */
  const m=s/n,sd=Math.sqrt(s2/n-m*m);
  ok(Math.abs(m)<2,"среднее не сдвинуто: "+m.toFixed(2));
  ok(sd>6&&sd<9,"разброс как у равномерного ±13 (7.5): "+sd.toFixed(2));
  ok(mx<=14,"за размах не выходит: "+mx);
  eq(same,n,"одно число во все три канала");
  gpuBakeDrop(S.B);
}));
