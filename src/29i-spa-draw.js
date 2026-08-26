/* ══════════════ санаторий: веранда ══════════════
   Противоположность зимовке во всём, и это нарочно: там одна тёмная комната
   без окна наружу, здесь — открытая веранда, за перилами море до горизонта, и
   света столько, что его никто не считает. Игрок должен УВИДЕТЬ разницу между
   местом, где он работает, и местом, где ему разрешили не работать.

   ПОРЯДОК СЛОЁВ: небо — море — дальний мыс — прибой — перила — пол веранды —
   мебель — люди — навес сверху — воздух. Свет один, солнечный, идёт слева
   сверху; всё, что стоит на веранде, получает тёплый верх и холодную тень от
   моря снизу.

   ЧЕГО ЗДЕСЬ НЕТ: полосок, счётчиков, подсветки «можно нажать». Щит с
   распорядком — обычный щит, и на нём написано то же, что было бы написано
   на настоящем. */
const SPA_C={
  sky:[128,178,214], sky2:[196,222,236], sea:[46,104,136], sea2:[86,150,172],
  wood:[186,150,104], wood2:[146,112,74], rail:[228,220,200],
  shade:[54,72,86], sun:[255,238,196], green:[92,140,86]
};
function spcol(a,k){const m=k==null?1:k;
  return "rgb("+Math.round(a[0]*m)+","+Math.round(a[1]*m)+","+Math.round(a[2]*m)+")";}
function sprgba(a,al){return "rgba("+(a[0]|0)+","+(a[1]|0)+","+(a[2]|0)+","+al.toFixed(3)+")";}
/* геометрия: одна на кадр и на попадание пальцем */
function spaGeom(){
  const hor=H*0.375;                 /* горизонт моря */
  const deck=H*0.685;                /* пол веранды */
  const man=H*0.30;
  return {hor,deck,man,
    rail :{x:0,y:deck-man*0.62,w:W,h:man*0.62},
    board:{x:W*0.055,y:H*0.10,w:W*0.215,h:man*0.72},     /* щит с распорядком */
    table:{x:W*0.40,y:deck-man*0.30,w:W*0.20,h:man*0.30},/* шахматный стол */
    chair:{x:W*0.72,y:deck-man*0.46,w:W*0.16,h:man*0.46},/* шезлонг */
    glass:{x:W*0.30,y:deck-man*0.30,w:W*0.06,h:man*0.16},/* стакан на перилах */
    manx :W*0.335
  };
}
/* строки распорядка: те же, что в модели, и ничего сверх */
function spaBoardRows(){return SPA_PLAN;}
function spaTookToday(S,k){return !!(S&&S.took&&S.took[S.day+":"+k]);}

