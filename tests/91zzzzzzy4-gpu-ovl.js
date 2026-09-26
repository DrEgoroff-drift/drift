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
/* каждая сцена стенда (рейд, пояс, база…): после разгона атлас масок не растрит ничего, кроме текста,
   которого на слое ещё не было. Число собирается из глифов цифр (ovText), так что смена числа новой
   маски не просит; строка, которая растрится каждым кадром, — это число, запечённое целиком. «Новый текст» —
   по скелету без цифр; подброшенная подпись со счётчиком кадров проверяет саму сборку числа */
const OV_STEADY=()=>{
  if(!ok(GPU.ok&&!!GPU.dev,"видеокарта есть"))return;
  const run0=G.running,loop0=LOOP_OFF,at0=ovAtlas,fl0=ovFlush,bad=[],sk=s=>s.replace(/[0-9]+/g,"0");let i=0,miss=[],n=0,pr=0;
  window.ovAtlas=function(k,mk){if(!OVL.A.map.has(k))miss.push(k);return at0(k,mk);};
  window.ovFlush=function(){domLabel("ovprobe",W/2,H/2,"ПРОБА "+(i*37%1000)+" · "+i,"9px ui-monospace,monospace","#fff","center");return fl0();};
  G.running=true;LOOP_OFF=false;let t=wallMs();
  try{
    for(const sc of lookScenes()){
      if(!T.go(sc.id))continue;n++;const texts=new Set();
      for(i=0;i<130;i++){miss=[];frameBody(t+=16.7);
        let fresh=false;for(const M of [OVL.lab,OVL.chip])for(const e of M.values())if(e.on&&!texts.has(sk(e.s))){texts.add(sk(e.s));fresh=true;}
        const e=OVL.lab.get("ovprobe");if(e&&e.on)pr++;
        if(i>=90&&miss.length&&!fresh)bad.push(sc.id+" · кадр "+i+": "+miss[miss.length-1].split("|").pop());}
    }
  }finally{window.ovAtlas=at0;window.ovFlush=fl0;G.running=run0;LOOP_OFF=loop0;resetWorld();}
  ok(n>=12,"сцены стенда поставились ("+n+")");
  ok(pr>=n*120,"подброшенная подпись со счётчиком горела ("+pr+" кадров из "+n*130+")");
  eq(bad.slice(0,4).join("; "),"","после 90 кадров разгона — ни одной новой маски без нового текста");
};
/* 15 сцен по 130 кадров — ~33 с: сеть перед релизом, не каждая правка */
TEST_SUITES.push(()=>suite("слой #ovl: устойчивый кадр любой сцены не растрит",{tier:"heavy"},OV_STEADY));
TEST_SUITES.push(()=>suite("слой #ovl: устойчивый кадр любой сцены не растрит (телефон)",{tier:"heavy",win:"phone"},OV_STEADY));
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
/* две цели в одном кадре (25c, Контроль (A) п. 4): проход #ovl и проход колодки — в одном кадровом
   энкодере, каждая очередь в свою текстуру. Порядок как в игре: мир (ovFlush) → hud() → колодка.
   Перепутанная цель стёрла бы #ovl колодкой, а сама колодка осталась бы прежней */
