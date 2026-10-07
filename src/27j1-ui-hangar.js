/* ── АНГАР ОПИСИ (M723) ── корабль в объёме посреди описи.
   Студия 17c2 с видом v3 (курс, наклон, перспектива — 17c2a h3dStudioPt): тот же корпус и те же части,
   что в полёте (17c2b shipGear3d), под ровным светом студии, на поворотном круге. Подвес — метка на
   верхушке своей части; на широком экране от метки выноска к карточке слота над сценой или под ней,
   на телефоне метка с номером и список слотов ниже. Корабль медленно водит носом, турели оглядываются;
   потянуть сцену вбок — повернуть самому, отпустил — вернётся.

   ПРАВИЛА ФАЙЛА:
   1. Раскладка (hgLay) — в перестройке описи, не в кадре: рамка, масштаб, ряды карточек, отступы.
      Кадр (hgTick) только читает её и рисует; DOM в кадре не читается (15d), указатель — тоже.
   2. Ряд и порядок карточек считаются в единицах корпуса (hgUnits/hgRows) — от ширины холста они не
      зависят, и опись строит ряды сразу; ширина холста решает только ширину и отступы карточек.
   3. Без объёма (?h3d=0) — тот же ангар сверху: наклон, перспектива и размах — нули, спрайт 17c2.
   4. Выноски не пересекаются: карточки в ряду идут в порядке своих меток, колено у всех на одной высоте. */
const HANGAR={tilt:.95,pp:.14,yaw:.14,sway:.1,per:19,spin:0,spinT:0,L:null,U:new WeakMap(),
  ptr:null,rc:null,grab:null,moved:false,
  v3:{yaw:0,tilt:0,persp:0,gear:null,aim:null,lz:.95,fill:.36,rim:.5}};
const HANG_ACC="#ff6a2b",HANG_INK="#f1ebde",HANG_FONT="600 11px Bahnschrift,'DIN Alternate','Roboto Condensed','Arial Narrow',sans-serif";

/* рамка в единицах (масштаб 1, центр 0) при курсах yaws: корпус с частями без плоскости краски (последние
   шесть вершин, 17c2a h3dPack) и поворотный круг под ним. Круг — эллипс по длине и ширине корпуса на полу
   ниже брюха; hv0/hv1 — верх и низ одного корпуса (колено выносок) */
function hgUnits(m,tilt,pp,yaws){
  const key=tilt+"|"+pp+"|"+yaws.join(",");let c=HANGAR.U.get(m);if(c&&c.key===key)return c;
  const V=m.v,N=Math.max(0,(m.n-6)*12),ct=Math.cos(tilt),st=Math.sin(tilt),k=pp*(1-pp)/m.R;
  let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9,z0=1e9;
  for(let i=0;i<N;i+=12){const px=V[i],py=V[i+1],pz=V[i+2];
    if(px<x0)x0=px;if(px>x1)x1=px;if(py<y0)y0=py;if(py>y1)y1=py;if(pz<z0)z0=pz;}
  if(!(x1>x0)){x0=-10;x1=10;y0=-4;y1=4;z0=-2;}
  const B=Math.max(-y0,y1)*1.3+.8,pad={cx:(x0+x1)/2,A:(x1-x0)/2*1.08,B,zf:z0-Math.max(1.2,B*.18)};
  let u0=1e9,u1=-1e9,v0=1e9,v1=-1e9,hu0=1e9,hu1=-1e9,hv0=1e9,hv1=-1e9;
  const pr=(a,px,py,pz)=>{const cy=Math.cos(a),sy=Math.sin(a),X=px*cy-py*sy,Y0=px*sy+py*cy,Y=Y0*ct-pz*st,Z=Y0*st+pz*ct,w=1-k*Z;return [X/w,Y/w];};
  for(const a of yaws){const cy=Math.cos(a),sy=Math.sin(a);
    for(let i=0;i<N;i+=12){const px=V[i],py=V[i+1],pz=V[i+2];
      const X=px*cy-py*sy,Y0=px*sy+py*cy,Y=Y0*ct-pz*st,Z=Y0*st+pz*ct,w=1-k*Z,u=X/w,v=Y/w;
      if(u<hu0)hu0=u;if(u>hu1)hu1=u;if(v<hv0)hv0=v;if(v>hv1)hv1=v;}
    for(let j=0;j<32;j++){const f=j/32*TAU,q=pr(a,pad.cx+pad.A*Math.cos(f),pad.B*Math.sin(f),pad.zf);
      if(q[0]<u0)u0=q[0];if(q[0]>u1)u1=q[0];if(q[1]<v0)v0=q[1];if(q[1]>v1)v1=q[1];}}
  u0=Math.min(u0,hu0);u1=Math.max(u1,hu1);v0=Math.min(v0,hv0);v1=Math.max(v1,hv1);
  c={key,u0,u1,v0,v1,hu0,hu1,hv0,hv1,pad};HANGAR.U.set(m,c);return c;
}
/* ряды выносок: левый борт (y<0) уходит вверх сцены, правый — вниз; подвесы по оси добирают ряд, где меньше.
   В ряду — по месту метки слева направо (базовый курс, единицы) */
