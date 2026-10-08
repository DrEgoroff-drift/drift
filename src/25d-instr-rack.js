/* ══════════════ приборная стойка: стрелочные приборы и самописец ══════════════
   Колодка (25c) отвечает на «сколько сейчас» одним взглядом, но она размером с
   спичечный коробок: шкал там нет, делений нет, лента — полоска. Стойка — та же
   аппаратура, но раскрытая: игрок поворачивается к ней, когда хочет ЧИТАТЬ
   приборы, а не косить на них краем глаза (клавиша I).

   M821 — ЧТО ЭТО ЗА ВЕЩЬ. Плашка того же материала, что таблички мира и плиты
   борта (M720, 08bj HANG): графит, кремовый обвод, срезанные углы, буквы одной
   гарнитуры. Не металлический шкаф поперёк кадра: на ПК она стоит СБОКУ, справа
   между верхним и нижним рядом плит, в последней трети ширины — середина кадра
   свободна, мир не притушен. На телефоне — полка под верхним рядом плит, не ниже
   трети высоты. Пять приборов области; топливо, корпус и трюм уже на плите БОРТ
   и здесь не повторяются.

   ЧТО ЗДЕСЬ ЧЕСТНО. Все пять стрелок показывают настоящие величины игры (25a), пять
   дорожек самописца — те же пять приборов, записанные кольцом ленты (25b). Ни
   одного показания «для красоты».

   БУМАГА ПРИТУШЕНА. Самописец — не самое яркое пятно кадра: лист тёмный, сетка
   кремом в полтона, перья — краска каналов, разбелённая к букве. Цвет тут не
   тревога и не подсказка — он различает пять перьев на одной бумаге. Тревожной
   подсветки нет нигде, и стойка ничего не говорит: ни звука, ни строки в журнал. */

const RACK_PAD=12;
/* пять каналов: краска старых пишущих узлов; ab — код дорожки у бумаги */
const RACK_CH=[
  {ru:"CH1 · ХРОНОМЕТР",   ab:"ХРН",col:"#b8523f"},
  {ru:"CH2 · КУРСОГРАФ",   ab:"КРС",col:"#6f8f4e"},
  {ru:"CH3 · МАСС-ДЕТЕКТОР",ab:"МСС",col:"#4b7391"},
  {ru:"CH4 · ПРИЁМНИК",    ab:"ПРМ",col:"#c2913c"},
  {ru:"CH5 · АКТИНОМЕТР",  ab:"АКТ",col:"#6b5f7e"}
];
/* перо на тёмной бумаге: краска канала, разбелённая к букве плашки — иначе синий и лиловый тонут */
const RACK_PEN=RACK_CH.map(c=>rgba(mixc(hex2rgb(c.col),[241,235,222],.32),1));
/* пять приборов. Диапазон и деления у каждого свои: одинаковые шкалы — первый признак
   нарисованной, а не измеряющей аппаратуры */
const RACK_G=[
  {id:"chrono",ru:"ХРОНОМЕТР",  ab:"ХРН",unit:"С/СУТ",lo:0,hi:2,   mid:5,sub:4,dig:2,read:R=>R[0].val},
  {id:"course",ru:"КУРСОГРАФ",  ab:"КРС",unit:"КМ",   lo:0,hi:12,  mid:6,sub:5,dig:1,read:R=>R[1].val},
  {id:"mass",  ru:"МАСС-ДЕТЕКТОР",ab:"МСС",unit:"КТ", lo:0,hi:40,  mid:4,sub:5,dig:1,read:R=>R[2].val},
  {id:"radio", ru:"ПРИЁМНИК",   ab:"ПРМ",unit:"ДБ",   lo:0,hi:40,  mid:4,sub:5,dig:1,read:R=>R[3].val},
  {id:"actino",ru:"АКТИНОМЕТР", ab:"АКТ",unit:"ВТ",   lo:0,hi:4000,mid:4,sub:5,dig:0,read:R=>R[4].val}
];
const RACK={key:"",jk:"",P:null,S:null,nd:1,w:0,h:0,geo:null,fade:0,rb:null};
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
/* материал плашки (M720): крем обвода и делений с долей; буквы — гарнитура табличек */
function rackCr(a){return "rgba(232,220,196,"+a+")";}
const RACK_FACE="rgb(26,24,22)", RACK_PAPER="rgba(31,29,26,.96)";
/* ── геометрия ──
   Пиксели вёрстки: стойка — интерфейс и меряется той же линейкой --ui (UIK), что плиты вокруг.
   Место берётся у границ HUD (27z): верх — низ верхнего ряда плит, низ — верх нижнего, справа —
   левая кромка правого борта. Сама плашка не выше своего содержимого */
