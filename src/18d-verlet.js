/* ══════════════ верле: верёвки и ткань ══════════════
   M245. Автор прислал ссылки на чужие демо — ткань, которую тянут мышкой, дым,
   частицы — со словами «люди уже придумали за нас». Правильно; брать надо не
   демо, а ПРИЁМ, и вешать его на вещи мира, а не на чёрный фон.

   Здесь самый полезный из них: интегрирование по Верле. Точка помнит своё
   прошлое положение, скорость нигде не хранится, связь между точками —
   одно вычитание в цикле. Тридцать точек и три прохода связей стоят
   микросекунды, а дают то, чего в игре не было ни у одной вещи: провис,
   инерцию и отклик на ветер.

   ЧТО ЭТО ЧИНИТ. Прямые линии там, где должна быть рука: трос копра шёл
   синусом, растяжки мачты были палками, флаг базы качался формулой, а бельё
   на верёвке в жилом отсеке просто висело. Верёвка теперь провисает под своим
   весом и качается от общего WIND — того же, что качает траву и пыль.

   ПРАВИЛА ФАЙЛА:
   1. Состояние живёт в объекте, который создали, и НИКОГДА не сохраняется:
      это чистая эфемерность (правило проекта). Пропал кадр — пересоздали.
   2. Ветер один на мир (WIND). Своего ветра здесь нет и быть не должно.
   3. Шаг ограничен: dt из кадра может прийти втрое больше обычного, и
      верёвку разносит. Считаем не больше двух подшагов. */
const VER_ITER=3;                       /* проходов по связям за шаг */
/* ── верёвка ──
   n точек от (x,y) вниз/вбок, длина сегмента seg. `pin` — какие точки прибиты
   (по умолчанию первая). */
function vRope(n,x,y,seg,opt){
  opt=opt||{};
  const P=[];
  for(let i=0;i<n;i++){
    const px=x+(opt.dx||0)*i, py=y+(opt.dy!==undefined?opt.dy:seg)*i;
    P.push({x:px,y:py,px:px,py:py,pin:i===0||(opt.pinLast&&i===n-1)});
  }
  return {p:P,seg,grav:opt.grav===undefined?.16:opt.grav,
          drag:opt.drag===undefined?.985:opt.drag,wind:opt.wind===undefined?1:opt.wind,
          cols:1,rows:n};
}
/* ── ткань ──
   Сетка cols×rows, прибитая по верхнему краю: флаг, бельё, занавеска, брезент.
   Связи только по решётке — диагоналей нет намеренно: ткань должна мяться. */
function vCloth(cols,rows,x,y,seg,opt){
  opt=opt||{};
  const P=[];
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const px=x+c*seg, py=y+r*seg;
    P.push({x:px,y:py,px:px,py:py,pin:r===0&&(opt.pinAll||c===0||c===cols-1||(opt.pinTop!==false))});
  }
  return {p:P,seg,cols,rows,grav:opt.grav===undefined?.10:opt.grav,
          drag:opt.drag===undefined?.98:opt.drag,wind:opt.wind===undefined?1:opt.wind};
}
/* шаг: тяготение, ветер, инерция, потом связи. Ветер берётся общий и слегка
   рвётся по высоте — ровный поток глаз не замечает */
function vStep(B,dt){
  if(!B||!B.p.length)return B;
  const steps=Math.min(2,Math.max(1,Math.round(dt)));
  const wind=(typeof WIND==="number"?WIND:0)*B.wind;
  for(let s=0;s<steps;s++){
    for(let i=0;i<B.p.length;i++){
      const q=B.p[i];
      if(q.pin){q.px=q.x;q.py=q.y;continue;}
      const vx=(q.x-q.px)*B.drag, vy=(q.y-q.py)*B.drag;
      q.px=q.x;q.py=q.y;
      const gust=wind*(.6+.4*Math.sin(G.t*.012+i*.5));
      q.x+=vx+gust*.16;
      q.y+=vy+B.grav;
    }
    for(let it=0;it<VER_ITER;it++){
      const C=B.cols,R=B.rows;
      for(let r=0;r<R;r++)for(let c=0;c<C;c++){
        const i=r*C+c;
        if(c+1<C)vLink(B,i,i+1);
        if(r+1<R)vLink(B,i,i+C);
      }
    }
  }
  return B;
}
function vLink(B,a,b){
  const A=B.p[a],Z=B.p[b];
  let dx=Z.x-A.x, dy=Z.y-A.y;
  const d=Math.hypot(dx,dy)||1e-6;
  const k=(d-B.seg)/d*.5;
  dx*=k;dy*=k;
  if(!A.pin){A.x+=dx;A.y+=dy;}
  if(!Z.pin){Z.x-=dx;Z.y-=dy;}
}
/* ── верёвка на экран ──
   Толщина сходит на нет к свободному концу, и это половина впечатления:
   ровная линия по всей длине снова читается палкой. */
function vDrawRope(B,ox,oy,col,w){
  if(!B||B.p.length<2)return;
  ctx.save();ctx.lineCap="round";
  for(let i=1;i<B.p.length;i++){
    const a=B.p[i-1],z=B.p[i];
    ctx.strokeStyle=col;
    ctx.lineWidth=(w||1.4)*(1-i/B.p.length*.55);
    ctx.beginPath();ctx.moveTo(a.x+ox,a.y+oy);ctx.lineTo(z.x+ox,z.y+oy);ctx.stroke();
  }
  ctx.restore();
}
/* ── ткань на экран ──
   Клетками, а не одной фигурой: у каждой своя светлота по наклону — так видно
   складку. Свет берётся сверху-сбоку от SUN_DIR, если он есть. */
function vDrawCloth(B,ox,oy,base,alpha){
  if(!B)return;
  const C=B.cols,R=B.rows;
  const sx=(typeof SUN_DIR==="object")?SUN_DIR.x:.55;
  ctx.save();
  for(let r=0;r+1<R;r++)for(let c=0;c+1<C;c++){
    const a=B.p[r*C+c],b=B.p[r*C+c+1],d=B.p[(r+1)*C+c+1],e=B.p[(r+1)*C+c];
    /* наклон клетки к свету: горизонтальная разница даёт складку */
    const tilt=clamp(((b.x-a.x)/B.seg-1)*1.6*(sx>0?1:-1),-.5,.5);
    const k=clamp(1+tilt,.55,1.45);
    ctx.fillStyle="rgba("+Math.round(base[0]*k)+","+Math.round(base[1]*k)+","+
      Math.round(base[2]*k)+","+(alpha===undefined?1:alpha)+")";
    ctx.beginPath();
    ctx.moveTo(a.x+ox,a.y+oy);ctx.lineTo(b.x+ox,b.y+oy);
    ctx.lineTo(d.x+ox,d.y+oy);ctx.lineTo(e.x+ox,e.y+oy);ctx.closePath();ctx.fill();
  }
  ctx.restore();
}

/* точка на верёвке по доле длины (0…1): чтобы вешать на неё вещи так, как
   вешают на настоящую — с равными промежутками, а не «через две точки» */
function vRopeAt(B,t){
  const n=B.p.length;
  const f=clamp(t,0,1)*(n-1);
  const i=Math.min(n-2,Math.floor(f)), k=f-i;
  const a=B.p[i],b=B.p[i+1];
  return {x:a.x+(b.x-a.x)*k, y:a.y+(b.y-a.y)*k};
}
