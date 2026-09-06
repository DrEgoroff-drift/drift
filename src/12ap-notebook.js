/* ══════════════ эпизоды и записная книжка (M374, §6.2–6.3) ══════════════
   Вместо числа отношения — ПАМЯТЬ О ДЕЛАХ. Эпизод — это что, где, когда и с
   кем: вытащил «Заслон-3» из-под барона, привёз почту на плавбазу, сбил их
   борт на фронте. У каждого эпизода есть вес и ЧЕЛОВЕК, к которому он привязан;
   человек попадает в записную книжку (двенадцать мест, старое вытесняется).

   Три правила, из которых состоит вся система:

   1. Эпизод пишется только ПРИ СВИДЕТЕЛЕ (§6.3): их борт выжил и был в
      пределах видимости — или на борту попугай, который потом расскажет сам.
      Нет свидетеля — ничего не было.
   2. Эпизод ЕДЕТ: сутки до соседней ветки, трое — до столицы державы. Пока не
      доехал, там о вас не знают. Едет он по тем же трассам, по которым ездят
      слухи, и так же медленно.
   3. На месте берётся САМЫЙ ТЯЖЁЛЫЙ доехавший эпизод, а не сумма. Хорошее и
      дурное не гасят друг друга: если доехали оба, в оклике скажут оба.

   «Не простил» — единственное, что не перекрывается ничем: убил своего же
   знакомого, и человек уходит из книжки навсегда. */
const EPI_KINDS={
  tow:      {ru:"вытащил на тросе",           w:60},
  distress: {ru:"пришёл на сигнал",           w:50},
  guard:    {ru:"снял пирата с их борта",     w:45},
  fuel:     {ru:"поделился топливом",         w:25},
  mail:     {ru:"довёз почту",                w:20},
  shot:     {ru:"стрелял по их борту",        w:-70},
  contra:   {ru:"вёз клеймо их врага",        w:-40},
  ran:      {ru:"пошёл сквозь блокаду",       w:-50},
  never:    {ru:"убил их человека",           w:-1000}
};
const EPI_MAX=48;              /* столько эпизодов помним всего */
const NOTE_MAX=12;             /* столько людей помещается в книжку */
const EPI_SPEED=3;             /* столько секторов эпизод проходит за сводку */
function epiAll(){return (G.episodes||(G.episodes=[]));}
function noteAll(){return (G.notebook||(G.notebook=[]));}
/* ── свидетель ──
   Их борт в пределах видимости и живой — или попугай на борту (12x): он и есть
   переносчик чужих новостей о вас, и это его вторая работа. */
function epiWitness(by){
  if(typeof parrotHas==="function"&&parrotHas())return "попугай";
  const st=(typeof stat==="function")?stat():{see:2000};
  for(const p of (G.pirates||[])){
    if(p.hull<=0||p.pw!==by)continue;
    if(Math.hypot(p.x-G.ship.x,p.y-G.ship.y)<=(st.see||2000)*1.2)return p.name||"их борт";
  }
  return null;
}
/* человек, к которому привязан эпизод: живой позывной, если он рядом, иначе
   имя со станции — но всегда КОНКРЕТНЫЙ человек, а не «держава» */
