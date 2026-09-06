/* ══════════════ база на планете: вид в разрезе ══════════════ */
/* Планета остаётся плоской 2D, объём даёт разрез: сверху небо и грунт, ниже —
   вкопанные отсеки, коридоры и шахта лифта. Видно всё сразу — реактор светится,
   бур уходит в породу, в жилом горит свет. Ходьба, свет и камера — те же, что
   в пещере, поэтому сцена стоит дёшево. */
const BASE_COLS=5, BASE_ROWS=4, BASE_ROWS_DEEP=5, BCELL_W=150, BCELL_H=104;
/* Начало сетки отсеков (M138): блок сидит В ГОРЕ — правее ворот на две ячейки
   и на ярус выше уровня равнины (150). От ворот к нему ведёт тоннель */
const BASE_OX=390, BASE_OY=46, BASE_GY=150, BASE_GATE_X=105;
/* «Второй ярус» смотрителя: базе разрешён ещё ряд вниз. Однажды вскрытый ярус
   остаётся у базы навсегда — иначе расчёт со смотрителем стирал бы построенное
   вместе с ним. Поэтому число рядов живёт на самой базе, а перк только его даёт. */
function baseRows(B){return B?Math.max(B.rows|0,BASE_ROWS):BASE_ROWS;}
function baseGrowCheck(B){
  if(!B||(B.rows|0)>=BASE_ROWS_DEEP)return false;
  if(!mgrPerkOf("keep","deep"))return false;
  B.rows=BASE_ROWS_DEEP;
  while(B.cells.length<BASE_COLS*B.rows)B.cells.push(null);
  logAdd("tech","База «"+B.name+"»: смотритель вскрыл нижний ярус");
  if(typeof baseLog==="function")baseLog(B,"deep",(typeof baseShift==="function")?baseShift():0);
  return true;
}
const BUILD={
  reactor:{ru:"Реактор",    cost:{credits:1800,alloy:6},  power:14, note:"даёт энергию всей базе; рядом с буром потерь меньше"},
  solar:  {ru:"Солнечная панель",cost:{credits:700,alloy:2},power:5,surfaceOnly:true,
           note:"только на верхнем уровне, отдача зависит от класса звезды"},
  drill:  {ru:"Буровая",    cost:{credits:1400,alloy:4},  power:-9, note:"тянет ресурс из залежи под базой"},
  storage:{ru:"Склад",      cost:{credits:600,alloy:2},   power:-1, note:"+120 к тому, сколько база может накопить"},
  habitat:{ru:"Жилой отсек",cost:{credits:1200,alloy:3},  power:-4, note:"места для персонала; рядом с реактором людям хуже"},
  refinery:{ru:"Плавильня", cost:{credits:2200,alloy:8},  power:-11,note:"сама переплавляет добытое в сплавы"},
  pad:    {ru:"Площадка",   cost:{credits:2600,alloy:10}, power:-3, note:"причал для переброски между базами"},
  /* батарея (M111): строится, а не покупается, и стоит в общем балансе мощности —
     оборона конкурирует с добычей, и это настоящее решение. Только наверху:
     она бьёт с грунта, и с орбиты видно её линию. */
  battery:{ru:"Батарея",    cost:{credits:2400,alloy:9},  power:-12,surfaceOnly:true,
           note:"бьёт по мелочи в своей системе; барона и охотника ей не взять"},
  /* ── жизнеобеспечение (M391, DESIGN-base §6) ──
     Два первых модуля, ради которых у базы вообще заводится запас: один делает
     из льда воздух, другой из льда воду. Оба едят лёд из склада самой базы —
     значит база с ледяной залежью кормит себя сама, а база без неё живёт
     привозом. Это и есть ответ на «что делать с материалами» из §14. */
  lyse:   {ru:"Электролизёр",cost:{credits:1500,alloy:4},power:-8,
           note:"лёд → воздух; без него на базе не дышат"},
  /* тепло (M392, §4, §16): радиатор сбрасывает его в небо и потому стоит
     только наверху — и потому же буря берёт его первым. Криоцех платит по
     обещанию `02-world`: летучие газы наконец кому-то нужны */
  radiator:{ru:"Радиатор",   cost:{credits:900,alloy:3}, power:-2,surfaceOnly:true,
           note:"сбрасывает тепло в небо; только наверху, буря бьёт его первым"},
  cryo:   {ru:"Криоцех",     cost:{credits:2800,alloy:9},power:-10,
           note:"летучие газы → криоген; и сам холодит сильнее всего на базе"},
  /* харч (M393, §6, §16): два способа кормить людей и разница между ними не в
     числе, а во вкусе. Оранжерея кормит хорошо и требует воды и посадки; бак
     кормит вдвое сытнее и невкусно, и за невкусно платят духом */
  /* мачта (M394, §45): база перестаёт быть точкой на карте и становится
     голосом в приёмнике. Только наверху — она смотрит в небо */
  mast:   {ru:"Мачта",       cost:{credits:1100,alloy:3},power:-3,surfaceOnly:true,
           note:"слышно базу по всему кругу, а не за три сектора"},
  /* маяк (M395, §6): единственный модуль, который приводит ЛЮДЕЙ */
  beacon: {ru:"Маяк",        cost:{credits:1400,alloy:3},power:-3,
           note:"раз в тридцать смен кто-то приходит и просится остаться"},
  /* два модуля из §6, на которые ссылается таблица соседства (M396). Оба
     делают ровно то, что написано, и ни слова сверх: обещание без кода —
     ложь, и правилами проекта запрещено прямо */
  med:    {ru:"Лазарет",     cost:{credits:1700,alloy:4},power:-4,
           note:"+4 духа жилому отсеку по соседству"},
  /* гермозатвор (M397, §6, §10.3): единственное, что останавливает ходячую
     беду. Ничего не производит и стоит копейки — он про план, а не про цифры */
  seal:   {ru:"Гермозатвор",  cost:{credits:600,alloy:2}, power:-1,
           note:"беда через него не переходит: пожар останавливается тут"},
  shop:   {ru:"Мастерская",  cost:{credits:1500,alloy:4},power:-5,
           note:"чинит сама, без инженера; соседний отсек — вдвое быстрее"},
  garden: {ru:"Оранжерея",   cost:{credits:1600,alloy:4},power:-4,
           note:"вода → харч и немного воздуха; на посадку нужна органика"},
  vat:    {ru:"Белковый бак",cost:{credits:1900,alloy:5},power:-6,
           note:"органика → харч, много и невкусно; от такого харча падает дух"},
  melter: {ru:"Ледоплавка",  cost:{credits:1300,alloy:3},power:-5,
           note:"лёд → вода; людям и оранжерее"},
  /* дорогая, прожорливая и мёртвая без жилого отсека рядом: разбирать образцы
     вахтой из скафандра нельзя, а исследователю больше работать негде */
  lab:    {ru:"Лаборатория", cost:{credits:3200,alloy:12},power:-16,needTech:"lab",
           note:"рабочее место исследователя; нужен жилой отсек по соседству"}
};
const BUILD_KEYS=Object.keys(BUILD);
function baseKey(sx,sy,idx){return sx+","+sy+":"+idx;}
function baseAt(sx,sy,idx){return G.bases[baseKey(sx,sy,idx)]||null;}
/* смета смотрителя удешевляет стройку — поэтому цена берётся здесь, а не из
   таблицы напрямую: и в интерфейсе, и при оплате она должна быть одна и та же */
