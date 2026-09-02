/* ══════════════ тело станции и планеты: что построил игрок, видно ══════════════
   M296, шаг 8 (DESIGN-holding §13). Формы построек на станции кладёт 12ad
   (holdMods → drawStModule, вторым слоем после штатных модулей, внешним
   кольцом: штанги 40–50 против 22–38 у штатных, чтобы своё читалось поверх
   казённого). Здесь — то, что вне корпуса станции:

   ПРИЧАЛЕННАЯ БАРЖА. У станции с Причалом (E4), которая лежит на плечах вашей
   баржи, баржа стоит у борта — тем же рисунком, что и баржи фактора (12l,
   BARGE_ART по посеву), только неподвижно и с подписью «У ПРИЧАЛА». Одна
   движущаяся вещь на станцию по замыслу — у причаленной движения нет.

   ОГНИ НА НОЧНОЙ СТОРОНЕ. Планета системы с вашими постройками получает
   тёплые точки на тёмной половине диска: по три на постройку, до двадцати
   четырёх; с Пояса огней (28) — вся ночная сторона в огнях. Точки стоят,
   не мигают (движение — ход, мерцание — стоянке). Рисуются поверх кэшированного
   диска, в экранных координатах, и в кэш не входят. */
function drawMooredBarge(zx,zy,Z){
  const sys=G.sys;if(!sys||!sys.station)return;
  if(typeof bldHas!=="function"||!bldHas(sys.sx,sys.sy,"prichal"))return;
  const c=(G.crew||[]).find(c=>c.order&&c.order.kind==="barge"&&c.barge&&c.barge.legs.indexOf(sys.key)>=0);
  if(!c||typeof drawBarge!=="function")return;
  const st=sys.station;
  const b=drawMooredBarge.b||(drawMooredBarge.b={});
  b.seed=hashi(sys.seed,0xB0A7,1);b.x=st.x+96;b.y=st.y+58;b.a=-.55;
  b.hullMax=140;b.hp=140;b.capName=bargeName(c);b.distress=0;b.underFire=0;b.escort=0;b.done=0;
  const x=zx(b.x),y=zy(b.y);
  ctx.save();ctx.translate(x,y);ctx.rotate(b.a);
  const s=clamp(Z,.5,1.5)*.8;ctx.scale(s,s);
  drawBarge(b);
  ctx.restore();
  /* швартов: одна линия к станции, чтобы стоянка читалась стоянкой */
  ctx.strokeStyle="rgba(242,178,92,.35)";ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(x-10*s,y-6*s);ctx.lineTo(zx(st.x)+34*clamp(Z,.4,1.5)*1.7,zy(st.y)+22*clamp(Z,.4,1.5)*1.7);ctx.stroke();
  ctx.fillStyle="rgba(242,178,92,.8)";ctx.font="9px ui-monospace,monospace";ctx.textAlign="center";
  ctx.fillText("«"+bargeName(c).toUpperCase()+"» · У ПРИЧАЛА",x,y+30);
  ctx.textAlign="left";
}
/* сколько огней у планеты этой системы: по постройкам и по Поясу огней */
function planetLightsN(sys){
  const H=G.hold&&G.hold[sys.key],nb=H&&H.bld?Object.keys(H.bld).length:0;
  if(!nb)return 0;
  const belt=(typeof rungOf==="function")&&rungOf(sys.sx,sys.sy)>=28;
  return belt?48:Math.min(24,nb*3);
}
function drawPlanetLights(sys,p,x,y,r){
  if(!p||p.type==="gas"||r<6)return;
  /* огни — на первом твёрдом теле системы: там живут */
  const first=(sys.planets||[]).find(q=>q.type!=="gas");
  if(first!==p)return;
  const n=planetLightsN(sys);if(!n)return;
  const an=Math.atan2(p.y,p.x);            /* от звезды — ночная сторона */
  const rr=rng(hashi(p.seed,0x11F5,n));
  const dot=Math.max(1,r*.024);
  ctx.save();
  ctx.beginPath();ctx.arc(x,y,r-1,0,TAU);ctx.clip();
  ctx.fillStyle="rgba(255,214,150,.85)";
  for(let i=0;i<n;i++){
    const a=an+(rr()-.5)*(n>=48?2.6:1.6);
    const d=r*(.3+rr()*.6);
    const px=x+Math.cos(a)*d,py=y+Math.sin(a)*d;
    ctx.beginPath();ctx.arc(px,py,dot*(0.7+rr()*.6),0,TAU);ctx.fill();
  }
  ctx.restore();
}
