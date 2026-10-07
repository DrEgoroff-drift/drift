/* ── деньги не печатаются: ворота §12 (аудит экономики 23.09) ──
   Три сети к кругу «купил — продал» из 91zzzzy-play: освобождение одной системы,
   «купил здесь — сдал здесь» у госзаказа и наряда, и счёт после строк таблицы
   событий наёмника. Каждая ловит свой кран, закрытый в §12. */

TEST_SUITES.push(()=>suite("деньги не печатаются: отбить ту же систему второй раз — не больше половины",{tier:"node"},()=>{
  resetWorld();
  G.occ={};G.occCalm={};
  /* система со станцией и соседняя звезда, которую трасса не бережёт: оттуда её возьмут снова */
  let S=null,N=null;
  for(let sx=-14;sx<=14&&!S;sx++)for(let sy=-14;sy<=14&&!S;sy++){
    if(!starAt(sx,sy)||!getSystem(sx,sy).station)continue;
    for(let dx=-1;dx<=1&&!N;dx++)for(let dy=-1;dy<=1&&!N;dy++){
      if((!dx&&!dy)||!starAt(sx+dx,sy+dy))continue;
      if(mapUnderTrassa(sx+dx,sy+dy))continue;
      N=[sx+dx,sy+dy];
    }
    if(N)S=[sx,sy];else N=null;
  }
  ok(!!S,"есть станция с соседом вне трассы: "+S+" / "+N);
  const full=Math.round(2400+sysDanger(S[0],S[1])*9000);
  const free=()=>{occSet(S[0],S[1],1);const o=occAt(S[0],S[1]);o.kills=occInfo(1).need-1;
    const c0=G.credits;occKill(S[0],S[1]);return G.credits-c0;};
  occSet(N[0],N[1],2);
  const p1=free(),p2=free();
  ok(occLvl(S[0],S[1])===0,"система свободна");
  ok(p2>0,"приз за второе освобождение есть: "+p2);
  ok(p2<=Math.round(full/2),"второй раз при живом соседе — не больше половины: "+p2+" из "+full+" (первый "+p1+")");
  occSet(N[0],N[1],0);
  const p3=free();
  eq(p3,full,"соседа нет, отбитое удержится — приз полностью");
  resetWorld();
}));

TEST_SUITES.push(()=>suite("деньги не печатаются: купил и сдал у одной станции для плана и наряда — не в плюс",{tier:"node"},()=>{
  resetWorld();
  const sys=G.sys;G.st=sys.station;
  const k=TRADE_KEYS.find(x=>sys.station.prices[x]&&marketFor(sys)[x]>0&&!RES[x].pax);
  ok(!!k,"на прилавке есть товар: "+k);
  /* госзаказ: 20 единиц по твёрдой цене ×1.3 таблицы, сдавать здесь же */
  G.credits=100000;G.cargo={};
  const c0=G.credits,n=buyCargo(sys,k,20);
  ok(n===20,"взято 20: "+n);
  const P={k,n:20,price:Math.round(RES[k].price*1.3)};
  const Y=gosPay(P);
  eq(Y.m,20,"все 20 куплены здесь в эту смену");
  ok(Y.pay-(c0-G.credits)<=0,"план с купленного здесь не в плюс: выплата "+Y.pay+", покупка "+(c0-G.credits));
  /* наряд с получателем здесь: купил у адресата — сдал адресату */
  G.credits=100000;G.cargo={};
  const c1=G.credits,q=buyCargo(sys,k,10);
  G.order={key:"x",from:"проба",k,ru:RES[k].ru.toLowerCase(),qty:10,to:{sx:sys.sx,sy:sys.sy,name:sys.station.name},
    pay:Math.round((10*RES[k].price*1.5+8*120)/10)*10,due:1e9,win:0};
  ok(q===10&&orderDeliver(),"наряд сдан");
  ok(G.credits-c1<=0,"наряд с купленного у адресата не в плюс: "+(G.credits-c1)+" кр");
  resetWorld();
}));

TEST_SUITES.push(()=>suite("деньги не печатаются: счёт не ниже нуля после любой строки событий наёмника",{tier:"node"},()=>{
  const bad=[];let n=0;
  for(const ev of CREW_EVENTS){
    for(const cr of [0,37,5000]){
      resetWorld();
      const m=mkMerc(2718+n,"mine","obod");
      if(ev.when&&!ev.when(m))continue;
      G.credits=cr;
      applyCrewEvent(m,ev,rng(11+n),2400,.6);n++;
      if(!(G.credits>=0))bad.push(ev.id+" при "+cr+" → "+G.credits);
    }
  }
  ok(n>=CREW_EVENTS.length,"строк прогнано: "+n);
  eq(bad.slice(0,4).join(" ;; "),"","после каждой строки счёт не в минусе");
  resetWorld();
}));
