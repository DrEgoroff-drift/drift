/* ══════════════ планета за полный набор ══════════════ */
/* Три вещи, которые легко сломать правкой: планета выдаётся только за сотню,
   она никогда не платит кредитами, и роутер баржи берёт её на равных со
   станцией. */
TEST_SUITES.push(()=>suite("планета: только за полный набор",()=>{
  resetWorld();
  /* ── ниже сотни не даётся ничего ── */
  G.rareFound=RARE.slice(0,99).map(R=>R.id);
  eq(rareCount(),99,"собрано девяносто девять");
  ok(!planetReady(),"девяносто девять — это не полный набор");
  eq(planetGrant(),null,"на девяноста девяти планета не выдаётся");
  eq(G.pnode,null,"узла нет");

  /* ── сотая выдаёт, и выдаёт ту планету, где стоим ── */
  G.rareFound=RARE.map(R=>R.id);
  const sys=G.sys||getSystem(G.sx,G.sy);
  ok(sys&&sys.planets.length,"в системе есть планеты");
  const p=sys.planets[0];
  const N=planetGrant(p);
  ok(!!N,"на сотне планета выдаётся");
  eq(N.key,p.key,"узлом стала та планета, где стояли");
  ok(N.res.length>0,"у узла есть свои товары");
  for(const k of N.res)ok(TRADE_KEYS.indexOf(k)>=0,"узел родит ходовой товар: "+k);
  eq(planetGrant(p),null,"вторую планету получить нельзя");

  /* ── кредитов узел не платит ── */
  const cr=G.credits,turn=G.home?G.home.turn:0;
  N.last=Date.now()-60*60000;                 // час производства
  planetTick();
  ok(planetStockSum()>0,"за час узел что-то родил");
  eq(G.credits,cr,"склад узла не превращается в кредиты");
  eq(G.home?G.home.turn:0,turn,"и в оборот дома не попадает");
  for(const k of N.res)ok(N.stock[k]<=PLANET_CAP+1e-6,"склад не растёт выше потолка");

  /* ── увезти можно только своими руками и только в своей системе ── */
  G.sx=N.sx+7;G.sy=N.sy+7;
  eq(planetHaul(),0,"из чужой системы не забрать");
  G.sx=N.sx;G.sy=N.sy;
  for(const k of RES_KEYS)G.cargo[k]=0;
  const got=planetHaul();
  ok(got>0,"в своей системе груз берётся");
  eq(held(),got,"взятое лежит в трюме");
  ok(held()<=stat().cargoMax,"больше трюма не влезло");
  eq(G.credits,cr,"перевозка не начислила кредитов");

  /* ── роутер баржи знает узел ── */
  const stop=planetStop();
  ok(!!stop&&stop.key===N.sx+","+N.sy,"узел выдаёт остановку со своим ключом");
  ok(!!stop.station&&!!stop.station.prices,"у остановки есть прейскурант");
  ok(!!bargeSysAt(stop.key),"bargeSysAt принимает узел как остановку");
  const legs=bargeLegs();
  ok(legs.some(l=>l[0].key===stop.key||l[1].key===stop.key),
     "узел стоит в плечах маршрута наравне со станцией");

  /* ── баржа довозит ваш товар, а не покупает его ── */
  N.last=Date.now()-60*60000;planetTick();
  const before=planetStockSum();
  const b={from:N.sx+","+N.sy,to:"0,0",capName:"Тук",seed:1};
  const loaded=planetBargeLoad(b);
  ok(loaded>0,"баржа взяла товар с узла");
  ok(planetStockSum()<before,"склад узла на столько же уменьшился");
  eq(planetLoadSum(b),loaded,"груз лежит на барже целиком");
  const cr2=G.credits;
  for(const k of RES_KEYS)G.cargo[k]=0;
  const took=planetTakeLoad(b);
  ok(took>0,"груз забирается в трюм");
  eq(G.credits,cr2,"и за него не платят и не платится");

  /* ── сохранение переживает перезагрузку ── */
  const snap=snapshot();
  applySave(snap);
  ok(!!G.pnode&&G.pnode.key===N.key,"узел пережил сохранение");
  eq(G.pnode.hauled,N.hauled,"счётчик увезённого сохранился");
}));

