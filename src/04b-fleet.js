/* ══════════════ флот: сто корпусов и их редкость ══════════════ */
/* Восемь ручных корпусов были всей номенклатурой игры: к середине прохождения
   покупать становилось нечего, и «сменить корабль» переставало быть решением.
   Здесь — каталог на сотню: те же процедурные корпуса (`hullOf` рисует их
   без единой правки), но у каждого свой класс, тир и место в мире.

   ПРАВИЛА, КОТОРЫМ ПОДЧИНЁН ФАЙЛ:
   1. Каталог ДЕТЕРМИНИРОВАН: он выводится из одного seed и не сохраняется.
      Сохранять сотню записей значило бы, что правка генератора ломает старые
      записи, — а так корабль под тем же ключом всегда один и тот же.
   2. Тир — это не «больше цифр», а роль в жизни игрока. Рабочая лошадка стоит
      дёшево и есть везде; редкий попадается в доке через раз; легендарный —
      событие; люкс не окупается никогда и покупается ради себя самого.
   3. В доке видно не сто корпусов, а срез: что стоит в этом доке сегодня.
      Список из ста строк — это склад, а не верфь. */
const FLEET_TIERS={
  work:  {ru:"рабочая лошадка",w:32,mul:.90,price:.72,col:"#9fb0bd",
          note:"серийная машина, каких в галактике тысячи"},
  line:  {ru:"серийный",       w:30,mul:1.00,price:1.00,col:"#8fd08a",
          note:"обычный корпус, каких много в любом доке"},
  rare:  {ru:"редкий",         w:20,mul:1.16,price:1.55,col:"#7fb0e6",
          note:"малая серия: в доке бывает не каждый раз"},
  legend:{ru:"легендарный",    w:9, mul:1.38,price:2.9, col:"#f2b25c",
          note:"о таком рассказывают в кантинах — их считают штуками"},
  luxe:  {ru:"люкс",           w:9, mul:1.10,price:4.2, col:"#c58ae0",
          note:"яхта: трюм смешной, ход прекрасный, окупается никогда"},
  proto: {ru:"опытный",        w:4, mul:1.30,price:2.2, col:"#ff9d7a",
          note:"опытный образец: сильный перекос в одну сторону"}
};
const FLEET_TIER_KEYS=Object.keys(FLEET_TIERS);
/* Профили классов: во что генератор целится по статам. Силуэт даёт `HULL_CLASS`,
   а здесь — характер: рудовоз возит, курьер бегает, яхта не делает ни того ни
   другого и живёт видом. */
const FLEET_PROFILE={
  scout:  {thr:[.95,1.25],turn:[.95,1.30],fuel:[95,150], cargo:[26,60],  hull:[70,120]},
  courier:{thr:[1.30,1.70],turn:[1.25,1.60],fuel:[85,130],cargo:[18,46], hull:[70,110]},
  hauler: {thr:[.62,.95], turn:[.55,.85], fuel:[120,240],cargo:[120,340],hull:[120,240]},
  miner:  {thr:[.78,1.00],turn:[.72,1.00],fuel:[130,210],cargo:[90,190], hull:[130,220]},
  warship:{thr:[.95,1.30],turn:[.75,1.10],fuel:[110,180],cargo:[40,110], hull:[200,340]},
  yacht:  {thr:[1.15,1.55],turn:[1.10,1.45],fuel:[130,220],cargo:[14,44], hull:[80,150]},
  survey: {thr:[1.00,1.25],turn:[1.00,1.30],fuel:[160,280],cargo:[22,60], hull:[80,140]}
};
/* Кому какой тир вообще положен: люкс — только яхта, рабочая лошадка — не яхта.
   Без этого генератор выдавал «рабочую лошадку — люксовую яхту», и тир переставал
   что-либо значить. */
const FLEET_TIER_CLS={
  work:  ["hauler","hauler","miner","scout","courier"],
  line:  ["scout","courier","hauler","miner","warship","survey"],
  rare:  ["courier","warship","miner","survey","hauler","scout"],
  legend:["warship","hauler","courier","survey","miner"],
  luxe:  ["yacht"],
  proto: ["survey","warship","courier","scout"]
};
/* Приставки серий: у рабочих лошадок номер, у легенд — прозвище. Имя корабля
   должно говорить, из какого он ряда, раньше, чем игрок откроет карточку. */
const FLEET_MARK=["М","Т","К","Д","Р","С","Л","Э"];
const FLEET_EPITH=["Старший","Долгий","Верный","Тёмный","Последний","Вольный",
                   "Тихий","Крайний","Первый","Упрямый"];
