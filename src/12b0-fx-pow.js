/* ══════════════ семья механик: ВЛАСТЬ (M385, §15.1) ══════════════
   Держава — не пейзаж: у неё меняются правители, её чистят, от неё откалываются
   и её позорят. Часть этой семьи живёт внутри повтора (чистка отнимает силу,
   наследник обнуляет отношения — 12am-chron-director), потому что она меняет
   само состояние. Здесь то, что видно игроку: перевёрнутый курс, вдвое больше
   дезертиров, молчащая волна и отколовшийся кластер с собственным флагом.

   Ни одно из этих последствий не отнимает у игрока ничего: они меняют то, ЧЬЁ
   вокруг небо и что о нём говорят. */
const POW_COUP=24;         /* шесть суток, пока переворот виден */
const POW_PURGE=24;        /* столько же живёт волна дезертирства */
const POW_SCANDAL=12;      /* трое суток молчащей волны */
const POW_SECEDE=120;      /* месяц откола */
/* ── о состоянии спрашиваем БЕЗ пересчёта ──
   Эти функции зовут и из повтора (курс державы читает `chronAgentMove`), а
   `chronState()` внутри повтора запускает повтор заново — и это бесконечная
   рекурсия, которая в 0.385.0 повесила прогон набора. Поэтому состояние всегда
   передаётся сверху, а chronState зовётся только снаружи. */
function powInc(kind,span,st,N){
  return (typeof chronIncOf==="function")?chronIncOf(kind,span,st,N):null;
}
/* ── переворот ──
   «Правитель меняется вне выборов; курс переворачивается за сводку.» Курс
   выбирала толпа (M378) — переворот его отменяет, и это единственный способ
   отменить её выбор. Взамен толпа получает вопрос заново в следующем месяце. */
function powCoupOn(i,st,N){
  const inc=powInc("coup",POW_COUP,st,N);
  return !!(inc&&inc.p===i);
}
function powCourse(i,N,st){
  const base=(typeof voteCourse==="function")?voteCourse(i,N):null;
  if(!base)return null;
  if(!powCoupOn(i,st,N))return base;
  const Q=(typeof voteQuestion==="function")?voteQuestion(MAKER_KEYS[i],N):null;
  if(!Q)return base;
  for(const [pick] of Q.picks)if(pick!==base)return pick;   /* ровно наоборот */
  return base;
}
/* ── чистка ──
   Часть флота исчезает: сила уже отнята в повторе, а здесь — дезертиры. Их
   вдвое больше, и они те самые, у кого номер закрашен свежо (M369a). */
function powPurgeOn(i){
  const inc=powInc("purge",POW_PURGE);
  return !!(inc&&inc.p===i);
}
function powDeserterMul(sx,sy){
  const inc=powInc("purge",POW_PURGE);
  if(!inc||typeof chronOwner!=="function")return 1;
  return chronOwner(sx===undefined?G.sx:sx,sy===undefined?G.sy:sy)===inc.p?2:1;
}
/* ── позор ──
   «Диктор исчезает из эфира.» Волна молчит: не «говорит другое», а молчит, и
   это слышно лучше любых слов. */
function powScandalOn(by){
  const inc=powInc("spy",POW_SCANDAL);
  return !!(inc&&MAKER_KEYS[inc.p]===by);
}
function powWaveSilent(by){return powScandalOn(by||((typeof chronWave==="function")?chronWave():"gt"));}
/* ── откол ──
   Кластер объявляет себя седьмой силой на месяц: у него свой флаг на карте и
   своя строка в эфире. Механики седьмой державы нет и не будет — «шесть, и
   седьмого не будет» (§20 settled); откол — это событие о том, что бывает,
   когда шестая перестаёт держать своё. */
function powSecedeOn(sx,sy){
  const inc=powInc("secede",POW_SECEDE);
  if(!inc||typeof chronOwner!=="function")return false;
  return chronOwner(sx===undefined?G.sx:sx,sy===undefined?G.sy:sy)===inc.p;
}
function powLine(){
  const out=[];
  const own=(typeof chronOwner==="function")?chronOwner(G.sx,G.sy):-1;
  if(own>=0&&powCoupOn(own))out.push("ПЕРЕВОРОТ · КУРС ПЕРЕВЁРНУТ");
  if(own>=0&&powPurgeOn(own))out.push("ЧИСТКА · ДЕЗЕРТИРОВ ВДВОЕ");
  if(powSecedeOn())out.push("ОТКОЛ · ЗДЕСЬ ПОДНЯЛИ СВОЙ ФЛАГ");
  if(own>=0&&powScandalOn(MAKER_KEYS[own]))out.push("ВОЛНА МОЛЧИТ");
  return out.join(" · ");
}
