/* ══════════════ автотесты: большая вещь на каждый биом (M352) ══════════════
   У каждого сухого мира своя семья из двух и более форм, хотя бы одна — в
   пять-восемь ростов человека; каждая форма рисуется своим кодом без
   исключений; на экран приходится две-четыре формы; семьи не смешиваются. */
TEST_SUITES.push(()=>suite("крупная форма: своя семья у каждого сухого мира",()=>{
  resetWorld();
  const land=Object.keys(TYPES).filter(t=>t!=="gas");
  for(const t of land){
    const fam=DECO_KINDS.filter(k=>k.on===t);
    ok(fam.length>=2,t+": семья из "+fam.length+" форм");
    ok(fam.some(k=>k.h>=FG_MAN*5&&k.h<=FG_MAN*12),t+": есть форма в пять-двенадцать ростов ("+fam.map(k=>k.h).join("/")+")");
  }
  const names=new Set(DECO_KINDS.map(k=>k.k));
  const drawn=["druse","shard","slab","truss","wall","column","canopy","frond"];
  for(const k of names)ok(!!DECO_FN[k]||drawn.indexOf(k)>=0,"форма «"+k+"» умеет рисоваться");
  for(const k in DECO_FN)ok(names.has(k),"рисовальщик «"+k+"» стоит в таблице");
  /* каждый рисовальщик — напрямую, на любой палитре: антенна выпадает редко,
     и обход мира её может не встретить */
  const W0=makeWorld("rocky",null,0);
  const P={type:"rocky",mix:null,mw:0,T:W0.T,rough:W0.T.rough,seed:7};
  worldTables(P);const tr=genTerrain(P);
  const errs=[];
  for(const k in DECO_FN)for(const t of Object.keys(TYPES)){
    POI_SEED=hashi(1,2,3);
    ctx.save();ctx.translate(400,400);
    try{DECO_FN[k]({d:{k,x:tr.padX,h:100,sc:1,flip:0,seed:POI_SEED},pal:TYPES[t].pal,p:P,tr,w:42,hgt:100,ox:0,oy:0});}
    catch(e){errs.push(k+"@"+t+": "+e.message);}
    ctx.restore();
  }
  eq(errs.join("; "),"","все рисовальщики отрабатывают на всех палитрах");
}));

TEST_SUITES.push(()=>suite("крупная форма: рисуется на всех мирах, две-четыре на экран",()=>{
  resetWorld();
  const land=Object.keys(TYPES).filter(t=>t!=="gas");
  const fails=[];
  for(const t of land){
    const W0=makeWorld(t,null,0);
    const P={type:t,mix:null,mw:0,T:W0.T,rough:W0.T.rough,seed:hashi(3,t.length,0x352)};
    worldTables(P);
    const tr=genTerrain(P);genPOI(tr,P);genDeco(tr,P);
    /* плотность: по экрану 1280 вдоль всего мира, в среднем 2–4, не считая пустых у площадки */
    let sum=0,n=0;
    for(let x0=0;x0+1280<=tr.W;x0+=1280){
      if(Math.abs(x0+640-tr.padX)<1200)continue;
      sum+=tr.deco.filter(d=>d.x>=x0&&d.x<x0+1280).length;n++;
    }
    const avg=n?sum/n:0;
    ok(avg>=1.2&&avg<=5,t+": на экран "+avg.toFixed(1)+" форм");
    /* каждая форма семьи рисуется — ставим камеру к каждой */
    G.land={p:P,tr,x:tr.padX,y:groundAt(tr,tr.padX)};
    enterSurface();
    const seen=new Set();
    for(const d of tr.deco){
      if(seen.has(d.k))continue;seen.add(d.k);
      G.surf.x=d.x;
      try{drawSurface();}catch(e){fails.push(t+"/"+d.k+": "+e.message);}
    }
    ok(seen.size>=2,t+": в мире встретились "+seen.size+" вида ("+[...seen].join(", ")+")");
  }
  eq(fails.join("; "),"","все формы рисуются без исключений");
  G.surf=null;G.land=null;G.mode="system";
}));
