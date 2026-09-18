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
   и гирлянды, которые качает: каждая лампочка на своём проводе. */
const BAZ_HULLS=["strizh","skat"];
function drawBazaar(zx,zy,Z){
  const B=bazHere();if(!B)return;
  const x=zx(B.x),y=zy(B.y),s=clamp(Z,.5,1.6);
  if(x<-200||x>W+200||y<-200||y>H+200)return;
  const r=rng(B.seed),ids=Object.keys(SHIPS);
  const hulks=[];
  for(let i=0;i<5;i++){
    const hx=x+(r()-.5)*96*s,hy=y+(r()-.5)*64*s,ha=r()*TAU,id=ids[Math.floor(r()*ids.length)]||BAZ_HULLS[0];
    const hl=hullOf(id),sc=(.42+r()*.16)*s;
    hulks.push([hx,hy,hl.len*sc,ha]);
    ctx.save();ctx.translate(hx,hy);ctx.rotate(ha);ctx.scale(sc,sc);
    ctx.translate(-(hl.nose+hl.tail)*.5,0);
    drawHull(id,false,false,0);
    /* мёртвый: тёмная плёнка по силуэту, чтобы не читался живым бортом */
    tracePoly(hl.poly);ctx.fillStyle="rgba(20,18,16,.6)";ctx.fill();
    /* тент над остовом: два шеста по бортам и провисшая ткань между ними */
    const tc=["rgba(176,80,60,.85)","rgba(60,122,176,.85)","rgba(192,160,64,.85)","rgba(90,154,90,.85)","rgba(154,90,154,.85)"][i];
    const tx0=hl.tail+hl.len*.3,tx1=hl.tail+hl.len*.7,ty=-hl.halfW*1.6,sag=hl.halfW*.5+Math.sin(G.t*.02+i)*1.5;
    ctx.strokeStyle="rgba(120,110,96,.9)";ctx.lineWidth=1.2;
    ctx.beginPath();ctx.moveTo(tx0,-hl.halfW*.6);ctx.lineTo(tx0,ty);ctx.moveTo(tx1,-hl.halfW*.6);ctx.lineTo(tx1,ty);ctx.stroke();
    ctx.fillStyle=tc;ctx.beginPath();ctx.moveTo(tx0,ty);ctx.quadraticCurveTo((tx0+tx1)/2,ty+sag,tx1,ty);
    ctx.lineTo(tx1,ty-hl.halfW*.35);ctx.quadraticCurveTo((tx0+tx1)/2,ty-hl.halfW*.35+sag*.7,tx0,ty-hl.halfW*.35);ctx.closePath();ctx.fill();
    ctx.strokeStyle="rgba(0,0,0,.35)";ctx.lineWidth=.6;ctx.stroke();
    ctx.restore();
  }
  /* гирлянды: провод дугой, лампочки на коротких подвесах, качаются не в лад */
  ctx.strokeStyle="rgba(60,56,50,.9)";ctx.lineWidth=.8;
  for(let i=0;i<hulks.length-1;i++){
    const [ax,ay]=hulks[i],[bx,by]=hulks[i+1],mx=(ax+bx)/2,my=(ay+by)/2+12*s;
    ctx.beginPath();ctx.moveTo(ax,ay-16*s);ctx.quadraticCurveTo(mx,my,bx,by-16*s);ctx.stroke();
    for(let k=1;k<6;k++){const t=k/6,lx=(1-t)*(1-t)*ax+2*(1-t)*t*mx+t*t*bx,ly=(1-t)*(1-t)*(ay-16*s)+2*(1-t)*t*my+t*t*(by-16*s);
      const sw=Math.sin(G.t*.045+i*1.3+k*.9)*1.6*s,on=(hashi(i,k,(G.t/40|0))%9)?1:.25;
      ctx.beginPath();ctx.moveTo(lx,ly);ctx.lineTo(lx+sw,ly+4*s);ctx.stroke();
      ctx.save();ctx.globalCompositeOperation="lighter";
      ctx.fillStyle="rgba(255,"+(170+k*12)+",110,"+(.8*on)+")";ctx.beginPath();ctx.arc(lx+sw,ly+4.6*s,.9*s,0,TAU);ctx.fill();
      const g=ctx.createRadialGradient(lx+sw,ly+4.6*s,0,lx+sw,ly+4.6*s,5*s);g.addColorStop(0,"rgba(255,190,120,"+(.14*on)+")");g.addColorStop(1,"rgba(255,190,120,0)");
      ctx.fillStyle=g;ctx.fillRect(lx+sw-7*s,ly-3*s,14*s,14*s);ctx.restore();}
  }
  ctx.font="bold "+Math.round(8*s)+"px ui-monospace,monospace";ctx.textAlign="center";
  ctx.fillStyle="rgba(240,210,160,.85)";ctx.fillText("БАРАХОЛКА",x,y-48*s);
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
