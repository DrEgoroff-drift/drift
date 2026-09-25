/* ══════════════ барахолка, которая помнит (M463, DESIGN-life) ══════════════
   В тихих системах державы с поясом — узел пришвартованных остовов у пояса:
   тенты, лампочки на проводах. Три ряда:
     ВАШЕ — что вы разобрали в ОПИСИ (G.thrown, 12 последних) лежит на
       прилавке втрое дороже: «ношеная, один хозяин»;
     КОРПУСА СО ШРАМАМИ — два остова, дёшево, со шрамами (M482);
     РАЗНОЕ — одна вещь наугад, дешевле верфи.
   Ряд меняется раз в смену; купленное в этой смене помечено (G.bazBought). */
const BAZ_THROWN_MAX=12,BAZ_MUL=3;
function bazHere(){
  const sys=G.sys;if(!sys||!sys.belt)return null;
  const by=(typeof stampOwnerAt==="function")?stampOwnerAt(G.sx,G.sy):null;
  if(!by||sysDanger(G.sx,G.sy)>.35||hashi(G.sx,G.sy,0xBA2A)%2)return null;
  /* внутри пояса, в 300 от него: полоса входа в пояс ±90 не должна перекрыть прилавки */
  const a=(hashi(G.sx,G.sy,0xBA2B)%628)/100,R=Math.max(400,sys.belt.orbit-300);
  return {x:Math.cos(a)*R,y:Math.sin(a)*R,a,by,seed:hashi(G.sx,G.sy,0xBA2C)>>>0};
}
function bazBucket(){return Math.floor(now()/HOLD_SHIFT);}
function bazBought(){
  const b=bazBucket();
  if(!G.bazBought||G.bazBought.b!==b)G.bazBought={b,k:{}};
  return G.bazBought.k;
}
/* ОПИСЬ: разобранное запоминается (зовёт opisScrap) */
function bazThrow(p){
  if(!p||typeof packPart!=="function")return;
  if(!Array.isArray(G.thrown))G.thrown=[];
  G.thrown.unshift(packPart(p));
  if(G.thrown.length>BAZ_THROWN_MAX)G.thrown.length=BAZ_THROWN_MAX;
}
function bazPartBase(p){return 320+(p.tier|0)*(p.tier|0)*460+(p.aff?p.aff.length:0)*180;}
/* ряды прилавка — выводятся из места и смены */
function bazLots(B){
  const out=[],b=bazBucket(),K=bazBought();
  (G.thrown||[]).forEach((pk,i)=>{const p=unpackPart(pk);if(p)out.push({k:"t"+i,kind:"thrown",i,part:p,
    price:Math.round(bazPartBase(p)*BAZ_MUL/10)*10,note:"ношеная, один хозяин"});});
  for(let i=0;i<2;i++){
    const seed=hashi(B.seed,b,i+1)>>>0,sh=genUniqueShip(seed);
    sh.scars=scarsRoll(hashi(seed,0x5CA2,4),1+hashi(seed,0x5CA2,5)%3);
    sh.cls="остов с барахолки";sh.note="стоял у пояса, швартовы в узлах. Шрамы на виду — поэтому и дёшево.";
    out.push({k:"h"+seed,kind:"hull",seed,ship:sh,price:Math.round(sh.price*.55*scarPriceMul(sh)/50)*50,note:sh.scars.map(k=>SCAR_KIND[k].ru).join(", ")});
  }
  const odd=genPart(hashi(B.seed,b,0x0DD)>>>0,1+hashi(B.seed,b,0x0DE)%3);
  out.push({k:"o"+b,kind:"odd",part:odd,price:Math.round(bazPartBase(odd)*.7/10)*10,note:"откуда — не спрашивайте"});
  return out.map(L=>(L.sold=!!K[L.k],L));
}
function bazBuy(L){
  const K=bazBought();
  if(!L||K[L.k]||G.credits<L.price)return false;
  if(L.kind==="hull"){
    const id="bz"+L.seed;G.uniqueShips[id]=L.ship;G.owned[id]=true;
  }else{
    addPart(L.part);
    if(L.kind==="thrown")G.thrown.splice(L.i,1);
  }
  G.credits-=L.price;
  if(L.kind!=="thrown")K[L.k]=1;
  logAdd("money","Барахолка: "+(L.kind==="hull"?"остов «"+L.ship.ru+"» — в ангаре":L.part.name)+" · −"+L.price.toLocaleString("ru")+" кр"+
    (L.kind==="thrown"?" · «ваша же? бывает»":""));
  return true;
}
/* ── рисунок (D20, 18.09) ──
   Были плоские прямоугольники с треугольными тентами. Теперь остовы — настоящие
   корпуса из таблицы, мёртвые: без огней, притемнённые, под своими углами, как
   их пришвартовали. Между ними провисшие тенты из ткани (дуга, а не треугольник)
   и гирлянды, которые качает: каждая лампочка на своём проводе.
   На видеокарте (25.09, «чистый полёт»): остов с плёнкой — выпечка (08ca gpuBake, одна
   на корпус), тенты, шесты, провода и лампочки — фигурами прохода сцены, вывеска —
   слоем подписей. Ходовые огни и бегущая строка остову не положены — в выпечке их нет;
   тлеющее сопло — средней яркостью, без дрожи (под плёнкой её и так не видно) */
