/* ══════════════ детерминизм: тест Factorio (M441, DESIGN-tests §3.5) ══════════════
   Два прогона одной сцены на одном семени и одних часах обязаны давать один и
   тот же хэш мира (stateHash, 08a) каждые сто шагов — по всем сценам прибора
   (lookScenes). Это фундамент: повтор падения по семени, золотые кадры, запись
   прогона и облачная запись стоят на нём, и без него любой из них — песок.

   Шаг — настоящий frameBody на прибитых часах: постоянный шаг, часы двигает
   кадр (28-loop), редкий такт дронов, пульт и прочее идут по игровым часам.
   Первый набор шагает без картинки (drawWorld и hud — заглушки): мир от них
   не зависит, а под Node они стоят девять десятых времени. Красное в нём
   значит, что где-то живёт состояние вне G, которое переживает resetWorld
   (так нашлись счётчик непрочитанного G.logNew и такт пульта, писавший в
   журнал на своей фазе), или случай/часы мимо rnd()/now().

   Второй набор — про картинку: рисованный кадр не имеет права сдвинуть поток
   случая МИРА. Судится положение rnd(), а не весь хэш: рисование и приборы
   честно заводят в G ленивое производное — комплект скафандра (stat()),
   модули станции, геологию и облака планеты, куски пещеры, камеру (fcam,
   hin.cam, view*), — и без рисования этого просто нет. Это не расхождение
   миров, а кэш, и судить его — дело детекторов M443. */
const SAME_FRAMES=200;
function sameRun(sc,draw,frames){
  resetWorld();                               /* семя и часы прибиты (90-harness) */
  let ok0=true;
  try{ok0=sc.set()!==false;}catch(e){return {err:"постановка упала: "+e.message};}
  if(!ok0)return null;
  const loop0=LOOP_OFF,dw=drawWorld,hu=hud,out=[];
  LOOP_OFF=false;
  if(!draw){drawWorld=function(){};hud=function(){};}
  let i=0;
  try{
    for(i=1;i<=frames;i++){
      frameBody(wallMs());
      if(i%100===0)out.push(stateHash());
    }
  }catch(e){return {err:"шаг "+i+" упал: "+e.message};}
  finally{LOOP_OFF=loop0;drawWorld=dw;hud=hu;}
  return {h:out,t:G.t,rnd:rndState()[1]};
}
TEST_SUITES.push(()=>suite("детерминизм: два прогона на одном семени и одних часах — один хэш мира каждые сто шагов",()=>{
  const scenes=lookScenes();
  let ran=0;
  for(const sc of scenes){
    const A=sameRun(sc,false,SAME_FRAMES);
    if(A===null){TEST.lines.push("  · "+sc.id+": сцена не ставится в этом мире");continue;}
    if(A.err){ok(false,sc.id+": "+A.err);continue;}
    ran++;
    /* мир и правда жил: шаги шли, иначе равенство хэшей ничего не значит */
    eq(A.h.length,SAME_FRAMES/100,sc.id+": хэш снят каждые сто шагов");
    ok(A.t>=SAME_FRAMES,sc.id+": время мира шло ("+(A.t|0)+")");
    const B=sameRun(sc,false,SAME_FRAMES);
    if(B&&B.err){ok(false,sc.id+" (второй): "+B.err);continue;}
    eq(B&&B.h.join(" "),A.h.join(" "),sc.id+": второй прогон — тот же мир");
  }
  ok(ran>=scenes.length-2,"сцен прогнано "+ran+" из "+scenes.length);
}));
TEST_SUITES.push(()=>suite("детерминизм: рисованный кадр не сдвигает случай мира",()=>{
  let ran=0;
  for(const sc of lookScenes()){
    const A=sameRun(sc,false,100);
    if(!A)continue;
    if(A.err){ok(false,sc.id+": "+A.err);continue;}
    const C=sameRun(sc,true,100);
    if(C&&C.err){ok(false,sc.id+" (с картинкой): "+C.err);continue;}
    ran++;
    eq(C&&C.rnd,A.rnd,sc.id+": с рисованием и без — одно положение rnd()");
  }
  ok(ran>0,"сцен с картинкой прогнано: "+ran);
}));
/* ── и под руками (M442 → M443) ──
   Первые два набора шагают мир без ввода: они не видят случай, который живёт
   в обработке клавиш — метки времени ввода (M441 перевёл их на игровые часы),
   защёлки по фронту, «призрачный клик». Здесь те же сеяные руки, что у
   T.hands и фуззера, дважды на одном семени: путь через ввод обязан
   повторяться так же, как путь без него — иначе запись прогона (M444) не
   воспроизведёт ничего. */
