/* ══════════════ автотесты: дорожный спутник (M168, M168b) ══════════════ */
TEST_SUITES.push(()=>suite("дорога: километры — в кредиты живым счётчиком, комбо растёт и сгорает",()=>{
  resetWorld();
  G.road=null;G.credits=600;
  RD={crFrac:0};
  ok(!roadSpeedOk(1)&&roadSpeedOk(90)&&roadSpeedOk(299)&&roadSpeedOk(850)&&!roadSpeedOk(1200),"скорость фильтруется: 3–1000 км/ч");
  /* градации: машина, поезд, самолёт */
  eq(roadTier(90),1,"90 км/ч — ДОРОГА");
  eq(roadTier(199),1,"199 — ещё машина");
  eq(roadTier(250),2,"250 — ЭКСПРЕСС: поезд");
  eq(roadTier(400),2,"400 — всё ещё поезд");
  eq(roadTier(850),3,"850 — ГИПЕРДРАЙВ: самолёт");
  eq(roadTier(1200),0,"1200 — не верим");
  ok(Math.abs(roadLightFrac(850)-.787)<.01,"850 км/ч после ×1e6 — 0.79 световой: "+roadLightFrac(850).toFixed(2));
  eq(roadCosmic(90),25000,"90 км/ч ×1 000 000 → 25 000 км/с");
  /* комбо: старт ×1, двадцать минут хода — ×3, дальше не растёт */
  eq(roadCombo(0),1,"комбо со старта ×1");
  ok(Math.abs(roadCombo(300)-1.5)<.01,"пять минут хода — ×1.5");
  eq(roadCombo(ROAD_COMBO_T),3,"двадцать минут хода — ×3");
  eq(roadCombo(9000),3,"выше ×3 не бывает");
  /* заработок: 5 км на ×1 — 10 кр; на ×3 — 30 кр */
  const c0=G.credits;
  roadEarnKm(5,0);
  eq(G.credits-c0,5*ROAD_CR_KM,"5 км по ставке — "+(5*ROAD_CR_KM)+" кр");
  eq(roadAll().cr,5*ROAD_CR_KM,"счётчик дня совпадает");
  roadEarnKm(5,ROAD_COMBO_T);
  eq(G.credits-c0,5*ROAD_CR_KM*4,"те же 5 км на ×3 — втрое сверху");
  /* запас конечен: из пустого бака не капает */
  roadEarnKm(100000,0);
  ok(roadAll().bank<1,"бак вычерпан: "+roadAll().bank.toFixed(2));
  const c1=G.credits;roadEarnKm(50,0);
  eq(G.credits,c1,"из пустого бака не капает");
  /* назавтра заново: день календарный, поэтому двигаем отметку дня, а не G.t */
  roadAll().day=-1;roadAll().bank=999;roadAll().total=0;   /* ранг здесь ни при чём: проверяем смену дня */
  RD.crFrac=0;roadEarnKm(1,0);
  eq(roadAll().cr,ROAD_CR_KM,"новый день — новый счёт");
  /* сохранение */
  const s=snapshot();G.road=null;applySave(JSON.parse(JSON.stringify(s)));
  ok(roadAll().day>=0,"дорога пережила сохранение");
  RD=null;G.road=null;
}));

TEST_SUITES.push(()=>suite("дорога: настроение музыки — цвет, тишина — своё дыхание, бит — звёзды",()=>{
  resetWorld();
  G.road=null;
  RD={energy:.2,bright:.5,avg:.1,beat:0,beatT:0,wave:new Array(28).fill(.2),sparks:[],pulses:[],an:null,eq:null,kmh:0};
  /* без микрофона волна дышит сама и не дребезжит нулями */
  roadAudio(1);roadAudio(1.5);
  ok(RD.wave.every(v=>v>0&&v<1),"волна живая без микрофона");
  const h1=roadMoodHue();
  RD.energy=.9;RD.bright=.9;
  const h2=roadMoodHue();
  ok(Math.abs(h1-h2)>20,"настроение меняет цвет: "+Math.round(h1)+"° → "+Math.round(h2)+"°");
  ok(isFinite(roadRgbHue(hex2rgb(shipData(G.shipId).col))),"личный цвет — цвет корпуса — вмешан");
  RD=null;
}));

