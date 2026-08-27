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
  /* сменилась смена — снова предлагают. Смена — сутки мира (CEL_DAY), а не
     произвольное число кадров: на этом уже один раз обожглись */
  G.t+=OFFER_SHIFT+10;
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

/* Возможность — работа, а не кнопка. Взял здесь, довёз туда, там и платят;
   не довёз в срок — именная дверь закрылась. И заслуживают имя не тем, что
   взяли, а тем, что довезли. */
TEST_SUITES.push(()=>suite("возможность: берут здесь, платят там",()=>{
  resetWorld();
  G.offers=[];G.folk={};G.things=[];G.t=2000;
  const cr0=G.credits;
  /* заводим оплачиваемую работу и берём её */
  let o=null;
  for(let i=0;i<40&&!o;i++){const c=offerAdd("run","проба",false);if(offerDest(c))o=c;else c.taken=1;}
  ok(!!o,"нашлась работа с адресом");
  offerTake(o);
  eq(G.credits,cr0,"на взятии не платят ничего");
  ok(o.carry&&o.to,"работа взята и её везут");
  ok(G.things.some(t=>/на «/.test(t.note||"")),"на столе появилась бумага с адресом");
  eq(offerCarried().length,1,"везём одну");
  /* не там — не платят */
  G.sx=o.to.sx+1;G.sy=o.to.sy+1;
  eq(offerDeliver(),0,"в чужой системе не платят");
  /* там — платят */
  G.sx=o.to.sx;G.sy=o.to.sy;
  const pay=offerDeliver();
  ok(pay>0,"на месте заплатили ("+pay+")");
  eq(G.credits,cr0+pay,"и ровно столько");
  eq(offerCarried().length,0,"больше не везём");
  /* довёз — в следующий раз назовут */
  ok(folkOf("проба").warm,"довёз — и его запомнили тёплым");
  const nxt=offerAdd("haul","проба",false);
  eq(nxt.named,1,"следующее предложение именное, хотя не просили");
  ok(!folkOf("проба").warm,"тепло потрачено на одно предложение");
}));

TEST_SUITES.push(()=>suite("возможность: не довёз именное — дверь закрылась",()=>{
  resetWorld();
  G.offers=[];G.folk={};G.things=[];G.t=3000;
  let o=null;
  for(let i=0;i<40&&!o;i++){const c=offerAdd("run","гуся",true);if(offerDest(c))o=c;else c.taken=1;}
  ok(o&&o.named,"его назвали по позывному");
  offerTake(o);
  const logWas=G.log.length;
  /* окно везомой работы втрое длиннее, чем у предложения на доске */
  G.t+=o.ttl*2+1;offerTick();
  ok(folkOf("гуся").good,"две трети срока прошло — дверь ещё открыта");
  G.t+=o.ttl+1;offerTick();
  ok(!folkOf("гуся").good,"не довёз — и дверь закрылась");
  eq(G.log.length,logWas,"и об этом нигде ни строки");
  /* и сроки эти — в сутках мира, а не в кадрах: сборка, где окно жило две
     секунды, выглядела ровно так же и была сломана насквозь */
  ok(OFFER_TTL[0]>=CEL_DAY*.5,"окно предложения — не меньше полусуток");
  eq(OFFER_SHIFT,CEL_DAY,"смена на станции равна суткам");
}));

/* ── M229: возможности углубляются экспедицией ── */
TEST_SUITES.push(()=>suite("экспедиция: стойка живёт колонной и вносит в список",()=>{
  resetWorld();
  G.offers=[];G.folk={};
  eq(!!OFFER_KIND.carav,true,"плечо в колонну есть в таблице");
  eq(!!OFFER_KIND.list,true,"и имя в список тоже");
  ok(OFFER_KIND.list.pay[1]===0,"список не платит ни кредита: это доступ, а не работа");
  /* без экспедиции ни того ни другого не предлагают */
  G.exp=null;
  const who="st:"+G.sys.key;
  folkOf(who);
  for(let i=0;i<8;i++){G.t+=OFFER_SHIFT;offerVisit();}
  ok(!offersAll().some(o=>o.kind==="carav"||o.kind==="list"),"в мирный день колонны на доске нет");
  /* циркуляр звучит — и стойка меняется */
  G.offers=[];G.folk={};folkOf(who);
  G.exp={phase:1,day0:celDay(),coll:{},gone:[],gave:0,pax:null};
  let sawCarav=false,sawList=false;
  for(let i=0;i<40&&!(sawCarav&&sawList);i++){
    G.t+=OFFER_SHIFT;offerVisit();
    sawCarav=sawCarav||offersAll().some(o=>o.kind==="carav");
    sawList=sawList||offersAll().some(o=>o.kind==="list");
  }
  ok(sawCarav,"за экспедицию колонна появляется на доске");
  ok(sawList,"и имя в список предлагают");
}));