function baseCost(k,B){
  /* мастерская (M396): на базе, где она стоит, стройка дешевле на пятнадцать
     процентов — она и есть та причина, по которой мастерскую ставят первой */
  let shop=1;
  if(B&&B.cells)for(const cell of B.cells)if(cell&&cell.hp>0&&cell.k==="shop"){shop=.85;break;}
  /* тяжесть (M400): на тяжёлом мире всё дороже поднимать и ставить */
  const grav=(B&&typeof dialBuildMul==="function")?dialBuildMul(B):1;
  const d=mgrBuildDiscount()*shop*grav,c=BUILD[k].cost;
  if(d>=1)return c;
  return {credits:Math.round(c.credits*d),alloy:c.alloy?Math.max(1,Math.round(c.alloy*d)):c.alloy};
}
function canPay(cost){return G.credits>=cost.credits&&(!cost.alloy||G.cargo.alloy>=cost.alloy);}
function payCost(cost){G.credits-=cost.credits;if(cost.alloy)G.cargo.alloy-=cost.alloy;}
function foundBase(p){
  const cost={credits:2500,alloy:10};
  if(!canPay(cost)){
    say("Для закладки базы нужно\n2500 кр и 10 сплавов\n(сплавы — на промышленной станции)");
    return false;
  }
  payCost(cost);
  const cells=[];
  for(let i=0;i<BASE_COLS*BASE_ROWS;i++)cells.push(null);
  cells[Math.floor(BASE_COLS/2)]={k:"reactor",hp:1};   // без энергии база мертва, поэтому реактор в подарок
  G.bases[baseKey(G.sx,G.sy,p.idx)]={sx:G.sx,sy:G.sy,idx:p.idx,name:p.name,type:p.type,
    res:p.res.slice(0,3),cells,pool:{},tMs:Date.now(),built:Date.now()};
  tell("money","Заложена база на "+p.name+" · −2500 кр, 10 сплавов","База заложена\n"+p.name);
  return true;
}
function enterBase(p){
  const B=baseAt(G.sx,G.sy,p.idx);if(!B)return;
  baseResolveAll();
  if(typeof planDeliver==="function")planDeliver(B);   /* изделие комбината — в запас базы (11r) */
  /* ярус проверяем и на входе: иначе вскрытый нижний ряд появлялся бы только
     после следующего тика, и игрок не понимал бы, что уже можно строить ниже */
  baseGrowCheck(B);
  G.base={B,p,cur:Math.floor(BASE_COLS/2),row:0,x:0,y:0,walkPhase:0,menu:false,pick:0,
    pmenu:false,ppick:0,lockHeld:0,avr:null,avrDone:0};
  G.base.x=cellX(G.base.cur);G.base.y=cellY(0);
  G.mode="base";
  for(const k in keys)keys[k]=false;
  /* ── визит начинается с журнала (M390, §12) ──
     Ради этого сюда и прилетают: не построить ещё один отсек, а узнать, что
     тут без вас было. Подсказка про ходьбу остаётся последней строкой — она
     нужна в первый раз, а журнал нужен каждый. */
  const J=(typeof baseLogList==="function")?baseLogList(B,3):[];
  say((J.length?J.map(x=>"смена "+((x.n|0)%1000)+" · "+x.t).join("\n")+"\n":"")+
    "◀ ▶ — переход · ▲ ▼ — уровни · ДЕЙСТВИЕ — строить · НАЗАД — наружу");
}
function exitBase(){
  G.base=null;G.mode="surface";
  say("Выход на поверхность");
}
function cellX(c){return BASE_OX+c*BCELL_W+BCELL_W/2;}
function cellY(r){return BASE_OY+r*BCELL_H+BCELL_H/2;}
/* ── адрес клетки ──
   Колонка −1 — это ствол (M396), и он НЕ КЛЕТКА. Без этой проверки `-1`
   складывался с началом ряда и возвращал последнюю клетку предыдущего: сцена
   честно рисовала над стволом рамку с надписью «РАДИАТОР». */
