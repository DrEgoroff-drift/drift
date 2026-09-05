/* ══════════════ приметы места: формы ══════════════
   Отрезано от `21b-surface-deco` 25.08.2026 (46 КБ). Там остались отбор примет
   для полосы, материал и общий проход отрисовки; здесь — сами формы, восемь
   штук: друза, скол, плита, ферма, стена, колонна, навес, вайя. Каждая берёт
   один объект `A` со своей палитрой и размерами и рисует тело.

   Правило семьи: примета узнаётся силуэтом с дальнего края экрана, поэтому
   сначала форма и обвод, и только потом материал. Освещённая кромка
   обязательна — тёмное пятно без неё читается дырой в кадре, а не вещью
   (правило M173). */

function decoDruse(A){
  const {pal,tr,w,hgt}=A;
  /* друза — не одна призма, а сросшийся куст разной высоты: ровная гребёнка
     читается частоколом */
  const n=3+Math.floor(h01(1,2,POI_SEED)*4);
  const ord=[];
  for(let i=0;i<n;i++)ord.push(i);
  ord.sort((a,b)=>h01(a,3,POI_SEED)-h01(b,3,POI_SEED));
  for(const i of ord){
    const u=(i+.5)/n-.5;
    const hh=hgt*(.35+h01(i,11,POI_SEED)*.85);
    const ww=w*(.24+h01(i,13,POI_SEED)*.3);
    ctx.save();
    const dx=u*w*1.5;
    ctx.translate(dx,dgy(A,dx)+h01(i,17,POI_SEED)*3);
    prism(ww,hh,(h01(i,19,POI_SEED)-.5)*.7,pal,tr,A.ox,A.oy,i);
    ctx.restore();
  }
  /* крошка у основания: друза растёт ИЗ грунта, а не приставлена к нему */
  for(let i=0;i<6;i++){
    const bx=(h01(i,23,POI_SEED)-.5)*w*2.4, s=2+h01(i,29,POI_SEED)*w*.16;
    ctx.fillStyle=dcol(pal,4,1,.7);
    ctx.beginPath();ctx.moveTo(bx-s,3);ctx.lineTo(bx,3-s*1.6);ctx.lineTo(bx+s,3);
    ctx.closePath();ctx.fill();
  }
}
function decoShard(A){
  const {pal,tr,w,hgt}=A;
  ctx.save();
  ctx.rotate((h01(2,5,POI_SEED)-.5)*.5);
  prism(w*.55,hgt,(h01(3,7,POI_SEED)-.5)*.5,pal,tr,A.ox,A.oy,0);
  ctx.restore();
  /* второй, мелкий, у подножия: одиночная игла в чистом поле выглядит
     поставленной, пара — выросшей */
  ctx.save();ctx.translate(w*.9,dgy(A,w*.9)+2);ctx.rotate(.28);
  prism(w*.3,hgt*.3,.2,pal,tr,A.ox,A.oy,1);
  ctx.restore();
}
/* ── металлический мир: плиты и фермы ──
   Плита и шов — то же, на чём держится MAT_CHAR.plate. Крупная форма — это
   ровно та же плита, только вставшая на ребро. */
