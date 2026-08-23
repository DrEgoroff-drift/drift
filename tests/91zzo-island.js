/* ══════════════ автотесты: Остров Забвения (M160) ══════════════ */
TEST_SUITES.push(()=>suite("Остров: письмо у стойки, посадка с письмом вместо абордажа, табло через неделю",()=>{
  resetWorld();
  G.exp={phase:2,day0:celDay()-61,depDay:celDay()-1,coll:{},gone:[],gave:0,pax:null,said:1};G.island=null;G.things=[];G.log=[];
  eq(ISLAND_LETTERS.length,3,"три письма — три имени");
  const l=ISLAND_LETTERS[1];
  ok(islandTake(l),"взяли письмо Ефиму");
  eq(islandHeld().length,1,"одно на руках");
  const PB={name:"Чёрная Гряда",x:0,y:0};
  G.log=[];
  ok(islandLand(PB),"сели с письмом — без боя");
  ok(G.log.some(x=>x.k==="talk"&&x.s.indexOf(l.text)>=0),"Ефим прочитал вслух");
  eq(islandHeld().length,0,"письмо отдано");
  eq(islandReturned().length,0,"на табло пока никого");
  G.t+=CEL_DAY*7;
  eq(islandReturned()[0],l.who,"через неделю — на табло: "+l.who);
  const s=snapshot();G.island=null;applySave(JSON.parse(JSON.stringify(s)));
  eq(islandReturned().length,1,"пережил сохранение");
  G.exp=null;G.island=null;
}));
