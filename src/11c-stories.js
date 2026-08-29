/* ══════════════ истории: следы, а не задания ══════════════
   M129. Сто маленьких человеческих историй — это не сто квестов. История —
   два–пять СЛЕДОВ, разложенных по миру: строка в эфире, реплика в очереди
   места, фигура за столиком, вещь на стойке, содержимое капсулы, слух. Следы
   встречаются в любом порядке; история складывается в голове игрока, а не в
   журнале. Замысел целиком — docs/DESIGN-stories.md.

   ТРИ ПРАВИЛА. Мир рассказывает, игроку не рассказывают: текст называет детали,
   никогда — отношение. Дёшево: строки, адреса, условия, существующие кисти.
   Одна история — не больше трёх каналов.

   ЧЕГО НЕТ. Заказчика, награды, экрана завершения, маркера, счётчика, страницы
   в журнале. Игра помнит только, какие следы игрок видел (G.seen) — и ни в каком
   смысле не считает историю «пройденной».

   ВЫТЯГИВАНИЕ, А НЕ ПЛАНИРОВЩИК. Каналы спрашивают storyTraces(via,ctx), когда
   им нужно содержимое; повороты (turns) считаются лениво здесь же. В кадре
   ничего не ходит.

   ЯКОРЬ. Плавающая история («любой торговый узел») при первой встрече
   прибивается к месту и дальше живёт там: «тот парень» всегда на той же
   станции, а сто историй не требуют ста расставленных систем. */

const STORY_DAY=CEL_DAY;                 // сутки истории = сутки неба: минута игры
const STORY_PIN_CAP=4;                   // не больше стольких плавающих историй на одно место
const STORY_ETHER_SHARE=.34;             // эфир берёт строку истории не чаще раза из трёх

function storyDay(){return Math.floor(G.t/STORY_DAY);}
function storySeen(){return (G.seen||(G.seen={}));}
function storyPins(){return (G.storyPin||(G.storyPin={}));}
function storyFlags(){return (G.storyFlags||(G.storyFlags={}));}
function storyAll(){return (typeof STORIES!=="undefined")?STORIES:[];}
function storyById(id){for(const S of storyAll())if(S.id===id)return S;return null;}
function storyHasSeen(S,tid){return storySeen()[S.id+"."+tid]!=null;}
function storyFlag(S,f){const F=storyFlags()[S.id];return !!(F&&F[f]!=null);}
function storySetFlag(S,f){const F=storyFlags();(F[S.id]||(F[S.id]={}))[f]=storyDay();}

/* ── где мы ── всё, что нужно условиям и адресам, в одном объекте */
function storyCtx(extra){
  const sys=G.sys;
  const p=(G.surf&&G.surf.p)||(G.land&&G.land.p)||null;
  /* на станции ключ — система; на планете — система/планета: иначе история,
     прибитая к одному миру, всплывала бы на соседнем в той же системе */
  const c={sys,st:G.st||null,p,sx:G.sx,sy:G.sy,sysKey:sys?sys.key:null,
    key:sys?(G.st||!p?sys.key:sys.key+"/"+p.idx):null};
  if(extra)for(const k in extra)c[k]=extra[k];
  return c;
}

/* ── фиксированные адреса ──
   fixed:N — система по посеву, одна на всю галактику: ядро будущего региона.
   Ищется от начала координат кольцом 3–12 секторов; в системе обязана быть
   станция — иначе историю негде встретить. */
