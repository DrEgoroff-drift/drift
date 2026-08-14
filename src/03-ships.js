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
  base.note="Сплав «"+A.ru+"» и «"+B.ru+"». Поколение "+(g+1)+".";
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
function stationUniqueOffer(sys){
  if(!sys.station)return null;
  const r=rng(hashi(sys.seed,999,timeBucket()));
  const chance=.35+sysDanger(sys.sx,sys.sy)*.35;
  if(r()>chance)return null;
  return genUniqueShip(hashi(sys.seed,4242,timeBucket()));
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
    const part=genPart(seed,tierFromDanger(d,rng(seed)));
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
function hullOf(id){
  if(HULL_CACHE[id])return HULL_CACHE[id];
  const S=shipData(id),r=rng(S.seed);
  const K=HULL_CLASS[hullClassOf(id,S)]||HULL_CLASS.scout;

  /* ── продольный профиль: станции от носа к корме ── */
  /* не `const`: люксовая яхта переопределяет габариты под свой обвод */
  let nose=(16+r()*14)*K.len, tail=-(13+r()*13)*K.len, len=nose-tail;
  let bw=(3.8+r()*4.4)*K.bw;
  const segs=9+Math.floor(r()*5);
  /* у рудовоза корма почти равна миделю — корпус-ящик; у курьера сходит
     на конус. Это и есть первое, что читается силуэтом */
  // У иглы-курьера нос сходил в нить: держим минимум, иначе силуэт теряет тело
  /* тупой нос у тех, кто не входит в атмосферу: острый обвод — требование
     воздуха, а не вакуума, и на всех подряд он читался как «самолётик» */
  const noseW=K.blunt
    ? bw*(.40+r()*.20)
    : Math.max(.9,bw*(.10+r()*.16)*(K.cont?1.5:1));
  const tailW=bw*(.42+r()*.46)*(K.cont?1.3:1);
  const tp=.28+r()*.3;
  const hasNotch=r()<K.notch, notch=.6+r()*.28, notchT=tp+.16+r()*.3;
  const prof=[];
  for(let i=0;i<=segs;i++){
    const t=i/segs, x=lerp(nose,tail,t);
    let w;
    if(t<tp){const u=t/tp;w=lerp(noseW,bw,u*u*(3-2*u));}
    else{const u=(t-tp)/(1-tp);w=lerp(bw,tailW,u*u*(3-2*u));}
    if(hasNotch&&t>notchT)w*=notch;   // уступ обшивки — силуэт перестаёт быть каплей
    w*=.93+r()*.15;                   // станции чуть гуляют
    prof.push([x,Math.max(.7,w)]);
  }
  const tip=[nose+2+r()*4,0];
  const poly=[tip];
  for(const p of prof)poly.push([p[0],-p[1]]);
  for(let i=prof.length-1;i>=0;i--)poly.push([prof[i][0],prof[i][1]]);

  /* ── люксовая яхта: отдельный обвод ──
     На стенде люксовая яхта была иглой курьера: нос-шило, ровное веретено,
     и никакой палубы. Яхта — не стрела, а КОРПУС С ПАЛУБОЙ: короткий развал
     скул у носа, широкий мидель почти сразу за ним, длинный сходящий ют и
     широкий транец, на котором есть где стоять. Отсюда и весь остальной
     проход: там, где есть палуба, есть надстройка, ограждение и трап. */
  /* Форма принадлежит КЛАССУ, отделка — тиру. Первый заход дал тонкое тело и
     манту только люксу, и рядовая яхта осталась иглой курьера с лентой окон:
     то есть класс опознавался ценой, а не силуэтом. `YAC` — обвод яхты,
     `LUX` — лак, тик, латунь и жемчуг поверх него. */
  const YAC=!!K.win, LUX=!!(K.win&&S.tier==="luxe");
  /* ══════════════ схема планера ══════════════
     Класс отвечал на вопрос «кто это», но внутри класса все шесть семян были
     одним кораблём со сдвинутыми пропорциями: стреловидное крыло и пара
     гондол у борта — и так семь раз. На листах, по которым это переделано,
     схем много, и они не про роль, а про КОНСТРУКЦИЮ: дельта, крест,
     катамаран с двумя балками, плита-контейнеровоз, диск, трезубец.
     Схема выбирается семенем из тех, что классу дозволены (рудовозу дельта
     ни к чему, курьеру — плита), и меняет обвод, крыло и расстановку тяги.
     Семь классов на пять-шесть схем — полсотни разных силуэтов. */
  const FORM_BY_CLASS={
    scout:  ["swept","delta","xwing","trident","twin"],
    courier:["swept","delta","trident","twin","xwing"],
    hauler: ["slab","twin","boxed","disc"],
    miner:  ["boxed","slab","twin","trident"],
    warship:["delta","xwing","swept","trident","boxed"],
    yacht:  ["swept"],
    survey: ["disc","twin","boxed","xwing","swept"]
  };
  const forms=FORM_BY_CLASS[S.hcls]||["swept"];
  const form=YAC?"swept":forms[Math.floor(r()*forms.length)];
  /* диск и плита — не веретено: у них свой обвод, иначе схема остаётся
     припиской к прежнему корпусу. Диск почти круглый в плане, плита —
     прямоугольник со срезанными углами */
  /* ── уступ носа ──
     Нос у всех был гладким конусом, отчего семь классов сходились к одной
     заострённой капле. На листах носовая часть почти всегда СТУПЕНЧАТАЯ:
     обтекатель уже корпуса и стоит на нём с явной ступенью. Треть кораблей
     получает такой уступ, и его видно даже пятном в системе. */
  if(!YAC&&r()<.42){
    const N=prof.length-1, st=.18+r()*.14, k=.60+r()*.14;
    for(let i=0;i<=N;i++)if(i/N<st)prof[i][1]*=k;
    poly.length=0;poly.push(tip);
    for(const p of prof)poly.push([p[0],-p[1]]);
    for(let i=prof.length-1;i>=0;i--)poly.push([prof[i][0],prof[i][1]]);
  }
  if(form==="disc"||form==="slab"){
    const N=prof.length-1;
    for(let i=0;i<=N;i++){
      const t=i/N;
      prof[i][1]=form==="disc"
        ? Math.max(.8,bw*1.5*Math.sqrt(Math.max(.02,1-Math.pow(t*2-1,2))))
        : Math.max(.8,bw*(t<.08?.45+t*7:t>.94?.55:1.15));
    }
    tip[0]=nose+(form==="disc"?.6:1.2);
    poly.length=0;poly.push(tip);
    for(const p of prof)poly.push([p[0],-p[1]]);
    for(let i=prof.length-1;i>=0;i--)poly.push([prof[i][0],prof[i][1]]);
  }
  if(YAC){
    /* ── проход по форме ──
       Первая версия обвода была морской яхтой в виде сверху: широкий мидель у
       носа и тупой транец. Рядом с тем, чем яхта должна быть, это тумба.
       Дорогая машина в пустоте — это ДЛИННОЕ ТОНКОЕ ТЕЛО: узкий вытянутый
       вход, мидель за серединой, и хвост, который сходит почти в нить и
       тянется дальше, чем кажется нужным. Отсюда и разнесённые тонкие крылья
       ниже: тонкому телу нужен размах, иначе оно читается стержнем. */
    const q=rng(hashi(S.seed,0x1E,0x5AFE));
    nose*=1.18; tail*=1.75; len=nose-tail; bw*=.70;
    const midT=.40+q()*.07;                       // мидель за серединой
    const nW=bw*(.14+q()*.05), tW=bw*(.17+q()*.07);
    const N=22;
    prof.length=0;
    for(let i=0;i<=N;i++){
      const t=i/N, x=lerp(nose,tail,t);
      let w;
      if(t<midT){const u=t/midT;w=lerp(nW,bw,Math.pow(u,.62));}   // долгий вход
      else{const u=(t-midT)/(1-midT);w=lerp(bw,tW,Math.pow(u,1.45));}
      prof.push([x,Math.max(.5,w)]);
    }
    tip[0]=nose+len*.10;                       // нос вытянут в тонкое остриё
    poly.length=0;poly.push(tip);
    for(const p of prof)poly.push([p[0],-p[1]]);
    for(let i=prof.length-1;i>=0;i--)poly.push([prof[i][0],prof[i][1]]);
  }
  const wings=[];
  const wingN=(form==="swept")
    ?K.wing[0]+Math.floor(r()*(K.wing[1]-K.wing[0]+1)):0;
  if(form==="delta"){
    /* дельта: одна толстая треугольная плоскость от миделя к самой корме,
       с прямой задней кромкой. Её ни с чем не спутать даже пятном */
    const root=nose*(.30+r()*.16), back=tail*(.72+r()*.24);
    const span=bw*(2.2+r()*1.1);
    wings.push([[root,-bw*.7],[root-len*.12,-span*.45],
                [back+len*.06,-span],[back,-span*.92],[back,-bw*.85]]);
  }else if(form==="xwing"){
    /* крест: четыре коротких плоскости под углом, гондолы на концах.
       Симметрия здесь не герб, а конструкция — так и рисуют на листах */
    for(const k of [0,1]){
      const root=k?tail*.30:nose*.22, dir=k?-1:1;
      const chord=len*(.16+r()*.06), span=bw*(1.6+r()*.7);
      wings.push([[root+chord*.5,-bw*.7],[root+chord*.5-dir*len*.10,-span],
                  [root-chord*.5-dir*len*.10,-span*.86],[root-chord*.5,-bw*.8]]);
    }
  }else if(form==="twin"){
    /* катамаран: две балки по бортам от миделя до кормы, соединённые с
       корпусом перемычками. Между балкой и телом — просвет, и он-то и виден */
    const x0=nose*(.18+r()*.12), x1=tail*(.86+r()*.12), off=bw*(1.5+r()*.6);
    wings.push([[x0,-off*.62],[x0-len*.04,-off],[x1,-off],
                [x1,-off*.66],[x1+len*.06,-off*.5],[x0,-bw*.72]]);
  }else if(form==="slab"){
    /* плита: корпус-контейнеровоз, «крыло» — грузовая палуба во всю длину */
    const x0=nose*(.52+r()*.16), x1=tail*(.88+r()*.10), off=bw*(1.25+r()*.45);
    wings.push([[x0,-bw*.9],[x0,-off],[x1,-off],[x1,-bw*.9]]);
  }else if(form==="trident"){
    /* трезубец: две плоскости, вынесенные ВПЕРЁД за мидель, острыми
       законцовками. Нос от этого читается тремя остриями */
    const root=nose*(.16+r()*.12), span=bw*(1.7+r()*.8);
    wings.push([[root+len*.16,-bw*.6],[root+len*.22,-span*.8],
                [root+len*.06,-span],[root-len*.14,-span*.7],[root-len*.06,-bw*.8]]);
  }
  for(let i=0;i<wingN;i++){
    const root=lerp(nose*.1,tail*.82,(i+.3+r()*.4)/wingN);
    const chord=len*(.12+r()*.16), span=(bw*(1.15+r()*1.5)+2.5)*(K.wsp||1);
    const sweep=-chord*(.3+r()*.9), rw=profW(prof,root);
    wings.push([
      [root+chord*.5,-rw*.82],
      [root+chord*.5+sweep*.5,-span*.6],
      [root+chord*.12+sweep,-span],
      [root-chord*.5+sweep,-span*(.86+r()*.12)],
      [root-chord*.7+sweep*.45,-span*.5],
      [root-chord*.55,-rw*.88]
    ]);
  }

  /* ── гондолы двигателей ── */
  const nacs=[];
  if(r()<K.nac){
    const nl=len*(.24+r()*.2), nr=bw*(.18+r()*.2)+1;
    nacs.push({x:tail+nl*(.5+r()*.3), y:bw*(.72+r()*.5)+nr*.8, l:nl, r:nr});
  }
  /* ── гондолы стоят по СХЕМЕ ──
     Пара у борта — только один из способов, и на листах он не самый частый.
     У дельты и креста двигатель уезжает на законцовку, у катамарана он
     ВСТРОЕН в балку, у плиты сидит под палубой. Это меняет силуэт сильнее,
     чем любая правка обвода: по расстановке тяги корабль и опознают. */
  if(!YAC&&nacs.length){
    const n0=nacs[0];
    if(form==="delta"||form==="xwing"){
      let sp=bw*1.6;
      for(const w of wings)for(const p of w)sp=Math.max(sp,Math.abs(p[1]));
      n0.y=sp*.82; n0.x=tail+n0.l*.42;
    }else if(form==="twin"){
      n0.y=bw*(1.5+r()*.6); n0.l=len*(.30+r()*.10); n0.x=tail+n0.l*.5;
    }else if(form==="slab"||form==="boxed"){
      n0.y=bw*(.62+r()*.3); n0.r*=1.25; n0.x=tail+n0.l*.4;
      nacs.push({x:n0.x,y:n0.y+n0.r*2.2,l:n0.l*.8,r:n0.r*.8});   // вторая пара
    }else if(form==="disc"){
      n0.y=bw*(1.05+r()*.2); n0.l=len*(.34+r()*.1); n0.x=tail+n0.l*.34;
    }
  }

  /* ── сопла: откуда бьёт факел ── */
  const eng=[];
  for(const n of nacs){
    eng.push({x:n.x-n.l*.5,y:-n.y,r:n.r*.92});
    eng.push({x:n.x-n.l*.5,y:n.y,r:n.r*.92});
  }
  /* ── сопла по работе ──
     Были одинаковы у всех, хотя тяга и есть главное различие между грузовиком
     и курьером. Грузовик тащит массу: у него мало сопел и они большие.
     Курьер разгоняется: одно длинное по оси. Фрегат должен уметь дёргаться:
     блок мелких, которыми удобно рулить. Остальным — прежняя пара. */
  if(K.cont){                                   // рудовоз и буровик
    const rr=Math.max(2.4,tailW*.62);
    eng.push({x:tail,y:-tailW*.4,r:rr});
    eng.push({x:tail,y:tailW*.4,r:rr});
  }else if(K.atm&&K.len>1.4){                   // курьер: одно, по оси
    eng.push({x:tail,y:0,r:Math.max(2,tailW*.95)});
  }else if(K.guns){                             // фрегат: блок мелких
    const rr=Math.max(1.1,tailW*.3);
    for(let i=0;i<4;i++)
      eng.push({x:tail+(i%2?1.2:0),y:(i-1.5)*tailW*.42,r:rr});
  }else if(tailW>bw*.55){
    eng.push({x:tail,y:-tailW*.46,r:tailW*.44});
    eng.push({x:tail,y:tailW*.46,r:tailW*.44});
  }else eng.push({x:tail,y:0,r:Math.max(1.6,tailW*.82)});
  /* ── тяга стоит РЯДОМ по корме ──
     Пара сопел, разнесённая к бортам, читалась двумя ушами: между ними пустой
     транец, а на листах корма — это плотный ряд из трёх-четырёх раструбов,
     занимающий её целиком. Ряд собирается по ширине кормы, а не по числу из
     таблицы: сколько влезло, столько и стоит. */
  if(!YAC&&!K.guns){
    const rr=Math.max(1.5,tailW*.42);
    const n=Math.max(2,Math.min(4,Math.round(tailW/rr)));
    eng.length=0;
    for(let i=0;i<n;i++)
      eng.push({x:tail+((i%2)?.5:0), y:(i-(n-1)/2)*rr*2.05, r:rr});
  }

  /* ── навеска: боксы, антенны, рёбра обшивки ── */
  /* ── боксы по бортам ──
     Пятый элемент в списке хвостов: вся навеска ставилась зеркально, и
     корабль читался гербом, а не машиной. У настоящей техники оборудование
     висит там, где нашлось место: бокс с одного борта, ящик с другого, и
     они разной длины. `s` — борт, на котором стоит именно этот бокс. */
  const pods=[];
  const podN=Math.floor(r()*3);
  for(let i=0;i<podN;i++)pods.push([tail*.5-r()*3, bw+2.2+i*3.4, 4+r()*4, 2.2+r()*1.6,
                                    (r()<.34?0:(r()<.5?1:-1))]);
  const greeb=[];
  const gn=8+Math.floor(r()*10);
  for(let i=0;i<gn;i++){
    const gx=lerp(nose*.72,tail*.94,r()), gw=profW(prof,gx);
    greeb.push([gx,(r()*2-1)*gw*.62,1.1+r()*3.2,.9+r()*2,r()<.28]);
  }
  const ants=[];
  const an=1+Math.floor(r()*3);
  for(let i=0;i<an;i++){
    const ax=lerp(nose*.55,tail*.5,r()), aw=profW(prof,ax);
    ants.push([ax,-aw*.9,3+r()*6,(r()*.9-.45),(r()<.45?0:(r()<.5?1:-1))]);
  }
  const ribs=[];
  for(let i=2;i<prof.length-1;i++)if(r()<.55)ribs.push(i);

  /* ── приметы класса ──
     По одной-две на корпус, и все на своих местах: контейнеры вдоль хребта,
     бур в носу, стволы вдоль скулы, тарелка на штанге у кормы. Больше не
     нужно: силуэт должен опознаваться, а не описываться. */
  const mark={};
  if(K.cont){
    mark.cont=[];
    const n=3+Math.floor(r()*4);
    const cl=len*.62/n;
    for(let i=0;i<n;i++)
      // контейнеры прижаты к БОРТУ, а не отставлены на ширину корпуса:
      // при широком рудовозе они уезжали в стороны и висели двумя тумбами
      mark.cont.push([tail+len*.14+i*cl, cl*.82, Math.max(1.6,profW(prof,tail+len*.14+i*cl)*.62)]);
  }
  if(K.drill)mark.drill={x:nose+1.5,l:5+r()*5,r:Math.max(2.2,noseW*1.5)};
  if(K.guns){
    /* спонсоны: стволы вынесены за борт на короткой площадке и смотрят вперёд.
       Раньше они лежали вдоль скулы внутри контура и на силуэте их не было —
       фрегат ничем не отличался от разведчика */
    mark.guns=[];
    const gn=1+Math.floor(r()*2);
    for(let i=0;i<gn;i++)
      mark.guns.push([lerp(nose*.5,nose*.02,i/Math.max(1,gn)),
        bw*(1.15+i*.34), 7+r()*7]);
  }
  if(K.armor)mark.armor=nose*(.42+r()*.2);
  /* тарелка у исследователя — на длинной штанге и крупная: это его силуэт.
     У разведчика она осталась маленькой и прижатой: он про «дотянуться», а не
     про «слушать» */
  if(K.dish)mark.dish=K.panel
    ?{x:lerp(tail*.5,nose*.1,r()),r:3.4+r()*2.4,boom:bw*1.6+5+r()*4}
    :{x:lerp(tail*.6,nose*.1,r()),r:1.8+r()*1.6,boom:2.5+r()*3};
  if(K.panel)mark.panel={x:lerp(tail*.6,tail*.1,r()),l:len*(.26+r()*.14),w:bw*(2.3+r()*1.1)};
  /* штанга приборов вперёд по оси: единственный корпус, у которого нос
     продолжается за габарит. Разведчик опознаётся по ней издалека */
  if(K.boom)mark.boom={l:len*(.18+r()*.12),r:.8+r()*.5};
  /* пилоны яхты: гондолы вынесены на тонких кронштейнах, крыла нет вовсе */
  if(K.pylon)mark.pylon=1;
  /* Рубка вместо фонаря у крупных: колпак истребителя на рудовозе — нелепость.
     Рубка стоит НАД палубой, у неё своя тень и ряд окон по фронту, и именно
     она даёт кораблю высоту, которой у плоского вида сверху нет. */
  if(K.cont||K.armor)mark.bridge={x:lerp(nose,tail,.20+r()*.10),
    l:len*(.14+r()*.07), w:bw*(.52+r()*.18)};
  /* причальный узел: корабль всю игру швартуется к станциям, а стыковаться
     ему было нечем. Кольцо с тремя захватами на скуле — и сразу видно, чем */
  mark.dock={x:lerp(nose*.75,nose*.25,r()), s:(r()<.5?1:-1), r:1.5+r()*.9};
  /* Экранная изоляция — только тем, кто в атмосферу не садится: у садящегося
     фольгу сорвёт на первом же входе, ему нужна обшивка. Пятно небольшое и
     на своём месте у каждого корпуса — первый заход давал всем одинаковый
     жёлтый носок на корме, и он стал самым громким элементом кадра. */
  if(!K.atm){
    const a=.04+r()*.12;
    mark.foil={a,b:a+.14+r()*.13};
  }
  /* ── радиаторы ──
     Тепло девать некуда, значит панели обязаны быть: тонкие пластины, вынесенные
     от борта, тёмные с той стороны, что смотрит в пустоту. Единственная деталь,
     которой нет ни у кого другого, — поэтому она же и заменяет крыло тем, кто
     в атмосферу не садится. */
  if(K.rad){
    mark.rad=[];
    const rn=K.panel?1:1+Math.floor(r()*2);   // у исследователя уже есть панели
    for(let i=0;i<rn;i++)
      mark.rad.push({x:lerp(tail*.8,tail*.05,(i+.4)/rn), l:len*(.20+r()*.14),
        w:bw*(1.12+r()*.5), th:1.5+r()*1.2});
  }
  /* каркас вокруг шахты: у буровика в таблице так и написано, а рисовалась
     сплошная капля — описание врало силуэту. Теперь врать нечему */
  if(K.frame)mark.frame={x0:nose*.62,x1:tail*.35,w:bw*1.18};
  /* манипулятор: одна штука и с ОДНОГО борта. Все корпуса были зеркальны,
     отчего выглядели не машинами, а гербами */
  if(K.arm)mark.arm={x:lerp(nose*.4,tail*.2,r()),s:(r()<.5?1:-1),
    a1:5+r()*4,a2:4+r()*4};
  /* шлюз с поручнем — тоже с одного борта: место, куда выходит человек */
  mark.lock={x:lerp(nose*.5,tail*.4,r()),s:(r()<.5?1:-1),r:Math.min(2.6,bw*.42)};
  /* бортовой номер: две буквы и две цифры трафаретом. Ничто не делает вещь
     сделанной так дёшево, как инвентарный номер на боку */
  const AZ="АБВГДЕЖЗИКЛМНОПРСТУФЦЧШЭЮЯ";
  mark.num=AZ[Math.floor(r()*AZ.length)]+AZ[Math.floor(r()*AZ.length)]+"-"+
    (10+Math.floor(r()*89));
  if(K.win)mark.win=[nose*(.2+r()*.2),tail*(.2+r()*.3)];
  /* ── люкс: надстройка ярусами ──
     Плоский вид сверху даёт высоту только тенью и ярусом. У яхты ярусов три:
     салон во всю ширину палубы, над ним прогулочная палуба, и рубка владельца
     впереди — самая маленькая и самая высокая. Ют оставлен пустым: на нём
     площадка, и пустое место на корме — тоже примета дорогой вещи. */
  if(YAC){
    const q=rng(hashi(S.seed,0x2F,0x5AFE));
    /* дом ужат под новый корпус: тело стало вдвое длиннее и уже, и прежняя
       надстройка на две трети длины торчала за борт лыжей */
    const dx0=nose*(.42+q()*.08), dx1=tail*(.30+q()*.10);
    const dl=dx0-dx1;
    mark.lux={
      /* ширины — от ПОЛНОГО бимса (2*bw), а не от полуширины: с первого раза
         салон вышел планкой в треть палубы, и тик залил оба борта */
      deck:[
        {x0:dx1,        x1:dx0,          w:bw*1.02, h:1.1},
        {x0:dx1+dl*.20, x1:dx0-dl*.14,   w:bw*.70,  h:2.0},
        {x0:dx0-dl*.40, x1:dx0-dl*.10,   w:bw*.42,  h:2.9}
      ],
      /* ── три схемы ──
         Одна манта на все яхты — это тот же прежний грех, только новый: класс
         опознаётся, а корабль от корабля не отличается. Схема выбирается
         семенем и меняет не отделку, а СИЛУЭТ:
         `manta`   — длинное крыло от наплыва к корме, веретёна на пластине;
         `delta`   — короткое треугольное крыло у самой кормы, двигатели на
                     законцовках, тело оттого читается длиннее;
         `spindle` — крыла нет вовсе: два веретена на тонких пилонах у борта,
                     и просвет между телом и гондолой — вся её примета. */
      form:["manta","delta","spindle"][Math.floor(q()*3)],
      /* ── крыло-манта ──
         Тонкое длинное тело без размаха читается стержнем. Крыло у яхты не
         несущее — оно РАЗНЕСЁННОЕ: тонкая пластина от миделя к корме, с
         законцовкой, загнутой назад дальше кормы, и с выносом гондолы на
         себе. Размах больше длины дома — именно это делает силуэт узнаваемым
         с любого расстояния. */
      wing:{x0:nose*(.10+q()*.10), x1:tail*(.50+q()*.16),
            span:bw*(3.0+q()*1.1), tipBack:len*(.16+q()*.10)},
      pad:{x:lerp(tail*.85,tail*.4,q()), r:bw*.46},   // площадка на юте
      rail:[nose*.62,tail*.86],
      seed:S.seed
    };
    /* мусорная навеска яхте не идёт: у дорогой вещи борт чистый */
    greeb.length=0;ants.length=0;
    if(LUX)delete mark.num;             // имя носит люкс, рядовая яхта — номер
    /* имя на борту латунью. Инвентарный номер трафаретом — то, чем корабль
       отчитывается перед конторой; имя — то, чем владелец отчитывается перед
       собой. У яхты не бывает первого */
    const NAMES=["АВРОРА","ЛАСТОЧКА","ЗАБАВА","СТРЕЛА","ФОРТУНА","ПОЛЫНЬ",
                 "ВЕЧЕРНЯЯ","БАЛОВЕНЬ","КАПРИЗ","ЗАРЯ","ТИШИНА","ЖЕМЧУГ"];
    mark.lux.name=NAMES[Math.floor(q()*NAMES.length)];
    /* тендерный гараж на юте: лацпорт в борту и трап. Поперечная деталь —
       кадр весь вытянут вдоль, и глазу не за что зацепиться */
    mark.lux.tender={x:lerp(tail*.5,tail*.8,q()),s:(q()<.5?1:-1)};
    /* ── три отделки ──
       Шесть семян в ряд читались одной яхтой: роскошь не варьировалась, потому
       что варьировались только размеры. Меняться должно то, что покупают:
       металл канта, настил палубы и тон лака. Три школы, и они не смешиваются:
       `classic` — тёмный лак, латунь, тик; `pearl` — белый корпус, хром и
       светлый камень палубы; `noir` — почти чёрный лак, золото, тёмный настил. */
    mark.lux.style=["classic","pearl","noir"][Math.floor(q()*3)];
    /* ── три двигателя ──
       Сопло у всего флота — дырка на корме, и на яхте это читалось грузовиком:
       три оранжевых языка. Тяга — то, что покупатель слышит и видит первым,
       поэтому у люкса три школы, и каждая опознаётся и на ходу, и на стоянке:
       `candle` — одна длинная свеча по оси в раструбе, ход тихий;
       `pods`   — пара веретён на выносе, кольцевой зев с пояском;
       `crown`  — венец мелких сопел по транцу, ими же и маневрируют. */
    /* ── веретёна на крыле ──
       Гондола, прижатая к борту на кронштейне, — решение тесного корабля.
       У этого силуэта есть размах, и двигатель обязан стоять НА крыле:
       веретено на две трети полуразмаха, с иглой вперёд. Игла — то, из-за
       чего вещь читается быстрой стоя на месте. */
    nacs.length=0;
    const wg=mark.lux.wing;
    /* каждая схема сажает двигатель по-своему, и это ровно то, что делает
       три силуэта тремя, а не одним с вариациями */
    if(mark.lux.form==="delta"){
      wg.x0=tail*(.10+q()*.14);              // крыло сдвинуто к самой корме
      wg.span=bw*(2.4+q()*.8);
      wg.tipBack=len*(.06+q()*.05);
    }
    if(mark.lux.form==="spindle"){
      mark.pylon=1;                          // просвет между телом и гондолой
      nacs.push({x:tail*(.30+q()*.20), y:bw*(2.0+q()*.9),
                 l:len*(.30+q()*.08), r:bw*(.36+q()*.12)});
    }else{
      /* веретено стоит ТАМ, ГДЕ КРЫЛО ЕСТЬ: координата берётся между корневой
         хордой и законцовкой, а вынос — по ширине пластины в этой точке.
         Посаженное «вперёд по борту» веретено висело рядом с крылом в пустоте */
      const wTip=wg.x1-wg.tipBack;
      nacs.push({x:lerp(wg.x0,wTip,.42+q()*.12), y:wg.span*(.40+q()*.08),
                 l:len*(.24+q()*.06), r:bw*(.34+q()*.12)});
    }
    mark.lux.spike=len*(.07+q()*.04);
    mark.lux.eng=["candle","pods","crown"][Math.floor(q()*3)];
    eng.length=0;
    if(mark.lux.eng==="candle"){
      eng.push({x:tail,y:0,r:Math.max(2.2,tailW*.95)});
    }else if(mark.lux.eng==="pods"){
      for(const n of nacs)for(const s of [1,-1])
        eng.push({x:n.x-n.l*.5,y:n.y*s,r:n.r*.8});
    }else{
      const rr=Math.max(1,tailW*.3);
      for(let i=0;i<4;i++)
        eng.push({x:tail+Math.abs(i-1.5)*.9,y:(i-1.5)*tailW*.5,r:rr});
    }
  }

  const canopy={x:lerp(nose,tail,.12+r()*.12),rx:2+r()*3.4,ry:0};
  canopy.ry=Math.min(profW(prof,canopy.x)*.62,canopy.rx*(.6+r()*.5));
  const stripe={a:.2+r()*.28,b:.58+r()*.34,from:.1+r()*.2,to:.62+r()*.32};
  const fin=r()<.55;

  /* габарит со всей навеской — им пользуется превью на верфи */
  let hw=bw;
  for(const w of wings)for(const p of w)hw=Math.max(hw,Math.abs(p[1]));
  for(const n of nacs)hw=Math.max(hw,n.y+n.r);
  for(const p of pods)hw=Math.max(hw,p[1]+p[3]);

  /* ── костяная обшивка ──
     Весь флот был выкрашен в цвет владельца, отчего в системе летали синие,
     зелёные и лиловые машины — красиво на палитре и неправдоподобно в кадре.
     Рабочий корабль красят в то, что дёшево и хорошо видно: белёсый костяной
     грунт. Цвет владельца остаётся, но становится тем, чем он и бывает на
     настоящей технике, — АКЦЕНТОМ: несколько панелей, кант, полоса на киле.
     Яхты живут по своим правилам (лак и латунь), их это не касается. */
  const own=hex2rgb(S.col);
  const col=YAC?own:mixc([214,211,200],own,.10);
  const h={poly,prof,wings,pods,nacs,eng,greeb,ants,ribs,canopy,stripe,fin,mark,
    hcls:S.hcls,clsRu:K.ru,tier:S.tier,seed:S.seed,lux:LUX,yac:YAC,form,pirate:!!(id&&id[0]==="p"),
    nose,bw,tail,len,tailW,halfW:hw,
    /* акцент — кирпичный сурик, а не подмешанный цвет владельца: подмес к
       голубому давал серо-сиреневое пятно, которого на борту не видно.
       Владелец слышен в нём чуть-чуть, остальное — краска, которой метят
       технику везде и всегда */
    col, own, accent:YAC?own:mixc([138,44,32],own,.10),
    /* железо навески: почти графит. Прежний светлый сталистый тон делал
       сопла белыми ушами по бокам кормы */
    iron:[52,55,62],
    lite:mixc(col,[255,255,255],.42), dark:mixc(col,[6,10,17],YAC?.82:.62),
    body:mixc(col,[8,13,21],YAC?.72:.34), edge:mixc(col,[10,16,26],YAC?.35:.5),
    /* ── материалы ──
       Весь корабль был выкрашен в один `col`, отчего выглядел пластиковым:
       обшивка, бак, контейнер, радиатор и керамика не отличались ничем.
       Четыре семейства, дальше все детали красятся только ими:
       `steel` — голый металл навески, цвета владельца не имеет вовсе;
       `foil` — мятая экранная изоляция, тёплая и матовая, ею укрыты баки;
       `radm` — радиатор: почти чёрный, он и должен быть холодным пятном;
       `cer`  — керамика щита: светлая, мёртвая, без блика. */
    steel:[118,124,132], foil:[176,148,86], radm:[26,29,34], cer:[196,192,182],
    /* ── материалы люксовой яхты ──
       У всех остальных корпусов материал говорит о работе: голый металл,
       фольга, радиатор. У яхты материал говорит о деньгах, и он обязан
       отличаться от всего флота: глубокий лак с металликом вместо крашеных
       листов, тик на открытой палубе, латунь в канте и жемчуг надстройки. */
    lac:mixc(col,[4,7,14],.62), gold:[212,176,98], teak:[166,122,72], pearl:[236,238,240]};
  HULL_CACHE[id]=h;return h;
}
function tracePoly(pts,sy){
  ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]*(sy||1));
  for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]*(sy||1));
  ctx.closePath();
}
/* факел: мягкое зарево + перо + добела раскалённое ядро.
   `cool` — люксовая тяга: вдвое короче, бело-голубая и почти без зарева.
   Оранжевый костёр на корме читается работой и топливом; дорогая вещь
   уходит тихо, и это видно раньше, чем читается название класса. */
