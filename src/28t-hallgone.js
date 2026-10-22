/* ══════════════ лицо ушло из зала (M910c, docs/DESIGN-game.md §7.3) ══════════════
   У каждой бумаги диспетчера есть лицо (28m dispFace). Пока бумага жива, этот человек сидит в
   кантине станции, что её выдала: место толпы занимает он сам, тем же лицом, что на бумаге
   (не больше HGONE_MAX). Срок вышел — вы его подвели: в зале его нет, его место в толпе пустует
   HGONE_DAYS суток неба, а бармен вместо слова зала говорит, что он больше не заходит.
   Длинный наряд пишет диспетчер участка — она в зал не ходит и не уходит.
   Память: G.hallGone = {ключ станции:[{seed,name,d}]} — последние HGONE_KEEP на станцию. */
const HGONE_MAX=2,HGONE_KEEP=3,HGONE_DAYS=30;
function hgoneSt(){if(!G.hallGone||typeof G.hallGone!=="object"||Array.isArray(G.hallGone))G.hallGone={};return G.hallGone;}
function hgoneFem(name){return /на$/.test(String(name).split(" ").pop());}
/* ушедшие со станции, ещё свежие (новые первыми) */
function hgoneGone(key){
  const L=G.hallGone&&G.hallGone[key];if(!Array.isArray(L))return [];
  const d=celDay();return L.filter(g=>d-g.d<HGONE_DAYS).slice().reverse();
}
/* в зале: лица живых бумаг этой станции, кроме длинного наряда */
function hgoneHere(key){
  const D=(typeof dispSt==="function")?dispSt():null;if(!D)return [];
  const out=[],seen={};
  for(const it of D.it){if(it.from!==key||it.kind==="long"||!it.f||seen[it.f.seed])continue;seen[it.f.seed]=1;out.push(it.f);}
  return out.slice(0,HGONE_MAX);
}
function hgoneNote(it){
  if(!it||it.kind==="long"||!it.f)return;
  const H=hgoneSt(),L=H[it.from]||(H[it.from]=[]);
  if(L.some(g=>g.seed===(it.f.seed>>>0)))return;
  L.push({seed:it.f.seed>>>0,name:String(it.f.name||""),d:celDay()});
  while(L.length>HGONE_KEEP)L.shift();
}
/* раскладка зала: лица бумаг садятся на места толпы, ушедшие оставляют место пустым */
function hgoneLayout(L,lazy){
  if(!L||!G.sys||!G.sys.key)return L;
  const key=G.sys.key,here=hgoneHere(key),gone=hgoneGone(key).slice(0,HGONE_MAX);
  if(!here.length&&!gone.length)return L;
  const crowd=L.people.filter(p=>p.kind==="crowd"||p.kind==="kino");   /* на кино толпа — ряды зрителей */
  let i=0;
  for(const f of here){const p=crowd[i++];if(!p)break;
    p.m=dispPerson(f);p.who=f.name;
    if(!lazy)p.mesh=cpMesh(p.m,p.pose,p.lod);}
  /* пустые места — с конца толпы: лица бумаг остаются */
  const rest=crowd.slice(i),drop=rest.slice(Math.max(0,rest.length-gone.length));   /* slice(-0) взял бы всех */
  if(drop.length)L.people=L.people.filter(p=>drop.indexOf(p)<0);
  return L;
}
function hgoneLine(){
  if(!G.sys||!G.sys.key)return null;
  const g=hgoneGone(G.sys.key)[0];if(!g)return null;
  return g.name+"? Больше не заходит. "+(hgoneFem(g.name)?"Ждала вас, потом перестала.":"Ждал вас, потом перестал.");
}
function hgoneRestore(s){
  const v=s&&s.hallGone;G.hallGone=null;
  if(!v||typeof v!=="object"||Array.isArray(v))return;
  const H={};
  for(const k in v){if(!Array.isArray(v[k]))continue;
    const L=v[k].filter(g=>g&&Number.isFinite(g.seed)&&Number.isFinite(g.d)&&typeof g.name==="string")
      .map(g=>({seed:g.seed>>>0,name:g.name.slice(0,40),d:g.d|0})).slice(-HGONE_KEEP);
    if(L.length)H[k]=L;}
  G.hallGone=H;
}
const HGONE_HOOKS=[
  /* срок вышел — единственное, что dispTick убирает с полосы */
  ["dispTick",O=>function(){const D=dispSt(),was=D.it.slice(),r=O.apply(this,arguments);
    for(const it of was)if(D.it.indexOf(it)<0){try{hgoneNote(it);}catch(e){}}
    return r;}],
  ["c3Layout",O=>function(cssW,cssH,list,deals,folk,lazy){const L=O.apply(this,arguments);try{hgoneLayout(L,lazy);}catch(e){}return L;}],
  /* сказанное только что (cantBubble) главнее; дальше — ушедший, потом слово зала */
  ["cantKeeperLine",O=>function(){
    if(typeof cantBubble!=="undefined"&&cantBubble&&now()-cantBubble.t<60000)return O.apply(this,arguments);
    return hgoneLine()||O.apply(this,arguments);}],
  ["snapshot",O=>function(){const s=O.apply(this,arguments);if(s)s.hallGone=G.hallGone&&Object.keys(G.hallGone).length?JSON.parse(JSON.stringify(G.hallGone)):null;return s;}],
  ["applySave",O=>function(s){const r=O.apply(this,arguments);if(r){try{hgoneRestore(s);}catch(e){G.hallGone=null;}}return r;}]
];
for(const [n,mk] of HGONE_HOOKS){const O=window[n];if(typeof O!=="function")throw new Error("28t-hallgone: нет крючка "+n);window[n]=mk(O);}
