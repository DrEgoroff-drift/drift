/* ══════════════ порченый сейв (M354) ══════════════
   Сейв приезжает из двух мест, и оба врут. Локальный — из localStorage
   прошлой версии: поле поменяло форму, и теперь там объект вместо числа.
   Облачный — из `site/api.php`, а он PHP: пустая карта уже приезжала списком
   (`asMap`, отдельная беда), и точно так же число может вернуться строкой.

   Сквозной набор (91zzzzz) проверяет сейв БЕЗ поля и с ПУСТЫМ полем — то есть
   старую версию. Здесь другое и злее: поле НА МЕСТЕ, но не того типа. Такой
   сейв игра обязана открыть — не «правильно», а не упав: игрок с испорченным
   сохранением должен увидеть игру, а не белый экран.

   Три вопроса:
   1. любое одно поле не того типа — applySave не бросает, мир открывается;
   2. все числа строками (PHP-облако) — после загрузки они снова числа, и
      арифметика не склеивает строки («600»+1 = «6001» — деньги стали текстом);
   3. круг сейв→загрузка→сейв неподвижен: со второго круга снимок не меняется.
      Поле, которое растёт на каждой загрузке, — это распухающий сейв. */

/* три подмены на поле: пустое не того рода, число вместо составного, текст */
function hsMut(v){
  if(Array.isArray(v))return [{},0,"текст"];
  if(v&&typeof v==="object")return [[],0,"текст"];
  if(typeof v==="number")return [String(v),{},[]];
  if(typeof v==="string")return [0,[],{}];
  if(typeof v==="boolean")return [0,"текст"];
  return [0,"текст",[]];
}
/* живой ли мир: цифры на месте, система есть, снимок пишется */
function hsAlive(){
  const bad=[];
  for(const k of ["credits","fuel","hull","data","t","zoom"])
    if(!Number.isFinite(+G[k]))bad.push(k+"="+G[k]);
  if(G.ship&&(!Number.isFinite(G.ship.x)||!Number.isFinite(G.ship.y)))bad.push("ship");
  if(typeof G.mode!=="string"||!G.mode)bad.push("mode="+G.mode);
  if(!G.sys||!Array.isArray(G.sys.planets))bad.push("sys");
  return bad;
}

TEST_SUITES.push(() => suite("порченый сейв: любое поле не того типа — мир открывается, а не падает", () => {
  resetWorld(); fuzzRich();
  const base=JSON.stringify(snapshot());
  const keys=Object.keys(JSON.parse(base)).filter(k=>k!=="v");
  ok(keys.length>80,"полей в сейве: "+keys.length);
  const bad=[];let tried=0,drew=0;
  for(let i=0;i<keys.length;i++){
    const k=keys[i],muts=hsMut(JSON.parse(base)[k]);
    for(const m of muts){
      const s=JSON.parse(base);s[k]=m;
      resetWorld();
      tried++;
      let threw="";
      try{ applySave(s); }catch(e){ threw=(e&&e.message)||String(e); }
      if(threw){ bad.push(k+"="+JSON.stringify(m).slice(0,12)+" · "+threw); continue; }
      const sick=hsAlive();
      if(sick.length)bad.push(k+"="+JSON.stringify(m).slice(0,12)+" · "+sick.join(","));
    }
    /* раз в несколько полей — ещё и нарисовать стол: половина порчи видна
       только на отрисовке, а рисовать на каждой подмене вчетверо дороже */
    if(i%5===0){
      try{ tableTab="ether"; tableRender(); drew++; }
      catch(e){ bad.push(k+" · стол после загрузки: "+((e&&e.message)||e)); }
    }
  }
  resetWorld();
  ok(tried>250,"подмен проверено: "+tried+", столов нарисовано: "+drew);
  eq(bad.slice(0,6).join(" ;; "),"","ни одна подмена не уронила загрузку"+
    (bad.length?" (всего "+bad.length+")":""));
}));

TEST_SUITES.push(() => suite("порченый сейв: числа строками из облака остаются числами", () => {
  resetWorld(); fuzzRich();
  const base=JSON.parse(JSON.stringify(snapshot()));
  /* PHP умеет вернуть 600 как «600»: проходим по всему снимку и делаем это нарочно */
  const strify=(v,d)=>{
    if(d>6)return v;
    if(typeof v==="number")return String(v);
    if(Array.isArray(v))return v.map(x=>strify(x,d+1));
    if(v&&typeof v==="object"){const o={};for(const k in v)o[k]=strify(v[k],d+1);return o;}
    return v;
  };
  const s=strify(base,0);s.v=5;
  resetWorld();
  let threw="";
  try{ ok(applySave(s)!==false,"сейв со строками вместо чисел принят"); }
  catch(e){ threw=(e&&e.message)||String(e); ok(false,"загрузка сейва со строками: "+threw); }
  if(!threw){
    eq(hsAlive().join(","),"","после строкового сейва мир жив");
    for(const k of ["credits","fuel","hull","data","matches","bio"])
      eq(typeof G[k],"number","G."+k+" — число, а не текст (получено "+JSON.stringify(G[k])+")");
    /* арифметика: строка сложилась бы, а не прибавилась */
    const c0=G.credits;G.credits+=10;
    eq(G.credits,c0+10,"деньги складываются, а не склеиваются");
    G.credits=c0;
    /* и снимок после такого сейва тоже пишется */
    let js="";try{js=JSON.stringify(snapshot());}catch(e){ok(false,"снимок после строкового сейва: "+e.message);}
    ok(js.length>500,"снимок после строкового сейва пишется: "+js.length+" б");
  }
  resetWorld();
}));

TEST_SUITES.push(() => suite("порченый сейв: круг сейв→загрузка→сейв со второго раза неподвижен", () => {
  resetWorld(); fuzzRich();
  const cut=o=>{const c=JSON.parse(JSON.stringify(o));delete c.ts;delete c.log;return c;};
  const a=[];
  for(let i=0;i<4;i++){
    const s=snapshot();
    a.push(JSON.stringify(cut(s)));
    applySave(JSON.parse(JSON.stringify(s)));
  }
  /* первый круг вправе что-то нормализовать (Set в список, старое поле в новое);
     дальше снимок обязан стоять на месте — иначе он растёт с каждой загрузкой */
  const same=a[1]===a[2]&&a[2]===a[3];
  if(!same){
    /* назвать поле, а не «не совпало»: иначе это ребус */
    const b=JSON.parse(a[1]),c=JSON.parse(a[2]),moved=[];
    for(const k in b)if(JSON.stringify(b[k])!==JSON.stringify(c[k]))
      moved.push(k+": "+JSON.stringify(b[k]).slice(0,40)+" → "+JSON.stringify(c[k]).slice(0,40));
    for(const k in c)if(!(k in b))moved.push(k+": появилось");
    ok(false,"снимок неподвижен со второго круга, а сдвинулось: "+moved.slice(0,4).join(" ;; "));
  }else ok(true,"снимок неподвижен со второго круга ("+Math.round(a[1].length/1024)+" КБ)");
  /* и не растёт: четвёртый круг не тяжелее второго */
  ok(a[3].length<=a[1].length+64,"сейв не пухнет за круги: "+a[1].length+" → "+a[3].length+" б");
  resetWorld();
}));