const BAZ_HULLS=["strizh","skat"];
const BAZ_BAKE=new Map();   // id|масштаб → выпечка остова (эфемерное, не в сейве)
const BAZ_CUT=[[176,80,60],[60,122,176],[192,160,64],[90,154,90],[154,90,154]];
function bazHulk(id,dk){
  /* мастер — на крупнейший остов (s 1.6, sc .58) шагом в четверть октавы; мельче — мипы */
  const h=hullOf(id),sb=Math.pow(2,Math.ceil(Math.log2(.58*1.6*dk)*4)/4),side=Math.ceil(hullGpuE(h)*2*sb),key=id+"|"+sb;
  if(!BAZ_BAKE.has(key)&&BAZ_BAKE.size>=12){const k=BAZ_BAKE.keys().next().value;gpuBakeDrop(BAZ_BAKE.get(k));BAZ_BAKE.delete(k);}
  const B=gpuBaked(BAZ_BAKE,key,side,side,g=>{g.setTransform(sb,0,0,sb,side/2,side/2);
    for(const e of h.eng){
      if(h.lux){g.fillStyle="rgba(8,12,18,.9)";g.beginPath();g.arc(e.x+e.r*.1,e.y,e.r*.6,0,TAU);g.fill();
        g.strokeStyle=rgba(mixc(luxPal(h).trim,[255,244,214],.3),.9);g.lineWidth=.4;g.beginPath();g.arc(e.x+e.r*.1,e.y,e.r*.6,0,TAU);g.stroke();
        g.fillStyle="rgba(170,215,255,.21)";g.beginPath();g.arc(e.x+e.r*.1,e.y,e.r*.3,0,TAU);g.fill();}
      else{g.fillStyle="rgba(255,140,70,.26)";g.beginPath();g.arc(e.x+e.r*.1,e.y,e.r*.42,0,TAU);g.fill();}}
    hullPart1(h,id,0,false);hullPart2(h);hullPart3(h,id);
    /* мёртвый: тёмная плёнка по силуэту, чтобы не читался живым бортом. Утоплена на 5 %:
       полоска корпуса из-под неё — обвод (тело, обвод, один свет). В 2D его давала
       случайно сглаженная кромка плёнки, на дальнем плане это был весь свет силуэта */
    g.scale(.95,.95);tracePoly(h.poly);g.fillStyle="rgba(20,18,16,.6)";g.fill();});
  return B&&{B,E:side/(2*sb)};
}
/* вывеска — часть сцены, не подпись: выпечка букв (ss 2, пиксели устройства), блум сцены
   даёт ей ореол, как 2D-тексту на #c. Ключ — кегль и DPR */
