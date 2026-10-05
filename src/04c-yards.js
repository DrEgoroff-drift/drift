/* ══════════════ верфи держав: свои линии корпусов у пяти заводов (M714) ══════════════ */
/* Сотня 04b — это ГЛАВТРАССА: дорога продаёт свои машины в любом доке. У остальных
   пяти держав корпус был только «единственным экземпляром» на верфи — один на
   систему и на смену ассортимента, и вся порода завода сводилась к броску кубика.
   Здесь у каждого завода своя линия: что он строит (Рассвет копает, Хай-Фронт
   смотрит, Коммуна возит красиво), как он это строит (перекос статов — характер,
   а не «плюс десять»), как называет (имя, номер, версия, бренд, рукой по борту)
   и что о корабле говорит.

   ПРАВИЛА:
   1. Линия ДЕТЕРМИНИРОВАНА и не сохраняется, как сотня 04b: ключ — всегда тот же корабль.
   2. Чужой завод не продаёт корпус первому встречному (M369b, D14): в доке державы
      её линия стоит, но купить её можно только при деле с ней (`hasEpisode`), а в
      «Ялте» — всем и вдвое дороже. Ряд виден и без разрешения: замок назван.
   3. Схема планера — по грамматике завода (`makerForms`), длина и ширина гуляют
      ползунками стапеля (hl/hw): одна линия — разные силуэты, а не сто близнецов. */
