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
   из рёбер на дальней стороне двора, внутри четыре гряды 21g, на каждой — тела своего вида (M204), и холодная лампа.
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
/* стёкла ночью (M602): дом #ffc990, база бледнее #f6dcb6. Цвет вершин движок читает как sRGB —
   C.warm выходил на экран лососем, поэтому тёплое задано светлее */
const OWN_WASH={r:10,k:2.6,y:1.5};   /* лампа кромки на борт отсека: радиус, м, и сила ночью */
const OWN_WIN={home:[1,.92,.7],base:[.98,.94,.84],lamp:[1,.9,.74],grow:[1,.8,.56],film:[1,.82,.46]};

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
  /* стекло ночью (брак M628, 22.10: окна — плоские карточки во весь накал): низ теплее и ярче — свет
     комнаты с пола, верх тусклее и холоднее, по стеклу тёмный переплёт. g — накал низа */
  K.glass=(c,w,h,col,g,bar)=>{
    K.pane(null,[c[0],c[1]-h/2,c[2]],w,h/2,col,g);
    K.pane(null,[c[0],c[1]+h/2,c[2]],w,h/2,plnMix3(col,[.62,.66,.74],.4),g*.55);
    if(bar===false)return;
    K.rod([c[0],c[1]-h,c[2]-.02],[c[0],c[1]+h,c[2]-.02],.022,PLN_MARK_COL.soot,{sides:4,cap:false});
    K.rod([c[0]-w,c[1]+h*.15,c[2]-.02],[c[0]+w,c[1]+h*.15,c[2]-.02],.022,PLN_MARK_COL.soot,{sides:4,cap:false});
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
    /* раскосы крест-накрест к соседней свае ряда: настил на сваях держится, а не стоит столом (брак M628) */
    if(i<4){const nx=(i+1)*hx/4.2,g2=gy(nx,lz),lo=Math.max(g,g2),gx=le*(hx-10.5);
      if(lo<-1.1&&!(s<0&&gx>lx-1.2&&gx<nx+1.2)){   /* пролёт с лестницей ворот — без раскоса */const y0=lo+.35,y1=-.5;
        K.rod([lx,y0,lz],[nx,y1,lz],.05,dark,{sides:5});K.rod([lx,y1,lz],[nx,y0,lz],.05,dark,{sides:5});}}
  }
  /* поперечные связи свай под настилом */
  for(let i=-4;i<=4;i+=2){const lx=i*hx/4.2,g=Math.max(gy(lx,-(hz-.5)),gy(lx,hz-.5));
    if(g<-1.1)K.rod([lx,g+.5,-(hz-.5)],[lx,g+.5,hz-.5],.045,dark,{sides:5});}
  /* поручень по дальней кромке и по торцам */
  const rail=(a,b)=>{K.rod([a[0],.95,a[1]],[b[0],.95,b[1]],.035,steel,{sides:5});
    const n=Math.max(1,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/2.2));
    for(let k=0;k<=n;k++){const t=k/n;K.rod([lerp(a[0],b[0],t),0,lerp(a[1],b[1],t)],[lerp(a[0],b[0],t),.95,lerp(a[1],b[1],t)],.03,steel,{sides:5,cap:false});}};
  rail([-hx+.2,hz-.2],[hx-.2,hz-.2]);rail([-hx+.2,-hz+.2],[-hx+.2,hz-.2]);rail([hx-.2,-hz+.2],[hx-.2,hz-.2]);
  /* бортовые огни по ближней кромке настила: ночью настил — линия, а не провал */
  for(let i=0;i<=10;i++)K.lamp(null,[-hx+.6+i*(2*hx-1.2)/10,-.12,-hz-.04],[.09,.05,.04],OWN_WIN.lamp,1.5);
  /* отсеки: круглым торцом к объективу, пояс оранжевый; пустая клетка — пролёт с поручнем у кромки */
  const sx=c=>le*(hx-10.5-c*O.slot);let mods=0;
  for(let c=0;c<BASE_COLS;c++){
    const x0=sx(c),cell=A.cells[c],k=cell&&cell.k;
    /* батарея — банки на торце (ниже), солнечная клетка — рамы панелей на пролёте, пустая — поручень */
    if(!cell||k==="battery"){if(c)rail([x0-1.9,-hz+.2],[x0+1.9,-hz+.2]);continue;}
    if(k==="solar"&&c===0)continue;   /* у ворот вместо рам — тамбур (ниже): дверь не стоит одна между панелями */
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
    /* огни на спине: ночью силуэт отсека не тонет в холме за ним (брак M628, 22.10) */
    for(const z of [-3.6,3.6])K.lamp(null,[x0,3.44,z],[.12,.09,.12],z<0?OWN_WIN.lamp:[1,.32,.2],2.2);
    /* у ворот — дверь (ниже); остальные отсеки — каждый своей приметой (брак M628: все были одной капсулой) */
    if(c===0)continue;
    if(k==="reactor"){
      /* реактор: гребёнка радиаторных рёбер на спине и знак на торце, окна нет */
      for(let i=0;i<6;i++){const z=-2.5+i*1.0;K.box([x0,3.62,z],[1.15,.3,.035],plnOwnSteel(C.steelLt,.1,sd+20+i),{box:.15});}
      K.rod([x0-1.1,3.36,-2.7],[x0-1.1,3.36,2.7],.04,dark,{sides:5});K.rod([x0+1.1,3.36,-2.7],[x0+1.1,3.36,2.7],.04,dark,{sides:5});
      K.box([x0,2.05,-4.36],[.36,.36,.05],C.orange,{box:.5});
      K.box([x0,2.05,-4.41],[.13,.13,.03],C.soot,{box:.5});
      continue;
    }
    if(k==="storage"){
      /* склад: ворота-жалюзи во весь торец, без окна */
      K.box([x0,1.15,-4.3],[1.05,1.05,.07],plnOwnSteel(C.steelLt,.35,sd+30),{box:.2});
      for(let j=1;j<8;j++)K.rod([x0-1,.12+j*.27,-4.4],[x0+1,.12+j*.27,-4.4],.014,C.steelDk,{sides:4,cap:false});
      K.box([x0,2.3,-4.38],[1.12,.1,.08],dark,{box:.3});
      K.pane(null,[x0,.08,-4.42],.95,.025,OWN_WIN.lamp,.9);   /* щель под жалюзи — ночью полоска света */
      continue;
    }
    if(k==="habitat"){
      /* жилой: два окна и люк под ними */
      for(const s of [-1,1]){K.box([x0+s*.62,2.25,-4.36],[.36,.3,.06],C.soot,{box:.25});
        K.glass([x0+s*.62,2.25,-4.44],.27,.21,OWN_WIN.home,s<0?1.15:.8);}
      K.box([x0,.95,-4.34],[.5,.62,.07],dark,{box:.45});
      K.box([x0,.95,-4.42],[.36,.48,.03],plnOwnSteel(C.steelLt,.3,sd+40),{box:.45});
      K.rod([x0-.18,1.02,-4.48],[x0+.18,1.02,-4.48],.035,C.steelDk,{sides:5});
      continue;
    }
    K.box([x0,2.2,-4.36],[.42,.32,.06],C.soot,{box:.25});
    K.glass([x0,2.2,-4.44],.32,.22,OWN_WIN.base,.6+.6*plnHash(c,sd,77));   /* за окнами свет разный */
  }
  /* ворота: дверь 2.2 м в торце отсека 0, рамка, козырёк, ступени к земле. Дверь — глухое полотно с
     иллюминатором и щелью света понизу, лампа под козырьком (ночью дверь была пересвеченной карточкой) */
  const g0=sx(0),k0=A.cells[0]&&A.cells[0].k;
  if(!k0||k0==="solar"||k0==="battery")plnBlob(m,{c:[g0,1.3,-3.2],r:[1.3,1.3,1.4],sub:2,box:.3,col:steel,mat:PLN_MAT.man});
  K.box([g0,1.15,-4.48],[.72,1.18,.08],C.soot,{box:.2});
  K.box([g0,1.1,-4.56],[.55,1.04,.03],plnOwnSteel(C.steelLt,.25,sd+50),{box:.2});
  K.box([g0,1.6,-4.6],[.24,.27,.02],C.soot,{box:.4});
  K.glass([g0,1.6,-4.63],.18,.21,OWN_WIN.home,1.25,false);
  K.pane(null,[g0,.08,-4.62],.52,.03,OWN_WIN.lamp,1.2);
  K.lamp(null,[g0,2.4,-4.66],[.2,.04,.08],OWN_WIN.lamp,1.8);
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
  K.pane(null,[dx,1.3,-2.55],.45,.3,OWN_WIN.base,1.5);
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
  K.lamp(null,[mx,12.25,mz],[.2,.2,.2],C.red,1.4);
  const px=-le*(hx-6),pz0=hz,pz1=hz+10;
  K.box([px,-.18,(pz0+pz1)/2],[.85,.14,(pz1-pz0)/2],conc,{box:.2});
  for(let k=0;k<=4;k++){const z=lerp(pz0+.6,pz1-.4,k/4);for(const s of [-1,1]){const g=gy(px+s*.7,z);if(g<-.3)K.rod([px+s*.7,g-.5,z],[px+s*.7,-.25,z],.11,dark,{sides:6});}}
  K.rod([px+.6,0,pz1-.4],[px+.6,2.6,pz1-.4],.05,dark,{sides:6});
  K.box([px+.4,2.62,pz1-.4],[.28,.05,.12],dark,{box:.3});
  K.lamp(null,[px+.25,2.52,pz1-.4],[.12,.12,.12],OWN_WIN.lamp,2.2);
  /* вымпел: полотно под маковкой мачты, не полной краски (§51.3), по ветру */
  if(penn){
    const fy=10.6,w=[0,0,1,1],col=[.66,.24,.17];
    plnCard(pm,[mx,fy-.45,mz],[mx,fy+.45,mz],[mx+le*1.7,fy+.3,mz],[mx+le*1.7,fy-.2,mz],[0,0,-1],col,PLN_MAT.leaf,w,0,0);
    plnCard(pm,[mx+le*1.7,fy-.2,mz],[mx+le*1.7,fy+.3,mz],[mx,fy+.45,mz],[mx,fy-.45,mz],[0,0,1],col,PLN_MAT.leaf,[1,1,0,0],0,0);
  }
  void r;
  /* свет кромки на борта (замечание Контроля к M628): огни кромки — точки; юбку отсека и низ купола над
     настилом ночью кладёт одна лампа у кромки против отсека, ближайшего к объективу (plnOwnFrame) */
  const wash=A.cells.map((cell,c)=>cell&&cell.k&&cell.k!=="solar"&&cell.k!=="battery"?sx(c):null).filter(v=>v!=null);
  return {mods,body:m,light:lm,batt:bm,penn:pm,lampAt:{pier:[px+.25,2.4,pz1-.4],gate:[g0,1.4,-5.2],wash},
    /* тень настила — полосой пятен вдоль него, а не одним бледным кругом (брак M628: «стол без тени») */
    blots:[[dx,.5,3.6,.5]].concat([-3,-2,-1,0,1,2,3].map(i=>[i*hx/3.6,.3,hz*1.15,.42]))};
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
  /* мерить по земле как она есть: срез под двором (plnOwnFlat) сам берёт эту высоту */
  let lo=1e9,crest=-1e9;const f0=L.flat;L.flat=null;
  try{
    for(let i=-3;i<=3;i++)for(const dz of [-6.5,-3,0,3,6])lo=Math.min(lo,plnLandRibAt(L,x+i*3,z+dz));
    for(let zz=0;zz<=z;zz+=2)for(const dx of [-6,0,6])crest=Math.max(crest,plnLandRibAt(L,x+dx,zz));
  }finally{L.flat=f0;}
  const y=Math.max(lo-.4,crest-1);
  const door=homeDoorX(tr,p)/PLN_M-x;
  return {x,y,z,door,lo,porchW:[x+door,y+1.2,z-4.2]};
}
/* срез земли под двором (21pf plnLandRibH): дюна, что выше двора, не встаёт в нём ямой вокруг дома
   (брак M628, 22.10: в пустыне двор сидел в чаше, ступени висели над ней). [x, z, rx, rz, y] — эллипс
   террасы, земля на подошве площадки */
