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
   чужую речь родными словами и словарь потеряет смысл.
   С M261 это правило наконец выполняется БУКВАЛЬНО: руны ниже — только
   носитель в строках (индексы, ходят через сохранение и провод как один
   символ), а до глаза они не доходят — каждый знак РИСУЕТСЯ грамматикой:
   шесть радикалов × четыре операции (тождество, отражение, полуоборот,
   подчёрк) = 24 знака. Семейства и операции глаз выхватывает — «у языка есть
   строение», — а прочитать нельзя, потому что читать нечего (колам,
   Сиромони; DESIGN-story-craft §2). До M261 тут стоял старший футарк, и
   игрок, видевший руны, читал пиджин как f-u-þ — константа нарушала
   собственный комментарий. */
const SETTLE_GLYPH="ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛟᛞ";
function glyphHasRunes(s){
  if(typeof s!=="string")return false;
  for(let i=0;i<s.length;i++)if(SETTLE_GLYPH.indexOf(s[i])>=0)return true;
  return false;
}
/* знак: радикалы нарочно несимметричны по обеим осям, иначе отражение и
   полуоборот дают тот же рисунок и 24 знака слипаются в дюжину */
function drawGlyph(c,i,x,y,s){
  const rad=i%6, op=(i/6)|0;
  c.save();c.translate(x+s*.4,y+s*.5);
  if(op===1)c.scale(-1,1);
  if(op===2)c.rotate(Math.PI);
  const w=s*.34,h=s*.42;
  c.beginPath();
  switch(rad){
    case 0: c.moveTo(0,-h);c.lineTo(0,h);c.lineTo(w*.8,h*.7);break;            /* столб с ножкой */
    case 1: c.moveTo(-w,h*.6);c.quadraticCurveTo(0,-h*1.3,w,h*.2);break;       /* дуга с перекосом */
    case 2: c.moveTo(-w,-h);c.lineTo(0,0);c.lineTo(w*.7,-h*.5);c.moveTo(0,0);c.lineTo(0,h);break; /* вилка */
    case 3: c.moveTo(-w,-h*.5);c.lineTo(w,-h*.5);c.moveTo(w*.3,-h);c.lineTo(w*.3,h);break;        /* перекладина со стойкой */
    case 4: c.moveTo(-w*.7,-h);c.lineTo(-w*.7,h*.3);c.quadraticCurveTo(-w*.7,h,w*.5,h*.7);break;  /* крюк */
    case 5: c.moveTo(-w,-h*.8);c.lineTo(w,h*.8);c.moveTo(-w,-h*.8);c.lineTo(w*.1,-h*.8);break;    /* косая с крышкой */
  }
  c.stroke();
  if(op===3){c.beginPath();c.moveTo(-w,h*1.15);c.lineTo(w,h*1.15);c.stroke();}
  c.restore();
}
/* канва-знак для DOM: плотность ×DPR×UIK (M221 — растр в панели иначе мылится) */
function glyphEl(i,ink){
  const px=11,d=Math.min(2,devicePixelRatio||1)*(typeof UIK==="number"?UIK:1);
  const cv=document.createElement("canvas");
  cv.width=Math.round(px*.82*d);cv.height=Math.round(px*1.2*d);
  cv.style.width=(px*.82)+"px";cv.style.height=(px*1.2)+"px";
  cv.className="glyphc";
  const c=cv.getContext("2d");c.scale(d,d);
  /* чернила: в эфире и журнале — светлые, на бумаге открытки — тёмные */
  c.strokeStyle=ink||"rgba(210,218,226,.92)";c.lineWidth=1.25;c.lineCap="round";
  drawGlyph(c,i,0,1,px);
  return cv;
}
/* строка с рунами → фрагмент: текст остаётся текстом, руны становятся знаками */
function glyphNodes(s){
  const fr=document.createDocumentFragment();
  let buf="";
  const flush=()=>{if(buf){fr.appendChild(document.createTextNode(buf));buf="";}};
  for(const ch of s){
    const gi=SETTLE_GLYPH.indexOf(ch);
    if(gi<0){buf+=ch;continue;}
    flush();fr.appendChild(glyphEl(gi));
  }
  flush();return fr;
}

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
/* стена (M210) — у ДАЛЬНЕГО КОНЦА полки, а не в середине посёлка. Причин две.
   Живая: расписываются на краю, там, где стоят и ждут, а не посреди улицы.
   Устройственная: в середине посёлка кнопка ДЕЙСТВИЕ уже занята — там кормят
   и просят, — а два дела на одну кнопку в одном шаге это отобранный выбор */
function settleWallX(P){return P?P.x0-10:null;}
/* то же место, но считанное с нуля — рисованию план и так строится каждый
   кадр, а ходьбе он нужен один раз за посадку. Посёлка может ещё и не быть
   (запись заводится только когда его накормят), поэтому S подставляется той
   же болванкой, что и в отрисовке: место у полки от этого не съезжает */
function settleWallHereX(p,tr){
  if(!settleCanLive(p))return null;
  const S=settleAt(G.sx,G.sy)||
    {seed:hashi(G.sx,G.sy,(p&&p.idx|0)+0x5E77),built:[],mood:20,stage:1};
  const P=settlePlan(S,tr,p);
  return P?settleWallX(P):null;
}
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
  /* под рукой (M198) постройка обходится дешевле: план всегда быстрее уклада */
  const step=SETTLE_STEP*((typeof settleMine==="function"&&settleMine(S))?HAND_STEP:1);
  while(S.fed>=step){
    S.fed-=step;
    settleRaise(S);
  }
  return S;
}
/* что именно поднимут — считают они. Склонность из зерна плюс то, чем кормили:
   десять часов руды и десять часов летучих дают разные деревни. */