function baseCell(B,c,r){
  if(c<0||c>=BASE_COLS||r<0||r>=baseRows(B))return null;
  return B.cells[r*BASE_COLS+c];
}
function baseSet(B,c,r,v){
  if(c<0||c>=BASE_COLS||r<0||r>=baseRows(B))return;
  B.cells[r*BASE_COLS+c]=v;
}
/* ══════════════ энергия и соседство ══════════════ */
/* Энергобаланс — центральная механика и причина рисовать разрез: нехватка не
   строка в таблице, а тусклый свет и вставший бур. */
function baseNeighbors(B,c,r){
  const out=[];
  for(const [dc,dr] of [[-1,0],[1,0],[0,-1],[0,1]]){
    const cc=c+dc,rr=r+dr;
    if(cc<0||cc>=BASE_COLS||rr<0||rr>=baseRows(B))continue;
    const cell=baseCell(B,cc,rr);
    if(cell)out.push(cell.k);
  }
  return out;
}
function basePower(B){
  let prod=0,cons=0,core=0,drills=0,drillEff=0,hab=0,habPenalty=0,store=0,ref=0,pads=0,guns=0;
  /* свет (M400, §21.1): отдача панели — ручка планеты, а не только звезда:
     на тусклом мире реактор остаётся единственным выходом */
  const cls=(typeof dialLight==="function")?dialLight(B)
           :((getSystem(B.sx,B.sy).cls&&getSystem(B.sx,B.sy).cls.lum)||1);
  for(let r=0;r<baseRows(B);r++)for(let c=0;c<BASE_COLS;c++){
    const cell=baseCell(B,c,r);if(!cell||cell.hp<=0)continue;   // разбитый отсек не работает и не ест энергию
    const M=BUILD[cell.k];if(!M)continue;
    const near=baseNeighbors(B,c,r);
    if(cell.k==="solar"){prod+=M.power*(r===0?1:.25)*cls;continue;}
    if(M.power>0){prod+=M.power;continue;}
    let use=-M.power;
    /* передача (M396, §7): та же скидка теперь и электролизёру с криоцехом —
       она про провод, а не про бур */
    if((cell.k==="lyse"||cell.k==="cryo")&&near.indexOf("reactor")>=0)use*=.78;
    if(cell.k==="drill"){
      /* реактор по соседству — меньше потерь в передаче */
      const wired=near.indexOf("reactor")>=0;
      use*=wired?.78:1;
      /* глубина (M392, §7): каждый ряд ниже первого — плюс восемь процентов
         выработке. Внизу порода богаче, и это единственная причина копать
         вглубь, кроме места; платят за это теплом */
      drills++;drillEff+=(wired?1.2:1)*(1+r*.08);
    }
    if(cell.k==="habitat"){
      hab++;
      if(near.indexOf("reactor")>=0)habPenalty++;
    }
    if(cell.k==="storage")store+=120;
    if(cell.k==="refinery")ref++;
    if(cell.k==="pad")pads++;
    if(cell.k==="battery")guns++;
    /* зал (M396, §7): три одинаковых подряд едят на треть меньше — общая
       стена, общий контур, общий человек. Цена у этого своя, и её берёт беда */
    if(typeof baseHallAt==="function"&&baseHallAt(B,c,r))use*=HALL_POWER;
    /* ядро нагрузки — то, ради чего база стоит: остальное можно и притушить */
    if(cell.k==="drill"||cell.k==="lab")core+=use;
    cons+=use;
  }
  /* ── ветка «Энергия» смотрителя ──
     «Переброс»: при нехватке половина необязательной нагрузки сбрасывается,
     и мощность достаётся тому, ради чего база и стоит, — буру и лаборатории.
     «Стабилизация»: реактор держит нижний порог и не глохнет совсем. */
  let load=cons;
  if(mgrPerkOf("keep","power")&&cons>core)load=core+(cons-core)*.5;
  let eff=load<=0?1:clamp(prod/load,0,1);
  if(mgrPerkOf("keep","stable"))eff=Math.max(eff,.35);
  /* «Излишки»: всё, что база не съела, уходит станции — редкий случай,
     когда лишний реактор осмысленно ставить нарочно */
  const surplus=Math.max(0,prod-cons);
  return {prod:Math.round(prod*10)/10,cons:Math.round(cons*10)/10,eff,surplus,
    drills,drillEff,hab,habPenalty,store:180+store,ref,pads,guns};
}
function basePoolHeld(B){let s=0;for(const k in B.pool)s+=B.pool[k]|0;return s;}
/* ══════════════ ленивое время базы ══════════════ */
/* Часы базы, её смена и журнал живут в `21a1-base-life` (M390): здесь остались
   только сами события — налёт, буря, починка, — потому что они про место, а не
   про время. `baseTick` больше нет: его заменил `baseResolveAll`. */
