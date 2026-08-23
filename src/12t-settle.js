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
    made:Date.now(),last:Date.now(),asked:0,paid:0,raided:0};
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
  const was=S.stage;
  S.stage=S.built.length>=5?3:(S.built.length>=3?2:1);
  /* третья ступень — посёлок вышел на карту фактора и начал торговать; для дома,
     чьи станции рядом, это настоящая перемена, и она двигает курс бон (12u) */
  if(was<3&&S.stage>=3&&typeof scripOnSettle==="function")scripOnSettle(G.sx,G.sy);
  /* со второй ступени посёлку есть что терять — и только тогда календарь
     «Долгого Хода» назначает этой земле срок (12v-doom, M114) */
  if(was<2&&S.stage>=2&&typeof doomArm==="function"&&!S.moved)doomArm(S);
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
  if(typeof grownOnGive==="function")grownOnGive(S,k,n,G.surf&&G.surf.p);   /* взаимность (11q) */
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
/* ── словарь как интерфейс ──
   Слово, пришедшее куском отчёта (12q-lore), — не строчка лора, а рычаг: пока
   его нет, игрок берёт то, что вынесут; когда есть — он может назвать, чего
   просит, и они начнут с этого. Всё, чего он назвать не умеет, по-прежнему
   решают за него. */
const SETTLE_WORD={"вода":"ice","камень":"silicon","огонь":"carbon",
  "земля":"organics","дом":"iron","небо":"titan"};
