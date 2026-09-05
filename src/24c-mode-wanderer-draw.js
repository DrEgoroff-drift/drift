/* ══════════════ «Сорока» изнутри: коридор к стойке (M343) ══════════════
   Комната по правилам M74–M76: мерило — человек (хранитель ≈55 px у стойки),
   задняя стена обязательна, порядок слоёв и есть сцена, свет откуда-то.

   ПОРЯДОК СЛОЁВ: задняя стена → щель окна (край планеты поворачивается, холодные
   полосы ложатся на пол) → золотая протечка парусов на верхних витринах →
   рёбра-кольца → витрины (стекло, латунные уголки, одна вещь на сукне, своя
   ровная лампочка) → висящее на леерах (медленный дрейф, длинные периоды) →
   стойка → хранитель (тело, не палочки; шлем снят) → лампа под зелёным абажуром
   (единственный тёплый акцент) → пыль в полосах → виньетка.

   Две температуры, по одному источнику: холод — планета в щели, тепло — паруса
   сверху и лампа хранителя. Витринные лампочки — «много огней», и они ровные:
   движение — не мигание. Купленная вещь оставляет пустую витрину с меловой
   биркой: дыра и есть память. */
const WAN_C={
  wall:[34,39,46], wall2:[64,72,82], floor:[30,34,40], ceil:[24,27,33],
  brass:[201,162,74], glass:[150,196,214], cloth:[36,74,52], chalk:[232,220,190],
  gold:[211,157,52], cold:[150,196,224], lamp:[255,214,150], green:[86,140,86]
};
function wanCol(a,k){k=k==null?1:k;return "rgb("+Math.round(a[0]*k)+","+Math.round(a[1]*k)+","+Math.round(a[2]*k)+")";}
function wanRgba(a,al){return "rgba("+(a[0]|0)+","+(a[1]|0)+","+(a[2]|0)+","+(+al).toFixed(3)+")";}
/* перспектива с одной точкой схода: x,y точки на стене/полу глубины z (0 — у зрителя) */
function wanGeom(){
  const vp={x:W*.5,y:H*.46};
  const P=(x0,y0,z)=>({x:x0+(vp.x-x0)*z,y:y0+(vp.y-y0)*z});
  return {vp,P,floorY:H*.88,ceilY:H*.06,zc:.74};
}
/* витрина i: стена (чёт — левая), глубина от курсора */
function wanCaseAt(i,cursor){
  const left=(i%2===0), k=i-cursor;
  if(k<0)return null;                                   /* за спиной */
  const z=.16+k*.115;
  if(z>.68)return null;
  return {left,z,z2:z+.085};
}
function wanItemIcon(lot,cx,cy,s){
  /* вещь на сукне: инструмент — латунная штука с бликом; бумага — сложенная
     карта; свёрток — ком под сукном с биркой. Одно тело, один свет сверху-слева */
  ctx.save();ctx.translate(cx,cy);
  ctx.fillStyle="rgba(0,0,0,.35)";ctx.beginPath();ctx.ellipse(0,s*.42,s*.55,s*.12,0,0,TAU);ctx.fill();
  if(lot.fam==="paper"){
    ctx.fillStyle="#d9cfae";ctx.beginPath();ctx.moveTo(-s*.5,-s*.3);ctx.lineTo(s*.5,-s*.38);ctx.lineTo(s*.5,s*.34);ctx.lineTo(-s*.5,s*.4);ctx.closePath();ctx.fill();
    ctx.strokeStyle="rgba(90,70,40,.6)";ctx.lineWidth=1;
    for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(i*s*.25,-s*.34);ctx.lineTo(i*s*.25,s*.37);ctx.stroke();}
    ctx.strokeStyle="rgba(120,40,30,.55)";ctx.beginPath();ctx.moveTo(-s*.4,s*.1);ctx.lineTo(-s*.1,-s*.1);ctx.lineTo(s*.2,s*.05);ctx.lineTo(s*.42,-s*.2);ctx.stroke();
  }else if(lot.fam==="wild"){
    ctx.fillStyle="#3a3128";ctx.beginPath();ctx.ellipse(0,s*.05,s*.48,s*.36,0,0,TAU);ctx.fill();
    ctx.fillStyle="rgba(255,235,200,.12)";ctx.beginPath();ctx.ellipse(-s*.12,-s*.1,s*.22,s*.12,-.4,0,TAU);ctx.fill();
    ctx.fillStyle="#d9cfae";ctx.fillRect(s*.28,-s*.02,s*.22,s*.14);
    ctx.strokeStyle="rgba(120,100,70,.7)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(s*.28,s*.05);ctx.lineTo(s*.12,s*.02);ctx.stroke();
  }else{
    const r=rng(hashi(lot.ru.length,lot.id.length,0x7001));
    const wdt=s*(.5+r()*.4),hgt=s*(.25+r()*.35);
    ctx.fillStyle="#6a5221";ctx.beginPath();ctx.roundRect(-wdt/2,-hgt/2,wdt,hgt,s*.08);ctx.fill();
    ctx.fillStyle="#c9a24a";ctx.beginPath();ctx.roundRect(-wdt/2+2,-hgt/2+2,wdt-4,hgt*.45,s*.06);ctx.fill();
    ctx.fillStyle="rgba(255,240,200,.75)";ctx.fillRect(-wdt/2+4,-hgt/2+4,wdt*.3,2);
    if(r()<.5){ctx.fillStyle="#2b2f36";ctx.beginPath();ctx.arc(wdt*.25,0,hgt*.28,0,TAU);ctx.fill();}
  }
  ctx.restore();
}
function wanKeeper(x,y,h){
  /* тело, не палочки: скафандр трапецией, ранец, шлем снят и висит на крюке */
  ctx.save();ctx.translate(x,y);
  ctx.fillStyle="rgba(0,0,0,.4)";ctx.beginPath();ctx.ellipse(0,0,h*.32,h*.06,0,0,TAU);ctx.fill();
  ctx.fillStyle="#3b4148";ctx.beginPath();ctx.roundRect(-h*.30,-h*.62,h*.16,h*.42,h*.04);ctx.fill();   /* ранец за спиной */
  ctx.fillStyle="#8a9299";ctx.beginPath();
  ctx.moveTo(-h*.20,-h*.66);ctx.lineTo(h*.20,-h*.66);ctx.lineTo(h*.26,-h*.06);ctx.lineTo(-h*.26,-h*.06);ctx.closePath();ctx.fill();
  ctx.fillStyle="#5d666e";ctx.fillRect(-h*.26,-h*.2,h*.52,h*.05);
  ctx.fillStyle="rgba(255,235,200,.16)";ctx.fillRect(-h*.16,-h*.62,h*.06,h*.5);
  ctx.fillStyle="#d8b58f";ctx.beginPath();ctx.arc(0,-h*.80,h*.13,0,TAU);ctx.fill();       /* голова: шлем снят */
  ctx.fillStyle="#3a2e26";ctx.beginPath();ctx.arc(0,-h*.84,h*.13,Math.PI,TAU);ctx.fill();
  ctx.fillStyle="#8a9299";ctx.beginPath();ctx.arc(h*.42,-h*.7,h*.12,0,TAU);ctx.fill();      /* шлем на крюке */
  ctx.fillStyle="rgba(150,196,214,.6)";ctx.beginPath();ctx.ellipse(h*.42,-h*.7,h*.08,h*.06,0,0,TAU);ctx.fill();
  ctx.strokeStyle="#5d666e";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(h*.42,-h*.82);ctx.lineTo(h*.42,-h*.9);ctx.stroke();
  ctx.restore();
}
function drawWanderRoom(){
  const S=wanAll();if(!S)return;
  const g=wanGeom(),P=g.P,vp=g.vp,now=Date.now();
  const lots=wanLots();
  const sys=G.sys,pl=(sys&&sys.planets&&S.w.planetIx>=0)?sys.planets[S.w.planetIx]:null;
  const pal=(pl&&TYPES[pl.type])?TYPES[pl.type].pal:[[40,60,90],[60,90,120],[90,120,150],[120,150,180]];
  /* 1. стены, пол, потолок: тёмное основание, свет придёт слоями */
  ctx.fillStyle=wanCol(WAN_C.ceil);ctx.fillRect(0,0,W,H);
  const fl=ctx.createLinearGradient(0,vp.y,0,g.floorY);
  fl.addColorStop(0,wanCol(WAN_C.floor,.6));fl.addColorStop(1,wanCol(WAN_C.floor,1.6));
  ctx.fillStyle=fl;ctx.beginPath();ctx.moveTo(0,g.floorY);ctx.lineTo(W,g.floorY);ctx.lineTo(vp.x,vp.y);ctx.closePath();ctx.fill();
  for(const side of [0,W]){
    const wg=ctx.createLinearGradient(side,0,vp.x,0);
    wg.addColorStop(0,wanCol(WAN_C.wall2));wg.addColorStop(1,wanCol(WAN_C.wall,.75));
    ctx.fillStyle=wg;ctx.beginPath();ctx.moveTo(side,g.ceilY);ctx.lineTo(side,g.floorY);ctx.lineTo(vp.x,vp.y);ctx.closePath();ctx.fill();
  }
  /* 1a. материал (второй проход, 2026-09-05): стены — клёпаные панели со швами по
     кольцам, пол — палубные доски к точке схода с тёплым отсветом витрин, у пола
     латунная полоса. Без этого коридор читался серой коробкой. */
  for(const side of [0,W]){
    const dir=side?-1:1;
    for(let k=0;k<7;k++){                      /* вертикальные швы панелей */
      const z=.05+k*.1,a=P(side,g.ceilY,z),b=P(side,g.floorY,z);
      ctx.strokeStyle="rgba(0,0,0,.35)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      ctx.strokeStyle="rgba(255,235,200,.05)";ctx.beginPath();ctx.moveTo(a.x+dir,a.y);ctx.lineTo(b.x+dir,b.y);ctx.stroke();
      ctx.fillStyle="rgba(255,235,200,.10)";
      for(let q=0;q<5;q++){const u=.1+q*.2;ctx.fillRect(a.x+dir*3+(b.x-a.x)*u-.5,a.y+(b.y-a.y)*u-.5,1.2,1.2);}
    }
    const f0=P(side,g.floorY,0),f1=P(side,g.floorY,g.zc);   /* латунная полоса у пола */
    ctx.strokeStyle=wanRgba(WAN_C.brass,.45);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(f0.x,f0.y-1);ctx.lineTo(f1.x,f1.y-1);ctx.stroke();
  }
  ctx.save();ctx.beginPath();ctx.moveTo(0,g.floorY);ctx.lineTo(W,g.floorY);ctx.lineTo(vp.x,vp.y);ctx.closePath();ctx.clip();
  for(let k=-6;k<=6;k++){                        /* доски палубы сходятся к точке схода */
    const x0=W*.5+k*W*.085,a=P(x0,g.floorY,0),b=P(x0,g.floorY,g.zc);
    ctx.strokeStyle="rgba(0,0,0,.42)";ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    ctx.strokeStyle="rgba(255,235,200,.05)";ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(a.x+1.5,a.y);ctx.lineTo(b.x+.5,b.y);ctx.stroke();
  }
  for(let z=.04;z<g.zc;z+=.09){const a=P(0,g.floorY,z),b=P(W,g.floorY,z);ctx.strokeStyle="rgba(0,0,0,.22)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
  /* дорожка к стойке: вытертая, чуть теплее */
  {const a=P(W*.36,g.floorY,0),b=P(W*.64,g.floorY,0),c=P(W*.64,g.floorY,g.zc),d=P(W*.36,g.floorY,g.zc);
   const rg=ctx.createLinearGradient(0,a.y,0,c.y);rg.addColorStop(0,"rgba(120,60,40,.30)");rg.addColorStop(1,"rgba(120,60,40,.10)");
   ctx.fillStyle=rg;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.lineTo(d.x,d.y);ctx.closePath();ctx.fill();
   ctx.strokeStyle="rgba(201,162,74,.28)";ctx.lineWidth=1;ctx.stroke();}
  ctx.restore();
  /* задняя стена — стойка на глубине zc, стена за ней */
  const zc=g.zc,bl=P(0,g.ceilY,zc),br=P(W,g.ceilY,zc),fl2=P(0,g.floorY,zc),fr=P(W,g.floorY,zc);
  ctx.fillStyle=wanCol(WAN_C.wall,.8);ctx.fillRect(bl.x,bl.y,br.x-bl.x,fl2.y-bl.y);
  /* 2. щель окна в потолке, в перспективе (под приборами её было не видно): край
     планеты поворачивается — холодный ключ; от просветов — холодные полосы на пол */
  {
    const zA=.10,zB=.46,xa=W*.32,xb=W*.68;
    const A=P(xa,g.ceilY,zA),B=P(xb,g.ceilY,zA),C=P(xb,g.ceilY,zB),D=P(xa,g.ceilY,zB);
    ctx.save();ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.lineTo(C.x,C.y);ctx.lineTo(D.x,D.y);ctx.closePath();ctx.clip();
    ctx.fillStyle="#04060a";ctx.fillRect(0,0,W,H);
    const ph=now/240000;                                    /* оборот за четыре минуты */
    const pr=H*.55,px=W*.5+Math.sin(ph)*W*.06,py=A.y-pr*.55;
    const pg=ctx.createRadialGradient(px-pr*.3,py+pr*.4,pr*.2,px,py,pr);
    pg.addColorStop(0,wanCol(pal[Math.min(3,pal.length-1)],1.1));pg.addColorStop(.6,wanCol(pal[1]));pg.addColorStop(1,wanCol(pal[0],.6));
    ctx.fillStyle=pg;ctx.beginPath();ctx.arc(px,py,pr,0,TAU);ctx.fill();
    const tg=ctx.createLinearGradient(xa,0,xb,0);tg.addColorStop(0,"rgba(0,0,0,0)");tg.addColorStop(1,"rgba(0,0,0,.7)");
    ctx.fillStyle=tg;ctx.fillRect(0,0,W,H);
    for(let i=0;i<14;i++){const sx=A.x+((i*173+now/900)%(B.x-A.x)),sy=D.y+((i*97)%Math.max(1,(A.y-D.y)))*.7;ctx.fillStyle="rgba(220,230,240,.5)";ctx.fillRect(sx,sy,1,1);}
    ctx.restore();
    /* переплёт: рёбра вдоль и поперёк */
    ctx.strokeStyle="#0f1114";ctx.lineWidth=2.5;
    ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.lineTo(C.x,C.y);ctx.lineTo(D.x,D.y);ctx.closePath();ctx.stroke();
    for(let i=1;i<6;i++){const z=zA+(zB-zA)*i/6,l=P(xa,g.ceilY,z),r2=P(xb,g.ceilY,z);ctx.beginPath();ctx.moveTo(l.x,l.y);ctx.lineTo(r2.x,r2.y);ctx.stroke();}
    /* холодные полосы на пол: от каждого просвета — трапеция, светлее у зрителя */
    for(let i=0;i<6;i++){
      const z0=zA+(zB-zA)*(i+.15)/6,z1=zA+(zB-zA)*(i+.85)/6;
      const a0=P(W*.18,g.floorY,z0),b0=P(W*.18,g.floorY,z1),c0=P(W*.82,g.floorY,z1),d0=P(W*.82,g.floorY,z0);
      ctx.fillStyle=wanRgba(WAN_C.cold,.10+.14*(1-z0));
      ctx.beginPath();ctx.moveTo(a0.x,a0.y);ctx.lineTo(b0.x,b0.y);ctx.lineTo(c0.x,c0.y);ctx.lineTo(d0.x,d0.y);ctx.closePath();ctx.fill();
    }
  }
  /* 3. золотая протечка парусов: верх стен тёплый, к полу гаснет */
  for(const side of [0,W]){
    const gg=ctx.createLinearGradient(0,g.ceilY,0,H*.5);
    gg.addColorStop(0,wanRgba(WAN_C.gold,.38));gg.addColorStop(1,wanRgba(WAN_C.gold,0));
    ctx.fillStyle=gg;ctx.beginPath();ctx.moveTo(side,g.ceilY);ctx.lineTo(side,H*.5);ctx.lineTo(P(side,H*.5,zc).x,P(side,H*.5,zc).y);ctx.lineTo(P(side,g.ceilY,zc).x,P(side,g.ceilY,zc).y);ctx.closePath();ctx.fill();
  }
  /* 4. рёбра-кольца: отметки глубины */
  ctx.strokeStyle="rgba(120,128,140,.35)";ctx.lineWidth=1.2;
  for(let z=.08;z<zc;z+=.11){
    const a=P(0,g.ceilY,z),b=P(W,g.ceilY,z),c=P(W,g.floorY,z),d=P(0,g.floorY,z);
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.lineTo(d.x,d.y);ctx.closePath();ctx.stroke();
  }
  /* 5. витрины: по стенам, ближняя — текущая */
  const cur=clamp(S.cursor,0,Math.max(0,lots.length-1));
  for(let i=lots.length-1;i>=0;i--){
    const cs=wanCaseAt(i,cur);if(!cs)continue;
    const lot=lots[i],side=cs.left?0:W;
    const yTop=H*.24,yBot=H*.70;
    const a=P(side,yTop,cs.z),b=P(side,yTop,cs.z2),c=P(side,yBot,cs.z2),d=P(side,yBot,cs.z);
    /* глубина — тоном: ближняя ярче */
    const lit=1-cs.z*.9;
    /* корпус витрины: тёмное дерево шире стекла, потом сукно, потом стекло */
    const ex=(d.y-a.y)*.05;
    ctx.fillStyle="#1a1612";
    ctx.beginPath();ctx.moveTo(a.x-ex,a.y-ex);ctx.lineTo(b.x+ex,b.y-ex);ctx.lineTo(c.x+ex,c.y+ex);ctx.lineTo(d.x-ex,d.y+ex);ctx.closePath();ctx.fill();
    ctx.fillStyle=wanCol(WAN_C.cloth,.75+lit*.7);
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.lineTo(d.x,d.y);ctx.closePath();ctx.fill();
    /* полка под вещью */
    const sy=a.y+(d.y-a.y)*.72,sy2=b.y+(c.y-b.y)*.72;
    ctx.strokeStyle="rgba(201,162,74,"+(.35+lit*.4).toFixed(2)+")";ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(a.x,sy);ctx.lineTo(b.x,sy2);ctx.stroke();
    /* стекло: холодный отсвет сверху */
    const gl=ctx.createLinearGradient(0,a.y,0,d.y);gl.addColorStop(0,wanRgba(WAN_C.glass,.22*lit));gl.addColorStop(.5,wanRgba(WAN_C.glass,.04));gl.addColorStop(1,wanRgba(WAN_C.glass,.10*lit));
    ctx.fillStyle=gl;ctx.fill();
    ctx.strokeStyle=wanRgba(WAN_C.brass,.5+lit*.5);ctx.lineWidth=i===cur?2.5:1.2;ctx.stroke();
    /* латунные уголки */
    ctx.fillStyle=wanCol(WAN_C.brass,.6+lit*.5);
    for(const q of [a,b,c,d]){ctx.fillRect(q.x-2,q.y-2,4,4);}
    /* своя лампочка — ровная, у верхней кромки */
    const lx=(a.x+b.x)/2,ly=a.y+6;
    if(!lot.empty){
      const lg=ctx.createRadialGradient(lx,ly,0,lx,ly,28*lit+6);
      lg.addColorStop(0,wanRgba(WAN_C.lamp,.55));lg.addColorStop(1,wanRgba(WAN_C.lamp,0));
      ctx.fillStyle=lg;ctx.beginPath();ctx.arc(lx,ly,28*lit+6,0,TAU);ctx.fill();
      ctx.fillStyle="#fff2d6";ctx.beginPath();ctx.arc(lx,ly,1.4,0,TAU);ctx.fill();
    }
    const cx=(a.x+b.x+c.x+d.x)/4,cy=a.y+(d.y-a.y)*.52,sz=(d.y-a.y)*.42;
    if(lot.empty||lot.gone){
      /* меловая бирка вместо вещи */
      ctx.save();ctx.translate(cx,cy);ctx.rotate(cs.left?.06:-.06);
      ctx.fillStyle="rgba(232,220,190,.10)";ctx.fillRect(-sz*.5,-sz*.18,sz,sz*.36);
      ctx.strokeStyle="rgba(232,220,190,.45)";ctx.lineWidth=1;ctx.strokeRect(-sz*.5,-sz*.18,sz,sz*.36);
      ctx.fillStyle=wanRgba(WAN_C.chalk,.75);ctx.font=Math.max(7,sz*.16)+"px ui-monospace,monospace";ctx.textAlign="center";
      ctx.fillText(lot.gone?"продано":"пусто",0,sz*.05);
      ctx.restore();
    }else{
      wanItemIcon(lot,cx,cy,sz*1.15);
      /* меловая цена под полкой: спички — та валюта, ради которой сюда пришли */
      if(lot.pay&&lot.pay.m){
        const ty=(sy+sy2)/2+(d.y-a.y)*.12,tx=(a.x+b.x)/2;
        ctx.fillStyle=wanRgba(WAN_C.chalk,.55+lit*.35);ctx.font=Math.max(7,Math.min(13,sz*.12))+"px ui-monospace,monospace";ctx.textAlign="center";
        ctx.fillText(lot.pay.m+" сп.",tx,ty);
      }
    }
  }
  /* 6. висящее на леерах: дрейф с длинными периодами, никогда не мигает */
  const rr=rng(hashi(S.seed,3,0x4A9));
  for(let i=0;i<5;i++){
    const z=.12+rr()*.5,x0=W*(.3+rr()*.4),len=H*(.05+rr()*.07);
    const dx=Math.sin(now/(23000+i*4000)+i)*3,pt=P(x0,g.ceilY,z);
    ctx.strokeStyle="rgba(180,170,150,.35)";ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(pt.x,pt.y);ctx.lineTo(pt.x+dx,pt.y+len*(1-z));ctx.stroke();
    const k=rr();ctx.fillStyle=k<.4?"#3a3128":(k<.7?"#4a4a4a":"#6a5221");
    const s2=(6+rr()*8)*(1-z);
    if(k<.7){ctx.beginPath();ctx.ellipse(pt.x+dx,pt.y+len*(1-z)+s2*.5,s2*.7,s2,0,0,TAU);ctx.fill();}
    else{ctx.strokeStyle="#6a5221";ctx.lineWidth=1;ctx.strokeRect(pt.x+dx-s2*.5,pt.y+len*(1-z),s2,s2*1.3);}   /* клетка */
  }
  /* 6a. за стойкой — тёмно-красный занавес с сорокой и полки с банками: задней
     стене нужно лицо, иначе точка схода — серая дыра */
  {
    const a=P(W*.22,g.ceilY,zc),b=P(W*.78,g.ceilY,zc),c=P(W*.78,g.floorY,zc),d=P(W*.22,g.floorY,zc);
    const cg=ctx.createLinearGradient(0,a.y,0,c.y);cg.addColorStop(0,"#3a1a1a");cg.addColorStop(.5,"#552323");cg.addColorStop(1,"#2a1212");
    ctx.fillStyle=cg;ctx.fillRect(a.x,a.y,b.x-a.x,c.y-a.y);
    ctx.strokeStyle="rgba(0,0,0,.35)";ctx.lineWidth=1;
    for(let i=1;i<9;i++){const x=a.x+(b.x-a.x)*i/9;ctx.beginPath();ctx.moveTo(x,a.y);ctx.quadraticCurveTo(x+3,(a.y+c.y)/2,x,c.y);ctx.stroke();}
    /* сорока: чёрно-белая птица одним силуэтом, хвост длинный */
    const mx=(a.x+b.x)/2,my=a.y+(c.y-a.y)*.30,ms=(c.y-a.y)*.16;
    ctx.fillStyle="#efe7d6";ctx.beginPath();ctx.ellipse(mx,my,ms*.55,ms*.32,-.2,0,TAU);ctx.fill();
    ctx.fillStyle="#141416";ctx.beginPath();ctx.ellipse(mx-ms*.1,my-ms*.12,ms*.5,ms*.2,-.25,0,TAU);ctx.fill();
    ctx.beginPath();ctx.arc(mx+ms*.55,my-ms*.2,ms*.16,0,TAU);ctx.fill();
    ctx.beginPath();ctx.moveTo(mx-ms*.5,my);ctx.lineTo(mx-ms*1.35,my+ms*.55);ctx.lineTo(mx-ms*.45,my+ms*.18);ctx.closePath();ctx.fill();
    ctx.fillStyle="#d9a43a";ctx.beginPath();ctx.moveTo(mx+ms*.68,my-ms*.2);ctx.lineTo(mx+ms*.9,my-ms*.14);ctx.lineTo(mx+ms*.68,my-ms*.1);ctx.closePath();ctx.fill();
    /* полки с банками по бокам занавеса */
    for(const sx of [W*.16,W*.84]){
      for(let r2=0;r2<3;r2++){
        const y=a.y+(c.y-a.y)*(.30+r2*.18),p0=P(sx-W*.05,y,zc),p1=P(sx+W*.05,y,zc);
        ctx.fillStyle="#3a2a1c";ctx.fillRect(p0.x,p0.y,p1.x-p0.x,3);
        for(let j=0;j<4;j++){const jx=p0.x+(p1.x-p0.x)*(j+.5)/4,jh=6+((j*7+r2*3)%5);
          ctx.fillStyle=j%2?"rgba(150,196,214,.35)":"rgba(201,162,74,.45)";ctx.fillRect(jx-3,p0.y-jh,6,jh);
          ctx.fillStyle="rgba(255,235,200,.35)";ctx.fillRect(jx-2,p0.y-jh,1,jh*.7);}
      }
    }
  }
  /* 7. стойка и хранитель у точки схода */
  {
    const cl=P(W*.30,g.floorY,zc-.06),cr=P(W*.70,g.floorY,zc-.06),ctop=cl.y-H*.075;
    ctx.fillStyle="#2a2622";ctx.fillRect(cl.x,ctop,cr.x-cl.x,cl.y-ctop);
    ctx.fillStyle="rgba(255,235,200,.10)";ctx.fillRect(cl.x,ctop,cr.x-cl.x,3);
    ctx.strokeStyle="rgba(0,0,0,.6)";ctx.lineWidth=1;ctx.strokeRect(cl.x,ctop,cr.x-cl.x,cl.y-ctop);
    const kh=Math.round(H*.07)+55*0;                      /* человек ≈55 px на этой глубине */
    wanKeeper((cl.x+cr.x)/2+kh*.3,ctop+kh*.02,Math.max(48,kh));
    /* гроссбух под лампой */
    ctx.fillStyle="#d9cfae";ctx.fillRect((cl.x+cr.x)/2-kh*.5,ctop-3,kh*.5,kh*.12);
    /* 8. лампа под зелёным абажуром — единственный тёплый акцент кадра */
    const lx=(cl.x+cr.x)/2-kh*.2,ly=ctop-kh*.55;
    ctx.strokeStyle="#1a1d22";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(lx,ly);ctx.lineTo(lx,ly-H*.2);ctx.stroke();
    ctx.fillStyle=wanCol(WAN_C.green,.9);ctx.beginPath();ctx.moveTo(lx-kh*.36,ly+kh*.08);ctx.lineTo(lx+kh*.36,ly+kh*.08);ctx.lineTo(lx+kh*.16,ly-kh*.14);ctx.lineTo(lx-kh*.16,ly-kh*.14);ctx.closePath();ctx.fill();
    const wg=ctx.createRadialGradient(lx,ly+kh*.1,0,lx,ly+kh*.1,kh*1.6);
    wg.addColorStop(0,"rgba(255,214,150,.55)");wg.addColorStop(.5,"rgba(255,200,130,.16)");wg.addColorStop(1,"rgba(255,180,100,0)");
    ctx.fillStyle=wg;ctx.beginPath();ctx.arc(lx,ly+kh*.1,kh*1.6,0,TAU);ctx.fill();
    ctx.fillStyle="#fff3d8";ctx.beginPath();ctx.ellipse(lx,ly+kh*.1,kh*.12,kh*.04,0,0,TAU);ctx.fill();
  }
  /* 8a. у стен на полу — тюки и ящики, чтобы пол не был пустым до самой стойки */
  {
    const rr2=rng(hashi(S.seed,7,0xC4A7));
    for(let i=0;i<6;i++){
      const left=i%2===0,z=.12+rr2()*.5,sx=left?W*(.04+rr2()*.03):W*(.93+rr2()*.03);
      const p0=P(sx,g.floorY,z),sc=(1-z)*H*.09,wd=sc*(1+rr2()*.6),ht=sc*(.6+rr2()*.5);
      const crate=rr2()<.5;
      ctx.fillStyle="rgba(0,0,0,.4)";ctx.beginPath();ctx.ellipse(p0.x,p0.y,wd*.7,ht*.14,0,0,TAU);ctx.fill();
      if(crate){ctx.fillStyle="#2a2622";ctx.fillRect(p0.x-wd/2,p0.y-ht,wd,ht);ctx.fillStyle="rgba(255,235,200,.12)";ctx.fillRect(p0.x-wd/2,p0.y-ht,wd,2);
        ctx.strokeStyle="rgba(0,0,0,.5)";ctx.lineWidth=1;ctx.strokeRect(p0.x-wd/2,p0.y-ht,wd,ht);
        ctx.strokeStyle="rgba(201,162,74,.3)";ctx.beginPath();ctx.moveTo(p0.x-wd/2,p0.y-ht);ctx.lineTo(p0.x+wd/2,p0.y);ctx.stroke();}
      else{ctx.fillStyle="#3a3128";ctx.beginPath();ctx.ellipse(p0.x,p0.y-ht*.5,wd*.55,ht*.5,0,0,TAU);ctx.fill();
        ctx.fillStyle="rgba(255,235,200,.10)";ctx.beginPath();ctx.ellipse(p0.x-wd*.12,p0.y-ht*.7,wd*.25,ht*.15,-.3,0,TAU);ctx.fill();
        ctx.strokeStyle="rgba(200,190,160,.3)";ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(p0.x-wd*.5,p0.y-ht*.5);ctx.lineTo(p0.x+wd*.5,p0.y-ht*.5);ctx.stroke();}
    }
  }
  /* 9. пыль в холодных полосах */
  ctx.fillStyle="rgba(200,220,235,.35)";
  for(let i=0;i<40;i++){const h=hashi(i,S.seed,0xD057);const x=W*.2+((h&1023)/1023)*W*.6,y=H*.5+(((h>>10)&1023)/1023)*H*.36+Math.sin(now/7000+i)*3;ctx.fillRect(x,y,1,1);}
  /* 10. вспышка спички хранителя — последний час, один раз */
  if(S.flashT){const u=(now-S.flashT)/1500;if(u<1){ctx.fillStyle="rgba(255,226,170,"+(.5*(1-u)).toFixed(3)+")";ctx.fillRect(0,0,W,H);}}
  /* 11. виньетка */
  const vg=ctx.createRadialGradient(W*.5,H*.5,H*.25,W*.5,H*.5,H*.85);
  vg.addColorStop(0,"rgba(0,0,0,0)");vg.addColorStop(1,"rgba(0,0,0,.5)");
  ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
}
