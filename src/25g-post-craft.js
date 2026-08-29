/* ══════════════ ателье открытки: ремесленные кисти (M250) ══════════════
   Вынесено из 25g-postcard по шву «печать»: сама открытка рисует места, а
   здесь живут приёмы, которыми она заканчивается, — зерно печати на синем
   шуме и акварельное пятно. Разбор приёмов — docs/DESIGN-craft.md §6–7.
   Правило то же, что у художника: ни G, ни собственной случайности. */
/* плитка зерна: ранги ниже порога → равномерная россыпь белых точек */
let PC_GRAIN=null;
function pcGrainTile(){
  if(PC_GRAIN)return PC_GRAIN;
  const S=64,t=blueNoise(),cv=document.createElement("canvas");
  cv.width=cv.height=S;
  const g=cv.getContext("2d"),im=g.createImageData(S,S);
  for(let i=0;i<S*S;i++){
    im.data[i*4]=im.data[i*4+1]=im.data[i*4+2]=255;
    im.data[i*4+3]=t[i]<.012?255:0;
  }
  g.putImageData(im,0,0);
  return PC_GRAIN=cv;
}
/* ── акварель: пятно из полупрозрачных слоёв (M250, DESIGN-craft §6) ──
   Форма не заливается — она складывается из стопки слоёв по 4–6% плотности,
   каждый — своя деформация ОДНОГО базового многоугольника: середина ребра
   сдвигается гауссом, ребро делится надвое, дисперсия наследуется с
   убыванием. Даёт край, который где-то мягче, где-то твёрже — у заливки и у
   радиального градиента такого края не бывает. Вся случайность — из
   переданного генератора: открытка обязана рисоваться одинаково. */
function pcDeform(pts,vs,r,rounds){
  for(let t=0;t<rounds;t++){
    const np=[],nv=[];
    for(let i=0;i<pts.length;i++){
      const a=pts[i],b=pts[(i+1)%pts.length],v=vs[i];
      const gx=(r()+r()+r())/1.5-1,gy2=(r()+r()+r())/1.5-1;
      np.push(a,[(a[0]+b[0])/2+gx*v,(a[1]+b[1])/2+gy2*v]);
      nv.push(v*(.35+r()*.35),v*(.35+r()*.35));
    }
    pts=np;vs=nv;
  }
  return pts;
}
function pcWash(c,r,cx,cy,rx,ry,fill,layers){
  const n0=8,base=[],vs0=[];
  for(let i=0;i<n0;i++){
    const a=i/n0*TAU;
    base.push([cx+Math.cos(a)*rx*(.75+r()*.5),cy+Math.sin(a)*ry*(.75+r()*.5)]);
    vs0.push(rx*(.10+r()*.16));
  }
  const bp=pcDeform(base,vs0,r,3);
  for(let L=0;L<layers;L++){
    const pts=pcDeform(bp,bp.map(()=>rx*.05+r()*rx*.05),r,2);
    c.fillStyle=fill;
    c.beginPath();
    for(let i=0;i<pts.length;i++)i?c.lineTo(pts[i][0],pts[i][1]):c.moveTo(pts[i][0],pts[i][1]);
    c.closePath();c.fill();
  }
}
/* ── туманность вакуумных карточек (M252) ──
   Пустота «не чёрная — за спиной галактика» (правило pcBelt): теперь галактика
   и рисуется — два-три акварельных сгущения в глухом сине-ржавом, вытянутые по
   одной диагонали. Слой в 3–4% плотности края не имеет: это сгущение, а не
   предмет. Генератор свой — звёзды существующих карточек не должны сдвинуться. */
function pcNebula(c,seed,w,h){
  const r=rng(hashi(seed,0x4EB,9));
  const ang=(r()-.5)*.9;
  const tints=[[46,52,96],[96,54,44],[58,42,84]];
  const n=2+(r()<.4?1:0);
  for(let i=0;i<n;i++){
    const cx=w*(.18+r()*.64), cy=h*(.15+r()*.55);
    const rx=w*(.22+r()*.20), ry=rx*(.28+r()*.20);
    c.save();c.translate(cx,cy);c.rotate(ang);c.translate(-cx,-cy);
    pcWash(c,r,cx,cy,rx,ry,pcA(tints[i%3],.042),7);
    c.restore();
  }
}
