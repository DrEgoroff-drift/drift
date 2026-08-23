/* ══════════════ сохранение ══════════════ */
/* Облако включается не настройкой, а входом: заглавная страница кладёт токен в
   localStorage того же домена, игра его просто видит. Открытая с диска игра
   (file://) остаётся полностью локальной — сервера рядом нет и быть не должно. */
const CLOUD={api:"/api.php",tkey:"drift_token",lkey:"drift_login"};
const SAVE_KEY="drift_save_v4";
let STORAGE_OK=true, lastSave=0;
function stGet(k){try{return localStorage.getItem(k);}catch(e){STORAGE_OK=false;return null;}}
function stSet(k,v){try{localStorage.setItem(k,v);return true;}catch(e){STORAGE_OK=false;return false;}}
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
  return {v:4,sx:G.sx,sy:G.sy,shipId:G.shipId,owned:G.owned,
    x:G.ship.x,y:G.ship.y,a:G.ship.a,fuel:G.fuel,hull:G.hull,
    cargo:G.cargo,credits:G.credits,data:G.data,mods:G.mods,modsOwned:G.modsOwned,
    inv:G.inv.map(packPart),fit:G.fit,partsBought:prunePartsBought(),
    tech:[...G.tech],techLvl:G.techLvl,barter:[...G.barter],found:[...G.found],species:[...G.species],
    opts:G.opts,zoom:G.zoom,market:G.market,uniqueShips:G.uniqueShips,
    drones:G.drones,droneInventory:G.droneInventory,crew:G.crew,bases:G.bases,
    mgrs:G.mgrs,blueprints:G.blueprints,aiRift:G.aiRift,rogues:G.rogues,exiles:G.exiles,
    relics:G.relics,relicHint:G.relicHint,bio:G.bio,home:G.home,
    occ:G.occ,freed:G.freed,occCalm:G.occCalm,trade:G.trade,wear:G.wear,
    instrKit:G.instrKit,instrShelf:G.instrShelf,
    speech:G.speech,visits:G.visits,strips:G.strips,
    seen:G.seen,storyPin:G.storyPin,storyFlags:G.storyFlags,place:G.place,odo:G.odo,post:G.post,mirror:G.mirror,lights:G.lights,
    tape:(typeof tapePack==="function")?tapePack():null,tapeLong:G.tapeLong|0,
    fuseGen:G.fuseGen,mines:G.mines,quests:G.quests,rep:G.rep,poiSeen:G.poiSeen,findsSeen:G.findsSeen,
    nodes:G.nodes,crowns:G.crowns,nodeShow:G.nodeShow,rareFound:G.rareFound,pnode:G.pnode,hunted:G.hunted,
    news:G.news,newsMarks:G.newsMarks,newsT:G.newsT,rivals:G.rivals,
    wrecks:G.wrecks,bargePax:G.bargePax,
    loreFound:G.loreFound,loreMarks:G.loreMarks,settle:G.settle,tin:G.tin,
    scrip:G.scrip,scripRate:G.scripRate,scripLog:G.scripLog,
    doom:G.doom,doomDead:G.doomDead,parrot:G.parrot,heard:G.heard,grok:G.grok,flea:G.flea,
    dealsDone:G.dealsDone,dealsWait:G.dealsWait,log:G.log,ts:Date.now()};
}
function applySave(s){
  if(!s||s.v!==4)return false;
  G.sx=s.sx|0;G.sy=s.sy|0;G.sys=getSystem(G.sx,G.sy);
  G.uniqueShips=(s.uniqueShips&&typeof s.uniqueShips==="object")?s.uniqueShips:{};
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
  G.partsBought=(s.partsBought&&typeof s.partsBought==="object")?s.partsBought:{};
  G.tech=new Set(Array.isArray(s.tech)?s.tech.filter(k=>TECH[k]):[]);
  G.techLvl={};
  if(s.techLvl&&typeof s.techLvl==="object")
    for(const k in TECH)if(TECH[k].max)G.techLvl[k]=Math.max(0,s.techLvl[k]|0);
  G.barter=new Set(Array.isArray(s.barter)?s.barter.filter(k=>BARTER[k]):[]);
  G.found=new Set(s.found||[]);G.species=new Set(s.species||[]);
  Object.assign(G.opts,s.opts||{});
  G.zoom=clamp(s.zoom||1,.16,2.4);
  G.market=(s.market&&typeof s.market==="object")?s.market:{};
  /* фронт пиратов: разреженный объект по ключу "sx,sy", как всё привязанное
     к системе. Старые записи грузятся с пустым фронтом — он нарастёт сам */
  G.occ=(s.occ&&typeof s.occ==="object")?s.occ:{};
  /* налёт часов по корпусам: старая запись приходит без него — корабль просто
     считается свежим, и это честнее, чем задним числом состарить его */
  G.wear=(s.wear&&typeof s.wear==="object")?s.wear:{};
  /* свой маршрут: старые сохранения приходят без него — заводим пустой */
  G.trade=(s.trade&&Array.isArray(s.trade.legs))
    ?{legs:s.trade.legs.slice(0,ROUTE_MAX),loops:s.trade.loops|0,
      cursor:s.trade.cursor|0,sold:s.trade.sold|0}
    :routeInit();
  G.freed=s.freed|0;
  G.occCalm=(s.occCalm&&typeof s.occCalm==="object")?s.occCalm:{};
  /* выработка шахт: только список выкопанных ячеек, порода выводится из seed */
  G.mines=(s.mines&&typeof s.mines==="object")?s.mines:{};
  /* журнал дел: обещания игрока переживают перезаход */
  G.quests=Array.isArray(s.quests)?s.quests:[];
  /* найденные узлы и собранные венцы: в записи только номера */
  G.nodes=(s.nodes&&typeof s.nodes==="object")?s.nodes:{};
  G.crowns=(s.crowns&&typeof s.crowns==="object")?s.crowns:{};
  /* что стоит в держателе рубки: только настоящий и только свой узел */
  G.nodeShow=(typeof s.nodeShow==="string"&&G.nodes[s.nodeShow])?s.nodeShow:null;
  /* редкости: только список унесённых id (12m-rare) */
  G.rareFound=Array.isArray(s.rareFound)?s.rareFound.filter(x=>typeof x==="string"):[];
  /* пересказ (12p): слухи и метки — память о переменах, которые уже случились в
     состоянии мира, поэтому они переживают перезагрузку вместе с ним. Соперник
     хранится обязательно: иначе унесённая редкость потеряла бы адрес. */
  G.news=Array.isArray(s.news)?s.news.filter(n=>n&&typeof n==="object").slice(-NEWS_KEEP):[];
  G.newsMarks=(s.newsMarks&&typeof s.newsMarks==="object")?s.newsMarks:{};
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
      asked:+v.asked||0,paid:Math.max(0,v.paid|0),raided:Math.max(0,v.raided|0)};
    for(const k of RES_KEYS){
      if(v.stock&&v.stock[k]>0)S.stock[k]=clamp(+v.stock[k],0,SETTLE_STOCK);
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
  G.doomDead=(s.doomDead&&typeof s.doomDead==="object")?s.doomDead:{};
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
  G.dealsDone=(s.dealsDone&&typeof s.dealsDone==="object")?s.dealsDone:{};
  G.dealsWait=Array.isArray(s.dealsWait)?s.dealsWait:[];
  /* репутация: своя у каждой станции, только от поступков */
  G.rep=(s.rep&&typeof s.rep==="object")?s.rep:{};
  /* осмотренные памятники: помнятся, чтобы не ходить к ним дважды */
  G.poiSeen=(s.poiSeen&&typeof s.poiSeen==="object")?s.poiSeen:{};
  /* осмотренные находки в пустоте: только то, что игрок забрал (17b) */
  G.findsSeen=(s.findsSeen&&typeof s.findsSeen==="object")?s.findsSeen:{};
  /* обломки барж: разреженный оверлей по "sx,sy", каждый — список остовов.
     Новое поле с безопасным дефолтом (сквозное правило). */
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
  /* новое поле с безопасным дефолтом: старые записи грузятся как «экипажа нет».
     Момент последнего начисления подтягиваем к текущему времени, иначе после
     долгого перерыва зарплата и добыча начислились бы задним числом дважды. */
  G.crew=(Array.isArray(s.crew)?s.crew:[]).filter(c=>c&&c.spec&&CREW_SPEC[c.spec]).map(c=>({
    id:String(c.id||("c"+(c.seed|0))),seed:c.seed|0,name:String(c.name||"Безымянный"),
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
    trips:Math.max(0,c.trips|0),tripMin:Math.max(0,+c.tripMin||0),
    hist:Array.isArray(c.hist)?c.hist.slice(0,12).map(h=>({cat:String(h.cat||""),
      id:String(h.id||""),ru:String(h.ru||""),t:+h.t||0})):[],
    state:(c.state==="hostage"||c.state==="away")?c.state:null,
    stateUntil:+c.stateUntil||0,hangover:c.hangover?1:0,
    ransom:Math.max(0,c.ransom|0),ransomBase:Math.max(0,c.ransomBase|0),
    ransomAt:+c.ransomAt||0,ransomSx:c.ransomSx|0,ransomSy:c.ransomSy|0,
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
    cutBonus:+m.cutBonus||0,ultCount:Math.max(0,m.ultCount|0),
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
  /* артефакты: только те, что есть в таблице — иначе битая запись пролезла бы
     в слот и в глобальный эффект */
  G.relics={};
  if(s.relics&&typeof s.relics==="object")
    for(const k in s.relics)if(ARTIFACTS[k]&&s.relics[k])G.relics[k]=1;
  G.relicHint=(s.relicHint&&typeof s.relicHint==="object")
    ?{sx:s.relicHint.sx|0,sy:s.relicHint.sy|0}:null;
  G.bio=+s.bio||0;
  /* дом: безопасный дефолт, поля проверяются поимённо — записи старых версий
     грузятся без дома и заводят его при первой же выручке */
  if(s.home&&typeof s.home==="object"){
    const h=homeInit();
    h.turn=Math.max(0,+s.home.turn||0);
    h.tier=clamp(s.home.tier|0,0,HOME_TIERS.length);
    h.sx=s.home.sx|0;h.sy=s.home.sy|0;h.made=+s.home.made||0;
    h.garage=Array.isArray(s.home.garage)?s.home.garage.filter(id=>!!shipData(id)):[];
    if(s.home.showcase&&typeof s.home.showcase==="object")
      for(const k of RES_KEYS)if(s.home.showcase[k]>0)h.showcase[k]=+s.home.showcase[k];
    h.trophies=Array.isArray(s.home.trophies)?s.home.trophies.slice(0,64):[];
    /* домочадец говорил на этой ступени — иначе перезагрузка сделала бы из него
       кран с частями (12j) */
    h.mateTier=clamp(s.home.mateTier|0,0,HOME_TIERS.length);
    G.home=h;
  }else G.home=null;
  /* надетый артефакт должен быть найденным и ровно у одного владельца */
  {
    const worn={};
    for(const m of G.mgrs){
      if(!m.relic)continue;
      if(!G.relics[m.relic]||worn[m.relic])m.relic=null;
      else worn[m.relic]=1;
    }
  }
  G.blueprints={};
  if(s.blueprints&&typeof s.blueprints==="object")
    for(const k in s.blueprints)if(BLUEPRINTS[k])G.blueprints[k]=s.blueprints[k]>0?1:-1;
  /* базы: тоже новое поле с безопасным дефолтом. Отсчёт ленивого времени
     подтягиваем к загрузке, иначе простой начислится задним числом. */
  G.bases={};
  if(s.bases&&typeof s.bases==="object")
    for(const k in s.bases){
      const b=s.bases[k];
      if(!b||!Array.isArray(b.cells))continue;
      /* число рядов у базы своё: «второй ярус» смотрителя вскрывает пятый
         и остаётся у неё навсегда, поэтому длина массива больше не константа */
      const rows=clamp(b.rows|0,BASE_ROWS,BASE_ROWS_DEEP)||BASE_ROWS;
      const cells=[];
      for(let i=0;i<BASE_COLS*rows;i++){
        const c=b.cells[i];
        cells.push(c&&BUILD[c.k]?{k:c.k,hp:clamp(+c.hp||1,0,1)}:null);
      }
      G.bases[k]={sx:b.sx|0,sy:b.sy|0,idx:b.idx|0,name:String(b.name||"База"),
        type:String(b.type||"rocky"),res:Array.isArray(b.res)?b.res.filter(x=>RES[x]):["iron"],
        rows,cells,pool:(b.pool&&typeof b.pool==="object")?b.pool:{},
        tMs:Date.now(),built:+b.built||Date.now()};
    }
  G.base=null;
  G.fuseGen=Math.max(0,s.fuseGen|0);
  /* приборы (M127): решение игрока, поэтому персистятся. Старая запись их не
     знает — тогда на корабле стоит казённый набор, как с верфи */
  G.instrKit=(s.instrKit&&typeof s.instrKit==="object")?s.instrKit:null;
  G.instrShelf=Array.isArray(s.instrShelf)?s.instrShelf.slice(0,8):[];
  G.tape=(typeof tapeUnpack==="function")?tapeUnpack(s.tape):null;
  G.tapeLong=s.tapeLong|0;
  /* речь (M128): очередь реплик по местам, счётчик посадок и оторванные ленты —
     всё это память об игроке, а не о мире, и поэтому персистится */
  G.speech=(s.speech&&typeof s.speech==="object")?s.speech:{};
  G.visits=(s.visits&&typeof s.visits==="object")?s.visits:{};
  /* истории (11c): только то, что игрок видел, якоря и повороты */
  G.seen=(s.seen&&typeof s.seen==="object")?s.seen:{};
  G.storyPin=(s.storyPin&&typeof s.storyPin==="object")?s.storyPin:{};
  G.storyFlags=(s.storyFlags&&typeof s.storyFlags==="object")?s.storyFlags:{};
  /* память места и одометр (11d): объекты с дефолтами, формат v:4 не менялся */
  G.place={};
  if(s.place&&typeof s.place==="object")for(const k in s.place){
    const p=s.place[k];if(!p||typeof p!=="object")continue;
    G.place[k]={f:Math.max(0,p.f|0),l:Math.max(0,p.l|0),n:Math.max(0,p.n|0),
      take:Math.max(0,p.take|0),hurt:Math.max(0,p.hurt|0),care:Math.max(0,p.care|0)};
  }
  G.odo={lands:Math.max(0,(s.odo&&s.odo.lands)|0),jumps:Math.max(0,(s.odo&&s.odo.jumps)|0)};
  G.mirror={bearing:(s.mirror&&s.mirror.bearing)?1:0};   /* зеркало (11f) */
  /* три света (11g): день первого прихода в ядро и были ли внутри */
  G.lights={t0:(s.lights&&s.lights.t0!=null)?Math.max(-1,s.lights.t0|0):-1,seen:clamp((s.lights&&s.lights.seen)|0,0,2)};
  /* почтовый круг (11e): три числа */
  G.post={stage:clamp((s.post&&s.post.stage)|0,0,POST_LINKS.length-1),opened:(s.post&&s.post.opened)?1:0,done:(s.post&&s.post.done)?1:0};
  G.strips=Array.isArray(s.strips)?s.strips.slice(0,8):[];
  G.log=Array.isArray(s.log)
    ? s.log.filter(e=>e&&typeof e.s==="string").slice(-LOG_MAX).map(e=>({t:+e.t||Date.now(),k:String(e.k||""),s:e.s}))
    : [];
  G.logNew=0;
  G.credits=Math.max(0,s.credits|0);G.data=Math.max(0,s.data|0);
  for(const k of RES_KEYS)G.cargo[k]=Math.max(0,(s.cargo&&s.cargo[k])|0);
  const st=stat();
  G.fuel=clamp(+s.fuel||0,0,st.fuelMax);
  G.hull=clamp(+s.hull||st.hullMax,1,st.hullMax);
  G.shield=st.shieldMax;G.loot=[];   // щит и лут в системе — эфемерные, не персистятся
  /* курс из старых записей мог накопить десятки оборотов — чиним на входе,
     иначе испорченное сохранение чинит себя только после полного разворота */
  G.ship.x=+s.x||0;G.ship.y=+s.y||-760;G.ship.a=angWrap(+s.a||0);
  G.ship.vx=0;G.ship.vy=0;G.ship.av=0;G.ship.bank=0;
  G.mode="system";G.ap=null;G.land=null;G.surf=null;G.belt=null;G.st=null;G.dig=null;G.cave=null;
  if(!G.opts.keys||typeof G.opts.keys!=="object")G.opts.keys={main:{},belt:{}};
  if(!G.opts.keys.main)G.opts.keys.main={};if(!G.opts.keys.belt)G.opts.keys.belt={};
  if(!G.opts.pads)G.opts.pads="auto";if(!G.opts.padSize)G.opts.padSize=1;
  if(!G.opts.gfx||typeof G.opts.gfx!=="object")G.opts.gfx={draw:1,detail:1,particles:1,plants:1,fps:0};
  for(const k of["draw","detail","particles","plants"])if(!G.opts.gfx[k])G.opts.gfx[k]=1;
  /* потолок кадров: 0 — без потолка. Ноль тут законное значение, поэтому
     проверка на «пусто» ему не годится, нужна проверка на «не из списка». */
  if(![0,30,60].includes(G.opts.gfx.fps))G.opts.gfx.fps=0;
  if(![0,1,1.5,2].includes(G.opts.gfx.res))G.opts.gfx.res=0;
  resize();
  if(!G.opts.audio||typeof G.opts.audio!=="object")G.opts.audio={on:true,music:.6,sfx:.6,engine:.4};
  if(typeof G.opts.audio.music!=="number")G.opts.audio.music=.6;
  if(typeof G.opts.audio.sfx!=="number")G.opts.audio.sfx=.6;
  if(typeof G.opts.audio.engine!=="number")G.opts.audio.engine=.4;
  invalidateKeyMap();applyPadMode();applyPadSize();applyVolumes();
  return true;
}
function saveGame(quiet){
  const ok=stSet(SAVE_KEY,JSON.stringify(snapshot()));
  if(!quiet)say(ok?"Полёт записан":"Хранилище недоступно\nвоспользуйтесь кодом");
  if(ok)cloudPush(false);
  return ok;
}
function autosave(){
  if(G.t-lastSave<600)return;
  lastSave=G.t;saveGame(true);
}
function loadGame(){
  const raw=stGet(SAVE_KEY);if(!raw)return false;
  try{return applySave(JSON.parse(raw));}catch(e){return false;}
}
function hasSave(){return !!stGet(SAVE_KEY);}
function exportCode(){return b64enc(JSON.stringify(snapshot()));}
function importCode(c){
  try{return applySave(JSON.parse(b64dec(c)));}catch(e){return false;}
}
/* ══════════════ облако ══════════════
   Три состояния, и путать их нельзя: игра с диска (облака нет вовсе), игра на
   сайте без входа (есть, но не наше) и игра с учётной записью. */
function cloudTok(){return stGet(CLOUD.tkey)||"";}
function cloudName(){return stGet(CLOUD.lkey)||"";}
function cloudHere(){return location.protocol==="http:"||location.protocol==="https:";}
function cloudOn(){return cloudHere()&&!!cloudTok();}
function cloudCall(a,body){
  return fetch(CLOUD.api+"?a="+a,{method:"POST",
    headers:{"Content-Type":"application/json","X-Drift-Token":cloudTok()},
    body:JSON.stringify(body||{})}).then(r=>r.json());
}
function cloudForget(){stDel(CLOUD.tkey);stDel(CLOUD.lkey);}

let cloudBusy=0,cloudLastTs=0;
/* Отправка идёт молча и не чаще раза в двадцать секунд: сохранение случается
   часто, а сеть — единственное в игре, что умеет тормозить кадр. */
function cloudPush(loud){
  if(!cloudOn()){if(loud)say("Вы не вошли в учётную запись");return;}
  const now=Date.now();
  if(!loud&&now-cloudBusy<20000)return;
  cloudBusy=now;
  const snap=snapshot();
  cloudCall("push",{save:snap})
    .then(d=>{
      if(d&&d.ok){cloudLastTs=d.ts;if(loud)say("Отправлено в облако");}
      else if(d&&d.reason){if(loud)say("В облаке запись новее\nсначала заберите её");}
      else if(d&&d.error==="нужен вход"){cloudForget();if(loud)say("Вход устарел\nвойдите заново");}
    })
    .catch(()=>{if(loud)say("Облако недоступно");});
}
function cloudPull(){
  if(!cloudOn()){say("Вы не вошли в учётную запись");return;}
  cloudCall("pull")
    .then(d=>{
      if(!d||!d.ok){say("В облаке нет записи");return;}
      if(applySave(d.save)){stSet(SAVE_KEY,JSON.stringify(d.save));say("Загружено из облака");}
      else say("Запись из облака не подошла");
    })
    .catch(()=>say("Облако недоступно"));
}
/* На запуске облако не спрашивает игрока и ничего не перетирает молча: оно лишь
   кладёт в локальное хранилище ту запись, которая новее, — а продолжать полёт
   или начинать заново, по-прежнему решает кнопка на заставке. */
function cloudBoot(then){
  if(!cloudOn()){then&&then(false);return;}
  cloudCall("pull")
    .then(d=>{
      if(!d||!d.ok||!d.save){then&&then(false);return;}
      let mine=0;
      try{mine=(JSON.parse(stGet(SAVE_KEY))||{}).ts||0;}catch(e){}
      if((d.save.ts||0)>mine){stSet(SAVE_KEY,JSON.stringify(d.save));then&&then(true);}
      else then&&then(false);
    })
    .catch(()=>{then&&then(false);});
}
