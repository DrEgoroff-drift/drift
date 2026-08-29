/* ══════════════ оборот карточки ══════════════
   M189. Лицо открытки — фотография, и её рисует художник (25g). Оборот — не
   картинка, а БЛАНК, и он сделан разметкой, а не канвой, по двум причинам.
   Первая: по варианту надо попадать пальцем, а попадание в текст на канве —
   это своя раскладка, свои метрики и своя беда с переносами на узком экране.
   Вторая: печатный текст в разметке остаётся текстом — его видно на любом
   размере и он не мылится вдвое на плотном экране.

   ВЫЧЁРКИВАНИЕ — И ЕСТЬ ВЕСЬ ЖЕСТ. Тычок по варианту не «выбирает пункт
   меню»: он оставляет один вариант и зачёркивает соседей, ровно как это
   делают карандашом на настоящем бланке. Поэтому невыбранные не прячутся —
   их обязательно видно вычеркнутыми, иначе пропадает и смысл бланка, и то,
   что чужая карточка рассказывает о человеке ТЕМ, ЧТО ОН ВЫЧЕРКНУЛ.

   ПРИПИСКА — до трёх глифов посёлкового пиджина (12t). Что они значат, игра
   не объясняет никогда и никому: значение люди назначат сами, между собой, и
   это единственное место, где через границу проходит смысл, которого в игре
   не написано.

   ШТАМП — место и час, снятые с фотографии. Не имя. Имени нет нигде и не
   будет: по карточке узнают не человека, а того, кто так вычёркивает.

   ПРАВИЛА ФАЙЛА:
   1. Хранится на самом снимке: `f` — бланк, `c` — выбор по строкам,
      `g` — глифы приписки. Всё вместе — десяток байт сверх снимка.
   2. Ни одного поля ввода. Никогда. */
const POST_PS_MAX=3;
/* ВЫБОР ЛЕЖИТ В `c`, А НЕ В `m`. В снимке `m` — это РЕЖИМ съёмки («s» с грунта,
   «l» с захода), и первый счёт клал туда же массив вычёркиваний: подписанная
   карточка с захода мгновенно теряла посадочный аппарат и рисовала человека.
   Поймано тестом на размер провода, а не глазами. */
function postSigned(s){return !!(s&&s.f&&Array.isArray(s.c));}
/* подписать снимок: бланк по месту и все строки — значениями по умолчанию.
   Отправить можно прямо сейчас, не тронув ни одного варианта */
function postSign(s){
  if(!s||postSigned(s))return s;
  s.f=postFormFor(s);
  s.c=postForm(s.f).l.map(()=>0);
  s.g=[];
  return s;
}
/* смена бланка: выбор по строкам обнуляется — у нового бланка другие строки,
   и перенести на них старые вычёркивания значило бы соврать */
function postSetForm(s,id){
  s.f=id;s.c=postForm(id).l.map(()=>0);
  return s;
}
function postChoose(s,li,vi){
  if(!s||!Array.isArray(s.c))return false;
  s.c[li]=vi;return true;
}
/* глиф в приписке: тычок добавляет, повторный — убирает. Больше трёх не
   ложится: приписка — это приписка, а не вторая сторона разговора */
function postGlyph(s,gi){
  if(!s)return false;
  if(!Array.isArray(s.g))s.g=[];
  const at=s.g.indexOf(gi);
  if(at>=0){s.g.splice(at,1);return true;}
  if(s.g.length>=POST_PS_MAX)return false;
  s.g.push(gi);return true;
}
/* строка карточки словами — для журнала и для получателя, который читает
   карточку в печатных строках ночного эфира (M191) */
function postRead(s){
  if(!postSigned(s))return "";
  const F=postForm(s.f);
  return F.l.map((ln,i)=>ln[0]+" — "+(ln[1+(s.c[i]|0)]||ln[1])).join(" · ");
}
/* ── карточка вслух ──
   Ночной эфир (M191) читает её так, как читали телеграммы: по строке за раз,
   с названием бланка в начале и местом в конце. Оттого чужая карточка и
   доходит — её не показывают целиком, её приходится дослушать. */
function postLines(s){
  if(!postSigned(s))return [];
  const F=postForm(s.f);
  const out=["…карточка. Бланк «"+F.ru.toLowerCase()+"»."];
  F.l.forEach((ln,i)=>out.push(ln[0].toLowerCase()+" — "+(ln[1+(s.c[i]|0)]||ln[1])+"."));
  if(s.g&&s.g.length)
    out.push("приписка: "+s.g.map(g=>SETTLE_GLYPH[g%SETTLE_GLYPH.length]).join(" ")+".");
  out.push("место — "+postCaption(s)+". Конец карточки.");
  return out;
}
/* ── оборот разметкой ──
   `ro` — чужая карточка: её читают, а не заполняют. Тогда варианты становятся
   просто текстом (выбранный обычным, соседи вычеркнутыми), а перелистывание
   бланка и азбука глифов пропадают вовсе: оставить их «на всякий случай»
   значило бы предложить править чужое письмо. */