const FLEET_LUXE=["Аврора","Лазурь","Комета","Эклипс","Вега","Селена","Мираж",
                  "Заря","Хрусталь","Каприз"];
const FLEET_NOTE={
  work:  ["Возит, чинится в поле, не ломается насмерть.",
          "Ничего лишнего и ничего нового. Работает.",
          "Такие стоят в каждом доке и переживают хозяев."],
  line:  ["Крепкий середняк без сюрпризов.",
          "Ходовая серия: всё на месте, ничего сверх.",
          "То, на чём летает половина сектора."],
  rare:  ["Малая серия — их собирали недолго и немного.",
          "Собран под задачу и заметно лучше ряда.",
          "Из тех, за которыми в док приходят специально."],
  legend:["О нём знают в кантинах трёх секторов.",
          "Их считают штуками, и каждая с именем.",
          "Такой корпус переживёт и вас, и того, кто его строил."],
  luxe:  ["Каюта, окна во всю скулу и трюм на два ящика.",
          "Собран не для дела. Собран, чтобы на нём летели вы.",
          "Стоит как дом. Возит как чемодан."],
  proto: ["Один параметр вытянут до предела, остальные принесены в жертву.",
          "Опытный образец: странный, но в своём хорош."]
};
/* ── краска корпуса ──
   Красить корабль в цвет тира было ошибкой первого прохода: сотня корпусов
   выходила в четыре краски, и весь флот выглядел таблицей, а не флотом. Цвет
   теперь свой у каждого, а тир читается ОТДЕЛКОЙ (см. `drawTierTrim`): у
   рабочей лошадки заплаты, у легенды окантовка и эмблема, у люкса лента окон.
   Палитра тира задаёт только настроение: серийное — рабочее и пыльное,
   легендарное — тёплое и глубокое, люкс — светлый перламутр. */
const FLEET_PAL={
  work:  ["#9fb0bd","#b0a08a","#8fa39a","#a89a86","#94a6b4","#b09a94"],
  line:  ["#7fe6d8","#9fd8ff","#8fd08a","#c9c9d4","#a8d8ea","#8fb0c4","#c0a878"],
  rare:  ["#7fb0e6","#6bffb8","#e0885a","#c58ae0","#5fd0c8","#e8c46a"],
  legend:["#f2b25c","#e0d28a","#ff9d7a","#d8a0ff","#ffd9a0","#c8f0ff"],
  luxe:  ["#f0e6ff","#dff4ff","#ffe8f2","#e8fff0","#fff4e0"],
  proto: ["#ff9d7a","#ff6b6b","#ffb347","#9fd8ff","#c9ff8a"]
};
function fleetColor(tier,r){return pick(FLEET_PAL[tier]||FLEET_PAL.line,r);}
/* Имён в списках меньше, чем корпусов, и три «Авроры» в одном каталоге читались
   ошибкой генератора. Повтор получает номер серии — так делают и настоящие
   верфи, и это честнее, чем расширять список до сотни выдуманных слов. */
const FLEET_SEEN={},FLEET_ROMAN=["II","III","IV","V","VI","VII","VIII","IX","X"];
function fleetUniqueName(ru){
  const n=(FLEET_SEEN[ru]|0);FLEET_SEEN[ru]=n+1;
  if(!n)return ru;
  const mark=FLEET_ROMAN[Math.min(n-1,FLEET_ROMAN.length-1)];
  return ru[0]==="«"?ru.slice(0,-1)+" "+mark+"»":ru+" "+mark;
}
const FLEET_N=92;                       // плюс восемь ручных = сотня
const FLEET={};
/* ── сборка каталога ──
   Один проход на старте: сотня объектов — это дешевле, чем ветка `if` при
   каждом обращении, и позволяет считать статистику номенклатуры тестами. */
