/* Абордаж на движке (22.10, правило «2D не должно быть»): кадр рейда не рисует на #c ничего —
   метки, полоски здоровья, выстрелы и красный удар ложатся фигурами набора в проход поверх.
   Мера — сами копии #c на видеокарту: после первого кадра (он чистит слой) их ноль. Настоящий G,
   настоящий кадр (gpuManual). */
TEST_SUITES.push(()=>suite("абордаж на движке: #c не копируется, метки — фигурами",{tier:"browser"},()=>{
  resetWorld();
  if(!ok(GPU.ok&&!!GPU.dev,"видеокарта поднялась"))return;
  if(!ok(rcRaid(),"абордаж открыт"))return;
  const S=G.raid,ax=Math.sin(S.a),az=Math.cos(S.a);
  /* всё, что рисует метку, — прямо перед ходоком, в его отсеке */
  const L=S.loot.find(l=>!l.taken);if(L){L.x=S.x+ax*70;L.z=S.z+az*70;}
  const P=S.picks.find(p=>!p.taken);if(P){P.x=S.x+ax*55-az*20;P.z=S.z+az*55+ax*20;}
  const F=S.foes.find(f=>f.hp>0);if(F){F.x=S.x+ax*80+az*25;F.z=S.z+az*80-ax*25;F.hp=F.hpMax*.5;}
  S.shots.push({x:S.x+ax*40,z:S.z+az*40,vx:ax*9,vz:az*9,life:60,dmg:1,mine:true});
  S.hurt=6;
  const q=GPU.dev.queue,cp0=q.copyExternalImageToTexture,sh0=window.gpuShapes;
  let copies=0;const cols={};
  q.copyExternalImageToTexture=function(src){if(src&&src.source===cvs)copies++;return cp0.apply(this,arguments);};
  window.gpuShapes=function(pass,items){for(const it of items||[])cols[it[7]+","+it[8]+","+it[9]]=(cols[it[7]+","+it[8]+","+it[9]]||0)+1;return sh0.apply(this,arguments);};
  try{
    drawWorld();copies=0;
    for(let i=0;i<3;i++){S.hurt=6;drawWorld();}
  }finally{q.copyExternalImageToTexture=cp0;window.gpuShapes=sh0;}
  eq(G.mode,"raid","кадр рисовался в абордаже");
  eq(copies,0,"#c за три кадра абордажа ни разу не ушёл на видеокарту");
  eq(GPU.cState,0,"слой #c после кадра пуст");
  ok(cols["255,50,40"]>=3,"красный удар — фигурой поверх кадра, каждый кадр");
  ok(cols["127,230,216"]>=3,"свой выстрел (и маячок лута) — фигурами набора");
  if(F)ok(Object.keys(cols).some(k=>/^(242,178,92|255,90,70|255,140,90)$/.test(k)),"полоска здоровья врага — фигурой набора");
  ok(typeof drawPirateBase==="function"&&!/ctx\./.test(String(drawPirateBase)),"пиратская база снаружи — без 2D-запасного хода");
}));
