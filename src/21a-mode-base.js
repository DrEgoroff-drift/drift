/* ══════════════ база на планете: вид в разрезе ══════════════ */
/* Планета остаётся плоской 2D, объём даёт разрез: сверху небо и грунт, ниже —
   вкопанные отсеки, коридоры и шахта лифта. Видно всё сразу — реактор светится,
   бур уходит в породу, в жилом горит свет. Ходьба, свет и камера — те же, что
   в пещере, поэтому сцена стоит дёшево. */
const BASE_COLS=5, BASE_ROWS=4, BCELL_W=150, BCELL_H=104;
const BUILD={
  reactor:{ru:"Реактор",    cost:{credits:1800,alloy:6},  power:14, note:"даёт энергию всей базе; рядом с буром потерь меньше"},
  solar:  {ru:"Солнечная панель",cost:{credits:700,alloy:2},power:5,surfaceOnly:true,
           note:"только на верхнем уровне, отдача зависит от класса звезды"},
  drill:  {ru:"Буровая",    cost:{credits:1400,alloy:4},  power:-9, note:"тянет ресурс из залежи под базой"},
  storage:{ru:"Склад",      cost:{credits:600,alloy:2},   power:-1, note:"+120 к тому, сколько база может накопить"},
  habitat:{ru:"Жилой отсек",cost:{credits:1200,alloy:3},  power:-4, note:"места для персонала; рядом с реактором людям хуже"},
  refinery:{ru:"Плавильня", cost:{credits:2200,alloy:8},  power:-11,note:"сама переплавляет добытое в сплавы"},
  pad:    {ru:"Площадка",   cost:{credits:2600,alloy:10}, power:-3, note:"причал для переброски между базами"}
};
const BUILD_KEYS=Object.keys(BUILD);
function baseKey(sx,sy,idx){return sx+","+sy+":"+idx;}
function baseAt(sx,sy,idx){return G.bases[baseKey(sx,sy,idx)]||null;}
function baseCost(k){return BUILD[k].cost;}
function canPay(cost){return G.credits>=cost.credits&&(!cost.alloy||G.cargo.alloy>=cost.alloy);}
function payCost(cost){G.credits-=cost.credits;if(cost.alloy)G.cargo.alloy-=cost.alloy;}
function foundBase(p){
  const cost={credits:2500,alloy:10};
  if(!canPay(cost)){
    say("Для закладки базы нужно\n2500 кр и 10 сплавов\n(сплавы — на промышленной станции)");
    return false;
  }
  payCost(cost);
  const cells=[];
  for(let i=0;i<BASE_COLS*BASE_ROWS;i++)cells.push(null);
  cells[Math.floor(BASE_COLS/2)]={k:"reactor",hp:1};   // без энергии база мертва, поэтому реактор в подарок
  G.bases[baseKey(G.sx,G.sy,p.idx)]={sx:G.sx,sy:G.sy,idx:p.idx,name:p.name,type:p.type,
    res:p.res.slice(0,3),cells,pool:{},tMs:Date.now(),built:Date.now()};
  tell("money","Заложена база на "+p.name+" · −2500 кр, 10 сплавов","База заложена\n"+p.name);
  return true;
}
function enterBase(p){
  const B=baseAt(G.sx,G.sy,p.idx);if(!B)return;
  baseTick();
  G.base={B,p,cur:Math.floor(BASE_COLS/2),row:0,x:0,y:0,walkPhase:0,menu:false,pick:0};
  G.base.x=cellX(G.base.cur);G.base.y=cellY(0);
  G.mode="base";
  for(const k in keys)keys[k]=false;
  say("База «"+p.name+"»\n◀ ▶ — переход · ▲ ▼ — уровни\nДЕЙСТВ — строить в пустой ячейке · НАЗАД — наружу");
}
function exitBase(){
  G.base=null;G.mode="surface";
  say("Выход на поверхность");
}
function cellX(c){return 90+c*BCELL_W+BCELL_W/2;}
function cellY(r){return 150+r*BCELL_H+BCELL_H/2;}
function baseCell(B,c,r){return B.cells[r*BASE_COLS+c];}
function baseSet(B,c,r,v){B.cells[r*BASE_COLS+c]=v;}
/* ══════════════ энергия и соседство ══════════════ */
/* Энергобаланс — центральная механика и причина рисовать разрез: нехватка не
   строка в таблице, а тусклый свет и вставший бур. */
