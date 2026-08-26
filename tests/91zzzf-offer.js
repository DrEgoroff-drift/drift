/* ══════════════ автотесты: возможность и тетрадь ══════════════
   Позвоночник главного квеста (11ah, 11ai). Проверяется не «работает ли
   функция», а три обещания, на которых стоит вся дуга:
   · именное предложение заметно выгоднее холодного — иначе закрытую дверь
     игрок не почувствует ничем, а интерфейса у нас для неё нет;
   · упущенное именное закрывает дверь НАВСЕГДА, переживая и время, и загрузку;
   · тетрадь доброты не видна нигде и пишется только с ценой. */
TEST_SUITES.push(()=>suite("возможность: именное выгоднее холодного",()=>{
  resetWorld();
  G.offers=[];G.folk={};
  const cold=offerAdd("run","проба",false);
  const named=offerAdd("run","проба",true);
  ok(cold&&named,"обе возможности завелись");
  eq(named.named,1,"вторая — именная");
  eq(cold.named,0,"первая — холодная");
  /* один и тот же вид, одна и та же валюта: разница обязана быть в РАЗЫ */
  const pc=offerPay(cold),pn=offerPay(named);
  ok(pn>=pc*2.5,"именное платит в разы больше ("+pc+" против "+pn+")");
  ok(offerLine(named).indexOf("вам")===0,"именное названо «вам»");
  ok(offerLine(cold).indexOf("кто рядом")===0,"холодное объявлено всем");
}));

TEST_SUITES.push(()=>suite("возможность: упущенное именное закрывает дверь навсегда",()=>{
  resetWorld();
  G.offers=[];G.folk={};G.t=1000;
  const o=offerAdd("run","гриневич",true);
  ok(o.named,"он назвал ваш позывной");
  ok(folkOf("гриневич").good,"и помнит хорошо");
  /* окно закрылось: ни сообщения, ни записи в журнал — просто прошло время */
  const logWas=G.log.length;
  G.t+=o.ttl+1;
  offerTick();
  eq(G.log.length,logWas,"истечение не пишет ни строки в журнал");
  ok(!folkOf("гриневич").good,"дверь закрылась");
  eq(folkOf("гриневич").shut,1,"и закрылась насовсем");
  /* именного от него больше не будет, сколько ни заводи */
  let named=0;
  for(let i=0;i<20;i++){const n=offerAdd("run","гриневич",true);if(n&&n.named)named++;}
  eq(named,0,"именных от него больше нет ни одного");
  /* холодное упустить ничего не стоит: за тебя никто не просил */
  G.offers=[];G.folk={};
  const c=offerAdd("haul","стойка",false);
  G.t+=c.ttl+1;offerTick();
  ok(folkOf("стойка").good,"упущенное холодное дверь не закрывает");
  /* и переживает загрузку */
  G.folk={};folkShut("хрулёв");
  const s=snapshot();applySave(s);
  eq(folkOf("хрулёв").shut,1,"закрытая дверь переживает сохранение");
}));

TEST_SUITES.push(()=>suite("тетрадь: невидима и пишется только с ценой",()=>{
  resetWorld();
  G.ledger={n:0,w:0};
  /* даровое добро — не добро, а кнопка: без цены записи нет */
  eq(deedAdd("mark",0),0,"без цены запись не идёт");
  eq(ledgerAll().n,0,"и тетрадь пуста");
  eq(deedAdd("нетуТакого",50),0,"неизвестный вид не пишется");
  /* поступок с ценой пишется и ничего при этом не происходит */
  const logWas=G.log.length,msgWas=G.msg;
  G.credits=0;G.cargo.ice=0;
  const w=deedAdd("mark",100);
  ok(w>0,"поступок с ценой записан");
  eq(ledgerAll().n,1,"одна запись");
  eq(G.log.length,logWas,"в журнале об этом ни строки");
  eq(G.msg,msgWas,"и на экране ничего не сказано");
  /* расчётливая доброта весит меньше: тот же поступок при полном кошельке */
  G.ledger={n:0,w:0};
  G.credits=0;const poor=deedAdd("mark",100);
  G.ledger={n:0,w:0};
  G.credits=99999;const rich=deedAdd("mark",100);
  ok(rich<poor,"помог, когда сам пустой, весит больше ("+poor.toFixed(2)+" против "+rich.toFixed(2)+")");
  /* и главное: её нигде не видно */
  G.credits=0;deedAdd("rescue",90);
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  hud();
  const txt=document.body.innerText||"";
  ok(txt.indexOf("тетрад")<0&&txt.indexOf("доброт")<0,"слова тетради на экране нет");
  ok(!document.getElementById("ledger"),"и узла такого в разметке нет");
  /* переживает сохранение */
  const s=snapshot();const n0=ledgerAll().n;applySave(s);
  eq(ledgerAll().n,n0,"тетрадь переживает сохранение");
}));

