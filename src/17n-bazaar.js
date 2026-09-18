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
function drawBazaar(zx,zy,Z){
  const B=bazHere();if(!B)return;
  const x=zx(B.x),y=zy(B.y),s=clamp(Z,.5,1.6);
  if(x<-200||x>W+200||y<-200||y>H+200)return;
  const r=rng(B.seed);
  /* остовы, сбитые в узел: тёмные тела под углами */
  const hulks=[];
  for(let i=0;i<5;i++){
    const hx=x+(r()-.5)*90*s,hy=y+(r()-.5)*60*s,ha=r()*TAU,hl=(18+r()*16)*s,hw=(6+r()*5)*s;
    hulks.push([hx,hy]);
    ctx.save();ctx.translate(hx,hy);ctx.rotate(ha);
    ctx.fillStyle="#2a2724";ctx.strokeStyle="rgba(0,0,0,.7)";ctx.lineWidth=1;
    ctx.fillRect(-hl/2,-hw/2,hl,hw);ctx.strokeRect(-hl/2,-hw/2,hl,hw);
    /* тент над остовом: треугольник цветной ткани */
    const tc=["#b0503c","#3c7ab0","#c0a040","#5a9a5a","#9a5a9a"][i];
    ctx.fillStyle=tc;ctx.beginPath();ctx.moveTo(-hl*.3,-hw/2);ctx.lineTo(hl*.3,-hw/2);ctx.lineTo(0,-hw/2-7*s);ctx.closePath();ctx.fill();
    ctx.restore();
  }
  /* лампочки на проводах между остовами: провисшая дуга и огоньки */
  ctx.strokeStyle="rgba(60,56,50,.9)";ctx.lineWidth=.8;
  for(let i=0;i<hulks.length-1;i++){
    const [ax,ay]=hulks[i],[bx,by]=hulks[i+1],mx=(ax+bx)/2,my=(ay+by)/2+10*s;
    ctx.beginPath();ctx.moveTo(ax,ay);ctx.quadraticCurveTo(mx,my,bx,by);ctx.stroke();
    ctx.save();ctx.globalCompositeOperation="lighter";
    for(let k=1;k<5;k++){const t=k/5,lx=(1-t)*(1-t)*ax+2*(1-t)*t*mx+t*t*bx,ly=(1-t)*(1-t)*ay+2*(1-t)*t*my+t*t*by;
      const on=(hashi(i,k,(G.t/40|0))%7)?1:.3;
      ctx.fillStyle="rgba(255,"+(180+k*15)+",120,"+(.8*on)+")";ctx.beginPath();ctx.arc(lx,ly,1.6*s,0,TAU);ctx.fill();}
    ctx.restore();
  }
  ctx.font="bold "+Math.round(8*s)+"px ui-monospace,monospace";ctx.textAlign="center";
  ctx.fillStyle="rgba(240,210,160,.85)";ctx.fillText("БАРАХОЛКА",x,y-44*s);
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
  const sec=(t,kind)=>{const rows=L.filter(x=>x.kind===kind);if(!rows.length)return;
    h+="<div class='bz-sec'>"+t+"</div>";
    for(const x of rows){const nm=x.kind==="hull"?"«"+x.ship.ru+"» · "+(HULL_CLASS[hullClassOf("bz"+x.seed,x.ship)]||{}).ru:x.part.name;
      h+="<div class='bz-row'><b>"+nm+"</b><s>"+x.note+"</s><button class='act' data-k='"+x.k+"'"+(x.sold||G.credits<x.price?" disabled":"")+">"+
        (x.sold?"ПРОДАНО":x.price.toLocaleString("ru")+" КР")+"</button></div>";}
  };
  sec("ВАШЕ · ЧТО ВЫ РАЗОБРАЛИ","thrown");
  sec("КОРПУСА СО ШРАМАМИ","hull");
  sec("РАЗНОЕ","odd");
  h+="<button class='act bz-x'>ОТОЙТИ</button>";
  w.innerHTML=h;document.body.appendChild(w);
  w.querySelector(".bz-x").onclick=bazClose;
  w.querySelectorAll("button[data-k]").forEach(b=>b.onclick=()=>{const x=L.find(y=>y.k===b.dataset.k);if(bazBuy(x)){bazOpen(B);if(typeof saveGame==="function")saveGame(true);}});
}
