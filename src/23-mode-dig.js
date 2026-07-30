/* ══════════════ шахта: спуск вглубь планеты ══════════════ */
/* порода генерируется лениво по мере спуска, между визитами не хранится */
const DIG_CELL=30, DIG_HALF=7;
/* Разрез планеты считан для среза грунта: вся стопка там укладывается
   в три сотни пикселей, и в шахте пласты кончались на тридцати метрах —
   дальше до самого низа шло «основание», то есть один цвет на весь спуск.
   В шахте тот же разрез растянут вчетверо: породы сменяются столько раз,
   сколько игрок успевает заметить, и не раньше. */
const DIG_GEO_K=.25;
/* руда живёт только в разрежённых рудных телах, а не в каждой второй ячейке —
   решётка узлов 7×5, каждый узел детерминированно есть/нет, свой центр/радиус/ресурс */
const ORE_NODE_W=7, ORE_NODE_H=5;
function oreNode(D,nc,nr){
  const key=nc+","+nr;
  const cache=D.nodes||(D.nodes={});
  if(key in cache)return cache[key];
  const r=rng(hashi(D.p.seed+nc*92821,nr*68111,0xA10E));
  const ti=tierAt(nr*ORE_NODE_H);
  const pool=PROFILE[D.p.type].concat(DEPTH_TIERS[ti].extra);
  const exists=pool.length>0&&r()<.42;
  const node=exists?{
    cx:nc*ORE_NODE_W+1.5+r()*(ORE_NODE_W-3),
    cy:nr*ORE_NODE_H+1+r()*(ORE_NODE_H-2),
    rad:1.2+r()*1.2,
    res:pool[Math.floor(r()*pool.length)]
  }:null;
  cache[key]=node;return node;
}
function digCell(D,col,row){
  const key=col+","+row;
  let c=D.cells[key];
  if(c)return c;
  const ti=tierAt(row),T=DEPTH_TIERS[ti];
  const r=rng(hashi(D.p.seed+col*7919,row*104729,0x5EED));
  const nc=Math.floor(col/ORE_NODE_W),nr=Math.floor(row/ORE_NODE_H);
  let res=null,amount=0,nearNode=false;
  for(let dnc=-1;dnc<=1;dnc++)for(let dnr=-1;dnr<=1;dnr++){
    const nd=oreNode(D,nc+dnc,nr+dnr);
    if(!nd)continue;
    const dist=Math.hypot(col-nd.cx,row-nd.cy);
    if(dist<nd.rad+1.5)nearNode=true;
    if(dist<nd.rad&&!res){
      res=nd.res;
      amount=Math.max(1,Math.round((1+Math.floor(r()*2))*T.mult*(1-dist/nd.rad*.4)));
    }
  }
  c={dug:false,res,amount,prog:0,hard:.7+ti*.5+r()*.5,tint:r(),nearNode};
  D.cells[key]=c;return c;
}
function enterDig(){
  const S=G.surf;
  G.dig={p:S.p,col:0,row:0,cells:{},nodes:{},target:null,move:0,deepest:0,face:1,
    bugs:[],zap:0,zapT:0,walkAmp:0,walkPhase:0};
  G.dig.cells["0,0"]={dug:true,res:null,amount:0,prog:0,hard:0,tint:0};
  G.mode="dig";
  say("Спуск в шахту\nW A S D — копать вверх/вбок/вниз\nна поверхности W — выход · ОГОНЬ — импульс");
}
function exitDig(){
  G.dig=null;G.mode="surface";
  say("Подъём на поверхность\nв трюме: "+held());
  saveGame(true);
}
/* возвратный маяк: мгновенно к кораблю, с перезарядкой.
   Раньше кнопка появлялась только после покупки науки «Возвратный маяк», и на
   планете телепорта просто не было. Теперь он есть всегда, а наука сокращает
   перезарядку вчетверо — за неё платят скоростью, а не самой возможностью. */