function drawSpa(){
  const S=spaAll();if(!S)return;
  const g=spaGeom();
  const t=G.t*0.01;

  /* ── 1. небо: выгоревшее у горизонта ── */
  {
    const gr=ctx.createLinearGradient(0,0,0,g.hor);
    gr.addColorStop(0,spcol(SPA_C.sky,0.92));
    gr.addColorStop(1,spcol(SPA_C.sky2,1));
    ctx.fillStyle=gr;ctx.fillRect(0,0,W,g.hor+1);
    /* солнце слева сверху — источник всего света в кадре */
    const sx=W*0.18, sy=H*0.10;
    const sg=ctx.createRadialGradient(sx,sy,0,sx,sy,H*0.55);
    sg.addColorStop(0,sprgba(SPA_C.sun,0.34));
    sg.addColorStop(1,sprgba(SPA_C.sun,0));
    ctx.fillStyle=sg;ctx.fillRect(0,0,W,g.hor+H*0.2);
  }

  /* ── 2. море: полосы к горизонту, блик от солнца ── */
  {
    const gr=ctx.createLinearGradient(0,g.hor,0,g.deck);
    gr.addColorStop(0,spcol(SPA_C.sea2,1));
    gr.addColorStop(1,spcol(SPA_C.sea,0.9));
    ctx.fillStyle=gr;ctx.fillRect(0,g.hor,W,g.deck-g.hor);
    /* волны: чем ближе, тем реже и длиннее — вся перспектива держится на этом */
    const rs=rng(hashi(S.seed,3,0x5EA));
    for(let i=0;i<64;i++){
      const q=rs();
      const y=g.hor+Math.pow(q,1.8)*(g.deck-g.hor);
      const w=W*(0.02+q*0.09);
      const x=(rs()*W*1.3+Math.sin(t*0.6+i)*W*0.012)%W;
      ctx.fillStyle="rgba(226,240,246,"+(0.06+q*0.20).toFixed(3)+")";
      ctx.fillRect(x,y,w,Math.max(1,(0.6+q*2.2)));
    }
    /* солнечная дорожка */
    const pg=ctx.createLinearGradient(0,g.hor,0,g.deck);
    pg.addColorStop(0,sprgba(SPA_C.sun,0.24));
    pg.addColorStop(1,sprgba(SPA_C.sun,0.04));
    ctx.fillStyle=pg;
    ctx.beginPath();
    ctx.moveTo(W*0.16,g.hor);ctx.lineTo(W*0.21,g.hor);
    ctx.lineTo(W*0.40,g.deck);ctx.lineTo(W*0.02,g.deck);
    ctx.closePath();ctx.fill();
    /* дальний мыс: тёмный силуэт НА горизонте. Полупрозрачной тенью поверх неба
       он читался облаком — у мыса должен быть край, и край этот тёмный */
    ctx.fillStyle=spcol([76,102,116],0.92);
    ctx.beginPath();ctx.moveTo(W*0.60,g.hor+1);
    for(let x=0;x<=W*0.42;x+=6){
      const q=x/(W*0.42);
      ctx.lineTo(W*0.60+x,g.hor+1-Math.sin(q*2.2+0.6)*H*0.026*(1-q*0.3)-H*0.004);
    }
    ctx.lineTo(W,g.hor+1);ctx.closePath();ctx.fill();
    ctx.fillStyle=sprgba([232,242,246],0.28);
    ctx.fillRect(W*0.60,g.hor-H*0.001,W*0.40,Math.max(1,H*0.0022));
  }

  /* ── 3. прибой у самой веранды ── */
  {
    ctx.fillStyle="rgba(232,244,248,.35)";
    for(let x=0;x<W;x+=7){
      const y=g.deck-H*0.012+Math.sin(x*0.03+t*1.6)*H*0.004;
      ctx.fillRect(x,y,5,Math.max(1,H*0.004));
    }
  }

  /* ── 4. пол веранды: доски в перспективе ── */
  {
    ctx.fillStyle=spcol(SPA_C.wood,0.92);
    ctx.fillRect(0,g.deck,W,H-g.deck);
    for(let i=0;i<26;i++){
      const q=i/26;
      const y=g.deck+Math.pow(q,1.5)*(H-g.deck);
      ctx.fillStyle=sprgba(SPA_C.wood2,0.30+q*0.20);
      ctx.fillRect(0,y,W,Math.max(1,1+q*2.4));
    }
    /* тень от навеса на полу — та самая полоса, ради которой на веранде сидят */
    const sg=ctx.createLinearGradient(0,g.deck,0,H);
    sg.addColorStop(0,sprgba(SPA_C.shade,0.24));
    sg.addColorStop(1,sprgba(SPA_C.shade,0.02));
    ctx.fillStyle=sg;ctx.fillRect(0,g.deck,W,H-g.deck);
    /* ── тень перил поперёк палубы ──
       Пол был большим пустым коричневым полем. Заполнять его мебелью значило
       бы захламлять веранду; заполняет его то, что там и должно быть в полдень:
       решётка тени от перил, косая и длинная. И она же говорит, где солнце. */
    const rr=g.rail, sl=W*0.11;
    ctx.save();
    ctx.beginPath();ctx.rect(0,g.deck,W,H-g.deck);ctx.clip();
    ctx.fillStyle=sprgba([30,44,58],0.16);
    for(let x=-sl;x<W;x+=W*0.075){
      ctx.beginPath();
      ctx.moveTo(x+sl,g.deck);
      ctx.lineTo(x+sl+W*0.010,g.deck);
      ctx.lineTo(x+W*0.014,H);
      ctx.lineTo(x,H);
      ctx.closePath();ctx.fill();
    }
    /* и две продольные тени от поручней */
    for(const q of [0.30,0.52]){
      const y=g.deck+(H-g.deck)*q;
      ctx.fillStyle=sprgba([30,44,58],0.14);
      ctx.fillRect(0,y,W,Math.max(3,H*0.010*(0.6+q)));
    }
    ctx.restore();
  }

  /* ── 5. перила: стойки и два поручня ── */
  {
    const r=g.rail;
    for(let x=W*0.03;x<W;x+=W*0.075){
      ctx.fillStyle=spcol(SPA_C.rail,0.94);
      ctx.fillRect(x,r.y,Math.max(3,W*0.008),r.h);
      ctx.fillStyle="rgba(255,255,255,.22)";
      ctx.fillRect(x,r.y,Math.max(1,W*0.003),r.h);
      ctx.fillStyle=sprgba(SPA_C.shade,0.20);
      ctx.fillRect(x+Math.max(3,W*0.008),r.y,Math.max(1,W*0.002),r.h);
    }
    for(const q of [0,0.42]){
      const y=r.y+r.h*q;
      ctx.fillStyle=spcol(SPA_C.rail,1);
      ctx.fillRect(0,y,W,Math.max(4,H*0.010));
      ctx.fillStyle="rgba(255,255,255,.26)";
      ctx.fillRect(0,y,W,Math.max(1,H*0.0026));
      ctx.fillStyle=sprgba(SPA_C.shade,0.22);
      ctx.fillRect(0,y+Math.max(4,H*0.010),W,Math.max(1,H*0.0022));
    }
  }

  /* ── 6. щит с распорядком ──
     Обыкновенный щит. Сделанное вычеркнуто карандашом — тем же жестом, что и
     на бланке открытки, и по той же причине: так делают на бумаге. */
  {
    const b=g.board;
    ctx.fillStyle="rgba(0,0,0,.18)";
    ctx.fillRect(b.x+3,b.y+4,b.w,b.h);
    ctx.fillStyle=spcol([236,228,206],1);
    ctx.fillRect(b.x,b.y,b.w,b.h);
    ctx.strokeStyle=sprgba(SPA_C.wood2,0.55);
    ctx.lineWidth=Math.max(2,H*0.004);
    ctx.strokeRect(b.x+1,b.y+1,b.w-2,b.h-2);
    ctx.fillStyle="rgba(90,78,58,.85)";
    ctx.font=Math.max(8,Math.round(H*0.016))+"px ui-monospace,monospace";
    ctx.textAlign="left";
    ctx.fillText("РАСПОРЯДОК · ДЕНЬ "+S.day+" ИЗ "+S.days,b.x+b.w*0.06,b.y+b.h*0.13);
    ctx.fillStyle="rgba(90,78,58,.35)";
    ctx.fillRect(b.x+b.w*0.06,b.y+b.h*0.17,b.w*0.88,Math.max(1,H*0.0018));
    const rows=spaBoardRows();
    rows.forEach((P,i)=>{
      const y=b.y+b.h*(0.30+i*0.155);
      const took=spaTookToday(S,P.k);
      ctx.fillStyle=took?"rgba(120,106,80,.55)":"rgba(66,58,44,.92)";
      ctx.font=Math.max(7,Math.round(H*0.0135))+"px ui-monospace,monospace";
      ctx.fillText(P.ru,b.x+b.w*0.08,y);
      ctx.fillStyle="rgba(120,106,80,.55)";
      ctx.font=Math.max(6,Math.round(H*0.0115))+"px ui-monospace,monospace";
      ctx.fillText(P.at,b.x+b.w*0.08,y+H*0.016);
      if(took){
        /* черта идёт ПО СЛОВУ, а не над ним: над словом она читалась
           подчёркиванием предыдущей строки */
        ctx.strokeStyle="rgba(70,60,44,.62)";
        ctx.lineWidth=Math.max(1,H*0.0024);
        ctx.beginPath();
        ctx.moveTo(b.x+b.w*0.06,y-H*0.005);
        ctx.lineTo(b.x+b.w*0.94,y-H*0.0035);ctx.stroke();
      }
    });
    ctx.textAlign="left";
  }

  /* ── 7. шахматный стол ── */
  {
    const tb=g.table;
    ctx.fillStyle="rgba(0,0,0,.22)";
    ctx.beginPath();ctx.ellipse(tb.x+tb.w*0.5,g.deck+H*0.014,tb.w*0.52,H*0.016,0,0,TAU);ctx.fill();
    ctx.fillStyle=spcol(SPA_C.rail,0.92);
    ctx.fillRect(tb.x+tb.w*0.46,tb.y+tb.h*0.16,Math.max(4,tb.w*0.06),g.deck-tb.y-tb.h*0.16);
    /* столешница круглая и НЕ плоская: первый счёт давал эллипс вчетверо шире
       своей высоты, и стол читался доской для сёрфинга на палке */
    ctx.fillStyle=spcol(SPA_C.wood2,1);
    ctx.beginPath();ctx.ellipse(tb.x+tb.w*0.5,tb.y+tb.h*0.16,tb.w*0.40,tb.h*0.15,0,0,TAU);ctx.fill();
    ctx.fillStyle=spcol(SPA_C.wood,1.06);
    ctx.beginPath();ctx.ellipse(tb.x+tb.w*0.5,tb.y+tb.h*0.12,tb.w*0.40,tb.h*0.15,0,0,TAU);ctx.fill();
    ctx.fillStyle="rgba(255,255,255,.20)";
    ctx.beginPath();ctx.ellipse(tb.x+tb.w*0.44,tb.y+tb.h*0.09,tb.w*0.26,tb.h*0.08,0,0,TAU);ctx.fill();
    /* доска и несколько фигур: партия не доиграна и не будет */
    const bw=tb.w*0.46,bh=tb.h*0.20;
    const bx=tb.x+tb.w*0.5-bw*0.5, by=tb.y+tb.h*0.02;
    for(let r0=0;r0<4;r0++)for(let c0=0;c0<4;c0++){
      ctx.fillStyle=((r0+c0)%2)?"rgba(60,50,38,.75)":"rgba(232,224,204,.85)";
      ctx.fillRect(bx+c0*bw/4,by+r0*bh/4,bw/4+0.5,bh/4+0.5);
    }
    const rp=rng(hashi(S.seed,7,0x5EB));
    for(let i=0;i<5;i++){
      const px=bx+rp()*bw, py=by+rp()*bh;
      ctx.fillStyle=i%2?"rgba(40,34,26,.9)":"rgba(244,238,220,.95)";
      ctx.beginPath();ctx.ellipse(px,py,bw*0.035,bw*0.028,0,0,TAU);ctx.fill();
      ctx.fillRect(px-bw*0.022,py-bh*0.16,bw*0.044,bh*0.16);
    }
  }

  /* ── 8. шезлонг ──
     Первый счёт рисовал две палки и многоугольник — выходила связка хвороста.
     Шезлонг читается шезлонгом от ИЗЛОМА: спинка идёт вверх-назад, сиденье
     почти горизонтально, между ними колено, и ткань одним куском проходит по
     обеим плоскостям. Плюс рама из двух пар ножек крест-накрест и подлокотник:
     без подлокотника это раскладушка. */
  {
    const c=g.chair;
    const bx=c.x, by=g.deck;                     /* низ передних ножек */
    const kneeX=bx+c.w*0.46, kneeY=c.y+c.h*0.58; /* колено ткани */
    const headX=bx+c.w*0.10, headY=c.y+c.h*0.04; /* верх спинки */
    const footX=bx+c.w*0.98, footY=c.y+c.h*0.70; /* край сиденья */
    ctx.fillStyle="rgba(0,0,0,.22)";
    ctx.beginPath();
    ctx.ellipse(bx+c.w*0.52,by+H*0.010,c.w*0.60,H*0.014,0,0,TAU);ctx.fill();
    /* рама: две пары ножек крест-накрест */
    ctx.strokeStyle=spcol(SPA_C.wood2,1.05);
    ctx.lineWidth=Math.max(3,H*0.0062);
    ctx.lineCap="round";
    ctx.beginPath();
    ctx.moveTo(bx+c.w*0.10,by);ctx.lineTo(kneeX+c.w*0.06,kneeY-c.h*0.02);
    ctx.moveTo(bx+c.w*0.62,by);ctx.lineTo(bx+c.w*0.30,kneeY+c.h*0.06);
    ctx.moveTo(bx+c.w*0.86,by);ctx.lineTo(footX-c.w*0.10,footY);
    ctx.stroke();
    /* ткань одним куском: спинка и сиденье через колено */
    ctx.fillStyle=spcol([228,212,168],1);
    ctx.beginPath();
    ctx.moveTo(headX,headY);
    ctx.lineTo(headX+c.w*0.22,headY+c.h*0.10);
    ctx.lineTo(kneeX+c.w*0.10,kneeY+c.h*0.02);
    ctx.lineTo(footX,footY);
    ctx.lineTo(footX-c.w*0.06,footY+c.h*0.13);
    ctx.lineTo(kneeX-c.w*0.02,kneeY+c.h*0.14);
    ctx.lineTo(headX-c.w*0.04,headY+c.h*0.16);
    ctx.closePath();ctx.fill();
    /* полосы идут ПОПЕРЁК ткани, ломаясь на колене вместе с ней */
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(headX,headY);
    ctx.lineTo(headX+c.w*0.22,headY+c.h*0.10);
    ctx.lineTo(kneeX+c.w*0.10,kneeY+c.h*0.02);
    ctx.lineTo(footX,footY);
    ctx.lineTo(footX-c.w*0.06,footY+c.h*0.13);
    ctx.lineTo(kneeX-c.w*0.02,kneeY+c.h*0.14);
    ctx.lineTo(headX-c.w*0.04,headY+c.h*0.16);
    ctx.closePath();ctx.clip();
    ctx.strokeStyle="rgba(194,118,86,.55)";
    ctx.lineWidth=Math.max(3,c.w*0.030);
    for(let i=0;i<7;i++){
      const q=i/6;
      const ax=headX+(kneeX-headX)*q, ay=headY+(kneeY-headY)*q;
      ctx.beginPath();
      ctx.moveTo(ax,ay-c.h*0.02);ctx.lineTo(ax+c.w*0.10,ay+c.h*0.17);ctx.stroke();
    }
    for(let i=0;i<5;i++){
      const q=i/4;
      const ax=kneeX+(footX-kneeX)*q, ay=kneeY+(footY-kneeY)*q;
      ctx.beginPath();
      ctx.moveTo(ax,ay-c.h*0.01);ctx.lineTo(ax+c.w*0.04,ay+c.h*0.15);ctx.stroke();
    }
    ctx.restore();
    /* подлокотник */
    ctx.strokeStyle=spcol(SPA_C.wood,1.08);
    ctx.lineWidth=Math.max(3,H*0.0055);
    ctx.beginPath();
    ctx.moveTo(headX+c.w*0.06,headY+c.h*0.22);
    ctx.lineTo(kneeX+c.w*0.04,kneeY+c.h*0.16);
    ctx.stroke();
    ctx.lineCap="butt";
  }

  /* ── 9. стакан на перилах: коктейль, пена оседает ── */
  {
    const q=g.glass;
    ctx.fillStyle="rgba(255,255,255,.55)";
    ctx.fillRect(q.x,q.y,q.w*0.55,q.h);
    ctx.fillStyle="rgba(232,180,120,.72)";
    ctx.fillRect(q.x+q.w*0.06,q.y+q.h*0.34,q.w*0.43,q.h*0.62);
    ctx.fillStyle="rgba(255,252,244,.9)";
    ctx.fillRect(q.x+q.w*0.03,q.y+q.h*0.16,q.w*0.49,q.h*0.20);
    ctx.fillStyle="rgba(255,255,255,.35)";
    ctx.fillRect(q.x+q.w*0.06,q.y,Math.max(1,q.w*0.06),q.h);
  }

  /* ── 10. люди ──
     Игрок у перил, сосед в шезлонге. Оба ничего не делают, и это единственное,
     что они на веранде делают. */
  {
    const m=g.man*0.86, x=g.manx, y=g.deck;
    const rl=g.rail.y+g.rail.h*0.42;
    ctx.fillStyle="rgba(0,0,0,.24)";
    ctx.beginPath();ctx.ellipse(x,y+m*0.012,m*0.16,m*0.026,0,0,TAU);ctx.fill();
    const skin=[206,172,142], shirt=[228,232,236], trous=[86,96,110];
    /* ноги в лёгких брюках: узкие в колене, шире внизу — в санатории ходят не
       в скафандре, и это должно быть видно силуэтом */
    ctx.fillStyle=spcol(trous,1);
    for(const s2 of [-1,1]){
      const lx=x+s2*m*0.034;
      ctx.beginPath();
      ctx.moveTo(lx-m*0.030,y-m*0.44);
      ctx.lineTo(lx+m*0.030,y-m*0.44);
      ctx.lineTo(lx+m*0.034,y-m*0.02);
      ctx.lineTo(lx-m*0.034,y-m*0.02);
      ctx.closePath();ctx.fill();
    }
    /* сандалии */
    ctx.fillStyle=spcol([120,96,72],1);
    for(const s2 of [-1,1])
      ctx.fillRect(x+s2*m*0.034-m*0.038,y-m*0.024,m*0.078,m*0.024);
    /* рубаха навыпуск: плечи — талия — подол, три перелома, как у ватника,
       только светлая и короче */
    ctx.fillStyle=spcol(shirt,1);
    ctx.beginPath();
    ctx.moveTo(x-m*0.082,y-m*0.800);
    ctx.lineTo(x+m*0.082,y-m*0.800);
    ctx.lineTo(x+m*0.088,y-m*0.660);
    ctx.lineTo(x+m*0.064,y-m*0.560);
    ctx.lineTo(x+m*0.082,y-m*0.420);
    ctx.lineTo(x-m*0.082,y-m*0.420);
    ctx.lineTo(x-m*0.064,y-m*0.560);
    ctx.lineTo(x-m*0.088,y-m*0.660);
    ctx.closePath();ctx.fill();
    ctx.fillStyle=sprgba(SPA_C.shade,0.16);
    ctx.fillRect(x-m*0.082,y-m*0.470,m*0.164,m*0.050);
    /* руки лежат на поручне: локоть вниз, кисть на перекладине */
    ctx.strokeStyle=spcol(skin,1);
    ctx.lineWidth=Math.max(2.4,m*0.044);
    ctx.lineCap="round";ctx.lineJoin="round";
    for(const s2 of [-1,1]){
      ctx.beginPath();
      ctx.moveTo(x+s2*m*0.076,y-m*0.760);
      ctx.lineTo(x+s2*m*0.140,y-m*0.560);
      ctx.lineTo(x+s2*m*0.112,rl);
      ctx.stroke();
    }
    ctx.lineCap="butt";ctx.lineJoin="miter";
    /* короткий рукав: полоса рубахи поверх начала руки */
    ctx.fillStyle=spcol(shirt,0.94);
    for(const s2 of [-1,1]){
      ctx.beginPath();
      ctx.moveTo(x+s2*m*0.052,y-m*0.800);
      ctx.lineTo(x+s2*m*0.098,y-m*0.790);
      ctx.lineTo(x+s2*m*0.106,y-m*0.690);
      ctx.lineTo(x+s2*m*0.058,y-m*0.700);
      ctx.closePath();ctx.fill();
    }
    /* шея, голова, волосы: затылок к нам — человек смотрит на море */
    ctx.fillStyle=spcol(skin,1);
    ctx.fillRect(x-m*0.019,y-m*0.836,m*0.038,m*0.040);
    ctx.beginPath();ctx.arc(x,y-m*0.878,m*0.056,0,TAU);ctx.fill();
    ctx.fillStyle=spcol([74,60,50],1);
    ctx.beginPath();
    ctx.arc(x,y-m*0.884,m*0.056,Math.PI*0.86,Math.PI*2.14);ctx.fill();
    ctx.fillRect(x-m*0.050,y-m*0.892,m*0.100,m*0.040);
    /* солнце сверху слева: тёплая кромка по плечу и по голове */
    ctx.fillStyle=sprgba(SPA_C.sun,0.34);
    ctx.fillRect(x-m*0.082,y-m*0.800,m*0.164,Math.max(1.5,m*0.014));
    ctx.beginPath();
    ctx.arc(x-m*0.010,y-m*0.884,m*0.056,Math.PI*1.05,Math.PI*1.55);
    ctx.lineTo(x-m*0.010,y-m*0.884);ctx.fill();
  }
  {
    /* сосед в шезлонге: только голова, колени и книжка. Больше и не надо */
    const c=g.chair, m=g.man*0.86;
    ctx.fillStyle=spcol([196,166,138],1);
    ctx.beginPath();ctx.arc(c.x+c.w*0.42,c.y+c.h*0.10,m*0.052,0,TAU);ctx.fill();
    ctx.fillStyle=spcol([70,80,92],1);
    ctx.beginPath();
    ctx.moveTo(c.x+c.w*0.30,c.y+c.h*0.20);
    ctx.lineTo(c.x+c.w*0.60,c.y+c.h*0.34);
    ctx.lineTo(c.x+c.w*0.86,c.y+c.h*0.66);
    ctx.lineTo(c.x+c.w*0.70,c.y+c.h*0.72);
    ctx.lineTo(c.x+c.w*0.24,c.y+c.h*0.34);
    ctx.closePath();ctx.fill();
    ctx.fillStyle="rgba(240,234,216,.9)";
    ctx.save();ctx.translate(c.x+c.w*0.50,c.y+c.h*0.20);ctx.rotate(-0.5);
    ctx.fillRect(0,0,c.w*0.22,c.h*0.16);ctx.restore();
  }

  /* ── 11. навес ──
     Один кусок ткани с фестончатым низом, и полосы ВНУТРИ него по отсечению.
     Первый счёт красил полосы отдельными прямоугольниками поверх, и они
     торчали за провисающий край: сверху шла не маркиза, а полосатая плашка
     интерфейса. Ткань — это тело; полосы живут внутри тела. */
  {
    const hy=H*0.050, sag=H*0.016, n=12;
    const edge=(c)=>{
      c.beginPath();
      c.moveTo(0,0);c.lineTo(W,0);c.lineTo(W,hy);
      for(let i=n;i>=0;i--){
        const x0=W*i/n, x1=W*(i-0.5)/n;
        c.quadraticCurveTo(x1,hy+sag,W*(i-1)/n,hy);
      }
      c.closePath();
    };
    ctx.save();
    edge(ctx);ctx.clip();
    ctx.fillStyle=spcol([238,228,208],1);
    ctx.fillRect(0,0,W,hy+sag+2);
    ctx.fillStyle="rgba(198,118,90,.62)";
    for(let i=0;i<n;i+=2)ctx.fillRect(W*i/n,0,W/n,hy+sag+2);
    /* ткань провисает — низ темнее, верх у крепления светлее */
    const tg=ctx.createLinearGradient(0,0,0,hy+sag);
    tg.addColorStop(0,"rgba(255,255,255,.16)");
    tg.addColorStop(1,"rgba(40,50,60,.22)");
    ctx.fillStyle=tg;ctx.fillRect(0,0,W,hy+sag+2);
    ctx.restore();
    /* и тень, которую она кладёт на всё под собой */
    const sh=ctx.createLinearGradient(0,hy,0,hy+H*0.09);
    sh.addColorStop(0,"rgba(30,40,50,.22)");
    sh.addColorStop(1,"rgba(30,40,50,0)");
    ctx.fillStyle=sh;ctx.fillRect(0,hy,W,H*0.09);
  }

  /* ── 12. воздух: лёгкая дымка над морем и мягкая виньетка ── */
  {
    const hg=ctx.createLinearGradient(0,g.hor-H*0.06,0,g.hor+H*0.05);
    hg.addColorStop(0,"rgba(232,242,246,0)");
    hg.addColorStop(0.5,"rgba(232,242,246,.30)");
    hg.addColorStop(1,"rgba(232,242,246,0)");
    ctx.fillStyle=hg;ctx.fillRect(0,g.hor-H*0.06,W,H*0.11);
    const vg=ctx.createRadialGradient(W*.5,H*.5,Math.min(W,H)*.40,W*.5,H*.5,Math.max(W,H)*.78);
    vg.addColorStop(0,"rgba(0,0,0,0)");
    vg.addColorStop(1,"rgba(20,30,40,.26)");
    ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
  }
}
/* ── руки ── */
function spaHit(mx,my){
  const S=spaAll();if(!S)return null;
  const g=spaGeom();
  const inR=(r)=>mx>=r.x&&mx<=r.x+r.w&&my>=r.y&&my<=r.y+r.h;
  if(inR(g.board)){
    /* по строке щита: попадание считается по той же сетке, что и рисование */
    const rows=spaBoardRows();
    for(let i=0;i<rows.length;i++){
      const y=g.board.y+g.board.h*(0.30+i*0.155);
      if(my>y-H*0.020&&my<y+H*0.022)return {k:"take",id:rows[i].k};
    }
    return {k:"board"};
  }
  if(inR(g.glass))return {k:"take",id:"cock"};
  if(inR(g.table))return {k:"take",id:"chess"};
  if(inR(g.chair))return {k:"talk"};
  if(my>=g.rail.y&&my<=g.deck)return {k:"take",id:"walk"};
  return null;
}
function spaTap(mx,my){
  const h=spaHit(mx,my);
  if(!h)return false;
  if(h.k==="take"){spaTake(h.id);return true;}
  if(h.k==="talk"){spaTalk();return true;}
  return true;
}
function updateSpa(dt){
  const S=spaAll();if(!S){G.mode="surface";return;}
  if(actEdge)spaSleep();
  /* единственная строка подсказки, и та без требований */
  G.prompt="ДЕЙСТВИЕ — СПАТЬ · ОСТАЛЬНОЕ МОЖНО НЕ ДЕЛАТЬ";
}
