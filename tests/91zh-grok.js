/* ══ M120: Грохотун — рейс, а не кресло ══
   Сторож замысла: он не входит в экипаж и не занимает домен; платят ему товаром
   и никогда кредитами; копает он только по СВОЕМУ слою карты; за копку платят
   дважды — занятостью там и его языком здесь; учит он ровно один раз. */
TEST_SUITES.push(()=>suite("Грохотун: рейс, а не кресло",()=>{
  resetWorld();
  const R=grokRec();
  eq(R.state,"idle","в новом мире он свободен");
  ok(GROK_LIKE.indexOf(grokWant())>=0,"ест он ходовой товар: "+grokWant());
  ok(grokPrice()>=100,"и берёт неразумно много: "+grokPrice());

  /* ── правило четырёх кресел и списка экипажа не шевелится ── */
  const crew0=G.crew.length, mgr0=G.mgrs.length;

  /* ── копать нечего, пока нет своего слоя карты ── */
  eq(grokSites().length,0,"без свидетельств площадок нет");
  ok(!grokSend(3,3),"и наугад он не пойдёт");

  /* ── появился адрес — появилась площадка ── */
  let mark=null;
  for(let k=1;k<400&&!mark;k++){
    loreTake(k);
    if(loreMarks().length)mark=loreMarks()[0];
  }
  ok(!!mark,"адрес из отчёта получен");
  const sites=grokSites();
  ok(sites.length>0,"площадка на карте есть: "+sites.length);
  ok(sites.every(s=>!!starAt(s.sx,s.sy)),"каждая площадка — на звезде, а не в пустоте");

  /* ── платят едой, и только едой ── */
  const want=grokWant(),price=grokPrice();
  G.cargo[want]=price-1;
  const cr=G.credits;
  ok(!grokSend(sites[0].sx,sites[0].sy),"недоплата не отправляет");
  G.cargo[want]=price+5;
  ok(grokSend(sites[0].sx,sites[0].sy),"полная плата отправляет");
  eq(G.cargo[want],5,"еда ушла из трюма ровно по цене");
  eq(G.credits,cr,"кредитов он не берёт");
  eq(grokBusy(),true,"он в отъезде");
  ok(!grokSend(sites[0].sx,sites[0].sy),"второй площадки одновременно не берёт");
  eq(G.crew.length,crew0,"в экипаж он не вошёл");
  eq(G.mgrs.length,mgr0,"и кресла в штабе не занял");
  eq(grokTake(),null,"пока копает, спрашивать нечего");

  /* ── вернулся: отвал, кусок и две расплаты ── */
  G.grok.due=Date.now()-1;
  grokTick();
  const tgt=G.grok.sx+","+G.grok.sy, occ0=occLvl(G.grok.sx,G.grok.sy);
  const res=grokTake();
  ok(!!res,"результат получен");
  eq(G.credits,cr,"и снова ни кредита");
  ok(occLvl(res.sx,res.sy)>occ0,"копали громко: занятость там поднялась");
  eq(G.grok.state,"idle","он снова свободен");
  ok(!!G.grok.dug[tgt],"площадка закрыта");
  ok(grokSites().every(s=>(s.sx+","+s.sy)!==tgt),"и второй раз её не предлагают");
  ok(grokPrice()>price,"после площадки он ест больше: "+grokPrice());
}));

TEST_SUITES.push(()=>suite("Грохотун: объясняет один раз",()=>{
  resetWorld();
  grokRec();
  /* до непрочитанного объяснять нечего */
  ok(!grokCanTeach()||!!heardAll().length,"без непрочитанного он молчит");
  /* заводим птицу и непонятную фразу */
  parrotFind(4242,"борта «Проба»");
  G.sx=0;G.sy=0;
  const ph=heardPidgin(777,0,0);
  ok(!!ph&&!ph.read,"есть фраза, которую игрок не читает");
  ok(grokCanTeach(),"и теперь ему есть что сказать");
  ok(grokTeach(),"объяснил");
  eq(G.grok.taught,1,"и это записано");
  ok(!grokCanTeach(),"второй раз не объясняет");
  ok(!grokTeach(),"и повторить его нельзя");
  eq(loreVocab().length,0,"объяснение не выдало ни одного слова: он учит, а не решает");
}));
