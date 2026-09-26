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

/* multiply (08ca) — два вызова: mul1 и «multiply». Счёт смешения по таблицам, как его делает видеокарта
   (премультиплицированные цвета), против формулы 2D: Cs·Cb + Cs(1−ab) + Cb(1−as), альфа as + ab − as·ab.
   Одно смешение верно только на непрозрачном приёмнике (на прозрачном чернило до 248 из 255) */
suite("GPU-холст: multiply на прозрачном — два вызова",()=>{
  const fv=(f,S,D,i)=>({"zero":0,"one":1,"src":S[i],"dst":D[i],"src-alpha":S[3],"dst-alpha":D[3],"one-minus-src-alpha":1-S[3],"one-minus-dst-alpha":1-D[3],"one-minus-src":1-S[i]})[f];
  const bl=(G,S,D)=>[0,1,2,3].map(i=>{const t=i<3?G.c:G.a;return S[i]*fv(t[0],S,D,i)+D[i]*fv(t[1],S,D,i);});
  let mx=0,n=0;
  for(const as of [0,.3,.8,1])for(const ab of [0,.25,.5,1])for(const [cs,cb] of [[.9,.2],[.4,.7],[1,1]]){
    const S=[cs*as,cs*.5*as,0,as],D=[cb*ab,0,cb*.8*ab,ab],M=bl(GC_OPS.multiply,S,bl(GC_OPX.mul1,S,D));
    const W=[0,1,2].map(i=>S[i]*D[i]+S[i]*(1-ab)+D[i]*(1-as)).concat(as+ab-as*ab);
    for(let i=0;i<4;i++)mx=Math.max(mx,Math.abs(M[i]-W[i]));n++;}
  ok(mx<1e-9,"mul1 затем multiply — формула 2D на "+n+" сочетаниях, ошибка "+mx);
  eq(GC_ST.cvk.wm,0,"первый вызов трафарет не чистит (иначе второй не нарисует ничего)");
});

/* серии тени и пул целей (08ca/08cc): подряд идущие тени без пересечений — один слой, пересечение
   режет серию; повторная выпечка не создаёт ни одной текстуры; пул живёт в GPU.lay и уходит с ним
   (gpuInit после потери устройства заводит GPU.lay заново — и пул, и атлас берутся новые) */
/* острый стык по правилу 2D: острие, если длина острия / ширина ≤ miterLimit, иначе срез; и направление у дуги —
   касательная, а не хорда (крюк 03a: lineTo, потом arc назад — у GPU-2 на hbake_x2 был светлый шип наружу) */
