/* ══════════════ небесная вахта ══════════════
   M195. Небо ведёт календарь с 0.126.0 (`06a-celest`): затмения, парады и
   кометы СЧИТАЮТСЯ, а не бросаются, и один и тот же день в одной и той же
   системе всегда даёт одно и то же небо. На это никто не смотрел. Институт
   (11ab) раздаёт темы про измерения — вахта его седьмая тема и первая, где
   место и срок названы вслух: быть там-то в такие-то сутки и записать.

   ГОНКА, А НЕ ПОРУЧЕНИЕ. Институт считает то же небо, что и вы, и через
   SKY_BULL суток после события выпускает свой бюллетень — расчётный, без
   наблюдателя. Успели сдать раньше — событие ваше: полная плата, данные,
   запись в книжке, и комета берёт имя. Опоздали — «сверка тоже работа»,
   половина платы и сухая строка. Ничего не теряется навсегда: наряд дают
   снова, небо никуда не денется.

   ИМЯ КОМЕТЫ. Единственное, что вахта кладёт в сохранение помимо самого
   наряда, — имя, закреплённое за системой. Берётся оно из трудовой книжки
   (11aa), а книжку пишут ДРУГИЕ: игрок физически не может назвать комету
   собой, и в этом весь смысл. Сама комета не меняется — она как считалась из
   семени, так и считается; меняется строка, которой её называют.

   ПРАВИЛА ФАЙЛА:
   1. Небо не хранится. Хранятся наряд, счётчик и имена комет.
   2. Прогноз — перебор по функциям 06a, а не своя таблица: у неба один
      источник правды, иначе институт и кабина разойдутся в сутках.
   3. Наряд один за раз. Два наряда в разных концах — это уже расписание, а
      не вахта. */
const SKY_BULL=6;                 /* суток от события до бюллетеня института */
const SKY_LAPSE=24;               /* суток после события — наряд протух */
const SKY_KINDS={
  comet:{ru:"комета",    need:"быть в системе, пока комета видна",  pay:190,data:3},
  conj: {ru:"парад тел", need:"быть в системе в день построения",   pay:150,data:2},
  ecl:  {ru:"затмение",  need:"стоять на грунте той самой планеты", pay:240,data:4}
};
function skyAll(){
  if(!G.duty||typeof G.duty!=="object")G.duty={o:null,named:{},n:0,late:0};
  if(!G.duty.named||typeof G.duty.named!=="object")G.duty.named={};
  return G.duty;
}
function skyWhere(o){return o?(o.kind==="ecl"?o.pname:("система "+o.sysName)):"";}

/* ── прогноз ──
   Ближайшее событие вида kind в системе, начиная с суток d0. Шаг подобран по
   ширине окна: комета висит у перигелия девять суток в каждую сторону, парад
   держится долями суток, затмение — шестой частью суток. Суточный шаг прошёл
   бы мимо двух последних, и институт называл бы дни, в которые ничего не
   происходит. */
function skyFind(sys,kind,d0,span,p){
  const step=kind==="comet"?1:(kind==="conj"?0.2:0.05);
  for(let d=d0;d<d0+span;d+=step){
    const t=d*CEL_DAY;
    if(kind==="comet"){const c=celComet(sys,t);if(c&&c.k>.45)return {d:Math.floor(d),k:c.k};}
    else if(kind==="conj"){const c=celConj(sys,t);if(c&&c.k>.35)return {d:Math.floor(d),k:c.k,n:c.n};}
    else{const e=celEclipse(p,t);if(e&&e.k>.5)return {d:Math.floor(d),k:e.k,full:!!e.full};}
  }
  return null;
}
/* идёт ли событие наряда прямо сейчас. Порог ниже, чем в прогнозе: институт
   называет сутки по уверенному ядру события, а зачесть обязан весь его ход */
