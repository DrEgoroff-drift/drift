/* ══════════════ приёмники как места ══════════════
   Автор, 26.08.2026, отвечая на вопрос, где должен жить приёмник, когда открыт
   экран: «давай отдельную панель приемники и они дают доход или бонусы или
   нихуя не дают, просто ты знаешь где они и можешь как в навигаторе проложить
   маршрут». Подтверждено 27.08.2026.

   ЧТО ЭТО. В мире стоят передатчики: маяки, бакены, ретрансляторы,
   наблюдательные пункты, метеопосты, зимовки. Они не станции: пристыковаться
   не к чему, торговли нет, вкладок нет. У каждого есть место, позывной, голос
   и — иногда — польза. С бумаги на столе по нему прокладывается курс тем же
   тычком, что и по цене: тот единственный жест, который есть у журнала.

   КАК ИХ НАХОДЯТ. Не списком и не кнопкой «сканировать». У каждого своя
   частота, и лежит она В ШУМЕ — между постоянными диапазонами, там, где до
   сих пор было только «…шшш…». Крутишь ручку медленно — ловишь далёкую мачту;
   крутишь быстро — проскакиваешь мимо. Ровно так это устроено у радистов, и
   ровно так уже собираются позывные дальних корреспондентов (11an-qsl).
   Услышал разборчиво — записал: кнопки «записать» нет и здесь.

   ЧТО ОНИ ДАЮТ — три ответа, и все три честные:
   · НИЧЕГО. Маяк горит, бакен мигает, пункт считает пролетевшее. Польза в
     том, что ты знаешь, где они, и можешь туда пойти.
   · ЧИЩЕ ЭФИР. Ретранслятор поднимает разборчивость в своих секторах: слова
     перестают выпадать по краям диапазонов, и биржа со слуха пишется дальше
     от середины шкалы. Работает независимо от того, знаете вы о нём или нет
     (он же передаёт), а панель объясняет, ПОЧЕМУ здесь слышно чисто.
   · ПЛАТИТ. Платит тот, кто там живёт: метеопост и зимовка. Не за проезд —
     за привезённые новости, раз в трое суток, немного и словами человека.

   ПРАВИЛА ФАЙЛА:
   1. Ничего не сочиняется на лету: где стоит, какого рода и на какой частоте —
      считается от посева сектора. Хранится только то, что игрок сделал:
      услышал (день) и когда ему в последний раз платили.
   2. Над миром не появляется ничего. Ни стрелки, ни маркера, ни «новой цели».
      Есть бумага с адресом и штурман, который по ней проложит курс. */

/* род передатчика. `pay` — только у обитаемых: платит тот, кто там живёт */
const RELAY_KINDS=[
  {k:"beacon",ru:"маяк",                 call:"МК",give:"none",w:2.4,
   what:"ничего не даёт — горит",
   lines:["…маяк. Горю ровно. Больше про меня знать нечего.",
          "…маяк. Проверка: раз, два. Слышит меня кто-нибудь — хорошо, не слышит — тоже хорошо.",
          "…маяк. Тут за сутки ни одного борта. Обычное дело."]},
  {k:"buoy",  ru:"бакен",                call:"БК",give:"none",w:2.0,
   what:"ничего не даёт — мигает",
   lines:["…бакен. Мигаю. Мигаю. Мигаю.",
          "…бакен на краю поля. Обходите справа, слева камни.",
          "…бакен. Меня ставили на два года, стою девятый."]},
  {k:"relay", ru:"ретранслятор",         call:"РТ",give:"ear",w:1.6,
   what:"держит эфир чистым вокруг себя",
   lines:["…ретранслятор. Гоню чужое дальше, своего не имею.",
          "…ретранслятор. Если меня слышно — значит, и вас теперь слышно.",
          "…ретранслятор. Работаю на приём и на передачу, обедаю по расписанию."]},
  {k:"obs",   ru:"наблюдательный пункт", call:"НП",give:"none",w:1.2,
   what:"ничего не даёт — считает",
   lines:["…пункт наблюдения. Считаю то, что мимо летит. Насчитал много.",
          "…пункт. За неделю три борта и одна комета. Комета была лучше.",
          "…пункт. Записываю всё, докладываю раз в месяц, читает это никто."]},
  {k:"met",   ru:"метеопост",            call:"МП",give:"pay",w:1.1,
   what:"платит за привезённые новости",
   lines:["…метеопост. Давление падает третьи сутки, а мне и рассказать некому.",
          "…метеопост. Кто идёт мимо — заходите, я тут один со своими приборами.",
          "…метеопост. У меня всё меряется, кроме скуки."]},
  {k:"winter",ru:"зимовка",              call:"ЗМ",give:"pay",w:.8,
   what:"платит за привезённые новости",
   lines:["…зимовка. Нас двое, продуктов на четверых, разговоров — ни на кого.",
          "…зимовка. Если кто в наших краях — приходите. Печь тёплая.",
          "…зимовка. Смена через сто дней. Считаем вслух, чтобы не сбиться."]}
];
const RELAY_BY={};RELAY_KINDS.forEach(K=>RELAY_BY[K.k]=K);
/* щели между постоянными диапазонами (25e): вот где живут дальние мачты */
const RELAY_GAPS=[[0,.115],[.305,.395],[.585,.655],[.805,.875]];
const RELAY_REACH=5;        /* за сколько секторов мачту вообще слышно */
const RELAY_EAR=2;          /* на сколько секторов ретранслятор чистит эфир */
const RELAY_PAY_WIN=3;      /* платят раз в трое суток: это работа, а не кран */

