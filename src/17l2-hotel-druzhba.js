/* ══════════════ турбаза «Дружба» — РАССВЕТ (ra) ══════════════
   Бетонный барабан о трёх этажах-лоджиях на трёх ногах, вросших в астероид: «Дружба» ялтинская,
   перенесённая на камень. Каждая лоджия — сота с тёмной нишей и широким стеклом в глубине,
   перила — светлая нить; под барабаном конус днища с кольцом ресторана, ступица с маяком;
   ноги — бетон с красными хомутами и тросами в камень; у средней ноги — дверь и люди на камне.
   На крыше — надстройка, антенны, тарелка и крашеный щит, на нём красный неон ядра (sign, HD_NEON):
   крашеные буквы на зуме 2.2 не читались, неон «Космоса» рядом читался сразу. Над щитом и по кромке
   крыши — гирлянда лампочек, часть перегорела (зерно). Свет —
   звезда системы (Lt из ядра): грань барабана к ней светлая, от неё — в холодной тени, крыша и
   верх камня — по hotelUp, днище — по hotelDn; ноги кладут тень на камень. Разброс от hashi(sd):
   очертание и кратеры камня, мёртвые лампочки, люди. Мерило — человек: этаж 14 ед., человек 3 */
const HD_CX=185,HD_Y0=48,HD_RX=82,HD_RY=13,HD_DH=42,HD_NC=14,HD_FL=3,HD_FH=HD_DH/HD_FL;
const HD_WALL=[200,190,172],HD_RED=[168,60,40],HD_ROCK=[156,146,132],HD_STEEL=[96,90,84],HD_CREAM=[214,204,184];
const HD_DARK=["#10141c","#131722","#0e1219","#151a24"];
const HD_HALO=[.6,.8];
const HD_NEON=[255,86,66];   /* красные трубки по кремовому щиту — не жёлтый «Космоса» рядом (лампа ra почти того же тона) */
let HD_WINS=null;
const hdA=i=>Math.PI*(i+.5)/HD_NC;                       /* угол соты i: фронт барабана — a∈(0,π), x убывает с a */
const hdX=(a,r)=>HD_CX+Math.cos(a)*r;
const hdY=(a,y,r)=>y+Math.sin(a)*r*HD_RY/HD_RX;          /* точка кольца радиуса r на высоте y */
const hdS=(a,Lt)=>hotelN(Math.PI/2-a,Lt);               /* освещённость стены барабана под углом a */
function hdWins(){
  if(HD_WINS)return HD_WINS;
  const W=[];
  for(let j=0;j<HD_FL;j++)for(let i=0;i<HD_NC;i++){const a0=Math.PI*i/HD_NC,a1=Math.PI*(i+1)/HD_NC,a=hdA(i);
    const wx=HD_RX*(Math.cos(a0)-Math.cos(a1));if(wx<4)continue;   /* крайние соты — в ребро, окна не видно */
    const x=hdX(a,HD_RX),yt=hdY(a,HD_Y0,HD_RX)+j*HD_FH;
    W.push([x-wx*.3,yt+4.4,x+wx*.3,yt+10.2,j*64+i]);}
  for(let i=0;i<9;i++){const a=Math.PI*(i+.5)/9,x=hdX(a,62),y=hdY(a,100,62);W.push([x-2.8,y-2.6,x+2.8,y+2.2,9001]);}   /* кольцо ресторана */
  for(let i=0;i<4;i++)W.push([HD_CX-26+i*7,31.4,HD_CX-22.6+i*7,34.6,9011]);   /* надстройка */
  W.push([HD_CX-1.6,147,HD_CX+1.6,153.5,9021]);   /* дверь средней ноги */
  return HD_WINS=W;
}
function* hdPaint(c,e,sd,lit,Lt){
  if(lit){hotelWindows(c,e,hdWins(),sd,true,null,HD_HALO);return;}
  Lt=Lt||{lx:-.86,ly:-.51,K:[1,.88,.54],F:HOTEL_FILL};
  const r=rng((sd^0x7D02)>>>0),lx=Lt.lx,ly=Lt.ly,sg=lx>=0?1:-1;
  const C=(base,s,warm)=>rgba(hotelLit(Lt,base,s,warm),1);
  const sF=hotelN(0,Lt),sR=hotelN(Math.PI/2,Lt),sL=hotelN(-Math.PI/2,Lt),sU=hotelUp(Lt),sD=hotelDn(Lt);
  const sh=a=>"rgba(4,4,14,"+a.toFixed(2)+")",CX=HD_CX,Y0=HD_Y0,RX=HD_RX,RY=HD_RY,YB=Y0+HD_DH;
  /* ── массы ── */
  const ring=(y,rx,a0,a1,n)=>hotelArc(CX,y,rx,rx*RY/RX,a0,a1,n);
  const roof=ring(Y0,RX,0,2*Math.PI,48);
  const wall=[...ring(Y0,RX,0,Math.PI,24),...ring(YB,RX,Math.PI,0,24)];
  const cone=[...ring(YB,RX,0,Math.PI,24),...ring(118,36,Math.PI,0,12)];
  const hub=ring(118,36,0,2*Math.PI,24);
  const legL=[CX-46,116,CX-33,116,CX-50,153,CX-71,153],legC=[CX-8,118,CX+8,118,CX+10,157,CX-10,157],legR=[CX+33,116,CX+46,116,CX+71,153,CX+50,153];
  const RKX=CX+4,RKY=170,rock=[];
  for(let i=0;i<48;i++){const t=i/48*2*Math.PI,n=fbm1(i*.37,sd^0x7D03,3),n2=fbm1(i*1.3,sd^0x7D05,2),q=1+.4*(n-.5)*2+.12*(n2-.5)*2-(Math.sin(t)>0?0:.05);
    rock.push(RKX+Math.cos(t)*100*q,RKY+Math.sin(t)*30*q+(Math.sin(t)>0?(n2-.5)*9:0));}   /* низ — рваный, верх — плато */
  const pent=[CX-30,29,CX+2,29,CX+2,39,CX-30,39],pTop=hotelArc(CX-14,29,16,2.6,0,2*Math.PI,20);
  const board=[CX-64,34,CX+64,34,CX+64,47.5,CX-64,47.5];
  hotelRim(c,[rock,legL,legC,legR,cone,hub,wall,roof,pent,pTop,board],1.3);
  yield;
  /* ── камень: светлый верх под звездой, низ во тьме, бок от звезды темнее; кратеры с лит кромкой
     к звезде, зерно; лит нить по верхней кромке; у подножия ног — тень ── */
  {const g=c.createLinearGradient(0,RKY-32,0,RKY+30);g.addColorStop(0,C(HD_ROCK,sU+.75));g.addColorStop(.3,C(HD_ROCK,sU+.35));g.addColorStop(.6,C(HD_ROCK,sF*.45));g.addColorStop(1,C([70,66,64],.06));
   c.fillStyle=g;hotelPoly(c,rock);c.fill();
   const kg=c.createLinearGradient(sg>0?RKX+100:RKX-100,0,sg>0?RKX-100:RKX+100,0);kg.addColorStop(0,sh(0));kg.addColorStop(1,sh(.34));c.fillStyle=kg;hotelPoly(c,rock);c.fill();
   c.save();hotelPoly(c,rock);c.clip();
   {const top=[];for(let i=24;i<=48;i++){const k=(i%48)*2;top.push(rock[k],rock[k+1]);}   /* плато: верхняя грань под звездой светлее, уступ вниз */
    const bot=[];for(let i=48;i>=24;i--){const k=(i%48)*2;bot.push(rock[k]+(RKX-rock[k])*.06,rock[k+1]+7+Math.abs(Math.cos(i/48*2*Math.PI))*3);}
    const pg=c.createLinearGradient(0,RKY-32,0,RKY-12);pg.addColorStop(0,rgba(hotelLit(Lt,HD_ROCK,sU+.9),.85));pg.addColorStop(1,rgba(hotelLit(Lt,HD_ROCK,sU+.5),.3));
    c.fillStyle=pg;hotelPoly(c,[...top,...bot]);c.fill();
    c.fillStyle=sh(.3);hotelPoly(c,[...bot,...bot.map((v,i)=>i%2?v+2.2:v).reverse().reduce((a,v,i,A)=>(i%2?a.push(A[i],A[i-1]):a,a),[])]);c.fill();}
   for(let i=0;i<11;i++){const x=RKX-92+r()*184,y=RKY-20+r()*42,w=2.4+r()*6.5,h=w*(.35+r()*.25);
     c.fillStyle=sh(.34);c.beginPath();c.ellipse(x,y,w,h,0,0,TAU);c.fill();
     c.strokeStyle=C([214,204,190],sU+.3);c.lineWidth=.5;c.beginPath();c.ellipse(x-sg*.7,y+.6,w,h,0,sg>0?Math.PI*.9:Math.PI*1.1,sg>0?Math.PI*1.9:Math.PI*2.1);c.stroke();}
   for(let i=0;i<140;i++){const x=RKX-100+r()*200,y=RKY-32+r()*62,d=r();c.fillStyle=d<.5?sh(.3):C([220,210,196],sU+.2);c.fillRect(x,y,.9+r()*1.4,.7);}
   c.fillStyle=sh(.3);for(const [x,w] of [[CX-60,20],[CX,18],[CX+60,20]]){c.beginPath();c.ellipse(x-sg*w*.4,155.8,w,3.4,0,0,TAU);c.fill();}   /* тень ног на камне */
   c.restore();
   c.strokeStyle=C([230,220,204],sU+.4);c.lineWidth=.8;c.lineJoin="round";c.beginPath();   /* лит нить: верхняя кромка и бок к звезде */
   let on=false;for(let i=0;i<=48;i++){const k=(i%48)*2,t=(i%48)/48*2*Math.PI,ok=Math.sin(t)<-.12||(Math.sin(t)<.3&&Math.cos(t)*sg>0);
     if(ok){if(on)c.lineTo(rock[k],rock[k+1]);else c.moveTo(rock[k],rock[k+1]);}on=ok;}
   c.stroke();}
  yield;
  /* ── ноги: бетон, грань к звезде светлее, от неё тёмная полоса; красные хомуты, болты, тросы в камень ── */
  for(const [p,f] of [[legL,-.45],[legC,0],[legR,.45]]){
    const x0=Math.min(p[0],p[6]),x1=Math.max(p[2],p[4]);
    const g=c.createLinearGradient(sg>0?x0:x1,0,sg>0?x1:x0,0);g.addColorStop(0,C(HD_WALL,hotelN(f,Lt)*.5));g.addColorStop(.6,C(HD_WALL,hotelN(f,Lt)*.9));g.addColorStop(1,C(HD_WALL,hotelN(f+sg*.9,Lt)+.1));
    c.fillStyle=g;hotelPoly(c,p);c.fill();
    c.strokeStyle="rgba(10,10,14,.35)";c.lineWidth=.3;c.beginPath();for(let y=122;y<150;y+=7){const t=(y-116)/38;c.moveTo(p[0]+(p[6]-p[0])*t+.6,y);c.lineTo(p[2]+(p[4]-p[2])*t-.6,y);}c.stroke();
    const fx=(p[4]+p[6])/2,fw=(p[4]-p[6])/2;   /* хомут у подошвы */
    c.fillStyle=HOTEL_RIM;c.fillRect(fx-fw-2.4,146.6,fw*2+4.8,6.8);
    c.fillStyle=C(HD_RED,hotelN(f,Lt)+.15);c.fillRect(fx-fw-2,147,fw*2+4,6);c.fillStyle=C(HD_RED,hotelN(f+sg*.9,Lt)+.3);c.fillRect(sg>0?fx+fw-1:fx-fw-2,147,3,6);
    c.fillStyle="#2a2624";for(let i=0;i<4;i++)c.fillRect(fx-fw-.5+i*(fw*2+1)/3,149.4,1.1,1.1);
    c.strokeStyle="#33302c";c.lineWidth=.6;c.beginPath();c.moveTo(fx-fw-2,151);c.quadraticCurveTo(fx-fw-8,155,fx-fw-10,162);c.moveTo(fx+fw+2,151);c.quadraticCurveTo(fx+fw+8,155,fx+fw+10,162);c.stroke();}
  {c.fillStyle="#3a2a1c";c.fillRect(CX-3.2,145.6,6.4,8.4);   /* дверной проём средней ноги; люди у входа на камне */
   hotelLamp(c,e,CX,144.6,.5,[255,214,120],.7);
   const PC=["#3a3f52","#5a3a34","#6a5a44","#3c4a5a"];
   for(let i=0;i<5;i++){const x=CX-14+r()*28,y=156+r()*3;if(Math.abs(x-CX)<4)continue;
     c.fillStyle=PC[i%4];c.fillRect(x-.45,y-2.4,.9,2.4);c.fillStyle="#d8b89a";c.beginPath();c.arc(x,y-2.85,.42,0,TAU);c.fill();}}
  yield;
  /* ── днище: конус от барабана к ступице, кольцо ресторана, рёбра, ступица с маяком ── */
  {const g=c.createLinearGradient(0,YB,0,124);g.addColorStop(0,C(HD_STEEL,sD+.38));g.addColorStop(1,C([60,58,60],sD+.18));c.fillStyle=g;hotelPoly(c,cone);c.fill();
   const kg=c.createLinearGradient(sg>0?CX+RX:CX-RX,0,sg>0?CX-RX:CX+RX,0);kg.addColorStop(0,"rgba(255,236,200,.10)");kg.addColorStop(1,sh(.3));c.fillStyle=kg;hotelPoly(c,cone);c.fill();
   c.strokeStyle="rgba(10,10,14,.45)";c.lineWidth=.35;c.beginPath();
   for(let i=1;i<12;i++){const a=Math.PI*i/12;c.moveTo(hdX(a,RX),hdY(a,YB,RX));c.lineTo(hdX(a,36),hdY(a,118,36));}c.stroke();
   c.fillStyle="#0e1219";c.beginPath();const rb=ring(100,62,.08,Math.PI-.08,24),rb2=ring(100,58,Math.PI-.08,.08,24);   /* тёмная лента стекла ресторана */
   hotelPoly(c,[...rb.map((v,i)=>i%2?v-3.4:v),...rb2.map((v,i)=>i%2?v+3:v)]);c.fill();
   c.fillStyle=C([210,200,186],sD+.3);hotelPoly(c,[...ring(100,64,.06,Math.PI-.06,24).map((v,i)=>i%2?v+3.2:v),...ring(100,64,Math.PI-.06,.06,24).map((v,i)=>i%2?v+4.2:v)]);c.fill();   /* карниз под кольцом */
   const hg=c.createLinearGradient(sg>0?CX+36:CX-36,0,sg>0?CX-36:CX+36,0);hg.addColorStop(0,C(HD_STEEL,sD+.45));hg.addColorStop(1,C([44,42,46],sD+.15));c.fillStyle=hg;hotelPoly(c,hub);c.fill();
   c.strokeStyle="rgba(10,10,14,.5)";c.lineWidth=.4;c.beginPath();c.ellipse(CX,118,28,28*RY/RX,0,0,TAU);c.stroke();
   hotelLamp(c,e,CX,123.4,.6,[255,58,46],.95);}
  yield;
  /* ── барабан: стена под ключом по окружности, соты-лоджии: ниша в тени, грань к звезде лит,
     перила нитью, пилоны между сотами, плиты этажей ── */
  {const g=c.createLinearGradient(CX-RX,0,CX+RX,0);
   for(let i=0;i<=16;i++){const a=Math.PI*(1-i/16);g.addColorStop(i/16,C(HD_WALL,hdS(a,Lt)));}
   c.fillStyle=g;hotelPoly(c,wall);c.fill();
   for(let j=0;j<HD_FL;j++)for(let i=0;i<HD_NC;i++){const a0=Math.PI*i/HD_NC,a1=Math.PI*(i+1)/HD_NC,a=hdA(i),s=hdS(a,Lt);
     const xa=hdX(a0,RX),xb=hdX(a1,RX),ya=hdY(a0,Y0,RX)+j*HD_FH,yb=hdY(a1,Y0,RX)+j*HD_FH,wx=xa-xb;if(wx<2.2)continue;
     const pw=Math.min(1.7,wx*.12),ni=[xb+pw,yb+1.2,xa-pw,ya+1.2,xa-pw,ya+HD_FH-2.2,xb+pw,yb+HD_FH-2.2];   /* ниша */
     const ng=c.createLinearGradient(0,ya+1.2,0,ya+HD_FH-2.2);ng.addColorStop(0,sh(.62));ng.addColorStop(1,C(HD_WALL,s*.45));c.fillStyle=ng;hotelPoly(c,ni);c.fill();
     const iw=Math.min(1.6,wx*.1);   /* внутренняя стенка ниши к звезде — лит, от звезды — тень */
     c.fillStyle=C(HD_WALL,(sg>0?sR:sL)*.9+.1);c.fillRect(sg>0?xa-pw-iw:xb+pw,Math.max(ya,yb)+1.2,iw,HD_FH-3.4);
     c.fillStyle=sh(.4);c.fillRect(sg>0?xb+pw:xa-pw-iw,Math.max(ya,yb)+1.2,iw,HD_FH-3.4);
     c.fillStyle=C(HD_CREAM,sU*.8+s*.3);c.fillRect(xb+pw,Math.max(ya,yb)+HD_FH-3.2,wx-2*pw,.9);   /* перила-парапет лоджии */
     c.fillStyle=sh(.3);c.fillRect(xb+pw,Math.max(ya,yb)+HD_FH-2.2,wx-2*pw,.5);}
   c.strokeStyle=C(HD_CREAM,sU*.6);c.lineWidth=.55;c.beginPath();   /* плиты этажей — светлая кромка по кольцу */
   for(let j=0;j<=HD_FL;j++){const R=ring(Y0+j*HD_FH,RX,0,Math.PI,24);c.moveTo(R[0],R[1]);for(let k=2;k<R.length;k+=2)c.lineTo(R[k],R[k+1]);}c.stroke();}
  yield;
  hotelWindows(c,e,hdWins(),sd,false,HD_DARK);
  yield;
  /* ── крыша: диск под звездой, кромка, дорожки; надстройка, антенны с огнями, тарелка;
     щит под неон (буквы кладёт ядро, 17l hotelNeon) и гирлянда над ним и по кромке ── */
  {const g=c.createLinearGradient(sg>0?CX+RX:CX-RX,0,sg>0?CX-RX:CX+RX,0);g.addColorStop(0,C(HD_WALL,sU+.2));g.addColorStop(1,C(HD_WALL,sU*.55));c.fillStyle=g;hotelPoly(c,roof);c.fill();
   c.strokeStyle="rgba(10,10,14,.22)";c.lineWidth=.3;c.beginPath();c.ellipse(CX,Y0,RX*.72,RY*.72,0,0,TAU);c.ellipse(CX,Y0,RX*.4,RY*.4,0,0,TAU);c.stroke();
   c.strokeStyle=C([236,226,206],sU+.3);c.lineWidth=.6;c.beginPath();const fr=ring(Y0+.4,RX,.05,Math.PI-.05,30);c.moveTo(fr[0],fr[1]);for(let k=2;k<fr.length;k+=2)c.lineTo(fr[k],fr[k+1]);c.stroke();
   const pg=c.createLinearGradient(CX-30,0,CX+2,0);pg.addColorStop(0,C(HD_WALL,sg>0?sL*.9:sR*.9+.1));pg.addColorStop(.5,C(HD_WALL,sF));pg.addColorStop(1,C(HD_WALL,sg>0?sR*.9+.1:sL*.9));   /* надстройка */
   c.fillStyle=pg;hotelPoly(c,pent);c.fill();c.fillStyle=C(HD_WALL,sU+.15);hotelPoly(c,pTop);c.fill();
   c.fillStyle=C(HD_RED,sF*.8);c.fillRect(CX-30,36.2,32,.8);
   c.strokeStyle="#2a2724";c.lineWidth=.45;c.beginPath();
   for(const [x,y0,y1] of [[CX-24,29,17],[CX-6,29,21],[CX+34,48-RY+2,24]]){c.moveTo(x,y0);c.lineTo(x,y1);c.moveTo(x-1.4,y1+2.4);c.lineTo(x+1.4,y1+2.4);}
   c.stroke();
   for(const [x,y] of [[CX-24,17],[CX+34,24]])hotelLamp(c,e,x,y+.5,.5,[255,58,46],.9);
   c.fillStyle=C([160,150,138],sF*.5);c.fillRect(CX+44,37,1.2,-6);c.fillStyle=C([220,214,200],sU+.3);c.beginPath();c.ellipse(CX+47,31,6,3.6,-.5,0,TAU);c.fill();   /* тарелка */
   c.fillStyle=sh(.35);c.beginPath();c.ellipse(CX+46.2,31.6,4.2,2.4,-.5,0,TAU);c.fill();
   /* щит: крашеный, под трубками неона; над ним провод с лампочками, часть перегорела */
   const bg=c.createLinearGradient(sg>0?CX+64:CX-64,0,sg>0?CX-64:CX+64,0);bg.addColorStop(0,C(HD_CREAM,sF+.3));bg.addColorStop(1,C(HD_CREAM,sF*.7));c.fillStyle=bg;hotelPoly(c,board);c.fill();
   c.fillStyle=C(HD_RED,sF*.8);c.fillRect(CX-64,34,128,1.1);c.fillRect(CX-64,46.4,128,1.1);
   c.strokeStyle="rgba(10,10,14,.35)";c.lineWidth=.3;c.beginPath();for(const x of [CX-56,CX+56]){c.moveTo(x,47.5);c.lineTo(x,50.5);}c.stroke();
   const GC=[[255,90,60],[255,200,80],[90,210,120],[100,150,255]];
   c.strokeStyle="#2c2926";c.lineWidth=.35;c.beginPath();c.moveTo(CX-64,32.6);for(let x=CX-58;x<=CX+64;x+=12)c.quadraticCurveTo(x-6,34.2,x,32.6);c.stroke();
   for(let i=0;i<22;i++){const x=CX-63+i*6,y=32.6+(i%2?1.1:.4),col=GC[i%4];
     if((hashi(i,sd,0x7D04)>>>0)%6===0){c.fillStyle="#3a3230";c.beginPath();c.arc(x,y,.5,0,TAU);c.fill();}else hotelLamp(c,e,x,y,.5,col,.75);}
   for(let i=0;i<16;i++){const a=.1+Math.PI*.8*(i+.5)/16,x=hdX(a,RX-1),y=hdY(a,Y0,RX-1)-.6,col=GC[(i+1)%4];   /* гирлянда по кромке крыши */
     if((hashi(i+40,sd,0x7D04)>>>0)%6===0){c.fillStyle="#3a3230";c.beginPath();c.arc(x,y,.45,0,TAU);c.fill();}else hotelLamp(c,e,x,y,.45,col,.7);}}
  yield;
  /* ── причальная труба от левого борта к челноку ── */
  hotelDock(c,e,CX-RX+2,84,62,90,sd,Lt);
}
HOTEL_T.ra={W:280,H:200,PX:2,ax:185,ay:100,sign:[185,44.5,10],neon:HD_NEON,sheen:[185,40,30],halo:HD_HALO,wins:hdWins,paint:hdPaint};
