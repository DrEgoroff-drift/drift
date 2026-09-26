/* ══════════════ посадка на видеокарте (G6, флот «landing», 19g) ══════════════
   Узел Node рисует в заглушку, видеокарты у него нет: здесь проверяется то, что
   держит кадр без картинки. Выпечка тела корабля — без живого (факел, маяк, дым,
   тлеющие сопла, свет и тени на грунте), иначе они застынут в текстуре; живое —
   без тела, иначе корпус ляжет дважды; слои видеокарты без устройства молчат, а
   не падают; сглаженная тяга факела живёт вне G — кадр не трогает хэш мира. */

/* заглушка-счётчик: вызовы, заливки, «lighter» — ровно то, что нужно различить */
function lgRecCtx(){
  const log={calls:0,fills:0,lighter:0};
  const grad=()=>({addColorStop(){}});
  const P=new Proxy({},{
    get(t,k){
      if(k in t)return t[k];
      if(k==="createLinearGradient"||k==="createRadialGradient")return grad;
      if(k==="measureText")return ()=>({width:0});
      return function(){log.calls++;if(k==="fill")log.fills++;};
    },
    set(t,k,v){t[k]=v;if(k==="globalCompositeOperation"&&v==="lighter")log.lighter++;return true;}});
  return {P,log};
}
function lgDrawRec(broken,fire,opt){
  const R=lgRecCtx(),old=ctx,oF=drawFlame,oG=glowBlit;
  const n={flame:0,glow:0};
  drawFlame=function(){n.flame++;};glowBlit=function(){n.glow++;};
  ctx=R.P;
  try{drawLander(broken,fire,opt);}finally{ctx=old;drawFlame=oF;glowBlit=oG;}
  return {log:R.log,flame:n.flame,glow:n.glow};
}
TEST_SUITES.push(()=>suite("посадка G6: выпечка тела без живого, живое без тела",()=>{
  resetWorld();
  const p=G.sys.planets.find(q=>q.type!=="gas")||G.sys.planets[0];
  startLanding(p);
  const tr=G.land.tr,base={gear:1,sq:.2,hot:1,landed:true,tr,gx:G.land.x};
  const full=lgDrawRec(true,true,base);
  ok(full.flame===3&&full.glow===1,"2D-путь (поверхность, тесты) рисует три факела и зарево: "+full.flame+"/"+full.glow);
  const bake=lgDrawRec(true,true,Object.assign({bake:true},base));
  ok(bake.flame===0,"выпечка: факелов нет — огонь живой ("+bake.flame+")");
  ok(bake.glow===0,"выпечка: зарева тяги нет — свет кладёт поле ("+bake.glow+")");
  ok(bake.log.lighter===0,"выпечка: ни одного «lighter» — свет люка и сопел не застывает в текстуре");
  ok(bake.log.fills>20,"выпечка: тело нарисовано ("+bake.log.fills+" заливок)");
  const live=lgDrawRec(true,true,Object.assign({live:true},base));
  ok(live.flame===0,"живое: факелов 2D нет — они бьют полем видеокарты вниз ("+live.flame+")");
  ok(live.glow===0,"живое: зарево — светом поля, не пятном ("+live.glow+")");
  ok(live.log.fills<bake.log.fills/3,"живое: тела нет — "+live.log.fills+" заливок против "+bake.log.fills);
  const idle=lgDrawRec(false,false,Object.assign({live:true},base));
  ok(idle.flame===0&&idle.log.fills===0,"живое без тяги и поломки — пусто ("+idle.log.fills+" заливок)");
}));
TEST_SUITES.push(()=>suite("посадка G6: слои без устройства молчат, кадр не трогает хэш мира",()=>{
  resetWorld();
  const p=G.sys.planets.find(q=>q.type!=="gas")||G.sys.planets[0];
  startLanding(p);
  const L=G.land,tr=L.tr;
  ok(lgRidges(p,tr,0,0,0)===false,"гряды без видеокарты: false, без исключения");
  ok(lgUnder(L,tr,0,0,p)===false,"тень и факел без видеокарты: false");
  ok(lgLander(L,tr,0,0,p)===false,"корабль без видеокарты: false");
  L.thrOn=false;drawLanding();
  const h0=stateHash();
  L.thrOn=true;
  for(let i=0;i<4;i++)drawLanding();
  L.thrOn=false;
  ok(stateHash()===h0,"четыре кадра с тягой не сдвигают хэш мира: сглаженная тяга — вне G");
}));
