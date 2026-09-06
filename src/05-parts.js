/* ══════════════ части корабля ══════════════ */
/* Часть хранится в сохранении как {s:seed,t:тир,k:категория,g:версия генератора} —
   имя, аффиксы и числа восстанавливаются из seed этой же функцией. Поэтому
   genPart НЕЛЬЗЯ менять задним числом: при правке заводим новую ветку по g,
   иначе у всех игроков втихую поменяются уже собранные части. */
const PART_GEN=1;
/* g — род существительного: прилагательное в имени части согласуется с ним */
const PART_KINDS={
  gun:   {ru:"Орудие",           col:"#ff9d7a",note:"бортовой огонь",g:"n",sh:"ОРУДИЕ"},
  /* lead — обязательный первый аффикс: без ёмкости «силовое поле» с одной
     регенерацией не делает вообще ничего, такую часть выдавать нельзя */
  shield:{ru:"Силовое поле",     col:"#9fd8ff",note:"поглощает урон до корпуса",g:"n",sh:"ЩИТ",lead:"shieldAdd"},
  engine:{ru:"Двигательный блок",col:"#7fe6d8",note:"тяга и поворот",g:"m",sh:"ДВИГ"},
  hull:  {ru:"Обшивка",          col:"#e0d28a",note:"прочность корпуса",g:"f",sh:"ОБШИВКА"},
  core:  {ru:"Реактор",          col:"#c58ae0",note:"топливо и дальность прыжка",g:"m",sh:"РЕАКТОР"},
  util:  {ru:"Утилита",          col:"#8fd08a",note:"трюм, бур, обзор",g:"f",sh:"УТИЛИТА"},
  /* Пусковая (M112): единственная часть, которая без груза в трюме не работает
     вовсе. Ставится в отдельный подвес — он есть на каждом корпусе и стоит
     последним, чтобы уже собранные сборки не съехали по номерам слотов. */
  missile:{ru:"Пусковая установка",col:"#ff8f6a",note:"ракеты; расход из трюма",g:"f",sh:"ПУСК",lead:"mslDmgMul"}
};
/* все PART_PRE — мужской род на -ый/-ой/-ий, поэтому хватает подмены окончания */
function adjTo(adj,g){
  if(g==="m")return adj;
  return adj.slice(0,-2)+(g==="f"?"ая":"ое");
}
const PART_KEYS=Object.keys(PART_KINDS);
/* аффиксы: step — величина на тир; flat — прибавка, иначе доля; fix — знаков после запятой */
const AFFIX=[
  {k:"dmgMul",   ru:"урон",             step:.11, kinds:["gun"]},
  {k:"rateMul",  ru:"скорострельность", step:.09, kinds:["gun"]},
  {k:"shieldAdd",ru:"щит",              step:9,   kinds:["shield"],flat:1},
  {k:"regenAdd", ru:"регенерация щита", step:.45, kinds:["shield"],flat:1,fix:2},
  {k:"thrMul",   ru:"тяга",             step:.08, kinds:["engine"]},
  {k:"turnMul",  ru:"поворот",          step:.07, kinds:["engine"]},
  {k:"hullAdd",  ru:"корпус",           step:11,  kinds:["hull"], flat:1},
  {k:"fuelAdd",  ru:"бак",              step:10,  kinds:["core"], flat:1},
  {k:"jumpAdd",  ru:"дальность прыжка", step:.35, kinds:["core"], flat:1,fix:1,unit:" пк"},
  {k:"cargoMul", ru:"трюм",             step:.09, kinds:["util"]},
  {k:"drillMul", ru:"бур",              step:.10, kinds:["util"]},
  {k:"scanAdd",  ru:"обзор",            step:90,  kinds:["util"], flat:1},
  {k:"mslDmgMul",ru:"боевая часть",     step:.13, kinds:["missile"]},
  {k:"mslLockMul",ru:"наведение",       step:.11, kinds:["missile"]}
];
/* штрафы: у сильной части есть цена, иначе выбор очевиден и сборка бессмысленна */
const AFFIX_BAD=["thrMul","turnMul","cargoMul","hullAdd","fuelAdd","rateMul"];
const AFFIX_BY_K={};for(const a of AFFIX)AFFIX_BY_K[a.k]=a;
const PART_PRE=["Тяжёлый","Форсированный","Кустарный","Трофейный","Опытный","Импульсный",
  "Резонансный","Полевой","Штурмовой","Компактный","Усиленный","Аварийный","Сдвоенный","Литой"];
