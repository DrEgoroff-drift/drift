/* ══ СТАПЕЛЬ — корпус по заказу (M481, DESIGN-shipyard §5) ══
   Сторож: заказ только на верфи державы в её земле; числа — функция заказа
   и живут в коридоре класса; ползунки меняют силуэт; в сейве лежит только
   заказ, корпус после загрузки тот же; старые корпуса ползунков не видят. */
TEST_SUITES.push(()=>suite("стапель: заказ, смена, корпус из заказа",()=>{
  resetWorld();
  let at=null;
  for(let sx=-14;sx<=14&&!at;sx++)for(let sy=-14;sy<=14&&!at;sy++){
    const s=getSystem(sx,sy);
    if(s.station&&s.station.stype==="yard"&&stampOwnerAt(sx,sy))at=[sx,sy];
  }
  ok(!!at,"в круге 14 есть верфь в земле державы");
  if(!at)return;
  G.sx=at[0];G.sy=at[1];G.sys=getSystem(G.sx,G.sy);G.st=G.sys.station;
  const by=stapelYardBy();ok(!!HULL_MAKER[by],"хозяйка земли строит: "+by);
  /* числа — в коридоре класса и от ползунков */
  let out=[];
  for(const cls in HULL_CLASS)for(const size of STAPEL_SIZES)for(const l of STAPEL_L)for(const w of STAPEL_L){
    const N=stapelStats({cls,size,l,w}),P=FLEET_PROFILE[cls];
    for(const k of ["thr","turn","fuel","cargo","hull"])if(N[k]<P[k][0]-.01||N[k]>P[k][1]+.01)out.push(cls+"/"+size+"/"+k);
  }
  eq(out.join(" "),"","числа заказа не выходят из коридора класса");
  const a=stapelStats({cls:"hauler",size:"medium",l:1,w:.85}),b=stapelStats({cls:"hauler",size:"medium",l:1,w:1.15});
  ok(b.cargo>a.cargo&&b.turn<a.turn,"шире — трюм больше, поворот хуже");
  const h=stapelStats({cls:"hauler",size:"heavy",l:1,w:1}),lt=stapelStats({cls:"hauler",size:"light",l:1,w:1});
  ok(h.price>lt.price&&h.hull>lt.hull,"тяжёлый дороже и крепче лёгкого");
  /* ползунок двигает силуэт */
  const pv=o=>{NPC_SHIPS.spT=stapelShip(Object.assign({seed:77,no:0,by},o));delete HULL_CACHE["spT!"+by];return hullOf("spT");};
  const s1=pv({cls:"scout",size:"medium",l:.85,w:1}),s2=pv({cls:"scout",size:"medium",l:1.15,w:1});
  ok(s2.len>s1.len*1.2,"длиннее по ползунку: "+s1.len.toFixed(1)+" → "+s2.len.toFixed(1));
  delete NPC_SHIPS.spT;
  /* заказ: деньги, одна смена, забрать */
  G.credits=1e6;
  ok(stapelOrder({cls:"warship",size:"heavy",l:1.1,w:.9}),"заказ принят");
  ok(!stapelOrder({cls:"scout",size:"light",l:1,w:1}),"второй заказ — только после первого");
  ok(stapelCollect()===null,"до смены не забрать");
  G.stapel.o.ready=now()-1;stapelTick();
  ok(G.stapel.o.told===1,"готово — строка в почте");
  const id=stapelCollect();ok(!!id&&G.owned[id],"забрали: "+id);
  const S0=JSON.stringify(shipData(id)),len0=hullOf(id).len;
  /* сейв: только заказ */
  const snap=snapshot();
  ok(!snap.uniqueShips[id],"в сейве нет выведенного корпуса");
  eq(snap.stapel.done.length,1,"в сейве один заказ");
  delete G.uniqueShips[id];
  applySave(JSON.parse(JSON.stringify(snap)));
  eq(JSON.stringify(shipData(id)),S0,"после загрузки корпус тот же");
  delete HULL_CACHE[id+"!"+by];
  ok(Math.abs(hullOf(id).len-len0)<1e-9,"и силуэт тот же");
  /* старые корпуса ползунков не видят */
  ok(!SHIPS.strizh.hl&&!FLEET.f0.hl,"у каталожных корпусов нет hl/hw");
  G.stapel={};delete G.uniqueShips[id];delete G.owned[id];
}));
TEST_SUITES.push(()=>suite("стапель: шесть верфей — шесть характеров",()=>{
  resetWorld();
  const o=by=>stapelStats({by,cls:"warship",size:"medium",l:1,w:1});
  ok(o("gt").hull>o("hf").hull*1.3,"ГЛАВТРАССА с бронепоясом, Хай-Фронт тоньше: "+o("gt").hull+" / "+o("hf").hull);
  ok(o("co").price<o("or").price,"Компания дешевле: "+o("co").price+" < "+o("or").price);
  ok(o("ra").cargo>o("km").cargo,"Рассвет приварит отсек, у Коммуны клеток меньше");
  const set=new Set(MAKER_KEYS.map(b=>JSON.stringify(o(b))));
  eq(set.size,MAKER_KEYS.length,"у каждой из шести верфей свой корпус из одного заказа");
  for(const b of MAKER_KEYS)ok(!!stapelYard(b).note,"у верфи "+b+" есть строка характера");
}));
TEST_SUITES.push(()=>suite("Космопочта: часы на двери, извещение, 30 суток, добрый клерк",()=>{
  resetWorld();
  let at=null;
  for(let sx=-14;sx<=14&&!at;sx++)for(let sy=-14;sy<=14&&!at;sy++){
    const s=getSystem(sx,sy);if(s.station&&s.station.stype==="yard"&&stampOwnerAt(sx,sy))at=[sx,sy];
  }
  G.sx=at[0];G.sy=at[1];G.sys=getSystem(G.sx,G.sy);G.st=G.sys.station;G.credits=1e6;
  /* часы: открыто меньше половины суток и никогда в обед */
  let open=0,lunch=0;
  for(let i=0;i<240;i++){const t=i*KP_DAY/240;if(kpOpenAt(t,G.sx,G.sy)){open++;if(kpHour(t)===13)lunch++;}}
  ok(open>60&&open<130,"окно открыто часть суток: "+open+"/240");
  eq(lunch,0,"в обед закрыто");
  ok(stapelOrder({cls:"courier",size:"light",l:1,w:1}),"заказ");
  const o=G.stapel.o;o.ready=now()-1;
  /* другая станция, окно открыто */
  let other=null;
  for(let sx=-14;sx<=14&&!other;sx++)for(let sy=-14;sy<=14&&!other;sy++){
    const s=getSystem(sx,sy);if(s.station&&(sx!==at[0]||sy!==at[1]))other=[sx,sy];
  }
  G.sx=other[0];G.sy=other[1];G.sys=getSystem(G.sx,G.sy);G.st=G.sys.station;
  ok(stapelCollect()===null,"без почты чужая станция не выдаёт");
  /* сдвигаем часы так, чтобы окно было закрыто, потом открыто */
  const base=now(),seek=want=>{for(let i=0;i<48;i++){clockSet(base+i*KP_DAY/48);if(kpOpen()===want)return true;}return false;};
  ok(seek(false)&&kpTake()===null,"закрытое окно не выдаёт");
  /* просрочено больше чем на сутки — ушла отправителю */
  const r0=o.ready;o.ready=now()-(KP_KEEP+2)*KP_DAY;seek(true);
  ok(kpTake()===null&&!o.kind,"через 32 суток посылки на почте нет");
  /* опоздали на полсуток — клерк оставляет, раз */
  o.ready=now()-(KP_KEEP+.5)*KP_DAY;
  const id=kpTake();
  ok(!!id&&o.kind===1&&G.owned[id],"«полежит ещё денёк» — и выдали: "+id);
  clockSet(base);G.stapel={};delete G.uniqueShips[id];delete G.owned[id];void r0;
}));
TEST_SUITES.push(()=>suite("корпус помнит: шрамы бьют по числам, верфь чинит",()=>{
  resetWorld();
  const id="uScarT",base=genUniqueShip(4242);base.scars=[];
  G.uniqueShips[id]=base;G.owned[id]=true;G.shipId=id;
  const s0=stat();
  base.scars=["burn","bent","leak"];
  const s1=stat();
  ok(s1.cargoMax<s0.cargoMax,"выгоревшая клетка — трюм меньше: "+s0.cargoMax+" → "+s1.cargoMax);
  ok(s1.turn<s0.turn,"погнутый подвес — поворот хуже");
  ok(Math.abs(scarPriceMul(base)-.64)<1e-9,"три шрама — на 36 % дешевле");
  G.mode="system";G.fuel=100;scarTick();
  ok(G.fuel<100,"течёт бак: "+G.fuel.toFixed(2));
  const r=scarsRoll(7,3);ok(r.length>=1&&r.length<=3&&r.every(k=>SCAR_KIND[k]),"бросок шрамов: "+r.join(","));
  G.credits=1e6;ok(scarFix(id,"burn")&&!scarHas(base,"burn"),"верфь заварила клетку");
  /* шрамы — история: в сейве */
  const snap=snapshot();eq(JSON.stringify(snap.uniqueShips[id].scars),JSON.stringify(["bent","leak"]),"шрамы лежат в сейве");
  G.shipId="strizh";delete G.uniqueShips[id];delete G.owned[id];
}));
TEST_SUITES.push(()=>suite("подписка: 10 % сразу, 4 % за смену, извещение, блокировка, экстренное",()=>{
  resetWorld();
  let at=null;
  for(let sx=-14;sx<=14&&!at;sx++)for(let sy=-14;sy<=14&&!at;sy++)if(getSystem(sx,sy).station&&stampOwnerAt(sx,sy)==="co")at=[sx,sy];
  G.sx=at[0];G.sy=at[1];G.sys=getSystem(G.sx,G.sy);G.st=G.sys.station;
  const id=INSTR_KEYS[0],off={id,u:{w:"sirin",s:77,wear:0}};
  ok(subAllowed(off),"у Компании «Сирин» можно подписать");
  ok(!subAllowed({id,u:{w:"gorn",s:1,wear:0}}),"«Горн» — нет, не фирменный");
  eq(subBreakEven(),23,"владеть выгоднее после 23 смен");
  const price=instrPrice(off.u);G.credits=1e6;
  ok(subBuy(off),"подписали");eq(1e6-G.credits,Math.round(price*.1),"10 % сразу");
  const u=instrKit()[id],q0=instrQuality(id);
  const t0=now();clockSet(u.sub.next+1);G.credits=1e6;subTick();
  eq(1e6-G.credits,subFee(u),"4 % на границе смены");
  G.credits=0;clockSet(u.sub.next+1);subTick();
  ok(u.sub.warn===1&&!u.sub.off,"не хватило — сперва извещение");
  clockSet(u.sub.next+1);subTick();
  ok(u.sub.off===1&&instrQuality(id)<q0*.6,"следующая смена — заблокирован, различает хуже");
  G.credits=1e6;ok(subRush(id)&&!u.sub.off,"экстренное продление ×3 разблокирует");
  for(let i=0;i<5;i++){clockSet(u.sub.next+1);subTick();}
  ok(u.sub.feat>=1,"каждый пятый взнос — «тариф обновлён»");
  clockSet(t0);G.instrKit=null;
}));
TEST_SUITES.push(()=>suite("барахолка: разобранное возвращается втрое, остовы со шрамами",()=>{
  resetWorld();
  let B=null;
  for(let sx=-14;sx<=14&&!B;sx++)for(let sy=-14;sy<=14&&!B;sy++){G.sx=sx;G.sy=sy;G.sys=getSystem(sx,sy);B=bazHere();}
  ok(!!B,"барахолка есть в тихой системе державы с поясом: "+G.sx+":"+G.sy);
  const p=genPart(9191,2);addPart(p);
  const res=scrapPart(p.id);bazThrow(res.part);
  eq(G.thrown.length,1,"разобранное запомнено");
  const L=bazLots(B),t=L.find(x=>x.kind==="thrown");
  ok(!!t&&t.price===Math.round(bazPartBase(p)*3/10)*10,"ваша вещь — втрое: "+(t&&t.price));
  const h=L.filter(x=>x.kind==="hull");
  ok(h.length===2&&h.every(x=>x.ship.scars.length>=1),"два остова, у каждого шрамы");
  G.credits=1e6;const n0=G.inv.length;
  ok(bazBuy(t)&&G.inv.length===n0+1&&!G.thrown.length,"выкупили своё");
  ok(bazBuy(h[0])&&G.owned["bz"+h[0].seed],"остов в ангаре");
  ok(!bazBuy(h[0]),"второй раз тот же остов не продают");
  eq(JSON.stringify(bazLots(B).map(x=>x.k)),JSON.stringify(bazLots(B).map(x=>x.k)),"ряд — функция места и смены");
  const snap=snapshot();ok(Array.isArray(snap.thrown),"разобранное в сейве");
}));
TEST_SUITES.push(()=>suite("особая система корпуса: по классу, перезарядка, эффекты",()=>{
  resetWorld();
  eq(Object.keys(ABIL).sort().join(","),Object.keys(HULL_CLASS).sort().join(","),"у каждого класса своя система");
  G.mode="system";
  /* разведчик: форсаж — тяга ×1.6 на время, потом ровно 1 */
  const sc=Object.keys(FLEET).find(id=>FLEET[id].hcls==="scout");G.owned[sc]=true;G.shipId=sc;
  const t0=stat().thr;
  ok(abilFire(),"ФОРСАЖ включился");
  ok(Math.abs(stat().thr/t0-1.6)<1e-6,"тяга ×1.6");
  ok(!abilFire(),"на перезарядке второй раз нельзя");
  ok(abilReady01()<.1,"обод пуст сразу после");
  G.t+=ABIL.scout.dur*60+1;ok(Math.abs(stat().thr-t0)<1e-9,"через 3 с тяга прежняя");
  G.t+=ABIL.scout.cd*60;ok(abilReady01()===1,"перезарядка кончилась");
  /* курьер: сброс — клетка трюма за борт, пираты рядом теряют вас */
  const co=Object.keys(FLEET).find(id=>FLEET[id].hcls==="courier");G.owned[co]=true;G.shipId=co;
  G.cargo.iron=20;G.pirates=[{x:G.ship.x+100,y:G.ship.y,hull:50,jamT:0}];
  ok(abilFire()&&G.cargo.iron<20&&G.pirates[0].jamT>=4,"СБРОС: груз ушёл, пират потерял вас");
  /* буровик: резак бьёт в нос */
  G.t+=3600;const mi=Object.keys(FLEET).find(id=>FLEET[id].hcls==="miner");G.owned[mi]=true;G.shipId=mi;
  G.ship.a=0;G.pirates=[{x:G.ship.x+100,y:G.ship.y,hull:50}];
  ok(abilFire()&&G.pirates[0].hull===20,"РЕЗАК: 30 по корпусу в носу");
  G.pirates=[];G.shipId="strizh";
}));
TEST_SUITES.push(()=>suite("ядро в аренду: тариф, без дрейфа, понижение с извинением, реклама",()=>{
  resetWorld();
  G.mgrs=[];
  const role=MGR_ROLE_KEYS[0];
  ok(rentAi(role,"prem"),"арендовали ПРЕМИУМ");
  const m=G.mgrs[0];
  eq(mgrPay(m),6,"6 кр/мин по тарифу");
  aiDrift(m,100,500);eq(m.drift,0,"арендное не дрейфует");
  rentShort(m);eq(m.rent.tier,"base","не заплатили — понизилось до БАЗОВОГО");
  ok(m.log.some(x=>/извинения/.test(x.s)),"и извинилось");
  eq(mgrPay(m),0,"БАЗОВЫЙ — даром");
  for(let i=0;i<3;i++)rentSay(m);
  ok(m.log.some(x=>/^Реклама/.test(x.s)),"в третьей сводке реклама");
  G.bases=[{fire:{c:0,r:0}}];m.rent.n=2;rentSay(m);
  ok(m.log[0].s.indexOf("горит база")>=0,"база горит — рекламу пропустили");
  const snap=snapshot();eq(snap.mgrs[0].rent.tier,"base","тариф в сейве");
  ok(!rentAi(MGR_ROLE_KEYS[0],"base"),"домен занят — второе на то же место нельзя");
  G.mgrs=[];G.bases=null;
}));
TEST_SUITES.push(()=>suite("ПРИЁМНИКИ: с карты НАЗАД — на ту же бумагу",()=>{
  resetWorld();
  let opened=null;const tt=tableToggle,sel0=G.sel,co0=G.course,mv0=G.mapView;tableToggle=(o,t)=>{opened=t||null;};
  G.mode="system";G.mapBackTable="relay";gotoSector(G.sx+2,G.sy,"проба");
  eq(G.mode,"map","тычок по строке — карта");
  navAction();
  eq(G.mode,"system","НАЗАД — из карты");
  eq(opened,"relay","и снова ПРИЁМНИКИ");
  ok(G.mapBackTable==null,"возврат одноразовый");
  tableToggle=tt;G.course=co0;G.sel=sel0;G.mapView=mv0;
}));
TEST_SUITES.push(()=>suite("жизнь дороги: посылка, проездной, попутчик, чай, пломба (M499–M508)",()=>{
  resetWorld();
  const N=railNet();
  const keys=Object.keys(N.at).filter(k=>{const p=k.split(",").map(Number);return getSystem(p[0],p[1]).station&&(stampOwnerAt(p[0],p[1])==="gt"||!stampOwnerAt(p[0],p[1]));});
  ok(keys.length>0,"станция ГЛАВТРАССЫ на линии есть");
  const [sx,sy]=keys[0].split(",").map(Number);
  G.sx=sx;G.sy=sy;G.sys=getSystem(sx,sy);G.mode="system";G.credits=1e5;
  /* проездной: цена = 12 средних билетов, поездки дальше — даром, отметка в книжке */
  const pp=railPassPrice();ok(pp>0,"проездной продают: "+pp+" кр");
  ok(railPassBuy()&&railPassOn(),"купили");
  const D=railDestinations(),far=D.find(t=>!railFare(t).metro)||null;
  if(far)eq(railFare(far).fare,0,"по проездному билет не платится");
  /* посылка: ищем смену, в которую она предложена */
  let o=null,base=now();
  for(let i=0;i<30&&!o;i++){clockSet(base+i*HOLD_SHIFT);o=railParcelOffer();}
  ok(!!o,"Космопочта просит довезти посылку");
  ok(railParcelTake()&&G.railParcel,"взяли посылку");
  const c0=G.credits;railLifeExit({sx:G.railParcel.sx,sy:G.railParcel.sy});
  ok(!G.railParcel&&G.credits===c0+o.pay,"выход на её остановке — сдана, +"+o.pay);
  /* попутчик платит за себя */
  RAIL_LIFE.pax={who:"дед с ведром",talk:"…"};const t=D[0],c1=G.credits;
  railLifeBoard(t,railFare(t));ok(G.credits>c1,"попутчик заплатил за билет");
  /* чай на 3+ остановках электрички */
  const t3=D.find(x=>x.k>=3&&!railFare(x).metro);
  if(t3){railLifeBoard(t3,railFare(t3));ok(RAIL_LIFE.tea,"в дальней электричке будет чай");}
  railLifeExit({sx:9999,sy:9999});ok(RAIL_LIFE.pax===null,"попутчик сошёл");
  /* пломба: продать нельзя до выхода */
  G.railSeal=1;G.cargo.iron=5;
  eq(sellCargo(G.sys,"iron",1)|0,0,"опломбированный трюм не продаётся");
  railLifeExit({sx:9999,sy:9999});eq(G.railSeal,0,"пломба снята на выходе");
  clockSet(base);RAIL_LIFE={pax:null,tea:false,teaDone:false};
}));
TEST_SUITES.push(()=>suite("госзаказ на щите: план, твёрдая цена, УДАРНИК (M503)",()=>{
  resetWorld();
  let P=null;
  for(let sx=-12;sx<=12&&!P;sx++)for(let sy=-12;sy<=12&&!P;sy++){const s=getSystem(sx,sy);if(!s.station)continue;G.sx=sx;G.sy=sy;G.sys=s;G.st=s.station;P=gosPlan();}
  ok(!!P,"у людной станции ГЛАВТРАССЫ есть план: "+(P&&P.k+" ×"+P.n));
  ok(/^ПЛАН: /.test(gosBbLine()),"щит пишет план");
  G.cargo[P.k]=P.n-1;ok(!gosDeliver(),"не хватает — не сдать");
  G.cargo[P.k]=P.n;const c0=G.credits,u0=(recordAll().udar|0);
  ok(gosDeliver(),"сдали");
  eq(G.credits-c0,P.n*P.price,"по твёрдой цене");
  eq(recordAll().udar|0,u0+1,"в КНИЖКЕ — УДАРНИК");
  ok(gosPlan().done&&gosBbLine()===null,"по этой сводке план закрыт");
}));
TEST_SUITES.push(()=>suite("дипломатический паспорт: семь отметок, дорога даром (M505)",()=>{
  resetWorld();
  const R=stampBook();
  for(const k of PASSPORT_KEYS.slice(0,6))R.st[k]={d:1,t:1,sx:0,sy:0,v:1};
  ok(!passportDue(),"без Ялты — нет");
  R.st.yalta={d:1,t:1,sx:0,sy:0,v:1};
  ok(passportDue()&&passportIssue()&&passportOn(),"семь отметок — паспорт выдан");
  ok(!passportIssue(),"второй раз не выдают");
  const F=railPassFare({fare:30,bag:2,sum:32,metro:true});
  eq(F.fare,0,"по паспорту — даром, даже метро");
}));
TEST_SUITES.push(()=>suite("отзыв партии: извещение, деталь слабее, замена у Хай-Фронта (M509)",()=>{
  resetWorld();
  /* ищем деталь Хай-Фронта, которая попадёт под отзыв в эту неделю */
  let p=null;const b=recallBucket();
  for(let s=1;s<400&&!p;s++){const q=genPart(s*7919,3,"engine",0,null,"hf");if(hashi(q.seed>>>0,b,0x2EC1)%6===0)p=q;}
  ok(!!p,"деталь под отзыв нашлась");
  addPart(p);
  const slot=slotsOf(G.shipId).indexOf("engine");if(slot>=0)fitPart(slot,p.id);
  const b0=Object.assign({},partBonus());
  G.recallB=undefined;recallTick();
  ok(recalled(p),"партия отозвана");
  const k=Object.keys(p.bonus).find(x=>x!=="gun"&&x!=="msl"&&p.bonus[x]);
  if(slot>=0&&k)ok(Math.abs(partBonus()[k]-b0[k]*RECALL_MUL)<1e-6||Math.abs(partBonus()[k])<Math.abs(b0[k]),"оставленная работает хуже");
  ok(!recallReplace(p),"не у Хай-Фронта — не заменить");
  let at=null;for(let sx=-14;sx<=14&&!at;sx++)for(let sy=-14;sy<=14&&!at;sy++)if(stampOwnerAt(sx,sy)==="hf")at=[sx,sy];
  G.sx=at[0];G.sy=at[1];
  const id=p.id;ok(recallReplace(p)&&!recalled(p)&&p.id===id,"у Хай-Фронта — замена даром, на то же место");
}));
TEST_SUITES.push(()=>suite("постановка на учёт: транзит, доброта, утильсбор, очередь, штраф (M513)",()=>{
  resetWorld();
  const flag=playerFlag();
  let home=null,abroad=null;
  for(let sx=-14;sx<=14;sx++)for(let sy=-14;sy<=14;sy++){const o=stampOwnerAt(sx,sy);if(o===flag&&!home)home=[sx,sy];if(o&&o!==flag&&!abroad)abroad=[sx,sy];}
  ok(home&&abroad,"есть своя земля и чужая");
  const id="uRegT";G.uniqueShips[id]=genUniqueShip(5151);G.owned[id]=true;G.shipId=id;
  eq(regBought(id,flag),null,"в своей земле — без транзита");
  ok(!!regBought(id,stampOwnerAt(abroad[0],abroad[1])),"в чужой — транзитные номера");
  const go=a=>{G.sx=a[0];G.sy=a[1];G.sys=getSystem(a[0],a[1]);return regArrive();};
  eq(go(abroad),null,"в чужой земле пикет не свой");
  eq(go(home),"wave","первый раз — «до понедельника»");
  G.credits=1e5;const c0=G.credits;
  eq(go(home),"queued","второй — утильсбор и очередь");
  eq(c0-G.credits,regFee(id),"утильсбор по массе: "+regFee(id));
  const r=regOf(id),base=now();r.until=base+1000;clockSet(base+2000);
  eq(go(home),"fine","транзит истёк раньше очереди — штраф");
  clockSet(r.q+1);eq(go(home),"done","очередь дошла — номера");
  ok(!regPending(id),"на учёте");
  clockSet(base);G.shipId="strizh";delete G.uniqueShips[id];delete G.owned[id];
}));
TEST_SUITES.push(()=>suite("ажиотаж: ЖИЛА — дополнительный поезд и дорогое топливо (M504)",()=>{
  resetWorld();
  const sx=3,sy=2,I0=railInterval(sx,sy);
  rushStart(sx,sy);
  ok(railInterval(sx,sy)<I0,"интервал короче: "+I0+" → "+railInterval(sx,sy));
  G.sx=sx;G.sy=sy;G.sys=getSystem(sx,sy);G.st={fuelPrice:10};
  eq(rushFuelMul(),1.33,"топливо на треть дороже");
  const base=now();clockSet(base+RUSH_SHIFTS*HOLD_SHIFT+1);
  eq(railInterval(sx,sy),I0,"через две смены — как было");
  clockSet(base);G.st=null;
}));
TEST_SUITES.push(()=>suite("ДЕЛО: взятая работа с именем и сроком, «успеваете скорым» (M507)",()=>{
  resetWorld();
  const N=railNet(),k=Object.keys(N.at).find(k=>{const p=k.split(",").map(Number);return getSystem(p[0],p[1]).station;});
  const [sx,sy]=k.split(",").map(Number);G.sx=sx;G.sy=sy;G.sys=getSystem(sx,sy);
  const t=railDestinations()[0];
  const line=railCatch(t.to.sx,t.to.sy,999);
  ok(/^успеваете электричкой/.test(line),"до места работы идёт поезд: "+line);
  ok(/^не успеваете/.test(railCatch(t.to.sx,t.to.sy,0)),"срок вышел — не успеваете");
  eq(railCatch(9999,9999,10),null,"туда поезда нет — молчит");
  /* строки ДЕЛА: у взятой работы есть имя и минуты (раньше — undefined) */
  const rows=offerCarriedRows();ok(Array.isArray(rows),"строки ДЕЛА собираются");
  ok(typeof offerCarried==="function"&&offerCarried()!==rows,"доска и ДЕЛО — разные функции");
}));
TEST_SUITES.push(()=>suite("кнопки масштаба снова масштабируют (zoomStep был перекрыт)",()=>{
  resetWorld();
  G.mode="system";G.zoomT=null;setZoom(2);const z0=G.zoom;
  zoomStep(1.35);ok(Math.abs((G.zoomT||G.zoom)/z0-1.35)<.02||G.zoom>z0,"«+» увеличивает: "+z0+" → "+(G.zoomT||G.zoom));
  eq(typeof zoomEase,"function","плавный щипок — своя функция");
}));
TEST_SUITES.push(()=>suite("компенсационная маршрутка: медленнее, без декларации (M510)",()=>{
  resetWorld();
  const N=railNet(),k=Object.keys(N.at).find(k=>{const p=k.split(",").map(Number);return getSystem(p[0],p[1]).station;});
  const [sx,sy]=k.split(",").map(Number);G.sx=sx;G.sy=sy;G.sys=getSystem(sx,sy);G.mode="system";G.credits=1e4;
  const t=railDestinations()[0];
  railBuy(t,false,true);ok(RAIL_WAIT&&RAIL_WAIT.bus,"маршрутка взята");
  const d0=railSegDur(t.l,[t.i0,t.i0+t.dir],0);
  railRideStart(RAIL_WAIT);RAIL_WAIT=null;
  ok(Math.abs(RAIL_RIDE.dur/railSegDur(RAIL_RIDE.l,RAIL_RIDE.seq,0)-1.6)<1e-6,"перегон в 1.6 раза дольше");
  RAIL_RIDE=null;G.mode="system";void d0;
}));
TEST_SUITES.push(()=>suite("общества: вступают делом, взнос строкой, льгота работает, выйти даром (M512)",()=>{
  resetWorld();
  ok(!socCanJoin("union"),"без ста прыжков в профсоюз не берут");
  socAll().c.jumps=100;ok(socJoin("union"),"сто прыжков — вступили");
  const c0=G.credits;earn(1000,"test");
  eq(G.credits-c0,980,"взнос 2 % вычтен");
  eq(socAll().m.union.dues,20,"и записан строкой");
  ok(socLeave("union")&&!socIn("union"),"выйти даром");
  G.credits=100;ok(!socJoin("union"),"вернуться без денег — нельзя");
  G.credits=1000;ok(socJoin("union")&&G.credits===1000-SOC_REJOIN,"вернуться — за деньги");
  socAll().c.tapes=10;ok(socJoin("kulib"),"кулибины — за десять изолент");
  G.tapeRoll=1;G.hull=1;tapeUse();eq(G.hull,Math.ceil(stat().hullMax*.6),"изолента кулибина держит 60 %");
  ok(socJoin("partner"),"в партнёрскую программу — каждый");
}));