const PYARD_N=24;   /* корпусов на завод */
const PYARD_MK={
  co:{cls:["courier","courier","hauler","hauler","yacht","scout","survey"],
    st:{thr:1.08,turn:1.0,fuel:.95,cargo:1.18,hull:.86},price:1.25,
    tier:{work:12,line:36,rare:24,legend:8,luxe:10,proto:4},
    pal:["#f4f6fa","#e8eef6","#7fb8ff","#dfe8f2","#9fc8ff","#ffffff","#c8d8ea"],
    hl:[.95,1.15],hw:[.82,1.02],
    nm:["Партнёр","Меридиан","Фронтир","Либерти","Пасифик","Голд Стар","Юнион","Атлас",
      "Пилигрим","Каскад","Санрайз","Ньюпорт","Хадсон","Гольфстрим","Сиэтл","Прерия"],
    sfx:["","","Про","Плюс","Макс","XL","Делюкс","Экспресс"],
    name:(r,n,s)=>n+(s?" "+s:"")+"™",
    note:["Белый корпус, логотип во весь борт. Гарантия Компании — до первой поломки.",
      "Бегущая строка по борту сама рассказывает, как вам повезло. Выгодно как никогда.",
      "Обслуживание — только у партнёров. Кофе в каюте — отдельно.",
      "Гладкий, как рекламный проспект. Трюм посчитан под рыночный ящик."]},
  or:{cls:["warship","warship","hauler","hauler","miner","survey","courier"],
    st:{thr:.92,turn:.86,fuel:1.04,cargo:1.0,hull:1.3},price:1.12,
    tier:{work:30,line:38,rare:20,legend:8,luxe:0,proto:4},
    pal:["#8a9098","#a0a6ae","#6e7680","#b4b8be","#7c8478","#c9c9d4"],
    hl:[1.02,1.22],hw:[.95,1.15],
    nm:["Мауэр","Ригель","Шпангоут","Ландвер","Кранц","Штаффель","Гренц","Вахт",
      "Шлюз","Ордер","Клаузель","Риттер","Фальке","Брандт","Хельм","Тор"],
    name:(r,n)=>n+" "+(2+(r()*8|0))+"/"+pick(["А","Б","В","Г","Д"],r),
    note:["Формуляр приложен. Отклонений от регламента не обнаружено.",
      "Прямые грани, гребень рёбер, номер по трафарету. Ни одной лишней линии.",
      "Строили не для красоты, а чтобы выдержал. Выдерживает.",
      "Каждая заклёпка на своём месте. Место указано в параграфе 14."]},
  km:{cls:["yacht","courier","courier","survey","survey","scout","hauler"],
    st:{thr:1.06,turn:1.16,fuel:1.14,cargo:.78,hull:.84},price:1.18,
    tier:{work:8,line:34,rare:26,legend:12,luxe:12,proto:4},
    pal:["#b0cce8","#d8c8f0","#9fd8ff","#f0d8e0","#c8e0f0","#e8e0c8","#a8c0e0"],
    hl:[1.02,1.2],hw:[.9,1.1],
    nm:["Элоиза","Мадлен","Сирень","Жозефина","Бельвиль","Ласточка","Амели","Колетт",
      "Марианна","Сена","Луара","Жаворонок","Розетта","Виолетта","Камилла","Ла Белль"],
    name:(r,n)=>n,
    note:["Лебединый обвод и лента окон. На борту имя, а не номер.",
      "Её строили дольше, чем надо, и это видно с первого взгляда.",
      "Уходит изящно, возвращается внезапно. Трюм — для сыра и книг.",
      "Вымпел на бушприте — не для дела. Для дела у неё всё остальное."]},
  ra:{cls:["miner","miner","hauler","hauler","warship","scout","survey"],
    st:{thr:.9,turn:.9,fuel:1.1,cargo:1.22,hull:1.14},price:.82,
    tier:{work:40,line:34,rare:14,legend:8,luxe:0,proto:4},
    pal:["#c6964a","#2e2a26","#d8a85a","#a87838","#3a3430","#e0b060"],
    hl:[.85,1.05],hw:[1.0,1.22],
    nm:["Брат","Успеется","Общий котёл","Убунту","Табаси","Сундиата","Мама Нджери","Кибо",
      "Нгози","Абени","Тэмба","Квеси","Баобаб","Сахель","Нил","Килиманджаро"],
    name:(r,n)=>n,
    note:["Сварен из трёх, баки наружу. Чинится в поле тем, что под рукой.",
      "Охра и чёрное, имя от руки. Успеется — дойдёт.",
      "Корпус взяли у одного, мотор у другого, сварили всей артелью.",
      "Тяжёлый и некрасивый. Довезёт всё, что накопали."]},
  hf:{cls:["survey","survey","scout","scout","courier","warship","hauler"],
    st:{thr:1.14,turn:1.1,fuel:1.12,cargo:.7,hull:.82},price:1.2,
    tier:{work:8,line:34,rare:26,legend:10,luxe:6,proto:16},
    pal:["#ff8b7a","#e8eef2","#ced8e0","#ff6b6b","#f4f4f4","#b8c8d4"],
    hl:[1.08,1.3],hw:[.7,.9],
    nm:["Хикари","Цуру","Сора","Кадзэ","Мирэ","Хана","Ханыль","Ёру",
      "Юки","Кумо","Наби","Сэби","Тайё","Пёль","Нами","Хоси"],
    name:(r,n)=>n+" v"+(1+(r()*5|0))+"."+(r()*10|0),
    note:["Веретено, антенны длиннее корпуса. Ваш рейтинг доверия рассчитан.",
      "Видит первым. Обновление установлено.",
      "Один глиф на борту, свет из-под обшивки, строка версии на обложке.",
      "Набор функций v4.1: рассчитано всё, кроме трюма."]}
};
const PYARD_MAKERS=Object.keys(PYARD_MK);
/* у тонкого класса тонкого завода (курьер Хай-Фронта: .5 × .72) ползунок ширины добивал корпус
   до проволоки — на листе это была штанга с антеннами и без тела. Пол ширины: класс × завод × ползунок ≥ .5 */
