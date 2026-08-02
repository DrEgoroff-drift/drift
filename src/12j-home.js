/* ══════════════ дом ══════════════
   Дом один на всю вселенную, и он НЕ ПОКУПАЕТСЯ. Комнаты за деньги превратили
   бы его в ещё один магазин, а он должен быть тем, что нажилось: дом растёт сам
   от оборота — от всего, что вселенная вам принесла. Со счёта при этом не
   списывается ничего.

   Оборот — не баланс. Копится всё заработанное: продажи, дроны, домены, рейсы
   наёмников, награды за пиратов, выручка баз. Поэтому у денег появляется вторая
   жизнь: даже потраченные, они остаются в том, что у вас есть. */
const HOME_TIERS=[
  {t:1000,   key:"corner",ru:"угол",         say:"вы сняли угол"},
  {t:9000,   key:"hall",  ru:"прихожая",     say:"появилась прихожая"},
  {t:70000,  key:"garage",ru:"гараж",        say:"пристроен гараж"},
  {t:160000, key:"case",  ru:"витрина",      say:"поставлена витрина"},
  {t:320000, key:"shop",  ru:"мастерская",   say:"собрана мастерская"},
  {t:600000, key:"study", ru:"кабинет",      say:"обставлен кабинет"},
  {t:1100000,key:"living",ru:"жилая часть",  say:"обжита жилая часть"},
  {t:2000000,key:"dock",  ru:"причал с маяком",say:"построен причал, маяк зажжён"}
];
function homeInit(){
  return {turn:0,tier:0,sx:0,sy:0,made:0,garage:[],showcase:{},trophies:[]};
}
function homeHas(key){
  if(!G.home||!G.home.tier)return false;
  const i=HOME_TIERS.findIndex(t=>t.key===key);
  return i>=0&&G.home.tier>i;
}
function homeNext(){
  const H=G.home;if(!H)return HOME_TIERS[0];
  return HOME_TIERS[H.tier]||null;
}
/* ── единственная воронка дохода ──
   Раньше кредиты прибавлялись в десяти местах руками; теперь все они зовут
   `earn`, и дом видит ровно то, что видит игрок. Новый источник дохода,
   добавленный мимо этой функции, не будет учтён — это и есть проверка на
   ревизии. */
function earn(sum,why){
  sum=Math.round(sum);
  if(!isFinite(sum)||sum<=0)return 0;
  G.credits+=sum;
  homeTurn(sum,why);
  return sum;
}
function homeTurn(sum,why){
  if(!G.home)G.home=homeInit();
  const H=G.home;
  H.turn+=sum;
  /* дом заводится сам после первой честной выручки и встаёт там, где вы в этот
     момент были: он не выбирается из списка, он просто появляется */
  while(H.tier<HOME_TIERS.length&&H.turn>=HOME_TIERS[H.tier].t){
    const T=HOME_TIERS[H.tier];
    H.tier++;
    if(H.tier===1){H.sx=G.sx;H.sy=G.sy;H.made=Date.now();}
    logAdd("good","Дом: "+T.say+" · оборот "+H.turn.toLocaleString("ru")+" кр");
    say("ДОМ\n"+T.say);
    sfx("ok",{v:.5});
  }
}
/* строка «до следующей ступени» — вместо ценника, которого у дома нет */
function homeProgress(){
  const H=G.home;if(!H)return null;
  const N=homeNext();
  if(!N)return {done:true,ru:"дом достроен",frac:1};
  const prev=H.tier?HOME_TIERS[H.tier-1].t:0;
  const frac=clamp((H.turn-prev)/(N.t-prev),0,1);
  return {done:false,ru:"до ступени «"+N.ru+"» ещё "+
    Math.max(0,N.t-H.turn).toLocaleString("ru")+" кр оборота",frac,next:N};
}
/* ── дом как безопасное место ──
   Смерть перестаёт быть обнулением и становится потерей рейса: груз и часть
   денег теряются, но дом, его ступени и корабли в гараже целы. Прежний
   `totalLoss` выдавал новый «Стриж» в системе старта, то есть наказание стирало
   и историю тоже. */