function baseNeighbors(B,c,r){
  const out=[];
  for(const [dc,dr] of [[-1,0],[1,0],[0,-1],[0,1]]){
    const cc=c+dc,rr=r+dr;
    if(cc<0||cc>=BASE_COLS||rr<0||rr>=BASE_ROWS)continue;
    const cell=baseCell(B,cc,rr);
    if(cell)out.push(cell.k);
  }
  return out;
}
function basePower(B){
  let prod=0,cons=0,drills=0,drillEff=0,hab=0,habPenalty=0,store=0,ref=0,pads=0;
  const cls=(getSystem(B.sx,B.sy).cls&&getSystem(B.sx,B.sy).cls.lum)||1;
  for(let r=0;r<BASE_ROWS;r++)for(let c=0;c<BASE_COLS;c++){
    const cell=baseCell(B,c,r);if(!cell||cell.hp<=0)continue;   // разбитый отсек не работает и не ест энергию
    const M=BUILD[cell.k];if(!M)continue;
    const near=baseNeighbors(B,c,r);
    if(cell.k==="solar"){prod+=M.power*(r===0?1:.25)*cls;continue;}
    if(M.power>0){prod+=M.power;continue;}
    let use=-M.power;
    if(cell.k==="drill"){
      /* реактор по соседству — меньше потерь в передаче */
      const wired=near.indexOf("reactor")>=0;
      use*=wired?.78:1;
      drills++;drillEff+=wired?1.2:1;
    }
    if(cell.k==="habitat"){
      hab++;
      if(near.indexOf("reactor")>=0)habPenalty++;
    }
    if(cell.k==="storage")store+=120;
    if(cell.k==="refinery")ref++;
    if(cell.k==="pad")pads++;
    cons+=use;
  }
  const eff=cons<=0?1:clamp(prod/cons,0,1);
  return {prod:Math.round(prod*10)/10,cons:Math.round(cons*10)/10,eff,
    drills,drillEff,hab,habPenalty,store:180+store,ref,pads};
}
function basePoolHeld(B){let s=0;for(const k in B.pool)s+=B.pool[k]|0;return s;}
/* ══════════════ ленивое время базы ══════════════ */
function baseTick(){
  const now=Date.now();
  for(const key in G.bases){
    const B=G.bases[key];
    if(!B.tMs){B.tMs=now;continue;}
    const dtMs=Math.min(now-B.tMs,CREW_OFFLINE_CAP);
    if(dtMs<1000)continue;
    B.tMs=now;
    const P=basePower(B),min=dtMs/60000;
    baseRaid(B,min);baseFixTick(B,min);
    if(!P.drills)continue;
    const cap=P.store;
    /* персонал (M47) — множитель к тому, что база и так умеет: бурильщик ускоряет
       выработку, инженер вытягивает отдачу при нехватке энергии */
    const crewBoost=1+baseRoleForce(B,"driller")*.45;
    const eff=clamp(P.eff+baseRoleForce(B,"engineer")*.18,0,1);
    let left=Math.min(min*P.drillEff*eff*crewBoost*1.1,Math.max(0,cap-basePoolHeld(B)));
    const r=rng(hashi(B.sx*7919+B.sy,B.idx,Math.floor(now/60000)));
    const pool=(B.res&&B.res.length)?B.res:["iron"];
    while(left>=1){
      const k=pick(pool,r);
      B.pool[k]=(B.pool[k]|0)+1;left--;
    }
    /* плавильня превращает часть добытого в сплавы прямо на месте */
    if(P.ref){
      let conv=Math.floor(min*P.ref*eff*.15);   // медленнее станции: база берёт не темпом, а тем, что работает сама
      while(conv>0){
        let src=null;
        for(const k in B.pool)if((B.pool[k]|0)>=4&&RARE_RES.indexOf(k)<0){src=k;break;}
        if(!src)break;
        B.pool[src]-=4;B.pool.alloy=(B.pool.alloy|0)+1;conv--;
      }
    }
  }
}
/* ══════════════ налёты пиратов на базу ══════════════ */
/* Разрешаются ленивым счётчиком, без отдельной сцены: последствия видно в
   разрезе (разбитый отсек) и в журнале. Охранник — единственная защита, и
   поэтому осмысленный. */
