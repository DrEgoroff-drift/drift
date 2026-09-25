/* ══════════════ система: кольца, пояс и станция в кадре ══════════════
   Отрезано от 17-mode-system на распиле 0.108.x: updateSystem и drawSystem
   остались там; формы пояса и станции — здесь. */
function reticle(x,y,r){
  ctx.strokeStyle="rgba(242,178,92,.9)";ctx.lineWidth=1.3;
  const a=G.t*.03;
  for(let i=0;i<4;i++){
    const t=a+i*Math.PI/2;
    ctx.beginPath();
    ctx.arc(x,y,r,t+.15,t+Math.PI/2-.15);ctx.stroke();
  }
}
/* заготовки гранёных скал: единичный радиус, крутятся и масштабируются на месте */
const ROCK_SHAPES=(function(){
  const out=[];
  for(let s=0;s<16;s++){
    const r=rng(hashi(s,7,0x0CCA)),n=8+Math.floor(r()*7),p=[];
    for(let k=0;k<n;k++){
      const t=k/n*TAU, q=.55+r()*.6;
      p.push([Math.cos(t)*q,Math.sin(t)*q]);
    }
    out.push(p);
  }
  return out;
})();
/* скалы кольца раскладываются по ячейкам сетки вокруг корабля —
   плотность одинаковая где угодно на кольце, и ничего не надо хранить */
const ROCK_CELL=62, ROCK_BAND=72;
function drawBeltRocks(ox,oy,B,Z,shx,shy){
  if(Z<.24)return;
  const half=(Math.max(W,H)/2/Z)*G.opts.gfx.draw+ROCK_CELL;
  const c0x=Math.floor((shx-half)/ROCK_CELL), c1x=Math.floor((shx+half)/ROCK_CELL);
  const c0y=Math.floor((shy-half)/ROCK_CELL), c1y=Math.floor((shy+half)/ROCK_CELL);
  const lx=-.56,ly=-.83;
  let drawn=0;
  const cap=Math.round(90*G.opts.gfx.draw);
  for(let cx=c0x;cx<=c1x;cx++)for(let cy=c0y;cy<=c1y;cy++){
    if(drawn>=cap)return;
    const cd=Math.hypot(cx*ROCK_CELL+ROCK_CELL*.5,cy*ROCK_CELL+ROCK_CELL*.5);
    if(Math.abs(cd-B.orbit)>ROCK_BAND+ROCK_CELL)continue;
    const hh=hashi(cx,cy,B.seed);
    if((hh&255)<74)continue;
    const r=rng(hh);
    const wx=(cx+r())*ROCK_CELL, wy=(cy+r())*ROCK_CELL;
    if(Math.abs(Math.hypot(wx,wy)-B.orbit)>ROCK_BAND)continue;
    const x=ox+wx*Z, y=oy+wy*Z;
    const rad=2.6+r()*r()*17;
    const s=rad*Z;
    if(s<.9||x<-s-8||x>W+s+8||y<-s-8||y>H+s+8)continue;
    drawn++;
    const P=ROCK_SHAPES[hh%ROCK_SHAPES.length];
    const rot=r()*TAU+G.t*(r()-.5)*.004;
    const cr=Math.cos(rot),sr=Math.sin(rot);
    const g=.42+r()*.6, ore=r()<.2;
    const col=[54+96*g,53+92*g,60+98*g];
    const oreCol=[152+r()*88,112+r()*68,62+r()*38];
    ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.scale(s,s);
    for(let i=0;i<P.length;i++){
      const A=P[i],Bp=P[(i+1)%P.length];
      const mx=(A[0]+Bp[0])*.5,my=(A[1]+Bp[1])*.5,ml=Math.hypot(mx,my)||1;
      const nx=(mx/ml)*cr-(my/ml)*sr, ny=(mx/ml)*sr+(my/ml)*cr;
      const li=clamp(.2+(nx*lx+ny*ly)*.9,.07,1.15);
      const c=(ore&&i%3===0)?oreCol:col;
      ctx.fillStyle="rgb("+(c[0]*li|0)+","+(c[1]*li|0)+","+(c[2]*li|0)+")";
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(A[0],A[1]);ctx.lineTo(Bp[0],Bp[1]);
      ctx.closePath();ctx.fill();
    }
    ctx.restore();
  }
}
/* Крошка пояса неподвижна: угол и радиус каждого камешка заданы seed-ом пояса
   и не меняются никогда. Пересчитывать их генератором на каждом кадре — то же
   самое, что заново выводить одно и то же число сто девяносто раз в секунду
   шестьдесят раз. Таблица считается один раз и живёт на самом поясе, а он
   живёт ровно столько, сколько система в кэше. */
function beltDots(B){
  if(B.dots)return B.dots;
  const r=rng(B.seed),t=new Float64Array(380);
  for(let i=0;i<190;i++){t[i*2]=r()*TAU;t[i*2+1]=(r()-.5)*130;}
  return B.dots=t;
}
/* Станция рисуется процедурно, тем же приёмом, что корпуса кораблей (03-ships):
   общий скелет — ядро, причал, огни, — а силуэт задаёт тип станции, пропорции и
   мелочь берутся из seed системы. Кэшируем в S.viz: станция эфемерна и живёт
   ровно столько, сколько система в SYS_CACHE. */