/* ══════════════ налёты пиратов на базу ══════════════ */
/* Разрешаются ленивым счётчиком, без отдельной сцены: последствия видно в
   разрезе (разбитый отсек) и в журнале. Охранник — единственная защита, и
   поэтому осмысленный. */
function baseRaid(B,min,sh){
  const danger=sysDanger(B.sx,B.sy);
  if(danger<=.05)return 0;
  const chance=min*danger*.012;
  /* бросок берётся от НОМЕРА СМЕНЫ (M390): одна и та же смена одной и той же
     базы разрешается одинаково, сколько раз её ни считай. Прежний seed шёл от
     стенных часов и счётчика заходов — тогда исход зависел от того, как часто
     заглядывали, и повторить его было нельзя */
  const r=(typeof sh==="number")
    ?rng(hashi(B.sx*131+B.sy,B.idx*7+3,hashi(sh,0x2A1D,0x7)))
    :rng(hashi(B.sx*131+B.sy,B.idx*7+3,hashi(B.tMs|0,(B.raidSeq=(B.raidSeq|0)+1),0x2A1D)));
  if(r()>chance)return 0;
  const guard=baseRoleForce(B,"guard");
  if(guard>0&&r()<guard*.7){
    logAdd("kill","Налёт на базу «"+B.name+"» отбит охраной");
    baseLog(B,"raid_off",sh,{who:baseWho(B,"guard")});
    return 1;
  }
  /* без охраны пропадает часть накопленного, иногда ломается отсек */
  let lost=0;
  for(const k in B.pool){
    const q=B.pool[k]|0;if(q<=0)continue;
    const t=Math.ceil(q*(.3+r()*.4));B.pool[k]=q-t;lost+=t;
  }
  let broke=null;
  if(r()<.4){
    const live=[];
    for(let i=0;i<B.cells.length;i++)if(B.cells[i]&&B.cells[i].hp>0&&B.cells[i].k!=="reactor")live.push(i);
    if(live.length){
      const i=live[Math.floor(r()*live.length)];
      B.cells[i].hp=0;broke=BUILD[B.cells[i].k].ru;
      if(typeof baseHallHit==="function")baseHallHit(B,i%BASE_COLS,(i/BASE_COLS)|0,1);
    }
  }
  logAdd("warn","Налёт на базу «"+B.name+"»"+(lost?" · унесено "+lost+" ед":"")+
    (broke?" · разбит отсек: "+broke:"")+(guard?"":" · охраны нет"));
  baseLog(B,"raid_hit",sh,{lost,broke,guard});
  return 1;
}
/* ══════════════ буря ══════════════ */
/* У базы должна быть угроза, которую нельзя отбить охраной: налёт — про людей,
   буря — про место. Она бьёт по тому, что стоит наверху (панели ловят её первыми),
   и её отменяет «буревой щит» смотрителя. Мир у планеты уже есть: тип задаёт,
   насколько тут вообще дует. */