function skyOn(o,t){
  if(!o||!G.sys||G.sys.sx!==o.sx||G.sys.sy!==o.sy)return 0;
  if(o.kind==="comet"){const c=celComet(G.sys,t);return c&&c.k>.40?c.k:0;}
  if(o.kind==="conj"){const c=celConj(G.sys,t);return c&&c.k>.30?c.k:0;}
  const p=(typeof celHere==="function")?celHere():null;
  if(!p||p.key!==o.pkey)return 0;
  const e=celEclipse(p,t);return e&&e.k>.45?e.k:0;
}
/* ── наряд ──
   Место ищется в соседях, а не под ногами: вахта обязана быть дорогой.

   ГОРИЗОНТ. Сутки календаря — минута игры, поэтому «через N суток» читается как
   «через N минут», и наряд дальше месяца — не задание, а запись в ежедневнике.
   Первый счёт брал первое попавшееся событие в полутора сотнях суток и выдал
   комету на 123-и: формально верно, играть нельзя. Горизонт — месяц; комете
   дано вдвое больше, она приходит редко и ради неё стоит подождать.

   ПОРЯДОК ВИДОВ — ОТ СЕМЕНИ, и вид выбирается раньше места: затмение бывает у
   каждой второй планеты и по ближайшему сроку выигрывало бы всегда, а тогда
   парад и комета не существовали бы. Сперва семя решает, ЧТО наблюдать, и лишь
   потом ищется ближайшее такое событие. */
const SKY_HOR=30;                 /* горизонт наряда, суток */
function skyPick(r){
  if(!G.sys)return null;
  /* фора не круглая: «через пять суток» три наряда подряд читается как таймер */
  const d0=celDay()+4+Math.floor(r()*6), cand=[];
  for(let dx=-3;dx<=3;dx++)for(let dy=-3;dy<=3;dy++){
    const q=Math.abs(dx)+Math.abs(dy);
    if(q<1||q>4)continue;
    const sx=G.sys.sx+dx,sy=G.sys.sy+dy;
    if(starAt(sx,sy))cand.push([sx,sy]);
  }
  if(!cand.length)return null;
  for(let i=cand.length-1;i>0;i--){const j=Math.floor(r()*(i+1));const t=cand[i];cand[i]=cand[j];cand[j]=t;}
  const kinds=["ecl","conj","comet"];
  for(let i=kinds.length-1;i>0;i--){const j=Math.floor(r()*(i+1));const t=kinds[i];kinds[i]=kinds[j];kinds[j]=t;}
  const near=cand.slice(0,5);
  for(const kind of kinds){
    const span=kind==="comet"?SKY_HOR*2:SKY_HOR;
    let best=null;
    for(const c of near){
      const sys=getSystem(c[0],c[1]);
      if(kind==="ecl"){
        let tried=0;
        for(const p of sys.planets){
          if(!p.moons||!p.moons.length||p.type==="gas")continue;
          if(++tried>2)break;
          const f=skyFind(sys,"ecl",d0,span,p);
          if(f&&(!best||f.d<best.day))best={sx:c[0],sy:c[1],sysName:sys.name,kind:"ecl",
            day:f.d,pkey:p.key,pname:p.name,full:f.full};
        }
      }else{
        const f=skyFind(sys,kind,d0,span);
        if(f&&(!best||f.d<best.day))best={sx:c[0],sy:c[1],sysName:sys.name,kind,day:f.d,n:f.n||0};
      }
    }
    if(best)return best;
  }
  return null;
}
/* Предложение стойки. Считается один раз на станцию и пятидневку: перебор по
   небу дешёвый, но не настолько, чтобы гонять его на каждой перерисовке. */
