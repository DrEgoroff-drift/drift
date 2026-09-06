/* ══════════════ роли пиратов по рангу (M361, §5) ══════════════
   Ранг — не «плюс к числам», а то, КАК с вами дерутся: шакал бросается, даёт
   залп и уходит; ветеран держит четыреста-шестьсот и ходит бортом; капитан
   не подходит ближе семисот; барон стоит, бьёт очередями и на половине корпуса
   зовёт двух шакалов. Под четвертью корпуса без своих рядом любой уходит в
   прыжок за три-четыре секунды — награда потеряна, одна строка в журнале. */
const ROLE_LIM=[5.2,4.4,4.0,3.2];   /* потолок скорости по рангу */
function roleSteer(p,ang,dt,rate){p.a+=clamp(angDiff(ang,p.a),-(rate||.035),rate||.035)*dt;}
function roleThrust(p,dt,k){p.vx+=Math.cos(p.a)*(k||.055)*dt;p.vy+=Math.sin(p.a)*(k||.055)*dt;p.thrust=true;}
function roleDamp(p,dt,k){const q=Math.pow(k||.97,dt);p.vx*=q;p.vy*=q;}
function roleFire(p,d,want,range,cool){
  /* перегретый молчит: это те самые секунды без вас, ради которых
     заведена добивающая роль (M364, §2.1) */
  if(p.stunT>0)return false;
  if(d<range&&p.cool<=0&&Math.abs(angDiff(want,p.a))<.35){
    /* у ренегата свой урон: он бьёт вашими же перками */
    fireShot(p.x,p.y,p.a,7,p.dmg||3.5+sysDanger(G.sx,G.sy)*5,p.owner||"pirate");
    p.cool=cool;
    helmShotAt(p);   /* стрелявший сам встаёт в захват, если захвата нет (M360) */
    return true;
  }
  return false;
}
function roleAllyNear(p){
  for(const q of G.pirates)if(q!==p&&q.hull>0&&(q.owner||"pirate")===(p.owner||"pirate")&&Math.hypot(q.x-p.x,q.y-p.y)<1200)return true;
  return false;
}
/* бегство и прыжок: true — запись уже снята */
function roleFlee(p,dt,want){
  roleSteer(p,want+Math.PI,dt,.05);roleThrust(p,dt,.07);
  if(!p.jumpT){
    p.jumpT=G.t+180+Math.random()*60;
    say("«"+p.name+"» уходит",70);
  }else if(G.t>=p.jumpT){
    logAdd("kill","«"+p.name+"» ушёл в прыжок · награда потеряна");
    if(typeof sfx==="function")sfx("ui",{f:180,to:90,d:.3,v:.3});
    p.hull=0;p.fled=1;
    return true;
  }
  return false;
}
/* один шаг роли; d — до игрока, want — курс на игрока */
function pirateRoleTick(p,dt,d,want){
  const st=p.rs||(p.rs={st:"dash",t:0,spin:(p.seed&1)?1:-1,burst:0});
  const hp=p.hull/Math.max(1,p.hullMax);
  p.cool-=dt;
  /* под четвертью и один — в прыжок */
  if(hp<.25&&!roleAllyNear(p))return roleFlee(p,dt,want);
  const rank=p.rank|0;
  if(rank===0){
    /* шакал: бросок — залп — отход; под тридцатью процентами разрывает дистанцию */
    if(hp<.3&&st.st!=="break"){st.st="break";st.t=160;}
    if(st.st==="dash"){
      roleSteer(p,want,dt,.045);roleThrust(p,dt,.06);
      if(d<500)roleFire(p,d,want,760,26);
      if(d<260){st.st="salvo";st.t=45;}
    }else if(st.st==="salvo"){
      roleSteer(p,want,dt,.06);roleDamp(p,dt,.96);
      roleFire(p,d,want,760,10);
      st.t-=dt;if(st.t<=0){st.st="break";st.t=90;}
    }else{
      roleSteer(p,want+Math.PI+.6*st.spin,dt,.05);roleThrust(p,dt,.06);
      st.t-=dt;if((d>650||st.t<=0)&&hp>=.3){st.st="dash";}
    }
  }else if(rank===1){
    /* ветеран: держит 400–600, ходит бортом, нос на вас */
    /* ход по борту не копится: без гашения тангенциальная скорость росла
       каждый кадр, и «ветеран» уходил на 1300 вместо 400–600 (замер M361).
       Радиальная поправка идёт по скорости сближения, а не по расстоянию:
       так он входит в полосу и остаётся в ней, а не проскакивает насквозь. */
    roleSteer(p,want,dt,.05);
    roleDamp(p,dt,.985);
    const rad=(p.vx*Math.cos(want)+p.vy*Math.sin(want));   /* + = сближается: want смотрит на игрока */
    /* издалека идёт ходко, у полосы — шагом: одна и та же скорость сближения
       на 1500 означала бы двадцать секунд подхода */
    const wantRad=d>600?Math.min(2.6,(d-500)/160):(d<400?-1.1:0);
    const push=clamp(wantRad-rad,-1,1)*.055*dt;
    p.vx+=Math.cos(want)*push;p.vy+=Math.sin(want)*push;p.thrust=true;
    const tang=want+Math.PI/2*st.spin;
    p.vx+=Math.cos(tang)*.05*dt;p.vy+=Math.sin(tang)*.05*dt;
    roleFire(p,d,want,760,60);
  }else if(rank===2){
    /* капитан: никогда ближе семисот, редкий тяжёлый огонь */
    if(d<700){roleSteer(p,want,dt,.05);const k=.06*dt;p.vx-=Math.cos(want)*k;p.vy-=Math.sin(want)*k;p.thrust=true;}
    else if(d>950){roleSteer(p,want,dt);roleThrust(p,dt,.045);}
    else{roleSteer(p,want,dt,.05);roleDamp(p,dt,.96);}
    if(d<1100&&p.cool<=0&&!(p.stunT>0)&&Math.abs(angDiff(want,p.a))<.3){
      fireShot(p.x,p.y,p.a,9,(p.dmg||3.5+sysDanger(G.sx,G.sy)*5)*1.6,p.owner||"pirate");
      p.cool=95;helmShotAt(p);
    }
  }else{
    /* барон: стоит, бьёт очередями по три, на половине зовёт двух шакалов */
    roleSteer(p,want,dt,.03);roleDamp(p,dt,.94);
    /* очередь по три, потом настоящая пауза. Раньше длинный откат ставился
       отдельной строкой ПОСЛЕ проверки «пора начинать очередь», и в тот же
       кадр, когда откат доходил до нуля, очередь начиналась заново — барон
       бил без перерыва (82 выстрела за десять секунд на замере M361). */
    if(st.burst>0){if(roleFire(p,d,want,900,7)&&--st.burst===0)p.cool=110;}
    else if(p.cool<=0&&d<900)st.burst=3;
    if(hp<.5&&!p.called){
      p.called=1;
      const n=Math.min(2,ARMED_CAP-armedCount());
      for(let i=0;i<n;i++){
        const a=Math.random()*TAU,seed=hashi(p.seed,i+1,0xBA);
        const hp0=(26+sysDanger(G.sx,G.sy)*70);
        G.pirates.push({x:p.x+Math.cos(a)*900,y:p.y+Math.sin(a)*900,vx:0,vy:0,a:a+Math.PI,
          hull:hp0,hullMax:hp0,name:pick(PIRATE_NAMES,rng(seed)),rank:0,seed,shipId:pirateShipId(seed),
          cool:30,aware:true,thrust:false});
      }
      if(n>0)say("«"+p.name+"» зовёт подмогу",90);
    }
  }
  return false;
}