const BAZ_SIGN=new Map(),BAZ_SIGN_T="БАРАХОЛКА";
function bazSign(F){
  const d=DPR;
  return bakeKeep(BAZ_SIGN,F+"|"+d,4,()=>{
    const fb="bold "+F*d+"px ui-monospace,monospace",tw=Math.ceil(gcMeasure(fb,BAZ_SIGN_T).width),pad=Math.ceil(2*d);
    const base=pad+Math.ceil(F*d*.82),Hd=base+Math.ceil(F*d*.28)+pad,Wd=tw+pad*2;
    const B=gpuBake(Wd,Hd,g=>{g.font=fb;g.textAlign="left";g.textBaseline="alphabetic";g.fillStyle="rgba(240,210,160,.85)";g.fillText(BAZ_SIGN_T,pad,base);},{mips:false});
    return B&&{B,ax:pad+tw/2,ay:base,w:Wd/d,h:Hd/d,drop(){gpuBakeDrop(B);}};
  });
}
function drawBazaar(zx,zy,Z){
  const B=bazHere();if(!B)return;
  const x=zx(B.x),y=zy(B.y),s=clamp(Z,.5,1.6);
  if(x<-200||x>W+200||y<-200||y>H+200)return;
  const pass=gpuScene();if(!pass)return;
  const r=rng(B.seed),ids=Object.keys(SHIPS),dk=GPU.bw/W,lod=Math.pow(2,HG_BODY_LOD);
  const hulks=[];
  /* кривая Безье второго порядка в точке t */
  const qb=(a,c,b,t)=>(1-t)*(1-t)*a+2*(1-t)*t*c+t*t*b;
  for(let i=0;i<5;i++){
    const hx=x+(r()-.5)*96*s,hy=y+(r()-.5)*64*s,ha=r()*TAU,id=ids[Math.floor(r()*ids.length)]||BAZ_HULLS[0];
    const hl=hullOf(id),sc=(.42+r()*.16)*s,cs=Math.cos(ha)*sc,sn=Math.sin(ha)*sc,c0=(hl.nose+hl.tail)*.5;
    hulks.push([hx,hy,hl.len*sc,ha]);
    /* точка остова (px,py) → экран: сдвиг к середине корпуса, поворот, масштаб */
    const P=(px,py)=>[hx+(px-c0)*cs-py*sn,hy+(px-c0)*sn+py*cs];
    const [ox,oy]=P(0,0),K=bazHulk(id,dk);
    if(K)gpuImage(pass,K.B,[{x:ox,y:oy,w:K.E*2*sc,h:K.E*2*sc,rot:ha}],{lod});
    if(GPU.sepH.length<8){if(!hl._R){let q=0;for(const p of hl.poly)q=Math.max(q,Math.hypot(p[0],p[1]));hl._R=q*1.3;}
      GPU.sepH.push([ox,oy,hl._R*sc]);}
    /* тент над остовом: два шеста по бортам и провисшая ткань между ними */
    const tc=BAZ_CUT[i];
    const tx0=hl.tail+hl.len*.3,tx1=hl.tail+hl.len*.7,tm=(tx0+tx1)/2,ty=-hl.halfW*1.6,ty2=ty-hl.halfW*.35,sag=hl.halfW*.5+Math.sin(G.t*.02+i)*1.5;
    const SH=[],pw=.6*sc,ow=.3*sc;
    for(const tx of [tx0,tx1]){const a=P(tx,-hl.halfW*.6),b=P(tx,ty);SH.push([2,a[0],a[1],b[0],b[1],pw,0,120,110,96,.9]);}
    /* швов — по длине тента на экране (~3 px): у капсул контура круглые концы, частые швы
       на мелком плане ложатся друг на друга и темнят кромку */
    const N=clamp(Math.round((tx1-tx0)*sc/3),2,10),A=[],Bt=[];
    for(let j=0;j<=N;j++){const t=j/N;A.push(P(qb(tx0,tm,tx1,t),qb(ty,ty+sag,ty,t)));Bt.push(P(qb(tx0,tm,tx1,t),qb(ty2,ty2+sag*.7,ty2,t)));}
    /* полосы ткани: внутренние швы жёсткие — ни щели, ни двойной кромки */
    for(let j=0;j<N;j++)gpuQuad(SH,A[j],A[j+1],Bt[j+1],Bt[j],[tc[0],tc[1],tc[2],.85],(j<N-1?2:0)|(j>0?8:0));
    const O=A.concat(Bt.slice().reverse(),[A[0]]);
    for(let j=0;j<O.length-1;j++)SH.push([2,O[j][0],O[j][1],O[j+1][0],O[j+1][1],ow,0,0,0,0,.35]);
    gpuShapes(pass,SH);
  }
  /* гирлянды: провод дугой, лампочки на коротких подвесах, качаются не в лад */
  const WR=[],LT=[];
  for(let i=0;i<hulks.length-1;i++){
    const [ax,ay]=hulks[i],[bx,by]=hulks[i+1],mx=(ax+bx)/2,my=(ay+by)/2+12*s;
    let p=[ax,ay-16*s];
    for(let j=1;j<=16;j++){const t=j/16,q=[qb(ax,mx,bx,t),qb(ay-16*s,my,by-16*s,t)];WR.push([2,p[0],p[1],q[0],q[1],.4,0,60,56,50,.9]);p=q;}
    for(let k=1;k<6;k++){const t=k/6,lx=qb(ax,mx,bx,t),ly=qb(ay-16*s,my,by-16*s,t);
      const sw=Math.sin(G.t*.045+i*1.3+k*.9)*1.6*s,on=(hashi(i,k,(G.t/40|0))%9)?1:.25;
      WR.push([2,lx,ly,lx+sw,ly+4*s,.4,0,60,56,50,.9]);
      /* лампочка мельче .7 px устройства: covDisc растянул бы её на круг .7 и погасил пик —
         квадрат той же площади покрытие считает точно, как растр */
      const br=.9*s,bh=br*.886;
      LT.push(br*dk<.7?[0,lx+sw-bh,ly+4.6*s-bh,lx+sw+bh,ly+4.6*s+bh,0,0,255,170+k*12,110,.8*on]:[1,lx+sw,ly+4.6*s,br,0,0,0,255,170+k*12,110,.8*on]);
      glowCone(LT,lx+sw,ly+4.6*s,5*s,[255,190,120],.14*on);}   /* ореол — конус градиента (17e) */
  }
  gpuShapes(pass,WR);gpuShapes(pass,LT,{blend:"add"});
  /* середина строки — x, базовая линия — y−48s; место на целый пиксель устройства */
  const N=bazSign(Math.round(8*s));
  if(N){const d=DPR,l=Math.round((x-N.ax/d)*d)/d,t=Math.round((y-48*s-N.ay/d)*d)/d;
    gpuImage(pass,N.B,[{x:l+N.w/2,y:t+N.h/2,w:N.w,h:N.h}]);}
}
function bazInteract(sh){
  const B=bazHere();if(!B)return false;
  if(Math.hypot(sh.x-B.x,sh.y-B.y)>180){if(document.getElementById("bazWin"))bazClose();return false;}
  const shown=cue("БАРАХОЛКА · ОСТОВЫ У ПОЯСА\nДЕЙСТВИЕ — К ПРИЛАВКАМ",CUE_ACT);
  if(shown&&actEdge)bazOpen(B);
  return true;
}
function bazClose(){const w=document.getElementById("bazWin");if(w)w.remove();}
function bazOpen(B){
  bazClose();
  const w=document.createElement("div");w.id="bazWin";
  const L=bazLots(B);
  let h="<div class='bz-h'>БАРАХОЛКА<s>ряд меняется раз в смену · торг не уместен</s></div>";
  /* прилавок — таблица, не список (D20): три колонки, шапка, строки через одну темнее */
  const sec=(t,kind)=>{const rows=L.filter(x=>x.kind===kind);if(!rows.length)return;
    h+="<div class='bz-sec'>"+t+"</div><div class='bz-tab'><div class='bz-th'><span>что · откуда · что с ним</span><span>цена</span></div>";
    for(const x of rows){const nm=x.kind==="hull"?"«"+x.ship.ru+"» · "+(HULL_CLASS[hullClassOf("bz"+x.seed,x.ship)]||{}).ru:x.part.name;
      h+="<div class='bz-row"+(x.sold?" sold":"")+"'><b>"+nm+"</b><s>"+x.note+"</s><button class='act' data-k='"+x.k+"'"+(x.sold||G.credits<x.price?" disabled":"")+">"+
        (x.sold?"ПРОДАНО":x.price.toLocaleString("ru")+" КР")+"</button></div>";}
    h+="</div>";
  };
  sec("ВАШЕ · ЧТО ВЫ РАЗОБРАЛИ","thrown");
  sec("КОРПУСА СО ШРАМАМИ","hull");
  sec("РАЗНОЕ","odd");
  h+="<button class='act bz-x'>ОТОЙТИ</button>";
  w.innerHTML=h;document.body.appendChild(w);
  w.querySelector(".bz-x").onclick=bazClose;
  w.querySelectorAll("button[data-k]").forEach(b=>b.onclick=()=>{const x=L.find(y=>y.k===b.dataset.k);if(bazBuy(x)){bazOpen(B);if(typeof saveGame==="function")saveGame(true);}});
}
