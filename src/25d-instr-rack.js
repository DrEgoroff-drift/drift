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
const RACK={key:"",cv:null,w:0,h:0,geo:null};
function rackOpen(){return !!(G.rack&&G.rack.on);}
function rackToggle(){
  if(!G.rack)G.rack={on:false};
  G.rack.on=!G.rack.on;
}
addEventListener("keydown",e=>{
  if(e.code==="KeyI"&&G.running&&!document.querySelector(".scr.open")){
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
  return {x,y,w,h,gh,
          rec:{x:RACK_PAD,y:gh+10,w:w-RACK_PAD*2,h:h-gh-10-RACK_PAD}};
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
   печётся один раз на размер экрана. */
function rackTex(){
  const g0=rackGeo();
  const key=Math.round(g0.w)+"x"+Math.round(g0.h)+"|"+DPR.toFixed(2);
  if(RACK.key===key)return RACK;
  const cn=document.createElement("canvas");
  cn.width=Math.max(1,Math.round(g0.w*DPR));cn.height=Math.max(1,Math.round(g0.h*DPR));
  const c=cn.getContext("2d");
  c.setTransform(DPR,0,0,DPR,0,0);
  const w=g0.w,h=g0.h;
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

  /* ── верхняя секция: восемь приборов в гнёздах ── */
  const gh=g0.gh, n=RACK_G.length;
  const cw=(w-RACK_PAD*2)/n;
  const r=Math.min(cw*.36,(gh-40)*.5);
  for(let i=0;i<n;i++){
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
    rackGlass(c,cx,cy,r);
    /* подпись прибора под гнездом: то, что опознают, а не читают */
    c.fillStyle="rgba(196,206,210,.72)";
    c.font=Math.round(Math.min(11,cw*.115))+"px ui-monospace,monospace";
    c.textAlign="center";c.textBaseline="alphabetic";
    c.fillText(g.ru,cx,by+bh-8);
  }

  /* ── нижняя секция: короб самописца ── */
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
    c.beginPath();c.arc(R.x+16,cy2,3.6,0,TAU);c.fill();
    c.fillStyle="rgba(198,208,212,.75)";
    c.font="10px ui-monospace,monospace";
    c.textAlign="left";c.textBaseline="middle";
    c.fillText(RACK_CH[i].ru,R.x+26,cy2);
  }
  RACK.key=key;RACK.cv=cn;RACK.w=g0.w;RACK.h=g0.h;RACK.geo=g0;
  return RACK;
}
/* где именно лежит бумага внутри короба: слева колонка подписей, справа ролики */
function rackPaperBox(g0){
  const R=g0.rec, leg=Math.min(150,R.w*.17), roll=Math.min(46,R.w*.05);
  R.rollW=roll;
  return {x:R.x+leg,y:R.y+12,w:R.w-leg-roll*2-16,h:R.h-24};
}
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
   Каждый кадр рисуются только стрелки, перья и сами кривые: остальное лежит
   готовым в полотне. */
function rackDraw(){
  if(!rackOpen()||!G.running)return;
  if(document.querySelector(".scr.open"))return;
  const T=rackTex(), g0=RACK.geo;
  const R=instrRead();
  ctx.save();
  /* стойка стоит перед миром, а не парит в нём: под ней тень и лёгкое затемнение */
  ctx.fillStyle="rgba(3,5,8,.42)";ctx.fillRect(0,0,W,H);
  ctx.shadowColor="rgba(0,0,0,.6)";ctx.shadowBlur=26;ctx.shadowOffsetY=10;
  ctx.drawImage(T.cv,g0.x,g0.y,g0.w,g0.h);
  ctx.shadowColor="transparent";ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  ctx.translate(g0.x,g0.y);

  /* ── стрелки ── */
  const n=RACK_G.length, cw=(g0.w-RACK_PAD*2)/n;
  const rr=Math.min(cw*.36,(g0.gh-40)*.5);
  const A0=Math.PI*.78, A1=Math.PI*2.22;
  for(let i=0;i<n;i++){
    const g=RACK_G[i], cx=RACK_PAD+cw*(i+.5), cy=RACK_PAD+rr+6;
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
    /* стрелка: янтарная, с противовесом за осью и металлической втулкой */
    ctx.save();
    ctx.translate(cx,cy);ctx.rotate(a);
    ctx.fillStyle="rgba(228,150,64,.95)";
    ctx.beginPath();
    ctx.moveTo(-rr*.20,-1.6);ctx.lineTo(rr*.86,-.9);
    ctx.lineTo(rr*.92,0);ctx.lineTo(rr*.86,.9);ctx.lineTo(-rr*.20,1.6);
    ctx.closePath();ctx.fill();
    ctx.fillStyle="rgba(120,72,28,.55)";
    ctx.fillRect(-rr*.30,-2.2,rr*.12,4.4);
    ctx.restore();
    /* втулка: маленький металлический корпус, а не точка */
    const hub=ctx.createRadialGradient(cx-rr*.05,cy-rr*.05,rr*.01,cx,cy,rr*.13);
    hub.addColorStop(0,"#c9ccce");hub.addColorStop(.55,"#6d7275");hub.addColorStop(1,"#232729");
    ctx.fillStyle=hub;
    ctx.beginPath();ctx.arc(cx,cy,rr*.13,0,TAU);ctx.fill();
    ctx.strokeStyle="rgba(0,0,0,.5)";ctx.lineWidth=1;ctx.stroke();
    /* тень стрелки на циферблате: пара пикселей, но без неё стрелка нарисована */
    ctx.save();
    ctx.globalAlpha=.18;ctx.translate(cx,cy);ctx.rotate(a);
    ctx.fillStyle="#3a2c14";
    ctx.fillRect(-rr*.16,1.6,rr*1.0,1.4);
    ctx.restore();
  }
  /* ── правый угол: невязка цифрами и лампа питания ── */
  /* шильдик слева: чья это стойка. Профессия корпуса (03f-hull-role) и есть
     объяснение, почему приборы читают лучше или хуже соседских */
  const RL=(typeof hullRole==="function")?hullRole():null;
  if(RL){
    ctx.textAlign="left";ctx.textBaseline="alphabetic";
    ctx.fillStyle="rgba(214,196,150,.72)";
    ctx.font="600 11px ui-monospace,monospace";
    ctx.fillText(RL.ru,RACK_PAD,g0.gh+4);
    ctx.fillStyle="rgba(150,162,166,.5)";
    ctx.font="9px ui-monospace,monospace";
    ctx.fillText(RL.note,RACK_PAD,g0.gh+17);
  }
  ctx.textAlign="right";ctx.textBaseline="alphabetic";
  ctx.fillStyle="rgba(196,206,210,.55)";
  ctx.font="9px ui-monospace,monospace";
  ctx.fillText("НЕВЯЗКА",g0.w-RACK_PAD,g0.gh+2);
  ctx.fillStyle="rgba(232,168,84,.9)";
  ctx.font="600 13px ui-monospace,monospace";
  ctx.fillText(instrMisclose().toFixed(3),g0.w-RACK_PAD,g0.gh+18);

  /* ── бумага: пять перьев пишут по-настоящему ── */
  const P=rackPaperBox(g0), Tp=tapeInit();
  if(Tp.n>1){
    const cols=Math.min(Tp.n-1,Math.floor(P.w));
    const pen=[];
    const sc=P.w/cols, th=P.h/TAPE_PENS;
    ctx.save();
    ctx.beginPath();ctx.rect(P.x,P.y,P.w,P.h);ctx.clip();
    for(let i=0;i<TAPE_PENS;i++){
      const top=P.y+th*i+2, hh=th-4;
      ctx.strokeStyle=RACK_CH[i].col;
      /* толщина линии — это перо: «Горн» пишет жирно, «Сирин» волосом (05b) */
      ctx.lineWidth=1.4*((typeof instrPenWidth==="function")?instrPenWidth(INSTR_KEYS[i]):1);ctx.lineJoin="round";ctx.lineCap="round";
      ctx.beginPath();
      let lastY=0;
      for(let k=0;k<=cols;k++){
        const idx=(Tp.head-1-Tp.back-(cols-k)+TAPE_N*2)%TAPE_N;
        const v=Tp.col[idx*TAPE_PENS+i]/255;
        const x=P.x+k*sc, y=top+hh*(1-v);
        if(k===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
        lastY=y;
      }
      ctx.stroke();
      pen[i]=lastY;
    }
    ctx.restore();
    /* пишущие узлы: каретка ходит по направляющей у правого края и держит перо.
       Рисуется ВНЕ бумаги — иначе половина узла срезается кромкой листа */
    if(!Tp.back){
      ctx.save();
      ctx.strokeStyle="rgba(150,158,162,.30)";ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(P.x+P.w-10,P.y);ctx.lineTo(P.x+P.w-10,P.y+P.h);ctx.stroke();
      for(let i=0;i<TAPE_PENS;i++){
        const y=pen[i];
        /* корпус каретки: маленький металлический сухарь на направляющей */
        const cg=ctx.createLinearGradient(0,y-3,0,y+3);
        cg.addColorStop(0,"#8e9599");cg.addColorStop(1,"#2b3033");
        ctx.fillStyle=cg;
        ctx.beginPath();ctx.roundRect(P.x+P.w-15,y-3.2,10,6.4,2);ctx.fill();
        ctx.strokeStyle="rgba(0,0,0,.55)";ctx.lineWidth=1;ctx.stroke();
        /* перо: тонкая игла от каретки к бумаге, кончик своего цвета */
        ctx.strokeStyle="rgba(120,128,132,.9)";ctx.lineWidth=1.2;
        ctx.beginPath();ctx.moveTo(P.x+P.w-6,y);ctx.lineTo(P.x+P.w-1,y);ctx.stroke();
        ctx.fillStyle=RACK_CH[i].col;
        ctx.beginPath();ctx.arc(P.x+P.w-1,y,2,0,TAU);ctx.fill();
      }
      ctx.restore();
    }
    /* протяжка: перфорация по нижней кромке ползёт вместе с лентой, и это
       единственное, что показывает движение бумаги, когда все перья спокойны */
    ctx.save();
    ctx.beginPath();ctx.rect(P.x,P.y,P.w,P.h);ctx.clip();
    ctx.fillStyle="rgba(120,92,58,.45)";
    const step=14, off=(Tp.head*3)%step;
    for(let x=P.x-step+off;x<P.x+P.w;x+=step)ctx.fillRect(x,P.y+P.h-3,6,1.6);
    ctx.restore();
    /* отметки времени по нижней кромке: сколько минут ленты видно. Считаются от
       такта пера, а не от часов — это ЕГО время, и оно у ядра области идёт быстрее */
    ctx.textAlign="center";ctx.textBaseline="top";
    ctx.fillStyle="rgba(150,160,164,.5)";
    ctx.font="8px ui-monospace,monospace";
    const span=cols*tapeRate()/60;                       // минут на всю бумагу
    for(let m=0;m<=4;m++){
      const x=P.x+P.w-P.w*m/4;
      ctx.fillText(m?"-"+(span*m/4).toFixed(1)+" мин":"сейчас",x,P.y+P.h+4);
    }
  }
  /* лампа питания: горит ровно, потому что прибор просто включён */
  const lx=g0.w-RACK_PAD-6, ly=g0.gh-16;
  const lg=ctx.createRadialGradient(lx,ly,.5,lx,ly,7);
  lg.addColorStop(0,"rgba(255,196,110,.95)");lg.addColorStop(.45,"rgba(226,140,52,.55)");
  lg.addColorStop(1,"rgba(226,140,52,0)");
  ctx.fillStyle=lg;ctx.beginPath();ctx.arc(lx,ly,7,0,TAU);ctx.fill();
  ctx.fillStyle="rgba(255,214,150,.95)";
  ctx.beginPath();ctx.arc(lx,ly,2.2,0,TAU);ctx.fill();
  ctx.restore();
}
