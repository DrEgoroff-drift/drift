/* ══════════════ сохранение ══════════════ */
/* Облако включается заполнением этих полей. Пусто — работает только локально. */
const CLOUD={url:"",id:""};
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
    occ:G.occ,freed:G.freed,occCalm:G.occCalm,
    fuseGen:G.fuseGen,mines:G.mines,log:G.log,ts:Date.now()};
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
  G.freed=s.freed|0;
  G.occCalm=(s.occCalm&&typeof s.occCalm==="object")?s.occCalm:{};
  /* выработка шахт: только список выкопанных ячеек, порода выводится из seed */
  G.mines=(s.mines&&typeof s.mines==="object")?s.mines:{};
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
  if(!G.opts.gfx||typeof G.opts.gfx!=="object")G.opts.gfx={draw:1,detail:1,particles:1,plants:1};
  for(const k of["draw","detail","particles","plants"])if(!G.opts.gfx[k])G.opts.gfx[k]=1;
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
  if(ok&&CLOUD.url)cloudPush();
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
/* облако: два запроса, любой бэкенд с GET/POST по этому адресу подойдёт */
function cloudPush(){
  if(!CLOUD.url)return;
  try{
    fetch(CLOUD.url+"?id="+encodeURIComponent(CLOUD.id),
      {method:"POST",headers:{"Content-Type":"application/json"},
       body:JSON.stringify(snapshot())}).catch(()=>{});
  }catch(e){}
}
function cloudPull(){
  if(!CLOUD.url){say("Облако не настроено");return;}
  fetch(CLOUD.url+"?id="+encodeURIComponent(CLOUD.id))
    .then(r=>r.json())
    .then(d=>{if(applySave(d)){saveGame(true);say("Загружено из облака");}
      else say("В облаке нет записи");})
    .catch(()=>say("Облако недоступно"));
}
