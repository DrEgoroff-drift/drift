/* ══ железная дорога: сеть (M470, DESIGN-metro §2) ══
   Сеть — функция зерна. Сторож держит: одна и та же сеть при каждом счёте,
   ни одной линии с двумя остановками в одной системе, густота радиусов
   ровная по кругу, и из любой станции сети можно доехать до любой другой. */
TEST_SUITES.push(()=>suite("рельсы: сеть по зерну, связна и ровна",()=>{
  resetWorld();
  RAIL_NET=null;const A=railNet();
  const sig=N=>N.lines.map(l=>l.id+":"+l.stops.map(s=>s.sx+","+s.sy).join(";")).join("|");
  const s1=sig(A);RAIL_NET=null;eq(sig(railNet()),s1,"одна и та же сеть при каждом счёте");
  const N=railNet();
  let dup=0,stops=0;
  for(const l of N.lines){const k=l.stops.map(s=>s.sx+","+s.sy);stops+=k.length;if(new Set(k).size!==k.length)dup++;}
  eq(dup,0,"ни одна линия не стоит дважды в одной системе");
  ok(stops>150,"остановок в сети: "+stops);
  /* густота радиусов по кругу: 6 → 12 → 24 → 48 */
  const cnt=r=>N.lines.filter(l=>l.kind==="radial"&&RAIL_FORK[l.k]<=r&&r<(RAIL_FORK[l.k+1]||1e9)).length;
  eq(cnt(8),6,"на r 8 — шесть радиусов");eq(cnt(15),12,"на r 15 — двенадцать");eq(cnt(30),24,"на r 30 — двадцать четыре");
  /* связность: станции — вершины, соседние остановки линии — рёбра */
  const adj={};
  for(const l of N.lines){
    const k=l.stops.map(s=>s.sx+","+s.sy);
    for(let i=0;i<k.length;i++){(adj[k[i]]||(adj[k[i]]=new Set()));
      if(i)adj[k[i]].add(k[i-1]),adj[k[i-1]].add(k[i]);}
    if(l.loop&&k.length>2){adj[k[0]].add(k[k.length-1]);adj[k[k.length-1]].add(k[0]);}
  }
  const all=Object.keys(adj),seen=new Set([all[0]]),q=[all[0]];
  while(q.length){const v=q.pop();for(const w of adj[v])if(!seen.has(w)){seen.add(w);q.push(w);}}
  eq(seen.size,all.length,"из любой станции сети можно доехать до любой ("+seen.size+" из "+all.length+")");
  const J=Object.keys(N.at).filter(k=>N.at[k].length>1).length;
  ok(J>=20,"пересадок хватает: "+J);
  ok(N.lines.some(l=>l.stops.some(s=>s.halt)),"за r 40 — полустанки");
  /* станция в системе знает свои линии */
  const k0=Object.keys(N.at)[0].split(",").map(Number),S=railStation(k0[0],k0[1]);
  ok(S&&S.lines.length>=1,"railStation называет линии");
}));
TEST_SUITES.push(()=>suite("рельсы: стыковка, касса, поездка, прибытие",()=>{
  resetWorld();
  const N=railNet();
  const k=Object.keys(N.at).find(k=>{const p=k.split(",").map(Number);return Math.hypot(p[0],p[1])<=12&&getSystem(p[0],p[1]).station;});
  ok(!!k,"станция метро в сердце нашлась");
  const [sx,sy]=k.split(",").map(Number);
  G.sx=sx;G.sy=sy;G.sys=getSystem(sx,sy);G.mode="system";
  const R=railHere();ok(!!R,"у станции есть кольцо");
  /* стыковка: медленно и в конусе — две секунды */
  G.ship.x=R.x+R.ux*40;G.ship.y=R.y+R.uy*40;G.ship.vx=G.ship.vy=0;
  RAIL_DOCK={hold:0,t:0};
  for(let i=0;i<130&&!railWinOpen();i++)railInteract(G.ship);
  ok(railWinOpen(),"две секунды в конусе — ПРИНЯТО, вестибюль открыт");
  /* касса: жетон, поезд, поездка */
  const D=railDestinations();ok(D.length>0,"куда ехать — есть: "+D.length);
  const t=D.find(d=>d.k>=2)||D[0],c0=G.credits;
  railBuy(t);ok(G.credits<c0&&RAIL_WAIT,"билет куплен, поезд ждём");
  for(let i=0;i<60*100&&G.mode==="system";i++)railTick(1);
  eq(G.mode,"rail","поезд пришёл — мы в поезде");
  for(let i=0;i<60*120&&G.mode==="rail";i++)updateRail(1);
  eq(G.mode,"system","конечная — корабль выпущен в систему");
  eq(G.sx+","+G.sy,t.to.sx+","+t.to.sy,"и это система назначения");
  const R2=railHere();ok(R2&&Math.hypot(G.ship.x-R2.x,G.ship.y-R2.y)<120,"корабль у кольца станции назначения");
  railWinClose();
}));
TEST_SUITES.push(()=>suite("названия по хозяину (M489)",()=>{
  resetWorld();
  const seen={};
  for(let sx=-9;sx<=9;sx++)for(let sy=-9;sy<=9;sy++){const by=stampOwnerAt(sx,sy);if(by)seen[by]=ownerName("Горловина",sx,sy);}
  ok(Object.keys(seen).length>=3,"хозяев в сердце несколько: "+Object.values(seen).join(" · "));
  for(const k in seen)ok(seen[k].indexOf("Горловина")>=0&&seen[k]!=="Горловина","«"+seen[k]+"» — топоним с суффиксом");
  ok(/ [А-Я]/.test(firmName(5)),"фирма — город и чужое слово: "+firmName(5));
}));
TEST_SUITES.push(()=>suite("«Чебуречная»: лодка на подъезде кормит и рассказывает (M462)",()=>{
  resetWorld();
  let at=null;
  for(let sx=-8;sx<=8&&!at;sx++)for(let sy=-8;sy<=8&&!at;sy++){
    const sys=getSystem(sx,sy);if(!sys.station)continue;G.sx=sx;G.sy=sy;G.sys=sys;if(chebHere())at={sx,sy};}
  ok(!!at,"лодка есть хотя бы в одной людной системе сердца");
  const C=chebHere();G.ship.x=C.x;G.ship.y=C.y;G.credits=100;
  actEdge=true;const n=G.log.length;chebInteract(G.ship);actEdge=false;
  eq(G.credits,100-CHEB_PRICE,"чебурек за копейки");
  ok(G.log.slice(n).some(l=>/Чебуречная/.test(l.s)),"строка в тетради: еда и слух");
}));
TEST_SUITES.push(()=>suite("закон земли: норма, пошлина, штраф, обед (M456)",()=>{
  resetWorld();
  const find=by=>{for(let sx=-12;sx<=12;sx++)for(let sy=-12;sy<=12;sy++){if(stampOwnerAt(sx,sy)===by&&getSystem(sx,sy).station)return [sx,sy];}return null;};
  const go=p=>{G.sx=p[0];G.sy=p[1];G.sys=getSystem(p[0],p[1]);};
  const co=find("co"),gt=find("gt"),or=find("or"),km=find("km");
  ok(co&&gt&&or&&km,"у каждой из четырёх держав есть станция в сердце");
  go(co);G.credits=100;lawDock();eq(G.credits,60,"Компания: сбор за оформление 40 кр");
  go(gt);lawDock();eq(lawNormTake(50),LAW_NORM,"ГЛАВТРАССА: норма — двадцать единиц");eq(lawNormTake(50),0,"второй раз за стыковку — уже без нормы");
  go(or);const S=G.sys.station;G.ship.x=S.x+100;G.ship.y=S.y;G.ship.vx=9;G.ship.vy=0;G.credits=100;
  lawRingTick(G.ship);eq(G.credits,100-LAW_FINE,"Орднунг: штраф за скорость в кольце");
  lawRingTick(G.ship);eq(G.credits,100-LAW_FINE,"раз за подход, не каждый кадр");
  go(km);const t0=G.t;G.t=Math.floor(G.t/CEL_DAY)*CEL_DAY+CEL_DAY*13.5/24;
  ok(lawLunch(),"Коммуна: в час дня — обед");G.cargo.iron=5;eq(sellCargo(G.sys,"iron",5),0,"приёмка закрыта");
  G.t=t0;G.cargo.iron=0;G.ship.vx=0;
}));
TEST_SUITES.push(()=>suite("новости противоречат друг другу (M491)",()=>{
  resetWorld();DS_Q=[];
  const e=epiAdd("tow","gt",{force:true,who:"Семёныч"});ok(!!e,"поступок при свидетеле");
  const n=G.log.length;dsTick();eq(G.log.length,n,"сразу эфир молчит");
  G.t+=DS_DELAY*60+1;dsTick();
  const L=G.log.slice(n).filter(l=>l.k==="ether").map(l=>l.s);
  eq(L.length,2,"два голоса: "+L.join(" | "));
  ok(/спокойно/.test(L[0]),"Маяк: на трассе спокойно");
  G.episodes=[];G.notebook=[];
}));
TEST_SUITES.push(()=>suite("гостиница: ночь за деньги, ниже трети — даром (M461)",()=>{
  resetWorld();
  let Ht=null;
  for(let sx=-8;sx<=8&&!Ht;sx++)for(let sy=-8;sy<=8&&!Ht;sy++){const s=getSystem(sx,sy);if(!s.station)continue;G.sx=sx;G.sy=sy;G.sys=s;Ht=hotelHere();}
  ok(!!Ht,"у людной станции есть гостиница");
  const hm=stat().hullMax;G.hull=hm*.8;G.credits=100;hotelDesk(Ht);
  eq(G.credits,100-HOTEL_NIGHT,"ночь стоит денег");
  G.hull=hm*.2;G.credits=100;hotelDesk(Ht);
  eq(G.credits,100,"корпус ниже трети — даром, «потом заплатите»");
  ok(G.hull>hm*.2,"и за ночь корпус подтянулся");
}));
TEST_SUITES.push(()=>suite("мирный флот: буксир Рассвета чинит и вас (M455)",()=>{
  resetWorld();
  let at=null;
  for(let sx=-12;sx<=12&&!at;sx++)for(let sy=-12;sy<=12&&!at;sy++)if(stampOwnerAt(sx,sy)==="ra"&&getSystem(sx,sy).station)at=[sx,sy];
  ok(!!at,"в сердце есть станция Рассвета");
  G.sx=at[0];G.sy=at[1];G.sys=getSystem(at[0],at[1]);PEACE_TUG=null;
  const hm=stat().hullMax;G.hull=hm*.3;G.ship.x=G.sys.station.x+300;G.ship.y=G.sys.station.y;G.ship.vx=G.ship.vy=0;
  for(let i=0;i<60*60;i++)peaceTick(G.ship,1);
  ok(G.hull>hm*.3,"буксир дошёл и подварил: "+Math.round(G.hull)+" из "+hm);
  ok(G.hull<=hm*.6+1e-6,"не выше 60 % — это подварка, не верфь");
  G.hull=hm;PEACE_TUG=null;
}));
TEST_SUITES.push(()=>suite("шесть железных дорог: касса Коммуны, декларация Орднунга, экспресс Компании (M474)",()=>{
  resetWorld();
  const N=railNet();
  const find=by=>Object.keys(N.at).map(k=>k.split(",").map(Number)).find(p=>stampOwnerAt(p[0],p[1])===by&&getSystem(p[0],p[1]).station);
  const go=p=>{G.sx=p[0];G.sy=p[1];G.sys=getSystem(p[0],p[1]);RAIL_WAIT=null;RAIL_DECL="";};
  const or=find("or");
  if(or){go(or);const t=railDestinations()[0];G.credits=500;
    railBuy(t);ok(!RAIL_WAIT,"Орднунг: первое нажатие — только декларация");
    railBuy(t);ok(!!RAIL_WAIT,"второе — посадка");}
  const co=find("co");
  if(co){go(co);const t=railDestinations().find(d=>d.k>=2);G.credits=5000;const c0=G.credits;
    railBuy(t,true);ok(RAIL_WAIT&&RAIL_WAIT.express,"экспресс куплен");
    eq(c0-G.credits,railFare(t).fare*RAIL_EXPRESS_MUL+railFare(t).bag,"×10 к цене");}
  ok(!!(or||co),"на сети есть станции Орднунга или Компании");
  RAIL_WAIT=null;RAIL_DECL="";
}));

