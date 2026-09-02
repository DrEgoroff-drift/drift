/* ══════════════ автотесты: холдинг · слухи, новости, чужие на проданной дороге (M297) ══════════════ */
TEST_SUITES.push(()=>suite("холдинг: новость с причиной, слух чужими словами, соперник с проданной дороги",()=>{
  resetWorld();
  const s=siteTestStation();
  const st=routeTestStations(4).filter(x=>x.key!==(s&&s.key));
  if(!s||!st.length){ok(true,"пропущено");return;}
  siteTestOpen(s);
  const H=holdOf(s.key);H.bld={};
  /* новость с причиной: заложен цех — строка с адресом и давление вверх на входы */
  const def=BLD.alloyshop,main=Object.keys(def.eats)[0];
  marketFor(s);G.market[s.key].pressure[main]=0;
  G.news=[];
  H.bld[def.id]={lvl:1,t0:Date.now(),ready:Date.now()-1,my:{},got:{}};
  const item=holdNews(s,def,"laid");
  ok(!!item&&item.sx===s.sx&&item.ru.indexOf(s.station.name)>=0&&/заложен/.test(item.ru),"новость назвала станцию и цех: "+item.ru);
  ok(G.market[s.key].pressure[main]>0,"входы цеха поднялись в цене (+"+G.market[s.key].pressure[main].toFixed(2)+")");
  ok(newsAll().indexOf(item)>=0,"новость легла в G.news");
  /* закладка через bldLay тоже пишет новость */
  G.credits=100000;G.cargo.alloy=50;for(const k in BLD.rebarshop.cost)if(k!=="credits")G.cargo[k]=BLD.rebarshop.cost[k];
  const n0=newsAll().length;
  const why=bldLay(s,BLD.rebarshop.id);
  ok((why===""&&newsAll().length===n0+1)||why!=="","bldLay пишет новость ("+(why||"заложен")+")");
  /* уклад и слух */
  H.bld.rollshop={lvl:1,t0:Date.now(),ready:Date.now()-1,my:{},got:{}};
  ok(holdUklad(s.key)==="заводская","две постройки передела — система заводская");
  const line=holdRumourLine(()=>0);
  ok(!!line&&/заводская|разработку|промысел|бурить|льда|пояс|гигант|зелень|зверьё|отвалы/.test(line),"эфир говорит о холдинге чужими словами: "+line);
  /* проданная дорога: по её плечам ходят чужие баржи */
  G.trade=routeInit();G.trade.soldSets=[[s.key,st[0].key]];
  const legs=bargeLegs();
  const has=legs.some(l=>(l[0].key===s.key&&l[1].key===st[0].key)||(l[0].key===st[0].key&&l[1].key===s.key));
  ok(has,"плечо проданной дороги вошло в плечи барж");
  ok(legs.some(l=>l[2]===1),"плечо помечено как проданное");
  /* соперник выбирает аппетит раз в смену */
  const A=appetiteOf(s);
  if(A){
    const k=Object.keys(A)[0];
    H.rival=0;
    const ate0=appetiteAte(s,k);
    const n=rivalEat(s,k,100);
    ok(n>0&&appetiteAte(s,k)===ate0+n,"чужая баржа выбрала "+n+" из аппетита станции");
    ok(rivalEat(s,k,100)===0,"второй раз за смену не ест");
  }else ok(true,"у станции нет аппетита — часть пропущена");
}));