const STORY_FIX={};
function storyFixedAddr(n){
  if(STORY_FIX[n]!==undefined)return STORY_FIX[n];
  const r=rng(hashi(n*17+3,0x570,7));
  let out=null;
  for(let i=0;i<400&&!out;i++){
    const a=r()*TAU,d=3+r()*9;
    const sx=Math.round(Math.cos(a)*d),sy=Math.round(Math.sin(a)*d);
    if(!starAt(sx,sy))continue;
    const s=getSystem(sx,sy);
    if(s&&s.station)out=sx+","+sy;
  }
  STORY_FIX[n]=out;return out;
}
/* подходит ли место адресу истории. Возвращает ключ места или null. */
function storyAddrMatch(S,c){
  const at=S.at||"any";
  if(!c.key)return null;
  if(at.slice(0,6)==="fixed:")return storyFixedAddr(+at.slice(6))===c.key?c.key:null;
  if(at.slice(0,6)==="stype:")return c.st&&c.st.stype===at.slice(6)?c.key:null;
  if(at.slice(0,6)==="world:")return c.p&&c.p.type===at.slice(6)?c.key:null;
  if(at==="danger:far")return c.sys&&typeof sysDanger==="function"&&sysDanger(c.sys)>=.6&&c.st?c.key:null;
  if(at==="any")return c.st?c.key:null;
  if(at==="planet")return c.p?c.key:null;         // любой мир, на который сели
  if(at==="settle")return c.p&&typeof settleCanLive==="function"&&settleCanLive(c.p)?c.key:null;
  if(at==="tin")return c.p&&typeof tinCanLive==="function"&&tinCanLive(c.p)?c.key:null;
  if(at==="hours:core")return c.sys&&c.st&&typeof hoursDepthAt==="function"&&hoursDepthAt(c.sys.sx,c.sys.sy)===2?c.key:null;   /* ядро уезда (M157) */
  return null;
}
/* Бросок на якорь: плавающая история прибивается не к первому же подходящему
   месту, а к тому, на котором выпал её жребий, — иначе все «любые торговые
   узлы» сбились бы в стартовую станцию. Жребий детерминирован парой
   (история, место): вернулся — выпадет то же. */
function storyAnchorRoll(S,key){
  let h=0;for(let i=0;i<S.id.length;i++)h=(h*31+S.id.charCodeAt(i))>>>0;
  const p=key.split(",");
  const extra=(p[1]||"").indexOf("/")>=0?parseInt(p[1].split("/")[1])*17:0;
  return hashi(h,parseInt(p[0])*73+parseInt(p[1])+extra,0xA11)%3===0;
}
function storyPlace(S,c){
  const P=storyPins();
  if(P[S.id])return P[S.id];
  const key=storyAddrMatch(S,c);
  if(!key)return null;
  const fixed=(S.at||"").slice(0,6)==="fixed:";
  if(!fixed){
    if(!storyAnchorRoll(S,key))return null;
    let n=0;for(const id in P)if(P[id]===key)n++;
    if(n>=STORY_PIN_CAP)return null;
  }
  P[S.id]=key;
  return key;
}

/* ── повороты ── перемена мира по часам И ПО РУКЕ ИГРОКА (M259). Лениво.
   До M259 поворот умел только «увидел + прошли дни»: ни один из 18 поворотов
   в ста историях не зависел от того, что игрок СДЕЛАЛ (замер по 12k-*, разбор
   docs/DESIGN-story-craft.md §1). Теперь у поворота есть:
     when   — срабатывает только когда условие истинно (ждёт, не сгорает);
     unless — если в срок условие истинно, поворот НЕ происходит: ставится
              else-флаг, а если его нет — немой маркер «~set», и мир просто
              остаётся прежним.
   ЖЕЛЕЗНОЕ ПРАВИЛО ЯЗЫКА: развилка не предъявляется никогда. Ни один текст
   не говорит «потому что вы…» — игрок видит другое и не знает, что бывало
   иначе. Словарь условий тот же, что у следов (STORY_WHEN): поступки — это
   то, что игра и так помнит (визиты, открытка отсюда, посёлок под рукой,
   швы на корпусе), а не новая бухгалтерия. */
function storyTurns(S,c){
  if(!S.turns)return;
  for(const T of S.turns){
    if(storyFlag(S,T.set)||(T.else&&storyFlag(S,T.else))||storyFlag(S,"~"+T.set))continue;
    const d=storyDay();
    let due=false;
    if(T.day!=null)due=d>=T.day;
    else if(T.after){
      const k=T.after.slice(0,5)==="seen:"?T.after.slice(5):null;
      const from=k?storySeen()[S.id+"."+k]:null;
      if(from==null)continue;
      due=d-from>=(T.days|0);
    }
    if(!due)continue;
    if(T.when&&!storyWhen(S,{when:T.when},c))continue;
    if(T.unless&&storyWhen(S,{when:T.unless},c)){
      if(T.else)storySetFlag(S,T.else);else storySetFlag(S,"~"+T.set);
      continue;
    }
    storySetFlag(S,T.set);
  }
}

