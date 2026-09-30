/* ══════════════ планета: листы миров (M613) ══════════════
   Один набор красок на каждый тип мира. PLN_PAL (21pf) — рабочий лист: перед стройкой земли в
   него ложится лист типа (plnPalSet), и всё, что красит землю, камни и дальние полосы, читает
   его. Кроме красок земли лист несёт воду, отсвет земли, оттенок ближнего воздуха и небо мира;
   небо применяет час (21pz plnHour), остальное — кадр (plnSurface). Смешанный мир берёт до трети
   второго листа. Голые миры (rocky, metal) неба не красят: без воздуха оно чёрное и так. */
/* PLN_PAL0 — землеподобный лист как он есть: по нему собран набор тел флоры (21pg), которые красит
   запись; сам лист красит по рабочему */
const PLN_PAL0=Object.assign({},PLN_PAL);
/* ── листы миров ──
   Те же восемнадцать красок на каждый тип; на голом мире «трава» — грунт, «вереск» и «клевер» —
   его пятна (ржавчина, сера, лёд), «снег» — то, чем накрыта макушка гор (снег, пыль, пепел),
   «мох» — тёмная сторона камня. Вода — линейная, две глубины; gnd — во сколько отсвет земли
   отличается от землеподобного по каналам; air — оттенок ближнего воздуха; sky — цвет, к которому
   час ведёт небо, воздух и тень неба, сила этого сдвига (0 — небо часа как есть) и густота воздуха
   против землеподобного. Краски записаны в sRGB */
