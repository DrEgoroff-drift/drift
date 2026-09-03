/* ══════════════ дома как язык форм ══════════════
   Хвост M55 #2/#7 и M113: четыре дома (12u) различались только именем и цветом
   бонов, а станции и посёлки под ними выглядели одинаково. Теперь у дома есть
   ФОРМА, и она одна на всё, что ему принадлежит: на станции — знак на корпусе,
   в посёлке — цвет вымпела и тот же знак на стене.

   «Ласковый» (снабжение) — мягкое: два круглых бака, тёплый жёлтый.
   «Ковш» (руда) — угловатое: открытый ковш-кронштейн, бирюза.
   «Вестовой» (почта) — тонкое: мачта с тарелкой, голубой.
   «Крыло» (верфи) — размах: два скошенных лонжерона, рыжий.

   ПРАВИЛА ФАЙЛА:
   1. Знак не подписывается: дом узнают по форме, как флаг, а не по тексту.
   2. Формы не меняют геометрию станции и посёлка — они навешаны поверх. */

function houseRGB(H){return hex2rgb(H.col);}
/* на станции: после корпуса типа, в тех же координатах (масштаб уже стоит) */
function houseMark(H,V,off){
  if(!H)return;
  const c=H.col;
  /* Знак — ВЕЩЬ на борту, а не чертёж поверх (M328). До этого четыре знака
     были контурами чистым цветом дома в 1.6 px размером с полкорпуса: мачта
     «Вестового» стояла в факеле, скоба «Ковша» лежала на конвейере полкорпусом
     бирюзы. Теперь один язык на всех: место — левое плечо корпуса (−20a,−14),
     рост — с иллюминатор; слои по своду: тёмное тело → кромка цветом дома →
     одна светлая точка. Форма семьи сохранена: баки, ковш, тарелка, лонжероны. */
  ctx.save();
  if(off)ctx.translate(off.x||0,off.y||0);
  const bx=-20*V.a, by=-14, body="rgba(18,24,32,.92)", dim=rgba(houseRGB(H),.6);
  ctx.lineWidth=1.1;ctx.lineJoin="round";
  if(H.id==="lask"){
    /* два бака на полке: мягкое */
    ctx.strokeStyle=dim;ctx.beginPath();ctx.moveTo(bx-6,by);ctx.lineTo(bx+6,by);ctx.stroke();
    for(const sx of [-1,1]){
      ctx.fillStyle=body;ctx.beginPath();ctx.arc(bx+sx*3.2,by-3.4,3,0,TAU);ctx.fill();
      ctx.strokeStyle=c;ctx.stroke();
    }
    ctx.fillStyle=c;ctx.beginPath();ctx.arc(bx-3.2,by-4.4,.7,0,TAU);ctx.fill();
  }else if(H.id==="kova"){
    /* ковш на кронштейне: угловатое */
    ctx.strokeStyle=dim;ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx,by-4);ctx.stroke();
    ctx.fillStyle=body;
    ctx.beginPath();ctx.moveTo(bx-4.5,by-10);ctx.lineTo(bx-3,by-4);ctx.lineTo(bx+3,by-4);ctx.lineTo(bx+4.5,by-10);ctx.closePath();ctx.fill();
    ctx.strokeStyle=c;ctx.stroke();
    ctx.fillStyle=c;ctx.fillRect(bx-3,by-5.2,6,.9);
  }else if(H.id==="vest"){
    /* тарелка на стойке: тонкое */
    ctx.strokeStyle=dim;ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx,by-5);ctx.stroke();
    ctx.fillStyle=body;
    ctx.beginPath();ctx.arc(bx,by-8.4,3.4,Math.PI*.08,Math.PI*.92);ctx.closePath();ctx.fill();
    ctx.strokeStyle=c;ctx.beginPath();ctx.arc(bx,by-8.4,3.4,Math.PI*.08,Math.PI*.92);ctx.stroke();
    ctx.fillStyle=(Math.sin(G.t*.07)>0)?c:rgba(houseRGB(H),.25);ctx.beginPath();ctx.arc(bx,by-8.6,.8,0,TAU);ctx.fill();
  }else if(H.id==="kryl"){
    /* два скошенных лонжерона: размах */
    ctx.fillStyle=body;
    for(const sx of [-1,1]){
      ctx.beginPath();ctx.moveTo(bx,by-4);ctx.lineTo(bx+sx*7,by-9);ctx.lineTo(bx+sx*7,by-6.6);ctx.lineTo(bx,by-2.2);ctx.closePath();ctx.fill();
      ctx.strokeStyle=c;ctx.stroke();
    }
    ctx.fillStyle=c;ctx.beginPath();ctx.arc(bx,by-3.2,.9,0,TAU);ctx.fill();
  }
  ctx.restore();
}
/* в посёлке: тот же знак на стене самого крупного двора, в его масштабе */
/* Знак на стене — ТАБЛИЧКА у двери, а не линия по штукатурке (M326). До этого
   контур в один пиксель чистой бирюзы лежал посреди стены рядом с дверью и
   читался сбоем интерфейса — «галочкой», а не вещью. По своду (§1 слои,
   §13 тело-обвод-один-свет): тень → доска → знак → блик верхней кромки. Место —
   снаружи от двери на высоте головы, где вешают номер дома; сторона двери и
   высота стены берутся из плана дома (housePlan), чтобы не лечь на окно и
   навес крыльца. cx — середина дома, gy — земля, wallH — высота стены в px. */
