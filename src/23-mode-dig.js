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
  const pool=(D.p.res||PROFILE[D.p.type]||[]).concat(DEPTH_TIERS[ti].extra);
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
  /* то, что уже выкопано в этой шахте, остаётся выкопанным */
  mineLoad(G.dig,S.p);
  G.mode="dig";
  say("Спуск в шахту\nW A S D — копать вверх/вбок/вниз\nна поверхности W — выход · ОГОНЬ — импульс");
}
function exitDig(){
  mineSave(G.dig,G.dig.p);
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
  /* маяк выдёргивает из ствола, но выработка остаётся выработкой */
  if(G.dig)mineSave(G.dig,G.dig.p);
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
  if(G.dig)mineSave(G.dig,G.dig.p);
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
    /* чем глубже ствол, тем вероятнее узел: глубина и есть та цена, которую
       за находку платят (05a-nodes) */
    nodeDrop("в шахте",clamp(D.row/60,0,1)+sysDanger(G.sx,G.sy)*.4,
      hashi(D.col,D.row,0x0DE7));
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
  /* ── рудное тело ──
     Светилось радиальным пятном на клетку и читалось бесформенной кляксой,
     ни при чём к камню вокруг. Руда в породе выглядит иначе: это вкрапления —
     зёрна и линзы, вытянутые по пласту, гуще к середине тела и сходящие на
     нет по краю, плюс ореол изменённой породы вокруг. Свечения почти нет:
     под землёй руда не лампа, её выдаёт отражённый блеск на зерне. */
  const r0=Math.max(0,Math.floor(camy/DIG_CELL)-1), r1=Math.ceil((camy+H)/DIG_CELL)+1;
  ctx.save();
  for(let row=r0;row<=r1;row++)for(let col=-DIG_HALF;col<=DIG_HALF;col++){
    const key=col+","+row, cell=D.cells[key]||digCell(D,col,row);
    if(cell.dug||(!cell.res&&!cell.nearNode))continue;
    const dist=Math.hypot(col-D.col,row-D.row);
    if(!scanAll&&dist>7)continue;
    const x=col*DIG_CELL-camx, y=row*DIG_CELL-camy;
    /* Ореол изменённой породы у тела. Первый заход красил клетку прямоугольником
       и в кадре проступала ровно та сетка, от которой весь режим уходит:
       по породе шли отчётливые квадраты и кресты. Ореол — пятно без углов,
       и он заметно слабее зерна: это подсказка, а не разметка. */
    if(cell.nearNode&&!cell.res){
      const cx=x+DIG_CELL/2, cy=y+DIG_CELL/2;
      const hg=ctx.createRadialGradient(cx,cy,1,cx,cy,DIG_CELL*.85);
      hg.addColorStop(0,"rgba(0,0,0,.09)");
      hg.addColorStop(1,"rgba(0,0,0,0)");
      ctx.fillStyle=hg;
      ctx.beginPath();ctx.arc(cx,cy,DIG_CELL*.85,0,TAU);ctx.fill();
      continue;
    }
    if(!cell.res)continue;
    const col2=RES[cell.res].col;
    const vis=clamp((scanAll?1:1.15-dist/8),0,1);
    /* зёрна: линзы, наклонённые по пласту, размер и густота от количества */
    const n=3+Math.min(5,cell.amount);
    for(let i=0;i<n;i++){
      const hh=hashi(col*137+i*31,row*211+i,0x0E2E);
      const ox=(hh&31)/31*DIG_CELL, oy=((hh>>>5)&31)/31*DIG_CELL;
      const rr=1.1+((hh>>>10)&3)*.55, el=1.7+((hh>>>13)&3)*.5;
      ctx.save();
      ctx.translate(x+ox,y+oy);ctx.rotate(.35+((hh>>>16)&7)/7*.5);
      ctx.globalAlpha=(.30+((hh>>>19)&7)/7*.35)*vis;
      ctx.fillStyle=col2;
      ctx.beginPath();ctx.ellipse(0,0,rr*el,rr,0,0,TAU);ctx.fill();
      /* блик на зерне — то, из-за чего руду замечают в темноте */
      ctx.globalAlpha=(.22+((hh>>>22)&3)/3*.3)*vis;
      ctx.fillStyle="rgba(255,250,235,1)";
      ctx.beginPath();ctx.ellipse(-rr*.3,-rr*.35,rr*.5,rr*.28,0,0,TAU);ctx.fill();
      ctx.restore();
    }
    /* и совсем слабое зарево на всё тело — чтобы жила читалась как жила,
       а не как россыпь точек. Ровно настолько, чтобы поймать взгляд. */
    ctx.save();ctx.globalCompositeOperation="lighter";
    ctx.globalAlpha=.07*vis;
    const g=ctx.createRadialGradient(x+DIG_CELL/2,y+DIG_CELL/2,2,
      x+DIG_CELL/2,y+DIG_CELL/2,DIG_CELL*.8);
    g.addColorStop(0,col2);g.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=g;ctx.fillRect(x-DIG_CELL*.3,y-DIG_CELL*.3,DIG_CELL*1.6,DIG_CELL*1.6);
    ctx.restore();
  }
  ctx.restore();
  /* ── выработка ── */
  const VP=digVoidPath(D,camx,camy);
  /* Была залита почти чёрным — ход читался дырой в бумаге, и человек в нём
     висел в пустоте. Пустота под землёй не чёрная: это воздух над полом, и у
     неё есть верх и низ. Отсюда вертикальный градиент внутри хода. */
  ctx.save();ctx.clip(VP);
  const vg=ctx.createLinearGradient(0,-camy%DIG_CELL,0,H);
  vg.addColorStop(0,"rgba(4,5,8,.94)");
  vg.addColorStop(1,"rgba(9,8,7,.88)");
  ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
  ctx.restore();
  /* ── зерно на обнажённой породе ──
     Пласты дают цвет, `planetMat` — общий шум по всему кадру, и вблизи камень
     оставался заливкой: стена не отличалась от фона. Свежий скол виден на
     кромке — сколы, выщербины и следы резака, — и рисуется он СНАРУЖИ хода:
     клип по «всё, кроме выработки» (evenodd поверх полного кадра). */
  ctx.save();
  const OUT=new Path2D();
  OUT.rect(0,0,W,H);OUT.addPath(VP);
  ctx.clip(OUT,"evenodd");
  for(let row=r0;row<=r1;row++)for(let col=-DIG_HALF;col<=DIG_HALF;col++){
    const cell=D.cells[col+","+row];
    if(!cell||!cell.dug)continue;
    const x=col*DIG_CELL-camx, y=row*DIG_CELL-camy;
    const h0=hashi(col,row,0x5C01);
    /* свежий скол светлее породы, и чем ближе к человеку, тем он заметнее:
       дальний конец штрека уже присыпало пылью */
    const near=clamp(1-Math.hypot(col-D.col,row-D.row)/9,0,1);
    if(near<=.02)continue;
    ctx.fillStyle="rgba(214,206,188,"+(.07+near*.16).toFixed(3)+")";
    for(let i=0;i<11;i++){
      const hh=hashi(col*31+i,row*17+i*7,0x9F1C);
      const ang=(hh&3), len=3+((hh>>>2)&5);
      const ox=(hh>>>5&31)/31*(DIG_CELL+8)-4, oy=(hh>>>10&31)/31*(DIG_CELL+8)-4;
      ctx.fillRect(x+ox,y+oy,ang%2?len:1.4,ang%2?1.4:len);
    }
    /* выщербины от резака: тёмные точки со светлой нижней губой */
    for(let i=0;i<4;i++){
      const hh=hashi(col*13+i*5,row*29+i,0xB3E7);
      const ox=(hh&31)/31*(DIG_CELL+8)-4, oy=((hh>>>6)&31)/31*(DIG_CELL+8)-4;
      const rr=1+((hh>>>12)&2)*.7;
      ctx.fillStyle="rgba(0,0,0,"+(.16+near*.18).toFixed(3)+")";
      ctx.beginPath();ctx.arc(x+ox,y+oy,rr,0,TAU);ctx.fill();
      ctx.fillStyle="rgba(226,218,200,"+(.05+near*.08).toFixed(3)+")";
      ctx.fillRect(x+ox-rr*.7,y+oy+rr*.5,rr*1.4,.9);
    }
    void h0;
  }
  ctx.restore();
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
    /* ── пол ──
       Главное, чего не хватало: человек стоял в чёрном прямоугольнике. Пол —
       это место, где ход кончается породой снизу: полоса осыпи, отбитая
       порода под ногами и контактная тень у стен. Без него нет ни низа,
       ни верха, ни масштаба. */
    if(!dug(col,row+1)){
      const fy=y+DIG_CELL-3;
      const fg=ctx.createLinearGradient(0,fy-7,0,fy+6);
      fg.addColorStop(0,"rgba(0,0,0,0)");
      fg.addColorStop(1,"rgba(96,86,70,.42)");
      ctx.fillStyle=fg;ctx.fillRect(x-4,fy-7,DIG_CELL+8,13);
      /* отбитая порода: куски крупнее у стен, мельче посередине — так ложится
         то, что откалывают и сгребают к краям */
      for(let i=0;i<6;i++){
        const hh=hashi(col*41+i,row*23,0x71B0);
        const ox=(hh&63)/63*DIG_CELL, s=1.2+((hh>>>7)&3)*.8;
        const edge=Math.abs(ox-DIG_CELL/2)/(DIG_CELL/2);
        ctx.fillStyle="rgba("+(118+((hh>>>9)&15))+","+(106+((hh>>>13)&15))+",88,"+
          (.22+edge*.26).toFixed(2)+")";
        ctx.beginPath();
        ctx.moveTo(x+ox-s,fy+3);ctx.lineTo(x+ox-s*.3,fy+3-s*1.1);
        ctx.lineTo(x+ox+s*.8,fy+3-s*.4);ctx.lineTo(x+ox+s*.5,fy+3);
        ctx.closePath();ctx.fill();
      }
      /* волосок света по кромке пола: он ловит фонарь и отделяет пол от стены */
      ctx.fillStyle="rgba(206,196,172,.10)";
      ctx.fillRect(x-4,fy-7.4,DIG_CELL+8,1);
    }
  }
  ctx.restore();
  /* ── воздух в ходе ──
     Дальний конец штрека читался плоско-чёрным: чернота без градиента — это
     не глубина, а дыра. Слабая дымка, растущая с расстоянием от человека,
     превращает черноту в воздух, сквозь который смотрят. */
  ctx.save();ctx.clip(VP);
  const hz=ctx.createRadialGradient(px-camx+DIG_CELL/2,py-camy+DIG_CELL/2,40,
    px-camx+DIG_CELL/2,py-camy+DIG_CELL/2,460);
  hz.addColorStop(0,"rgba(78,80,86,0)");
  hz.addColorStop(1,"rgba(78,80,86,.085)");
  ctx.fillStyle=hz;ctx.fillRect(0,0,W,H);
  /* ── следы работы ──
     Шахта выглядела всегда новой: ни рельсов, ни вагонетки, ни брошенного
     инструмента. Работа оставляет след, и след этот дешёвый: путь по полу
     штрека, вентиляционная труба вдоль ствола, площадка на каждом четвёртом
     звене лестницы. Ничего из этого не механика — это следы того, что здесь
     уже кто-то стоял. */
  for(let row=r0;row<=r1;row++)for(let col=-DIG_HALF;col<=DIG_HALF;col++){
    const cell=D.cells[col+","+row];
    if(!cell||!cell.dug)continue;
    const x=col*DIG_CELL-camx, y=row*DIG_CELL-camy;
    const dg=(c,rr)=>{const q=D.cells[c+","+rr];return q&&q.dug;};
    const floor=!dg(col,row+1);
    const along=dg(col-1,row)||dg(col+1,row);
    if(floor&&along&&col!==0){
      /* путь: шпалы и две нитки. Уходит под стену — значит ход шёл дальше */
      const fy=y+DIG_CELL-5;
      ctx.fillStyle="rgba(74,58,40,.55)";
      for(let k=0;k<3;k++)ctx.fillRect(x+2+k*10,fy+1.4,7,2.2);
      ctx.fillStyle="rgba(150,152,158,.42)";
      ctx.fillRect(x-4,fy,DIG_CELL+8,1.3);
      ctx.fillRect(x-4,fy+3.6,DIG_CELL+8,1.3);
      /* вагонетка: одна на выработку, место выбирает семя */
      if(((hashi(col,row,0x7ADD)>>>4)&31)===0){
        ctx.fillStyle="rgba(58,52,46,.95)";
        ctx.fillRect(x+4,fy-11,DIG_CELL-9,10);
        ctx.fillStyle="rgba(96,88,76,.9)";
        ctx.fillRect(x+4,fy-11,DIG_CELL-9,2);
        ctx.fillStyle="rgba(20,18,16,.9)";
        for(const wx of [x+7,x+DIG_CELL-8]){
          ctx.beginPath();ctx.arc(wx,fy,2.2,0,TAU);ctx.fill();
        }
      }
      /* инструмент у стены в тупике: там, где ход кончился */
      else if(!dg(col-1,row)||!dg(col+1,row)){
        if(((hashi(col,row,0x1700)>>>3)&7)===0){
          const s=dg(col+1,row)?-1:1, hx=s<0?x+3:x+DIG_CELL-3;
          ctx.strokeStyle="rgba(128,104,72,.8)";ctx.lineWidth=1.8;
          ctx.beginPath();ctx.moveTo(hx,fy);ctx.lineTo(hx+s*6,fy-17);ctx.stroke();
          ctx.strokeStyle="rgba(150,154,160,.75)";ctx.lineWidth=2.2;
          ctx.beginPath();ctx.moveTo(hx+s*3,fy-19);ctx.lineTo(hx+s*10,fy-15);ctx.stroke();
        }
      }
    }
    /* ствол: труба вентиляции вдоль стены и площадка на каждом восьмом метре */
    if(col===0&&dg(col,row-1)){
      ctx.fillStyle="rgba(74,86,92,.75)";
      ctx.fillRect(x+DIG_CELL-7,y,4.4,DIG_CELL);
      ctx.fillStyle="rgba(150,168,176,.20)";
      ctx.fillRect(x+DIG_CELL-7,y,1.2,DIG_CELL);
      if(row%3===0){                       // хомут стыка
        ctx.fillStyle="rgba(96,104,110,.9)";
        ctx.fillRect(x+DIG_CELL-8.4,y+DIG_CELL*.3,7.2,2.6);
      }
      if(row%8===0&&floor===false){        // площадка: доска поперёк ствола
        ctx.fillStyle="rgba(120,92,58,.85)";
        ctx.fillRect(x-3,y+DIG_CELL-7,DIG_CELL*.5,3);
        ctx.fillStyle="rgba(0,0,0,.4)";
        ctx.fillRect(x-3,y+DIG_CELL-4,DIG_CELL*.5,1.6);
      }
    }
  }
  ctx.restore();
  /* ── крепь ──
     Была рамкой-скобкой в одном только стволе: читалась как оранжевый контур
     поверх лестницы, а не как то, чем держат потолок. Крепь — это две стойки
     и верхняк на них, с подхватом; ставят её и в стволе, и в штреках, и
     ставят там, где есть что держать, — под сплошной кровлей. Стойка стоит
     на полу, если пол есть, иначе уходит за кадр клетки: подпёртый потолок
     без низа читается неправильно. */
  const timber=(x,y,seedv)=>{
    const h=hashi(seedv,0x7100,3);
    const lean=((h&7)/7-.5)*1.6;                 // рама повело за годы
    const w0=1.9+((h>>>3)&3)*.35, top=y+2.2;
    const post=(px,dir)=>{
      ctx.fillStyle="rgba(122,92,58,.86)";
      ctx.beginPath();
      ctx.moveTo(px,y+DIG_CELL);ctx.lineTo(px+w0,y+DIG_CELL);
      ctx.lineTo(px+w0+dir*lean,top);ctx.lineTo(px+dir*lean,top);
      ctx.closePath();ctx.fill();
      /* волокно: две светлые нити вдоль стойки, иначе брус — палка */
      ctx.fillStyle="rgba(198,162,110,.16)";
      ctx.fillRect(px+w0*.3,top+2,.8,DIG_CELL-4);
      ctx.fillStyle="rgba(0,0,0,.28)";
      ctx.fillRect(px+w0-.7,top+1,.7,DIG_CELL-2);
    };
    post(x-2.4,1);post(x+DIG_CELL+.6,-1);
    /* верхняк с напуском в обе стороны и тень под ним */
    ctx.fillStyle="rgba(138,104,64,.9)";
    ctx.fillRect(x-5,top-2.6,DIG_CELL+10,4.4);
    ctx.fillStyle="rgba(214,182,132,.18)";
    ctx.fillRect(x-5,top-2.6,DIG_CELL+10,1);
    ctx.fillStyle="rgba(0,0,0,.34)";
    ctx.fillRect(x-5,top+1.8,DIG_CELL+10,2.2);
    /* подхваты в углах: косынки, по ним крепь и опознаётся */
    ctx.fillStyle="rgba(120,90,56,.8)";
    for(const s of [-1,1]){
      const px=s<0?x-1.6:x+DIG_CELL+1.6;
      ctx.beginPath();
      ctx.moveTo(px,top+2);ctx.lineTo(px+s*5.5,top+2);ctx.lineTo(px,top+8);
      ctx.closePath();ctx.fill();
    }
  };
  for(let row=r0;row<=r1;row++)for(let col=-DIG_HALF;col<=DIG_HALF;col++){
    const cell=D.cells[col+","+row];
    if(!cell||!cell.dug)continue;
    /* Первый заход пропускал клетку, если сверху уже выкопано, — и в стволе,
       где сверху выкопано всегда, крепи не осталось вовсе. Держат не только
       кровлю: в стволе рама распирает стенки. Ставим в стволе через четыре
       метра, в штреке — через четыре клетки от нуля, чтобы ряды не сбивались
       в кучу на пересечении. */
    if(col===0?(row%4):(col%4))continue;
    timber(col*DIG_CELL-camx,row*DIG_CELL-camy,col*73856+row*19349);
  }
  /* ── лестница ──
     Шла сплошной ровной строчкой через всю глубину и читалась застёжкой.
     Лестница — это тетивы, прибитые к стене, звенья по четыре метра со
     стыком внахлёст, и тень на породе за ней. */
  for(let row=r0;row<=r1;row++)for(let col=-DIG_HALF;col<=DIG_HALF;col++){
    const cell=D.cells[col+","+row];
    if(!cell||!cell.dug||!cell.ladder)continue;
    const x=col*DIG_CELL-camx,y=row*DIG_CELL-camy;
    const h=hashi(col,row,0x1ADD);
    const off=((h&7)/7-.5)*1.4;                   // звено повело
    const L=x+DIG_CELL*.34+off, R=x+DIG_CELL*.62+off;
    /* тень на стене за лестницей: без неё она приклеена к породе */
    ctx.fillStyle="rgba(0,0,0,.30)";
    ctx.fillRect(L+2.2,y,R-L,DIG_CELL);
    ctx.fillStyle="rgba(150,112,66,.85)";
    ctx.fillRect(L,y,1.8,DIG_CELL);ctx.fillRect(R,y,1.8,DIG_CELL);
    ctx.fillStyle="rgba(206,168,112,.20)";
    ctx.fillRect(L,y,.7,DIG_CELL);ctx.fillRect(R,y,.7,DIG_CELL);
    for(let k=0;k<4;k++){
      const ry=y+DIG_CELL*(k+.5)/4;
      ctx.fillStyle="rgba(164,124,74,.9)";
      ctx.fillRect(L,ry,R-L+1.8,1.7);
      ctx.fillStyle="rgba(0,0,0,.3)";
      ctx.fillRect(L,ry+1.7,R-L+1.8,.9);
    }
    /* стык звеньев: каждые четыре метра тетивы перехвачены хомутом */
    if(row%4===0){
      ctx.fillStyle="rgba(96,104,112,.8)";
      ctx.fillRect(L-1.4,y+1.5,R-L+4.6,2.2);
    }
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
  /* Фонарь светил СКВОЗЬ породу: конус уходил за кромку выработки и подсвечивал
     пласты на полэкрана — под землёй это ложь в самом заметном месте кадра.
     Свет живёт внутри хода, поэтому и конус, и пыль клипуются по выработке. */
  ctx.save();ctx.clip(VP);
  ctx.globalCompositeOperation="lighter";
  const f=D.face||1;
  const lg=ctx.createLinearGradient(sx,sy,sx+f*170,sy);
  lg.addColorStop(0,"rgba(190,215,235,.13)");
  lg.addColorStop(1,"rgba(150,190,220,0)");
  ctx.fillStyle=lg;
  ctx.beginPath();ctx.moveTo(sx,sy-12);ctx.lineTo(sx+f*190,sy-64);
  ctx.lineTo(sx+f*190,sy+52);ctx.closePath();ctx.fill();
  /* Пятно на полу и отсвет вокруг человека. Пока свет был только конусом,
     ход оставался чёрным даже под ногами: фонарь светил в воздух. Свет,
     который никуда не ложится, — не свет, а плёнка на кадре. */
  const fl=ctx.createRadialGradient(sx+f*26,sy+16,4,sx+f*26,sy+16,130);
  fl.addColorStop(0,"rgba(214,206,178,.20)");
  fl.addColorStop(.5,"rgba(180,180,160,.07)");
  fl.addColorStop(1,"rgba(140,160,180,0)");
  ctx.fillStyle=fl;
  ctx.beginPath();ctx.ellipse(sx+f*26,sy+16,130,42,0,0,TAU);ctx.fill();
  /* близкий отсвет: породу у самого человека видно и без фонаря — отражённым */
  const am=ctx.createRadialGradient(sx,sy,2,sx,sy,84);
  am.addColorStop(0,"rgba(150,170,190,.10)");
  am.addColorStop(1,"rgba(120,150,180,0)");
  ctx.fillStyle=am;ctx.beginPath();ctx.arc(sx,sy,84,0,TAU);ctx.fill();
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
/* ── шахта остаётся выкопанной ──
   Ствол осыпался, стоило подняться на поверхность: спустился второй раз — снова
   целая порода. Это врало о мире: копали-то по-настоящему, руда из ячейки
   уходила в трюм насовсем. Теперь выработка персистентна, а порода — нет:
   сохраняется ТОЛЬКО то, что игрок изменил, то есть список выкопанных ячеек.
   Всё остальное (руда, твёрдость, жилы) по-прежнему выводится из seed. */
function mineKey(p){return G.sx+","+G.sy+":"+(p&&p.idx!==undefined?p.idx:0);}
function mineLoad(D,p){
  const rec=G.mines&&G.mines[mineKey(p)];
  if(!rec)return;
  for(const key of rec.dug||[]){
    const c=digCell(D,...key.split(",").map(Number));
    /* выкопанное — пустая ячейка: руду из неё уже вынесли, второй раз её нет */
    c.dug=true;c.res=null;c.amount=0;c.prog=0;
  }
  D.deepest=rec.deepest|0;
}
function mineSave(D,p){
  if(!G.mines)G.mines={};
  const dug=[];
  for(const key in D.cells)if(D.cells[key].dug)dug.push(key);
  /* ствол растёт, и запись растёт вместе с ним; но она плоская и коротка —
     тысяча ячеек это тысяча строк "c,r", а не тысяча объектов */
  G.mines[mineKey(p)]={dug,deepest:D.deepest|0};
}
