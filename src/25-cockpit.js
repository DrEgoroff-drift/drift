/* ══════════════ кабина: процедурная, статика в offscreen ══════════════ */
/* Кабина — не панель поверх космоса, а помещение, из которого на космос смотрят.
   Отсюда три правила, которым подчинён весь файл:

   1. Остекление остаётся дырой. Всё, что рисуется, живёт по краям кадра;
      середина принадлежит миру. Единственное, что ложится на стекло, —
      отражения и блики, и они прозрачные.
   2. Толщина читается вырезом. Проём рисуется дважды — наружный контур и
      внутренний, — а кольцо между ними залито градиентом. Это фаска брони,
      и она даёт кабине глубину без единого пикселя перспективы.
   3. Класс корпуса виден с первого кадра. Раскладка, металл, износ и приборы
      берутся из `CKPT_STYLE` по `hullOf(...).hcls`: у буровика тяжёлые стойки,
      грязь и предупредительная штриховка, у исследователя — голограммы и белый
      пластик, у яхты панорама и латунь, у сплава — асимметричный органический
      переплёт. Игрок опознаёт корабль, не читая подписи.

   Неподвижная часть (рама, стойки, консоли, окантовки) печётся один раз
   в offscreen-канвас с прозрачным остеклением и дальше просто накладывается. */
const CKPT_STYLE={
  scout:  {shape:"round",  ru:"РАЗВЕДЗОНД",
    metal:["#1b232e","#0a1017"], pill:1,   brow:1,   dash:1,
    wear:.5, rivet:1, hazard:0, holo:.35, glow:.5,  led:"#7fe6d8", tint:[120,180,190]},
  courier:{shape:"round",  ru:"КУРЬЕР",
    metal:["#1d2029","#0a0c12"], pill:.72, brow:.78, dash:.9,
    wear:.6, rivet:0, hazard:0, holo:.5,  glow:.7,  led:"#ff9d7a", tint:[150,140,150]},
  hauler: {shape:"boxy",   ru:"РУДОВОЗ",
    metal:["#2a2a26","#100f0c"], pill:1.5, brow:1.2, dash:1.15,
    wear:1,  rivet:1, hazard:1, holo:.1,  glow:.35, led:"#f2b25c", tint:[170,150,110]},
  miner:  {shape:"boxy",   ru:"БУРОВИК",
    metal:["#2e2a22","#120f0a"], pill:1.7, brow:1.28,dash:1.2,
    wear:1.25,rivet:1,hazard:1, holo:.05, glow:.3,  led:"#f2b25c", tint:[180,145,95]},
  warship:{shape:"angular",ru:"ФРЕГАТ",
    metal:["#1c2420","#080d0b"], pill:1.35,brow:1.1, dash:1.05,
    wear:.7, rivet:1, hazard:0, holo:.55, glow:.6,  led:"#8fd08a", tint:[110,160,130]},
  survey: {shape:"round",  ru:"ИССЛЕДОВАТЕЛЬ",
    metal:["#232a31","#0d1218"], pill:.8,  brow:.85, dash:.95,
    wear:.25,rivet:0, hazard:0, holo:1,   glow:.9,  led:"#9fd8ff", tint:[150,190,215]},
  yacht:  {shape:"pano",   ru:"ЯХТА",
    metal:["#2b2620","#120e0a"], pill:.6,  brow:.66, dash:.85,
    wear:.15,rivet:0, hazard:0, holo:.7,  glow:1,   led:"#e0d28a", tint:[205,185,145]},
  alien:  {shape:"organic",ru:"СПЛАВ",
    metal:["#1a1526","#080611"], pill:1.1, brow:1.05,dash:1,
    wear:.4, rivet:0, hazard:0, holo:.85, glow:1.2, led:"#c58ae0", tint:[170,140,205]}
};
/* сплав из лаборатории — единственный корпус не с верфи, и кабина у него чужая */
function cockpitStyleKey(id){
  const S=shipData(id);
  if(S&&(S.fused||/сплав/.test(S.cls||"")))return "alien";
  return CKPT_STYLE[hullOf(id).hcls]?hullOf(id).hcls:"scout";
}
/* Контур остекления. Форма — от класса, но всегда одно и то же: край доски внизу,
   выступ носа посередине, стойки по бокам. Точек много, потому что кривые
   сэмплируются: дальше по этому контуру и режут дыру, и клипуют блики. */