const PART_SUF=["М1","М2","К-7","Тип-3","серия B","мод. 9","Р-12","XT","дубль","прототип","ТУ-4","«Клык»"];
const TIER_RU=["","обычная","добротная","редкая","отменная","легендарная"];
/* off — аффикс не из профиля категории: даём его вполсилы, иначе орудие с жирным
   бонусом к трюму размывает смысл категорий и бонусы бесконтрольно стакаются */
function affVal(a,tier,r,bad,off){
  let v=a.step*tier*(.7+r()*.6);
  if(off)v*=.45;
  if(bad)v=-Math.abs(v)*.55;
  return a.fix?+v.toFixed(a.fix):(a.flat?Math.round(v):+v.toFixed(3));
}
function affLabel(x){
  const a=AFFIX_BY_K[x.k],v=x.v;
  const s=a.flat?(a.fix?v.toFixed(a.fix):Math.round(v)):Math.round(v*100)+"%";
  return (v>0?"+":"−")+String(s).replace("-","")+(a.unit||"")+" "+a.ru;
}
/* тир по опасности сектора: у дома падает мусор, на фронтире — то, ради чего летят */
function tierFromDanger(d,r){
  const base=1+d*3.2+r()*1.4;
  return clamp(Math.round(base),1,5);
}
function genPart(seed,tier,kind){
  const r=rng((seed>>>0)||1);
  tier=clamp(tier|0||1,1,5);
  kind=kind||pick(PART_KEYS,r);
  const own=AFFIX.filter(a=>a.kinds.indexOf(kind)>=0);
  const other=AFFIX.filter(a=>a.kinds.indexOf(kind)<0);
  const n=clamp(1+Math.floor(r()*(1+tier*.55)),1,3);
  const aff=[],used={};
  /* первый аффикс всегда профильный — часть должна делать то, что обещает категория */
  const lead=PART_KINDS[kind].lead;
  const first=lead?AFFIX_BY_K[lead]:pick(own,r);
  aff.push({k:first.k,v:affVal(first,tier,r,0)});used[first.k]=1;
  while(aff.length<n){
    const off=r()>=.72;
    const pool=(off?other:own).filter(a=>!used[a.k]);
    if(!pool.length)break;
    const a=pick(pool,r);
    aff.push({k:a.k,v:affVal(a,tier,r,0,off)});used[a.k]=1;
  }
  /* чем сильнее часть, тем вероятнее у неё обратная сторона */
  if(tier>=3&&r()<.22+tier*.1){
    const pool=AFFIX_BAD.filter(k=>!used[k]);
    if(pool.length){
      const k=pick(pool,r);
      aff.push({k,v:affVal(AFFIX_BY_K[k],tier,r,1)});used[k]=1;
    }
  }
  const bonus={};
  for(const x of aff)bonus[x.k]=(bonus[x.k]||0)+x.v;
  if(kind==="gun")bonus.gun=1;
  if(kind==="missile")bonus.msl=1;
  return {seed:seed>>>0,tier,kind,gen:PART_GEN,aff,bonus,
    name:adjTo(pick(PART_PRE,r),PART_KINDS[kind].g)+" "+PART_KINDS[kind].ru.toLowerCase()+" "+pick(PART_SUF,r),
    cap:Math.ceil(tier/2)};
}
/* ── ёмкость оснастки: модули и части делят один бюджет ──
   Нижняя граница подобрана так, чтобы полностью прокачанные модули (7×4=28)
   влезали на любой корпус: старое сохранение не должно ничего отключать. */
