/* ══════════════ стоящее на поверхности — двойники видеокарты (G15) ══════════════
   То, что 21e1 ещё клало на #c, а 21e2 снимало снимком ради падающих теней: залежи,
   корабль, пыль. Каждое печётся один раз кистью 2D на GPU-холсте (lifeBaked) и ложится
   освещённым спрайтом (lifeSprite) в проход грунта ПОСЛЕ падающей тени — там же, где
   кусты. Когда на #c не останется ничего, снимок не нужен (surfCastGpu: cState 0 —
   ложь, не null), и ночью кусты и ходок тоже идут двойниками.
   Ложь из двойника — видеокарты нет или выпечка не вышла: стоящее в кадре молчит. */


/* трава на кромке (19 drawGroundGrass) капсулами фигур: те же места, формы и ветер; дуга кустика —
   двумя звеньями. Белый блик, в падающей тени гребня — втрое тусклее (M434) */
function groundGrassGpu(pass,tr,camx,camy){
  if(!pass||!GPU.dev)return false;
  const i0=clamp(Math.floor((camx-40)/tr.step),0,tr.N-1),i1=clamp(Math.ceil((camx+W+40)/tr.step),0,tr.N-1);
  const dstep=Math.max(1,Math.round(14/tr.step)),live=(typeof castLive==="function");
  const o=lifeHere(0,0),s=o.s,hw=.5*s,A=[];
  let a=.14;
  const seg=(x0,y0,x1,y1)=>A.push([2,o.x+x0*s,o.y+y0*s,o.x+x1*s,o.y+y1*s,hw,.9,255,255,255,a]);
  const quad=(x0,y0,cx,cy,x1,y1)=>{const mx=.25*x0+.5*cx+.25*x1,my=.25*y0+.5*cy+.25*y1;seg(x0,y0,mx,my);seg(mx,my,x1,y1);};
  for(let i=i0;i<i1;i+=dstep){
    const wx=i*tr.step,x=wx-camx;if(x<-6||x>W+6)continue;
    const hh=hashi(Math.floor(wx/14),tr.sseed,0x6E55);
    if((hh&7)===0||(hh&3)===0)continue;
    const y=tr.h[i]-camy,th=2+((hh>>>4)&3);
    const sw=WIND*(1.6+th*.5)*(.7+.3*Math.sin(G.t*.045+wx*.07));
    const form=(hh>>>8)&3;
    a=(live&&castLive(tr,wx)>.5)?.05:.14;
    if(form===1){for(let b=-1;b<=1;b++)seg(x+b*.8,y,x+b*2.2+sw*1.2,y-th+Math.abs(b));}
    else if(form===2){
      quad(x-2.2,y,x-1.2+sw*.4,y-th*.9,x+sw*.6,y-th*.7);
      quad(x+2.2,y,x+1.2+sw*.4,y-th*.9,x+sw*.6,y-th*.7);
    }else seg(x,y,x+((hh>>>2)&1?1.4:-1.4)+sw,y-th);
  }
  if(A.length)gpuShapes(pass,A,{blend:"over"});
  return true;
}
/* пыль/пыльца в воздухе (19 drawDustMotes) кружками фигур; тот же поток чисел, тот же
   ветер. x,y — в осях мира 2D, кадр — через lifeHere */
function dustMotesGpu(pass,camx,camy,p){
  if(!pass||!GPU.dev)return false;
  if(p.T.atm==="отсутствует")return true;
  const o=lifeHere(0,0),s=o.s,A=[];
  for(let i=0;i<26;i++){
    const r=rng(hashi(Math.floor(p.seed),i,0xD05));
    const wx=(r()*3000+G.t*(6+r()*10)*(1+WIND*1.6))%3000;
    const x=((wx-camx*.6)%(W+60)+W+60)%(W+60)-30;
    const y=(r()*H*.8+Math.sin(G.t*.03+i)*14+WIND*Math.sin(G.t*.02+i*2)*8);
    const a=+(.05+r()*.12).toFixed(2),rad=.8+r()*1.2;
    A.push([1,o.x+x*s,o.y+y*s,rad*s,0,0,0,255,255,255,a]);
  }
  gpuShapes(pass,A,{blend:"over"});
  return true;
}

/* ── подписи поверхности: строка на тёмной плашке ──
   В #ovl (08bi: domLabel и ovRect под ней), над миром, без #c. x,y — якорь строки
   (центр, базовая линия) в мерке мира 2D; pa — плотность плашки, 0 — без плашки; k — ключ. */

/* ── передний план не в фокусе ──
   Был на #c (21b) и уходил снимком с размытием (21e2). 2D-кисть снята; глубина
   резкости у кромки — в кадре планеты. */

/* ── корабль на стоянке ──
   Двойник: тело — выпечкой корабля посадки (19g, lgLanderBake) под светом мира, как ходок
   и кусты (20fa). Падающая тень — силуэтом той же выпечки и пятнами касания; огни —
   маяк, тлеющие сопла, свет люка, ночное окно — мягкими фигурами. 2D-пути нет. */
