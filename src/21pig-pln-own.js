/* ══════════════ планета: свои вещи телами — база, дом, двор (M628a) ══════════════
   База и дом были наклейками поверх кадра (drawBuilt 21c, drawHomeOut 21f через plnOverOld 21pj);
   теперь это тела грамматики людей (DESIGN-base-scene §3–§4): гладкие корпуса со швами, серая
   сталь, ржавчина и копоть, оранжевый пояс, единственный тёплый свет.

   База — настил в 1.2 м над мелководьем (над грунтом, если воды рядом нет), 40 × 11 м, за
   линией хода. Отсеки стоят поперёк настила, круглыми торцами к объективу: сколько построено в
   верхнем ряду сетки (B.cells, ряд 0), столько и отсеков — пустая клетка остаётся пролётом
   настила с поручнем, так что база снаружи говорит, что построено внутри. На конце к площадке —
   купол и батарея (четыре банки с кабелем к куполу, зелёный огонёк — заряд), на дальнем — мачта
   12 м с ровным красным огнём и пирс с фонарём. Ворота — светлая дверь в торце ближнего к
   площадке отсека и ступени вниз к линии хода: в базу входят здесь, а не у корабля.

   Дом — на своём месте (homeSpotX), во дворе 19 × 13 м за низким забором (столбы 1.1 м через
   2.5 м, две проволоки, проход к крыльцу открыт): корпус 7 × 4 м с поясом рубочного стекла,
   крыльцо под фонарём, сводчатый гараж, решётчатая мачта 9 м с дышащим маяком; теплица — свод
   из рёбер на дальней стороне двора, внутри грядки 21g зелёными телами и холодная лампа.
   Двор кончается до человека: передний забор стоит за линией хода и режет его по поясу.

   Вымпел (21h) у той базы, что держит его в этот квартал, — полотно на её мачте, по ветру.
   Сетки строятся раз на посадку и состав (ключ: клетки, батарея, грядки, вымпел), ставятся
   записями, как памятники (21pie). Свет — свои сетки свечения, красятся записью: окна и ворота
   теплее ночью, красный огонь ровный, маяк дышит, лампа теплицы горит всегда. Ламп кадра
   (их четыре на всё, 21pe) свои вещи берут две и только ночью: фонарь крыльца — ключ двора, фонарь
   пирса. ?own=0 — прежние наклейки до M890. */
const OWN={on:true,base:null,home:null,gate:null,porch:null,gen:-1,err:"",
  deckH:1.2,deckZ:9,deckHX:20,deckHZ:5.5,slot:4.8,yardZ:8};
try{OWN.on=!/[?&]own=0(&|$)/.test(location.search||"");}catch(e){}

/* кожа людей: сталь в пятнах ржавчины и копоти; t — зерно места */
function plnOwnSteel(base,rust,sd){
  const C=PLN_MARK_COL;
  return (a,b,c)=>{const p=Array.isArray(b)?b:c,v=.5+.5*plnNoise(p[0]*.45+sd*.13,p[1]*.45+p[2]*.27,sd+1),
    w=.5+.5*plnNoise(p[0]*1.6+sd*.13,p[1]*1.6+p[2]*.96,sd+2);
    return plnMix3(plnMix3(base,C.steelDk,.25*v),C.rust,rust*plnSmooth(.55,.85,w)*(.5+.5*v));};
}
/* набор рук: тело m, свет lm; всё в местных метрах */
function plnOwnKit(m,lm){
  const MAN=PLN_MAT.man,GLOW=PLN_MAT.glow;
  const K={
    box:(c,r,col,o)=>plnBlob(m,Object.assign({c,r,sub:2,box:.3,col,mat:MAN},o||{})),
    rod:(a,b,rad,col,o)=>plnTube(m,Object.assign({path:[a,b],rad,sides:8,col,mat:MAN,cap:true},o||{})),
    lamp:(mm,c,r,col,g)=>plnBlob(mm||lm,{c,r,sub:1,col,mat:GLOW,glow:g||2.2,x:1}),
    /* светлая плоскость к объективу (−z) */
    pane:(mm,c,w,h,col,g)=>plnCard(mm||lm,[c[0]-w,c[1]-h,c[2]],[c[0]-w,c[1]+h,c[2]],[c[0]+w,c[1]+h,c[2]],[c[0]+w,c[1]-h,c[2]],[0,0,-1],col,GLOW,null,g||2,1)
  };
  return K;
}

/* место базы, м: зерно builtSpot и его правило «самое ровное», перемеренные в метрах на земле движка
   (DESIGN-base-scene §4): из 28 мест по зерну — то, где под настилом 40 × 11 м перепад меньше, не на
   площадке (старая наклейка стояла у корабля — тело во всю длину накрыло бы его) и не на дворе дома.
   Без земли движка (?pln=0, Node) — то же зерно по профилю игры. Запоминается на профиле */
