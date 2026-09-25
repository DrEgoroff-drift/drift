/* ══════════════ гостиница «Космос» — ГЛАВТРАССА (gt, эталон шести типов) ══════════════
   Полумесяц в четырнадцать этажей между двумя башнями: края ближе и выше, середина глубже —
   «улыбка» снизу. Белый камень с красными пилонами, в середине — красное знамя со звездой над
   портиком, на площадке перед входом — космонавт со звездой в поднятой руке. Под домом — тёмное
   днище с капсулами и красными огнями, от ступицы влево — причальная труба с челноком (общая).
   Свет — один, сверху слева: левое крыло вогнутого фасада смотрит от него (темнее), правое — на
   него. Мерило — человек: этаж ~3 м = 5.4 ед., человек на площадке — 3 ед. Вывеска на крыше —
   неон 17k0, Т погасла. Разброс по системе — от зерна: лампы и шторы окон, люди на площадке */
const HK_XL=64,HK_XR=212,HK_A=1.0,HK_NC=36,HK_NR=14;
const hkX=u=>HK_XL+(HK_XR-HK_XL)*(.5+.5*Math.sin((u-.5)*2*HK_A)/Math.sin(HK_A));   /* края сжаты: вогнутый фасад */
const hkS=u=>1-(2*u-1)*(2*u-1);
const hkTop=u=>30+12*hkS(u),hkBot=u=>110+8*hkS(u);
const hkQ=v=>Math.round(v*2)/2;   /* окна — по сетке пикселя мастера (PX 2): рамка кадра = краска */
let HK_WINS=null;
function hkWins(){
  if(HK_WINS)return HK_WINS;
  const W=[];
  for(let j=0;j<HK_NR;j++)for(let i=0;i<HK_NC;i++){
    if(i>=16&&i<=19)continue;                      /* знамя */
    if(j>=HK_NR-2&&i>=13&&i<=22)continue;          /* портик */
    const um=(i+.5)/HK_NC,t=hkTop(um)+3,b=hkBot(um),fh=(b-t)/HK_NR;
    W.push([hkQ(hkX((i+.16)/HK_NC)),hkQ(t+fh*(j+.3)),hkQ(hkX((i+.84)/HK_NC)),hkQ(t+fh*(j+.74))]);   /* окна лентой: этаж читается полосой, не шашкой */
  }
  for(let j=0;j<15;j++){const y=hkQ(24+j*5.6);   /* левая башня: два ряда по бокам полосы */
    W.push([41.5,y,44.5,y+3],[53.5,y,56.5,y+3]);}
  for(let j=0;j<16;j++){const y=hkQ(20+j*5.6);   /* правая: торец к свету и узкие по краям лица */
    W.push([213.5,y,216.5,y+3],[219,y,221,y+3],[237,y,239,y+3]);}
  return HK_WINS=W;
}
const HK_DARK=["#262f39","#2c3540","#212831","#323840"];
function* hkPaint(c,e,sd,lit){
  if(lit){hotelWindows(c,e,hkWins(),sd,true);return;}
  const r=rng((sd^0x6B05)>>>0);
  /* ── массы (точки [x,y,…]) ── */
  const slab=[],N=24;
  for(let i=0;i<=N;i++){const u=i/N;slab.push(hkX(u),hkTop(u));}
  for(let i=N;i>=0;i--){const u=i/N;slab.push(hkX(u),hkBot(u)+.5);}
  const lTf=[40,16,58,18,58,114,40,113],lTs=[58,18,64.5,22,64.5,112,58,114];
  const rTs=[211.5,16,218,12,218,117,211.5,113],rTf=[218,12,240,14,240,117,218,117];
  const deck=[34,112];
  for(let i=0;i<=N;i++){const u=i/N;deck.push(hkX(u),hkBot(u)+.5);}
  deck.push(218,116.5,246,116.5,246,120.5,218,120.5);
  for(let i=N;i>=0;i--){const u=i/N;deck.push(hkX(u),hkBot(u)+4.5);}
  deck.push(34,116);
  const keel=[36,116,246,119,238,129,214,135,170,139,110,139,76,135,50,128];
  const hub=[112,128,152,128,152,146,...hotelArc(132,146,20,5,0,Math.PI,12)];
  const podR=[216,117,240,117,240,146,234,154,228,160,222,154,216,146],podL=[42,114,58,114,58,132,53,139,50,143,47,139,42,132];
  const podM=[178,134,198,134,198,151,193,156,188,160,183,156,178,151];
  const plT=hotelArc(132,124,36,7,0,2*Math.PI,40),plR=[...hotelArc(132,124,36,7,0,Math.PI,20),...hotelArc(132,129,36,7,Math.PI,0,20)];
  const ped=[120,107,130,107,131,121,119,121];
  hotelRim(c,[lTf,lTs,rTs,rTf,slab,deck,keel,hub,podR,podL,podM,plR,plT,ped],1.3);
  yield;
  /* ── днище: тёмный металл, панели, иллюминаторы, капсулы с красными огнями ── */
  {const g=c.createLinearGradient(0,116,0,139);g.addColorStop(0,"#5a554e");g.addColorStop(1,"#26241f");c.fillStyle=g;hotelPoly(c,keel);c.fill();
   c.strokeStyle="rgba(24,22,20,.45)";c.lineWidth=.3;c.beginPath();
   for(let x=46;x<240;x+=9){c.moveTo(x,118);c.lineTo(x+(x-140)*.04,138);}
   c.moveTo(48,125);c.lineTo(240,126);c.moveTo(70,132);c.lineTo(220,133);c.stroke();
   c.beginPath();e.beginPath();
   for(let x=58;x<232;x+=4.5){if(((hashi(x|0,sd,0x6B06)>>>0)%3)===0)continue;for(const q of [c,e])q.rect(x,122.4,1.6,1.1);}
   c.fillStyle="#e9b56c";c.fill();e.fillStyle="rgba(255,184,104,.5)";e.fill();}
  for(const [p,x0,x1,yr,n] of [[podL,42,58,122,2],[podM,178,198,140,3],[podR,216,240,130,4]]){
    const g=c.createLinearGradient(x0,0,x1,0);g.addColorStop(0,"#777166");g.addColorStop(.45,"#524d46");g.addColorStop(1,"#27251f");
    c.fillStyle=g;hotelPoly(c,p);c.fill();
    c.fillStyle="rgba(20,18,16,.5)";c.fillRect(x0,yr-2.2,x1-x0,.6);c.fillRect(x0,yr+3.2,x1-x0,.6);
    c.beginPath();e.beginPath();const st=(x1-x0)/n;
    for(let i=0;i<n;i++)for(const q of [c,e])q.rect(x0+st*(i+.3),yr-.8,st*.4,2.4);
    c.fillStyle="#efbd76";c.fill();e.fillStyle="rgba(255,186,108,.55)";e.fill();
    hotelLamp(c,e,(x0+x1)/2,p[p.length/2+1]+1.2,.55,[255,58,46],.95);}
  {const g=c.createLinearGradient(112,0,152,0);g.addColorStop(0,"#7a746a");g.addColorStop(.4,"#57524a");g.addColorStop(1,"#29261f");
   c.fillStyle=g;hotelPoly(c,hub);c.fill();
   c.beginPath();e.beginPath();for(let i=0;i<9;i++)for(const q of [c,e])q.rect(114.5+i*4.3,134,2,2.8);
   c.fillStyle="#f3c27c";c.fill();e.fillStyle="rgba(255,190,112,.6)";e.fill();
   c.fillStyle="rgba(20,18,16,.55)";c.fillRect(112,131.5,40,.7);c.fillRect(112,139,40,.7);
   hotelLamp(c,e,132,151.6,.6,[255,58,46],.95);}
  yield;
  /* ── башни: белый камень, красная полоса; правая — звезда и планета с кольцом ── */
  {let g=c.createLinearGradient(0,16,0,114);g.addColorStop(0,"#b9ad98");g.addColorStop(1,"#877d6c");c.fillStyle=g;hotelPoly(c,lTf);c.fill();
   c.fillStyle="#58514a";hotelPoly(c,lTs);c.fill();
   c.fillStyle="#86271f";hotelPoly(c,[46,108,46,29,...hotelArc(49,29,3,3,Math.PI,2*Math.PI,8),52,108]);c.fill();
   c.fillStyle="rgba(255,255,255,.14)";c.fillRect(46,30,1,78);
   for(const y of [40,62,84]){const cg=c.createLinearGradient(34,0,40,0);cg.addColorStop(0,"#7f786c");cg.addColorStop(1,"#3c3832");   /* капсулы на левом боку */
     c.fillStyle=HOTEL_RIM;c.fillRect(33.6,y-.4,6.8,12.8);c.fillStyle=cg;c.fillRect(34.2,y,6,12);c.fillStyle="rgba(20,18,16,.5)";c.fillRect(34.2,y+3,6,.5);c.fillRect(34.2,y+8,6,.5);}
   g=c.createLinearGradient(212,0,218,0);g.addColorStop(0,"#c2b6a1");g.addColorStop(1,"#a39783");c.fillStyle=g;hotelPoly(c,rTs);c.fill();
   g=c.createLinearGradient(0,12,0,117);g.addColorStop(0,"#9a8f7c");g.addColorStop(1,"#6f6658");c.fillStyle=g;hotelPoly(c,rTf);c.fill();
   c.fillStyle="#7e241d";hotelPoly(c,[222,22,236,22,236,100,229,111,222,100]);c.fill();
   c.fillStyle="rgba(0,0,0,.18)";c.fillRect(232.5,22,3.5,78);
   hotelStar(c,229,31,3.4,"#e3be62");
   {const pg=c.createRadialGradient(227.6,62.6,.5,229,64,4.6);pg.addColorStop(0,"#b3ab9c");pg.addColorStop(1,"#4a453e");
    c.fillStyle=pg;c.beginPath();c.arc(229,64,4.4,0,TAU);c.fill();
    c.strokeStyle="#d7c890";c.lineWidth=.55;c.beginPath();c.ellipse(229,64,9.5,2.8,-.32,0,TAU);c.stroke();}
   for(const y of [58,86])   /* машинерия на правом боку */
     {c.fillStyle=HOTEL_RIM;c.fillRect(239.6,y-.4,6,14.8);c.fillStyle="#4a4640";c.fillRect(240,y,5.2,14);c.fillStyle="#6a655c";c.fillRect(240,y,1.4,14);}
   /* крыши башен: надстройка, антенны, красные огни */
   for(const [x0,x1,y] of [[43,55,16],[221,236,12]]){c.fillStyle=HOTEL_RIM;c.fillRect(x0-.5,y-6.5,x1-x0+1,6.6);
     c.fillStyle="#8b8171";c.fillRect(x0,y-6,x1-x0,6);c.fillStyle="#ada18c";c.fillRect(x0,y-6,(x1-x0)*.35,6);
     c.fillStyle="#6c6458";c.fillRect(x0-1.5,y-.8,x1-x0+3,1);}
   c.strokeStyle="#2a2724";c.lineWidth=.45;c.beginPath();
   for(const [x,y0,y1] of [[45,10,1],[52,10,4],[223,6,-2],[233,6,2],[227.5,6,0.5]]){c.moveTo(x,y0);c.lineTo(x,y1);c.moveTo(x-1.4,y1+2.2);c.lineTo(x+1.4,y1+2.2);}
   c.stroke();
   for(const [x,y] of [[45,1],[52,4],[223,-2],[233,2]])hotelLamp(c,e,x,y+.6,.5,[255,58,46],.9);}
  yield;
  /* ── полумесяц: камень (левое крыло в тени), пилоны, пояса этажей, карниз, надстройки ── */
  {const g=c.createLinearGradient(HK_XL,0,HK_XR,0);g.addColorStop(0,"#554e44");g.addColorStop(.5,"#72695b");g.addColorStop(1,"#8d8270");
   c.fillStyle=g;hotelPoly(c,slab);c.fill();
   const col=(i,w,fill)=>{c.beginPath();for(const I of i){const u0=(I-w)/HK_NC,u1=(I+w)/HK_NC;
     c.moveTo(hkX(u0),hkTop(u0)+3);c.lineTo(hkX(u1),hkTop(u1)+3);c.lineTo(hkX(u1),hkBot(u1));c.lineTo(hkX(u0),hkBot(u0));c.closePath();}c.fillStyle=fill;c.fill();};
   col([4,8,12,24,28,32],.16,"#7c231c");
   col([4.1,8.1,12.1,24.1,28.1,32.1],.05,"rgba(255,200,170,.16)");
   c.strokeStyle="rgba(40,34,28,.6)";c.lineWidth=.5;c.beginPath();   /* пояса перекрытий */
   for(let j=0;j<=HK_NR;j++){for(let i=0;i<=N;i++){const u=i/N,t=hkTop(u)+3,y=t+(hkBot(u)-t)*j/HK_NR;if(i)c.lineTo(hkX(u),y);else c.moveTo(hkX(u),y);}}
   c.stroke();
   c.fillStyle="#b9ae9a";c.beginPath();   /* карниз и красная нить под ним */
   for(let i=0;i<=N;i++){const u=i/N;if(i)c.lineTo(hkX(u),hkTop(u));else c.moveTo(hkX(u),hkTop(u));}
   for(let i=N;i>=0;i--){const u=i/N;c.lineTo(hkX(u),hkTop(u)+2.2);}c.closePath();c.fill();
   c.fillStyle="#7c231c";c.beginPath();
   for(let i=0;i<=N;i++){const u=i/N;if(i)c.lineTo(hkX(u),hkTop(u)+2.2);else c.moveTo(hkX(u),hkTop(u)+2.2);}
   for(let i=N;i>=0;i--){const u=i/N;c.lineTo(hkX(u),hkTop(u)+2.9);}c.closePath();c.fill();
   for(const u of [.14,.3,.7,.86]){const x=hkX(u),y=hkTop(u);   /* машинные на крыше */
     c.fillStyle=HOTEL_RIM;c.fillRect(x-4.5,y-4.3,9,4.4);c.fillStyle="#7f7667";c.fillRect(x-4,y-3.8,8,3.9);c.fillStyle="#a09582";c.fillRect(x-4,y-3.8,2.6,3.9);}
   /* опоры вывески: стойки и рейка под буквами */
   c.strokeStyle="#3b3632";c.lineWidth=.4;c.beginPath();
   for(let x=104;x<=172;x+=6){c.moveTo(x,34.6);c.lineTo(x,hkTop(.5+(x-138)/300)+.2);}
   c.moveTo(102,34.8);c.lineTo(174,34.8);c.stroke();}
  yield;
  hotelWindows(c,e,hkWins(),sd,false,HK_DARK);
  yield;
  /* ── знамя со звездой, лестничные витражи, портик, флаги ── */
  {const x0=hkX(16.1/HK_NC),x1=hkX(19.9/HK_NC),y0=hkTop(.5)+5,y1=hkBot(.5)-13;
   const g=c.createLinearGradient(x0,0,x1,0);g.addColorStop(0,"#5e1a15");g.addColorStop(.35,"#8c2a22");g.addColorStop(1,"#6a1f19");
   c.fillStyle=HOTEL_RIM;c.fillRect(x0-.4,y0-.4,x1-x0+.8,y1-y0+.8);c.fillStyle=g;c.fillRect(x0,y0,x1-x0,y1-y0);
   hotelStar(c,138,y0+9,4.6,"#e8c56a");
   c.fillStyle="rgba(232,197,106,.8)";for(const x of [135.4,138,140.6])c.fillRect(x-.18,y0+16,.36,y1-y0-18);
   const sa=hkX(15.35/HK_NC),sb=hkX(15.8/HK_NC),sc=hkX(20.2/HK_NC),sdd=hkX(20.65/HK_NC);
   c.beginPath();e.beginPath();for(const q of [c,e]){q.rect(sa,y0,sb-sa,y1-y0);q.rect(sc,y0,sdd-sc,y1-y0);}
   c.fillStyle="#e9b467";c.fill();e.fillStyle="rgba(255,186,108,.45)";e.fill();
   c.fillStyle="rgba(60,40,30,.5)";for(let y=y0+5.4;y<y1;y+=5.4){c.fillRect(sa,y,sb-sa,.4);c.fillRect(sc,y,sdd-sc,.4);}}
  {const b=hkBot(.5);   /* портик: козырёк, светлый вестибюль, колонны */
   c.fillStyle=HOTEL_RIM;c.fillRect(115.5,b-14.4,45,14.6);
   c.fillStyle="#c98f4e";c.fillRect(119,b-11,38,11);
   const lg=e.createLinearGradient(0,b-11,0,b);lg.addColorStop(0,"rgba(255,180,100,.18)");lg.addColorStop(1,"rgba(255,196,130,.34)");e.fillStyle=lg;e.fillRect(119,b-11,38,11);
   c.fillStyle="rgba(120,80,40,.35)";c.fillRect(119,b-6,38,.5);
   c.fillStyle="#b3a894";for(let i=0;i<6;i++)c.fillRect(119.6+i*7,b-11,1.5,11);
   c.fillStyle="rgba(0,0,0,.25)";for(let i=0;i<6;i++)c.fillRect(120.6+i*7,b-11,.5,11);
   c.fillStyle="#b6ab96";hotelPoly(c,[116,b-14,160,b-14,161.5,b-11,114.5,b-11]);c.fill();
   c.fillStyle="#7c231c";c.fillRect(116,b-12,44,.7);
   for(const x of [109.5,163])   /* флаги: красное полотнище со звездой на древке */
     {c.fillStyle="#2c2926";c.fillRect(x+2,b-20,.4,20);c.fillStyle=HOTEL_RIM;c.fillRect(x-.4,b-19.4,4.8,13.8);
      c.fillStyle="#8a2821";c.fillRect(x,b-19,4,13);hotelStar(c,x+2,b-16,1.1,"#e3be62");}}
  yield;
  /* ── галерея вдоль подножия: плита, перила, фонари ── */
  {c.fillStyle="#3f3b35";hotelPoly(c,deck);c.fill();
   c.fillStyle="#8a8174";c.beginPath();c.moveTo(34,112);
   for(let i=0;i<=N;i++){const u=i/N;c.lineTo(hkX(u),hkBot(u)+.5);}c.lineTo(218,116.5);c.lineTo(246,116.5);c.lineTo(246,117.8);c.lineTo(218,117.8);
   for(let i=N;i>=0;i--){const u=i/N;c.lineTo(hkX(u),hkBot(u)+1.8);}c.lineTo(34,113.3);c.closePath();c.fill();
   c.strokeStyle="rgba(196,188,172,.7)";c.lineWidth=.22;c.beginPath();
   for(let i=0;i<=N*3;i++){const u=i/(N*3),x=hkX(u),y=hkBot(u)+.5;if(x>112&&x<164)continue;c.moveTo(x,y);c.lineTo(x,y-1.3);}
   for(let i=0;i<=N;i++){const u=i/N;if(i)c.lineTo(hkX(u),hkBot(u)-.8);else c.moveTo(hkX(u),hkBot(u)-.8);}c.stroke();
   for(let i=1;i<12;i++){const u=i/12;if(Math.abs(u-.5)<.12)continue;hotelLamp(c,e,hkX(u),hkBot(u)+2.8,.42,[255,196,120],.8);}}
  yield;
  /* ── площадка: камень, кромка с окнами, перила, фонари, деревья, люди, статуя ── */
  {const g=c.createLinearGradient(0,129,0,134);g.addColorStop(0,"#524d46");g.addColorStop(1,"#2c2a26");
   c.fillStyle=g;hotelPoly(c,plR);c.fill();
   c.beginPath();e.beginPath();for(let i=0;i<14;i++){const a=Math.PI*(i+.5)/14,x=132+Math.cos(a)*34,y=129.6+Math.sin(a)*6.4;
     for(const q of [c,e])q.rect(x-.8,y,1.6,1.4);}
   c.fillStyle="#f0bf78";c.fill();e.fillStyle="rgba(255,188,110,.5)";e.fill();
   const tg=c.createRadialGradient(124,121,2,132,124,38);tg.addColorStop(0,"#9a9182");tg.addColorStop(1,"#6a6357");
   c.fillStyle=tg;hotelPoly(c,plT);c.fill();
   c.strokeStyle="rgba(90,84,76,.35)";c.lineWidth=.25;c.beginPath();c.ellipse(132,124,24,4.6,0,0,TAU);c.ellipse(132,124,12,2.3,0,0,TAU);c.stroke();
   c.strokeStyle="rgba(196,188,172,.75)";c.lineWidth=.22;c.beginPath();   /* перила по переднему краю */
   const rl=hotelArc(132,124,35.4,6.6,.05,Math.PI-.05,30);c.moveTo(rl[0],rl[1]-1.2);for(let i=2;i<rl.length;i+=2)c.lineTo(rl[i],rl[i+1]-1.2);
   for(let i=0;i<rl.length;i+=4){c.moveTo(rl[i],rl[i+1]);c.lineTo(rl[i],rl[i+1]-1.2);}c.stroke();
   for(const x of [100,112,152,164]){const y=121.2;   /* деревья в кадках: олива, не зелень */
     c.fillStyle="#5a4a3a";c.fillRect(x-1,y+.6,2,1.4);c.fillStyle="#3b3226";c.fillRect(x-.2,y-2,.4,2.6);
     c.fillStyle="#56583a";c.beginPath();c.arc(x,y-3.6,2.3,0,TAU);c.fill();c.fillStyle="#7e7a4c";c.beginPath();c.arc(x-.7,y-4.3,1.2,0,TAU);c.fill();}
   c.strokeStyle="#2e2a26";c.lineWidth=.3;c.beginPath();
   for(const a of [.35,.9,2.25,2.8]){const x=132+Math.cos(a)*33,y=124+Math.sin(a)*6;c.moveTo(x,y);c.lineTo(x,y-4.6);}c.stroke();
   for(const a of [.35,.9,2.25,2.8])hotelLamp(c,e,132+Math.cos(a)*33,124+Math.sin(a)*6-4.9,.45,[255,210,150],.85);
   const PC=["#3a3f52","#5a3a34","#2e2f33","#6a5a44","#3c4a5a","#7a3e36"];
   for(let i=0;i<13;i++){const a=r()*TAU,d=.35+r()*.6,x=132+Math.cos(a)*34*d,y=124+Math.sin(a)*6*d;
     if(Math.abs(x-125)<7&&y<122)continue;   /* не на статуе */
     c.fillStyle=PC[i%PC.length];c.fillRect(x-.45,y-2.4,.9,2.4);c.fillStyle="#d8b89a";c.beginPath();c.arc(x,y-2.85,.42,0,TAU);c.fill();}
   /* постамент и космонавт: плащ до пят, левая рука вдоль тела, правая вверх со звездой */
   c.fillStyle="#625b51";hotelPoly(c,ped);c.fill();c.fillStyle="#8a8172";c.fillRect(120,107,10,1.2);
   c.fillStyle="#433e37";hotelPoly(c,[127.8,108.2,130,108.2,131,121,128.6,121]);c.fill();
   const F=[-3,0,-2.6,-8,-3.2,-13,-3.6,-15.5,-2.2,-16.8,-1.4,-17.2,-1.6,-18.6,-.9,-19.8,.3,-20,1.2,-19.2,1.3,-17.8,.9,-17,
     2.2,-16.6,3.2,-17.6,4.2,-21,4.8,-25,5.8,-25.2,5.6,-21,4.4,-17,3.4,-14.6,3,-8,3.2,0].map((v,i)=>i%2?107+v*1.5:125+v*1.5);   /* фигура в полтора роста дома: главная на площади */
   hotelRim(c,[F],.7);
   const sg=c.createLinearGradient(119,0,133,0);sg.addColorStop(0,"#948a7a");sg.addColorStop(.5,"#5f584e");sg.addColorStop(1,"#332f2a");
   c.fillStyle=sg;hotelPoly(c,F);c.fill();
   c.strokeStyle="rgba(30,26,22,.45)";c.lineWidth=.22;c.beginPath();c.moveTo(124.4,83);c.lineTo(123.5,107);c.moveTo(127.1,84.5);c.lineTo(128,107);c.stroke();
   hotelStar(c,133,66.5,2.6,"#f0cf72");
   const sgl=e.createRadialGradient(133,66.5,0,133,66.5,4.4);sgl.addColorStop(0,"rgba(255,214,120,.7)");sgl.addColorStop(.3,"rgba(255,200,110,.22)");sgl.addColorStop(1,"rgba(255,190,100,0)");
   e.fillStyle=sgl;e.fillRect(128.6,62.1,8.8,8.8);}
  yield;
  /* ── причальная труба от ступицы влево, челнок носом в неё ── */
  hotelDock(c,e,113,140,59,147,sd);
}
HOTEL_T.gt={W:250,H:170,PX:2,ax:138,ay:80,sign:[138,34,6.5],sheen:[138,34,46],wins:hkWins,paint:hkPaint};
