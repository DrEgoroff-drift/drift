/* ══════════════ пустой бак: хода нет, но выход есть всегда (11.09) ══════════════
   Автор, плейтест 11.09.2026: «топливо кончилось — всё, начинай сначала, если
   станции нет… где кнопка буксир?.. у меня полтора ляма, я должен быть король».
   Буксир и маяк домой в игре были, но буксир жил строкой подсказки, которую
   перебивала любая другая, а маяк — кнопкой на вкладке дома, то есть только на
   станции. Для игрока это был тупик.

   Как решил автор: «ты жмёшь ускорение, а тебе окно. У вас нет ничего, и
   варианты с кнопками. Домой — сумму считать динамически; буксир — реально
   прилетает баржа и ты пять минут летишь до станции; сброс — теряешь корпус,
   тебе выдают Стриж». Так и сделано:
     ДОМОЙ  — сразу, за деньги: цена растёт от прыжков (rescueHomeCost, ниже);
     БУКСИР — даром, но временем: баржа идёт к вам HAUL_COME, тащит HAUL_TIME;
     СБРОС  — корпус, всё, что на нём стоит, и груз потеряны; «Стриж» у станции.
   Правило дрифта: игра берёт плату — деньгами, временем или кораблём, — но
   выхода «начинай сначала» больше нет.

   Против абуза: ДОМОЙ платный и дорожает от каждого прыжка; БУКСИР
   бесплатный, но пять минут без руля и с RESCUE_FUEL в баке — как такси он
   хуже своего хода; СБРОС только отнимает. В меню ДОМОЙ есть в любом полёте
   (маяк раньше был только на станции), буксир и сброс — только на пустом баке. */
const RESCUE_FUEL=40;       /* бак после буксира и прыжка: хватает дойти до причала */
const HAUL_COME=20*60;       /* кадров, пока баржа подходит */
const HAUL_TIME=300*60;      /* кадров буксировки: пять минут, как сказал автор */
const RESCUE_ASK_GAP=90;    /* кадров после закрытия окна, пока газ не открывает его снова */

function rescueEmpty(){
  if(G.tech.has("synth")&&G.cargo.ice>0)return false;   /* синтез изо льда — свой выход */
  return G.mode==="surface"?G.fuel<8:G.fuel<=0;          /* с грунта взлёт стоит 8 */
}
/* куда прыгать «домой»: свой дом, а без него — система старта */
function rescueHomeAt(){
  return (typeof homeCanRevive==="function"&&homeCanRevive())?{sx:G.home.sx,sy:G.home.sy,ru:"к своему дому"}
    :{sx:0,sy:0,ru:"в систему старта"};
}
/* ── цена прыжка растёт от каждого прыжка (автор, 11.09) ──
   «сначала, когда у тебя нихрена нет — о, это абуз, а потом — что за хрень».
   Цена 10·2ⁿ, n — счётчик прыжков: шесть первых почти даром, десятый 5 120,
   восемнадцатый 1,3 млн. Счётчик остывает только от ИГРЫ, не от календаря:
   зашёл раз в неделю — халявы нет. Игроку правило не называется, он видит
   только цену; дрессировка (тоже без слов): прыжок с топливом в баке — это
   такси, +2 вместо +1; честный причал своим ходом в чужой системе и
   терпеливый буксир остужают сверх минут. */
const HOME_JUMP_BASE=10;            /* цена первого прыжка */
const HOME_COOL_MS=45*60000;        /* активной игры на −1 к счётчику */
const HOME_TAXI=2, HOME_EMPTY=1;    /* прибавка за прыжок с топливом и без */
const HOME_DOCK_COOL=.25, HOME_TOW_COOL=.5;
function rescueHomeCost(){
  const n=Math.max(0,G.homeJumps||0);
  return Math.max(HOME_JUMP_BASE,Math.round(HOME_JUMP_BASE*Math.pow(2,n)/10)*10);
}
/* такси — прыжок, когда было чем лететь. С грунта на 1–7 топлива взлёт не выйдет
   (нужно 8), и окно зовёт бак пустым — значит, и прыжок без хода (ревью 12.09) */
function homeJumpCount(){G.homeJumps=(G.homeJumps||0)+(rescueEmpty()?HOME_EMPTY:HOME_TAXI);}
function homeCool(k){G.homeJumps=Math.max(0,(G.homeJumps||0)-k);}
/* честный причал своим ходом в чужой системе (ревью 12.09: HOME_DOCK_COOL был
   объявлен и не применялся). Раз на систему: зайти-выйти у одной станции
   счётчик не студит — надо долететь до другой. Буксир свою систему уже
   остудил сам (haulTick ставит ту же метку) */
function rescueDockCool(){
  if(G.haul)return;
  const H=rescueHomeAt(),key=G.sx+","+G.sy;
  if((G.sx===H.sx&&G.sy===H.sy)||G.homeDockAt===key)return;
  G.homeDockAt=key;homeCool(HOME_DOCK_COOL);
}
/* активная минута: вкладка на экране и за последнюю минуту был ввод. Считаем
   реальным временем (wallMs) — игровое стоит на паузе и в фоне */
