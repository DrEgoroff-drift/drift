/* ══════════════ смена базы и журнал (M390, DESIGN-base §3, §12, §15) ══════════════
   До сегодняшнего дня база жила по своим часам: `baseTick` считал МИНУТЫ от
   стенных часов, а броски налёта и бури брал от текущей минуты и от счётчика
   внутри самой базы. Из этого выходило три беды сразу.

   Первая: у слоя не было единицы. Холдинг мерит СМЕНАМИ (`HOLD_SHIFT`, 20
   минут), и игрок, выучивший смену там, приходил на базу и обнаруживал минуты.
   Вторая: результат зависел от того, КАК часто заглядывали. Десять заходов по
   минуте и один заход на десять минут давали разные исходы, потому что бросок
   делался на каждый заход. Третья: проверить это было нечем — повтор не
   воспроизводился даже сам по себе.

   Здесь всё три чинятся одним: у базы одна единица — смена, и её ход — чистая
   функция от НОМЕРА СМЕНЫ. Заглядывайте когда хотите: сколько смен прошло,
   столько и отыграется, и ровно так же, как отыгралось бы у соседа.

     · догоняем не больше 72 смен (сутки, `CREW_OFFLINE_CAP`);
     · последние 24 смены проигрываются подробно — это и есть глубина журнала;
     · всё, что старше, сводится арифметикой и одной строкой «база работала
       сама»: подробностей за позавчера никто не помнит, а руду помнят.

   Ничего нового база пока не ест (запасы — M391): это та же база, посчитанная
   иначе, и любое старое сохранение открывается без единой правки. */
const BASE_CAP_SH=Math.floor(CREW_OFFLINE_CAP/HOLD_SHIFT);   /* 72 смены = сутки */
const BASE_DETAIL=24;        /* столько последних смен проигрываются подробно */
const BASE_LOG=24;           /* столько строк держит журнал (§12) */
const BASE_MIN=HOLD_SHIFT/60000;                             /* минут в смене — 20 */
function baseShift(t){return holdShift(t);}
/* номер смены, на которой база стоит. У старой записи его нет — берём из её
   минутных часов, и это единственное место, где `tMs` ещё нужен */
function baseT0(B){
  if(typeof B.t0==="number")return B.t0;
  B.t0=baseShift(B.tMs||Date.now());
  return B.t0;
}
function baseSince(B,now){
  const n=baseShift(now)-baseT0(B);
  return n>0?Math.min(n,BASE_CAP_SH):0;
}
/* ── журнал (§12) ──
   Одна строка на смену, и голосом того, кого она касается. Видов строк ровно
   столько, сколько у базы событий: десять с M390 и ещё два с M391 — встала и
   пошла снова. Вида «на всякий случай» здесь нет: писать о том, чего не
   происходит, — это врать в собственном журнале. */
