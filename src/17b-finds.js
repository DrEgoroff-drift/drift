/* ══════════════ находки в полёте ══════════════
   Пункт 5 очереди графики: пространство между планетами пусто. Между звездой и
   поясом лететь было НЕ НА ЧТО СМОТРЕТЬ — там не случалось ничего, и минуты
   перелёта игрок просто пережидал.

   Четыре находки, и все четыре — на уже готовой машинерии: подход и осмотр
   ровно такие же, как у остова баржи (12l), награды берутся из `POI_FIND` (20b)
   и `rareTake` (12m). Пятой системы здесь нет и не заводится.

   Одна из четырёх — их. Мёртвый спутник «Долгого Хода» продолжает передавать в
   пустоту, и это единственная находка, которая несёт кусок отчёта (12q): он
   даёт не вещь, а ПЕЛЕНГ — адрес, по которому можно лететь.

   Находка детерминирована ключом системы и грубым бакетом времени: перезаход в
   систему не крутит барабан, а вернувшись через сутки, вы застанете другое.
   Взятое помнится (`G.findsSeen`) и не возвращается никогда. */
const FIND_BUCKET=6*3600*1000;      /* шесть часов: не автомат, но и не навсегда */
function findBucket(){return Math.floor(Date.now()/FIND_BUCKET);}
const FIND_KINDS={
  sos: {ru:"сигнал бедствия",  col:"#ff6b57",act:"ПРИНЯТЬ СИГНАЛ"},
  sat: {ru:"спутник",          col:"#f2b25c",act:"СНЯТЬ ЗАПИСЬ"},
  cont:{ru:"контейнер",        col:"#7fe6d8",act:"ЗАБРАТЬ ГРУЗ"},
  hulk:{ru:"остов разведчика", col:"#a8b4c0",act:"ОБЫСКАТЬ"},
  echo:{ru:"отражение",        col:"#9fb7ff",act:"СЛУШАТЬ"}    /* зеркало, 11f */
};
const FIND_CACHE={};
function findsIn(sys){
  if(!sys)return [];
  const key=sys.key+"|"+findBucket();
  if(FIND_CACHE.key===key)return FIND_CACHE.list;
  const r=rng(hashi(sys.seed|0,findBucket(),0xF1D5));
  const d=sysDanger(sys.sx,sys.sy);
  /* сколько находок: чаще ноль или одна. Пустая система — это правильно, иначе
     находка перестаёт быть находкой */
  const n=r()<.42?0:(r()<.78?1:2);
  const list=[];
  for(let i=0;i<n;i++){
    /* спутник встречается реже прочего и тем чаще, чем дальше от центра: их
       линия шла на окраину */
    const q=r();
    const k=q<.18+d*.22?"sat":(q<.46?"cont":(q<.74?"hulk":"sos"));
    const a=r()*TAU, rad=700+r()*2100;
    list.push({i,k,seed:hashi(sys.seed|0,i*97+findBucket(),0x5EE),
      x:Math.cos(a)*rad,y:Math.sin(a)*rad,
      id:sys.key+":"+findBucket()+":"+i});
  }
  /* зеркало (11f): в ядре области лежит само зеркало, вне барабана */
  const mf=(typeof mirrorFind==="function")?mirrorFind(sys):null;
  if(mf)list.push(mf);
  FIND_CACHE.key=key;FIND_CACHE.list=list;
  return list;
}
function findsHere(){return findsIn(G.sys);}
function findSeen(f){return !!(G.findsSeen&&G.findsSeen[f.id]);}
/* ── что даёт находка ──
   Три обычные платят той же монетой, что и весь остальной мир: часть, сырьё,
   топливо, редкость. Спутник платит куском отчёта и пеленгом. */