const PLN_WORLDS={
  terran:{grassLit:"#93a94f",grassMid:"#5c8a47",grassCool:"#3b7560",dry:"#c4a659",heather:"#b56a8e",clover:"#7d70ad",soil:"#b08a5e",soilDark:"#7a5a40",mud:"#4a4f3c",
    rockWarm:"#b3aa98",rockCool:"#8a8d9a",crag:"#5d6378",cragWarm:"#8a7f78",snow:"#f2f4f8",forest:"#2f5f52",glade:"#6b9558",plain:"#8aa880",moss:"#5d7f35",
    water:[[.10,.30,.30],[.02,.10,.17]],gnd:[1,1,1],air:[.8,.98,.95],sky:["#5a8cd0",0,1]},
  ocean:{grassLit:"#8fb36a",grassMid:"#4f8f5e",grassCool:"#2f6f6a",dry:"#d9c98a",heather:"#7f9fbf",clover:"#8a7fb5",soil:"#c8b58a",soilDark:"#8a7a5a",mud:"#4a5a4c",
    rockWarm:"#a8a49a",rockCool:"#7f8a96",crag:"#556274",cragWarm:"#7f7a72",snow:"#f0f4f8",forest:"#2c5a58",glade:"#5f9a6a",plain:"#7fa89a",moss:"#4f7f45",
    water:[[.08,.30,.36],[.02,.10,.20]],gnd:[.95,1.05,1.1],air:[.8,.96,.98],sky:["#4a8ad8",.35,.9]},
  desert:{grassLit:"#d9b878",grassMid:"#c49a5c",grassCool:"#a07f5c",dry:"#ead7a8",heather:"#b56a4a",clover:"#c48a5a",soil:"#c9a56a",soilDark:"#8f6a42",mud:"#6a4f3a",
    rockWarm:"#b59a78",rockCool:"#8f8478",crag:"#7a5a48",cragWarm:"#a87a58",snow:"#e8d8b8",forest:"#8a6a4a",glade:"#c9a878",plain:"#b89a70",moss:"#9a7a55",
    water:[[.14,.26,.26],[.04,.10,.13]],gnd:[1.6,1.25,.75],air:[1,.9,.75],sky:["#c0a888",.4,1.15]},
  rocky:{grassLit:"#8e8a82",grassMid:"#6c6860",grassCool:"#565654",dry:"#a49e94",heather:"#746258",clover:"#5c6066",soil:"#7c766c",soilDark:"#504c46",mud:"#3a3834",
    rockWarm:"#9c968c",rockCool:"#7a7c82",crag:"#4a4c52",cragWarm:"#6c6256",snow:"#bcbcc0",forest:"#46464a",glade:"#6e6c66",plain:"#7e7c76",moss:"#56524c",
    water:[[.10,.14,.18],[.03,.05,.08]],gnd:[1,.9,1.7],air:[.9,.95,1],sky:["#808080",0,1]},
  ice:{grassLit:"#dfe9f2",grassMid:"#b8cfe0",grassCool:"#8fb0cc",dry:"#f2f6fa",heather:"#a8bcd8",clover:"#c8d8ec",soil:"#c0ccd8",soilDark:"#7f94aa",mud:"#5a7088",
    rockWarm:"#9aa0aa",rockCool:"#6f7f96",crag:"#4e6078",cragWarm:"#7a8494",snow:"#f8fbff",forest:"#6f8fa8",glade:"#c8d8e6",plain:"#b0c4d8",moss:"#7f9ab0",
    water:[[.10,.24,.34],[.03,.09,.18]],gnd:[1.6,1.9,3.2],air:[.85,.95,1],sky:["#a8c4dc",.45,.8]},
  volcanic:{grassLit:"#6a5248",grassMid:"#4a3a34",grassCool:"#3a3236",dry:"#8a6a50",heather:"#c8502a",clover:"#d89a3a",soil:"#5a4a42",soilDark:"#2e2624",mud:"#1e1a1a",
    rockWarm:"#6e5a50",rockCool:"#4a4448",crag:"#302a2c",cragWarm:"#5a3a30",snow:"#c8b090",forest:"#2a2224",glade:"#5a4a40",plain:"#4a3e3c",moss:"#6a4a3a",
    water:[[.12,.10,.08],[.03,.02,.02]],gnd:[.6,.45,.4],air:[.8,.7,.68],sky:["#a67a48",.55,1.3]},
  toxic:{grassLit:"#bcc060",grassMid:"#7f9a3a",grassCool:"#4f7a4a",dry:"#d8d080",heather:"#b56aa0",clover:"#7a70b0",soil:"#a89a5a",soilDark:"#6a6438",mud:"#3e4a2a",
    rockWarm:"#9a9a78",rockCool:"#6f7a6a",crag:"#4a5a50",cragWarm:"#7a7a5a",snow:"#e8ecc0",forest:"#2e4a30",glade:"#8aa050",plain:"#7a9a60",moss:"#8aa030",
    water:[[.40,.55,.08],[.14,.22,.03]],gnd:[1.2,1.15,.55],air:[.85,.95,.7],sky:["#a4ac60",.5,1.2]},
  crystal:{grassLit:"#9c96aa",grassMid:"#746e88",grassCool:"#5e5a72",dry:"#c0bacc",heather:"#c8b0f0",clover:"#8478bc",soil:"#868096",soilDark:"#524c64",mud:"#38344a",
    rockWarm:"#928ca2",rockCool:"#706a88",crag:"#443c62",cragWarm:"#645878",snow:"#eeeaf6",forest:"#3e3a54",glade:"#7c7694",plain:"#706c86",moss:"#5a5672",
    water:[[.14,.12,.30],[.04,.03,.12]],gnd:[1,1,1.12],air:[.92,.9,1],sky:["#9a94c4",.35,.7]},
  jungle:{grassLit:"#7fb050",grassMid:"#3f7f3a",grassCool:"#245a4a",dry:"#a8b860",heather:"#d06a8a",clover:"#8a5aa0",soil:"#6a5a3a",soilDark:"#3e3424",mud:"#2a3020",
    rockWarm:"#8a8a70",rockCool:"#5f6a60",crag:"#3a4a44",cragWarm:"#6a6a58",snow:"#d8e0c8",forest:"#1a3a2a",glade:"#4a8a48",plain:"#3f7a58",moss:"#4f8a30",
    water:[[.10,.28,.22],[.02,.09,.10]],gnd:[.7,.9,.7],air:[.78,.96,.9],sky:["#78a89c",.35,1.2]},
  metal:{grassLit:"#96a0b0",grassMid:"#76808e",grassCool:"#5a6474",dry:"#b0b8c4",heather:"#a86038",clover:"#6e6058",soil:"#86888c",soilDark:"#56585e",mud:"#363840",
    rockWarm:"#9a9ca0",rockCool:"#7a8494",crag:"#48505c",cragWarm:"#66605c",snow:"#c4c8d0",forest:"#464c56",glade:"#7a848e",plain:"#8a9098",moss:"#6c5c50",
    water:[[.12,.14,.18],[.04,.05,.08]],gnd:[1.1,1,1.4],air:[.9,.94,1],sky:["#808080",0,1]},
  ruin:{grassLit:"#c4b48a",grassMid:"#a0906a",grassCool:"#7a7a6a",dry:"#d8ccaa",heather:"#8a7a70",clover:"#a08a70",soil:"#b8a880",soilDark:"#7a6a50",mud:"#4e4a40",
    rockWarm:"#a89a88",rockCool:"#8a8a86",crag:"#5e5a58",cragWarm:"#8a7a68",snow:"#e0d8c0",forest:"#5a5448",glade:"#9a8e70",plain:"#8e8a74",moss:"#7a7a50",
    water:[[.18,.22,.20],[.06,.08,.08]],gnd:[1.4,1.25,1],air:[.95,.92,.82],sky:["#b8a890",.45,1.3]}};
/* лист мира ложится в PLN_PAL: тип и, если мир смешан, доля второго типа (p.mw ≤ .48 — в лист
   идёт до трети). Отдаёт воду, отсвет земли, воздух и небо этого мира (небо — линейный цвет,
   сила, густота) */
function plnPalSet(p){
  const W=PLN_WORLDS,A=W[p&&p.type]||W.terran,B=p&&p.mix&&W[p.mix]||null,w=B?clamp((p.mw||0)*.7,0,.34):0;
  const mix=(a,b)=>w?plnMix3(a,b,w):a,sky=X=>{const c=plnHex(X.sky[0]);return [c[0],c[1],c[2],X.sky[1],X.sky[2]];};
  for(const k in PLN_PAL0)PLN_PAL[k]=mix(plnHex(A[k]),B?plnHex(B[k]):null);
  const sa=sky(A),sb=B?sky(B):null;
  return {water:[mix(A.water[0],B&&B.water[0]),mix(A.water[1],B&&B.water[1])],gnd:mix(A.gnd,B&&B.gnd),air:mix(A.air,B&&B.air),
    sky:sb?sa.map((v,i)=>lerp(v,sb[i],w)):sa,acid:!!(p&&(p.type==="toxic"||p.mix==="toxic"&&w>.2))};
}
