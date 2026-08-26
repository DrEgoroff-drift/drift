/* ══════════════ автотесты: календарь — небо считается ══════════════ */
/* Планета со спутниками нужна для затмения: ищем такую в ближних секторах */
function celTestPlanet(){
  for(let dx=-6;dx<=6;dx++)for(let dy=-6;dy<=6;dy++){
    if(!starAt(dx,dy))continue;
    const s=getSystem(dx,dy);
    for(const p of s.planets)if(p.moons&&p.moons.length)return{s,p};
  }
  return null;
}
TEST_SUITES.push(()=>suite("календарь: небо считается, а не бросается",()=>{
  resetWorld();
  const F=celTestPlanet();
  ok(!!F,"нашлась планета со спутником");
  const {s,p}=F;
  /* одно и то же время всегда даёт одно и то же небо */
  const a=JSON.stringify(celestAt(s,12345,p)),b=JSON.stringify(celestAt(s,12345,p));
  ok(a===b,"одно время — одно небо");
  const c=JSON.stringify(celestAt(s,12345+CEL_DAY*7,p));
  ok(a!==c,"через неделю небо другое");
  /* сутки идут вперёд и считаются целыми */
  ok(celDay(0)===0&&celDay(CEL_DAY*3+5)===3,"сутки считаются от начала мира");
  /* затмение бывает только там, где спутнику есть что закрывать */
  const bare=(function(){for(const q of s.planets)if(!q.moons||!q.moons.length)return q;return null;})();
  if(bare){
    let any=false;
    for(let d=0;d<400&&!any;d++)if(celEclipse(bare,d*CEL_DAY*.25))any=true;
    ok(!any,"на планете без спутников затмений не бывает");
  }
  /* а там, где есть, — случается, но не постоянно: это событие, а не погода */
  let hit=0,tries=0;
  for(let d=0;d<2000;d++){tries++;const e=celEclipse(p,d*CEL_DAY*.25);if(e&&e.k>.2)hit++;}
  ok(hit>0,"затмение на планете со спутником всё-таки наступает ("+hit+" раз)");
  ok(hit<tries*.25,"затмение остаётся редкостью ("+Math.round(hit/tries*100)+"% времени)");
  /* комета приходит и уходит, и её приход вычислим наперёд */
  let cvis=0;
  for(let d=0;d<600;d++)if(celComet(s,d*CEL_DAY))cvis++;
  ok(cvis>0&&cvis<600,"комета видна не всегда и не никогда ("+cvis+" из 600 суток)");
  /* небо ничего не кладёт в сохранение */
  const snap=snapshot();
  ok(!("celest"in snap)&&!("sky"in snap),"состояние неба не попадает в snapshot()");
}));

/* ── небо не трогает ни цен, ни выработки ── */
TEST_SUITES.push(()=>suite("календарь: небо не вмешивается в числа",()=>{
  resetWorld();
  const F=celTestPlanet();
  if(!F){ok(true,"без планеты со спутником проверять нечего");return;}
  const sys=(function(){for(let dx=-8;dx<=8;dx++)for(let dy=-8;dy<=8;dy++){
    if(!starAt(dx,dy))continue;const s=getSystem(dx,dy);if(s.station)return s;}return null;})();
  /* ставим игрока на планету с затмением и находим время, когда оно идёт */
  G.land={p:F.p};
  /* шаг мельче окна затмения: оно длится доли суток, и грубая сетка его
     перешагивает — это уже стоило одного ложного провала */
  let t0=-1;
  for(let d=0;d<8000&&t0<0;d++){
    const e=celEclipse(F.p,d*CEL_DAY*.02);
    if(e&&e.k>.5)t0=d*CEL_DAY*.02;
  }
  ok(t0>=0,"нашлось время глубокого затмения");
  const priceBefore=JSON.stringify(marketFor(sys));
  const statBefore=JSON.stringify(stat());
  G.t=t0;
  ok(celDark()>.3,"во время затмения свет действительно падает ("+
    celDark().toFixed(2)+")");
  ok(JSON.stringify(marketFor(sys))===priceBefore,"цены под затмением те же");
  ok(JSON.stringify(stat())===statBefore,"корабль под затмением тот же");
  ok(celLine().length>0,"событие названо словом, а не только картинкой");
  G.land=null;
  ok(celDark()===0,"в полёте затмения нет: оно бывает там, где стоишь");
}));

