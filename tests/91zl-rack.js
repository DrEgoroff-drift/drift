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
  for(let i=0;i<5;i++)rackDraw();
  say=s0;tell=t0;logAdd=l0;sfx=f2;
  eq(spy.say+spy.tell+spy.log+spy.sfx,0,"стойка не сказала ни слова");
  rackToggle();G.running=run0;G.mode=mode0;OVL.uq.length=OVL.ur.length=OVL.gd.length=0;
}));
/* на видеокарте: мастер и спрайты пекутся один раз на размер, дальше кадр — только очередь #ovl:
   ни одной новой текстуры, ни одного вызова 2D */
TEST_SUITES.push(()=>suite("Стойка: мастер печётся порциями один раз, кадр — очередь слоя #ovl",{tier:"browser"},()=>{
  if(!ok(GPU.ok&&!!GPU.dev,"видеокарта есть"))return;
  resetWorld();G.mode="system";
  /* выпечки стойки — по её художникам: мир рядом печёт своё, это не её счёт */
  const run0=G.running,loop0=LOOP_OFF,p0=rackPaint,s0=rackSprites;let bakes=0,t=wallMs();
  G.running=true;LOOP_OFF=false;G.rack={on:true};
  window.rackPaint=function(){bakes++;return p0.apply(null,arguments);};
  window.rackSprites=function(){bakes++;return s0.apply(null,arguments);};
  try{
    for(let i=0;i<40;i++)tapeSample();
    /* части мастера — шаги печи 17a0: крупная одна на кадр (PB_PX), стойка встаёт, когда готово всё */
    rackDrop();let fr=0,most=0;
    while(!RACK.P&&fr<30){const b=bakes;frameBody(t+=16.7);fr++;most=Math.max(most,bakes-b);}
    const B=RACK.P,S=RACK.S,np=rackParts(RACK.geo,RACK.nd).length;
    ok(!!(B&&S&&B.every(p=>p.B.dev===GPU.dev))&&bakes===np+1,"части мастера и спрайты на видеокарте ("+bakes+" выпечек, частей "+np+")");
    ok(fr>=3&&most<np+1,"выпечка разложена по кадрам: "+fr+" кадров, за кадр не больше "+most);
    const b0=bakes;let lit=0;
    for(let i=0;i<30;i++){frameBody(t+=16.7);if(OVL.on)lit++;}
    eq(bakes-b0,0,"30 кадров открытой стойки — ни одной новой выпечки");
    ok(RACK.P===B&&RACK.S===S,"мастер тот же");
    eq(lit,30,"слой #ovl горит каждый кадр");
    G.rack.on=false;frameBody(t+=16.7);
  }finally{window.rackPaint=p0;window.rackSprites=s0;G.running=run0;LOOP_OFF=loop0;G.rack=null;resetWorld();}
}));
/* легенда каналов: подпись не заходит под ролик подачи ни на телефоне, ни на 760, ни на 1180;
   на 760 и 1180 подпись словом, бумаге остаётся 60 % короба; на телефоне хотя бы номер канала.
   Ширины — настоящие глифы */
TEST_SUITES.push(()=>suite("Стойка: подписи каналов не заходят под ролик подачи (390, 760, 1180)",{tier:"browser"},()=>{
  const W0=W,H0=H;
  try{
    for(const [w,h] of [[390,844],[760,760],[1180,800]]){
      W=w;H=h;const g0=rackGeo(),P=rackPaperBox(g0),R=g0.rec,edge=P.x-10-R.rollW*1.18;
      const over=R.lab.map((s,i)=>s&&R.x+R.lx+gcMeasure(RACK_LEG_FONT,s).width>edge-2?i:-1).filter(i=>i>=0);
      eq(over.length,0,w+": подписи кончаются до ролика ("+R.lab.join(" | ")+")");
      ok(R.lab.every(s=>s.length>=1),w+": у каждого канала подпись, не одна точка: "+R.lab.join(" | "));
      if(w>=760){ok(R.lab.every(s=>s.length>=3),w+": подписи на месте: "+R.lab.join(" | "));
        ok(P.w>=(R.w-R.rollW*2-16)*.6-1e-6,w+": бумаге 60 % короба ("+Math.round(P.w)+" px)");}
    }
  }finally{W=W0;H=H0;RACK_LEG.k="";}
}));
/* открытие стойки не трогает прогретый пул целей (08ca): её выпечки разовые (once) — записи
   448×64 и 512×128 (тень), 1024² (выпечка) живы, ни одна не родилась заново, байты пула те же */
TEST_SUITES.push(()=>suite("Стойка: открытие не вытесняет прогретый пул выпечек",{tier:"browser"},()=>{
  if(!ok(GPU.ok&&!!GPU.dev,"видеокарта есть"))return;
  resetWorld();G.mode="system";
  const Q=gcPool(),warm=Q.t.filter(x=>GC_POOL_WARM.some(([r,w,h])=>x.role===r&&x.w===Math.ceil(w/64)*64&&x.h===Math.ceil(h/64)*64));
  const by0=Q.by,n0=Q.t.length,run0=G.running,loop0=LOOP_OFF;let t=wallMs();
  G.running=true;LOOP_OFF=false;
  try{
    rackDrop();G.rack={on:true};for(let i=0;i<40;i++)tapeSample();
    for(let i=0;i<30&&!RACK.P;i++)frameBody(t+=16.7);
    ok(!!RACK.P,"стойка испечена");
    eq(warm.filter(x=>!Q.t.includes(x)).length,0,"прогретые записи живы ("+warm.length+")");
    eq((Q.by-by0)/1048576,0,"байты пула те же ("+(by0/1048576).toFixed(1)+" МБ)");
    eq(Q.t.length,n0,"новых записей в пуле нет");
  }finally{G.rack=null;G.running=run0;LOOP_OFF=loop0;resetWorld();}
}));