/* ── словарь условий ──
   Каждый ключ — чистая функция состояния. Неизвестный ключ — ошибка сборки,
   её ловит автотест (storyCheckWhen), а не тихий пропуск. */
const STORY_WHEN={
  visits:(v,S,c)=>((G.visits&&G.visits[c.key])|0)>=v,
  day:(v)=>storyDay()>=v,
  flag:(v,S)=>storyFlag(S,v),
  noflag:(v,S)=>!storyFlag(S,v),
  seen:(v,S)=>storyHasSeen(S,v),
  unseen:(v,S)=>!storyHasSeen(S,v),
  parrot:(v)=>!!G.parrot===!!v,
  eclipse:(v)=>((typeof celDark==="function"?celDark():0)>.02)===!!v,
  late:(v)=>((G.t%STORY_DAY)>STORY_DAY*.5)===!!v,     // вторая половина суток
  res:(v)=>{for(const k in v)if((G.cargo[k]|0)<v[k])return false;return true;},
  item:(v,S,c)=>c.item===v,
  strip:(v,S,c)=>{const L=G.strips||[];const p=(storyPins()[S.id]||"").split(",");
    return L.some(s=>v==="here"?(s.sx===parseInt(p[0])&&s.sy===parseInt(p[1])):true);},
  occ:(v,S,c)=>!!(G.occ&&G.occ[c.key])===!!v,
  freed:(v)=>(G.freed|0)>=v,
  doomNear:(v)=>!!(G.doomDead&&Object.keys(G.doomDead).length)===!!v,
  mode:(v)=>G.mode===v,
  /* связь как данные: след чужой истории виден — "story.trace" */
  seenOf:(v)=>storySeen()[v]!=null,
  unseenOf:(v)=>storySeen()[v]==null,
  /* ── поступки (M259): только то, что игра и так помнит ── */
  /* посёлок СИСТЕМЫ ИСТОРИИ под рукой наблюдателя (12td). Координаты берутся
     из ключа места ("sx,sy" или "sx,sy/pi"), как у strip, а не из c.sx/c.sy:
     через news поворот считается издалека, и там c.sx/c.sy — это координаты
     ИГРОКА. Дыру назвал автор (30.08): развилка мерялась бы по чужому адресу. */
  hand:(v,S,c)=>{
    let sx=c.sx,sy=c.sy;
    if(c.key){const m=/^(-?\d+),(-?\d+)/.exec(String(c.key));if(m){sx=+m[1];sy=+m[2];}}
    const st=(typeof settleAt==="function")?settleAt(sx,sy):null;
    return !!(st&&st.handAt)===!!v;},
  /* швов на текущем корпусе не меньше v (12s, M256): биографию видно и людям */
  seams:(v)=>((typeof seamsOf==="function")?seamsOf():0)>=v,
  /* Жестянку ЭТОГО места игрок хоть раз ставил на смену: T.last пишется
     только полным нарядом из рук игрока (12ta). Координаты — из ключа места,
     по той же причине, что у hand: через news c.sx/c.sy — это игрок */
  tinfed:(v,S,c)=>{
    let sx=c.sx,sy=c.sy;
    if(c.key){const m=/^(-?\d+),(-?\d+)/.exec(String(c.key));if(m){sx=+m[1];sy=+m[2];}}
    const T=(typeof tinAt==="function")?tinAt(sx,sy):null;
    return !!(T&&T.last)===!!v;},
  /* ни один из флагов не стоит: нужен следам историй, у чьих поворотов есть
     else-исход — «до поворота» это теперь два не-состояния, а не одно */
  none:(v,S)=>v.every(f=>!storyFlag(S,f)),
  /* хотя бы один стоит — зеркало none: «после поворота» с else-исходом это
     тоже два состояния, а след, общий для обеих ветвей, один (потолок следов) */
  any:(v,S)=>v.some(f=>storyFlag(S,f))
};
function storyWhen(S,t,c){
  const w=t.when;if(!w)return true;
  for(const k in w){const f=STORY_WHEN[k];if(!f)return false;if(!f(w[k],S,c))return false;}
  return true;
}
function storyCheckWhen(){
  const bad=[];
  for(const S of storyAll())for(const t of S.traces)if(t.when)
    for(const k in t.when)if(!STORY_WHEN[k])bad.push(S.id+"."+t.id+":"+k);
  return bad;
}

