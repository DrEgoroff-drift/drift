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
   один раз»). Каждый кадр рисуются лишь люди, стрелки, пыль и окно. */
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
    stove:{x:W*0.065,y:flo-man*0.44,w:W*0.115,h:man*0.44},
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
  const warm=he>0?Math.min(1,he/3)*clamp(1-(x-g.stove.x)/(g.man*2.4),0,1):0;
  const cold=clamp(1-Math.abs(x-(g.win.x+g.win.w*0.5))/(g.man*2.6),0,1);
  return {warm,cold};
}
/* тело + обвод + касание: один приём на все предметы комнаты (правило
   «много кусков — одно тело»). Обвод идёт со стороны ближнего света. */
function winBody(c,g,W0,r,base,opt){
  const o=opt||{};
  const cx=r.x+r.w*0.5, cy=r.y+r.h*0.5;
  const k=winLit(g,W0,cx,cy), t=winTone(g,W0,cx,cy);
  let col=pcMix(base,WIN_C.warm,t.warm*0.22);
  col=pcMix(col,WIN_C.cold,t.cold*0.16);
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
      let col=pcMix(WIN_C.wall,WIN_C.warm,t.warm*0.20);
      col=pcMix(col,WIN_C.cold,t.cold*0.14);
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
      c.fillRect(s.x+s.w*0.06,s.y+s.h*0.90,Math.max(3,s.w*0.08),s.h*0.10);
      c.fillRect(s.x+s.w*0.86,s.y+s.h*0.90,Math.max(3,s.w*0.08),s.h*0.10);
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

    /* ── 8. койка: рама, матрас, одеяло складкой, подушка ── */
    {
      const b=g.bunk;
      const k=winLit(g,W0,b.x+b.w*0.5,b.y);
      c.fillStyle=wcol(WIN_C.metal,k*0.75);
      c.fillRect(b.x,b.y,b.w,Math.max(4,b.h*0.10));
      /* матрас */
      c.fillStyle=wcol([72,74,72],k*0.9);
      c.fillRect(b.x+b.w*0.03,b.y-b.h*0.13,b.w*0.94,b.h*0.15);
      /* одеяло: единственное тёплое пятно в комнате, и складка на нём */
      c.fillStyle=wcol([96,72,54],k);
      c.beginPath();
      c.moveTo(b.x+b.w*0.06,b.y-b.h*0.11);
      c.lineTo(b.x+b.w*0.80,b.y-b.h*0.20);
      c.lineTo(b.x+b.w*0.80,b.y-b.h*0.02);
      c.lineTo(b.x+b.w*0.06,b.y+b.h*0.02);
      c.closePath();c.fill();
      c.fillStyle=wrgba(WIN_C.dark,0.30);
      c.beginPath();
      c.moveTo(b.x+b.w*0.34,b.y-b.h*0.16);
      c.lineTo(b.x+b.w*0.40,b.y-b.h*0.17);
      c.lineTo(b.x+b.w*0.38,b.y+b.h*0.01);
      c.lineTo(b.x+b.w*0.32,b.y+b.h*0.02);
      c.closePath();c.fill();
      /* подушка */
      c.fillStyle=wcol([158,152,140],k);
      c.beginPath();
      c.ellipse(b.x+b.w*0.87,b.y-b.h*0.18,b.w*0.11,b.h*0.09,-0.12,0,TAU);c.fill();
      c.fillStyle=wrgba([255,255,255],0.10+k*0.10);
      c.fillRect(b.x,b.y,b.w,Math.max(1,H*0.002));
      /* спинка и ножки */
      c.fillStyle=wcol(WIN_C.rib,k*0.8);
      c.fillRect(b.x+b.w*0.96,b.y-b.h*0.62,Math.max(3,b.w*0.04),b.h*0.62);
      c.fillRect(b.x+b.w*0.05,b.y+b.h*0.10,Math.max(3,b.w*0.03),g.flo-b.y-b.h*0.10);
      c.fillRect(b.x+b.w*0.90,b.y+b.h*0.10,Math.max(3,b.w*0.03),g.flo-b.y-b.h*0.10);
      c.fillStyle="rgba(0,0,0,.32)";
      c.fillRect(b.x,g.flo,b.w,Math.max(2,H*0.011));
    }
  });
}
/* ── кадр ── */
function drawWinter(){
  const W0=winAll();if(!W0)return;
  const g=winGeom();
  const li=W0.pw.light|0, he=W0.pw.heat|0;
  ctx.fillStyle=wcol(WIN_C.dark,1);ctx.fillRect(0,0,W,H);
  ctx.drawImage(winRoomLayer(W0),0,0,W,H);

  /* ── окно ── */
  {
    const w=g.win;
    const sys=getSystem(W0.sx,W0.sy);
    const p=(sys.planets||[])[W0.pi]||(sys.planets||[])[0];
    const sk=(p&&p.T)?p.T:TYPES.ice;
    const gr=ctx.createLinearGradient(0,w.y,0,w.y+w.h);
    gr.addColorStop(0,wcol(sk.sky[1],0.60));
    gr.addColorStop(1,wcol(sk.sky[0],0.46));
    ctx.fillStyle=gr;ctx.fillRect(w.x,w.y,w.w,w.h);
    ctx.save();ctx.beginPath();ctx.rect(w.x,w.y,w.w,w.h);ctx.clip();
    /* дальняя гряда: у окна должен быть горизонт, иначе это лампа, а не окно */
    ctx.fillStyle="rgba(16,24,34,.78)";
    ctx.beginPath();ctx.moveTo(w.x,w.y+w.h);
    for(let x=0;x<=w.w;x+=4)
      ctx.lineTo(w.x+x,w.y+w.h*0.66-Math.sin(x*0.013+W0.sx)*w.h*0.09);
    ctx.lineTo(w.x+w.w,w.y+w.h);ctx.closePath();ctx.fill();
    /* метель: единственное, что за стеклом движется */
    const rs=rng(hashi(W0.sx,W0.sy,0x5011));
    ctx.strokeStyle="rgba(214,228,242,.34)";ctx.lineWidth=1;
    ctx.beginPath();
    for(let i=0;i<44;i++){
      const sx=w.x+rs()*w.w, sy=w.y+((rs()*w.h+G.t*(0.5+rs()*1.5))%w.h);
      ctx.moveTo(sx,sy);ctx.lineTo(sx-w.h*0.07,sy+w.h*0.13);
    }
    ctx.stroke();
    /* иней по нижнему краю стекла */
    /* иней: не частокол по низу стекла (первый счёт рисовал ровные белые
       столбики), а мягкая корка от кромки внутрь */
    const ig=ctx.createLinearGradient(0,w.y+w.h,0,w.y+w.h*0.72);
    ig.addColorStop(0,"rgba(226,238,248,.26)");
    ig.addColorStop(1,"rgba(226,238,248,0)");
    ctx.fillStyle=ig;ctx.fillRect(w.x,w.y+w.h*0.72,w.w,w.h*0.28);
    ctx.fillStyle="rgba(232,242,250,.20)";
    for(let i=0;i<40;i++){
      const fx=w.x+rs()*w.w, fy=w.y+w.h-rs()*rs()*w.h*0.30;
      ctx.fillRect(fx,fy,w.w*0.012,w.w*0.012);
    }
    ctx.restore();
    /* рама */
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
    /* холодный свет ложится на пол трапецией */
    const fg=ctx.createLinearGradient(0,w.y+w.h,0,g.flo+H*0.05);
    fg.addColorStop(0,wrgba(WIN_C.cold,0.13));
    fg.addColorStop(1,wrgba(WIN_C.cold,0));
    ctx.fillStyle=fg;
    ctx.beginPath();
    ctx.moveTo(w.x,w.y+w.h);ctx.lineTo(w.x+w.w,w.y+w.h);
    ctx.lineTo(w.x+w.w*1.45,g.flo+H*0.05);ctx.lineTo(w.x-w.w*0.45,g.flo+H*0.05);
    ctx.closePath();ctx.fill();
  }

  /* ── печь горит ── */
  if(he>0){
    const s=g.stove, k=Math.min(1,he/3);
    const fl=0.72+Math.sin(G.t*0.09)*0.16+Math.sin(G.t*0.23)*0.07;
    ctx.fillStyle=wrgba(WIN_C.warm,(0.42+0.45*k)*fl);
    ctx.fillRect(s.x+s.w*0.14,s.y+s.h*0.16,s.w*0.72,s.h*0.42);
    const gg=ctx.createRadialGradient(s.x+s.w*0.5,s.y+s.h*0.36,0,
                                      s.x+s.w*0.5,s.y+s.h*0.36,g.man*2.0);
    gg.addColorStop(0,wrgba(WIN_C.warm,0.26*k*fl));
    gg.addColorStop(1,wrgba(WIN_C.warm,0));
    ctx.fillStyle=gg;
    ctx.fillRect(0,g.cei,g.man*3.4,H-g.cei);
    /* пятно на полу под дверцей */
    ctx.fillStyle=wrgba(WIN_C.warm,0.14*k*fl);
    ctx.beginPath();
    ctx.ellipse(s.x+s.w*0.5,g.flo+H*0.02,s.w*1.5,H*0.022,0,0,TAU);ctx.fill();
  }

  /* ── лампа над столом ── */
  if(li>0){
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
    ctx.fillStyle=wrgba(WIN_C.lamp,0.55+0.35*k);
    ctx.beginPath();
    ctx.ellipse(lx,ly+g.man*0.07,g.man*0.115,g.man*0.022,0,0,TAU);ctx.fill();
    /* конус: он и есть весь свет комнаты */
    const cg=ctx.createLinearGradient(0,ly+g.man*0.07,0,g.flo);
    cg.addColorStop(0,wrgba(WIN_C.lamp,0.16*k));
    cg.addColorStop(1,wrgba(WIN_C.lamp,0));
    ctx.fillStyle=cg;
    ctx.beginPath();
    ctx.moveTo(lx-g.man*0.13,ly+g.man*0.07);
    ctx.lineTo(lx+g.man*0.13,ly+g.man*0.07);
    ctx.lineTo(lx+g.man*1.05,g.flo);ctx.lineTo(lx-g.man*1.05,g.flo);
    ctx.closePath();ctx.fill();
    ctx.fillStyle=wrgba(WIN_C.lamp,0.10*k);
    ctx.beginPath();
    ctx.ellipse(lx,g.flo+H*0.012,g.man*0.95,H*0.020,0,0,TAU);ctx.fill();
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

  /* ── лампочки поломок: их трогают, чтобы починить ── */
  {
    const p=g.panel, F=(W0.faults||[]);
    for(let i=0;i<F.length;i++){
      const x=p.x+p.w+H*0.026+i*H*0.038, y=p.y+p.h*0.14;
      const bl=0.5+Math.sin(G.t*0.14+i*2)*0.38;
      const rr=Math.max(3.4,H*0.0092);
      const gg=ctx.createRadialGradient(x,y,0,x,y,rr*3.4);
      gg.addColorStop(0,"rgba(255,120,84,"+(0.34*bl).toFixed(2)+")");
      gg.addColorStop(1,"rgba(255,120,84,0)");
      ctx.fillStyle=gg;ctx.beginPath();ctx.arc(x,y,rr*3.4,0,TAU);ctx.fill();
      ctx.fillStyle=wcol(WIN_C.metal,0.5);
      ctx.beginPath();ctx.arc(x,y,rr*1.35,0,TAU);ctx.fill();
      ctx.fillStyle="rgba(255,128,92,"+(0.45+bl*0.5).toFixed(2)+")";
      ctx.beginPath();ctx.arc(x,y,rr,0,TAU);ctx.fill();
    }
  }

  /* ── зимовщик ──
     Мерило кадра. Тёмный силуэт с тёплым обводом со стороны печи: без обвода
     он совпадал по светлоте со стеной и пропадал, а мерило пропадать не может. */
  {
    const m=g.man, x=g.manx, y=g.flo;
    const k=winLit(g,W0,x,y-m*0.6);
    const body=pcMix([34,38,42],WIN_C.warm,0.10);
    ctx.fillStyle="rgba(0,0,0,.36)";
    ctx.beginPath();ctx.ellipse(x,y+m*0.012,m*0.17,m*0.028,0,0,TAU);ctx.fill();
    /* обвод: тот же силуэт, сдвинутый к печи и залитый тёплым */
    const off=m*0.013;
    const draw=(dx,dy,col)=>{
      ctx.fillStyle=col;ctx.strokeStyle=col;
      ctx.save();ctx.translate(dx,dy);
      ctx.fillRect(x-m*0.062,y-m*0.44,m*0.048,m*0.44);
      ctx.fillRect(x+m*0.016,y-m*0.44,m*0.048,m*0.44);
      /* ватник: плечи шире бёдер, но не вдвое — первый счёт давал квадрат */
      ctx.beginPath();
      ctx.moveTo(x-m*0.098,y-m*0.85);ctx.lineTo(x+m*0.098,y-m*0.85);
      ctx.lineTo(x+m*0.082,y-m*0.42);ctx.lineTo(x-m*0.082,y-m*0.42);
      ctx.closePath();ctx.fill();
      ctx.lineWidth=Math.max(2,m*0.05);
      ctx.beginPath();
      ctx.moveTo(x-m*0.088,y-m*0.79);ctx.lineTo(x-m*0.155,y-m*0.60);ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x+m*0.088,y-m*0.79);ctx.lineTo(x+m*0.118,y-m*0.55);ctx.stroke();
      /* шея: без неё голова — шар на ящике */
      ctx.fillRect(x-m*0.022,y-m*0.885,m*0.044,m*0.045);
      ctx.beginPath();ctx.arc(x,y-m*0.925,m*0.062,0,TAU);ctx.fill();
      ctx.restore();
    };
    draw(-off,-off*0.5,wrgba(WIN_C.warm,0.16+k*0.14));
    draw(0,0,wcol(body,0.55+k*0.5));
    /* воротник ватника: одна светлая полоса, и фигура перестаёт быть плоской */
    ctx.fillStyle=wrgba([255,255,255],0.10+k*0.10);
    ctx.fillRect(x-m*0.098,y-m*0.85,m*0.196,Math.max(1.5,m*0.016));
  }

  /* ── воздух комнаты ── */
  {
    if(li>0){
      const t=g.table, lx=t.x+t.w*0.5, ly=g.cei+g.man*0.20;
      const rs=rng(hashi(1,2,0x0D05));
      ctx.fillStyle="rgba(255,238,206,.20)";
      for(let i=0;i<30;i++){
        const px=lx+(rs()-.5)*g.man*1.7;
        const py=ly+((rs()*g.man*1.3+G.t*(0.04+rs()*0.10))%(g.man*1.3));
        ctx.fillRect(px,py,1.3,1.3);
      }
    }
    const vg=ctx.createRadialGradient(W*.5,H*.52,Math.min(W,H)*.26,W*.5,H*.52,Math.max(W,H)*.70);
    vg.addColorStop(0,"rgba(0,0,0,0)");
    vg.addColorStop(1,"rgba(0,0,0,"+(0.44+(3-li)*0.07).toFixed(2)+")");
    ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
  }

  /* ── сутки: одна строка, и никакого обратного отсчёта ── */
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
    const x=g.panel.x+g.panel.w+H*0.018+i*H*0.030, y=g.panel.y+g.panel.h*0.10;
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