TEST_SUITES.push(()=>suite("дорога: экран, разгон и тормоз на корпусе, закрытие подводит итог",()=>{
  resetWorld();
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  G.road=null;G.credits=600;G.record=null;
  roadOpen();
  ok(document.getElementById("roadwin").classList.contains("open"),"экран открыт");
  RD.kmh=90;RD.accT=.8;
  drawRoad(1000);drawRoad(1032);drawRoad(1064);
  ok(RD.acc>0,"разгон дошёл до корпуса: "+RD.acc.toFixed(2));
  RD.accT=-.8;for(let i=0;i<24;i++)drawRoad(1100+i*33);
  ok(RD.acc<0,"тормоз дошёл до корпуса: "+RD.acc.toFixed(2));
  const cv=document.getElementById("roadcv");
  /* корпус ездит по вертикали: разгон тянет его вверх, тормоз вниз (M168e).
     Поэтому проба берётся ВОКРУГ его нынешнего места, а не вокруг середины
     экрана — иначе тест проверяет пустое небо над затормозившим кораблём */
  const cy=Math.floor(cv.height*.5+(RD.yOff||0));
  const y0=clamp(cy-60,0,cv.height-1), hh=Math.min(120,cv.height-y0);
  const px=cv.getContext("2d").getImageData(Math.floor(cv.width*.5)-4,y0,8,hh).data;
  let lit=0;for(let i=0;i<px.length;i+=4)if(px[i]+px[i+1]+px[i+2]>60)lit++;
  ok(lit>0,"корпус нарисован");
  RD.moveT=100;roadEarnKm(3,RD.moveT);
  roadClose();
  ok(!document.getElementById("roadwin").classList.contains("open"),"экран закрыт");
  eq(RD,null,"датчики отпущены");
  ok(recordAll().e.some(x=>x.a==="дорога"&&/командировочные/.test(x.s)),"итог — командировочными в книжку");
  G.road=null;
}));

