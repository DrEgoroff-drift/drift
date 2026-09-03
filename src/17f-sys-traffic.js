/* ══════════════ трафик системы: чужие машины, которым тут есть дело (M309) ══════════════ */
/* Система на 79 % пуста по прибору, и пустота честная: кроме своего корабля и
   изредка баржи фактора в ней ничего не двигалось. Обжитая система должна
   ВЫГЛЯДЕТЬ обжитой до всяких цифр (DESIGN-holding §13): буксиры и челноки
   ходят между станцией и планетами. Сколько их — по ступени лестницы: в
   дикой системе ни одного, у станции один челнок, дальше по одному на каждые
   шесть рунгов, не больше четырёх. Ходят по своим дугам туда-обратно, сеяно
   от семени системы; ничего не хранится и ничего не считается вне кадра —
   положение это функция времени. Силуэт крошечный: тело, огонь сопла, один
   мигающий бортовой огонь — движение, а не мигание, поэтому огонь медленный. */
function sysTraffic(sys){
  if(sys.traffic)return sys.traffic;
  const out=[];
  const st=sys.station;
  if(!st){return sys.traffic=out;}
  const rung=(typeof rungOf==="function")?rungOf(sys.sx,sys.sy):0;
  const n=Math.min(4,1+Math.floor(rung/6));
  const r=rng((sys.seed^0x7A4F)>>>0);
  const bodies=(sys.planets||[]).filter(p=>p.type!=="gas");
  for(let i=0;i<n;i++){
    const p=bodies.length?bodies[Math.floor(r()*bodies.length)]:null;
    const B=p?{x:p.x,y:p.y,r:p.radius}:{x:-st.x*.4,y:-st.y*.4,r:20};
    out.push({ax:st.x,ay:st.y,bx:B.x,by:B.y,br:B.r,
      bow:(r()-.5)*.5,                     /* изгиб дуги, доля длины */
      spd:.00009+r()*.00007,ph:r()*TAU,k:.7+r()*.6,blink:r()*TAU});
  }
  return sys.traffic=out;
}
function drawSysTraffic(zx,zy,Z){
  const sys=G.sys;if(!sys)return;
  const T=sysTraffic(sys);if(!T.length)return;
  const s=clamp(Z,.5,1.5);
  for(const t of T){
    /* туда-обратно по дуге; у концов притормаживает — стыковка, а не пролёт */
    let u=(G.t*t.spd+t.ph/TAU)%1;u=u<.5?u*2:2-u*2;
    const e=u*u*(3-2*u);
    const dx=t.bx-t.ax,dy=t.by-t.ay,L=Math.hypot(dx,dy)||1;
    const nx=-dy/L,ny=dx/L;
    const bow=Math.sin(e*Math.PI)*t.bow*L;
    /* не влетать в станцию и в планету: концы дуги отступают от тел */
    const m0=28/L,m1=(t.br+18)/L;
    const ee=m0+e*(1-m0-m1);
    const wx=t.ax+dx*ee+nx*bow, wy=t.ay+dy*ee+ny*bow;
    const x=zx(wx),y=zy(wy);
    if(x<-30||x>W+30||y<-30||y>H+30)continue;
    /* курс — по касательной к дуге */
    const de=.002, e2=Math.min(1,e+de);
    const bow2=Math.sin(e2*Math.PI)*t.bow*L;
    const tx=dx*de+nx*(bow2-bow), ty=dy*de+ny*(bow2-bow);
    const dir=(u<.5?1:-1);
    const a=Math.atan2(ty*dir,tx*dir);
    ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.scale(s*t.k,s*t.k);
    /* сопло: тёплая точка позади, тело — тёмный корпус с холодной кромкой */
    const fg=ctx.createRadialGradient(-5,0,0,-5,0,4);
    fg.addColorStop(0,"rgba(255,214,150,.9)");fg.addColorStop(1,"rgba(255,150,80,0)");
    ctx.fillStyle=fg;ctx.beginPath();ctx.arc(-5,0,4,0,TAU);ctx.fill();
    ctx.fillStyle="#232b36";ctx.strokeStyle="rgba(0,0,0,.6)";ctx.lineWidth=.6;
    ctx.beginPath();ctx.moveTo(4,0);ctx.lineTo(-3,-2);ctx.lineTo(-4,0);ctx.lineTo(-3,2);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle="rgba(200,220,240,.5)";ctx.fillRect(-1,-2.2,2.5,.8);
    /* бортовой огонь: медленно, врозь с остальными */
    if(Math.sin(G.t*.03+t.blink)>.85){ctx.fillStyle="rgba(255,120,90,.95)";ctx.fillRect(-2,1.4,1.2,1.2);}
    ctx.restore();
  }
}
