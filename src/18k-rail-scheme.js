/* ══════════════ пересадка и схема на бумаге (M472 хвост, 18.09) ══════════════
   Две вещи из хвоста вестибюля.
   ПЕРЕСАДКА: раньше касса продавала только по своей линии. Теперь — через
   один узел: до пересадочной остановки по своей линии, там — на другую, до
   четырёх остановок в обе стороны. Билет один, цена по всему пути, в вагоне
   на узле объявляют «пересадка», поезд стоит три секунды и идёт дальше уже
   другой линией (RAIL_RIDE.next). Выйти на узле можно как на любой остановке.
   СХЕМА: кнопка «СХЕМА ЛИНИЙ» в вестибюле разворачивает бумагу — кремовый
   лист со сгибами, вся сеть в цветах линий, узлы двойным кружком, имена у
   узлов и колец, красная метка «ВЫ ЗДЕСЬ». Рисуется канвой в DOM один раз на
   открытие; закрывается касанием. */
const RAIL_VIA_K=4;
function railDestinationsVia(direct){
  const out=[],N=railNet(),have=new Set(direct.map(t=>t.to.sx+","+t.to.sy));
  have.add(G.sx+","+G.sy);
  for(const t of direct){
    const key=t.to.sx+","+t.to.sy,ids=N.at[key];
    if(!ids||ids.length<2)continue;
    for(const id of ids){
      const l2=N.byId[id];if(!l2||l2===t.l)continue;
      const n=l2.stops.length,j0=l2.stops.findIndex(s=>s.sx+","+s.sy===key);if(j0<0)continue;
      for(const dir of [1,-1])for(let k=1;k<=RAIL_VIA_K;k++){
        let j=j0+dir*k;
        if(l2.loop)j=((j%n)+n)%n;else if(j<0||j>=n)break;
        const s2=l2.stops[j],k2=s2.sx+","+s2.sy;
        if(typeof railCut==="function"&&railCut(l2.stops[railNextIdx(l2,j,-dir)],s2))break;   /* перерезано (M510) */
        if(typeof railFrontShut==="function"&&railFrontShut(s2))continue;
        if(have.has(k2))continue;
        have.add(k2);
        let d2=0;for(let m=0;m<k;m++){const a=l2.stops[l2.loop?((j0+dir*m)%n+n)%n:j0+dir*m],b=l2.stops[l2.loop?((j0+dir*(m+1))%n+n)%n:j0+dir*(m+1)];d2+=Math.hypot(a.sx-b.sx,a.sy-b.sy);}
        out.push({l:t.l,i0:t.i0,i1:t.i1,dir:t.dir,k:t.k+k,dist:t.dist+d2,to:s2,via:{l:l2,i0:j0,dir,k,at:t.to,k1:t.k}});
      }
    }
  }
  out.sort((a,b)=>a.dist-b.dist);
  return out.slice(0,8);
}
/* вторая нога поездки: зовёт railRideStart */
function railNextLeg(t){
  if(!t||!t.via)return null;
  const v=t.via,l=v.l,n=l.stops.length,seq=[];
  for(let m=0;m<=v.k;m++){let i=v.i0+v.dir*m;if(l.loop)i=((i%n)+n)%n;seq.push(i);}
  return {l,seq};
}
/* ── схема на бумаге ── */
const SCHEME_INK={radial:[150,120,90],ring:[196,110,40],arm:[40,130,120]};
function railSchemeOpen(){
  let d=document.getElementById("railScheme");
  if(!d){d=document.createElement("div");d.id="railScheme";d.innerHTML="<canvas></canvas><b>СХЕМА ЛИНИЙ · ГЛАВТРАССА · бесплатно, не выбрасывать</b><s>касание — свернуть</s>";
    d.onclick=e=>{if(e.target===d)railSchemeClose();};document.body.appendChild(d);
    /* КУДА ВАМ (M470): тап по остановке на бумаге — выбрать, куда ехать */
    const cv=d.querySelector("canvas");cv.onclick=railSchemePick;
    /* шире — колесом или щипком (§9, M470): от своего участка до всей сети */
    cv.onwheel=e=>{e.preventDefault();e.stopPropagation();railSchemeZoom(e.deltaY>0?.25:-.25);};
    let pin=0;
    cv.addEventListener("touchmove",e=>{if(e.touches.length!==2)return;e.preventDefault();
      const a=e.touches[0],b=e.touches[1],dd=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);
      if(pin)railSchemeZoom((pin-dd)/300);pin=dd;},{passive:false});
    cv.addEventListener("touchend",()=>{pin=0;});
    /* подсказка по руке: на телефоне колеса нет, и строка короче */
    const touch=typeof matchMedia==="function"&&matchMedia("(pointer:coarse)").matches;
    /* фразы склеены неразрывным пробелом: узкий экран переносит строку только по « · » */
    const sb=d.querySelector("s");if(sb)sb.textContent=["касание остановки — туда",(touch?"щипок":"колесо")+" — шире","мимо бумаги — свернуть"].map(p=>p.replace(/ /g," ")).join(" · ");}
  d.classList.add("open");
  {const p=d.querySelector(".rs-pick");if(p)p.remove();}
  RAIL_SCHEME_Z=0;railSchemeRedraw();
}
/* охват (§9, M470): не вся сеть, а ваш участок — вы, всё, что продаёт касса
   (своя линия и пересадки, а с ними и кольца, что их режут), с полем вокруг;
   RAIL_SCHEME_Z тянет рамку от участка (0) до всей сети (1) */
