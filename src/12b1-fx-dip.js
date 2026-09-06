/* ══════════════ семья механик: ДИПЛОМАТИЯ (M386, §15.1) ══════════════
   Война состоит не только из выстрелов: между державами лежат ноты со сроком,
   ездят посольства и меняются пленными. Игроку здесь достаётся роль, ради
   которой всё и затевалось, — не солдата, а человека с кораблём, мимо которого
   идёт чужая политика и которого иногда просят довезти.

   Четыре вещи, и ни одна не про урон:

   · **ультиматум** — срок в сводках, и он виден числом. Игрок его не отменяет,
     но знает, сколько осталось, и это меняет то, куда он летит сегодня. Сама
     нота живёт внутри повтора (12am-chron-agents): срок вышел — война, и она
     уже ничем не отменяется;
   · **посольство** — чужой борт идёт через эту систему. Его можно проводить —
     эпизод у обеих сторон, потому что провести чужого через чужое одинаково
     ценно для обоих, — а можно сбить, и это не прощается никогда;
   · **обмен пленными** — после перемирия на станции любой из двух сторон
     пленного отдают без выкупа. Один обмен на одно перемирие;
   · **письмо** (гл. 49) — берётся на станции одной державы, отдаётся на
     станции другой. Ни строчки текста ни от кого: у письма есть отправитель,
     адресат и печать, и больше ничего (правило открытки).

   Ничего из этого не отнимает вещей и не печатает денег: платят здесь делами. */
const DIP_ENVOY=12;          /* трое суток идёт посольство */
const DIP_ESCORT=600;        /* столько кадров рядом — и это уже сопровождение */
const DIP_NEAR=700;          /* «рядом» для сопровождения */
const DIP_TRUCE=8;           /* двое суток на обмен пленными после перемирия */
const DIP_LETTER=24;         /* шесть суток письмо считается свежим */
function dipInc(kind,span,st,N){
  return (typeof chronIncOf==="function")?chronIncOf(kind,span,st,N):null;
}
/* ── ультиматум ──
   Нота лежит в состоянии летописи, поэтому у всех она одна и та же. Здесь её
   только показывают — и показывают ту, что касается неба над головой. */
function dipUltHere(sx,sy){
  if(typeof chronUlts!=="function"||typeof chronOwner!=="function")return null;
  const own=chronOwner(sx===undefined?G.sx:sx,sy===undefined?G.sy:sy);
  if(own<0)return null;
  const N=(typeof chronNow==="function")?chronNow():0;
  for(const u of chronUlts()){
    if(u.a!==own&&u.b!==own)continue;
    const left=DIP_ULT_DUE-(N-u.t0);
    return {a:u.a,b:u.b,left:left>0?left:0};
  }
  return null;
}
/* ── посольство в пути ──
   Борт державы идёт через ЧУЖУЮ систему. Он не пикет: не окликает и не
   стреляет, но за него отвечают — и тот, кто его провёл, и тот, кто нет. */
function dipEnvoyDue(sx,sy){
  const inc=dipInc("envoy",DIP_ENVOY);
  if(!inc||typeof chronOwner!=="function")return null;
  const here=chronOwner(sx===undefined?G.sx:sx,sy===undefined?G.sy:sy);
  if(here<0||here===inc.p)return null;
  return {by:MAKER_KEYS[inc.p],to:MAKER_KEYS[here],p:inc.p,N:inc.N};
}
/* борт посольства в небе: ищется по метке, а не по имени */
function dipEnvoyShip(){
  for(const p of (G.pirates||[]))if(p.dip&&p.hull>0)return p;
  return null;
}
/* сопровождение: держаться рядом, пока он идёт. Награда — не деньги, а два
   человека, которые вас теперь знают: тот, кого вели, и тот, по чьей земле */