TEST_SUITES.push(()=>suite("дорога: кривой держатель снят автонулём, поворот меряется рысканием",()=>{
  resetWorld();
  G.road=null;
  const G0=9.80665;
  /* лента синтетических событий датчика: держатель стоит как задано, машина
     едет как задано. Пятьдесят миллисекунд на событие — двадцать герц */
  const feed=(n,v,rot)=>{for(let i=0;i<n;i++)roadOnShake({interval:50,
    accelerationIncludingGravity:{x:v[0],y:v[1],z:v[2]},rotationRate:rot||null});};
  const mount=deg=>{const a=deg*Math.PI/180;return [-G0*Math.sin(a),G0*Math.cos(a),0];};
  const push=(base,deg,acc)=>{const a=deg*Math.PI/180;return [base[0]+acc*Math.cos(a),base[1]+acc*Math.sin(a),base[2]];};
  const start=kmh=>{RD={kmh,shake:0,kick:0,turn:0,turnT:0,g0:null,g0T:0};};
  /* ── ровный держатель, прямая дорога ── */
  start(60);feed(120,mount(0));
  ok(Math.abs(RD.turnT)<.03,"ровно и прямо — поворота нет: "+RD.turnT.toFixed(3));
  /* ── скошенный на 15°: 9.81·sin15° = 2.54 м/с², это 0.26 g — БОЛЬШЕ, чем
     стоит спокойный городской поворот. Без автонуля корпус висел бы у края ── */
  start(60);feed(120,mount(15));
  ok(Math.abs(RD.turnT)<.06,"перекос 15° снят автонулём: "+RD.turnT.toFixed(3));
  start(60);feed(120,mount(-25));
  ok(Math.abs(RD.turnT)<.06,"перекос -25° снят автонулём: "+RD.turnT.toFixed(3));
  /* ── и на этом же кривом держателе настоящий поворот виден целиком ──
     левый поворот: поперечное смотрит влево, корпус уходит НАПРАВО */
  start(60);feed(120,mount(15));
  feed(20,push(mount(15),15,-.30*G0));
  ok(RD.turnT>.9,"поворот 0.30 g на кривом держателе — полный отброс: "+RD.turnT.toFixed(2));
  feed(20,push(mount(15),15,+.30*G0));
  ok(RD.turnT<-.9,"в другую сторону — симметрично: "+RD.turnT.toFixed(2));
  /* ── база не учится в повороте: полминуты дуги не должны её «съесть» ── */
  start(60);feed(120,mount(0));
  feed(600,push(mount(0),0,-.30*G0));
  ok(RD.turnT>.9,"тридцать секунд дуги — поворот не съеден базой: "+RD.turnT.toFixed(2));
  /* ── одно рыскание, без поперечного: гироскоп считает по a=v·ω ──
     100 км/ч и 4°/с — дуга шоссе: 27.8·0.0698 = 1.94 м/с², две трети шкалы */
  start(100);feed(120,mount(0));
  feed(20,mount(0),{alpha:0,beta:0,gamma:4});
  ok(RD.turnT>.5&&RD.turnT<.95,"дуга шоссе по гироскопу — корпус вправо: "+RD.turnT.toFixed(2));
  /* ── мёртвая зона: подруливание и швы асфальта корпус не двигают ── */
  start(60);feed(120,mount(0));
  feed(20,push(mount(0),0,.03*G0));
  eq(RD.turnT,0,"0.03 g — мёртвая зона, корпус стоит");
  /* ── телефон лёг набок: экранная ось X у вертикали, гироскопа нет —
     честно молчим, а не выдумываем поворот ── */
  start(60);feed(120,[G0*.9,0,0]);
  ok(RD.blind,"ось X у вертикали и без гироскопа — поворот не читается");
  /* ── а с гироскопом та же поза читается: рысканию всё равно, как воткнут ── */
  start(60);feed(120,[G0*.9,0,0],{alpha:0,beta:0,gamma:0});
  feed(20,[G0*.9,0,0],{alpha:0,beta:20,gamma:0});
  ok(!RD.blind&&Math.abs(RD.turnT)>.3,"лежащий набок телефон: поворот берётся с гироскопа: "+RD.turnT.toFixed(2));
  /* ── тряска: ровный асфальт не держит её в полке, яма даёт удар ── */
  start(60);feed(120,mount(0));
  for(let i=0;i<60;i++)feed(1,[Math.sin(i)*.25,G0+Math.cos(i*1.7)*.25,0]);
  ok(RD.shake<.2,"ровный ход — тряска почти ноль: "+RD.shake.toFixed(2));
  feed(3,[0,G0+5,0]);
  ok(RD.kick>0,"яма даёт удар: "+RD.kick.toFixed(2));
  RD=null;G.road=null;
}));

TEST_SUITES.push(()=>suite("дорога: микрофон отдельным согласием — иначе Android Auto глушит музыку",()=>{
  resetWorld();
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  G.road=null;
  const b=document.getElementById("roadSense");
  roadOpen();
  eq(b.textContent,"РАЗРЕШИТЬ ДАТЧИКИ","до согласия кнопка просит датчики");
  /* датчики берут GPS, движение и Wake Lock — и НЕ трогают микрофон: голова
     машины видит открытый захват и решает, что идёт разговор */
  roadSensorsOn();
  eq(RD.an,null,"датчики микрофон не открывают");
  eq(RD.stream,undefined,"и потока нет");
  eq(b.textContent,"СЛУШАТЬ МУЗЫКУ","кнопка называет следующее действие");
  ok(!roadAll().mic,"по умолчанию микрофона нет");
  /* включённым он помнится и гасится одним нажатием прямо на ходу */
  RD.an={};RD.stream=null;roadAll().mic=1;roadSenseBtn();
  eq(b.textContent,"ВЫКЛЮЧИТЬ МИКРОФОН","когда слушает — кнопка гасит");
  roadMicOff();
  eq(RD.an,null,"погашен");
  eq(roadAll().mic,0,"и выбор запомнен");
  eq(b.textContent,"СЛУШАТЬ МУЗЫКУ","кнопка вернулась к предложению");
  /* выбор переживает сохранение вместе с остальной дорогой */
  roadAll().mic=1;
  const s=snapshot();G.road=null;applySave(JSON.parse(JSON.stringify(s)));
  eq(roadAll().mic,1,"выбор про микрофон пережил сохранение");
  roadAll().mic=0;
  roadClose();
  G.road=null;
}));

