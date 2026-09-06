/* ══════════════ владения на карте (M348) ══════════════
   Автор (2026-09-04): кто чем владеет — на карте, и на трёх языках, потому что
   это три разные вещи, и одной заливкой их не сказать:
   · ДОМА — пятна: сектор с домовой станцией и его соседи в один прыжок омыты
     цветом дома (HOUSES.col); где два дома легли друг на друга — штриховка двух
     цветов (там берут обе боны); под законом тьмы — ярко у вас, за краем прыжка
     только там, где видели или слышали;
   · ГЛАВТРАССА — линия: тонкая двойная между узлами с засечками-верстами, имя
     написано один раз вдоль линии, как у реки; сектора вдоль неё «под трассой» —
     полоса, а не заливка; пираты там не держатся (13b);
   · ПИРАТЫ — очаги: ржавая косая штриховка по занятым секторам; где штрих
     встречает пятно дома, линия фронта чуть ярче;
   · СВОЁ — тонкая рамка цвета игрока у секторов со своими базами и станциями
     холдинга, видна и во тьме;
   · СМЕНИЛСЯ ХОЗЯИН — бирка «сменился хозяин · N дн. назад» у сектора, где
     12p-news записал перемену, гаснет за трое суток.
   Слои: кнопка СЛОИ в полосе карты — ВСЕ / ВЛАДЕНИЯ / ЦЕНЫ / СЛУХИ; один
   кругооборот и на телефоне, и на широком экране. Области (06b) без подписей —
   по правилу.

   ПРАВИЛА ФАЙЛА:
   1. Ничего не хранит, кроме выбора слоя (G.mapLayer). Владения — из мира.
   2. Рисует под звёздами (пятна, полосы, штрих) и над ними (бирки, ценники).
   3. Цветов не выдумывает: дома — HOUSES.col, пираты — ржавый 13b, своё — фосфор. */
