/* ══════════════ режим: система ══════════════ */
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
  if(G.orbit&&(keys.thrust||keys.brake||keys.left||keys.right))G.orbit=null;
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
  if(!apOn){
    /* угловая инерция: рули набирают и сбрасывают скорость поворота,
       поэтому корабль выписывает дугу, а не щёлкает на месте */
    const acc=.006*st.turn*dt, lim=.038*st.turn;
    if(keys.left)sh.av-=acc;
    if(keys.right)sh.av+=acc;
    if(!keys.left&&!keys.right)sh.av*=Math.pow(.9,dt);
    sh.av=clamp(sh.av,-lim,lim);
    /* курс сворачиваем сразу: за долгий полёт он копится оборотами, а всё, что
       считается от него, живёт в пределах полуоборота */
    sh.a=angWrap(sh.a+sh.av*dt);
    if(keys.thrust&&G.fuel>0){
      sh.vx+=Math.cos(sh.a)*.082*st.thr*dt;
      sh.vy+=Math.sin(sh.a)*.082*st.thr*dt;
      G.fuel=Math.max(0,G.fuel-.021*dt);
    }
    if(keys.brake&&G.fuel>0){
      const sp0=Math.hypot(sh.vx,sh.vy);
      if(sp0>.03){
        const dec=Math.min(sp0,.058*st.thr*dt);
        sh.vx-=sh.vx/sp0*dec;sh.vy-=sh.vy/sp0*dec;
        G.fuel=Math.max(0,G.fuel-.017*dt);
        /* корабль больше не разворачивается кормой к курсу: тормозят носовые
           маневровые, курс остаётся тем, который держит игрок. Разворот на
           торможении сбивал прицел и читался как потеря управления — а тяга
           у маневровых и так меньше маршевой, так что цена честная. */
      /* добивание до нуля — только когда тяга отпущена: иначе тормоз каждый кадр
         съедает едва набранный разгон и корабль не трогается с места */
      }else if(!keys.thrust){sh.vx=0;sh.vy=0;}
    }
  }
  const maxSp=6.4+st.thr*1.6;
  sp=Math.hypot(sh.vx,sh.vy);
  if(sp>maxSp){sh.vx*=maxSp/sp;sh.vy*=maxSp/sp;sp=maxSp;}
  /* вектор скорости мягко доворачивается к носу — за счёт этого разворот
     получается дугой, а не вращением на месте с прежним курсом */
  if(sp>.08&&!apOn){
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
  sh.bank+=(clamp(rate*13,-.8,.8)-sh.bank)*Math.min(1,.07*dt);
  trailStep(dt,G.fuel>0&&(keys.thrust||apOn),!apOn&&(keys.left||keys.right),
    !apOn&&keys.brake&&G.fuel>0&&sp>.03);
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
    sh.vx+=sh.x/d0*.22*dt;sh.vy+=sh.y/d0*.22*dt;
    G.prompt="ПЕРЕГРЕВ КОРПУСА";
    if(G.hull<=0)wreck();
    return;
  }
  if(apOn)return;
  G.prompt=atEdge?"ГРАВИТАЦИОННЫЙ ЯКОРЬ · КРАЙ СИСТЕМЫ\nКУРС К ЗВЕЗДЕ СВОБОДЕН":"";
  const hostile=G.pirates.filter(p=>p.aware).length;
  if(hostile)G.prompt=(st.armed?"ОГОНЬ — ОТСТРЕЛИВАТЬСЯ":"ОРУДИЯ НЕТ")+
    " · ПРЕСЛЕДУЮТ: "+hostile+"\nМОЖНО ПРОСТО УЙТИ ИЛИ ПРЫГНУТЬ";

  if(sys.station){
    const S=sys.station,ds=Math.hypot(sh.x-S.x,sh.y-S.y);
    if(ds<300){
      if(ds<95){
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
        G.prompt="ПИРАТСКАЯ БАЗА · "+PB.name.toUpperCase()+
          "\nДЕЙСТВИЕ — АБОРДАЖ"+(st.armed?"":" (ОРУЖИЯ НЕТ)");
        if(actEdge){enterRaid(PB);return;}
      }
    }
  }
  /* торговая баржа — к ней можно подойти и сторговаться без стыковки (12l) */
  if(typeof bargeInteract==="function"&&bargeInteract(sh))return;
  /* остов погибшей баржи — обыскать ровно раз (12l) */
  if(typeof wreckInteract==="function"&&wreckInteract(sh))return;
  /* находка в пустоте: капсула, спутник, контейнер, остов разведчика (17b) */
  if(typeof findInteract==="function"&&findInteract(sh))return;
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
function drawSystem(){
  const sh=G.ship,sys=G.sys,Z=G.zoom;
  /* режим наблюдения за наёмником: двигается только камера, корабль игрока
     продолжает лететь сам по себе и остаётся видимым на своём месте */
  const wA=G.watch?allyOf(G.watch):null;
  /* камера отстаёт от корабля и подрагивает на разгоне (16a-space): без этого
     корабль движется как курсор мыши, а не как масса с двигателем.
     В режиме наблюдения сглаживание не нужно — там камера и так не игрока. */
  const spd=Math.hypot(sh.vx,sh.vy);
  const thrusting=(keys.thrust||!!G.ap)&&G.fuel>0;
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
  for(const p of sys.planets){ctx.strokeStyle="rgba(120,190,210,"+(.17*clamp(1-p.orbit*Z/(W*1.6),.3,1)).toFixed(3)+")";ctx.beginPath();ctx.arc(ox,oy,p.orbit*Z,0,TAU);ctx.stroke();}
  if(sys.station){ctx.strokeStyle="rgba(242,178,92,.13)";
    ctx.beginPath();ctx.arc(ox,oy,sys.station.orbit*Z,0,TAU);ctx.stroke();}
  if(sys.belt)drawBeltRing(ox,oy,sys.belt,Z);
  const R=sys.radius*Z;
  /* светило по своему типу: двойная, красный гигант, белый карлик, нейтронная,
     редко чёрная дыра (16a-space). Освещение и опасность по-прежнему считаются
     от sys.cls — экзотика меняет только вид. */
  drawStarBody(ox,oy,R,sys);
  /* светило за кадром: его зарево всё равно входит в кадр со своей стороны —
     иначе системный вид без звезды выглядел экраном загрузки (G10) */
  {const dx=ox<0?-ox:(ox>W?ox-W:0), dy=oy<0?-oy:(oy>H?oy-H:0), dd=Math.hypot(dx,dy);
   if(dd>0){const col=sys.cls.col,c=hex2rgb(col);
     const BL=glowSprite("bleed|"+col,()=>{const g=ctx.createRadialGradient(0,0,0,0,0,1);
       g.addColorStop(0,"rgba("+c.join(",")+",.34)");g.addColorStop(.5,"rgba("+c.join(",")+",.10)");g.addColorStop(1,"rgba(0,0,0,0)");
       ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);});
     ctx.save();ctx.globalCompositeOperation="lighter";glowBlit(BL,ox,oy,dd+Math.max(W,H)*.55);ctx.restore();}}
  /* эллиптическая орбита — тонкий контур по формуле Кеплера, не окружность.
     Сорок девять точек эллипса не меняются никогда: орбита, эксцентриситет и
     наклон большой оси заданы при рождении системы. Считать их заново каждый
     кадр — двести вызовов Кеплера в секунду на четыре планеты; поэтому кольцо
     считается один раз и лежит на самой планете, а в кадре остаётся только
     перевод в экранные координаты. */
  ctx.strokeStyle="rgba(120,190,210,.08)";ctx.lineWidth=1;
  for(const p of sys.planets){
    let O=p._orbPath;
    if(!O){
      O=p._orbPath=new Float64Array(98);
      for(let k=0;k<=48;k++){
        const pos=keplerPos(p.orbit,p.ecc,k/48*TAU,p.argp);
        O[k*2]=pos.x;O[k*2+1]=pos.y;
      }
    }
    ctx.beginPath();
    ctx.moveTo(zx(O[0]),zy(O[1]));
    for(let k=1;k<=48;k++)ctx.lineTo(zx(O[k*2]),zy(O[k*2+1]));
    ctx.stroke();
  }
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
  drawCombat(zx,zy,Z);
  if(typeof drawWrecksSystem==="function")drawWrecksSystem(zx,zy,Z);
  if(typeof drawFindsSystem==="function")drawFindsSystem(zx,zy,Z);
  if(typeof drawBarges==="function")drawBarges(zx,zy,Z);
  drawAllies(zx,zy,Z);
  drawPirateBase(zx,zy,Z);
  ctx.save();ctx.translate(zx(sh.x),zy(sh.y));ctx.rotate(sh.a);
  ctx.scale(clamp(Z,.55,1.6),clamp(Z,.55,1.6));
  drawHull(G.shipId,keys.thrust&&G.fuel>0||(G.ap&&G.fuel>0),keys.brake&&G.fuel>0,G.mods.engine,sh.bank);
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
  /* масштаб — над пэдом, а не под ним: внизу слева его закрывал руль */
  ctx.fillStyle="rgba(93,115,130,.75)";ctx.font="9px ui-monospace,monospace";ctx.textAlign="left";
  ctx.fillText("МАСШТАБ ×"+G.zoom.toFixed(2),14,H-108);
  /* компас на край экрана: звезда, станция и текущая цель автопилота,
     если они за кадром — чтобы в бесконечном космосе нельзя было заблудиться */
  const marks=[{x:0,y:0,c:"#f2b25c",l:"ЗВЕЗДА"}];
  if(sys.station)marks.push({x:sys.station.x,y:sys.station.y,c:"#7fe6d8",l:sys.station.name.toUpperCase()});
  if(G.ap){const T=targetPos();if(T)marks.push({x:T.x,y:T.y,c:"#ff6b57",l:"ЦЕЛЬ"});}
  for(const m of marks){
    const x=zx(m.x),y=zy(m.y);
    if(x>-20&&x<W+20&&y>-20&&y<H+20)continue;
    const ang=Math.atan2(y-H/2,x-W/2);
    const cx=W/2+Math.cos(ang)*(Math.min(W,H)/2-30),cy=H/2+Math.sin(ang)*(Math.min(W,H)/2-30);
    ctx.save();ctx.translate(cx,cy);ctx.rotate(ang);
    ctx.fillStyle=m.c;ctx.globalAlpha=.85;
    ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(-6,6);ctx.lineTo(-6,-6);ctx.closePath();ctx.fill();
    ctx.restore();
    ctx.globalAlpha=1;ctx.fillStyle=m.c;ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
    ctx.fillText(m.l+" · "+Math.round(Math.hypot(m.x-sh.x,m.y-sh.y)),cx,cy+(ang>0?16:-10));
  }
}
/* кольцо: half=-1 — дальняя дуга под планетой, half=1 — ближняя поверх неё */