function capOf(id){
  const S=shipData(id);
  if(!S)return 32;
  return Math.round(clamp(26+S.hull/22+S.cargo/40+(S.fuel-90)/40,30,48));
}
const SLOT_CACHE={};
function slotsOf(id){
  if(SLOT_CACHE[id])return SLOT_CACHE[id];
  const S=shipData(id);
  if(!S)return ["gun","engine","hull","util"];
  const r=rng(hashi(S.seed,5150,77));
  const w={gun:1+(S.thr>1.1?1.2:0),shield:1,engine:1+(S.turn>1.05?1.2:0),
    hull:1+(S.hull>150?1.6:0),core:1+(S.fuel>140?1.2:0),util:1+(S.cargo>120?1.6:0)};
  const n=clamp(Math.round(3.4+S.hull/150+S.cargo/170+S.fuel/230),4,8);
  const out=["gun","engine"];                 // без них корабль не корабль
  while(out.length<n){
    let tot=0;for(const k in w)tot+=w[k];
    let t=r()*tot,got=PART_KEYS[0];
    for(const k in w){t-=w[k];if(t<=0){got=k;break;}}
    out.push(got);
    w[got]*=.45;                              // повтор возможен, но реже
  }
  /* подвес под пусковую (M112) — один на любом корпусе и ВСЕГДА последний.
     Он не участвует в розыгрыше выше: веса `w` не тронуты, значит у уже
     собранных сборок номера слотов не съехали и сохранения не рассыпались. */
  out.push("missile");
  SLOT_CACHE[id]=out;
  return out;
}
/* ── точки слотов на самом корпусе ──
   Берём реальную геометрию из hullOf, а не абстрактную сетку: орудие сидит
   на законцовке крыла, двигательный блок — у сопла, реактор — в теле. */
const ANCHOR_CACHE={};
function slotAnchors(id){
  if(ANCHOR_CACHE[id])return ANCHOR_CACHE[id];
  const h=hullOf(id),slots=slotsOf(id);
  const mid=(h.nose+h.tail)*.5;
  const cand={gun:[],shield:[],engine:[],hull:[],core:[],util:[],missile:[]};
  for(const w of h.wings){const t=w[2];cand.gun.push([t[0],t[1]*.86],[t[0],-t[1]*.86]);}
  const gx=h.nose*.62;
  cand.gun.push([gx,-profW(h.prof,gx)*.95],[gx,profW(h.prof,gx)*.95]);
  for(const e of h.eng)cand.engine.push([e.x+e.r*.5,e.y]);
  for(const n of h.nacs)cand.engine.push([n.x,-n.y],[n.x,n.y]);
  for(const p of h.pods)cand.util.push([p[0],p[1]+p[3]*.5],[p[0],-(p[1]+p[3]*.5)]);
  const ux=lerp(mid,h.tail,.35);
  cand.util.push([ux,profW(h.prof,ux)*.6],[ux,-profW(h.prof,ux)*.6]);
  const hx=lerp(h.nose,h.tail,.42);
  cand.hull.push([hx,-profW(h.prof,hx)*.72],[hx,profW(h.prof,hx)*.72],
                 [lerp(h.nose,h.tail,.62),-profW(h.prof,lerp(h.nose,h.tail,.62))*.72]);
  cand.core.push([lerp(mid,h.tail,.28),0],[mid,0],[lerp(mid,h.tail,.55),0]);
  cand.shield.push([lerp(h.nose,h.tail,.3),0],[lerp(h.nose,h.tail,.18),0],[mid,0]);
  /* пусковая висит под крылом ближе к телу, а если крыльев нет — под брюхом:
     это подвес, и он должен читаться подвешенным, а не встроенным */
  for(const w of h.wings){const t=w[2];cand.missile.push([t[0]*.72,t[1]*.55]);}
  const mx2=lerp(h.nose,h.tail,.5);
  cand.missile.push([mx2,profW(h.prof,mx2)*.45],[mx2,-profW(h.prof,mx2)*.45]);
  const used={},out=[];
  slots.forEach((k,i)=>{
    const list=cand[k].length?cand[k]:[[mid,0]];
    const n=used[k]=(used[k]||0);
    used[k]++;
    const a=list[n%list.length];
    /* если кандидаты кончились, разводим повторы вдоль оси, чтобы точки не слипались */
    const off=Math.floor(n/list.length)*h.len*.09;
    out.push({x:a[0]-off,y:a[1],kind:k,i});
  });
  /* кандидаты разных категорий иногда попадают в одну точку — разводим их
     несколькими проходами отталкивания. Детерминированно: никакого rng. */
  const minD=Math.max(3.2,h.len*.105);
  for(let pass=0;pass<12;pass++){
    let moved=false;
    for(let a=0;a<out.length;a++)for(let b=a+1;b<out.length;b++){
      const dx=out[b].x-out[a].x, dy=out[b].y-out[a].y;
      let d=Math.hypot(dx,dy);
      if(d>=minD)continue;
      /* совпали точь-в-точь — расталкиваем вдоль оси корпуса */
      const ux=d<1e-4?1:dx/d, uy=d<1e-4?0:dy/d;
      const push=(minD-(d<1e-4?0:d))*.5;
      out[a].x-=ux*push;out[a].y-=uy*push;
      out[b].x+=ux*push;out[b].y+=uy*push;
      moved=true;
    }
    if(!moved)break;
  }
  ANCHOR_CACHE[id]=out;
  return out;
}
/* сумма бонусов установленных частей — кэшируется, stat() зовут каждый кадр */
let PART_BONUS=null,PART_KIND=null;
function invalidateParts(){PART_BONUS=null;PART_KIND=null;GUN_LIST=null;}
/* первая установленная часть своего рода: орудие, поле, реактор. Нужна
   каждому кадру (семь чисел орудия, повадка щита, ёмкость энергии — M362),
   поэтому лежит рядом с бонусами и гаснет тем же invalidateParts. */
