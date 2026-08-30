/* ══════════════ запись, которая не убивает полёт ══════════════
   30.08.2026 автор прислал журнал с поверхности: «Сбой кадра: Invalid string
   length · surface». Так падает JSON.stringify, когда результат длиннее
   предельной строки движка, — а зовётся он прямо из кадра (autosave и
   rareTake, 12m). Одно раздувшееся поле останавливало не запись, а мир: игра
   ловила исключение сторожем и шла дальше, но с этой секунды НЕ ПИСАЛА и
   молчала об этом. Здесь проверяется договор saveText (14-save): она не
   бросает никогда, называет виновника и отдаёт полёт без него. */
TEST_SUITES.push(()=>suite("запись: не бросает и называет виновника",()=>{
  resetWorld();
  const t=saveText();
  ok(typeof t==="string"&&t.length>100,"обычный полёт собирается в строку ("+
    (t?t.length:0)+" знаков)");
  ok(JSON.parse(t).v===5,"и это разбираемая запись версии 5");

  /* поле, которое не сериализуется: toJSON бросает ровно ту же ошибку, что
     пришла из игры автора. Полёт после этого обязан записаться БЕЗ него. */
  const was=G.things;
  G.things=[{toJSON(){throw new RangeError("Invalid string length");}}];
  const n0=(G.log||[]).length;
  const t2=saveText();
  ok(typeof t2==="string","взбесившееся поле не роняет запись");
  const s2=t2?JSON.parse(t2):{};
  ok(!("things" in s2),"виновник вынут из записи");
  ok(s2.credits===G.credits&&s2.v===5,"а всё остальное на месте");
  const said=(G.log||[]).slice(n0).map(e=>e.s).join(" | ");
  ok(/things/.test(said),"и назван в журнале вслух ("+said.slice(0,80)+")");
  G.things=was;

  /* разбухание видно ДО того, как станет смертельным */
  const wasLog=G.log;
  G.log=[{t:Date.now(),k:"",s:new Array(1100000).join("x")}];
  const t3=saveText();
  ok(typeof t3==="string"&&t3.length>1000000,"толстая запись всё равно пишется");
  const fat=(G.log||[]).map(e=>e.s).join(" | ");
  ok(/разбухла/.test(fat)||/log/.test(fat),"о разбухании сказано в журнале");
  G.log=wasLog;
}));

/* ══════════════ пустая карта, вернувшаяся из облака списком ══════════════
   Настоящая причина обоих сбоев автора (30.08.2026, 20:36 и 23:23). PHP в
   site/api.php декодирует снимок в ассоциативные массивы и печатает ПУСТУЮ
   карту как `[]`. Значит `G.poiSeen`, слетав в облако пустым, возвращается
   массивом; первый же осмотр памятника кладёт в него ключ `hashi(...)>>>0` —
   беззнаковое 32-битное число, — и массив получает длину в миллиарды. Записи
   после этого нет вовсе: JSON.stringify печатает миллиарды `null`.
   Здесь воспроизводится ровно этот путь, шаг за шагом. */
TEST_SUITES.push(()=>suite("запись: пустая карта из облака приезжает списком",()=>{
  resetWorld();
  /* так выглядит снимок ПОСЛЕ облака: пустые карты стали списками */
  const s=snapshot();
  const cloud=JSON.parse(JSON.stringify(s));
  let turned=0;
  for(const k in cloud)
    if(cloud[k]&&typeof cloud[k]==="object"&&!Array.isArray(cloud[k])&&
       Object.keys(cloud[k]).length===0){cloud[k]=[];turned++;}
  ok(turned>0,"в снимке есть пустые карты, которым облако меняет тип ("+turned+")");
  ok(applySave(cloud),"такой снимок загружается");
  ok(!Array.isArray(G.poiSeen),"и poiSeen приходит картой, а не списком");
  ok(!Array.isArray(G.market)&&!Array.isArray(G.rep)&&!Array.isArray(G.mines),
     "рынок, репутация и шахты — тоже");

  /* и та самая запись по 32-битному ключу больше не растягивает ничего */
  G.poiSeen[hashi(12345,7,0x50E1)]=1;
  const t=saveText();
  ok(typeof t==="string"&&t.length<400000,"запись собирается и весит по-людски ("+
    (t?t.length:0)+")");
  ok(JSON.parse(t).poiSeen&&!Array.isArray(JSON.parse(t).poiSeen),"poiSeen остался картой");

  /* а если массив всё-таки попал в живое состояние — осмотр его чинит сам */
  G.poiSeen=[];
  const q={k:"anomaly",ru:"аномалия",seed:hashi(999,3,0x50E1)};
  poiInspect(q);
  ok(!Array.isArray(G.poiSeen),"осмотр не пишет в список, а превращает его в карту");
  const t2=saveText();
  ok(typeof t2==="string"&&t2.length<400000,"и запись после осмотра цела");
}));
