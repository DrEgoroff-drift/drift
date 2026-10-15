/* Хаос облака (лаборатория 15.10; Fetch.requestPaused/offline-практика): облако прислало запись
   НОВЕЕ местной, но читать её нельзя — без версии, обрезанную, с чужим форматом. cloudBoot сравнивает
   одни отметки времени и кладёт такую запись поверх живой местной: после этого «Продолжить» молча
   не грузит ничего, а хорошая местная запись уже стёрта. Закон: после любого ответа облака местная
   запись либо прежняя, либо новая и читается. Подмена облака — clWith из 91zzzzzr-cloud. */
TEST_SUITES.push(()=>suite("облако: новая, но нечитаемая запись не стирает местную",{tier:"node"},()=>{
  resetWorld();
  const mine=clSave(20000,424242);
  const big=9e12;
  const full=clSave(big,515151);
  const answers=[
    ["без версии",{ok:true,save:{ts:big,credits:5}}],
    ["версия 99",{ok:true,save:Object.assign({},full,{v:99})}],
    ["версия строкой",{ok:true,save:Object.assign({},full,{v:"5"})}],
    ["только версия и время",{ok:true,save:{v:5,ts:big}}],
    ["деньги строкой-мусором",{ok:true,save:Object.assign({},full,{credits:"много"})}],
    ["целая и новая",{ok:true,save:full}]
  ];
  const bad=[];
  for(const [name,a] of answers){
    stSet(SAVE_KEY,JSON.stringify(mine));
    let threw="";
    clWith(a,()=>{try{cloudBoot(()=>{});}catch(e){threw=e.message;}});
    if(threw){bad.push(name+": cloudBoot бросил "+threw);continue;}
    let now=null;try{now=JSON.parse(stGet(SAVE_KEY));}catch(e){}
    const same=now&&now.ts===20000&&now.credits===424242;
    resetWorld();
    let loads=false;try{loads=loadGame();}catch(e){}
    if(!same&&!loads)bad.push(name+": местная запись заменена нечитаемой (ts "+(now&&now.ts)+")");
    if(name==="целая и новая"&&!(now&&now.ts===big&&loads))bad.push("целая и новая запись не легла или не читается");
  }
  ok(!bad.length,"облако поверх местной: "+bad.length+(bad.length?" — "+bad.join("; "):""));
  try{stDel(SAVE_KEY);}catch(e){}
  resetWorld();
}));