function stationViz(S){
  if(S.viz)return S.viz;
  const r=rng(hashi(G.sys.seed,0x57A71,7));
  S.viz={a:.75+r()*.55,b:.8+r()*.5,n:3+Math.floor(r()*3),ph:r()*TAU,f:r()};
  return S.viz;
}
/* грунт строителя доходит до ствола и панелей, а не только до плиты (D10, телефон
   18.09: шесть станций отличались одной полоской — «наклейка») */
let ST_BY="gt";
function stGround(base,k){return (typeof makerGround==="function")?rgba(mixc(base,makerGround(ST_BY),k),1):rgba(base,1);}
function stPanels(len,wid){        /* солнечные панели — неподвижны относительно звезды */
  ctx.fillStyle=stGround([52,88,128],.22);ctx.strokeStyle="rgba(130,190,230,.4)";ctx.lineWidth=1;
  for(const s of [-1,1]){
    const y0=s>0?18:-18-len;
    ctx.beginPath();ctx.rect(-wid/2,y0,wid,len);ctx.fill();ctx.stroke();
    for(let i=1;i*3<len;i++){
      ctx.beginPath();ctx.moveTo(-wid/2,y0+i*3);ctx.lineTo(wid/2,y0+i*3);ctx.stroke();
    }
  }
}
function stCore(w,h,seams){        /* центральный ствол с причальным раструбом наверху */
  const bg=ctx.createLinearGradient(-w,0,w,0);
  bg.addColorStop(0,stGround([42,58,72],.3));bg.addColorStop(.45,stGround([29,39,52],.3));bg.addColorStop(1,stGround([20,27,37],.3));
  ctx.fillStyle=bg;ctx.strokeStyle="rgba(0,0,0,.45)";ctx.lineWidth=.8;
  ctx.beginPath();ctx.rect(-w,-h,w*2,h*2);ctx.fill();ctx.stroke();
  if(seams){
    ctx.strokeStyle="rgba(242,178,92,.24)";ctx.lineWidth=1;
    for(let i=-h+4;i<h;i+=6){ctx.beginPath();ctx.moveTo(-w,i);ctx.lineTo(w,i);ctx.stroke();}
    ctx.strokeStyle="rgba(0,0,0,.45)";ctx.lineWidth=.8;
  }
  ctx.beginPath();ctx.moveTo(-w+2,-h);ctx.lineTo(-w-1,-h-6);ctx.lineTo(w+1,-h-6);ctx.lineTo(w-2,-h);ctx.stroke();
  ctx.fillStyle=(Math.sin(G.t*.09)>0)?"#7fe6d8":"rgba(127,230,216,.2)";
  ctx.beginPath();ctx.arc(0,-h-8,2.4,0,TAU);ctx.fill();
  ctx.fillStyle=(Math.sin(G.t*.09)>0)?"rgba(255,107,87,.9)":"rgba(255,107,87,.2)";
  ctx.beginPath();ctx.arc(0,h+2,1.8,0,TAU);ctx.fill();
}
function stRing(V,rx,ry){          /* вращающийся тор с жилыми модулями на ободе */
  ctx.strokeStyle="rgba(0,0,0,.45)";ctx.lineWidth=.7;ctx.fillStyle="#20293a";
  ctx.save();ctx.rotate(G.t*.006+V.ph);
  ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,TAU);ctx.stroke();
  ctx.beginPath();ctx.ellipse(0,0,rx*.66,ry*.7,0,0,TAU);ctx.stroke();
  for(let i=0;i<8;i++){
    const t=i*Math.PI/4;
    ctx.beginPath();ctx.moveTo(Math.cos(t)*rx*.66,Math.sin(t)*ry*.7);
    ctx.lineTo(Math.cos(t)*rx,Math.sin(t)*ry);ctx.stroke();
  }
  ctx.fillStyle="#212b3a";
  for(let i=0;i<6;i++){
    const t=i*Math.PI/3+.4,bx=Math.cos(t)*rx,by=Math.sin(t)*ry;
    ctx.beginPath();ctx.rect(bx-2.4,by-1.8,4.8,3.6);ctx.fill();ctx.stroke();
    ctx.fillStyle=(Math.sin(G.t*.05+i)>.2)?"rgba(255,230,170,.9)":"rgba(255,230,170,.25)";
    ctx.fillRect(bx-1,by-.7,2,1.4);
    ctx.fillStyle="#212b3a";
  }
  ctx.restore();
}
/* тело станции в своих координатах: плита, модули, постройки, куски типа.
   Ни один кусок не знает ни экрана, ни зума — потому всю сборку можно испечь
   в отдельный холст и положить на неё один свет (M304). */
