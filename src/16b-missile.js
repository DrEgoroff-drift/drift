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
/* ══════════════ пять видов боеприпаса (M367, §4) ══════════════
   Пусковая одна, а ракеты разные — и различаются они не уроном, а тем, ЗАЧЕМ
   их пускают. Вид берётся из seed самой пусковой: часть, лежащая в трюме, уже
   знает, чем она стреляет, и это видно на карточке.

   обычная — знает метку, ведёт упреждение; всё как было;
   роевая  — шесть маленьких, по одной на каждую взятую метку;
   ЭМИ     — урона почти нет: поле в ноль и две секунды молчания;
   торпеда — медленная, тупая (не доворачивает), огромная; её сбивают зениткой;
   ловушка — уходит В СТОРОНУ от метки и тянет на себя чужие ракеты.

   Своих ловушка не путает: у чужой ракеты своя. */
const MSL_KINDS={
  plain:{ru:"обычная",   dmg:1,   turn:1,  speed:1,  n:1,
    note:"знает метку и ведёт упреждение"},
  swarm:{ru:"роевая",    dmg:.34, turn:1.2,speed:1.1,n:6,
    note:"шесть малых: расходятся по всем взятым меткам"},
  emp:  {ru:"ЭМИ",       dmg:.12, turn:.9, speed:1,  n:1,emp:1,
    note:"урона почти нет: поле в ноль и две секунды молчания"},
  torp: {ru:"торпеда",   dmg:3.2, turn:0,  speed:.55,n:1,big:1,
    note:"медленная и тупая, зато страшная; её сбивают зениткой"},
  decoy:{ru:"ловушка",   dmg:0,   turn:.6, speed:1.2,n:1,decoy:1,
    note:"уходит в сторону и тянет на себя чужие ракеты"}
};
const MSL_KEYS=Object.keys(MSL_KINDS);
function mslKindOf(part){
  if(!part)return MSL_KINDS.plain;
  return MSL_KINDS[MSL_KEYS[(part.seed>>>9)%MSL_KEYS.length]]||MSL_KINDS.plain;
}
function mslKindKeyOf(part){
  if(!part)return "plain";
  return MSL_KEYS[(part.seed>>>9)%MSL_KEYS.length];
}
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
    ((typeof ammoStamp==="function"&&ammoStamp()!=="gt"&&typeof powerOf==="function")
      ?" · клеймо: "+powerOf(ammoStamp()).ru:"")+
    (labWorking()?" · своя лаборатория добавляет к партии":"")+"</s>"));
  const b=el("button","act gold","СОБРАТЬ");
  b.disabled=!craftAffordable(AMMO_COST);
  b.onclick=()=>{
    craftAmmo();
    /* партия получает клеймо той станции, где собрана (M373, §6.1 правило 2):
       через пикет её врага такую кассету везти не стоит */
    if(typeof ammoStampSet==="function")
      ammoStampSet((G.sys&&G.sys.station&&G.sys.station.by)||"gt");
    if(after)after();
  };
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
  /* ракета идёт на первую метку захвата (M360); без захвата — по носу, как раньше */
  const mk=(G.marks&&G.marks[0])||null;
  const tgt=(mk&&mk.hull>0)?mk:mslPick(sh,st.see*1.2);
  if(!tgt){G.mslCool=30;say("НЕТ ЦЕЛИ ПО НОСУ");return false;}
  G.cargo.missile--;                              // расход из трюма, а не из счётчика
  /* вид боеприпаса — от пусковой (M367): роевая уходит по всем меткам,
     ловушка — В СТОРОНУ, торпеда не доворачивает вовсе */
  const KP=(typeof fittedOfKind==="function")?fittedOfKind("missile"):null;
  const K=mslKindOf(KP);
  G.mslCool=st.mslCool;
  if(!G.msl)G.msl=[];
  const marks=(G.marks||[]).filter(m=>m&&m.hull>0);
  const n=Math.max(1,K.n|0);
  for(let i=0;i<n;i++){
    /* роевая делит себя по взятым меткам; остальным видам метка одна */
    const t2=K.n>1?(marks[i%Math.max(1,marks.length)]||tgt):tgt;
    const spread=K.n>1?(i/(n-1)-.5)*.9:0;
    const a0=sh.a+spread+(K.decoy?(i%2?1:-1)*1.1:0);
    G.msl.push({x:sh.x+Math.cos(a0)*14,y:sh.y+Math.sin(a0)*14,
      vx:sh.vx+Math.cos(a0)*MSL_SPEED*K.speed,vy:sh.vy+Math.sin(a0)*MSL_SPEED*K.speed,
      a:a0,tgt:K.decoy?null:t2,dmg:st.mslDmg*K.dmg,turn:st.mslTurn*K.turn,
      life:MSL_LIFE,age:0,puff:0,kind:mslKindKeyOf(KP),
      emp:K.emp?1:0,decoy:K.decoy?1:0,big:K.big?1:0});
  }
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
/* ── ракета чужая (M367) ──
   С капитана и выше пират носит пусковую. Его ракета ведёт ВАС, сбивается
   зениткой и ловится ловушкой — то есть живёт по тем же правилам, что ваша.
   Разница одна: её никто не собирал в лаборатории, она приходит с рангом. */
