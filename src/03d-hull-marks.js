function drawStencils(h){
  const P=h.prof,S=h.seed;
  /* решётка забора у миделя: ряд коротких линий поперёк, с обоих бортов */
  for(const s of [1,-1]){
    const gx=lerp(h.nose*.5,h.tail*.2,((S>>>4)&7)/7);
    const gw=profW(P,gx);
    if(gw>1.6){
      ctx.strokeStyle="rgba(0,0,0,.42)";ctx.lineWidth=.4;
      for(let k=0;k<5;k++){
        const y=gw*(.32+k*.1)*s;
        ctx.beginPath();ctx.moveTo(gx-1.6,y);ctx.lineTo(gx+1.6,y);ctx.stroke();
      }
    }
  }
  /* лючки: квадрат с двумя болтами и номером рядом. Пять штук по семени */
  for(let i=0;i<5;i++){
    const hh=hashi(i,S,0x2B71);
    const x=lerp(h.nose*.78,h.tail*.86,((hh>>>3)&31)/31);
    const w=profW(P,x);if(w<1.4)continue;
    const y=(((hh>>>9)&15)/15-.5)*w*1.3, sz=.8+((hh>>>14)&3)*.35;
    ctx.fillStyle="rgba(0,0,0,.22)";ctx.fillRect(x-sz,y-sz*.7,sz*2,sz*1.4);
    ctx.strokeStyle="rgba(255,255,255,.14)";ctx.lineWidth=.35;
    ctx.strokeRect(x-sz,y-sz*.7,sz*2,sz*1.4);
    ctx.fillStyle="rgba(0,0,0,.4)";
    ctx.fillRect(x-sz+.2,y-sz*.7+.2,.35,.35);
    ctx.fillRect(x+sz-.55,y+sz*.7-.55,.35,.35);
  }
  /* «зебра» у кормы: косые полосы, которыми метят то, обо что обжигаются */
  const zx=lerp(h.tail,h.nose,.10), zw=profW(P,zx);
  if(zw>1.8)for(const s of [1,-1]){
    ctx.save();
    ctx.beginPath();ctx.rect(zx-1.4,zw*.42*s-(s>0?0:zw*.42),2.8,zw*.42);
    ctx.clip();
    for(let k=-4;k<6;k++){
      ctx.fillStyle=(k&1)?"rgba(20,20,22,.65)":"rgba(214,150,44,.75)";
      ctx.beginPath();
      ctx.moveTo(zx-1.4+k*.8,zw*.9*s);ctx.lineTo(zx-1.4+k*.8+.8,zw*.9*s);
      ctx.lineTo(zx-1.4+k*.8+1.4,0);ctx.lineTo(zx-1.4+k*.8+.6,0);
      ctx.closePath();ctx.fill();
    }
    ctx.restore();
  }
  /* кокарда: круг с точкой, у половины корпусов. Опознавательный знак —
     то, из-за чего машина выглядит принадлежащей кому-то */
  if((S>>>7&3)&&h.bw>3){
    const cx=lerp(h.nose*.34,h.tail*.3,((S>>>11)&7)/7), cw=profW(P,cx);
    const cy=cw*.5*((S&1)?1:-1), cr=Math.min(1.7,cw*.34);
    ctx.strokeStyle=rgba(h.accent,.8);ctx.lineWidth=.6;
    ctx.beginPath();ctx.arc(cx,cy,cr,0,TAU);ctx.stroke();
    ctx.fillStyle=rgba(h.accent,.8);
    ctx.beginPath();ctx.arc(cx,cy,cr*.4,0,TAU);ctx.fill();
  }
  /* ── щели ──
     На листах между агрегатами всегда есть чёрный провал: не тень, а зазор,
     в который не попадает свет. Он и держит глубину — без него панели лежат
     в одной плоскости, как аппликация. Три-четыре узкие щели поперёк борта. */
  for(let i=0;i<4;i++){
    const hh=hashi(i+3,S,0x51D3);
    const x=lerp(h.nose*.55,h.tail*.8,((hh>>>3)&15)/15);
    const w=profW(P,x);if(w<1.5)continue;
    ctx.fillStyle="rgba(4,6,10,.55)";
    ctx.fillRect(x,-w*.82,.7,w*1.64);
    ctx.fillStyle="rgba(255,255,255,.09)";      // светлая кромка с одной стороны
    ctx.fillRect(x+.7,-w*.82,.3,w*1.64);
  }
  /* ── потёки ──
     Чистый металл бывает у модели, а не у машины. Тёмные полосы вниз по
     потоку от люков и стыков — самое дешёвое, что отличает вещь в работе */
  for(let i=0;i<5;i++){
    const hh=hashi(i+21,S,0x9C4);
    const x=lerp(h.nose*.6,h.tail*.7,((hh>>>3)&31)/31);
    const w=profW(P,x);if(w<1.2)continue;
    const y=(((hh>>>10)&15)/15-.5)*w*1.5;
    const g=ctx.createLinearGradient(x,0,x-2.5-((hh>>>16)&3),0);
    g.addColorStop(0,"rgba(30,26,22,.32)");
    g.addColorStop(1,"rgba(30,26,22,0)");
    ctx.fillStyle=g;
    ctx.fillRect(x-2.5-((hh>>>16)&3),y,2.5+((hh>>>16)&3),.7);
  }
  /* мелкая техническая надпись у люка: две-три группы. Читать нечего,
     замечать — есть что */
  ctx.fillStyle="rgba(20,24,30,.5)";
  for(let i=0;i<3;i++){
    const hh=hashi(i+9,S,0x77C1);
    const x=lerp(h.nose*.6,h.tail*.7,((hh>>>3)&15)/15);
    const w=profW(P,x);if(w<1.6)continue;
    const y=(((hh>>>8)&7)/7-.5)*w*1.2;
    for(let k=0;k<3+(hh&3);k++)ctx.fillRect(x+k*.55,y,.35,.5);
  }
}
/* ── пиратский борт ──
   Пират опознавался только силуэтом класса, а вблизи это был тот же
   аккуратный корабль с инвентарным номером. Пират — не другая машина, а
   машина с ЧУЖОЙ историей: номер закрашен полосой, поверх грунта наляпаны
   заплаты чужого тона, обшивка в подпалинах от собственных стволов. Ни одной
   новой формы — только следы на той же вещи.
   Рисуется ПОСЛЕ навески и номера: закрашивают ведь то, что уже нанесено, —
   в первом заходе мазок лёг под номер, и номер спокойно читался поверх. */