function dipEscortTick(sh,dt){
  const p=dipEnvoyShip();
  if(!p){G.escortT=0;return false;}
  if(Math.hypot(sh.x-p.x,sh.y-p.y)>DIP_NEAR){G.escortT=0;return false;}
  G.escortT=(G.escortT||0)+dt;
  if(G.escortT<DIP_ESCORT||G.escortDone)return true;
  G.escortDone=1;
  say("ПОСОЛЬСТВО ПРОВЕДЕНО",140);
  if(typeof epiAdd==="function"){
    epiAdd("distress",p.pw,{force:1});
    const to=(typeof chronOwnerKey==="function")?chronOwnerKey(G.sx,G.sy):null;
    if(to&&to!==p.pw)epiAdd("mail",to,{force:1});
  }
  return true;
}
/* сбитое посольство не прощает никто: ни та держава, чей это был борт, ни та,
   по чьей земле он шёл. Это единственное последствие семьи, которое бьёт — и
   бьёт оно ровно по тому, кто выстрелил первым */
function dipEnvoyShot(p){
  if(!p||!p.dip||typeof epiAdd!=="function")return false;
  epiAdd("never",p.pw,{force:1,who:p.name});
  const to=(typeof chronOwnerKey==="function")?chronOwnerKey(G.sx,G.sy):null;
  if(to&&to!==p.pw)epiAdd("shot",to,{force:1});
  say("СБИТО ПОСОЛЬСТВО · ЭТО НЕ ЗАБУДУТ",180);
  return true;
}
/* ── обмен пленными ──
   «После перемирия.» Перемирие видно в летописи строкой; пока оно свежее, на
   станции любой из двух сторон пленного отдают без выкупа. */
