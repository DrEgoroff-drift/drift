/* ══════════════ зимовка: кадр ══════════════
   Одна комната, снятая прямо. Мерило — человек: всё остальное меряется от его
   роста, и потому койка, стол и панель сразу читаются койкой, столом и
   панелью, а не прямоугольниками.

   ПОРЯДОК СЛОЁВ, от дальнего к ближнему: стена с рёбрами — окно и то, что за
   ним — трубы — панель — печь — стол — койка — человек — воздух комнаты
   (пыль, виньетка). Каждый следующий темнее и резче предыдущего, и весь свет
   в кадре из трёх источников, которые игрок сам и включает: лампа (СВЕТ),
   печь (ТЕПЛО) и окно, которое не выключается никогда.

   СВЕТ ЗДЕСЬ — ЭТО ПРИБОР. Убавил лампу ради антенны — и комнату видно хуже,
   по-настоящему. Баланс не пишется цифрой в углу, он виден глазами.

   ЧТО КЭШИРУЕТСЯ. Стена, трубы, панель, стол и койка не двигаются: они
   кладутся в `screenLayer` с ключом по уровням света и тепла, и перерисовка
   идёт только когда игрок дёрнул рычаг (правило «что не движется, красится
   один раз»). Приборы, календарь и зимовщик — выпечка того же рода. Каждый
   кадр видеокарта рисует лишь живое: окно, огонь, свет, пыль (G11). */
const WIN_C={
  wall:[38,44,48], wall2:[28,33,37], rib:[52,60,64],
  panel:[30,36,40], panelHi:[74,84,88],
  warm:[255,168,88], lamp:[255,224,168], cold:[128,168,204],
  metal:[96,104,108], dark:[14,17,20]
};
function wcol(a,k){const m=k==null?1:k;
  return "rgb("+Math.round(a[0]*m)+","+Math.round(a[1]*m)+","+Math.round(a[2]*m)+")";}
function wrgba(a,al){return "rgba("+a[0]+","+a[1]+","+a[2]+","+al.toFixed(3)+")";}

/* ── геометрия комнаты ──
   Всё меряется ростом человека. Потолок — полторы его высоты: станционная
   каюта низкая, и первый счёт с потолком в две с половиной головы читался
   ангаром, а не жильём. Одна геометрия на картинку и на попадание пальцем:
   `winGeom()` зовут и `drawWinter`, и `winHit` — иначе они разъедутся. */
function winGeom(){
  /* Комната занимает КАДР, а не его нижнюю половину: первый счёт вёл потолок
     от роста человека вниз, и сверху оставалась треть пустой черноты. Считаем
     наоборот — от кадра к человеку. Низ отдан пульту и пэдам, они и есть
     нижняя кромка комнаты. */
  const cei=H*0.085, flo=H*0.715;
  const man=(flo-cei)/1.55;
  return {
    man,flo,cei,
    panel:{x:W*0.045,y:cei+man*0.20,w:W*0.215,h:man*0.70},
    /* печь приподнята: её низ уходил под виньетку и пульт, и опора терялась */
    stove:{x:W*0.065,y:flo-man*0.50,w:W*0.115,h:man*0.40},
    table:{x:W*0.375,y:flo-man*0.42,w:W*0.235,h:man*0.42},
    bunk :{x:W*0.635,y:flo-man*0.34,w:W*0.215,h:man*0.34},
    win  :{x:W*0.630,y:cei+man*0.16,w:W*0.205,h:man*0.58},
    pipes:{x:W*0.285,y:cei,w:W*0.042,h:flo-cei},
    cal  :{x:W*0.880,y:cei+man*0.22,w:W*0.085,h:man*0.44},
    manx :W*0.360
  };
}
function winLevers(g){
  const L=[],n=WIN_USE.length;
  const pad=g.panel.w*0.045, w=(g.panel.w-pad*2)/n;
  for(let i=0;i<n;i++)
    L.push({k:WIN_USE[i],x:g.panel.x+pad+w*i,y:g.panel.y+g.panel.h*0.20,
            w:w,h:g.panel.h*0.76});
  return L;
}
/* ── свет ──
   Три источника, и все три игрок сам и включает: лампа над столом, печь слева,
   окно справа. `winLit` отвечает, сколько света приходит в точку — по нему
   красится КАЖДОЕ тело в комнате. Без этого комната была ровной серой стеной с
   предметами того же серого, и убавленный свет ничего не менял на вид. */
function winLit(g,W0,x,y){
  const li=W0.pw.light|0, he=W0.pw.heat|0;
  let k=0.10;                                        /* дежурное свечение приборов */
  if(li>0){
    const lx=g.table.x+g.table.w*0.5, ly=g.cei+g.man*0.10;
    const d=Math.hypot((x-lx)/(g.man*2.2),(y-ly)/(g.man*1.8));
    k+=Math.min(1,li/3)*0.62/(1+d*d);
  }
  if(he>0){
    const sx=g.stove.x+g.stove.w*0.5, sy=g.stove.y+g.stove.h*0.4;
    const d=Math.hypot((x-sx)/(g.man*1.5),(y-sy)/(g.man*1.3));
    k+=Math.min(1,he/3)*0.34/(1+d*d);
  }
  {
    const wx=g.win.x+g.win.w*0.5, wy=g.win.y+g.win.h*0.6;
    const d=Math.hypot((x-wx)/(g.man*2.0),(y-wy)/(g.man*1.6));
    k+=0.26/(1+d*d);
  }
  return clamp(k,0.08,1.25);
}
/* тон света в точке: слева тёплый от печи, справа холодный от окна. Ровно
   этот раскол и делает комнату комнатой, а не серым коробом */
function winTone(g,W0,x,y){
  const he=W0.pw.heat|0;
  const warm=he>0?Math.min(1,he/3)*clamp(1-(x-g.stove.x)/(g.man*3.0),0,1):0;
  const cold=clamp(1-Math.abs(x-(g.win.x+g.win.w*0.5))/(g.man*3.6),0,1);
  return {warm,cold};
}
/* тело + обвод + касание: один приём на все предметы комнаты (правило
   «много кусков — одно тело»). Обвод идёт со стороны ближнего света. */
function winBody(c,g,W0,r,base,opt){
  const o=opt||{};
  const cx=r.x+r.w*0.5, cy=r.y+r.h*0.5;
  const k=winLit(g,W0,cx,cy), t=winTone(g,W0,cx,cy);
  /* ── раскол сказан ГРОМЧЕ (хвост M197) ──
     Было .22 и .16 — то есть даже при полном тоне цвет уходил к своему свету
     на пятую часть, и весь замысел «слева печь, справа мороз» проговаривался
     шёпотом: на снимке комната читалась одним ровным бурым. Холоду вес дан
     БОЛЬШЕ, чем теплу, и это не вкус: общий свет в комнате даёт лампа, а она
     тёплая, — значит холодному, чтобы вообще прозвучать, надо громче. */
  let col=pcMix(base,WIN_C.warm,t.warm*0.40);
  col=pcMix(col,WIN_C.cold,t.cold*0.42);
  c.fillStyle=wcol(col,k);
  c.fillRect(r.x,r.y,r.w,r.h);
  if(o.edge!==false){
    const fromLeft=cx<g.win.x;
    c.fillStyle=wrgba(fromLeft?WIN_C.warm:WIN_C.cold,0.14+k*0.16);
    if(fromLeft)c.fillRect(r.x+r.w-Math.max(1,r.w*0.03),r.y,Math.max(1,r.w*0.03),r.h);
    else c.fillRect(r.x,r.y,Math.max(1,r.w*0.03),r.h);
    c.fillStyle=wrgba([255,255,255],0.10+k*0.12);
    c.fillRect(r.x,r.y,r.w,Math.max(1,H*0.0022));
  }
  if(o.floor){
    c.fillStyle="rgba(0,0,0,.34)";
    c.fillRect(r.x-r.w*0.02,g.flo,r.w*1.04,Math.max(2,H*0.012));
  }
}
/* ── статика комнаты ──
   Ключ слоя — только то, что её меняет: кадр, свет и тепло. Всё остальное
   (стрелки, пыль, метель, человек) кладётся поверх каждый кадр. */