function drawPirateSkin(h){
  ctx.save();tracePoly(h.poly);ctx.clip();
  const P2=h.prof;
  ctx.fillStyle="rgba(38,34,30,.9)";
  ctx.fillRect(lerp(h.nose*.35,h.tail*.5,.5)-2.6,-h.bw*.62-2.6,5.2,5.2);
  for(let i=0;i<8;i++){
    const hh=hashi(i,h.seed,0xB17E);
    const x=lerp(h.nose*.8,h.tail*.9,((hh>>>3)&31)/31);
    const w=profW(P2,x);if(w<1.2)continue;
    const y=(((hh>>>9)&15)/15-.5)*w*1.5;
    const pw=1.6+((hh>>>14)&3)*1.1, ph=1.1+((hh>>>17)&3)*.8;
    ctx.fillStyle=((hh>>>19)&1)?"rgba(74,58,42,.75)":"rgba(48,54,60,.8)";
    ctx.fillRect(x-pw/2,y-ph/2,pw,ph);
    ctx.strokeStyle="rgba(10,9,7,.6)";ctx.lineWidth=.3;
    ctx.strokeRect(x-pw/2,y-ph/2,pw,ph);
  }
  /* подпалины у скулы — прямоугольным мазком, а не эллипсом: первый заход
     рисовал их дугой, и на стенде вылезли рыжие круги в полкорабля */
  ctx.fillStyle="rgba(22,16,12,.4)";
  for(let i=0;i<5;i++){
    const hh=hashi(i+5,h.seed,0xC0A1);
    const x=lerp(h.nose*.7,h.nose*.05,((hh>>>4)&7)/7), w=profW(P2,x);
    if(!(w>.5))continue;
    const y=w*.62*((hh&1)?1:-1);
    ctx.fillRect(x-1.2,y-.5,2.4+((hh>>>8)&3)*.5,1);
  }
  ctx.restore();
}
/* ── метки корпуса: шрамы, транзитная табличка, пломба, знак верфи (вынесены из 03e-hull-draw 22.10) ── */
/* ── шрамы (M482, дизайн 18.09): три рода, каждый — своя метка на обшивке ──
   ожог — тёмное пятно с рыжей каймой у кормы; вмятина — излом канта на борту
   с тенью; потёк — тёмная струйка от люка к корме. Рисуются в обрезке корпуса,
   печкой (ключ выпечки знает состав шрамов) */