/* ── выдача ── все следы канала via, чьи адрес и условия истинны здесь и сейчас.
   Канал «news» не привязан к месту: слух может прийти о любой прибитой истории. */
function storyTraces(via,c){
  c=c||storyCtx();
  const out=[];
  for(const S of storyAll()){
    const key=via==="news"?storyPins()[S.id]:storyPlace(S,c);
    if(!key)continue;
    const cc=via==="news"?Object.assign({},c,{key}):c;
    /* повороту нужен контекст МЕСТА истории (cc, не c): слух через news не
       должен мерить визиты игрока по чужому адресу */
    storyTurns(S,cc);
    for(const t of S.traces){
      if(t.via!==via)continue;
      if(!storyWhen(S,t,cc))continue;
      out.push({S,t,key});
    }
  }
  return out;
}
/* показать след: единственная запись, которую система делает сама */
function storyShow(h){
  const k=h.S.id+"."+h.t.id,Z=storySeen();
  const first=Z[k]==null;
  if(first)Z[k]=storyDay();
  /* переносчик: след с carry птица запоминает и повторит там, где спросят
     (12x, список услышанного). Так история из одного места попадает в другое
     руками игрока, а не через журнал. */
  if(first&&h.t.carry&&h.t.text&&typeof heardAdd==="function"&&typeof parrotHas==="function"&&parrotHas()){
    const p=(h.key||"").split(",");
    heardAdd("story",{sx:parseInt(p[0])||0,sy:parseInt(p[1])||0,note:h.t.text});
  }
  return h.t;
}
/* из нескольких подходящих — сперва невиданный, потом по кругу от дня */
function storyPickOne(L){
  if(!L.length)return null;
  const fresh=L.filter(h=>!storyHasSeen(h.S,h.t.id));
  const pool=fresh.length?fresh:L;
  return pool[storyDay()%pool.length];
}

/* ══════════════ каналы ══════════════ */
/* эфир: строка истории вместо безликой, не чаще раза из трёх */
function storyEtherLine(r){
  if(!G.sys)return null;
  const L=storyTraces("ether",storyCtx());
  if(!L.length||r()>STORY_ETHER_SHARE)return null;
  const h=storyPickOne(L);storyShow(h);
  return h.t.text;
}
/* очередь места: реплика истории вклинивается перед общей */
function storyQueueLine(){
  if(!G.st)return null;
  const L=storyTraces("queue",storyCtx());
  /* невиданный след вклинивается всегда; виданный — лишь каждую третью посадку,
     остальное время говорит общая очередь: иначе место замолкает о своём */
  const fresh=L.filter(h=>!storyHasSeen(h.S,h.t.id));
  const h=fresh.length?storyPickOne(fresh):((visitHere()%3===0)?storyPickOne(L):null);
  if(!h)return null;
  storyShow(h);
  return {line:h.t.text,silent:h.t.text===null};
}
/* стол: ответ на вещь раньше общей таблицы */
function storyTableLine(kind){
  if(!G.st)return null;
  const h=storyPickOne(storyTraces("table",storyCtx({item:kind})));
  if(!h)return null;
  storyShow(h);
  return {line:h.t.text,silent:h.t.text===null};
}
/* находка: строка истории к содержимому капсулы или контейнера */
function storyFindLine(kind){
  const h=storyPickOne(storyTraces("find",storyCtx({item:kind})));
  if(!h)return null;
  storyShow(h);
  return h.t.text;
}
/* слух: о прибитой истории, с адресом её места */
function storyNewsItem(r){
  const L=storyTraces("news",storyCtx());
  if(!L.length||r()>.5){
    /* слух указывает на звено почтового круга (хвост M133): пока свёрток у
       вас, треть пустых слухов — о том, кто его ждёт и где */
    if(typeof postHolding==="function"&&postHolding()&&r()<.35){
      const P=postAll(),A=postAddrs(),k=A[P.stage];
      if(k&&P.stage<POST_LINKS.length){
        const q=k.split(",");
        return {id:"post",ru:"Говорят, свёрток опять пошёл по рукам. Ждёт его "+POST_LINKS[P.stage].who+".",sx:parseInt(q[0]),sy:parseInt(q[1])};
      }
    }
    return null;
  }
  const h=storyPickOne(L);storyShow(h);
  const p=h.key.split(",");
  return {id:"story",ru:h.t.text,sx:parseInt(p[0]),sy:parseInt(p[1])};
}

