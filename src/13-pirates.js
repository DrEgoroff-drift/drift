/* ══════════════ пираты ══════════════ */
/* эфемерны: набираются заново при каждом входе в систему, как орбиты и пояс */
const PIRATE_NAMES=["Шакал","Гриф","Клык","Ржавый","Стервятник","Сиплый","Крюк","Оса"];
const PIRATE_COLS=["#ff6b57","#d95a3c","#c4694f","#e08a5a","#b85a6a","#cf7a45"];
/* у каждого пирата свой генерируемый корпус — через NPC_SHIPS, мимо персистентных G.uniqueShips */
function pirateShipId(seed){
  const id="p"+seed;
  if(!NPC_SHIPS[id]){
    const r=rng(seed);
    NPC_SHIPS[id]={seed:hashi(seed,7717,31),col:pick(PIRATE_COLS,r)};
  }
  return id;
}
function spawnPirates(){
  G.pirates=[];G.shots=[];G.loot=[];
  G.shield=stat().shieldMax;
  const danger=sysDanger(G.sx,G.sy);
  const r=rng(hashi(G.sx,G.sy,Math.floor(Date.now()/900000)));
  const n=r()<danger*.85?1+Math.floor(r()*(1+danger*2)):0;
  for(let i=0;i<n;i++){
    const a=r()*TAU,rad=2200+r()*1600;
    G.pirates.push({x:Math.cos(a)*rad,y:Math.sin(a)*rad,vx:0,vy:0,a:a+Math.PI,
      hull:26+danger*70,hullMax:26+danger*70,name:pick(PIRATE_NAMES,r),
      seed:hashi(G.sx,G.sy,i*977),shipId:pirateShipId(hashi(G.sx,G.sy,i*977)),
      cool:0,aware:false,thrust:false});
  }
  /* ушедший управляющий сидит в своём секторе и ждёт: он такая же запись в
     G.pirates, поэтому весь бой уже написан — добавлять к нему нечего */
  rogueSpawn();
}
function fireShot(x,y,ang,speed,dmg,mine){
  G.shots.push({x,y,vx:Math.cos(ang)*speed,vy:Math.sin(ang)*speed,dmg,mine,life:150});
  /* тембр своего выстрела берём из установленной пушки: у каждой части свой seed,
     значит разные орудия звучат по-разному сами собой, без отдельного контента */
  if(mine){
    const g=fittedParts().filter(p=>p.kind==="gun")[0];
    const f=g?420+(g.seed%9)*90:620;
    sfx("shot",{f,v:.5});
  }else sfx("shot",{f:300,v:.3});
}
let fireCool=0;
function updateCombat(dt){
  const sh=G.ship,st=stat();
  const seeRange=st.see;
  /* щит восстанавливается только когда по вам никто не целится */
  if(st.shieldMax>0){
    const calm=!G.pirates.some(p=>p.aware);
    if(calm&&G.shield<st.shieldMax)
      G.shield=Math.min(st.shieldMax,G.shield+st.shieldRegen*dt*.06);
  }else G.shield=0;
  /* контейнеры с трофеями: подбираются пролётом сквозь */
  for(let i=G.loot.length-1;i>=0;i--){
    const L=G.loot[i];
    L.x+=L.vx*dt;L.y+=L.vy*dt;L.vx*=.996;L.vy*=.996;L.spin+=.02*dt;L.life-=dt;
    if(Math.hypot(L.x-sh.x,L.y-sh.y)<40){
      addPart(L.part);
      sfx("ui",{f:520,to:1040,d:.16,v:.34});
      tell("kill","Подобрана часть: "+L.part.name+" ("+TIER_RU[L.part.tier]+")",
           "Контейнер вскрыт\n"+L.part.name+"\n"+L.part.aff.map(affLabel).join("\n"));
      G.loot.splice(i,1);
    }else if(L.life<=0)G.loot.splice(i,1);
  }
  if(fireCool>0)fireCool-=dt;
  if(keys.fire&&st.armed&&fireCool<=0){
    fireShot(sh.x,sh.y,sh.a,9,st.dmg,true);
    fireCool=st.cool;
  }
  for(let i=G.pirates.length-1;i>=0;i--){
    const p=G.pirates[i];
    const dx=sh.x-p.x,dy=sh.y-p.y,d=Math.hypot(dx,dy)||1;
    if(d<seeRange)p.aware=true;
    else if(d>seeRange*2.4)p.aware=false;
    p.thrust=false;
    const pa0=p.a;
    if(p.aware){
      const want=Math.atan2(dy,dx);
      p.a+=clamp(angDiff(want,p.a),-.035,.035)*dt;
      if(d>260){p.vx+=Math.cos(p.a)*.055*dt;p.vy+=Math.sin(p.a)*.055*dt;p.thrust=true;}
      else{const k=Math.pow(.97,dt);p.vx*=k;p.vy*=k;}
      p.cool-=dt;
      if(d<760&&p.cool<=0&&Math.abs(angDiff(want,p.a))<.35){
        /* у ренегата свой урон: он бьёт вашими же перками */
        fireShot(p.x,p.y,p.a,7,p.dmg||3.5+sysDanger(G.sx,G.sy)*5,false);
        p.cool=70+Math.random()*60;
      }
    }
    const sp=Math.hypot(p.vx,p.vy),lim=4.4;
    if(sp>lim){p.vx*=lim/sp;p.vy*=lim/sp;}
    if(sp>.08){   // тот же довод вектора к носу, что и у игрока
      const cur=Math.atan2(p.vy,p.vx);
      const na=cur+clamp(angDiff(p.a,cur),-.05,.05)*.05*dt;
      p.vx=Math.cos(na)*sp;p.vy=Math.sin(na)*sp;
    }
    p.x+=p.vx*dt;p.y+=p.vy*dt;
    p.bank=(p.bank||0)+(clamp(angDiff(p.a,pa0)/Math.max(dt,.0001)*17,-.95,.95)-(p.bank||0))*Math.min(1,.11*dt);
  }
  for(let i=G.shots.length-1;i>=0;i--){
    const s=G.shots[i];
    s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;
    let gone=s.life<=0;
    if(!gone&&s.mine){
      for(const p of G.pirates){
        if(Math.hypot(s.x-p.x,s.y-p.y)<20){
          p.hull-=s.dmg;gone=true;
          sfx("hit",{v:.3});
          if(p.hull<=0)killPirate(p);
          break;
        }
      }
    }else if(!gone){
      if(Math.hypot(s.x-sh.x,s.y-sh.y)<18){
        gone=true;
        let d=s.dmg;
        /* по щиту — звонкий отбой, по корпусу — глухой удар: слышно, что пробили */
        if(G.shield>0){const a=Math.min(G.shield,d);G.shield-=a;d-=a;sfx("ui",{f:1250,to:700,d:.12,v:.28});}
        if(d>0){
          sfx("hit",{v:.55});
          G.hull=Math.max(0,G.hull-d);
          if(G.hull<=0){wreck();return;}
        }
      }
    }
    if(gone)G.shots.splice(i,1);
  }
  G.pirates=G.pirates.filter(p=>p.hull>0);
}
function killPirate(p){
  /* ренегат — не пират: за него не дают награды, за него возвращают корпус */
  if(p.rogue){rogueDefeated(p);return;}
  const r=rng(p.seed);
  sfx("boom",{v:.8});
  const bounty=Math.round((90+sysDanger(G.sx,G.sy)*420)*(.7+r()*.7)*stat().bountyMul);
  G.credits+=bounty;G.kills=(G.kills|0)+1;
  const loot=pick(TRADE_KEYS,r),   /* редкое с обломков не падает: у него свои способы добычи */got=addRes(loot,2+Math.floor(r()*7));
  const d=sysDanger(G.sx,G.sy);
  /* обломок с частью — не в трюм сразу, а контейнером: у боя своя петля «убил → собрал» */
  let dropped=null;
  if(r()<.3+d*.45){
    dropped=genPart(hashi(p.seed,3131,Math.floor(Date.now()/1000)),tierFromDanger(d,r));
    const a=r()*TAU,sp=.35+r()*.5;
    G.loot.push({x:p.x,y:p.y,vx:p.vx*.4+Math.cos(a)*sp,vy:p.vy*.4+Math.sin(a)*sp,
      spin:r()*TAU,life:5400,part:dropped});
  }
  say("«"+p.name+"» разбит\n+"+bounty+" кр"+(got?"\nтрофей: "+RES[loot].ru+" ×"+got:"")+
    (dropped?"\nотделился контейнер":""));
  logAdd("kill","Пират «"+p.name+"» уничтожен · +"+bounty+" кр"+
    (got?" · трофей "+RES[loot].ru.toLowerCase()+" ×"+got:"")+
    (dropped?" · контейнер с частью":""));
}
function drawCombat(zx,zy,Z){
  /* контейнеры: гранёная коробка в цвет категории части, мигает маячком */
  for(const L of G.loot){
    const x=zx(L.x),y=zy(L.y);
    if(x<-40||x>W+40||y<-40||y>H+40){
      const ang=Math.atan2(L.y-G.ship.y,L.x-G.ship.x);
      const mx=W/2+Math.cos(ang)*(Math.min(W,H)/2-40),my=H/2+Math.sin(ang)*(Math.min(W,H)/2-40);
      ctx.fillStyle=PART_KINDS[L.part.kind].col;ctx.globalAlpha=.7;
      ctx.beginPath();ctx.arc(mx,my,2.6,0,TAU);ctx.fill();ctx.globalAlpha=1;
      continue;
    }
    const col=PART_KINDS[L.part.kind].col,s=clamp(Z,.6,1.6)*7;
    ctx.save();ctx.translate(x,y);ctx.rotate(L.spin);
    ctx.fillStyle="rgba(20,24,30,.9)";ctx.strokeStyle=col;ctx.lineWidth=1.4;
    ctx.beginPath();
    for(let i=0;i<6;i++){const a=i/6*TAU;const rr=s*(i%2?.72:1);
      i?ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):ctx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}
    ctx.closePath();ctx.fill();ctx.stroke();
    ctx.restore();
    const pulse=.45+.55*Math.abs(Math.sin(G.t*.05+L.spin));
    ctx.fillStyle=col;ctx.globalAlpha=pulse;
    ctx.beginPath();ctx.arc(x,y,2.2,0,TAU);ctx.fill();ctx.globalAlpha=1;
    if(L.life<900){   // перед исчезновением предупреждаем
      ctx.fillStyle="rgba(255,157,122,.8)";ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
      ctx.fillText(Math.ceil(L.life/60)+"с",x,y-s-5);
    }
  }
  for(const p of G.pirates){
    const x=zx(p.x),y=zy(p.y);
    if(x>-60&&x<W+60&&y>-60&&y<H+60){
      ctx.save();ctx.translate(x,y);ctx.rotate(p.a);
      const s=clamp(Z,.55,1.6)*.82;
      ctx.scale(s,s);
      drawHull(p.shipId,p.thrust,false,1,p.bank||0);
      ctx.restore();
      /* ренегата видно сразу: полоса шире, имя ярче и подпись, кто это такой —
         игрок должен узнать своего человека раньше, чем получит от него */
      const w=p.rogue?54:34,hp=clamp(p.hull/p.hullMax,0,1);
      ctx.fillStyle="rgba(255,255,255,.14)";ctx.fillRect(x-w/2,y-26,w,p.rogue?4:3);
      ctx.fillStyle=p.rogue?"#c58ae0":"#ff6b57";ctx.fillRect(x-w/2,y-26,w*hp,p.rogue?4:3);
      ctx.fillStyle=p.rogue?"rgba(197,138,224,.95)":"rgba(255,107,87,.75)";
      ctx.font=(p.rogue?"9px":"8px")+" ui-monospace,monospace";ctx.textAlign="center";
      ctx.fillText(p.name.toUpperCase(),x,y+26);
      if(p.rogue){
        ctx.fillStyle="rgba(197,138,224,.6)";ctx.font="8px ui-monospace,monospace";
        ctx.fillText("БЫВШИЙ УПРАВЛЯЮЩИЙ",x,y+37);
      }
    }else if(G.tech.has("radar")){
      const ang=Math.atan2(p.y-G.ship.y,p.x-G.ship.x);
      const mx=W/2+Math.cos(ang)*(Math.min(W,H)/2-26),my=H/2+Math.sin(ang)*(Math.min(W,H)/2-26);
      ctx.fillStyle="rgba(255,107,87,.8)";
      ctx.beginPath();ctx.arc(mx,my,3.4,0,TAU);ctx.fill();
    }
  }
  for(const s of G.shots){
    const x=zx(s.x),y=zy(s.y);
    ctx.strokeStyle=s.mine?"rgba(127,230,216,.95)":"rgba(255,107,87,.95)";ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-s.vx*1.6*Z,y-s.vy*1.6*Z);ctx.stroke();
  }
}
