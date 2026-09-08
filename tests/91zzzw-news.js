/* ══════════════ сводка-новость (M431) ══════════════
   Заметка — не украшение, а обещание: игрок читает в ней срок и число и летит
   по ним. Значит здесь мерится не «красиво ли», а три вещи, которые может
   проверить машина:

   · заметка есть у КАЖДОГО вида записи — иначе лента снова станет описью там,
     где про вид события забыли;
   · в ней нет ни одного невыполненного шаблона (`%p`, `%V(...)`), «undefined» и
     «NaN» — то, чем такие таблицы ломаются молча;
   · срок, названный словами, совпадает с константой семьи механик. Если завтра
     ярмарку укоротят до одной сводки, а в тексте останется «двое суток», это
     враньё игроку — и падать должно здесь, а не в отзыве.

   Плюс главное свойство летописи: заметка ВЫЧИСЛЯЕТСЯ. Одна и та же запись даёт
   одну и ту же заметку у всех, а разные — разные. */
function newsLine(N,kind,p,args,sys){return {N:N|0,kind,p:p|0,sys:sys||null,args:args||null};}
const NEWS_ALL_INC=["vein","fair","embargo","strike","holiday","refugee","storm","swarm","drain",
  "find","cult","revolt","envoy","patrol","census","coup","spy","secede","purge"];

TEST_SUITES.push(()=>suite("сводка M431: заметка есть у каждого события",()=>{
  resetWorld();
  const bad=[];
  const check=(L,what)=>{
    const s=newsOf(L);
    if(!s||s.length<40)bad.push(what+": пусто или обрывок");
    else if(/%[a-zA-Z]|undefined|NaN|\[object/.test(s))bad.push(what+": «"+s.slice(0,60)+"»");
  };
  NEWS_ALL_INC.forEach((k,i)=>check(newsLine(100+i,"inc",i%6,{k}),"происшествие "+k));
  RITE_KEYS.forEach((k,i)=>check(newsLine(200+i,"rite",i%6,{k}),"обряд "+k));
  DIR_ARCS.forEach((k,i)=>{
    for(let st=0;st<5;st++)check(newsLine(300+i*8+st,"arc",i%6,{k,stage:st}),"дуга "+k+" ст."+st);
    check(newsLine(360+i,"arcend",i%6,{k}),"конец дуги "+k);
  });
  check(newsLine(400,"war",1,{b:3}),"война");
  check(newsLine(401,"truce",1,{b:3}),"перемирие");
  check(newsLine(402,"ult",2,{b:4}),"нота");
  check(newsLine(403,"note",2,{b:4}),"нота снята");
  check(newsLine(404,"deal",0,{b:5}),"поставки");
  check(newsLine(405,"take",3,{from:1},"2,3"),"передел");
  ok(!bad.length,"каждая запись рассказана: "+(bad.length?bad.slice(0,3).join(" | "):"все виды"));
}));

TEST_SUITES.push(()=>suite("сводка M431: срок в тексте — тот же, что в механике",()=>{
  resetWorld();
  /* пары «сколько сводок держится» → «как это названо словами». Слева —
     константа семьи, справа — то, что читает игрок. */
  const pairs=[[ECON_VEIN,"трое суток","vein"],[ECON_FAIR,"двое суток","fair"],
    [ECON_EMB,"четверо суток","embargo"],[SOC_STRIKE,"сутки","strike"],
    [SOC_HOLIDAY,"сутки","holiday"],[SOC_REFUGEE,"четверо суток","refugee"],
    [NAT_STORM,"трое суток","storm"],[NAT_SWARM,"двое суток","swarm"],
    [NAT_DRAIN,"десять суток","drain"],[NAT_FIND,"пять суток","find"],
    [SOC_CULT,"неделю","cult"],[DIP_ENVOY,"трое суток","envoy"]];
  const bad=[];
  for(const [span,word,k] of pairs){
    if(newsSpan(span)!==word)bad.push(k+": "+span+" сводок это «"+newsSpan(span)+"», а в тексте «"+word+"»");
    /* и то же слово обязано появиться в самой заметке — иначе срок назван мимо */
    let seen=false;
    /* срок бывает в начале фразы и тогда пишется с большой буквы — сверяем в
       нижнем регистре, иначе тест ловит не срок, а типографику */
    for(let n=0;n<12&&!seen;n++)if(newsOf(newsLine(500+n,"inc",n%6,{k})).toLowerCase().indexOf(newsSpan(span))>=0)seen=true;
    if(!seen)bad.push(k+": срок «"+newsSpan(span)+"» в заметке не назван");
  }
  ok(!bad.length,"сроки сходятся с семьями механик"+(bad.length?": "+bad.slice(0,3).join(" | "):""));
  /* обряд называет свою цену делом, а не словами */
  const r=newsOf(newsLine(600,"rite",2,{k:"regatta"}));
  ok(r.indexOf(String(RITES.regatta.goal))>=0&&r.indexOf(RITES.regatta.ru2)>=0,
    "обряд называет, сколько и чего сделать");
}));

TEST_SUITES.push(()=>suite("сводка M431: одна запись — одна заметка у всех",()=>{
  resetWorld();
  const L=newsLine(777,"inc",2,{k:"fair"});
  eq(newsOf(L),newsOf(newsLine(777,"inc",2,{k:"fair"})),"та же запись — тот же текст");
  ok(newsOf(L)!==newsOf(newsLine(778,"inc",2,{k:"fair"})),"соседняя сводка — другой текст");
  ok(newsOf(L)!==newsOf(newsLine(777,"inc",3,{k:"fair"})),"другая держава — другой текст");
  /* стадии дуги не пересказывают друг друга: «в разгаре» не должно рассказывать
     про отправку, а развязка — про то, что всё ещё идёт */
  const mid=newsOf(newsLine(800,"arc",1,{k:"expedition",stage:2}));
  const end=newsOf(newsLine(800,"arc",1,{k:"expedition",stage:4}));
  ok(mid!==end,"середина дуги и развязка рассказывают разное");
  /* и голос: у каждой державы своя приписка, чужую она не произносит */
  const say=newsOf(newsLine(900,"inc",0,{k:"census"}));
  ok(/«[^»]+»\s*$/.test(say),"заметка кончается репликой державы");
}));
