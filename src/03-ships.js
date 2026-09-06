/* ══════════════ корабли: процедурные корпуса ══════════════ */
const SHIPS={
  strizh:{ru:"Стриж", cls:"лёгкий разведчик", hcls:"scout", seed:1101, thr:1,   turn:1,   fuel:100,cargo:40, hull:100,price:0,    col:"#7fe6d8",note:"Стандартный корпус разведзонда. Ничего лишнего."},
  igla:  {ru:"Игла",  cls:"зонд дальнего хода",hcls:"survey", seed:2207, thr:1.12,turn:1.2, fuel:130,cargo:26, hull:74, price:3400, col:"#9fd8ff",note:"Тонкий корпус и большой бак. Ходит далеко, возит мало."},
  vyuk:  {ru:"Вьюк",  cls:"грузовой тягач",   hcls:"hauler", seed:3313, thr:.82, turn:.78, fuel:150,cargo:150,hull:135,price:6200, col:"#f2b25c",note:"Трюм вчетверо больше, разгон вялый. Возит руду мешками."},
  skat:  {ru:"Скат",  cls:"рудный челнок",    hcls:"hauler", seed:4421, thr:.95, turn:1.05,fuel:120,cargo:96, hull:118,price:8100, col:"#8fd08a",note:"Широкая рама с боковыми бункерами. Крепкий середняк."},
  klinok:{ru:"Клинок",cls:"курьер",           hcls:"courier",seed:5527, thr:1.5, turn:1.45,fuel:95, cargo:32, hull:88, price:9800, col:"#ff9d7a",note:"Гоночная рама. Садится точно, но трюм крошечный."},
  obod:  {ru:"Обод",  cls:"кольцевой буровик",hcls:"miner",  seed:6631, thr:.88, turn:.9,  fuel:170,cargo:130,hull:160,price:15000,col:"#c9c9d4",note:"Каркас вокруг буровой шахты. Грызёт астероиды быстрее всех."},
  topor: {ru:"Топор", cls:"броневой тральщик",hcls:"warship",seed:7741, thr:1.05,turn:.82, fuel:140,cargo:88, hull:250,price:19500,col:"#e0d28a",note:"Толстая скула. Переживает то, что убивает остальных."},
  mamont:{ru:"Мамонт",cls:"тяжёлый рудовоз",  hcls:"hauler", seed:8849, thr:.7,  turn:.62, fuel:230,cargo:290,hull:220,price:24000,col:"#c58ae0",note:"Летающий склад с бронёй. Разворачивается как луна."}
};
const SHIP_KEYS=Object.keys(SHIPS);
function shipData(id){return SHIPS[id]||(typeof FLEET!=="undefined"&&FLEET[id])||G.uniqueShips[id]||NPC_SHIPS[id];}
const UNIQUE_COLS=["#7fe6d8","#9fd8ff","#f2b25c","#8fd08a","#ff9d7a","#c9c9d4","#e0d28a","#c58ae0","#ff6b6b","#6bffb8"];
const UNIQUE_TAG=["уникальный корпус","экспериментальный корпус","одиночная сборка","опытный образец","штучная работа"];
function genUniqueShip(seed){
  const r=rng(seed);
  const thr=+(0.75+r()*0.85).toFixed(2);
  const turn=+(0.7+r()*0.85).toFixed(2);
  const fuel=Math.round(90+r()*160);
  const cargo=Math.round(30+r()*270);
  const hull=Math.round(80+r()*180);
  const power=(thr+turn)*.5+fuel/250+cargo/300+hull/260;
  const price=Math.round(clamp(power*7200-6000,4000,30000)/50)*50;
  return {ru:genName(r),cls:pick(UNIQUE_TAG,r),seed,thr,turn,fuel,cargo,hull,price,
    col:pick(UNIQUE_COLS,r),note:"Единственный экземпляр. Больше такого не будет — предложение сменится.",unique:true};
}
/* ══════════════ лаборатория: сплав двух корпусов ══════════════ */
/* Статы смешиваются взвешенно, а не суммируются: сильный родитель тянет сильнее,
   редкое сырьё добавляет процент сверху. Прирост затухает с каждым поколением,
   иначе за час получается корабль, после которого играть не во что. */
