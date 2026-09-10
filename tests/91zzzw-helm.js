/* ══════════════ штурвал (M360) ══════════════
   Три ввода пишут одни каналы; системный режим читает только их. Здесь — то,
   что можно проверить без экрана: перевод `keys` в G.ctl, курс без инерции и
   без выбега, вектор тяги, правило отпускания на трёх шагах кадра, метки и
   автозахват, старые режимы по-прежнему на `keys`. */
function helmShip(){
  resetWorld();
  G.mode="system";
  G.ship.x=0;G.ship.y=-760;G.ship.vx=0;G.ship.vy=0;G.ship.a=0;G.ship.av=0;
  G.ap=null;G.orbit=null;G.pirates=[];G.shots=[];G.marks=[];G.fuel=100;
  for(const k in keys)keys[k]=false;
  HELM.key={};HELM.S=null;HELM.fade=null;HELM.home=null;HELM.src="keys";HELM.mouse.on=false;HELM.mouse.down=false;HELM.mouse.rmb=false;
  ctlReset();
  return G.ship;
}
function helmRun(n,dt){for(let i=0;i<n;i++){updateSystem(dt);G.t+=dt;}}
function helmPirate(x,y,aware){
  const p={x,y,vx:0,vy:0,a:0,hull:50,hullMax:50,name:"Т",rank:0,seed:1,shipId:"p1",cool:99,aware:!!aware,thrust:false};
  G.pirates.push(p);return p;
}

TEST_SUITES.push(()=>suite("штурвал: каждый ввод пишет те же каналы",()=>{
  const sh=helmShip();
  /* стрелки через keys (пэды, старые наборы) */
  keys.right=true;helmTick(1);
  eq(G.ctl.turn,1,"keys.right → turn=+1");
  ok(!G.ctl.headIdle,"рука на курсе — нос не свободен");
  keys.right=false;keys.thrust=true;helmTick(1);
  near(G.ctl.tx,1,1e-9,"keys.thrust → тяга по носу (a=0 → +x)");
  near(G.ctl.ty,0,1e-9,"…и без бока");
  keys.thrust=false;keys.brake=true;helmTick(1);
  ok(G.ctl.brake,"keys.brake → brake");
  keys.brake=false;
  /* сырые стрелки: Q/E — бок */
  HELM.key.KeyE=true;helmTick(1);
  near(G.ctl.ty,1,1e-9,"E → бок вправо от носа");
  HELM.key.KeyE=false;keys.brake=true;helmTick(1);
  ok(G.ctl.brake&&!G.ctl.tx,"S/↓ → тормоз, не реверс (M436)");
  keys.brake=false;
  /* мышь (M436): нос за курсором только при зажатой ПКМ, и тогда A/D — бок */
  HELM.mouse.on=true;HELM.mouse.x=W/2;HELM.mouse.y=H/2-200;
  keys.right=true;helmTick(1);
  eq(G.ctl.turn,1,"без ПКМ мышь молчит: D — руль");
  ok(G.ctl.head==null,"…и курсор нос не ведёт");
  HELM.mouse.rmb=true;helmTick(1);
  near(G.ctl.head,-Math.PI/2,1e-6,"ПКМ зажата: курсор над кораблём → курс вверх");
  ok(!G.ctl.headIdle,"рука на курсоре — метка нос не перебьёт");
  eq(G.ctl.turn,0,"руль занят курсором…");
  near(G.ctl.ty,1,1e-9,"…и D стал боком вправо от носа");
  keys.right=false;HELM.mouse.rmb=false;
  HELM.key.ShiftLeft=true;keys.thrust=true;helmTick(1);
  ok(G.ctl.thrOnly,"Shift — всё через маневровые");
  keys.thrust=false;HELM.key={};HELM.mouse.on=false;
  /* стик (M410): один, задаёт СКОРОСТЬ в осях экрана; нос — по ходу, метка перебьёт */
  HELM.src="stick";HELM.S={id:1,x0:100,y0:400,x:100,y:300};helmTick(1);
  ok(G.ctl.assist,"стик включает помощь");
  near(G.ctl.ay,-1,1e-6,"стик вверх на полный ход → ay=−1");
  near(G.ctl.head,-Math.PI/2,1e-6,"…и нос по ходу: вверх");
  ok(G.ctl.headIdle,"рука на курсе не лежит — метка перебьёт нос");
  HELM.S={id:1,x0:100,y0:400,x:100+12+35,y:400};helmTick(1);
  near(G.ctl.ax,.5,1e-6,"полхода → .5");
  HELM.S={id:1,x0:100,y0:400,x:106,y:400};helmTick(1);
  ok(!G.ctl.assist&&G.ctl.brake,"в мёртвой зоне 12 px — «стой»: тормоз без кнопки");
  HELM.S=null;
  ok(sh===G.ship,"корабль тот же");
}));