function drawScars(h,id){
  if(typeof scarsOf!=="function")return;
  const S=shipData(id);if(!S)return;
  const sc=scarsOf(S);if(!sc.length)return;
  const L=h.len,bw=h.bw,r=rng(hashi(h.seed||1,0x5CA2,7));
  /* где именно (D18): шрам лежит на своей клетке чертежа — ожог на палубной
     клетке (трюм), излом у подвеса орудия, потёк у кормовой клетки (бак) */
  const P=(typeof planOf==="function")?planOf(id):null,cells=(P&&P.cells)||[];
  const pickCell=(kind,seed)=>{const L2=cells.filter(q=>q&&q.kind===kind);return L2.length?L2[hashi(seed,L2.length,0x5CA3)%L2.length]:null;};
  const M=(typeof mountsOf==="function")?mountsOf(id):[];
  for(const k of sc){
    if(k==="burn"){
      const q=pickCell("deck",h.seed|0);
      const x=q?q.x:h.tail+L*(.18+r()*.12),y=q?q.y:(r()*2-1)*bw*.3,R=bw*.55;
      const g=ctx.createRadialGradient(x,y,0,x,y,R);
      g.addColorStop(0,"rgba(16,12,10,.92)");g.addColorStop(.55,"rgba(40,26,16,.7)");g.addColorStop(.85,"rgba(150,70,30,.35)");g.addColorStop(1,"rgba(150,70,30,0)");
      ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(x,y,R*1.3,R*.8,r()*.6,0,TAU);ctx.fill();
      /* копоть языками от очага — чтобы читалось пожаром, а не тенью */
      ctx.strokeStyle="rgba(20,14,10,.55)";ctx.lineWidth=Math.max(.8,bw*.08);ctx.lineCap="round";
      for(let i=0;i<4;i++){const a=r()*TAU,l=R*(1.1+r()*.9);ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+Math.cos(a)*l*.5,y+Math.sin(a)*l*.5+bw*.1,x+Math.cos(a)*l,y+Math.sin(a)*l);ctx.stroke();}
    }else if(k==="bent"){
      const m=M.length?M[hashi(h.seed|0,M.length,0x5CA4)%M.length]:null;
      const s=m?(m.y<0?-1:1):(r()<.5?-1:1),x=m?m.x:h.tail+L*(.4+r()*.3),y=s*profW(h.prof,x)*.92,d=bw*.22;
      ctx.strokeStyle="rgba(0,0,0,.7)";ctx.lineWidth=1.8;
      ctx.beginPath();ctx.moveTo(x-d*1.6,y);ctx.lineTo(x-d*.3,y-s*d);ctx.lineTo(x+d*.6,y+s*d*.3);ctx.lineTo(x+d*1.8,y);ctx.stroke();
      ctx.strokeStyle="rgba(255,255,255,.28)";ctx.lineWidth=.6;
      ctx.beginPath();ctx.moveTo(x-d*1.4,y+s*.6);ctx.lineTo(x-d*.3,y-s*d+s*.6);ctx.stroke();
    }else if(k==="leak"){
      const q=pickCell("stern",(h.seed|0)+3);
      const x0=q?q.x+bw*.1:h.tail+L*(.5+r()*.2),y0=q?q.y:(r()*2-1)*bw*.35,len=L*.34;
      const g=ctx.createLinearGradient(x0,y0,x0-len,y0);
      g.addColorStop(0,"rgba(30,26,22,.7)");g.addColorStop(1,"rgba(30,26,22,0)");
      ctx.strokeStyle=g;ctx.lineWidth=Math.max(1.4,bw*.12);ctx.lineCap="round";
      ctx.beginPath();ctx.moveTo(x0,y0);ctx.quadraticCurveTo(x0-len*.5,y0+bw*.06,x0-len,y0+bw*.03);ctx.stroke();
      ctx.fillStyle="rgba(30,26,22,.6)";ctx.beginPath();ctx.arc(x0,y0,Math.max(.8,bw*.06),0,TAU);ctx.fill();
    }
  }
}
/* ── транзитные номера (M513, D25): жёлтая табличка с чёрной каймой у кормы,
   две строки «ТРАНЗИТ» — читается на ×2 и выше, на ×1 остаётся жёлтой меткой ── */