function winRoomLayer(W0){
  const li=W0.pw.light|0, he=W0.pw.heat|0;
  return screenLayer("winroom"+li+"_"+he,(c)=>{
    const g=winGeom();
    /* ── 1. стена: панели с рёбрами, освещённые неровно ── */
    for(let x=0;x<W;x+=W*0.055){
      const k=winLit(g,W0,x+W*0.027,g.cei+g.man*0.7);
      const t=winTone(g,W0,x,g.cei+g.man*0.7);
      let col=pcMix(WIN_C.wall,WIN_C.warm,t.warm*0.36);
      col=pcMix(col,WIN_C.cold,t.cold*0.40);
      c.fillStyle=wcol(col,k);
      c.fillRect(x,g.cei,W*0.055+1,g.flo-g.cei);
      c.fillStyle=wrgba(WIN_C.dark,0.34);
      c.fillRect(x,g.cei,Math.max(1,W*0.0025),g.flo-g.cei);
      c.fillStyle=wrgba([255,255,255],0.05+k*0.06);
      c.fillRect(x+Math.max(1,W*0.0025),g.cei,Math.max(1,W*0.002),g.flo-g.cei);
    }
    /* шов на высоте плеча — он и даёт стене масштаб */
    c.fillStyle=wrgba(WIN_C.dark,0.30);
    c.fillRect(0,g.flo-g.man*0.98,W,Math.max(2,H*0.005));
    c.fillStyle=wrgba([255,255,255],0.06);
    c.fillRect(0,g.flo-g.man*0.98+Math.max(2,H*0.005),W,Math.max(1,H*0.002));

    /* ── 2. потолок: короб и труба поперёк ── */
    c.fillStyle=wcol(WIN_C.dark,1);
    c.fillRect(0,0,W,g.cei);
    c.fillStyle=wcol(WIN_C.wall2,0.55);
    c.fillRect(0,g.cei-H*0.022,W,H*0.022);
    c.fillStyle=wrgba([255,255,255],0.07);
    c.fillRect(0,g.cei-H*0.022,W,Math.max(1,H*0.002));
    /* короб вентиляции: он и гудит за кадром */
    c.fillStyle=wcol(WIN_C.metal,0.34);
    c.fillRect(0,g.cei-H*0.070,W,H*0.046);
    for(let x=0;x<W;x+=W*0.05){
      c.fillStyle=wrgba(WIN_C.dark,0.35);
      c.fillRect(x,g.cei-H*0.070,Math.max(2,W*0.004),H*0.046);
    }
    c.fillStyle=wrgba([255,255,255],0.06);
    c.fillRect(0,g.cei-H*0.070,W,Math.max(1,H*0.002));

    /* ── 3. пол ── */
    c.fillStyle=wcol(WIN_C.wall2,0.42);
    c.fillRect(0,g.flo,W,H-g.flo);
    for(let x=0;x<W;x+=W*0.022){
      const k=winLit(g,W0,x,g.flo+H*0.03);
      c.fillStyle=wrgba(WIN_C.metal,0.10+k*0.10);
      c.fillRect(x,g.flo+H*0.008,Math.max(1,W*0.009),H-g.flo);
    }
    c.fillStyle=wrgba(WIN_C.dark,0.45);
    c.fillRect(0,g.flo,W,Math.max(2,H*0.005));

    /* ── 4. трубы: их и слушают ── */
    {
      const p=g.pipes;
      for(let i=0;i<3;i++){
        const x=p.x+i*p.w*0.36, w=p.w*0.26;
        const k=winLit(g,W0,x+w*0.5,p.y+p.h*0.5);
        c.fillStyle=wcol(WIN_C.metal,k*0.9);
        c.fillRect(x,p.y,w,p.h);
        c.fillStyle=wrgba([255,255,255],0.10+k*0.14);
        c.fillRect(x,p.y,Math.max(1,w*0.26),p.h);
        c.fillStyle=wrgba(WIN_C.dark,0.34);
        c.fillRect(x+w-Math.max(1,w*0.22),p.y,Math.max(1,w*0.22),p.h);
        for(let y=p.y+p.h*0.14;y<p.y+p.h;y+=p.h*0.28){
          c.fillStyle=wcol(WIN_C.rib,k);
          c.fillRect(x-w*0.16,y,w*1.32,Math.max(2,H*0.008));
          c.fillStyle=wrgba([255,255,255],0.10);
          c.fillRect(x-w*0.16,y,w*1.32,Math.max(1,H*0.002));
        }
      }
    }

    /* ── 5. панель: плита, и на ней рамка под каждый прибор ── */
    {
      const p=g.panel;
      winBody(c,g,W0,p,WIN_C.panel,{});
      c.strokeStyle=wrgba(WIN_C.panelHi,0.5);
      c.lineWidth=Math.max(1,H*0.002);
      c.strokeRect(p.x+.5,p.y+.5,p.w-1,p.h-1);
      for(const lv of winLevers(g)){
        c.fillStyle=wrgba(WIN_C.dark,0.34);
        c.fillRect(lv.x+lv.w*0.06,lv.y,lv.w*0.88,lv.h);
        c.strokeStyle=wrgba(WIN_C.panelHi,0.30);
        c.strokeRect(lv.x+lv.w*0.06+.5,lv.y+.5,lv.w*0.88-1,lv.h-1);
      }
      for(const dx of [0.025,0.975])for(const dy of [0.04,0.96]){
        c.fillStyle=wrgba(WIN_C.panelHi,0.55);
        c.beginPath();c.arc(p.x+p.w*dx,p.y+p.h*dy,Math.max(1.3,H*0.0035),0,TAU);c.fill();
      }
    }

    /* ── 6. печь: короб, дверца, ножки ── */
    {
      const s=g.stove;
      winBody(c,g,W0,s,WIN_C.metal,{floor:true});
      c.fillStyle=wrgba(WIN_C.dark,0.55);
      c.fillRect(s.x+s.w*0.14,s.y+s.h*0.16,s.w*0.72,s.h*0.42);
      c.fillStyle=wcol(WIN_C.rib,0.8);
      c.fillRect(s.x,s.y+s.h*0.66,s.w,Math.max(3,s.h*0.06));
      /* ножки до самого пола и тень под ними: печь ДОЛЖНА на чём-то стоять,
         иначе она висит в темноте нижней кромки кадра */
      const legH=g.flo-(s.y+s.h);
      c.fillRect(s.x+s.w*0.08,s.y+s.h,Math.max(3,s.w*0.09),legH);
      c.fillRect(s.x+s.w*0.83,s.y+s.h,Math.max(3,s.w*0.09),legH);
      c.fillStyle=wrgba([255,255,255],0.10);
      c.fillRect(s.x+s.w*0.08,s.y+s.h,Math.max(1,s.w*0.03),legH);
      c.fillStyle="rgba(0,0,0,.38)";
      c.fillRect(s.x-s.w*0.04,g.flo-Math.max(2,H*0.004),s.w*1.08,Math.max(3,H*0.012));
      /* труба от печи вверх — тепло куда-то уходит, и это видно */
      c.fillStyle=wcol(WIN_C.metal,winLit(g,W0,s.x+s.w*0.5,s.y-g.man*0.3));
      c.fillRect(s.x+s.w*0.42,g.cei,Math.max(3,s.w*0.16),s.y-g.cei);
    }

    /* ── 7. стол: столешница с кромкой и две ноги ── */
    {
      const t=g.table;
      const top={x:t.x,y:t.y,w:t.w,h:Math.max(4,t.h*0.13)};
      winBody(c,g,W0,top,WIN_C.metal,{});
      const k=winLit(g,W0,t.x+t.w*0.5,t.y);
      c.fillStyle=wrgba(WIN_C.dark,0.5);
      c.fillRect(t.x,t.y+top.h,t.w,Math.max(2,t.h*0.05));
      c.fillStyle=wcol(WIN_C.wall2,k*0.8);
      c.fillRect(t.x+t.w*0.08,t.y+top.h,Math.max(3,t.w*0.035),g.flo-t.y-top.h);
      c.fillRect(t.x+t.w*0.88,t.y+top.h,Math.max(3,t.w*0.035),g.flo-t.y-top.h);
      c.fillStyle="rgba(0,0,0,.30)";
      c.fillRect(t.x,g.flo,t.w,Math.max(2,H*0.010));
    }

    /* ── 8. койка ──
       Первый счёт давал доску с подушкой. Койка читается койкой от ТОЛЩИНЫ:
       у неё есть царга сбоку, под ней виден просвет до пола, матрас лежит НА
       раме и свисает за край, а одеяло откинуто углом — под ним видна светлая
       простыня. Всё вместе — четыре тела, и ни одно не плоская полоса. */
    {
      const b=g.bunk;
      const k=winLit(g,W0,b.x+b.w*0.5,b.y);
      const top=b.y;                       /* верх рамы */
      /* тень на полу под койкой: она и говорит, что койка стоит, а не нарисована */
      c.fillStyle="rgba(0,0,0,.34)";
      c.fillRect(b.x-b.w*0.01,g.flo-Math.max(2,H*0.004),b.w*1.02,Math.max(3,H*0.012));
      /* ножки и царга */
      c.fillStyle=wcol(WIN_C.rib,k*0.6);
      c.fillRect(b.x+b.w*0.06,top+b.h*0.20,Math.max(3,b.w*0.035),g.flo-top-b.h*0.20);
      c.fillRect(b.x+b.w*0.88,top+b.h*0.20,Math.max(3,b.w*0.035),g.flo-top-b.h*0.20);
      c.fillStyle=wcol(WIN_C.metal,k*0.72);
      c.fillRect(b.x,top+b.h*0.06,b.w,Math.max(5,b.h*0.16));
      c.fillStyle=wrgba(WIN_C.dark,0.34);
      c.fillRect(b.x,top+b.h*0.06+Math.max(5,b.h*0.16),b.w,Math.max(2,b.h*0.04));
      /* матрас: свисает за царгу, и оттого у койки появляется толщина */
      c.fillStyle=wcol([96,98,94],k*0.95);
      c.beginPath();
      c.moveTo(b.x-b.w*0.015,top+b.h*0.08);
      c.lineTo(b.x+b.w*1.015,top+b.h*0.05);
      c.lineTo(b.x+b.w*1.015,top-b.h*0.10);
      c.lineTo(b.x-b.w*0.015,top-b.h*0.07);
      c.closePath();c.fill();
      c.fillStyle=wrgba([255,255,255],0.10+k*0.12);
      c.fillRect(b.x-b.w*0.015,top-b.h*0.10,b.w*1.03,Math.max(1.5,b.h*0.022));
      /* простыня из-под одеяла */
      c.fillStyle=wcol([182,178,166],k);
      c.beginPath();
      c.moveTo(b.x+b.w*0.05,top-b.h*0.08);
      c.lineTo(b.x+b.w*0.52,top-b.h*0.13);
      c.lineTo(b.x+b.w*0.52,top+b.h*0.02);
      c.lineTo(b.x+b.w*0.05,top+b.h*0.05);
      c.closePath();c.fill();
      /* одеяло откинуто углом — единственное тёплое пятно в комнате */
      c.fillStyle=wcol([104,74,52],k);
      c.beginPath();
      c.moveTo(b.x+b.w*0.34,top-b.h*0.11);
      c.lineTo(b.x+b.w*0.92,top-b.h*0.17);
      c.lineTo(b.x+b.w*0.92,top+b.h*0.04);
      c.lineTo(b.x+b.w*0.34,top+b.h*0.07);
      c.closePath();c.fill();
      /* отворот: треугольник светлее самого одеяла */
      c.fillStyle=wcol([134,102,74],Math.min(1.1,k*1.12));
      c.beginPath();
      c.moveTo(b.x+b.w*0.34,top-b.h*0.11);
      c.lineTo(b.x+b.w*0.50,top-b.h*0.13);
      c.lineTo(b.x+b.w*0.38,top+b.h*0.05);
      c.closePath();c.fill();
      /* две складки поперёк */
      c.fillStyle=wrgba(WIN_C.dark,0.26);
      for(const q of [0.60,0.76]){
        c.beginPath();
        c.moveTo(b.x+b.w*q,top-b.h*0.145);
        c.lineTo(b.x+b.w*(q+0.035),top-b.h*0.150);
        c.lineTo(b.x+b.w*(q+0.030),top+b.h*0.045);
        c.lineTo(b.x+b.w*(q-0.005),top+b.h*0.050);
        c.closePath();c.fill();
      }
      /* подушка: продавлена, со складкой у изголовья */
      c.fillStyle=wcol([176,170,156],Math.min(1.1,k*1.05));
      c.beginPath();
      c.ellipse(b.x+b.w*0.14,top-b.h*0.16,b.w*0.12,b.h*0.085,-0.10,0,TAU);c.fill();
      c.fillStyle=wrgba(WIN_C.dark,0.20);
      c.beginPath();
      c.ellipse(b.x+b.w*0.14,top-b.h*0.135,b.w*0.085,b.h*0.030,-0.10,0,TAU);c.fill();
      /* спинка в изголовье */
      c.fillStyle=wcol(WIN_C.rib,k*0.85);
      c.fillRect(b.x-b.w*0.02,top-b.h*0.62,Math.max(3,b.w*0.045),b.h*0.62);
      c.fillStyle="rgba(0,0,0,.32)";
      c.fillRect(b.x,g.flo,b.w,Math.max(2,H*0.011));
    }
  });
}
/* ── кадр на видеокарте (G11) ──
   Комната — слой screenLayer (стена, трубы, панель, печь, стол, койка; ключ —
   свет и тепло). Окно — живое поле: небо планеты, гряда, метель в три глубины,
   иней, что растёт от рамы, и тёплый отблеск лампы на стекле изнутри. Всё, что
   меняется только рычагом или днём (рама, лампа, стол, приборы, календарь,
   зимовщик), — одна выпечка. Свет — сложением поверх всего, по пикселю: огонь
   в печи дрожит и греет левый край, конус лампы висит в воздухе с пылью и
   ложится пятном на пол, окно проливает холод на пол и стену. Потом темнота
   по краям — тем гуще, чем меньше света дал игрок. Без устройства не рисуется
   ничего: 2D-пути у зимовки больше нет. */