function drawFlame(x,y,rad,pow,cool){
  const f=rad*(cool?1.5+Math.random()*.8:2.4+Math.random()*1.7)*pow;
  const gl=ctx.createRadialGradient(x-f*.25,y,0,x-f*.25,y,f*1.15);
  if(cool){gl.addColorStop(0,"rgba(150,205,255,.2)");gl.addColorStop(1,"rgba(110,170,255,0)");}
  else{gl.addColorStop(0,"rgba(255,180,110,.34)");gl.addColorStop(1,"rgba(255,120,60,0)");}
  ctx.fillStyle=gl;ctx.beginPath();ctx.arc(x-f*.25,y,f*1.15,0,TAU);ctx.fill();
  const g=ctx.createLinearGradient(x,y,x-f,y);
  if(cool){
    g.addColorStop(0,"rgba(255,255,255,.95)");g.addColorStop(.24,"rgba(198,232,255,.8)");
    g.addColorStop(.62,"rgba(126,178,255,.34)");g.addColorStop(1,"rgba(90,140,240,0)");
  }else{
  g.addColorStop(0,"rgba(255,246,220,.95)");g.addColorStop(.2,"rgba(255,194,112,.86)");
  g.addColorStop(.58,"rgba(255,116,62,.42)");g.addColorStop(1,"rgba(255,70,40,0)");}
  ctx.fillStyle=g;ctx.beginPath();
  ctx.moveTo(x,y-rad);
  ctx.quadraticCurveTo(x-f*.45,y-rad*.55,x-f,y);
  ctx.quadraticCurveTo(x-f*.45,y+rad*.55,x,y+rad);
  ctx.closePath();ctx.fill();
  /* ядро. Раскалённая сердцевина треугольником вблизи читается стрелкой —
     на венце из четырёх сопел получался ряд белых указателей. У холодной
     тяги ядро мягкое: вытянутая капля вдвое уже пера */
  if(cool){
    const cg=ctx.createLinearGradient(x,y,x-f*.5,y);
    cg.addColorStop(0,"rgba(255,255,255,.85)");
    cg.addColorStop(1,"rgba(210,235,255,0)");
    ctx.fillStyle=cg;
    ctx.beginPath();
    ctx.moveTo(x,y-rad*.3);
    ctx.quadraticCurveTo(x-f*.3,y-rad*.12,x-f*.5,y);
    ctx.quadraticCurveTo(x-f*.3,y+rad*.12,x,y+rad*.3);
    ctx.closePath();ctx.fill();
  }else{
  ctx.fillStyle="rgba(255,255,242,.8)";
  ctx.beginPath();ctx.moveTo(x,y-rad*.46);ctx.lineTo(x-f*.4,y);ctx.lineTo(x,y+rad*.46);
  ctx.closePath();ctx.fill();}
}
/* крен в виде сверху: скос + сжатие по размаху — ровно так кренящийся
   корпус и проецируется на плоскость экрана */
