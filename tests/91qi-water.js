/* ══════════════ одна вода везде (M634) ══════════════ */
/* Вода планеты и пещеры — один модуль 21pw: точка входа fs_water есть только у него, сцены его
   подключают и своей воды не держат. Океанский мир ведёт море до горизонта лентами в глубину,
   острова встают из листа, зыбь — у моря полная, у озера малая, у сухого мира нет. Как вода
   выглядит (разброс тона по полосе, доля зеркала) меряет кадр: docs/look/game/water.py. */
function wq634World(type){
  resetWorld();
  const p=G.sys.planets.find(x=>x.type!=="gas")||G.sys.planets[0];
  p.type=type;p.T=TYPES[type]||p.T;p.mix=null;p.mw=null;
  p.rough=Math.min(1.2,p.T.rough);p.res=worldRes(type,null,null);
  for(const k of ["tex","mat","strata","geo","bio","biome","flora","fauna2","fauna3","caveFlora"])delete p[k];
  const tr=genTerrain(p);
  G.land={p,tr,x:tr.padX,y:groundAt(tr,tr.padX)};
  enterSurface();
  return plnLandMake(G.surf.tr,G.surf.p,G.surf.shipX);
}
TEST_SUITES.push(()=>suite("вода: один модуль на планету и пещеру, море до горизонта (M634)",()=>{
  /* ── шов: fs_water только в 21pw; обе точки входа стоят на одном ядре глади ── */
  for(const [n,s] of [["PLN_WGSL_SCENE",PLN_WGSL_SCENE],["PLN_WGSL_WX",PLN_WGSL_WX],["CAVE3_WGSL_SCENE",CAVE3_WGSL_SCENE]])
    ok(s.indexOf("fs_water")<0,n+" своей воды не держит");
  ok(PLN_WGSL_WATER.indexOf("fn fs_water")>0&&PLN_WGSL_WATER_CAVE.indexOf("fn fs_water")>0,"у планеты и у пещеры своя точка входа");
  ok(PLN_WGSL_WATER.startsWith(PLN_WGSL_WATER_CORE)&&PLN_WGSL_WATER_CAVE.startsWith(PLN_WGSL_WATER_CORE),"обе — на ядре waterSurf/waterLook");
  ok(CAVE3_MAT.water!==CAVE3_MAT.vein&&CAVE3_MAT.water!==CAVE3_MAT.veil,"материал воды пещеры свой: "+CAVE3_MAT.water+" / жила "+CAVE3_MAT.vein);
  /* ── зеркало: объектив отражён в уровне, матрица — отражение уровня ── */
  const e=plnWaterEye([3,7,-2],1.5);
  ok(e[0]===3&&e[1]===-4&&e[2]===-2,"объектив в зеркале уровня: "+e);
  eq(plnWaterRows(0,1,.3).length,5,"ряды глади накрывают отрезок целиком");
  /* ── океан: море до горизонта ── */
  const L=wq634World("ocean");
  ok(L.sea&&L.wet,"океанский мир — море");
  const S=L.jobs.filter(J=>J.t==="sea");
  eq(S.length,3,"три ленты моря");
  ok(S[0].za<=140&&S[S.length-1].zb>=30000,"море от ложбины до горизонта: "+S[0].za+"…"+S[S.length-1].zb);
  ok(S.every(J=>plnLandSees(J,0,{hw:10,D:30},0)),"ленты моря видны всегда");
  let isl=0,tot=0;
  for(const J of S){
    const m=plnWaterSea(L,J);
    ok(m.ni>0,"лента "+J.za+"…"+J.zb+" не пустая: "+m.ni);
    for(let z=J.za;z<J.zb;z*=1.5)for(let i=0;i<=40;i++){const x=-plnLandE(z)+(L.len+2*plnLandE(z))*i/40;tot++;if(plnLandFarH(L,x,z)>PLN_LAND.wRel)isl++;}
  }
  ok(isl>0&&isl<tot*.5,"острова встают из моря, но море — больше половины: суши "+isl+" из "+tot);
  eq(plnWaterSwell(L),1,"у моря зыбь полная");
  /* ── озеро и сухой мир ── */
  const T=wq634World("terran");
  ok(!T.sea&&!T.jobs.some(J=>J.t==="sea"),"у земного мира моря нет");
  ok(!T.wet||plnWaterSwell(T)===.15,"у озера зыбь малая");
  const D=wq634World("desert");
  ok(D.wet||plnWaterSwell(D)===0,"у сухого мира зыби нет");
}));