function sameRunHands(sc,frames,hs){
  resetWorld();
  let ok0=true;
  try{ok0=sc.set()!==false;}catch(e){return {err:"постановка упала: "+e.message};}
  if(!ok0)return null;
  const loop0=LOOP_OFF,dw=drawWorld,hu=hud,out=[];
  LOOP_OFF=false;drawWorld=function(){};hud=function(){};
  const r=rng(hashi(0xE2E,hs,17)),KS=["left","right","thrust","brake","act","fire"];
  let i=0;
  try{
    for(i=1;i<=frames;i++){
      if(i%4===1){for(const k of KS)keys[k]=r()<.3;actEdge=keys.act&&r()<.5;}else actEdge=false;
      frameBody(wallMs());
      if(i%100===0)out.push(stateHash());
    }
  }catch(e){return {err:"шаг "+i+" упал: "+e.message};}
  finally{LOOP_OFF=loop0;drawWorld=dw;hud=hu;for(const k in keys)keys[k]=false;actEdge=false;}
  return {h:out,t:G.t};
}
TEST_SUITES.push(()=>suite("детерминизм: те же сеяные руки на том же семени — тот же мир",()=>{
  let ran=0;
  for(const sc of lookScenes()){
    const A=sameRunHands(sc,SAME_FRAMES,11);
    if(A===null)continue;
    if(A.err){ok(false,sc.id+": "+A.err);continue;}
    ran++;
    const B=sameRunHands(sc,SAME_FRAMES,11);
    if(B&&B.err){ok(false,sc.id+" (второй): "+B.err);continue;}
    eq(B&&B.h.join(" "),A.h.join(" "),sc.id+": под руками второй прогон — тот же мир");
  }
  ok(ran>=10,"сцен под руками прогнано "+ran);
  resetWorld();
}));
TEST_SUITES.push(()=>suite("детерминизм: хэш мира видит перемену и не видит порядка полей",()=>{
  resetWorld();
  const h0=stateHash();
  eq(stateHash(),h0,"дважды подряд — одно число");
  G.credits+=1;
  ok(stateHash()!==h0,"кредит сдвинул хэш");
  G.credits-=1;
  eq(stateHash(),h0,"и вернул");
  rnd();
  ok(stateHash()!==h0,"бросок мира — уже другой мир");
  resetWorld();
  eq(stateHash(),h0,"resetWorld возвращает тот же мир до бита");
  rndFx();rndFx();
  eq(stateHash(),h0,"поток картинки в хэш не входит");
  eq(stateHash({a:1,b:[2,3]}),stateHash({b:[2,3],a:1}),"порядок полей не судится");
  const c={x:1};c.self=c;
  ok(typeof stateHash(c)==="string","цикл не вешает обход");
  clockAdvance(1000);
  ok(stateHash()!==h0,"часы игры — тоже часть мира");
  resetWorld();
}));
TEST_SUITES.push(()=>suite("детерминизм: часы игры прибиваются, двигаются и отпускаются",()=>{
  resetWorld();
  eq(now(),TEST_T0,"набор начинается в назначенную минуту");
  ok(clockPinned(),"часы прибиты");
  clockAdvance(1500);eq(now(),TEST_T0+1500,"сдвиг — ровно на сказанное");
  eq(new Date(now()).getHours(),TEST_HOUR,"час суток — из часов игры");
  clockSet(null);ok(!clockPinned(),"отпущены");
  ok(Math.abs(now()-wallNow())<5,"и снова настоящие");
  rndSeed(7);const a=[rnd(),rnd(),rnd()];rndSeed(7);const b=[rnd(),rnd(),rnd()];
  eq(a.join(),b.join(),"одно семя — один ряд бросков");
  rndSeed(7);rndFx();rndFx();eq(rnd(),a[0],"поток картинки мир не сдвигает");
  const u=uidRand();ok(u>=0&&u<1,"uidRand — число в [0,1)");
  resetWorld();
}));
