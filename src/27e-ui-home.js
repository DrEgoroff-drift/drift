/* ══════════════ дом: помещение, а не список ══════════════
   Дом — единственное место, про которое игра говорит «здесь вы дома», и список
   построек тут не годится: он и есть то место, где видно нажитое. Комната
   рисуется тем же языком, что кантина, база и абордаж.

   ПРАВИЛА, КОТОРЫМ ПОДЧИНЁН ФАЙЛ:
   1. Мерило — человек. Хозяин стоит ростом 54 px, и всё остальное меряется им:
      верстак по бедро, стеллаж в полтора роста, корабль в гараже вчетверо шире.
   2. Комната РАСТЁТ: каждая ступень добавляет свой кусок слева направо, а не
      подсвечивает готовую картинку. Пустое место справа — это то, чего ещё нет,
      и его видно.
   3. Ни одной цены: дом не покупается. Внизу полоса «до следующей ступени».
   4. Свет один — лампа над столом; всё остальное её слушается. */
const HOME_ROOM_H=200;
/* ширина комнаты в своих единицах: ровно столько, сколько занимают уже
   построенные ступени плюс поля. Комната с самого начала не должна быть
   лентой, в которой добро жмётся к левому краю */
const HOME_STEP_W=[52,40,88,56,60,58,56,70];
function homeRoomW(){
  const t=(G.home&&G.home.tier)||0;
  let w=28;
  for(let i=0;i<t;i++)w+=HOME_STEP_W[i];
  return w+46;                                      // поле под хозяина справа
}
function drawHomeRoom(cn){
  const H=G.home;if(!H||!H.tier)return;
  const c=cn.getContext("2d");
  c.clearRect(0,0,cn.width,cn.height);
  /* масштаб берём по ШИРИНЕ содержимого, а не по высоте канвы: иначе
     двухкомнатный дом растягивается на весь экран и теряет масштаб */
  const W2=homeRoomW(), k=cn.width/W2, H2=cn.height/k;   // единицы комнаты
  c.save();c.scale(k,k);
  homeRoomBody(c,W2,H2);
  c.restore();
}
function homeRoomBody(c,W2,H2){
  const H=G.home;
  const fy=H2-22;                                   // пол
  const acc=hex2rgb("#f2b25c");
  /* ── стена: тёплая, обжитая, с одной лампой ── */
  const wall=[36,33,38];
  const wg=c.createLinearGradient(0,0,0,fy);
  wg.addColorStop(0,rgba(mixc(wall,[6,8,12],.6),1));
  wg.addColorStop(1,rgba(wall,1));
  c.fillStyle=wg;c.fillRect(0,0,W2,fy);
  for(let i=0;i<Math.ceil(W2/64);i++){
    c.fillStyle="rgba(255,255,255,.014)";
    c.fillRect(i*64,8,60,fy-8);
  }
  /* пол */
  c.fillStyle=rgba(mixc(wall,[10,10,14],.5),1);c.fillRect(0,fy,W2,H2-fy);
  c.strokeStyle="rgba(255,255,255,.06)";c.lineWidth=1;
  c.beginPath();c.moveTo(0,fy+.5);c.lineTo(W2,fy+.5);c.stroke();
  /* лампа над столом — единственный источник, конус света на пол */
  const lampX=Math.min(W2*.5,150);
  c.strokeStyle="rgba(255,255,255,.22)";c.lineWidth=1;
  c.beginPath();c.moveTo(lampX,0);c.lineTo(lampX,26);c.stroke();
  c.fillStyle=rgba(acc,.9);
  c.beginPath();c.moveTo(lampX-9,34);c.lineTo(lampX+9,34);c.lineTo(lampX+5,26);
  c.lineTo(lampX-5,26);c.closePath();c.fill();
  const cone=c.createLinearGradient(0,34,0,fy);
  cone.addColorStop(0,"rgba(255,205,140,.22)");cone.addColorStop(1,"rgba(255,205,140,0)");
  c.fillStyle=cone;
  c.beginPath();c.moveTo(lampX-8,34);c.lineTo(lampX+8,34);
  c.lineTo(lampX+58,fy);c.lineTo(lampX-58,fy);c.closePath();c.fill();
  /* ── ступени слева направо: комната растёт, а не подсвечивается ── */
  let x=14;
  const step=(w,fn)=>{fn(x,w);x+=w;};
  /* 1. угол: матрас, ящик вместо стола, лампа на полу */
  if(H.tier>=1)step(52,(x0)=>{
    c.fillStyle="rgba(150,120,96,.9)";
    c.fillRect(x0,fy-9,34,9);                       // матрас
    c.fillStyle="rgba(200,180,150,.85)";c.fillRect(x0+2,fy-12,12,4);
    c.fillStyle=rgba(mixc(wall,[70,64,60],.9),1);
    c.fillRect(x0+38,fy-14,13,14);                  // ящик
    c.fillStyle=rgba(acc,.75);
    c.beginPath();c.arc(x0+44,fy-17,2.6,0,TAU);c.fill();
  });
  /* 2. прихожая: дверь, крючки, коврик */
  if(H.tier>=2)step(40,(x0)=>{
    c.fillStyle=rgba(mixc(wall,[18,20,26],.7),1);
    c.fillRect(x0+4,fy-58,26,58);
    c.strokeStyle="rgba(255,255,255,.12)";c.lineWidth=1;
    c.strokeRect(x0+4.5,fy-57.5,25,57);
    c.fillStyle=rgba(acc,.8);c.beginPath();c.arc(x0+26,fy-30,1.6,0,TAU);c.fill();
    for(let i=0;i<3;i++){                            // крючки с одеждой
      c.strokeStyle="rgba(255,255,255,.2)";
      c.beginPath();c.moveTo(x0+33+i*3,fy-52);c.lineTo(x0+33+i*3,fy-48);c.stroke();
    }
    c.fillStyle="rgba(120,100,86,.7)";c.fillRect(x0+2,fy-3,32,3);
  });
  /* 3. гараж: корабль боком, вчетверо шире человека — сюда вы вернётесь */
  if(H.tier>=3)step(88,(x0)=>{
    c.fillStyle="rgba(0,0,0,.28)";c.fillRect(x0,fy-64,84,64);
    c.strokeStyle="rgba(255,255,255,.1)";c.strokeRect(x0+.5,fy-63.5,83,63);
    const gid=(H.garage&&H.garage[0])||G.shipId;
    c.save();
    c.translate(x0+42,fy-26);
    const hl=hullOf(gid),s=62/hl.len;
    c.scale(s,s);
    const prev=ctx;ctx=c;
    tracePoly(hl.poly);
    ctx.fillStyle=rgba(hl.body,1);ctx.fill();
    ctx.strokeStyle=rgba(hl.col,.8);ctx.lineWidth=1/s;ctx.stroke();
    ctx=prev;
    c.restore();
    /* подпорки и кабель питания: корабль стоит, а не висит */
    c.strokeStyle="rgba(255,255,255,.16)";c.lineWidth=1;
    for(const dx of [-22,22]){
      c.beginPath();c.moveTo(x0+42+dx,fy-16);c.lineTo(x0+42+dx,fy);c.stroke();
    }
  });
  /* 4. витрина: стекло, полки, редкое сырьё огоньками */
  if(H.tier>=4)step(56,(x0)=>{
    c.fillStyle="rgba(20,26,32,.75)";c.fillRect(x0+4,fy-62,48,62);
    c.strokeStyle="rgba(160,220,235,.35)";c.lineWidth=1;
    c.strokeRect(x0+4.5,fy-61.5,47,61);
    const keys=Object.keys(G.home.showcase||{});
    for(let i=0;i<3;i++){
      const sy=fy-52+i*18;
      c.strokeStyle="rgba(255,255,255,.12)";
      c.beginPath();c.moveTo(x0+6,sy);c.lineTo(x0+50,sy);c.stroke();
      for(let j=0;j<4;j++){
        const key=keys[(i*4+j)%Math.max(1,keys.length)];
        if(!key)break;
        const col=hex2rgb(RES[key].col||"#7fe6d8");
        c.fillStyle=rgba(col,.85);
        c.beginPath();
        c.moveTo(x0+11+j*11,sy-1);c.lineTo(x0+14+j*11,sy-7);c.lineTo(x0+17+j*11,sy-1);
        c.closePath();c.fill();
      }
    }
    /* блик по стеклу — иначе витрина читается нишей */
    c.fillStyle="rgba(255,255,255,.06)";
    c.beginPath();c.moveTo(x0+8,fy-2);c.lineTo(x0+30,fy-60);c.lineTo(x0+38,fy-60);
    c.lineTo(x0+16,fy-2);c.closePath();c.fill();
  });
  /* 5. мастерская: верстак по бедро, тиски, доска с инструментом */
  if(H.tier>=5)step(60,(x0)=>{
    c.fillStyle=rgba(mixc(wall,[80,70,58],.9),1);
    c.fillRect(x0+2,fy-26,54,6);
    c.fillStyle="rgba(0,0,0,.4)";c.fillRect(x0+6,fy-20,4,20);c.fillRect(x0+48,fy-20,4,20);
    c.fillStyle="rgba(190,200,210,.7)";c.fillRect(x0+14,fy-31,7,5);  // тиски
    c.strokeStyle="rgba(255,255,255,.14)";c.lineWidth=1;
    c.strokeRect(x0+30.5,fy-58.5,24,20);                             // доска
    for(let i=0;i<5;i++){
      c.strokeStyle="rgba(220,225,235,.45)";
      c.beginPath();c.moveTo(x0+34+i*4,fy-55);c.lineTo(x0+34+i*4,fy-44+((i*7)%5));c.stroke();
    }
  });
  /* 6. кабинет: стол, стул, бумаги под лампой */
  if(H.tier>=6)step(58,(x0)=>{
    c.fillStyle=rgba(mixc(wall,[60,56,66],.9),1);
    c.fillRect(x0+4,fy-28,48,5);
    c.fillStyle="rgba(0,0,0,.4)";c.fillRect(x0+8,fy-23,3,23);c.fillRect(x0+45,fy-23,3,23);
    c.fillStyle="rgba(240,235,220,.7)";c.fillRect(x0+16,fy-31,14,3);
    c.strokeStyle="rgba(255,255,255,.18)";c.lineWidth=1;
    c.beginPath();c.moveTo(x0+40,fy-28);c.lineTo(x0+40,fy-44);c.lineTo(x0+50,fy-44);c.stroke();
  });
  /* 7. жилая часть: койки в два яруса — сюда возвращаются наёмники */
  if(H.tier>=7)step(56,(x0)=>{
    for(let i=0;i<2;i++){
      const by=fy-16-i*24;
      c.fillStyle=rgba(mixc(wall,[70,66,72],.85),1);c.fillRect(x0+4,by,46,5);
      c.fillStyle="rgba(150,130,110,.75)";c.fillRect(x0+6,by-5,42,5);
      c.fillStyle="rgba(220,215,205,.7)";c.fillRect(x0+8,by-7,10,3);
    }
    c.fillStyle="rgba(0,0,0,.35)";c.fillRect(x0+4,fy-40,3,40);c.fillRect(x0+47,fy-40,3,40);
  });
  /* 8. причал с маяком: окно в док и живой огонь маяка */
  if(H.tier>=8)step(70,(x0)=>{
    c.fillStyle="rgba(8,12,20,.95)";c.fillRect(x0+4,fy-70,62,44);
    c.strokeStyle="rgba(160,200,220,.3)";c.strokeRect(x0+4.5,fy-69.5,61,43);
    for(let i=0;i<14;i++){
      c.fillStyle="rgba(255,255,255,"+(.2+((i*37)%5)*.1).toFixed(2)+")";
      c.fillRect(x0+8+((i*23)%56),fy-66+((i*17)%38),1,1);
    }
    const bl=.45+.55*Math.abs(Math.sin(G.t*.04));
    c.fillStyle="rgba(242,178,92,"+bl.toFixed(2)+")";
    c.beginPath();c.arc(x0+58,fy-62,3,0,TAU);c.fill();
    c.fillStyle="rgba(242,178,92,"+(bl*.18).toFixed(2)+")";
    c.beginPath();c.arc(x0+58,fy-62,9,0,TAU);c.fill();
  });
  /* ── хозяин: мерило всей комнаты ── */
  const px=Math.min(W2-30,x+16);
  homeFigure(c,px,fy,acc);
  /* ── полоса «до следующей ступени»: вместо ценника, которого нет ── */
  const pr=homeProgress();
  if(pr){
    const bw=Math.min(W2-28,260), bx=14, by=H2-9;
    c.fillStyle="rgba(255,255,255,.12)";c.fillRect(bx,by,bw,3);
    c.fillStyle=rgba(acc,.9);c.fillRect(bx,by,bw*pr.frac,3);
    c.fillStyle="rgba(210,225,235,.75)";
    c.font="7px ui-monospace,monospace";c.textAlign="left";
    c.fillText(pr.done?"дом достроен":pr.ru,bx,by-4);
  }
}
/* хозяин стоит у своего добра: рост 54 px — то же мерило, что в кантине и на
   поверхности. Без человека комната мгновенно теряет масштаб */
function homeFigure(c,x,fy,acc){
  const h=54;
  c.fillStyle="rgba(0,0,0,.3)";
  c.beginPath();c.ellipse(x,fy,9,2.4,0,0,TAU);c.fill();
  c.fillStyle="rgba(96,108,120,1)";
  c.fillRect(x-5,fy-h*.62,10,h*.62);                 // корпус
  c.fillStyle="rgba(80,90,102,1)";
  c.fillRect(x-4,fy-h*.30,3.4,h*.30);c.fillRect(x+.8,fy-h*.30,3.4,h*.30);
  c.fillStyle="rgba(150,165,178,1)";
  c.beginPath();c.arc(x,fy-h*.70,5.4,0,TAU);c.fill();  // голова
  c.fillStyle=rgba(acc,.55);
  c.beginPath();c.arc(x-1.4,fy-h*.71,3.2,0,TAU);c.fill();
}