function fittedOfKind(kind){
  if(!PART_KIND){PART_KIND={};for(const p of fittedParts())if(!PART_KIND[p.kind])PART_KIND[p.kind]=p;}
  return PART_KIND[kind]||null;
}
/* ── все стволы со своими подвесами (M363) ──
   Слот знает свою точку, точка — свою повадку; ствол в жёсткой смотрит
   уже и бьёт сильнее. Список кэшируется вместе с бонусами: его читает
   stat(), а stat() зовут десятки раз за кадр. */
let GUN_LIST=null;
function fittedGuns(){
  if(GUN_LIST)return GUN_LIST;
  const f=G.fit[G.shipId]||{},out=[];
  const st=(typeof stat0Gun==="function")?null:null;
  for(const k in f){
    const p=partById(f[k]);
    if(!p||p.kind!=="gun")continue;
    out.push({slot:+k,part:p,m:(typeof mountAt==="function")?mountAt(G.shipId,+k):null});
  }
  out.sort((a,b)=>a.slot-b.slot);
  GUN_LIST=out;
  return out;
}
function partById(id){
  for(const p of G.inv)if(p.id===id)return p;
  return null;
}
function fitMap(){
  let f=G.fit[G.shipId];
  if(!f){f={};G.fit[G.shipId]=f;}
  return f;
}
function fittedParts(){
  const f=G.fit[G.shipId]||{},out=[];
  for(const k in f){const p=partById(f[k]);if(p)out.push(p);}
  return out;
}
function partBonus(){
  if(PART_BONUS)return PART_BONUS;
  const b={};
  for(const p of fittedParts())for(const k in p.bonus)b[k]=(b[k]||0)+p.bonus[k];
  PART_BONUS=b;
  return b;
}
function capUsed(){
  let n=0;
  for(const k in G.mods)n+=G.mods[k];
  for(const p of fittedParts())n+=p.cap;
  return n;
}
const PART_MAX=60;
let partSeq=1;
function addPart(p){
  p.id="p"+(partSeq++);
  G.inv.push(p);
  /* инвентарь не должен раздувать сохранение: вытесняем самый слабый лишний */
  while(G.inv.length>PART_MAX){
    let wi=-1,wt=99;
    for(let i=0;i<G.inv.length;i++){
      const q=G.inv[i];
      if(isFitted(q.id))continue;
      if(q.tier<wt){wt=q.tier;wi=i;}
    }
    if(wi<0)break;
    G.inv.splice(wi,1);
  }
  return p;
}
function isFitted(id){
  for(const s in G.fit){const f=G.fit[s];for(const k in f)if(f[k]===id)return true;}
  return false;
}
function unfitPart(slot){
  const f=fitMap();
  if(f[slot]!=null){delete f[slot];invalidateParts();afterFitChange();}
}
function fitPart(slot,id){
  const p=partById(id),slots=slotsOf(G.shipId);
  if(!p||slots[slot]!==p.kind)return false;
  if(isFitted(id))return false;
  /* M363: у подвеса есть размер, у части — тоже; и опечатанное не ставят.
     Уже стоящее не трогаем: правило пришло позже сборки, и отбирать
     поставленное — наказание за то, чего игрок не делал. */
  if(typeof mountAt==="function"){
    const m=mountAt(G.shipId,slot);
    if(m&&!mountTakes(m,p))return false;
  }
  if(typeof partSealed==="function"&&partSealed(p))return false;
  const f=fitMap(),prev=f[slot];
  if(prev!=null)delete f[slot];
  if(capUsed()+p.cap>capOf(G.shipId)){if(prev!=null)f[slot]=prev;return false;}
  f[slot]=id;invalidateParts();afterFitChange();
  return true;
}
/* после любой смены оснастки текущие топливо/корпус могут оказаться выше нового максимума */
function afterFitChange(){
  invalidateParts();
  const s=stat();
  G.fuel=Math.min(G.fuel,s.fuelMax);
  G.hull=Math.min(G.hull,s.hullMax);
  G.shield=Math.min(G.shield,s.shieldMax);
}
/* статы «как было бы», если в слот поставить эту часть — для сравнения в интерфейсе.
   Ёмкость сознательно не проверяем: показать эффект надо и у той части, что не влезает. */
