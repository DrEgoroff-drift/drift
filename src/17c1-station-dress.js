/* ══════════════ станция по строителю: одевка плиты (M454, DESIGN-borders §2.3) ══════════════
   Корпус станции общий для всех (17c: плита, модули, ядро типа), а завод
   одевает ПЛИТУ — то, что видно между модулями. Та же грамматика, что у
   корпусов (03a-hull-maker): ГЛАВТРАССА — плиты, красная полоса и номер по
   трафарету; Компания — белое и лента логотипа; Орднунг — серая сталь и чёрные
   рёбра с номерами; Коммуна — длинные дуги и тёплая лента окон; Рассвет —
   лоскуты, каждая сторона своей краской, солнце от руки; Хай-Фронт — белое,
   пусто, одна красная точка и свет из-под обшивки. Рисуется в выпечку станции
   (stationMaster), в кадре не стоит ничего. */
function stMakerDress(by,V){
  const bw=26*(V.a||1),bh=17*(V.b||1),n=10+Math.floor((V.f||0)*89);
  ctx.save();stPlatePath(V);ctx.clip();
  if(by==="gt"){
    ctx.fillStyle="rgba(168,52,44,.85)";ctx.fillRect(-bw,bh*.42,bw*2,2.4);
    ctx.fillStyle="rgba(220,213,194,.55)";ctx.fillRect(-bw,bh*.42+3.2,bw*2,.8);
    ctx.fillStyle="rgba(230,222,200,.75)";ctx.font="bold 4px ui-monospace,monospace";ctx.textAlign="left";
    ctx.fillText("СТ-"+n,-bw*.9,-bh*.62);
    ctx.fillStyle="rgba(200,50,40,.9)";ctx.font="5px sans-serif";ctx.fillText("★",bw*.62,-bh*.55);
  }else if(by==="co"){
    ctx.fillStyle="rgba(246,247,249,.30)";stPlatePath(V);ctx.fill();
    ctx.fillStyle="rgba(255,70,160,.85)";ctx.fillRect(-bw,-bh*.78,bw*2,2.2);
    ctx.fillStyle="rgba(80,210,255,.8)";ctx.fillRect(-bw,-bh*.78+2.6,bw*2,1);
    ctx.fillStyle="rgba(255,255,255,.85)";ctx.font="bold 4px sans-serif";ctx.textAlign="left";
    ctx.fillText("КОМПАНИЯ™",-bw*.85,bh*.8);
  }else if(by==="or"){
    ctx.fillStyle="rgba(0,0,0,.75)";
    for(let i=-2;i<=2;i++)ctx.fillRect(i*bw*.38-1.1,-bh,2.2,bh*2);
    ctx.fillStyle="rgba(235,235,230,.7)";ctx.font="bold 3.4px ui-monospace,monospace";ctx.textAlign="center";
    for(let i=-2;i<2;i++)ctx.fillText(String(n*10+i+2),i*bw*.38+bw*.19,-bh*.72);
  }else if(by==="km"){
    ctx.strokeStyle="rgba(176,204,234,.55)";ctx.lineWidth=1.1;
    ctx.beginPath();ctx.moveTo(-bw,bh*.5);ctx.bezierCurveTo(-bw*.3,-bh*.2,bw*.3,-bh*.2,bw,bh*.5);ctx.stroke();
    ctx.beginPath();ctx.moveTo(-bw,-bh*.2);ctx.bezierCurveTo(-bw*.4,-bh*.9,bw*.4,-bh*.9,bw,-bh*.2);ctx.stroke();
    ctx.fillStyle="rgba(255,214,150,.8)";
    for(let i=0;i<9;i++){const u=i/8,x=-bw*.8+u*bw*1.6,y=bh*.5-Math.sin(u*Math.PI)*bh*.5+2;ctx.fillRect(x-.6,y,1.2,1);}
  }else if(by==="ra"){
    const P=[[196,120,50],[40,34,30],[150,70,40],[210,160,70],[70,60,52],[180,90,50]];
    for(let i=0;i<6;i++){
      const x=-bw+((i*37+n)%10)/10*bw*1.7,y=-bh+((i*23+n*3)%10)/10*bh*1.6;
      ctx.fillStyle=rgba(P[i],.5);ctx.fillRect(x,y,bw*.45,bh*.5);
      ctx.strokeStyle="rgba(230,190,120,.35)";ctx.lineWidth=.5;ctx.strokeRect(x,y,bw*.45,bh*.5);
    }
    ctx.fillStyle="rgba(255,196,80,.9)";ctx.beginPath();ctx.arc(-bw*.62,bh*.55,2.6,0,TAU);ctx.fill();
    ctx.strokeStyle="rgba(255,196,80,.8)";ctx.lineWidth=.6;
    for(let i=0;i<8;i++){const a=i*TAU/8;ctx.beginPath();ctx.moveTo(-bw*.62+Math.cos(a)*3.3,bh*.55+Math.sin(a)*3.3);ctx.lineTo(-bw*.62+Math.cos(a)*4.6,bh*.55+Math.sin(a)*4.6);ctx.stroke();}
  }else if(by==="hf"){
    ctx.fillStyle="rgba(206,216,224,.34)";stPlatePath(V);ctx.fill();
    ctx.fillStyle="rgba(130,255,236,.55)";ctx.fillRect(-bw*.8,bh-1.6,bw*1.6,1);
    ctx.fillStyle="rgba(230,40,40,.95)";ctx.beginPath();ctx.arc(bw*.55,-bh*.45,1.6,0,TAU);ctx.fill();
  }
  ctx.restore();
}
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
/* ядро: торцы по закону профиля и шов по заводу */
function stCoreMaker(w,h){
  const by=ST_BY||"gt";
  ctx.save();
  if(by==="co"||by==="hf"||by==="km"){
    ctx.fillStyle=stGround([36,48,62],.35);ctx.strokeStyle="rgba(0,0,0,.45)";ctx.lineWidth=.8;
    for(const sg of [-1,1]){ctx.beginPath();ctx.ellipse(0,sg*h,w,w*.8,0,sg>0?0:Math.PI,sg>0?Math.PI:TAU);ctx.fill();ctx.stroke();}
    if(by==="hf"){ctx.fillStyle="rgba(130,255,236,.45)";ctx.fillRect(-w*.8,h-1,w*1.6,.8);}
    if(by==="co"){ctx.fillStyle="rgba(255,70,160,.75)";ctx.fillRect(-w,-h*.1,w*2,1.2);}
    if(by==="km"){ctx.fillStyle="rgba(255,214,150,.7)";for(let i=-h+3;i<h-2;i+=4)ctx.fillRect(-w*.5,i,w,1);}
  }else if(by==="or"){
    ctx.fillStyle="rgba(0,0,0,.8)";for(let i=-h+3;i<h;i+=5)ctx.fillRect(-w-.6,i,w*2+1.2,1.1);
  }else if(by==="gt"){
    ctx.fillStyle="rgba(168,52,44,.8)";ctx.fillRect(-w,h*.35,w*2,1.4);
  }else if(by==="ra"){
    ctx.fillStyle="rgba(196,120,50,.5)";ctx.fillRect(-w,-h*.6,w*1.1,h*.5);
    ctx.fillStyle="rgba(90,120,70,.5)";ctx.fillRect(-w*.1,h*.1,w*1.1,h*.45);
  }
  ctx.restore();
}
