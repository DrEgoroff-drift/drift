/* ══════════════ ракеты: боеприпас — это груз ══════════════
   Не вторая пушка, а вторая логистика. Пусковая (05-parts, категория `missile`)
   ставится в отдельный подвес, но сама по себе не стреляет ничем: каждый пуск
   съедает одну ракету из трюма, а ракета занимает место наравне с рудой. Значит
   вооружиться стоит ровно того же, чего стоит везти товар, — и вылет с полным
   боекомплектом это вылет без выручки. В этом вся мысль: ракета, которая
   стреляет вечно, — просто пушка побольше.

   Ракету не покупают: её собирают в лаборатории (12h-relic, LAB_AMMO), там же,
   где собирают части. Рынок боеприпас не берёт вовсе (`ammo` в RES).

   Она бьёт всех, в отличие от батареи (21d): барона, охотника, ренегата. Цена
   этому — трюм и то, что промахнувшаяся ракета потрачена насовсем. */
const MSL_DMG=46;        // за попадание при пустой пусковой первого тира
const MSL_TURN=.052;     // рад/кадр доводки: сильно быстрее корабля, но не мгновенно
const MSL_COOL=105;      // кадров между пусками
const MSL_SPEED=3.4;     // стартовая; разгоняется до MSL_VMAX
const MSL_VMAX=8.6;
const MSL_LIFE=280;      // кадров до самоликвидации: промах — это потеря
const MSL_ARM=14;        // первые кадры летит прямо, наведение ещё не включилось
/* ── откуда они берутся ──
   Не с прилавка: ракеты собирают там же, где части, из того же редкого сырья
   (03-ships, CRAFT_TIERS). Своя работающая лаборатория (12h-relic) добавляет к
   партии — это её единственное вмешательство в бой и повод держать её живой. */
const AMMO_COST={credits:1400,alloy:4,isotopes:6};
const AMMO_BATCH=4;
function ammoBatch(){return AMMO_BATCH+((typeof labWorking==="function"&&labWorking())?2:0);}
function craftAmmo(){
  if(!craftAffordable(AMMO_COST))return 0;
  /* партия, которая не влезает в трюм, не собирается вовсе: место — это и есть
     цена вопроса, и «собрал, но потерял половину» было бы обманом */
  if(stat().cargoMax-held()<ammoBatch()){say("В ТРЮМЕ НЕТ МЕСТА ПОД ПАРТИЮ");return 0;}
  G.credits-=AMMO_COST.credits;
  for(const k in AMMO_COST)if(k!=="credits")G.cargo[k]-=AMMO_COST[k];
  const n=addRes("missile",ammoBatch());
  tell("tech","Собрана партия ракет ×"+n,"Ракеты собраны\n×"+n+"\nони занимают трюм");
  return n;
}
/* строка сборки в лабораторном разделе станции (26-ui-station): живёт здесь,
   рядом со своей механикой, а не в и без того распухшем экране станции */
function ammoRow($body,after){
  $body.appendChild(el("div","sec","БОЕПРИПАС · ЗАНИМАЕТ ТРЮМ"));
  const r=el("div","row");
  r.appendChild(el("div","nm","<b>Партия ракет ×"+ammoBatch()+"</b><s>"+
    Object.keys(AMMO_COST).map(k=>k==="credits"?AMMO_COST[k]+" кр":
      RES[k].ru.toLowerCase()+" "+AMMO_COST[k]).join(" · ")+
    " · в трюме "+(G.cargo.missile|0)+
    (labWorking()?" · своя лаборатория добавляет к партии":"")+"</s>"));
  const b=el("button","act gold","СОБРАТЬ");
  b.disabled=!craftAffordable(AMMO_COST);
  b.onclick=()=>{craftAmmo();if(after)after();};
  r.appendChild(b);$body.appendChild(r);
}
/* цель выбирается один раз, в момент пуска: ракета глупая, она держится за то,
   во что её нацелили, и не перепрыгивает на удобное. Берём то, что впереди по
   носу и ближе всех, — так пуск читается как решение игрока, а не как автомат. */
function mslPick(sh,range){
  let best=null,bs=-1;
  for(const p of G.pirates||[]){
    if(p.hull<=0)continue;
    const dx=p.x-sh.x,dy=p.y-sh.y,d=Math.hypot(dx,dy)||1;
    if(d>range)continue;
    const front=Math.cos(angDiff(Math.atan2(dy,dx),sh.a));
    if(front<.25)continue;                       // за спину не пускаем
    const s=front*2-d/range;
    if(s>bs){bs=s;best=p;}
  }
  return best;
}
/* можно ли пустить и почему нельзя — одной функцией, чтобы подсказка на панели
   и сам пуск не разошлись во мнениях */