function drawWinter(){
  const W0=winAll();if(!W0)return;
  const pass=gpuScene();if(!pass)return;
  const g=winGeom(),sz=roomSz();
  gpuImage(pass,winRoomLayer(W0),[{x:W/2,y:H/2,w:W,h:H}]);
  winView(pass,g,W0);
  const F=(W0.faults||[]).map(f=>f.k).join(",");
  const key=sz+"|"+WIN_USE.map(k=>W0.pw[k]|0).join("")+"|"+W0.day+"|"+F+"|"+W0.sx+","+W0.sy+","+W0.pi;
  const pr=roomBake("win.props",key,W,H,()=>winProps(g,W0));
  if(pr)gpuImage(pass,pr,[{x:W/2,y:H/2,w:W,h:H}]);
  winLight(pass,g,W0);
  winGlow(pass,g,W0);
  winDark(pass,g,W0);
  const tx=roomBake("win.text",sz+"|"+W0.day+"/"+W0.days+"|"+W0.pname+"|"+F,W,H*0.1,()=>winText(W0));
  if(tx)gpuImage(pass,tx,[{x:W/2,y:H*0.05,w:W,h:H*0.1}]);
}
/* окно: небо планеты сверху вниз, дальняя гряда, метель — три слоя штрихов
   (дальние мелкие и медленные, ближние длинные), иней корой от кромки */
