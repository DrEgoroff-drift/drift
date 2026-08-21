/* ══════════════ поверхность ══════════════ */
function enterSurface(){
  const L=G.land,tr=L.tr,p=L.p,r=rng(p.seed^0x1234);
  /* залежи берутся из профиля ПЛАНЕТЫ (у смешанного мира он свой), а не из
     таблицы типа: иначе на «ледяной, с вулканами» лежало бы то же, что на
     чистой ледяной, и смесь осталась бы одной раскраской */
  const deposits=[],plants=[],prof=p.res||PROFILE[p.type]||[];
  if(prof.length)for(let i=0;i<22;i++){
    const x=120+r()*(tr.W-240),k=prof[Math.floor(r()*prof.length)];
    deposits.push({x,y:groundAt(tr,x)-6,res:k,left:6+Math.floor(r()*11),prog:0});
  }
  /* флора растёт куртинами, а не поштучно по всей планете */
  const flora=p.T.atm.indexOf("пригодна")>=0||p.type==="toxic"||p.type==="jungle"||
              p.mix==="toxic"||p.mix==="jungle";
  const gp=G.opts.gfx.plants;
  /* ── сколько и где ──
     Куртин было шестнадцать на девять тысяч точек ландшафта, то есть примерно
     две на экран: обитаемый мир выглядел пустым. Густота теперь своя у типа —
     в джунглях заросли, на землеподобной рощи, на токсичной пятна, — а место
     выбирается не как попало: жизнь садится в НИЗИНАХ, где собирается вода и
     тише ветер. Из трёх случайных точек берётся самая низкая, и куртины сами
     собираются в распадках, оставляя гребни голыми. Это дешевле любой карты
     влажности и читается сразу. */
  const DENS={jungle:3.4,terran:1.9,toxic:1.5,ocean:1.6,ice:.7,ruin:1.1};
  /* и главное — не только тип мира, а СЫРО ЛИ ЗДЕСЬ: та же влажность, по
     которой на глобусе нарисовано зелёное пятно. Сел в него — стоишь в
     зарослях, сел на сухой пояс той же планеты — вокруг пусто. Планета
     перестала быть однородной по жизни */
  const wet=(tr.wet==null?.5:tr.wet);
  const dens=(DENS[p.mix==="jungle"?"jungle":p.type]||1.2)*(.25+wet*1.85);
  if(flora)for(let c=0;c<Math.round(16*gp*dens);c++){
    let cx=120+r()*(tr.W-240);
    for(let t=0;t<2;t++){
      const alt=120+r()*(tr.W-240);
      if(groundAt(tr,alt)>groundAt(tr,cx))cx=alt;      // ниже — значит лучше
    }
    const n=2+Math.floor(r()*6);
    for(let i=0;i<n;i++){
      const x=clamp(cx+(r()-.5)*260,60,tr.W-60);
      plants.push(genPlant(r,p,x,groundAt(tr,x)));
    }
  }
  /* высаживаемся за пределами зоны взлёта (`shipZoneR`), иначе первое же ДЕЙСТВ
     отправляет обратно на орбиту вместо бурения */
  /* зверьё водится там же, где флора: ему есть что есть */
  const fauna=[];
  if(flora)for(let i=0;i<Math.round((10+Math.floor(r()*10))*gp);i++){
    const x=120+r()*(tr.W-240);
    fauna.push(genBeast(r,p,x,groundAt(tr,x)));
  }
  /* вход в пещеру есть на каждой планете: раньше он выпадал с шансом .65, и
     игрок, обойдя пару планет без пещеры, решал, что механику убрали. Место
     по-прежнему случайное и далеко от корабля — дойти надо, а вот гадать,
     существует ли пещера в принципе, не надо: путь показывает навигатор сверху. */
  const caveMouth={x:clamp(400+r()*(tr.W-800),150,tr.W-150)};
  /* расчищаем пятачок у входа: залежь или куст, оказавшись на устье, перехватывали
     подсказку ДЕЙСТВ (бурение важнее по порядку проверок), и пещеру нельзя было
     открыть, стоя прямо на ней — отсюда и «пещер нет» */
  const clearNear=(arr,rad)=>{
    for(let i=arr.length-1;i>=0;i--)if(Math.abs(arr[i].x-caveMouth.x)<rad)arr.splice(i,1);
  };
  clearNear(deposits,70);clearNear(plants,50);clearNear(fauna,60);
  /* подглядка (20c): луг лежит открытым. Куст или валун посреди мата закрывает
     собой идущих, а показывают здесь именно их */
  const peep=peepMake(tr,p);
  if(peep){
    const wipe=(arr,rad)=>{
      for(let i=arr.length-1;i>=0;i--)if(Math.abs(arr[i].x-peep.x)<rad)arr.splice(i,1);
    };
    wipe(plants,peep.r*.85);wipe(fauna,peep.r*.6);
    if(tr.deco)wipe(tr.deco,peep.r);
  }
  /* и крупную форму: стена или друза перед устьем закрывала сам вход, к
     которому ведёт стрелка навигатора */
  if(tr.deco)clearNear(tr.deco,90);
  const offX=L.x+shipZoneR()+26;
  G.surf={p,tr,shipX:L.x,shipY:L.y,x:offX,y:groundAt(tr,offX)-10,t0:G.t,
    vy:0,on:false,face:1,g:.052+p.T.grav*.05,deposits,plants,fauna,mining:null,
    suit:100,warned:false,beacon:0,walkAmp:0,walkPhase:0,cave:caveMouth,peep};
  G.mode="surface";
  G.surfTipShown=0;
  logAdd("dim","Посадка на "+p.name+" · залежей: "+deposits.length);
  say(p.name+"\n"+p.T.ru+"\nзалежей: "+deposits.length);
}
function updateSurface(dt){
  const S=G.surf,tr=S.tr,st=stat();
  const mv=.62*dt;
  if(keys.left||keys.right)S.walkTarget=null;
  if(keys.left){S.x-=mv;S.face=-1;}
  if(keys.right){S.x+=mv;S.face=1;}
  else if(S.walkTarget!=null){
    const d=S.walkTarget-S.x;
    if(Math.abs(d)<mv){S.x=S.walkTarget;S.walkTarget=null;}
    else{S.x+=Math.sign(d)*mv;S.face=Math.sign(d);}
  }
  S.x=clamp(S.x,30,tr.W-30);
  /* амплитуда шага плавно нарастает/спадает, а не переключается щелчком —
     фаза копится только пока реально идём, поэтому ноги не дёргаются на кочках */
  peepUpdate(dt);                       /* луг помнит свет только пока темно (20c) */
  const walking=S.on&&(keys.left||keys.right||S.walkTarget!=null);
  S.walkAmp=clamp(S.walkAmp+(walking?1:-1)*.12*dt,0,1);
  if(walking)S.walkPhase+=dt*.22;
  /* пока стоим на земле — жёстко следуем рельефу, а не догоняем его свободным
     падением: на склоне гравитация отставала от подъёма/спуска на один-два
     кадра, "на земле" мигало туда-обратно, отсюда дрожь ног и мелькание
     подсказки (ДЕЙСТВ у шахты то есть, то нет). Свободное падение — только
     пока реально в прыжке. */
  const gy=groundAt(tr,S.x)-10;
  if(S.on){
    S.y=gy;S.vy=0;
    if(keys.thrust){S.vy=-2.4;S.on=false;}
  }else{
    S.vy+=S.g*dt;S.y+=S.vy*dt;
    if(S.vy>=0&&S.y>=gy){
      /* удар о грунт: тряска пропорциональна скорости падения. Без неё прыжок
         с обрыва ничем не отличается от шага, и вес у мира пропадает. */
      if(S.vy>1.1)S.shake=Math.min(11,S.vy*2.6);
      S.y=gy;S.vy=0;S.on=true;
    }
  }
  camStep(S,dt,walking);
  const dShip=Math.abs(S.x-S.shipX);
  let dep=null,dd=1e9;
  for(const d of S.deposits){
    if(d.left<=0)continue;
    const q=Math.abs(d.x-S.x);
    if(q<26&&q<dd){dd=q;dep=d;}
  }
  /* зверьё бродит и слегка сторонится игрока, но не убегает насовсем */
  for(const b of S.fauna||[]){
    const away=S.x-b.x;
    if(Math.abs(away)<70){b.shy=Math.min(1,b.shy+.02*dt);b.vx=-Math.sign(away)*.16*b.shy;}
    else{b.shy=Math.max(0,b.shy-.01*dt);
      if(Math.random()<.004*dt)b.vx=(Math.random()<.5?-1:1)*(.06+Math.random()*.12);}
    b.x=clamp(b.x+b.vx*dt,40,tr.W-40);
    b.y=groundAt(tr,b.x);
    if(b.vx)b.face=b.vx>0?1:-1;
  }
  let plant=null;
  for(const pl of S.plants)if(!pl.scanned&&Math.abs(pl.x-S.x)<30)plant=pl;
  let beast=null;
  for(const b of S.fauna||[])if(!b.scanned&&Math.abs(b.x-S.x)<34)beast=b;
  S.mining=null;
  const dbtn=document.getElementById("dronebtn");
  if(dep&&G.droneInventory>0){droneTarget=dep.res;dbtn.style.display="";dbtn.textContent="ДРОН → "+RES[dep.res].ru.toUpperCase();}
  else{droneTarget=null;dbtn.style.display="none";}
  /* у корабля скафандр перезаряжается — сюда и возвращаются между заходами;
     взлёт теперь отдельная кнопка с удержанием (см. tickLaunchHold), а не ДЕЙСТВ,
     чтобы добыча ресурса рядом с посадочной площадкой не отправляла в полёт случайно */
  if(dShip<shipZoneR()&&S.suit<100){S.suit=Math.min(100,S.suit+.5*dt);S.warned=false;}
  /* вход в пещеру проверяется раньше залежей и организмов: он редкий и разовый,
     а бурить и сканировать можно где угодно ещё */
  if(S.cave&&Math.abs(S.cave.x-S.x)<34){
    G.prompt="ДЕЙСТВИЕ — ВОЙТИ В ПЕЩЕРУ";
    if(actEdge){enterCave();return;}
  }
  /* ── памятники и аномалии ──
     Они стояли на горизонте чистой декорацией: подойти было можно, сделать
     нельзя. Осмотр даёт данные и иногда узел — и это единственное место, где
     узлы «из аномалии» вообще выпадают (05a-nodes). Осмотренное помнится:
     второй раз к тому же монолиту идти незачем. */
  /* ── посёлок (12t) ──
     Проверяется раньше памятников: жильё стоит там же, где ходят, и разговор с
     живущими важнее осмотра камня. Приказать здесь нечего — только отдать своё
     или спросить, готово ли у них что-нибудь. Отдаём самый крупный груз в
     трюме: выбор из списка сделал бы это меню построек с лишним шагом, а
     рацион — это то, что игрок ВОЗИТ, а не то, что он галочкой отметил. */
  /* ── срок (M114) ──
     Пока идёт срок, у посёлка есть ровно одно дело: подъём. Рацион и просьбы
     подождут — с людьми на земле говорить о торговле нечего. */
  else if(typeof doomIsHere==="function"&&doomIsHere()&&doomGet().known&&doomStanding()>0&&
          settleCanLive(S.p)&&Math.abs(S.x-settleSpotX(S.p,tr))<44){
    G.prompt="ДЕЙСТВИЕ — ПОДНЯТЬ ЛЮДЕЙ\n"+doomLine();
    if(actEdge){doomLift();return;}
  }
  /* высадка: другая система, живая земля, никто там ещё не живёт */
  else if(typeof doomCanLand==="function"&&doomCanLand(S.p)&&(G.cargo.folk|0)>0){
    G.prompt="ДЕЙСТВИЕ — ВЫСАДИТЬ ЛЮДЕЙ ×"+(G.cargo.folk|0)+
      "\nОНИ НАЧНУТ ЗАНОВО, НО ЭТО ТЕ ЖЕ ЛЮДИ";
    if(actEdge){doomLand(S.p);return;}
  }
  /* ── Жестянка (12z) ──
     Два места, а не одно меню: у приёмника сыплют и забирают, у печатника
     снимают ленту. Расстояние между ними — не украшение: машина и её память
     разные вещи, и ходить к ним надо порознь. */
  else if(tinCanLive(S.p)&&Math.abs(S.x-(tinSpotX(S.p,tr)+112))<32){
    const T=tinTick(tinAt(G.sx,G.sy));
    const left=T?(TIN_LOG-T.read):TIN_LOG;
    if(!T||!T.run&&!T.read&&!(T.bin>0)){
      /* мёртвая машина ленту не печатает: печатник ждёт своей смены */
      G.prompt="ПЕЧАТНИК МОЛЧИТ · ЛЕНТА ИДЁТ, КОГДА ИДЁТ СМЕНА";
    }else if(left<=0){
      G.prompt="ЛЕНТА ПУСТА · МАШИНА БОЛЬШЕ НИЧЕГО НЕ ПОМНИТ";
    }else{
      G.prompt="ДЕЙСТВИЕ — СНЯТЬ ЛЕНТУ · ОСТАЛОСЬ ЗАПИСЕЙ "+left;
      if(actEdge){tinStrip(T);return;}
    }
  }
  else if(tinCanLive(S.p)&&Math.abs(S.x-tinSpotX(S.p,tr))<56){
    const T=tinTick(tinAt(G.sx,G.sy)||tinMake(S.p));
    const A=tinAskOf(T.seed);
    if(T.bin>=1){
      G.prompt="ДЕЙСТВИЕ — ЗАБРАТЬ · "+RES[A.made].ru.toUpperCase()+" ×"+Math.floor(T.bin)+
        "\n"+tinLine(T);
      if(actEdge){
        const n=tinTakeOut(T);
        if(n>0)tell("good","Из бункера: "+RES[A.made].ru+" ×"+n,
          "ЗАБРАНО\n"+RES[A.made].ru+" ×"+n+"\n"+tinLine(T));
        else say("Трюм полон\n"+tinLine(T));
        return;
      }
    }else if(T.run>0){
      G.prompt="СМЕНА ИДЁТ · БУНКЕР ПУСТ\n"+tinLine(T);
    }else if((G.cargo[A.k]|0)>0){
      const give=Math.min(G.cargo[A.k]|0,A.need-T.fed);
      G.prompt="ДЕЙСТВИЕ — ЗАСЫПАТЬ · "+RES[A.k].ru.toUpperCase()+" ×"+give+"\n"+tinLine(T);
      if(actEdge){
        const n=tinFeed(T,give);
        if(n>0)tell(T.run>0?"good":"tech","Засыпано: "+RES[A.k].ru+" ×"+n,
          "ЗАСЫПАНО\n"+RES[A.k].ru+" ×"+n+"\n"+tinLine(T));
        return;
      }
    }else{
      G.prompt="НАРЯД НЕ ЗАКРЫТ · НУЖЕН "+RES[A.k].ru.toUpperCase()+"\n"+tinLine(T);
    }
  }
  else if(settleCanLive(S.p)&&Math.abs(S.x-settleSpotX(S.p,tr))<44){
    const V=settleTick(settleAt(G.sx,G.sy));
    let big="",bn=0;
    /* боеприпас (M112) в рацион не идёт: ракета — не то, чем кормят, и
       случайно отдать её вместо руды нельзя */
    for(const k of RES_KEYS){
      if(AMMO_KEYS.indexOf(k)>=0)continue;
      if((G.cargo[k]|0)>bn){bn=G.cargo[k]|0;big=k;}
    }
    if(big&&bn>0){
      G.prompt="ДЕЙСТВИЕ — ОТДАТЬ ЖИВУЩИМ · "+RES[big].ru.toUpperCase()+" ×"+Math.min(bn,40)+
        (V?"\nПОСЁЛОК · СТУПЕНЬ "+V.stage+" · "+settleLine(V,V.built.length):"\nЗДЕСЬ ЖИВУТ");
      if(actEdge){
        const S2=V||settleMake(S.p);
        const n=settleGive(S2,big,Math.min(bn,40));
        if(n>0)tell("good","Отдано живущим: "+RES[big].ru+" ×"+n,
          "ОТДАНО\n"+RES[big].ru+" ×"+n+"\n"+settleLine(S2,1));
        else say("Амбар полон\n"+settleLine(S2,2));
        return;
      }
    }else if(V){
      /* слово, которое игрок понимает, здесь и превращается в просьбу: он
         называет его, и с него начинают. Слов нет — берёт что вынесут. */
      const words=settleWords(V),ask=words.length?words[(G.t/240|0)%words.length]:"";
      G.prompt="ДЕЙСТВИЕ — "+(ask?("ПРОСИТЬ: "+ask.toUpperCase()):"СПРОСИТЬ")+
        " · ПОСЁЛОК СТУПЕНЬ "+V.stage+"\n"+settleLine(V,3);
      if(actEdge){
        const got=settleAsk(V,ask);
        if(got>0)tell("good","Посёлок отдал товара ×"+got,"ДАЛИ\n×"+got+"\n"+settleLine(V,4));
        else say("Сегодня у них ничего нет\n"+settleLine(V,5));
        return;
      }
    }
  }
  else if(poiNear(S,tr)){
    const q=poiNear(S,tr);
    /* Осмотр идёт единственной дорогой — через `poiInspect` (20a-poi). Здесь
       раньше стоял свой, урезанный осмотр: данные и узел, без ответа по типу
       памятника. Из-за этого вся таблица `POI_FIND` — координаты храма, цены
       обсерватории, склад завода, редкость на своём адресе — в игре не
       срабатывала ни разу, хотя тесты её проверяли.
       Осмотренный камень теперь не молчит: он показывает, что отдал. */
    const memo=poiMemo(q.seed);
    G.prompt=memo?("ОСМОТРЕНО · "+q.ru+(memo.got?"\n"+String(memo.got).toUpperCase():""))
                 :("ДЕЙСТВИЕ — ОСМОТРЕТЬ · "+q.ru);
    if(actEdge&&!memo)poiInspect(q);
  }
  else if(dep){
    if(held()>=st.cargoMax)G.prompt="ТРЮМ ПОЛОН · "+RES[dep.res].ru.toUpperCase()+" ОСТАЛОСЬ "+dep.left;
    else{
      G.prompt="УДЕРЖИВАЙТЕ ДЕЙСТВИЕ — БУРЕНИЕ\n"+RES[dep.res].ru.toUpperCase()+" · ЗАЛЕЖЬ "+dep.left+
        " · ТРЮМ "+held()+"/"+st.cargoMax;
      if(keys.act){
        S.mining=dep;dep.prog+=.026*st.drill*dt;
        while(dep.prog>=1&&dep.left>0&&held()<st.cargoMax){
          dep.prog-=1;dep.left--;minedUnit(dep.res);
        }
        if(dep.left<=0)say("Залежь выработана\n"+RES[dep.res].ru);
      }
    }
  }else if(beast){
    G.prompt="ДЕЙСТВИЕ — СКАНИРОВАТЬ ЖИВОТНОЕ\n"+beast.name.toUpperCase();
    if(actEdge){
      /* существо подаёт голос: тембр из его же seed, у каждого свой */
      sfx("beast",{seed:beast.seed||hashi(beast.x|0,beast.r*100|0,7)});
      beast.scanned=true;G.species.add(beast.name);G.data+=14;G.bio=(G.bio|0)+1;
      tell("","Новый вид: "+beast.name+" · +14 данных","Новый вид\n"+beast.name+"\n+14 данных");
    }
  }else if(plant){
    G.prompt="ДЕЙСТВИЕ — СКАНИРОВАТЬ ОРГАНИЗМ";
    if(actEdge){
      plant.scanned=true;G.species.add(plant.name);G.data+=9;G.bio=(G.bio|0)+1;
      tell("","Новый вид: "+plant.name+" · +9 данных","Новый вид\n"+plant.name+"\n+9 данных");
    }
  }else if(dShip<shipZoneR()&&baseAt(G.sx,G.sy,S.p.idx)){
    /* шлюз базы стоит рядом с кораблём — вход тем же жестом, что в пещеру */
    G.prompt="ДЕЙСТВИЕ — СПУСТИТЬСЯ В БАЗУ";
    if(actEdge){enterBase(S.p);return;}
  }else if(dShip<shipZoneR()&&!baseAt(G.sx,G.sy,S.p.idx)&&S.p.type!=="gas"){
    G.prompt="ДЕЙСТВИЕ — ЗАЛОЖИТЬ БАЗУ · 2500 КР + 10 СПЛАВОВ";
    if(actEdge&&foundBase(S.p)){enterBase(S.p);return;}
  }else if(S.on){
    G.prompt="ДЕЙСТВИЕ — ЗАЛОЖИТЬ ШАХТУ · ВГЛУБЬ ПОРОДА БОГАЧЕ\n▲ — ПРЫЖОК · ИЩИТЕ ЗАЛЕЖИ";
    if(actEdge){enterDig();return;}
  }else if(dShip<shipZoneR()){
    G.prompt=(G.fuel<8?"НЕТ ТОПЛИВА · КНОПКА ВЗЛЁТА — ЭВАКУАЦИЯ":"КНОПКА ВЗЛЁТА — УДЕРЖАТЬ")+
      "\nТРЮМ "+held()+"/"+st.cargoMax+" · СКАФАНДР "+Math.round(S.suit)+"%"+(S.suit<100?" · ЗАРЯДКА":" · ГОТОВ");
  }else G.prompt="▲ — ПРЫЖОК · ИЩИТЕ ЗАЛЕЖИ";
  /* синтез топлива изо льда доступен и на поверхности, не только в полёте */
  if(dShip<shipZoneR()&&G.tech.has("synth")&&G.cargo.ice>0&&G.fuel<st.fuelMax&&keys.act&&!S.mining){
    const ratio=st.synthRatio,n=Math.min(G.cargo.ice,Math.ceil((st.fuelMax-G.fuel)/ratio));
    G.cargo.ice-=n;G.fuel=Math.min(st.fuelMax,G.fuel+n*ratio);
    say("Синтез: "+n+" льда → "+(n*ratio)+" топлива");
  }
  const lbtn=document.getElementById("launchbtn");
  if(lbtn){
    if(dShip<shipZoneR()){
      lbtn.style.display="";
      lbtn.textContent=G.fuel<8?"ЭВАКУАЦИЯ":"ВЗЛЁТ";
    }else lbtn.style.display="none";
  }
}
let launchHold=0;
function tickLaunchHold(dt){
  const S=G.surf;if(!S)return;
  const dShip=Math.abs(S.x-S.shipX);
  if(dShip<shipZoneR()&&keys.launch){
    launchHold+=dt;
    const lbar=document.getElementById("launchbar");
    if(lbar)lbar.style.width=clamp(launchHold/36*100,0,100)+"%";
    if(launchHold>=36){launchHold=0;if(G.fuel<8)evacuate();else launch();}
  }else{
    launchHold=Math.max(0,launchHold-dt*2);
    const lbar=document.getElementById("launchbar");
    if(lbar)lbar.style.width=clamp(launchHold/36*100,0,100)+"%";
  }
}
function evacuate(){
  const S=G.surf;
  const dist=Math.hypot(G.sx,G.sy);
  const cost=Math.min(4000,Math.round(800+220*dist));
  if(G.credits<cost){totalLoss();return;}
  G.credits-=cost;
  const dest=nearestStation(G.sx,G.sy);
  G.sx=dest.sx;G.sy=dest.sy;G.sys=dest;
  G.fuel=Math.max(G.fuel,30);
  G.ship.x=Math.cos(0)*(dest.station?dest.station.orbit+120:900);
  G.ship.y=Math.sin(0)*(dest.station?dest.station.orbit+120:900);
  G.ship.vx=0;G.ship.vy=0;
  G.mode="system";G.land=null;G.surf=null;
  saveGame(true);
  logAdd("warn","Эвакуация с "+S.p.name+" за "+cost+" кр · переброшены к "+dest.name);
  say("Эвакуация\n-"+cost+" кр · вы в системе "+dest.name);
}
function totalLoss(){
  const S=G.surf;
  const pname=S?S.p.name:"поверхности";
  /* если дом уже есть — возвращаемся туда: смерть перестаёт быть обнулением и
     становится потерей рейса. Обнуление стирало вместе с кораблём всю историю,
     то есть наказывало сильнее, чем игра стоит (12j-home) */
  if(homeCanRevive()){homeRevive(pname);return;}
  G.shipId="strizh";G.owned={strizh:true};
  G.mods={engine:0,tank:0,hold:0,armor:0,drill:0,hyper:0,weapon:0};
  G.modsOwned={engine:0,tank:0,hold:0,armor:0,drill:0,hyper:0,weapon:0};
  G.inv=[];G.fit={};G.loot=[];invalidateParts();
  for(const k of RES_KEYS)G.cargo[k]=0;
  G.credits=0;
  const st0=stat();
  G.fuel=st0.fuelMax;G.hull=st0.hullMax;
  G.sx=0;G.sy=0;G.sys=getSystem(0,0);
  G.ship.x=900;G.ship.y=0;G.ship.vx=0;G.ship.vy=0;
  G.mode="system";G.ap=null;G.belt=null;G.dig=null;G.cave=null;G.surf=null;G.land=null;
  G.pirates=[];G.shots=[];
  saveGame(true);
  logAdd("warn","Корабль потерян без топлива на "+pname+" · новый «Стриж» со старта");
  say("Корабль потерян\nбез кредитов на эвакуацию\nновый «Стриж» · система старта");
}
function launch(){
  const S=G.surf,p=S.p;
  if(G.fuel<8){evacuate();return;}
  G.fuel-=8;G.mode="system";
  G.ship.x=p.x+Math.cos(p.ang)*(p.radius+150);
  G.ship.y=p.y+Math.sin(p.ang)*(p.radius+150);
  G.ship.a=p.ang;
  const v=apVel(p);
  G.ship.vx=v.x+Math.cos(p.ang)*.9;G.ship.vy=v.y+Math.sin(p.ang)*.9;
  saveGame(true);
  say("Выход на орбиту\nв трюме: "+held());
  G.land=null;G.surf=null;
  /* захват орбиты остался с прошлого подлёта: без сброса взлёт снова приклеил бы
     корабль к кругу вокруг планеты вместо того, чтобы отпустить его в полёт */
  G.orbit=null;
}
/* ══════════════ навигатор и подсказки сверху ══════════════ */
/* Всё неочевидное на планете игрок должен видеть, не догадываясь: где пещера,
   что у корабля можно заложить базу, чем занят скафандр. Одна строка сверху и
   стрелка к цели — этого хватает, чтобы не искать вслепую. */