/* ── где стоят ──
   Считается от посева, как всё в этом мире. Станции тут ни при чём: мачты
   ставят там, где НЕТ станции, — иначе они не нужны. Чем дальше от нуля, тем
   их больше: обжитая середина обходится проводами, а на краю только эфир. */
function relayOf(sx,sy){
  sx|=0;sy|=0;
  if(!starAt(sx,sy))return null;
  const r=rng(hashi(sx,sy,0x9EA1));
  const far=sysDanger(sx,sy);
  if(r()>=.09+.23*far)return null;
  const S=getSystem(sx,sy);
  if(S.station)return null;
  let tot=0;for(const K of RELAY_KINDS)tot+=K.w;
  let t=r()*tot,K=RELAY_KINDS[0];
  for(const C of RELAY_KINDS){t-=C.w;if(t<=0){K=C;break;}}
  const num=2+Math.floor(r()*97);
  return {key:sx+","+sy,sx,sy,k:K.k,ru:K.ru,give:K.give,what:K.what,
          call:K.call+"-"+num,name:genName(r),sys:S.name,
          line:K.lines[Math.floor(r()*K.lines.length)]};
}
/* своя частота — в щели между диапазонами, всегда на одном месте */
function relayFreq(R){
  const r=rng(hashi(R.sx|0,R.sy|0,0x51F0));
  const g=RELAY_GAPS[Math.floor(r()*RELAY_GAPS.length)];
  return +(g[0]+.022+r()*(g[1]-g[0]-.044)).toFixed(4);
}
/* ── кого слышно отсюда ──
   Перебор соседних секторов недёшев (getSystem строит систему), поэтому список
   считается один раз на сектор и живёт, пока игрок в нём. */
let RELAY_NEAR=null;
function relaysNear(sx,sy){
  sx|=0;sy|=0;
  const key=sx+","+sy;
  if(RELAY_NEAR&&RELAY_NEAR.key===key)return RELAY_NEAR.list;
  const L=[];
  for(let dx=-RELAY_REACH;dx<=RELAY_REACH;dx++)for(let dy=-RELAY_REACH;dy<=RELAY_REACH;dy++){
    const d=Math.hypot(dx,dy);
    if(d>RELAY_REACH)continue;
    const R=relayOf(sx+dx,sy+dy);
    if(R){R.d=d;R.f=relayFreq(R);L.push(R);}
  }
  L.sort((a,b)=>a.d-b.d);
  RELAY_NEAR={key,list:L};
  return L;
}
/* ── ретранслятор чистит эфир ──
   Не спрашивает, знает ли о нём игрок: он передаёт, а не одолжение делает.
   Панель потом объяснит, почему в этих секторах слышно чище. */
function relayEar(sx,sy){
  const L=relaysNear(sx===undefined?G.sx:sx,sy===undefined?G.sy:sy);
  for(const R of L)if(R.give==="ear"&&R.d<=RELAY_EAR)return .18;
  return 0;
}
/* ── что ловится на этой частоте ──
   Качество складывается из двух: как точно попали ручкой и как далеко мачта.
   Дальнюю на краю настройки не разобрать — и это правильно. */