let RAIL_SCHEME_Z=0;
function railSchemeScope(){
  let x0=G.sx,x1=G.sx,y0=G.sy,y1=G.sy;
  if(typeof railDestinations==="function"&&railStation(G.sx,G.sy))
    for(const q of railDestinations()){x0=Math.min(x0,q.to.sx);x1=Math.max(x1,q.to.sx);y0=Math.min(y0,q.to.sy);y1=Math.max(y1,q.to.sy);}
  const half=clamp(Math.max(x1-x0,y1-y0)/2*1.2+3,8,RAIL_R),z=RAIL_SCHEME_Z;
  return {cx:(x0+x1)/2*(1-z),cy:(y0+y1)/2*(1-z),half:half+(RAIL_R-half)*z};
}
function railSchemeZoom(dz){
  const z=clamp(RAIL_SCHEME_Z+dz,0,1);if(z===RAIL_SCHEME_Z)return;
  RAIL_SCHEME_Z=z;railSchemeRedraw();
}
function railSchemeRedraw(){
  const d=document.getElementById("railScheme");if(!d)return;
  const c=d.querySelector("canvas"),k=Math.min(2,DPR||1);
  const cw=Math.min(W-24,520),ch=Math.min(H-120,cw*1.15);
  c.width=cw*k;c.height=ch*k;c.style.width=cw+"px";c.style.height=ch+"px";
  const g=c.getContext("2d");g.setTransform(k,0,0,k,0,0);
  railSchemeDraw(g,cw,ch);
}
function railSchemeClose(){const d=document.getElementById("railScheme");if(d)d.classList.remove("open");}
/* «Край» (M470, DESIGN-metro §2): на каждой линии, что уходит наружу, самая
   дальняя остановка, где вы стояли, пока за ней ещё что-то есть. Дальше линия
   на бумаге пунктиром — «не езжено». Стоянки — счётчик визитов станций (11b),
   нового поля нет */
