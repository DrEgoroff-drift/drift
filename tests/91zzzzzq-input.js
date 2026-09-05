/* ══════════════ руки отпускают (M357) ══════════════
   Про ввод в проекте нет ни одного набора, а он ровно тот слой, где ошибка
   выглядит как «игра сошла с ума, а не сломалась»: залипшая клавиша — это
   корабль, который жжёт топливо сам по себе, пока игрок читает почту в другом
   окне, и «ДЕЙСТВ», который срабатывает без пальца.

   Проверяются три обещания, которые игра уже даёт кодом (`15-input`), но
   которых до сих пор не держал никто:

   1. ушёл фокус — руки разжались (`blur`), и то же при уходе вкладки в фон
      (`visibilitychange`): keyup приходит окну в фокусе, и без этого зажатая
      клавиша остаётся зажатой навсегда;
   2. палец, ушедший с пэда (`pointercancel`/`pointerleave`), кнопку отпускает;
   3. фронт действия (`actEdge`) — это ФРОНТ: он живёт один кадр, а не тянется,
      пока клавишу держат. Иначе одно нажатие делает сотню действий. */

TEST_SUITES.push(() => suite("руки: ушёл фокус — клавиши разжались", () => {
  resetWorld();
  const KS=Object.keys(keys);
  ok(KS.length>=4,"клавиш в раскладке: "+KS.length);
  /* зажимаем всё и уходим из окна */
  for(const k of KS)keys[k]=true;
  actEdge=true;
  dispatchEvent(new Event("blur"));
  const stuck=KS.filter(k=>keys[k]);
  eq(stuck.join(","),"","после ухода фокуса не осталось ни одной зажатой клавиши");
  /* сам фронт действия снимает КАДР (28-loop считает его из keys.act и prevAct),
     а не разжатие рук: проверяем не поле, а то, что после возврата фокуса одно
     нажатие снова даёт ровно один фронт, а не тянется с прошлого раза */
  /* и то же, когда вкладку убрали в фон: keyup туда уже не придёт */
  for(const k of KS)keys[k]=true;
  const was=Object.getOwnPropertyDescriptor(Document.prototype,"hidden");
  try{
    Object.defineProperty(document,"hidden",{configurable:true,get:()=>true});
    document.dispatchEvent(new Event("visibilitychange"));
    const stuck2=KS.filter(k=>keys[k]);
    eq(stuck2.join(","),"","вкладка ушла в фон — клавиши тоже");
  }finally{
    delete document.hidden;
    if(was)Object.defineProperty(Document.prototype,"hidden",was);
  }
  /* и мир после этого не летит сам: тяга снята — скорость не растёт */
  G.mode="system";G.ship.vx=0;G.ship.vy=0;G.fuel=100;
  for(let i=0;i<60;i++){stepWorld(1);G.t++;}
  ok(Math.hypot(G.ship.vx,G.ship.vy)<.05,"корабль стоит, раз клавиши отпущены: "+Math.hypot(G.ship.vx,G.ship.vy).toFixed(3));
  resetWorld();
}));

TEST_SUITES.push(() => suite("руки: палец, ушедший с пэда, кнопку отпускает", () => {
  resetWorld();
  const pads=[...document.querySelectorAll(".pads [data-k]")];
  ok(pads.length>=3,"пэдов на экране: "+pads.length);
  const bad=[];
  for(const b of pads){
    const k=b.dataset.k;
    if(!(k in keys))continue;
    /* палец пришёл */
    b.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,pointerId:1}));
    if(!keys[k]){bad.push(k+": нажатие не дошло");continue;}
    /* и ушёл, не отпуская: система шлёт pointercancel или pointerleave */
    b.dispatchEvent(new PointerEvent("pointercancel",{bubbles:true,pointerId:1}));
    if(keys[k]){
      b.dispatchEvent(new PointerEvent("pointerleave",{bubbles:true,pointerId:1}));
      if(keys[k])bad.push(k+": палец ушёл, а кнопка осталась нажатой");
    }
  }
  for(const k in keys)keys[k]=false;
  eq(bad.slice(0,4).join(" ;; "),"","ни один пэд не залипает, когда палец ушёл");
  resetWorld();
}));

TEST_SUITES.push(() => suite("руки: фронт действия живёт один кадр, а не всё удержание", () => {
  /* `actEdge` — это «нажал», а не «держит». Считает его КАДР (`frameBody`,
     28-loop): `actEdge = keys.act && !prevAct`. Если бы фронт тянулся всё
     удержание, одно нажатие давало бы сотню действий — сто выстрелов, сто
     стыковок, сто покупок. Поэтому и гоняем настоящий кадр, а не `stepWorld`:
     закон живёт именно там. */
  resetWorld();
  G.mode="system";G.running=true;
  keys.act=false;prevAct=false;actEdge=false;
  /* Кадр сам разжимает руки, пока страница не в фокусе (второй рубеж против
     залипших клавиш, 28-loop). В headless фокуса нет никогда, поэтому на время
     опыта окно считается активным — иначе проверяется не фронт, а сторож. */
  const hadFocus=document.hasFocus;
  document.hasFocus=()=>true;
  /* и сам кадр на время опыта включаем: прогон идёт с LOOP_OFF=true, чтобы
     фоновые кадры не двигали мир под наборами (90-harness), а нам нужен именно
     настоящий кадр. Цепочку rAF это не будит: перепланирует её только `frame`,
     а он при LOOP_OFF выходит раньше и уже не вернётся. */
  /* Обе подмены — глобальные, и вернуть их надо ДАЖЕ ЕСЛИ отсюда вылетит
     исключение: набор, оставивший после себя `LOOP_OFF=false` и подменённый
     `hasFocus`, испортит все следующие — а такой сосед и есть худший вид
     провала (сам этим и лечил harness сегодня). Отсюда try/finally. */
  const loopWas=LOOP_OFF;LOOP_OFF=false;
  try{
    const t0=performance.now();
    let edges=0,frames=0;
    keys.act=true;                       /* палец лёг и не отпускает */
    for(let i=0;i<8;i++){
      try{ frameBody(t0+i*16); }catch(e){ ok(false,"кадр упал: "+e.message); break; }
      frames++;
      if(actEdge)edges++;
    }
    keys.act=false;
    try{ frameBody(t0+9*16); }catch(e){ }
    ok(frames>=6,"кадров прогнано: "+frames);
    eq(edges,1,"за всё удержание фронт был ровно один раз (получено "+edges+")");
    /* и отпустить-нажать снова — это новый фронт */
    keys.act=true;
    let again=0;
    for(let i=0;i<3;i++){ try{ frameBody(t0+(11+i)*16); }catch(e){ } if(actEdge)again++; }
    keys.act=false;
    eq(again,1,"новое нажатие дало новый фронт");
  }finally{
    LOOP_OFF=loopWas;
    document.hasFocus=hadFocus;
    for(const k in keys)keys[k]=false;
    prevAct=false;actEdge=false;
  }
  resetWorld();
}));
