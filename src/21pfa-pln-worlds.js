/* ══════════════ планета: листы миров (M613) ══════════════
   Один набор красок на каждый тип мира. PLN_PAL (21pf) — рабочий лист: перед стройкой земли в
   него ложится лист типа (plnPalSet), и всё, что красит землю, камни и дальние полосы, читает
   его. Кроме красок земли лист несёт воду, отсвет земли, оттенок ближнего воздуха и небо мира;
   небо применяет час (21pz plnHour), остальное — кадр (plnSurface). Смешанный мир берёт до трети
   второго листа. Голые миры (rocky, metal) неба не красят: без воздуха оно чёрное и так.
   Ниже — дальний мир по типу: свои кулисы каждому миру (PLN_FAR, plnFarLane), их спрашивает
   plnLandFarH (21pf). */
/* PLN_PAL0 — землеподобный лист как он есть: по нему собран набор тел флоры (21pg), которые красит
   запись; сам лист красит по рабочему */
const PLN_PAL0=Object.assign({},PLN_PAL);
/* ── листы миров ──
   Те же восемнадцать красок на каждый тип; на голом мире «трава» — грунт, «вереск» и «клевер» —
   его пятна (ржавчина, сера, лёд), «снег» — то, чем накрыта макушка гор (снег, пыль, пепел),
   «мох» — тёмная сторона камня. Вода — линейная, две глубины; gnd — во сколько отсвет земли
   отличается от землеподобного по каналам; air — оттенок ближнего воздуха; murk — муть воды
   (0 ясная, 1 непрозрачная: кислота, ил, смола); sky — цвет, к которому
   час ведёт небо, воздух и тень неба, сила этого сдвига (0 — небо часа как есть) и густота воздуха
   против землеподобного. Краски записаны в sRGB */
