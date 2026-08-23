/* ══════════════ линия смотрителей: один человек держит навигацию уезда ══════════════
   M139-keepers. Не физика — ИНФРАСТРУКТУРА. Цепочка маяков вдоль оживлённого
   рукава (06c, `keepers`, игла курсографа), по которой все ходят. Топливо,
   ремонт, чай. В ядре — станция смотрителя: обыкновенный человек, даёт
   топливо, координаты, мелкий ремонт, и время от времени просит привезти
   один расходник. Разговор о снабжении и погоде.

   ПРИВЫЧКА ЗА 6–8 ВИЗИТОВ (счётчик посадок 11b): молчаливая передача; потом
   он знает, что вам нужно, раньше, чем вы сказали; потом вторая кружка на
   столе; потом ящик уже вынесен.

   ОН УХОДИТ ТИХО. Кружка вымыта и перевёрнута, койка заправлена. Человек,
   который прибрался перед уходом. Тела нет никогда — это такт, не загадка.

   ПЕРВАЯ ВЫПЛАТА — СЛЕДСТВИЕ. Рукав начинает гаснуть: курсограф гуляет по
   этим системам, прокладка стоит больше топлива, чужие теряются в эфире.
   ВТОРАЯ — СПИСОК НА ПЕРЕБОРКЕ: двенадцать имён вычеркнуты, десятилетия между
   ними. Он двенадцатый. Его не сменили — просто перестали присылать. Он не
   жил там, он СТОЯЛ ВАХТУ, а с поста без смены не уходят.
   ТРЕТЬЯ — ПУСТАЯ СТРОКА ВНИЗУ. Расписаться можно. Это не задание: это возить
   расходник, вечно, бесплатно, и это скучно. Скука и есть то, чем игрок
   понимает, что этот человек делал сорок лет. Отказался — рукав гаснет,
   уезд дорожает и опаснеет для всех, включая вас; никто не винит и никто не
   замечает.
   РИФМА ВМЕСТО ОБЪЯСНЕНИЯ: далеко, в ядре «Перевала», вторая такая станция и
   второй такой человек, живой. Ни слова пояснения. Если вы в списке — он
   здоровается как со своим.

   ПРАВИЛА ФАЙЛА:
   1. Ни таймера, ни провала, ни награды. Подпись ничего не даёт, кроме того,
      что рукав не гаснет.
   2. Хранится G.keepers: {gone,signed,fed,given}. Остальное — от счётчиков. */

const KEEP_NEED="organics";                 // расходник линии: паёк
const KEEP_HABIT=[
  "Заправил. Погода по рукаву тихая, идите спокойно.",
  "Заправил. Координаты второго маяка обновил — там снесло буй.",
  null,                                      /* молчаливая передача */
  null,
  "Вам топлива полный и по правому борту фильтр — я уже знаю. Держите.",
  "Паёк кончается, привезите при случае. Не срочно.",
  "Вторая кружка на столе. Чай остыл, но ничего.",
  "Ящик уже вынесен. Садитесь, я сам.",
  "Ящик вынесен. Сегодня туман по всему рукаву, но вы дойдёте."
];
const KEEP_ROSTER=["Аникеев","Бродский Г.","Варенцов","Дьячкова","Ефимов","Жарков",
  "Зотов","Игнатьева","Колесов","Луконин","Мезенцев","Нагорный Т."];
const KEEP_DARK_AFTER=12;                   // прыжков без пайка — рукав гаснет
function keepersAll(){return (G.keepers||(G.keepers={gone:0,signed:0,fed:0,given:0}));}
function keepersDepthAt(sx,sy){
  if(typeof regionAt!=="function")return 0;
  const R=regionAt(sx,sy);
  if(R.theme!=="keepers")return 0;
  return (R.core.sx===sx&&R.core.sy===sy)?2:1;
}
function keepersDepthHere(){return keepersDepthAt(G.sx,G.sy);}
/* вторая станция — ядро «Перевала» (рифма) */
function keepersRhymeHere(){
  const at=(typeof regionOfTheme==="function")?regionOfTheme("pass"):null;
  if(!at)return false;
  const R=regionAt(at.rx*REGION_SPAN,at.ry*REGION_SPAN);
  return R.core.sx===G.sx&&R.core.sy===G.sy;
}
/* ── гаснет ли рукав ──
   Ушёл и никто не расписался — гаснет. Расписался — горит, пока паёк
   привозят не реже раза в KEEP_DARK_AFTER прыжков. */
function keepersDark(){
  const K=keepersAll();
  if(!K.gone)return false;
  if(!K.signed)return true;
  return ((G.odo&&G.odo.jumps)|0)-K.fed>KEEP_DARK_AFTER;
}
/* следствия: курсограф гуляет, прокладка дороже, в эфире теряются */
function keepersCourseDrift(){return (keepersDepthHere()&&keepersDark())?.6:0;}
function keepersJumpK(){return (keepersDepthHere()&&keepersDark())?1.5:1;}
function keepersEtherLine(r){
  if(!keepersDepthHere()||!keepersDark()||r()>.4)return null;
  return pick(["…кто-нибудь, дайте отсчёт по маяку. Маяк? Не слышу маяка.",
    "…конвой «Сажень», разворачиваемся, прокладка не сходится. Идём назад.",
    "…третий маяк молчит вторые сутки. Кто там стоит? Кто-нибудь там стоит?"],r);
}
/* ── стыковка у смотрителя ──
   Зовётся из openStation один раз за посадку. Возвращает строку или null. */