function findTake(f){
  if(f.k==="echo")return mirrorListen(f);     /* зеркало не берётся (11f) */
  if(!G.findsSeen)G.findsSeen={};
  G.findsSeen[f.id]=1;
  const r=rng(hashi(f.seed,0x7A1,3)),d=sysDanger(G.sx,G.sy);
  /* паспорт находки (M152e): сама вещь уходит в трюм, как прежде, а её бумага —
     на стол. Бумагу можно сдать институту за четверть (запись в книжку) или
     продать с рук на блошинце за всю цену — две дороги с одной находки */
  /* книга попадается и в контейнере: там она лежит между накладными (M202) */
  if(f.k==="cont"&&typeof bookRoll==="function")bookRoll(f.seed,"из контейнера",0.24);
  if((f.k==="sat"||f.k==="cont"||f.k==="hulk")&&typeof thingAdd==="function"){
    const val=Math.round((f.k==="hulk"?900:f.k==="sat"?700:420)*(1+d*.8)/10)*10;
    const ru=f.k==="hulk"?"Хулк":f.k==="sat"?"Спутник":"Контейнер";
    thingAdd("find",ru+" · сектор "+G.sx+":"+G.sy,"находка · сдать институту за "+Math.round(val/4)+" кр или продать с рук на блошинце за "+val+" кр",{val,find:f.k});
  }
  if(f.k==="sat"){
    /* спутник «Долгого Хода»: место у зарубки своё, поэтому кусок берётся по
       адресу этой находки, а не по планетному POI */
    const R=typeof loreTake==="function"?loreTake("sat:"+f.id):null;
    if(R){
      /* Спутник передаёт не текст, а ПЕЛЕНГ: кусок отчёта может достаться
         любой — словом, ценами, замерами, — но сама передача всегда указывает
         куда-то. Без этого находка иногда оказывалась строчкой в журнале, по
         которой некуда лететь, а «слушать пустоту» ради строчки не стоит. */
      const A=typeof loreAddr==="function"?loreAddr(hashi(f.seed,0xBEA5,11)):null;
      if(A){
        loreMarks().push({sx:A.sx,sy:A.sy,id:"sat:"+f.id});
        tell("tech","Пеленг спутника: сектор "+A.sx+":"+A.sy,
             "Спутник передаёт в пустоту\nпеленг: сектор "+A.sx+":"+A.sy+
             (A.s.station?"\nстанция «"+A.s.station.name+"»":"")+"\nметка на карте");
      }
      return null;                    /* loreTake уже сказал всё остальное */
    }
    /* все куски этой главы собраны — спутник отдаёт то, чем он и был: приборы */
    const n=2+Math.floor(r()*4);
    return addRes("techcomp",n)?("приборы спутника: техкомпоненты ×"+n)
                               :"приборы снять некуда — трюм полон";
  }
  if(f.k==="cont"){
    const KS=TRADE_KEYS.filter(k=>k!=="ice");
    const k=KS[Math.floor(r()*KS.length)],n=4+Math.floor(r()*9+d*6);
    if(typeof rareTake==="function")rareTake("cont",hashi(f.seed,0x2A2E,5));
    return addRes(k,n)?(RES[k].ru.toLowerCase()+" ×"+n):"трюм полон — груз остался дрейфовать";
  }
  if(f.k==="hulk"){
    /* вещи покойника (M116): один раз за прохождение в остове находится живое —
       так игрок узнаёт, что покойник был, раньше, чем узнаёт, кто он.
       Броска здесь нет намеренно: остов и сам редкость, а питомец, который
       достаётся половине прохождений, — это не механика, а лотерея. Первый
       вскрытый остов отдаёт птицу всегда. */
    if(typeof parrotFind==="function"&&!parrotHas()){
      const who="борта «"+genName(rng(hashi(f.seed,0xDEAD,3)))+"»";
      if(parrotFind(hashi(f.seed,0xB13D,5),who))return "в вещах нашлось живое";
    }
    const F=POI_FIND.wreck;
    const got=F&&typeof F.give==="function"?F.give(r,d):"часть с обломков";
    if(typeof rareTake==="function")rareTake("hulk",hashi(f.seed,0x2A2E,9));
    if(typeof kitFromHulk==="function")kitFromHulk(f.seed);   /* чужая вещь комплекта (M152) */
    if(typeof bookRoll==="function")bookRoll(f.seed,"из остова",0.40);   /* книга (M202) */
    return got;
  }
  /* сигнал бедствия: живой человек, а не склад. Платит тем, что у него есть, —
     благодарностью, которая в этой игре называется репутацией, и остатком
     топлива из бака спасательной капсулы */
  const st=stat(),fu=Math.min(Math.round(st.fuelMax*.25),Math.round(st.fuelMax-G.fuel));
  if(fu>0)G.fuel+=fu;
  if(typeof repAdd==="function")repAdd(2,G.sys);
  return "экипаж подобран"+(fu>0?" · топливо ×"+fu:"")+" · о вас здесь будут помнить";
}
/* планета (или луна), у которой уже разрешена посадка: 110 единиц от
   поверхности — тот же порог, по которому её предлагает `17-mode-system` */
