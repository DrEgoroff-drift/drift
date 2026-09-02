/* ══════════════ наёмники: рейс как раздача карт ══════════════ */
/* Наёмник — не альтернатива дрону, а ставка. Дрон даёт маленький надёжный плюс,
   наёмник по кредитам в среднем в минусе и живёт ради хвостов: трофейных частей,
   редкого сырья, изредка целого корпуса. Поэтому таблица ниже — не «модификаторы
   дохода», а события: почти каждое что-то отнимает или даёт сверх денег.

   Скрытая удача (crewLuck) двигает веса, но нигде не показывается. Игрок читает
   её только по истории рейсов — то есть перебором, а перебор стоит найма. */

/* ── байки: почему он пропал ──
   Собираются на лету из шаблонов и генератора имён, поэтому не повторяются и не
   занимают места. Это единственное место в игре, где ей позволено пошутить. */
const TALE_DRINK=["реакторного антифриза","станционного самогона","чего-то синего",
  "настойки на ксенобиоме","технического спирта с сиропом"];
const TALE_JOB=["грузчиком","мойщиком шлюзов","сортировщиком руды","ночным сторожем",
  "подавальщиком в столовой"];
function crewTaleCtx(r){
  const nm=()=>genName(r);
  return {planet:nm(),planet2:nm(),station:"«"+nm()+"»",person:nm(),beast:nm(),
    beast2:nm(),res:pick(TRADE_KEYS,r),drink:pick(TALE_DRINK,r),job:pick(TALE_JOB,r),
    n:3+Math.floor(r()*9)};
}
const CREW_TALES=[
  t=>"связался с женщиной с "+t.planet+". Она оказалась таможенным инспектором",
  t=>"проиграл жалованье в кости докерам "+t.station+" и двое суток отрабатывал "+t.job,
  t=>"ушёл за припасами, вернулся с существом в контейнере. Говорит, само зашло",
  t=>"вступил в секту «Тихий Дрейф». Выгнали за пение",
  t=>"поспорил, что выпьет "+t.n+" стаканов "+t.drink+". Спор выиграл, неделю проиграл",
  t=>"влюбился в диспетчершу "+t.station+" и трое суток кружил у причала, чтобы «случайно» поговорить",
  t=>"купил карту сокровищ. Карта оказалась схемой канализации станции",
  t=>"женился на "+t.planet+". Через сутки развёлся: не сошлись во взглядах на гравитацию",
  t=>"судил бои дронов, засудил не тех, уходил дворами",
  t=>"отдал скафандр в залог за ужин. Ужин был так себе",
  t=>"нашёл земляка. Земляк оказался мошенником, но вечер удался",
  t=>"решил, что он поэт. Читал стихи в шлюзе, пока в зале не кончились слушатели",
  t=>"продал бортовой чайник как «артефакт древних». Купили. Совесть молчит",
  t=>"подрался из-за того, что кто-то назвал его корпус ведром",
  t=>"попал на свадьбу незнакомых людей и был там тамадой. Есть запись",
  t=>"уснул в контейнере и уехал на "+t.planet2+". Обратный рейс за ваш счёт",
  t=>"открыл ларёк: "+RES[t.res].ru.toLowerCase()+" в розницу. Прогорел за сутки",
  t=>"поставил всё на бой двух зверей. Оба сбежали, ставки не вернули",
  t=>"согласился быть свидетелем в суде. Выяснилось, что обвиняемым",
  t=>"взял паузу, чтобы найти себя. Нашёл бар",
  t=>"влез в спор, круглая ли "+t.planet+". Спор шёл трое суток",
  t=>"сдал корабль киносъёмочной группе. Фильм не окупился, обшивка тоже",
  t=>"записался на курсы медитации. Медитировал так глубоко, что проспал рейс",
  t=>"подрался с автоматом по продаже воды. Проиграл автомату",
  t=>"пошёл искать легендарную жилу "+RES[t.res].ru.toLowerCase()+". Легенду рассказал бармен",
  t=>"усыновил станционного кота. Кот сбежал, поиски продолжаются",
  t=>"выиграл в лотерею шляпу. Носит",
  t=>"спутал причал и трое суток жил в чужой каюте. Хозяин не заметил",
  t=>"нанялся вторым пилотом на один рейс. Рейс оказался в другую сторону",
  t=>"объявил, что уходит в монахи. Вернулся, узнав, что там не платят",
  t=>"чинил автомат с едой. Сломал окончательно, изгнан с почестями",
  t=>"поспорил с чужим навигатором, кто быстрее считает курс. Ошиблись оба",
  t=>"сдавал на права категории «тяжёлый». Не сдал. Отмечал всё равно",
  t=>"купил долю в шахте на "+t.planet+". Шахта существует только на бумаге",
  t=>"встретил старую команду. Воспоминания заняли двое суток",
  t=>"написал жалобу на гравитацию "+t.planet+" и ждал ответа в баре",
  t=>"пытался научить погрузчик танцевать. Погрузчик в ремонте",
  t=>"поверил гадалке, что рейс будет несчастливым, и решил переждать"
];
function crewTale(c){
  const r=rng(hashi(c.seed,(c.trips|0)*131+7,0x7A1E));
  return pick(CREW_TALES,r)(crewTaleCtx(r));
}

