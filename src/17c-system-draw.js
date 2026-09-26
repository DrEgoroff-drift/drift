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
  /* с видеокарты (ступень 1): грани — треугольниками в проходе сцены (08c, вид 5), #c не трогается */
  const pass=gpuScene(),SH=[];
  for(let cx=c0x;cx<=c1x;cx++)for(let cy=c0y;cy<=c1y;cy++){
    if(drawn>=cap)break;
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
    if(pass){const X=(u,v)=>x+s*(u*cr-v*sr),Y=(u,v)=>y+s*(u*sr+v*cr);
      for(let i=0;i<P.length;i++){
        const A=P[i],Bp=P[(i+1)%P.length];
        const mx=(A[0]+Bp[0])*.5,my=(A[1]+Bp[1])*.5,ml=Math.hypot(mx,my)||1;
        const nx=(mx/ml)*cr-(my/ml)*sr, ny=(mx/ml)*sr+(my/ml)*cr;
        const li=clamp(.2+(nx*lx+ny*ly)*.9,.07,1.15);
        const c=(ore&&i%3===0)?oreCol:col;
        SH.push([5,x,y,X(A[0],A[1]),Y(A[0],A[1]),X(Bp[0],Bp[1]),Y(Bp[0],Bp[1]),Math.min(255,c[0]*li|0),Math.min(255,c[1]*li|0),Math.min(255,c[2]*li|0),1]);
      }
      continue;}
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
  if(SH.length)gpuShapes(pass,SH);
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
  stLive(()=>{const on=Math.sin(G.t*.09)>0;
    stLamp(0,-h-8,2.4,[127,230,216],on?1:.2);stLamp(0,h+2,1.8,[255,107,87],on?.9:.2);});
}
function stRing(V,rx,ry){          /* вращающийся тор с жилыми модулями на ободе */
  stLive(()=>{const a=G.t*.006+V.ph;
    stSpin("ring|"+rx.toFixed(2)+"|"+ry.toFixed(2),rx+3,a,()=>stRingBody(rx,ry));
    for(let i=0;i<6;i++){const t=i*Math.PI/3+.4,bx=Math.cos(t)*rx,by=Math.sin(t)*ry;
      stLampRect(bx-1,by-.7,2,1.4,[255,230,170],(Math.sin(G.t*.05+i)>.2)?.9:.25,a);}
  });
  stSplit();   /* кольцо — под слоем «над»: ядро и контейнеры его закрывают */
}
function stRingBody(rx,ry){
  ctx.strokeStyle="rgba(0,0,0,.45)";ctx.lineWidth=.7;ctx.fillStyle="#20293a";
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
  }
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
      stLive(()=>stLampRect(sx*14-3,-4,6,7,[255,150,60],(Math.sin(G.t*.04+(sx>0?0:1.7))>0)?.75:.3));
      ctx.fillStyle="#242c36";
    }
    stSplit();   /* полосы ложатся поверх огней */
    ctx.strokeStyle="rgba(242,178,92,.32)";ctx.lineWidth=1;
    for(let i=-6;i<=6;i+=4){ctx.beginPath();ctx.moveTo(-24*V.a,i+2);ctx.lineTo(24*V.a,i+2);ctx.stroke();}
    stCore(7,15,false);
    stSplit();   /* труба закрывает верхний огонь ствола */
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
    stLive(()=>{const cy=Math.sin(G.t*.02+V.ph)*15;
      stBar(-22,cy,22,cy,2,[255,210,130],.8);stLamp(6,cy,1.6,[180,255,255],(Math.sin(G.t*.3)>0)?.9:.15);});
    stSplit();   /* ствол закрывает кран */
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
      const dy=sy*22;
      ctx.beginPath();ctx.moveTo(0,sy*12);ctx.lineTo(0,dy);ctx.stroke();
      ctx.save();ctx.translate(0,dy);
      stLive(()=>stSpin("scidish|"+V.a.toFixed(3),9*V.a+1.5,G.t*.004*sy+V.ph,()=>{
        ctx.strokeStyle="rgba(0,0,0,.45)";ctx.lineWidth=.8;ctx.fillStyle="#212b3a";
        ctx.beginPath();ctx.ellipse(0,0,9*V.a,3.2,0,0,Math.PI,true);ctx.fill();ctx.stroke();
        ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-4.5);ctx.stroke();}));
      ctx.restore();
    }
    stCore(4.5,13,true);
    stLive(()=>stLamp(0,0,2,[140,240,255],(Math.sin(G.t*.06+V.ph)>.4)?.9:.2));
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
      ctx.beginPath();ctx.arc(bx,by,3.4,0,TAU);ctx.fill();ctx.stroke();
      stLive(()=>{const ga=t+Math.sin(G.t*.012+i)*.5;stBar(bx,by,bx+Math.cos(ga)*8,by+Math.sin(ga)*8,1.2,[0,0,0],.45);});
    }
    stCore(5,12,false);
    stLive(()=>{const a=(Math.sin(G.t*.14)>.3)?.95:.15;for(const sx of [-1,1])stLamp(sx*20*V.a,0,2,[255,80,60],a);});
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
    stLive(()=>{for(let i=0;i<5;i++){
      const t=i*TAU/5+.4,a=+(.35+.55*Math.abs(Math.sin(G.t*.03+i*1.7))).toFixed(2);
      stLamp(Math.cos(t)*19*V.a,Math.sin(t)*16*V.b,1.7,[255,206,132],a);
    }});
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
/* ── станция на видеокарте (G4) ──
   Корпус тот же (выпечка drawStationBody), но свет на нём — от звезды по рельефу,
   как на корабле (gpuHullLight), а не плоский градиент с обводкой по освещённой
   половине: маска выпечки читается рельефом, кромка горит только там, где борт
   смотрит на звезду, тень идёт перепадом через всё тело, огни и окна светят сами.
   Собственный свет станции — гауссово пятно под корпусом, а не кольца градиента. */