function plnOwnFlat(L){
  const tr=L&&L.tr,p=tr&&tr.p;
  if(!OWN.on||!p)return null;
  const o=[];
  if(typeof homeHereP==="function"&&homeHereP(p)){const A=plnOwnHomeAt(L,tr,p);if(A)o.push([A.x,A.z+.4,10.6,7.4,A.y-.06]);}
  const V=typeof plnSetFlat==="function"?plnSetFlat(L):null;   /* полка посёлка (21pii) */
  if(V)for(const f of V)o.push(f);
  const J=typeof plnTinFlat==="function"?plnTinFlat(L):null;   /* плита Жестянки (21piia) */
  if(J)for(const f of J)o.push(f);
  return o.length?o:null;
}
/* ── теплица: грядки читают вид (M204) ──
   Имя вида — его паспорт: в нём форма (PLANT_FORM_K) и признак (plantTraitWord). Тело собирает тот же
   генератор вида (20e speciesPlant) от потока по имени, форма и признак берутся из самого имени —
   «грибной, светящийся» растёт грибом и светится, «колючий» несёт шипы. Анатомия — 21pia (plnHerbMesh),
   краска — мира, где стоит теплица. Рост — доля greenGrow: всход, потом взрослое; старым в теплице не бывает */
const OWN_GREEN={tx:6.6,tz:2,hl:3,rw:1.6,ky:2.3,film:.62,bz:i=>2-3+.75+i*1.5};   /* film — непрозрачность плёнки днём */
const OWN_GREEN_SP=new Map();
function plnOwnGreenSp(name,p){
  const key=name+"|"+((p&&p.type)||"");let sp=OWN_GREEN_SP.get(key);
  if(sp)return sp;
  let h=2166136261>>>0;
  for(let i=0;i<name.length;i++){h^=name.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}
  const r=rng(h),ws=name.split(","),tw=(ws[1]||"").trim();
  let kind=PLANT_FORM_K.indexOf(ws[0].trim().split(" ").pop());
  if(kind<0)kind=Math.floor(r()*PLANT_KINDS);
  sp=speciesPlant(r,p&&p.T?p:{T:TYPES.terran,type:"terran"},{hueBias:r(),giantChance:0,scale:1},kind);
  sp.name=name;
  if(tw){sp.glow=tw==="светящийся";
    if(!sp.glow){sp.spiny=tw==="колючий"&&plantStemForm(kind);
      if(/^(цветущий|жёсткий|гибкий)$/.test(tw))sp.bloom=tw==="цветущий";
      if(tw==="жёсткий")sp.wK=Math.max(sp.wK,2);else if(tw==="гибкий")sp.wK=Math.min(sp.wK,1.8);}}
  OWN_GREEN_SP.set(key,sp);
  return sp;
}
/* тела грядок записями: на гряду — один вид, три куста (ковровый — четыре, широкая крона — два), рост
   вида ужат под свод. Гряды занимают по росту: низкий вид — к объективу, высокий — к стене, иначе
   шляпки передней гряды закрывали остальные три */