function relayAtFreq(f){
  const L=relaysNear(G.sx,G.sy);
  let best=null,bq=0;
  for(const R of L){
    const dq=clamp(1-Math.abs(f-R.f)/.016,0,1);
    if(dq<=0)continue;
    const far=clamp(1-R.d/(RELAY_REACH+1),0,1);
    const q=clamp(dq*(.45+.55*far)+relayEar(),0,1);
    if(q>bq){bq=q;best=R;}
  }
  return best?{R:best,q:bq}:null;
}

/* ── бумага ──
   Хранится только то, что игрок сделал: услышал и когда платили. */
function relayAll(){
  if(!G.relay||typeof G.relay!=="object")G.relay={};
  return G.relay;
}
function relayKnown(key){return !!relayAll()[key];}
/* услышал — записал. Кнопки нет: адрес остаётся в голове от того, что его
   назвали вслух. Строка в тетради — одна, при первой записи */
function relayWrite(R){
  const A=relayAll();
  if(A[R.key])return false;
  A[R.key]={k:R.k,call:R.call,name:R.name,sx:R.sx,sy:R.sy,
            day:(typeof celDay==="function"?celDay():0)};
  if(typeof logAdd==="function")
    logAdd("ether",R.call+" «"+R.name+"» · "+R.ru+" · сектор "+R.sx+":"+R.sy+" — записан");
  return true;
}
/* что сказать в эфир, когда ручка стоит на его частоте: сперва он называется
   и даёт адрес (иначе записывать было бы нечего), потом просто говорит */
function relaySpeak(R,q){
  if(q>.55&&!relayKnown(R.key)){
    relayWrite(R);
    return "…"+R.call+", "+R.ru+" «"+R.name+"», сектор "+R.sx+":"+R.sy+". "+
           R.line.replace(/^…[^.]*\.\s*/,"");
  }
  return R.line;
}
/* ── платит тот, кто там живёт ──
   На приход в сектор: не за проезд, а за привезённые новости. Раз в трое
   суток, немного, и говорит это человек, а не игра. */
function relayArrive(){
  const R=relayOf(G.sx,G.sy);
  if(!R)return null;
  relayWrite(R);                     /* пришёл сам — увидел мачту своими глазами */
  if(R.give!=="pay")return null;
  const rec=relayAll()[R.key],day=(typeof celDay==="function"?celDay():0);
  if(!rec)return null;
  if(rec.paid!=null&&day-rec.paid<RELAY_PAY_WIN)return null;
  const sum=30+Math.round(70*sysDanger(R.sx,R.sy));
  rec.paid=day;
  /* через единственную воронку дохода (12j-home): дом растёт ровно с того,
     что заработал игрок, и источник, заведённый мимо неё, не был бы учтён */
  earn(sum,"приёмник");
  const who=R.k==="winter"?"зимовка":"метеопост";
  if(typeof logAdd==="function")
    logAdd("good",R.call+" · "+who+" «"+R.name+"»: «Спасибо, что зашли. За новости — "+
           sum+" кр, у нас на это статья есть»");
  if(typeof say==="function")say(R.call+" · за новости "+sum+" кр");
  return sum;
}

/* ── панель ──
   Строка — это адрес, и по ней прокладывается курс: тот же тычок, что у цен
   и у дел. Отдельно сказано, слышно ли мачту отсюда и на какой она частоте, —
   потому что приёмник и есть весь механизм. */
function relayList(){
  const A=relayAll(),L=[];
  for(const k in A){
    const a=A[k],K=RELAY_BY[a.k]||RELAY_KINDS[0];
    L.push({key:k,call:a.call,name:a.name,sx:a.sx|0,sy:a.sy|0,day:a.day|0,paid:a.paid,
            ru:K.ru,give:K.give,what:K.what,f:relayFreq({sx:a.sx|0,sy:a.sy|0}),
            d:Math.hypot((a.sx|0)-G.sx,(a.sy|0)-G.sy)});
  }
  L.sort((a,b)=>a.d-b.d);
  return L;
}
/* ── шкала на бумаге ──
   Панель приёмников была бы коротким экраном с четырьмя строками и половиной
   листа пустоты — ровно та жалоба плейтеста про «экран ни о чём». Показывать
   тут есть что, и это самое полезное, что вообще можно показать: САМА ШКАЛА.
   Постоянные диапазоны стоят блоками, пойманные мачты — засечками между ними,
   и сразу видно главное правило — искать надо в щелях. Заодно видно, где
   сейчас стоит ручка. */
