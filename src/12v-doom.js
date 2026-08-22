/* ══════════════ срок: мир, который кончается по расписанию ══════════════
   Глава, ради которой строились зарубки (M106) и календарь неба (M107). До неё
   отчёт «Долгого Хода» был занятным чтением; здесь выясняется, ЗАЧЕМ он написан
   календарём, а не картой сокровищ: экспедиция мерила не место, а срок.

   ПРАВИЛА, которые легко сломать:
   1. Срок приходит только туда, где у игрока ЕСТЬ что терять — на планету с его
      посёлком (M109), поднявшимся хотя бы до второй ступени. Срок на пустом
      месте — это просто запрет летать в сектор.
   2. Вывоз идёт обычной механикой игры: место в трюме, рейсы, время. Никакой
      кнопки «эвакуировать». Люди занимают трюм наравне с рудой, и это делает
      выбор «взять ещё десять или довезти руду» настоящим.
   3. Никто не помогает сам. Наёмники (12a) считаются только те, кого игрок
      заранее послал в этот сектор: вывезено ровно столько, сколько он
      организовал, а не сколько простила игра.
   4. Не вывезти — разрешённый исход, а не проигрыш. Система остаётся на карте
      пустой, и глифы посёлка больше некому отвечать. Наказания нет: в этом и
      состоит вес решения.
   5. Спасённые начинают заново и ХУЖЕ: ступень падает, половина построек
      остаётся там. Но seed, имя и словарь — те же люди, а не новые. */
const DOOM_LEAD=90*60000;        // сколько идёт срок с того часа, как он назначен
const DOOM_WARN=[30,10,2];       // за сколько минут напоминать, по одному разу
const DOOM_FOLK=60;              // сколько всего людей в посёлке второй ступени
function doomGet(){return G.doom||null;}
function doomHereKey(){return G.sx+","+G.sy;}
/* срок назначается один на прохождение и только по посёлку игрока: считать его
   от Date.now() — тот же ленивый способ, каким живёт весь остальной мир */
function doomArm(S){
  if(G.doom||!S||S.stage<2)return null;
  G.doom={sx:S.sx,sy:S.sy,key:S.sx+","+S.sy,at:Date.now()+DOOM_LEAD,
    known:false,folk:DOOM_FOLK+((S.built.length|0)*6),lifted:0,landed:0,
    to:null,over:false,warned:[]};
  return G.doom;
}
function doomLeft(){const D=doomGet();return D?Math.max(0,D.at-Date.now()):0;}
function doomMins(){return Math.ceil(doomLeft()/60000);}
function doomIsHere(){const D=doomGet();return !!D&&!D.over&&D.sx===G.sx&&D.sy===G.sy;}
/* сколько людей ещё стоит на земле */
function doomStanding(){const D=doomGet();return D?Math.max(0,D.folk-D.lifted):0;}
/* ── как узнают ──
   Небо, под которое зарубки датированы: игрок прилетает в свою систему, и
   календарь называет срок. Отдельного экрана с истиной здесь нет и не будет. */
function doomLearn(){
  const D=doomGet();
  if(!D||D.known||D.over||!doomIsHere())return false;
  D.known=true;
  /* метка на карте — тем же слоем знания, каким размечены слухи (12p): срок
     должен быть виден оттуда же, откуда планируют рейс */
  if(typeof newsMark==="function")newsMark(D.key,"срок · "+doomMins()+" мин","#ff6b57");
  tell("warn","Срок назван: «"+(G.sys?G.sys.name:"")+"» кончится через "+doomMins()+" мин",
    "НЕБО НАЗВАЛО СРОК\n«"+(G.sys?G.sys.name:"")+"»\nосталось "+doomMins()+" мин\n"+
    "на земле "+doomStanding()+" человек");
  return true;
}
/* ── помощь, которую организовали заранее ──
   Наёмник считается, только если он послан РОВНО в этот сектор. Ни перк, ни
   удача: это план, составленный до срока. */
function doomHelp(){
  const D=doomGet();
  if(!D)return 0;
  let n=0;
  for(const c of G.crew||[]){
    if(!c.shipId||!c.order||c.order.kind==="home")continue;
    if(c.order.sx!==D.sx||c.order.sy!==D.sy)continue;
    if(typeof crewBusy==="function"&&crewBusy(c))continue;
    n+=Math.round(crewCargoMax(c)*.5);      // половина трюма: остальное — их работа
  }
  /* управляющие тоже вывозят (хвост M114): командир звена ставит под подъём
     свои борта, фактор снимает с маршрута место под людей. Не отдельный приказ,
     а то, что домен и так делает, — считается по уровню */
  if(typeof mgrOf==="function"){
    const cmd=mgrOf("cmd");if(cmd&&!cmd.stalled)n+=4+mgrLevel(cmd)*3;
    const fac=mgrOf("fact");if(fac&&!fac.stalled)n+=2+mgrLevel(fac)*2;
  }
  return n;
}
/* ── подъём ──
   Люди — строка трюма (`folk`), и это не шутка формата: место, рейсы и время
   и есть вся механика вывоза. */