function baseWho(B,role){
  if(typeof baseStaff!=="function")return "";
  for(const c of baseStaff(B))if(c.role===role)return c.name||"";
  return "";
}
const BLOG={
  raid_off:(B,a)=>a.who?"«Пришли двое. Ушли ни с чем» — "+a.who:"налёт отбит",
  raid_hit:(B,a)=>"налёт"+(a.lost?" · унесли "+a.lost+" ед":"")+
                  (a.broke?" · разбит отсек: "+a.broke:"")+(a.guard?"":" · охраны нет"),
  /* род у отсеков разный («панель» — она, «склад» — он), и согласовывать его
     в журнале нечем: пишем без глагола, зато без вранья */
  storm:   (B,a)=>a.shield?"буря. Щит держит, потерь нет":
                  (a.what?"буря. "+(a.out?"Выбито":"Досталось")+": "+a.what:
                   "буря. Ломать снаружи нечего"),
  fix:     (B,a)=>a.who?"«Отсек снова держит» — "+a.who:"отсек восстановлен",
  gun_off: ()=>"батарея обесточена, оборона молчит",
  gun_on:  ()=>"батарея снова под напряжением",
  grid:    (B,a)=>"излишки сданы станции · "+a.cr+" кр",
  full:    (B,a)=>a.who?"«Склад полон, бурить некуда» — "+a.who:"склад полон, добыча стоит",
  melt:    (B,a)=>"плавильня дала "+a.q+" сплав"+pl3(a.q,"","а","ов"),
  deep:    ()=>"смотритель вскрыл нижний ярус",
  wear:    (B,a)=>"жара доконала: "+a.what,
  worn:    (B,a)=>a.what+" отработал своё. Ничто не доделано навсегда",
  ruin:    ()=>"базу бросили. Людей нет, запаса нет, свет погашен",
  tenant:  (B,a)=>"в развалину въехали: "+a.who,
  back:    ()=>"база снова наша. Чинить придётся от нуля",
  uniq:    (B,a)=>"со склада забрали, чего нигде не купить: "+a.what,
  mgrgo:   (B,a)=>a.who+" ушёл: жалованье не заплачено",
  short:   (B,a)=>"склад не сходится на "+a.q+" ед. Опять",
  dev:     (B,a)=>a.who+" поставил "+a.what+". Не спросил",
  devfix:  (B,a)=>a.who+" восстановил "+a.what,
  devbuy:  (B,a)=>a.who+" заказал припас, пока не кончился",
  panic:   (B,a)=>"на царапину извели "+a.q+" ед. со склада",
  palfee:  (B,a)=>a.ru+" — "+a.q+" кр. Начислено",
  palshare:(B,a)=>"доля с оборота — "+a.q+" кр. Успехи не остаются незамеченными",
  palsvod: ()=>"сводка подана. ПАЛАТА подтвердила получение подтверждения",
  palpeny: (B,a)=>"сводка не подана: пеня "+a.q+" кр. Никто не приходил и не спрашивал",
  palcheck:(B,a)=>a.rank+" "+a.who+" был вежлив и нашёл: «"+a.form+"». Штраф "+a.q+" кр",
  palseize:(B,a)=>"участок изъят ПАЛАТОЙ за долг "+a.q+" кр. Опись прилагается",
  fwd:     ()=>"нас назвали опорным пунктом экспедиции. Всем бортам — сюда",
  fwdpay:  (B,a)=>"сел борт: приём и заправка, "+a.q+" кр. И поели",
  warn:    (B,a)=>a.warn,
  law:     (B,a)=>"устав: принят закон «"+a.ru+"». Навсегда",
  thief:   (B,a)=>"со склада пропало "+a.q+" ед. Дверь была открыта",
  avral:   (B,a)=>"аврал: "+a.ru.toLowerCase()+" в отсеке "+a.what,
  avrok:   (B,a)=>a.who?"«Успели» — "+a.who:"аврал отбит, отсек цел",
  avrno:   ()=>"аврал упустили. Дальше оно пошло само",
  fire:    (B,a)=>"горит "+a.what+". Тушат чем есть",
  firego:  (B,a)=>"огонь перешёл в "+a.what,
  fireout: (B,a)=>a.who?"«Потушили. Обошлось» — "+a.who:"пожар потушен",
  dust:    ()=>"пылевой занос. Бур стоит, пока не разгребут",
  cold:    ()=>"холодный удар. Всё выстыло разом",
  vent:    ()=>"выброс. Половина воздуха ушла в никуда",
  quake:   (B,a)=>"толчок. Досталось: "+a.what,
  barge:   (B,a)=>"мимо шла баржа, оставили "+a.q+" ед · "+a.what,
  vein:    ()=>"бур пошёл легче: под базой жила",
  guest:   (B,a)=>"пришёл человек со стороны, просится остаться. Ждёт у затвора — "+a.who,
  guestno: (B,a)=>a.who+" постоял у затвора и ушёл своей дорогой",
  leave:   (B,a)=>a.say+" — "+a.who+", и ушёл",
  hungry:  ()=>"харч кончился. Люди держатся на духе, а он не бесконечен",
  cryo:    (B,a)=>"криоцех дал "+a.q+" криоген"+pl3(a.q,"","а","ов"),
  park:    (B,a)=>a.by==="hand"?"консервация. Встали сами, по-хозяйски":
                  (a.what==="вода"?"кончилась вода":"кончился воздух")+
                  " · база встала. Люди на малом ходу",
  wake:    (B,a)=>a.by==="hand"?"расконсервация. Смена на раскочегарку":
                  "запас пришёл · база снова в работе",
  quiet:   ()=>"смена прошла тихо",
  away:    (B,a)=>"смены "+((a.from|0)%1000)+"–"+((a.to|0)%1000)+" · база работала сама"
};
function baseLog(B,kind,n,args){
  const f=BLOG[kind];
  if(!f)return;
  /* «молчит» (M405, §34.1): управляющий не подаёт сводок вовсе, и журнал
     базы замолкает — кроме тех строк, которые про него самого */
  if(typeof bmgrSilent==="function"&&bmgrSilent(B)&&kind!=="mgrgo"&&kind!=="short")return;
  if(!B.log)B.log=[];
  const line={n:n|0,k:kind,t:f(B,args||{})};
  B.log.push(line);
  if(B.log.length>BASE_LOG)B.log.splice(0,B.log.length-BASE_LOG);
  /* СВЯЗЬ (M394): о том, что случилось, база говорит САМА — если её слышно */
  if(typeof baseCallOut==="function")baseCallOut(B,line);
}
function baseLogList(B,max){
  const L=(B&&B.log)||[];
  return max?L.slice(Math.max(0,L.length-max)):L.slice();
}
/* ── одна смена ──
   Всё, что раньше делалось «за минуты», делается за двадцать минут разом, а
   бросок берётся от НОМЕРА смены: одна и та же смена у одной и той же базы
   разрешается одинаково, сколько раз её ни считай. */
