/* ══════════════ карта говорит адресами (M347) ══════════════
   Автор (2026-09-04): «на карте не понятно, что за сектора и адреса». До сих пор
   карта была небом: звёзды, тьма, круг прыжка — и ни одной координаты, кроме
   подвала. Слухи же, тетрадь, блошинец и бумаги «Сороки» говорят адресами
   «сектор 4:-7». Здесь карта получает то, чем адрес читают:

   1. сетка — клетка на сектор, под тем же законом тьмы, что звёзды: ярко у вас,
      к краю прыжка гаснет; каждая пятая линия чуть громче;
   2. линейки по верху (X) и по левому краю (Y), едут вместе с окном, как на
      морской карте; координаты ВАС и ВЫБРАННОГО подчёркнуты цветом — адрес
      читают по линейкам, а не с каждой клетки;
   3. шапка: «ВЫ · сектор 4:-7 · «Имя»» и под ней выбранное «сектор 6:-9 ·
      3 сектора · 2 прыжка · 3,1 пк» — «секторов» считается так же, как у слухов;
   4. пустая клетка выбирается (адрес и расстояние; курса в пустоту нет);
   5. области слухов — бледные штрихованные квадраты «в N секторах вокруг X:Y»
      с источником; два слуха, легшие друг на друга, видны сами;
   6. кольца «2 прыжка», «3 прыжка» за освещённым кругом;
   7. поиск адреса: поле «сектор __:__», окно едет и обводит клетку; всякий адрес
      в тексте игры становится нажимаемым (addrify);
   8. роза в углу: +X, +Y и «к ядру»;
   9. метка без слов — спичка (решение автора): кладётся из кошелька на клетку и
      лежит, пока не заберёшь; не потрачена, но пока лежит — её нет в кошельке.

   ПРАВИЛА ФАЙЛА:
   1. Хранится только G.mapMarks (≤10 клеток) и G.rumours (что слышали, ≤12).
   2. Всё нарисованное как интерфейс сообщает свои прямоугольники (mapBox) —
      сторож 91f-ui сверяет их с вёрсткой.
   3. Координаты читаются с линеек и из шапки, никогда не печатаются на клетках. */
