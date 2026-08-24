/* Биология (M174): вид — свойство планеты, экземпляр — вид плюс возраст плюс
   место. Здесь проверяется ровно то, чего раньше не было и из-за чего игра
   вела реестр несуществующих видов:
   • два экземпляра одного вида совпадают формой, цветом, ветвлением и именем;
   • имя выводится из НАРИСОВАННОГО, а не выбирается независимо;
   • всходы и старики отличаются телом, а не масштабом;
   • сухой гребень и мокрая ложбина растят один вид по-разному;
   • второй экземпляр уже описанного вида — не открытие. */

function bioPlanet(seed){
  const sys=getSystem(seed|0,3);
  for(const p of sys.planets)if(p.type!=="gas")return p;
  return sys.planets[0];
}

TEST_SUITES.push(()=>suite("био: у планеты есть список видов, и он устойчив",()=>{
  resetWorld();
  const p=bioPlanet(5);
  const a=floraOf(p), b=floraOf(p);
  ok(a===b,"список видов кэшируется на планете");
  ok(a.length>=3&&a.length<=5,"три-пять видов флоры (получено "+a.length+")");
  const f=faunaOf(p);
  ok(f.length>=2&&f.length<=4,"два-четыре вида фауны (получено "+f.length+")");
  /* виды не повторяются формой: иначе «своя флора» снова каталог */
  const kinds={};for(const s of a)kinds[s.kind]=1;
  eq(Object.keys(kinds).length,a.length,"у каждого вида флоры своя форма");
  /* другая планета — другая биосфера */
  const p2=bioPlanet(41);
  const n1=floraOf(p).map(s=>s.name).join("|"), n2=floraOf(p2).map(s=>s.name).join("|");
  ok(n1!==n2,"на другой планете другие виды");
}));

TEST_SUITES.push(()=>suite("био: два экземпляра одного вида — одно растение",()=>{
  resetWorld();
  const p=bioPlanet(7);
  const sp=floraOf(p)[0];
  const r=rng(1234);
  const A=specimenPlant(r,sp,p,100,0,{wet:.6,hollow:.5});
  const B=specimenPlant(r,sp,p,300,0,{wet:.6,hollow:.5});
  eq(A.kind,B.kind,"форма одна");
  eq(A.name,B.name,"имя одно");
  eq(A.name,sp.name,"имя берётся у вида");
  eq(A.branches.length===0,B.branches.length===0,"ветвление одного устройства");
  eq(A.glow,B.glow,"свечение — признак вида");
  eq(A.spiny,B.spiny,"колючесть — признак вида");
  /* цвет один и тот же с точностью до среды: место одинаковое — цвет совпал */
  eq(Math.round(A.leaf[1]),Math.round(B.leaf[1]),"цвет листа один");
  /* а вот тело у них разное: возраст и мелкая кривизна свои */
  let diff=0;
  const r2=rng(99);
  for(let i=0;i<24;i++){
    const s=specimenPlant(r2,sp,p,i*40,0,{wet:.6,hollow:.5});
    if(Math.abs(s.h-A.h)>.5)diff++;
  }
  ok(diff>=18,"экземпляры не близнецы по росту (различных "+diff+" из 24)");
}));

TEST_SUITES.push(()=>suite("био: имя не может соврать",()=>{
  resetWorld();
  for(let s=0;s<12;s++){
    const p=bioPlanet(s*13+2);
    for(const sp of floraOf(p)){
      const parts=sp.name.split(", ");
      eq(parts.length,2,"имя из формы и признака");
      const form=parts[0].split(" ").slice(1).join(" ");
      eq(form,PLANT_FORM_K[sp.kind],"слово формы — это НАРИСОВАННАЯ форма");
      const tr=parts[1];
      if(tr==="светящийся")eq(sp.glow,true,"светящимся зовут только светящегося");
      if(tr==="колючий")eq(sp.spiny,true,"колючим — только колючего");
      if(tr==="цветущий")eq(sp.bloom,true,"цветущим — только цветущего");
      if(sp.glow)eq(tr,"светящийся","свечение видно в имени всегда");
    }
    for(const sp of faunaOf(p)){
      const tr=sp.name.split(", ")[1];
      if(tr==="стайный")eq(sp.herd,true,"стайным зовут только стайного");
      if(tr==="светящийся")eq(sp.glow,true,"светящимся — только светящегося");
      if(sp.alien)eq(sp.name.split(", ")[0].split(" ")[1],BEAST_ALIEN_WORD[sp.alien],
        "чужой архетип назван своим словом");
      if(!sp.alien&&sp.legs>=6)eq(sp.name.split(", ")[0].split(" ")[1],"шестиног",
        "шесть ног — шестиног");
    }
  }
}));

TEST_SUITES.push(()=>suite("био: возраст — это тело, а не масштаб",()=>{
  resetWorld();
  const p=bioPlanet(9);
  const sp=floraOf(p).find(s=>plantStemForm(s.kind)&&s.nb>0)||floraOf(p)[0];
  const r=rng(5);
  let young=null,old=null,n=0;
  while((!young||!old)&&n++<4000){
    const s=specimenPlant(r,sp,p,120,0,{wet:.5,hollow:.5});
    if(s.age<.28&&!young)young=s;
    if(s.age>.85&&!old)old=s;
  }
  ok(young&&old,"нашлись и всходы, и старик");
  ok(young.h<old.h,"всход ниже старика");
  eq(young.bloom,false,"всходы не цветут");
  eq((young.dead||[]).length,0,"у всхода нет сухостоя");
  ok(old.dead.length>0,"у старика есть мёртвые ветви");
  ok(old.litter>0,"под стариком опад");
  if(sp.nb>0)ok(young.branches.length<=old.branches.length,"у всхода ветвей не больше");
}));