suite("GPU-холст: острый стык — miterLimit как в 2D, у дуги касательная",()=>{
  resetWorld();
  /* ломаная с внутренним углом φ, вершина в (0,0), биссектриса наружу — вдоль −x; ширина 2 (hw 1) */
  const reach=(phi,ml)=>{const g=new GcCtx(64,64,1),h=phi/2;g.lineWidth=2;g.lineJoin="miter";g.miterLimit=ml;
    g.beginPath();g.moveTo(20*Math.cos(h),-20*Math.sin(h));g.lineTo(0,0);g.lineTo(20*Math.cos(h),20*Math.sin(h));g.stroke();
    const v=g._ops[0].v;let m=0;for(let i=0;i<v.length;i+=2)m=Math.max(m,-v[i]);return m;};
  for(const ml of [10,2])for(const deg of [5,15,30,90]){
    const phi=deg*Math.PI/180,r=1/Math.sin(phi/2),want=r<=ml?r:Math.sin(phi/2);
    near(reach(phi,ml),want,1e-6,deg+"° при miterLimit "+ml+": "+(r<=ml?"острие "+r.toFixed(2):"срез"));
  }
  /* крюк: отрезок влево, дальше дуга радиуса 1.5 px назад — поворот ровно 180°, у 2D срез, наружу ни пикселя */
  const g=new GcCtx(64,64,1);g.lineWidth=.6;g.lineJoin="miter";
  g.beginPath();g.moveTo(10,0);g.lineTo(0,0);g.arc(0,1.5,1.5,-Math.PI/2,Math.PI*.9);g.stroke();
  /* левее x=0 дуга только внизу (y > 1.9); всё, что левее выше y=1, — острие стыка. Штрих тоньше пикселя
     рисуется шириной 1 px (hw .5) с долей альфы */
  const v=g._ops[0].v;let mx=0;for(let i=0;i<v.length;i+=2)if(v[i+1]<1)mx=Math.max(mx,-v[i]);
  ok(mx<=.5+1e-6,"крюк: у начала дуги наружу не дальше полуширины ("+mx.toFixed(3)+" ≤ 0.5)");
});
TEST_SUITES.push(()=>suite("GPU-холст: серии тени, пул целей, сброс с устройством",{tier:"browser"},()=>{
  if(!GPU.dev){eq(gpuBake(8,8,()=>{}),null,"без видеокарты выпечки нет");return;}
  const sq=(g,x,y,b)=>{g.shadowBlur=b;g.shadowColor="rgba(0,0,0,.8)";g.fillStyle="#fff";g.fillRect(x,y,8,8);};
  const bake=f=>{const B=gpuBake(64,32,f);const n=B.shl;gpuBakeDrop(B);return n;};
  eq(bake(g=>{sq(g,4,4,2);sq(g,40,4,2);}),1,"две далёкие тени — одна серия");
  eq(bake(g=>{sq(g,4,4,2);sq(g,8,8,2);}),2,"тень поверх прошлой фигуры — серия режется");
  eq(bake(g=>{sq(g,4,4,2);g.shadowBlur=0;g.fillStyle="#f00";g.fillRect(36,0,20,20);sq(g,40,4,2);}),2,"нарисованное без тени под следом следующей — режет");
  eq(bake(g=>{sq(g,4,4,2);sq(g,40,4,3);}),2,"другое размытие — другая серия");
  const Q=gcPool(),m0=Q.made;bake(g=>{sq(g,4,4,2);sq(g,40,4,2);});
  eq(Q.made,m0,"повторная выпечка — ни одной новой текстуры и буфера");
  const lay=GPU.lay;GPU.lay={};let Q2=null;
  try{bake(g=>{sq(g,4,4,2);});Q2=GPU.lay["gc.pool"];}
  finally{if(Q2){for(const e of Q2.t)GPU.trash.push(...e.T);for(const b of Object.values(Q2.b))GPU.trash.push(b);}GPU.lay=lay;}
  ok(Q2&&Q2!==Q&&Q2.made>0,"новый GPU.lay (как после потери устройства) — новый пул, прогретый заново");
  eq(GPU.lay["gc.pool"],Q,"старый пул на месте, пока жив GPU.lay");
  /* а4: выпечка гостиницы 500×340 при ss 2 (1000×680) — набор 1024² из прогрева пула, не разовый великан.
     Меряется на свежем пуле: старый к этому набору прожит соседями по странице, и потолок мог вытеснить прогретое */
  GPU.lay={};let Q3=null;
  try{Q3=gcPool();const dot=g=>{g.fillStyle="#fff";g.fillRect(0,0,9,9);};
    gpuBakeDrop(gpuBake(16,16,dot,{mips:false}));   /* буферы пула (gcPoolBuf) рождаются первой выпечкой — считаем цели, не их */
    const m1=Q3.made;gpuBakeDrop(gpuBake(500,340,dot,{ss:2,mips:false}));
    eq(Q3.made-m1,0,"выпечка 1000×680 — из прогретого набора 1024², новых целей нет");
    const m2=Q3.made;gcPoolSet("shadow",448,64);
    eq(Q3.made-m2,0,"атлас тени 448×64 (родился посреди полёта на S23 cold3) — из прогретого набора 512×128");}
  finally{if(Q3){for(const e of Q3.t)GPU.trash.push(...e.T);for(const b of Object.values(Q3.b))GPU.trash.push(b);}GPU.lay=lay;}
  /* бюджет видеокарты prebake: выпечка — одна на кадр, любая (у каждой свой submit, ворота ступени 1, 26.09);
     шаги без выпечки (раскладка, расчёт) идут пачкой */
  const steps=(w,h,bake)=>{let n=0;const key="t|px"+w+bake;prebakeDrop(key);PB_F=-2;
    prebake(key,function*(){for(let i=0;i<4;i++){if(bake)gpuBakeDrop(gpuBake(w,h,g=>{g.fillRect(0,0,4,4);},{ss:2,mips:false}));n++;yield;}},false);
    prebakeDrop(key);return n;};
  eq(steps(500,340,true),1,"четыре выпечки 1000×680 — одна за кадр (PB_PX)");
  eq(steps(64,64,true),1,"четыре мелкие выпечки 128² — тоже одна за кадр (GPU.bakeN)");
  ok(steps(64,64,false)>1,"шаги без выпечки — несколько за кадр");
}));
/* материал корпуса (08cd): у всех, кого освещает звезда, — рельеф и маски в одной текстуре вдвое шире;
   сброс выпечки уносит и его (иначе видеопамять течёт по полтекстуры на корпус) */
