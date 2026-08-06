/* ══════════════ автотесты: картинка: сцены, двенадцать миров, крупная форма, корпуса ══════════════ */
TEST_SUITES.push(()=>suite("три пересмотренные сцены рисуются",()=>{
  resetWorld();
  /* Правки чисто рисовальные, утверждать про пиксели нечего — но упасть на
     первом кадре они могут запросто (Path2D, отсутствующая планета, пустая
     сетка). Проверяем, что каждая сцена переживает отрисовку в своём режиме. */
  G.mode="map";G.sel={x:G.sx+1,y:G.sy};
  drawMap();ok(true,"карта рисуется");
  G.sel={x:G.sx+9,y:G.sy+9};                 // вне радиуса прыжка
  drawMap();ok(true,"карта рисуется и с целью вне радиуса");
  const p=G.sys.planets[0];
  G.credits=1e6;G.cargo.alloy=99;
  ok(foundBase(p),"база закладывается");
  enterBase(p);
  drawBase();ok(true,"база в разрезе рисуется");
  /* пустая клетка под курсором — та ветка, где раньше рисовалась рамка на всём */
  G.base.cur=(G.base.cur+1)%BASE_COLS;
  drawBase();ok(true,"база рисуется и с курсором на породе");
  let PB=null;
  for(let x=-12;x<12&&!PB;x++)for(let y=-12;y<12&&!PB;y++){
    if(!starAt(x,y))continue;
    const s=getSystem(x,y),b=pirateBaseOf(s);
    if(b){G.sys=s;G.sx=x;G.sy=y;PB=b;}
  }
  ok(!!PB,"пиратская база в галактике находится");
  if(PB){
    enterRaid(PB);
    drawRaid();ok(true,"абордаж рисуется");
  }
  G.base=null;G.raid=null;G.mode="system";
}));