function decoSlab(A){
  const {pal,tr,w,hgt}=A;
  /* наклон заметный: почти отвесная плита стояла ровно и вместе с ровными
     швами читалась дощатым поддоном, а не сорванной обшивкой */
  const tilt=(h01(1,3,POI_SEED)<.5?-1:1)*(.22+h01(1,4,POI_SEED)*.3);
  ctx.save();ctx.rotate(tilt);
  const th=Math.max(3,w*.16);
  const P=poiPath([[-w,10],[-w,-hgt],[w,-hgt*.86],[w,10]],Math.min(2.6,w*.12));
  const g=ctx.createLinearGradient(-w,0,w,0);
  g.addColorStop(0,dcol(pal,1,.85));
  g.addColorStop(.6,dcol(pal,3,1));
  g.addColorStop(1,dcol(pal,4,1.05));
  ctx.fillStyle=g;ctx.fill(P);
  decoMat(tr,P,w,hgt,A.ox,A.oy);
  ctx.save();ctx.clip(P);
  /* ОДИН глубокий шов и ребро жёсткости рядом с ним. Четыре равномерных шва
     давали доски: ритм «через равное» — это настил, а ритм «шов, ребро, пусто»
     — обшивка. */
  const sy=-hgt*(.42+h01(2,9,POI_SEED)*.28);
  ctx.strokeStyle="rgba(0,0,0,.62)";ctx.lineWidth=Math.max(1.6,w*.09);
  ctx.beginPath();ctx.moveTo(-w,sy);ctx.lineTo(w,sy+w*.16);ctx.stroke();
  ctx.strokeStyle="rgba(255,255,255,.14)";ctx.lineWidth=Math.max(1,w*.05);
  ctx.beginPath();ctx.moveTo(-w,sy-w*.16);ctx.lineTo(w,sy);ctx.stroke();
  /* продольное ребро: вертикаль вдоль плиты, по ней читается жёсткость листа */
  ctx.strokeStyle="rgba(0,0,0,.4)";ctx.lineWidth=Math.max(1.2,w*.06);
  ctx.beginPath();ctx.moveTo(-w*.35,10);ctx.lineTo(-w*.35,-hgt*.94);ctx.stroke();
  /* окисел: узкие вертикальные потёки бурого. Широкие и розовые делали металл
     песчаником — это уже ловилось в M78 */
  for(let i=0;i<5;i++){
    const sx=(h01(i,31,POI_SEED)-.5)*w*1.8, ww=Math.max(1,w*.07);
    const gg=ctx.createLinearGradient(0,-hgt,0,10);
    gg.addColorStop(0,"rgba(96,54,30,0)");
    gg.addColorStop(1,"rgba(96,54,30,"+(.2+h01(i,37,POI_SEED)*.25).toFixed(3)+")");
    ctx.fillStyle=gg;ctx.fillRect(sx,-hgt,ww,hgt+12);
  }
  ctx.restore();
  /* заклёпки по кромке и резкий блик — металл узнают по ним */
  ctx.fillStyle="rgba(0,0,0,.45)";
  for(let i=0;i<5;i++){
    const yy=-hgt*(.12+i*.19);
    ctx.beginPath();ctx.arc(-w+th*.9,yy,Math.max(.8,w*.035),0,TAU);ctx.fill();
  }
  ctx.strokeStyle="rgba(255,255,255,.34)";ctx.lineWidth=Math.max(1,w*.05);
  ctx.beginPath();ctx.moveTo(-w,-hgt);ctx.lineTo(w,-hgt*.86);ctx.stroke();
  ctx.strokeStyle="rgba(0,0,0,.4)";ctx.lineWidth=1;ctx.stroke(P);
  ctx.restore();
  poiDrift(w*1.1,pal);
}
function decoTruss(A){
  const {pal,w,hgt}=A;
  /* ферма — это ритм, а не силуэт: два пояса и раскосы между ними, часть
     звеньев выбита. Отсюда и масштаб: сквозь неё видно небо */
  const lean=(h01(1,5,POI_SEED)-.5)*.45;
  ctx.save();ctx.rotate(lean);
  const hw=w*.34, top=-hgt;
  const SPL=1.75;                    // развал ног: отвесная ферма читается стойкой
  const rail=(dx)=>{
    ctx.beginPath();ctx.moveTo(dx*SPL,6);ctx.lineTo(dx,top);ctx.stroke();
  };
  ctx.lineWidth=Math.max(1.4,w*.09);
  ctx.strokeStyle=dcol(pal,2,.7);
  rail(-hw);rail(hw);
  /* Раскосы КРЕСТОМ, а не перекладинами: с ровными горизонталями через равный
     шаг ферма получалась приставной лестницей — первый кадр это и показал.
     Крест плюс выбитые звенья читаются конструкцией, которая держала нагрузку
     и перестала. */
  const seg=Math.max(3,Math.round(hgt/26));
  for(let i=0;i<seg;i++){
    const u0=i/seg,u1=(i+1)/seg;
    const y0=lerp(6,top,u0),y1=lerp(6,top,u1);
    const l0=lerp(-hw*SPL,-hw,u0),l1=lerp(-hw*SPL,-hw,u1);
    const r0=lerp(hw*SPL,hw,u0),r1=lerp(hw*SPL,hw,u1);
    ctx.lineWidth=Math.max(1,w*.055);
    ctx.strokeStyle=dcol(pal,2,1.05,.92);
    if(h01(i,7,POI_SEED)>.2){ctx.beginPath();ctx.moveTo(l0,y0);ctx.lineTo(r1,y1);ctx.stroke();}
    if(h01(i,13,POI_SEED)>.3){ctx.beginPath();ctx.moveTo(r0,y0);ctx.lineTo(l1,y1);ctx.stroke();}
    /* поперечина не в каждом звене: она и задаёт ярусы, но подряд снова даёт
       лестницу */
    if(i%2===0&&h01(i,17,POI_SEED)>.35){
      ctx.strokeStyle=dcol(pal,2,.85);ctx.lineWidth=Math.max(1,w*.07);
      ctx.beginPath();ctx.moveTo(l1,y1);ctx.lineTo(r1,y1);ctx.stroke();
    }
  }
  /* верх обломан: погнутый обрывок пояса вместо ровного среза */
  ctx.strokeStyle=dcol(pal,3,.95);ctx.lineWidth=Math.max(1.2,w*.07);
  ctx.beginPath();ctx.moveTo(-hw,top);ctx.lineTo(-hw*.2,top-hgt*.1);
  ctx.lineTo(hw*.9,top-hgt*.04);ctx.stroke();
  ctx.restore();
  ctx.fillStyle=dcol(pal,1,.7,.6);
  ctx.beginPath();ctx.ellipse(0,4,w*.9,Math.max(2,w*.14),0,0,TAU);ctx.fill();
}
/* ── руинный мир: стены и колонны ──
   Кладка на весь экран — миллиметровка (M78), поэтому она идёт пятнами.
   Крупная форма — то, что от этих пятен осталось стоять. */
