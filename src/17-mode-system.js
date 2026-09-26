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
const CHIP_TOUCH=44;     /* зона нажатия фишки под палец: правило интерфейса, а не вкус */
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
/* ── стена края (D6, телефон 18.09): якорь заворачивал корабль, а в мире не было
   ничего — только строка. Кромка проступает за 900 единиц: широкая мягкая
   полоса и тонкая пунктирная линия тем же цветом, что фишки компаса; у самого
   корабля — «упор», светлое пятно на линии там, где он в неё упёрся ── */
/* кромка системы (D6, 18.09) — на видеокарте (G4): вместо обруча с пунктиром
   поле-мембрана из шестигранных ячеек, которые текут вдоль кромки; у точки
   упора — пятно и кольца ряби, расходящиеся по полю; гаснет той же долей k */
const GEW=new Float32Array(12);
const GEW_WGSL=`
fn hexd(p:vec2f)->f32{let s=vec2f(1.,1.7320508);let a=p-s*floor(p/s+.5);let b=p-s*floor((p-s*.5)/s+.5)-s*.5;
  let q=select(b,a,dot(a,a)<dot(b,b));let h=abs(q);return .5-max(dot(h,normalize(vec2f(1.,1.7320508))),h.x);}
fn field(p:vec2f,uv:vec2f)->vec4f{
  let c=fu.v[0].xy;let r=fu.v[0].z;let k=fu.v[0].w;let cp=fu.v[1].xy;let pk=fu.v[1].z;let t=fu.v[1].w;let Z=fu.v[2].x;let hit=fu.v[2].y;
  let dv=p-c;let dist=length(dv)-r;let w=max(8.,40.*Z);
  if(abs(dist)>w*3.+140.){return vec4f(0.);}
  let cell=26.*Z+10.;let n=max(6.,round(6.2831853*r/cell));
  let a=(atan2(dv.y,dv.x)/6.2831853+.5)*n;
  let hp=vec2f(a,(dist/cell)+t*.004);
  let e=hexd(hp*vec2f(1.,1.)*1.);
  let band=exp(-(dist*dist)/(w*w));
  let edge=(1.-smoothstep(.0,.06,e))*band;
  let line=exp(-(dist*dist)/2.2);
  var I=(band*.10+edge*.2+line*.5)*.75;   /* вдали от упора тише: стена не перекрикивает корабль */
  if(hit>0.){let dc=length(p-cp);let fall=exp(-dc/(160.*Z+60.));
    I=I+fall*(.28*pk+.18*max(0.,sin(dc*.09-t*.25)))*exp(-(dist*dist)/(w*w*4.));}
  let col=vec3f(127.,230.,216.)/255.;
  return vec4f(col*I*k,0.);
}`;
function drawEdgeWall(zx,zy,Z){
  const sys=G.sys,sh=G.ship;if(!sys||!sh)return;
  const R=sysEdge(sys),d=Math.hypot(sh.x,sh.y)||1,k=clamp((d-(R-900))/900,0,1);
  if(k<=0)return;
  const pass=gpuScene();if(!pass)return;
  const cx=zx(0),cy=zy(0),r=R*Z,a=Math.atan2(sh.y,sh.x),U=GEW;
  U[0]=cx;U[1]=cy;U[2]=r;U[3]=k;U[4]=cx+Math.cos(a)*r;U[5]=cy+Math.sin(a)*r;U[6]=.5+.5*Math.sin(G.t*.12);U[7]=G.t;
  U[8]=Z;U[9]=d>R-120?1:0;
  gpuField(pass,"gew",GEW_WGSL,U,[]);
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
  if(typeof zoomEase==="function")zoomEase(dt);   /* щипок едет к цели (P9) */
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
    !apOn&&!!helm&&helm.thr&&G.fuel>0,!apOn&&!!helm&&helm.idle);
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
  if(typeof subTick==="function"&&(G.t|0)%60===0)subTick();
  if(typeof recallTick==="function"&&(G.t|0)%60===0)recallTick();   /* отзыв партии Хай-Фронта (M509) */   /* подписка: взнос на границе смены (M487) */   /* течёт бак: −1 % в минуту (M482) */   /* стапель: заказ готов — строка в почте (M481) */   /* техподдержка решает заявки (M495) */   /* ловушки антивещества: питание или процент в минуту (M468) */
  if(typeof hailTick==="function"&&hailTick(sh,dt,actEdge))return;

  if(sys.station){
    const S=sys.station,ds=Math.hypot(sh.x-S.x,sh.y-S.y);
    /* ключ причала («Сорока», 12v-wander-shop): стыковка с любой точки системы */
    const keyOn=(typeof wanderHas==="function")&&wanderHas("key")&&ds<2600;
    if(ds<300||keyOn){
      if(ds<95||keyOn){
        if(sp>2.6)cue("СБРОСЬТЕ СКОРОСТЬ · "+decRu(sp,1)+"\nТОРМОЗ — ГАШЕНИЕ",CUE_ACT);
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
        if(sp>2.6)cue("СБРОСЬТЕ СКОРОСТЬ · "+decRu(sp,1)+"\nТОРМОЗ — ГАШЕНИЕ",CUE_ACT);
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
      else if(!G.opts.easyLand&&sp>3.2)cue("СЛИШКОМ БЫСТРО · "+decRu(sp,1)+"\nТОРМОЗ — ГАШЕНИЕ",CUE_ACT);
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
/* строка наблюдения: за кем смотрим и куда нажать, чтобы вернуться — две строки масками атласа #ovl.
   Ниже приборов: сверху слева датчики, справа сводка — там текст не читался. Но и над пэдами:
   на телефоне круг «Цель» ложился на конец строки (26.09), а приёмник и подсказка стоят прямо
   над пэдами — строка встаёт над всеми тремя; прямоугольники из кэша (08-state), не чтение вёрстки */
function sysWatchLabel(wA){
  let yb=H-52;const rc=cvsRect();
  for(const r of [padsRect(),consoleRect(),promptEl()&&promptEl().textContent?promptRect():null])
    if(r&&r.height>0&&rc.height>0)yb=Math.min(yb,(r.top-rc.top)*H/rc.height-24);
  const a=ovText(OVL.uq,W/2,yb,"НАБЛЮДЕНИЕ · "+wA.c.name.toUpperCase()+" · "+ORDERS[wA.c.order.kind].ru.toUpperCase(),
         "10px ui-monospace,monospace","rgba(127,230,216,.9)","center","alphabetic",1,1);
  const b=ovText(OVL.uq,W/2,yb+14,"ЭКИПАЖ — ВЕРНУТЬ КАМЕРУ","8px ui-monospace,monospace","rgba(93,115,130,.85)","center","alphabetic",1,1);
  return {x0:Math.min(a.x0,b.x0),x1:Math.max(a.x1,b.x1),y0:a.y0,y1:b.y1};   /* рамка обеих строк — для проверок наложения */
}
/* заслон тела для кораблей (GPU.oc, shAt 08b): тень — луч от звезды (ox,oy) через тело радиуса r. Кладём,
   только если луч, раздутый на 2r, задевает экран, — тень планеты за краем тоже; далёкое тело сдвигаем по лучу
   к краю раздутого экрана: f16 заслона держит до 65504, а диск заслона (в нём тени нет) в экран не заходит.
   Последний из шестнадцати — станции (17c) */
function sysOcPush(x,y,r,ox,oy){
  if(r<2||GPU.oc.length>=15)return;
  const d=Math.hypot(x-ox,y-oy);if(d<1)return;
  const dx=(x-ox)/d,dy=(y-oy)/d,m=2*r,sl=(p,v,lo,hi)=>{   /* отрезок луча внутри полосы [lo,hi] */
    if(Math.abs(v)<1e-9)return p<lo||p>hi?[1,0]:[0,Infinity];const a=(lo-p)/v,b=(hi-p)/v;return a<b?[a,b]:[b,a];};
  const X=sl(x,dx,-m,W+m),Y=sl(y,dy,-m,H+m),t0=Math.max(0,X[0],Y[0]);
  if(t0>Math.min(X[1],Y[1]))return;
  GPU.oc.push([x+dx*t0,y+dy*t0,r]);
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
  gpuSpaceSys(sys,cx0,cy0,Z);   /* туманность, звёзды, пыль — на видеокарте (16g) */
  const ox=zx(0),oy=zy(0);
  ctx.lineWidth=1;
  const R=sys.radius*Z;
  /* орбиты, кольцо станции, пояс, светило и его зарево — на видеокарте (17g) */
  gpuSysUnder(sys,ox,oy,R,Z);   /* метки пробы (orbits/belt/star) ставит сам, 28z gpuSeg */
  if(sys.belt)drawBeltRocks(ox,oy,sys.belt,Z,G.ship.x,G.ship.y);
  BODY_LABELS.length=0;gpuSeg("planets");
  for(const p of sys.planets){
    const x=zx(p.x),y=zy(p.y),r=p.radius*Z;   /* диск — физический (16c, п. 2): зум делает планету большой, не корабль */
    sysOcPush(x,y,r,ox,oy);   /* тень на корабли — и от планеты за краем экрана */
    if(x<-r-60||x>W+r+60||y<-r-60||y>H+r+60)continue;
    if(p.ring===undefined){
      const rr=rng(p.seed^0x21A9);
      p.ring=(p.type==="gas"&&rr()<.62)
        ? {i:1.34+rr()*.26,o:1.85+rr()*.7,tilt:.16+rr()*.26,n:3+Math.floor(rr()*4),s:p.seed}
        : null;
    }
    gpuPlanet(p,x,y,r,planetLightsOn(sys,p,r));   /* шар, свет, воздух, облака, кольцо; огни ваших построек (M296) — городами (17ga) */
    if(typeof drawPlanetWorks==="function")drawPlanetWorks(sys,p,x,y,r);     /* отвал, купол, полоса (M306) */
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
    for(let mi=0;mi<p.moons.length;mi++){
      const m=p.moons[mi];
      const mx=zx(m.x),my=zy(m.y),mr=Math.max(1,m.radius*Z);
      gpuMoon(m,(p.idx|0)+"_"+mi,mx,my,mr);sysOcPush(mx,my,mr,ox,oy);
      if(G.ap&&G.ap.kind==="planet"&&G.ap.p===m)reticle(mx,my,mr+10);
      if(G.found.has(m.key)&&mr>2.4){
        ctx.fillStyle="rgba(154,168,178,.7)";ctx.font=uiFont(8);ctx.textAlign="center";
        /* имя уступает кораблю (R6): на дальней от него стороне диска */
        const ly=(m.y>=sh.y)?my+mr+11*uiK():my-mr-5*uiK(),lw=gcMeasure(ctx.font,m.name).width;
        domLabel("mo"+(p.idx|0)+"_"+mi,mx,ly,m.name.toUpperCase(),ctx.font,"rgba(154,168,178,.7)","center");BODY_LABELS.push({x0:mx-lw/2,x1:mx+lw/2,y0:ly-8,y1:ly+2});
      }
    }
    if(G.found.has(p.key)){
      ctx.fillStyle="rgba(127,230,216,.55)";ctx.font=uiFont(9);ctx.textAlign="center";
      const ly=(p.y>=sh.y)?y+r+15*uiK():y-r-7*uiK(),lw=gcMeasure(ctx.font,p.name).width;   /* имя уступает кораблю (R6); мерка атласа — без 2D на #c */
      domLabel("pl"+(p.idx|0),x,ly,p.name.toUpperCase(),ctx.font,"rgba(127,230,216,.55)","center");BODY_LABELS.push({x0:x-lw/2,x1:x+lw/2,y0:ly-9,y1:ly+2});
    }
    if(G.ap&&G.ap.kind==="planet"&&G.ap.p===p)reticle(x,y,r+16);
  }
  gpuSeg("world");
  if(typeof drawSysLane==="function")drawSysLane(zx,zy,Z);   /* подъезд: бакены (M459, 17g) */
  if(typeof drawGestPost==="function")drawGestPost(zx,zy,Z);   /* пост у входа (M452, 17h) */
  if(typeof drawSysRail==="function")drawSysRail(zx,zy,Z);   /* кольцо станции железной дороги (M471) */
  if(typeof drawBillboard==="function")drawBillboard(zx,zy,Z);   /* щит с бегущей строкой (M460) */
  if(typeof drawLawRing==="function")drawLawRing(zx,zy,Z);   /* кольцо скоростного режима Орднунга (M456) */
  if(typeof drawHotel==="function")drawHotel(zx,zy,Z);
  if(typeof drawBazaar==="function")drawBazaar(zx,zy,Z);
  if(typeof drawGiant==="function")drawGiant(zx,zy,Z);   /* великан рукава (M464) */
  if(typeof drawRailArrive==="function")drawRailArrive(zx,zy);   /* вспышка выхода из поезда (M473) */
  drawEdgeWall(zx,zy,Z);   /* кромка системы видна, когда к ней подошли (D6, 18.09) */   /* барахолка (M463) */   /* гостиница (M461) */
  if(typeof drawPeaceFleet==="function")drawPeaceFleet(zx,zy,Z);   /* мирный флот державы (M455) */
  if(sys.station){
    const x=zx(sys.station.x),y=zy(sys.station.y);
    drawStation(x,y,Z);
    if(G.ap&&G.ap.kind==="station")reticle(x,y,34);
  }
  if(G.ap&&(G.ap.kind==="belt"||G.ap.kind==="wreck"))reticle(zx(G.ap.ax),zy(G.ap.ay),26);
  drawTrail(zx,zy,Z);
  /* факел рисуется до корпуса: иначе яркое ядро сопла ложится поверх обшивки */
  drawExhaust(zx,zy,Z,thrusting?1:0);
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
  if(typeof drawGesture==="function")drawGesture(zx,zy,Z);
  if(typeof drawAbil==="function")drawAbil(zx,zy);   /* луч резака, прожектор (M484) */   /* жест хозяина (M452) */
  if(typeof drawWanderer==="function")drawWanderer(zx,zy,Z);        /* «Сорока» у планеты (M342) */
  if(typeof drawFleet==="function")drawFleet(zx,zy,Z);               /* флот ГЛАВТРАССЫ (M310) */
  if(typeof drawMooredBarge==="function")drawMooredBarge(zx,zy,Z);   /* своя баржа у Причала (M296) */
  /* дроны идут своими кругами между точкой и станцией (12e-drone-flight) */
  if(typeof drawDronesSystem==="function")drawDronesSystem(zx,zy,Z);
  drawAllies(zx,zy,Z);
  drawPirateBase(zx,zy,Z);
  /* пол масштаба .35, не .55 (M319): на дальнем отъезде корабль в .55 читался
     крупнее малой луны; ниже .35 он уже не находится глазом. Один масштаб с буксиром (16c) */
  const shS=shipScaleAt(Z);
  /* корпус на видеокарте (17c2): тело светом звезды, факел и огни — явным светом;
     2D-пути нет (25.09): без видеокарты нет и полёта. Стека матриц ctx здесь больше нет —
     место, курс и масштаб идут числами */
  const hsx=zx(sh.x),hsy=zy(sh.y),hlx=zx(0)-hsx,hly=zy(0)-hsy,hln=Math.hypot(hlx,hly)||1;
  hullGpuDraw(G.shipId,hsx,hsy,sh.a,shS,thrusting,!!(G.ctl&&G.ctl.out.thr&&G.fuel>0),G.mods.engine,sh.bank,hlx/hln,hly/hln);
  /* стволы на подвесах, повёрнутые по наводке (M363), и пусковая под корпусом (хвост M112):
     сборка читается силуэтом раньше первого выстрела, а сухая пусковая — без панели (05c) */
  {const stl=stat();shipGearGpu(stl.guns,!!stl.launcher,(G.cargo.missile|0)<=0,hsx,hsy,sh.a,shS);}
  if(typeof drawGestureTop==="function")drawGestureTop(zx,zy,Z);   /* жест поверх корпуса (17h) */
  /* при наблюдении в центре не свой корабль — подписываем, за кем смотрим,
     и куда нажать, чтобы вернуться */
  if(wA&&GPU.on)sysWatchLabel(wA);   /* слой #ovl (08bi), без 2D */
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
    /* фишки у кромки — слой #ovl (08bi chipDom), каждый кадр: едут за миром */
    withScale(U,()=>drawSysHud(v=>zx(v)/U,v=>zy(v)/U,sh,sys,U));
    /* стики под пальцами — в пикселях касания, не в мерке (M360); слой #ovl, каждый кадр (15b) */
    if(GPU.on)helmDrawSticks();
  }
}
/* дистанция на фишке (пара HUD 15/n): на ходу — две значащие цифры, «3,2к»,
   «390»: точность, которую глаз успевает прочесть, и плашка перерастеривается
   раз в сотню единиц, а не каждый кадр; на подходе (ближе 400) и на месте —
   точное число, там оно решает */
function chipDist(d){
  const sh=G.ship;
  if(d<400||Math.hypot(sh.vx||0,sh.vy||0)<.05)return String(Math.round(d));
  if(d<995)return String(Math.round(d/10)*10);
  const k=d/1000;
  return (k<9.95?k.toFixed(1).replace(".",","):String(Math.round(k)))+"к";
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
  /* звезда и цель — тихие холодные фишки (пара HUD 15/n): тёплый у кадра один,
     следующее действие; имена — как написаны, регистр как в предложении */
  const marks=[{x:0,y:0,c:"#c3d0d8",l:"Звезда",t:{kind:"star"},k:"star"}];
  if(sys.station)marks.push({x:sys.station.x,y:sys.station.y,c:"#7fe6d8",
    l:sys.station.name,t:{kind:"station"},k:"station"});
  {
    let np=null,nd=1e18;
    for(const p of sys.planets){
      const d=Math.hypot(p.x-sh.x,p.y-sh.y);
      if(d<nd){nd=d;np=p;}
    }
    if(np)marks.push({x:np.x,y:np.y,c:"#9fd8ff",l:np.name,t:{kind:"planet",p:np},k:"planet:"+np.name});
  }
  if(G.ap){const T=targetPos();if(T)marks.push({x:T.x,y:T.y,c:"#e6eef2",l:"Цель",t:null,k:"target"});}
  /* корпус после боя (G4c): подпись над ним стала фишкой — ближний из тех, что за кадром
     (видимый читается сам), по тычку автопилот к нему */
  if(G.npcWrecks&&G.npcWrecks.length){
    let nw=null,nd=1e18;
    for(const w of G.npcWrecks){
      const x=zx(w.x),y=zy(w.y);if(x>-20&&x<W+20&&y>-20&&y<H+20)continue;
      const d=Math.hypot(w.x-sh.x,w.y-sh.y);if(d<nd){nd=d;nw=w;}
    }
    if(nw)marks.push({x:nw.x,y:nw.y,c:"#b8c2cc",l:"Корпус",t:{kind:"wreck",ax:nw.x,ay:nw.y,nm:"корпус"},k:"wreck:"+nw.seed});
  }
  /* окликнувший: одна негашёная стрелка под окном оклика (R6, 12.09) */
  if(G.hail){const hp=G.pirates.find(q=>q._hail);if(hp)marks.push({x:hp.x,y:hp.y,c:"#ffd27a",l:hp.name||"Оклик",t:null,hail:1,k:"hail"});}
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
  /* верхняя кромка — ниже всего блока шкал: фишка в строке ТРЮМ читалась её частью */
  const hr=hudRect(),hudY1=(hr&&hr.height>0)?hr.bottom/U+8:76;
  const inset={x0:12,x1:W-12,y0:Math.max(76,hudY1),y1:Math.max(140,inY1)};
  /* занятые места — одной сборкой, а не разрозненными блоками: это одна мысль
     («мимо чего скользит фишка»), а не четыре (Контроль, ревью кода 18.09).
     Следы стиков, живая строка подсказки, нос корабля (щедрый запас вокруг
     экранной точки — настоящий силуэт своего масштаба и корпуса здесь не
     заводим ради одной плашки) и подушки стика в покое. */
  /* Узлы интерфейса раздуваются на ЗОНУ НАЖАТИЯ фишки (M422, правка 19.09):
     плашка ростом 16, а палец берёт её за 44 (SYS_CHIPS ниже растит её вокруг
     центра). Расходиться со следом стика и со строкой подсказки обязана именно
     зона: иначе плашка честно стоит рядом, а её невидимая половина лежит прямо
     под большим пальцем. Между собой фишки по-прежнему меряются плашками —
     раздуй и их, и нижний ряд разъехался бы втрое. */
  const CHIP_TPX=6,CHIP_TPY=Math.max(0,(CHIP_TOUCH-16)/2);
  const grow=r=>({x:r.x-CHIP_TPX,y:r.y-CHIP_TPY,w:r.w+2*CHIP_TPX,h:r.h+2*CHIP_TPY});
  const placed=[];
  for(const f of feet)placed.push(grow({x:(f.x-f.r)/U,y:(f.y-f.r)/U,w:2*f.r/U,h:2*f.r/U}));
  if(pr&&pr.height>0)placed.push(grow({x:pr.left/U,y:pr.top/U,w:pr.width/U,h:pr.height/U}));
  {
    const zsx=zx(sh.x),zsy=zy(sh.y);
    placed.push({x:zsx-SHIP_GUARD,y:zsy-SHIP_GUARD,w:2*SHIP_GUARD,h:2*SHIP_GUARD});
  }
  {
    const padsr=padsRect();
    if(padsr&&padsr.height>0)placed.push(grow({x:padsr.left/U,y:padsr.top/U,w:padsr.width/U,h:padsr.height/U}));
    /* борт тоже: фишка у нижней кромки проходила мимо него только удачей
       геометрии (пара HUD 15/n) */
    const railr=railRect();
    if(railr&&railr.height>0)placed.push(grow({x:railr.left/U,y:railr.top/U,w:railr.width/U,h:railr.height/U}));
  }
  /* и сам блок шкал — занятое место, если кромка до него всё же дотянется */
  if(hr&&hr.height>0)placed.push({x:hr.left/U-4,y:hr.top/U-4,w:hr.width/U+8,h:hr.height/U+8});
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
    const label=m.l+" · "+chipDist(Math.hypot(m.x-sh.x,m.y-sh.y));
    const tw=gcMeasure(ctx.font,label).width,cw=tw+26,ch=16;   /* мерка атласа (08cb): на #c ни одного вызова */
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
  const chipDrawn=[];                // где фишки нарисованы в этом кадре (сглаженные места)
  const CL=[];                       // фишки после хода к слоту — к раскладке по ключу
  for(const c of cands){
    const m=c.m,ang=c.ang,dx=c.dx,dy=c.dy,cx=c.cx,cy=c.cy,label=c.label,cw=c.cw,ch=c.ch,onSide=c.onSide;
    const A=m.hail?1:CA;   /* окликнувший не гаснет */
    let rx=clamp(cx-(cx>W/2?cw-6:6),inset.x0,inset.x1-cw),ry=clamp(cy-ch/2,inset.y0,inset.y1-ch);
    let spot=null,usedVert=onSide,usedDir=0;
    const gap=4;
    /* стопка у правой кромки ровняется по правому краю: по левому краю первой
       фишки длинная соседка вылезала за экран (пара HUD 15/n, «Воркораде I · 1,4к») */
    const alX=a=>Math.abs(a.x+a.cw-inset.x1)<1?inset.x1-cw:a.x;
    if(stack&&stack.onSide===onSide){
      const x0=onSide?alX(stack):stack.x+stack.dir*(stack.cw/2+gap+cw/2);
      const y0=onSide?stack.y+stack.dir*(stack.ch/2+gap+ch/2):stack.y;
      const r=slide(onSide,x0,y0,cw,ch,stack.dir);
      if(r){spot=r;usedDir=stack.dir;}
    }
    if(!spot&&firstAnchor&&firstAnchor.onSide===onSide){
      const dir=-((stack&&stack.onSide===onSide&&stack.dir)||1);
      const x0=onSide?alX(firstAnchor):firstAnchor.x+dir*(firstAnchor.cw/2+gap+cw/2);
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
      const glide=()=>{
        const dist=Math.hypot(rx-st.x,ry-st.y);
        const maxStep=CHIP_SPEED*chipDt;
        if(dist<=maxStep||dist<.01){st.x=rx;st.y=ry;}
        else{st.x+=(rx-st.x)/dist*maxStep;st.y+=(ry-st.y)/dist*maxStep;}
      };
      /* не только «нет записи», но и «запись сломана» — испорченный кадр
       (NaN от чужого кода) иначе застревает в NaN навсегда: расстояние до
       NaN само NaN, а любое сравнение с NaN ложно, так что ни один из веток
       ниже никогда не выбирает «доехали» и лерп не сходится в принципе */
      if(!st||!isFinite(st.x)||!isFinite(st.y)){st={x:rx,y:ry,edge:targetEdge,fading:false,fadeT:0,fx:rx,fy:ry};CHIP_POS.set(m.k,st);}
      else if(st.fading){
        st.fadeT+=chipDt;
        const half=CHIP_FADE/2;
        if(st.fadeT<half){dcx=st.fx;dcy=st.fy;dcA=1-st.fadeT/half;}
        else{
          /* загоревшись у нового слота, плашка дальше ЕДЕТ за ним, а не стоит на нём: слот
             стопки на ходу сдвигается, и почти яркая плашка прыгала за ним (ворота прыжков) */
          if(!st.lit){st.lit=true;st.x=rx;st.y=ry;}else glide();
          dcx=st.x;dcy=st.y;dcA=Math.min(1,(st.fadeT-half)/half);
          if(st.fadeT>=CHIP_FADE){st.fading=false;st.lit=false;st.edge=targetEdge;dcA=1;}
        }
      }else if(st.edge!==targetEdge){
        st.fading=true;st.fadeT=0;st.fx=st.x;st.fy=st.y;
        dcx=st.fx;dcy=st.fy;dcA=1;
      }else{glide();dcx=st.x;dcy=st.y;dcA=1;}
    }
    CL.push({m,A,st:CHIP_POS.get(m.k),rx:dcx,ry:dcy,dcA,cw,ch,label,ang});
  }
  /* Ворота прыжков (долг §0): фишка кладётся и отодвигается в порядке КЛЮЧА, а не
     дальности — дальности двух целей пересекаются на ходу, и соседки менялись ролями
     «кто стоит, кто уступает»: уступавшая прыгала на полторы плашки за кадр */
  CL.sort((a,b)=>a.m.k<b.m.k?-1:a.m.k>b.m.k?1:0);
  for(const q of CL){
    const m=q.m,A=q.A,st=q.st,cw=q.cw,ch=q.ch,label=q.label,ang=q.ang;
    let rx=q.rx,ry=q.ry,dcA=q.dcA;
    const gap=4;
    /* нарисованные фишки не пересекаются (P1 6/n, Контроль 24.09, hb_pair): слоты
       разведены, но плашка едет к своему со скоростью CHIP_SPEED, и в пути ложилась
       на соседнюю — «ЦИЦИИН · 2092» поверх «ЗВЕЗДА · 846». Подошла к уже нарисованной
       ближе зазора — отодвигается вдоль своей кромки на наложение плюс зазор (у самой
       границы сдвиг ноль — без скачка); у края кадра — на другую сторону соседки */
    {
      const vert=chipEdge(rx,ry,cw,ch)<2;
      for(let pass=0;pass<3;pass++){
        let hit=false;
        for(const d of chipDrawn){
          if(rx+cw+gap<=d.x||d.x+d.w+gap<=rx||ry+ch+gap<=d.y||d.y+d.h+gap<=ry)continue;
          hit=true;
          const lo=vert?d.y-ch-gap:d.x-cw-gap,hi=vert?d.y+d.h+gap:d.x+d.w+gap;
          const me=vert?ry+ch/2:rx+cw/2,mid=vert?d.y+d.h/2:d.x+d.w/2;
          const a0=vert?inset.y0:inset.x0,a1=vert?inset.y1-ch:inset.x1-cw;
          let v=me>=mid?hi:lo;if(v<a0||v>a1)v=me>=mid?lo:hi;
          v=clamp(v,a0,a1);
          if(vert)ry=v;else rx=v;
        }
        if(!hit)break;
      }
      chipDrawn.push({x:rx,y:ry,w:cw,h:ch});
    }
    /* уступка на другую сторону соседки (или у края кадра) — это скачок на плашку: его
       не везут, а прячут, как смену кромки, — тухнет на старом месте, загорается на
       новом. Всё остальное фишка и так проходит не быстрее CHIP_SPEED */
    if(st){
      const lim=CHIP_SPEED*chipDt+1,half=CHIP_FADE/2,a0=dcA;
      if(st.jf){
        st.jf.t+=chipDt;
        if(st.jf.t>=CHIP_FADE)st.jf=null;
        else if(st.jf.t<half){rx=st.jf.x;ry=st.jf.y;dcA*=1-st.jf.t/half;}
        else dcA*=(st.jf.t-half)/half;
      }
      /* и загораясь после уступки, фишка может уступить снова — тогда прячется заново */
      if((!st.jf||st.jf.t>=half)&&st.px!=null&&dcA>=.5&&Math.hypot(rx-st.px,ry-st.py)>lim){
        st.jf={x:st.px,y:st.py,t:0};rx=st.px;ry=st.py;dcA=a0;
      }
      st.px=rx;st.py=ry;
    }
    const AA=A*dcA;
    /* Зона нажатия шире плашки: правило интерфейса требует 44 px на палец, а
       фишка ростом 16. Растим её вокруг центра, не трогая рисунок. Зона идёт
       за видимым местом (rx,ry уже сглажены), а не за логическим слотом —
       иначе палец бил бы мимо плашки во время подъезда или затухания. */
    if(m.t&&A===1&&dcA>.5){
      const PAD=Math.max(0,(CHIP_TOUCH-ch)/2);
      SYS_CHIPS.push({x:(rx-6)*U,y:(ry-PAD)*U,w:(cw+12)*U,h:(ch+PAD*2)*U,t:m.t,l:label,pl:[rx*U,ry*U,cw*U,ch*U]});
    }
    /* после перескока на соседнюю кромку точка луча и сама фишка расходятся:
       сторона надписи берётся по МЕСТУ фишки (P4) */
    const onRight=rx+cw/2>W/2;
    /* плашка, обвод, стрелка и подпись — DOM-фишка (08bh): место двигает композитор */
    chipDom(m.k,rx,ry,cw,ch,AA,m.c,label,onRight,ang,U);
  }
  /* цель пропала из кадра (тело за спиной, автопилот снят) — забыть её место,
     иначе через минуту чья-то новая фишка того же типа въедет с чужого края */
  for(const k of CHIP_POS.keys())if(!usedKeys[k])CHIP_POS.delete(k);
}
/* кольцо: half=-1 — дальняя дуга под планетой, half=1 — ближняя поверх неё */