/* ── кантина: фигуры и вещи на стойке ──
   Канал без текста. Фигура садится на место (corner / far / end), вещь
   кладётся на столешницу. Кисти — те же, что у зала (cantFigure), плюс
   десяток мелких форм для вещей. Сцена не выбирает «одну из» — показываются
   все следы, чьи условия истинны: так пустой стол после поворота виден вместе
   с оставшимся стаканом. */
const STORY_SEAT={corner:.10,far:.50,end:.76,door:.26};
function storyCantScene(){
  if(!G.st)return [];
  const out=[];
  for(const h of storyTraces("cant",storyCtx())){storyShow(h);out.push(h.t.scene||{});}
  return out;
}
function storyCantFigures(c,W2,fy,cy){
  for(const sc of storyCantScene()){
    if(!sc.figure)continue;
    const x=W2*(STORY_SEAT[sc.seat]||.5);
    c.globalAlpha=sc.dim?.2:.42;
    cantFigure(c,x,cy+16+(sc.dim?-4:0),sc.col||[70,76,90],G.t*.017+x*.01,null,0);
    c.globalAlpha=1;
  }
}
function storyCantProps(c,W2,fy,cy){
  for(const sc of storyCantScene()){
    if(!sc.props)continue;
    let x=W2*(STORY_SEAT[sc.seat]||.5)-((sc.props.length-1)*7);
    for(const p of sc.props){storyProp(c,p,x,cy-7);x+=14;}
  }
}
/* вещи на столешнице: стакан, кружка, кепка, хлеб, палочки мелом, свеча, ключ */
function storyProp(c,p,x,y){
  c.save();c.lineWidth=1;
  if(p==="glass"){c.strokeStyle="rgba(200,230,240,.7)";c.strokeRect(x-3,y-9,6,9);
    c.fillStyle="rgba(200,230,240,.28)";c.fillRect(x-2.5,y-6,5,5.5);}
  else if(p==="glass_empty"){c.strokeStyle="rgba(200,230,240,.45)";c.strokeRect(x-3,y-9,6,9);}
  else if(p==="cup"){c.fillStyle="rgba(210,200,180,.85)";c.fillRect(x-3,y-7,6,7);
    c.strokeStyle="rgba(210,200,180,.85)";c.beginPath();c.arc(x+4,y-3.5,2,-1.4,1.4);c.stroke();}
  else if(p==="cap"){c.fillStyle="rgba(70,78,92,.95)";c.beginPath();c.ellipse(x,y-2,6,2.6,0,0,TAU);c.fill();
    c.fillRect(x-4,y-5,8,3);}
  else if(p==="bread"){c.fillStyle="rgba(188,140,86,.95)";c.beginPath();c.ellipse(x,y-3,7,3.2,0,0,TAU);c.fill();
    c.strokeStyle="rgba(120,80,40,.7)";c.beginPath();c.moveTo(x-4,y-4);c.lineTo(x+4,y-4);c.stroke();}
  else if(p==="tally"){c.strokeStyle="rgba(230,230,220,.8)";c.beginPath();
    for(let i=0;i<4;i++){c.moveTo(x-5+i*3,y-9);c.lineTo(x-5+i*3,y-2);}c.moveTo(x-6,y-3);c.lineTo(x+5,y-8);c.stroke();}
  else if(p==="candle"){c.fillStyle="rgba(230,220,190,.9)";c.fillRect(x-1.5,y-8,3,8);
    c.fillStyle="rgba(255,200,90,.9)";c.beginPath();c.ellipse(x,y-10,1.6,2.6,0,0,TAU);c.fill();}
  else if(p==="key"){c.strokeStyle="rgba(210,190,120,.9)";c.beginPath();c.arc(x-3,y-3,2.2,0,TAU);c.moveTo(x-1,y-3);c.lineTo(x+5,y-3);c.lineTo(x+5,y-1);c.stroke();}
  else if(p==="jar"){c.strokeStyle="rgba(180,220,200,.7)";c.strokeRect(x-4,y-9,8,9);c.fillStyle="rgba(120,180,140,.35)";c.fillRect(x-3.5,y-6,7,5.5);}
  else if(p==="paper"){c.fillStyle="rgba(230,226,210,.9)";c.fillRect(x-5,y-3,10,3);c.strokeStyle="rgba(60,60,60,.5)";c.beginPath();c.moveTo(x-3,y-1.5);c.lineTo(x+3,y-1.5);c.stroke();}
  else if(p==="stool_empty"){c.strokeStyle="rgba(127,230,216,.25)";c.strokeRect(x-5,y+4,10,3);c.beginPath();c.moveTo(x-4,y+7);c.lineTo(x-4,y+16);c.moveTo(x+4,y+7);c.lineTo(x+4,y+16);c.stroke();}
  c.restore();
}

