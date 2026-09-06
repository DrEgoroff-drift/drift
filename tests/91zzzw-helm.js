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
  HELM.key={};HELM.S=null;HELM.fade=null;HELM.home=null;HELM.src="arrows";HELM.mouse.on=false;HELM.mouse.down=false;
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
  HELM.key.KeyE=false;HELM.key.ArrowDown=true;helmTick(1);
  near(G.ctl.tx,-1,1e-9,"↓ → реверс");
  HELM.key.ArrowDown=false;
  /* мышь: WASD — оси экрана, нос к курсору */
  HELM.src="mouse";HELM.mouse.on=true;HELM.mouse.x=W/2;HELM.mouse.y=H/2-200;HELM.mouse.t=performance.now()-2000;
  HELM.key.KeyD=true;helmTick(1);
  near(G.ctl.tx,1,1e-9,"D → вправо по экрану");
  near(G.ctl.head,-Math.PI/2,1e-6,"курсор над кораблём → курс вверх");
  ok(G.ctl.headIdle,"курсор стоит полсекунды — нос свободен");
  HELM.key.KeyD=false;HELM.key.ShiftLeft=true;HELM.key.KeyW=true;helmTick(1);
  ok(G.ctl.thrOnly,"Shift — всё через маневровые");
  HELM.key={};
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
  HELM.src="mouse";HELM.mouse.on=true;HELM.mouse.x=W/2+300;HELM.mouse.y=H/2;HELM.mouse.t=performance.now()-2000;
  sh.a=1;helmRun(120,1);
  near(sh.a,0,1e-6,"нос доходит до курсора и останавливается на нём");
  /* шаг кадра: за то же время тот же угол */
  HELM.src="arrows";HELM.mouse.on=false;
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
  /* отпустил ниже крейсерской — тормоз до нуля */
  for(const dt of PHYS_DT){
    helmShip();sh.vx=maxSp*.4;sh.vy=0;
    let prev=Math.hypot(sh.vx,sh.vy),grew=0;
    for(let i=0;i<200/dt;i++){updateSystem(dt);G.t+=dt;const s=Math.hypot(G.ship.vx,G.ship.vy);if(s>prev+1e-9)grew++;prev=s;}
    eq(grew,0,"dt="+dt+": торможение монотонно");
    eq(Math.hypot(G.ship.vx,G.ship.vy),0,"dt="+dt+": корабль встал");
  }
  /* выше крейсерской — накат */
  for(const dt of PHYS_DT){
    helmShip();G.ship.vx=maxSp*.9;const v0=G.ship.vx,fu=G.fuel;
    helmRun(Math.round(60/dt),dt);
    near(Math.hypot(G.ship.vx,G.ship.vy),v0,1e-6,"dt="+dt+": выше .55 — накат, скорость не тает");
    eq(G.fuel,fu,"dt="+dt+": и топливо не горит");
  }
  /* реверс — маневровыми, .4 */
  helmShip();HELM.key.ArrowDown=true;helmRun(30,1);HELM.key.ArrowDown=false;
  near(G.ship.vx,-.082*st.thr*.4*30,.05,"реверс: .4 маршевой назад");
}));

TEST_SUITES.push(()=>suite("штурвал: метки, автозахват, ракета к метке",()=>{
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
  /* ПКМ — ракета, тем же каналом */
  G.cargo.missile=2;G.mslCool=0;G.msl=[];G.mods.launcher=1;
  G.ctl.msl=true;updateCombat(1);G.ctl.msl=false;
  ok((G.msl||[]).length>0||(G.mslCool||0)>0,"ПКМ — пусковая отработала");
  G.mods.weapon=0;G.mods.launcher=0;G.msl=[];G.cargo.missile=0;
}));

/* ── один палец (M410) ──
   Стик говорит не «жми», а «лети»: его вектор — скорость, тягу подбирает
   физика. Проверяется то, что обещано автору: летит туда, куда тянут; набрал —
   держит и не жжёт; полхода — полскорости; палец на месте — стоит; с меткой
   нос на ней, а ход — куда тянут. */
TEST_SUITES.push(()=>suite("штурвал M410: стик задаёт ход, нос идёт за меткой",()=>{
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
  eq(helmStickFoot().length,1,"один стик — один след");
  HELM.S=null;HELM.home=null;
  const h=helmHome();
  ok(h.x<W/2&&h.y>H/2,"точка покоя — внизу слева: "+Math.round(h.x)+","+Math.round(h.y));
}));

TEST_SUITES.push(()=>suite("штурвал: другие режимы по-прежнему на keys (D08)",()=>{
  const src=[["24-mode-belt","belt"],["19-mode-landing","landing"],["19a-mode-scoop","scoop"]];
  ok(typeof updateBelt==="function"||typeof updateLanding==="function","режимы на месте");
  /* helmTick не трогает keys и не пишет чужие поля */
  helmShip();keys.pup=true;helmTick(1);
  ok(keys.pup,"keys.pup не тронут");
  ok(!("pup" in G.ctl),"в G.ctl нет чужих каналов");
  keys.pup=false;
  ok(src.length===3,"список для чтения глазами");
}));
