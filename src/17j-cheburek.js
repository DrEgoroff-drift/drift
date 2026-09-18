/* ══════════════ «Чебуречная» — лодка на подъезде (M462, DESIGN-life §3.4) ══════════════
   Утлая баржа ходит вдоль полосы подъезда туда-обратно и окликает всех
   подряд, в любой час: «Чебуреки! Горячие!». Продаёт то, что едят в этой
   земле (POWERS[хозяин].food), — и к еде прилагается слух: за столом люди
   говорят. Полезная выдача — слух и строка в тетради; никто не обязан брать.

   Лодка есть не в каждой системе: только у людной станции и по зерну через
   одну. Положение — функция времени, ничего не хранится. */
const CHEB_PRICE=4,CHEB_R=200;
function chebHere(){
  const sys=G.sys;if(!sys||!sys.station||typeof sysLane!=="function")return null;
  const P=sysLane(sys);if(!P||P.life<.35||(hashi(sys.sx,sys.sy,0xC4EB)&1))return null;
  /* ходит по оси полосы между первой парой бакенов и входом, медленно */
  const u=.5-.5*Math.cos(G.t/60*TAU/70+P.ph*TAU),d=180+(P.L-420)*u;
  const dir=Math.sin(G.t/60*TAU/70+P.ph*TAU)>=0?1:-1;
  return {x:P.st.x+P.ux*d+P.uy*38,y:P.st.y+P.uy*d-P.ux*38,a:Math.atan2(P.uy,P.ux)+(dir>0?0:Math.PI),by:P.by};
}
function drawCheburek(zx,zy,Z){
  const C=chebHere();if(!C)return;
  const x=zx(C.x),y=zy(C.y);if(x<-60||x>W+60||y<-60||y>H+60)return;
  const s=clamp(Z,.6,1.5);
  ctx.save();ctx.translate(x,y);ctx.rotate(C.a);ctx.scale(s,s);
  ctx.fillStyle="#3a3028";ctx.strokeStyle="rgba(0,0,0,.6)";ctx.lineWidth=.8;
  ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(7,-6);ctx.lineTo(-11,-6);ctx.lineTo(-12,0);ctx.lineTo(-11,6);ctx.lineTo(7,6);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle="#57463a";ctx.fillRect(-7,-4,10,8);                                   /* будка */
  ctx.fillStyle=Math.sin(G.t*.07)>-.6?"rgba(255,208,130,.95)":"rgba(255,208,130,.5)";   /* окно раздачи */
  ctx.fillRect(-5,-2.5,6,5);
  ctx.fillStyle="rgba(255,150,70,.9)";ctx.beginPath();ctx.arc(-13,0,1.6,0,TAU);ctx.fill();   /* сопло */
  ctx.restore();
  ctx.fillStyle="rgba(255,196,120,.8)";ctx.font=uiFont(8);ctx.textAlign="center";
  ctx.fillText("ЧЕБУРЕКИ",x,y-14*s);
}
function chebInteract(sh){
  const C=chebHere();if(!C)return false;
  if(Math.hypot(sh.x-C.x,sh.y-C.y)>CHEB_R)return false;
  const shown=cue("«ЧЕБУРЕЧНАЯ» · ЧЕБУРЕКИ! ГОРЯЧИЕ!\nДЕЙСТВИЕ — ВЗЯТЬ · "+CHEB_PRICE+" КР",CUE_ACT);
  if(shown&&actEdge){
    if(G.credits<CHEB_PRICE){say("«В долг не кормим. Хотя… ладно, держи.»",110);}
    else G.credits-=CHEB_PRICE;
    const P=(typeof POWERS!=="undefined"&&POWERS[C.by])||null;
    const L=(typeof rumoursHere==="function")?rumoursHere():[];
    const rum=L.length?"говорят, есть "+L[Math.floor(rnd()*L.length)].short:"сегодня ничего не говорят, жуют молча";
    logAdd("good","«Чебуречная»: "+(P?P.food:"чебурек, горячий")+" · за столом: "+rum);
    peopleLine(rum,"за столом у «Чебуречной»",true);
  }
  return true;
}