TEST_SUITES.push(()=>suite("штурвал: курс без инерции и без выбега",()=>{
  const sh=helmShip(),st=stat();
  const RATE=.038*st.turn;
  keys.right=true;helmRun(10,1);
  near(sh.a,RATE*10,1e-6,"десять кадров руля — ровно десять шагов, без разгона");
  keys.right=false;
  const a1=sh.a;helmRun(30,1);
  near(sh.a,a1,1e-9,"отпустил — нос стоит, выбега нет");
  /* к заданному курсу: не перелетает */
  HELM.mouse.on=true;HELM.mouse.rmb=true;HELM.mouse.x=W/2+300;HELM.mouse.y=H/2;
  sh.a=1;helmRun(120,1);
  near(sh.a,0,1e-6,"нос доходит до курсора и останавливается на нём");
  /* шаг кадра: за то же время тот же угол */
  HELM.mouse.rmb=false;HELM.mouse.on=false;
  for(const dt of PHYS_DT){sh.a=0;keys.left=true;helmRun(Math.round(30/dt),dt);keys.left=false;
    near(sh.a,-RATE*30,1e-6,"dt="+dt+": угол за 30 кадров не зависит от шага");}
  /* крен — от фактического поворота */
  keys.right=true;helmRun(20,1);
  ok(sh.bank>0,"крен вправо при повороте вправо: "+sh.bank.toFixed(2));
  keys.right=false;
}));

TEST_SUITES.push(()=>suite("штурвал: вектор тяги и правило отпускания",()=>{
  const sh=helmShip(),st=stat();
  const maxSp=6.4+st.thr*1.6;
  /* бок — .4 маршевой и без довода к носу */
  HELM.key.KeyE=true;const f0=G.fuel;helmRun(30,1);HELM.key.KeyE=false;
  near(sh.vy,.082*st.thr*.4*30,.05,"бок: .4 маршевой за 30 кадров");
  ok(Math.abs(sh.vx)<.02,"и нос никуда не тянет: vx="+sh.vx.toFixed(3));
  ok(G.fuel<f0,"маневровые жгут топливо");
  /* S / ТОРМОЗ — до нуля, ходом HELM_STOP, на любой скорости (M436) */
  for(const dt of PHYS_DT){
    helmShip();G.ship.vx=maxSp*.4;G.ship.vy=0;keys.brake=true;
    let prev=Math.hypot(G.ship.vx,G.ship.vy),grew=0;
    for(let i=0;i<200/dt;i++){updateSystem(dt);G.t+=dt;const s=Math.hypot(G.ship.vx,G.ship.vy);if(s>prev+1e-9)grew++;prev=s;}
    keys.brake=false;
    eq(grew,0,"dt="+dt+": торможение монотонно");
    eq(Math.hypot(G.ship.vx,G.ship.vy),0,"dt="+dt+": корабль встал");
  }
  helmShip();G.ship.vx=maxSp;keys.brake=true;helmRun(120,1);keys.brake=false;
  eq(Math.hypot(G.ship.vx,G.ship.vy),0,"с крейсерской S останавливает за две секунды");
  /* отпустил — накат на любой скорости: правило .55 ушло (M436) */
  for(const dt of PHYS_DT)for(const k of [.3,.9]){
    helmShip();G.ship.vx=maxSp*k;const v0=G.ship.vx,fu=G.fuel;
    helmRun(Math.round(60/dt),dt);
    near(Math.hypot(G.ship.vx,G.ship.vy),v0,1e-6,"dt="+dt+", "+k+" крейсерской: отпустил — накат");
    eq(G.fuel,fu,"dt="+dt+": и топливо не горит");
  }
  /* ↓ — тормоз, не реверс: на месте корабль стоит */
  helmShip();keys.brake=true;helmRun(30,1);keys.brake=false;
  eq(Math.hypot(G.ship.vx,G.ship.vy),0,"↓ на месте — стоит, реверса нет");
}));