let rescueInputT=-1e12,rescueBeatT=-1;
function rescueActivityBeat(){
  const t=wallMs();
  if(rescueBeatT<0){rescueBeatT=t;return;}
  const d=Math.min(60000,t-rescueBeatT);rescueBeatT=t;
  if(!G.running||document.hidden||t-rescueInputT>60000)return;
  G.homeActMs=(G.homeActMs||0)+d;
  while(G.homeActMs>=HOME_COOL_MS){G.homeActMs-=HOME_COOL_MS;homeCool(1);}
}
function rescueOffers(){
  const out=[],H=rescueHomeAt();
  const atHome=G.sx===H.sx&&G.sy===H.sy;
  if(!atHome)out.push({id:"home",ru:"ДОМОЙ",cost:rescueHomeCost(),
    sub:"прыжок "+H.ru+" · сразу · в баке будет "+Math.max(Math.floor(G.fuel),Math.min(stat().fuelMax,RESCUE_FUEL))});   /* ровно то, что даст rescueTake */
  if(rescueEmpty()){
    const dest=nearestStation(G.sx,G.sy);
    /* терять нечего — голый «Стриж» без модулей, частей и груза: СБРОС был бы
       бесплатной доставкой к станции с полным баком, лучше буксира и ДОМОЙ */
    const lose=G.shipId!=="strizh"||Object.keys(G.mods).some(k=>(G.mods[k]|0)>0)||
      Object.keys(G.fit[G.shipId]||{}).length>0||RES_KEYS.some(k=>G.cargo[k]>0);
    out.push({id:"tow",ru:"БУКСИР",cost:0,
      sub:"баржа придёт и дотащит · 5 минут без руля"});   /* куда — сказано в шапке окна */
    if(lose)out.push({id:"reset",ru:"СБРОС",cost:0,
      sub:"корабль, всё, что на нём стоит, и груз потеряны · «Стриж» у станции"});
  }
  return out;
}
/* поставить корабль у станции системы (как буксир M331) */
function rescuePark(dest){
  G.sx=dest.sx;G.sy=dest.sy;G.sys=dest;
  /* у станции по её углу на орбите (тестировщик 12.09: ставил в (orbit+120, 0),
     и после буксира, ДОМОЙ и СБРОСА корабль стоял в двух тысячах от причала) */
  const S=dest.station,sa=S?(S.ang||0):0;
  G.ship.x=S?Math.cos(sa)*(S.orbit+120):900;G.ship.y=S?Math.sin(sa)*(S.orbit+120):0;
  G.ship.vx=0;G.ship.vy=0;
  G.mode="system";G.ap=null;G.orbit=null;G.land=null;G.surf=null;G.pirates=[];G.shots=[];
}
function rescueTake(id){
  if(G.haul)return false;   /* на тросе выход уже выбран: ни второго буксира, ни прыжка из-под троса */
  const o=rescueOffers().find(x=>x.id===id);
  if(!o)return false;
  if(o.cost>G.credits){say("Не хватает\nнужно "+o.cost.toLocaleString("ru")+" кр",120);return false;}
  const from=evacFrom();
  if(id==="home"){
    const H=rescueHomeAt();
    G.credits-=o.cost;homeJumpCount();
    rescuePark(getSystem(H.sx,H.sy));
    G.fuel=Math.max(G.fuel,Math.min(stat().fuelMax,RESCUE_FUEL));
    logAdd("warn","Прыжок домой из "+from+" · −"+o.cost.toLocaleString("ru")+" кр");
    say("Прыжок домой\n−"+o.cost.toLocaleString("ru")+" кр",150);
  }else if(id==="tow"){
    /* с грунта баржа сперва поднимает на орбиту — туда же, куда ставит взлёт */
    if(G.mode==="surface"&&G.surf){
      const p=G.surf.p;
      G.ship.x=p.x+Math.cos(p.ang)*(p.radius+150);G.ship.y=p.y+Math.sin(p.ang)*(p.radius+150);
      G.ship.vx=0;G.ship.vy=0;G.mode="system";G.surf=null;G.land=null;
    }
    haulStart();
  }else if(id==="reset"){
    const was=(shipData(G.shipId)||{}).ru||"корабль";
    if(G.shipId!=="strizh")delete G.owned[G.shipId];
    /* уходит то, что НА корабле: поставленные ступени модулей (mods) и части
       (fit). Купленное, но не поставленное (modsOwned сверх mods) остаётся */
    for(const k in G.mods){G.modsOwned[k]=Math.max(0,(G.modsOwned[k]|0)-(G.mods[k]|0));G.mods[k]=0;}
    /* части уходят только с потерянного корпуса и вместе с ним — из описи тоже;
       обвес других корпусов в ангаре не трогаем (ревью 12.09) */
    const lostFit=G.fit[G.shipId]||{};
    for(const k in lostFit){const p=partById(lostFit[k]);if(p)G.inv.splice(G.inv.indexOf(p),1);}
    delete G.fit[G.shipId];
    G.shipId="strizh";G.owned.strizh=true;invalidateParts();
    for(const k of RES_KEYS)G.cargo[k]=0;
    rescuePark(nearestStation(G.sx,G.sy));
    const st0=stat();G.fuel=st0.fuelMax;G.hull=st0.hullMax;
    logAdd("warn","Сброс у "+from+": «"+was+"» потерян с грузом · выдан «Стриж»");
    say("Сброс\n«"+was+"» потерян · вы на «Стриже»",180);
  }
  if(typeof saveGame==="function")saveGame(true);
  return true;
}

/* ── буксир: баржа настоящая, путь настоящий ── */
function haulStart(){
  const sh=G.ship,dest=nearestStation(G.sx,G.sy);
  G.haul={ph:"come",t:0,seed:hashi(G.sx*977+G.sy,clockNow()|0,31)>>>0,
    bx:sh.x,by:sh.y,ba:0,x0:0,y0:0,dsx:dest.sx,dsy:dest.sy,dname:dest.name};
  /* заходит сзади, со своего борта (R4): 2200 за кормой по линии буксира */
  const A=haulAim(sh),hd0=Math.atan2(A.ty-sh.y,A.tx-sh.x),sd=haulSide();
  G.haul.bx=sh.x-Math.cos(hd0)*2200-Math.sin(hd0)*sd*haulReach()*1.1;
  G.haul.by=sh.y-Math.sin(hd0)*2200+Math.cos(hd0)*sd*haulReach()*1.1;
  G.haul.ba=hd0;
  G.ap=null;G.orbit=null;G.pirates=[];G.shots=[];HAUL_FX=[];
  logAdd("warn","Буксир вызван к "+evacFrom()+" · баржа идёт");
  /* тоста нет: подсказка и так говорит «баржа подходит» (дизайн-ревью 11.09) */
  haulSay("вижу вас, идём. стойте где стоите — всё равно больше негде");
}

/* ── сцена буксира (автор 11.09: «выглядит как говно, не большой, нет огня;
   пусть на тросе болтается, что-то отваливается — развлекать пять минут») ──
   Баржа — грузовая махина в три корпуса, у неё горят маршевые. Корабль висит
   на тросе и качается: рывок на старте, затухание, новый толчок, когда от него
   что-то отваливается. Раз в 40–60 с отламывается кусок (обшивка, антенна,
   бочка) — искры, кусок уплывает назад и гаснет; состояние корабля не трогаем,
   это шутка, а не урон. Экипаж переговаривается в эфире. Всё, что не игра, —
   в HAUL_FX и в полях с подчёркиванием, мимо сейва. Размеры — от масштаба
   корабля (shipScaleAt), а не от зума мира: иначе на дальнем отъезде трос
   короче баржи. */