function hgRows(){
  const id=G.shipId,gear=shipGear3d(),m=h3dMesh(hullOf(id),gear),flat=!H3D.on;
  const v3={yaw:flat?0:HANGAR.yaw,tilt:flat?0:HANGAR.tilt,persp:flat?0:HANGAR.pp};
  const top=[],bot=[],mid=[];
  for(const t of (m.tops||[])){const q=h3dStudioPt(m,v3,0,0,1,t.x,t.y,t.z),e={i:t.slot,u:q[0]};
    (t.y<-.5?top:(t.y>.5?bot:mid)).push(e);}
  for(const e of mid)(top.length<=bot.length?top:bot).push(e);
  /* перекос больше двух — лишние уходят в другой ряд с краю, где выноске ближе */
  while(top.length>bot.length+2){top.sort((a,b)=>a.u-b.u);bot.push(top.pop());}
  while(bot.length>top.length+2){bot.sort((a,b)=>a.u-b.u);top.push(bot.pop());}
  top.sort((a,b)=>a.u-b.u);bot.sort((a,b)=>a.u-b.u);
  return [top.map(e=>e.i),bot.map(e=>e.i)];
}

/* ── зона 3 описи: ангар, приборы, снятые ── */
function hgZone(st,fm,slots,phone){
  const z3=document.createElement("section");z3.className="op-z op-parts hg";
  const inv=G.inv.filter(p=>!isFitted(p.id)).sort((a,b)=>b.tier-a.tier);
  const used=slots.reduce((n,k,i)=>n+(fm[i]!=null?1:0),0);
  z3.appendChild(opisHead(3,"АНГАР","«"+st.S.ru+"» · подвесов "+used+"/"+slots.length+" · оснастка "+capUsed()+"/"+capOf(G.shipId)+
    " · частей "+G.inv.length+"/"+PART_MAX));
  const grid=document.createElement("div");grid.className="hg-grid";
  const stage=document.createElement("div");stage.className="hg-stage";
  const rows=phone?null:hgRows();
  const row=(ids,cls)=>{const r=document.createElement("div");r.className="hg-row "+cls;
    for(const i of ids)if(slots[i])r.appendChild(hgCall(i,slots[i],fm[i]!=null?partById(fm[i]):null,cls));return r;};
  if(rows)stage.appendChild(row(rows[0],"top"));
  const hcv=document.createElement("canvas");hcv.className="op-hull";hcv.dataset.drop="hull";
  hgWire(hcv,fm);
  stage.appendChild(hcv);
  if(rows)stage.appendChild(row(rows[1],"bot"));
  /* две колонны, каждая своей высоты: слева сцена и лоток снятых, справа разбор, приборы, чертёж.
     В одной сетке высокая правая раздувала строку сцены, и под ней зияла пустота. Узко — одна лента (style.css) */
  const main=document.createElement("div");main.className="hg-main";
  main.appendChild(stage);
  if(phone)main.appendChild(opisHullCap(slots,fm,inv));
  /* на телефоне слоты списком (метки на корпусе — с номерами), раньше приборов (R6) */
  if(phone)main.appendChild(hgSlotList(slots,fm));
  const side=document.createElement("div");side.className="hg-side";
  if(!phone)side.appendChild(hgInspect(slots,fm,inv));
  const ps=opisPanel("ship","ПРИБОРЫ",OPIS_SHIP,st,opisShipFuture(opisFocus()),"оснастка "+capUsed()+"/"+capOf(G.shipId));
  opisScarRows(ps);OPIS.panels.ship=ps;
  side.appendChild(ps);
  grid.appendChild(main);grid.appendChild(side);
  const sp=document.createElement("div");sp.className="op-spare";sp.dataset.drop="spare";
  sp.innerHTML="<h4>СНЯТЫЕ ЧАСТИ<s>"+inv.length+(phone?"":" · тащить на метку подвеса или в карточку слота")+"</s></h4>";
  if(!inv.length){const e=document.createElement("s");e.className="chalk";
    e.textContent="снятых нет: части роняют пираты и продают станции";sp.appendChild(e);}
  for(const p of inv)sp.appendChild(opisPartCard(p,"spare"));
  /* под сценой — лоток снятых и рядом чертёж: правая колонна и без него длинная (разбор, приборы) */
  const low=document.createElement("div");low.className="hg-low";low.appendChild(sp);main.appendChild(low);
  if(typeof opisPlanBlock==="function"){const pb=opisPlanBlock();pb.classList.add("hg-plan");low.appendChild(pb);}   /* чертёж корабля, только вид (M476) */
  z3.appendChild(grid);
  return z3;
}
/* карточка подвеса у выноски: род и номер, имя, тир и главный аффикс; занятая — та же карточка описи
   (тычок выбирает, долгое нажатие несёт), пустая — тычок выбирает слот. Полоса рода — к выноске */