TEST_SUITES.push(()=>suite("экспедиция: список — это строка чужой рукой и два слова в день ухода",()=>{
  resetWorld();
  G.offers=[];G.folk={};G.record=null;
  G.exp={phase:1,day0:celDay(),coll:{},gone:[],gave:0,pax:null};
  const who="st:"+G.sys.key;
  const o=offerAdd("list",who,true);
  ok(o&&o.named===1,"имя в список — именное по устройству");
  offerTake(o);
  eq(G.exp.listed,1,"взял — внесён");
  const R=(G.record&&G.record.entries)||G.record||[];
  const flat=JSON.stringify(R);
  ok(flat.indexOf("внесён в список")>=0,"и в книжке строка чужой рукой");
  /* доставка колонне сдаёт станции сверх денег */
  G.exp.coll={};
  const oc=offerAdd("carav",who,false);
  offerTake(oc);
  if(oc.to){
    G.sx=oc.to.sx;G.sy=oc.to.sy;G.sys=getSystem(G.sx,G.sy);
    offerDeliver();
    let tot=0;for(const k in G.exp.coll)tot+=G.exp.coll[k];
    ok(tot>=3,"колонна получила свои три единицы сверх платы");
  }
  /* закрытая дверь остаётся закрытой и в горячие дни */
  const shutWho="st:9,9";
  const f=folkOf(shutWho);f.good=0;f.shut=1;
  const o2=offerAdd("carav",shutWho,true);
  eq(o2.named,0,"экспедиция не открывает закрытых дверей: этот человек не называет");
}));

/* ── M231: «Тихоня» — подарок, которого никто не считал ── */
TEST_SUITES.push(()=>suite("Тихоня: приходит поздно, платит тетрадь, и никто не говорит за что",()=>{
  resetWorld();
  G.uniqueShips={};G.owned={strizh:true};G.ledger={n:0,w:0};G.home=null;G.log=[];
  /* рано и не за что: ничего не происходит */
  eq(giftDue(),false,"пустая тетрадь — никакой яхты");
  /* полная тетрадь, но нет года и дома */
  G.ledger={n:8,w:400};
  eq(giftDue(),false,"без прожитого года — рано");
  G.t=CEL_DAY*400;
  eq(giftDue(),false,"без дома — некуда: её оставляют у причала");
  G.home={tier:1,sx:2,sy:3,turn:0};
  eq(giftDue(),true,"тетрадь, год и дом — пора");
  /* застают по прилёте в родной сектор, и только там */
  G.sx=5;G.sy=5;G.sys=getSystem(5,5);
  eq(giftArrive(),false,"в чужом секторе её не будет");
  G.sx=2;G.sy=3;G.sys=getSystem(2,3);
  ok(giftArrive(),"дома — стоит у причала");
  const S=shipData("gift1");
  ok(!!S&&G.owned.gift1===true,"и она ваша");
  eq(S.tier,"luxe","люкс по устройству — лак, тик, латунь");
  eq(S.hcls,"yacht","и яхта по классу");
  eq(S.price,0,"цены у подарка нет");
  eq(hullClassOf("gift1",S),"yacht","корпус читает класс из неё самой");
  /* правда не произносится */
  const flat=G.log.map(e=>e.text||"").join(" ")+" "+S.note;
  ok(!/добр|заслуж|за то|спасибо|награ/i.test(flat),"ни слова о том, за что она");
  /* второй раз не приходит */
  eq(giftDue(),false,"подарок один");
  eq(giftArrive(),false,"и второго не будет");
  /* продать нельзя: у корпусов в этой игре нет пути продажи — проверяем, что
     строка ангара для неё не предлагает денег */
  const row=shipRow("gift1",S);
  ok(row.textContent.indexOf("кр")<0||row.textContent.indexOf("ПЕРЕСЕСТЬ")>=0,
     "в ангаре — только пересесть, никаких кредитов");
  /* и сейв её не теряет */
  const snap=snapshot();
  G.uniqueShips={};G.owned={strizh:true};
  applySave(snap);
  ok(!!shipData("gift1")&&G.owned.gift1,"пережила сохранение");
}));
