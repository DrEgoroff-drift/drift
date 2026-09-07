/* ══════════════ сохранение ══════════════ */
/* Облако включается не настройкой, а входом: заглавная страница кладёт токен в
   localStorage того же домена, игра его просто видит. Открытая с диска игра
   (file://) остаётся полностью локальной — сервера рядом нет и быть не должно. */
const CLOUD={api:"/api.php",tkey:"drift_token",lkey:"drift_login"};
const SAVE_KEY="drift_save_v4";
let STORAGE_OK=true, lastSave=0;
function stGet(k){try{return localStorage.getItem(k);}catch(e){STORAGE_OK=false;return null;}}
/* Отказ хранилища раньше был виден только тому, кто сам открыл НАСТРОЙКИ →
   СОХРАНЕНИЕ. В приватном окне Safari или при переполненной квоте человек играл
   часами, ничего не записывая, и узнавал об этом закрыв вкладку. Про такое
   сообщают сразу и громко — один раз, чтобы не превратиться в шум. */
let STORAGE_TOLD=false;
function stSet(k,v){
  try{localStorage.setItem(k,v);return true;}
  catch(e){
    STORAGE_OK=false;
    if(!STORAGE_TOLD){
      STORAGE_TOLD=true;
      if(typeof say==="function")say("ИГРА НЕ ЗАПИСЫВАЕТСЯ\nбраузер не даёт хранить\nсохраните код: НАСТРОЙКИ → СОХРАНЕНИЕ",420);
      if(typeof logAdd==="function")logAdd("warn","Браузер не даёт записывать: полёт не сохраняется. НАСТРОЙКИ → СОХРАНЕНИЕ, скопируйте код.");
    }
    return false;
  }
}
function stDel(k){try{localStorage.removeItem(k);}catch(e){}}
function b64enc(s){const b=new TextEncoder().encode(s);let o="";
  for(let i=0;i<b.length;i++)o+=String.fromCharCode(b[i]);return btoa(o);}
function b64dec(s){const bin=atob(s.replace(/\s+/g,""));const a=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return new TextDecoder().decode(a);}
/* флаги «уже куплено» живут ровно столько, сколько живёт сам ассортимент:
   бакеты старше текущего выбрасываем, иначе объект растёт вечно */
