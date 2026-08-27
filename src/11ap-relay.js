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
/* ── прилёт в сектор ──
   Мачту видно с порога системы: она нарисована и стоит на своей точке, значит
   делать вид, что игрок о ней не знает, было бы ложью — записываем. Платят же
   не за прыжок, а за визит: новости привозят человеку в руки (relayServe). */
function relayArrive(){
  const R=relayOf(G.sx,G.sy);
  if(!R)return null;
  return relayWrite(R)?R:null;
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

/* ══════════════ у мачты есть тело ══════════════
   M220, хвост M218. Приёмник был строкой на бумаге и голосом в шуме: прилетев
   на его адрес, игрок не находил там НИЧЕГО. Место, в котором нечего увидеть,
   местом не становится — оно так и остаётся координатой.

   Теперь в системе стоит сама мачта: своя точка на орбите, свой силуэт по роду
   и своё дело, если к ней подойти. Правило то же, что у находок и у всего
   собранного из кусков: сперва тёмная масса, всё навесное внутри обвода, один
   свет последним — и опознаётся оно формой, а не подписью.

   ПЛАТЯТ ТЕПЕРЬ ЗА ВИЗИТ, А НЕ ЗА ПРЫЖОК. Пока денег хватало долететь до
   сектора, это был налог на перемещение; новости привозят человеку в руки,
   значит к нему надо подойти. Прилёт по-прежнему записывает мачту на бумагу:
   её видно с порога системы, и делать вид, что нет, было бы ложью. */
function relaySpot(R){
  const r=rng(hashi(R.sx|0,R.sy|0,0x7B0D));
  const a=r()*TAU;
  /* ── и обязательно ВНУТРИ гравитационного якоря ──
     Первый счёт ставил мачту на 900…2600, а край системы считается от пояса
     (`(belt.orbit||2400)*1.6`, 17-mode-system) и в системе с тесным поясом
     оказывается ближе 2400. Мачта тогда стоит за краем: корабль доворачивает
     к звезде и до неё не доходит НИКОГДА. Место, до которого нельзя долететь,
     хуже, чем никакого места. */
  const sys=getSystem(R.sx|0,R.sy|0);
  const rEdge=((sys&&sys.belt&&sys.belt.orbit)||2400)*1.6;
  const rad=Math.min(900+r()*1700,rEdge*.78);
  return {x:Math.cos(a)*rad,y:Math.sin(a)*rad};
}
/* ── дело у мачты ──
   Обитаемой везут новости, у необитаемой просто стоят и слушают. И то и другое
   кончается одной строкой в тетради: больше там ничего не происходит. */
function relayServe(R){
  relayWrite(R);
  const rec=relayAll()[R.key],day=(typeof celDay==="function"?celDay():0);
  if(!rec)return 0;
  if(R.give!=="pay"){
    if(typeof logAdd==="function")logAdd("ether",R.call+" · "+R.line);
    if(typeof say==="function")say(R.call+"\n"+R.line,240);
    return 0;
  }
  if(rec.paid!=null&&day-rec.paid<RELAY_PAY_WIN){
    if(typeof say==="function")say(R.call+" · новости уже привозили",200);
    return 0;
  }
  const sum=30+Math.round(70*sysDanger(R.sx,R.sy));
  rec.paid=day;
  /* через единственную воронку дохода (12j-home) */
  earn(sum,"приёмник");
  const who=R.k==="winter"?"зимовка":"метеопост";
  if(typeof logAdd==="function")
    logAdd("good",R.call+" · "+who+" «"+R.name+"»: «Спасибо, что зашли. За новости — "+
           sum+" кр, у нас на это статья есть»");
  if(typeof say==="function")say(R.call+" · за новости "+sum+" кр",240);
  return sum;
}
function relayInteract(sh){
  const R=relayOf(G.sx,G.sy);
  if(!R)return false;
  const P=relaySpot(R);
  if(Math.hypot(sh.x-P.x,sh.y-P.y)>250)return false;
  const rec=relayAll()[R.key],day=(typeof celDay==="function"?celDay():0);
  const fresh=!!(rec&&rec.paid!=null&&day-rec.paid<RELAY_PAY_WIN);
  G.prompt=R.call+" · "+R.ru.toUpperCase()+" «"+R.name.toUpperCase()+"»"+
    (R.give==="pay"
      ?(fresh?"\nновости здесь уже слышали":"\nДЕЙСТВИЕ — ПРИВЕЗТИ НОВОСТИ")
      :"\nДЕЙСТВИЕ — ПОСЛУШАТЬ");
  if(actEdge)relayServe(R);
  return true;
}
/* ── силуэт ──
   Шесть родов, шесть форм. Обитаемые узнаются мгновенно и не по подписи: у них
   горит окно. Всё остальное — тёмная масса на фоне пустоты с одной кромкой,
   пойманной от звезды: она в центре системы, значит свет всегда с той стороны. */
function relayDrawSystem(zx,zy,Z){
  const R=relayOf(G.sx,G.sy);
  if(!R)return;
  const P=relaySpot(R);
  const x=zx(P.x),y=zy(P.y);
  if(x<-90||x>W+90||y<-90||y>H+90)return;
  const s=clamp(Z,.5,1.5);
  const lit=P.x<0?1:-1;                       /* с какой стороны звезда */
  const blink=(Math.sin(G.t*.06+(R.sx*7+R.sy*13))>.2);
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  const dark="rgba(20,23,29,.96)", edge="rgba(0,0,0,.55)";
  const rim="rgba(196,206,220,.55)";
  ctx.lineWidth=.9;
  /* основание: обломок, на котором всё стоит. Мачта в пустоте сама по себе
     висела бы ни на чём, и весь силуэт читался бы значком */
  ctx.fillStyle=dark;ctx.strokeStyle=edge;
  ctx.beginPath();
  ctx.moveTo(-15,6);ctx.lineTo(-9,1);ctx.lineTo(2,0);ctx.lineTo(13,4);
  ctx.lineTo(16,9);ctx.lineTo(-11,11);ctx.closePath();
  ctx.fill();ctx.stroke();
  /* кромка обломка со стороны звезды: без неё тёмная масса на чёрном не видна
     вовсе, и мачта висит ни на чём */
  ctx.strokeStyle=rim;ctx.lineWidth=1.2;
  ctx.beginPath();
  if(lit>0){ctx.moveTo(-15,6);ctx.lineTo(-9,1);ctx.lineTo(2,0);}
  else{ctx.moveTo(2,0);ctx.lineTo(13,4);ctx.lineTo(16,9);}
  ctx.stroke();ctx.lineWidth=.9;
  const mast=(h,w)=>{                          /* решётчатая мачта */
    ctx.strokeStyle="rgba(96,104,116,.9)";ctx.lineWidth=1.2;
    ctx.beginPath();ctx.moveTo(-w,0);ctx.lineTo(-w*.4,-h);
    ctx.moveTo(w,0);ctx.lineTo(w*.4,-h);ctx.stroke();
    ctx.lineWidth=.7;ctx.beginPath();
    for(let i=1;i<5;i++){
      const t=i/5, yy=-h*t, ww=w*(1-.6*t);
      ctx.moveTo(-ww,yy);ctx.lineTo(ww,yy);
    }
    ctx.stroke();
  };
  const lamp=(px,py,col)=>{
    if(!blink)return;
    ctx.save();ctx.globalCompositeOperation="lighter";
    const g=ctx.createRadialGradient(px,py,0,px,py,9);
    g.addColorStop(0,col);g.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(px,py,9,0,TAU);ctx.fill();
    ctx.restore();
  };
  const hut=(w,h,win)=>{                       /* жилой блок с окном */
    ctx.fillStyle=dark;ctx.strokeStyle=edge;
    ctx.beginPath();ctx.rect(-w/2,-h,w,h);ctx.fill();ctx.stroke();
    ctx.fillStyle=rim;ctx.fillRect(lit<0?w/2-1:-w/2,-h,1,h);   /* кромка от звезды */
    if(win){
      ctx.fillStyle="rgba(255,206,132,.92)";
      ctx.fillRect(-w*.24,-h*.72,w*.2,h*.28);
      ctx.save();ctx.globalCompositeOperation="lighter";
      const g=ctx.createRadialGradient(-w*.14,-h*.58,0,-w*.14,-h*.58,16);
      g.addColorStop(0,"rgba(255,196,120,.35)");g.addColorStop(1,"rgba(0,0,0,0)");
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(-w*.14,-h*.58,16,0,TAU);ctx.fill();
      ctx.restore();
    }
  };
  if(R.k==="beacon"){
    mast(30,5);
    ctx.fillStyle=dark;ctx.strokeStyle=edge;ctx.lineWidth=.9;
    ctx.beginPath();ctx.ellipse(0,-32,4.4,3.4,0,0,TAU);ctx.fill();ctx.stroke();
    lamp(0,-32,"rgba(255,168,120,.85)");
  }else if(R.k==="buoy"){
    ctx.fillStyle=dark;ctx.strokeStyle=edge;
    ctx.beginPath();ctx.rect(-6,-16,12,16);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(-6,-13);ctx.lineTo(-13,-9);ctx.lineTo(-6,-6);ctx.closePath();
    ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(6,-13);ctx.lineTo(13,-9);ctx.lineTo(6,-6);ctx.closePath();
    ctx.fill();ctx.stroke();
    ctx.fillStyle=rim;ctx.fillRect(lit<0?5:-6,-16,1,16);
    lamp(0,-18,"rgba(180,230,255,.8)");
  }else if(R.k==="relay"){
    mast(20,4.5);
    ctx.save();ctx.translate(0,-21);ctx.rotate(lit*.5);
    ctx.fillStyle=dark;ctx.strokeStyle=edge;
    ctx.beginPath();ctx.ellipse(0,0,11,4.5,0,Math.PI,TAU);ctx.fill();ctx.stroke();
    ctx.strokeStyle="rgba(150,164,180,.75)";ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-6);ctx.stroke();
    ctx.beginPath();ctx.arc(0,-6,1.6,0,TAU);ctx.stroke();
    ctx.restore();
  }else if(R.k==="obs"){
    ctx.fillStyle=dark;ctx.strokeStyle=edge;
    ctx.beginPath();ctx.rect(-7,-13,14,13);ctx.fill();ctx.stroke();
    ctx.save();ctx.rotate(-.6*lit);
    ctx.beginPath();ctx.rect(-3,-26,6,16);ctx.fill();ctx.stroke();
    ctx.fillStyle="rgba(120,150,180,.5)";ctx.fillRect(-2.4,-26,4.8,1.6);
    ctx.restore();
    ctx.fillStyle="rgba(40,58,86,.9)";ctx.strokeStyle=edge;
    ctx.beginPath();ctx.rect(7,-11,9,6);ctx.fill();ctx.stroke();
    ctx.fillStyle=rim;ctx.fillRect(lit<0?6:-7,-13,1,13);
  }else if(R.k==="met"){
    hut(16,12,true);
    ctx.save();ctx.translate(9,-11);
    mast(14,2.4);
    ctx.strokeStyle="rgba(150,164,180,.8)";ctx.lineWidth=.9;
    ctx.beginPath();ctx.moveTo(-5,-14);ctx.lineTo(5,-14);ctx.stroke();
    for(let i=-1;i<2;i+=2){ctx.beginPath();ctx.arc(i*5,-14,2,0,TAU);ctx.stroke();}
    ctx.restore();
  }else{                                       /* зимовка: жильё, и это видно */
    hut(24,15,true);
    ctx.fillStyle="rgba(255,206,132,.92)";ctx.fillRect(4,-11.5,4.6,3.6);
    ctx.save();ctx.translate(-13,-8);
    ctx.fillStyle=dark;ctx.strokeStyle=edge;
    ctx.beginPath();ctx.rect(-5,-6,10,6);ctx.fill();ctx.stroke();  /* сложенные ящики */
    ctx.beginPath();ctx.rect(-3,-10,7,4);ctx.fill();ctx.stroke();
    ctx.restore();
    ctx.save();ctx.translate(11,-15);ctx.rotate(lit*.35);
    ctx.fillStyle=dark;ctx.strokeStyle=edge;
    ctx.beginPath();ctx.ellipse(0,0,7,3,0,Math.PI,TAU);ctx.fill();ctx.stroke();
    ctx.restore();
  }
  /* подпись — только пока мачта не записана: дальше она живёт на бумаге */
  if(!relayKnown(R.key)&&s>.7){
    ctx.fillStyle="rgba(150,168,182,.75)";
    ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
    ctx.fillText(R.call,0,22);
  }
  ctx.restore();
}