function baseShiftRun(B,n){
  let said=0;
  const P=basePower(B);
  if(P.guns){
    const quiet=P.eff<=0;
    if(quiet&&!B.quiet){B.quiet=true;baseLog(B,"gun_off",n);said=1;
      logAdd("warn","База «"+B.name+"»: батарея обесточена, оборона молчит");}
    else if(!quiet&&B.quiet){B.quiet=false;baseLog(B,"gun_on",n);said=1;
      logAdd("tech","База «"+B.name+"»: батарея снова под напряжением");}
  }
  said|=baseFixTick(B,BASE_MIN,n)?1:0;
  /* ПАЛАТА (M408): начисляет всегда — база работает, стоит на консервации или
     лежит под завалом, ей всё равно. Сбор берётся за реестр */
  if(typeof palStep==="function")said|=palStep(B,n)?1:0;
  /* жизнеобеспечение (M391) считается ПЕРВЫМ: оно решает, работает ли база в
     эту смену вообще */
  said|=baseLifeStep(B,P,n)?1:0;
  /* тепло (M392): жара точит технику, криоцех гонит газы в криоген */
  said|=baseHeatWear(B,n)?1:0;
  /* закон 4 (M401, §22): изнашивается всё и всегда — база в равновесии
     выходит из него сама */
  if(typeof baseWearStep==="function")said|=baseWearStep(B,n)?1:0;
  said|=baseCryoMake(B,P,n)?1:0;
  if(B.wake){B.wake=0;return;}      /* смена на раскочегарку: ни добычи, ни сдачи */
  if(!baseParked(B)){
    /* директор (M397) — ПОСЛЕ жизнеобеспечения и только для живой базы: один
       бросок на всё, с прогнозом на смену вперёд. Два отдельных броска,
       которые ни на что не смотрели, кончились здесь. К базе, которая в эту же
       смену встала, погода не приходит: ей уже хватило */
    said|=(typeof baseDirStep==="function")?(baseDirStep(B,n)?1:0)
         :((baseRaid(B,BASE_MIN,n)?1:0)|(baseStorm(B,BASE_MIN,n)?1:0));
    said|=baseEarn(B,P,BASE_MIN,n)?1:0;
    said|=baseMine(B,P,BASE_MIN,n)?1:0;
    /* плата решённой базы (M403, §23.1): то, чего нигде не купить */
    if(typeof baseUniqStep==="function")said|=baseUniqStep(B,n)?1:0;
    /* управляющий (M405): жалованье, доля и изъян — после всего, что он вёл */
    if(typeof bmgrStep==="function")said|=bmgrStep(B,n)?1:0;
    /* опорный пункт экспедиции (M409, §44): трафик мира сворачивает сюда */
    if(typeof fwdStep==="function")said|=fwdStep(B,n)?1:0;
    /* и он же развивает базу (M407): строят все, правильно — один */
    if(typeof devSupply==="function")said|=devSupply(B,n)?1:0;
    if(typeof devStep==="function")said|=devStep(B,n)?1:0;
  }
  /* тихая смена тоже строка — но не каждая: журнал, в котором пусто, читается
     как поломка, а журнал из одних «тихо» вытесняет то, ради чего его открыли.
     Раз в четыре смены, и по НОМЕРУ смены, а не по тому, когда заглянули:
     иначе десять заходов по смене писали бы вчетверо больше одного захода на
     десять смен — и журнал стал бы отчётом о поведении игрока */
  if(!said&&(n%4)===0)baseLog(B,"quiet",n);
}
/* ── излишки станции ──
   Тот же расчёт, что был поминутно (M240): платят за спил РАБОТАЮЩЕЙ базы и не
   больше, чем она съедает сама. */