const HAUL_BARGE_K=1.35;              /* баржа против масштаба корабля */
const HAUL_ROPE=95;                   /* трос, px масштаба корабля */
const HAUL_SHIP_HALF=22;              /* от центра корабля до носа, px масштаба */
const HAUL_BIT_GAP=[40*60,60*60];     /* кадров между отвалившимися кусками */
const HAUL_TALK_GAP=[30*60,40*60];    /* кадров между репликами экипажа */
const HAUL_NAMES=["Бурлак","Упрямый","Тягач-7","Старый Ёж","Трудяга"];
const HAUL_TALK=["держись, не дёргай","на тросе не курить","трос новый, не бойся. почти новый",
  "это не мы трясём, это ты болтаешься","бак пустой — голова пустая, говорил мне отец",
  "за буксир денег не берём. за разговоры тоже","видишь станцию? и я не вижу. скоро",
  "руль не трогай, он у тебя сейчас для красоты","у нас тут чай. тебе не передать, извини"];
const HAUL_BIT_TALK=["у тебя там что-то отвалилось","ого. это было важное?",
  "не страшно, на станции приварят","считай, облегчились"];
const HAUL_FREE=210;                  /* кадров отцепки: трос отдан, баржа уходит (R4) */
const HAUL_BOOM_K=.2;                 /* стрела за соплами, доля длины баржи: трос не из огня (дизайнер 12.09) */
const HAUL_CAM={x:0,y:0};             /* сдвиг камеры вперёд по тросу — догоняет плавно (вид, не мир) */
let HAUL_FX=[];
/* масштаб корабля в drawSystem — один на двоих с буксиром. На тросе пол .7:
   пять минут игрок смотрит на СВОЙ корабль, а в .35 он был серым пятном в 12 px
   (дизайн-ревью 11.09, закон «себя находят с одного взгляда») */
/* масштаб (п. 2 плейтеста 11.09; форма Контроля, решено автором 12.09): пол .7
   и в полёте — на отъезде корабль в .35 был пятном в 12 px («далеко — мелко»);
   потолок .8 — выше корабль не растёт, растёт мир (ZOOM_MAX 4.5, 01-core):
   «близко — полпланеты» было про то, что корабль рос вместе с планетами.
   Прежняя форма (1.6 сверху, тела ×(1+0.8·(Z−1)) и потолки у лун) снята: диск
   рисуется ровно физическим, зоны посадки и черпака лежат там, где нарисовано.
   Тем же числом рисуются флот, пираты, баржи и свои корабли */
const SHIP_SCALE_MIN=.7,SHIP_SCALE_MAX=.8;
/* потолок растёт с зумом (P8, автор 18.09: «потолок мягко растёт у всех»):
   при .8 на ×4.5 корпус был в 5.6 раза мельче мира вокруг (плейтест 13.09
   §2.4) — приблизил, а свой корабль не вырос. Теперь .8 до ×1, ~1.05 на ×2.4,
   1.4 на ×4.5: мир по-прежнему растёт быстрее корабля, но корабль тоже
   растёт. Одно число на всех — флот, пираты, баржи, экипаж, буксир, — чтобы
   корабли между собой оставались честного размера. SHIP_SCALE_MAX остаётся
   нижней точкой потолка и зажимом зума у буксира ниже */
function shipScaleCap(Z){return SHIP_SCALE_MAX+.6*clamp((Z-1)/(ZOOM_MAX-1),0,1);}
function shipScaleAt(Z){return clamp(Z,SHIP_SCALE_MIN,shipScaleCap(Z));}
function haulBarge(){const T=G.haul;return T._b||(T._b={seed:T.seed,by:"gt"});}
function haulName(){return "буксир «"+HAUL_NAMES[((G.haul?G.haul.seed:0)>>>0)%HAUL_NAMES.length]+"»";}
function haulSay(t){if(typeof etherLine==="function")etherLine(t,haulName());}
/* от центра корабля до центра баржи, px масштаба корабля */
function haulReach(){return HAUL_SHIP_HALF+HAUL_ROPE+bargeArtOf(haulBarge()).L*.48*HAUL_BARGE_K;}
/* случай буксира — от его зерна, не от рисунка (M441; тестировщик 12.09: rndFx
   решал угол корабля, место баржи в сейве и реплики в журнале, и прогон с
   кадрами расходился с прогоном без них). Счётчик потока — в поле с
   подчёркиванием, мимо сейва: после загрузки поток идёт заново, одинаково */
function haulR(){const T=G.haul;T._k=(T._k|0)+1;return (hashi(T.seed|0,T._k,0x4A17)>>>0)/4294967296;}
function haulGap(g){return g[0]+haulR()*(g[1]-g[0]);}
/* реплики колодой (тестировщик 12.09: наугад с возвратом — повтор за рейс почти
   наверняка). Колода тасуется от зерна; кончилась — тасуется новая */
function haulDeal(list,key){
  const T=G.haul,d=T[key]||(T[key]={i:0,o:null});
  if(!d.o||d.i>=d.o.length){
    d.o=list.map((_,i)=>i);
    for(let i=d.o.length-1;i>0;i--){const j=Math.floor(haulR()*(i+1)),t=d.o[i];d.o[i]=d.o[j];d.o[j]=t;}
    d.i=0;
  }
  return list[d.o[d.i++]];
}
/* с какого борта баржа обгоняет — от зерна */
function haulSide(){return (G.haul.seed&1)?1:-1;}
/* куда тащат: своя система со станцией — к ней (у станции по S.ang), чужая —
   от звезды к краю, и в конце прыжок */
function haulAim(sh){
  const T=G.haul,same=T.dsx===G.sx&&T.dsy===G.sy&&G.sys.station,S=same?G.sys.station:null;
  const ox=T.ph==="haul"?T.x0:sh.x,oy=T.ph==="haul"?T.y0:sh.y;
  return {same,S,tx:S?S.x+Math.cos(S.ang)*120:ox+Math.cos(Math.atan2(oy,ox))*3000,
    ty:S?S.y+Math.sin(S.ang)*120:oy+Math.sin(Math.atan2(oy,ox))*3000};
}
/* планета для облёта: ближняя к отрезку пути и не дальше 2500 от него —
   чтобы крюк был по дороге, а не экспедицией. -1 — лететь прямо */