function decoWall(A){
  const {pal,tr,w,hgt}=A;
  const ww=w*1.5;
  /* верх обломан ступенями, а не пилой: стена рушится по швам кладки */
  const top=[];
  const cols=Math.max(3,Math.round(ww/14));
  for(let i=0;i<=cols;i++)
    top.push([-ww+2*ww*i/cols,-hgt*(.55+h01(i,3,POI_SEED)*.45)]);
  const pts=[[-ww,8]].concat(top,[[ww,8]]);
  const P=poiPath(pts,Math.min(2.4,w*.1));
  ctx.fillStyle=poiBody(hgt,dcol(pal,1,.9),dcol(pal,3,1.05));
  ctx.fill(P);
  decoMat(tr,P,ww,hgt,A.ox,A.oy);
  ctx.save();ctx.clip(P);
  /* ряды и вертикальные швы вразбежку: ровная сетка читается плиткой */
  const bh=Math.max(4,hgt*.11), bw=bh*2.1;
  ctx.strokeStyle="rgba(0,0,0,.35)";ctx.lineWidth=1;
  for(let ry=0,i=0;ry<hgt+bh;ry+=bh,i++){
    const yy=8-ry;
    ctx.beginPath();ctx.moveTo(-ww,yy);ctx.lineTo(ww,yy);ctx.stroke();
    for(let sx=-ww+(i%2?bw*.5:0);sx<ww;sx+=bw){
      ctx.beginPath();ctx.moveTo(sx,yy);ctx.lineTo(sx,yy-bh);ctx.stroke();
      /* выбитый блок: дыра, за которой темнота, — самый дешёвый признак
         того, что стену не построили, а она осталась */
      if(h01(i,Math.round(sx),POI_SEED)<.09){
        ctx.fillStyle="rgba(0,0,0,.5)";
        ctx.fillRect(sx+1,yy-bh+1,bw-2,bh-2);
      }
    }
  }
  /* проём: на широкой стене он и задаёт масштаб — человек проходит насквозь */
  if(ww>50&&h01(9,9,POI_SEED)<.6){
    const dw=Math.min(ww*.3,16), dh=Math.min(hgt*.62,30);
    ctx.fillStyle="rgba(0,0,0,.72)";
    ctx.beginPath();
    ctx.moveTo(-dw,8);ctx.lineTo(-dw,8-dh+dw);
    ctx.quadraticCurveTo(0,8-dh-dw*.3,dw,8-dh+dw);
    ctx.lineTo(dw,8);ctx.closePath();ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle="rgba(0,0,0,.4)";ctx.lineWidth=1;ctx.stroke(P);
  poiDrift(ww*.95,pal);
}
function decoColumn(A){
  const {pal,tr,w,hgt}=A;
  const ww=w*.34;
  const brk=hgt*(.55+h01(1,3,POI_SEED)*.45);       // на какой высоте сломана
  const P=poiPath([[-ww,8],[-ww*.82,-brk],[ww*.82,-brk],[ww,8]],Math.min(2,ww*.3));
  ctx.fillStyle=poiBody(brk,dcol(pal,1,.85),dcol(pal,4,1));
  ctx.fill(P);
  decoMat(tr,P,ww,brk,A.ox,A.oy);
  /* каннелюры: три светлые и три тёмные полосы дают цилиндр без всякой
     математики — глаз читает круглое по градиенту вдоль, а не по контуру */
  ctx.save();ctx.clip(P);
  for(let i=-2;i<=2;i++){
    ctx.fillStyle=i<0?"rgba(0,0,0,.2)":"rgba(255,255,255,.10)";
    ctx.fillRect(i*ww*.34,-brk,ww*.16,brk+10);
  }
  /* стыки барабанов */
  ctx.strokeStyle="rgba(0,0,0,.3)";ctx.lineWidth=1;
  for(let yy=-brk*.3;yy>-brk;yy-=brk*.34){
    ctx.beginPath();ctx.moveTo(-ww,yy);ctx.lineTo(ww,yy);ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle="rgba(0,0,0,.4)";ctx.lineWidth=1;ctx.stroke(P);
  /* упавшие барабаны рядом: колонна стоит не одна, у неё есть история */
  const nd=1+Math.floor(h01(5,5,POI_SEED)*3);
  for(let i=0;i<nd;i++){
    const bx=ww*(1.8+i*1.5)*(h01(i,7,POI_SEED)<.5?-1:1), bh=ww*.8;
    ctx.save();ctx.translate(bx,dgy(A,bx)+2-bh*.4);ctx.rotate((h01(i,11,POI_SEED)-.5)*.4);
    const D=poiPath([[-ww*1.1,bh*.5],[-ww*1.1,-bh*.5],[ww*1.1,-bh*.5],[ww*1.1,bh*.5]],1.6);
    ctx.fillStyle=poiBody(bh,dcol(pal,1,.8),dcol(pal,3,1));
    ctx.fill(D);
    decoMat(tr,D,ww,bh,A.ox,A.oy);
    ctx.strokeStyle="rgba(0,0,0,.4)";ctx.stroke(D);
    ctx.restore();
  }
  poiDrift(ww*2.2,pal);
}
/* ── джунгли: полог ──
   Под пологом темно, и свет пробивает лишь местами — то же, что вышло у
   MAT_CHAR.moss со второго захода. Дерево здесь не «растение побольше»:
   его смысл — накрыть кадр сверху и дать глубину, поэтому крона выходит за
   верхнюю кромку, а не помещается в неё. */
function decoCanopy(A){
  const {pal,w,hgt}=A;
  /* M352: та же крона в двух вариантах — землеподобная (round: масс меньше,
     они круглее, лиан нет) и джунгли-двойник (twin: две лопасти по сторонам). */
  const RND=A.round?1:0, TWIN=A.twin?1:0;
  const sway=WIND*.02*(.7+.3*Math.sin(G.t*.02+POI_SEED%97));
  ctx.save();ctx.rotate(sway);
  const tw=Math.max(2,w*.16), lean=(h01(1,3,POI_SEED)-.5)*w*.7;
  /* корни-контрфорсы: без них ствол вставлен в землю, как палка */
  ctx.fillStyle=dcol(pal,0,.9);
  for(let i=-1;i<=1;i++){
    const rx=i*tw*2.2;
    ctx.beginPath();ctx.moveTo(rx,6);ctx.lineTo(i*tw*.5,-hgt*.12);
    ctx.lineTo(i*tw*.5+tw*.5,-hgt*.1);ctx.lineTo(rx+tw*.7,6);
    ctx.closePath();ctx.fill();
  }
  /* ствол сужается кверху и слегка кривой */
  const T=new Path2D();
  T.moveTo(-tw,4);
  T.quadraticCurveTo(-tw*.7+lean*.4,-hgt*.55,-tw*.4+lean,-hgt);
  T.lineTo(tw*.4+lean,-hgt);
  T.quadraticCurveTo(tw*.7+lean*.4,-hgt*.55,tw,4);
  T.closePath();
  /* ствол ТЕМНЕЕ листвы: на кадре он вышел светлее кроны и одного цвета со
     стеблями мелкой флоры — дерево читалось не деревом, а трубой под шляпкой.
     Светлое здесь только узкая кромка со стороны солнца. */
  const g=ctx.createLinearGradient(-tw,0,tw,0);
  g.addColorStop(0,dcol(pal,0,.75));
  g.addColorStop(.72,dcol(pal,0,1.15));
  g.addColorStop(1,dcol(pal,2,.8));
  ctx.fillStyle=g;ctx.fill(T);
  /* Крона. Первый кадр дал гриб: ровные светлые эллипсы сложились в один диск,
     да ещё ярче всего остального в кадре. Под пологом ТЕМНО — это и есть закон
     джунглей (тот же, что у MAT_CHAR.moss). Поэтому: массы тёмные, их низ
     рваный, свет — редкими пятнами по верхним кромкам, и часть листвы висит
     НИЖЕ верха, на стволе, иначе шляпка снова читается шляпкой. */
  const nb=(RND?3:5)+Math.floor(h01(2,5,POI_SEED)*3);
  const mass=(bx,by,br,dark)=>{
    ctx.fillStyle=dcol(pal,dark?0:1,dark?1.25:1.05,.94);
    ctx.beginPath();
    for(let s=0;s<=16;s++){
      const a=s/16*TAU;
      /* низ кроны рвётся сильнее верха: там свисают листья, а не кромка шара */
      const rr=br*(.82+h01(s,Math.round(bx),POI_SEED)*(RND?.16:.36))*(Math.sin(a)>0?(RND?1.05:1.25):1);
      const px=bx+Math.cos(a)*rr*(RND?1.05:1.2), py=by+Math.sin(a)*rr*(RND?.92:.78);
      if(s===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
    }
    ctx.closePath();ctx.fill();
  };
  for(let i=0;i<nb;i++){
    /* часть масс спускается по стволу: полог не плоский, у него есть ярусы */
    const drop=h01(i,23,POI_SEED)<.35?hgt*(.18+h01(i,29,POI_SEED)*.3):0;
    const bx=lean*(1-i/nb)+(h01(i,7,POI_SEED)-.5)*hgt*(drop?.42:.8)+(TWIN?(i%2?1:-1)*hgt*.26:0);
    const by=-hgt+drop-h01(i,11,POI_SEED)*hgt*.16;
    const br=hgt*(.17+h01(i,13,POI_SEED)*.15)*(drop?.7:1);
    /* ветка от ствола к массе. Без неё нижние ярусы висели отдельными
       полками — второй кадр дал не дерево, а пагоду: масса не связана со
       стволом ничем, и глаз читает её как самостоятельный предмет */
    if(drop||Math.abs(bx-lean)>hgt*.2){
      ctx.strokeStyle=dcol(pal,1,1.1);ctx.lineWidth=Math.max(1.4,tw*.4);
      ctx.beginPath();ctx.moveTo(lean*.9,-hgt*(drop?.82:.9));
      ctx.quadraticCurveTo((bx+lean)*.5,by+br*.2,bx,by+br*.15);ctx.stroke();
    }
    mass(bx,by,br,i%2===0);
    /* свет пробивает пятнами, а не заливает шляпку целиком */
    for(let s=0;s<3;s++){
      if(h01(i,s+41,POI_SEED)<.45)continue;
      const sx=bx+(h01(i,s+43,POI_SEED)-.5)*br*1.6;
      const sr=br*(.14+h01(i,s+47,POI_SEED)*.16);
      ctx.fillStyle=dcol(pal,3,1,.22);
      ctx.beginPath();ctx.ellipse(sx,by-br*.42,sr*1.5,sr*.6,-.15,0,TAU);ctx.fill();
    }
  }
  /* лианы: они и связывают крону с землёй, и качаются заметнее ствола */
  ctx.lineWidth=Math.max(1,w*.03);
  for(let i=0;i<(RND?0:TWIN?6:4);i++){
    const vx=lean+(h01(i,17,POI_SEED)-.5)*hgt*(TWIN?1:.6);
    const vl=hgt*(.3+h01(i,19,POI_SEED)*.5);
    const sw2=WIND*(4+i)*(.6+.4*Math.sin(G.t*.03+i*1.7));
    ctx.strokeStyle=dcol(pal,1,.9,.75);
    ctx.beginPath();ctx.moveTo(vx,-hgt*.96);
    ctx.quadraticCurveTo(vx+sw2,-hgt*.96+vl*.6,vx+sw2*1.6,-hgt*.96+vl);
    ctx.stroke();
  }
  ctx.restore();
}
function decoFrond(A){
  const {pal,w,hgt}=A;
  const n=5+Math.floor(h01(1,3,POI_SEED)*4);
  for(let i=0;i<n;i++){
    const u=(i+.5)/n-.5;
    const ang=u*1.5+(h01(i,5,POI_SEED)-.5)*.25;
    const L=hgt*(.6+h01(i,7,POI_SEED)*.6);
    const sw2=WIND*3.2*(.6+.4*Math.sin(G.t*.035+i*1.3));
    ctx.save();ctx.rotate(ang);
    /* стебель гнётся, а лист — не заливка, а ряд перьев по нему: пятно
       здесь читалось бы кустом любого мира */
    ctx.strokeStyle=dcol(pal,2,1);ctx.lineWidth=Math.max(1,w*.05);
    ctx.beginPath();ctx.moveTo(0,2);
    ctx.quadraticCurveTo(sw2*.5,-L*.6,sw2+L*.22,-L);
    ctx.stroke();
    ctx.strokeStyle=dcol(pal,i%2?3:2,1,.9);ctx.lineWidth=Math.max(1,w*.035);
    for(let s=2;s<=7;s++){
      const t=s/8, px=lerp(0,sw2+L*.22,t)+sw2*.2*t, py=lerp(2,-L,t);
      const ll=L*.2*Math.sin(t*Math.PI);
      ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px-ll*.7,py-ll*.5);ctx.stroke();
      ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+ll*.7,py-ll*.3);ctx.stroke();
    }
    ctx.restore();
  }
  ctx.fillStyle=dcol(pal,0,1,.5);
  ctx.beginPath();ctx.ellipse(0,3,w*.5,Math.max(2,w*.12),0,0,TAU);ctx.fill();
}
