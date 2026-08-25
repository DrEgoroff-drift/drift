/* ══════════════ дорожный спутник ══════════════
   M168/M168b/M168g, из docs/DESIGN-road.md. Едете по-настоящему — корабль
   летит по экрану, и дорога его кормит. GPS даёт скорость (×1 000 000 —
   космическая), поворот машины кренит корпус и шарахает его к краю, тряска
   дрожит корпусом, РАЗГОН прибавляет факел и задирает нос, ТОРМОЖЕНИЕ бьёт
   носовыми соплами.

   ДЕНЬГИ И КОМБО (M168b). Километр дороги — кредиты, счётчик тикает живьём.
   Едешь без остановки — комбо растёт до ×3 (двадцать минут хода); встал
   больше чем на две минуты — комбо сгорело. Потолок в день мягкий: это
   развлечение; взломают — сами дураки (решение автора).

   МУЗЫКА — «ВОЛНА» (M168b). Не эквалайзер-столбики (та версия была мебелью:
   линейные частоты, дребезг, глухой цвет), а дышащая волна по нижней кромке —
   лог-частоты, сглаженные во времени, — и туманности, которые МЕНЯЮТ ЦВЕТ ПО
   НАСТРОЕНИЮ музыки (энергия × яркость спектра), как «Моя волна»: цвет трека
   смешивается с личным цветом — здесь это цвет вашего корпуса. Громкий бит
   рождает на пути звёзды; касание экрана — белый импульс.

   ПРАВИЛА ФАЙЛА:
   1. Датчики — по кнопке, каждый деградирует: без GPS — холостые, без
      микрофона — волна дышит сама, без гироскопа — поворот по ускорению.
   2. Хранится G.road={day,km,cr}. Комбо и настроение — эфемерны.
   3. День здесь КАЛЕНДАРНЫЙ, а не игровой: игровые сутки идут минуту, и на
      них счётчик поездки обнулялся прямо посреди дороги.
   4. Время везде считается по настоящему dt кадра, а не по зашитой
      шестнадцатой: на экране в 120 Гц зашитый шаг вдвое сгущал шлейф и вдвое
      укорачивал выдержки.
   5. Wake Lock, и о батарее сказано прямо.
   6. Экран и кадр живут в 27l-road-draw: здесь меры, деньги и датчики. */
const ROAD_VMIN=3,ROAD_VMAX=1000;
const ROAD_TIERS=[{v:200,ru:"ДОРОГА"},{v:400,ru:"ЭКСПРЕСС"},{v:1000,ru:"ГИПЕРДРАЙВ"}];
const ROAD_C=299792;                      /* км/с: на гипердрайве счёт идёт в долях света */
/* ── деньги дороги (переработано M168k по словам автора) ──
   «Еду 5 км до дома, как-то скучно за 20 кредитов» — и правда скучно: два
   кредита за километр на комбо ×1 давали десятку за дорогу домой. Ставка
   поднята втрое, но главное не в ставке: платить стало за ТО, ЧТО ДЕЛАЕШЬ.

   1. КИЛОМЕТРЫ — ровный доход, шесть за километр на комбо.
   2. ПОВОРОТ — разовая премия за каждый настоящий поворот, по его пику.
      Считается один раз, на выходе из дуги: пока крутит — копится пик, вышли
      из поворота — заплатили. Мелкое подруливание ниже порога не в счёт, во
      дворе (ниже ворот по скорости) тоже.
   3. ОБРАТНЫЙ КУРС — полуторный множитель, когда поездка ПОВЕРНУЛА ДОМОЙ:
      расстояние от точки старта росло-росло и пошло вниз. Дорога с работы
      оплачивается лучше дороги на работу, и это ровно тот случай, ради
      которого режим и включают.
   Потолок дня поднят соразмерно; скоростной здравый смысл остаётся
   единственным сторожем, как автор и решил на втором проходе. */
const ROAD_CR_KM=6,ROAD_COMBO_MAX=3,ROAD_COMBO_T=1200,ROAD_STOP_T=120;
/* ── ЗАПАС вместо суточной стенки (M168k, слова автора) ──
   «Ну ты 2 раза ездишь на работу с работы, выходные на дачу далеко, давай
   поднимем потолок + типо учтём колебания такие».

   Плоский потолок дня не умеет в колебания по построению: он одинаково режет и
   будни, и дачу, а ездят люди не ровно. Поэтому не потолок, а БАК. Каждые сутки
   в него натекает `ROAD_DAY_ADD`, накопиться он может до `ROAD_BANK_MAX` —
   около недели, — а поездка тратит из накопленного.

   Что из этого выходит само:
   · будни (две дороги, 300–600 кр) тратят меньше, чем натекает, — бак растёт;
   · дача в выходные (три сотни километров туда-обратно, ~6 700) оплачивается
     целиком из того, что накоплено за неделю, и это ощущается наградой;
   · а тот, кто катается целыми днями подряд, получает ровно суточный приток и
     не больше: сколько ни езди, из пустого бака не капнет.
   Экономику это не двигает: одно торговое плечо — 300–600 кр, содержание штаба
   с полным штатом — 300+ кр/мин, то есть весь суточный приток дороги штаб
   проедает за семь минут (docs/DESIGN-economy.md). Дорога остаётся приятностью.

   Натекает НЕПРЕРЫВНО, а не в полночь: выехал утром после ночи — уже часть
   суток в баке. Часы, переведённые назад, приток не начисляют (Math.max). */