function fuseGen(){return Math.max(0,G.fuseGen|0);}
function fuseCost(){
  const g=fuseGen();
  return {credits:Math.round(4000*Math.pow(1.8,g)),
    alloy:6+g*5, volatiles:3+g*3, icecrys:2+g*3};
}
function fuseAffordable(c){
  return G.credits>=c.credits&&G.cargo.alloy>=c.alloy&&
    G.cargo.volatiles>=c.volatiles&&G.cargo.icecrys>=c.icecrys;
}
function fuseShips(idA,idB){
  const A=shipData(idA),B=shipData(idB);
  if(!A||!B||idA===idB)return null;
  const c=fuseCost();
  if(!fuseAffordable(c))return null;
  const g=fuseGen();
  const seed=hashi(hashi(A.seed||1,B.seed||2,0xF05E),Date.now()&0xffff,g);
  const base=genUniqueShip(seed);
  /* доля редкого сырья сверх обязательного минимума и есть «бонус за редкость» */
  const rich=clamp((G.cargo.volatiles+G.cargo.icecrys)/(c.volatiles+c.icecrys+24),0,1);
  const gain=(.06+rich*.09)*Math.pow(.55,g);   // затухание: второе поколение даёт втрое меньше
  const mix=(a,b)=>{
    const w=a>=b?.62:.38;
    return a*w+b*(1-w);
  };
  base.thr=+(mix(A.thr,B.thr)*(1+gain)).toFixed(2);
  base.turn=+(mix(A.turn,B.turn)*(1+gain)).toFixed(2);
  base.fuel=Math.round(mix(A.fuel,B.fuel)*(1+gain));
  base.cargo=Math.round(mix(A.cargo,B.cargo)*(1+gain));
  base.hull=Math.round(mix(A.hull,B.hull)*(1+gain));
  base.cls="лабораторный сплав";
  /* единственное место, где две породы встречаются на одном корпусе (§19.3):
     сплав берёт грамматику того родителя, чей вклад тяжелее, и помнит второго */
  {
    const ba=(typeof makerOf==="function")?makerOf(idA,A):"gt";
    const bb=(typeof makerOf==="function")?makerOf(idB,B):"gt";
    /* тяжелее тот, у кого больше корпус, трюм и бак вместе взятые */
    const wa=(A.hull|0)+(A.cargo|0)+(A.fuel|0), wb=(B.hull|0)+(B.cargo|0)+(B.fuel|0);
    base.by=wa>=wb?ba:bb;
    base.by2=(ba===bb)?null:(wa>=wb?bb:ba);
  }
  base.note="Сплав «"+A.ru+"» и «"+B.ru+"». Поколение "+(g+1)+"."+
    (base.by2&&typeof powerOf==="function"
      ?" Обвод "+powerOf(base.by).ru+", повадки от "+powerOf(base.by2).ru+"."
      :"");
  base.fused=g+1;
  const id="f"+seed;
  G.credits-=c.credits;
  G.cargo.alloy-=c.alloy;G.cargo.volatiles-=c.volatiles;G.cargo.icecrys-=c.icecrys;
  delete G.owned[idA];delete G.owned[idB];
  for(const cw of G.crew)if(cw.shipId===idA||cw.shipId===idB)cw.shipId=null;
  G.uniqueShips[id]=base;G.owned[id]=true;
  G.fuseGen=g+1;
  if(G.shipId===idA||G.shipId===idB)G.shipId=id;
  invalidateParts();
  tell("tech","Сплав корпусов: «"+A.ru+"» + «"+B.ru+"» → «"+base.ru+"»",
       "Сплав готов\n«"+base.ru+"»\nпоколение "+(g+1));
  return id;
}
/* крафт частей — сток для излишков редкого сырья: чем больше вкладываешь,
   тем выше тир, но случайность и слоты остаются генератора */
const CRAFT_TIERS=[
  {tier:1,ru:"рядовая сборка",  cost:{credits:900, alloy:3}},
  {tier:2,ru:"точная сборка",   cost:{credits:2600,alloy:6, volatiles:4}},
  {tier:3,ru:"штучная сборка",  cost:{credits:6400,alloy:12,volatiles:8,icecrys:6}}
];
function craftAffordable(cost){
  if(G.credits<cost.credits)return false;
  for(const k in cost)if(k!=="credits"&&(G.cargo[k]|0)<cost[k])return false;
  return true;
}
function craftPart(spec){
  if(!craftAffordable(spec.cost))return null;
  G.credits-=spec.cost.credits;
  for(const k in spec.cost)if(k!=="credits")G.cargo[k]-=spec.cost[k];
  const part=genPart(hashi(Date.now()&0xffffff,partSeq*7717,0xC7AF),spec.tier);
  addPart(part);
  tell("tech","Собрана часть: "+part.name+" ("+TIER_RU[part.tier]+")",
       "Часть собрана\n"+part.name);
  return part;
}
/* «Обновление» фактора: ассортимент станций перебирается втрое чаще — его связи
   в том и состоят, что он знает о новом раньше. Бакет один на весь ассортимент
   (части, уникальный корпус, кантина), поэтому перк правится здесь, в одном месте. */