function haulPickWaypoint(x0,y0,tx,ty){
  const dx=tx-x0,dy=ty-y0,L2=dx*dx+dy*dy||1;let best=-1,bd=2500;
  (G.sys.planets||[]).forEach((p,i)=>{
    const u=clamp(((p.x-x0)*dx+(p.y-y0)*dy)/L2,.15,.85);
    const d=Math.hypot(x0+dx*u-p.x,y0+dy*u-p.y);
    if(d<bd){bd=d;best=i;}
  });
  return best;
}
/* кусок отвалился: косметика, мир не трогаем */
function haulBit(){
  const sh=G.ship,T=G.haul,hd=T.ba,px=-Math.sin(hd),py=Math.cos(hd),side=haulR()<.5?-1:1;   /* толчок — мир: от зерна */
  const kind=["plate","antenna","barrel"][Math.floor(rndFx()*3)];
  const x=sh.x+px*side*8,y=sh.y+py*side*8;
  HAUL_FX.push({k:kind,x,y,vx:-Math.cos(hd)*(.5+rndFx()*.5)+px*side*(.3+rndFx()*.4),
    vy:-Math.sin(hd)*(.5+rndFx()*.5)+py*side*(.3+rndFx()*.4),a:rndFx()*TAU,va:(rndFx()-.5)*.2,life:1,dec:1/(8*60)});
  for(let i=0;i<14;i++){const a=rndFx()*TAU,v=1+rndFx()*2.5;
    HAUL_FX.push({k:"spark",x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:1,dec:1/(18+rndFx()*20)});}
  T._sv=(T._sv||0)+side*.012;          /* толчок на тросе */
  if(haulR()<.7)haulSay(haulDeal(HAUL_BIT_TALK,"_db"));
}
function haulFxTick(dt){
  for(const f of HAUL_FX){f.x+=f.vx*dt;f.y+=f.vy*dt;if(f.va)f.a+=f.va*dt;
    if(f.k==="spark"){f.vx*=.94;f.vy*=.94;}f.life-=f.dec*dt;}
  if(HAUL_FX.length)HAUL_FX=HAUL_FX.filter(f=>f.life>0);
}
/* буксир переживает перезагрузку (ревью 11.09): закрыл вкладку на третьей
   минуте — открыл, и баржа тащит дальше. Форма проверяется строго: битый
   объект в сейве не должен заморозить корабль */
