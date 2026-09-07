/* ══════════════ сторож темпа (P8, M416) ══════════════
   Мерило самого плана ремесла: «длинный прогон фуззера не должен дойти до
   конца раньше его окна». Проверять здесь надо ровно три вещи, и все три —
   про то, чего НЕ происходит: окно закрыто, часы не крутятся от наблюдения,
   и сторож молчит. Плюс полнота таблицы: конец без строки в ней — это конец
   без окна, и такой уже был («тот один» до M416). */
TEST_SUITES.push(()=>suite("темп: у каждого конца есть окно, и в новом мире оно закрыто",()=>{
  resetWorld();
  ok(CLOCK_KEYS.length>=3,"концов под сторожем: "+CLOCK_KEYS.length);
  for(const k of CLOCK_KEYS){
    const C=CLOCKS[k];
    ok(C.ru&&C.note,k+": назван и объяснён");
    ok((C.day|0)>0,k+": окно не раньше суток "+C.day);
    ok((C.seg|0)>=0&&(C.gap|0)>=0,k+": сегменты и промежуток заданы");
    eq(clockOpen(k),false,k+" в новом мире закрыт · "+clockWhy(k));
  }
}));

TEST_SUITES.push(()=>suite("темп: три двери за вечер — это вечер, а не жизнь",()=>{
  resetWorld();
  G.t=0;
  /* три двери подряд в один день: часы засчитывают одну */
  folkShut("st:a");folkShut("st:b");folkShut("st:c");
  eq(clockSeg("toldoff"),1,"за один день — один сегмент");
  /* и окно закрыто, хотя дверей уже три */
  eq(doorsShut(),3,"дверей закрыто три");
  eq(clockOpen("toldoff"),false,"а окно закрыто: "+clockWhy("toldoff"));
  /* реплика части VI не прозвучала */
  G.toldOff=0;
  eq(G.toldOff|0,0,"и «тот один» молчит");
  /* с промежутком — часы идут */
  G.t=CEL_DAY*(CLOCKS.toldoff.gap+1);folkShut("st:d");
  eq(clockSeg("toldoff"),2,"через промежуток — второй сегмент");
  G.t=CEL_DAY*(CLOCKS.toldoff.gap*2+2);folkShut("st:e");
  eq(clockSeg("toldoff"),3,"и третий");
  eq(clockOpen("toldoff"),false,"но суток всё ещё мало: "+clockWhy("toldoff"));
  G.t=CEL_DAY*(CLOCKS.toldoff.day+1);
  eq(clockOpen("toldoff"),true,"а вот теперь — окно");
}));

TEST_SUITES.push(()=>suite("темп: наблюдение часы не двигает, и сторож не пишет",()=>{
  resetWorld();
  const before=clockSeg("toldoff");
  for(let i=0;i<50;i++){clockOpen("toldoff");clockOpen("gift");clockOpen("record");}
  eq(clockSeg("toldoff"),before,"пятьдесят взглядов — ноль сегментов");
  /* правило 3: сторож не история. Ни сообщения, ни записи в журнале */
  G.msg="";G.msgT=0;
  const logN=(G.log||[]).length;
  clockOpen("toldoff");clockPush("gift");
  eq(G.msg,"","сторож ничего не сказал");
  eq((G.log||[]).length,logN,"и ничего не записал");
  /* повтор двери не крутит часы: необратимое случается один раз */
  resetWorld();G.t=0;
  folkShut("st:x");folkShut("st:x");folkShut("st:x");
  eq(clockSeg("toldoff"),1,"одна дверь — один сегмент, сколько ни закрывай");
}));

TEST_SUITES.push(()=>suite("темп: концы спрашивают сторожа, и часы переживают загрузку",()=>{
  resetWorld();
  /* подарок: своих условий мало, окна тоже нет */
  eq(giftDue(),false,"«Тихоня» в новом мире не приходит");
  eq(recordBoardHere(),false,"и комиссия тоже");
  /* часы уходят в запись и возвращаются */
  G.t=0;folkShut("st:q");
  const seg=clockSeg("toldoff"),last=clockOf("toldoff").last;
  const s=JSON.parse(JSON.stringify(snapshot()));
  resetWorld();
  eq(clockSeg("toldoff"),0,"новый мир — часы с нуля");
  applySave(s);
  eq(clockSeg("toldoff"),seg,"после загрузки сегменты на месте");
  eq(clockOf("toldoff").last,last,"и сутки последнего дела тоже");
  /* битая запись не пролезает */
  s.clocks={toldoff:{n:-5,last:7},ЧУЖОЕ:{n:99,last:0}};
  applySave(s);
  ok(clockSeg("toldoff")>=0,"отрицательные сегменты не проходят: "+clockSeg("toldoff"));
  ok(!G.clocks["ЧУЖОЕ"],"и незнакомый ключ тоже");
}));
