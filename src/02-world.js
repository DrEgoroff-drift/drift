/* ══════════════ ресурсы ══════════════ */
const RES={
  ice:      {ru:"Лёд",       col:"#a8d8ea",price:7},
  iron:     {ru:"Железо",    col:"#c08a6a",price:11},
  silicon:  {ru:"Кремний",   col:"#c9c9d4",price:17},
  organics: {ru:"Органика",  col:"#8fd08a",price:29},
  titan:    {ru:"Титан",     col:"#8fb0c4",price:38},
  isotopes: {ru:"Изотопы",   col:"#f2b25c",price:55},
  iridium:  {ru:"Иридий",    col:"#e0d28a",price:74},
  crystal:  {ru:"Кристаллы", col:"#c58ae0",price:105},
  /* только с фауны — в породе и в поясе не встречаются */
  carbon:   {ru:"Углерод",   col:"#8a97a0",price:46},
  xeno:     {ru:"Ксенобиом", col:"#ff7ac8",price:190}
};
const RES_KEYS=Object.keys(RES);
/* ресурсы, добавленные позже: у них отдельный поток случайных чисел,
   иначе сдвинулась бы генерация уже существующих станций */
const FAUNA_RES=["carbon","xeno"];
const ORE_KEYS=RES_KEYS.filter(k=>FAUNA_RES.indexOf(k)<0);
const PROFILE={
  terran:["iron","silicon","organics","ice"],
  ocean:["ice","organics","silicon"],
  desert:["silicon","iron","titan","iridium"],
  rocky:["iron","titan","silicon","iridium"],
  ice:["ice","isotopes","silicon"],
  volcanic:["iron","titan","iridium","crystal"],
  toxic:["organics","isotopes","crystal","silicon"],
  gas:[]
};
const BELT_RES=["iron","silicon","titan","iridium","isotopes","crystal","ice"];

/* ══════════════ миры ══════════════ */
const TYPES={
  terran:{ru:"землеподобная",pal:[[14,38,72],[22,64,104],[46,102,70],[104,138,72],[186,178,150],[236,240,244]],rough:.55,atm:"плотная, пригодна",sky:[[86,132,168],[26,44,74]],grav:1},
  ocean:{ru:"океаническая",pal:[[8,26,58],[14,52,96],[28,92,132],[52,132,150],[214,224,226]],rough:.25,atm:"влажная, пригодна",sky:[[92,150,180],[20,48,86]],grav:1.05},
  desert:{ru:"пустынная",pal:[[92,58,34],[144,96,52],[186,140,78],[214,176,116],[236,214,176]],rough:.7,atm:"разреженная, CO₂",sky:[[196,148,92],[92,54,34]],grav:.85},
  rocky:{ru:"каменистая",pal:[[26,26,30],[52,52,58],[86,84,88],[126,122,124],[168,164,164]],rough:1,atm:"отсутствует",sky:[[16,16,22],[4,4,8]],grav:.6},
  ice:{ru:"ледяная",pal:[[36,58,84],[74,106,140],[136,172,200],[196,220,236],[244,250,252]],rough:.5,atm:"азотная, разреженная",sky:[[132,168,198],[28,46,74]],grav:.7},
  volcanic:{ru:"вулканическая",pal:[[18,10,10],[54,20,14],[112,32,18],[198,74,22],[248,178,64]],rough:.95,atm:"сернистая, токсична",sky:[[104,34,26],[22,8,8]],grav:1.15},
  toxic:{ru:"токсичная",pal:[[26,34,14],[54,70,22],[96,116,36],[148,164,62],[204,214,120]],rough:.65,atm:"метановая, токсична",sky:[[132,146,64],[34,42,18]],grav:.95},
  gas:{ru:"газовый гигант",pal:[[52,38,72],[96,68,110],[152,116,138],[204,168,158],[238,216,198]],rough:0,atm:"нет поверхности",sky:[[0,0,0],[0,0,0]],grav:2.4}
};
const STAR_CLASS=[
  {ru:"красный карлик",col:"#ff7a52",t:.5},
  {ru:"оранжевая",col:"#ffab5e",t:.7},
  {ru:"жёлтая",col:"#ffe08a",t:1},
  {ru:"бело-голубая",col:"#bfe3ff",t:1.4},
  {ru:"голубой гигант",col:"#8fc4ff",t:1.9}
];
