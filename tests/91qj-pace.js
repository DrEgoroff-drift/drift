/* ══════════════ темп мира: фон не носится (Зрение 2.0, закон «темп») ══════════════ */
/* Автор, 15.10: «животные очень быстро на фоне бегают, и птицы». Дальнее стадо шло .9 м за
   кадр G.t — 54 м/с, двести вёрст в час, полоса в 150 м пролеталась за три секунды. Глазом
   этого на стенде не видно (кадр неподвижен), числом — сразу. G.t идёт 60 в секунду
   (28-loop: квант .5 на 8.33 мс). Пределы — живые: шаг стада до 4 м/с, стая до 30 м/с. */
TEST_SUITES.push(()=>suite("темп мира: дальние звери и стаи в живых скоростях",{tier:"node"},()=>{
  resetWorld();
  const PER_S=60,seen={ground:0,air:0};
  for(let sx=-3;sx<=3&&(seen.ground<3||seen.air<3);sx++)for(let sy=-3;sy<=3;sy++){
    if(!starAt(sx,sy))continue;
    for(const p of getSystem(sx,sy).planets||[]){
      if(p.type==="gas")continue;
      const sps=faunaOf(p);if(!sps||!sps.length)continue;
      for(const g of plnBeastFarKit(sps).groups){
        const ms=Math.abs(g.v)*PER_S,lim=g.air?30:4;
        seen[g.air?"air":"ground"]++;
        if(!ok(ms<=lim,(g.air?"стая":"стадо")+" "+p.name+": "+ms.toFixed(1)+" м/с при пределе "+lim))return;
      }
    }
  }
  ok(seen.ground>0&&seen.air>0,"нашлись и стада, и стаи: "+seen.ground+"/"+seen.air);
  resetWorld();
}));
