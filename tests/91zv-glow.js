/* ══════════════ свет, который помнит: флора-товар, пятна, сцены по громкости ══════════════ */
TEST_SUITES.push(()=>suite("уезд света: всё светится на окраине, пятна в ядре, проходы от громкого к тихому",()=>{
  resetWorld();
  const at=regionOfTheme("glow");ok(!!at,"область света расставлена");
  const R=regionAt(at.rx*REGION_SPAN,at.ry*REGION_SPAN);
  eq(R.needle,"actino","прибор — актинометр");
  eq(glowDepthAt(0,0),0,"дома области нет");
  G.sx=R.core.sx;G.sy=R.core.sy;G.sys=getSystem(G.sx,G.sy);G.mode="system";G.running=true;
  eq(glowDepthHere(),2,"мы в ядре");
  const pc=glowCorePlanet(G.sys);ok(!!pc,"у ядра есть планета");
  if(pc){
    ok(peepHere(pc),"на планете ядра луг есть всегда");
    const tr=genTerrain(pc);
    G.land={p:pc,tr,x:tr.padX,y:groundAt(tr,tr.padX)};
    enterSurface();
    const S=G.surf;
    ok(!!S.peep,"мат построен");
    ok(S.plants.every(pl=>pl.glow),"вся флора светится ("+S.plants.length+")");
    const gx=glowCaveX(S.peep,pc);
    ok(Math.abs(S.cave.x-clamp(gx,150,tr.W-150))<1,"устье стоит у края мата по ходу");
    eq(glowPatches(tr,pc).length,3,"три пятна по формам");
    ok(glowPatches(tr,pc).map(q=>q.k).join()==="rut,machine,found","колея, машина, фундамент");
    /* ярусы: 0 громкий с прожектором, 1 обычный, 2 тихий — один бегущий вплотную */
    S.peep.pass=0;let T=glowTier(S.peep,pc);ok(T&&T.k>1&&T.flash,"первый проход громкий, с прожектором");
    S.peep.pass=1;T=glowTier(S.peep,pc);ok(T&&T.k<1&&!T.flash&&!T.near,"второй обычный");
    S.peep.pass=2;T=glowTier(S.peep,pc);ok(T&&T.k<.5&&T.near>0&&T.scene.n===1&&T.scene.fast>1,"третий тихий: один бегущий, виден вплотную");
    S.peep.pass=3;T=glowTier(S.peep,pc);ok(T.flash,"и по кругу — снова громкий");
    /* скан светящегося растения кладёт ксенобиом */
    if(S.plants.length){G.cargo.xeno=0;glowScan(S.plants[0]);eq(G.cargo.xeno,1,"мох — товар: +1 ксенобиом");}
    /* кадр с тихим ярусом и темнотой не падает */
    S.peep.dk=.8;S.peep.ph=100;S.x=S.peep.x;S.cam=null;
    let okDraw=true;try{drawSurface();}catch(e){okDraw=false;}
    ok(okDraw,"поверхность ядра рисуется в темноте");
  }
  /* вне уезда скан ничего не добавляет и флора не трогается */
  G.sx=0;G.sy=0;G.sys=getSystem(0,0);G.surf=null;G.mode="system";
  G.cargo.xeno=0;glowScan({glow:true});eq(G.cargo.xeno,0,"дома мох не товар");
  ok(glowTier({pass:0,scene:{dir:1}},G.sys.planets[0])===null,"дома ярусов нет");
}));