function yardBeam(by,hcls,hw){
  /* яхта сверху ещё ×.70 (03a: длинное тонкое тело) — пол считается с этим */
  const k=HULL_CLASS[hcls].bw*makerRow(by).bw*(hcls==="yacht"?.7:1);
  return Math.min(1.35,Math.max(hw,.5/k));
}
const PYARD={};
(function buildYards(){
  for(const by of PYARD_MAKERS){
    const M=PYARD_MK[by],seen={};
    let tot=0;for(const k in M.tier)tot+=M.tier[k];
    for(let i=0;i<PYARD_N;i++){
      const seed=hashi(0x7A2D,i*7919+by.charCodeAt(0)*131+by.charCodeAt(1),0x5A17),r=rng(seed);
      let roll=r()*tot,tier="line";
      for(const k in M.tier){roll-=M.tier[k];if(roll<=0){tier=k;break;}}
      /* класс — от завода, но тир сильнее: люкс у всех только яхта, лошадка — не яхта */
      let hcls=pick(M.cls,r);
      if(tier==="luxe")hcls="yacht";
      else if(hcls==="yacht"&&tier==="work")hcls="courier";
      const T=FLEET_TIERS[tier],P=FLEET_PROFILE[hcls],K=M.st;
      const skew=tier==="proto"?(r()*5|0):-1;
      const val=(a,n,m)=>{let k=r();if(skew>=0)k=n===skew?.92+r()*.08:k*.45;return (a[0]+(a[1]-a[0])*k)*m;};
      const thr=+clamp(val(P.thr,0,K.thr)*T.mul,.55,1.95).toFixed(2);
      const turn=+clamp(val(P.turn,1,K.turn)*T.mul,.5,1.85).toFixed(2);
      const fuel=Math.round(val(P.fuel,2,K.fuel)*T.mul);
      const cargo=Math.round(val(P.cargo,3,K.cargo)*(hcls==="yacht"?1:T.mul));
      const hull=Math.round(val(P.hull,4,K.hull)*T.mul);
      const power=(thr+turn)*.5+fuel/240+cargo/280+hull/250;
      const price=Math.round(clamp(power*7000*T.price*M.price-4000,1500,300000)/50)*50;
      /* имя: повтор в линии получает номер серии («Элоиза II») — так делает и сотня 04b */
      let ru=M.name(r,pick(M.nm,r),M.sfx?pick(M.sfx,r):"");
      const nr=seen[ru]|0;seen[ru]=nr+1;
      if(nr){const mk=FLEET_ROMAN[Math.min(nr-1,FLEET_ROMAN.length-1)];
        ru=ru.endsWith("™")?ru.slice(0,-1)+" "+mk+"™":ru+" "+mk;}
      PYARD["y"+by+i]={ru,cls:HULL_CLASS[hcls].ru+" · "+T.ru,hcls,seed,tier,by,
        thr,turn,fuel,cargo,hull,price,col:pick(M.pal,r),
        hl:+((M.hl[0]+r()*(M.hl[1]-M.hl[0]))*(hcls==="yacht"?.88:1)).toFixed(2),hw:+yardBeam(by,hcls,M.hw[0]+r()*(M.hw[1]-M.hw[0])).toFixed(2),
        note:pick(M.note,r)};
    }
  }
})();
const PYARD_KEYS=Object.keys(PYARD);
/* ряд верфи державы в этом доке: своя линия у своей станции, в «Ялте» — от всех пяти */
function stationYard(sys){
  if(!sys||!sys.station)return [];
  const by=sys.station.by||"gt";
  const yal=(typeof yaltaIs==="function")&&yaltaIs(sys.sx,sys.sy);
  if(!yal&&!PYARD_MK[by])return [];
  const T=sys.station.stype,r=rng(hashi(sys.seed,0x7A2D,timeBucket()));
  const pool=yal?PYARD_KEYS:PYARD_KEYS.filter(id=>PYARD[id].by===by);
  const slots=yal?8:(T==="yard"?6:(T==="outpost"?2:4));
  const out=[],seen={};
  for(let i=0;i<slots*8&&out.length<slots;i++){
    const id=pool[(r()*pool.length)|0];if(seen[id])continue;
    let ch=(YARD_CHANCE[PYARD[id].tier]||.5)*(T==="yard"?2:1);
    if(r()<ch){seen[id]=1;out.push(id);}
  }
  return out;
}
/* замок и цена чужой линии у прилавка: null — корпус не из верфей держав */
function yardGate(id,S){
  if(!PYARD[id])return null;
  const yal=(typeof yaltaIs==="function")&&yaltaIs(G.sx,G.sy);
  return {mul:yal?2:1,lock:(!yal&&!hasEpisode(S.by))?"нужно дело с державой":""};
}
