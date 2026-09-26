/* ══════════════ гостиница «Космос» — ГЛАВТРАССА (gt, эталон шести типов) ══════════════
   Полумесяц в четырнадцать этажей между двумя башнями: края ближе и выше, середина глубже —
   «улыбка» снизу. Бетон в тёплом ключе звезды с холодной тенью, красные пилоны, в середине —
   красное знамя со звездой над портиком; перед входом на площадке — космонавт с факелом-звездой
   в поднятой руке (самая яркая точка дома). Под домом — тёмное днище с капсулами и красными
   огнями, от ступицы влево — причальная труба с челноком (общая). Свет — один, звезда системы
   (Lt из ядра): крыло, что смотрит на неё, светлое, другое — в холодной тени; у пилонов и башен
   грань к звезде светлая, от неё — тёмная; башня со стороны звезды кладёт тень на крыло; карниз
   и козырёк кладут тень вниз, статуя — на площадку. Снизу дом греют фонари площадки, кверху он
   темнеет. Мерило — человек: этаж 5.7 ед., человек на площадке — 3 ед. Вывеска на крыше — неон
   17k0, Т погасла. Разброс по системе — от зерна hashi(sd): лампы и шторы окон, люди на площадке */
const HK_XL=64,HK_XR=212,HK_A=1.0,HK_NC=36,HK_NR=14;
const hkX=u=>HK_XL+(HK_XR-HK_XL)*(.5+.5*Math.sin((u-.5)*2*HK_A)/Math.sin(HK_A));   /* края сжаты: вогнутый фасад */
const hkS=u=>1-(2*u-1)*(2*u-1);
const hkTop=u=>30+12*hkS(u),hkBot=u=>110+8*hkS(u);
const hkQ=v=>Math.round(v*2)/2;   /* окна — по сетке пикселя мастера (PX 2): рамка кадра = краска */
/* освещённость грани — hotelN/hotelUp/hotelDn из ядра 17l (общие для шести типов) */
const hkFace=(u,Lt)=>hotelN((.5-u)*2*HK_A,Lt);   /* фасад вогнут, края ближе: нормаль левого крыла смотрит вправо, к середине */
const HK_WALL=[178,166,148],HK_RED=[158,42,34],HK_CREAM=[196,188,172],HK_STEEL=[96,90,84],HK_BRONZE=[196,182,158];
const HK_DARK=["#10141c","#131722","#0e1219","#151a24"];   /* Y≈.08: стекло темнее стены, холод неба */
let HK_WINS=null;
const HK_STAIR=[6,29],HK_HALO=[.5,.8];   /* отсвет окна на стену: меньше половины простенка */
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
    /* окно — половина простенка (как у концепта: точка в тёмной нише, не шашка) */
    W.push([hkQ(hkX((i+.22)/HK_NC)),hkQ(t+fh*(j+.3)),hkQ(hkX((i+.78)/HK_NC)),hkQ(t+fh*(j+.7)),room]);
  }
  for(let j=0;j<15;j++){const y=hkQ(24+j*5.6);   /* левая башня: два ряда по бокам полосы */
    W.push([42,y,44,y+2.5,5000+j],[54,y,56,y+2.5,5000+j]);}
  for(let j=0;j<16;j++){const y=hkQ(20+j*5.6);   /* правая: торец и узкие по краям лица */
    W.push([214,y,216,y+2.5,6000+j],[219,y,221,y+2.5,6000+j],[237,y,239,y+2.5,6100+j]);}
  return HK_WINS=W;
}
/* полоса вдоль полумесяца между двумя отступами от парапета (y0,y1 — от hkTop) */
function hkBand(c,N,y0,y1){c.beginPath();
  for(let i=0;i<=N;i++){const u=i/N;if(i)c.lineTo(hkX(u),hkTop(u)+y0);else c.moveTo(hkX(u),hkTop(u)+y0);}
  for(let i=N;i>=0;i--){const u=i/N;c.lineTo(hkX(u),hkTop(u)+y1);}c.closePath();}