/* пломба Орднунга (M508, D24 18.09): свинцовая бляшка на проволоке поверх люка
   трюма у миделя, пока трюм опломбирован — только на своём корабле */
function drawSeal(h,id){
  if(!G.railSeal||id!==G.shipId)return;
  const x=h.tail+h.len*.42,r=Math.max(1.6,h.bw*.14);
  ctx.save();ctx.translate(x,0);
  ctx.strokeStyle="rgba(200,206,214,.8)";ctx.lineWidth=.45;
  ctx.beginPath();ctx.moveTo(-r*2.4,-r*.9);ctx.quadraticCurveTo(0,-r*1.8,r*2.4,-r*.9);ctx.stroke();
  ctx.beginPath();ctx.moveTo(-r*2.4,r*.9);ctx.quadraticCurveTo(0,r*1.8,r*2.4,r*.9);ctx.stroke();
  ctx.fillStyle="#8a9098";ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.fill();
  ctx.strokeStyle="#2a2e34";ctx.lineWidth=.35;ctx.stroke();
  ctx.fillStyle="#2a2e34";ctx.fillRect(-r*.55,-r*.12,r*1.1,r*.24);
  ctx.restore();
}
function drawTransitPlate(h,id){
  if(typeof regPending!=="function"||!regPending(id))return;
  const x=h.tail+h.len*.12,w=Math.max(4,h.bw*.5),hh=w*.42;
  ctx.save();ctx.translate(x,0);
  /* транзит просрочен — бумажка держится на одном углу и висит криво */
  const r=regOf(id);if(r&&now()>r.until){ctx.translate(-w/2,-hh/2);ctx.rotate(.32);ctx.translate(w/2,hh/2);}
  ctx.fillStyle="#e8c53a";ctx.fillRect(-w/2,-hh/2,w,hh);
  ctx.strokeStyle="#1a1408";ctx.lineWidth=.4;ctx.strokeRect(-w/2,-hh/2,w,hh);
  ctx.fillStyle="#1a1408";ctx.fillRect(-w*.38,-hh*.18,w*.76,hh*.14);ctx.fillRect(-w*.3,hh*.08,w*.6,hh*.14);
  ctx.restore();
}
/* знак верфи на заказанном корпусе (M480, дизайн-проход): то, что написано в
   характере стапеля, видно на борту — ради этого к державе и летят. Внутри
   обрезки по силуэту, до шрамов: ожог ложится и на знак */