function hgCall(i,kind,p,row){
  const K=PART_KINDS[kind],M=(typeof mountAt==="function")?mountAt(G.shipId,i):null;
  const el=document.createElement("div");
  const on=!!(OPIS.sel&&OPIS.sel.t==="slot"&&OPIS.sel.i===i);
  el.className="op-slot hg-call "+row+(on?" on":"")+(p?"":" empty");
  el.dataset.drop="slot";el.dataset.slot=i;el.style.setProperty("--k",K.col);
  const mru=M&&kind==="gun"?MOUNT_SIZE_RU[M.size]+" · "+MOUNT_KINDS[M.mount].ru:K.note;
  const lab="<em><i>"+(i+1)+"</i>"+K.sh+"</em>";
  if(p){
    const a=p.aff&&p.aff[0];
    const card=opisCard("part hgc",{t:"slot",i,id:p.id},lab+"<b>"+p.name+"</b><s>"+TIER_RU[p.tier]+(a?" · "+affLabel(a):"")+"</s>");
    card.dataset.id=p.id;el.appendChild(card);
  }else{
    el.innerHTML=lab+"<b class='nil'>пусто</b><s>"+mru+"</s>";
    el.addEventListener("click",()=>{OPIS.sel=(OPIS.sel&&OPIS.sel.t==="slot"&&OPIS.sel.i===i)?null:{t:"slot",i};opisRerender();});
    el.addEventListener("mouseenter",()=>{if(opisPhone())return;OPIS.hover={t:"slot",i};opisPanels();});
    el.addEventListener("mouseleave",()=>{if(OPIS.hover&&OPIS.hover.t==="slot"&&OPIS.hover.i===i&&OPIS.hover.id==null){OPIS.hover=null;opisPanels();}});
  }
  return el;
}
/* телефон: слоты списком в две колонки — род, номер, имя; кнопки — под корпусом (opisHullCap) */
function hgSlotList(slots,fm){
  const sc=document.createElement("div");sc.className="op-slots";
  slots.forEach((kind,i)=>{
    const K=PART_KINDS[kind],p=fm[i]!=null?partById(fm[i]):null;
    const on=!!(OPIS.sel&&OPIS.sel.t==="slot"&&OPIS.sel.i===i);
    const chip=document.createElement("div");chip.className="op-slot hg-chip"+(on?" on":"")+(p?"":" empty");
    chip.dataset.drop="slot";chip.dataset.slot=i;chip.style.setProperty("--k",K.col);
    chip.innerHTML="<em><i>"+(i+1)+"</i>"+K.sh+"</em>"+(p?"<b>"+p.name+"</b><s>"+TIER_RU[p.tier]+"</s>":"<b class='nil'>пусто</b>");
    chip.addEventListener("click",()=>{OPIS.sel=on?null:(p?{t:"slot",i,id:p.id}:{t:"slot",i});opisRerender();});
    sc.appendChild(chip);
  });
  return sc;
}
/* разбор выбранного: слот — род, подвес и сама часть с кнопками; снятая в руке — куда встанет;
   ничего — легенда подвесов по родам */