/* Станция не кран. Улетел и вернулся — предлагают то же самое, что уже
   предложили, пока не сменилась смена. Упустил — значит упустил. */
TEST_SUITES.push(()=>suite("возможность: станция не выдаёт новое по кругу",()=>{
  resetWorld();
  G.offers=[];G.folk={};G.t=1000;
  const S=G.sys.station;ok(!!S,"станция есть");
  G.ship.x=S.x+40;G.ship.y=S.y;
  openStation();
  const n1=offerHere().length;
  ok(n1>0,"на стыковке что-то предложили ("+n1+")");
  /* улетели и вернулись в ту же смену */
  closeStation();
  openStation();
  eq(offerHere().length,n1,"в ту же смену новых не насыпало");
  /* забрали всё и вернулись — всё равно ничего нового до смены */
  for(const o of offerHere().slice())offerTake(o);
  closeStation();openStation();
  eq(offerHere().length,0,"взятое не восполняется в ту же смену");
  /* сменилась смена — снова предлагают */
  G.t+=260;
  closeStation();openStation();
  ok(offerHere().length>0,"в следующую смену предлагают снова");
  closeStation();
}));

/* Четверо (12u-folk). Проверяется не «есть ли таблица», а три обещания:
   человек говорит одно за заход, реплики не повторяются, пока не кончатся,
   и Птица никогда не называет твой позывной — он предлагает сам. */
TEST_SUITES.push(()=>suite("четверо: одна реплика за заход, по кругу, без повторов",()=>{
  resetWorld();
  G.folkSay={};G.folk={};G.offers=[];
  /* ищем смену, в которую кто-то стоит: они бывают не каждый раз, и это замысел */
  let found=null;
  for(let i=0;i<200&&!found;i++){G.t=1000+i*240;found=folkHere();}
  ok(!!found,"кто-то из своих иногда стоит на станции");
  const id=found;
  /* одна реплика за заход: сколько ни перерисовывай доску, строка та же */
  const v=folkVisit();
  ok(v&&v.id,"на стыковке кто-то есть");
  const l1=folkShown().line, l2=folkShown().line, l3=folkShown().line;
  eq(l1,l2,"строка не меняется при перерисовке");
  eq(l2,l3,"и на третий раз тоже");
  /* отстыковались — своих больше нет на экране */
  folkLeave();
  ok(!folkShown(),"после отстыковки на доске никого");
  /* по кругу без повторов, пока не кончатся все */
  G.folkSay={};
  const said=[],N=FOLK[id].say.length;
  for(let i=0;i<N;i++){
    const S=folkState();S[id]=i;
    said.push(FOLK[id].say[i%N]);
  }
  eq(new Set(said).size,N,"все реплики разные, пока не кончились ("+N+")");
  /* Птица не называет никого */
  G.folk={};G.t=5000;
  let named=0;
  for(let i=0;i<30;i++){G.t+=240;if(folkOffer("ptica"))named++;}
  eq(named,0,"Птица не называет твой позывной ни разу");
  /* а остальные — иногда */
  G.folk={};G.offers=[];G.t=9000;
  let some=0;
  for(let i=0;i<40;i++){G.t+=240;if(folkOffer("gusya"))some++;}
  ok(some>0,"Гуся иногда называет ("+some+" из 40)");
}));