let RACK_K=1;
function rackGeo(){
  const k=RACK_K,LW=W/k,LH=H/k;
  const top=(typeof HUD_BAND==="number"&&HUD_BAND>0?HUD_BAND:72)/k+10;
  const flo=(typeof HUD_FLOOR==="number"&&HUD_FLOOR>0?HUD_FLOOR/k:LH-80)-10;
  const rail=(typeof HUD_RAIL==="number"&&HUD_RAIL>0)?HUD_RAIL/k:LW;
  if(LW<640){
    /* телефон: полка во всю ширину под верхним рядом плит — пять циферблатов и шапка. Ленты нет:
       полоса в 50 px с пятью прямыми не читается, лента — дело экрана, на котором есть место. Правый
       борт, поднявшийся выше низа полки, её укорачивает — полка кончается у него, а не на «Карте» */
    const y0=top-4,y1=y0+120;
    const x1=(rail<LW&&typeof HUD_RAILTOP==="number"&&HUD_RAILTOP>0&&HUD_RAILTOP/k<y1+6)?rail-6:LW-10;
    return rackLay({mode:"shelf",x:10,y:y0,w:x1-10,h:y1-y0,tape:false});
  }
  /* ПК: последняя треть ширины, у правого борта. Узкое окно (меньше 250 там не встаёт) отдаёт
     плашке кусок середины — она всё равно сбоку, а не поперёк */
  const x1=Math.min(rail-10,LW-10);
  let x0=Math.max(LW*.7+8,x1-380);
  if(x1-x0<250)x0=x1-Math.min(320,LW*.45);
  /* плашка никогда не поверх тела: звезда, планета, луна, станция или цель под ней — сперва уходит
     лента (плашка короче), потом плашка встаёт под тело, если ниже есть место; не нашлось — плашка
     отступает целиком (гаснет), пока тело не пройдёт. Лента возвращается не сразу: тело у кромки
     не дёргает печь кадр через кадр */
  const B=rackBodies(k),mk=(tape,y)=>rackLay({mode:"side",x:x0,y,w:x1-x0,h:Math.max(200,flo-y),tape});
  const hit=g=>B.some(b=>b.x1>g.x&&b.x0<g.x+g.w&&b.y1>g.y&&b.y0<g.y+g.h);
  const full=mk(true,top),fno=(typeof OVL!=="undefined"&&OVL.fno)|0;
  if(hit(full))RACK.hitF=fno;
  else if(!(fno-(RACK.hitF==null?-1e9:RACK.hitF)<45))return full;
  const dl=mk(false,top);if(!hit(dl))return dl;
  const lo=B.filter(b=>b.x1>dl.x&&b.x0<dl.x+dl.w&&b.y1>dl.y&&b.y0<dl.y+dl.h).reduce((m,b)=>Math.max(m,b.y1),top)+10;
  for(const g of [mk(true,lo),mk(false,lo)])if(g.y+g.h<=flo&&!hit(g))return g;
  dl.hide=true;return dl;
}
/* тела кадра системы в пикселях вёрстки: круг тела с запасом 6 px, цель — рамкой захвата (bodyMarkBox).
   Камера — та, что поставил прошлый кадр системы (G.viewCX/CY, G.zoom): стойка рисуется до мира */
function rackBodies(k){
  const O=[];
  if(G.mode!=="system"||!G.sys||G.viewCX==null)return O;
  const Z=G.zoom||1,cx=G.viewCX,cy=G.viewCY;
  const box=(sx,sy,rx,ry)=>{if(sx+rx<0||sx-rx>W||sy+ry<0||sy-ry>H)return;
    O.push({x0:(sx-rx)/k,y0:(sy-ry)/k,x1:(sx+rx)/k,y1:(sy+ry)/k});};
  const put=(x,y,r)=>{const q=r*Z+6;box(W/2+(x-cx)*Z,H/2+(y-cy)*Z,q,q);};
  put(0,0,G.sys.radius||60);
  for(const p of G.sys.planets||[]){put(p.x,p.y,p.radius);for(const m of p.moons||[])put(m.x,m.y,m.radius);}
  const st=G.sys.station;if(st&&isFinite(st.x))put(st.x,st.y,60);
  const T=G.marks&&G.marks[0];
  if(T&&isFinite(T.x)){const b=BODY.on&&typeof bodyMarkBox==="function"?bodyMarkBox(T,Z):null;
    box(W/2+(T.x-cx)*Z,H/2+(T.y-cy)*Z,b?b[0]:24,b?b[1]:24);}
  return O;
}
/* раскладка внутри плашки: шапка (роль корпуса, невязка), ячейки приборов, лента. На ПК шестая
   ячейка — «Глобус» (25f), три в ряд; низкое окно ставит все шесть в один ряд. Полка телефона —
   пять приборов в ряд, без «Глобуса», радиус — сколько даёт высота */
