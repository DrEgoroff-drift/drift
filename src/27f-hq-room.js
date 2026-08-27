/* ══════════════ ШТАБ: рубка, а не список ══════════════ */
/* Экран ШТАБ был единственным местом в игре, где люди жили строчками с
   портретом-марочкой: плоско, без масштаба и без света. Теперь наверху экрана
   стоит комната — командная рубка, — и в ней у каждого домена свой пульт,
   а у пульта стоит тот, кто домен держит. Пустой домен виден тёмным пультом:
   отсутствие читается местом, а не отсутствием строки.

   ПРАВИЛА, КОТОРЫМ ПОДЧИНЁН ФАЙЛ (те же, что в кантине и отсеках базы):
   1. Мерило — человек: стоящий 66 единиц, пульт ему по пояс, экран над пультом
      на высоте глаз, потолок на высоте двух ростов.
   2. Порядок рисования и есть сцена: стена → потолок и короб → окно → пульты
      с экранами → люди у пультов → голо-стол переднего плана → мелочь на нём →
      подписи → пыль в конусах → виньетка. Люди ЗА столом, а не поверх.
   3. Плоских заливок нет: стена — секции, швы, заклёпки и микрозерно; пол —
      решётка с перспективой; экран — развёртка, сетка и блик.
   4. Свет откуда-то: две лампы под потолком, экраны пультов и голо-стол снизу.
   5. Приборы показывают настоящее состояние домена, а не орнамент. */
const HQ_H=192;                                   // высота комнаты в своих единицах
/* Домены стоят в постоянном порядке: рубка не должна перекладываться от того,
   кого наняли раньше. */