function plnOwnBaseX(tr,p,Lm){
  const O=OWN,L=Lm&&Lm.tr===tr?Lm:(PLN_LAND.cur&&PLN_LAND.cur.tr===tr?PLN_LAND.cur:null);
  const hx=(typeof homeHereP==="function"&&homeHereP(p))?homeSpotX(p,tr):null,hm=hx!=null?hx/PLN_M:null;
  const key=(L?"L":"-")+(hm==null?"":Math.round(hm));
  if(tr._own&&tr._own.key===key)return tr._own.x;
  const x0=builtSpot(tr,p,"base").x/PLN_M,px=tr.padX/PLN_M,clear=O.deckHX+13;
  const W2=(tr.W||tr.N*tr.step)/PLN_M,lo=O.deckHX+6,hi=W2-O.deckHX-6;
  /* чужие места: памятники, посёлок, устье шахты — настил на них не ложится */
  const busy=[];
  for(const q of tr.poi||[])if(isFinite(q.x))busy.push([q.x/PLN_M,O.deckHX+12]);
  if(typeof settleSpotX==="function"){const s=settleSpotX(p,tr);if(s!=null)busy.push([s/PLN_M,O.deckHX+26]);}
  {const m=typeof mineSpotX==="function"?mineSpotX(p):null;if(m!=null)busy.push([m/PLN_M,O.deckHX+6]);}
  const ok=x=>x>=lo&&x<=hi&&Math.abs(x-px)>=clear&&(hm==null||Math.abs(x-hm)>O.deckHX+12)&&busy.every(b=>Math.abs(x-b[0])>b[1]);
  const flat=x=>{let a=1e9,b=-1e9;
    for(let i=-4;i<=4;i++)for(const dz of [-O.deckHZ,0,O.deckHZ]){const h=plnLandRibAt(L,x+i*O.deckHX/4,O.deckZ+dz);a=Math.min(a,h);b=Math.max(b,h);}
    return b-a;};
  let x=x0;
  if(L){
    const r=rng(hashi(p.seed,0xBA5,12));let best=1e9;
    for(let k=0;k<28;k++){const c=k?lo+r()*(hi-lo):x0;if(!ok(c))continue;const f=flat(c);if(f<best){best=f;x=c;}}
    if(best===1e9)x=x0;
  }
  if(!ok(x)){const s=x0>=px?1:-1;for(const c of [px+s*clear,px-s*clear,px+s*(clear+30),px-s*(clear+30)])if(ok(c)){x=c;break;}}
  tr._own={key,x};
  return x;
}
/* ── база: место и раскладка ──
   x — старое зерно builtSpot (самое ровное место), в метрах сцены; конец к площадке — «берег»:
   там купол и ворота */
