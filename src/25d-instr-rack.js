/* ══════════════ приборная стойка: настоящие стрелочные приборы и самописец ══════════════
   Колодка (25c) отвечает на «сколько сейчас» одним взглядом, но она размером с
   спичечный коробок: шкал там нет, делений нет, лента — полоска. Стойка — это
   та же аппаратура, но раскрытая: игрок поворачивается к ней, когда хочет
   ЧИТАТЬ приборы, а не косить на них краем глаза.

   ЧТО ЭТО ЗА ВЕЩЬ. Не «ретрофутуристический интерфейс», а лабораторная и
   авиационная аппаратура шестидесятых, которую инженеры того времени собрали
   бы для дальнего корабля: матовый металл, утопленные корпуса, винты по углам,
   кремовые циферблаты под стеклом, тёплая подсветка, янтарные стрелки. Ничего
   неонового, ничего полупрозрачного.

   ЧТО ЗДЕСЬ ЧЕСТНО. Все восемь стрелок показывают настоящие величины игры:
   пять приборов области (25a) плюс топливо, корпус и трюм. Пять дорожек
   самописца — это те же пять приборов, записанные кольцом ленты (25b). Ни
   одного показания «для красоты» тут нет.

   ЧТО ЭТО ЛОМАЕТ, И ПОЧЕМУ. Правило 25a «цвет один на всю панель» и правило
   ленты «ни подписей, ни цвета» здесь отменены сознательно и по требованию: у
   дорожек появились цвет и подпись канала. Цвет тут не тревога и не подсказка —
   он различает пять перьев на одной бумаге, как на настоящем самописце.
   Тревожной подсветки по-прежнему нет нигде, и стойка по-прежнему ничего не
   говорит: ни звука, ни строки в журнал. */

const RACK_PAD=16;
/* пять каналов: цвета приглушённые, как краска старых пишущих узлов */
const RACK_CH=[
  {ru:"CH1 · ХРОНОМЕТР",   col:"#b8523f"},
  {ru:"CH2 · КУРСОГРАФ",   col:"#6f8f4e"},
  {ru:"CH3 · МАСС-ДЕТЕКТОР",col:"#4b7391"},
  {ru:"CH4 · ПРИЁМНИК",    col:"#c2913c"},
  {ru:"CH5 · АКТИНОМЕТР",  col:"#6b5f7e"}
];
/* восемь приборов. Диапазон и деления у каждого свои: одинаковые шкалы — первый
   признак нарисованной, а не измеряющей аппаратуры */
const RACK_G=[
  {id:"chrono",ru:"ХРОНОМЕТР",  unit:"С/СУТ", lo:0,  hi:2,    mid:5,sub:4,dig:2,
   read:R=>R[0].val},
  {id:"course",ru:"КУРСОГРАФ",  unit:"КМ",    lo:0,  hi:12,   mid:6,sub:5,dig:1,
   read:R=>R[1].val},
  {id:"mass",  ru:"МАСС-ДЕТЕКТОР",unit:"КТ",  lo:0,  hi:40,   mid:4,sub:5,dig:1,
   read:R=>R[2].val},
  {id:"radio", ru:"ПРИЁМНИК",   unit:"ДБ",    lo:0,  hi:40,   mid:4,sub:5,dig:1,
   read:R=>R[3].val},
  {id:"actino",ru:"АКТИНОМЕТР", unit:"ВТ",    lo:0,  hi:4000, mid:4,sub:5,dig:0,
   read:R=>R[4].val},
  {id:"fuel",  ru:"ТОПЛИВО",    unit:"%",     lo:0,  hi:100,  mid:5,sub:4,dig:0,
   read:()=>{const s=stat();return G.fuel/Math.max(1,s.fuelMax)*100;}},
  {id:"hull",  ru:"КОРПУС",     unit:"%",     lo:0,  hi:100,  mid:5,sub:4,dig:0,
   read:()=>{const s=stat();return G.hull/Math.max(1,s.hullMax)*100;}},
  {id:"hold",  ru:"ТРЮМ",       unit:"Т",     lo:0,  hi:1,    mid:4,sub:5,dig:1,
   read:()=>held()}
];
const RACK={key:"",jk:"",P:null,S:null,nd:1,w:0,h:0,geo:null,fade:0};
function rackOpen(){return !!(G.rack&&G.rack.on);}
function rackToggle(){
  if(!G.rack)G.rack={on:false};
  G.rack.on=!G.rack.on;
}
addEventListener("keydown",e=>{
  if(e.code==="KeyI"&&G.running&&!scrOpen()){
    rackToggle();e.preventDefault();
  }
});
/* ── геометрия ──
   Размер считается от экрана, но с потолком: стойка — вещь, у неё есть свои
   пропорции, и растягивать её на четыре тысячи пикселей незачем. */
function rackGeo(){
  const w=Math.min(W*.94,1180), h=Math.min(H*.66,470);
  const x=(W-w)/2, y=Math.min(14,H*.03);
  const gh=Math.round(h*.40);                 // верхняя секция: стрелки
  /* Справа от самописца — круглое окно «Глобуса» (25f): он не стрелка в общем
     ряду, он показывает МЕСТО, и потому стоит отдельно и своей формой. */
  const recH=h-gh-10-RACK_PAD;
  const gRad=Math.max(26,Math.min(recH*.42,88));
  const gBox=gRad*2+34;
  return {x,y,w,h,gh,
          rec:{x:RACK_PAD,y:gh+10,w:w-RACK_PAD*2-gBox,h:recH},
          glob:{cx:w-RACK_PAD-gBox/2+6,cy:gh+10+recH*.44,r:gRad}};
}
/* ── материалы ──
   Всё дорогое — металл, циферблаты, деления, сетка бумаги — печётся один раз в
   своё полотно и потом просто кладётся на кадр. */
