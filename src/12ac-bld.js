/* ══════════════ холдинг · постройки (BLD) ══════════════
   M291, шаг 3 (DESIGN-holding §9–§10). Одна константа:
     BLD[id] = {id, fam, tier, ru, eats, makes, cost, at, note, fx, sh}
   Семьи A–D — те, что едят и делают ГРУЗ; все работают одним механизмом
   (бункер и пай, 12ad-site), поэтому 56 строк стоят столько же, сколько восемь.
   Семьи E–I (хозяйство, флот, люди, оборона, знание) придут по одной, каждая со
   своим крючком и тестом: строка без крючка не отгружается (§10).

   Числа — из §9/§10 замысла: eats/makes — норма в смену на ×1, ×2 вдвое, ×3 втрое;
   cost — цена ×1. Цена ×2 = ещё раз ×1 + Станочная линия; ×3 = дважды ×1 + две
   линии + Жилой блок (bldUpgradeCost).

   Ярус 1 ест только сырьё, ярус 2 — ярус 1 (и ниже второстепенно), ярус 3 —
   узлы. Правило §10.1 (в 12ad): постройка не ест то, что делает её же система, —
   иначе не нужен маршрут. */
const BLD_FAM={
  A:{ru:"Добыча",  sh:"tank",  note:"делает в смену и продаёт вам по 0.7 цены"},
  B:{ru:"Передел", sh:"drum",  note:"ест сырьё, платит паем"},
  C:{ru:"Узлы",    sh:"rack",  note:"ест передел, платит паем"},
  D:{ru:"Крупное", sh:"hangar",note:"ест узлы, делает то, что ест стройка"}
};
const BLD_SHIFTS={1:2,2:4,3:6};        /* монтаж по ярусу, в сменах */
const BLD_FAM_KEYS=["A","B","C","D"];
const BLD={};
function bldAdd(fam,id,ru,eats,makes,cost,at){
  const tier=fam==="C"?2:(fam==="D"?3:1);
  BLD[id]={id,fam,tier,ru,eats:eats||{},makes:makes||{},cost,at:at||"any",note:BLD_FAM[fam].note,fx:"share",sh:BLD_FAM[fam].sh};
}
/* A · добыча — делает M в смену в запас, продаёт по 0.7; ест ничего */
bldAdd("A","regolith",  "Реголитовая разработка",null,{iron:12,silicon:6},   {credits:1600,alloy:10,iron:24},    "solid:iron");
bldAdd("A","deepdrill", "Буровой комплекс",      null,{titan:4,iridium:1},   {credits:2400,alloy:14,iron:30},    "world:rocky,metal,volcanic,desert");
bldAdd("A","icefield",  "Ледовый промысел",      null,{ice:16},              {credits:1200,alloy:8,iron:20},     "world:ice,ocean,terran");
bldAdd("A","beltmine",  "Поясной промысел",      null,{crystal:2,isotopes:3},{credits:2800,alloy:16,titan:12},   "belt");
bldAdd("A","gasfield",  "Газовый промысел",      null,{volatiles:6},         {credits:2200,alloy:12,titan:8},    "gas");
bldAdd("A","greenhouse","Оранжерея",             null,{organics:10},         {credits:1400,alloy:8,silicon:20},  "world:terran,jungle,ocean");
bldAdd("A","biostation","Биостанция",            null,{carbon:4,xeno:1},     {credits:3000,alloy:16,organics:24},"fauna");
bldAdd("A","dumpworks", "Отвальный промысел",    null,{iron:6,silicon:4},    {credits:1000,alloy:6,iron:12},     "mine");
/* B · передел — ярус 1: цена 1 200 кр · сплавы 8 · 24 главного входа */
function bldB(id,ru,eats,makes){const main=Object.keys(eats)[0];const cost={credits:1200,alloy:8};cost[main]=24;bldAdd("B",id,ru,eats,makes,cost,"any");}
bldB("alloyshop",  "Плавильный цех",      {iron:8,silicon:4},           {alloy:2});
bldB("ferroshop",  "Ферросплавный цех",   {iron:6,titan:2},             {ferro:2});
bldB("rollshop",   "Прокатный цех",       {iron:8,silicon:2},           {roll:3});
bldB("plateshop",  "Обшивочный цех",      {titan:6,iron:2},             {plate:2});
bldB("rebarshop",  "Арматурный цех",      {iron:10},                    {rebar:3});
bldB("refrshop",   "Огнеупорный цех",     {silicon:6,titan:2},          {refr:2});
bldB("concshop",   "Бетонный цех",        {silicon:6,ice:4},            {concrete:4});
bldB("quartzshop", "Кварцевый цех",       {silicon:8},                  {quartz:2});
bldB("dielecshop", "Диэлектрический цех", {silicon:4,organics:4},       {dielec:2});
bldB("cableshop",  "Кабельный цех",       {iron:4,iridium:1,organics:2},{cable:2});
bldB("resinshop",  "Смоляной цех",        {organics:8},                 {resin:3});
bldB("insulshop",  "Изоляторный цех",     {silicon:4,organics:2},       {insul:2});
bldB("cfibershop", "Углеволоконный цех",  {carbon:3,organics:3},        {cfiber:2});
bldB("graphshop",  "Графитовый цех",      {carbon:4},                   {graphite:2});
bldB("carbideshop","Карбидный цех",       {carbon:2,silicon:4},         {carbide:2});
bldB("spiritshop", "Спиртовой цех",       {organics:6,ice:4},           {spirit:4});
bldB("proteinshop","Белковый цех",        {organics:8},                 {protein:3});
bldB("isoshop",    "Изотопный цех",       {ice:8,isotopes:1},           {heavyw:2});
bldB("oxyshop",    "Кислородный цех",     {ice:8},                      {oxygen:4});
bldB("hydrshop",   "Гидразиновый цех",    {ice:4,organics:4},           {hydrazine:2});
bldB("cryoshop",   "Криогенный цех",      {volatiles:4,ice:2},          {cryo:2});
bldB("thermoshop", "Теплозащитный цех",   {silicon:4,carbon:2},         {thermo:2});
/* C · узлы — ярус 2 (со ступени 20): 2 400 кр · сплавы 12 · прокат 6 · 12 главного входа */
function bldC(id,ru,eats,makes){const main=Object.keys(eats)[0];const cost={credits:2400,alloy:12,roll:6};cost[main]=(cost[main]|0)+12;bldAdd("C",id,ru,eats,makes,cost,"any");}
bldC("bearingshop", "Подшипниковый цех",      {roll:4,graphite:1},         {bearing:2});
bldC("pumpshop",    "Насосный цех",           {roll:3,alloy:2,insul:1},    {pump:2});
bldC("opticshop",   "Оптический цех",         {quartz:4,dielec:1},         {optics:2});
bldC("tubeshop",    "Ламповый цех",           {quartz:2,cable:1,alloy:1},  {tube:3});
bldC("relayshop",   "Релейный цех",           {cable:2,insul:2,alloy:1},   {relay:3});
bldC("selsynshop",  "Сельсинный цех",         {cable:3,roll:1,alloy:1},    {selsyn:2});
bldC("thermocshop", "Термопарный цех",        {ferro:2,insul:1},           {thermoc:3});
bldC("gyroshop",    "Гироскопный цех",        {roll:2,alloy:2,cable:1},    {gyro:1});
bldC("semishop",    "Полупроводниковый цех",  {quartz:3,dielec:2,graphite:1},{semi:2});
bldC("superconshop","Сверхпроводниковый цех", {cryo:2,cable:2,carbide:1},  {supercon:1});
bldC("instrshop",   "Приборный цех",          {alloy:2,cable:2,quartz:1},  {techcomp:2});
bldC("reactorshop", "Реакторный цех",         {heavyw:2,refr:2,ferro:2},   {reactorb:1});
bldC("accumshop",   "Аккумуляторный цех",     {dielec:2,cable:1,graphite:1},{accum:2});
bldC("regenshop",   "Регенераторный цех",     {oxygen:2,insul:1,alloy:1},  {regen:2});
bldC("cannedshop",  "Консервный цех",         {protein:4,spirit:1},        {canned:4});
bldC("fabricshop",  "Ткацкий цех",            {cfiber:2,resin:2},          {fabric:2});
bldC("filmshop",    "Плёночный цех",          {resin:3,dielec:1},          {film:3});
bldC("phosphorshop","Люминофорный цех",       {quartz:2,isotopes:1,dielec:1},{phosphor:2});
/* D · крупное — ярус 3 (со ступени 25, Стапель — с 22): 4 800 кр · прокат 12 · арматура 8 · подшипник 2 */
function bldD(id,ru,eats,makes){bldAdd("D",id,ru,eats,makes,{credits:4800,roll:12,rebar:8,bearing:2},"any");}
bldD("slipway",    "Стапель",            {plate:4,rebar:2,bearing:1},  {hullsec:1});
bldD("mlineyard",  "Станочный участок",  {bearing:2,relay:2,roll:2},   {mline:1});
bldD("blockyard",  "Блочный участок",    {concrete:4,film:2,regen:1},  {habblock:1});
bldD("domeyard",   "Купольный участок",  {fabric:3,rebar:2,optics:1},  {shell:1});
bldD("mastyard",   "Мачтовый участок",   {rebar:3,cable:2,cfiber:1},   {mast:1});
bldD("beamyard",   "Балочный участок",   {roll:4,ferro:2,bearing:1},   {beam:1});
bldD("launchyard", "Стартовый участок",  {refr:3,rebar:2,hydrazine:2}, {launchf:1});
bldD("panelyard",  "Панельный участок",  {semi:2,film:1,cable:1},      {panel:1});
const BLD_KEYS=Object.keys(BLD);
/* норма и выпуск по уровню */
function bldScale(o,lvl){const out={};for(const k in o)out[k]=o[k]*(lvl|0||1);return out;}
function bldQuota(def,lvl){return bldScale(def.eats,lvl);}
function bldOut(def,lvl){return bldScale(def.makes,lvl);}
/* цена перехода на уровень: ×2 = ещё ×1 + линия; ×3 = дважды ×1 + две линии + жилой блок */
function bldUpgradeCost(def,toLvl){
  const c={};
  const times=toLvl===3?2:1;
  for(const k in def.cost)c[k]=def.cost[k]*times;
  c.mline=(c.mline|0)+(toLvl===3?2:1);
  if(toLvl===3)c.habblock=(c.habblock|0)+1;
  return c;
}
/* теневая цена промышленного товара (§5): (Σ входов × 1.5 + плата) / выпуск —
   только для сводки, замера и сдачи в цех; рынок её не читает */