function plnOwnBaseAt(L,tr,p,B){
  const x=plnOwnBaseX(tr,p,L),le=(tr.padX/PLN_M)>=x?1:-1,O=OWN;
  /* настил: на 1.2 м над высшей землёй под ним (место выбрано ровным — свай немного), над водой — на
     1.6 м над водой; сваи — до земли или дна. За гребнем земля уходит вниз: ниже гребня настил прятался */
  let top=-1e9;
  for(let i=-4;i<=4;i++)for(const dz of [-O.deckHZ,0,O.deckHZ]){
    const xx=x+i*O.deckHX/4,zz=O.deckZ+dz;
    top=Math.max(top,plnLandRibAt(L,xx,zz));
    if(L.wet)top=Math.max(top,plnLandLift(L,xx)+PLN_LAND.wRel+.4);
  }
  const y=top+O.deckH;
  const cells=[];for(let c=0;c<BASE_COLS;c++)cells.push(baseCell(B,c,0));
  /* ворота — торец ближнего к берегу отсека (слот 0), даже если клетка пуста: дверь в скале под ним */
  const gx=x+le*(O.deckHX-10.5);
  return {x,y,z:O.deckZ,le,cells,gx,gateW:[gx,y,O.deckZ-O.deckHZ+1]};
}
/* батарея на базе есть — значит, банки на настиле; огонёк — доля мощности (basePower.eff) */
function plnOwnBattOf(B){
  const has=(B.cells||[]).some(c=>c&&c.k==="battery");
  if(!has)return null;
  const P=basePower(B);
  return clamp(P&&isFinite(P.eff)?P.eff:0,0,1);
}
function plnOwnPennHere(p){
  return typeof pennHolder==="function"&&pennHolder()===baseKey(G.sx,G.sy,p.idx|0);
}
function plnOwnBaseMesh(L,A,sd,batt,penn){
  const O=OWN,C=PLN_MARK_COL,r=rng(sd),m=plnMesh(1<<14),lm=plnMesh(1<<10),bm=plnMesh(256),pm=plnMesh(256);
  const K=plnOwnKit(m,lm),le=A.le,hx=O.deckHX,hz=O.deckHZ;
  const gy=(lx,lz)=>plnLandRibAt(L,A.x+lx,A.z+lz)-A.y;   /* земля под местной точкой */
  const steel=plnOwnSteel(plnMix3(C.steel,C.steelDk,.38),.4,sd),dark=plnOwnSteel(C.steelDk,.2,sd+3),conc=plnOwnSteel(C.concrete,.25,sd+5);
  /* настил: плита с поручнем, сваи до грунта (или дна) каждые 5 м */
  K.box([0,-.22,0],[hx,.22,hz],conc,{box:.18,sub:3});
  K.box([0,-.5,0],[hx-.3,.12,hz-.3],dark,{box:.2});
  for(let i=-4;i<=4;i++)for(const s of [-1,1]){
    const lx=i*hx/4.2,lz=s*(hz-.5),g=gy(lx,lz);
    if(g<-.6)K.rod([lx,g-.6,lz],[lx,-.4,lz],.16,dark,{sides:8});
  }
  /* поручень по дальней кромке и по торцам */
  const rail=(a,b)=>{K.rod([a[0],.95,a[1]],[b[0],.95,b[1]],.035,steel,{sides:5});
    const n=Math.max(1,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/2.2));
    for(let k=0;k<=n;k++){const t=k/n;K.rod([lerp(a[0],b[0],t),0,lerp(a[1],b[1],t)],[lerp(a[0],b[0],t),.95,lerp(a[1],b[1],t)],.03,steel,{sides:5,cap:false});}};
  rail([-hx+.2,hz-.2],[hx-.2,hz-.2]);rail([-hx+.2,-hz+.2],[-hx+.2,hz-.2]);rail([hx-.2,-hz+.2],[hx-.2,hz-.2]);
  /* отсеки: круглым торцом к объективу, пояс оранжевый; пустая клетка — пролёт с поручнем у кромки */
  const sx=c=>le*(hx-10.5-c*O.slot);let mods=0;
  for(let c=0;c<BASE_COLS;c++){
    const x0=sx(c),cell=A.cells[c],k=cell&&cell.k;
    /* батарея — банки на торце (ниже), солнечная клетка — рамы панелей на пролёте, пустая — поручень */
    if(!cell||k==="battery"){if(c)rail([x0-1.9,-hz+.2],[x0+1.9,-hz+.2]);continue;}
    if(k==="solar"){
      for(const z of [-2.6,0,2.6]){
        K.rod([x0,0,z+.5],[x0,1.1,z+.5],.05,dark,{sides:5});
        plnCard(m,[x0-1.9,.9,z-.5],[x0-1.9,1.75,z+.85],[x0+1.9,1.75,z+.85],[x0+1.9,.9,z-.5],plnNorm([0,.85,-.53]),[.1,.14,.22],PLN_MAT.man,null,0,.3);
        K.box([x0,.88,z-.52],[1.95,.03,.04],C.steelLt,{box:.3});
      }
      continue;
    }
    mods++;plnBlob(m,{c:[x0,1.75,0],r:[1.7,1.75,4.4],sub:4,box:.42,col:steel,mat:PLN_MAT.man,x:.25});
    /* пояс — кольцо по сечению корпуса на высоте 1.05 м (сечение той же «коробки», что у plnBlob) */
    {const e=.42,uy=Math.pow(.7/1.75,1/e),k=Math.pow(Math.max(0,1-uy*uy),e/2),ring=[];
     /* у ворот пояс расступается перед дверью */
     const a0=c?0:1.5*Math.PI+.45,span=c?TAU:TAU-.9;
     for(let i=0;i<=40;i++){const a=a0+i/40*span,ca=Math.cos(a),sa=Math.sin(a);
       ring.push([x0+Math.sign(ca)*Math.pow(Math.abs(ca),e)*k*1.7*1.012,1.05,Math.sign(sa)*Math.pow(Math.abs(sa),e)*k*4.4*1.006]);}
     plnTube(m,{path:ring,rad:.16,sides:6,col:plnMix3(C.orange,C.rust,.12),mat:PLN_MAT.man,flat:.3});}
    /* швы и ребро жёсткости по спине, ножки-салазки */
    for(const z of [-2.6,1.4])plnTube(m,{path:[[x0-1.62,1.75,z],[x0,3.48,z],[x0+1.62,1.75,z]],rad:.05,sides:5,col:C.steelDk,mat:PLN_MAT.man});
    for(const s of [-1,1])K.box([x0+s*1.15,.12,0],[.18,.12,3.8],dark,{box:.2});
    /* окно-иллюминатор на торце; у ворот — дверь */
    if(c===0)continue;
    K.box([x0,2.2,-4.36],[.42,.32,.06],C.soot,{box:.25});
    K.pane(null,[x0,2.2,-4.44],.32,.22,C.warm,1.6);
  }
  /* ворота: дверь 2.2 м в торце отсека 0, рамка, козырёк, ступени к земле */
  const g0=sx(0);
  if(!A.cells[0])plnBlob(m,{c:[g0,1.3,-3.2],r:[1.3,1.3,1.4],sub:2,box:.3,col:steel,mat:PLN_MAT.man});
  K.box([g0,1.15,-4.48],[.72,1.18,.08],C.soot,{box:.2});
  K.pane(null,[g0,1.12,-4.58],.55,1.08,C.warm,1.9);
  K.box([g0,2.5,-4.75],[.95,.06,.42],dark,{box:.25});
  {const drop=Math.max(.3,A.y-plnLandRibAt(L,A.gx,A.z-hz-1.5)),ns=clamp(Math.round(drop/.28),2,14),run=Math.min(ns*.3,3.1);
   for(let i=0;i<ns;i++){const f=(i+1)/ns,z=-hz-.15-f*run,y=-f*drop+.09;K.box([g0,y,z],[.8,.06,.17],conc,{box:.25});}
   for(const s of [-1,1]){K.rod([g0+s*.84,0,-hz],[g0+s*.84,-drop,-hz-run],.06,dark,{sides:5});
     K.rod([g0+s*.84,.95,-hz],[g0+s*.84,.95-drop,-hz-run],.03,steel,{sides:5});
     K.rod([g0+s*.84,-drop,-hz-run],[g0+s*.84,.95-drop,-hz-run],.03,steel,{sides:5});}}
  /* купол на берегу: полусфера с поясом, батарея у торца настила */
  const dx=le*(hx-4.5);
  plnBlob(m,{c:[dx,0,.5],r:[3,3,3],sub:4,cut:0,col:steel,mat:PLN_MAT.man,x:.2});
  {const ring=[];for(let k=0;k<=24;k++){const a=k/24*TAU;ring.push([dx+Math.cos(a)*2.87,1,.5+Math.sin(a)*2.87]);}
   plnTube(m,{path:ring,rad:.2,sides:6,col:plnMix3(C.orange,C.rust,.15),mat:PLN_MAT.man,flat:.35});}
  K.pane(null,[dx,1.3,-2.55],.45,.3,C.warm,1.5);
  if(batt!=null){
    const bx=le*(hx-.95);
    for(let i=0;i<4;i++){const z=-3+i*1.55;K.box([bx,.6,z],[.42,.6,.5],plnOwnSteel(C.steelLt,.15,sd+i),{box:.25});
      K.box([bx,1.25,z],[.2,.06,.2],C.soot,{box:.3});}
    plnTube(m,{path:[[bx,1.3,1.6],[bx-le*.8,1.6,1.4],[dx+le*2.6,1.2,1.2]],rad:.05,sides:5,col:C.soot,mat:PLN_MAT.man});
    plnBlob(bm,{c:[bx,1.42,-3.1],r:[.1,.1,.1],sub:1,col:[.35,1,.45],mat:PLN_MAT.glow,glow:2.6,x:1});
  }
  /* мачта: три ноги решёткой, ровный красный огонь; пирс с фонарём на конце */
  const mx=-le*(hx-2.6),mz=2.4;
  const legs=[0,1,2].map(i=>{const a=i/3*TAU+.4;return [Math.cos(a)*.7,Math.sin(a)*.7];});
  for(const [ax,az] of legs)K.rod([mx+ax,0,mz+az],[mx+ax*.25,12,mz+az*.25],.05,steel,{sides:5});
  for(let k=1;k<9;k++){const y=k*1.35,s=1-.75*y/12;
    for(let i=0;i<3;i++){const a=legs[i],b=legs[(i+1)%3];K.rod([mx+a[0]*s,y,mz+a[1]*s],[mx+b[0]*s,y,mz+b[1]*s],.025,steel,{sides:4,cap:false});}}
  K.lamp(null,[mx,12.25,mz],[.2,.2,.2],C.red,3);
  const px=-le*(hx-6),pz0=hz,pz1=hz+10;
  K.box([px,-.18,(pz0+pz1)/2],[.85,.14,(pz1-pz0)/2],conc,{box:.2});
  for(let k=0;k<=4;k++){const z=lerp(pz0+.6,pz1-.4,k/4);for(const s of [-1,1]){const g=gy(px+s*.7,z);if(g<-.3)K.rod([px+s*.7,g-.5,z],[px+s*.7,-.25,z],.11,dark,{sides:6});}}
  K.rod([px+.6,0,pz1-.4],[px+.6,2.6,pz1-.4],.05,dark,{sides:6});
  K.box([px+.4,2.62,pz1-.4],[.28,.05,.12],dark,{box:.3});
  K.lamp(null,[px+.25,2.52,pz1-.4],[.12,.12,.12],C.warm,2.8);
  /* вымпел: полотно под маковкой мачты, не полной краски (§51.3), по ветру */
  if(penn){
    const fy=10.6,w=[0,0,1,1],col=[.66,.24,.17];
    plnCard(pm,[mx,fy-.45,mz],[mx,fy+.45,mz],[mx+le*1.7,fy+.3,mz],[mx+le*1.7,fy-.2,mz],[0,0,-1],col,PLN_MAT.leaf,w,0,0);
    plnCard(pm,[mx+le*1.7,fy-.2,mz],[mx+le*1.7,fy+.3,mz],[mx,fy+.45,mz],[mx,fy-.45,mz],[0,0,1],col,PLN_MAT.leaf,[1,1,0,0],0,0);
  }
  void r;
  return {mods,body:m,light:lm,batt:bm,penn:pm,lampAt:{pier:[px+.25,2.4,pz1-.4],gate:[g0,1.4,-5.2]},
    blots:[[dx,.5,3.6,.5],[0,0,hx*.8,.25]]};
}

