/* ══════════════ большая вещь на каждый биом (M352) ══════════════
   Автор (2026-09-04) на кадре джунглей: две низкополигональные кроны с лианами,
   стела с зарубками, астронавт для мерила — «оч нравится и размер и стиль
   отрисовки». И потом: «кристаллы большие, каменюги». До сих пор семья крупной
   формы была у четырёх миров из одиннадцати (21b: кристалл, металл, руины,
   джунгли); остальные семь различались грунтом и мелкой флорой — с трёх шагов
   один силуэт.

   Здесь роль кроны — пять-восемь ростов человека (FG_MAN 17 → 85–140 единиц),
   силуэт против дымки, тень на грунте, без обвода — отдаётся каждому сухому
   биому своей семьёй из двух-трёх форм на одной грамматике:
   · пустыня — столовая гора на тонкой шее со слоями, сухое дерево в одну крону,
     согнутое ветром;
   · камень — валуны ярусами с трещиной и тёмным низом, лишайник пятном сверху;
   · лёд — торосы и шпили с просвечивающей кромкой, синяя тень внутри, карниз;
   · вулкан — чёрный шлаковый конус с тёплой трещиной и прямым столбом дыма,
     «лавовое дерево» из застывших потёков;
   · токсичный — голые стволы со стручками, волдыри, светящаяся лужа у корней;
   · океан — береговое дерево на ходульных корнях, наклонённое к воде, коралловая
     башня на отмели;
   · руины — стела с зарубками (та самая), балка с антенной, лестница в никуда;
   · землеподобная — крона реже и круглее (тот же навес, флаг), одинокий валун;
   · джунгли — крона-двойник с двумя лопастями; кристалл — осыпь между друзами.

   Одна грамматика: тёмная масса первой, потом тело в тонах породы (dcol по
   палитре мира), потом одна освещённая кромка с стороны звезды, потом деталь
   счётом. Ни одной линии обвода вокруг силуэта.

   ПРАВИЛА ФАЙЛА:
   1. Формы регистрируются в DECO_KINDS и DECO_FN; отбор, посадка и тень — в 21b-surface-deco.
      Имя файла продолжает стебель «21b-surface-deco»: «21bb-» встало бы ПЕРЕД ним (ловушка дефиса).
   2. Всё от POI_SEED (h01), ветер — WIND; ничего не хранится.
   3. Мерило — человек: высоты в DECO_KINDS в единицах мира до множителя sc. */