TEST_SUITES.push(()=>suite("штурвал: метки, автозахват, ракета к метке",{tier:"browser"},()=>{
  helmShip();
  const a=helmPirate(300,-760,true),b=helmPirate(600,-760,true),c=helmPirate(900,-760,true),d=helmPirate(1200,-760,true);
  ok(helmLockNext(),"Tab берёт ближайшего");
  eq(G.marks[0],a,"…это ближайший");
  helmLockNext();eq(G.marks[0],b,"ещё Tab — следующий по кругу");
  helmLock(c);helmLock(d);
  eq(G.marks.length,3,"меток не больше трёх");
  eq(G.marks[0],d,"последний захват — первый");
  /* нос идёт за меткой, когда рука снята */
  helmTick(1);
  ok(G.ctl.headIdle&&G.ctl.head!=null,"рука снята — курс на метку");
  keys.left=true;helmTick(1);
  ok(!G.ctl.headIdle,"руль в руке — за меткой не идёт");
  keys.left=false;
  /* мёртвая метка уходит */
  d.hull=0;helmTick(1);
  ok(!G.marks.includes(d),"сбитый выпадает из меток");
  /* iff — не цель */
  const f=helmPirate(100,-760,true);f.iff=true;G.marks.length=0;helmLockNext();
  ok(G.marks[0]!==f,"iff:true в захват не берётся");
  /* автозахват стрелявшего */
  G.marks.length=0;helmShotAt(b);
  eq(G.marks[0],b,"стрелявший встаёт в захват сам");
  helmShotAt(c);eq(G.marks[0],b,"…но не выталкивает уже взятую");
  /* автоогонь: метка в конусе и в дальности → выстрел без огня */
  G.marks.length=0;G.marks.push(a);G.mods.weapon=1;G.shots=[];fireCool=0;G.ship.a=0;
  for(const k in keys)keys[k]=false;
  updateCombat(1);
  ok(G.shots.some(s=>s.mine),"пушка выстрелила сама по метке в конусе");
  G.shots=[];G.marks.length=0;fireCool=0;updateCombat(1);
  ok(!G.shots.some(s=>s.mine),"без метки и без ОГНЯ — тишина");
  /* метка за спиной — не в конусе: сама пушка молчит (M360a) */
  G.marks.length=0;G.marks.push(a);G.ship.a=Math.PI;G.shots=[];fireCool=0;updateCombat(1);
  ok(!G.shots.some(s=>s.mine),"метка за спиной — автоогня нет");
  /* и слишком далеко — тоже молчит */
  G.ship.a=0;a.x=G.ship.x+HELM_RANGE+400;G.shots=[];fireCool=0;updateCombat(1);
  ok(!G.shots.some(s=>s.mine),"метка дальше "+HELM_RANGE+" — автоогня нет");
  a.x=G.ship.x+300;
  /* ЛКМ мышиной схемы: канал G.ctl.fire бьёт по носу без всякой метки.
     До M360a этот канал никто не читал, и левая кнопка мыши не стреляла */
  G.marks.length=0;G.shots=[];fireCool=0;
  for(const k in keys)keys[k]=false;
  G.ctl.fire=true;updateCombat(1);G.ctl.fire=false;
  ok(G.shots.some(s=>s.mine),"ЛКМ — принудительный выстрел по носу");
  /* G — ракета, тем же каналом (ПКМ теперь ведёт нос, M436) */
  G.cargo.missile=2;G.mslCool=0;G.msl=[];G.mods.launcher=1;
  G.ctl.msl=true;updateCombat(1);G.ctl.msl=false;
  ok((G.msl||[]).length>0||(G.mslCool||0)>0,"G — пусковая отработала");
  G.mods.weapon=0;G.mods.launcher=0;G.msl=[];G.cargo.missile=0;
}));