function rackScrew(c,x,y,r){
  const g=c.createRadialGradient(x-r*.4,y-r*.4,r*.1,x,y,r);
  g.addColorStop(0,"#6b6f72");g.addColorStop(.6,"#3c4043");g.addColorStop(1,"#16191c");
  c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();
  c.strokeStyle="rgba(10,12,14,.85)";c.lineWidth=Math.max(1,r*.3);
  c.beginPath();c.moveTo(x-r*.62,y-r*.2);c.lineTo(x+r*.62,y+r*.2);c.stroke();
  c.strokeStyle="rgba(190,200,205,.16)";c.lineWidth=1;
  c.beginPath();c.arc(x,y,r,Math.PI*1.05,Math.PI*1.75);c.stroke();
}
/* зерно металла и бумаги: редкие точки, посеянные раз и навсегда */
function rackGrain(c,x,y,w,h,n,a,tone){
  const r=rng(0x9a37^(w|0)^((h|0)<<8));
  c.save();c.beginPath();c.rect(x,y,w,h);c.clip();
  for(let i=0;i<n;i++){
    const px=x+r()*w, py=y+r()*h, s=r()<.85?1:2;
    c.fillStyle=(r()<.5?tone[0]:tone[1])+(a*(.4+r()*.6)).toFixed(3)+")";
    c.fillRect(px,py,s,s);
  }
  c.restore();
}
/* циферблат: кремовое поле, деления, крупные значения, стекло сверху */
function rackDial(c,cx,cy,r,g){
  r=Math.max(1,r);                            // на нулевом полотне (стенд) радиус уходил в минус
  const A0=Math.PI*.78, A1=Math.PI*2.22;      // рабочий сектор шкалы
  /* утопленный корпус */
  c.save();
  const bez=c.createLinearGradient(cx,cy-r*1.5,cx,cy+r*1.5);
  bez.addColorStop(0,"#3a3d40");bez.addColorStop(.5,"#24272a");bez.addColorStop(1,"#141719");
  c.fillStyle=bez;
  c.beginPath();c.arc(cx,cy,r*1.22,0,TAU);c.fill();
  c.strokeStyle="rgba(8,10,12,.9)";c.lineWidth=2;c.stroke();
  /* поле шкалы: тёплое, подсвеченное снизу лампой прибора */
  const face=c.createRadialGradient(cx,cy+r*.35,r*.1,cx,cy,r*1.05);
  face.addColorStop(0,"#efe2c4");face.addColorStop(.62,"#d9c9a6");face.addColorStop(1,"#a8987c");
  c.fillStyle=face;
  c.beginPath();c.arc(cx,cy,r,0,TAU);c.fill();
  rackGrain(c,cx-r,cy-r,r*2,r*2,90,.10,["rgba(90,74,48,","rgba(255,246,222,"]);
  /* деления: крупные с цифрами, мелкие между ними */
  const N=g.mid, S=g.sub;
  for(let i=0;i<=N*S;i++){
    const t=i/(N*S), a=A0+(A1-A0)*t, big=i%S===0;
    const r1=r*.92, r2=r*(big?.74:.83);
    c.strokeStyle=big?"rgba(38,30,18,.92)":"rgba(58,48,32,.62)";
    c.lineWidth=big?2:1;
    c.beginPath();
    c.moveTo(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1);
    c.lineTo(cx+Math.cos(a)*r2,cy+Math.sin(a)*r2);
    c.stroke();
    if(big){
      const v=g.lo+(g.hi-g.lo)*t;
      c.fillStyle="rgba(40,31,18,.95)";
      c.font="600 "+Math.round(r*.185)+"px ui-monospace,monospace";
      c.textAlign="center";c.textBaseline="middle";
      c.fillText(g.dig?v.toFixed(g.dig>1?1:g.dig):Math.round(v),
                 cx+Math.cos(a)*r*.60,cy+Math.sin(a)*r*.60);
    }
  }
  /* дуга шкалы и подпись единиц под ней */
  c.strokeStyle="rgba(46,36,20,.55)";c.lineWidth=1.4;
  c.beginPath();c.arc(cx,cy,r*.92,A0,A1);c.stroke();
  c.fillStyle="rgba(52,40,22,.8)";
  c.font=Math.round(r*.19)+"px ui-monospace,monospace";
  c.textAlign="center";c.textBaseline="middle";
  c.fillText(g.unit,cx,cy+r*.70);
  c.restore();
}
/* стекло: одна широкая полоса отражения и лёгкое затемнение к краю */
function rackGlass(c,cx,cy,r){
  c.save();
  c.beginPath();c.arc(cx,cy,r,0,TAU);c.clip();
  const gl=c.createLinearGradient(cx-r,cy-r,cx+r*.4,cy+r);
  gl.addColorStop(0,"rgba(255,255,255,.16)");
  gl.addColorStop(.38,"rgba(255,255,255,.05)");
  gl.addColorStop(.55,"rgba(255,255,255,0)");
  c.fillStyle=gl;c.fillRect(cx-r,cy-r,r*2,r*2);
  const vg=c.createRadialGradient(cx,cy,r*.55,cx,cy,r);
  vg.addColorStop(0,"rgba(0,0,0,0)");vg.addColorStop(1,"rgba(0,0,0,.35)");
  c.fillStyle=vg;c.fillRect(cx-r,cy-r,r*2,r*2);
  c.restore();
}
/* ── статическое полотно ──
   Корпус, утопленные гнёзда, циферблаты с делениями, подписи, короб самописца,
   ролики и печатная сетка бумаги. Всё это не меняется от кадра к кадру и
   печётся один раз на размер экрана — выпечкой на видеокарте (08ca), в плотности слоя #ovl, с полями
   под тень корпуса (поля — в пикселях устройства: shadowBlur, как у 2D, трансформой не меряется).
   Рядом — вторая выпечка, спрайты живого (стрелка, её тень, втулка, каретка): плотность ×4 и уровни,
   повёрнутая стрелка сэмплится трилинейно и режется по краю не хуже 2D.
   Мастер — не одна выпечка, а слои в порядке рисунка (rackParts): корпус с тенью, две половины ряда
   циферблатов, короб самописца, правый угол. Каждый — шаг печи 17a0 под её бюджетом (PB_PX: крупная
   часть одна на кадр), и открытие стойки — несколько кадров, пока наплывает затемнение, а не один
   кадр в 50 мс. Дальше ни одной новой текстуры */
