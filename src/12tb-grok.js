/* ══════════════ Грохотун: единственный, кто работает не за деньги ══════════════
   Громкий, многорукий, всегда рад вас видеть и совершенно не умеет молчать. Он
   копает площадки «Долгого Хода» за жизнь, знает, ЧТО такое обелиск, и ничего
   не знает о том, кто его поставил. Это два разных знания, и второго у него нет.

   ЧЕМ ЭТО НЕ ЯВЛЯЕТСЯ. Он не наёмник и не управляющий: в экипаж не входит, места
   в штабе не занимает, корабля не просит. Правило четырёх кресел не шевелится.
   Он — РЕЙС: отдал площадку с карты, улетел, вернулся к результату. Механика та
   же, что у наёмничьего рейса (12a-crew), но своя и отдельная, потому что человек
   в списке экипажа — это уже пятое кресло.

   ПРАВИЛА ФАЙЛА:
   1. Кредитов он не берёт и не отдаёт. Плата — товар, и её много: это
      единственная в игре линия снабжения, заведённая ради человека, а не ради
      прибыли. Правило «памятник — не банкомат» с обратной стороны.
   2. У копки есть цена, и платит её не только трюм. Копают громко: система, куда
      его послали, поднимается на ступень занятости (13b-occupy). Послать его
      куда-то — решение, а не бесплатное поручение.
   3. Он треплется. Вернувшись, он рассказывает за столиками, где вы были, — и
      это один из способов, которыми на вас выходит охотник (12o-hunter).
   4. Он же — учитель, ровно один раз: первый кусок, которым игрок не может
      воспользоваться, объясняет он. Объясняет, а не решает: слово от этого не
      появляется в словаре.
   5. Считается лениво, по прошедшему времени, с потолком офлайна — как рейсы. */

const GROK_NAME="Грохотун";
const GROK_CAP=24*3600*1000;
const GROK_MIN=18*60000, GROK_MAX=31*60000;    // сколько идёт копка
const GROK_LIKE=["organics","carbon","ice","volatiles"];
const GROK_DIRT=["silicon","iron","titan"];    // что он выносит из отвала

function grokRec(){
  if(!G.grok||typeof G.grok!=="object")
    G.grok={want:null,state:"idle",sx:0,sy:0,due:0,took:0,taught:0,dug:{}};
  if(!G.grok.dug)G.grok.dug={};
  /* ест он одно и то же всегда: линия снабжения — это когда возят ОДНО, а не
     когда у каждого прохождения своя прихоть */
  if(!G.grok.want)G.grok.want=GROK_LIKE[hashi(0x6D0C,1,3)%GROK_LIKE.length];
  return G.grok;
}
/* что он ест — см. `grokRec` */
function grokWant(){
  const R=grokRec();
  return R.want;
}
/* ── сколько ──
   Много. И с каждой копкой больше: он не наглеет, он просто ест столько,
   сколько ест, а копает всё дальше от дома. */
function grokPrice(){
  const R=grokRec();
  return 120+25*Math.min(6,R.took|0);
}
/* ── площадки ──
   Это ваш слой карты и ничей больше: адреса, названные кусками отчёта (12q), и
   точки их съёмки (12w). Копать наугад он не станет — «там ничего нет» он
   говорит первым. */
function grokSites(){
  const R=grokRec(),out=[],seen={};
  const add=(sx,sy,why)=>{
    const k=sx+","+sy;
    if(seen[k]||R.dug[k])return;
    if(typeof starAt==="function"&&!starAt(sx,sy))return;
    seen[k]=1;out.push({sx,sy,why});
  };
  if(typeof loreMarks==="function")for(const m of loreMarks())add(m.sx|0,m.sy|0,"адрес из отчёта");
  if(typeof surveyList==="function")for(const p of surveyList())add(p.sx|0,p.sy|0,"их съёмка");
  return out;
}
function grokBusy(){const R=grokRec();return R.state==="out";}
function grokLeftMs(){
  const R=grokRec();
  if(R.state!=="out")return 0;
  return Math.max(0,R.due-Date.now());
}
/* ── ход ── лениво: копка кончается сама, пока игрока нет рядом */
function grokTick(){
  const R=grokRec();
  if(R.state==="out"&&Date.now()>=R.due)R.state="back";
  return R;
}
/* ── отправить ──
   Плата вперёд и товаром. Место — из своего слоя карты. */