function* hkPaint(c,e,sd,lit,Lt){
  if(lit){hotelWindows(c,e,hkWins(),sd,true,null,HK_HALO);return;}
  Lt=Lt||{lx:-.86,ly:-.51,K:[1,.88,.54],F:HOTEL_FILL};
  const r=rng((sd^0x6B05)>>>0),lx=Lt.lx,ly=Lt.ly,sg=lx>=0?1:-1;   /* sg: сторона звезды (+ справа) */
  const C=(base,s,warm)=>rgba(hotelLit(Lt,base,s,warm),1);
  const sF=hotelN(0,Lt),sR=hotelN(Math.PI/2,Lt),sL=hotelN(-Math.PI/2,Lt),sU=hotelUp(Lt),sD=hotelDn(Lt);   /* грани: фронт, вправо, влево, верх, низ */
  const sh=a=>"rgba(4,4,14,"+a.toFixed(2)+")";
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
  const PX0=132,PY0=125,PRX=46,PRY=8.5;   /* площадка: широкий овал перед входом */
  const plT=hotelArc(PX0,PY0,PRX,PRY,0,2*Math.PI,44),plR=[...hotelArc(PX0,PY0,PRX,PRY,0,Math.PI,22),...hotelArc(PX0,PY0+5.5,PRX,PRY,Math.PI,0,22)];
  const cx=124,ped=[cx-8,113,cx+8,113,cx+10,121.5,cx-10,121.5],pcol=[cx-5,101,cx+5,101,cx+5.5,113,cx-5.5,113];
  hotelRim(c,[lTf,lTs,rTs,rTf,slab,deck,keel,hub,podR,podL,podM,plR,plT,ped,pcol],1.3);
  yield;
  /* ── днище: тёмный металл (свет снизу — только если звезда ниже дома), панели, иллюминаторы,
     капсулы с красными огнями; бок капсулы к звезде светлее ── */
  {const g=c.createLinearGradient(0,116,0,139);g.addColorStop(0,C(HK_STEEL,sD+.38));g.addColorStop(1,C([60,58,60],sD+.2));c.fillStyle=g;hotelPoly(c,keel);c.fill();
   c.strokeStyle="rgba(10,10,14,.5)";c.lineWidth=.3;c.beginPath();
   for(let x=46;x<240;x+=9){c.moveTo(x,118);c.lineTo(x+(x-140)*.04,138);}
   c.moveTo(48,125);c.lineTo(240,126);c.moveTo(70,132);c.lineTo(220,133);c.stroke();
   c.beginPath();e.beginPath();
   for(let x=58;x<232;x+=4.5){if(((hashi(x|0,sd,0x6B06)>>>0)%3)===0)continue;for(const q of [c,e])q.rect(x,122.4,1.6,1.1);}
   c.fillStyle="#e2ae66";c.fill();e.fillStyle="rgba(255,184,104,.5)";e.fill();}
  for(const [p,x0,x1,yr,n] of [[podL,42,58,122,2],[podM,178,198,140,3],[podR,216,240,130,4]]){
    const g=c.createLinearGradient(sg>0?x0:x1,0,sg>0?x1:x0,0);g.addColorStop(0,C([52,48,50],sD+.22));g.addColorStop(.5,C([72,68,64],sD+.32));g.addColorStop(1,C(HK_STEEL,sD+.5));
    c.fillStyle=g;hotelPoly(c,p);c.fill();
    c.fillStyle="rgba(10,10,14,.5)";c.fillRect(x0,yr-2.2,x1-x0,.6);c.fillRect(x0,yr+3.2,x1-x0,.6);
    c.beginPath();e.beginPath();const st=(x1-x0)/n;
    for(let i=0;i<n;i++)for(const q of [c,e])q.rect(x0+st*(i+.3),yr-.8,st*.4,2.4);
    c.fillStyle="#e8b670";c.fill();e.fillStyle="rgba(255,186,108,.55)";e.fill();
    hotelLamp(c,e,(x0+x1)/2,p[p.length/2+1]+1.2,.55,[255,58,46],.95);}
  {const g=c.createLinearGradient(sg>0?112:152,0,sg>0?152:112,0);g.addColorStop(0,C([52,48,50],sD+.22));g.addColorStop(.5,C([72,68,64],sD+.32));g.addColorStop(1,C(HK_STEEL,sD+.5));
   c.fillStyle=g;hotelPoly(c,hub);c.fill();
   c.beginPath();e.beginPath();for(let i=0;i<9;i++)for(const q of [c,e])q.rect(114.5+i*4.3,134,2,2.8);
   c.fillStyle="#ecbb74";c.fill();e.fillStyle="rgba(255,190,112,.6)";e.fill();
   c.fillStyle="rgba(10,10,14,.55)";c.fillRect(112,131.5,40,.7);c.fillRect(112,139,40,.7);
   hotelLamp(c,e,132,151.6,.6,[255,58,46],.95);}
  yield;
  /* ── башни: светлый камень, фронт под ключом, внутренняя грань — к звезде или от неё;
     красная полоса, звезда; правая — планета с кольцом; машинерия на боках, надстройки, антенны ── */
  {let g=c.createLinearGradient(0,16,0,114);g.addColorStop(0,C(HK_CREAM,sF*.95+sU*.15));g.addColorStop(1,C(HK_CREAM,sF*.7,[30,14,4]));c.fillStyle=g;hotelPoly(c,lTf);c.fill();
   c.fillStyle=C(HK_CREAM,sR);hotelPoly(c,lTs);c.fill();
   c.fillStyle=C(HK_RED,sF);hotelPoly(c,[46,108,46,29,...hotelArc(49,29,3,3,Math.PI,2*Math.PI,8),52,108]);c.fill();
   c.fillStyle=sh(.3);c.fillRect(sg>0?46:51.2,30,.8,78);   /* полоса — рельеф: грань от звезды тёмная */
   hotelStar(c,49,23,2.6,C([232,196,110],sF+.4));
   for(const y of [40,62,84]){const cg=c.createLinearGradient(34,0,40,0);cg.addColorStop(0,C([70,66,62],sL*.6+.1));cg.addColorStop(1,C([40,40,48],.05));   /* капсулы на левом боку */
     c.fillStyle=HOTEL_RIM;c.fillRect(33.6,y-.4,6.8,12.8);c.fillStyle=cg;c.fillRect(34.2,y,6,12);c.fillStyle="rgba(10,10,14,.5)";c.fillRect(34.2,y+3,6,.5);c.fillRect(34.2,y+8,6,.5);}
   c.fillStyle=C(HK_CREAM,sL);hotelPoly(c,rTs);c.fill();
   g=c.createLinearGradient(0,12,0,117);g.addColorStop(0,C(HK_CREAM,sF*.95+sU*.15));g.addColorStop(1,C(HK_CREAM,sF*.7,[30,14,4]));c.fillStyle=g;hotelPoly(c,rTf);c.fill();
   c.fillStyle=C(HK_RED,sF);hotelPoly(c,[222,22,236,22,236,100,229,111,222,100]);c.fill();
   c.fillStyle=sh(.28);c.fillRect(sg>0?222:235.2,22,.8,78);
   hotelStar(c,229,31,3.4,C([232,196,110],sF+.4));
   {const pg=c.createRadialGradient(229+sg*1.6,62.4,.5,229,64,4.6);pg.addColorStop(0,C([150,142,128],sF+.3));pg.addColorStop(1,C([60,58,60],.05));
    c.fillStyle=pg;c.beginPath();c.arc(229,64,4.4,0,TAU);c.fill();
    c.strokeStyle=C([228,214,160],sF+.3);c.lineWidth=.55;c.beginPath();c.ellipse(229,64,9.5,2.8,-.32,0,TAU);c.stroke();}
   for(const y of [58,86])   /* машинерия на правом боку */
     {c.fillStyle=HOTEL_RIM;c.fillRect(239.6,y-.4,6,14.8);c.fillStyle=C([60,58,58],sR*.5);c.fillRect(240,y,5.2,14);c.fillStyle=C([90,84,78],sR);c.fillRect(240,y,1.4,14);}
   /* крыши башен: надстройка (верх, фронт, грань к звезде), антенны, красные огни */
   for(const [x0,x1,y] of [[43,55,16],[221,236,12]]){c.fillStyle=HOTEL_RIM;c.fillRect(x0-.5,y-6.5,x1-x0+1,6.6);
     c.fillStyle=C([110,102,92],sF*.8);c.fillRect(x0,y-6,x1-x0,6);
     c.fillStyle=C([110,102,92],sg>0?sR:sL);c.fillRect(sg>0?x1-(x1-x0)*.3:x0,y-6,(x1-x0)*.3,6);
     c.fillStyle=C([200,190,170],sU);c.fillRect(x0,y-6.3,x1-x0,.45);   /* кромка на небе */
     c.fillStyle=C([90,84,78],sF*.5);c.fillRect(x0-1.5,y-.8,x1-x0+3,1);}
   c.strokeStyle="#2a2724";c.lineWidth=.45;c.beginPath();
   for(const [x,y0,y1] of [[45,10,1],[52,10,4],[223,6,-2],[233,6,2],[227.5,6,0.5]]){c.moveTo(x,y0);c.lineTo(x,y1);c.moveTo(x-1.4,y1+2.2);c.lineTo(x+1.4,y1+2.2);}
   c.stroke();
   for(const [x,y] of [[45,1],[52,4],[223,-2],[233,2]])hotelLamp(c,e,x,y+.6,.5,[255,58,46],.9);}
  yield;
  /* ── полумесяц: камень под ключом звезды по изгибу, тень башни, карниз, пилоны, пояса
     этажей, стыки панелей, парапет, надстройки ── */
  {const g=c.createLinearGradient(HK_XL,0,HK_XR,0);
   for(let i=0;i<=12;i++){const u=i/12;g.addColorStop((hkX(u)-HK_XL)/(HK_XR-HK_XL),C(HK_WALL,hkFace(u,Lt)));}
   c.fillStyle=g;hotelPoly(c,slab);c.fill();
   {const v=c.createLinearGradient(0,30,0,120);   /* кверху темнее (холод неба), у подножия — тёплый свет площадки */
    v.addColorStop(0,"rgba(6,8,22,.34)");v.addColorStop(.42,"rgba(6,8,22,0)");v.addColorStop(.78,"rgba(255,150,70,0)");v.addColorStop(1,"rgba(255,150,70,.24)");
    c.fillStyle=v;hotelPoly(c,slab);c.fill();}
   {const tx=sg>0?211.5:64.5,tw=8+7*Math.abs(lx),g2=c.createLinearGradient(tx,0,tx-sg*tw,0);   /* тень башни со стороны звезды ложится на крыло */
    g2.addColorStop(0,sh(.38));g2.addColorStop(1,sh(0));c.fillStyle=g2;hotelPoly(c,slab);c.fill();}
   if(ly<0){c.fillStyle=sh(.42*-ly);hkBand(c,N,2.9,4.6);c.fill();}   /* карниз: звезда выше — тень под парапетом */
   const col=(I,w,fill)=>{c.beginPath();for(const i of I){const u0=(i-w)/HK_NC,u1=(i+w)/HK_NC;
     c.moveTo(hkX(u0),hkTop(u0)+3);c.lineTo(hkX(u1),hkTop(u1)+3);c.lineTo(hkX(u1),hkBot(u1));c.lineTo(hkX(u0),hkBot(u0));c.closePath();}c.fillStyle=fill;c.fill();};
   for(const I of [4,8,12,24,28,32]){const s=hkFace(I/HK_NC,Lt);   /* пилоны: красный камень под тем же ключом, грань к звезде и от неё */
     col([I],.17,C(HK_RED,s*.9+.1));
     col([I+sg*.14],.035,C([255,226,196],(sg>0?sR:sL)*.9));
     col([I-sg*.14],.035,sh(.45));}
   col(HK_STAIR.map(i=>i+.5),.34,"#12141c");   /* лестницы: глухие полосы стекла */
   {const sg1=c.createLinearGradient(HK_XL,0,HK_XR,0);   /* пояса перекрытий: кромка плиты ловит свет на светлом крыле */
    for(let i=0;i<=6;i++){const u=i/6;sg1.addColorStop((hkX(u)-HK_XL)/(HK_XR-HK_XL),rgba(hotelLit(Lt,[230,216,196],hkFace(u,Lt)),.16+.16*hkFace(u,Lt)));}
    c.strokeStyle=sg1;c.lineWidth=.4;c.beginPath();
    for(let j=1;j<=HK_NR;j++){for(let i=0;i<=N;i++){const u=i/N,t=hkTop(u)+3,y=t+(hkBot(u)-t)*j/HK_NR-.4;if(i)c.lineTo(hkX(u),y);else c.moveTo(hkX(u),y);}}
    c.stroke();
    c.strokeStyle="rgba(4,4,14,.22)";c.lineWidth=.3;c.beginPath();   /* и тень под плитой */
    for(let j=1;j<HK_NR;j++){for(let i=0;i<=N;i++){const u=i/N,t=hkTop(u)+3,y=t+(hkBot(u)-t)*j/HK_NR+.1;if(i)c.lineTo(hkX(u),y);else c.moveTo(hkX(u),y);}}
    c.stroke();
    c.strokeStyle="rgba(4,4,14,.09)";c.lineWidth=.25;c.beginPath();   /* стыки панелей между окнами */
    for(let i=1;i<HK_NC;i++){const u=i/HK_NC;c.moveTo(hkX(u),hkTop(u)+3);c.lineTo(hkX(u),hkBot(u));}c.stroke();}
   {const cg=c.createLinearGradient(HK_XL,0,HK_XR,0);   /* парапет: светлая нить силуэта (верх под звездой), тёмная полка, красная лента */
    for(let i=0;i<=6;i++){const u=i/6;cg.addColorStop((hkX(u)-HK_XL)/(HK_XR-HK_XL),C([232,222,204],sU*.7+hkFace(u,Lt)*.5));}
    c.fillStyle=cg;hkBand(c,N,0,1.1);c.fill();
    c.fillStyle=C([60,56,54],sF*.3);hkBand(c,N,1.1,2.2);c.fill();
    c.fillStyle=C(HK_RED,sF*.8);hkBand(c,N,2.2,2.9);c.fill();}
   for(const u of [.14,.3,.7,.86]){const x=hkX(u),y=hkTop(u),s=hkFace(u,Lt);   /* машинные на крыше */
     c.fillStyle=HOTEL_RIM;c.fillRect(x-4.5,y-4.3,9,4.4);c.fillStyle=C([110,102,92],s*.8);c.fillRect(x-4,y-3.8,8,3.9);
     c.fillStyle=C([110,102,92],sg>0?sR:sL);c.fillRect(sg>0?x+1.4:x-4,y-3.8,2.6,3.9);c.fillStyle=C([200,190,170],sU);c.fillRect(x-4,y-4,8,.35);}
   /* опоры вывески: стойки и рейка под буквами */
   c.strokeStyle="#3b3632";c.lineWidth=.4;c.beginPath();
   for(let x=96;x<=180;x+=6){c.moveTo(x,34.6);c.lineTo(x,hkTop(.5+(x-138)/300)+.2);}
   c.moveTo(94,34.8);c.lineTo(182,34.8);c.stroke();}
  yield;
  hotelWindows(c,e,hkWins(),sd,false,HK_DARK);
  yield;
  /* ── знамя со звездой, лестничные витражи, портик с козырьком и его тенью, флаги ── */
  {const x0=hkX(16.1/HK_NC),x1=hkX(19.9/HK_NC),y0=hkTop(.5)+5,y1=hkBot(.5)-13;
   const g=c.createLinearGradient(sg>0?x0:x1,0,sg>0?x1:x0,0);g.addColorStop(0,C(HK_RED,sF*.5));g.addColorStop(.6,C(HK_RED,sF*.9+.1));g.addColorStop(1,C(HK_RED,sF*1.1+.2));
   c.fillStyle=HOTEL_RIM;c.fillRect(x0-.4,y0-.4,x1-x0+.8,y1-y0+.8);c.fillStyle=g;c.fillRect(x0,y0,x1-x0,y1-y0);
   hotelStar(c,138,y0+6,4.2,C([236,200,110],sF+.5));
   c.fillStyle=rgba(hotelLit(Lt,[236,200,110],sF+.4),.8);for(const x of [135.4,138,140.6])c.fillRect(x-.18,y0+12,.36,y1-y0-14);
   const sa=hkX(15.35/HK_NC),sb=hkX(15.8/HK_NC),sc=hkX(20.2/HK_NC),sdd=hkX(20.65/HK_NC);
   c.beginPath();e.beginPath();for(const q of [c,e]){q.rect(sa,y0,sb-sa,y1-y0);q.rect(sc,y0,sdd-sc,y1-y0);}
   c.fillStyle="#e2ac60";c.fill();e.fillStyle="rgba(255,186,108,.45)";e.fill();
   c.fillStyle="rgba(60,40,30,.5)";for(let y=y0+5.4;y<y1;y+=5.4){c.fillRect(sa,y,sb-sa,.4);c.fillRect(sc,y,sdd-sc,.4);}}
  {const b=hkBot(.5);   /* портик: козырёк, светлый вестибюль, колонны */
   c.fillStyle=HOTEL_RIM;c.fillRect(115.5,b-14.4,45,14.6);
   c.fillStyle="#4a3220";c.fillRect(119,b-11,38,11);   /* вестибюль за стеклом: тёплая тьма, в ней — светлые двери */
   c.beginPath();e.beginPath();for(let i=0;i<5;i++)for(const q of [c,e])q.rect(123.4+i*7,b-9.6,2.6,9.6);
   c.fillStyle="#d89a58";c.fill();e.fillStyle="rgba(255,190,120,.3)";e.fill();
   c.fillStyle="rgba(255,200,140,.5)";c.fillRect(119,b-.6,38,.6);
   if(ly<0){c.fillStyle=sh(.4*-ly);c.fillRect(119,b-11,38,Math.min(4,-ly*4.5));}   /* козырёк кладёт тень вниз, на стекло */
   c.fillStyle=C([180,170,150],sF+.3);for(let i=0;i<6;i++)c.fillRect(119.6+i*7,b-11,1.5,11);
   c.fillStyle=sh(.3);for(let i=0;i<6;i++)c.fillRect(sg>0?119.6+i*7:120.6+i*7,b-11,.5,11);
   c.fillStyle=C([170,156,134],sF+.1);hotelPoly(c,[116,b-14,160,b-14,161.5,b-11,114.5,b-11]);c.fill();c.fillStyle=C([230,218,196],sU);c.fillRect(116,b-14.2,44,.35);
   c.fillStyle=C(HK_RED,sF*.8);c.fillRect(116,b-12,44,.7);
   for(const x of [109.5,163])   /* флаги: красное полотнище со звездой на древке */
     {c.fillStyle="#2c2926";c.fillRect(x+2,b-20,.4,20);c.fillStyle=HOTEL_RIM;c.fillRect(x-.4,b-19.4,4.8,13.8);
      c.fillStyle=C(HK_RED,sF+.2);c.fillRect(x,b-19,4,13);hotelStar(c,x+2,b-16,1.1,C([232,196,110],sF+.4));}}
  yield;
  /* ── галерея вдоль подножия: плита, перила, фонари ── */
  {c.fillStyle=C([80,74,68],sF*.5);hotelPoly(c,deck);c.fill();
   c.fillStyle=C([140,128,112],sU+.1);c.beginPath();c.moveTo(34,112);
   for(let i=0;i<=N;i++){const u=i/N;c.lineTo(hkX(u),hkBot(u)+.5);}c.lineTo(218,116.5);c.lineTo(246,116.5);c.lineTo(246,117.8);c.lineTo(218,117.8);
   for(let i=N;i>=0;i--){const u=i/N;c.lineTo(hkX(u),hkBot(u)+1.8);}c.lineTo(34,113.3);c.closePath();c.fill();
   c.strokeStyle="rgba(196,188,172,.7)";c.lineWidth=.22;c.beginPath();
   for(let i=0;i<=N*3;i++){const u=i/(N*3),x=hkX(u),y=hkBot(u)+.5;if(x>112&&x<164)continue;c.moveTo(x,y);c.lineTo(x,y-1.3);}
   for(let i=0;i<=N;i++){const u=i/N;if(i)c.lineTo(hkX(u),hkBot(u)-.8);else c.moveTo(hkX(u),hkBot(u)-.8);}c.stroke();
   for(let i=1;i<12;i++){const u=i/12;if(Math.abs(u-.5)<.12)continue;hotelLamp(c,e,hkX(u),hkBot(u)+2.8,.42,[255,196,120],.8);}}
  yield;
  /* ── площадка: камень, тёплый свет вестибюля, кромка с окнами, тень статуи, перила, фонари,
     деревья, люди, постамент, космонавт с факелом ── */
  {const g=c.createLinearGradient(0,PY0+4,0,PY0+PRY+5.5);g.addColorStop(0,C([70,66,62],sF*.4));g.addColorStop(1,C([40,38,40],.05));
   c.fillStyle=g;hotelPoly(c,plR);c.fill();
   c.beginPath();e.beginPath();for(let i=0;i<18;i++){const a=Math.PI*(i+.5)/18,x=PX0+Math.cos(a)*(PRX-2),y=PY0+4.6+Math.sin(a)*(PRY-1.6);
     for(const q of [c,e])q.rect(x-.8,y,1.6,1.4);}
   c.fillStyle="#ecbb74";c.fill();e.fillStyle="rgba(255,188,110,.5)";e.fill();
   const tg=c.createLinearGradient(sg>0?PX0+PRX:PX0-PRX,0,sg>0?PX0-PRX:PX0+PRX,0);tg.addColorStop(0,C([120,108,92],sU+.3));tg.addColorStop(1,C([120,108,92],sU*.4));
   c.fillStyle=tg;hotelPoly(c,plT);c.fill();
   {const lg=c.createRadialGradient(138,PY0-6,2,138,PY0-2,34);lg.addColorStop(0,"rgba(255,176,96,.26)");lg.addColorStop(.5,"rgba(255,160,80,.08)");lg.addColorStop(1,"rgba(255,150,70,0)");   /* свет вестибюля на камне */
    c.fillStyle=lg;hotelPoly(c,plT);c.fill();
    const eg=e.createRadialGradient(138,PY0-6,2,138,PY0-2,24);eg.addColorStop(0,"rgba(255,176,96,.12)");eg.addColorStop(1,"rgba(255,150,70,0)");e.fillStyle=eg;hotelPoly(e,plT);e.fill();}
   c.strokeStyle="rgba(90,84,76,.35)";c.lineWidth=.25;c.beginPath();c.ellipse(PX0,PY0,30,5.4,0,0,TAU);c.ellipse(PX0,PY0,15,2.7,0,0,TAU);c.stroke();
   c.fillStyle=sh(.38);hotelPoly(c,[cx-9,121,cx+9,121,cx+9-sg*30,PY0+3,cx-9-sg*30,PY0+4.5]);c.fill();   /* тень статуи ложится от звезды */
   c.strokeStyle="rgba(196,188,172,.75)";c.lineWidth=.22;c.beginPath();   /* перила по переднему краю */
   const rl=hotelArc(PX0,PY0,PRX-.6,PRY-.4,.05,Math.PI-.05,36);c.moveTo(rl[0],rl[1]-1.2);for(let i=2;i<rl.length;i+=2)c.lineTo(rl[i],rl[i+1]-1.2);
   for(let i=0;i<rl.length;i+=4){c.moveTo(rl[i],rl[i+1]);c.lineTo(rl[i],rl[i+1]-1.2);}c.stroke();
   for(const x of [96,108,156,168]){const y=PY0-3.6;   /* деревья в кадках: олива, не зелень */
     c.fillStyle="#5a4a3a";c.fillRect(x-1,y+.6,2,1.4);c.fillStyle="#3b3226";c.fillRect(x-.2,y-2,.4,2.6);
     c.fillStyle=C([100,104,70],sF*.6);c.beginPath();c.arc(x,y-3.6,2.3,0,TAU);c.fill();c.fillStyle=C([140,136,90],sF+.2);c.beginPath();c.arc(x+sg*.7,y-4.3,1.2,0,TAU);c.fill();}
   c.strokeStyle="#2e2a26";c.lineWidth=.3;c.beginPath();
   for(const a of [.3,.75,1.25,1.9,2.4,2.85]){const x=PX0+Math.cos(a)*(PRX-3),y=PY0+Math.sin(a)*(PRY-1);c.moveTo(x,y);c.lineTo(x,y-4.6);}c.stroke();
   for(const a of [.3,.75,1.25,1.9,2.4,2.85])hotelLamp(c,e,PX0+Math.cos(a)*(PRX-3),PY0+Math.sin(a)*(PRY-1)-4.9,.45,[255,210,150],.85);
   const PC=["#3a3f52","#5a3a34","#2e2f33","#6a5a44","#3c4a5a","#7a3e36"];
   for(let i=0;i<16;i++){const a=r()*TAU,d=.3+r()*.65,x=PX0+Math.cos(a)*(PRX-2)*d,y=PY0+Math.sin(a)*(PRY-1)*d;
     if(Math.abs(x-cx)<11&&y<123)continue;   /* не на постаменте */
     c.fillStyle=PC[i%PC.length];c.fillRect(x-.45,y-2.4,.9,2.4);c.fillStyle="#d8b89a";c.beginPath();c.arc(x,y-2.85,.42,0,TAU);c.fill();}
   /* постамент: широкая ступень и узкая колонна тёмного гранита, грань к звезде светлая; лента надписи */
   c.fillStyle=C([70,66,72],sU*.5+.2);hotelPoly(c,ped);c.fill();c.fillStyle=C([150,140,128],sU);c.fillRect(cx-8,113,16,.7);
   c.fillStyle=C([64,60,66],sF*.8);hotelPoly(c,pcol);c.fill();
   c.fillStyle=C([64,60,66],(sg>0?sR:sL)*1.2+.2);hotelPoly(c,sg>0?[cx+2.5,101,cx+5,101,cx+5.5,113,cx+2.8,113]:[cx-5,101,cx-2.5,101,cx-2.8,113,cx-5.5,113]);c.fill();
   c.fillStyle=C([190,178,160],sU);c.fillRect(cx-5,101,10,.6);
   c.fillStyle="rgba(232,200,120,.55)";c.fillRect(cx-3.6,105.2,7.2,1.2);
   /* космонавт: плечи шире постамента, ноги врозь, левая рука вдоль тела с просветом, правая
      вверх с факелом, плащ-знамя за спиной в тень. Камень в три тона: тень, фронт, грань к звезде;
      фонари площадки чуть греют низ. Поза одна на все системы — от звезды зависит лишь свет */
   const hx=cx+8,figure=[
     [cx-6.2,99,cx-1,99,cx-.8,101.5,cx-6.4,101.5],[cx+1,99,cx+6.2,99,cx+6.4,101.5,cx+.8,101.5],   /* сапоги */
     [cx-5.4,88,cx-1,88,cx-1.1,99.2,cx-5.8,99.2],[cx+1,88,cx+5.4,88,cx+5.8,99.2,cx+1.1,99.2],     /* ноги врозь */
     [cx-6.6,75,cx+6.6,75,cx+5.6,88.4,cx-5.6,88.4],                                            /* торс: плечи шире пояса */
     [cx-6.8,75.6,cx-9.4,77.2,cx-9.6,90,cx-7.2,90.4],                                          /* левая рука — просвет к торсу */
     [cx+3.6,77.6,cx+6.6,75,hx+1.4,66.2,hx-1.2,65.8],                                          /* правая — вверх, к факелу */
     [cx-2.8,72.6,cx+2.8,72.6,cx+3.2,75.2,cx-3.2,75.2]];                                       /* ворот */
   const cape=[cx-6,75.5,cx+1.5,75.5,cx+.6,101.4,cx-14.5,101.4,cx-12.6,88];
   c.fillStyle=C([120,110,98],sF*.35);hotelPoly(c,cape);c.fill();
   c.strokeStyle="rgba(10,8,8,.45)";c.lineWidth=.3;c.beginPath();for(const t of [.3,.62]){c.moveTo(cx-(6+t*7.5),75.5+t*4);c.lineTo(cx-(2+t*10),101.4);}c.stroke();
   c.beginPath();for(const p of figure){c.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)c.lineTo(p[i],p[i+1]);c.closePath();}
   c.moveTo(cx+4.1,69.4);c.arc(cx,69.4,4.1,0,TAU);
   c.save();c.clip();
   {const bg=c.createLinearGradient(sg>0?cx-9:cx+9,0,sg>0?cx+9:cx-9,0);bg.addColorStop(0,C(HK_BRONZE,.06));bg.addColorStop(.5,C(HK_BRONZE,sF*.75));bg.addColorStop(1,C(HK_BRONZE,sF*1.1+.3));
    c.fillStyle=bg;c.fillRect(cx-30,50,60,52);
    const wg=c.createLinearGradient(0,101.5,0,86);wg.addColorStop(0,"rgba(255,150,70,.22)");wg.addColorStop(1,"rgba(255,150,70,0)");c.fillStyle=wg;c.fillRect(cx-30,50,60,52);
    c.fillStyle=sh(.22);c.fillRect(cx-2.4,78,4.8,5.2);c.fillRect(cx-6.6,74.8,13.2,.6);   /* нагрудная панель, шов ворота */
    c.fillStyle="#141418";c.beginPath();c.arc(cx+.3,69.8,2.5,0,TAU);c.fill();   /* забрало */
    c.fillStyle=rgba(hotelLit(Lt,[255,240,220],1.2),.6);c.beginPath();c.arc(cx+.3+sg*.9,69,1.1,0,TAU);c.fill();
    c.strokeStyle=C([255,236,210],(sg>0?sR:sL)*.9+.1);c.lineWidth=.6;c.beginPath();c.moveTo(cx+sg*6.9,75.6);c.lineTo(cx+sg*5.9,88.2);c.moveTo(cx+sg*5.5,88.6);c.lineTo(cx+sg*6,99);c.stroke();   /* кромка к звезде */
   }
   c.restore();
   c.fillStyle=C([90,74,58],sF);c.fillRect(hx-.4,62,.8,4.2);   /* рукоять факела */
   const tx=hx,ty=60.4;hotelStar(c,tx,ty,2.2,"#fff4cc");
   const sgl=e.createRadialGradient(tx,ty,0,tx,ty,5.5);sgl.addColorStop(0,"rgba(255,244,200,1)");sgl.addColorStop(.35,"rgba(255,214,130,.5)");sgl.addColorStop(1,"rgba(255,190,100,0)");
   e.fillStyle=sgl;e.fillRect(tx-5.5,ty-5.5,11,11);
   c.fillStyle="rgba(255,220,150,.16)";c.beginPath();c.arc(tx,ty,3.2,0,TAU);c.fill();}   /* факел — точка, самая яркая в доме: свечение делает ореол */
  yield;
  /* ── причальная труба от ступицы влево, челнок носом в неё ── */
  hotelDock(c,e,113,140,59,147,sd,Lt);
}
HOTEL_T.gt={W:250,H:170,PX:2,ax:138,ay:80,sign:[138,34,11],sheen:[138,34,30],halo:HK_HALO,wins:hkWins,paint:hkPaint};
