/* ══════════════ котировка не врёт (M359) ══════════════
   Продолжение линии «обещание — исполнение», но уже не по кнопкам, а по
   ЧИСЛАМ В СТРОКЕ. Ряд трюма на станции обещает три вещи разом: «берут первые
   6 по 41 кр», «остальное по 33» и итог сбоку — «1 246 кр». Игрок принимает
   решение по этим числам; если пришло другое, он этого даже не заметит — он
   заметит только, что деньги кончаются быстрее, чем он считал.

   Три закона:
   1. разбивка сходится с итогом: надбавка × первые N плюс остальное = выручка;
   2. что показано, то и пришло: `sellQuote` до сделки === прибавка кассы после;
   3. то же на прилавке кооператива, где цена идёт ломтями по десять: `coopBuyQuote`
      до сделки === списанное. И ломти обязаны дорожать, а не наоборот. */

TEST_SUITES.push(() => suite("котировка: разбивка сходится с итогом и с кассой", () => {
  resetWorld();
  const list=(typeof mkSystems==="function")?mkSystems(12):[];
  ok(list.length>=6,"станций в обходе: "+list.length);
  const bad=[];let checked=0;
  for(const sys of list){
    G.sx=sys.sx;G.sy=sys.sy;G.sys=sys;G.st=sys.station;
    for(const k of TRADE_KEYS.slice(0,4)){
      for(const q of [1,6,17,40]){
        G.market={};
        for(const r of RES_KEYS)G.cargo[r]=0;
        G.cargo[k]=q;G.credits=100000;
        const Q=sellQuote(sys,k,q);
        if(!Number.isFinite(Q.revenue)||Q.revenue<0){bad.push(sys.name+"/"+RES[k].ru+" ×"+q+": выручка "+Q.revenue);continue;}
        /* 1. разбивка: первые nA по priceA, остальное — по базовой ломтями.
           Ломти считает та же функция игры; здесь проверяется, что итог не
           разошёлся со своими же слагаемыми. */
        const rest=(typeof coopSellSlice==="function")?coopSellSlice(Q.base,q-Q.nA):(q-Q.nA)*Q.base;
        const want=Math.round(Q.nA*Q.priceA+rest);
        if(want!==Q.revenue)bad.push(sys.name+"/"+RES[k].ru+" ×"+q+": разбивка "+want+" против итога "+Q.revenue);
        /* 2. что показано, то и пришло */
        const c0=G.credits;
        const got=sellCargo(sys,k,q);
        const paid=G.credits-c0;
        checked++;
        if(paid!==Q.revenue)bad.push(sys.name+"/"+RES[k].ru+" ×"+q+": обещано "+Q.revenue+", пришло "+paid);
        if(got!==Q.revenue)bad.push(sys.name+"/"+RES[k].ru+" ×"+q+": возврат сделки "+got+" против котировки "+Q.revenue);
        if((G.cargo[k]|0)!==0)bad.push(sys.name+"/"+RES[k].ru+" ×"+q+": в трюме осталось "+G.cargo[k]);
        if(bad.length>4)break;
      }
      if(bad.length>4)break;
    }
    if(bad.length>4)break;
  }
  ok(checked>=30,"сделок сверено с котировкой: "+checked);
  eq(bad.slice(0,4).join(" ;; "),"","котировка сходится сама с собой и с кассой");
  resetWorld();
}));