function baseEarn(B,P,min,n){
  if(!(P.surplus>0&&P.cons>0&&mgrPerkOf("keep","grid")))return 0;
  const sell=Math.min(P.surplus,P.cons);
  const cr=Math.round(sell*min*1.4);
  if(cr<=0)return 0;
  earn(cr,"base");
  B.sold=(B.sold|0)+cr;
  B._earned=(B._earned|0)+cr;      /* с этого управляющий возьмёт свою долю */
  B._turn=(B._turn|0)+cr;          /* а ПАЛАТА — свою долю с оборота (M408) */
  if(B.sold>=400){
    logAdd("money","База «"+B.name+"» сдала излишки энергии · +"+B.sold.toLocaleString("ru")+" кр");
    baseLog(B,"grid",n,{cr:B.sold});
    B.sold=0;
    return 1;
  }
  return 0;
}
/* ── добыча и передел ── */
function baseMine(B,P,min,n){
  if(!P.drills)return 0;
  const cap=P.store,held=basePoolHeld(B);
  const crewBoost=1+baseRoleForce(B,"driller")*.45;
  const eff=clamp(P.eff+baseRoleForce(B,"engineer")*.18,0,1);
  /* тепло (M392): в жару бур встаёт, в мороз люди медленнее */
  const heat=(typeof baseHeatMul==="function")?baseHeatMul(B,n):1;
  /* склад под боком (M396): успевает лечь больше */
  const adj=(typeof baseAdjMine==="function")?baseAdjMine(B):1;
  /* погода (M397): занос останавливает бур, жила гонит его вдвое веселее */
  if(typeof baseDusty==="function"&&baseDusty(B,n))return 0;
  const vein=(typeof baseVein==="function")?baseVein(B,n):1;
  /* устав (M399): двойная смена гонит всё, общий котёл придерживает */
  const law=(typeof charterWorkMul==="function")?charterWorkMul(B):1;
  /* порода и тяжесть (M400): богатая порода и тяжёлый мир бурятся лучше */
  const world=(typeof dialOreMul==="function")?dialOreMul(B)*clamp(dialGrav(B),.8,1.4):1;
  /* закон 5 (M401): пьющий работает вполсилы смену через смену */
  const folk=(typeof baseDrinkMul==="function")?baseDrinkMul(B,n):1;
  /* управляющий (M405): база выдаёт ту долю своего потенциала, какую он умеет
     вытянуть. Плохой хуже, чем никакого, — так и задумано (§48.2) */
  const mgr=(typeof bmgrWorkMul==="function")?bmgrWorkMul(B):1;
  /* режим участка (M408, §29): «простой» и правда простой — один бур в счёт и
     наёмные не в помощь. Это не наказание, а честная сделка за тишину */
  const pal=(typeof palCapWork==="function")?palCapWork(B):1;
  const want=min*P.drillEff*eff*crewBoost*heat*adj*vein*law*world*folk*mgr*pal*1.1;
  let left=Math.min(want,Math.max(0,cap-held));
  const full=want>0&&left<want*.5;      /* склад забит: добыча стоит, и это строка */
  const r=rng(hashi(B.sx*7919+B.sy,B.idx,hashi(n,0x9111,0x2D)));
  const pool=(B.res&&B.res.length)?B.res:["iron"];
  while(left>=1){
    const k=pick(pool,r);
    B.pool[k]=(B.pool[k]|0)+1;left--;
  }
  let melted=0;
  if(P.ref){
    const melt=mgrPerkOf("keep","melt");
    let conv=Math.floor(min*P.ref*(melt?1:eff)*(melt?.3:.15));
    while(conv>0){
      let src=null;
      for(const k in B.pool)if((B.pool[k]|0)>=4&&RARE_RES.indexOf(k)<0){src=k;break;}
      if(!src)break;
      B.pool[src]-=4;B.pool.alloy=(B.pool.alloy|0)+1;conv--;melted++;
    }
  }
  let said=0;
  if(full&&!B.fullSaid){B.fullSaid=1;baseLog(B,"full",n,{who:baseWho(B,"driller")});said=1;}
  if(!full)B.fullSaid=0;
  if(melted>=4){baseLog(B,"melt",n,{q:melted});said=1;}
  return said;
}
/* ══════════════ воздух и вода (M391, DESIGN-base §4–6, §13) ══════════════
   С этой вехи базу можно уморить — и ровно поэтому она становится игрой. Но
   уморить её нельзя НАСМЕРТЬ: §13 говорит прямо — база потребляет, только пока
   работает, и перестаёт работать раньше, чем начнёт голодать. Кончился запас —
   база встала: добыча и передел стоят, люди на малом ходу едят втрое меньше,
   журнал пишет, в какую смену это случилось. Ничего не рушится, никто не
   умирает, долг не копится. Теряются темп и время.

   Расход считают только ЛЮДИ. Пустая база не ест ничего и стоять может вечно —
   иначе всякий, кто заложил базу и улетел, возвращался бы к развалине, ни разу
   не согласившись на эту игру. */
