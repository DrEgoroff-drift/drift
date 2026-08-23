/* ══════════════ автотесты: скафандр как комплект (M152) ══════════════ */
TEST_SUITES.push(()=>suite("комплект: шесть мест, I класс выдан всем, строка паспорта",()=>{
  resetWorld();
  G.kit=null;G.kitShelf=[];
  const K=kitAll();
  eq(Object.keys(K).length,6,"шесть мест");
  ok(KIT_PLACES.every(p=>K[p]&&K[p].p===p&&K[p].cls===1),"везде I класс");
  const s=kitStat();
  eq(s.charge,100,"заряд I класса — 100");
  eq(suitMax(),100,"suitMax согласован");
  ok(/заряд 100 · ход/.test(kitLine()),"строка паспорта: "+kitLine());
}));

TEST_SUITES.push(()=>suite("комплект: каждое место крутит ровно свои ручки, вес — общая валюта",()=>{
  resetWorld();
  G.kit=null;G.kitShelf=[];
  const base=kitStat();
  const K=kitAll();
  /* корпус: заряд и броня вверх, ход и расход ранца вниз */
  K.torso=kitPiece("torso",3,0,1);
  let s=kitStat();
  ok(s.charge>base.charge&&s.armor>base.armor,"корпус III: заряд "+s.charge+", броня "+s.armor);
  ok(s.walk<base.walk,"и ход медленнее: "+s.walk+" < "+base.walk);
  ok(s.jetBurn>base.jetBurn,"и ранец жжёт больше: "+s.jetBurn.toFixed(2));
  ok(s.wear<base.wear,"заряд уходит медленнее (suitWear): "+s.wear.toFixed(2));
  eq(s.lamp,base.lamp,"фонарь не тронут");
  eq(s.drill,base.drill,"бур не тронут");
  K.torso=kitPiece("torso",1,0,0);
  /* ботинки: ход и шум */
  K.boots=kitPiece("boots",3,0,2);s=kitStat();
  ok(s.walk>base.walk,"ботинки III: ход быстрее "+s.walk);
  ok(s.noise>base.noise,"и шумнее: "+s.noise.toFixed(2));
  K.boots=kitPiece("boots",1,0,0);
  /* фонарь: свет и расход */
  K.lamp=kitPiece("lamp",3,0,3);s=kitStat();
  ok(s.lamp>base.lamp&&s.lampDrain>base.lampDrain,"фонарь III: свет "+s.lamp.toFixed(2)+", расход "+s.lampDrain.toFixed(2));
  K.lamp=kitPiece("lamp",1,0,0);
  /* перчатки: бур и точность */
  K.gloves=kitPiece("gloves",2,0,4);s=kitStat();
  ok(s.drill>base.drill&&s.precision<base.precision,"перчатки II: бур "+s.drill.toFixed(2)+", точность "+s.precision.toFixed(2));
  K.gloves=kitPiece("gloves",1,0,0);
  /* шлем: сканирование */
  K.helmet=kitPiece("helmet",2,0,5);s=kitStat();
  ok(s.scan>base.scan,"шлем II: сканирование "+s.scan.toFixed(2));
  K.helmet=kitPiece("helmet",1,0,0);
  /* ранец */
  K.pack=kitPiece("pack",3,0,6);s=kitStat();
  ok(s.jetFuel>base.jetFuel&&s.jetRegen>base.jetRegen,"ранец III: запас "+s.jetFuel.toFixed(2)+", восстановление "+s.jetRegen.toFixed(2));
  K.pack=kitPiece("pack",1,0,0);
  /* износ: ношеная вещь даёт меньше новой; чужая — не латается */
  K.torso=kitPiece("torso",3,1,7);const worn=kitStat().charge;
  K.torso=kitPiece("torso",3,0,7);const fresh=kitStat().charge;
  ok(worn<fresh,"ношеный корпус слабее нового: "+worn+" < "+fresh);
  K.torso=kitPiece("torso",3,3,7);
  ok(!kitCanMod(K.torso,"seam"),"чужая вещь заплат не берёт");
  K.torso=kitPiece("torso",1,0,0);
}));

