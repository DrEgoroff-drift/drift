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

/* ── планета меняется тоже (M306, DESIGN-holding §13) ──
   Огни на ночной стороне были, а дневная сторона молчала. Три знака, каждый
   от своей причины и ни один — цифра: ОТВАЛ у шахты — бледное пятно на
   дневной стороне (любая добыча семьи A с породы: реголит, бурение, отвальный
   промысел); КУПОЛ оранжереи ловит солнце — одна яркая точка у терминатора с
   холодным ореолом (оранжерея, биостанция); ПОЛОСА — прямая линия там, где
   прямых не бывает, с рунга 6 «Полоса» (вы стояли на грунте). Всё в экранных
   координатах поверх кэшированного диска, как и огни; ничего не хранится. */
function drawPlanetWorks(sys,p,x,y,r){
  if(!p||p.type==="gas"||r<12)return;
  const first=(sys.planets||[]).find(q=>q.type!=="gas");
  if(first!==p)return;
  const H=G.hold&&G.hold[sys.key],B=H&&H.bld?H.bld:null;
  const has=id=>!!(B&&B[id]&&(typeof bldReady!=="function"||bldReady(B[id])));
  const dump=has("regolith")||has("deepdrill")||has("dumpworks");
  const dome=has("greenhouse")||has("biostation");
  const strip=(typeof rungOf==="function")&&rungOf(sys.sx,sys.sy)>=6;
  if(!dump&&!dome&&!strip)return;
  /* дневная сторона — к звезде; звезда системы в (0,0) */
  let ux=-(p.x||0),uy=-(p.y||0);const ln=Math.hypot(ux,uy)||1;ux/=ln;uy/=ln;
  const vx=-uy,vy=ux;                       /* вдоль лимба */
  const rr=rng(hashi(p.seed,0x0D0E,7));
  ctx.save();
  ctx.beginPath();ctx.arc(x,y,r-1,0,TAU);ctx.clip();
  if(dump){
    const d=r*.52, ox=x+ux*d+vx*r*(rr()-.5)*.5, oy=y+uy*d+vy*r*(rr()-.5)*.5;
    const ang=Math.atan2(vy,vx);
    ctx.fillStyle="rgba(232,222,200,.30)";
    ctx.beginPath();ctx.ellipse(ox,oy,r*.13,r*.06,ang,0,TAU);ctx.fill();
    ctx.fillStyle="rgba(216,204,182,.34)";
    ctx.beginPath();ctx.ellipse(ox+vx*r*.04,oy+vy*r*.04,r*.07,r*.035,ang+.3,0,TAU);ctx.fill();
    /* тень отвала со стороны от солнца — пятно стало горкой */
    ctx.fillStyle="rgba(0,0,0,.22)";
    ctx.beginPath();ctx.ellipse(ox-ux*r*.035,oy-uy*r*.035,r*.11,r*.03,ang,0,TAU);ctx.fill();
  }
  if(strip){
    const d=r*.34, sx=x+ux*d+vx*r*(rr()-.5)*.6, sy=y+uy*d+vy*r*(rr()-.5)*.6;
    const a=Math.atan2(uy,ux)+(rr()-.5)*1.2, L=r*.16;
    ctx.strokeStyle="rgba(236,232,220,.55)";ctx.lineWidth=Math.max(1,r*.012);ctx.lineCap="butt";
    ctx.beginPath();ctx.moveTo(sx-Math.cos(a)*L,sy-Math.sin(a)*L);ctx.lineTo(sx+Math.cos(a)*L,sy+Math.sin(a)*L);ctx.stroke();
  }
  if(dome){
    /* у терминатора: там купол ловит низкое солнце */
    const a=Math.atan2(uy,ux)+(rr()<.5?1:-1)*(1.05+rr()*.25), d=r*.78;
    const dx=x+Math.cos(a)*d, dy=y+Math.sin(a)*d;
    ctx.save();ctx.globalCompositeOperation="lighter";
    /* купол светится грунтом того, кто его ставил (M369a, §19.4 «купола») */
    const dby=(G.sys&&G.sys.station&&G.sys.station.by)||"gt";
    const dc=(typeof makerGround==="function")?mixc(makerGround(dby),[200,255,230],.5):[200,255,230];
    const g=ctx.createRadialGradient(dx,dy,0,dx,dy,r*.07);
    g.addColorStop(0,rgba(dc,.55));g.addColorStop(1,rgba(dc,0));
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(dx,dy,r*.07,0,TAU);ctx.fill();
    ctx.restore();
    ctx.fillStyle="rgba(255,255,244,.95)";
    ctx.beginPath();ctx.arc(dx,dy,Math.max(1.2,r*.014),0,TAU);ctx.fill();
  }
  ctx.restore();
}
