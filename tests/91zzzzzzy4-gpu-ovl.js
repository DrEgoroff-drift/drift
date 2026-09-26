/* ══════════════ слой #ovl: фишки у кромки и подписи мира на видеокарте (08bi, docs/DESIGN-gpu.md §G) ══════════════
   Атлас масок вытесняет слой, которого дольше всех не касались (LRU по кадру); 600 кадров ровного
   полёта — ни одной строки в растр после разгона; пустой слой спрятан; подпись, которой нет 600 кадров,
   забыта. Ворота «0 вызовов 2D» у слоя — в 91zzzzzzy3 */
TEST_SUITES.push(()=>suite("слой #ovl: атлас LRU, 600 кадров без растра, пустой спрятан",{tier:"browser"},()=>{
  if(!ok(GPU.ok&&!!GPU.dev,"видеокарта есть"))return;
  /* LRU: свой атлас на время проверки, 4 слоя по 4 маски 500² */
  const A0=OVL.A,f0=OVL.fno,A=OVL.A={dev:null,tex:null,view:null,L:4,S:1024,pg:[],map:new Map(),cur:0,ev:0,thr:0};
  try{
    const mk=()=>({w:500,h:500,ox:0,oy:0,a:new Uint8Array(250000)}),add=k=>ovAtlas(k,mk);
    for(let l=0;l<4;l++){OVL.fno=100+l;for(let j=0;j<4;j++)add("k"+(l*4+j));}
    eq(A.pg.map(p=>p.keys.length).join(),"4,4,4,4","16 масок легли по четыре на слой");
    OVL.fno=104;add("k0");eq(A.ev,0,"касание готовой маски не растрит и не вытесняет");
    add("k16");
    ok(A.map.has("k0")&&!A.map.has("k4")&&A.map.has("k8"),"вытеснен слой, которого дольше всех не касались (второй), а не первый, тронутый только что");
    eq(A.ev+"/"+A.thr,"1/0","одно вытеснение, без трёпки в кадре");
  }finally{if(A.tex)GPU.trash.push(A.tex);OVL.A=A0;OVL.fno=f0;}
  /* 600 кадров ровного полёта: подписи и фишки в кадре, строк в растр — только в разгоне */
  resetWorld();G.mode="system";
  const st=gate2dChips();if(!ok(!!st,"сцена с фишкой и подписью нашлась"))return;
  /* растр после разгона честен только в кадре, где на слое появился новый текст (луна въехала в кадр,
     число сменилось); строка, которую уже растрили, второй раз не растрится */
  const run0=G.running,loop0=LOOP_OFF,at0=ovAtlas,late=[],made=new Set(),texts=new Set();
  G.running=true;LOOP_OFF=false;let t=wallMs(),seen=0,i=0,dup=0,fresh=false;
  window.ovAtlas=function(k,mk){if(!OVL.A.map.has(k)){if(made.has(k))dup++;made.add(k);if(i>=30)late.push(i);}return at0(k,mk);};
  try{
    const bad=[];
    for(i=0;i<600;i++){gate2dChips();const n0=late.length;frameBody(t+=16.7);
      fresh=false;for(const M of [OVL.lab,OVL.chip])for(const e of M.values())if(e.on&&!texts.has(e.s)){texts.add(e.s);fresh=true;}
      if(late.length>n0&&!fresh)bad.push(i);
      if(OVL.on&&OVL.nl>0&&[...OVL.chip.values()].some(e=>e.on))seen++;}
    window.ovAtlas=at0;
    eq(dup,0,"600 кадров — ни одна строка не растрилась дважды");
    eq(bad.length,0,"после разгона растр только в кадре с новым текстом ("+late.length+" строк за "+texts.size+" текстов)"+(bad.length?": кадры "+bad.slice(0,5).join(","):""));
    ok(seen>=570,"слой горел с подписями и фишками ("+seen+" из 600)");
    const keys=[...OVL.lab.keys()];
    /* мир без подписей и фишек (чистый кадр заглавной) — слой спрятан; 600 кадров — подписи забыты */
    G.running=false;for(let i=0;i<3;i++)frameBody(t+=16.7);
    ok(!OVL.on&&OVL.cv&&OVL.cv.style.display==="none","пустой слой спрятан (display:none — композитор его не сводит)");
    const f1=OVL.fno+601;OVL.fno=f1;frameBody(t+=16.7);
    ok(OVL.fno>f1&&keys.length>0&&keys.every(k=>!OVL.lab.has(k)),"подпись, которой не было 600 кадров, забыта ("+keys.length+")");
  }finally{window.ovAtlas=at0;G.running=run0;LOOP_OFF=loop0;resetWorld();}
}));
/* фишка скользит вдоль кромки дробно: рамка и текст снапятся от одного начала (рамка — X в пикселях устройства,
   текст — X плюс постоянный отступ, одно округление), и текст в рамке не дрожит на полпикселя */