function bankTransform(bank){
  if(!bank)return false;
  ctx.save();
  /* сжатие по Y вместо скоса — так силуэт по-настоящему сужается, будто корпус
     поворачивается вокруг продольной оси, а не просто едет "плашмя" вбок */
  ctx.transform(1,0,0,Math.cos(bank),0,0);
  return true;
}
/* ── отделка по тиру ──
   Тир — не строчка в карточке, а то, как корпус выглядит. Рабочая лошадка ходит
   в заплатах и потёках, редкий носит акцентную окантовку, легендарный — двойной
   кант и эмблему на скуле, люкс — ленту окон и глянцевую блик-полосу, опытный
   показывает открытые узлы и кабели, которые на серийном закрыли бы кожухом.
   Рисуется ПОД навеской класса: это шкура корпуса, а не то, что на него навесили. */
function drawTierTrim(h){
  const t=h.tier;if(!t||t==="line")return;
  const P=h.prof,r=rng(hashi(h.seed||1,0x71E4,3));
  if(t==="work"){
    /* заплаты: куски обшивки другого тона и потёки под ними */
    const n=3+((r()*3)|0);
    for(let i=0;i<n;i++){
      const x=lerp(h.nose*.7,h.tail*.85,r()),w=profW(P,x);
      const px=x,py=(r()*2-1)*w*.55,pw=2.2+r()*4,ph=1.6+r()*2.6;
      ctx.fillStyle="rgba(0,0,0,.34)";ctx.fillRect(px-pw/2,py-ph/2,pw,ph);
      ctx.strokeStyle=rgba(h.lite,.34);ctx.lineWidth=.7;
      ctx.strokeRect(px-pw/2,py-ph/2,pw,ph);
      ctx.fillStyle="rgba(0,0,0,.14)";                 // потёк вниз по потоку
      ctx.fillRect(px-pw*.2,py+ph/2,pw*.4,1.4+r()*2.6);
    }
  }else if(t==="rare"){
    /* На костяном борту светлый кант пропал вовсе: белым по белому тир не
       читался, то есть игрок не видел, что корабль редкий. Метка редкого —
       ДВЕ нити краски по борту, тёмная и в цвет акцента: так метят технику
       ограниченной серии, и это видно на любом фоне. */
    for(const s of [1,-1]){
      ctx.strokeStyle="rgba(24,28,34,.55)";ctx.lineWidth=.9;
      ctx.beginPath();
      for(let i=1;i<P.length-1;i++)ctx.lineTo(P[i][0],P[i][1]*.86*s);
      ctx.stroke();
      ctx.strokeStyle=rgba(h.accent,.9);ctx.lineWidth=.5;
      ctx.beginPath();
      for(let i=1;i<P.length-1;i++)ctx.lineTo(P[i][0],P[i][1]*.86*s-.7*s);
      ctx.stroke();
    }
  }else if(t==="legend"){
    /* легенда — тот же приём, но в два пояса и с клеймом: у машины, которую
       знают по имени, метка крупнее и стоит на скуле, где её видно первой */
    for(const s of [1,-1])for(const f of [.9,.66]){
      ctx.strokeStyle="rgba(20,24,30,.6)";ctx.lineWidth=1.2;
      ctx.beginPath();
      for(let i=1;i<P.length-1;i++)ctx.lineTo(P[i][0],P[i][1]*f*s);
      ctx.stroke();
      ctx.strokeStyle=rgba(mixc(h.accent,[255,220,150],.35),.95);ctx.lineWidth=.55;
      ctx.beginPath();
      for(let i=1;i<P.length-1;i++)ctx.lineTo(P[i][0],P[i][1]*f*s-.6*s);
      ctx.stroke();
    }
    const ex=h.nose*.42,ew=Math.max(1.6,profW(P,ex)*.34);  // клеймо на скуле
    for(const s of [1,-1]){
      ctx.fillStyle=rgba(mixc(h.accent,[255,224,160],.4),.95);
      ctx.beginPath();ctx.moveTo(ex+ew,ew*.2*s);ctx.lineTo(ex,ew*1.2*s);
      ctx.lineTo(ex-ew,ew*.2*s);ctx.closePath();ctx.fill();
      ctx.strokeStyle="rgba(20,24,30,.6)";ctx.lineWidth=.35;ctx.stroke();
    }
  }else if(t==="luxe"){
    /* у люксовой ЯХТЫ вся отделка своя (drawLuxeSkin/drawLuxeDeck): лента
       автобусных окон по борту была первым, что выдавало в ней курьера */
    if(h.lux)return;
    /* лента окон по борту и глянец: яхту опознают по свету изнутри */
    for(const s of [1,-1]){
      const y0=h.nose*.42,y1=h.tail*.5;
      // окна крупнее и с тёплым свечением: на листе флота лента в полтора
      // пикселя пропадала, и яхта читалась курьером
      for(let x=y1;x<y0;x+=3.2){
        const w=profW(P,x);if(w<1.2)continue;
        ctx.fillStyle="rgba(255,236,190,.85)";
        ctx.fillRect(x,w*.72*s-.9,2.2,1.9);
        ctx.fillStyle="rgba(255,214,150,.22)";
        ctx.fillRect(x-.8,w*.72*s-1.7,3.8,3.5);
      }
      ctx.strokeStyle="rgba(255,255,255,.35)";ctx.lineWidth=.7;
      ctx.beginPath();
      for(let i=1;i<P.length-1;i++)ctx.lineTo(P[i][0],P[i][1]*.34*s);
      ctx.stroke();
    }
    const gg=ctx.createLinearGradient(h.nose,0,h.tail,0);  // продольный глянец
    gg.addColorStop(0,"rgba(255,255,255,.18)");
    gg.addColorStop(.45,"rgba(255,255,255,.02)");
    gg.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=gg;
    ctx.beginPath();
    for(let i=1;i<P.length-1;i++)ctx.lineTo(P[i][0],-P[i][1]*.55);
    for(let i=P.length-2;i>0;i--)ctx.lineTo(P[i][0],-P[i][1]*.12);
    ctx.closePath();ctx.fill();
  }else if(t==="proto"){
    /* открытые узлы: рама наружу, кабельная коса вдоль борта */
    ctx.strokeStyle="rgba(255,157,122,.5)";ctx.lineWidth=.7;
    for(const s of [1,-1]){
      ctx.beginPath();
      for(let i=2;i<P.length-2;i++)ctx.lineTo(P[i][0],P[i][1]*(.5+(i%2)*.28)*s);
      ctx.stroke();
    }
    for(let i=3;i<P.length-2;i+=2){                    // поперечины рамы
      ctx.strokeStyle="rgba(0,0,0,.35)";
      ctx.beginPath();ctx.moveTo(P[i][0],-P[i][1]*.8);ctx.lineTo(P[i][0],P[i][1]*.8);ctx.stroke();
    }
  }
}
/* приметы класса рисуются поверх корпуса, но под фонарём и огнями: это
   навеска, а не корпус, и она обязана читаться отдельным слоем */
/* ── тени навески на корпус ──
   Главное, чего кораблю не хватало: всё лежало в одной плоскости, и гондола
   ничем не отличалась от нарисованного на борту прямоугольника. Свет в кадре
   один и тот же для всех корпусов (сверху-слева, как на поверхности планеты),
   поэтому тень падает вниз-вправо, а её длина — это и есть высота детали.
   Тень клипуется по корпусу: за борт она уходить не должна, там пустота. */
