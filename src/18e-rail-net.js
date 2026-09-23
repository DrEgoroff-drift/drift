/* ══════════════ железная дорога: сеть (M470, docs/DESIGN-metro.md §2) ══════════════
   Прыжок — для близкого, рельсы — для далёкого. Сеть существует по зерну и
   ничего о себе не хранит: линии и остановки — функции мира.

   Москва в сердце, страна дальше:
   • РАДИУСЫ — шесть от Кольцевой, по углам домов держав (CHRON_HOME), и они
     ВЕТВЯТСЯ наружу, как река наоборот: на радиусах 6·1.9^k каждый делится на
     два, так что густота линий по кругу ровная — 6 на r 6, 12 к r 11, 24 к r 22,
     48 к r 41 и дальше;
   • КОЛЬЦА — Кольцевая на r 6 (там Ялта, «Площадь Шести Держав»), Большое на
     r 18, Дальнее на r 35, дальше каждые ×1.9;
   • ТРАССЫ — по двум рукавам галактики (galaxyAt, M447), страны великие линии.

   Остановка — ближайшая к шагу система СО СТАНЦИЕЙ; шаг с пустотой пропущен
   (перегон — это свойство, а не дыра). Где линии сходятся — развилки и
   пересечения колец, — остановка выбирается одной и той же функцией для
   обеих линий, поэтому она общая: это пересадка, и сеть связна по построению.
   Дальше r 40 — одиночные пути и полустанки.

   Считается лениво, один раз, до RAIL_R; дальше «бесконечно» — M474. */
const RAIL_R=60;                                  /* докуда строим сейчас, секторов */
const RAIL_FORK=[6,11.4,21.66,41.15,78.2];        /* радиусы развилок: 6·1.9^k */
const RAIL_RINGS=[6,18,35];                       /* Кольцевая, Большое, Дальнее (дальше ×1.9 — за RAIL_R) */
const RAIL_RING_RU=["Кольцевая","Большое кольцо","Дальнее кольцо"];
const RAIL_ARM_RU=["Рыжий рукав","Долгий рукав"];
const RAIL_METRO_R=12;                            /* метро внутри круга заселения */
const RAIL_RIM=40;                                /* дальше — полустанки */
const RAIL_SALT=0x7A11;
let RAIL_NET=null;
/* ближайшая система со станцией к точке, в пределах tol; одна функция на всех —
   поэтому общая точка двух линий даёт одну и ту же станцию */