function stPlatePath(V){
  const bw=26*(V.a||1),bh=17*(V.b||1);
  ctx.beginPath();
  ctx.moveTo(-bw*.55,-bh);ctx.lineTo(bw*.55,-bh);ctx.lineTo(bw,-bh*.3);
  ctx.lineTo(bw,bh*.3);ctx.lineTo(bw*.55,bh);ctx.lineTo(-bw*.55,bh);
  ctx.lineTo(-bw,bh*.3);ctx.lineTo(-bw,-bh*.3);
  ctx.closePath();
}
function drawStationBody(V,S,ty){
  /* ── штанги первым слоем (M304-II) ──
     Золотые штанги поверх всего и делали чертёж: они перечёркивали и плиту, и
     модули. Теперь тёмные распорки уходят вниз, под корпуса. */
  if(typeof drawStRods==="function"){
    if(typeof stationMods==="function")drawStRods(stationMods(G.sys));
    if(typeof holdMods==="function")drawStRods(holdMods(G.sys));
  }
  /* ── одно тело под всеми кусками (П2 марафона) ──
     На малом зуме станция рассыпалась в конфетти из ярких прямоугольников:
     модули и панели видны, а корпуса — нет. Правило сборок «много кусков —
     одно тело»: тёмная корпусная плита с обводом идёт ПОД модулями, куски
     держатся одного силуэта на любом масштабе, а щели между ними перестают
     светиться небом. Восьмиугольник, не эллипс — кругов и так дохуя. */
  {
    /* плита в грунте строителя (M454): тёмная, но своего тона — белая Компания
       и серый Орднунг различимы уже здесь */
    const by=(S&&S.by)||"gt";ST_BY=by;
    ctx.fillStyle=(typeof makerGround==="function")?rgba(mixc([30,40,54],makerGround(by),.2),1):"#1e2836";
    ctx.strokeStyle="rgba(0,0,0,.5)";ctx.lineWidth=.8;
    stPlatePath(V);ctx.fill();ctx.stroke();
    if(typeof stMakerDress==="function")stMakerDress(by,V);
  }
  /* модули идут первым слоем: они висят на штангах вокруг ядра, и ядро типа
     должно перекрывать их, а не наоборот (17a-station-mod) */
  drawStationMods(G.sys,1);                                  /* штанги уже положены */
  if(typeof holdMods==="function"&&typeof drawStModule==="function")
    for(const q of holdMods(G.sys))drawStModule(q,G.sys.station,1);   /* что построил игрок (M291) */
  if(ty==="trade"){
    /* раздутые склады и гроздь причалов: контейнеры висят на штангах по бортам */
    stPanels(12,6);
    stRing(V,30*V.a,10*V.b);
    ctx.strokeStyle="rgba(0,0,0,.45)";ctx.lineWidth=1.8;
    for(let i=0;i<V.n+1;i++){
      const yy=-10+i*8,sx=(i%2?1:-1);
      ctx.beginPath();ctx.moveTo(sx*6,yy);ctx.lineTo(sx*20,yy);ctx.stroke();
      for(let j=0;j<2;j++){
        ctx.fillStyle=stGround(j?[29,47,66]:[36,58,44],.3);   /* контейнеры в грунте строителя (D10) */
        ctx.beginPath();ctx.rect(sx*(11+j*6)-3,yy-3.2,6,6.4);ctx.fill();ctx.stroke();
      }
    }
    stCore(6,16,true);
  }else if(ty==="indust"){
    /* домны и факел: переработка видна снаружи — конвейеры, дым, огонь */
    stPanels(9,5);
    ctx.strokeStyle="rgba(0,0,0,.45)";ctx.lineWidth=.8;ctx.fillStyle=stGround([36,44,54],.3);
    for(const sx of [-1,1]){
      ctx.beginPath();
      ctx.moveTo(sx*9,-8);ctx.lineTo(sx*24*V.a,-13);ctx.lineTo(sx*24*V.a,9);ctx.lineTo(sx*9,6);
      ctx.closePath();ctx.fill();ctx.stroke();
      ctx.fillStyle=(Math.sin(G.t*.04+(sx>0?0:1.7))>0)?"rgba(255,150,60,.75)":"rgba(255,150,60,.3)";
      ctx.fillRect(sx*14-3,-4,6,7);
      ctx.fillStyle="#242c36";
    }
    ctx.strokeStyle="rgba(242,178,92,.32)";ctx.lineWidth=1;
    for(let i=-6;i<=6;i+=4){ctx.beginPath();ctx.moveTo(-24*V.a,i+2);ctx.lineTo(24*V.a,i+2);ctx.stroke();}
    stCore(7,15,false);
    /* факельная труба: пламя пляшет, дым сносит вбок */
    ctx.strokeStyle="rgba(0,0,0,.45)";ctx.lineWidth=.8;ctx.fillStyle="#222a35";
    ctx.beginPath();ctx.rect(-3,-28,6,12);ctx.fill();ctx.stroke();
    ctx.fillStyle="rgba(0,0,0,.55)";ctx.fillRect(-2.2,-28.6,4.4,1.2);   /* тёмное устье: у пламени есть откуда выходить */
    /* самого пламени в выпечке НЕТ (M326): спрайт живёт 18 тактов, и застывший
       язык под живым читался вторым, рваным пламенем — «кусками дёргается» */
  }else if(ty==="yard"){
    /* открытый эллинг: рама, а внутри шпангоуты строящегося корпуса и кран */
    stPanels(10,5);
    ctx.strokeStyle="rgba(0,0,0,.45)";ctx.lineWidth=2;
    ctx.beginPath();
    ctx.moveTo(-22,-20);ctx.lineTo(-22,20);ctx.lineTo(22,20);ctx.lineTo(22,-20);ctx.stroke();
    ctx.lineWidth=1.2;ctx.strokeStyle="rgba(242,178,92,.4)";
    for(let i=-18;i<=18;i+=9){
      ctx.beginPath();ctx.moveTo(-22,i);ctx.lineTo(-16,i);ctx.stroke();
      ctx.beginPath();ctx.moveTo(22,i);ctx.lineTo(16,i);ctx.stroke();
    }
    ctx.strokeStyle="rgba(150,190,220,.6)";
    for(let i=0;i<4;i++){
      const yy=-13+i*8, w=13-Math.abs(i-1.4)*3.4;
      ctx.beginPath();ctx.ellipse(0,yy,w,2.6,0,0,TAU);ctx.stroke();
    }
    ctx.strokeStyle="rgba(150,190,220,.45)";
    ctx.beginPath();ctx.moveTo(0,-17);ctx.lineTo(0,15);ctx.stroke();
    /* кран ползает вдоль эллинга — видно, что верфь работает */
    const cy=Math.sin(G.t*.02+V.ph)*15;
    ctx.strokeStyle="rgba(255,210,130,.8)";ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(-22,cy);ctx.lineTo(22,cy);ctx.stroke();
    ctx.fillStyle=(Math.sin(G.t*.3)>0)?"rgba(180,255,255,.9)":"rgba(180,255,255,.15)";
    ctx.beginPath();ctx.arc(6,cy,1.6,0,TAU);ctx.fill();
    stCore(5,10,false);
  }else if(ty==="sci"){
    /* тонкий силуэт: мачта, тарелки антенн и решётки радиаторов */
    ctx.strokeStyle="rgba(0,0,0,.4)";ctx.lineWidth=.7;ctx.fillStyle="rgba(46,82,104,.95)";
    for(const sx of [-1,1]){
      ctx.beginPath();ctx.rect(sx>0?9:-25,-4,16,8);ctx.fill();ctx.stroke();
      for(let i=1;i<5;i++){
        const xx=(sx>0?9:-25)+i*3.2;
        ctx.beginPath();ctx.moveTo(xx,-4);ctx.lineTo(xx,4);ctx.stroke();
      }
    }
    ctx.strokeStyle="rgba(0,0,0,.45)";ctx.lineWidth=.8;ctx.fillStyle="#212b3a";
    for(const sy of [-1,1]){
      const dy=sy*22,ang=G.t*.004*sy+V.ph;
      ctx.beginPath();ctx.moveTo(0,sy*12);ctx.lineTo(0,dy);ctx.stroke();
      ctx.save();ctx.translate(0,dy);ctx.rotate(ang);
      ctx.beginPath();ctx.ellipse(0,0,9*V.a,3.2,0,0,Math.PI,true);ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-4.5);ctx.stroke();
      ctx.restore();
    }
    stCore(4.5,13,true);
    ctx.fillStyle=(Math.sin(G.t*.06+V.ph)>.4)?"rgba(140,240,255,.9)":"rgba(140,240,255,.2)";
    ctx.beginPath();ctx.arc(0,0,2,0,TAU);ctx.fill();
  }else if(ty==="outpost"){
    /* угловатый броневой блок с турелями: панелей нет, только красные огни */
    ctx.strokeStyle="rgba(0,0,0,.45)";ctx.lineWidth=.8;ctx.fillStyle="#242d38";
    ctx.beginPath();
    for(let i=0;i<6;i++){
      const t=i*Math.PI/3+.3,rx=Math.cos(t)*20*V.a,ry=Math.sin(t)*17*V.b;
      i?ctx.lineTo(rx,ry):ctx.moveTo(rx,ry);
    }
    ctx.closePath();ctx.fill();ctx.stroke();
    ctx.lineWidth=1.2;ctx.strokeStyle="rgba(220,120,90,.45)";
    ctx.beginPath();ctx.moveTo(-14,-6);ctx.lineTo(14,-6);ctx.stroke();
    ctx.beginPath();ctx.moveTo(-14,6);ctx.lineTo(14,6);ctx.stroke();
    /* турели поводят стволами — станция явно сторожевая */
    ctx.strokeStyle="rgba(0,0,0,.45)";ctx.lineWidth=1.2;ctx.fillStyle="#2a333e";
    for(let i=0;i<3;i++){
      const t=i*TAU/3+V.ph,bx=Math.cos(t)*17*V.a,by=Math.sin(t)*15*V.b;
      const ga=t+Math.sin(G.t*.012+i)*.5;
      ctx.beginPath();ctx.arc(bx,by,3.4,0,TAU);ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx+Math.cos(ga)*8,by+Math.sin(ga)*8);ctx.stroke();
    }
    stCore(5,12,false);
    ctx.fillStyle=(Math.sin(G.t*.14)>.3)?"rgba(255,80,60,.95)":"rgba(255,80,60,.15)";
    for(const sx of [-1,1]){ctx.beginPath();ctx.arc(sx*20*V.a,0,2,0,TAU);ctx.fill();}
  }else if(ty==="bazaar"){
    /* блошинец: одно тело из чужих кусков. Корпус собран из разномастных секций,
       по бортам растянуты навесы, под ними на леерах висит товар, и всё это
       освещено тёплыми лампами с одной стороны — свет тут один на всю станцию */
    /* тело — груда разномастных секций, сваренных вместе: сначала сами секции
       со швами, потом ОДИН общий обвод поверх, иначе это куча, а не станция */
    const SEC=[[-17,-9,15,19],[-4,-14,13,11],[-6,0,17,14],[8,-6,12,16],[-14,4,11,10]];
    for(let i=0;i<SEC.length;i++){
      const s=SEC[i];
      ctx.fillStyle=i%2?"#20242e":"#2a2f3b";
      ctx.beginPath();ctx.rect(s[0]*V.a,s[1]*V.b,s[2]*V.a,s[3]*V.b);ctx.fill();
      ctx.strokeStyle="rgba(150,144,126,.5)";ctx.lineWidth=1;ctx.stroke();   // шов
    }
    ctx.strokeStyle="rgba(0,0,0,.5)";ctx.lineWidth=1.2;
    ctx.beginPath();                                     // обвод один на весь ком
    for(let i=0;i<9;i++){
      const t=i*TAU/9+V.ph*.3,rr=(i%3?16:20)+((i*5)%4)*1.4;
      const rx=Math.cos(t)*rr*V.a,ry=Math.sin(t)*rr*.86*V.b;
      i?ctx.lineTo(rx,ry):ctx.moveTo(rx,ry);
    }
    ctx.closePath();ctx.stroke();
    ctx.save();ctx.clip();
    const lg=ctx.createLinearGradient(-20,-16,18,16);    // свет слева сверху
    lg.addColorStop(0,"rgba(255,224,160,.18)");lg.addColorStop(.6,"rgba(255,255,255,0)");
    lg.addColorStop(1,"rgba(0,0,0,.35)");
    ctx.fillStyle=lg;ctx.fillRect(-24,-22,48,44);
    ctx.restore();
    /* навесы: короткие козырьки над бортами, и разные — симметричная пара
       читалась крыльями, а блошинец собран несимметрично, как и всё тут */
    ctx.strokeStyle="rgba(0,0,0,.45)";ctx.lineJoin="round";
    ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(-6,-11);ctx.lineTo(-19*V.a,-7);ctx.lineTo(-17*V.a,-2);ctx.stroke();
    ctx.lineWidth=2.6;
    ctx.beginPath();ctx.moveTo(5,-13);ctx.lineTo(17*V.a,-11);ctx.lineTo(20*V.a,-4);ctx.stroke();
    /* товар на леерах: короба висят ПОД козырьками, крупно — иначе на дистанции
       системного вида их просто нет */
    for(let i=0;i<6;i++){
      const sx=i%2?1:-1,t=(i*.31+.12)%1;
      const bx=sx*(9+t*10)*V.a,by=-4+t*12,w=3.6+(i%3)*2.1;
      ctx.strokeStyle="rgba(176,192,212,.55)";ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(bx,by-6);ctx.lineTo(bx,by);ctx.stroke();
      ctx.fillStyle=i%3?"#3b4f68":"#5a4c36";
      ctx.strokeStyle="rgba(0,0,0,.45)";ctx.lineWidth=.7;
      ctx.beginPath();ctx.rect(bx-w/2,by,w,w*.9);ctx.fill();ctx.stroke();
    }
    stCore(5,13,false);
    /* лампы: тёплые, разной яркости — гирлянда, а не сигнальные огни */
    for(let i=0;i<5;i++){
      const t=i*TAU/5+.4,a=.35+.55*Math.abs(Math.sin(G.t*.03+i*1.7));
      ctx.fillStyle="rgba(255,206,132,"+a.toFixed(2)+")";
      ctx.beginPath();ctx.arc(Math.cos(t)*19*V.a,Math.sin(t)*16*V.b,1.7,0,TAU);ctx.fill();
    }
  }else{
    /* заправочная: бак с причалом, ничего лишнего */
    ctx.strokeStyle="rgba(0,0,0,.45)";ctx.lineWidth=.8;
    const g=ctx.createLinearGradient(-16,0,16,0);
    g.addColorStop(0,"#2b3c4d");g.addColorStop(.5,"#1c2530");g.addColorStop(1,"#151c25");
    ctx.fillStyle=g;
    ctx.beginPath();ctx.ellipse(0,2,15*V.a,19*V.b,0,0,TAU);ctx.fill();ctx.stroke();
    ctx.strokeStyle="rgba(242,178,92,.3)";ctx.lineWidth=1;
    for(const yy of [-6,2,10]){
      ctx.beginPath();ctx.ellipse(0,yy,15*V.a*.94,4,0,0,Math.PI);ctx.stroke();
    }
    ctx.strokeStyle="rgba(150,190,220,.5)";ctx.lineWidth=1.6;
    for(const sx of [-1,1]){
      ctx.beginPath();ctx.moveTo(sx*13*V.a,-4);ctx.lineTo(sx*20,-9);ctx.lineTo(sx*20,4);ctx.stroke();
    }
    stCore(4,12,false);
  }
  /* знак дома (17d). У промышленной по оси стоит факельная труба (−3..3, −28 и
     выше пламя): знак уходит на левый борт, иначе мачта «Вестового» торчит из
     сопла, а ковш «Ковша» ложится на конвейер (M326, видео автора 03.09) */
  if(typeof houseMark==="function"&&typeof houseOf==="function")houseMark(houseOf(G.sys),V);
}
/* ── дым факельной трубы (M326) ──
   Чистая функция, чтобы её можно было судить числами, а не глазом: шесть
   клубов, у каждого возраст 0…1 по времени. С возрастом клуб ПОДНИМАЕТСЯ
   (y убывает), СНОСИТСЯ в одну сторону (x монотонно), РАСТЁТ (r) и РЕДЕЕТ
   (a → 0). Координаты — в единицах спрайта станции (ось трубы x=0, устье
   y≈−30−fl). Тест 91zzza проверяет ровно эти четыре монотонности. */
