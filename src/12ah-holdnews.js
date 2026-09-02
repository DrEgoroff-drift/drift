/* ══════════════ холдинг · слухи, новости и чужие на проданной дороге ══════════════
   M297, шаг 9 (DESIGN-holding §2 R4, §11, §15). Три вещи, через которые слой
   говорит с игроком чужими словами, а не строкой в сводке:

   НОВОСТЬ С ПРИЧИНОЙ. Новости (12p) были случайным ветром: «+0.35 на кристаллы»
   ниоткуда. Заложенный или поднятый цех — событие с адресом: строка в новостях
   и давление вверх на его входы в той системе. Это второй после аппетита
   способ, которым дело игрока поднимает цену.

   СЛУХ. Раз из нескольких эфир говорит о холдинге чужими словами: уклад системы
   прилагательным («Сардразль-то заводская, туда железо возят») или где под
   промысел самое место («на Тегре реголит богатый — разработку бы туда»).

   ЧУЖИЕ НА ПРОДАННОЙ ДОРОГЕ. Проданный маршрут не исчезает — по его плечам
   теперь ходят чужие баржи (12l читает G.trade.soldSets), и в системе
   назначения они выбирают часть аппетита станции за смену. Продал дорогу —
   получил соперника, которого видно в небе и в цене. */
const HOLD_UKLAD={A:"горная",B:"заводская",C:"приборная",D:"судовая",E:"узловая",F:"судовая",G:"жилая",H:"крепостная",I:"учёная"};
function holdUklad(key){
  const H=G.hold&&G.hold[key];if(!H||!H.bld)return"";
  const n={};let best="",bn=0;
  for(const id in H.bld){const d=BLD[id];if(!d)continue;n[d.fam]=(n[d.fam]|0)+(H.bld[id].lvl|0);if(n[d.fam]>bn){bn=n[d.fam];best=d.fam;}}
  return bn>=2?HOLD_UKLAD[best]||"":"";
}
/* новость с причиной: заложен или поднят цех */
function holdNews(sys,def,what){
  if(!sys||!sys.station||!def||typeof newsAll!=="function")return null;
  const ins=Object.keys(def.eats);
  const m=G.market[sys.key]||(G.market[sys.key]={pressure:{},t:G.t});
  for(const k of ins)if(TRADE_KEYS.indexOf(k)>=0)m.pressure[k]=clamp((m.pressure[k]||0)+.2,-.6,.8);
  const ru="«"+sys.station.name+"»: "+(what==="up"?def.ru+" поднят до ×"+(bldEntry(sys.key,def.id)||{lvl:2}).lvl:"заложен "+def.ru.toLowerCase())+
    (ins.length?" — "+ins.filter(k=>RES[k]).map(k=>RES[k].ru.toLowerCase()).join(" и ")+" здесь в цене":" — "+def.note);
  const item={id:"hold",ru,sx:sys.sx,sy:sys.sy,t:Date.now()};
  newsAll().push(item);
  if(typeof newsMark==="function")newsMark(sys.key,"стройка","#7fe6d8");
  return item;
}
/* слух: уклад системы или место под промысел, чужими словами */
const HOLD_SRC_LINES={
  regolith:"реголит богатый — разработку бы туда",
  deepdrill:"породы тяжёлые, бурить бы глубже",
  icefield:"льда — ешь не хочу, промысел бы поставить",
  beltmine:"пояс густой, кто первый застолбит",
  gasfield:"гигант дышит — газовый промысел сам просится",
  greenhouse:"зелень прёт, оранжерея бы там окупилась",
  biostation:"зверьё непуганое, биостанции самое место",
  dumpworks:"отвалы стоят, а из них ещё половина руды"
};
function holdRumourLine(r){
  if(r()>.2)return null;
  const L=[];
  const H=G.hold||{};
  for(const key in H){
    const u=holdUklad(key);if(!u)continue;
    const[sx,sy]=key.split(",").map(Number);const s=getSystem(sx,sy);if(!s||!s.station)continue;
    const nm=(G.names&&G.names[key])||s.station.name;
    const eats={};for(const id in H[key].bld){const d=BLD[id];if(d)for(const k in d.eats)if(TRADE_KEYS.indexOf(k)>=0)eats[k]=1;}
    const ek=Object.keys(eats);
    L.push("…«"+nm+"»-то "+u+(ek.length?", туда "+RES[ek[Math.floor(r()*ek.length)]].ru.toLowerCase()+" возят.":". Люди прижились."));
  }
  const rad=6;
  for(let x=G.sx-rad;x<=G.sx+rad;x++)for(let y=G.sy-rad;y<=G.sy+rad;y++){
    if(!starAt(x,y))continue;
    const S=getSystem(x,y);if(!S||!S.station)continue;
    const built=(G.hold&&G.hold[S.key]&&G.hold[S.key].bld)||{};
    for(const id in HOLD_SRC_LINES){
      const d=BLD[id];if(!d||built[id])continue;
      if(bldAtWhy(S,d))continue;
      L.push("…на «"+S.station.name+"» "+HOLD_SRC_LINES[id]+".");
      break;
    }
  }
  return L.length?L[Math.floor(r()*L.length)]:null;
}
/* чужая баржа с проданной дороги выбирает часть аппетита — раз в смену на станцию */
function rivalEat(sys,k,cap){
  if(!sys||!sys.station||typeof appetiteEat!=="function")return 0;
  const H=holdOf(sys.key);
  if(H.rival===holdShift())return 0;
  H.rival=holdShift();
  const n=appetiteEat(sys,k,Math.max(1,Math.floor((cap|0)*.15)));
  if(n>0)logAdd("dim","Чужая баржа на «"+sys.station.name+"» сдала "+RES[k].ru.toLowerCase()+" — надбавка на смену ушла ей");
  return n;
}