function rackLay(g){
  const sh=g.mode==="shelf",P=sh?8:RACK_PAD,n=sh?5:6,head=sh?24:46,tp=g.tape!==false;
  const gap=tp?10:0,tm=tp?16:0,tmin=tp?96:0;
  const fit=cols=>{const cw=(g.w-P*2)/cols,rows=Math.ceil(n/cols);
    const r=Math.max(8,Math.min(cw*.36,sh?28:42)),ch=r*2+20;
    return {cols,rows,cw,r,ch,need:P+head+rows*ch+gap+tmin+tm+P};};
  let L=fit(sh?5:3);
  if(!sh&&L.need>g.h)L=fit(6);
  const cells=[];
  for(let i=0;i<n;i++){
    const col=i%L.cols,row=Math.floor(i/L.cols),y0=P+head+row*L.ch,cx=P+L.cw*(col+.5);
    const glob=!sh&&i===5,r=glob?Math.max(8,L.r-8):L.r;
    cells.push({cx,cy:y0+4+r,r,glob,x0:P+L.cw*col,x1:P+L.cw*(col+1),y0,y1:y0+L.ch,cw:L.cw});
  }
  const ty=P+head+L.rows*L.ch+gap;
  const th=tp?clamp(g.h-ty-tm-P,tmin,200):0;
  const rec={x:P,y:ty,w:g.w-P*2,h:th};
  const lw=36;
  g.tape=tp;g.P=P;g.head=head;g.cells=cells;g.r=L.r;g.rec=rec;
  g.pap={x:rec.x+lw,y:rec.y,w:rec.w-lw-8,h:rec.h};
  g.h=ty+th+tm+P;
  g.x=Math.round(g.x);g.y=Math.round(g.y);
  return g;
}
/* циферблат: графитовое поле, кремовые деления, цифры и единицы буквой табличек */
function rackDial(c,cx,cy,r,g){
  r=Math.max(1,r);                            // на нулевом полотне (стенд) радиус уходил в минус
  const A0=Math.PI*.78, A1=Math.PI*2.22;      // рабочий сектор шкалы
  c.save();
  c.fillStyle=RACK_FACE;c.beginPath();c.arc(cx,cy,r,0,TAU);c.fill();
  c.strokeStyle=rackCr(.30);c.lineWidth=1.2;c.stroke();
  /* деления: крупные с цифрами, мелкие между ними. Цифра — через одно крупное деление (шесть-семь чисел
     на дуге в 40 px лезут на деления); мелкий прибор полки телефона — без цифр, хватает единицы и стрелки */
  const N=g.mid,S=g.sub,fs=Math.max(8,Math.round(r*.2)),all=r>=30;
  c.font="600 "+fs+"px "+HANG.FACE;c.textAlign="center";c.textBaseline="middle";
  for(let i=0;i<=N*S;i++){
    const t=i/(N*S),a=A0+(A1-A0)*t,big=i%S===0;
    const r1=r*.92,r2=r*(big?.76:.84);
    c.strokeStyle=rackCr(big?.62:.26);c.lineWidth=big?1.4:1;
    c.beginPath();c.moveTo(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1);c.lineTo(cx+Math.cos(a)*r2,cy+Math.sin(a)*r2);c.stroke();
    if(big&&all&&(N<5||(i/S)%2===0||i===N*S)){
      const v=g.lo+(g.hi-g.lo)*t;
      c.fillStyle=HANG.INK2;
      c.fillText(g.dig?v.toFixed(g.dig>1?1:g.dig):Math.round(v),cx+Math.cos(a)*r*.58,cy+Math.sin(a)*r*.58);
    }
  }
  c.strokeStyle=rackCr(.16);c.lineWidth=1;
  c.beginPath();c.arc(cx,cy,r*.92,A0,A1);c.stroke();
  c.fillStyle=HANG.INK2;c.font=Math.max(8,Math.round(r*.19))+"px "+HANG.FACE;
  c.fillText(g.unit,cx,cy+r*.66);
  c.restore();
}
/* «Глобус» в материале плашки: поле, обвод, двенадцать засечек, шар. Живое — globusDraw (25f) */
function rackGlobe(c,cx,cy,r){
  c.save();
  c.fillStyle=RACK_FACE;c.beginPath();c.arc(cx,cy,r,0,TAU);c.fill();
  c.strokeStyle=rackCr(.30);c.lineWidth=1.2;c.stroke();
  c.strokeStyle=rackCr(.12);c.lineWidth=1;c.beginPath();c.arc(cx,cy,r*.88,0,TAU);c.stroke();
  c.strokeStyle=rackCr(.34);
  for(let i=0;i<12;i++){const a=i/12*TAU,l=(i%3===0)?r*.10:r*.06;
    c.beginPath();c.moveTo(cx+Math.cos(a)*r*.88,cy+Math.sin(a)*r*.88);
    c.lineTo(cx+Math.cos(a)*(r*.88-l),cy+Math.sin(a)*(r*.88-l));c.stroke();}
  c.strokeStyle=rackCr(.10);c.beginPath();c.arc(cx,cy,r*.54,0,TAU);c.stroke();
  c.fillStyle=HANG.INK2;c.font="9px "+HANG.FACE;c.textAlign="center";c.textBaseline="top";
  c.fillText("ГЛОБУС",cx,cy+r+Math.max(11,r*.2));
  c.restore();
}
/* ── статическое полотно ──
   Плашка, шапка, гнёзда, циферблаты, бумага с сеткой — печётся один раз на размер экрана
   выпечкой на видеокарте (08ca), в плотности слоя #ovl. Рядом — спрайты живого (стрелка,
   втулка) плотностью ×4. Мастер — слои (rackParts): плашка с бумагой и две половины ячеек;
   каждый — шаг печи 17a0 под её бюджетом, открытие стойки — несколько кадров наплыва. Тени нет:
   плашка лежит на мире, как таблички, поля мастера — только под сглаживание края */
