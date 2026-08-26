/* ══════════════ автотесты: QSL-карточки (M203) ══════════════ */
TEST_SUITES.push(()=>suite("карточки: на том конце только люди игры, ни одного живого",()=>{
  resetWorld();
  ok(QSL_OPS.length>=18,"корреспондентов не меньше восемнадцати ("+QSL_OPS.length+")");
  const ids={},calls={};
  for(const o of QSL_OPS){
    ok(!ids[o.id],"id не повторяется: "+o.id);ids[o.id]=1;
    ok(!calls[o.call],"позывной не повторяется: "+o.call);calls[o.call]=1;
    ok(o.ru&&o.ru.length>4,"место названо: "+o.call);
    ok(o.line&&o.line.length>16,"и есть своя строка: "+o.call);
    /* никаких обращений к игроку по имени и никаких просьб */
    ok(!/принеси|нужн|заплат|награ/i.test(o.line),"ничего не просят: "+o.call);
  }
  /* среди них должны быть и зимовки, и экспедиция, и посёлки */
  ok(QSL_OPS.some(o=>/зимовка/.test(o.ru)),"зимовки есть");
  ok(QSL_OPS.some(o=>/экспедиц/.test(o.ru)),"экспедиция есть");
  ok(QSL_OPS.some(o=>/посёлок/.test(o.ru)),"посёлки есть");
}));
TEST_SUITES.push(()=>suite("карточки: услышал — записал, послал — ждёшь неделями",()=>{
  resetWorld();
  G.qsl=null;G.things=[];G.log=[];G.record=null;
  eq(Object.keys(qslAll().heard).length,0,"позывных не записано");
  const o=QSL_OPS[0];
  ok(!qslSend(o.id),"неуслышанному карточку не пошлёшь");
  const line=qslHear(o.id);
  ok(line.indexOf(o.call)===0,"услышали: "+line.slice(0,40));
  ok(qslHeard(o.id),"позывной записан сам, без кнопки");
  ok(qslSend(o.id),"карточка послана");
  ok(!qslSend(o.id),"дважды одному — нет");
  ok(qslSent(o.id),"она в пути");
  ok(!qslGot(o.id),"ответа ещё нет");
  eq(qslTick(),0,"и сегодня не будет");
  /* срок в неделях, а не в минутах */
  const s=qslAll().sent[o.id];
  ok(s.due-s.t>=QSL_WAIT,"ответ идёт неделями ("+Math.round((s.due-s.t)/86400000)+" сут)");
  /* переводим часы вперёд */
  s.due=Date.now()-1000;
  eq(qslTick(),1,"пришла");
  ok(qslGot(o.id),"и легла на стену");
  ok(G.things.some(t=>t.qsl===o.id),"и в вещи");
  eq(qslTick(),0,"дважды не приходит");
  eq(qslWall().length,1,"на стене одна");
}));
TEST_SUITES.push(()=>suite("карточки: стена собирается целиком и переживает сохранение",()=>{
  resetWorld();
  G.qsl=null;G.things=[];G.record=null;
  for(const o of QSL_OPS){qslHear(o.id);qslSend(o.id);qslAll().sent[o.id].due=Date.now()-1;}
  const n=qslTick();
  eq(n,QSL_OPS.length,"ответили все");
  eq(qslWall().length,QSL_OPS.length,"стена полна");
  ok(recordAll().e.some(x=>/вся стена/.test(x.s)),"и в книжке одна строка");
  /* сохранение */
  const snap=snapshot();G.qsl=null;applySave(JSON.parse(JSON.stringify(snap)));
  eq(qslWall().length,QSL_OPS.length,"стена пережила сохранение");
  /* чужой позывной в сейве не заводит корреспондента */
  const bad=snapshot();bad.qsl.got["нетакого"]=1;bad.qsl.heard["нетакого"]=1;
  applySave(JSON.parse(JSON.stringify(bad)));
  eq(qslWall().length,QSL_OPS.length,"чужой id отброшен");
  ok(!qslHeard("нетакого"),"и не записан");
  const old=snapshot();delete old.qsl;
  applySave(JSON.parse(JSON.stringify(old)));
  eq(qslWall().length,0,"сохранение без карточек — пустая стена, а не падение");
}));