function haulRestore(h){
  if(!h||typeof h!=="object"||(h.ph!=="come"&&h.ph!=="haul"))return null;
  const num=k=>isFinite(+h[k]);
  if(!["t","bx","by","ba","x0","y0","dsx","dsy","seed"].every(num))return null;
  return {ph:h.ph,t:+h.t,seed:(+h.seed)>>>0,bx:+h.bx,by:+h.by,ba:+h.ba,x0:+h.x0,y0:+h.y0,
    dsx:h.dsx|0,dsy:h.dsy|0,dname:String(h.dname||"")};
}
function haulLeft(){
  const T=G.haul;if(!T||T.ph==="free")return 0;
  return Math.ceil(((T.ph==="come"?HAUL_COME-T.t+HAUL_TIME:HAUL_TIME-T.t))/60);
}
/* отцепка: HAUL_FREE кадров баржа уходит с огнём, потом её нет */
function haulFree(dt,sh){
  const T=G.haul;
  T._bv=(T._bv||0)+.06*dt;
  T.bx+=Math.cos(T.ba)*T._bv*dt;T.by+=Math.sin(T.ba)*T._bv*dt;
  if(T.t>=HAUL_FREE){G.haul=null;return true;}
  cue("БУКСИР ОТЦЕПИЛСЯ · станция рядом",CUE_INFO);
  return true;
}
/* кадр буксира: true — корабль ведёт баржа, штурвал и физика молчат */
function haulTick(dt,sh){
  const T=G.haul;if(!T)return false;
  T.t+=dt;
  sh.vx=0;sh.vy=0;sh.av=0;
  /* баржа ГЛАВТРАССЫ под охраной: пока тащат, чужие не подходят. Спавн пиратов
     глушится в spawnPirates, а пришедших из других мест (охотник, новость,
     отступник) снимаем здесь — корабль без руля не должен быть мишенью */
  if(G.pirates.length)G.pirates=G.pirates.filter(p=>p.iff);
  if(G.shots.length)G.shots=[];
  haulFxTick(dt);
  /* камера отъезжает, пока баржа, трос и корабль не влезут в кадр; ниже .7
     корабль уже не мельчает (shipScaleAt), и отъезжать дальше незачем */
  {
    const need=haulReach()+bargeArtOf(haulBarge()).L*.52*HAUL_BARGE_K;
    const fit=Math.max(.7,.46*Math.min(W,H)/need);   /* камера с упреждением (drawSystem): сцене хватает почти всего кадра */
    if(G.zoom>fit)G.zoom=Math.max(fit,G.zoom-(G.zoom-fit)*Math.min(1,.03*dt));
  }
  /* трос — мировая константа (ревью 11.09: от зума баржа ползла, пока едет
     камера). Между полом и 1.6 корабль и баржа рисуются ровно в масштабе мира
     (shipScaleAt=Z), и мировой трос там же постоянен на экране; ниже пола они
     перестают мельчать, и трос вышел бы короче полубаржи — поэтому на время
     буксира ниже пола (.7) не отъезжаем */
  /* и сверху так же (п. 2, 12.09): выше 1.6 спрайты не растут, а мировой трос
     растёт — баржа отрывалась бы от троса на щипке */
  /* и не рывком (тестировщик 12.09: с .3 камера прыгала к .7 за кадр) — пока
     баржа подходит, она далеко, и расхождение троса со спрайтом не видно */
  if(G.zoom<SHIP_SCALE_MIN)G.zoom=Math.min(SHIP_SCALE_MIN,G.zoom+(SHIP_SCALE_MIN-G.zoom)*Math.min(1,.04*dt)+.0005*dt);
  if(G.zoom>SHIP_SCALE_MAX)G.zoom=Math.max(SHIP_SCALE_MAX,G.zoom-(G.zoom-SHIP_SCALE_MAX)*Math.min(1,.04*dt)-.0005*dt);
  const reachW=haulReach();
  /* своя система со станцией — тащит к ней по-настоящему; чужая — уводит
     от звезды к краю, и в конце прыжок, как у любой баржи */
  if(T.ph==="free")return haulFree(dt,sh);
  const A=haulAim(sh),same=A.same,tx=A.tx,ty=A.ty;
  if(T.ph==="come"){
    /* баржа заходит сзади и обгоняет борт о борт (R4; тестировщик 12.09: шла со
       случайной стороны, раз в десять рейсов пролетала сквозь корабль и дальше
       шла кормой вперёд). Нос у неё по ходу: разгон — маршевые, у борта носовые
       гасят ход, последние метры маневровые подают корму под трос. Корабль без
       топлива носом не крутит (R2) — его развернёт трос, когда его возьмут */
    const k=clamp(T.t/HAUL_COME,0,1),hd0=Math.atan2(ty-sh.y,tx-sh.x);
    const ux=Math.cos(hd0),uy=Math.sin(hd0),sd=haulSide();
    const ax=sh.x+ux*reachW,ay=sh.y+uy*reachW;                                   /* под трос: впереди на длину троса */
    const wx=sh.x-uy*sd*reachW*1.1+ux*reachW*.2,wy=sh.y+ux*sd*reachW*1.1+uy*reachW*.2;   /* борт о борт */
    const gx=k<.55?wx:ax,gy=k<.55?wy:ay,px=T.bx,py=T.by,r=Math.min(1,(.004+.02*k)*dt);
    T.bx+=(gx-T.bx)*r;T.by+=(gy-T.by)*r;
    const mv=Math.hypot(T.bx-px,T.by-py);
    T.ba+=angDiff(mv>.05?Math.atan2(T.by-py,T.bx-px):hd0,T.ba)*Math.min(1,(mv>.05?.12:.05)*dt);
    T._fire=k<.55?1:0;T._retro=k>=.55&&k<.8;T._turn=k>=.8;
    if(T.t>=HAUL_COME){
      /* рывок: трос взяли — корабль разворачивает тросом из того, куда он смотрел */
      T._off=angDiff(sh.a,hd0);
      T.ph="haul";T.t=0;T.x0=sh.x;T.y0=sh.y;T._sw=0;T._sv=.02;
      T._nb=25*60;T._nt=12*60;
      haulSay("трос взяли, пошли. держись");
    }
  }else{
    const k=clamp(T.t/HAUL_TIME,0,1),e=k;   /* ровно: плавный разгон стоял на месте первые полминуты */
    /* путь — ломаная через видимое (дизайн-ревью 11.09: «кадр стоит пять минут»):
       сперва мимо ближней к трассе планеты на 1.15 её радиуса, потом к станции.
       Точка облёта считается от планеты каждый кадр — она на орбите, а путь
       остаётся непрерывным. Выбор планеты — однажды, мимо сейва (_wp) */
    if(T._wp==null)T._wp=haulPickWaypoint(T.x0,T.y0,tx,ty);
    let nx,ny;
    const P=T._wp>=0?G.sys.planets[T._wp]:null;
    if(P){
      const sx0=T.x0,sy0=T.y0,dx=tx-sx0,dy=ty-sy0,L2=dx*dx+dy*dy||1;
      const u=clamp(((P.x-sx0)*dx+(P.y-sy0)*dy)/L2,0,1),qx=sx0+dx*u,qy=sy0+dy*u;
      let ox=qx-P.x,oy=qy-P.y;const ol=Math.hypot(ox,oy)||1;ox/=ol;oy/=ol;
      /* планета слева от корабля (R6, 12.09): кнопки стоят у правого края, и диск
         не должен уходить под них — крюк всегда берётся с правой стороны планеты */
      if(ox<0){ox=-ox;oy=-oy;}
      /* крюк считается от корабля, а баржа впереди на длину троса: без этого
         запаса она ложилась поверх планеты и закрывала её (кадр 2:31) */
      const R=P.radius*1.15+haulReach()*1.2,wx=P.x+ox*R,wy=P.y+oy*R;   /* 1.15 r: планета главенствует (R6) */
      if(e<.5){nx=sx0+(wx-sx0)*e*2;ny=sy0+(wy-sy0)*e*2;}
      else{nx=wx+(tx-wx)*(e-.5)*2;ny=wy+(ty-wy)*(e-.5)*2;}
    }else{nx=T.x0+(tx-T.x0)*e;ny=T.y0+(ty-T.y0)*e;}
    const mv=Math.hypot(nx-sh.x,ny-sh.y);
    const hd=mv>.01?T.ba+angDiff(Math.atan2(ny-sh.y,nx-sh.x),T.ba)*Math.min(1,.04*dt):T.ba;
    T.ba=hd;sh.x=nx;sh.y=ny;
    /* качание на тросе: пружина с затуханием и мелкий ветер */
    T._sw=(T._sw||0)+(T._sv||0)*dt;
    T._sv=(T._sv||0)+(-.0022*T._sw-.012*(T._sv||0))*dt+(haulR()-.5)*.00035*dt;
    T._sw=clamp(T._sw,-.3,.3);
    T._off=(T._off||0)*Math.pow(.985,dt);
    sh.a=angWrap(hd+T._sw+T._off);
    T.bx=sh.x+Math.cos(hd+T._sw)*reachW;T.by=sh.y+Math.sin(hd+T._sw)*reachW;
    T._fire=1;T._retro=false;T._turn=false;
    if(T._nb==null)T._nb=haulGap(HAUL_BIT_GAP);
    if(T._nt==null)T._nt=haulGap(HAUL_TALK_GAP);
    T._nb-=dt;if(T._nb<=0){haulBit();T._nb=haulGap(HAUL_BIT_GAP);}
    T._nt-=dt;if(T._nt<=0){
      const m=Math.ceil(haulLeft()/60);
      /* отсчёт — только когда число сменилось (тестировщик 12.09: «ещё 2 минуты» дважды) */
      const cd=haulR()<.3&&m>1&&m!==T._lm;if(cd)T._lm=m;
      haulSay(cd?"до причала ещё "+m+" "+pl3(m,"минута","минуты","минут"):haulDeal(HAUL_TALK,"_dt"));
      T._nt=haulGap(HAUL_TALK_GAP);
    }
    if(T.t>=HAUL_TIME){
      haulSay("приехали. отцепляем. бак не забудь");
      const dest=getSystem(T.dsx,T.dsy);
      homeCool(HOME_TOW_COOL);G.ap=null;G.homeDockAt=T.dsx+","+T.dsy;   /* тычок на тросе автопилот не копит */
      /* прыжок в систему станции — вместе с баржей: отцепка там, на месте */
      if(!same){const rx=T.bx-sh.x,ry=T.by-sh.y;rescuePark(dest);T.bx=sh.x+rx;T.by=sh.y+ry;}
      /* отцепка (R4; тестировщик 12.09: баржа, трос и обломки пропадали в один
         кадр): трос отдан, баржа прибавляет ход и уходит своим курсом */
      T.ph="free";T.t=0;T._bv=0;T._fire=1;T._retro=false;T._turn=false;
      G.fuel=Math.max(G.fuel,Math.min(stat().fuelMax,RESCUE_FUEL));
      logAdd("warn","Буксир дотащил до станции · система "+dest.name);
      say("Буксир дотащил\nстанция рядом · в баке "+Math.floor(G.fuel),180);
      if(typeof saveGame==="function")saveGame(true);
      return true;
    }
  }
  const s=haulLeft();
  cue("БУКСИР · "+(T.ph==="come"?"баржа подходит":"тащит к станции ("+T.dname+")")+
    " · "+Math.floor(s/60)+":"+String(s%60).padStart(2,"0"),CUE_TROUBLE);
  return true;
}
/* трос: от носа корабля к гаку стрелы с провисом — {nx,ny,cx,cy,tx,ty,al} или null */
function haulRope(T,art,sS,sB,x,y,sx,sy){
  const dx=Math.cos(T.ba),dy=Math.sin(T.ba),bL=art.L*(.48+HAUL_BOOM_K)*sB;
  const tx=x-dx*bL,ty=y-dy*bL;   /* конец стрелы: гак */
  let nx=null,ny=null,al=1,tens=0;
  if(T.ph==="haul"){
    const na=G.ship.a;nx=sx+Math.cos(na)*HAUL_SHIP_HALF*sS;ny=sy+Math.sin(na)*HAUL_SHIP_HALF*sS;
    tens=clamp(Math.abs(T._sv||0)*70,0,1);
  }else if(T.ph==="free"){
    const q=clamp(T.t/HAUL_FREE,0,1),Lr=HAUL_ROPE*sS*(1-.6*q);
    nx=tx-dx*Lr;ny=ty-dy*Lr;al=1-q;
  }
  if(nx==null)return null;
  const sag=(1-tens)*(10+3*Math.sin(G.t*.03))*sS*(T.ph==="free"?2:1);
  const mx=(nx+tx)/2,my=(ny+ty)/2,dl=Math.hypot(tx-nx,ty-ny)||1;
  return {nx,ny,cx:mx-(ty-ny)/dl*sag,cy:my+(tx-nx)/dl*sag,tx,ty,al};
}
/* буксир с видеокарты (ступень 1): обломки и искры — фигурами, факелы — той же каплей,
   что у кисти (срезы по длине, цвет градиента на срез, сложением — общие рёбра срезов
   складываются в единицу, шва нет; шейдер факела 16ga тонок для короткого толстого языка), корпус — светом звезды (gpuLitSprite, как у торговых барж:
   кромка и тень — его свет, маска-холст не нужна), ядра, ореол кормы и выхлопы — мягкими
   кругами сложением, стрела — повёрнутыми прямоугольниками, трос — ломаной. #c не трогается */