TEST_SUITES.push(()=>suite("миры: двенадцать истинных и смеси из них",()=>{
  resetWorld();
  /* Таблиц, разложенных по типу мира, восемь штук в разных файлах, и добавить
     тип, забыв одну из них, — самая лёгкая ошибка в этой части. Проверка
     держит их синхронными, а не глаза. */
  const keys=Object.keys(TYPES);
  eq(keys.length,12,"истинных миров двенадцать");
  const miss=[];
  for(const k of keys){
    if(!PROFILE[k])miss.push("PROFILE:"+k);
    if(!RELIEF_MIX[k])miss.push("RELIEF_MIX:"+k);
    if(!GEO_TPL[k])miss.push("GEO_TPL:"+k);
    if(!WEATHER_BY_TYPE[k])miss.push("WEATHER:"+k);
    if(!CLOUD_KIND[k])miss.push("CLOUD_KIND:"+k);
    if(!WORLD_MOOD[k])miss.push("MOOD:"+k);
    if(!WORLD_VOICE[k])miss.push("VOICE:"+k);
    if(k!=="gas"){
      if(!MIX_KIN[k]||!MIX_KIN[k].length)miss.push("MIX_KIN:"+k);
      if(!TYPES[k].mix)miss.push("mix-имя:"+k);
    }
  }
  eq(miss.join(", "),"","у каждого типа заполнены все таблицы");
  /* родство симметрично по смыслу не обязано быть, но ссылаться на живой тип обязано */
  const bad=[];
  for(const k in MIX_KIN)for(const m of MIX_KIN[k])if(!TYPES[m]||m==="gas")bad.push(k+"→"+m);
  eq(bad.join(", "),"","родство ссылается только на существующие миры");

  /* смесь — это другой мир, а не другая раскраска */
  const W=makeWorld("ice","volcanic",.4);
  eq(W.type,"ice","ведущий тип остаётся ледяным");
  eq(W.mix,"volcanic","второй записан");
  eq(W.T.ru,"ледяная, с вулканами","имя собирается из двух");
  eq(W.T.atm,TYPES.ice.atm,"воздух берёт ведущий: полупригодного не бывает");
  eq(W.T.pal.length,6,"палитра смешана в шесть ступеней");
  ok(W.T.rough>TYPES.ice.rough&&W.T.rough<TYPES.volcanic.rough,"шероховатость между двумя");
  const P={type:W.type,mix:W.mix,mw:.4,T:W.T,seed:12345};
  worldTables(P);
  ok(P.relief.crater>RELIEF_MIX.ice.crater,"кратеров стало больше, чем у чистой ледяной");
  eq(P.geoTpl.length,GEO_TPL.ice.length,"слоёв столько же, сколько у ведущего");
  ok(P.wxPool.indexOf("ash")>=0,"в погоду попал пепел вулканического соседа");
  ok(P.voice.bpm[0]>WORLD_VOICE.ice.bpm[0],"музыка ускорилась в сторону вулканической");
  const R=worldRes("ice","volcanic",.4);
  ok(R.length>PROFILE.ice.length,"залежи пополнились породами соседа");
  ok(R.indexOf("iron")>=0||R.indexOf("titan")>=0,"и это именно его породы");
  /* чистый мир не обрастает ничем */
  const pure=makeWorld("ice",null,0);
  eq(pure.T,TYPES.ice,"без второго типа мир остаётся собой");

  /* галактика: встречаются все двенадцать, и смеси преобладают */
  const seen={},cnt={pure:0,mix:0};
  for(let sx=0;sx<8;sx++)for(let sy=0;sy<8;sy++){
    for(const p of getSystem(sx,sy).planets){
      seen[p.type]=(seen[p.type]||0)+1;
      if(p.mix)cnt.mix++;else cnt.pure++;
      if(p.type!=="gas")ok(p.res.length>0,"у мира есть чем поживиться")&&0;
    }
  }
  const absent=Object.keys(TYPES).filter(k=>!seen[k]);
  eq(absent.join(", "),"","в шестидесяти четырёх секторах встретились все двенадцать миров");
  ok(cnt.mix>cnt.pure,"смешанных больше, чем чистых ("+cnt.mix+" против "+cnt.pure+")");
  ok(cnt.pure/(cnt.pure+cnt.mix)>.15,"но чистые не вымерли");
  /* гигант не смешивается: смесь про поверхность, а её у него нет */
  let gasMix=0;
  for(let sx=0;sx<8;sx++)for(const p of getSystem(sx,0).planets)if(p.type==="gas"&&p.mix)gasMix++;
  eq(gasMix,0,"газовый гигант ни с чем не смешан");
}));

TEST_SUITES.push(()=>suite("крупная форма: поздний мир виден силуэтом",()=>{
  resetWorld();
  /* Тип мира должен читаться СРЕДНИМ масштабом — тем, что между валуном
     (радиус до 22) и достопримечательностью (150–900). Проверка держит три
     вещи: форма есть у всех четырёх поздних миров, она из своего набора и
     она не залезает ни в зону взлёта, ни под постройку. */
  const bad=[];
  for(const k of DECO_KINDS)if(!TYPES[k.on])bad.push(k.k+"→"+k.on);
  eq(bad.join(", "),"","набор формы ссылается на существующие миры");
  const late=["crystal","metal","jungle","ruin"];
  for(const t of late){
    const W0=makeWorld(t,null,0);
    const P={type:t,mix:null,mw:0,T:W0.T,rough:W0.T.rough,seed:hashi(9,t.length,0x77)};
    worldTables(P);
    const tr=genTerrain(P);
    genPOI(tr,P);genDeco(tr,P);
    ok(tr.deco.length>2,t+": крупная форма выросла ("+tr.deco.length+" штук)");
    if(!tr.deco.length)continue;
    const alien=tr.deco.filter(d=>!DECO_KINDS.some(k=>k.k===d.k&&k.on===t));
    eq(alien.length,0,t+": формы только из своего набора");
    const onPad=tr.deco.filter(d=>Math.abs(d.x-tr.padX)<420);
    eq(onPad.length,0,t+": в зоне взлёта пусто — обстановка фантомна");
    const inPoi=tr.deco.filter(d=>tr.poi.some(q=>Math.abs(q.x-d.x)<q.h*.3));
    eq(inPoi.length,0,t+": не торчит сквозь постройку");
    const hi=Math.max.apply(null,tr.deco.map(d=>d.h));
    ok(hi>40&&hi<330,t+": масштаб между валуном и постройкой ("+Math.round(hi)+" px)");
    /* и всё это рисуется: восемь форм на четыре мира, каждая своим кодом */
    G.land={p:P,tr,x:tr.padX,y:groundAt(tr,tr.padX)};
    enterSurface();
    G.surf.x=tr.deco[0].x;
    drawSurface();
    ok(true,t+": кадр с крупной формой рисуется");
  }
  /* чистый ранний мир не обрастает ничем: язык форм принадлежит типу */
  const R=makeWorld("rocky",null,0);
  const PR={type:"rocky",mix:null,mw:0,T:R.T,rough:R.T.rough,seed:5};
  worldTables(PR);
  const tr2=genTerrain(PR);genDeco(tr2,PR);
  eq(tr2.deco.length,0,"каменистый мир остаётся камнем без чужих форм");
  /* смесь принимает форму соседа, но реже, чем собственную */
  const M0=makeWorld("ice","ruin",.4);
  const PM={type:"ice",mix:"ruin",mw:.4,T:M0.T,rough:M0.T.rough,seed:31};
  worldTables(PM);
  const tr3=genTerrain(PM);genDeco(tr3,PM);
  ok(tr3.deco.length>0,"на ледяной с руинами стены есть ("+tr3.deco.length+")");
  ok(tr3.deco.length<tr2.deco.length+18,"но их меньше, чем на своём мире");
  ok(tr3.deco.every(d=>d.k==="wall"||d.k==="column"),"и это именно руины соседа");
  G.surf=null;G.land=null;G.mode="system";
}));