function timeBucket(){
  const period=(typeof mgrPerkOf==="function"&&mgrPerkOf("fact","stock"))?57600000:172800000;
  return Math.floor(Date.now()/period);
}
/* ── эпизод как разрешение на покупку корпуса (M369b, §19.3, D14) ──
   Корпус — не деталь: чужой завод не продаёт его первому встречному. Нужен
   эпизод с этим заводом («разрешение на покупку»), а эпизодов не существует до
   M374 — значит сегодня чужой корпус можно только притащить на буксире или
   купить в «Ялте», где торгуют все и со всеми (там же он и вдвое дороже).
   Заглушка честная: она не «вернёт false навсегда», а спросит настоящую
   функцию, как только та появится. */
function hasEpisode(by){
  if(typeof episodeWith==="function")return !!episodeWith(by);
  return false;
}
function stationUniqueOffer(sys){
  if(!sys.station)return null;
  const r=rng(hashi(sys.seed,999,timeBucket()));
  const chance=.35+sysDanger(sys.sx,sys.sy)*.35;
  if(r()>chance)return null;
  const sh=genUniqueShip(hashi(sys.seed,4242,timeBucket()));
  /* корпус приходит с завода той державы, что держит станцию */
  const stBy=(sys.station&&sys.station.by)||"gt";
  const yalta=(typeof yaltaIs==="function")&&yaltaIs(sys.sx,sys.sy);
  sh.by=stBy;
  if(stBy!=="gt"&&!hasEpisode(stBy)&&!yalta)return null;   /* без эпизода не продадут */
  if(yalta&&stBy!=="gt")sh.price=Math.round(sh.price*2/50)*50;   /* «Ялта»: вдвое */
  return sh;
}
/* части в продаже: как и уникальный корабль — ничего не персистится,
   ассортимент детерминирован seed станции и временным бакетом */
function stationParts(sys){
  if(!sys||!sys.station)return [];
  const bucket=timeBucket(),d=sysDanger(sys.sx,sys.sy);
  const r=rng(hashi(sys.seed,8181,bucket));
  const n=1+Math.floor(r()*3);
  const out=[];
  for(let i=0;i<n;i++){
    const seed=hashi(sys.seed,i*613+17,bucket);
    /* прилавок держит своё: на станции ГЛАВТРАССЫ лежит её железо, у Компании
       её. Чужое сюда попадает как привезённое — примерно каждая четвёртая
       вещь, и это единственный способ купить чужую часть, не летая туда */
    const stBy=(sys.station&&sys.station.by)||"gt";
    const pby=(rng(hashi(seed,7,3))()<.26&&typeof makerBySeed==="function")
      ?makerBySeed(hashi(seed,11,5)):stBy;
    const part=genPart(seed,tierFromDanger(d,rng(seed)),null,0,null,pby);
    /* репутация станции идёт и в цену железа: продавец тоже человек (12k-rep) */
    const price=Math.round((320+part.tier*part.tier*460+part.aff.length*180)*
      (.85+r()*.4)*repPartMul(sys)/10)*10;
    out.push({key:sys.key+"|"+bucket+"|"+i,part,price});
  }
  /* «Чёрный список» фактора: его связи открывают то, чего в открытой продаже нет —
     одна часть заведомо высокого класса и дороже рынка. Не «+10% ко всему»,
     а конкретная вещь, за которой имеет смысл прилететь. */
  if(typeof mgrPerkOf==="function"&&mgrPerkOf("fact","black")){
    const seed=hashi(sys.seed,0xB1AC,bucket);
    const part=genPart(seed,Math.min(3,tierFromDanger(d,rng(seed))+1));
    const price=Math.round((320+part.tier*part.tier*460+part.aff.length*180)*1.45*
      repPartMul(sys)/10)*10;
    out.push({key:sys.key+"|"+bucket+"|black",part,price,black:1});
  }
  return out;
}
const HULL_CACHE={};
/* корпуса NPC живут отдельно от G.uniqueShips — те персистятся, эти нет */
const NPC_SHIPS={};
function hex2rgb(h){
  h=h.replace("#","");
  return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];
}
const rgba=(c,a)=>"rgba("+(c[0]|0)+","+(c[1]|0)+","+(c[2]|0)+","+a+")";
const mixc=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];
/* полуширина корпуса в произвольной точке оси — по станциям профиля */
function profW(prof,x){
  for(let i=0;i<prof.length-1;i++){
    const a=prof[i],b=prof[i+1];
    if(x<=a[0]&&x>=b[0]){
      const t=(a[0]-x)/((a[0]-b[0])||1);
      return lerp(a[1],b[1],t);
    }
  }
  return x>prof[0][0]?prof[0][1]:prof[prof.length-1][1];
}
/* ══════════════ класс корпуса ══════════════ */
/* Генератор делал «просто корабль»: пропорции гуляли от seed, но силуэт ничего
   не сообщал. В системе летали восемь разных кораблей, и ни по одному нельзя
   было сказать, кто это — рудовоз, курьер или фрегат, пока не подлетишь и не
   прочитаешь подпись.

   Класс — это не новая таблица кораблей, а **уклон генератора**: те же
   станции профиля, но с другими пропорциями, и одна-две узнаваемые детали.
   Рудовоз широк и обвешан контейнерами, у буровика бур в носу, у фрегата
   стволы и скула, у яхты лента окон, у исследователя тарелка и панели.
   Читается силуэтом на любом масштабе, а это единственное, что видно
   в системе. */