function baseRaid(B,min){
  const danger=sysDanger(B.sx,B.sy);
  if(danger<=.05)return;
  const chance=min*danger*.012;
  /* seed берём от самого отрезка времени, а не от текущей минуты: иначе
     несколько тиков подряд внутри одной минуты дают один и тот же исход */
  B.raidSeq=(B.raidSeq|0)+1;
  const r=rng(hashi(B.sx*131+B.sy,B.idx*7+3,hashi(B.tMs|0,B.raidSeq,0x2A1D)));
  if(r()>chance)return;
  const guard=baseRoleForce(B,"guard");
  if(guard>0&&r()<guard*.7){
    logAdd("kill","Налёт на базу «"+B.name+"» отбит охраной");
    return;
  }
  /* без охраны пропадает часть накопленного, иногда ломается отсек */
  let lost=0;
  for(const k in B.pool){
    const q=B.pool[k]|0;if(q<=0)continue;
    const t=Math.ceil(q*(.3+r()*.4));B.pool[k]=q-t;lost+=t;
  }
  let broke=null;
  if(r()<.4){
    const live=[];
    for(let i=0;i<B.cells.length;i++)if(B.cells[i]&&B.cells[i].hp>0&&B.cells[i].k!=="reactor")live.push(i);
    if(live.length){
      const i=live[Math.floor(r()*live.length)];
      B.cells[i].hp=0;broke=BUILD[B.cells[i].k].ru;
    }
  }
  logAdd("warn","Налёт на базу «"+B.name+"»"+(lost?" · унесено "+lost+" ед":"")+
    (broke?" · разбит отсек: "+broke:"")+(guard?"":" · охраны нет"));
}
/* инженер чинит разбитое сам, медленно */
function baseFixTick(B,min){
  const eng=baseRoleForce(B,"engineer");
  if(eng<=0)return;
  for(const cell of B.cells){
    if(cell&&cell.hp<1){
      cell.hp=Math.min(1,cell.hp+min*eng*.02);
      if(cell.hp>=1)logAdd("dim","Инженер восстановил отсек на базе «"+B.name+"»");
    }
  }
}
/* забрать накопленное в трюм — за этим и прилетаешь */
function baseCollect(B){
  const st=stat();let n=0;
  for(const k in B.pool){
    const q=B.pool[k]|0;if(q<=0)continue;
    const got=addRes(k,q);B.pool[k]=q-got;n+=got;
  }
  if(n>0)tell("","С базы забрано "+n+" ед · трюм "+held()+"/"+st.cargoMax,"Забрано "+n+" ед");
  else say("Забирать нечего\nили трюм полон");
  return n;
}
/* ══════════════ сеть баз ══════════════ */
/* Площадка (`pad`) связывает базы между собой и со станциями: перелёт стоит
   топлива и кредитов, зато не требует лететь через полгалактики руками. */
