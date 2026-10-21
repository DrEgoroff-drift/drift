/* ══════════════ пещера на движке: кулисы (M630e) ══════════════
   Ближний камень перед разрезом (z < 0): натёки с пола и со свода в 2–3.4 м перед линией ходьбы,
   тёмным силуэтом с холодной кромкой (шейдер, mat 17). Дают кадру первый план и держат его края;
   человека не закрывают — шейдер прорезает кулису там, где за ней человек. Шаг ~9 м, по обеим
   галереям; в кадр идёт та галерея, где середина кадра. Строятся раз на полосу CAVE3_DR.s. */
const CAVE3_WG={step:9,jit:3.5,z:[-2,-3.4],keep:8,col:[.007,.009,.013],mouth:6,sink:6};
Object.assign(CAVE3_MAT,{wing:17});

/* где стоят: x в метрах, галерея, зерно; у устья — нет (там столб дня) */
function cave3WingItems(C,Fd){
  const P=CAVE_PPM,W=CAVE3_WG,out=[],end=CAVE_W/P-6;
  for(const low of [false,true]){
    let x=6+(hashi(1,C.seed,low?0x1A6:0x1A7)&1023)/1023*W.step;
    for(let i=0;x<end;i++){
      const h=hashi(i,C.seed,low?0x1A61:0x1A71),X=x;
      x+=W.step+((h>>>3&1023)/1023-.5)*2*W.jit;
      if(!low&&Fd.mouthX!=null&&Math.abs(X-Fd.mouthX)<W.mouth)continue;
      out.push({X,low,seed:h,b:Math.floor(X/CAVE3_DR.s)});
    }
  }
  return out;
}
/* натёк-силуэт: конус из-за кромки кадра, бугристый; dir +1 — с пола вверх, -1 — со свода вниз.
   from — где корень (за кадром), at — где камень галереи, len — сколько выходит в воздух */
function cave3WingCone(m,r,x,z,from,at,len,R,dir,col,dome){
  /* кольца корня гуще у камня галереи (там осыпь видна), в воздухе — ровно */
  const nR=6,nA=10,N=nR+nA,path=[],rr=[],ph=r()*TAU,lean=(r()-.5)*.6*len,nb=1.5+r()*2,tip=dome?R*.45:.04;
  for(let k=0;k<N;k++){
    const root=k<nR,s=root?k/nR:0,u=root?0:(k-nR+1)/nA,y=root?at+(from-at)*Math.pow(1-s,2):at+dir*len*u;
    path.push([x+lean*u*u,y,z+(r()-.5)*.08]);
    /* тело, не шип: бугры по высоте, пол — купол наплыва, свод — колокол */
    const lump=1+.22*Math.sin(u*nb*TAU+ph)*(1-u*.7),prof=dome?Math.sqrt(Math.max(0,1-u*u)):Math.pow(1-u,1.3);
    /* корень расходится осыпью: к кромке кадра тело шире */
    rr.push(root?R*(1+plnSmooth(0,2.6,Math.abs(y-at))*(dome?2.4:.7)):Math.max(tip,R*prof*lump));
  }
  plnTube(m,{path,sides:14,mat:CAVE3_MAT.wing,glow:0,rad:t=>rr[Math.min(N-1,Math.round(t*(N-1)))],col:()=>col,x:1,cap:true});
}
function cave3WingBin(C,list){
  /* пол и свод — порознь: на ближней стоянке они расходятся из кадра в разные стороны */
  const md=plnMesh(1<<12),mu=plnMesh(1<<12),P=CAVE_PPM,W=CAVE3_WG;
  let m=md;
  let ys=0,n=0;
  for(const q of list){
    const r=rng(q.seed^0x317C),fl=-caveFloorOf(C,q.X*P,q.low)/P,ce=-caveCeilOf(C,q.X*P,q.low)/P,gap=ce-fl;
    if(!(gap>1.6))continue;
    ys+=(fl+ce)/2;n++;
    const kind=q.seed&3,col=plnMul(W.col,.85+.3*r()),z0=lerp(W.z[0],W.z[1],r());
    /* с пола: гряда — бугры разной высоты вразброс, низкие по краям; тонкий натёк, если есть, — сбоку,
       не на макушке (купол с шипом наверху читается фигурой в капюшоне) */
    m=md;
    if(kind!==1){
      /* верх гряды — не выше пола в кадре: то, что ходит по полу, видно поверх неё */
      const H=lerp(.45,.85,r()),c=3+(r()*3|0),span=lerp(2.4,4,r());
      for(let k=0;k<c;k++){
        const u=c>1?k/(c-1)-.5:0,x=q.X+u*span+(r()-.5)*.5,z=z0+(r()-.5)*.7;
        const h=H*(1-Math.abs(u)*1.1)*lerp(.6,1.05,r())+.1;
        cave3WingCone(m,r,x,z,fl-6,fl-.3,h,lerp(.7,1.15,r())*(1-Math.abs(u)*.5),1,plnMul(col,.95+.15*r()),true);
      }
      if(r()<.5){
        const x=q.X+(r()<.5?-1:1)*span*lerp(.35,.55,r());
        cave3WingCone(m,r,x,z0+.3,fl-6,fl-.3,H*lerp(1.3,1.9,r()),lerp(.32,.48,r()),1,plnMul(col,1.1),false);
      }
    }
    /* со свода: зубья, длинный посередине */
    m=mu;
    if(kind!==0&&kind!==3||kind===3&&r()<.4){
      const L=Math.min(lerp(1.1,2.8,r()),gap*.42),x1=q.X+(kind===2?(r()-.5)*3:0);
      for(let k=0,c=2+(r()*3|0);k<c;k++){
        const x=x1+(k?(r()-.5)*2.4:0),z=z0+(k?(r()-.5)*.8:0),l=k?L*lerp(.3,.7,r()):L;
        cave3WingCone(m,r,x,z,ce+6,ce+.2,l,lerp(.45,.8,r())*(k?.7:1)*(.8+l*.15),-1,plnMul(col,k?1.1:1),false);
      }
    }
  }
  return {gd:md.ni?plnGeo(md):null,gu:mu.ni?plnGeo(mu):null,ym:n?ys/n:null,tris:(md.ni+mu.ni)/3,t:0};
}
const cave3WingFree=k=>{plnGeoFree(k.gd);plnGeoFree(k.gu);};
/* кадр: полосы в окне строятся сразу (конусов мало), рисуются той галереи, где середина кадра.
   go — ближняя стоянка (нырок, у вещи), 0..1: объектив подошёл, кулисы раздулись бы — гряда уходит
   вниз за кромку кадра, зубья свода вверх (сдвиг записью расстановки, без пересборки) */