(function buildFleet(){
  for(let i=0;i<FLEET_N;i++){
    const seed=hashi(0xF1EE7,i*7919+13,0x5A17), r=rng(seed);
    /* тир: взвешенно, но детерминированно — корабль под ключом всегда один */
    let tot=0;for(const k of FLEET_TIER_KEYS)tot+=FLEET_TIERS[k].w;
    let roll=r()*tot, tier=FLEET_TIER_KEYS[0];
    for(const k of FLEET_TIER_KEYS){roll-=FLEET_TIERS[k].w;if(roll<=0){tier=k;break;}}
    const T=FLEET_TIERS[tier];
    const hcls=pick(FLEET_TIER_CLS[tier],r);
    const P=FLEET_PROFILE[hcls];
    const span=(a,k)=>a[0]+(a[1]-a[0])*k;
    /* «опытный» перекошен: один параметр к верхней границе, остальные к нижней */
    const skewK=tier==="proto"?(r()*4|0):-1;
    const roll4=[r(),r(),r(),r(),r()];
    const val=(a,n)=>{
      let k=roll4[n];
      if(skewK>=0)k=(n===skewK)?.92+r()*.08:k*.45;
      return span(a,k);
    };
    const thr =+(val(P.thr,0) *T.mul).toFixed(2);
    const turn=+(val(P.turn,1)*T.mul).toFixed(2);
    const fuel=Math.round(val(P.fuel,2)*T.mul);
    const cargo=Math.round(val(P.cargo,3)*(hcls==="yacht"?1:T.mul));
    const hull=Math.round(val(P.hull,4)*T.mul);
    /* цена: сила корпуса, помноженная на редкость. Люкс дорог не за силу —
       за то, что он люкс, и это честно написано в карточке */
    const power=(thr+turn)*.5+fuel/240+cargo/280+hull/250;
    const price=Math.round(clamp(power*7000*T.price-4000,1200,260000)/50)*50;
    const base=genName(r);
    const ru=tier==="luxe"?"«"+pick(FLEET_LUXE,r)+"»":
             tier==="legend"?pick(FLEET_EPITH,r)+" "+base:
             tier==="work"?base+"-"+pick(FLEET_MARK,r)+(1+(r()*7|0)):base;
    FLEET["f"+i]={ru:fleetUniqueName(ru),cls:HULL_CLASS[hcls].ru+" · "+T.ru,hcls,seed,tier,
      thr,turn,fuel,cargo,hull,price,col:fleetColor(tier,r),
      note:pick(FLEET_NOTE[tier],r)};
  }
})();
const FLEET_KEYS=Object.keys(FLEET);
/* Ручные восемь тоже получают тир: без него они выпадали бы из разговора
   о редкости, хотя это и есть тот ряд, с которого игрок начинает. */
(function tagHandmade(){
  const t={strizh:"work",igla:"line",vyuk:"work",skat:"line",
           klinok:"rare",obod:"line",topor:"rare",mamont:"rare"};
  for(const id in t)if(SHIPS[id])SHIPS[id].tier=t[id];
})();
function shipTier(S){return (S&&S.tier)||"line";}
function tierOf(S){return FLEET_TIERS[shipTier(S)]||FLEET_TIERS.line;}
/* ── что стоит в доке сегодня ──
   Ассортимент держится на seed станции и временном бакете, как части и кантина:
   ушёл и вернулся через час — другой ряд. Редкое попадается тем реже, чем оно
   реже; на верфи выбор шире, на аванпосте — три корыта. */
const YARD_CHANCE={work:1,line:.8,rare:.34,legend:.09,luxe:.05,proto:.12};
function stationFleet(sys){
  if(!sys||!sys.station)return [];
  const T=sys.station.stype;
  const slots=T==="yard"?9:(T==="trade"?7:(T==="outpost"?4:6));
  const r=rng(hashi(sys.seed,0xF1EE,timeBucket()));
  const out=[],seen={};
  /* Ряд собирается «броском на каждый слот», а не выборкой из отсортированного
     списка: иначе на верфи всегда лежало бы одно и то же лучшее. */
  for(let i=0;i<slots*6&&out.length<slots;i++){
    const id=FLEET_KEYS[(r()*FLEET_KEYS.length)|0];
    if(seen[id])continue;
    const S=FLEET[id];
    let ch=YARD_CHANCE[S.tier]||.5;
    /* верфь строит редкое чаще, аванпост — почти никогда */
    if(T==="yard")ch*=2.2;else if(T==="outpost")ch*=.45;
    /* научная станция держит исследователей, промышленная — рудовозы */
    if(T==="sci"&&S.hcls==="survey")ch*=2;
    if(T==="indust"&&(S.hcls==="hauler"||S.hcls==="miner"))ch*=1.8;
    if(T==="trade"&&S.hcls==="courier")ch*=1.6;
    if(r()<ch){seen[id]=1;out.push(id);}
  }
  /* В доке всегда есть на чём улететь: если бросок не дал ничего дешёвого,
     доставляем рабочую лошадку — игрок не должен застревать без корабля. */
  if(!out.some(id=>FLEET[id].price<9000)){
    const cheap=FLEET_KEYS.filter(id=>FLEET[id].price<9000);
    if(cheap.length)out.push(cheap[(rng(hashi(sys.seed,0xC4EA,timeBucket()))()*cheap.length)|0]);
  }
  return out;
}