const IND_FEE={1:20,2:60,3:200};
const _indPrice={};
function indPrice(k){
  if(!RES[k])return 0;
  if(!RES[k].ind)return RES[k].price||(k==="volatiles"?30:(k==="icecrys"?40:0));
  if(_indPrice[k])return _indPrice[k];
  const def=BLD_KEYS.map(id=>BLD[id]).find(d=>d.makes[k]);
  if(!def)return 0;
  let s=0;for(const i in def.eats)s+=indPrice(i)*def.eats[i];
  const out=def.makes[k]||1;
  return _indPrice[k]=Math.round((s*1.5+IND_FEE[def.tier])/out);
}
function bldCostTxt(cost){
  const L=[];
  if(cost.credits)L.push(cost.credits.toLocaleString("ru")+" кр");
  for(const k in cost)if(k!=="credits"&&RES[k])L.push("<span style='color:"+RES[k].col+"'>"+RES[k].ru.toLowerCase()+" "+cost[k]+"</span>");
  return L.join(" · ");
}
function bldIoTxt(def){
  const e=Object.keys(def.eats).map(k=>RES[k].ru.toLowerCase()+" "+def.eats[k]).join(" + ");
  const m=Object.keys(def.makes).map(k=>RES[k].ru.toLowerCase()+" "+def.makes[k]).join(" + ");
  return (e?"ест "+e+" → ":"делает ")+m+" в смену";
}
