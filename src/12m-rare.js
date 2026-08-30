/* ══════════════ редкости: сто адресов, а не рулетка ══════════════ */
/* Части (05-parts) сыплются, узлы (05a-nodes) выпадают по шансу. Редкость —
   третий, самый твёрдый слой: у неё НЕТ шанса выпадения. При генерации мира
   каждая редкость сидит на своём месте — либо она там есть, либо её там нет,
   и никакая перезагрузка этого не качнёт. Собрать все сто — работа на всё
   прохождение, и её итог (планета, M97) нельзя купить, как нельзя перебрать.

   ПРАВИЛА ФАЙЛА:
   1. Таблица ЗАКРЫТА и ровно на сто записей. Генерируется детерминированно от
      постоянного зерна (как NODES), но фиксирована навсегда: id уже выданной
      редкости не должен меняться от правки генератора.
   2. Место — детерминированная функция ключа места, а не бросок. Ключ памятника
      (q.seed), пещеры, выработки пояса, логова, остова баржи всегда даёт одну и
      ту же редкость. Farming перезагрузкой невозможен: то же место — тот же ответ.
   3. Достижимость гарантируется раскладкой по остаткам от деления: ключей мест
      бесконечно много, редкостей — сто, поэтому у каждой редкости бесконечно
      много ключей, которые на неё указывают. Ни одной недостижимой (тот же
      сторож, что нашёл 500 недостижимых узлов на M91).
   4. Эффект — маленький и никогда не кредиты: памятник не банкомат, и витрина
      тоже. Читается там же, где модули и венцы, — из stat() и подобных.
   5. Персистится только унесённое: G.rareFound — список id, дефолт []. */

/* где редкости водятся: только среди уже живых мест. `live` отвечает на вопрос
   теста «есть ли такое место в галактике вообще» — тем же, чем игра решает,
   что показать игроку. */
const RARE_WHERE=[
  {id:"poi",   ru:"на памятнике",       live:(sx,sy,s)=>s.planets.some(p=>p.type!=="gas")},
  {id:"temple",ru:"под плитами храма",  live:(sx,sy,s)=>s.planets.some(p=>["terran","toxic","desert","ocean","jungle","ruin"].indexOf(p.type)>=0)},
  {id:"cave",  ru:"в глубине пещеры",   live:(sx,sy,s)=>s.planets.some(p=>p.type!=="gas")},
  {id:"belt",  ru:"в выработке пояса",  live:(sx,sy,s)=>!!s.belt},
  {id:"lair",  ru:"в логове барона",    live:(sx,sy,s)=>sysDanger(sx,sy)>.5},
  {id:"barge", ru:"в трюме баржи",      live:(sx,sy,s)=>!!s.station}
];
const RARE_WHERE_IX={};RARE_WHERE.forEach((w,i)=>RARE_WHERE_IX[w.id]=i+1);
/* эффекты: один тег на редкость, малый по величине, читается из stat(). Ни один
   тег не про кредиты — редкость даёт свойство вещи, а не деньги. `mul:true` —
   слагаемое к множителю (×(1+Σ)), иначе прямая прибавка к статy. */
const RARE_FX=[
  {tag:"see",   ru:"радар дальше",       base:60, mul:false},
  {tag:"cargo", ru:"трюм просторнее",    base:.03,mul:true},
  {tag:"fuel",  ru:"бак глубже",         base:7,  mul:false},
  {tag:"drill", ru:"добыча быстрее",     base:.05,mul:true},
  {tag:"dmg",   ru:"орудие злее",        base:.06,mul:true},
  {tag:"thr",   ru:"тяга ровнее",        base:.04,mul:true},
  {tag:"turn",  ru:"поворот острее",     base:.05,mul:true},
  {tag:"shield",ru:"щит плотнее",        base:6,  mul:false},
  {tag:"jump",  ru:"прыжок дальше",      base:1,  mul:false},
  {tag:"bounty",ru:"награда за голову выше",base:.05,mul:true},
  {tag:"drone", ru:"дроны прилежнее",    base:.04,mul:true},
  {tag:"cool",  ru:"ствол остывает",     base:.05,mul:true}
];
const RARE_GRADES=[
  {id:"обиходная", w:40,mul:1  },
  {id:"приметная", w:26,mul:1.4},
  {id:"именная",   w:18,mul:2  },
  {id:"забытая",   w:11,mul:3  },
  {id:"баснословная",w:5,mul:4.5}
];
/* слова для имени: существительные только мужского рода — иначе прилагательное
   не согласуется («Стеклянный линза»), и вещь читается опечаткой, а не находкой */