/* ── дом: место и раскладка ── */
function plnOwnHomeAt(L,tr,p){
  const bx=homeSpotX(p,tr);
  if(bx==null)return null;
  const x=bx/PLN_M,z=OWN.yardZ;
  /* двор — терраса на высоте гребня перед ним: за гребнем земля уходит вниз, и ниже его двор прятался
     за ним; насыпь террасы — до земли */
  /* правило памятников (21pie), но строже: подошва не ниже гребня между объективом и двором минус 1 м
     (двор ниже прятался за дюнами переднего плана),
     разницу до земли берёт холм */
  let lo=1e9,crest=-1e9;
  for(let i=-3;i<=3;i++)for(const dz of [-6.5,-3,0,3,6])lo=Math.min(lo,plnLandRibAt(L,x+i*3,z+dz));
  for(let zz=0;zz<=z;zz+=2)for(const dx of [-6,0,6])crest=Math.max(crest,plnLandRibAt(L,x+dx,zz));
  const y=Math.max(lo-.4,crest-1);
  const door=homeDoorX(tr,p)/PLN_M-x;
  return {x,y,z,door,lo,porchW:[x+door,y+1.2,z-4.2]};
}
function plnOwnHomeMesh(L,A,sd,beds){
  const C=PLN_MARK_COL,P=PLN_PAL,m=plnMesh(1<<14),lm=plnMesh(1<<10),bm=plnMesh(256),gm=plnMesh(512);
  const K=plnOwnKit(m,lm),dr=A.door;
  const gy=(lx,lz)=>plnLandRibAt(L,A.x+lx,A.z+lz)-A.y;
  const steel=plnOwnSteel(C.steel,.3,sd),dark=plnOwnSteel(C.steelDk,.2,sd+3),conc=plnOwnSteel(C.concrete,.2,sd+5);
  const trod=(u,p2)=>plnMix3(P.soilDark,P.soil,.35+.3*(.5+.5*plnNoise(p2[0]*.7,p2[2]*.7,sd+9)));
  /* двор: утоптанная площадка с насыпью до грунта; дорожка от линии хода к крыльцу */
  /* терраса: тонкая утоптанная площадка на пологом земляном холме — откос, а не ящик */
  plnBlob(m,{c:[0,-.2,0],r:[9.6,.22,6.6],sub:3,box:.3,bump:.02,seed:sd,col:trod,mat:PLN_MAT.rock,x:.05});
  if(A.y-A.lo>.6)plnBlob(m,{c:[0,-(A.y-A.lo)*.5-.4,.4],r:[10.6+(A.y-A.lo)*.6,(A.y-A.lo)*.5+.7,7.4+(A.y-A.lo)*.5],sub:3,box:.6,bump:.22,seed:sd+1,
    col:(u,p2)=>plnMix3(P.rockWarm,P.rockCool,.5+.3*plnNoise(p2[0]*.3,p2[2]*.3+p2[1]*.3,sd+4)),mat:PLN_MAT.rock});
  /* дорожка от линии хода к проходу в заборе — плиты на земле ступенями, последняя вровень с двором */
  {const z0=-A.z+.3,z1=-6.9,n=3;
   for(let i=0;i<n;i++){const z=lerp(z0,z1,(i+.5)/n),h=i===n-1?0:Math.min(0,Math.max(gy(dr,z),-1.2)*(1-(i+1)/n));
     K.box([dr+(i&1?.12:-.1),h-.08,z],[.85,.1,.42],conc,{box:.3});}}
  /* корпус 7 × 4: стены, пояс рубочного стекла, крыша-козырёк; оранжевый пояс по цоколю */
  K.box([0,1.1,1],[3.5,1.1,2],(u,p2,n)=>p2[1]<.35?plnMix3(C.orange,C.rust,.2):steel(u,p2,n),{box:.22,sub:3});
  K.box([0,2.47,1],[3.42,.28,1.94],[.1,.12,.15],{box:.2});
  K.box([0,2.95,1.05],[3.75,.22,2.25],dark,{box:.25});
  K.pane(null,[.9,2.47,-.98],2.3,.2,C.warm,1.5);
  K.pane(null,[-2.9,2.47,-.98],.42,.2,C.warm,1.5);
  /* крыльцо 2 м под фонарём: настил, навес на двух стойках, дверь */
  K.box([dr,.1,-2],[1.5,.1,1],conc,{box:.25});
  K.box([dr,2.62,-1.9],[1.65,.07,1.12],dark,{box:.25});
  for(const s of [-1,1])K.rod([dr+s*1.45,.2,-2.9],[dr+s*1.45,2.58,-2.9],.05,dark,{sides:6});
  K.box([dr,1.05,-1.03],[.55,1.05,.05],C.soot,{box:.2});
  K.pane(null,[dr,1.02,-1.1],.42,.98,C.warm,1.2);
  K.lamp(null,[dr+.95,2.38,-2.75],[.13,.15,.13],C.warm,3);
  /* гараж: свод 3 × 5 вдоль глубины, ворота-жалюзи к объективу */
  const gx=-6.2;
  plnBlob(m,{c:[gx,0,1.2],r:[1.55,2,2.6],sub:3,box:.55,cut:0,col:steel,mat:PLN_MAT.man,x:.2});
  K.box([gx,.9,-1.36],[1.1,.9,.06],plnOwnSteel(C.steelLt,.4,sd+7),{box:.2});
  for(let k=1;k<6;k++)K.rod([gx-1.05,k*.3,-1.44],[gx+1.05,k*.3,-1.44],.012,C.steelDk,{sides:4,cap:false});
  /* мачта 9 м: решётка с полосами, маяк дышит (свечение, не лампа) */
  const mx=1.8,mz=4.6;
  const legs=[0,1,2].map(i=>{const a=i/3*TAU+.2;return [Math.cos(a)*.5,Math.sin(a)*.5];});
  for(const [ax,az] of legs)K.rod([mx+ax,0,mz+az],[mx+ax*.3,9,mz+az*.3],.04,(t,a,p2)=>Math.floor(p2[1]/1.5)%2?C.orange:C.steelLt,{sides:5});
  for(let k=1;k<7;k++){const y=k*1.3,s=1-.7*y/9;
    for(let i=0;i<3;i++){const a=legs[i],b=legs[(i+1)%3];K.rod([mx+a[0]*s,y,mz+a[1]*s],[mx+b[0]*s,y,mz+b[1]*s],.02,steel,{sides:4,cap:false});}}
  plnBlob(bm,{c:[mx,9.2,mz],r:[.2,.2,.2],sub:1,col:[1,.5,.2],mat:PLN_MAT.glow,glow:3,x:1});
  /* теплица: рёбра свода на дальней стороне двора, внутри грядки 21g и холодная лампа */
  const tx=6.6,tz=2,hl=3,rw=1.6;
  for(let k=0;k<=6;k++){const z=tz-hl+k;
    plnTube(m,{path:plnBez([tx-rw,0,z],[tx,2.9,z],[tx+rw,0,z],8),rad:k%6?.045:.075,sides:5,col:C.steelLt,mat:PLN_MAT.man});}
  for(const s of [-1,0,1])K.rod([tx+s*rw*.8,s?1.35:2.16,tz-hl],[tx+s*rw*.8,s?1.35:2.16,tz+hl],.035,C.steelLt,{sides:4});
  K.box([tx,.12,tz],[rw,.12,hl],conc,{box:.25});
  plnTube(gm,{path:[[tx,2.05,tz-hl+.4],[tx,2.05,tz+hl-.4]],rad:.05,sides:5,col:[.8,.92,1],mat:PLN_MAT.glow,glow:2.4,x:1,cap:true});
  beds.forEach((b,i)=>{const z=tz-hl+.75+i*1.5,g=b.g;if(g<.02)return;
    for(let j=0;j<4;j++){const sx=tx+(j-1.5)*.62,h=.15+.6*g;
      plnBlob(m,{c:[sx,.24+h/2,z],r:[.18+.12*g,h/2,.22+.1*g],sub:1,bump:.3,seed:sd+i*7+j,col:plnMix3([.22,.45,.2],[.45,.6,.25],(j&1)*.5+.2*g),mat:PLN_MAT.leaf});}});
  /* забор: столбы 1.1 м через 2.5 м, две проволоки, проход к крыльцу */
  const fx=9.3,fz=6.3,run=(a,b,gap)=>{const L2=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.round(L2/2.5);
    let prev=null;
    for(let k=0;k<=n;k++){const t=k/n,x=lerp(a[0],b[0],t),z=lerp(a[1],b[1],t);
      if(gap&&Math.abs(x-gap)<1.3){prev=null;continue;}
      K.rod([x,-.1,z],[x,1.1,z],.045,dark,{sides:5});
      if(prev)for(const h of [.45,.9])K.rod([prev[0],h,prev[1]],[x,h,z],.008,C.steelLt,{sides:3,cap:false});
      prev=[x,z];}};
  run([-fx,-fz],[fx,-fz],dr);run([-fx,-fz],[-fx,fz]);run([fx,-fz],[fx,fz]);run([-fx,fz],[fx,fz]);
  return {body:m,light:lm,beacon:bm,grow:gm,lampAt:{porch:[dr+.95,2.3,-2.75]},blots:[[0,1,4.2,.45],[5.8,1.2,2.4,.4]]};
}

