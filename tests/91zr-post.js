/* ══════════════ почтовый круг: шесть адресов, одна строка на звено ══════════════ */
TEST_SUITES.push(()=>suite("почтовый круг: адреса живые, вещь идёт по рукам, последний замечает",()=>{
  resetWorld();
  const A=postAddrs();
  eq(A.length,POST_LINKS.length,"адресов столько же, сколько звеньев");
  eq(new Set(A).size,A.length,"все адреса разные");
  for(let i=0;i<A.length;i++){
    ok(!!A[i],"звено "+i+": адрес найден");
    if(!A[i])continue;
    const p=A[i].split(",");const s=getSystem(+p[0],+p[1]);
    ok(!!(s&&s.station),"звено "+i+": по адресу станция");
    const inPost=regionAt(+p[0],+p[1]).theme==="post";
    if(i===0||i===A.length-1)ok(inPost,"звено "+i+" — в почтовом кругу");
    else ok(!inPost,"звено "+i+" — вне почтового круга");
    if(i===0||i===A.length-1)eq(misclose(+p[0],+p[1]),0,"звено "+i+": приборы молчат");
  }
  for(const L of POST_LINKS)ok(L.line.indexOf("посыл")<0&&L.line.indexOf("свёрт")<0,L.who+": строка о себе, не о посылке");
  /* ход: не там — никто не подходит */
  const dockAt=k=>{const p=k.split(",");G.sx=+p[0];G.sy=+p[1];G.sys=getSystem(G.sx,G.sy);G.st=G.sys.station;G.mode="dock";odoAdd("lands");};
  dockAt(A[2]);eq(postDock(),null,"не с того звена ничего не начинается");
  dockAt(A[0]);const r0=postDock();ok(!!r0&&r0.first,"на первом звене вещь отдают");
  eq(postAll().stage,1,"везём к первому");ok(postHolding(),"посылка у нас");
  eq(postDock(),null,"второй раз на той же посадке не подходят");
  dockAt(A[2]);eq(postDock(),null,"звено через одно — молчит");
  dockAt(A[1]);const r1=postDock();ok(!!r1&&r1.who===POST_LINKS[1].who,"второе звено говорит");
  for(let i=2;i<A.length-1;i++){dockAt(A[i]);ok(!!postDock(),"звено "+i+" говорит");}
  eq(postAll().stage,A.length-1,"осталось ядро");
  /* вскрыли — цепочка идёт, последний замечает */
  ok(!!postOpen(),"вскрыть можно");eq(postOpen(),null,"второй раз нечего");
  dockAt(A[A.length-1]);const rl=postDock();
  ok(!!rl&&rl.last,"последний адресат принял");
  eq(rl.line,POST_LINKS[POST_LINKS.length-1].opened,"он заметил, что вскрыта");
  ok(postAll().done===1&&!postHolding(),"доставлено");
  const cr=G.credits;eq(G.credits,cr,"ничего не заплачено");
  /* сейв */
  const s=snapshot();ok(s.post&&s.post.done===1&&s.post.opened===1,"посылка в сейве");
  s.post.stage=99;applySave(s);eq(G.post.stage,POST_LINKS.length-1,"звено в сейве обрезано по таблице");
  /* не вскрытая — обычная строка */
  resetWorld();G.post={stage:POST_LINKS.length-1,opened:0,done:0};
  dockAt(A[A.length-1]);eq(postDock().line,POST_LINKS[POST_LINKS.length-1].line,"не вскрытая — без замечания");
}));