function prunePartsBought(){
  const now=timeBucket(),out={};
  for(const k in G.partsBought){
    const b=+k.split("|")[1];
    if(b>=now-1)out[k]=1;
  }
  G.partsBought=out;
  return out;
}
function snapshot(){
  /* ── v:5 (M227) ──
     Пишем 5, читаем 4 и 5: ни один старый сейв не теряется — ни локальный, ни
     облачный. Смысл номера: дверь для чисток релизного вида, которые поменяют
     СОСТАВ сохраняемого; они лягут веткой s.v===5, а v:4-ветки (modsOwned из
     mods) останутся жить под своим номером. Ключ localStorage не трогаем:
     он адрес, а не формат, и смена имени осиротила бы каждый локальный сейв.
     «server.js:95 и worker.js:66», которых боялось старое правило, не
     существуют: облако — site/api.php, и он проверяет только наличие v. */
  return {v:5,sx:G.sx,sy:G.sy,shipId:G.shipId,owned:G.owned,
    x:G.ship.x,y:G.ship.y,a:G.ship.a,fuel:G.fuel,hull:G.hull,
    cargo:G.cargo,credits:G.credits,data:G.data,soldTotal:G.soldTotal|0,mods:G.mods,modsOwned:G.modsOwned,
    /* допуск, налёт и выбранная группа орудий (M363, §16.4) */
    clearance:G.clearance|0,flownMs:G.flownMs|0,gunGroup:G.gunGroup|0,
    inv:G.inv.map(packPart),fit:G.fit,partsBought:prunePartsBought(),
    tech:[...G.tech],techLvl:G.techLvl,barter:[...G.barter],found:[...G.found],
    species:[...G.species],bioV:2,
    opts:G.opts,zoom:G.zoom,market:G.market,uniqueShips:G.uniqueShips,tow:G.tow,
    episodes:G.episodes,notebook:G.notebook,gifts:G.gifts,mslBy:G.mslBy,
    bonds:G.bonds,bondHold:G.bondHold,coupN:G.coupN,
    letter:G.letter||null,dipSwapN:G.dipSwapN,smugN:G.smugN,smugBy:G.smugBy,
    probed:G.probed,
    longHod:G.longHod,race:G.race||null,raceBest:G.raceBest,
    drones:G.drones,droneInventory:G.droneInventory,droneIds:G.droneIds,droneSold:G.droneSold||{},crew:G.crew,bases:G.bases,
    mgrs:G.mgrs,blueprints:G.blueprints,aiRift:G.aiRift,rogues:G.rogues,exiles:G.exiles,
    relics:G.relics,relicHint:G.relicHint,bio:G.bio,home:G.home,course:G.course||null,
    occ:G.occ,freed:G.freed,occCalm:G.occCalm,trade:G.trade,wear:G.wear,seams:G.seams,
    instrKit:G.instrKit,instrShelf:G.instrShelf,
    speech:G.speech,visits:G.visits,strips:G.strips,
    walled:G.walled,   /* где расписался на камне (С2): решение игрока — хранится */
    mailed:G.mailed,   /* откуда отправлял открытки (С3): тот же журнал поступков */
    need:G.need,order:G.order,things:G.things,ratios:G.ratios,seenPrices:G.seenPrices,   /* M152e, M151a */
    hold:G.hold,   /* холдинг (M290): одна карта на весь слой — сдано в аппетит, позже постройки и пай */
    kit:G.kit,kitShelf:G.kitShelf,kitDepot:G.kitDepot,   /* комплект (M152) */
    vega:G.vega,wishDevice:G.wishDevice,   /* Вега (M153) */
    ring:G.ring,exp:G.exp,letters:G.letters,island:G.island,record:G.record,inst:G.inst,trainee:G.trainee,zoo:G.zoo,concert:G.concert,road:G.road,trace:G.trace,duty:G.duty,album:G.album,mail:G.mail,probes:G.probes,win:G.win,spa:G.spa,hol:G.hol,books:G.books,qsl:G.qsl,relay:G.relay,green:G.green,kino:G.kino,penn:G.penn,first:G.first,chess:G.chess,   /* M154–M207, M192 */
    seen:G.seen,storyPin:G.storyPin,storyFlags:G.storyFlags,place:G.place,odo:G.odo,post:G.post,mirror:G.mirror,lights:G.lights,hours:G.hours,grove:G.grove,keepers:G.keepers,county:G.county,charts:G.charts,quiet:G.quiet,slow:G.slow,pass:G.pass,grown:G.grown,plan:G.plan,ret:G.ret,names:G.names,namesTold:G.namesTold,name:G.name||"",
    tape:(typeof tapePack==="function")?tapePack():null,tapeLong:G.tapeLong|0,
    fuseGen:G.fuseGen,mines:G.mines,quests:G.quests,rep:G.rep,poiSeen:G.poiSeen,findsSeen:G.findsSeen,
    nodes:G.nodes,crowns:G.crowns,nodeShow:G.nodeShow,rareFound:G.rareFound,pnode:G.pnode,hunted:G.hunted,
    news:G.news,newsMarks:G.newsMarks,newsT:G.newsT,rivals:G.rivals,
    wrecks:G.wrecks,bargePax:G.bargePax,fleetLog:G.fleetLog||{},fleetEscort:G.fleetEscort||0,caravan:G.caravan||null,
    wander:G.wander||{got:[],gave:[],chit:0,shelf:[],hold:[]},cosm:G.cosm||null,locker:G.locker||null,boxes:G.boxes||[],
    mapMarks:G.mapMarks||[],rumours:G.rumours||[],
    beacon:G.beacon||null,shiftLog:G.shiftLog||null,freedLog:G.freedLog||[],coop:G.coop||null,
    loreFound:G.loreFound,loreMarks:G.loreMarks,settle:G.settle,tin:G.tin,
    scrip:G.scrip,scripRate:G.scripRate,scripLog:G.scripLog,
    doom:G.doom,doomDead:G.doomDead,parrot:G.parrot,heard:G.heard,grok:G.grok,flea:G.flea,matches:G.matches|0,smena:G.smena||[],
    dealsDone:G.dealsDone,dealsWait:G.dealsWait,log:G.log,
    rumLogged:G.rumLogged||"",   /* слухи станции уже записаны в тетрадь (11t): без этого после каждой загрузки они ложились снова */
    tableSeen:G.tableSeen|0,
    /* главный квест: возможности живут недолго, а память людей и тетрадь —
       навсегда. Закрытая дверь не восстанавливается ни временем, ни загрузкой */
    offers:G.offers,folk:G.folk,ledger:G.ledger,folkSay:G.folkSay,late:G.late,toldOff:G.toldOff|0,   /* M225, M230 */
    told:G.told,lastDig:G.lastDig,
    ts:Date.now()};
}
/* ══════════════ запись не имеет права убить полёт ══════════════
   30.08.2026 автор прислал журнал с поверхности: «Сбой кадра: Invalid string
   length · surface». Так падает JSON.stringify, когда результат длиннее
   предельной строки движка, — а зовётся он из кадра (autosave и rareTake).
   Значит, одно раздувшееся поле роняло не запись, а мир: сторож кадра
   (28-loop) ловит исключение и игра идёт дальше — но с этой секунды она
   НИЧЕГО НЕ ПИШЕТ и молчит об этом. Хуже этого нет ничего.

   Правило теперь такое: сохранение либо записывается целиком, либо без того
   куска, который сошёл с ума, — и в обоих случаях называет виновника
   вслух. Потерять один раздел всегда лучше, чем потерять полёт.

   Порог — не догадка: налётанный сейв на деве весит 23 КБ (замер 30.08.2026),
   самое тяжёлое в нём — лента самописца, 9 КБ, и она ограничена кольцом.
   Мегабайт — это уже не «много всего», это ошибка, и сказать о ней надо
   до того, как она станет смертельной. */
const SAVE_BUDGET=1000000;
let saveFatSaid="",saveCutSaid="";
/* кто именно весит: поле за полем, самые тяжёлые вперёд */
function saveWeigh(s){
  const rows=[];
  for(const k in s){
    let n=0;
    /* JSON.stringify(undefined) отдаёт undefined, а не строку: без этой
       проверки любое незаполненное поле весило «через край» и первым шло под
       нож вместо настоящего виновника (поймано тестом 91zzzzb) */
    try{const t=JSON.stringify(s[k]);n=(typeof t==="string")?t.length:0;}
    catch(e){n=Infinity;}
    rows.push([k,n]);
  }
  return rows.sort((a,b)=>b[1]-a[1]);
}
function saveTop(rows,n){
  return rows.slice(0,n||3).map(r=>r[0]+" "+
    (r[1]===Infinity?"через край":Math.round(r[1]/1024)+" КБ")).join(" · ");
}
/* Строка сохранения. Никогда не бросает: в худшем случае отдаёт запись
   без взбесившегося поля, в самом худшем — null. */
