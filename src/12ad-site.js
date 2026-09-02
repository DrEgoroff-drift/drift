/* ══════════════ холдинг · площадка, бункер и пай ══════════════
   M291, шаг 3 (DESIGN-holding §3, §6, §10). Замысел автора одной фразой: «не по
   рецептам, а если ты возишь, то тебе производят».

   СТУПЕНЬ системы — функция от того, что игрок здесь сделал (rungPoints): посадки,
   шахты, ячейки базы, отбитый сектор, имя, посёлок, дроны, груз, постройки.
   Ничего нового не хранится, кроме трёх счётчиков дел (G.hold[key].deeds), у
   которых раньше не было своей записи. Ступень производная, G.step нет.
   Имена ступеней и моменты в эфире — шаг 4; здесь только число и ворота.

   БУНКЕР. Постройка ест норму Q в смену, что не привёз игрок — довозит мир.
   Хранится только своё: bld[id] = {lvl, t0, ready, my{k}, got{k}}. При чтении
   постройка догоняет по сменам: съедает min(my, Q) вашего, начисляет выпуск в
   долю съеденного, my тает, got режется тремя сменами выпуска, my — тремя
   сменами нормы. «Чужой корм» — число, не флот; «доля тает» — бункер пустеет.
   Кормить = продать на этой станции (sellCargo → bldFeed). Промышленный товар
   рынок не берёт — его сдают в цех по теневой цене (bldSellInd).

   ДОБЫЧА (семья A) не ест: делает M в смену в запас, режется тремя сменами,
   продаёт вам по 0.7 местной цены — доля источника и есть скидка. */