function grokSend(sx,sy){
  const R=grokTick();
  if(R.state!=="idle")return false;
  const k=grokWant(), price=grokPrice();
  if((G.cargo[k]|0)<price)return false;
  G.cargo[k]-=price;
  R.state="out";R.sx=sx|0;R.sy=sy|0;
  R.due=Date.now()+GROK_MIN+Math.floor(rng(hashi(sx,sy,Date.now()&0xffff))()*(GROK_MAX-GROK_MIN));
  logAdd("",GROK_NAME+" ушёл копать: сектор "+R.sx+":"+R.sy+" · съел "+
    RES[k].ru.toLowerCase()+" ×"+price);
  say(GROK_NAME+" УШЁЛ КОПАТЬ\nсектор "+R.sx+":"+R.sy+
    "\nвернётся сам · копают долго");
  if(typeof saveGame==="function")saveGame(true);
  return true;
}
/* ── забрать результат ──
   Кусок отчёта с площадки, отвал в трюм — и две расплаты: занятость там, где
   копали, и его язык здесь. */
function grokTake(){
  const R=grokTick();
  if(R.state!=="back")return null;
  const sx=R.sx,sy=R.sy;
  R.state="idle";R.took=(R.took|0)+1;R.dug[sx+","+sy]=1;
  const r=rng(hashi(sx,sy,0x6D16));
  /* отвал: не награда, а то, что осталось от чужой работы */
  const kind=GROK_DIRT[Math.floor(r()*GROK_DIRT.length)];
  const n=6+Math.floor(r()*13);
  const got=Math.max(0,(typeof addRes==="function"?addRes(kind,n):0)|0);
  /* кусок отчёта: площадка — место свидетеля, как зарубка и как лента */
  const L=(typeof loreTake==="function")?loreTake("grok:"+sx+":"+sy):null;
  /* правило 2: копают громко */
  if(typeof occSet==="function"&&typeof occLvl==="function"){
    const was=occLvl(sx,sy);
    occSet(sx,sy,was+1);
    logAdd("warn","В секторе "+sx+":"+sy+" стало шумно: копка слышна далеко");
  }
  /* правило 3: и он треплется — про то, где были ВЫ */
  let told=0;
  if(r()<.5&&typeof huntMark==="function"){
    huntMark({sx:G.sx,sy:G.sy},"болтовню "+GROK_NAME.toLowerCase()+"а");
    told=1;
  }
  tell(L?"tech":"good",GROK_NAME+" вернулся с площадки "+sx+":"+sy,
    GROK_NAME+" ВЕРНУЛСЯ\nсектор "+sx+":"+sy+
    (got>0?("\nотвал: "+RES[kind].ru+" ×"+got):"\nотвал ссыпать некуда — трюм полон")+
    (L?"\n\nи вынес кусок отчёта":"\n\nкуска здесь не было — площадка пустая")+
    "\n\nтам теперь шумно"+(told?"\nи он уже рассказывает про вас за столиками":""));
  if(typeof saveGame==="function")saveGame(true);
  return {sx,sy,kind,got,lore:L,told};
}
/* ── учитель, один раз ──
   Первый кусок, которым игрок не может воспользоваться, объясняет он. Именно
   объясняет: слово в словаре от этого не появляется, появляется понимание, что
   слова вообще берутся у свидетелей. */
