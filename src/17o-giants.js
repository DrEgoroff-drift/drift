/* ══════════════ по великану на рукав (M464, DESIGN-life) ══════════════
   У каждого рукава и у ядра — одно колоссальное сооружение, в 20–50 раз
   больше корабля, названное голосом галактики. Место — география, а не
   война: земли держав ходят по летописи, великан стоит, где стоял. Шесть —
   по кругу диска на 18–26 секторах (у звезды, ближайшей к расчётной точке),
   седьмой — полая луна у ядра. На карте — ориентир с именем, в системе —
   само тело, далеко от звезды. Мир не трогается: только starAt, без бросков.
   (Кольцо, M154, — не из их числа.) */
const GIANTS_DEF=[
  {k:"moon",  by:null,ru:"Полая луна «Гнездо»",   note:"в недрах — шахтёрский посёлок, огни кольцами"},
  {k:"house", by:"gt",ru:"Дом водителя",          note:"гостиница ГЛАВТРАССЫ размером со станцию"},
  {k:"cyl",   by:"co",ru:"Цилиндр Компании",      note:"логотип во всю длину, видно с соседних систем"},
  {k:"customs",by:"or",ru:"Таможенный город",     note:"каждое здание — форма"},
  {k:"dock",  by:"km",ru:"Сухой док Коммуны",     note:"один корпус строят триста лет"},
  {k:"town",  by:"ra",ru:"Посёлок в камнях",      note:"город Рассвета врос в пояс"},
  {k:"garden",by:"hf",ru:"Сад ретрансляторов",    note:"лес мачт Хай-Фронта, мигает вразнобой"}
];
let GIANTS=null;
function giantsAll(){
  if(GIANTS)return GIANTS;
  GIANTS=[];
  GIANTS_DEF.forEach((D,i)=>{
    const a=i?(i-1)*Math.PI/3+.35:0,R=i?18+((i*37)%9):3;
    const tx=Math.round(Math.cos(a)*R),ty=Math.round(Math.sin(a)*R);
    let best=null,bd=1e9;
    for(let dx=-4;dx<=4;dx++)for(let dy=-4;dy<=4;dy++){
      const sx=tx+dx,sy=ty+dy;if(!starAt(sx,sy))continue;
      const d=dx*dx+dy*dy;if(d<bd){bd=d;best=[sx,sy];}
    }
    if(best)GIANTS.push({...D,sx:best[0],sy:best[1],seed:hashi(best[0],best[1],0x61A7)>>>0});
  });
  return GIANTS;
}
function giantAt(sx,sy){for(const g of giantsAll())if(g.sx===sx&&g.sy===sy)return g;return null;}
/* в системе: далеко от звезды, по зерну */
function giantPos(g){const a=(g.seed%628)/100,R=2600;return {x:Math.cos(a)*R,y:Math.sin(a)*R,a};}
/* ── карта: у каждого великана свой значок (D26) ── */
function giantMapGlyph(k,x,y,r){
  ctx.beginPath();
  if(k==="moon"){ctx.arc(x,y,r,0,TAU);ctx.moveTo(x+r*.5,y-r*.15);ctx.arc(x+r*.15,y-r*.15,r*.35,0,TAU);}
  else if(k==="house"){ctx.rect(x-r*1.3,y-r*.6,r*2.6,r*1.2);for(let i=-1;i<=1;i++){ctx.moveTo(x+i*r*.7,y-r*.2);ctx.lineTo(x+i*r*.7,y+r*.2);}}
  else if(k==="cyl"){ctx.roundRect(x-r*1.5,y-r*.45,r*3,r*.9,r*.45);}
  else if(k==="customs"){for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)ctx.rect(x+i*r*.8-r*.25,y+j*r*.8-r*.25,r*.5,r*.5);}
  else if(k==="dock"){ctx.rect(x-r*1.4,y-r*.6,r*2.8,r*1.2);ctx.moveTo(x+r*.8,y);ctx.arc(x,y,r*.8,0,Math.PI);}
  else if(k==="town"){for(let i=-1;i<=1;i++){ctx.moveTo(x+i*r*.8-r*.4,y+r*.5);ctx.lineTo(x+i*r*.8,y-r*.5+Math.abs(i)*r*.3);ctx.lineTo(x+i*r*.8+r*.4,y+r*.5);}}
  else{for(let i=-1;i<=1;i++){ctx.moveTo(x+i*r*.7,y+r*.7);ctx.lineTo(x+i*r*.7,y-r*.7+Math.abs(i)*r*.4);ctx.moveTo(x+i*r*.7-r*.25,y-r*.2);ctx.lineTo(x+i*r*.7+r*.25,y-r*.2);}}
  ctx.stroke();
}
function drawGiantsMap(V,cell){
  const vx=V.x,vy=V.y;
  ctx.save();ctx.textAlign="center";
  for(const g of giantsAll()){
    const x=W/2+(g.sx-vx)*cell,y=H/2+(g.sy-vy)*cell;
    if(x<-60||x>W+60||y<-60||y>H+60)continue;
    const r=Math.max(4,cell*.26);
    ctx.strokeStyle="rgba(240,220,170,.9)";ctx.lineWidth=1.3;ctx.lineJoin="round";
    giantMapGlyph(g.k,x,y,r);
    if(cell>=10){ctx.fillStyle="rgba(240,220,170,.9)";ctx.font=(typeof uiFont==="function")?uiFont(9):"9px monospace";ctx.fillText(g.ru.toUpperCase(),x,y+r*1.9+11);}   /* под знаком: над ним — имя системы */
  }
  ctx.restore();
}
/* ── система: само тело (D26, 18.09) ──
   Первый проход клал плоские фигуры — «наклейки». Тело печётся один раз на
   великана по правилам помещений: масса → обвод → подробность в рост
   человека → ОДИН свет последним слоем (source-atop, со стороны звезды).
   Живое (огни, что бегут или мигают) — поверх выпечки каждый кадр. Размер —
   в единицах мира: печём в 1 px на единицу, кладём с масштабом. */
