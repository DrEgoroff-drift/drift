/* ══════════════ отсеки базы: вторая половина ══════════════
   Отрезано от 21ab-base-interiors 27.08.2026: файл дорос до 42 КБ. BASE_ROOM —
   одна таблица, и таблицы не режут (CLAUDE.md); поэтому здесь не вторая
   таблица, а вторая ПОЛОВИНА той же: Object.assign дособирает её на месте.
   Порядок склейки обязателен: этот файл идёт ПОСЛЕ 21ab (const уже объявлен). */
Object.assign(BASE_ROOM,{
/* ── ПЛАВИЛЬНЯ: печь, ковш, изложницы, вытяжка, искры ── */
refinery(x0,y0,w,h,cx,fy,lit,seed,B,P){
  const hot=P.eff,fl=(.65+Math.sin(G.t*.13)*.2+Math.sin(G.t*.31)*.1)*hot;
  bHazard(x0+6,fy-4,w-12,4,.5);
  /* отблеск пламени МЕДЛЕННО пульсирует по всему цеху (M232): печь дышит на
     стены и лица, а не только в своём пятне. Цикл секунд в шесть, не блинк. */
  const wp=(.5+.5*Math.sin(G.t*.016+1))*(.6+.4*fl);
  ctx.fillStyle="rgba(255,150,60,"+(.05*wp*hot).toFixed(3)+")";
  ctx.fillRect(x0,y0,w,h-6);
  /* печь: корпус, арочная топка, свет из неё бьёт вперёд */
  const ox=x0+10,oy=fy-52,ow=54,oh=52;
  ctx.fillStyle="rgba(0,0,0,.32)";                          // печь стоит на полу
  ctx.beginPath();ctx.ellipse(ox+ow/2,fy-1,ow*.58,2.6,0,0,TAU);ctx.fill();
  bBox(ox,oy,ow,oh,"rgba(34,30,28,.98)",lit,"rgba(160,120,80,.35)");
  ctx.fillStyle="rgba(20,16,14,.95)";
  ctx.beginPath();ctx.moveTo(ox+10,fy-6);ctx.lineTo(ox+10,oy+22);
  ctx.quadraticCurveTo(ox+ow/2,oy+6,ox+ow-10,oy+22);ctx.lineTo(ox+ow-10,fy-6);ctx.closePath();ctx.fill();
  const fg=ctx.createRadialGradient(ox+ow/2,fy-14,2,ox+ow/2,fy-14,30);
  fg.addColorStop(0,"rgba(255,236,180,"+(.85*fl).toFixed(2)+")");
  fg.addColorStop(.45,"rgba(255,150,50,"+(.55*fl).toFixed(2)+")");
  fg.addColorStop(1,"rgba(180,40,10,0)");
  ctx.fillStyle=fg;ctx.beginPath();
  ctx.moveTo(ox+10,fy-6);ctx.lineTo(ox+10,oy+22);
  ctx.quadraticCurveTo(ox+ow/2,oy+6,ox+ow-10,oy+22);ctx.lineTo(ox+ow-10,fy-6);ctx.closePath();ctx.fill();
  /* обвязка печи и вытяжка в потолок */
  ctx.strokeStyle="rgba(150,120,90,"+(.25+lit*.25).toFixed(2)+")";ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(ox,oy+16);ctx.lineTo(ox+ow,oy+16);ctx.stroke();
  bPipe([[ox+ow/2,oy+2],[ox+ow/2,y0+8],[x0+w-8,y0+8]],7,"70,78,88",lit);
  /* ковш на рельсе: наклоняется и льёт металл в изложницу */
  const cyc=(G.t*.006+seed)%1, pour=cyc>.45&&cyc<.75&&hot>.2;
  const lx=ox+ow+26;
  ctx.strokeStyle="rgba(120,138,156,"+(.25+lit*.2).toFixed(2)+")";ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(ox+ow,y0+26);ctx.lineTo(x0+w-10,y0+26);ctx.stroke();   // рельс
  ctx.beginPath();ctx.moveTo(lx,y0+26);ctx.lineTo(lx,y0+34);ctx.stroke();
  ctx.save();ctx.translate(lx,y0+36);ctx.rotate(pour?.55:0);
  bBox(-11,0,22,16,"rgba(40,34,30,.98)",lit,"rgba(160,120,80,.4)");
  ctx.fillStyle="rgba(255,180,90,"+(.7*hot).toFixed(2)+")";ctx.fillRect(-9,1,18,4);
  ctx.restore();
  if(pour){
    const sx=lx+8,sy0=y0+50,sy1=fy-14;
    const sg=ctx.createLinearGradient(0,sy0,0,sy1);
    sg.addColorStop(0,"rgba(255,240,190,.95)");sg.addColorStop(1,"rgba(255,140,40,.85)");
    ctx.strokeStyle=sg;ctx.lineWidth=3.4;
    ctx.beginPath();ctx.moveTo(sx,sy0);
    for(let t=0;t<=1;t+=.2)ctx.lineTo(sx+Math.sin(t*4+G.t*.3)*1.6,sy0+(sy1-sy0)*t);
    ctx.stroke();
    bGlow(sx,sy1,34,"255,170,70",.22);
    for(let i=0;i<8;i++){                                   // искры от струи
      const t=(G.t*.06+i*.37)%1;
      ctx.fillStyle="rgba(255,210,120,"+((1-t)*.8).toFixed(2)+")";
      ctx.beginPath();ctx.arc(sx+Math.cos(i*2.3)*t*18,sy1-t*14+t*t*20,1.2,0,TAU);ctx.fill();
    }
  }
  /* изложницы и остывающие слитки: свежий ещё красный, дальние уже серые */
  for(let i=0;i<3;i++){
    const gx=lx+2+i*20-2;
    bBox(gx-9,fy-10,18,10,"rgba(30,28,26,.98)",lit,"rgba(0,0,0,.5)");
    const cool=clamp(1-((cyc*3+i)%3)/2.2,0,1)*hot;
    ctx.fillStyle="rgb("+(70+cool*185|0)+","+(74+cool*110|0)+","+(82-cool*30|0)+")";
    ctx.fillRect(gx-7,fy-8,14,6);
    if(cool>.3)bGlow(gx,fy-6,16,"255,140,50",.14*cool);
  }
  /* правая половина цеха: стеллаж готовых слитков, бак шлака и плавильщик.
     Без них половина отсека стояла пустой, и печь висела в вакууме */
  const rx=x0+w-40;
  ctx.fillStyle="rgba(0,0,0,.28)";
  ctx.beginPath();ctx.ellipse(rx+17,fy-1,19,2.2,0,0,TAU);ctx.fill();
  bBox(rx,fy-34,34,3,"rgba(44,54,66,.98)",lit,"rgba(0,0,0,.4)");
  bBox(rx,fy-16,34,3,"rgba(44,54,66,.98)",lit,"rgba(0,0,0,.4)");
  bBox(rx-2,fy-36,3,36,"rgba(40,50,62,.98)",lit,null);
  bBox(rx+33,fy-36,3,36,"rgba(40,50,62,.98)",lit,null);
  for(let t=0;t<2;t++)for(let i=0;i<3;i++){
    const iy=fy-34-4+t*18,ix=rx+3+i*10;
    ctx.fillStyle="rgba(126,134,146,"+(.35+lit*.35).toFixed(2)+")";
    ctx.fillRect(ix,iy,8,4);
    ctx.fillStyle="rgba(190,200,212,"+(.10+lit*.14).toFixed(2)+")";ctx.fillRect(ix,iy,8,1);
  }
  const sbx=rx-24;                                        // бак шлака: тёмная корка, снизу тлеет
  ctx.fillStyle="rgba(0,0,0,.30)";
  ctx.beginPath();ctx.ellipse(sbx+10,fy-1,12,2.2,0,0,TAU);ctx.fill();
  bBox(sbx,fy-14,20,14,"rgba(26,24,24,.98)",lit,"rgba(90,70,54,.4)");
  ctx.fillStyle="rgba(60,50,46,.95)";ctx.fillRect(sbx+2,fy-12,16,5);
  ctx.fillStyle="rgba(255,120,40,"+(.25*hot).toFixed(2)+")";ctx.fillRect(sbx+3,fy-7,14,2);
  /* ── смена ДЕЛАЕТ, а не смотрит (закон 5, M232) ──
     Кочегар шурует в топке: кочерга раз в несколько секунд уходит в огонь,
     на выпаде из зева отвечают редкие искры. */
  {
    /* кочегар стоит У ЗЕВА, а не в общем ряду: по месту и видно, чья работа */
    const stx2=ox+ow-2;
    const pk=Math.max(0,Math.sin(G.t*.014+seed));
    ctx.fillStyle="rgba(0,0,0,.32)";
    ctx.beginPath();ctx.ellipse(stx2,fy-1,7,2,0,0,TAU);ctx.fill();
    bWorker(stx2,fy,lit,false,G.t*.05+seed+2,-1);
    ctx.strokeStyle="rgb(40,36,34)";ctx.lineWidth=1.6;ctx.lineCap="round";
    ctx.beginPath();ctx.moveTo(stx2-2,fy-13);
    ctx.lineTo(ox+ow-24-pk*14,fy-9-pk*2);ctx.stroke();ctx.lineCap="butt";
    if(pk>.85&&hot>.2)for(let i=0;i<3;i++){
      const t=(G.t*.09+i*.31)%1;
      ctx.fillStyle="rgba(255,210,120,"+((1-t)*.7).toFixed(2)+")";
      ctx.beginPath();ctx.arc(ox+ow-26+Math.cos(i*2.1)*t*10,fy-12-t*10,1,0,TAU);ctx.fill();
    }
  }
  /* подносчик: от изложниц к стеллажу со слитком в руке, обратно порожняком.
     Путь настоящий — полкомнаты, иначе он «идёт», стоя на месте */
  {
    const c2=(G.t*.0032+seed*.7)%1, wxA=ox+ow+14, wxB=rx+2;
    let wx=null,carry=false,fc=1;
    if(c2<.34){wx=wxA+(wxB-wxA)*(c2/.34);carry=true;fc=1;}
    else if(c2<.46){wx=wxB;fc=-1;}
    else if(c2<.80){wx=wxB-(wxB-wxA)*((c2-.46)/.34);fc=-1;}
    if(wx!=null){
      ctx.fillStyle="rgba(0,0,0,.32)";
      ctx.beginPath();ctx.ellipse(wx,fy-1,7,2,0,0,TAU);ctx.fill();
      bWorker(wx,fy,lit,false,G.t*.3,fc);
      if(carry){
        ctx.fillStyle="rgba(214,196,158,"+(.6+lit*.2).toFixed(2)+")";
        ctx.fillRect(wx+4*fc-3.5,fy-13,7,3.4);
        bGlow(wx+4*fc,fy-11,10,"255,160,70",.10*hot);
      }
    }
  }
  /* марево над печью: дешёвая подделка, но без него горячий цех выглядит холодным */
  ctx.save();ctx.globalCompositeOperation="lighter";
  for(let i=0;i<3;i++){
    const yy=fy-20-((G.t*.4+i*22)%46);
    ctx.fillStyle="rgba(255,150,70,"+(.05*hot).toFixed(3)+")";
    ctx.beginPath();ctx.ellipse(ox+ow/2+Math.sin(G.t*.02+i)*6,yy,18,7,0,0,TAU);ctx.fill();
  }
  ctx.restore();
  bGlow(ox+ow/2,fy-16,52,"255,150,60",.10+.16*fl);
},
/* ── ПЛОЩАДКА: подъёмник, захваты, створки в потолке, груз ── */
pad(x0,y0,w,h,cx,fy,lit,seed,B,P){
  const cyc=(G.t*.004+seed)%1;
  const lift=cyc<.5?0:Math.sin((cyc-.5)*Math.PI*2)*18;     // платформа ходит вверх-вниз
  /* створки в потолке: раскрываются, когда платформа идёт наверх */
  const open=clamp((lift-2)/14,0,1)*26;
  ctx.fillStyle="rgba(10,14,20,.9)";ctx.fillRect(cx-30,y0,60,7);
  bBox(cx-30,y0,30-open/2,7,"rgba(40,50,62,.98)",lit,"rgba(0,0,0,.4)");
  bBox(cx+open/2,y0,30-open/2,7,"rgba(40,50,62,.98)",lit,"rgba(0,0,0,.4)");
  if(open>2){                                              // сквозь щель видно небо
    const sg=ctx.createLinearGradient(0,y0,0,y0+26);
    sg.addColorStop(0,"rgba(150,190,225,"+(.35*(open/26)).toFixed(2)+")");
    sg.addColorStop(1,"rgba(150,190,225,0)");
    ctx.fillStyle=sg;ctx.fillRect(cx-open/2,y0,open,26);
  }
  bHazard(cx-34,fy-4,68,4,.9);
  /* гидравлика: два цилиндра со штоками — по ним и видно, что платформа едет */
  for(let i=0;i<2;i++){
    const px=cx-20+i*40;
    bBox(px-4,fy-16,8,16,"rgba(36,45,56,.98)",lit,"rgba(0,0,0,.4)");
    ctx.fillStyle="rgba(170,186,200,"+(.25+lit*.3).toFixed(2)+")";
    ctx.fillRect(px-2,fy-16-lift,4,lift+2);
  }
  /* сама платформа с захватами по углам */
  const py=fy-18-lift;
  bBox(cx-32,py,64,6,"rgba(46,56,68,.98)",lit,"rgba(150,170,190,.3)");
  ctx.strokeStyle="rgba("+BM_WARM+","+(.3+lit*.35).toFixed(2)+")";ctx.lineWidth=2;
  for(let i=0;i<2;i++){
    const gx=cx-28+i*56;
    ctx.beginPath();ctx.moveTo(gx,py);ctx.lineTo(gx,py-7);ctx.lineTo(gx+(i?-5:5),py-10);ctx.stroke();
  }
  /* контейнер на платформе — площадка не пустая, она для переброски */
  bCrate(cx-16,py-22,32,22,"46,56,50",lit,true);
  ctx.fillStyle="rgba("+BM_COOL+","+(.25+lit*.35).toFixed(2)+")";ctx.fillRect(cx-12,py-19,8,3);
  /* бегущие огни разметки: последовательность читается как «идёт цикл» */
  for(let i=0;i<6;i++){
    const on=((G.t*.08|0)%6)===i;
    ctx.fillStyle="rgba("+BM_COOL+","+(on?.9:.20).toFixed(2)+")";
    ctx.beginPath();ctx.arc(x0+14+i*((w-28)/5),fy-7,2.2,0,TAU);ctx.fill();
    if(on)bGlow(x0+14+i*((w-28)/5),fy-7,14,BM_COOL,.20);
  }
  /* кран-балка под потолком: рельс, тележка ездит, крюк на тросе качается */
  bBox(x0+6,y0+10,w-12,4,"rgba(38,48,60,.97)",lit,"rgba(0,0,0,.4)");
  const trx=x0+20+((G.t*.15+seed*13)%(w-52));
  bBox(trx,y0+13,16,6,"rgba(52,62,76,.98)",lit,"rgba(150,170,190,.3)");
  const hl=16+Math.sin(G.t*.02+seed)*5;
  ctx.strokeStyle="rgba(160,178,196,"+(.25+lit*.25).toFixed(2)+")";ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(trx+8,y0+19);ctx.lineTo(trx+8,y0+19+hl);ctx.stroke();
  ctx.lineWidth=1.8;ctx.beginPath();
  ctx.arc(trx+8,y0+21+hl,3,-.4,Math.PI+.4);ctx.stroke();
  /* груз в очереди у стены, пульт причала и приёмщик */
  bCrate(x0+8,fy-18,20,18,"52,46,40",lit,false);
  bCrate(x0+8,fy-32,16,14,"44,50,58",lit,true);
  const dx=x0+w-24;
  bBox(dx,fy-30,18,30,"rgba(30,38,48,.96)",lit,"rgba(140,160,180,.3)");
  bScreen(dx+3,fy-27,12,10,BM_COOL,lit,seed+9);
  ctx.fillStyle="rgba("+BM_WARM+","+(.3+lit*.3).toFixed(2)+")";     // кнопки пульта
  for(let i=0;i<3;i++)ctx.fillRect(dx+3+i*5,fy-13,3,3);
  bWorker(dx-11,fy,lit,false,G.t*.035+seed,1);
},
/* ── ЛАБОРАТОРИЯ: образцы, голограмма, центрифуга, находка на подставке ── */
lab(x0,y0,w,h,cx,fy,lit,seed,B,P){
  const on=P.eff>.15;
  /* верстак вдоль всей стены */
  bBox(x0+6,fy-20,w-12,4,"rgba(46,54,64,.98)",lit,"rgba(150,170,190,.28)");
  ctx.fillStyle="rgba(28,34,42,.9)";ctx.fillRect(x0+10,fy-16,4,16);ctx.fillRect(x0+w-16,fy-16,4,16);
  /* колбы с образцами: стекло, среда, пузырьки — каждая своего цвета */
  for(let i=0;i<3;i++){
    const gx=x0+18+i*22,gh=22;
    const col=[[120,220,180],[190,150,240],[240,190,120]][i];
    ctx.fillStyle="rgba(14,20,28,.9)";ctx.fillRect(gx-6,fy-20-gh,12,gh);
    ctx.fillStyle=rgba(col,(.18+lit*.30)*(on?1:.4));
    ctx.fillRect(gx-5,fy-20-gh*.7,10,gh*.7);
    if(on)for(let b=0;b<3;b++){
      const t=((G.t*.03+b*.33+i*.17)%1);
      ctx.fillStyle=rgba(col,(1-t)*.5);
      ctx.beginPath();ctx.arc(gx-3+((b*3+i)%5),fy-20-t*gh*.68,1.1,0,TAU);ctx.fill();
    }
    ctx.strokeStyle="rgba(190,210,225,"+(.16+lit*.16).toFixed(2)+")";ctx.lineWidth=1;
    ctx.strokeRect(gx-6.5,fy-20.5-gh,13,gh);
    ctx.fillStyle="rgba(210,225,238,"+(.10+lit*.12).toFixed(2)+")";ctx.fillRect(gx-5,fy-20-gh,3,gh);
    if(on)bGlow(gx,fy-30,20,col.join(","),.10);
  }
  /* центрифуга: барабан крутится, крышка со стеклом */
  const fxc=cx+8;
  bBox(fxc-13,fy-34,26,14,"rgba(36,45,56,.98)",lit,"rgba(140,160,180,.3)");
  ctx.strokeStyle="rgba("+BM_COOL+","+(.3+lit*.35).toFixed(2)+")";ctx.lineWidth=1.4;
  ctx.beginPath();ctx.arc(fxc,fy-27,7,0,TAU);ctx.stroke();
  const sp=on?G.t*.4:0;
  for(let i=0;i<3;i++){
    const a=sp+i*TAU/3;
    ctx.strokeStyle="rgba(200,220,235,"+(.2+lit*.3).toFixed(2)+")";
    ctx.beginPath();ctx.moveTo(fxc,fy-27);ctx.lineTo(fxc+Math.cos(a)*6,fy-27+Math.sin(a)*6);ctx.stroke();
  }
  /* голограмма над столом: проволочный образец медленно вращается */
  if(on){
    const hx=x0+w-38,hy=fy-40;
    ctx.save();ctx.globalCompositeOperation="lighter";
    const hg=ctx.createLinearGradient(0,hy+16,0,hy-16);
    hg.addColorStop(0,"rgba("+BM_COOL+",.16)");hg.addColorStop(1,"rgba("+BM_COOL+",0)");
    ctx.fillStyle=hg;ctx.beginPath();
    ctx.moveTo(hx-4,hy+18);ctx.lineTo(hx+4,hy+18);ctx.lineTo(hx+16,hy-14);ctx.lineTo(hx-16,hy-14);
    ctx.closePath();ctx.fill();
    ctx.strokeStyle="rgba("+BM_COOL+",.55)";ctx.lineWidth=1;
    const rot=G.t*.02;
    for(let i=0;i<3;i++){
      const rr=10-i*2.5,sq=Math.abs(Math.cos(rot+i));
      ctx.beginPath();ctx.ellipse(hx,hy-2-i*3,rr,rr*(.25+sq*.5),0,0,TAU);ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle="rgba("+BM_COOL+","+(.3+lit*.3).toFixed(2)+")";ctx.fillRect(hx-6,fy-22,12,2);
  }
  /* подставка с находкой: если в базе лежит артефакт, он здесь и стоит */
  const ax=x0+12;
  bBox(ax-7,fy-30,14,10,"rgba(30,38,48,.96)",lit,"rgba(0,0,0,.4)");
  const glow=.35+Math.sin(G.t*.03+seed)*.15;
  ctx.strokeStyle="rgba(200,170,255,"+((.35+lit*.4)*glow*2).toFixed(2)+")";ctx.lineWidth=1.6;
  ctx.beginPath();ctx.moveTo(ax,fy-42);ctx.lineTo(ax+5,fy-35);ctx.lineTo(ax,fy-30);ctx.lineTo(ax-5,fy-35);
  ctx.closePath();ctx.stroke();
  bGlow(ax,fy-36,22,"190,160,255",.12*glow*2);
  bWorker(cx-18,fy,lit,true,G.t*.04+seed);
  bLamp(cx,y0+4,40,fy,"200,232,255",.30+lit*.35);
},
/* ── БАТАРЕЯ: снизу видно не ствол, а то, чем его кормят ──
   Ствол стоит наверху, на грунте, — в разрезе от него видна только тумба,
   уходящая в потолочный люк. Помещение под ним — погреб: стеллаж выстрелов,
   подъёмник подачи и пульт с лампой. Лампа зажигается ровно тогда, когда
   батарея действительно стреляет (21d), а не «для красоты»: если оборона
   работает, это видно из разреза. */
battery(x0,y0,w,h,cx,fy,lit,seed,B,P){
  const R=rng(seed);
  const fire=(G.battFx&&G.battFx.length)?1:0;
  const mx=x0+w*.38;
  /* люк в потолке и тумба погона: то, что уходит на поверхность */
  bHazard(mx-26,y0,52,4,.85);
  ctx.fillStyle="rgba(10,14,20,.92)";ctx.fillRect(mx-18,y0,36,5);
  /* погон: не арка, а плита на катках — сверху к ней приходит тумба ствола,
     снизу подпирает колонна подачи. Первый заход дал полукруг с зубьями во всю
     ширину отсека, и он читался входной аркой, а не поворотным кругом. */
  bBox(mx-20,y0+5,40,7,"rgba(34,40,50,.97)",lit,"rgba(150,170,190,.32)");
  ctx.strokeStyle="rgba(140,158,176,"+(.28+lit*.32).toFixed(2)+")";ctx.lineWidth=1.2;
  for(const s of [-1,1]){                                  // катки: по ним она и ходит
    ctx.beginPath();ctx.arc(mx+s*13,y0+15,4,0,TAU);ctx.stroke();
    ctx.beginPath();ctx.moveTo(mx+s*13,y0+15);
    const a=(fire?G.t*.05:G.t*.008)+(s>0?0:1.7);
    ctx.lineTo(mx+s*13+Math.cos(a)*4,y0+15+Math.sin(a)*4);ctx.stroke();
  }
  bBox(mx-16,y0+12,32,7,"rgba(28,36,46,.96)",lit,"rgba(120,140,160,.28)");
  /* подъёмник подачи: колонна от пола к погону, в ней ползёт лоток */
  bBox(mx-7,y0+19,14,fy-y0-23,"rgba(26,34,44,.96)",lit,"rgba(120,140,160,.28)");
  const up=((G.t*(fire?1.6:.35)+seed*13)%100)/100;
  ctx.fillStyle="rgba("+BM_WARM+","+(.25+lit*.35).toFixed(2)+")";
  ctx.fillRect(mx-4,fy-8-up*(fy-y0-33),8,7);
  /* стеллаж выстрелов: они СТОЯТ на полу в раме, а не висят на верхней рейке —
     первый заход подвесил их за головки, и погреб читался ледником с сосульками */
  const sx2=x0+w*.60,sw2=w-(sx2-x0)-12;
  /* мерило — человек: выстрел ему по бедро, иначе погреб выглядит складом
     торпед. Восемь мест вместо шести: их носят руками, значит они мелкие. */
  const sn=8,cw2=sw2/sn;
  for(let i=0;i<sn;i++){
    const bx=sx2+i*cw2;
    if(R()<.16)continue;                                   // расстрелянные места пустуют
    ctx.fillStyle="rgba(76,72,58,"+(.75+lit*.25).toFixed(2)+")";
    ctx.fillRect(bx+1,fy-20,cw2-4,16);
    ctx.fillStyle="rgba(214,168,64,"+(.30+lit*.3).toFixed(2)+")";  // поясок
    ctx.fillRect(bx+1,fy-10,cw2-4,1.8);
    ctx.fillStyle="rgba(180,196,210,"+(.2+lit*.25).toFixed(2)+")"; // головка
    ctx.beginPath();ctx.moveTo(bx+1,fy-20);ctx.lineTo(bx+1+(cw2-4)/2,fy-25);
    ctx.lineTo(bx+cw2-3,fy-20);ctx.closePath();ctx.fill();
  }
  /* рама держит их поперёк, на высоте пояса: видно, что это стеллаж */
  ctx.fillStyle="rgba(44,54,66,"+(.8+lit*.2).toFixed(2)+")";
  ctx.fillRect(sx2-3,fy-15,sw2+6,2.4);
  ctx.fillRect(sx2-3,fy-19,3,15);ctx.fillRect(sx2+sw2,fy-19,3,15);
  /* пульт наводки: экран и лампа «огонь» — единственное, что светится сильно */
  const px=x0+8,py=fy-34;
  bBox(px,py,34,34,"rgba(28,36,46,.97)",lit,"rgba(150,170,190,.32)");
  ctx.fillStyle="rgba(12,18,26,.95)";ctx.fillRect(px+4,py+5,26,18);
  ctx.strokeStyle="rgba("+BM_COOL+","+(.25+lit*.4).toFixed(2)+")";ctx.lineWidth=1;
  ctx.beginPath();ctx.arc(px+17,py+14,7,0,TAU);ctx.stroke();     // круговой обзор
  const sa=G.t*.03;
  ctx.beginPath();ctx.moveTo(px+17,py+14);
  ctx.lineTo(px+17+Math.cos(sa)*7,py+14+Math.sin(sa)*7);ctx.stroke();
  ctx.fillStyle=fire?"rgba(255,120,90,.95)":"rgba(70,50,44,.9)";
  ctx.fillRect(px+13,py+26,8,4);
  if(fire)bGlow(px+17,py+28,26,"255,140,100",.16);
  bPipe([[mx+16,y0+18],[x0+w-8,y0+18]],3,"90,104,120",lit);
  bLamp(cx,y0+4,40,fy,"246,214,160",(.22+lit*.32)*(P.eff<.3?.5:1));
}
});