let KEEP_LAST=null;
function keepersDock(){
  const K=keepersAll();
  if(keepersRhymeHere()){
    const line=K.signed?"Свой. Проходи, чай горячий.":"Заправил. Рукав у нас тихий. Идите.";
    logAdd("dim","Смотритель: "+line);
    return KEEP_LAST={v:odoSum(),line,rhyme:true};
  }
  if(keepersDepthHere()!==2)return null;
  if(K.gone){
    const line=K.signed?"Тихо. Кружка на месте. Паёк — в ящик у двери.":"Кружка вымыта и перевёрнута. Койка заправлена.";
    return KEEP_LAST={v:odoSum(),line,gone:true};
  }
  const n=visitHere()|0;
  /* паёк берёт сам, если есть: разговор о снабжении, а не торг */
  let took=false;
  if(n>=3&&(G.cargo[KEEP_NEED]|0)>0&&(n%3)===0){G.cargo[KEEP_NEED]--;K.given=(K.given|0)+1;took=true;if(typeof placeNote==="function")placeNote("care",1);}
  /* уходит: после девяти посадок — в десятую уже никого */
  if(n>=10){
    K.gone=1;
    const line="Кружка вымыта и перевёрнута. Койка заправлена.";
    logAdd("dim","Станция смотрителя: "+line);
    return KEEP_LAST={v:odoSum(),line,gone:true,first:true};
  }
  const h=KEEP_HABIT[Math.min(n,KEEP_HABIT.length-1)];
  const line=(h===null?null:h)||(took?"(кивнул, забрал паёк)":"(кивнул, заправил)");
  logAdd("dim","Смотритель: "+line);
  return KEEP_LAST={v:odoSum(),line,n};
}
/* расписаться: с этого момента рукав держите вы */
function keepersSign(){
  const K=keepersAll();
  if(!K.gone||K.signed)return false;
  K.signed=1;K.fed=(G.odo&&G.odo.jumps)|0;
  logAdd("good","Расписались в списке смотрителей. Тринадцатый.");
  return true;
}
/* оставить паёк в ящик у двери */
function keepersFeed(){
  const K=keepersAll();
  if(!K.signed||(G.cargo[KEEP_NEED]|0)<1)return false;
  G.cargo[KEEP_NEED]--;K.fed=(G.odo&&G.odo.jumps)|0;K.given=(K.given|0)+1;
  logAdd("dim","Паёк в ящике. Рукав горит.");
  return true;
}
/* ── блок в кантине ──
   Строка смотрителя на этой посадке; после ухода — список на переборке и
   пустая строка; после подписи — ящик для пайка и сколько прыжков осталось. */
function keepersBlock(){
  const K=keepersAll();
  const said=KEEP_LAST&&KEEP_LAST.v===odoSum()?KEEP_LAST:null;
  const here=keepersDepthHere()===2;
  if(!said&&!here)return;
  $body.appendChild(el("div","sec",here?"СТАНЦИЯ СМОТРИТЕЛЯ":"МАЯК"));
  if(said)$body.appendChild(el("div","row","<div class='nm'><s style='color:#cfe3ea;line-height:1.9'>"+said.line+"</s></div>"));
  if(here&&K.gone){
    const names=KEEP_ROSTER.map((nm,i)=>"<s style='text-decoration:line-through;opacity:.7'>"+(i+1)+". "+nm+"</s>").join("<br>");
    const you=K.signed?"<s>13. — вы</s>":"<s style='opacity:.5'>13. ______________</s>";
    $body.appendChild(el("div","row","<div class='nm'><b>Список на переборке</b><br>"+names+"<br>"+you+"</div>"));
    if(!K.signed){
      const r=el("div","row");
      r.appendChild(el("div","nm","<b>Расписаться</b><s>возить паёк сюда, всегда, бесплатно. Это не задание</s>"));
      const b=el("button","act sm","РАСПИСАТЬСЯ");b.onclick=()=>{keepersSign();renderTab();};
      r.appendChild(b);$body.appendChild(r);
    }else{
      const left=KEEP_DARK_AFTER-(((G.odo&&G.odo.jumps)|0)-K.fed);
      const r=el("div","row");
      r.appendChild(el("div","nm","<b>Ящик у двери</b><s>"+(left>0?"рукав горит · ещё "+left+" прыжков":"рукав гаснет — нужен паёк")+" · у вас: "+RES[KEEP_NEED].ru+" ×"+(G.cargo[KEEP_NEED]|0)+"</s>"));
      const b=el("button","act sm","ОСТАВИТЬ ПАЁК");b.disabled=(G.cargo[KEEP_NEED]|0)<1;b.onclick=()=>{keepersFeed();renderTab();};
      r.appendChild(b);$body.appendChild(r);
    }
  }
}