function mslFoeFire(p){
  if(!G.msl)G.msl=[];
  if(G.msl.filter(m=>m.foe).length>=6)return false;
  const a=Math.atan2(G.ship.y-p.y,G.ship.x-p.x);
  G.msl.push({x:p.x+Math.cos(a)*14,y:p.y+Math.sin(a)*14,
    vx:(p.vx||0)+Math.cos(a)*MSL_SPEED,vy:(p.vy||0)+Math.sin(a)*MSL_SPEED,
    a,tgt:null,foe:1,dmg:MSL_DMG*.5,turn:MSL_TURN*.8,life:MSL_LIFE,age:0,puff:0,kind:"plain"});
  sfx("shot",{f:170,to:120,d:.22,v:.4});
  return true;
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
    /* ловушка (M367) не ведёт никого — она ЛОВИТ: чужая ракета рядом с ней
       переводит наведение на неё и уходит в пустоту */
    if(m.decoy){
      for(const o of G.msl){
        if(o===m||!o.foe)continue;
        if(Math.hypot(o.x-m.x,o.y-m.y)<260)o.lure=m;
      }
    }
    /* кого ведёт эта ракета: ловушка перебивает всё, чужая ведёт вас,
       своя — свою метку (M367) */
    let t=null;
    if(m.lure&&G.msl.indexOf(m.lure)>=0)t=m.lure;
    else if(m.foe)t=G.ship;
    else if(m.tgt&&m.tgt.hull>0&&(G.pirates||[]).indexOf(m.tgt)>=0)t=m.tgt;
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
    if(m.foe){
      /* чужая ракета ищет вас — и только вас: пиратов она не трогает */
      if(Math.hypot(G.ship.x-m.x,G.ship.y-m.y)<26){
        const ang=Math.atan2(m.vy,m.vx);
        if(typeof playerHit==="function")playerHit({vx:Math.cos(ang),vy:Math.sin(ang),
          dmg:m.dmg,type:"blast",owner:"pirate",mine:false});
        mslBoom(m,null);G.msl.splice(i,1);continue;
      }
    }else for(const p of G.pirates||[]){
      if(p.hull<=0)continue;
      if(Math.hypot(p.x-m.x,p.y-m.y)<26){hit=p;break;}
    }
    /* ЭМИ: поле в ноль и две секунды молчания вместо урона (M367) */
    if(hit&&m.emp){
      hit.shield=0;hit.shieldOff=(typeof SHIELD_OFF==="number")?SHIELD_OFF:120;
      hit.shieldHit=(typeof SHIELD_DELAY==="number")?SHIELD_DELAY:90;
      hit.stunT=Math.max(hit.stunT||0,(typeof STUN_TIME==="number")?STUN_TIME:170);
    }
    if(hit||m.life<=0){mslBoom(m,hit);G.msl.splice(i,1);}
  }
}
/* ── как выглядит каждая (M367) ──
   Решение принимается по следу за полсекунды, значит след и должен говорить:
   чья ракета (чужая — красная, как чужой выстрел), какая она (торпеда толстая и
   медленная, рой мелкий, ЭМИ холодная, ловушка бледная и без огня). Цвет тут не
   украшение: не сбив торпеду, вы теряете четверть корпуса. */
const MSL_PAINT={
  plain:{head:"rgba(255,214,150,.9)",tail:"rgba(255,120,60,0)",dot:"#e8ecf2",r:1.9,len:9},
  swarm:{head:"rgba(255,226,170,.85)",tail:"rgba(255,140,70,0)",dot:"#dfe6ee",r:1.2,len:6},
  emp:  {head:"rgba(170,225,255,.9)", tail:"rgba(90,150,255,0)",dot:"#dff0ff",r:1.7,len:8},
  torp: {head:"rgba(255,176,96,.95)", tail:"rgba(220,70,40,0)", dot:"#f2e6d8",r:3.2,len:13},
  decoy:{head:"rgba(214,214,206,.55)",tail:"rgba(150,150,140,0)",dot:"#b9bcb4",r:1.5,len:5}
};
const MSL_PAINT_FOE={head:"rgba(255,150,120,.9)",tail:"rgba(255,60,50,0)",dot:"#ffb0a2",r:1.9,len:9};
function mslDraw(zx,zy,Z){
  for(const m of G.msl||[]){
    const x=zx(m.x),y=zy(m.y);
    const P=m.foe?MSL_PAINT_FOE:(MSL_PAINT[m.kind]||MSL_PAINT.plain);
    /* факел длиннее самой ракеты: на масштабе системы корпус — три пикселя,
       и видно её именно по следу */
    const bx=x-Math.cos(m.a)*P.len*Z,by=y-Math.sin(m.a)*P.len*Z;
    const g=ctx.createLinearGradient(x,y,bx,by);
    g.addColorStop(0,P.head);
    g.addColorStop(1,P.tail);
    ctx.strokeStyle=g;ctx.lineWidth=Math.max(1,(m.big?3.6:2.6)*Z);
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(bx,by);ctx.stroke();
    ctx.fillStyle=P.dot;
    ctx.beginPath();ctx.arc(x,y,Math.max(1,P.r*Z),0,TAU);ctx.fill();
    /* ловушка мигает: она и работает тем, что заметна больше, чем есть */
    if(m.decoy&&(m.age|0)%20<8){
      ctx.strokeStyle="rgba(214,214,206,.35)";ctx.lineWidth=Math.max(1,Z);
      ctx.beginPath();ctx.arc(x,y,Math.max(2,4.5*Z),0,TAU);ctx.stroke();
    }
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