function houseWallMark(H,cx,gy,w,wallH,hp,pal){
  if(!H)return;
  const flip=!!(hp&&hp.flip);
  const dw=w*.22, dX=flip?cx+w*.30-dw:cx-w*.30;             /* дверь — как в sdDwell */
  const px=flip?dX+dw+w*.11:dX-w*.11, py=gy-wallH*.60;       /* снаружи от двери, голова */
  const pw=Math.max(5,w*.15), ph=pw*1.2, s=pw*.34;
  const wood=(pal&&pal.wood)||[110,84,58];
  const mix=(a,b,t)=>[0,1,2].map(i=>Math.round(a[i]+(b[i]-a[i])*t));
  const rgb=v=>"rgb("+v.join(",")+")";
  const ink=mix(houseRGB(H),[46,50,56],.22);                  /* краска выцвела, но цвет дома цел */
  ctx.save();
  ctx.fillStyle="rgba(0,0,0,.35)";ctx.fillRect(px-pw/2+1,py-ph/2+1.2,pw,ph);   /* тень */
  ctx.fillStyle=rgb(mix(wood,[0,0,0],.28));ctx.fillRect(px-pw/2,py-ph/2,pw,ph); /* доска */
  ctx.fillStyle="rgba(255,246,220,.20)";ctx.fillRect(px-pw/2,py-ph/2,pw,1);      /* блик кромки */
  ctx.strokeStyle="rgba("+ink.join(",")+",.92)";ctx.fillStyle="rgba("+ink.join(",")+",.35)";
  ctx.lineWidth=1.3;ctx.lineJoin="round";ctx.lineCap="round";
  const cy=py;
  if(H.id==="lask"){ctx.beginPath();ctx.arc(px-s*.55,cy,s*.5,0,TAU);ctx.arc(px+s*.55,cy,s*.5,0,TAU);ctx.fill();ctx.stroke();}
  else if(H.id==="kova"){ctx.beginPath();ctx.moveTo(px-s,cy-s*.6);ctx.lineTo(px-s*.6,cy+s*.6);ctx.lineTo(px+s*.6,cy+s*.6);ctx.lineTo(px+s,cy-s*.6);ctx.closePath();ctx.fill();ctx.stroke();}
  else if(H.id==="vest"){ctx.beginPath();ctx.moveTo(px,cy+s);ctx.lineTo(px,cy-s*.4);ctx.stroke();ctx.beginPath();ctx.arc(px,cy-s*.3,s*.7,Math.PI*.15,Math.PI*.85,true);ctx.stroke();}
  else if(H.id==="kryl"){ctx.beginPath();ctx.moveTo(px-s,cy);ctx.lineTo(px,cy-s*.5);ctx.lineTo(px+s,cy);ctx.lineTo(px,cy+s*.2);ctx.closePath();ctx.fill();ctx.stroke();}
  ctx.restore();
}
/* цвет вымпела посёлка: дом станции этой системы, если она есть */
function housePennant(){
  const H=(typeof houseOf==="function")?houseOf(G.sys):null;
  return H?rgba(houseRGB(H),.9):"rgba(226,120,70,.9)";
}