/* ── проверки для автотестов: у каждого флага есть читатель, у каждой истории —
   от двух до пяти следов и не больше трёх каналов, труппа существует */
function storyLint(){
  const bad=[];
  const CASTT=(typeof CAST!=="undefined")?CAST:{};
  for(const S of storyAll()){
    if(!S.id)bad.push("история без id");
    if(!S.traces||S.traces.length<2||S.traces.length>7)bad.push(S.id+": следов "+(S.traces?S.traces.length:0));
    /* стойка и стол — одна поверхность (терминал станции); поверхностей не больше четырёх */
    const SURF={queue:"counter",table:"counter"};
    const vias=new Set(S.traces.map(t=>SURF[t.via]||t.via));
    if(vias.size>4)bad.push(S.id+": поверхностей "+vias.size);
    for(const t of S.traces)if(!["ether","queue","table","find","news","cant","land","cave","settle","tin"].includes(t.via))bad.push(S.id+"."+t.id+": канал "+t.via);
    for(const id of (S.cast||[]))if(!CASTT[id])bad.push(S.id+": нет в труппе "+id);
    for(const T of (S.turns||[])){
      /* флаг «читается» и списками none/any: у поворота с else-исходом общий
         для обеих ветвей след держит их через any, а до-поворотные — через none */
      const reads=f=>S.traces.some(t=>t.when&&(t.when.flag===f||t.when.noflag===f
        ||(t.when.none||[]).includes(f)||(t.when.any||[]).includes(f)));
      if(!reads(T.set))bad.push(S.id+": флаг "+T.set+" никто не читает");
      if(T.else&&!reads(T.else))bad.push(S.id+": флаг "+T.else+" никто не читает");
      for(const w of [T.when,T.unless])if(w)
        for(const k in w)if(!STORY_WHEN[k])bad.push(S.id+" turn:"+k);
    }
    const at=S.at||"any";
    if(!/^(any|planet|settle|tin|hours:core|danger:far|fixed:\d+|stype:\w+|world:\w+)$/.test(at))bad.push(S.id+": адрес "+at);
    const ids=new Set();for(const t of S.traces){if(ids.has(t.id))bad.push(S.id+": след "+t.id+" дважды");ids.add(t.id);}
  }
  return bad.concat(storyCheckWhen());
}

/* ── земля: посадка, пещера, посёлок, Жестянка ──
   Те же следы, но поверхность — планета: строка к сообщению о посадке, к входу
   в пещеру, к подсказке у посёлка или у машины. Адреса planet и world:T
   прибиваются к системе, как и станционные. */
function storyGroundLine(via){
  if(!G.sys)return null;
  const c=storyCtx();
  if(!c.p)return null;
  const h=storyPickOne(storyTraces(via,c));
  if(!h)return null;
  storyShow(h);
  return h.t.text;
}
/* подсказка у посёлка или машины: строка истории хвостом к подсказке.
   Подсказка ставится каждый кадр, поэтому выбор держится сутки (storyPickOne
   идёт по дню), а запись виденного — одна. */
function storyNote(via){
  const l=storyGroundLine(via);
  return l?"\n"+l:"";
}
