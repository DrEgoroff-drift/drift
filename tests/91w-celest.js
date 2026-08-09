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
