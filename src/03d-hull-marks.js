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