const OWN_GREEN_WIDE=[1,2,7,9];
function plnOwnGreenBuild(A,beds,p,sd){
  const {tx}=OWN_GREEN,a=new Float32Array(16*16),parts=[];let n=0;
  const row=beds.slice(0,GREEN_BEDS).map((b,i)=>{if(!b.name||b.g<.02)return null;
    const sp=plnOwnGreenSp(b.name,p);return {b,i,sp,hm:clamp(sp.h/PLN_M*.3,.35,1)*(.3+.7*b.g)};}).filter(Boolean);
  row.sort((u,v)=>u.hm-v.hm||u.i-v.i);
  row.forEach(({b,i,sp,hm},slot)=>{
    const geo=plnGeo(plnHerbMesh(sp,i,b.g<.35?0:1)),first=n,z=OWN_GREEN.bz(slot+GREEN_BEDS-row.length);
    const C=plnHerbTone(PLN_TINTS[PLN_HERB.tints[i%3]],sp.leaf),k=sp.kind===6?4:(OWN_GREEN_WIDE.indexOf(sp.kind)>=0?2:3);
    for(let j=0;j<k;j++){const hh=hashi(sd,i*7+j,0x6EED),jt=1+(((hh>>>9)&255)/255-.5)*.2;
      const pos=[A.x+tx+(j-(k-1)/2)*2.1/k,A.y+.33,A.z+z+((hh&255)/255-.5)*.18],yaw=((hh>>>3)&255)/255*TAU;
      if(sp.kind===4)plnRec(a,n++,pos,hm*jt,yaw,1,n,[jt,jt,jt],0);
      else plnRec(a,n++,pos,hm*jt,yaw,1,n,plnMul(C.under,jt),2,plnMul(C.top,jt));}
    parts.push({geo,first,count:n-first});});
  return n?{parts,inst:plnInst(a,n,n),n}:null;
}
function plnOwnHomeMesh(L,A,sd,beds,penn){
  const C=PLN_MARK_COL,P=PLN_PAL,m=plnMesh(1<<14),lm=plnMesh(1<<10),bm=plnMesh(256),gm=plnMesh(512),pm=plnMesh(256);
  const K=plnOwnKit(m,lm),dr=A.door;
  const gy=(lx,lz)=>plnLandRibAt(L,A.x+lx,A.z+lz)-A.y;
  const steel=plnOwnSteel(plnMix3(C.steel,C.steelLt,.62),.25,sd),dark=plnOwnSteel(C.steelDk,.2,sd+3),conc=plnOwnSteel(C.concrete,.2,sd+5);
  const roof=plnOwnSteel(plnMix3(C.steel,C.steelLt,.8),.12,sd+11);
  const trod=(u,p2)=>plnMix3(P.soilDark,P.soil,.35+.3*(.5+.5*plnNoise(p2[0]*.7,p2[2]*.7,sd+9)));
  /* двор: утоптанная площадка с насыпью до грунта; дорожка от линии хода к крыльцу */
  /* терраса: тонкая утоптанная площадка на пологом земляном холме — откос, а не ящик */
  plnBlob(m,{c:[0,-.2,0],r:[9.6,.22,6.6],sub:3,box:.3,bump:.02,seed:sd,col:trod,mat:PLN_MAT.rock,x:.05});
  if(A.y-A.lo>.6)plnBlob(m,{c:[0,-(A.y-A.lo)*.5-.4,.4],r:[10.6+(A.y-A.lo)*.6,(A.y-A.lo)*.5+.7,7.4+(A.y-A.lo)*.5],sub:3,box:.6,bump:.22,seed:sd+1,
    col:(u,p2)=>plnMix3(P.rockWarm,P.rockCool,.5+.3*plnNoise(p2[0]*.3,p2[2]*.3+p2[1]*.3,sd+4)),mat:PLN_MAT.rock});
  /* дорожка от линии хода к проходу в заборе — плиты на земле ступенями, последняя вровень с двором */
  {const z0=-A.z+.3,z1=-6.9,n=3;
   /* плита лежит на земле (была доля от высоты — висела над ложбиной, брак M628) */
   /* ступень — брусок до земли, а не плита в воздухе: от линии хода до двора бывает метр */
   for(let i=0;i<n;i++){const z=lerp(z0,z1,(i+.5)/n),g=gy(dr,z),h=i===n-1?0:clamp(g,-1.2,0),b=Math.min(h-.18,g-.25);
     K.box([dr+(i&1?.12:-.1),(h+.02+b)/2,z],[.85,(h+.02-b)/2,.42],conc,{box:.3});}}
  /* корпус 7 × 4: стены, пояс рубочного стекла, крыша-козырёк; оранжевый пояс по цоколю */
  /* днём дом — освещённое тело с одной тёмной гранью: стены светлее, кромки круглее, крыша берёт солнце */
  K.box([0,1.1,1],[3.5,1.1,2],(u,p2,n)=>p2[1]<.35?plnMix3(C.orange,C.rust,.2):steel(u,p2,n),{box:.34,sub:3});
  K.box([0,2.47,1],[3.42,.28,1.94],[.24,.29,.36],{box:.2});
  K.box([0,2.95,1.05],[3.75,.22,2.25],roof,{box:.4});
  K.glass([.9,2.47,-.98],2.3,.2,OWN_WIN.home,1.25,false);
  for(let j=-2;j<=2;j++)K.rod([.9+j*.92,2.27,-1],[.9+j*.92,2.67,-1],.022,C.soot,{sides:4,cap:false});
  K.glass([-2.9,2.47,-.98],.42,.2,OWN_WIN.home,.9,false);
  /* крыльцо 2 м под фонарём: настил, навес на двух стойках, дверь */
  K.box([dr,.1,-2],[1.5,.1,1],conc,{box:.25});
  K.box([dr,2.62,-1.9],[1.65,.07,1.12],roof,{box:.25});
  for(const s of [-1,1])K.rod([dr+s*1.45,.2,-2.9],[dr+s*1.45,2.58,-2.9],.05,dark,{sides:6});
  K.box([dr,1.05,-1.03],[.55,1.05,.05],C.soot,{box:.2});
  /* дверь — полотно с окошком и щелью света понизу (ночью была пересвеченной карточкой) */
  K.box([dr,1.02,-1.09],[.44,.98,.025],plnOwnSteel(C.steelLt,.2,sd+13),{box:.2});
  K.glass([dr,1.5,-1.13],.26,.2,OWN_WIN.home,1.15,false);
  K.pane(null,[dr,.06,-1.13],.4,.025,OWN_WIN.lamp,1.1);
  K.lamp(null,[dr+.95,2.38,-2.75],[.13,.15,.13],OWN_WIN.lamp,2.4);
  /* заслонки фонаря (M628b): стойки навеса и передний ряд забора — [a, b, r, сила] в местных метрах */
  const occ=[-1,1].map(s=>[[dr+s*1.45,.2,-2.9],[dr+s*1.45,2.58,-2.9],.07,.8]);
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
  /* вымпел — под маяком, когда дом на этой планете (ответ дизайнера 08.10) */
  if(penn){const fy=7.7,col=[.66,.24,.17];
    plnCard(pm,[mx,fy-.4,mz],[mx,fy+.4,mz],[mx+1.5,fy+.26,mz],[mx+1.5,fy-.18,mz],[0,0,-1],col,PLN_MAT.leaf,[0,0,1,1],0,0);
    plnCard(pm,[mx+1.5,fy-.18,mz],[mx+1.5,fy+.26,mz],[mx,fy+.4,mz],[mx,fy-.4,mz],[0,0,1],col,PLN_MAT.leaf,[1,1,0,0],0,0);}
  /* теплица: рёбра свода на дальней стороне двора, внутри грядки 21g и холодная лампа */
  /* свод 2.3 м в коньке (был 1.45 — лампа и прогоны висели над ним); прогоны лежат на рёбрах */
  /* рёбра — тоном ниже дома (замечание Контроля: светлые рёбра сливались с молочной плёнкой в один купол) */
  const {tx,tz,hl,rw,ky}=OWN_GREEN,rib=plnMix3(C.steelLt,C.steelDk,.45);
  for(let k=0;k<=6;k++){const z=tz-hl+k;
    plnTube(m,{path:plnBez([tx-rw,0,z],[tx,ky*2,z],[tx+rw,0,z],8),rad:k%6?.045:.075,sides:5,col:rib,mat:PLN_MAT.man});}
  for(const t of [.2,.5,.8]){const x=tx+rw*(2*t-1),y=4*t*(1-t)*ky;K.rod([x,y,tz-hl],[x,y,tz+hl],.035,rib,{sides:4});}
  K.box([tx,.12,tz],[rw,.12,hl],conc,{box:.25});
  plnTube(gm,{path:[[tx,ky-.25,tz-hl+.4],[tx,ky-.25,tz+hl-.4]],rad:.05,sides:5,col:OWN_WIN.grow,mat:PLN_MAT.glow,glow:2.4,x:1,cap:true});
  /* плёнка по рёбрам (замечание к M204): молочная, бока подвёрнуты валиком на 0.4 м — гряды видно и с
     торца, и снизу сбоку. Днём она полупрозрачна (vm — вуаль, запись 6): сквозь неё видны гряды, восемь
     полотнищ через одно темнее тоном (планка шва тоньше пикселя дробилась в пунктир — свод читался сеткой). Ночью поверх — тёплый накал (fm,
     запись 5 по доле ночи): теплица — фонарь у дома, ночной кадр прежний */
  const fm=plnMesh(256),vm=plnMesh(256),arc=t=>[tx+rw*(2*t-1),4*t*(1-t)*ky],film=plnMix3(C.steelLt,[.84,.88,.84],.65),
    filmB=plnMix3(film,[.5,.54,.5],.4);
  {const t0=.12,n=8;
   for(let i=0;i<n;i++){const ta=lerp(t0,1-t0,i/n),tb=lerp(t0,1-t0,(i+1)/n),a=arc(ta),b=arc(tb);
     const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy),nn=[dy/l,-dx/l,0];
     const N=nn[1]<0?[-nn[0],-nn[1],0]:nn,o=.08,q=.1;   /* плёнка поверх каркаса: рёбра просвечивают сквозь молоко */
     plnCard(vm,[a[0]+N[0]*o,a[1]+N[1]*o,tz-hl],[a[0]+N[0]*o,a[1]+N[1]*o,tz+hl],[b[0]+N[0]*o,b[1]+N[1]*o,tz+hl],[b[0]+N[0]*o,b[1]+N[1]*o,tz-hl],N,i%2?filmB:film,PLN_MAT.glow,null,1,0);
     plnCard(fm,[a[0]+N[0]*q,a[1]+N[1]*q,tz-hl],[a[0]+N[0]*q,a[1]+N[1]*q,tz+hl],[b[0]+N[0]*q,b[1]+N[1]*q,tz+hl],[b[0]+N[0]*q,b[1]+N[1]*q,tz-hl],N,OWN_WIN.film,PLN_MAT.glow,null,1,1);}
   for(const t of [t0,1-t0]){const p2=arc(t);K.rod([p2[0],p2[1],tz-hl],[p2[0],p2[1],tz+hl],.07,rib,{sides:6});}}
  /* гряды — короба с тёмной землёй, все четыре: пустая читается незасеянной; тела видов — записями (plnOwnGreenBuild) */
  const soil=(u,p2)=>plnMix3(P.soilDark,[.1,.08,.06],.5+.3*plnNoise(p2[0]*4,p2[2]*4,sd+21));
  for(let i=0;i<GREEN_BEDS;i++){const z=OWN_GREEN.bz(i);
    K.box([tx,.2,z],[1.3,.12,.56],conc,{box:.25});
    K.box([tx,.31,z],[1.2,.04,.47],soil,{box:.3});}
  /* забор: столбы 1.1 м через 2.5 м, две проволоки, проход к крыльцу */
  const fx=9.3,fz=6.3,run=(a,b,gap)=>{const L2=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.round(L2/2.5);
    let prev=null;
    for(let k=0;k<=n;k++){const t=k/n,x=lerp(a[0],b[0],t),z=lerp(a[1],b[1],t);
      if(gap&&Math.abs(x-gap)<1.3){prev=null;continue;}
      K.rod([x,-.1,z],[x,1.1,z],.045,dark,{sides:5});
      if(gap!=null&&Math.abs(x-dr)<8)occ.push([[x,-.1,z],[x,1.1,z],.07,.9]);
      if(prev)for(const h of [.45,.9])K.rod([prev[0],h,prev[1]],[x,h,z],.008,C.steelLt,{sides:3,cap:false});
      prev=[x,z];}};
  run([-fx,-fz],[fx,-fz],dr);run([-fx,-fz],[-fx,fz]);run([fx,-fz],[fx,fz]);run([-fx,fz],[fx,fz]);
  return {body:m,light:lm,beacon:bm,grow:gm,penn:pm,film:fm,veil:vm,occ,lampAt:{porch:[dr+.95,2.3,-2.75],grow:[tx,ky-.3,tz]},blots:[[0,1,4.2,.45],[5.8,1.2,2.4,.4]]};
}

