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
function houseMark(H,V){
  if(!H)return;
  const c=H.col;
  ctx.save();ctx.lineWidth=1.6;ctx.strokeStyle=c;ctx.fillStyle=rgba(houseRGB(H),.18);
  if(H.id==="lask"){
    for(const sx of [-1,1]){ctx.beginPath();ctx.arc(sx*27*V.a,22,5.5,0,TAU);ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.moveTo(sx*27*V.a-5.5,22);ctx.lineTo(sx*27*V.a+5.5,22);ctx.stroke();}
  }else if(H.id==="kova"){
    ctx.beginPath();ctx.moveTo(-30*V.a,-26);ctx.lineTo(-26*V.a,-14);ctx.lineTo(-14,-14);ctx.lineTo(-12,-26);ctx.stroke();
    ctx.beginPath();ctx.moveTo(-26*V.a,-14);ctx.lineTo(-26*V.a,-8);ctx.lineTo(-14,-8);ctx.lineTo(-14,-14);ctx.closePath();ctx.fill();ctx.stroke();
  }else if(H.id==="vest"){
    ctx.beginPath();ctx.moveTo(0,-28);ctx.lineTo(0,-46);ctx.stroke();
    ctx.beginPath();ctx.arc(0,-48,4.5,Math.PI*.15,Math.PI*.85,true);ctx.stroke();
    ctx.fillStyle=(Math.sin(G.t*.07)>0)?c:rgba(houseRGB(H),.25);ctx.beginPath();ctx.arc(0,-46,1.4,0,TAU);ctx.fill();
  }else if(H.id==="kryl"){
    for(const sx of [-1,1]){ctx.beginPath();ctx.moveTo(sx*8,14);ctx.lineTo(sx*34*V.a,26);ctx.lineTo(sx*30*V.a,30);ctx.lineTo(sx*8,19);ctx.closePath();ctx.fill();ctx.stroke();}
  }
  ctx.restore();
}
/* в посёлке: тот же знак на стене самого крупного двора, в его масштабе */
function houseWallMark(H,x,y,w,h){
  if(!H)return;
  ctx.save();ctx.strokeStyle=rgba(houseRGB(H),.85);ctx.fillStyle=rgba(houseRGB(H),.25);ctx.lineWidth=1;
  const cx=x+w*.72,cy=y-h*.55,s=Math.min(w,h)*.18;
  if(H.id==="lask"){ctx.beginPath();ctx.arc(cx-s*.6,cy,s*.55,0,TAU);ctx.arc(cx+s*.6,cy,s*.55,0,TAU);ctx.fill();ctx.stroke();}
  else if(H.id==="kova"){ctx.beginPath();ctx.moveTo(cx-s,cy-s*.6);ctx.lineTo(cx-s*.6,cy+s*.6);ctx.lineTo(cx+s*.6,cy+s*.6);ctx.lineTo(cx+s,cy-s*.6);ctx.stroke();}
  else if(H.id==="vest"){ctx.beginPath();ctx.moveTo(cx,cy+s);ctx.lineTo(cx,cy-s);ctx.stroke();ctx.beginPath();ctx.arc(cx,cy-s,s*.6,Math.PI*.2,Math.PI*.8,true);ctx.stroke();}
  else if(H.id==="kryl"){ctx.beginPath();ctx.moveTo(cx-s,cy);ctx.lineTo(cx,cy-s*.5);ctx.lineTo(cx+s,cy);ctx.lineTo(cx,cy+s*.2);ctx.closePath();ctx.fill();ctx.stroke();}
  ctx.restore();
}
/* цвет вымпела посёлка: дом станции этой системы, если она есть */
function housePennant(){
  const H=(typeof houseOf==="function")?houseOf(G.sys):null;
  return H?rgba(houseRGB(H),.9):"rgba(226,120,70,.9)";
}
