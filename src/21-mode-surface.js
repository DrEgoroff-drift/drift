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
  /* двор дома (M170): у жилья участок расчищен — иначе гигантская флора растёт
     сквозь крыльцо и дом не разглядеть. Чистим шире, чем у пещеры: это двор */
  if(typeof homeHereP==="function"&&homeHereP(p)&&typeof homeSpotX==="function"){
    const hx=homeSpotX(p,tr);
    if(hx!=null){
      const clearHome=(arr,rad)=>{
        for(let i=arr.length-1;i>=0;i--)if(Math.abs(arr[i].x-hx)<rad)arr.splice(i,1);
      };
      clearHome(deposits,150);clearHome(plants,140);clearHome(fauna,150);
    }
  }
  /* подглядка (20c): луг лежит открытым. Куст или валун посреди мата закрывает
     собой идущих, а показывают здесь именно их */
  const peep=peepMake(tr,p);
  /* уезд света (11i): флора светится; на планете ядра устье — там, куда бежит тихий */
  if(typeof glowDressFlora==="function")glowDressFlora(plants);
  if(peep&&typeof glowCaveX==="function"){const gx=glowCaveX(peep,p);if(gx!=null){caveMouth.x=clamp(gx,150,tr.W-150);clearNear(deposits,70);clearNear(plants,50);clearNear(fauna,60);}}
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
    suit:suitMax(),warned:false,beacon:0,walkAmp:0,walkPhase:0,cave:caveMouth,peep};
  G.mode="surface";
  if(typeof placeMark==="function")placeMark();   // память места и одометр (11d)
  G.surfTipShown=0;
  logAdd("dim","Посадка на "+p.name+" · залежей: "+deposits.length);
  /* посадки на планету считаются так же, как на станцию: условиям историй
     нужно «который раз здесь» (11c) */
  if(typeof visitsAll==="function"){const V=visitsAll(),k=G.sys.key+"/"+p.idx;V[k]=(V[k]|0)+1;}
  /* строка истории к посадке (11c): то, что замечаешь, выйдя из корабля */
  let sl=(typeof storyGroundLine==="function")?storyGroundLine("land"):null;
  /* три света (11g): календарь заводится первым приходом, ставни — единственный знак */
  if(typeof lightsArrive==="function"){lightsArrive();if(!sl)sl=lightsGroundLine();}
  if(!sl&&typeof hoursGroundLine==="function")sl=hoursGroundLine();   // уезд часов (11h)
  if(!sl&&typeof glowGroundLine==="function")sl=glowGroundLine();      // уезд света (11i)
  if(!sl&&typeof countyGroundLine==="function")sl=countyGroundLine();  // большой уезд (11l)
  if(!sl&&typeof slowGroundLine==="function")sl=slowGroundLine();      // медленный (11o)
  if(!sl&&typeof passGroundLine==="function")sl=passGroundLine();      // перевал (11p)
  if(!sl&&typeof grownGroundLine==="function")sl=grownGroundLine();    // другое взросление (11q)
  if(!sl&&typeof planGroundLine==="function")sl=planGroundLine();      // план (11r)
  if(!sl&&typeof retGroundLine==="function")sl=retGroundLine();        // возвращение (11s)
  if(sl)logAdd("dim",sl);
  say(p.name+"\n"+p.T.ru+"\nзалежей: "+deposits.length+(sl?"\n"+sl:""),sl?320:150);
}
function updateSurface(dt){
  const S=G.surf,tr=S.tr,st=stat();
  const mv=.62*dt*(typeof kitStat==="function"?kitStat().walk:1);   /* ботинки и вес (M152) */
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
  if(typeof countyNoiseTick==="function")countyNoiseTick(S,dt);   /* город слушает (11l) */
  /* посёлок слышно раньше, чем видно (хвост M109): редкий стук и голос,
     громкость по расстоянию. Не музыка и не петля — одиночные звуки */
  if(settleCanLive(S.p)){
    const d=Math.abs(S.x-settleSpotX(S.p,tr));
    if(d<520){
      S.setSnd=(S.setSnd||0)-dt;
      if(S.setSnd<=0){
        S.setSnd=120+Math.random()*160;
        const v=.12*(1-d/520);
        if(Math.random()<.6)sfx("ui",{f:180+Math.random()*60,to:90,d:.09,v});
        else sfx("ui",{f:300+Math.random()*120,to:240,d:.18,v:v*.7});
      }
    }
  }
  const walking=S.on&&(keys.left||keys.right||S.walkTarget!=null);
  S.walkAmp=clamp(S.walkAmp+(walking?1:-1)*.12*dt,0,1);
  if(walking)S.walkPhase+=dt*.22;
  /* следы: мир пешком не помнил, что по нему шли (G12). Пишем точку через
     каждые тринадцать пикселей пути по земле, храним полторы сотни. */
  if(walking&&S.on){
    S.tracks=S.tracks||[];
    if(S.lastTrackX==null||Math.abs(S.x-S.lastTrackX)>=13){S.tracks.push({x:S.x,t:G.t,f:S.face});S.lastTrackX=S.x;if(S.tracks.length>150)S.tracks.shift();}
  }
  /* пока стоим на земле — жёстко следуем рельефу, а не догоняем его свободным
     падением: на склоне гравитация отставала от подъёма/спуска на один-два
     кадра, "на земле" мигало туда-обратно, отсюда дрожь ног и мелькание
     подсказки (ДЕЙСТВ у шахты то есть, то нет). Свободное падение — только
     пока реально в прыжке. */
  const gy=groundAt(tr,S.x)-10;
  /* ранец (20d): на земле тяга — толчок вверх, в воздухе — полёт, пока есть
     запас; запас копится на земле. Пик рельефа больше не стена. */
  if(S.on){
    S.y=gy;S.vy=0;S.jetOn=false;
    jetTick(S,S.g,dt,false);
    if(keys.thrust&&jetCanLift()){S.vy=-1.6;S.on=false;S.jetOn=true;}
  }else{
    S.vy+=S.g*dt;
    jetTick(S,S.g,dt,true);
    S.y+=S.vy*dt;
    if(S.vy>=0&&S.y>=gy){
      /* удар о грунт: тряска пропорциональна скорости падения. Без неё прыжок
         с обрыва ничем не отличается от шага, и вес у мира пропадает. */
      if(S.vy>1.1)S.shake=Math.min(11,S.vy*2.6);
      S.y=gy;S.vy=0;S.on=true;S.jetOn=false;
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
    if(Math.abs(away)<70*kitStat().noise*(typeof vegaAboard==="function"&&vegaAboard()?1.3:1)){if(typeof vegaBeastShout==="function"&&Math.abs(away)<50)vegaBeastShout();b.shy=Math.min(1,b.shy+.02*dt);b.vx=-Math.sign(away)*.16*b.shy;}
    else{b.shy=Math.max(0,b.shy-.01*dt);
      if(Math.random()<.004*dt)b.vx=(Math.random()<.5?-1:1)*(.06+Math.random()*.12);}
    b.x=clamp(b.x+b.vx*dt,40,tr.W-40);
    b.y=groundAt(tr,b.x);
    if(b.vx)b.face=b.vx>0?1:-1;
  }
  let plant=null;
  for(const pl of S.plants)if(!pl.scanned&&Math.abs(pl.x-S.x)<30*kitStat().scan)plant=pl;
  let beast=null;
  for(const b of S.fauna||[])if(!b.scanned&&Math.abs(b.x-S.x)<34*kitStat().scan)beast=b;
  S.mining=null;
  const dbtn=document.getElementById("dronebtn");
  if(dep&&G.droneInventory>0){droneTarget=dep.res;dbtn.style.display="";dbtn.textContent="ДРОН → "+RES[dep.res].ru.toUpperCase();}
  else{droneTarget=null;dbtn.style.display="none";}
  /* у корабля скафандр перезаряжается — сюда и возвращаются между заходами;
     взлёт теперь отдельная кнопка с удержанием (см. tickLaunchHold), а не ДЕЙСТВ,
     чтобы добыча ресурса рядом с посадочной площадкой не отправляла в полёт случайно */
  if(dShip<shipZoneR()&&S.suit<suitMax()){S.suit=Math.min(suitMax(),S.suit+.5*(typeof vegaAboard==="function"&&vegaAboard()&&!vegaOffended()?1.5:1)*dt);S.warned=false;}
  /* вход в пещеру проверяется раньше залежей и организмов: он редкий и разовый,
     а бурить и сканировать можно где угодно ещё */
  if(S.cave&&Math.abs(S.cave.x-S.x)<34){
    G.prompt="ДЕЙСТВИЕ — ВОЙТИ В ПЕЩЕРУ";
    if(actEdge){enterCave();return;}
  }
  /* дверь дома (M170): своя планета, своё крыльцо — и в дом можно войти */
  if(typeof homeDoorX==="function"&&homeHereP(S.p)){
    const hx=homeDoorX(tr,S.p);
    if(hx!=null&&Math.abs(hx-S.x)<38){
      G.prompt="ДЕЙСТВИЕ — ВОЙТИ ДОМОЙ";
      if(actEdge){enterHomeIn();return;}
    }
  }
  /* путёвка (M162): океанический мир и путёвка на столе — три дня отдыха у корабля */
  if(typeof instRestHere==="function"&&instRestHere()&&dShip<shipZoneR()){
    G.prompt="САНАТОРИЙ · ДЕЙСТВИЕ — ОТДОХНУТЬ ТРИ ДНЯ";
    if(actEdge){instRest();return;}
  }
  /* вход под третьим светом (11g): есть только в соединение и только на планете ядра */
  if(typeof lightsOpen==="function"&&lightsOpen(S.p)&&Math.abs(lightsEntryX(tr,S.p)-S.x)<34){
    G.prompt="ДЕЙСТВИЕ — ВОЙТИ ПОД ТРЕТЬИМ СВЕТОМ";
    if(actEdge){lightsEnter();return;}
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
  /* долина медленного (11o): выложить, прочесть ответ */
  else if(typeof slowHere==="function"&&slowHere(S)){
    if(slowReady()){G.prompt="ДЕЙСТВИЕ — ПРОЧЕСТЬ ОТВЕТ";if(actEdge){slowRead();return;}}
    else if(slowAll().fig){G.prompt="ВЫЛОЖЕНО · ОТВЕТ ЗРЕЕТ · У НЕЁ ДРУГОЕ ВРЕМЯ";}
    else{G.prompt="ДЕЙСТВИЕ — ВЫЛОЖИТЬ ФИГУРУ ИЗ ТРЮМА";if(actEdge){slowLay();return;}}
  }
  /* корабль перевала (11p): свет, потом развилка */
  else if(typeof passAtShip==="function"&&passAtShip(S)){
    if(!passAll().lit){G.prompt="ДЕЙСТВИЕ — ВКЛЮЧИТЬ СВЕТ";if(actEdge){passLight();return;}}
    else G.prompt="ВНУТРИ ВСЁ ЦЕЛО · ВАМ ПОНЯТНО · ИМ — НЕТ";
  }
  else if(typeof passAtVillage==="function"&&passAtVillage(S)&&passAll().lit&&!passAll().told){
    G.prompt="ДЕЙСТВИЕ — ОБЪЯСНИТЬ ИМ\nили уйти. Правильного ответа нет";
    if(actEdge){passTell();return;}
  }
  /* автомат уезда часов (11h): монета — паёк — верная сдача */
  else if(typeof hoursMachineHere==="function"&&hoursMachineHere(S)){
    G.prompt="ДЕЙСТВИЕ — АВТОМАТ · "+HOURS_COIN+" КР · ПАЁК\nникого нет, а он работает";
    if(actEdge){hoursMachine();return;}
  }
  else if(tinCanLive(S.p)&&Math.abs(S.x-tinSpotX(S.p,tr))<56){
    const T=tinTick(tinAt(G.sx,G.sy)||tinMake(S.p));
    const A=tinAskOf(T.seed);
    if(T.bin>=1){
      G.prompt="ДЕЙСТВИЕ — ЗАБРАТЬ · "+RES[A.made].ru.toUpperCase()+" ×"+Math.floor(T.bin)+
        "\n"+tinLine(T)+storyNote("tin");
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
        (V?"\nПОСЁЛОК · СТУПЕНЬ "+V.stage+" · "+settleLine(V,V.built.length):"\nЗДЕСЬ ЖИВУТ")+storyNote("settle");
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
  }else if((S.fauna||[]).some(b=>b.scanned&&!b.caught&&Math.abs(b.x-S.x)<30)){
    /* космозоо (M164): отсканированного можно поймать — клетка занимает слот трюма */
    const cb=(S.fauna||[]).find(b=>b.scanned&&!b.caught&&Math.abs(b.x-S.x)<30);
    G.prompt="ДЕЙСТВИЕ — ПОЙМАТЬ\n"+cb.name.toUpperCase()+" · КЛЕТКА: −1 СЛОТ ТРЮМА";
    if(actEdge){zooCatch(cb);return;}
  }else if(plant){
    G.prompt="ДЕЙСТВИЕ — СКАНИРОВАТЬ ОРГАНИЗМ";
    if(actEdge){
      plant.scanned=true;G.species.add(plant.name);G.data+=9;G.bio=(G.bio|0)+1;
      if(typeof glowScan==="function")glowScan(plant);   /* светящийся мох — товар (11i) */
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
      "\nТРЮМ "+held()+"/"+st.cargoMax+" · СКАФАНДР "+Math.round(S.suit)+"/"+suitMax()+(S.suit<suitMax()?" · ЗАРЯДКА":" · ГОТОВ");
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