/* ── 0.87: кэш ломтей грунта и пещеры (18c-chunks) ── */
TEST_SUITES.push(()=>suite("растр: грунт и свод рисуются ломтями, а не каждый кадр",()=>{
  resetWorld();
  const p=landOnTestPlanet();
  const tr=G.surf.tr;
  drawSurface();
  ok(!!tr.chunks&&tr.chunks.map.size>0,"после кадра у террейна есть ломти");
  const n0=tr.chunks.map.size;
  drawSurface();drawSurface();
  eq(tr.chunks.map.size,n0,"повторный кадр ломтей не добавляет");
  ok(n0<=CHUNK_KEEP,"ломтей не больше потолка");
  G.surf.x+=CHUNK_W*3;drawSurface();
  ok(tr.chunks.map.size<=CHUNK_KEEP,"далёкие ломти вытесняются");
  for(const cn of tr.chunks.map.values())
    eq(cn.height,Math.round(tr.chunks.ch*DPR*tr.chunks.sck),"высота ломтя одна на всю полосу — иначе шов в градиенте");
  ok(typeof drawGroundGrass==="function","трава рисуется живой, поверх ломтей");
  /* пещера */
  if(!G.surf.cave)G.surf.cave={x:G.surf.x+80};
  enterCave();drawCave();
  ok(!!G.cave.chunks&&G.cave.chunks.map.size>0,"свод пещеры лежит в ломтях");
  G.cave=null;G.mode="surface";
  /* слои во весь экран */
  const a=screenLayer("t|1",()=>{ctx.fillStyle="#f00";ctx.fillRect(0,0,W,H);});
  const b=screenLayer("t|1",()=>{});
  ok(a===b,"слой с тем же ключом не перерисовывается");
  ok(ctx===MAIN_CTX,"после покраски слоя ctx возвращён на экран");
  /* авторазрешение */
  ok([0,1,1.5,2].includes(G.opts.gfx.res),"gfx.res имеет допустимое значение");
}));
TEST_SUITES.push(()=>suite("дальняя гряда: свой рельеф, а не растянутый здешний",()=>{
  resetWorld();
  /* найдём планету с грунтом и встанем на неё: farH строится отрисовкой */
  let F=null;
  for(let dx=-8;dx<=8&&!F;dx++)for(let dy=-8;dy<=8&&!F;dy++){
    if(!starAt(dx,dy))continue;
    const s=getSystem(dx,dy);
    for(const p of s.planets)if(p.type!=="gas"){F={s,p};break;}
  }
  ok(!!F,"нашлась планета с грунтом");
  const tr=genTerrain(F.p,null);
  G.sx=F.s.sx;G.sy=F.s.sy;G.sys=F.s;
  /* мир заводится как в игре: drawSurface читает флору, фауну и погоду,
     и слепленный руками G.surf на них падает */
  G.land={p:F.p,tr,x:tr.padX,y:groundAt(tr,tr.padX)};
  enterSurface();
  G.running=true;
  drawSurface();
  ok(!!(tr.farH&&tr.farH[0]&&tr.farH[1]),"дальние профили построены");
  const A=tr.farH[0], B=tr.farH[1];
  /* 1. гряда НЕ повторяет землю под ногами. Пока она была `mid+(h-mid)*k`,
     связь была идеальной — и глаз узнавал её мгновенно */
  const corr=(u,v)=>{
    let mu=0,mv=0;for(let i=0;i<tr.N;i++){mu+=u[i];mv+=v[i];}
    mu/=tr.N;mv/=tr.N;
    let su=0,sv=0,c=0;
    for(let i=0;i<tr.N;i++){const a=u[i]-mu,b=v[i]-mv;c+=a*b;su+=a*a;sv+=b*b;}
    return c/Math.sqrt(Math.max(1e-9,su*sv));
  };
  ok(Math.abs(corr(A,tr.h))<.5,"дальний хребет не копия земли ("+corr(A,tr.h).toFixed(2)+")");
  ok(Math.abs(corr(A,B))<.5,"и два слоя не копии друг друга ("+corr(A,B).toFixed(2)+")");
  /* 2. в кадре стоят ВЕРШИНЫ, а не один склон. Слой рисуется с шагом
     step*3.6, значит на ширину экрана приходится около шестидесяти отсчётов;
     первый счёт брал частоту в тридцать раз ниже, и гряда вышла прямой */
  const win=Math.max(20,Math.round(1280/(tr.step*3.6)));
  let peaks=0;
  for(let i=1;i<win-1;i++)if(A[i]<A[i-1]&&A[i]<A[i+1])peaks++;   /* меньше y = выше */
  ok(peaks>=2,"на ширину экрана — не меньше двух вершин ("+peaks+" на "+win+" отсчётах)");
  /* 3. и вершины ОСТРЫЕ, а долины широкие: это и отличает хребет от волн.
     У гребневого шума медиана лежит НИЖЕ середины размаха */
  let lo=1e9,hi=-1e9;
  for(let i=0;i<tr.N;i++){if(A[i]<lo)lo=A[i];if(A[i]>hi)hi=A[i];}
  const sorted=Array.from(A).sort((a,b)=>a-b);
  const med=sorted[tr.N>>1];
  ok(med>(lo+hi)/2,"долин больше, чем вершин — это хребет, а не волна");
  /* 4. и он не уезжает за верх кадра: среднее вычтено */
  let s=0;for(let i=0;i<tr.N;i++)s+=tr.h[i];
  const mid=s/tr.N;
  let fs=0;for(let i=0;i<tr.N;i++)fs+=A[i];
  ok(Math.abs(fs/tr.N-mid)<2,"средняя высота гряды совпадает со средней землёй");
}));