function railVisited(s){
  if(s.sx===G.sx&&s.sy===G.sy)return true;
  const V=G.visits||{},k=getSystem(s.sx,s.sy).key;
  return (V[k]|0)>0;
}
function railKrai(l){
  if(l.loop||l.kind==="ring"||!l.stops||!l.stops.length)return null;
  let best=null,br=-1,far=0;
  for(const s of l.stops){const r=Math.hypot(s.sx,s.sy);far=Math.max(far,r);if(r>br&&railVisited(s)){best=s;br=r;}}
  return best&&far>br+.5?{s:best,r:br}:null;
}
let RAIL_SCHEME_MAP=null;
function railSchemePick(e){
  e.stopPropagation();
  const M=RAIL_SCHEME_MAP;if(!M||typeof railDestinations!=="function"||!railStation(G.sx,G.sy))return;
  const c=e.currentTarget,b=c.getBoundingClientRect();
  /* бумага повёрнута на 1.2° — на касании пальцем это меньше пикселя, не считаем */
  const x=(e.clientX-b.left)*M.cw/b.width,y=(e.clientY-b.top)*M.ch/b.height;
  const D=railDestinations();let t=null,bd=14;
  for(const q of D){const d=Math.hypot(M.X(q.to.sx)-x,M.Y(q.to.sy)-y);if(d<bd||(t&&d===bd&&q.k<t.k)){bd=d;t=q;}}
  const host=document.getElementById("railScheme");
  {const p=host.querySelector(".rs-pick");if(p)p.remove();}
  const p=document.createElement("div");p.className="rs-pick";
  if(!t){p.innerHTML="<s>отсюда туда без пересадок не доехать — выберите остановку поближе</s>";host.appendChild(p);return;}
  const F=railFare(t);
  p.innerHTML="<button class='act gold'>ДО «"+railStopName(t.to).toUpperCase()+"» · "+t.k+" ОСТ. · "+F.fare+" КР"+(F.bag?" + БАГАЖ "+F.bag:"")+
    "<s>"+(t.via?"пересадка на «"+railStopName(t.via)+"»":"без пересадок")+"</s></button>";
  p.querySelector("button").onclick=ev=>{ev.stopPropagation();railSchemeClose();railBuy(t);};
  host.appendChild(p);
}
function railSchemeDraw(g,cw,ch){
  const N=railNet(),R=RAIL_R,V=railSchemeScope();
  const pad=28,S=Math.min((cw-pad*2)/(2*V.half),(ch-pad*2-24)/(2*V.half));
  const X=x=>cw/2+(x-V.cx)*S,Y=y=>ch/2+12+(y-V.cy)*S;
  RAIL_SCHEME_MAP={X,Y,cw,ch};
  /* бумага: кремовая, сгибы вдоль и поперёк, тень у сгиба */
  g.fillStyle="#efe6cf";g.fillRect(0,0,cw,ch);
  const grain=g.createLinearGradient(0,0,cw,ch);grain.addColorStop(0,"rgba(255,255,255,.18)");grain.addColorStop(1,"rgba(120,90,50,.10)");
  g.fillStyle=grain;g.fillRect(0,0,cw,ch);
  for(const fx of [cw/3,cw*2/3]){const fg=g.createLinearGradient(fx-8,0,fx+8,0);fg.addColorStop(0,"rgba(0,0,0,0)");fg.addColorStop(.5,"rgba(90,70,40,.16)");fg.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=fg;g.fillRect(fx-8,0,16,ch);}
  {const fg=g.createLinearGradient(0,ch/2-8,0,ch/2+8);fg.addColorStop(0,"rgba(0,0,0,0)");fg.addColorStop(.5,"rgba(90,70,40,.12)");fg.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=fg;g.fillRect(0,ch/2-8,cw,16);}
  /* круг заселения и метро: лёгкая заливка, как зона тарифа */
  g.fillStyle="rgba(196,110,40,.07)";g.beginPath();g.arc(X(0),Y(0),RAIL_METRO_R*S,0,TAU);g.fill();
  g.strokeStyle="rgba(90,70,40,.25)";g.lineWidth=1;g.setLineDash([3,4]);g.beginPath();g.arc(X(0),Y(0),RAIL_METRO_R*S,0,TAU);g.stroke();g.setLineDash([]);
  /* линии: толстые, в чернилах схемы; радиалы тоньше */
  g.lineCap="round";g.lineJoin="round";
  for(const l of N.lines){
    const c=SCHEME_INK[l.kind];
    g.strokeStyle="rgba("+c.join(",")+","+(l.kind==="radial"?.55:.9)+")";g.lineWidth=l.kind==="radial"?1.6:3;
    g.beginPath();for(let i=0;i<l.pts.length;i++){const p=l.pts[i];i?g.lineTo(X(p[0]),Y(p[1])):g.moveTo(X(p[0]),Y(p[1]));}g.stroke();
  }
  /* за «Краем» — пунктиром: бумага поверх линии штрихами */
  const krai=[];
  for(const l of N.lines){
    const K=railKrai(l);if(!K)continue;krai.push(K);
    g.strokeStyle="#efe6cf";g.lineWidth=(l.kind==="radial"?1.6:3)+.6;g.setLineDash([3,3]);
    g.beginPath();let on=false;
    for(const p of l.pts){const r=Math.hypot(p[0],p[1]);if(r<K.r){on=false;continue;}
      if(on)g.lineTo(X(p[0]),Y(p[1]));else{g.moveTo(X(p[0]),Y(p[1]));on=true;}}
    g.stroke();g.setLineDash([]);
  }
  /* остановки: белый кружок с тёмной каймой; узлы — двойной и с именем */
  g.font="7px ui-monospace,monospace";g.textBaseline="middle";
  const named=[];
  for(const k in N.at){
    const p=k.split(","),x=X(+p[0]),y=Y(+p[1]),j=N.at[k].length>1,r=Math.hypot(+p[0],+p[1]);
    if(r>R)continue;
    g.fillStyle="#fbf7ec";g.strokeStyle="#3a2e1e";g.lineWidth=j?1.4:1;
    g.beginPath();g.arc(x,y,j?3.6:2.2,0,TAU);g.fill();g.stroke();
    if(j){g.beginPath();g.arc(x,y,1.4,0,TAU);g.stroke();named.push({x,y,k});}
  }
  g.fillStyle="#3a2e1e";g.textAlign="left";
  /* подписи: дальние узлы первыми (в ядре тесно), каждая проверяется на наезд
     на уже поставленные — ядро остаётся кружками, а не кашей букв */
  const placed=[];
  named.sort((a,b)=>Math.hypot(b.x-X(0),b.y-Y(0))-Math.hypot(a.x-X(0),a.y-Y(0)));
  for(const n of named){
    const p=n.k.split(",").map(Number),nm0=railStopName({sx:p[0],sy:p[1]}),nm=nm0.length>16?nm0.slice(0,15)+"…":nm0;
    const w=nm.length*4.3,bx=n.x+5,by=n.y-9,bh=9;
    if(placed.some(r=>bx<r.x+r.w+3&&bx+w>r.x-3&&by<r.y+r.h+2&&by+bh>r.y-2))continue;
    if(bx+w>cw-4)continue;
    placed.push({x:bx,y:by,w,h:bh});
    g.fillStyle="rgba(239,230,207,.75)";g.fillRect(bx-1,by,w+2,bh);
    g.fillStyle="#3a2e1e";g.fillText(nm,bx,n.y-4);
  }
  if(typeof railExpressDraw==="function")railExpressDraw(g,X,Y);   /* EXPRESS™ пунктиром (M474) */
  /* перерезанные перегоны (M510): красный разрыв поперёк середины */
  if(typeof railCut==="function"){g.strokeStyle="#c8281e";g.lineWidth=2;
    for(const l of N.lines)for(let i=0;i+1<l.stops.length;i++){const a=l.stops[i],b=l.stops[i+1];if(!railCut(a,b))continue;
      const mx=(X(a.sx)+X(b.sx))/2,my=(Y(a.sy)+Y(b.sy))/2,dx=X(b.sx)-X(a.sx),dy=Y(b.sy)-Y(a.sy),L=Math.hypot(dx,dy)||1,nx=-dy/L*5,ny=dx/L*5,tx=dx/L*1.6,ty=dy/L*1.6;
      g.beginPath();g.moveTo(mx-tx+nx,my-ty+ny);g.lineTo(mx-tx-nx,my-ty-ny);g.moveTo(mx+tx+nx,my+ty+ny);g.lineTo(mx+tx-nx,my+ty-ny);g.stroke();}}
  /* закрытые фронтом остановки — красный крест */
  if(typeof railFrontShut==="function"){g.strokeStyle="#c8281e";g.lineWidth=1.3;
    for(const k in N.at){const p=k.split(",").map(Number);if(!railFrontShut({sx:p[0],sy:p[1]}))continue;
      const x=X(p[0]),y=Y(p[1]);g.beginPath();g.moveTo(x-3.5,y-3.5);g.lineTo(x+3.5,y+3.5);g.moveTo(x+3.5,y-3.5);g.lineTo(x-3.5,y+3.5);g.stroke();}}
  /* «КРАЙ» у самой дальней стоянки линии */
  g.font="bold 7px ui-monospace,monospace";g.fillStyle="#c8281e";g.textAlign="left";
  {const done=new Set();for(const K of krai){const k=K.s.sx+","+K.s.sy;if(done.has(k))continue;done.add(k);
    g.fillText("КРАЙ",X(K.s.sx)+5,Y(K.s.sy)+7);}}
  /* куда можно отсюда (КУДА ВАМ): тонкое красное кольцо — эти берёт касса */
  if(typeof railDestinations==="function"&&railStation(G.sx,G.sy)){
    g.strokeStyle="rgba(200,40,30,.7)";g.lineWidth=1;
    for(const q of railDestinations()){g.beginPath();g.arc(X(q.to.sx),Y(q.to.sy),5.2,0,TAU);g.stroke();}
  }
  /* имена колец — на своём кольце, сверху */
  g.textAlign="center";g.fillStyle="rgba(120,60,20,.85)";g.font="bold 8px ui-monospace,monospace";
  RAIL_RINGS.forEach((rr,i)=>{if(rr<R)g.fillText(RAIL_RING_RU[i].toUpperCase(),X(0),Y(-rr)-6);});
  /* вы здесь: красная метка с подписью */
  const hx=X(G.sx),hy=Y(G.sy);
  g.fillStyle="#c8281e";g.beginPath();g.moveTo(hx,hy-1);g.lineTo(hx-5,hy-13);g.lineTo(hx+5,hy-13);g.closePath();g.fill();
  g.beginPath();g.arc(hx,hy-14,4,0,TAU);g.fill();
  g.font="bold 8px ui-monospace,monospace";g.textAlign="left";g.fillText("ВЫ ЗДЕСЬ",hx+8,hy-14);
  /* заголовок на самой бумаге — на подложке: лист открыт на участке (§9), линии идут под него */
  const t1="СХЕМА ЛИНИЙ · ГЛАВТРАССА",t2="выдаётся в вестибюле · не выбрасывать";
  g.font="bold 9px ui-monospace,monospace";const w1=g.measureText(t1).width;
  g.font="7px ui-monospace,monospace";const w2=g.measureText(t2).width;
  g.fillStyle="rgba(239,230,207,.92)";g.fillRect(4,2,Math.max(w1,w2)+12,25);
  g.font="bold 9px ui-monospace,monospace";g.textAlign="left";g.fillStyle="#3a2e1e";g.fillText(t1,10,12);
  g.font="7px ui-monospace,monospace";g.fillStyle="#7a6a50";g.fillText(t2,10,22);
  /* легенда — на подложке; строку, что не влезает правее образцов линий (узкая бумага телефона), переносим по « · » */
  g.font="7px ui-monospace,monospace";
  const L=[["ring","кольца"],["arm","рукава"],["radial","радиалы"]];
  const T=["синий пунктир — EXPRESS™ · красный крест — фронт, закрыто · красный разрыв — путь перерезан",
    "красное кольцо — касса берёт · за «КРАЕМ» не езжено","пересадка — двойной кружок · пунктир — метро, жетон 5 кр"];
  const mw=cw-10-(36+Math.max(...L.map(e=>g.measureText(e[1]).width))+10),rows=[];
  for(const s of T){
    if(g.measureText(s).width<=mw){rows.push(s);continue;}
    let cur="";
    for(const p of s.split(" · ")){const n=cur?cur+" · "+p:p;if(cur&&g.measureText(n).width>mw){rows.push(cur);cur=p;}else cur=n;}
    if(cur)rows.push(cur);
  }
  const top=ch-10-(Math.max(rows.length,L.length)-1)*10;
  g.fillStyle="rgba(239,230,207,.92)";g.fillRect(4,top-9,cw-8,ch-4-(top-9));
  g.fillStyle="#5a4a30";g.textAlign="left";
  L.forEach((e,i)=>{const y=ch-10-i*10;g.strokeStyle="rgba("+SCHEME_INK[e[0]].join(",")+",.9)";g.lineWidth=e[0]==="radial"?1.6:3;g.beginPath();g.moveTo(10,y);g.lineTo(30,y);g.stroke();g.fillText(e[1],36,y);});
  g.textAlign="right";rows.forEach((s,i)=>g.fillText(s,cw-10,ch-10-(rows.length-1-i)*10));
}