TEST_SUITES.push(() => suite("котировка: надбавка станции живёт ровно на объявленное количество", () => {
  /* «БЕРЁТ титан · 20 в смену · +18 %» — это обещание не только цены, но и
     КОЛИЧЕСТВА. Сдал больше — остальное по обычной; сдал в другую смену —
     надбавка вернулась. Ни того, ни другого никто не проверял. */
  resetWorld();
  const list=(typeof mkSystems==="function")?mkSystems(30):[];
  let sys=null,k=null,want=0;
  for(const s of list){
    for(const key of TRADE_KEYS){
      const left=(typeof appetiteLeft==="function")?appetiteLeft(s,key):0;
      if(left>2){sys=s;k=key;want=left;break;}
    }
    if(sys)break;
  }
  if(!sys){ok(true,"аппетита ни на одной станции сейчас нет — пропуск");return;}
  G.sx=sys.sx;G.sy=sys.sy;G.sys=sys;G.st=sys.station;
  ok(want>2,"станция «"+sys.name+"» берёт "+RES[k].ru.toLowerCase()+" с надбавкой: "+want);
  const bad=[];
  /* сдаём ровно столько, сколько обещано с надбавкой */
  for(const r of RES_KEYS)G.cargo[r]=0;
  G.cargo[k]=want+10;G.credits=0;G.market={};
  const Q1=sellQuote(sys,k,want);
  const c0=G.credits;
  sellCargo(sys,k,want);
  if(G.credits-c0!==Q1.revenue)bad.push("первая сдача: обещано "+Q1.revenue+", пришло "+(G.credits-c0));
  if(Q1.nA!==want)bad.push("надбавка обещана на "+Q1.nA+" при объявленных "+want);
  /* добавка сверх нормы — уже без надбавки */
  const Q2=sellQuote(sys,k,10);
  if(Q2.nA!==0)bad.push("после нормы надбавка не кончилась: nA="+Q2.nA);
  if(Q2.priceA>Q1.priceA)bad.push("цена после нормы выше, чем с надбавкой: "+Q2.priceA+" против "+Q1.priceA);
  const c1=G.credits;
  sellCargo(sys,k,10);
  if(G.credits-c1!==Q2.revenue)bad.push("вторая сдача: обещано "+Q2.revenue+", пришло "+(G.credits-c1));
  eq(bad.slice(0,3).join(" ;; "),"","надбавка кончается ровно там, где обещано");
  resetWorld();
}));

TEST_SUITES.push(() => suite("котировка: прилавок кооператива дорожает ломтями и берёт объявленное", () => {
  resetWorld();
  if(typeof coopBuyQuote!=="function"){ok(true,"прилавка в этой сборке нет — пропуск");return;}
  const sys=(typeof mkSystems==="function")?mkSystems(8)[0]:null;
  if(!sys){ok(true,"станции нет — пропуск");return;}
  G.sx=sys.sx;G.sy=sys.sy;G.sys=sys;G.st=sys.station;
  if(typeof coopStamp==="function")coopStamp("Проверка");
  const k=TRADE_KEYS[0];
  const bad=[];
  /* ломти: каждые десять единиц дороже предыдущих, и никогда дешевле */
  const q10=coopBuyQuote(sys,k,10),q20=coopBuyQuote(sys,k,20),q30=coopBuyQuote(sys,k,30);
  ok(q10.total>0,"десяток стоит: "+q10.total);
  if(!(q20.total>q10.total))bad.push("двадцать не дороже десяти: "+q20.total+" против "+q10.total);
  if(!((q20.total-q10.total)>=q10.total))bad.push("второй десяток дешевле первого: "+(q20.total-q10.total)+" против "+q10.total);
  if(!((q30.total-q20.total)>=(q20.total-q10.total)))bad.push("третий десяток дешевле второго");
  if(q20.askLast<q20.ask0)bad.push("последняя цена ниже первой: "+q20.askLast+" против "+q20.ask0);
  /* и списывают ровно объявленное */
  G.credits=500000;
  for(const r of RES_KEYS)G.cargo[r]=0;
  const Q=coopBuyQuote(sys,k,10);
  const c0=G.credits,h0=G.cargo[k]|0;
  const got=coopBuy(sys,k,10);
  const paid=c0-G.credits;
  if(got>0){
    if(got===10&&paid!==Q.total)bad.push("взяли десять: обещано "+Q.total+", списано "+paid);
    if((G.cargo[k]|0)!==h0+got)bad.push("в трюм легло "+((G.cargo[k]|0)-h0)+" при взятых "+got);
  }else bad.push("прилавок не отдал ничего кооперативу с полной кассой");
  eq(bad.slice(0,3).join(" ;; "),"","ломти дорожают, и списывается объявленное");
  resetWorld();
}));
