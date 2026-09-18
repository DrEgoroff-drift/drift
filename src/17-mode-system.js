/* ══════════════ режим: система ══════════════ */
/* Фишки компаса у кромки кадра, с их прямоугольниками и готовыми целями
   автопилота. Заполняется рисованием (drawSystem), читается тычком (15-input):
   метка, которая выглядит кнопкой, обязана быть кнопкой. Один массив на кадр,
   перезаписывается на месте — мусора не создаёт. */
const SYS_CHIPS=[];
/* последнее нарисованное место каждой фишки компаса, по ключу цели (P4,
   Контроль 17.09): без этого фишка телепортируется на новое место в тот же
   кадр, где палец лёг на след стика — на телефоне это читается как дёрганье.
   Канва, не сейв; чистится сам, когда цель пропадает из кадра (drawSysHud).
   Map, не объект: ключи уходят и приходят каждый кадр (цель скрылась за
   спиной — delete), а delete на обычном объекте в горячем кадре каждый раз
   сбивает его скрытый класс (Контроль, ревью кода 18.09) */
let CHIP_POS=new Map();
let CHIP_T=0;   /* wallNow() метки предыдущего кадра фишек — для их плавного шага */
/* пороги фишек компаса — все здесь, одной группой, а не по одному рядом с
   местом, где каждый читается (Контроль, ревью кода 18.09) */
const CHIP_IN=12;        /* кромка едет внутрь не дальше этого, под следом стика/строкой подсказки */
const SHIP_GUARD=36;     /* щедрый запас вокруг корабля на экране — фишка не ляжет на нос */
const CHIP_SPEED=200;    /* px/с — с какой скоростью фишка едет к месту вдоль своей кромки */
const CHIP_FADE=.15;     /* с — тухнет/загорается при смене кромки */
/* подписи тел этого кадра (R6): по ним имя чужого корабля («КОМПАНИЯ 743»)
   уходит вверх, чтобы не лечь на имя планеты. Канва, не сейв */
const BODY_LABELS=[];
let CORONA_IN=false;   /* корабль в короне — строка журнала раз на вход */
/* кромка системы — где встаёт гравитационный якорь. Считается от самого
   дальнего тела (планета, пояс, станция), а не от пояса-или-2400: без пояса
   кромка стояла на 3840 при любой раскладке, и в 29 системах из 625 внешняя
   планета сидела впритык к ней или вовсе за ней (−2,−6: планета 4687). Дома
   (пояса нет, внешняя на 3018) запас был 822 — три секунды хода, и игрок
   упирался в якорь, облетая внешнюю планету (ролик 12.09). Пол 3840 — чтобы
   ни одна система не стала теснее, чем была */
function sysEdge(sys){
  let outer=0;
  for(const p of (sys.planets||[]))outer=Math.max(outer,p.orbit||0);
  if(sys.belt)outer=Math.max(outer,sys.belt.orbit||0);
  if(sys.station)outer=Math.max(outer,sys.station.orbit||0);
  return Math.max(outer*1.6,3840);
}
const BODY_CAM={x:0,y:0};   /* сдвиг кадра к телу орбиты или посадки (P9) — вид, не мир */
/* тело, которое обязано оставаться в кадре: то, вокруг которого орбита, иначе
   ближайшее, если корабль у самой поверхности (ближе 250 — там же зона посадки) */