/* ── сборка: раз на посадку и состав ── */
function plnOwnFree(it){
  if(!it)return;
  for(const k of ["geo","light","aux","beam","fx"])if(it[k])plnGeoFree(it[k]);
  if(it.inst)plnInstFree(it.inst);
}
function plnOwnItem(kind,A,M,sd,key){
  const g=x=>x&&x.nv?plnGeo(plnMeshDone(x)):null;
  const it={kind,A,key,sd,geo:g(M.body),light:g(M.light),aux:g(M.batt||M.beacon),beam:g(M.grow),fx:g(M.penn),
    lampAt:M.lampAt,blots:M.blots,a:new Float32Array(16*5),inst:null};
  for(let i=0;i<5;i++)plnRec(it.a,i,[A.x,A.y,A.z],1,0,1,sd%97,i?[1,1,1]:null);
  it.inst=plnInst(it.a,5,5);
  return it;
}
function plnOwnStep(L,S){
  const O=OWN,tr=S.tr,p=S.p;
  if(O.gen!==PLN_GPU.gen||O.L!==L){plnOwnFree(O.base);plnOwnFree(O.home);O.base=O.home=null;O.gen=PLN_GPU.gen;O.L=L;}
  const B=baseAt(G.sx,G.sy,p.idx);
  if(B){
    const A=plnOwnBaseAt(L,tr,p,B),bt=plnOwnBattOf(B),pn=plnOwnPennHere(p);
    const key=A.cells.map(c=>c?c.k:"-").join(",")+"|"+(bt!=null)+"|"+pn;
    if(!O.base||O.base.key!==key){plnOwnFree(O.base);
      const sd=hashi(p.seed|0,0xBA5,17);O.base=plnOwnItem("base",A,plnOwnBaseMesh(L,A,sd,bt,pn),sd,key);}
    O.base.batt=bt;O.gate=A.gx*PLN_M;
  }else{plnOwnFree(O.base);O.base=null;O.gate=null;}
  const H=(typeof homeHereP==="function"&&homeHereP(p))?plnOwnHomeAt(L,tr,p):null;
  if(H){
    const beds=greenAll().beds.map(b=>({g:greenGrow(b)})),key=beds.map(b=>Math.round(b.g*8)).join(",");
    if(!O.home||O.home.key!==key){plnOwnFree(O.home);
      const sd=hashi(G.sx,G.sy,0x40E7);O.home=plnOwnItem("home",H,plnOwnHomeMesh(L,H,sd,beds),sd,key);}
    O.porch=(H.x+H.door)*PLN_M;
  }else{plnOwnFree(O.home);O.home=null;O.porch=null;}
}
/* Ставит свои вещи в кадр: тела, свет записями, лампы ночью. ex — где объектив, V — {hw, D}, nk — ночь */
function plnOwnFrame(L,F,S,p,ex,V,nk){
  if(!OWN.on||!S||!S.tr||!S.p)return;
  plnOwnStep(L,S);
  const Bk=PLN_KIND.body,TO=PLN_TO.all,LIT=PLN_TO.lit,t=F.t,b=F.blobs;
  let n=b[0]|0;
  for(const it of [OWN.base,OWN.home]){
    if(!it)continue;
    const A=it.A,pos=[A.x,A.y,A.z];
    if(Math.abs(A.x-ex)>V.hw*(1+A.z/V.D)+24)continue;
    const warm=.14+1.1*nk;
    plnRec(it.a,1,pos,1,0,1,0,[warm,warm,warm]);
    let ak=1;
    if(it.kind==="base")ak=it.batt==null?0:.15+1.1*it.batt;
    else ak=.6+.4*Math.sin(t*1.3+it.sd%7);   /* маяк дышит */
    plnRec(it.a,2,pos,1,0,1,0,[ak,ak,ak]);
    plnInstSet(it.inst,it.a,5);
    if(it.geo)F.batches.push({geo:it.geo,inst:it.inst,first:0,count:1,kind:Bk,to:TO});
    if(it.light)F.batches.push({geo:it.light,inst:it.inst,first:1,count:1,kind:Bk,to:LIT});
    if(it.aux&&ak>.01)F.batches.push({geo:it.aux,inst:it.inst,first:2,count:1,kind:Bk,to:LIT});
    if(it.beam)F.batches.push({geo:it.beam,inst:it.inst,first:3,count:1,kind:Bk,to:LIT});
    if(it.fx)F.batches.push({geo:it.fx,inst:it.inst,first:4,count:1,kind:Bk,to:TO});
    /* лампы — ночью: фонарь крыльца (ключ двора), фонарь пирса */
    if(nk>.05){
      const la=it.kind==="home"?it.lampAt.porch:it.lampAt.pier,q=[A.x+la[0],A.y+la[1],A.z+la[2]];
      const lp={p:q,r:it.kind==="home"?9:7,c:[1,.68,.38],k:(it.kind==="home"?2.4:1.8)*nk};
      /* ламп у кадра четыре: занятое место уступает та, что светит за кромкой кадра (огни площадки
         далеко за спиной) */
      if(F.lamps.length<4)F.lamps.push(lp);
      else{const j=F.lamps.findIndex(l=>Math.abs(l.p[0]-ex)>V.hw*(1+Math.max(0,l.p[2])/V.D)+l.r);if(j>=0)F.lamps[j]=lp;}
    }
    for(const q of it.blots){if(n>=64)break;b.set([A.x+q[0],A.z+q[1],q[2],q[3]],4+n*4);n++;}
  }
  b[0]=n;
}
/* площадки для расчистки трав (21pga): [x м, z, rx, rz, рост] */
function plnOwnPads(tr,p,L){
  const o=[];
  if(!OWN.on||!tr||!p)return o;
  if(baseAt(G.sx,G.sy,p.idx)){const x=plnOwnBaseX(tr,p,L);o.push([x,OWN.deckZ,OWN.deckHX+3,OWN.deckHZ+4,12]);}
  const bx=(typeof homeHereP==="function"&&homeHereP(p))?homeSpotX(p,tr):null;
  if(bx!=null)o.push([bx/PLN_M,OWN.yardZ,11,8,9]);
  return o;
}

