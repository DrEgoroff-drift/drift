/* ══════════════ летопись (M370, §16.2–16.5) ══════════════
   Летопись — единственная часть игры, где ошибка не видна глазом: два клиента
   разойдутся молча, и увидит это только хэш. Поэтому набор меряет не «работает
   ли», а ТОЖДЕСТВЕННОСТЬ: повтор дважды — тот же хэш; ограничители держат две
   тысячи шагов; «Ялта» не меняет хозяина никогда; в исходнике нет ни одной
   трансцендентной функции, на которых браузеры и расходятся. */
function chWorld(){
  resetWorld();
  try{localStorage.removeItem(CHRON_KEY);}catch(e){}
  CHRON={N:-1,powers:null,systems:null,wars:null,lines:null,_keys:null,off:0};
  return G;
}
function chRun(n){
  const st=chronFresh();
  for(let i=0;i<=n;i++)chronStep(st,i);
  return st;
}

TEST_SUITES.push(()=>suite("летопись M370: повтор дважды даёт тот же хэш",()=>{
  chWorld();
  const a=chRun(400),b=chRun(400);
  eq(chronHash(a),chronHash(b),"два повтора — один хэш");
  eq(a.wars.length,b.wars.length,"и те же войны");
  /* повтор с середины равен повтору с нуля: на этом стоит кэш */
  const mid=chRun(200);
  const cont=chronReplay(400,mid);
  eq(chronHash(cont),chronHash(a),"повтор от кэша равен повтору от нуля");
  /* и он не зависит от того, спрашивали ли состояние раньше */
  eq(chronHash(chronReplay(400,null)),chronHash(a),"и от порядка вызовов тоже");
}));

TEST_SUITES.push(()=>suite("летопись M370: ограничители держат две тысячи шагов",()=>{
  chWorld();
  const st=chronFresh();
  const total=chronKeys().length;
  let maxHold=0,maxWars=0;
  let bad=0;
  for(let n=0;n<=2000;n++){
    chronStep(st,n);
    for(const P of st.powers){
      maxHold=Math.max(maxHold,P.hold);
      if(P.str<100||P.str>1000)bad++;
      for(const r of P.rel)if(r<-1000||r>1000)bad++;
      for(const k in P.need)if(P.need[k]<0||P.need[k]>1000)bad++;
    }
    maxWars=Math.max(maxWars,st.wars.length);
  }
  eq(bad,0,"ни одно число не вышло за границы за две тысячи шагов");
  ok(maxHold<total*.75,"никто не съел круг целиком: "+maxHold+" из "+total);
  ok(maxWars<=6,"войн одновременно не больше шести: "+maxWars);
  /* сумма владений сходится: система не может принадлежать двоим */
  let sum=0;for(const P of st.powers)sum+=P.hold;
  let cnt=0;for(const k of chronKeys())if(st.systems[k].owner>=0)cnt++;
  eq(sum,cnt,"счётчики владений сходятся с картой");
  /* и галактика не застыла: за две тысячи сводок что-то происходило */
  ok(st.lines.length>0,"строки в эфир были");
}));

TEST_SUITES.push(()=>suite("летопись M370: «Ялта» не меняет хозяина никогда",()=>{
  chWorld();
  const yk=chronYaltaKey();
  const st=chronFresh();
  eq(st.systems[yk].owner,-1,"с самого начала ничья");
  for(let n=0;n<=1500;n++){
    chronStep(st,n);
    if(n%97===0)eq(st.systems[yk].owner,-1,"и на сводке "+n+" тоже");
  }
  eq(st.systems[yk].owner,-1,"и через полторы тысячи сводок");
  eq(st.systems[yk].front,0,"фронт туда не приходит");
}));

TEST_SUITES.push(()=>suite("летопись M370: в исходнике нет дробной математики",()=>{
  /* правило §16.3 и D04: браузеры расходятся на exp/sin/cos/pow, а летопись
     обязана совпадать байт в байт. Проверяем чтением самого исходника. */
  const src=document.scripts[0].textContent;
  const head="/* ══════════════";
  const i0=src.indexOf("══ шесть агентов (M370");
  const i1=src.indexOf("══ летопись (M370");
  ok(i0>0&&i1>i0,"оба модуля летописи найдены в сборке");
  /* конец летописи — заголовок следующего модуля */
  const i2=src.indexOf(head,i1);
  const body=src.slice(i0,i2>i1?i2:i1+40000);
  ok(body.length>3000&&body.length<40000,"взят именно этот кусок: "+body.length);
  for(const bad of ["Math.exp","Math.sin","Math.cos","Math.pow","Math.tan","Math.log"])
    eq(body.indexOf(bad),-1,"в летописи нет "+bad);
  ok(body.indexOf("CHRON_SAT")>0,"насыщение берётся таблицей");
}));

TEST_SUITES.push(()=>suite("летопись M370: кэш это кэш, а не сохранение",()=>{
  chWorld();
  /* состояние не попадает в сейв ни одним полем (§16.4) */
  const snap=JSON.stringify(snapshot());
  eq(snap.indexOf("\"powers\""),-1,"держав в сохранении нет");
  eq(snap.indexOf("drift_war"),-1,"и ключа летописи тоже");
  /* кэш пишется в свой ключ и читается обратно тем же состоянием */
  const st=chRun(120);
  chronSave(st);
  const back=chronLoad();
  ok(!!back,"кэш прочитался");
  eq(chronHash(back),chronHash(st),"и он тот же самый");
  /* потеря кэша не ломает ничего: повтор от нуля даёт то же самое */
  try{localStorage.removeItem(CHRON_KEY);}catch(e){}
  eq(chronLoad(),null,"кэша нет");
  eq(chronHash(chronReplay(120,null)),chronHash(st),"а состояние то же");
}));

TEST_SUITES.push(()=>suite("летопись M370: карта знает хозяина и фронт",()=>{
  chWorld();
  chronState(300);
  let own=0,none=0;
  for(const k of chronKeys()){
    const p=k.split(","),o=chronOwner(p[0]|0,p[1]|0);
    if(o>=0){own++;ok(!!MAKER_KEYS[o],"хозяин — одна из шести держав");}
    else none++;
  }
  ok(own>chronKeys().length*.9,"почти весь круг занят: "+own);
  ok(none>=1,"и «Ялта» ничья");
  eq(chronOwner(999,999),-1,"за кругом хозяев нет");
  ok(typeof chronOwnerKey(0,0)==="string"||chronOwnerKey(0,0)===null,"ключ хозяина читается");
}));

/* ── тот же хэш в узле и в браузере (§16.3, D06) ──
   Два прогона одного и того же кода в разных движках обязаны сойтись до
   единицы. Числа ниже сняты в Хроме и проверяются в обоих ярусах: если
   когда-нибудь появится дробь, этот набор покраснеет первым — и не «где-то в
   галактике», а прямо здесь. Правило простое: изменил `step` — пересними
   числа сознательно, одной правкой вместе с изменением. */
TEST_SUITES.push(()=>suite("летопись M370: узел и браузер считают одинаково",()=>{
  chWorld();
  eq(chronHash(chRun(100)),2324073287,"сто сводок — известный хэш");
  eq(chronHash(chRun(500)),1299790492,"пятьсот сводок — известный хэш");
}));
