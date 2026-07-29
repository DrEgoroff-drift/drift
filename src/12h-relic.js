/* ══════════════ артефакты и лаборатория ══════════════
   Последний невыполненный шаг порядка из DESIGN-managers.md (§14.7).

   До этого исследователь разбирал образцы «в воздухе»: роль была, домена не было.
   Лаборатория — его домен, здание на базе: дорогое, прожорливое и бесполезное
   без жилого отсека рядом. Пустая лаборатория — то же, что пустое звено
   у командира: человек на окладе и без работы.

   Артефакт — единственная вещь в игре с глобальным эффектом. Слот один на
   управляющего, поэтому семь артефактов на прохождение — это всегда выбор,
   кому дать и что оставить в ящике. Вторая строка эффекта открывается только
   при исследователе с перком «чтение»: без него артефакт работает вполшага,
   и это единственная причина держать исследователя, кроме чертежей. */

/* ── лаборатория ── */
function labCount(){
  let n=0;
  for(const k in G.bases){
    const B=G.bases[k];
    if(!B||!B.cells)continue;
    for(const c of B.cells)if(c&&c.k==="lab"&&c.hp>0)n++;
  }
  return n;
}
/* Жилой отсек рядом — не украшение: разбирать образцы вахтой из скафандра нельзя.
   Проверяем соседей по строке и столбцу, как и всё прочее на сетке базы. */
function labStaffed(B,i){
  const c=i%BASE_COLS, r=Math.floor(i/BASE_COLS);
  const at=(cc,rr)=>(cc<0||rr<0||cc>=BASE_COLS||rr>=BASE_ROWS)?null:B.cells[rr*BASE_COLS+cc];
  return [at(c-1,r),at(c+1,r),at(c,r-1),at(c,r+1)].some(x=>x&&x.k==="habitat"&&x.hp>0);
}
function labWorking(){
  for(const k in G.bases){
    const B=G.bases[k];
    if(!B||!B.cells)continue;
    for(let i=0;i<B.cells.length;i++){
      const c=B.cells[i];
      if(c&&c.k==="lab"&&c.hp>0&&labStaffed(B,i))return true;
    }
  }
  return false;
}

/* ── таблица ──
   Первая строка работает всегда. Вторая — только с «чтением» (§12).
   Эффекты глобальные, поэтому у каждого есть свой крючок в чужом модуле;
   здесь только объявление, чтобы правки шли в одном месте. */
const ARTIFACTS={
  seal:  {ru:"Печать конвоя", one:"наёмники не упрямятся с приказом",
          two:"отзыв доходит мгновенно, на любой дистанции"},
  dice:  {ru:"Счётная кость", one:"удача нового наёмника не бывает ниже средней",
          two:"удачу одного наёмника можно перебросить"},
  chart: {ru:"Карта чужой руки", one:"на карте видно, где торгуют редким",
          two:"и то, чего там ещё нет"},
  blank: {ru:"Пустой контракт", one:"доля всех управляющих меньше на 3 пункта",
          two:"лояльность больше не падает от задержек жалованья"},
  key:   {ru:"Ключ от верфи", one:"уникальный корпус встречается в любом доке",
          two:"и приходит уже с частями в слотах"},
  ledger:{ru:"Чёрный журнал", one:"скрытая удача наёмников видна числом",
          two:"и черты управляющих видны в кантине до найма"},
  quiet: {ru:"Тихий маяк", one:"ИИ-ядро набирает дрейф вдвое медленнее",
          two:"разошедшееся ядро можно уговорить вернуться"}
};
const RELIC_KEYS=Object.keys(ARTIFACTS);

/* ── владение и слоты ── */
function relicHave(id){return !!(G.relics&&G.relics[id]);}
function relicOwned(){return RELIC_KEYS.filter(relicHave);}
/* Слот появляется только с «Ксеноархивом»: до него артефакт — просто находка
   в ящике, и это честно видно в интерфейсе. */
function relicSlotOpen(){return techLv("relic")>0;}
function relicHolder(id){return (G.mgrs||[]).find(m=>m.relic===id&&!m.stalled)||null;}
/* Первая строка: артефакт найден и надет на живого управляющего. */
function relicOn(id){return relicSlotOpen()&&relicHave(id)&&!!relicHolder(id);}
/* Вторая строка: сверх того есть исследователь, умеющий читать. */
function relicDeep(id){return relicOn(id)&&!!mgrPerkOf("sci","relic");}

function relicEquip(m,id){
  if(!relicSlotOpen()){say("Нужен «Ксеноархив»\nбез него артефакт носить негде");return false;}
  if(!relicHave(id))return false;
  const other=relicHolder(id);
  if(other&&other!==m)other.relic=null;      // артефакт один, носить его двоим нельзя
  m.relic=id;
  mgrSay(m,"Взял «"+ARTIFACTS[id].ru+"»");
  return true;
}
function relicUnequip(m){if(m.relic){mgrSay(m,"Отдал «"+ARTIFACTS[m.relic].ru+"»");m.relic=null;}}

/* ── находки ──
   Артефакт не покупается: он приходит из глубины, с боя или из синтеза. */
function relicFind(id,why){
  if(!id||!ARTIFACTS[id]||relicHave(id))return false;
  if(!G.relics)G.relics={};
  G.relics[id]=1;
  const A=ARTIFACTS[id];
  logAdd("tech","Артефакт: «"+A.ru+"» — "+(why||"находка"));
  tell("tech","Артефакт: «"+A.ru+"»",
    "«"+A.ru+"»\n"+A.one+
    (relicSlotOpen()?"\nэкран ШТАБ — надеть на управляющего"
                    :"\nнужен «Ксеноархив», чтобы его носили"));
  return true;
}
/* Случайный из ненайденных — общий вход для всех источников. */
function relicRoll(seed,chance){
  const free=RELIC_KEYS.filter(k=>!relicHave(k));
  if(!free.length)return null;
  const r=rng(seed);
  if(r()>chance)return null;
  return free[Math.floor(r()*free.length)];
}
/* «Синтез»: два артефакта в руках дают третий. Перк поздний и стоит очка —
   поэтому и срабатывает не мгновенно, а раз в долгую работу лаборатории. */
function relicSynth(m){
  if(!mgrPerk(m,"synth"))return false;
  if(relicOwned().length<2)return false;
  const id=relicRoll(hashi(m.seed,Math.floor(Date.now()/60000),0x5E7),.04);
  if(!id)return false;
  relicFind(id,"синтез в лаборатории");
  mgrSay(m,"Собрал третий из двух. Не спрашивайте как.","good");
  return true;
}
/* «Происхождение»: артефакт указывает, где искать следующий. Метка живёт
   на карте, как ренегат и расхождение, — иначе указание некуда положить. */
function relicHint(m){
  if(!mgrPerk(m,"trace"))return false;
  if(G.relicHint)return false;
  if(!relicOwned().length)return false;
  const r=rng(hashi(m.seed,relicOwned().length*31,0x7A9));
  for(let i=0;i<40;i++){
    const sx=G.sx+Math.round((r()*2-1)*5), sy=G.sy+Math.round((r()*2-1)*5);
    if(starAt(sx,sy)){
      G.relicHint={sx,sy};
      mgrSay(m,"В записях есть координаты: "+sx+":"+sy,"good");
      tell("tech","След артефакта: сектор "+sx+":"+sy,
        "Исследователь вычитал координаты\nсектор "+sx+":"+sy+"\nищите в глубине");
      return true;
    }
  }
  return false;
}