function baseList(){
  const out=[];
  for(const k in G.bases)out.push(G.bases[k]);
  return out.sort((a,b)=>a.built-b.built);
}
function basePads(){return baseList().filter(B=>basePower(B).pads>0);}
function baseJumpCost(B){
  const d=Math.hypot(B.sx-G.sx,B.sy-G.sy);
  return {fuel:Math.ceil(6+d*.9),credits:Math.round(120+d*40)};
}
function jumpToBase(B){
  const c=baseJumpCost(B);
  if(G.fuel<c.fuel){say("Не хватает топлива\nнужно "+c.fuel);return false;}
  if(G.credits<c.credits){say("Не хватает кредитов\nнужно "+c.credits);return false;}
  G.fuel-=c.fuel;G.credits-=c.credits;
  G.sx=B.sx;G.sy=B.sy;G.sys=getSystem(B.sx,B.sy);
  const p=G.sys.planets[B.idx];
  const a=Math.atan2(G.ship.y,G.ship.x)||0;
  if(p){G.ship.x=p.x+Math.cos(a)*(p.radius+170);G.ship.y=p.y+Math.sin(a)*(p.radius+170);}
  G.ship.vx=0;G.ship.vy=0;
  G.mode="system";G.base=null;G.st=null;G.ap=null;G.orbit=null;
  document.getElementById("station").classList.remove("open");
  spawnPirates();spawnAllies();
  saveGame(true);
  tell("","Переброска на базу «"+B.name+"» · −"+c.credits+" кр, −"+c.fuel+" топлива",
       "Переброска\n"+B.name);
  return true;
}
/* ══════════════ обновление сцены ══════════════ */
function updateBase(dt){
  const S=G.base,B=S.B;
  if(G.t%30<dt)baseTick();
  const tx=cellX(S.cur),ty=cellY(S.row);
  const dx=tx-S.x,dy=ty-S.y;
  S.x+=clamp(dx,-3.2*dt,3.2*dt);S.y+=clamp(dy,-2.6*dt,2.6*dt);
  const moving=Math.abs(dx)>2||Math.abs(dy)>2;
  S.walkPhase+=moving?.22*dt:0;
  if(S.menu){
    /* меню постройки: ▲▼ выбирают модуль, ДЕЙСТВ ставит, НАЗАД закрывает */
    if(keys.left&&!S.held){S.pick=(S.pick+BUILD_KEYS.length-1)%BUILD_KEYS.length;S.held=1;}
    if(keys.right&&!S.held){S.pick=(S.pick+1)%BUILD_KEYS.length;S.held=1;}
    if(!keys.left&&!keys.right)S.held=0;
    const k=BUILD_KEYS[S.pick],M=BUILD[k];
    const bad=M.surfaceOnly&&S.row>0;
    G.prompt="СТРОИТЬ: "+M.ru.toUpperCase()+"\n"+M.note+
      "\n"+M.cost.credits+" кр"+(M.cost.alloy?" + "+M.cost.alloy+" сплавов":"")+
      (bad?"\nТОЛЬКО НА ВЕРХНЕМ УРОВНЕ":"")+
      "\n◀ ▶ — выбор · ДЕЙСТВ — построить";
    if(actEdge){
      if(bad)say("Панель ставится только сверху");
      else if(!canPay(M.cost))say("Не хватает: "+M.cost.credits+" кр"+(M.cost.alloy?" и "+M.cost.alloy+" сплавов":""));
      else{
        payCost(M.cost);baseSet(B,S.cur,S.row,{k,hp:1});
        S.menu=false;
        tell("money","На базе «"+B.name+"» построено: "+M.ru,"Построено\n"+M.ru);
      }
    }
    return;
  }
  if(keys.left&&!S.held){S.cur=Math.max(0,S.cur-1);S.held=1;}
  if(keys.right&&!S.held){S.cur=Math.min(BASE_COLS-1,S.cur+1);S.held=1;}
  if(keys.thrust&&!S.held){S.row=Math.max(0,S.row-1);S.held=1;}
  if(keys.brake&&!S.held){S.row=Math.min(BASE_ROWS-1,S.row+1);S.held=1;}
  if(!keys.left&&!keys.right&&!keys.thrust&&!keys.brake)S.held=0;
  const cell=baseCell(B,S.cur,S.row);
  const P=basePower(B);
  const head="ЭНЕРГИЯ "+P.prod+" / "+P.cons+" · ОТДАЧА "+Math.round(P.eff*100)+"%"+
    "\nНА СКЛАДЕ "+basePoolHeld(B)+" / "+P.store;
  if(cell){
    const M=BUILD[cell.k];
    /* стоя на площадке, ДЕЙСТВ отправляет на следующую базу сети, а не собирает груз */
    const net=cell.k==="pad"?basePads().filter(o=>o!==B):[];
    if(net.length){
      /* цель — ближайшая площадка сети: выбирать некому, стрелки заняты ходьбой */
      net.sort((a,b)=>Math.hypot(a.sx-B.sx,a.sy-B.sy)-Math.hypot(b.sx-B.sx,b.sy-B.sy));
      const T=net[0],c=baseJumpCost(T);
      G.prompt=head+"\nПЛОЩАДКА · ДЕЙСТВ — ПЕРЕБРОСКА НА «"+T.name.toUpperCase()+"»"+
        "\n"+c.credits+" кр и "+c.fuel+" топлива";
      if(actEdge)jumpToBase(T);
      return;
    }
    G.prompt=head+"\n"+M.ru.toUpperCase()+" · "+M.note+
      (basePoolHeld(B)>0?"\nДЕЙСТВ — ЗАБРАТЬ НАКОПЛЕННОЕ":"");
    if(actEdge&&basePoolHeld(B)>0)baseCollect(B);
  }else{
    G.prompt=head+"\nПОРОДА · ДЕЙСТВ — ПРОКОПАТЬ И ПОСТАВИТЬ МОДУЛЬ";
    if(actEdge){S.menu=true;S.pick=0;}
  }
}
/* ══════════════ рисование разреза ══════════════ */
function drawBase(){
  const S=G.base,B=S.B,P=basePower(B);
  const camx=clamp(S.x-W/2,-40,BASE_COLS*BCELL_W+180-W);
  const camy=clamp(S.y-H/2,-120,BASE_ROWS*BCELL_H+260-H);
  const X=x=>x-camx, Y=y=>y-camy;
  /* небо и грунт: сверху планета, ниже срез породы */
  const sky=G.sys.planets[B.idx]?G.sys.planets[B.idx].T.sky:[[20,24,34],[8,10,16]];
  const g=ctx.createLinearGradient(0,Y(0),0,Y(150));
  g.addColorStop(0,"rgb("+sky[0].join(",")+")");
  g.addColorStop(1,"rgb("+sky[1].join(",")+")");
  ctx.fillStyle=g;ctx.fillRect(0,0,W,Y(150));
  ctx.fillStyle="#2a2119";ctx.fillRect(0,Y(150),W,H);
  /* слои породы — чтобы глубина читалась */
  for(let r=0;r<BASE_ROWS;r++){
    ctx.fillStyle=r%2?"rgba(0,0,0,.13)":"rgba(255,255,255,.03)";
    ctx.fillRect(0,Y(150+r*BCELL_H),W,BCELL_H);
  }
  /* тусклость от нехватки энергии — это и есть «видно, что энергии мало» */
  const lit=.35+P.eff*.65;
  for(let r=0;r<BASE_ROWS;r++)for(let c=0;c<BASE_COLS;c++){
    const x=X(90+c*BCELL_W),y=Y(150+r*BCELL_H);
    if(x>W+40||x+BCELL_W<-40)continue;
    const cell=baseCell(B,c,r);
    if(!cell){
      ctx.strokeStyle="rgba(255,255,255,.05)";ctx.lineWidth=1;
      ctx.strokeRect(x+6,y+6,BCELL_W-12,BCELL_H-12);
      continue;
    }
    drawModule(cell.k,x,y,cell.hp>0?lit:.12,c,r,B);
    if(cell.hp<=0){
      /* разбитый отсек: перечёркнут и тёмен — видно, что налёт был не бесплатным */
      ctx.strokeStyle="rgba(255,80,60,.7)";ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(x+14,y+14);ctx.lineTo(x+BCELL_W-14,y+BCELL_H-14);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x+BCELL_W-14,y+14);ctx.lineTo(x+14,y+BCELL_H-14);ctx.stroke();
    }
  }
  /* коридор-стяжка между отсеками одного уровня и шахта лифта */
  ctx.strokeStyle="rgba(242,178,92,"+(.2+lit*.3).toFixed(2)+")";ctx.lineWidth=2;
  for(let r=0;r<BASE_ROWS;r++){
    const y=Y(150+r*BCELL_H+BCELL_H*.78);
    ctx.beginPath();ctx.moveTo(X(96),y);ctx.lineTo(X(90+BASE_COLS*BCELL_W-6),y);ctx.stroke();
  }
  const lx=X(cellX(Math.floor(BASE_COLS/2)));
  ctx.strokeStyle="rgba(150,190,220,.35)";
  ctx.beginPath();ctx.moveTo(lx,Y(150));ctx.lineTo(lx,Y(150+BASE_ROWS*BCELL_H));ctx.stroke();
  /* астронавт — тот же силуэт, что на поверхности и в шахте */
  ctx.save();ctx.translate(X(S.x),Y(S.y)+26);ctx.scale(.9,.9);
  drawAstronaut({phase:S.walkPhase,amp:Math.abs(cellX(S.cur)-S.x)>2?1:0,walk:false,air:false});
  ctx.restore();
  /* рамка выбранной ячейки */
  const sx=X(90+S.cur*BCELL_W),sy=Y(150+S.row*BCELL_H);
  ctx.strokeStyle=(Math.sin(G.t*.12)>0)?"rgba(127,230,216,.95)":"rgba(127,230,216,.4)";
  ctx.lineWidth=2;ctx.strokeRect(sx+4,sy+4,BCELL_W-8,BCELL_H-8);
  if(S.menu)drawBuildMenu(S);
}
function drawModule(k,x,y,lit,c,r,B){
  const w=BCELL_W-12,h=BCELL_H-12,x0=x+6,y0=y+6;
  ctx.fillStyle="#0d141d";ctx.strokeStyle="rgba(242,178,92,"+(.35+lit*.45).toFixed(2)+")";ctx.lineWidth=2;
  ctx.beginPath();ctx.rect(x0,y0,w,h);ctx.fill();ctx.stroke();
  const cx=x0+w/2,cy=y0+h/2;
  if(k==="reactor"){
    /* светится тем ярче, чем больше отдача — источник света всей базы */
    const pulse=.55+Math.sin(G.t*.06)*.12;
    const gg=ctx.createRadialGradient(cx,cy,2,cx,cy,w*.5);
    gg.addColorStop(0,"rgba(140,240,255,"+(pulse*lit).toFixed(2)+")");
    gg.addColorStop(1,"rgba(140,240,255,0)");
    ctx.fillStyle=gg;ctx.fillRect(x0,y0,w,h);
    ctx.strokeStyle="rgba(140,240,255,.8)";ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(cx,cy,16,0,TAU);ctx.stroke();
    ctx.beginPath();ctx.arc(cx,cy,9,0,TAU);ctx.stroke();
  }else if(k==="solar"){
    ctx.fillStyle="rgba(40,72,110,.9)";ctx.strokeStyle="rgba(130,190,230,.6)";
    ctx.beginPath();ctx.rect(x0+10,cy-12,w-20,24);ctx.fill();ctx.stroke();
    for(let i=1;i<5;i++){const xx=x0+10+i*(w-20)/5;
      ctx.beginPath();ctx.moveTo(xx,cy-12);ctx.lineTo(xx,cy+12);ctx.stroke();}
  }else if(k==="drill"){
    /* бур уходит в породу и крутится только когда есть энергия */
    const P=basePower(B),spin=P.eff>.05?G.t*.08*P.eff:0;
    ctx.strokeStyle="rgba(220,150,90,.85)";ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(cx,y0+12);ctx.lineTo(cx,y0+h);ctx.stroke();
    ctx.save();ctx.translate(cx,y0+h-8);ctx.rotate(spin);
    ctx.fillStyle="#c8875a";
    ctx.beginPath();ctx.moveTo(-8,-8);ctx.lineTo(8,-8);ctx.lineTo(0,10);ctx.closePath();ctx.fill();
    ctx.restore();
    ctx.fillStyle="rgba(220,150,90,.5)";ctx.fillRect(cx-14,y0+10,28,8);
  }else if(k==="storage"){
    ctx.fillStyle="#1d2f42";ctx.strokeStyle="rgba(150,190,220,.6)";
    for(let i=0;i<3;i++)for(let j=0;j<2;j++){
      ctx.beginPath();ctx.rect(x0+14+i*36,cy-18+j*22,30,18);ctx.fill();ctx.stroke();
    }
  }else if(k==="habitat"){
    /* окна горят тем ровнее, чем лучше с энергией */
    ctx.fillStyle="#141d28";ctx.fillRect(x0+8,cy-16,w-16,32);
    for(let i=0;i<4;i++){
      const on=Math.sin(G.t*.03+i*1.7)>-.3;
      ctx.fillStyle=on?"rgba(255,230,170,"+(.35+lit*.55).toFixed(2)+")":"rgba(255,230,170,.12)";
      ctx.beginPath();ctx.arc(x0+24+i*26,cy,5,0,TAU);ctx.fill();
    }
  }else if(k==="refinery"){
    ctx.strokeStyle="rgba(210,140,80,.85)";ctx.lineWidth=2;ctx.fillStyle="#14161a";
    ctx.beginPath();ctx.moveTo(x0+16,y0+h-10);ctx.lineTo(x0+30,cy-14);
    ctx.lineTo(x0+w-30,cy-14);ctx.lineTo(x0+w-16,y0+h-10);ctx.closePath();ctx.fill();ctx.stroke();
    const fl=Math.abs(Math.sin(G.t*.11))*8*lit;
    ctx.fillStyle="rgba(255,170,70,.8)";
    ctx.beginPath();ctx.ellipse(cx,cy+6,6,4+fl,0,0,TAU);ctx.fill();
  }else if(k==="pad"){
    ctx.strokeStyle="rgba(127,230,216,.8)";ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(cx,cy+8,w*.34,10,0,0,TAU);ctx.stroke();
    ctx.fillStyle=(Math.sin(G.t*.14)>0)?"rgba(127,230,216,.8)":"rgba(127,230,216,.2)";
    for(let i=0;i<4;i++){
      const a=i*TAU/4+G.t*.01;
      ctx.beginPath();ctx.arc(cx+Math.cos(a)*w*.34,cy+8+Math.sin(a)*10,2.4,0,TAU);ctx.fill();
    }
  }
  ctx.fillStyle="rgba(242,178,92,"+(.4+lit*.4).toFixed(2)+")";
  ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
  ctx.fillText(BUILD[k].ru.toUpperCase(),cx,y0+h-4);
}
function drawBuildMenu(S){
  const w=Math.min(W-40,420),x=W/2-w/2,y=H-150;
  ctx.fillStyle="rgba(6,10,16,.88)";ctx.fillRect(x,y,w,64);
  ctx.strokeStyle="rgba(242,178,92,.6)";ctx.lineWidth=1;ctx.strokeRect(x,y,w,64);
  const n=BUILD_KEYS.length,cw=w/n;
  for(let i=0;i<n;i++){
    const k=BUILD_KEYS[i],on=i===S.pick;
    ctx.fillStyle=on?"rgba(242,178,92,.18)":"rgba(0,0,0,0)";
    ctx.fillRect(x+i*cw,y+2,cw,60);
    ctx.fillStyle=on?"rgba(255,230,180,.95)":"rgba(200,210,220,.5)";
    ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
    ctx.fillText(BUILD[k].ru.toUpperCase().slice(0,9),x+i*cw+cw/2,y+22);
    ctx.fillText(BUILD[k].cost.credits+"кр",x+i*cw+cw/2,y+36);
    if(BUILD[k].cost.alloy)ctx.fillText(BUILD[k].cost.alloy+"спл",x+i*cw+cw/2,y+48);
  }
}