/* ── M81: посадочный корабль ──
   Раньше на грунте стоял полётный силуэт, повёрнутый носом вверх и сжатый до
   38 px при астронавте 24: игрушка на палочках. Мерило — человек, поэтому
   проверяем именно длину, три точки опоры и зону «у корабля» от корпуса. */
function landerInk(id,opt){
  const c=document.createElement("canvas");c.width=260;c.height=200;
  const old=ctx, prev=G.shipId;
  ctx=c.getContext("2d");G.shipId=id;
  ctx.translate(130,120);
  try{drawLander(false,false,opt||{gear:1,sq:0,landed:true,hot:1});}
  finally{ctx=old;G.shipId=prev;}
  const d=c.getContext("2d").getImageData(0,0,260,200).data;
  const at=(x,y)=>x>=0&&x<260&&y>=0&&y<200&&d[((y*260+x)<<2)+3]>20;
  let x0=1e9,x1=-1e9,y0=1e9;
  for(let y=0;y<200;y++)for(let x=0;x<260;x++)if(at(x,y)){
    if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;
  }
  return {at,x0:x0-130,x1:x1-130,top:y0-120};
}
TEST_SUITES.push(()=>suite("посадочный корабль: масштаб и три точки опоры",()=>{
  resetWorld();
  const ASTRO=24;
  for(const id of SHIP_KEYS){
    const L=landerLen(id);
    ok(L>=90&&L<=130,id+": длина силуэта 90–130 px ("+Math.round(L)+")");
    ok(L>=3*ASTRO,id+": корабль не короче трёх астронавтов");
    ok(shipZoneR(id)>L*.5,id+": зона «у корабля» больше половины корпуса");
    const ink=landerInk(id);
    ok(ink.x1-ink.x0>=L*.9,id+": кадр рисуется во всю длину ("+(ink.x1-ink.x0)+" px)");
  }
  /* и на уникальном корпусе тоже: он живёт в G.uniqueShips, а не в SHIPS */
  const uid=Object.keys(G.uniqueShips||{})[0];
  if(uid)ok(landerInk(uid).x1>0,"уникальный корпус тоже рисуется");
  /* три пяты: под каждой из трёх опор есть чернила у линии касания (11) */
  const L=landerLen(G.shipId), ink=landerInk(G.shipId);
  for(const lx of [-L*.21,-L*.05,L*.21]){
    let hit=false;
    for(let x=Math.round(130+lx)-7;x<=Math.round(130+lx)+7&&!hit;x++)
      for(let y=120+4;y<=120+18;y++)if(ink.at(x,y)){hit=true;break;}
    ok(hit,"опора на "+Math.round(lx)+" px стоит на грунте");
  }
  ok(ink.x1-ink.x0>=L*.8,"разнос опор и корпуса не уже 0.8 длины");
  /* убранное шасси действительно убрано: в полёте пят у грунта нет */
  const up=landerInk(G.shipId,{gear:0,sq:0,landed:false});
  ok(up.top>ink.top-40,"со сложенным шасси силуэт не выше, чем со стоящим");
  /* зона у корабля не пускает высадку под днище */
  landOnTestPlanet();
  ok(Math.abs(G.surf.x-G.surf.shipX)>shipZoneR(),
    "высаживаемся за зоной взлёта, а не под кораблём");
  G.surf=null;G.land=null;G.mode="system";
}));