function surfaceHint(){
  const S=G.surf;if(!S)return null;
  const dShip=Math.abs(S.x-S.shipX);
  if(S.suit<35)return "СКАФАНДР НА ИСХОДЕ · К КОРАБЛЮ ИЛИ КНОПКА → КОРАБЛЬ";
  if(dShip<shipZoneR()){
    if(baseAt(G.sx,G.sy,S.p.idx))return "ЗДЕСЬ ВАША БАЗА · ДЕЙСТВИЕ — СПУСТИТЬСЯ ВНИЗ";
    if(S.p.type!=="gas")return "У КОРАБЛЯ МОЖНО ЗАЛОЖИТЬ БАЗУ · ДЕЙСТВИЕ · 2500 КР + 10 СПЛАВОВ";
  }
  if(S.cave&&Math.abs(S.cave.x-S.x)<34)return "ВХОД В ПЕЩЕРУ · ДЕЙСТВИЕ — ВНУТРЬ";
  if(!G.surfTipShown||G.t-G.surfTipShown<900){
    if(!G.surfTipShown)G.surfTipShown=G.t;
    return "ЦВЕТНЫЕ КРИСТАЛЛЫ — ЗАЛЕЖИ · СТРЕЛКИ СВЕРХУ ВЕДУТ К ПЕЩЕРЕ И КОРАБЛЮ";
  }
  return null;
}
function drawSurfaceHud(camx,camy){
  const S=G.surf;
  ctx.textAlign="center";
  /* строка-подсказка сверху */
  /* полоса идёт ниже приборов: сверху слева датчики, справа сводка системы,
     справа же колонка кнопок — туда текст залезать не должен */
  const TOP=58, RIGHT_PAD=118;
  const hint=surfaceHint();
  if(hint){
    ctx.font="10px ui-monospace,monospace";
    const w=Math.min(W-RIGHT_PAD-20,ctx.measureText(hint).width+22);
    const cx=(W-RIGHT_PAD)/2;
    ctx.fillStyle="rgba(5,7,12,.72)";ctx.fillRect(cx-w/2,TOP,w,20);
    ctx.strokeStyle="rgba(127,230,216,.28)";ctx.lineWidth=1;
    ctx.strokeRect(cx-w/2+.5,TOP+.5,w-1,19);
    ctx.fillStyle="rgba(190,235,240,.92)";ctx.fillText(hint,cx,TOP+14);
  }
  /* навигатор: маркеры цели у верхней кромки — корабль и пещера */
  const marks=[];
  marks.push({x:S.shipX,ru:"КОРАБЛЬ",col:"rgba(242,178,92,.9)"});
  if(S.cave)marks.push({x:S.cave.x,ru:"ПЕЩЕРА",col:"rgba(150,225,255,.9)"});
  /* достопримечательность ведут отдельно от пещеры: до неё далеко, и без
     маркера игрок пройдёт мимо ровно того, ради чего стоило садиться */
  const poi=nearestPOI(S.tr,S.x);
  if(poi)marks.push({x:poi.x,ru:poi.ru,col:"rgba(212,180,255,.9)"});
  ctx.font="9px ui-monospace,monospace";
  for(let mi=0;mi<marks.length;mi++){
    const m=marks[mi];
    const d=m.x-S.x, ad=Math.abs(d);
    const sx=clamp(m.x-camx,64,W-RIGHT_PAD-14);   // запас под подпись по центру
    /* маркеры разводим по строкам: две цели рядом давали кашу из наложенных
       подписей, и не читалась ни одна */
    const y=(hint?TOP+34:TOP+6)+mi*13;
    ctx.fillStyle=m.col;
    if(ad>W*.45){                       // цель за краем — рисуем стрелку направления
      const dir=Math.sign(d);
      ctx.beginPath();
      ctx.moveTo(sx+dir*8,y);ctx.lineTo(sx-dir*4,y-5);ctx.lineTo(sx-dir*4,y+5);
      ctx.closePath();ctx.fill();
      ctx.fillText(m.ru+" "+Math.round(ad)+" м",sx,y+16);
    }else{
      ctx.fillRect(sx-1,y-5,2,10);
      ctx.fillText(m.ru,sx,y+16);
    }
  }
}
function drawSurface(){
  const S=G.surf,tr=S.tr,p=S.p;
  tr.mat=planetMat(p);tr.p=p;
  ctx.fillStyle=skyGrad(p);ctx.fillRect(0,0,W,H);
  /* звёзды — до небесных тел: нарисованные после, они просвечивают сквозь
     диск гиганта и убивают его объём */
  if(p.T.atm==="отсутствует"||p.type==="ice")drawStars(S.x*.1,0,1);
  drawSkyLayer(p,S.x,S.y);
  WIND=windOf(p);
  /* камера идёт рядом, а не приклеена: инерция, взгляд вперёд, дыхание,
     тряска от удара (19c-light). Если камеры ещё нет — первый кадр берём по
     персонажу, чтобы не было рывка от нуля. */
  if(!S.cam)S.cam={x:S.x,y:S.y};
  const co=camOffset(S);
  const camx=S.cam.x-W/2+co.x, camy=clamp(S.cam.y-H*.58,-300,1e5)+co.y;
  /* единственный источник правды о камере на кадр: по нему же ввод пересчитывает
     тычок в мировую координату (15-input) */
  G.viewX=camx;G.viewY=camy;
  /* дальний хребет не гасится прозрачностью, а выцветает в цвет неба: именно
     этим глаз мерит расстояние (19c-light). Двух слоёв достаточно, третий уже
     не читается, а стоит столько же. */
  drawGround({h:tr.h,N:tr.N,step:tr.step*3.6},camx*.22,camy*.42+130,hazeFar(p,.58),null);
  drawGround({h:tr.h,N:tr.N,step:tr.step*2.4},camx*.35,camy*.5+80,hazeFar(p,.32),null);
  hazeBand(p,H*.52,H*.22);
  drawGround(tr,camx,camy,"rgb("+p.T.pal[3].map(v=>Math.round(v*.5)).join(",")+")",
    "rgba(200,240,246,.4)",p.T.pal);
  drawPOI(tr,camx,camy,p);
  /* средний масштаб между валуном и постройкой — тем же светом и той же
     породой, что грунт под ним (21b-surface-deco) */
  drawDeco(tr,camx,camy,p);
  /* ваши постройки — тем же слоем, что и POI: их видно с земли, заходить
     в меню, чтобы узнать об их существовании, больше не нужно */
  drawBuilt(tr,camx,camy,p);
  /* посёлок (12t) — тем же слоем, что и постройки: место, к которому игрок идёт
     ногами, обязано быть видно с горизонта, иначе идти не за чем */
  if(settleCanLive(p))settleDraw(settleAt(G.sx,G.sy),tr,camx,camy,p);
  /* Жестянка (12z) — тем же слоем и по тому же правилу: то, к чему игрок идёт
     ногами, видно с горизонта. Там, где стоит она, посёлка не бывает */
  if(tinCanLive(p))tinDraw(tinAt(G.sx,G.sy),tr,camx,camy,p);
  drawRocks(tr,camx,camy,p.T.pal);
  /* подглядка стелется по грунту, поэтому ложится до кустов и до валунов
     переднего плана — она часть земли, а не то, что на ней стоит (20c) */
  peepDrawMat(camx,camy);
  /* тень по длине корпуса, а не по прежним 34 px: у нового посадочного силуэта
     она иначе выдаёт игрушку на палочках */
  groundShadow(S.shipX-camx,S.shipY-camy+12,landerLen(G.shipId)*.46,8);
  ctx.save();ctx.translate(S.shipX-camx,S.shipY-camy);
  /* стоим: шасси выпущено, трап спущен, сопла ещё остывают после посадки */
  drawLander(false,false,{gear:1,sq:0,landed:true,tr:S.tr,gx:S.shipX,
    hot:Math.max(0,1-(G.t-(S.t0||0))/700)});
  ctx.restore();
  drawDustMotes(camx,camy,p);
  if(S.cave){
    const cx=S.cave.x-camx;
    if(cx>-60&&cx<W+60){
      const cy=groundAt(tr,S.cave.x)-camy;
      ctx.fillStyle="#050708";
      ctx.beginPath();ctx.ellipse(cx,cy-2,20,14,0,0,Math.PI,true);ctx.fill();
      ctx.fillStyle="rgba(93,115,130,.85)";ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
      ctx.fillText("ПЕЩЕРА",cx,cy-22);
    }
  }
  for(const pl of S.plants){
    const x=pl.x-camx;if(x<-70||x>W+70)continue;
    groundShadow(x,pl.y-camy+1,Math.min(22,pl.h*.32),3.2);
    /* растение кланяется от основания: высокое сильнее низкого, у каждого своя
       фаза от координаты — иначе куртина качается одним куском */
    const sw=WIND*.055*(.6+pl.h/90)*(.75+.25*Math.sin(G.t*.028+pl.x*.05));
    ctx.save();ctx.translate(x,pl.y-camy);ctx.rotate(sw);
    drawPlant(pl,0,0);
    ctx.restore();
  }
  for(const b of S.fauna||[]){
    const x=b.x-camx;if(x<-50||x>W+50)continue;
    groundShadow(x,b.y-camy+1,b.r*.9,2.6);
    drawBeast(b,x,b.y-camy,false,0);
    if(b.scanned){
      ctx.fillStyle="rgba(127,230,216,.75)";ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
      ctx.fillText("ИЗУЧЕН",x,b.y-camy-b.r*2.6);
    }
  }
  /* идущие — позади астронавта и поверх кустов: они на лугу, а не за ним (20c) */
  peepGhosts(camx,camy);
  for(const d of S.deposits){
    if(d.left<=0)continue;
    const x=d.x-camx;if(x<-50||x>W+50)continue;
    const y=d.y-camy,col=RES[d.res].col;
    ctx.fillStyle=col;
    for(let i=0;i<3;i++){
      const o=(i-1)*6,hh=6+((i*7+d.left)%5);
      ctx.beginPath();ctx.moveTo(x+o,y-hh);ctx.lineTo(x+o+4,y+2);ctx.lineTo(x+o-4,y+2);
      ctx.closePath();ctx.fill();
    }
    ctx.strokeStyle=col;ctx.globalAlpha=.3;ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(x,y-3,15+Math.sin(G.t*.05+d.x)*2,0,TAU);ctx.stroke();
    ctx.globalAlpha=1;
    if(Math.abs(d.x-S.x)<70){
      ctx.fillStyle=col;ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
      /* соседние залежи разводим по высоте: рядом стоящие подписи наезжали друг
         на друга и читались как каша из двух названий */
      ctx.fillText(RES[d.res].ru.toUpperCase()+" "+d.left,x,y-24-(Math.round(d.x/60)%2)*11);
    }
    if(S.mining===d){
      ctx.fillStyle="rgba(0,0,0,.5)";ctx.fillRect(x-18,y-20,36,4);
      ctx.fillStyle=col;ctx.fillRect(x-18,y-20,36*clamp(d.prog,0,1),4);
    }
  }
  /* астронавт рисуется по своей координате, а не в центре экрана: с инерцией
     и взглядом вперёд центр экрана — уже не он */
  const x=S.x-camx,y=S.y-camy;
  if(S.on)groundShadow(x,y+1,7,2);
  ctx.save();ctx.translate(x,y-1);
  drawAstronaut({face:S.face,amp:S.walkAmp,phase:S.walkPhase,
    air:!S.on,jet:!S.on&&S.vy<0,mining:!!S.mining,suitLow:S.suit<25});
  ctx.restore();
  if(S.mining){
    ctx.strokeStyle="rgba(242,178,92,.7)";ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(x+S.face*6,y+2);
    ctx.lineTo(S.mining.x-camx,S.mining.y-camy-4);ctx.stroke();
  }
  /* лучи и свёртка — последними, поверх всего мира и до приборов: приборы
     должны остаться читаемыми, их виньетка касаться не должна */
  /* погода поверх мира, но под лучами и свёрткой: осадки идут перед игроком,
     а свет и цветокоррекция ложатся уже на всё вместе */
  drawWeather(p,camx,camy);
  lightShafts(p);
  gradePass(p);
  drawSurfaceHud(camx,camy);
}