const RACK_SH=[40,30,50];
const RACK_DQ=4;   /* ряд циферблатов — четыре части: первый прибор растрит шрифты шкалы, на 390 половина ряда стоила 20 мс */   /* поля мастера (px устройства): бока, верх, низ — размытие 26 и сдвиг 10 */
function rackR(g0){const cw=(g0.w-RACK_PAD*2)/RACK_G.length;return Math.max(1,Math.min(cw*.36,(g0.gh-40)*.5));}
function rackDrop(){
  if(RACK.P)for(const p of RACK.P)gpuBakeDrop(p.B);if(RACK.S)gpuBakeDrop(RACK.S.B);RACK.P=RACK.S=null;RACK.key="";
  if(RACK.jk){prebakeDrop(RACK.jk);RACK.jk="";}}
/* части мастера (px устройства в мастере с полями; начало — целый пиксель, текстель ложится в пиксель):
   корпус — весь мастер с полями под тень, остальное — только свой кусок */
function rackParts(g0,nd){
  const [mx,mt,mb]=RACK_SH,MW=Math.ceil(g0.w*nd)+mx*2,MH=Math.ceil(g0.h*nd)+mt+mb;
  const n=RACK_G.length,cw=(g0.w-RACK_PAD*2)/n,R=g0.rec,gh=g0.gh;
  const box=(k,x0,y0,x1,y1)=>{const X0=clamp(Math.floor(x0*nd)+mx,0,MW-1),Y0=clamp(Math.floor(y0*nd)+mt,0,MH-1);
    return {k,X0,Y0,X1:clamp(Math.ceil(x1*nd)+mx,X0+1,MW),Y1:clamp(Math.ceil(y1*nd)+mt,Y0+1,MH)};};
  const L=[{k:"body",X0:0,Y0:0,X1:MW,Y1:MH}];
  for(let q=0;q<RACK_DQ;q++){const i0=Math.ceil(n*q/RACK_DQ),i1=Math.ceil(n*(q+1)/RACK_DQ);
    if(i1>i0)L.push(box("d"+q,RACK_PAD+cw*i0-(q?1:2),6,RACK_PAD+cw*i1+(q<RACK_DQ-1?1:2),gh-6));}
  return [...L,
    box("rec",R.x-2,R.y-2,R.x+R.w+2,R.y+R.h+2),
    box("right",R.x+R.w+1,gh-28,g0.w,g0.h)];
}
/* задача печи: шаг — одна выпечка. Спрайты первыми (мелкие), за ними части мастера (крупная — одна
   на кадр, PB_PX), последним — прогрев надписей: он дорог сам (глифы, 17 мс на 390) и встаёт в кадр
   после самой тяжёлой части, а не рядом с мелкой. Брошенная задача (размер сменился) отдаёт испечённое */