const PLN_WORLDS={
  terran:{grassLit:"#93a94f",grassMid:"#5c8a47",grassCool:"#3b7560",dry:"#c4a659",heather:"#b56a8e",clover:"#7d70ad",soil:"#b08a5e",soilDark:"#7a5a40",mud:"#4a4f3c",
    rockWarm:"#b3aa98",rockCool:"#8a8d9a",crag:"#5d6378",cragWarm:"#8a7f78",snow:"#f2f4f8",forest:"#2f5f52",glade:"#6b9558",plain:"#8aa880",moss:"#5d7f35",
    water:[[.10,.30,.30],[.02,.10,.17]],gnd:[1,1,1],air:[.8,.98,.95],murk:0,sky:["#5a8cd0",0,1]},
  ocean:{grassLit:"#8fb36a",grassMid:"#4f8f5e",grassCool:"#2f6f6a",dry:"#d9c98a",heather:"#7f9fbf",clover:"#8a7fb5",soil:"#c8b58a",soilDark:"#8a7a5a",mud:"#4a5a4c",
    rockWarm:"#a8a49a",rockCool:"#7f8a96",crag:"#556274",cragWarm:"#7f7a72",snow:"#f0f4f8",forest:"#2c5a58",glade:"#5f9a6a",plain:"#5a95a8",moss:"#4f7f45",
    water:[[.08,.30,.36],[.02,.10,.20]],gnd:[.95,1.05,1.1],air:[.8,.96,.98],murk:0,sky:["#4a8ad8",.35,.9]},
  desert:{grassLit:"#d9b878",grassMid:"#c49a5c",grassCool:"#a07f5c",dry:"#ead7a8",heather:"#b56a4a",clover:"#c48a5a",soil:"#c9a56a",soilDark:"#8f6a42",mud:"#6a4f3a",
    rockWarm:"#b59a78",rockCool:"#8f8478",crag:"#7a5a48",cragWarm:"#a87a58",snow:"#e8d8b8",forest:"#8a6a4a",glade:"#c9a878",plain:"#b89a70",moss:"#9a7a55",
    water:[[.14,.26,.26],[.04,.10,.13]],gnd:[1.6,1.25,.75],air:[1,.9,.75],murk:.3,sky:["#c0a888",.4,1.15]},
  rocky:{grassLit:"#8e8a82",grassMid:"#6c6860",grassCool:"#565654",dry:"#a49e94",heather:"#746258",clover:"#5c6066",soil:"#7c766c",soilDark:"#504c46",mud:"#3a3834",
    rockWarm:"#9c968c",rockCool:"#7a7c82",crag:"#4a4c52",cragWarm:"#6c6256",snow:"#bcbcc0",forest:"#46464a",glade:"#6e6c66",plain:"#7e7c76",moss:"#56524c",
    water:[[.10,.14,.18],[.03,.05,.08]],gnd:[1,.9,1.7],air:[.9,.95,1],murk:.15,sky:["#808080",0,1]},
  ice:{grassLit:"#dfe9f2",grassMid:"#b8cfe0",grassCool:"#8fb0cc",dry:"#f2f6fa",heather:"#a8bcd8",clover:"#c8d8ec",soil:"#c0ccd8",soilDark:"#7f94aa",mud:"#5a7088",
    rockWarm:"#9aa0aa",rockCool:"#6f7f96",crag:"#4e6078",cragWarm:"#7a8494",snow:"#f8fbff",forest:"#6f8fa8",glade:"#c8d8e6",plain:"#b0c4d8",moss:"#7f9ab0",
    water:[[.10,.24,.34],[.03,.09,.18]],gnd:[1.6,1.9,3.2],air:[.85,.95,1],murk:0,sky:["#a8c4dc",.45,.8]},
  volcanic:{grassLit:"#6a5248",grassMid:"#4a3a34",grassCool:"#3a3236",dry:"#8a6a50",heather:"#c8502a",clover:"#d89a3a",soil:"#5a4a42",soilDark:"#2e2624",mud:"#1e1a1a",
    rockWarm:"#6e5a50",rockCool:"#4a4448",crag:"#302a2c",cragWarm:"#5a3a30",snow:"#c8b090",forest:"#2a2224",glade:"#5a4a40",plain:"#4a3e3c",moss:"#6a4a3a",
    water:[[.12,.10,.08],[.03,.02,.02]],gnd:[.6,.45,.4],air:[.8,.7,.68],murk:.6,sky:["#a67a48",.55,1.3]},
  toxic:{grassLit:"#bcc060",grassMid:"#7f9a3a",grassCool:"#4f7a4a",dry:"#d8d080",heather:"#b56aa0",clover:"#7a70b0",soil:"#a89a5a",soilDark:"#6a6438",mud:"#3e4a2a",
    rockWarm:"#9a9a78",rockCool:"#6f7a6a",crag:"#4a5a50",cragWarm:"#7a7a5a",snow:"#e8ecc0",forest:"#2e4a30",glade:"#8aa050",plain:"#7a9a60",moss:"#8aa030",
    water:[[.50,.75,.04],[.14,.24,.01]],gnd:[1.2,1.15,.55],air:[.85,.95,.7],murk:.85,sky:["#a4ac60",.5,1.2]},
  crystal:{grassLit:"#9c96aa",grassMid:"#746e88",grassCool:"#5e5a72",dry:"#c0bacc",heather:"#c8b0f0",clover:"#8478bc",soil:"#868096",soilDark:"#524c64",mud:"#38344a",
    rockWarm:"#928ca2",rockCool:"#706a88",crag:"#443c62",cragWarm:"#645878",snow:"#eeeaf6",forest:"#3e3a54",glade:"#7c7694",plain:"#706c86",moss:"#5a5672",
    water:[[.14,.12,.30],[.04,.03,.12]],gnd:[1,1,1.12],air:[.92,.9,1],murk:0,sky:["#9a94c4",.35,.7]},
  jungle:{grassLit:"#7fb050",grassMid:"#3f7f3a",grassCool:"#245a4a",dry:"#a8b860",heather:"#d06a8a",clover:"#8a5aa0",soil:"#6a5a3a",soilDark:"#3e3424",mud:"#2a3020",
    rockWarm:"#8a8a70",rockCool:"#5f6a60",crag:"#3a4a44",cragWarm:"#6a6a58",snow:"#d8e0c8",forest:"#1a3a2a",glade:"#4a8a48",plain:"#3f7a58",moss:"#4f8a30",
    water:[[.10,.28,.22],[.02,.09,.10]],gnd:[.7,.9,.7],air:[.78,.96,.9],murk:.3,sky:["#78a89c",.35,1.2]},
  metal:{grassLit:"#96a0b0",grassMid:"#76808e",grassCool:"#5a6474",dry:"#b0b8c4",heather:"#a86038",clover:"#6e6058",soil:"#86888c",soilDark:"#56585e",mud:"#363840",
    rockWarm:"#9a9ca0",rockCool:"#7a8494",crag:"#48505c",cragWarm:"#66605c",snow:"#c4c8d0",forest:"#464c56",glade:"#7a848e",plain:"#8a9098",moss:"#6c5c50",
    water:[[.12,.14,.18],[.04,.05,.08]],gnd:[1.1,1,1.4],air:[.9,.94,1],murk:.2,sky:["#808080",0,1]},
  ruin:{grassLit:"#c4b48a",grassMid:"#a0906a",grassCool:"#7a7a6a",dry:"#d8ccaa",heather:"#8a7a70",clover:"#a08a70",soil:"#b8a880",soilDark:"#7a6a50",mud:"#4e4a40",
    rockWarm:"#a89a88",rockCool:"#8a8a86",crag:"#5e5a58",cragWarm:"#8a7a68",snow:"#e0d8c0",forest:"#5a5448",glade:"#9a8e70",plain:"#8e8a74",moss:"#7a7a50",
    water:[[.18,.22,.20],[.06,.08,.08]],gnd:[1.4,1.25,1],air:[.95,.92,.82],murk:.4,sky:["#b8a890",.45,1.3]}};