const SH_DX=1.7, SH_DY=1.25;
function hullShade(h,hgt,fn){
  ctx.save();
  tracePoly(h.poly);ctx.clip();
  ctx.translate(SH_DX*hgt,SH_DY*hgt);
  ctx.fillStyle="rgba(0,0,0,.38)";
  fn();
  ctx.restore();
}
function drawHullMarks(h){
  const M=h.mark;if(!M)return;
  /* ── контактная тень ──
     Навеска отбрасывала тень только по своим габаритам, и в месте, где она
     СТОИТ на обшивке, стыка не было — деталь выглядела наклеенной. На листах
     под каждым агрегатом лежит короткая плотная тень у самого основания,
     помимо длинной по высоте. Это дешевле любой светотени и решает всё. */
  hullShade(h,.35,()=>{
    ctx.fillStyle="rgba(0,0,0,.5)";
    for(const n of h.nacs)for(const s of [1,-1])
      ctx.fillRect(n.x-n.l*.55,n.y*s-n.r*1.12,n.l*1.1,n.r*2.24);
    if(M.cont)for(const c of M.cont)for(const s of [1,-1]){
      const y=c[2]*s;
      ctx.fillRect(c[0]-.6,(s>0?y-c[2]*.55:y-c[2]*.45)-.6,c[1]+1.2,c[2]+1.2);
    }
    if(M.bridge)ctx.fillRect(M.bridge.x-M.bridge.l*.55,-M.bridge.w*.55,
                             M.bridge.l*1.1,M.bridge.w*1.1);
  });
  /* один проход теней на всю навеску: высота у каждой семьи своя */
  hullShade(h,1,()=>{
    for(const n of h.nacs)for(const s of [1,-1]){
      const y=n.y*s;
      ctx.fillRect(n.x-n.l*.5,y-n.r,n.l,n.r*2);
    }
    for(const p of h.pods)for(const s of (p[4]?[p[4]]:[1,-1]))
      ctx.fillRect(p[0],p[1]*s-(s>0?0:p[3]),p[2],p[3]);
    if(M.cont)for(const c of M.cont)for(const s of [1,-1]){
      const y=c[2]*s;
      ctx.fillRect(c[0],s>0?y-c[2]*.55:y-c[2]*.45,c[1],c[2]);
    }
    if(M.guns)for(const g of M.guns)for(const s of [1,-1])
      ctx.fillRect(g[0]-4.5,g[1]*s-2.2,9,4.4);
  });
  /* рубка выше всего остального, поэтому её тень длиннее */
  if(M.bridge)hullShade(h,1.9,()=>{
    ctx.fillRect(M.bridge.x-M.bridge.l*.5,-M.bridge.w*.5,M.bridge.l,M.bridge.w);
  });
  if(M.cont)M.cont.forEach((c,ci)=>{for(const s of [1,-1]){
    const y=c[2]*s;
    /* контейнер — чужая тара, а не часть корабля: он из голого металла и
       цвета владельца не имеет. Один этот сдвиг материала снимает половину
       «пластиковости»: корабль перестаёт быть выкрашенным целиком */
    const gy=s>0?y-c[2]*.55:y-c[2]*.45;
    /* ── тара разного хозяина ──
       Контейнеры были одного стального тона, и палуба читалась одной деталью
       с насечками. На листах это главное украшение грузовика: ящики РАЗНЫЕ —
       синий, ржавый, оливковый, выгоревший серый, каждый со своей историей.
       Тон берётся от индекса и семени, поэтому у корабля он постоянен. */
    const CARGO=[[62,86,116],[128,72,44],[86,92,64],[112,116,120],[54,60,70]];
    const cc=CARGO[hashi(ci,h.seed,0x3F1)%CARGO.length];
    const g=ctx.createLinearGradient(0,gy,0,gy+c[2]);
    g.addColorStop(0,rgba(mixc(cc,[255,255,255],.26),1));
    g.addColorStop(1,rgba(mixc(cc,[0,0,0],.5),1));
    ctx.fillStyle=g;ctx.strokeStyle=rgba(mixc(h.steel,[0,0,0],.7),1);ctx.lineWidth=.45;
    ctx.beginPath();ctx.rect(c[0],gy,c[1],c[2]);
    ctx.fill();ctx.stroke();
    /* стяжки контейнера: без них ящик читается пустым прямоугольником */
    ctx.strokeStyle="rgba(0,0,0,.42)";ctx.lineWidth=.7;
    ctx.beginPath();
    ctx.moveTo(c[0]+c[1]*.5,s>0?y-c[2]*.55:y-c[2]*.45);
    ctx.lineTo(c[0]+c[1]*.5,(s>0?y-c[2]*.55:y-c[2]*.45)+c[2]);
    ctx.stroke();
  }});
  if(M.drill){
    const d=M.drill;
    ctx.fillStyle=rgba(h.lite,.85);
    ctx.beginPath();
    ctx.moveTo(d.x+d.l,0);ctx.lineTo(d.x,-d.r);ctx.lineTo(d.x,d.r);ctx.closePath();
    ctx.fill();
    ctx.strokeStyle=rgba(h.dark,1);ctx.lineWidth=.45;
    for(let i=1;i<4;i++){
      const t=i/4;
      ctx.beginPath();
      ctx.moveTo(d.x+d.l*t,-d.r*(1-t));ctx.lineTo(d.x+d.l*t,d.r*(1-t));ctx.stroke();
    }
  }
  /* Спонсон: площадка за бортом на короткой консоли, на ней тумба и ствол
     вперёд. Раньше ствол лежал вдоль скулы внутри контура — на силуэте его
     не было вовсе, и фрегат читался разведчиком. */
  if(M.guns)for(const g of M.guns)for(const s of [1,-1]){
    const y=g[1]*s;
    ctx.strokeStyle=rgba(h.col,.75);ctx.lineWidth=.55;
    ctx.beginPath();ctx.moveTo(g[0]-1,h.bw*.5*s);ctx.lineTo(g[0]-1,y);ctx.stroke();
    ctx.fillStyle=rgba(h.body,1);
    ctx.strokeStyle=rgba(h.lite,.5);ctx.lineWidth=.45;
    ctx.beginPath();ctx.rect(g[0]-4.5,y-2.2*s-(s>0?0:0),9,4.4*s);
    ctx.fill();ctx.stroke();
    /* Ствол был линией с шариком на конце — на листе это читалось грибом
       на ножке. У ствола есть казённик (толстый, у самой тумбы), тело,
       сходящее на конус, и дульный срез — короткое утолщение, а не шар. */
    ctx.fillStyle=rgba(h.steel,1);
    ctx.fillRect(g[0]+.5,y-1.05,3.2,2.1);
    ctx.beginPath();
    ctx.moveTo(g[0]+3.4,y-.8);ctx.lineTo(g[0]+g[2]-1.4,y-.45);
    ctx.lineTo(g[0]+g[2]-1.4,y+.45);ctx.lineTo(g[0]+3.4,y+.8);
    ctx.closePath();ctx.fill();
    ctx.fillStyle=rgba(mixc(h.steel,[0,0,0],.42),1);
    ctx.fillRect(g[0]+g[2]-1.6,y-.8,1.7,1.6);
    ctx.fillStyle=rgba(h.dark,1);
    ctx.fillRect(g[0]+g[2]-.45,y-.3,.6,.6);
  }
  if(M.armor){
    /* скула: утолщённая носовая плита, из-за неё фрегат выглядит тупоносым */
    ctx.fillStyle=rgba(h.lite,.28);
    ctx.beginPath();
    ctx.moveTo(h.nose,0);
    ctx.lineTo(M.armor,-profW(h.prof,M.armor)*.92);
    ctx.lineTo(M.armor,profW(h.prof,M.armor)*.92);
    ctx.closePath();ctx.fill();
    ctx.strokeStyle=rgba(h.col,.6);ctx.lineWidth=.5;ctx.stroke();
  }
  /* Панели раскрыты поперёк корпуса на кронштейнах и разбиты на секции: это
     плоскость, а не полоска у борта. Прямые углы против стреловидного крыла —
     единственное, что надёжно отличает исследователя от разведчика. */
  if(M.panel)for(const s of [1,-1]){
    const p=M.panel, y0=p.w*s, th=3.4;
    ctx.strokeStyle=rgba(h.col,.6);ctx.lineWidth=.5;
    ctx.beginPath();
    ctx.moveTo(p.x-p.l*.22,h.bw*.5*s);ctx.lineTo(p.x-p.l*.16,y0);
    ctx.moveTo(p.x+p.l*.22,h.bw*.5*s);ctx.lineTo(p.x+p.l*.16,y0);
    ctx.stroke();
    ctx.fillStyle="rgba(34,58,96,.9)";
    ctx.strokeStyle=rgba(h.lite,.55);ctx.lineWidth=.5;
    const py=y0-(s>0?0:th);
    ctx.beginPath();ctx.rect(p.x-p.l*.5,py,p.l,th);ctx.fill();ctx.stroke();
    ctx.strokeStyle="rgba(150,190,230,.30)";ctx.lineWidth=.7;
    for(let k=1;k<4;k++){
      const gx=p.x-p.l*.5+p.l*k/4;
      ctx.beginPath();ctx.moveTo(gx,py);ctx.lineTo(gx,py+th);ctx.stroke();
    }
  }
  if(M.dish){
    const d=M.dish, dy=-h.bw-d.boom;
    ctx.strokeStyle=rgba(h.col,.6);ctx.lineWidth=.5;
    ctx.beginPath();ctx.moveTo(d.x,0);ctx.lineTo(d.x-d.boom*.4,dy);ctx.stroke();
    ctx.fillStyle="rgba(200,230,245,.22)";
    ctx.strokeStyle=rgba(h.lite,.7);ctx.lineWidth=.5;
    ctx.beginPath();
    ctx.ellipse(d.x-d.boom*.4,dy,d.r,d.r*.55,-.5,0,TAU);
    ctx.fill();ctx.stroke();
    /* облучатель на трёх ногах: без него тарелка читается блином */
    if(d.r>2.6){
      ctx.strokeStyle=rgba(h.lite,.5);ctx.lineWidth=.7;
      ctx.beginPath();
      ctx.moveTo(d.x-d.boom*.4-d.r*.7,dy);ctx.lineTo(d.x-d.boom*.4+d.r*.15,dy-d.r*.8);
      ctx.lineTo(d.x-d.boom*.4+d.r*.7,dy);ctx.stroke();
    }
  }
  /* ── рубка ── стоит НАД палубой: тёмный цоколь по нижней кромке, светлый
     верх, ряд окон по фронту. Ярусность и есть тот объём, которого нет у
     плоского вида сверху: у детали появляется низ и верх, а не только пятно */
  if(M.bridge){
    const B=M.bridge, x0=B.x-B.l*.5, y0=-B.w*.5;
    const g=ctx.createLinearGradient(0,y0,0,y0+B.w);
    g.addColorStop(0,rgba(mixc(h.body,[255,255,255],.24),1));
    g.addColorStop(.55,rgba(h.body,1));
    g.addColorStop(1,rgba(h.dark,1));
    ctx.fillStyle=g;ctx.fillRect(x0,y0,B.l,B.w);
    ctx.fillStyle="rgba(0,0,0,.5)";ctx.fillRect(x0,y0+B.w-.7,B.l,.7);  // цоколь
    ctx.fillStyle=rgba(h.lite,.55);ctx.fillRect(x0,y0,B.l,.5);         // верхняя грань
    ctx.strokeStyle=rgba(h.dark,1);ctx.lineWidth=.45;
    ctx.strokeRect(x0+.22,y0+.22,B.l-.44,B.w-.44);
    /* окна рубки по фронту — вперёд смотрят люди, а не пушки */
    ctx.fillStyle="rgba(186,232,250,.62)";
    const wn=Math.max(2,Math.round(B.w/2.2));
    for(let i=0;i<wn;i++)
      ctx.fillRect(x0+B.l-1.5,y0+1+i*(B.w-2)/wn,1,Math.max(.8,(B.w-2)/wn-.7));
  }
  /* ── причальный узел ──
     Хвост, записанный в план ещё после яхты: кольцо было тремя серыми
     окружностями — шайба, приклеенная к борту, самая дешёвая деталь на
     корпусе, где всё остальное уже доведено. Настоящий узел — это ВОРОТНИК:
     утопленная площадка с тёмным жерлом, кольцевой фланец с крепежом по
     кругу, три захвата и белая наводочная метка, по которой к нему целятся.
     Здесь не нужен ни один новый приём — только те, что уже работают на
     обшивке: тон, тень, крепёж, краска. */
  if(M.dock){
    const D2=M.dock, y=profW(h.prof,D2.x)*.86*D2.s, R=D2.r*1.15;
    const met=h.yac?h.steel:h.iron;
    ctx.fillStyle="rgba(0,0,0,.4)";                       // тень воротника
    ctx.beginPath();ctx.arc(D2.x+.5,y+.5,R*1.12,0,TAU);ctx.fill();
    const g=ctx.createRadialGradient(D2.x-R*.4,y-R*.4,R*.1,D2.x,y,R*1.1);
    g.addColorStop(0,rgba(mixc(met,[255,255,255],.42),1));
    g.addColorStop(1,rgba(mixc(met,[0,0,0],.2),1));
    ctx.fillStyle=g;
    ctx.beginPath();ctx.arc(D2.x,y,R*1.1,0,TAU);ctx.fill();
    ctx.strokeStyle=rgba(mixc(met,[0,0,0],.7),1);ctx.lineWidth=.45;ctx.stroke();
    ctx.fillStyle="rgba(6,8,12,.95)";                     // жерло
    ctx.beginPath();ctx.arc(D2.x,y,R*.5,0,TAU);ctx.fill();
    ctx.strokeStyle=rgba(mixc(met,[255,255,255],.3),.9);ctx.lineWidth=.35;ctx.stroke();
    ctx.fillStyle=rgba(mixc(met,[0,0,0],.55),1);          // крепёж по фланцу
    for(let i=0;i<8;i++){
      const a=i*TAU/8+.2;
      ctx.beginPath();ctx.arc(D2.x+Math.cos(a)*R*.82,y+Math.sin(a)*R*.82,.28,0,TAU);ctx.fill();
    }
    ctx.strokeStyle=rgba(mixc(met,[255,255,255],.25),1);ctx.lineWidth=.5;
    for(let i=0;i<3;i++){                                 // захваты
      const a=i*TAU/3+.4;
      ctx.beginPath();
      ctx.moveTo(D2.x+Math.cos(a)*R*.52,y+Math.sin(a)*R*.52);
      ctx.lineTo(D2.x+Math.cos(a)*R*1.02,y+Math.sin(a)*R*1.02);ctx.stroke();
    }
    if(!h.yac){                                           // наводочная метка
      ctx.strokeStyle="rgba(236,236,228,.75)";ctx.lineWidth=.4;
      ctx.beginPath();
      ctx.moveTo(D2.x-R*1.5,y);ctx.lineTo(D2.x-R*1.15,y);
      ctx.moveTo(D2.x+R*1.15,y);ctx.lineTo(D2.x+R*1.5,y);ctx.stroke();
    }
  }
  /* ── шлюз ── с одного борта, с поручнем: место, куда выходит человек.
     Масштаб задаётся им же — по люку видно, какого корабль размера */
  if(M.lock&&M.lock.r>1){
    const L=M.lock, y=profW(h.prof,L.x)*.72*L.s;
    const met=h.yac?h.steel:h.iron;
    /* второй хвост из плана: люк был кружком в кружке. Люк, из которого
       выходит человек, устроен иначе — он ОБРАМЛЁН: утопленная рама, створка
       со скруглением, ручка-штурвал посередине, поручень рядом и жёлтая
       окантовка проёма. По нему же читается размер всего корабля. */
    ctx.fillStyle="rgba(0,0,0,.38)";
    ctx.fillRect(L.x-L.r*1.15+.4,y-L.r*1.05+.4,L.r*2.3,L.r*2.1);
    ctx.fillStyle=rgba(mixc(met,[0,0,0],.35),1);
    ctx.fillRect(L.x-L.r*1.15,y-L.r*1.05,L.r*2.3,L.r*2.1);
    ctx.strokeStyle="rgba(196,142,52,.4)";ctx.lineWidth=.35;  // окантовка проёма
    ctx.strokeRect(L.x-L.r*1.15,y-L.r*1.05,L.r*2.3,L.r*2.1);
    const g=ctx.createLinearGradient(0,y-L.r,0,y+L.r);
    g.addColorStop(0,rgba(mixc(met,[255,255,255],.34),1));
    g.addColorStop(1,rgba(mixc(met,[0,0,0],.5),1));
    ctx.fillStyle=g;
    ctx.beginPath();ctx.arc(L.x,y,L.r*.82,0,TAU);ctx.fill();
    ctx.strokeStyle="rgba(0,0,0,.55)";ctx.lineWidth=.4;ctx.stroke();
    ctx.strokeStyle=rgba(mixc(met,[255,255,255],.4),1);ctx.lineWidth=.4;
    for(let i=0;i<4;i++){                                     // штурвал
      const a=i*TAU/4+.3;
      ctx.beginPath();
      ctx.moveTo(L.x+Math.cos(a)*L.r*.18,y+Math.sin(a)*L.r*.18);
      ctx.lineTo(L.x+Math.cos(a)*L.r*.6,y+Math.sin(a)*L.r*.6);ctx.stroke();
    }
    ctx.beginPath();ctx.arc(L.x,y,L.r*.2,0,TAU);ctx.stroke();
    ctx.strokeStyle=rgba(mixc(met,[255,255,255],.2),1);ctx.lineWidth=.4;  // поручень
    ctx.beginPath();
    ctx.moveTo(L.x-L.r*1.5,y+L.r*1.35*L.s);ctx.lineTo(L.x+L.r*1.5,y+L.r*1.35*L.s);
    ctx.moveTo(L.x-L.r*1.5,y+L.r*1.35*L.s);ctx.lineTo(L.x-L.r*1.4,y+L.r*1.05*L.s);
    ctx.moveTo(L.x+L.r*1.5,y+L.r*1.35*L.s);ctx.lineTo(L.x+L.r*1.4,y+L.r*1.05*L.s);
    ctx.stroke();
  }
  /* ── манипулятор ── одна штука, с одного борта, сложен вдоль корпуса */
  if(M.arm){
    const A=M.arm, y=profW(h.prof,A.x)*.85*A.s;
    ctx.strokeStyle=rgba(h.steel,1);ctx.lineWidth=1;
    ctx.beginPath();
    ctx.moveTo(A.x,y);ctx.lineTo(A.x+A.a1,y+A.a1*.35*A.s);
    ctx.lineTo(A.x+A.a1-A.a2*.7,y+(A.a1*.35+A.a2)*A.s);ctx.stroke();
    ctx.fillStyle=rgba(h.steel,1);
    ctx.beginPath();ctx.arc(A.x,y,1.1,0,TAU);ctx.fill();
    ctx.beginPath();ctx.arc(A.x+A.a1,y+A.a1*.35*A.s,.9,0,TAU);ctx.fill();
    ctx.strokeStyle=rgba(h.lite,.55);ctx.lineWidth=.4;   // схват
    const gx=A.x+A.a1-A.a2*.7, gy=y+(A.a1*.35+A.a2)*A.s;
    ctx.beginPath();ctx.moveTo(gx-1.4,gy);ctx.lineTo(gx,gy+1.6*A.s);
    ctx.lineTo(gx+1.4,gy);ctx.stroke();
  }
  /* ── бортовой номер ── трафаретом, вдоль борта, всегда мельче всего
     остального: его не читают, его замечают */
  if(M.num&&h.bw>2.6){
    ctx.save();
    /* номер лежит на СВОЁМ поле: светлая плашка с тёмной рамкой. Без неё
       буквы плавали поверх швов и разнотона и читались водяным знаком */
    if(!h.yac){
      ctx.save();
      ctx.translate(lerp(h.nose*.35,h.tail*.5,.5),-h.bw*.52);
      ctx.rotate(Math.PI/2);
      const tw=M.num.length*1.7;
      ctx.fillStyle="rgba(228,228,220,.85)";ctx.fillRect(-tw/2-.6,-1.7,tw+1.2,3.4);
      ctx.strokeStyle="rgba(20,24,30,.5)";ctx.lineWidth=.35;
      ctx.strokeRect(-tw/2-.6,-1.7,tw+1.2,3.4);
      ctx.restore();
    }
    ctx.fillStyle=h.yac?"rgba(232,238,245,.42)":"rgba(24,28,34,.9)";
    ctx.font="2.6px ui-monospace,monospace";
    ctx.textAlign="center";ctx.textBaseline="middle";
    /* Читается по ходу корабля, а не вверх ногами: корпус рисуется уже
       повёрнутым носом вперёд, поэтому надпись доворачивается в другую
       сторону — на зуме перевёрнутый номер был первым, что бросалось в глаза */
    ctx.translate(lerp(h.nose*.35,h.tail*.5,.5),-h.bw*.52);
    ctx.rotate(Math.PI/2);
    ctx.fillText(M.num,0,0);
    ctx.restore();
  }
  /* штанга приборов вперёд: у разведчика нос продолжается за габарит */
  if(M.boom){
    const b=M.boom;
    ctx.strokeStyle=rgba(h.lite,.55);ctx.lineWidth=b.r*.9;
    ctx.beginPath();ctx.moveTo(h.nose,0);ctx.lineTo(h.nose+b.l,0);ctx.stroke();
    ctx.fillStyle=rgba(h.lite,.6);
    ctx.beginPath();ctx.arc(h.nose+b.l,0,b.r*1.5,0,TAU);ctx.fill();
    for(const s of [1,-1]){
      ctx.strokeStyle=rgba(h.col,.55);ctx.lineWidth=.7;
      ctx.beginPath();
      ctx.moveTo(h.nose+b.l*.62,0);ctx.lineTo(h.nose+b.l*.5,s*b.r*3.6);ctx.stroke();
    }
  }
  if(M.win&&!h.lux){
    /* лента окон — единственное, что отличает яхту от курьера на расстоянии */
    ctx.fillStyle="rgba(190,240,255,.55)";
    const y=h.bw*.28;
    for(let x=M.win[0];x>M.win[1];x-=3.2)ctx.fillRect(x,-y-.6,1.7,1.2);
  }
  if(M.lux)drawLuxeDeck(h,M.lux);
}
/* ══════════════ люксовая яхта ══════════════
   Единственный корпус, который покупают не за работу, а за вид, — и до сих пор
   он был иглой курьера с лентой окон. Проход первый: ФОРМА. Высоту в виде
   сверху даёт только ярус и тень, поэтому надстройка строится снизу вверх:
   цоколь темнее палубы, верхняя грань светлее, тень длиннее у того яруса,
   который выше. Всё остальное (материал, свет, роскошь) — следующими
   проходами: сначала тело, потом уже отделка. */
/* ── проход второй: ФАКТУРА ──
   Первый проход дал яхте тело, но шкура на ней осталась общефлотская: листы
   разного тона, швы, заклёпки. Клёпаный лист — это про ремонт в поле, а не про
   деньги. У люкса три фактуры, и ни одной из них нет больше ни у кого:
   лак (глубокий тон + металлик зерном + одна протяжная блик-полоса),
   тик открытой палубы (тёплые доски с тёмным швом) и латунь в канте.
   Рисуется внутри обрезки по корпусу, вместо листов обшивки. */
