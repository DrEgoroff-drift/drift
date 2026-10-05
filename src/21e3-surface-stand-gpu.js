/* ══════════════ стоящее на поверхности — двойники видеокарты (G15) ══════════════
   То, что 21e1 ещё клало на #c, а 21e2 снимало снимком ради падающих теней: залежи,
   корабль, пыль. Каждое печётся один раз кистью 2D на GPU-холсте (lifeBaked) и ложится
   освещённым спрайтом (lifeSprite) в проход грунта ПОСЛЕ падающей тени — там же, где
   кусты. Когда на #c не останется ничего, снимок не нужен (surfCastGpu: cState 0 —
   ложь, не null), и ночью кусты и ходок тоже идут двойниками.
   Ложь из двойника — видеокарты нет или выпечка не вышла: рисует 2D, как прежде. */

/* залежь: тело выпечкой по (сырьё, остаток, место, палитра); блик «можно копать» —
   живой, от расстояния до игрока, — дугой из капсул. x,y — комель в кадре 2D */
function surfDepositGpu(pass,d,x,y,near,pal){
  if(!pass||!GPU.dev)return false;
  const ss=3,BW=84,BH=60,OX=42,OY=50;
  const key="dep|"+d.res+"|"+(d.left|0)+"|"+(d.x|0)+"|"+(pal?pal.join(","):"");
  const B=lifeBaked(key,BW*ss,BH*ss,g=>{g.translate(OX*ss,OY*ss);g.scale(ss,ss);
    drawDeposit(0,0,d.res,d.left,0,d.x,pal);});
  if(!B)return false;
  const h=lifeHere(x,y),s=h.s,L=lifeLight();
  /* своё гнездо и тень у залежи нарисованы в выпечке — тень спрайта не нужна */
  const ok=lifeSprite(pass,B,{x:h.x+(BW/2-OX)*s,y:h.y+(BH/2-OY)*s,w:BW*s,h:BH*s,base:OY/BH,lod:1.5,
    dim:lifeDim(d.x),shadow:false},Object.assign({},L,{k:(L.k==null?.8:L.k)*.6,rim:(L.rim==null?1:L.rim)*.4}));
  if(!ok)return false;
  if(near>0){
    /* размер тела — тем же потоком, что у drawDeposit (21b): первое число r() */
    const r=rng(hashi(d.x|0,d.left|0,0xDEB0)),k=clamp(.45+Math.min(1,(d.left||1)/9)*.55,0,1);
    const S=(14+r()*7)*k*s,cx=h.x,cy=h.y-S*.45,a=.16*near,A=[];
    const pt=t=>{const an=Math.PI*(1.15+.8*t);return [cx+Math.cos(an)*S*1.15,cy+Math.sin(an)*S*.85];};
    let q=pt(0);
    for(let i=1;i<=10;i++){const n=pt(i/10);A.push([2,q[0],q[1],n[0],n[1],.7*s,0,255,255,255,a]);q=n;}
    gpuShapes(pass,A,{blend:"over"});
  }
  return true;
}