const RACK_SH=[2,2,2];
const RACK_DQ=2;
function rackDrop(){
  if(RACK.P)for(const p of RACK.P)gpuBakeDrop(p.B);if(RACK.S)gpuBakeDrop(RACK.S.B);RACK.P=RACK.S=null;RACK.key="";
  if(RACK.jk){prebakeDrop(RACK.jk);RACK.jk="";}}
/* части мастера (px устройства в мастере с полями; начало — целый пиксель): плашка — весь мастер,
   ячейки — только свой кусок */
function rackParts(g0,nd){
  const [mx,mt,mb]=RACK_SH,MW=Math.ceil(g0.w*nd)+mx*2,MH=Math.ceil(g0.h*nd)+mt+mb,n=g0.cells.length;
  const box=(k,x0,y0,x1,y1)=>{const X0=clamp(Math.floor(x0*nd)+mx,0,MW-1),Y0=clamp(Math.floor(y0*nd)+mt,0,MH-1);
    return {k,X0,Y0,X1:clamp(Math.ceil(x1*nd)+mx,X0+1,MW),Y1:clamp(Math.ceil(y1*nd)+mt,Y0+1,MH)};};
  const L=[{k:"body",X0:0,Y0:0,X1:MW,Y1:MH}];
  for(let q=0;q<RACK_DQ;q++){const i0=Math.ceil(n*q/RACK_DQ),i1=Math.ceil(n*(q+1)/RACK_DQ);
    if(i1>i0){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
      for(let i=i0;i<i1;i++){const c=g0.cells[i];x0=Math.min(x0,c.x0);x1=Math.max(x1,c.x1);y0=Math.min(y0,c.y0);y1=Math.max(y1,c.y1);}
      L.push(box("d"+q,x0,y0,x1,y1));}}
  return L;
}
/* задача печи: шаг — одна выпечка. Спрайты первыми, за ними части мастера, последним — прогрев
   надписей. Брошенная задача (размер сменился) отдаёт испечённое */