const STORM_WORLDS={terran:.5,ocean:.9,desert:1.4,rocky:.7,ice:1.3,volcanic:1.4,toxic:1.5,gas:0};
function baseStorm(B,min,sh){
  const force=STORM_WORLDS[B.type]!==undefined?STORM_WORLDS[B.type]:.8;
  if(force<=0)return 0;
  const r=(typeof sh==="number")
    ?rng(hashi(B.sx*313+B.sy,B.idx*11+5,hashi(sh,0x51D,0xB)))
    :rng(hashi(B.sx*313+B.sy,B.idx*11+5,hashi(B.tMs|0,(B.stormSeq=(B.stormSeq|0)+1),0x51D)));
  if(r()>min*force*.010)return 0;
  if(mgrPerkOf("keep","storm")){
    logAdd("dim","Буря на «"+B.name+"» прошла без потерь — щит держит");
    baseLog(B,"storm",sh,{shield:1});
    return 1;
  }
  /* сначала достаётся тому, что снаружи: панели и верхний ряд */
  const top=[];
  for(let i=0;i<BASE_COLS;i++)if(B.cells[i]&&B.cells[i].hp>0)top.push(i);
  const solar=[];
  for(let i=0;i<B.cells.length;i++)if(B.cells[i]&&B.cells[i].k==="solar"&&B.cells[i].hp>0)solar.push(i);
  const pickList=solar.length?solar:top;
  if(!pickList.length){
    logAdd("dim","Буря на «"+B.name+"» — ломать снаружи нечего");
    baseLog(B,"storm",sh,{});
    return 1;
  }
  const i=pickList[Math.floor(r()*pickList.length)];
  const dmg=.5+r()*.5;
  B.cells[i].hp=Math.max(0,B.cells[i].hp-dmg);
  /* зал ломается целиком (M396, §7): у общей стены общая беда */
  if(typeof baseHallHit==="function")baseHallHit(B,i%BASE_COLS,(i/BASE_COLS)|0,dmg);
  logAdd("warn","Буря на «"+B.name+"» повредила отсек: "+BUILD[B.cells[i].k].ru+
    (B.cells[i].hp<=0?" (выбит)":""));
  baseLog(B,"storm",sh,{what:BUILD[B.cells[i].k].ru,out:B.cells[i].hp<=0?1:0});
  return 1;
}
/* инженер чинит разбитое сам, медленно.
   «Очередь» смотрителя доводит начатое до конца и без инженера: домен на то и домен. */