TEST_SUITES.push(()=>suite("слой #ovl: текст фишки не дрожит в рамке при скольжении по 0.1 px",{tier:"browser"},()=>{
  if(!ok(GPU.ok&&!!GPU.dev,"видеокарта есть"))return;
  const Q=OVL.cq,q0=Q.slice(),dx=new Set(),dy=new Set(),on0=GPU.on;let n=0;
  try{GPU.on=true;
    for(const U of [1,1.37,1.75])for(const onR of [false,true])for(let i=0;i<=20;i++){
      Q.length=0;chipDom("tj",100+i*.1,40+i*.07,120,22,1,"#6cc","ЗВЕЗДА · 2770",onR,.3,U);
      /* 5 прямоугольников рамки, дальше глифы; первый глиф против угла рамки */
      if(Q.length<6*OVL_N||Q[5*OVL_N+8]!==1)continue;n++;
      dx.add(U+"|"+onR+"|"+(Q[5*OVL_N]-Q[0]).toFixed(3));dy.add(U+"|"+onR+"|"+(Q[5*OVL_N+1]-Q[1]).toFixed(3));
    }
  }finally{Q.length=0;Q.push(...q0);GPU.on=on0;}
  eq(n,126,"126 положений фишки с текстом");
  eq(dx.size+"/"+dy.size,"6/6","по каждому масштабу и стороне — один сдвиг текста от рамки (x/y)");
}));
/* треугольник (вид 2) обоими обходами: шейдер кладёт знак обхода внутрь каждого ребра — обратный
   обход прежде заливал всю рамку (радар кабины пояса, 26.09) */
TEST_SUITES.push(()=>suite("слой #ovl: треугольник обратного обхода — треугольник, а не рамка",{tier:"browser"},()=>{
  if(!ok(GPU.ok&&!!GPU.dev,"видеокарта есть"))return;
  resetWorld();G.mode="system";
  const run0=G.running,loop0=LOOP_OFF,Y=60,L=80,xs=[40,200],px={};
  try{
    G.running=true;LOOP_OFF=false;
    frameBody(wallMs());if(!ok(!!ovCanvas(),"слой #ovl есть"))return;
    /* прямой угол слева сверху: (x,Y),(x+L,Y),(x,Y+L) — второй тот же, вершины в обратном порядке */
    for(const [i,x] of xs.entries()){const a=[x,Y],b=[x+L,Y],c=[x,Y+L],t=i?[...a,...c,...b]:[...a,...b,...c];
      ovPush(OVL.uq,x,Y,x+L,Y+L,[1,1,1,1],2,0,0,0,t);}
    frameBody(wallMs());
    const cv=document.createElement("canvas");cv.width=OVL.cv.width;cv.height=OVL.cv.height;
    const g=cv.getContext("2d",{willReadFrequently:true});g.drawImage(OVL.cv,0,0);
    const A=(x,y)=>g.getImageData(x,y,1,1).data[3];
    for(const x of xs)px[x]=[A(x+15,Y+15),A(x+L-12,Y+L-12)];
  }finally{G.running=run0;LOOP_OFF=loop0;resetWorld();}
  for(const [i,x] of xs.entries()){const [inn,out]=px[x],w=i?"обратный":"прямой";
    ok(inn>200,w+" обход: внутри залито (альфа "+inn+")");
    eq(out,0,w+" обход: за гипотенузой, в рамке — пусто");}
}));
/* вид интерфейса (uq, 08bi): картинка/график/капсула/эллипс — числа очереди в пикселях устройства,
   прогоны по мастеру, точки графиков отдельно; без видеокарты сброс очереди и слой спрятан */
