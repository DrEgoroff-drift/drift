/* ══ Приборная стойка: аппаратура, а не картинка ══
   Сторож замысла: все стрелки показывают НАСТОЯЩИЕ величины игры, каналов
   ровно пять и они совпадают с перьями ленты, стойка ничего не объявляет, а
   тяжёлое полотно печётся один раз. */
TEST_SUITES.push(()=>suite("Стойка: восемь стрелок и пять перьев на одной бумаге",()=>{
  resetWorld();
  eq(RACK_G.length,8,"приборов в стойке восемь");
  eq(RACK_CH.length,TAPE_PENS,"каналов столько же, сколько перьев на ленте");
  ok(RACK_G.every(g=>g.hi>g.lo&&g.mid>0&&g.sub>0),"у каждого свой диапазон и деления");
  ok(new Set(RACK_G.map(g=>g.lo+":"+g.hi)).size>=5,
     "шкалы разные, а не одна на восемь приборов");
  ok(new Set(RACK_CH.map(c=>c.col)).size===TAPE_PENS,"у каждого канала свой цвет");

  /* ── стрелки читают настоящее состояние: подвинули мир — подвинулось показание ── */
  const R=instrRead();
  const fuelG=RACK_G.find(g=>g.id==="fuel"), hullG=RACK_G.find(g=>g.id==="hull");
  const f0=fuelG.read(R);
  G.fuel=Math.max(0,G.fuel*.5);
  ok(fuelG.read(R)<f0-1,"стрелка топлива пошла за баком: "+f0.toFixed(0)+" → "+fuelG.read(R).toFixed(0));
  const h0=hullG.read(R);
  G.hull=Math.max(1,G.hull*.5);
  ok(hullG.read(R)<h0-1,"стрелка корпуса пошла за обшивкой");
  ok(RACK_G.every(g=>isFinite(g.read(R))),"все восемь дают число, а не NaN");

  /* ── открывается и закрывается, и это не сохраняется ── */
  G.rack=null;
  ok(!rackOpen(),"по умолчанию стойка закрыта");
  rackToggle();ok(rackOpen(),"открылась");
  rackToggle();ok(!rackOpen(),"и закрылась");
  const snap=JSON.stringify(snapshot());
  ok(snap.indexOf("\"rack\"")<0,"состояние стойки в сохранение не попадает");

  /* ── рисует молча, и тяжёлое полотно печётся один раз ── */
  const spy={say:0,tell:0,log:0,sfx:0};
  const s0=say,t0=tell,l0=logAdd,f2=sfx;
  say=function(){spy.say++;return s0.apply(null,arguments);};
  tell=function(){spy.tell++;return t0.apply(null,arguments);};
  logAdd=function(){spy.log++;return l0.apply(null,arguments);};
  sfx=function(){spy.sfx++;return f2.apply(null,arguments);};
  const run0=G.running,mode0=G.mode;
  G.running=true;G.mode="system";
  rackToggle();
  for(let i=0;i<40;i++)tapeSample();
  const t1=rackTex(),key1=RACK.key;
  for(let i=0;i<5;i++)rackDraw();
  say=s0;tell=t0;logAdd=l0;sfx=f2;
  eq(spy.say+spy.tell+spy.log+spy.sfx,0,"стойка не сказала ни слова");
  eq(RACK.key,key1,"полотно не перепекается каждый кадр");
  ok(t1.cv&&t1.cv.width>0,"полотно стойки есть");
  rackToggle();G.running=run0;G.mode=mode0;
}));