const RARE_A=["Стеклянный","Поющий","Немой","Лунный","Кровавый","Спящий","Слепой",
  "Вечный","Треснувший","Полый","Солёный","Дымный","Ледяной","Ржавый","Медный",
  "Костяной","Зеркальный","Тихий","Голодный","Сизый","Смолистый","Меловой",
  "Янтарный","Гулкий","Восковой"];
const RARE_B=["венец","глаз","компас","ключ","осколок","медальон","гвоздь","колокол",
  "кубок","перстень","якорь","фонарь","череп","гребень","свиток","кинжал","маятник",
  "идол","бубен","зуб","коготь","жетон","кокон","обелиск","слепок"];
const RARE_NOTE=["никто не помнит, кто его сделал","он теплее, чем должен быть",
  "на нём чужие буквы","за него убивали","он был чьим-то до вас","он не отбрасывает тени",
  "его искали дольше, чем помнят","он звенит без ветра","в нём заперт чей-то день",
  "он старше этой звезды","его считали выдумкой","он не тонет и не горит",
  "от него отводят глаза","он помнит другую руку","его нельзя купить",
  "он холоден даже на солнце"];
const RARE=[];
const RARE_BY_ID={};
const RARE_BY_WHERE={};
const RARE_SALT=0x2A2E;
(function buildRare(){
  const seen={};
  for(let i=0;i<100;i++){
    const seed=hashi(RARE_SALT,i*131+7,0x2AB1E), r=rng(seed);
    /* where раскладываем циклом, а не броском: так каждое из шести мест
       гарантированно населено, и ни одно не остаётся пустым */
    const W=RARE_WHERE[i%RARE_WHERE.length];
    /* грейд взвешенно: баснословных единицы на всю таблицу */
    let tot=0;for(const g of RARE_GRADES)tot+=g.w;
    let roll=r()*tot,grade=RARE_GRADES[0];
    for(const g of RARE_GRADES){roll-=g.w;if(roll<=0){grade=g;break;}}
    const fx=RARE_FX[(seed>>>3)%RARE_FX.length];
    const val=fx.mul?+(fx.base*grade.mul).toFixed(3):Math.max(1,Math.round(fx.base*grade.mul));
    /* имя из двух слов, при совпадении — номер серии, как у корпусов и узлов */
    let base=pick(RARE_A,r)+" "+pick(RARE_B,r);
    const n0=(seen[base]|0);seen[base]=n0+1;
    const ru=n0?base+" "+(n0+1):base;
    const rec={id:"r"+i,idx:i,ru,where:W.id,whereRu:W.ru,
      grade:grade.id,note:pick(RARE_NOTE,r),
      fx:{tag:fx.tag,ru:fx.ru,val,mul:fx.mul},seed};
    RARE.push(rec);RARE_BY_ID[rec.id]=rec;
    (RARE_BY_WHERE[W.id]||(RARE_BY_WHERE[W.id]=[])).push(rec);
  }
})();
/* ── унесённое ── список id, дефолт [] (14-save) */
function rareList(){return (G.rareFound||(G.rareFound=[]));}
function rareHas(id){return rareList().indexOf(id)>=0;}
function rareCount(){return rareList().length;}
/* ── что лежит в этом месте ──
   Ключ места (стабильный seed) детерминированно указывает на одну редкость.
   Никакого шанса: то же место — тот же ответ, всегда. */