function glassOutline(shape,pw,brow,dashY,dip,r,grow){
  const g=grow||0;
  const L=pw-g, R=W-pw+g, B=dashY+g, T=brow-g;
  const pts=[], N=16;
  const bow=(shape==="pano"?H*.05:shape==="boxy"?H*.012:H*.03);
  const flare=(shape==="pano"?1.25:shape==="boxy"?1.5:1.7);
  /* органика: кромка гуляет двумя длинными волнами, а не случайной ломаной —
     чужое должно быть плавным и асимметричным, а не рваным */
  const ph1=(r?r():0)*TAU, ph2=(r?r():0)*TAU;
  const wob=t=>Math.sin(t*2.1+ph1)*.62+Math.sin(t*4.3+ph2)*.24;
  /* левый борт снизу вверх */
  pts.push([L,B]);
  pts.push([L*.99-g,lerp(B,T,.55)]);
  const xTL=L+pw*(flare-1), xTR=R-pw*(flare-1);
  if(shape==="angular"){
    pts.push([L+pw*.35,T+H*.045]);
    pts.push([xTL,T]);
  }else pts.push([xTL,T+bow*.25]);
  /* верхняя кромка */
  for(let i=0;i<=N;i++){
    const t=i/N, x=lerp(xTL,xTR,t);
    let y=T-Math.sin(Math.PI*t)*bow;
    if(shape==="boxy")y=T+Math.abs(t-.5)*H*.008;
    if(shape==="organic")y=T-Math.sin(Math.PI*Math.pow(t,.82))*bow*1.6+wob(t)*H*.026;
    pts.push([x,y]);
  }
  if(shape==="angular"){
    pts.push([R-pw*.35,T+H*.045]);
  }
  pts.push([R*1.001+g,lerp(B,T,shape==="organic"?.44:.55)]);
  pts.push([R,B]);
  /* нижняя кромка: выступ носа корпуса */
  pts.push([W/2+dip*2.3,B]);
  pts.push([W/2,B-dip]);
  pts.push([W/2-dip*2.3,B]);
  return pts;
}
const CKPT={key:"",plan:null,tex:null};
function cockpitPlan(id){
  const S=shipData(id),hl=hullOf(id),r=rng((S.seed^0xC0C4)>>>0);
  const K=CKPT_STYLE[cockpitStyleKey(id)];
  const dashH=clamp(H*.30*K.dash,120,252), dashY=H-dashH;
  const pw=clamp((W*.045+hl.bw*2.2)*K.pill,20,124);      // боковая стойка
  const brow=clamp((H*.115+hl.nose*1.1)*K.brow,44,168);  // низ потолочного блока
  const dip=clamp(hl.bw*1.9+14,18,58);                   // нос корпуса снизу
  const glass=glassOutline(K.shape,pw,brow,dashY,dip,rng(S.seed^0x5151));
  const outer=glassOutline(K.shape,pw,brow,dashY,dip,rng(S.seed^0x5151),
    clamp(pw*.42+8,10,34));
  /* переплёт: у панорамы одна тонкая стойка, у рудовоза частый переплёт */
  const nStrut=K.shape==="pano"?1:(K.shape==="boxy"?3+Math.floor(r()*2):2+Math.floor(r()*3));
  const strut=[];
  for(let i=1;i<=nStrut;i++){
    const t=i/(nStrut+1);
    strut.push({xt:lerp(pw*1.7,W-pw*1.7,t),xb:lerp(pw,W-pw,t),
      w:(1.4+r()*2.4)*(K.shape==="boxy"?1.7:K.shape==="pano"?.7:1)});
  }
  /* поперечная балка: только у тяжёлых корпусов, зато читается сразу */
  const beam=(K.shape==="boxy")?{y:brow+(dashY-brow)*(.28+r()*.1),h:5+r()*4}:null;
  const nPod=2+Math.floor(r()*3), pods=[];
  for(let i=0;i<nPod;i++)
    pods.push({dx:W*(.14+i*.125), y:brow*(.30+r()*.16), r:brow*(.14+r()*.09)});
  const mfd={w:clamp(W*.155,92,214), h:clamp(brow*.86,44,112),
    y:brow*.12, tilt:.045+r()*.05, rows:3+Math.floor(r()*3)};
  const ohc={w:clamp(W*.185,104,250), y0:brow*.08, y1:brow*1.02,
    bars:9+Math.floor(r()*7)};
  const BW=Math.min(W-24,1060), x0=(W-BW)/2;
  const stack={x:x0+BW*.355, w:BW*.29, lift:clamp(dashH*.15,14,32)};
  /* нижняя полоса доски уходит под экранные пэды — приборы туда не ставим */
  const UH=Math.max(112,dashH-64);
  const grid=[];
  for(let side=0;side<2;side++){
    const cols=4+Math.floor(r()*3), rows=2;
    const cw=BW*.026, ch=UH*.10;
    grid.push({x:side?x0+BW-8-cols*(cw+4):x0+8, y:dashY+UH+4,
      cols,rows,cw,ch, lit:Array.from({length:cols*rows},()=>r()<.32)});
  }
  const vents=[];
  for(let i=0;i<3+Math.floor(r()*3);i++)
    vents.push({x:lerp(x0+BW*.1,x0+BW*.9,r()), y:dashY+dashH*(.82+r()*.1), w:BW*(.03+r()*.05)});
  /* потёртости рамы */
  const scr=[];
  for(let i=0;i<Math.round((8+r()*10)*K.wear);i++)
    scr.push([r()*W, r()*brow, 6+r()*22, r()*.8-.4]);
  /* царапины на самом стекле: короче, светлее, живут внутри проёма */
  const gscr=[];
  for(let i=0;i<Math.round((6+r()*8)*(K.wear+.2));i++)
    gscr.push([pw+r()*(W-pw*2), brow+r()*(dashY-brow), 8+r()*46, r()*TAU, .04+r()*.05]);
  /* лампы на боковых стойках: моргают вразнобой, у каждой свой период */
  const leds=[];
  for(let i=0;i<5+Math.floor(r()*4);i++)
    leds.push({y:lerp(brow*1.2,dashY-14,i/8+r()*.06), r:1.6+r()*1.6,
      ph:r()*TAU, sp:.02+r()*.09, on:r()<.72});
  return {S,hl,K,acc:S.col,dashH,dashY,UH,pw,brow,dip,glass,outer,strut,beam,pods,
    mfd,ohc,BW,x0,stack,grid,vents,scr,gscr,leds,seed:S.seed};
}
/* addPath не сбрасывает текущий путь — нужно для дырки по evenodd */
function addPath(c,pts){
  c.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);
  c.closePath();
}
function tracePath(c,pts){c.beginPath();addPath(c,pts);}
function plate(c,x,y,w,h,a,b2){
  const g=c.createLinearGradient(0,y,0,y+h);
  g.addColorStop(0,a);g.addColorStop(1,b2);
  c.fillStyle=g;c.fillRect(x,y,w,h);
}
/* штриховка «не влезай»: полосы под 45°, по кромке тяжёлых узлов */
function hazardBand(c,x,y,w,h,a){
  c.save();
  c.beginPath();c.rect(x,y,w,h);c.clip();
  c.fillStyle="rgba(24,20,10,"+a+")";c.fillRect(x,y,w,h);
  c.fillStyle="rgba(214,168,54,"+a+")";
  for(let i=-h;i<w+h;i+=14){
    c.beginPath();
    c.moveTo(x+i,y+h);c.lineTo(x+i+h,y);c.lineTo(x+i+h+7,y);c.lineTo(x+i+7,y+h);
    c.closePath();c.fill();
  }
  c.restore();
}
/* ряд заклёпок вдоль отрезка */
function rivetLine(c,x0,y0,x1,y1,step){
  const n=Math.max(1,Math.floor(Math.hypot(x1-x0,y1-y0)/step));
  for(let i=0;i<=n;i++){
    const x=lerp(x0,x1,i/n), y=lerp(y0,y1,i/n);
    c.fillStyle="rgba(0,0,0,.5)";c.beginPath();c.arc(x,y+.6,1.5,0,TAU);c.fill();
    c.fillStyle="rgba(210,225,240,.16)";c.beginPath();c.arc(x,y,1.3,0,TAU);c.fill();
  }
}
function cockpitTex(id){
  const key=id+"|"+Math.round(W)+"x"+Math.round(H)+"|"+DPR.toFixed(2);
  if(CKPT.key===key)return CKPT;
  const P=cockpitPlan(id), K=P.K;
  const cn=document.createElement("canvas");
  cn.width=Math.max(1,Math.round(W*DPR));cn.height=Math.max(1,Math.round(H*DPR));
  const c=cn.getContext("2d");
  c.setTransform(DPR,0,0,DPR,0,0);
  const A=hex2rgb(P.acc);

  /* ── корпус кабины: всё, кроме остекления ── */
  c.save();
  c.beginPath();c.rect(0,0,W,H);
  addPath(c,P.glass);
  const hullG=c.createLinearGradient(0,0,0,H);
  hullG.addColorStop(0,K.metal[0]);
  hullG.addColorStop(.42,K.metal[1]);
  hullG.addColorStop(1,"#05070c");
  c.fillStyle=hullG;c.fill("evenodd");
  c.restore();

  /* ── потолок: обшивка, швы, заклёпки ── */
  c.save();
  c.beginPath();c.rect(0,0,W,P.brow*1.06);c.clip();
  plate(c,0,0,W,P.brow*1.06,K.metal[0],K.metal[1]);
  c.strokeStyle="rgba(0,0,0,.45)";c.lineWidth=1;
  for(let i=1;i<5;i++){
    const y=P.brow*i/5;
    c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke();
  }
  c.strokeStyle="rgba(255,255,255,.05)";
  for(let i=1;i<5;i++){
    const y=P.brow*i/5+1;
    c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke();
  }
  if(K.rivet)for(let i=1;i<4;i++)rivetLine(c,0,P.brow*i/5,W,P.brow*i/5,26+i*5);
  /* потёртости */
  c.strokeStyle="rgba(255,255,255,.055)";c.lineWidth=1;
  for(const s of P.scr){
    c.beginPath();c.moveTo(s[0],s[1]);
    c.lineTo(s[0]+Math.cos(s[3])*s[2],s[1]+Math.sin(s[3])*s[2]);c.stroke();
  }
  c.restore();

  /* ── потолочные блоки маневровых: раструбы сопел ── */
  for(const p of P.pods)for(const s of [-1,1]){
    const x=W/2+p.dx*s, y=p.y, rr=p.r;
    const g=c.createRadialGradient(x-rr*.3,y-rr*.35,rr*.1,x,y,rr);
    g.addColorStop(0,"#2b3542");g.addColorStop(.55,"#141b25");g.addColorStop(1,"#070a10");
    c.fillStyle=g;c.beginPath();c.arc(x,y,rr,0,TAU);c.fill();
    c.strokeStyle="rgba(0,0,0,.6)";c.lineWidth=1.6;c.stroke();
    for(let k=1;k<=3;k++){
      c.strokeStyle="rgba(190,215,235,"+(.06+k*.03).toFixed(2)+")";c.lineWidth=1;
      c.beginPath();c.arc(x,y,rr*(1-k*.22),0,TAU);c.stroke();
    }
    c.fillStyle="#05080d";c.beginPath();c.arc(x,y,rr*.2,0,TAU);c.fill();
  }

  /* ── центральный потолочный блок ── */
  const O=P.ohc, ox=W/2-O.w/2;
  plate(c,ox,O.y0,O.w,O.y1-O.y0,"#222c38","#0a0f16");
  c.strokeStyle="rgba(0,0,0,.6)";c.lineWidth=1.6;c.strokeRect(ox,O.y0,O.w,O.y1-O.y0);
  c.fillStyle="#05080c";
  c.fillRect(ox+7,O.y0+7,O.w-14,O.y1-O.y0-14);
  c.strokeStyle=rgba(A,.35);c.lineWidth=1;
  c.strokeRect(ox+7,O.y0+7,O.w-14,O.y1-O.y0-14);
  if(K.hazard)hazardBand(c,ox,O.y1-4,O.w,4,.7);

  /* ── боковые консоли: трапеции, уходящие к остеклению ──
     Это главное, что превращает раму в помещение: борта не параллельны
     краю кадра, а сходятся к окну, как настоящие пульты по бокам кресла. */
  for(const s of [-1,1]){
    const near=s<0?0:W, far=s<0?P.pw*.92:W-P.pw*.92;
    const yTop=P.brow*1.04, yBot=P.dashY+8;
    c.beginPath();
    c.moveTo(near,yTop);c.lineTo(far,yTop+(yBot-yTop)*.18);
    c.lineTo(far,yBot);c.lineTo(near,yBot+12);
    c.closePath();
    const cg=c.createLinearGradient(near,0,far,0);
    cg.addColorStop(0,K.metal[0]);cg.addColorStop(1,"#05080d");
    c.fillStyle=cg;c.fill();
    c.strokeStyle=rgba(A,.22);c.lineWidth=1.2;c.stroke();
    /* полки консоли */
    c.strokeStyle="rgba(255,255,255,.055)";c.lineWidth=1;
    for(let i=1;i<4;i++){
      const y=lerp(yTop,yBot,i/4);
      c.beginPath();c.moveTo(near,y);c.lineTo(far,y+(yBot-yTop)*.05);c.stroke();
    }
    if(K.rivet)rivetLine(c,far,yTop+(yBot-yTop)*.18,far,yBot,22);
    if(K.hazard)hazardBand(c,s<0?0:W-14,yBot-46,14,46,.55);
  }

  /* ── окантовки боковых экранов ── */
  const M=P.mfd;
  for(const s of [-1,1]){
    c.save();
    const bx=s<0?10:W-10-M.w;
    c.translate(bx+M.w/2,M.y+M.h/2);c.rotate(M.tilt*s);
    plate(c,-M.w/2,-M.h/2,M.w,M.h,"#28323f","#0c1119");
    c.strokeStyle="rgba(0,0,0,.65)";c.lineWidth=2;
    c.strokeRect(-M.w/2,-M.h/2,M.w,M.h);
    c.strokeStyle=rgba(A,.4);c.lineWidth=1;
    c.strokeRect(-M.w/2+3,-M.h/2+3,M.w-6,M.h-6);
    c.fillStyle="#04070b";c.fillRect(-M.w/2+6,-M.h/2+6,M.w-12,M.h-12);
    /* кнопки по нижней кромке */
    c.fillStyle=rgba(A,.22);
    for(let i=0;i<5;i++)c.fillRect(-M.w/2+9+i*((M.w-18)/5),M.h/2-5.5,(M.w-18)/5-3,3);
    c.restore();
  }

  /* ── фаска проёма: кольцо между наружным и внутренним контуром ──
     Свет падает сверху, поэтому верх фаски светлый, низ уходит в тень —
     этого хватает, чтобы рама читалась толстой плитой, а не наклейкой.
     Рисуется поверх потолка и консолей: фаска — самый ближний к игроку слой. */
  c.save();
  c.beginPath();addPath(c,P.outer);addPath(c,P.glass);
  const bev=c.createLinearGradient(0,P.brow-40,0,P.dashY+20);
  bev.addColorStop(0,"rgba(190,214,236,.20)");
  bev.addColorStop(.34,"rgba(120,140,164,.10)");
  bev.addColorStop(1,"rgba(0,0,0,.55)");
  c.fillStyle=bev;c.fill("evenodd");
  c.restore();
  /* тень от фаски внутрь стекла — проём становится глубоким */
  c.save();
  tracePath(c,P.glass);c.clip();
  c.strokeStyle="rgba(0,0,0,.5)";c.lineWidth=14;
  tracePath(c,P.glass);c.stroke();
  c.strokeStyle="rgba(0,0,0,.34)";c.lineWidth=5;
  tracePath(c,P.glass);c.stroke();
  c.restore();

  /* ── переплёт остекления ── */
  c.save();
  tracePath(c,P.glass);c.clip();
  for(const s of P.strut){
    const g=c.createLinearGradient(s.xt-s.w,0,s.xt+s.w,0);
    g.addColorStop(0,"#05080d");g.addColorStop(.5,"#18202b");g.addColorStop(1,"#05080d");
    c.fillStyle=g;
    c.beginPath();
    c.moveTo(s.xt-s.w,P.brow-2);c.lineTo(s.xt+s.w,P.brow-2);
    c.lineTo(s.xb+s.w*1.5,P.dashY+2);c.lineTo(s.xb-s.w*1.5,P.dashY+2);
    c.closePath();c.fill();
    c.strokeStyle=rgba(A,.18);c.lineWidth=1;c.stroke();
  }
  if(P.beam){
    const B=P.beam;
    const g=c.createLinearGradient(0,B.y-B.h,0,B.y+B.h);
    g.addColorStop(0,"#232c36");g.addColorStop(.5,"#0e141c");g.addColorStop(1,"#05080d");
    c.fillStyle=g;c.fillRect(0,B.y-B.h,W,B.h*2);
    c.strokeStyle="rgba(0,0,0,.6)";c.lineWidth=1;
    c.strokeRect(0,B.y-B.h,W,B.h*2);
    if(K.rivet)rivetLine(c,0,B.y,W,B.y,34);
  }
  /* царапины на стекле */
  c.lineWidth=1;
  for(const g2 of P.gscr){
    c.strokeStyle="rgba(215,238,255,"+g2[4].toFixed(3)+")";
    c.beginPath();c.moveTo(g2[0],g2[1]);
    c.lineTo(g2[0]+Math.cos(g2[3])*g2[2],g2[1]+Math.sin(g2[3])*g2[2]);c.stroke();
  }
  c.restore();

  /* ── кант остекления ── */
  c.strokeStyle=rgba(A,.5);c.lineWidth=2;
  tracePath(c,P.glass);c.stroke();
  c.strokeStyle="rgba(255,255,255,.08)";c.lineWidth=1;
  tracePath(c,P.glass);c.stroke();

  /* ── приборная доска ── */
  const D=P.dashY,DH=P.dashH,x0=P.x0,BW=P.BW;
  plate(c,0,D,W,DH,K.metal[0],"#04070c");
  c.strokeStyle=rgba(A,.3);c.lineWidth=1.4;
  c.beginPath();c.moveTo(0,D+.5);c.lineTo(W,D+.5);c.stroke();
  /* приподнятая центральная стойка */
  const S2=P.stack;
  c.beginPath();
  c.moveTo(S2.x,D+2);
  c.lineTo(S2.x+S2.w*.1,D-S2.lift);
  c.lineTo(S2.x+S2.w*.9,D-S2.lift);
  c.lineTo(S2.x+S2.w,D+2);
  c.closePath();
  const sg=c.createLinearGradient(0,D-S2.lift,0,D+2);
  sg.addColorStop(0,"#1d2733");sg.addColorStop(1,"#0a1017");
  c.fillStyle=sg;c.fill();
  c.strokeStyle=rgba(A,.35);c.lineWidth=1.2;c.stroke();
  /* боковые «крылья» доски */
  for(const s of [-1,1]){
    const bx=s<0?x0:x0+BW;
    c.beginPath();
    c.moveTo(bx,D+4);
    c.lineTo(bx+s*BW*.16,D-S2.lift*.45);
    c.lineTo(bx+s*BW*.30,D+4);
    c.closePath();
    c.fillStyle="rgba(30,40,52,.85)";c.fill();
    c.strokeStyle=rgba(A,.16);c.lineWidth=1;c.stroke();
  }
  /* кнопочные поля */
  for(const g of P.grid){
    for(let rw=0;rw<g.rows;rw++)for(let cl=0;cl<g.cols;cl++){
      const x=g.x+cl*(g.cw+4), y=g.y+rw*(g.ch+4);
      const on=g.lit[rw*g.cols+cl];
      c.fillStyle=on?rgba(A,.5):"rgba(255,255,255,.06)";
      c.fillRect(x,y,g.cw,g.ch);
      c.strokeStyle="rgba(0,0,0,.55)";c.lineWidth=1;c.strokeRect(x+.5,y+.5,g.cw,g.ch);
      c.fillStyle="rgba(255,255,255,.05)";c.fillRect(x,y,g.cw,1.4);
    }
  }
  /* вентиляционные решётки */
  c.strokeStyle="rgba(0,0,0,.5)";c.lineWidth=1.4;
  for(const v of P.vents)for(let i=0;i<5;i++){
    c.beginPath();c.moveTo(v.x,v.y+i*3.4);c.lineTo(v.x+v.w,v.y+i*3.4);c.stroke();
  }
  /* табличка класса: единственная надпись на раме, зато сразу отвечает,
     на чём летим — у сплава она горит, у рудовоза выбита по трафарету */
  c.font="8px ui-monospace,monospace";c.textAlign="left";
  c.fillStyle=rgba(A,.5);
  c.fillText(K.ru+" · "+(P.S.ru||"").toUpperCase(),x0+8,D-6);
  /* нос корпуса под остеклением */
  c.beginPath();
  c.moveTo(W/2-P.dip*2.3,D);
  c.lineTo(W/2,D-P.dip);
  c.lineTo(W/2+P.dip*2.3,D);
  c.closePath();
  c.fillStyle="#0a1017";c.fill();
  c.strokeStyle=rgba(A,.4);c.lineWidth=1.2;c.stroke();

  /* ── виньетка: углы кадра уходят в тень кабины ── */
  const vg=c.createRadialGradient(W/2,H*.42,Math.min(W,H)*.34,W/2,H*.42,Math.max(W,H)*.72);
  vg.addColorStop(0,"rgba(0,0,0,0)");vg.addColorStop(1,"rgba(0,0,0,.5)");
  c.fillStyle=vg;c.fillRect(0,0,W,H);

  CKPT.key=key;CKPT.plan=P;CKPT.tex=cn;
  return CKPT;
}
function drawCockpit(b,st){
  const C=cockpitTex(G.shipId), P=C.plan, K=P.K, A=hex2rgb(P.acc);
  const D=P.dashY, DH=P.dashH, UH=P.UH, x0=P.x0, BW=P.BW;

  /* ── стекло: тонировка, блик и отражение приборов ──
     всё это прозрачное и живёт внутри проёма, мир под ним остаётся виден */
  ctx.save();
  tracePath(ctx,P.glass);ctx.clip();
  const T=K.tint;
  ctx.fillStyle="rgba("+T[0]+","+T[1]+","+T[2]+",.035)";ctx.fillRect(0,0,W,H);
  /* блик ползёт вместе с креном и тангажом — стекло становится телом */
  const gx=W/2+Math.sin(b.roll)*W*.4, gy=H*.3-Math.sin(b.pitch)*H*.2;
  const gl=ctx.createLinearGradient(gx-W*.3,gy-H*.2,gx+W*.25,gy+H*.25);
  gl.addColorStop(0,"rgba(255,255,255,0)");
  gl.addColorStop(.5,"rgba(190,225,255,"+(.045*K.glow).toFixed(3)+")");
  gl.addColorStop(1,"rgba(255,255,255,0)");
  ctx.fillStyle=gl;ctx.fillRect(0,0,W,H);
  /* отражение доски в нижней кромке остекления */
  const rf=ctx.createLinearGradient(0,P.dashY-H*.12,0,P.dashY);
  rf.addColorStop(0,"rgba(0,0,0,0)");
  rf.addColorStop(1,rgba(A,(.05*K.glow).toFixed(3)));
  ctx.fillStyle=rf;ctx.fillRect(0,P.dashY-H*.12,W,H*.12);
  ctx.restore();

  ctx.drawImage(C.tex,0,0,W,H);

  /* ── лампы на боковых стойках: моргают вразнобой ── */
  for(const s of [-1,1])for(const L of P.leds){
    const x=s<0?P.pw*.42:W-P.pw*.42;
    const on=L.on&&Math.sin(G.t*L.sp+L.ph)>-.35;
    ctx.fillStyle=on?K.led:"rgba(255,255,255,.05)";
    ctx.beginPath();ctx.arc(x,L.y,L.r,0,TAU);ctx.fill();
    if(on){
      ctx.globalAlpha=.22;ctx.beginPath();ctx.arc(x,L.y,L.r*3.4,0,TAU);ctx.fill();
      ctx.globalAlpha=1;
    }
  }

  /* ── боковые экраны ── */
  const M=P.mfd, spd=Math.hypot(b.vx,b.vy,b.vz);
  for(const s of [-1,1]){
    ctx.save();
    const bx=s<0?10:W-10-M.w;
    ctx.translate(bx+M.w/2,M.y+M.h/2);ctx.rotate(M.tilt*s);
    ctx.beginPath();ctx.rect(-M.w/2+6,-M.h/2+6,M.w-12,M.h-12);ctx.clip();
    const iw=M.w-12, ih=M.h-12, ix=-M.w/2+6, iy=-M.h/2+6;
    ctx.strokeStyle=rgba(A,.1);ctx.lineWidth=1;
    for(let i=1;i<5;i++){
      ctx.beginPath();ctx.moveTo(ix,iy+ih*i/5);ctx.lineTo(ix+iw,iy+ih*i/5);ctx.stroke();
    }
    if(s<0){
      /* слева — обстановка вокруг: точки камней по дальности */
      ctx.fillStyle=rgba(A,.85);ctx.font="7px ui-monospace,monospace";ctx.textAlign="left";
      ctx.fillText("ОБСТАНОВКА",ix+4,iy+9);
      for(const a of b.ast){
        const dd=Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
        if(dd>2000)continue;
        const px=ix+4+((a.x-b.x)/2000*.5+.5)*(iw-8);
        const py=iy+13+(1-dd/2000)*(ih-20);
        ctx.fillStyle=a===b.lock?"#f2b25c":RES[a.res].col;
        ctx.globalAlpha=a===b.lock?1:.55;
        ctx.fillRect(px,py,2.2,2.2);
      }
      ctx.globalAlpha=1;
      ctx.fillStyle=rgba(A,.6);ctx.font="7px ui-monospace,monospace";
      ctx.fillText("КАМНЕЙ "+b.ast.length,ix+4,iy+ih-4);
    }else{
      /* справа — состояние систем в столбиках */
      ctx.fillStyle=rgba(A,.85);ctx.font="7px ui-monospace,monospace";ctx.textAlign="left";
      ctx.fillText("СИСТЕМЫ",ix+4,iy+9);
      const rowsv=[["ТОПЛ",G.fuel/st.fuelMax,"#7fe6d8"],["КОРП",G.hull/st.hullMax,"#f2b25c"],
        ["ТРЮМ",held()/st.cargoMax,"#c58ae0"],["РЕЗАК",b.beam?1:0,"#ff9d7a"]];
      rowsv.forEach((rv,i)=>{
        const y=iy+16+i*((ih-22)/rowsv.length);
        ctx.fillStyle="rgba(140,170,190,.7)";ctx.fillText(rv[0],ix+4,y+5);
        ctx.fillStyle="rgba(255,255,255,.08)";ctx.fillRect(ix+30,y,iw-36,4);
        ctx.fillStyle=rv[2];ctx.fillRect(ix+30,y,(iw-36)*clamp(rv[1],0,1),4);
      });
    }
    /* развёртка экрана: бегущая строка и мерцание — экран живой, а не картинка */
    if(K.holo>.2){
      const sy=iy+((G.t*1.7)%(ih));
      ctx.fillStyle=rgba(A,(.05*K.holo).toFixed(3));ctx.fillRect(ix,sy,iw,3);
      if(Math.random()<.02*K.holo){
        ctx.fillStyle="rgba(255,255,255,.05)";ctx.fillRect(ix,iy,iw,ih);
      }
    }
    ctx.restore();
  }

  /* ── центральный потолочный экран: столбики тяги ── */
  const O=P.ohc, ox=W/2-O.w/2;
  const iw2=O.w-14, ih2=O.y1-O.y0-14, ix2=ox+7, iy2=O.y0+7;
  const bw2=iw2/O.bars;
  for(let i=0;i<O.bars;i++){
    const ph=Math.sin(G.t*.07+i*.7)*.5+.5;
    const lvl=clamp((keys.thrust?.55:.2)+ph*.45,0,1);
    ctx.fillStyle=rgba(A,.16+lvl*.5);
    ctx.fillRect(ix2+i*bw2+1,iy2+ih2*(1-lvl),bw2-2,ih2*lvl);
  }
  ctx.strokeStyle=rgba(A,.25);ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(ix2,iy2+ih2*.5);ctx.lineTo(ix2+iw2,iy2+ih2*.5);ctx.stroke();

  /* ── голограмма над доской: висит в воздухе, не закрывает мир ──
     У исследователя и яхты она большая, у буровика её почти нет: голография
     дорогая, и на рабочей лохани её не ставят. */
  if(K.holo>.3){
    const hx=x0+BW*.5, hy=D-clamp(DH*.22,22,44), hr=clamp(BW*.05,20,44)*K.holo;
    ctx.save();
    ctx.globalCompositeOperation="lighter";
    const hgl=ctx.createRadialGradient(hx,hy,0,hx,hy,hr*1.8);
    hgl.addColorStop(0,rgba(A,.10));hgl.addColorStop(1,rgba(A,0));
    ctx.fillStyle=hgl;ctx.beginPath();ctx.arc(hx,hy,hr*1.8,0,TAU);ctx.fill();
    /* кольца планетарной сетки — крутятся, мерцают строчками */
    ctx.strokeStyle=rgba(A,.35);ctx.lineWidth=1;
    for(let i=0;i<3;i++){
      const t=G.t*.012+i*.7;
      ctx.beginPath();
      ctx.ellipse(hx,hy,hr*(1-i*.16),hr*(1-i*.16)*Math.abs(Math.cos(t))*.55+1.5,0,0,TAU);
      ctx.stroke();
    }
    ctx.strokeStyle=rgba(A,.18);
    ctx.beginPath();ctx.ellipse(hx,hy,hr*.35,hr*.35,0,0,TAU);ctx.stroke();
    for(let i=0;i<3;i++){
      const y=hy-hr+((G.t*.9+i*hr*.7)%(hr*2));
      ctx.fillStyle=rgba(A,.07);ctx.fillRect(hx-hr,y,hr*2,1);
    }
    ctx.restore();
  }

  /* ── левый блок доски: полёт ── */
  const pad=D+13;
  ctx.font="8px ui-monospace,monospace";ctx.textAlign="left";
  vbar(x0+6,pad,10,UH-28,G.fuel/st.fuelMax,"#7fe6d8","ТОПЛ");
  vbar(x0+34,pad,10,UH-28,G.hull/st.hullMax,"#f2b25c","КОРП");
  const lx=x0+62;
  ctx.fillStyle="rgba(93,115,130,.9)";ctx.fillText("СКОРОСТЬ",lx,pad+8);
  ctx.fillStyle="#7fe6d8";ctx.font="17px ui-monospace,monospace";
  ctx.fillText(spd.toFixed(1),lx,pad+28);
  ctx.font="8px ui-monospace,monospace";ctx.fillStyle="rgba(93,115,130,.9)";
  ctx.fillText("ТЯГА",lx,pad+46);
  ctx.fillStyle="rgba(255,255,255,.08)";ctx.fillRect(lx,pad+50,86,5);
  ctx.fillStyle=keys.thrust?"#f2b25c":"rgba(242,178,92,.3)";
  ctx.fillRect(lx,pad+50,86*(keys.thrust?1:(keys.brake?.15:0)),5);
  ctx.fillStyle="rgba(93,115,130,.9)";
  ctx.fillText("ПЛОСКОСТЬ ПОЯСА "+(b.y>=0?"+":"")+Math.round(b.y),lx,pad+70);
  ctx.fillText("ТАНГАЖ "+(b.pitch*57.3).toFixed(0)+"°  КРЕН "+(b.roll*57.3).toFixed(0)+"°",lx,pad+84);

  /* ── радар на центральной стойке ── */
  const rr=Math.min(UH*.40,56), rcx=x0+BW*.5, rcy=D+UH*.46;
  ctx.strokeStyle="rgba(120,190,210,.3)";ctx.lineWidth=1;
  ctx.beginPath();ctx.arc(rcx,rcy,rr,0,TAU);ctx.stroke();
  ctx.beginPath();ctx.arc(rcx,rcy,rr*.55,0,TAU);ctx.stroke();
  ctx.strokeStyle="rgba(120,190,210,.14)";
  ctx.beginPath();ctx.moveTo(rcx-rr,rcy);ctx.lineTo(rcx+rr,rcy);
  ctx.moveTo(rcx,rcy-rr);ctx.lineTo(rcx,rcy+rr);ctx.stroke();
  ctx.fillStyle="rgba(127,230,216,.12)";
  ctx.beginPath();ctx.moveTo(rcx,rcy);
  ctx.arc(rcx,rcy,rr,-Math.PI/2-.42,-Math.PI/2+.42);ctx.closePath();ctx.fill();
  const RANGE=2000;
  const fx=Math.sin(b.yaw), fz=Math.cos(b.yaw), rx=Math.cos(b.yaw), rz=-Math.sin(b.yaw);
  for(const a of b.ast){
    const dx=a.x-b.x,dz=a.z-b.z,dy=a.y-b.y;
    const dd=Math.hypot(dx,dy,dz);
    if(dd>RANGE)continue;
    const px=(dx*rx+dz*rz)/RANGE*rr, py=(dx*fx+dz*fz)/RANGE*rr;
    const s=a===b.lock?3.4:clamp(a.r/34,1.2,2.6);
    ctx.fillStyle=a===b.lock?"#f2b25c":RES[a.res].col;
    ctx.globalAlpha=a===b.lock?1:clamp(1-Math.abs(dy)/700,.22,1);
    ctx.beginPath();ctx.arc(rcx+px,rcy-py,s,0,TAU);ctx.fill();
    ctx.globalAlpha=1;
  }
  ctx.fillStyle="#e8f4f2";
  ctx.beginPath();ctx.moveTo(rcx,rcy-4);ctx.lineTo(rcx-3,rcy+3);ctx.lineTo(rcx+3,rcy+3);
  ctx.closePath();ctx.fill();
  ctx.fillStyle="rgba(93,115,130,.85)";ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
  ctx.fillText("ОБЗОР 2000",rcx,rcy+rr+12);

  /* ── правый блок: цель и трюм ── */
  const tx=x0+BW*.60;
  ctx.textAlign="left";
  ctx.fillStyle="rgba(93,115,130,.9)";ctx.font="8px ui-monospace,monospace";
  ctx.fillText("ЦЕЛЬ",tx,pad+8);
  if(b.lock){
    const dd=Math.hypot(b.lock.x-b.x,b.lock.y-b.y,b.lock.z-b.z)-b.lock.r;
    ctx.fillStyle=RES[b.lock.res].col;ctx.font="12px ui-monospace,monospace";
    ctx.fillText(RES[b.lock.res].ru.toUpperCase(),tx,pad+24);
    ctx.font="8px ui-monospace,monospace";
    ctx.fillStyle=dd>CUT_RANGE?"rgba(255,107,87,.9)":"rgba(93,115,130,.9)";
    ctx.fillText("×"+b.lock.left+"   "+Math.round(dd)+" М"+
      (dd>CUT_RANGE?"   ДАЛЕКО":""),tx,pad+38);
    ctx.fillStyle="rgba(255,255,255,.08)";ctx.fillRect(tx,pad+44,110,5);
    ctx.fillStyle="#f2b25c";ctx.fillRect(tx,pad+44,110*clamp(b.prog,0,1),5);
  }else{
    ctx.fillStyle="rgba(93,115,130,.5)";ctx.font="11px ui-monospace,monospace";
    ctx.fillText("— НЕТ ЗАХВАТА —",tx,pad+24);
    ctx.font="8px ui-monospace,monospace";
  }
  ctx.fillStyle="rgba(93,115,130,.9)";
  ctx.fillText("ТРЮМ "+held()+" / "+st.cargoMax,tx,pad+66);
  let cxp=tx;
  const cw=Math.min(130,BW*.22);
  ctx.fillStyle="rgba(255,255,255,.07)";ctx.fillRect(tx,pad+70,cw,7);
  for(const k of RES_KEYS){
    const q=G.cargo[k];if(!q)continue;
    const w=cw*q/st.cargoMax;
    ctx.fillStyle=RES[k].col;ctx.fillRect(cxp,pad+70,w,7);cxp+=w;
  }

  /* ── лампы ── */
  const lamps=[
    ["СБЛИЖЕНИЕ",b.near<130,"#ff6b57"],
    ["ТРЮМ ПОЛОН",held()>=st.cargoMax,"#c58ae0"],
    ["ТОПЛИВО",G.fuel/st.fuelMax<.2,"#ff6b57"],
    ["РЕЗАК",!!b.beam,"#f2b25c"],
    ["ОРУДИЕ",st.armed&&b.cool<=0,"#7fe6d8"]
  ];
  let lx2=x0+BW-8;
  ctx.textAlign="right";ctx.font="8px ui-monospace,monospace";
  lamps.forEach((L,i)=>{
    const y=pad+6+i*16;
    const on=L[1]&&(L[0]!=="СБЛИЖЕНИЕ"||Math.sin(G.t*.25)>-.2);
    ctx.fillStyle=on?L[2]:"rgba(255,255,255,.05)";
    ctx.fillRect(lx2-7,y-6,7,7);
    if(on){   // горящая лампа подсвечивает раму вокруг себя
      ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=.25;
      ctx.beginPath();ctx.arc(lx2-3.5,y-2.5,9,0,TAU);ctx.fill();ctx.restore();
    }
    ctx.fillStyle=on?L[2]:"rgba(93,115,130,.45)";
    ctx.fillText(L[0],lx2-13,y);
  });

  /* ── рукоятки и рычаг тяги ──
     просвет между экранными пэдами считаем по той же геометрии, что задаёт CSS
     режима пояса: слева 4 кнопки по 44, справа три по 44 и одна 56 */
  const gL=12+4*44+3*5, gR=W-(12+3*44+56+3*5), gW=gR-gL;
  if(gW>=86){
    const gC=(gL+gR)/2, k=clamp(gW/230,.55,1);
    const yy=H-8, gh=clamp(DH*.26,26,52)*k;
    const tilt=clamp(b.avYaw*8,-.5,.5), lean=clamp(-b.avPitch*7,-.45,.45);
    for(const s of [-1,1]){
      ctx.save();
      ctx.translate(gC+s*gW*.19,yy);
      ctx.fillStyle="rgba(16,22,30,.95)";
      ctx.beginPath();ctx.ellipse(0,0,14*k,6*k,0,0,TAU);ctx.fill();
      ctx.strokeStyle=rgba(A,.3);ctx.lineWidth=1;ctx.stroke();
      ctx.rotate(tilt*.55);
      ctx.strokeStyle="rgba(150,180,200,.6)";ctx.lineWidth=5*k;ctx.lineCap="round";
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(lean*20*k,-gh);ctx.stroke();
      ctx.strokeStyle="rgba(22,30,40,.98)";ctx.lineWidth=10*k;
      ctx.beginPath();ctx.moveTo(lean*15*k,-gh*.68);ctx.lineTo(lean*20*k,-gh);ctx.stroke();
      ctx.fillStyle=(s<0?keys.act:keys.fire)?"#f2b25c":"rgba(242,178,92,.3)";
      ctx.beginPath();ctx.arc(lean*20*k,-gh-1,2.6*k,0,TAU);ctx.fill();
      ctx.lineCap="butt";
      ctx.restore();
    }
    const thx=gC-gW*.40, trk=clamp(DH*.28,28,54)*k, hw=8*k;
    ctx.fillStyle="rgba(10,15,21,.95)";ctx.fillRect(thx-hw,yy-trk-6,hw*2,trk+10);
    ctx.strokeStyle=rgba(A,.28);ctx.lineWidth=1;ctx.strokeRect(thx-hw,yy-trk-6,hw*2,trk+10);
    const tp=keys.thrust?1:(keys.brake?0:.32), th=yy-6-trk*tp;
    ctx.fillStyle="rgba(255,255,255,.06)";ctx.fillRect(thx-2,yy-trk-2,4,trk);
    ctx.fillStyle=keys.thrust?"#f2b25c":"rgba(180,205,222,.65)";
    ctx.fillRect(thx-hw-1,th-4*k,hw*2+2,8*k);
    ctx.fillStyle="rgba(0,0,0,.45)";ctx.fillRect(thx-hw-1,th-1,hw*2+2,2);
  }

  function vbar(x,y,w,h,frac,col,label){
    ctx.fillStyle="rgba(255,255,255,.07)";ctx.fillRect(x,y,w,h);
    const f=clamp(frac,0,1);
    ctx.fillStyle=f<.22?"#ff6b57":col;
    ctx.fillRect(x,y+h*(1-f),w,h*f);
    ctx.strokeStyle="rgba(0,0,0,.5)";ctx.lineWidth=1;
    for(let i=1;i<5;i++){
      ctx.beginPath();ctx.moveTo(x,y+h*i/5);ctx.lineTo(x+w,y+h*i/5);ctx.stroke();
    }
    ctx.fillStyle="rgba(93,115,130,.9)";ctx.font="8px ui-monospace,monospace";ctx.textAlign="left";
    ctx.fillText(label,x-1,y+h+11);
  }
}