function baseFixTick(B,min,sh){
  /* мастерская (M396, §6): чинит сама и без инженера, а соседу — вдвое быстрее */
  let shop=0;
  for(const cell of (B.cells||[]))if(cell&&cell.hp>0&&cell.k==="shop")shop++;
  const eng=baseRoleForce(B,"engineer")+(mgrPerkOf("keep","queue")?.8:0)+shop*.5;
  if(eng<=0)return 0;
  /* сухой закон (M399): спирт идёт в технужды, и чинится всё вдвое быстрее */
  const near=((typeof baseAdjFix==="function")?baseAdjFix(B):1)*
             ((typeof charterFixMul==="function")?charterFixMul(B):1);
  let done=0;
  for(const cell of B.cells){
    if(cell&&cell.hp<1){
      cell.hp=Math.min(1,cell.hp+min*eng*near*.02);
      if(cell.hp>=1){logAdd("dim","Инженер восстановил отсек на базе «"+B.name+"»");done=1;}
    }
  }
  if(done)baseLog(B,"fix",sh,{who:baseWho(B,"engineer")});
  return done;
}
/* забрать накопленное в трюм — за этим и прилетаешь */
function baseCollect(B){
  const st=stat();let n=0;
  for(const k in B.pool){
    const q=B.pool[k]|0;if(q<=0)continue;
    const got=addRes(k,q);B.pool[k]=q-got;n+=got;
  }
  if(n>0)tell("","С базы забрано "+n+" ед · трюм "+held()+"/"+st.cargoMax,"Забрано "+n+" ед");
  else say("Забирать нечего\nили трюм полон");
  return n;
}
/* ══════════════ сеть баз ══════════════ */
/* Площадка (`pad`) связывает базы между собой и со станциями: перелёт стоит
   топлива и кредитов, зато не требует лететь через полгалактики руками. */