const DECO_FN={};
/* небольшая вспомогательная геометрия */
function decoPoly(pts){ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();}
function decoLitSide(){const SP=(typeof sunSpot==="function"&&G.surf&&G.surf.p)?sunSpot(G.surf.p):null;return SP?(SP.x>W*.5?1:-1):1;}
/* ── пустыня ── */
function decoButte(A){
  const {pal,w,hgt}=A,ls=decoLitSide();
  const top=hgt, neck=w*.55, cap=w*1.7;
  /* тёмная масса: шея и плита одним телом */
  ctx.fillStyle=dcol(pal,1,.9);
  decoPoly([[-neck,4],[-neck*.8,-top*.62],[-cap,-top*.72],[-cap*.92,-top],[cap*.92,-top],[cap,-top*.72],[neck*.8,-top*.62],[neck,4]]);ctx.fill();
  /* слои: полосы поперёк плиты и шеи — счётом, по палитре */
  /* слои — три тонкие полосы, вполголоса: пять ярких на первом кадре
     сложились в дощатый стол, а не в породу */
  for(let i=0;i<3;i++){
    const y=-top*(.78+i*.07),wd=cap*(.94-i*.02);
    ctx.fillStyle=dcol(pal,(i%2)?2:0,1,.28);ctx.fillRect(-wd,y,wd*2,top*.014);
  }
  /* освещённая кромка — одна, со стороны звезды */
  ctx.fillStyle=dcol(pal,4,1.15,.75);
  decoPoly([[ls*cap*.92,-top],[ls*cap,-top*.72],[ls*cap*.94,-top*.74],[ls*cap*.86,-top*.985]]);ctx.fill();
  ctx.fillStyle=dcol(pal,4,1.1,.5);ctx.fillRect(-cap*.9,-top,cap*1.8,top*.018);
  /* тёмный низ плиты — тень под навесом */
  ctx.fillStyle="rgba(0,0,0,.28)";
  decoPoly([[-cap*.98,-top*.72],[-neck*.8,-top*.62],[neck*.8,-top*.62],[cap*.98,-top*.72],[cap*.9,-top*.7],[-cap*.9,-top*.7]]);ctx.fill();
  /* осыпь у шеи */
  for(let i=0;i<7;i++){const bx=(h01(i,3,POI_SEED)-.5)*w*2.2,s=2+h01(i,5,POI_SEED)*w*.12;
    ctx.fillStyle=dcol(pal,2,.9);ctx.beginPath();ctx.moveTo(bx-s,4);ctx.lineTo(bx,4-s*1.2);ctx.lineTo(bx+s,4);ctx.closePath();ctx.fill();}
}
function decoDryTree(A){
  const {pal,w,hgt}=A;
  const bend=WIND*.9+(h01(1,3,POI_SEED)-.5)*.3;
  const sway=Math.sin(G.t*.03+POI_SEED%31)*.02;
  ctx.save();ctx.rotate(sway);
  /* ствол — согнут ветром, кверху тоньше; тёмная кора, светлая кромка */
  const tw=Math.max(2,w*.12);
  ctx.strokeStyle=dcol(pal,0,.8);ctx.lineWidth=tw*2;ctx.lineCap="round";
  ctx.beginPath();ctx.moveTo(0,4);ctx.quadraticCurveTo(bend*hgt*.25,-hgt*.5,bend*hgt*.6,-hgt*.92);ctx.stroke();
  ctx.strokeStyle=dcol(pal,3,1.1,.6);ctx.lineWidth=tw*.5;
  ctx.beginPath();ctx.moveTo(-tw*.6,0);ctx.quadraticCurveTo(bend*hgt*.25-tw*.6,-hgt*.5,bend*hgt*.6-tw*.4,-hgt*.9);ctx.stroke();
  /* одна крона, сдвинутая по ветру, плоская снизу */
  const cx=bend*hgt*.75,cy=-hgt*.98,cr=w*.9;
  ctx.fillStyle=dcol(pal,1,.75);
  ctx.beginPath();
  for(let s=0;s<=14;s++){const a=s/14*TAU;const rr=cr*(.8+h01(s,7,POI_SEED)*.3)*(Math.sin(a)>0?.55:1);
    const px=cx+Math.cos(a)*rr*1.5,py=cy+Math.sin(a)*rr*.6;s?ctx.lineTo(px,py):ctx.moveTo(px,py);}
  ctx.closePath();ctx.fill();
  ctx.fillStyle=dcol(pal,3,1.2,.35);
  ctx.beginPath();ctx.ellipse(cx-cr*.3*decoLitSide()*-1,cy-cr*.28,cr*.7,cr*.16,0,0,TAU);ctx.fill();
  ctx.restore();
}
/* ── камень ── */
function decoStack(A){
  const {pal,w,hgt}=A,ls=decoLitSide();
  const tiers=2+Math.floor(h01(1,3,POI_SEED)*2);
  let y=4,wd=w*1.6;
  for(let i=0;i<tiers;i++){
    const hh=hgt/tiers*(.8+h01(i,5,POI_SEED)*.4),off=(h01(i,7,POI_SEED)-.5)*w*.5;
    const pts=[];
    for(let s=0;s<9;s++){const a=s/9*TAU;const rr=(.85+h01(s,i+11,POI_SEED)*.3);
      pts.push([off+Math.cos(a)*wd*rr,y-hh*.5+Math.sin(a)*hh*.55*rr]);}
    /* тёмный низ, тело, освещённая кромка */
    /* валун — целиком в тоне породы, низ темнеет градиентом, а не срезом:
       прямоугольник под клипом на первом кадре читался висящей плитой */
    const gb=ctx.createLinearGradient(0,y-hh*1.05,0,y);
    gb.addColorStop(0,dcol(pal,2,1.05));gb.addColorStop(.55,dcol(pal,1,1));gb.addColorStop(1,dcol(pal,0,.8));
    ctx.fillStyle=gb;decoPoly(pts);ctx.fill();
    ctx.save();decoPoly(pts);ctx.clip();
    ctx.fillStyle=dcol(pal,4,1.15,.4);
    ctx.beginPath();ctx.ellipse(off+ls*wd*.45,y-hh*.92,wd*.45,hh*.16,ls*.3,0,TAU);ctx.fill();
    ctx.fillStyle="rgba(0,0,0,.22)";
    ctx.beginPath();ctx.ellipse(off-ls*wd*.5,y-hh*.35,wd*.5,hh*.5,0,0,TAU);ctx.fill();
    ctx.restore();
    /* трещина */
    ctx.strokeStyle="rgba(0,0,0,.45)";ctx.lineWidth=1.2;
    ctx.beginPath();ctx.moveTo(off-wd*.2,y-hh*.9);ctx.lineTo(off+wd*.05,y-hh*.55);ctx.lineTo(off-wd*.08,y-hh*.2);ctx.stroke();
    y-=hh*.92;wd*=.72;
  }
  /* лишайник — плоское пятно сверху */
  ctx.fillStyle=dcol(pal,3,1.05,.5);ctx.beginPath();ctx.ellipse(0,y+hgt*.06,wd*.9,hgt*.03,0,0,TAU);ctx.fill();
}
function decoBoulderLone(A){
  const {pal,w,hgt}=A,ls=decoLitSide();
  const pts=[];for(let s=0;s<11;s++){const a=s/11*TAU;const rr=.8+h01(s,3,POI_SEED)*.4;pts.push([Math.cos(a)*w*1.3*rr,-hgt*.5+Math.sin(a)*hgt*.5*rr]);}
  const gb=ctx.createLinearGradient(0,-hgt,0,0);
  gb.addColorStop(0,dcol(pal,2,1.05));gb.addColorStop(.6,dcol(pal,1,1));gb.addColorStop(1,dcol(pal,0,.8));
  ctx.fillStyle=gb;decoPoly(pts);ctx.fill();
  ctx.save();decoPoly(pts);ctx.clip();
  ctx.fillStyle=dcol(pal,4,1.15,.4);ctx.beginPath();ctx.ellipse(ls*w*.5,-hgt*.9,w*.55,hgt*.16,ls*.3,0,TAU);ctx.fill();
  ctx.fillStyle="rgba(0,0,0,.22)";ctx.beginPath();ctx.ellipse(-ls*w*.6,-hgt*.35,w*.6,hgt*.5,0,0,TAU);ctx.fill();
  ctx.restore();
}
/* ── лёд ── */
function decoHummock(A){
  const {pal,w,hgt}=A,ls=decoLitSide();
  const n=2+Math.floor(h01(1,3,POI_SEED)*2);
  for(let i=0;i<n;i++){
    const bx=(i-(n-1)/2)*w*1.1,hh=hgt*(.6+h01(i,5,POI_SEED)*.5),bw=w*(.8+h01(i,7,POI_SEED)*.5);
    const pts=[[bx-bw,4],[bx-bw*.7,-hh*.55],[bx-bw*.2,-hh],[bx+bw*.35,-hh*.85],[bx+bw*.75,-hh*.4],[bx+bw,4]];
    ctx.fillStyle=dcol(pal,1,1);decoPoly(pts);ctx.fill();
    /* синяя тень внутри — тёмный треугольник в глубине тороса */
    ctx.fillStyle="rgba(40,80,140,.28)";decoPoly([[bx-bw*.5,-hh*.2],[bx,-hh*.75],[bx+bw*.4,-hh*.2]]);ctx.fill();
    /* просвечивающая кромка со стороны звезды и карниз снега */
    ctx.strokeStyle="rgba(235,245,255,.75)";ctx.lineWidth=1.6;
    ctx.beginPath();ctx.moveTo(bx+ls*bw*.75,-hh*.4);ctx.lineTo(bx+ls*bw*.3,-hh*.9);ctx.stroke();
    ctx.fillStyle=dcol(pal,4,1.2,.9);decoPoly([[bx-bw*.25,-hh],[bx+bw*.38,-hh*.86],[bx+bw*.42,-hh*.8],[bx-bw*.3,-hh*.94]]);ctx.fill();
  }
}
function decoSpire(A){
  const {pal,w,hgt}=A,ls=decoLitSide();
  const lean=(h01(1,3,POI_SEED)-.5)*w*.6;
  ctx.fillStyle=dcol(pal,1,.95);
  decoPoly([[-w*.7,4],[-w*.25+lean*.6,-hgt*.55],[lean,-hgt],[w*.2+lean*.6,-hgt*.5],[w*.75,4]]);ctx.fill();
  ctx.fillStyle="rgba(40,80,140,.3)";decoPoly([[-w*.3,4],[lean*.5,-hgt*.5],[lean,-hgt],[-w*.1+lean*.6,-hgt*.5]]);ctx.fill();
  ctx.fillStyle="rgba(235,245,255,.7)";decoPoly([[ls*w*.75,4],[ls*w*.2+lean*.6,-hgt*.5],[lean,-hgt],[lean+ls*w*.06,-hgt*.94],[ls*w*.3+lean*.6,-hgt*.48],[ls*w*.9,4]]);ctx.fill();
  ctx.fillStyle=dcol(pal,4,1.25,.8);decoPoly([[lean-w*.1,-hgt*.9],[lean,-hgt],[lean+w*.12,-hgt*.9],[lean+w*.1,-hgt*.86],[lean-w*.08,-hgt*.86]]);ctx.fill();
}
/* ── вулкан ── */
function decoCone(A){
  const {pal,w,hgt}=A,ls=decoLitSide();
  const base=w*2.2,top=w*.55;
  ctx.fillStyle="rgb(24,20,20)";decoPoly([[-base,4],[-top,-hgt],[top,-hgt],[base,4]]);ctx.fill();
  ctx.fillStyle=dcol(pal,2,.7,.6);decoPoly([[ls*base,4],[ls*top,-hgt],[ls*top*.4,-hgt],[ls*base*.55,4]]);ctx.fill();
  /* тёплая трещина по склону */
  const gl=ctx.createLinearGradient(0,-hgt*.9,0,0);gl.addColorStop(0,"rgba(255,150,60,.95)");gl.addColorStop(1,"rgba(180,40,20,0)");
  ctx.strokeStyle=gl;ctx.lineWidth=Math.max(1.5,w*.08);ctx.lineCap="round";
  ctx.beginPath();ctx.moveTo(-top*.3,-hgt*.9);ctx.lineTo(-top*.6,-hgt*.55);ctx.lineTo(-base*.35,-hgt*.2);ctx.stroke();
  /* жерло и прямой столб дыма — ветер его слегка сносит, но он столб */
  ctx.fillStyle="rgba(255,120,50,.55)";ctx.beginPath();ctx.ellipse(0,-hgt,top*.7,top*.22,0,0,TAU);ctx.fill();
  const sm=ctx.createLinearGradient(0,-hgt,WIND*40,-hgt*2.6);
  sm.addColorStop(0,"rgba(70,60,60,.55)");sm.addColorStop(1,"rgba(70,60,60,0)");
  ctx.fillStyle=sm;decoPoly([[-top*.5,-hgt],[top*.5,-hgt],[top*1.6+WIND*40,-hgt*2.6],[-top*1.6+WIND*40,-hgt*2.6]]);ctx.fill();
}
function decoLavaTree(A){
  const {pal,w,hgt}=A;
  ctx.fillStyle="rgb(30,24,24)";
  /* ствол — застывшие потёки, каплями вниз */
  decoPoly([[-w*.5,4],[-w*.3,-hgt*.6],[-w*.15,-hgt],[w*.15,-hgt],[w*.3,-hgt*.6],[w*.5,4]]);ctx.fill();
  for(let i=0;i<5;i++){
    const a=(i/5-.5)*2.4,L=hgt*(.25+h01(i,3,POI_SEED)*.3);
    const ex=Math.sin(a)*L,ey=-hgt*.9+Math.abs(Math.cos(a))*L*.3;
    ctx.strokeStyle="rgb(30,24,24)";ctx.lineWidth=Math.max(2,w*.14);ctx.lineCap="round";
    ctx.beginPath();ctx.moveTo(0,-hgt*.92);ctx.quadraticCurveTo(ex*.5,ey-L*.2,ex,ey);ctx.stroke();
    /* капля застывшей лавы на конце — тёплая, слабо */
    ctx.fillStyle="rgba(220,90,40,.6)";ctx.beginPath();ctx.ellipse(ex,ey+L*.12,w*.12,w*.2,0,0,TAU);ctx.fill();
  }
  ctx.fillStyle=dcol(pal,3,1.1,.35);ctx.fillRect(-w*.15,-hgt,w*.08,hgt*.9);
}
/* ── токсичный ── */
function decoPodTree(A){
  const {pal,w,hgt}=A;
  const sway=Math.sin(G.t*.025+POI_SEED%17)*.015;
  ctx.save();ctx.rotate(sway);
  ctx.strokeStyle=dcol(pal,0,.8);ctx.lineWidth=Math.max(2,w*.14);ctx.lineCap="round";
  ctx.beginPath();ctx.moveTo(0,4);ctx.lineTo((h01(1,3,POI_SEED)-.5)*w*.4,-hgt);ctx.stroke();
  const n=3+Math.floor(h01(2,5,POI_SEED)*3);
  for(let i=0;i<n;i++){
    const t=.45+i/n*.5,bx=(h01(1,3,POI_SEED)-.5)*w*.4*t,by=-hgt*t;
    const dir=(i%2?1:-1),L=w*(.9+h01(i,7,POI_SEED)*.7);
    ctx.strokeStyle=dcol(pal,0,.8);ctx.lineWidth=Math.max(1.2,w*.07);
    ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx+dir*L,by-L*.35);ctx.stroke();
    /* стручок висит, светится изнутри слабо */
    const px=bx+dir*L*.85,py=by-L*.3;
    ctx.strokeStyle=dcol(pal,1,.7);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px,py+hgt*.08);ctx.stroke();
    ctx.fillStyle=dcol(pal,3,1.1,.85);ctx.beginPath();ctx.ellipse(px,py+hgt*.08+w*.22,w*.14,w*.3,0,0,TAU);ctx.fill();
    ctx.fillStyle=dcol(pal,4,1.3,.5);ctx.beginPath();ctx.ellipse(px-w*.04,py+hgt*.08+w*.12,w*.05,w*.1,0,0,TAU);ctx.fill();
  }
  ctx.restore();
}
function decoBlister(A){
  const {pal,w,hgt}=A;
  const n=3+Math.floor(h01(1,3,POI_SEED)*3);
  /* светящаяся лужа у корней — сперва, под всем */
  ctx.fillStyle=dcol(pal,4,1.2,.35);ctx.beginPath();ctx.ellipse(0,2,w*1.6,hgt*.08,0,0,TAU);ctx.fill();
  for(let i=0;i<n;i++){
    const bx=(i-(n-1)/2)*w*.8,r2=w*(.4+h01(i,5,POI_SEED)*.4),hh=hgt*(.5+h01(i,7,POI_SEED)*.5);
    ctx.fillStyle=dcol(pal,1,.85);ctx.beginPath();ctx.ellipse(bx,-hh*.5,r2,hh*.55,0,0,TAU);ctx.fill();
    ctx.fillStyle=dcol(pal,3,1.15,.55);ctx.beginPath();ctx.ellipse(bx-r2*.3,-hh*.72,r2*.35,hh*.14,-.3,0,TAU);ctx.fill();
  }
}
/* ── океан ── */
function decoShoreTree(A){
  const {pal,w,hgt}=A;
  const lean=.55;   /* к воде — в сторону наклона, зеркало даёт flip */
  ctx.strokeStyle=dcol(pal,0,.8);ctx.lineCap="round";
  /* ходульные корни */
  ctx.lineWidth=Math.max(1.5,w*.08);
  for(let i=0;i<5;i++){const a=(i/4-.5)*1.4;ctx.beginPath();ctx.moveTo(Math.sin(a)*w*1.3,4);ctx.lineTo(Math.sin(a)*w*.25,-hgt*.22);ctx.stroke();}
  ctx.lineWidth=Math.max(2.5,w*.16);
  ctx.beginPath();ctx.moveTo(0,-hgt*.2);ctx.quadraticCurveTo(lean*hgt*.3,-hgt*.6,lean*hgt*.7,-hgt*.95);ctx.stroke();
  /* крона — три рваные массы вразнобой, свет редкими пятнами по верху:
     один диск с чистым светлым эллипсом на первом кадре читался зонтом (НЛО) */
  const cx=lean*hgt*.75,cy=-hgt;
  for(let m=0;m<3;m++){
    const mx=cx+(m-1)*w*.9+(h01(m,5,POI_SEED)-.5)*w*.5, my=cy+(m===1?-w*.25:w*.15)+(h01(m,9,POI_SEED)-.5)*w*.3;
    const br=w*(.75+h01(m,3,POI_SEED)*.35);
    ctx.fillStyle=dcol(pal,m===1?2:1,m===1?.9:.75,.95);
    ctx.beginPath();for(let s=0;s<=14;s++){const a=s/14*TAU;const rr=br*(.8+h01(s,m+3,POI_SEED)*.4)*(Math.sin(a)>0?1.15:1);
      const px=mx+Math.cos(a)*rr*1.25,py=my+Math.sin(a)*rr*.62;s?ctx.lineTo(px,py):ctx.moveTo(px,py);}
    ctx.closePath();ctx.fill();
    for(let s=0;s<2;s++){if(h01(m,s+41,POI_SEED)<.4)continue;
      /* свет — короткими штрихами в тоне отмели, не белыми: белые овалы читались иллюминаторами */
      ctx.fillStyle=dcol(pal,3,1.1,.35);ctx.beginPath();ctx.ellipse(mx+(h01(m,s+43,POI_SEED)-.5)*br*1.3,my-br*.38,br*.22,br*.06,-.12,0,TAU);ctx.fill();}
  }
}
function decoCoral(A){
  const {pal,w,hgt}=A,ls=decoLitSide();
  const n=3+Math.floor(h01(1,3,POI_SEED)*3);
  for(let i=0;i<n;i++){
    const bx=(i-(n-1)/2)*w*.5,hh=hgt*(.4+h01(i,5,POI_SEED)*.6),bw=w*(.18+h01(i,7,POI_SEED)*.16);
    ctx.fillStyle=dcol(pal,2,.9);
    decoPoly([[bx-bw,4],[bx-bw*.7,-hh*.6],[bx-bw*1.3,-hh*.85],[bx,-hh],[bx+bw*1.2,-hh*.8],[bx+bw*.7,-hh*.55],[bx+bw,4]]);ctx.fill();
    ctx.fillStyle=dcol(pal,4,1.2,.6);decoPoly([[bx+ls*bw*.7,-hh*.55],[bx+ls*bw*1.2,-hh*.8],[bx,-hh],[bx+ls*bw*.3,-hh*.9]]);ctx.fill();
  }
}
/* ── руины ── */
function decoStela(A){
  const {pal,w,hgt}=A,ls=decoLitSide();
  const tw=w*.55;
  /* тёмное тело против дымки — стела силуэтом, с обломанным плечом;
     светлый блок первого кадра терялся в небе, и зарубок было не видно */
  ctx.fillStyle=dcol(pal,0,.85);decoPoly([[-tw,4],[-tw*.9,-hgt],[-tw*.2,-hgt],[tw*.3,-hgt*.9],[tw*.85,-hgt*.88],[tw,4]]);ctx.fill();
  ctx.fillStyle=dcol(pal,3,1.1,.45);ctx.fillRect(ls*tw*.62,-hgt*.88,tw*.25,hgt*.86);
  /* зарубки — светлые, врезанные, счётом: ряды по четыре с косой чертой */
  ctx.strokeStyle=dcol(pal,4,1,.7);ctx.lineWidth=1.4;
  const rows=Math.floor(hgt*.5/12);
  for(let r0=0;r0<rows;r0++){const y=-hgt*.85+r0*12;
    for(let k=0;k<4;k++){ctx.beginPath();ctx.moveTo(-tw*.5+k*tw*.25,y);ctx.lineTo(-tw*.5+k*tw*.25,y+7);ctx.stroke();}
    if(h01(r0,7,POI_SEED)<.8){ctx.beginPath();ctx.moveTo(-tw*.6,y+6);ctx.lineTo(tw*.35,y+1);ctx.stroke();}
  }
  ctx.fillStyle="rgba(0,0,0,.3)";ctx.fillRect(-tw,-hgt*.1,tw*2,hgt*.1);
}
function decoAntenna(A){
  const {pal,w,hgt}=A;
  ctx.strokeStyle=dcol(pal,0,.85);ctx.lineWidth=Math.max(2,w*.1);ctx.lineCap="butt";
  /* балка косо, антенна из её конца */
  ctx.beginPath();ctx.moveTo(-w*.9,4);ctx.lineTo(w*.2,-hgt*.55);ctx.stroke();
  ctx.lineWidth=Math.max(1.2,w*.05);
  ctx.beginPath();ctx.moveTo(w*.2,-hgt*.55);ctx.lineTo(w*.25,-hgt);ctx.stroke();
  for(let i=0;i<3;i++){const y=-hgt*(.65+i*.11);ctx.beginPath();ctx.moveTo(w*.22-w*.35*(1-i*.25),y);ctx.lineTo(w*.24+w*.35*(1-i*.25),y);ctx.stroke();}
  /* тарелка */
  ctx.fillStyle=dcol(pal,2,1);ctx.beginPath();ctx.ellipse(w*.25,-hgt*.98,w*.3,w*.12,-.4,0,TAU);ctx.fill();
  ctx.fillStyle=dcol(pal,4,1.15,.5);ctx.beginPath();ctx.ellipse(w*.22,-hgt*.99,w*.14,w*.05,-.4,0,TAU);ctx.fill();
  /* обломки у комля */
  ctx.fillStyle=dcol(pal,1,.9);ctx.fillRect(-w*1.3,-hgt*.06,w*.7,hgt*.06);ctx.fillRect(w*.3,-hgt*.04,w*.5,hgt*.04);
}
function decoStair(A){
  const {pal,w,hgt}=A,ls=decoLitSide();
  const n=Math.max(4,Math.floor(hgt/12)),sw=w*1.6/n,sh=hgt/n;
  for(let i=0;i<n;i++){
    const x0=-w*.8+i*sw,y0=-sh*(i+1);
    /* ступени — светлые блоки с тёмной подступёнкой: тёмное тело на первом
       кадре сливалось с грунтом, и оставались одни светлые кромки — эквалайзер */
    ctx.fillStyle=dcol(pal,2,1);ctx.fillRect(x0,y0,sw+.5,sh*(i+1)+4);
    ctx.fillStyle=dcol(pal,4,1.1,.55);ctx.fillRect(x0,y0,sw,Math.max(1.2,sh*.22));
    ctx.fillStyle="rgba(0,0,0,.28)";ctx.fillRect(x0+(ls>0?0:sw*.65),y0+sh*.22,sw*.35,sh*(i+1));
  }
  /* верх обломан — лестница в никуда */
  ctx.fillStyle=dcol(pal,0,.8);decoPoly([[w*.8,-hgt],[w*.95,-hgt*.7],[w*.8,-hgt*.3],[w*.8,4]]);ctx.fill();
}
/* ── кристалл: осыпь между друзами ── */
function decoScree(A){
  const {pal,w,hgt}=A;
  for(let i=0;i<14;i++){
    const bx=(h01(i,3,POI_SEED)-.5)*w*3.2,s=2+h01(i,5,POI_SEED)*hgt*.35,ln=(h01(i,7,POI_SEED)-.5)*.6;
    ctx.fillStyle=dcol(pal,i%2?1:2,.95,.9);
    decoPoly([[bx-s*.6,4],[bx+ln*s,4-s*1.6],[bx+s*.6,4]]);ctx.fill();
    ctx.fillStyle="rgba(255,255,255,.35)";decoPoly([[bx+ln*s,4-s*1.6],[bx+s*.6,4],[bx+s*.3,4-s*.2]]);ctx.fill();
  }
}
/* ── землеподобная и джунгли: тот же навес с флагом ── */
function decoCrownRound(A){
  /* палитра землеподобной начинается с двух тонов воды — крона выходила синей;
     дереву отдаём землю и зелень: тёмный тёплый ствол, зелёные массы, светлые пятна */
  const pal=A.pal,tp=[[38,40,28],pal[2]||pal[0],pal[3]||pal[1],pal[4]||pal[2],pal[5]||pal[pal.length-1]];
  decoCanopy(Object.assign({},A,{round:1,pal:tp}));
}
function decoTwinCanopy(A){decoCanopy(Object.assign({},A,{twin:1}));}
Object.assign(DECO_FN,{
  butte:decoButte,drytree:decoDryTree,stack:decoStack,lonerock:decoBoulderLone,hummock:decoHummock,spire:decoSpire,
  cone:decoCone,lavatree:decoLavaTree,podtree:decoPodTree,blister:decoBlister,shoretree:decoShoreTree,coral:decoCoral,
  stela:decoStela,antenna:decoAntenna,stair:decoStair,scree:decoScree,crownround:decoCrownRound,twincanopy:decoTwinCanopy
});
/* регистрация семей: высоты в единицах мира — 5–8 ростов человека (FG_MAN 17) */
DECO_KINDS.push(
  {k:"butte",     on:"desert",  w:1.0,h:140},
  {k:"drytree",   on:"desert",  w:.8, h: 95},
  {k:"stack",     on:"rocky",   w:1.0,h:105},
  {k:"lonerock",  on:"rocky",   w:.7, h: 60},
  {k:"scree",     on:"rocky",   w:.5, h: 40},
  {k:"hummock",   on:"ice",     w:1.0,h: 75},
  {k:"spire",     on:"ice",     w:.8, h:150},
  {k:"cone",      on:"volcanic",w:1.0,h:125},
  {k:"lavatree",  on:"volcanic",w:.7, h: 90},
  {k:"podtree",   on:"toxic",   w:1.0,h:130},
  {k:"blister",   on:"toxic",   w:.8, h: 60},
  {k:"shoretree", on:"ocean",   w:1.0,h:120},
  {k:"coral",     on:"ocean",   w:.8, h: 90},
  {k:"stela",     on:"ruin",    w:.9, h:110},
  {k:"antenna",   on:"ruin",    w:.6, h:160},
  {k:"stair",     on:"ruin",    w:.7, h: 90},
  {k:"scree",     on:"crystal", w:.6, h: 40},
  {k:"crownround",on:"terran",  w:1.0,h:150},
  {k:"lonerock",  on:"terran",  w:.6, h: 60},
  {k:"twincanopy",on:"jungle",  w:.8, h:200}
);