function findLandingNear(sh){
  const sys=G.sys;if(!sys)return false;
  for(const p of sys.planets){
    if(Math.hypot(sh.x-p.x,sh.y-p.y)-p.radius<110)return true;
    for(const m of p.moons)if(Math.hypot(sh.x-m.x,sh.y-m.y)-m.radius<110)return true;
  }
  return false;
}
function findInteract(sh){
  const list=findsHere();
  if(!list.length)return false;
  let near=null,nd=1e9;
  for(const f of list){const d=Math.hypot(sh.x-f.x,sh.y-f.y);if(d<nd){nd=d;near=f;}}
  if(!near||nd>240)return false;
  const K=FIND_KINDS[near.k];
  /* ── пустая находка не держит ДЕЙСТВИЕ ──
     Плейтест 30.08.2026: «поймал сигнал бедствия, мимо пролетает планета, а
     сесть нельзя: пишет, что сигнал бедствия уже взят». Находка перехватывала
     подсказку в радиусе 240 единиц и возвращала «занято» ДАЖЕ КОГДА ПРЕДЛОЖИТЬ
     ЕЙ БЫЛО НЕЧЕГО, а проверка планеты стоит ниже по списку — до неё просто не
     доходило. Осмотренная теперь только подписывается и уступает: она уже
     ничего не даст, а планета даёт всё.
     И даже НЕосмотренная уступает планете, у которой уже можно садиться: она
     никуда не денется, её видно в кадре и она подписана, — а посадка это то,
     ради чего сюда летели, и отгонять корабль от планеты ради разрешения
     сесть игрок не обязан. */
  if(findSeen(near)){
    if(!G.prompt)G.prompt=K.ru.toUpperCase()+" · УЖЕ ОСМОТРЕН";
    return false;
  }
  if(findLandingNear(sh)){
    if(!G.prompt)G.prompt=K.ru.toUpperCase()+" РЯДОМ";
    return false;
  }
  G.prompt=K.ru.toUpperCase()+"\nДЕЙСТВИЕ — "+K.act;
  if(actEdge){
    const got=findTake(near);
    if(got)tell("tech",K.ru[0].toUpperCase()+K.ru.slice(1)+": "+got,
                K.ru[0].toUpperCase()+K.ru.slice(1)+"\n"+got);
    /* находка может нести строку чужой истории (11c) */
    const sl=(typeof storyFindLine==="function")?storyFindLine(near.k):null;
    if(sl){logAdd("dim",sl);say(sl,260);}
    if(typeof saveGame==="function")saveGame(true);
  }
  return true;
}
/* ── находки на кадре ──
   Правило «много кусков — одно тело»: сперва тёмная масса, всё навесное внутрь
   обвода, один свет последним. Четыре силуэта опознаются с расстояния, потому
   что различаются формой, а не подписью: капсула, коробка с крыльями панелей,
   ящик, переломленный корпус. Подпись — только пока не осмотрено. */
