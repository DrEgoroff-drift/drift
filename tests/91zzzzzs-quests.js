/* ══════════════ у обещания есть тот, кто его закроет (M357) ══════════════
   Журнал дел (`11a-quests`) держится на четырёх правилах, записанных в его же
   заголовке. Третье — «дело закрывается кодом, который его выполняет, а не
   таймером». Отсюда следует то, чего никто не проверял: у каждого вида дела
   обязан БЫТЬ такой код. Дело, которое заводится и не закрывается ничем, —
   это строка в журнале навсегда, с вечным «срок вышел» и без всякого способа
   её убрать; игрок читает это как поломку, и он прав.

   Проверяется чтением собственного исходника (тот же приём, что у набора про
   имена): все ключи, которые заводят дело, против всех ключей, которые его
   закрывают. Плюс два дынамических закона — дело не двоится и журнал не пухнет,
   и у каждого активного дела есть адрес или честно написанное его отсутствие. */

/* ключи дел пишутся как "job:"+m.id: берём литеральную голову до первого «+» */
function qsKeys(src,fn){
  const out=new Set();
  const re=new RegExp(fn+'\\(\\s*"([^"\\n]{1,40})"',"g");
  let m;
  while((m=re.exec(src)))out.add(m[1].split("+")[0]);
  /* и вида questDone("job:"+id) — голова та же, кавычка закрывается на «:» */
  return [...out];
}

TEST_SUITES.push(() => suite("дела: у каждого вида дела есть тот, кто его закрывает", () => {
  const src=(typeof nmSource==="function")?nmSource():"";
  ok(src.length>100000,"исходник игры доступен набору");
  if(!src)return;
  const adds=qsKeys(src,"questAdd");
  const closes=[].concat(qsKeys(src,"questDone"),qsKeys(src,"questFail"),qsKeys(src,"questClose"));
  ok(adds.length>=3,"видов дел в игре: "+adds.length+" ("+adds.join(", ")+")");
  ok(closes.length>=3,"видов закрытия: "+closes.length);
  const bad=[];
  for(const k of adds){
    /* закрывать могут по тому же префиксу или по более общему («job:» ⊃ «job:5:») */
    let covered=closes.some(c=>c===k||k.indexOf(c)===0||c.indexOf(k)===0);
    /* ключ часто кладут в переменную: `const key="escort:"+b.seed` и дальше
       `questDone(key)`. Литерала в вызове нет, но закрыватель есть — смотрим
       окрестность каждого упоминания ключа. Без этого проверка объявляла бы
       честный код виновным (поймано на «escort:»). */
    if(!covered){
      let at=-1;
      while((at=src.indexOf('"'+k,at+1))>=0){
        const near=src.slice(Math.max(0,at-1500),at+1500);
        if(/quest(Done|Fail|Close)\s*\(/.test(near)){covered=true;break;}
      }
    }
    if(!covered)bad.push("«"+k+"» заводится, а закрывается ничем");
  }
  /* мировые дела снимает questSync — он тоже считается закрывателем */
  const tight=(typeof whyTight==="function")?whyTight(src):src.split(/\s+/).join("");
  const hasSync=tight.indexOf("functionquestSync")>=0;
  ok(hasSync,"мировые дела снимает questSync");
  eq(bad.slice(0,4).join(" ;; "),"","каждое дело кто-то закрывает");
}));

TEST_SUITES.push(() => suite("дела: не двоятся, не переполняют журнал и не теряют адрес", () => {
  resetWorld();
  if(typeof questAdd!=="function"){ok(true,"журнала дел в этой сборке нет — пропуск");return;}
  /* одно и то же поручение дважды — одна строка (правило 1) */
  const a=questAdd("тест:один",{ru:"Привезти лёд",sx:1,sy:2,reward:"200 кр"});
  const b=questAdd("тест:один",{ru:"Привезти лёд",sx:1,sy:2,reward:"200 кр"});
  eq(questAll().filter(q=>q.key==="тест:один").length,1,"повторная запись не завела второе дело");
  ok(a===b,"и вернулось то же самое дело");
  /* закрытие: дело уходит из открытых и остаётся в списке со своим исходом.
     Делаем это ДО потопа: сорок первое дело вытесняет первое, и закрывать было
     бы уже нечего — на этом первая версия набора сама себя и поймала. */
  const n0=questOpen().length;
  questDone("тест:один","привёз");
  ok(questOpen().length===n0-1,"закрытое дело ушло из открытых");
  const closed=questAll().find(q=>q.key==="тест:один");
  ok(closed&&closed.state==="done","и осталось в журнале с исходом: "+(closed&&closed.state));
  /* закрыть то, чего нет, — не падение и не выдумка */
  let threw="";
  try{ questDone("тест:нет-такого"); }catch(e){ threw=e.message; }
  eq(threw,"","закрытие несуществующего дела не бросает");
  /* журнал не пухнет: QUEST_MAX и ни строкой больше */
  for(let i=0;i<QUEST_MAX+20;i++)questAdd("тест:вал"+i,{ru:"Дело "+i,sx:0,sy:0});
  ok(questAll().length<=QUEST_MAX,"журнал держит потолок: "+questAll().length+" из "+QUEST_MAX);
  /* у каждого активного дела есть адрес или честно написано, что его нет */
  const bad=[];
  for(const q of questOpen()){
    const hasAddr=(typeof q.sx==="number"&&typeof q.sy==="number");
    const saysNo=/без адреса|неизвестн|куда — /i.test(String(q.note||"")+" "+String(q.place||""));
    if(!hasAddr&&!saysNo)bad.push("«"+String(q.ru).slice(0,24)+"»: ни адреса, ни слова о том, что его нет");
    if(bad.length>3)break;
  }
  eq(bad.slice(0,3).join(" ;; "),"","у дела есть адрес или честное «адреса нет»");
  resetWorld();
}));

TEST_SUITES.push(() => suite("дела: срок, который вышел, назван словами, а не числом со знаком", () => {
  /* «срок вышел» — это ответ. «-7 мин» — это протечка формулы в текст. */
  resetWorld();
  if(typeof questLeft!=="function"){ok(true,"сроков в этой сборке нет — пропуск");return;}
  const now=Date.now();
  eq(questLeft({until:0}),"","без срока строка пустая");
  eq(questLeft({until:now-60000}),"срок вышел","истёкший срок назван словами");
  eq(questLeft({until:now+30000}),"меньше минуты","полминуты — «меньше минуты»");
  const soon=questLeft({until:now+5*60000});
  ok(/^\d+ мин$/.test(soon),"пять минут — «N мин»: «"+soon+"»");
  ok(questLeft({until:now-1e9}).indexOf("-")<0,"и в истёкшем сроке нет минуса");
  resetWorld();
}));