const SMOKE_N=6;
function stackSmoke(t,ph,fl){
  const out=[];
  for(let i=0;i<SMOKE_N;i++){
    const age=((t*.006+ph*.37+i/SMOKE_N)%1+1)%1;
    if(age<.04)continue;                              /* только что родился — ещё в пламени */
    const sway=Math.sin(t*.05+i*1.9)*.6;
    out.push({age,
      x:-2-age*16+sway,                               /* снос влево */
      y:-36-fl-age*22,                                /* подъём */
      r:1.4+age*4.2,                                  /* рост */
      a:.22*(1-age)*(1-age)});                        /* редеет */
  }
  return out;
}
/* ── один свет на всю станцию (M304) ──
   Куски рисовались по одному прямо на экран, и света не было ни у кого: плоский
   золотой чертёж. Теперь сборка печётся в холст, и последним слоем по ней идёт
   один градиент — светлый борт со стороны звезды, тень с обратной. Кэш мелкий,
   ключ ловит зум и время: мигающие окна, факел и кран живут дальше. */
const ST_ART=new Map();
function stationArt(key,s,V,S,ty,lx,ly){
  let art=ST_ART.get(key);
  if(art)return art;
  const R=Math.max(24,80*s),cn=mkCanvas(R*2,R*2);
  withCtx(cn,R*2,R*2,0,0,function(g){
    ctx.save();ctx.translate(R,R);ctx.scale(s,s);
    drawStationBody(V,S,ty);
    ctx.restore();
    /* на видеокарте свет кладёт gpuStation по рельефу — здесь только голый корпус */
    if(GPU.on)return;
    ctx.globalCompositeOperation="source-atop";
    const lg=ctx.createLinearGradient(R+lx*R,R+ly*R,R-lx*R,R-ly*R);
    lg.addColorStop(0,"rgba(255,236,208,.44)");
    lg.addColorStop(.42,"rgba(255,230,200,0)");
    lg.addColorStop(1,"rgba(0,0,0,.62)");
    ctx.fillStyle=lg;ctx.fillRect(0,0,R*2,R*2);
    ctx.globalCompositeOperation="source-over";
    /* кромка со стороны звезды: по ней силуэт отделяется от космоса */
    ctx.save();ctx.translate(R,R);ctx.scale(s,s);
    ctx.beginPath();                                   // полуплоскость света
    const px=-ly*R*4/s,py=lx*R*4/s,qx=lx*R*4/s,qy=ly*R*4/s;
    ctx.moveTo(px,py);ctx.lineTo(-px,-py);ctx.lineTo(-px+qx,-py+qy);ctx.lineTo(px+qx,py+qy);
    ctx.closePath();ctx.clip();
    ctx.strokeStyle="rgba(255,238,216,.45)";ctx.lineWidth=.8/s;
    stPlatePath(V);ctx.stroke();
    ctx.restore();
  });
  art={cn,R};
  if(ST_ART.size>=6)ST_ART.delete(ST_ART.keys().next().value);
  ST_ART.set(key,art);
  return art;
}
/* ── станция на видеокарте (G4) ──
   Корпус тот же (выпечка drawStationBody), но свет на нём — от звезды по рельефу,
   как на корабле (gpuHullLight), а не плоский градиент с обводкой по освещённой
   половине: маска выпечки читается рельефом, кромка горит только там, где борт
   смотрит на звезду, тень идёт перепадом через всё тело, огни и окна светят сами.
   Собственный свет станции — гауссово пятно под корпусом, а не кольца градиента. */
