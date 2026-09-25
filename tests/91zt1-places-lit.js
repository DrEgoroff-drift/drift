/* ══════════════ фонари мест: список кадра и то, что его зажигает (11va) ══════════════ */
TEST_SUITES.push(()=>suite("фонари мест: живут кадр, лишние — слабейшие, за экраном не зажигаются",{tier:"node"},()=>{
  resetWorld();
  G.t=1000;
  placeLamp(100,100,50,[1,.8,.5],1,10);
  eq(placeLampsN(),1,"фонарь зажжён");
  placeLamp(-400,100,50,[1,.8,.5],1,10);
  eq(placeLampsN(),1,"за экраном фонарь не зажигается");
  placeLamp(100,100,50,[1,.8,.5],0,10);
  eq(placeLampsN(),1,"нулевая сила — не фонарь");
  G.t=1001;
  eq(placeLampsN(),0,"новый кадр — список пуст");
  placeLamp(100,100,50,[1,.8,.5],1,10);
  eq(placeLampsN(),1,"и заводится заново");
  /* полон: слабый не входит, сильный вытесняет слабейший */
  G.t=1002;
  for(let i=0;i<PL_MAX;i++)placeLamp(10+i*10,100,20,[1,1,1],.5,5);
  eq(placeLampsN(),PL_MAX,"список полон");
  placeLamp(50,50,20,[1,1,1],.1,5);
  let weak=0;for(let i=0;i<PL_MAX;i++)if(PL.a[i*8+7]<.2)weak++;
  eq(weak,0,"слабый в полный список не входит");
  placeLamp(50,50,200,[1,1,1],1,5);
  let big=0;for(let i=0;i<PL_MAX;i++)if(PL.a[i*8+2]===200)big++;
  eq(big,1,"сильный вытесняет слабейший");
  eq(placeLampsN(),PL_MAX,"и список не растёт");
  /* окно: hz<0 держится знаком (у окна нет точки-лампы) */
  G.t=1003;placeLamp(100,100,50,[1,1,1],1,-8);
  ok(PL.a[3]<0,"окно помечено отрицательной высотой");
}));
TEST_SUITES.push(()=>suite("фонари мест: дом ночью светит, днём свет не нужен",{tier:"node"},()=>{
  resetWorld();
  const p=landOnTestPlanet();
  G.home=homeInit();G.home.tier=HOME_TIERS.length;G.home.sx=G.sx;G.home.sy=G.sy;
  const tr=G.surf.tr,bx=homeSpotX(p,tr);
  ok(bx!=null,"место под дом есть");
  const per=CEL_DAY*(6+((p.seed>>>7)&3));
  const at=ph=>{G.t=per*((ph-(p.seed%100)/100+1)%1);};
  at(.30);
  eq(placesLitK(p),0,"днём фонари не светят");
  at(.80);
  ok(surfNight(p)>.3,"ночь ("+surfNight(p).toFixed(2)+")");
  ok(placesLitK(p)>.5,"ночью свет фонарей в силе ("+placesLitK(p).toFixed(2)+")");
  const camx=bx-W/2,camy=groundAt(tr,bx)-H*.6;
  drawHomeOut(tr,camx,camy,p);
  ok(placeLampsN()>=3,"дом зажёг фонарь крыльца, окна и маяк ("+placeLampsN()+")");
  let porch=0;for(let i=0;i<placeLampsN();i++)if(PL.a[i*8+7]===1&&PL.a[i*8+3]>0)porch++;
  eq(porch,1,"у крыльца — одна лампа с точкой");
  placesLit(p,tr,camx,camy);
  eq(placeLampsN(),0,"проход забирает фонари кадра (без видеокарты — молча)");
}));
/* ядро области: встать на его планету в час ph (доля суток) */
function plCore(theme,cpf,ph){
  const at=regionOfTheme(theme);const R=regionAt(at.rx*REGION_SPAN,at.ry*REGION_SPAN);
  G.sx=R.core.sx;G.sy=R.core.sy;G.sys=getSystem(G.sx,G.sy);G.mode="surface";
  const p=cpf(G.sys);const tr=genTerrain(p);
  G.land={p,tr,x:tr.padX,y:groundAt(tr,tr.padX)};enterSurface();
  const per=CEL_DAY*(6+((p.seed>>>7)&3));G.t=per*((ph-(p.seed%100)/100+1)%1);
  return G.surf.p;
}
TEST_SUITES.push(()=>suite("фонари мест: корабль перевала, дверь уезда и мох площадки светят, когда должны",{tier:"node"},()=>{
  resetWorld();
  /* перевал: без света — ни одного фонаря; со светом — иллюминаторы и люк */
  let p=plCore("pass",passCorePlanet,.8),tr=G.surf.tr,x=passShipX(tr,p);
  const cam=(wx)=>[wx-W/2,groundAt(tr,wx)-H*.6];
  let [cx,cy]=cam(x);
  passAll().lit=0;G.t+=1;passDraw(tr,cx,cy,p);
  eq(placeLampsN(),0,"тёмный корабль ничего не зажигает");
  passAll().lit=1;G.t+=1;passDraw(tr,cx,cy,p);
  eq(placeLampsN(),7,"свет включён: шесть иллюминаторов и люк");
  /* уезд: до второго уровня шума свет не горит, на втором — окна и проём */
  resetWorld();
  p=plCore("county",countyCorePlanet,.8);tr=G.surf.tr;
  const S0=settleAt(G.sx,G.sy)||{};ok(countyIsCore(p),"стоим на планете ядра уезда");
  G.surf.noise=0;G.t+=1;
  countyDrawTown(S0,tr,-W/2,0,p,W/2,3);
  eq(placeLampsN(),0,"в тишине город тёмный");
  G.surf.noise=COUNTY_LVL[1]+5;G.t+=1;
  countyDrawTown(S0,tr,-W/2,0,p,W/2,3);
  ok(placeLampsN()>=4,"услышал: три окна и проём двери светят ("+placeLampsN()+")");
  /* мох: ночью лампы у площадки, днём — только сами банки */
  resetWorld();
  p=plCore("glow",glowCorePlanet,.8);
  const S=G.surf;S.shipX=S.x;
  G.t+=1;glowDrawPad(S,S.x-W/2,groundAt(S.tr,S.x)-H*.6);
  ok(surfNight(p)>.2,"на планете ядра ночь ("+surfNight(p).toFixed(2)+")");
  eq(placeLampsN(),6,"ночью шесть банок со мхом светят");
  const pd=plCore("glow",glowCorePlanet,.3);
  G.surf.shipX=G.surf.x;G.t+=1;glowDrawPad(G.surf,G.surf.x-W/2,groundAt(G.surf.tr,G.surf.x)-H*.6);
  ok(surfNight(pd)<.1,"полдень");
  eq(placeLampsN(),0,"днём мох в банках не светит");

}));