const LIFE_AIR=2;            /* воздуха на человека за смену (§16) */
const LIFE_WATER=2;          /* и воды столько же */
const LIFE_CAP=240;          /* потолок запаса: сутки на пятерых с запасом */
const LIFE_START=120;        /* с чем база начинает и с чем грузится старая запись */
const LIFE_LOW=3;            /* малый ход: расход втрое меньше */
const LIFE_LYSE={ice:6,air:6};    /* электролизёр: лёд → воздух */
const LIFE_MELT={ice:8,water:8};  /* ледоплавка:  лёд → вода */
/* чем снабжают с борта (§16): холдинг это уже делает, а есть было некому */
const LIFE_SUPPLY={oxygen:{k:"air",q:8},ice:{k:"water",q:1}};
/* криоген — не запас, а срок: единица держит холод двенадцать смен (§16) */
const LIFE_COOL={cryo:1};
/* порядок отключения (§13): сперва то, ради чего база стоит, потом то, чем она
   живёт. Жизнеобеспечение гасят последним и в этой вехе не гасят вовсе */
const BASE_STANDBY=[["drill","добыча"],["refinery","передел"],["lab","свет"]];
function baseLife(B){
  if(!B.life||typeof B.life!=="object")B.life={air:LIFE_START,water:LIFE_START};
  if(typeof B.life.air!=="number")B.life.air=LIFE_START;
  if(typeof B.life.water!=="number")B.life.water=LIFE_START;
  if(typeof B.life.food!=="number")B.life.food=LIFE_START;
  if(typeof B.life.q!=="string")B.life.q="good";
  return B.life;
}
function baseCrewN(B){return (typeof baseStaff==="function")?baseStaff(B).length:0;}
function baseParked(B){return !!(B&&B.park);}
/* нужда за смену. Харч тут же, третьим полем: без него всякий, кто спросит
   `need.food`, получит `undefined` и сравнение с ним — тихую ложь (так и
   вышло у снабжения M407, и набор это поймал) */
