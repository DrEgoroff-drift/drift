/* ══════════════ дома как язык форм: знак на станции и в посёлке, вымпел цветом дома ══════════════ */
TEST_SUITES.push(()=>suite("дома: у каждого своя форма, станция и посёлок её несут",()=>{
  resetWorld();
  eq(HOUSES.length,4,"четыре дома");
  const H=houseOf(G.sys);ok(!!H,"у стартовой станции есть дом");
  ok(housePennant()!=="rgba(226,120,70,.9)","вымпел посёлка — цветом дома");
  let okDraw=true;try{for(const h of HOUSES){ctx.save();houseMark(h,{a:1,b:1,n:3,ph:0});houseWallMark(h,0,0,20,16);ctx.restore();}}catch(e){okDraw=false;}
  ok(okDraw,"все четыре знака рисуются");
  G.mode="system";okDraw=true;try{drawSystem();}catch(e){okDraw=false;}ok(okDraw,"станция со знаком рисуется");
  G.sys={sx:5,sy:5,key:"5,5",seed:1,planets:[]};eq(houseOf(G.sys),null,"без станции дома нет");
  eq(housePennant(),"rgba(226,120,70,.9)","и вымпел обычный");
  G.sys=getSystem(0,0);
}));