function railNearest(x,y,tol){
  const R=Math.ceil(tol),cx=Math.round(x),cy=Math.round(y);
  let best=null,bd=1e9;
  for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){
    const sx=cx+dx,sy=cy+dy,d=Math.hypot(sx-x,sy-y);
    if(d>tol||d>=bd||!starAt(sx,sy))continue;
    if(!getSystem(sx,sy).station)continue;
    best={sx,sy};bd=d;
  }
  return best;
}
function railStep(r,x,y){return r<=RAIL_METRO_R?2:4+4*h01(Math.round(x),Math.round(y),RAIL_SALT);}
/* линия: плотная ломаная + якоря (доли длины, где остановка обязательна) */
function railPolar(r0,a0,r1,a1,n){
  const pts=[];for(let i=0;i<=n;i++){const u=i/n,r=r0+(r1-r0)*u,a=a0+(a1-a0)*u;pts.push([Math.cos(a)*r,Math.sin(a)*r]);}
  return pts;
}
function railLen(pts){let L=0;for(let i=1;i<pts.length;i++)L+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);return L;}
/* угол ветви (k,j) на её конце: 60° сектора державы делятся на 2^k ровно */
function railBranchAng(k,j){
  const n=1<<k,i=Math.floor(j/n),h=CHRON_HOME[i],a0=Math.atan2(h[1],h[0]);
  return a0+((j%n)+.5)/n*(Math.PI/3)-Math.PI/6;
}
function railBuildLines(){
  const lines=[];
  /* радиусы с развилками: ветвь (k,j) идёт от F[k] до F[k+1] (последняя — до RAIL_R) */
  for(let k=0;k<RAIL_FORK.length-1&&RAIL_FORK[k]<RAIL_R;k++){
    const n=6<<k;
    for(let j=0;j<n;j++){
      const r0=RAIL_FORK[k],r1=Math.min(RAIL_R,RAIL_FORK[k+1]);
      const a0=k?railBranchAng(k-1,j>>1):railBranchAng(0,j),a1=railBranchAng(k,j);
      const nn=Math.max(4,Math.ceil((r1-r0)*2)),pts=railPolar(r0,a0,r1,a1,nn);
      /* якоря: обе развилки и каждое кольцо, которое ветвь пересекает */
      const anchors=[0,1];
      for(const R of RAIL_RINGS)if(R>r0&&R<r1)anchors.push(railUAt(pts,(R-r0)/(r1-r0)*nn));
      lines.push({id:"r"+k+"."+j,kind:"radial",k,j,num:(j%6)+1+6*k,pts,
        ru:"Линия "+((j%6)+1)+(k?"-"+(j+1):""),anchors});
    }
  }
  /* кольца: остановки обязательны на пересечениях с радиусами */
  RAIL_RINGS.forEach((R,ri)=>{
    const N=Math.ceil(TAU*R*2),pts=[];
    for(let i=0;i<=N;i++){const a=i/N*TAU;pts.push([Math.cos(a)*R,Math.sin(a)*R]);}
    let k=0;while(k<RAIL_FORK.length-1&&RAIL_FORK[k+1]<=R)k++;
    const anchors=[];
    for(let j=0;j<(6<<k);j++){
      const r0=RAIL_FORK[k],r1=RAIL_FORK[k+1],u=(R-r0)/(r1-r0);
      const a0=k?railBranchAng(k-1,j>>1):railBranchAng(0,j),a1=railBranchAng(k,j);
      anchors.push((((a0+(a1-a0)*u)%TAU)+TAU)%TAU/TAU);
    }
    /* и где кольцо режет трасса рукава */
    for(let m=0;m<2;m++){const a=railArmAng(m,R);anchors.push(((a%TAU)+TAU)%TAU/TAU);}
    anchors.sort((a,b)=>a-b);
    lines.push({id:"c"+ri,kind:"ring",pts,ru:RAIL_RING_RU[ri],anchors,loop:true});
  });
  /* трассы по рукавам: остановки обязательны там, где рукав режет кольцо */
  for(let m=0;m<2;m++){
    const pts=[],r0=GAL_BAR_L*.6;
    const at=r=>railArmAng(m,r);
    for(let r=r0;r<=RAIL_R;r+=.5){const a=at(r);pts.push([Math.cos(a)*r,Math.sin(a)*r]);}
    const L=railLen(pts),anchors=[];
    for(const R of RAIL_RINGS){
      /* доля длины до радиуса R: ищем по точкам */
      let acc=0;for(let i=1;i<pts.length;i++){acc+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);
        if(Math.hypot(pts[i][0],pts[i][1])>=R){anchors.push(acc/L);break;}}
    }
    lines.push({id:"a"+m,kind:"arm",pts,ru:"Трасса «"+RAIL_ARM_RU[m]+"»",anchors});
  }
  return lines;
}
/* угол трассы рукава m на радиусе r — та же спираль, что у галактики */
function railArmAng(m,r){return GAL_BAR_A+m*Math.PI+Math.log(Math.max(r,GAL_R0)/GAL_R0)/GAL_PITCH;}
/* доля длины ломаной до дробного индекса точки */
function railUAt(pts,idx){
  const L=railLen(pts);let acc=0;const n=Math.floor(idx);
  for(let i=1;i<=n&&i<pts.length;i++)acc+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);
  if(n+1<pts.length)acc+=(idx-n)*Math.hypot(pts[n+1][0]-pts[n][0],pts[n+1][1]-pts[n][1]);
  return L?acc/L:0;
}
/* точка на ломаной по доле длины */
function railAt(pts,u){
  const L=railLen(pts);let want=u*L,acc=0;
  for(let i=1;i<pts.length;i++){
    const d=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);
    if(acc+d>=want){const t=d?(want-acc)/d:0;return [pts[i-1][0]+(pts[i][0]-pts[i-1][0])*t,pts[i-1][1]+(pts[i][1]-pts[i-1][1])*t];}
    acc+=d;
  }
  return pts[pts.length-1];
}
/* остановки линии: якоря — жёстко (общие с соседней линией), между ними — по шагу */
function railStopsOf(line){
  const pts=line.pts,L=railLen(pts),out=[],seen=new Set();
  const add=(s,u,anchor)=>{
    if(!s)return;const key=s.sx+","+s.sy;
    if(seen.has(key))return;
    seen.add(key);out.push({sx:s.sx,sy:s.sy,u,anchor:!!anchor,halt:Math.hypot(s.sx,s.sy)>RAIL_RIM});
  };
  const marks=[];
  for(const a of line.anchors)marks.push({u:a,anchor:true});
  let acc=0;
  while(acc<L){
    const p=railAt(pts,acc/L),r=Math.hypot(p[0],p[1]);
    marks.push({u:acc/L,anchor:false});
    acc+=railStep(r,p[0],p[1]);
  }
  marks.sort((a,b)=>a.u-b.u);
  for(const m of marks){
    const p=railAt(pts,m.u);
    if(m.anchor)add(railNearest(p[0],p[1],3.2),m.u,true);
    else{const r=Math.hypot(p[0],p[1]);add(railNearest(p[0],p[1],railStep(r,p[0],p[1])*.45),m.u,false);}
  }
  /* в порядке хода: якорь и шаг могли выбрать станции вперемешку */
  out.sort((a,b)=>a.u-b.u);
  return out;
}
function railNet(){
  if(RAIL_NET)return RAIL_NET;
  const lines=railBuildLines(),at={};
  for(const l of lines){
    l.stops=railStopsOf(l);
    for(const s of l.stops){const k=s.sx+","+s.sy;(at[k]||(at[k]=[])).push(l.id);}
  }
  const byId={};for(const l of lines)byId[l.id]=l;
  return RAIL_NET={lines,at,byId};
}
/* что за станция в этой системе: линии через неё; пересадка — две и больше */
function railStation(sx,sy){
  const N=railNet(),ids=N.at[sx+","+sy];
  if(!ids)return null;
  return {lines:ids.map(id=>N.byId[id]),junction:ids.length>1,halt:Math.hypot(sx,sy)>RAIL_RIM,
    metro:Math.hypot(sx,sy)<=RAIL_METRO_R};
}
/* ── на карте: сеть бледными кривыми 1:1 с листом (M470 «схема на галактике») ──
   Полный счёт сети — доли секунды; на открытии карты это был бы рывок. Карта
   достраивает сеть по одной линии за кадр и рисует то, что уже готово. */