/* ── один палец (M410) ──
   Стик говорит не «жми», а «лети»: его вектор — скорость, тягу подбирает
   физика. Проверяется то, что обещано автору: летит туда, куда тянут; набрал —
   держит и не жжёт; полхода — полскорости; палец на месте — стоит; с меткой
   нос на ней, а ход — куда тянут. */
TEST_SUITES.push(()=>suite("штурвал M410: стик задаёт ход, нос идёт за меткой",{tier:"browser"},()=>{
  const sh=helmShip(),st=stat();
  const maxSp=6.4+st.thr*1.6;
  HELM.src="stick";HELM.S={id:1,x0:100,y0:400,x:100+12+70,y:400};
  helmRun(240,1);
  const sp=Math.hypot(sh.vx,sh.vy);
  ok(sp>maxSp*.9&&sp<=maxSp+1e-6,"за четыре секунды набрана крейсерская: "+sp.toFixed(2)+" из "+maxSp.toFixed(2));
  ok(Math.abs(Math.atan2(sh.vy,sh.vx))<.05,"и летит туда, куда тянут: угол "+Math.atan2(sh.vy,sh.vx).toFixed(3));
  ok(Math.abs(angWrap(sh.a))<.05,"нос по ходу: "+angWrap(sh.a).toFixed(3));
  /* держать — не жечь */
  const f0=G.fuel;helmRun(60,1);
  ok(!G.ctl.out.main&&!G.ctl.out.thr,"скорость набрана — двигатели молчат");
  eq(G.fuel,f0,"и топливо не горит");
  /* полхода — полскорости, без перелёта */
  HELM.S={id:1,x0:100,y0:400,x:100+12+35,y:400};
  helmRun(240,1);
  near(Math.hypot(sh.vx,sh.vy),maxSp*.5,maxSp*.06,"полхода стика — половина крейсерской: "+Math.hypot(sh.vx,sh.vy).toFixed(2));
  /* палец в мёртвой зоне — стоп */
  HELM.S={id:1,x0:100,y0:400,x:102,y:400};
  helmRun(300,1);
  eq(Math.hypot(sh.vx,sh.vy),0,"палец на месте — корабль встал");
  /* отпустил на ходу выше .55 — накат, как у всех вводов */
  HELM.S={id:1,x0:100,y0:400,x:182,y:400};helmRun(240,1);
  HELM.S=null;const v0=Math.hypot(sh.vx,sh.vy);helmRun(60,1);
  near(Math.hypot(sh.vx,sh.vy),v0,1e-6,"отпустил выше .55 — накат");
  /* с меткой: нос на неё, ход — куда тянут. Мишень немая (dummy): бой
     здесь не проверяется, проверяется штурвал */
  helmShip();
  const p=helmPirate(0,-760-500,false);p.dummy=1;
  G.marks.push(p);
  HELM.src="stick";HELM.S={id:1,x0:100,y0:400,x:100+12+70,y:400};
  helmRun(240,1);
  /* корабль за четыре секунды ушёл вправо, и метка теперь слева-сверху:
     нос обязан быть на ней, где бы она ни оказалась, а не «вверху» */
  const want=Math.atan2(p.y-G.ship.y,p.x-G.ship.x);
  ok(Math.abs(angDiff(want,G.ship.a))<.08,"нос на метке: "+G.ship.a.toFixed(2)+" при цели "+want.toFixed(2));
  const ang=Math.atan2(G.ship.vy,G.ship.vx);
  ok(Math.abs(ang)<.25,"а летит вправо, куда тянут: "+ang.toFixed(2));
  ok(Math.hypot(G.ship.vx,G.ship.vy)>maxSp*.35,"бортом медленнее, но идёт: "+Math.hypot(G.ship.vx,G.ship.vy).toFixed(2));
  HELM.S=null;
  ok(!keys.thrust&&!keys.brake&&!keys.left,"keys стик не трогает");
  /* след и точка покоя: один стик — один след; без стика у рисунка есть место */
  HELM.S={id:1,x0:100,y0:400,x:150,y:400};
  ok(helmStickFoot().length>=1,"у живого стика есть след");
  HELM.S=null;HELM.home=null;
  const h=helmHome();
  ok(h.x<W/2&&h.y>H/2,"точка покоя — внизу слева: "+Math.round(h.x)+","+Math.round(h.y));
}));