function epiPerson(by,seed){
  const r=rng(hashi(seed|0,0x0E71,MAKER_KEYS.indexOf(by)+1));
  if(typeof genName==="function")return genName(r);
  return "их человек";
}
/* ── записать эпизод ── */
function epiAdd(kind,by,opts){
  const K=EPI_KINDS[kind];
  if(!K||!by||!HULL_MAKER[by])return null;
  opts=opts||{};
  const wit=opts.force?"—":epiWitness(by);
  if(!wit)return null;                       /* без свидетеля ничего не было */
  const N=(typeof chronNow==="function")?chronNow():0;
  const seed=hashi(G.sx|0,G.sy|0,(N&1023)*31+MAKER_KEYS.indexOf(by));
  const who=opts.who||epiPerson(by,seed);
  const e={k:kind,by,w:K.w,N,sx:G.sx|0,sy:G.sy|0,who,wit};
  const L=epiAll();
  L.push(e);
  if(L.length>EPI_MAX)L.splice(0,L.length-EPI_MAX);
  /* человек попадает в книжку: двенадцать мест, старое вытесняется. «Не
     простил» — исключение: этот человек только что ушёл оттуда навсегда, и
     возвращать его записью о собственной смерти было бы издевательством */
  const NB=noteAll();
  if(kind!=="never"&&!NB.some(x=>x.who===who&&x.by===by)){
    NB.push({who,by,k:kind,N,sx:e.sx,sy:e.sy,asked:-1});
    if(NB.length>NOTE_MAX)NB.shift();
  }
  const P=(typeof powerOf==="function")?powerOf(by):null;
  if(typeof logAdd==="function")
    logAdd(K.w>0?"kill":"warn",(P?P.ru:by)+" · "+who+": "+K.ru+
      " (сектор "+e.sx+":"+e.sy+", видел "+wit+")");
  return e;
}
/* ── доехал ли эпизод сюда (§6.3) ── */
function epiReached(e,sx,sy){
  const N=(typeof chronNow==="function")?chronNow():0;
  const d=Math.abs((sx|0)-e.sx)+Math.abs((sy|0)-e.sy);
  return (N-e.N)>=Math.floor(d/EPI_SPEED);
}
/* самый тяжёлый доехавший эпизод этой державы — по модулю веса, не сумма */
function epiHere(by,sx,sy){
  sx=(sx===undefined)?G.sx:sx;sy=(sy===undefined)?G.sy:sy;
  let best=null;
  for(const e of epiAll()){
    if(e.by!==by||!epiReached(e,sx,sy))continue;
    if(!best||Math.abs(e.w)>Math.abs(best.w))best=e;
  }
  return best;
}
/* и хорошее, и дурное — если доехали оба, оклик скажет оба */
function epiBoth(by,sx,sy){
  sx=(sx===undefined)?G.sx:sx;sy=(sy===undefined)?G.sy:sy;
  let good=null,bad=null;
  for(const e of epiAll()){
    if(e.by!==by||!epiReached(e,sx,sy))continue;
    if(e.w>0&&(!good||e.w>good.w))good=e;
    if(e.w<0&&(!bad||e.w<bad.w))bad=e;
  }
  return {good,bad};
}
/* есть ли вообще эпизод с этой державой — это и есть «разрешение на покупку»
   корпуса из §19.3, тот самый крючок, который M369b оставил пустым */
function episodeWith(by){
  for(const e of epiAll())if(e.by===by&&e.w>0)return true;
  return false;
}
/* строка оклика по делам: то самое «тот самый, который «Заслон-3» тащил» */
function epiHailLine(by){
  const B=epiBoth(by);
  if(!B.good&&!B.bad)return "";
  const g=B.good?("тот самый, который "+EPI_KINDS[B.good.k].ru+"?"):"";
  const b=B.bad?("но и "+EPI_KINDS[B.bad.k].ru):"";
  if(g&&b)return g+" "+b+". Лети, но мы смотрим.";
  if(g)return g+" Проходи.";
  return "Это тот, который "+EPI_KINDS[B.bad.k].ru+". Смотрим.";
}
/* ── «не простил» (§6.2) ──
   Убил человека из своей же книжки — он уходит навсегда, и это единственное,
   что не перекрывается ничем. */
function epiNeverForgave(p){
  if(!p||!p.pw)return;
  const NB=noteAll();
  const i=NB.findIndex(x=>x.by===p.pw&&x.who===p.name);
  const who=(i>=0)?NB[i].who:null;
  if(i>=0)NB.splice(i,1);
  const e=epiAdd("never",p.pw,{force:1,who:who||p.name});
  if(e&&typeof tell==="function")
    tell("warn","«Не простил»: "+(who||p.name),"НЕ ПРОСТИЛ\n"+(who||p.name)+
      "\nЭто не перекрывается ничем");
}
/* ── подарок (§19.3 «gift») ──
   Раз на державу за игру и только за тяжёлое дело: корпус «со списания» не
   продают — его отдают, и один раз. */
