/* ══════════════ станция по строителю: одевка плиты (M454, DESIGN-borders §2.3) ══════════════
   Корпус станции общий для всех (17c: плита, модули, ядро типа), а завод
   одевает ПЛИТУ — то, что видно между модулями. Та же грамматика, что у
   корпусов (03a-hull-maker): ГЛАВТРАССА — плиты, красная полоса и номер по
   трафарету; Компания — белое и лента логотипа; Орднунг — серая сталь и чёрные
   рёбра с номерами; Коммуна — длинные дуги и тёплая лента окон; Рассвет —
   лоскуты, каждая сторона своей краской, солнце от руки; Хай-Фронт — белое,
   пусто, одна красная точка и свет из-под обшивки. Рисуется в выпечку станции
   (stationArt), в кадре не стоит ничего. */
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
