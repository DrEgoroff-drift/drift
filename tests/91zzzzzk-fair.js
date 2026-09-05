/* ══════════════ честность сделки (M355) ══════════════
   Третий заход по той же линии: не «работает ли», а «правда ли то, что игре
   про себя говорит интерфейс».

   1. Покупаешь то, на что ткнул. Строка верфи показывает корабль и цену;
      после нажатия в рейсе обязан оказаться ИМЕННО он. Ошибка здесь не
      падает и не видна в тестах вовсе — а игрок платит десять тысяч и
      получает не то.
   2. Дороже — значит не хуже во всём. Корпуса — не лестница, это разные
      специальности, и это правильно. Но корпус, который дороже другого и при
      этом хуже по КАЖДОМУ числу, — это не выбор, это ловушка для новичка,
      который читает цену как качество.
   3. Списание без объяснения — воровство. Игра сама берёт деньги: хранение в
      конторе, жалованье, износ. Каждое такое списание обязано оставить строку
      в журнале — правило «доля всегда показана строкой» (CLAUDE.md), только
      применённое ко всем тихим тратам сразу. */

TEST_SUITES.push(() => suite("верфь: в рейс уходит тот корпус, на который ткнули", () => {
  resetWorld();
  if(typeof e2eLate==="function")e2eLate();else fuzzRich();
  G.credits=3000000;
  const bad=[];let bought=0;
  if(!G.sys.station){ok(false,"станции нет — пропуск");return;}
  G.st=G.sys.station;G.mode="dock";
  const open=()=>{try{openStation();}catch(e){}try{tab="yard";renderTab();}catch(e){}};
  open();
  /* строки верфи перечитываем перед каждой покупкой: после первой список
     меняется («В РЕЙСЕ», «ПЕРЕСЕСТЬ»), и старые узлы — уже не то, что видно */
  for(let pass=0;pass<6;pass++){
    open();
    const rows=[...document.querySelectorAll("#stBody .row")];
    let done=false;
    for(const r of rows){
      const b=r.querySelector("button");
      if(!b||b.disabled)continue;
      const nm=String(r.textContent||"").match(/«([^»]+)»/);
      if(!nm)continue;
      const wantRu=nm[1];
      /* имя берём общим доступом: у верфи бывают не только табличные корпуса,
         но и уникальные/флотские, которых в SHIPS нет вовсе */
      if((shipData(G.shipId)||{}).ru===wantRu)continue;       /* уже в рейсе — там кнопки нет */
      const was=G.shipId;
      try{ b.click(); }catch(e){ bad.push(wantRu+" · кнопка бросила: "+e.message); done=true; break; }
      bought++;
      const got=(shipData(G.shipId)||{}).ru||G.shipId;
      if(got!==wantRu)bad.push("ткнули в «"+wantRu+"», а в рейсе «"+got+"» (было «"+((shipData(was)||{}).ru||was)+"»)");
      if(!G.owned[G.shipId])bad.push("«"+got+"» в рейсе, но не в собственности");
      done=true;break;
    }
    if(!done)break;
  }
  if(typeof closeStation==="function")try{closeStation();}catch(e){}
  tab="market";G.mode="system";G.st=null;
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  ok(bought>=3,"корпусов куплено: "+bought);
  eq(bad.slice(0,4).join(" ;; "),"","верфь отдаёт то, что показала");
  resetWorld();
}));

TEST_SUITES.push(() => suite("верфь: нет корпуса, который дороже другого и хуже во всём", () => {
  /* Специализация — это когда одно лучше, другое хуже. Ловушка — это когда
     дороже и хуже ПО ВСЕМ числам сразу: такой корпус никому не нужен, а
     новичок читает цену как качество и покупает именно его. */
  const NUM=["thr","turn","fuel","cargo","hull"];
  const ids=Object.keys(SHIPS).filter(id=>(SHIPS[id].price|0)>0);
  ok(ids.length>=5,"корпусов с ценой: "+ids.length);
  const bad=[];
  for(const a of ids)for(const b of ids){
    if(a===b)continue;
    const A=SHIPS[a],B=SHIPS[b];
    if(!(A.price>B.price))continue;
    /* A дороже B: хотя бы одно число обязано быть не хуже */
    const better=NUM.some(k=>A[k]>=B[k]);
    if(!better)bad.push("«"+A.ru+"» ("+A.price+" кр) хуже «"+B.ru+"» ("+B.price+" кр) по всем числам");
  }
  eq(bad.slice(0,3).join(" ;; "),"","цена не обещает того, чего корпус не даёт");
  /* и цена модуля растёт с уровнем: иначе «улучшение» дешевеет по дороге */
  const mbad=[];
  for(const k in MODS)for(let l=0;l<4;l++)
    if(!(modCost(k,l+1)>modCost(k,l)))mbad.push(MODS[k].ru+": уровень "+(l+1)+" не дороже "+l);
  eq(mbad.slice(0,3).join(" ;; "),"","каждый следующий уровень модуля дороже предыдущего");
}));