function* rackBakeJob(g0,nd){
  const [mx,mt]=RACK_SH,P=[];let S=null,done=false;
  try{
    S=rackSprites(rackR(g0),nd);
    if(!S)return null;
    yield;
    for(const p of rackParts(g0,nd)){
      p.B=gpuBake(p.X1-p.X0,p.Y1-p.Y0,c=>{c.setTransform(nd,0,0,nd,mx-p.X0,mt-p.Y0);rackPaint(c,g0,p.k);},
        {mips:false,ss:nd<1.5?2:1,once:true});   /* край кольца и стрелки шкалы — вровень с 2D; на плотном экране пиксель и так мелок */
      if(!p.B)return null;
      P.push(p);yield;
    }
    rackWarm({P,S,nd,fade:1,wk:1},g0);yield;
    rackWarm({P,S,nd,fade:1,wk:2},g0);
    done=true;return {P,S};
  }finally{if(!done){for(const p of P)gpuBakeDrop(p.B);if(S)gpuBakeDrop(S.B);}}
}
function rackTex(){
  const g0=rackGeo(),nd=ovNd();
  const key=Math.round(g0.w)+"x"+Math.round(g0.h)+"|"+nd.toFixed(2);
  if(RACK.key===key&&RACK.P&&RACK.P[0].B.dev===GPU.dev)return RACK;
  const jk="rack|"+key;
  if(RACK.P||RACK.jk&&RACK.jk!==jk)rackDrop();
  RACK.jk=jk;RACK.w=g0.w;RACK.h=g0.h;RACK.geo=g0;RACK.nd=nd;
  const v=prebake(jk,()=>rackBakeJob(g0,nd));
  if(v){RACK.P=v.P;RACK.S=v.S;RACK.key=key;RACK.jk="";}
  return RACK;
}
/* part — один слой мастера (rackParts), без него — всё целиком */
function rackPaint(c,g0,part){
  const w=g0.w,h=g0.h;
  if(!part||part==="body"){
    /* тень корпуса: стойка стоит перед миром, а не парит в нём */
    c.save();c.shadowColor="rgba(0,0,0,.6)";c.shadowBlur=26;c.shadowOffsetY=10;
    c.fillStyle="#101315";c.fillRect(0,0,w,h);c.restore();
    /* ── корпус стойки: матовый металл, фаска, винты по углам ── */
    const body=c.createLinearGradient(0,0,0,h);
    body.addColorStop(0,"#2b3033");body.addColorStop(.28,"#1e2325");
    body.addColorStop(.72,"#191d20");body.addColorStop(1,"#101315");
    c.fillStyle=body;c.fillRect(0,0,w,h);
    rackGrain(c,0,0,w,h,900,.06,["rgba(0,0,0,","rgba(220,235,240,"]);
    c.strokeStyle="rgba(210,228,235,.10)";c.lineWidth=1;
    c.beginPath();c.moveTo(0,.5);c.lineTo(w,.5);c.stroke();
    c.strokeStyle="rgba(0,0,0,.6)";
    c.beginPath();c.moveTo(0,h-.5);c.lineTo(w,h-.5);c.stroke();
    for(const [sx,sy] of [[10,10],[w-10,10],[10,h-10],[w-10,h-10]])rackScrew(c,sx,sy,4.5);
  }

  /* ── верхняя секция: восемь приборов в гнёздах ── */
  const gh=g0.gh, n=RACK_G.length;
  const cw=(w-RACK_PAD*2)/n;
  const r=Math.min(cw*.36,(gh-40)*.5);
  for(let i=0;i<n;i++){
    if(part&&part!=="d"+Math.floor(i*RACK_DQ/n))continue;
    const g=RACK_G[i], cx=RACK_PAD+cw*(i+.5), cy=RACK_PAD+r+6;
    /* гнездо: прямоугольная рамка вокруг круглого прибора, как в стойке */
    const bx=cx-cw*.46, by=8, bw=cw*.92, bh=gh-16;
    const socket=c.createLinearGradient(0,by,0,by+bh);
    socket.addColorStop(0,"#262b2e");socket.addColorStop(1,"#14181a");
    c.fillStyle=socket;
    c.beginPath();c.roundRect(bx,by,bw,bh,4);c.fill();
    c.strokeStyle="rgba(0,0,0,.7)";c.lineWidth=1.4;c.stroke();
    c.strokeStyle="rgba(200,220,228,.08)";c.lineWidth=1;
    c.beginPath();c.moveTo(bx+2,by+1);c.lineTo(bx+bw-2,by+1);c.stroke();
    for(const [sx,sy] of [[bx+5,by+5],[bx+bw-5,by+5],[bx+5,by+bh-5],[bx+bw-5,by+bh-5]])
      rackScrew(c,sx,sy,2.6);
    rackDial(c,cx,cy,r,g);
    rackGlass(c,cx,cy,Math.max(1,r));   // стенд с нулевым полотном: rackDial уже зажат, стекло — тоже
    /* подпись прибора под гнездом: то, что опознают, а не читают */
    c.fillStyle="rgba(196,206,210,.72)";
    c.font=Math.round(Math.min(11,cw*.115))+"px ui-monospace,monospace";
    c.textAlign="center";c.textBaseline="alphabetic";
    c.fillText(g.ru,cx,by+bh-8);
  }

  /* ── нижняя секция: короб самописца ── */
  if(!part||part==="rec"){
    const R=g0.rec;
    const box=c.createLinearGradient(0,R.y,0,R.y+R.h);
    box.addColorStop(0,"#202528");box.addColorStop(1,"#0f1214");
    c.fillStyle=box;
    c.beginPath();c.roundRect(R.x,R.y,R.w,R.h,5);c.fill();
    c.strokeStyle="rgba(0,0,0,.75)";c.lineWidth=1.6;c.stroke();
    c.strokeStyle="rgba(200,220,228,.07)";c.lineWidth=1;
    c.beginPath();c.moveTo(R.x+3,R.y+1);c.lineTo(R.x+R.w-3,R.y+1);c.stroke();
    const P=rackPaperBox(g0);
    /* бумага: тёплая, с печатной сеткой и чуть неровными краями */
    const pg=c.createLinearGradient(0,P.y,0,P.y+P.h);
    pg.addColorStop(0,"#e6dcc0");pg.addColorStop(.5,"#dfd3b3");pg.addColorStop(1,"#cfc09e");
    c.fillStyle=pg;c.fillRect(P.x,P.y,P.w,P.h);
    rackGrain(c,P.x,P.y,P.w,P.h,Math.round(P.w*P.h*.012),.10,
              ["rgba(120,100,64,","rgba(255,250,230,"]);
    /* печатная сетка: мелкая клетка и жирная каждая пятая */
    const cell=Math.max(7,P.h/26);
    c.lineWidth=1;
    for(let x=P.x;x<=P.x+P.w+.1;x+=cell){
      const k=Math.round((x-P.x)/cell);
      c.strokeStyle=k%5===0?"rgba(150,66,44,.30)":"rgba(150,66,44,.14)";
      c.beginPath();c.moveTo(Math.round(x)+.5,P.y);c.lineTo(Math.round(x)+.5,P.y+P.h);c.stroke();
    }
    for(let y=P.y;y<=P.y+P.h+.1;y+=cell){
      const k=Math.round((y-P.y)/cell);
      c.strokeStyle=k%5===0?"rgba(150,66,44,.30)":"rgba(150,66,44,.14)";
      c.beginPath();c.moveTo(P.x,Math.round(y)+.5);c.lineTo(P.x+P.w,Math.round(y)+.5);c.stroke();
    }
    /* полосы дорожек: пять зон с печатной нулевой линией */
    const th=P.h/TAPE_PENS;
    for(let i=0;i<TAPE_PENS;i++){
      const top=P.y+th*i;
      if(i){
        c.strokeStyle="rgba(96,60,36,.45)";c.lineWidth=1;
        c.beginPath();c.moveTo(P.x,Math.round(top)+.5);c.lineTo(P.x+P.w,Math.round(top)+.5);c.stroke();
      }
      c.strokeStyle="rgba(96,60,36,.28)";c.setLineDash([4,4]);
      c.beginPath();
      c.moveTo(P.x,Math.round(top+th*.5)+.5);c.lineTo(P.x+P.w,Math.round(top+th*.5)+.5);
      c.stroke();c.setLineDash([]);
    }
    /* тень от короба на бумагу: она лежит В приборе, а не наклеена сверху */
    const sh=c.createLinearGradient(P.x,0,P.x+14,0);
    sh.addColorStop(0,"rgba(10,12,14,.55)");sh.addColorStop(1,"rgba(10,12,14,0)");
    c.fillStyle=sh;c.fillRect(P.x,P.y,14,P.h);
    const sh2=c.createLinearGradient(P.x+P.w-16,0,P.x+P.w,0);
    sh2.addColorStop(0,"rgba(10,12,14,0)");sh2.addColorStop(1,"rgba(10,12,14,.5)");
    c.fillStyle=sh2;c.fillRect(P.x+P.w-16,P.y,16,P.h);
    /* окна подачи: бумага выходит слева из щели и уходит вправо на приёмный ролик */
    c.fillStyle="#0b0e10";
    c.fillRect(P.x-6,P.y-2,6,P.h+4);
    c.fillRect(P.x+P.w,P.y-2,6,P.h+4);
    rackRoller(c,P.x-10-R.rollW*.62,P.y+P.h*.5,R.rollW*.5,P.h*.56,"supply");
    rackRoller(c,P.x+P.w+6+R.rollW*.5,P.y+P.h*.5,R.rollW*.5,P.h*.62,"take");
    /* подписи каналов слева от бумаги */
    for(let i=0;i<RACK_CH.length;i++){
      const top=P.y+P.h/TAPE_PENS*i, cy2=top+P.h/TAPE_PENS*.5;
      c.fillStyle=RACK_CH[i].col;
      c.beginPath();c.arc(R.x+R.dx,cy2,3.6,0,TAU);c.fill();
      c.fillStyle="rgba(198,208,212,.75)";
      c.font=RACK_LEG_FONT;
      c.textAlign="left";c.textBaseline="middle";
      if(R.lab[i])c.fillText(R.lab[i],R.x+R.lx,cy2);
    }
  }
  if(!part||part==="right"){
    /* неподвижное из правого угла: подпись невязки, подложка и засечки её шкалы, лампа питания —
       горит ровно, потому что прибор просто включён */
    c.textAlign="right";c.textBaseline="alphabetic";
    c.fillStyle="rgba(196,206,210,.55)";c.font="9px ui-monospace,monospace";
    c.fillText("НЕВЯЗКА",w-RACK_PAD,g0.gh+2);
    {const bw=54,bx=w-RACK_PAD-bw,by=g0.gh+23;
     c.fillStyle="rgba(0,0,0,.45)";c.fillRect(bx,by,bw,3);
     c.fillStyle="rgba(196,206,210,.35)";for(const t of [0,.5,1])c.fillRect(bx+(bw-1)*t,by-2,1,2);}
    const lx=w-RACK_PAD-6,ly=g0.gh-16;
    const lg=c.createRadialGradient(lx,ly,.5,lx,ly,7);
    lg.addColorStop(0,"rgba(255,196,110,.95)");lg.addColorStop(.45,"rgba(226,140,52,.55)");
    lg.addColorStop(1,"rgba(226,140,52,0)");
    c.fillStyle=lg;c.beginPath();c.arc(lx,ly,7,0,TAU);c.fill();
    c.fillStyle="rgba(255,214,150,.95)";
    c.beginPath();c.arc(lx,ly,2.2,0,TAU);c.fill();
    if(g0.glob&&typeof globusPaint==="function")globusPaint(c,g0.glob.cx,g0.glob.cy,g0.glob.r);
  }
}
/* спрайты живого: стрелка (ось в начале), её тень, втулка, каретка. Каждый — своё окно текстуры
   целым числом texel'ей, между окнами запас под уровни */
