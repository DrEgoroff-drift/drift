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
    drones:G.drones,droneInventory:G.droneInventory,crew:G.crew,bases:G.bases,fuseGen:G.fuseGen,log:G.log,ts:Date.now()};
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
    tMs:Date.now(),paidMs:Date.now()
  })).slice(0,8);
  G.allies=[];
  /* базы: тоже новое поле с безопасным дефолтом. Отсчёт ленивого времени
     подтягиваем к загрузке, иначе простой начислится задним числом. */
  G.bases={};
  if(s.bases&&typeof s.bases==="object")
    for(const k in s.bases){
      const b=s.bases[k];
      if(!b||!Array.isArray(b.cells))continue;
      const cells=[];
      for(let i=0;i<BASE_COLS*BASE_ROWS;i++){
        const c=b.cells[i];
        cells.push(c&&BUILD[c.k]?{k:c.k,hp:clamp(+c.hp||1,0,1)}:null);
      }
      G.bases[k]={sx:b.sx|0,sy:b.sy|0,idx:b.idx|0,name:String(b.name||"База"),
        type:String(b.type||"rocky"),res:Array.isArray(b.res)?b.res.filter(x=>RES[x]):["iron"],
        cells,pool:(b.pool&&typeof b.pool==="object")?b.pool:{},
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
  G.ship.x=+s.x||0;G.ship.y=+s.y||-760;G.ship.a=+s.a||0;
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
