/* ══════════════ план: комбинат, которому никто не отменил наряд ══════════════
   M146-plan. M118 построил одну машину на смене — Жестянку. Здесь строится
   промышленный уезд, которому она принадлежит (06c, `plan`, игла приёмника).
   На окраине — автоматический рудник, отгружающий руду в пустоту; сортировка,
   бракующая груз, который никто не примет; погрузчик, кружащий вокруг
   снесённого склада. Мародёры и дельцы живут со снятых сливок.

   ЯДРО — КОМБИНАТ, двести лет выпускающий изделие, и горизонт складов. Изделие
   бессмысленно вне контекста: одинаковые единицы чего-то неизвестного.
   НИ ЗЛОДЕЯ, НИ САТИРЫ. Наряд не отменили, потому что некому.
   Остановить нельзя. Можно ПОНЯТЬ, НА ЧТО ОНО ГОДИТСЯ, и вывезти — и тогда
   двести лет работы впервые не пропали: изделие принимает ваша база.
   Эфир набит машинами, говорящими друг с другом на языке накладных.

   ПРАВИЛА ФАЙЛА:
   1. Комбинат — та же Жестянка (12ta), только без наряда: смена у него не
      кончается никогда. Своей машины не заводим.
   2. Хранится G.plan={took,hauled}: сколько взяли и сколько довезли до базы. */

const PLAN_ETHER=[
  "…накладная 7-114-3. Принято: ноль. Отгружено: сорок. Повторяю: принято ноль.",
  "…сортировка. Партия забракована. Основание: нет получателя. Отправить повторно.",
  "…погрузчик четыре. Склад не найден. Объезжаю. Склад не найден. Объезжаю.",
  "…рудник два, отгрузка в отсутствие транспорта. Отгружаю.",
  "…квитанция. Квитанция. Кто примет квитанцию?"
];
function planAll(){return (G.plan||(G.plan={took:0,hauled:0}));}
function planDepthAt(sx,sy){
  if(typeof regionAt!=="function")return 0;
  const R=regionAt(sx,sy);
  if(R.theme!=="plan")return 0;
  return (R.core.sx===sx&&R.core.sy===sy)?2:1;
}
function planDepthHere(){return planDepthAt(G.sx,G.sy);}
/* комбинат стоит на первой планете ядра, где может стоять железо, а посёлка нет */
function planCorePlanet(sys){
  if(!sys||planDepthAt(sys.sx,sys.sy)!==2)return null;
  for(const p of sys.planets||[])if(p&&p.type&&TIN_ON.indexOf(p.type)>=0&&!(typeof settleCanLive==="function"&&settleCanLive(p)))return p;
  return null;
}
function planIsCore(p){const c=planCorePlanet(G.sys);return !!(c&&p&&c.idx===p.idx);}
function planIsCoreT(T){return !!(T&&T.sx===G.sx&&T.sy===G.sy&&planDepthHere()===2&&planCorePlanet(G.sys)&&planCorePlanet(G.sys).idx===T.idx);}
function planEtherLine(r){
  if(!planDepthHere()||r()>(planDepthHere()===2?.7:.4))return null;
  return pick(PLAN_ETHER,r);
}
function planGroundLine(){
  const d=planDepthHere();
  if(!d)return null;
  if(d===1)return "Рудник отгружает в пустоту. Погрузчик кружит вокруг ямы от склада.";
  return planAll().hauled?"Комбинат работает. Первая партия ушла по адресу.":"Комбинат. Склады до горизонта. Одинаковые единицы чего-то.";
}
/* смена у комбината не кончается (12ta tinTick) */
function planEndless(T){
  if(!planIsCoreT(T))return;
  if(T.run<50)T.run=50;
  T.bin=Math.min(TIN_BIN,(T.bin||0)+.001);
}
function planTook(T,got){
  if(!planIsCoreT(T)||got<=0)return;
  planAll().took=(planAll().took|0)+got;
  logAdd("dim","Изделие в трюме. На что оно — неясно. База примет: там всему найдут место.");
}
/* ── вывоз ──
   Зовётся из enterBase: изделие из ядра, привезённое на свою базу, идёт в её
   запас — и двести лет впервые не зря. */
function planDeliver(B){
  const P=planAll();
  if(!P.took||!B)return 0;
  const at=(typeof regionOfTheme==="function")?regionOfTheme("plan"):null;
  if(!at)return 0;
  const R=regionAt(at.rx*REGION_SPAN,at.ry*REGION_SPAN);
  const S=getSystem(R.core.sx,R.core.sy),pc=planCorePlanet(S);
  if(!pc)return 0;
  const T=tinAt(R.core.sx,R.core.sy);if(!T)return 0;
  const k=tinAskOf(T.seed).made;
  const n=Math.min(G.cargo[k]|0,P.took|0);
  if(n<=0)return 0;
  G.cargo[k]-=n;P.took-=n;
  B.pool=B.pool||{};B.pool[k]=(B.pool[k]||0)+n;
  const first=!P.hauled;
  P.hauled=(P.hauled|0)+n;
  logAdd("good",(first?"Двести лет работы — впервые не зря. ":"")+RES[k].ru+" ×"+n+" — в запас базы.");
  return n;
}