function renderCardBack(host,s,onChange,ro){
  host.innerHTML="";
  if(!postSigned(s))return;
  const F=postForm(s.f);
  const el=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;
    if(h!=null)e.textContent=h;return e;};
  const back=el("div","pcback");

  /* шапка: название бланка и перелистывание. Тридцать бланков списком — это
     список, а открытка — вещь; листается по одному, как в пачке на почте */
  const hd=el("div","hd");
  const nm=el("b",null,F.ru+(F.no?"":""));
  const kd=el("i",null,POST_KINDS[F.k]?POST_KINDS[F.k].ru:"");
  hd.appendChild(nm);hd.appendChild(kd);
  if(!ro){
    const nav=el("div","nav");
    /* стрелки без слова читаются как «листать карточки», а листают они БЛАНК —
       и то, что бланков три десятка, иначе не узнать вовсе */
    nav.appendChild(el("s",null,"бланк"));
    for(const d of [-1,1]){
      const b=el("button","flip",d<0?"‹":"›");
      b.onclick=e=>{e.stopPropagation();postSetForm(s,postFormNext(s.f,d));onChange&&onChange();};
      nav.appendChild(b);
    }
    hd.appendChild(nav);
  }
  back.appendChild(hd);

  /* строки: выбранный вариант остаётся, соседи зачёркиваются */
  F.l.forEach((ln,li)=>{
    const row=el("div","ln");
    row.appendChild(el("em",null,ln[0]));
    const vs=el("span","vs");
    for(let vi=0;vi<ln.length-1;vi++){
      const on=(s.c[li]|0)===vi;
      /* класс НЕ «v»: в игре уже есть глобальный `.v` — строка прибора
         (display:grid с колонками 64/88/46), и варианты бланка молча получали
         её сетку, растягиваясь на четверть карточки каждый */
      const b=el(ro?"span":"button","pcv"+(on?" on":" off"),ln[1+vi]);
      if(!ro)b.onclick=e=>{e.stopPropagation();postChoose(s,li,vi);onChange&&onChange();};
      vs.appendChild(b);
    }
    row.appendChild(vs);
    back.appendChild(row);
  });

  /* приписка глифами */
  const ps=el("div","ps");
  ps.appendChild(el("em",null,"приписка"));
  const slots=el("span","slots");
  for(let i=0;i<POST_PS_MAX;i++){
    const has=s.g&&s.g[i]!=null;
    const slot=el("i",has?"g":"g e");
    /* знак рисуется, а не набирается (M261); чернила — цвет бумаги открытки */
    if(has)slot.appendChild(glyphEl(s.g[i]%SETTLE_GLYPH.length,"#3c352a"));
    else slot.textContent="·";
    slots.appendChild(slot);
  }
  ps.appendChild(slots);
  back.appendChild(ps);
  if(!ro){
    const alph=el("div","alph");
    for(let gi=0;gi<SETTLE_GLYPH.length;gi++){
      const on=(s.g||[]).indexOf(gi)>=0;
      const b=el("button","gl"+(on?" on":""));
      b.appendChild(glyphEl(gi,"#3c352a"));
      b.onclick=e=>{e.stopPropagation();postGlyph(s,gi);onChange&&onChange();};
      alph.appendChild(b);
    }
    back.appendChild(alph);
  }

  /* ── сторона адреса ──
     На всякой почтовой карточке правая половина оборота — «кому» и «куда», и
     здесь она пуста НЕ по недосмотру. Пустое место читалось бы браком вёрстки,
     поэтому пустота названа вслух печатной строкой: карточка уходит в общую
     почту, адресата у неё нет. Одна строка объясняет правило, на котором стоит
     вся затея, — и объясняет её как часть мира, а не как справку интерфейса. */
  const ad=el("div","addr");
  ad.appendChild(el("i","box",""));
  ad.appendChild(el("s",null,"адресат не указывается · карточка идёт в общую почту"));
  back.appendChild(ad);

  /* штамп: место и час, никогда — имя */
  const st=el("div","stamp");
  st.appendChild(el("b",null,postCaption(s).toUpperCase()));
  st.appendChild(el("s",null,F.no?"форма "+F.no:"почтовая карточка"));
  back.appendChild(st);

  host.appendChild(back);
}