const ROAD_DAY_ADD=2200,ROAD_BANK_MAX=14000;
const ROAD_TURN_CR=12,ROAD_TURN_PAY=.34;  /* премия за полный поворот и порог, доля полного сноса */
const ROAD_BACK_FAR=.6,ROAD_BACK_DROP=.25,ROAD_BACK_K=1.5;  /* км: докуда отъехать и насколько вернуться */
/* премия за поворот: по пику сноса, с тем же комбо, что и километры */
function roadTurnPay(pk,combo){return Math.round(ROAD_TURN_CR*clamp(pk||0,0,1)*(combo||1));}
/* расстояние между двумя точками, км (гаверсинус) */
function roadHav(a,b){
  if(!a||!b)return 0;
  const R=6371,dLa=(b.latitude-a.latitude)*Math.PI/180,dLo=(b.longitude-a.longitude)*Math.PI/180;
  const la1=a.latitude*Math.PI/180,la2=b.latitude*Math.PI/180;
  const h=Math.sin(dLa/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dLo/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}
/* повернули домой? Отъехали достаточно далеко И заметно приблизились обратно */
function roadHomeward(far,dst){return (far||0)>=ROAD_BACK_FAR&&(dst||0)<=(far||0)-ROAD_BACK_DROP;}
/* ── меры движения (M168g) ──
   Все поперечные величины считаются в м/с², в одной шкале: поворот, снятый
   гироскопом, переводится в поперечное ускорение по a=v·ω, поэтому у двух
   датчиков одна мера и один потолок, а не две подогнанные шкалы. */
const ROAD_G=9.80665;
const ROAD_LAT_FULL=.24*ROAD_G;           /* полный отброс к краю (M168k: было .30 g; спокойный городской поворот — 0.10–0.20 g, теперь он уводит корпус за половину размаха. Ниже опускать нельзя: на .18 дуга шоссе упирается в потолок) */
const ROAD_LAT_MAX=.60*ROAD_G;            /* выше уже не считаем: держимся своей шкалы */
const ROAD_LAT_DEAD=.04*ROAD_G;           /* мёртвая зона: подруливание и швы асфальта */
const ROAD_YAW_MAX=60;                    /* °/с: быстрее крутится только телефон в руках */
const ROAD_ZERO_TAU=20,ROAD_ZERO_FAST=.6,ROAD_ZERO_GRAB=3;  /* с: автоноль медленный, первые секунды — быстрый */
const ROAD_ZERO_HOLD_A=.08*ROAD_G,ROAD_ZERO_HOLD_W=4;       /* база учится только на прямой */
const ROAD_SIDE_MAX=.75;                  /* |x̂·ĝ|: дальше экранная ось X слишком близко к вертикали */
const ROAD_SHAKE_DEAD=.35,ROAD_SHAKE_FULL=2.5,ROAD_SHAKE_KICK=3.5;   /* м/с²: тряска и удар о яму */
const ROAD_MOVE_GATE=8,ROAD_MOVE_FULL=14; /* км/ч: ниже — корабль не швыряет (двор, парковка, телефон в руках). Потолок опущен с 20 (M168k): в пробке половина хода была ниже него, и ворота держали снос закрытыми ровно там, где машина и поворачивает */
const ROAD_TURN_ATK=.30,ROAD_TURN_REL=.80;/* с: в сторону быстро, обратно медленно */
const ROAD_XOFF_OUT=.28,ROAD_XOFF_HOME=1.4;
const ROAD_SWERVE=.46;                    /* доля полуширины экрана, на которую шарахает */
const ROAD_TURN_SIGN=-1;                  /* корпус уходит НАРУЖУ поворота; знак проверяется на стенде одной правкой */
/* ── шлейф (переработан M168k по словам автора: «больше и виднее, длиннее, и
   пусть от тридцати становится по-другому») ──
   Две повадки, а не одна с множителем. На малом ходу это ВЫДОХ: короткий,
   широкий, мягко расходящийся — так стоит на светофоре и ползёт в пробке.
   С двадцати двух разгорается ФОРСАЖ: лента вытягивается вдвое, перестаёт
   расходиться (почти параллельные кромки — копьё, а не облако), внутри
   зажигается раскалённая нить, и газ начинает сносить вбок. К пятидесяти
   повадка новая целиком. Переход гладкий (smoothstep), чтобы на границе
   ничего не щёлкало. */
/* ── размер корпуса и факела в кадре (M168k, «проверь на разных кораблях») ──
   Корпуса разные по сложению: «Клинок» — игла с отношением 29:1, «Мамонт» —
   плита почти квадратная. Прежняя посадка вписывала корпус в коробку
   `min(W/bw, H/len)`, и от этого широкие выходили КОРОЧЕ узких: у «Вьюка» длина
   в кадре была 0.106 высоты против 0.171 у «Стрижа», хотя это тягач.

   Теперь длина одна на всех, а ширина — потолок: слабину выбирает тот, кто
   упирается. Ширина меряется честно, `roadHullHalf` (пилоны и баки), а не по
   ширине тела.

   С факелом было хуже: он шёл от радиуса сопла, а сопла у корпусов свои. Общая
   ширина струй гуляла от 0.032 ширины экрана («Клинок») до 0.241 («Топор», у
   него шесть сопел) — семикратный разброс, и у широких корпусов шлейф выходил
   стеной света на пол-экрана. Теперь суммарный радиус струй — доля ПОЛУШИРИНЫ
   КОРПУСА, а доли между соплами остаются свои. Плюс упор снизу и сверху: у
   иглы факел не должен быть ниткой, у плиты — заревом. */
const ROAD_SHIP_LEN=.175,ROAD_SHIP_WID=.40;   /* доли экрана: длина корпуса и потолок ширины */
const ROAD_TRAIL_R=.36;                       /* сумма радиусов сопел как доля полуширины корпуса */
const ROAD_TRAIL_RMIN=.022,ROAD_TRAIL_RMAX=.075; /* и упоры, доли ширины экрана */
const ROAD_BURN_LO=22,ROAD_BURN_HI=55;    /* км/ч: где начинается и где кончается разгорание */
const ROAD_TRAIL_LEN=.40,ROAD_TRAIL_BURN=.40;  /* длина ленты на экране: выдох → форсаж */
const ROAD_TRAIL_STEP=.010,ROAD_TRAIL_MAX=520; /* шаг точек по пути и потолок */
function roadBurn(kmh){
  const x=clamp(((kmh||0)-ROAD_BURN_LO)/(ROAD_BURN_HI-ROAD_BURN_LO),0,1);
  return x*x*(3-2*x);
}
const ROAD_MASK=.24;                      /* нижняя доля экрана гаснет в фон: подвал с кнопкой должен быть чистым */
/* ── разведение тонов неба (M168k) ──
   Три туманности стояли на hue, hue+42, hue+84 — соседние оттенки одного
   семейства, которые под «lighter» складываются в одну заливку. Разводим по
   кругу и даём каждой свою насыщенность: богатство даёт разница тонов, а не
   прибавка яркости. Спутники сияния разведены там же и разнесены по ширине —
   пятна шире, чем расстояние между ними, усредняются в белесый ком. */
const ROAD_SKY_H=[0,132,-118],ROAD_SKY_S=[78,62,88];
/* пять плюмажей по нижней кромке, слева направо; середина — тон настроения.
   Соседи разведены по кругу: круглые пятна одного семейства под «lighter»
   усредняются в белесый ком, а узкие разнотонные держат цвет (M168k) */
const ROAD_BLOOM_H=[-118,62,0,-58,124];
const ROAD_FOOT=.13;                      /* доля экрана снизу под подвал: там окно правды не мешает кнопкам */
let RD=null;
function roadAll(){if(!G.road||typeof G.road!=="object")G.road={day:-1,km:0,cr:0};return G.road;}
/* день — календарный: игровые сутки идут 60 секунд, и на них «за поездку»
   обнулялось раз в минуту прямо посреди дороги (M168g) */
function roadToday(){const d=new Date();return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();}
/* приток в бак: чистая функция, её и гоняют автотесты */
function roadBankAdd(bank,ms){
  return clamp((bank||0)+ROAD_DAY_ADD*Math.max(0,ms||0)/86400000,0,ROAD_BANK_MAX);
}
function roadDayReset(now){
  const R=roadAll(),d=roadToday();
  if(R.day!==d){R.day=d;R.km=0;R.cr=0;}
  /* бак: старым сохранениям наливаем полный — они его ни разу не тратили */
  const t=now==null?Date.now():now;
  if(R.bank==null){R.bank=ROAD_BANK_MAX;R.bts=t;}
  /* именно `==null`, а не `||`: отметка времени в ноль — законное значение, а
     на `||` она подменялась текущим временем, и приток молча не начислялся */
  else{R.bank=roadBankAdd(R.bank,t-(R.bts==null?t:R.bts));R.bts=t;}
  return R;
}
function roadSpeedOk(kmh){return kmh>=ROAD_VMIN&&kmh<=ROAD_VMAX;}
/* ярус по скорости: 1 дорога (машина), 2 экспресс (поезд), 3 гипердрайв (самолёт) */
function roadTier(kmh){
  if(!roadSpeedOk(kmh))return 0;
  for(let i=0;i<ROAD_TIERS.length;i++)if(kmh<=ROAD_TIERS[i].v)return i+1;
  return 0;
}
/* ── шкала хода (M168k) ──
   «Быстро» меряется не от потолка яруса, а от той скорости, которая в этом
   ярусе бывает на самом деле. Прежде первый ярус делился на 120 км/ч, а по
   городу едут 15–45: шкала давала 0.2, хвост звезды выходил в три пикселя, и
   всё ощущение хода сводилось к мерцанию — автор об этом и сказал по видео
   («звёзды мигают, а не так, будто ты летишь на фоне»). */
const ROAD_FAST_REF=[60,330,900];
function roadFast(kmh,tier){return clamp((kmh||0)/ROAD_FAST_REF[clamp((tier||1)-1,0,2)],0,1);}
/* доля скорости света после ×1 000 000: 850 км/ч → 0.79 c */
function roadLightFrac(kmh){return kmh/3.6*1000/ROAD_C;}
function roadCosmic(kmh){return Math.round(kmh/3.6*1000);}
function roadTripRu(km){return km<.001?"0":(km).toFixed(km<10?2:0)+" млн км";}
/* комбо: секунды непрерывного хода → множитель до ×3; простой дольше двух минут сжигает */
function roadCombo(moveT){return 1+Math.min(ROAD_COMBO_MAX-1,(moveT||0)/ROAD_COMBO_T*(ROAD_COMBO_MAX-1));}
/* километры → кредиты, живьём, с мягким потолком дня */
/* ── поездка и сутки — РАЗНЫЕ числа (M168k, вопрос автора) ──
   «Каждая поездка новые кредиты или в день ограничить, а то не понятно» — и не
   понятно было по делу: на экране висело суточное число, а подписано оно было
   «за поездку». Считаем и то и другое: крупно то, что заработано СЕЙЧАС (его и
   чувствуешь за рулём), тихой строкой — сутки против потолка (он и есть
   ограничение). В журнал уходят оба. */
function roadEarnKm(km,moveT){
  const R=roadDayReset();
  R.km+=km;
  if(RD)RD.kmTrip=(RD.kmTrip||0)+km;
  if(R.bank<1)return 0;
  const due=km*ROAD_CR_KM*roadCombo(moveT)*(RD&&RD.back?ROAD_BACK_K:1);
  RD&&(RD.crFrac=(RD.crFrac||0)+due);
  let n=RD?Math.floor(RD.crFrac):Math.floor(due);
  if(RD)RD.crFrac-=n;
  n=Math.min(n,Math.floor(R.bank));
  if(n>0){R.bank-=n;R.cr+=n;RD&&(RD.crTrip=(RD.crTrip||0)+n);earn(n,"road");}
  return n;
}
function roadFinish(){
  const R=roadDayReset();
  const cr=RD&&RD.crTrip?RD.crTrip:0, km=RD&&RD.kmTrip?RD.kmTrip:0;
  if(cr>0){
    /* сперва про поездку — про неё и спрашивают, — а сутки следом, чтобы было
       видно, сколько ещё осталось до потолка */
    tell("money","Дорога: +"+cr+" кр за поездку · "+km.toFixed(1)+" км"+
      (R.cr>cr?" · за сутки "+R.cr:"")+" · запас "+Math.floor(R.bank),"ДОРОГА\n+"+cr+" кр");
    if(typeof recordAdd==="function")
      recordAdd("дорога","командировочные: "+cr+" кр за "+km.toFixed(0)+" км"+
        (R.cr>cr?" (за сутки "+R.cr+")":""));
  }
}
/* ── датчики ── */
function roadSensorsOn(){
  if(!RD)return;
  /* нужен ровно один датчик движения: акселерометр с гироскопом. Ориентацию
     (deviceorientation) больше не слушаем — см. разбор в roadOnShake */
  const wire=()=>{addEventListener("devicemotion",roadOnShake);};
  if(typeof DeviceMotionEvent!=="undefined"&&DeviceMotionEvent.requestPermission)
    DeviceMotionEvent.requestPermission().then(s=>{if(s==="granted")wire();}).catch(()=>{});
  else wire();
  if(navigator.geolocation&&RD.watch==null){
    RD.watch=navigator.geolocation.watchPosition(roadOnPos,()=>{RD.gps="нет GPS — летим на холостых";},
      {enableHighAccuracy:true,maximumAge:2000,timeout:12000});
  }
  if(navigator.wakeLock&&!RD.lock)navigator.wakeLock.request("screen").then(l=>{if(RD)RD.lock=l;}).catch(()=>{});
  RD.asked=1;
  roadSenseBtn();
}
/* ── микрофон отдельной кнопкой (M168h) ──
   Микрофон нужен ТОЛЬКО настроению волны, а платят за него дорого: подключён
   Android Auto — голова машины видит открытый захват и решает, что идёт
   разговор: музыка приглушается или глохнет совсем. Поэтому:

   1. Датчики и микрофон разведены. По кнопке включается то, ради чего экран и
      сделан, — GPS и движение. Микрофон — вторым, осознанным нажатием, и по
      умолчанию его нет: без него волна дышит сама, а туманности живут.
   2. Захват — БЕЗ обработки: эхоподавление, шумодав и автоусиление выключены.
      Именно эхоподавление переводит поток в «голосовой» режим, и уже по нему
      голова опознаёт звонок. Сырой захват она чаще принимает за запись.
   3. Свой AudioContext, а не игровой: если система всё же переключит контекст
      в разговорный режим, пусть это будет пустой контекст анализатора, а не
      тот, через который играет сама игра.
   4. Выбор помнится в G.road.mic — но кнопка на экране всегда показывает, что
      сейчас, и гасится одним нажатием прямо на ходу. */
/* ── какой микрофон брать (M168i) ──
   Захват с БЛЮТУС-микрофона — отдельная беда поверх Android Auto: гарнитурный
   профиль (HFP/SCO) НЕ умеет играть музыку, и как только система переводит
   гарнитуру в него ради нашего захвата, A2DP-музыка глохнет у всех в машине.
   Голова к тому же показывает это как звонок. Поэтому из списка устройств
   выбираем ВСТРОЕННЫЙ микрофон телефона и просим его exact — телефонного
   капсюля для настроения волны хватает с запасом, музыку из колонок он
   слышит. Чистая функция — её гоняют автотесты. */
function roadMicPick(list,curLabel){
  const bad=/bluetooth|car|auto|hands|sco|headset|airpods|buds|гарнитур|автомоб|блютус/i;
  if(curLabel&&!bad.test(curLabel))return null;      /* уже не гарнитура — не трогаем */
  const c=(list||[]).filter(d=>d.kind==="audioinput"&&d.deviceId&&
    d.deviceId!=="default"&&d.deviceId!=="communications"&&!bad.test(d.label||""));
  return c.length?c[0].deviceId:null;
}
function roadMicOn(){
  if(!RD||RD.an||!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)return;
  RD.mic=null;
  const RAW={echoCancellation:false,noiseSuppression:false,autoGainControl:false,channelCount:1};
  const wire=st=>{
    if(!RD){st.getTracks().forEach(t=>t.stop());return;}
    RD.stream=st;
    /* подсказка маршрутизации: это музыка, не речь — меньше поводов уводить
       поток на голосовой тракт */
    const tr=st.getAudioTracks()[0];
    if(tr&&"contentHint" in tr)tr.contentHint="music";
    RD.actx=new (window.AudioContext||window.webkitAudioContext)();
    RD.an=RD.actx.createAnalyser();RD.an.fftSize=256;RD.an.smoothingTimeConstant=.5;
    RD.actx.createMediaStreamSource(st).connect(RD.an);
    RD.eq=new Uint8Array(RD.an.frequencyBinCount);
    roadAll().mic=1;
    roadSenseBtn();
  };
  navigator.mediaDevices.getUserMedia({audio:RAW}).then(st=>{
    if(!RD){st.getTracks().forEach(t=>t.stop());return;}
    const tr=st.getAudioTracks()[0];
    navigator.mediaDevices.enumerateDevices().then(list=>{
      const want=roadMicPick(list,tr&&tr.label);
      if(!want)return wire(st);
      const c2=Object.assign({deviceId:{exact:want}},RAW);
      navigator.mediaDevices.getUserMedia({audio:c2})
        .then(st2=>{st.getTracks().forEach(t=>t.stop());wire(st2);})
        .catch(()=>wire(st));
    }).catch(()=>wire(st));
  }).catch(()=>{if(RD){RD.mic="микрофон не дали — волна дышит сама";roadSenseBtn();}});
}
function roadMicOff(){
  if(!RD)return;
  if(RD.stream){RD.stream.getTracks().forEach(t=>t.stop());RD.stream=null;}
  if(RD.actx){RD.actx.close().catch(()=>{});RD.actx=null;}
  RD.an=null;RD.eq=null;RD.mic=null;
  roadAll().mic=0;
  roadSenseBtn();
}
/* кнопка называет действие, а не состояние — правило интерфейса */
function roadSenseBtn(){
  const b=document.getElementById("roadSense");
  if(!b)return;
  if(!RD){b.style.display="";b.textContent="РАЗРЕШИТЬ ДАТЧИКИ";return;}
  b.style.display="";
  b.textContent=!RD.asked?"РАЗРЕШИТЬ ДАТЧИКИ":RD.an?"ВЫКЛЮЧИТЬ МИКРОФОН":"СЛУШАТЬ МУЗЫКУ";
}
/* ── движение машины: автоноль, рамка от тяжести, рыскание (M168g) ──
   Телефон в машине никогда не стоит ровно: держатель скошен на пять-двадцать
   градусов, присоска смотрит вбок. Перекос в 10° подмешивает в поперечную ось
   9.81·sin10° = 1.70 м/с², то есть 0.17 g — БОЛЬШЕ, чем стоит спокойный
   городской поворот (0.10–0.20 g). Поэтому «поделить на большее число» кривизну
   не лечит: вместе с перекосом задавится и сам поворот. Меряем иначе.

   1. АВТОНОЛЬ. Медленное среднее ускорения — это вектор тяжести g0, то есть
      покой держателя. Учится ТОЛЬКО на прямой (иначе база съест сам поворот),
      а первые три секунды — быстрым захватом, чтобы не ждать полминуты.
   2. РАМКА ОТ ТЯЖЕСТИ, а не от экрана: «право» — экранная ось X без своей доли
      вдоль g0. Она горизонтальна при любом крене держателя, поэтому статический
      перекос вычтен по обеим осям сразу. Мера слепнет только когда сама ось X
      встаёт к вертикали (|x̂·ĝ| > 0.75, это около 49°) — «поперёк» тогда не
      определено, и мы честно молчим, а не выдумываем.
   3. ПОВОРОТ — скорость рыскания вокруг вертикали: rotationRate,
      спроецированный на g0. Ей вообще всё равно, как воткнут телефон.
      Переводим её в поперечное ускорение по a=v·ω — тогда у обоих датчиков
      ОДНА шкала в м/с², а не две подогнанные. Совпали знаком — берём большее
      (поворот подтверждён дважды), разошлись — меньшее (лучше недодать).

   gamma из deviceorientation не берём вовсе: держатель ставит телефон почти
   вертикально, а это рядом с особой точкой раскладки Z-X'-Y'' (beta = ±90°),
   где gamma скачет от любого шевеления. Это и была половина дёрганья. */
function roadOnShake(e){
  if(!RD)return;
  const a=e.accelerationIncludingGravity;
  if(!a||a.x==null)return;
  const dt=clamp((e.interval||16)/1000,.004,.2);
  const v=[a.x||0,a.y||0,a.z||0];
  if(!RD.g0){RD.g0=v.slice();RD.g0T=0;}
  RD.g0T+=dt;
  const gl=Math.hypot(RD.g0[0],RD.g0[1],RD.g0[2])||ROAD_G;
  /* рыскание вокруг вертикали: вектор вращения (beta,gamma,alpha) на ĝ0 */
  const rr=e.rotationRate;
  let yaw=null;
  if(rr&&(rr.alpha!=null||rr.beta!=null||rr.gamma!=null))
    yaw=clamp(((rr.beta||0)*RD.g0[0]+(rr.gamma||0)*RD.g0[1]+(rr.alpha||0)*RD.g0[2])/gl,-ROAD_YAW_MAX,ROAD_YAW_MAX);
  const lin=[v[0]-RD.g0[0],v[1]-RD.g0[1],v[2]-RD.g0[2]];
  const mag=Math.hypot(lin[0],lin[1],lin[2]);
  if(RD.g0T<ROAD_ZERO_GRAB||(mag<ROAD_ZERO_HOLD_A&&(yaw==null||Math.abs(yaw)<ROAD_ZERO_HOLD_W))){
    const k=1-Math.exp(-dt/(RD.g0T<ROAD_ZERO_GRAB?ROAD_ZERO_FAST:ROAD_ZERO_TAU));
    for(let i=0;i<3;i++)RD.g0[i]+=(v[i]-RD.g0[i])*k;
  }
  /* поперечное по горизонтали: x̂ минус доля вдоль тяжести, потом нормировка */
  const dxg=RD.g0[0]/gl;
  RD.side=Math.abs(dxg);
  let lat=null;
  const den=Math.sqrt(Math.max(1e-6,1-dxg*dxg));
  if(RD.side<ROAD_SIDE_MAX)
    lat=(lin[0]*(1-dxg*dxg)-lin[1]*dxg*RD.g0[1]/gl-lin[2]*dxg*RD.g0[2]/gl)/den;
  /* рыскание → поперечное ускорение: та же мера, что и у акселерометра.
     Знак минус: центростремительное смотрит ВНУТРЬ поворота, как и lat */
  const aYaw=yaw==null?null:-(RD.kmh||0)/3.6*yaw*Math.PI/180;
  let s=null;
  /* два измерения одной величины. Совпали — берём большее (поворот подтверждён
     дважды); ПРОТИВОРЕЧАТ (разные знаки, и оба выше мёртвой зоны) — берём
     меньшее: лучше недодать, чем швырнуть корпус не в ту сторону */
  if(aYaw!=null&&lat!=null){
    const opp=aYaw*lat<0&&Math.min(Math.abs(aYaw),Math.abs(lat))>ROAD_LAT_DEAD;
    s=opp?(Math.abs(aYaw)<Math.abs(lat)?aYaw:lat)
         :(Math.abs(aYaw)>Math.abs(lat)?aYaw:lat);
  }
  else s=aYaw!=null?aYaw:lat;
  RD.blind=lat==null&&aYaw==null;
  /* для окна правды (M168k): без этих трёх чисел на экране нельзя понять,
     почему корпус не сходит с центра, а крутить пороги вслепую — гадание */
  RD.latG=s==null?null:s/ROAD_G;RD.yawS=yaw;RD.latA=lat==null?null:lat/ROAD_G;
  if(s!=null){
    const m=Math.abs(s)<ROAD_LAT_DEAD?0:Math.sign(s)*Math.min(Math.abs(s)-ROAD_LAT_DEAD,ROAD_LAT_MAX-ROAD_LAT_DEAD);
    RD.turnT=clamp(ROAD_TURN_SIGN*m/(ROAD_LAT_FULL-ROAD_LAT_DEAD),-1,1);
  }
  /* тряска — от того же очищенного ускорения, поэтому кривой держатель её
     больше не держит в полке; атака мягкая, спад долгий, яма даёт удар */
  const sm=clamp((mag-ROAD_SHAKE_DEAD)/(ROAD_SHAKE_FULL-ROAD_SHAKE_DEAD),0,1);
  RD.shake+=(sm-(RD.shake||0))*(1-Math.exp(-dt/(sm>(RD.shake||0)?.25:1.2)));
  if(mag>ROAD_SHAKE_KICK&&(RD.kick||0)<.3)RD.kick=Math.min(1,.5+(mag-ROAD_SHAKE_KICK)/4);
}
/* ── реальная местность размечена на вселенную (M168c) ──
   Клетка ~2.8 км по земле — одна «система» со своим именем из genName.
   Имя детерминировано местом (соль 0xD0A0, свой поток по правилу файла №2
   из 06-galaxy), поэтому то же перекрёсток — та же система у всех: задел
   под «во вселенной ещё 2 пилота» — сервер сматчит по клетке. */
function roadSys(lat,lon){
  const cx=Math.round(lon/.03),cy=Math.round(-lat/.03);
  return {cx,cy,name:genName(rng(hashi(cx,cy,0xD0A0)))};
}
/* ── пилоты рядом ──
   Раз в полминуты и при смене сектора наружу уходит ТОЛЬКО номер клетки
   ~2.8 км и случайная метка (localStorage) — ни координат, ни аккаунта.
   Оффлайн и file:// молчат: строки про пилотов просто нет. */
function roadPing(){
  if(!RD||!RD.sys||location.protocol.indexOf("http")!==0)return;
  /* ── у дороги своя метка (25.08.2026) ──
     Была общая с игровым следом (`drift_pilot`). Сама по себе каждая безобидна:
     дорога хранит номер клетки 2.8 км три минуты, след — место в игре тридцать
     дней. Но метка-то одна, и на сервере эти две записи ложатся рядом — то есть
     появляется ниточка между тем, ГДЕ человек ездит по земле, и тем, что он
     делает в игре. Никому эта ниточка не нужна, а стоит она одну строку. */
  let id="";
  try{
    id=localStorage.drift_road||"";
    if(!id){id=Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b=>b.toString(16).padStart(2,"0")).join("");localStorage.drift_road=id;}
  }catch(e){return;}
  fetch(CLOUD.api+"?a=road",{method:"POST",body:JSON.stringify({sec:RD.sys.cx+":"+RD.sys.cy,id})})
    .then(r=>r.json()).then(j=>{if(RD&&j&&j.ok)RD.mates=j.n|0;}).catch(()=>{});
}
const roadPilotRu=n=>{const d=n%10,h=n%100;return h>=11&&h<=14?"пилотов":d===1?"пилот":d>=2&&d<=4?"пилота":"пилотов";};
function roadOnPos(p){
  if(!RD)return;
  const c=p.coords,t=p.timestamp;
  const S=roadSys(c.latitude,c.longitude);
  if(!RD.sys||RD.sys.cx!==S.cx||RD.sys.cy!==S.cy){
    if(RD.sys)RD.sysFlash=3;          /* въехали в новую — объявить */
    RD.sys=S;RD.mates=0;
    roadPing();
  }
  let kmh=null;
  if(c.speed!=null&&isFinite(c.speed))kmh=c.speed*3.6;
  else if(RD.lastPos){
    const dt=(t-RD.lastT)/1000;
    if(dt>0){
      const R=6371,dLa=(c.latitude-RD.lastPos.latitude)*Math.PI/180,dLo=(c.longitude-RD.lastPos.longitude)*Math.PI/180;
      const la1=RD.lastPos.latitude*Math.PI/180,la2=c.latitude*Math.PI/180;
      const h=Math.sin(dLa/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dLo/2)**2;
      kmh=2*R*Math.asin(Math.sqrt(h))/dt*3600;
    }
  }
  const dt=RD.lastT?(t-RD.lastT)/1000:0;
  if(kmh!=null){
    /* разгон и тормоз: производная скорости, сглаженная. Выборку с плохой
       точностью не берём, и мелочь до 1.5 км/ч между отсчётами считаем шумом —
       иначе корпус клюёт носом на каждом обновлении GPS (M168g) */
    const dirty=c.accuracy!=null&&c.accuracy>25;
    const dv=kmh-(RD.kmh||0);
    if(dt>0&&!dirty&&Math.abs(dv)>1.5)RD.accT=clamp(dv/dt/8,-1,1);
    if(roadSpeedOk(kmh)&&dt>0&&dt<30){
      RD.moveT=(RD.moveT||0)+dt;RD.stopT=0;
      roadEarnKm(kmh*dt/3600,RD.moveT);
      RD.kmh=kmh;RD.gps=null;
      if(kmh>(RD.vmax||0))RD.vmax=kmh;          /* рекорд поездки — в строку итога */
    }else{
      if(dt>0&&kmh<ROAD_VMIN){RD.stopT=(RD.stopT||0)+dt;if(RD.stopT>ROAD_STOP_T)RD.moveT=0;}
      RD.kmh=roadSpeedOk(kmh)?kmh:0;
    }
  }
  /* обратный курс: помним точку старта и самый дальний отход от неё */
  if(!RD.pos0)RD.pos0={latitude:c.latitude,longitude:c.longitude};
  else{
    const dst=roadHav(RD.pos0,c);
    if(dst>(RD.far||0))RD.far=dst;
    if(!RD.back&&roadHomeward(RD.far,dst))RD.back=1;
  }
  RD.lastPos=c;RD.lastT=t;
}
/* ── премия за поворот (M168k) ──
   Платим ОДИН раз за дугу: пока крутит — копим пик, вышли из поворота — платим
   по нему. Иначе один длинный съезд оплачивался бы шестьдесят раз в секунду.
   Ниже ворот по скорости не платим вовсе: во дворе и с телефоном в руках
   «повороты» есть, а езды нет. */
