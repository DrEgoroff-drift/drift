/* ══════════════ семья механик: БЕЗОПАСНОСТЬ (M387, §15.1) ══════════════
   Пятая семья — про то, что бывает, когда держава смотрит в другую сторону.
   Две её части уже написаны раньше и здесь только называются: волна дезертиров
   после чистки живёт в `12b0-fx-pow` (M385), а блокада — это фронт, и пикет на
   нём разворачивает всех с M373. Новое здесь — четыре вещи:

   · **пиратский король** — бароны сговорились, и область неделю их. Держава
     оттуда ушла: пикетов нет, пиратов вдвое, и они на ранг выше. Убрать его
     может только толпа — счётчиком расчистки, как обряд;
   · **шпион на станции** — цены там врут. Не «выше» и не «ниже»: врут по
     каждому товару в свою сторону, и на этом можно заработать, если не лениться
     сверить с соседней станцией. Обе стороны прилавка двигаются вместе, иначе
     получилась бы машинка для печати денег;
   · **ретранслятор** — молчащую волну (M385) чинят: счётчик сканирований от
     толпы, и волна заговорила. До сегодняшнего дня она молчала просто «пока не
     пройдёт»; теперь у молчания есть управа;
   · **контрабанда как ответ на талоны** — талон даёт дешёвый бак раз в сводку.
     Второй бак по той же цене есть только у контрабандиста, вдвое дороже
     талона и вдвое дешевле прилавка, — и он ворованный. Провезёте его через
     досмотр той самой державы — это её топливо в ваших баках. */
const SEC_KING_EVERY=96;     /* раз в двадцать четыре дня */
const SEC_KING_LIVE=28;      /* и неделю он там хозяин */
const SEC_KING_GOAL=150;     /* столько расчистки — и его нет */
const SEC_KING_R2=36;        /* та же область, что у «Ревизии»: дом и полоса */
const SEC_SPY=40;            /* десять суток врущих цен */
const SEC_SPY_MAX=12;        /* и врут они не больше чем на двенадцать сотых */
const SEC_RELAY_GOAL=120;    /* столько сканирований чинит ретранслятор */
const SEC_PATROL=12;         /* трое суток досмотра */
/* ── пиратский король ──
   Область берётся не из состояния, а из календаря: «кто именно» тут не важно —
   важно, что в этой части круга неделю нет закона. Считать это из летописи
   было бы честнее по замыслу, но любой такой счёт пришлось бы делать по
   ПРОШЛОЙ сводке, то есть повтором внутри повтора (0.385.0 научил). Календарь
   же одинаков у всех по построению и не стоит ни одного шага. */
function secKingWindow(N){
  if(N===undefined)N=(typeof chronNow==="function")?chronNow():0;
  const n0=N-(N%SEC_KING_EVERY);
  return (N-n0<SEC_KING_LIVE)?n0:-1;      /* −1, а не 0: нулевая сводка тоже окно */
}
function secKingArea(N){
  const n0=secKingWindow(N);
  if(n0<0)return null;
  const i=hashi(n0,0x4B14,CHRON_SEED)%6;
  return {i,n0,x:CHRON_HOME[i][0],y:CHRON_HOME[i][1]};
}
/* сколько толпа уже расчистила в его области с той сводки, как он сел */
function secKingCount(A){
  A=A||secKingArea();
  if(!A||typeof warLed!=="function")return 0;
  const L=warLed(),N=(typeof chronNow==="function")?chronNow():0;
  let q=0;
  for(const n in L){
    if((n|0)<A.n0||(n|0)>N)continue;
    const body=L[n];
    for(const sys in body){
      if(sys==="__votes")continue;
      const p=sys.split(","),dx=(p[0]|0)-A.x,dy=(p[1]|0)-A.y;
      if(dx*dx+dy*dy>SEC_KING_R2)continue;
      const cell=body[sys].clear;
      if(cell)q+=cell.q|0;
    }
  }
  return q;
}
function secKingHere(sx,sy){
  const A=secKingArea();
  if(!A)return false;
  const dx=(sx===undefined?G.sx:sx)-A.x,dy=(sy===undefined?G.sy:sy)-A.y;
  if(dx*dx+dy*dy>SEC_KING_R2)return false;
  return secKingCount(A)<SEC_KING_GOAL;          /* толпа его уже сняла */
}
/* держава оттуда ушла: своих пикетов там нет */
function secNoPickets(sx,sy){return secKingHere(sx,sy);}
/* а пиратов вдвое, и они на ранг выше */
function secPirateMul(sx,sy){return secKingHere(sx,sy)?2:1;}
function secPirateRank(sx,sy){return secKingHere(sx,sy)?1:0;}
/* ── шпион на станции ──
   Утечка (M385) стоит державе трёх суток молчащей волны; шпион сидит дольше и
   тише — десять суток её станции считают цены по чужой подсказке. Врут они по
   каждому товару в свою сторону, а не «дороже» или «дешевле»: односторонняя
   ошибка была бы просто ещё одним множителем. */