TEST_SUITES.push(()=>suite("материал корпуса: пираты, баржи, свои — рельеф и маски, сброс вместе",{tier:"browser"},()=>{
  if(!GPU.dev){eq(gpuBake(8,8,()=>{},{mat:2}),null,"без видеокарты выпечки нет");return;}
  const pa=pirateArtOf(pirateShipId(4242),false,false,2,0),ba=bargeArtOf({seed:991,by:"gt"});
  for(const [n,B] of [["пират",pa.cn],["баржа",ba.cn]]){
    ok(B&&B.mat&&B.mat.tex,n+": материал запечён");
    eq(B.mat.tex.width,2*Math.max(1,B.w>>1),n+": две половины — рельеф и маски");
    eq(B.mat.tex.format,"rgba16float",n+": материал в половинной точности");}
  const B=gpuBake(64,64,g=>{g.fillStyle="#888";g.fillRect(8,8,48,48);g.fillStyle="#fb4";g.fillRect(30,30,4,4);},{mat:2});
  const T=B.mat.tex,t0=GPU.trash.length;gpuBakeDrop(B);
  ok(B.mat===null&&GPU.trash.slice(t0).includes(T),"сброс выпечки отдаёт в мусор и материал");
  const B2=gpuBake(64,64,()=>{});eq(B2.mat,undefined,"без o.mat материала нет");gpuBakeDrop(B2);
}));
/* WGSL: smoothstep с edge0 > edge1 не определён (Metal, iOS Safari: ревью облачного флота 26.09) — в Chrome
   он считает «наоборот», на Metal может дать что угодно. Обратный спад пишется 1.-smoothstep(b,a,x) */
