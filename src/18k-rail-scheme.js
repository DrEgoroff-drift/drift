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
    d.onclick=railSchemeClose;document.body.appendChild(d);}
  d.classList.add("open");
  const c=d.querySelector("canvas"),k=Math.min(2,DPR||1);
  const cw=Math.min(W-24,520),ch=Math.min(H-120,cw*1.15);
  c.width=cw*k;c.height=ch*k;c.style.width=cw+"px";c.style.height=ch+"px";
  const g=c.getContext("2d");g.setTransform(k,0,0,k,0,0);
  railSchemeDraw(g,cw,ch);
}
function railSchemeClose(){const d=document.getElementById("railScheme");if(d)d.classList.remove("open");}
function railSchemeDraw(g,cw,ch){
  const N=railNet(),R=RAIL_R;
  const pad=28,S=Math.min((cw-pad*2)/(2*R),(ch-pad*2-24)/(2*R));
  const X=x=>cw/2+x*S,Y=y=>ch/2+12+y*S;
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
  /* имена колец — на своём кольце, сверху */
  g.textAlign="center";g.fillStyle="rgba(120,60,20,.85)";g.font="bold 8px ui-monospace,monospace";
  RAIL_RINGS.forEach((rr,i)=>{if(rr<R)g.fillText(RAIL_RING_RU[i].toUpperCase(),X(0),Y(-rr)-6);});
  /* вы здесь: красная метка с подписью */
  const hx=X(G.sx),hy=Y(G.sy);
  g.fillStyle="#c8281e";g.beginPath();g.moveTo(hx,hy-1);g.lineTo(hx-5,hy-13);g.lineTo(hx+5,hy-13);g.closePath();g.fill();
  g.beginPath();g.arc(hx,hy-14,4,0,TAU);g.fill();
  g.font="bold 8px ui-monospace,monospace";g.textAlign="left";g.fillText("ВЫ ЗДЕСЬ",hx+8,hy-14);
  /* заголовок на самой бумаге */
  g.font="bold 9px ui-monospace,monospace";g.textAlign="left";g.fillStyle="#3a2e1e";
  g.fillText("СХЕМА ЛИНИЙ · ГЛАВТРАССА",10,12);
  g.font="7px ui-monospace,monospace";g.fillStyle="#7a6a50";g.fillText("выдаётся в вестибюле · не выбрасывать",10,22);
  /* легенда */
  g.font="7px ui-monospace,monospace";g.fillStyle="#5a4a30";g.textAlign="left";
  const L=[["ring","кольца"],["arm","рукава"],["radial","радиалы"]];
  L.forEach((e,i)=>{const y=ch-10-i*10;g.strokeStyle="rgba("+SCHEME_INK[e[0]].join(",")+",.9)";g.lineWidth=e[0]==="radial"?1.6:3;g.beginPath();g.moveTo(10,y);g.lineTo(30,y);g.stroke();g.fillText(e[1],36,y);});
  g.textAlign="right";g.fillText("пересадка — двойной кружок · пунктир — метро, жетон 5 кр",cw-10,ch-10);
}