function homeCanRevive(){return !!(G.home&&G.home.tier>0);}
function homeRevive(pname){
  const H=G.home;
  const lost=Math.round(G.credits*.5);
  G.credits=Math.max(0,G.credits-lost);
  for(const k of RES_KEYS)G.cargo[k]=0;
  /* корабль берётся из гаража, если он там есть; иначе дом даёт «Стриж» —
     не из милости, а потому что без корабля игра кончается */
  const fromGarage=homeHas("garage")&&H.garage.length?H.garage.shift():null;
  if(fromGarage&&G.owned[fromGarage])G.shipId=fromGarage;
  else if(!G.owned[G.shipId]){G.shipId="strizh";G.owned.strizh=true;}
  G.sx=H.sx;G.sy=H.sy;G.sys=getSystem(H.sx,H.sy);
  const st0=stat();
  G.fuel=st0.fuelMax;G.hull=st0.hullMax;
  G.ship.x=900;G.ship.y=0;G.ship.vx=0;G.ship.vy=0;
  G.mode="system";G.ap=null;G.belt=null;G.dig=null;G.cave=null;G.surf=null;G.land=null;
  G.pirates=[];G.shots=[];
  saveGame(true);
  logAdd("warn","Корабль потерян на "+pname+" · вы дома, груз и "+
    lost.toLocaleString("ru")+" кр потеряны");
  say("Вы дома\nрейс потерян: груз и "+lost.toLocaleString("ru")+" кр\nдом цел");
}
/* маяк домой платный, а ОТ дома летят своим ходом: иначе дом превращается в
   бесплатное такси по галактике */
function homeBeaconCost(){
  const d=Math.hypot(G.sx-(G.home?G.home.sx:0),G.sy-(G.home?G.home.sy:0));
  return Math.round(600+180*d);
}
function homeBeacon(){
  if(!homeCanRevive())return false;
  const cost=homeBeaconCost();
  if(G.credits<cost){say("Маяк домой\nнужно "+cost.toLocaleString("ru")+" кр");return false;}
  if(G.mode!=="system"){say("Маяк домой\nтолько из полёта по системе");return false;}
  G.credits-=cost;
  G.sx=G.home.sx;G.sy=G.home.sy;G.sys=getSystem(G.sx,G.sy);
  G.ship.x=900;G.ship.y=0;G.ship.vx=0;G.ship.vy=0;
  G.ap=null;G.pirates=[];G.shots=[];
  logAdd("dim","Маяк домой · −"+cost.toLocaleString("ru")+" кр");
  say("Вы дома");
  return true;
}
/* витрина и гараж: выставленное домой не продаётся и не летает — это память о
   рейсах, а не склад */
function homeStore(shipId){
  if(!homeHas("garage")||!G.owned[shipId]||shipId===G.shipId)return false;
  if(G.home.garage.includes(shipId))return false;
  G.home.garage.push(shipId);
  logAdd("good","В гараж дома поставлен «"+(shipData(shipId)||{}).ru+"»");
  return true;
}
function homeShow(res,qty){
  if(!homeHas("case")||!RES_KEYS.includes(res)||qty<=0)return false;
  if((G.cargo[res]|0)<qty)return false;
  G.cargo[res]-=qty;
  G.home.showcase[res]=(G.home.showcase[res]||0)+qty;
  logAdd("dim","На витрину дома: "+RES[res].ru+" ×"+qty);
  return true;
}
/* ══════════════ что ступени дают ══════════════
   Ступень без последствий — та же «подпись без кода», за которую на M53
   ловили перки: игрок видит комнату и вправе ждать, что она работает.
   Всё, что ниже, — из спецификации M78, подключённое к настоящим местам. */
/* КАБИНЕТ: место для ещё одного стоящего приказа у каждого управляющего.
   Читается в `mgrSlots` (12c-mgr-core). */
function homeOrderBonus(){return homeHas("study")?1:0;}
/* ЖИЛАЯ ЧАСТЬ: наёмник между рейсами живёт в доме, а не в кабине, и мораль
   восстанавливается вдвое быстрее. Читается в `crewTick`. */
function homeMoraleMul(){return homeHas("living")?2:1;}
/* ВИТРИНА: выставленное редкое сырьё — не склад, а репутация. Домен приносит
   надбавку тем большую, чем богаче витрина, но не больше десятой части.
   Читается в `mgrDomain`. */
function homeShowBonus(){
  if(!homeHas("case"))return 0;
  let n=0;
  for(const k in G.home.showcase)n+=G.home.showcase[k]|0;
  return Math.min(.1,n*.004);
}
/* МАСТЕРСКАЯ: переборка части — аффиксы генерируются заново, но ступенью ниже.
   Это не улучшение, а второй бросок: плохая часть перестаёт быть мусором, а
   хорошую перебирать себе дороже. */
function homeCanRebuild(){return homeHas("shop");}
function homeRebuild(id){
  if(!homeCanRebuild())return null;
  const i=G.inv.findIndex(p=>p.id===id);
  if(i<0)return null;
  const p=G.inv[i];
  const tier=Math.max(1,(p.tier|0)-1);
  const np=genPart(hashi(p.seed,Date.now()&0xffff,0x5EB),tier,p.kind);
  np.id=p.id;
  G.inv[i]=np;
  invalidateParts();
  logAdd("tech","Мастерская дома: «"+p.name+"» перебрана в «"+np.name+"» ("+
    TIER_RU[np.tier]+")");
  say("Перебрано\n"+np.name+"\n"+np.aff.map(affLabel).join("\n"));
  return np;
}