TEST_SUITES.push(() => suite("касса: игра не берёт денег молча", () => {
  /* Игра сама лезет в кошелёк: хранение в конторе, жалованье, износ, доли.
     Любое такое списание обязано оставить строку в журнале — иначе игрок
     видит только то, что денег стало меньше, и это читается воровством.
     Гоняем ленивые такты с прыжком часов на несколько суток вперёд: именно
     так и списывают — пачкой, за пропущенное время. */
  resetWorld();
  if(typeof e2eLate==="function")e2eLate();else fuzzRich();
  if(typeof lockerRec==="function"){
    const L=lockerRec();L.res=L.res||{};L.res[RES_KEYS[0]]=60;
    L.t=Date.now()-6*24*3600*1000;    /* шесть суток хранения набежало */
  }
  const TICKS=(typeof CLK_TICKS!=="undefined")?CLK_TICKS:["tickDrones","crewTick","lockerTick","mgrTick"];
  const bad=[];let steps=0,charges=0;
  const real=Date.now;
  let skew=0;
  Date.now=function(){ return real.call(Date)+skew; };
  try{
    for(const name of TICKS){
      const f=window[name];
      if(typeof f!=="function")continue;
      skew=0;try{ f(); }catch(e){ }            /* отметки на «сейчас» */
      skew=4*24*3600*1000;                     /* четверо суток вперёд */
      /* курсор журнала — не длина, а последняя запись: журнал подрезается
         сверху, и на прожитом мире длина после дописи ТА ЖЕ (первая версия
         набора из-за этого объявила честную строку конторы пропавшей) */
      const c0=G.credits,tail0=(G.log||[]).length?G.log[G.log.length-1]:null;
      try{ f(); }catch(e){ bad.push(name+" · такт упал: "+e.message); continue; }
      steps++;
      const spent=c0-G.credits;
      if(spent<=0)continue;
      charges++;
      const L=G.log||[];
      let from=L.length;
      while(from>0&&L[from-1]!==tail0)from--;
      const said=L.slice(from);
      /* «\b» после кириллицы в JS не срабатывает никогда: русские буквы для
         движка не словесные символы, и /кр\b/ не совпадает с «−17 кр» вовсе
         (та же ловушка, что описана в CLAUDE.md про /\bон\b/). Ищем число
         рядом со словом, а границу проверяем отрицательным просмотром. */
      const money=said.filter(r=>/\d[\s ]*кр(?![а-яё])|кредит/i.test(String(r.s||"")));
      if(!money.length)bad.push(name+" · списано "+spent+" кр и ни строки в журнале · новых строк "+said.length+
        " · хвост: "+(G.log||[]).slice(-3).map(r=>String(r.s||"").slice(0,40)).join(" | "));
    }
  }finally{ Date.now=real; }
  ok(steps>=8,"тактов прогнано: "+steps+", из них со списанием: "+charges);
  eq(bad.slice(0,4).join(" ;; "),"","каждое списание объяснено строкой");
  resetWorld();
}));

TEST_SUITES.push(() => suite("правило: граница слова после кириллицы не работает нигде", () => {
  /* В JavaScript граница слова (обратный слэш и «b») — это граница СЛОВЕСНЫХ
     символов, а словесными движок считает только латиницу, цифры и
     подчёркивание. В русском тексте она не срабатывает ВООБЩЕ: проверка
     молча возвращает false годами. Игру это уже кусало (CLAUDE.md, история
     про съеденные экранирования), и сегодня укусило набор про кассу: строка
     «−17 кр» не нашлась по границе после «кр».

     Читаем исходник игры насквозь: каждая такая граница рядом с кириллицей —
     либо мёртвая проверка, либо ловушка для следующего. Лечится отрицательным
     просмотром вида (?![а-яё]). Обратный слэш здесь ни разу не написан
     буквой — он строится из кода символа, иначе его съедает уже сам патч. */
  const src=(typeof nmSource==="function")?nmSource():"";
  ok(src.length>100000,"исходник игры доступен набору");
  if(!ok(src,"нашлось: src"))return;
  const BS=String.fromCharCode(92);
  const CYR=/[а-яёА-ЯЁ]/;
  const SPACES=new RegExp(BS+"s+","g");
  const bad=[];
  for(let i=1;i<src.length-2;i++){
    if(src[i]!==BS||src[i+1]!=="b")continue;
    if(src[i-1]===BS)continue;                 /* экранированный слэш, не граница */
    if(!CYR.test(src[i-1])&&!CYR.test(src[i+2]))continue;
    bad.push(src.slice(Math.max(0,i-30),i+30).replace(SPACES," ").trim());
    if(bad.length>=4)break;
  }
  eq(bad.slice(0,3).join(" ;; "),"","нигде в игре нет границы слова рядом с кириллицей");
}));