const HAUL_FL=[[0,255,236,190,.95],[.25,255,170,90,.7],[1,255,90,40,0]];
function haulFlameTris(E,P,lx,ly,ra,len,w){
  const c=Math.cos(ra),n=Math.sin(ra),Q=(u,v)=>P(lx+u*c-v*n,ly+u*n+v*c),q=t=>{const a=1-t;
    return [a*a*-1+2*a*t*-len*.45+t*t*-len,a*a*w+2*a*t*w*1.2];};
  /* срез не шире ~1.2 px экрана: у градиента кисти крутой перегиб, крупный срез — ступенька */
  const e0=Q(0,0),e1=Q(-len,0),N=clamp(Math.ceil(Math.hypot(e1[0]-e0[0],e1[1]-e0[1])/1.2),8,64);
  let prev=q(0);
  for(let i=1;i<=N;i++){
    const cur=q(i/N),g=-(prev[0]+cur[0])/2/len;let k=0;while(k<HAUL_FL.length-2&&g>HAUL_FL[k+1][0])k++;
    const A=HAUL_FL[k],B=HAUL_FL[k+1],f=clamp((g-A[0])/(B[0]-A[0]),0,1),C=j=>A[j]+(B[j]-A[j])*f;
    const a0=Q(prev[0],-prev[1]),a1=Q(cur[0],-cur[1]),b1=Q(cur[0],cur[1]),b0=Q(prev[0],prev[1]),col=[C(1),C(2),C(3),C(4)];
    gpuQuad(E,a0,a1,b1,b0,col,(i<N?2:0)|(i>1?8:0));
    prev=cur;
  }
}
function haulGpu(pass,T,b,art,sS,sB,x,y,sx,sy,zx,zy){
  const D=[],E=[],ca=Math.cos(T.ba),sa=Math.sin(T.ba),P=(u,v)=>[x+sB*(u*ca-v*sa),y+sB*(u*sa+v*ca)];
  for(const f of HAUL_FX){
    const fx=zx(f.x),fy=zy(f.y),a=clamp(f.life,0,1);
    if(f.k==="spark"){D.push([0,fx-1,fy-1,fx+1,fy+1,0,0,255,170+Math.round(80*a),90,+a.toFixed(2)]);continue;}
    const c=Math.cos(f.a),n=Math.sin(f.a),Q=(u,v)=>[fx+sS*(u*c-v*n),fy+sS*(u*n+v*c)];
    const box=(u,v,hx,hy,C)=>{const [qx,qy]=Q(u,v);D.push([4,qx,qy,(hx+.5)*sS,(hy+.5)*sS,f.a,0,32,36,43,a],[4,qx,qy,(hx-.5)*sS,(hy-.5)*sS,f.a,0,C[0],C[1],C[2],a]);};
    if(f.k==="plate")box(0,0,7,4,[109,116,128]);
    else if(f.k==="antenna"){const [a0,a1]=Q(-9,0),[b0,b1]=Q(9,0),[r0,r1]=Q(9.5,0);
      D.push([2,a0,a1,b0,b1,.5*sS,0,154,163,173,a],[4,r0,r1,1.5*sS,1.5*sS,f.a,0,255,107,87,a]);}
    else box(0,0,4,6,[176,112,58]);
  }
  if(D.length)gpuShapes(pass,D);D.length=0;
  const haul=T.ph==="haul";
  const F=[];
  if(T._fire)for(const li of art.lights){
    if(li.c!=="eng")continue;
    if(haul&&Math.abs(li.y)<art.hw*.25)continue;
    const fl=.8+.2*Math.sin(G.t*.5+li.y)+.1*rndFx(),len=(26+li.r*3)*fl*(haul?.8:1),w=li.r*1.1;
    haulFlameTris(F,P,li.x,li.y,haul?-Math.sign(li.y)*.5:0,len,w);
  }
  if(F.length)gpuShapes(pass,F,{blend:"add"});
  let lx=-T.bx,ly=-T.by;const ln=Math.hypot(lx,ly)||1;lx/=ln;ly/=ln;
  gpuLitSprite(art.cn,x,y,art.rad*sB,sB,T.ba,lx,ly,0);
  bargeLiveGpu(pass,b,x,y,sB,T.ba);
  if(T._fire){
    for(const li of art.lights){
      if(li.c!=="eng"||(haul&&Math.abs(li.y)<art.hw*.25))continue;
      const [cx,cy]=P(li.x-li.r*.5,li.y),R=li.r*.95*sB;
      E.push([1,cx,cy,R*.15,0,0,R*.85,255,244,220,1]);
    }
    const [tx,ty]=P(-art.L*.48,0);E.push([1,tx,ty,0,0,0,art.hw*1.6*sB,255,160,85,.45]);
  }
  if(T._retro||T._turn){
    const nose=art.L*.52,hw=art.hw;
    const puff=(px,py,dx,dy)=>{const n=.6+.4*rndFx(),[qx,qy]=P(px+dx*6*n,py+dy*6*n);E.push([1,qx,qy,0,0,0,10*n*sB,230,240,255,.85]);};
    if(T._retro){puff(nose,-hw*.5,1,0);puff(nose,hw*.5,1,0);}
    if(T._turn&&Math.floor(G.t/6)%2===0){puff(nose*.8,-hw,0,-1);puff(-nose*.8,hw,0,1);}
  }
  if(E.length)gpuShapes(pass,E,{blend:"add"});
  if(T.ph!=="come"){
    const bx0=-art.L*.48,bl=art.L*HAUL_BOOM_K,bh=Math.max(2,art.hw*.25),root=art.L*.06,h2=Math.max(1,bh*.24);
    const ob=(u0,v0,w,h,C)=>{const [qx,qy]=P(u0+w/2,v0+h/2);D.push([4,qx,qy,w/2*sB,h/2*sB,T.ba,0,C[0],C[1],C[2],1]);};
    ob(bx0-bl,-bh/2,bl+root,bh,[74,79,87]);ob(bx0-bl,-bh/2,bl+root,h2,[170,178,187]);ob(bx0-bl-2,-bh*.75,3.5,bh*1.5,[42,45,51]);
  }
  const R=haulRope(T,art,sS,sB,x,y,sx,sy);
  if(R){
    /* светлая жила — непрозрачной, заранее смешанной с тёмной под ней: у ломаной с
       прозрачностью на каждом стыке была бы бусина */
    const N=14,pt=i=>{const t=i/N,u=1-t;return [u*u*R.nx+2*u*t*R.cx+t*t*R.tx,u*u*R.ny+2*u*t*R.cy+t*t*R.ty];};
    const wd=Math.max(1.5,2.6*sS)/2,wl=Math.max(.8,1.2*sS)/2;
    for(let i=0;i<N;i++){const [a0,a1]=pt(i),[b0,b1]=pt(i+1);D.push([2,a0,a1,b0,b1,wd,0,40,36,30,.9*R.al]);}
    for(let i=0;i<N;i++){const [a0,a1]=pt(i),[b0,b1]=pt(i+1);D.push([2,a0,a1,b0,b1,wl,0,170,159,134,R.al]);}
  }
  if(D.length)gpuShapes(pass,D);
}
function drawHaul(zx,zy,Z){
  const T=G.haul;if(!T||typeof drawBarge!=="function")return;
  const b=haulBarge(),art=bargeArtOf(b);
  const sS=shipScaleAt(Z),sB=sS*HAUL_BARGE_K;
  const x=zx(T.bx),y=zy(T.by),sx=zx(G.ship.x),sy=zy(G.ship.y);
  /* только проход сцены (25.09): 2D-ветки нет — без видеокарты игры нет, экран «нет WebGPU» */
  const pass=gpuScene();if(pass)haulGpu(pass,T,b,art,sS,sB,x,y,sx,sy,zx,zy);
}