function baseLifeNeed(B){
  const n=baseCrewN(B),d=baseParked(B)?LIFE_LOW:1;
  return {air:Math.ceil(n*LIFE_AIR/d),water:Math.ceil(n*LIFE_WATER/d),
          food:Math.ceil(n*LIFE_FOOD/d)};
}
/* сколько на базе живых машин жизнеобеспечения */
function baseLifeMakers(B){
  let lyse=0,melter=0;
  for(const cell of B.cells)if(cell&&cell.hp>0){
    if(cell.k==="lyse")lyse++;
    else if(cell.k==="melter")melter++;
  }
  return {lyse,melter};
}
/* сколько смен продержится база на том, что есть */
function baseLifeLeft(B){
  const L=baseLife(B),N=baseLifeNeed(B);
  return {air:N.air?Math.floor(L.air/N.air):999,water:N.water?Math.floor(L.water/N.water):999};
}
function basePark(B,why,n,what){
  if(B.park)return false;
  B.park=(why==="hand")?-1:((n|0)||1);
  baseLog(B,"park",n,{by:why,what:what||"воздух"});
  logAdd(why==="hand"?"tech":"warn","База «"+B.name+"»: "+
    (why==="hand"?"консервация":"встала — кончился запас ("+(what||"воздух")+")"));
  return true;
}
function baseWake(B,n,by){
  if(!B.park)return false;
  B.park=0;
  B.wake=1;                       /* смена на раскочегарку: она ничего не даёт */
  baseLog(B,"wake",n,{by:by||"supply"});
  logAdd("tech","База «"+B.name+"»: "+(by==="hand"?"расконсервация":"снова в работе"));
  return true;
}
/* ── одна смена жизнеобеспечения ──
   Машины делают из льда воздух и воду, люди их тратят. Всё целое, всё за один
   проход, и порядок важен: сперва произвели, потом съели. */
function baseLifeStep(B,P,n){
  const L=baseLife(B),M=baseLifeMakers(B),eff=clamp(P.eff,0,1);
  let said=0;
  /* производство: сколько машин, столько и льда со склада. Лёд кончился —
     машина стоит, и это не поломка, а пустой склад */
  /* жизнеобеспеченец (M395): его треть — здесь, в самом производстве */
  const boost=(typeof baseLifeBoost==="function")?baseLifeBoost(B):1;
  const k=((eff<.5)?.5:eff)*boost;
  const make=(cnt,rec,key)=>{
    for(let i=0;i<cnt;i++){
      if(L[key]>=LIFE_CAP)return;
      /* лёд машина ест по своей мерке, а не по мерке человека при ней:
         иначе жизнеобеспеченец ел бы больше, чем экономил */
      const need=Math.ceil(rec.ice*((eff<.5)?.5:eff));
      if((B.pool.ice|0)<need)return;
      B.pool.ice-=need;
      L[key]=Math.min(LIFE_CAP,L[key]+Math.round(rec[key]*k));
    }
  };
  /* подача (M396): ледоплавка рядом с электролизёром отдаёт ему талую воду
     прямо, и льда тому нужно меньше. Ледяной мир (M400) отдаёт её даром */
  const free=(typeof dialIceFree==="function")&&dialIceFree(B);
  const feed=((typeof baseAdjIce==="function")?baseAdjIce(B):0)+(free?3:0);
  make(M.lyse,feed?{ice:Math.max(1,LIFE_LYSE.ice-feed),air:LIFE_LYSE.air}:LIFE_LYSE,"air");
  /* зелень в жилом (M396): немного воздуха сверх того, что даёт оранжерея */
  if(typeof baseAdjAir==="function"&&baseAdjAir(B))
    L.air=Math.min(LIFE_CAP,L.air+baseAdjAir(B));
  /* мороз (M392): вода не тает. Не «медленнее» — не тает вовсе, и это видно
     по шкале заранее */
  if(!baseFrozen(B,n))make(M.melter,LIFE_MELT,"water");
  /* харч (M393) растёт здесь же: оранжерея пьёт ту самую воду, что натаяла
     ледоплавка, и отдаёт заодно немного воздуха */
  said|=baseFoodStep(B,P,n)?1:0;
  /* давление (M400, §21.1): на мире с атмосферой воздух уходит сам, и на
     двойке электролизёр становится не решением, а беговой дорожкой */
  const leak=(typeof dialLeak==="function")?dialLeak(B):0;
  if(leak&&baseCrewN(B))L.air=Math.max(0,L.air-leak);
  /* расход: только людьми и только пока они тут */
  const need=baseLifeNeed(B);
  if(need.air||need.water){
    const outAir=L.air-need.air,outWater=L.water-need.water;
    L.air=Math.max(0,outAir);L.water=Math.max(0,outWater);
    if((outAir<0||outWater<0)&&!B.park){
      basePark(B,"empty",n,outAir<0?"воздух":"вода");
      said=1;
    }
  }
  /* харч не останавливает базу: голод — это про дух, а не про механизмы.
     Голодная база работает и теряет людей, и это разные наказания */
  const eat=baseLifeNeed(B).food;
  if(eat){
    const wasFed=(L.food|0)>0;
    L.food=Math.max(0,(L.food|0)-eat);
    if(wasFed&&L.food<=0){baseLog(B,"hungry",n);said=1;}
  }
  said|=baseSpiritStep(B,n)?1:0;
  /* маяк зовёт (M395): раз в тридцать смен кто-то просится остаться */
  if(typeof baseGuestRoll==="function")said|=baseGuestRoll(B,n)?1:0;
  /* развалина (M402, §39): брошенная по-настоящему база доходит до неё за
     сутки — и с этого дня её можно вернуть, но нельзя потерять навсегда */
  if(typeof baseRuinCheck==="function")said|=baseRuinCheck(B,n)?1:0;
  /* открытая дверь (M399): однажды пропадает треть склада */
  if(typeof charterThiefStep==="function")said|=charterThiefStep(B,n)?1:0;
  /* запас пришёл — база встаёт на ход сама, но смена уходит на разгон */
  if(B.park>0&&L.air>need.air&&L.water>need.water){baseWake(B,n);said=1;}
  return said;
}
/* ── снабжение с борта (§14, §16) ──
   Тот самый ответ на «и что мне делать с этими материалами»: кислород и лёд из
   трюма становятся запасом базы. Ничего не покупается и не продаётся — вещь
   переезжает туда, где её ждут. */
