/* простой не трогает мир (лаборатория 15.10). Кадр системы и грунта в простое готовит наперёд: зал
   станции (hallPrepTick), флору планеты (plnKitTick), пещеру у устья (caveTick). Заготовка — кэш, мир она
   менять не вправе: 15.10 зал из простоя якорил истории (G.storyPin), и мир зависел от того, была ли
   видеокарта. Закон: те же N кадров с заготовками и без — один хэш мира. */
TEST_SUITES.push(()=>suite("простой не трогает мир: заготовки наперёд не меняют хэш",{tier:"browser"},()=>{
  const N=240,PREPS=["hallPrepTick","plnKitTick","caveTick"],bad=[];
  /* off: true — все заготовки выключены; имя — включена только эта (назвать виновника) */
  const run=(sc,off)=>{
    resetWorld();let ok0=true;try{ok0=sc.set()!==false;}catch(e){return null;}if(!ok0)return null;
    if(G.mode!=="system"&&G.mode!=="surface")return null;
    const saved={};for(const n of PREPS)saved[n]=globalThis[n];
    const loop0=LOOP_OFF,dw=drawWorld,hu=hud;LOOP_OFF=false;drawWorld=function(){};hud=function(){};
    if(off)for(const n of PREPS)if(n!==off)globalThis[n]=function(){};
    try{for(let i=0;i<N;i++)frameBody(wallMs());}catch(e){return "сбой "+e.message;}
    finally{LOOP_OFF=loop0;drawWorld=dw;hud=hu;hallPrepTick=saved.hallPrepTick;plnKitTick=saved.plnKitTick;caveTick=saved.caveTick;}
    return Object.assign(stateHashParts(),{"(весь мир с часами и rnd)":stateHash()});
  };
  let ran=0;
  /* самопроверка: подложенная заготовка, пишущая в мир, обязана быть поймана — иначе закон слеп */
  {const sc=lookScenes().find(s=>{resetWorld();try{s.set();}catch(e){return false;}return G.mode==="system";});
   if(sc){const ht=hallPrepTick;hallPrepTick=function(){G.labIdlePlant=(G.labIdlePlant|0)+1;return ht();};
     let a,b;try{b=run(sc,true);a=run(sc,false);}finally{hallPrepTick=ht;delete G.labIdlePlant;}
     ok(a&&b&&typeof a==="object"&&a["(весь мир с часами и rnd)"]!==b["(весь мир с часами и rnd)"],"СЛЕПО: подложенная запись в мир из простоя не поймана");}
   else ok(false,"нет сцены системы для самопроверки");}
  for(const sc of lookScenes()){
    const a=run(sc,false);if(a==null)continue;
    const b=run(sc,true);ran++;
    if(typeof a==="string"||typeof b==="string"){bad.push(sc.id+": "+(typeof a==="string"?a:b));continue;}
    const diff=Object.keys(Object.assign({},a,b)).filter(k=>a[k]!==b[k]);
    if(diff.length){
      const who=PREPS.filter(n=>{const c=run(sc,n);return c&&typeof c==="object"&&Object.keys(b).some(k=>c[k]!==b[k]);});
      bad.push(sc.id+": заготовки ("+(who.join(", ")||"только вместе")+") сдвинули "+diff.slice(0,8).join(", "));}
  }
  ok(ran>=2,"сцен системы и грунта прогнано "+ran);
  ok(!bad.length,"простой меняет мир: "+bad.join("; "));
  resetWorld();
}));