/* ── сборка: раз на посадку и состав ── */
function plnOwnFree(it){
  if(!it)return;
  for(const k of ["geo","light","aux","beam","fx","film","veil"])if(it[k])plnGeoFree(it[k]);
  if(it.inst)plnInstFree(it.inst);
  if(it.green){for(const q of it.green.parts)plnGeoFree(q.geo);plnInstFree(it.green.inst);it.green=null;}
}
function plnOwnItem(kind,A,M,sd,key){
  const g=x=>x&&x.nv?plnGeo(plnMeshDone(x)):null;
  const it={kind,A,key,sd,geo:g(M.body),light:g(M.light),aux:g(M.batt||M.beacon),beam:g(M.grow),fx:g(M.penn),film:g(M.film),veil:g(M.veil),
    lampAt:M.lampAt,blots:M.blots,occ:M.occ||[],a:new Float32Array(16*7),inst:null};
  for(let i=0;i<7;i++)plnRec(it.a,i,[A.x,A.y,A.z],1,0,1,sd%97,i?[1,1,1]:null);
  it.inst=plnInst(it.a,7,7);
  return it;
}
/* lim — бюджет кадра (заход): собрал базу и бюджет кончился — false, дом соберёт следующий вызов */
function plnOwnStep(L,S,lim){
  const O=OWN,tr=S.tr,p=S.p,t0=wallMs();let made=false;
  if(O.gen!==PLN_GPU.gen||O.L!==L){plnOwnFree(O.base);plnOwnFree(O.home);O.base=O.home=null;O.gen=PLN_GPU.gen;O.L=L;}
  const B=baseAt(G.sx,G.sy,p.idx);
  if(B){
    const A=plnOwnBaseAt(L,tr,p,B),bt=plnOwnBattOf(B),pn=plnOwnPennHere(p)&&!(typeof homeHereP==="function"&&homeHereP(p));
    const key=A.cells.map(c=>c?c.k:"-").join(",")+"|"+(bt!=null)+"|"+pn;
    if(!O.base||O.base.key!==key){plnOwnFree(O.base);
      const sd=hashi(p.seed|0,0xBA5,17);O.base=plnOwnItem("base",A,plnOwnBaseMesh(L,A,sd,bt,pn),sd,key);made=true;}
    O.base.batt=bt;O.gate=A.gx*PLN_M;
  }else{plnOwnFree(O.base);O.base=null;O.gate=null;}
  if(made&&lim!=null&&wallMs()-t0>lim)return false;
  const H=(typeof homeHereP==="function"&&homeHereP(p))?plnOwnHomeAt(L,tr,p):null;
  if(H){
    const beds=greenAll().beds.map(b=>({g:greenGrow(b),name:b.name})),pn=plnOwnPennHere(p),key=beds.map(b=>b.name+":"+Math.round(b.g*8)).join(",")+"|"+pn;
    if(!O.home||O.home.key!==key){plnOwnFree(O.home);
      const sd=hashi(G.sx,G.sy,0x40E7);O.home=plnOwnItem("home",H,plnOwnHomeMesh(L,H,sd,beds,pn),sd,key);
      O.home.green=plnOwnGreenBuild(H,beds,p,sd);}
    O.porch=(H.x+H.door)*PLN_M;
  }else{plnOwnFree(O.home);O.home=null;O.porch=null;}
  if(lim!=null&&wallMs()-t0>lim)return false;
  if(typeof plnTinStep==="function")plnTinStep(L,S);   /* Жестянка (21piia) */
  if(typeof plnTrcStep==="function")plnTrcStep(L,S);   /* чужой след (21piib) */
  if(typeof plnGlwStep==="function")plnGlwStep(L,S);   /* уезд света (21piic) */
  return typeof plnSetStep==="function"?plnSetStep(L,S):true;   /* посёлок (21pii) */
}
/* Ставит свои вещи в кадр: тела, свет записями, лампы ночью. ex — где объектив, V — {hw, D}, nk — ночь */
function plnOwnFrame(L,F,S,p,ex,V,nk){
  if(!OWN.on||!S||!S.tr||!S.p)return;
  plnOwnStep(L,S);
  const Bk=PLN_KIND.body,TO=PLN_TO.all,LIT=PLN_TO.lit,t=F.t,b=F.blobs;
  let n=b[0]|0;
  const want=[];OWN.keyLamp=null;OWN.occ=[];
  for(const it of [OWN.base,OWN.home]){
    if(!it)continue;
    const A=it.A,pos=[A.x,A.y,A.z];
    if(Math.abs(A.x-ex)>V.hw*(1+A.z/V.D)+24)continue;
    const warm=.12+.6*nk;   /* стёкла ночью не выше ~1.4: ярче свёртка уводит тёплое в лосось */
    plnRec(it.a,1,pos,1,0,1,0,[warm,warm,warm]);
    let ak=1;
    if(it.kind==="base")ak=it.batt==null?0:.15+1.1*it.batt;
    else ak=.6+.4*Math.sin(t*1.3+it.sd%7);   /* маяк дышит */
    plnRec(it.a,2,pos,1,0,1,0,[ak,ak,ak]);
    /* накал плёнки теплицы — с сумерек: раньше молочная плёнка под солнцем светлее накала */
    const fk=plnSmooth(.3,.8,nk);
    plnRec(it.a,5,pos,1,0,1,0,[fk,fk,fk]);
    /* плёнка днём — вуаль: молочная, светлая под солнцем, к ночи гаснет (её накрывает накал) */
    const fd=1.05*(1-.85*plnSmooth(0,.6,nk));
    plnRec(it.a,6,pos,1,0,1,0,[fd,fd,fd],3,[OWN_GREEN.film,0,0]);
    plnInstSet(it.inst,it.a,7);
    if(it.geo)F.batches.push({geo:it.geo,inst:it.inst,first:0,count:1,kind:Bk,to:TO});
    if(it.light)F.batches.push({geo:it.light,inst:it.inst,first:1,count:1,kind:Bk,to:LIT});
    if(it.aux&&ak>.01)F.batches.push({geo:it.aux,inst:it.inst,first:2,count:1,kind:Bk,to:LIT});
    if(it.beam)F.batches.push({geo:it.beam,inst:it.inst,first:3,count:1,kind:Bk,to:LIT});
    if(it.fx)F.batches.push({geo:it.fx,inst:it.inst,first:4,count:1,kind:Bk,to:TO});
    if(it.film&&fk>.01)F.batches.push({geo:it.film,inst:it.inst,first:5,count:1,kind:Bk,to:LIT});
    if(it.veil)F.batches.push({geo:it.veil,inst:it.inst,first:6,count:1,kind:PLN_KIND.veil,to:PLN_TO.main});
    if(it.green)for(const q of it.green.parts)F.batches.push({geo:q.geo,inst:it.green.inst,first:q.first,count:q.count,kind:Bk,to:TO});
    /* лампы — ночью (§3): фонарь крыльца — ключ двора с тенью, лампа теплицы — второй свет двора без
       тени, фонарь пирса — ключ базы, свет над воротами; в кадр идут две, по старшинству */
    if(nk>.05){
      const at=la=>[A.x+la[0],A.y+la[1],A.z+la[2]];
      if(it.kind==="home"){
        want.push({o:0,it,l:{p:at(it.lampAt.porch),r:12,c:[1,.68,.38],k:2.6*nk}});
        if(it.lampAt.grow)want.push({o:2,l:{p:at(it.lampAt.grow),r:6.5,c:OWN_WIN.grow,k:1.3*nk}});
      }else{want.push({o:1,l:{p:at(it.lampAt.pier),r:7,c:[1,.68,.38],k:1.8*nk}});
        if(it.lampAt.gate)want.push({o:1.5,l:{p:at(it.lampAt.gate),r:5,c:[1,.74,.45],k:1.2*nk}});
        const ws=it.lampAt.wash||[];let wx=null;
        for(const x of ws)if(wx==null||Math.abs(A.x+x-ex)<Math.abs(A.x+wx-ex))wx=x;
        if(wx!=null)want.push({o:1.2,l:{p:at([wx,OWN_WASH.y,-OWN.deckHZ-1.1]),r:OWN_WASH.r,c:[1,.72,.44],k:OWN_WASH.k*nk}});}
    }
    for(const q of it.blots){if(n>=64)break;b.set([A.x+q[0],A.z+q[1],q[2],q[3]],4+n*4);n++;}
  }
  b[0]=n;
  if(typeof plnSetFrame==="function")plnSetFrame(F,S,ex,V,nk,want);   /* посёлок (21pii): тела, огонь, дым, лампа очага */
  if(typeof plnTinFrame==="function")plnTinFrame(F,S,ex,V,nk,want);   /* Жестянка (21piia): тело, рёбра хода, дым, мигалка */
  if(typeof plnTrcFrame==="function")plnTrcFrame(F,ex,V);   /* чужой след (21piib): плита со знаком, мешки */
  if(typeof plnGlwFrame==="function")plnGlwFrame(F,ex,V,nk,want);   /* уезд света (21piic): банки у площадки, пятна ядра */
  want.sort((u,v)=>u.o-v.o);
  /* в кадр — две по старшинству из тех, чей свет до кадра достаёт: пирс за кромкой уступает лампе кромки у ворот */
  const seen=want.filter(w=>Math.abs(w.l.p[0]-ex)<V.hw*(1+Math.max(0,w.l.p[2])/V.D)+w.l.r);
  for(const w of seen.concat(want.filter(w=>seen.indexOf(w)<0)).slice(0,2)){
    /* ламп у кадра четыре: занятое место уступает та, что светит за кромкой кадра (огни площадки
       далеко за спиной) */
    let ok=false;
    if(F.lamps.length<4){F.lamps.push(w.l);ok=true;}
    else{const j=F.lamps.findIndex(l=>Math.abs(l.p[0]-ex)>V.hw*(1+Math.max(0,l.p[2])/V.D)+l.r);if(j>=0){F.lamps[j]=w.l;ok=true;}}
    if(ok&&w.it){OWN.keyLamp=w.l;const A=w.it.A,W=q=>[A.x+q[0],A.y+q[1],A.z+q[2]];
      const mx=S.x/PLN_M,my=plnY(S.y+10);
      if(Math.abs(mx-w.l.p[0])<w.l.r+1)OWN.occ.push([[mx,my+.18,0],[mx,my+1.52,0],.27,1]);
      for(const o of w.it.occ||[])OWN.occ.push([W(o[0]),W(o[1]),o[2],o[3]]);}
  }
}
/* хвост пятен — заслонки ключевой лампы (M628b): капсула — два vec4 (a, r) и (b, сила) с конца массива,
   их число — blobs.n.y, лампа — blobs.n.z − 1. Зовёт 21pz последним, когда пятна уже легли */