const GIANT_CV={};
function giantLightAng(g){const P=giantPos(g);return Math.atan2(-P.y,-P.x);}   /* к звезде — она в (0,0) */
function giantBake(g){
  if(GIANT_CV[g.k])return GIANT_CV[g.k];
  const Wc=1500,Hc=900,cv=document.createElement("canvas");cv.width=Wc;cv.height=Hc;
  const c=cv.getContext("2d");c.translate(Wc/2,Hc/2);
  const r=rng(g.seed),la=giantLightAng(g),lx=Math.cos(la),ly=Math.sin(la);
  const win=(x,y,w,h,a)=>{c.fillStyle="rgba(255,214,150,"+a+")";c.fillRect(x,y,w,h);};
  const seams=(x0,y0,w,h,step)=>{c.strokeStyle="rgba(0,0,0,.28)";c.lineWidth=1.5;c.beginPath();
    for(let x=x0+step;x<x0+w;x+=step){c.moveTo(x,y0);c.lineTo(x,y0+h);}
    for(let y=y0+step;y<y0+h;y+=step){c.moveTo(x0,y);c.lineTo(x0+w,y);}c.stroke();};
  const rivets=(x0,y0,w,h,step)=>{c.fillStyle="rgba(255,255,255,.10)";
    for(let x=x0+step/2;x<x0+w;x+=step)for(let y=y0+step/2;y<y0+h;y+=step){c.beginPath();c.arc(x,y,2,0,TAU);c.fill();}};
  if(g.k==="moon"){
    const R=520;
    const sp=c.createRadialGradient(lx*R*.5,ly*R*.5,R*.1,0,0,R);   /* шар: светлая сторона к звезде */
    sp.addColorStop(0,"#5a5148");sp.addColorStop(.6,"#3a342e");sp.addColorStop(1,"#17150f");
    c.fillStyle=sp;c.beginPath();c.arc(0,0,R,0,TAU);c.fill();
    for(let i=0;i<26;i++){const a=r()*TAU,d=r()*R*.9,cr=8+r()*50,x=Math.cos(a)*d,y=Math.sin(a)*d;   /* кратеры: тень внутри, светлый вал с солнечной стороны */
      c.fillStyle="rgba(0,0,0,.35)";c.beginPath();c.ellipse(x,y,cr,cr*.8,a,0,TAU);c.fill();
      c.strokeStyle="rgba(255,235,200,.22)";c.lineWidth=2;c.beginPath();c.arc(x-lx*cr*.15,y-ly*cr*.15,cr,la+Math.PI*.6,la+Math.PI*1.4);c.stroke();}
    const mx=R*.2,my=-R*.1,mr=R*.42;                                /* устье полости */
    c.fillStyle="#070605";c.beginPath();c.arc(mx,my,mr,0,TAU);c.fill();
    c.strokeStyle="rgba(255,214,150,.35)";c.lineWidth=6;c.beginPath();c.arc(mx,my,mr,0,TAU);c.stroke();   /* обрез устья — освещён изнутри */
    for(let k=1;k<=4;k++){c.strokeStyle="rgba(255,214,150,"+(.55-k*.09)+")";c.lineWidth=2.5;c.beginPath();c.arc(mx,my,mr*.22*k,0,TAU);c.stroke();   /* ярусы посёлка кольцами вглубь */
      c.fillStyle="rgba(255,214,150,.8)";for(let i=0;i<10*k;i++){const a=i/(10*k)*TAU+k;c.beginPath();c.arc(mx+Math.cos(a)*mr*.22*k,my+Math.sin(a)*mr*.22*k,1.6,0,TAU);c.fill();}}
    for(let i=0;i<12;i++){c.fillStyle="rgba(255,214,150,.9)";c.fillRect(mx+mr*1.05+i*7,my-mr*.1,3,3);}   /* посадочная полоса у устья — в рост корабля */
  }else if(g.k==="house"){
    const w=900,h=420;
    c.fillStyle="#3d3833";c.fillRect(-w/2,-h/2,w,h);
    c.fillStyle="#2c2824";c.fillRect(-w/2,-h/2,w,26);c.fillRect(-w/2,h/2-30,w,30);   /* цоколь и карниз */
    seams(-w/2,-h/2+26,w,h-56,60);rivets(-w/2,-h/2+26,w,h-56,60);
    for(let i=0;i<30;i++)for(let j=0;j<9;j++){const on=r();if(on<.62)win(-w/2+18+i*29.5,-h/2+40+j*38,14,22,on<.15?.35:.85);}   /* окна: горят не все, одни тусклее */
    c.fillStyle="#1f1b18";c.fillRect(-w/2-40,-h/2-70,w+80,64);                         /* вывеска на крыше */
    c.strokeStyle="rgba(255,214,150,.5)";c.lineWidth=2;c.strokeRect(-w/2-40,-h/2-70,w+80,64);
    c.fillStyle="#f2c98a";c.font="bold 44px ui-monospace,monospace";c.textAlign="center";c.textBaseline="middle";c.fillText("ДОМ ВОДИТЕЛЯ",0,-h/2-38);
    for(let i=0;i<40;i++){c.fillStyle="rgba(255,240,200,"+(.6+.4*(i%2))+")";c.beginPath();c.arc(-w/2-30+i*(w+60)/39,-h/2-72,2.5,0,TAU);c.fill();}   /* лампочки по кромке */
    for(let i=0;i<16;i++){c.fillStyle="#6a6560";c.fillRect(-w/2+30+i*54,h/2+8,22,9);c.fillStyle="rgba(127,230,216,.7)";c.fillRect(-w/2+30+i*54+9,h/2+9,3,3);}   /* стоянка: корабли в рост, у каждого огонёк */
    c.strokeStyle="rgba(255,255,255,.12)";c.lineWidth=1;c.beginPath();for(let i=0;i<=16;i++){c.moveTo(-w/2+24+i*54,h/2+2);c.lineTo(-w/2+24+i*54,h/2+22);}c.stroke();
  }else if(g.k==="cyl"){
    const w=1400,h=260;
    const cy=c.createLinearGradient(0,-h/2,0,h/2);cy.addColorStop(0,"#5d6168");cy.addColorStop(.35,"#eef0f3");cy.addColorStop(.8,"#8a8e96");cy.addColorStop(1,"#3a3d43");   /* цилиндр: блик вдоль оси */
    c.fillStyle=cy;c.beginPath();c.roundRect(-w/2,-h/2,w,h,h/2);c.fill();
    c.fillStyle="rgba(0,0,0,.25)";c.beginPath();c.ellipse(-w/2+h/2,0,h*.18,h/2,0,0,TAU);c.fill();c.beginPath();c.ellipse(w/2-h/2,0,h*.18,h/2,0,0,TAU);c.fill();   /* торцы */
    c.strokeStyle="rgba(0,0,0,.18)";c.lineWidth=2;c.beginPath();for(let x=-w/2+120;x<w/2-100;x+=120){c.moveTo(x,-h/2+6);c.lineTo(x,h/2-6);}c.stroke();   /* обручи */
    c.fillStyle="#2f6fd0";c.font="bold 150px sans-serif";c.textAlign="center";c.textBaseline="middle";c.fillText("КОМПАНИЯ™",0,4);
    for(let i=0;i<70;i++){win(-w/2+80+i*18,h/2-40,6,5,.7);}                            /* ряд иллюминаторов по нижнему поясу */
    c.fillStyle="#3a3d43";c.fillRect(-40,h/2,80,50);c.fillStyle="rgba(127,230,216,.8)";c.fillRect(-6,h/2+48,12,6);   /* причальный узел */
  }else if(g.k==="customs"){
    c.strokeStyle="rgba(120,110,95,.35)";c.lineWidth=14;c.beginPath();for(let i=-3;i<=3;i++){c.moveTo(i*170,-380);c.lineTo(i*170,380);c.moveTo(-620,i*110);c.lineTo(620,i*110);}c.stroke();   /* улицы-линейки */
    for(let i=0;i<48;i++){const bx=Math.round((r()-.5)*1100/170)*170-60,by=Math.round((r()-.5)*640/110)*110-40,bw=60+r()*50,bh=40+r()*55;
      c.fillStyle="#d9d4c4";c.fillRect(bx,by,bw,bh);
      c.fillStyle="rgba(0,0,0,.3)";c.fillRect(bx+bw-8,by,8,bh);c.fillRect(bx,by+bh-6,bw,6);         /* тень стены с одной стороны — все дома в одном свете */
      c.strokeStyle="#6a6458";c.lineWidth=1.2;c.beginPath();for(let l=1;l<5;l++){c.moveTo(bx+5,by+bh*l/5);c.lineTo(bx+bw-12,by+bh*l/5);}c.stroke();   /* здание-форма в линейку */
      c.fillStyle="rgba(180,40,40,.85)";c.fillRect(bx+bw-22,by+6,10,10);}                          /* печать в углу каждого */
    c.fillStyle="#b8b2a2";c.fillRect(-130,-50,260,100);c.fillStyle="#3a3630";c.font="bold 40px ui-monospace,monospace";c.textAlign="center";c.textBaseline="middle";c.fillText("ТАМОЖНЯ",0,0);
    for(let i=0;i<9;i++){c.fillStyle=i%2?"#e8b830":"#161a20";c.fillRect(-130+i*29,50,29,10);}       /* шлагбаум у входа — в рост корабля */
  }else if(g.k==="dock"){
    const w=1300,h=380;
    c.fillStyle="#2a2723";c.fillRect(-w/2,-h/2,w,h);                                       /* настил */
    seams(-w/2,-h/2,w,h,100);
    c.strokeStyle="#8a8070";c.lineWidth=10;c.strokeRect(-w/2,-h/2,w,h);
    c.lineWidth=4;c.beginPath();for(let i=1;i<14;i++){c.moveTo(-w/2+w*i/14,-h/2);c.lineTo(-w/2+w*i/14,h/2);}c.stroke();   /* фермы */
    const hg=c.createLinearGradient(0,-h*.22,0,h*.22);hg.addColorStop(0,"#6c665e");hg.addColorStop(.5,"#4a4640");hg.addColorStop(1,"#26231f");
    c.fillStyle=hg;c.beginPath();c.ellipse(-w*.05,0,w*.38,h*.22,0,0,TAU);c.fill();          /* корпус, которому триста лет */
    c.strokeStyle="rgba(200,190,170,.5)";c.lineWidth=2;c.beginPath();for(let i=0;i<14;i++){const x=-w*.05+w*.38*(i/13*2-1)*.92;const yy=h*.22*Math.sqrt(Math.max(0,1-Math.pow((x+w*.05)/(w*.38),2)));c.moveTo(x,-yy);c.lineTo(x,yy);}c.stroke();   /* шпангоуты */
    c.fillStyle="#2a2723";c.beginPath();c.ellipse(-w*.05+w*.19,0,w*.19,h*.2,0,0,TAU);c.fill();c.strokeStyle="rgba(200,190,170,.4)";c.lineWidth=2;c.beginPath();for(let i=0;i<7;i++){const x=-w*.05+w*.02+i*w*.055;c.moveTo(x,-h*.19);c.lineTo(x,h*.19);}c.stroke();   /* половина без обшивки */
    for(let i=0;i<6;i++){const x=-w/2+80+i*230;c.fillStyle="#9a9080";c.fillRect(x,-h/2-40,14,40);c.fillRect(x-30,-h/2-44,74,8);c.fillStyle="rgba(255,214,150,.9)";c.fillRect(x+40,-h/2-42,4,4);}   /* краны с огнём — в рост человека */
    for(let i=0;i<40;i++){c.fillStyle="rgba(255,214,150,"+(.3+.5*r())+")";c.fillRect(-w/2+20+r()*(w-40),h/2-14,3,3);}   /* сварка/окна по кромке */
  }else if(g.k==="town"){
    for(let i=0;i<26;i++){const bx=(r()-.5)*1100,by=(r()-.5)*700,br=40+r()*110,n=6+(r()*4|0);
      c.beginPath();for(let k=0;k<n;k++){const a=k/n*TAU,rr=br*(.75+r()*.35);c.lineTo(bx+Math.cos(a)*rr,by+Math.sin(a)*rr);}c.closePath();
      const rg=c.createRadialGradient(bx+lx*br*.4,by+ly*br*.4,br*.1,bx,by,br);rg.addColorStop(0,"#5a5045");rg.addColorStop(1,"#241f1a");   /* камень: свет с одной стороны */
      c.fillStyle=rg;c.fill();c.strokeStyle="rgba(0,0,0,.5)";c.lineWidth=2;c.stroke();
      for(let l=0;l<5;l++)if(r()<.7)win(bx+(r()-.5)*br*.9,by+(r()-.5)*br*.9,5,4,.85);}    /* окна, врезанные в камень */
    c.strokeStyle="rgba(255,214,150,.25)";c.lineWidth=3;c.beginPath();c.moveTo(-520,120);c.quadraticCurveTo(-100,-160,420,60);c.stroke();   /* улица между камнями */
    for(let i=0;i<14;i++){const t=i/13,x=(1-t)*(1-t)*-520+2*(1-t)*t*-100+t*t*420,y=(1-t)*(1-t)*120+2*(1-t)*t*-160+t*t*60;c.fillStyle="rgba(255,240,200,.95)";c.beginPath();c.arc(x,y-6,2.2,0,TAU);c.fill();}   /* фонари вдоль неё */
  }else if(g.k==="garden"){
    c.fillStyle="#2b3038";c.fillRect(-600,-380,1200,760);seams(-600,-380,1200,760,120);rivets(-600,-380,1200,760,120);   /* платформа под лесом мачт */
    for(let i=0;i<60;i++){const bx=(r()-.5)*1100,by=(r()-.5)*700,hh=80+r()*260;
      c.strokeStyle="rgba(0,0,0,.45)";c.lineWidth=3;c.beginPath();c.moveTo(bx+3,by+3);c.lineTo(bx+3,by-hh+3);c.stroke();   /* тень мачты на настиле */
      c.strokeStyle="#9aa6b4";c.lineWidth=2;c.beginPath();c.moveTo(bx,by);c.lineTo(bx,by-hh);c.stroke();
      c.strokeStyle="rgba(154,166,180,.7)";c.lineWidth=1.5;c.beginPath();for(let k=1;k<4;k++){c.moveTo(bx-8,by-hh*k/4);c.lineTo(bx+8,by-hh*k/4);}c.stroke();   /* траверсы */
      c.fillStyle="#3a4148";c.fillRect(bx-6,by-4,12,8);}                                    /* башмак */
    c.fillStyle="#4a5260";c.fillRect(-60,-30,120,60);c.fillStyle="rgba(140,220,255,.7)";c.fillRect(-50,-20,100,8);   /* аппаратная посреди леса */
  }
  /* один свет на всю выпечку последним слоем — со стороны звезды */
  c.globalCompositeOperation="source-atop";
  const L=c.createLinearGradient(lx*700,ly*450,-lx*700,-ly*450);
  L.addColorStop(0,"rgba(255,235,205,.20)");L.addColorStop(.45,"rgba(0,0,0,0)");L.addColorStop(1,"rgba(0,0,10,.42)");
  c.fillStyle=L;c.fillRect(-Wc/2,-Hc/2,Wc,Hc);
  c.globalCompositeOperation="source-over";
  return GIANT_CV[g.k]={cv,w:Wc,h:Hc};
}
function drawGiant(zx,zy,Z){
  const g=giantAt(G.sx,G.sy);if(!g)return;
  const P=giantPos(g),x=zx(P.x),y=zy(P.y),S=Z;
  const span=900*S;
  if(x<-span||x>W+span||y<-span||y>H+span)return;
  const B=giantBake(g),t=G.t/60;
  ctx.drawImage(B.cv,x-B.w/2*S,y-B.h/2*S,B.w*S,B.h*S);
  /* живое — поверх выпечки */
  ctx.save();ctx.translate(x,y);
  if(g.k==="garden"){
    const r=rng(g.seed);
    for(let i=0;i<60;i++){const bx=(r()-.5)*1100,by=(r()-.5)*700,hh=80+r()*260;
      const on=((t*2+i*.37)%1)<.5;ctx.fillStyle=on?"rgba(140,220,255,.95)":"rgba(60,90,110,.6)";
      ctx.beginPath();ctx.arc(bx*S,(by-hh)*S,Math.max(1.5,5*S),0,TAU);ctx.fill();}
  }else if(g.k==="moon"){
    const R=520,mx=R*.2,my=-R*.1,mr=R*.42,k=.5+.5*Math.sin(t*1.3);   /* маяк у устья дышит */
    ctx.fillStyle="rgba(255,214,150,"+(.3+.6*k)+")";ctx.beginPath();ctx.arc((mx+mr*1.05)*S,(my-mr*.1)*S,Math.max(1.5,6*S),0,TAU);ctx.fill();
  }else if(g.k==="house"){
    const on=((t*1.2)%1)<.5;ctx.fillStyle=on?"rgba(255,80,60,.95)":"rgba(255,80,60,.3)";   /* «МЕСТА ЕСТЬ» — красный огонь на вывеске */
    ctx.beginPath();ctx.arc(490*S,-278*S,Math.max(1.5,5*S),0,TAU);ctx.fill();
  }else if(g.k==="cyl"){
    const u=(t*.15)%1;ctx.fillStyle="rgba(47,111,208,.85)";ctx.fillRect((-700+1400*u)*S,-135*S,Math.max(2,24*S),Math.max(1,4*S));   /* бегущий огонь по верхней кромке */
  }
  ctx.restore();
  /* имя — над телом, в пикселях экрана */
  ctx.save();ctx.fillStyle="rgba(240,220,170,.85)";ctx.font=(typeof uiFont==="function")?uiFont(10):"10px monospace";ctx.textAlign="center";
  ctx.fillText(g.ru.toUpperCase(),x,y-Math.min(H*.4,560*S)-10);ctx.restore();
}
/* прилёт: первая встреча — строка */
function giantArrive(){
  const g=giantAt(G.sx,G.sy);if(!g)return;
  G.giantsSeen=G.giantsSeen||{};
  if(G.giantsSeen[g.k])return;
  G.giantsSeen[g.k]=1;
  logAdd("good","Великан: "+g.ru+" — "+g.note);
}