TEST_SUITES.push(()=>suite("дорога: тихий сырой микрофон нормируется, гарнитуру не берём, тормоз видно",()=>{
  resetWorld();
  G.road=null;
  /* ── программное автоусиление: сырой захват тихий, но музыка должна дышать ──
     эмулируем анализатор: тихий фон 14/255, каждый тридцатый кадр — всплеск ×3 */
  RD={energy:.1,bright:.5,avg:.1,beat:0,beatT:0,pk:0,wave:new Array(28).fill(.2),
      sparks:[],pulses:[],kmh:60,eq:new Uint8Array(128),an:null};
  let n=0;
  RD.an={getByteFrequencyData:a=>{n++;const v=n%30===0?46:14;for(let i=0;i<a.length;i++)a[i]=v;}};
  for(let i=0;i<600;i++)roadAudio(i/60);
  ok(RD.energy>.35,"тихий микрофон, а энергия дышит: "+RD.energy.toFixed(2));
  ok(RD.beatT>0,"бит пробился сквозь тихий уровень");
  /* ── выбор микрофона: гарнитура Bluetooth глушит музыку всей машине ── */
  const list=[
    {kind:"audioinput",deviceId:"default",label:"По умолчанию — Car Bluetooth Handsfree"},
    {kind:"audioinput",deviceId:"bt1",label:"Car Multimedia Bluetooth hands-free"},
    {kind:"audioinput",deviceId:"ph1",label:"Микрофон телефона (нижний)"},
    {kind:"videoinput",deviceId:"cam",label:"Камера"}];
  eq(roadMicPick(list,"Car Multimedia Bluetooth hands-free"),"ph1","с гарнитуры уходим на телефонный");
  eq(roadMicPick(list,"Микрофон телефона (нижний)"),null,"телефонный не трогаем");
  eq(roadMicPick([{kind:"audioinput",deviceId:"bt1",label:"BT headset"}],"BT headset"),null,
     "если кроме гарнитуры ничего нет — остаёмся на ней");
  /* ── тормоз видно: два холодных факела от носа ── */
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  roadOpen();
  if(RD.raf)cancelAnimationFrame(RD.raf);RD.raf=0;
  RD.kmh=0;RD.shake=0;
  const cv=document.getElementById("roadcv"),cc=cv.getContext("2d");
  const hh=hullOf(G.shipId),scK=Math.min(cv.width/(hh.bw*5.2),cv.height/(hh.len*2.4))*.46;
  const probe=()=>{
    const y0=Math.max(0,Math.floor(cv.height*.5-hh.nose*scK-cv.height*.12)),
          y1=Math.floor(cv.height*.5-hh.nose*scK*.45);
    const d=cc.getImageData(Math.floor(cv.width*.5)-70,y0,140,Math.max(4,y1-y0)).data;
    let lit=0;for(let i=0;i<d.length;i+=4)if(d[i]+d[i+1]+d[i+2]>150)lit++;
    return lit;
  };
  RD.acc=0;RD.accT=0;drawRoad(5000);drawRoad(5000.02);
  const base=probe();
  RD.acc=-1;RD.accT=-1;drawRoad(5000.04);
  const braked=probe();
  ok(braked>base+30,"тормозные факелы у носа зажглись: "+base+" → "+braked);
  /* рекорд поездки пишется из GPS */
  roadOnPos({coords:{latitude:55.7,longitude:37.6,speed:16.7,accuracy:5},timestamp:1000});
  roadOnPos({coords:{latitude:55.701,longitude:37.6,speed:25,accuracy:5},timestamp:6000});
  ok(RD.vmax>80,"макс скорость поездки записана: "+Math.round(RD.vmax)+" км/ч");
  roadClose();
  G.road=null;
}));