/* ── где ворота и крыльцо (единицы игры): без кадра, из того же места, что раскладка ── */
function plnOwnGateX(S){
  if(!OWN.on||!S||!S.tr||!S.p||!baseAt(G.sx,G.sy,S.p.idx))return null;
  const x=plnOwnBaseX(S.tr,S.p),le=(S.tr.padX/PLN_M)>=x?1:-1;
  return (x+le*(OWN.deckHX-10.5))*PLN_M;
}
const PLN_OWN_GATE_R=40;
function plnOwnAtGate(S){const g=plnOwnGateX(S);return g!=null&&Math.abs(S.x-g)<PLN_OWN_GATE_R;}
/* маркер «БАЗА» у кромки ведёт к воротам (21e) */
function plnOwnMark(S){return plnOwnGateX(S);}
/* табличка строки действия у ворот или у крыльца (21pzb): точка мира и высота вещи */
function plnOwnWordsAt(S){
  const pr=String(G.prompt||"");
  if(OWN.base&&/ВОЙТИ В БАЗУ/.test(pr)){const A=OWN.base.A;return {c:[A.gx,A.y+2.4,A.z-OWN.deckHZ+.4],h:2.4,id:"pln.gate"};}
  if(OWN.home&&/ВОЙТИ ДОМОЙ/.test(pr)){const A=OWN.home.A;return {c:[A.x+A.door,A.y+2.9,A.z-2],h:2.6,id:"pln.porch"};}
  return null;
}