const WIN_VIEW_WGSL=ROOM_WGSL_NOISE+`
fn snow(q:vec2f,sc:f32,sp:f32,t:f32,len:f32,sd:f32)->f32{
  let dir=normalize(vec2f(-.47,.88));
  let s=q/sc+dir*t*sp;
  let c=floor(s);let f=fract(s);
  var a=0.;
  for(var j=-1;j<=1;j++){for(var i=-1;i<=1;i++){
    let o=vec2f(f32(i),f32(j));let h=rh(c+o+sd);
    if(h>.62){continue;}
    let pc=o+vec2f(rh(c+o+sd+3.1),rh(c+o+sd+7.7));
    let v=f-pc;let tt=clamp(dot(v,dir),-len,0.);
    let d=length(v-dir*tt)*sc;
    a=max(a,(1.-smoothstep(.35,1.1,d))*(1.+tt/len*.7));
  }}
  return a;}
fn field(p:vec2f,uv:vec2f)->vec4f{
  let r=fu.v[0];let t=fu.v[1].x;let ph=fu.v[1].y;let lamp=fu.v[1].z;
  let q=p-r.xy;
  if(q.x<0.||q.y<0.||q.x>r.z||q.y>r.w){return vec4f(0.);}
  let v=q.y/r.w;
  var c=mix(fu.v[2].xyz,fu.v[3].xyz,v);
  /* дальняя гряда: у окна есть горизонт */
  let ry=r.w*.66-sin(q.x*.013+ph)*r.w*.09-rn(vec2f(q.x*.05,ph))*r.w*.03;
  let mk=smoothstep(-.8,.8,q.y-ry);
  c=mix(c,vec3f(.063,.094,.133)*.9+c*.22,mk*.8);
  /* метель: дальняя пелена, средний и ближний штрих */
  let veil=rfbm(vec2f(q.x/r.w*3.+t*.25,q.y/r.w*2.-t*.45));
  c=c+vec3f(.55,.62,.70)*veil*.10;
  let s=snow(q,r.w*.035,2.4,t,.6,1.)*.35+snow(q,r.w*.06,1.7,t,1.2,5.)*.45+snow(q,r.w*.11,1.2,t,1.8,9.)*.55;
  c=mix(c,vec3f(.84,.89,.95),clamp(s,0.,1.)*.55);
  /* иней: корой от нижней кромки и от углов, края рваные */
  let e=min(min(q.x,r.z-q.x),r.w-q.y)/r.w;
  let bot=(r.w-q.y)/r.w;
  let fr=rfbm(q/r.w*vec2f(9.,11.));
  let fm=smoothstep(.10,.0,min(bot*1.1,e*1.6)-fr*.10);
  c=mix(c,vec3f(.80,.87,.93),fm*.55);
  c=c+vec3f(.88,.93,.97)*smoothstep(.72,.9,fr)*smoothstep(.34,.0,bot)*.22;
  /* лампа отражается в стекле изнутри: тёплое пятно у левой кромки */
  c=c+vec3f(1.,.82,.58)*lamp*.10*exp(-q.x/(r.z*.22))*exp(-pow((v-.28)/.35,2.));
  return vec4f(c,1.);}`;
const WIN_VIEW_U=new Float32Array(16);
function winView(pass,g,W0){
  const w=g.win,u=WIN_VIEW_U;
  const sys=getSystem(W0.sx,W0.sy);
  const p=(sys.planets||[])[W0.pi]||(sys.planets||[])[0];
  const sk=(p&&p.T)?p.T:TYPES.ice;
  u[0]=w.x;u[1]=w.y;u[2]=w.w;u[3]=w.h;
  u[4]=(G.t/60)%3600;u[5]=W0.sx;u[6]=Math.min(1,(W0.pw.light|0)/3);u[7]=0;
  for(let i=0;i<3;i++){u[8+i]=sk.sky[1][i]*0.60/255;u[12+i]=sk.sky[0][i]*0.46/255;}
  gpuField(pass,"win.view",WIN_VIEW_WGSL,u);
}
/* свет сложением: огонь в дверце печи, её тепло по комнате и пятно на полу; конус
   лампы в воздухе (с пылью, что медленно плывёт в луче) и её пятно на полу;
   холод из окна трапецией на пол и пятном на стену. Мягкие края — по пикселю */