function secSpyOn(by){
  const inc=(typeof chronIncOf==="function")?chronIncOf("spy",SEC_SPY):null;
  return !!(inc&&MAKER_KEYS[inc.p]===by);
}
/* спрашивают его на КАЖДЫЙ товар прилавка, а он лезет в строки летописи:
   считаем раз на сводку и систему, дальше — из кармана */
let SEC_SPY_CACHE={k:"",v:false};
function secSpyHere(sx,sy){
  sx=(sx===undefined)?G.sx:sx;sy=(sy===undefined)?G.sy:sy;
  const N=(typeof chronNow==="function")?chronNow():0;
  const key=N+"|"+(sx|0)+","+(sy|0);
  if(SEC_SPY_CACHE.k===key)return SEC_SPY_CACHE.v;
  const by=(typeof chronOwnerKey==="function")?chronOwnerKey(sx,sy):null;
  const v=!!(by&&secSpyOn(by));
  SEC_SPY_CACHE={k:key,v};
  return v;
}
function secSpyMul(k,sx,sy){
  if(!secSpyHere(sx,sy))return 1;
  /* целая арифметика: сотые, а не дроби — цену считают все клиенты одинаково */
  const h=hashi((sx===undefined?G.sx:sx)|0,(sy===undefined?G.sy:sy)|0,
    0x5B10^(k?k.charCodeAt(0)*131+k.length:0));
  const d=(h%(SEC_SPY_MAX*2+1))-SEC_SPY_MAX;
  return (100+d)/100;
}
/* ── ретранслятор ──
   Молчащую волну чинят сканированием: то же дело, что ищет пропавший флагман
   (§14), только цель другая. Пока не починили — волна молчит, и это слышно. */
function secRelayLeak(by){
  const inc=(typeof chronIncOf==="function")?chronIncOf("spy",SEC_SPY):null;
  return (inc&&MAKER_KEYS[inc.p]===by)?inc:null;
}
function secRelayCount(by){
  const inc=secRelayLeak(by);
  if(!inc||typeof warLed!=="function"||typeof chronOwner!=="function")return 0;
  const L=warLed(),N=(typeof chronNow==="function")?chronNow():0;
  let q=0;
  for(const n in L){
    if((n|0)<inc.N||(n|0)>N)continue;
    const body=L[n];
    for(const sys in body){
      if(sys==="__votes")continue;
      const p=sys.split(",");
      if(chronOwner(p[0]|0,p[1]|0)!==inc.p)continue;
      const cell=body[sys].scan;
      if(cell)q+=cell.q|0;
    }
  }
  return q;
}
function secRelayFixed(by){return secRelayCount(by)>=SEC_RELAY_GOAL;}
/* ── досмотр ──
   Держава смотрит всех подряд: пикет окликает вдвое дальше обычного. Ничего,
   кроме дальности, не меняется — четыре правила те же самые (M373). */
function secPatrolOn(sx,sy){
  const inc=(typeof chronIncOf==="function")?chronIncOf("patrol",SEC_PATROL):null;
  if(!inc||typeof chronOwner!=="function")return false;
  return chronOwner(sx===undefined?G.sx:sx,sy===undefined?G.sy:sy)===inc.p;
}
function secHailRangeMul(){return secPatrolOn()?2:1;}
/* ── контрабанда как ответ на талоны ──
   Талон даёт дешёвый бак раз в сводку. Второй такой бак есть только у
   контрабандиста: вдвое дороже талона, вдвое дешевле прилавка — и ворованный.
   Клеймо держится сутки: провезли через её же досмотр — это её топливо. */