function rareAtPlace(where,key){
  const pool=RARE_BY_WHERE[where];if(!pool||!pool.length)return null;
  const h=hashi((key>>>0)||1,RARE_SALT,RARE_WHERE_IX[where]||1);
  return pool[(h%pool.length+pool.length)%pool.length];
}
/* забрать, если она тут есть и ещё не унесена. Возвращает запись либо null.
   placeRu — фактическое место находки: «на памятнике» — адрес ветки, и у
   остова корабля он читался опечаткой (плейтест 30.08.2026). Витрина и
   раскладка по-прежнему живут на whereRu, карточка находки — на месте. */
function rareTake(where,key,placeRu){
  const R=rareAtPlace(where,key);
  if(!R||rareHas(R.id))return null;
  /* её унесли раньше вас (12p): место пусто, но предмет не потерян — сменился
     адрес, и новый адрес — человек */
  if(typeof rivalHolds==="function"&&rivalHolds(R.id)){
    const V=rivalOf(R.id);
    tell("dim","Здесь было пусто: «"+R.ru+"» унёс "+V.who,
         "«"+R.ru+"»\nздесь её больше нет\nона у "+V.who+" · сектор "+V.sx+", "+V.sy);
    return null;
  }
  rareList().push(R.id);
  const c=rareCount();
  const at=placeRu||R.whereRu;
  tell("tech","Редкость: «"+R.ru+"» · "+c+"/100",
       "«"+R.ru+"»\n"+R.grade+", "+R.note+"\n"+at+"\nэффект: "+R.fx.ru+
       "\n\nсобрано редкостей: "+c+" из 100");
  logAdd("tech","Найдена редкость «"+R.ru+"» ("+at+") · "+c+"/100");
  /* сотая редкость — единственный вход в планету (12n): не покупка и не выбор,
     а следствие полноты. Стоим там, где нашли, — эта планета и станет узлом. */
  if(c>=100&&typeof planetGrant==="function")planetGrant();
  if(typeof saveGame==="function")saveGame(true);
  return R;
}
/* ── эффект ── сумма по тегу среди унесённых. stat() и подобные читают отсюда,
   не заводя отдельной системы множителей. */
function rareSum(tag){
  let s=0;const list=rareList();
  for(let i=0;i<list.length;i++){
    const R=RARE_BY_ID[list[i]];
    if(R&&R.fx.tag===tag)s+=R.fx.val;
  }
  return s;
}
/* ── витрина ── сотня редкостей не списком (это склад), а сводкой: сколько
   собрано, по каким местам разложено остальное, что уже даёт. Полноценная
   стена-музей — в доме (M100); здесь — доска рядом с наборами узлов. */
function rareRender(){
  const done=rareCount();
  $body.appendChild(el("div","sec","РЕДКОСТИ · "+done+" / 100 · У КАЖДОЙ СВОЙ АДРЕС, "+
    "НЕ ШАНС"));
  $body.appendChild(el("div","row","<div class='nm'><s>редкость сидит на одном "+
    "месте: либо она там есть, либо нет. Перебором не берётся. Полный набор из ста "+
    "открывает то, что нельзя купить.</s></div>"));
  /* где искать: по каждому месту — сколько его редкостей ещё не унесено */
  for(const W of RARE_WHERE){
    const pool=RARE_BY_WHERE[W.id]||[];
    const got=pool.filter(R=>rareHas(R.id)).length;
    const pct=pool.length?Math.round(got/pool.length*100):0;
    $body.appendChild(el("div","row","<div class='nm'><b>"+W.ru+"</b><s>"+got+
      " из "+pool.length+" · "+pct+"%</s></div>"));
  }
  /* последние находки: коллекция должна рассказывать, а не только считать */
  const have=rareList().map(id=>RARE_BY_ID[id]).filter(Boolean);
  if(have.length){
    $body.appendChild(el("div","sec","ПОСЛЕДНИЕ РЕДКОСТИ"));
    for(const R of have.slice(-6).reverse())
      $body.appendChild(el("div","row","<div class='nm'><b>«"+R.ru+"»</b><s>"+
        R.grade+" · "+R.whereRu+" · "+R.note+" · "+R.fx.ru+"</s></div>"));
  }
}