const BEACON_COOL=2400;
function beaconCool(){return G.tech.has("beacon")?BEACON_COOL/4:BEACON_COOL;}
function useBeacon(){
  const S=G.surf;
  if(!S||S.beacon>0)return;
  const deep=G.dig?G.dig.row:0;
  S.beacon=beaconCool();
  G.dig=null;G.cave=null;G.mode="surface";
  S.x=S.shipX;S.y=groundAt(S.tr,S.shipX)-10;S.vy=0;
  S.walkTarget=null;
  sfx("ui",{f:220,to:1400,d:.35,v:.5});
  say("Телепорт к кораблю\nмаяк заряжается");
  logAdd("tech","Маяк: возврат к кораблю с "+(deep*3)+" м");
}
function beaconTick(dt){
  const S=G.surf,b=document.getElementById("beaconbtn");
  if(!S||(G.mode!=="surface"&&G.mode!=="dig"&&G.mode!=="cave")){b.style.display="none";return;}
  if(S.beacon>0)S.beacon=Math.max(0,S.beacon-dt);
  b.style.display="";
  const ready=S.beacon<=0;
  b.textContent=ready?"→ КОРАБЛЬ":Math.ceil(S.beacon/60)+"с";
  b.style.opacity=ready?"1":".45";
}

/* скафандр — единственный расходник на планете, корпус здесь не страдает */
function suitHit(n,why){
  const S=G.surf;
  sfx("hit",{v:.5});
  S.suit=Math.max(0,S.suit-n);
  if(why)say(why+"\nскафандр −"+Math.round(n));
  if(S.suit<=0)suitFailure();
}
function suitFailure(){
  const S=G.surf;
  S.suit=0;
  G.dig=null;G.mode="surface";
  S.x=S.shipX;S.y=groundAt(S.tr,S.shipX)-10;S.vy=0;
  say("СКАФАНДР РАЗРУШЕН\nаварийный возврат к кораблю");
  logAdd("warn","Скафандр разрушен на "+S.p.name+" · аварийный возврат к кораблю");
}
function updateDig(dt){
  const D=G.dig,S=G.surf,st=stat();
  document.getElementById("dronebtn").style.display="none";
  /* износ растёт с глубиной; на нуле — аварийный возврат, без урона кораблю */
  S.suit=Math.max(0,S.suit-(.0025+D.row*.0006)*st.suitWear*dt);
  if(S.suit<=25&&!S.warned){S.warned=true;say("СКАФАНДР НА ИСХОДЕ\n▲ наверх, к кораблю");}
  if(S.suit<=0){suitFailure();return;}
  /* фауна живёт независимо от того, бурим мы сейчас или стоим */
  digFauna(dt,st);
  if(G.mode!=="dig")return;
  if(D.move>0)D.move-=dt;
  let dx=0,dy=0;
  /* копаем в ту сторону, куда нажали: S (ТОРМ) — вниз, W (▲) — вверх, A/D — вбок.
     ДЕЙСТВ оставлен синонимом «вниз» — на телефоне это привычная большая кнопка. */
  if(keys.brake||keys.act)dy=1;
  else if(keys.thrust)dy=-1;
  else if(keys.left)dx=-1;
  else if(keys.right)dx=1;
  else if(D.walkTarget){
    const dCol=D.walkTarget.col-D.col,dRow=D.walkTarget.row-D.row;
    if(!dCol&&!dRow)D.walkTarget=null;
    else if(dRow>0)dy=1;else if(dRow<0)dy=-1;else dx=Math.sign(dCol);
  }
  if(keys.act||keys.brake||keys.thrust||keys.left||keys.right)D.walkTarget=null;
  if(dx)D.face=dx;
  const digging=!!(dx||dy);
  D.walkAmp=clamp(D.walkAmp+(digging?1:-1)*.12*dt,0,1);
  if(digging)D.walkPhase+=dt*.3;

  if(D.row===0&&dy===-1){exitDig();return;}
  const depth=D.row*3;
  /* к ярусу добавлена порода из разреза: игрок читает не только «как глубоко»,
     но и «в чём именно копает» — это то же название, что у слоя в срезе */
  let head="ГЛУБИНА "+depth+" м · "+DEPTH_TIERS[tierAt(D.row)].ru.toUpperCase()+
    " · "+geoAt(D.p,D.row*DIG_CELL*DIG_GEO_K).ru.toUpperCase()+
    "\nСКАФАНДР "+Math.round(S.suit)+"% · ТРЮМ "+held()+"/"+st.cargoMax;
  if(D.bugs.some(b=>b.stun<=0&&b.flee<=0))
    head+="\nКУСАЧИЕ РЯДОМ · ОГОНЬ (F) — ИМПУЛЬС, ПОТОМ ПОДОЙТИ ЗА ОБРАЗЦОМ";
  if(!dx&&!dy){D.target=null;
    G.prompt=head+"\nW A S D — КОПАТЬ ВВЕРХ / ВБОК / ВНИЗ";return;}

  const tc=D.col+dx,tr2=D.row+dy;
  if(tr2<0||Math.abs(tc)>DIG_HALF){D.target=null;G.prompt=head;return;}
  const ti=tierAt(tr2);
  if(ti>st.digTier){
    D.target=null;
    G.prompt=head+"\nПОРОДА НЕ ПОДДАЁТСЯ — НУЖЕН "+DEPTH_TIERS[ti].need.toUpperCase();
    return;
  }
  const cell=digCell(D,tc,tr2);
  if(cell.dug){
    if(D.move<=0){D.col=tc;D.row=tr2;D.move=11;D.deepest=Math.max(D.deepest,D.row);}
    D.target=null;G.prompt=head;
    return;
  }
  if(held()>=st.cargoMax&&cell.res){G.prompt=head+"\nТРЮМ ПОЛОН";D.target=null;return;}
  D.target=cell;
  /* проходка вдвое медленнее прежней: шахта должна быть работой, а не прокруткой
     экрана. Ускоряется за деньги — модуль БУРОВАЯ УСТАНОВКА на станции даёт
     st.drill, он же множитель здесь. */
  cell.prog+=.019*st.drill*dt;
  G.prompt=head+"\nПРОХОДКА "+Math.round(clamp(cell.prog/cell.hard,0,1)*100)+"%"+
    (cell.res?" · ЖИЛА: "+RES[cell.res].ru.toUpperCase():"")+
    (st.drill<1.3?"\nБЫСТРЕЕ — МОДУЛЬ «БУРОВАЯ УСТАНОВКА» НА СТАНЦИИ":"");
  if(cell.prog>=cell.hard){
    cell.dug=true;D.target=null;
    /* по вертикальному ходу остаётся лесенка: видно, где можно подняться обратно */
    if(dy){cell.ladder=true;digCell(D,D.col,D.row).ladder=true;}
    D.col=tc;D.row=tr2;D.move=11;D.deepest=Math.max(D.deepest,D.row);
    if(cell.res){
      const got=addRes(cell.res,Math.round(cell.amount*st.refine));
      if(got)say("Добыто: "+RES[cell.res].ru+" ×"+got);
    }
    /* Артефакты лежат в глубине и нигде не продаются. Шанс растёт с глубиной,
       а «след» исследователя (перк «происхождение») удваивает его в том самом
       секторе, который он назвал: указание должно что-то значить. */
    if(tr2>=14){
      const onTrail=G.relicHint&&G.relicHint.sx===G.sx&&G.relicHint.sy===G.sy;
      const ch=Math.min(.05,(tr2-14)*.0012)*(onTrail?2:1);
      const id=relicRoll(hashi(D.p.seed+tc*17,tr2*91,0x2E1),ch);
      if(id){
        relicFind(id,"из пласта на "+(tr2*3)+" м");
        if(onTrail)G.relicHint=null;
      }
    }
    /* обвал: бьёт по скафандру, никогда не запирает игрока */
    const cr=rng(hashi(D.p.seed+tc*31,tr2*57,0xCAFE));
    if(ti>0&&cr()<.03+ti*.015){
      logAdd("warn","Обвал на глубине "+(tr2*3)+" м · скафандр "+Math.round(Math.max(0,S.suit-8))+"%");
      suitHit(8+ti*6+cr()*8,"Обвал породы");
      if(G.mode!=="dig")return;
    }
  }
}
/* ── порода живая: чем глубже, тем чаще из стен лезут грызуны ── */
const ZAP_COOL=90, ZAP_R=78, STUN_T=420;
function digFauna(dt,st){
  const D=G.dig,S=G.surf;
  const px=D.col*DIG_CELL+DIG_CELL/2, py=D.row*DIG_CELL+DIG_CELL/2;
  const ti=tierAt(D.row);
  /* подселяем по мере углубления, детерминированно от клетки. Раньше кусачие
     заводились только со второго пласта (ti>0) — до него доходили единицы, и
     механика выглядела несуществующей. Теперь они есть с первых метров, просто
     реже и слабее. */
  if(D.row>2&&D.bugs.length<2+ti){
    const key=D.col+":"+D.row;
    if(D.lastSpawnKey!==key){
      D.lastSpawnKey=key;
      const r=rng(hashi(D.p.seed+D.col*613,D.row*929,0xB17E));
      /* верхний пласт упирается в потолок в 15 рядов (глубже нужен бур), и при
         шансе 10% на клетку игрок вполне мог не встретить никого вообще */
      if(r()<.18+ti*.06){
        const side=r()<.5?-1:1;
        const b=genBeast(r,D.p,0,0);
        b.r=6+r()*6;b.hostile=true;b.stun=0;b.bite=0;b.flee=0;
        b.x=px+side*(120+r()*90);b.y=py+(r()-.5)*90;
        D.bugs.push(b);
        say("В породе кто-то есть\nОГОНЬ (F) — импульсный разрядник\nоглушённого можно забрать, подойдя вплотную");
      }
    }
  }
  /* импульсный разрядник — оглушает всех вокруг */
  if(D.zap>0)D.zap-=dt;
  if(D.zapT>0)D.zapT-=dt;
  if(keys.fire&&D.zap<=0){
    D.zap=ZAP_COOL;D.zapT=16;sfx("ui",{f:1500,to:180,d:.22,v:.4});
    let n=0;
    for(const b of D.bugs)
      if(Math.hypot(b.x-px,b.y-py)<ZAP_R){b.stun=STUN_T;b.flee=0;n++;}
    say(n?"Импульс · оглушено: "+n:"Импульс · мимо");
  }
  for(let i=D.bugs.length-1;i>=0;i--){
    const b=D.bugs[i];
    if(b.stun>0){
      b.stun-=dt;
      if(b.stun<=0)b.flee=300;          // очнулся и уходит
      continue;
    }
    const dx=px-b.x,dy=py-b.y,d=Math.hypot(dx,dy)||1;
    if(b.flee>0){
      b.flee-=dt;
      b.x-=dx/d*.9*dt;b.y-=dy/d*.9*dt;
      b.face=dx>0?-1:1;
      if(b.flee<=0){D.bugs.splice(i,1);continue;}
      continue;
    }
    if(d>10){b.x+=dx/d*.55*dt;b.y+=dy/d*.55*dt;b.face=dx>0?1:-1;}
    if(b.bite>0)b.bite-=dt;
    if(d<18&&b.bite<=0){
      b.bite=100;
      logAdd("warn","Укус на глубине "+(D.row*3)+" м · скафандр "+
        Math.round(Math.max(0,S.suit-(3+ti*2)))+"%");
      suitHit(3+ti*2,"Укус");
      if(G.mode!=="dig")return;
    }
  }
  /* образец берётся сам, стоит подойти вплотную: отдельная кнопка (ТОРМ) теперь
     занята копанием вниз, да и лишний жест здесь никому не был нужен */
  const near=D.bugs.find(b=>b.stun>0&&Math.hypot(b.x-px,b.y-py)<40);
  D.sample=near||null;
  if(near){
    const r=rng(hashi(Math.round(near.x),Math.round(near.y),0x5A99));
    const c=addRes("carbon",2+Math.floor(r()*4));
    const x2=r()<.35+ti*.12?addRes("xeno",1+Math.floor(r()*2)):0;
    D.bugs.splice(D.bugs.indexOf(near),1);
    G.species.add(near.name);G.data+=6;
    tell("tech","Образец: "+near.name+" · углерод ×"+c+(x2?" · ксенобиом ×"+x2:""),
      "Образец взят\nуглерод ×"+c+(x2?"\nксенобиом ×"+x2:"")+"\n+6 данных");
  }
}
function drawDigFauna(camx,camy){
  const D=G.dig;
  for(const b of D.bugs)drawBeast(b,b.x-camx,b.y-camy+b.r*.9,true,b.stun);
  if(D.zapT>0){
    const px=D.col*DIG_CELL+DIG_CELL/2-camx, py=D.row*DIG_CELL+DIG_CELL/2-camy;
    const k=1-D.zapT/16;
    ctx.strokeStyle="rgba(150,225,255,"+((1-k)*.85).toFixed(2)+")";ctx.lineWidth=3-k*2;
    ctx.beginPath();ctx.arc(px,py,ZAP_R*k,0,TAU);ctx.stroke();
  }
}
/* ── отрисовка ──
   Шахта рисовалась поклеточно: у каждой ячейки своя заливка, своя кромка и
   своя обводка. На экране это читалось клетчатой скатертью — сетка тридцати
   пикселей была видна раньше, чем порода, и никакой материал её не спасал.

   Устройство перевёрнуто: порода — сплошной массив с пластами и материалом,
   а рисуется не она, а **пустота**. Выработка собирается в один путь из всех
   пройденных клеток, заливается тьмой и обводится кромкой света. Сетки не
   остаётся нигде: внутренних границ у объединённого пути нет.

   Свет тоже другой: глубина сама по себе темнеет, а видно ровно столько,
   сколько берёт фонарь. Пласт, из которого копаешь, читается полосой поперёк
   всего кадра — по нему видно, что порода сменилась, ещё до того, как это
   скажет строка. */