const GPU_LIT_SH=(.6).toFixed(2);
/* флаг 4: среднее не мельче коробки 5.5 текселя (у pirMaster — 7); мип у нуля — 2, пираты теряли до 11 % */
const GPU_LIT_DK=Math.log2(5.5).toFixed(3);
/* корабль в настоящем свете (§L.S): уровней мипа до купола тела, его вес, доля градиента «к звезде»
   по всему корпусу, заливка без газа, доля газа, свет, огни (выше колена — свечение подхватывает) */
const RL_DL="3.",RL_KD="6.",RL_AMB=".46",RL_GAS=".9",RL_LIT="1.2",RL_EM="2.3",RL_GL="1.5",RL_GN="8.",RL_FL="4.",RL_FLM=".1",RL_RIM=".45",RL_GK=".35",RL_SH=".65",RL_TD=".4";
const GST_WGSL=GPU_PL_WGSL+`
fn plOcc(q:vec2f)->f32{let dq=q-fu.v[0].xy;let ro=fu.v[1].zw;
  let uv=(vec2f(dot(dq,ro),dot(dq,vec2f(-ro.y,ro.x)))/fu.v[0].z+1.)*.5;
  if(any(uv<vec2f(0.))||any(uv>vec2f(1.))){return 0.;}
  return textureSampleLevel(t0,smp,uv,0.).a;}
/* fu.v[3].w — флаги: 1 — рельеф по мастеру t2, 2 — нерезкая маска между мипами, 8 — материал t3 (08cd):
   левая половина — рельеф, правая — маски свечения, металла, стекла */
fn relOn()->bool{return (u32(fu.v[3].w+.5)&1u)!=0u;}
/* рельеф — по альфе t0, а у верхнего слоя станции (флаг 1) — по общему мастеру t2:
   край ядра внутри тела — не кромка, свет его не обводит */
fn ra(uv:vec2f,l:f32)->f32{if(relOn()){return textureSampleLevel(t2,smp,uv,l).a;}return textureSampleLevel(t0,smp,uv,l).a;}
fn sa(uv:vec2f,d:vec2f)->vec2f{let l=fu.v[3].z;
  return vec2f(ra(uv+vec2f(d.x,0.),l)-ra(uv-vec2f(d.x,0.),l),ra(uv+vec2f(0.,d.y),l)-ra(uv-vec2f(0.,d.y),l));}
/* fu.v[2].w — прозрачность всего спрайта (борт у дока гаснет): премультиплицированный выход целиком */
fn field(p:vec2f,uv0:vec2f)->vec4f{return fieldL(p,uv0)*fu.v[2].w;}
fn fieldL(p:vec2f,uv0:vec2f)->vec4f{
  let c=fu.v[0].xy;let R=fu.v[0].z;let s=fu.v[0].w;let sd=normalize(fu.v[1].xy);let col=fu.v[2].rgb;let ro=fu.v[1].zw;
  let dp=p-c;let rr=length(dp);
  /* свой свет станции: тёплое гауссово пятно, окна и прожекторы */
  let gl=vec3f(1.,.84,.59)*(exp(-(rr*rr)/(R*R*.12))*.22+exp(-rr/(R*.5))*.07)*max(fu.v[3].x,0.);
  if(rr>R*1.2){return vec4f(gl,0.);}
  /* спрайт повёрнут на ro=(cos,sin): место — в его осях, нормали — обратно в экран */
  /* fu.v[3].y — сжатие крена по поперечной оси (корпус корабля, 17c2); 0 — без крена */
  let lp=vec2f(dot(dp,ro),dot(dp,vec2f(-ro.y,ro.x)))/vec2f(1.,select(1.,fu.v[3].y,fu.v[3].y>0.));let uv=(lp/R+1.)*.5;
  if(any(uv<vec2f(0.))||any(uv>vec2f(1.))){return vec4f(gl,0.);}
  var c4=textureSampleLevel(t0,smp,uv,fu.v[3].z);   /* fu.v[3].z — уровень мипа у мастера (17c2), иначе 0 */
  /* флаг 2 — нерезкая маска (25.09): Y против среднего по покрытию уровнем выше, одним множителем
     на rgb, канал не выше покрытия. Вверх и вниз — на (1−Y)²: светлое свет и так поднимает до ×3;
     флаг 4 — вниз в полную силу, полоса GPU_LIT_DK (правило pirMaster, пираты) */
  if((u32(fu.v[3].w+.5)&2u)!=0u&&c4.a>1e-3){let dk=(u32(fu.v[3].w+.5)&4u)!=0u;
    let a1=textureSampleLevel(t0,smp,uv,select(fu.v[3].z+1.,max(fu.v[3].z+1.,${GPU_LIT_DK}),dk));
    let W3=vec3f(.299,.587,.114);let Y=dot(c4.rgb,W3)/c4.a;
    if(a1.a>1e-4&&Y>.002){let e=${GPU_LIT_SH}*(Y-dot(a1.rgb,W3)/a1.a);let q=1.-min(Y,1.);
      let dn=select(q*q,1.,dk);
      let f=clamp((Y+e*select(dn,q*q,e>0.))/Y,0.,c4.a/max(max(c4.r,c4.g),max(c4.b,1e-4)));
      c4=vec4f(c4.rgb*f,c4.a);}}
  let a=c4.a;
  if(a<.01){return vec4f(gl,0.);}
  let u1=vec2f(.5/R);
  let L=normalize(vec3f(sd,.3));
  /* широкая нормаль и мелкий рельеф (краска, купол стекла) — из материала (раз на корпус, 08cd), иначе по
     альфе здесь; мелкий рельеф ложится и в тонкую нормаль — швы и панели ловят кромку звезды */
  let mo=(u32(fu.v[3].w+.5)&8u)!=0u;var gb0:vec2f;var gg0:vec2f;
  let lm=max(fu.v[3].z-1.,0.);var mk=vec3f(0.);
  var gd0=vec2f(0.);
  if(mo){let m=textureSampleLevel(t3,smp,vec2f(uv.x*.5,uv.y),lm);gb0=m.xy;gg0=m.zw;
    /* купол тела: мип склонов — склон размытой альфы, от хребта к бортам (свет в один терминатор) */
    gd0=textureSampleLevel(t3,smp,vec2f(uv.x*.5,uv.y),lm+${RL_DL}).xy;
    let q=textureSampleLevel(t3,smp,vec2f(.5+uv.x*.5,uv.y),lm);mk=q.xyz/max(q.w,1e-3);}
  else{gb0=-(sa(uv,u1*3.*s)*.5+sa(uv,u1*8.*s)*.5);gg0=glassG(uv,u1*6.);}
  let g0=-sa(uv,u1*1.1)+select(vec2f(0.),gg0,mo);let g=vec2f(g0.x*ro.x-g0.y*ro.y,g0.x*ro.y+g0.y*ro.x);let tl=clamp(length(g),0.,.98);
  let n=vec3f(g/max(length(g),1e-4)*tl,sqrt(1.-tl*tl));
  let gb=vec2f(gb0.x*ro.x-gb0.y*ro.y,gb0.x*ro.y+gb0.y*ro.x);let tb=clamp(length(gb)*1.2,0.,.9);
  let nb=vec3f(gb/max(length(gb),1e-4)*tb,sqrt(1.-tb*tb));
  let side=dot(dp,sd)/R;
  /* верхний слой станции судит «огонь или металл» по общему мастеру: полоса краски на
     .32 поверх корпуса — не лампа, хотя в своём слое она чистый янтарь */
  var cu=c4;if(relOn()){cu=textureSampleLevel(t2,smp,uv,fu.v[3].z);}
  let rgb=cu.rgb/max(cu.a,1e-3);let mx=max(rgb.r,max(rgb.g,rgb.b));let sat=(mx-min(rgb.r,min(rgb.g,rgb.b)))/max(mx,1e-3);
  let own=select(1.-smoothstep(.3,.55,sat*mx),1.-mk.x,mo);
  let rim=pow(max(dot(n,L),0.),3.)*pow(1.-n.z,1.5);
  /* свет — множитель по грунту (почти белый): тёмное остаётся тёмным, синее — синим;
     тёплый цвет звезды — только кромке cos³ */
  let away=max(-dot(nb.xy,sd),0.)*(1.-nb.z);
  let dark=clamp(.45*smoothstep(-.1,.9,-side)+.25*away,0.,.55)*own;
  let lf=smoothstep(-.2,.8,side)*own;
  var shade=(1.+.9*lf+max(dot(nb,L),0.)*(1.-nb.z)*1.2*own)*(1.-dark);
  var lit=col*rim*1.1*own*a;
  /* корпус корабля (glow<0, 17c2): свет как у 2D-корпуса (gpuHullLight) — грунт выпечки
     как есть, тень перепадом, звезда только кромкой и скатом к ней. Множитель станции
     (до ×3 на светлом борту) выбеливал обшивку, а насыщенная краска (красный кант)
     шла в огни ×2.3 и за коленом свечения уходила в розовое */
  let hm=fu.v[3].x<-.5;
  if(hm){shade=1.-clamp(.2*smoothstep(-.4,.6,-side)+.1*away,0.,.3)*own;
    lit=col*(rim*1.1+max(dot(nb,L),0.)*(1.-nb.z)*.3)*own*a;}
  /* L3: заслон звезды — станция тенит баржу у причала (у самой станции, glow>0, — нет);
     огни в тень не падают */
  let sk=mix(1.,select(shAt(p,sd),1.,fu.v[3].x>0.),own);
  /* L3: точечный свет — лучи, разрывы, болты, факелы: ближний борт берёт их цвет */
  let pl=plAt(p,normalize(nb+vec3f(n.xy*.6,0.)),R*.3,R*.22)*own*select(1.,.2,hm);
  /* металл (серое) — жёсткий блик-штрих со стороны звезды; стекло (голубое) — отражает звезду */
  let Hs=normalize(L+vec3f(0.,0.,1.));
  let met=select((1.-smoothstep(.1,.28,sat))*smoothstep(.12,.35,mx),mk.y,mo)*own;
  let gls=select(glassOf(cu),mk.z,mo)*own;
  let gg=vec2f(gg0.x*ro.x-gg0.y*ro.y,gg0.x*ro.y+gg0.y*ro.x);
  let spec=(col*met*(1.-gls)*1.3*pow(max(dot(n,Hs),0.),40.)+mix(col,vec3f(1.),.6)*gls*glassSpec(gg,Hs))*sk*a;
  /* окна и огни светят сами: выше колена — их подхватывает свечение; у корпуса корабля — только
     по маске материала (огонь ярче округи), без неё насыщенный кант шёл в огни */
  let em=select(1.+1.3*(1.-own),1.,hm&&!mo);
  if(hm&&mo){
    /* корабль в настоящем свете (§L.S a–c, e): один свет — звезда, терминатор по куполу тела через весь
       корпус; тень не чёрная — заливка газом у корабля (t2 — туманность 16gb, флаг 16), тёплая в
       рыжем газе, холодная в синем; скала гасит прямой свет (sk), но не заливку; огни живут и в тени */
    let gd=vec2f(gd0.x*ro.x-gd0.y*ro.y,gd0.x*ro.y+gd0.y*ro.x);
    /* a) свет по граням (ревью 26.09, проход 2): грани — как нарисованы, каждая ровная внутри; купол по
       размытой альфе клал муть поперёк граней — его нет. Звезда читается кромками: к ней — обвод (g),
       от неё — тёмная кромка силуэта (tv); по телу лишь едва заметный наклон */
    /* c) глубина тени скалы: shAt в полной тени — .4 (у 2D-корпуса это множитель всего цвета), здесь 0 —
       прямой свет, блик и обвод гаснут целиком, живут заливка, окна и факел */
    let sq=smoothstep(.4,1.,sk);
    let kf=.88+.12*smoothstep(-1.,1.,side);
    let key=kf;
    var fl=vec3f(${RL_AMB});
    if((u32(fu.v[3].w+.5)&16u)!=0u){let rq=fu.res.zw;var gz=vec3f(0.);
      for(var k=0;k<5;k++){let o=select(vec2f(0.),vec2f(cos(f32(k)*1.571),sin(f32(k)*1.571))*R*1.3,k>0);
        gz+=max(textureSampleLevel(t2,smp,(c+o)/rq,0.).rgb,vec3f(0.));}
      gz*=.2;let gm=max(max(gz.r,gz.g),max(gz.b,1e-4));let gc=gz*(1.-exp(-gm*1.25))/(gm*1.25)*1.12;
      /* b) газ красит тень, а не светлит её: оттенок газа той же светлоты, что и заливка */
      let gh=gc/max(dot(gc,vec3f(.299,.587,.114)),1e-3);fl=fl*mix(vec3f(1.),gh,smoothstep(.02,.2,gm)*${RL_GAS});}
    /* c) в тени скалы прямой свет гаснет весь, заливка — на треть (газ в конусе тени темнее, но не вдвое) */
    fl*=${RL_SH}+(1.-${RL_SH})*sq;let lv=mix(fl,vec3f(${RL_LIT}),key*sq);
    let e=1.-own;
    /* маска голого металла для блика на кромке (d) — на мипе ~1/8 длины корпуса: панель металл или нет,
       без крапа по заклёпкам; на барже столько же, сколько на истребителе */
    let td=vec2f(textureDimensions(t3));
    let glv=max(lm+${RL_GL},log2(max(td.x*.5,td.y)/${RL_GN}));
    let mq=textureSampleLevel(t3,smp,vec2f(.5+uv.x*.5,uv.y),glv);let mg=mq.y/max(mq.w,1e-3);
    let sp=mix(col,vec3f(1.),.6)*gls*glassSpec(gg,Hs)*sq*a;
    /* f) огонь светит корму — второй свет, нарушение «одного света», названное: тёплое пятно у сопел,
       спадает к досягаемости; обшивка, скатом к огню, берёт больше; скала его не гасит — огонь свой */
    var fs=vec3f(0.);
    if(fu.v[4].w>0.){let fv=fu.v[4].xy-p;let fd=length(fv);let r0=fu.v[5].w;let rr=fu.v[4].z;
      let fa=smoothstep(-.35,.35,dot(gd,fv/max(fd,1e-3))*${RL_KD});
      let rg=step(r0,fd)*smoothstep(r0,r0+(rr-r0)*.3,fd)*(1.-smoothstep(r0,rr,fd));
      /* огонь бьёт назад и вбок: конус от оси — чем дальше от оси, тем дальше вперёд достаёт; кили по
         бокам языка светятся, фюзеляж перед гнездом (на оси) — нет */
      let ax=dot(-fv,ro);let lat=abs(dot(-fv,vec2f(-ro.y,ro.x)));
      let bk=1.-smoothstep(-r0*.2,r0*.3,ax-lat*.9);
      /* гнездо сопел и его свечение светлы сами — их огонь не трогает вовсе (сам шейдер — байт в байт; ±1 даёт только блум) */
      let yc=dot(c4.rgb/max(a,1e-3),vec3f(.299,.587,.114));
      fs=fu.v[5].rgb*fu.v[4].w*${RL_FL}*rg*bk*(.45+.55*fa)*own*step(yc,.5);}
    /* g) обвод: пиксель устройства по кромке к звезде — сосед на пиксель к ней пуст; тёмная сторона кромки
       не светлеет, на светлом газе тело остаётся тёмным силуэтом; мип мастера — поворот не мерцает */
    let sdu=vec2f(dot(sd,ro),dot(sd,vec2f(-ro.y,ro.x)));
    let an=textureSampleLevel(t0,smp,uv+sdu*u1,fu.v[3].z+1.).a;
    let af=textureSampleLevel(t0,smp,uv-sdu*u1*1.5,fu.v[3].z+1.).a;let tv=1.-${RL_TD}*clamp(a-af,0.,1.)*sq;
    /* d) блик — на кромке к звезде по голому металлу: пиксель обвода белеет (мягкий отлив по грани на
       телефоне читался грязью); едет с поворотом вместе с кромкой */
    let rv=mix(col,vec3f(1.),.5*mg)*clamp(a-an,0.,1.)*key*sq*own*(${RL_RIM}+${RL_GK}*smoothstep(.35,.7,mg));
    return vec4f(c4.rgb*(lv*tv*own*mix(vec3f(1.),col,.08*key)+pl+e*${RL_EM})+min(c4.rgb*fs,fu.v[5].rgb*${RL_FLM})+sp+rv+gl*(1.-a),a);}
  return vec4f(c4.rgb*(shade*sk*em+pl)*mix(vec3f(1.),col,.08)+lit*sk+spec+gl*(1.-a),a);
}`;
/* выпечка cv (полуразмер R в пикселях экрана, поворот rot) со светом звезды по рельефу;
   (lx,ly) — к звезде; glow — доля своего тёплого света (станция 1, баржа 0) */