TEST_SUITES.push(()=>suite("дорога: сияние «моей волны» снизу — разноцветное и дышит музыкой",()=>{
  resetWorld();
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  G.road=null;
  roadOpen();
  if(RD.raf)cancelAnimationFrame(RD.raf);RD.raf=0;
  RD.asked=1;RD.kmh=60;RD.shake=0;
  /* громкая музыка с битом через фальшивый анализатор */
  let n=0;RD.eq=new Uint8Array(128);
  RD.an={getByteFrequencyData:a=>{n++;const v=(n%24<5)?46:18;
    for(let i=0;i<a.length;i++)a[i]=Math.max(0,v-i*.15+8*Math.sin(n*.05+i*.4));}};
  let ts=1000;for(let i=0;i<420;i++){ts+=16.7;drawRoad(ts);}
  ok(RD.energy>.4,"энергия набрана: "+RD.energy.toFixed(2));
  const cv=document.getElementById("roadcv"),cc=cv.getContext("2d");
  const y0=Math.floor(cv.height*.86),hh=Math.floor(cv.height*.08);
  const d=cc.getImageData(0,y0,cv.width,hh).data;
  let lit=0,fam={r:0,g:0,b:0};
  for(let i=0;i<d.length;i+=32){
    const r=d[i],g=d[i+1],b=d[i+2],mx=Math.max(r,g,b),mn=Math.min(r,g,b);
    if(mx>70&&mx-mn>25){lit++;
      if(r===mx)fam.r++;else if(g===mx)fam.g++;else fam.b++;}
  }
  ok(lit>60,"низ горит цветным сиянием: "+lit);
  const fams=(fam.r>8?1:0)+(fam.g>8?1:0)+(fam.b>8?1:0);
  ok(fams>=2,"цветов несколько, а не один: r/g/b = "+fam.r+"/"+fam.g+"/"+fam.b);
  roadClose();
  G.road=null;
}));

/* ══════════════ девятый проход (M168k) ══════════════ */
TEST_SUITES.push(()=>suite("дорога: тон по кругу — палитра не сползает в зелень",()=>{
  resetWorld();
  /* смешивание по короткой дуге, а не по числовой прямой */
  ok(Math.abs(roadHueMix(350,10,.5)-0)<.01||Math.abs(roadHueMix(350,10,.5)-360)<.01,
    "350 и 10 в среднем дают 0, а не 180: "+roadHueMix(350,10,.5).toFixed(1));
  ok(Math.abs(roadHueMix(10,350,.5)-0)<.01||Math.abs(roadHueMix(10,350,.5)-360)<.01,
    "и в обратную сторону так же: "+roadHueMix(10,350,.5).toFixed(1));
  eq(Math.round(roadHueMix(200,260,0)),200,"с нулевой долей остаётся своё");
  eq(Math.round(roadHueMix(200,260,1)),260,"с полной — чужое");
  /* и главное: путь настроения НИКОГДА не проходит через зелень. До M168k
     горячий край считался как 320−280·bright, и на ярком треке дорога вела
     190→40 напрямую — через 150 и 100. Небо было салатовым при любой музыке. */
  let worst=null;
  for(let b=0;b<=10;b++)for(let e=0;e<=20;e++){
    const h=roadMoodPath(e/20,b/10);
    if(h>50&&h<185&&(worst===null||Math.abs(h-117)<Math.abs(worst-117)))worst=h;
  }
  ok(worst===null,"ни одна пара (энергия, яркость) не даёт зелени"+(worst===null?"":": "+worst.toFixed(1)));
  /* края остались теми же, что были задуманы */
  ok(Math.abs(roadMoodPath(0,0)-265)<1,"тихий глухой трек — фиолетовый: "+roadMoodPath(0,0).toFixed(0));
  ok(Math.abs(roadMoodPath(0,1)-190)<1,"тихий яркий — циан: "+roadMoodPath(0,1).toFixed(0));
  ok(Math.abs(roadMoodPath(1,0)-320)<1,"энергичный глухой — маджента: "+roadMoodPath(1,0).toFixed(0));
  ok(Math.abs(roadMoodPath(1,1)-40)<1,"энергичный яркий — янтарь: "+roadMoodPath(1,1).toFixed(0));
  /* небо разведено по кругу, а не сдвинуто на соседний оттенок */
  const spread=Math.max(...ROAD_SKY_H)-Math.min(...ROAD_SKY_H);
  ok(spread>200,"три туманности разведены по кругу: размах "+spread+"°");
  /* плюмажи нижней кромки: соседи разведены по кругу, а не по соседнему оттенку */
  eq(ROAD_BLOOM_H.length,5,"кромку держат пять плюмажей");
  eq(ROAD_BLOOM_H[2],0,"середина — сам тон настроения");
  let near=0;
  for(let i=1;i<ROAD_BLOOM_H.length;i++){
    const d=Math.abs(((ROAD_BLOOM_H[i]-ROAD_BLOOM_H[i-1]+540)%360)-180);
    if(d<50)near++;
  }
  eq(near,0,"соседние плюмажи не одного семейства");
}));