function digRockPass(D,p,camx,camy){
  /* пласты во всю ширину: тот же разрез, что в срезе грунта и в геологии */
  const G0=geologyOf(p);
  for(let k=0;k<G0.length;k++){
    const L=G0[k];
    const P=new Path2D();
    let started=false;
    for(let sx=-20;sx<=W+20;sx+=26){
      const wx=camx+sx, y=(L.d0+geoWob(L,wx))/DIG_GEO_K-camy;
      if(!started){P.moveTo(sx,y);started=true;}else P.lineTo(sx,y);
    }
    P.lineTo(W+20,H+40);P.lineTo(-20,H+40);P.closePath();
    ctx.fillStyle="rgb("+L.col.join(",")+")";
    ctx.fill(P);
    ctx.strokeStyle="rgba(0,0,0,.34)";ctx.lineWidth=1.4;ctx.stroke(P);
    /* жилы минерала внутри пласта — те же штрихи, что в срезе: короткие,
       наклонные, от координаты, поэтому не мигают при движении */
    if(L.vein>.05){
      const mn=MINERAL[(L.seed>>>3)%MINERAL.length];
      ctx.save();ctx.clip(P);
      const st=54, x0=Math.floor((camx-st)/st)*st;
      for(let wx=x0;wx<camx+W+st;wx+=st){
        const hh=hashi(Math.floor(wx/st),L.seed,0x5EED);
        if((hh&255)/255>L.vein*.5)continue;
        const dy=L.d0+((hh>>>8)&63)/63*L.th*.8;
        const sx=wx-camx, sy=(dy+geoWob(L,wx))/DIG_GEO_K-camy;
        if(sy<-20||sy>H+20)continue;
        const ln=9+((hh>>>14)&15), ang=((hh>>>18)&15)/15*1.1-.55;
        ctx.strokeStyle="rgba("+mn.join(",")+","+(.16+((hh>>>22)&7)/7*.26).toFixed(2)+")";
        ctx.lineWidth=1+((hh>>>25)&1);
        ctx.beginPath();ctx.moveTo(sx,sy);
        ctx.lineTo(sx+Math.cos(ang)*ln,sy+Math.sin(ang)*ln);ctx.stroke();
      }
      ctx.restore();
    }
  }
  /* материал планеты поверх пластов: два прохода, как везде */
  const mat=planetMat(p);
  if(mat)fillMaterial(mat,camx,camy,.52,.30,null,{x:0,y:0,w:W,h:H});
  /* и глубина: чем ниже, тем меньше света доходит */
  const dk=clamp((camy+H*.5)/2600,0,.34);
  ctx.fillStyle="rgba(2,4,9,"+(.16+dk).toFixed(3)+")";
  ctx.fillRect(0,0,W,H);
}
/* пустота: один путь на всю выработку */
function digVoidPath(D,camx,camy){
  const P=new Path2D();
  const r0=Math.max(0,Math.floor(camy/DIG_CELL)-1), r1=Math.ceil((camy+H)/DIG_CELL)+1;
  for(let row=r0;row<=r1;row++)for(let col=-DIG_HALF;col<=DIG_HALF;col++){
    const cell=D.cells[col+","+row];
    if(!cell||!cell.dug)continue;
    const x=col*DIG_CELL-camx, y=row*DIG_CELL-camy;
    /* клетки перекрываются на пиксель и получают скруглённый угол со
       случайным радиусом: объединение таких прямоугольников даёт вырубленную
       полость, а не плитку. Радиус от координаты — не дрожит */
    const h=hashi(col,row,0xD16C);
    const rad=5+((h>>>3)&7)*.9;
    /* раздуваем на четыре пикселя: при перекрытии в один соседние клетки
       смыкались только по касательной, и ход читался цепочкой отдельных
       камер. С запасом они сливаются в один коридор с рваной кромкой */
    if(P.roundRect)P.roundRect(x-4,y-4,DIG_CELL+8,DIG_CELL+8,rad);
    else P.rect(x-4,y-4,DIG_CELL+8,DIG_CELL+8);
  }
  return P;
}
function drawDig(){
  const D=G.dig,p=D.p;
  const px=D.col*DIG_CELL,py=D.row*DIG_CELL;
  const camx=px-W/2,camy=py-H*.5;
  const scanAll=G.tech.has("survey");
  digRockPass(D,p,camx,camy);
  /* рудное тело светится сквозь породу — мягким пятном, а не заливкой клетки:
     заливка возвращала ту самую сетку, от которой уходим */
  const r0=Math.max(0,Math.floor(camy/DIG_CELL)-1), r1=Math.ceil((camy+H)/DIG_CELL)+1;
  ctx.save();ctx.globalCompositeOperation="lighter";
  for(let row=r0;row<=r1;row++)for(let col=-DIG_HALF;col<=DIG_HALF;col++){
    const key=col+","+row, cell=D.cells[key]||digCell(D,col,row);
    if(cell.dug||!cell.res)continue;
    if(!scanAll&&Math.hypot(col-D.col,row-D.row)>7)continue;
    const x=col*DIG_CELL-camx+DIG_CELL/2, y=row*DIG_CELL-camy+DIG_CELL/2;
    const col2=RES[cell.res].col;
    const g=ctx.createRadialGradient(x,y,1,x,y,DIG_CELL*.95);
    g.addColorStop(0,col2);g.addColorStop(1,"rgba(0,0,0,0)");
    ctx.globalAlpha=.22;ctx.fillStyle=g;
    ctx.beginPath();ctx.arc(x,y,DIG_CELL*.95,0,TAU);ctx.fill();
    /* вблизи видно и само зерно руды */
    if(scanAll||Math.hypot(col-D.col,row-D.row)<4.5){
      ctx.globalAlpha=.5;ctx.fillStyle=col2;
      for(let i=0;i<3;i++){
        const o=(cell.tint*7+i*11)%16;
        ctx.beginPath();ctx.arc(x-8+o,y-6+((i*9+o)%13),1.9,0,TAU);ctx.fill();
      }
    }
  }
  ctx.restore();
  /* ── выработка ── */
  const VP=digVoidPath(D,camx,camy);
  ctx.fillStyle="rgba(3,5,10,.90)";
  ctx.fill(VP);
  /* Кромку нельзя обводить целиком: объединённый путь хранит контуры всех
     клеток, и обводка вылезает волосками поперёк хода через каждые тридцать
     пикселей — та же сетка, только светящаяся. Поэтому грань рисуется только
     там, где за ней действительно порода. */
  ctx.save();ctx.clip(VP);
  for(let row=r0;row<=r1;row++)for(let col=-DIG_HALF;col<=DIG_HALF;col++){
    const cell=D.cells[col+","+row];
    if(!cell||!cell.dug)continue;
    const x=col*DIG_CELL-camx, y=row*DIG_CELL-camy;
    const dug=(c,rr)=>{const q=D.cells[c+","+rr];return q&&q.dug;};
    /* тень от стены внутрь хода и волосок света по самой грани */
    const wall=(x0,y0,w0,h0,gx,gy)=>{
      const g=ctx.createLinearGradient(x0,y0,x0+gx,y0+gy);
      g.addColorStop(0,"rgba(0,0,0,.62)");g.addColorStop(1,"rgba(0,0,0,0)");
      ctx.fillStyle=g;ctx.fillRect(x0,y0,w0,h0);
    };
    if(!dug(col,row-1)){wall(x-4,y-4,DIG_CELL+8,10,0,10);
      ctx.fillStyle="rgba(185,220,240,.16)";ctx.fillRect(x-4,y-4,DIG_CELL+8,1.2);}
    if(!dug(col,row+1))wall(x-4,y+DIG_CELL-2,DIG_CELL+8,6,0,-6);
    if(!dug(col-1,row)){wall(x-4,y-4,8,DIG_CELL+8,8,0);
      ctx.fillStyle="rgba(185,220,240,.10)";ctx.fillRect(x-4,y-4,1.2,DIG_CELL+8);}
    if(!dug(col+1,row)){wall(x+DIG_CELL-4,y-4,8,DIG_CELL+8,-8,0);
      ctx.fillStyle="rgba(185,220,240,.10)";ctx.fillRect(x+DIG_CELL+2.8,y-4,1.2,DIG_CELL+8);}
  }
  ctx.restore();
  /* крепь: рама через каждые четыре метра ствола. Она же даёт масштаб —
     без неё ход одинаков на любой глубине */
  for(let row=r0;row<=r1;row++){
    if(row%4)continue;
    const cell=D.cells["0,"+row];
    if(!cell||!cell.dug)continue;
    const x=-camx, y=row*DIG_CELL-camy;
    ctx.strokeStyle="rgba(150,116,74,.55)";ctx.lineWidth=2.4;
    ctx.beginPath();
    ctx.moveTo(x-2,y+DIG_CELL);ctx.lineTo(x-2,y+2);
    ctx.lineTo(x+DIG_CELL+2,y+2);ctx.lineTo(x+DIG_CELL+2,y+DIG_CELL);
    ctx.stroke();
    ctx.strokeStyle="rgba(230,200,160,.16)";ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(x-1,y+3.4);ctx.lineTo(x+DIG_CELL+1,y+3.4);ctx.stroke();
  }
  /* лесенка в вертикальном ходе */
  for(let row=r0;row<=r1;row++)for(let col=-DIG_HALF;col<=DIG_HALF;col++){
    const cell=D.cells[col+","+row];
    if(!cell||!cell.dug||!cell.ladder)continue;
    const x=col*DIG_CELL-camx,y=row*DIG_CELL-camy;
    ctx.strokeStyle="rgba(196,150,92,.62)";ctx.lineWidth=1.4;
    ctx.beginPath();
    ctx.moveTo(x+DIG_CELL*.36,y);ctx.lineTo(x+DIG_CELL*.36,y+DIG_CELL);
    ctx.moveTo(x+DIG_CELL*.64,y);ctx.lineTo(x+DIG_CELL*.64,y+DIG_CELL);
    for(let k=1;k<=3;k++){
      const ry=y+DIG_CELL*k/4;
      ctx.moveTo(x+DIG_CELL*.36,ry);ctx.lineTo(x+DIG_CELL*.64,ry);
    }
    ctx.stroke();
  }
  /* забой под резаком: подсветка и полоса проходки */
  if(D.target){
    const t=D.target;
    for(let row=r0;row<=r1;row++)for(let col=-DIG_HALF;col<=DIG_HALF;col++){
      if(D.cells[col+","+row]!==t)continue;
      const x=col*DIG_CELL-camx,y=row*DIG_CELL-camy;
      ctx.fillStyle="rgba(242,178,92,.20)";ctx.fillRect(x,y,DIG_CELL,DIG_CELL);
      ctx.fillStyle="rgba(0,0,0,.55)";ctx.fillRect(x+3,y+DIG_CELL-8,DIG_CELL-6,4);
      ctx.fillStyle="#f2b25c";
      ctx.fillRect(x+3,y+DIG_CELL-8,(DIG_CELL-6)*clamp(t.prog/t.hard,0,1),4);
      /* искры из-под резака: единственное, что тут происходит быстро */
      ctx.save();ctx.globalCompositeOperation="lighter";
      for(let i=0;i<4;i++){
        const ph=(G.t*.6+i*23)%18;
        const a=(1-ph/18)*.5;
        ctx.fillStyle="rgba(255,210,140,"+a.toFixed(3)+")";
        ctx.fillRect(x+DIG_CELL/2+Math.cos(i*2.3)*ph*1.2,
          y+DIG_CELL/2+Math.sin(i*2.3)*ph*.9,1.6,1.6);
      }
      ctx.restore();
    }
  }
  /* небо в устье шахты */
  if(camy<0){ctx.fillStyle=skyGrad(p);ctx.fillRect(0,0,W,-camy);}
  drawDigFauna(camx,camy);
  const sx=px-camx+DIG_CELL/2,sy=py-camy+DIG_CELL/2;
  const suit=G.surf.suit;
  /* темнота и фонарь — те же, что в пещере: под землёй свет один и тот же,
     и разниться он не должен */
  if(camy>-H*.3){
    const g=ctx.createRadialGradient(sx,sy,30,sx,sy,Math.max(W,H)*.46);
    g.addColorStop(0,"rgba(0,0,0,0)");
    g.addColorStop(.45,"rgba(1,3,7,.34)");
    g.addColorStop(1,"rgba(0,1,4,.80)");
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  }
  ctx.save();ctx.globalCompositeOperation="lighter";
  const f=D.face||1;
  const lg=ctx.createLinearGradient(sx,sy,sx+f*170,sy);
  lg.addColorStop(0,"rgba(190,215,235,.13)");
  lg.addColorStop(1,"rgba(150,190,220,0)");
  ctx.fillStyle=lg;
  ctx.beginPath();ctx.moveTo(sx,sy-12);ctx.lineTo(sx+f*190,sy-64);
  ctx.lineTo(sx+f*190,sy+52);ctx.closePath();ctx.fill();
  /* пыль в луче: под землёй воздух не бывает чистым */
  for(let i=0;i<24;i++){
    const dx=((i*61.7+G.t*.05)%160)-80, dy=((i*97.3+G.t*.03)%140)-70;
    const a=clamp(1-Math.hypot(dx,dy)/110,0,1)*.24;
    if(a<=.01)continue;
    ctx.fillStyle="rgba(200,225,240,"+a.toFixed(3)+")";
    ctx.fillRect(sx+dx,sy+dy,1.2,1.2);
  }
  ctx.restore();
  ctx.save();ctx.translate(sx,sy+4);
  drawAstronaut({face:D.face||1,amp:D.walkAmp,phase:D.walkPhase,air:false,
    mining:!!D.target,suitLow:suit<25,lamp:true});
  ctx.restore();
  ctx.fillStyle="rgba(127,230,216,.85)";ctx.font="10px ui-monospace,monospace";ctx.textAlign="left";
  ctx.fillText("ГЛУБИНА "+(D.row*3)+" м · "+geoAt(p,D.row*DIG_CELL*DIG_GEO_K).ru.toUpperCase(),12,H-30);
  ctx.fillStyle=suit>25?"rgba(93,115,130,.9)":"#ff6b57";
  ctx.fillText("СКАФАНДР "+Math.round(suit)+"%",12,H-16);
}