/* ── M472 хвост: пересадка через узел ── */
TEST_SUITES.push(()=>suite("метро M472: пересадка — билет через узел, поезд меняет линию",()=>{
  resetWorld();G.credits=5000;
  const N=railNet();
  let jk=null;for(const k in N.at)if(N.at[k].length>1){jk=k;break;}
  ok(!!jk,"в сети есть узел");
  /* встаём на соседней с узлом остановке одной из его линий */
  const l=N.byId[N.at[jk][0]],j=l.stops.findIndex(s=>s.sx+","+s.sy===jk);
  const s0=l.stops[j>0?j-1:j+1];
  G.sx=s0.sx;G.sy=s0.sy;G.sys=getSystem(G.sx,G.sy);
  const D=railDestinations(),via=D.filter(t=>t.via);
  ok(via.length>0,"есть билеты с пересадкой: "+via.length);
  const t=via[0];
  ok(N.at[t.via.at.sx+","+t.via.at.sy].length>1,"пересадка на узле");
  ok(t.k===t.via.k1+t.via.k,"остановок — обе ноги");
  ok(railFare(t).fare>=railFare(D[0]).fare||t.dist>=D[0].dist,"цена по всему пути");
  railRideStart(t);
  ok(RAIL_RIDE&&RAIL_RIDE.next&&RAIL_RIDE.next.l===t.via.l,"вторая нога записана");
  const l1=RAIL_RIDE.l;
  let guard=0;while(RAIL_RIDE&&RAIL_RIDE.l===l1&&guard++<5000)updateRail(1);
  ok(RAIL_RIDE&&RAIL_RIDE.l===t.via.l,"на узле поезд стал другой линией");
  ok(!RAIL_RIDE.next,"второй пересадки нет");
  guard=0;while(RAIL_RIDE&&guard++<20000)updateRail(1);
  ok(!RAIL_RIDE,"доехали");
  eq(G.sx+","+G.sy,t.to.sx+","+t.to.sy,"и вышли там, куда брали билет");
}));