function mslCheck(){
  const st=stat();
  if(!st.launcher)return {ok:false,why:"пусковая не установлена"};
  if((G.cargo.missile|0)<=0)return {ok:false,why:"ракет нет · партия — в лаборатории станции"};
  if((G.mslCool||0)>0)return {ok:false,why:"перезарядка"};
  return {ok:true};
}
function mslFire(){
  const c=mslCheck();
  /* отказ тоже уходит в перезарядку: кнопку держат, а не щёлкают, и без этого
     «РАКЕТ В ТРЮМЕ НЕТ» писалось бы каждый кадр */
  if(!c.ok){G.mslCool=30;say(c.why.toUpperCase());return false;}
  const st=stat(),sh=G.ship;
  const tgt=mslPick(sh,st.see*1.2);
  if(!tgt){G.mslCool=30;say("НЕТ ЦЕЛИ ПО НОСУ");return false;}
  G.cargo.missile--;                              // расход из трюма, а не из счётчика
  G.mslCool=st.mslCool;
  if(!G.msl)G.msl=[];
  G.msl.push({x:sh.x+Math.cos(sh.a)*14,y:sh.y+Math.sin(sh.a)*14,
    vx:sh.vx+Math.cos(sh.a)*MSL_SPEED,vy:sh.vy+Math.sin(sh.a)*MSL_SPEED,
    a:sh.a,tgt,dmg:st.mslDmg,turn:st.mslTurn,life:MSL_LIFE,age:0,puff:0});
  sfx("shot",{f:190,to:110,d:.26,v:.5});
  return true;
}
function mslBoom(m,hit){
  G.mslFx=G.mslFx||[];
  G.mslFx.push({x:m.x,y:m.y,t:18});
  sfx("hit",{f:120,to:60,d:.3,v:.5});
  if(!hit)return;
  hit.hull-=m.dmg;
  if(typeof placeNote==="function")placeNote("hurt",2);   // место помнит попадание, не пуск (хвост M132)
  hit.aware=true;
  if(hit.hull<=0){
    /* строку о сбитом пишет killPirate — второй записи о том же не надо */
    killPirate(hit);
    G.pirates=G.pirates.filter(q=>q.hull>0);
  }
}
function mslTick(dt){
  if(G.mslCool>0)G.mslCool-=dt;
  if(G.mslFx)for(let i=G.mslFx.length-1;i>=0;i--){
    G.mslFx[i].t-=dt;if(G.mslFx[i].t<=0)G.mslFx.splice(i,1);
  }
  if(!G.msl||!G.msl.length)return;
  for(let i=G.msl.length-1;i>=0;i--){
    const m=G.msl[i];
    m.age+=dt;m.life-=dt;
    /* цель сбита кем-то другим или ушла — ракета продолжает лететь по прямой и
       догорает. Никакого перенацеливания: потраченное потрачено. */
    const t=(m.tgt&&m.tgt.hull>0&&(G.pirates||[]).indexOf(m.tgt)>=0)?m.tgt:null;
    if(t&&m.age>MSL_ARM){
      /* упреждение по той же скорости, что уже считает бой: ракета целит туда,
         где цель будет, иначе она вечно догоняет хвост */
      const d=Math.hypot(t.x-m.x,t.y-m.y)||1;
      const lead=Math.min(30,d/MSL_VMAX);
      const want=Math.atan2(t.y+t.vy*lead-m.y,t.x+t.vx*lead-m.x);
      m.a+=clamp(angDiff(want,m.a),-m.turn,m.turn)*dt;
    }
    const sp=Math.min(MSL_VMAX,Math.hypot(m.vx,m.vy)+.16*dt);
    m.vx=Math.cos(m.a)*sp;m.vy=Math.sin(m.a)*sp;
    m.x+=m.vx*dt;m.y+=m.vy*dt;
    let hit=null;
    for(const p of G.pirates||[]){
      if(p.hull<=0)continue;
      if(Math.hypot(p.x-m.x,p.y-m.y)<26){hit=p;break;}
    }
    if(hit||m.life<=0){mslBoom(m,hit);G.msl.splice(i,1);}
  }
}
function mslDraw(zx,zy,Z){
  for(const m of G.msl||[]){
    const x=zx(m.x),y=zy(m.y);
    /* факел длиннее самой ракеты: на масштабе системы корпус — три пикселя,
       и видно её именно по следу */
    const bx=x-Math.cos(m.a)*9*Z,by=y-Math.sin(m.a)*9*Z;
    const g=ctx.createLinearGradient(x,y,bx,by);
    g.addColorStop(0,"rgba(255,214,150,.9)");
    g.addColorStop(1,"rgba(255,120,60,0)");
    ctx.strokeStyle=g;ctx.lineWidth=Math.max(1,2.6*Z);
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(bx,by);ctx.stroke();
    ctx.fillStyle="#e8ecf2";
    ctx.beginPath();ctx.arc(x,y,Math.max(1,1.9*Z),0,TAU);ctx.fill();
  }
  for(const f of G.mslFx||[]){
    const a=Math.max(0,f.t/18),r=(1-a)*34*Z+4;
    ctx.strokeStyle="rgba(255,190,120,"+(a*.8).toFixed(2)+")";
    ctx.lineWidth=Math.max(1,2.4*a*Z);
    ctx.beginPath();ctx.arc(zx(f.x),zy(f.y),r,0,TAU);ctx.stroke();
    ctx.fillStyle="rgba(255,150,90,"+(a*.35).toFixed(2)+")";
    ctx.beginPath();ctx.arc(zx(f.x),zy(f.y),r*.6,0,TAU);ctx.fill();
  }
}