function dipTruceFresh(N){
  if(typeof chronState!=="function")return null;
  const st=chronState();
  if(N===undefined)N=st.N;
  let best=null;
  for(const L of st.lines){
    if(L.kind!=="truce"||N-L.N>DIP_TRUCE)continue;
    if(!best||L.N>=best.N)best=L;
  }
  return best?{a:best.p,b:(best.args&&best.args.b)|0,N:best.N}:null;
}
/* кого можно вернуть здесь и сейчас */
function dipSwapDue(){
  if(!G.sys||!G.sys.station)return null;
  const T=dipTruceFresh();
  if(!T)return null;
  if(G.dipSwapN===T.N)return null;             /* один обмен на одно перемирие */
  const own=(typeof chronOwner==="function")?chronOwner(G.sx,G.sy):-1;
  if(own<0||(own!==T.a&&own!==T.b))return null;
  const c=(G.crew||[]).find(x=>(typeof crewBusy==="function")&&crewBusy(x)==="hostage");
  return c?{c,T}:null;
}
function dipSwapTake(){
  const D=dipSwapDue();
  if(!D)return false;
  G.dipSwapN=D.T.N;
  if(typeof crewFreeHostage==="function")crewFreeHostage(D.c,"вернулся по обмену пленными");
  say("ОБМЕН ПЛЕННЫМИ · БЕЗ ВЫКУПА",160);
  return true;
}
/* ── письмо (гл. 49) ── */
function dipLetterOffer(){
  if(G.letter)return null;
  if(!G.sys||!G.sys.station)return null;
  const from=(typeof chronOwnerKey==="function")?chronOwnerKey(G.sx,G.sy):null;
  if(!from)return null;
  const N=(typeof chronNow==="function")?chronNow():0;
  /* просят не всякий раз: письмо — не работа, а случай. Одно и то же на одной
     станции в одной сводке, чтобы кнопка не мигала между заходами */
  const h=hashi(G.sx|0,G.sy|0,(N<<3)^0x1E77E7)>>>0;
  if((h&7)!==0)return null;
  const to=MAKER_KEYS[(MAKER_KEYS.indexOf(from)+1+(h>>>3)%5)%6];
  return {from,to,N};
}
function dipLetterTake(){
  const o=dipLetterOffer();
  if(!o)return false;
  G.letter={from:o.from,to:o.to,N:o.N};
  const P=(typeof powerOf==="function")?powerOf(o.to):null;
  tell("tech","Письмо принято к перевозке",
    "ПИСЬМО\nкому: "+(P?P.ru:o.to)+"\nтекста нет и не будет: только печать");
  return true;
}
function dipLetterDue(){
  const L=G.letter;
  if(!L||!G.sys||!G.sys.station)return false;
  return ((typeof chronOwnerKey==="function")?chronOwnerKey(G.sx,G.sy):null)===L.to;
}
function dipLetterGive(){
  if(!dipLetterDue())return false;
  const L=G.letter;
  G.letter=null;
  const N=(typeof chronNow==="function")?chronNow():0;
  const late=(N-L.N)>DIP_LETTER;
  say(late?"ПИСЬМО ДОСТАВЛЕНО · С ОПОЗДАНИЕМ":"ПИСЬМО ДОСТАВЛЕНО",140);
  if(typeof epiAdd==="function"){
    epiAdd("mail",L.to,{force:1});
    if(!late)epiAdd("mail",L.from,{force:1});    /* вовремя — помнят и там */
  }
  if(typeof warPut==="function")warPut("mail",1);
  return true;
}
/* ── доска в зале: письмо и обмен ── */
function dipBlock(){
  if(typeof $body==="undefined")return;
  const S=dipSwapDue();
  if(S){
    $body.appendChild(el("div","sec","ОБМЕН ПЛЕННЫМИ · ПОСЛЕ ПЕРЕМИРИЯ"));
    const r=el("div","row");
    r.appendChild(el("div","nm","<b>"+S.c.name+"</b><s>подписано перемирие · отдают без выкупа</s>"));
    const b=el("button","act gold","ЗАБРАТЬ");
    b.onclick=()=>{dipSwapTake();renderTab();};
    r.appendChild(b);
    $body.appendChild(r);
  }
  const L=G.letter;
  if(L){
    const P=(typeof powerOf==="function")?powerOf(L.to):null;
    $body.appendChild(el("div","sec","ПОЧТА"));
    const r=el("div","row");
    r.appendChild(el("div","nm","<b>Письмо в трюме</b><s>кому: "+(P?P.ru:L.to)+
      " · текста нет: только печать</s>"));
    if(dipLetterDue()){
      const b=el("button","act gold","ОТДАТЬ");
      b.onclick=()=>{dipLetterGive();renderTab();};
      r.appendChild(b);
    }else r.appendChild(el("div","qt","НЕ ЗДЕСЬ"));
    $body.appendChild(r);
    return;
  }
  const o=dipLetterOffer();
  if(!o)return;
  const P=(typeof powerOf==="function")?powerOf(o.to):null;
  $body.appendChild(el("div","sec","ПОЧТА · ПРОСЯТ ДОВЕЗТИ"));
  const r=el("div","row");
  r.appendChild(el("div","nm","<b>Письмо</b><s>кому: "+(P?P.ru:o.to)+
    " · платы нет, есть дело</s>"));
  const b=el("button","act","ВЗЯТЬ");
  b.onclick=()=>{dipLetterTake();renderTab();};
  r.appendChild(b);
  $body.appendChild(r);
}
function dipLine(){
  const out=[];
  const U=dipUltHere();
  if(U&&typeof powerOf==="function")
    out.push("УЛЬТИМАТУМ · "+powerOf(MAKER_KEYS[U.a]).ru.toUpperCase()+" И "+
      powerOf(MAKER_KEYS[U.b]).ru.toUpperCase()+" · СРОК "+U.left+" "+
      pl3(U.left,"СВОДКА","СВОДКИ","СВОДОК"));
  const D=dipEnvoyDue();
  if(D&&typeof powerOf==="function")
    out.push("ПОСОЛЬСТВО "+powerOf(D.by).ru.toUpperCase()+" ИДЁТ ЧЕРЕЗ ЭТУ СИСТЕМУ");
  if(dipTruceFresh())out.push("ПЕРЕМИРИЕ · МЕНЯЮТСЯ ПЛЕННЫМИ");
  return out.join(" · ");
}