function rackSprites(rr,nd){
  const D=nd*4,gap=Math.ceil(4*D);
  const L=[
    ["nd",-rr*.30-1,-3.2,rr*.92+1,3.2,c=>{
      c.fillStyle="rgba(228,150,64,.95)";c.beginPath();
      c.moveTo(-rr*.20,-1.6);c.lineTo(rr*.86,-.9);c.lineTo(rr*.92,0);c.lineTo(rr*.86,.9);c.lineTo(-rr*.20,1.6);
      c.closePath();c.fill();
      c.fillStyle="rgba(120,72,28,.55)";c.fillRect(-rr*.30,-2.2,rr*.12,4.4);}],
    ["sh",-rr*.16-1,.6,rr*.84+1,4,c=>{c.globalAlpha=.18;c.fillStyle="#3a2c14";c.fillRect(-rr*.16,1.6,rr*1.0,1.4);}],
    ["hub",-rr*.13-1.5,-rr*.13-1.5,rr*.13+1.5,rr*.13+1.5,c=>{
      const hub=c.createRadialGradient(-rr*.05,-rr*.05,rr*.01,0,0,rr*.13);
      hub.addColorStop(0,"#c9ccce");hub.addColorStop(.55,"#6d7275");hub.addColorStop(1,"#232729");
      c.fillStyle=hub;c.beginPath();c.arc(0,0,rr*.13,0,TAU);c.fill();
      c.strokeStyle="rgba(0,0,0,.5)";c.lineWidth=1;c.stroke();}],
    ["car",-1,-4.4,11,4.4,c=>{
      const cg=c.createLinearGradient(0,-3,0,3);cg.addColorStop(0,"#8e9599");cg.addColorStop(1,"#2b3033");
      c.fillStyle=cg;c.beginPath();c.roundRect(0,-3.2,10,6.4,2);c.fill();
      c.strokeStyle="rgba(0,0,0,.55)";c.lineWidth=1;c.stroke();}]];
  const R={};let x=0,th=0;
  for(const [k,x0,y0,x1,y1] of L){const r=R[k]={tx:x,tw:Math.ceil((x1-x0)*D),th:Math.ceil((y1-y0)*D),x0,y0};x+=r.tw+gap;th=Math.max(th,r.th);}
  const TW=x-gap,TH=th;
  const B=gpuBake(TW,TH,c=>{for(const [k,,,,,f] of L){const r=R[k];c.save();c.setTransform(D,0,0,D,r.tx-r.x0*D,-r.y0*D);f(c);c.restore();}},{ss:1,once:true});
  if(!B)return null;
  for(const k in R){const r=R[k];Object.assign(r,{u0:r.tx/TW,v0:0,u1:(r.tx+r.tw)/TW,v1:r.th/TH,w:r.tw/D,h:r.th/D});
    r.cx=r.x0+r.w/2;r.cy=r.y0+r.h/2;}
  R.B=B;return R;
}
/* спрайт k с осью в (ax,ay), повёрнутый на a: центр окна поворачивается вокруг оси */
function rackSpr(S,k,ax,ay,a,mul){
  const r=S[k],cs=Math.cos(a),sn=Math.sin(a);
  ovImage(S.B,ax+r.cx*cs-r.cy*sn,ay+r.cx*sn+r.cy*cs,r.w,r.h,a,r.u0,r.v0,r.u1,r.v1,mul==null?1:mul);
}
/* где именно лежит бумага внутри короба: слева колонка подписей, справа ролики */
function rackPaperBox(g0){
  const R=g0.rec, roll=Math.min(46,R.w*.05), L=rackLegend(R.w,roll), leg=L.leg;
  R.rollW=roll;R.lab=L.lab;R.lx=L.lx;R.dx=L.dx;
  return {x:R.x+leg,y:R.y+12,w:R.w-leg-roll*2-16,h:R.h-24};
}
/* колонка подписей каналов: ширина — по самой длинной подписи, чтобы она не заходила под ролик
   подачи (он стоит в этой же колонке, у бумаги). Подпись — самая полная из «CH1 · ХРОНОМЕТР»,
   «ХРОНОМЕТР», «CH1», пока бумаге остаётся 60 % короба. Тесно и так (телефон: справа «Глобус») —
   номер канала вплотную к точке, пока бумаге остаётся 45 %; иначе одна точка цвета */