const WIN_LIGHT_WGSL=ROOM_WGSL_NOISE+`
fn trap(p:vec2f,top:f32,bot:f32,cx0:f32,w0:f32,cx1:f32,w1:f32,soft:f32)->f32{
  let v=(p.y-top)/(bot-top);if(v<0.||v>1.){return 0.;}
  let cx=mix(cx0,cx1,v);let hw=mix(w0,w1,v);
  return 1.-smoothstep(hw-soft*(.3+v),hw+soft*(.3+v),abs(p.x-cx));}
fn field(p:vec2f,uv:vec2f)->vec4f{
  let t=fu.v[0].x;let man=fu.v[0].y;let flo=fu.v[0].z;let Ht=fu.res.w;
  let WARM=vec3f(1.,.659,.345);let LAMP=vec3f(1.,.878,.659);let COLD=vec3f(.502,.659,.8);
  var c=vec3f(0.);
  /* печь: огонь за дверцей — языки вверх, и его тепло */
  let sk=fu.v[1].x;
  if(sk>0.){
    let fl=fu.v[1].y;let dr=fu.v[2];
    let q=(p-dr.xy)/dr.zw;
    if(q.x>0.&&q.x<1.&&q.y>0.&&q.y<1.){
      let n=rfbm(vec2f(q.x*4.,q.y*3.+t*1.6));
      let tongue=smoothstep(.15,.9,(1.-q.y)*.6+n*.7-.15);
      let base=smoothstep(.35,1.,q.y);
      let heat=clamp(tongue*.8+base*.9,0.,1.)*(.55+.45*sk)*fl;
      c=c+mix(vec3f(.85,.25,.05),vec3f(1.2,.85,.45),heat)*heat*1.1;
    }
    let sc=fu.v[1].zw;
    let d=length((p-sc)/(man*vec2f(1.,1.1)));
    let wob=.92+.08*rn(vec2f(t*2.,p.y*.02));
    c=c+WARM*sk*fl*wob*(.30/(1.+d*d*1.4));
    let fd=length((p-vec2f(sc.x,flo+Ht*.02))/vec2f(dr.z*1.9,Ht*.03));
    c=c+WARM*sk*fl*.16*(1.-smoothstep(.2,1.,fd));
  }
  /* лампа: конус в воздухе и пятно на полу */
  let lk=fu.v[3].x;
  if(lk>0.){
    let lx=fu.v[3].y;let ly=fu.v[3].z;
    let cone=trap(p,ly,flo,lx,man*.12,lx,man*1.05,man*.07);
    let v=clamp((p.y-ly)/(flo-ly),0.,1.);
    let dust=.70+.6*rfbm(vec2f(p.x/(man*.18),p.y/(man*.22)-t*.05));
    c=c+LAMP*lk*cone*(.30*(1.-v*.8))*dust;
    let pd=length((p-vec2f(lx,flo+Ht*.012))/vec2f(man*1.0,Ht*.026));
    c=c+LAMP*lk*.20*(1.-smoothstep(.1,1.,pd));
    let gd=length((p-vec2f(lx,ly))/man);
    c=c+LAMP*lk*.06/(1.+gd*gd*4.);
  }
  /* окно: холод на полу и на стене вокруг */
  let w=fu.v[4];
  let wb=w.y+w.w;
  let tr=trap(p,wb,flo+Ht*.05,w.x+w.z*.5,w.z*.5,w.x+w.z*.5,w.z*.95,w.z*.06);
  let tv=clamp((p.y-wb)/(flo+Ht*.05-wb),0.,1.);
  c=c+COLD*tr*mix(.36,.02,pow(tv,.8))*(.85+.3*rfbm(vec2f(p.x*.02-t*.3,p.y*.03)));
  let wd=length((p-(w.xy+w.zw*.5))/vec2f(w.z*1.5,w.z*1.5));
  c=c+COLD*.13*(1.-smoothstep(.12,1.,wd));
  return vec4f(c,0.);}`;
const WIN_LIGHT_U=new Float32Array(20);
function winLight(pass,g,W0){
  const li=W0.pw.light|0,he=W0.pw.heat|0,u=WIN_LIGHT_U,s=g.stove,t=g.table,w=g.win;
  u[0]=(G.t/60)%3600;u[1]=g.man;u[2]=g.flo;u[3]=0;
  u[4]=he>0?Math.min(1,he/3):0;u[5]=0.72+Math.sin(G.t*0.09)*0.16+Math.sin(G.t*0.23)*0.07;
  u[6]=s.x+s.w*0.5;u[7]=s.y+s.h*0.36;
  u[8]=s.x+s.w*0.14;u[9]=s.y+s.h*0.16;u[10]=s.w*0.72;u[11]=s.h*0.42;
  u[12]=li>0?Math.min(1,li/3):0;u[13]=t.x+t.w*0.5;u[14]=g.cei+g.man*0.17;u[15]=0;
  u[16]=w.x;u[17]=w.y;u[18]=w.w;u[19]=w.h;
  gpuField(pass,"win.light",WIN_LIGHT_WGSL,u,null,{blend:"add"});
}
/* свет, который сам светится: лампочка (ярче единицы — её берёт ореол кадра),
   лампочки поломок (мигают медленно, без щелчка), пыль в конусе лампы */
const WIN_GLOW=[];
function winGlow(pass,g,W0){
  const S=WIN_GLOW,li=W0.pw.light|0;S.length=0;
  const t=g.table,lx=t.x+t.w*0.5,ly=g.cei+g.man*0.17,m=g.man;
  if(li>0){
    const k=Math.min(1,li/3);
    S.push([2,lx-m*0.09,ly,lx+m*0.09,ly,m*0.012,m*0.02,255,232,190,0.9+0.9*k]);
    S.push([1,lx,ly,m*0.10,0,0,m*0.35,255,214,160,0.16*k]);
    const ft=(G.t/60)%3600;
    for(let i=0;i<34;i++){
      const h1=hashi(i,1,0x0D05)/4294967296,h2=hashi(i,2,0x0D05)/4294967296,h3=hashi(i,3,0x0D05)/4294967296;
      const v=(h2+ft*0.012*(0.3+h3))%1;
      const hw=m*(0.13+v*0.85)*0.8;
      const x=lx+(h1-0.5)*2*hw+Math.sin(ft*0.3+i)*m*0.02,y=ly+m*0.05+v*(g.flo-ly-m*0.05);
      const a=(0.10+0.25*h3)*k*(1-v*0.7)*(0.6+0.4*Math.sin(ft*0.4+i*1.9));
      S.push([1,x,y,0.5+h3*0.9,0,0,1.0+h3*1.2,255,236,200,a]);
    }
  }
  const p=g.panel,F=(W0.faults||[]);
  for(let i=0;i<F.length;i++){
    const x=p.x+p.w+H*0.026+i*H*0.038,y=p.y+p.h*0.14;
    const bl=0.5+Math.sin(G.t*0.14+i*2)*0.38,rr=Math.max(3.4,H*0.0092);
    S.push([1,x,y,rr*1.2,0,0,rr*3.2,255,120,84,0.42*bl]);
    S.push([1,x,y,rr,0,0,0,255,128,92,0.45+bl*0.7]);
  }
  gpuShapes(pass,S,{blend:"add"});
}
/* темнота по краям: тем гуще, чем меньше света дал игрок (было 2D-виньеткой) */
const WIN_DARK_WGSL=`
fn field(p:vec2f,uv:vec2f)->vec4f{
  let Wd=fu.res.z;let Ht=fu.res.w;
  let d=length(p-vec2f(Wd*.5,Ht*.52));
  let k=smoothstep(min(Wd,Ht)*.26,max(Wd,Ht)*.70,d)*fu.v[0].x;
  return vec4f(vec3f(1.-k),1.);}`;