const HQ_ORDER=["cmd","keep","fact","sci"];
function drawHqRoom(cn,sel,hover){
  const c=cn.getContext("2d");
  c.clearRect(0,0,cn.width,cn.height);
  const k=cn.height/HQ_H, W2=cn.width/k;
  c.save();c.scale(k,k);
  const hits=hqRoomBody(c,W2,HQ_H,sel,hover);
  c.restore();
  for(const h of hits){h.x*=k;h.y*=k;h.w*=k;h.h*=k;}
  return hits;
}
function hqRoomBody(c,W2,H2,sel,hover){
  const seed=0x5748,R=rng(seed);
  const fy=H2-16;                                  // линия пола
  const cy=fy-30;                                  // верх пульта: человеку по пояс
  /* ── стена: три масштаба ── */
  const wg=c.createLinearGradient(0,0,0,fy);
  wg.addColorStop(0,rgba([18,22,30],1));
  wg.addColorStop(.62,rgba([28,33,43],1));
  wg.addColorStop(1,rgba([20,24,32],1));
  c.fillStyle=wg;c.fillRect(0,0,W2,fy);
  for(let i=0;i<Math.ceil(W2/72);i++){              // секции обшивки
    c.fillStyle="rgba(255,255,255,"+(.010+R()*.014).toFixed(3)+")";
    c.fillRect(i*72,14,68,fy-14);
    c.fillStyle="rgba(0,0,0,.24)";c.fillRect(i*72+68,14,2,fy-14);
    c.fillStyle="rgba(200,214,228,.05)";            // заклёпки
    c.fillRect(i*72+9,20,2,2);c.fillRect(i*72+9,fy-24,2,2);
    c.fillRect(i*72+58,20,2,2);c.fillRect(i*72+58,fy-24,2,2);
  }
  for(let i=0;i<70;i++){                            // микрозерно
    c.fillStyle="rgba(0,0,0,"+(.03+R()*.05).toFixed(3)+")";
    c.fillRect(R()*W2,14+R()*(fy-30),1.2,1.2);
  }
  /* ── потолок и кабельный короб ── */
  c.fillStyle="rgba(0,0,0,.45)";c.fillRect(0,0,W2,13);
  c.fillStyle="rgba(52,60,72,.55)";c.fillRect(0,13,W2,2);
  for(let x=8;x<W2;x+=54){                          // подвесы короба
    c.fillStyle="rgba(70,80,94,.4)";c.fillRect(x,4,3,9);
  }
  c.strokeStyle="rgba(60,70,84,.5)";c.lineWidth=1.4; // кабели вдоль потолка
  for(let i=0;i<3;i++){
    c.beginPath();c.moveTo(0,17+i*2.6);
    for(let x=0;x<=W2;x+=40)c.lineTo(x,17+i*2.6+Math.sin(x*.05+i)*1.4);
    c.stroke();
  }
  /* ── пол: решётка с перспективой ── */
  const flg=c.createLinearGradient(0,fy-6,0,H2);
  flg.addColorStop(0,"rgba(30,35,44,1)");flg.addColorStop(1,"rgba(14,17,23,1)");
  c.fillStyle=flg;c.fillRect(0,fy-4,W2,H2-fy+4);
  c.strokeStyle="rgba(120,140,160,.10)";c.lineWidth=1;
  for(let i=0;i<14;i++){                            // сходящиеся к центру швы
    const t=i/13, x0=t*W2, x1=W2*.5+(t-.5)*W2*1.9;
    c.beginPath();c.moveTo(x0,fy-3);c.lineTo(x1,H2);c.stroke();
  }
  c.fillStyle="rgba(255,255,255,.05)";c.fillRect(0,fy-4,W2,1);
  /* ── окно рубки: слева, узкое и высокое ── */
  const wx=10,wy=24,ww=Math.min(W2*.22,150),wh=52;
  c.fillStyle="rgba(5,8,13,.96)";c.fillRect(wx,wy,ww,wh);
  c.save();c.beginPath();c.rect(wx,wy,ww,wh);c.clip();
  hqWindowView(c,wx,wy,ww,wh,seed);
  c.restore();
  c.strokeStyle="rgba(150,170,190,.30)";c.lineWidth=2;c.strokeRect(wx,wy,ww,wh);
  c.fillStyle="rgba(120,140,160,.22)";
  for(let i=1;i<3;i++)c.fillRect(wx+i*ww/3,wy,2,wh);
  c.fillStyle="rgba(140,170,200,.06)";              // блик стекла
  c.beginPath();c.moveTo(wx,wy+wh);c.lineTo(wx+ww*.5,wy);c.lineTo(wx+ww*.8,wy);
  c.lineTo(wx+ww*.3,wy+wh);c.closePath();c.fill();
  /* ── лампы: полоса и конус ──
     Стоят над вторым и третьим пультом, а не по половинам ширины: иначе свет
     падал в проходы между людьми, и все стояли в тени собственных экранов. */
  const lamps=hqStations(W2);
  for(let i=0;i<4;i++){
    const lx=lamps[i];
    c.strokeStyle="rgba(120,132,148,.45)";c.lineWidth=1;
    c.beginPath();c.moveTo(lx,15);c.lineTo(lx,24);c.stroke();
    c.fillStyle="rgba(38,44,54,.95)";
    c.beginPath();c.moveTo(lx-13,34);c.lineTo(lx-5,24);c.lineTo(lx+5,24);c.lineTo(lx+13,34);
    c.closePath();c.fill();
    c.fillStyle="rgba(206,226,240,.85)";c.fillRect(lx-10,33,20,2.2);
    const g=c.createLinearGradient(0,34,0,fy);
    g.addColorStop(0,"rgba(190,214,238,.18)");g.addColorStop(1,"rgba(190,214,238,.02)");
    c.fillStyle=g;c.beginPath();
    c.moveTo(lx-11,34);c.lineTo(lx+11,34);c.lineTo(lx+58,fy);c.lineTo(lx-58,fy);c.closePath();c.fill();
    /* пятно света на полу: без него конус висит в воздухе и обрывается */
    const fg=c.createRadialGradient(lx,fy+2,2,lx,fy+2,72);
    fg.addColorStop(0,"rgba(190,214,238,.13)");fg.addColorStop(1,"rgba(190,214,238,0)");
    c.fillStyle=fg;c.beginPath();c.ellipse(lx,fy+2,66,12,0,0,TAU);c.fill();
  }
  /* ── что висит между пультами ──
     Не для «побольше объектов», а чтобы простенки перестали быть заливкой:
     труба с вентилем, ящик с инструментом, огнетушитель, схема отсека. */
  hqWallProps(c,W2,fy,cy,seed);
  /* ── пульты доменов ── */
  const st=hqStations(W2);
  const hits=[];
  HQ_ORDER.forEach((role,i)=>{
    const m=G.mgrs.find(x=>x.role===role)||null;
    hqConsole(c,st[i],cy,fy,role,m,sel,hover);
  });
  /* ── люди у пультов: рисуются ДО переднего стола ── */
  HQ_ORDER.forEach((role,i)=>{
    const m=G.mgrs.find(x=>x.role===role);
    if(!m)return;
    const x=st[i],on=sel===m.id,hv=hover===m.id;
    const col=hex2rgb(MGR_ROLES[role].col);
    if(on||hv){                                     // нимб кругом за головой
      const g2=c.createRadialGradient(x,fy-56,2,x,fy-56,46);
      g2.addColorStop(0,rgba(col,on?.30:.16));g2.addColorStop(1,rgba(col,0));
      c.fillStyle=g2;c.beginPath();c.arc(x,fy-56,46,0,TAU);c.fill();
    }
    hqFigure(c,x,fy-4,col,G.t*.026+i*1.9,mgrFace(m,26),!!m.ai,m,i);
    hits.push({id:m.id,x:x-20,y:fy-96,w:40,h:92});
  });
  /* ── голо-стол переднего плана ── */
  hqTable(c,W2,H2,fy,seed);
  /* ── подписи над выбранным ── */
  HQ_ORDER.forEach((role,i)=>{
    const m=G.mgrs.find(x=>x.role===role);
    if(!m)return;
    const on=sel===m.id,hv=hover===m.id;
    if(!on&&!hv)return;
    const x=st[i];
    c.font="9px ui-monospace,monospace";c.textAlign="center";
    const nm=m.name.toUpperCase()+" · "+MGR_ROLES[role].ru.toUpperCase();
    /* подпись идёт НАД экраном пульта: на высоте головы она перечёркивала
       график домена — то самое, ради чего экран и рисуется */
    const tw=c.measureText(nm).width,ty=fy-152;
    c.fillStyle="rgba(6,10,16,.88)";c.fillRect(x-tw/2-6,ty,tw+12,14);
    c.strokeStyle=rgba(hex2rgb(MGR_ROLES[role].col),.55);c.lineWidth=1;
    c.strokeRect(x-tw/2-5.5,ty+.5,tw+11,13);
    c.fillStyle=on?"#e8f4f2":"rgba(220,232,240,.75)";c.fillText(nm,x,ty+10);
    c.textAlign="left";
  });
  /* ── воздух ── */
  c.save();c.globalCompositeOperation="lighter";
  for(let i=0;i<22;i++){
    const RR=rng(seed+i*151),px=RR()*W2;
    const py=((G.t*.10*(.4+RR())+i*41)%(fy-40))+30;
    c.fillStyle="rgba(200,222,244,"+(.04+RR()*.05).toFixed(3)+")";
    c.beginPath();c.arc(px,py,.8+RR()*1.0,0,TAU);c.fill();
  }
  c.restore();
  const vg=c.createRadialGradient(W2/2,H2/2,H2*.34,W2/2,H2/2,H2*1.05);
  vg.addColorStop(0,"rgba(0,0,0,0)");vg.addColorStop(1,"rgba(0,0,0,.58)");
  c.fillStyle=vg;c.fillRect(0,0,W2,H2);
  return hits;
}
/* реквизит на простенках: ставится в промежутках между пультами, поэтому
   считается от тех же координат — иначе труба ложится поверх экрана */