/* ── таблица событий ── */
const CREW_EV_BASE={cat:3,bad:23,norm:46,good:22,jack:3};
function rollCrewEvent(c,r,danger){
  const L=crewLuck(c),S=crewSwing(c),risk=c.risk||"norm";
  const rk=crewMul(c,"risk");
  const w={};
  for(const k in CREW_EV_BASE)w[k]=CREW_EV_BASE[k];
  /* удача двигает оба конца, дисперсия съедает середину */
  w.good*=L;w.jack*=L*L;
  w.cat*=(2.2-L)*rk;w.bad*=(2.2-L)*rk;
  w.norm*=Math.max(.35,2-S);
  /* опасность сектора — та же ручка, только явная и на виду у игрока */
  w.cat*=1+danger*2.2;w.bad*=1+danger;w.jack*=1+danger*.9;
  if(typeof holdEventWeights==="function")holdEventWeights(c,w);   /* Учебный пункт и Столовая (G2, G7) */
  /* и наконец собственная ставка игрока */
  if(risk==="safe"){w.cat*=.4;w.bad*=.7;w.jack*=.5;w.good*=.8;w.norm*=1.9;}
  if(risk==="bold"){w.cat*=1.9;w.bad*=1.3;w.jack*=2.2;w.good*=1.3;w.norm*=.5;}
  /* «Трофейщик» командира: звено чаще возвращается с чужим добром — это
     тот самый хвост таблицы, ради которого наёмник и держится */
  if(mgrPerkOf("cmd","salv"))w.jack*=1.8;
  /* без корабля и без груза красть нечего, а терять некому */
  const cats=Object.keys(w);
  let sum=0;for(const k of cats)sum+=w[k];
  let x=r()*sum,cat=cats[0];
  for(const k of cats){x-=w[k];if(x<=0){cat=k;break;}}
  const pool=CREW_EVENTS.filter(e=>e.cat===cat&&(!e.when||e.when(c,danger)));
  if(!pool.length)return CREW_EVENTS.find(e=>e.id==="plain");
  return pick(pool,r);
}
/* каждое событие само решает, что случилось с рейсом; возвращает строку для журнала */
const CREW_EVENTS=[
  /* ── катастрофы ── */
  {id:"lost_ship",cat:"cat",when:c=>!!c.shipId,run:(c,r,gross)=>{
    crewDamage(c,c.hull+1);
    return {tone:"warn",ru:"потерял корабль"};
  }},
  {id:"hostage",cat:"cat",when:c=>!!c.shipId&&c.state!=="hostage",run:(c,r,gross)=>{
    const S=shipData(c.shipId);
    c.state="hostage";
    c.ransomBase=Math.round(600+gross*3+(S?S.cargo:40)*22);
    c.ransom=c.ransomBase;c.ransomAt=Date.now();
    c.ransomSx=c.order.sx;c.ransomSy=c.order.sy;
    c.cargo={};
    return {tone:"warn",ru:"взят в заложники · выкуп "+c.ransom.toLocaleString("ru")+" кр"};
  }},
  {id:"desert",cat:"cat",when:c=>crewHas(c,"greedy")||c.morale<.7,run:(c)=>{
    const S=c.shipId?shipData(c.shipId):null;
    if(c.shipId&&c.shipId!==G.shipId)delete G.owned[c.shipId];
    c.gone=true;
    return {tone:"warn",ru:"ушёл вместе с грузом и «"+(S?S.ru:"кораблём")+"»"};
  }},
  {id:"seized",cat:"cat",run:(c,r,gross)=>{
    const fine=Math.round(gross*1.4+400);
    G.credits-=fine;c.spent=(c.spent||0)+fine;c.cargo={};
    return {tone:"warn",ru:"груз арестован как контрабанда · штраф "+fine.toLocaleString("ru")+" кр"};
  }},

  /* ── плохое ── */
  {id:"beaten",cat:"bad",when:c=>!!c.shipId,run:(c,r,gross,d)=>{
    crewPayload(c,gross*.5,r);
    crewDamage(c,10+d*34+r()*14);
    return {tone:"warn",ru:"еле ушёл · корпус "+Math.round(c.hull)+"/"+Math.round(c.hullMax)};
  }},
  {id:"empty",cat:"bad",run:()=>({tone:"dim",ru:"рейс сорвался, трюм пустой"})},
  {id:"halfload",cat:"bad",run:(c,r,gross)=>{
    crewPayload(c,gross*.35,r);
    return {tone:"dim",ru:"часть груза потеряна по дороге"};
  }},
  {id:"away",cat:"bad",run:(c,r)=>{
    const h=2+Math.floor(r()*7);
    c.state="away";c.stateUntil=Date.now()+h*3600000;
    return {tone:"",ru:"загулял на "+h+" ч: "+crewTale(c)};
  }},
  {id:"breakdown",cat:"bad",when:c=>!!c.shipId,run:(c,r)=>{
    crewDamage(c,8+r()*16);
    c.state="away";c.stateUntil=Date.now()+(1+Math.floor(r()*3))*3600000;
    return {tone:"dim",ru:"встал на ремонт: сдох маршевый узел"};
  }},
  {id:"barvdebt",cat:"bad",run:(c,r,gross)=>{
    const sum=Math.round(120+gross*.6);
    G.credits-=sum;c.spent=(c.spent||0)+sum;
    crewPayload(c,gross*.7,r);
    return {tone:"money",ru:"оставил долг на станции — "+sum.toLocaleString("ru")+" кр с вас: "+crewTale(c)};
  }},
  {id:"hungover",cat:"bad",run:(c,r,gross)=>{
    crewPayload(c,gross*.6,r);c.hangover=1;
    return {tone:"dim",ru:"вернулся никакой, следующий рейс вполсилы"};
  }},

  /* ── обычное ── */
  {id:"plain",cat:"norm",run:(c,r,gross)=>{
    const got=crewPayload(c,gross*(.85+r()*.3),r);
    return {tone:"",ru:"рейс закрыт"+(got?" · +"+got.toLocaleString("ru")+" кр":"")};
  }},

  /* ── хорошее ── */
  {id:"over",cat:"good",run:(c,r,gross)=>{
    const got=crewPayload(c,gross*(1.5+r()*.6),r);
    return {tone:"money",ru:"перевыполнил"+(got?" · +"+got.toLocaleString("ru")+" кр":"")};
  }},
  {id:"haggle",cat:"good",run:(c,r,gross)=>{
    const got=crewPayload(c,gross*1.35,r);
    return {tone:"money",ru:"сторговался выше рынка"+(got?" · +"+got.toLocaleString("ru")+" кр":"")};
  }},
  {id:"bounty",cat:"good",run:(c,r,gross,d)=>{
    crewPayload(c,gross,r);
    const b=crewCredit(c,Math.round((160+d*420)*(1+r())*stat().bountyMul));
    return {tone:"money",ru:"снял пирата · награда +"+b.toLocaleString("ru")+" кр"};
  }},
  {id:"salvage",cat:"good",when:()=>G.inv.length<PART_MAX,run:(c,r,gross)=>{
    crewPayload(c,gross*.8,r);
    const p=genPart(hashi(c.seed,(c.trips|0)*31,0x5A1E),1+Math.floor(r()*2),pick(PART_KEYS,r));
    addPart(p);
    return {tone:"tech",ru:"подобрал в обломках: "+p.name};
  }},

  /* ── джекпоты ── */
  {id:"vein",cat:"jack",run:(c,r,gross)=>{
    const got=crewPayload(c,gross*(3+r()*2),r);
    return {tone:"money",ru:"нашёл жилу"+(got?" · +"+got.toLocaleString("ru")+" кр":"")};
  }},
  {id:"rare",cat:"jack",run:(c,r,gross)=>{
    crewPayload(c,gross,r);
    /* редкое приходит штучно и редко: гигант, дальний пояс и абордаж по-прежнему
       дают его десятками, поэтому наёмник не заменяет их, а изредка подкидывает */
    const k=pick(RARE_RES.concat(["crystal","iridium"]),r);
    const n=1+Math.floor(r()*3);
    const got=addRes(k,n);
    return {tone:"tech",ru:got?("передал с попутным бортом: "+RES[k].ru.toLowerCase()+" ×"+got)
                             :("нашёл "+RES[k].ru.toLowerCase()+", но ваш трюм полон")};
  }},
  {id:"part_hi",cat:"jack",when:()=>G.inv.length<PART_MAX,run:(c,r,gross)=>{
    crewPayload(c,gross,r);
    const p=genPart(hashi(c.seed,(c.trips|0)*77+5,0x9A1E),3+Math.floor(r()*3),pick(PART_KEYS,r));
    addPart(p);
    return {tone:"tech",ru:"снял с чужого борта: "+p.name};
  }},
  {id:"capture",cat:"jack",when:()=>Object.keys(SHIPS).some(id=>!G.owned[id]),run:(c,r,gross)=>{
    const free=Object.keys(SHIPS).filter(id=>!G.owned[id]);
    const id=pick(free,r);G.owned[id]=true;
    /* хвост — на витрину (M152e): ставка видна, а не строка dim */
    if(G.home){(G.home.trophies||(G.home.trophies=[])).push({k:"hull",id,who:c.name,t:Date.now()});}
    if(typeof thingAdd==="function")thingAdd("trophy",c.name+" пригнал корпус «"+SHIPS[id].ru+"»","трофей с рейса · корпус в ангаре · витрина дома помнит");
    return {tone:"tech",ru:"пригнал трофейный корпус «"+SHIPS[id].ru+"» — он в ангаре"};
  }}
];
/* ── применение ── */
function applyCrewEvent(c,ev,r,gross,danger){
  /* похмелье съедает половину следующего рейса и снимается само */
  if(c.hangover){gross=Math.round(gross*.5);c.hangover=0;}
  const res=ev.run(c,r,gross,danger)||{ru:"рейс закрыт"};
  crewHistory(c,ev,res.ru);
  const line=c.name+": "+res.ru;
  logAdd(res.tone||"",line);
  /* о крупном сообщаем ещё и всплывающим текстом — иначе джекпот пройдёт мимо */
  if(ev.cat==="jack"||ev.cat==="cat")say(c.name+"\n"+res.ru);
}
function crewHistory(c,ev,ru){
  c.hist=c.hist||[];
  c.hist.unshift({cat:ev.cat,id:ev.id,ru,t:Date.now()});
  if(c.hist.length>12)c.hist.length=12;
}
/* ── выкуп и освобождение ── */
function ransomPay(c){
  if(c.state!=="hostage")return false;
  if(G.credits<c.ransom){say("Не хватает кредитов\nвыкуп "+c.ransom.toLocaleString("ru")+" кр");return false;}
  G.credits-=c.ransom;c.spent=(c.spent||0)+c.ransom;
  crewFreeHostage(c,"выкуплен за "+c.ransom.toLocaleString("ru")+" кр");
  return true;
}
function crewFreeHostage(c,why){
  const S=c.shipId?shipData(c.shipId):null;
  c.state=null;c.ransom=0;c.tMs=Date.now();c.tripMin=0;
  /* корабль пираты оставляют себе примерно в половине случаев */
  const r=rng(hashi(c.seed,(c.trips|0)*17+3,0xF2EE));
  if(c.shipId&&r()<.5){
    if(c.shipId!==G.shipId)delete G.owned[c.shipId];
    c.shipId=null;c.order={kind:"home",sx:c.order.sx,sy:c.order.sy};
    logAdd("warn",c.name+" "+why+", но «"+(S?S.ru:"корабль")+"» остался у пиратов");
  }else logAdd("money",c.name+" "+why);
  crewHistory(c,{cat:"good",id:"freed"},why);
  say(c.name+"\n"+why);
}
/* абордаж базы освобождает всех, кого держат в этом секторе — пассивная система
   выдаёт активную задачу в уже существующий режим, а не просит новый */
function crewFreeHostagesAt(sx,sy){
  let n=0;
  for(const c of G.crew)
    if(c.state==="hostage"&&c.ransomSx===sx&&c.ransomSy===sy){crewFreeHostage(c,"освобождён при штурме базы");n++;}
  return n;
}
/* сколько всего просят за пленных — для подсказки на экране экипажа */
function crewHostages(){return G.crew.filter(c=>c.state==="hostage");}