/* ── M217: мир меряется кадром, а не пикселем ── */
TEST_SUITES.push(()=>suite("поверхность: рост человека — доля кадра, а не пиксель",()=>{
  resetWorld();
  landOnTestPlanet();
  const pW=W,pH=H;
  /* сама мерка */
  H=480;  eq(surfScale(),1,"малое окно не ужимаем: телефону и так мало мира");
  H=SURF_BASE*2; near(surfScale(),2,.001,"вдвое выше базы — вдвое крупнее мир");
  H=4000; eq(surfScale(),SURF_KMAX,"выше потолка не поднимаемся: кадр перестанет быть миром");
  /* и главное, ради чего всё: доля кадра одна и та же на любом экране */
  H=720;  const s1=26*surfScale()/H;
  H=1400; const s2=26*surfScale()/H;
  ok(Math.abs(s1-s2)<.01,"ходок занимает ту же долю кадра в 720 и в 1400");
  ok(s1>.04,"и эта доля больше прежних 3.6%");
  W=pW;H=pH;

  drawSurface();
  eq(W,pW,"после кадра ширина возвращена: масштаб живёт только внутри мира");
  eq(H,pH,"после кадра высота возвращена");
  ok(G.viewK>=1,"кадр оставил свой масштаб для ввода");
  near(G.viewK,surfScale(),.001,"и это тот самый масштаб, которым рисовали");

  /* тычок попадает туда, куда кадр нарисовал: без деления на масштаб
     «идти сюда» уводит тем дальше, чем больше окно */
  const rc=cvs.getBoundingClientRect();
  if(rc.width>0){
    mouseWalkAt(rc.left+300*rc.width/W,rc.top+rc.height/2);
    near((G.surf.walkTarget-G.viewX)*G.viewK,300,1.5,"тычок в 300-й пиксель ведёт в ту точку мира, что там нарисована");
  }

  /* растр печётся под ту плотность, с которой его положат */
  const tr=G.surf.tr;
  const want=Math.min(G.viewK,Math.max(1,RAST_MAX/DPR));
  near(tr.chunks.sck,want,.001,"ломоть печётся под масштаб мира — иначе крупный план оборачивается мылом");
  for(const cn of tr.chunks.map.values())
    eq(cn.width,Math.max(1,Math.round(CHUNK_W*DPR*tr.chunks.sck)),"и ширина ломтя это подтверждает");
  ok(tr.chunks.key.indexOf("~"+tr.chunks.sck)>0,"масштаб входит в ключ: ломоть чужого масштаба не всплывёт");
}));

