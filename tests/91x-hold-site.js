/* ══════════════ автотесты: холдинг · постройки, площадка, бункер (M291) ══════════════ */
function siteTestStation(){
  for(let dx=-9;dx<=9;dx++)for(let dy=-9;dy<=9;dy++){
    if(!starAt(dx,dy))continue;
    const s=getSystem(dx,dy);
    if(s.station&&s.station.stype!=="fuel"&&(s.planets||[]).length)return s;
  }
  return null;
}
/* «сделать систему своей» руками: посадка, залежь, дрон, груз — ступень 11 */
function siteTestOpen(s){
  G.hold={};   /* слой лениво создаётся и не входит в resetWorld — чистим сами */
  G.place=G.place||{};
  G.place[s.key]={f:0,l:0,n:4,take:0,hurt:0,care:0};
  G.place[s.key+"/0"]={f:0,l:0,n:2,take:0,hurt:0,care:0};
  holdDeed(s.sx,s.sy,"drill",4);holdDeed(s.sx,s.sy,"drone",6);holdDeed(s.sx,s.sy,"cargo",300);
  G.names=G.names||{};G.names[s.key]="Проверочная";
}
TEST_SUITES.push(()=>suite("холдинг: таблица построек и промышленные ключи",()=>{
  resetWorld();
  ok(IND_KEYS.length===46,"промышленных ключей — 46 ("+IND_KEYS.length+")");
  ok(IND_KEYS.every(k=>TRADE_KEYS.indexOf(k)<0),"рынок промышленное не видит");
  ok(RES.alloy.ind===1&&RES.techcomp.ind===2&&RARE_RES.indexOf("alloy")>=0,"сплавы и техкомпоненты сохранили ключи и остались редким");
  ok(typeof SMELT==="undefined","рецептов ПЕРЕПЛАВКИ больше нет (развилка 2б)");
  ok(!ST_TYPES.some(t=>t.tabs.indexOf("smelt")>=0)&&!ST_GROUPS.some(g=>g.tabs.indexOf("smelt")>=0),"вкладки smelt нет ни у типа, ни в разделе");
  ok(ST_GROUPS.length===6&&ST_GROUPS.find(g=>g.id==="hold").tabs.indexOf("site")>=0,"СТРОЙКА живёт в ВЛАДЕНИЯХ, разделов по-прежнему шесть");
  const fam={A:0,B:0,C:0,D:0};
  for(const id of BLD_KEYS){
    const d=BLD[id];fam[d.fam]++;
    ok(d.ru&&d.cost&&d.at&&d.fx&&d.sh&&d.tier,"строка полная: "+id);
    for(const k in d.eats)ok(!!RES[k],id+" ест то, что есть в RES: "+k);
    for(const k in d.makes)ok(!!RES[k],id+" делает то, что есть в RES: "+k);
    for(const k in d.cost)ok(k==="credits"||!!RES[k],id+": цена в существующих ключах: "+k);
    if(d.fam==="B")ok(Object.keys(d.eats).every(k=>!RES[k].ind),id+": ярус 1 ест только сырьё");
    if(d.fam==="A")ok(!Object.keys(d.eats).length,id+": добыча не ест");
  }
  ok(fam.A===8&&fam.B===22&&fam.C===18&&fam.D===8,"семьи: 8 · 22 · 18 · 8 ("+fam.A+" "+fam.B+" "+fam.C+" "+fam.D+")");
  ok(indPrice("alloy")===127&&indPrice("roll")===68&&indPrice("bearing")===345&&indPrice("hullsec")===2092,"теневые цены сходятся с замыслом (127 · 68 · 345 · 2092)");
  const up=bldUpgradeCost(BLD.alloyshop,3);
  ok(up.credits===BLD.alloyshop.cost.credits*2&&up.mline===2&&up.habblock===1,"×3 — дважды ×1, две линии и жилой блок");
  ok(BLD.alloyshop.cost.credits>=1200&&BLD.oxyshop.cost.credits===400,"кредиты цеха — по его паю: плавильный дороже кислородного ("+BLD.alloyshop.cost.credits+" / "+BLD.oxyshop.cost.credits+")");
}));
TEST_SUITES.push(()=>suite("холдинг: ступень от дел, площадка и правило §10.1",()=>{
  resetWorld();
  const s=siteTestStation();
  if(!s){ok(true,"станции с планетами нет — пропущено");return;}
  ok(rungOf(s.sx,s.sy)===0,"нетронутая система — ступень 0");
  G.place={};G.place[s.key]={f:0,l:0,n:9,take:0,hurt:0,care:0};
  G.names={};G.names[s.key]="Имя";
  ok(rungPoints(s.sx,s.sy)===6&&rungOf(s.sx,s.sy)<=5,"без посадки выше пятой не подняться (очков "+rungPoints(s.sx,s.sy)+")");
  ok(bldSites(rungOf(s.sx,s.sy))===0&&/площадка ещё не открыта/.test(bldWhy(s,BLD.alloyshop)),"до ступени 11 площадки нет");
  siteTestOpen(s);
  const r=rungOf(s.sx,s.sy);
  ok(r>=11&&r<=15,"посадка, залежь, дрон, груз и имя — ступень 11 ("+r+", очков "+rungPoints(s.sx,s.sy)+")");
  ok(bldSites(r)===1,"одна площадка");
  ok(rungAddress(r)==="монтажник","на площадке зовут монтажником");
  /* §10.1: то, что делает система, здесь не едят */
  const M=sysMakes(s),madeHere=Object.keys(M);
  ok(madeHere.length>0,"система что-то делает сама: "+madeHere.join(", "));
  const bad=BLD_KEYS.map(id=>BLD[id]).find(d=>d.fam==="B"&&Object.keys(d.eats).some(k=>M[k]));
  if(bad)ok(/и так делают/.test(bldWhy(s,bad)),bad.ru+" здесь не поставить: "+bldWhy(s,bad));
  const A=bldAvailable(s);
  ok(A.ok.every(x=>x.def.fam!=="C"&&x.def.fam!=="D"),"на ступени 11 второй и третий ярус закрыты");
  ok(A.no.every(x=>x.why.length>0),"у каждой недоступной строки есть причина");
  const good=A.ok.find(x=>x.def.fam==="B");
  if(!good){ok(true,"в этой системе нечего заложить из передела — пропущено");return;}
  const def=good.def,main=Object.keys(def.eats)[0];
  /* заложить: без денег — отказ; с деньгами — стоит и монтируется */
  G.credits=0;for(const k of RES_KEYS)G.cargo[k]=0;
  ok(/не хватает/.test(bldLay(s,def.id)),"без оплаты не закладывается");
  G.credits=100000;G.cargo.alloy=50;G.cargo[main]=60;
  const cr=G.credits,al=G.cargo.alloy;
  ok(bldLay(s,def.id)==="","заложен "+def.ru);
  ok(G.credits===cr-def.cost.credits&&G.cargo.alloy===al-def.cost.alloy,"цена списана: кредиты и сплавы");
  const B=bldEntry(s.key,def.id);
  ok(B&&B.lvl===1&&B.ready>Date.now(),"стоит на ×1, монтаж идёт");
  ok(bldFreeSites(s)===0&&/все площадки заняты|уже стоит/.test(bldLay(s,BLD_KEYS.map(id=>BLD[id]).find(d=>d.fam==="B"&&d.id!==def.id&&!bldWhy(s,d))?BLD_KEYS.map(id=>BLD[id]).find(d=>d.fam==="B"&&d.id!==def.id&&!bldWhy(s,d)).id:def.id)),"вторая на одну площадку не встаёт");
  ok(rungPoints(s.sx,s.sy)>=RUNG_T[11]+2,"постройка сама даёт очки ступени");
  /* до готовности бункер не ест */
  ok(bldWant(s,main)===0,"на монтаже цех ничего не берёт");
  /* готов: кормим продажей; давление двигает только остаток */
  B.ready=Date.now()-HOLD_SHIFT*20;B.t0=Date.now();   /* монтаж давно кончился: смены считаются от t0 */
  const Q=bldQuota(def,1)[main],cap=Q*HOLD_CAP_SHIFTS;
  ok(bldWant(s,main)===cap,"готовый цех берёт три смены нормы ("+cap+")");
  G.cargo[main]=cap+5;
  marketFor(s);G.market[s.key].pressure[main]=0;
  const ateA=appetiteLeft(s,main);
  sellCargo(s,main,cap+5);
  ok((B.my[main]|0)===Math.min(cap,cap+5-ateA)||(B.my[main]|0)===cap,"продажа положила в бункер ("+B.my[main]+" из "+cap+")");
  const rest=cap+5-ateA-(B.my[main]|0);
  ok(Math.abs((G.market[s.key].pressure[main]||0)+rest*.005)<1e-9,"давление вниз — только за то, что не съели ("+rest+")");
  /* смена прошла: съедено Q, начислен выпуск в долю съеденного */
  const out=Object.keys(def.makes)[0],O=bldOut(def,1)[out];
  B.my={};B.my[main]=Q;   /* ровно одна норма главного входа */
  for(const k in def.eats)if(k!==main)B.my[k]=0;
  B.got={};B.t0=Date.now()-HOLD_SHIFT-1;
  bldTick(s.key,def.id);
  const tot=Object.keys(def.eats).reduce((a,k)=>a+def.eats[k],0);
  ok(Math.abs((B.got[out]||0)-O*Q/tot)<1e-9&&(B.my[main]|0)===0,"смена: съедено "+Q+", пай "+(B.got[out]||0).toFixed(2)+" из "+O);
  /* потолок: десять смен полного корма — не больше трёх смен выпуска */
  for(const k in def.eats)B.my[k]=def.eats[k]*10;
  B.got={};B.t0=Date.now()-HOLD_SHIFT*10-1;
  bldTick(s.key,def.id);
  ok(Math.abs(B.got[out]-O*HOLD_CAP_SHIFTS)<1e-9,"пай режется тремя сменами выпуска ("+B.got[out]+")");
  /* забрать в трюм */
  for(const k of RES_KEYS)G.cargo[k]=0;
  const took=bldCollect(s,def.id);
  ok(took===Math.floor(O*HOLD_CAP_SHIFTS)&&G.cargo[out]===took,"пай забран в трюм: "+took);
  /* ДЕЛО и тело станции */
  ok(holdDealList().some(x=>x.nm.indexOf(def.ru)>=0),"ДЕЛО знает о постройке");
  const mods=holdMods(s);
  ok(mods.length===1&&mods[0].sh===BLD_FAM[def.fam].sh,"на станции висит форма семьи: "+mods[0].sh);
  /* сохранение */
  applySave(JSON.parse(JSON.stringify(snapshot())));
  ok(!!bldEntry(s.key,def.id)&&bldEntry(s.key,def.id).lvl===1,"постройка пережила сохранение");
  /* ×2: цена — ещё раз ×1 плюс станочная линия */
  G.credits=100000;G.cargo.alloy=50;G.cargo[main]=60;G.cargo.mline=0;
  ok(/не хватает/.test(bldUpgrade(s,def.id)),"без станочной линии ×2 не поднять");
  G.cargo.mline=1;
  ok(bldUpgrade(s,def.id)===""&&bldEntry(s.key,def.id).lvl===2,"с линией — ×2");
}));
TEST_SUITES.push(()=>suite("холдинг: промысел продаёт со скидкой, цех берёт промышленное",()=>{
  resetWorld();
  const s=siteTestStation();
  if(!s){ok(true,"пропущено");return;}
  siteTestOpen(s);
  const src=bldAvailable(s).ok.find(x=>x.def.fam==="A");
  if(src){
    const def=src.def,k=Object.keys(def.makes)[0],M=def.makes[k];
    G.credits=100000;for(const c in def.cost)if(c!=="credits")G.cargo[c]=def.cost[c];
    ok(bldLay(s,def.id)==="","заложен промысел "+def.ru);
    const B=bldEntry(s.key,def.id);B.ready=Date.now()-HOLD_SHIFT*10-1;B.t0=Date.now()-HOLD_SHIFT*10-1;
    bldTick(s.key,def.id);
    ok(Math.abs(B.got[k]-M*HOLD_CAP_SHIFTS)<1e-9,"запас копится и режется тремя сменами ("+B.got[k]+")");
    const price=srcPrice(s,k),full=TRADE_KEYS.indexOf(k)>=0?marketFor(s)[k]:indPrice(k);
    ok(price<full,"своё — дешевле рынка ("+price+" < "+full+")");
    for(const c of RES_KEYS)G.cargo[c]=0;const cr=G.credits;
    const n=bldBuySrc(s,def.id,k,5);
    ok(n===5&&G.cargo[k]===5&&G.credits===cr-5*price,"взято пять по скидке");
    ok(bldCollect(s,def.id)===0,"промысел не дарит — продаёт");
  }else ok(true,"промысла для этой системы нет — часть пропущена");
  /* цех второго яруса ест промышленное: сдача по теневой цене */
  const H=holdOf(s.key);H.bld={};
  H.bld.bearingshop={lvl:1,t0:Date.now(),ready:Date.now()-1,my:{},got:{}};
  for(const c of RES_KEYS)G.cargo[c]=0;
  G.cargo.roll=30;const cr=G.credits;
  const want=bldWant(s,"roll");
  ok(want===4*HOLD_CAP_SHIFTS,"подшипниковый цех берёт три смены проката ("+want+")");
  const rev=bldSellInd(s,"roll",30);
  ok(rev===want*indPrice("roll")&&G.cargo.roll===30-want&&G.credits===cr+rev,"прокат сдан в цех по теневой цене: +"+rev);
  ok(bldSellInd(s,"roll",5)===0,"бункер полон — больше не берёт");
  const e=holdNearestEater("roll");
  ok(!!e&&e.key===s.key,"ближайший едок проката найден: "+(e?e.name:"нет"));
}));