TEST_SUITES.push(()=>suite("дорога: шкала хода взята от настоящих скоростей, звук игры молчит",()=>{
  resetWorld();
  /* город даёт больше половины шкалы: прежде делили на 120 км/ч, и на 35 км/ч
     выходило 0.29 — хвост звезды в три пикселя, «звёзды мигают, а не летишь» */
  ok(roadFast(35,1)>.5,"35 км/ч — больше половины шкалы: "+roadFast(35,1).toFixed(2));
  eq(roadFast(0,1),0,"стоим — ноль");
  eq(roadFast(600,1),1,"выше потолка не бывает");
  ok(roadFast(250,2)<roadFast(250,1),"на экспрессе та же скорость читается медленнее");
  ok(roadFast(850,3)>.9,"самолёт — почти полная шкала: "+roadFast(850,3).toFixed(2));
  /* режим-компаньон не звучит: игровой звук глушится и возвращается */
  G.opts.audio={music:.6,sfx:.6,engine:.4,on:true};
  ok(audioOn(),"до дороги звук игры включён");
  audioHush(true);
  ok(!audioOn(),"в дороге игровой звук молчит — он прорывался в музыку машины");
  audioHush(false);
  ok(audioOn(),"на выходе возвращается, настройка игрока не тронута");
  ok(G.opts.audio.on===true,"и сама настройка осталась как была");
}));

TEST_SUITES.push(()=>suite("дорога: три полосы звука разведены по делу",()=>{
  resetWorld();
  const w=new Array(28).fill(0);
  for(let i=0;i<6;i++)w[i]=1;                      /* один бас */
  let b=roadBands(w);
  ok(b.bass>.99&&b.mid<.01&&b.tre<.01,"чистый низ слышен только басом: "+b.bass.toFixed(2)+"/"+b.mid.toFixed(2)+"/"+b.tre.toFixed(2));
  w.fill(0);for(let i=17;i<28;i++)w[i]=1;          /* один верх */
  b=roadBands(w);
  ok(b.tre>.99&&b.bass<.01,"чистый верх — только верхом: "+b.tre.toFixed(2));
  w.fill(.5);
  b=roadBands(w);
  ok(Math.abs(b.bass-.5)<.01&&Math.abs(b.mid-.5)<.01&&Math.abs(b.tre-.5)<.01,"ровный спектр — ровные полосы");
  eq(roadBands(null).bass,0,"без волны полосы нулевые, а не NaN");
  ok(ROAD_BAND[3]===28,"полосы покрывают всю волну");
}));

