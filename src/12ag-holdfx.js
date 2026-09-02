/* ══════════════ холдинг · эффекты семей E–I ══════════════
   M295, шаг 7 (DESIGN-holding §10 E–I). Двадцать шесть построек, которые не
   едят и не делают груз, а меняют одну вещь в игре каждая. ЗАКОН: строка без
   крючка не отгружается — у каждой ровно один эффект, и читается он через
   одну дверь, bldHas(sx,sy,id). Тест держит, что каждый id спрашивают.

   Крючки стоят в чужих модулях одной строкой каждый (ремонт, топливо, износ,
   дроны, боны, наём, события рейсов, отдых, кадры, наряд, верность, блокада,
   карта, абордаж, засада, небо, техника, летопись, причал, ретранслятор,
   погода) и зовут помощников отсюда. Где замысел просил то, чего в коде нет
   (свои руки при абордаже, следы по системе, часы за стыковку), эффект
   заменён на ближайший честный — см. таблицу в 12ac-bld и замысел. */
function bldHas(sx,sy,id){
  (bldHas.asked||(bldHas.asked={}))[id]=1;
  const B=bldEntry(sx+","+sy,id);
  return !!B&&bldReady(B);
}
/* E1 Накопитель — потолок бункера и пая ×2 (единственный модификатор, F07) */
/* E2 Контора — цены соседей на бумагу «со слуха» при стыковке */
function holdKontoraNotes(sys){
  if(!sys||!bldHas(sys.sx,sys.sy,"kontora")||typeof pricesHeard!=="function")return 0;
  let n=0;
  for(let x=sys.sx-4;x<=sys.sx+4;x++)for(let y=sys.sy-4;y<=sys.sy+4;y++){
    if((x===sys.sx&&y===sys.sy)||!starAt(x,y))continue;
    const S=getSystem(x,y);if(!S||!S.station||!S.station.prices)continue;
    const P=marketFor(S);let best=null;
    for(const k of TRADE_KEYS)if(P[k]&&(!best||P[k]>P[best]))best=k;
    if(best&&pricesHeard(S,best,P[best],S.station.fuelPrice))n++;
  }
  return n;
}
/* E3 Касса — боны без спреда */
function holdScripSpread(){return (G.mode==="dock"&&bldHas(G.sx,G.sy,"kassa"))?0:SCRIP_SPREAD;}
/* E4 Причал — баржа грузится сама из ваших промыслов на этом плече, по 0.7 */
function bargeAutoLoad(c,sys){
  if(!c||!c.barge||!sys||!bldHas(sys.sx,sys.sy,"prichal"))return 0;
  const W=bargeWants(c),H=G.hold&&G.hold[sys.key];
  if(!H||!H.bld)return 0;
  c.cargo=c.cargo||{};
  let room=Math.max(0,crewCargoMax(c)-crewHold(c)),moved=0;
  for(const id in H.bld){
    const def=BLD[id];if(!def||def.fam!=="A")continue;
    bldTick(sys.key,id);
    const B=H.bld[id];
    for(const k in B.got){
      if(!W[k]||room<=0)continue;
      const price=srcPrice(sys,k);
      const n=Math.max(0,Math.min(Math.floor(B.got[k]||0),room,Math.floor(G.credits/price)));
      if(n<=0)continue;
      G.credits-=n*price;B.got[k]-=n;c.cargo[k]=(c.cargo[k]|0)+n;room-=n;moved+=n;
    }
  }
  if(moved)logAdd("dim","Баржа «"+bargeName(c)+"» взяла "+moved+" ед с причала «"+sys.station.name+"»");
  return moved;
}
/* E5 Диспетчерская — с фактором в кресле эфир докладывает о ваших цехах */
function dispatchEtherLine(r){
  const H=G.hold||{};let has=false;
  for(const key in H){const[sx,sy]=key.split(",").map(Number);if(bldHas(sx,sy,"dispatch")){has=true;break;}}
  if(!has)return null;
  const F=typeof mgrOf==="function"?mgrOf("fact"):null;
  if(!F||F.stalled||r()>.3)return null;
  const L=[];
  for(const key in H){
    const b=H[key].bld;if(!b)continue;
    const[sx,sy]=key.split(",").map(Number);const s=getSystem(sx,sy);const nm=s&&s.station?s.station.name:key;
    for(const id in b){const d=BLD[id];if(!d||!Object.keys(d.makes).length||d.fam==="A")continue;
      bldTick(key,id);const B=b[id];
      const my=Object.keys(d.eats).reduce((a,k)=>a+(B.my[k]|0),0);
      const got=Object.keys(B.got).reduce((a,k)=>a+Math.floor(B.got[k]||0),0);
      if(!my)L.push("…диспетчерская: "+d.ru.toLowerCase()+" на «"+nm+"» стоит пустой — бункер кончился.");
      if(got)L.push("…диспетчерская: на «"+nm+"» лежит ваш пай, "+got+" ед. Заберите.");
    }
  }
  return L.length?L[Math.floor(r()*L.length)]:null;
}
/* F1 Ремонтный док · F2 Заправочный узел */
function holdRepairMul(){return (G.st&&bldHas(G.sx,G.sy,"dock"))?.7:1;}
function holdFuelMul(){return (G.st&&bldHas(G.sx,G.sy,"fuelnode"))?.75:1;}
/* F3 Мастерская — в wearFloor · F4 Ангар — в droneBreakP */
/* G1 Дом приезжих · G4 Отдел кадров — по два кандидата сверх */
function holdExtraMercs(sys){return bldHas(sys.sx,sys.sy,"guesthouse")?2:0;}
function holdExtraMgrs(sys){return bldHas(sys.sx,sys.sy,"personnel")?2:0;}
/* G2 Учебный пункт · G7 Столовая — веса событий рейса по системе приказа */
function holdEventWeights(c,w){
  if(!c||!c.order)return;
  if(bldHas(c.order.sx,c.order.sy,"school"))w.good*=1.5;
  if(bldHas(c.order.sx,c.order.sy,"canteen"))w.bad*=.5;
}
/* G3 Медпункт — отдых вдвое быстрее, выкуп на четверть дешевле */
function holdRestMul(c){return (c&&c.order&&bldHas(c.order.sx,c.order.sy,"medpoint"))?2:1;}
function holdRansomMul(c){return (c&&c.order&&bldHas(c.order.sx,c.order.sy,"medpoint"))?.75:1;}
/* G5 Артель — наряд всегда есть и платит на четверть больше */
function holdArtel(sys){return !!sys&&bldHas(sys.sx,sys.sy,"artel");}
/* G6 Красный уголок — верность не падает, пока вы у этого причала */
function holdLoyaltyHold(){return G.mode==="dock"&&bldHas(G.sx,G.sy,"redcorner");}
/* H1 Орудийная батарея — блокада здесь спадает сама, по уровню за проверку */
function holdGunsTick(sx,sy){
  if(!bldHas(sx,sy,"guns"))return false;
  if(typeof occSuppress==="function")occSuppress(sx,sy);
  return true;
}
/* H2 Дозор — очаги пиратов видны в пяти секторах от него */
function lookoutSees(gx,gy){
  const M=lookoutSees;
  if(M.t!==G.t){M.t=G.t;M.L=[];const H=G.hold||{};
    for(const key in H){const[sx,sy]=key.split(",").map(Number);if(bldHas(sx,sy,"lookout"))M.L.push([sx,sy]);}}
  if(!M.L.length)return false;
  if(!M.L.some(p=>Math.max(Math.abs(p[0]-gx),Math.abs(p[1]-gy))<=5))return false;
  return typeof occNest==="function"&&occNest(gx,gy)&&!(typeof occLvl==="function"&&occLvl(gx,gy));
}
/* H3 Дружина — на абордаже в этом секторе гарнизон реже: дружина держит подходы */
function holdRaidThin(){return bldHas(G.sx,G.sy,"druzhina")?1:0;}
/* H4 Заграждение — засада на подходе вдвое реже */
function holdAmbushMul(){return bldHas(G.sx,G.sy,"barrier")?.5:1;}
/* I1 Обсерватория — доклад о небе, поданный здесь, платит вдвое */
function holdSkyMul(){return (G.st&&bldHas(G.sx,G.sy,"observatory"))?2:1;}
/* I2 Филиал — техника здесь на 15% дешевле */
function holdTechMul(){return (G.mode==="dock"&&bldHas(G.sx,G.sy,"branch"))?.85:1;}
/* I3 Архив — летопись системы на доске: все пройденные ступени */
function holdArchiveLines(sys){
  if(!sys||!bldHas(sys.sx,sys.sy,"archive"))return[];
  const r=rungOf(sys.sx,sys.sy),out=[];
  for(let i=1;i<=r;i++)if(RUNGS[i])out.push(RUNGS[i].ru+" — "+RUNGS[i].note);
  return out;
}
/* I4 Личный причал — у этого причала часы износа сходят, пока стоите */
function holdPierHeal(dt){
  if(G.mode!=="dock"||!bldHas(G.sx,G.sy,"ownpier"))return false;
  const W=wearAll(),id=G.shipId;
  if(W[id]>0)W[id]=Math.max(0,W[id]-dt*(WEAR_RATE.system||.001));
  return true;
}
/* I5 Радиомачта — ваша система слышна как ретранслятор */
function holdRelay(sx,sy){
  if(!bldHas(sx,sy,"radiomast"))return null;
  const S=getSystem(sx,sy),K=RELAY_KINDS[0],r=rng(hashi(sx,sy,0x0A57));
  const num=2+Math.floor(r()*97);
  return {key:sx+","+sy,sx,sy,k:K.k,ru:"радиомачта",give:K.give,what:K.what,
          call:"МАЧТА-"+num,name:(G.names&&G.names[sx+","+sy])||S.name,sys:S.name,
          line:"…мачта «"+S.name+"» на связи. Ретранслирую.",own:1};
}
/* I6 Метеостанция — погода на телах известна до посадки */
function holdMeteoLines(sys){
  if(!sys||!bldHas(sys.sx,sys.sy,"meteo")||typeof weatherName!=="function")return[];
  return (sys.planets||[]).filter(p=>p.type!=="gas").map(p=>(p.name||("тело "+(p.idx+1)))+" — "+(weatherName(p)||"ясно"));
}
