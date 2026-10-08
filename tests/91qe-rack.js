/* ══════════════ стойка уступает телу (M821) ══════════════ */
/* Плашка приборов стоит сбоку, но тело кадра под ней не бывает никогда: планета, звезда, станция
   или цель захвата, пришедшие под её место, сперва убирают ленту, потом опускают плашку под себя,
   а нет места — гасят её. Проверка — рамкой тела против рамки плашки, в пикселях вёрстки. */
TEST_SUITES.push(()=>suite("стойка: плашка не поверх тела",()=>{
  resetWorld();
  const W0=W,H0=H,K0=RACK_K,mode0=G.mode,cam0=[G.viewCX,G.viewCY,G.zoom],marks0=G.marks,hf0=RACK.hitF;
  const cross=(g,b)=>b.x1>g.x&&b.x0<g.x+g.w&&b.y1>g.y&&b.y0<g.y+g.h;
  try{
    W=1920;H=1080;RACK_K=1;G.mode="system";G.zoom=1;G.marks=[];RACK.hitF=null;
    const sys=G.sys,p=sys.planets[0];
    ok(!!p,"в стартовой системе есть планета");
    /* камера далеко от всего: плашка полная, с лентой */
    G.viewCX=1e7;G.viewCY=1e7;
    const g0=rackGeo();
    eq(g0.mode,"side","на ПК стойка — боковая плашка");
    ok(g0.tape&&!g0.hide,"тел под плашкой нет — она с лентой");
    ok(g0.x>=W*.7,"плашка в последней трети ширины: x="+(g0.x|0));
    /* центр плашки, её низ (лента) и верх (циферблаты) — по очереди под планетой и под целью */
    const spots=[[g0.x+g0.w/2,g0.y+g0.h*.8],[g0.x+g0.w/2,g0.y+g0.h*.5],[g0.x+g0.w/2,g0.y+60]];
    for(const [tx,ty] of spots){
      G.marks=[];RACK.hitF=null;
      G.viewCX=p.x-(tx-W/2);G.viewCY=p.y-(ty-H/2);
      const g=rackGeo(),B=rackBodies(1);
      const pb=B.find(b=>Math.abs((b.x0+b.x1)/2-tx)<1&&Math.abs((b.y0+b.y1)/2-ty)<1);
      ok(!!pb,"планета записана телом кадра у ("+(tx|0)+","+(ty|0)+")");
      ok(g.hide||!B.some(b=>cross(g,b)),"планета у ("+(tx|0)+","+(ty|0)+"): плашка "+(g.hide?"погасла":"не поверх ни одного тела")+
        " — y="+(g.y|0)+" h="+(g.h|0)+(g.tape?" с лентой":" без ленты"));
    }
    /* цель захвата — рамкой корпуса (bodyMarkBox), когда это корабль с корпусом */
    G.viewCX=1e7;G.viewCY=1e7;
    for(const [tx,ty] of spots){
      RACK.hitF=null;
      const T=(G.pirates&&G.pirates[0])||{x:0,y:0};
      T.x=G.viewCX+(tx-W/2);T.y=G.viewCY+(ty-H/2);G.marks=[T];
      const g=rackGeo(),bm=BODY.on?bodyMarkBox(T,1):null;
      const rx=bm?bm[0]:24,ry=bm?bm[1]:24,b={x0:tx-rx,y0:ty-ry,x1:tx+rx,y1:ty+ry};
      ok(g.hide||!cross(g,b),"цель у ("+(tx|0)+","+(ty|0)+"): плашка "+(g.hide?"погасла":"не поверх рамки цели"));
    }
    /* лента возвращается не сразу: тело ушло — ещё 45 кадров плашка короткая */
    G.marks=[];G.viewCX=p.x-(g0.x+g0.w/2-W/2);G.viewCY=p.y-(g0.y+g0.h*.8-H/2);
    const f0=OVL.fno|0;OVL.fno=f0;rackGeo();
    G.viewCX=1e7;G.viewCY=1e7;
    ok(!rackGeo().tape,"тело ушло этим же кадром — ленты ещё нет");
    OVL.fno=f0+60;
    ok(rackGeo().tape,"через 60 кадров лента вернулась");
    OVL.fno=f0;
    /* телефон: полка без ленты */
    W=390;H=844;
    const s=rackGeo();
    eq(s.mode,"shelf","на телефоне — полка");
    ok(!s.tape&&s.h<=130,"полка — только циферблаты, без ленты: h="+(s.h|0));
  }finally{W=W0;H=H0;RACK_K=K0;G.mode=mode0;[G.viewCX,G.viewCY,G.zoom]=cam0;G.marks=marks0;RACK.hitF=hf0;}
}));