/* ── M217: под землёй та же мерка ── */
TEST_SUITES.push(()=>suite("шахта: та же мерка, и клетка от неё только крупнее",()=>{
  resetWorld();
  landOnTestPlanet();
  drawSurface();
  const up=G.viewK;
  enterDig();drawDig();
  near(G.viewK,up,.001,"в шахте масштаб тот же, что наверху");
  const rc=cvs.getBoundingClientRect();
  if(rc.width>0){
    /* тычок по клетке: экранный пиксель дешевле мирового, и без деления
       на масштаб кирка бьёт мимо тем сильнее, чем больше окно */
    const D=G.dig,K=G.viewK;
    const camx=D.col*DIG_CELL-W/(2*K), camy=D.row*DIG_CELL-H/(2*K);
    const want={col:D.col+2,row:D.row+1};
    const px=(want.col*DIG_CELL+DIG_CELL/2-camx)*K, py=(want.row*DIG_CELL+DIG_CELL/2-camy)*K;
    mouseWalkAt(rc.left+px*rc.width/W,rc.top+py*rc.height/H);
    eq(D.walkTarget.col,want.col,"кирка идёт в ту клетку, по которой ткнули");
    eq(D.walkTarget.row,want.row,"и в тот ряд");
  }
  G.dig=null;G.mode="surface";
}));

TEST_SUITES.push(()=>suite("пещера: человек не сжимается при спуске",()=>{
  resetWorld();
  landOnTestPlanet();
  drawSurface();
  const up=G.viewK;
  if(!G.surf.cave)G.surf.cave={x:G.surf.x+80};
  enterCave();drawCave();
  near(G.viewK,up,.001,"наверху и под землёй масштаб один: иначе спуск читается как смена игры");
  const rc=cvs.getBoundingClientRect();
  if(rc.width>0){
    mouseWalkAt(rc.left+200*rc.width/W,rc.top+rc.height/2);
    const camx=G.cave.x-W/(2*G.viewK);
    near((G.cave.walkTarget-camx)*G.viewK,200,1.5,"и тычок под землёй ведёт туда же, куда указан");
  }
  eq(W,Math.round(W),"ширина кадра не осталась дробной после масштаба");
  G.cave=null;G.mode="surface";
}));

/* ── M221: у интерфейса своя мерка, но она от того же кадра ── */
TEST_SUITES.push(()=>suite("интерфейс: растёт вместе с окном, но медленнее мира",()=>{
  resetWorld();
  eq(uiScale(390,844),1,"телефон не трогаем: там своя вёрстка");
  eq(uiScale(760,1200),1,"и всё, что уже узкого порога, тоже");
  eq(uiScale(1280,600),1,"маленькое окно не ужимаем");
  near(uiScale(1920,1080),1.42,.01,"на 1080 интерфейс в полтора раза крупнее");
  eq(uiScale(2560,4000),1.75,"выше потолка не идём: текст, выросший вдвое, читается плакатом");
  /* и главное соотношение: мир обгоняет интерфейс, иначе приборы съедят кадр */
  const pH=H;
  H=1080;
  ok(uiScale(1920,1080)<surfScale(),"мир растёт быстрее интерфейса: "+
     uiScale(1920,1080).toFixed(2)+" против "+surfScale().toFixed(2));
  H=pH;
  /* CSS получает ту же мерку: без этого zoom остался бы единицей */
  const css=(getComputedStyle(document.documentElement).getPropertyValue("--ui")||"").trim();
  ok(css!=="","CSS получил мерку переменной --ui");
  near(parseFloat(css),UIK,.01,"и это та же мерка, что в коде");
  near(UIK,uiScale(W,H),.001,"а сама мерка посчитана по нынешнему окну");
}));