function grokCanTeach(){
  const R=grokRec();
  if(R.taught)return false;
  if(typeof heardAll==="function"&&heardAll().some(h=>h&&h.kind==="pidgin"&&!h.read))return true;
  if(typeof loreList==="function"&&typeof loreVocab==="function")
    return loreList().length>0&&loreVocab().length===0;
  return false;
}
function grokTeach(){
  const R=grokRec();
  if(R.taught||!grokCanTeach())return false;
  R.taught=1;
  tell("tech",GROK_NAME+" объясняет глифы — один раз",
    GROK_NAME+" СМЕЁТСЯ\n\n«Это не узор, это речь. Их речь. Я под неё копаю "+
    "двадцать лет и знаю четыре слова, и все четыре — про воду.\n\n"+
    "Слова не выдают. Слова СЛЫШАТ: у зарубки, у птицы, у ленты. Набери свидетелей "+
    "— и то, что лежит у тебя непрочитанным, прочтётся само.»\n\n"+
    "Больше он этого не повторит: он и так сказал больше, чем собирался.");
  logAdd("tech",GROK_NAME+" объяснил, откуда берутся слова");
  if(typeof saveGame==="function")saveGame(true);
  return true;
}
/* ── строка о состоянии ── */
function grokLine(){
  const R=grokTick();
  if(R.state==="out"){
    const m=Math.ceil(grokLeftMs()/60000);
    return "КОПАЕТ · СЕКТОР "+R.sx+":"+R.sy+" · ЕЩЁ ОКОЛО "+m+" МИН";
  }
  if(R.state==="back")return "ВЕРНУЛСЯ С ПЛОЩАДКИ "+R.sx+":"+R.sy+" · ЖДЁТ, КОГДА ВЫ СПРОСИТЕ";
  return "СВОБОДЕН · БЕРЁТ "+RES[grokWant()].ru.toUpperCase()+" ×"+grokPrice()+" ЗА ПЛОЩАДКУ";
}
/* ── как он выглядит ──
   Не человек и не зверь: широкий, приземистый, четыре руки — две рабочие внизу,
   две мелкие у груди, — и лицо, состоящее в основном из улыбки. Пыль на нём
   лежит слоями: он в ней живёт. Рисуется как портрет управляющего (12d), тем же
   способом и в тот же размер, чтобы в кантине он стоял в одном ряду с людьми. */