function hqWallProps(c,W2,fy,cy,seed){
  const st=hqStations(W2),gaps=[];
  for(let i=0;i<st.length-1;i++)gaps.push((st[i]+st[i+1])/2);
  gaps.push(st[st.length-1]+ (st[1]-st[0])*.62);
  gaps.forEach((gx,i)=>{
    const R=rng(seed+i*613),kind=i%4;
    if(gx<W2*.05||gx>W2-24)return;
    if(kind===0){                                    // труба с вентилем
      c.fillStyle="rgba(56,64,76,.9)";c.fillRect(gx-4,20,8,cy-30);
      c.fillStyle="rgba(255,255,255,.06)";c.fillRect(gx-4,20,2.4,cy-30);
      for(let y=34;y<cy-14;y+=26){                   // фланцы
        c.fillStyle="rgba(74,84,98,.95)";c.fillRect(gx-6.5,y,13,4);
        c.fillStyle="rgba(0,0,0,.25)";c.fillRect(gx-6.5,y+3.4,13,1.2);
      }
      c.strokeStyle="rgba(200,120,80,.55)";c.lineWidth=2;
      c.beginPath();c.arc(gx,cy-40,6,0,TAU);c.stroke();
      c.beginPath();c.moveTo(gx-6,cy-40);c.lineTo(gx+6,cy-40);c.stroke();
    }else if(kind===1){                              // ящик с инструментом
      c.fillStyle="rgba(40,46,58,.95)";c.fillRect(gx-15,cy-36,30,34);
      c.fillStyle="rgba(255,255,255,.05)";c.fillRect(gx-15,cy-36,30,1.6);
      c.fillStyle="rgba(0,0,0,.28)";c.fillRect(gx-15,cy-20,30,1.6);
      c.fillStyle="rgba(120,134,152,.5)";c.fillRect(gx-4,cy-31,8,2.4);
      c.fillRect(gx-4,cy-15,8,2.4);
      c.fillStyle="rgba(242,178,92,.35)";c.fillRect(gx-13,cy-6,26,2); // предупреждающая полоса
    }else if(kind===2){                              // огнетушитель в скобе
      c.fillStyle="rgba(150,60,48,.9)";
      c.beginPath();c.moveTo(gx-5,cy-40);c.lineTo(gx+5,cy-40);c.lineTo(gx+6,cy-14);
      c.lineTo(gx-6,cy-14);c.closePath();c.fill();
      c.fillStyle="rgba(255,255,255,.10)";c.fillRect(gx-5,cy-40,2,26);
      c.fillStyle="rgba(70,78,90,.95)";c.fillRect(gx-2.5,cy-46,5,6);
      c.strokeStyle="rgba(120,134,152,.6)";c.lineWidth=1.6;
      c.beginPath();c.moveTo(gx-7,cy-30);c.lineTo(gx+7,cy-30);c.stroke();
    }else{                                           // схема отсека под стеклом
      c.fillStyle="rgba(18,24,32,.95)";c.fillRect(gx-17,cy-52,34,28);
      c.strokeStyle="rgba(120,150,175,.35)";c.lineWidth=1;c.strokeRect(gx-16.5,cy-51.5,33,27);
      c.strokeStyle="rgba(140,190,220,.30)";
      for(let k=0;k<4;k++){
        const bx=gx-13+ (k%2)*15,by=cy-47+((k/2)|0)*11;
        c.strokeRect(bx,by,11,8);
      }
      c.fillStyle="rgba(143,208,138,.55)";c.fillRect(gx-13+15,cy-47,11,8);
      c.fillStyle="rgba(255,255,255,.05)";                 // блик стекла
      c.beginPath();c.moveTo(gx-17,cy-24);c.lineTo(gx-2,cy-52);c.lineTo(gx+4,cy-52);
      c.lineTo(gx-11,cy-24);c.closePath();c.fill();
    }
  });
}
/* места пультов: разнесены по ширине, но не шире 150 друг от друга — иначе
   рубка распадается на четыре отдельные каморки */
function hqStations(W2){
  const out=[],step=Math.min(150,W2/4.4),c0=W2*.5;
  for(let i=0;i<4;i++)out.push(c0+(i-1.5)*step);
  return out;
}
/* ── пульт домена ──
   Экран показывает настоящее состояние домена, а не орнамент: у командира —
   сколько наёмников в работе, у смотрителя — дроны и базы, у фактора — ломаная
   маршрута, у исследователя — накопленные данные. Пустой домен тёмный. */