function drawYardMark(h,id){
  const S=(typeof shipData==="function")?shipData(id):null;
  if(!S||!S.ordered||!S.by)return;
  const L=h.len,B=h.bw,x0=h.tail;
  ctx.save();
  if(S.by==="gt"){
    const P=(typeof powerOf==="function")?powerOf("gt"):{col:"#d8433a"};
    ctx.fillStyle=P.col||"#d8433a";ctx.globalAlpha=.85;ctx.fillRect(x0+L*.22,B*.14,L*.6,B*.16);
    ctx.globalAlpha=1;ctx.fillStyle="rgba(238,232,218,.82)";
    ctx.font="bold "+(B*.46).toFixed(2)+"px ui-monospace,monospace";ctx.textAlign="center";ctx.textBaseline="middle";
    paintText(ctx,"ПЛАН — ЗАКОН",x0+L*.52,-B*.18,L*.62);
  }else if(S.by==="co"){
    const C=["#ff4fa8","#3fd6ff","#ffe04a","#f4f4f4","#8a5cff"],n=10,w=L*.44/n;
    for(let i=0;i<n;i++){ctx.fillStyle=C[i%C.length];ctx.globalAlpha=.78;ctx.fillRect(x0+L*.3+i*w,B*.36,w*.9,B*.16);}
    ctx.globalAlpha=.9;ctx.fillStyle="#f4f4f4";ctx.font=(B*.14).toFixed(2)+"px ui-monospace,monospace";ctx.textBaseline="middle";
    paintText(ctx,"™",x0+L*.75,B*.44);
  }else if(S.by==="or"){
    const xa=h.nose-L*.22;                                                        /* носовая броня: светлая сталь на тёмном */
    ctx.fillStyle="rgba(168,176,186,.62)";ctx.fillRect(xa,-B*1.2,L*.34,B*2.4);
    ctx.strokeStyle="rgba(24,28,34,.85)";ctx.lineWidth=.45;ctx.beginPath();
    ctx.moveTo(xa,-B*1.2);ctx.lineTo(xa,B*1.2);ctx.moveTo(xa+L*.11,-B*1.2);ctx.lineTo(xa+L*.11,B*1.2);ctx.stroke();
    ctx.fillStyle="rgba(24,28,34,.85)";
    for(let y=-B*.8;y<=B*.8+.01;y+=B*.4){for(const dx of [B*.16,L*.11+B*.16]){ctx.beginPath();ctx.arc(xa+dx,y,Math.max(.3,B*.06),0,TAU);ctx.fill();}}
  }else if(S.by==="km"){
    const P=(typeof powerOf==="function")?powerOf("km"):{col:"#6f9cf2"};
    ctx.strokeStyle=P.col||"#6f9cf2";ctx.globalAlpha=.75;ctx.lineWidth=B*.11;ctx.lineCap="round";ctx.beginPath();
    for(let i=0;i<=24;i++){const t=i/24,x=x0+L*(.14+t*.72),y=Math.sin(t*Math.PI*2.2)*B*.42;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}
    ctx.stroke();
  }else if(S.by==="ra"){
    const xa=x0+L*.3,w=L*.17,y0=-B*.55,hh=B*.7;
    ctx.fillStyle="rgba(98,112,94,.88)";ctx.fillRect(xa,y0,w,hh);
    ctx.strokeStyle="rgba(40,30,18,.8)";ctx.lineWidth=.35;ctx.strokeRect(xa,y0,w,hh);
    ctx.fillStyle="rgba(236,214,170,.55)";                                         /* наплывы шва — по счёту */
    for(let x=xa;x<=xa+w+.01;x+=w/9){ctx.beginPath();ctx.arc(x,y0+hh,Math.max(.25,B*.045),0,TAU);ctx.fill();}
    for(let y=y0;y<=y0+hh+.01;y+=hh/5){ctx.beginPath();ctx.arc(xa,y,Math.max(.25,B*.045),0,TAU);ctx.fill();ctx.beginPath();ctx.arc(xa+w,y,Math.max(.25,B*.045),0,TAU);ctx.fill();}
  }else if(S.by==="hf"){
    const xa=h.nose-L*.3,r=Math.max(.8,B*.2);
    ctx.fillStyle="rgba(206,216,224,.85)";ctx.beginPath();ctx.arc(xa,-B*.28,r,0,TAU);ctx.fill();
    ctx.strokeStyle="rgba(40,48,56,.8)";ctx.lineWidth=.3;ctx.stroke();
    ctx.fillStyle="#56e0ff";ctx.beginPath();ctx.arc(xa+r*.25,-B*.28-r*.2,r*.28,0,TAU);ctx.fill();
    ctx.strokeStyle="rgba(86,224,255,.55)";ctx.lineWidth=B*.04;ctx.beginPath();ctx.moveTo(xa+r*1.3,-B*.28);ctx.lineTo(xa+L*.18,-B*.28);ctx.stroke();
  }
  ctx.restore();
}