function saveText(){
  let s;
  try{s=snapshot();}
  catch(e){
    if(typeof logAdd==="function")logAdd("warn","Запись не собралась: "+((e&&e.message)||e));
    return null;
  }
  for(let pass=0;pass<4;pass++){
    let t=null;
    try{t=JSON.stringify(s);}catch(e){t=null;}
    if(t!==null){
      /* растёт — говорим один раз на каждый новый состав виновников,
         а не каждые десять секунд — строка в журнале не напоминание */
      if(t.length>SAVE_BUDGET){
        const top=saveTop(saveWeigh(s));
        if(saveFatSaid!==top){
          saveFatSaid=top;
          if(typeof logAdd==="function")
            logAdd("warn","Запись разбухла: "+Math.round(t.length/1024)+
              " КБ · тяжелее всего "+top);
        }
      }
      return t;
    }
    /* в строку не собралось: выбрасываем самое тяжёлое поле и пробуем снова */
    const rows=saveWeigh(s),bad=rows[0];
    if(!bad)return null;
    delete s[bad[0]];
    /* про один и тот же раздел — один раз. Автосейв идёт каждые десять
       секунд, и четыре одинаковые строки подряд автор увидел раньше, чем
       успел прочитать первую (скрин 30.08.2026, 23:23) */
    if(saveCutSaid!==bad[0]){
      saveCutSaid=bad[0];
      if(typeof logAdd==="function")
        logAdd("warn","Запись не влезла в строку: раздел «"+bad[0]+"» вынут · "+saveTop(rows));
      if(typeof say==="function")
        say("ЗАПИСЬ ПОЧИНЕНА\nраздел «"+bad[0]+"» разросся и вынут\nостальное записано",420);
    }
  }
  return null;
}
/* ══════════════ пустая карта возвращается из облака СПИСКОМ ══════════════
   Автор, 30.08.2026, второй заход: журнал сказал вслух то, чего не смог сказать
   первый раз — «раздел «poiSeen» вынут · poiSeen через край». Дальше уже видно
   всё.

   Облако — это PHP (site/api.php): `json_decode($raw, true)` превращает и
   объекты, и списки в один и тот же тип, а `json_encode` обратно печатает
   ПУСТУЮ карту как `[]`. То есть любой `{}` в снимке, слетав в облако и
   вернувшись, приезжает МАССИВОМ. Проверка `typeof x==="object"` его пропускает
   — массив тоже объект, — и G.poiSeen становится массивом.

   Дальше достаточно одного осмотра памятника. Ключ там — `q.seed`, а это
   `hashi(...)>>>0`, то есть беззнаковое 32-битное число: `arr[3000000000]=1`
   ставит массиву length в три миллиарда, и следующий же JSON.stringify честно
   печатает три миллиарда `null` — RangeError «Invalid string length» прямо в
   кадре. Оба сбоя автора (кристаллы 30.08 в 20:36, ускоритель в 23:23) шли
   ровно за строкой «Осмотр: …», и это не совпадение.

   Тише и хуже: у любой другой карты, приехавшей списком, строковые ключи
   ложатся мимо индексов, и JSON.stringify массива их НЕ ПЕЧАТАЕТ — рынок,
   репутация, шахты молча теряли записи после каждого входа с другого
   устройства. Поэтому лечим не один поиск, а все карты сразу и на входе. */