const GST_WGSL=GPU_PL_WGSL+`
fn plOcc(q:vec2f)->f32{let V=fu.v;let dq=q-V[0].xy;let ro=V[1].zw;
  let uv=(vec2f(dot(dq,ro),dot(dq,vec2f(-ro.y,ro.x)))/V[0].z+1.)*.5;
  if(any(uv<vec2f(0.))||any(uv>vec2f(1.))){return 0.;}
  return textureSampleLevel(t0,smp,uv,0.).a;}
fn sa(uv:vec2f,d:vec2f)->vec2f{let l=fu.v[3].z;
  return vec2f(textureSampleLevel(t0,smp,uv+vec2f(d.x,0.),l).a-textureSampleLevel(t0,smp,uv-vec2f(d.x,0.),l).a,
               textureSampleLevel(t0,smp,uv+vec2f(0.,d.y),l).a-textureSampleLevel(t0,smp,uv-vec2f(0.,d.y),l).a);}
fn field(p:vec2f,uv0:vec2f)->vec4f{
  let V=fu.v;let c=V[0].xy;let R=V[0].z;let s=V[0].w;let sd=normalize(V[1].xy);let col=V[2].rgb;let ro=V[1].zw;
  let dp=p-c;let rr=length(dp);
  /* свой свет станции: тёплое гауссово пятно, окна и прожекторы */
  let gl=vec3f(1.,.84,.59)*(exp(-(rr*rr)/(R*R*.12))*.22+exp(-rr/(R*.5))*.07)*V[3].x;
  if(rr>R*1.2){return vec4f(gl,0.);}
  /* спрайт повёрнут на ro=(cos,sin): место — в его осях, нормали — обратно в экран */
  /* V[3].y — сжатие крена по поперечной оси (корпус корабля, 17c2); 0 — без крена */
  let lp=vec2f(dot(dp,ro),dot(dp,vec2f(-ro.y,ro.x)))/vec2f(1.,select(1.,V[3].y,V[3].y>0.));let uv=(lp/R+1.)*.5;
  if(any(uv<vec2f(0.))||any(uv>vec2f(1.))){return vec4f(gl,0.);}
  let c4=textureSampleLevel(t0,smp,uv,V[3].z);let a=c4.a;   /* V[3].z — уровень мипа у мастера (17c2), иначе 0 */
  if(a<.01){return vec4f(gl,0.);}
  let u1=vec2f(.5/R);
  let L=normalize(vec3f(sd,.3));
  let g0=-sa(uv,u1*1.1);let g=vec2f(g0.x*ro.x-g0.y*ro.y,g0.x*ro.y+g0.y*ro.x);let tl=clamp(length(g),0.,.98);
  let n=vec3f(g/max(length(g),1e-4)*tl,sqrt(1.-tl*tl));
  let gb0=-(sa(uv,u1*3.*s)*.5+sa(uv,u1*8.*s)*.5);let gb=vec2f(gb0.x*ro.x-gb0.y*ro.y,gb0.x*ro.y+gb0.y*ro.x);let tb=clamp(length(gb)*1.2,0.,.9);
  let nb=vec3f(gb/max(length(gb),1e-4)*tb,sqrt(1.-tb*tb));
  let side=dot(dp,sd)/R;
  let rgb=c4.rgb/max(a,1e-3);let mx=max(rgb.r,max(rgb.g,rgb.b));let sat=(mx-min(rgb.r,min(rgb.g,rgb.b)))/max(mx,1e-3);
  let own=1.-smoothstep(.3,.55,sat*mx);
  let rim=pow(max(dot(n,L),0.),3.)*pow(1.-n.z,1.5);
  /* свет — множитель по грунту (почти белый): тёмное остаётся тёмным, синее — синим;
     тёплый цвет звезды — только кромке cos³ */
  let away=max(-dot(nb.xy,sd),0.)*(1.-nb.z);
  let dark=clamp(.45*smoothstep(-.1,.9,-side)+.25*away,0.,.55)*own;
  let lf=smoothstep(-.2,.8,side)*own;
  let shade=(1.+.9*lf+max(dot(nb,L),0.)*(1.-nb.z)*1.2*own)*(1.-dark);
  let lit=col*rim*1.1*own*a;
  /* L3: заслон звезды — станция тенит баржу у причала (у самой станции, glow>0, — нет);
     огни в тень не падают */
  let sk=mix(1.,select(shAt(p,sd),1.,V[3].x>0.),own);
  /* L3: точечный свет — лучи, разрывы, болты, факелы: ближний борт берёт их цвет */
  let pl=plAt(p,normalize(nb+vec3f(n.xy*.6,0.)),R*.3,R*.22)*own;
  /* металл (серое) — жёсткий блик-штрих со стороны звезды; стекло (голубое) — отражает звезду */
  let Hs=normalize(L+vec3f(0.,0.,1.));
  let met=(1.-smoothstep(.1,.28,sat))*smoothstep(.12,.35,mx)*own;
  let gls=glassOf(c4)*own;
  let gg0=glassG(uv,u1*6.);let gg=vec2f(gg0.x*ro.x-gg0.y*ro.y,gg0.x*ro.y+gg0.y*ro.x);
  let spec=(col*met*(1.-gls)*1.3*pow(max(dot(n,Hs),0.),40.)+mix(col,vec3f(1.),.6)*gls*glassSpec(gg,Hs))*sk*a;
  /* окна и огни светят сами: выше колена — их подхватывает свечение */
  let em=1.+1.3*(1.-own);
  return vec4f(c4.rgb*(shade*sk*em+pl)*mix(vec3f(1.),col,.08)+lit*sk+spec+gl*(1.-a),a);
}`;
/* выпечка cv (полуразмер R в пикселях экрана, поворот rot) со светом звезды по рельефу;
   (lx,ly) — к звезде; glow — доля своего тёплого света (станция 1, баржа 0) */