const WIN_DARK_U=new Float32Array(4);
function winDark(pass,g,W0){
  WIN_DARK_U[0]=0.44+(3-(W0.pw.light|0))*0.07;
  gpuField(pass,"win.dark",WIN_DARK_WGSL,WIN_DARK_U,null,{blend:"mul"});
}
/* ── всё, что меняется только рычагом или днём (выпечка «win.props») ── */
function winProps(g,W0){
  const li=W0.pw.light|0, he=W0.pw.heat|0;
  /* рама окна */
  {
    const w=g.win;
    ctx.strokeStyle=wcol(WIN_C.metal,winLit(g,W0,w.x+w.w*0.5,w.y+w.h*0.5));
    ctx.lineWidth=Math.max(4,H*0.010);
    ctx.strokeRect(w.x,w.y,w.w,w.h);
    ctx.lineWidth=Math.max(2,H*0.005);
    ctx.beginPath();
    ctx.moveTo(w.x+w.w*0.5,w.y);ctx.lineTo(w.x+w.w*0.5,w.y+w.h);
    ctx.moveTo(w.x,w.y+w.h*0.5);ctx.lineTo(w.x+w.w,w.y+w.h*0.5);
    ctx.stroke();
    ctx.strokeStyle=wrgba([255,255,255],0.14);
    ctx.lineWidth=Math.max(1,H*0.002);
    ctx.strokeRect(w.x-Math.max(2,H*0.005),w.y-Math.max(2,H*0.005),
      w.w+Math.max(4,H*0.010),w.h+Math.max(4,H*0.010));
  }
  /* лампа над столом: висит и выключенная — тогда лампочка тёмная */
  {
    const t=g.table, k=Math.min(1,li/3);
    const lx=t.x+t.w*0.5, ly=g.cei+g.man*0.10;
    ctx.strokeStyle=wcol(WIN_C.metal,0.55);
    ctx.lineWidth=Math.max(1,H*0.002);
    ctx.beginPath();ctx.moveTo(lx,g.cei);ctx.lineTo(lx,ly);ctx.stroke();
    ctx.fillStyle=wcol(WIN_C.metal,0.75);
    ctx.beginPath();
    ctx.moveTo(lx-g.man*0.13,ly+g.man*0.07);
    ctx.lineTo(lx+g.man*0.13,ly+g.man*0.07);
    ctx.lineTo(lx+g.man*0.045,ly);ctx.lineTo(lx-g.man*0.045,ly);
    ctx.closePath();ctx.fill();
    ctx.fillStyle=li>0?wrgba(WIN_C.lamp,0.55+0.35*k):wcol(WIN_C.metal,0.35);
    ctx.beginPath();
    ctx.ellipse(lx,ly+g.man*0.07,g.man*0.115,g.man*0.022,0,0,TAU);ctx.fill();
  }
  /* ── что лежит на столе ── */
  {
    const t=g.table, k=winLit(g,W0,t.x+t.w*0.5,t.y);
    const bw=t.w*0.30,bh=t.h*0.20;
    const bx=t.x+t.w*0.14,by=t.y-bh*0.75;
    ctx.save();ctx.translate(bx,by);ctx.rotate(-0.045);
    ctx.fillStyle="rgba(0,0,0,.30)";
    ctx.fillRect(2,bh*0.72,bw,bh*0.16);
    ctx.fillStyle=wcol([228,218,196],Math.min(1.05,k*1.05));
    ctx.fillRect(0,0,bw,bh);
    ctx.fillStyle=wrgba([140,128,104],0.55);
    ctx.fillRect(bw*0.49,0,Math.max(1,bw*0.012),bh);
    for(let i=1;i<4;i++){
      ctx.fillStyle=wrgba([120,110,92],0.42);
      ctx.fillRect(bw*0.06,bh*i/4,bw*0.36,Math.max(1,bh*0.035));
      ctx.fillRect(bw*0.56,bh*i/4,bw*0.36,Math.max(1,bh*0.035));
    }
    ctx.restore();
    /* кружка: тело, ручка, тень. Мелочь, но по ней читается, что тут живут */
    const mx=t.x+t.w*0.70, my=t.y-t.h*0.02;
    ctx.fillStyle="rgba(0,0,0,.28)";
    ctx.beginPath();ctx.ellipse(mx+t.w*0.03,my+2,t.w*0.05,t.h*0.02,0,0,TAU);ctx.fill();
    ctx.fillStyle=wcol([176,180,182],k);
    ctx.fillRect(mx,my-t.h*0.14,t.w*0.055,t.h*0.14);
    ctx.strokeStyle=wcol([176,180,182],k);
    ctx.lineWidth=Math.max(1.4,t.w*0.012);
    ctx.beginPath();
    ctx.arc(mx+t.w*0.055,my-t.h*0.085,t.w*0.022,-1.2,1.2);ctx.stroke();
    ctx.fillStyle=wrgba([255,255,255],0.16+k*0.14);
    ctx.fillRect(mx,my-t.h*0.14,Math.max(1,t.w*0.012),t.h*0.14);
  }

  /* ── приборы на панели ── */
  {
    const p=g.panel, L=winLevers(g), cap=winCap(W0), dr=winDraw_(W0);
    const pk=winLit(g,W0,p.x+p.w*0.5,p.y+p.h*0.5);
    for(const lv of L){
      const val=W0.pw[lv.k]|0, low=val<WIN_MIN[lv.k];
      const cx=lv.x+lv.w*0.5;
      /* циферблат */
      const cy=lv.y+lv.h*0.20, rr=Math.min(lv.w*0.33,lv.h*0.17);
      ctx.fillStyle=wcol(WIN_C.dark,1);
      ctx.beginPath();ctx.arc(cx,cy,rr,0,TAU);ctx.fill();
      ctx.strokeStyle=wrgba(WIN_C.panelHi,0.35+pk*0.3);
      ctx.lineWidth=Math.max(1,H*0.0016);
      ctx.beginPath();ctx.arc(cx,cy,rr,0,TAU);ctx.stroke();
      for(let i=0;i<=3;i++){
        const ta=-Math.PI*0.75+(i/3)*Math.PI*1.5;
        ctx.strokeStyle=wrgba([190,204,212],0.35);
        ctx.beginPath();
        ctx.moveTo(cx+Math.cos(ta)*rr*0.72,cy+Math.sin(ta)*rr*0.72);
        ctx.lineTo(cx+Math.cos(ta)*rr*0.92,cy+Math.sin(ta)*rr*0.92);ctx.stroke();
      }
      const a=-Math.PI*0.75+(val/3)*Math.PI*1.5;
      ctx.strokeStyle=low?"rgba(255,120,96,.95)":wrgba(WIN_C.lamp,0.92);
      ctx.lineWidth=Math.max(1.4,H*0.0026);
      ctx.beginPath();ctx.moveTo(cx,cy);
      ctx.lineTo(cx+Math.cos(a)*rr*0.76,cy+Math.sin(a)*rr*0.76);ctx.stroke();
      ctx.fillStyle=wrgba(WIN_C.panelHi,0.8);
      ctx.beginPath();ctx.arc(cx,cy,Math.max(1.2,rr*0.12),0,TAU);ctx.fill();
      /* рычаг под циферблатом: положение видно наклоном, а не числом */
      const by=lv.y+lv.h*0.86, bh=lv.h*0.34;
      ctx.fillStyle=wrgba(WIN_C.dark,0.55);
      ctx.fillRect(cx-lv.w*0.24,by-Math.max(2,H*0.004),lv.w*0.48,Math.max(3,H*0.007));
      const ta2=(val/3-0.5)*1.15;
      const hx=cx+Math.sin(ta2)*bh*0.92, hy=by-Math.cos(ta2)*bh*0.92;
      ctx.strokeStyle=wcol(WIN_C.metal,0.4+pk*0.7);
      ctx.lineWidth=Math.max(2.4,H*0.0055);
      ctx.beginPath();ctx.moveTo(cx,by);ctx.lineTo(hx,hy);ctx.stroke();
      ctx.fillStyle=low?"rgb(206,98,80)":wcol(WIN_C.panelHi,0.5+pk*0.7);
      ctx.beginPath();ctx.arc(hx,hy,Math.max(2.6,H*0.0068),0,TAU);ctx.fill();
      ctx.fillStyle=wrgba([255,255,255],0.22);
      ctx.beginPath();ctx.arc(hx-1,hy-1,Math.max(1,H*0.0022),0,TAU);ctx.fill();
      /* подпись */
      ctx.fillStyle=wrgba([196,208,216],0.55+pk*0.35);
      ctx.font=Math.max(7,Math.round(H*0.0135))+"px ui-monospace,monospace";
      ctx.textAlign="center";
      ctx.fillText(WIN_RU[lv.k],cx,lv.y+lv.h*0.44);
    }
    /* реактор: полоса на всю ширину панели, делений ровно cap */
    const bx=p.x+p.w*0.07, by=p.y+p.h*0.055, bw=p.w*0.86, bh=p.h*0.075;
    ctx.fillStyle=wcol(WIN_C.dark,1);ctx.fillRect(bx,by,bw,bh);
    ctx.strokeStyle=wrgba(WIN_C.panelHi,0.3);
    ctx.lineWidth=1;ctx.strokeRect(bx+.5,by+.5,bw-1,bh-1);
    const cw=bw/Math.max(1,cap);
    for(let i=0;i<cap;i++){
      ctx.fillStyle=i<dr?(dr>cap?"rgb(224,112,88)":wrgba(WIN_C.lamp,0.88))
                        :wrgba([120,140,150],0.30);
      ctx.fillRect(bx+cw*i+1.5,by+1.5,cw-3,bh-3);
    }
    ctx.fillStyle=wrgba([196,208,216],0.55+pk*0.3);
    ctx.font=Math.max(7,Math.round(H*0.0125))+"px ui-monospace,monospace";
    ctx.textAlign="left";
    ctx.fillText(dr>cap?"РЕАКТОР · ПЕРЕГРУЗКА":"РЕАКТОР",bx,by-H*0.006);
    ctx.textAlign="left";
  }

  /* ── календарь на стене ──
     Единственная вещь, которая на зимовке обязана быть. Дни зачёркнуты рукой,
     а не отпечатаны: интерфейс обратного отсчёта не ведёт (правило файла), а
     зимовщик ведёт — это его дело, и оно висит на стене. */
  {
    const cl=g.cal, k=winLit(g,W0,cl.x+cl.w*0.5,cl.y+cl.h*0.5);
    ctx.fillStyle="rgba(0,0,0,.30)";
    ctx.fillRect(cl.x+2,cl.y+3,cl.w,cl.h);
    ctx.fillStyle=wcol([224,216,196],Math.min(1.05,k*1.0));
    ctx.fillRect(cl.x,cl.y,cl.w,cl.h);
    ctx.fillStyle=wrgba([140,128,104],0.5);
    ctx.fillRect(cl.x,cl.y+cl.h*0.14,cl.w,Math.max(1,H*0.0016));
    /* сетка тридцати клеток, шесть на пять */
    const c0=cl.x+cl.w*0.10, r0=cl.y+cl.h*0.24;
    const cw=cl.w*0.80/6, ch=cl.h*0.66/5;
    ctx.strokeStyle=wrgba([90,80,64],0.55);
    ctx.lineWidth=Math.max(1,H*0.0022);
    for(let i=0;i<30;i++){
      const cx=c0+(i%6)*cw, cy=r0+Math.floor(i/6)*ch;
      if(i<W0.day-1){
        /* зачёркнуто крестом, и крест каждый раз чуть другой: рука */
        const j=hashi(i,W0.sx,0x0C11)/2147483647;
        ctx.beginPath();
        ctx.moveTo(cx+cw*(0.12+j*0.1),cy+ch*0.16);
        ctx.lineTo(cx+cw*(0.80-j*0.1),cy+ch*0.80);
        ctx.moveTo(cx+cw*(0.80-j*0.1),cy+ch*0.16);
        ctx.lineTo(cx+cw*(0.12+j*0.1),cy+ch*0.80);
        ctx.stroke();
      }else if(i===W0.day-1){
        ctx.fillStyle=wrgba([190,90,60],0.55);
        ctx.beginPath();ctx.arc(cx+cw*0.46,cy+ch*0.48,Math.min(cw,ch)*0.22,0,TAU);ctx.fill();
      }else{
        ctx.fillStyle=wrgba([120,110,92],0.30);
        ctx.fillRect(cx+cw*0.40,cy+ch*0.42,Math.max(1.4,cw*0.14),Math.max(1.4,ch*0.14));
      }
    }
    /* гвоздь */
    ctx.fillStyle=wcol(WIN_C.metal,k);
    ctx.beginPath();ctx.arc(cl.x+cl.w*0.5,cl.y-H*0.006,Math.max(1.6,H*0.004),0,TAU);ctx.fill();
  }

  /* ── лампочки поломок: корпуса; свет их — в winGlow ── */
  {
    const p=g.panel, F=(W0.faults||[]);
    for(let i=0;i<F.length;i++){
      const x=p.x+p.w+H*0.026+i*H*0.038, y=p.y+p.h*0.14;
      const rr=Math.max(3.4,H*0.0092);
      ctx.fillStyle=wcol(WIN_C.metal,0.5);
      ctx.beginPath();ctx.arc(x,y,rr*1.35,0,TAU);ctx.fill();
      ctx.fillStyle="rgba(120,40,30,.9)";
      ctx.beginPath();ctx.arc(x,y,rr,0,TAU);ctx.fill();
    }
  }

  /* ── зимовщик ──
     Мерило кадра, и потому единственная фигура, которую нельзя рисовать
     ящиками. Ватник читается ватником не от цвета, а от ТРЁХ ПЕРЕЛОМОВ силуэта:
     плечи шире, пояс уже, подол снова шире. Убери пояс — и получится пальто,
     убери подол — плащ. Плюс валенки (внизу шире, чем голень), шапка с ушами и
     светлое пятно лица со стороны печи: без лица фигура остаётся вещью.

     Обвод — тот же силуэт, залитый тёплым и сдвинутый к печи: на каменном
     мире ночью силуэт совпадал по светлоте с грунтом и пропадал совсем. */
  {
    const m=g.man, x=g.manx, y=g.flo;
    const k=winLit(g,W0,x,y-m*0.6);
    const body=pcMix([36,40,45],WIN_C.warm,0.12);
    const toStove=g.stove.x<x?-1:1;                /* с какой стороны печь */
    ctx.fillStyle="rgba(0,0,0,.38)";
    ctx.beginPath();ctx.ellipse(x,y+m*0.012,m*0.19,m*0.030,0,0,TAU);ctx.fill();
    const silh=(dx,dy,col)=>{
      ctx.fillStyle=col;ctx.strokeStyle=col;
      ctx.save();ctx.translate(dx,dy);
      /* валенки: голенище узкое, стопа шире и вперёд */
      for(const s2 of [-1,1]){
        const fx=x+s2*m*0.040;
        ctx.beginPath();
        ctx.moveTo(fx-m*0.028,y-m*0.42);
        ctx.lineTo(fx+m*0.028,y-m*0.42);
        ctx.lineTo(fx+m*0.034,y-m*0.035);
        ctx.lineTo(fx+m*0.062,y-m*0.010);
        ctx.lineTo(fx+m*0.062,y);
        ctx.lineTo(fx-m*0.040,y);
        ctx.closePath();ctx.fill();
      }
      /* ватник: плечи — пояс — подол */
      ctx.beginPath();
      ctx.moveTo(x-m*0.086,y-m*0.845);
      ctx.lineTo(x+m*0.086,y-m*0.845);
      ctx.lineTo(x+m*0.094,y-m*0.700);
      ctx.lineTo(x+m*0.062,y-m*0.570);      /* пояс */
      ctx.lineTo(x+m*0.090,y-m*0.400);      /* подол */
      ctx.lineTo(x-m*0.090,y-m*0.400);
      ctx.lineTo(x-m*0.062,y-m*0.570);
      ctx.lineTo(x-m*0.094,y-m*0.700);
      ctx.closePath();ctx.fill();
      /* руки: дальняя вниз, ближняя согнута к панели */
      ctx.lineWidth=Math.max(2.2,m*0.048);
      ctx.lineJoin="round";ctx.lineCap="round";
      ctx.beginPath();
      ctx.moveTo(x-toStove*m*0.082,y-m*0.800);
      ctx.lineTo(x-toStove*m*0.108,y-m*0.620);
      ctx.lineTo(x-toStove*m*0.086,y-m*0.470);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x+toStove*m*0.082,y-m*0.800);
      ctx.lineTo(x+toStove*m*0.132,y-m*0.690);
      ctx.lineTo(x+toStove*m*0.176,y-m*0.740);
      ctx.stroke();
      ctx.lineCap="butt";ctx.lineJoin="miter";
      /* шея, голова, шапка с ушами */
      ctx.fillRect(x-m*0.020,y-m*0.880,m*0.040,m*0.042);
      ctx.beginPath();ctx.arc(x,y-m*0.920,m*0.058,0,TAU);ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x-m*0.070,y-m*0.935);
      ctx.quadraticCurveTo(x,y-m*1.010,x+m*0.070,y-m*0.935);
      ctx.lineTo(x+m*0.070,y-m*0.905);
      ctx.lineTo(x-m*0.070,y-m*0.905);
      ctx.closePath();ctx.fill();
      for(const s2 of [-1,1]){
        ctx.beginPath();
        ctx.ellipse(x+s2*m*0.066,y-m*0.900,m*0.022,m*0.034,0,0,TAU);ctx.fill();
      }
      ctx.restore();
    };
    /* обвод тонкий: при сдвиге в полтора десятка пикселей и альфе под треть он
       читался вторым, светящимся человеком рядом с тёмным */
    const off=m*0.007;
    silh(toStove*off,-off*0.6,wrgba(WIN_C.warm,0.10+k*0.10));
    silh(0,0,wcol(body,0.52+k*0.52));
    /* воротник: светлая полоса поперёк плеч — фигура перестаёт быть плоской */
    ctx.fillStyle=wrgba([228,222,206],0.16+k*0.20);
    ctx.beginPath();
    ctx.moveTo(x-m*0.086,y-m*0.845);ctx.lineTo(x+m*0.086,y-m*0.845);
    ctx.lineTo(x+m*0.070,y-m*0.815);ctx.lineTo(x-m*0.070,y-m*0.815);
    ctx.closePath();ctx.fill();
    /* лицо: маленькое тёплое пятно со стороны печи. Без него зимовщик — вещь */
    ctx.fillStyle=wrgba(pcMix([214,178,146],WIN_C.warm,0.25),0.30+k*0.45);
    ctx.beginPath();
    ctx.ellipse(x+toStove*m*0.016,y-m*0.915,m*0.036,m*0.042,0,0,TAU);ctx.fill();
    /* нить по краю ватника шла до подола и читалась лампасом: она нужна только
       на переломе плечо—пояс, где и ловится свет */
    ctx.strokeStyle=wrgba(WIN_C.warm,0.18+k*0.20);
    ctx.lineWidth=Math.max(1,m*0.010);
    ctx.beginPath();
    ctx.moveTo(x+toStove*m*0.086,y-m*0.845);
    ctx.lineTo(x+toStove*m*0.094,y-m*0.700);
    ctx.lineTo(x+toStove*m*0.062,y-m*0.570);
    ctx.stroke();
    /* валенки светлее ватника: серый войлок против тёмной стёжки */
    ctx.fillStyle=wcol(pcMix([92,88,80],WIN_C.warm,0.10),0.42+k*0.44);
    for(const s3 of [-1,1]){
      const fx=x+s3*m*0.040;
      ctx.beginPath();
      ctx.moveTo(fx-m*0.026,y-m*0.230);
      ctx.lineTo(fx+m*0.026,y-m*0.230);
      ctx.lineTo(fx+m*0.034,y-m*0.035);
      ctx.lineTo(fx+m*0.062,y-m*0.010);
      ctx.lineTo(fx+m*0.062,y);
      ctx.lineTo(fx-m*0.040,y);
      ctx.closePath();ctx.fill();
    }
  }
}
/* ── сутки: одна строка, и никакого обратного отсчёта (выпечка «win.text») ── */
function winText(W0){
  {
    ctx.fillStyle="rgba(196,208,216,.70)";
    ctx.font=Math.max(9,Math.round(H*0.018))+"px ui-monospace,monospace";
    ctx.textAlign="center";
    ctx.fillText("СУТКИ "+W0.day+" ИЗ "+W0.days+" · "+W0.pname.toUpperCase(),W*.5,H*0.055);
    const F=(W0.faults||[]);
    if(F.length){
      ctx.fillStyle="rgba(255,140,110,.72)";
      ctx.font=Math.max(8,Math.round(H*0.0145))+"px ui-monospace,monospace";
      ctx.fillText(F.map(f=>(WIN_FAULT_BY[f.k]||{}).ru||f.k).join(" · "),W*.5,H*0.078);
    }
    ctx.textAlign="left";
  }
}
/* ── руки ──
   Одна геометрия на кадр и на попадание: winGeom() зовётся и там, и тут. */