const HOLD_CAP_SHIFTS=3;     /* потолок бункера и пая, в сменах; Накопитель (семья E) удвоит */
const SRC_DISCOUNT=.7;
const RUNG_T=[0,1,2,3,5,7,9,11,13,15,18,21,24,27,30,34,38,42,46,50,55,60,65,70,75,81,87,93,99,105,112];
/* ── дела, у которых не было записи: залежь пробурена, дрон выработал точку, груз привезён ── */
function holdDeed(sx,sy,kind,n){
  if(sx===undefined||sy===undefined)return;
  const H=holdOf(sx+","+sy);H.deeds=H.deeds||{};
  H.deeds[kind]=Math.max(0,(H.deeds[kind]|0)+(n===undefined?1:n|0));
}
/* стыковка: груз, с которым пристыковались сами (баржа не в счёт — F12) */
function holdDock(sys){
  if(!sys||!sys.station)return;
  const n=held();if(n>0)holdDeed(sys.sx,sys.sy,"cargo",n);
  const H=G.hold&&G.hold[sys.key];
  if(H&&H.bld)for(const id in H.bld)bldTick(sys.key,id);
  if(typeof holdKontoraNotes==="function")holdKontoraNotes(sys);   /* Контора (E2): цены соседей на бумагу */
  /* лестница (M292): момент о том, что здесь теперь стоит; ★10 — у причала латают */
  if(typeof rungMoments==="function")rungMoments(sys);
  if(typeof rungHas==="function"&&rungHas(sys.sx,sys.sy,"cycle")){
    const mx=stat().hullMax,add=Math.round(mx*.1);
    if(G.hull<mx&&add>0){G.hull=Math.min(mx,G.hull+add);logAdd("dim","«"+sys.station.name+"», замкнутый цикл: корпус подлатали по-свойски · +"+add);}
  }
}
/* ── очки и ступень (§6) ── */
function rungPoints(sx,sy){
  const key=sx+","+sy;let p=0;
  const P=G.place||{};
  const rec=P[key];if(rec)p+=Math.min(4,rec.n|0);                       /* заходы */
  let lands=0;for(const k in P)if(k.indexOf(key+"/")===0)lands+=Math.min(2,P[k].n|0);
  p+=Math.min(4,lands);                                                  /* посадки на тела */
  let shafts=0;for(const k in (G.mines||{}))if(k.indexOf(key+":")===0)shafts++;
  p+=Math.min(2,shafts)*2;                                               /* шахты */
  let cells=0;for(const k in (G.bases||{}))if(k.indexOf(key+":")===0)cells+=((G.bases[k].cells||[]).length|0);
  p+=Math.min(8,cells);                                                  /* ячейки базы */
  if(G.occCalm&&G.occCalm[key])p+=3;                                     /* сектор отбит */
  if(G.names&&G.names[key])p+=2;                                         /* имя */
  const S=G.settle&&G.settle[key];if(S)p+=Math.min(6,(S.stage|0)*2);     /* посёлок */
  const rep=G.rep&&G.rep[key];if(rep>0)p+=Math.min(3,rep|0);             /* репутация */
  if(G.home&&G.home.sx===sx&&G.home.sy===sy)p+=3;                        /* дом */
  const H=G.hold&&G.hold[key];
  if(H&&H.deeds){
    p+=Math.min(6,H.deeds.drone|0);                                      /* дроны, выработавшие точку */
    p+=Math.min(4,H.deeds.drill|0);                                      /* пробуренные залежи */
    p+=Math.min(6,Math.floor((H.deeds.cargo|0)/50));                     /* привезённый груз, по 50 */
  }
  if(H&&H.bld){let lv=0;for(const id in H.bld)lv+=H.bld[id].lvl|0;p+=Math.min(24,lv*2);}
  return p;
}
function rungOf(sx,sy){
  const p=rungPoints(sx,sy);let r=0;
  for(let i=1;i<=30;i++)if(p>=RUNG_T[i])r=i;
  /* ворота: ступень зовётся тем, что здесь стоит */
  const key=sx+","+sy,P=G.place||{};
  const landed=Object.keys(P).some(k=>k.indexOf(key+"/")===0);
  if(!landed)r=Math.min(r,5);
  const H=G.hold&&G.hold[key],D=(H&&H.deeds)||{};
  const droneHere=(G.drones||[]).some(d=>d.sx===sx&&d.sy===sy)||(D.drone|0)>0;
  if(!((D.drill|0)>0&&droneHere))r=Math.min(r,10);
  const nb=H&&H.bld?Object.keys(H.bld).length:0;
  if(nb<1)r=Math.min(r,15);
  if(nb<3)r=Math.min(r,20);
  return r;
}
/* чего не хватает до площадки — словами игрока, не числом */
function rungGateTxt(sx,sy){
  const key=sx+","+sy,P=G.place||{},H=G.hold&&G.hold[key],D=(H&&H.deeds)||{};
  const L=[];
  if(!Object.keys(P).some(k=>k.indexOf(key+"/")===0))L.push("сесть на планету");
  if(!((D.drill|0)>0))L.push("пробурить залежь");
  if(!((G.drones||[]).some(d=>d.sx===sx&&d.sy===sy)||(D.drone|0)>0))L.push("оставить дрона");
  return L;
}
/* обращение у стойки по ступени (§8.1) */
function rungAddress(r,sx,sy){
  if(r>=30&&(sx===undefined||(typeof rungHas!=="function")||rungHas(sx,sy,"ring"))){const nm=G.names&&G.names[sx+","+sy];return nm?"с «"+nm+"»":"по имени";}
  return r>=25?"начальник трассы":r>=20?"начальник узла":r>=15?"начальник участка":r>=11?"монтажник":r>=5?"наблюдатель":"никак";
}
function bldSites(r){return r>=20?3:(r>=15?2:(r>=11?1:0));}
/* через ★ (M292): площадка — 11, вторая — 15, третья — 20; ярусы — 20 и 25, стапель — 22 */
function bldSitesAt(sx,sy){
  if(!rungHas(sx,sy,"site"))return 0;
  return rungHas(sx,sy,"hub")?3:(rungHas(sx,sy,"site2")?2:1);
}
function bldTierOpenAt(sx,sy,def){
  if(def.fam==="D")return rungHas(sx,sy,def.id==="slipway"?"slipway":"lines");
  if(def.fam==="C")return rungHas(sx,sy,"hub");
  return rungHas(sx,sy,"site");
}
function bldTierPlanTxt(def){
  const i=rungIndex(def.fam==="D"?(def.id==="slipway"?"slipway":"lines"):(def.fam==="C"?"hub":"site"));
  return rungRoman(rungPlanOf(i))+" пятилетке";
}
/* ── где можно ставить: тела системы и правило §10.1 ── */
function sysHasFauna(sys){
  const P=sys.planets||[];
  return P.some(p=>p.fauna||p.life||p.beasts)||P.some(p=>["terran","jungle","ocean","toxic"].indexOf(p.type)>=0);
}
function bldAtWhy(sys,def){
  const rule=def.at,P=sys.planets||[],types=P.map(p=>p.type);
  if(rule==="any")return"";
  if(rule.indexOf("solid:")===0){const k=rule.slice(6);
    return P.some(p=>p.type!=="gas"&&(PROFILE[p.type]||[]).indexOf(k)>=0)?"":"нужен твёрдый мир с "+RES[k].ru.toLowerCase();}
  if(rule.indexOf("world:")===0){const L=rule.slice(6).split(",");
    return types.some(t=>L.indexOf(t)>=0)?"":"нужен мир: "+L.map(t=>TYPES[t]?TYPES[t].ru:t).join(" / ");}
  if(rule.indexOf("stype:")===0){const L=rule.slice(6).split(",");
    return (sys.station&&L.indexOf(sys.station.stype)>=0)?"":"нужна станция: "+L.map(t=>stTypeOf(t).ru.toLowerCase()).join(" / ");}
  if(rule==="belt")return sys.belt?"":"в системе нет пояса";
  if(rule==="gas")return types.indexOf("gas")>=0?"":"в системе нет газового гиганта";
  if(rule==="fauna")return sysHasFauna(sys)?"":"в системе нет фауны";
  if(rule==="mine")return Object.keys(G.mines||{}).some(k=>k.indexOf(sys.key+":")===0)?"":"здесь ещё не копали шахту";
  return"";
}
/* что система делает сама: профиль её планет и выпуск её построек */
function sysMakes(sys){
  const out={};
  for(const p of (sys.planets||[]))if(p.type!=="gas")for(const k of (PROFILE[p.type]||[]))out[k]=1;
  const H=G.hold&&G.hold[sys.key];
  if(H&&H.bld)for(const id in H.bld){const d=BLD[id];if(d)for(const k in d.makes)out[k]=1;}
  return out;
}
function bldRuleWhy(sys,def){
  if(rungOf(sys.sx,sys.sy)>=29)return"";   /* Полдень: система кормит себя сама */
  const M=sysMakes(sys);
  const bad=Object.keys(def.eats).filter(k=>M[k]);
  return bad.length?"здесь это и так делают: "+bad.map(k=>RES[k].ru.toLowerCase()).join(", "):"";
}
function bldWhy(sys,def){
  if(!rungHas(sys.sx,sys.sy,"site"))return"площадка ещё не открыта";
  if(!bldTierOpenAt(sys.sx,sys.sy,def))return"ярус откроется в "+bldTierPlanTxt(def);
  const H=G.hold&&G.hold[sys.key];
  if(H&&H.bld&&H.bld[def.id])return"уже стоит";
  const a=bldAtWhy(sys,def);if(a)return a;
  return bldRuleWhy(sys,def);
}
function bldBuiltHere(sys){const H=G.hold&&G.hold[sys.key];return H&&H.bld?Object.keys(H.bld):[];}
function bldFreeSites(sys){return Math.max(0,bldSitesAt(sys.sx,sys.sy)-bldBuiltHere(sys).length);}
/* список: что можно заложить здесь сейчас, и что нельзя — с причиной */
function bldAvailable(sys){
  const ok=[],no=[];
  for(const id of BLD_KEYS){const def=BLD[id],why=bldWhy(sys,def);(why?no:ok).push({def,why});}
  return{ok,no};
}
/* ── оплата ── */
function bldCanPay(cost){
  if((cost.credits|0)>G.credits)return false;
  for(const k in cost)if(k!=="credits"&&(G.cargo[k]|0)<cost[k])return false;
  return true;
}
function bldLack(cost){
  const L=[];
  if((cost.credits|0)>G.credits)L.push("кр "+Math.round(cost.credits-G.credits));
  for(const k in cost)if(k!=="credits"&&(G.cargo[k]|0)<cost[k])L.push(RES[k].ru.toLowerCase()+" "+(cost[k]-(G.cargo[k]|0)));
  return L;
}
function bldPay(cost){
  G.credits-=cost.credits|0;
  for(const k in cost)if(k!=="credits")G.cargo[k]-=cost[k];
}
/* ── заложить, поднять уровень ── */
function bldLay(sys,id){
  const def=BLD[id];if(!def||!sys||!sys.station)return"";
  const why=bldWhy(sys,def);if(why)return why;
  if(bldFreeSites(sys)<=0)return"все площадки заняты";
  if(!bldCanPay(def.cost))return"не хватает: "+bldLack(def.cost).join(", ");
  bldPay(def.cost);
  const H=holdOf(sys.key);H.bld=H.bld||{};
  const now=Date.now();
  H.bld[id]={lvl:1,t0:now,ready:now+BLD_SHIFTS[def.tier]*HOLD_SHIFT,my:{},got:{}};
  if(typeof recordAdd==="function")recordAdd(sys.station.name,"заложен: "+def.ru);
  if(typeof holdNews==="function")holdNews(sys,def,"laid");   /* новость с причиной (M297) */
  return"";
}
function bldUpgrade(sys,id){
  const def=BLD[id],B=bldEntry(sys.key,id);
  if(!def||!B)return"нечего поднимать";
  if(B.lvl>=3)return"выше ×3 не бывает";
  if(Date.now()<(B.ready||0))return"сперва достроить";
  const cost=bldUpgradeCost(def,B.lvl+1);
  if(!bldCanPay(cost))return"не хватает: "+bldLack(cost).join(", ");
  bldPay(cost);
  bldTick(sys.key,id);
  B.lvl++;B.ready=Date.now()+BLD_SHIFTS[def.tier]*HOLD_SHIFT;
  if(typeof holdNews==="function")holdNews(sys,def,"up");
  return"";
}
function bldEntry(key,id){const H=G.hold&&G.hold[key];return H&&H.bld?H.bld[id]||null:null;}
function bldReady(B,now){return !!B&&(now||Date.now())>=(B.ready||0);}
function holdCapMul(key){const[sx,sy]=String(key).split(",").map(Number);return (typeof bldHas==="function"&&bldHas(sx,sy,"nakop"))?2:1;}   /* Накопитель (E1) */
/* ── бункер: догнать по сменам ── */
function bldTick(key,id,now){
  const B=bldEntry(key,id),def=BLD[id];
  if(!B||!def)return;
  now=now||Date.now();
  B.my=B.my||{};B.got=B.got||{};
  if(now<(B.ready||0))return;
  if(!Object.keys(def.makes).length){B.t0=now;return;}   /* семьи E–I ничего не копят */
  const t0=Math.max(B.t0||now,B.ready||0);
  let s=Math.floor((now-t0)/HOLD_SHIFT);
  if(s<=0)return;
  s=Math.min(s,72);
  const cap=HOLD_CAP_SHIFTS*holdCapMul(key);
  if(def.fam==="A"){
    /* добыча: запас растёт, режется тремя сменами */
    const O=bldOut(def,B.lvl);
    for(const k in O)B.got[k]=Math.min(O[k]*cap,(B.got[k]||0)+O[k]*s);
  }else{
    const Q=bldQuota(def,B.lvl),O=bldOut(def,B.lvl);
    let tot=0;for(const k in Q)tot+=Q[k];
    for(let i=0;i<s;i++){
      let ate=0;
      for(const k in Q){const e=Math.min(B.my[k]|0,Q[k]);B.my[k]=(B.my[k]|0)-e;ate+=e;}
      if(ate<=0)break;   /* бункер пуст — дальше смены ничьи */
      const sh=ate/tot;
      for(const k in O)B.got[k]=Math.min(O[k]*cap,(B.got[k]||0)+O[k]*sh);
    }
  }
  B.t0=t0+s*HOLD_SHIFT;
}
/* сколько бункеры здесь возьмут товара k прямо сейчас */
function bldWant(sys,k){
  const ids=bldBuiltHere(sys);let want=0;const now=Date.now();
  for(const id of ids){
    const def=BLD[id],B=bldEntry(sys.key,id);
    if(!def||!def.eats[k]||!bldReady(B,now))continue;
    bldTick(sys.key,id,now);
    const Q=bldQuota(def,B.lvl)[k];
    want+=Math.max(0,Q*HOLD_CAP_SHIFTS*holdCapMul(sys.key)-(B.my[k]|0));
  }
  return want;
}
/* положить в бункеры: возвращает, сколько взяли */
function bldFeed(sys,k,qty){
  if(!sys||qty<=0)return 0;
  const ids=bldBuiltHere(sys);let left=qty|0,fed=0;const now=Date.now();
  for(const id of ids){
    if(left<=0)break;
    const def=BLD[id],B=bldEntry(sys.key,id);
    if(!def||!def.eats[k]||!bldReady(B,now))continue;
    bldTick(sys.key,id,now);
    const Q=bldQuota(def,B.lvl)[k];
    const room=Math.max(0,Q*HOLD_CAP_SHIFTS*holdCapMul(sys.key)-(B.my[k]|0));
    const n=Math.min(room,left);
    if(n>0){B.my[k]=(B.my[k]|0)+n;left-=n;fed+=n;}
  }
  return fed;
}
/* сдать в цех промышленный товар (рынок его не берёт): по теневой цене, в бункер */
function bldSellInd(sys,k,qty){
  qty=Math.min(qty|0,G.cargo[k]|0);
  if(qty<=0||!RES[k]||!RES[k].ind)return 0;
  const n=bldFeed(sys,k,qty);
  if(n<=0)return 0;
  const price=indPrice(k),rev=n*price;
  G.cargo[k]-=n;earn(rev,"trade");
  return rev;
}
/* забрать пай или запас в трюм */
function bldCollect(sys,id){
  const B=bldEntry(sys.key,id),def=BLD[id];
  if(!B||!def)return 0;
  bldTick(sys.key,id);
  let took=0;
  if(def.fam==="A")return 0;   /* добыча продаёт, не дарит: bldBuySrc */
  for(const k in B.got){
    const n=Math.floor(B.got[k]);if(n<=0)continue;
    const t=addRes(k,n);B.got[k]-=t;took+=t;
  }
  return took;
}
/* купить из запаса своего промысла по 0.7 местной цены (или теневой) */
function srcPrice(sys,k){
  const p=RES[k].ind?indPrice(k):(TRADE_KEYS.indexOf(k)>=0?marketFor(sys)[k]:indPrice(k));
  return Math.max(1,Math.round(p*SRC_DISCOUNT));
}
function bldBuySrc(sys,id,k,qty){
  const B=bldEntry(sys.key,id),def=BLD[id];
  if(!B||!def||def.fam!=="A")return 0;
  bldTick(sys.key,id);
  const have=Math.floor(B.got[k]||0),price=srcPrice(sys,k);
  const free=stat().cargoMax-held();
  const n=Math.max(0,Math.min(qty|0,have,free,Math.floor(G.credits/price)));
  if(n<=0)return 0;
  G.credits-=n*price;G.cargo[k]=(G.cargo[k]|0)+n;B.got[k]-=n;
  return n;
}
/* ближайший едок товара среди своих построек — для ряда трюма (§5) */
function holdNearestEater(k){
  const H=G.hold||{};let best=null;
  for(const key in H){
    const b=H[key].bld;if(!b)continue;
    for(const id in b){
      const def=BLD[id];if(!def||!def.eats[k])continue;
      const[sx,sy]=key.split(",").map(Number);
      const d=Math.max(Math.abs(sx-G.sx),Math.abs(sy-G.sy));
      if(!best||d<best.d){const s=getSystem(sx,sy);best={key,sx,sy,d,def,name:s&&s.station?s.station.name:key};}
    }
  }
  return best;
}
/* строки для ДЕЛО: каждая постройка — одна строка */
function holdDealList(){
  const H=G.hold||{},out=[];const now=Date.now();
  for(const key in H){
    const b=H[key].bld;if(!b)continue;
    const[sx,sy]=key.split(",").map(Number);
    const s=getSystem(sx,sy);const nm=s&&s.station?s.station.name:key;
    for(const id in b){
      const def=BLD[id],B=b[id];if(!def)continue;
      bldTick(key,id,now);
      let state;
      if(!bldReady(B,now))state="монтаж · готово через "+Math.max(1,Math.ceil((B.ready-now)/60000))+" мин";
      else if(!Object.keys(def.makes).length)state="работает · "+def.note;
      else if(def.fam==="A"){state="в запасе: "+Object.keys(B.got).map(k=>RES[k].ru.toLowerCase()+" "+Math.floor(B.got[k]||0)).join(", ");}
      else{
        const my=Object.keys(def.eats).map(k=>RES[k].ru.toLowerCase()+" "+(B.my[k]|0)).join(", ");
        const got=Object.keys(B.got).filter(k=>Math.floor(B.got[k])>0).map(k=>RES[k].ru.toLowerCase()+" "+Math.floor(B.got[k])).join(", ");
        state="в бункере: "+my+(got?" · пай: "+got:" · пая пока нет");
      }
      out.push({nm:"«"+nm+"» · "+def.ru+" ×"+B.lvl,state,sx,sy});
    }
  }
  return out;
}
/* ── тело станции: одна форма семьи на постройку, уровень — размер ──
   Кладётся вторым слоем после stationMods (17c-system-draw). Не кэшируется:
   штатные модули тоже рисуются векторно каждый кадр; проход по кодексу — шаг 8. */
function holdMods(sys){
  const ids=bldBuiltHere(sys);if(!ids.length)return[];
  const now=Date.now(),out=[];
  ids.forEach((id,i)=>{
    const def=BLD[id],B=bldEntry(sys.key,id);if(!def||!B)return;
    const r=rng(hashi(sys.seed,0x0B1D,i+1));
    const ang=Math.PI*.25+i*(TAU/7)+(r()-.5)*.4;
    const s=bldReady(B,now)?.55+.25*(B.lvl|0):.4;
    out.push({id:"b:"+id,ru:def.ru,sh:def.sh,ang,d:40+r()*10,s,ph:r()*TAU});
  });
  return out;
}
function drawHoldMods(sys){
  if(typeof drawStModule!=="function")return;
  for(const q of holdMods(sys))drawStModule(q,sys.station);
}
