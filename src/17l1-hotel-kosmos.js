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
const HK_STAIR=[6,29],HK_HALO=[.4,1.1];   /* отсвет окна на стену: меньше половины простенка */
/* разбивка на комнаты по столбцам (одна на все этажи — несущие стены): номер комнаты столбца */
const HK_ROOM=(()=>{const cut=[0,2,5,7,10,12,14,20,22,25,27,30,32,34],R=[];let r=-1;
  for(let i=0;i<HK_NC;i++){if(cut.includes(i))r++;R.push(r);}return R;})();
function hkWins(){
  if(HK_WINS)return HK_WINS;
  const W=[];
  for(let j=0;j<HK_NR;j++)for(let i=0;i<HK_NC;i++){
    if(i>=16&&i<=19)continue;                      /* знамя */
    if(i===HK_STAIR[0]||i===HK_STAIR[1])continue;  /* лестницы: глухая полоса */
    if(j>=HK_NR-2&&i>=13&&i<=22)continue;          /* портик */
    const um=(i+.5)/HK_NC,t=hkTop(um)+3,b=hkBot(um),fh=(b-t)/HK_NR;
    /* комната — два-три окна по разбивке сетки; этаж 1 — ресторан, 11 — холл: зал целиком */
    const room=j===1?9001:j===11?9011:j*64+HK_ROOM[i];
    W.push([hkQ(hkX((i+.16)/HK_NC)),hkQ(t+fh*(j+.3)),hkQ(hkX((i+.84)/HK_NC)),hkQ(t+fh*(j+.74)),room]);   /* окна лентой: этаж читается полосой, не шашкой */
  }
  for(let j=0;j<15;j++){const y=hkQ(24+j*5.6);   /* левая башня: два ряда по бокам полосы */
    W.push([41.5,y,44.5,y+3,5000+j],[53.5,y,56.5,y+3,5000+j]);}
  for(let j=0;j<16;j++){const y=hkQ(20+j*5.6);   /* правая: торец к свету и узкие по краям лица */
    W.push([213.5,y,216.5,y+3,6000+j],[219,y,221,y+3,6000+j],[237,y,239,y+3,6100+j]);}
  return HK_WINS=W;
}
const HK_DARK=["#10141c","#131722","#0e1219","#151a24"];   /* Y≈.08: стекло темнее стены, холод неба */
function* hkPaint(c,e,sd,lit){
  if(lit){hotelWindows(c,e,hkWins(),sd,true,null,HK_HALO);return;}
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
  const ped=[132,104,144,104,145.5,121,130.5,121];
  hotelRim(c,[lTf,lTs,rTs,rTf,slab,deck,keel,hub,podR,podL,podM,plR,plT,ped],1.3);
  yield;
  /* ── днище: тёмный металл, панели, иллюминаторы, капсулы с красными огнями ── */
  {const g=c.createLinearGradient(0,116,0,139);g.addColorStop(0,"#3e3a36");g.addColorStop(1,"#18171a");c.fillStyle=g;hotelPoly(c,keel);c.fill();
   c.strokeStyle="rgba(24,22,20,.45)";c.lineWidth=.3;c.beginPath();
   for(let x=46;x<240;x+=9){c.moveTo(x,118);c.lineTo(x+(x-140)*.04,138);}
   c.moveTo(48,125);c.lineTo(240,126);c.moveTo(70,132);c.lineTo(220,133);c.stroke();
   c.beginPath();e.beginPath();
   for(let x=58;x<232;x+=4.5){if(((hashi(x|0,sd,0x6B06)>>>0)%3)===0)continue;for(const q of [c,e])q.rect(x,122.4,1.6,1.1);}
   c.fillStyle="#e9b56c";c.fill();e.fillStyle="rgba(255,184,104,.5)";e.fill();}
  for(const [p,x0,x1,yr,n] of [[podL,42,58,122,2],[podM,178,198,140,3],[podR,216,240,130,4]]){
    const g=c.createLinearGradient(x0,0,x1,0);g.addColorStop(0,"#524c45");g.addColorStop(.45,"#35322f");g.addColorStop(1,"#18171b");
    c.fillStyle=g;hotelPoly(c,p);c.fill();
    c.fillStyle="rgba(20,18,16,.5)";c.fillRect(x0,yr-2.2,x1-x0,.6);c.fillRect(x0,yr+3.2,x1-x0,.6);
    c.beginPath();e.beginPath();const st=(x1-x0)/n;
    for(let i=0;i<n;i++)for(const q of [c,e])q.rect(x0+st*(i+.3),yr-.8,st*.4,2.4);
    c.fillStyle="#efbd76";c.fill();e.fillStyle="rgba(255,186,108,.55)";e.fill();
    hotelLamp(c,e,(x0+x1)/2,p[p.length/2+1]+1.2,.55,[255,58,46],.95);}
  {const g=c.createLinearGradient(112,0,152,0);g.addColorStop(0,"#524c45");g.addColorStop(.4,"#38342f");g.addColorStop(1,"#18171b");
   c.fillStyle=g;hotelPoly(c,hub);c.fill();
   c.beginPath();e.beginPath();for(let i=0;i<9;i++)for(const q of [c,e])q.rect(114.5+i*4.3,134,2,2.8);
   c.fillStyle="#f3c27c";c.fill();e.fillStyle="rgba(255,190,112,.6)";e.fill();
   c.fillStyle="rgba(20,18,16,.55)";c.fillRect(112,131.5,40,.7);c.fillRect(112,139,40,.7);
   hotelLamp(c,e,132,151.6,.6,[255,58,46],.95);}
  yield;
  /* ── башни: белый камень, красная полоса; правая — звезда и планета с кольцом ── */
  {let g=c.createLinearGradient(0,16,0,114);g.addColorStop(0,"#5e5346");g.addColorStop(1,"#352f2a");c.fillStyle=g;hotelPoly(c,lTf);c.fill();
   c.fillStyle="#1d1f29";hotelPoly(c,lTs);c.fill();
   c.fillStyle="#6a1f1a";hotelPoly(c,[46,108,46,29,...hotelArc(49,29,3,3,Math.PI,2*Math.PI,8),52,108]);c.fill();
   c.fillStyle="rgba(255,214,170,.12)";c.fillRect(46,30,.8,78);
   for(const y of [40,62,84]){const cg=c.createLinearGradient(34,0,40,0);cg.addColorStop(0,"#3e3a36");cg.addColorStop(1,"#1a1b22");   /* капсулы на левом боку */
     c.fillStyle=HOTEL_RIM;c.fillRect(33.6,y-.4,6.8,12.8);c.fillStyle=cg;c.fillRect(34.2,y,6,12);c.fillStyle="rgba(20,18,16,.5)";c.fillRect(34.2,y+3,6,.5);c.fillRect(34.2,y+8,6,.5);}
   g=c.createLinearGradient(212,0,218,0);g.addColorStop(0,"#76654f");g.addColorStop(1,"#5c4f40");c.fillStyle=g;hotelPoly(c,rTs);c.fill();
   g=c.createLinearGradient(0,12,0,117);g.addColorStop(0,"#4c433a");g.addColorStop(1,"#2e2a28");c.fillStyle=g;hotelPoly(c,rTf);c.fill();
   c.fillStyle="#62201a";hotelPoly(c,[222,22,236,22,236,100,229,111,222,100]);c.fill();
   c.fillStyle="rgba(0,0,0,.18)";c.fillRect(232.5,22,3.5,78);
   hotelStar(c,229,31,3.4,"#e3be62");
   {const pg=c.createRadialGradient(227.6,62.6,.5,229,64,4.6);pg.addColorStop(0,"#8a8174");pg.addColorStop(1,"#2a2826");
    c.fillStyle=pg;c.beginPath();c.arc(229,64,4.4,0,TAU);c.fill();
    c.strokeStyle="#d7c890";c.lineWidth=.55;c.beginPath();c.ellipse(229,64,9.5,2.8,-.32,0,TAU);c.stroke();}
   for(const y of [58,86])   /* машинерия на правом боку */
     {c.fillStyle=HOTEL_RIM;c.fillRect(239.6,y-.4,6,14.8);c.fillStyle="#2c2a2a";c.fillRect(240,y,5.2,14);c.fillStyle="#4a443d";c.fillRect(240,y,1.4,14);}
   /* крыши башен: надстройка, антенны, красные огни */
   for(const [x0,x1,y] of [[43,55,16],[221,236,12]]){c.fillStyle=HOTEL_RIM;c.fillRect(x0-.5,y-6.5,x1-x0+1,6.6);
     c.fillStyle="#3e3934";c.fillRect(x0,y-6,x1-x0,6);c.fillStyle="#62574a";c.fillRect(x0,y-6,(x1-x0)*.35,6);
     c.fillStyle="#b9a88e";c.fillRect(x0,y-6.2,x1-x0,.35);   /* кромка на небе */
     c.fillStyle="#4a443d";c.fillRect(x0-1.5,y-.8,x1-x0+3,1);}
   c.strokeStyle="#2a2724";c.lineWidth=.45;c.beginPath();
   for(const [x,y0,y1] of [[45,10,1],[52,10,4],[223,6,-2],[233,6,2],[227.5,6,0.5]]){c.moveTo(x,y0);c.lineTo(x,y1);c.moveTo(x-1.4,y1+2.2);c.lineTo(x+1.4,y1+2.2);}
   c.stroke();
   for(const [x,y] of [[45,1],[52,4],[223,-2],[233,2]])hotelLamp(c,e,x,y+.6,.5,[255,58,46],.9);}
  yield;
  /* ── полумесяц: камень (левое крыло в тени), пилоны, пояса этажей, карниз, надстройки ── */
  {const g=c.createLinearGradient(HK_XL,0,HK_XR,0);g.addColorStop(0,"#1c1f2c");g.addColorStop(.42,"#34303a");g.addColorStop(.62,"#4a3f39");g.addColorStop(1,"#5a4b3d");
   c.fillStyle=g;hotelPoly(c,slab);c.fill();
   {const v=c.createLinearGradient(0,30,0,120);   /* кверху темнее, у подножия — тёплый свет площадки */
    v.addColorStop(0,"rgba(8,8,18,.4)");v.addColorStop(.35,"rgba(8,8,18,0)");v.addColorStop(.75,"rgba(255,150,70,0)");v.addColorStop(1,"rgba(255,150,70,.2)");
    c.fillStyle=v;hotelPoly(c,slab);c.fill();}
   const col=(i,w,fill)=>{c.beginPath();for(const I of i){const u0=(I-w)/HK_NC,u1=(I+w)/HK_NC;
     c.moveTo(hkX(u0),hkTop(u0)+3);c.lineTo(hkX(u1),hkTop(u1)+3);c.lineTo(hkX(u1),hkBot(u1));c.lineTo(hkX(u0),hkBot(u0));c.closePath();}c.fillStyle=fill;c.fill();};
   col([4,8,12],.16,"#4a1a1c");col([24,28,32],.16,"#76251c");   /* пилоны: в тени — тёмный кармин, на свету — красный */
   col([3.87,7.87,11.87],.03,"rgba(150,160,210,.12)");col([23.87,27.87,31.87],.03,"rgba(255,196,150,.22)");   /* грань к свету */
   col([4.13,8.13,12.13,24.13,28.13,32.13],.03,"rgba(4,4,12,.35)");   /* теневая грань */
   col(HK_STAIR.map(i=>i+.5),.34,"#15161d");   /* лестницы: глухие полосы */
   c.strokeStyle="rgba(170,146,120,.16)";c.lineWidth=.4;c.beginPath();   /* пояса перекрытий: кромка плиты ловит свет */
   for(let j=0;j<=HK_NR;j++){for(let i=0;i<=N;i++){const u=i/N,t=hkTop(u)+3,y=t+(hkBot(u)-t)*j/HK_NR;if(i)c.lineTo(hkX(u),y);else c.moveTo(hkX(u),y);}}
   c.stroke();
   {const cg=c.createLinearGradient(HK_XL,0,HK_XR,0);cg.addColorStop(0,"#57555a");cg.addColorStop(1,"#dccdb2");   /* парапет: светлая нить силуэта */
    c.fillStyle=cg;c.beginPath();
    for(let i=0;i<=N;i++){const u=i/N;if(i)c.lineTo(hkX(u),hkTop(u));else c.moveTo(hkX(u),hkTop(u));}
    for(let i=N;i>=0;i--){const u=i/N;c.lineTo(hkX(u),hkTop(u)+1.1);}c.closePath();c.fill();
    c.fillStyle="#2a2624";c.beginPath();
    for(let i=0;i<=N;i++){const u=i/N;if(i)c.lineTo(hkX(u),hkTop(u)+1.1);else c.moveTo(hkX(u),hkTop(u)+1.1);}
    for(let i=N;i>=0;i--){const u=i/N;c.lineTo(hkX(u),hkTop(u)+2.2);}c.closePath();c.fill();}
   c.fillStyle="#7c231c";c.beginPath();
   for(let i=0;i<=N;i++){const u=i/N;if(i)c.lineTo(hkX(u),hkTop(u)+2.2);else c.moveTo(hkX(u),hkTop(u)+2.2);}
   for(let i=N;i>=0;i--){const u=i/N;c.lineTo(hkX(u),hkTop(u)+2.9);}c.closePath();c.fill();
   for(const u of [.14,.3,.7,.86]){const x=hkX(u),y=hkTop(u);   /* машинные на крыше */
     c.fillStyle=HOTEL_RIM;c.fillRect(x-4.5,y-4.3,9,4.4);c.fillStyle="#3c3834";c.fillRect(x-4,y-3.8,8,3.9);c.fillStyle="#5e554a";c.fillRect(x-4,y-3.8,2.6,3.9);c.fillStyle="#a8987e";c.fillRect(x-4,y-3.9,8,.3);}
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
   c.fillStyle="#6e6152";for(let i=0;i<6;i++)c.fillRect(119.6+i*7,b-11,1.5,11);
   c.fillStyle="rgba(0,0,0,.25)";for(let i=0;i<6;i++)c.fillRect(120.6+i*7,b-11,.5,11);
   c.fillStyle="#8a7a64";hotelPoly(c,[116,b-14,160,b-14,161.5,b-11,114.5,b-11]);c.fill();c.fillStyle="#d8c6a6";c.fillRect(116,b-14.2,44,.35);
   c.fillStyle="#7c231c";c.fillRect(116,b-12,44,.7);
   for(const x of [109.5,163])   /* флаги: красное полотнище со звездой на древке */
     {c.fillStyle="#2c2926";c.fillRect(x+2,b-20,.4,20);c.fillStyle=HOTEL_RIM;c.fillRect(x-.4,b-19.4,4.8,13.8);
      c.fillStyle="#8a2821";c.fillRect(x,b-19,4,13);hotelStar(c,x+2,b-16,1.1,"#e3be62");}}
  yield;
  /* ── галерея вдоль подножия: плита, перила, фонари ── */
  {c.fillStyle="#2a2724";hotelPoly(c,deck);c.fill();
   c.fillStyle="#5e5549";c.beginPath();c.moveTo(34,112);
   for(let i=0;i<=N;i++){const u=i/N;c.lineTo(hkX(u),hkBot(u)+.5);}c.lineTo(218,116.5);c.lineTo(246,116.5);c.lineTo(246,117.8);c.lineTo(218,117.8);
   for(let i=N;i>=0;i--){const u=i/N;c.lineTo(hkX(u),hkBot(u)+1.8);}c.lineTo(34,113.3);c.closePath();c.fill();
   c.strokeStyle="rgba(196,188,172,.7)";c.lineWidth=.22;c.beginPath();
   for(let i=0;i<=N*3;i++){const u=i/(N*3),x=hkX(u),y=hkBot(u)+.5;if(x>112&&x<164)continue;c.moveTo(x,y);c.lineTo(x,y-1.3);}
   for(let i=0;i<=N;i++){const u=i/N;if(i)c.lineTo(hkX(u),hkBot(u)-.8);else c.moveTo(hkX(u),hkBot(u)-.8);}c.stroke();
   for(let i=1;i<12;i++){const u=i/12;if(Math.abs(u-.5)<.12)continue;hotelLamp(c,e,hkX(u),hkBot(u)+2.8,.42,[255,196,120],.8);}}
  yield;
  /* ── площадка: камень, кромка с окнами, перила, фонари, деревья, люди, статуя ── */
  {const g=c.createLinearGradient(0,129,0,134);g.addColorStop(0,"#3a3632");g.addColorStop(1,"#1c1b1c");
   c.fillStyle=g;hotelPoly(c,plR);c.fill();
   c.beginPath();e.beginPath();for(let i=0;i<14;i++){const a=Math.PI*(i+.5)/14,x=132+Math.cos(a)*34,y=129.6+Math.sin(a)*6.4;
     for(const q of [c,e])q.rect(x-.8,y,1.6,1.4);}
   c.fillStyle="#f0bf78";c.fill();e.fillStyle="rgba(255,188,110,.5)";e.fill();
   const tg=c.createRadialGradient(124,121,2,132,124,38);tg.addColorStop(0,"#7a6c5a");tg.addColorStop(1,"#3e3934");   /* площадь светлее у входа: огни портика */
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
     if(Math.abs(x-138)<9&&y<122)continue;   /* не на постаменте */
     c.fillStyle=PC[i%PC.length];c.fillRect(x-.45,y-2.4,.9,2.4);c.fillStyle="#d8b89a";c.beginPath();c.arc(x,y-2.85,.42,0,TAU);c.fill();}
   /* постамент и космонавт: плащ до пят, левая рука вдоль тела, правая вверх со звездой */
   c.fillStyle="#3a3531";hotelPoly(c,ped);c.fill();c.fillStyle="#a89478";c.fillRect(132,104,12,.8);
   c.fillStyle="#221f1f";hotelPoly(c,[141,105,144,105,145.5,121,142,121]);c.fill();
   const F=[-3,0,-2.6,-8,-3.2,-13,-3.6,-15.5,-2.2,-16.8,-1.4,-17.2,-1.6,-18.6,-.9,-19.8,.3,-20,1.2,-19.2,1.3,-17.8,.9,-17,
     2.2,-16.6,3.2,-17.6,4.2,-21,4.8,-25,5.8,-25.2,5.6,-21,4.4,-17,3.4,-14.6,3,-8,3.2,0].map((v,i)=>i%2?104+v*2:137.5+v*2.1);   /* фигура на знамени: читается на телефоне ×1.6 */
   c.strokeStyle="rgba(255,186,110,.75)";c.lineWidth=.9;hotelPoly(c,F);c.stroke();   /* тёплый контур: подсветка снизу */
   const sg=c.createLinearGradient(130,0,150,0);sg.addColorStop(0,"#3a332d");sg.addColorStop(.5,"#231f1d");sg.addColorStop(1,"#141318");
   c.fillStyle=sg;hotelPoly(c,F);c.fill();
   e.strokeStyle="rgba(255,170,90,.35)";e.lineWidth=.8;hotelPoly(e,F);e.stroke();
   c.strokeStyle="rgba(0,0,0,.4)";c.lineWidth=.3;c.beginPath();c.moveTo(136.7,75);c.lineTo(135.8,104);c.moveTo(139.4,77);c.lineTo(140.3,104);c.stroke();
   hotelStar(c,149.7,53.6,3,"#fff0b8");
   const sgl=e.createRadialGradient(149.7,53.6,0,149.7,53.6,6.5);sgl.addColorStop(0,"rgba(255,236,170,1)");sgl.addColorStop(.3,"rgba(255,206,120,.45)");sgl.addColorStop(1,"rgba(255,190,100,0)");
   e.fillStyle=sgl;e.fillRect(143.2,47.1,13,13);}
  yield;
  /* ── причальная труба от ступицы влево, челнок носом в неё ── */
  hotelDock(c,e,113,140,59,147,sd);
}
HOTEL_T.gt={W:250,H:170,PX:2,ax:138,ay:80,sign:[138,34,8],sheen:[138,34,46],halo:HK_HALO,wins:hkWins,paint:hkPaint};
