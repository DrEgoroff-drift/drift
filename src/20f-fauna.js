/* ══════════════ фауна ══════════════
   Отрезано от `20-life` 25.08.2026: файл держал в себе три разные жизни —
   человека в скафандре, растения и зверей, — и дорос до 45 КБ. Здесь звери:
   гамма шкуры, пять земных силуэтов и пять чужих, порождение особи и её
   отрисовка. Скафандр и флора остались в `20-life`.

   Мерило прежнее: человек. Зверь читается силуэтом раньше, чем деталями, и
   поза говорит больше окраса — потому «враждебен» и «оглушён» меняют стойку,
   а не цвет.

   Наверху зверьё безобидное — его сканируют ради данных. В шахте живут
   породные грызуны: кусают скафандр, оглушаются импульсом (ОГОНЬ), с
   оглушённого берут образец (ТОРМ) — углерод и редкий ксенобиом.
   Имя зверя выводится из архетипа и настоящих флагов (20e-species):
   «парусник» доставался ходуну, «бронированный» — медузе. */

/* натуральная гамма — мех/шкура/чешуя, без ядовитых неоновых тонов;
   лёгкий уклон от планеты и куда больший разброс светлота/охра/серость,
   чем радужный hue-поворот, который был раньше */
const FUR_TONES=[
  [101,72,42],[134,103,63],[168,138,94],[201,176,132],[221,201,163],
  [96,92,84],[132,128,118],[74,70,66],[47,44,40],
  [110,100,72],[86,96,72],[128,118,84],[150,132,96],[64,58,52]
];
function furColor(r,base){
  const a=pick(FUR_TONES,r), bT=pick(FUR_TONES,r);
  const m=.3+r()*.5;
  const lum=.82+r()*.36;
  return [
    clamp(lerp(a[0],bT[0],m)*lum+base[0]*.06,18,235),
    clamp(lerp(a[1],bT[1],m)*lum+base[1]*.06,18,235),
    clamp(lerp(a[2],bT[2],m)*lum+base[2]*.06,18,235)
  ];
}
/* силуэт — не всегда одна и та же капсула: пять архетипов пропорций плюс
   гранёный (не идеально гладкий) контур тела, свой на каждую тварь */
const BEAST_SHAPES=["capsule","long","stout","upright","segmented"];
/* Пять чужих архетипов вместо «земного зверя другого цвета». Как и у флоры,
   планета получает уклон: на одной висят медузы, на другой ходят панцирные —
   если каждый мир населён всем каталогом, миры опять сливаются.

   Летающие формы держатся над грунтом (hover) — это единственное, что тут
   отличается по механике отрисовки, и оно же сильнее всего меняет ощущение
   от планеты. */
const BEAST_ALIEN=["jelly","strider","crystal","manta","shell"];
function beastBias(p){
  if(p.fauna2)return p.fauna2;
  const r=rng(p.seed^0xFA02);
  const b=BEAST_ALIEN.map(()=>.08+r()*.18);
  const n=1+Math.floor(r()*2);
  for(let i=0;i<n;i++)b[Math.floor(r()*b.length)]+=1.1+r()*1.4;
  p.fauna2={bias:b,alienShare:.45+r()*.45};
  return p.fauna2;
}
/* Зверь собирается так же, как растение: вид планеты (20e-species) держит
   архетип, выделку тела, окрас и повадку, экземпляру принадлежит возраст —
   молодой мельче и головастее, старый крупнее и медленнее. */
function genBeast(r,p,x,gy){
  return specimenBeast(r,pickShare(faunaOf(p),r),x,gy);
}
/* ── чужие архетипы ──
   Не «зверь другого цвета»: медуза висит и пульсирует, ходун стоит на высоких
   дугах, кристаллическое насекомое гранёное и светится в шве, манта идёт
   волной по крылу, панцирный похож на камень, пока не пошёл. */