/* cv — холст или готовый мастер с мипами (gpuMipTex, 17c2): тогда lod — его уровень */
/* rel — мастер рельефа (верхний слой станции, 17c3): свет по нему, цвет и покрытие — по cv */
/* sharp — нерезкая маска между уровнями мастера (только у мастера с мипами): резкость 2D
   без ряби, как gpuImage {sharp}; lod тогда — обычный, не на ступень мельче; "dark" — флаг 4 */
/* al — прозрачность всего спрайта (0…1, по умолчанию 1): гаснущий борт светится тем же светом */
function gpuLitSprite(cv,x,y,R,s,rot,lx,ly,glow,sy,lod,rel,sharp,al,fl){
  /* GPU.rt — студия (17c2): свой проход, ровный свет без ламп и тени (нулевая t1), без газа */
  const RT=GPU.rt,pass=RT?RT.pass:gpuScene();if(!pass)return false;
  const c=RT?RT.col:(typeof starRGB==="function")?starRGB():[255,244,214],m=Math.max(1,c[0],c[1],c[2]);
  const U=new Float32Array(fl?24:16);U[0]=x;U[1]=y;U[2]=R;U[3]=s;U[4]=lx;U[5]=ly;U[6]=Math.cos(rot);U[7]=Math.sin(rot);
  U[8]=c[0]/m;U[9]=c[1]/m;U[10]=c[2]/m;U[11]=al==null?1:clamp(al,0,1);U[12]=glow;U[13]=sy||0;U[14]=lod||0;
  /* fu.v[4..5] — свет пламени у кормы (17c2): место на экране, досягаемость, сила, цвет */
  if(fl){U[16]=fl.x;U[17]=fl.y;U[18]=Math.max(fl.r,1);U[19]=fl.k;U[20]=fl.c[0];U[21]=fl.c[1];U[22]=fl.c[2];U[23]=fl.r0||0;}
  const mip=!!cv.view;if(mip&&cv.draw)gpuBakeLive(cv);   /* материал (08cd) — после возможной перепечки */
  const mt=mip&&!rel&&cv.mat;
  /* заливка газом — корпусу корабля с материалом, пока туманность 16gb этой системы жива */
  const gz=mt&&glow<0&&!RT&&typeof GNB!=="undefined"&&GNB.view&&GNB.dev===GPU.dev&&G.sys&&GNB.sys===G.sys;
  U[15]=(rel?1:0)+(sharp&&mip?2:0)+(sharp==="dark"&&mip?4:0)+(mt?8:0)+(gz?16:0);
  gpuField(pass,"gst",GST_WGSL,U,[mip?cv:gpuCanvasTex(cv),{view:RT?RT.lt:GPU.V.lt},rel||(gz?{view:GNB.view}:null),mt||null],{blend:"hull",smp:mip?gpuMipSmp():null});
  return true;
}
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
  /* сторона света — от станции к светилу: звезда системы стоит в (0,0) */
  let lx=-(S.x||0),ly=-(S.y||0);const ln=Math.hypot(lx,ly);
  if(ln<1e-6){lx=-.86;ly=-.51;}else{lx/=ln;ly/=ln;}   /* пока станция не встала на орбиту — свет слева сверху */
  const nb=(typeof bldBuiltHere==="function")?bldBuiltHere(G.sys).length:0;
  const pass=gpuScene();
  if(pass){
    /* мастер: плотность — предел зума на экране, по четверть-октавы (как у корпусов) */
    const dk=GPU.bw/W,sb=Math.pow(2,Math.ceil(Math.log2(1.5*1.7*dk)*4)/4);
    const M=stationMaster((G.sys.key||"?")+"|"+ty+"|"+nb+"|"+SCK,sb,V,S,ty,pbOnScreen(x-80*s,y-80*s,160*s,160*s,0)),R=Math.max(24,80*s);
    if(M)gpuStationDraw(M,x,y,s,lx,ly);
    GPU.oc.push([x,y,R*.5]);   /* L3: заслон звезды для барж у причала */
    /* огни станции — тёплый свет на пришвартованных: борт к станции теплеет */
    gpuLight(x,y,x,y,1,.84,.59,R*.9,.7);
  }
  /* факельная труба живёт поверх выпечки (M325): в спрайте пламя стоит по
     18 тактов, а факел — единственное на станции, что обязано плясать */
  if(ty==="indust"&&pass){
    const t=G.t*.045+V.ph,fl=6.2+Math.sin(t*1.7)*1.6+Math.sin(t*2.9+1.3)*.9,lean=Math.sin(t*1.1+.7)*1.4+Math.sin(t*2.3)*.6;
    gpuStationFlare(pass,x,y,s,t,fl,lean,V);
  }
  /* подпись уходит НИЖЕ корпуса: сорок пикселей — это внутри станции, и имя
     читалось поверх её же переборок (M242) */
  /* и растёт вместе с бортом (M443): девять пикселей при раздутом интерфейсе
     читались так же, как подписи карты до M437 */
  domLabel("st",x,y+42*s+12*uiK(),S.name.toUpperCase(),uiFont(9),"rgba(242,178,92,.6)","center");
}
