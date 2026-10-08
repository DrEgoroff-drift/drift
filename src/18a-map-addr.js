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
  /* рисунок сетки — тот же, что mapGridPaint (17z-map-backdrop, им рисует карта войны сайта), но пером (17z4) */
  const gx0=Math.round(V.x),gy0=Math.round(V.y),c=Math.round(cell);
  for(let gy=gy0-R;gy<=gy0+R;gy++)for(let gx=gx0-R;gx<=gx0+R;gx++){
    const f=clamp(1-Math.hypot(gx-G.sx,gy-G.sy)/(st.jump*1.6),0,1);   /* к краю прыжка — в ничто */
    if(f<=.02)continue;
    const p=mapCellXY(gx,gy,V,cell),x0=p.x-cell/2,y0=p.y-cell/2;
    if(x0>W||y0>H||x0+cell<0||y0+cell<0)continue;
    const fifth=(gx%5===0||gy%5===0);
    mpFrame(Math.round(x0)+.5,Math.round(y0)+.5,c,c,1,"rgba(150,182,212,"+(f*(fifth?.16:.09)).toFixed(3)+")");
  }
}
/* 6. кольца прыжков за освещённым кругом */
function mapRingsDraw(px,py,cell,st){
  ctx.save();
  mapFont(8);ctx.textAlign="left";
  for(const k of [2,3]){
    const r=k*(st.jump+.02)*cell;
    if(r>Math.hypot(W,H))continue;
    mpDashCircle(px,py,r,1,"rgba(127,230,216,"+(k===2?.14:.09)+")",[2,6]);
    ctx.fillStyle="rgba(127,230,216,"+(k===2?.42:.3)+")";
    const t=k+" "+pl3(k,"ПРЫЖОК","ПРЫЖКА","ПРЫЖКОВ"),tw=ctx.measureText(t).width,d=r*.707;
    mapLate(t,[[px+d+4,py-d-3],[px-d-4-tw,py-d-3],[px+d+4,py+d+11],[px-d-4-tw,py+d+11]],1);   /* у кольца, в любой четверти */
  }
  ctx.restore();
}
/* 5. области слухов — штрихованные квадраты; наложение видно само */
function mapRumoursDraw(V,cell){
  const L=rumoursKnown();if(!L.length)return;
  ctx.save();
  for(const r of L){
    const c=mapCellXY(r.sx,r.sy,V,cell),half=(r.rad+.5)*cell;
    const x0=c.x-half,y0=c.y-half,w=half*2;
    if(x0>W||y0>H||x0+w<0||y0+w<0)continue;
    mpHatch(x0,y0,w,w,9,1,1,"rgba(207,227,234,.16)");
    mpDashFrame(x0+.5,y0+.5,w,w,1,"rgba(207,227,234,.35)",[4,4]);
    ctx.fillStyle="rgba(207,227,234,.7)";mapFont(8);ctx.textAlign="left";
    mapLate("В "+r.rad+" "+pl3(r.rad,"СЕКТОРЕ","СЕКТОРАХ","СЕКТОРАХ")+" ВОКРУГ "+r.sx+":"+r.sy+(r.src?" · "+r.src.toUpperCase():""),
      [[x0+4,y0-4],[x0+4,y0+w+11],[x0+4,y0+12],[x0+4,y0+w-4]],2);   /* над областью, под ней или у кромки внутри */
  }
  ctx.restore();
}
/* 9. спички на клетках: лежит, тёплая головка, без свечения */
function mapMarksDraw(V,cell){
  const L=mapMarks();if(!L.length)return;
  const ca=Math.cos(-.35),sa=Math.sin(-.35);
  for(const m of L){
    const c=mapCellXY(m.sx,m.sy,V,cell);
    if(c.x<-20||c.x>W+20||c.y<-20||c.y>H+20)continue;
    const l=Math.max(8,Math.min(cell*.7,22)),ox=c.x,oy=c.y+cell*.28;
    /* спичка повёрнута на −0.35: углы плашек — через поворот, перо пишет без матрицы */
    const T=(u,v)=>[ox+u*ca-v*sa,oy+u*sa+v*ca];
    const box=(x,y,w,h,col)=>{const a=T(x,y),b=T(x+w,y),d=T(x+w,y+h),e=T(x,y+h);mpQuad(a[0],a[1],b[0],b[1],d[0],d[1],e[0],e[1],col);};
    box(-l/2+1,1,l,2.2,"rgba(0,0,0,.45)");
    box(-l/2,-1,l,2.2,"#d9c79a");
    const hd=T(l/2,0);mpEll(hd[0],hd[1],2.6,2,"#a83a2a");
    box(l/2-1,-1.2,1,1,"rgba(255,220,180,.6)");
  }
}
/* 2+3. линейки и шапка — интерфейс, сообщает прямоугольники */
function mapRulersDraw(V,cell,foot){
  const RX=(typeof mapRail==="function")?mapRail():W-16;
  const U=mapU();
  const y0=mapRulerTop(),xL=MAP_RUL*U;
  const deck=(typeof mapDeck==="function")?mapDeck():H-100;
  const yEnd=deck-16*U*Math.max(1,(foot&&foot.rows?foot.rows.length:1))-14*U;
  ctx.save();
  mapFont(8);ctx.textBaseline="alphabetic";
  /* полоса X сверху */
  mpRect(xL,y0,RX-xL,13*U,"rgba(6,10,16,.55)");
  mpLine(xL,y0+13.5*U,RX,y0+13.5*U,1,"rgba(150,182,212,.35)");
  mapBox("линейка X",xL,y0,RX-xL,14*U);
  const step=cell>=34?1:(cell>=18?2:5);
  const gx0=Math.floor(V.x-(W/2-xL)/cell)-1,gx1=Math.ceil(V.x+(RX-W/2)/cell)+1;
  ctx.textAlign="center";
  for(let gx=gx0;gx<=gx1;gx++){
    const x=W/2+(gx-V.x)*cell;if(x<xL+6||x>RX-6)continue;
    const me=gx===G.sx,sel=gx===G.sel.x;
    mpLine(Math.round(x)+.5,y0+9*U,Math.round(x)+.5,y0+13*U,1,"rgba(150,182,212,.5)");
    if(gx%step!==0&&!me&&!sel)continue;
    const col=me?"#7fe6d8":(sel?"#f2b25c":"rgba(180,200,220,.75)");
    mpText(String(gx),x,y0+8*U,col);
    if(me||sel)mpRect(x-6*U,y0+10*U,12*U,1,col);
  }
  /* полоса Y слева */
  const yT=y0+16*U;
  mpRect(2,yT,xL-4,Math.max(10,yEnd-yT),"rgba(6,10,16,.55)");
  mpLine(xL-1.5,yT,xL-1.5,yEnd,1,"rgba(150,182,212,.35)");
  mapBox("линейка Y",2,yT,xL-2,Math.max(10,yEnd-yT));
  const gy0=Math.floor(V.y-(H/2-yT)/cell)-1,gy1=Math.ceil(V.y+(yEnd-H/2)/cell)+1;
  ctx.textAlign="right";
  for(let gy=gy0;gy<=gy1;gy++){
    const y=H/2+(gy-V.y)*cell;if(y<yT+6||y>yEnd-4)continue;
    const me=gy===G.sy,sel=gy===G.sel.y;
    mpLine(xL-6*U,Math.round(y)+.5,xL-2,Math.round(y)+.5,1,"rgba(150,182,212,.5)");
    if(gy%step!==0&&!me&&!sel)continue;
    const col=me?"#7fe6d8":(sel?"#f2b25c":"rgba(180,200,220,.75)");
    mpText(String(gy),xL-8*U,y+3*U,col);
    if(me||sel)mpRect(xL-8*U-String(gy).length*5*U,y+5*U,String(gy).length*5*U,1,col);
  }
  /* шапка: где вы и что выбрано */
  ctx.textAlign="left";mapFace(11);
  const nm=(G.sys&&typeof nameOf==="function")?nameOf(G.sys):(G.sys?G.sys.name:"");
  const l1="ВЫ · сектор "+G.sx+":"+G.sy+(nm?" · «"+nm+"»":"");
  const dch=Math.max(Math.abs(G.sel.x-G.sx),Math.abs(G.sel.y-G.sy));
  const dsel=Math.hypot(G.sel.x-G.sx,G.sel.y-G.sy),st=stat();
  const j=dsel>0?Math.max(1,Math.ceil(dsel/Math.max(.5,st.jump))):0;
  const star=starAt(G.sel.x,G.sel.y);
  const l2=dch===0?"":"сектор "+G.sel.x+":"+G.sel.y+" · "+dch+" "+pl3(dch,"сектор","сектора","секторов")+" · "+j+" "+pl3(j,"прыжок","прыжка","прыжков")+" · "+dsel.toFixed(1).replace(".",",")+" пк"+(star?"":" · пусто, курса нет");
  /* место шапки делит с рядом адреса раскладчик верха карты */
  const T=mapTopPlace();
  const hx=T?T.hx:xL+8*U,hy=T?T.hy:y0+30*U;
  const avail=T?T.hw:RX-hx-4;
  /* строка длиннее места теряет хвост по « · », а не лезет под поле адреса */
  const trim=t=>{let s2=t;while(s2&&mapTW(s2)>avail-18*U&&s2.indexOf(" · ")>0)s2=s2.slice(0,s2.lastIndexOf(" · "));return s2;};
  const L1=trim(l1),L2=trim(l2);
  const w1=mapTW(L1),w2=L2?mapTW(L2):0,wmax=Math.min(avail,Math.max(w1,w2)+18*U);
  /* плашка материалом «Борта» (M822): графит с каймой, слева риска «вы» его цветом; строка выбора —
     цветом прицела. Подложка сплошная: подпись листа под шапкой сквозь неё не читается */
  const hh=(L2?33:19)*U;
  mpPlate(hx-9*U,hy-13*U,wmax,hh);
  mpRect(hx-9*U,hy-13*U+5*U,2*U,hh-10*U,"#7fe6d8");
  mapBox("шапка карты",hx-9*U,hy-13*U,wmax,hh);
  mpText(L1,hx,hy,HANG.INK);
  if(L2)mpText(L2,hx,hy+14*U,"#f2b25c");
  /* обводка найденной клетки — три секунды после поиска */
  if(G.mapOutline&&now()-G.mapOutline.t<3000){
    const c=mapCellXY(G.mapOutline.sx,G.mapOutline.sy,V,cell);
    mpFrame(c.x-cell/2,c.y-cell/2,cell,cell,1.5,"rgba(242,178,92,"+(.9-(now()-G.mapOutline.t)/3400).toFixed(2)+")");
  }
  /* выбранная пустая клетка — тонкий квадрат вместо прицела звезды */
  if(!star){const c=mapCellXY(G.sel.x,G.sel.y,V,cell);
    mpDashFrame(c.x-cell/2+1,c.y-cell/2+1,cell-2,cell-2,1,"rgba(242,178,92,.75)",[3,3]);}
  ctx.restore();
}
/* 8. роза в углу: +X, +Y и «к ядру» */
function mapRoseDraw(foot){
  const deck=(typeof mapDeck==="function")?mapDeck():H-100;
  const rows=foot&&foot.rows?foot.rows.length:1;
  /* один угол — одна вещь (M437): карточка системы стоит в том же нижнем
     левом углу и накрывала розу собой на любой мерке. Роза — постоянная
     подсказка, карточку игрок открывает нарочно вторым тапом: уступает роза.
     Видит она карточку по её же прямоугольнику — тот уже сообщён (MAP_BOX). */
  if(typeof MAP_BOX!=="undefined"&&MAP_BOX.some(b=>b.s==="карточка системы"))return;
  const U=mapU();
  const cx=(MAP_RUL+34)*U,cy=deck-16*U*Math.max(1,rows)-46*U,r=16*U;
  if(cy<mapRulerTop()+80*U)return;
  ctx.save();
  const lc="rgba(150,182,212,.5)",tc="rgba(180,200,220,.8)";
  mpCircle(cx,cy,r,1,lc);
  mapFont(8);ctx.textAlign="center";
  mpLine(cx,cy,cx+r,cy,1,lc);mpText("+X",cx+r+9*U,cy+3*U,tc);
  mpLine(cx,cy,cx,cy+r,1,lc);mpText("+Y",cx,cy+r+9*U,tc);
  const a=Math.atan2(-G.sy,-G.sx);
  if(G.sx||G.sy){
    mpLine(cx,cy,cx+Math.cos(a)*r*.9,cy+Math.sin(a)*r*.9,1.4,"#f2b25c");
    mpText("К ЯДРУ",cx+Math.cos(a)*(r+16*U),cy+Math.sin(a)*(r+12*U)+3*U,"#f2b25c");}
  mapBox("роза",cx-r-6*U,cy-r-6*U,r*2+30*U,r*2+22*U);
  ctx.restore();
}
/* 7. поиск адреса: поле над картой; окно едет, клетка обводится */
function mapGoAddr(sx,sy){
  sx|=0;sy|=0;
  G.sel={x:sx,y:sy};
  if(typeof mapFit==="function")mapFit(sx,sy);else G.mapView={x:sx,y:sy};
  G.mapMore=false;G.mapOutline={sx,sy,t:now()};
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
    "<button class='act sm' id='mapMarkGo' title='спичка на клетку: из кошелька, пока лежит'>ОТМЕТИТЬ</button>"+
    "<button class='act sm' id='mapLayerGo' title='владения · цены · слухи — по одному или все'>СЛОИ · ВСЕ</button>";
  document.body.appendChild(e);
  const inp=e.querySelector("input"),go=e.querySelector("button");
  const run=()=>{const a=mapParseAddr(inp.value);if(!a){say("Адрес пишут так: 4:-7");return;}mapGoAddr(a.sx,a.sy);inp.blur();};
  go.addEventListener("click",run);
  e.querySelector("#mapMarkGo").addEventListener("click",()=>{if(G.mode==="map")mapMarkToggle(G.sel.x,G.sel.y);});
  e.querySelector("#mapLayerGo").addEventListener("click",()=>{if(typeof mapLayerNext==="function"){mapLayerNext();if(typeof sfx==="function")sfx("ui");}});
  inp.addEventListener("keydown",ev=>{if(ev.key==="Enter"){run();ev.preventDefault();}ev.stopPropagation();});
  inp.addEventListener("keyup",ev=>ev.stopPropagation());
  return e;
}
/* ── верх карты: ряд адреса (DOM) и шапка (холст) делят одно место ──
   На телефоне ряд строкой шире места до борта и накрывал шапку (на 320 — целиком), на низком окне
   свёрнутый столбиком уходил к приёмнику (зрение 06.10.2026). Места ищутся по очереди. Ряд: на низком
   окне — в верхней полосе между приборами и колодкой области, если там встаёт строкой (на высоком эта
   полоса — воздух над картой); иначе под линейкой — до правой кромки, если борт ниже ряда, или до
   борта, с переносом. Шапка: рядом с рядом, если остаётся 150 px; иначе в верхнюю полосу, если та
   свободна и широка; иначе под рядом. Низ всего (floor) — потолок строки сообщения (--mapbar, 27z).
   Пиксели — окна; ряд живёт внутри zoom:var(--ui) и свои px умножает на UIK — потому делим. */