/* взлёт с грунта без топлива: отказ называет причину (порог 91zzzzzl) и
   сразу даёт выходы — а не молча зовёт буксир, как было */
function rescueNoLaunch(){
  say("Взлёт не выйдет\nв баке "+Math.max(0,Math.floor(G.fuel))+", а нужно 8",150);
  toggleSos(true);
}
/* ── окно ── газ на пустом баке открывает его; тот же язык, что у меню */
const $sos=document.getElementById("sos");
let rescueShutT=-1e9;
function rescueAsk(){
  if(!$sos||$sos.classList.contains("open")||G.haul)return;
  if(G.mode!=="system"&&G.mode!=="surface")return;
  /* время мира пошло назад (новый мир, загрузка) — пауза прошлого мира не держит
     (прогон 12.09: метка ехала из набора в набор, и газ не открывал окно) */
  if(G.t>=rescueShutT&&G.t-rescueShutT<RESCUE_ASK_GAP)return;
  toggleSos(true);
}
/* шапка — отдельно: её сверяет каждый кадр rescueSync (расстояние, погоня) */
function rescueHead(){
  const empty=rescueEmpty();
  const head=document.getElementById("sosHead");
  /* с грунта в баке бывает 1–7: взлёт стоит 8 — это не «ноль» (ревью 12.09) */
  const fl=Math.max(0,Math.floor(G.fuel));
  /* шапка говорит то, чего нет в HUD (дизайнер 12.09): куда тащат и сколько до
     туда, а если на хвосте кто-то есть — это первой строкой */
  const dest=nearestStation(G.sx,G.sy);
  const here=dest.sx===G.sx&&dest.sy===G.sy&&dest.station;
  /* чужая система — в прыжках и времени буксира, а не координатами сектора:
     «сектор 3:1» игроку ни о чём (дизайнер 12.09) */
  const jn=Math.max(Math.abs(dest.sx-G.sx),Math.abs(dest.sy-G.sy));
  const far=here?Math.round(Math.hypot(G.ship.x-dest.station.x,G.ship.y-dest.station.y))+" ед."
    :jn+" "+pl3(jn,"прыжок","прыжка","прыжков")+" · буксир ≈"+Math.round(HAUL_TIME/3600)+" мин";
  const chase=(G.pirates||[]).filter(p=>p.hull>0&&p.aware&&!p.iff).length;
  const t=(chase?"ПОГОНЯ · "+chase+" "+(chase===1?"борт":chase<5?"борта":"бортов")+" на хвосте\n":"")+
    (empty&&fl>0?"Топлива "+fl+", на взлёт нужно 8\n":"")+"до станции «"+dest.name+"» · "+far;
  if(head&&head.textContent!==t)head.textContent=t;
}
/* окно живое (Контроль 12.09: рисовалось только при открытии — пришли деньги,
   а ДОМОЙ серый). Кнопки перестраиваются, когда меняется то, от чего они
   зависят, и никогда — пока СБРОС взведён: второй тап не срывается */
