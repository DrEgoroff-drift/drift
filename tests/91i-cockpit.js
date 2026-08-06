/* ══════════════ автотесты: кабина и манёвр: торможение, струи ориентации, класс корабля ══════════════ */
TEST_SUITES.push(()=>suite("торможение не разворачивает корабль",()=>{
  resetWorld();
  const sh=G.ship;
  sh.a=0;sh.vx=-3;sh.vy=0;sh.av=0;      // летим кормой вперёд: раньше корабль довернулся бы
  const a0=sh.a, sp0=Math.hypot(sh.vx,sh.vy);
  keys.brake=true;
  for(let i=0;i<30;i++)updateSystem(1);
  keys.brake=false;
  near(sh.a,a0,.001,"курс остался тем, который держал игрок");
  ok(Math.hypot(sh.vx,sh.vy)<sp0,"а скорость при этом падает");
}));

TEST_SUITES.push(()=>suite("струи ориентации бьют против поворота",()=>{
  resetWorld();
  const sh=G.ship;sh.a=.7;sh.vx=0;sh.vy=0;
  /* момент от струи: газ уходит в одну сторону, корабль идёт в другую.
     Считаем по самим частицам — рисуется ровно то, что физика и делает. */
  const torque=(left)=>{
    TRAIL.length=0;keys.left=left;keys.right=!left;
    for(let i=0;i<200&&TRAIL.length<2;i++)trailStep(1,false,true,false);
    keys.left=keys.right=false;
    const ca=Math.cos(-sh.a),sa=Math.sin(-sh.a);
    let sum=0;
    for(const t of TRAIL){
      if(t.hot)continue;
      const dx=t.x-sh.x, dy=t.y-sh.y;
      const rx=dx*ca-dy*sa, ry=dx*sa+dy*ca;          // в осях корпуса
      const ex=t.vx-sh.vx*.9, ey=t.vy-sh.vy*.9;      // куда ушёл газ
      const fx=-(ex*ca-ey*sa), fy=-(ex*sa+ey*ca);    // тяга — против газа
      sum+=rx*fy-ry*fx;
    }
    return sum;
  };
  ok(torque(true)<0,"поворот влево — момент влево");
  ok(torque(false)>0,"поворот вправо — момент вправо");
  TRAIL.length=0;
}));

TEST_SUITES.push(()=>suite("кабина у каждого класса своя",()=>{
  resetWorld();
  const keysSeen={};
  for(const id of SHIP_KEYS){
    const k=cockpitStyleKey(id);
    ok(!!CKPT_STYLE[k],"«"+SHIPS[id].ru+"»: раскладка "+k+" существует");
    keysSeen[k]=(keysSeen[k]|0)+1;
  }
  ok(Object.keys(keysSeen).length>=4,"на верфи стоят кабины минимум четырёх видов");
  /* сплав из лаборатории — единственный корпус не с верфи, и кабина у него чужая */
  const b=genUniqueShip(4242);b.fused=1;b.cls="лабораторный сплав";
  G.uniqueShips.tAlien=b;
  eq(cockpitStyleKey("tAlien"),"alien","у лабораторного сплава кабина чужая");
  /* у буровика стойки заведомо толще, чем у курьера: это и читается силуэтом */
  const pMiner=cockpitPlan("obod").pw, pCour=cockpitPlan("klinok").pw;
  ok(pMiner>pCour,"у буровика переплёт тяжелее курьерского");
  delete G.uniqueShips.tAlien;
}));
