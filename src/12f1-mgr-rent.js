/* ══════════════ второе ядро — в аренду (M488, DESIGN-birchpunk) ══════════════
   Своё ядро (12f) собирают из иридия и оно медленно перестаёт спрашивать.
   Хай-Фронт предлагает обратное: ядро по тарифу, по сети, без материалов.
     БАЗОВЫЙ   — даром; в каждой третьей сводке реклама; само не учится;
     ПРЕМИУМ   — 6 кр/мин; учится само, как своё;
     СЕМЕЙНЫЙ  — 10 кр/мин; учится и делится мнением о том, как вы живёте.
   Арендное не дрейфует никогда. Не заплатили — само понижает себя до
   БАЗОВОГО и извиняется. Место занимает то же, что человек: правило четырёх
   мест держится. Доброта: на бесплатном тарифе, пока у вас горит база,
   реклама один раз пропускается.
   Выбор — шутка: своя машина, которая перестаёт спрашивать, или их машина,
   которая не перестаёт продавать. На управляющем: m.rent = {tier, n}. */
const RENT_TIERS={
  base:{ru:"БАЗОВЫЙ", fee:0, learn:0,note:"даром · реклама в каждой третьей сводке · само не учится"},
  prem:{ru:"ПРЕМИУМ", fee:6, learn:1,note:"учится само · без рекламы"},
  fam: {ru:"СЕМЕЙНЫЙ",fee:10,learn:1,opin:1,note:"учится · мнения о том, как вы живёте"}
};
const RENT_ADS=["Хай-Фронт Облако™ — ваши данные в надёжных руках. Наших.","Попробуйте ПРЕМИУМ: первая минута — по цене минуты!",
  "HIVE·HOTEL v2 — капсула рассчитана на вас.","Обновите тариф — обновите жизнь. Хай-Фронт.","Эта сводка спонсирована. Кем — неважно."];
const RENT_OPIN=["По моим данным, вы спите меньше рекомендованного.","Ваш маршрут неэффективен, но в нём есть что-то человеческое.",
  "Я бы на вашем месте позвонил родным. У меня нет родных.","Вы давно не были дома. Я просто отмечаю."];
function rentTier(m){return m&&m.rent?(RENT_TIERS[m.rent.tier]||RENT_TIERS.base):null;}
function rentAi(role,tier){
  if(!MGR_ROLES[role]||!RENT_TIERS[tier])return false;
  if(mgrTaken(role)){say("Домен занят");return false;}
  if(G.mgrs.length>=MGR_CAP){say("Все четыре места заняты\nарендное тоже занимает место");return false;}
  const seed=hashi(now()&0xffff,role.length*977,0xA12);
  const m={id:"hf"+seed,seed,name:"«HF-"+(100+seed%900)+"»",role,ai:1,rent:{tier,n:0},
    traits:[],lv0:1,xp:0,perks:[],rules:[],loy:100,drift:0,
    tMs:now(),earned:0,spent:0,tookCr:0,stole:0,shipId:null,route:[],log:[],fee:0};
  G.mgrs.push(m);
  mgrSay(m,"Подключено. Тариф «"+RENT_TIERS[tier].ru+"». Спасибо, что выбрали Хай-Фронт.","good");
  tell("","Арендовано ядро "+m.name+" · тариф "+RENT_TIERS[tier].ru,"Ядро "+m.name+"\nтариф "+RENT_TIERS[tier].ru);
  return true;
}
function rentSetTier(m,tier){if(!m.rent||!RENT_TIERS[tier])return false;m.rent.tier=tier;mgrSay(m,"Тариф изменён: «"+RENT_TIERS[tier].ru+"». Изменения вступили в силу мгновенно.");return true;}
/* недоплата: не дрейф, а понижение тарифа с извинением */
function rentShort(m){
  if(m.rent.tier==="base")return;
  m.rent.tier="base";
  mgrSay(m,"Платёж не прошёл. Тариф понижен до «БАЗОВЫЙ». Приносим извинения за неудобства.","warn");
}
function rentBaseBurning(){
  const B=G.bases;if(!B)return false;
  const L=Array.isArray(B)?B:Object.values(B);
  return L.some(b=>b&&b.fire);
}
/* каждая сводка арендного: реклама или мнение */
function rentSay(m){
  const T=rentTier(m);if(!T)return;
  m.rent.n=(m.rent.n|0)+1;
  if(m.rent.tier==="base"&&m.rent.n%3===0){
    if(rentBaseBurning()&&!m.rent.spared){m.rent.spared=1;mgrSay(m,"Рекламу пропускаем. У вас горит база.");return;}
    mgrSay(m,RENT_ADS[m.rent.n/3%RENT_ADS.length|0],"ad");   /* в ленте — баннером (D22) */
  }
  if(T.opin&&m.rent.n%4===0)mgrSay(m,RENT_OPIN[m.rent.n/4%RENT_OPIN.length|0]);
}
/* ШТАБ: предложение аренды — рядом со своим ядром */
function hqRentOffer(free){
  /* глянцевая карточка Хай-Фронта с таблицей тарифов (D22, телефон 18.09):
     три ровных ряда читались ещё тремя управляющими, а это одна вещь — реклама */
  const card=el("div","rent-card");
  card.appendChild(el("div","rent-head","<b>ЯДРО ХАЙ-ФРОНТА</b><s>в аренду · занимает место человека · не дрейфует</s><i>◉</i>"));
  for(const t in RENT_TIERS){
    const T=RENT_TIERS[t],r=el("div","row rent-row");
    r.appendChild(el("div","nm","<b>"+T.ru+"</b><em>"+(T.fee?T.fee+" кр/мин":"даром")+"</em><s>"+T.note+"</s>"));
    const bs=el("div","rent-btns");
    for(const k of free){
      const b=el("button","act sm",MGR_ROLES[k].ru.toUpperCase());
      b.onclick=()=>{if(rentAi(k,t)){hqSel=null;hqRender();}};
      bs.appendChild(b);
    }
    r.appendChild(bs);card.appendChild(r);
  }
  card.appendChild(el("div","rent-foot","«Спасибо, что остаётесь с нами» · Хай-Фронт™"));
  $hqBody.appendChild(card);
}
