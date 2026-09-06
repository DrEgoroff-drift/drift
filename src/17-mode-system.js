/* ══════════════ режим: система ══════════════ */
/* Фишки компаса у кромки кадра, с их прямоугольниками и готовыми целями
   автопилота. Заполняется рисованием (drawSystem), читается тычком (15-input):
   метка, которая выглядит кнопкой, обязана быть кнопкой. Один массив на кадр,
   перезаписывается на месте — мусора не создаёт. */
const SYS_CHIPS=[];
function updateSystem(dt){
  const sh=G.ship,sys=G.sys,st=stat();
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
  const helm=apOn?null:helmApply(dt,st,sh,maxSp);
  sp=Math.hypot(sh.vx,sh.vy);
  if(sp>maxSp){sh.vx*=maxSp/sp;sh.vy*=maxSp/sp;sp=maxSp;}
  /* вектор скорости мягко доворачивается к носу — за счёт этого разворот
     получается дугой, а не вращением на месте с прежним курсом. Пока работают
     маневровые (боковой ход, реверс, Shift) — довода нет: скольжение не должно
     затягиваться под нос */
  if(sp>.08&&!apOn&&!(helm&&helm.thr)){
    const cur=Math.atan2(sh.vy,sh.vx);
    const na=cur+angDiff(sh.a,cur)*Math.min(1,.06*dt);
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
     держится — он уходит дугой и приходит обратно. Стоять на равновесии больше
     негде, потому что равновесия нет: сил, направленных против тяги, тут не
     осталось ни одной. */
  {
    const rEdge=(sys.belt?sys.belt.orbit:2400)*1.6;
    const d=Math.hypot(sh.x,sh.y)||1;
    if(d>rEdge){
      const k=clamp((d-rEdge)/700,0,1);
      const inward=Math.atan2(-sh.y,-sh.x);
      const turn=Math.min(1,.05*k*dt);
      sh.a+=angDiff(inward,sh.a)*turn;
      const vsp=Math.hypot(sh.vx,sh.vy);
      if(vsp>.001){
        const va=Math.atan2(sh.vy,sh.vx);
        const na=va+angDiff(inward,va)*turn;
        sh.vx=Math.cos(na)*vsp;sh.vy=Math.sin(na)*vsp;
      }
      atEdge=true;
      /* G.t растёт примерно на единицу в кадр — прежний интервал в 6 означал
         десяток одинаковых сообщений в секунду */
      if(!G.edgeWarned||G.t-G.edgeWarned>900){G.edgeWarned=G.t;
        say("ГРАВИТАЦИОННЫЙ ЯКОРЬ\nдальше корабль не уходит\nкурс к звезде свободен");}
    }
  }
  /* якорь режет скорость до шага, а не после — иначе корабль всё равно
     уползал бы за край по чуть-чуть каждый кадр */
  sh.x+=sh.vx*dt;sh.y+=sh.vy*dt;
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
    G.prompt="ПЕРЕГРЕВ КОРПУСА";
    if(G.hull<=0)wreck();
    return;
  }
  if(apOn)return;
  /* стрельбище (24d): пока идёт минута, подсказку держит оно */
  if(typeof rangeOn==="function"&&rangeOn()){rangeTick(dt);return;}
  G.prompt=atEdge?"ГРАВИТАЦИОННЫЙ ЯКОРЬ · КРАЙ СИСТЕМЫ\nКУРС К ЗВЕЗДЕ СВОБОДЕН":"";
  const hostile=G.pirates.filter(p=>p.aware).length;
  /* подсказка боя переписана под новое управление (M360a): пэда ОГОНЬ в
     системе больше нет, огонь — это захват. Две мысли — две строки, а не
     одна во всю ширину телефона: «что делать» и «можно не делать». */
  if(hostile){
    const stick=G.ctl&&G.ctl.src==="stick",got=G.marks&&G.marks.length;
    const how=got?"ЦЕЛЬ ВЗЯТА · ОГОНЬ САМ"
      :(stick?"ЦЕЛЬ ИЛИ ТЫЧОК ПО КОРПУСУ — ЗАХВАТ":"TAB ИЛИ ЩЕЛЧОК ПО КОРПУСУ — ЗАХВАТ");
    G.prompt=(st.armed?how:"ОРУДИЯ НЕТ")+"\nПРЕСЛЕДУЮТ: "+hostile+" · МОЖНО УЙТИ ИЛИ ПРЫГНУТЬ";
  }

  if(sys.station){
    const S=sys.station,ds=Math.hypot(sh.x-S.x,sh.y-S.y);
    /* ключ причала («Сорока», 12v-wander-shop): стыковка с любой точки системы */
    const keyOn=(typeof wanderHas==="function")&&wanderHas("key")&&ds<2600;
    if(ds<300||keyOn){
      if(ds<95||keyOn){
        if(sp>2.6)G.prompt="СБРОСЬТЕ СКОРОСТЬ · "+sp.toFixed(1)+"\nТОРМОЗ — ГАШЕНИЕ";
        else{
          G.prompt="ДЕЙСТВИЕ — СТЫКОВКА · "+S.kind.toUpperCase();
          if(actEdge)openStation();
        }
        return;
      }
      G.prompt=S.name.toUpperCase()+" · "+Math.round(ds)+" ед.";
    }
  }
  /* «Сорока» у освещённого края планеты (12v, M342): подход как к станции */
  if(typeof wanderNear==="function"){
    const wn=wanderNear(sh);
    if(wn){
      if(wn.close){
        if(sp>2.6)G.prompt="СБРОСЬТЕ СКОРОСТЬ · "+sp.toFixed(1)+"\nТОРМОЗ — ГАШЕНИЕ";
        else{G.prompt="ДЕЙСТВИЕ — К ТРАПУ «СОРОКИ»";if(actEdge)wanderDock();}
        return;
      }
      G.prompt="«СОРОКА» · "+Math.round(wn.ds)+" ед.";
    }
  }
  const B=sys.belt;
  if(B){
    const rr=Math.hypot(sh.x,sh.y);
    if(Math.abs(rr-B.orbit)<90){
      G.prompt="ДЕЙСТВИЕ — ВОЙТИ В "+B.name.toUpperCase()+"\nРУДА: "+B.res.map(k=>RES[k].ru).join(", ");
      if(actEdge){enterBelt();return;}
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
        G.prompt="ПИРАТСКАЯ БАЗА · "+PB.name.toUpperCase()+
          (withLetter?"\nДЕЙСТВИЕ — СЕСТЬ С ПИСЬМОМ · без оружия":"\nДЕЙСТВИЕ — АБОРДАЖ"+(st.armed?"":" (ОРУЖИЯ НЕТ)"));
        if(actEdge){if(withLetter)islandLand(PB);else enterRaid(PB);return;}
      }
    }
  }
  /* флот ГЛАВТРАССЫ: позывной, заправка по норме (12ai) */
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
        G.prompt="ГАЗОВЫЙ ГИГАНТ · ПОСАДКИ НЕТ\nДЕЙСТВИЕ — ЗАХОД ЗА ЛЕТУЧИМИ ГАЗАМИ";
        if(actEdge){startScoop(near);return;}
      }
      else if(!G.opts.easyLand&&sp>3.2)G.prompt="СЛИШКОМ БЫСТРО · "+sp.toFixed(1)+"\nТОРМОЗ — ГАШЕНИЕ";
      else{
        let ln="ДЕЙСТВИЕ — "+(G.opts.easyLand?"АВТО-ПОСАДКА":"ПОСАДКА")+" · "+near.name;
        if(G.tech.has("deep")&&near.res.length)
          ln+="\nНЕДРА: "+near.res.map(k=>RES[k].ru).join(", ");
        G.prompt=ln;
        if(actEdge){startLanding(near);return;}
      }
    }else if(!G.prompt)G.prompt=near.name+" · "+Math.round(nd)+" ед.";
    return;
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
  if(!G.prompt&&G.fuel<=0&&!(G.tech.has("synth")&&G.cargo.ice>0)){
    const cost=evacCost();
    G.prompt="ХОДА НЕТ · БАК ПУСТ\nДЕЙСТВИЕ — СИГНАЛ БЕДСТВИЯ · "+
      (G.credits>=cost?"БУКСИР "+cost+" КР":"ПЛАТИТЬ НЕЧЕМ");
    if(actEdge){evacuate();return;}
  }
  if(!G.prompt&&G.tech.has("synth")&&G.cargo.ice>0&&G.fuel<st.fuelMax){
    G.prompt="ДЕЙСТВИЕ — СИНТЕЗ ТОПЛИВА ИЗО ЛЬДА ("+G.cargo.ice+")";
    if(actEdge){
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
  const cx0=fc.x, cy0=fc.y;
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
  for(const p of sys.planets){
    const x=zx(p.x),y=zy(p.y),r=p.radius*Z;
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
    for(const m of p.moons){
      const mx=zx(m.x),my=zy(m.y),mr=Math.max(1,m.radius*Z);
      ctx.fillStyle="#9aa8b2";
      ctx.beginPath();ctx.arc(mx,my,mr,0,TAU);ctx.fill();
      if(G.ap&&G.ap.kind==="planet"&&G.ap.p===m)reticle(mx,my,mr+10);
      if(G.found.has(m.key)&&mr>2.4){
        ctx.fillStyle="rgba(154,168,178,.7)";ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
        ctx.fillText(m.name.toUpperCase(),mx,my+mr+11);
      }
    }
    if(G.found.has(p.key)){
      ctx.fillStyle="rgba(127,230,216,.55)";ctx.font="9px ui-monospace,monospace";ctx.textAlign="center";
      ctx.fillText(p.name.toUpperCase(),x,y+r+15);
    }
    if(G.ap&&G.ap.kind==="planet"&&G.ap.p===p)reticle(x,y,r+16);
  }
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
  if(typeof drawSysTraffic==="function")drawSysTraffic(zx,zy,Z);   /* челноки станции (M309) */
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
  ctx.scale(clamp(Z,.35,1.6),clamp(Z,.35,1.6));
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
  const feet=(typeof helmStickFoot==="function")?helmStickFoot():[];
  let scaleY=H-108;
  for(const f of feet)if(f.side==="L")scaleY=Math.min(scaleY,(f.y-f.r)/U-10);
  ctx.fillStyle="rgba(93,115,130,.75)";ctx.font="9px ui-monospace,monospace";ctx.textAlign="left";
  ctx.fillText("МАСШТАБ ×"+G.zoom.toFixed(2),14,Math.max(96,scaleY));
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
  const marks=[{x:0,y:0,c:"#f2b25c",l:"ЗВЕЗДА",t:{kind:"star"}}];
  if(sys.station)marks.push({x:sys.station.x,y:sys.station.y,c:"#7fe6d8",
    l:sys.station.name.toUpperCase(),t:{kind:"station"}});
  {
    let np=null,nd=1e18;
    for(const p of sys.planets){
      const d=Math.hypot(p.x-sh.x,p.y-sh.y);
      if(d<nd){nd=d;np=p;}
    }
    if(np)marks.push({x:np.x,y:np.y,c:"#9fd8ff",l:np.name.toUpperCase(),t:{kind:"planet",p:np}});
  }
  if(G.ap){const T=targetPos();if(T)marks.push({x:T.x,y:T.y,c:"#ff6b57",l:"ЦЕЛЬ",t:null});}
  SYS_CHIPS.length=0;
  /* фишки у кромки (M167): раньше метки стояли на круге и на телефоне висели
     посреди сцены, наезжая друг на друга и на солнце. Теперь метка — плашка,
     прижатая к краю прямоугольника кадра (с отступами под приборы и пульт),
     а наложение снимается сдвигом вдоль кромки. */
  /* нижняя кромка — над живой строкой подсказки, а не по константе: чип
     «ЗВЕЗДА» ложился ровно на «МОЖНО ПРОСТО УЙТИ ИЛИ ПРЫГНУТЬ» (полировочный
     круг). Меряем сам DOM (правило 27z: не пересчитывать CSS в JS). */
  let inY1=H-(innerWidth<=760?150:120);
  for(const f of feet)inY1=Math.min(inY1,(f.y-f.r)/U-10);
  {
    const pe=document.getElementById("prompt");
    if(pe&&pe.textContent){
      const r=pe.getBoundingClientRect();
      if(r.height>0)inY1=Math.min(inY1,r.top/U-8);
    }
  }
  const inset={x0:10,x1:W-10,y0:76,y1:Math.max(140,inY1)};
  const placed=[];
  ctx.font="8px ui-monospace,monospace";
  for(const m of marks){
    const x=zx(m.x),y=zy(m.y);
    if(x>-20&&x<W+20&&y>-20&&y<H+20)continue;
    const ang=Math.atan2(y-H/2,x-W/2),dx=Math.cos(ang),dy=Math.sin(ang);
    /* пересечение луча из центра с прямоугольником кромки */
    let t=1e9;
    if(dx>1e-6)t=Math.min(t,(inset.x1-W/2)/dx);if(dx<-1e-6)t=Math.min(t,(inset.x0-W/2)/dx);
    if(dy>1e-6)t=Math.min(t,(inset.y1-H/2)/dy);if(dy<-1e-6)t=Math.min(t,(inset.y0-H/2)/dy);
    let cx=W/2+dx*t,cy=H/2+dy*t;
    const label=m.l+" · "+Math.round(Math.hypot(m.x-sh.x,m.y-sh.y));
    const tw=ctx.measureText(label).width,cw=tw+26,ch=16;
    const onSide=Math.abs(cx-inset.x0)<1||Math.abs(cx-inset.x1)<1;   // боковая кромка → двигаем по y
    let rx=clamp(cx-(cx>W/2?cw-6:6),inset.x0,inset.x1-cw),ry=clamp(cy-ch/2,inset.y0,inset.y1-ch);
    /* авторазвод: пока пересекается с уже поставленной — шаг вдоль кромки */
    for(let g=0;g<12;g++){
      const hit=placed.find(p=>!(rx+cw<=p.x||p.x+p.w<=rx||ry+ch<=p.y||p.y+p.h<=ry));
      if(!hit)break;
      if(onSide)ry=ry+ch+4<=inset.y1-ch?ry+ch+4:inset.y0;else rx=rx+cw+4<=inset.x1-cw?rx+cw+4:inset.x0;
    }
    placed.push({x:rx,y:ry,w:cw,h:ch});
    /* Зона нажатия шире плашки: правило интерфейса требует 44 px на палец, а
       фишка ростом 16. Растим её вокруг центра, не трогая рисунок. */
    if(m.t){
      const PAD=Math.max(0,(44-ch)/2);
      SYS_CHIPS.push({x:(rx-6)*U,y:(ry-PAD)*U,w:(cw+12)*U,h:(ch+PAD*2)*U,t:m.t});
    }
    ctx.fillStyle="rgba(5,7,12,.72)";ctx.fillRect(rx,ry,cw,ch);
    ctx.strokeStyle=m.c;ctx.globalAlpha=.5;ctx.lineWidth=1;ctx.strokeRect(rx+.5,ry+.5,cw-1,ch-1);ctx.globalAlpha=1;
    ctx.save();ctx.translate(cx>W/2?rx+cw-8:rx+8,ry+ch/2);ctx.rotate(ang);
    ctx.fillStyle=m.c;ctx.beginPath();ctx.moveTo(6,0);ctx.lineTo(-4,4);ctx.lineTo(-4,-4);ctx.closePath();ctx.fill();
    ctx.restore();
    ctx.fillStyle=m.c;ctx.textAlign=cx>W/2?"right":"left";
    ctx.fillText(label,cx>W/2?rx+cw-18:rx+18,ry+12);
    ctx.textAlign="center";
  }
}
/* кольцо: half=-1 — дальняя дуга под планетой, half=1 — ближняя поверх неё */