function settleWords(S){
  const vocab=(typeof loreVocab==="function")?loreVocab():[];
  const makes=settleMakes(S);
  return vocab.filter(w=>SETTLE_WORD[w]&&makes.indexOf(SETTLE_WORD[w])>=0);
}
function settleAsk(S,word){
  S=settleTick(S);
  if(!S)return 0;
  const now=Date.now();
  if(now-(S.asked||0)<SETTLE_WAIT)return 0;
  let makes=settleMakes(S);
  if(!makes.length)return 0;
  if(S.mood<35)return 0;
  /* названное слово ставит свой товар первым — но не создаёт его из ничего и
     не отменяет настроения: просьба, а не заказ */
  if(word&&settleWords(S).indexOf(word)>=0){
    const k=SETTLE_WORD[word];
    makes=[k].concat(makes.filter(x=>x!==k));
  }
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
/* ── как это выглядит с земли ──
   Место, к которому идут ногами и на котором нечего увидеть, — это ложь той же
   породы, что перк без кода. Посёлок рисуется здесь же, рядом с моделью, потому
   что рисовать нечего, кроме того, что модель уже знает: сколько поднято, чем
   кормили и какое настроение.

   Дворов ровно столько, сколько построек, плюс один жилой — тот, с которого всё
   начинается. Крыши низкие и разной высоты: посёлок не строили по чертежу.
   Дым идёт только там, где есть печь или кузня, и гаснет, если настроение упало
   ниже трети: по нему и видно голод, без единой цифры. Окна при этом не гаснут
   никогда — в них живут и голодая, а посёлок до первого дара состоит из одних
   тёмных коробок и без огня в окне не читался на склоне вовсе. */
function settleDraw(S,tr,camx,camy,p){
  /* до первого дара записи нет, но люди здесь уже есть: рисуем те же несколько
     дворов без дыма и без дозорных. Иначе подсказка «здесь живут» показывала бы
     на пустой холм. */
  if(!S)S={seed:hashi(G.sx,G.sy,(p&&p.idx|0)+0x5E77),built:[],mood:20,stage:1};
  const bx=settleSpotX(p,tr);if(bx==null)return;
  const sx=bx-camx;
  if(sx<-260||sx>W+260)return;
  const gy=groundAt(tr,bx)-camy;
  const r=rng(S.seed^0x2C1);
  const warm=(S.mood>=34);
  const n=2+S.built.length+((typeof grownExtra==="function")?grownExtra(p):0);   // и до первого дара тут живут; ступень уезда (11q)
  const pal=p.T.pal;
  const wall="rgb("+pal[2].map(v=>Math.round(v*.62+18)).join(",")+")";
  const roof="rgb("+pal[1].map(v=>Math.round(v*.5+10)).join(",")+")";
  for(let i=0;i<n;i++){
    const ox=sx+(i-(n-1)/2)*26+(r()-.5)*8;
    const hk=(typeof countyHouseK==="function")?countyHouseK(p):1;   /* большой уезд (11l): дворы под гостя */
    const hh=(16+r()*10)*hk, ww=(17+r()*8)*hk;
    const oy=groundAt(tr,bx+(ox-sx))-camy;
    ctx.fillStyle="rgba(0,0,0,.34)";                       // контакт с грунтом
    ctx.beginPath();ctx.ellipse(ox,oy-1,ww*.6,3,0,0,TAU);ctx.fill();
    ctx.fillStyle=wall;ctx.fillRect(ox-ww/2,oy-hh,ww,hh);
    if(i===0&&typeof houseWallMark==="function"&&typeof houseOf==="function")houseWallMark(houseOf(G.sys),ox-ww/2,oy,ww,hh);   /* знак дома на стене (17d) */
    ctx.fillStyle=roof;                                    // низкая двускатная крыша
    ctx.beginPath();
    ctx.moveTo(ox-ww/2-3,oy-hh);ctx.lineTo(ox,oy-hh-7);ctx.lineTo(ox+ww/2+3,oy-hh);
    ctx.closePath();ctx.fill();
    /* обвод по кромке крыши: тёмная коробка на тёмном склоне не читается вовсе,
       а посёлок до первого дара только из таких коробок и состоит */
    ctx.strokeStyle="rgba(226,236,240,.30)";ctx.lineWidth=1;
    ctx.beginPath();
    ctx.moveTo(ox-ww/2-3,oy-hh+.5);ctx.lineTo(ox,oy-hh-6.5);ctx.lineTo(ox+ww/2+3,oy-hh+.5);
    ctx.stroke();
    ctx.fillStyle="rgba(255,206,130,"+(.30+S.mood/260).toFixed(2)+")";   // очаг
    ctx.fillRect(ox-2.5,oy-hh*.62,5,4.5);
    if(typeof lightsShutters==="function")lightsShutters(ox,oy,ww,hh);   // ставни области трёх светов (11g)
    /* труба и дым — только у тех дворов, где что-то жгут */
    const b=SETTLE_BY_K[S.built[i-1]];
    if(b&&(b.k==="kiln"||b.k==="forge"||b.k==="still")){
      ctx.fillStyle=roof;ctx.fillRect(ox+ww*.28,oy-hh-11,3.4,6);
      if(warm)for(let s=0;s<4;s++){
        const t=((G.t*.6+s*40+i*17)%160)/160;
        ctx.fillStyle="rgba(210,214,220,"+((1-t)*.16).toFixed(3)+")";
        ctx.beginPath();
        ctx.arc(ox+ww*.28+1.7+Math.sin(t*6+i)*5*t,oy-hh-12-t*46,2+t*7,0,TAU);ctx.fill();
      }
    }
  }
  /* дозорные: не украшение, а то, чем посёлок стоит между игроком и фауной
     (M110). Их видно ровно со второй ступени — раньше некому стоять. */
  const nobody=(typeof hoursNobody==="function")&&hoursNobody(p);   // уезд часов (11h): днём никого
  if(S.stage>=2&&!nobody)for(let i=0;i<2;i++){
    const ox=sx+(i?1:-1)*(n*14+16), oy=groundAt(tr,bx+(ox-sx))-camy;
    ctx.fillStyle="rgba(20,24,30,.9)";
    ctx.fillRect(ox-1.6,oy-13,3.2,13);
    ctx.beginPath();ctx.arc(ox,oy-15.5,2.6,0,TAU);ctx.fill();
    ctx.strokeStyle="rgba(20,24,30,.9)";ctx.lineWidth=1.4;   // шест в руке
    ctx.beginPath();ctx.moveTo(ox+(i?3:-3),oy-19);ctx.lineTo(ox+(i?3:-3),oy);ctx.stroke();
  }
  if(typeof hoursDrawPeople==="function")hoursDrawPeople(S,tr,camx,camy,p,sx,n,r);   // люди в слоях (11h)
  if(typeof countyDrawTown==="function")countyDrawTown(S,tr,camx,camy,p,sx,n);      // город без кнопок (11l)
  ctx.fillStyle="rgba(226,206,160,.75)";ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
  ctx.fillText("ПОСЁЛОК",sx,gy-56-n*2);
  /* ── виден с горизонта (хвост M109) ──
     Дворы в полтора десятка пикселей тонут в склоне за экран. Посёлок
     отмечает себя сам: шест с вымпелом выше любой крыши и столб дыма от
     общего очага, который тянется на сотню пикселей вверх и кренится по
     ветру. Шест рисуется вместе с дворами; дым — только у живого посёлка */
  {
    const px=sx+n*13+30, py=groundAt(tr,bx+(px-sx))-camy;
    ctx.strokeStyle="rgba(40,34,26,.95)";ctx.lineWidth=1.6;
    ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px,py-62);ctx.stroke();
    const fl=Math.sin(G.t*.05)*3;
    ctx.fillStyle=(typeof housePennant==="function")?housePennant():"rgba(226,120,70,.9)";   /* цвет дома (17d) */
    ctx.beginPath();ctx.moveTo(px,py-62);ctx.lineTo(px+14+(WIND||0)*4,py-58+fl);ctx.lineTo(px,py-53);ctx.closePath();ctx.fill();
    if(warm)for(let s=0;s<7;s++){
      const t=((G.t*.5+s*40)%280)/280, rr=3+t*14;
      ctx.fillStyle="rgba(210,214,220,"+((1-t)*(1-t)*.16).toFixed(3)+")";
      ctx.beginPath();
      ctx.ellipse(sx+(WIND||0)*t*40+Math.sin(t*5+s)*4,gy-34-n*2-t*120,rr*1.3,rr*.8,t*.4,0,TAU);ctx.fill();
    }
  }
}
/* ══ M110: они стоят между вами и фауной — и платят за это ══
   Не бонус игроку, а свойство земли: со второй ступени у посёлка есть дозорные,
   и кусачая тварь в его биоме держится поодаль. Работает это только на своей
   планете (не «во всей системе») и только пока их кормят: голодной деревне не до
   дозора. И работает в обе стороны — пират, которого игрок притащил себе на
   хвосте, садится не на него, а на них. */
