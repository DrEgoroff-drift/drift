/* ══════════════ режим: система ══════════════ */
function updateSystem(dt){
  const sh=G.ship,sys=G.sys,st=stat();
  document.getElementById("dronebtn").style.display="none";
  /* Догонять приходится линейную скорость, а не угловую: у станции на радиусе 700
     касательная ω·r доходила почти до крейсерской, и корабль вечно подлетал туда,
     где цели уже нет. Поэтому зажимаем именно v=ω·r долей от крейсерской скорости —
     соотношение по Кеплеру (дальние медленнее) при этом сохраняется. */
  const cruise=6.4+st.thr*1.6;
  const angRate=(spd,r,frac)=>{
    const w=spd*16, lim=cruise*frac/Math.max(r,1);
    return Math.sign(w)*Math.min(Math.abs(w),lim);
  };
  for(const p of sys.planets){
    p.ang+=angRate(p.spd,p.orbit,.15)*dt;
    const pos=keplerPos(p.orbit,p.ecc,p.ang,p.argp);
    const ppx=p.x,ppy=p.y;
    p.x=pos.x;p.y=pos.y;
    if(dt>0){p.vx=(p.x-ppx)/dt;p.vy=(p.y-ppy)/dt;}
    for(const m of p.moons){
      /* спутнику доля меньше: к его собственной скорости добавляется скорость планеты */
      m.ang+=angRate(m.spd,m.orbit,.07)*dt;
      const mpos=keplerPos(m.orbit,m.ecc,m.ang,m.argp);
      const mpx=m.x,mpy=m.y;
      m.x=p.x+mpos.x;m.y=p.y+mpos.y;
      if(dt>0){m.vx=(m.x-mpx)/dt;m.vy=(m.y-mpy)/dt;}
    }
  }
  if(sys.station){
    const S=sys.station,px=S.x,py=S.y;
    S.ang+=angRate(S.spd,S.orbit,.12)*dt;
    S.x=Math.cos(S.ang)*S.orbit;S.y=Math.sin(S.ang)*S.orbit;
    if(dt>0){S.vx=(S.x-px)/dt;S.vy=(S.y-py)/dt;}
  }
  if(G.mode!=="system")return;
  updateCombat(dt);
  updateAllies(dt);
  if(G.mode!=="system")return;
  if(G.tech.has("dock")&&G.hull<st.hullMax)G.hull=Math.min(st.hullMax,G.hull+.012*dt);
  if(G.ap)G.orbit=null;
  /* держим круговую орбиту вокруг тела: позиция считается по кругу вокруг него,
     а не гоняется регулятором — дрожать нечему. Тяга/руль/тормоз снимают захват.
     Посадка и прочие проверки ниже по коду продолжают работать как обычно —
     мы только подменяем то, как двигается корабль. */
  if(G.orbit&&(keys.thrust||keys.brake||keys.left||keys.right))G.orbit=null;
  const orbiting=!!G.orbit;
  let a0=sh.a,apOn=false,sp=Math.hypot(sh.vx,sh.vy);
  if(orbiting){
    const O=G.orbit;O.ang+=O.w*dt;
    const p=O.p;
    sh.x=p.x+Math.cos(O.ang)*O.r;sh.y=p.y+Math.sin(O.ang)*O.r;
    const tvx=-Math.sin(O.ang)*O.r*O.w+(p.vx||0), tvy=Math.cos(O.ang)*O.r*O.w+(p.vy||0);
    sh.vx=tvx;sh.vy=tvy;
    sh.a=Math.atan2(tvy-(p.vy||0),tvx-(p.vx||0));
    sh.av=0;sh.bank=0;
    trailStep(dt,false,false);
  }else{
  apOn=G.ap&&runAutopilot(dt,st);
  if(apOn)sh.av=0;
  if(!apOn){
    /* угловая инерция: рули набирают и сбрасывают скорость поворота,
       поэтому корабль выписывает дугу, а не щёлкает на месте */
    const acc=.006*st.turn*dt, lim=.038*st.turn;
    if(keys.left)sh.av-=acc;
    if(keys.right)sh.av+=acc;
    if(!keys.left&&!keys.right)sh.av*=Math.pow(.9,dt);
    sh.av=clamp(sh.av,-lim,lim);
    sh.a+=sh.av*dt;
    if(keys.thrust&&G.fuel>0){
      sh.vx+=Math.cos(sh.a)*.082*st.thr*dt;
      sh.vy+=Math.sin(sh.a)*.082*st.thr*dt;
      G.fuel=Math.max(0,G.fuel-.021*dt);
    }
    if(keys.brake&&G.fuel>0){
      const sp0=Math.hypot(sh.vx,sh.vy);
      if(sp0>.03){
        const dec=Math.min(sp0,.075*st.thr*dt);
        sh.vx-=sh.vx/sp0*dec;sh.vy-=sh.vy/sp0*dec;
        G.fuel=Math.max(0,G.fuel-.017*dt);
        sh.a+=clamp(angDiff(Math.atan2(-sh.vy,-sh.vx),sh.a),-.045,.045)*dt;
      }else{sh.vx=0;sh.vy=0;}
    }
  }
  const maxSp=6.4+st.thr*1.6;
  sp=Math.hypot(sh.vx,sh.vy);
  if(sp>maxSp){sh.vx*=maxSp/sp;sh.vy*=maxSp/sp;sp=maxSp;}
  /* вектор скорости мягко доворачивается к носу — за счёт этого разворот
     получается дугой, а не вращением на месте с прежним курсом */
  if(sp>.08&&!apOn){
    const cur=Math.atan2(sh.vy,sh.vx);
    const na=cur+angDiff(sh.a,cur)*Math.min(1,.06*dt);
    sh.vx=Math.cos(na)*sp;sh.vy=Math.sin(na)*sp;
  }
  sh.x+=sh.vx*dt;sh.y+=sh.vy*dt;
  /* гравитационный якорь: за краем системы мягко тянет назад к звезде,
     чтобы в бесконечном космосе нельзя было буквально потеряться */
  {
    const rEdge=(sys.belt?sys.belt.orbit:2400)*1.6;
    const d=Math.hypot(sh.x,sh.y);
    if(d>rEdge){
      const over=d-rEdge,pull=Math.min(.09,over*.00006)*dt;
      sh.vx-=sh.x/d*pull;sh.vy-=sh.y/d*pull;
      if(!G.edgeWarned||G.t-G.edgeWarned>6){G.edgeWarned=G.t;
        say("ГРАВИТАЦИОННЫЙ ЯКОРЬ\nвы покидаете систему · курс мягко тянет к звезде");}
    }
  }
  /* крен считаем по фактической скорости поворота — работает и на автопилоте */
  const rate=angDiff(sh.a,a0)/Math.max(dt,.0001);
  sh.bank+=(clamp(rate*13,-.8,.8)-sh.bank)*Math.min(1,.07*dt);
  trailStep(dt,G.fuel>0&&(keys.thrust||apOn),!apOn&&(keys.left||keys.right));
  }

  const d0=Math.hypot(sh.x,sh.y)||1;
  if(d0>5200){
    sh.vx-=sh.x/d0*.16*dt;sh.vy-=sh.y/d0*.16*dt;
    if(!apOn)G.prompt="ГРАВИТАЦИОННЫЙ ЯКОРЬ · ВОЗВРАТ К ЗВЕЗДЕ";
    return;
  }
  if(d0<sys.radius+30){
    G.hull=Math.max(0,G.hull-.9*dt);
    sh.vx-=sh.x/d0*.4*dt;sh.vy-=sh.y/d0*.4*dt;
    G.prompt="ПЕРЕГРЕВ КОРПУСА";
    if(G.hull<=0)wreck();
    return;
  }
  if(apOn)return;
  G.prompt="";
  const hostile=G.pirates.filter(p=>p.aware).length;
  if(hostile)G.prompt=(st.armed?"ОГОНЬ — ОТСТРЕЛИВАТЬСЯ":"ОРУДИЯ НЕТ")+
    " · ПРЕСЛЕДУЮТ: "+hostile+"\nМОЖНО ПРОСТО УЙТИ ИЛИ ПРЫГНУТЬ";

  if(sys.station){
    const S=sys.station,ds=Math.hypot(sh.x-S.x,sh.y-S.y);
    if(ds<300){
      if(ds<95){
        if(sp>2.6)G.prompt="СБРОСЬТЕ СКОРОСТЬ · "+sp.toFixed(1)+"\nТОРМ — ГАШЕНИЕ";
        else{
          G.prompt="ДЕЙСТВ — СТЫКОВКА · "+S.kind.toUpperCase();
          if(actEdge)openStation();
        }
        return;
      }
      G.prompt=S.name.toUpperCase()+" · "+Math.round(ds)+" ед.";
    }
  }
  const B=sys.belt;
  if(B){
    const rr=Math.hypot(sh.x,sh.y);
    if(Math.abs(rr-B.orbit)<90){
      G.prompt="ДЕЙСТВ — ВОЙТИ В "+B.name.toUpperCase()+"\nРУДА: "+B.res.map(k=>RES[k].ru).join(", ");
      if(actEdge){enterBelt();return;}
    }
  }
  /* пиратская база — точка входа в абордаж; есть только в опасных секторах */
  {
    const PB=sysPirateBase();
    if(PB){
      const d=Math.hypot(sh.x-PB.x,sh.y-PB.y);
      if(d<160){
        G.prompt="ПИРАТСКАЯ БАЗА · "+PB.name.toUpperCase()+
          "\nДЕЙСТВ — АБОРДАЖ"+(st.armed?"":" (ОРУЖИЯ НЕТ)");
        if(actEdge){enterRaid(PB);return;}
      }
    }
  }
  let near=null,nd=1e9;
  for(const p of sys.planets){
    const d=Math.hypot(sh.x-p.x,sh.y-p.y)-p.radius;
    if(d<nd){nd=d;near=p;}
    for(const m of p.moons){
      const dm=Math.hypot(sh.x-m.x,sh.y-m.y)-m.radius;
      if(dm<nd){nd=dm;near=m;}
    }
  }
  if(near&&nd<250){
    if(!G.found.has(near.key)){
      G.found.add(near.key);G.data+=6;
      tell("","Открыта планета "+near.name+" · "+near.T.ru.toLowerCase()+" · +6 данных",
           "Открыто: "+near.name+"\n"+near.T.ru+"\n+6 данных");
    }
    if(nd<110){
      if(near.type==="gas"){
        /* сесть по-прежнему некуда, но в верхние слои можно зайти за газами */
        G.prompt="ГАЗОВЫЙ ГИГАНТ · ПОСАДКИ НЕТ\nДЕЙСТВ — ЗАХОД ЗА ЛЕТУЧИМИ ГАЗАМИ";
        if(actEdge){startScoop(near);return;}
      }
      else if(!G.opts.easyLand&&sp>3.2)G.prompt="СЛИШКОМ БЫСТРО · "+sp.toFixed(1)+"\nТОРМ — ГАШЕНИЕ";
      else{
        let ln="ДЕЙСТВ — "+(G.opts.easyLand?"АВТО-ПОСАДКА":"ПОСАДКА")+" · "+near.name;
        if(G.tech.has("deep")&&near.res.length)
          ln+="\nНЕДРА: "+near.res.map(k=>RES[k].ru).join(", ");
        G.prompt=ln;
        if(actEdge){startLanding(near);return;}
      }
    }else if(!G.prompt)G.prompt=near.name+" · "+Math.round(nd)+" ед.";
    return;
  }
  if(!G.prompt&&G.tech.has("synth")&&G.cargo.ice>0&&G.fuel<st.fuelMax){
    G.prompt="ДЕЙСТВ — СИНТЕЗ ТОПЛИВА ИЗО ЛЬДА ("+G.cargo.ice+")";
    if(actEdge){
      const ratio=st.synthRatio;
      const n=Math.min(G.cargo.ice,Math.ceil((st.fuelMax-G.fuel)/ratio));
      G.cargo.ice-=n;G.fuel=Math.min(st.fuelMax,G.fuel+n*ratio);
      say("Синтез: "+n+" льда → "+(n*ratio)+" топлива");
    }
  }
}
function drawSystem(){
  const sh=G.ship,sys=G.sys,Z=G.zoom;
  /* режим наблюдения за наёмником: двигается только камера, корабль игрока
     продолжает лететь сам по себе и остаётся видимым на своём месте */
  const wA=G.watch?allyOf(G.watch):null;
  const cx0=wA?wA.x:sh.x, cy0=wA?wA.y:sh.y;
  const zx=x=>W/2+(x-cx0)*Z, zy=y=>H/2+(y-cy0)*Z;
  ctx.fillStyle="#05070c";ctx.fillRect(0,0,W,H);
  drawNebula(cx0*.06*Z,cy0*.06*Z,1);
  drawStars(cx0*.06*Z,cy0*.06*Z,1);
  const ox=zx(0),oy=zy(0);
  ctx.strokeStyle="rgba(120,190,210,.10)";ctx.lineWidth=1;
  for(const p of sys.planets){ctx.beginPath();ctx.arc(ox,oy,p.orbit*Z,0,TAU);ctx.stroke();}
  if(sys.station){ctx.strokeStyle="rgba(242,178,92,.13)";
    ctx.beginPath();ctx.arc(ox,oy,sys.station.orbit*Z,0,TAU);ctx.stroke();}
  if(sys.belt)drawBeltRing(ox,oy,sys.belt,Z);
  const R=sys.radius*Z;
  /* протуберанцы: медленно вращаются и дышат */
  ctx.save();ctx.translate(ox,oy);ctx.rotate(G.t*.0014);
  ctx.fillStyle="rgba(255,214,164,.05)";
  for(let i=0;i<14;i++){
    const a=i/14*TAU, len=R*(1.15+.5*Math.abs(Math.sin(G.t*.009+i*1.7)));
    ctx.beginPath();
    ctx.moveTo(Math.cos(a-.09)*R*.94,Math.sin(a-.09)*R*.94);
    ctx.lineTo(Math.cos(a)*len,Math.sin(a)*len);
    ctx.lineTo(Math.cos(a+.09)*R*.94,Math.sin(a+.09)*R*.94);
    ctx.closePath();ctx.fill();
  }
  ctx.restore();
  const g=ctx.createRadialGradient(ox,oy,0,ox,oy,R*7);
  g.addColorStop(0,sys.cls.col);g.addColorStop(.09,sys.cls.col);
  g.addColorStop(.3,"rgba(255,200,140,.16)");g.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(ox,oy,R*7,0,TAU);ctx.fill();
  const core=ctx.createRadialGradient(ox,oy,0,ox,oy,R*.85);
  core.addColorStop(0,"rgba(255,253,247,"+(.82+.07*Math.sin(G.t*.04)).toFixed(2)+")");
  core.addColorStop(.5,"rgba(255,243,212,.42)");
  core.addColorStop(1,"rgba(255,228,178,0)");
  ctx.fillStyle=core;ctx.beginPath();ctx.arc(ox,oy,R*.85,0,TAU);ctx.fill();

  /* эллиптическая орбита — тонкий контур по формуле Кеплера, не окружность */
  ctx.strokeStyle="rgba(120,190,210,.08)";ctx.lineWidth=1;
  for(const p of sys.planets){
    ctx.beginPath();
    for(let k=0;k<=48;k++){
      const pos=keplerPos(p.orbit,p.ecc,k/48*TAU,p.argp);
      const px=zx(pos.x),py=zy(pos.y);
      if(k===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
    }
    ctx.stroke();
  }
  for(const p of sys.planets){
    const x=zx(p.x),y=zy(p.y),r=p.radius*Z;
    if(x<-r-60||x>W+r+60||y<-r-60||y>H+r+60)continue;
    if(p.ring===undefined){
      const rr=rng(p.seed^0x21A9);
      p.ring=(p.type==="gas"&&rr()<.62)
        ? {i:1.34+rr()*.26,o:1.85+rr()*.7,tilt:.16+rr()*.26,n:3+Math.floor(rr()*4),s:p.seed}
        : null;
    }
    if(p.ring&&r>5)drawRing(x,y,r,p.ring,-1);
    ctx.drawImage(planetTex(p),x-r,y-r,r*2,r*2);
    if(p.ring&&r>5)drawRing(x,y,r,p.ring,1);
    if(p.type!=="rocky"&&r>4){ctx.strokeStyle="rgba(150,220,255,.18)";ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(x,y,r+2.5,0,TAU);ctx.stroke();}
    for(const m of p.moons){
      const mx=zx(m.x),my=zy(m.y),mr=Math.max(1,m.radius*Z);
      ctx.fillStyle="#9aa8b2";
      ctx.beginPath();ctx.arc(mx,my,mr,0,TAU);ctx.fill();
      if(G.ap&&G.ap.kind==="planet"&&G.ap.p===m)reticle(mx,my,mr+10);
      if(G.found.has(m.key)&&mr>2.4){
        ctx.fillStyle="rgba(154,168,178,.7)";ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
        ctx.fillText(m.name.toUpperCase(),mx,my+mr+11);
      }
    }
    if(G.found.has(p.key)){
      ctx.fillStyle="rgba(127,230,216,.55)";ctx.font="9px ui-monospace,monospace";ctx.textAlign="center";
      ctx.fillText(p.name.toUpperCase(),x,y+r+15);
    }
    if(G.ap&&G.ap.kind==="planet"&&G.ap.p===p)reticle(x,y,r+16);
  }
  if(sys.station){
    const x=zx(sys.station.x),y=zy(sys.station.y);
    drawStation(x,y,Z);
    if(G.ap&&G.ap.kind==="station")reticle(x,y,34);
  }
  if(G.ap&&G.ap.kind==="belt")reticle(zx(G.ap.ax),zy(G.ap.ay),26);
  drawTrail(zx,zy,Z);
  drawCombat(zx,zy,Z);
  drawAllies(zx,zy,Z);
  drawPirateBase(zx,zy,Z);
  ctx.save();ctx.translate(zx(sh.x),zy(sh.y));ctx.rotate(sh.a);
  ctx.scale(clamp(Z,.55,1.6),clamp(Z,.55,1.6));
  drawHull(G.shipId,keys.thrust&&G.fuel>0||(G.ap&&G.fuel>0),keys.brake&&G.fuel>0,G.mods.engine,sh.bank);
  ctx.restore();
  /* при наблюдении в центре не свой корабль — подписываем, за кем смотрим,
     и куда нажать, чтобы вернуться */
  if(wA){
    ctx.fillStyle="rgba(127,230,216,.9)";ctx.font="10px ui-monospace,monospace";ctx.textAlign="center";
    /* ниже приборов: сверху слева датчики, справа сводка — там текст не читался */
    ctx.fillText("НАБЛЮДЕНИЕ · "+wA.c.name.toUpperCase()+" · "+
                 ORDERS[wA.c.order.kind].ru.toUpperCase(),W/2,H-52);
    ctx.fillStyle="rgba(93,115,130,.85)";ctx.font="9px ui-monospace,monospace";
    ctx.fillText("ЭКИПАЖ — ВЕРНУТЬ КАМЕРУ",W/2,H-38);
  }
  if(Z<.55){
    ctx.strokeStyle="rgba(127,230,216,.5)";ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(zx(sh.x),zy(sh.y),13,0,TAU);ctx.stroke();
  }
  ctx.fillStyle="rgba(93,115,130,.75)";ctx.font="9px ui-monospace,monospace";ctx.textAlign="left";
  ctx.fillText("МАСШТАБ ×"+G.zoom.toFixed(2),12,H-14);
  /* компас на край экрана: звезда, станция и текущая цель автопилота,
     если они за кадром — чтобы в бесконечном космосе нельзя было заблудиться */
  const marks=[{x:0,y:0,c:"#f2b25c",l:"ЗВЕЗДА"}];
  if(sys.station)marks.push({x:sys.station.x,y:sys.station.y,c:"#7fe6d8",l:sys.station.name.toUpperCase()});
  if(G.ap){const T=targetPos();if(T)marks.push({x:T.x,y:T.y,c:"#ff6b57",l:"ЦЕЛЬ"});}
  for(const m of marks){
    const x=zx(m.x),y=zy(m.y);
    if(x>-20&&x<W+20&&y>-20&&y<H+20)continue;
    const ang=Math.atan2(y-H/2,x-W/2);
    const cx=W/2+Math.cos(ang)*(Math.min(W,H)/2-30),cy=H/2+Math.sin(ang)*(Math.min(W,H)/2-30);
    ctx.save();ctx.translate(cx,cy);ctx.rotate(ang);
    ctx.fillStyle=m.c;ctx.globalAlpha=.85;
    ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(-6,6);ctx.lineTo(-6,-6);ctx.closePath();ctx.fill();
    ctx.restore();
    ctx.globalAlpha=1;ctx.fillStyle=m.c;ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
    ctx.fillText(m.l+" · "+Math.round(Math.hypot(m.x-sh.x,m.y-sh.y)),cx,cy+(ang>0?16:-10));
  }
}
/* кольцо: half=-1 — дальняя дуга под планетой, half=1 — ближняя поверх неё */
function drawRing(x,y,r,R,half){
  const rr=rng(R.s^0x77);
  ctx.save();
  if(half>0){ctx.beginPath();ctx.rect(x-r*R.o-4,y,r*R.o*2+8,r*R.o+8);ctx.clip();}
  ctx.lineWidth=Math.max(.6,r*(R.o-R.i)/R.n*.8);
  for(let i=0;i<R.n;i++){
    const t=R.i+(R.o-R.i)*(i+.5)/R.n, a=.06+rr()*.16;
    ctx.strokeStyle="rgba("+(190+rr()*50|0)+","+(172+rr()*46|0)+","+(146+rr()*54|0)+","+a.toFixed(2)+")";
    ctx.beginPath();ctx.ellipse(x,y,r*t,r*t*R.tilt,0,0,TAU);ctx.stroke();
  }
  ctx.restore();
}
function reticle(x,y,r){
  ctx.strokeStyle="rgba(242,178,92,.9)";ctx.lineWidth=1.3;
  const a=G.t*.03;
  for(let i=0;i<4;i++){
    const t=a+i*Math.PI/2;
    ctx.beginPath();
    ctx.arc(x,y,r,t+.15,t+Math.PI/2-.15);ctx.stroke();
  }
}
/* заготовки гранёных скал: единичный радиус, крутятся и масштабируются на месте */
const ROCK_SHAPES=(function(){
  const out=[];
  for(let s=0;s<16;s++){
    const r=rng(hashi(s,7,0x0CCA)),n=8+Math.floor(r()*7),p=[];
    for(let k=0;k<n;k++){
      const t=k/n*TAU, q=.55+r()*.6;
      p.push([Math.cos(t)*q,Math.sin(t)*q]);
    }
    out.push(p);
  }
  return out;
})();
/* скалы кольца раскладываются по ячейкам сетки вокруг корабля —
   плотность одинаковая где угодно на кольце, и ничего не надо хранить */
const ROCK_CELL=62, ROCK_BAND=72;
function drawBeltRocks(ox,oy,B,Z,shx,shy){
  if(Z<.24)return;
  const half=(Math.max(W,H)/2/Z)*G.opts.gfx.draw+ROCK_CELL;
  const c0x=Math.floor((shx-half)/ROCK_CELL), c1x=Math.floor((shx+half)/ROCK_CELL);
  const c0y=Math.floor((shy-half)/ROCK_CELL), c1y=Math.floor((shy+half)/ROCK_CELL);
  const lx=-.56,ly=-.83;
  let drawn=0;
  const cap=Math.round(90*G.opts.gfx.draw);
  for(let cx=c0x;cx<=c1x;cx++)for(let cy=c0y;cy<=c1y;cy++){
    if(drawn>=cap)return;
    const cd=Math.hypot(cx*ROCK_CELL+ROCK_CELL*.5,cy*ROCK_CELL+ROCK_CELL*.5);
    if(Math.abs(cd-B.orbit)>ROCK_BAND+ROCK_CELL)continue;
    const hh=hashi(cx,cy,B.seed);
    if((hh&255)<74)continue;
    const r=rng(hh);
    const wx=(cx+r())*ROCK_CELL, wy=(cy+r())*ROCK_CELL;
    if(Math.abs(Math.hypot(wx,wy)-B.orbit)>ROCK_BAND)continue;
    const x=ox+wx*Z, y=oy+wy*Z;
    const rad=2.6+r()*r()*17;
    const s=rad*Z;
    if(s<.9||x<-s-8||x>W+s+8||y<-s-8||y>H+s+8)continue;
    drawn++;
    const P=ROCK_SHAPES[hh%ROCK_SHAPES.length];
    const rot=r()*TAU+G.t*(r()-.5)*.004;
    const cr=Math.cos(rot),sr=Math.sin(rot);
    const g=.42+r()*.6, ore=r()<.2;
    const col=[54+96*g,53+92*g,60+98*g];
    const oreCol=[152+r()*88,112+r()*68,62+r()*38];
    ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.scale(s,s);
    for(let i=0;i<P.length;i++){
      const A=P[i],Bp=P[(i+1)%P.length];
      const mx=(A[0]+Bp[0])*.5,my=(A[1]+Bp[1])*.5,ml=Math.hypot(mx,my)||1;
      const nx=(mx/ml)*cr-(my/ml)*sr, ny=(mx/ml)*sr+(my/ml)*cr;
      const li=clamp(.2+(nx*lx+ny*ly)*.9,.07,1.15);
      const c=(ore&&i%3===0)?oreCol:col;
      ctx.fillStyle="rgb("+(c[0]*li|0)+","+(c[1]*li|0)+","+(c[2]*li|0)+")";
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(A[0],A[1]);ctx.lineTo(Bp[0],Bp[1]);
      ctx.closePath();ctx.fill();
    }
    ctx.restore();
  }
}
function drawBeltRing(ox,oy,B,Z){
  const r=rng(B.seed);
  ctx.fillStyle="rgba(170,180,190,.5)";
  for(let i=0;i<190;i++){
    const a=r()*TAU, rr=(B.orbit+(r()-.5)*130)*Z;
    const x=ox+Math.cos(a)*rr, y=oy+Math.sin(a)*rr;
    if(x<0||x>W||y<0||y>H)continue;
    ctx.fillRect(x,y,1.4,1.4);
  }
  ctx.strokeStyle="rgba(200,200,210,.09)";ctx.lineWidth=Math.max(1,60*Z);
  ctx.beginPath();ctx.arc(ox,oy,B.orbit*Z,0,TAU);ctx.stroke();
  drawBeltRocks(ox,oy,B,Z,G.ship.x,G.ship.y);
}
/* Станция рисуется процедурно, тем же приёмом, что корпуса кораблей (03-ships):
   общий скелет — ядро, причал, огни, — а силуэт задаёт тип станции, пропорции и
   мелочь берутся из seed системы. Кэшируем в S.viz: станция эфемерна и живёт
   ровно столько, сколько система в SYS_CACHE. */
function stationViz(S){
  if(S.viz)return S.viz;
  const r=rng(hashi(G.sys.seed,0x57A71,7));
  S.viz={a:.75+r()*.55,b:.8+r()*.5,n:3+Math.floor(r()*3),ph:r()*TAU,f:r()};
  return S.viz;
}
const ST_GOLD="rgba(242,178,92,.75)";
function stPanels(len,wid){        /* солнечные панели — неподвижны относительно звезды */
  ctx.fillStyle="rgba(40,72,110,.85)";ctx.strokeStyle="rgba(130,190,230,.5)";ctx.lineWidth=1;
  for(const s of [-1,1]){
    const y0=s>0?18:-18-len;
    ctx.beginPath();ctx.rect(-wid/2,y0,wid,len);ctx.fill();ctx.stroke();
    for(let i=1;i*3<len;i++){
      ctx.beginPath();ctx.moveTo(-wid/2,y0+i*3);ctx.lineTo(wid/2,y0+i*3);ctx.stroke();
    }
  }
}
function stCore(w,h,seams){        /* центральный ствол с причальным раструбом наверху */
  const bg=ctx.createLinearGradient(-w,0,w,0);
  bg.addColorStop(0,"#182636");bg.addColorStop(.45,"#0a1119");bg.addColorStop(1,"#05080d");
  ctx.fillStyle=bg;ctx.strokeStyle=ST_GOLD;ctx.lineWidth=2;
  ctx.beginPath();ctx.rect(-w,-h,w*2,h*2);ctx.fill();ctx.stroke();
  if(seams){
    ctx.strokeStyle="rgba(242,178,92,.3)";ctx.lineWidth=1;
    for(let i=-h+4;i<h;i+=6){ctx.beginPath();ctx.moveTo(-w,i);ctx.lineTo(w,i);ctx.stroke();}
    ctx.strokeStyle=ST_GOLD;ctx.lineWidth=2;
  }
  ctx.beginPath();ctx.moveTo(-w+2,-h);ctx.lineTo(-w-1,-h-6);ctx.lineTo(w+1,-h-6);ctx.lineTo(w-2,-h);ctx.stroke();
  ctx.fillStyle=(Math.sin(G.t*.09)>0)?"#7fe6d8":"rgba(127,230,216,.2)";
  ctx.beginPath();ctx.arc(0,-h-8,2.4,0,TAU);ctx.fill();
  ctx.fillStyle=(Math.sin(G.t*.09)>0)?"rgba(255,107,87,.9)":"rgba(255,107,87,.2)";
  ctx.beginPath();ctx.arc(0,h+2,1.8,0,TAU);ctx.fill();
}
function stRing(V,rx,ry){          /* вращающийся тор с жилыми модулями на ободе */
  ctx.strokeStyle=ST_GOLD;ctx.lineWidth=2;ctx.fillStyle="#0a1119";
  ctx.save();ctx.rotate(G.t*.006+V.ph);
  ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,TAU);ctx.stroke();
  ctx.beginPath();ctx.ellipse(0,0,rx*.66,ry*.7,0,0,TAU);ctx.stroke();
  for(let i=0;i<8;i++){
    const t=i*Math.PI/4;
    ctx.beginPath();ctx.moveTo(Math.cos(t)*rx*.66,Math.sin(t)*ry*.7);
    ctx.lineTo(Math.cos(t)*rx,Math.sin(t)*ry);ctx.stroke();
  }
  ctx.fillStyle="#101a26";
  for(let i=0;i<6;i++){
    const t=i*Math.PI/3+.4,bx=Math.cos(t)*rx,by=Math.sin(t)*ry;
    ctx.beginPath();ctx.rect(bx-2.4,by-1.8,4.8,3.6);ctx.fill();ctx.stroke();
    ctx.fillStyle=(Math.sin(G.t*.05+i)>.2)?"rgba(255,230,170,.9)":"rgba(255,230,170,.25)";
    ctx.fillRect(bx-1,by-.7,2,1.4);
    ctx.fillStyle="#101a26";
  }
  ctx.restore();
}
function drawStation(x,y,Z){
  const s=clamp(Z,.4,1.5),S=G.sys.station,V=stationViz(S),ty=S.stype||"trade";
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  if(ty==="trade"){
    /* раздутые склады и гроздь причалов: контейнеры висят на штангах по бортам */
    stPanels(12,6);
    stRing(V,30*V.a,10*V.b);
    ctx.strokeStyle=ST_GOLD;ctx.lineWidth=1.4;
    for(let i=0;i<V.n+1;i++){
      const yy=-10+i*8,sx=(i%2?1:-1);
      ctx.beginPath();ctx.moveTo(sx*6,yy);ctx.lineTo(sx*20,yy);ctx.stroke();
      for(let j=0;j<2;j++){
        ctx.fillStyle=j?"#1d2f42":"#243a2c";
        ctx.beginPath();ctx.rect(sx*(11+j*6)-3,yy-3.2,6,6.4);ctx.fill();ctx.stroke();
      }
    }
    stCore(6,16,true);
  }else if(ty==="indust"){
    /* домны и факел: переработка видна снаружи — конвейеры, дым, огонь */
    stPanels(9,5);
    ctx.strokeStyle="rgba(210,140,80,.8)";ctx.lineWidth=2;ctx.fillStyle="#14161a";
    for(const sx of [-1,1]){
      ctx.beginPath();
      ctx.moveTo(sx*9,-8);ctx.lineTo(sx*24*V.a,-13);ctx.lineTo(sx*24*V.a,9);ctx.lineTo(sx*9,6);
      ctx.closePath();ctx.fill();ctx.stroke();
      ctx.fillStyle=(Math.sin(G.t*.04+(sx>0?0:1.7))>0)?"rgba(255,150,60,.75)":"rgba(255,150,60,.3)";
      ctx.fillRect(sx*14-3,-4,6,7);
      ctx.fillStyle="#14161a";
    }
    ctx.strokeStyle="rgba(242,178,92,.45)";ctx.lineWidth=1;
    for(let i=-6;i<=6;i+=4){ctx.beginPath();ctx.moveTo(-24*V.a,i+2);ctx.lineTo(24*V.a,i+2);ctx.stroke();}
    stCore(7,15,false);
    /* факельная труба: пламя пляшет, дым сносит вбок */
    ctx.strokeStyle="rgba(210,140,80,.8)";ctx.lineWidth=2;ctx.fillStyle="#0a1119";
    ctx.beginPath();ctx.rect(-3,-28,6,12);ctx.fill();ctx.stroke();
    const fl=1.4+Math.abs(Math.sin(G.t*.13+V.ph))*3.4;
    ctx.fillStyle="rgba(255,170,70,.85)";
    ctx.beginPath();ctx.ellipse(0,-30-fl*.5,2.2,fl,0,0,TAU);ctx.fill();
    ctx.fillStyle="rgba(255,120,50,.35)";
    ctx.beginPath();ctx.arc(2,-34-fl,3.4,0,TAU);ctx.fill();
  }else if(ty==="yard"){
    /* открытый эллинг: рама, а внутри шпангоуты строящегося корпуса и кран */
    stPanels(10,5);
    ctx.strokeStyle=ST_GOLD;ctx.lineWidth=2;
    ctx.beginPath();
    ctx.moveTo(-22,-20);ctx.lineTo(-22,20);ctx.lineTo(22,20);ctx.lineTo(22,-20);ctx.stroke();
    ctx.lineWidth=1.2;ctx.strokeStyle="rgba(242,178,92,.4)";
    for(let i=-18;i<=18;i+=9){
      ctx.beginPath();ctx.moveTo(-22,i);ctx.lineTo(-16,i);ctx.stroke();
      ctx.beginPath();ctx.moveTo(22,i);ctx.lineTo(16,i);ctx.stroke();
    }
    ctx.strokeStyle="rgba(150,190,220,.6)";
    for(let i=0;i<4;i++){
      const yy=-13+i*8, w=13-Math.abs(i-1.4)*3.4;
      ctx.beginPath();ctx.ellipse(0,yy,w,2.6,0,0,TAU);ctx.stroke();
    }
    ctx.strokeStyle="rgba(150,190,220,.45)";
    ctx.beginPath();ctx.moveTo(0,-17);ctx.lineTo(0,15);ctx.stroke();
    /* кран ползает вдоль эллинга — видно, что верфь работает */
    const cy=Math.sin(G.t*.02+V.ph)*15;
    ctx.strokeStyle="rgba(255,210,130,.8)";ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(-22,cy);ctx.lineTo(22,cy);ctx.stroke();
    ctx.fillStyle=(Math.sin(G.t*.3)>0)?"rgba(180,255,255,.9)":"rgba(180,255,255,.15)";
    ctx.beginPath();ctx.arc(6,cy,1.6,0,TAU);ctx.fill();
    stCore(5,10,false);
  }else if(ty==="sci"){
    /* тонкий силуэт: мачта, тарелки антенн и решётки радиаторов */
    ctx.strokeStyle="rgba(130,200,220,.6)";ctx.lineWidth=1;ctx.fillStyle="rgba(30,60,80,.7)";
    for(const sx of [-1,1]){
      ctx.beginPath();ctx.rect(sx>0?9:-25,-4,16,8);ctx.fill();ctx.stroke();
      for(let i=1;i<5;i++){
        const xx=(sx>0?9:-25)+i*3.2;
        ctx.beginPath();ctx.moveTo(xx,-4);ctx.lineTo(xx,4);ctx.stroke();
      }
    }
    ctx.strokeStyle=ST_GOLD;ctx.lineWidth=1.6;ctx.fillStyle="#0a1119";
    for(const sy of [-1,1]){
      const dy=sy*22,ang=G.t*.004*sy+V.ph;
      ctx.beginPath();ctx.moveTo(0,sy*12);ctx.lineTo(0,dy);ctx.stroke();
      ctx.save();ctx.translate(0,dy);ctx.rotate(ang);
      ctx.beginPath();ctx.ellipse(0,0,9*V.a,3.2,0,0,Math.PI,true);ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-4.5);ctx.stroke();
      ctx.restore();
    }
    stCore(4.5,13,true);
    ctx.fillStyle=(Math.sin(G.t*.06+V.ph)>.4)?"rgba(140,240,255,.9)":"rgba(140,240,255,.2)";
    ctx.beginPath();ctx.arc(0,0,2,0,TAU);ctx.fill();
  }else if(ty==="outpost"){
    /* угловатый броневой блок с турелями: панелей нет, только красные огни */
    ctx.strokeStyle="rgba(220,120,90,.8)";ctx.lineWidth=2;ctx.fillStyle="#141a20";
    ctx.beginPath();
    for(let i=0;i<6;i++){
      const t=i*Math.PI/3+.3,rx=Math.cos(t)*20*V.a,ry=Math.sin(t)*17*V.b;
      i?ctx.lineTo(rx,ry):ctx.moveTo(rx,ry);
    }
    ctx.closePath();ctx.fill();ctx.stroke();
    ctx.lineWidth=1.2;ctx.strokeStyle="rgba(220,120,90,.45)";
    ctx.beginPath();ctx.moveTo(-14,-6);ctx.lineTo(14,-6);ctx.stroke();
    ctx.beginPath();ctx.moveTo(-14,6);ctx.lineTo(14,6);ctx.stroke();
    /* турели поводят стволами — станция явно сторожевая */
    ctx.strokeStyle="rgba(255,160,120,.9)";ctx.lineWidth=2.4;ctx.fillStyle="#1b2229";
    for(let i=0;i<3;i++){
      const t=i*TAU/3+V.ph,bx=Math.cos(t)*17*V.a,by=Math.sin(t)*15*V.b;
      const ga=t+Math.sin(G.t*.012+i)*.5;
      ctx.beginPath();ctx.arc(bx,by,3.4,0,TAU);ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx+Math.cos(ga)*8,by+Math.sin(ga)*8);ctx.stroke();
    }
    stCore(5,12,false);
    ctx.fillStyle=(Math.sin(G.t*.14)>.3)?"rgba(255,80,60,.95)":"rgba(255,80,60,.15)";
    for(const sx of [-1,1]){ctx.beginPath();ctx.arc(sx*20*V.a,0,2,0,TAU);ctx.fill();}
  }else{
    /* заправочная: бак с причалом, ничего лишнего */
    ctx.strokeStyle=ST_GOLD;ctx.lineWidth=2;
    const g=ctx.createLinearGradient(-16,0,16,0);
    g.addColorStop(0,"#1b2a38");g.addColorStop(.5,"#0c141c");g.addColorStop(1,"#070b10");
    ctx.fillStyle=g;
    ctx.beginPath();ctx.ellipse(0,2,15*V.a,19*V.b,0,0,TAU);ctx.fill();ctx.stroke();
    ctx.strokeStyle="rgba(242,178,92,.35)";ctx.lineWidth=1;
    for(const yy of [-6,2,10]){
      ctx.beginPath();ctx.ellipse(0,yy,15*V.a*.94,4,0,0,Math.PI);ctx.stroke();
    }
    ctx.strokeStyle="rgba(150,190,220,.5)";ctx.lineWidth=1.6;
    for(const sx of [-1,1]){
      ctx.beginPath();ctx.moveTo(sx*13*V.a,-4);ctx.lineTo(sx*20,-9);ctx.lineTo(sx*20,4);ctx.stroke();
    }
    stCore(4,12,false);
  }
  ctx.restore();
  ctx.fillStyle="rgba(242,178,92,.6)";ctx.font="9px ui-monospace,monospace";ctx.textAlign="center";
  ctx.fillText(S.name.toUpperCase(),x,y+40);
}