function baseList(){
  const out=[];
  for(const k in G.bases)out.push(G.bases[k]);
  return out.sort((a,b)=>a.built-b.built);
}
function basePads(){return baseList().filter(B=>basePower(B).pads>0);}
function baseJumpCost(B){
  const d=Math.hypot(B.sx-G.sx,B.sy-G.sy);
  return {fuel:Math.ceil(6+d*.9),credits:Math.round(120+d*40)};
}
function jumpToBase(B){
  const c=baseJumpCost(B);
  if(G.fuel<c.fuel){say("Не хватает топлива\nнужно "+c.fuel);return false;}
  if(G.credits<c.credits){say("Не хватает кредитов\nнужно "+c.credits);return false;}
  G.fuel-=c.fuel;G.credits-=c.credits;
  G.sx=B.sx;G.sy=B.sy;G.sys=getSystem(B.sx,B.sy);
  const p=G.sys.planets[B.idx];
  const a=Math.atan2(G.ship.y,G.ship.x)||0;
  if(p){G.ship.x=p.x+Math.cos(a)*(p.radius+170);G.ship.y=p.y+Math.sin(a)*(p.radius+170);}
  G.ship.vx=0;G.ship.vy=0;
  G.mode="system";G.base=null;G.st=null;G.ap=null;G.orbit=null;
  document.getElementById("station").classList.remove("open");
  spawnPirates();spawnAllies();
  saveGame(true);
  tell("","Переброска на базу «"+B.name+"» · −"+c.credits+" кр, −"+c.fuel+" топлива",
       "Переброска\n"+B.name);
  return true;
}
/* ══════════════ обновление сцены ══════════════ */
function updateBase(dt){
  const S=G.base,B=S.B;
  if(G.t%30<dt)baseResolveAll();
  const tx=cellX(S.cur),ty=cellY(S.row);
  const dx=tx-S.x,dy=ty-S.y;
  S.x+=clamp(dx,-3.2*dt,3.2*dt);S.y+=clamp(dy,-2.6*dt,2.6*dt);
  const moving=Math.abs(dx)>2||Math.abs(dy)>2;
  S.walkPhase+=moving?.22*dt:0;
  /* ── аврал (M398, §11) ──
     Единственное, что на базе идёт настоящим временем. Бросок делается один
     раз на заход, такт — раньше меню и раньше сбора: пока горит, база занята
     этим и ничем больше */
  if(typeof avrRoll==="function"&&!S.avrDone&&G.t>60)avrRoll(S,B);
  if(typeof avrTick==="function"&&avrTick(S,B,dt,keys.act))return;
  /* ── меню людей (M395, §8) ──
     Штат базы набирается ТАМ, ГДЕ ОН СТОИТ: подошли к отсеку, нажали ЦЕЛЬ,
     выбрали, кто здесь работает. Лента та же, что у меню постройки, и клавиши
     те же — ничего нового учить не надо. */
  if(S.pmenu){
    const cell=baseCell(B,S.cur,S.row);
    const L=(typeof basePeopleList==="function")?basePeopleList(B,cell):[];
    if(keys.left&&!S.held&&L.length){S.ppick=(S.ppick+L.length-1)%L.length;S.held=1;}
    if(keys.right&&!S.held&&L.length){S.ppick=(S.ppick+1)%L.length;S.held=1;}
    if(!keys.left&&!keys.right)S.held=0;
    G.prompt=basePeopleLine(B,cell,S.ppick|0);
    if(actEdge&&L.length){
      const c=L[(S.ppick|0)%L.length];
      if(baseAssignHere(B,cell,c)){
        S.pmenu=false;
        tell("good",c.name+" → "+BASE_ROLES[baseCellRole(cell)].ru,
          c.name+"\n"+BASE_ROLES[baseCellRole(cell)].ru+" на базе «"+B.name+"»");
      }
    }
    if(!cell)S.pmenu=false;
    return;
  }
  if(S.menu){
    /* меню постройки: ▲▼ выбирают модуль, ДЕЙСТВ ставит, НАЗАД закрывает */
    if(keys.left&&!S.held){S.pick=(S.pick+BUILD_KEYS.length-1)%BUILD_KEYS.length;S.held=1;}
    if(keys.right&&!S.held){S.pick=(S.pick+1)%BUILD_KEYS.length;S.held=1;}
    if(!keys.left&&!keys.right)S.held=0;
    const k=BUILD_KEYS[S.pick],M=BUILD[k];
    /* постройка бывает заперта наукой: лаборатория до «Лаборатории» не ставится.
       Показываем её всё равно — игрок должен видеть, за чем идти. */
    const locked=M.needTech&&techLv(M.needTech)<=0;
    const bad=(M.surfaceOnly&&S.row>0)||locked;
    G.prompt="СТРОИТЬ: "+M.ru.toUpperCase()+"\n"+M.note+
      "\n"+baseCost(k,B).credits+" кр"+(M.cost.alloy?" + "+baseCost(k,B).alloy+" сплавов":"")+
      (locked?"\nНУЖНА НАУКА: "+TECH[M.needTech].ru.toUpperCase():"")+
      (M.surfaceOnly&&S.row>0?"\nТОЛЬКО НА ВЕРХНЕМ УРОВНЕ":"")+
      "\n◀ ▶ — выбор · ДЕЙСТВИЕ — построить";
    if(actEdge){
      if(locked)say("Сначала нужна наука\n«"+TECH[M.needTech].ru+"»");
      else if(bad)say("Панель ставится только сверху");
      /* цена — через baseCost: смета смотрителя должна работать и здесь,
         иначе скидка показывалась в интерфейсе, а списывалось полное */
      else if(!canPay(baseCost(k,B)))say("Не хватает: "+baseCost(k,B).credits+" кр"+
        (M.cost.alloy?" и "+baseCost(k,B).alloy+" сплавов":""));
      else{
        payCost(baseCost(k,B));baseSet(B,S.cur,S.row,{k,hp:1});
        S.menu=false;
        tell("money","На базе «"+B.name+"» построено: "+M.ru,"Построено\n"+M.ru);
      }
    }
    return;
  }
  /* ствол (M396, §7): шестая колонка слева — не модуль и не постройка, она
     есть всегда и бесплатно. В неё можно зайти, и она же объясняет, почему
     уровни меняются: в базе есть лифт */
  if(keys.left&&!S.held){S.cur=Math.max(-1,S.cur-1);S.held=1;}
  if(keys.right&&!S.held){S.cur=Math.min(BASE_COLS-1,S.cur+1);S.held=1;}
  if(keys.thrust&&!S.held){S.row=Math.max(0,S.row-1);S.held=1;}
  if(keys.brake&&!S.held){S.row=Math.min(baseRows(B)-1,S.row+1);S.held=1;}
  if(!keys.left&&!keys.right&&!keys.thrust&&!keys.brake)S.held=0;
  const cell=(S.cur<0)?null:baseCell(B,S.cur,S.row);
  const P=basePower(B);
  if(S.cur<0){
    const A=(typeof baseAdjLine==="function")?baseAdjLine(B):"";
    G.prompt="ЭНЕРГИЯ "+P.prod+" / "+P.cons+" · ОТДАЧА "+Math.round(P.eff*100)+"%"+
      "\nСТВОЛ · ▲ ▼ — УРОВНИ · ▶ — В ОТСЕКИ"+
      (A?"\nСОСЕДСТВО: "+A:"");
    return;
  }
  const dir=(typeof baseDirLine==="function")?baseDirLine(B):"";
  const head="ЭНЕРГИЯ "+P.prod+" / "+P.cons+" · ОТДАЧА "+Math.round(P.eff*100)+"%"+
    "\nНА СКЛАДЕ "+basePoolHeld(B)+" / "+P.store+(dir?"\n"+dir:"");
  if(cell){
    const M=BUILD[cell.k];
    /* стоя на площадке, ДЕЙСТВ отправляет на следующую базу сети, а не собирает груз */
    const net=cell.k==="pad"?basePads().filter(o=>o!==B):[];
    if(net.length){
      /* цель — ближайшая площадка сети: выбирать некому, стрелки заняты ходьбой */
      net.sort((a,b)=>Math.hypot(a.sx-B.sx,a.sy-B.sy)-Math.hypot(b.sx-B.sx,b.sy-B.sy));
      const T=net[0],c=baseJumpCost(T);
      G.prompt=head+"\nПЛОЩАДКА · ДЕЙСТВИЕ — ПЕРЕБРОСКА НА «"+T.name.toUpperCase()+"»"+
        "\n"+c.credits+" кр и "+c.fuel+" топлива";
      if(actEdge)jumpToBase(T);
      return;
    }
    /* кто здесь работает (M395): роль ячейки — это её работа, и человек на ней
       стоит нарисованным. ЦЕЛЬ открывает список, ДЕЙСТВИЕ по-прежнему забирает */
    const role=(typeof baseCellRole==="function")?baseCellRole(cell):null;
    const who=(typeof baseCellStaff==="function")?baseCellStaff(B,cell):[];
    const hall=(typeof baseHallAt==="function")?baseHallAt(B,S.cur,S.row):null;
    G.prompt=head+"\n"+M.ru.toUpperCase()+(hall?" · В ЗАЛЕ ИЗ ТРЁХ":"")+" · "+M.note+
      (role?"\n"+BASE_ROLES[role].ru.toUpperCase()+": "+
        (who.length?who.map(c=>c.name).join(", "):"никого")+" · ЦЕЛЬ — КТО ЗДЕСЬ":"")+
      (B.guest?"\nУ ЗАТВОРА ЖДЁТ "+B.guest.name.toUpperCase()+" · ПРОСИТСЯ ОСТАТЬСЯ":"")+
      (basePoolHeld(B)>0?"\nДЕЙСТВИЕ — ЗАБРАТЬ НАКОПЛЕННОЕ":"");
    /* починка от нуля (M402, §39): разбитый отсек не потерян — он стоит
       четверть постройки и ждёт. Забирать в такой ячейке нечего */
    if(cell.hp<=0&&typeof baseFixCost==="function"){
      const fc=baseFixCost(B,cell.k);
      G.prompt=head+"\n"+M.ru.toUpperCase()+" · РАЗБИТ"+
        "\nДЕЙСТВИЕ — ВОССТАНОВИТЬ · "+fc.credits+" кр"+(fc.alloy?" + "+fc.alloy+" спл":"");
      if(actEdge)baseFixCell(B,S.cur,S.row);
      return;
    }
    /* прилавок базы (M403, §43): у ледоплавки и электролизёра можно залить
       баки своим льдом, у мастерской — починить корпус своими сплавами. В
       блокаду это единственное снабжение, которым игрок распоряжается сам */
    if(cell.k==="melter"||cell.k==="lyse"){
      G.prompt=head+"\n"+M.ru.toUpperCase()+" · ЦЕЛЬ — ЗАЛИТЬ БАКИ СВОИМ ЛЬДОМ"+
        (typeof basePayLine==="function"&&basePayLine(B)?"\n"+basePayLine(B):"");
      if(keys.lock&&!S.lockHeld){S.lockHeld=1;baseRefuel(B);}
      if(!keys.lock)S.lockHeld=0;
      if(actEdge&&basePoolHeld(B)>0)baseCollect(B);
      return;
    }
    if(cell.k==="shop"){
      G.prompt=head+"\n"+M.ru.toUpperCase()+" · ЦЕЛЬ — ПОЧИНИТЬ КОРПУС СВОИМИ СПЛАВАМИ"+
        (typeof basePayLine==="function"&&basePayLine(B)?"\n"+basePayLine(B):"");
      if(keys.lock&&!S.lockHeld){S.lockHeld=1;baseRepairShip(B);}
      if(!keys.lock)S.lockHeld=0;
      if(actEdge&&basePoolHeld(B)>0)baseCollect(B);
      return;
    }
    if(actEdge&&basePoolHeld(B)>0)baseCollect(B);
    if(role&&keys.lock&&!S.lockHeld){S.pmenu=true;S.ppick=0;S.lockHeld=1;}
    if(!keys.lock)S.lockHeld=0;
  }else{
    G.prompt=head+"\nПОРОДА · ДЕЙСТВИЕ — ПРОКОПАТЬ И ПОСТАВИТЬ МОДУЛЬ";
    if(actEdge){S.menu=true;S.pick=0;}
  }
}