function hqConsole(c,x,cy,fy,role,m,sel,hover){
  const col=hex2rgb(MGR_ROLES[role].col),live=!!m;
  const on=live&&sel===m.id,hv=live&&hover===m.id;
  /* Экран висит ВЫШЕ головы стоящего (голова на fy-70, макушка ~fy-86).
     Пока экран стоял на уровне лица, портрет вырезался прямо посреди графика,
     и рубка читалась аппликацией из двух слоёв. */
  const w=104,h=42,sx=x-w/2,sy=cy-100;
  /* ниша в стене за пультом: без неё пульт наклеен на обшивку */
  c.fillStyle="rgba(10,13,18,.55)";c.fillRect(sx-8,sy-8,w+16,h+30);
  c.fillStyle="rgba(255,255,255,.03)";c.fillRect(sx-8,sy-8,w+16,1.4);
  /* корпус экрана */
  c.fillStyle="rgba(16,20,27,.98)";c.fillRect(sx,sy,w,h);
  /* выключенный экран БЕСЦВЕТЕН (аудит M232): цвет роли — это питание, и у
     пустого домена его нет. Серое стекло, серый кант, ни искры доменного тона */
  c.strokeStyle=live?rgba(col,.5):"rgba(138,148,162,.13)";
  c.lineWidth=1.4;c.strokeRect(sx+.5,sy+.5,w-1,h-1);
  /* заливка экрана: развёртка сверху вниз, а не ровный цвет */
  const g=c.createLinearGradient(0,sy,0,sy+h);
  if(live){g.addColorStop(0,rgba(col,.20));g.addColorStop(1,rgba(col,.06));}
  else{g.addColorStop(0,"rgba(150,158,170,.04)");g.addColorStop(1,"rgba(150,158,170,.015)");}
  c.fillStyle=g;c.fillRect(sx,sy,w,h);
  c.save();c.beginPath();c.rect(sx+3,sy+3,w-6,h-6);c.clip();
  c.strokeStyle=live?rgba(col,.10):"rgba(150,158,170,.03)";c.lineWidth=1;   // сетка
  for(let gx=sx+8;gx<sx+w;gx+=12){c.beginPath();c.moveTo(gx,sy);c.lineTo(gx,sy+h);c.stroke();}
  for(let gy=sy+8;gy<sy+h;gy+=10){c.beginPath();c.moveTo(sx,gy);c.lineTo(sx+w,gy);c.stroke();}
  if(live)hqScreenData(c,role,m,sx+6,sy+6,w-12,h-12,col);
  else{
    /* Пустой домен — не серый прямоугольник, а обесточенный пульт: экран под
       чехлом, лента крест-накрест, надпись читаемая. Отсутствие человека должно
       быть видно местом, а не тем, что чего-то нет. */
    c.fillStyle="rgba(46,52,62,.55)";
    c.beginPath();c.moveTo(sx-2,sy-2);c.lineTo(sx+w+2,sy-2);c.lineTo(sx+w-2,sy+h*.72);
    c.lineTo(sx+2,sy+h*.72);c.closePath();c.fill();
    c.fillStyle="rgba(255,255,255,.05)";c.fillRect(sx-2,sy-2,w+4,1.6);
    for(let i=0;i<6;i++){                             // складки чехла
      c.fillStyle="rgba(0,0,0,.16)";c.fillRect(sx+6+i*17,sy,1.6,h*.72);
    }
    c.strokeStyle="rgba(122,130,142,.30)";c.lineWidth=2;
    c.beginPath();c.moveTo(sx+6,sy+h-6);c.lineTo(sx+w-6,sy+6);c.stroke();
    c.fillStyle="rgba(150,158,170,.45)";c.font="8px ui-monospace,monospace";c.textAlign="center";
    c.fillText("ДОМЕН СВОБОДЕН",sx+w/2,sy+h-6);c.textAlign="left";
  }
  /* строка развёртки ползёт вниз — экран живой, но не мигает */
  if(live){
    const ry=sy+((G.t*22+x)%h);
    c.fillStyle=rgba(col,.10);c.fillRect(sx,ry,w,2);
  }
  c.restore();
  c.fillStyle="rgba(255,255,255,.06)";               // блик стекла экрана
  c.beginPath();c.moveTo(sx,sy+h);c.lineTo(sx+w*.42,sy);c.lineTo(sx+w*.62,sy);
  c.lineTo(sx+w*.2,sy+h);c.closePath();c.fill();
  if(on||hv){c.strokeStyle=rgba(col,on?.85:.45);c.lineWidth=1.4;
    c.strokeRect(sx-3.5,sy-3.5,w+7,h+7);}
  /* свет экрана падает на стену и на пульт */
  const eg=c.createRadialGradient(x,sy+h,4,x,sy+h,86);
  eg.addColorStop(0,rgba(col,live?.14:.03));eg.addColorStop(1,rgba(col,0));
  c.fillStyle=eg;c.fillRect(sx-60,sy-20,w+120,fy-sy+10);
  /* сам пульт: тумба, столешница, скос с клавишами */
  const px=x-58,pw=116;
  c.fillStyle="rgba(22,26,34,.98)";c.fillRect(px,cy,pw,fy-cy-4);
  c.fillStyle="rgba(38,44,55,.98)";                  // скос к игроку
  c.beginPath();c.moveTo(px,cy);c.lineTo(px+pw,cy);c.lineTo(px+pw-6,cy+11);
  c.lineTo(px+6,cy+11);c.closePath();c.fill();
  c.fillStyle="rgba(210,226,240,.14)";c.fillRect(px,cy-1.6,pw,1.6);
  for(let i=0;i<7;i++){                              // клавиши на скосе
    const kx=px+12+i*13;
    c.fillStyle=rgba(col,live?(.20+.18*Math.sin(G.t*1.7+i+x)):.07);
    c.fillRect(kx,cy+3.5,8,4);
  }
  c.fillStyle="rgba(0,0,0,.3)";c.fillRect(px,cy+11,pw,2);
  for(let i=0;i<3;i++){                              // филёнки тумбы
    c.fillStyle="rgba(255,255,255,.03)";c.fillRect(px+6+i*36,cy+16,30,fy-cy-24);
    c.fillStyle="rgba(0,0,0,.20)";c.fillRect(px+36+i*36,cy+16,2,fy-cy-24);
  }
  /* индикатор состояния человека: настроение видно раньше карточки */
  if(live){
    const l=m.ai?100:clamp(m.loy,0,100);
    const lc=m.ai?[159,216,255]:(l>=60?[143,208,138]:(l>=30?[242,178,92]:[255,107,87]));
    c.fillStyle=rgba(lc,.9);c.beginPath();c.arc(px+pw-9,cy+6,2.2,0,TAU);c.fill();
    c.fillStyle=rgba(lc,.25);c.beginPath();c.arc(px+pw-9,cy+6,5,0,TAU);c.fill();
    if(mgrPoints(m)>0){                              // невыбранное очко перка
      const pl=.5+.5*Math.sin(G.t*3);
      c.fillStyle="rgba(242,178,92,"+(.35+.5*pl).toFixed(2)+")";
      c.beginPath();c.arc(px+9,cy+6,2.2,0,TAU);c.fill();
    }
  }
}
/* что показывает экран домена — настоящие числа игры */
function hqScreenData(c,role,m,x,y,w,h,col){
  c.font="7px ui-monospace,monospace";c.textAlign="left";
  c.fillStyle=rgba(col,.75);
  if(role==="cmd"){
    const busy=G.crew.filter(cr=>cr.shipId&&cr.order&&cr.order.kind!=="home").length;
    const tot=Math.max(1,G.crew.length);
    c.fillText("ЗВЕНО "+busy+"/"+G.crew.length,x,y+7);
    /* метки людей: плечи трапецией, а не столбик — ряд столбиков читался
       полкой с бутылками, а не звеном */
    for(let i=0;i<Math.min(9,G.crew.length);i++){
      const mx=x+i*9.5,busyi=i<busy;
      c.fillStyle=rgba(col,busyi?.85:.20);
      c.beginPath();c.moveTo(mx,y+21);c.lineTo(mx+1,y+14);c.lineTo(mx+5,y+14);
      c.lineTo(mx+6,y+21);c.closePath();c.fill();
      c.beginPath();c.arc(mx+3,y+11.5,2.2,0,TAU);c.fill();
      if(busyi){c.fillStyle=rgba(col,.35);c.fillRect(mx-1,y+22,8,1.2);}
    }
    c.fillStyle=rgba(col,.4);c.fillRect(x,y+h-4,w*(busy/tot),2);
  }else if(role==="keep"){
    const dr=(G.drones||[]).length,bs=Object.keys(G.bases||{}).length;
    c.fillText("ДРОНОВ "+dr+" · БАЗ "+bs,x,y+7);
    for(let i=0;i<Math.min(12,dr);i++){               // дроны кружат
      const a=G.t*.6+i*1.2, rr=6+((i*7)%9);
      c.fillStyle=rgba(col,.8);
      c.fillRect(x+22+Math.cos(a)*rr*1.6,y+18+Math.sin(a)*rr*.5,2,2);
    }
    for(let i=0;i<Math.min(6,bs);i++){                // базы стоят
      c.fillStyle=rgba(col,.55);c.fillRect(x+w-10-i*9,y+20,6,5);
      c.fillRect(x+w-8-i*9,y+16,2,4);
    }
  }else if(role==="fact"){
    const n=m.route?m.route.length:0;
    c.fillText("ПЛЕЧ "+n+"/"+mgrRouteMax(m),x,y+7);
    if(n>=2){                                          // ломаная маршрута
      c.strokeStyle=rgba(col,.6);c.lineWidth=1;c.beginPath();
      for(let i=0;i<n;i++){
        const px=x+4+i*(w-8)/Math.max(1,n-1),py=y+22+Math.sin(i*2.1)*6;
        i?c.lineTo(px,py):c.moveTo(px,py);
      }
      c.stroke();
      for(let i=0;i<n;i++){
        const px=x+4+i*(w-8)/Math.max(1,n-1),py=y+22+Math.sin(i*2.1)*6;
        c.fillStyle=rgba(col,.9);c.beginPath();c.arc(px,py,1.8,0,TAU);c.fill();
      }
      const t=(G.t*.25)%1,ix=x+4+t*(w-8);              // борт идёт по маршруту
      c.fillStyle="rgba(255,255,255,.8)";c.fillRect(ix,y+21,2,2);
    }else{c.fillStyle=rgba(col,.4);c.fillText("маршрут не собран",x,y+20);}
  }else{
    const d=m.gotData||0;
    c.fillText("ДАННЫХ "+d,x,y+7);
    for(let i=0;i<5;i++){                              // столбики разбора
      const hh=3+((d+i*37)%13);
      c.fillStyle=rgba(col,.5+i*.08);c.fillRect(x+i*9,y+h-2-hh,6,hh);
    }
    c.fillStyle=rgba(col,.5);                          // образцы в трюме
    c.fillText("образцов "+mgrSamples(),x+52,y+16);
  }
}
/* ── голо-стол переднего плана ──
   Одна достопримечательность на комнату: стол снизу подсвечивает лица и режет
   кадр по нижней кромке, из-за чего рубка перестаёт быть картонкой в один слой. */