/* лист мира ложится в PLN_PAL: тип и, если мир смешан, доля второго типа (p.mw ≤ .48 — в лист
   идёт до трети). Отдаёт воду, отсвет земли, воздух и небо этого мира (небо — линейный цвет,
   сила, густота) */
function plnPalSet(p){
  const W=PLN_WORLDS,A=W[p&&p.type]||W.terran,B=p&&p.mix&&W[p.mix]||null,w=B?clamp((p.mw||0)*.7,0,.34):0;
  const mix=(a,b)=>w?plnMix3(a,b,w):a,sky=X=>{const c=plnHex(X.sky[0]);return [c[0],c[1],c[2],X.sky[1],X.sky[2]];};
  for(const k in PLN_PAL0)PLN_PAL[k]=mix(plnHex(A[k]),B?plnHex(B[k]):null);
  const sa=sky(A),sb=B?sky(B):null;
  return {water:[mix(A.water[0],B&&B.water[0]),mix(A.water[1],B&&B.water[1])],gnd:mix(A.gnd,B&&B.gnd),air:mix(A.air,B&&B.air),
    murk:B?lerp(A.murk,B.murk,w):A.murk,sky:sb?sa.map((v,i)=>lerp(v,sb[i],w)):sa,acid:!!(p&&(p.type==="toxic"||p.mix==="toxic"&&w>.2)),
    far:PLN_FAR[p&&p.type]||PLN_FAR.terran};
}

/* ── дальний мир по типу ──
   Кулисы дальнего мира — шатры по z (plnRidge, 21pf) с высотой, идущей по x; землеподобный мир —
   пики с рёбрами, как построен в 21pf. Остальные типы получают свои силуэты: shape — форма,
   h — множитель высоты землеподобных кулис там, где форма их не подменяет, snow — с какой высоты
   снег (0 — везде, 1e9 — нигде), tree — до какой высоты лес по склону (−1 — нигде), crater —
   кратеры на равнине */
const PLN_FAR={
  terran:{shape:"peaks",h:1,snow:235,tree:150},
  ocean:{shape:"isles",h:1,snow:1e9,tree:150},
  desert:{shape:"mesa",h:.8,snow:1e9,tree:-1},
  rocky:{shape:"peaks",h:1.25,snow:1e9,tree:-1,crater:1},
  ice:{shape:"shelf",h:.9,snow:0,tree:-1},
  volcanic:{shape:"cones",h:1.1,snow:1e9,tree:60},
  toxic:{shape:"domes",h:.75,snow:1e9,tree:200},
  crystal:{shape:"spires",h:1,snow:120,tree:-1},
  jungle:{shape:"karst",h:1,snow:1e9,tree:600},
  metal:{shape:"slabs",h:1.1,snow:1e9,tree:-1,crater:1},
  ruin:{shape:"blocks",h:.75,snow:300,tree:120}};
/* столовая гора: шатёр с плоской макушкой; W — полуширина макушки по z, sf — крутизна боков */
function plnFarMesa(z,zc,y,W,sf){return -plnSmax(-plnRidge(z,zc,y+W*sf,sf,sf,6),-y,4);}
/* кратеры на равнине: чаши с валом, положены семенем в ±1300 м по x и 250…1550 м в глубину */
function plnFarCrater(L,x,z){
  let v=0;
  for(let j=0;j<7;j++){
    const s=L.sd+91,cx=(plnHash(j,1,s)-.5)*2600,cz=250+plnHash(j,2,s)*1300,R=40+plnHash(j,3,s)*140;
    const d=Math.hypot(x-cx,(z-cz)*.9);
    if(d>R*1.6)continue;
    /* узкий вал с губой, за ним пологий шлейф выброса, внутри чаша */
    v+=.14*R*Math.exp(-Math.pow((d-R)/(R*.09),2))+.05*R*Math.exp(-Math.pow((d-R*1.2)/(R*.35),2))-.10*R*(1-plnSmooth(R*.5,R*.95,d));
  }
  return v;
}
/* кулиса дальнего мира по форме: lane 3 холмы, 4 хребет, 5 горы, 7 дальние гряды (sub 0 ближняя,
   1 дальняя). null — кулиса землеподобная (21pf). Высоты в метрах, как там; pass — окно к горизонту */