function settleRaise(S){
  /* под рукой (M198) строят то, что окупается: своей воли в счёте больше нет,
     и потому все взятые под руку посёлки со временем похожи друг на друга */
  if(typeof settleMine==="function"&&settleMine(S)){
    const pick=settleHandPick(S);
    S.built.push(pick);
    const was0=S.stage;
    S.stage=S.built.length>=5?3:(S.built.length>=3?2:1);
    if(was0<3&&S.stage>=3&&typeof scripOnSettle==="function")scripOnSettle(G.sx,G.sy);
    if(was0<2&&S.stage>=2&&typeof doomArm==="function"&&!S.moved)doomArm(S);
    S._plan=null;
    S.mood=clamp(S.mood+4,0,100);
    if(typeof logAdd==="function")
      logAdd("good","Посёлок "+(S.name||"")+" поднял по указанию: "+SETTLE_BY_K[pick].ru);
    return pick;
  }
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
  /* амбар под рукой больше: склад строят по норме, а не по нужде (M198) */
  const cap=SETTLE_STOCK*((typeof settleMine==="function"&&settleMine(S))?HAND_STOCK:1);
  const room=Math.max(0,cap-settleStockSum(S));
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
  /* под рукой глифов больше нет: отвечают служебным словом (12td, M198).
     Словарь, который игрок собирал кусками отчёта, здесь перестаёт работать —
     и это единственная потеря, которой нет ни в одной цифре */
  if(typeof settleMine==="function"&&settleMine(S))return settleHandLine(S,topic);
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
  const P=settlePlan(S,tr,p);
  const n=(P?P.yards.length:2+S.built.length);
  /* тела дворов, терраса, улица и быт — в 12tb (M169). Здесь остаётся то, что
     принадлежит посёлку как месту в мире: дозорные, знак дома, вымпел, дым */
  settleDrawBody(S,tr,camx,camy,p);
  /* мачта со знаком: единственное, что посёлок под рукой (M198) получает сверх */
  if(typeof settleMine==="function"&&settleMine(S)&&typeof settleHandMast==="function"&&P)
    settleHandMast(P,camx,camy,(typeof sdPal==="function")?sdPal(p):{});
  if(typeof houseWallMark==="function"&&typeof houseOf==="function"&&P&&P.yards[0]){
    const v=P.yards[0],ox=v.wx-camx,oy=P.baseY-camy-v.lift;
    houseWallMark(houseOf(G.sys),ox-v.w/2,oy,v.w,v.h*.66);          /* знак дома на стене (17d) */
  }
  if(typeof lightsShutters==="function"&&P)for(const v of P.yards)
    if(v.kind==="dwell")lightsShutters(v.wx-camx,P.baseY-camy-v.lift,v.w,v.h*.66);   /* ставни (11g) */
  /* дозорные: не украшение, а то, чем посёлок стоит между игроком и фауной
     (M110). Их видно ровно со второй ступени — раньше некому стоять. */
  const nobody=(typeof hoursNobody==="function")&&hoursNobody(p);   // уезд часов (11h): днём никого
  if(S.stage>=2&&!nobody)for(let i=0;i<2;i++){
    const ox=(P?(i?P.x1+18:P.x0-18):sx+(i?1:-1)*40)-camx, oy=(P?P.baseY:groundAt(tr,bx))-camy;
    ctx.fillStyle="rgba(20,24,30,.9)";
    ctx.fillRect(ox-1.6,oy-13,3.2,13);
    ctx.beginPath();ctx.arc(ox,oy-15.5,2.6,0,TAU);ctx.fill();
    ctx.strokeStyle="rgba(20,24,30,.9)";ctx.lineWidth=1.4;   // шест в руке
    ctx.beginPath();ctx.moveTo(ox+(i?3:-3),oy-19);ctx.lineTo(ox+(i?3:-3),oy);ctx.stroke();
  }
  if(typeof hoursDrawPeople==="function")hoursDrawPeople(S,tr,camx,camy,p,sx,n,r);   // люди в слоях (11h)
  if(typeof countyDrawTown==="function")countyDrawTown(S,tr,camx,camy,p,sx,n);      // город без кнопок (11l)
  /* ── виден с горизонта (хвост M109) ──
     Дворы тонут в склоне за экран. Посёлок отмечает себя сам: шест с вымпелом
     выше любой крыши и столб дыма от общего очага, который тянется на сотню
     пикселей вверх и кренится по ветру. Подпись словом убрана (M169): место,
     которое надо подписывать, нарисовано плохо. */
  {
    const py=(P?P.baseY:groundAt(tr,bx))-camy;
    const px=(P?P.x1+30:sx+60)-camx;
    ctx.strokeStyle="rgba(40,34,26,.95)";ctx.lineWidth=1.6;
    ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px,py-62);ctx.stroke();
    const fl=Math.sin(G.t*.05)*3;
    ctx.fillStyle=(typeof housePennant==="function")?housePennant():"rgba(226,120,70,.9)";   /* цвет дома (17d) */
    ctx.beginPath();ctx.moveTo(px,py-62);ctx.lineTo(px+14+(WIND||0)*4,py-58+fl);ctx.lineTo(px,py-53);ctx.closePath();ctx.fill();
    /* столб общего очага — тем же дымом, что у труб (12tb): здесь он был
       цепочкой крупных овалов и читался мыльными пузырями в небе (M169) */
    if(warm&&typeof sdSmoke==="function")
      sdSmoke((P?P.bx:bx)-camx,py-10,(WIND||0)*2,1.35,7,14);
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