function hqTable(c,W2,H2,fy,seed){
  /* Стол был плитой во всю ширину: он закрывал ноги всем и превращал низ кадра
     в серую полосу. Уже, ниже и с настоящей проекцией — тогда это предмет
     в комнате, а не второй пол. */
  const cx=W2*.5,ty=H2-22,rx=Math.min(W2*.32,215),ry=10;
  /* свечение снизу вверх — источник света в кадре */
  const g=c.createRadialGradient(cx,ty,4,cx,ty,120);
  g.addColorStop(0,"rgba(120,190,230,.18)");g.addColorStop(1,"rgba(120,190,230,0)");
  c.fillStyle=g;c.beginPath();c.ellipse(cx,ty-30,rx*1.1,64,0,0,TAU);c.fill();
  /* Проекция — единственная достопримечательность рубки, и она должна быть
     видна, а не угадываться: планета в разрезе орбит, звёзды сектора вокруг
     и метка вашей системы. Бледная проекция превращала стол в серую плиту. */
  c.save();c.globalCompositeOperation="lighter";
  const RR=rng(seed^0x33),pr=15;
  /* планета над столом */
  /* Шар рисуется КРУГОМ с терминатором, а параллели обрезаются по нему.
     Кольца эллипсами поверх давали клубок «бантиков» — то же, чем когда-то
     болели вращающиеся детали базы. */
  const py0=ty-26;
  /* в середине — ваша звезда, и цвет у неё её собственный: по одному взгляду
     на стол должно быть понятно, в какой вы системе */
  const scol=(G.sys&&G.sys.cls&&G.sys.cls.col)?hex2rgb(G.sys.cls.col):[150,205,240];
  const pg=c.createRadialGradient(cx-pr*.35,py0-pr*.35,2,cx,py0,pr);
  pg.addColorStop(0,rgba(mixc(scol,[255,255,255],.6),.55));
  pg.addColorStop(.55,rgba(scol,.28));
  pg.addColorStop(1,rgba(scol,.06));
  c.fillStyle=pg;c.beginPath();c.arc(cx,py0,pr,0,TAU);c.fill();
  /* Это ЗВЕЗДА, а не планета: ни параллелей, ни терминатора — они делали из неё
     глобус, вокруг которого нелепо крутились планеты. Только ядро, зерно
     поверхности и дышащая корона. */
  c.save();c.beginPath();c.arc(cx,py0,pr,0,TAU);c.clip();
  const SR=rng(0x57A2);
  for(let i=0;i<26;i++){                                  // зерно поверхности
    const a=SR()*TAU,rr=Math.sqrt(SR())*pr;
    c.fillStyle=rgba(mixc(scol,[255,255,255],.5),(.05+SR()*.10).toFixed(3)*1);
    c.beginPath();c.arc(cx+Math.cos(a)*rr,py0+Math.sin(a)*rr,1+SR()*2.4,0,TAU);c.fill();
  }
  c.restore();
  const puls=1+.05*Math.sin(G.t*1.1);
  c.strokeStyle=rgba(mixc(scol,[255,255,255],.5),.35);c.lineWidth=1;
  c.beginPath();c.arc(cx,py0,pr*puls,0,TAU);c.stroke();
  /* корона звезды вместо кольца: кольцо спорило с орбитами планет */
  const cg2=c.createRadialGradient(cx,py0,pr*.8,cx,py0,pr*2.1);
  cg2.addColorStop(0,rgba(scol,.16));cg2.addColorStop(1,rgba(scol,0));
  c.fillStyle=cg2;c.beginPath();c.arc(cx,py0,pr*2.1,0,TAU);c.fill();
  /* Вокруг шара — НАСТОЯЩИЕ планеты вашей системы на своих орбитах, а не
     россыпь точек: рубка показывает то, где вы сейчас. Выдуманный сектор здесь
     был единственным прибором в игре, который врал. */
  const pl=(G.sys&&G.sys.planets)||[];
  const omax=pl.length?pl[pl.length-1].orbit:1;
  c.strokeStyle="rgba(150,205,240,.16)";c.lineWidth=.8;
  pl.forEach((p,i)=>{
    const orr=rx*.20+(p.orbit/omax)*rx*.34;
    c.beginPath();c.ellipse(cx,py0+6,orr,orr*.26,0,0,TAU);c.stroke();
    const a=p.ang+G.t*p.spd*160;
    const px=cx+Math.cos(a)*orr,py=py0+6+Math.sin(a)*orr*.26;
    const col=p.T&&p.T.col?hex2rgb(p.T.col):[150,205,240];
    c.fillStyle=rgba(col,.85);
    c.beginPath();c.arc(px,py,1.6+Math.min(2.4,p.radius/26),0,TAU);c.fill();
    c.fillStyle=rgba(col,.22);
    c.beginPath();c.arc(px,py,4+Math.min(3,p.radius/26),0,TAU);c.fill();
  });
  for(let i=0;i<14;i++){                                   // дальние звёзды фона
    const a=RR()*TAU,rr=.5+RR()*.5;
    const px=cx+Math.cos(a)*rx*.92*rr,py=ty-16-Math.abs(Math.sin(a))*28*rr;
    const tw=.5+.5*Math.sin(G.t*1.4+i);
    c.fillStyle="rgba(150,205,240,"+(.08+tw*.14).toFixed(2)+")";
    c.beginPath();c.arc(px,py,.9+RR()*1.1,0,TAU);c.fill();
  }
  /* метка «вы здесь»: ромб с пульсацией */
  const mk=.5+.5*Math.sin(G.t*2.2),mx=cx+rx*.44,my=ty-24;
  c.fillStyle="rgba(242,190,120,"+(.35+mk*.45).toFixed(2)+")";
  c.beginPath();c.moveTo(mx,my-4);c.lineTo(mx+3.4,my);c.lineTo(mx,my+4);
  c.lineTo(mx-3.4,my);c.closePath();c.fill();
  /* столб проекции от столешницы вверх — свет откуда-то, а не сам по себе */
  const bg=c.createLinearGradient(0,ty,0,ty-58);
  bg.addColorStop(0,"rgba(140,200,240,.16)");bg.addColorStop(1,"rgba(140,200,240,0)");
  c.fillStyle=bg;c.beginPath();
  c.moveTo(cx-rx*.5,ty);c.lineTo(cx+rx*.5,ty);c.lineTo(cx+rx*.22,ty-58);
  c.lineTo(cx-rx*.22,ty-58);c.closePath();c.fill();
  c.restore();
  /* столешница */
  c.fillStyle="rgba(20,25,33,.99)";
  c.beginPath();c.ellipse(cx,ty,rx,ry,0,0,TAU);c.fill();
  c.strokeStyle="rgba(150,205,240,.28)";c.lineWidth=1.4;
  c.beginPath();c.ellipse(cx,ty,rx,ry,0,0,TAU);c.stroke();
  const tg=c.createLinearGradient(0,ty-ry,0,ty+ry);
  tg.addColorStop(0,"rgba(140,190,225,.10)");tg.addColorStop(1,"rgba(0,0,0,.35)");
  c.fillStyle=tg;c.beginPath();c.ellipse(cx,ty,rx-2,ry-1.5,0,0,TAU);c.fill();
  /* борт стола и юбка до низа кадра */
  c.fillStyle="rgba(26,31,40,.99)";
  c.beginPath();c.moveTo(cx-rx,ty);c.lineTo(cx-rx,H2);c.lineTo(cx+rx,H2);c.lineTo(cx+rx,ty);
  c.ellipse(cx,ty,rx,ry,0,0,Math.PI,true);c.closePath();c.fill();
  /* кромка: холодная сверху от проекции, тёплая снизу от дежурного света под
     столом — без второго источника юбка сливалась с полом в одну тёмную полосу */
  c.strokeStyle="rgba(210,230,245,.22)";c.lineWidth=1.4;
  c.beginPath();c.ellipse(cx,ty+1,rx,ry,0,0,Math.PI);c.stroke();
  const ug=c.createLinearGradient(0,H2-16,0,H2);
  ug.addColorStop(0,"rgba(242,178,92,0)");ug.addColorStop(1,"rgba(242,178,92,.16)");
  c.fillStyle=ug;c.fillRect(cx-rx,H2-16,rx*2,16);
  for(let i=0;i<3;i++){                               // дежурные лампы под кромкой
    const lx2=cx+(i-1)*rx*.62;
    c.fillStyle="rgba(242,178,92,.5)";c.fillRect(lx2-3,ty+ry-1,6,1.6);
  }
  for(let i=0;i<9;i++){                               // рёбра юбки
    const px=cx-rx+8+i*(rx*2-16)/8;
    c.fillStyle="rgba(0,0,0,.20)";c.fillRect(px,ty+6,2,H2-ty);
  }
  /* Отражения людей и экранов в столешнице: полированный металл возвращает
     цвет домена размытой полосой. Это единственное, что связывает передний
     план с задним, — без отражений стол лежал в кадре отдельной деталью. */
  c.save();
  c.beginPath();c.ellipse(cx,ty,rx-2,ry-1.5,0,0,TAU);c.clip();
  c.globalCompositeOperation="lighter";
  hqStations(W2).forEach((sxx,i)=>{
    const m=G.mgrs.find(x=>x.role===HQ_ORDER[i]);
    if(!m)return;
    const col=hex2rgb(MGR_ROLES[HQ_ORDER[i]].col);
    const rg=c.createLinearGradient(0,ty-ry,0,ty+ry);
    rg.addColorStop(0,rgba(col,.26));rg.addColorStop(1,rgba(col,0));
    c.fillStyle=rg;c.fillRect(sxx-13,ty-ry,26,ry*2);
  });
  c.restore();
  /* мелочь на столе: кружка и планшет — место обжитое */
  c.fillStyle="rgba(90,104,120,.75)";c.fillRect(cx-rx*.62,ty-8,9,8);
  c.strokeStyle="rgba(90,104,120,.75)";c.lineWidth=1.4;
  c.beginPath();c.arc(cx-rx*.62+11,ty-4,3,-1.2,1.2);c.stroke();
  c.save();c.translate(cx+rx*.52,ty-4);c.rotate(-.18);
  c.fillStyle="rgba(30,36,46,.95)";c.fillRect(-11,-6,22,12);
  c.fillStyle="rgba(150,205,240,.25)";c.fillRect(-9.5,-4.5,19,9);
  c.restore();
}
/* ── стоящий у пульта ──
   Тело, а не палки: комбинезон трапецией, плечи шире таза, ранец на спине,
   дальняя нога темнее ближней, одна рука лежит на пульте. Голова — настоящий
   портрет управляющего, тот же, что в карточке. */
