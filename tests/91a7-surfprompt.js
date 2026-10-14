/* Подсказка поверхности: пустая стена и осмотренный камень не глушат залежь рядом (плейтест 09.10). */
TEST_SUITES.push(()=>suite("поверхность: стена и камень уступают залежи",()=>{
  resetWorld();
  let hit=null;
  for(const type of ["terran","ocean","desert","ice","tundra"]){
    const p=G.sys.planets.find(x=>x.type!=="gas")||G.sys.planets[0];
    p.type=type;p.T=TYPES[type]||p.T;p.mix=null;p.mw=null;
    p.rough=Math.min(1.2,p.T.rough);p.res=worldRes(type,null,null);
    for(const k of ["tex","mat","strata","geo","bio","biome","flora","fauna2","fauna3","caveFlora"])delete p[k];
    if(!settleCanLive(p))continue;
    const tr=genTerrain(p);
    if(settleWallHereX(p,tr)==null)continue;
    G.land={p,tr,x:tr.padX,y:groundAt(tr,tr.padX)};
    enterSurface();
    hit={p,tr};break;
  }
  ok(!!hit,"найден мир с посёлком и стеной");
  if(!hit)return;
  const S=G.surf,wx=settleWallHereX(S.p,S.tr);
  S.deposits=[{x:wx,res:S.p.res&&S.p.res[0]||"iron",left:5,amt:5,q:1,id:"t1"}];
  S.x=wx;S.y=groundAt(S.tr,wx);S.on=true;S.vy=0;S._wallX=wx;
  G.prompt="";
  updateSurface(.01);
  ok(!/^СТЕНА/.test(G.prompt)||wallCanSign(WALL_S),"у пустой стены с залежью подсказка не про стену: «"+G.prompt+"»");
  S.deposits=[];
  G.prompt="остаток";
  updateSurface(.01);
  ok(G.prompt!=="остаток","ветка стены всегда пишет строку: «"+G.prompt+"»");
}));