const RACK_LEG_FONT="10px ui-monospace,monospace",RACK_LEG={k:"",v:null};
function rackLegend(rw,roll){
  const k=Math.round(rw)+"|"+roll.toFixed(2);if(RACK_LEG.k===k)return RACK_LEG.v;
  const tail=6+10+roll*1.18,room=rw-roll*2-16;   /* зазор, щель подачи, ролик с ободами */
  const forms=[c=>c.ru,c=>c.ru.split(" · ")[1],c=>c.ru.split(" · ")[0]];
  let v=null;
  for(const f of forms){
    const lab=RACK_CH.map(f),tw=Math.max(...lab.map(s=>rackTextW(s))),leg=26+tw+tail;
    if(room-leg>=room*.6){v={leg,lab,lx:26,dx:16};break;}
  }
  if(!v){const lab=RACK_CH.map((c,i)=>String(i+1)),leg=15+Math.max(...lab.map(s=>rackTextW(s)))+4+10+roll*1.18;
    if(room-leg>=room*.45)v={leg,lab,lx:15,dx:9};}
  if(!v)v={leg:19.6+4+10+roll*1.18,lab:RACK_CH.map(()=>""),lx:26,dx:16};
  RACK_LEG.k=k;RACK_LEG.v=v;return v;
}
/* ширина подписи: глифы видеокарты (08cb); без document (Node) — моноширинная оценка */
function rackTextW(s){try{return gcMeasure(RACK_LEG_FONT,s).width;}catch(e){return s.length*6;}}
/* ролик подачи: металлический вал с ободами и намотанной бумагой */
function rackRoller(c,cx,cy,r,h,kind){
  c.save();
  const g=c.createLinearGradient(cx-r,0,cx+r,0);
  g.addColorStop(0,"#191d1f");g.addColorStop(.35,"#767b7e");
  g.addColorStop(.6,"#3d4245");g.addColorStop(1,"#121517");
  c.fillStyle=g;
  c.beginPath();c.roundRect(cx-r,cy-h*.5,r*2,h,r*.5);c.fill();
  c.strokeStyle="rgba(0,0,0,.7)";c.lineWidth=1;c.stroke();
  /* обода вала: сверху и снизу, плюс намотка бумаги посередине у приёмного */
  for(const t of [-.5,.5]){
    const yy=cy+h*t;
    const rg=c.createLinearGradient(cx-r*1.25,0,cx+r*1.25,0);
    rg.addColorStop(0,"#22262a");rg.addColorStop(.4,"#8a9094");rg.addColorStop(1,"#191d20");
    c.fillStyle=rg;
    c.beginPath();c.roundRect(cx-r*1.12,yy-r*.55,r*2.24,r*1.1,r*.4);c.fill();
    c.strokeStyle="rgba(0,0,0,.6)";c.stroke();
  }
  if(kind==="take"){
    /* намотанная лента на приёмном валу: видно, что писалось уже долго */
    const pw=r*1.5;
    c.fillStyle="#cfc19f";
    c.beginPath();c.roundRect(cx-pw,cy-h*.30,pw*2,h*.60,pw*.5);c.fill();
    c.strokeStyle="rgba(90,72,44,.55)";c.lineWidth=1;c.stroke();
    c.strokeStyle="rgba(120,96,60,.35)";
    for(let k=-2;k<=2;k++){
      c.beginPath();c.moveTo(cx+k*pw*.35,cy-h*.28);c.lineTo(cx+k*pw*.35,cy+h*.28);c.stroke();
    }
  }
  c.restore();
}
/* ── живое ──
   Каждый кадр — только стрелки, перья и сами кривые, и не рисунком, а примитивами слоя #ovl (08bi):
   затемнение — прямоугольник, стойка — мастер, стрелки и каретки — спрайты, перья — графики,
   числа — глифы. Ни одного вызова 2D. Кадр зовёт стойку ДО мира: очередь сливается в конце мира */