let SKY_OFF=null,SKY_OFF_KEY="";
function skyOfferHere(){
  if(!G.sys||!G.st||G.st.stype!=="sci")return null;
  const S=skyAll();
  /* один наряд за раз, и три дня тишины после закрытого: институт не выдаёт
     следующее небо в ту же минуту, в которую принял предыдущее */
  if(S.o||celDay()<(S.cool|0))return null;
  const w=Math.floor(celDay()/5), key=G.sys.sx+","+G.sys.sy+"@"+w;
  if(SKY_OFF_KEY===key)return SKY_OFF;
  SKY_OFF_KEY=key;SKY_OFF=null;
  const r=rng(hashi(G.sys.sx,G.sys.sy,0x5C1E+w));
  if(r()>.66)return null;
  SKY_OFF=skyPick(r);
  return SKY_OFF;
}
function skyTake(o){
  const S=skyAll();if(!o||S.o)return false;
  S.o=Object.assign({got:0,bull:0},o);
  thingAdd("paper","Наряд на наблюдение · "+SKY_KINDS[o.kind].ru,
    skyWhere(o)+" · сутки "+o.day+" · "+SKY_KINDS[o.kind].need+
    " · отчёт на стойке научной станции, до бюллетеня института",{sky:1});
  peopleLine("небо считает институт, а смотреть на него некому. Сутки в наряде — те самые, не округляйте.","стойка института",true);
  logAdd("tech","Вахта: "+SKY_KINDS[o.kind].ru+" · "+skyWhere(o)+" · сутки "+o.day);
  return true;
}
function skyDrop(){
  const S=skyAll();S.o=null;S.cool=celDay()+3;SKY_OFF_KEY="";
  const T=(typeof thingsAll==="function")?thingsAll():null;
  if(T)for(let i=T.length-1;i>=0;i--)if(T[i]&&T[i].sky)T.splice(i,1);
}
/* ── вахта ──
   Кадровая часть проверяет только «идёт ли событие», и только пока наряд есть:
   три функции 06a — это десяток умножений, звать их каждый кадр дешевле, чем
   заводить расписание. Суточная часть — бюллетень и просрочка. */
function skyTick(){
  const S=skyAll(),o=S.o;if(!o)return;
  const d=celDay();
  if(!o.got){
    const k=skyOn(o,G.t);
    if(k>0){
      o.got=1;o.gd=d;o.k=Math.round(k*100)/100;   /* флаг, а не день: сутки 0 существуют */
      thingAdd("strip","Лента наблюдения · "+SKY_KINDS[o.kind].ru,
        skyWhere(o)+" · сутки "+d+" · записано с борта · сдать до бюллетеня института",{sky:1});
      tell("good","Небо записано: "+SKY_KINDS[o.kind].ru+" · "+skyWhere(o),
        "ЗАПИСАНО\n"+SKY_KINDS[o.kind].ru.toUpperCase()+"\n"+skyWhere(o).toUpperCase()+"\nСУТКИ "+d);
      logAdd("good","Вахта отстояна: "+SKY_KINDS[o.kind].ru+" · "+skyWhere(o));
    }
  }
  if(S.lastDay===d)return;S.lastDay=d;
  if(!o.bull&&d>o.day+SKY_BULL){
    o.bull=1;
    logAdd("ether","Бюллетень института: "+SKY_KINDS[o.kind].ru+", "+skyWhere(o)+
      ", сутки "+o.day+". Наблюдение расчётное — наблюдателя не было.");
  }
  if(d>o.day+SKY_LAPSE){
    if(o.got)logAdd("warn","Лента наблюдения так и не сдана. Наряд закрыт.");
    else logAdd("dim","Наряд на наблюдение просрочен: "+skyWhere(o)+", сутки "+o.day+".");
    skyDrop();
  }
}
/* ── имя кометы ──
   Из трудовой книжки, и только из неё. Институции оттуда вычеркнуты: комета
   имени медкомиссии — шутка на один раз, а имя остаётся в системе навсегда. */