function asMap(v){
  if(!v||typeof v!=="object")return {};
  if(!Array.isArray(v))return v;
  const o={};
  for(const k in v)if(k!=="length")o[k]=v[k];   /* и индексы, и именованные */
  return o;
}
function applySave(s){
  if(!s||(s.v!==4&&s.v!==5))return false;
  G.sx=s.sx|0;G.sy=s.sy|0;G.sys=getSystem(G.sx,G.sy);
  G.uniqueShips=asMap(s.uniqueShips);
  G.tow=(s.tow&&typeof s.tow==="object")?s.tow:null;   /* корпус на тросе (M369b) */
  /* дела и люди (M374): без них четвёртый допуск и покупка корпуса теряют
     основание, поэтому они в сейве, а летопись — нет */
  G.episodes=Array.isArray(s.episodes)?s.episodes:[];
  G.notebook=Array.isArray(s.notebook)?s.notebook:[];
  G.gifts=(s.gifts&&typeof s.gifts==="object")?s.gifts:{};
  G.mslBy=(typeof s.mslBy==="string")?s.mslBy:"gt";
  G.bonds=s.bonds|0;G.bondHold=s.bondHold|0;G.coupN=(typeof s.coupN==="number")?s.coupN:-1;   /* заём и талон (M379) */
  /* письмо в трюме и последний обмен пленными (M386): это выбор игрока, значит
     оно живёт в сохранении, а всё остальное про дипломатию считается из летописи */
  G.letter=(s.letter&&typeof s.letter==="object")?s.letter:null;
  G.dipSwapN=(typeof s.dipSwapN==="number")?s.dipSwapN:undefined;
  /* чужой талон в баках (M387): клеймо живёт сутки и переживает выход из игры */
  G.smugN=(typeof s.smugN==="number")?s.smugN:undefined;
  G.smugBy=(typeof s.smugBy==="string")?s.smugBy:undefined;
  /* «Долгий Ход» и олимпиада (M388): собранные обрывки и своё время — это то,
     что игрок сделал сам, значит оно живёт в сейве, как книжная полка */
  G.longHod=Array.isArray(s.longHod)?s.longHod:[];
  /* зонды (M400): купленное знание о планете — это то, что игрок сделал */
  G.probed=(s.probed&&typeof s.probed==="object")?s.probed:{};
  G.race=(s.race&&typeof s.race==="object")?s.race:null;
  G.raceBest=s.raceBest|0||undefined;
  G.shipId=shipData(s.shipId)?s.shipId:"strizh";
  G.owned=Object.assign({strizh:true},s.owned||{});
  /* старое сохранение знает только s.mods — считаем, что всё купленное и установлено.
     Ёмкость (capOf) подобрана так, чтобы даже полностью прокачанные модули влезли. */
  for(const k in G.mods){
    G.modsOwned[k]=clamp(((s.modsOwned&&s.modsOwned[k])!=null?s.modsOwned[k]:(s.mods&&s.mods[k]))|0,0,4);
    G.mods[k]=clamp((s.mods&&s.mods[k])|0,0,G.modsOwned[k]);
  }
  partSeq=1;
  G.inv=(Array.isArray(s.inv)?s.inv:[]).map(unpackPart).filter(Boolean).slice(0,PART_MAX);
  for(const p of G.inv){const n=+String(p.id).slice(1);if(n>=partSeq)partSeq=n+1;}
  G.fit={};
  if(s.fit&&typeof s.fit==="object")
    for(const sid in s.fit){
      const src=s.fit[sid],dst={};
      if(!src||typeof src!=="object")continue;
      const slots=slotsOf(sid);
      for(const k in src){
        const p=partById(src[k]);
        if(p&&slots[k]===p.kind&&!Object.values(dst).includes(p.id))dst[k]=p.id;
      }
      G.fit[sid]=dst;
    }
  invalidateParts();
  G.partsBought=asMap(s.partsBought);
  G.tech=new Set(Array.isArray(s.tech)?s.tech.filter(k=>TECH[k]):[]);
  G.techLvl={};
  if(s.techLvl&&typeof s.techLvl==="object")
    for(const k in TECH)if(TECH[k].max)G.techLvl[k]=Math.max(0,s.techLvl[k]|0);
  G.barter=new Set(Array.isArray(s.barter)?s.barter.filter(k=>BARTER[k]):[]);
  G.found=new Set(Array.isArray(s.found)?s.found:[]);
  /* Реестр видов до M174 хранил имена видов, которых не существует: слово
     формы и слово признака выбирались независимо от того, что нарисовано, и
     каждый экземпляр записывался как отдельный вид. Такой реестр не переносится
     — со старого сохранения он обнуляется один раз, и дальше заполняется
     настоящими видами планет. Всё остальное в сохранении цело, формат прежний. */
  G.species=new Set(((s.bioV|0)>=2&&Array.isArray(s.species))?s.species:[]);
  Object.assign(G.opts,s.opts||{});
  G.zoom=clamp(+s.zoom||1,.16,2.4);
  G.market=asMap(s.market);
  /* фронт пиратов: разреженный объект по ключу "sx,sy", как всё привязанное
     к системе. Старые записи грузятся с пустым фронтом — он нарастёт сам */
  G.occ=asMap(s.occ);
  /* налёт часов по корпусам: старая запись приходит без него — корабль просто
     считается свежим, и это честнее, чем задним числом состарить его */
  G.wear=asMap(s.wear);
  G.seams=asMap(s.seams);
  /* свой маршрут: старые сохранения приходят без него — заводим пустой */
  G.trade=(s.trade&&Array.isArray(s.trade.legs))
    ?{legs:s.trade.legs.slice(0,ROUTE_MAX),loops:s.trade.loops|0,
      cursor:s.trade.cursor|0,sold:s.trade.sold|0,
      /* M289: заметки плеч, заработок и проданные дороги; запись до M289
         приходит без них — плечи допишут себе заметки со стола (routeNote) */
      notes:asMap(s.trade.notes),earned:+s.trade.earned||0,
      soldSets:Array.isArray(s.trade.soldSets)?s.trade.soldSets.filter(Array.isArray):[]}
    :routeInit();
  G.freed=s.freed|0;
  G.occCalm=asMap(s.occCalm);
  /* выработка шахт: только список выкопанных ячеек, порода выводится из seed */
  G.mines=asMap(s.mines);
  /* журнал дел: обещания игрока переживают перезаход */
  G.quests=Array.isArray(s.quests)?s.quests:[];
  /* найденные узлы и собранные венцы: в записи только номера */
  G.nodes=asMap(s.nodes);
  G.crowns=asMap(s.crowns);
  /* что стоит в держателе рубки: только настоящий и только свой узел */
  G.nodeShow=(typeof s.nodeShow==="string"&&G.nodes[s.nodeShow])?s.nodeShow:null;
  /* редкости: только список унесённых id (12m-rare) */
  G.rareFound=Array.isArray(s.rareFound)?s.rareFound.filter(x=>typeof x==="string"):[];
  /* пересказ (12p): слухи и метки — память о переменах, которые уже случились в
     состоянии мира, поэтому они переживают перезагрузку вместе с ним. Соперник
     хранится обязательно: иначе унесённая редкость потеряла бы адрес. */
  G.news=Array.isArray(s.news)?s.news.filter(n=>n&&typeof n==="object").slice(-NEWS_KEEP):[];
  G.newsMarks=asMap(s.newsMarks);
  G.newsT=+s.newsT||0;
  G.rivals={};
  if(s.rivals&&typeof s.rivals==="object")
    for(const id in s.rivals){
      const v=s.rivals[id];
      if(!v||typeof v!=="object"||typeof v.who!=="string"||!RARE_BY_ID[id])continue;
      if(G.rareFound.indexOf(id)>=0)continue;   /* уже у вас — соперника нет */
      G.rivals[id]={who:v.who,sx:v.sx|0,sy:v.sy|0,t:+v.t||Date.now()};
    }
  /* охотники (12o): счёт фракции к игроку — чистое следствие поступков, и
     мёртвый должен остаться мёртвым после перезагрузки */
  G.hunted={};
  if(s.hunted&&typeof s.hunted==="object")
    for(const k in s.hunted){
      const h=s.hunted[k];
      if(!h||typeof h!=="object"||typeof h.cap!=="string")continue;
      G.hunted[k]={cap:h.cap,seed:h.seed|0,tier:clamp(h.tier|0,0,HUNT_TIERS.length-1),
        made:+h.made||Date.now(),deeds:Math.max(0,h.deeds|0),
        dead:h.dead?1:0,paid:h.paid?1:0,seen:h.seen?1:0};
    }
  /* планета-узел (12n): решение игрока в ней есть — где он стоял, когда собрал
     сотню, — поэтому она персистится. Склад чинится по месту: список ресурсов
     перепроверяется по ходовым товарам, чтобы старая запись не завела редкое. */
  G.pnode=null;
  const pn=s.pnode;
  if(pn&&typeof pn==="object"&&typeof pn.key==="string"){
    const res=(Array.isArray(pn.res)?pn.res:[]).filter(k=>TRADE_KEYS.indexOf(k)>=0);
    const N={key:pn.key,sx:pn.sx|0,sy:pn.sy|0,idx:pn.idx|0,
      name:typeof pn.name==="string"?pn.name:"узел",
      res:res.length?res.slice(0,4):["iron"],stock:{},
      made:+pn.made||Date.now(),last:+pn.last||Date.now(),
      hauled:Math.max(0,pn.hauled|0),calls:Math.max(0,pn.calls|0)};
    if(pn.stock&&typeof pn.stock==="object")
      for(const k of N.res)N.stock[k]=clamp(+pn.stock[k]||0,0,PLANET_CAP);
    G.pnode=N;
  }
  /* посёлки (12t-settle): решения игрока в них есть — что и сколько он отдавал,
     поэтому они персистятся целиком. Чинится по месту: постройки сверяются с
     таблицей, склад и рацион — с ходовыми товарами, ступень пересчитывается по
     постройкам, а не берётся из записи, чтобы правка таблицы не оставляла
     посёлок на ступени, которой он больше не соответствует. */
  G.settle={};
  if(s.settle&&typeof s.settle==="object")for(const key in s.settle){
    const v=s.settle[key];
    if(!v||typeof v!=="object")continue;
    const built=(Array.isArray(v.built)?v.built:[]).filter(k=>!!SETTLE_BY_K[k]).slice(0,24);
    const S={seed:v.seed|0,sx:v.sx|0,sy:v.sy|0,idx:v.idx|0,
      name:typeof v.name==="string"?v.name:"",
      lean:SETTLE_BY_K[v.lean]?v.lean:SETTLE_BUILD[0].k,
      stage:built.length>=5?3:(built.length>=3?2:1),
      mood:clamp(+v.mood||0,0,100),fed:Math.max(0,+v.fed||0),
      stock:{},diet:{},built,
      made:+v.made||Date.now(),last:+v.last||Date.now(),
      asked:+v.asked||0,paid:Math.max(0,v.paid|0),raided:Math.max(0,v.raided|0),
      /* взят ли под руку (M198) — это РЕШЕНИЕ ИГРОКА, и оно необратимо, значит
         обязано пережить загрузку. Список полей здесь белый: не вписал — потерял
         молча, ровно как это уже случалось с полями управляющего */
      mine:v.mine?1:0,handAt:+v.handAt||0};
    for(const k of RES_KEYS){
      if(v.stock&&v.stock[k]>0)S.stock[k]=clamp(+v.stock[k],0,SETTLE_STOCK*(S.mine?HAND_STOCK:1));
      if(v.diet&&v.diet[k]>0)S.diet[k]=Math.max(0,+v.diet[k]);
    }
    G.settle[key]=S;
  }
  /* Жестянки (12ta-tin): решение игрока в них тоже есть — что он туда ссыпал и
     сколько лент снял. Чинится по месту: числа зажимаются, снятых записей не
     бывает больше, чем их есть в ленте, а зерно и место берутся из ключа —
     наряд и лента считаются из зерна заново и подделке не поддаются. */
  G.tin={};
  if(s.tin&&typeof s.tin==="object")for(const key in s.tin){
    const v=s.tin[key];
    if(!v||typeof v!=="object")continue;
    const A=tinAskOf(v.seed|0);
    G.tin[key]={seed:v.seed|0,sx:v.sx|0,sy:v.sy|0,idx:v.idx|0,
      name:typeof v.name==="string"?v.name:"",
      fed:clamp(+v.fed||0,0,A.need),run:clamp(+v.run||0,0,A.need),
      bin:clamp(+v.bin||0,0,TIN_BIN),seen:v.seen|0,
      read:clamp(v.read|0,0,TIN_LOG),
      last:+v.last||Date.now(),made:+v.made||Date.now()};
  }
  /* Грохотун (12tb-grok): в экипаж он не входит, поэтому и хранится отдельно —
     что он ест, где копает, сколько площадок закрыл и объяснял ли он уже глифы.
     Чинится по месту: чужое лакомство отбрасывается, состояние сводится к трём
     известным, а незакрытая копка без срока считается законченной — висеть
     вечно она не должна. */
  G.grok=null;
  if(s.grok&&typeof s.grok==="object"){
    const v=s.grok;
    const st=["idle","out","back"].indexOf(v.state)>=0?v.state:"idle";
    const dug={};
    if(v.dug&&typeof v.dug==="object")
      for(const k in v.dug)if(/^-?\d+,-?\d+$/.test(k))dug[k]=1;
    G.grok={want:GROK_LIKE.indexOf(v.want)>=0?v.want:null,
      state:st==="out"&&!(+v.due>Date.now())?"back":st,
      sx:v.sx|0,sy:v.sy|0,due:+v.due||0,
      took:Math.max(0,v.took|0),taught:v.taught?1:0,dug};
  }
  /* блошинец (12ua-flea): ряды считаются от seed станции и часов, поэтому в
     сохранении живёт только список купленного — иначе купленный лот вернулся бы
     на прилавок. Чинится по месту: чужие ключи отбрасываются, длина зажимается. */
  G.matches=Math.max(0,(typeof s.matches==='number'?s.matches:0)|0);   /* спички (12uc) */
  G.flea={got:[]};
  if(s.flea&&Array.isArray(s.flea.got))
    for(const id of s.flea.got)
      if(typeof id==="string"&&/^-?\d+:-?\d+:\d+:\d+$/.test(id)&&G.flea.got.length<FLEA_GOT)
        G.flea.got.push(id);
  /* боны домов (12u-scrip): это ставка игрока и курс, у которого записана
     причина, — значит, персистятся. Чинится по месту: чужие ключи домов
     отбрасываются, курс зажимается в свои границы, кошелёк и запас не уходят в
     минус, а строки журнала без причины выбрасываются — движение без причины
     здесь ошибка, а не мелочь. */
  G.scrip={};G.scripRate={};
  for(const H of HOUSES){
    const n=(s.scrip&&s.scrip[H.id])|0;
    if(n>0)G.scrip[H.id]=n;
    const r=s.scripRate&&+s.scripRate[H.id];
    G.scripRate[H.id]=r?clamp(Math.round(r),SCRIP_MIN,SCRIP_MAX):SCRIP_BASE;
  }
  G.scripLog=(Array.isArray(s.scripLog)?s.scripLog:[])
    .filter(e=>e&&HOUSE_BY_ID[e.id]&&e.why&&e.d).slice(-SCRIP_LOG);
  /* срок (12v-doom): решение игрока целиком — вывозить или нет, — поэтому
     персистится вместе с часом. Час хранится абсолютным: игра и так считает всё
     фоновое от Date.now(), и срок не должен останавливаться, пока не играют. */
  G.doom=null;
  if(s.doom&&typeof s.doom==="object"&&s.doom.key){
    const d=s.doom;
    G.doom={sx:d.sx|0,sy:d.sy|0,key:String(d.key),at:+d.at||Date.now(),
      known:!!d.known,folk:Math.max(0,d.folk|0),lifted:Math.max(0,d.lifted|0),
      landed:Math.max(0,d.landed|0),lost:Math.max(0,d.lost|0),
      to:(d.to&&typeof d.to==="object")?{sx:d.to.sx|0,sy:d.to.sy|0}:null,
      over:!!d.over,warned:Array.isArray(d.warned)?d.warned.filter(x=>+x>0):[]};
  }
  G.doomDead=asMap(s.doomDead);
  /* трепло (12x-parrot): сама птица и то, что она помнит. Строки чинятся по
     месту — вид обязателен, слова обязаны быть номерами: строка без события
     здесь такая же ложь, как перк без кода, и загрузка её не заводит. */
  G.parrot=(s.parrot&&typeof s.parrot==="object"&&s.parrot.name)?{
    seed:s.parrot.seed>>>0,name:String(s.parrot.name).slice(0,24),
    who:String(s.parrot.who||"").slice(0,48),
    since:+s.parrot.since||Date.now(),said:Math.max(0,s.parrot.said|0)}:null;
  G.heard=(Array.isArray(s.heard)?s.heard:[])
    .filter(h=>h&&(h.kind==="price"||h.kind==="pidgin"||h.kind==="yours"))
    .map(h=>({t:+h.t||Date.now(),kind:h.kind,sx:h.sx|0,sy:h.sy|0,
      note:String(h.note||"").slice(0,64),
      words:Array.isArray(h.words)?h.words.map(x=>x|0):null,
      read:!!h.read,used:!!h.used}))
    .filter(h=>h.kind!=="pidgin"||(h.words&&h.words.length))
    .slice(-HEARD_MAX);
  /* отчёт «Долгого Хода» (12q-lore): формат сейва не менялся (v:4), старые
     записи просто не имеют этих полей и начинают с пустого */
  G.loreFound=Array.isArray(s.loreFound)?s.loreFound.filter(x=>typeof x==="string"):[];
  G.loreMarks=Array.isArray(s.loreMarks)?s.loreMarks.filter(m=>m&&typeof m==="object"):[];
  /* дела кантины: отвеченные и те, чей исход ещё не пришёл */
  G.dealsDone=asMap(s.dealsDone);
  G.rumLogged=typeof s.rumLogged==="string"?s.rumLogged:"";
  G.dealsWait=Array.isArray(s.dealsWait)?s.dealsWait:[];
  /* репутация: своя у каждой станции, только от поступков */
  G.rep=asMap(s.rep);
  /* осмотренные памятники: помнятся, чтобы не ходить к ним дважды */
  G.poiSeen=asMap(s.poiSeen);
  /* осмотренные находки в пустоте: только то, что игрок забрал (17b) */
  G.findsSeen=asMap(s.findsSeen);
  /* обломки барж: разреженный оверлей по "sx,sy", каждый — список остовов.
     Новое поле с безопасным дефолтом (сквозное правило). */
  G.fleetLog=(s.fleetLog&&typeof s.fleetLog==="object")?s.fleetLog:{};
  G.fleetEscort=+s.fleetEscort||0;
  G.caravan=(s.caravan&&typeof s.caravan==="object")?s.caravan:null;
  /* «Сорока» (12v, M342): что купили, что отдали, письмо вдогонку — положение из часов */
  {const w=(s.wander&&typeof s.wander==="object")?s.wander:{};const arr=v=>Array.isArray(v)?v.slice():[];
   G.wander={got:arr(w.got),gave:arr(w.gave),chit:w.chit|0,shelf:arr(w.shelf).slice(0,6),hold:arr(w.hold),
             soldE:w.soldE|0,soldN:w.soldN|0,been:w.been?1:0};}
  /* косметика «Сороки» (M344): своё и что надето; чужой id снимается молча */
  {const c=(s.cosm&&typeof s.cosm==="object")?s.cosm:{};const owned=Array.isArray(c.owned)?c.owned.slice():[];
   G.cosm={owned};for(const k of ["exhaust","trail","suit","visor","mark","lights","chime"])G.cosm[k]=(typeof c[k]==="string"&&owned.indexOf(c[k])>=0)?c[k]:null;}
  G.boxes=Array.isArray(s.boxes)?s.boxes.filter(id=>typeof id==="number"):[];   /* коробки (M346) */
  /* карта адресами (M347): спички на клетках и области слухов */
  G.mapMarks=Array.isArray(s.mapMarks)?s.mapMarks.filter(m=>m&&typeof m.sx==="number"&&typeof m.sy==="number").slice(0,10):[];
  G.rumours=Array.isArray(s.rumours)?s.rumours.filter(r=>r&&typeof r.sx==="number").slice(-12):[];
  /* маяк (M349): сводки, сдача за смену, очищенные сектора */
  G.beacon=(s.beacon&&typeof s.beacon==="object"&&Array.isArray(s.beacon.log))?{shift:(typeof s.beacon.shift==="number")?s.beacon.shift:null,log:s.beacon.log.slice(-6),saidOff:s.beacon.saidOff?1:0}:null;
  G.shiftLog=(s.shiftLog&&typeof s.shiftLog==="object"&&s.shiftLog.sold)?s.shiftLog:null;
  G.freedLog=Array.isArray(s.freedLog)?s.freedLog.slice(-12):[];
  /* кооператив (12aj, M351): имя, патрон, оборот на записи, дух, просьбы */
  {const c=(s.coop&&typeof s.coop==="object"&&typeof s.coop.name==="string"&&s.coop.name)?s.coop:null;
   G.coop=c?{name:c.name.slice(0,24),house:c.house||"lask",since:c.since|0,sold0:c.sold0|0,spirit:clamp(c.spirit|0,0,5),
             wants:Array.isArray(c.wants)?c.wants:[],done:Array.isArray(c.done)?c.done:[],ledger:(c.ledger&&typeof c.ledger==="object")?c.ledger:{},
             shift:c.shift|0,visit:{key:"",bought:{}},dayoff:c.dayoff||null,captured:c.captured|0}:null;}
  /* ящик конторы (12ak, M345): части упакованы, кучи числом, час последнего визита */
  {const l=(s.locker&&typeof s.locker==="object")?s.locker:null;
   G.locker=l?{items:Array.isArray(l.items)?l.items.filter(it=>it&&(it.p||it.tool)):[],
               res:(l.res&&typeof l.res==="object")?l.res:{},t:(typeof l.t==="number")?l.t:Date.now()}:null;}
  G.wrecks={};
  if(s.wrecks&&typeof s.wrecks==="object")
    for(const k in s.wrecks){
      const arr=s.wrecks[k];if(!Array.isArray(arr))continue;
      G.wrecks[k]=arr.filter(w=>w&&typeof w==="object").slice(0,12).map(w=>({
        seed:w.seed|0,x:+w.x||0,y:+w.y||0,tier:clamp(w.tier|0,0,3),seen:w.seen?1:0,
        good:(w.good&&RES[w.good])?w.good:null,name:String(w.name||"баржа")}));
    }
  /* пассажиры спасённых барж, ждущие в звене — решение игрока, персистятся */
  G.bargePax=(Array.isArray(s.bargePax)?s.bargePax:[]).filter(p=>p&&CREW_SPEC[p.spec])
    .slice(0,8).map(p=>({id:String(p.id||("bp"+(p.seed|0))),seed:p.seed|0,
    name:String(p.name||"Пассажир"),spec:p.spec,
    traits:(Array.isArray(p.traits)?p.traits:[]).filter(t=>CREW_TRAITS.some(x=>x.id===t)),
    xp:Math.max(0,p.xp|0),fee:Math.max(0,p.fee|0),story:String(p.story||"")}));
  G.drones=Array.isArray(s.drones)?s.drones:[];
  G.droneInventory=Math.max(0,s.droneInventory|0);
  G.droneSold={};if(s.droneSold&&typeof s.droneSold==='object')for(const k in s.droneSold)if(/^-?\d+,-?\d+$/.test(k))G.droneSold[k]=s.droneSold[k]|0;   /* M350 */
  /* номера бортов живут отдельно от самих машин: дрон в трюме своего номера
     не теряет (M237). Старая запись их не знает — список пуст, номера выдаст
     первая же покупка. */
  G.droneIds=Array.isArray(s.droneIds)?s.droneIds.map(n=>n|0):[];
  /* записи до M237 знают четыре поля: круг, номер и часы дописываются здесь */
  if(typeof droneNormalize==="function"){const nw=Date.now();for(const d of G.drones)droneNormalize(d,nw);}
  /* новое поле с безопасным дефолтом: старые записи грузятся как «экипажа нет».
     Момент последнего начисления подтягиваем к текущему времени, иначе после
     долгого перерыва зарплата и добыча начислились бы задним числом дважды. */
  G.crew=(Array.isArray(s.crew)?s.crew:[]).filter(c=>c&&c.spec&&CREW_SPEC[c.spec]).map(c=>({
    id:String(c.id||("c"+(c.seed|0))),seed:c.seed|0,name:String(c.name||"Безымянный"),askExp:c.askExp|0,
    spec:c.spec,traits:(Array.isArray(c.traits)?c.traits:[]).filter(t=>CREW_TRAITS.some(x=>x.id===t)),
    xp:Math.max(0,+c.xp||0),shipId:(c.shipId&&G.owned[c.shipId])?c.shipId:null,
    order:(c.order&&ORDERS[c.order.kind])
          ?{kind:c.order.kind,sx:c.order.sx|0,sy:c.order.sy|0,idx:c.order.idx|0}
          :{kind:"home",sx:G.sx,sy:G.sy},
    role:BASE_ROLES[c.role]?c.role:"driller",
    hull:Math.max(0,+c.hull||0),hullMax:Math.max(1,+c.hullMax||100),
    cargo:(c.cargo&&typeof c.cargo==="object")?c.cargo:{},
    debt:Math.max(0,c.debt|0),morale:clamp(+c.morale||1,0,1),fee:Math.max(0,c.fee|0),
    /* новые поля — с безопасными дефолтами, формат записи не меняется */
    pref:(c.pref&&(c.pref==="all"||RES[c.pref]))?c.pref:"all",
    mods:(c.mods&&typeof c.mods==="object")
         ?{hold:c.mods.hold|0,armor:c.mods.armor|0,drill:c.mods.drill|0}:{},
    earned:Math.max(0,c.earned|0),spent:Math.max(0,c.spent|0),
    /* рейсы, скрытая удача и события: сама удача не сохраняется — она выводится
       из seed, поэтому у одного и того же человека всегда одна и та же */
    risk:(c.risk==="safe"||c.risk==="bold")?c.risk:"norm",
    /* простой переживает загрузку: иначе напоминание «сидит без дела»
       приходило бы заново при каждом входе в игру (12a-crew, crewTick) */
    idleMs:Math.max(0,+c.idleMs||0),idleSaid:c.idleSaid?1:0,
    trips:Math.max(0,c.trips|0),tripMin:Math.max(0,+c.tripMin||0),
    hist:Array.isArray(c.hist)?c.hist.slice(0,12).map(h=>({cat:String(h.cat||""),
      id:String(h.id||""),ru:String(h.ru||""),t:+h.t||0})):[],
    state:(c.state==="hostage"||c.state==="away")?c.state:null,
    stateUntil:+c.stateUntil||0,hangover:c.hangover?1:0,
    ransom:Math.max(0,c.ransom|0),ransomBase:Math.max(0,c.ransomBase|0),
    ransomAt:+c.ransomAt||0,ransomSx:c.ransomSx|0,ransomSy:c.ransomSy|0,
    /* баржа (M294): плечи, курсор, отметка смены, скормлено, имя */
    barge:(c.barge&&Array.isArray(c.barge.legs))
      ?{legs:c.barge.legs.filter(k=>typeof k==="string").slice(0,ROUTE_MAX),cursor:c.barge.cursor|0,
        t0:+c.barge.t0||Date.now(),fed:c.barge.fed|0,name:String(c.barge.name||"")}
      :null,
    tMs:Date.now(),paidMs:Date.now()
  })).slice(0,8);
  G.allies=[];
  /* управляющие: новое поле с безопасным дефолтом, формат записи прежний.
     Портрет не сохраняется — он выводится из seed и всегда тот же самый. */
  G.mgrs=(Array.isArray(s.mgrs)?s.mgrs:[]).filter(m=>m&&MGR_ROLES[m.role]).map(m=>({
    id:String(m.id||("m"+(m.seed|0))),seed:m.seed|0,name:String(m.name||"—"),
    role:m.role,
    traits:(Array.isArray(m.traits)?m.traits:[]).filter(t=>MGR_TRAITS.some(x=>x.id===t)).slice(0,3),
    xp:Math.max(0,+m.xp||0),lv0:clamp(m.lv0|0||1,1,6),
    perks:(Array.isArray(m.perks)?m.perks:[]).filter(p=>mgrPerkList(m.role).some(x=>x.id===p)).slice(0,6),
    rules:(Array.isArray(m.rules)?m.rules:[]).filter(x=>MGR_RULES[m.role].some(r=>r.id===x)).slice(0,6),
    loy:clamp(+m.loy||0,0,100),fee:Math.max(0,m.fee|0),
    /* ядро: у него вместо лояльности дрейф, и он тоже переживает загрузку */
    ai:m.ai?1:0,drift:clamp(+m.drift||0,0,100),stageRu:String(m.stageRu||""),
    shipId:(m.shipId&&G.owned[m.shipId])?m.shipId:null,
    route:(Array.isArray(m.route)?m.route:[]).filter(x=>typeof x==="string").slice(0,4),
    earned:Math.max(0,m.earned|0),spent:Math.max(0,m.spent|0),
    tookCr:Math.max(0,m.tookCr|0),stole:Math.max(0,m.stole|0),
    gotData:Math.max(0,m.gotData|0),prog:Math.max(0,+m.prog||0),
    gift:Math.max(0,m.gift|0),slotBonus:Math.max(0,m.slotBonus|0),
    quietLever:m.quietLever?1:0,jobsDone:Math.max(0,m.jobsDone|0),
    /* надетый артефакт — часть решения игрока, а не эфемерное состояние.
       Список полей здесь белый, поэтому новое поле надо вносить явно,
       иначе оно молча теряется при каждой загрузке. */
    relic:(m.relic&&ARTIFACTS[m.relic])?m.relic:null,
    cutBonus:+m.cutBonus||0,ultCount:Math.max(0,m.ultCount|0),pool:Math.max(0,+m.pool||0),
    jobPast:(Array.isArray(m.jobPast)?m.jobPast:[]).filter(x=>jobDef(x)).slice(0,20),
    /* поручение переживает загрузку, но срок идёт заново: счётчики-маркеры
       (убитые пираты, выручка, вмешательства в приказы) живут только в сессии */
    job:(m.job&&jobDef(m.job.id))?{id:m.job.id,t0:Date.now(),
      mins:Math.max(0,+m.job.mins||0),offer:m.job.offer?1:0,
      pick:m.job.pick|0,hold:m.job.hold?1:0,mark:0}:null,
    log:Array.isArray(m.log)?m.log.slice(0,8).map(e=>({t:+e.t||0,k:String(e.k||""),s:String(e.s||"")})):[],
    tMs:Date.now()
  })).slice(0,MGR_CAP);
  /* один домен — один управляющий: если запись пришла битой, лишних отбрасываем */
  const seen={};
  G.mgrs=G.mgrs.filter(m=>seen[m.role]?false:(seen[m.role]=1));
  G.aiRift=(s.aiRift&&typeof s.aiRift==="object")?{sx:s.aiRift.sx|0,sy:s.aiRift.sy|0,
    name:String(s.aiRift.name||""),t:+s.aiRift.t||0}:null;
  /* ренегаты и изгнанники — решения игрока, а не производная от seed: сохраняем.
     Роль сверяется с таблицей, иначе битая запись уронила бы бой и кантину. */
  G.rogues=Array.isArray(s.rogues)?s.rogues.filter(R=>R&&MGR_ROLES[R.role]).slice(0,ROGUE_CAP):[];
  G.exiles=Array.isArray(s.exiles)?s.exiles.filter(E=>E&&MGR_ROLES[E.role]).slice(0,ROGUE_CAP):[];
  /* вторая половина загрузки — в 14a1 (M415): порядок сохранён, шов там,
     где ни одна локальная не переходит границу */
  return applySaveRest(s);
}
