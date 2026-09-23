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
/* лодка (дизайн-проход 23.09): тело, обвод, один свет. Ржавая кайма и заплата
   на заклёпках — «утлая»; окно раздачи — ровный тёплый свет, дышит плавно (не
   мигает); пар из трубы тянется назад — единственное, что движется; гирлянда
   по борту; вывеска — доска на двух верёвках, красным по крему, от руки */
function drawCheburek(zx,zy,Z){
  const C=chebHere();if(!C)return;
  const x=zx(C.x),y=zy(C.y);if(x<-80||x>W+80||y<-80||y>H+80)return;
  const s=clamp(Z,.6,1.5),br=.86+.1*Math.sin(G.t*.045);
  ctx.save();ctx.translate(x,y);ctx.rotate(C.a);ctx.scale(s,s);
  ctx.fillStyle="#4a3a2e";ctx.strokeStyle="rgba(0,0,0,.7)";ctx.lineWidth=.9;
  ctx.beginPath();ctx.moveTo(16,0);ctx.lineTo(10,-8);ctx.lineTo(-14,-8);ctx.lineTo(-16,0);ctx.lineTo(-14,8);ctx.lineTo(10,8);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.save();ctx.clip();
  ctx.strokeStyle="rgba(150,64,40,.85)";ctx.lineWidth=2.4;ctx.stroke();                 /* ржавая кайма */
  ctx.fillStyle="#5d4a38";ctx.fillRect(-12,2.5,6,3.6);                                    /* заплата */
  ctx.fillStyle="rgba(220,200,170,.55)";for(const [px,py] of [[-11.4,3],[-6.6,3],[-11.4,5.6],[-6.6,5.6]]){ctx.beginPath();ctx.arc(px,py,.35,0,TAU);ctx.fill();}
  ctx.restore();
  ctx.fillStyle="rgba(255,255,255,.08)";ctx.fillRect(-13,-7.4,22,1);                     /* кант к свету */
  ctx.fillStyle="#6b5645";ctx.fillRect(-9,-5,13,10);                                      /* будка */
  ctx.fillStyle="rgba(255,255,255,.1)";ctx.fillRect(-9,-5,13,1.2);
  const gw=ctx.createRadialGradient(-3.5,0,0,-3.5,0,12);
  gw.addColorStop(0,"rgba(255,196,120,"+(.3*br).toFixed(3)+")");gw.addColorStop(1,"rgba(255,196,120,0)");
  ctx.globalCompositeOperation="lighter";ctx.fillStyle=gw;ctx.fillRect(-16,-12,25,24);ctx.globalCompositeOperation="source-over";
  ctx.fillStyle="rgba(255,210,140,"+br.toFixed(3)+")";ctx.fillRect(-7,-3.2,7,6.4);        /* окно раздачи */
  ctx.fillStyle="rgba(60,40,24,.6)";ctx.fillRect(-7,-.4,7,.8);
  ctx.fillStyle="#2a221c";ctx.beginPath();ctx.arc(7,-4,1.7,0,TAU);ctx.fill();            /* труба */
  for(let i=0;i<4;i++){                                                                   /* пар — назад и в сторону */
    const u=((G.t*.6+i*25)%100)/100,px=7-u*24,py=-4-u*7+Math.sin(u*6+i)*1.2,r=1.4+u*5;
    ctx.fillStyle="rgba(230,226,218,"+(.32*(1-u)).toFixed(3)+")";ctx.beginPath();ctx.arc(px,py,r,0,TAU);ctx.fill();
  }
  ctx.fillStyle="rgba(255,214,150,.9)";for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(-12+i*5,7,.8,0,TAU);ctx.fill();}   /* гирлянда */
  ctx.strokeStyle="rgba(40,30,20,.6)";ctx.lineWidth=.3;ctx.beginPath();for(let i=0;i<5;i++){const qx=-12+i*5;i?ctx.quadraticCurveTo(qx-2.5,7.9,qx,7):ctx.moveTo(qx,7);}ctx.stroke();
  const fl=.6+.4*Math.sin(G.t*.2);
  ctx.fillStyle="rgba(255,150,70,"+(.55+.3*fl).toFixed(3)+")";ctx.beginPath();ctx.arc(-17,0,1.6+fl*.6,0,TAU);ctx.fill();   /* сопло */
  ctx.restore();
  /* вывеска — в экранных координатах, чтобы читалась при любом курсе лодки */
  const k=Math.max(1,s)*(typeof UIK==="number"?UIK:1),by=y-20*s-8*k;
  ctx.font="bold "+Math.round(8*k)+"px ui-monospace,monospace";ctx.textAlign="center";ctx.textBaseline="middle";
  const tw=ctx.measureText("ЧЕБУРЕКИ").width+12*k;
  ctx.strokeStyle="rgba(200,190,170,.45)";ctx.lineWidth=.8;ctx.beginPath();
  ctx.moveTo(x-tw*.3,by+7.5*k);ctx.lineTo(x-4*s,y-6*s);ctx.moveTo(x+tw*.3,by+7.5*k);ctx.lineTo(x+4*s,y-6*s);ctx.stroke();
  /* без поворота: детекторы и глаз читают доску там, где она стоит */
  ctx.fillStyle="rgba(0,0,0,.45)";ctx.fillRect(x-tw/2+1.5,by-7.5*k+1.5,tw,15*k);
  ctx.fillStyle="#efe3c6";ctx.fillRect(x-tw/2,by-7.5*k,tw,15*k);
  ctx.fillStyle="#b8322a";ctx.fillText("ЧЕБУРЕКИ",x,by+.5);
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