function baseSupply(B,k,q){
  /* харч с борта (§16): консервы кормят хорошо, синтебелок — сытно и скверно */
  const F=FOOD_SUPPLY[k];
  if(F&&B){
    q=Math.min(q|0,G.cargo[k]|0);
    if(q<=0)return 0;
    G.cargo[k]-=q;
    const L=baseLife(B);
    L.food=Math.min(LIFE_CAP,(L.food|0)+F.q*q);
    L.q=F.good?"good":"poor";
    tell("good","На базу «"+B.name+"» сдано "+q+" "+RES[k].ru.toLowerCase(),
      "СНАБЖЕНИЕ\n"+RES[k].ru+" "+q+" → харч "+L.food+"/"+LIFE_CAP+
      (F.good?"":"\nбак и консервы — разное: от скверного харча падает дух"));
    return q;
  }
  /* криоген кладётся не в шкалу, а в срок: холод на двенадцать смен вперёд */
  if(LIFE_COOL[k]&&B){
    q=Math.min(q|0,G.cargo[k]|0);
    if(q<=0)return 0;
    G.cargo[k]-=q;
    const n=(typeof baseShift==="function")?baseShift():0;
    const had=baseCryoOn(B,n);
    B.cryo={until:n+HEAT_CRYO_SH,q:had+HEAT_CRYO*q};
    tell("good","На базу «"+B.name+"» сдано "+q+" криоген"+pl3(q,"","а","ов"),
      "СНАБЖЕНИЕ\nкриоген "+q+" → холод на "+HEAT_CRYO_SH+" смен");
    return q;
  }
  const S=LIFE_SUPPLY[k];
  if(!B||!S)return 0;
  q=Math.min(q|0,G.cargo[k]|0);
  if(q<=0)return 0;
  const L=baseLife(B);
  G.cargo[k]-=q;
  /* лёд ложится и на склад базы: он и вода, и сырьё для обеих машин */
  if(k==="ice")B.pool.ice=(B.pool.ice|0)+q;
  L[S.k]=Math.min(LIFE_CAP,L[S.k]+S.q*q);
  const n=(typeof baseShift==="function")?baseShift():0;
  if(B.park>0)baseWake(B,n);
  tell("good","На базу «"+B.name+"» сдано "+q+" "+RES[k].ru.toLowerCase(),
    "СНАБЖЕНИЕ\n"+RES[k].ru+" "+q+" → "+(S.k==="air"?"воздух":"вода")+" "+L[S.k]+"/"+LIFE_CAP);
  return q;
}
/* строка для стола: чем база дышит и сколько ей осталось */
function baseLifeLine(B){
  const L=baseLife(B),left=baseLifeLeft(B),M=baseLifeMakers(B);
  /* закон 3 (M401, §22): цифры — это радист и приборы. Без них шкалы говорят
     словами, и это не скупость интерфейса, а цена сведений */
  const head=((typeof baseGaugeLine==="function")?baseGaugeLine(B)
             :("воздух "+L.air+" · вода "+L.water+" · харч "+(L.food|0)))+
    (L.q==="poor"?" (скверный)":"")+
    (baseCrewN(B)?" · дух "+baseSpirit(B)+"%":"")+
    ((typeof baseHeatLine==="function")?" · "+baseHeatLine(B):"");
  if(!baseCrewN(B))return head+" · людей нет, расхода нет";
  const n=Math.min(left.air,left.water);
  return head+" · хватит на "+n+" "+pl3(n,"смену","смены","смен")+
    ((M.lyse||M.melter)?"":" · машин жизнеобеспечения нет");
}
/* ── где остальное ──
   Тепло (M392) живёт в `21a1a-base-heat`, харч и дух (M393) — в
   `21a1b-base-food`. Разрезано на 0.409.0, когда файл дорос до пятидесяти
   килобайт: резали по швам вех, а не посередине семьи функций. */