function hqFigure(c,x,fy,col,phase,face,ai,m,pose){
  const bob=Math.sin(phase)*1.0,sw=Math.sin(phase*1.3);
  /* Поза у каждого домена своя, иначе рубка — четыре оловянных солдатика в ряд.
     Командир стоит прямо, обе руки на пульте; смотритель развёрнут к экрану;
     фактор опёрся локтем; исследователь держит планшет и смотрит в него.
     Разворот показан сужением корпуса и сдвигом портрета, а не вторым набором
     фигур: половинки и сдвиги дешевле и не расходятся с языком остальных сцен. */
  const P=[{turn:0,lean:0,arm:1},{turn:.5,lean:-.06,arm:2},
           {turn:-.35,lean:.10,arm:3},{turn:.25,lean:.04,arm:4}][pose|0]||
          {turn:0,lean:0,arm:1};
  /* Пропорции: рост 89, голова 26 — три с половиной головы. Меньшая голова
     превращала портрет в пятно, большая — в куклу. Ноги 30, торс 34: пульт
     приходится ровно по пояс, и это делает комнату комнатой. */
  const body=rgba(col,.94),dark=rgba(mixc(col,[8,12,18],.62),.96),
        mid=rgba(mixc(col,[8,12,18],.3),.96),
        lite=rgba(mixc(col,[245,250,255],.35),.95);
  c.save();c.translate(x,fy);
  c.fillStyle="rgba(0,0,0,.4)";                       // тень под ногами
  c.beginPath();c.ellipse(0,1,14,3.6,0,0,TAU);c.fill();
  /* ноги врозь, дальняя темнее: без разницы в тоне это одна доска */
  c.fillStyle=dark;
  c.fillRect(2.5,-30,7,29);c.fillRect(1.5,-3,9.5,3);
  c.fillStyle=mid;
  c.fillRect(-9.5,-30,7,29);c.fillRect(-11,-3,9.5,3);
  c.fillStyle="rgba(0,0,0,.28)";c.fillRect(-1,-30,2,29); // зазор между ног
  /* торс и голова живут в своей системе: наклон от бедра, разворот — сужением */
  c.save();c.translate(0,-30);c.rotate(P.lean);c.scale(1-Math.abs(P.turn)*.3,1);
  c.translate(0,30);
  c.fillStyle=dark;                                    // ранец краем из-за плеча
  c.fillRect(P.turn>0?8.5:-13,-58+bob,4.5,19);
  c.fillStyle="rgba(0,0,0,.25)";c.fillRect(-13,-50+bob,4.5,2);
  /* торс: плечи явным углом, а не дугой — от дуги выходит яйцо */
  const tp=b=>{
    c.beginPath();
    c.moveTo(-9,-64+b);c.lineTo(-4,-67.5+b);c.lineTo(4,-67.5+b);c.lineTo(9,-64+b);
    c.lineTo(14,-58+b);c.lineTo(9.5,-30);c.lineTo(-9.5,-30);c.lineTo(-14,-58+b);
    c.closePath();
  };
  c.fillStyle=body;tp(bob);c.fill();
  c.strokeStyle="rgba(230,240,250,.20)";c.lineWidth=1;tp(bob);c.stroke();
  const sg=c.createLinearGradient(-14,0,14,0);         // свет слева, тень справа
  sg.addColorStop(0,"rgba(255,255,255,.13)");sg.addColorStop(.55,"rgba(255,255,255,0)");
  sg.addColorStop(1,"rgba(0,0,0,.28)");
  c.fillStyle=sg;tp(bob);c.fill();
  c.fillStyle="rgba(0,0,0,.22)";                       // ворот
  c.beginPath();c.moveTo(-5,-66+bob);c.lineTo(0,-59+bob);c.lineTo(5,-66+bob);c.closePath();c.fill();
  c.fillStyle="rgba(0,0,0,.3)";c.fillRect(-9.7,-40+bob*.4,19.4,2.6); // ремень
  c.fillStyle=lite;c.fillRect(-9.7,-40+bob*.4,4,2.6);               // пряжка
  c.fillStyle=rgba(mixc(col,[240,246,255],.5),.85);                 // нашивка домена
  c.fillRect(-12.5,-62+bob,4.5,3.6);
  c.fillStyle="rgba(0,0,0,.18)";c.fillRect(3,-52+bob,6,7);          // нагрудный карман
  /* руки по позе: на пульте, поднятая к экрану, локоть на кромке, планшет */
  c.lineCap="round";
  const hand=(hx,hy)=>{c.fillStyle=lite;c.beginPath();c.arc(hx,hy,2.6,0,TAU);c.fill();};
  c.strokeStyle=body;c.lineWidth=5.4;
  if(P.arm===2){                                        // рука поднята к экрану
    c.beginPath();c.moveTo(10,-60+bob);c.lineTo(17,-64+bob);c.lineTo(23,-70+bob+sw*.8);c.stroke();
    hand(23,-70+bob+sw*.8);
  }else if(P.arm===3){                                  // локоть на кромке пульта
    c.beginPath();c.moveTo(10,-60+bob);c.lineTo(18,-40);c.lineTo(9,-31+sw*.8);c.stroke();
    hand(9,-30+sw*.8);
  }else if(P.arm===4){                                  // держит планшет перед собой
    c.beginPath();c.moveTo(10,-60+bob);c.lineTo(13,-48+bob);c.lineTo(6,-44+bob);c.stroke();
    c.beginPath();c.moveTo(-10,-60+bob);c.lineTo(-13,-48+bob);c.lineTo(-6,-44+bob);c.stroke();
    c.save();c.rotate(-.22);
    c.fillStyle="rgba(24,30,40,.95)";c.fillRect(-9,-50+bob,18,11);
    c.fillStyle=rgba(col,.35);c.fillRect(-7.5,-48.5+bob,15,8);
    c.restore();
  }else{                                                // обе руки на пульте
    c.beginPath();c.moveTo(10,-60+bob);c.lineTo(16,-46+bob*.5);c.lineTo(19,-33+sw*1.2);c.stroke();
    hand(19.5,-32+sw*1.2);
  }
  if(P.arm!==4){                                        // дальняя рука
    c.strokeStyle=dark;c.lineWidth=5;
    c.beginPath();c.moveTo(-10,-60+bob);c.lineTo(-14,-46+bob*.5);c.lineTo(-13,-36+sw*.6);c.stroke();
  }
  c.lineCap="butt";
  c.fillStyle=dark;c.fillRect(-3.5,-70+bob,7,5);        // шея
  if(face){                                             // голова-портрет
    const hx=P.turn*4;                                  // голова доворачивается за корпусом
    c.save();
    c.beginPath();c.arc(hx,-76+bob,13,0,TAU);c.clip();
    c.drawImage(face,hx-13,-89+bob,26,26);
    c.fillStyle="rgba(0,0,0,.18)";                      // щека в тени с дальней стороны
    c.fillRect(P.turn>0?hx-13:hx+4,-89+bob,9,26);
    c.restore();
    c.strokeStyle=rgba(col,.6);c.lineWidth=1.6;
    c.beginPath();c.arc(hx,-76+bob,13,0,TAU);c.stroke();
    c.fillStyle="rgba(0,0,0,.22)";                      // тень от подбородка на грудь
    c.beginPath();c.ellipse(0,-64+bob,7,2.4,0,0,TAU);c.fill();
    if(ai){c.strokeStyle="rgba(159,216,255,.5)";c.lineWidth=1;
      c.beginPath();c.arc(0,-76+bob,16.5,0,TAU);c.stroke();}
  }
  c.restore();                                          // конец системы торса
  /* поручение со сроком висит меткой над плечом: его видно из зала */
  if(m&&m.job){
    c.fillStyle="rgba(242,178,92,"+(.5+.4*Math.sin(G.t*2.4)).toFixed(2)+")";
    c.beginPath();c.moveTo(16,-72+bob);c.lineTo(22,-66+bob);c.lineTo(16,-60+bob);
    c.closePath();c.fill();
  }
  c.restore();
}
/* за окном рубки: свой док, краны и корабль на приколе */
function hqWindowView(c,x,y,w,h,seed){
  const R=rng(seed^0xA1);
  const g=c.createLinearGradient(0,y,0,y+h);
  g.addColorStop(0,"rgba(10,16,28,1)");g.addColorStop(1,"rgba(5,8,14,1)");
  c.fillStyle=g;c.fillRect(x,y,w,h);
  for(let i=0;i<34;i++){
    c.fillStyle="rgba(220,232,246,"+(.12+R()*.5).toFixed(2)+")";
    c.fillRect(x+R()*w,y+R()*h,1.1,1.1);
  }
  c.fillStyle="rgba(60,90,130,.55)";                  // планета краем
  c.beginPath();c.arc(x+w*.22,y+h*1.05,h*.62,0,TAU);c.fill();
  c.fillStyle="rgba(0,0,0,.4)";
  c.beginPath();c.arc(x+w*.34,y+h*.95,h*.62,0,TAU);c.fill();
  c.strokeStyle="rgba(120,140,160,.35)";c.lineWidth=1.4; // ферма дока
  for(let i=0;i<3;i++){c.beginPath();c.moveTo(x+8+i*w*.32,y);c.lineTo(x+14+i*w*.32,y+h);c.stroke();}
  c.fillStyle="rgba(44,54,68,.95)";c.fillRect(x+w*.42,y+h*.5,w*.44,h*.16);
  c.fillStyle="rgba(58,70,86,.95)";
  c.beginPath();c.moveTo(x+w*.86,y+h*.5);c.lineTo(x+w*.98,y+h*.58);
  c.lineTo(x+w*.86,y+h*.66);c.closePath();c.fill();
  for(let i=0;i<4;i++){                                // проблесковые огни
    const on=((G.t*.9|0)%4)===i;
    c.fillStyle=on?"rgba(242,178,92,.9)":"rgba(242,178,92,.2)";
    c.fillRect(x+w*.44+i*w*.11,y+h*.48,1.8,1.8);
  }
}
/* ── канва рубки в экране ШТАБ ──
   Своим rAF, пока канва жива и экран открыт: иначе цикл жёг бы кадр после
   закрытия. По человеку тыкают — открывается его карточка ниже. */