function grokFace(size){
  const S=size||64,cn=document.createElement("canvas");
  cn.width=S;cn.height=S;
  const c=cn.getContext("2d");
  const u=S/64;
  const hide=[124,118,88], hideD=[68,66,48], hideL=[168,160,118];
  const rgb=a=>"rgb("+a.map(v=>Math.round(v)).join(",")+")";
  c.fillStyle="#171b16";c.fillRect(0,0,S,S);
  /* пыль в воздухе: он её приносит с собой и не замечает */
  const g0=c.createRadialGradient(S*.5,S*.62,2,S*.5,S*.62,S*.6);
  g0.addColorStop(0,"rgba(196,168,120,.18)");g0.addColorStop(1,"rgba(196,168,120,0)");
  c.fillStyle=g0;c.fillRect(0,0,S,S);
  /* ── руки ── две рабочие внизу и две мелкие у груди. Первый заход рисовал их
     четырьмя отдельными сосисками: без плеча рука не растёт из тела, а лежит
     рядом с ним. Плечо — комок в основании, кисть — широкая лопата. */
  const arm=(pts,w,col)=>{
    c.strokeStyle=col;c.lineWidth=w;c.lineCap="round";c.lineJoin="round";
    c.beginPath();c.moveTo(pts[0],pts[1]);
    for(let i=2;i<pts.length;i+=2)c.lineTo(pts[i],pts[i+1]);
    c.stroke();
    c.fillStyle=col;
    c.beginPath();c.arc(pts[0],pts[1],w*.62,0,TAU);c.fill();   // плечо
  };
  /* второй заход: прямая рука уходила под корпус, и от неё оставался один локоть.
     Ломаем её в локте наружу — предплечье целиком идёт вне силуэта тела. */
  const armPath=k=>[S*(.5+k*.20),S*.645, S*(.5+k*.455),S*.775, S*(.5+k*.395),S*.915];
  c.strokeStyle="rgba(22,20,14,.55)";c.lineCap="round";c.lineJoin="round";
  for(const k of[-1,1]){const a=armPath(k);c.lineWidth=8.9*u;
    c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(a[2],a[3]);c.lineTo(a[4],a[5]);c.stroke();}
  for(const k of[-1,1])arm(armPath(k),7.4*u,rgb(hideD));
  c.fillStyle=rgb(hideD);                                      // кисти-лопаты
  c.beginPath();c.ellipse(S*.105,S*.938,S*.082,S*.052,-.36,0,TAU);c.fill();
  c.beginPath();c.ellipse(S*.895,S*.938,S*.082,S*.052,.36,0,TAU);c.fill();
  c.fillStyle="rgba(255,246,214,.10)";                         // блик по верху лопаты
  c.beginPath();c.ellipse(S*.10,S*.922,S*.055,S*.017,-.36,0,TAU);c.fill();
  c.beginPath();c.ellipse(S*.90,S*.922,S*.055,S*.017,.36,0,TAU);c.fill();
  /* ── корпус ── трапеция вниз: он приземистый, а не долговязый */
  c.fillStyle=rgb(hide);
  c.beginPath();
  c.moveTo(S*.20,S*1.02);c.lineTo(S*.29,S*.57);c.lineTo(S*.71,S*.57);c.lineTo(S*.80,S*1.02);
  c.closePath();c.fill();
  const bg=c.createLinearGradient(S*.2,0,S*.8,0);              // свет слева
  bg.addColorStop(0,"rgba(255,246,214,.16)");bg.addColorStop(.55,"rgba(255,255,255,0)");
  bg.addColorStop(1,"rgba(0,0,0,.28)");
  c.fillStyle=bg;
  c.beginPath();
  c.moveTo(S*.20,S*1.02);c.lineTo(S*.29,S*.57);c.lineTo(S*.71,S*.57);c.lineTo(S*.80,S*1.02);
  c.closePath();c.fill();
  /* шкура не однотонная: пыль стекает по ней полосами, низ протёрт, и на боках
     старые задиры — на плоском хаки не видно ни объёма, ни того, что он работает */
  c.save();
  c.beginPath();
  c.moveTo(S*.20,S*1.02);c.lineTo(S*.29,S*.57);c.lineTo(S*.71,S*.57);c.lineTo(S*.80,S*1.02);
  c.closePath();c.clip();
  /* полосы должны читаться пылью, а не тельняшкой: неровный шаг, разная длина,
     слабый контраст и мягкий верхний край — они начинаются не от плеча */
  for(let i=0;i<9;i++){
    const t=(i*.1123+.07)%1, x=S*(.29+t*.42), w=S*(.008+((i*7)%5)*.006),
          dx=(t-.5)*S*.10, y0=S*(.60+((i*3)%4)*.05), yb=S*(.80+((i*5)%6)*.04);
    if(yb<=y0)continue;
    const gs=c.createLinearGradient(0,y0,0,yb);
    gs.addColorStop(0,"rgba(40,36,26,0)");
    gs.addColorStop(.35,i%3?"rgba(40,36,26,.13)":"rgba(196,178,136,.10)");
    gs.addColorStop(1,"rgba(40,36,26,0)");
    c.fillStyle=gs;
    c.beginPath();
    c.moveTo(x,y0);c.lineTo(x+w,y0);c.lineTo(x+w+dx,yb);c.lineTo(x+dx,yb);
    c.closePath();c.fill();
  }
  c.fillStyle="rgba(196,176,132,.26)";                         // потёртость по низу
  c.beginPath();c.ellipse(S*.5,S*1.03,S*.30,S*.085,0,0,TAU);c.fill();
  c.fillStyle="rgba(28,26,18,.30)";                            // пара старых задиров
  c.beginPath();c.ellipse(S*.39,S*.755,S*.036,S*.011,.45,0,TAU);c.fill();
  c.beginPath();c.ellipse(S*.63,S*.665,S*.026,S*.009,-.40,0,TAU);c.fill();
  c.restore();
  /* плечевая линия (хвост M120): там, где из корпуса выходят рабочие руки,
     складка шкуры — тёмная дуга и светлый валик над ней. Без неё рука
     начиналась из плоской трапеции */
  for(const k of[-1,1]){
    const ax=S*(.5+k*.20), ay=S*.645;
    c.strokeStyle="rgba(40,36,26,.55)";c.lineWidth=2.2*u;c.lineCap="round";
    c.beginPath();c.arc(ax,ay-S*.02,S*.075,k<0?Math.PI*.55:Math.PI*.05,k<0?Math.PI*.95:Math.PI*.45);c.stroke();
    c.strokeStyle="rgba(255,246,214,.16)";c.lineWidth=1.4*u;
    c.beginPath();c.arc(ax,ay-S*.035,S*.075,k<0?Math.PI*.6:Math.PI*.1,k<0?Math.PI*.9:Math.PI*.4);c.stroke();
  }
  /* ремень через плечо и коробка на нём: он рабочий, а не зверь в кадре */
  c.strokeStyle="rgba(38,34,24,.85)";c.lineWidth=4.4*u;
  c.beginPath();c.moveTo(S*.34,S*.60);c.lineTo(S*.66,S*.98);c.stroke();
  c.fillStyle="rgba(58,52,36,.95)";c.fillRect(S*.60,S*.80,S*.13,S*.11);
  c.strokeStyle="rgba(226,236,240,.22)";c.lineWidth=1;
  c.strokeRect(S*.60+.5,S*.80+.5,S*.13,S*.11);
  /* коробка пристёгнута (хвост M120): лямка поверх неё от ремня и пряжка —
     иначе она висела на боку сама по себе */
  c.strokeStyle="rgba(38,34,24,.9)";c.lineWidth=1.8*u;
  c.beginPath();c.moveTo(S*.585,S*.835);c.lineTo(S*.745,S*.855);c.stroke();
  c.fillStyle="rgba(196,176,132,.8)";c.fillRect(S*.655,S*.828,S*.022,S*.02);
  /* мелкие руки у груди — они всегда чем-то заняты */
  /* они прижаты к груди и чем-то заняты: короткие, с локтем, и не сходятся
     крестом в середине — крест поверх ремня читался как связанные руки */
  const small=[[S*.375,S*.655,S*.325,S*.755,S*.415,S*.805],
               [S*.625,S*.655,S*.675,S*.745,S*.585,S*.795]];
  c.strokeStyle="rgba(22,20,14,.5)";c.lineCap="round";c.lineJoin="round";
  for(const a of small){c.lineWidth=4.8*u;
    c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(a[2],a[3]);c.lineTo(a[4],a[5]);c.stroke();}
  for(const a of small)arm(a,4.0*u,rgb(hideD));                // тон корпуса их съедал
  /* светлый кант по предплечью (хвост M120): на 64 px две тёмные руки на
     тёмной груди читались пятном, кант отделяет их от корпуса */
  c.strokeStyle="rgba(255,246,214,.20)";c.lineWidth=1.2*u;c.lineCap="round";
  for(const a of small){c.beginPath();c.moveTo(a[2],a[3]);c.lineTo(a[4],a[5]);c.stroke();}
  c.fillStyle=rgb(hideL);                                      // мелкие кисти
  c.beginPath();c.ellipse(S*.415,S*.807,3.0*u,2.2*u,.4,0,TAU);c.fill();
  c.beginPath();c.ellipse(S*.585,S*.797,3.0*u,2.2*u,-.4,0,TAU);c.fill();
  /* ── голова ── широкая, без шеи, посажена прямо на плечи */
  const hx=S*.5,hy=S*.38,hw=S*.31,hh=S*.25;
  c.fillStyle=rgb(hide);
  c.beginPath();c.ellipse(hx,hy,hw,hh,0,0,TAU);c.fill();
  /* объём: свет слева сверху, тень справа снизу. Плоский овал читался маской */
  c.save();
  c.beginPath();c.ellipse(hx,hy,hw,hh,0,0,TAU);c.clip();
  const hg=c.createLinearGradient(hx-hw,hy-hh,hx+hw,hy+hh);
  hg.addColorStop(0,"rgba(255,248,220,.22)");hg.addColorStop(.5,"rgba(255,255,255,0)");
  hg.addColorStop(1,"rgba(0,0,0,.34)");
  c.fillStyle=hg;c.fillRect(hx-hw,hy-hh,hw*2,hh*2);
  /* пыль лежит НА черепе, а не парит над ним: полоса по верхней кромке */
  c.fillStyle="rgba(206,186,140,.42)";
  c.beginPath();c.ellipse(hx,hy-hh*.92,hw*.92,hh*.30,0,0,TAU);c.fill();
  c.restore();
  /* надбровье: одна складка над тремя глазами — она и делает морду мордой */
  c.strokeStyle="rgba(46,42,30,.7)";c.lineWidth=1.8*u;
  c.beginPath();c.moveTo(hx-hw*.78,hy-hh*.30);c.lineTo(hx,hy-hh*.46);
  c.lineTo(hx+hw*.78,hy-hh*.30);c.stroke();
  /* три глаза в ряд: чужой — это про счёт, а не про цвет */
  /* Первый заход ставил три одинаковых пятна вплотную: на 64 пк они сливались в одну
     тёмную полосу. Разводим шире, средний крупнее и выше, между ними — светлые
     перемычки шкуры: три глаза читаются тем, что их разделяет. */
  c.fillStyle=rgb(hideL);
  for(const k of[-1,1]){
    c.beginPath();c.ellipse(hx+k*S*.083,hy-S*.014,S*.015,S*.042,k*.22,0,TAU);c.fill();
  }
  for(let i=0;i<3;i++){
    const mid=i===1, ex=hx+(i-1)*S*.163, ey=hy-S*(mid?.028:.008),
          rx=S*(mid?.054:.042), ry=S*(mid?.065:.050);
    c.fillStyle="rgba(50,44,30,.55)";                          // глазница
    c.beginPath();c.ellipse(ex,ey+S*.006,rx*1.32,ry*1.24,0,0,TAU);c.fill();
    c.fillStyle="#0b0e0c";
    c.beginPath();c.ellipse(ex,ey,rx,ry,0,0,TAU);c.fill();
    c.strokeStyle="rgba(178,168,126,.55)";c.lineWidth=1.1*u;   // светлый ободок
    c.beginPath();c.ellipse(ex,ey,rx,ry,0,0,TAU);c.stroke();
    c.fillStyle="rgba(246,220,148,.95)";
    c.beginPath();c.arc(ex+rx*.30,ey-ry*.34,S*(mid?.019:.015),0,TAU);c.fill();
  }
  /* ── улыбка ── сама пасть, а не дуга с наклейкой зубов под ней: тёмный
     полумесяц, и зубы стоят ВНУТРИ него, по его же кривой */
  const my=hy+hh*.30, mw=hw*.72;
  c.fillStyle="#0d100e";
  c.beginPath();
  c.moveTo(hx-mw,my-S*.014);
  c.quadraticCurveTo(hx,my+S*.115,hx+mw,my-S*.014);
  c.quadraticCurveTo(hx,my+S*.028,hx-mw,my-S*.014);
  c.closePath();c.fill();
  c.save();
  c.beginPath();
  c.moveTo(hx-mw,my-S*.014);
  c.quadraticCurveTo(hx,my+S*.115,hx+mw,my-S*.014);
  c.quadraticCurveTo(hx,my+S*.028,hx-mw,my-S*.014);
  c.closePath();c.clip();
  c.fillStyle="#cfc9ab";                                   // зубы: крупные, редкие
  for(let i=0;i<6;i++)c.fillRect(hx-mw*.92+i*mw*.31,my-S*.02,mw*.21,S*.08);
  c.restore();
  /* пыль на плечах — слоями, как на всём остальном */
  c.fillStyle="rgba(206,186,140,.42)";
  c.fillRect(S*.29,S*.565,S*.42,S*.018);
  return cn;
}
