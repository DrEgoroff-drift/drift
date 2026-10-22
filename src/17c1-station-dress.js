/* ── почерк строителя на модулях и ядре (M454, второй проход) ──
   Одетая плита оставляла модули и ядро общим набором: плита одна, а видно
   больше всего как раз модули. Теперь завод доходит до каждого корпуса —
   закон профиля (Компания, Коммуна и Хай-Фронт скругляют торцы; ГЛАВТРАССА и
   Орднунг — прямой угол), шов (Орднунг — чёрное ребро поверх модуля, а не
   под ним; ГЛАВТРАССА — трафаретная полоса; Рассвет — заплата другой краской)
   и стык модуля со штангой той же грамматикой, что у корпусов (makerJoint:
   хомут, заподлицо, фланец, галтель, сварка, зазор). Рисуется в выпечку. */
function stModMaker(q,s){
  const by=ST_BY||"gt",u=6*s;
  ctx.save();
  if(by==="gt"){
    ctx.fillStyle="rgba(168,52,44,.8)";ctx.fillRect(-u,u*.62,u*2,1.1*s);
    ctx.fillStyle="rgba(230,222,200,.6)";ctx.font="bold "+(2.6*s).toFixed(2)+"px ui-monospace,monospace";ctx.textAlign="center";
    ctx.fillText(String(1+((q.ph*97)|0)%9),u*.62,-u*.55);
  }else if(by==="co"){
    ctx.fillStyle="rgba(246,247,249,.22)";ctx.beginPath();ctx.ellipse(0,0,u*1.05,u*1.05,0,0,TAU);ctx.fill();
    ctx.fillStyle="rgba(255,70,160,.8)";ctx.fillRect(-u*.9,-u*.2,u*1.8,.9*s);
  }else if(by==="or"){
    ctx.fillStyle="rgba(0,0,0,.8)";ctx.fillRect(-.7*s,-u*1.1,1.4*s,u*2.2);
    ctx.fillStyle="rgba(235,235,230,.7)";ctx.font="bold "+(2.3*s).toFixed(2)+"px ui-monospace,monospace";ctx.textAlign="left";
    ctx.fillText("№"+(10+((q.ph*89)|0)%89),1.2*s,-u*.7);
  }else if(by==="km"){
    ctx.strokeStyle="rgba(176,204,234,.5)";ctx.lineWidth=.7*s;
    ctx.beginPath();ctx.arc(0,u*1.4,u*1.3,Math.PI*1.2,Math.PI*1.8);ctx.stroke();
    ctx.fillStyle="rgba(255,214,150,.75)";
    for(let i=0;i<4;i++){const a=Math.PI*(1.25+i*.17);ctx.fillRect(Math.cos(a)*u*1.3-.5*s,u*1.4+Math.sin(a)*u*1.3+.8*s,1*s,.8*s);}
  }else if(by==="ra"){
    const P=[[196,120,50],[150,70,40],[210,160,70],[90,120,70]];
    ctx.fillStyle=rgba(P[((q.ph*7)|0)%4],.55);ctx.fillRect(-u*.2,-u*.3,u*.9,u*.7);
    ctx.strokeStyle="rgba(230,190,120,.4)";ctx.lineWidth=.4*s;ctx.strokeRect(-u*.2,-u*.3,u*.9,u*.7);
  }else if(by==="hf"){
    ctx.fillStyle="rgba(206,216,224,.28)";ctx.beginPath();ctx.ellipse(0,0,u*1.05,u*1.05,0,0,TAU);ctx.fill();
    ctx.fillStyle="rgba(130,255,236,.5)";ctx.fillRect(-u*.7,u*.95,u*1.4,.6*s);
    if(((q.ph*13)|0)%3===0){ctx.fillStyle="rgba(230,40,40,.95)";ctx.beginPath();ctx.arc(u*.5,-u*.5,.9*s,0,TAU);ctx.fill();}
  }
  ctx.restore();
}
/* стык модуля со штангой: на торце штанги, в её собственном повороте */
function stModJoint(q){
  if(typeof makerJoint!=="function")return;
  const by=ST_BY||"gt",g=(typeof makerGround==="function")?makerGround(by):[60,70,80];
  const h={by,bw:q.s*9,iron:mixc([22,26,32],g,.3),lite:mixc([200,210,220],g,.3)};
  ctx.save();ctx.rotate(q.ang);ctx.translate(q.d-4*q.s,0);ctx.rotate(Math.PI/2);
  makerJoint(h,0,0,1);
  ctx.restore();
}