function hqScene(){
  const wrap=el("div","");
  wrap.style.cssText="margin:2px 0 10px;line-height:0;position:relative";
  const cn=document.createElement("canvas");
  const cssW=Math.max(360,Math.min(($hqBody.clientWidth||640)-4,980));
  /* ── рубка занимает ту высоту, которая у панели ЕСТЬ (M223) ──
     Потолок в 270 px оставлял под двумя строками текста нижнюю треть панели
     пустой — ровно тот «экран ни о чём», который плейтест назвал поломкой.
     Меряем настоящую высоту тела и оставляем место под строки; правда этого
     экрана — сама рубка, ей и отдаётся всё остальное. Пропорция комнаты при
     этом не врёт: hqRoomBody считает от высоты канвы (HQ_H — её единицы). */
  const bodyH=$hqBody.clientHeight||560;
  const below=G.mgrs.length?300:136;      /* сколько займут строки под комнатой */
  const cssH=Math.round(clamp(Math.max(cssW*.30,bodyH-below),200,520));
  const dpr=Math.min(window.devicePixelRatio||1,2);
  cn.width=Math.round(cssW*dpr);cn.height=Math.round(cssH*dpr);
  cn.style.cssText="width:100%;height:"+cssH+"px;display:block;border-radius:8px;"+
    "border:1px solid rgba(120,150,170,.25);cursor:pointer;touch-action:manipulation";
  wrap.appendChild(cn);
  $hqBody.appendChild(wrap);
  let hits=[];
  const pick=ev=>{
    const r=cn.getBoundingClientRect();
    const px=(ev.clientX-r.left)/r.width*cn.width/dpr;
    const py=(ev.clientY-r.top)/r.height*cn.height/dpr;
    return (hits.find(h=>px>=h.x&&px<=h.x+h.w&&py>=h.y&&py<=h.y+h.h)||{}).id||null;
  };
  cn.onmousemove=ev=>{hqHover=pick(ev);};
  cn.onmouseleave=()=>{hqHover=null;};
  cn.onclick=ev=>{
    const id=pick(ev);
    if(!id||id===hqSel)return;
    hqSel=id;sfx("ui");hqRender();
  };
  const frame=()=>{
    if(!cn.isConnected||!$hq.classList.contains("open"))return;
    const c=cn.getContext("2d");
    c.setTransform(dpr,0,0,dpr,0,0);
    hits=drawHqRoom({width:cn.width/dpr,height:cn.height/dpr,getContext:()=>c},hqSel,hqHover);
    requestAnimationFrame(frame);
  };
  frame();
}
let hqHover=null;