function cave3WingFrame(C,F,Fd,x0,x1,cy,go){
  const Q=C.wg3||(C.wg3={m:new Map(),gen:-1,t:0,by:null,I:null,a:new Float32Array(32)});
  if(Q.gen!==PLN_GPU.gen){for(const k of Q.m.values())cave3WingFree(k);Q.m.clear();Q.I=null;Q.gen=PLN_GPU.gen;}
  const sk=CAVE3_WG.sink*plnSmooth(0,1,go||0);
  plnRec(Q.a,0,[0,-sk,0],1,0,1,0);plnRec(Q.a,1,[0,sk,0],1,0,1,0);
  if(!Q.I)Q.I=[plnInst(Q.a.subarray(0,16),1,1),plnInst(Q.a.subarray(16,32),1,1)];
  else{plnInstSet(Q.I[0],Q.a.subarray(0,16),1);plnInstSet(Q.I[1],Q.a.subarray(16,32),1);}
  if(!Q.by){
    Q.by=new Map();
    for(const q of cave3WingItems(C,Fd)){const key=q.b*2+(q.low?1:0);let a=Q.by.get(key);if(!a)Q.by.set(key,a=[]);a.push(q);}
  }
  Q.t++;
  const s=CAVE3_DR.s,vis=[];
  for(let b=Math.floor(x0/s);b<=Math.floor(x1/s);b++)for(const lo of [0,1]){
    const key=b*2+lo;
    if(!Q.by.has(key))continue;
    let k=Q.m.get(key);
    if(!k){k=cave3WingBin(C,Q.by.get(key));Q.m.set(key,k);}
    k.t=Q.t;
    if((k.gd||k.gu)&&k.ym!=null)vis.push([lo,k]);
  }
  if(Q.m.size>CAVE3_WG.keep*2){
    const old=[...Q.m.entries()].filter(e=>e[1].t!==Q.t).sort((a,b)=>a[1].t-b[1].t);
    for(const [key,k] of old.slice(0,Q.m.size-CAVE3_WG.keep*2)){cave3WingFree(k);Q.m.delete(key);}
  }
  /* галерея кадра: чья середина ближе к середине кадра */
  let lo=0;
  if(cy!=null){
    let best=1e9;
    for(const [l,k] of vis){const d=Math.abs(k.ym-cy);if(d<best){best=d;lo=l;}}
  }
  let tris=0,n=0;
  /* ушли целиком (сдвиг больше высоты кадра) — не рисуем */
  for(const [l,k] of vis)if(l===lo&&go<.999){
    if(k.gd)F.draw.push({geo:k.gd,inst:Q.I[0],lamp:false,sun:false});
    if(k.gu)F.draw.push({geo:k.gu,inst:Q.I[1],lamp:false,sun:false});
    tris+=k.tris;n++;
  }
  CAVE3.stat.wings=n;
  return tris;
}
