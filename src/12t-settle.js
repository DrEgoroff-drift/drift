/* ══════════════ посёлок: вы даёте, решают они ══════════════
   Второй базы быть не должно. У своей базы (21a) игрок — хозяин: он ставит
   отсеки, он платит, он приказывает. Здесь власти у него нет вовсе. Он может
   только КОРМИТЬ, а что из этого вырастет, решают живущие: у каждого посёлка
   своя склонность из зерна, и её перевешивает лишь то, чем его кормили долго.
   Управление игрока — это рацион, а не меню построек.

   Платят они товаром и по своему настроению: ни жалованья, ни процента, ни
   ровной строки дохода. Правило наёмника действует без изменений — это ставка,
   а не источник. Правки, делающие посёлок надёжным заработком, ломают замысел.

   Считается всё лениво, по прошедшему времени, с потолком на офлайн — модель
   `tickDrones` (12-economy) и рейсов наёмников (12a). Живой симуляции нет.

   Говорят они на стёршемся пиджине экспедиции: строка глифов, из которой игрок
   понимает ровно те слова, что пришли к нему кусками отчёта (12q-lore). Слово
   в словаре — это не лор, а интерфейс: понятое слово превращает догадку в
   просьбу, которую можно высказать. */

const SETTLE_CAP=24*3600*1000;         // потолок офлайна, как у наёмников
const SETTLE_EAT=.55;                  // сколько посёлок съедает в минуту
const SETTLE_STEP=120;                 // сколько принятого нужно на одну постройку
const SETTLE_STOCK=900;                // больше он просто не принимает: амбар не бездонный
const SETTLE_GIVE=.34;                 // доля запаса, которую отдают в хорошем настроении
const SETTLE_WAIT=8*60000;             // как часто у них вообще есть что отдать
/* где вообще есть кому жить: на голом камне и в кислоте посёлка не будет */
const SETTLE_ON=["terran","ocean","jungle","desert","ice","toxic"];
/* что посёлок способен поднять. `diet` — чем его надо кормить, чтобы склонность
   повернулась сюда; `give` — чем он потом платит. Ни одна постройка не выбирается
   игроком: список нужен, чтобы у роста были разные исходы, а не одна полоска. */
const SETTLE_BUILD=[
  {k:"field", ru:"поле",       diet:"organics",give:"organics"},
  {k:"weir",  ru:"запруда",    diet:"ice",     give:"ice"},
  {k:"kiln",  ru:"печь",       diet:"iron",    give:"iron"},
  {k:"cut",   ru:"камнерезка", diet:"silicon", give:"silicon"},
  {k:"forge", ru:"кузня",      diet:"titan",   give:"titan"},
  {k:"still", ru:"перегонка",  diet:"volatiles",give:"carbon"}
];
const SETTLE_BY_K={};SETTLE_BUILD.forEach(b=>SETTLE_BY_K[b.k]=b);
/* глифы пиджина: рисуются как знаки, а не как буквы — иначе игрок прочитает
   чужую речь родными словами и словарь потеряет смысл */
const SETTLE_GLYPH="ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛟᛞ";

function settleKeyOf(sx,sy){return sx+","+sy;}
function settleMap(){return (G.settle||(G.settle={}));}
function settleAt(sx,sy){return settleMap()[settleKeyOf(sx,sy)]||null;}
function settleHere(){return settleAt(G.sx,G.sy);}
/* посёлок заводится не кнопкой «основать»: он уже здесь, просто до первого
   дара это несколько дворов, о которых нечего сказать */
function settleCanLive(p){
  return !!(p&&p.type&&SETTLE_ON.indexOf(p.type)>=0);
}
/* где именно они живут: одно место на планете, посчитанное из зерна системы, а
   не «везде, где стоит игрок». Ходить к ним надо ногами, как к пещере. */
function settleSpotX(p,tr){
  if(!settleCanLive(p))return null;
  const r=rng(hashi(G.sx,G.sy,(p&&p.idx|0)+0x50D));
  const W2=(tr&&tr.W)||4000;                       // место считается в мерах рельефа,
  return 300+r()*Math.max(200,W2-600);             // а не в отвлечённых координатах
}
function settleMake(p){
  const key=settleKeyOf(G.sx,G.sy);
  const M=settleMap();
  if(M[key])return M[key];
  const seed=hashi(G.sx,G.sy,(p&&p.idx|0)+0x5E77);
  const r=rng(seed);
  M[key]={seed,sx:G.sx,sy:G.sy,idx:(p&&p.idx|0),name:(p&&p.name)||"",
    lean:SETTLE_BUILD[Math.floor(r()*SETTLE_BUILD.length)].k,   // своя склонность
    stage:1,mood:50,fed:0,stock:{},diet:{},built:[],
    made:Date.now(),last:Date.now(),asked:0,paid:0};
  return M[key];
}
/* ── рост, считаемый лениво ──
   Ни таймера, ни тика в кадре. Пока в амбаре есть еда, посёлок её ест и копит
   на постройку; когда еда кончается, настроение падает — и это единственная
   причина, по которой оно падает само. */
function settleTick(S){
  if(!S)return null;
  const now=Date.now();
  const mins=Math.min(now-(S.last||now),SETTLE_CAP)/60000;
  if(mins<=0)return S;
  S.last=now;
  let need=mins*SETTLE_EAT, ate=0;
  for(const k of Object.keys(S.stock)){
    if(need<=0)break;
    const take=Math.min(need,S.stock[k]||0);
    S.stock[k]-=take;need-=take;ate+=take;
    if(S.stock[k]<=.001)delete S.stock[k];
  }
  const hungry=need>0;
  S.fed+=ate;
  S.mood=clamp(S.mood+(hungry?-mins*.5:mins*.12),0,100);
  while(S.fed>=SETTLE_STEP){
    S.fed-=SETTLE_STEP;
    settleRaise(S);
  }
  return S;
}
/* что именно поднимут — считают они. Склонность из зерна плюс то, чем кормили:
   десять часов руды и десять часов летучих дают разные деревни. */