function settleWatch(p){
  const S=settleTick(settleHere());
  if(!S||S.stage<2)return 0;
  if(p&&(p.idx|0)!==(S.idx|0))return 0;
  if(S.mood<30)return 0;                      // голод снимает дозор раньше всего
  return clamp((S.stage>=3?1:.65)*(.3+S.mood/100),0,1);
}
/* ── расплата за налёт ──
   Цена берётся не за факт пиратов в системе, а за тех, кто игрока заметил: это
   его хвост, а не их погода. Настроение падает всегда, постройка теряется лишь
   при плотном налёте — иначе прикрытие деревней стоило бы дешевле, чем стоит. */
function settleRaid(S,heat){
  S=settleTick(S);
  if(!S||heat<=0)return 0;
  const hit=Math.min(34,6+heat*7);
  S.mood=clamp(S.mood-hit,0,100);
  S.raided=(S.raided|0)+1;
  let lost=null;
  if(S.built.length&&(heat>=3||(heat>=2&&S.mood<40))){
    lost=S.built.splice(Math.floor(rng(hashi(S.seed,S.raided*29,11))()*S.built.length),1)[0];
    S.stage=S.built.length>=5?3:(S.built.length>=3?2:1);
  }
  if(typeof logAdd==="function")
    logAdd("bad","Налёт на посёлок "+(S.name||"")+(lost?" · сожжено: "+SETTLE_BY_K[lost].ru:" · настроение упало"));
  return lost?2:1;
}
/* вызывается при уходе из системы: расплачивается тот, кого оставили под теми,
   кого привели. Охотник (12o) считается вдвое — ему всё равно, чья это крыша. */
function settleLeftBehind(){
  const S=settleAt(G.sx,G.sy);
  if(!S)return 0;
  let heat=0;
  for(const p of G.pirates||[]){
    if(!p.aware||p.hull<=0)continue;
    heat+=(p.hunter?2:1)+(p.rank|0)*.5;
  }
  if(heat<1)return 0;
  return settleRaid(S,heat);
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