/* палитра отделки: три школы, и они не смешиваются */
function luxPal(h){
  const st=h.mark.lux&&h.mark.lux.style;
  /* рядовая яхта той же формы, но без денег: крашеный борт, стальная навеска
     и настил из того же металла. Форма — класс, отделка — тир */
  if(!h.lux)return{lac:h.body,trim:h.steel,trimHi:h.lite,deck:mixc(h.steel,[0,0,0],.3)};
  if(st==="pearl")return{lac:mixc(h.col,[255,255,255],.62),
    trim:[206,212,218],trimHi:[252,254,255],deck:[186,182,172]};
  if(st==="noir")return{lac:mixc(h.col,[0,0,0],.86),
    trim:[226,186,102],trimHi:[255,242,206],deck:[86,64,42]};
  return{lac:h.lac,trim:h.gold,trimHi:[255,246,220],deck:h.teak};
}
function drawLuxeSkin(h){
  const P=h.prof,PAL=luxPal(h);
  /* лак: тон глубже корпусного, к борту уходит в почти чёрное */
  const lg=ctx.createLinearGradient(0,-h.bw*1.15,0,h.bw*1.15);
  lg.addColorStop(0,rgba(mixc(PAL.lac,[255,255,255],.30),1));
  lg.addColorStop(.34,rgba(PAL.lac,1));
  lg.addColorStop(1,rgba(mixc(PAL.lac,[0,0,0],.55),1));
  ctx.fillStyle=lg;ctx.fillRect(h.tail-2,-h.bw*1.35,h.len+6,h.bw*2.7);
  /* металлик: зерно из светлых точек. Оно не читается как точки — оно даёт
     лаку глубину, которой не даёт ни один градиент */
  /* зерно мельче и слабее вдвое: на первом заходе точки читались пылью
     на носу, а не глубиной лака */
  for(let i=0;i<220;i++){
    const hh=hashi(i,h.seed,0x9E37);
    const x=lerp(h.nose,h.tail,((hh>>>3)&255)/255);
    const w=profW(P,x), y=(((hh>>>11)&255)/255-.5)*w*1.9;
    ctx.fillStyle="rgba(255,252,240,"+(.025+((hh>>>19)&7)*.006).toFixed(3)+")";
    ctx.fillRect(x,y,.4,.4);
  }
  /* протяжный блик по лаку: одна широкая мягкая полоса вдоль скулы — так
     выглядит полированная поверхность, и только так */
  const sg=ctx.createLinearGradient(0,-h.bw*.95,0,-h.bw*.05);
  sg.addColorStop(0,"rgba(255,255,255,0)");
  sg.addColorStop(.55,"rgba(255,255,255,.16)");
  sg.addColorStop(1,"rgba(255,255,255,0)");
  ctx.fillStyle=sg;ctx.fillRect(h.tail,-h.bw,h.len,h.bw);
  /* тик: НЕ по всему корпусу.
     Первый вариант мостил доской всё от носа до кормы, и яхта читалась плотом:
     дерево там, где под ним салон, — это не роскошь, а паркет. Тик кладётся
     ровно туда, где ходит человек: бак, ют вокруг площадки и две прогулочные
     полосы вдоль борта. Всё остальное — лак. */
  const L=h.mark.lux;
  const zones=[];
  if(L){
    const d0=L.deck[0];
    zones.push([d0.x1,h.nose*.62,-h.bw*1.3,h.bw*1.3]);          // бак
    zones.push([h.tail*.98,d0.x0,-h.bw*1.3,h.bw*1.3]);          // ют
    zones.push([d0.x0,d0.x1,d0.w*.5,h.bw*1.3]);                 // борт правый
    zones.push([d0.x0,d0.x1,-h.bw*1.3,-d0.w*.5]);               // борт левый
  }else zones.push([h.tail*.92,h.nose*.72,-h.bw*1.3,h.bw*1.3]);
  ctx.save();
  ctx.beginPath();
  for(let i=1;i<P.length-1;i++)ctx.lineTo(P[i][0],-P[i][1]*.9);
  for(let i=P.length-2;i>0;i--)ctx.lineTo(P[i][0],P[i][1]*.9);
  ctx.closePath();ctx.clip();
  for(const z of zones){
    const zx=Math.min(z[0],z[1]),zw=Math.abs(z[1]-z[0]),zy=z[2],zh=z[3]-z[2];
    ctx.fillStyle=rgba(mixc(PAL.deck,[20,16,12],.30),1);
    ctx.fillRect(zx,zy,zw,zh);
    ctx.strokeStyle="rgba(28,20,14,.5)";ctx.lineWidth=.3;      // швы между досок
    for(let y=zy;y<zy+zh;y+=1.05){
      ctx.beginPath();ctx.moveTo(zx,y);ctx.lineTo(zx+zw,y);ctx.stroke();
    }
    /* тёмная окантовка настила: у палубы есть край, и он всегда виден */
    ctx.strokeStyle="rgba(24,17,11,.6)";ctx.lineWidth=.5;
    ctx.strokeRect(zx,zy,zw,zh);
    ctx.fillStyle="rgba(255,236,190,.07)";ctx.fillRect(zx,zy,zw,zh); // лак по тику
  }
  /* поперечные стыки досок — вразбежку, иначе палуба читается решёткой */
  ctx.strokeStyle="rgba(28,20,14,.3)";ctx.lineWidth=.3;
  for(let i=0;i<26;i++){
    const hh=hashi(i,h.seed,0x77A1);
    const x=lerp(h.nose*.8,h.tail*.9,((hh>>>4)&63)/63), y=(((hh>>>12)&31)/31-.5)*h.bw*2.2;
    ctx.beginPath();ctx.moveTo(x,y-.55);ctx.lineTo(x,y+.55);ctx.stroke();
  }
  ctx.restore();
  /* латунный кант по борту: две нити, широкая тусклая и узкая яркая —
     полированный металл всегда пара «тело + блик», одной линией он не бывает */
  /* кант идёт от носа только до миделя: на узком длинном корпусе две нити во
     всю длину съедали половину ширины, и тело читалось полосатой рейкой */
  const kEnd=Math.max(2,Math.floor(P.length*.55));
  for(const s of [1,-1]){
    ctx.strokeStyle=rgba(mixc(PAL.trim,[40,26,8],.42),1);ctx.lineWidth=.7;
    ctx.beginPath();
    for(let i=1;i<kEnd;i++)ctx.lineTo(P[i][0],P[i][1]*.86*s);
    ctx.stroke();
    ctx.strokeStyle=rgba(mixc(PAL.trim,[255,240,200],.42),.8);ctx.lineWidth=.3;
    ctx.beginPath();
    for(let i=1;i<kEnd;i++)ctx.lineTo(P[i][0],P[i][1]*.86*s-.45);
    ctx.stroke();
  }
}
function drawLuxeDeck(h,L){
  const PAL=luxPal(h);
  /* тени ярусов: длина тени и есть высота. Один свет на весь корабль */
  for(const d of L.deck)hullShade(h,d.h,()=>{
    ctx.fillRect(d.x0,-d.w*.5,d.x1-d.x0,d.w);
  });
  hullShade(h,.5,()=>{
    ctx.beginPath();ctx.arc(L.pad.x,0,L.pad.r,0,TAU);ctx.fill();
  });
  /* площадка на юте: круг разметки на пустой корме */
  ctx.strokeStyle=rgba(h.lite,.5);ctx.lineWidth=.5;
  ctx.beginPath();ctx.arc(L.pad.x,0,L.pad.r,0,TAU);ctx.stroke();
  ctx.strokeStyle=rgba(h.lite,.22);
  ctx.beginPath();ctx.arc(L.pad.x,0,L.pad.r*.62,0,TAU);ctx.stroke();
  /* прогулочная палуба вдоль борта: ограждение стойками, а не линией —
     по нему и читается, что по борту ходит человек */
  /* ── ограждение ──
     Нитка в .45 со стойками пропадала на любом масштабе мельче трёх: игрок
     видел голый борт там, где должна читаться прогулочная палуба. Ограждение
     работает не линией, а КОНТРАСТОМ: тёмная тень настила под ним и светлый
     поручень над — пара, которая на мелком масштабе сливается в одну заметную
     кромку, а на крупном распадается обратно на стойки и перила. */
  for(const s of [1,-1]){
    const x0=L.rail[0],x1=L.rail[1];
    ctx.strokeStyle="rgba(10,14,20,.5)";ctx.lineWidth=1.1;
    ctx.beginPath();
    for(let x=x0;x>x1;x-=1.2)ctx.lineTo(x,profW(h.prof,x)*.9*s+.5*s);
    ctx.stroke();
    ctx.strokeStyle=rgba(mixc(h.lite,[255,255,255],.5),.85);ctx.lineWidth=.6;
    ctx.beginPath();
    for(let x=x0;x>x1;x-=1.2)ctx.lineTo(x,profW(h.prof,x)*.9*s);
    ctx.stroke();
    ctx.strokeStyle=rgba(h.lite,.3);ctx.lineWidth=.4;
    for(let x=x0;x>x1;x-=2.6){
      const y=profW(h.prof,x)*.9*s;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-1.1*s);ctx.stroke();
    }
  }
  /* тёплый разлив света от салона на палубу: свет, который ничего не освещает,
     — это плёнка поверх кадра, а не свет. Ложится ДО ярусов, чтобы уйти под
     надстройку, а не лечь на неё */
  {
    const d=L.deck[0],dl=d.x1-d.x0;
    for(const s of [1,-1]){
      const y=d.w*.5*s;
      const g=ctx.createLinearGradient(0,y,0,y+1.8*s);
      g.addColorStop(0,"rgba(255,214,150,.16)");
      g.addColorStop(1,"rgba(255,190,120,0)");
      ctx.fillStyle=g;
      ctx.fillRect(d.x0+dl*.08,Math.min(y,y+1.8*s),dl*.84,1.8);
    }
  }
  /* ярусы снизу вверх.
     Надстройка — ЖЕМЧУГ, а не цвет корпуса: белая надстройка на тёмном лаке
     и есть тот контраст, по которому яхту опознают за километр. Ярус выше —
     светлее, и на каждом лежит карбон: тонкая косая сетка, четвёртая фактура
     кадра и единственная в игре. */
  for(let i=0;i<L.deck.length;i++){
    const d=L.deck[i],y0=-d.w*.5,dl=d.x1-d.x0;
    const base=mixc(h.pearl,h.col,.16-i*.05);
    const g=ctx.createLinearGradient(0,y0,0,y0+d.w);
    g.addColorStop(0,rgba(mixc(base,[255,255,255],.22),1));
    g.addColorStop(.45,rgba(base,1));
    g.addColorStop(1,rgba(mixc(base,[24,30,40],.52),1));
    ctx.fillStyle=g;ctx.fillRect(d.x0,y0,dl,d.w);
    /* Косая сетка «карбона» вблизи читалась шашечкой из прозрачных клеток —
       единственное место кадра, где вылезал пиксель. Фактура надстройки теперь
       ПРОДОЛЬНАЯ: две-три тонкие нити вдоль, как стык панелей обтекателя.
       Правило простое: на детали в три пикселя шириной сетка не живёт. */
    ctx.save();
    ctx.beginPath();ctx.rect(d.x0,y0,dl,d.w);ctx.clip();
    ctx.strokeStyle="rgba(20,26,34,.10)";ctx.lineWidth=.3;
    for(let k=1;k<3;k++){
      const ly=y0+d.w*k/3;
      ctx.beginPath();ctx.moveTo(d.x0+dl*.06,ly);ctx.lineTo(d.x0+dl*.94,ly);ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle="rgba(0,0,0,.5)";ctx.fillRect(d.x0,y0+d.w-.6,dl,.6);   // цоколь
    ctx.fillStyle="rgba(255,255,255,.62)";ctx.fillRect(d.x0,y0,dl,.45);  // верхняя грань
    /* латунная окантовка яруса — тот же материал, что и кант по борту */
    ctx.strokeStyle=rgba(mixc(PAL.trim,[40,26,8],.3),.9);ctx.lineWidth=.4;
    ctx.strokeRect(d.x0+.2,y0+.2,dl-.4,d.w-.4);
    /* ── панорама ──
       Двадцать одинаковых окошек по борту — это автобус. У салона стекло
       СПЛОШНОЕ: тёмная полоса от борта до борта яруса, тёплый свет изнутри
       и один косой блик по стеклу. Ярус выше — полоса короче. */
    if(i<2){
      const gy=d.w*(i?.30:.34), gh=Math.max(.9,d.w*.16);
      for(const s of [1,-1]){
        const wy=gy*s-(s>0?0:gh);
        const wg=ctx.createLinearGradient(d.x0,0,d.x1,0);
        wg.addColorStop(0,"rgba(12,20,30,.95)");
        wg.addColorStop(.45,"rgba(255,224,168,.85)");
        wg.addColorStop(.75,"rgba(255,206,140,.55)");
        wg.addColorStop(1,"rgba(12,20,30,.95)");
        ctx.fillStyle=wg;ctx.fillRect(d.x0+dl*.08,wy,dl*.84,gh);
        ctx.strokeStyle=rgba(mixc(PAL.trim,[60,40,14],.25),.9);ctx.lineWidth=.35;
        ctx.strokeRect(d.x0+dl*.08,wy,dl*.84,gh);
        ctx.fillStyle="rgba(255,255,255,.35)";                 // косой блик
        ctx.fillRect(d.x0+dl*.5,wy,dl*.1,gh*.5);
      }
    }else{
      /* ── купол рубки ──
         Верхний ярус с карбоновой сеткой читался куском марли в шашечку.
         На самом верху яхты стоит стеклянный колпак: тёмное стекло, тёплый
         свет из-под него и один блик — половина овала, а не сетка */
      const cx=(d.x0+d.x1)*.5,rx=dl*.42,ry=d.w*.42;
      const dg=ctx.createRadialGradient(cx+rx*.3,-ry*.3,ry*.1,cx,0,rx);
      dg.addColorStop(0,"rgba(255,236,196,.85)");
      dg.addColorStop(.55,"rgba(120,150,175,.5)");
      dg.addColorStop(1,"rgba(14,22,32,.95)");
      ctx.fillStyle=dg;
      ctx.beginPath();ctx.ellipse(cx,0,rx,ry,0,0,TAU);ctx.fill();
      ctx.strokeStyle=rgba(mixc(PAL.trim,[255,244,214],.3),.9);ctx.lineWidth=.4;ctx.stroke();
      ctx.fillStyle="rgba(255,255,255,.4)";
      ctx.beginPath();ctx.ellipse(cx+rx*.28,-ry*.34,rx*.3,ry*.22,-.5,0,TAU);ctx.fill();
    }
  }
  /* ── волнорез ── латунная накладка по обводу носа: нос был тёмным капотом
     с зерном металлика и читался пятном грязи. Металл на носу — то, обо что
     свет бьётся первым, и он обязан быть самым ярким местом корпуса */
  for(const s of [1,-1]){
    ctx.strokeStyle=rgba(mixc(PAL.trim,[255,244,214],.35),.9);ctx.lineWidth=.8;
    ctx.beginPath();
    for(let i=0;i<4;i++)ctx.lineTo(h.prof[i][0],h.prof[i][1]*.92*s);
    ctx.stroke();
  }
  /* ── тендерный гараж ── лацпорт в борту с откинутым трапом: единственная
     поперечная деталь на корпусе, который весь вытянут вдоль */
  if(L.tender){
    const T=L.tender, y=profW(h.prof,T.x)*.92*T.s;
    ctx.fillStyle="rgba(8,12,18,.92)";
    ctx.fillRect(T.x-2.6,Math.min(y,y-1.5*T.s),5.2,1.5);
    ctx.strokeStyle=rgba(mixc(PAL.trim,[40,26,8],.3),.9);ctx.lineWidth=.4;
    ctx.strokeRect(T.x-2.6,Math.min(y,y-1.5*T.s),5.2,1.5);
    /* трап: узкая сходня с поручнем, а не лесенка в четыре ступени. Ступени
       крупнее самой сходни читались приставной стремянкой из хозблока */
    ctx.fillStyle=rgba(mixc(PAL.deck,[255,236,190],.24),.95);
    ctx.fillRect(T.x-.7,y,1.4,2.8*T.s);
    ctx.strokeStyle=rgba(mixc(PAL.trim,[255,244,214],.3),.7);ctx.lineWidth=.3;
    ctx.beginPath();
    ctx.moveTo(T.x-.9,y+.4*T.s);ctx.lineTo(T.x-.9,y+2.8*T.s);
    ctx.moveTo(T.x+.9,y+.4*T.s);ctx.lineTo(T.x+.9,y+2.8*T.s);
    ctx.stroke();
  }
  /* ── имя ── Первый заход ставил его крупно и поперёк палубы, и оно читалось
     подписью к картинке, а не надписью на борту: буквы были одного размера с
     рубкой и лежали поверх настила. Имя живёт НА СКУЛЕ, у самого обвода, на
     баке (там, где нет надстройки), мелко и вполсилы — его замечают, а не
     читают. С одного борта, как всё остальное на этом корпусе. */
  if(L.name&&h.bw>2.2){
    const nx=lerp(h.nose*.74,h.nose*.44,.5), ny=profW(h.prof,nx)*.62;
    ctx.save();
    ctx.translate(nx,-ny);
    ctx.rotate(Math.PI/2);
    ctx.fillStyle=rgba(mixc(PAL.trim,[255,246,220],.25),.6);
    ctx.font="1.5px ui-monospace,monospace";
    ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillText(L.name,0,0);
    ctx.restore();
  }
  /* ── огни палубы ── тёплые точки вдоль ограждения: их не видно днём и
     они и есть вечерний вид яхты */
  ctx.fillStyle="rgba(255,222,170,.75)";
  for(const s of [1,-1])for(let x=L.rail[0];x>L.rail[1];x-=4.5)
    ctx.fillRect(x,profW(h.prof,x)*.9*s-.3,.6,.6);
}
/* ── трафареты и мелочь на борту ──
   То, чем настоящая техника отличается от модели: инвентарные надписи, номера
   у люков, решётки забора, «зебра» у опасных мест, кокарда. Ни одна из этих
   вещей не важна по отдельности — важно, что их МНОГО и они разного размера.
   Рисуется внутри обрезки по корпусу, последним слоем поверх обшивки. */