function winHit(mx,my){
  const W0=winAll();if(!W0)return null;
  const g=winGeom();
  const inR=(r)=>mx>=r.x&&mx<=r.x+r.w&&my>=r.y&&my<=r.y+r.h;
  /* лампочки поломок: их и трогают, чтобы починить. Стоят выше рычагов в
     списке проверок, потому что лежат вплотную к краю панели */
  const F=(W0.faults||[]);
  for(let i=0;i<F.length;i++){
    const x=g.panel.x+g.panel.w+H*0.026+i*H*0.038, y=g.panel.y+g.panel.h*0.14;   /* те же числа, что в отрисовке (строка лампочек выше) */
    if(Math.hypot(mx-x,my-y)<Math.max(14,H*0.024))return {k:"fix",id:F[i].k};
  }
  for(const lv of winLevers(g))if(inR(lv))return {k:"lever",id:lv.k};
  if(inR(g.panel))return {k:"panel"};
  if(inR(g.pipes)||(mx<g.pipes.x+g.pipes.w*3&&mx>g.pipes.x-g.pipes.w&&my<g.flo))return {k:"wall"};
  if(inR(g.table)||(mx>g.table.x&&mx<g.table.x+g.table.w&&my>g.table.y-g.man*0.4&&my<g.table.y+g.table.h))
    return {k:"diary"};
  if(inR(g.bunk))return {k:"bunk"};
  return null;
}
function winTap(mx,my){
  const W0=winAll();if(!W0)return false;
  const h=winHit(mx,my);
  if(!h)return false;
  if(h.k==="lever"){
    const v=(W0.pw[h.id]|0);
    W0.pw[h.id]=(v+1)%4;
    sfx("ui",{f:420,to:300,d:.05,v:.16});
    return true;
  }
  if(h.k==="fix"){winFix(h.id);return true;}
  if(h.k==="wall"){winWall();return true;}
  if(h.k==="diary"){
    const d=winDiaryToday();
    if(!d)say("Сегодня день ушёл на починку. Писать нечего.",180);
    else tableToggle(true,"diary");
    return true;
  }
  if(h.k==="bunk"){winShift();return true;}
  return true;
}
function updateWinter(dt){
  const W0=winAll();if(!W0){G.mode="system";return;}
  /* ДЕЙСТВИЕ — сдать смену, то же, что лечь на койку. По фронту, а не по
     удержанию: иначе зажатая клавиша прогоняет месяц за секунду */
  if(actEdge)winShift();
  const F=(W0.faults||[]);
  G.prompt=F.length
    ?("ДЕЙСТВИЕ — СДАТЬ СМЕНУ · ЛАМПОЧКА НА ПАНЕЛИ — ТРОНЬТЕ, ЧТОБЫ ПОЧИНИТЬ")
    :"ДЕЙСТВИЕ — СДАТЬ СМЕНУ";
}
