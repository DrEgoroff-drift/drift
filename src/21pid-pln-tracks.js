/* ══════════════ планета: следы — отпечатки на земле (M624) ══════════════
   Старый след был чёрточкой поверх кромки. Здесь след — плоское тело подошвы на самой земле:
   пара идёт попеременно левой и правой ногой по обе стороны линии ходьбы, носком по ходу.
   Цвет — земля под ним, придавленная темнее; с возрастом след светлеет до цвета земли и
   уходит в неё, не мигая. Записи переписываются по кадру из S.tracks игры; цвет земли под
   следом считается раз и помнится по самой записи игры */
const PLN_TRACKS={cap:220,geo:null,inst:null,a:null,gen:-1,cols:new WeakMap(),
  len:.14,wid:.055,                      /* полуоси подошвы, м */
  side:.13};                             /* на сколько след отстоит от линии ходьбы */
function plnTrackMesh(){
  const m=plnMesh(128),M=PLN_MAT.ground,T=PLN_TRACKS;
  /* подошва: овал с пяткой, едва выше земли; нормаль вверх — свет тот же, что у земли */
  plnBlob(m,{c:[0,0,0],r:[T.len,.012,T.wid],box:.6,sub:1,cut:-.004,col:[1,1,1],mat:M,glow:0});
  plnBlob(m,{c:[-T.len*.55,0,0],r:[T.wid*1.1,.011,T.wid*1.05],sub:1,cut:-.004,col:[1,1,1],mat:M,glow:0});
  return m;
}
function plnTracksFrame(L,F,S,ex,V){
  const Q=PLN_TRACKS,list=S.tracks;
  if(!list||!list.length)return;
  if(Q.gen!==PLN_GPU.gen||!Q.geo){Q.gen=PLN_GPU.gen;Q.geo=plnGeo(plnTrackMesh());Q.a=new Float32Array(16*Q.cap);Q.inst=plnInst(Q.a,0,Q.cap);}
  const life=TRACK_LIFE,t=G.t||0,M=PLN_M,hw=V.hw+2;
  let n=0;
  for(let i=list.length-1;i>=0&&n<Q.cap;i--){
    const tk=list[i],age=t-tk.t;
    if(age>life)continue;
    const x=tk.x/M;
    if(Math.abs(x-ex)>hw)continue;
    const z=(Math.round(tk.x/13)&1?1:-1)*Q.side;
    let c=Q.cols.get(tk);
    if(!c){const g=plnThingGround(L,x,z);c={h:g.h,col:plnLandCol(L,x,z,g.h,g.n,0)};Q.cols.set(tk,c);}
    const fade=clamp((age-life*.5)/(life*.5),0,1),col=plnMix3(plnMul(c.col,.58),c.col,fade);
    plnRec(Q.a,n++,[x,c.h+.02,z],1,tk.f<0?Math.PI:0,1,i,col,0);
  }
  if(!n)return;
  plnInstSet(Q.inst,Q.a,n);
  F.batches.push({geo:Q.geo,inst:Q.inst,kind:PLN_KIND.body,to:PLN_TO.lit});
}