function drawStencils(h){
  const P=h.prof,S=h.seed;
  /* решётка забора у миделя: ряд коротких линий поперёк, с обоих бортов */
  for(const s of [1,-1]){
    const gx=lerp(h.nose*.5,h.tail*.2,((S>>>4)&7)/7);
    const gw=profW(P,gx);
    if(gw>1.6){
      ctx.strokeStyle="rgba(0,0,0,.42)";ctx.lineWidth=.4;
      for(let k=0;k<5;k++){
        const y=gw*(.32+k*.1)*s;
        ctx.beginPath();ctx.moveTo(gx-1.6,y);ctx.lineTo(gx+1.6,y);ctx.stroke();
      }
    }
  }
  /* лючки: квадрат с двумя болтами и номером рядом. Пять штук по семени */
  for(let i=0;i<5;i++){
    const hh=hashi(i,S,0x2B71);
    const x=lerp(h.nose*.78,h.tail*.86,((hh>>>3)&31)/31);
    const w=profW(P,x);if(w<1.4)continue;
    const y=(((hh>>>9)&15)/15-.5)*w*1.3, sz=.8+((hh>>>14)&3)*.35;
    ctx.fillStyle="rgba(0,0,0,.22)";ctx.fillRect(x-sz,y-sz*.7,sz*2,sz*1.4);
    ctx.strokeStyle="rgba(255,255,255,.14)";ctx.lineWidth=.35;
    ctx.strokeRect(x-sz,y-sz*.7,sz*2,sz*1.4);
    ctx.fillStyle="rgba(0,0,0,.4)";
    ctx.fillRect(x-sz+.2,y-sz*.7+.2,.35,.35);
    ctx.fillRect(x+sz-.55,y+sz*.7-.55,.35,.35);
  }
  /* «зебра» у кормы: косые полосы, которыми метят то, обо что обжигаются */
  const zx=lerp(h.tail,h.nose,.10), zw=profW(P,zx);
  if(zw>1.8)for(const s of [1,-1]){
    ctx.save();
    ctx.beginPath();ctx.rect(zx-1.4,zw*.42*s-(s>0?0:zw*.42),2.8,zw*.42);
    ctx.clip();
    for(let k=-4;k<6;k++){
      ctx.fillStyle=(k&1)?"rgba(20,20,22,.65)":"rgba(214,150,44,.75)";
      ctx.beginPath();
      ctx.moveTo(zx-1.4+k*.8,zw*.9*s);ctx.lineTo(zx-1.4+k*.8+.8,zw*.9*s);
      ctx.lineTo(zx-1.4+k*.8+1.4,0);ctx.lineTo(zx-1.4+k*.8+.6,0);
      ctx.closePath();ctx.fill();
    }
    ctx.restore();
  }
  /* кокарда: круг с точкой, у половины корпусов. Опознавательный знак —
     то, из-за чего машина выглядит принадлежащей кому-то */
  if((S>>>7&3)&&h.bw>3){
    const cx=lerp(h.nose*.34,h.tail*.3,((S>>>11)&7)/7), cw=profW(P,cx);
    const cy=cw*.5*((S&1)?1:-1), cr=Math.min(1.7,cw*.34);
    ctx.strokeStyle=rgba(h.accent,.8);ctx.lineWidth=.6;
    ctx.beginPath();ctx.arc(cx,cy,cr,0,TAU);ctx.stroke();
    ctx.fillStyle=rgba(h.accent,.8);
    ctx.beginPath();ctx.arc(cx,cy,cr*.4,0,TAU);ctx.fill();
  }
  /* ── щели ──
     На листах между агрегатами всегда есть чёрный провал: не тень, а зазор,
     в который не попадает свет. Он и держит глубину — без него панели лежат
     в одной плоскости, как аппликация. Три-четыре узкие щели поперёк борта. */
  for(let i=0;i<4;i++){
    const hh=hashi(i+3,S,0x51D3);
    const x=lerp(h.nose*.55,h.tail*.8,((hh>>>3)&15)/15);
    const w=profW(P,x);if(w<1.5)continue;
    ctx.fillStyle="rgba(4,6,10,.55)";
    ctx.fillRect(x,-w*.82,.7,w*1.64);
    ctx.fillStyle="rgba(255,255,255,.09)";      // светлая кромка с одной стороны
    ctx.fillRect(x+.7,-w*.82,.3,w*1.64);
  }
  /* ── потёки ──
     Чистый металл бывает у модели, а не у машины. Тёмные полосы вниз по
     потоку от люков и стыков — самое дешёвое, что отличает вещь в работе */
  for(let i=0;i<5;i++){
    const hh=hashi(i+21,S,0x9C4);
    const x=lerp(h.nose*.6,h.tail*.7,((hh>>>3)&31)/31);
    const w=profW(P,x);if(w<1.2)continue;
    const y=(((hh>>>10)&15)/15-.5)*w*1.5;
    const g=ctx.createLinearGradient(x,0,x-2.5-((hh>>>16)&3),0);
    g.addColorStop(0,"rgba(30,26,22,.32)");
    g.addColorStop(1,"rgba(30,26,22,0)");
    ctx.fillStyle=g;
    ctx.fillRect(x-2.5-((hh>>>16)&3),y,2.5+((hh>>>16)&3),.7);
  }
  /* мелкая техническая надпись у люка: две-три группы. Читать нечего,
     замечать — есть что */
  ctx.fillStyle="rgba(20,24,30,.5)";
  for(let i=0;i<3;i++){
    const hh=hashi(i+9,S,0x77C1);
    const x=lerp(h.nose*.6,h.tail*.7,((hh>>>3)&15)/15);
    const w=profW(P,x);if(w<1.6)continue;
    const y=(((hh>>>8)&7)/7-.5)*w*1.2;
    for(let k=0;k<3+(hh&3);k++)ctx.fillRect(x+k*.55,y,.35,.5);
  }
}
/* ── пиратский борт ──
   Пират опознавался только силуэтом класса, а вблизи это был тот же
   аккуратный корабль с инвентарным номером. Пират — не другая машина, а
   машина с ЧУЖОЙ историей: номер закрашен полосой, поверх грунта наляпаны
   заплаты чужого тона, обшивка в подпалинах от собственных стволов. Ни одной
   новой формы — только следы на той же вещи.
   Рисуется ПОСЛЕ навески и номера: закрашивают ведь то, что уже нанесено, —
   в первом заходе мазок лёг под номер, и номер спокойно читался поверх. */