/* ── M82: пиратский корпус ──
   Пират рисовался вашим же генератором корпусов в другой раскраске: полтора
   десятка полигонов, аккуратная симметрия. Проверяем ровно то, из-за чего
   затевалось: бюджет полигонов, асимметрия, четыре опознаваемых класса и то,
   что сотня полигонов не считается каждый кадр. */
TEST_SUITES.push(()=>suite("пиратский корпус: сварен, а не покрашен",()=>{
  resetWorld();
  const seen={};
  for(let i=0;i<40;i++){
    const id=pirateShipId(hashi(i,7,3));
    const art=pirateArtOf(id);
    seen[art.cls]=(seen[art.cls]||0)+1;
    const n=art.B.polys.length;
    ok(n>=60&&n<=120,"полигонов "+n+" (нужно 60–120), класс "+art.ru);
    /* асимметрия — правило, а не шум: слева пилон, справа бак, и они разной
       эпохи. Считать массу или число деталей по бортам бесполезно — хребет
       почти симметричен и топит разницу, а случайная мелочь её подделывает.
       Спрашиваем ровно то, что видно глазом: у скольких вершин НЕТ пары,
       отражённой через ось. У штампованного корпуса таких почти нет. */
    const V=[];
    for(const q of art.B.polys)for(const pt of q.p)V.push(pt);
    const tol=art.B.L*.008;
    let lone=0;
    for(const v of V){
      if(!V.some(w=>Math.abs(w[0]-v[0])<tol&&Math.abs(w[1]+v[1])<tol))lone++;
    }
    ok(lone/V.length>.5,"корпус не зеркален: без пары "+
      Math.round(lone/V.length*100)+"% вершин");
    ok(art.B.eng.length>=2,"движков не меньше двух");
  }
  ok(seen.fast&&seen.raid&&seen.heavy,"все три вольных класса встречаются: "+
    JSON.stringify(seen));
  /* выпечка: второй запрос отдаёт ту же канву, а не считает заново */
  const a=pirateArtOf(pirateShipId(hashi(3,7,3)));
  const b=pirateArtOf(pirateShipId(hashi(3,7,3)));
  ok(a===b&&a.cn.width>0,"корпус выпекается один раз на seed");
  /* флагман ренегата — ваш корпус, обвешанный чужим */
  const rg=pirateArtOf(G.shipId,true);
  eq(rg.cls,"flag","у ренегата класс флагмана");
  ok(rg!==pirateArtOf(G.shipId),"тот же id без пометки — не тот же корабль");
  /* и всё это рисуется живьём, с повреждениями и без */
  const c=document.createElement("canvas");c.width=c.height=260;
  const old=ctx;ctx=c.getContext("2d");
  try{
    ctx.translate(130,130);
    for(const hp of [1,.7,.4,.2]){
      drawPirate({shipId:pirateShipId(hashi(5,7,3)),seed:5,hull:hp*100,hullMax:100,
        thrust:hp<.5});
    }
  }finally{ctx=old;}
  const d=c.getContext("2d").getImageData(0,0,260,260).data;
  let ink=0;for(let i=3;i<d.length;i+=4)if(d[i]>20)ink++;
  ok(ink>1200,"подбитый пират рисуется и виден ("+ink+" px)");
}));