function hgInspect(slots,fm,inv){
  const box=document.createElement("div");box.className="hg-insp";
  const s=OPIS.sel;
  if(s&&s.t==="slot"&&slots[s.i]){
    const i=s.i,kind=slots[i],K=PART_KINDS[kind],M=(typeof mountAt==="function")?mountAt(G.shipId,i):null;
    const p=fm[i]!=null?partById(fm[i]):null;
    box.style.setProperty("--k",K.col);
    box.innerHTML="<h4><i>"+(i+1)+"</i>"+K.sh+"<s>"+(M&&kind==="gun"?MOUNT_SIZE_RU[M.size]+" · "+MOUNT_KINDS[M.mount].ru:K.note)+"</s></h4>"+
      (M&&kind==="gun"?"<s class='chalk'>"+MOUNT_KINDS[M.mount].note+"</s>":"");
    if(p){box.appendChild(partThumb(p,232,128,"fl hero"));box.appendChild(opisPartCard(p,"slot",false));}
    else{
      const takes=q=>q.kind===kind&&(!M||typeof mountTakes!=="function"||mountTakes(M,q));
      const n=inv.filter(takes).length,kin=inv.filter(q=>q.kind===kind).length;
      const e=document.createElement("s");e.className="chalk";
      e.textContent="пусто · "+(n?"подойдёт снятых: "+n+", они отмечены на полке ниже":
        (kin&&M?"снятые есть, но в "+MOUNT_SIZE_RU[M.size]+" подвес не встанут":"снятых такого рода нет · продают на станции: КОРАБЛЬ → МОДУЛИ"));
      box.appendChild(e);
    }
    return box;
  }
  if(s&&s.t==="part"){
    const p=partById(s.id);
    if(p){const K=PART_KINDS[p.kind],t=opisTarget(p);box.style.setProperty("--k",K.col);
      box.innerHTML="<h4><i>·</i>В РУКЕ<s>"+K.sh+"</s></h4><b class='nm'>"+p.name+"</b><s class='chalk'>"+
        (t<0?"на этом корпусе подвеса под неё нет":"встанет в слот "+(t+1)+(fm[t]!=null?" вместо «"+partById(fm[t]).name+"»":"")+
          " · или тащите на любую подсвеченную метку")+"</s>";
      box.insertBefore(partThumb(p,232,128,"fl hero"),box.children[1]);
      return box;}
  }
  const cnt={};slots.forEach((k,i)=>{const c=cnt[k]||(cnt[k]=[0,0]);c[1]++;if(fm[i]!=null)c[0]++;});
  const used=slots.reduce((n,k,i)=>n+(fm[i]!=null?1:0),0);
  box.innerHTML="<h4>ПОДВЕСЫ<s>занято "+used+" из "+slots.length+"</s></h4><div class='hg-lg'>"+
    Object.keys(cnt).map(k=>"<span style='--k:"+PART_KINDS[k].col+"'><i></i>"+PART_KINDS[k].sh+"<b>"+cnt[k][0]+"/"+cnt[k][1]+"</b></span>").join("")+
    "</div><s class='chalk'>метка на корпусе — подвес: тычок выбирает его · снятую часть тащить прямо на метку · сцену можно повернуть, потянув вбок</s>";
  return box;
}
/* холст сцены: тычок по метке — слот; протяжка вбок — поворот (тычка после неё нет). Перенос части на холст
   разбирает opisDrop (27j); здесь — только свой жест. Обработчики DOM не читают (15d) */
function hgWire(cv,fm){
  cv.addEventListener("click",e=>{
    if(HANGAR.moved){HANGAR.moved=false;return;}
    const i=opisHullSlotAt(cv,e.clientX,e.clientY,null);
    if(i<0)return;
    /* с id занятой части — тогда и её карточка выбрана и показывает кнопки */
    OPIS.sel=(OPIS.sel&&OPIS.sel.t==="slot"&&OPIS.sel.i===i)?null:(fm[i]!=null?{t:"slot",i,id:fm[i]}:{t:"slot",i});opisRerender();
  });
  cv.addEventListener("pointerdown",e=>{
    if(e.button||OPIS.drag||!HANGAR.L||HANGAR.L.flat)return;
    HANGAR.grab={x:e.clientX,s:HANGAR.spinT,pid:e.pointerId};HANGAR.moved=false;
  });
  cv.addEventListener("pointermove",e=>{
    const g=HANGAR.grab;if(!g||e.pointerId!==g.pid)return;
    const dx=e.clientX-g.x;
    if(!HANGAR.moved&&Math.abs(dx)>6){HANGAR.moved=true;try{cv.setPointerCapture(g.pid);}catch(er){}}
    if(HANGAR.moved)HANGAR.spinT=clamp(g.s+dx*.008,-.7,.7);
  });
  const up=()=>{if(!HANGAR.grab)return;HANGAR.grab=null;HANGAR.spinT=0;};
  cv.addEventListener("pointerup",up);cv.addEventListener("pointercancel",up);
}