function statPreview(slot,id){
  const f=fitMap(),prev=f[slot];
  if(id==null)delete f[slot];else f[slot]=id;
  invalidateParts();
  const s=stat();
  if(prev!=null)f[slot]=prev;else delete f[slot];
  invalidateParts();
  return s;
}
const STAT_SHOW=[
  {k:"thr",     ru:"тяга",   fix:2},
  {k:"turn",    ru:"повор",  fix:2},
  {k:"hullMax", ru:"корпус", fix:0},
  {k:"shieldMax",ru:"щит",   fix:0},
  {k:"cargoMax",ru:"трюм",   fix:0},
  {k:"fuelMax", ru:"бак",    fix:0},
  {k:"drill",   ru:"бур",    fix:2},
  {k:"jump",    ru:"прыжок", fix:1},
  {k:"dmg",     ru:"урон",   fix:1},
  {k:"cool",    ru:"откат",  fix:0, less:1},   // меньше — лучше
  {k:"see",     ru:"обзор",  fix:0}
];
function deltaHtml(a,b){
  const parts=[];
  for(const d of STAT_SHOW){
    const x=+a[d.k]||0,y=+b[d.k]||0;
    if(Math.abs(x-y)<(d.fix?0.005:0.5))continue;
    const better=d.less?y<x:y>x;
    parts.push("<u>"+d.ru+" "+x.toFixed(d.fix)+"→<span class='"+(better?"up":"dn")+"'>"+
      y.toFixed(d.fix)+"</span></u>");
  }
  return parts.length?"<span class='delta'>"+parts.join("")+"</span>":"";
}
/* разбор: часть возвращается материалом. Пока обычные ресурсы —
   редкие появятся вместе с M39, тогда сюда добавится их доля. */
function scrapYield(p){
  const r=rng(hashi(p.seed,2024,p.tier));
  const pool={gun:["iron","titan"],shield:["silicon","crystal"],engine:["iron","isotopes"],
    hull:["iron","titan"],core:["isotopes","iridium"],util:["silicon","organics"],
    /* пусковая тоже разбирается (M341 нашёл: у неё не было пула, и разбор падал) */
    missile:["iron","techcomp"]}[p.kind];
  const out={};
  for(const k of pool)out[k]=Math.max(1,Math.round((2+p.tier*2.2)*(.6+r()*.8)));
  return out;
}
function scrapPart(id){
  const p=partById(id);
  if(!p||isFitted(id))return null;
  const y=scrapYield(p),got={};
  for(const k in y){const n=addRes(k,y[k]);if(n)got[k]=n;}
  G.inv.splice(G.inv.indexOf(p),1);
  /* под кожухом — спички (12uc): по тиру и зерну части, не бросок */
  const matches=(typeof matchesInPart==="function")?matchesInPart(p):0;
  if(matches&&typeof matchesAdd==="function")matchesAdd(matches);
  return {part:p,got,matches};
}
function packPart(p){return {s:p.seed,t:p.tier,k:p.kind,g:p.gen,i:p.id};}
function unpackPart(o){
  if(!o||!PART_KINDS[o.k])return null;
  const p=genPart(o.s>>>0,o.t|0,o.k);
  p.id=typeof o.i==="string"?o.i:("p"+(partSeq++));
  return p;
}