function roadTurnTick(kmh){
  if(!RD)return 0;
  const at=Math.abs(RD.turn||0);
  if(at>ROAD_TURN_PAY){RD.turnPk=Math.max(RD.turnPk||0,at);return 0;}
  const pk=RD.turnPk||0;
  RD.turnPk=0;
  if(pk<=ROAD_TURN_PAY||(kmh||0)<ROAD_MOVE_GATE)return 0;
  const R=roadDayReset();
  if(R.bank<1)return 0;
  let n=roadTurnPay(pk,roadCombo(RD.moveT)*(RD.back?ROAD_BACK_K:1));
  n=Math.min(n,Math.floor(R.bank));
  if(n>0){R.bank-=n;R.cr+=n;RD.crTrip=(RD.crTrip||0)+n;earn(n,"road");RD.flash="ПОВОРОТ +"+n;RD.flashT=1.4;}
  return n;
}
/* ── звук → настроение ──
   Как у «Волны»: анимация идёт в такт и меняет цвет по настроению трека.
   Настроение здесь — две оси: ЭНЕРГИЯ (RMS, атака быстрая, спад медленный —
   дыхание) и ЯРКОСТЬ (спектральный центроид: бас или верха). Кривая волны —
   лог-частоты со сглаживанием. Бит — скачок RMS над своим средним. */