TEST_SUITES.push(()=>suite("слой #ovl и колодка: две цели в одном кадре, каждая своё",{tier:"browser",win:"wide"},()=>{
  if(!ok(GPU.ok&&!!GPU.dev,"видеокарта есть"))return;
  resetWorld();G.mode="system";
  const run0=G.running,loop0=LOOP_OFF,pod=document.getElementById("ipod");
  const grab=(cv,x,y,w,h)=>{const c=document.createElement("canvas");c.width=cv.width;c.height=cv.height;
    const g=c.getContext("2d",{willReadFrequently:true});g.drawImage(cv,0,0);return g.getImageData(x,y,w,h).data;};
  const inkOf=d=>{let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>8)n++;return n;};
  let subs=0;const sub0=GPUQueue.prototype.submit;
  try{
    G.running=true;LOOP_OFF=false;
    for(let i=0;i<30;i++)tapeSample();
    frameBody(wallMs());frameBody(wallMs());
    if(!ok(!!ovCanvas()&&IPOD.dev===GPU.dev,"оба холста живы: #ovl и колодка"))return;
    const nd=ovNd(),pw=pod.width,ph=pod.height,before=grab(pod,0,0,pw,ph);
    /* по ленте — новые столбцы: перья колодки обязаны сдвинуться */
    const Tp=tapeInit();
    for(let i=0;i<6;i++){tapeSample();const c=(Tp.head-1+TAPE_N)%TAPE_N;for(let k=0;k<TAPE_PENS;k++)Tp.col[c*TAPE_PENS+k]=(i+k)%2?250:5;}
    const n0=IPOD.n;
    GPUQueue.prototype.submit=function(){subs++;return sub0.apply(this,arguments);};
    ok(gpuManual(()=>{ovRect(20,20,60,60,"#fff");gpuWorld(0,false,false);instrPodDraw();}),"кадр с двумя целями собран");
    GPUQueue.prototype.submit=sub0;
    eq(IPOD.n,n0+1,"колодка — один проход в этом кадре");
    const sq=grab(OVL.cv,Math.round(40*nd),Math.round(40*nd),1,1)[3];
    ok(sq>200,"#ovl: свой квадрат на месте (альфа "+sq+")");
    /* где колодка рисовала бы, окажись её проход в текстуре #ovl: бумага и стрелки у левого верха */
    const leak=inkOf(grab(OVL.cv,0,Math.round(70*nd),Math.round(200*nd),Math.round(20*nd)));
    eq(leak,0,"#ovl: следов колодки нет");
    const after=grab(pod,0,0,pw,ph);let df=0;for(let i=0;i<after.length;i+=4)if(Math.abs(after[i+3]-before[i+3])>8)df++;
    ok(df>50,"колодка: перья сдвинулись в своей текстуре ("+df+" точек)");
    ok(inkOf(after)>pw*ph*.1,"колодка: мастер и перья на месте");
  }finally{GPUQueue.prototype.submit=sub0;G.running=run0;LOOP_OFF=loop0;resetWorld();}
  ok(subs>=1,"кадр отправлен ("+subs+" submit)");
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
/* бывший #hud (стики 15b) на #ovl: лента — четырёхугольник с градиентом прозрачности вдоль оси, шеврон — ломаная
   одним покрытием (стык не двоит альфу, как путь 2D), «СТОП» — дуга с круглыми концами */
TEST_SUITES.push(()=>suite("слой #ovl: четырёхугольник с градиентом, ломаная без двойного стыка, дуга",{tier:"browser"},()=>{
  if(!ok(GPU.ok&&!!GPU.dev,"видеокарта есть"))return;
  resetWorld();G.mode="system";
  const run0=G.running,loop0=LOOP_OFF;let v={};
  try{
    G.running=true;LOOP_OFF=false;
    frameBody(wallMs());if(!ok(!!ovCanvas(),"слой #ovl есть"))return;
    ovQuad(40,40,140,40,140,80,40,80,"#fff",1,1,0);   /* градиент от середины DA (x=40) к середине BC (x=140) */
    ovCap3(200,40,240,80,280,40,8,"#fff",.5);
    ovArc(360,70,30,-Math.PI/2,Math.PI,4,"#fff",1);  /* от верха по часовой на пол-оборота: правая половина */
    frameBody(wallMs());
    const nd=ovNd(),cv=document.createElement("canvas");cv.width=OVL.cv.width;cv.height=OVL.cv.height;
    const g=cv.getContext("2d",{willReadFrequently:true});g.drawImage(OVL.cv,0,0);
    const A=(x,y)=>g.getImageData(Math.round(x*nd),Math.round(y*nd),1,1).data[3];
    v={q0:A(50,60),qm:A(90,60),q1:A(130,60),qo:A(90,90),joint:A(240,79),mid:A(220,60),seg2:A(260,60),
       r:A(390,70),l:A(330,70),top:A(360,40),bot:A(360,100),lt:A(360-21,70-21)};
  }finally{G.running=run0;LOOP_OFF=loop0;resetWorld();}
  ok(v.q0>200&&v.q1<50,"градиент идёт вдоль оси: у начала "+v.q0+", у конца "+v.q1);
  ok(v.qm>105&&v.qm<150,"середина — половина прозрачности: "+v.qm);
  eq(v.qo,0,"за краем четырёхугольника пусто");
  ok(Math.abs(v.joint-v.mid)<=12,"стык ломаной той же альфы, что звено: "+v.joint+" против "+v.mid+" (двойной стык — ~190)");
  ok(v.seg2>100,"второе звено ломаной есть: "+v.seg2);
  ok(v.r>200&&v.top>100&&v.bot>100,"дуга: правая половина и оба круглых конца есть ("+v.r+", "+v.top+", "+v.bot+")");
  ok(v.l===0&&v.lt===0,"дуга: левой половины нет ("+v.l+", "+v.lt+")");
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
/* строка наблюдения (17 sysWatchLabel) встаёт над пэдами, пультом и подсказкой: на телефоне круг «Цель»
   ложился на её конец, на широком окне она лежала на приёмнике (26.09) */
for(const win of ["","phone"])TEST_SUITES.push(()=>suite("строка наблюдения не под пэдами, пультом и подсказкой"+(win?" (телефон)":""),
  Object.assign({tier:"browser"},win?{win}:{}),()=>{
  if(!ok(GPU.ok&&!!GPU.dev,"видеокарта есть"))return;
  resetWorld();G.mode="system";G.credits=100000;G.owned.obod=true;
  const c=genMerc(999,["mine"]);G.crew.push(Object.assign({},c,{cargo:{},order:{kind:"home",sx:0,sy:0},tMs:now(),paidMs:now()}));
  const m=G.crew[G.crew.length-1];crewAssignShip(m,"obod");crewOrder(m,"mine");G.watch=m.id;
  T.wait(2);rectsDirty();
  const q0=OVL.uq.length,led0=OVL.led;let f=null;OVL.led=()=>{};
  try{f=sysWatchLabel(allyOf(G.watch));}finally{OVL.led=led0;OVL.uq.length=q0;}
  const rc=cvsRect(),k=H/Math.max(1,rc.height);let n=0;
  for(const [nm,r] of [["пэды",padsRect()],["пульт",consoleRect()],["подсказка",promptEl()&&promptEl().textContent?promptRect():null]]){
    if(!r||!(r.height>0))continue;n++;
    const top=(r.top-rc.top)*k,x0=(r.left-rc.left)*k,x1=(r.right-rc.left)*k;
    ok(f.y1<=top||f.x1<=x0||f.x0>=x1,nm+": строка кончается на "+f.y1.toFixed(1)+", "+nm+" начинается на "+top.toFixed(1));}
  ok(n>0,"хоть один из трёх на экране: "+n);
  ok(f.y0>H*.5,"строка по-прежнему внизу кадра: "+f.y0.toFixed(0)+" из "+H);
  resetWorld();
}));