function plnOwnOcc(F){
  const b=F.blobs,lp=OWN.keyLamp;OWN.keyLamp=null;
  b[1]=0;b[2]=0;
  if(!OWN.on||!lp)return;
  const i=F.lamps.indexOf(lp);if(i<0||i>3)return;
  const oc=OWN.occ.slice(0,8);
  b[0]=Math.min(b[0]|0,64-2*oc.length);
  oc.forEach((o,k)=>{b.set([o[0][0],o[0][1],o[0][2],o[2]],4+(63-2*k)*4);b.set([o[1][0],o[1][1],o[1][2],o[3]],4+(62-2*k)*4);});
  b[1]=oc.length;b[2]=i+1;
}
/* площадки для расчистки трав (21pga): [x м, z, rx, rz, рост] */
function plnOwnPads(tr,p,L){
  const o=[];
  if(!OWN.on||!tr||!p)return o;
  if(baseAt(G.sx,G.sy,p.idx)){const x=plnOwnBaseX(tr,p,L);o.push([x,OWN.deckZ,OWN.deckHX+3,OWN.deckHZ+4,12]);}
  const bx=(typeof homeHereP==="function"&&homeHereP(p))?homeSpotX(p,tr):null;
  if(bx!=null)o.push([bx/PLN_M,OWN.yardZ,11,8,9]);
  const v=typeof plnSetPad==="function"?plnSetPad(tr,p):null;if(v)o.push(v);   /* полка посёлка (21pii) */
  const j=typeof plnTinPad==="function"?plnTinPad(tr,p):null;if(j)o.push(j);   /* плита Жестянки (21piia) */
  const t=typeof traceHere==="function"&&G.surf&&G.surf.p===p?traceHere():null;   /* чужой след (21piib) */
  if(t&&t.x!=null)o.push([t.x/PLN_M+.9,1.9,2.4,1.4,3]);
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
  if(OWN.base&&/ВОЙТИ В БАЗУ/.test(pr))return {c:plnOwnGateC(),h:2.4,id:"pln.gate",up:true};
  if(OWN.home&&/ВОЙТИ ДОМОЙ/.test(pr)){const A=OWN.home.A;return {c:[A.x+A.door,A.y+2.9,A.z-2],h:2.6,id:"pln.porch"};}
  return null;
}
/* точка ворот для табличек — середина двери (а не её верх), радиус обнимает дверь: табличка встаёт у
   двери сверху, а не на куполе соседнего отсека; на телефоне дверь в средней полосе кадра — сбоку от неё
   (брак M628, 22.10: висела на 230 px выше, в небе) */