function roadAudio(t){
  if(RD.an&&RD.eq){
    RD.an.getByteFrequencyData(RD.eq);
    const N=RD.eq.length;
    let sum=0,wsum=0;
    for(let i=0;i<N;i++){const v=RD.eq[i]/255;sum+=v*v;wsum+=v*i;}
    const rms=Math.sqrt(sum/N);
    const cen=sum>0?wsum/(N*Math.sqrt(sum*N)):0;
    /* программное автоусиление (M168i). Захват сырой — AGC у системы выключен
       нарочно, ради Android Auto, — и с телефонного микрофона музыка из
       колонок приходит тихой: rms 0.05–0.15. На абсолютной шкале туманности
       еле дышали, бит не пробивал порог. Нормируем СВОИМ пиком с медленным
       спадом (полминуты): громкий кусок трека — единица, тихий — своя доля,
       динамика трека остаётся, а абсолютный уровень уходит из уравнения.
       Яркость (центроид) от усиления не зависит — её не трогаем. */
    RD.pk=Math.max((RD.pk||0)*.9997,rms,.02);
    const lvl=clamp(rms/RD.pk,0,1);
    RD.energy+=(lvl*.9-RD.energy)*(lvl*.9>RD.energy?.25:.03);
    RD.bright+=(clamp(cen*2.2,0,1)-RD.bright)*.05;
    RD.avg=RD.avg*.985+lvl*.015;
    if(lvl>RD.avg*1.45&&lvl>.3&&t-RD.beatT>.28){RD.beat=1;RD.beatT=t;}
    /* волна: 28 точек по лог-частотам, каждая сглажена, в той же нормировке */
    for(let i=0;i<28;i++){
      const bin=Math.min(N-1,Math.floor(Math.pow(N,i/27)));
      const v=clamp(RD.eq[bin]/255/RD.pk*.7,0,1);
      RD.wave[i]+=(v-RD.wave[i])*(v>RD.wave[i]?.4:.12);
    }
  }else{
    /* без микрофона волна дышит сама, спокойно */
    RD.energy+=((.22+.08*Math.sin(t*.5))-RD.energy)*.05;
    RD.bright+=((.45+.2*Math.sin(t*.17))-RD.bright)*.02;
    for(let i=0;i<28;i++)RD.wave[i]+=((.25+.16*Math.sin(t*1.1+i*.5)+.08*Math.sin(t*2.3+i*1.3))-RD.wave[i])*.1;
  }
  RD.beat*=.9;
}
/* ── три полосы: бас, серёдка, верх (M168k) ──
   Берутся из уже посчитанной волны, а не из спектра заново: волна нормирована
   своим пиком и сглажена по времени, значит полосы наследуют и нормировку, и
   сглаживание — один источник правды, и на стенде они живут вместе с волной.
   Границы по лог-шкале 28 точек: 0–5 низ, 6–16 середина, 17–27 верх. */