TEST_SUITES.push(()=>suite("дорога: платят за то, что делаешь — повороты и обратный курс",()=>{
  resetWorld();
  G.road=null;G.credits=600;
  RD={crFrac:0,moveT:0,back:0,turn:0,turnPk:0};
  /* ставка поднята: пять километров до дома — уже не десятка */
  const c0=G.credits;
  roadEarnKm(5,0);
  eq(G.credits-c0,30,"5 км по 6 кр — 30 кр, а не 10");
  /* обратный курс — полуторный */
  RD.back=1;
  const c1=G.credits;
  roadEarnKm(5,0);
  eq(G.credits-c1,45,"те же 5 км домой — 45 кр");
  RD.back=0;
  /* премия за поворот: по пику, один раз за дугу */
  eq(roadTurnPay(1,1),ROAD_TURN_CR,"полный снос на комбо ×1 — "+ROAD_TURN_CR+" кр");
  eq(roadTurnPay(.5,2),Math.round(ROAD_TURN_CR),"половинный на ×2 — столько же");
  eq(roadTurnPay(0,3),0,"нет поворота — нет премии");
  const c2=G.credits;
  RD.turn=.8;eq(roadTurnTick(50),0,"пока крутит — не платим");
  RD.turn=.9;eq(roadTurnTick(50),0,"и на пике тоже");
  RD.turn=.05;
  const paid=roadTurnTick(50);
  ok(paid>0,"вышли из поворота — заплатили: "+paid);
  eq(G.credits-c2,paid,"и деньги дошли до кошелька");
  eq(roadTurnTick(50),0,"второй раз за ту же дугу не платят");
  /* во дворе не платят: повороты есть, езды нет */
  RD.turn=.9;roadTurnTick(3);RD.turn=.05;
  eq(roadTurnTick(3),0,"ниже ворот по скорости поворот не оплачивается");
  /* мелкое подруливание ниже порога — не поворот */
  RD.turn=ROAD_TURN_PAY*.9;roadTurnTick(50);RD.turn=0;
  eq(roadTurnTick(50),0,"подруливание не считается поворотом");
  /* обратный курс: отъехали и вернулись */
  ok(!roadHomeward(.3,.05),"близко от дома курса ещё нет");
  ok(!roadHomeward(2,1.9),"отъехали далеко, но ещё не повернули");
  ok(roadHomeward(2,1.5),"пошли обратно — курс домой");
  const A={latitude:55.0,longitude:37.0},B={latitude:55.0,longitude:37.02};
  ok(Math.abs(roadHav(A,B)-1.28)<.05,"гаверсинус считает километры: "+roadHav(A,B).toFixed(2));
  eq(roadHav(A,A),0,"до себя — ноль");
  RD=null;G.road=null;
}));

TEST_SUITES.push(()=>suite("дорога: поездка и сутки — разные числа, и оба видны",()=>{
  resetWorld();
  document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"));
  G.road=null;G.credits=600;G.record=null;
  /* первая поездка дня */
  roadOpen();
  roadEarnKm(2,0);
  eq(RD.crTrip,2*ROAD_CR_KM,"за поездку начислено по ставке");
  ok(Math.abs(RD.kmTrip-2)<1e-9,"и километры поездки свои");
  eq(roadAll().cr,RD.crTrip,"первая поездка дня: сутки равны поездке");
  roadClose();
  const dayCr=roadAll().cr;
  /* вторая поездка того же дня начинает с нуля, а сутки продолжают */
  roadOpen();
  eq(RD.crTrip,0,"новая поездка — новый счёт");
  eq(RD.kmTrip,0,"и километры с нуля");
  eq(roadAll().cr,dayCr,"а сутки помнят прошлую поездку");
  roadEarnKm(1,0);
  eq(RD.crTrip,ROAD_CR_KM,"поездка считает только своё");
  eq(roadAll().cr,dayCr+ROAD_CR_KM,"сутки складывают обе");
  roadClose();
  /* в журнале — поездка, и сутки рядом, раз они больше */
  const e=recordAll().e.filter(x=>x.a==="дорога");
  ok(e.length>=2,"каждая поездка оставляет свою строку: "+e.length);
  ok(/за сутки/.test(e[e.length-1].s),"во второй строке видны и сутки: "+e[e.length-1].s);
  G.road=null;
}));