function secCouponRite(){
  if(typeof riteLive!=="function")return null;
  for(const r of riteLive())if(r.key==="coupon")return r;
  return null;
}
function secSmugDue(){
  const R=secCouponRite();
  if(!R||typeof riteDone!=="function"||!riteDone("coupon"))return null;
  if(!G.sys||!G.sys.station)return null;
  const N=(typeof chronNow==="function")?chronNow():0;
  if((G.coupN|0)!==N)return null;                /* талон ещё не отоварен */
  const st=(typeof stat==="function")?stat():{fuelMax:100};
  const need=Math.ceil((st.fuelMax||100)-G.fuel);
  if(need<=0)return null;
  /* талон на эту сводку уже отоварен, значит прилавок считает по обычной цене:
     контрабандист берёт её половину — вдвое дороже талона и вдвое дешевле
     стойки. Ровно та щель, ради которой контрабанда и заводится */
  const base=(typeof fuelPriceHere==="function")?fuelPriceHere():10;
  return {p:R.p,per:Math.max(1,Math.round(base*.5)),need};
}
function secSmugBuy(){
  const D=secSmugDue();
  if(!D)return false;
  const can=Math.min(D.need,Math.floor(G.credits/D.per));
  if(can<=0){say("Не хватает кредитов");return false;}
  G.credits-=can*D.per;G.fuel+=can;
  G.smugN=(typeof chronNow==="function")?chronNow():0;
  G.smugBy=MAKER_KEYS[D.p];
  tell("warn","Бак мимо талона","КОНТРАБАНДА\nэто топливо по чужому талону\nдосмотр той же державы его узнает");
  return true;
}
/* клеймо живо четыре сводки — сутки */
function secSmugHot(by){
  const N=(typeof chronNow==="function")?chronNow():0;
  return !!(G.smugBy&&(!by||G.smugBy===by)&&(N-(G.smugN|0))<4);
}
/* ── доска: счётчик ретранслятора и контрабандист ── */
function secBlock(){
  if(typeof $body==="undefined")return;
  const by=(typeof chronOwnerKey==="function")?chronOwnerKey(G.sx,G.sy):null;
  if(by&&typeof powScandalOn==="function"&&powScandalOn(by)&&!secRelayFixed(by)){
    const P=(typeof powerOf==="function")?powerOf(by):null;
    $body.appendChild(el("div","sec","РЕТРАНСЛЯТОР МОЛЧИТ"));
    const r=el("div","row");
    r.appendChild(el("div","nm","<b>"+(P?P.ru:by)+"</b><s>волну чинят сканированием · собрано "+
      secRelayCount(by)+" из "+SEC_RELAY_GOAL+"</s>"));
    const b=el("button","act","ПРОСКАНИРОВАТЬ");
    b.onclick=()=>{if(typeof warPut==="function")warPut("scan",1);say("СКАНИРОВАНИЕ ОТПРАВЛЕНО",120);renderTab();};
    r.appendChild(b);
    $body.appendChild(r);
  }
  const D=secSmugDue();
  if(D){
    $body.appendChild(el("div","sec","МИМО ТАЛОНА"));
    const r=el("div","row");
    r.appendChild(el("div","nm","<b>Бак без талона</b><s>"+D.per+" кр за единицу · вдвое дешевле прилавка"+
      " · и это чужой талон</s>"));
    const b=el("button","act","ВЗЯТЬ");
    b.onclick=()=>{secSmugBuy();renderTab();};
    r.appendChild(b);
    $body.appendChild(r);
  }
}
function secLine(){
  const out=[];
  if(secKingHere())out.push("ПИРАТСКИЙ КОРОЛЬ · ПИКЕТОВ НЕТ · РАСЧИЩЕНО "+
    secKingCount()+" ИЗ "+SEC_KING_GOAL);
  if(secSpyHere())out.push("ШПИОН · ЦЕНЫ ЗДЕСЬ ВРУТ");
  if(secPatrolOn())out.push("ДОСМОТР · ОКЛИКАЮТ ВДВОЕ ДАЛЬШЕ");
  if(secSmugHot())out.push("В БАКАХ ЧУЖОЙ ТАЛОН");
  return out.join(" · ");
}