const ROAD_BAND=[0,6,17,28];
function roadBands(w){
  const m=(a,b)=>{let s=0;for(let i=a;i<b;i++)s+=(w&&w[i])||0;return s/(b-a);};
  return {bass:m(ROAD_BAND[0],ROAD_BAND[1]),mid:m(ROAD_BAND[1],ROAD_BAND[2]),tre:m(ROAD_BAND[2],ROAD_BAND[3])};
}
/* цвет настроения: спокойное — фиолетовый→циан по яркости, энергичное —
   маджента→янтарь; смешан с личным цветом — цветом вашего корпуса */
/* ── тон по кругу, а не по числовой прямой (M168k) ──
   Тон — угол. Смешивать его как обычное число нельзя: 190 и 40 в среднем дают
   115, то есть ЗЕЛЕНЬ, хотя между цианом и янтарём зелени нет ни на одном
   пути, который мы имели в виду. Здесь — короткая дуга. */
function roadHueMix(a,b,k){const d=((b-a+540)%360)-180;return ((a+d*k)%360+360)%360;}
/* Настроение музыки в тон. Энергия ведёт от спокойного к горячему, яркость
   (спектральный центроид) выбирает внутри каждого края.

   Горячий край записан ЗА 360 (маджента 320 → янтарь 400 ≡ 40), поэтому путь
   от спокойного всегда идёт вверх: фиолет → маджента → красный → янтарь. До
   M168k он считался как 320−280·bright, и на ярком треке дорога вела 190→40 —
   напрямую через 150 и 100, то есть через зелень. Шесть минут настоящей поездки
   на видео были одного салатового тона при любой музыке. */
function roadMoodPath(energy,bright){
  const calm=265-75*bright;                /* спокойное: фиолетовое → циан */
  const hot=320+80*bright;                 /* энергичное: маджента → янтарь */
  return (calm+(hot-calm)*clamp(energy*1.6,0,1))%360;
}
function roadMoodHue(){
  const h=roadMoodPath(RD.energy,RD.bright);
  const accH=roadRgbHue(hex2rgb(shipData(G.shipId).col));
  return roadHueMix(h,accH,.28);           /* и 28% своего корпуса — по дуге же */
}
function roadRgbHue(c){
  const r=c[0]/255,g=c[1]/255,b=c[2]/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b);
  if(mx===mn)return 200;
  const d=mx-mn;
  let h=mx===r?((g-b)/d+(g<b?6:0)):mx===g?((b-r)/d+2):((r-g)/d+4);
  return h*60;
}