let RAIL_PART=null;
function railNetPartial(){
  if(RAIL_NET)return RAIL_NET.lines;
  if(!RAIL_PART)RAIL_PART={lines:railBuildLines(),i:0};
  const P=RAIL_PART;
  if(P.i<P.lines.length){P.lines[P.i].stops=railStopsOf(P.lines[P.i]);P.i++;}
  if(P.i>=P.lines.length){
    const at={},byId={};
    for(const l of P.lines){byId[l.id]=l;for(const s of l.stops){const k=s.sx+","+s.sy;(at[k]||(at[k]=[])).push(l.id);}}
    RAIL_NET={lines:P.lines,at,byId};RAIL_PART=null;return RAIL_NET.lines;
  }
  return P.lines.slice(0,P.i);
}
const RAIL_COL={radial:[226,214,200],ring:[242,178,92],arm:[127,230,216]};
function drawRailMap(V,cell,pale){
  const L=railNetPartial();
  const X=x=>W/2+(x-V.x)*cell,Y=y=>H/2+(y-V.y)*cell;
  ctx.save();ctx.lineCap="round";ctx.lineJoin="round";
  /* издали сеть — тонкий каркас галактики; вблизи, где по ней прокладывают
     путь, линия набирает плотность и кайму, как на схеме метро (D13) */
  const k=pale?0:clamp((cell-14)/34,0,1);   /* в вагоне прочие линии бледные (M473) */
  const path=l=>{ctx.beginPath();for(let i=0;i<l.pts.length;i++){const p=l.pts[i];i?ctx.lineTo(X(p[0]),Y(p[1])):ctx.moveTo(X(p[0]),Y(p[1]));}};
  if(k>0){
    ctx.strokeStyle="rgba(4,6,10,"+(.5*k).toFixed(3)+")";
    for(const l of L){ctx.lineWidth=(l.kind==="radial"?1:1.4)+k*3.4;path(l);ctx.stroke();}
  }
  for(const l of L){
    const c=RAIL_COL[l.kind],r=l.kind==="radial";
    ctx.strokeStyle=rgba(c,((r?.13:.18)+k*(r?.32:.42)).toFixed(3));ctx.lineWidth=(r?1:1.4)+k*(r?.6:1);
    path(l);ctx.stroke();
  }
  /* станции — только вблизи: белый кружок в чёрной кайме, пересадка — двойной */
  if(cell>=16&&RAIL_NET){
    for(const k in RAIL_NET.at){
      const p=k.split(","),x=X(+p[0]),y=Y(+p[1]);
      if(x<-8||x>W+8||y<-8||y>H+8)continue;
      const j=RAIL_NET.at[k].length>1;
      ctx.fillStyle="rgba(10,12,16,.8)";ctx.beginPath();ctx.arc(x+cell*.32,y-cell*.32,j?4:3,0,TAU);ctx.fill();
      ctx.strokeStyle="rgba(240,236,226,.7)";ctx.lineWidth=1;ctx.beginPath();ctx.arc(x+cell*.32,y-cell*.32,j?3.2:2.2,0,TAU);ctx.stroke();
      if(j){ctx.beginPath();ctx.arc(x+cell*.32,y-cell*.32,1.4,0,TAU);ctx.stroke();}
    }
  }
  ctx.restore();
}