function skyNameComet(o){
  const S=skyAll(),key=o.sx+","+o.sy;
  if(S.named[key])return S.named[key];
  const bad=/^(институт|медкомиссия|санаторий|станция)/i, auth=[];
  if(typeof recordAll==="function")for(const e of recordAll().e)
    if(!bad.test(e.a)&&auth.indexOf(e.a)<0)auth.push(e.a);
  const r=rng(hashi(o.sx,o.sy,0x0C0E));
  /* книжка пуста — так бывает в первые часы. Тогда комету называют по стойке,
     на которую лёг отчёт: настоящие кометы тоже носят имена обсерваторий */
  const nm=auth.length?auth[Math.floor(r()*auth.length)]:((G.st&&G.st.name)||o.sysName);
  S.named[key]=nm;
  return nm;
}
/* имя кометы этой системы — для строки неба в кабине (06a-celest) */
function skyCometName(sys){
  const N=(G.duty&&G.duty.named)||null;
  return (N&&sys)?(N[sys.sx+","+sys.sy]||""):"";
}
function skyCanReport(){
  const o=skyAll().o;
  return !!(o&&o.got&&G.st&&G.st.stype==="sci");
}
function skyReport(){
  const S=skyAll(),o=S.o;
  if(!skyCanReport())return false;
  const K=SKY_KINDS[o.kind], first=!o.bull;
  const pay=Math.round(K.pay*(first?1:.5)*((typeof holdSkyMul==="function")?holdSkyMul():1)), dat=first?K.data:1;   /* Обсерватория (I1) */
  earn(pay,"наблюдение");G.data=(G.data|0)+dat;
  if(first){
    S.n=(S.n|0)+1;
    const nm=o.kind==="comet"?skyNameComet(o):"";
    peopleLine("успели. Бюллетеня ещё нет — значит, наблюдение ваше."+(nm?" Комете дадут имя из книжки.":""),"стойка института",true);
    recordAdd("институт","наблюдение принято первым · "+K.ru+" · "+skyWhere(o)+
      " · сутки "+o.day+(nm?" · комета «"+nm+"»":""));
    tell("good","Наблюдение принято первым: "+K.ru+" · +"+pay+" кр, данных +"+dat,
      "ПРИНЯТО ПЕРВЫМ\n"+K.ru.toUpperCase()+"\n"+skyWhere(o).toUpperCase()+
      (nm?"\nКОМЕТА «"+nm.toUpperCase()+"»":"")+"\n+"+pay+" КР · ДАННЫХ +"+dat);
    logAdd("good","Вахта закрыта первым: "+K.ru+" · "+skyWhere(o)+" · +"+pay+" кр");
  }else{
    S.late=(S.late|0)+1;
    peopleLine("бюллетень вышел позавчера. Ленту подошьём — сверка тоже работа.","стойка института",true);
    recordAdd("институт","наблюдение сдано после бюллетеня · "+K.ru+" · "+skyWhere(o));
    logAdd("dim","Вахта закрыта после бюллетеня: "+K.ru+" · +"+pay+" кр");
  }
  skyDrop();
  return true;
}
/* ── стойка ──
   Одна строка на наряд. Пока наряда нет — предложение, пока есть — срок и
   состояние; кнопка отчёта гаснет, пока ленты нет, и не объясняет себя дважды. */
function skyBlock(){
  if(!(G.st&&G.st.stype==="sci"))return;
  const S=skyAll(),o=S.o,O=o?null:skyOfferHere();
  if(!o&&!O)return;
  $body.appendChild(el("div","sec","НЕБЕСНАЯ ВАХТА · ОТЧЁТ ДО БЮЛЛЕТЕНЯ"));
  if(O){
    const K=SKY_KINDS[O.kind], left=O.day-celDay();
    const r=el("div","row","<div class='nm'><b>"+K.ru+" · "+skyWhere(O)+"</b><s>сутки "+O.day+
      " · через "+left+" сут · "+K.need+"</s></div>");
    const b=el("button","act sm","ВЗЯТЬ НАРЯД");
    b.onclick=()=>{skyTake(O);renderTab();};
    r.appendChild(b);$body.appendChild(r);
  }
  if(o){
    const K=SKY_KINDS[o.kind], left=o.day-celDay();
    const st=o.got
      ?(o.bull?"лента есть · бюллетень уже вышел, половина платы":"лента есть · сдать сейчас")
      :(left>0?("ещё "+left+" сут · "+K.need)
        :(left===0?("сегодня · "+K.need):"событие идёт к концу · "+K.need));
    const r=el("div","row","<div class='nm'><b>"+K.ru+" · "+skyWhere(o)+"</b><s>сутки "+o.day+" · "+st+"</s></div>");
    const b=el("button","act sm gold","СДАТЬ ОТЧЁТ");
    b.disabled=!o.got;
    b.onclick=()=>{skyReport();renderTab();};
    r.appendChild(b);$body.appendChild(r);
  }
}