const MAP_LAYERS=[["all","ВСЕ"],["own","ВЛАДЕНИЯ"],["prices","ЦЕНЫ"],["rumours","СЛУХИ"]];
function mapLayer(){return (G.mapLayer&&MAP_LAYERS.some(l=>l[0]===G.mapLayer))?G.mapLayer:"all";}
function mapLayerOn(k){const l=mapLayer();return l==="all"||l===k;}
function mapLayerNext(){const i=MAP_LAYERS.findIndex(l=>l[0]===mapLayer());G.mapLayer=MAP_LAYERS[(i+1)%MAP_LAYERS.length][0];return G.mapLayer;}
function mapLayerRu(){return "СЛОИ · "+MAP_LAYERS.find(l=>l[0]===mapLayer())[1];}
/* пятна домов: сектор станции и соседи в один прыжок; за краем прыжка — только виденное/слышанное */
function mapHousePatch(vis,st){
  const P={};
  for(const v of vis){
    if(!v.s||!v.s.station||typeof houseOf!=="function")continue;
    const Hh=houseOf(v.s);if(!Hh)continue;
    const known=v.d<=st.jump+.02||(G.seenPrices&&G.seenPrices[v.s.key])||(typeof rumoursKnown==="function"&&rumoursKnown().some(r=>Math.abs(r.sx-v.gx)<=r.rad&&Math.abs(r.sy-v.gy)<=r.rad));
    if(!known)continue;
    for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){
      const k=(v.gx+dx)+","+(v.gy+dy);
      const L=P[k]||(P[k]=[]);
      if(L.indexOf(Hh.id)<0)L.push(Hh.id);
    }
  }
  return P;
}
/* трасса: цепочка между соседними станциями с флотом — те же пары, что у 12ai */
function mapTrassaPairs(vis,cell){
  if(typeof fleetRung!=="function")return [];
  const L=vis.filter(v=>v.s&&v.s.station&&fleetRung(v.s)>=5),out=[],seen=new Set();
  for(const a of L){
    const nb=L.filter(b=>b!==a&&Math.hypot(a.x-b.x,a.y-b.y)<=cell*1.6)
      .sort((p,q)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(a.x-q.x,a.y-q.y)).slice(0,2);
    for(const b of nb){
      const key=a.gx<b.gx||(a.gx===b.gx&&a.gy<b.gy)?a.gx+","+a.gy+">"+b.gx+","+b.gy:b.gx+","+b.gy+">"+a.gx+","+a.gy;
      if(seen.has(key))continue;seen.add(key);out.push([a,b]);
    }
  }
  return out;
}
function mapUnderTrassa(sx,sy){
  if(typeof fleetRung!=="function"||!starAt(sx,sy))return false;
  const s=getSystem(sx,sy);return !!(s.station&&fleetRung(s)>=5);
}
function mapOwnHere(gx,gy){
  const key=gx+","+gy;
  if(G.bases)for(const k in G.bases){const B=G.bases[k];if(B&&B.sx===gx&&B.sy===gy)return true;}
  const Hh=G.hold&&G.hold[key];
  return !!(Hh&&Hh.bld&&Object.keys(Hh.bld).length);
}
/* бирка перемены: только где 12p записал «сменился хозяин», гаснет за трое суток */
function mapTagAt(gx,gy,now){
  if(typeof newsMarkAt!=="function")return null;
  const m=newsMarkAt(gx,gy);if(!m||m.what!=="сменился хозяин"||!m.t)return null;
  const days=(( now===undefined?Date.now():now)-m.t)/86400e3;
  if(days>=3)return null;
  const dn=Math.floor(days);
  return {ru:"сменился хозяин · "+(dn?dn+" "+pl3(dn,"день","дня","дней")+" назад":"сегодня"),a:clamp(1-days/3,.15,1)};
}
/* ── под звёздами: пятна, полоса трассы, штрих пиратов, своё ── */
function mapHoldingsDraw(vis,cell,V,st){
  if(!mapLayerOn("own"))return;
  const P=mapHousePatch(vis,st);
  ctx.save();
  /* ── чьи это системы (M370, §7.4 «на карте эмблемный чип») ──
     Летопись знает хозяина каждой системы обжитого круга. Шесть заливок на
     телефоне были бы шумом (вывод holding §13), поэтому владение читается
     чипом с эмблемой в углу клетки, а фронт — красной кромкой. */
  if(typeof chronOwner==="function")for(const v of vis){
    const o=chronOwner(v.gx,v.gy);
    if(o<0)continue;
    const key=MAKER_KEYS[o];
    const x0=v.x-cell/2,y0=v.y-cell/2;
    const d=Math.hypot(v.gx-G.sx,v.gy-G.sy),fade=clamp(1.1-d/(st.jump*2.4),.25,1);
    if(typeof powerEmblem==="function"&&cell>=18){
      /* чип растёт с клеткой: на трёх пикселях эмблема — точка, а точек на
         карте и так хватает */
      const cr=clamp(cell*.075,3.2,7.5);
      ctx.globalAlpha=.8*fade;
      powerEmblem(key,x0+cell-cr*1.7,y0+cr*1.7,cr);
      ctx.globalAlpha=1;
    }else{
      ctx.fillStyle=rgba(hex2rgb(powerOf(key).col),(.5*fade).toFixed(3));
      ctx.beginPath();ctx.arc(x0+cell-6,y0+6,2,0,TAU);ctx.fill();
    }
    if(chronFront(v.gx,v.gy)){
      ctx.strokeStyle="rgba(255,90,70,"+(.7*fade).toFixed(2)+")";ctx.lineWidth=1.4;
      ctx.strokeRect(x0+.7,y0+.7,cell-1.4,cell-1.4);
    }
    /* ── фронт пунктиром по границе (M371, §7.4) ──
       Не заливка и не рамка вокруг клетки, а ЛИНИЯ между двумя владениями,
       которые сейчас воюют: по ней видно, где именно проходит война, а не
       «в этом районе неспокойно». */
    if(typeof chronWarBetween==="function"){
      ctx.save();ctx.setLineDash([3,3]);
      ctx.strokeStyle="rgba(255,120,90,"+(.85*fade).toFixed(2)+")";ctx.lineWidth=1.6;
      const nb=[[1,0,x0+cell,y0,x0+cell,y0+cell],[0,1,x0,y0+cell,x0+cell,y0+cell]];
      for(const q of nb){
        const o2=chronOwner(v.gx+q[0],v.gy+q[1]);
        if(o2<0||o2===o||!chronWarBetween(o,o2))continue;
        ctx.beginPath();ctx.moveTo(q[2],q[3]);ctx.lineTo(q[4],q[5]);ctx.stroke();
      }
      ctx.restore();
    }
  }
  for(const k in P){
    const [gx,gy]=k.split(",").map(Number);
    const c=mapCellXY(gx,gy,V,cell),x0=c.x-cell/2,y0=c.y-cell/2;
    if(x0>W||y0>H||x0+cell<0||y0+cell<0)continue;
    const d=Math.hypot(gx-G.sx,gy-G.sy),fade=clamp(1.1-d/(st.jump*2.2),.25,1);
    const ids=P[k];
    ctx.fillStyle=rgba(hex2rgb(HOUSE_BY_ID[ids[0]].col),(.10*fade).toFixed(3));
    ctx.fillRect(x0,y0,cell,cell);
    if(ids.length>1){
      /* второй дом — штриховкой своего цвета: там принимают обе боны */
      ctx.save();ctx.beginPath();ctx.rect(x0,y0,cell,cell);ctx.clip();
      ctx.strokeStyle=rgba(hex2rgb(HOUSE_BY_ID[ids[1]].col),(.28*fade).toFixed(3));ctx.lineWidth=1;
      for(let q=-cell;q<cell;q+=6){ctx.beginPath();ctx.moveTo(x0+q,y0+cell);ctx.lineTo(x0+q+cell,y0);ctx.stroke();}
      ctx.restore();
    }
  }
  /* полоса трассы под линией: сектора «под трассой» */
  const pairs=mapTrassaPairs(vis,cell);
  if(pairs.length){
    ctx.lineCap="round";ctx.lineWidth=cell*.55;
    for(const [a,b] of pairs){
      const k=(a.near||b.near)?1:.4;                       // закон темноты: за кромкой полоса тише
      ctx.strokeStyle="rgba(236,232,220,"+(.07*k).toFixed(3)+")";
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    }
  }
  /* пираты: ржавый косой штрих; у пятна дома — фронт ярче */
  if(typeof occLvl==="function"){
    for(const v of vis){
      const ol=occLvl(v.gx,v.gy);if(!ol)continue;
      const x0=v.x-cell/2,y0=v.y-cell/2;
      ctx.save();ctx.beginPath();ctx.rect(x0,y0,cell,cell);ctx.clip();
      ctx.strokeStyle="rgba(200,96,60,"+(.16+ol*.07).toFixed(2)+")";ctx.lineWidth=1.2;
      for(let q=-cell;q<cell;q+=5){ctx.beginPath();ctx.moveTo(x0+q,y0);ctx.lineTo(x0+q+cell,y0+cell);ctx.stroke();}
      ctx.restore();
      if(P[v.gx+","+v.gy]){ctx.strokeStyle="rgba(255,120,80,.55)";ctx.lineWidth=1;ctx.strokeRect(x0+.5,y0+.5,cell-1,cell-1);}
    }
  }
  /* своё: рамка цвета игрока, видна и во тьме */
  const vx0=Math.round(V.x),vy0=Math.round(V.y),R=Math.ceil(Math.max(W,H)/cell/2)+1;
  for(let gy=vy0-R;gy<=vy0+R;gy++)for(let gx=vx0-R;gx<=vx0+R;gx++){
    if(!mapOwnHere(gx,gy))continue;
    const c=mapCellXY(gx,gy,V,cell);
    ctx.strokeStyle="rgba(127,230,216,.75)";ctx.lineWidth=1.2;
    ctx.strokeRect(c.x-cell/2+1.5,c.y-cell/2+1.5,cell-3,cell-3);
  }
  ctx.restore();
}
/* ── над звёздами: имя трассы, бирки перемен, ценники ── */
function mapHoldingsTop(vis,cell,V,st){
  ctx.save();
  if(mapLayerOn("own")){
    /* имя трассы — один раз, вдоль самого длинного видимого плеча, как у реки */
    const pairs=mapTrassaPairs(vis,cell);
    let best=null,bl=0;
    for(const [a,b] of pairs){const l=Math.hypot(a.x-b.x,a.y-b.y);if(l>bl){bl=l;best=[a,b];}}
    if(best&&bl>60){
      const [a,b]=best,ang=Math.atan2(b.y-a.y,b.x-a.x);
      ctx.save();ctx.translate((a.x+b.x)/2,(a.y+b.y)/2);ctx.rotate(Math.abs(ang)>Math.PI/2?ang+Math.PI:ang);
      ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";ctx.fillStyle="rgba(236,232,220,.55)";
      ctx.fillText("Г Л А В Т Р А С С А",0,-cell*.32);
      ctx.restore();
    }
    /* бирки перемен */
    const now=Date.now();
    for(const v of vis){
      const tg=mapTagAt(v.gx,v.gy,now);if(!tg)continue;
      ctx.font="7px ui-monospace,monospace";ctx.textAlign="left";
      const tw=ctx.measureText(tg.ru).width;
      ctx.fillStyle="rgba(6,10,16,"+(.6*tg.a).toFixed(2)+")";ctx.fillRect(v.x+10,v.y+6,tw+8,11);
      ctx.fillStyle="rgba(127,230,216,"+(.85*tg.a).toFixed(2)+")";ctx.fillText(tg.ru,v.x+14,v.y+14);
    }
  }
  /* ценники: лучшая виденная цена станции — коротко, под звездой */
  if(mapLayerOn("prices")&&G.seenPrices){
    ctx.font="7px ui-monospace,monospace";ctx.textAlign="center";
    for(const v of vis){
      if(!v.s||!v.s.station)continue;
      let pr=G.seenPrices[v.s.key];
      if((!pr||!pr.p)&&typeof wanderHas==="function"&&wanderHas("pricelist")&&v.s.station.prices&&Math.hypot(v.gx-G.sx,v.gy-G.sy)<=3*Math.max(.5,st.jump))pr={p:v.s.station.prices};
      if(!pr||!pr.p)continue;
      let bk=null;for(const k of TRADE_KEYS){if(pr.p[k]&&(!bk||pr.p[k]>pr.p[bk]))bk=k;}
      if(!bk)continue;
      const hot=(G.cargo[bk]|0)>0;
      ctx.fillStyle=hot?"#f2b25c":"rgba(160,182,192,.75)";
      ctx.fillText(RES[bk].ru.toLowerCase()+" "+pr.p[bk],v.x,v.y+cell*.42);
    }
  }
  ctx.restore();
}