const MAP_MARKS_MAX=10, MAP_RUM_MAX=12, MAP_RUL=26;
function mapMarks(){if(!Array.isArray(G.mapMarks))G.mapMarks=[];return G.mapMarks;}
function mapMarkAt(sx,sy){return mapMarks().findIndex(m=>m.sx===sx&&m.sy===sy);}
/* спичка на клетку: из кошелька; забрать — обратно в кошелёк */
function mapMarkToggle(sx,sy){
  const L=mapMarks(),i=mapMarkAt(sx,sy);
  if(i>=0){L.splice(i,1);if(typeof matchesAdd==="function")matchesAdd(1);say("Спичка снята с карты · спичек: "+matchesRec());return "taken";}
  if(typeof matchesRec!=="function"||matchesRec()<1){say("Ни одной спички — нечем отметить");return null;}
  if(L.length>=MAP_MARKS_MAX){say("Десять спичек на карте — больше не кладём");return null;}
  matchesSpend(1);L.push({sx:sx|0,sy:sy|0});
  say("Спичка легла на сектор "+sx+":"+sy+" · спичек: "+matchesRec());
  return "laid";
}
/* слухи, которые слышали: область и источник; это знание игрока, оно хранится */
function rumoursKnown(){if(!Array.isArray(G.rumours))G.rumours=[];return G.rumours;}
function rumourRemember(q){
  if(!q||q.sx===undefined)return;
  const L=rumoursKnown();
  if(L.some(r=>r.sx===q.sx&&r.sy===q.sy&&r.img===q.img))return;
  L.push({sx:q.sx,sy:q.sy,rad:q.rad|0,img:q.img,src:q.src||"",day:celDay()});
  while(L.length>MAP_RUM_MAX)L.shift();
}
/* экранные координаты клетки — одна формула на сетку, линейки, тап и поиск */
function mapCellXY(gx,gy,V,cell){return {x:W/2+(gx-V.x)*cell,y:H/2+(gy-V.y)*cell};}
function mapRulerTop(){return (typeof HUD_BAND==="number"?HUD_BAND:72)+4;}
/* 1. сетка под законом тьмы */
function mapGridDraw(V,cell,R,st){
  const vx0=Math.round(V.x),vy0=Math.round(V.y);
  ctx.save();ctx.lineWidth=1;
  for(let gy=vy0-R;gy<=vy0+R;gy++)for(let gx=vx0-R;gx<=vx0+R;gx++){
    const d=Math.hypot(gx-G.sx,gy-G.sy);
    const fade=clamp(1-d/(st.jump*1.6),0,1);   /* к краю прыжка — в ничто */
    if(fade<=.02)continue;
    const c=mapCellXY(gx,gy,V,cell);
    const x0=c.x-cell/2,y0=c.y-cell/2;
    if(x0>W||y0>H||x0+cell<0||y0+cell<0)continue;
    const fifth=(gx%5===0||gy%5===0);
    ctx.strokeStyle="rgba(150,182,212,"+(fade*(fifth?.16:.09)).toFixed(3)+")";
    ctx.strokeRect(Math.round(x0)+.5,Math.round(y0)+.5,Math.round(cell),Math.round(cell));
  }
  ctx.restore();
}
/* 6. кольца прыжков за освещённым кругом */
function mapRingsDraw(px,py,cell,st){
  ctx.save();ctx.setLineDash([2,6]);ctx.lineWidth=1;
  ctx.font="8px ui-monospace,monospace";ctx.textAlign="left";
  for(const k of [2,3]){
    const r=k*(st.jump+.02)*cell;
    if(r>Math.hypot(W,H))continue;
    ctx.strokeStyle="rgba(127,230,216,"+(k===2?.14:.09)+")";
    ctx.beginPath();ctx.arc(px,py,r,0,TAU);ctx.stroke();
    ctx.fillStyle="rgba(127,230,216,"+(k===2?.42:.3)+")";
    ctx.fillText(k+" "+pl3(k,"ПРЫЖОК","ПРЫЖКА","ПРЫЖКОВ"),px+r*.707+4,py-r*.707-3);
  }
  ctx.setLineDash([]);ctx.restore();
}
/* 5. области слухов — штрихованные квадраты; наложение видно само */
function mapRumoursDraw(V,cell){
  const L=rumoursKnown();if(!L.length)return;
  ctx.save();
  for(const r of L){
    const c=mapCellXY(r.sx,r.sy,V,cell),half=(r.rad+.5)*cell;
    const x0=c.x-half,y0=c.y-half,w=half*2;
    if(x0>W||y0>H||x0+w<0||y0+w<0)continue;
    ctx.save();ctx.beginPath();ctx.rect(x0,y0,w,w);ctx.clip();
    ctx.strokeStyle="rgba(207,227,234,.16)";ctx.lineWidth=1;
    for(let k=-w;k<w;k+=9){ctx.beginPath();ctx.moveTo(x0+k,y0);ctx.lineTo(x0+k+w,y0+w);ctx.stroke();}
    ctx.restore();
    ctx.strokeStyle="rgba(207,227,234,.35)";ctx.lineWidth=1;ctx.setLineDash([4,4]);
    ctx.strokeRect(x0+.5,y0+.5,w,w);ctx.setLineDash([]);
    ctx.fillStyle="rgba(207,227,234,.7)";ctx.font="8px ui-monospace,monospace";ctx.textAlign="left";
    ctx.fillText("В "+r.rad+" "+pl3(r.rad,"СЕКТОРЕ","СЕКТОРАХ","СЕКТОРАХ")+" ВОКРУГ "+r.sx+":"+r.sy+(r.src?" · "+r.src.toUpperCase():""),x0+4,y0-4);
  }
  ctx.restore();
}
/* 9. спички на клетках: лежит, тёплая головка, без свечения */
function mapMarksDraw(V,cell){
  const L=mapMarks();if(!L.length)return;
  ctx.save();
  for(const m of L){
    const c=mapCellXY(m.sx,m.sy,V,cell);
    if(c.x<-20||c.x>W+20||c.y<-20||c.y>H+20)continue;
    const l=Math.max(8,Math.min(cell*.7,22));
    ctx.save();ctx.translate(c.x,c.y+cell*.28);ctx.rotate(-.35);
    ctx.fillStyle="rgba(0,0,0,.45)";ctx.fillRect(-l/2+1,1,l,2.2);
    ctx.fillStyle="#d9c79a";ctx.fillRect(-l/2,-1,l,2.2);
    ctx.fillStyle="#a83a2a";ctx.beginPath();ctx.ellipse(l/2,0,2.6,2,0,0,TAU);ctx.fill();
    ctx.fillStyle="rgba(255,220,180,.6)";ctx.fillRect(l/2-1,-1.2,1,1);
    ctx.restore();
  }
  ctx.restore();
}
/* 2+3. линейки и шапка — интерфейс, сообщает прямоугольники */
function mapRulersDraw(V,cell,foot){
  const RX=(typeof mapRail==="function")?mapRail():W-16;
  const y0=mapRulerTop(),xL=MAP_RUL;
  const deck=(typeof mapDeck==="function")?mapDeck():H-100;
  const yEnd=deck-16*Math.max(1,(foot&&foot.rows?foot.rows.length:1))-14;
  ctx.save();
  ctx.font="8px ui-monospace,monospace";ctx.textBaseline="alphabetic";
  /* полоса X сверху */
  ctx.fillStyle="rgba(6,10,16,.55)";ctx.fillRect(xL,y0,RX-xL,13);
  ctx.strokeStyle="rgba(150,182,212,.35)";ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(xL,y0+13.5);ctx.lineTo(RX,y0+13.5);ctx.stroke();
  mapBox("линейка X",xL,y0,RX-xL,14);
  const step=cell>=34?1:(cell>=18?2:5);
  const gx0=Math.floor(V.x-(W/2-xL)/cell)-1,gx1=Math.ceil(V.x+(RX-W/2)/cell)+1;
  ctx.textAlign="center";
  for(let gx=gx0;gx<=gx1;gx++){
    const x=W/2+(gx-V.x)*cell;if(x<xL+6||x>RX-6)continue;
    const me=gx===G.sx,sel=gx===G.sel.x;
    ctx.strokeStyle="rgba(150,182,212,.5)";ctx.beginPath();ctx.moveTo(Math.round(x)+.5,y0+9);ctx.lineTo(Math.round(x)+.5,y0+13);ctx.stroke();
    if(gx%step!==0&&!me&&!sel)continue;
    ctx.fillStyle=me?"#7fe6d8":(sel?"#f2b25c":"rgba(180,200,220,.75)");
    ctx.fillText(String(gx),x,y0+8);
    if(me||sel){ctx.fillRect(x-6,y0+10,12,1);}
  }
  /* полоса Y слева */
  const yT=y0+16;
  ctx.fillStyle="rgba(6,10,16,.55)";ctx.fillRect(2,yT,xL-4,Math.max(10,yEnd-yT));
  ctx.strokeStyle="rgba(150,182,212,.35)";ctx.beginPath();ctx.moveTo(xL-1.5,yT);ctx.lineTo(xL-1.5,yEnd);ctx.stroke();
  mapBox("линейка Y",2,yT,xL-2,Math.max(10,yEnd-yT));
  const gy0=Math.floor(V.y-(H/2-yT)/cell)-1,gy1=Math.ceil(V.y+(yEnd-H/2)/cell)+1;
  ctx.textAlign="right";
  for(let gy=gy0;gy<=gy1;gy++){
    const y=H/2+(gy-V.y)*cell;if(y<yT+6||y>yEnd-4)continue;
    const me=gy===G.sy,sel=gy===G.sel.y;
    ctx.strokeStyle="rgba(150,182,212,.5)";ctx.beginPath();ctx.moveTo(xL-6,Math.round(y)+.5);ctx.lineTo(xL-2,Math.round(y)+.5);ctx.stroke();
    if(gy%step!==0&&!me&&!sel)continue;
    ctx.fillStyle=me?"#7fe6d8":(sel?"#f2b25c":"rgba(180,200,220,.75)");
    ctx.fillText(String(gy),xL-8,y+3);
    if(me||sel){ctx.fillRect(xL-8-String(gy).length*5,y+5,String(gy).length*5,1);}
  }
  /* шапка: где вы и что выбрано */
  ctx.textAlign="left";ctx.font="9px ui-monospace,monospace";
  const nm=(G.sys&&typeof nameOf==="function")?nameOf(G.sys):(G.sys?G.sys.name:"");
  const l1="ВЫ · сектор "+G.sx+":"+G.sy+(nm?" · «"+nm+"»":"");
  const dch=Math.max(Math.abs(G.sel.x-G.sx),Math.abs(G.sel.y-G.sy));
  const dsel=Math.hypot(G.sel.x-G.sx,G.sel.y-G.sy),st=stat();
  const j=dsel>0?Math.max(1,Math.ceil(dsel/Math.max(.5,st.jump))):0;
  const star=starAt(G.sel.x,G.sel.y);
  const l2=dch===0?"":"сектор "+G.sel.x+":"+G.sel.y+" · "+dch+" "+pl3(dch,"сектор","сектора","секторов")+" · "+j+" "+pl3(j,"прыжок","прыжка","прыжков")+" · "+dsel.toFixed(1).replace(".",",")+" пк"+(star?"":" · пусто, курса нет");
  const hx=xL+8,hy=y0+30;
  const ab=document.getElementById("mapaddr"),abw=(ab&&ab.offsetWidth)?ab.offsetWidth*((typeof UIK==="number")?UIK:1)+12:0;
  const avail=RX-hx-4-abw;
  /* строка длиннее места теряет хвост по « · », а не лезет под поле адреса */
  const trim=t=>{let s2=t;while(s2&&ctx.measureText(s2).width>avail-10&&s2.indexOf(" · ")>0)s2=s2.slice(0,s2.lastIndexOf(" · "));return s2;};
  const L1=trim(l1),L2=trim(l2);
  ctx.fillStyle="rgba(6,10,16,.5)";
  const w1=ctx.measureText(L1).width,w2=L2?ctx.measureText(L2).width:0,wmax=Math.min(avail,Math.max(w1,w2)+10);
  ctx.fillRect(hx-4,hy-10,wmax,l2?26:14);
  mapBox("шапка карты",hx-4,hy-10,wmax,l2?26:14);
  ctx.fillStyle="#7fe6d8";ctx.fillText(L1,hx,hy);
  if(L2){ctx.fillStyle="#f2b25c";ctx.fillText(L2,hx,hy+12);}
  /* обводка найденной клетки — три секунды после поиска */
  if(G.mapOutline&&Date.now()-G.mapOutline.t<3000){
    const c=mapCellXY(G.mapOutline.sx,G.mapOutline.sy,V,cell);
    ctx.strokeStyle="rgba(242,178,92,"+(.9-(Date.now()-G.mapOutline.t)/3400).toFixed(2)+")";ctx.lineWidth=1.5;
    ctx.strokeRect(c.x-cell/2,c.y-cell/2,cell,cell);
  }
  /* выбранная пустая клетка — тонкий квадрат вместо прицела звезды */
  if(!star){const c=mapCellXY(G.sel.x,G.sel.y,V,cell);
    ctx.strokeStyle="rgba(242,178,92,.75)";ctx.lineWidth=1;ctx.setLineDash([3,3]);
    ctx.strokeRect(c.x-cell/2+1,c.y-cell/2+1,cell-2,cell-2);ctx.setLineDash([]);}
  ctx.restore();
}
/* 8. роза в углу: +X, +Y и «к ядру» */
function mapRoseDraw(foot){
  const deck=(typeof mapDeck==="function")?mapDeck():H-100;
  const rows=foot&&foot.rows?foot.rows.length:1;
  const cx=MAP_RUL+34,cy=deck-16*Math.max(1,rows)-46,r=16;
  if(cy<mapRulerTop()+80)return;
  ctx.save();
  ctx.strokeStyle="rgba(150,182,212,.5)";ctx.lineWidth=1;
  ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.stroke();
  ctx.fillStyle="rgba(180,200,220,.8)";ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
  ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+r,cy);ctx.stroke();ctx.fillText("+X",cx+r+9,cy+3);
  ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx,cy+r);ctx.stroke();ctx.fillText("+Y",cx,cy+r+9);
  const a=Math.atan2(-G.sy,-G.sx);
  if(G.sx||G.sy){ctx.strokeStyle="#f2b25c";ctx.lineWidth=1.4;
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a)*r*.9,cy+Math.sin(a)*r*.9);ctx.stroke();
    ctx.fillStyle="#f2b25c";ctx.fillText("К ЯДРУ",cx+Math.cos(a)*(r+16),cy+Math.sin(a)*(r+12)+3);}
  mapBox("роза",cx-r-6,cy-r-6,r*2+30,r*2+22);
  ctx.restore();
}
/* 7. поиск адреса: поле над картой; окно едет, клетка обводится */
function mapGoAddr(sx,sy){
  sx|=0;sy|=0;
  G.sel={x:sx,y:sy};
  if(typeof mapFit==="function")mapFit(sx,sy);else G.mapView={x:sx,y:sy};
  G.mapMore=false;G.mapOutline={sx,sy,t:Date.now()};
  if(typeof sfx==="function")sfx("ui");
  return true;
}
function mapParseAddr(s){
  const m=String(s||"").match(/(-?\d+)\s*[:;,./]\s*(-?\d+)/);
  return m?{sx:+m[1],sy:+m[2]}:null;
}
function mapAddrBox(){
  let e=document.getElementById("mapaddr");
  if(e)return e;
  e=document.createElement("div");e.id="mapaddr";
  e.innerHTML="<span>сектор</span><input id='mapAddrIn' inputmode='text' autocomplete='off' placeholder='4:-7' aria-label='адрес сектора'><button class='act sm' id='mapAddrGo'>→</button>"+
    "<button class='act sm' id='mapMarkGo' title='спичка на клетку: из кошелька, пока лежит'>ОТМЕТИТЬ</button>";
  document.body.appendChild(e);
  const inp=e.querySelector("input"),go=e.querySelector("button");
  const run=()=>{const a=mapParseAddr(inp.value);if(!a){say("Адрес пишут так: 4:-7");return;}mapGoAddr(a.sx,a.sy);inp.blur();};
  go.addEventListener("click",run);
  e.querySelector("#mapMarkGo").addEventListener("click",()=>{if(G.mode==="map")mapMarkToggle(G.sel.x,G.sel.y);});
  inp.addEventListener("keydown",ev=>{if(ev.key==="Enter"){run();ev.preventDefault();}ev.stopPropagation();});
  inp.addEventListener("keyup",ev=>ev.stopPropagation());
  return e;
}
/* адреса в тексте игры становятся нажимаемыми: «сектор 4:-7» → на карту */
function addrify(root){
  if(!root)return;
  const re=/(сектор[ау]?\s+)(-?\d+):(-?\d+)/g;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null);
  const todo=[];
  let n;while((n=walker.nextNode())){
    if(!n.nodeValue||n.nodeValue.indexOf("сектор")<0)continue;
    if(n.parentNode&&(n.parentNode.closest(".addr")||n.parentNode.tagName==="BUTTON"||n.parentNode.tagName==="INPUT"))continue;
    if(re.test(n.nodeValue))todo.push(n);
    re.lastIndex=0;
  }
  for(const t of todo){
    const frag=document.createDocumentFragment();
    let last=0,m;const s=t.nodeValue;re.lastIndex=0;
    while((m=re.exec(s))){
      frag.appendChild(document.createTextNode(s.slice(last,m.index)+m[1]));
      const u=document.createElement("u");u.className="addr";u.dataset.sx=m[2];u.dataset.sy=m[3];
      u.textContent=m[2]+":"+m[3];frag.appendChild(u);
      last=m.index+m[0].length;
    }
    frag.appendChild(document.createTextNode(s.slice(last)));
    t.parentNode.replaceChild(frag,t);
  }
}
(function addrWire(){
  const on=id=>{const e=document.getElementById(id);if(!e)return;
    e.addEventListener("click",ev=>{const u=ev.target.closest&&ev.target.closest("u.addr");if(!u)return;
      ev.stopPropagation();ev.preventDefault();
      if(typeof gotoSector==="function")gotoSector(+u.dataset.sx,+u.dataset.sy,null);});};
  on("tableBody");on("stBody");
})();