/* ── вход: в базу — через ворота, а не у корабля ──
   Ветка корабля в 21-mode-surface зовёт enterBase по ДЕЙСТВИЮ «СПУСТИТЬСЯ В БАЗУ»; пока идёт её
   кадр, вход без ворот не открывается, а строка у корабля становится указателем на ворота.
   Закладка базы у корабля (foundBase → enterBase) входит сразу, как прежде: строка у неё другая */
let PLN_OWN_UPD=false;
const PLN_OWN_OLD_ENTER=enterBase;
enterBase=function(p){
  if(PLN_OWN_UPD&&OWN.on&&G.prompt==="ДЕЙСТВИЕ — СПУСТИТЬСЯ В БАЗУ"&&!plnOwnAtGate(G.surf))return;
  return PLN_OWN_OLD_ENTER(p);
};
/* во дворе и у ворот шахту не закладывают: строка «ЗАЛОЖИТЬ ШАХТУ» цепочки 21-mode-surface
   перебивала и дверь дома, и грядку (дверь всё равно открывалась — экран говорил не то) */
function plnOwnInYard(S){
  const hx=S&&S.p&&S.tr&&homeHereP(S.p)?homeSpotX(S.p,S.tr):null;
  return hx!=null&&Math.abs(S.x-hx)<11*PLN_M;
}
function plnOwnUnder(S){
  if(!OWN.on||!S||!S.p||!S.tr||!baseAt(G.sx,G.sy,S.p.idx))return false;
  return Math.abs(S.x-plnOwnBaseX(S.tr,S.p)*PLN_M)<(OWN.deckHX+3)*PLN_M;
}
function plnOwnYardPrompt(S){
  if(!OWN.on||!plnOwnInYard(S)||!/^ДЕЙСТВИЕ — ЗАЛОЖИТЬ ШАХТУ/.test(String(G.prompt||"")))return;
  const hx=homeDoorX(S.tr,S.p);
  if(Math.abs(hx-S.x)<38){G.prompt="ДЕЙСТВИЕ — ВОЙТИ ДОМОЙ";return;}
  const gp=Math.abs(hx+HOME_MAN*3.0-S.x)<40&&typeof greenPrompt==="function"?greenPrompt():"";
  G.prompt=gp||null;
}
const PLN_OWN_OLD_DIG=enterDig;
enterDig=function(){
  if(PLN_OWN_UPD&&OWN.on&&/^ДЕЙСТВИЕ — ЗАЛОЖИТЬ ШАХТУ/.test(String(G.prompt||""))&&(plnOwnAtGate(G.surf)||plnOwnInYard(G.surf)||plnOwnUnder(G.surf)))return;
  return PLN_OWN_OLD_DIG.apply(this,arguments);
};
const PLN_OWN_OLD_UPD=updateSurface;
updateSurface=function(dt){
  PLN_OWN_UPD=true;
  try{PLN_OWN_OLD_UPD(dt);}finally{PLN_OWN_UPD=false;}
  const S=G.surf;
  if(!OWN.on||G.mode!=="surface"||!S||!S.p)return;
  const g=plnOwnGateX(S);
  plnOwnYardPrompt(S);
  if(g==null)return;
  if(G.prompt==="ДЕЙСТВИЕ — СПУСТИТЬСЯ В БАЗУ")G.prompt=null;
  const bx=plnOwnBaseX(S.tr,S.p)*PLN_M,under=Math.abs(S.x-bx)<(OWN.deckHX+3)*PLN_M;
  if(under&&/^ДЕЙСТВИЕ — ЗАЛОЖИТЬ ШАХТУ/.test(String(G.prompt||""))&&Math.abs(S.x-g)>=PLN_OWN_GATE_R)G.prompt=null;
  const pr=String(G.prompt||"");
  if(Math.abs(S.x-g)<PLN_OWN_GATE_R&&S.on!==false&&!S.jetOn&&(!/ДЕЙСТВИЕ/.test(pr)||/^ДЕЙСТВИЕ — ЗАЛОЖИТЬ ШАХТУ/.test(pr))){
    G.prompt="ДЕЙСТВИЕ — ВОЙТИ В БАЗУ";
    if(actEdge){enterBase(S.p);return;}
  }else if(!pr&&(under||Math.abs(S.x-S.shipX)<shipZoneR())){
    const B=baseAt(G.sx,G.sy,S.p.idx),m=Math.round(Math.abs(g-S.x)/PLN_M);
    G.prompt="БАЗА"+(B&&B.name?" «"+B.name+"»":"")+" · ВОРОТА "+m+" М "+(g>S.x?"▶":"◀");
  }
};
/* подсказка «ЗДЕСЬ ВАША БАЗА · СПУСТИТЬСЯ ВНИЗ» у корабля больше не правда: вход у ворот */
const PLN_OWN_OLD_HINT=surfaceHint;
surfaceHint=function(){
  const r=PLN_OWN_OLD_HINT();
  return OWN.on&&r&&/^ЗДЕСЬ ВАША БАЗА/.test(r)?null:r;
};
/* объектив: у ворот и у крыльца — ближний план. На телефоне (≤ 760) ближний всегда, кроме полёта
   на ранце: на узком экране дальний план делает корабль и человека точками (DESIGN-base-scene §3) */
const PLN_OWN_OLD_AT=plnAtThing;
plnAtThing=function(S,p){
  const v=PLN_OWN_OLD_AT(S,p);
  if(v||!S||S.on===false||S.jetOn)return v;
  if(W<=760)return 1;
  if(!OWN.on||(S.walkAmp||0)>.25)return 0;
  const g=plnOwnGateX(S);
  if(g!=null&&Math.abs(S.x-g)<PLN_OWN_GATE_R)return 1;
  if(OWN.porch!=null&&Math.abs(S.x-OWN.porch)<38)return 1;
  return 0;
};
