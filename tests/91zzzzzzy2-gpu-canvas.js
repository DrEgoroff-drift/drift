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
  /* текст (v2): маска строки из атласа, метрики — ровно 2D; без видеокарты — громко */
  g.globalAlpha=1;g.fillStyle="#fff";g.font="bold 12px ui-monospace, monospace";const n1=g._ops.length;
  if(GPU.dev){g.save();g.rotate(.3);g.fillText("Дрейф",1.3,20.6);g.restore();const q=g._ops[n1];eq(q.t,"x","fillText — маска из атласа");ok(q.near&&q.v[0]===Math.floor(q.v[0]),"под поворотом — тоже пиксель в пиксель: поворот растрит сам источник");
    g.setTransform(1,0,0,1,0,0);g.fillText("Дрейф",1.3,20.6);const r=g._ops[n1+1];ok(r.near&&r.v[0]===Math.floor(r.v[0]),"прямой масштаб — маска пиксель в пиксель");
    const c2=document.createElement("canvas").getContext("2d");c2.font=g.font;
    eq(g.measureText("Дрейф").width,c2.measureText("Дрейф").width,"measureText — ширина 2D");
    eq(g.measureText("Дрейф").actualBoundingBoxAscent,c2.measureText("Дрейф").actualBoundingBoxAscent,"measureText — подъём 2D");
    g.fillText("x",0,0,0);eq(g._ops.length,n1+2,"maxWidth 0 — ничего, как 2D");}
  else{let m="";try{g.fillText("а",0,0);}catch(x){m=x.message;}ok(/^GPU-холст: нет/.test(m),"текст без видеокарты — громко ("+(m||"молча")+")");}
  const loud=[["getImageData",()=>g.getImageData(0,0,1,1)],["шрифт без px",()=>{g.font="1em serif";g.measureText("а");}],
    ["createPattern",()=>g.createPattern(null,"repeat")],
    ["overlay",()=>{g.globalCompositeOperation="overlay";g.fillRect(0,0,1,1);}],
    ["тень у copy",()=>{g.globalCompositeOperation="copy";g.shadowBlur=4;g.shadowColor="#000";g.fillRect(0,0,1,1);}]];
  for(const [n,f] of loud){let m="";try{f();}catch(x){m=x.message;}ok(/^GPU-холст: нет/.test(m),n+" — громкий сбой ("+(m||"молча")+")");}
  /* тень (v2): цвет тени премультиплицирован, без globalAlpha; невидимая — не пишется */
  g.globalCompositeOperation="source-over";g.globalAlpha=.5;g.shadowBlur=6;g.shadowOffsetX=2;g.shadowColor="rgba(255,0,0,.5)";g.fillStyle="#fff";
  const n2=g._ops.length;g.fillRect(0,0,4,4);const sh=g._ops[n2].sh;
  ok(sh&&sh.b===6&&sh.x===2&&sh.c.join()==="0.5,0,0,0.5","тень записана: размытие, сдвиг, цвет");
  g.shadowColor="rgba(0,0,0,0)";g.fillRect(0,0,4,4);eq(g._ops[n2+1].sh,null,"прозрачная тень — нет тени");
  g.shadowColor="#000";g.clearRect(0,0,4,4);eq(g._ops[n2+2].sh,null,"clearRect без тени, как 2D");
  if(!GPU.dev)eq(gpuBake(8,8,()=>{}),null,"без видеокарты выпечки нет — null, не 2D");
  else{const B=gpuBake(8,8,q=>{q.fillStyle="#fff";q.fillRect(0,0,8,8);});ok(B&&B.view&&B.w===8,"выпечка с видеокартой — текстура");gpuBakeDrop(B);}
});