function rackDraw(){
  if(!rackOpen()||!G.running){RACK.fade=0;return;}
  if(scrOpen())return;
  const T=rackTex(), g0=RACK.geo;
  /* открытие: затемнение наплывает за четыре кадра, пока печь печёт части; стойка встаёт целиком */
  RACK.fade=Math.min(1,RACK.fade+.25);
  if(!T.P||!T.S){ovRect(0,0,W,H,"rgba(3,5,8,.42)",RACK.fade);return;}
  rackFrame(T,g0);
}
/* прогрев — кадр стойки вхолостую последним шагом печи: глифы живых надписей растрятся там, а не в
   первом кадре открытой стойки (на 390 это было 18 мс ovText); очереди #ovl срезаются обратно */
function rackWarm(T,g0){
  const Qs=[OVL.uq,OVL.lq,OVL.cq,OVL.ur,OVL.gd],n=Qs.map(q=>q.length);
  try{rackFrame(T,g0);}finally{Qs.forEach((q,i)=>{q.length=n[i];});}
}
function rackFrame(T,g0){
  const R=instrRead(),nd=T.nd,S=T.S,[mx,mt]=RACK_SH,Q=OVL.uq;
  /* начало стойки — на целый пиксель устройства: мастер ложится текстель в пиксель */
  const ox=Math.round(g0.x*nd),oy=Math.round(g0.y*nd),X=ox/nd,Y=oy/nd;
  ovRect(0,0,W,H,"rgba(3,5,8,.42)",T.fade);
  for(const p of T.P)ovImage(p.B,(ox-mx+p.X0+p.B.w/2)/nd,(oy-mt+p.Y0+p.B.h/2)/nd,p.B.w/nd,p.B.h/nd,0,0,0,1,1,1);

  /* ── стрелки ── */
  const n=RACK_G.length, cw=(g0.w-RACK_PAD*2)/n;
  const rr=rackR(g0);
  const A0=Math.PI*.78, A1=Math.PI*2.22;
  for(let i=0;i<n;i++){
    const g=RACK_G[i], cx=X+RACK_PAD+cw*(i+.5), cy=Y+RACK_PAD+rr+6;
    let v=g.read(R);
    if(g.id==="hold")g.hi=Math.max(1,stat().cargoMax);
    let t=clamp((v-g.lo)/(g.hi-g.lo),0,1);
    /* дрожь: у нервной работы стрелка не стоит, у грубой стоит колом. Это
       характер экземпляра (05b-instr-kit), а не показание — на число не влияет */
    if(typeof instrJitter==="function"&&INSTR_BY_ID[g.id]){
      const j=instrJitter(g.id)*.004;
      t=clamp(t+Math.sin(G.t*.21+i*1.7)*j+Math.sin(G.t*.83+i)*j*.5,0,1);
    }
    const a=A0+(A1-A0)*t;
    /* стрелка янтарная, с противовесом; втулка — металлический корпус, а не точка; тень стрелки на
       циферблате — пара пикселей, но без неё стрелка нарисована */
    rackSpr(S,"nd",cx,cy,a);rackSpr(S,"hub",cx,cy,0);rackSpr(S,"sh",cx,cy,a);
  }
  /* ── правый угол: невязка цифрами; шильдик слева: чья это стойка. Профессия корпуса
     (03f-hull-role) и есть объяснение, почему приборы читают лучше или хуже соседских ── */
  const RL=(typeof hullRole==="function")?hullRole():null;
  const wk=T.wk||0;   /* прогрев (rackWarm) делит надписи на два шага печи */
  if(RL&&wk!==2){
    ovText(Q,X+RACK_PAD,Y+g0.gh+4,RL.ru,"600 11px ui-monospace,monospace","rgba(214,196,150,.72)","left","alphabetic",1,1);
    ovText(Q,X+RACK_PAD,Y+g0.gh+17,RL.note,"9px ui-monospace,monospace","rgba(150,162,166,.5)","left","alphabetic",1,1);
  }
  const mv=instrMisclose();
  if(wk!==2)ovText(Q,X+g0.w-RACK_PAD,Y+g0.gh+18,mv.toFixed(3),"600 13px ui-monospace,monospace","rgba(232,168,84,.9)","right","alphabetic",1,1);
  /* ── шкала под числом ──
     Внешний тестировщик: «приборы, которые нельзя прочесть» — и про эту цифру
     в частности: «0.000» без единицы. Единицы у невязки и нет, она безразмерна
     (доля от размаха области), поэтому подписывать нечем — а вот ШКАЛУ дать
     можно, и это честнее любой подписи: по ней сразу видно, что ноль — это
     край хода, а не отсутствие показания. Подложка и засечки — в мастере, ход — здесь */
  {const bw=54,bx=X+g0.w-RACK_PAD-bw,by=Y+g0.gh+23;
   ovRect(bx,by,bx+Math.max(1,bw*clamp(mv,0,1)),by+3,"rgba(232,168,84,.75)");}

  /* ── бумага: пять перьев пишут по-настоящему ── */
  const P0=rackPaperBox(g0),P={x:X+P0.x,y:Y+P0.y,w:P0.w,h:P0.h}, Tp=tapeInit();
  if(Tp.n>1){
    const cols=Math.min(Tp.n-1,Math.floor(P.w));
    const pen=[];
    const sc=P.w/cols, th=P.h/TAPE_PENS;
    for(let i=0;i<TAPE_PENS;i++){
      const top=P.y+th*i+2, hh=th-4;
      /* толщина линии — это перо: «Горн» пишет жирно, «Сирин» волосом (05b) */
      const lw=1.4*((typeof instrPenWidth==="function")?instrPenWidth(INSTR_KEYS[i]):1),ys=[];
      for(let k=0;k<=cols;k++){
        const idx=(Tp.head-1-Tp.back-(cols-k)+TAPE_N*2)%TAPE_N;
        ys.push(top+hh*(1-Tp.col[idx*TAPE_PENS+i]/255));
      }
      /* полоса графика — своя дорожка с запасом на толщину, внутри бумаги: она же обрез */
      ovGraph(P.x,Math.max(P.y,top-lw),P.x+P.w,Math.min(P.y+P.h,top+hh+lw),P.x,sc,ys,lw,RACK_CH[i].col);
      pen[i]=ys[cols];
    }
    /* пишущие узлы: каретка ходит по направляющей у правого края и держит перо.
       Рисуется ВНЕ бумаги — иначе половина узла срезается кромкой листа */
    if(!Tp.back){
      const xr=P.x+P.w;
      ovRect(xr-11,P.y,xr-9,P.y+P.h,"rgba(150,158,162,.30)");
      for(let i=0;i<TAPE_PENS;i++){
        const y=pen[i];
        rackSpr(S,"car",xr-15,y,0);
        /* перо: тонкая игла от каретки к бумаге, кончик своего цвета */
        ovRect(xr-6,y-.6,xr-1,y+.6,"rgba(120,128,132,.9)");
        ovEll(xr-1,y,2,2,0,RACK_CH[i].col);
      }
    }
    /* протяжка: перфорация по нижней кромке ползёт вместе с лентой, и это
       единственное, что показывает движение бумаги, когда все перья спокойны */
    const step=14, off=(Tp.head*3)%step;
    for(let x=P.x-step+off;x<P.x+P.w;x+=step){
      const x0=Math.max(P.x,x),x1=Math.min(P.x+P.w,x+6);
      if(x1>x0)ovRect(x0,P.y+P.h-3,x1,P.y+P.h-1.4,"rgba(120,92,58,.45)");
    }
    /* отметки времени по нижней кромке: сколько минут ленты видно. Считаются от
       такта пера, а не от часов — это ЕГО время, и оно у ядра области идёт быстрее */
    const span=cols*tapeRate()/60;                       // минут на всю бумагу
    for(let m=0;m<=4&&wk!==1;m++){
      const x=P.x+P.w-P.w*m/4;
      ovText(Q,x,P.y+P.h+4,m?"-"+(span*m/4).toFixed(1)+" мин":"сейчас","8px ui-monospace,monospace","rgba(150,160,164,.5)","center","top",1,1);
    }
  }

  /* ── «Глобус» (25f) ──
     Единственный прибор стойки, который показывает не число, а место: где ты и
     где окажешься, если затормозить прямо сейчас. Стоит отдельно от ряда
     стрелок нарочно — он другого рода. */
  if(g0.glob&&typeof globusDraw==="function"&&wk!==1)
    globusDraw(X+g0.glob.cx,Y+g0.glob.cy,g0.glob.r);
}