function relayDial(box){
  const row=document.createElement("div");row.className="li";
  const em=document.createElement("em");em.textContent="шкала";
  const sp=document.createElement("span");
  const st=document.createElement("div");
  st.style.cssText="position:relative;height:30px;margin:2px 0 4px;border:1px solid rgba(122,90,54,.55);border-radius:2px;background:rgba(120,96,56,.07)";
  for(const B of RADIO_BANDS){
    const b=document.createElement("div");
    b.style.cssText="position:absolute;top:0;bottom:0;background:rgba(127,230,216,.10);"+
      "border-left:1px solid rgba(122,90,54,.45);border-right:1px solid rgba(122,90,54,.45);"+
      "font:8px ui-monospace,monospace;color:#8a7350;text-align:center;line-height:30px;overflow:hidden;"+
      "left:"+(B.lo*100).toFixed(1)+"%;width:"+((B.hi-B.lo)*100).toFixed(1)+"%";
    b.textContent=B.ru;
    st.appendChild(b);
  }
  for(const R of relayList()){
    const t=document.createElement("i");
    /* краски листа, а не пульта: на бумаге неон выцветает в грязь */
    const col=R.give==="pay"?"#7a5410":R.give==="ear"?"#1f5f57":"#6b6047";
    t.title=R.call+" · "+R.ru;
    t.style.cssText="position:absolute;top:2px;height:26px;width:3px;background:"+col+";"+
      "left:"+(R.f*100).toFixed(2)+"%";
    st.appendChild(t);
  }
  /* где сейчас стоит ручка: то же деление, что на пульте */
  const kn=document.createElement("i");
  kn.style.cssText="position:absolute;top:-3px;height:36px;width:1px;background:rgba(138,50,38,.85);"+
    "left:"+(clamp(G.radioF==null?.05:G.radioF,0,1)*100).toFixed(2)+"%";
  st.appendChild(kn);
  sp.appendChild(st);
  const cap=document.createElement("div");
  cap.style.cssText="font-size:11px;color:#8b7d61";
  cap.textContent="постоянные диапазоны стоят блоками, мачты — засечками между ними: искать их надо в щелях, медленной ручкой";
  sp.appendChild(cap);
  row.appendChild(em);row.appendChild(sp);box.appendChild(row);
}
function renderRelays(box){
  box.textContent="";
  const L=relayList();
  if(!L.length){
    tableRow(box,"dim","","приёмников ещё не слышали: их частоты лежат в шуме, между диапазонами");
    return;
  }
  tableRow(box,"head","","ПРИЁМНИКИ · КОГО СЛЫШАЛИ И ГДЕ ОН СТОИТ · ТЫЧОК — КУРС ТУДА");
  relayDial(box);
  for(const R of L){
    const row=document.createElement("div");row.className="li";
    const em=document.createElement("em");em.textContent=R.sx+":"+R.sy;
    const sp=document.createElement("span");
    const near=R.d<=RELAY_REACH;
    const gives=R.give==="pay"?"<b style=\"color:#7a5410\">платит за новости</b>"
              :R.give==="ear"?"<b style=\"color:#2b5a52\">держит эфир чистым</b>"
              :"<i style=\"color:#8b7d61\">ничего не даёт</i>";
    /* расстояние стоит всегда, а не только когда мачту не слышно: это первое,
       что решает, идти туда или нет */
    const away=R.d<.5?"вы здесь":Math.round(R.d)+" сект.";
    sp.innerHTML="<b>"+R.call+" «"+R.name+"»</b> · "+R.ru+" · "+gives+
      "<br>"+away+" · "+(near?"слышно отсюда":"отсюда не слышно")+
      " · частота "+R.f.toFixed(3)+" · записан в день "+R.day;
    row.appendChild(em);row.appendChild(sp);
    if(typeof gotoSector==="function"){
      row.style.cursor="pointer";
      row.onclick=()=>{gotoSector(R.sx,R.sy,R.call+" · "+R.ru);};
    }
    box.appendChild(row);
  }
}