TEST_SUITES.push(()=>suite("дорога: не потолок, а запас — будни копят, дача тратит",()=>{
  resetWorld();
  G.road=null;
  /* приток: сутки дают ровно суточную норму, и не больше потолка бака */
  ok(Math.abs(roadBankAdd(0,86400000)-ROAD_DAY_ADD)<1e-6,"за сутки натекает "+ROAD_DAY_ADD);
  ok(Math.abs(roadBankAdd(0,43200000)-ROAD_DAY_ADD/2)<1e-6,"за полсуток — половина: приток непрерывный");
  eq(roadBankAdd(ROAD_BANK_MAX,86400000*10),ROAD_BANK_MAX,"выше потолка бак не растёт");
  eq(roadBankAdd(500,-86400000),500,"часы назад — приток не начисляется");
  eq(roadBankAdd(0,0),0,"без времени нет притока");
  /* старому сохранению наливаем полный бак: оно его ни разу не тратило */
  G.road={day:-1,km:0,cr:0};
  const R=roadDayReset(1000);
  eq(R.bank,ROAD_BANK_MAX,"старое сохранение получает полный бак");
  /* бак живёт по календарю, а не по игровым суткам */
  R.bank=100;R.bts=0;
  roadDayReset(86400000);
  ok(Math.abs(roadAll().bank-(100+ROAD_DAY_ADD))<1,"сутки простоя — плюс суточная норма: "+roadAll().bank.toFixed(0));
  /* колебания: неделя буден копит на дачу */
  G.road={day:-1,km:0,cr:0,bank:0,bts:0};
  let t=0;
  for(let d=0;d<5;d++){                       /* пять будних дней по две дороги */
    t+=86400000;roadDayReset(t);
    RD={crFrac:0,crTrip:0,kmTrip:0};
    roadEarnKm(10,600);roadEarnKm(10,600);    /* туда и обратно, по десять км */
    RD=null;
  }
  const saved=roadAll().bank;
  ok(saved>6000,"за рабочую неделю бак накопился: "+Math.round(saved));
  RD={crFrac:0,crTrip:0,kmTrip:0};
  const c0=G.credits;
  roadEarnKm(300,ROAD_COMBO_T);               /* дача: три сотни километров */
  ok(G.credits-c0>4000,"дача оплачена из накопленного: +"+(G.credits-c0));
  ok(roadAll().bank<saved,"и бак на это потрачен");
  RD=null;G.road=null;
}));

TEST_SUITES.push(()=>suite("дорога: прогрессия — кто больше наездил, больше зарабатывает",()=>{
  resetWorld();
  G.road=null;
  /* ранги идут по НАСТОЯЩЕМУ пробегу за всё время */
  eq(roadRank(0).ru,"НОВИЧОК","с нуля — новичок");
  eq(roadRank(0).k,1,"и без надбавки");
  eq(roadRank(99).ru,"НОВИЧОК","до порога ранг не меняется");
  eq(roadRank(100).ru,"ПОПУТЧИК","ровно на пороге — уже следующий");
  eq(roadRank(1000).ru,"ХОДОК","тысяча километров — ходок");
  eq(roadRank(1e9).ru,"ВЕТЕРАН","выше последнего ранга нет");
  eq(roadRank(1e9).next,null,"и дальше идти некуда");
  eq(roadRank(1e9).left,0,"остаток на вершине — ноль");
  ok(roadRank(200).left===100,"до следующего считается честно: "+roadRank(200).left);
  /* множители растут и нигде не падают */
  let prev=0;
  for(const r of ROAD_RANKS){ok(r[2]>=prev,"множитель не падает на «"+r[1]+"»");prev=r[2];}
  ok(roadRank(1e9).k<=2.5,"и сверху ограничен: ×"+roadRank(1e9).k);
  /* ранг множит заработок */
  G.road={day:-1,km:0,cr:0,total:0,bank:99999,bts:0};
  RD={crFrac:0,crTrip:0,kmTrip:0};
  const c0=G.credits;roadEarnKm(1,0);
  const novice=G.credits-c0;
  G.road.total=30000;G.road.bank=99999;
  RD.crFrac=0;
  const c1=G.credits;roadEarnKm(1,0);
  ok(G.credits-c1>novice,"ветеран за тот же километр получает больше: "+(G.credits-c1)+" против "+novice);
  /* и объём бака: ранг растит и запас, иначе он кончался бы вдвое быстрее */
  ok(roadBankAdd(0,86400000*99,2.5)>roadBankAdd(0,86400000*99,1),"бак ветерана больше");
  eq(roadBankAdd(0,86400000*99,2.5),ROAD_BANK_MAX*2.5,"и его потолок тоже по рангу");
  /* переход ранга отмечается в книжке */
  G.road={day:-1,km:0,cr:0,total:99,bank:99999,bts:0};
  G.record=null;RD.crFrac=0;
  roadEarnKm(2,0);
  ok(recordAll().e.some(x=>x.a==="дорога"&&/ПОПУТЧИК/.test(x.s)),"новый ранг попал в книжку");
  ok(/ПОПУТЧИК/.test(RD.flash||""),"и объявлен на экране: "+RD.flash);
  RD=null;G.road=null;
}));
