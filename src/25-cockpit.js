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

   Неподвижная часть (рама, стойки, консоли, окантовки) — cockpitPaint: её печёт мастер кабины
   пояса выпечкой GPU-холста (24bc). 2D-запаса без видеокарты нет (M631, 22.10): без устройства
   игрок видит плашку 08b2, а не 2D-кабину — drawCockpit и его холст cockpitTex удалены. */
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
function cockpitPlan(id){
  const S=shipData(id),hl=hullOf(id),r=rng((S.seed^0xC0C4)>>>0);
  const K=CKPT_STYLE[cockpitStyleKey(id)];
  /* Кабина ужата вдвое против первой версии. Она обязана читаться как кабина,
     но смотрят из неё наружу: доска, потолок и стойки забирают ровно столько,
     сколько нужно, чтобы проём имел края. Всё, что не отвечает на вопрос
     «куда лететь и на чём», с доски убрано. */
  const dashH=clamp(H*.17*K.dash,92,168), dashY=H-dashH;
  const pw=clamp((W*.026+hl.bw*1.5)*K.pill,14,78);       // боковая стойка
  const brow=clamp((H*.055+hl.nose*.6)*K.brow,24,86);   // низ потолочного блока
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
  /* потолочные раструбы: две пары, у самого края потолка — намёк на маневровые,
     а не ряд иллюминаторов. Больше не помещается, да и не надо. */
  const pods=[];
  for(let i=0;i<2;i++)
    pods.push({dx:W*(.17+i*.13), y:brow*(.34+r()*.14), r:brow*(.16+r()*.08)});
  const BW=Math.min(W-24,1060), x0=(W-BW)/2;
  const stack={x:x0+BW*.355, w:BW*.29, lift:clamp(dashH*.13,10,24)};
  /* нижняя полоса доски уходит под экранные пэды — приборы туда не ставим */
  /* приборы живут только в верхней полосе доски: нижняя уходит под экранные
     кнопки режима, и всё, что туда попадёт, игрок просто не увидит */
  const UH=clamp(dashH-96,52,120);
  const grid=[];
  for(let side=0;side<2;side++){
    const cols=3+Math.floor(r()*2), rows=1;
    const cw=BW*.022, ch=UH*.12;
    grid.push({x:side?x0+BW-8-cols*(cw+4):x0+8, y:dashY+UH+6,
      cols,rows,cw,ch, lit:Array.from({length:cols},()=>r()<.32)});
  }
  const vents=[];
  for(let i=0;i<2+Math.floor(r()*2);i++)
    vents.push({x:lerp(x0+BW*.12,x0+BW*.88,r()), y:dashY+dashH*(.84+r()*.08), w:BW*(.03+r()*.04)});
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
  for(let i=0;i<4;i++)
    leds.push({y:lerp(brow*1.4,dashY-16,i/4+r()*.08), r:1.4+r()*1.2,
      ph:r()*TAU, sp:.02+r()*.09, on:r()<.72});
  return {S,hl,K,acc:S.col,dashH,dashY,UH,pw,brow,dip,glass,outer,strut,beam,pods,
    BW,x0,stack,grid,vents,scr,gscr,leds,seed:S.seed};
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
/* рама в любой ctx: выпечка GPU-холста (мастер 24bc) */
function cockpitPaint(c,P){
  const K=P.K, A=hex2rgb(P.acc);

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

  /* Центральный потолочный экран со столбиками тяги убран: он повторял рычаг
     тяги на доске и занимал верх кадра ради красивого мельтешения. */

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

  /* Два боковых экрана (обстановка слева, системы справа) убраны целиком:
     они занимали верхние углы кадра и показывали то же, что радар и полосы
     на доске. Углы вернулись космосу. */

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
  vg.addColorStop(0,"rgba(0,0,0,0)");vg.addColorStop(1,"rgba(0,0,0,.34)");
  c.fillStyle=vg;c.fillRect(0,0,W,H);
}
