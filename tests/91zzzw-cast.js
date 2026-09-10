/* ══════════════ падающие тени P5: рельеф затеняет себя, и это геометрия ══════════════
   `src/19c1-cast.js`. Набор держит не кадр, а луч: от точки профиля к светилу,
   шагами профиля; перекрыл гребень или валун — тень. Всё это считается без
   канвы, поэтому проверяется числами: где тень обязана быть, где её быть не
   может, и как она растёт, когда солнце садится. */

TEST_SUITES.push(()=>suite("падающие тени P5: гребень кладёт тень на склон за собой",{tier:"browser"},()=>{
  resetWorld();
  const p=G.sys.planets.find(x=>x.type!=="gas")||G.sys.planets[0];
  /* синтетический профиль: ровная земля на y=300, шаг 8, полторы сотни точек */
  const N=150,step=8,h=new Float64Array(N);
  for(let i=0;i<N;i++)h[i]=300;
  const tr={h,N,step,W:N*step,rocks:[],sseed:1,p};
  const celReal=celSun;
  /* солнце справа сверху (az<0 → диск правее центра, свет идёт справа):
     луч из точки ведётся вправо, тень ложится на всё, что ЛЕВЕЕ заслона */
  const sun=(alt,az)=>{celSun=()=>({ph:0,alt,az});sunDirSet(p);tr._castM=null;};
  try{
    sun(.5,-.6);
    ok(SUN_DIR.x>0&&SUN_DIR.y<0,"вектор к светилу: вправо и вверх ("+SUN_DIR.x.toFixed(2)+", "+SUN_DIR.y.toFixed(2)+")");
    /* ── ровная земля: тени нет нигде ── */
    let M=castMap(tr,p,0,N-1);
    ok(!!M,"карта строится днём");
    let any=0;for(let i=0;i<N;i++)if(castAt(M,i)>0)any++;
    eq(any,0,"на ровной земле тени нет");
    /* ── один гребень: тень слева от него, справа — нет ── */
    h[50]=300-120;                                   /* пик 120 px на x=400 */
    tr._castM=null;M=castMap(tr,p,0,N-1);
    ok(castAt(M,45)>.9,"точка в 40 px левее гребня — в тени: "+castAt(M,45).toFixed(2));
    eq(castAt(M,55),0,"точка правее гребня, к солнцу — на свету");
    eq(castAt(M,20),0,"далёкая точка слева, куда луч уже поднялся над гребнем, — на свету");
    /* ── чем ниже солнце, тем длиннее тень ── */
    const reach=()=>{let r=0;for(let i=49;i>=0;i--)if(castAt(M,i)>.5)r=50-i;else break;return r;};
    const rHigh=reach();
    sun(.1,-.6);M=castMap(tr,p,0,N-1);
    const rLow=reach();
    ok(rLow>rHigh,"низкое солнце тянет тень дальше: "+rHigh+" → "+rLow+" точек");
    /* ── полутень — доля, а не ступень, и без NaN ── */
    let prev=1,mono=true,bad=false;
    for(let i=49;i>=0;i--){const v=castAt(M,i);if(!(v>=0&&v<=1))bad=true;if(v>prev+1e-6)mono=false;prev=v;}
    ok(!bad,"доля тени всегда в [0,1]");
    ok(mono,"от гребня к свету тень только убывает");
    /* ── ночью карты нет: тени нет, потому что нет светила ── */
    sun(-.3,-.6);
    ok(castMap(tr,p,0,N-1)===null,"ниже горизонта карта не строится");
    eq(castAt(null,45),0,"и читать её безопасно: нуль");
    /* ── в зените луч уходит вверх и ничего не задевает ── */
    sun(1,0);
    ok(castMap(tr,p,0,N-1)===null,"в зените тени короче шага профиля — карты нет");
  }finally{celSun=celReal;sunDirSet(null);}
}));

TEST_SUITES.push(()=>suite("падающие тени P5: валун — тоже заслон, и карта считается один раз",()=>{
  resetWorld();
  const p=G.sys.planets.find(x=>x.type!=="gas")||G.sys.planets[0];
  const N=150,step=8,h=new Float64Array(N);
  for(let i=0;i<N;i++)h[i]=300;
  const tr={h,N,step,W:N*step,rocks:[],sseed:1,p};
  const celReal=celSun;
  try{
    celSun=()=>({ph:0,alt:.5,az:-.6});sunDirSet(p);
    /* без валуна — свет; с валуном радиуса 30 на x=400 — точка у его подошвы в тени */
    let M=castMap(tr,p,0,N-1);
    eq(castAt(M,49),0,"без валуна точка на свету");
    tr.rocks=[{x:400,rad:30,poly:[],tint:.5,flip:0}];tr._castM=null;
    M=castMap(tr,p,0,N-1);
    ok(castAt(M,49)>.9,"у подошвы валуна, со стороны от солнца, — тень: "+castAt(M,49).toFixed(2));
    /* точка ПОД валуном (x=416, внутри его подошвы) видит заслоном сам валун —
       и это верно: там земля накрыта камнем. Спрашиваем за подошвой, x=448 */
    eq(castAt(M,56),0,"за валуном с солнечной стороны тени нет");
    /* ── памятка: тот же ключ — та же карта, без пересчёта ── */
    const M2=castMap(tr,p,0,N-1);
    ok(M2===M,"второй рисовальщик того же ломтя читает ту же карту");
    /* другой диапазон — другая карта: ломоть ключуется своим отрезком */
    const M3=castMap(tr,p,10,60);
    ok(M3!==M&&M3.i0===10,"другой отрезок — своя карта");
    /* и castMapFor считает диапазон той же формулой, что drawGround */
    const pW=W;W=512;
    try{
      const M4=castMapFor(tr,200);
      eq(M4.i0,clamp(Math.floor((200-40)/step),0,N-1),"i0 — как у drawGround");
      eq(M4.i0+M4.a.length-1,clamp(Math.ceil((200+512+40)/step),0,N-1),"i1 — тоже");
    }finally{W=pW;}
  }finally{celSun=celReal;sunDirSet(null);tr.rocks=[];}
}));