let MAP_TOP=null;
function mapTopPlace(){
  if(G.mapClean||typeof $vitals==="undefined"||!$vitals||!$locusEl){MAP_TOP=null;return null;}
  const ab=mapAddrBox();setSt(ab,"display","flex");
  const k=(typeof UIK==="number"&&UIK>0)?UIK:1,U=mapU();
  const vr=$vitals.getBoundingClientRect(),lr=$locusEl.getBoundingClientRect();
  const rl=document.querySelector(".rail"),rr=rl?rl.getBoundingClientRect():null;
  const cs=getComputedStyle(ab),gap=parseFloat(cs.columnGap)||0;
  let need=(parseFloat(cs.paddingLeft)||0)+(parseFloat(cs.paddingRight)||0)+2,hgt=0,n=0;
  for(const c of ab.children){if(!c.offsetWidth)continue;need+=c.offsetWidth;hgt=Math.max(hgt,c.offsetHeight);n++;}
  need=(need+gap*Math.max(0,n-1))*k;
  const rowH=(hgt+(parseFloat(cs.paddingTop)||0)+(parseFloat(cs.paddingBottom)||0)+2)*k;
  const y0=mapRulerTop(),band=y0-4,xL=MAP_RUL*U,hx0=xL+8*U,RX=mapRail();
  const tx0=vr.right+8,tx1=lr.left-8,shortWin=innerHeight<=480;
  let top,right,maxW;
  if(shortWin&&tx1-tx0>=need&&vr.top+rowH<=band+2){top=vr.top;right=innerWidth-tx1;maxW=tx1-tx0;}
  else{const ry=band+20,free=!rr||!rr.width||rr.top>=ry+rowH+8,x1=free?innerWidth-8:rr.left-8;
    top=ry;right=innerWidth-x1;maxW=x1-(xL+8);}
  setSt(ab,"top",(top/k).toFixed(1)+"px");setSt(ab,"right",(right/k).toFixed(1)+"px");setSt(ab,"maxWidth",Math.max(60,maxW/k).toFixed(1)+"px");
  const R=ab.getBoundingClientRect(),hH=26*U;
  let hx=hx0,hy=y0+30*U,hw=RX-hx0-4,floor=R.bottom;
  if(R.top>=band-2&&R.bottom>hy-10*U&&R.top<hy-10*U+hH&&R.left<RX){   /* ряд в полосе шапки */
    if(R.left-8-hx0>=150*U)hw=R.left-8-hx0;
    else if(tx1-tx0>=150*U&&vr.top+hH<=band){hx=tx0+4*U;hy=vr.top+10*U;hw=tx1-tx0-8*U;}
    else{hy=R.bottom+6+10*U;floor=hy-10*U+hH;}
  }else floor=Math.max(R.top<band?0:R.bottom,y0+20*U+hH);
  MAP_TOP={hx,hy,hw,floor,hb:hy-10*U+hH};   /* hb — низ подложки шапки */
  return MAP_TOP;
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