function drawPirateSkin(h){
  ctx.save();tracePoly(h.poly);ctx.clip();
  const P2=h.prof;
  ctx.fillStyle="rgba(38,34,30,.9)";
  ctx.fillRect(lerp(h.nose*.35,h.tail*.5,.5)-2.6,-h.bw*.62-2.6,5.2,5.2);
  for(let i=0;i<8;i++){
    const hh=hashi(i,h.seed,0xB17E);
    const x=lerp(h.nose*.8,h.tail*.9,((hh>>>3)&31)/31);
    const w=profW(P2,x);if(w<1.2)continue;
    const y=(((hh>>>9)&15)/15-.5)*w*1.5;
    const pw=1.6+((hh>>>14)&3)*1.1, ph=1.1+((hh>>>17)&3)*.8;
    ctx.fillStyle=((hh>>>19)&1)?"rgba(74,58,42,.75)":"rgba(48,54,60,.8)";
    ctx.fillRect(x-pw/2,y-ph/2,pw,ph);
    ctx.strokeStyle="rgba(10,9,7,.6)";ctx.lineWidth=.3;
    ctx.strokeRect(x-pw/2,y-ph/2,pw,ph);
  }
  /* подпалины у скулы — прямоугольным мазком, а не эллипсом: первый заход
     рисовал их дугой, и на стенде вылезли рыжие круги в полкорабля */
  ctx.fillStyle="rgba(22,16,12,.4)";
  for(let i=0;i<5;i++){
    const hh=hashi(i+5,h.seed,0xC0A1);
    const x=lerp(h.nose*.7,h.nose*.05,((hh>>>4)&7)/7), w=profW(P2,x);
    if(!(w>.5))continue;
    const y=w*.62*((hh&1)?1:-1);
    ctx.fillRect(x-1.2,y-.5,2.4+((hh>>>8)&3)*.5,1);
  }
  ctx.restore();
}
function drawHull(id,thrusting,braking,lvl,bank){
  const h=hullOf(id),blink=Math.sin(G.t*.07);
  lvl=lvl||0;
  const banked=bankTransform(bank||0);
  /* «брюхо» корпуса: смещённый тёмный силуэт проглядывает с той стороны, куда
     кренится корабль — вместе со сжатием по Y это читается как настоящий крен,
     а не плоская фигура, скользящая вбок */
  if(bank){
    ctx.save();ctx.translate(0,Math.sin(bank)*h.bw*.62);
    tracePoly(h.poly);ctx.fillStyle=rgba(h.dark,.85);ctx.fill();
    ctx.restore();
  }
  /* ── факелы ── */
  if(thrusting)for(const e of h.eng)drawFlame(e.x,e.y,e.r,1+lvl*.22,h.lux);
  else if(h.lux)for(const e of h.eng){
    /* на стоянке у люкса светится не зев, а КОЛЬЦО среза: холодная нить по
       ободу и тёмная глубина внутри — сопло видно и выключенным */
    const PAL=luxPal(h);
    ctx.fillStyle="rgba(8,12,18,.9)";
    ctx.beginPath();ctx.arc(e.x+e.r*.1,e.y,e.r*.6,0,TAU);ctx.fill();
    ctx.strokeStyle=rgba(mixc(PAL.trim,[255,244,214],.3),.9);ctx.lineWidth=.4;
    ctx.beginPath();ctx.arc(e.x+e.r*.1,e.y,e.r*.6,0,TAU);ctx.stroke();
    ctx.fillStyle="rgba(170,215,255,"+(.16+Math.random()*.1).toFixed(2)+")";
    ctx.beginPath();ctx.arc(e.x+e.r*.1,e.y,e.r*.3,0,TAU);ctx.fill();
  }
  else for(const e of h.eng){   // холостой ход — только тлеющее сопло
    ctx.fillStyle="rgba(255,140,70,"+(.2+Math.random()*.12).toFixed(2)+")";
    ctx.beginPath();ctx.arc(e.x+e.r*.1,e.y,e.r*.42,0,TAU);ctx.fill();
  }
  /* ── двигатель как ЖЕЛЕЗО ──
     Сопло было дыркой в корме с огоньком: у корабля не было двигателя, был
     источник факела. На честном виде сверху двигатель — толстая тёмная бочка,
     которая ТОРЧИТ за обвод: корпус кончился, а машина продолжается. У неё
     свои пояса жёсткости, светлая верхняя грань и чёрный зев внутри.
     Рисуется до корпуса, чтобы уйти под него, и не касается яхт: у тех своя
     школа сопел (кольцо среза с латунным пояском). */
  if(!h.yac)for(const e of h.eng){
    const bl=Math.max(3,e.r*2.4), br=e.r*1.05;
    const g=ctx.createLinearGradient(0,e.y-br,0,e.y+br);
    g.addColorStop(0,rgba(mixc(h.iron,[255,255,255],.30),1));
    g.addColorStop(.42,rgba(mixc(h.iron,[0,0,0],.42),1));
    g.addColorStop(1,rgba(mixc(h.iron,[0,0,0],.72),1));
    ctx.fillStyle=g;
    ctx.fillRect(e.x-bl*.1,e.y-br,bl,br*2);
    ctx.strokeStyle="rgba(0,0,0,.62)";ctx.lineWidth=.45;
    ctx.strokeRect(e.x-bl*.1,e.y-br,bl,br*2);
    ctx.fillStyle="rgba(0,0,0,.5)";                       // пояса жёсткости
    for(let k=1;k<3;k++)ctx.fillRect(e.x-bl*.1+bl*k/3,e.y-br,.6,br*2);
    ctx.fillStyle="rgba(255,255,255,.16)";
    ctx.fillRect(e.x-bl*.1,e.y-br,bl,.5);
    ctx.fillStyle="rgba(6,8,12,.95)";                     // зев
    ctx.beginPath();ctx.ellipse(e.x-bl*.06,e.y,br*.34,br*.74,0,0,TAU);ctx.fill();
    ctx.strokeStyle=rgba(mixc(h.iron,[255,255,255],.2),.8);ctx.lineWidth=.4;ctx.stroke();
  }
  if(braking){
    const f=4+Math.random()*6;
    ctx.fillStyle="rgba(127,230,216,.7)";
    for(const s of [-1,1]){
      const y=h.bw*.5*s;
      ctx.beginPath();ctx.moveTo(h.nose*.5,y-1.8);ctx.lineTo(h.nose*.5+f,y);
      ctx.lineTo(h.nose*.5,y+1.8);ctx.closePath();ctx.fill();
    }
  }
  /* ── радиаторы ── позади корпуса, как и крылья: пластина уходит под борт.
     Тёмная сторона смотрит в пустоту, рёбра идут поперёк — по ним панель и
     опознаётся как теплоотвод, а не как крыло */
  if(h.mark.rad)for(const R of h.mark.rad)for(const s of [1,-1]){
    const y0=profW(h.prof,R.x)*.9*s, y1=R.w*s;
    /* вынос на ДВУХ стойках: на одной панель висела расчёской в пустоте,
       и было непонятно, чем она держится */
    ctx.strokeStyle=rgba(h.steel,1);ctx.lineWidth=.5;
    ctx.beginPath();
    ctx.moveTo(R.x-R.l*.3,y0);ctx.lineTo(R.x-R.l*.3,y1);
    ctx.moveTo(R.x+R.l*.3,y0);ctx.lineTo(R.x+R.l*.3,y1);
    ctx.stroke();
    ctx.strokeStyle=rgba(h.steel,.7);ctx.lineWidth=.4;   // раскос между стойками
    ctx.beginPath();
    ctx.moveTo(R.x-R.l*.3,y0);ctx.lineTo(R.x+R.l*.3,(y0+y1)*.5);ctx.stroke();
    const g=ctx.createLinearGradient(R.x-R.l*.5,0,R.x+R.l*.5,0);
    g.addColorStop(0,rgba(h.radm,1));
    g.addColorStop(.5,rgba(mixc(h.radm,[70,76,86],.5),1));
    g.addColorStop(1,rgba(h.radm,1));
    ctx.fillStyle=g;
    ctx.fillRect(R.x-R.l*.5,Math.min(y1,y1+R.th*s)-(s>0?0:0),R.l,R.th*s);
    ctx.strokeStyle=rgba(h.steel,.8);ctx.lineWidth=.4;
    for(let k=1;k<6;k++){
      const gx=R.x-R.l*.5+R.l*k/6;
      ctx.beginPath();ctx.moveTo(gx,y1);ctx.lineTo(gx,y1+R.th*s);ctx.stroke();
    }
  }
  /* ── каркас буровика ── две балки вдоль борта и перемычки: шахта внутри,
     и это видно. Раньше «каркас вокруг шахты» из описания корабля никак не
     подтверждался силуэтом */
  if(h.mark.frame)for(const s of [1,-1]){
    const F=h.mark.frame, y=F.w*s;
    ctx.strokeStyle=rgba(h.steel,1);ctx.lineWidth=.9;
    ctx.beginPath();ctx.moveTo(F.x0,y*.55);ctx.lineTo(F.x0-Math.abs(F.x0-F.x1)*.12,y);
    ctx.lineTo(F.x1,y);ctx.lineTo(F.x1-2,y*.7);ctx.stroke();
    ctx.strokeStyle=rgba(h.steel,.75);ctx.lineWidth=.5;
    for(let k=0;k<4;k++){
      const t=(k+.5)/4, bx=lerp(F.x0,F.x1,t);
      ctx.beginPath();ctx.moveTo(bx,y);ctx.lineTo(bx+2.4,profW(h.prof,bx)*.9*s);ctx.stroke();
    }
  }
  /* ── крыло-манта люксовой яхты ── рисуется ДО корпуса: пластина уходит под
     борт, как и обычное крыло, иначе она читается наклейкой поверх */
  if(h.yac&&h.mark.lux&&h.mark.lux.wing&&h.mark.lux.form!=="spindle"){
    const W=h.mark.lux.wing,PAL=luxPal(h);
    for(const s of [1,-1]){
      const r0=profW(h.prof,W.x0)*.8*s, r1=profW(h.prof,W.x1)*.9*s;
      const tipX=W.x1-W.tipBack, tipY=W.span*s;
      ctx.beginPath();
      /* наплыв: кромка выходит из борта не прямой, а долгой пологой дугой от
         самого носа — крыло вырастает из тела, а не приставлено к нему */
      ctx.moveTo(h.nose*.72,profW(h.prof,h.nose*.72)*.7*s);
      ctx.quadraticCurveTo(W.x0+(h.nose*.72-W.x0)*.3,W.span*.06*s,W.x0,W.span*.13*s);
      ctx.bezierCurveTo(W.x0-(W.x0-tipX)*.35,W.span*.34*s,
                        tipX+W.tipBack*.9,W.span*.80*s, tipX,tipY);   // передняя кромка
      ctx.lineTo(tipX-W.tipBack*.35,W.span*.94*s);                    // законцовка
      ctx.bezierCurveTo(W.x1-W.tipBack*.2,W.span*.52*s,
                        W.x1+(W.x0-W.x1)*.18,W.span*.16*s, W.x1,r1);  // задняя кромка
      ctx.closePath();
      const g=ctx.createLinearGradient(0,r0,0,tipY);
      g.addColorStop(0,rgba(mixc(PAL.lac,[255,255,255],.16),1));
      g.addColorStop(.45,rgba(PAL.lac,1));
      g.addColorStop(1,rgba(mixc(PAL.lac,[0,0,0],.62),1));
      ctx.fillStyle=g;ctx.fill();
      ctx.strokeStyle=rgba(mixc(PAL.lac,[0,0,0],.7),1);ctx.lineWidth=.4;ctx.stroke();
      /* нить металла по передней кромке: тонкое крыло видно только кромкой */
      ctx.strokeStyle=rgba(mixc(PAL.trim,[255,244,214],.35),.85);ctx.lineWidth=.45;
      ctx.beginPath();
      ctx.moveTo(h.nose*.72,profW(h.prof,h.nose*.72)*.7*s);
      ctx.quadraticCurveTo(W.x0+(h.nose*.72-W.x0)*.3,W.span*.06*s,W.x0,W.span*.13*s);
      ctx.bezierCurveTo(W.x0-(W.x0-tipX)*.35,W.span*.34*s,
                        tipX+W.tipBack*.9,W.span*.80*s, tipX,tipY);
      ctx.stroke();
      /* один лонжерон: без него пластина плоская */
      ctx.strokeStyle="rgba(0,0,0,.3)";ctx.lineWidth=.4;
      ctx.beginPath();ctx.moveTo(W.x0-(W.x0-W.x1)*.3,r0*.9);
      ctx.lineTo(tipX+W.tipBack*.5,W.span*.82*s);ctx.stroke();
      /* тень веретена на крыло: единственное, что говорит, что гондола стоит
         НА пластине, а не нарисована на ней */
      for(const n of h.nacs){
        ctx.save();
        ctx.beginPath();                       // клип по самому крылу
        ctx.moveTo(h.nose*.72,profW(h.prof,h.nose*.72)*.7*s);
        ctx.quadraticCurveTo(W.x0+(h.nose*.72-W.x0)*.3,W.span*.06*s,W.x0,W.span*.13*s);
        ctx.bezierCurveTo(W.x0-(W.x0-tipX)*.35,W.span*.34*s,
                          tipX+W.tipBack*.9,W.span*.80*s, tipX,tipY);
        ctx.lineTo(tipX-W.tipBack*.35,W.span*.94*s);
        ctx.bezierCurveTo(W.x1-W.tipBack*.2,W.span*.52*s,
                          W.x1+(W.x0-W.x1)*.18,W.span*.16*s, W.x1,r1);
        ctx.closePath();ctx.clip();
        ctx.fillStyle="rgba(0,0,0,.34)";
        ctx.fillRect(n.x-n.l*.5+SH_DX*1.4,n.y*s-n.r+SH_DY*1.4,n.l,n.r*2);
        /* и тень самого корпуса на крыло: корпус стоит выше пластины, значит
           на пластину он ложится — без этого крыло и тело в одной плоскости */
        ctx.translate(SH_DX*2.2,SH_DY*2.2);
        ctx.fillStyle="rgba(0,0,0,.3)";
        tracePoly(h.poly);ctx.fill();
        ctx.restore();
        break;
      }
    }
  }
  /* ── крылья ── */
  for(const w of h.wings)for(const s of [1,-1]){
    tracePoly(w,s);
    const g=ctx.createLinearGradient(0,-h.bw*3*s,0,h.bw*s);
    g.addColorStop(0,rgba(h.edge,1));g.addColorStop(1,rgba(h.dark,1));
    ctx.fillStyle=g;ctx.fill();
    /* та же пара, что у корпуса: тёмная кромка снаружи, светлый кант внутри */
    ctx.strokeStyle=rgba(h.dark,1);ctx.lineWidth=.5;ctx.stroke();
    ctx.save();ctx.clip();
    ctx.strokeStyle=rgba(h.lite,.42);ctx.lineWidth=1;
    tracePoly(w,s);ctx.stroke();
    /* ── плоскость тоже СОБРАНА ──
       Крыло было залито одним тоном, и рядом с обшитым панелями корпусом
       читалось картонкой. На листах плоскость несёт то же, что борт: нервюры
       поперёк, разнотон секций, лючки и краску на законцовке. */
    if(!h.yac){
      let x0=1e9,x1=-1e9,ymax=0;
      for(const p of w){x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);ymax=Math.max(ymax,Math.abs(p[1]));}
      const seg=4+((h.seed>>>9)&3);
      for(let k=0;k<seg;k++){
        const a=((hashi(k,h.seed,0x1D7)&15)/15-.5)*.16;
        ctx.fillStyle=(a>0?"rgba(255,255,255,":"rgba(0,0,0,")+Math.abs(a).toFixed(3)+")";
        ctx.fillRect(x0+(x1-x0)*k/seg,-ymax*s-(s>0?0:0),(x1-x0)/seg,ymax*2*s);
        ctx.fillStyle="rgba(0,0,0,.34)";                       // нервюра
        ctx.fillRect(x0+(x1-x0)*k/seg,-ymax*s,.55,ymax*2*s);
      }
      /* законцовочная балка и краска на ней: край плоскости на листах всегда
         жирнее самой плоскости — по нему её и видно на фоне */
      ctx.fillStyle=rgba(mixc(h.iron,[0,0,0],.25),1);
      ctx.fillRect(x0,ymax*.93*s-(s>0?0:.9),x1-x0,.9*s);
      ctx.fillStyle=rgba(h.accent,.95);
      ctx.fillRect(x0+(x1-x0)*.52,ymax*.72*s-(s>0?0:1.1),(x1-x0)*.34,1.1*s);
    }
    ctx.restore();
    ctx.strokeStyle=rgba(h.dark,.8);ctx.lineWidth=.45;   // лонжерон
    ctx.beginPath();ctx.moveTo(w[0][0],w[0][1]*s*.55);ctx.lineTo(w[2][0],w[2][1]*s*.8);ctx.stroke();
  }
  /* ── гондолы ── */
  for(const n of h.nacs)for(const s of [1,-1]){
    const y=n.y*s;
    /* пилон: у яхты крыла нет вовсе, и гондола держится на тонком кронштейне.
       Просвет между корпусом и гондолой — то, по чему яхту узнают: у всех
       остальных там крыло */
    if(h.mark.pylon){
      ctx.strokeStyle=rgba(h.col,.8);ctx.lineWidth=.6;
      ctx.beginPath();
      ctx.moveTo(n.x+n.l*.1,profW(h.prof,n.x)*.8*s);
      ctx.lineTo(n.x+n.l*.05,y-n.r*.6*s);ctx.stroke();
      ctx.strokeStyle=rgba(h.lite,.35);ctx.lineWidth=.7;
      ctx.beginPath();
      ctx.moveTo(n.x-n.l*.2,profW(h.prof,n.x)*.8*s);
      ctx.lineTo(n.x-n.l*.1,y-n.r*.6*s);ctx.stroke();
    }
    /* ── гондола люксовой яхты ──
       У всех она — ящик с хомутом, и на яхте это было самое дешёвое место
       кадра: два серых контейнера по бортам. Здесь она обтекаемая капля,
       полированная: тёмное тело, узкий зеркальный блик вдоль и латунная нить
       по разъёму. Форма следует не работе, а деньгам, и это честно. */
    if(h.lux){
      const PAL=luxPal(h),x0=n.x-n.l*.5,x1=n.x+n.l*.5;
      ctx.beginPath();
      ctx.moveTo(x1,y);
      ctx.bezierCurveTo(x1-n.l*.18,y-n.r,n.x,y-n.r,x0+n.l*.18,y-n.r*.86);
      ctx.quadraticCurveTo(x0,y-n.r*.7,x0,y);
      ctx.quadraticCurveTo(x0,y+n.r*.7,x0+n.l*.18,y+n.r*.86);
      ctx.bezierCurveTo(n.x,y+n.r,x1-n.l*.18,y+n.r,x1,y);
      ctx.closePath();
      const ng=ctx.createLinearGradient(0,y-n.r,0,y+n.r);
      ng.addColorStop(0,rgba(mixc(PAL.lac,[255,255,255],.42),1));
      ng.addColorStop(.30,rgba(mixc(PAL.lac,[255,255,255],.10),1));
      ng.addColorStop(.62,rgba(mixc(PAL.lac,[0,0,0],.35),1));
      ng.addColorStop(1,rgba(mixc(PAL.lac,[0,0,0],.6),1));
      ctx.fillStyle=ng;ctx.fill();
      ctx.strokeStyle=rgba(mixc(PAL.lac,[0,0,0],.72),1);ctx.lineWidth=.45;ctx.stroke();
      ctx.fillStyle="rgba(255,255,255,.34)";            // зеркальная нить
      ctx.fillRect(x0+n.l*.2,y-n.r*.72,n.l*.62,.4);
      ctx.strokeStyle=rgba(mixc(PAL.trim,[60,40,14],.2),.95);ctx.lineWidth=.4;
      ctx.beginPath();                                  // латунь по разъёму
      ctx.moveTo(x0+n.l*.28,y-n.r*.9);ctx.lineTo(x0+n.l*.28,y+n.r*.9);ctx.stroke();
      ctx.fillStyle="rgba(10,14,20,.9)";                // тёмный зев сопла
      ctx.beginPath();ctx.ellipse(x0+.5,y,n.r*.28,n.r*.72,0,0,TAU);ctx.fill();
      ctx.strokeStyle=rgba(PAL.trim,.7);ctx.lineWidth=.35;ctx.stroke();
      /* игла впереди веретена: тонкий штырь с утолщением у основания.
         Вещь читается быстрой, пока стоит, — за счёт неё одной */
      const SP=h.mark.lux.spike;
      if(SP){
        ctx.strokeStyle=rgba(mixc(PAL.trim,[255,244,214],.4),.9);
        ctx.lineWidth=.5;
        ctx.beginPath();ctx.moveTo(x1,y);ctx.lineTo(x1+SP,y);ctx.stroke();
        ctx.fillStyle=rgba(mixc(PAL.lac,[255,255,255],.3),1);
        ctx.beginPath();
        ctx.moveTo(x1,y-n.r*.34);ctx.lineTo(x1+SP*.34,y-.28);
        ctx.lineTo(x1+SP*.34,y+.28);ctx.lineTo(x1,y+n.r*.34);
        ctx.closePath();ctx.fill();
      }
      continue;
    }
    ctx.beginPath();
    ctx.moveTo(n.x+n.l*.5,y-n.r*.45);
    ctx.lineTo(n.x+n.l*.28,y-n.r);ctx.lineTo(n.x-n.l*.5,y-n.r);
    ctx.lineTo(n.x-n.l*.5,y+n.r);ctx.lineTo(n.x+n.l*.28,y+n.r);
    ctx.lineTo(n.x+n.l*.5,y+n.r*.45);ctx.closePath();
    /* ── агрегат темнее корпуса ──
       Гондола была того же тона, что борт, и корабль читался вырезанным из
       одного листа. На всех листах, по которым это рисуется, машина ТЕМНЕЕ
       обшивки: графит против кости. Светлая только верхняя грань — там, где
       на неё падает свет. Один этот сдвиг тона и даёт слоёность. */
    const g=ctx.createLinearGradient(0,y-n.r,0,y+n.r);
    g.addColorStop(0,rgba(mixc(h.iron,[255,255,255],.5),1));
    g.addColorStop(.35,rgba(mixc(h.iron,[255,255,255],.12),1));
    g.addColorStop(1,rgba(mixc(h.iron,[0,0,0],.45),1));
    ctx.fillStyle=g;ctx.fill();
    /* обвод гондолы: тонкий и непрозрачный, тем же приёмом, что и боксы */
    ctx.strokeStyle=rgba(mixc(h.col,[6,10,17],.4),1);ctx.lineWidth=.45;ctx.stroke();
    ctx.fillStyle=rgba(h.lite,.42);
    ctx.fillRect(n.x-n.l*.5,y-n.r,n.l*.78,.45);            // блик по верхней грани
    ctx.strokeStyle=rgba(h.dark,1);ctx.lineWidth=.45;
    ctx.beginPath();ctx.moveTo(n.x+n.l*.16,y-n.r);ctx.lineTo(n.x+n.l*.16,y+n.r);ctx.stroke();
    ctx.strokeStyle=rgba(h.lite,.22);ctx.lineWidth=.4;      // хомут: две нити, а не одна жирная
    ctx.beginPath();ctx.moveTo(n.x+n.l*.16+.7,y-n.r);ctx.lineTo(n.x+n.l*.16+.7,y+n.r);ctx.stroke();
    ctx.strokeStyle="rgba(255,160,90,.5)";ctx.lineWidth=.5;
    ctx.beginPath();ctx.moveTo(n.x-n.l*.5,y-n.r);ctx.lineTo(n.x-n.l*.5,y+n.r);ctx.stroke();
  }
  /* ── корпус ── */
  tracePoly(h.poly);
  const bg=ctx.createLinearGradient(0,-h.bw*1.25,0,h.bw*1.25);
  /* ── плотность ──
     На крупном плане корабль просвечивал насквозь: гондола, крыло и бокс
     держали альфу меньше единицы, и сквозь навеску читался корпус. Ни один
     из листов, по которым это рисуется, не знает полупрозрачного металла:
     деталь либо закрывает то, что под ней, либо её нет. Все заливки корпуса
     и навески теперь непрозрачны, а глубину даёт тень и тон, а не просвет. */
  bg.addColorStop(0,rgba(h.lite,1));
  bg.addColorStop(.26,rgba(h.body,1));
  bg.addColorStop(.62,rgba(h.dark,1));
  bg.addColorStop(1,rgba(h.edge,1));
  ctx.fillStyle=bg;ctx.fill();
  ctx.save();ctx.clip();
  /* окраска: продольная полоса */
  const P=h.prof,S1=h.stripe;
  const i0=Math.floor(S1.from*(P.length-1)),i1=Math.ceil(S1.to*(P.length-1));
  /* акцент лежит по БОРТУ, а не по хребту: осевая полоса на виде сверху —
     это полоса на спине, её никто так не красит. Красят борт, потому что
     борт видно с земли и с соседнего корабля */
  const sa=h.yac?S1.a:.60, sb=h.yac?S1.b:.90;
  ctx.beginPath();
  for(let i=i0;i<=i1;i++)ctx.lineTo(P[i][0],-P[i][1]*sa);
  for(let i=i1;i>=i0;i--)ctx.lineTo(P[i][0],-P[i][1]*sb);
  /* ── акцентная панель ──
     На костяном борту цвет владельца работает не заливкой, а ЗАПЛАТОЙ: одна
     панель другого тона с тёмной окантовкой, как крашеный лист на белом
     грунте. Прежняя полупрозрачная полоса в .2 просто мылила борт. */
  ctx.closePath();ctx.fillStyle=rgba(h.accent,h.yac?.2:1);ctx.fill();
  if(!h.yac){
    ctx.strokeStyle="rgba(0,0,0,.45)";ctx.lineWidth=.4;ctx.stroke();
    /* та же панель с другого борта: борт красят с обеих сторон */
    ctx.beginPath();
    for(let i=i0;i<=i1;i++)ctx.lineTo(P[i][0],P[i][1]*sa);
    for(let i=i1;i>=i0;i--)ctx.lineTo(P[i][0],P[i][1]*sb);
    ctx.closePath();ctx.fillStyle=rgba(h.accent,1);ctx.fill();
    ctx.strokeStyle="rgba(0,0,0,.45)";ctx.lineWidth=.4;ctx.stroke();
    /* и вторая, короткая, у самой кормы: так метят машинное отделение */
    const ax0=lerp(h.tail,h.nose,.06), ax1=lerp(h.tail,h.nose,.20);
    ctx.fillStyle=rgba(mixc(h.accent,[0,0,0],.2),.8);
    ctx.beginPath();
    ctx.moveTo(ax0,-profW(P,ax0)*.9);ctx.lineTo(ax1,-profW(P,ax1)*.9);
    ctx.lineTo(ax1,-profW(P,ax1)*.44);ctx.lineTo(ax0,-profW(P,ax0)*.44);
    ctx.closePath();ctx.fill();
    ctx.beginPath();
    ctx.moveTo(ax0,profW(P,ax0)*.9);ctx.lineTo(ax1,profW(P,ax1)*.9);
    ctx.lineTo(ax1,profW(P,ax1)*.44);ctx.lineTo(ax0,profW(P,ax0)*.44);
    ctx.closePath();ctx.fill();
  }
  /* панельные рёбра */
  ctx.strokeStyle="rgba(0,0,0,.34)";ctx.lineWidth=.75;
  for(const i of h.ribs){
    ctx.beginPath();ctx.moveTo(P[i][0],-P[i][1]);ctx.lineTo(P[i][0],P[i][1]);ctx.stroke();
  }
  ctx.strokeStyle="rgba(255,255,255,.09)";
  for(const f of [.34,.72]){
    ctx.beginPath();
    for(let i=0;i<P.length;i++)ctx.lineTo(P[i][0],-P[i][1]*f);
    ctx.stroke();
    ctx.beginPath();
    for(let i=0;i<P.length;i++)ctx.lineTo(P[i][0],P[i][1]*f);
    ctx.stroke();
  }
  /* ── обшивка панелями ──
     Контур был обведён в 1.25 px почти в полную яркость: на маленьком корабле
     это половина его ширины, и силуэт читался наклейкой с жирной каймой.
     Обводка утоньшена, а корпус вместо неё детализирован — тем, чем и должен
     быть детализирован металл: разнотоном листов, швами между ними, рядами
     заклёпок по шву и парой люков. Тонкая линия плюс фактура читается
     аккуратнее толстой линии без фактуры. */
  /* ── обшивка плитами ──
     Корабль собирают из панелей, и на любом честном виде сверху это первое,
     что видно: сетка плит с тёмными стыками, разнотон партий, ряд крепежа по
     шву. Прежний вариант делал только поперечные листы и вполсилы (разнотон
     в .09), отчего борт читался крашеной жестью. Плита теперь двумерная —
     стык и поперёк, и вдоль, — а разнотон вдвое сильнее: именно он даёт
     ощущение, что корпус СОБРАН, а не отлит. */
  const np=5+((h.seed>>>6)&3);
  if(h.lux)drawLuxeSkin(h);
  else for(let k=0;k<np;k++){
    const t0=k/np, t1=(k+1)/np;
    const x0=lerp(h.nose,h.tail,t0), x1=lerp(h.nose,h.tail,t1);
    const rows=2+(hashi(k,h.seed,0x31B)&1);        // сколько плит поперёк борта
    for(let j=0;j<rows;j++){
      const hh=hashi(k*7+j,h.seed,0x5A1E);
      const y0=-h.bw*1.3+j*(h.bw*2.6/rows), yh=h.bw*2.6/rows;
      const a=((hh&15)/15-.5)*.19;
      ctx.fillStyle=(a>0?"rgba(255,255,255,":"rgba(0,0,0,")+Math.abs(a).toFixed(3)+")";
      ctx.fillRect(Math.min(x0,x1),y0,Math.abs(x1-x0),yh);
      if(j){                                        // продольный стык плит
        ctx.fillStyle="rgba(0,0,0,.26)";
        ctx.fillRect(Math.min(x0,x1),y0-.3,Math.abs(x1-x0),.6);
      }
    }
    /* шов между листами: тёмная нить со светлой кромкой снизу */
    ctx.fillStyle="rgba(0,0,0,.38)";ctx.fillRect(x1-.4,-h.bw*1.3,.8,h.bw*2.6);
    ctx.fillStyle="rgba(255,255,255,.10)";ctx.fillRect(x1+.4,-h.bw*1.3,.5,h.bw*2.6);
    /* заклёпки по шву: точки в полпикселя — на расстоянии они дают зерно,
       вблизи читаются рядом крепежа */
    ctx.fillStyle="rgba(0,0,0,.3)";
    const pw2=profW(P,x1);
    for(let y=-pw2+1.2;y<pw2-.8;y+=1.7)ctx.fillRect(x1-1.4,y,.5,.5);
  }
  /* ── экранная изоляция ──
     Кусок корпуса у кормы укрыт мятой фольгой: тёплое матовое пятно с
     изломами, которое не красится в цвет владельца. Это второй материал в
     кадре после голого металла, и именно он читается как «космический
     аппарат», а не как крашеный самолёт. */
  if(h.mark.foil){
    const F=h.mark.foil;
    const fx0=lerp(h.tail,h.nose,F.a), fx1=lerp(h.tail,h.nose,F.b);
    ctx.fillStyle=rgba(mixc(h.foil,[10,12,16],.46),1);
    ctx.fillRect(Math.min(fx0,fx1),-h.bw*1.3,Math.abs(fx1-fx0),h.bw*2.6);
    /* изломы: короткие светлые и тёмные грани поперёк — фольгу мнут руками */
    for(let i=0;i<9;i++){
      const hh=hashi(i,h.seed,0xF010);
      const x=lerp(Math.min(fx0,fx1),Math.max(fx0,fx1),((hh>>>3)&31)/31);
      const y0=(((hh>>>9)&31)/31-.5)*h.bw*2.2;
      const ln=1.5+((hh>>>15)&7)*.5, ang=((hh>>>19)&7)/7*1.2-.6;
      ctx.strokeStyle=(hh&1)?"rgba(255,240,200,.16)":"rgba(0,0,0,.28)";
      ctx.lineWidth=.5;
      ctx.beginPath();ctx.moveTo(x,y0);
      ctx.lineTo(x+Math.cos(ang)*ln,y0+Math.sin(ang)*ln);ctx.stroke();
    }
  }
  /* люки: два прямоугольника со скруглением, всегда на борту, не по оси */
  if(!h.lux)for(let k=0;k<2;k++){
    const hh=hashi(k+11,h.seed,0x40C7);
    const hx=lerp(h.nose*.62,h.tail*.7,((hh>>>3)&15)/15);
    const pw2=profW(P,hx), hs=Math.min(3.2,pw2*.5);
    if(hs<1.2)continue;
    const hy=(k?1:-1)*pw2*.45;
    ctx.fillStyle="rgba(0,0,0,.20)";
    ctx.fillRect(hx-hs,hy-hs*.6,hs*2,hs*1.2);
    ctx.strokeStyle="rgba(255,255,255,.10)";ctx.lineWidth=.5;
    ctx.strokeRect(hx-hs,hy-hs*.6,hs*2,hs*1.2);
  }
  /* ── диск: кольца, а не блин ──
     Круглый корпус, залитый ровным тоном, читается монетой. На листах диск
     собран кольцевыми панелями с радиальными швами и рядом окон по ободу —
     и только это делает его кораблём, а не пятном. */
  if(h.form==="disc"){
    const cx=(h.nose+h.tail)*.5, R=h.bw*1.5;
    ctx.strokeStyle="rgba(0,0,0,.34)";ctx.lineWidth=.5;
    for(const f of [.42,.72,.92]){
      ctx.beginPath();ctx.ellipse(cx,0,R*f*.86,R*f,0,0,TAU);ctx.stroke();
    }
    for(let k=0;k<12;k++){                       // радиальные швы
      const a=k*TAU/12;
      ctx.beginPath();
      ctx.moveTo(cx+Math.cos(a)*R*.42*.86,Math.sin(a)*R*.42);
      ctx.lineTo(cx+Math.cos(a)*R*.92*.86,Math.sin(a)*R*.92);ctx.stroke();
    }
    ctx.fillStyle="rgba(186,232,250,.55)";       // окна по ободу
    for(let k=0;k<16;k++){
      const a=k*TAU/16;
      ctx.fillRect(cx+Math.cos(a)*R*.8*.86-.35,Math.sin(a)*R*.8-.35,.7,.7);
    }
    ctx.fillStyle=rgba(h.accent,.9);             // сектор краской
    ctx.beginPath();ctx.moveTo(cx,0);
    ctx.arc(cx,0,R*.9,-.5,-.1);ctx.closePath();ctx.fill();
  }
  if(!h.yac)drawStencils(h);
  /* навеска */
  for(const g of h.greeb){
    ctx.fillStyle=g[4]?"rgba(255,255,255,.13)":"rgba(0,0,0,.4)";
    if(g[4]){ctx.beginPath();ctx.arc(g[0],g[1],g[2]*.5,0,TAU);ctx.fill();}
    else ctx.fillRect(g[0],g[1],g[2],g[3]);
  }
  /* блик по хребту — съезжает поперёк корпуса при крене, будто по круглому боку */
  const bo=(bank||0)*h.bw*.9;
  const sp=ctx.createLinearGradient(0,-h.bw*.9+bo,0,-h.bw*.1+bo);
  sp.addColorStop(0,"rgba(255,255,255,0)");sp.addColorStop(1,"rgba(255,255,255,.14)");
  ctx.fillStyle=sp;ctx.fillRect(h.tail,-h.bw,h.len,h.bw*2);
  /* налёт прожитых часов — последним слоем и внутри обрезки по корпусу, чтобы
     ни одна царапина не вылезла за силуэт (12s-wear) */
  if(typeof drawWear==="function")drawWear(h,wearOf(id));
  ctx.restore();
  /* ── грань корпуса ──
     Полупрозрачная линия в цвет корпуса — не грань, а ореол: вблизи она
     мылится и читается наклейкой. Настоящая грань состоит из двух вещей:
     непрозрачной тёмной кромки снаружи (там металл кончается) и светлого
     канта изнутри (там он ловит свет). Обе тоньше прежней одной. */
  tracePoly(h.poly);
  ctx.strokeStyle=rgba(h.dark,1);ctx.lineWidth=.5;ctx.stroke();
  ctx.save();ctx.clip();
  ctx.strokeStyle=rgba(h.lite,.55);ctx.lineWidth=1;   // половина уйдёт наружу за клип
  tracePoly(h.poly);ctx.stroke();
  ctx.restore();
  drawTierTrim(h);
  drawHullMarks(h);
  if(h.pirate)drawPirateSkin(h);
  if(typeof drawCrowns==="function")drawCrowns(h,id);
  /* ── боксы по бортам ──
     Были голым прямоугольником с полупрозрачной обводкой в .9: вдали сходило,
     вблизи (а игрок приближает часто — иначе корабль мелкий) читалось мыльной
     двойной линией вокруг пустоты. Правило, по которому теперь живёт вся
     навеска: обводка вдвое тоньше и НЕПРОЗРАЧНАЯ, а объём даёт не она, а
     светлая кромка со стороны света, тёмная с теневой и одно ребро внутри. */
  for(const p of h.pods)for(const s of (p[4]?[p[4]]:[1,-1])){
    const y=p[1]*s-(s>0?0:p[3]), w=p[2], hgt=p[3];
    const g=ctx.createLinearGradient(0,y,0,y+hgt);
    g.addColorStop(0,rgba(mixc(h.iron,[255,255,255],.18),1));
    g.addColorStop(1,rgba(mixc(h.iron,[0,0,0],.5),1));
    ctx.fillStyle=g;ctx.fillRect(p[0],y,w,hgt);
    ctx.fillStyle=rgba(mixc(h.iron,[255,255,255],.55),1);
    ctx.fillRect(p[0],y,w,.45);                                        // кромка света
    ctx.fillStyle="rgba(0,0,0,.55)";ctx.fillRect(p[0],y+hgt-.45,w,.45); // теневая
    ctx.strokeStyle=rgba(mixc(h.col,[6,10,17],.45),1);ctx.lineWidth=.45;
    ctx.strokeRect(p[0]+.22,y+.22,w-.44,hgt-.44);
    ctx.fillStyle="rgba(0,0,0,.32)";ctx.fillRect(p[0]+w*.62,y+.6,.5,hgt-1.2);
  }
  /* ── антенны ── */
  /* антенна тоже не обязана быть парной: половина мачт стоит с одного борта —
     последний кусок зеркальности, из-за которого корпус читался гербом */
  ctx.strokeStyle=rgba(h.col,.5);ctx.lineWidth=.5;
  for(const a of h.ants)for(const s of (a[4]?[a[4]]:[1,-1])){
    ctx.beginPath();ctx.moveTo(a[0],a[1]*s);
    ctx.lineTo(a[0]-a[2]*Math.sin(a[3]),(a[1]-a[2])*s);ctx.stroke();
  }
  /* ── фонарь кабины ── у кого есть рубка, фонаря нет: колпак истребителя на
     рудовозе был самой нелепой деталью листа */
  const cp=h.canopy;
  if(!h.mark.bridge){
  ctx.fillStyle="rgba(10,26,38,.95)";
  ctx.beginPath();ctx.ellipse(cp.x,0,cp.rx,cp.ry,0,0,TAU);ctx.fill();
  ctx.strokeStyle=rgba(h.lite,.6);ctx.lineWidth=.5;ctx.stroke();
  const cg=ctx.createLinearGradient(cp.x+cp.rx,0,cp.x-cp.rx,0);
  cg.addColorStop(0,"rgba(180,240,255,.55)");cg.addColorStop(1,"rgba(120,200,230,0)");
  ctx.fillStyle=cg;
  ctx.beginPath();ctx.ellipse(cp.x,0,cp.rx*.86,cp.ry*.72,0,0,TAU);ctx.fill();
  /* ── переплёт фонаря ──
     Голубой овал читался глазом, приклеенным к носу. У кабины есть переплёт:
     две-три поперечные рамы и продольный гребень. Стекло от этого перестаёт
     быть каплей краски и становится остеклением, за которым сидят. */
  if(!h.yac){
    ctx.strokeStyle="rgba(12,20,28,.85)";ctx.lineWidth=.45;
    for(let k=1;k<3;k++){
      const x=cp.x-cp.rx+cp.rx*2*k/3;
      const yr=cp.ry*Math.sqrt(Math.max(0,1-Math.pow((x-cp.x)/cp.rx,2)));
      ctx.beginPath();ctx.moveTo(x,-yr);ctx.lineTo(x,yr);ctx.stroke();
    }
    ctx.beginPath();ctx.moveTo(cp.x-cp.rx,0);ctx.lineTo(cp.x+cp.rx,0);ctx.stroke();
    ctx.strokeStyle="rgba(255,255,255,.22)";ctx.lineWidth=.35;
    ctx.beginPath();ctx.moveTo(cp.x-cp.rx*.5,-cp.ry*.5);ctx.lineTo(cp.x+cp.rx*.6,-cp.ry*.2);
    ctx.stroke();
  }
  }
  /* ── бортовые огни ── */
  /* Огни ставились по законцовке первого крыла, а при её отсутствии — по
     ±bw*1.6, то есть заведомо ЗА бортом: у рудовоза и яхты две точки висели
     в пустоте рядом с корпусом. Огонь горит на самой дальней точке борта,
     поэтому запасной вариант считается по обводу, а не по числу. */
  const on=blink>0;
  for(const [s,c] of [[-1,"255,80,70"],[1,"110,255,150"]]){
    let wy;
    if(h.wings.length)wy=h.wings[0][2];
    else{const lx=h.nose*.18;wy=[lx,-profW(h.prof,lx)*1.02];}
    /* у яхты огонь мельче: на узком борту точка в полтора радиуса читалась
       пуговицей, пришитой к обшивке */
    ctx.fillStyle="rgba("+c+","+(on?.95:.25)+")";
    ctx.beginPath();ctx.arc(wy[0],wy[1]*s,h.yac?.7:1.25,0,TAU);ctx.fill();
  }
  if(h.fin){
    ctx.strokeStyle=rgba(h.lite,.45);ctx.lineWidth=.5;
    ctx.beginPath();ctx.moveTo(h.tail*.65,0);ctx.lineTo(h.tail-3.5,0);ctx.stroke();
  }
  if(lvl>1){
    ctx.strokeStyle="rgba(180,240,255,"+(.16+lvl*.07).toFixed(2)+")";ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(h.tail*.35,-h.bw-lvl*.7);ctx.lineTo(h.tail*.35,h.bw+lvl*.7);ctx.stroke();
  }
  if(banked)ctx.restore();
}