/* ── раскладка: размер холста, масштаб и центр корабля, ряды карточек; метки для тычка (OPIS.hit) ── */
function hgLay(cv,sel,aim){
  const phone=opisPhone(),dpr=Math.min(2,window.devicePixelRatio||1)*(typeof UIK==="number"?UIK:1);
  const bw=cv.clientWidth|0,bh=cv.clientHeight|0,cw=bw>40?bw:OPIS_HW,ch=bh>40?bh:OPIS_HH;
  OPIS.hullW=cw;OPIS.hullH=ch;
  const pw=Math.round(cw*dpr),ph=Math.round(ch*dpr);
  if(cv.width!==pw||cv.height!==ph){cv.width=pw;cv.height=ph;}
  const id=G.shipId,gear=shipGear3d(),m=h3dMesh(hullOf(id),gear),flat=!H3D.on;
  const tilt=flat?0:HANGAR.tilt,pp=flat?0:HANGAR.pp,yaw=flat?0:HANGAR.yaw,sw=flat?0:HANGAR.sway;
  const U=hgUnits(m,tilt,pp,flat?[0]:[yaw-sw,yaw,yaw+sw]);
  const rows=(!phone&&OPIS.box)?OPIS.box.querySelectorAll(".hg-row"):[];
  const wide=rows.length===2,nT=wide?rows[0].children.length:0,nB=wide?rows[1].children.length:0;
  const bT=nT?30:12,bB=nB?30:12,mx=16;
  /* масштаб — по корпусу: круг пола шире корабля и уходит за кромку сцены, как пол за кадр */
  const sc=Math.max(.05,Math.min((cw-2*mx)/(U.hu1-U.hu0),(ch-bT-bB)/(U.hv1-U.hv0)));
  const x=cw/2-(U.hu0+U.hu1)/2*sc,y=bT+((ch-bT-bB)-(U.hv1-U.hv0)*sc)/2-U.hv0*sc;
  const L={id,m,gear,flat,tilt,pp,yaw,ct:Math.cos(tilt),cw,ch,x,y,sc,phone,wide,sel,aim,pad:U.pad,
    kTop:Math.max(8,y+U.hv0*sc-12),kBot:Math.min(ch-8,y+U.hv1*sc+12),tops:m.tops||[],cards:[],pts:{}};
  const v3={yaw,tilt,persp:pp};
  for(const t of L.tops)L.pts[t.slot]=h3dStudioPt(m,v3,x,y,sc,t.x,t.y,t.z+.3);
  /* ряды: общая ширина карточки на оба ряда; каждая встаёт над своей меткой, сколько позволяют соседи */
  if(wide){
    const n=Math.max(nT,nB,1),gap=8,Wc=Math.floor(Math.max(84,Math.min(178,(cw-(n-1)*gap)/n)));
    for(let r=0;r<2;r++){const kids=Array.from(rows[r].children),k=kids.length;if(!k)continue;
      const xs=kids.map(e=>{const q=L.pts[+e.dataset.slot];return clamp(Math.round((q?q[0]:cw/2)-Wc/2),0,cw-Wc);});
      for(let j=1;j<k;j++)xs[j]=Math.max(xs[j],xs[j-1]+Wc+gap);
      if(xs[k-1]>cw-Wc){xs[k-1]=cw-Wc;for(let j=k-2;j>=0;j--)xs[j]=Math.min(xs[j],xs[j+1]-Wc-gap);}
      if(xs[0]<0){const d=-xs[0];for(let j=0;j<k;j++)xs[j]+=d;}
      kids.forEach((e,j)=>{const w=Wc+"px",ml=(j?xs[j]-xs[j-1]-Wc:xs[0])+"px";
        if(e.style.width!==w)e.style.width=w;if(e.style.marginLeft!==ml)e.style.marginLeft=ml;
        L.cards.push({i:+e.dataset.slot,top:r===0,cx:xs[j]+Wc/2});});
    }
  }
  OPIS.hit=L.tops.map(t=>({i:t.slot,x:L.pts[t.slot][0],y:L.pts[t.slot][1]}));
  HANGAR.L=L;
  OPIS.gd={cv,cw,ch,nd:pw/cw,id};
}