function drawFindsSystem(zx,zy,Z){
  const list=findsHere();
  if(!list.length)return;
  for(const f of list){
    const x=zx(f.x),y=zy(f.y);
    if(x<-70||x>W+70||y<-70||y>H+70)continue;
    const K=FIND_KINDS[f.k],taken=findSeen(f);
    const s=clamp(Z,.5,1.5);
    ctx.save();ctx.translate(x,y);ctx.scale(s,s);
    const spin=(f.seed%628)/100+G.t*.002*((f.seed&1)?1:-1);
    ctx.rotate(spin);
    ctx.fillStyle="rgba(22,25,31,.96)";ctx.strokeStyle="rgba(0,0,0,.55)";ctx.lineWidth=.9;
    if(f.k==="sos"){
      /* спасательная капсула: короткое тело с иллюминатором */
      ctx.beginPath();ctx.ellipse(0,0,13,7,0,0,TAU);ctx.fill();ctx.stroke();
      ctx.fillStyle="rgba(60,70,84,.9)";
      ctx.beginPath();ctx.ellipse(4,0,3.4,3.4,0,0,TAU);ctx.fill();
      ctx.strokeStyle="rgba(80,92,108,.8)";
      ctx.beginPath();ctx.moveTo(-13,0);ctx.lineTo(-19,0);ctx.stroke();
    }else if(f.k==="sat"){
      /* спутник: коробка приборов и две панели — силуэт, который ни с чем
         не спутать даже точкой */
      ctx.beginPath();ctx.rect(-6,-5,12,10);ctx.fill();ctx.stroke();
      ctx.fillStyle="rgba(34,44,60,.95)";
      ctx.beginPath();ctx.rect(-22,-3.4,14,6.8);ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.rect(8,-3.4,14,6.8);ctx.fill();ctx.stroke();
      ctx.strokeStyle="rgba(70,84,104,.7)";ctx.lineWidth=.6;
      for(let i=1;i<4;i++){
        ctx.beginPath();ctx.moveTo(-22+i*3.5,-3.4);ctx.lineTo(-22+i*3.5,3.4);
        ctx.moveTo(8+i*3.5,-3.4);ctx.lineTo(8+i*3.5,3.4);ctx.stroke();
      }
      /* тарелка: она и передаёт */
      ctx.fillStyle="rgba(48,58,72,.95)";
      ctx.beginPath();ctx.arc(0,-9,4.2,Math.PI,TAU);ctx.fill();
    }else if(f.k==="cont"){
      /* Ящик, а не панель. В первом кадре контейнер был прямоугольником в
         клетку и путался с крылом спутника: два разных предмета читались одной
         фигурой. Отличает его толщина и торцы — то, чем ящик и отличается от
         листа: тяжёлые оковки по краям и одна стяжка поперёк. */
      ctx.beginPath();ctx.rect(-15,-9,30,18);ctx.fill();ctx.stroke();
      ctx.fillStyle="rgba(38,42,50,.98)";
      ctx.fillRect(-17,-10,5,20);ctx.fillRect(12,-10,5,20);
      ctx.strokeStyle="rgba(0,0,0,.5)";
      ctx.strokeRect(-17,-10,5,20);ctx.strokeRect(12,-10,5,20);
      ctx.strokeStyle="rgba(96,110,126,.65)";ctx.lineWidth=1.4;
      ctx.beginPath();ctx.moveTo(-12,-2);ctx.lineTo(12,-2);ctx.stroke();
    }else if(f.k==="echo"){
      /* зеркало (11f): тонкая пластина ребром, почти ничего — поверхность, а не
         предмет. Блик один, и он не горит, а скользит */
      ctx.beginPath();ctx.ellipse(0,0,26,3.2,0,0,TAU);ctx.fill();ctx.stroke();
      ctx.strokeStyle="rgba(159,183,255,.55)";ctx.lineWidth=.8;
      const gl=((G.t*.01)%1)*52-26;
      ctx.beginPath();ctx.moveTo(gl-6,-1.2);ctx.lineTo(gl+6,-1.2);ctx.stroke();
    }else{
      /* остов разведчика: тот же язык, что у остова баржи, но мельче и с
         отломанным крылом */
      ctx.beginPath();
      ctx.moveTo(-20,-4);ctx.lineTo(-2,-7);ctx.lineTo(17,-4);ctx.lineTo(19,2);
      ctx.lineTo(-3,5);ctx.lineTo(-18,4);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.moveTo(24,3);ctx.lineTo(33,-2);ctx.lineTo(31,6);ctx.closePath();ctx.fill();
    }
    ctx.restore();
    if(taken)continue;
    /* один свет на находку: маяк своего цвета. Спутник ещё и «говорит» —
       кольцо передачи расходится в пустоту, которую никто не слушает */
    const bl=Math.pow(Math.max(0,Math.sin(G.t*.045+f.seed)),8);
    if(bl>.02){
      ctx.fillStyle=K.col;
      ctx.globalAlpha=.9*bl;
      ctx.beginPath();ctx.arc(x,y-11*s,2.2,0,TAU);ctx.fill();
      ctx.globalAlpha=1;
    }
    if(f.k==="sat"){
      const ph=(G.t*.012+f.seed%10)%1;
      ctx.strokeStyle="rgba(242,178,92,"+(.30*(1-ph)).toFixed(3)+")";ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(x,y,14+ph*46,0,TAU);ctx.stroke();
    }
    ctx.fillStyle=K.col;ctx.globalAlpha=.75;
    ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
    ctx.fillText(K.ru.toUpperCase(),x,y+24*s);
    ctx.globalAlpha=1;
  }
}