const HULL_CLASS={
  /* Пропорции разведены сильнее, чем были: на листе из ста корпусов классы
     сливались в одну «стрелу с крыльями». Курьер теперь вдвое длиннее своей
     ширины, рудовоз — почти ящик, яхта — веретено, и размах крыла тоже свой
     (`wsp`): рудовозу крылья ни к чему, фрегату они и есть силуэт. */
  /* Лист по классам показал: рудовоз, буровик и курьер опознаются сразу, а
     разведчик, фрегат, яхта и исследователь — одна и та же «стрела с крыльями».
     Причина не в пропорциях, а в том, что примета класса рисовалась ВНУТРИ
     контура: тарелка, стволы и панели тонули в навеске. Силуэт — это контур,
     значит примета обязана из него торчать. Отсюда `boom` у разведчика,
     спонсоны у фрегата, отсутствие крыла и пилоны у яхты, раскрытые панели
     и тарелка на длинной штанге у исследователя. */
  /* `atm` — садится в атмосферу, и только поэтому имеет право на крыло.
     Остальным крыло не нужно и мешает: вместо него радиаторы (`rad`) —
     единственная деталь, которая у настоящего корабля обязана быть и которой
     тут не было вовсе. `blunt` — тупой нос: острый нос нужен тому, кто входит
     в воздух, а вакууму он безразличен. Так форма начинает следовать работе,
     а не привычке рисовать самолёт. */
  scout:  {ru:"разведчик",     bw:.85,len:1.00,wing:[1,2],nac:.40,notch:.55,dish:1,boom:1,wsp:.95,atm:1},
  courier:{ru:"курьер",        bw:.50,len:1.52,wing:[2,3],nac:.80,notch:.30,fin:1,wsp:1.25,atm:1},
  hauler: {ru:"рудовоз",       bw:1.90,len:1.04,wing:[0,0],nac:.38,notch:.85,cont:1,wsp:.5,rad:1,blunt:1,arm:1},
  miner:  {ru:"буровик",       bw:1.52,len:.92,wing:[0,0],nac:.50,notch:.70,cont:1,drill:1,wsp:.62,rad:1,blunt:1,frame:1},
  warship:{ru:"фрегат",        bw:1.16,len:1.12,wing:[1,1],nac:.74,notch:.50,guns:1,armor:1,wsp:.86,rad:1,blunt:1},
  yacht:  {ru:"яхта",          bw:.74,len:1.34,wing:[0,0],nac:.85,notch:.10,win:1,fin:1,pylon:1,wsp:.7,atm:1},
  survey: {ru:"исследователь", bw:.92,len:1.14,wing:[0,0],nac:.52,notch:.40,dish:1,panel:1,wsp:.8,rad:1,blunt:1}
};
function hullClassOf(id,S){
  if(S.hcls)return S.hcls;
  let k;
  /* у пирата корпус всегда боевой или курьерский: он либо дерётся, либо
     догоняет. Мирного рудовоза среди них быть не должно — силуэт врага
     обязан читаться враждебно ещё до первого выстрела */
  if(id&&id[0]==="p")k=(hashi(S.seed,3,0x9A17)&3)?"warship":"courier";
  else if(S.cls&&/буровик|шахт/.test(S.cls))k="miner";
  else if(S.cargo>=140)k="hauler";
  else if(S.hull>=200)k="warship";
  else if(S.thr>=1.35)k="courier";
  else if(S.fuel>=150&&S.cargo<70)k="survey";
  else if(S.unique||S.fused)k=["scout","yacht","survey","warship"][hashi(S.seed,5,0x77)&3];
  else k="scout";
  S.hcls=k;return k;
}