let rescueSigNow="";
function rescueSig(){return rescueOffers().map(o=>o.id+":"+o.cost+":"+(o.cost>G.credits?0:1)).join(",")+"|"+G.mode+"|"+rescueEmpty();}
function rescueSync(){
  if(!$sos||!$sos.classList.contains("open"))return;
  if(G.haul){toggleSos(false);return;}
  /* окно «бак пуст», а бак уже не пуст (крушение дало 30, синтез, заправка):
     без погони закрывается само и говорит «ход есть»; с погоней — остаётся
     окном ДОМОЙ и перерисовывается целиком (тестировщик, дизайнер 12.09) */
  if($sos.dataset.empty==="1"&&!rescueEmpty()){
    $sos.dataset.empty="";
    if(!(G.pirates||[]).some(p=>p.hull>0&&p.aware&&!p.iff)){toggleSos(false);say("Ход есть\nв баке "+Math.floor(G.fuel),120);return;}
    rescueRender();return;
  }
  if(rescueSig()!==rescueSigNow&&!$sos.querySelector("button.armed"))rescueRender();
  else rescueHead();
}
/* значки выходов (дизайнер 12.09): дом, баржа с тросом, «Стриж» — выход читается
   раньше слова */
const RESCUE_ICON={
  home:'<svg class="ic" viewBox="0 0 16 16"><path d="M2 8l6-5 6 5"/><path d="M4 7v6h8V7"/></svg>',
  tow:'<svg class="ic" viewBox="0 0 16 16"><rect x="1" y="5" width="8" height="5" rx="1"/><path d="M9 7.5h3"/><path d="M12 5.5l3 2-3 2z"/></svg>',
  reset:'<svg class="ic" viewBox="0 0 16 16"><path d="M8 2l5 11-5-3-5 3z"/></svg>'
};
function rescueRender(){
  const box=document.getElementById("sosList");if(!box)return;
  box.textContent="";
  const empty=rescueEmpty();
  const ttl=document.getElementById("sosTtl");
  if(ttl)ttl.textContent=empty?"ХОДА НЕТ · БАК ПУСТ":"ДОМОЙ";
  rescueHead();rescueSigNow=rescueSig();
  const offers=rescueOffers();
  if(!offers.length){
    const s=document.createElement("div");s.className="sosnone";
    s.textContent="Вы и так дома.";
    box.appendChild(s);return;
  }
  for(const o of offers){
    const b=document.createElement("button");
    const poor=o.cost>G.credits;
    b.disabled=poor;
    b.innerHTML=RESCUE_ICON[o.id]+'<span class="tx"><em></em><s></s></span>';
    b.querySelector("em").textContent=o.ru+(o.cost?" · "+o.cost.toLocaleString("ru")+" КР":(o.id==="tow"?" · ДАРОМ":""));
    b.querySelector("s").textContent=poor?"не хватает "+(o.cost-G.credits).toLocaleString("ru")+" кр":o.sub;
    b.dataset.id=o.id;
    /* иерархия (дизайн-ревью 11.09): разумный выход — главная кнопка, как
       ОТСТЫКОВКА на станции; по карману ДОМОЙ — он, иначе буксир. СБРОС отделён */
    const main="tow";   /* всегда буксир: игра подталкивает к бесплатному и остужающему, ДОМОЙ платный и копит счётчик (дизайн-ревью) */
    if(o.id===main)b.className="main";
    if(o.id==="reset")b.className="lose";
    b.addEventListener("click",()=>{
      /* СБРОС отнимает корабль — одним касанием его не отдают (ревью 11.09):
         первый тычок взводит кнопку и говорит, что пропадёт, второй в течение
         четырёх секунд — делает. Телефон промахивается, это мы уже знаем */
      /* взведённая — красная, с полосой срока; срок вышел — кнопка возвращается
         сама (ревью 12.09: надпись «ТОЧНО?» висела, а второй тап лишь взводил снова) */
      if(o.id==="reset"&&!(b.classList.contains("armed")&&wallMs()-(+b.dataset.armed)<4000)){
        b.dataset.armed=String(wallMs());b.classList.add("armed");
        b.querySelector("em").textContent="ТОЧНО? ТКНИТЕ ЕЩЁ РАЗ";
        b.querySelector("s").textContent="«"+((shipData(G.shipId)||{}).ru||"корабль")+"», всё, что на нём стоит, и груз пропадут";
        const bar=document.createElement("i");bar.className="arm";
        bar.addEventListener("animationend",()=>{if(b.isConnected)rescueRender();});
        b.appendChild(bar);
        return;
      }
      if(rescueTake(o.id))toggleSos(false);else rescueRender();
    });
    box.appendChild(b);
  }
}
function toggleSos(on){
  if(!$sos)return;
  let open=on===undefined?!$sos.classList.contains("open"):on;
  /* на тросе выход уже выбран (ревью 12.09): меню ДОМОЙ окна не открывает */
  if(open&&G.haul){say("НА ТРОСЕ\nбаржа дотащит до «"+G.haul.dname+"»",120);open=false;}
  if(open){if(typeof toggleMenu==="function")toggleMenu(false);$sos.dataset.empty=rescueEmpty()?"1":"";rescueRender();}
  else if($sos.classList.contains("open"))rescueShutT=G.t;
  $sos.classList.toggle("open",open);
  document.body.classList.toggle("sosopen",open);
}
if($sos){
  document.getElementById("sosclose").addEventListener("click",()=>toggleSos(false));
  document.getElementById("callbtn").addEventListener("click",()=>toggleSos(true));
}
/* тап мимо окна закрывает его (дизайнер 12.09) — кроме кнопки, что его и открывает */
addEventListener("pointerdown",e=>{
  rescueInputT=wallMs();
  const t=e.target;
  if($sos&&$sos.classList.contains("open")&&!(t&&t.nodeType===1&&($sos.contains(t)||(t.closest&&t.closest("#callbtn")))))toggleSos(false);
},true);
addEventListener("keydown",e=>{
  rescueInputT=wallMs();
  if(e.key==="Escape"&&$sos&&$sos.classList.contains("open")){toggleSos(false);return;}
  /* короткий тап газа проходил между кадрами и окна не открывал: газ и тормоз
     на пустом баке открывают его прямо по нажатию */
  /* пробела здесь нет: он — ДЕЙСТВИЕ, и у причала стыкует; на пустом баке без
     другого дела его ведёт подсказка (17-mode-system) — ревью 12.09 */
  if(/^(KeyW|KeyS|KeyA|KeyD|ArrowUp|ArrowDown|ArrowLeft|ArrowRight)$/.test(e.code||"")&&(G.mode==="system")&&rescueEmpty())rescueAsk();
},true);
/* такт активности зовёт кадр (28-loop, раз в 600 кадров): у скрытой вкладки rAF
   стоит — и её время не засчитывается само собой */