TEST_SUITES.push(()=>suite("слой #ovl: виды интерфейса — картинка, график, капсула, эллипс",()=>{
  const Q=OVL.uq,s=ovNd(),B1={tex:{},view:{},dev:GPU.dev},B2={tex:{},view:{},dev:GPU.dev};
  Q.length=OVL.ur.length=OVL.gd.length=0;
  try{
    ovRect(10,20,30,40,"#ff0000",.5);
    ovImage(B1,50,60,20,10,.3,0,0,.5,1,.8);ovImage(B1,70,60,20,10,0,.5,0,1,1);ovImage(B2,90,60,8,8,0,0,0,1,1,[1,.5,0,1]);
    ovGraph(0,100,200,150,5,2,[110,120,130],1.4,"#3a2c14");
    ovCap(10,10,40,10,3,"#fff");ovEll(80,80,12,6,0,"#00ff00",1);ovEll(80,80,12,6,2,"#00ff00",1);
    const at=i=>Q.slice(i*OVL_N,(i+1)*OVL_N);
    eq(Q.length,8*OVL_N,"восемь примитивов по "+OVL_N+" чисел");
    eq(at(0).slice(0,8).map(v=>+v.toFixed(3)).join(),[10*s,20*s,30*s,40*s,.5,0,0,.5].map(v=>+v.toFixed(3)).join(),"прямоугольник: рамка ×плотность, цвет premultiplied");
    const I=at(1);eq([I[8],I[9],I[12]/s,I[13]/s,I[14]/s,I[15]/s,I[16],I[19],I[4]].map(v=>+v.toFixed(3)).join(),"3,0.3,50,60,10,5,0,1,0.8","картинка: вид 3, поворот, центр, полуразмер, кусок, прозрачность");
    eq(OVL.ur.map(r=>r[0]+":"+(r[1]===B1?1:2)).join(),"1:1,3:2","два прогона: мастер меняется — новый прогон, тот же — нет");
    const Gr=at(4);eq([Gr[8],Gr[10],Gr[11]].join(),"4,0,3","график: вид 4, точки с 0, их 3");
    eq(OVL.gd.map(v=>+(v/s).toFixed(3)).join(),"110,120,130","точки графика в очереди данных");
    ok(Math.abs(Gr[9]-.7*s)<1e-6&&Math.abs(Gr[12]-5*s)<1e-6&&Math.abs(Gr[13]-2*s)<1e-6,"полутолщина, начало и шаг — ×плотность");
    const C=at(5);eq([C[8],+(C[0]/s).toFixed(3),+(C[2]/s).toFixed(3),+(C[16]/s).toFixed(3)].join(),"5,8.5,41.5,1.5","капсула: рамка с полутолщиной, t1.x — полутолщина");
    const E0=at(6),E1=at(7);eq([E0[8],E0[17],E1[17],+(E1[16]/s).toFixed(3)].join(),"6,1,0,1","эллипс: заливка (t1.y=1) и обвод (полутолщина 1)");
    ovGraph(0,0,1,1,0,1,[5],1,"#fff");eq(Q.length,8*OVL_N,"график из одной точки не ставится");
    ovImage(null,0,0,1,1,0,0,0,1,1);eq(Q.length,8*OVL_N,"картинка без мастера не ставится");
    const e0=GPU.enc;GPU.enc=null;
    try{ovFlush();}finally{GPU.enc=e0;}
    eq([Q.length,OVL.ur.length,OVL.gd.length,OVL.on].join(),"0,0,0,false","кадр без прохода: очереди сброшены, слой не зажжён");
  }finally{Q.length=OVL.ur.length=OVL.gd.length=0;}
}));