/* ══════════════ небесная вахта (M195) ══════════════ */
function skyTestSci(){
  for(let x=-14;x<=14;x++)for(let y=-14;y<=14;y++){
    if(!starAt(x,y))continue;
    const S=getSystem(x,y);
    if(S&&S.station&&S.station.stype==="sci")return S;
  }
  return null;
}
/* идёт ли событие наряда хоть в какой-то час названных суток */
function skyTestRuns(o){
  const S=getSystem(o.sx,o.sy);
  G.sx=o.sx;G.sy=o.sy;G.sys=S;
  G.land=null;G.dig=null;G.surf=null;
  if(o.kind==="ecl")G.surf={p:S.planets.find(p=>p.key===o.pkey)};
  for(let i=0;i<=64;i++){
    const t=(o.day+i/64)*CEL_DAY;
    if(skyOn(o,t)>0)return true;
  }
  return false;
}
TEST_SUITES.push(()=>suite("вахта: институт называет сутки, в которые небо и правда занято",()=>{
  resetWorld();
  G.duty=null;G.things=[];G.log=[];G.record=null;
  /* перебираем несколько семян: наряд должен находиться, а не выпадать раз в час */
  let found=0,ranAll=true,kinds={};
  for(let s=0;s<6;s++){
    G.sx=0;G.sy=0;G.sys=getSystem(0,0);G.surf=null;
    const o=skyPick(rng(hashi(s,17,0x5C1E)));
    if(!o)continue;
    found++;kinds[o.kind]=1;
    ok(o.day>celDay(),"срок в будущем ("+o.kind+", сутки "+o.day+")");
    ok(o.day-celDay()<=SKY_HOR*2+2,"срок в пределах горизонта: через "+(o.day-celDay())+" сут");
    if(!skyTestRuns(o)){ranAll=false;ok(false,"в наряде "+o.kind+" сутки "+o.day+" пусты");}
  }
  ok(found>=4,"наряд находится почти всегда ("+found+" из 6)");
  ok(ranAll,"в каждом наряде событие действительно идёт");
  ok(Object.keys(kinds).length>=2,"вид события не один и тот же: "+Object.keys(kinds).join(", "));
  resetWorld();G.duty=null;G.surf=null;
}));
TEST_SUITES.push(()=>suite("вахта: лента пишется на месте, отчёт до бюллетеня — полный",()=>{
  resetWorld();
  G.duty=null;G.things=[];G.log=[];G.record=null;
  const S=skyTestSci();ok(!!S,"научная станция есть");
  const o=skyPick(rng(hashi(3,11,0x5C1E)));ok(!!o,"наряд составлен");
  G.sx=S.sx;G.sy=S.sy;G.sys=S;G.st=S.station;
  ok(skyTake(o),"наряд взят");
  ok(G.things.some(x=>x.sky&&x.k==="paper"),"бумага на столе");
  ok(!skyTake(o),"второй наряд не берётся: вахта одна");
  /* не там и не тогда — ленты нет */
  skyTick();
  ok(!skyAll().o.got,"у стойки, в другой системе, писать нечего");
  ok(!skyCanReport(),"и сдавать нечего");
  /* на месте и в срок */
  ok(skyTestRuns(skyAll().o),"событие в названные сутки идёт");
  for(let i=0;i<=64&&!skyAll().o.got;i++){G.t=(o.day+i/64)*CEL_DAY;skyTick();}
  ok(!!skyAll().o.got,"лента записана");
  ok(G.things.some(x=>x.sky&&x.k==="strip"),"лента легла на стол");
  /* отчёт на стойке */
  G.sx=S.sx;G.sy=S.sy;G.sys=S;G.st=S.station;
  ok(skyCanReport(),"с лентой на научной станции есть что сдать");
  const cr=G.credits,dt=G.data;
  ok(skyReport(),"отчёт принят");
  ok(G.credits>cr&&G.data>dt,"плата и данные пришли");
  ok(recordAll().e.some(x=>/принято первым/.test(x.s)),"в книжке — «принято первым»");
  ok(!skyAll().o,"наряд закрыт");
  ok(!G.things.some(x=>x.sky),"бумаги вахты со стола убраны");
  G.st=null;G.surf=null;
}));
TEST_SUITES.push(()=>suite("вахта: бюллетень института выходит сам — опоздал, половина платы",()=>{
  resetWorld();
  G.duty=null;G.things=[];G.log=[];G.record=null;
  const S=skyTestSci();
  const d=celDay();
  G.duty={o:{sx:S.sx,sy:S.sy,sysName:S.name,kind:"conj",day:d,got:1,gd:d,bull:0},named:{},n:0,late:0};
  G.sx=S.sx;G.sy=S.sy;G.sys=S;G.st=S.station;
  G.t=(d+SKY_BULL+1)*CEL_DAY;skyTick();
  ok(skyAll().o.bull===1,"бюллетень вышел");
  const cr=G.credits;
  ok(skyReport(),"отчёт всё равно принимают");
  eq(G.credits-cr,Math.round(SKY_KINDS.conj.pay*.5),"плата половинная");
  eq(skyAll().late,1,"опоздание записано");
  eq(skyAll().n,0,"первым не считается");
  G.st=null;
}));
TEST_SUITES.push(()=>suite("вахта: комета берёт имя из книжки, и имя остаётся в системе",()=>{
  resetWorld();
  G.duty=null;G.things=[];G.log=[];G.record=null;
  recordAdd("Варламова З.","рекомендация: считает. Не объясняет. Годится.");
  recordAdd("институт","сдана лента");
  const S=skyTestSci();
  const d=celDay();
  G.duty={o:{sx:S.sx,sy:S.sy,sysName:S.name,kind:"comet",day:d,got:1,gd:d,bull:0},named:{},n:0,late:0};
  G.sx=S.sx;G.sy=S.sy;G.sys=S;G.st=S.station;
  ok(skyReport(),"отчёт принят первым");
  const nm=skyCometName(S);
  ok(!!nm,"комета названа: «"+nm+"»");
  ok(!/^институт/i.test(nm),"институт себя не называет");
  eq(nm,"Варламова З.","имя взято из книжки");
  /* имя переживает сохранение и звучит в кабине */
  const s=snapshot();G.duty=null;applySave(JSON.parse(JSON.stringify(s)));
  eq(skyCometName(S),nm,"имя пережило сохранение");
  const c=celComet(S,G.t);
  if(c){G.sys=S;ok(celLine().indexOf(nm.toUpperCase())>=0,"кабина зовёт комету по имени");}
  G.st=null;
}));
TEST_SUITES.push(()=>suite("вахта: наряд доходит до стойки, а не живёт в одних функциях",()=>{
  resetWorld();
  G.duty=null;G.things=[];G.log=[];G.record=null;
  /* обходим научные станции: хотя бы у одной из них в эту пятидневку наряд есть */
  let seen=0,tried=0;
  for(let x=-14;x<=14&&seen<3;x++)for(let y=-14;y<=14&&seen<3;y++){
    if(!starAt(x,y))continue;
    const S=getSystem(x,y);
    if(!S.station||S.station.stype!=="sci")continue;
    tried++;G.sx=x;G.sy=y;G.sys=S;G.st=S.station;
    if(skyOfferHere())seen++;
  }
  ok(tried>0,"научные станции нашлись ("+tried+")");
  ok(seen>0,"наряд предлагают хотя бы где-то ("+seen+" из "+tried+")");
  /* взяли — и больше нигде не дают, пока не закрыт */
  const o=skyOfferHere()||skyPick(rng(hashi(1,1,0x5C1E)));
  ok(skyTake(o),"наряд взят");
  ok(!skyOfferHere(),"второго наряда стойка не даёт");
  /* закрыли — три дня тишины */
  skyDrop();
  ok(!skyOfferHere(),"сразу после закрытия — тишина");
  G.t+=CEL_DAY*4;
  ok(skyAll().cool<=celDay(),"через три дня институт снова заговорит");
  G.st=null;G.duty=null;
}));