suite("шейдеры: у smoothstep нет перевёрнутых рёбер",()=>{
  let src="";try{src=document.scripts[0].textContent.split("TEST_SUITES")[0];}catch(e){}
  if(!ok(src.length>100000,"исходник игры прочитан"))return;
  const bad=[],re=/smoothstep\(\s*(-?(?:\d+\.?\d*|\.\d+))\s*,\s*(-?(?:\d+\.?\d*|\.\d+))\s*,/g;let m,n=0;
  while((m=re.exec(src))){n++;if(+m[1]>+m[2])bad.push(m[0]+" …"+src.slice(Math.max(0,m.index-40),m.index).replace(/\s+/g," "));}
  ok(n>20,"вызовы с числовыми рёбрами найдены ("+n+")");
  eq(bad.slice(0,6).join(" | "),"","smoothstep(a,b,x) при a>b — писать 1.-smoothstep(b,a,x)");
});
/* огни городов (17ga gplCities, ревью №10): окна широт — из кэша по (планета, огонь, оборот окна,
   сторона звезды в 1/1024 оборота). На сторонах из этой сетки огни те же, что у прежнего поиска
   на каждом кадре; второй кадр того же оборота окна не пересчитывает */
suite("огни городов: окна широт из кэша — те же города, поиск раз на оборот",()=>{
  const ref=(o,a)=>{const n=Math.min(48,o.lights|0);
    const l=Math.hypot(o.sx,o.sy)||1,ax=-o.sx/l,ay=-o.sy/l;
    const reg=(x,y)=>{const rr=Math.hypot(x,y);if(rr<.3||rr>.9)return 0;
      return gss(.3,.4,rr)*(1-gss(.8,.9,rr))*gss(.2,.45,(x*ax+y*ay)/rr);};
    const T=o.T||0,sd=(o.seed|0)*131+7;let k=0;
    for(let j=0;j<n;j++){const P=ghf(sd,j,77)+T*TAU/GPL_CITY_D,e=Math.floor(P),ph=P-e;
      for(let tr=0;tr<32;tr++){const y0=ghf(sd+j*977,e,tr)*1.7-.85,c=Math.sqrt(1-y0*y0);
        let best=0,r0=null,la=0,lb=0;
        for(let s=0;s<=40;s++){const L=-1.45+2.9*s/40;
          if(reg(c*Math.sin(L),y0)>.5){if(r0===null)r0=L;if(L-r0>best){best=L-r0;la=r0;lb=L;}}else r0=null;}
        if(best<GPL_CITY_D)continue;
        const lam=(la+lb)/2+(.5-ph)*GPL_CITY_D;if(Math.abs(lam)>1.5)continue;
        const x=c*Math.sin(lam),w=gss(0,.08,ph)*(1-gss(.92,1,ph))*reg(x,y0)*(.8+.2*ghf(sd,j,5));
        if(w>.02){a[64+k*4]=x;a[65+k*4]=y0;a[66+k*4]=w;k++;}
        break;}}
    return k;};
  let same=0,tot=0,lit=0;const diff=[];
  for(let t=0;t<40;t++){const qa=(t*97+5)%1024,g=qa*TAU/1024;
    const o={lights:48,wet:0,strip:null,sx:-Math.cos(g),sy:-Math.sin(g),T:t*.37,seed:11+t};
    const a1=new Float32Array(256),a2=new Float32Array(256),k1=gplCities(o,a1),k2=ref(o,a2);tot++;lit+=k1;
    if(k1===k2&&a1.every((v,i)=>Math.abs(v-a2[i])<1e-5))same++;else if(diff.length<3)diff.push(qa+":"+k1+"/"+k2);}
  eq(same,tot,"те же огни, что у поиска на каждом кадре"+(diff.length?": "+diff.join(" "):""));
  ok(lit>40*4,"огни горят: "+lit+" на 40 планет");
  /* второй кадр: чуть другая сторона в той же ячейке, тот же оборот — окна те же массивы */
  const o={lights:48,wet:0,strip:null,sx:-1,sy:0,T:1.234,seed:5},a=new Float32Array(256);
  gplCities(o,a);const C=GPL_WIN.get(5*131+7),w0=C.w.slice(),n0=C.w.reduce((s,w)=>s+w.length,0);
  gplCities(Object.assign({},o,{sy:.0005}),a);
  ok(GPL_WIN.get(5*131+7)===C&&C.w.every((w,j)=>w===w0[j]),"сторона в той же ячейке — окна из кэша");
  eq(C.w.reduce((s,w)=>s+w.length,0),n0,"и новых поисков нет");
  let many=0;for(let i=0;i<40;i++)gplCities(Object.assign({},o,{seed:100+i}),a),many=GPL_WIN.size;
  ok(many<=16,"кэш держит не больше 16 планет: "+many);
});