/* ── кадр ── */
/* эллипс пола: точки круга (ox+A·cos, B·sin, zf) через вид пола (он неподвижен: водит носом корабль, не круг) */
function hgRing(L,v3,A,B,w,col,al,n){
  const P=L.pad,pt=f=>h3dStudioPt(L.m,v3,L.x,L.y,L.sc,P.cx+A*Math.cos(f),B*Math.sin(f),P.zf);
  let q0=pt(0);
  for(let j=1;j<=n;j++){const f=j/n*TAU,q=pt(f),fr=.35+.65*(.5+.5*Math.sin(f-TAU/2/n));   /* ближний край ярче */
    ovCap(q0[0],q0[1],q[0],q[1],w,col,al*fr);q0=q;}
}
/* пол сцены: свет сверху, неподвижная сетка ангара, поворотный круг с делениями и бегущей дугой, тень корабля */
function hgFloor(L,v3,t){
  const P=L.pad,sc=L.sc,ct=L.ct,cw=L.cw,ch=L.ch;
  const F={yaw:0,tilt:v3.tilt,persp:v3.persp},fp=(x,y)=>h3dStudioPt(L.m,F,L.x,L.y,sc,x,y,P.zf);
  const c=fp(P.cx,0);
  /* конус света от потолка: два мягких клина к кругу */
  const tw=cw*.16,bw=P.A*sc*1.15;
  ovQuad(c[0]+tw,0,c[0]+bw,c[1],c[0]-bw,c[1],c[0]-tw,0,"#ffe6c8",.07,1,0);
  ovEll(c[0],c[1],P.A*sc*1.5,P.B*sc*ct*2.1,-1,"#ffd9b0",.09);
  if(!L.flat){
    /* сетка пола: продольные и поперечные линии до края пятна, гаснут к концам */
    const gx=Math.max(4,P.A/3),gy=Math.max(3,P.B*.75);
    for(let j=-3;j<=3;j++){const yy=j*gy,a=fp(P.cx-P.A*2.2,yy),b=fp(P.cx,yy),d=fp(P.cx+P.A*2.2,yy),al=.05*(1-Math.abs(j)/4);
      ovQuad(a[0],a[1]-.6,b[0],b[1]-.6,b[0],b[1]+.6,a[0],a[1]+.6,HANG_INK,al,0,1);
      ovQuad(b[0],b[1]-.6,d[0],d[1]-.6,d[0],d[1]+.6,b[0],b[1]+.6,HANG_INK,al,1,0);}
    for(let j=-6;j<=6;j++){const xx=P.cx+j*gx,a=fp(xx,-gy*3.2),d=fp(xx,gy*3.2),b=fp(xx,0),al=.045*(1-Math.abs(j)/7);
      ovQuad(a[0]-.6,a[1],b[0]-.6,b[1],b[0]+.6,b[1],a[0]+.6,a[1],HANG_INK,al,0,1);
      ovQuad(b[0]-.6,b[1],d[0]-.6,d[1],d[0]+.6,d[1],b[0]+.6,b[1],HANG_INK,al,1,0);}
  }
  /* круг: тёмный диск с мягким краем (эллипс по четырём крайним точкам — перспектива делает круг яйцом),
     два обода, деления каждые 5°, крупные — через 30° */
  const qn=fp(P.cx,P.B),qf=fp(P.cx,-P.B),qe=fp(P.cx+P.A,0),qw=fp(P.cx-P.A,0);
  ovEll((qe[0]+qw[0])/2,(qn[1]+qf[1])/2,(qe[0]-qw[0])/2*1.05,Math.max(2,(qn[1]-qf[1])/2)*1.05,-.22,"#050607",.5);
  if(L.flat){ovEll(c[0],c[1],P.A*sc,P.B*sc,1.2,HANG_INK,.18);return;}
  hgRing(L,F,P.A,P.B,1.5,HANG_INK,.3,96);
  hgRing(L,F,P.A*.84,P.B*.84,1,HANG_INK,.12,72);
  const on=(f,r)=>fp(P.cx+P.A*r*Math.cos(f),P.B*r*Math.sin(f));
  for(let k=0;k<72;k++){const f=k/72*TAU,maj=k%6===0,q0=on(f,1.012),q1=on(f,maj?1.09:1.045);
    const fr=.4+.6*(.5+.5*Math.sin(f));
    ovCap(q0[0],q0[1],q1[0],q1[1],maj?1.5:1,maj?HANG_INK:"#a59d8f",(maj?.55:.3)*fr);}
  /* бегущая дуга — оранжевая, на внешнем ободе: «круг работает» */
  const f0=(t*.35)%TAU;
  for(let j=0;j<10;j++){const a=f0+j*.045,A1=on(a,1.03),B1=on(a+.045,1.03);
    ovCap(A1[0],A1[1],B1[0],B1[1],2,HANG_ACC,.15+.07*j);}
  /* тень корабля на круге: прочь от света (свет слева сверху) */
  const s=fp(P.cx+P.A*.05,P.B*.08);
  ovEll(s[0],s[1],P.A*sc*.86,P.B*sc*ct*.62,-.85,"#000",.55);
  ovEll(s[0],s[1],P.A*sc*.6,P.B*sc*ct*.36,-.8,"#000",.4);
}
/* рамка видоискателя по углам и подпись класса */
function hgFrame(L){
  const cw=L.cw,ch=L.ch,k=16,o=8,al=.32;
  for(const [x,y,sx,sy] of [[o,o,1,1],[cw-o,o,-1,1],[o,ch-o,1,-1],[cw-o,ch-o,-1,-1]])
    ovCap3(x+sx*k,y,x,y,x,y+sy*k,1.5,HANG_INK,al);
}
/* метка подвеса: занятая — залита цветом рода с номером, пустая — тёмная с «+»; st — 0 обычная, 1 выбрана,
   2 мишень (будущее, перенос), 3 приглушена (несут не её род) */