/* ── догнать одну базу ──
   Возвращает, сколько смен отыграно. Хвост длиннее суток отбрасывается: это и
   есть `CREW_OFFLINE_CAP`, только в сменах. */
function baseResolve(B,now){
  if(!B)return 0;
  now=now||Date.now();
  /* развалина (M402) не работает: в ней некому и нечем. Часы ей всё равно
     двигаем — по ним считается, когда в неё въедут. И ПАЛАТА (M408) считает
     тоже: сбор идёт за нахождение В РЕЕСТРЕ, а брошенная база из него не
     исчезает — это и есть самая жестокая строка §30 */
  if(typeof baseIsRuin==="function"&&baseIsRuin(B)){
    const nn=baseSince(B,now);
    if(nn>0){
      const t0=baseT0(B);
      for(let i=1;i<=nn;i++)if(typeof palStep==="function")palStep(B,t0+i);
      B.t0=t0+nn;B.tMs=now;
      if(typeof baseTenant==="function")baseTenant(B,B.t0);
    }
    return 0;
  }
  const n=baseSince(B,now);
  if(n<=0){baseT0(B);B.tMs=now;return 0;}
  const t0=baseT0(B);
  B.t0=t0+n;B.tMs=now;
  baseGrowCheck(B);
  /* глубже суток не помним. Всё, что старше 24 смен, сводится одной строкой и
     считается ровно так же, но без бросков: подробности позавчерашней бури
     никому не нужны, а руда за неё — нужна */
  const deep=Math.max(0,n-BASE_DETAIL);
  if(deep>0){
    const P=basePower(B);
    baseEarn(B,P,BASE_MIN*deep,t0+deep);
    baseMine(B,P,BASE_MIN*deep,t0+deep);
    baseLog(B,"away",t0+deep,{from:t0+1,to:t0+deep});
  }
  for(let i=deep;i<n;i++)baseShiftRun(B,t0+i+1);
  return n;
}
/* ── догнать все ──
   Зовётся из тех же трёх мест, откуда звался `baseTick`: вход в базу, кадр
   сцены и домашний стол. */
function baseResolveAll(){
  const now=Date.now();
  for(const key in G.bases)baseResolve(G.bases[key],now);
}