/* cv — холст или готовый мастер с мипами (gpuMipTex, 17c2): тогда lod — его уровень */
function gpuLitSprite(cv,x,y,R,s,rot,lx,ly,glow,sy,lod){
  const pass=gpuScene();if(!pass)return false;
  const c=(typeof starRGB==="function")?starRGB():[255,244,214],m=Math.max(1,c[0],c[1],c[2]);
  const U=new Float32Array(16);U[0]=x;U[1]=y;U[2]=R;U[3]=s;U[4]=lx;U[5]=ly;U[6]=Math.cos(rot);U[7]=Math.sin(rot);
  U[8]=c[0]/m;U[9]=c[1]/m;U[10]=c[2]/m;U[11]=1;U[12]=glow;U[13]=sy||0;U[14]=lod||0;
  const mip=!!cv.view;
  gpuField(pass,"gst",GST_WGSL,U,[mip?cv:gpuCanvasTex(cv),{view:GPU.V.lt}],{blend:"hull",smp:mip?gpuMipSmp():null});
  return true;
}
function gpuStation(art,x,y,s,lx,ly){return gpuLitSprite(art.cn,x,y,art.R,s,0,lx,ly,1);}
function drawStation(x,y,Z){
  /* ── станция крупнее корабля, потому что корабль в неё заходит (M242) ──
     На увеличении торговый узел с шестью модулями был 170 px, а корабль рядом
     140: внутрь такой станции лендер не влезет, и масштаб мира разваливался.
     Полтора — не «чтобы красивее», а чтобы отношение размеров не врало. */
  const s=clamp(Z,.4,1.5)*1.7,S=G.sys.station,V=stationViz(S),ty=S.stype||"trade";
  /* ── станция светит (M243) ──
     Самая яркая рукотворная вещь в системе не давала вокруг себя ничего:
     ни ореола, ни отблеска. Мягкое пятно её собственного света кладётся ДО
     корпуса — тогда оно читается свечением окон и прожекторов, а не нимбом. */
  if(!GPU.on){
    const R=70*s;
    const gg=ctx.createRadialGradient(x,y,0,x,y,R);
    gg.addColorStop(0,"rgba(255,214,150,.16)");
    gg.addColorStop(.45,"rgba(255,200,130,.06)");
    gg.addColorStop(1,"rgba(255,200,130,0)");
    ctx.save();ctx.globalCompositeOperation="lighter";
    ctx.fillStyle=gg;ctx.beginPath();ctx.arc(x,y,R,0,TAU);ctx.fill();ctx.restore();
  }
  /* сторона света — от станции к светилу: звезда системы стоит в (0,0) */
  let lx=-(S.x||0),ly=-(S.y||0);const ln=Math.hypot(lx,ly);
  if(ln<1e-6){lx=-.86;ly=-.51;}else{lx/=ln;ly/=ln;}   /* пока станция не встала на орбиту — свет слева сверху */
  const nb=(typeof bldBuiltHere==="function")?bldBuiltHere(G.sys).length:0;
  const key=(G.sys.key||"?")+"|"+ty+"|"+nb+"|"+(Math.round(s*4)/4)+"|"+Math.floor(G.t/18)+"|"+SCK+"|"+(GPU.on?"g":"c");
  const art=stationArt(key,s,V,S,ty,lx,ly);
  if(!gpuStation(art,x,y,s,lx,ly))ctx.drawImage(art.cn,x-art.R,y-art.R,art.R*2,art.R*2);
  else{GPU.oc.push([x,y,art.R*.5]);   /* L3: заслон звезды для барж у причала */
    /* огни станции — тёплый свет на пришвартованных: борт к станции теплеет */
    gpuLight(x,y,x,y,1,.84,.59,art.R*.9,.7);}
  /* факельная труба живёт поверх выпечки (M325): в спрайте пламя стоит по
     18 тактов, а факел — единственное на станции, что обязано плясать */
  if(ty==="indust"){
    ctx.save();ctx.translate(x,y);ctx.scale(s,s);
    /* язык пламени как тело (M326): было два эллипса и кружок, длина прыгала по
       |sin| — «кусками дёргается». Теперь одна замкнутая форма — язык с устья
       (−28) вверх, кончик гуляет по сумме двух медленных синусов (гладко, без
       изломов), изнутри — светлое ядро той же формы, снаружи — мягкое свечение.
       Марева здесь больше нет: оно резало звёзды на полосы и читалось белым
       дымом вокруг огня (жалоба автора 03.09) */
    const t=G.t*.045+V.ph;
    const fl=6.2+Math.sin(t*1.7)*1.6+Math.sin(t*2.9+1.3)*.9;          /* длина 3.7…8.7 */
    const lean=Math.sin(t*1.1+.7)*1.4+Math.sin(t*2.3)*.6;              /* наклон кончика */
    const tongue=(w,h,dx)=>{                                            /* язык: устье шириной w, высота h */
      ctx.beginPath();ctx.moveTo(-w,-28);
      ctx.bezierCurveTo(-w,-28-h*.45,dx-w*.35,-28-h*.8,dx,-28-h);
      ctx.bezierCurveTo(dx+w*.35,-28-h*.8,w,-28-h*.45,w,-28);ctx.closePath();
    };
    ctx.globalCompositeOperation="lighter";
    ctx.fillStyle="rgba(255,110,40,.16)";tongue(4.2,fl*1.35,lean*1.2);ctx.fill();   /* свечение */
    ctx.globalCompositeOperation="source-over";
    ctx.fillStyle="rgba(255,150,54,.92)";tongue(2.3,fl,lean);ctx.fill();            /* тело */
    ctx.fillStyle="rgba(255,226,160,.9)";tongue(1.1,fl*.55,lean*.5);ctx.fill();      /* ядро */
    /* дым (M326): комментарий у трубы десять версий обещал «дым сносит вбок»,
       а рисовалось только пламя. Клубы считает stackSmoke — он же под тестом:
       поднимаются, растут, редеют, сносятся в одну сторону */
    for(const q of stackSmoke(G.t,V.ph,fl)){
      ctx.fillStyle="rgba(96,92,100,"+q.a.toFixed(3)+")";
      ctx.beginPath();ctx.arc(q.x,q.y,q.r,0,TAU);ctx.fill();
    }
    ctx.restore();
  }
  /* подпись уходит НИЖЕ корпуса: сорок пикселей — это внутри станции, и имя
     читалось поверх её же переборок (M242) */
  /* и растёт вместе с бортом (M443): девять пикселей при раздутом интерфейсе
     читались так же, как подписи карты до M437 */
  domLabel("st",x,y+42*s+12*uiK(),S.name.toUpperCase(),uiFont(9),"rgba(242,178,92,.6)","center");
}