function settleRaise(S){
  const score={};
  for(const b of SETTLE_BUILD){
    score[b.k]=(S.diet[b.diet]||0)*1.0+(b.k===S.lean?SETTLE_STEP*.8:0)
      +(hashi(S.seed,S.built.length*17+3,7)%23)*.6            // своя воля, не считалка
      -(S.built.filter(x=>x===b.k).length)*SETTLE_STEP*.55;   // второе то же — дороже
  }
  let best=SETTLE_BUILD[0].k;
  for(const k in score)if(score[k]>score[best])best=k;
  S.built.push(best);
  S.stage=S.built.length>=5?3:(S.built.length>=3?2:1);
  S.mood=clamp(S.mood+6,0,100);
  if(typeof logAdd==="function")
    logAdd("good","Посёлок "+(S.name||"")+" поднял: "+SETTLE_BY_K[best].ru);
  return best;
}
/* ── дар ──
   Всё, что игрок отдал, ложится в амбар и записывается в рацион. Отдать можно
   только то, что лежит в трюме, и только руками: приказать нечего. */
function settleGive(S,k,n){
  S=settleTick(S);
  if(!S||!k)return 0;
  n=Math.min(n|0,G.cargo[k]|0);
  const room=Math.max(0,SETTLE_STOCK-settleStockSum(S));
  n=Math.min(n,Math.floor(room));
  if(n<=0)return 0;
  G.cargo[k]-=n;
  S.stock[k]=(S.stock[k]||0)+n;
  S.diet[k]=(S.diet[k]||0)+n;
  S.mood=clamp(S.mood+Math.min(8,n*.25),0,100);
  if(typeof saveGame==="function")saveGame(true);
  return n;
}
function settleStockSum(S){
  let s=0;for(const k in S.stock)s+=S.stock[k]||0;
  return Math.floor(s);
}
/* чем они платят: только тем, что научились делать сами. Пустой список — им
   нечего дать, и это честный ответ, а не ошибка. */
function settleMakes(S){
  const out=[];
  for(const k of S.built){const b=SETTLE_BY_K[k];if(b&&out.indexOf(b.give)<0)out.push(b.give);}
  return out;
}
/* ── попросить ──
   Не сделка и не цена: игрок спрашивает, а настроение решает, сколько готово.
   Кредитов посёлок не платит НИКОГДА — только товаром. */
function settleAsk(S){
  S=settleTick(S);
  if(!S)return 0;
  const now=Date.now();
  if(now-(S.asked||0)<SETTLE_WAIT)return 0;
  const makes=settleMakes(S);
  if(!makes.length)return 0;
  if(S.mood<35)return 0;
  S.asked=now;
  const st=stat();
  let room=Math.max(0,st.cargoMax-held()),got=0;
  const share=SETTLE_GIVE*(S.mood/100);
  for(const k of makes){
    if(room<=0)break;
    const has=Math.floor((S.stock[k]||0)+S.built.filter(x=>SETTLE_BY_K[x].give===k).length*6);
    const n=Math.min(room,Math.floor(has*share));
    if(n<=0)continue;
    S.stock[k]=Math.max(0,(S.stock[k]||0)-n);
    if(addRes(k,n)){room-=n;got+=n;}
  }
  if(got){S.paid+=got;S.mood=clamp(S.mood-4,0,100);}
  if(typeof saveGame==="function")saveGame(true);
  return got;
}
/* ── речь ──
   Строка глифов, постоянная для посёлка и для повода. Понятые слова (те, что
   пришли кусками отчёта) показываются словом, остальные остаются знаками. */
function settleLine(S,topic){
  const r=rng(hashi(S.seed,(topic|0)*131+7,5));
  const vocab=(typeof loreVocab==="function")?loreVocab():[];
  const n=3+Math.floor(r()*3),out=[];
  for(let i=0;i<n;i++){
    const known=vocab.length&&r()<Math.min(.75,vocab.length/12);
    if(known)out.push(vocab[Math.floor(r()*vocab.length)]);
    else{
      let w="";const len=2+Math.floor(r()*3);
      for(let j=0;j<len;j++)w+=SETTLE_GLYPH[Math.floor(r()*SETTLE_GLYPH.length)];
      out.push(w);
    }
  }
  return out.join(" ");
}
/* ── глазами фактора ──
   С третьей ступени посёлок — остановка на карте, к нему идут баржи (12l), как
   к своей планете (12n). Ниже третьей его не существует для маршрутов вовсе. */
function settleStop(S){
  if(!S||S.stage<3)return null;
  if(!starAt(S.sx,S.sy))return null;
  const sys=getSystem(S.sx,S.sy);
  if(!sys||sys.station)return null;
  const prices={};
  for(const k of TRADE_KEYS)prices[k]=Math.max(1,RES[k].price);
  return {key:sys.key,sx:sys.sx,sy:sys.sy,planets:sys.planets,name:sys.name,settle:1,
    station:{name:"посёлок "+(S.name||sys.name),stype:"trade",kind:"посёлок",
      orbit:0,ang:0,spd:0,prices,fuelPrice:11,x:0,y:0,vx:0,vy:0}};
}
function settleStops(){
  const out=[];
  for(const key in settleMap()){const S=settleMap()[key],st=settleStop(S);if(st)out.push(st);}
  return out;
}