TEST_SUITES.push(()=>suite("комплект: ручки игры читают комплект — заряд, броня, расход",()=>{
  resetWorld();
  G.kit=null;kitAll().torso=kitPiece("torso",3,0,1);
  eq(suitMax(),180,"корпус III — заряд 180");
  const st=stat();
  ok(st.suitWear<1/(1+techLv("suit")*.55),"stat().suitWear учитывает корпус: "+st.suitWear.toFixed(3));
  G.kit=null;
}));

TEST_SUITES.push(()=>suite("комплект: полка, надеть, починить, заплата с гнёздами и ценой",()=>{
  resetWorld();
  G.kit=null;G.kitShelf=[];G.things=[];G.credits=5000;G.cargo.alloy=2;
  const x=kitGive(kitPiece("helmet",2,1,9),"проверка");
  eq(kitShelf().length,1,"вещь на полке");
  ok(G.things.some(t=>t.k==="kit"),"и бумага о ней на столе");
  ok(kitWearPiece(0),"надели");
  eq(kitAll().helmet.cls,2,"на голове II класс");
  eq(kitShelf().length,1,"прежний шлем лёг на полку");
  const H=kitAll().helmet;
  const c0=G.credits;
  ok(kitRepair(H),"ношеный починен");
  eq(H.wear,2,"теперь латаный");
  ok(G.credits<c0,"за деньги");
  ok(kitAddMod(H,"glass"),"запасное стекло поставлено");
  ok(!kitAddMod(H,"glass"),"второй раз то же — нельзя");
  ok(kitAddMod(H,"seam"),"усиленный шов — второе гнездо");
  ok(!kitCanMod(H,"heat"),"подогрев на шлем не ставится, да и гнёзда кончились");
  ok(kitStat().scan>1.2,"стекло читается в характеристиках: "+kitStat().scan.toFixed(2));
  G.kit=null;G.kitShelf=[];
}));

TEST_SUITES.push(()=>suite("комплект: склад института выдаёт по обороту, раз в окно",()=>{
  resetWorld();
  G.kit=null;G.kitShelf=[];G.kitDepot={};G.home=homeInit();G.home.turn=0;
  let S=null;
  for(let x=-12;x<=12&&!S;x++)for(let y=-12;y<=12&&!S;y++){
    if(!starAt(x,y))continue;const T=getSystem(x,y);
    if(T&&T.station&&(T.station.stype==="sci"||T.station.stype==="indust"))S=T;
  }
  ok(!!S,"научная или промышленная станция рядом есть");
  eq(kitDepotOf(S),null,"без оборота склад не выдаёт");
  G.home.turn=10000;
  const D=kitDepotOf(S);
  ok(!!D&&D.cls===2,"с прихожей — II класс");
  ok(!!kitDepotTake(S),"получили");
  eq(kitDepotOf(S),null,"второй раз в это окно — нет");
  G.home.turn=80000;G.kitDepot={};
  const D3=kitDepotOf(S);ok(!!D3&&D3.cls===3,"с гаража — III класс");
  G.kit=null;G.kitShelf=[];G.kitDepot={};
}));

TEST_SUITES.push(()=>suite("комплект: переживает сохранение",()=>{
  resetWorld();
  G.kit=null;G.kitShelf=[];
  kitAll().boots=kitPiece("boots",2,1,3);kitAll().boots.mods=["knee"];
  kitGive(kitPiece("lamp",3,3,4),"т");
  const s=snapshot();
  G.kit=null;G.kitShelf=[];
  applySave(JSON.parse(JSON.stringify(s)));
  eq(kitAll().boots.cls,2,"ботинки II класса вернулись");
  eq(kitAll().boots.mods[0],"knee","с заплатой");
  eq(kitShelf().length,1,"полка вернулась");
  eq(kitShelf()[0].wear,3,"с чужим слоем");
  G.kit=null;G.kitShelf=[];
}));