function camBody(sh,sys){
  if(G.orbit&&G.orbit.p)return G.orbit.p;
  if(!sys||!sys.planets)return null;
  let near=null,nd=250;
  for(const p of sys.planets){
    const d=Math.hypot(sh.x-p.x,sh.y-p.y)-p.radius;if(d<nd){nd=d;near=p;}
    for(const m of (p.moons||[])){const dm=Math.hypot(sh.x-m.x,sh.y-m.y)-m.radius;if(dm<nd){nd=dm;near=m;}}
  }
  return near;
}
function updateSystem(dt){
  const sh=G.ship,sys=G.sys,st=stat();
  if(typeof zoomStep==="function")zoomStep(dt);   /* щипок едет к цели (P9) */
  document.getElementById("dronebtn").style.display="none";
  /* Догонять приходится линейную скорость, а не угловую: у станции на радиусе 700
     касательная ω·r доходила почти до крейсерской, и корабль вечно подлетал туда,
     где цели уже нет. Поэтому зажимаем именно v=ω·r долей от крейсерской скорости —
     соотношение по Кеплеру (дальние медленнее) при этом сохраняется. */
  const cruise=6.4+st.thr*1.6;
  const angRate=(spd,r,frac)=>{
    const w=spd*16, lim=cruise*frac/Math.max(r,1);
    return Math.sign(w)*Math.min(Math.abs(w),lim);
  };
  for(const p of sys.planets){
    p.ang+=angRate(p.spd,p.orbit,.15)*dt;
    const pos=keplerPos(p.orbit,p.ecc,p.ang,p.argp);
    const ppx=p.x,ppy=p.y;
    p.x=pos.x;p.y=pos.y;
    if(dt>0){p.vx=(p.x-ppx)/dt;p.vy=(p.y-ppy)/dt;}
    for(const m of p.moons){
      /* спутнику доля меньше: к его собственной скорости добавляется скорость планеты */
      m.ang+=angRate(m.spd,m.orbit,.07)*dt;
      const mpos=keplerPos(m.orbit,m.ecc,m.ang,m.argp);
      const mpx=m.x,mpy=m.y;
      m.x=p.x+mpos.x;m.y=p.y+mpos.y;
      if(dt>0){m.vx=(m.x-mpx)/dt;m.vy=(m.y-mpy)/dt;}
    }
  }
  if(sys.station){
    const S=sys.station,px=S.x,py=S.y;
    S.ang+=angRate(S.spd,S.orbit,.12)*dt;
    S.x=Math.cos(S.ang)*S.orbit;S.y=Math.sin(S.ang)*S.orbit;
    if(dt>0){S.vx=(S.x-px)/dt;S.vy=(S.y-py)/dt;}
  }
  if(G.mode!=="system")return;
  updateCombat(dt);
  updateAllies(dt);
  if(typeof updateBarges==="function")updateBarges(dt);
  if(G.mode!=="system")return;
  if(G.tech.has("dock")&&G.hull<st.hullMax)G.hull=Math.min(st.hullMax,G.hull+.012*dt);
  if(G.ap)G.orbit=null;
  /* держим круговую орбиту вокруг тела: позиция считается по кругу вокруг него,
     а не гоняется регулятором — дрожать нечему. Тяга/руль/тормоз снимают захват.
     Посадка и прочие проверки ниже по коду продолжают работать как обычно —
     мы только подменяем то, как двигается корабль. */
  /* штурвал (M360): три ввода пишут G.ctl, физика ниже читает только его.
     Орбиту и автопилот он снимает сам при любом рулении */
  helmTick(dt);
  cueReset();G._probeAt=null;   /* одна подсказка на кадр (08-state); адрес зонда — только в кадре своей строки (B1) */
  /* буксир (16c): пока баржа ведёт корабль, штурвал и физика молчат */
  if(G.haul&&typeof haulTick==="function"&&haulTick(dt,sh))return;
  /* захват принадлежит телу, а тело — системе. Прыжок, стыковка, посадка, пояс,
     абордаж и авария сбрасывали автопилот, но не захват: корабль оставался
     привязан к планете из прежней системы. Её координаты больше никто не
     обновляет, и он кружит на месте по крошечному кругу — без расхода топлива,
     без ошибок в консоли, послушный рулю и глухой ко всему остальному.
     Сбрасывать по одному месту ненадёжно: следующий новый режим забудут снова.
     Поэтому проверяем то, что важно на самом деле, — тело всё ещё в этой
     системе или нет. */
  if(G.orbit&&!bodyInSystem(G.orbit.p,sys))G.orbit=null;
  const orbiting=!!G.orbit;
  let a0=sh.a,apOn=false,sp=Math.hypot(sh.vx,sh.vy),atEdge=false;
  if(orbiting){
    const O=G.orbit;O.ang+=O.w*dt;
    const p=O.p;
    sh.x=p.x+Math.cos(O.ang)*O.r;sh.y=p.y+Math.sin(O.ang)*O.r;
    const tvx=-Math.sin(O.ang)*O.r*O.w+(p.vx||0), tvy=Math.cos(O.ang)*O.r*O.w+(p.vy||0);
    sh.vx=tvx;sh.vy=tvy;
    sh.a=Math.atan2(tvy-(p.vy||0),tvx-(p.vx||0));
    sh.av=0;sh.bank=0;
    trailStep(dt,false,false);
  }else{
  apOn=G.ap&&runAutopilot(dt,st);
  if(apOn)sh.av=0;
  const maxSp=(6.4+st.thr*1.6)*((typeof fleetCaravanActive==="function"&&fleetCaravanActive())?.6:1);   /* караван идёт ходом флота (M313) */
  /* курс и тяга — штурвалом (15a-helm): без угловой инерции, тяга вектором,
     отпущенная тяга ниже крейсерской тормозит сама */
  /* ── руль и ход — равными квантами (0.1) ──
     Дёргался именно этот кусок: поворот носа шёл на сырой dt кадра, и на
     длинном кадре шаг был вдвое крупнее (замер на S23: 0.46° / 2.17° / 4.34° за
     кадр при ровном ведении пальца). Квантуется ТОЛЬКО он: эмиттеры,
     частицы, соседи и таймеры остаются один раз за кадр суммой dt — они не
     дёргались, а второй вызов стоит кадра и сеет вдвое больше точек. */
  const subN=Math.max(1,WORLD_SUB|0),sdt=dt/subN;
  let helm=null;
  for(let sub=0;sub<subN;sub++){
  helm=apOn?null:helmApply(sdt,st,sh,maxSp);
  sp=Math.hypot(sh.vx,sh.vy);
  if(sp>maxSp){sh.vx*=maxSp/sp;sh.vy*=maxSp/sp;sp=maxSp;}
  /* вектор скорости мягко доворачивается к носу — за счёт этого разворот
     получается дугой, а не вращением на месте с прежним курсом. Пока работают
     маневровые (боковой ход, реверс, Shift) — довода нет: скольжение не должно
     затягиваться под нос */
  if(sp>.08&&!apOn&&!(helm&&(helm.thr||helm.hold))){
    const cur=Math.atan2(sh.vy,sh.vx);
    const na=cur+angDiff(sh.a,cur)*Math.min(1,.06*sdt);
    sh.vx=Math.cos(na)*sp;sh.vy=Math.sin(na)*sp;
  }
  /* гравитационный якорь: за краем системы уход от звезды сходит на нет,
     чтобы в бесконечном космосе нельзя было буквально потеряться.

     Прежняя версия срезала радиальную составляющую скорости — и это оказалось
     ловушкой. Строкой выше вектор скорости доворачивается к носу; нос смотрит
     наружу, поперечная скорость перетекала в радиальную, якорь её срезал, и так
     каждый кадр. За полминуты корабль вставал колом: скорость 0.05, топливо
     горит, тяга не помогает. Ровно то «застревание в дальнем полёте», на
     которое жалуются. Любой потолок на скорость даёт эту мёртвую точку:
     под постоянной тягой корабль приходит туда, где потолок ровно равен нулю,
     и остаётся там навсегда.

     Тогда потолок убрали и оставили силу — притяжение до полутора тяг. Мёртвая
     точка от этого никуда не делась, только переехала. Сила, которая где-то
     превосходит двигатель, ВСЕГДА даёт радиус, где она ровно равна тяге:
     rEdge+437 при полутора тягах. Корабль приходит туда под маршевой, встаёт
     намертво, топливо горит, нос крутится — и это опять читается как сломанное
     управление. Дважды чинили симптом, потому что механизм один: тягу нельзя
     пересиливать встречной силой.

     Поэтому якорь больше вообще не борется с двигателем. Он не отнимает
     скорость — он заворачивает курс. За кромкой нос и вектор скорости плавно
     доворачиваются к звезде, тем сильнее, чем дальше зашёл. Скорость при этом
     сохраняется целиком: корабль всегда летит, просто наружу его курс не
     держится — он уходит дугой и приходит обратно.
     Равновесие всё же нашлось (ролик 12.09, 0b «якорь и стик»): заворот курса
     — тоже сила против тяги, если стик каждый кадр заворачивает обратно.
     Поэтому под стиком якорь спорит с вводом, а не с ходом: 15a-helm
     helmEdgeInput ведёт корабль вдоль кромки, и тогда блок ниже молчит. */
  {
    const rEdge=sysEdge(sys);
    const d=Math.hypot(sh.x,sh.y)||1;
    /* стик, ведущий вдоль кромки (15a, helmEdgeInput), уже держит стену сам —
       тогда якорь курс не заворачивает: два руля на одной кромке и давали
       равновесие-ползок. Накатом, без стика, якорь работает как прежде */
    const helmWall=!apOn&&G.ctl&&G.ctl.edge;
    if(d>rEdge&&helmWall)atEdge=true;
    else if(d>rEdge){
      const k=clamp((d-rEdge)/700,0,1);
      const inward=Math.atan2(-sh.y,-sh.x);
      const turn=Math.min(1,.05*k*sdt);
      sh.a+=angDiff(inward,sh.a)*turn;
      const vsp=Math.hypot(sh.vx,sh.vy);
      if(vsp>.001){
        const va=Math.atan2(sh.vy,sh.vx);
        const na=va+angDiff(inward,va)*turn;
        sh.vx=Math.cos(na)*vsp;sh.vy=Math.sin(na)*vsp;
      }
      atEdge=true;
      /* Раньше здесь же всплывал say() поверх корабля — второй голос ОДНОГО
         события вместе с нижней строкой cue() ниже по функции (Дизайнер, кадры
         S23 17.09): бирюзовый текст у корпуса, свой заголовок, и одновременно
         оранжевая строка внизу — «ГРАВИТАЦИОННЫЙ ЯКОРЬ» дважды разными словами.
         Нижняя строка уже держит событие постоянно, пока корабль на кромке
         (не раз при входе, как say()), поэтому убрал верхний голос вовсе —
         одно событие, один голос (Контроль, П7, 17.09). */
    }
  }
  /* якорь режет скорость до шага, а не после — иначе корабль всё равно
     уползал бы за край по чуть-чуть каждый кадр */
  sh.x+=sh.vx*sdt;sh.y+=sh.vy*sdt;
  }   /* конец квантов корабля: дальше снова один раз за кадр, полным dt */
  /* крен считаем по фактической скорости поворота — работает и на автопилоте */
  const rate=angDiff(sh.a,a0)/Math.max(dt,.0001);
  /* насколько корабль ложится в поворот — подпись изготовителя (M369, §19.4
     измерение 8): Коммуна валится широко, Орднунг не кренится вовсе. Скорость
     поворота при этом не меняется: числа принадлежат классу и модулям */
  const BK=(typeof makerBank==="function")?makerBank(makerOf(G.shipId)):1;
  sh.bank+=(clamp(rate*13*BK,-.8*BK,.8*BK)-sh.bank)*Math.min(1,.07*dt);
  trailStep(dt,G.fuel>0&&((helm&&helm.main)||apOn),!apOn&&!!helm&&Math.abs(helm.rate)>1e-4,
    !apOn&&!!helm&&helm.thr&&G.fuel>0);
  }

  const d0=Math.hypot(sh.x,sh.y)||1;
  /* второй, жёсткий якорь на 5200 отсюда убран: он тянул к звезде сильнее, чем
     тянет двигатель, и вдобавок обрывал кадр — заодно с ним пропадали подсказки,
     стыковка и посадка. Ограничения скорости выше достаточно: дальше кромки
     корабль просто перестаёт уходить, оставаясь полностью управляемым. */
  if(d0<sys.radius+30){
    G.hull=Math.max(0,G.hull-.9*dt);
    /* вторая ловушка: корона отталкивает, а не засасывает. Со знаком «минус»
       это была воронка вчетверо сильнее двигателя — влетев к звезде, выбраться
       было нельзя, оставалось смотреть, как горит корпус. */
    /* сила растёт от кромки внутрь, на самой кромке — ноль: постоянный толчок
       обрывался на границе, и корпус, зависший около неё, вибрировал поперёк —
       «дёргается у звезды» */
    const corona=.22*clamp((sys.radius+30-d0)/40,0,1);
    sh.vx+=sh.x/d0*corona*dt;sh.vy+=sh.y/d0*corona*dt;
    cue("ПЕРЕГРЕВ КОРПУСА",CUE_TROUBLE);
    /* корпус горит — это пишется сразу, раз на вход в корону (боты 12.09) */
    if(!CORONA_IN){CORONA_IN=true;logAdd("warn","Корпус горит: корона звезды");sfx("hit",{v:.3});}
    if(G.hull<=0)wreck("перегрев у звезды");
    return;
  }
  CORONA_IN=false;
  if(apOn)return;
  /* стрельбище (24d): пока идёт минута, подсказку держит оно */
  if(typeof rangeOn==="function"&&rangeOn()){rangeTick(dt);return;}
  if(atEdge)cue("ГРАВИТАЦИОННЫЙ ЯКОРЬ · КРАЙ СИСТЕМЫ\nКУРС К ЗВЕЗДЕ СВОБОДЕН",CUE_INFO);
  /* «преследуют» — это те, кто идёт ЗА ВАМИ. Чужой бой на фронте (M372) идёт
     мимо: его корабли помечены iff и в счёт не входят, иначе строка пугала бы
     игрока восемью преследователями, которые о нём даже не знают */
  const hostile=G.pirates.filter(p=>p.aware&&!p.iff).length;
  const bystand=G.pirates.filter(p=>p.iff&&p.pw).length;
  /* подсказка боя переписана под новое управление (M360a): пэда ОГОНЬ в
     системе больше нет, огонь — это захват. Две мысли — две строки, а не
     одна во всю ширину телефона: «что делать» и «можно не делать». */
  if(hostile){
    const stick=G.ctl&&G.ctl.src==="stick",got=G.marks&&G.marks.length;
    const how=got?"ЦЕЛЬ ВЗЯТА · ОГОНЬ САМ"
      :(stick?"ЦЕЛЬ ИЛИ ТЫЧОК ПО КОРПУСУ — ЗАХВАТ":"TAB ИЛИ ЩЕЛЧОК ПО КОРПУСУ — ЗАХВАТ");
    cue((st.armed?how:"ОРУДИЯ НЕТ")+"\nПРЕСЛЕДУЮТ: "+hostile+" · МОЖНО УЙТИ ИЛИ ПРЫГНУТЬ",CUE_WARN);
  }else if(bystand>=4&&typeof chronFront==="function"&&chronFront(G.sx,G.sy)){
    /* чужой бой: подсказка говорит ровно то, что происходит */
    cue("ЗДЕСЬ ИДЁТ ЧУЖОЙ БОЙ · "+bystand+" БОРТОВ"+"\nВАС НЕ ТРОГАЮТ, ПОКА ВЫ НЕ СТРЕЛЯЕТЕ",CUE_WARN);
  }
  /* оклик пикета (M373, §6.1): пока на него не ответили, остальное ждёт — и
     ждёт по-настоящему, ДО причала, пояса и базы (R1, 12.09): прежде он стоял
     после них, и у причала подсказка звала стыковаться, пока пикет ждал ответа */
  if(typeof gestTick==="function")gestTick(sh);   /* жест хозяина после прыжка (M452) */
  if(typeof railTick==="function")railTick(dt);   /* поезд подходит, пока вы в вестибюле (M472) */
  if(typeof farTrapTick==="function")farTrapTick(dt);
  if(typeof lawRingTick==="function")lawRingTick(sh);   /* скоростной режим Орднунга у станции (M456) */
  if(typeof dsTick==="function")dsTick();   /* новости о вашем поступке — двумя голосами (M491) */
  if(typeof peaceTick==="function")peaceTick(sh,dt);   /* ремонтный буксир Рассвета (M455) */
  if(typeof supportTick==="function"&&(G.t|0)%60===0)supportTick();
  if(typeof stapelTick==="function"&&(G.t|0)%60===0)stapelTick();
  if(typeof scarTick==="function"&&(G.t|0)%3600===0)scarTick();
  if(typeof subTick==="function"&&(G.t|0)%60===0)subTick();   /* подписка: взнос на границе смены (M487) */   /* течёт бак: −1 % в минуту (M482) */   /* стапель: заказ готов — строка в почте (M481) */   /* техподдержка решает заявки (M495) */   /* ловушки антивещества: питание или процент в минуту (M468) */
  if(typeof hailTick==="function"&&hailTick(sh,dt,actEdge))return;

  if(sys.station){
    const S=sys.station,ds=Math.hypot(sh.x-S.x,sh.y-S.y);
    /* ключ причала («Сорока», 12v-wander-shop): стыковка с любой точки системы */
    const keyOn=(typeof wanderHas==="function")&&wanderHas("key")&&ds<2600;
    if(ds<300||keyOn){
      if(ds<95||keyOn){
        if(sp>2.6)cue("СБРОСЬТЕ СКОРОСТЬ · "+sp.toFixed(1)+"\nТОРМОЗ — ГАШЕНИЕ",CUE_ACT);
        else if(cue("ДЕЙСТВИЕ — СТЫКОВКА · "+S.kind.toUpperCase(),CUE_ACT)&&actEdge)openStation();
        return;
      }
      cue(S.name.toUpperCase()+" · "+Math.round(ds)+" ед.",CUE_INFO);
    }
  }
  /* «Сорока» у освещённого края планеты (12v, M342): подход как к станции */
  if(typeof wanderNear==="function"){
    const wn=wanderNear(sh);
    if(wn){
      if(wn.close){
        if(sp>2.6)cue("СБРОСЬТЕ СКОРОСТЬ · "+sp.toFixed(1)+"\nТОРМОЗ — ГАШЕНИЕ",CUE_ACT);
        else if(cue("ДЕЙСТВИЕ — К ТРАПУ «СОРОКИ»",CUE_ACT)&&actEdge)wanderDock();
        return;
      }
      cue("«СОРОКА» · "+Math.round(wn.ds)+" ед.",CUE_INFO);
    }
  }
  const B=sys.belt;
  if(B){
    const rr=Math.hypot(sh.x,sh.y);
    if(Math.abs(rr-B.orbit)<90){
      if(cue("ДЕЙСТВИЕ — ВОЙТИ В "+B.name.toUpperCase()+"\nРУДА: "+B.res.map(k=>RES[k].ru).join(", "),CUE_ACT)&&actEdge){enterBelt();return;}
    }
  }
  /* пиратская база — точка входа в абордаж; есть только в опасных секторах */
  {
    const PB=sysPirateBase();
    if(PB){
      const d=Math.hypot(sh.x-PB.x,sh.y-PB.y);
      if(d<160){
        /* письмо на Остров (M160): с письмом подходят без боя — вторая дверь */
        const withLetter=typeof islandHeld==="function"&&islandHeld().length>0;
        if(cue("ПИРАТСКАЯ БАЗА · "+PB.name.toUpperCase()+
          (withLetter?"\nДЕЙСТВИЕ — СЕСТЬ С ПИСЬМОМ · без оружия":"\nДЕЙСТВИЕ — АБОРДАЖ"+(st.armed?"":" (ОРУЖИЯ НЕТ)")),CUE_ACT)&&actEdge){
          if(withLetter)islandLand(PB);else enterRaid(PB);return;}
      }
    }
  }
  /* оставленное (M377, §11.3): чужая вещь в пустоте, копия и благодарность */
  if(typeof leftInteract==="function"&&leftInteract(sh,actEdge))return;
  /* спасатель (M375, §6.4): подбитым — топливо, обломкам — трос и экипаж.
     Нейтрален обеим сторонам по определению, и эпизоды даёт с обеими */
  if(typeof npcRescue==="function"&&npcRescue(sh,actEdge))return;
  /* прежняя ветка на случай, если спасателя нет в сборке */
  if(typeof npcWreckNear==="function"&&typeof npcRescue!=="function"){
    const wk=npcWreckNear(sh);
    if(wk){
      if(cue(G.tow?("КОРПУС ПОСЛЕ БОЯ · У ВАС УЖЕ ЕСТЬ БУКСИР")
        :("КОРПУС ПОСЛЕ БОЯ\nДЕЙСТВИЕ — ВЗЯТЬ НА БУКСИР"),G.tow?CUE_INFO:CUE_ACT)&&actEdge&&!G.tow){
        G.tow={seed:wk.seed,by:wk.by,sx:G.sx,sy:G.sy};
        G.npcWrecks=G.npcWrecks.filter(w=>w!==wk);
        say("КОРПУС НА ТРОСЕ · В ДОК",120);
        logAdd("tech","Корпус после боя взят на буксир · сектор "+G.sx+":"+G.sy);
        if(typeof epiAdd==="function")epiAdd("tow",wk.by);
      }
      return;
    }
  }
  /* флот ГЛАВТРАССЫ: позывной, заправка по норме (12ai) */
  /* кольцо железной дороги: стыковка и вестибюль (M471–M472) */
  if(typeof railInteract==="function"&&railInteract(sh))return;
  if(typeof chebInteract==="function"&&chebInteract(sh))return;   /* «Чебуречная» на подъезде (M462) */
  if(typeof hotelInteract==="function"&&hotelInteract(sh))return;
  if(typeof bazInteract==="function"&&bazInteract(sh))return;   /* барахолка у пояса (M463) */   /* гостиница у станции (M461) */
  if(typeof fleetInteract==="function"&&fleetInteract(sh))return;
  /* торговая баржа — к ней можно подойти и сторговаться без стыковки (12l) */
  if(typeof bargeInteract==="function"&&bargeInteract(sh))return;
  /* остов погибшей баржи — обыскать ровно раз (12l) */
  if(typeof wreckInteract==="function"&&wreckInteract(sh))return;
  /* находка в пустоте: капсула, спутник, контейнер, остов разведчика (17b) */
  if(typeof findInteract==="function"&&findInteract(sh))return;
  /* мачта приёмника: к ней подходят, ей везут новости (11ap, M220) */
  if(typeof relayInteract==="function"&&relayInteract(sh))return;
  let near=null,nd=1e9;
  for(const p of sys.planets){
    const d=Math.hypot(sh.x-p.x,sh.y-p.y)-p.radius;
    if(d<nd){nd=d;near=p;}
    for(const m of p.moons){
      const dm=Math.hypot(sh.x-m.x,sh.y-m.y)-m.radius;
      if(dm<nd){nd=dm;near=m;}
    }
  }
  if(near&&nd<250){
    if(!G.found.has(near.key)){
      G.found.add(near.key);G.data+=6;
      tell("","Открыта планета "+near.name+" · "+near.T.ru.toLowerCase()+" · +6 данных",
           "Открыто: "+near.name+"\n"+near.T.ru+"\n+6 данных");
    }
    if(nd<110){
      if(near.type==="gas"){
        /* сесть по-прежнему некуда, но в верхние слои можно зайти за газами */
        if(cue("ГАЗОВЫЙ ГИГАНТ · ПОСАДКИ НЕТ\nДЕЙСТВИЕ — ЗАХОД ЗА ЛЕТУЧИМИ ГАЗАМИ",CUE_ACT)&&actEdge){startScoop(near);return;}
      }
      else if(!G.opts.easyLand&&sp>3.2)cue("СЛИШКОМ БЫСТРО · "+sp.toFixed(1)+"\nТОРМОЗ — ГАШЕНИЕ",CUE_ACT);
      else{
        let ln="ДЕЙСТВИЕ — "+(G.opts.easyLand?"АВТО-ПОСАДКА":"ПОСАДКА")+" · "+near.name;
        if(G.tech.has("deep")&&near.res.length)
          ln+="\nНЕДРА: "+near.res.map(k=>RES[k].ru).join(", ");
        /* формуляр планеты (M400, §21.3): с орбиты — три слова и ни одного
           числа; зонд за 300 кр показывает пять ручек из восьми. Заложить
           базу вслепую по-прежнему можно, и это самая дорогая экономия в игре */
        if(typeof dialLine==="function"&&near.type!=="gas"){
          ln+="\n"+dialLine(G.sx,G.sy,near.idx);
          if(typeof probeHas==="function"&&!probeHas(G.sx,G.sy,near.idx)){
            /* цена — на паде, покупка — вторым тапом (боты 12.09): взведённый зонд
               переспрашивает «ТОЧНО?» три секунды игры (probeClaim, 21a8) */
            const pa=G._probeArm,arm=!!pa&&pa.sx===(G.sx|0)&&pa.sy===(G.sy|0)&&pa.idx===(near.idx|0)&&G.t-pa.t<180;
            ln+="\nЦЕЛЬ — "+(arm?"ТОЧНО? "+probePriceRu():"ЗОНД "+probePriceRu());
          }
        }
        const won=cue(ln,CUE_ACT);
        /* адрес для зонда: само нажатие ловит штурвал одним фронтом на клавишу
           и пэд, а `probeClaim` (21a8) его забирает (разбор 0.409.1). Живёт
           ровно кадр, в котором строка с ценой на экране (B1 ботов, 12.09):
           сбрасывается рядом с cueReset, ставится только победившей строкой */
        if(won&&near.type!=="gas")G._probeAt={sx:G.sx|0,sy:G.sy|0,idx:near.idx|0};
        if(won&&actEdge){startLanding(near);return;}
      }
      return;
    }
    /* имя планеты — сведения: кадр идёт дальше, к пустому баку и синтезу.
       Прежде здесь стоял return, и сухой корабль, дрейфующий мимо планеты,
       видел только её имя — ДЕЙСТВИЕ молчало */
    if(cueLvl()<CUE_INFO)cue(near.name+" · "+Math.round(nd)+" ед.",CUE_INFO);
  }
  /* ── мёртвый штиль: сигнал бедствия (M331) ──
     Топливо тратится только на тягу и тормоз, а тормоз доводит до полной
     остановки — «погасил скорость последними каплями» это обычное достижимое
     состояние. Руль без тяги ничего не меняет, синтез требует льда и техники,
     а эвакуация до сих пор жила только на грунте: игра не падала и ничего не
     говорила — она просто кончалась. Выход тот же, что с планеты: буксир до
     ближайшей станции за деньги, а нечем платить — полная потеря (дом или
     новый «Стриж»). Дешевле заправки он не бывает, поэтому «быстрым
     перелётом» его не сделать. Подсказку берём последней — если рядом планета
     или станция, у игрока и так есть что нажать. */
  /* 11.09: подсказка больше не единственный вход — газ на пустом баке сам
     открывает окно выходов (16c); ДЕЙСТВИЕ открывает его же */
  /* сюда доходит кадр, где ни один обработчик не взял ДЕЙСТВИЕ: сведения
     (имя планеты, край системы, погоня) пустой бак перебивает, действие — нет */
  if(cueLvl()<CUE_ACT&&G.fuel<=0&&!(G.tech.has("synth")&&G.cargo.ice>0)&&!document.body.classList.contains("sosopen")){   /* окно открыто — подсказка не повторяет его */
    /* подсказка называет только те выходы, что есть: без дома в системе старта ДОМОЙ нет */
    /* глагол короткий — пад берёт его сам: «ВЫХОДЫ» (дизайнер 12.09); что за
       выходы, говорит окно, подсказка его не пересказывает */
    if(cue("ХОДА НЕТ · БАК ПУСТ\nДЕЙСТВИЕ — ВЫХОДЫ",CUE_TROUBLE)&&actEdge){toggleSos(true);return;}
  }
  if(cueLvl()<CUE_ACT&&G.tech.has("synth")&&G.cargo.ice>0&&G.fuel<st.fuelMax){
    if(cue("ДЕЙСТВИЕ — СИНТЕЗ ТОПЛИВА ИЗО ЛЬДА ("+G.cargo.ice+")",CUE_ACT)&&actEdge){
      const ratio=st.synthRatio;
      const n=Math.min(G.cargo.ice,Math.ceil((st.fuelMax-G.fuel)/ratio));
      G.cargo.ice-=n;G.fuel=Math.min(st.fuelMax,G.fuel+n*ratio);
      say("Синтез: "+n+" льда → "+(n*ratio)+" топлива");
    }
  }
}
/* Сорок девять точек эллипса не меняются никогда: орбита, эксцентриситет и
   наклон большой оси заданы при рождении системы. Контур считается один раз
   и лежит на самой планете; в кадре остаётся перевод в экранные координаты. */