function doomLift(){
  const D=doomGet();
  if(!D||D.over||!doomStanding())return 0;
  const free=stat().cargoMax-held();
  const n=Math.min(doomStanding(),Math.max(0,free)+doomHelp());
  if(n<=0){say("В ТРЮМЕ НЕТ МЕСТА");return 0;}
  const own=Math.min(n,Math.max(0,free));
  G.cargo.folk=(G.cargo.folk|0)+own;
  D.lifted+=n;                              // взятое наёмниками уходит их бортом
  const bycrew=n-own;
  tell("good","Поднято людей ×"+n+(bycrew?" (наёмники взяли "+bycrew+")":""),
    "ПОДНЯТО ×"+n+(bycrew?"\nваши борта взяли "+bycrew:"")+
    "\nна земле осталось "+doomStanding());
  if(bycrew)D.landed+=bycrew;               // их борта высаживают там же, где сядете вы
  return n;
}
/* ── высадка ──
   Куда — и есть исход. Годится любая живая планета в ДРУГОЙ системе, где никто
   ещё не живёт: посёлок начинается заново, но теми же людьми. */
function doomCanLand(p){
  const D=doomGet();
  if(!D||!p||!(G.cargo.folk|0))return false;
  if(G.sx===D.sx&&G.sy===D.sy)return false;             // обратно на срок — не выход
  if(typeof settleCanLive==="function"&&!settleCanLive(p))return false;
  const at=settleAt(G.sx,G.sy);
  return !at||at.moved;                                  // либо пусто, либо уже их новое место
}
function doomLand(p){
  const D=doomGet();
  const n=G.cargo.folk|0;
  if(!D||!n)return 0;
  const old=settleMap()[D.key]||null;
  const key=settleKeyOf(G.sx,G.sy);
  let S=settleMap()[key];
  if(!S){
    /* те же люди: seed, имя и склонность переносятся целиком — от этого зависят
       глифы, то есть весь словарь, который игрок собирал зарубками */
    S=settleMap()[key]={
      seed:old?old.seed:hashi(G.sx,G.sy,0x5E77),
      sx:G.sx,sy:G.sy,idx:(p&&p.idx|0),name:old?old.name:((p&&p.name)||""),
      lean:old?old.lean:SETTLE_BUILD[0].k,
      stage:1,mood:clamp(old?old.mood:50,0,100),fed:0,stock:{},diet:{},
      /* половина построек осталась там: начинают заново и хуже */
      built:old?old.built.slice(0,Math.floor(old.built.length/2)):[],
      made:Date.now(),last:Date.now(),asked:0,paid:0,raided:0,
      moved:1,from:D.key};
    S.stage=S.built.length>=5?3:(S.built.length>=3?2:1);
  }
  G.cargo.folk=0;
  D.landed+=n;
  D.to={sx:G.sx,sy:G.sy};
  tell("good","Высажено людей ×"+n+" · посёлок начат заново",
    "ВЫСАЖЕНО ×"+n+"\nони начинают заново\nступень "+S.stage);
  return n;
}
/* ── час ──
   Считается лениво, как всё остальное: ни таймера, ни тика в кадре. Вызывается
   из петли и из прыжка, и делает работу один раз. */
function doomTick(){
  const D=doomGet();
  if(!D||D.over)return;
  if(D.known){
    const m=doomMins();
    for(const w of DOOM_WARN)
      if(m<=w&&D.warned.indexOf(w)<0){
        D.warned.push(w);
        if(typeof newsMark==="function")newsMark(D.key,"срок · "+w+" мин","#ff6b57");
        logAdd("warn","До срока «"+D.sx+","+D.sy+"» осталось "+w+" мин · на земле "+doomStanding());
      }
  }
  if(Date.now()<D.at)return;
  D.over=true;
  /* мир кончился: посёлок на этой земле перестаёт существовать, а система
     остаётся на карте — пустой. Это и есть разрешённый исход. */
  const S=settleMap()[D.key];
  if(S&&!S.moved)delete settleMap()[D.key];
  if(!G.doomDead)G.doomDead={};
  G.doomDead[D.key]=Date.now();
  if(typeof newsMark==="function")newsMark(D.key,"здесь больше никого","#7d8a95");
  const stayed=doomStanding();
  if(D.landed>0)
    tell("warn","Срок вышел · вывезено "+D.landed+", осталось "+stayed,
      "СРОК ВЫШЕЛ\nвывезено "+D.landed+"\nосталось "+stayed+
      (D.to?"\nони живут в секторе "+D.to.sx+","+D.to.sy:"\nони ещё в трюме"));
  else
    tell("warn","Срок вышел · вывезти не успели никого",
      "СРОК ВЫШЕЛ\nникого не вывезли\nсектор "+D.sx+","+D.sy+" пуст");
  if(typeof saveGame==="function")saveGame(true);
}
/* строка для подсказки на поверхности и для карты: одна на всех, чтобы срок
   всюду назывался одинаково */
function doomLine(){
  const D=doomGet();
  if(!D)return "";
  if(D.over)return "СРОК ВЫШЕЛ · сектор "+D.sx+","+D.sy+" пуст";
  if(!D.known)return "";
  return "СРОК · "+doomMins()+" мин · на земле "+doomStanding()+
    (doomHelp()?" · борта наёмников готовы взять "+doomHelp():"");
}