function drawBeastAlien(b,x,y,hostile,stun){
  const c=b.body;
  const col=(k,a)=>"rgba("+Math.round(c[0]*k)+","+Math.round(c[1]*k)+","+Math.round(c[2]*k)+","+a+")";
  const t=G.t*b.spd+b.phase;
  const R=b.r;
  const hov=b.hover?b.hover*(1+.16*Math.sin(t*.6)):0;
  ctx.save();
  ctx.translate(x,y-R*.9-hov);
  ctx.scale(b.face,1);
  if(stun>0){
    ctx.save();ctx.globalCompositeOperation="lighter";
    const g=ctx.createRadialGradient(0,0,0,0,0,R*2.6);
    g.addColorStop(0,"rgba(140,220,255,.3)");g.addColorStop(1,"rgba(120,200,255,0)");
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,R*2.6,0,TAU);ctx.fill();
    ctx.restore();
  }
  const hi=hostile?"rgba(255,120,90,.9)":col(1.25,.95);
  if(b.alien==="jelly"){
    /* купол пульсирует: сжался — потянулся вверх, это и есть его движение */
    const puls=.82+.18*Math.sin(t*1.6);
    const bw=R*1.25*puls, bh=R*.95/puls;
    ctx.fillStyle=col(.9,.62);
    ctx.beginPath();ctx.ellipse(0,0,bw,bh,0,Math.PI,TAU);ctx.fill();
    ctx.fillStyle=col(1.5,.28);
    ctx.beginPath();ctx.ellipse(-bw*.25,-bh*.35,bw*.4,bh*.32,0,0,TAU);ctx.fill();
    ctx.strokeStyle=col(.6,.5);ctx.lineWidth=1.2;
    ctx.beginPath();ctx.ellipse(0,0,bw,bh,0,Math.PI,TAU);ctx.stroke();
    /* щупальца тянутся вниз с задержкой по фазе */
    ctx.strokeStyle=col(1.1,.45);
    for(let i=0;i<b.tent;i++){
      const u=(i/(b.tent-1)-.5)*1.7;
      const sx=u*bw*.85;
      ctx.lineWidth=1+(1-Math.abs(u))*1.2;
      ctx.beginPath();ctx.moveTo(sx,0);
      const L=R*(1.6+Math.abs(u)*.9);
      ctx.quadraticCurveTo(sx+Math.sin(t*1.3+i)*R*.4,L*.55,
        sx+Math.sin(t*1.1+i*1.7)*R*.7,L);
      ctx.stroke();
    }
    ctx.save();ctx.globalCompositeOperation="lighter";
    const g=ctx.createRadialGradient(0,-bh*.2,0,0,-bh*.2,R*2.2);
    g.addColorStop(0,col(1.6,.20));g.addColorStop(1,col(1.6,0));
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,-bh*.2,R*2.2,0,TAU);ctx.fill();
    ctx.restore();
  }else if(b.alien==="strider"){
    /* шесть высоких дуг: тело висит вверху, ноги переступают попарно */
    const legH=R*2.2;
    ctx.strokeStyle=col(.65,.9);
    for(let i=0;i<6;i++){
      const side=i<3?-1:1, k=i%3;
      const px=(k-1)*R*.55;
      const step=Math.sin(t*1.4+i*2.1)*R*.5;
      ctx.lineWidth=1.6;
      ctx.beginPath();
      ctx.moveTo(px,0);
      ctx.quadraticCurveTo(px+side*R*1.1,legH*.45,px+step+side*R*.5,legH);
      ctx.stroke();
    }
    ctx.fillStyle=col(.95,.95);
    ctx.beginPath();ctx.ellipse(0,0,R*.95,R*.5,0,0,TAU);ctx.fill();
    ctx.strokeStyle=col(.55,.8);ctx.lineWidth=1;ctx.stroke();
    /* маленькая голова на длинной шее — по ней силуэт и опознаётся */
    ctx.strokeStyle=col(.7,.9);ctx.lineWidth=1.6;
    ctx.beginPath();ctx.moveTo(R*.7,-R*.2);
    ctx.quadraticCurveTo(R*1.5,-R*.9,R*1.7,-R*1.5);ctx.stroke();
    ctx.fillStyle=col(1.05,.95);
    ctx.beginPath();ctx.ellipse(R*1.75,-R*1.65,R*.34,R*.26,0,0,TAU);ctx.fill();
    ctx.fillStyle=hi;
    ctx.beginPath();ctx.arc(R*1.9,-R*1.7,1.6,0,TAU);ctx.fill();
  }else if(b.alien==="crystal"){
    /* гранёное тело: жёсткие плоскости и светящийся шов между ними */
    const P=[];
    for(let i=0;i<b.facets;i++){
      const a=i/b.facets*TAU;
      P.push([Math.cos(a)*R*(.9+((i*37)%5)/5*.5),Math.sin(a)*R*.62]);
    }
    ctx.beginPath();ctx.moveTo(P[0][0],P[0][1]);
    for(let i=1;i<P.length;i++)ctx.lineTo(P[i][0],P[i][1]);
    ctx.closePath();
    const g=ctx.createLinearGradient(-R,-R*.6,R,R*.6);
    g.addColorStop(0,col(1.5,.85));g.addColorStop(.5,col(.8,.9));g.addColorStop(1,col(1.2,.8));
    ctx.fillStyle=g;ctx.fill();
    ctx.strokeStyle="rgba(255,255,255,.35)";ctx.lineWidth=.8;ctx.stroke();
    ctx.strokeStyle=col(1.8,.5+.3*Math.sin(t*2));
    ctx.lineWidth=1.4;
    ctx.beginPath();ctx.moveTo(P[0][0],P[0][1]);ctx.lineTo(P[(b.facets>>1)][0],P[(b.facets>>1)][1]);
    ctx.stroke();
    /* тонкие ноги-иглы */
    ctx.strokeStyle=col(.6,.85);ctx.lineWidth=1;
    for(let i=0;i<6;i++){
      const px=(i%3-1)*R*.5, side=i<3?-1:1;
      const step=Math.sin(t*1.8+i)*R*.3;
      ctx.beginPath();ctx.moveTo(px,R*.3);
      ctx.lineTo(px+step+side*R*.6,R*1.25);ctx.stroke();
    }
    ctx.save();ctx.globalCompositeOperation="lighter";
    const gg=ctx.createRadialGradient(0,0,0,0,0,R*1.8);
    gg.addColorStop(0,col(1.9,.16));gg.addColorStop(1,col(1.9,0));
    ctx.fillStyle=gg;ctx.beginPath();ctx.arc(0,0,R*1.8,0,TAU);ctx.fill();
    ctx.restore();
  }else if(b.alien==="manta"){
    /* крыло идёт волной: три сегмента с разной фазой вместо жёсткой дуги */
    const S=R*b.span;
    for(const side of [-1,1]){
      ctx.beginPath();
      ctx.moveTo(0,0);
      const w1=Math.sin(t*1.5+(side>0?0:.9))*R*.5;
      const w2=Math.sin(t*1.5+1+(side>0?0:.9))*R*.7;
      ctx.quadraticCurveTo(side*S*.5,w1-R*.5,side*S,w2);
      ctx.quadraticCurveTo(side*S*.5,w1+R*.35,0,R*.45);
      ctx.closePath();
      const g=ctx.createLinearGradient(0,0,side*S,0);
      g.addColorStop(0,col(1.05,.92));g.addColorStop(1,col(.55,.55));
      ctx.fillStyle=g;ctx.fill();
      ctx.strokeStyle=col(.45,.6);ctx.lineWidth=1;ctx.stroke();
    }
    ctx.fillStyle=col(1.1,.95);
    ctx.beginPath();ctx.ellipse(0,R*.1,R*.42,R*.6,0,0,TAU);ctx.fill();
    ctx.fillStyle=hi;
    ctx.beginPath();ctx.arc(R*.18,-R*.05,1.5,0,TAU);ctx.fill();
    /* хвост-жало */
    ctx.strokeStyle=col(.7,.7);ctx.lineWidth=1.2;
    ctx.beginPath();ctx.moveTo(0,R*.6);
    ctx.quadraticCurveTo(-R*.3,R*1.4,-R*.1+Math.sin(t)*R*.3,R*2.1);ctx.stroke();
  }else{
    /* панцирный: купол-камень на коротких ногах, пока стоит — не отличить
       от валуна, и в этом весь смысл */
    ctx.fillStyle=col(.5,.95);
    for(let i=0;i<4;i++){
      const px=(i-1.5)*R*.5;
      const step=Math.sin(t*1.6+i*1.6)*R*.22;
      ctx.fillRect(px-1.2,R*.2,2.4,R*.6+step);
    }
    const g=ctx.createLinearGradient(0,-R*.9,0,R*.3);
    g.addColorStop(0,col(1.35,.95));g.addColorStop(1,col(.55,.95));
    ctx.fillStyle=g;
    ctx.beginPath();ctx.ellipse(0,R*.15,R*1.15,R*.85,0,Math.PI,TAU);ctx.fill();
    ctx.strokeStyle=col(.35,.8);ctx.lineWidth=1.2;ctx.stroke();
    /* рёбра панциря */
    ctx.strokeStyle="rgba(0,0,0,.22)";ctx.lineWidth=1;
    for(let i=1;i<4;i++){
      const u=i/4*2-1;
      ctx.beginPath();
      ctx.ellipse(0,R*.15,R*1.15*Math.abs(u),R*.85*Math.abs(u),0,Math.PI,TAU);
      ctx.stroke();
    }
    /* голова выглядывает только на ходу */
    if(Math.abs(b.vx)>.02){
      ctx.fillStyle=col(.9,.95);
      ctx.beginPath();ctx.ellipse(R*1.15,R*.05,R*.3,R*.22,0,0,TAU);ctx.fill();
      ctx.fillStyle=hi;
      ctx.beginPath();ctx.arc(R*1.3,0,1.4,0,TAU);ctx.fill();
    }
  }
  /* свечение чужих архетипов рисовалось только у земных форм: панцирник,
     названный светящимся, не светился (M174 — имя обязано быть правдой) */
  if(b.glow){
    ctx.save();ctx.globalCompositeOperation="lighter";
    const gg=ctx.createRadialGradient(0,0,0,0,0,R*2.2);
    gg.addColorStop(0,col(1.5,.20));gg.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=gg;ctx.beginPath();ctx.arc(0,0,R*2.2,0,TAU);ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
/* тело собирается из тех же частей, но пропорции, силуэт и набор — от seed */
function drawBeast(b,x,y,hostile,stun){
  if(b.alien){drawBeastAlien(b,x,y,hostile,stun);return;}
  const c=b.body;
  const col=(k,a)=>"rgba("+Math.round(c[0]*k)+","+Math.round(c[1]*k)+","+Math.round(c[2]*k)+","+a+")";
  const t=G.t*b.spd+b.phase;
  const bob=b.hop?Math.abs(Math.sin(t))*b.r*.35:Math.sin(t)*b.r*.08;
  ctx.save();ctx.translate(x,y-b.r*.9-bob);ctx.scale(b.face,1);
  if(stun>0){
    ctx.save();ctx.globalCompositeOperation="lighter";
    const g=ctx.createRadialGradient(0,0,0,0,0,b.r*2.6);
    g.addColorStop(0,"rgba(140,220,255,.3)");g.addColorStop(1,"rgba(120,200,255,0)");
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,b.r*2.6,0,TAU);ctx.fill();
    ctx.restore();
  }
  /* ноги */
  ctx.strokeStyle=col(.55,1);ctx.lineWidth=Math.max(1,b.r*.16);ctx.lineCap="round";
  for(let i=0;i<b.legs;i++){
    const u=(i/(b.legs-1||1)-.5)*1.7;
    const sw=stun>0?0:Math.sin(t*2+i*1.9)*b.r*.3;
    ctx.beginPath();
    ctx.moveTo(u*b.r*.8*b.bx,b.r*.35*b.by);
    ctx.lineTo(u*b.r*.9*b.bx+sw,b.r*.95);
    ctx.stroke();
  }
  ctx.lineCap="butt";
  if(b.tail){
    ctx.strokeStyle=col(.7,1);ctx.lineWidth=Math.max(1,b.r*.22);
    ctx.beginPath();ctx.moveTo(-b.r*.8*b.bx,-b.r*.1);
    ctx.quadraticCurveTo(-b.r*1.7*b.bx,-b.r*.5-Math.sin(t*1.6)*b.r*.3,
                         -b.r*1.9*b.bx,b.r*.2);ctx.stroke();
  }
  /* туловище: гранёный многоугольник (не гладкий эллипс), каждая грань
     чуть светлее/темнее соседней — читается как настоящая полигональная форма */
  const P=b.poly;
  ctx.beginPath();
  ctx.moveTo(P[0][0]*b.r*b.bx,P[0][1]*b.r*b.by);
  for(let i=1;i<P.length;i++)ctx.lineTo(P[i][0]*b.r*b.bx,P[i][1]*b.r*b.by);
  ctx.closePath();
  const g=ctx.createLinearGradient(0,-b.r*b.by,0,b.r*b.by);
  g.addColorStop(0,col(1.15,1));g.addColorStop(1,col(.5,1));
  ctx.fillStyle=g;ctx.fill();
  for(let i=0;i<P.length;i++){
    const a=P[i],bN=P[(i+1)%P.length];
    ctx.beginPath();
    ctx.moveTo(a[0]*b.r*b.bx,a[1]*b.r*b.by);ctx.lineTo(bN[0]*b.r*b.bx,bN[1]*b.r*b.by);
    ctx.lineTo(0,0);ctx.closePath();
    ctx.fillStyle=col(((i&1)?1.22:.92),.16);ctx.fill();
  }
  ctx.strokeStyle=col(.35,.9);ctx.lineWidth=1;ctx.stroke();
  /* шерсть: короткие штрихи по контуру, торчащие наружу */
  ctx.strokeStyle=col(.6,.7);ctx.lineWidth=Math.max(.6,b.r*.05);
  for(let i=0;i<b.furTufts;i++){
    const a=(i/b.furTufts)*TAU;
    const px=Math.cos(a)*b.r*b.bx*.95,py=Math.sin(a)*b.r*b.by*.95;
    const nx=Math.cos(a),ny=Math.sin(a)*.8;
    ctx.beginPath();ctx.moveTo(px,py);
    ctx.lineTo(px+nx*b.r*.22,py+ny*b.r*.22);ctx.stroke();
  }
  for(let i=0;i<b.spots;i++){
    ctx.fillStyle=col(1.4,.5);
    ctx.beginPath();ctx.arc(-b.r*.4*b.bx+i*b.r*.42,-b.r*.2+((i*7)%3)*b.r*.22,b.r*.14,0,TAU);ctx.fill();
  }
  if(b.crest){
    ctx.fillStyle=col(1.3,.85);
    ctx.beginPath();ctx.moveTo(-b.r*.3,-b.r*.75*b.by);
    ctx.lineTo(0,-b.r*1.5*b.by);ctx.lineTo(b.r*.35,-b.r*.7*b.by);ctx.closePath();ctx.fill();
  }
  /* голова */
  const hx=b.r*b.headX,hs=b.r*b.headSize;
  ctx.fillStyle=col(1.05,1);
  ctx.beginPath();ctx.arc(hx,-b.r*.3*b.by,hs,0,TAU);ctx.fill();
  ctx.strokeStyle=col(.35,.9);ctx.stroke();
  if(b.ears){
    ctx.fillStyle=col(.8,1);
    for(const s of [-1,1]){
      ctx.beginPath();ctx.ellipse(hx+s*hs*.3,-b.r*.3*b.by-hs*.85,b.r*.16,b.r*.34,s*.4,0,TAU);ctx.fill();
    }
  }
  if(hostile){
    /* жвалы — единственное, что отличает шахтную форму */
    ctx.strokeStyle=col(.4,1);ctx.lineWidth=Math.max(1.2,b.r*.18);
    for(const s of [-1,1]){
      ctx.beginPath();ctx.moveTo(hx+hs*.5,-b.r*.3*b.by+s*b.r*.2);
      ctx.lineTo(hx+hs*1.05,-b.r*.3*b.by+s*b.r*.55);ctx.stroke();
    }
  }
  /* глаз */
  const blink=Math.sin(G.t*.05+b.phase*3)>.96;
  ctx.fillStyle=stun>0?"#6fa8c8":(hostile?"#ff6b57":b.eye);
  if(blink&&stun<=0){
    ctx.fillRect(hx+hs*.05,-b.r*.3*b.by-hs*.2,hs*.4,hs*.15);
  }else{
    ctx.beginPath();ctx.arc(hx+hs*.2,-b.r*.3*b.by-hs*.1,hs*.22,0,TAU);ctx.fill();
    if(!hostile){ctx.fillStyle="rgba(255,255,255,.9)";
      ctx.beginPath();ctx.arc(hx+hs*.28,-b.r*.3*b.by-hs*.22,hs*.08,0,TAU);ctx.fill();}
  }
  if(b.glow){
    ctx.save();ctx.globalCompositeOperation="lighter";
    const gg=ctx.createRadialGradient(0,0,0,0,0,b.r*2.2);
    gg.addColorStop(0,col(1.4,.18));gg.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=gg;ctx.beginPath();ctx.arc(0,0,b.r*2.2,0,TAU);ctx.fill();
    ctx.restore();
  }
  ctx.restore();
  if(stun>0){
    ctx.fillStyle="rgba(160,225,255,.85)";ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
    ctx.fillText("ОГЛУШЁН",x,y-b.r*2.6);
  }
}