function orbPathOf(p){
  let O=p._orbPath;
  if(!O){
    O=p._orbPath=new Float64Array(98);
    for(let k=0;k<=48;k++){
      const pos=keplerPos(p.orbit,p.ecc,k/48*TAU,p.argp);
      O[k*2]=pos.x;O[k*2+1]=pos.y;
    }
  }
  return O;
}
function drawSystem(){
  const sh=G.ship,sys=G.sys,Z=G.zoom;
  /* режим наблюдения за наёмником: двигается только камера, корабль игрока
     продолжает лететь сам по себе и остаётся видимым на своём месте */
  const wA=G.watch?allyOf(G.watch):null;
  /* камера отстаёт от корабля и подрагивает на разгоне (16a-space): без этого
     корабль движется как курсор мыши, а не как масса с двигателем.
     В режиме наблюдения сглаживание не нужно — там камера и так не игрока. */
  const spd=Math.hypot(sh.vx,sh.vy);
  const thrusting=((G.ctl&&G.ctl.out.main)||!!G.ap)&&G.fuel>0;
  const fc=wA?{x:wA.x,y:wA.y}:flightCam(1,sh.x,sh.y,thrusting,spd);
  /* палец, легший поверх корабля, накрывает ровно то, чем правят: камера
     уводит корабль в сторону от него (M422). Тычок пересчитывается через ту же
     G.viewCX ниже, так что автопилот и захват целятся туда же, куда смотришь */
  const co=(!wA&&typeof helmCamOff==="function")?helmCamOff(Z):null;
  /* на тросе камера смотрит вперёд, туда, куда тащат: корабль ближе к задней
     кромке, баржа и трос целиком в кадре (дизайн-ревью 11.09) */
  let hx=0,hy=0;
  if(G.haul&&G.haul.ph!=="free"&&!wA){
    const T=G.haul,dx=T.bx-sh.x,dy=T.by-sh.y,d=Math.hypot(dx,dy)||1,k=Math.min(.5,haulReach()*.5/d);
    hx=dx*k;hy=dy*k;
  }
  /* сдвиг догоняет цель, а не встаёт в неё (тестировщик 12.09: на старте и в
     конце буксира кадр прыгал на полтроса) — это вид, не мир */
  HAUL_CAM.x+=(hx-HAUL_CAM.x)*.05;HAUL_CAM.y+=(hy-HAUL_CAM.y)*.05;
  if(Math.abs(HAUL_CAM.x)<.01&&Math.abs(HAUL_CAM.y)<.01&&!hx&&!hy){HAUL_CAM.x=0;HAUL_CAM.y=0;}
  /* ── тело в кадре (P9, плейтест 13.09 §2.6) ──
     «при приближении на орбите планета исчезает»: камера держала в середине
     корабль, и на ×4.5 планета, вокруг которой он идёт, уходила за край
     целиком. Теперь, когда корабль на орбите или у поверхности (ближе 250),
     кадр уводится к телу ровно настолько, чтобы его ближняя кромка осталась
     на экране — а корабль тоже; если оба не влезают, середина между ними.
     Догоняет плавно, как сдвиг троса: это вид, не мир */
  let bx=0,by=0;
  if(!wA&&!(G.haul&&G.haul.ph!=="free")){
    const B=camBody(sh,sys);
    if(B){
      const dx=B.x-sh.x,dy=B.y-sh.y,d=Math.hypot(dx,dy)||1,surf=Math.max(0,d-B.radius);
      const room=Math.max(40,Math.min(W,H)*.5-48)/Z;
      const shift=Math.min(surf-room,surf*.5);
      if(shift>0){bx=dx/d*shift;by=dy/d*shift;}
    }
  }
  BODY_CAM.x+=(bx-BODY_CAM.x)*.06;BODY_CAM.y+=(by-BODY_CAM.y)*.06;
  const cx0=fc.x+(co?co.x:0)+HAUL_CAM.x+BODY_CAM.x, cy0=fc.y+(co?co.y:0)+HAUL_CAM.y+BODY_CAM.y;
  const zx=x=>W/2+(x-cx0)*Z, zy=y=>H/2+(y-cy0)*Z;
  /* ввод пересчитывает тычок через ту же камеру */
  G.viewCX=cx0;G.viewCY=cy0;
  /* Тёмный фон запечён внутрь тайла туманности: тайл по построению кроет весь
     экран, поэтому отдельная заливка под ним была лишним полноэкранным
     проходом, а само наложение из складывающего стало непрозрачным — это
     дешевле, потому что не надо читать то, что уже лежит на экране. Пока
     туманность не доспела, заливка нужна, и её делает эта же строка. */
  if(!drawSysNebula(sys,cx0*.06*Z,cy0*.06*Z)){
    ctx.fillStyle="#05070c";ctx.fillRect(0,0,W,H);
  }
  drawStars(cx0*.06*Z,cy0*.06*Z,1);
  drawSpaceDust(cx0*Z,cy0*Z,Z,sysStyle(sys).dust);
  const ox=zx(0),oy=zy(0);
  ctx.lineWidth=1;
  /* орбиты гаснут с расстоянием: ровные кольца одной яркости делали систему чертежом (G10) */
  /* ── одна орбита — одна линия (П2 марафона) ──
     M242 сделал «кольцо ведёт к телу», но хвост рисовался по ОКРУЖНОСТИ
     радиуса p.orbit, а ниже вторым проходом шёл честный кеплеров эллипс — у
     планеты с эксцентриситетом линии расходились, и каждая планета возила ДВА
     кольца (автор, 29.08.2026: «кругов опять дохуя»). Окружность-приближение
     убрана: еле видный полный контур держит форму системы, а хвост кометы
     догорает у планеты — по её собственному эллипсу. */
  for(const p of sys.planets){
    const O=orbPathOf(p);
    const fade=clamp(1-p.orbit*Z/(W*1.6),.3,1);
    ctx.strokeStyle="rgba(120,190,210,"+(.05*fade).toFixed(3)+")";
    ctx.beginPath();
    ctx.moveTo(zx(O[0]),zy(O[1]));
    for(let k=1;k<=48;k++)ctx.lineTo(zx(O[k*2]),zy(O[k*2+1]));
    ctx.stroke();
    /* ближайшая к телу точка контура — голова хвоста; сзади по ходу движения
       (растущая аномалия) сегменты гаснут квадратично */
    let k0=0,bd=1e18;
    for(let k=0;k<48;k++){
      const dx=O[k*2]-p.x,dy=O[k*2+1]-p.y,d=dx*dx+dy*dy;
      if(d<bd){bd=d;k0=k;}
    }
    const SEG=9;
    for(let i=0;i<SEG;i++){
      const ka=((k0-i-1)%48+48)%48, kb=((k0-i)%48+48)%48;
      const t=1-i/SEG;
      ctx.strokeStyle="rgba(120,190,210,"+((.05+.24*t*t)*fade).toFixed(3)+")";
      ctx.beginPath();
      ctx.moveTo(zx(O[ka*2]),zy(O[ka*2+1]));
      ctx.lineTo(zx(O[kb*2]),zy(O[kb*2+1]));
      ctx.stroke();
    }
  }
  /* станция говорит тем же языком: еле видное кольцо и дуга, догорающая у неё */
  if(sys.station){
    const st=sys.station, sr=st.orbit*Z, sa=Math.atan2(st.y,st.x);
    ctx.strokeStyle="rgba(242,178,92,.04)";
    ctx.beginPath();ctx.arc(ox,oy,sr,0,TAU);ctx.stroke();
    const SEG=7, span=.9;
    for(let i=0;i<SEG;i++){
      const t=(i+1)/SEG;
      ctx.strokeStyle="rgba(242,178,92,"+(.04+.15*t*t).toFixed(3)+")";
      ctx.beginPath();ctx.arc(ox,oy,sr,sa-span*(1-i/SEG),sa-span*(1-(i+1)/SEG));
      ctx.stroke();
    }
  }
  if(sys.belt)drawBeltRing(ox,oy,sys.belt,Z);
  const R=sys.radius*Z;
  /* светило по своему типу: двойная, красный гигант, белый карлик, нейтронная,
     редко чёрная дыра (16a-space). Освещение и опасность по-прежнему считаются
     от sys.cls — экзотика меняет только вид. */
  drawStarBody(ox,oy,R,sys);
  /* ── зарево светила ──
     Здесь стояло «светило за кадром»: широкая заливка, которая ВКЛЮЧАЛАСЬ в
     тот миг, когда звезда уходила за край, и включалась сразу на полную.
     Замер на деве (30.08.2026, средняя яркость кадра, зум 0.16): до 12R —
     17.4, на 20R — 25.4, на 35R — 22.5. То есть отлетая, игрок получал
     вспышку ровно там, где ждал темноты, а подлетая — провал: заливка гасла,
     как только светило входило в кадр. Автор сказал это так: «отлетаешь —
     яркая, подлетаешь — тускнеет».

     Причина не в числах, а в устройстве: у заливки был порог, а у света
     порогов не бывает. Теперь это просто очень широкая и очень слабая корона
     в МИРОВЫХ координатах. Она стоит вокруг звезды и не знает ни про край
     кадра, ни про то, где корабль, — значит, и споткнуться ей не обо что:
     ближе к светилу её на экране больше, дальше меньше, и нигде нет мига, в
     который что-то включается. Отсечение по кадру осталось, но оно ничего не
     меняет в картинке: за пределом досягаемости спрайт и так прозрачен. */
  {const BLEED_R=30, BLEED_A=.115, BLEED_IN=.24;
   const col=sys.cls.col,c=hex2rgb(col),reach=R*BLEED_R;
   const dx=ox<0?-ox:(ox>W?ox-W:0), dy=oy<0?-oy:(oy>H?oy-H:0);
   if(Math.hypot(dx,dy)<reach){
     /* Внутри зарево ПУСТОЕ: до BLEED_IN (это как раз радиус короны) его нет
        вовсе. Иначе оно ложилось молочной пеленой на весь кадр вблизи
        светила — замер показал рост средней яркости на 72%, и чёрное небо со
        звёздами становилось серым. Корона там и так своё делает; зарево
        начинается ровно там, где она кончается, и потому одно продолжает
        другое, а не удваивает. Падение — степенная кривая: излом на среднем
        стопе рисовал еле видное кольцо, тот же грех, что у зарева звезды с
        поверхности (П1). */
     const BL=glowSprite("bleed3|"+col,()=>{const g=ctx.createRadialGradient(0,0,0,0,0,1);
       for(let i=0;i<=16;i++){const t=i/16;
         const inn=Math.min(1,t/BLEED_IN), a=BLEED_A*inn*inn*Math.pow(1-t,2.2);
         g.addColorStop(t,"rgba("+c.join(",")+","+a.toFixed(4)+")");}
       ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);});
     ctx.save();ctx.globalCompositeOperation="lighter";glowBlit(BL,ox,oy,reach);ctx.restore();}}
  BODY_LABELS.length=0;
  for(const p of sys.planets){
    const x=zx(p.x),y=zy(p.y),r=p.radius*Z;   /* диск — физический (16c, п. 2): зум делает планету большой, не корабль */
    if(x<-r-60||x>W+r+60||y<-r-60||y>H+r+60)continue;
    if(p.ring===undefined){
      const rr=rng(p.seed^0x21A9);
      p.ring=(p.type==="gas"&&rr()<.62)
        ? {i:1.34+rr()*.26,o:1.85+rr()*.7,tilt:.16+rr()*.26,n:3+Math.floor(rr()*4),s:p.seed}
        : null;
    }
    if(p.ring&&r>5)drawRing(x,y,r,p.ring,-1);
    planetDraw(p,x,y,r);
    if(typeof drawPlanetLights==="function")drawPlanetLights(sys,p,x,y,r);   /* огни ваших построек (M296) */
    if(typeof drawPlanetWorks==="function")drawPlanetWorks(sys,p,x,y,r);     /* отвал, купол, полоса (M306) */
    if(p.ring&&r>5)drawRing(x,y,r,p.ring,1);
    /* конец света виден с орбиты (хвост M114): у обречённой планеты рыжий
       ореол, а когда срок вышел — серая пелена поверх диска и потухший цвет.
       Планета та, на которой стоял посёлок */
    if(typeof doomGet==="function"&&doomGet()&&doomGet().sx===G.sx&&doomGet().sy===G.sy){
      const D=doomGet(), SS=(typeof settleAt==="function")?settleAt(D.sx,D.sy):null;
      if(SS&&SS.idx!==undefined&&(SS.idx|0)===(p.idx|0)){
        if(!D.over){
          const pu=.5+.5*Math.sin(G.t*.05);
          const g=ctx.createRadialGradient(x,y,r,x,y,r*2.4+6);
          g.addColorStop(0,"rgba(255,150,80,"+(.22+pu*.14).toFixed(3)+")");
          g.addColorStop(1,"rgba(255,150,80,0)");
          ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r*2.4+6,0,TAU);ctx.fill();
        }else{
          ctx.fillStyle="rgba(120,116,110,.62)";ctx.beginPath();ctx.arc(x,y,r+1,0,TAU);ctx.fill();
          ctx.strokeStyle="rgba(190,186,178,.35)";ctx.lineWidth=1;
          for(let k=0;k<3;k++){ctx.beginPath();ctx.ellipse(x,y,r*(1.25+k*.28),r*(.32+k*.08),.4,0,TAU);ctx.stroke();}
        }
      }
    }
    if(p.type!=="rocky"&&r>4){ctx.strokeStyle="rgba(150,220,255,.18)";ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(x,y,r+2.5,0,TAU);ctx.stroke();}
    for(let mi=0;mi<p.moons.length;mi++){
      const m=p.moons[mi];
      const mx=zx(m.x),my=zy(m.y),mr=Math.max(1,m.radius*Z);
      ctx.fillStyle="#9aa8b2";
      ctx.beginPath();ctx.arc(mx,my,mr,0,TAU);ctx.fill();
      if(G.ap&&G.ap.kind==="planet"&&G.ap.p===m)reticle(mx,my,mr+10);
      if(G.found.has(m.key)&&mr>2.4){
        ctx.fillStyle="rgba(154,168,178,.7)";ctx.font=uiFont(8);ctx.textAlign="center";
        /* имя уступает кораблю (R6): на дальней от него стороне диска */
        const ly=(m.y>=sh.y)?my+mr+11*uiK():my-mr-5*uiK(),lw=ctx.measureText(m.name).width;
        ctx.fillText(m.name.toUpperCase(),mx,ly);BODY_LABELS.push({x0:mx-lw/2,x1:mx+lw/2,y0:ly-8,y1:ly+2});
      }
    }
    if(G.found.has(p.key)){
      ctx.fillStyle="rgba(127,230,216,.55)";ctx.font=uiFont(9);ctx.textAlign="center";
      const ly=(p.y>=sh.y)?y+r+15*uiK():y-r-7*uiK(),lw=ctx.measureText(p.name).width;   /* имя уступает кораблю (R6) */
      ctx.fillText(p.name.toUpperCase(),x,ly);BODY_LABELS.push({x0:x-lw/2,x1:x+lw/2,y0:ly-9,y1:ly+2});
    }
    if(G.ap&&G.ap.kind==="planet"&&G.ap.p===p)reticle(x,y,r+16);
  }
  if(typeof drawSysLane==="function")drawSysLane(zx,zy,Z);   /* подъезд: бакены (M459, 17g) */
  if(typeof drawGestPost==="function")drawGestPost(zx,zy,Z);   /* пост у входа (M452, 17h) */
  if(typeof drawSysRail==="function")drawSysRail(zx,zy,Z);   /* кольцо станции железной дороги (M471) */
  if(typeof drawBillboard==="function")drawBillboard(zx,zy,Z);   /* щит с бегущей строкой (M460) */
  if(typeof drawHotel==="function")drawHotel(zx,zy,Z);
  if(typeof drawBazaar==="function")drawBazaar(zx,zy,Z);   /* барахолка (M463) */   /* гостиница (M461) */
  if(typeof drawPeaceFleet==="function")drawPeaceFleet(zx,zy,Z);   /* мирный флот державы (M455) */
  if(sys.station){
    const x=zx(sys.station.x),y=zy(sys.station.y);
    drawStation(x,y,Z);
    if(G.ap&&G.ap.kind==="station")reticle(x,y,34);
  }
  if(G.ap&&G.ap.kind==="belt")reticle(zx(G.ap.ax),zy(G.ap.ay),26);
  drawTrail(zx,zy,Z);
  /* факел рисуется до корпуса: иначе яркое ядро сопла ложится поверх обшивки */
  drawExhaust(zx,zy,Z,thrusting?1:0);
  if(thrusting&&typeof heatHaze==="function")exhaustHaze(zx,zy,Z);   /* марево за соплами (M325) */
  drawCombat(zx,zy,Z);
  helmDrawMarks(zx,zy,Z);   /* скобки захвата (M360) */
  if(typeof drawWrecksSystem==="function")drawWrecksSystem(zx,zy,Z);
  if(typeof drawFindsSystem==="function")drawFindsSystem(zx,zy,Z);
  if(typeof relayDrawSystem==="function")relayDrawSystem(zx,zy,Z);
  if(typeof drawBarges==="function")drawBarges(zx,zy,Z);
  if(G.haul&&typeof drawHaul==="function")drawHaul(zx,zy,Z);   /* спасательный буксир (16c) */
  if(typeof drawSysTraffic==="function")drawSysTraffic(zx,zy,Z);   /* челноки станции (M309) */
  if(typeof drawSysLaneShips==="function")drawSysLaneShips(zx,zy,Z);   /* очередь у дока (M459) */
  if(typeof drawCheburek==="function")drawCheburek(zx,zy,Z);   /* «Чебуречная» (M462) */
  if(typeof drawGesture==="function")drawGesture(zx,zy,Z);   /* жест хозяина (M452) */
  if(typeof drawWanderer==="function")drawWanderer(zx,zy,Z);        /* «Сорока» у планеты (M342) */
  if(typeof drawFleet==="function")drawFleet(zx,zy,Z);               /* флот ГЛАВТРАССЫ (M310) */
  if(typeof drawMooredBarge==="function")drawMooredBarge(zx,zy,Z);   /* своя баржа у Причала (M296) */
  /* дроны идут своими кругами между точкой и станцией (12e-drone-flight) */
  if(typeof drawDronesSystem==="function")drawDronesSystem(zx,zy,Z);
  drawAllies(zx,zy,Z);
  drawPirateBase(zx,zy,Z);
  ctx.save();ctx.translate(zx(sh.x),zy(sh.y));ctx.rotate(sh.a);
  /* пол масштаба .35, не .55 (M319): на дальнем отъезде корабль в .55 читался
     крупнее малой луны; ниже .35 он уже не находится глазом */
  ctx.scale(shipScaleAt(Z),shipScaleAt(Z));   /* один масштаб с буксиром (16c) */
  drawHull(G.shipId,thrusting,!!(G.ctl&&G.ctl.out.thr&&G.fuel>0),G.mods.engine,sh.bank);
  /* стволы на подвесах, повёрнутые по наводке (M363): сборка читается
     силуэтом раньше первого выстрела */
  if(typeof gunBarrelsDraw==="function")gunBarrelsDraw(stat().guns,sh.a);
  /* пусковая видна на силуэте (хвост M112): подвес под корпусом — заряженный
     сплошной, сухой — только обвод с красной меткой. По нему и без панели
     ясно, что стрелять нечем */
  {
    const stl=stat();
    if(stl.launcher){
      const dry=(G.cargo.missile|0)<=0;
      ctx.fillStyle=dry?"rgba(0,0,0,0)":"rgba(210,220,232,.9)";
      ctx.strokeStyle=dry?"rgba(255,110,90,.9)":"rgba(40,46,54,.9)";ctx.lineWidth=1;
      ctx.beginPath();ctx.rect(-5,6.5,9,3);if(!dry)ctx.fill();ctx.stroke();
      if(dry&&Math.sin(G.t*.2)>0){ctx.fillStyle="rgba(255,110,90,.9)";ctx.fillRect(-1.5,7.3,2,1.6);}
    }
  }
  ctx.restore();
  /* при наблюдении в центре не свой корабль — подписываем, за кем смотрим,
     и куда нажать, чтобы вернуться */
  if(wA){
    ctx.fillStyle="rgba(127,230,216,.9)";ctx.font="10px ui-monospace,monospace";ctx.textAlign="center";
    /* ниже приборов: сверху слева датчики, справа сводка — там текст не читался */
    ctx.fillText("НАБЛЮДЕНИЕ · "+wA.c.name.toUpperCase()+" · "+
                 ORDERS[wA.c.order.kind].ru.toUpperCase(),W/2,H-52);
    ctx.fillStyle="rgba(93,115,130,.85)";ctx.font="9px ui-monospace,monospace";
    ctx.fillText("ЭКИПАЖ — ВЕРНУТЬ КАМЕРУ",W/2,H-38);
  }
  /* кольца-метки вокруг корабля больше нет. Она появилась, когда при отдалении
     от корабля оставался голый силуэт: факел и шлейф считались по мировому
     масштабу и пропадали, глазу не за что было зацепиться. Теперь эффекты идут
     в масштабе корпуса и корабль виден по своему выхлопу — а нарисованный
     поверх мира кружок читался как элемент интерфейса, а не как корабль. */
  /* ── приборная часть кадра идёт в мерке интерфейса (M221) ──
     Масштаб, компас и фишки у кромки — это приборы, а не мир: рядом с ними
     лежит DOM, который растёт вместе с окном. Оставить их в пикселях значило
     бы развести один интерфейс надвое. Мировые координаты попадают в UI-мерку
     делением на неё же, а зона нажатия фишки возвращается в настоящие
     пиксели — её читает 15-input, который ни про какой zoom не знает. */
  if(!SHOT_CLEAN){                       /* на кадре заглавной приборов нет (M233) */
    const U=(typeof UIK==="number"&&UIK>0)?UIK:1;
    withScale(U,()=>drawSysHud(v=>zx(v)/U,v=>zy(v)/U,sh,sys,U));
    helmDrawSticks();   /* стики под пальцами — в пикселях касания, не в мерке (M360) */
  }
}
function drawSysHud(zx,zy,sh,sys,U){
  /* масштаб — над пэдом, а не под ним: внизу слева его закрывал руль.
     А с M360a — ещё и выше следа левого стика: палец рождается где угодно
     в нижней половине, и приборная мелочь уходит из-под него сама. */
  const feet=helmStickFoot();
  /* цифра масштаба живёт в шапке (#zoomlbl, 27z hud): над миром висит только нужное сейчас */
  /* компас на край экрана: звезда, станция и текущая цель автопилота,
     если они за кадром — чтобы в бесконечном космосе нельзя было заблудиться */
  /* ── у метки есть цель, и по метке можно ткнуть (плейтест, 26.08.2026) ──
     Тестировщик: «Ткнул в метку у края экрана — ничего. Метка выглядит как
     кнопка (рамка, стрелка), но не нажимается». Так и было: фишки рисовались
     на канве, а обработчик тычка искал только настоящие тела в мире. Вещь,
     которая выглядит кнопкой, обязана быть кнопкой.
     Каждая метка теперь несёт `t` — готовую цель автопилота, — а её
     прямоугольник складывается в `SYS_CHIPS`, откуда его читает 15-input.
     Заодно в список добавлена БЛИЖАЙШАЯ планета: раньше в компасе были
     только звезда, станция и текущая цель, и вылетевший на отшиб игрок видел
     у кромки одну звезду. Теперь из пустоты всегда видно, куда лететь. */
  const marks=[{x:0,y:0,c:"#f2b25c",l:"ЗВЕЗДА",t:{kind:"star"},k:"star"}];
  /* имя в верхнем регистре кладётся рядом с телом ОДИН раз (0.6): только
     toUpperCase в кадре рождал до трёх строк на каждый кадр на пустом месте */
  if(sys.station)marks.push({x:sys.station.x,y:sys.station.y,c:"#7fe6d8",
    l:sys.station._up||(sys.station._up=sys.station.name.toUpperCase()),t:{kind:"station"},k:"station"});
  {
    let np=null,nd=1e18;
    for(const p of sys.planets){
      const d=Math.hypot(p.x-sh.x,p.y-sh.y);
      if(d<nd){nd=d;np=p;}
    }
    if(np)marks.push({x:np.x,y:np.y,c:"#9fd8ff",l:np._up||(np._up=np.name.toUpperCase()),t:{kind:"planet",p:np},k:"planet:"+np.name});
  }
  if(G.ap){const T=targetPos();if(T)marks.push({x:T.x,y:T.y,c:"#ff6b57",l:"ЦЕЛЬ",t:null,k:"target"});}
  /* окликнувший: одна негашёная стрелка под окном оклика (R6, 12.09) */
  if(G.hail){const hp=G.pirates.find(q=>q._hail);if(hp)marks.push({x:hp.x,y:hp.y,c:"#ffd27a",l:hp._up||(hp._up=(hp.name||"ОКЛИК").toUpperCase()),t:null,hail:1,k:"hail"});}
  SYS_CHIPS.length=0;
  /* фишки у кромки (M167): раньше метки стояли на круге и на телефоне висели
     посреди сцены, наезжая друг на друга и на солнце. Теперь метка — плашка,
     прижатая к краю прямоугольника кадра (с отступами под приборы и пульт),
     а наложение снимается сдвигом вдоль кромки. */
  /* нижняя кромка — над живой строкой подсказки, а не по константе: чип
     «ЗВЕЗДА» ложился ровно на «МОЖНО ПРОСТО УЙТИ ИЛИ ПРЫГНУТЬ» (полировочный
     круг). Меряем сам DOM (правило 27z: не пересчитывать CSS в JS). */
  /* ── фишка живёт НА КРОМКЕ (P4) ──
     Прежде нижняя кромка САМА ехала вверх от каждого следа стика: палец
     рождается где угодно в нижней половине, и фишки уползали до середины
     экрана (плейтест 13.09, §1.4) — а фишка посреди кадра больше не говорит
     «цель там, за краем», она просто висит. Решение (Контроль, 17.09): кромка
     остаётся кромкой — внутрь от своего обычного отступа она уезжает не дальше
     CHIP_IN, а от узлов интерфейса фишка уворачивается ВДОЛЬ кромки, а если вдоль
     места нет вовсе — перескакивает на соседнюю кромку в сторону цели.
     След стика и строка подсказки теперь не двигают кромку, а лежат в том же
     списке занятых мест, что и сами фишки. */
  const y1base=H-(innerWidth<=760?150:120);
  /* прямоугольник подсказки — из кэша (0.3), читаем ОДИН раз на кадр: инсет и
     список занятых мест ниже раньше звали promptEl()/promptRect() порознь —
     не вторым чтением вёрстки (кэш это исключал и так), а тем, что эти два
     места могли разойтись, если бы правка тронула одно и забыла другое
     (Контроль, ревью кода 18.09) */
  const pe=promptEl(),pr=(pe&&pe.textContent)?promptRect():null;
  let inY1=y1base;
  for(const f of feet)inY1=Math.min(inY1,(f.y-f.r)/U-10);
  if(pr&&pr.height>0)inY1=Math.min(inY1,pr.top/U-8);
  inY1=Math.max(inY1,y1base-CHIP_IN);   /* внутрь — не дальше CHIP_IN пикселей */
  const inset={x0:10,x1:W-10,y0:76,y1:Math.max(140,inY1)};
  /* занятые места — одной сборкой, а не разрозненными блоками: это одна мысль
     («мимо чего скользит фишка»), а не четыре (Контроль, ревью кода 18.09).
     Следы стиков, живая строка подсказки, нос корабля (щедрый запас вокруг
     экранной точки — настоящий силуэт своего масштаба и корпуса здесь не
     заводим ради одной плашки) и подушки стика в покое. */
  const placed=[];
  for(const f of feet)placed.push({x:(f.x-f.r)/U,y:(f.y-f.r)/U,w:2*f.r/U,h:2*f.r/U});
  if(pr&&pr.height>0)placed.push({x:pr.left/U,y:pr.top/U,w:pr.width/U,h:pr.height/U});
  {
    const zsx=zx(sh.x),zsy=zy(sh.y);
    placed.push({x:zsx-SHIP_GUARD,y:zsy-SHIP_GUARD,w:2*SHIP_GUARD,h:2*SHIP_GUARD});
  }
  {
    const padsr=padsRect();
    if(padsr&&padsr.height>0)placed.push({x:padsr.left/U,y:padsr.top/U,w:padsr.width/U,h:padsr.height/U});
  }
  ctx.font="8px ui-monospace,monospace";
  /* под окном оклика и окном бака фишки гаснут, как борт (R0, дев 12.09): на
     них не жмут, пока окно ждёт ответа, и они не спорят с ним глазами */
  const bc=document.body.classList,CA=(bc.contains("hailopen")||bc.contains("sosopen"))?.12:1;
  /* плавное место фишки (P4, Контроль 17.09): без него смена следа стика
     телепортирует плашку в тот же кадр — на телефоне это дёрганье. Шаг кадра
     берём по настоящим часам (wallNow), а не по игровому dt: это чисто
     рисовальный эффект, мировой останов его не должен трогать */
  const CHIP_TNOW=wallNow();
  const chipDt=CHIP_T?Math.min(.2,(CHIP_TNOW-CHIP_T)/1000):1/60;
  CHIP_T=CHIP_TNOW;
  const usedKeys={};
  /* Порядок и уворот, читаемые глазом (Контроль, 17.09, по замеру тестировщика
     на S23: «432/457/321 — список на глаз переставляется»). Раньше каждая
     фишка искала свободное место от СВОЕЙ идеальной точки независимо — стоило
     ближней сдвинуться, и дальняя перескакивала на другую сторону от неё, хотя
     сама не двигалась. Теперь: обработка идёт в ОДНОМ порядке (ближняя цель
     первая, он же порядок марок — звезда/станция/планета/цель/оклик, они уже
     отсортированы по важности, а не по случайному кадру), и только первая
     фишка своей кромки ищет место в обе стороны от идеала; каждая следующая
     встаёт вплотную к уже поставленной, продолжая стопку в ту же сторону —
     она растёт, а не тасуется. Кончился хвост в эту сторону — пробуем другую
     сторону от самой первой фишки этой кромки, и только если некуда вовсе —
     старый перескок на соседнюю кромку. */
  const cands=[];
  for(const m of marks){
    const x=zx(m.x),y=zy(m.y);
    if(x>-20&&x<W+20&&y>-20&&y<H+20)continue;
    const ang=Math.atan2(y-H/2,x-W/2),dx=Math.cos(ang),dy=Math.sin(ang);
    /* пересечение луча из центра с прямоугольником кромки */
    let t=1e9;
    if(dx>1e-6)t=Math.min(t,(inset.x1-W/2)/dx);if(dx<-1e-6)t=Math.min(t,(inset.x0-W/2)/dx);
    if(dy>1e-6)t=Math.min(t,(inset.y1-H/2)/dy);if(dy<-1e-6)t=Math.min(t,(inset.y0-H/2)/dy);
    const cx=W/2+dx*t,cy=H/2+dy*t;
    const label=m.l+" · "+Math.round(Math.hypot(m.x-sh.x,m.y-sh.y));
    const tw=ctx.measureText(label).width,cw=tw+26,ch=16;
    const onSide=Math.abs(cx-inset.x0)<1||Math.abs(cx-inset.x1)<1;   // боковая кромка → двигаем по y
    cands.push({m,ang,dx,dy,cx,cy,label,cw,ch,onSide,dist:Math.hypot(m.x-sh.x,m.y-sh.y)});
  }
  cands.sort((a,b)=>a.dist-b.dist);   // ближняя цель первая — фиксированный порядок кадр к кадру
  const fits=(x,y,cw,ch)=>!placed.some(p=>!(x+cw<=p.x||p.x+p.w<=x||y+ch<=p.y||p.y+p.h<=y));
  const cX=(v,cw)=>clamp(v,inset.x0,inset.x1-cw),cY=(v,ch)=>clamp(v,inset.y0,inset.y1-ch);
  /* кромка слота — по тому, какая сторона плашки прижата к inset (P4, Контроль
     18.09): левая/правая/верхняя/нижняя. Нужна для правила «вдоль своей кромки
     едет, между кромками перемигивает» ниже. */
  const chipEdge=(x,y,cw,ch)=>{
    if(Math.abs(x-inset.x0)<1)return 0;
    if(Math.abs(x-(inset.x1-cw))<1)return 1;
    if(Math.abs(y-inset.y0)<1)return 2;
    return 3;
  };
  const slide=(vert,x0,y0,cw,ch,dirOnly)=>{
    /* шагов столько, сколько нужно, чтобы обойти кромку целиком: с коротким
       обходом большое препятствие (окно во всю кромку) оставляло фишку на месте
       вместо перескока на соседнюю — поймано замером в браузере. dirOnly — расти
       только в одну сторону (продолжение стопки), без него — искать в обе. */
    const len=vert?(inset.y1-inset.y0):(inset.x1-inset.x0);
    const N=Math.min(160,Math.ceil(len/10)+2);
    for(let st=0;st<=N;st++)for(const sg of (st?(dirOnly?[dirOnly]:[-1,1]):[1])){
      const off=st*10*sg;
      const x=vert?x0:cX(x0+off,cw),y=vert?cY(y0+off,ch):y0;
      if(fits(x,y,cw,ch))return [x,y];
    }
    return null;
  };
  let firstAnchor=null,stack=null;   // якорь и растущий фронт текущей стопки на кромке
  for(const c of cands){
    const m=c.m,ang=c.ang,dx=c.dx,dy=c.dy,cx=c.cx,cy=c.cy,label=c.label,cw=c.cw,ch=c.ch,onSide=c.onSide;
    const A=m.hail?1:CA;   /* окликнувший не гаснет */
    let rx=clamp(cx-(cx>W/2?cw-6:6),inset.x0,inset.x1-cw),ry=clamp(cy-ch/2,inset.y0,inset.y1-ch);
    let spot=null,usedVert=onSide,usedDir=0;
    const gap=4;
    if(stack&&stack.onSide===onSide){
      const x0=onSide?stack.x:stack.x+stack.dir*(stack.cw/2+gap+cw/2);
      const y0=onSide?stack.y+stack.dir*(stack.ch/2+gap+ch/2):stack.y;
      const r=slide(onSide,x0,y0,cw,ch,stack.dir);
      if(r){spot=r;usedDir=stack.dir;}
    }
    if(!spot&&firstAnchor&&firstAnchor.onSide===onSide){
      const dir=-((stack&&stack.onSide===onSide&&stack.dir)||1);
      const x0=onSide?firstAnchor.x:firstAnchor.x+dir*(firstAnchor.cw/2+gap+cw/2);
      const y0=onSide?firstAnchor.y+dir*(firstAnchor.ch/2+gap+ch/2):firstAnchor.y;
      const r=slide(onSide,x0,y0,cw,ch,dir);
      if(r){spot=r;usedDir=dir;}
    }
    if(!spot){
      /* первая фишка своей кромки — ищем от идеала в обе стороны, как раньше */
      const r=slide(onSide,rx,ry,cw,ch,0);
      if(r){
        spot=r;
        const moved=onSide?(r[1]-ry):(r[0]-rx);
        usedDir=moved>0?1:(moved<0?-1:1);
      }
    }
    if(!spot){
      /* вдоль своей кромки места нет вовсе — перескок на соседнюю, в сторону цели */
      const r=onSide?slide(false,cX(cx-cw/2,cw),dy>0?inset.y1-ch:inset.y0,cw,ch,0)
                    :slide(true,dx>0?inset.x1-cw:inset.x0,cY(cy-ch/2,ch),cw,ch,0);
      if(r){spot=r;usedVert=!onSide;usedDir=1;}
    }
    if(spot){rx=spot[0];ry=spot[1];}
    placed.push({x:rx,y:ry,w:cw,h:ch});
    if(spot){
      if(!firstAnchor)firstAnchor={onSide:usedVert,x:rx,y:ry,cw,ch};
      stack={onSide:usedVert,dir:usedDir,x:rx,y:ry,cw,ch};
    }
    usedKeys[m.k]=true;
    /* Плавный ход к месту, а не телепорт (P4, Контроль 17.09): рисуем в
       CHIP_POS.get(m.k), которое движется к логическому (rx,ry) не быстрее
       CHIP_SPEED px/с. Смена кромки едет НЕ лерпом — тухнет на старом месте и
       загорается на новом за CHIP_FADE секунд. Дизайнер нашла кадром: лерп по
       прямой (x,y) при смене кромки на КОРОТКОЙ дистанции резал угол насквозь
       через кадр (0,8 с внутри кадра при повороте). Правило Контроля проще, чем
       мерить путь: перескок — это не «далеко», а «кромка слота другая, чем у
       нарисованного места» — сравниваем кромку, не расстояние. Вдоль ОДНОЙ
       кромки дистанция неважна, лерп как был. */
    let dcx=rx,dcy=ry,dcA=1;
    {
      let st=CHIP_POS.get(m.k);
      const targetEdge=chipEdge(rx,ry,cw,ch);
      /* не только «нет записи», но и «запись сломана» — испорченный кадр
       (NaN от чужого кода) иначе застревает в NaN навсегда: расстояние до
       NaN само NaN, а любое сравнение с NaN ложно, так что ни один из веток
       ниже никогда не выбирает «доехали» и лерп не сходится в принципе */
      if(!st||!isFinite(st.x)||!isFinite(st.y)){st={x:rx,y:ry,edge:targetEdge,fading:false,fadeT:0,fx:rx,fy:ry};CHIP_POS.set(m.k,st);}
      else if(st.fading){
        st.fadeT+=chipDt;
        const half=CHIP_FADE/2;
        if(st.fadeT>=CHIP_FADE){st.fading=false;st.x=rx;st.y=ry;st.edge=targetEdge;dcx=rx;dcy=ry;dcA=1;}
        else if(st.fadeT<half){dcx=st.fx;dcy=st.fy;dcA=1-st.fadeT/half;}
        else{dcx=rx;dcy=ry;dcA=(st.fadeT-half)/half;}
      }else if(st.edge!==targetEdge){
        st.fading=true;st.fadeT=0;st.fx=st.x;st.fy=st.y;
        dcx=st.fx;dcy=st.fy;dcA=1;
      }else{
        const dist=Math.hypot(rx-st.x,ry-st.y);
        const maxStep=CHIP_SPEED*chipDt;
        if(dist<=maxStep||dist<.01){st.x=rx;st.y=ry;}
        else{st.x+=(rx-st.x)/dist*maxStep;st.y+=(ry-st.y)/dist*maxStep;}
        dcx=st.x;dcy=st.y;dcA=1;
      }
    }
    rx=dcx;ry=dcy;
    const AA=A*dcA;
    /* Зона нажатия шире плашки: правило интерфейса требует 44 px на палец, а
       фишка ростом 16. Растим её вокруг центра, не трогая рисунок. Зона идёт
       за видимым местом (rx,ry уже сглажены), а не за логическим слотом —
       иначе палец бил бы мимо плашки во время подъезда или затухания. */
    if(m.t&&A===1&&dcA>.5){
      const PAD=Math.max(0,(44-ch)/2);
      SYS_CHIPS.push({x:(rx-6)*U,y:(ry-PAD)*U,w:(cw+12)*U,h:(ch+PAD*2)*U,t:m.t});
    }
    ctx.globalAlpha=AA;ctx.fillStyle="rgba(5,7,12,.72)";ctx.fillRect(rx,ry,cw,ch);
    ctx.strokeStyle=m.c;ctx.globalAlpha=.5*AA;ctx.lineWidth=1;ctx.strokeRect(rx+.5,ry+.5,cw-1,ch-1);ctx.globalAlpha=AA;
    /* после перескока на соседнюю кромку точка луча и сама фишка расходятся:
       сторона надписи берётся по МЕСТУ фишки (P4) */
    const onRight=rx+cw/2>W/2;
    ctx.save();ctx.translate(onRight?rx+cw-8:rx+8,ry+ch/2);ctx.rotate(ang);
    ctx.fillStyle=m.c;ctx.beginPath();ctx.moveTo(6,0);ctx.lineTo(-4,4);ctx.lineTo(-4,-4);ctx.closePath();ctx.fill();
    ctx.restore();
    ctx.fillStyle=m.c;ctx.textAlign=onRight?"right":"left";
    ctx.fillText(label,onRight?rx+cw-18:rx+18,ry+12);
    ctx.textAlign="center";ctx.globalAlpha=1;
  }
  /* цель пропала из кадра (тело за спиной, автопилот снят) — забыть её место,
     иначе через минуту чья-то новая фишка того же типа въедет с чужого края */
  for(const k of CHIP_POS.keys())if(!usedKeys[k])CHIP_POS.delete(k);
}
/* кольцо: half=-1 — дальняя дуга под планетой, half=1 — ближняя поверх неё */