function plnOwnGateC(){const A=OWN.base.A;return [A.gx,A.y+1.2,A.z-OWN.deckHZ+.4];}
/* у ворот строку забрало другое действие (зверь ближе двери, залежь, шаг за радиусом ворот): ворота
   держат свою плашку с расстоянием, чтобы было видно, куда шагнуть */
function plnOwnGateNote(S){
  const g=plnOwnGateX(S),pr=String(G.prompt||"");
  if(g==null||!OWN.base||!S||Math.abs(S.x-g)>PLN_OWN_GATE_R*1.5||!/ДЕЙСТВИЕ/.test(pr)||/ВОЙТИ В БАЗУ/.test(pr))return null;
  const A=OWN.base.A,B=baseAt(G.sx,G.sy,S.p.idx),m=Math.max(1,Math.round(Math.abs(g-S.x)/PLN_M));
  return {c:plnOwnGateC(),h:2.4,id:"pln.gatenote",up:true,
    lines:["ВОРОТА БАЗЫ"+(B&&B.name?" «"+B.name+"»":"")+" · "+m+" М "+(g>S.x?"▶":"◀")]};
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
/* у ворот ворота важнее скана (брак M628, 22.10: в океане «СКАНИРОВАТЬ ОРГАНИЗМ» забирал жест у двери).
   Зверь или растение дальше двери на время кадра цепочки 21-mode-surface прячутся от выбора: растения —
   из списка (в кадре его читает только выбор), звери — флагами scanned+caught (их ходьбу и rnd не трогаем,
   а ветка «ПОЙМАТЬ» тоже молчит). Ближе двери — скан, как прежде */
function plnOwnGateHide(S){
  if(!OWN.on||!S||S.on===false||S.jetOn)return null;
  const g=plnOwnGateX(S);if(g==null)return null;
  const dg=Math.abs(S.x-g);if(dg>=PLN_OWN_GATE_R)return null;
  const P=S.plants||[],keep=P.filter(pl=>pl.scanned||Math.abs(pl.x-S.x)<dg),fl=[];
  for(const b of S.fauna||[])if(!b.caught&&Math.abs(b.x-S.x)>=dg){fl.push([b,b.scanned]);b.scanned=true;b.caught=true;}
  if(keep.length===P.length&&!fl.length)return null;
  const H={P,fl};S.plants=keep;return H;
}
function plnOwnGateShow(S,H){
  if(!H)return;
  S.plants=H.P;
  for(const [b,sc] of H.fl){b.scanned=sc;b.caught=false;}
}
const PLN_OWN_OLD_UPD=updateSurface;
updateSurface=function(dt){
  PLN_OWN_UPD=true;
  const S0=G.surf,H=plnOwnGateHide(S0);
  try{PLN_OWN_OLD_UPD(dt);}finally{PLN_OWN_UPD=false;plnOwnGateShow(S0,H);}
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