function plnFarLane(Fw,lane,sub,L,x,z,az,pass){
  const S=Fw.shape;
  if(S==="peaks")return null;
  const sd=L.sd,H=Fw.h||1,g=(a,w)=>Math.exp(-Math.pow((az-a)/w,2)),pk=1-(lane===3?.7:lane===4?.8:lane===5?.8:(sub?.35:.45))*pass;
  const R=(zc,y,sf,sb,k)=>plnRidge(z,zc,y,sf,sb,k);
  const fb=(f,o,s,oct)=>plnFbm(x*f+o,s*.5,oct||2,sd+s),rid=(f,o,s,oct)=>plnRidged(x*f+o,s*.5,oct||4,sd+s);
  const n5=fb(.0002,3,35),zc=lane===3?340+70*fb(.004,2,23):lane===4?1050+180*fb(.0012,4,25):lane===5?3700+600*fb(.0004,6,27):(sub?11000+1000*n5:7000+800*n5);
  const env=.55+.65*g(PLN_AZ_PEAK,.2),det=fb(.03,1,60+lane,3)*(lane===3?1.6:lane===4?4:8);
  let y;
  switch(S){
  case "domes":{ /* острова и болотные гряды: округлые, без гребней */
    const n=fb(lane===3?.006:lane===4?.0025:lane===5?.0008:.0004,1,50+lane,3)*.5+.5;
    y=(lane===3?12+20*n:lane===4?20+60*n*n:lane===5?(80+250*n*n)*env:(sub?200+400*n*n:150+350*n*n))*H*pk;
    return R(zc,y,lane===3?.10:.2,lane===3?.06:.1,lane===3?14:lane===4?20:50)+det;}
  case "isles":{ /* океан: острова на морской равнине — редкие, крутые, между ними пусто; у ориентира одинокий вулканический остров */
    const nn=fb(lane===3?.006:lane===4?.0025:lane===5?.0009:.0004,1,50+lane,3)*.5+.5;
    if(lane===3)return R(zc,(8+14*nn)*pk*H,.10,.06,14)+det;
    const m=plnSmooth(.50,.60,fb(lane===4?.003:lane===5?.0011:.0005,4,52+lane,2)*.5+.5),r=rid(lane===5?.003:.0012,5,57+lane+sub,3);
    if(lane===4){y=(16+50*nn*nn)*m*pk*H;return R(zc,y,.3,.2,20)+det*.5;}
    if(lane===5){y=((90+260*r)*m*env+170*g(PLN_AZ_PEAK,.05))*pk*H;return R(zc,y,.9,.7,40)+det*.5;}
    y=(sub?260+420*r:200+360*r)*m*pk*H;return R(zc,y,.6,.5,70)+det*.5;}
  case "mesa":{ /* дюны, столовые горы, уступы */
    if(lane===3){const s=Math.pow(.5+.5*Math.sin(x*.02+3*fb(.003,1,51)),1.6);return R(zc,(5+9*s)*pk*H,.06,.12,10)+det*.3;}
    const m=plnSmooth(.5,.6,fb(lane===4?.0035:lane===5?.0012:.0005,2,52+lane)*.5+.5),hh=fb(.001,5,53+lane)*.5+.5;
    if(lane===4){y=(30+30*hh)*m*pk*H;return plnFarMesa(z,zc,y,40,.9)+det*.3;}
    if(lane===5){y=((90+70*hh)*m*env+140*plnSmooth(.2,.8,g(PLN_AZ_PEAK,.08)))*pk*H;return plnFarMesa(z,zc,y,120,.9)+det*.4;}
    y=(60+80*rid(.0004,1,58+sub))*pk*H;return plnFarMesa(z,zc,y,300,.7)+det*.5;}
  case "cones":{ /* лавовые поля, конусы вулканов с кратером */
    if(lane===3)return R(zc,(6+10*rid(.02,1,54))*pk*H,.1,.06,10)+det*.5;
    if(lane===4)return R(zc,(12+20*rid(.0016,11,26))*pk*H,.22,.14,30)+det*.5;
    /* конус с вогнутыми боками (колокол острее гауссова) и кратером в макушке */
    const cone=(a,w,h)=>h*(Math.exp(-Math.pow(Math.abs(az-a)/w,1.35))-.25*g(a,w*.3));
    if(lane===5){
      y=(40+60*rid(.0006,2.3,28,5))*env+cone(PLN_AZ_PEAK,.05,300);
      for(let j=1;j<3;j++){const s=sd+95+j;y+=cone(PLN_AZ_PEAK+(plnHash(j,1,s)-.5)*.6,.04+.03*plnHash(j,2,s),110+90*plnHash(j,3,s));}
      return R(zc,y*pk*H,.5,.35,50)+det*.3;}
    y=(60+150*rid(.00035,5.1,36,5))*.6+cone((plnHash(sub,4,sd+97)-.5)*.5,.06,260*(sub?1:.6));
    return R(zc,y*pk*H,.4,.3,60)+det*.4;}
  case "spires":{ /* шпили: узкие и отвесные */
    if(lane===3)return R(zc,(4+14*Math.pow(rid(.05,1,55),3))*pk*H,.4,.4,4)+det*.2;
    if(lane===4)return R(zc,(8+70*Math.pow(rid(.012,3,56),6))*pk*H,.8,.8,6)+det*.2;
    if(lane===5){y=(30+300*Math.pow(rid(.004,5,57,5),5)*(.4+.6*g(PLN_AZ_PEAK,.25))+180*g(PLN_AZ_PEAK,.018))*pk*H;return R(zc,y,1,1,20)+det*.2;}
    y=(60+300*Math.pow(rid(.0012,2,58+sub,5),4))*pk*H;return R(zc,y,.8,.8,40)+det*.3;}
  case "blocks":{ /* башни руин на хребте; горы и гряды — землеподобные, ниже */
    if(lane!==4)return null;
    const m=plnSmooth(.55,.62,fb(.0015,1,59)*.5+.5),cw=28,ci=Math.floor(x/cw),fx=x-ci*cw,hc=plnHash(ci,1,sd+93);
    y=hc<.35?0:(30+90*hc)*m*plnSmooth(0,3,Math.min(fx,cw-fx))*pk*H;
    return Math.max(plnFarMesa(z,zc,y,10,2),R(zc,(15+20*rid(.0016,11,26))*pk*H,.22,.14,30)+det*.5);}
  case "shelf":{ /* ледяной шельф с обрывом, торосы, нунатаки; гряды — землеподобные под снегом */
    if(lane===3)return plnFarMesa(z,zc+150,(12+4*fb(.01,1,61))*pk*H,150,.9)+det*.15;
    if(lane===4)return R(zc,(8+18*rid(.01,4,62))*pk*H,.3,.3,10)+det*.3;
    if(lane===5){y=((80+130*Math.pow(rid(.0006,2.3,28,5),1.5))*env+160*g(PLN_AZ_PEAK,.05))*pk*H;return R(zc,y,.6,.4,50)+det*.4;}
    return null;}
  case "karst":{ /* карстовые башни: круглые, отвесные, в лесу до макушки */
    if(lane===3)return R(zc,(18+22*(fb(.005,1,63,3)*.5+.5))*pk*H,.14,.08,16)+det;
    if(lane===4)return R(zc,(30+50*Math.pow(fb(.0025,2,64,3)*.5+.5,2))*pk*H,.3,.2,25)+det;
    if(lane===5){const tw=plnSmooth(.4,.7,fb(.006,3,65,3)*.5+.5);y=((50+300*tw)*(.6+.4*g(PLN_AZ_PEAK,.3))+160*g(PLN_AZ_PEAK,.03))*pk*H;return R(zc,y,1.2,.8,40)+det*.5;}
    y=(90+240*Math.pow(fb(.0005,4,66+sub,3)*.5+.5,2))*pk*H;return R(zc,y,.5,.4,80)+det*.5;}
  case "slabs":{ /* косые плиты: пила по x, крутой лоб, пологая спина; гряды — землеподобные */
    const tri=f=>{const u=x*f+fb(.002,1,67);return 1-Math.abs(2*(u-Math.floor(u))-1);};
    if(lane===3)return R(zc,(8+16*Math.pow(tri(.008),.7))*pk*H,.5,.15,6)+det*.3;
    if(lane===4)return R(zc,(15+45*(.6*Math.pow(tri(.0025),.6)+.4*rid(.0016,11,26)))*pk*H,.35,.12,20)+det*.4;
    if(lane===5){y=((60+220*(.55*Math.pow(tri(.0008),.5)+.45*rid(.0006,2.3,28,5)))*env+180*g(PLN_AZ_PEAK,.05))*pk*H;return R(zc,y,.7,.3,40)+det*.5;}
    return null;}
  }
  return null;
}