function hgMark(Q,x,y,i,kind,on,st,t){
  const col=PART_KINDS[kind].col,r=st===1||st===2?11:9,dim=st===3?.35:1;
  if(st===2){const pu=.5+.5*Math.sin(t*6);ovEll(x,y,r*2.6,r*2.6,-1,HANG_ACC,.25+.2*pu);ovEll(x,y,r+5+pu*3,r+5+pu*3,1.6,HANG_ACC,.9);}
  else if(st===1){ovEll(x,y,r*2.4,r*2.4,-1,"#fff",.16);ovEll(x,y,r+4.5,r+4.5,1.8,HANG_ACC,1);}
  ovEll(x,y,r+1.8,r+1.8,0,"#07080a",.8*dim);
  ovEll(x,y,r,r,0,on?col:"#15181c",(on?.95:.95)*dim);
  ovEll(x,y,r,r,1.6,on?"#0b0d10":col,dim);
  ovText(Q,x,y+.5,on?String(i+1):"+",HANG_FONT,on?"#0b0d10":col,"center","middle",dim,1);
}
function hgTick(){
  const D=OPIS.gd,cv=D&&D.cv,g=OPIS_G,L=HANGAR.L;
  /* только открытый стол на ОПИСИ: набор, что рисует ОПИСЬ в свой ящик и не закрывает, не должен
     рисовать сцену в кадрах чужих сцен (золотые кадры в -Full) */
  if(!L||!cv||!cv.isConnected||!OPIS.box||!tableOpenNow||tableTab!=="hold"||!GPU.on||!GPU.enc||!GPU.dev)return;
  if(L.phone&&OPIS.tab!=="ship")return;
  if(g.cv!==cv||g.dev!==GPU.dev){
    const cx=cv.getContext("webgpu");if(!cx)return;
    cx.configure({device:GPU.dev,format:GPU.fmt,alphaMode:"premultiplied"});
    g.cv=cv;g.cx=cx;g.dev=GPU.dev;g.T=ovTarget();}
  const t=wallMs()/1000,v3=HANGAR.v3,S=g.S;
  HANGAR.spin+=(HANGAR.spinT-HANGAR.spin)*.14;if(Math.abs(HANGAR.spin)<1e-4)HANGAR.spin=0;
  v3.tilt=L.tilt;v3.persp=L.pp;
  v3.yaw=L.yaw+(L.flat?0:HANGAR.sway*Math.sin(t*TAU/HANGAR.per)+HANGAR.spin);
  v3.gear=L.gear;v3.aim=L.flat?null:(s=>.45*Math.sin(t*.4+s*1.9));   /* турели оглядываются, каждая в свой час */
  S.v3=L.flat?null:v3;
  if(!hullStudio(S,D.id,D.cw,D.ch,D.nd,L.x,L.y,L.sc,G.mods.engine))return;
  /* метки на текущем курсе: и рисунку, и тычку */
  for(const h of OPIS.hit){const tp=L.tops.find(q=>q.slot===h.i);if(!tp)continue;
    const q=h3dStudioPt(L.m,v3,L.x,L.y,L.sc,tp.x,tp.y,tp.z+.3);h.x=h.tx=q[0];h.y=h.ty=q[1];}
  /* метки не лезут одна на другую: раздвинуть парами; к истинной точке — штрих (рисунок ниже) */
  const H=OPIS.hit,RM=25;
  for(let it=0;it<5;it++)for(let a=0;a<H.length;a++)for(let b=a+1;b<H.length;b++){
    const A=H[a],B=H[b];let dx=B.x-A.x,dy=B.y-A.y,d=Math.hypot(dx,dy);if(d>=RM)continue;
    if(d<.01){dx=1;dy=0;d=1;}
    const k=(RM-d)/2/d;A.x-=dx*k;A.y-=dy*k;B.x+=dx*k;B.y+=dy*k;}
  /* кого подсветить: выбранный, наведённый, будущее; при переносе — кто примет и куда ляжет */
  const slots=slotsOf(G.shipId),fm=G.fit[G.shipId]||{},dr=OPIS.drag&&OPIS.drag.payload;
  const hov=OPIS.hover&&OPIS.hover.t==="slot"?OPIS.hover.i:-1;
  const dp=dr&&(dr.t==="part"||dr.t==="slot")?partById(dr.id):null;
  let drop=-1;
  if(dp&&HANGAR.ptr&&HANGAR.rc&&HANGAR.rc.width){const rc=HANGAR.rc,mx=(HANGAR.ptr[0]-rc.left)*(L.cw/rc.width),my=(HANGAR.ptr[1]-rc.top)*(L.ch/rc.height);
    let bd=44;for(const h of OPIS.hit){if(slots[h.i]!==dp.kind)continue;const d=Math.hypot(h.x-mx,h.y-my);if(d<bd){bd=d;drop=h.i;}}}
  const stOf=i=>{
    if(dp){if(i===drop)return 2;return slots[i]===dp.kind?0:3;}
    if(i===L.sel||i===hov)return 1;
    if(i===L.aim)return 2;
    return 0;};
  const led=OVL.led;OVL.led=null;   /* номера меток — не текст экрана, в журнал не идут */
  try{ovInto(g.T,D.nd,()=>{
    hgFloor(L,v3,t);
    ovImage({tex:S.tex,view:S.view,dev:S.dev,inv:true},D.cw/2,D.ch/2,D.cw,D.ch,0,0,0,1,1,1);
    /* выноски: метка → колено над (под) корпусом → середина карточки на кромке сцены */
    for(const c of L.cards){const h=OPIS.hit.find(q=>q.i===c.i);if(!h)continue;
      const st=stOf(c.i),col=st===1||st===2?HANG_ACC:PART_KINDS[slots[c.i]].col,al=st===3?.25:(st?1:.62);
      const ky=c.top?Math.min(L.kTop,h.y-10):Math.max(L.kBot,h.y+10),ey=c.top?0:L.ch;
      ovCap3(h.x,h.y,h.x,ky,c.cx,ey,3,"#000",.35*al);
      ovCap3(h.x,h.y,h.x,ky,c.cx,ey,st===1||st===2?1.6:1.1,col,al);
      ovCap(c.cx-7,c.top?1:L.ch-1,c.cx+7,c.top?1:L.ch-1,2,col,al);}
    for(const h of OPIS.hit)if(slots[h.i]&&Math.hypot(h.x-h.tx,h.y-h.ty)>3){
      ovCap(h.tx,h.ty,h.x,h.y,1.2,HANG_INK,.55);ovEll(h.tx,h.ty,2.6,2.6,0,HANG_INK,.8);}
    for(const h of OPIS.hit)if(slots[h.i])hgMark(g.T.uq,h.x,h.y,h.i,slots[h.i],fm[h.i]!=null,stOf(h.i),t);
    hgFrame(L);
  });}finally{OVL.led=led;}
  ovPass(g.T,g.cx.getCurrentTexture().createView(),cv.width,cv.height,[g.T.uq],"opis");
  g.n++;
}
