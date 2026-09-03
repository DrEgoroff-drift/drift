/* ══════════════ поверхность ══════════════ */
/* с какого расстояния устье шахты считается «здесь»: тот же порядок, что у
   входа в пещеру (34), чуть шире — копёр и отвал занимают место (M234) */
const MINE_MOUTH_R=40;
/* сколько живёт след: полминуты держится, полминуты гаснет (21e рисует) */
const TRACK_LIFE=2400;
function enterSurface(){
  const L=G.land,tr=L.tr,p=L.p,r=rng(p.seed^0x1234);
  /* залежи берутся из профиля ПЛАНЕТЫ (у смешанного мира он свой), а не из
     таблицы типа: иначе на «ледяной, с вулканами» лежало бы то же, что на
     чистой ледяной, и смесь осталась бы одной раскраской */
  const deposits=[],plants=[],prof=p.res||PROFILE[p.type]||[];
  if(prof.length)for(let i=0;i<22;i++){
    const x=120+r()*(tr.W-240),k=prof[Math.floor(r()*prof.length)];
    /* Место, про которое он рассказал, к этому дню уже выработали: залежей
       меньше и они беднее. Ни строки объяснения — просто беднее (11aj). */
    const worked=(typeof toldWorked==="function")&&toldWorked(G.sx,G.sy,p.idx);
    if(worked&&r()<.45)continue;
    deposits.push({x,y:groundAt(tr,x)-6,res:k,
      left:(worked?2:6)+Math.floor(r()*(worked?4:11)),prog:0});
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
  /* ── куртины по всей полосе, а не в одной ложбине (автор, 24.08.2026) ──
     Центр куртины выбирался «лучшим из трёх бросков по всей ширине, ниже —
     значит лучше». Низина в полосе одна, и все куртины сходились в неё: на
     кадре половина экрана превращалась в сплошную стену листвы, а вторая
     половина стояла голой. Теперь полоса делится на столько участков, сколько
     куртин, и каждая ищет своё низкое место ВНУТРИ СВОЕГО участка. Группировка
     сохранилась — пропала свалка.
     И внутри куртины растения расставлены с шагом, а не брошены случайно:
     чисто случайные точки на отрезке слипаются парами, и куртина читалась
     кустом-многоножкой. */
  const nC=Math.max(1,Math.round(16*gp*dens));
  const span=(tr.W-240)/nC;
  if(flora)for(let c=0;c<nC;c++){
    const lo=120+c*span;
    let cx=lo+r()*span;
    for(let t=0;t<2;t++){
      const alt=lo+r()*span;
      if(groundAt(tr,alt)>groundAt(tr,cx))cx=alt;      // ниже — значит лучше
    }
    const n=2+Math.floor(r()*6);
    const wide=Math.min(260,span*.9), step=wide/n;
    for(let i=0;i<n;i++){
      const x=clamp(cx-wide*.5+step*(i+.5)+(r()-.5)*step*.55,60,tr.W-60);
      /* место, а не только координата (M174): вид растёт по-разному в
         ложбине и на гребне, поэтому экземпляр получает сырость полосы и
         то, насколько эта точка ниже соседних. Считается по groundAt, без
         единого лишнего вызова r() — генерация полосы не сдвигается */
      const gy=groundAt(tr,x);
      const hollow=clamp((gy-(groundAt(tr,x-150)+groundAt(tr,x+150))*.5)/46*.5+.5,0,1);
      const pl=genPlant(r,p,x,gy,{wet,hollow});
      /* глубина: у куртины есть перед и зад. Дальние мельче и глуше, ближние
         крупнее и темнее — без этого все растения стоят на одной линии в один
         кислотный тон и читаются наклейками */
      /* ОТДЕЛЬНЫЙ поток: лишний вызов общего r() сдвигает всю последующую
         генерацию полосы — фауну, залежи, всё. Правило старое, а наступил на
         него всё равно: первый заход брал глубину из r() и уронил суite про
         комбинат, потому что мир под тестом стал другим. */
      pl.z=((hashi(Math.round(x),p.seed,0x2E5A)>>>7)&255)/255;
      plants.push(pl);
    }
  }
  /* дальние — первыми: иначе глубина не работает, чем бы её ни красили */
  plants.sort((a,b)=>(b.z||0)-(a.z||0));
  /* высаживаемся за пределами зоны взлёта (`shipZoneR`), иначе первое же ДЕЙСТВ
     отправляет обратно на орбиту вместо бурения */
  /* зверьё водится там же, где флора: ему есть что есть */
  const fauna=[];
  if(flora){
    const fs=faunaOf(p);
    const N=Math.round((10+Math.floor(r()*10))*gp);
    while(fauna.length<N){
      const sp=pickShare(fs,r);
      const x=120+r()*(tr.W-240);
      /* стайные ходят группой (M174): иначе слово «стайный» в имени такое же
         враньё, каким было всё остальное в старом имени вида */
      const n=sp.herd?2+Math.floor(r()*3):1;
      for(let k=0;k<n&&fauna.length<N;k++){
        const bx=clamp(x+(k?(r()-.5)*150:0),100,tr.W-100);
        fauna.push(specimenBeast(r,sp,bx,groundAt(tr,bx)));
      }
    }
  }
  /* вход в пещеру есть на каждой планете: раньше он выпадал с шансом .65, и
     игрок, обойдя пару планет без пещеры, решал, что механику убрали. Место
     по-прежнему случайное и далеко от корабля — дойти надо, а вот гадать,
     существует ли пещера в принципе, не надо: путь показывает навигатор сверху. */
  /* «далеко от корабля» до сих пор было только в этом комментарии: место
     бросалось по всей полосе и могло лечь на пятачок посадки. Там подсказка и
     ДЕЙСТВИЕ принадлежат кораблю (заложить базу / спуститься в неё), и пещера,
     выпав туда, становилась недоступной вовсе. Теперь отступ считается */
  let cmx=clamp(400+r()*(tr.W-800),150,tr.W-150);
  const keep=Math.max(300,(typeof shipZoneR==="function"?shipZoneR():90)*3);
  if(Math.abs(cmx-tr.padX)<keep){
    const right=tr.padX+keep, left=tr.padX-keep;
    cmx=right<=tr.W-150?right:(left>=150?left:clamp(right,150,tr.W-150));
  }
  const caveMouth={x:cmx};
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
  if(typeof traceAsk==="function")traceAsk();     // не оставил ли здесь знак другой живой человек (11ag)
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
  /* Имя планеты и её тип сюда не повторяем: они стоят в сводке места, у
     правой верхней кромки, и стоят там всё время, пока мы здесь. Пока приборы
     гасли до трети, дубль был незаметен; вернувшись наверх, сводка стала
     читаться — и на кадре оказалось, что игра дважды в одном экране называет
     одно и то же. Сообщение говорит только то, чего в сводке нет. */
  say("залежей: "+deposits.length+(sl?"\n"+sl:""),sl?320:150);
}
function updateSurface(dt){
  const S=G.surf,tr=S.tr,st=stat();
  const mv=.62*dt*(typeof kitStat==="function"?kitStat().walk:1)*(S.swim>0?1-.45*S.swim:1);   /* ботинки и вес (M152); в воде — вполсилы (M327) */
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
  /* пыльца из-под ног на сухих мирах (M232): клуб на каждый шаг — по нему
     видно и сам шаг, и что грунт сухой. Эфемерно, в сейв не пишется. */
  if(walking&&S.on){
    const stp=Math.floor(S.walkPhase/Math.PI);
    if(stp!==S.lastStep){
      S.lastStep=stp;
      const pw=S.p;
      if(pw&&(pw.T.atm==="отсутствует"||pw.T.atm.indexOf("разреженная")>=0||pw.type==="desert")){
        S.dust=S.dust||[];
        S.dust.push({x:S.x-S.face*2,t:G.t,f:S.face});
        if(S.dust.length>8)S.dust.shift();
      }
    }
  }
  /* следы: мир пешком не помнил, что по нему шли (G12). Пишем точку через
     каждые тринадцать пикселей пути по земле, храним полторы сотни. */
  if(walking&&S.on){
    S.tracks=S.tracks||[];
    if(S.lastTrackX==null||Math.abs(S.x-S.lastTrackX)>=13){S.tracks.push({x:S.x,t:G.t,f:S.face});S.lastTrackX=S.x;}
  }
  /* след уходит по возрасту, а не по счёту (M234): сотня с полтиной кончалась
     раньше, чем след успевал выцвести, и дальний конец тропы пропадал целой
     пачкой — автор увидел это как «следы мигают». Порог по счёту остаётся
     страховкой от бесконечного списка, но стоит выше времени жизни. */
  if(S.tracks&&S.tracks.length){
    while(S.tracks.length&&G.t-S.tracks[0].t>TRACK_LIFE)S.tracks.shift();
    while(S.tracks.length>260)S.tracks.shift();
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
    if(keys.thrust&&jetCanLift()&&jetKick()){S.vy=-1.6;S.on=false;S.jetOn=true;}
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
  /* чужой знак (11ag): его поднимают раньше всего прочего — он тут один и он
     разовый, а вырыть и просканировать можно и после */
  if(typeof traceNear==="function"){
    const t=traceNear(S,tr);
    if(t){
      G.prompt="ДЕЙСТВИЕ — ПОДНЯТЬ ЧУЖОЙ ЗНАК";
      if(actEdge){traceTake(t);return;}
    }
  }
  /* оставить свой (11ag): у корабля, где ничего другого не просят, и только
     если в трюме есть чем платить — след без цены превращается в доску объявлений */
  if(typeof traceCanLeave==="function"&&dShip<shipZoneR()&&!dep&&!poiNear(S,tr)&&!traceHere()){
    const g=traceCanLeave();
    if(g){
      G.prompt="ДЕЙСТВИЕ — ОСТАВИТЬ ЗНАК · "+RES[g.k].ru.toUpperCase()+" ×"+g.n;
      if(actEdge){traceLeave();return;}
    }
  }
  /* вход в пещеру проверяется раньше залежей и организмов: он редкий и разовый,
     а бурить и сканировать можно где угодно ещё */
  const atCave=!!(S.cave&&Math.abs(S.cave.x-S.x)<34);
  if(atCave){
    G.prompt="ДЕЙСТВИЕ — ВОЙТИ В ПЕЩЕРУ";
    if(actEdge){enterCave();return;}
    /* подсказку ниже перебивала цепочка «шахта / прыжок» (M327): ДЕЙСТВИЕ
       вело в пещеру, а на экране стояло «ЗАЛОЖИТЬ ШАХТУ». Обе ветки ниже
       уступают пещере — см. atCave у шахты и у последнего else */
  }
  /* дверь дома (M170): своя планета, своё крыльцо — и в дом можно войти */
  if(typeof homeDoorX==="function"&&homeHereP(S.p)){
    const hx=homeDoorX(tr,S.p);
    if(hx!=null&&Math.abs(hx-S.x)<38){
      G.prompt="ДЕЙСТВИЕ — ВОЙТИ ДОМОЙ";
      if(actEdge){enterHomeIn();return;}
    }
    /* грядка (M204): чуть в стороне от двери, чтобы не спорить с ней за
       ДЕЙСТВИЕ. Сеется то, что описано последним и ещё не посеяно */
    if(hx!=null&&typeof greenPrompt==="function"){
      const gx=hx+HOME_MAN*3.0;
      if(Math.abs(gx-S.x)<40){
        const gp=greenPrompt();
        if(gp){
          G.prompt=gp;
          if(actEdge&&typeof greenCanSow==="function"&&greenCanSow()){greenSow();return;}
        }
      }
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
  /* стена посёлка (M210): у дальнего конца полки, отдельным шагом от кормёжки.
     Стену спрашиваем только когда до неё дошли — один запрос на приход в место,
     как у следа и у почты, и ни одного на посадки мимо посёлка */
  else if(typeof wallDraw==="function"&&settleCanLive(S.p)&&
          (S._wallX===undefined?(S._wallX=settleWallHereX(S.p,tr)):S._wallX)!=null&&
          Math.abs(S.x-S._wallX)<30){
    wallAsk(WALL_S);
    const n=wallCount(WALL_S);
    if(wallCanSign(WALL_S)){
      G.prompt="ДЕЙСТВИЕ — ОСТАВИТЬ СВОЙ ЗНАК НА СТЕНЕ"+
        (n>0?"\nТУТ УЖЕ "+n+" "+pl3(n,"ЧУЖАЯ РУКА","ЧУЖИЕ РУКИ","ЧУЖИХ РУК"):(n===0?"\nСТЕНА ПУСТА":""));
      if(actEdge){wallSign(WALL_S);return;}
    }else if(n>0){
      /* расписался — больше сказать нечего, и просить нечего. Кнопки нет,
         строка есть: место должно уметь молчать, но не притворяться пустым */
      /* «1 РУК» — счёт без языка (плейтест 30.08.2026): числительное склоняется */
      G.prompt="СТЕНА ПОСЁЛКА · "+n+" "+pl3(n,"РУКА","РУКИ","РУК")+(wallHere(WALL_S)&&wallHere(WALL_S).mine?", СРЕДИ НИХ ВАША":"");
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
    /* «ОСМОТРЕНО · КРИСТАЛЛЫ / КРИСТАЛЛЫ ×7» — одно и то же слово дважды
       подряд: имя места и добыча совпадали, и подсказка читалась заиканием
       (скрин автора 30.08.2026). Место называем один раз. */
    const got=(memo&&memo.got)?String(memo.got):"";
    const same=got&&got.toLowerCase().indexOf(String(q.ru||"").toLowerCase())===0;
    G.prompt=memo
      ?("ОСМОТРЕНО · "+(same?got.toUpperCase()
                            :q.ru+(got?"\n"+got.toUpperCase():"")))
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
        /* что взял своими руками — то и можно разболтать у стойки (11aj) */
        if(!G.lastDig||G.lastDig.sx!==G.sx||G.lastDig.sy!==G.sy||
           G.lastDig.pi!==S.p.idx||G.lastDig.res!==dep.res)
          {G.lastDig={sx:G.sx,sy:G.sy,pi:S.p.idx,res:dep.res,n:0};
           if(typeof holdDeed==="function")holdDeed(G.sx,G.sy,"drill");}   /* дело системы (M291) */
        G.lastDig.n++;
        if(dep.left<=0)say("Залежь выработана\n"+RES[dep.res].ru);
      }
    }
  }else if(beast){
    G.prompt="ДЕЙСТВИЕ — СКАНИРОВАТЬ ЖИВОТНОЕ\n"+beast.name.toUpperCase();
    if(actEdge){
      /* существо подаёт голос: тембр из его же seed, у каждого свой */
      sfx("beast",{seed:beast.seed||hashi(beast.x|0,beast.r*100|0,7)});
      bioScan(beast,14);
    }
  }else if((S.fauna||[]).some(b=>b.scanned&&!b.caught&&Math.abs(b.x-S.x)<30)){
    /* космозоо (M164): отсканированного можно поймать — клетка занимает слот трюма */
    const cb=(S.fauna||[]).find(b=>b.scanned&&!b.caught&&Math.abs(b.x-S.x)<30);
    G.prompt="ДЕЙСТВИЕ — ПОЙМАТЬ\n"+cb.name.toUpperCase()+" · КЛЕТКА: −1 СЛОТ ТРЮМА";
    if(actEdge){zooCatch(cb);return;}
  }else if(plant){
    G.prompt="ДЕЙСТВИЕ — СКАНИРОВАТЬ ОРГАНИЗМ";
    if(actEdge){
      bioScan(plant,9);
      if(typeof glowScan==="function")glowScan(plant);   /* светящийся мох — товар (11i) */
    }
  }else if(dShip<shipZoneR()&&baseAt(G.sx,G.sy,S.p.idx)){
    /* шлюз базы стоит рядом с кораблём — вход тем же жестом, что в пещеру */
    G.prompt="ДЕЙСТВИЕ — СПУСТИТЬСЯ В БАЗУ";
    if(actEdge){enterBase(S.p);return;}
  }else if(dShip<shipZoneR()&&!baseAt(G.sx,G.sy,S.p.idx)&&S.p.type!=="gas"){
    G.prompt="ДЕЙСТВИЕ — ЗАЛОЖИТЬ БАЗУ · 2500 КР + 10 СПЛАВОВ";
    if(actEdge&&foundBase(S.p)){enterBase(S.p);return;}
  }else if(S.on&&!atCave){
    /* ── шахта у планеты одна, и теперь у неё есть адрес (M234) ──
       «Заложить» работало где угодно, а ствол под всеми точками был один и тот
       же: спустился в другом конце карты — и попал в свою же выработку. Автор
       сказал прямо: непонятно, где копал. Устье стоит на месте: рядом с ним —
       спуск, вдали — расстояние до него, и второй ствол не закладывается. */
    const mx=(typeof mineSpotX==="function")?mineSpotX(S.p):null;
    if(mx!=null&&Math.abs(mx-S.x)>=MINE_MOUTH_R){
      G.prompt="ШАХТА ЭТОЙ ПЛАНЕТЫ — "+Math.round(Math.abs(mx-S.x))+" м "+(mx>S.x?"▶":"◀")+
        "\nГЛУБИНА "+mineDeep(S.p)+" · ВТОРОЙ СТВОЛ НЕ ЗАКЛАДЫВАЮТ";
    }else{
      G.prompt=(mx!=null?("ДЕЙСТВИЕ — СПУСТИТЬСЯ В ШАХТУ · ГЛУБИНА "+mineDeep(S.p)):
                         "ДЕЙСТВИЕ — ЗАЛОЖИТЬ ШАХТУ · ВГЛУБЬ ПОРОДА БОГАЧЕ")+
        "\n▲ — ПРЫЖОК · ИЩИТЕ ЗАЛЕЖИ";
      if(actEdge){enterDig();return;}
    }
  }else if(dShip<shipZoneR()){
    G.prompt=(G.fuel<8?"НЕТ ТОПЛИВА · КНОПКА ВЗЛЁТА — ЭВАКУАЦИЯ":"КНОПКА ВЗЛЁТА — УДЕРЖАТЬ")+
      "\nТРЮМ "+held()+"/"+st.cargoMax+" · СКАФАНДР "+Math.round(S.suit)+"/"+suitMax()+(S.suit<suitMax()?" · ЗАРЯДКА":" · ГОТОВ");
  }else if(!atCave)G.prompt="▲ — ПРЫЖОК · ИЩИТЕ ЗАЛЕЖИ";
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
      /* подпись живёт в span: textContent на самой кнопке стирал <i> — полосу
         удержания, — и держать кнопку было нечем видно (M234) */
      const lab=lbtn.querySelector("span")||lbtn;
      const t=G.fuel<8?"ЭВАКУАЦИЯ":"ВЗЛЁТ";
      if(lab.textContent!==t)lab.textContent=t;
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