function epiGiftDue(by){
  G.gifts=G.gifts||{};
  if(G.gifts[by])return false;
  const e=epiHere(by);
  return !!(e&&e.w>=50);
}
function epiGiftTake(by){
  G.gifts=G.gifts||{};
  if(G.gifts[by]||!epiGiftDue(by))return null;
  G.gifts[by]=1;
  const sh=genUniqueShip(hashi(0x91F7,MAKER_KEYS.indexOf(by)+1,G.sx|0));
  sh.by=by;sh.cls="корпус со списания";
  const P=(typeof powerOf==="function")?powerOf(by):null;
  sh.note="Отдан, а не продан. "+(P?P.ru:"")+" списала его и не стала резать.";
  const uid="g"+by+(sh.seed>>>0);
  G.uniqueShips[uid]=sh;G.owned[uid]=true;
  if(typeof tell==="function")
    tell("kill","Подарок: «"+sh.ru+"» со списания","ПОДАРОК\n«"+sh.ru+"»\n"+(P?P.ru:""));
  return uid;
}
/* ── страница книжки на доске (M374) ──
   Двенадцать человек, у каждого одно дело и одна просьба за сводку. Своего
   экрана у этого нет: книжка лежит там же, где лист «Маяка» и эфир. */
function noteBlock(){
  if(typeof $body==="undefined")return;
  const NB=noteAll();
  if(!NB.length)return;
  $body.appendChild(el("div","sec","ЗАПИСНАЯ КНИЖКА · "+NB.length+" из "+NOTE_MAX+
    " · ПРОСИТЬ МОЖНО РАЗ В СВОДКУ"));
  for(let i=NB.length-1;i>=0;i--){
    const x=NB[i];
    const P=(typeof powerOf==="function")?powerOf(x.by):null;
    const K=EPI_KINDS[x.k];
    const r=el("div","row");
    r.appendChild(el("div","nm","<b>"+x.who+"</b><s>"+(P?P.ru:"")+" · "+
      (K?K.ru:x.k)+" · сектор "+x.sx+":"+x.sy+"</s>"));
    if(noteAskable(x)){
      const b1=el("button","act","ТОПЛИВО");
      b1.onclick=()=>{say(noteAsk(x,"fuel").toUpperCase(),120);renderTab();};
      const b2=el("button","act","ГДЕ ФРОНТ");
      b2.onclick=()=>{say(noteAsk(x,"front").toUpperCase(),150);renderTab();};
      r.appendChild(b1);r.appendChild(b2);
    }else r.appendChild(el("div","qt","УЖЕ ПРОСИЛИ"));
    $body.appendChild(r);
  }
  /* подарок: раз на державу и только за тяжёлое дело */
  for(const by of MAKER_KEYS){
    if(!epiGiftDue(by))continue;
    const P=(typeof powerOf==="function")?powerOf(by):null;
    const rr=el("div","row");
    rr.appendChild(el("div","nm","<b>Корпус со списания</b><s>"+(P?P.ru:by)+
      " помнит дело и отдаёт корпус. Один раз.</s>"));
    const b=el("button","act gold","ПРИНЯТЬ");
    b.onclick=()=>{epiGiftTake(by);renderTab();};
    rr.appendChild(b);
    $body.appendChild(rr);
    break;
  }
}
/* ── книжка на столе: двенадцать людей и одна просьба за сводку ── */
function noteAskable(x){
  const N=(typeof chronNow==="function")?chronNow():0;
  return (x.asked|0)!==N;
}
function noteAsk(x,what){
  const N=(typeof chronNow==="function")?chronNow():0;
  if(!noteAskable(x))return "уже просили в эту сводку";
  x.asked=N;
  if(what==="fuel"){
    const st=stat();
    const add=Math.min(st.fuelMax-G.fuel,st.fuelMax*.35);
    G.fuel+=add;
    return "залили "+Math.round(add)+" сверх нормы";
  }
  if(what==="front"){
    const st=(typeof chronState==="function")?chronState():null;
    if(!st)return "не знает";
    for(const k of chronKeys()){
      const S=st.systems[k];
      if(S.front)return "фронт стоит у сектора "+k;
    }
    return "говорит, сейчас тихо";
  }
  return "выслушал и обещал помнить";
}
