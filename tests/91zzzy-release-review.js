/* Регрессии проверки выпуска: оплаченная тяга и груз между сеансами. */
suite("проверка выпуска: топливо и груз узла",{tier:"node"},()=>{
  resetWorld();
  G.fuel=50;G.energy=100;
  const c=ctlReset();Object.assign(c,{assist:true,ax:-1,ay:0,head:null,turn:0,brake:false});
  Object.assign(G.ship,{a:0,vx:0,vy:0});
  helmApply(1,stat(),G.ship,10);
  ok(G.ship.vx<0,"стик разгоняет назад");
  ok(G.fuel<50,"разгон назад расходует топливо");
  G.pnode={key:"0,0/0",sx:0,sy:0,idx:0,name:"узел",res:["iron"],stock:{iron:20},made:now(),last:now(),hauled:0,calls:1};
  G.barges=[{pload:{iron:7}}];
  const s=JSON.parse(JSON.stringify(snapshot()));
  eq(s.pnode.stock.iron,27,"неснятый груз переживает сохранение");
  eq(G.pnode.stock.iron,20,"сохранение не меняет живой склад");
  eq(G.barges[0].pload.iron,7,"сохранение не забирает груз у живой баржи");
  applySave(s);
  eq(G.pnode.stock.iron,27,"груз восстановлен без потери");
  eq(G.barges.length,0,"старый борт не удваивает восстановленный груз");
  eq(snapshot().pnode.stock.iron,27,"повторная запись не создаёт груз");
});
