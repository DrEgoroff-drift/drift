/* ══════════════ GPU-холст: запись команд и громкие дыры (08ca, docs/DESIGN-gpu.md «GPU canvas») ══════════════
   Запись не требует видеокарты, поэтому набор живёт и под Node: разбор цвета, путь и
   штрих — в треугольники, клип и смешения — в команды. Чего холст не умеет, бросает
   «GPU-холст: нет …» — печь, что попросит лишнего, краснеет, а не рисует молча дыру.
   Без устройства gpuBake отдаёт null: 2D-пути у выпечек нет. */
suite("GPU-холст: запись, цвет, дыры громко",()=>{
  resetWorld();
  eq(gcColor("#fff").join(),"1,1,1,1","#fff");
  eq(gcColor("rgba(22,25,31,.5)").map(v=>Math.round(v*255)).join(),"22,25,31,128","rgba()");
  eq(gcColor("hsl(120,100%,50%)").map(v=>Math.round(v*255)).join(),"0,255,0,255","hsl()");
  eq(gcColor("transparent")[3],0,"transparent");
  let e="";try{gcColor("ничто");}catch(x){e=x.message;}
  ok(/GPU-холст: нет/.test(e),"неразобранный цвет — громко: "+e);
  const g=new GcCtx(64,64,1);
  g.translate(32,32);g.scale(2,2);
  g.beginPath();g.moveTo(-10,-10);g.lineTo(10,-10);g.lineTo(0,10);g.closePath();g.fill();
  eq(g._ops.length,1,"заливка — одна команда");
  eq(g._ops[0].v.length,6,"треугольник — один треугольник веера");
  eq(g._ops[0].v.slice(0,2).join(),"12,12","точка пути — в пикселях выпечки (преобразование при построении)");
  g.lineWidth=2;g.lineJoin="miter";g.stroke();
  ok(g._ops[1].t==="s"&&g._ops[1].v.length>=6*3*2,"штрих замкнутого пути: отрезки и стыки");
  g.lineWidth=0;eq(g.lineWidth,2,"lineWidth=0 не принимается, как у 2D");
  g.save();g.beginPath();g.arc(0,0,8,0,Math.PI*2);g.clip();const c1=g._clip;g.restore();
  eq(c1.length,1,"клип в состоянии");eq(g._clip.length,0,"restore снимает клип");
  const n0=g._ops.length;g.globalCompositeOperation="source-atop";g.fillStyle="#f00";g.fillRect(0,0,4,4);
  eq(g._ops[n0].op,"source-atop","смешение записано");
  g.globalCompositeOperation="source-over";g.globalAlpha=.5;g.clearRect(0,0,64,64);
  eq(g._ops[n0+1].op,"destination-out","clearRect — вычитание");eq(g._ops[n0+1].p.c[3],1,"clearRect не знает globalAlpha");
  const gr=g.createRadialGradient(0,0,0,0,0,10);gr.addColorStop(0,"#fff");gr.addColorStop(1,"rgba(255,255,255,0)");
  g.fillStyle=gr;g.fillRect(-10,-10,20,20);eq(g._ops[n0+2].p.k,2,"радиальный градиент — краска");
  const rp=gr.ramp();eq(rp[3],1,"лента: начало непрозрачно");eq(rp[1023],0,"лента: конец прозрачен");
  const loud=[["getImageData",()=>g.getImageData(0,0,1,1)],["fillText",()=>g.fillText("а",0,0)],
    ["createPattern",()=>g.createPattern(null,"repeat")],
    ["overlay",()=>{g.globalCompositeOperation="overlay";g.fillRect(0,0,1,1);}],
    ["тень",()=>{g.globalCompositeOperation="source-over";g.shadowBlur=4;g.shadowColor="#000";g.fillRect(0,0,1,1);}]];
  for(const [n,f] of loud){let m="";try{f();}catch(x){m=x.message;}ok(/^GPU-холст: нет/.test(m),n+" — громкий сбой ("+(m||"молча")+")");}
  if(!GPU.dev)eq(gpuBake(8,8,()=>{}),null,"без видеокарты выпечки нет — null, не 2D");
  else{const B=gpuBake(8,8,q=>{q.fillStyle="#fff";q.fillRect(0,0,8,8);});ok(B&&B.view&&B.w===8,"выпечка с видеокартой — текстура");gpuBakeDrop(B);}
});