function* rackBakeJob(g0,nd){
  const [mx,mt]=RACK_SH,P=[];let S=null,done=false;
  try{
    S=rackSprites(g0.r,nd);
    if(!S)return null;
    yield;
    for(const p of rackParts(g0,nd)){
      p.B=gpuBake(p.X1-p.X0,p.Y1-p.Y0,c=>{c.setTransform(nd,0,0,nd,mx-p.X0,mt-p.Y0);rackPaint(c,g0,p.k);},
        {mips:false,ss:nd<1.5?2:1,once:true});   /* край кольца и деления — вровень с 2D; на плотном экране пиксель и так мелок */
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
  const key=g0.mode+"|"+Math.round(g0.w)+"x"+Math.round(g0.h)+"|"+nd.toFixed(2);
  if(RACK.key===key&&RACK.P&&RACK.P[0].B.dev===GPU.dev){RACK.geo.x=g0.x;RACK.geo.y=g0.y;RACK.geo.hide=g0.hide;return RACK;}   /* ряд плит сдвинулся — сдвигается и стойка, без перепечки */
  const jk="rack|"+key;
  if(RACK.P||RACK.jk&&RACK.jk!==jk)rackDrop();
  RACK.jk=jk;RACK.w=g0.w;RACK.h=g0.h;RACK.geo=g0;RACK.nd=nd;
  const v=prebake(jk,()=>rackBakeJob(g0,nd));
  if(v){RACK.P=v.P;RACK.S=v.S;RACK.key=key;RACK.jk="";}
  return RACK;
}
/* надпись по ширине: длинная пока влезает, иначе короткая; ширина — глифы видеокарты (08cb),
   без document (Node) — оценка */
function rackTextW(font,s){try{return gcMeasure(font,s).width;}catch(e){return s.length*6;}}
/* part — один слой мастера (rackParts), без него — всё целиком */
function rackPaint(c,g0,part){
  const w=g0.w,h=g0.h,P=g0.P,sh=g0.mode==="shelf";
  if(!part||part==="body"){
    /* плашка: срезы справа сверху и слева снизу, как у табличек и плит борта */
    const cu=8;
    c.beginPath();c.moveTo(0,0);c.lineTo(w-cu,0);c.lineTo(w,cu);c.lineTo(w,h);c.lineTo(cu,h);c.lineTo(0,h-cu);c.closePath();
    c.fillStyle="rgba(18,17,16,.97)";c.fill();   /* плотнее табличек: поверхность для чтения, щит мира сквозь неё не читается */
    c.beginPath();c.moveTo(.5,.5);c.lineTo(w-cu,.5);c.lineTo(w-.5,cu);c.lineTo(w-.5,h-.5);c.lineTo(cu,h-.5);c.lineTo(.5,h-cu);c.closePath();
    c.strokeStyle=rackCr(.17);c.lineWidth=1;c.stroke();
    /* метка роли у шапки: кремовая черта, с неё начинается чтение */
    c.fillStyle=rackCr(.85);c.fillRect(P,P+1,2,sh?12:15);
    /* правый угол шапки: подпись невязки и подложка шкалы её хода */
    c.font="10px "+HANG.FACE;c.fillStyle=HANG.INK2;c.textBaseline="alphabetic";c.textAlign="right";
    if(sh)c.fillText("НЕВЯЗКА",w-P-46,P+11);
    else c.fillText("НЕВЯЗКА",w-P,P+10);
    {const bw=sh?40:58,by=sh?P+15:P+32;c.fillStyle=rackCr(.10);c.fillRect(w-P-bw,by,bw,2);
     c.fillStyle=rackCr(.32);for(const t of [0,.5,1])c.fillRect(w-P-bw+(bw-1)*t,by-2,1,2);}
    c.fillStyle=rackCr(.10);c.fillRect(P,P+g0.head-7,w-P*2,1);
    /* подписи приборов под ячейками: полное имя, пока влезает, иначе код */
    c.font="10px "+HANG.FACE;c.textAlign="center";c.textBaseline="alphabetic";c.fillStyle=HANG.INK2;
    for(let i=0;i<RACK_G.length;i++){const C=g0.cells[i],g=RACK_G[i];
      const s=!sh&&rackTextW(c.font,g.ru)<=C.cw-6?g.ru:g.ab;c.fillText(s,C.cx,C.cy+C.r+13);}
    /* бумага: тёмный лист в плашке, сетка кремом в полтона, пять дорожек с нулевой линией */
    if(g0.tape){
    const R=g0.rec,Pp=g0.pap;
    c.fillStyle=RACK_PAPER;c.fillRect(Pp.x,Pp.y,Pp.w,Pp.h);
    const cell=Math.max(7,Pp.h/26);c.lineWidth=1;
    for(let x=Pp.x,k=0;x<=Pp.x+Pp.w+.1;x+=cell,k++){c.strokeStyle=rackCr(k%5===0?.09:.045);
      c.beginPath();c.moveTo(Math.round(x)+.5,Pp.y);c.lineTo(Math.round(x)+.5,Pp.y+Pp.h);c.stroke();}
    for(let y=Pp.y,k=0;y<=Pp.y+Pp.h+.1;y+=cell,k++){c.strokeStyle=rackCr(k%5===0?.09:.045);
      c.beginPath();c.moveTo(Pp.x,Math.round(y)+.5);c.lineTo(Pp.x+Pp.w,Math.round(y)+.5);c.stroke();}
    const th=Pp.h/TAPE_PENS;
    for(let i=0;i<TAPE_PENS;i++){const top=Pp.y+th*i,cy=top+th*.5;
      if(i){c.strokeStyle=rackCr(.12);c.beginPath();c.moveTo(Pp.x,Math.round(top)+.5);c.lineTo(Pp.x+Pp.w,Math.round(top)+.5);c.stroke();}
      c.strokeStyle=rackCr(.07);c.setLineDash([3,4]);
      c.beginPath();c.moveTo(Pp.x,Math.round(cy)+.5);c.lineTo(Pp.x+Pp.w,Math.round(cy)+.5);c.stroke();c.setLineDash([]);
      /* код дорожки слева от листа: точка краски пера и три буквы */
      c.fillStyle=RACK_PEN[i];c.beginPath();c.arc(R.x+4,cy,2.6,0,TAU);c.fill();
      c.fillStyle=HANG.INK2;c.font="9px "+HANG.FACE;c.textAlign="left";c.textBaseline="middle";
      c.fillText(RACK_CH[i].ab,R.x+10,cy);
    }
    /* направляющая кареток у правого края листа */
    c.fillStyle=rackCr(.16);c.fillRect(Pp.x+Pp.w+4,Pp.y,1,Pp.h);
    }
  }
  for(let i=0;i<g0.cells.length;i++){
    if(part&&part!=="d"+Math.floor(i*RACK_DQ/g0.cells.length))continue;
    const C=g0.cells[i];
    if(C.glob)rackGlobe(c,C.cx,C.cy,C.r);else rackDial(c,C.cx,C.cy,C.r,RACK_G[i]);
  }
}
/* спрайты живого: стрелка (ось в начале) и втулка. Каждый — своё окно текстуры целым числом
   texel'ей, между окнами запас под уровни */
function rackSprites(rr,nd){
  const D=nd*4,gap=Math.ceil(4*D);
  const L=[
    ["nd",-rr*.30-1,-3.2,rr*.92+1,3.2,c=>{
      c.fillStyle="rgba(236,158,82,.96)";c.beginPath();
      c.moveTo(-rr*.20,-1.5);c.lineTo(rr*.86,-.8);c.lineTo(rr*.92,0);c.lineTo(rr*.86,.8);c.lineTo(-rr*.20,1.5);
      c.closePath();c.fill();
      c.fillStyle="rgba(120,74,36,.7)";c.fillRect(-rr*.30,-2,rr*.12,4);}],
    ["hub",-rr*.11-1.5,-rr*.11-1.5,rr*.11+1.5,rr*.11+1.5,c=>{
      const q=Math.max(2,rr*.11);
      c.fillStyle="rgb(44,40,36)";c.beginPath();c.arc(0,0,q,0,TAU);c.fill();
      c.strokeStyle=rackCr(.45);c.lineWidth=1;c.stroke();}]];
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
/* пояснение роли — по ширине шапки, с многоточием; меряется раз на строку и ширину */
const RACK_FIT=new Map();
function rackFit(font,s,mw){
  const k=font+"|"+Math.round(mw)+"|"+s;let v=RACK_FIT.get(k);if(v!=null)return v;
  v=s;if(rackTextW(font,s)>mw){while(v.length>1&&rackTextW(font,v+"…")>mw)v=v.slice(0,-1);v=v.trimEnd()+"…";}
  if(RACK_FIT.size>64)RACK_FIT.clear();RACK_FIT.set(k,v);return v;
}
/* ── живое ──
   Каждый кадр — только стрелки, перья и надписи шапки, примитивами слоя #ovl (08bi). Ни одного
   вызова 2D. Кадр зовёт стойку ДО мира: очередь сливается в конце мира */
/* низ полки телефона — для строки сообщения (--rackbot, body.rackon в style.css). Сбоку (ПК)
   плашка строку не накрывает — там её не сдвигаем и подсказку не прячем */
function rackBottom(on){
  const g=on?rackGeo():null,rb=g&&g.mode==="shelf"?Math.round((g.y+g.h)*RACK_K):0;
  if(RACK.rb===rb)return;RACK.rb=rb;
  document.documentElement.style.setProperty("--rackbot",rb+"px");
  document.body.classList.toggle("rackon",rb>0);
}
/* до мира: место плашки (печь, раскладка) и её рамка — препятствие табличкам (08bj hangBlock) и запрет
   подписям и фишкам мира (08bi OVL.hushR). Сама плашка рисуется последней в интерфейсе — rackLate из
   ovFlush: щит, табличка или прицел, положенные миром позже, иначе ложились бы на неё */
function rackDraw(){
  RACK_K=Math.max(1,(typeof UIK==="number"&&UIK>0)?UIK:1);
  rackBottom(rackOpen()&&G.running&&!scrOpen());
  RACK.late=false;
  if(!rackOpen()||!G.running){RACK.fade=0;return;}
  if(scrOpen())return;
  RACK.late=true;
  /* кадр стойки — в пикселях вёрстки: плотность слоя на это время умножена на UIK (все ov* множат
     координаты на ovNd), печь берёт ту же плотность — мастер ложится текстель в пиксель */
  const nd0=OVL.nd,K=RACK_K;OVL.nd=ovNd()*K;
  try{
    const T=rackTex(),g=RACK.geo;
    if(T.P&&T.S&&g&&!g.hide){
      const R={x0:g.x*K,y0:g.y*K,x1:(g.x+g.w)*K,y1:(g.y+g.h)*K};OVL.hushR=R;
      const d=nd0||ovNd()/K;
      if(typeof hangBlock==="function")hangBlock(R.x0*d,R.y0*d,R.x1*d,R.y1*d);
    }
  }finally{OVL.nd=nd0;}
}
function rackLate(){
  if(!RACK.late)return;RACK.late=false;
  const nd0=OVL.nd;OVL.nd=ovNd()*RACK_K;
  try{rackDrawK();}finally{OVL.nd=nd0;}
}
function rackDrawK(){
  const T=rackTex(), g0=RACK.geo;
  if(!T.P||!T.S)return;   /* печь ещё печёт: мир не притушен, плашка встанет готовой */
  /* открытие: плашка наплывает за четыре кадра; тело под ней — так же гаснет */
  RACK.fade=g0.hide?Math.max(0,RACK.fade-.25):Math.min(1,RACK.fade+.25);
  if(RACK.fade>0)rackFrame(T,g0);
}
/* прогрев — кадр стойки вхолостую последним шагом печи: глифы живых надписей растрятся там, а не в
   первом кадре открытой стойки; очереди #ovl срезаются обратно */
function rackWarm(T,g0){
  const Qs=[OVL.uq,OVL.lq,OVL.cq,OVL.ur,OVL.gd],n=Qs.map(q=>q.length);
  try{rackFrame(T,g0);}finally{Qs.forEach((q,i)=>{q.length=n[i];});}
}
function rackFrame(T,g0){
  const R=instrRead(),nd=T.nd,S=T.S,[mx,mt]=RACK_SH,Q=OVL.uq,al=T.fade==null?1:T.fade;
  const sh=g0.mode==="shelf",Pd=g0.P,F=HANG.FACE;
  /* начало стойки — на целый пиксель устройства: мастер ложится текстель в пиксель */
  const ox=Math.round(g0.x*nd),oy=Math.round(g0.y*nd),X=ox/nd,Y=oy/nd;
  for(const p of T.P)ovImage(p.B,(ox-mx+p.X0+p.B.w/2)/nd,(oy-mt+p.Y0+p.B.h/2)/nd,p.B.w/nd,p.B.h/nd,0,0,0,1,1,al);
  if(al<1)return;   /* наплыв — одна плашка; стрелки и перья встают, когда она легла */

  /* ── стрелки ── */
  const A0=Math.PI*.78, A1=Math.PI*2.22;
  for(let i=0;i<RACK_G.length;i++){
    const g=RACK_G[i], C=g0.cells[i], cx=X+C.cx, cy=Y+C.cy;
    let t=clamp((g.read(R)-g.lo)/(g.hi-g.lo),0,1);
    /* дрожь: у нервной работы стрелка не стоит, у грубой стоит колом. Это характер экземпляра
       (05b-instr-kit), а не показание — на число не влияет */
    if(typeof instrJitter==="function"&&INSTR_BY_ID[g.id]){
      const j=instrJitter(g.id)*.004;
      t=clamp(t+Math.sin(G.t*.21+i*1.7)*j+Math.sin(G.t*.83+i)*j*.5,0,1);
    }
    rackSpr(S,"nd",cx,cy,A0+(A1-A0)*t);rackSpr(S,"hub",cx,cy,0);
  }
  /* ── шапка: чья это стойка (профессия корпуса, 03f — почему приборы читают лучше или хуже
     соседских) и невязка цифрой со шкалой хода ── */
  const RL=(typeof hullRole==="function")?hullRole():null;
  const wk=T.wk||0;   /* прогрев (rackWarm) делит надписи на два шага печи */
  if(RL&&wk!==2){
    ovText(Q,X+Pd+8,Y+Pd+12,RL.ru,"600 "+(sh?11:13)+"px "+F,HANG.INK,"left","alphabetic",1,1);
    if(!sh&&RL.note){const fn="10px "+F;
      ovText(Q,X+Pd+8,Y+Pd+28,rackFit(fn,RL.note,g0.w-Pd*2-8-74),fn,HANG.INK2,"left","alphabetic",1,1);}
  }
  const mv=instrMisclose();
  if(wk!==2){
    if(sh)ovText(Q,X+g0.w-Pd,Y+Pd+11,mv.toFixed(3),"600 12px "+F,HANG.INK,"right","alphabetic",1,1);
    else ovText(Q,X+g0.w-Pd,Y+Pd+27,mv.toFixed(3),"600 15px "+F,HANG.INK,"right","alphabetic",1,1);
  }
  /* шкала под числом: невязка безразмерна (доля от размаха области), подписывать нечем — а ШКАЛА
     показывает, что ноль — край хода, а не отсутствие показания. Подложка и засечки — в мастере */
  {const bw=sh?40:58,bx=X+g0.w-Pd-bw,by=Y+(sh?Pd+15:Pd+32);
   ovRect(bx,by,bx+Math.max(1,bw*clamp(mv,0,1)),by+2,"rgba(236,158,82,.85)");}

  /* ── бумага: пять перьев пишут по-настоящему ── */
  const P0=g0.pap,P={x:X+P0.x,y:Y+P0.y,w:P0.w,h:P0.h}, Tp=tapeInit();
  if(g0.tape&&Tp.n>1){
    const cols=Math.min(Tp.n-1,Math.floor(P.w)),pen=[],sc=P.w/cols,th=P.h/TAPE_PENS;
    for(let i=0;i<TAPE_PENS;i++){
      const top=P.y+th*i+2, hh=th-4;
      /* толщина линии — это перо: «Горн» пишет жирно, «Сирин» волосом (05b) */
      const lw=1.3*((typeof instrPenWidth==="function")?instrPenWidth(INSTR_KEYS[i]):1),ys=[];
      for(let k=0;k<=cols;k++){
        const idx=(Tp.head-1-Tp.back-(cols-k)+TAPE_N*2)%TAPE_N;
        ys.push(top+hh*(1-Tp.col[idx*TAPE_PENS+i]/255));
      }
      /* полоса графика — своя дорожка с запасом на толщину, внутри бумаги: она же обрез */
      ovGraph(P.x,Math.max(P.y,top-lw),P.x+P.w,Math.min(P.y+P.h,top+hh+lw),P.x,sc,ys,lw,RACK_PEN[i]);
      pen[i]=ys[cols];
    }
    /* пишущие узлы: каретка на направляющей у правого края — кремовая черта и кончик пера */
    if(!Tp.back){
      const xr=P.x+P.w;
      for(let i=0;i<TAPE_PENS;i++){const y=pen[i];
        ovRect(xr+2,y-.7,xr+7,y+.7,rackCr(.7));ovEll(xr,y,1.8,1.8,0,RACK_PEN[i]);}
    }
    /* протяжка: насечки по нижней кромке ползут вместе с лентой — движение бумаги видно, когда
       все перья спокойны */
    const step=14, off=(Tp.head*3)%step;
    for(let x=P.x-step+off;x<P.x+P.w;x+=step){
      const x0=Math.max(P.x,x),x1=Math.min(P.x+P.w,x+5);
      if(x1>x0)ovRect(x0,P.y+P.h-2.5,x1,P.y+P.h-1.3,rackCr(.14));
    }
    /* отметки времени под листом (ПК): сколько минут ленты видно. Считаются от такта пера, а не
       от часов — это ЕГО время, и оно у ядра области идёт быстрее */
    /* целые минуты: дробь «-5.3» никто не читает. Шаг — чтобы метки не сходились ближе 34 px; у кромки
       листа метка не ставится; единица — одна, под колонкой кодов, в строку меток */
    if(wk!==1){
      const span=cols*tapeRate()/60,pm=P.w/Math.max(1e-6,span),st=Math.max(1,Math.ceil(34/pm));
      for(let m=0;m<=span+1e-6;m+=st){const x=P.x+P.w-pm*m;if(m&&x-P.x<10)break;
        ovText(Q,x,P.y+P.h+4,m?"-"+m:"сейчас","9px "+F,HANG.INK2,m?"center":"right","top",.8,1);}
      ovText(Q,X+g0.rec.x+10,P.y+P.h+4,"мин","9px "+F,HANG.INK2,"left","top",.8,1);
    }
  }
  /* ── «Глобус» (25f) ── единственный прибор стойки, что показывает не число, а место: где ты и
     где окажешься, если затормозить прямо сейчас. Стоит своей ячейкой — он другого рода */
  if(wk!==1)for(const C of g0.cells)if(C.glob)rackGlobeLive(X+C.cx,Y+C.cy,C.r);
}
/* живое «Глобуса» на плашке — пеленги, а не пустой шар: светлая точка — станция системы, янтарная
   стрелка — цель захвата (G.marks), тонкая черта — курс на ходу; шар щёлкает раз в секунду (25f), под
   прибором — имя того, во что упрёшься, если не тормозить */
function rackGlobeLive(cx,cy,r){
  const aim=typeof globusTick==="function"?globusTick():null,sh=G.ship,gr=r*.54;
  if(typeof GLOB!=="undefined")ovEll(cx,cy,Math.max(1,Math.abs(Math.cos(GLOB.turn))*gr),gr,1,rackCr(.16));
  if(sh){
    const sp=Math.hypot(sh.vx||0,sh.vy||0);
    if(sp>.05){const a=Math.atan2(sh.vy,sh.vx),c=Math.cos(a),s=Math.sin(a);
      ovCap(cx+c*r*.2,cy+s*r*.2,cx+c*r*.84,cy+s*r*.84,1,rackCr(.55));}
    const st=G.sys&&G.sys.station;
    if(st&&isFinite(st.x)){const a=Math.atan2(st.y-sh.y,st.x-sh.x);
      ovEll(cx+Math.cos(a)*r*.7,cy+Math.sin(a)*r*.7,2.8,2.8,0,HANG.INK);}
    const T=G.marks&&G.marks[0];
    if(T&&isFinite(T.x)){const a=Math.atan2(T.y-sh.y,T.x-sh.x),c=Math.cos(a),s=Math.sin(a),L=r*.8,w=Math.max(1.6,r*.05);
      const tx=cx+c*L,ty=cy+s*L,col="rgba(236,158,82,.95)";
      ovCap(cx,cy,tx,ty,w,col);
      for(const d of [2.6,-2.6])ovCap(tx,ty,tx+Math.cos(a+d)*r*.2,ty+Math.sin(a+d)*r*.2,w,col);}
  }
  ovEll(cx,cy,2.2,2.2,0,HANG.INK2);
  ovText(OVL.uq,cx,cy+r+Math.max(23,r*.38),aim?aim.ru.toUpperCase():"— — —","9px "+HANG.FACE,
    aim?"rgba(236,158,82,.95)":HANG.INK2,"center","top",aim?1:.6,1);
}