TEST_SUITES.push(()=>suite("штурвал: другие режимы по-прежнему на keys (D08)",()=>{
  const src=[["24-mode-belt","belt"],["19-mode-landing","landing"],["19a-mode-scoop","scoop"]];
  ok(typeof updateBelt==="function","пояс на месте");
  ok(typeof updateLanding==="function","и заход");
  /* helmTick не трогает keys и не пишет чужие поля */
  helmShip();keys.pup=true;helmTick(1);
  ok(keys.pup,"keys.pup не тронут");
  ok(!("pup" in G.ctl),"в G.ctl нет чужих каналов");
  keys.pup=false;
  ok(src.length===3,"список для чтения глазами");
}));

/* ── палец где угодно (M422) ──
   Проверяется ровно то, что обещано автору: стик рождается на любой половине,
   центр бежит за пальцем (обратный ход стоит одинаково), «коротко назад» —
   это тормоз и он не медленнее мёртвой зоны, нос на торможении не крутится,
   отпущенный палец не тормозит сам, камера уводит корабль из-под пальца. */
TEST_SUITES.push(()=>suite("штурвал M422: палец где угодно, назад — тормоз",{tier:"browser"},()=>{
  helmShip();const st=stat();
  const maxSp=6.4+st.thr*1.6,LIM=HELM_DEAD+HELM_REACH;
  /* 1. тычок остаётся тычком, а полежавший палец становится стиком — и справа */
  HELM.S=null;HELM.P={id:7,x0:W-40,y0:60,x:W-40,y:60,t0:now()};
  helmTick(1);
  ok(!HELM.S,"свежий палец — ещё тычок, а не стик");
  HELM.P.t0=now()-HELM_TAKE_MS-10;
  helmTick(1);
  ok(HELM.S&&HELM.S.x0===W-40,"полежал дольше окна тапа — стик, и на ПРАВОЙ половине");
  ok(!HELM.P,"ждущий палец снят");
  ok(G.ctl.brake,"…и он стоит в мёртвой зоне: это «стой»");
  HELM.S=null;
  /* 2. центр бежит за пальцем: как далеко ни веди, обратный ход один */
  const s={x0:100,y0:400,x:900,y:400};
  helmDrag(s);
  near(s.x0,900-LIM,1e-9,"центр подтянулся за пальцем на полный ход");
  s.x-=LIM+HELM_DEAD+1;helmDrag(s);
  ok(s.x-s.x0<-HELM_DEAD,"…и обратный ход в "+(LIM+HELM_DEAD+1)+" px уже даёт задний ход");
  /* 3. «коротко назад» тормозит, и не медленнее мёртвой зоны */
  const stopIn=(back)=>{
    helmShip();HELM.src="stick";
    G.ship.vx=maxSp;G.ship.vy=0;G.ship.a=0;
    HELM.S={id:1,x0:400,y0:400,x:400-(back?LIM:0),y:400};
    let n=0;
    while(Math.hypot(G.ship.vx,G.ship.vy)>0&&n<600){updateSystem(1);G.t+=1;n++;}
    return n;
  };
  const nBack=stopIn(true),nDead=stopIn(false);
  ok(nBack<=110,"назад — полная остановка за "+nBack+" кадров (было ~244)");
  ok(nBack<=nDead+2,"…и не медленнее мёртвой зоны ("+nDead+"): один корабль, а не два");
  /* 4. нос на торможении стоит по ходу, а не разворачивается на 180° */
  helmShip();HELM.src="stick";
  G.ship.vx=maxSp;G.ship.a=0;
  HELM.S={id:1,x0:400,y0:400,x:400-LIM,y:400};
  helmRun(30,1);
  ok(G.ctl.slow,"тяга против хода — это торможение");
  ok(Math.abs(angWrap(G.ship.a))<.05,"нос не крутится: "+angWrap(G.ship.a).toFixed(3));
  ok(G.ctl.out.slow&&!G.ctl.out.main,"маршевый на торможении молчит");
  /* 5. пустая энергия тормоз не отнимает, а топливо на него тратится */
  helmShip();HELM.src="stick";
  G.ship.vx=maxSp;G.ship.a=0;G.energy=0;const fu=G.fuel;
  HELM.S={id:1,x0:400,y0:400,x:400-LIM,y:400};
  helmRun(40,1);
  ok(Math.hypot(G.ship.vx,G.ship.vy)<maxSp*.6,"с пустой энергией тормоз работает в полную");
  ok(G.fuel<fu,"и топливо на него тратится, а не прибывает");
  /* 6. отпустил — накат на любой скорости (правила .55 больше нет ни у кого — M436) */
  helmShip();HELM.src="stick";HELM.S=null;
  G.ship.vx=maxSp*.3;const v0=G.ship.vx;
  helmRun(60,1);
  near(G.ship.vx,v0,1e-6,"стик отпущен ниже .55 — всё равно накат");
  HELM.src="keys";
  helmShip();G.ship.vx=maxSp*.3;
  helmRun(60,1);
  near(G.ship.vx,maxSp*.3,1e-6,"и клавишам тот же накат: тормоз — только S (M436)");
  /* 7. камера уводит корабль из-под пальца и возвращает его */
  HELM.S=null;HELM.cam={x:0,y:0,dx:0,dy:1};
  let o=helmCamOff(1);
  near(o.y,0,1e-9,"без пальца камера стоит на месте");
  HELM.S={id:1,x0:W/2,y0:H/2+20,x:W/2,y:H/2+20};
  for(let i=0;i<200;i++)o=helmCamOff(1);
  ok(o.y>10&&o.y<=HELM_NUDGE,"палец поверх корабля — камера увела: "+o.y.toFixed(1)+" px");
  HELM.S=null;
  for(let i=0;i<200;i++)o=helmCamOff(1);
  near(o.y,0,.5,"палец снят — камера вернулась");
  /* 8. след стика укладывается в свой же радиус */
  HELM.S={id:1,x0:200,y0:300,x:200+LIM,y:300};
  const f=helmStickFoot();
  ok(f.length>=2,"след — капсула вдоль ленты, а не круг: "+f.length);
  const last=f[f.length-1];
  ok(Math.hypot(HELM.S.x-last.x,HELM.S.y-last.y)<1e-6,"последний кружок стоит на пальце");
  ok(f.every((c,i)=>i===0||Math.hypot(c.x-f[i-1].x,c.y-f[i-1].y)<=c.r),"кружки перекрываются: под лентой дыр нет");
  HELM.S=null;HELM.trail=[];
}));
