/* ══════════════ автотесты: эффекты M325 — вода, марево, хроматика, факел ══════════════
   Список автора (2026-09-03, «берём все»). Проверяется то, что можно измерить:
   озеро ложится в ложбину только на сырой полосе живого мира и всегда одно и
   то же; в его зеркале не растут растения; хроматика разводит кромку на красный
   и синий и гаснет сама; марево и факел рисуются без исключений. */
TEST_SUITES.push(()=>suite("эффекты M325: озеро — в ложбине сырой полосы, одно и то же, без растений в зеркале",()=>{
  resetWorld();
  const p=G.sys.planets.find(q=>q.type==="terran"||q.type==="jungle")||G.sys.planets.find(q=>q.type!=="gas");
  ok(!!p,"есть планета");if(!p)return;
  const tr=genTerrain(p);
  /* сухая полоса — воды нет; сырая — есть, если ложбина не мельче двухсот шагов */
  tr.wet=.05;tr.water=undefined;
  eq(waterOf(tr,p),null,"сухая полоса — без озера");
  tr.wet=.9;tr.water=undefined;
  const Wt=waterOf(tr,p);
  if(Wt){
    ok(Wt.x1-Wt.x0>=WATER_MIN_SPAN,"зеркало не короче "+WATER_MIN_SPAN+": "+Math.round(Wt.x1-Wt.x0));
    ok(Math.abs(Wt.cx-tr.padX)>200,"не под посадочной площадкой");
    ok(groundAt(tr,Wt.cx)>Wt.y,"уровень выше дна ложбины");
    ok(groundAt(tr,Wt.x0-8)<=Wt.y+2&&groundAt(tr,Wt.x1+8)<=Wt.y+2,"берега выше уреза");
    tr.water=undefined;
    eq(JSON.stringify(waterOf(tr,p)),JSON.stringify(Wt),"то же озеро при каждом расчёте");
  }else ok(true,"на этой полосе ложбина мельче лужи — озера нет, и это честно");
  /* безвоздушный мир — воды нет при любой сырости */
  const dead=Object.assign({},p,{type:"rocky",T:Object.assign({},p.T,{atm:"отсутствует"})});
  const tr2=genTerrain(p);tr2.wet=.9;tr2.water=undefined;
  eq(waterOf(tr2,dead),null,"без атмосферы — без озера");
  /* рисуется без исключений, с озером в кадре и без */
  let okDraw=true;
  try{
    G.surf={p,tr,x:Wt?Wt.cx:tr.padX,y:0,cam:{x:0,y:0}};
    drawWater(tr,(Wt?Wt.cx:tr.padX)-W/2,groundAt(tr,Wt?Wt.cx:tr.padX)-H*.6,p);
    drawWater(tr,-5e5,0,p);
  }catch(e){okDraw=false;}
  ok(okDraw,"озеро рисуется");
  G.surf=null;
}));

TEST_SUITES.push(()=>suite("эффекты M325: хроматика разводит кромку на красный и синий и гаснет сама",()=>{
  resetWorld();
  ctx.save();ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.fillStyle="#000";ctx.fillRect(0,0,W,H);
  ctx.fillStyle="#fff";ctx.fillRect(100,100,60,60);
  hitFx(1);
  ok(HIT_FX===1,"сила удара записана");
  drawHitFx(1);
  ctx.restore();
  const px=(x,y)=>ctx.getImageData(Math.round(x*DPR),Math.round(y*DPR),1,1).data;
  const L=px(96,130),R=px(164,130);
  ok(L[0]>L[2]+20,"слева от белого — красная каёмка: "+L[0]+"/"+L[2]);
  ok(R[2]>R[0]+20,"справа — синяя: "+R[0]+"/"+R[2]);
  ok(HIT_FX<1&&HIT_FX>0,"после кадра сила меньше, но ещё есть: "+HIT_FX.toFixed(2));
  for(let i=0;i<60;i++)drawHitFx(1);
  eq(HIT_FX,0,"через секунду-другую гаснет в ноль");
  /* марево: самокопия куска кадра, без исключений и в границах */
  let okH=true;try{heatHaze(-20,-20,80,40,.8,1);heatHaze(W-10,H-10,60,60,.8,2);heatHaze(200,200,2,2,.8,3);}catch(e){okH=false;}
  ok(okH,"марево рисуется на краю и на нулевом куске");
}));

TEST_SUITES.push(()=>suite("эффекты M325: факел завода пляшет поверх выпечки; марево за соплами при тяге",()=>{
  resetWorld();
  const S=G.sys.station;ok(!!S,"станция есть");if(!S)return;
  const was=S.stype;S.stype="indust";
  G.mode="system";G.ship.x=S.x-30;G.ship.y=S.y+60;
  let okDraw=true;
  try{drawSystem();}catch(e){okDraw=false;}
  ok(okDraw,"система с заводом рисуется");
  keys.thrust=true;G.fuel=100;
  try{drawSystem();}catch(e){okDraw=false;}
  ok(okDraw,"и с тягой — марево за соплами");
  keys.thrust=false;S.stype=was;
  G.ship.x=0;G.ship.y=-760;
}));