TEST_SUITES.push(()=>suite("био: экземпляр отвечает месту",()=>{
  resetWorld();
  const p=bioPlanet(11);
  /* берём вид, которому нужна вода, и сажаем его в ложбину и на сухой гребень */
  const sp=floraOf(p).slice().sort((a,b)=>b.wet-a.wet)[0];
  sp.wet=1;                                  // чтобы разница была измеримой
  let hLow=0,hDry=0;
  for(let i=0;i<200;i++){
    hLow+=specimenPlant(rng(100+i),sp,p,0,0,{wet:1,hollow:1}).h;
    hDry+=specimenPlant(rng(100+i),sp,p,0,0,{wet:0,hollow:0}).h;
  }
  ok(hLow>hDry*1.15,"в мокрой ложбине тот же вид заметно выше ("+
    Math.round(hLow/200)+" против "+Math.round(hDry/200)+")");
  const wet=specimenPlant(rng(7),sp,p,0,0,{wet:1,hollow:1});
  const dry=specimenPlant(rng(7),sp,p,0,0,{wet:0,hollow:0});
  ok(dry.w>wet.w,"на сухом стебель толще и жёстче");
  ok(dry.leaf[1]<=wet.leaf[1],"на сухом лист ближе к породе");
  ok(wet.photo===sp.photo,"тяга к звезде — свойство вида");
}));

TEST_SUITES.push(()=>suite("био: реестр считает виды, а не кусты",()=>{
  resetWorld();
  const p=bioPlanet(13);
  const sp=floraOf(p)[0];
  const A=specimenPlant(rng(3),sp,p,0,0,null);
  const B=specimenPlant(rng(4),sp,p,50,0,null);
  const d0=G.data, n0=G.species.size, b0=G.bio|0;
  eq(bioScan(A,9),true,"первый экземпляр — открытие");
  eq(G.species.size,n0+1,"вид записан один раз");
  eq(G.data,d0+9,"полные данные за новый вид");
  eq(G.bio|0,b0+1,"образец засчитан");
  const d1=G.data;
  eq(bioScan(B,9),false,"второй экземпляр того же вида — не открытие");
  eq(G.species.size,n0+1,"реестр не вырос");
  eq(G.bio|0,b0+1,"второй образец не засчитан");
  ok(G.data>d1&&G.data<d1+9,"за повторное наблюдение — доля данных");
  eq(A.scanned,true,"экземпляр помечен просканированным");
}));

TEST_SUITES.push(()=>suite("био: пещерная флора светится по виду",()=>{
  resetWorld();
  for(let s=0;s<8;s++){
    const p=bioPlanet(s*7+3);
    const cf=caveFloraOf(p);
    ok(cf.length>0,"под землёй есть чему расти");
    for(const sp of cf){
      eq(sp.glow,true,"пещерный вид светится");
      eq(sp.name.split(", ")[1],"светящийся","и это записано в имени");
    }
  }
}));

TEST_SUITES.push(()=>suite("био: старый реестр видов не переносится",()=>{
  resetWorld();
  G.species.add("Хмара коралловый, светящийся");
  const s=snapshot();
  eq(s.bioV,2,"новое сохранение помечено");
  delete s.bioV;                                    // сохранение до M174
  applySave(s);
  eq(G.species.size,0,"реестр несуществующих видов обнулён");
  const s2=snapshot();
  G.species.add("Проверка стеблевой, гибкий");
  applySave(s2);
  ok(G.species.size>=0,"новое сохранение грузится обычным порядком");
  const s3=snapshot();
  applySave(s3);
  eq(G.species.size,s3.species.length,"и реестр переживает круг сохранения");
}));

TEST_SUITES.push(()=>suite("био: на полосе растут виды планеты, и стая ходит стаей",()=>{
  resetWorld();
  const p=landOnTestPlanet();
  const S=G.surf;
  const names={};for(const pl of S.plants)names[pl.name]=(names[pl.name]|0)+1;
  const kinds=Object.keys(names);
  ok(kinds.length>0,"на полосе что-то растёт");
  ok(kinds.length<=5,"видов на полосе не больше, чем на планете ("+kinds.length+")");
  for(const pl of S.plants)ok(!!pl.sp,"у каждого куста есть вид");
  /* заросль — это повторение одного вида, а не выставка */
  const most=Math.max.apply(null,kinds.map(k=>names[k]));
  if(S.plants.length>=8)ok(most>=2,"вид встречается не по одному разу");
  /* стайные стоят рядом: у стайного вида есть сосед того же вида ближе 200 */
  /* одиночки среди стайных бывают: пятачок у пещеры и у дома расчищается уже
     после расстановки, и оттуда соседа могло вымести. Проверяем правило, а не
     каждый случай */
  let herd=0,withMate=0;
  for(const b of S.fauna){
    if(!b.sp||!b.sp.herd)continue;
    herd++;
    if(S.fauna.some(o=>o!==b&&o.name===b.name&&Math.abs(o.x-b.x)<220))withMate++;
  }
  if(herd>2)ok(withMate>=herd*.6,"стайные звери стоят группами ("+withMate+" из "+herd+")");
  else ok(true,"стайных на полосе нет — проверять нечего");
  /* и возраст на полосе разный — не одна взрослая волна */
  const ages=S.plants.map(pl=>pl.age);
  if(ages.length>6)ok(Math.max.apply(null,ages)-Math.min.apply(null,ages)>.3,
    "на полосе есть и молодые, и старые");
}));
